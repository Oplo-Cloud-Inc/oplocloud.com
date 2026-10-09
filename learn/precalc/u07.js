/* ==========================================================================
   Precalculus — Unit 7: Trigonometric Identities and Equations. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 7: the fundamental identities,
   simplifying and verifying, the sum and difference formulas, the double-angle,
   power-reducing and half-angle formulas, sum-to-product and product-to-sum,
   solving trigonometric equations and modeling with them. Each section is split
   into lessons small enough to finish in one sitting; each teaches one method:
   the idea, an example to watch, one done together, then on your own, a harder
   case, find the error, use it, and the concept built at the end.

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
    blurb: "Before Chapter 7 · The Pythagorean identity, tangent as a ratio, exact values, factoring and solving a product.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · The unit circle", prompt: "For every angle $\\theta$, what is $\\sin^2\\theta + \\cos^2\\theta$?",
        options: [{ t: "$1$" }, { t: "$0$", fb: "The point $(\\cos\\theta, \\sin\\theta)$ is on a circle of radius 1, so its squares add to $1^2$." }, { t: "$2$", fb: "The squares of the two coordinates add to the radius squared, which is 1." }],
        answer: 0, skill: "Unit circle", hints: ["$x^2 + y^2 = 1$ on the unit circle."], why: "$\\sin^2\\theta + \\cos^2\\theta = 1$." },
      { type: "choice", kicker: "Check 2 · Tangent", prompt: "Which is another way to write $\\tan\\theta$?",
        options: [{ t: "$\\dfrac{\\sin\\theta}{\\cos\\theta}$" }, { t: "$\\dfrac{\\cos\\theta}{\\sin\\theta}$", fb: "That is the cotangent." }, { t: "$\\sin\\theta\\cos\\theta$", fb: "Tangent is a **ratio**, not a product." }],
        answer: 0, skill: "Trigonometric ratios", hints: ["Tangent is opposite over adjacent."], why: "$\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$." },
      { type: "choice", kicker: "Check 3 · Exact values", prompt: "What is $\\cos 45^\\circ$?",
        options: [{ t: "$\\dfrac{\\sqrt{2}}{2}$" }, { t: "$\\dfrac{1}{2}$", fb: "That is $\\cos 60^\\circ$." }, { t: "$\\dfrac{\\sqrt{3}}{2}$", fb: "That is $\\cos 30^\\circ$." }],
        answer: 0, skill: "Special angles", hints: ["The 45°-45°-90° triangle."], why: "$\\cos 45^\\circ = \\frac{\\sqrt{2}}{2}$." },
      { type: "choice", kicker: "Check 4 · Factoring", prompt: "Factor $x^2 - 1$.",
        options: [{ t: "$(x - 1)(x + 1)$" }, { t: "$(x - 1)^2$", fb: "Expanding $(x - 1)^2$ gives $x^2 - 2x + 1$." }, { t: "$x(x - 1)$", fb: "That expands to $x^2 - x$." }],
        answer: 0, skill: "Factoring", hints: ["A difference of two squares."], why: "$(x - 1)(x + 1)$." },
      { type: "choice", kicker: "Check 5 · Zero product", prompt: "Solve $(2y - 1)(y + 1) = 0$.",
        options: [{ t: "$y = \\dfrac{1}{2}$ or $y = -1$" }, { t: "$y = 2$ or $y = 1$", fb: "Set each factor to 0: $2y - 1 = 0$ and $y + 1 = 0$." }, { t: "$y = -\\dfrac{1}{2}$ or $y = 1$", fb: "Check the signs: $2y - 1 = 0$ gives $y = +\\frac{1}{2}$." }],
        answer: 0, skill: "Zero product", hints: ["A product is 0 when one factor is 0."], why: "$y = \\frac{1}{2}$ or $y = -1$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 7.1**. If **check 1** slipped, look again at lesson 5.8; if **check 3**, lesson 5.9. If **check 4** or **5** slipped, revisit lesson 3.3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 7 */
  var PI = Math.PI, DEG = PI / 180;
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; };
  var GC7 = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; };
  // An angle in degrees as TeX in radians: radTex(150) is "\\frac{5\\pi}{6}".
  var radTex = function (d) {
    if (d === 0) return "0";
    var g = GC7(d, 180), n = d / g, m = 180 / g, sg = n < 0 ? "-" : "", an = Math.abs(n);
    return sg + (m === 1 ? (an === 1 ? "\\pi" : an + "\\pi") : (an === 1 ? "\\frac{\\pi}{" + m + "}" : "\\frac{" + an + "\\pi}{" + m + "}"));
  };
  // The label for k halves of pi: pilab(3) is "3π/2", pilab(-2) is "−π".
  var pilab = function (k) {
    if (k === 0) return "0";
    var s = k < 0 ? "−" : "", a = Math.abs(k);
    if (a % 2 === 0) { var n = a / 2; return s + (n === 1 ? "π" : n + "π"); }
    return s + (a === 1 ? "π/2" : a + "π/2");
  };
  // Axes for a wave: ticks and faint guide lines at every half pi, and whole numbers up the side.
  function waveAx(x0, x1, y0, y1, o) {
    o = o || {};
    var step = o.step || PI / 2, per = Math.round(step / (PI / 2) * 1000) / 1000, it = [{ seg: [[x0, 0], [x1, 0]], c: "soft" }, { seg: [[0, y0], [0, y1]], c: "soft" }], k, y;
    for (k = Math.ceil(x0 / step - 1e-9); k * step <= x1 + 1e-9; k++) {
      if (k === 0) continue;
      it.push({ seg: [[k * step, y0], [k * step, y1]], c: "soft", dash: true }, { text: o.lab ? o.lab(k) : pilab(Math.round(k * per)), at: [k * step, -0.3 * (o.ty || 1)], c: "soft" });
    }
    for (y = Math.ceil(y0); y <= y1; y++) { if (y === 0) continue; it.push({ seg: [[-0.06, y], [0.06, y]], c: "soft" }, { text: String(y).replace("-", "−"), at: [-0.3, y - 0.1], c: "soft" }); }
    return it;
  }
  var SIN = Math.sin, COS = Math.cos, TAN = Math.tan;
  var SEC = function (x) { return 1 / Math.cos(x); }, CSC = function (x) { return 1 / Math.sin(x); }, COT = function (x) { return 1 / Math.tan(x); };
  // Does the blue candidate lie on top of the orange reference graph? opts: [chip text, function, is it an identity?, TeX].
  // The first option should not match, so the goal is not met before the learner has tried anything.
  function ovl(o) {
    var xr = o.x, yr = o.y, N = o.opts.filter(function (p) { return p[2]; }).length;
    return { type: "sketch", x: xr, y: yr, u: o.u, uy: o.uy, w: o.w || wcap(xr, yr, o.u, o.uy), grid: false, gate: true, pts: {},
      chips: { g: { label: o.label || "Right side", v: "0", opts: o.opts.map(function (p, i) { return ["" + i, p[0]]; }) } },
      track: function (s) { return o.opts[+s.c.g][2] ? "m" + s.c.g : null; },
      draw: function (s) { var p = o.opts[+s.c.g]; return waveAx(xr[0] + 0.2, xr[1] - 0.2, yr[0] + 0.1, yr[1] - 0.1, o.ax).concat(curve(o.ref, xr[0], xr[1], "orange", yr, true), curve(p[1], xr[0], xr[1], "blue", yr)); },
      readout: function (s) { var p = o.opts[+s.c.g], n = Object.keys(s.tracked).length; return "$" + o.refTex + "$ (orange) and $" + p[3] + "$ (blue): " + (p[2] ? "the same graph ✓" : "different graphs") + "<br>Matches found: " + Math.min(n, N) + " of " + N; },
      goal: function (s) { return Object.keys(s.tracked).length >= N; } };
  }

  /* ============================================ 1 · The fundamental identities */
  var HOW_1 = [["Rewrite", "Write every function with sine and cosine."],
               ["Cancel", "Multiply the fractions and cancel what is on top and bottom."],
               ["Name it", "Recognise what is left: $\\frac{1}{\\sin} = \\csc$, $\\frac{\\sin}{\\cos} = \\tan$…"]];
  LESSONS.push({
    title: "The fundamental identities", art: "pcwave",
    blurb: "Book 7.1 · Equations that are true for every angle: reciprocal, quotient and even-odd.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which function is $\\dfrac{1}{\\sin x}$?",
        options: [{ t: "$\\csc x$" }, { t: "$\\sec x$", fb: "Secant is the reciprocal of **cosine**." }, { t: "$\\cot x$", fb: "Cotangent is the reciprocal of **tangent**." }],
        answer: 0, skill: "Reciprocal functions", hints: ["Cosecant goes with sine."], why: "$\\csc x = \\frac{1}{\\sin x}$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dashed graph is $y = \\tan x$. Pick a right side: if its blue graph lands **exactly on top**, the two are equal for every $x$. Find **all three** expressions that equal $\\tan x$.",
        scene: ovl({ ref: TAN, refTex: "\\tan x", x: [-3.4, 3.4], y: [-4, 4], u: 36,
          opts: [["cos x / sin x", function (x) { return COT(x); }, false, "\\frac{\\cos x}{\\sin x}"], ["sin x / cos x", function (x) { return SIN(x) / COS(x); }, true, "\\frac{\\sin x}{\\cos x}"],
                 ["sin x · cos x", function (x) { return SIN(x) * COS(x); }, false, "\\sin x\\cos x"], ["1 / cot x", function (x) { return 1 / COT(x); }, true, "\\frac{1}{\\cot x}"],
                 ["sec x · sin x", function (x) { return SEC(x) * SIN(x); }, true, "\\sec x\\sin x"]] }),
        gate: true, then: "Three match: $\\dfrac{\\sin x}{\\cos x}$, $\\dfrac{1}{\\cot x}$ and $\\sec x\\sin x$. An **identity** is an equation that is true for **every** value where both sides are defined, so the graphs coincide." },
      { type: "learn", kicker: "The idea",
        prompt: "These hold for **every** angle. **Reciprocal:** $\\csc = \\frac{1}{\\sin}$, $\\sec = \\frac{1}{\\cos}$, $\\cot = \\frac{1}{\\tan}$. **Quotient:** $\\tan = \\frac{\\sin}{\\cos}$, $\\cot = \\frac{\\cos}{\\sin}$. **Even or odd:** $\\cos(-x) = \\cos x$ but $\\sin(-x) = -\\sin x$.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Simplify $\\cot\\theta\\sec\\theta$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\cot\\theta = \\frac{\\cos\\theta}{\\sin\\theta}", say: "Quotient identity." },
          { step: 1, m: "\\sec\\theta = \\frac{1}{\\cos\\theta}", say: "Reciprocal identity." },
          { step: 2, m: "\\frac{\\cos\\theta}{\\sin\\theta}\\cdot\\frac{1}{\\cos\\theta}", say: "Multiply the two fractions.", ask: { prompt: "What happens to the $\\cos\\theta$ on top and bottom?", answer: 0, options: [{ t: "They cancel" }, { t: "They add up", fb: "A factor on top and the same factor on the bottom cancels: $\\frac{\\cos\\theta}{\\cos\\theta} = 1$." }] } },
          { step: 2, m: "= \\frac{1}{\\sin\\theta}", say: "What is left." },
          { step: 3, m: "= \\csc\\theta", say: "The reciprocal of sine is cosecant." }] },
        gate: true, then: "$\\cot\\theta\\sec\\theta = \\csc\\theta$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you simplify $\\tan\\theta\\cos\\theta$.",
        how: HOW_1, skill: "Reciprocal and quotient identities",
        steps: [
          { step: 1, ask: "Write $\\tan\\theta$ with sine and cosine.", type: "choice", answer: 0, options: [{ t: "$\\dfrac{\\sin\\theta}{\\cos\\theta}$" }, { t: "$\\dfrac{\\cos\\theta}{\\sin\\theta}$", fb: "That is the cotangent." }], m: "\\frac{\\sin\\theta}{\\cos\\theta}\\cdot\\cos\\theta", say: "Quotient identity." },
          { step: 2, ask: "What happens to the $\\cos\\theta$ on top and bottom?", type: "choice", answer: 0, options: [{ t: "They cancel" }, { t: "They make $\\cos^2\\theta$", fb: "The bottom one divides the top one: they cancel." }], m: "= \\sin\\theta", say: "Cancel." },
          { step: 3, ask: "Check at $\\theta = 30^\\circ$: $\\tan 30^\\circ\\cos 30^\\circ =$ (a decimal is fine)", type: "num", pre: "value =", answer: 0.5, tol: 0.0006, near: [{ v: 0.866, tol: 0.001, fb: "That is $\\cos 30^\\circ$ alone. Multiply $\\tan 30^\\circ \\approx 0.577$ by $0.866$." }], hint: "$0.577 \\times 0.866$.", m: "\\tan30^\\circ\\cos30^\\circ = \\frac{1}{2} = \\sin30^\\circ", say: "It matches $\\sin 30^\\circ$." }],
        why: "Rewrite, cancel, name it." },
      { type: "sort", kicker: "On your own", prompt: "Sort each expression into the single function it equals.",
        bins: ["sin θ", "cos θ", "tan θ"],
        cards: [{ t: "$\\tan\\theta\\cos\\theta$", bin: 0, fb: "$\\frac{\\sin}{\\cos}\\cdot\\cos = \\sin$." }, { t: "$\\dfrac{\\sin\\theta}{\\tan\\theta}$", bin: 1, fb: "$\\sin \\cdot \\frac{\\cos}{\\sin} = \\cos$." }, { t: "$\\sin\\theta\\sec\\theta$", bin: 2, fb: "$\\sin \\cdot \\frac{1}{\\cos} = \\tan$." }, { t: "$\\dfrac{\\cos\\theta}{\\cot\\theta}$", bin: 0, fb: "$\\cos \\cdot \\frac{\\sin}{\\cos} = \\sin$." }, { t: "$\\cot\\theta\\sin\\theta$", bin: 1, fb: "$\\frac{\\cos}{\\sin}\\cdot\\sin = \\cos$." }, { t: "$\\dfrac{\\sec\\theta}{\\csc\\theta}$", bin: 2, fb: "$\\frac{1/\\cos}{1/\\sin} = \\frac{\\sin}{\\cos} = \\tan$." }],
        skill: "Reciprocal and quotient identities", hints: ["Write everything with sine and cosine first."], why: "Rewrite with sine and cosine, then cancel." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Negative angles.** Simplify $\\dfrac{\\sin(-x)}{\\cos(-x)}$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\sin(-x) = -\\sin x", say: "Sine is **odd**: a negative angle flips the sign." },
          { step: 1, m: "\\cos(-x) = \\cos x", say: "Cosine is **even**: the sign makes no difference.", ask: { prompt: "Which of the two keeps its sign for $-x$?", answer: 0, options: [{ t: "Cosine" }, { t: "Sine", fb: "$\\sin(-x) = -\\sin x$: sine flips." }] } },
          { step: 2, m: "\\frac{-\\sin x}{\\cos x}", say: "Put them together." },
          { step: 3, m: "= -\\tan x", say: "Tangent is odd too: $\\tan(-x) = -\\tan x$." }] },
        gate: true, then: "$\\dfrac{\\sin(-x)}{\\cos(-x)} = -\\tan x$." },
      { type: "num", kicker: "Try it", prompt: "If $\\sin\\theta = 0.6$ and $\\cos\\theta = 0.8$, find $\\sec\\theta\\sin\\theta$. (A decimal is fine.)", pre: "value =", answer: 0.75, tol: 0.0006, skill: "Reciprocal and quotient identities",
        near: [{ v: 0.48, fb: "That is $\\sin\\theta\\cos\\theta$. Secant is $\\frac{1}{\\cos\\theta}$, so divide." }, { v: 1.25, fb: "That is $\\sec\\theta$ alone. Multiply by $\\sin\\theta = 0.6$." }], hints: ["$\\sec\\theta\\sin\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$."], why: "$\\frac{0.6}{0.8} = 0.75 = \\tan\\theta$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lena writes $\\cos(-x) = -\\cos x$ \"because the minus sign comes out\". What is wrong?",
        options: [{ t: "Cosine is **even**: $\\cos(-x) = \\cos x$. Only sine and tangent flip." }, { t: "Nothing is wrong.", fb: "Try $x = 60^\\circ$: $\\cos(-60^\\circ) = 0.5$, not $-0.5$." }, { t: "$\\cos(-x) = \\sin x$.", fb: "Try $x = 60^\\circ$: $\\cos(-60^\\circ) = 0.5$ but $\\sin 60^\\circ = 0.866$." }],
        answer: 0, skill: "Even and odd identities", hints: ["Try $x = 60^\\circ$."], why: "Cosine is even." },
      { type: "num", kicker: "Use it", prompt: "Your calculator has no secant key. Find $\\sec 0.7$ (radians). (The box accepts expressions such as 3*sin(0.2).)", pre: "$\\sec 0.7 \\approx$", answer: 1.3075, tol: 0.0006, calc: true, skill: "Reciprocal and quotient identities",
        near: [{ v: 0.7648, tol: 0.0006, fb: "That is $\\cos 0.7$. Secant is its reciprocal: $\\frac{1}{0.7648}$." }], hints: ["$\\sec x = \\frac{1}{\\cos x}$."], why: "$\\frac{1}{\\cos 0.7} \\approx 1.3075$." }
    ]
  });

  /* ============================================ 2 · The Pythagorean identities */
  var HOW_2 = [["Pick one", "Choose the identity that links what you know to what you want."],
               ["Substitute", "Put in the value and solve for the square."],
               ["Sign", "A square root gives $\\pm$: choose the sign from the quadrant."]];
  LESSONS.push({
    title: "The Pythagorean identities", art: "pcwave",
    blurb: "Book 7.1 · $\\sin^2 + \\cos^2 = 1$ and its two cousins: find any function from one value and the quadrant.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A point on the unit circle is $(0.6, y)$ and $y > 0$. What is $y$?", pre: "$y =$", answer: 0.8, tol: 0.0006, skill: "Unit circle",
        near: [{ v: 0.4, fb: "Square first: $0.6^2 = 0.36$, then $y^2 = 1 - 0.36$." }], hints: ["$x^2 + y^2 = 1$."], why: "$y = \\sqrt{1 - 0.36} = 0.8$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the angle round the circle. The blue leg is the cosine and the orange leg is the sine; the hypotenuse is always 1. Find an angle where the **two squares are equal**, and one where **$\\cos^2\\theta = 0$**.",
        scene: { type: "sketch", x: [-1.5, 1.5], y: [-1.5, 1.5], u: 96, w: 336, gate: true, pts: {},
          params: { t: { min: 0, max: 360, step: 15, v: 30, label: "angle (°)" } },
          track: function (s) { var c = COS(s.p.t * DEG), n = SIN(s.p.t * DEG); return Math.abs(c * c - n * n) < 1e-9 ? "eq" : Math.abs(c) < 1e-9 ? "zero" : null; },
          draw: function (s) { var t = s.p.t * DEG, c = COS(t), n = SIN(t); return [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[-1.4, 0], [1.4, 0]], c: "soft" }, { seg: [[0, -1.4], [0, 1.4]], c: "soft" }, { path: [[0, 0], [c, 0], [c, n]], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [c, 0]], c: "blue" }, { seg: [[c, 0], [c, n]], c: "orange" }, { seg: [[0, 0], [c, n]], c: "ink" }, dot(c, n, "orange")]; },
          readout: function (s) { var t = s.p.t * DEG, c = COS(t), n = SIN(t); return "$\\cos^2\\theta = " + nm(f4(c * c, 3)) + "$ · $\\sin^2\\theta = " + nm(f4(n * n, 3)) + "$ · sum $= " + nm(f4(c * c + n * n, 3)) + "$<br>Squares equal: " + (s.tracked.eq ? "✓" : "—") + " · $\\cos^2\\theta = 0$: " + (s.tracked.zero ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.eq && s.tracked.zero); } },
        gate: true, then: "The two squares are equal at $45^\\circ$ (each is $\\frac{1}{2}$) and $\\cos^2\\theta = 0$ at $90^\\circ$. At **every** angle the squares add to **1**: that is Pythagoras in the triangle with hypotenuse 1." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\sin^2\\theta + \\cos^2\\theta = 1$. Divide by $\\cos^2\\theta$: $1 + \\tan^2\\theta = \\sec^2\\theta$. Divide by $\\sin^2\\theta$: $1 + \\cot^2\\theta = \\csc^2\\theta$. With one value and the quadrant you can find the rest.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "If $\\sin\\theta = \\dfrac{3}{5}$ and $\\theta$ is in quadrant II, find $\\cos\\theta$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "\\sin^2\\theta + \\cos^2\\theta = 1", say: "The identity that links sine and cosine." },
          { step: 2, m: "\\cos^2\\theta = 1 - \\frac{9}{25} = \\frac{16}{25}", say: "Substitute $\\sin\\theta = \\frac{3}{5}$ and solve for the square." },
          { step: 3, m: "\\cos\\theta = \\pm\\frac{4}{5}", say: "A square root has two signs.", ask: { prompt: "In quadrant II the cosine is…", answer: 0, options: [{ t: "negative" }, { t: "positive", fb: "In quadrant II the $x$-coordinate is negative." }] } },
          { step: 3, m: "\\cos\\theta = -\\frac{4}{5}", say: "Quadrant II: pick the negative one." }] },
        gate: true, then: "$\\cos\\theta = -\\dfrac{4}{5}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\sin\\theta$ if $\\cos\\theta = -\\dfrac{5}{13}$ and $\\theta$ is in quadrant III.",
        how: HOW_2, skill: "Pythagorean identities",
        steps: [
          { step: 1, ask: "Which form solves for $\\sin^2\\theta$?", type: "choice", answer: 0, options: [{ t: "$\\sin^2\\theta = 1 - \\cos^2\\theta$" }, { t: "$\\sin^2\\theta = 1 + \\cos^2\\theta$", fb: "Subtract: $\\sin^2\\theta + \\cos^2\\theta = 1$ gives $\\sin^2\\theta = 1 - \\cos^2\\theta$." }], m: "\\sin^2\\theta = 1 - \\cos^2\\theta", say: "Move the cosine term across." },
          { step: 2, ask: "$\\sin^2\\theta = 1 - \\dfrac{25}{169} =$ (a fraction is fine)", type: "num", pre: "$\\sin^2\\theta \\approx$", answer: 0.8521, tol: 0.0006, calc: true, near: [{ v: 0.1479, tol: 0.0006, fb: "That is $\\frac{25}{169}$. Subtract it from 1." }], hint: "$\\frac{169 - 25}{169}$.", m: "\\sin^2\\theta = \\frac{144}{169}", say: "So $\\sin\\theta = \\pm\\frac{12}{13}$." },
          { step: 3, ask: "In quadrant III the sine is…", type: "choice", answer: 0, options: [{ t: "negative" }, { t: "positive", fb: "Quadrant III is below the $x$-axis: the $y$-coordinate is negative." }], m: "\\sin\\theta = -\\frac{12}{13}", say: "Below the axis." }],
        why: "Pick one, substitute, sign." },
      { type: "num", kicker: "On your own", prompt: "If $\\tan\\theta = 3$, what is $\\sec^2\\theta$?", pre: "$\\sec^2\\theta =$", answer: 10, skill: "Pythagorean identities",
        near: [{ v: 9, fb: "$\\sec^2\\theta = 1 + \\tan^2\\theta$: do not forget the 1." }, { v: 4, fb: "Square the tangent first: $3^2 = 9$, then add 1." }], hints: ["$1 + \\tan^2\\theta = \\sec^2\\theta$."], why: "$1 + 9 = 10$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**From tangent.** If $\\tan\\theta = -\\dfrac{3}{4}$ and $\\theta$ is in quadrant II, find $\\sec\\theta$ and $\\cos\\theta$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "1 + \\tan^2\\theta = \\sec^2\\theta", say: "Tangent is given, so use this form." },
          { step: 2, m: "\\sec^2\\theta = 1 + \\frac{9}{16} = \\frac{25}{16}", say: "Substitute and add." },
          { step: 3, m: "\\sec\\theta = \\pm\\frac{5}{4}", say: "Take the square root.", ask: { prompt: "In quadrant II, secant has the same sign as…", answer: 0, options: [{ t: "cosine: negative" }, { t: "sine: positive", fb: "$\\sec\\theta = \\frac{1}{\\cos\\theta}$, so it has the **cosine's** sign." }] } },
          { step: 3, m: "\\sec\\theta = -\\frac{5}{4}", say: "Quadrant II: negative." },
          { step: 3, m: "\\cos\\theta = -\\frac{4}{5}", say: "The reciprocal of secant." }] },
        gate: true, then: "$\\sec\\theta = -\\dfrac{5}{4}$ and $\\cos\\theta = -\\dfrac{4}{5}$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\cos\\theta$ if $\\sin\\theta = -\\dfrac{5}{13}$ and $\\theta$ is in quadrant IV. (A fraction is fine.)", pre: "$\\cos\\theta \\approx$", answer: 0.9231, tol: 0.0006, calc: true, skill: "Pythagorean identities",
        near: [{ v: -0.9231, tol: 0.0006, fb: "In quadrant IV the cosine is **positive**." }, { v: 0.3846, tol: 0.0006, fb: "That is $\\frac{5}{13}$, the sine's size. Use $\\cos^2\\theta = 1 - \\sin^2\\theta$." }], hints: ["$\\cos^2\\theta = 1 - \\frac{25}{169}$."], why: "$\\cos\\theta = \\frac{12}{13} \\approx 0.9231$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Sam finds $\\cos\\theta$ for $\\sin\\theta = 0.6$ with $\\theta$ in quadrant II. Tap the line where the work **first** goes wrong.",
        lines: ["\\sin^2\\theta + \\cos^2\\theta = 1", "0.36 + \\cos^2\\theta = 1", "\\cos^2\\theta = 0.64", "\\cos\\theta = 0.8"], answer: 3, fix: "\\cos\\theta = -0.8",
        fb: { 0: GIVEN, 1: "Squaring 0.6 gives 0.36: right.", 2: "$1 - 0.36 = 0.64$: right." }, skill: "Pythagorean identities",
        hints: ["Which sign does cosine have in quadrant II?"], why: "The square root has two signs and quadrant II is on the left: $\\cos\\theta = -0.8$." },
      { type: "num", kicker: "Use it", prompt: "An acute angle has $\\sin\\theta = 0.28$. Find $\\cos\\theta$. (The box accepts expressions such as 3*sin(0.2).)", pre: "$\\cos\\theta =$", answer: 0.96, tol: 0.0006, calc: true, skill: "Pythagorean identities",
        near: [{ v: 0.72, tol: 0.0006, fb: "That is $1 - 0.28$. Square first: $\\cos^2\\theta = 1 - 0.28^2$." }, { v: 0.9216, tol: 0.0006, fb: "That is $\\cos^2\\theta$. Take the square root." }], hints: ["$\\cos^2\\theta = 1 - 0.0784$."], why: "$\\sqrt{0.9216} = 0.96$." }
    ]
  });

  /* ============================================ 3 · Simplify with algebra and identities */
  var HOW_3 = [["Factor", "Look for a common factor or a difference of squares."],
               ["Substitute", "Replace a piece with an identity, like $1 - \\sin^2 x = \\cos^2 x$."],
               ["Simplify", "Cancel, or write everything with sine and cosine."]];
  LESSONS.push({
    title: "Simplify with algebra and identities", art: "pcwave",
    blurb: "Book 7.1 · Factor, substitute an identity, cancel: algebra you know, with trig functions in it.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Factor $1 - y^2$.",
        options: [{ t: "$(1 - y)(1 + y)$" }, { t: "$(1 - y)^2$", fb: "$(1 - y)^2 = 1 - 2y + y^2$." }, { t: "$1 - y(1 + y)$", fb: "That is not a factorisation: check by expanding." }],
        answer: 0, skill: "Factoring", hints: ["A difference of two squares: $a^2 - b^2$."], why: "$(1 - y)(1 + y)$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dashed graph is $y = (1 - \\sin x)(1 + \\sin x)$. Find **both** expressions whose blue graph lands exactly on top of it.",
        scene: ovl({ ref: function (x) { return (1 - SIN(x)) * (1 + SIN(x)); }, refTex: "(1 - \\sin x)(1 + \\sin x)", x: [-0.6, 6.9], y: [-0.8, 1.6], u: 40, uy: 80,
          opts: [["1 − sin x", function (x) { return 1 - SIN(x); }, false, "1 - \\sin x"], ["cos²x", function (x) { return COS(x) * COS(x); }, true, "\\cos^2 x"], ["cos x", function (x) { return COS(x); }, false, "\\cos x"],
                 ["1 − sin²x", function (x) { return 1 - SIN(x) * SIN(x); }, true, "1 - \\sin^2 x"], ["sin²x", function (x) { return SIN(x) * SIN(x); }, false, "\\sin^2 x"]] }),
        gate: true, then: "$(1 - \\sin x)(1 + \\sin x) = 1 - \\sin^2 x = \\cos^2 x$. A **difference of squares** first, then the **Pythagorean identity**." },
      { type: "learn", kicker: "The idea",
        prompt: "Treat $\\sin x$, $\\cos x$ and the rest like **letters**. **Factor** (a common factor, a difference of squares), **substitute** an identity, then **cancel**. If you are stuck, write everything with sine and cosine.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Simplify $\\dfrac{\\cos^2 x}{1 + \\sin x}$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "\\cos^2 x = 1 - \\sin^2 x", say: "Rewrite the top with the Pythagorean identity." },
          { step: 2, m: "= (1 - \\sin x)(1 + \\sin x)", say: "Factor it.", ask: { prompt: "Which pattern is $1 - \\sin^2 x$?", answer: 0, options: [{ t: "A difference of squares, $a^2 - b^2$" }, { t: "A perfect square, $a^2 + 2ab + b^2$", fb: "There is no middle term, and there is a minus sign: a difference of squares." }] } },
          { step: 3, m: "\\frac{(1 - \\sin x)(1 + \\sin x)}{1 + \\sin x}", say: "Put it back over the bottom." },
          { step: 3, m: "= 1 - \\sin x", say: "Cancel the common factor $1 + \\sin x$." }] },
        gate: true, then: "$\\dfrac{\\cos^2 x}{1 + \\sin x} = 1 - \\sin x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you simplify $\\dfrac{\\sin^2\\theta}{1 - \\cos\\theta}$.",
        how: HOW_3, skill: "Simplify with identities",
        steps: [
          { step: 1, ask: "$\\sin^2\\theta = 1 - \\cos^2\\theta = (1 - \\cos\\theta)(\\ldots)$. What goes in the bracket?", type: "choice", answer: 0, options: [{ t: "$1 + \\cos\\theta$" }, { t: "$1 - \\cos\\theta$", fb: "That would make $(1 - \\cos\\theta)^2$. A difference of squares has $a - b$ and $a + b$." }], m: "\\sin^2\\theta = (1 - \\cos\\theta)(1 + \\cos\\theta)", say: "A difference of squares." },
          { step: 2, ask: "So $\\dfrac{\\sin^2\\theta}{1 - \\cos\\theta} =$", type: "choice", answer: 0, options: [{ t: "$1 + \\cos\\theta$" }, { t: "$1 - \\cos\\theta$", fb: "Cancel the factor $1 - \\cos\\theta$. What remains is $1 + \\cos\\theta$." }], m: "= 1 + \\cos\\theta", say: "Cancel." },
          { step: 3, ask: "Check at $\\theta = 60^\\circ$: $\\dfrac{\\sin^2 60^\\circ}{1 - \\cos 60^\\circ} = \\dfrac{0.75}{0.5} =$", type: "num", pre: "value =", answer: 1.5, tol: 0.0006, near: [{ v: 0.75, fb: "Divide $0.75$ by $0.5$: it doubles." }], hint: "$0.75 \\div 0.5$.", m: "1 + \\cos60^\\circ = 1.5", say: "Both ways give 1.5." }],
        why: "Factor, substitute, simplify." },
      { type: "multi", kicker: "On your own", prompt: "Select **all** the expressions equal to $\\sin^2 x$.",
        options: [{ t: "$1 - \\cos^2 x$", ok: true }, { t: "$\\tan^2 x\\cos^2 x$", ok: true }, { t: "$(1 - \\cos x)(1 + \\cos x)$", ok: true }, { t: "$1 + \\cos^2 x$", fb: "That is bigger than 1 when $\\cos x \\neq 0$; $\\sin^2 x$ never is." }, { t: "$\\cos^2 x - 1$", fb: "That is $-\\sin^2 x$: the opposite sign." }],
        skill: "Simplify with identities", hints: ["$\\tan^2 x\\cos^2 x = \\frac{\\sin^2 x}{\\cos^2 x}\\cos^2 x$."], why: "Three of them." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Adding fractions.** Simplify $\\dfrac{1}{1 - \\cos x} + \\dfrac{1}{1 + \\cos x}$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "\\frac{(1 + \\cos x) + (1 - \\cos x)}{(1 - \\cos x)(1 + \\cos x)}", say: "The common bottom is the product of the two bottoms." },
          { step: 2, m: "= \\frac{2}{1 - \\cos^2 x}", say: "Top: the cosines cancel. Bottom: a difference of squares.", ask: { prompt: "What does $(1 - \\cos x)(1 + \\cos x)$ equal?", answer: 0, options: [{ t: "$1 - \\cos^2 x$" }, { t: "$1 + \\cos^2 x$", fb: "The middle terms cancel and the last term is $-\\cos^2 x$." }] } },
          { step: 3, m: "= \\frac{2}{\\sin^2 x}", say: "Pythagorean identity." },
          { step: 3, m: "= 2\\csc^2 x", say: "Reciprocal of sine, squared." }] },
        gate: true, then: "$\\dfrac{1}{1 - \\cos x} + \\dfrac{1}{1 + \\cos x} = 2\\csc^2 x$." },
      { type: "num", kicker: "Try it", prompt: "Simplify $\\dfrac{1 - \\sin^2 x}{\\cos x}$, then evaluate it at $x = 60^\\circ$. (A decimal is fine.)", pre: "value =", answer: 0.5, tol: 0.0006, skill: "Simplify with identities",
        near: [{ v: 0.25, fb: "The top is $\\cos^2 x$, so after cancelling one $\\cos x$ you are left with $\\cos x$, not $\\cos^2 x$." }, { v: 0.866, tol: 0.001, fb: "That is $\\sin 60^\\circ$. The simplified form is $\\cos x$." }], hints: ["$1 - \\sin^2 x = \\cos^2 x$."], why: "$\\frac{\\cos^2 x}{\\cos x} = \\cos x = 0.5$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Maya simplifies $\\dfrac{\\sin x + \\cos x}{\\cos x}$. Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{\\sin x + \\cos x}{\\cos x}", "= \\frac{\\sin x}{\\cos x} + \\frac{\\cos x}{\\cos x}", "= \\sin x + 1"], answer: 2, fix: "= \\tan x + 1",
        fb: { 0: GIVEN, 1: "Splitting a sum over one bottom is fine." }, skill: "Simplify with identities",
        hints: ["What is $\\frac{\\sin x}{\\cos x}$?"], why: "$\\frac{\\sin x}{\\cos x}$ is $\\tan x$, not $\\sin x$: only the second fraction cancels to 1." },
      { type: "num", kicker: "Use it", prompt: "An angle has $\\tan\\theta = 0.75$ and is acute. Find $\\sin\\theta$ **without** finding $\\theta$. (A decimal is fine.)", pre: "$\\sin\\theta =$", answer: 0.6, tol: 0.0006, skill: "Simplify with identities",
        near: [{ v: 0.8, fb: "That is $\\cos\\theta$. After $\\sec\\theta = 1.25$ and $\\cos\\theta = 0.8$, use $\\sin\\theta = \\tan\\theta\\cos\\theta$." }, { v: 1.25, fb: "That is $\\sec\\theta$, a stepping stone: $\\cos\\theta = \\frac{1}{1.25}$." }], hints: ["$\\sec^2\\theta = 1 + 0.75^2 = 1.5625$, so $\\sec\\theta = 1.25$."], why: "$\\cos\\theta = 0.8$, $\\sin\\theta = 0.75 \\times 0.8 = 0.6$." }
    ]
  });

  /* ============================================ 4 · Verify an identity */
  var HOW_4 = [["Pick a side", "Start with the messier side."],
               ["Rewrite", "Factor, add fractions, use identities, or write everything with sine and cosine."],
               ["Match", "Stop when it is exactly the other side."]];
  // Five equations: one is not an identity. [chip text, left, right, true?, TeX]
  var EQ4 = [["sin²x = 1 − cos²x", function (x) { return SIN(x) * SIN(x); }, function (x) { return 1 - COS(x) * COS(x); }, true, "\\sin^2 x = 1 - \\cos^2 x"],
             ["tan x cos x = sin x", function (x) { return TAN(x) * COS(x); }, function (x) { return SIN(x); }, true, "\\tan x\\cos x = \\sin x"],
             ["sec x − cos x = sin x tan x", function (x) { return SEC(x) - COS(x); }, function (x) { return SIN(x) * TAN(x); }, true, "\\sec x - \\cos x = \\sin x\\tan x"],
             ["cos²x − sin²x = 1 − 2 sin x", function (x) { return COS(x) * COS(x) - SIN(x) * SIN(x); }, function (x) { return 1 - 2 * SIN(x); }, false, "\\cos^2 x - \\sin^2 x = 1 - 2\\sin x"],
             ["1/(1−sin x) + 1/(1+sin x) = 2 sec²x", function (x) { return 1 / (1 - SIN(x)) + 1 / (1 + SIN(x)); }, function (x) { return 2 * SEC(x) * SEC(x); }, true, "\\frac{1}{1 - \\sin x} + \\frac{1}{1 + \\sin x} = 2\\sec^2 x"]];
  LESSONS.push({
    title: "Verify an identity", art: "pcwave",
    blurb: "Book 7.1 · Prove an equation is true for every angle, working on one side only.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "How can you show that an equation is **not** an identity?",
        options: [{ t: "Find one value of $x$ where the two sides are different" }, { t: "Check that it works for $x = 0$", fb: "A false equation can still agree at some values, such as $x = 0$." }, { t: "Check three values that work", fb: "Many agreeing values do not prove it; one disagreeing value disproves it." }],
        answer: 0, skill: "Identities", hints: ["One counterexample is enough."], why: "One counterexample disproves it." },
      { type: "learn", kicker: "Explore",
        prompt: "Four of these five equations are identities; **one is a fake**. Pick an equation and slide $x$: the two sides' values are shown. Find a value of $x$ where the **fake** equation fails.",
        scene: { type: "sketch", x: [-0.6, 6.9], y: [-3, 3], u: 38, w: 330, grid: false, gate: true, pts: {},
          chips: { e: { label: "Equation", v: "0", opts: EQ4.map(function (q, i) { return ["" + i, q[0]]; }) } },
          params: { t: { min: 0, max: 360, step: 15, v: 0, label: "$x$ (°)" } },
          track: function (s) { var q = EQ4[+s.c.e], x = s.p.t * DEG, a = q[1](x), b = q[2](x); return !q[3] && isFinite(a) && isFinite(b) && Math.abs(a - b) > 1e-6 ? "fake" : null; },
          draw: function (s) { var q = EQ4[+s.c.e], x = s.p.t * DEG, a = q[1](x), b = q[2](x), it = waveAx(-0.3, 6.7, -2.8, 2.8).concat(curve(q[1], 0, 2 * PI, "blue", [-3, 3]), curve(q[2], 0, 2 * PI, "orange", [-3, 3], true), [{ seg: [[x, -2.8], [x, 2.8]], c: "soft", dash: true }]); if (isFinite(a) && Math.abs(a) <= 2.9) it.push(dot(x, a, "blue")); if (isFinite(b) && Math.abs(b) <= 2.9) it.push(dot(x, b, "orange")); return it; },
          readout: function (s) { var q = EQ4[+s.c.e], x = s.p.t * DEG, a = q[1](x), b = q[2](x), ok = isFinite(a) && isFinite(b); return "$" + q[4] + "$ at $x = " + s.p.t + "^\\circ$:<br>left " + (isFinite(a) ? nm(f4(a, 3)) : "undefined") + " · right " + (isFinite(b) ? nm(f4(b, 3)) : "undefined") + (ok ? (Math.abs(a - b) < 1e-6 ? " ✓ equal here" : " ✗ different") : "") + "<br>Fake found: " + (s.tracked.fake ? "✓" : "—"); },
          goal: function (s) { return !!s.tracked.fake; } },
        gate: true, then: "$\\cos^2 x - \\sin^2 x = 1 - 2\\sin x$ is the fake: it **agrees at $x = 0$** (and a few other angles) but fails elsewhere, for example at $30^\\circ$ (left $0.5$, right $0$). Agreeing at some values proves nothing. The true identity is $\\cos^2 x - \\sin^2 x = 1 - 2\\sin^2 x$." },
      { type: "learn", kicker: "The idea",
        prompt: "To **verify** an identity, work on **one side only** until it matches the other. Start with the messier side. Never add or multiply the same thing on both sides: that assumes what you are trying to prove.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Verify $\\sin x(\\csc x - \\sin x) = \\cos^2 x$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "\\sin x(\\csc x - \\sin x)", say: "Start with the left side: it has more going on." },
          { step: 2, m: "= \\sin x\\csc x - \\sin^2 x", say: "Distribute.", ask: { prompt: "What is $\\sin x\\csc x$?", answer: 0, options: [{ t: "$1$" }, { t: "$\\sin^2 x$", fb: "$\\csc x = \\frac{1}{\\sin x}$, so the product is $\\frac{\\sin x}{\\sin x} = 1$." }] } },
          { step: 2, m: "= 1 - \\sin^2 x", say: "Replace $\\sin x\\csc x$ by 1." },
          { step: 3, m: "= \\cos^2 x", say: "Pythagorean identity. It matches the right side ✓." }] },
        gate: true, then: "Verified: $\\sin x(\\csc x - \\sin x) = \\cos^2 x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you verify $\\tan x + \\cot x = \\sec x\\csc x$, starting with the left side.",
        how: HOW_4, skill: "Verify an identity",
        steps: [
          { step: 1, ask: "Write the left side with sines and cosines.", type: "choice", answer: 0, options: [{ t: "$\\dfrac{\\sin x}{\\cos x} + \\dfrac{\\cos x}{\\sin x}$" }, { t: "$\\sin x\\cos x$", fb: "Tangent and cotangent are **ratios**, and they are added." }], m: "\\frac{\\sin x}{\\cos x} + \\frac{\\cos x}{\\sin x}", say: "Quotient identities." },
          { step: 2, ask: "Over the common bottom $\\sin x\\cos x$, the top becomes…", type: "choice", answer: 0, options: [{ t: "$\\sin^2 x + \\cos^2 x$" }, { t: "$\\sin x + \\cos x$", fb: "Multiply each top by the **other** fraction's bottom: $\\sin x\\cdot\\sin x$ and $\\cos x\\cdot\\cos x$." }], m: "= \\frac{\\sin^2 x + \\cos^2 x}{\\sin x\\cos x}", say: "Add the fractions." },
          { step: 3, ask: "The top is 1, so the whole is $\\dfrac{1}{\\sin x\\cos x} =$", type: "choice", answer: 0, options: [{ t: "$\\sec x\\csc x$" }, { t: "$\\sin x\\cos x$", fb: "Each factor on the bottom becomes its reciprocal: $\\frac{1}{\\cos x} = \\sec x$ and $\\frac{1}{\\sin x} = \\csc x$." }], m: "= \\sec x\\csc x", say: "It matches the right side ✓." }],
        why: "Messier side, rewrite, match." },
      { type: "choice", kicker: "On your own", prompt: "Which first move best starts verifying $\\dfrac{\\cos x}{1 - \\sin x} = \\dfrac{1 + \\sin x}{\\cos x}$?",
        options: [{ t: "Multiply top and bottom of the left side by $1 + \\sin x$" }, { t: "Add $\\sin x$ to both sides", fb: "Changing both sides assumes the identity is true. Work on one side." }, { t: "Cross-multiply the two sides", fb: "Cross-multiplying treats it as an equation, which assumes what we want to prove." }],
        answer: 0, skill: "Verify an identity", hints: ["Make $1 - \\sin^2 x$ appear on the bottom."], why: "$(1 - \\sin x)(1 + \\sin x) = 1 - \\sin^2 x = \\cos^2 x$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A clever multiplier.** Verify $\\dfrac{\\cos x}{1 - \\sin x} = \\dfrac{1 + \\sin x}{\\cos x}$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "\\frac{\\cos x}{1 - \\sin x}", say: "Start with the left side." },
          { step: 2, m: "= \\frac{\\cos x}{1 - \\sin x}\\cdot\\frac{1 + \\sin x}{1 + \\sin x}", say: "Multiply by 1, in a helpful form.", ask: { prompt: "Why use $1 + \\sin x$?", answer: 0, options: [{ t: "It turns the bottom into $1 - \\sin^2 x$" }, { t: "It cancels the $\\cos x$", fb: "The bottom is $1 - \\sin x$: we want to complete a difference of squares." }] } },
          { step: 2, m: "= \\frac{\\cos x(1 + \\sin x)}{1 - \\sin^2 x}", say: "Multiply the tops and the bottoms." },
          { step: 3, m: "= \\frac{\\cos x(1 + \\sin x)}{\\cos^2 x}", say: "Pythagorean identity." },
          { step: 3, m: "= \\frac{1 + \\sin x}{\\cos x}", say: "Cancel one $\\cos x$. It matches the right side ✓." }] },
        gate: true, then: "Verified, working on the left side only." },
      { type: "num", kicker: "Try it", prompt: "Check an identity with a number: find $\\dfrac{1 + \\cos x}{\\sin x}$ at $x = 60^\\circ$. (The box accepts expressions such as 3*sin(0.2).)", pre: "value $\\approx$", answer: 1.7321, tol: 0.0006, calc: true, skill: "Verify an identity",
        near: [{ v: 1.5, fb: "That is the top, $1 + \\cos 60^\\circ$. Divide by $\\sin 60^\\circ \\approx 0.866$." }], hints: ["$\\frac{1.5}{0.866}$."], why: "$\\frac{1.5}{0.866} \\approx 1.7321$, which is $\\cot 30^\\circ$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ava wants to verify $\\dfrac{\\sin x}{1 + \\cos x} = \\dfrac{1 - \\cos x}{\\sin x}$. She multiplies both sides by $\\sin x(1 + \\cos x)$ and shows the results are equal. What is wrong?",
        options: [{ t: "It assumes the two sides are equal before showing it" }, { t: "She should have divided instead", fb: "Multiplying or dividing both sides is the same problem: both treat it as an equation." }, { t: "Nothing is wrong.", fb: "The method is circular: it starts from the claim." }],
        answer: 0, skill: "Verify an identity", hints: ["Which side may you change?"], why: "Work on one side only." },
      { type: "num", kicker: "Use it", prompt: "The expression $\\dfrac{\\sin x}{1 + \\cos x} + \\dfrac{1 + \\cos x}{\\sin x}$ simplifies to $2\\csc x$. Use that to evaluate it at $x = 30^\\circ$.", pre: "value =", answer: 4, skill: "Verify an identity",
        near: [{ v: 2, fb: "That is $\\csc 30^\\circ$. The expression is $2\\csc x$: double it." }], hints: ["$\\csc 30^\\circ = \\frac{1}{0.5}$."], why: "$2 \\times 2 = 4$." }
    ]
  });
  /* ============================================ 5 · The cosine of a sum or difference */
  var HOW_5 = [["Split", "Write the angle as a sum or difference of two special angles."],
               ["Formula", "Write the formula with the right signs."],
               ["Substitute", "Put in the exact values and simplify."]];
  LESSONS.push({
    title: "The cosine of a sum or difference", art: "pcwave",
    blurb: "Book 7.2 · Exact values of $\\cos 15^\\circ$ and $\\cos 75^\\circ$, from angles we already know.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $\\cos(30^\\circ + 60^\\circ)$ equal to $\\cos 30^\\circ + \\cos 60^\\circ$?",
        options: [{ t: "No: $\\cos 90^\\circ = 0$, but $0.866 + 0.5 = 1.366$" }, { t: "Yes: cosine of a sum is the sum of cosines", fb: "Test it: $\\cos 90^\\circ = 0$, but $0.866 + 0.5 = 1.366$. Cosine does not distribute." }, { t: "Only when the two angles are equal", fb: "Try $30^\\circ + 30^\\circ$: $\\cos 60^\\circ = 0.5$, but $0.866 + 0.866 = 1.73$." }],
        answer: 0, skill: "Sum and difference formulas", hints: ["Work out each side as a number."], why: "Not a sum of cosines: we need a new formula." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $\\alpha$ and $\\beta$. The readout compares $\\cos(\\alpha - \\beta)$ with two rival formulas. Find **two different pairs** whose difference is $15^\\circ$, and see what they have in common.",
        scene: { type: "sketch", x: [-1.45, 1.45], y: [-1.45, 1.45], u: 96, w: 336, gate: true, pts: {},
          params: { a: { min: 0, max: 180, step: 15, v: 90, label: "$\\alpha$ (°)" }, b: { min: 0, max: 180, step: 15, v: 30, label: "$\\beta$ (°)" } },
          track: function (s) { return s.p.a - s.p.b === 15 ? "p" + s.p.a + "_" + s.p.b : null; },
          draw: function (s) { var a = s.p.a * DEG, b = s.p.b * DEG, pa = [COS(a), SIN(a)], pb = [COS(b), SIN(b)], it = [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[-1.4, 0], [1.4, 0]], c: "soft" }, { seg: [[0, -1.4], [0, 1.4]], c: "soft" }, { seg: [[0, 0], pa], c: "blue" }, { seg: [[0, 0], pb], c: "orange" }, { seg: [pa, pb], c: "soft", dash: true }]; if (s.p.a !== s.p.b) it.push({ turn: [[0, 0], 0.3, Math.min(s.p.a, s.p.b), Math.max(s.p.a, s.p.b)], c: "green" }); return it.concat([dot(pa[0], pa[1], "blue"), dot(pb[0], pb[1], "orange")]); },
          readout: function (s) { var a = s.p.a * DEG, b = s.p.b * DEG; return "$\\alpha - \\beta = " + (s.p.a - s.p.b) + "^\\circ$<br>$\\cos(\\alpha - \\beta) = " + nm(f4(COS(a - b), 4)) + "$ · $\\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta = " + nm(f4(COS(a) * COS(b) + SIN(a) * SIN(b), 4)) + "$<br>$\\cos\\alpha - \\cos\\beta = " + nm(f4(COS(a) - COS(b), 4)) + "$<br>Pairs that differ by $15^\\circ$: " + Math.min(Object.keys(s.tracked).length, 2) + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "The second formula matches $\\cos(\\alpha - \\beta)$ every time: $\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta$. And **only the difference matters**: $60^\\circ - 45^\\circ$ and $45^\\circ - 30^\\circ$ both give $\\cos 15^\\circ \\approx 0.9659$. The simple guess $\\cos\\alpha - \\cos\\beta$ is wrong." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta$ and $\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta$. For cosine the sign between the products is **opposite** the sign inside the bracket.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\cos 15^\\circ$ exactly.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "15^\\circ = 45^\\circ - 30^\\circ", say: "Both are special angles." },
          { step: 2, m: "\\cos45^\\circ\\cos30^\\circ + \\sin45^\\circ\\sin30^\\circ", say: "Difference formula: a minus inside, so a **plus** between.", ask: { prompt: "In $\\cos(\\alpha - \\beta)$ the sign between the products is…", answer: 0, options: [{ t: "plus: the opposite of the sign inside" }, { t: "minus: the same as inside", fb: "That is the pattern for **sine**. For cosine the sign flips." }] } },
          { step: 3, m: "= \\frac{\\sqrt{2}}{2}\\cdot\\frac{\\sqrt{3}}{2} + \\frac{\\sqrt{2}}{2}\\cdot\\frac{1}{2}", say: "Substitute the exact values." },
          { step: 3, m: "= \\frac{\\sqrt{6} + \\sqrt{2}}{4}", say: "Multiply and add: about $0.9659$." }] },
        gate: true, then: "$\\cos 15^\\circ = \\dfrac{\\sqrt{6} + \\sqrt{2}}{4}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\cos 75^\\circ$ exactly.",
        how: HOW_5, skill: "Sum and difference formulas",
        steps: [
          { step: 1, ask: "Which special angles make $75^\\circ$?", type: "choice", answer: 0, options: [{ t: "$45^\\circ + 30^\\circ$" }, { t: "$90^\\circ - 15^\\circ$", fb: "$15^\\circ$ is not a special angle: it does not help." }], m: "75^\\circ = 45^\\circ + 30^\\circ", say: "Both special." },
          { step: 2, ask: "For a **sum**, the cosine formula has between the products…", type: "choice", answer: 0, options: [{ t: "a minus" }, { t: "a plus", fb: "That is for the **difference**. A plus inside gives a minus between." }], m: "\\cos45^\\circ\\cos30^\\circ - \\sin45^\\circ\\sin30^\\circ", say: "The opposite sign." },
          { step: 3, ask: "$\\dfrac{\\sqrt{6} - \\sqrt{2}}{4} \\approx$ (type it as an expression)", type: "num", pre: "$\\cos 75^\\circ \\approx$", answer: 0.2588, tol: 0.0006, calc: true, near: [{ v: 0.9659, tol: 0.0006, fb: "That is the plus version, $\\cos 15^\\circ$. For the sum, subtract." }], hint: "$\\frac{2.449 - 1.414}{4}$.", m: "= \\frac{\\sqrt{6} - \\sqrt{2}}{4}", say: "Small, because $75^\\circ$ is close to $90^\\circ$." }],
        why: "Split, formula, substitute." },
      { type: "choice", kicker: "On your own", prompt: "Which expression equals $\\cos(x + y)$?",
        options: [{ t: "$\\cos x\\cos y - \\sin x\\sin y$" }, { t: "$\\cos x\\cos y + \\sin x\\sin y$", fb: "That is $\\cos(x - y)$." }, { t: "$\\cos x + \\cos y$", fb: "Cosine does not distribute: with $x = y = 90^\\circ$, $\\cos 180^\\circ = -1$ but $0 + 0 = 0$." }],
        answer: 0, skill: "Sum and difference formulas", hints: ["A plus inside gives a minus between."], why: "$\\cos x\\cos y - \\sin x\\sin y$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Reading the formula backwards.** Simplify $\\cos 40^\\circ\\cos 20^\\circ - \\sin 40^\\circ\\sin 20^\\circ$.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "\\cos40^\\circ\\cos20^\\circ - \\sin40^\\circ\\sin20^\\circ", say: "This has exactly the shape of a formula we know." },
          { step: 2, m: "= \\cos(40^\\circ + 20^\\circ)", say: "A minus between the products: it is the **sum** formula.", ask: { prompt: "Which formula has a minus between the products?", answer: 0, options: [{ t: "$\\cos(\\alpha + \\beta)$" }, { t: "$\\cos(\\alpha - \\beta)$", fb: "That one has a plus between the products." }] } },
          { step: 3, m: "= \\cos60^\\circ = \\frac{1}{2}", say: "A special angle." }] },
        gate: true, then: "$\\cos 40^\\circ\\cos 20^\\circ - \\sin 40^\\circ\\sin 20^\\circ = \\dfrac{1}{2}$, with no calculator." },
      { type: "num", kicker: "Try it", prompt: "Find $\\cos 105^\\circ$ using $60^\\circ + 45^\\circ$. (The box accepts expressions such as 3*sin(0.2).)", pre: "$\\cos 105^\\circ \\approx$", answer: -0.2588, tol: 0.0006, calc: true, skill: "Sum and difference formulas",
        near: [{ v: 0.2588, tol: 0.0006, fb: "$105^\\circ$ is past $90^\\circ$, so its cosine is **negative**." }, { v: 0.9659, tol: 0.0006, fb: "That is $\\cos 15^\\circ$. Check the sign between the products for a sum." }], hints: ["$\\cos 60^\\circ\\cos 45^\\circ - \\sin 60^\\circ\\sin 45^\\circ$."], why: "$\\frac{1}{2}\\cdot\\frac{\\sqrt{2}}{2} - \\frac{\\sqrt{3}}{2}\\cdot\\frac{\\sqrt{2}}{2} = \\frac{\\sqrt{2} - \\sqrt{6}}{4}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tom finds $\\cos 75^\\circ$. Tap the line where the work **first** goes wrong.",
        lines: ["75^\\circ = 45^\\circ + 30^\\circ", "\\cos75^\\circ = \\cos45^\\circ + \\cos30^\\circ", "= 0.7071 + 0.8660", "= 1.5731"], answer: 1, fix: "\\cos75^\\circ = \\cos45^\\circ\\cos30^\\circ - \\sin45^\\circ\\sin30^\\circ",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Sum and difference formulas",
        hints: ["Can any cosine be bigger than 1?"], why: "Cosine does not distribute over a sum. The answer $1.57$ cannot be a cosine." },
      { type: "num", kicker: "Use it", prompt: "A 4 m ladder makes an angle of $15^\\circ$ with the ground. How far does its foot reach along the ground, $4\\cos 15^\\circ$? (The box accepts expressions such as 3*sin(0.2).)", pre: "reach $\\approx$", post: "m", answer: 3.8637, tol: 0.0006, calc: true, skill: "Sum and difference formulas",
        near: [{ v: 0.9659, tol: 0.0006, fb: "That is $\\cos 15^\\circ$ alone. Multiply by 4." }, { v: 1.0353, tol: 0.0006, fb: "That is $4\\sin 15^\\circ$, the height. The reach along the ground uses cosine." }], hints: ["$4 \\cdot \\frac{\\sqrt{6} + \\sqrt{2}}{4}$."], why: "$4\\cos 15^\\circ = \\sqrt{6} + \\sqrt{2} \\approx 3.8637$ m." }
    ]
  });

  /* ============================================ 6 · The sine of a sum or difference */
  LESSONS.push({
    title: "The sine of a sum or difference", art: "pcwave",
    blurb: "Book 7.2 · The sine formulas, and what they say about angles whose sines and cosines you know only as ratios.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $\\sin 60^\\circ\\cos 30^\\circ + \\cos 60^\\circ\\sin 30^\\circ$. (Exact values: $\\frac{\\sqrt3}{2}$ and $\\frac12$.)", pre: "value =", answer: 1, skill: "Sum and difference formulas",
        near: [{ v: 0.75, fb: "That is only the first product. Add the second: $\\frac{1}{2}\\cdot\\frac{1}{2} = \\frac{1}{4}$." }], hints: ["$\\frac{3}{4} + \\frac{1}{4}$."], why: "$\\frac{3}{4} + \\frac{1}{4} = 1 = \\sin 90^\\circ$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue point is at angle $\\alpha$ and the orange one at $\\alpha + \\beta$. Slide both and read three numbers. Find **two different pairs** whose angles add to $90^\\circ$.",
        scene: { type: "sketch", x: [-1.45, 1.45], y: [-1.45, 1.45], u: 96, w: 336, gate: true, pts: {},
          params: { a: { min: 0, max: 180, step: 15, v: 30, label: "$\\alpha$ (°)" }, b: { min: 0, max: 180, step: 15, v: 45, label: "$\\beta$ (°)" } },
          track: function (s) { return s.p.a + s.p.b === 90 ? "p" + s.p.a + "_" + s.p.b : null; },
          draw: function (s) { var a = s.p.a * DEG, c = (s.p.a + s.p.b) * DEG, pa = [COS(a), SIN(a)], pc = [COS(c), SIN(c)], it = [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[-1.4, 0], [1.4, 0]], c: "soft" }, { seg: [[0, -1.4], [0, 1.4]], c: "soft" }, { seg: [[0, 0], pa], c: "blue" }, { seg: [[0, 0], pc], c: "orange" }, { seg: [pc, [pc[0], 0]], c: "orange", dash: true }]; if (s.p.b > 0) it.push({ turn: [[0, 0], 0.3, s.p.a, s.p.a + s.p.b], c: "green" }); return it.concat([dot(pa[0], pa[1], "blue"), dot(pc[0], pc[1], "orange")]); },
          readout: function (s) { var a = s.p.a * DEG, b = s.p.b * DEG; return "$\\alpha + \\beta = " + (s.p.a + s.p.b) + "^\\circ$<br>$\\sin(\\alpha + \\beta) = " + nm(f4(SIN(a + b), 4)) + "$ · $\\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta = " + nm(f4(SIN(a) * COS(b) + COS(a) * SIN(b), 4)) + "$<br>$\\sin\\alpha + \\sin\\beta = " + nm(f4(SIN(a) + SIN(b), 4)) + "$<br>Pairs that add to $90^\\circ$: " + Math.min(Object.keys(s.tracked).length, 2) + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "The height of the orange point is $\\sin(\\alpha + \\beta)$, and it equals $\\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta$ every time. Whenever the angles add to $90^\\circ$ the point is at the top and the value is **1**. The guess $\\sin\\alpha + \\sin\\beta$ is not it." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta$ and $\\sin(\\alpha - \\beta) = \\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta$. For sine the sign between the products is the **same** as the sign inside the bracket.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\sin 75^\\circ$ exactly.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "75^\\circ = 45^\\circ + 30^\\circ", say: "Both special." },
          { step: 2, m: "\\sin45^\\circ\\cos30^\\circ + \\cos45^\\circ\\sin30^\\circ", say: "Sum formula: a plus between the products.", ask: { prompt: "For sine, the sign between the products is…", answer: 0, options: [{ t: "the same as inside the bracket" }, { t: "the opposite of the one inside", fb: "That is the pattern for **cosine**. For sine the sign stays." }] } },
          { step: 3, m: "= \\frac{\\sqrt{2}}{2}\\cdot\\frac{\\sqrt{3}}{2} + \\frac{\\sqrt{2}}{2}\\cdot\\frac{1}{2}", say: "Substitute." },
          { step: 3, m: "= \\frac{\\sqrt{6} + \\sqrt{2}}{4}", say: "About $0.9659$: the same as $\\cos 15^\\circ$." }] },
        gate: true, then: "$\\sin 75^\\circ = \\dfrac{\\sqrt{6} + \\sqrt{2}}{4}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\sin 15^\\circ$ exactly.",
        how: HOW_5, skill: "Sum and difference formulas",
        steps: [
          { step: 1, ask: "Which special angles make $15^\\circ$?", type: "choice", answer: 0, options: [{ t: "$45^\\circ - 30^\\circ$" }, { t: "$45^\\circ + 30^\\circ$", fb: "That is $75^\\circ$." }], m: "15^\\circ = 45^\\circ - 30^\\circ", say: "A difference." },
          { step: 2, ask: "For a **difference**, the sine formula has between the products…", type: "choice", answer: 0, options: [{ t: "a minus" }, { t: "a plus", fb: "For sine the sign is the same as inside the bracket: a minus." }], m: "\\sin45^\\circ\\cos30^\\circ - \\cos45^\\circ\\sin30^\\circ", say: "Same sign as inside." },
          { step: 3, ask: "$\\dfrac{\\sqrt{6} - \\sqrt{2}}{4} \\approx$ (type it as an expression)", type: "num", pre: "$\\sin 15^\\circ \\approx$", answer: 0.2588, tol: 0.0006, calc: true, near: [{ v: 0.9659, tol: 0.0006, fb: "That is the plus version, $\\sin 75^\\circ$." }], hint: "$\\frac{2.449 - 1.414}{4}$.", m: "= \\frac{\\sqrt{6} - \\sqrt{2}}{4}", say: "Small, as it should be for $15^\\circ$." }],
        why: "Split, formula, substitute." },
      { type: "choice", kicker: "On your own", prompt: "Which expression equals $\\sin(x - y)$?",
        options: [{ t: "$\\sin x\\cos y - \\cos x\\sin y$" }, { t: "$\\sin x\\cos y + \\cos x\\sin y$", fb: "That is $\\sin(x + y)$." }, { t: "$\\sin x - \\sin y$", fb: "Sine does not distribute: with $x = 90^\\circ$ and $y = 30^\\circ$, $\\sin 60^\\circ = 0.866$ but $1 - 0.5 = 0.5$." }],
        answer: 0, skill: "Sum and difference formulas", hints: ["The sign between the products matches the sign inside."], why: "$\\sin x\\cos y - \\cos x\\sin y$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Angles given by ratios.** Find $\\sin\\left(\\arcsin\\dfrac{3}{5} + \\arccos\\dfrac{5}{13}\\right)$.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "\\alpha = \\arcsin\\tfrac{3}{5}, \\ \\beta = \\arccos\\tfrac{5}{13}", say: "Name the two angles: $\\sin\\alpha = \\frac{3}{5}$ and $\\cos\\beta = \\frac{5}{13}$." },
          { step: 2, m: "\\cos\\alpha = \\tfrac{4}{5}", say: "A 3-4-5 triangle gives the missing cosine.", ask: { prompt: "If $\\sin\\alpha = \\frac{3}{5}$, the cosine of the acute angle is…", answer: 0, options: [{ t: "$\\frac{4}{5}$" }, { t: "$\\frac{3}{4}$", fb: "That is the tangent. The adjacent side is 4 and the hypotenuse 5." }] } },
          { step: 2, m: "\\sin\\beta = \\tfrac{12}{13}", say: "A 5-12-13 triangle." },
          { step: 3, m: "\\sin(\\alpha + \\beta) = \\tfrac{3}{5}\\cdot\\tfrac{5}{13} + \\tfrac{4}{5}\\cdot\\tfrac{12}{13}", say: "The sum formula." },
          { step: 3, m: "= \\tfrac{15 + 48}{65} = \\tfrac{63}{65}", say: "Add the fractions: about $0.9692$." }] },
        gate: true, then: "$\\sin(\\alpha + \\beta) = \\dfrac{63}{65}$." },
      { type: "num", kicker: "Try it", prompt: "Simplify $\\sin 20^\\circ\\cos 25^\\circ + \\cos 20^\\circ\\sin 25^\\circ$ without a calculator, and give its decimal value.", pre: "value $\\approx$", answer: 0.7071, tol: 0.0006, skill: "Sum and difference formulas",
        near: [{ v: 0.5, fb: "Combine the angles first: the sum formula turns this into one sine of $20^\\circ + 25^\\circ$." }, { v: 0.866, tol: 0.001, fb: "That is $\\sin 60^\\circ$. Add the angles: $20^\\circ + 25^\\circ = 45^\\circ$." }], hints: ["It is the sum formula read backwards."], why: "$\\sin(20^\\circ + 25^\\circ) = \\sin 45^\\circ \\approx 0.7071$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kim says $\\sin(A + B) = \\sin A + \\sin B$. Which test shows she is wrong?",
        options: [{ t: "$A = B = 90^\\circ$: $\\sin 180^\\circ = 0$, but $1 + 1 = 2$" }, { t: "$A = B = 0^\\circ$: both sides are 0", fb: "Both sides agree there, so it proves nothing. One **disagreement** is what disproves a formula." }, { t: "No test is needed: the formula is right.", fb: "Try $A = B = 90^\\circ$: $\\sin 180^\\circ = 0$ but $1 + 1 = 2$." }],
        answer: 0, skill: "Sum and difference formulas", hints: ["Find values where the two sides differ."], why: "One counterexample disproves it." },
      { type: "num", kicker: "Use it", prompt: "A wheel of radius 10 cm has a point 45° above the horizontal. It turns 30° more. How high is the point above the centre, $10\\sin 75^\\circ$? (The box accepts expressions such as 3*sin(0.2).)", pre: "height $\\approx$", post: "cm", answer: 9.659, tol: 0.006, calc: true, skill: "Sum and difference formulas",
        near: [{ v: 7.071, tol: 0.006, fb: "That is the height at $45^\\circ$. After turning 30° more the angle is $75^\\circ$." }, { v: 2.588, tol: 0.006, fb: "That is $10\\sin 15^\\circ$. The angle is $45^\\circ + 30^\\circ = 75^\\circ$." }], hints: ["$10\\sin(45^\\circ + 30^\\circ)$."], why: "$10 \\cdot \\frac{\\sqrt{6} + \\sqrt{2}}{4} \\approx 9.659$ cm." }
    ]
  });

  /* ============================================ 7 · The tangent of a sum, and cofunctions */
  LESSONS.push({
    title: "The tangent of a sum, and cofunctions", art: "pcwave",
    blurb: "Book 7.2 · The tangent formulas, and why the sine of an angle is the cosine of its partner.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Since $\\tan x = \\dfrac{\\sin x}{\\cos x}$, what is $\\tan(\\alpha + \\beta)$?",
        options: [{ t: "$\\dfrac{\\sin(\\alpha + \\beta)}{\\cos(\\alpha + \\beta)}$" }, { t: "$\\tan\\alpha + \\tan\\beta$", fb: "Tangent does not distribute: $\\tan 30^\\circ + \\tan 30^\\circ \\approx 1.155$, but $\\tan 60^\\circ \\approx 1.732$." }, { t: "$\\dfrac{\\sin\\alpha}{\\cos\\beta}$", fb: "The angle in the ratio is the **same** on top and bottom: here, $\\alpha + \\beta$." }],
        answer: 0, skill: "Tangent of a sum", hints: ["Apply the quotient identity to the angle $\\alpha + \\beta$."], why: "$\\frac{\\sin(\\alpha + \\beta)}{\\cos(\\alpha + \\beta)}$: and the sum formulas expand the top and bottom." },
      { type: "learn", kicker: "Explore",
        prompt: "A right triangle has acute angles $\\theta$ and $90^\\circ - \\theta$. Slide $\\theta$ and compare the sine of one angle with the cosine of the other. Try **at least four** different angles.",
        scene: { type: "sketch", x: [-0.35, 1.35], y: [-0.35, 1.35], u: 190, w: 340, gate: true, pts: {},
          params: { t: { min: 15, max: 75, step: 15, v: 30, label: "$\\theta$ (°)" } },
          track: function (s) { return "a" + s.p.t; },
          draw: function (s) { var t = s.p.t * DEG, c = COS(t), n = SIN(t); return [{ path: [[0, 0], [c, 0], [c, n]], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [c, 0]], c: "blue" }, { seg: [[c, 0], [c, n]], c: "orange" }, { seg: [[0, 0], [c, n]], c: "ink" }, { turn: [[0, 0], 0.22, 0, s.p.t], c: "green" }, { turn: [[c, n], 0.16, 180 + s.p.t, 270], c: "purple" }]; },
          readout: function (s) { var t = s.p.t, a = t * DEG, b = (90 - t) * DEG; return "$\\theta = " + t + "^\\circ$ and $90^\\circ - \\theta = " + (90 - t) + "^\\circ$<br>$\\sin\\theta = " + nm(f4(SIN(a), 4)) + "$ · $\\cos(90^\\circ - \\theta) = " + nm(f4(COS(b), 4)) + "$<br>$\\tan\\theta = " + nm(f4(TAN(a), 4)) + "$ · $\\cot(90^\\circ - \\theta) = " + nm(f4(COT(b), 4)) + "$<br>Angles tried: " + Math.min(Object.keys(s.tracked).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        gate: true, then: "Each pair is equal: the **sine** of one acute angle is the **cosine** of the other, and the same for tangent and cotangent. These are the **cofunction** identities: $\\sin\\theta = \\cos(90^\\circ - \\theta)$ and $\\tan\\theta = \\cot(90^\\circ - \\theta)$." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\tan(\\alpha \\pm \\beta) = \\dfrac{\\tan\\alpha \\pm \\tan\\beta}{1 \\mp \\tan\\alpha\\tan\\beta}$: the top copies the sign inside, the bottom has the opposite. **Cofunctions:** $\\sin\\theta = \\cos(90^\\circ - \\theta)$, $\\tan\\theta = \\cot(90^\\circ - \\theta)$, $\\sec\\theta = \\csc(90^\\circ - \\theta)$.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\tan 75^\\circ$ exactly.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "75^\\circ = 45^\\circ + 30^\\circ", say: "Both special." },
          { step: 2, m: "\\frac{\\tan45^\\circ + \\tan30^\\circ}{1 - \\tan45^\\circ\\tan30^\\circ}", say: "Sum formula: plus on top, **minus** below.", ask: { prompt: "In the bottom of the sum formula we…", answer: 0, options: [{ t: "subtract: $1 - \\tan\\alpha\\tan\\beta$" }, { t: "add: $1 + \\tan\\alpha\\tan\\beta$", fb: "The bottom has the **opposite** sign to the top." }] } },
          { step: 3, m: "= \\frac{1 + \\frac{1}{\\sqrt{3}}}{1 - \\frac{1}{\\sqrt{3}}}", say: "$\\tan45^\\circ = 1$ and $\\tan30^\\circ = \\frac{1}{\\sqrt3}$." },
          { step: 3, m: "= \\frac{\\sqrt{3} + 1}{\\sqrt{3} - 1} = 2 + \\sqrt{3}", say: "Multiply top and bottom by $\\sqrt3$, then rationalise. About $3.7321$." }] },
        gate: true, then: "$\\tan 75^\\circ = 2 + \\sqrt{3}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\tan 15^\\circ$ exactly.",
        how: HOW_5, skill: "Tangent of a sum",
        steps: [
          { step: 1, ask: "Which special angles make $15^\\circ$?", type: "choice", answer: 0, options: [{ t: "$45^\\circ - 30^\\circ$" }, { t: "$45^\\circ + 30^\\circ$", fb: "That is $75^\\circ$." }], m: "15^\\circ = 45^\\circ - 30^\\circ", say: "A difference." },
          { step: 2, ask: "Which is the difference formula?", type: "choice", answer: 0, options: [{ t: "$\\dfrac{\\tan45^\\circ - \\tan30^\\circ}{1 + \\tan45^\\circ\\tan30^\\circ}$" }, { t: "$\\dfrac{\\tan45^\\circ - \\tan30^\\circ}{1 - \\tan45^\\circ\\tan30^\\circ}$", fb: "The bottom has the **opposite** sign to the top: a plus." }], m: "\\frac{1 - \\frac{1}{\\sqrt{3}}}{1 + \\frac{1}{\\sqrt{3}}}", say: "Substitute the values." },
          { step: 3, ask: "That simplifies to $2 - \\sqrt{3} \\approx$ (type it as an expression)", type: "num", pre: "$\\tan 15^\\circ \\approx$", answer: 0.2679, tol: 0.0006, calc: true, near: [{ v: 3.7321, tol: 0.0006, fb: "That is $\\tan 75^\\circ$, the sum version." }], hint: "$2 - 1.7321$.", m: "= 2 - \\sqrt{3}", say: "Small, as it should be for $15^\\circ$." }],
        why: "Split, formula, substitute." },
      { type: "choice", kicker: "On your own", prompt: "Which has the **same value** as $\\sin 20^\\circ$?",
        options: [{ t: "$\\cos 70^\\circ$" }, { t: "$\\cos 20^\\circ$", fb: "Cofunctions use the **complement**: $90^\\circ - 20^\\circ = 70^\\circ$." }, { t: "$\\sin 70^\\circ$", fb: "The sine of the complement equals the **cosine** of the original: $\\sin 70^\\circ = \\cos 20^\\circ$." }],
        answer: 0, skill: "Cofunction identities", hints: ["$90^\\circ - 20^\\circ$."], why: "$\\sin 20^\\circ = \\cos(90^\\circ - 20^\\circ) = \\cos 70^\\circ$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Putting angles together.** If $\\tan\\alpha = \\dfrac{1}{2}$ and $\\tan\\beta = \\dfrac{1}{3}$, find $\\tan(\\alpha + \\beta)$.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "\\tan(\\alpha + \\beta) = \\frac{\\tan\\alpha + \\tan\\beta}{1 - \\tan\\alpha\\tan\\beta}", say: "The sum formula. We only need the two tangents." },
          { step: 2, m: "= \\frac{\\frac{1}{2} + \\frac{1}{3}}{1 - \\frac{1}{2}\\cdot\\frac{1}{3}}", say: "Substitute." },
          { step: 3, m: "= \\frac{5/6}{5/6} = 1", say: "Top: $\\frac{3 + 2}{6}$. Bottom: $1 - \\frac{1}{6}$.", ask: { prompt: "What is $1 - \\frac{1}{6}$?", answer: 0, options: [{ t: "$\\frac{5}{6}$" }, { t: "$\\frac{1}{6}$", fb: "Write 1 as $\\frac{6}{6}$, then subtract $\\frac{1}{6}$." }] } },
          { step: 3, m: "\\alpha + \\beta = 45^\\circ", say: "Both angles are small, and the only angle in $(0^\\circ, 90^\\circ)$ with tangent 1 is $45^\\circ$." }] },
        gate: true, then: "$\\tan(\\alpha + \\beta) = 1$, so $\\alpha + \\beta = 45^\\circ$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\tan(\\alpha - \\beta)$ when $\\tan\\alpha = 3$ and $\\tan\\beta = 2$. (A fraction is fine.)", pre: "$\\tan(\\alpha - \\beta) \\approx$", answer: 0.1429, tol: 0.0006, calc: true, skill: "Tangent of a sum",
        near: [{ v: 1, fb: "That is only the top, $3 - 2$. Divide by $1 + 3 \\cdot 2 = 7$." }, { v: -0.2, tol: 0.001, fb: "The bottom of the **difference** formula has a plus: $1 + 3 \\cdot 2 = 7$." }], hints: ["$\\frac{3 - 2}{1 + 3 \\cdot 2}$."], why: "$\\frac{1}{7} \\approx 0.1429$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Pat says $\\tan(\\alpha + \\beta) = \\tan\\alpha + \\tan\\beta$. Which test shows that is wrong?",
        options: [{ t: "$\\alpha = \\beta = 30^\\circ$: $\\tan 60^\\circ \\approx 1.732$, but $0.577 + 0.577 = 1.155$" }, { t: "$\\alpha = \\beta = 0^\\circ$: both sides are 0", fb: "Both sides agree there, so it proves nothing." }, { t: "It is a correct formula.", fb: "Try $30^\\circ + 30^\\circ$: $\\tan 60^\\circ \\approx 1.732$ but $0.577 + 0.577 = 1.155$." }],
        answer: 0, skill: "Tangent of a sum", hints: ["Look for values where the two sides differ."], why: "One counterexample is enough." },
      { type: "num", kicker: "Use it", prompt: "A ramp with slope $0.2$ is built on a hillside of slope $0.3$. Slopes do not simply add. What is the slope of the ramp surface, $\\tan(\\alpha + \\beta)$? (The box accepts expressions such as 3*sin(0.2).)", pre: "slope $\\approx$", answer: 0.5319, tol: 0.0006, calc: true, skill: "Tangent of a sum",
        near: [{ v: 0.5, fb: "Adding the slopes ignores the bottom of the formula: divide by $1 - 0.2 \\cdot 0.3 = 0.94$." }], hints: ["$\\frac{0.2 + 0.3}{1 - 0.2 \\cdot 0.3}$."], why: "$\\frac{0.5}{0.94} \\approx 0.5319$." }
    ]
  });

  /* ============================================ 8 · The double-angle formulas */
  var HOW_8 = [["Get both", "Find $\\sin\\theta$ and $\\cos\\theta$: draw a triangle and use the quadrant."],
               ["Double", "Put them in the double-angle formula."],
               ["Simplify", "Multiply out and simplify."]];
  LESSONS.push({
    title: "The double-angle formulas", art: "pcwave",
    blurb: "Book 7.3 · $\\sin 2\\theta$ and $\\cos 2\\theta$ in terms of $\\theta$: set the two angles in the sum formula equal.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is $2\\sin 30^\\circ\\cos 30^\\circ$?",
        options: [{ t: "$\\dfrac{\\sqrt{3}}{2}$" }, { t: "$\\dfrac{1}{2}$", fb: "That is $\\sin 30^\\circ$. Multiply: $2 \\cdot \\frac{1}{2} \\cdot \\frac{\\sqrt{3}}{2}$." }, { t: "$1$", fb: "Work it out: $2 \\cdot \\frac{1}{2} \\cdot \\frac{\\sqrt{3}}{2} = \\frac{\\sqrt{3}}{2}$." }],
        answer: 0, skill: "Double-angle formulas", hints: ["$2 \\cdot \\frac{1}{2} \\cdot \\frac{\\sqrt{3}}{2}$."], why: "$\\frac{\\sqrt{3}}{2} = \\sin 60^\\circ$: the double of $30^\\circ$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dashed graph is $y = \\cos 2x$. Find **all three** expressions whose blue graph lands exactly on top of it.",
        scene: ovl({ ref: function (x) { return COS(2 * x); }, refTex: "\\cos 2x", x: [-0.6, 6.9], y: [-2.3, 2.3], u: 36,
          opts: [["2 cos x", function (x) { return 2 * COS(x); }, false, "2\\cos x"], ["cos²x − sin²x", function (x) { return COS(x) * COS(x) - SIN(x) * SIN(x); }, true, "\\cos^2 x - \\sin^2 x"], ["cos²x", function (x) { return COS(x) * COS(x); }, false, "\\cos^2 x"],
                 ["2cos²x − 1", function (x) { return 2 * COS(x) * COS(x) - 1; }, true, "2\\cos^2 x - 1"], ["sin 2x", function (x) { return SIN(2 * x); }, false, "\\sin 2x"], ["1 − 2sin²x", function (x) { return 1 - 2 * SIN(x) * SIN(x); }, true, "1 - 2\\sin^2 x"]] }),
        gate: true, then: "$\\cos 2x = \\cos^2 x - \\sin^2 x = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x$: three forms of one function, linked by $\\sin^2 x + \\cos^2 x = 1$. Notice that $\\cos 2x$ is **not** $2\\cos x$." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$. $\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1 = 1 - 2\\sin^2\\theta$. $\\tan 2\\theta = \\dfrac{2\\tan\\theta}{1 - \\tan^2\\theta}$. Doubling the angle does **not** double the value.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "If $\\sin\\theta = \\dfrac{3}{5}$ and $\\theta$ is in quadrant II, find $\\sin 2\\theta$ and $\\cos 2\\theta$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\cos\\theta = -\\tfrac{4}{5}", say: "A 3-4-5 triangle, and cosine is negative in quadrant II." },
          { step: 2, m: "\\sin2\\theta = 2\\sin\\theta\\cos\\theta", say: "The double-angle formula for sine.", ask: { prompt: "Which formula gives $\\sin 2\\theta$?", answer: 0, options: [{ t: "$2\\sin\\theta\\cos\\theta$" }, { t: "$2\\sin\\theta$", fb: "Doubling the angle does not double the sine: try $\\theta = 30^\\circ$." }] } },
          { step: 2, m: "= 2\\left(\\tfrac{3}{5}\\right)\\left(-\\tfrac{4}{5}\\right) = -\\tfrac{24}{25}", say: "Substitute and multiply." },
          { step: 3, m: "\\cos2\\theta = 1 - 2\\sin^2\\theta", say: "The form that uses the sine we know." },
          { step: 3, m: "= 1 - 2\\cdot\\tfrac{9}{25} = \\tfrac{7}{25}", say: "$1 - \\frac{18}{25}$." }] },
        gate: true, then: "$\\sin 2\\theta = -\\dfrac{24}{25}$ and $\\cos 2\\theta = \\dfrac{7}{25}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\sin 2\\theta$ and $\\cos 2\\theta$ if $\\cos\\theta = \\dfrac{5}{13}$ and $\\theta$ is in quadrant IV.",
        how: HOW_8, skill: "Double-angle formulas",
        steps: [
          { step: 1, ask: "What is $\\sin\\theta$? (A 5-12-13 triangle, quadrant IV.)", type: "choice", answer: 0, options: [{ t: "$-\\dfrac{12}{13}$" }, { t: "$\\dfrac{12}{13}$", fb: "Quadrant IV is below the $x$-axis: the sine is negative." }], m: "\\sin\\theta = -\\tfrac{12}{13}", say: "Below the axis." },
          { step: 2, ask: "$\\sin 2\\theta = 2\\left(-\\dfrac{12}{13}\\right)\\left(\\dfrac{5}{13}\\right) =$ (a fraction is fine)", type: "num", pre: "$\\sin 2\\theta \\approx$", answer: -0.7101, tol: 0.0006, calc: true, near: [{ v: 0.7101, tol: 0.0006, fb: "The sine is negative in this quadrant, so the product is negative." }], hint: "$\\frac{-120}{169}$.", m: "\\sin2\\theta = -\\tfrac{120}{169}", say: "Negative." },
          { step: 3, ask: "$\\cos 2\\theta = 2\\cos^2\\theta - 1 = \\dfrac{50}{169} - 1 =$ (a fraction is fine)", type: "num", pre: "$\\cos 2\\theta \\approx$", answer: -0.7041, tol: 0.0006, calc: true, near: [{ v: 0.2959, tol: 0.0006, fb: "That is $\\frac{50}{169}$: do not forget to subtract 1." }], hint: "$\\frac{50 - 169}{169}$.", m: "\\cos2\\theta = -\\tfrac{119}{169}", say: "Check: $\\left(\\frac{120}{169}\\right)^2 + \\left(\\frac{119}{169}\\right)^2 = 1$." }],
        why: "Get both, double, simplify." },
      { type: "choice", kicker: "On your own", prompt: "Which of these is **not** equal to $\\cos 2\\theta$?",
        options: [{ t: "$2\\sin\\theta\\cos\\theta$" }, { t: "$1 - 2\\sin^2\\theta$", fb: "This one **is** a form of $\\cos 2\\theta$." }, { t: "$2\\cos^2\\theta - 1$", fb: "This one **is** a form of $\\cos 2\\theta$." }, { t: "$\\cos^2\\theta - \\sin^2\\theta$", fb: "This one **is** a form of $\\cos 2\\theta$." }],
        answer: 0, skill: "Double-angle formulas", hints: ["Which one is the formula for $\\sin 2\\theta$?"], why: "$2\\sin\\theta\\cos\\theta$ is $\\sin 2\\theta$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Verify with a double angle.** Show that $\\sin 2x = \\dfrac{2\\tan x}{1 + \\tan^2 x}$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\frac{2\\tan x}{1 + \\tan^2 x}", say: "Start with the right side: it is messier." },
          { step: 2, m: "= \\frac{2\\tan x}{\\sec^2 x}", say: "A Pythagorean identity." },
          { step: 2, m: "= 2\\tan x\\cos^2 x", say: "Dividing by $\\sec^2 x$ is multiplying by $\\cos^2 x$." },
          { step: 3, m: "= 2\\frac{\\sin x}{\\cos x}\\cos^2 x = 2\\sin x\\cos x", say: "Rewrite the tangent and cancel.", ask: { prompt: "What is $\\dfrac{\\sin x}{\\cos x}\\cdot\\cos^2 x$?", answer: 0, options: [{ t: "$\\sin x\\cos x$" }, { t: "$\\sin x$", fb: "One $\\cos x$ cancels, but $\\cos^2 x$ has two: one is left." }] } },
          { step: 3, m: "= \\sin 2x", say: "The double-angle formula: it matches the left side ✓." }] },
        gate: true, then: "Verified, working on the right side only." },
      { type: "num", kicker: "Try it", prompt: "Find $\\cos 2\\theta$ if $\\cos\\theta = 0.6$. (A decimal is fine.)", pre: "$\\cos 2\\theta =$", answer: -0.28, tol: 0.0006, skill: "Double-angle formulas",
        near: [{ v: 1.2, fb: "Doubling the angle does not double the cosine. Use $2\\cos^2\\theta - 1$." }, { v: 0.72, fb: "That is $2\\cos^2\\theta$. Subtract 1." }], hints: ["$2(0.36) - 1$."], why: "$0.72 - 1 = -0.28$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rae says $\\sin 2\\theta = 2\\sin\\theta$. Which test shows she is wrong?",
        options: [{ t: "$\\theta = 30^\\circ$: $\\sin 60^\\circ \\approx 0.866$, but $2\\sin 30^\\circ = 1$" }, { t: "$\\theta = 0^\\circ$: both sides are 0", fb: "Both sides agree there: it proves nothing." }, { t: "Nothing is wrong.", fb: "Try $\\theta = 30^\\circ$: $\\sin 60^\\circ \\approx 0.866$ but $2\\sin 30^\\circ = 1$." }],
        answer: 0, skill: "Double-angle formulas", hints: ["Test an angle where the sides can differ."], why: "$\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$." },
      { type: "num", kicker: "Use it", prompt: "A ball kicked at $22$ m/s at $30^\\circ$ travels a range $R = \\dfrac{v^2\\sin 2\\theta}{9.8}$ metres. Find $R$. (The box accepts expressions such as 3*sin(0.2).)", pre: "$R \\approx$", post: "m", answer: 42.771, tol: 0.006, calc: true, skill: "Double-angle formulas",
        near: [{ v: 24.69, tol: 0.006, fb: "That uses $\\sin 30^\\circ$. The formula needs $\\sin 2\\theta = \\sin 60^\\circ$." }], hints: ["$22^2 = 484$, and $2\\theta = 60^\\circ$."], why: "$\\frac{484 \\times 0.866}{9.8} \\approx 42.77$ m." }
    ]
  });
  /* ============================================ 9 · Power-reducing and half-angle formulas */
  var HOW_9 = [["Whole angle", "Find the whole angle $\\alpha$ whose half you want."],
               ["Cosine", "Get $\\cos\\alpha$ exactly."],
               ["Sign", "Use the half-angle formula, with $+$ or $-$ from the quadrant of $\\frac{\\alpha}{2}$."]];
  LESSONS.push({
    title: "Power-reducing and half-angle formulas", art: "pcwave",
    blurb: "Book 7.3 · Trade a square for a double angle, then halve an angle you know.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "From $\\cos 2\\theta = 1 - 2\\sin^2\\theta$, solve for $\\sin^2\\theta$.",
        options: [{ t: "$\\sin^2\\theta = \\dfrac{1 - \\cos 2\\theta}{2}$" }, { t: "$\\sin^2\\theta = \\dfrac{1 + \\cos 2\\theta}{2}$", fb: "Move $2\\sin^2\\theta$ to the left and $\\cos 2\\theta$ to the right: the signs flip." }, { t: "$\\sin^2\\theta = 1 - \\cos 2\\theta$", fb: "Do not forget to divide by 2 as well." }],
        answer: 0, skill: "Power-reducing formulas", hints: ["Add $2\\sin^2\\theta$ and subtract $\\cos 2\\theta$ on both sides."], why: "$2\\sin^2\\theta = 1 - \\cos 2\\theta$, then divide by 2." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dashed graph is $y = \\sin^2 x$. Find **both** expressions whose blue graph lands exactly on top of it. Look at the **midline** of the orange graph.",
        scene: ovl({ ref: function (x) { return SIN(x) * SIN(x); }, refTex: "\\sin^2 x", x: [-0.6, 6.9], y: [-0.8, 1.6], u: 40, uy: 80,
          opts: [["(1 + cos 2x)/2", function (x) { return (1 + COS(2 * x)) / 2; }, false, "\\frac{1 + \\cos 2x}{2}"], ["(1 − cos 2x)/2", function (x) { return (1 - COS(2 * x)) / 2; }, true, "\\frac{1 - \\cos 2x}{2}"], ["(1 − cos x)/2", function (x) { return (1 - COS(x)) / 2; }, false, "\\frac{1 - \\cos x}{2}"],
                 ["1 − cos²x", function (x) { return 1 - COS(x) * COS(x); }, true, "1 - \\cos^2 x"], ["sin 2x / 2", function (x) { return SIN(2 * x) / 2; }, false, "\\frac{\\sin 2x}{2}"]] }),
        gate: true, then: "The graph of $\\sin^2 x$ is a **cosine wave**: midline $\\frac{1}{2}$, amplitude $\\frac{1}{2}$, upside down and twice as fast. That is $\\sin^2 x = \\dfrac{1 - \\cos 2x}{2}$. Likewise $\\cos^2 x = \\dfrac{1 + \\cos 2x}{2}$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Power-reducing:** $\\sin^2\\theta = \\frac{1 - \\cos 2\\theta}{2}$ and $\\cos^2\\theta = \\frac{1 + \\cos 2\\theta}{2}$. **Half-angle:** $\\sin\\frac{\\alpha}{2} = \\pm\\sqrt{\\frac{1 - \\cos\\alpha}{2}}$ and $\\cos\\frac{\\alpha}{2} = \\pm\\sqrt{\\frac{1 + \\cos\\alpha}{2}}$. The sign comes from the quadrant of $\\frac{\\alpha}{2}$.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\sin 15^\\circ$ exactly.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "15^\\circ = \\frac{30^\\circ}{2}", say: "Half of a special angle." },
          { step: 2, m: "\\cos30^\\circ = \\frac{\\sqrt{3}}{2}", say: "The whole angle's cosine." },
          { step: 3, m: "\\sin15^\\circ = \\sqrt{\\frac{1 - \\cos30^\\circ}{2}}", say: "The half-angle formula for sine.", ask: { prompt: "Which sign: $15^\\circ$ is in quadrant I, where sine is…", answer: 0, options: [{ t: "positive: use $+$" }, { t: "negative: use $-$", fb: "Quadrant I is above the $x$-axis: the sine is positive." }] } },
          { step: 3, m: "= \\sqrt{\\frac{2 - \\sqrt{3}}{4}} = \\frac{\\sqrt{2 - \\sqrt{3}}}{2}", say: "Simplify: about $0.2588$." }] },
        gate: true, then: "$\\sin 15^\\circ = \\dfrac{\\sqrt{2 - \\sqrt{3}}}{2} \\approx 0.2588$, the same number as $\\dfrac{\\sqrt{6} - \\sqrt{2}}{4}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\cos 22.5^\\circ$ exactly.",
        how: HOW_9, skill: "Half-angle formulas",
        steps: [
          { step: 1, ask: "$22.5^\\circ$ is half of…", type: "choice", answer: 0, options: [{ t: "$45^\\circ$" }, { t: "$90^\\circ$", fb: "Half of $90^\\circ$ is $45^\\circ$. We want the angle that is **twice** $22.5^\\circ$." }], m: "22.5^\\circ = \\frac{45^\\circ}{2}", say: "Half of a special angle." },
          { step: 2, ask: "$\\cos^2 22.5^\\circ = \\dfrac{1 + \\cos 45^\\circ}{2} =$ (type it as an expression)", type: "num", pre: "$\\cos^2 22.5^\\circ \\approx$", answer: 0.8536, tol: 0.0006, calc: true, near: [{ v: 0.1464, tol: 0.0006, fb: "That has a minus: $\\frac{1 - \\cos 45^\\circ}{2}$ is $\\sin^2 22.5^\\circ$. For cosine, add." }], hint: "$\\frac{1 + 0.7071}{2}$.", m: "\\cos^2 22.5^\\circ = \\frac{2 + \\sqrt{2}}{4}", say: "Combine over 4." },
          { step: 3, ask: "$22.5^\\circ$ is in quadrant I, so take the positive root: $\\cos 22.5^\\circ = \\sqrt{0.8536} \\approx$ (type it as an expression)", type: "num", pre: "$\\cos 22.5^\\circ \\approx$", answer: 0.9239, tol: 0.0006, calc: true, near: [{ v: 0.8536, tol: 0.0006, fb: "That is the **square**. Take the square root." }], hint: "$\\sqrt{0.8536}$.", m: "\\cos22.5^\\circ = \\frac{\\sqrt{2 + \\sqrt{2}}}{2}", say: "Close to 1, as it should be for a small angle." }],
        why: "Whole angle, cosine, sign." },
      { type: "choice", kicker: "On your own", prompt: "Which expression equals $\\cos^2 x$ with **no power**?",
        options: [{ t: "$\\dfrac{1 + \\cos 2x}{2}$" }, { t: "$\\dfrac{1 - \\cos 2x}{2}$", fb: "That is $\\sin^2 x$." }, { t: "$\\cos 2x$", fb: "$\\cos 2x = 2\\cos^2 x - 1$. Solve for $\\cos^2 x$: add 1, divide by 2." }],
        answer: 0, skill: "Power-reducing formulas", hints: ["$\\cos 2x = 2\\cos^2 x - 1$."], why: "$\\cos^2 x = \\frac{1 + \\cos 2x}{2}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A ratio, and a quadrant.** If $\\cos\\alpha = -\\dfrac{7}{25}$ and $\\alpha$ is in quadrant II, find $\\sin\\dfrac{\\alpha}{2}$ and $\\cos\\dfrac{\\alpha}{2}$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "90^\\circ < \\alpha < 180^\\circ", say: "Quadrant II." },
          { step: 1, m: "45^\\circ < \\tfrac{\\alpha}{2} < 90^\\circ", say: "Halve the interval: $\\frac{\\alpha}{2}$ is in quadrant I.", ask: { prompt: "So sine and cosine of $\\frac{\\alpha}{2}$ are…", answer: 0, options: [{ t: "both positive" }, { t: "cosine negative", fb: "Quadrant I: both coordinates are positive. The $+$ root is right for both." }] } },
          { step: 3, m: "\\sin\\tfrac{\\alpha}{2} = \\sqrt{\\tfrac{1 - (-7/25)}{2}}", say: "Half-angle formula for sine." },
          { step: 3, m: "= \\sqrt{\\tfrac{16}{25}} = \\tfrac{4}{5}", say: "$\\frac{32/25}{2} = \\frac{16}{25}$." },
          { step: 3, m: "\\cos\\tfrac{\\alpha}{2} = \\sqrt{\\tfrac{1 + (-7/25)}{2}} = \\tfrac{3}{5}", say: "$\\frac{18/25}{2} = \\frac{9}{25}$." }] },
        gate: true, then: "$\\sin\\dfrac{\\alpha}{2} = \\dfrac{4}{5}$ and $\\cos\\dfrac{\\alpha}{2} = \\dfrac{3}{5}$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\sin 22.5^\\circ$. (The box accepts expressions such as 3*sin(0.2).)", pre: "$\\sin 22.5^\\circ \\approx$", answer: 0.3827, tol: 0.0006, calc: true, skill: "Half-angle formulas",
        near: [{ v: 0.9239, tol: 0.0006, fb: "That is $\\cos 22.5^\\circ$. For **sine** the formula has $1 - \\cos\\alpha$." }], hints: ["$\\sqrt{\\frac{1 - 0.7071}{2}}$."], why: "$\\sqrt{0.1464} \\approx 0.3827$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Jo says $\\sin\\dfrac{\\alpha}{2} = \\dfrac{\\sin\\alpha}{2}$. Which test shows that is wrong?",
        options: [{ t: "$\\alpha = 60^\\circ$: $\\sin 30^\\circ = 0.5$, but $\\frac{\\sin 60^\\circ}{2} \\approx 0.433$" }, { t: "$\\alpha = 0^\\circ$: both sides are 0", fb: "Both sides agree there: it proves nothing." }, { t: "Nothing is wrong.", fb: "Try $\\alpha = 60^\\circ$: $\\sin 30^\\circ = 0.5$ but $\\frac{\\sin 60^\\circ}{2} \\approx 0.433$." }],
        answer: 0, skill: "Half-angle formulas", hints: ["Pick an angle where the two sides can differ."], why: "Halving the angle is not halving the sine." },
      { type: "num", kicker: "Use it", prompt: "In an AC circuit the power is $\\dfrac{V^2\\sin^2 t}{R}$. The **average** of $\\sin^2 t$ over a cycle is $\\frac{1}{2}$, because $\\sin^2 t = \\frac{1 - \\cos 2t}{2}$ and $\\cos 2t$ averages 0. With a peak of 10 V across 5 ohms, what is the average power?", pre: "power =", post: "W", answer: 10, skill: "Power-reducing formulas",
        near: [{ v: 20, fb: "That is the **peak** power, $\\frac{10^2}{5}$. The average of $\\sin^2 t$ is $\\frac{1}{2}$: halve it." }], hints: ["$\\frac{100}{5} \\times \\frac{1}{2}$."], why: "$20 \\times \\frac{1}{2} = 10$ W." }
    ]
  });

  /* ============================================ 10 · Sum-to-product and product-to-sum */
  var HOW_10 = [["Match", "Is it a product or a sum? Pick the formula for that pair."],
                ["Angles", "Find the two new angles: add and subtract, or average and half-difference."],
                ["Evaluate", "Simplify with exact values."]];
  LESSONS.push({
    title: "Sum-to-product and product-to-sum", art: "pcwave",
    blurb: "Book 7.4 · Turn a product of waves into a sum of waves, and back.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Add the formulas for $\\cos(A - B)$ and $\\cos(A + B)$. What do you get?",
        options: [{ t: "$2\\cos A\\cos B$" }, { t: "$2\\sin A\\sin B$", fb: "The sine products cancel when you **add**; they would double if you subtracted." }, { t: "$\\cos A + \\cos B$", fb: "Write both formulas out: the $\\sin A\\sin B$ terms have opposite signs and cancel." }],
        answer: 0, skill: "Product-to-sum formulas", hints: ["$\\cos A\\cos B + \\sin A\\sin B$ plus $\\cos A\\cos B - \\sin A\\sin B$."], why: "$2\\cos A\\cos B$: so $\\cos A\\cos B = \\frac{1}{2}[\\cos(A - B) + \\cos(A + B)]$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dashed graph is $y = \\sin 5x + \\sin 3x$. **Exactly one** of the products below lands on top of it. Find it, and see how the fast wave and the slow wave combine.",
        scene: ovl({ ref: function (x) { return SIN(5 * x) + SIN(3 * x); }, refTex: "\\sin 5x + \\sin 3x", x: [-0.6, 6.9], y: [-2.3, 2.3], u: 36,
          opts: [["sin 8x", function (x) { return SIN(8 * x); }, false, "\\sin 8x"], ["2 sin 4x cos x", function (x) { return 2 * SIN(4 * x) * COS(x); }, true, "2\\sin 4x\\cos x"], ["sin 5x · sin 3x", function (x) { return SIN(5 * x) * SIN(3 * x); }, false, "\\sin 5x\\sin 3x"],
                 ["2 cos 4x sin x", function (x) { return 2 * COS(4 * x) * SIN(x); }, false, "2\\cos 4x\\sin x"], ["2 sin 8x cos 2x", function (x) { return 2 * SIN(8 * x) * COS(2 * x); }, false, "2\\sin 8x\\cos 2x"]] }),
        gate: true, then: "$\\sin 5x + \\sin 3x = 2\\sin 4x\\cos x$. The fast wave $\\sin 4x$ uses the **average** of 5 and 3; the slow wave $\\cos x$ uses **half the difference**, and swells and shrinks the fast one. That is what you hear as **beats**." },
      { type: "learn", kicker: "The idea",
        prompt: "**Product to sum:** $\\cos\\alpha\\cos\\beta = \\frac{1}{2}[\\cos(\\alpha - \\beta) + \\cos(\\alpha + \\beta)]$ and $\\sin\\alpha\\cos\\beta = \\frac{1}{2}[\\sin(\\alpha + \\beta) + \\sin(\\alpha - \\beta)]$. **Sum to product:** $\\sin\\alpha + \\sin\\beta = 2\\sin\\frac{\\alpha + \\beta}{2}\\cos\\frac{\\alpha - \\beta}{2}$.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\cos 75^\\circ\\cos 15^\\circ$ without a calculator.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "\\cos\\alpha\\cos\\beta = \\tfrac{1}{2}[\\cos(\\alpha - \\beta) + \\cos(\\alpha + \\beta)]", say: "A product of two cosines: the product-to-sum formula." },
          { step: 2, m: "\\alpha - \\beta = 60^\\circ, \\ \\ \\alpha + \\beta = 90^\\circ", say: "Subtract and add the two angles.", ask: { prompt: "What is $75^\\circ + 15^\\circ$?", answer: 0, options: [{ t: "$90^\\circ$" }, { t: "$60^\\circ$", fb: "$60^\\circ$ is the **difference**, $75^\\circ - 15^\\circ$." }] } },
          { step: 3, m: "= \\tfrac{1}{2}[\\cos60^\\circ + \\cos90^\\circ]", say: "Both are special angles." },
          { step: 3, m: "= \\tfrac{1}{2}\\left[\\tfrac{1}{2} + 0\\right] = \\tfrac{1}{4}", say: "$\\cos 90^\\circ = 0$." }] },
        gate: true, then: "$\\cos 75^\\circ\\cos 15^\\circ = \\dfrac{1}{4}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $\\sin 5x + \\sin 3x$ as a product.",
        how: HOW_10, skill: "Sum-to-product formulas",
        steps: [
          { step: 1, ask: "Which is the sum-to-product formula for $\\sin\\alpha + \\sin\\beta$?", type: "choice", answer: 0, options: [{ t: "$2\\sin\\dfrac{\\alpha + \\beta}{2}\\cos\\dfrac{\\alpha - \\beta}{2}$" }, { t: "$2\\sin\\dfrac{\\alpha - \\beta}{2}\\cos\\dfrac{\\alpha + \\beta}{2}$", fb: "That is the pattern for $\\sin\\alpha - \\sin\\beta$. For a **sum**, the sine takes the average angle." }], m: "\\sin\\alpha + \\sin\\beta = 2\\sin\\frac{\\alpha + \\beta}{2}\\cos\\frac{\\alpha - \\beta}{2}", say: "The sine takes the average." },
          { step: 2, ask: "The average angle $\\dfrac{5x + 3x}{2}$ is a number times $x$. Type the number.", type: "num", pre: "average $=$", post: "$x$", answer: 4, near: [{ v: 8, fb: "Divide the sum by 2." }, { v: 1, fb: "That is half the **difference**, which goes with the cosine." }], hint: "$\\frac{8}{2}$.", m: "\\frac{5x + 3x}{2} = 4x", say: "The fast wave." },
          { step: 3, ask: "Half the difference $\\dfrac{5x - 3x}{2}$ is a number times $x$. Type the number.", type: "num", pre: "half-difference $=$", post: "$x$", answer: 1, near: [{ v: 4, fb: "That is the average. The cosine takes half the difference." }, { v: 2, fb: "Divide the difference by 2 as well." }], hint: "$\\frac{2}{2}$.", m: "\\sin5x + \\sin3x = 2\\sin4x\\cos x", say: "Product of a fast and a slow wave." }],
        why: "Match, angles, evaluate." },
      { type: "choice", kicker: "On your own", prompt: "Write $\\sin 3x\\cos x$ as a sum.",
        options: [{ t: "$\\dfrac{1}{2}[\\sin 4x + \\sin 2x]$" }, { t: "$\\dfrac{1}{2}[\\sin 3x + \\sin x]$", fb: "The new angles are the **sum** and **difference** of $3x$ and $x$: $4x$ and $2x$." }, { t: "$\\sin 4x\\sin 2x$", fb: "A product of sine and cosine becomes a **sum** of two sines." }],
        answer: 0, skill: "Product-to-sum formulas", hints: ["$3x + x$ and $3x - x$."], why: "$\\frac{1}{2}[\\sin(3x + x) + \\sin(3x - x)]$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A sum with a number.** Find $\\sin 105^\\circ + \\sin 15^\\circ$ exactly.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "\\sin\\alpha + \\sin\\beta = 2\\sin\\frac{\\alpha + \\beta}{2}\\cos\\frac{\\alpha - \\beta}{2}", say: "A sum of two sines: sum-to-product." },
          { step: 2, m: "\\frac{105^\\circ + 15^\\circ}{2} = 60^\\circ", say: "The average angle." },
          { step: 2, m: "\\frac{105^\\circ - 15^\\circ}{2} = 45^\\circ", say: "Half the difference.", ask: { prompt: "What is $\\frac{105^\\circ - 15^\\circ}{2}$?", answer: 0, options: [{ t: "$45^\\circ$" }, { t: "$90^\\circ$", fb: "Divide the difference, $90^\\circ$, by 2." }] } },
          { step: 3, m: "= 2\\sin60^\\circ\\cos45^\\circ = 2\\cdot\\frac{\\sqrt{3}}{2}\\cdot\\frac{\\sqrt{2}}{2}", say: "Both special." },
          { step: 3, m: "= \\frac{\\sqrt{6}}{2}", say: "About $1.2247$." }] },
        gate: true, then: "$\\sin 105^\\circ + \\sin 15^\\circ = \\dfrac{\\sqrt{6}}{2} \\approx 1.2247$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\sin 75^\\circ\\cos 15^\\circ$ with the product-to-sum formula. (The box accepts expressions such as 3*sin(0.2).)", pre: "value $\\approx$", answer: 0.933, tol: 0.0006, calc: true, skill: "Product-to-sum formulas",
        near: [{ v: 1.866, tol: 0.001, fb: "That is the sum inside the bracket. The formula has a factor $\\frac{1}{2}$." }], hints: ["$\\frac{1}{2}[\\sin(75^\\circ + 15^\\circ) + \\sin(75^\\circ - 15^\\circ)]$."], why: "$\\frac{1}{2}(1 + 0.866) = 0.933$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Bo says $\\sin\\alpha + \\sin\\beta = \\sin(\\alpha + \\beta)$. Which test shows that is wrong?",
        options: [{ t: "$\\alpha = \\beta = 90^\\circ$: $\\sin 90^\\circ + \\sin 90^\\circ = 2$, but $\\sin 180^\\circ = 0$" }, { t: "$\\alpha = \\beta = 0^\\circ$: both sides are 0", fb: "Both sides agree there: it proves nothing." }, { t: "Nothing is wrong.", fb: "Try $\\alpha = \\beta = 90^\\circ$: the left is 2 and the right is 0." }],
        answer: 0, skill: "Sum-to-product formulas", hints: ["Find values where the sides differ."], why: "The sum of two sines is a product, not a sine of a sum." },
      { type: "num", kicker: "Use it", prompt: "Two tuning forks sound at $440$ Hz and $444$ Hz. Their sum is $2\\sin(2\\pi\\cdot 442\\,t)\\cos(2\\pi\\cdot 2\\,t)$: the loudness swells and fades with $\\left|\\cos(2\\pi\\cdot 2\\,t)\\right|$. How many **beats per second** (swells per second) do you hear?", pre: "beats per second =", answer: 4, skill: "Sum-to-product formulas",
        near: [{ v: 2, fb: "That is the frequency of the cosine factor. The loudness is $|\\cos|$, which swells **twice** per cosine cycle." }, { v: 442, fb: "That is the pitch you hear, the average frequency. The beats come from the slow factor." }], hints: ["The beat rate is the difference of the two frequencies."], why: "$444 - 440 = 4$ beats per second." }
    ]
  });

  /* ============================================ 11 · Solving trigonometric equations */
  var HOW_11 = [["Isolate", "Get the trigonometric function alone on one side."],
                ["Reference", "Find the reference angle: ignore the sign."],
                ["Quadrants", "Place it in each quadrant where the sign matches."]];
  // The solutions of sin x = c or cos x = c in [0, 2π), sorted.
  var SOL11 = function (f, c) {
    if (Math.abs(c) > 1 + 1e-9) return [];
    var a = f === "sin" ? Math.asin(Math.max(-1, Math.min(1, c))) : Math.acos(Math.max(-1, Math.min(1, c))), r = f === "sin" ? [a, PI - a] : [a, 2 * PI - a], out = [];
    r.forEach(function (v) { v = ((v % (2 * PI)) + 2 * PI) % (2 * PI); if (v > 2 * PI - 1e-9) v = 0; if (!out.some(function (w) { return Math.abs(w - v) < 1e-9; })) out.push(v); });
    return out.sort(function (p, q) { return p - q; });
  };
  LESSONS.push({
    title: "Solving trigonometric equations", art: "pcwave",
    blurb: "Book 7.5 · Find every angle in a turn with $\\sin\\theta = c$, $\\cos\\theta = c$ or $\\tan\\theta = c$.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which angles in $[0, 2\\pi)$ have $\\sin\\theta = \\dfrac{1}{2}$?",
        options: [{ t: "$\\dfrac{\\pi}{6}$ and $\\dfrac{5\\pi}{6}$" }, { t: "$\\dfrac{\\pi}{6}$ and $\\dfrac{7\\pi}{6}$", fb: "$\\sin\\frac{7\\pi}{6} = -\\frac{1}{2}$: it is in quadrant III, below the axis." }, { t: "$\\dfrac{\\pi}{3}$ and $\\dfrac{2\\pi}{3}$", fb: "Those have sine $\\frac{\\sqrt{3}}{2}$." }],
        answer: 0, skill: "Solving trigonometric equations", hints: ["Sine is positive in quadrants I and II."], why: "$\\frac{\\pi}{6}$ and $\\pi - \\frac{\\pi}{6}$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue wave is $\\sin x$ (or $\\cos x$). Slide the height $c$ of the orange line: its crossings are the solutions of $\\sin x = c$ in one turn. Find a height with **two** solutions, **one** and **none**.",
        scene: { type: "sketch", x: [-0.6, 6.9], y: [-1.8, 1.8], u: 40, w: 348, grid: false, gate: true, pts: {},
          chips: { f: { label: "Wave", v: "sin", opts: [["sin", "sine"], ["cos", "cosine"]] } },
          params: { c: { min: -1.5, max: 1.5, step: 0.25, v: 0.5, label: "height $c$" } },
          track: function (s) { var n = SOL11(s.c.f, s.p.c).length; return n === 2 ? "two" : n === 1 ? "one" : "none"; },
          draw: function (s) { var F = s.c.f === "sin" ? SIN : COS, sol = SOL11(s.c.f, s.p.c), it = waveAx(-0.3, 6.7, -1.7, 1.7).concat(curve(F, 0, 2 * PI, "blue"), [{ seg: [[-0.3, s.p.c], [6.7, s.p.c]], c: "orange" }]); sol.forEach(function (v) { it.push({ seg: [[v, 0], [v, s.p.c]], c: "soft", dash: true }, dot(v, s.p.c, "green")); }); return it; },
          readout: function (s) { var sol = SOL11(s.c.f, s.p.c); return "$\\" + s.c.f + " x = " + nm(s.p.c) + "$ has " + (sol.length === 0 ? "**no** solutions" : sol.length === 1 ? "**one** solution" : "**two** solutions") + " in $[0, 2\\pi)$" + (sol.length ? ": $x \\approx " + sol.map(function (v) { return nm(f4(v, 3)); }).join("$ and $") + "$" : "") + "<br>Two: " + (s.tracked.two ? "✓" : "—") + " · one: " + (s.tracked.one ? "✓" : "—") + " · none: " + (s.tracked.none ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.two && s.tracked.one && s.tracked.none); } },
        gate: true, then: "A horizontal line meets one turn of the wave in **two** places (the wave goes up, then down), in **one** place at the very top or bottom, and in **none** beyond $\\pm 1$. That is why $\\sin\\theta = c$ usually has **two** answers in one turn." },
      { type: "learn", kicker: "The idea",
        prompt: "To solve $\\sin\\theta = c$: **isolate** the function, find the **reference angle** (ignore the sign), then place it in **each quadrant** where the sign matches. That is usually **two** answers in $[0, 2\\pi)$. Adding $2\\pi k$ gives all of them.",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $2\\sin\\theta - 1 = 0$ for $\\theta$ in $[0, 2\\pi)$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "2\\sin\\theta - 1 = 0 \\ \\Rightarrow \\ \\sin\\theta = \\tfrac{1}{2}", say: "Add 1 and divide by 2." },
          { step: 2, m: "\\text{reference angle } \\tfrac{\\pi}{6}", say: "The acute angle with sine $\\frac{1}{2}$." },
          { step: 3, m: "\\theta = \\tfrac{\\pi}{6}, \\ \\tfrac{5\\pi}{6}", say: "Sine is positive in quadrants I and II.", ask: { prompt: "Where is sine positive?", answer: 0, options: [{ t: "Quadrants I and II" }, { t: "Quadrants I and IV", fb: "Quadrant IV is below the $x$-axis: sine is negative there. Cosine is the one positive in I and IV." }] } },
          { step: 3, m: "\\sin\\tfrac{\\pi}{6} = \\sin\\tfrac{5\\pi}{6} = \\tfrac{1}{2}", say: "Check: both angles give the sine we wanted." }] },
        gate: true, then: "$\\theta = \\dfrac{\\pi}{6}$ and $\\dfrac{5\\pi}{6}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $2\\cos\\theta + \\sqrt{2} = 0$ for $\\theta$ in $[0, 2\\pi)$.",
        how: HOW_11, skill: "Solving trigonometric equations",
        steps: [
          { step: 1, ask: "Isolate the cosine.", type: "choice", answer: 0, options: [{ t: "$\\cos\\theta = -\\dfrac{\\sqrt{2}}{2}$" }, { t: "$\\cos\\theta = \\dfrac{\\sqrt{2}}{2}$", fb: "Subtract $\\sqrt{2}$ first: the right side is negative." }], m: "\\cos\\theta = -\\frac{\\sqrt{2}}{2}", say: "Reference angle $\\frac{\\pi}{4}$." },
          { step: 2, ask: "Cosine is **negative** in quadrants…", type: "choice", answer: 0, options: [{ t: "II and III" }, { t: "I and IV", fb: "Cosine is positive there (to the right of the $y$-axis)." }], m: "\\text{quadrants II and III}", say: "To the left of the $y$-axis." },
          { step: 3, ask: "The quadrant II solution is $\\pi - \\dfrac{\\pi}{4} =$ (type an expression such as 7*pi/8)", type: "num", pre: "$\\theta \\approx$", answer: 2.3562, tol: 0.0006, calc: true, near: [{ v: 0.7854, tol: 0.0006, fb: "That is the reference angle, in quadrant I, where the cosine is positive." }, { v: 3.927, tol: 0.0006, fb: "That is the quadrant III solution. We want quadrant II: $\\pi - \\frac{\\pi}{4}$." }], hint: "$3.1416 - 0.7854$.", m: "\\theta = \\tfrac{3\\pi}{4}, \\ \\tfrac{5\\pi}{4}", say: "The quadrant III solution is $\\pi + \\frac{\\pi}{4}$." }],
        why: "Isolate, reference, quadrants." },
      { type: "multi", kicker: "On your own", prompt: "Select **all** the solutions of $\\cos\\theta = \\dfrac{1}{2}$ in $[0, 2\\pi)$.",
        options: [{ t: "$\\dfrac{\\pi}{3}$", ok: true }, { t: "$\\dfrac{5\\pi}{3}$", ok: true }, { t: "$\\dfrac{2\\pi}{3}$", fb: "$\\cos\\frac{2\\pi}{3} = -\\frac{1}{2}$." }, { t: "$\\dfrac{\\pi}{6}$", fb: "$\\cos\\frac{\\pi}{6} = \\frac{\\sqrt{3}}{2}$." }, { t: "$\\dfrac{4\\pi}{3}$", fb: "$\\cos\\frac{4\\pi}{3} = -\\frac{1}{2}$." }],
        skill: "Solving trigonometric equations", hints: ["Cosine is positive in quadrants I and IV."], why: "$\\frac{\\pi}{3}$ in quadrant I and $2\\pi - \\frac{\\pi}{3}$ in quadrant IV." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A value that is not special.** Solve $\\sin\\theta = 0.3$ for $\\theta$ in $[0, 2\\pi)$, with a calculator in radians.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "\\sin\\theta = 0.3", say: "Already isolated." },
          { step: 2, m: "\\theta_{\\text{ref}} = \\arcsin 0.3 \\approx 0.3047", say: "The calculator's inverse sine gives the reference angle." },
          { step: 3, m: "\\theta \\approx 0.3047", say: "Quadrant I." },
          { step: 3, m: "\\theta = \\pi - 0.3047 \\approx 2.8369", say: "Quadrant II: the mirror image.", ask: { prompt: "Why $\\pi - 0.3047$?", answer: 0, options: [{ t: "Sine is also positive in quadrant II, at the mirror-image angle" }, { t: "It is $0.3047$ more than a half turn", fb: "That would be $\\pi + 0.3047$, in quadrant III where sine is negative." }] } }] },
        gate: true, then: "$\\theta \\approx 0.3047$ and $\\theta \\approx 2.8369$. The calculator gives only the **first**; the quadrant gives the second." },
      { type: "num", kicker: "Try it", prompt: "Solve $\\tan\\theta = 1$ for $\\theta$ in $[0, 2\\pi)$. Give the **larger** solution. (Type an expression such as 7*pi/8.)", pre: "$\\theta \\approx$", answer: 3.927, tol: 0.0006, calc: true, skill: "Solving trigonometric equations",
        near: [{ v: 0.7854, tol: 0.0006, fb: "That is the smaller solution, in quadrant I. Tangent is also positive in quadrant III: add $\\pi$." }, { v: 2.3562, tol: 0.0006, fb: "$\\tan\\frac{3\\pi}{4} = -1$. Tangent is positive in quadrants I and III." }], hints: ["The solutions are $\\pi$ apart."], why: "$\\frac{\\pi}{4}$ and $\\frac{\\pi}{4} + \\pi = \\frac{5\\pi}{4}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dan solves $\\sin\\theta = \\dfrac{1}{2}$ for $\\theta$ in $[0, 2\\pi)$ and writes \"$\\theta = \\dfrac{\\pi}{6}$\". What is missing?",
        options: [{ t: "$\\dfrac{5\\pi}{6}$: sine is also positive in quadrant II" }, { t: "$\\dfrac{7\\pi}{6}$: the quadrant III angle", fb: "$\\sin\\frac{7\\pi}{6} = -\\frac{1}{2}$, so it is not a solution." }, { t: "Nothing: one answer is enough.", fb: "The wave reaches height $\\frac{1}{2}$ twice in a turn: on the way up and on the way down." }],
        answer: 0, skill: "Solving trigonometric equations", hints: ["Where else is sine positive?"], why: "The mirror image in quadrant II." },
      { type: "num", kicker: "Use it", prompt: "A point on a circle of radius 1 is $0.8$ above the horizontal axis, in the first quadrant. At what angle, in **degrees**, is it? (The box accepts expressions such as arccos(0.2)*180/pi.)", pre: "$\\theta \\approx$", post: "degrees", answer: 53.13, tol: 0.006, calc: true, skill: "Solving trigonometric equations",
        near: [{ v: 0.9273, tol: 0.001, fb: "That is the angle in radians. Multiply by $\\frac{180}{\\pi}$." }, { v: 36.87, tol: 0.006, fb: "That is the angle from the **vertical** axis: here $\\sin\\theta = 0.8$." }], hints: ["$\\sin\\theta = 0.8$."], why: "$\\arcsin 0.8 \\approx 53.13^\\circ$." }
    ]
  });
  /* ============================================ 12 · Equations that factor, and equations with identities */
  var HOW_12 = [["One function", "Use an identity so only one trigonometric function is left."],
                ["Factor", "Treat it like an ordinary equation: factor, or use the quadratic formula."],
                ["Angles", "Solve each factor for $\\theta$ in every quadrant that works."]];
  var F12 = function (x) { var s = SIN(x); return 2 * s * s - s - 1; };
  LESSONS.push({
    title: "Equations that factor, and identities in equations", art: "pcwave",
    blurb: "Book 7.5 · Treat $\\sin\\theta$ like a letter: factor, or use an identity to leave one function.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Factor $2s^2 - s - 1$.",
        options: [{ t: "$(2s + 1)(s - 1)$" }, { t: "$(2s - 1)(s + 1)$", fb: "That expands to $2s^2 + s - 1$: the middle sign is wrong." }, { t: "$(2s + 1)(s + 1)$", fb: "That expands to $2s^2 + 3s + 1$." }],
        answer: 0, skill: "Factoring", hints: ["Two numbers that multiply to $-2$ and add to $-1$: $-2$ and $1$."], why: "$(2s + 1)(s - 1)$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue graph is $y = 2\\sin^2 x - \\sin x - 1$. The **solutions** of $2\\sin^2 x - \\sin x - 1 = 0$ are where it crosses the axis. Slide $x$ in steps of $30^\\circ$ and find **all three** zeros in one turn.",
        scene: { type: "sketch", x: [-0.6, 6.9], y: [-1.8, 2.6], u: 36, w: 318, grid: false, gate: true, pts: {},
          params: { t: { min: 0, max: 360, step: 30, v: 0, label: "$x$ (°)" } },
          track: function (s) { return Math.abs(F12(s.p.t * DEG)) < 1e-9 ? "z" + s.p.t : null; },
          draw: function (s) { var x = s.p.t * DEG; return waveAx(-0.3, 6.7, -1.6, 2.4).concat(curve(F12, 0, 2 * PI, "blue"), [{ seg: [[x, 0], [x, F12(x)]], c: "soft", dash: true }, dot(x, F12(x), Math.abs(F12(x)) < 1e-9 ? "green" : "orange")]); },
          readout: function (s) { var v = F12(s.p.t * DEG); return "$x = " + s.p.t + "^\\circ$: $2\\sin^2 x - \\sin x - 1 = " + nm(f4(v, 3)) + "$" + (Math.abs(v) < 1e-9 ? " — **a zero!**" : "") + "<br>Zeros found: " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "The zeros are at $x = 90^\\circ$, $210^\\circ$ and $330^\\circ$ ($\\frac{\\pi}{2}$, $\\frac{7\\pi}{6}$, $\\frac{11\\pi}{6}$). Factoring finds them: $(2\\sin x + 1)(\\sin x - 1) = 0$, so $\\sin x = -\\frac{1}{2}$ (two answers) or $\\sin x = 1$ (one)." },
      { type: "learn", kicker: "The idea",
        prompt: "Treat $\\sin\\theta$ like a letter $s$. **Factor** the equation (or use the quadratic formula), solve each factor for $\\sin\\theta$, then find the angles. If two functions appear, use an identity such as $\\cos^2\\theta = 1 - \\sin^2\\theta$ to leave one.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $2\\sin^2\\theta - \\sin\\theta - 1 = 0$ for $\\theta$ in $[0, 2\\pi)$.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "2\\sin^2\\theta - \\sin\\theta - 1 = 0", say: "Only one function: sine." },
          { step: 2, m: "(2\\sin\\theta + 1)(\\sin\\theta - 1) = 0", say: "Factor it like $2s^2 - s - 1$.", ask: { prompt: "A product is 0 when…", answer: 0, options: [{ t: "at least one factor is 0" }, { t: "both factors are 0", fb: "Either is enough: $5 \\cdot 0 = 0$. So solve **each** factor." }] } },
          { step: 3, m: "\\sin\\theta = -\\tfrac{1}{2} \\ \\Rightarrow \\ \\theta = \\tfrac{7\\pi}{6}, \\tfrac{11\\pi}{6}", say: "Negative: quadrants III and IV." },
          { step: 3, m: "\\sin\\theta = 1 \\ \\Rightarrow \\ \\theta = \\tfrac{\\pi}{2}", say: "The top of the wave: only one solution." }] },
        gate: true, then: "$\\theta = \\dfrac{\\pi}{2}$, $\\dfrac{7\\pi}{6}$ and $\\dfrac{11\\pi}{6}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $2\\cos^2\\theta + \\cos\\theta = 0$ for $\\theta$ in $[0, 2\\pi)$.",
        how: HOW_12, skill: "Solving by factoring",
        steps: [
          { step: 1, ask: "What is the right first move?", type: "choice", answer: 0, options: [{ t: "Factor out $\\cos\\theta$" }, { t: "Divide both sides by $\\cos\\theta$", fb: "Dividing by $\\cos\\theta$ throws away the solutions where $\\cos\\theta = 0$. Factor instead." }], m: "\\cos\\theta(2\\cos\\theta + 1) = 0", say: "Two factors." },
          { step: 2, ask: "$\\cos\\theta = 0$ gives…", type: "choice", answer: 0, options: [{ t: "$\\dfrac{\\pi}{2}$ and $\\dfrac{3\\pi}{2}$" }, { t: "$0$ and $\\pi$", fb: "Those are where the **sine** is 0. Cosine is 0 at the top and bottom of the circle." }], m: "\\theta = \\tfrac{\\pi}{2}, \\tfrac{3\\pi}{2}", say: "Two solutions." },
          { step: 3, ask: "$2\\cos\\theta + 1 = 0$ means $\\cos\\theta = -\\frac{1}{2}$, with two more solutions. How many solutions in all?", type: "num", pre: "solutions =", answer: 4, near: [{ v: 2, fb: "Each factor gives two: $\\frac{\\pi}{2}, \\frac{3\\pi}{2}$ and $\\frac{2\\pi}{3}, \\frac{4\\pi}{3}$." }, { v: 3, fb: "Cosine is negative in quadrants II **and** III: two solutions from this factor." }], hint: "$2 + 2$.", m: "\\theta = \\tfrac{\\pi}{2}, \\tfrac{2\\pi}{3}, \\tfrac{4\\pi}{3}, \\tfrac{3\\pi}{2}", say: "Four solutions." }],
        why: "One function, factor, angles." },
      { type: "choice", kicker: "On your own", prompt: "Which first step leaves **one** function in $2\\cos^2\\theta + \\sin\\theta - 1 = 0$?",
        options: [{ t: "Replace $\\cos^2\\theta$ by $1 - \\sin^2\\theta$" }, { t: "Replace $\\sin\\theta$ by $1 - \\cos\\theta$", fb: "That is not an identity. The Pythagorean identity involves **squares**." }, { t: "Divide everything by $\\cos^2\\theta$", fb: "That changes the terms but leaves both functions." }],
        answer: 0, skill: "Equations with identities", hints: ["Which term is squared?"], why: "$\\cos^2\\theta = 1 - \\sin^2\\theta$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Two functions.** Solve $2\\cos^2\\theta + \\sin\\theta = 1$ for $\\theta$ in $[0, 2\\pi)$.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "2\\cos^2\\theta + \\sin\\theta - 1 = 0", say: "Move everything to one side." },
          { step: 1, m: "2(1 - \\sin^2\\theta) + \\sin\\theta - 1 = 0", say: "Replace $\\cos^2\\theta$ by $1 - \\sin^2\\theta$.", ask: { prompt: "Why replace $\\cos^2\\theta$?", answer: 0, options: [{ t: "So that only sine is left" }, { t: "Because cosine is harder", fb: "It is so that **one** function remains: then it is an ordinary equation." }] } },
          { step: 2, m: "2\\sin^2\\theta - \\sin\\theta - 1 = 0", say: "Expand, tidy, and multiply by $-1$: it is the equation we have just solved!" },
          { step: 3, m: "\\theta = \\tfrac{\\pi}{2}, \\ \\tfrac{7\\pi}{6}, \\ \\tfrac{11\\pi}{6}", say: "The same three solutions." }] },
        gate: true, then: "$\\theta = \\dfrac{\\pi}{2}$, $\\dfrac{7\\pi}{6}$ and $\\dfrac{11\\pi}{6}$." },
      { type: "num", kicker: "Try it", prompt: "Solve $2\\sin^2\\theta = \\sin\\theta$ for $\\theta$ in $[0, 2\\pi)$. What is the **largest** solution? (Type an expression such as 7*pi/8.)", pre: "$\\theta \\approx$", answer: 3.1416, tol: 0.0006, calc: true, skill: "Solving by factoring",
        near: [{ v: 2.618, tol: 0.0006, fb: "That is $\\frac{5\\pi}{6}$, from $\\sin\\theta = \\frac{1}{2}$. But $\\sin\\theta = 0$ also works, at $\\theta = \\pi$, which is larger." }], hints: ["$\\sin\\theta(2\\sin\\theta - 1) = 0$."], why: "$\\sin\\theta = 0$ gives $0$ and $\\pi$; $\\sin\\theta = \\frac{1}{2}$ gives $\\frac{\\pi}{6}$ and $\\frac{5\\pi}{6}$. The largest is $\\pi$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Eli solves $\\sin\\theta\\cos\\theta = \\sin\\theta$. Tap the line where the work **first** goes wrong.",
        lines: ["\\sin\\theta\\cos\\theta = \\sin\\theta", "\\cos\\theta = 1", "\\theta = 0"], answer: 1, fix: "\\sin\\theta(\\cos\\theta - 1) = 0",
        fb: { 0: GIVEN, 2: LATER }, skill: "Solving by factoring",
        hints: ["What if $\\sin\\theta = 0$?"], why: "Dividing by $\\sin\\theta$ loses the solutions where $\\sin\\theta = 0$ ($\\theta = \\pi$ as well as $0$). Move everything to one side and **factor**." },
      { type: "num", kicker: "Use it", prompt: "The vertical speed of a bouncing part is $v = 2\\sin^2 t - \\sin t$ cm/s, $t$ in seconds. When is the speed first zero **after** the start? (Type an expression such as 7*pi/8.)", pre: "$t \\approx$", post: "s", answer: 0.5236, tol: 0.0006, calc: true, skill: "Solving by factoring",
        near: [{ v: 0, fb: "The question asks for the first time **after** the start: $t = 0$ is the start." }, { v: 1.5708, tol: 0.0006, fb: "That is where $\\sin t = 1$, and $v = 1$ there. Solve $v = 0$: $\\sin t(2\\sin t - 1) = 0$." }], hints: ["$\\sin t(2\\sin t - 1) = 0$."], why: "$\\sin t = \\frac{1}{2}$ first at $t = \\frac{\\pi}{6} \\approx 0.5236$ s." }
    ]
  });

  /* ============================================ 13 · Multiple angles and all the solutions */
  var HOW_13 = [["Inside angle", "Treat $B\\theta$ as one angle and solve it over $B$ whole turns, $[0, 2\\pi B)$."],
                ["Divide", "Divide every answer by $B$."],
                ["Check range", "Keep only the $\\theta$ in the interval asked for."]];
  LESSONS.push({
    title: "Multiple angles and all the solutions", art: "pcwave",
    blurb: "Book 7.5 · Solve $\\sin 2\\theta = c$ over a full turn, then write every solution with $2\\pi k$.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "As $\\theta$ goes from $0$ to $2\\pi$, how many full cycles does $\\sin 2\\theta$ make?",
        options: [{ t: "2" }, { t: "1", fb: "$\\sin\\theta$ makes one. The 2 inside doubles the speed." }, { t: "4", fb: "The period of $\\sin 2\\theta$ is $\\frac{2\\pi}{2} = \\pi$: two cycles fit in $2\\pi$." }],
        answer: 0, skill: "Multiple angles", hints: ["The period is $\\frac{2\\pi}{B}$."], why: "Period $\\pi$: two cycles in $2\\pi$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the line to height $\\frac{1}{2}$, then switch between the three waves. Count the solutions of $\\sin(Bx) = \\frac{1}{2}$ in one turn for **all three**.",
        scene: { type: "sketch", x: [-0.6, 6.9], y: [-1.8, 1.8], u: 40, w: 348, grid: false, gate: true, pts: {},
          chips: { b: { label: "Wave", v: "1", opts: [["1", "sin x"], ["2", "sin 2x"], ["3", "sin 3x"]] } },
          params: { c: { min: -1, max: 1, step: 0.25, v: 0, label: "height $c$" } },
          track: function (s) { return s.p.c === 0.5 ? "b" + s.c.b : null; },
          draw: function (s) { var B = +s.c.b, F = function (x) { return SIN(B * x); }, it = waveAx(-0.3, 6.7, -1.7, 1.7).concat(curve(F, 0, 2 * PI, "blue"), [{ seg: [[-0.3, s.p.c], [6.7, s.p.c]], c: "orange" }]); SOL11("sin", s.p.c).forEach(function (v) { for (var k = 0; k < B; k++) { var x = (v + 2 * PI * k) / B; it.push({ seg: [[x, 0], [x, s.p.c]], c: "soft", dash: true }, dot(x, s.p.c, "green")); } }); return it; },
          readout: function (s) { var B = +s.c.b, n = Math.abs(s.p.c) < 1 ? 2 * B : B; return "$\\sin(" + (B === 1 ? "" : B) + "x) = " + nm(s.p.c) + "$ has **" + n + "** solutions in $[0, 2\\pi)$<br>Counted at $c = \\frac{1}{2}$: " + (s.tracked.b1 ? "sin x ✓ " : "") + (s.tracked.b2 ? "sin 2x ✓ " : "") + (s.tracked.b3 ? "sin 3x ✓" : "") + (Object.keys(s.tracked).length ? "" : "—"); },
          goal: function (s) { return !!(s.tracked.b1 && s.tracked.b2 && s.tracked.b3); } },
        gate: true, then: "$\\sin x = \\frac{1}{2}$ has **2** solutions in a turn, $\\sin 2x = \\frac{1}{2}$ has **4**, $\\sin 3x = \\frac{1}{2}$ has **6**. The wave repeats $B$ times in one turn, so there are $2B$ solutions." },
      { type: "learn", kicker: "The idea",
        prompt: "For $\\sin(B\\theta) = c$ on $[0, 2\\pi)$: the angle $B\\theta$ runs through $[0, 2\\pi B)$, which is **$B$ turns**. Solve for $B\\theta$ in all those turns, then **divide every answer by $B$**. That gives $2B$ solutions (usually).",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $\\sin 2\\theta = \\dfrac{\\sqrt{3}}{2}$ for $\\theta$ in $[0, 2\\pi)$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "2\\theta \\in [0, 4\\pi)", say: "Two whole turns for the angle $2\\theta$." },
          { step: 1, m: "2\\theta = \\tfrac{\\pi}{3}, \\tfrac{2\\pi}{3}, \\tfrac{7\\pi}{3}, \\tfrac{8\\pi}{3}", say: "Sine is $\\frac{\\sqrt{3}}{2}$ at $\\frac{\\pi}{3}$ and $\\frac{2\\pi}{3}$, and again one turn later.", ask: { prompt: "One turn later means adding…", answer: 0, options: [{ t: "$2\\pi$" }, { t: "$\\pi$", fb: "A **whole turn** is $2\\pi$. Adding $\\pi$ would flip the sign." }] } },
          { step: 2, m: "\\theta = \\tfrac{\\pi}{6}, \\tfrac{\\pi}{3}, \\tfrac{7\\pi}{6}, \\tfrac{4\\pi}{3}", say: "Divide each by 2." },
          { step: 3, m: "\\text{all four are in } [0, 2\\pi)", say: "Keep only the $\\theta$ in the interval: here, all four." }] },
        gate: true, then: "Four solutions: $\\dfrac{\\pi}{6}$, $\\dfrac{\\pi}{3}$, $\\dfrac{7\\pi}{6}$ and $\\dfrac{4\\pi}{3}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $\\tan 2\\theta = 1$ for $\\theta$ in $[0, 2\\pi)$.",
        how: HOW_13, skill: "Multiple angles",
        steps: [
          { step: 1, ask: "Over what interval does $2\\theta$ run?", type: "choice", answer: 0, options: [{ t: "$[0, 4\\pi)$" }, { t: "$[0, 2\\pi)$", fb: "That is for $\\theta$. Doubling $\\theta$ doubles the interval." }], m: "2\\theta \\in [0, 4\\pi)", say: "Two whole turns." },
          { step: 2, ask: "Tangent repeats every $\\pi$. How many times is $\\tan(2\\theta) = 1$ for $2\\theta$ in $[0, 4\\pi)$?", type: "num", pre: "solutions =", answer: 4, near: [{ v: 2, fb: "Tangent has one solution per $\\pi$, and $[0, 4\\pi)$ holds four of those." }], hint: "One per $\\pi$.", m: "2\\theta = \\tfrac{\\pi}{4}, \\tfrac{5\\pi}{4}, \\tfrac{9\\pi}{4}, \\tfrac{13\\pi}{4}", say: "Add $\\pi$ each time." },
          { step: 2, ask: "The smallest $\\theta$ is $\\dfrac{\\pi/4}{2}$. (type an expression such as 7*pi/10)", type: "num", pre: "$\\theta \\approx$", answer: 0.3927, tol: 0.0006, calc: true, near: [{ v: 0.7854, tol: 0.0006, fb: "That is $2\\theta$. Divide by 2." }], hint: "$\\frac{3.1416}{8}$.", m: "\\theta = \\tfrac{\\pi}{8}, \\tfrac{5\\pi}{8}, \\tfrac{9\\pi}{8}, \\tfrac{13\\pi}{8}", say: "Divide all four by 2." },
          { step: 3, ask: "Does every one of the four values of $\\theta$ lie in $[0, 2\\pi)$?", type: "choice", answer: 0, options: [{ t: "Yes: the largest, $\\frac{13\\pi}{8}$, is less than $2\\pi$" }, { t: "No: drop the last one", fb: "$\\frac{13\\pi}{8} \\approx 5.1$ is less than $2\\pi \\approx 6.28$. Because we started with the interval $[0, 4\\pi)$ for $2\\theta$, every answer lands in $[0, 2\\pi)$." }], m: "\\text{all four are in } [0, 2\\pi)", say: "Keep only the $\\theta$ in the interval." }],
        why: "Inside angle, divide, check range." },
      { type: "num", kicker: "On your own", prompt: "How many solutions does $\\cos 3\\theta = 0.2$ have in $[0, 2\\pi)$?", pre: "solutions =", answer: 6, skill: "Multiple angles",
        near: [{ v: 2, fb: "That is for $\\cos\\theta = 0.2$. Tripling the angle triples the count." }, { v: 3, fb: "Each of the 3 turns gives **two** solutions." }], hints: ["$2B$ solutions."], why: "$2 \\times 3 = 6$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**All** the solutions, not just one turn. Solve $\\sin x = \\dfrac{1}{2}$ for every real $x$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "\\sin x = \\tfrac{1}{2}", say: "No interval is given, so we want **every** solution." },
          { step: 1, m: "x = \\tfrac{\\pi}{6}, \\ \\tfrac{5\\pi}{6}", say: "In one turn." },
          { step: 2, m: "x = \\tfrac{\\pi}{6} + 2\\pi k, \\ \\ x = \\tfrac{5\\pi}{6} + 2\\pi k", say: "Add any whole number of turns.", ask: { prompt: "What does $k$ stand for?", answer: 0, options: [{ t: "Any whole number, positive or negative" }, { t: "Only positive whole numbers", fb: "Negative $k$ goes backwards: the wave has always repeated in both directions." }] } },
          { step: 3, m: "\\tan x = 1: \\ x = \\tfrac{\\pi}{4} + \\pi k", say: "Tangent repeats every $\\pi$, so one family is enough." }] },
        gate: true, then: "Two families, $x = \\dfrac{\\pi}{6} + 2\\pi k$ and $x = \\dfrac{5\\pi}{6} + 2\\pi k$." },
      { type: "num", kicker: "Try it", prompt: "Solve $\\sin 2\\theta = 0.5$ for $\\theta$ in $[0, 2\\pi)$. What is the **largest** solution? (Type an expression such as 7*pi/10.)", pre: "$\\theta \\approx$", answer: 4.4506, tol: 0.0006, calc: true, skill: "Multiple angles",
        near: [{ v: 1.309, tol: 0.0006, fb: "That is $\\frac{5\\pi}{12}$, the largest in the **first** turn of $2\\theta$. $2\\theta$ runs through two turns." }, { v: 3.4034, tol: 0.0006, fb: "That is $\\frac{13\\pi}{12}$, a solution, but not the largest: the last one is $\\frac{17\\pi}{12}$." }], hints: ["$2\\theta = \\frac{\\pi}{6}, \\frac{5\\pi}{6}, \\frac{13\\pi}{6}, \\frac{17\\pi}{6}$."], why: "$2\\theta = \\frac{17\\pi}{6}$, so $\\theta = \\frac{17\\pi}{12} \\approx 4.4506$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kai solves $\\sin 2\\theta = \\dfrac{1}{2}$ for $\\theta$ in $[0, 2\\pi)$ and gets $\\dfrac{\\pi}{12}$ and $\\dfrac{5\\pi}{12}$ (half of $\\frac{\\pi}{6}$ and $\\frac{5\\pi}{6}$). What did he miss?",
        options: [{ t: "$2\\theta$ goes round **twice**: two more solutions, $\\frac{13\\pi}{12}$ and $\\frac{17\\pi}{12}$" }, { t: "Nothing: two solutions are right", fb: "The wave $\\sin 2\\theta$ completes two cycles in $[0, 2\\pi)$, so it reaches $\\frac{1}{2}$ four times." }, { t: "He should have multiplied by 2, not divided", fb: "To solve for $\\theta$ from $2\\theta$ we divide. The error is that the interval for $2\\theta$ is $[0, 4\\pi)$." }],
        answer: 0, skill: "Multiple angles", hints: ["How many cycles does $\\sin 2\\theta$ make in $[0, 2\\pi)$?"], why: "$2B = 4$ solutions." },
      { type: "num", kicker: "Use it", prompt: "A cannon fires at $20$ m/s at a target $30$ m away on level ground. The range is $\\dfrac{v^2\\sin 2\\theta}{9.8}$, so $\\sin 2\\theta = 0.735$. What is the **lower** launch angle, in degrees? (The box accepts expressions such as arccos(0.2)*180/pi.)", pre: "$\\theta \\approx$", post: "degrees", answer: 23.65, tol: 0.006, calc: true, skill: "Multiple angles",
        near: [{ v: 47.31, tol: 0.006, fb: "That is $2\\theta$. Divide by 2 to get $\\theta$." }, { v: 66.35, tol: 0.006, fb: "That is the **higher** angle, $90^\\circ - \\theta$. The question asks for the lower one." }], hints: ["$2\\theta = \\arcsin 0.735$."], why: "$2\\theta \\approx 47.31^\\circ$, so $\\theta \\approx 23.65^\\circ$; the higher angle $66.35^\\circ$ also hits the target." }
    ]
  });

  /* ============================================ 14 · Modeling with trigonometric equations */
  var HOW_14 = [["Equation", "Set the model equal to the target value."],
                ["Solve", "Isolate the trig function and find every inside angle in one cycle."],
                ["Times", "Solve for $t$ and keep the ones in the window."]];
  var TIDE = function (t) { return 5 + 3 * COS(PI * t / 6); };
  LESSONS.push({
    title: "Modeling with trigonometric equations", art: "pcwave",
    blurb: "Book 7.6 · When does the tide reach 6.5 metres? When is the wheel at 35? Solve the model for time.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A tide model is $h(t) = 3\\cos\\left(\\dfrac{\\pi}{6}t\\right) + 5$ metres. What is the height at $t = 0$?", pre: "$h(0) =$", post: "m", answer: 8, skill: "Evaluate a sinusoidal model",
        near: [{ v: 5, fb: "That is the midline. At $t = 0$, $\\cos 0 = 1$, so add the full amplitude." }, { v: 3, fb: "That is the amplitude. Add the midline 5 as well." }], hints: ["$\\cos 0 = 1$."], why: "$3 + 5 = 8$ m: high tide." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue curve is the tide height over a day. Slide the **line** $c$ and read how many hours the water stays **above** it. Find the line where it is above for **exactly half the day**, and the line where the water **only touches** it.",
        scene: { type: "sketch", x: [-2, 26], y: [0, 9.5], u: 12, uy: 28, gx: 6, step: 6, gy: 2, stepY: 2, w: 384, gate: true, pts: {},
          params: { c: { min: 2, max: 8, step: 1, v: 3, label: "line $c$ (m)" } },
          track: function (s) { return s.p.c === 5 ? "mid" : s.p.c === 8 ? "top" : null; },
          draw: function (s) { var c = s.p.c, it = curve(TIDE, 0, 24, "blue").concat([{ seg: [[0, c], [24, c]], c: "orange" }]), k = (c - 5) / 3; if (Math.abs(k) <= 1) { var a = 6 * Math.acos(k) / PI; [a, 12 - a, 12 + a, 24 - a].forEach(function (t) { if (t >= 0 && t <= 24) it.push(dot(t, c, "green")); }); } return it; },
          readout: function (s) { var c = s.p.c, k = (c - 5) / 3, hrs = k >= 1 ? 0 : k <= -1 ? 24 : 24 * Math.acos(k) / PI; return "Water above $" + c + "$ m for **" + nm(f4(hrs, 1)) + "** hours of the day<br>Half the day: " + (s.tracked.mid ? "✓" : "—") + " · only touches: " + (s.tracked.top ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.mid && s.tracked.top); } },
        gate: true, then: "At the **midline**, $c = 5$, the water is above for exactly **12 hours**. At $c = 8$, the top of the wave, it only touches the line. In between, the crossing times are the **solutions** of $3\\cos\\frac{\\pi t}{6} + 5 = c$: solving that equation is today's job." },
      { type: "learn", kicker: "The idea",
        prompt: "To find **when** a model hits a value, set the model equal to it and **solve for $t$**: isolate the trig function, find the inside angles in one cycle, then divide by $B$. Use the **period** to list every repeat in the time window.",
        scene: { type: "method", how: HOW_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "A Ferris wheel car's height is $h(t) = -20\\cos\\dfrac{\\pi t}{40} + 25$ metres. When is it at $35$ m?",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "-20\\cos\\tfrac{\\pi t}{40} + 25 = 35", say: "Set the model equal to the height." },
          { step: 2, m: "\\cos\\tfrac{\\pi t}{40} = -\\tfrac{1}{2}", say: "Subtract 25, then divide by $-20$.", ask: { prompt: "$10 \\div (-20) =$", answer: 0, options: [{ t: "$-\\frac{1}{2}$" }, { t: "$\\frac{1}{2}$", fb: "Dividing by a negative number flips the sign." }] } },
          { step: 2, m: "\\tfrac{\\pi t}{40} = \\tfrac{2\\pi}{3}, \\ \\tfrac{4\\pi}{3}", say: "Cosine is $-\\frac{1}{2}$ in quadrants II and III." },
          { step: 3, m: "t = \\tfrac{80}{3}, \\ \\tfrac{160}{3}", say: "Multiply each by $\\frac{40}{\\pi}$." },
          { step: 3, m: "t \\approx 26.7 \\text{ s}, \\ 53.3 \\text{ s}", say: "On the way up and on the way down. The wheel repeats every 80 s." }] },
        gate: true, then: "$t \\approx 26.7$ s and $53.3$ s, then again $80$ s later." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the **first** time the tide $h(t) = 3\\cos\\dfrac{\\pi t}{6} + 5$ is at $6.5$ m.",
        how: HOW_14, skill: "Modeling with trigonometric equations",
        steps: [
          { step: 1, ask: "$3\\cos\\dfrac{\\pi t}{6} + 5 = 6.5$, so $\\cos\\dfrac{\\pi t}{6} = \\dfrac{6.5 - 5}{3} =$", type: "num", pre: "$\\cos\\frac{\\pi t}{6} =$", answer: 0.5, near: [{ v: 1.5, fb: "That is $6.5 - 5$. Divide by 3 as well." }], hint: "$\\frac{1.5}{3}$.", m: "\\cos\\tfrac{\\pi t}{6} = \\tfrac{1}{2}", say: "Isolated." },
          { step: 2, ask: "The first angle with cosine $\\frac{1}{2}$ is…", type: "choice", answer: 0, options: [{ t: "$\\dfrac{\\pi}{3}$" }, { t: "$\\dfrac{\\pi}{6}$", fb: "$\\cos\\frac{\\pi}{6} = \\frac{\\sqrt{3}}{2}$. The angle with cosine $\\frac{1}{2}$ is $\\frac{\\pi}{3}$." }], m: "\\tfrac{\\pi t}{6} = \\tfrac{\\pi}{3}", say: "The inside angle." },
          { step: 3, ask: "$\\dfrac{\\pi t}{6} = \\dfrac{\\pi}{3}$ gives $t =$", type: "num", pre: "$t =$", post: "hours", answer: 2, near: [{ v: 0.5236, tol: 0.0006, fb: "That is $\\frac{\\pi}{6}$. Multiply both sides by $\\frac{6}{\\pi}$: $t = \\frac{\\pi}{3}\\cdot\\frac{6}{\\pi}$." }], hint: "$\\frac{\\pi}{3} \\cdot \\frac{6}{\\pi}$.", m: "t = 2", say: "At 2 am. It is again 6.5 m at $t = 10$." }],
        why: "Equation, solve, times." },
      { type: "num", kicker: "On your own", prompt: "The temperature is $T = 60 + 15\\sin\\left(\\dfrac{\\pi}{12}(t - 9)\\right)$ °F, $t$ in hours after midnight. At what hour is it first $67.5$ °F? (Type the hour.)", pre: "$t =$", answer: 11, skill: "Modeling with trigonometric equations",
        near: [{ v: 19, fb: "That is the **second** time, as it cools down in the evening. The first time is on the way up." }, { v: 2, fb: "That is $\\frac{\\pi}{6}$ divided by $\\frac{\\pi}{12}$, the time **since 9 am**. Add the shift: $t - 9 = 2$." }], hints: ["$\\sin(\\cdot) = \\frac{7.5}{15} = 0.5$, so the inside is $\\frac{\\pi}{6}$."], why: "$\\frac{\\pi}{12}(t - 9) = \\frac{\\pi}{6}$, so $t - 9 = 2$ and $t = 11$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**For how long?** For how many hours of a day is the tide above $6.5$ m?",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "3\\cos\\tfrac{\\pi t}{6} + 5 > 6.5", say: "\"Above\" is an **inequality**. First find where it **equals** 6.5." },
          { step: 2, m: "\\cos\\tfrac{\\pi t}{6} = \\tfrac{1}{2} \\ \\Rightarrow \\ t = 2, \\ 10", say: "In one 12-hour cycle: $\\frac{\\pi t}{6} = \\frac{\\pi}{3}$ or $\\frac{5\\pi}{3}$.", ask: { prompt: "Between $t = 2$ and $t = 10$ the tide is…", answer: 0, options: [{ t: "below 6.5 m: the low tide is at $t = 6$" }, { t: "above 6.5 m", fb: "At $t = 6$ the cosine is $-1$ and the height is $2$ m: the water is low." }] } },
          { step: 3, m: "\\text{above for } t \\in [-2, 2]: \\ 4 \\text{ hours}", say: "High tide is at $t = 0$: two hours either side. That is 4 hours per cycle." },
          { step: 3, m: "2 \\text{ cycles a day} \\ \\Rightarrow \\ 8 \\text{ hours}", say: "Two high tides a day." }] },
        gate: true, then: "The tide is above $6.5$ m for **8 hours** a day." },
      { type: "num", kicker: "Try it", prompt: "Daylight in hours is $D = 12 + 3\\sin\\dfrac{2\\pi(d - 80)}{365}$ on day $d$ of the year. On which day is it first $13.5$ hours? (The box accepts expressions such as 3*sin(0.2).)", pre: "$d \\approx$", answer: 110.4167, tol: 0.006, calc: true, skill: "Modeling with trigonometric equations",
        near: [{ v: 30.4167, tol: 0.006, fb: "That is $d - 80$. Add the shift of 80." }, { v: 232.083, tol: 0.006, fb: "That is the **second** day, in the autumn, when the days shorten. We want the first." }], hints: ["$\\sin(\\cdot) = \\frac{1.5}{3} = 0.5$: the inside angle is $\\frac{\\pi}{6}$."], why: "$\\frac{2\\pi(d - 80)}{365} = \\frac{\\pi}{6}$, so $d - 80 = \\frac{365}{12} \\approx 30.4$ and $d \\approx 110.4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A student solves $3\\cos\\dfrac{\\pi t}{6} + 5 = 6.5$, gets $\\cos\\dfrac{\\pi t}{6} = \\dfrac{1}{2}$ and writes $t = \\dfrac{\\pi}{3}$ hours. What is wrong?",
        options: [{ t: "$\\frac{\\pi}{3}$ is the **inside angle** $\\frac{\\pi t}{6}$, not $t$: multiplying by $\\frac{6}{\\pi}$ gives $t = 2$" }, { t: "Nothing: $t = \\frac{\\pi}{3}$ hours.", fb: "Time in hours should be a plain number like 2: $\\frac{\\pi}{3} \\approx 1.05$ would not reproduce 6.5 m. Check: $h(1.05) \\approx 3\\cos 0.52 + 5 \\approx 7.6$." }, { t: "The cosine should be $\\frac{3}{2}$", fb: "$\\frac{6.5 - 5}{3} = \\frac{1}{2}$ is right." }],
        answer: 0, skill: "Modeling with trigonometric equations", hints: ["Does the answer give $h = 6.5$ when you plug it back in?"], why: "Solve for $t$: $t = \\frac{\\pi}{3} \\cdot \\frac{6}{\\pi} = 2$." },
      { type: "num", kicker: "Use it", prompt: "A mass on a spring has height $y = 4\\cos(2\\pi t)$ cm. When is it first at $-2$ cm? (A decimal or fraction is fine.)", pre: "$t \\approx$", post: "s", answer: 0.3333, tol: 0.0006, calc: true, skill: "Modeling with trigonometric equations",
        near: [{ v: 0.6667, tol: 0.0006, fb: "That is the **second** time, at $2\\pi t = \\frac{4\\pi}{3}$. The first is at $\\frac{2\\pi}{3}$." }, { v: 2.0944, tol: 0.0006, fb: "That is the angle $2\\pi t = \\frac{2\\pi}{3}$, not $t$. Divide by $2\\pi$." }], hints: ["$\\cos(2\\pi t) = -\\frac{1}{2}$."], why: "$2\\pi t = \\frac{2\\pi}{3}$, so $t = \\frac{1}{3}$ s." }
    ]
  });
  /* ================================================================ Skills */
  var TRIP7 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  var QN7 = ["I", "II", "III", "IV"];
  var VT = function (v) { return nm(f4(v, 4)); };
  // cos 90° is 6e-17 in floating point: round so a key never reads as 6.1e-17.
  var CX = function (k) { return k === 1 ? "" : String(k); };
  var RD = function (v) { return Math.round(v * 1e9) / 1e9; };
  // A variable written after a function name: "\\sin x" or "\\sin\\theta".
  var VX = function (v) { return v.length > 1 ? v : " " + v; };
  var SQ2 = Math.sqrt(2), SQ3 = Math.sqrt(3);
  // The values sine and cosine take at the special angles, with their TeX.
  var SPV = [{ v: 0.5, t: "\\frac{1}{2}" }, { v: -0.5, t: "-\\frac{1}{2}" }, { v: SQ2 / 2, t: "\\frac{\\sqrt{2}}{2}" }, { v: -SQ2 / 2, t: "-\\frac{\\sqrt{2}}{2}" }, { v: SQ3 / 2, t: "\\frac{\\sqrt{3}}{2}" }, { v: -SQ3 / 2, t: "-\\frac{\\sqrt{3}}{2}" }];
  var TNV = [{ v: 1, t: "1" }, { v: -1, t: "-1" }, { v: SQ3, t: "\\sqrt{3}" }, { v: -SQ3, t: "-\\sqrt{3}" }, { v: 1 / SQ3, t: "\\frac{\\sqrt{3}}{3}" }, { v: -1 / SQ3, t: "-\\frac{\\sqrt{3}}{3}" }];
  // Solutions of f(theta) = c in [0, 2pi), f = sin, cos or tan.
  var SOLF = function (f, c) {
    if (f !== "tan") return SOL11(f, c);
    var a = ((Math.atan(c) % PI) + PI) % PI;
    return [a, a + PI];
  };
  // "-\\frac{5}{13}" as the plain fraction "-5/13" for a hint in a prompt.
  var PLAIN = function (n, d) { var g = GC7(n, d); n /= g; d /= g; return d === 1 ? String(n) : n + "/" + d; };
  var SKILLS = [
    { id: "pc7-recip", title: "Reciprocal and quotient identities", lesson: 2,
      gen: function (R) {
        var P = [["\\tan#\\cos#", "sin"], ["\\dfrac{\\sin#}{\\tan#}", "cos"], ["\\sin#\\sec#", "tan"], ["\\dfrac{\\cos#}{\\cot#}", "sin"], ["\\cot#\\sin#", "cos"], ["\\dfrac{\\sec#}{\\csc#}", "tan"], ["\\csc#\\cos#", "cot"], ["\\cot#\\sec#", "csc"], ["\\tan#\\csc#", "sec"], ["\\dfrac{\\csc#}{\\sec#}", "cot"]];
        var v = R.pick(["\\theta", "x", "t", "A"]), p = R.pick(P), V = VX(v), ex = p[0].replace(/#/g, V), right = p[1];
        var wrong = R.shuffle(["sin", "cos", "tan", "cot", "sec", "csc"].filter(function (f) { return f !== right; })).slice(0, 3).map(function (f) { return { t: "$\\" + f + V + "$", fb: "Write every function with sine and cosine and cancel: $" + ex + " = \\" + right + V + "$, not $\\" + f + V + "$." }; });
        return mc(R, { prompt: "Simplify $" + ex + "$ to a single function.", right: "$\\" + right + V + "$", wrong: wrong, keep: true, hints: ["Write each function with sine and cosine, then cancel."], why: "$" + ex + " = \\" + right + V + "$." });
      } },
    { id: "pc7-pyth", title: "Pythagorean identities", lesson: 3,
      gen: function (R) {
        var T = R.pick(TRIP7), c = T[2], sw = R.chance(0.5), o = sw ? T[0] : T[1], ad = sw ? T[1] : T[0], q = R.int(1, 4), t = R.int(0, 2);
        var sS = q <= 2 ? 1 : -1, cS = (q === 1 || q === 4) ? 1 : -1, qn = "quadrant " + QN7[q - 1];
        var sgn = function (x) { return x < 0 ? "negative" : "positive"; };
        if (t === 0) { var a0 = cS * ad / c; return { type: "num", prompt: "If $\\sin\\theta = " + ratTex(sS * o, c) + "$ and $\\theta$ is in " + qn + ", find $\\cos\\theta$. (A fraction is fine.)", pre: "$\\cos\\theta =$", answer: RD(a0), tol: 0.001, near: near(a0, [{ v: -a0, tol: 0.001, fb: "Check the sign: in " + qn + " the cosine is " + sgn(a0) + "." }, { v: o / c, tol: 0.001, fb: "That is the size of the sine. Use $\\cos^2\\theta = 1 - \\sin^2\\theta$." }]), hints: ["$\\cos^2\\theta = 1 - \\sin^2\\theta$, then choose the sign from the quadrant."], why: "$\\cos\\theta = " + ratTex(cS * ad, c) + "$." }; }
        if (t === 1) { var a1 = sS * o / c; return { type: "num", prompt: "If $\\cos\\theta = " + ratTex(cS * ad, c) + "$ and $\\theta$ is in " + qn + ", find $\\sin\\theta$. (A fraction is fine.)", pre: "$\\sin\\theta =$", answer: RD(a1), tol: 0.001, near: near(a1, [{ v: -a1, tol: 0.001, fb: "Check the sign: in " + qn + " the sine is " + sgn(a1) + "." }, { v: ad / c, tol: 0.001, fb: "That is the size of the cosine. Use $\\sin^2\\theta = 1 - \\cos^2\\theta$." }]), hints: ["$\\sin^2\\theta = 1 - \\cos^2\\theta$, then choose the sign from the quadrant."], why: "$\\sin\\theta = " + ratTex(sS * o, c) + "$." }; }
        var a2 = cS * c / ad;
        return { type: "num", prompt: "If $\\tan\\theta = " + ratTex(sS * cS * o, ad) + "$ and $\\theta$ is in " + qn + ", find $\\sec\\theta$. (A fraction is fine.)", pre: "$\\sec\\theta =$", answer: RD(a2), tol: 0.001, near: near(a2, [{ v: -a2, tol: 0.001, fb: "Secant has the sign of the cosine: in " + qn + " it is " + sgn(a2) + "." }, { v: a2 * a2, tol: 0.001, fb: "That is $\\sec^2\\theta = 1 + \\tan^2\\theta$. Take the square root." }]), hints: ["$\\sec^2\\theta = 1 + \\tan^2\\theta$."], why: "$\\sec^2\\theta = " + ratTex(c * c, ad * ad) + "$, so $\\sec\\theta = " + ratTex(cS * c, ad) + "$." };
      } },
    { id: "pc7-simp", title: "Simplify with identities", lesson: 4,
      gen: function (R) {
        var P = [["\\dfrac{1 - \\cos^2#}{\\sin#}", "\\sin#"], ["\\dfrac{1 - \\sin^2#}{\\cos#}", "\\cos#"], ["\\dfrac{\\sin^2#}{1 - \\cos#}", "1 + \\cos#"], ["(1 - \\sin#)(1 + \\sin#)", "\\cos^2#"], ["\\tan^2#\\cos^2#", "\\sin^2#"], ["\\cos^2#(1 + \\tan^2#)", "1"], ["\\sin^2#(1 + \\cot^2#)", "1"], ["\\dfrac{\\cos^2#}{1 - \\sin#}", "1 + \\sin#"], ["\\dfrac{\\sec^2# - 1}{\\sec^2#}", "\\sin^2#"], ["\\sec^2# - \\tan^2#", "1"]];
        var POOL = ["\\sin#", "\\cos#", "\\tan#", "1", "1 + \\cos#", "1 - \\cos#", "1 + \\sin#", "\\sin^2#", "\\cos^2#"];
        var v = R.pick(["\\theta", "x", "t"]), V = VX(v), p = R.pick(P), f = function (s) { return s.replace(/#/g, V); };
        var wrong = R.shuffle(POOL.filter(function (s) { return s !== p[1]; })).slice(0, 3).map(function (s) { return { t: "$" + f(s) + "$", fb: "Substitute an identity and simplify: $" + f(p[0]) + " = " + f(p[1]) + "$. Try $60^\\circ$ in both to check." }; });
        return mc(R, { prompt: "Simplify $" + f(p[0]) + "$.", right: "$" + f(p[1]) + "$", wrong: wrong, keep: true, hints: ["Use $1 - \\sin^2 = \\cos^2$ (or $1 - \\cos^2 = \\sin^2$) and factor."], why: "$" + f(p[0]) + " = " + f(p[1]) + "$." });
      } },
    { id: "pc7-verify", title: "Identity or not?", lesson: 5,
      gen: function (R) {
        var S = function (x) { return Math.sin(x * DEG); }, C = function (x) { return Math.cos(x * DEG); }, T = function (x) { return Math.tan(x * DEG); };
        var Q = [["\\tan x\\cos x = \\sin x", function (x) { return T(x) * C(x); }, function (x) { return S(x); }, true],
                 ["\\sec x - \\cos x = \\sin x\\tan x", function (x) { return 1 / C(x) - C(x); }, function (x) { return S(x) * T(x); }, true],
                 ["\\dfrac{\\sin x}{1 + \\cos x} = \\dfrac{1 - \\cos x}{\\sin x}", function (x) { return S(x) / (1 + C(x)); }, function (x) { return (1 - C(x)) / S(x); }, true],
                 ["\\csc x - \\sin x = \\cos x\\cot x", function (x) { return 1 / S(x) - S(x); }, function (x) { return C(x) / T(x); }, true],
                 ["\\dfrac{1}{1 - \\sin x} + \\dfrac{1}{1 + \\sin x} = 2\\sec^2 x", function (x) { return 1 / (1 - S(x)) + 1 / (1 + S(x)); }, function (x) { return 2 / (C(x) * C(x)); }, true],
                 ["\\dfrac{\\cos x}{1 - \\sin x} = \\dfrac{1 + \\sin x}{\\cos x}", function (x) { return C(x) / (1 - S(x)); }, function (x) { return (1 + S(x)) / C(x); }, true],
                 ["\\tan^2 x + 1 = \\sec^2 x", function (x) { return T(x) * T(x) + 1; }, function (x) { return 1 / (C(x) * C(x)); }, true],
                 ["\\sin x + \\cos x = 1", function (x) { return S(x) + C(x); }, function () { return 1; }, false],
                 ["\\sin^2 x - \\cos^2 x = 1", function (x) { return S(x) * S(x) - C(x) * C(x); }, function () { return 1; }, false],
                 ["\\tan x = \\sin x", function (x) { return T(x); }, function (x) { return S(x); }, false],
                 ["\\sec x = \\cos x", function (x) { return 1 / C(x); }, function (x) { return C(x); }, false],
                 ["\\dfrac{\\sin x}{\\cos x} = \\cot x", function (x) { return S(x) / C(x); }, function (x) { return C(x) / S(x); }, false],
                 ["\\sin^2 x = \\sin x", function (x) { return S(x) * S(x); }, function (x) { return S(x); }, false],
                 ["\\cos^2 x = 1 + \\sin^2 x", function (x) { return C(x) * C(x); }, function (x) { return 1 + S(x) * S(x); }, false],
                 ["\\cos 2x = 2\\cos x", function (x) { return Math.cos(2 * x * DEG); }, function (x) { return 2 * C(x); }, false]];
        var q = R.pick(Q), xs = [30, 45, 60], x = R.pick(xs), l = q[1](x), A = "It is an identity: true for every $x$", B = "It is **not** an identity: the sides differ at $x = ";
        if (q[3]) return mc(R, { prompt: "Which statement is correct for $" + q[0] + "$?", right: A, wrong: [{ t: B + x + "^\\circ$", fb: "At $x = " + x + "^\\circ$ both sides equal $" + nm(f4(l, 3)) + "$. A true identity has no counterexample." }, { t: "It is true only for special angles", fb: "It is true for **every** $x$ where both sides are defined: verify it by working on one side." }], keep: true, hints: ["Try a value, then verify."], why: "Working on one side, both sides match, so it is an identity." });
        var ys = xs.filter(function (z) { return Math.abs(q[1](z) - q[2](z)) > 1e-6; }), y = R.pick(ys), ly = q[1](y), ry = q[2](y);
        return mc(R, { prompt: "Which statement is correct for $" + q[0] + "$?", right: B + y + "^\\circ$", wrong: [{ t: A, fb: "Test $x = " + y + "^\\circ$: the left side is $" + nm(f4(ly, 3)) + "$ and the right side is $" + nm(f4(ry, 3)) + "$. One difference disproves it." }, { t: "It is true only for special angles", fb: "It fails at $x = " + y + "^\\circ$, a special angle: left $" + nm(f4(ly, 3)) + "$, right $" + nm(f4(ry, 3)) + "$." }], keep: true, hints: ["Try $x = 30^\\circ$, $45^\\circ$ or $60^\\circ$."], why: "At $x = " + y + "^\\circ$ the sides are $" + nm(f4(ly, 3)) + "$ and $" + nm(f4(ry, 3)) + "$." });
      } },
    { id: "pc7-cossum", title: "Cosine of a sum or difference", lesson: 6,
      gen: function (R) {
        var t = R.int(0, 2), C = function (x) { return Math.cos(x * DEG); }, S = function (x) { return Math.sin(x * DEG); };
        if (t === 0) {
          var pr = R.pick([[45, 30], [60, 45], [60, 30]]), a = pr[0], b = pr[1], plus = R.chance(0.5), ang = plus ? a + b : a - b, ans = C(ang);
          var shown = plus && R.chance(0.5) ? [b, a] : [a, b];
          var wrongSign = plus ? C(a) * C(b) + S(a) * S(b) : C(a) * C(b) - S(a) * S(b);
          return { type: "num", prompt: "Find $\\cos(" + shown[0] + "^\\circ " + (plus ? "+" : "-") + " " + shown[1] + "^\\circ)$ as a decimal. (You may type an expression such as sqrt(2)/3.)", pre: "value $\\approx$", answer: RD(ans), tol: 0.0006, calc: true, near: near(ans, [{ v: wrongSign, tol: 0.0006, fb: "The sign between the products is **opposite** the sign inside the bracket for cosine." }, { v: plus ? C(a) + C(b) : C(a) - C(b), tol: 0.0006, fb: "Cosine does not distribute over a sum or difference." }]), hints: ["$\\cos\\alpha\\cos\\beta " + (plus ? "-" : "+") + " \\sin\\alpha\\sin\\beta$."], why: "$\\cos " + ang + "^\\circ \\approx " + VT(ans) + "$." };
        }
        if (t === 1) {
          var L = R.pick([["x", "y"], ["\\alpha", "\\beta"], ["A", "B"]]), pl = R.chance(0.5), u = L[0], w = L[1], cu = "\\cos" + VX(u), cw = "\\cos" + VX(w), su = "\\sin" + VX(u), sw = "\\sin" + VX(w);
          var pm = function (s) { return s ? "+" : "-"; };
          return mc(R, { prompt: "Which expression equals $\\cos(" + u + " " + pm(pl) + " " + w + ")$?", right: "$" + cu + cw + " " + pm(!pl) + " " + su + sw + "$", wrong: [{ t: "$" + cu + cw + " " + pm(pl) + " " + su + sw + "$", fb: "For cosine the sign between the products is **opposite** the sign inside the bracket." }, { t: "$" + cu + " " + pm(pl) + " " + cw + "$", fb: "Cosine does not distribute: try $90^\\circ$ and $90^\\circ$." }, { t: "$" + su + cw + " " + pm(pl) + " " + cu + sw + "$", fb: "That is the formula for $\\sin(" + u + " " + pm(pl) + " " + w + ")$." }], keep: true, hints: ["A plus inside gives a minus between."], why: "$" + cu + cw + " " + pm(!pl) + " " + su + sw + "$." });
        }
        var s = R.pick([30, 45, 60, 90, 120]), minus = R.chance(0.5), a2, b2;
        if (minus) { a2 = 5 * R.int(1, s / 5 - 1); b2 = s - a2; } else { b2 = 5 * R.int(1, 8); a2 = s + b2; }
        var ans2 = C(s), wr = minus ? C(a2 - b2) : C(a2 + b2);
        return { type: "num", prompt: "Simplify $\\cos " + a2 + "^\\circ\\cos " + b2 + "^\\circ " + (minus ? "-" : "+") + " \\sin " + a2 + "^\\circ\\sin " + b2 + "^\\circ$ to one cosine, and give its value. (A decimal is fine.)", pre: "value $\\approx$", answer: RD(ans2), tol: 0.0006, calc: true, near: near(ans2, [{ v: wr, tol: 0.0006, fb: minus ? "A **minus** between the products is the **sum** formula: $\\cos(" + a2 + "^\\circ + " + b2 + "^\\circ)$." : "A **plus** between the products is the **difference** formula: $\\cos(" + a2 + "^\\circ - " + b2 + "^\\circ)$." }]), hints: ["It is a sum or difference formula read backwards."], why: "$\\cos(" + a2 + "^\\circ " + (minus ? "+" : "-") + " " + b2 + "^\\circ) = \\cos " + s + "^\\circ \\approx " + VT(ans2) + "$." };
      } },
    { id: "pc7-sinsum", title: "Sine of a sum or difference", lesson: 7,
      gen: function (R) {
        var t = R.int(0, 2), C = function (x) { return Math.cos(x * DEG); }, S = function (x) { return Math.sin(x * DEG); };
        if (t === 0) {
          var pr = R.pick([[45, 30], [60, 45], [60, 30]]), a = pr[0], b = pr[1], plus = R.chance(0.5), ang = plus ? a + b : a - b, ans = S(ang);
          var wrongSign = plus ? S(a) * C(b) - C(a) * S(b) : S(a) * C(b) + C(a) * S(b);
          return { type: "num", prompt: "Find $\\sin(" + a + "^\\circ " + (plus ? "+" : "-") + " " + b + "^\\circ)$ as a decimal. (You may type an expression such as sqrt(2)/3.)", pre: "value $\\approx$", answer: RD(ans), tol: 0.0006, calc: true, near: near(ans, [{ v: wrongSign, tol: 0.0006, fb: "For sine the sign between the products is the **same** as the sign inside the bracket." }, { v: plus ? S(a) + S(b) : S(a) - S(b), tol: 0.0006, fb: "Sine does not distribute over a sum or difference." }]), hints: ["$\\sin\\alpha\\cos\\beta " + (plus ? "+" : "-") + " \\cos\\alpha\\sin\\beta$."], why: "$\\sin " + ang + "^\\circ \\approx " + VT(ans) + "$." };
        }
        if (t === 1) {
          var L = R.pick([["x", "y"], ["\\alpha", "\\beta"], ["A", "B"]]), pl = R.chance(0.5), u = L[0], w = L[1], cu = "\\cos" + VX(u), cw = "\\cos" + VX(w), su = "\\sin" + VX(u), sw = "\\sin" + VX(w);
          var pm = function (s) { return s ? "+" : "-"; };
          return mc(R, { prompt: "Which expression equals $\\sin(" + u + " " + pm(pl) + " " + w + ")$?", right: "$" + su + cw + " " + pm(pl) + " " + cu + sw + "$", wrong: [{ t: "$" + su + cw + " " + pm(!pl) + " " + cu + sw + "$", fb: "For sine the sign between the products is the **same** as the sign inside the bracket." }, { t: "$" + su + " " + pm(pl) + " " + sw + "$", fb: "Sine does not distribute: try $90^\\circ$ and $90^\\circ$." }, { t: "$" + cu + cw + " " + pm(!pl) + " " + su + sw + "$", fb: "That is the formula for $\\cos(" + u + " " + pm(pl) + " " + w + ")$." }], keep: true, hints: ["The sign between the products matches the sign inside."], why: "$" + su + cw + " " + pm(pl) + " " + cu + sw + "$." });
        }
        var s = R.pick([30, 45, 60, 90, 120, 150]), minus = R.chance(0.5), a2, b2;
        if (!minus) { a2 = 5 * R.int(1, s / 5 - 1); b2 = s - a2; } else { b2 = 5 * R.int(1, 8); a2 = s + b2; }
        var ans2 = S(s), wr = minus ? S(a2 + b2) : S(a2 - b2);
        return { type: "num", prompt: "Simplify $\\sin " + a2 + "^\\circ\\cos " + b2 + "^\\circ " + (minus ? "-" : "+") + " \\cos " + a2 + "^\\circ\\sin " + b2 + "^\\circ$ to one sine, and give its value. (A decimal is fine.)", pre: "value $\\approx$", answer: RD(ans2), tol: 0.0006, calc: true, near: near(ans2, [{ v: wr, tol: 0.0006, fb: minus ? "A **minus** between the products is the **difference** formula: $\\sin(" + a2 + "^\\circ - " + b2 + "^\\circ)$." : "A **plus** between the products is the **sum** formula: $\\sin(" + a2 + "^\\circ + " + b2 + "^\\circ)$." }]), hints: ["It is a sum or difference formula read backwards."], why: "$\\sin(" + a2 + "^\\circ " + (minus ? "-" : "+") + " " + b2 + "^\\circ) = \\sin " + s + "^\\circ \\approx " + VT(ans2) + "$." };
      } },
    { id: "pc7-tansum", title: "Tangent of a sum or difference", lesson: 8,
      gen: function (R) {
        var t = R.int(0, 2), T = function (x) { return Math.tan(x * DEG); };
        if (t === 0) {
          var pr = R.pick([[45, 30, 1], [45, 30, 0], [60, 45, 0], [60, 30, 0], [45, 60, 1]]), a = pr[0], b = pr[1], plus = pr[2] === 1, ang = plus ? a + b : a - b, ans = T(ang), ta = T(a), tb = T(b);
          return { type: "num", prompt: "Find $\\tan(" + a + "^\\circ " + (plus ? "+" : "-") + " " + b + "^\\circ)$ as a decimal. (You may type an expression such as sqrt(2)/3.)", pre: "value $\\approx$", answer: RD(ans), tol: 0.0006, calc: true, near: near(ans, [{ v: plus ? ta + tb : ta - tb, tol: 0.0006, fb: "Tangent does not distribute. Use $\\frac{\\tan\\alpha " + (plus ? "+" : "-") + " \\tan\\beta}{1 " + (plus ? "-" : "+") + " \\tan\\alpha\\tan\\beta}$." }, { v: plus ? (ta + tb) / (1 + ta * tb) : (ta - tb) / (1 - ta * tb), tol: 0.0006, fb: "The bottom has the **opposite** sign to the top." }]), hints: ["$\\tan 45^\\circ = 1$, $\\tan 30^\\circ = \\frac{1}{\\sqrt3}$, $\\tan 60^\\circ = \\sqrt3$."], why: "$\\tan " + ang + "^\\circ \\approx " + VT(ans) + "$." };
        }
        if (t === 1) {
          var p = R.int(1, 5), q = R.int(1, 5); if (p === q) q = p === 5 ? 4 : p + 1;
          var pl = R.chance(0.5), n2 = pl ? p + q : p - q, d2 = pl ? 1 - p * q : 1 + p * q, ans2 = n2 / d2;
          return { type: "num", prompt: "If $\\tan\\alpha = " + p + "$ and $\\tan\\beta = " + q + "$, find $\\tan(\\alpha " + (pl ? "+" : "-") + " \\beta)$. (A fraction is fine.)", pre: "$\\tan(\\alpha " + (pl ? "+" : "-") + " \\beta) =$", answer: RD(ans2), tol: 0.001, near: near(ans2, [{ v: n2, tol: 0.001, fb: "That is only the top. Divide by $1 " + (pl ? "-" : "+") + " " + p + " \\cdot " + q + "$." }, { v: pl ? (p + q) / (1 + p * q) : (p - q) / (1 - p * q), tol: 0.001, fb: "The bottom has the **opposite** sign to the top: " + (pl ? "$1 - \\tan\\alpha\\tan\\beta$" : "$1 + \\tan\\alpha\\tan\\beta$") + "." }]), hints: ["$\\frac{\\tan\\alpha " + (pl ? "+" : "-") + " \\tan\\beta}{1 " + (pl ? "-" : "+") + " \\tan\\alpha\\tan\\beta}$."], why: "$\\frac{" + n2 + "}{" + d2 + "} \\approx " + VT(ans2) + "$." };
        }
        var L = R.pick([["x", "y"], ["\\alpha", "\\beta"], ["A", "B"]]), pl2 = R.chance(0.5), u = L[0], w = L[1], tu = "\\tan" + VX(u), tw = "\\tan" + VX(w), s1 = pl2 ? "+" : "-", s2 = pl2 ? "-" : "+";
        return mc(R, { prompt: "Which expression equals $\\tan(" + u + " " + s1 + " " + w + ")$?", right: "$\\dfrac{" + tu + " " + s1 + " " + tw + "}{1 " + s2 + " " + tu + tw + "}$", wrong: [{ t: "$\\dfrac{" + tu + " " + s1 + " " + tw + "}{1 " + s1 + " " + tu + tw + "}$", fb: "The bottom has the **opposite** sign to the top." }, { t: "$" + tu + " " + s1 + " " + tw + "$", fb: "Tangent does not distribute: $\\tan 30^\\circ + \\tan 30^\\circ \\ne \\tan 60^\\circ$." }, { t: "$\\dfrac{" + tu + " " + s1 + " " + tw + "}{" + tu + tw + "}$", fb: "The bottom is $1 " + s2 + " \\tan" + VX(u) + "\\tan" + VX(w) + "$, not the product alone." }], keep: true, hints: ["Top copies the sign inside; the bottom has the opposite."], why: "$\\dfrac{" + tu + " " + s1 + " " + tw + "}{1 " + s2 + " " + tu + tw + "}$." });
      } },
    { id: "pc7-cofunc", title: "Cofunction identities", lesson: 8,
      gen: function (R) {
        var P = R.pick([["sin", "cos"], ["tan", "cot"], ["sec", "csc"]]), th = 5 * R.int(2, 16), flip = R.chance(0.5), f = flip ? P[1] : P[0], g = flip ? P[0] : P[1];
        return { type: "num", prompt: "Find $x$ (between $0^\\circ$ and $90^\\circ$) so that $\\" + f + " " + th + "^\\circ = \\" + g + " x^\\circ$.", pre: "$x =$", post: "degrees", answer: 90 - th, near: near(90 - th, [{ v: th, fb: "A cofunction uses the **complement**: $90^\\circ - " + th + "^\\circ$, not the angle itself." }, { v: 180 - th, fb: "The complement is $90^\\circ - " + th + "^\\circ$, not $180^\\circ - " + th + "^\\circ$." }]), hints: ["$\\" + f + "\\theta = \\" + g + "(90^\\circ - \\theta)$."], why: "$x = 90 - " + th + " = " + (90 - th) + "$." };
      } },
    { id: "pc7-double", title: "Double-angle formulas", lesson: 9,
      gen: function (R) {
        var T = R.pick(TRIP7), c = T[2], sw = R.chance(0.5), o = sw ? T[0] : T[1], ad = sw ? T[1] : T[0], q = R.int(1, 4);
        var sS = q <= 2 ? 1 : -1, cS = (q === 1 || q === 4) ? 1 : -1, sv = sS * o / c, cv = cS * ad / c, f = R.pick(["sin", "cos"]), g = R.pick(["sin", "cos"]);
        var known = f === "sin" ? ratTex(sS * o, c) : ratTex(cS * ad, c), ans = g === "sin" ? 2 * sv * cv : cv * cv - sv * sv, frn = g === "sin" ? 2 * sS * cS * o * ad : ad * ad - o * o, fr = ratTex(frn, c * c);
        var wrongs = g === "sin" ? [{ v: 2 * sv, tol: 0.001, fb: "Doubling the angle does not double the sine: $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$." }, { v: -ans, tol: 0.001, fb: "Check the signs of $\\sin\\theta$ and $\\cos\\theta$ in quadrant " + QN7[q - 1] + "." }] : [{ v: 2 * cv, tol: 0.001, fb: "Doubling the angle does not double the cosine. Use $\\cos^2\\theta - \\sin^2\\theta$." }, { v: cv * cv + sv * sv, tol: 0.001, fb: "That is 1. The formula has a **minus**: $\\cos^2\\theta - \\sin^2\\theta$." }];
        return { type: "num", prompt: "If $\\" + f + "\\theta = " + known + "$ and $\\theta$ is in quadrant " + QN7[q - 1] + ", find $\\" + g + " 2\\theta$. (A fraction is fine.)", pre: "$\\" + g + " 2\\theta =$", answer: RD(ans), tol: 0.001, near: near(ans, wrongs), hints: ["Find the other function from the triangle and the quadrant first."], why: "$\\" + g + " 2\\theta = " + fr + "$." };
      } },
    { id: "pc7-half", title: "Half-angle formulas", lesson: 10,
      gen: function (R) {
        var t = R.int(0, 1), C = function (x) { return Math.cos(x * DEG); }, S = function (x) { return Math.sin(x * DEG); };
        if (t === 0) {
          var al = R.pick([30, 60, 90, 120, 150, 210, 240, 300]), f = R.pick(["sin", "cos"]), F = f === "sin" ? S : C, ans = F(al / 2), wrongA = F(al);
          return { type: "num", prompt: "Use the half-angle formula to find $\\" + f + "\\dfrac{\\alpha}{2}$ when $\\alpha = " + al + "^\\circ$. (You may type an expression such as sqrt(2)/3.)", pre: "value $\\approx$", answer: RD(ans), tol: 0.0006, calc: true, near: near(ans, [{ v: -ans, tol: 0.0006, fb: "Choose the sign from the quadrant of $\\frac{\\alpha}{2} = " + al / 2 + "^\\circ$: here the " + f + " is " + (ans < 0 ? "negative" : "positive") + "." }, { v: wrongA, tol: 0.0006, fb: "That is $\\" + f + " " + al + "^\\circ$. The half-angle formula gives the " + f + " of **half** the angle." }]), hints: ["$\\" + f + "\\frac{\\alpha}{2} = \\pm\\sqrt{\\frac{1 " + (f === "sin" ? "-" : "+") + " \\cos\\alpha}{2}}$."], why: "$\\" + f + " " + al / 2 + "^\\circ \\approx " + VT(ans) + "$." };
        }
        var pr = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), a = pr[0], b = pr[1], q = pr[2], sw = R.chance(0.5), s = sw ? b : a, k = sw ? a : b, nn = k * k - s * s, ca = ratTex(nn, q * q), qd = nn > 0 ? "I" : "II", f2 = R.pick(["sin", "cos"]), ans2 = f2 === "sin" ? s / q : k / q;
        return { type: "num", prompt: "If $\\cos\\alpha = " + ca + "$ and $\\alpha$ is in quadrant " + qd + ", find $\\" + f2 + "\\dfrac{\\alpha}{2}$. (A fraction is fine.)", pre: "$\\" + f2 + "\\frac{\\alpha}{2} =$", answer: RD(ans2), tol: 0.001, near: near(ans2, [{ v: f2 === "sin" ? k / q : s / q, tol: 0.001, fb: "That is the other function: for sine use $1 - \\cos\\alpha$, for cosine use $1 + \\cos\\alpha$." }, { v: -ans2, tol: 0.001, fb: "$\\frac{\\alpha}{2}$ is in quadrant I (halving an angle in quadrant " + qd + "): both functions are positive." }]), hints: ["$\\" + f2 + "\\frac{\\alpha}{2} = \\sqrt{\\frac{1 " + (f2 === "sin" ? "-" : "+") + " \\cos\\alpha}{2}}$, with a plus sign."], why: "$\\sqrt{\\frac{1 " + (f2 === "sin" ? "-" : "+") + " (" + ca + ")}{2}} = \\frac{" + (f2 === "sin" ? s : k) + "}{" + q + "}$." };
      } },
    { id: "pc7-prod", title: "Product-to-sum and sum-to-product", lesson: 11,
      gen: function (R) {
        var t = R.int(0, 2), C = function (x) { return Math.cos(x * DEG); }, S = function (x) { return Math.sin(x * DEG); };
        if (t === 0) {
          var a = 15 * R.int(2, 7), b = 15 * R.int(1, 6); if (a === b) b = a === 15 ? 30 : a - 15;
          var sc = R.chance(0.5), ans = sc ? S(a) * C(b) : C(a) * C(b), twice = 2 * ans;
          return { type: "num", prompt: "Use a product-to-sum formula to find $" + (sc ? "\\sin " + a + "^\\circ\\cos " + b : "\\cos " + a + "^\\circ\\cos " + b) + "^\\circ$. (You may type an expression such as 0.5*sin(70°).)", pre: "value $\\approx$", answer: RD(ans), tol: 0.0006, calc: true, near: near(ans, [{ v: twice, tol: 0.0006, fb: "Do not forget the factor $\\frac{1}{2}$." }]), hints: [sc ? "$\\sin\\alpha\\cos\\beta = \\frac{1}{2}[\\sin(\\alpha + \\beta) + \\sin(\\alpha - \\beta)]$." : "$\\cos\\alpha\\cos\\beta = \\frac{1}{2}[\\cos(\\alpha - \\beta) + \\cos(\\alpha + \\beta)]$."], why: "$\\approx " + VT(ans) + "$." };
        }
        if (t === 1) {
          var n = R.int(1, 5), m = n + R.int(1, 5), sinC = R.chance(0.5);
          if (sinC) return mc(R, { prompt: "Write $\\sin " + CX(m) + "x\\cos " + CX(n) + "x$ as a sum.", right: "$\\dfrac{1}{2}[\\sin " + CX(m + n) + "x + \\sin " + CX(m - n) + "x]$", wrong: [{ t: "$\\dfrac{1}{2}[\\sin " + CX(m + n) + "x - \\sin " + CX(m - n) + "x]$", fb: "For $\\sin\\alpha\\cos\\beta$ the two sines are **added**." }, { t: "$\\sin " + CX(m + n) + "x + \\sin " + CX(m - n) + "x$", fb: "There is a factor $\\frac{1}{2}$ in front." }, { t: "$\\dfrac{1}{2}[\\cos " + CX(m + n) + "x + \\cos " + CX(m - n) + "x]$", fb: "A sine times a cosine becomes a sum of **sines**." }], keep: true, hints: ["Use the sum $\\alpha + \\beta$ and the difference $\\alpha - \\beta$."], why: "$\\frac{1}{2}[\\sin(" + m + "x + " + n + "x) + \\sin(" + m + "x - " + n + "x)]$." });
          return mc(R, { prompt: "Write $\\cos " + CX(m) + "x\\cos " + CX(n) + "x$ as a sum.", right: "$\\dfrac{1}{2}[\\cos " + CX(m - n) + "x + \\cos " + CX(m + n) + "x]$", wrong: [{ t: "$\\dfrac{1}{2}[\\cos " + CX(m - n) + "x - \\cos " + CX(m + n) + "x]$", fb: "For $\\cos\\alpha\\cos\\beta$ the two cosines are **added**. (The minus is for $\\sin\\alpha\\sin\\beta$.)" }, { t: "$\\cos " + CX(m + n) + "x + \\cos " + CX(m - n) + "x$", fb: "There is a factor $\\frac{1}{2}$ in front." }, { t: "$\\dfrac{1}{2}[\\sin " + CX(m - n) + "x + \\sin " + CX(m + n) + "x]$", fb: "A cosine times a cosine becomes a sum of **cosines**." }], keep: true, hints: ["Use $\\alpha - \\beta$ and $\\alpha + \\beta$."], why: "$\\frac{1}{2}[\\cos(" + m + "x - " + n + "x) + \\cos(" + m + "x + " + n + "x)]$." });
        }
        var h = R.int(2, 7), d = R.int(1, h - 1), m2 = h + d, n2 = h - d, sn = R.chance(0.5), fn = sn ? "sin" : "cos", fq = "\\" + fn, sumTex = fq + " " + CX(m2) + "x + " + fq + " " + CX(n2) + "x";
        var avg = "The first factor uses the **average** of the angles, $\\frac{" + m2 + " + " + n2 + "}{2} = " + h + "$, and the second uses half the difference, $" + d + "$.";
        var wrong = sn ? [{ t: "$2\\sin " + CX(d) + "x\\cos " + CX(h) + "x$", fb: avg }, { t: "$2\\sin " + CX(m2) + "x\\cos " + CX(n2) + "x$", fb: "Halve the sum and the difference: do not use the angles themselves." }, { t: "$\\sin " + CX(m2 + n2) + "x$", fb: "A sum of two sines is not the sine of the sum." }]
          : [{ t: "$2\\sin " + CX(h) + "x\\sin " + CX(d) + "x$", fb: "A sum of two cosines is a product of two **cosines**. (Sines appear when you subtract cosines.)" }, { t: "$2\\cos " + CX(m2) + "x\\cos " + CX(n2) + "x$", fb: "Halve the sum and the difference: do not use the angles themselves. " + avg }, { t: "$\\cos " + CX(m2 + n2) + "x$", fb: "A sum of two cosines is not the cosine of the sum." }];
        return mc(R, { prompt: "Write $" + sumTex + "$ as a product.", right: "$2" + fq + " " + CX(h) + "x" + (sn ? "\\cos " : "\\cos ") + CX(d) + "x$", wrong: wrong, keep: true, hints: ["Average the angles; halve the difference."], why: "$\\frac{" + m2 + " + " + n2 + "}{2} = " + h + "$ and $\\frac{" + m2 + " - " + n2 + "}{2} = " + d + "$." });
      } },
    { id: "pc7-solve1", title: "Solve a trigonometric equation in one turn", lesson: 12,
      gen: function (R) {
        var f = R.pick(["sin", "cos", "tan"]), V = f === "tan" ? TNV : SPV, c = R.pick(V), sol = SOLF(f, c.v), big = R.chance(0.5), ans = big ? sol[1] : sol[0], other = big ? sol[0] : sol[1];
        return { type: "num", prompt: "Solve $\\" + f + "\\theta = " + c.t + "$ for $\\theta$ in $[0, 2\\pi)$. Give the **" + (big ? "larger" : "smaller") + "** solution. (Type an expression such as 7*pi/8.)", pre: "$\\theta \\approx$", answer: RD(ans), tol: 0.0006, calc: true, near: near(ans, [{ v: other, tol: 0.0006, fb: "That is the " + (big ? "smaller" : "larger") + " solution. There are two in a turn." }]), hints: ["Find the reference angle, then the two quadrants where the sign matches."], why: "$\\theta \\approx " + VT(sol[0]) + "$ and $" + VT(sol[1]) + "$." };
      } },
    { id: "pc7-solve2", title: "Count solutions of a factored equation", lesson: 13,
      gen: function (R) {
        var RT = [{ v: 0 }, { v: 1 }, { v: -1 }, { v: 0.5 }, { v: -0.5 }, { v: SQ3 / 2 }, { v: -SQ3 / 2 }, { v: SQ2 / 2 }, { v: -SQ2 / 2 }];
        var cnt = function (v) { return Math.abs(Math.abs(v) - 1) < 1e-9 ? 1 : 2; };
        var fac = function (fn, v) {
          var F = "\\" + fn + "\\theta";
          if (Math.abs(v) < 1e-9) return F;
          if (Math.abs(Math.abs(v) - 1) < 1e-9) return "(" + F + (v > 0 ? " - 1" : " + 1") + ")";
          if (Math.abs(Math.abs(v) - 0.5) < 1e-9) return "(2" + F + (v > 0 ? " - 1" : " + 1") + ")";
          if (Math.abs(Math.abs(v) - SQ3 / 2) < 1e-9) return "(2" + F + (v > 0 ? " - " : " + ") + "\\sqrt{3})";
          return "(\\sqrt{2}" + F + (v > 0 ? " - 1" : " + 1") + ")";
        };
        if (R.chance(0.5)) {
          var f1 = R.pick(["sin", "cos"]), f2 = R.pick(["sin", "cos"]), r1 = R.pick(RT), r2 = R.pick(RT);
          if (f1 === f2 && Math.abs(r1.v - r2.v) < 1e-9) r2 = RT[(RT.indexOf(r1) + 1) % RT.length];
          var sa = SOL11(f1, r1.v), sb = SOL11(f2, r2.v), total = sa.length + sb.filter(function (v) { return !sa.some(function (w) { return Math.abs(w - v) < 1e-9; }); }).length;
          var shared = sa.length + sb.length - total;
          return { type: "num", prompt: "How many solutions does $" + fac(f1, r1.v) + fac(f2, r2.v) + " = 0$ have in $[0, 2\\pi)$?", pre: "solutions =", answer: total, near: near(total, [{ v: 2, fb: "A product is 0 when **either** factor is 0: count the solutions of each factor and add." }, { v: total + 1, fb: "A value of exactly $\\pm 1$ gives only **one** angle in a turn; any other value gives two." }, { v: total - 1, fb: "Count each factor separately. The value $0$ gives two angles (for sine, $0$ and $\\pi$)." }, { v: sa.length + sb.length, fb: "Check whether the two factors share an angle: an angle that solves both factors counts only **once**." }]), hints: ["Solve each factor, then count the different angles from both."], why: sa.length + " + " + sb.length + (shared ? " - " + shared + " shared = " : " = ") + total + " different angle" + (total === 1 ? "" : "s") + "." };
        }
        var SV = [{ r: 0, p: 0, a: 1 }, { r: 1, p: 1, a: 1 }, { r: -1, p: -1, a: 1 }, { r: 0.5, p: 1, a: 2 }, { r: -0.5, p: -1, a: 2 }], u = R.pick(SV), w = R.pick(SV.filter(function (z) { return z.r !== u.r; })), fn = R.pick(["sin", "cos"]);
        var A = u.a * w.a, B = -(u.a * w.p + w.a * u.p), Cc = u.p * w.p, S = "\\" + fn + "\\theta";
        var term = function (co, pw, first) { if (co === 0) return ""; var ab = Math.abs(co), body = pw === 0 ? String(ab) : (ab === 1 ? "" : ab) + (pw === 2 ? "\\" + fn + "^2\\theta" : S); return (first ? (co < 0 ? "-" : "") : (co < 0 ? " - " : " + ")) + body; };
        var eq = term(A, 2, true) + term(B, 1, false) + term(Cc, 0, false), tot = cnt(u.r) + cnt(w.r);
        return { type: "num", prompt: "How many solutions does $" + eq + " = 0$ have in $[0, 2\\pi)$?", pre: "solutions =", answer: tot, near: near(tot, [{ v: 2, fb: "Factor it like a quadratic in $" + fn + "\\theta$, solve each factor, then count the angles from both values." }, { v: tot + 1, fb: "A value of exactly $\\pm 1$ gives only **one** angle in a turn; any other value gives two." }, { v: tot - 1, fb: "Count each root separately: $0$ gives two angles, $\\pm\\frac{1}{2}$ gives two, $\\pm 1$ gives one." }]), hints: ["Factor, then solve $" + fn + "\\theta = $ each root."], why: "The roots of the quadratic are $" + fn + "\\theta = " + ratTex(u.p, u.a) + "$ and $" + ratTex(w.p, w.a) + "$: " + cnt(u.r) + " + " + cnt(w.r) + " = " + tot + " solutions." };
      } },
    { id: "pc7-solve3", title: "Multiple angles and counting solutions", lesson: 14,
      gen: function (R) {
        if (R.chance(0.55)) {
          var f = R.pick(["sin", "cos", "tan"]), B = R.int(2, 5), CV = f === "tan" ? [{ v: 0, t: "0" }, { v: 1, t: "1" }, { v: -1, t: "-1" }, { v: SQ3, t: "\\sqrt{3}" }] : [{ v: 0, t: "0" }, { v: 0.5, t: "\\frac{1}{2}" }, { v: -0.5, t: "-\\frac{1}{2}" }, { v: SQ3 / 2, t: "\\frac{\\sqrt{3}}{2}" }, { v: 1, t: "1" }, { v: -1, t: "-1" }, { v: SQ2 / 2, t: "\\frac{\\sqrt{2}}{2}" }], c = R.pick(CV);
          var n = f === "tan" ? 2 * B : (Math.abs(Math.abs(c.v) - 1) < 1e-9 ? B : 2 * B);
          return { type: "num", prompt: "How many solutions does $\\" + f + " " + B + "\\theta = " + c.t + "$ have in $[0, 2\\pi)$?", pre: "solutions =", answer: n, near: near(n, [{ v: 2, fb: "Without the " + B + ", there would be two. The angle $" + B + "\\theta$ runs through " + B + " turns, so multiply." }, { v: B, fb: "Each cycle of the wave gives two solutions (unless the value is $\\pm 1$)." }, { v: 2 * B, fb: "The value $\\pm 1$ is reached only **once** per cycle, so there are " + B + " solutions." }]), hints: ["$B\\theta$ runs through $B$ whole turns."], why: "$" + n + "$ solutions." };
        }
        var f2 = R.pick(["sin", "cos"]), B2 = R.int(2, 3), c2 = R.pick(SPV), sol = SOLF(f2, c2.v), all = [];
        sol.forEach(function (v) { for (var k = 0; k < B2; k++) all.push((v + 2 * PI * k) / B2); });
        all.sort(function (p, q) { return p - q; });
        var ans = all[all.length - 1], second = all[all.length - 2];
        return { type: "num", prompt: "Solve $\\" + f2 + " " + B2 + "\\theta = " + c2.t + "$ for $\\theta$ in $[0, 2\\pi)$. Give the **largest** solution. (A decimal is fine, or type an expression such as 7*pi/10.)", pre: "$\\theta \\approx$", answer: RD(ans), tol: 0.0006, calc: true, near: near(ans, [{ v: second, tol: 0.0006, fb: "That is a solution, but not the largest: $" + B2 + "\\theta$ runs through " + B2 + " turns, up to $" + 2 * B2 + "\\pi$." }, { v: sol[sol.length - 1] / B2, tol: 0.0006, fb: "That only covers the first turn of $" + B2 + "\\theta$. Add whole turns, then divide by " + B2 + "." }]), hints: ["Solve $" + B2 + "\\theta$ over $[0, " + 2 * B2 + "\\pi)$, then divide by " + B2 + "."], why: "The largest is $\\theta \\approx " + VT(ans) + "$." };
      } },
    { id: "pc7-model", title: "When does a model reach a value?", lesson: 15,
      gen: function (R) {
        var D = R.pick([5, 6, 8, 10, 12]), A = R.pick([2, 3, 4]), P = R.pick([12, 24, 8, 6, 10, 16]), ph = R.pick([[1 / 3, 0.5], [1 / 2, 0], [2 / 3, -0.5], [1, -1]]), tv = D + A * ph[1], ans = ph[0] * P / 2;
        return { type: "num", prompt: "A tide is modelled by $h(t) = " + D + " + " + A + "\\cos\\left(\\dfrac{2\\pi}{" + P + "}t\\right)$ metres, $t$ in hours. When is the height **first** $" + nm(tv) + "$ m after $t = 0$? (A decimal is fine.)", pre: "$t \\approx$", post: "hours", answer: RD(ans), tol: 0.006, near: near(ans, [{ v: P - ans, tol: 0.006, fb: "That is the **second** time, later in the cycle. The first is on the way down." }, { v: ph[0] * Math.PI, tol: 0.006, fb: "That is the inside angle, not $t$. Divide by $\\frac{2\\pi}{" + P + "}$." }]), hints: ["$\\cos\\left(\\frac{2\\pi}{" + P + "}t\\right) = \\frac{" + nm(tv) + " - " + D + "}{" + A + "} = " + nm(ph[1]) + "$."], why: "The inside angle is $" + radTex(Math.round(ph[0] * 180)) + "$, so $t = " + nm(f4(ans, 3)) + "$ hours." };
      } }
  ];
  L.unit("precalc", 7, {
    title: "Trigonometric Identities and Equations",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "The fundamental identities: reciprocal, Pythagorean, simplifying and verifying.", skills: ["pc7-recip", "pc7-pyth", "pc7-simp", "pc7-verify"], per: 2 },
      { title: "Quiz 2", after: 8, blurb: "The sum and difference formulas for cosine, sine and tangent, and cofunctions.", skills: ["pc7-cossum", "pc7-sinsum", "pc7-tansum", "pc7-cofunc"], per: 2 },
      { title: "Quiz 3", after: 11, blurb: "Double-angle, half-angle, product-to-sum and sum-to-product formulas.", skills: ["pc7-double", "pc7-half", "pc7-prod"], per: 3 },
      { title: "Quiz 4", after: 15, blurb: "Solving trigonometric equations, multiple angles and modeling.", skills: ["pc7-solve1", "pc7-solve2", "pc7-solve3", "pc7-model"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:7", {
    2: { name: "The fundamental identities", frame: "An [[identity]] is true for [[every]] angle. $\\cot x$ is the [[reciprocal]] of $\\tan x$, and $\\tan x = \\frac{\\sin x}{\\cos x}$. Cosine is [[even]], so $\\cos(-x) = \\cos x$; sine is [[odd]], so $\\sin(-x) = -\\sin x$.",
         chips: ["negative", "complement"], fb: { "negative": "A reciprocal is $\\frac{1}{\\tan x}$, not $-\\tan x$.", "complement": "A complement is $90^\\circ - x$: that is for cofunctions." } },
    3: { name: "The Pythagorean identities", frame: "$\\sin^2\\theta + \\cos^2\\theta =$ [[1]]. Dividing by $\\cos^2\\theta$ gives $1 + \\tan^2\\theta =$ [[$\\sec^2\\theta$]]. A square root has a [[$\\pm$]] sign, so use the [[quadrant]] to choose.",
         chips: ["$\\csc^2\\theta$", "0"], fb: { "$\\csc^2\\theta$": "That goes with cotangent: $1 + \\cot^2\\theta = \\csc^2\\theta$.", "0": "The squares of the two coordinates on the unit circle add to $1^2$." } },
    4: { name: "Simplify with identities", frame: "Treat the functions like letters. [[Factor]], replace $1 - \\sin^2 x$ by [[$\\cos^2 x$]], then [[cancel]]. If you are stuck, write everything with [[sine]] and cosine.",
         chips: ["expand", "$\\sin^2 x$"], fb: { "expand": "Factoring is the move that makes cancelling possible.", "$\\sin^2 x$": "$1 - \\sin^2 x = \\cos^2 x$; it is $1 - \\cos^2 x$ that equals $\\sin^2 x$." } },
    5: { name: "Verify an identity", frame: "Work on [[one]] side only, starting with the [[messier]] side. Working on both sides [[assumes]] the identity you want to prove. One [[counterexample]] shows an equation is not an identity.",
         chips: ["both", "simpler"], fb: { "both": "Working on both sides assumes what you want to prove.", "simpler": "Start with the messier side: it is easier to simplify than to build." } },
    6: { name: "Cosine of a sum or difference", frame: "$\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta$ [[$+$]] $\\sin\\alpha\\sin\\beta$. For cosine the sign between the products is [[opposite]] the sign inside. Cosine does not [[distribute]]: $\\cos(\\alpha + \\beta) \\ne \\cos\\alpha + \\cos\\beta$.",
         chips: ["same", "$-$"], fb: { "same": "That is the pattern for sine: the sign stays.", "$-$": "A minus inside gives a **plus** between, in the difference formula." } },
    7: { name: "Sine of a sum or difference", frame: "$\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta$ [[$+$]] $\\cos\\alpha\\sin\\beta$. For sine the sign between the products is the [[same]] as the sign inside. Read backwards, $\\sin 20^\\circ\\cos 25^\\circ + \\cos 20^\\circ\\sin 25^\\circ = \\sin$ [[$45^\\circ$]].",
         chips: ["opposite", "$5^\\circ$"], fb: { "opposite": "That is the pattern for cosine.", "$5^\\circ$": "Add the two angles: $20^\\circ + 25^\\circ$." } },
    8: { name: "Tangent of a sum, and cofunctions", frame: "In the tangent sum formula the top copies the sign inside and the bottom has the [[opposite]] sign. Cofunctions: the sine of an angle equals the [[cosine]] of its [[complement]], $90^\\circ - \\theta$.",
         chips: ["supplement", "tangent"], fb: { "supplement": "A supplement is $180^\\circ - \\theta$. Cofunctions use the complement, $90^\\circ - \\theta$.", "tangent": "Tangent pairs with cotangent; sine pairs with cosine." } },
    9: { name: "Double-angle formulas", frame: "$\\sin 2\\theta =$ [[$2\\sin\\theta\\cos\\theta$]], not $2\\sin\\theta$. $\\cos 2\\theta = \\cos^2\\theta -$ [[$\\sin^2\\theta$]], which also equals $2\\cos^2\\theta - 1$. Doubling the angle does not [[double]] the value.",
         chips: ["$2\\sin\\theta$", "$\\cos^2\\theta$"], fb: { "$2\\sin\\theta$": "Doubling the angle does not double the sine.", "$\\cos^2\\theta$": "$\\cos^2\\theta - \\cos^2\\theta$ would be 0: the second square is the sine's." } },
    10: { name: "Power-reducing and half-angle formulas", frame: "Power-reducing trades a [[square]] for a double angle: $\\sin^2\\theta = \\frac{1 - \\cos 2\\theta}{2}$. The half-angle formula for sine is $\\pm\\sqrt{\\frac{1 - \\cos\\alpha}{2}}$, with the sign from the [[quadrant]] of $\\frac{\\alpha}{2}$. Halving an angle does not halve its [[sine]].",
         chips: ["cube", "angle"], fb: { "cube": "Power-reducing lowers a **square** to a power of 1.", "angle": "Halving the angle is exactly what we do: it is the sine value that is not halved." } },
    11: { name: "Product-to-sum and sum-to-product", frame: "Adding the sum and difference formulas turns a [[product]] into a [[sum]]: $\\cos\\alpha\\cos\\beta = \\frac{1}{2}[\\cos(\\alpha - \\beta) + \\cos(\\alpha + \\beta)]$. In $\\sin\\alpha + \\sin\\beta$ the sine takes the [[average]] of the angles.",
         chips: ["difference", "quotient"], fb: { "difference": "The sine takes the average (half the sum); the cosine takes half the difference.", "quotient": "There is no quotient here: only products and sums." } },
    12: { name: "Solving trigonometric equations", frame: "To solve $\\sin\\theta = c$, [[isolate]] the function, find the [[reference]] angle, then place it in each [[quadrant]] where the sign matches. In one turn that is usually [[two]] answers; adding $2\\pi k$ gives all of them.",
         chips: ["three", "complement"], fb: { "three": "A horizontal line meets one turn of a wave in two places (one at the very top or bottom).", "complement": "The reference angle is the acute angle to the $x$-axis, ignoring signs." } },
    13: { name: "Factoring and identities in equations", frame: "Treat $\\sin\\theta$ like a letter: [[factor]] the equation, solve each factor, then find the angles. If two functions appear, use an [[identity]] to leave one. Never [[divide]] by $\\sin\\theta$: you lose the solutions where it is 0.",
         chips: ["expand", "multiply"], fb: { "expand": "Factoring, not expanding, gives pieces you can set to zero.", "multiply": "The danger is **dividing** by something that can be 0: it throws solutions away." } },
    14: { name: "Multiple angles", frame: "For $\\sin(B\\theta) = c$ on $[0, 2\\pi)$ the angle $B\\theta$ runs through [[$B$]] turns. Solve it over all of them, then [[divide]] each answer by $B$. There are usually [[$2B$]] solutions.",
         chips: ["$B^2$", "multiply"], fb: { "$B^2$": "The count grows in proportion to $B$, not its square.", "multiply": "To get $\\theta$ from $B\\theta$ we divide by $B$." } },
    15: { name: "Modeling with trigonometric equations", frame: "To find [[when]] a model reaches a value, set it [[equal]] to the value, isolate the trigonometric function, find the inside angles in one cycle, then solve for [[$t$]]. The [[period]] gives every repeat.",
         chips: ["$\\theta$", "amplitude"], fb: { "$\\theta$": "The unknown is the time, $t$, not the angle.", "amplitude": "The **period** lets you list the repeats; the amplitude is the height." } }
  });
})();
