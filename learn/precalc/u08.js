/* ==========================================================================
   Precalculus — Unit 8: Further Applications of Trigonometry. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 8: the Law of Sines and the Law of
   Cosines (with area and Heron's formula), polar coordinates and their graphs,
   the polar form of a complex number with De Moivre's theorem and roots,
   parametric equations and projectile motion, and vectors with the dot product.
   Each section is split into lessons small enough to finish in one sitting; each
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
    blurb: "Before Chapter 8 · Right-triangle trigonometry, Pythagoras, proportions, unit-circle coordinates and radians.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · Right triangles", prompt: "A right triangle has hypotenuse 10 and an angle of $30^\\circ$. How long is the side **opposite** the $30^\\circ$?",
        options: [{ t: "$5$" }, { t: "$8.66$", fb: "That is the **adjacent** side, $10\\cos 30^\\circ$." }, { t: "$20$", fb: "A leg cannot be longer than the hypotenuse." }],
        answer: 0, skill: "Right triangle trigonometry", hints: ["$\\sin 30^\\circ = \\frac{\\text{opp}}{\\text{hyp}}$."], why: "$10 \\times \\frac{1}{2} = 5$." },
      { type: "num", kicker: "Check 2 · Pythagoras", prompt: "The legs of a right triangle are 5 and 12. How long is the hypotenuse?", answer: 13, skill: "Pythagorean theorem",
        near: [{ v: 17, fb: "Add the **squares** and take the square root: $25 + 144 = 169$." }], hints: ["$\\sqrt{5^2 + 12^2}$."], why: "$\\sqrt{169} = 13$." },
      { type: "num", kicker: "Check 3 · Proportions", prompt: "Solve $\\dfrac{x}{0.5} = \\dfrac{8}{0.8}$ for $x$.", pre: "$x =$", answer: 5, skill: "Proportions",
        near: [{ v: 0.8, fb: "Multiply both sides by 0.5: $x = 0.5 \\times \\frac{8}{0.8}$." }], hints: ["$\\frac{8}{0.8} = 10$."], why: "$x = 0.5 \\times 10 = 5$." },
      { type: "choice", kicker: "Check 4 · The unit circle", prompt: "What are the coordinates of the point on the unit circle at $60^\\circ$?",
        options: [{ t: "$\\left(\\dfrac{1}{2}, \\dfrac{\\sqrt{3}}{2}\\right)$" }, { t: "$\\left(\\dfrac{\\sqrt{3}}{2}, \\dfrac{1}{2}\\right)$", fb: "That is the point at $30^\\circ$: swap the two." }, { t: "$\\left(\\dfrac{1}{2}, \\dfrac{1}{2}\\right)$", fb: "The squares must add to 1: $\\frac{1}{4} + \\frac{1}{4} \\ne 1$." }],
        answer: 0, skill: "Unit circle", hints: ["The point is $(\\cos\\theta, \\sin\\theta)$."], why: "$(\\cos 60^\\circ, \\sin 60^\\circ)$." },
      { type: "choice", kicker: "Check 5 · Radians", prompt: "$\\dfrac{\\pi}{3}$ radians is how many degrees?",
        options: [{ t: "$60^\\circ$" }, { t: "$30^\\circ$", fb: "That is $\\frac{\\pi}{6}$." }, { t: "$120^\\circ$", fb: "That is $\\frac{2\\pi}{3}$." }],
        answer: 0, skill: "Radians", hints: ["$\\pi$ radians is $180^\\circ$."], why: "$\\frac{180}{3} = 60$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 8.1**. If **check 1** slipped, look again at lesson 5.15. If **check 4** slipped, lesson 5.8; if **check 5**, lesson 5.3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 8 */
  var PI = Math.PI, DEG = PI / 180;
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; };
  var GC8 = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; };
  // An angle in degrees as TeX in radians: radTex(150) is "\\frac{5\\pi}{6}".
  var radTex = function (d) {
    if (d === 0) return "0";
    var g = GC8(d, 180), n = d / g, m = 180 / g, sg = n < 0 ? "-" : "", an = Math.abs(n);
    return sg + (m === 1 ? (an === 1 ? "\\pi" : an + "\\pi") : (an === 1 ? "\\frac{\\pi}{" + m + "}" : "\\frac{" + an + "\\pi}{" + m + "}"));
  };
  var SIN = Math.sin, COS = Math.cos;
  // A triangle for a worked example. P = {A, B, C}; o.ang = angle texts, o.sd = side texts (a = BC, b = CA, c = AB).
  function tri8(alt, P, o) {
    o = o || {};
    var A = P.A, B = P.B, C = P.C, cen = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    var xs = [A[0], B[0], C[0]], ys = [A[1], B[1], C[1]], span = Math.max(Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)), k = span * 0.075;
    var out = function (p, d) { var dx = p[0] - cen[0], dy = p[1] - cen[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [p[0] + dx / L * d, p[1] + dy / L * d]; };
    var it = [{ path: [A, B, C], closed: true, fill: true, c: "blue" }, { seg: [A, B], c: "blue" }, { seg: [B, C], c: "blue" }, { seg: [C, A], c: "blue" }];
    ["A", "B", "C"].forEach(function (n) {
      it.push({ text: n, at: out(P[n], k * 1.5), c: "ink" });
      if (o.ang && o.ang[n]) it.push({ text: o.ang[n], at: out(P[n], -k * 3.2), c: "orange" });
    });
    var mid = function (p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
    if (o.sd) {
      if (o.sd.a) it.push({ text: o.sd.a, at: out(mid(B, C), k * 1.7), c: "green" });
      if (o.sd.b) it.push({ text: o.sd.b, at: out(mid(C, A), k * 1.7), c: "green" });
      if (o.sd.c) it.push({ text: o.sd.c, at: out(mid(A, B), k * 1.7), c: "green" });
    }
    (o.extra || []).forEach(function (e) { it.push(e); });
    var pad = k * 4;
    return grid(alt, it, { x: [Math.min.apply(null, xs) - pad, Math.max.apply(null, xs) + pad], y: [Math.min.apply(null, ys) - pad, Math.max.apply(null, ys) + pad], grid: false });
  }
  // Vertices from two angles (degrees) at A and B and the side c = AB.
  function triAB(Ad, Bd, c) {
    var Cd = 180 - Ad - Bd, b = c * SIN(Bd * DEG) / SIN(Cd * DEG);
    return { A: [0, 0], B: [c, 0], C: [b * COS(Ad * DEG), b * SIN(Ad * DEG)] };
  }

  /* ============================================ 1 · The Law of Sines */
  var HOW_1 = [["Third angle", "Subtract the two known angles from $180^\\circ$."],
               ["Pair", "Match each side with the angle **opposite** it, and write one proportion."],
               ["Solve", "Cross-multiply, divide, and evaluate in degree mode."]];
  var T1 = triAB(50, 30, 12.856);
  var G1 = function (k) {
    return tri8("A triangle with angle A = 50 degrees, angle B = 30 degrees and side a = 10 opposite A" + (k >= 2 ? "; the third angle C is 100 degrees" : "") + (k >= 3 ? " and side b is about 6.53" : "") + ".", T1,
      { ang: { A: "50°", B: "30°", C: k >= 2 ? "100°" : "?" }, sd: { a: "10", b: k >= 3 ? "6.53" : "b", c: k >= 4 ? "12.86" : "c" } });
  };
  LESSONS.push({
    title: "The Law of Sines", art: "pcpolar",
    blurb: "Book 8.1 · Triangles with no right angle: each side over the sine of its opposite angle is the same number.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A triangle has angles of $40^\\circ$ and $65^\\circ$. How big is the third angle?", pre: "third angle =", post: "degrees", answer: 75, skill: "Angles of a triangle",
        near: [{ v: 105, fb: "That is $40 + 65$. The three angles must add to $180^\\circ$." }], hints: ["$180 - 40 - 65$."], why: "$180 - 105 = 75$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the angles $A$ and $B$ to reshape the triangle (the side $AB = c$ stays 6). The readout divides **each side by the sine of its opposite angle**. Find a triangle that is **isosceles** ($A = B$) and one that is **right-angled**.",
        scene: { type: "sketch", x: [-0.8, 7], y: [-0.6, 9], u: 26, w: 252, grid: false, gate: true, pts: {},
          params: { A: { min: 20, max: 70, step: 5, v: 60, label: "$A$ (°)" }, B: { min: 20, max: 70, step: 5, v: 35, label: "$B$ (°)" } },
          track: function (s) { return s.p.A === s.p.B ? "iso" : s.p.A + s.p.B === 90 ? "right" : null; },
          draw: function (s) { var T = triAB(s.p.A, s.p.B, 6), C = T.C, C8 = 180 - s.p.A - s.p.B; return [{ path: [T.A, T.B, C], closed: true, fill: true, c: "blue" }, { seg: [T.A, T.B], c: "blue" }, { seg: [T.B, C], c: "blue" }, { seg: [C, T.A], c: "blue" }, { text: "A", at: [-0.45, -0.5], c: "ink" }, { text: "B", at: [6.45, -0.5], c: "ink" }, { text: "C", at: [C[0], C[1] + 0.55], c: "ink" }, { text: s.p.A + "°", at: [0.9, 0.35], c: "orange" }, { text: s.p.B + "°", at: [5.1, 0.35], c: "orange" }]; },
          readout: function (s) { var A = s.p.A, B = s.p.B, C = 180 - A - B, k = 6 / SIN(C * DEG), a = k * SIN(A * DEG), b = k * SIN(B * DEG); return "$C = " + C + "^\\circ$ · $a = " + nm(f4(a, 2)) + "$ · $b = " + nm(f4(b, 2)) + "$ · $c = 6$<br>$\\frac{a}{\\sin A} = " + nm(f4(a / SIN(A * DEG), 3)) + "$ · $\\frac{b}{\\sin B} = " + nm(f4(b / SIN(B * DEG), 3)) + "$ · $\\frac{c}{\\sin C} = " + nm(f4(6 / SIN(C * DEG), 3)) + "$<br>Isosceles: " + (s.tracked.iso ? "✓" : "—") + " · right: " + (s.tracked.right ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.iso && s.tracked.right); } },
        gate: true, then: "The three ratios $\\frac{a}{\\sin A}$, $\\frac{b}{\\sin B}$, $\\frac{c}{\\sin C}$ are **always equal**: that is the **Law of Sines**. When $A = B$ the sides $a$ and $b$ are equal too; when $C = 90^\\circ$ the common ratio is the hypotenuse, because $\\sin 90^\\circ = 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Law of Sines:** $\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C}$. Each side pairs with the angle **opposite** it. Know two angles and one side (ASA or AAS)? Find the third angle, then a side from one proportion.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "In a triangle $A = 50^\\circ$, $B = 30^\\circ$ and $a = 10$. Find $b$ and $c$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "C = 180 - 50 - 30", say: "The angles add to $180^\\circ$.", fig: G1(1) },
          { step: 1, m: "C = 100^\\circ", say: "Now all three angles are known.", fig: G1(2) },
          { step: 2, m: "\\frac{b}{\\sin 30^\\circ} = \\frac{10}{\\sin 50^\\circ}", say: "$b$ is opposite $B = 30^\\circ$; $10$ is opposite $A = 50^\\circ$.", ask: { prompt: "Which angle is opposite side $b$?", answer: 0, options: [{ t: "$B = 30^\\circ$" }, { t: "$A = 50^\\circ$", fb: "$a$ is opposite $A$. Side $b$ is opposite $B$." }] } },
          { step: 3, m: "b = \\frac{10\\sin 30^\\circ}{\\sin 50^\\circ} \\approx 6.53", say: "Solve for $b$.", fig: G1(3) },
          { step: 3, m: "c = \\frac{10\\sin 100^\\circ}{\\sin 50^\\circ} \\approx 12.86", say: "The same pattern for $c$, opposite $C = 100^\\circ$.", fig: G1(4) }] },
        gate: true, then: "$b \\approx 6.53$ and $c \\approx 12.86$. The longest side faces the largest angle." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve a triangle with $B = 35^\\circ$, $C = 80^\\circ$ and $c = 14$. Find $b$.",
        how: HOW_1, skill: "Law of Sines",
        steps: [
          { step: 1, ask: "The third angle $A = 180 - 35 - 80 =$", type: "num", pre: "$A =$", post: "degrees", answer: 65, near: [{ v: 115, fb: "That is $35 + 80$. Subtract it from 180." }], hint: "$180 - 115$.", m: "A = 65^\\circ", say: "All angles known." },
          { step: 2, ask: "Which proportion contains $b$ and the side we know?", type: "choice", answer: 0, options: [{ t: "$\\dfrac{b}{\\sin 35^\\circ} = \\dfrac{14}{\\sin 80^\\circ}$" }, { t: "$\\dfrac{b}{\\sin 80^\\circ} = \\dfrac{14}{\\sin 35^\\circ}$", fb: "$b$ is opposite $B = 35^\\circ$, and 14 is opposite $C = 80^\\circ$: keep each side over **its own** angle." }], m: "\\frac{b}{\\sin 35^\\circ} = \\frac{14}{\\sin 80^\\circ}", say: "Each side over its opposite angle." },
          { step: 3, ask: "$b = \\dfrac{14\\sin 35^\\circ}{\\sin 80^\\circ} \\approx$ (to 2 decimal places)", type: "num", pre: "$b \\approx$", answer: 8.15, tol: 0.006, calc: true, near: [{ v: 24.4, tol: 0.1, fb: "That is $\\frac{14\\sin 80^\\circ}{\\sin 35^\\circ}$: the sines are upside down." }], hint: "$14 \\times 0.5736 \\div 0.9848$.", m: "b \\approx 8.15", say: "Check: the smaller angle faces the shorter side." }],
        why: "Third angle, pair, solve." },
      { type: "num", kicker: "On your own", prompt: "In a triangle $A = 52^\\circ$, $B = 71^\\circ$ and $a = 15$. Find $b$ to 2 decimal places.", pre: "$b \\approx$", answer: 18, tol: 0.006, calc: true, skill: "Law of Sines",
        near: [{ v: 11.0, tol: 0.1, fb: "That has the sines the wrong way up. $b$ goes with $\\sin B$ on top: $b = \\frac{15\\sin 71^\\circ}{\\sin 52^\\circ}$." }], hints: ["$b = \\frac{15\\sin 71^\\circ}{\\sin 52^\\circ}$."], why: "$\\frac{15 \\times 0.9455}{0.7880} \\approx 18.00$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Across a river.** Two posts $A$ and $B$ are $120$ m apart on one bank. A tree $C$ on the other bank makes angle $A = 62^\\circ$ and angle $B = 54^\\circ$. How far is the tree from $A$?",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "C = 180 - 62 - 54 = 64^\\circ", say: "The angle at the tree." },
          { step: 2, m: "\\frac{AC}{\\sin 54^\\circ} = \\frac{120}{\\sin 64^\\circ}", say: "$AC$ is opposite $B = 54^\\circ$; the known side $AB = 120$ is opposite $C = 64^\\circ$.", ask: { prompt: "Which side is opposite the angle at the tree, $C$?", answer: 0, options: [{ t: "$AB = 120$" }, { t: "$AC$", fb: "$AC$ touches $C$: the side **opposite** $C$ is the one that does not touch it, $AB$." }] } },
          { step: 3, m: "AC = \\frac{120\\sin 54^\\circ}{\\sin 64^\\circ} \\approx 108.0", say: "About 108 m." }] },
        gate: true, then: "The tree is about $108$ m from $A$ — measured without crossing the river." },
      { type: "num", kicker: "Try it", prompt: "In a triangle $B = 48^\\circ$, $C = 82^\\circ$ and $b = 10$. Find $a$ to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$a \\approx$", answer: 10.31, tol: 0.006, calc: true, skill: "Law of Sines",
        near: [{ v: 13.26, tol: 0.1, fb: "That is $c$ (opposite $C = 82^\\circ$). We want $a$, opposite $A = 180 - 48 - 82 = 50^\\circ$." }], hints: ["First find $A = 50^\\circ$."], why: "$a = \\frac{10\\sin 50^\\circ}{\\sin 48^\\circ} \\approx 10.31$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tia finds $b$ for $A = 50^\\circ$, $B = 30^\\circ$, $a = 10$. Tap the line where the work **first** goes wrong.",
        lines: ["C = 180^\\circ - 50^\\circ - 30^\\circ = 100^\\circ", "\\frac{b}{\\sin 50^\\circ} = \\frac{10}{\\sin 30^\\circ}", "b = \\frac{10\\sin 50^\\circ}{\\sin 30^\\circ}", "b \\approx 15.32"], answer: 1, fix: "\\frac{b}{\\sin 30^\\circ} = \\frac{10}{\\sin 50^\\circ}",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Law of Sines",
        hints: ["Which angle is opposite $b$?"], why: "Side $b$ is opposite $B = 30^\\circ$, not $A$. So $b \\approx 6.53$." },
      { type: "num", kicker: "Use it", prompt: "Two lookout towers $A$ and $B$ are $10$ km apart. A fire at $C$ makes angle $A = 40^\\circ$ and angle $B = 75^\\circ$. How far is the fire from tower $A$? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$AC \\approx$", post: "km", answer: 10.66, tol: 0.006, calc: true, skill: "Law of Sines",
        near: [{ v: 6.8, tol: 0.1, fb: "That is the distance from tower $B$ ($BC$). We want $AC$, opposite $B = 75^\\circ$." }], hints: ["$C = 65^\\circ$; $AC$ is opposite $B$."], why: "$\\frac{10\\sin 75^\\circ}{\\sin 65^\\circ} \\approx 10.66$ km." }
    ]
  });

  /* ============================================ 2 · The ambiguous case */
  var HOW_2 = [["Find sin B", "$\\sin B = \\dfrac{b\\sin A}{a}$."],
               ["Two angles", "If $\\sin B < 1$, both $B$ and $180^\\circ - B$ have that sine."],
               ["Keep valid", "Keep an angle only if its triangle's angles still add to less than $180^\\circ$."]];
  // The part of a circle that lies inside the window, as paths.
  function arcIn(cx, cy, r, win, c) {
    var out = [], run = [], n = 360, i, t, p;
    var ok = function (q) { return q[0] >= win[0] && q[0] <= win[1] && q[1] >= win[2] && q[1] <= win[3]; };
    for (i = 0; i <= n; i++) {
      t = 2 * PI * i / n; p = [cx + r * COS(t), cy + r * SIN(t)];
      if (ok(p)) run.push(p); else { if (run.length > 1) out.push({ path: run, c: c || "soft" }); run = []; }
    }
    if (run.length > 1) out.push({ path: run, c: c || "soft" });
    return out;
  }
  LESSONS.push({
    title: "The ambiguous case: two sides and an angle", art: "pcpolar",
    blurb: "Book 8.1 · Given $a$, $b$ and $A$, there can be no triangle, one, or two. Draw it and see why.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "How many angles between $0^\\circ$ and $180^\\circ$ have a sine of $0.5$?", pre: "angles =", answer: 2, skill: "Sine of an angle",
        near: [{ v: 1, fb: "$30^\\circ$ works. So does its mirror image $180^\\circ - 30^\\circ = 150^\\circ$." }], hints: ["$\\sin 30^\\circ = \\sin 150^\\circ$."], why: "$30^\\circ$ and $150^\\circ$." },
      { type: "learn", kicker: "Explore",
        prompt: "Angle $A = 40^\\circ$ and side $b = 6$ are fixed. The circle around $C$ has radius $a$: the points where it meets the bottom line are the possible corners $B$. Slide $a$ and find a length that gives **no** triangle, **two** triangles and **one**.",
        scene: { type: "sketch", x: [-1, 10.5], y: [-1, 8], u: 28, w: 370, grid: false, gate: true, pts: {},
          params: { a: { min: 1, max: 8, step: 0.5, v: 2, label: "side $a$" } },
          track: function (s) { var h = 6 * SIN(40 * DEG), a = s.p.a; return a < h - 1e-9 ? "none" : a >= 6 ? "one" : "two"; },
          draw: function (s) {
            var a = s.p.a, Cx = 6 * COS(40 * DEG), Cy = 6 * SIN(40 * DEG), h = Cy, it = [{ seg: [[-0.5, 0], [10, 0]], c: "soft" }, { seg: [[0, 0], [Cx, Cy]], c: "ink" }, { seg: [[Cx, Cy], [Cx, 0]], c: "soft", dash: true }, { text: "A", at: [-0.5, -0.6], c: "ink" }, { text: "C", at: [Cx, Cy + 0.6], c: "ink" }, { text: "40°", at: [1.5, 0.45], c: "orange" }];
            it = it.concat(arcIn(Cx, Cy, a, [-1, 10.5, -1, 8], "blue"));
            if (a >= h) { var d = Math.sqrt(a * a - h * h); [Cx + d, Cx - d].forEach(function (x) { if (x > 0) it.push({ seg: [[Cx, Cy], [x, 0]], c: "orange" }, dot(x, 0, "green")); }); }
            return it; },
          readout: function (s) { var a = s.p.a, h = 6 * SIN(40 * DEG), n = a < h - 1e-9 ? 0 : a >= 6 ? 1 : 2; return "$a = " + nm(a) + "$ and the height of $C$ is $" + nm(f4(h, 2)) + "$: **" + (n === 0 ? "no" : n === 1 ? "one" : "two") + "** triangle" + (n === 2 ? "s" : "") + "<br>None: " + (s.tracked.none ? "✓" : "—") + " · two: " + (s.tracked.two ? "✓" : "—") + " · one: " + (s.tracked.one ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.none && s.tracked.two && s.tracked.one); } },
        gate: true, then: "If $a$ is **shorter than the height** $b\\sin A$ the circle misses the line: **no** triangle. If $a$ is **between** the height and $b$ it cuts the line **twice**: two triangles. If $a \\ge b$ only one cut is on the correct side of $A$: **one** triangle. (At exactly the height, the circle just touches: one right triangle.)" },
      { type: "learn", kicker: "The idea",
        prompt: "SSA: you know $a$, $b$ and $A$ (opposite $a$). Find $\\sin B = \\dfrac{b\\sin A}{a}$. If it is **above 1**: no triangle. Otherwise $B$ and $180^\\circ - B$ both have that sine: keep each one only if $A + B < 180^\\circ$.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "How many triangles have $A = 40^\\circ$, $a = 5$ and $b = 6$? Solve them.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "\\sin B = \\frac{6\\sin 40^\\circ}{5} \\approx 0.771", say: "Less than 1, so there is at least one triangle." },
          { step: 2, m: "B \\approx 50.5^\\circ \\ \\text{or} \\ B \\approx 129.5^\\circ", say: "Both have sine $0.771$: the second is $180^\\circ - 50.5^\\circ$.", ask: { prompt: "Why is $129.5^\\circ$ also possible?", answer: 0, options: [{ t: "Sine is the same for $B$ and $180^\\circ - B$" }, { t: "Sine is the same for $B$ and $90^\\circ - B$", fb: "That pairs sine with cosine. For sine alone, the partner is $180^\\circ - B$." }] } },
          { step: 3, m: "40^\\circ + 129.5^\\circ = 169.5^\\circ < 180^\\circ", say: "Still room for a third angle: both triangles exist." },
          { step: 3, m: "c \\approx 7.78 \\ \\text{or} \\ c \\approx 1.41", say: "$C = 89.5^\\circ$ or $10.5^\\circ$, then the Law of Sines for $c$." }] },
        gate: true, then: "**Two** triangles: $B \\approx 50.5^\\circ$ with $c \\approx 7.78$, and $B \\approx 129.5^\\circ$ with $c \\approx 1.41$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide how many triangles have $A = 62^\\circ$, $a = 7$ and $b = 10$.",
        how: HOW_2, skill: "The ambiguous case",
        steps: [
          { step: 1, ask: "$\\sin B = \\dfrac{10\\sin 62^\\circ}{7} \\approx$ (to 4 decimal places)", type: "num", pre: "$\\sin B \\approx$", answer: 1.2614, tol: 0.0006, calc: true, near: [{ v: 0.6180, tol: 0.001, fb: "That is $\\frac{7\\sin 62^\\circ}{10}$: $b\\sin A$ goes on top, divided by $a$." }], hint: "$\\frac{10 \\times 0.8829}{7}$.", m: "\\sin B \\approx 1.2614", say: "Bigger than 1!" },
          { step: 2, ask: "What does a sine bigger than 1 tell us?", type: "choice", answer: 0, options: [{ t: "No angle $B$ exists: no triangle" }, { t: "Two triangles", fb: "Two triangles need $\\sin B < 1$. No angle has a sine above 1." }], m: "\\text{no angle } B", say: "The side $a = 7$ is too short to reach the base." },
          { step: 3, ask: "How many triangles?", type: "num", pre: "triangles =", answer: 0, near: [{ v: 1, fb: "A sine above 1 is impossible: not even one." }], hint: "None.", m: "0 \\text{ triangles}", say: "Compare with the height: $10\\sin 62^\\circ \\approx 8.83 > 7$." }],
        why: "Find sin B, two angles, keep valid." },
      { type: "num", kicker: "On your own", prompt: "How many triangles have $A = 110^\\circ$, $a = 9$ and $b = 5$?", pre: "triangles =", answer: 1, skill: "The ambiguous case",
        near: [{ v: 2, fb: "$\\sin B \\approx 0.522$ gives $B \\approx 31.5^\\circ$ or $148.5^\\circ$. But $110^\\circ + 148.5^\\circ > 180^\\circ$: the second is impossible." }, { v: 0, fb: "$\\sin B \\approx 0.522$ is below 1: at least one triangle exists." }], hints: ["Check $A + B < 180^\\circ$ for both values of $B$."], why: "An obtuse $A$ leaves room for only the acute $B$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Exactly on the edge.** $A = 30^\\circ$, $a = 5$ and $b = 10$. How many triangles?",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "\\sin B = \\frac{10\\sin 30^\\circ}{5} = 1", say: "Exactly 1." },
          { step: 2, m: "B = 90^\\circ", say: "Only one angle has sine 1: no second value, because $180^\\circ - 90^\\circ = 90^\\circ$.", ask: { prompt: "What is $180^\\circ - 90^\\circ$?", answer: 0, options: [{ t: "$90^\\circ$: the same angle" }, { t: "$0^\\circ$", fb: "$180 - 90 = 90$. So the two candidates coincide." }] } },
          { step: 3, m: "C = 60^\\circ, \\ \\ c = \\frac{5\\sin 60^\\circ}{\\sin 30^\\circ} \\approx 8.66", say: "One right triangle: the side $a = 5$ just touches the base." }] },
        gate: true, then: "**One** triangle, a right triangle with $c \\approx 8.66$. This is the boundary between no triangle and two." },
      { type: "num", kicker: "Try it", prompt: "$A = 35^\\circ$, $a = 8$ and $b = 10$ give two triangles. What is the **larger** possible angle $B$, in degrees to 1 decimal place? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$B \\approx$", post: "degrees", answer: 134.2, tol: 0.06, calc: true, skill: "The ambiguous case",
        near: [{ v: 45.8, tol: 0.06, fb: "That is the **smaller** angle, from your calculator. The larger is $180^\\circ - 45.8^\\circ$." }], hints: ["$\\sin B = \\frac{10\\sin 35^\\circ}{8} \\approx 0.717$."], why: "$B \\approx 45.8^\\circ$ or $180 - 45.8 = 134.2^\\circ$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mo solves $A = 30^\\circ$, $a = 8$, $b = 12$ and finds $\\sin B = 0.75$, so $B \\approx 48.6^\\circ$ and \"there is one triangle\". What did he miss?",
        options: [{ t: "$B = 131.4^\\circ$ also works: $30^\\circ + 131.4^\\circ < 180^\\circ$, so there are **two** triangles" }, { t: "Nothing: the calculator gives the only answer", fb: "The calculator returns only the acute angle. The sine is also $0.75$ at $180^\\circ - 48.6^\\circ = 131.4^\\circ$." }, { t: "$B$ should be $0.75^\\circ$", fb: "$0.75$ is the sine, not the angle." }],
        answer: 0, skill: "The ambiguous case", hints: ["What is the other angle with the same sine?"], why: "Check $180^\\circ - B$ as well." },
      { type: "num", kicker: "Use it", prompt: "A beacon $C$ is $6$ km from a point $A$ on a straight shore, at $40^\\circ$ to it. A boat is $5$ km from $C$ and on the shore: **two** points fit. How far apart are they? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "distance $\\approx$", post: "km", answer: 6.36, tol: 0.06, calc: true, skill: "The ambiguous case",
        near: [{ v: 3.18, tol: 0.06, fb: "That is half of the distance: from the foot of the beacon to **one** point. The two points are on both sides of the foot." }], hints: ["The height of $C$ is $6\\sin 40^\\circ \\approx 3.86$; use Pythagoras for the half-gap."], why: "$2\\sqrt{5^2 - 3.857^2} \\approx 6.36$ km, which is also $7.78 - 1.41$." }
    ]
  });

  /* ============================================ 3 · The area of a triangle */
  var HOW_3 = [["Pick two", "Choose two sides and the angle **between** them."],
               ["Formula", "Area $= \\frac{1}{2}\\cdot$ side $\\cdot$ side $\\cdot\\sin$ of that angle."],
               ["Compute", "Multiply, and evaluate the sine in degree mode."]];
  LESSONS.push({
    title: "The area of a triangle", art: "pcpolar",
    blurb: "Book 8.1 · Area $= \\frac{1}{2}ab\\sin C$ without needing the height, and heights from the Law of Sines.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A triangle has base $10$ and height $6$. What is its area?", pre: "area =", answer: 30, skill: "Area of a triangle",
        near: [{ v: 60, fb: "That is base $\\times$ height. A triangle is **half** of that." }], hints: ["$\\frac{1}{2} \\times 10 \\times 6$."], why: "$30$." },
      { type: "learn", kicker: "Explore",
        prompt: "Two sides, $7$ and $5$, meet at the corner $C$. Slide the angle $C$ and watch the **area**. Find the angle with the **largest** area, and **two different angles** that give the same area ($30^\\circ$ and one other).",
        scene: { type: "sketch", x: [-5.5, 8.5], y: [-0.8, 5.6], u: 26, w: 412, grid: false, gate: true, pts: {},
          params: { C: { min: 10, max: 170, step: 10, v: 40, label: "$C$ (°)" } },
          track: function (s) { return s.p.C === 90 ? "max" : s.p.C === 30 ? "s30" : s.p.C === 150 ? "s150" : null; },
          draw: function (s) { var C = s.p.C * DEG, A = [5 * COS(C), 5 * SIN(C)]; return [{ path: [[0, 0], [7, 0], A], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [7, 0]], c: "blue" }, { seg: [[7, 0], A], c: "blue" }, { seg: [A, [0, 0]], c: "blue" }, { seg: [A, [A[0], 0]], c: "orange", dash: true }, { text: "C", at: [-0.5, -0.55], c: "ink" }, { text: "7", at: [3.5, -0.55], c: "green" }, { text: "5", at: [A[0] / 2 - 0.4, A[1] / 2 + 0.2], c: "green" }, { text: s.p.C + "°", at: [0.9 + 0.25, 0.4], c: "orange" }]; },
          readout: function (s) { var a = 17.5 * SIN(s.p.C * DEG); return "$\\frac{1}{2}\\cdot 7 \\cdot 5 \\cdot \\sin " + s.p.C + "^\\circ = " + nm(f4(a, 2)) + "$<br>Largest area: " + (s.tracked.max ? "✓" : "—") + " · $30^\\circ$: " + (s.tracked.s30 ? "✓" : "—") + " · $150^\\circ$: " + (s.tracked.s150 ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.max && s.tracked.s30 && s.tracked.s150); } },
        gate: true, then: "The area is **largest at $90^\\circ$**, where $\\sin C = 1$ and the area is $17.5$. And $30^\\circ$ and $150^\\circ$ give the **same** area $8.75$, because $\\sin 150^\\circ = \\sin 30^\\circ$. The orange height is $5\\sin C$: area $= \\frac{1}{2}\\cdot 7 \\cdot 5\\sin C$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Area** $= \\frac{1}{2}ab\\sin C$: two sides and the angle **between** them. It is $\\frac{1}{2}\\times$ base $\\times$ height, with height $= b\\sin C$. For an angle inside a triangle, $C$ and $180^\\circ - C$ give the same area.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Two sides of a triangle are $9$ and $12$, with $40^\\circ$ between them. Find its area.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "a = 9, \\ b = 12, \\ C = 40^\\circ", say: "The $40^\\circ$ is the angle between the two sides: it is the one to use." },
          { step: 2, m: "\\text{Area} = \\frac{1}{2}ab\\sin C", say: "Half the product of the sides, times the sine of the angle between them.", ask: { prompt: "Which angle goes in the sine?", answer: 0, options: [{ t: "The angle between the two known sides" }, { t: "Any angle in the triangle", fb: "The two sides in the product must be the two sides that **make** the angle." }] } },
          { step: 3, m: "= \\frac{1}{2}(9)(12)\\sin 40^\\circ", say: "Substitute." },
          { step: 3, m: "\\approx 54(0.6428) \\approx 34.71", say: "$\\frac{1}{2} \\cdot 9 \\cdot 12 = 54$." }] },
        gate: true, then: "The area is about $34.71$ square units." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the area with sides $8$ and $11$ and $62^\\circ$ between them.",
        how: HOW_3, skill: "Area of a triangle",
        steps: [
          { step: 1, ask: "Is $62^\\circ$ the angle **between** the sides 8 and 11?", type: "choice", answer: 0, options: [{ t: "Yes: so use it directly" }, { t: "No: I need the third angle first", fb: "The problem says the angle is between the two sides, so the formula applies at once." }], m: "a = 8, \\ b = 11, \\ C = 62^\\circ", say: "The pieces fit the formula." },
          { step: 2, ask: "$\\frac{1}{2} \\cdot 8 \\cdot 11 =$", type: "num", pre: "$=$", answer: 44, near: [{ v: 88, fb: "Do not forget the factor $\\frac{1}{2}$." }], hint: "$88 \\div 2$.", m: "\\text{Area} = 44\\sin 62^\\circ", say: "Half the product of the sides." },
          { step: 3, ask: "$44\\sin 62^\\circ \\approx$ (to 2 decimal places)", type: "num", pre: "area $\\approx$", answer: 38.85, tol: 0.006, calc: true, near: [{ v: 20.66, tol: 0.1, fb: "That is $44\\cos 62^\\circ$: use the **sine**." }], hint: "$44 \\times 0.8829$.", m: "\\approx 38.85", say: "In square units." }],
        why: "Pick two, formula, compute." },
      { type: "num", kicker: "On your own", prompt: "A triangle has sides $6$ and $10$ with an angle of $150^\\circ$ between them. What is its area?", pre: "area =", answer: 15, tol: 0.006, calc: true, skill: "Area of a triangle",
        near: [{ v: 30, fb: "That is $ab\\sin C$: do not forget the $\\frac{1}{2}$." }, { v: -26, tol: 0.1, fb: "That used the **cosine**. Area uses the sine." }], hints: ["$\\sin 150^\\circ = \\frac{1}{2}$."], why: "$\\frac{1}{2}(6)(10)(0.5) = 15$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A height you cannot measure.** From $A$ the top of a hill is at an angle of elevation $28^\\circ$. From $B$, $60$ m closer in a straight line, it is $43^\\circ$. How high is the hill?",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "\\angle ATB = 43^\\circ - 28^\\circ = 15^\\circ", say: "The angle at the top: the outside angle $43^\\circ$ at $B$ is the sum of the two angles inside that are not next to it." },
          { step: 2, m: "\\frac{BT}{\\sin 28^\\circ} = \\frac{60}{\\sin 15^\\circ}", say: "Law of Sines in the triangle $ABT$.", ask: { prompt: "$BT$ is opposite which angle?", answer: 0, options: [{ t: "The $28^\\circ$ angle at $A$" }, { t: "The $15^\\circ$ angle at $T$", fb: "The angle at $T$ is opposite the side $AB = 60$. $BT$ joins $B$ and $T$, so it is opposite the third corner, $A$." }] } },
          { step: 3, m: "BT = \\frac{60\\sin 28^\\circ}{\\sin 15^\\circ} \\approx 108.8", say: "The slant distance from $B$ to the top." },
          { step: 3, m: "h = BT\\sin 43^\\circ \\approx 74.2", say: "The height is the vertical part of that slant." }] },
        gate: true, then: "The hill is about $74.2$ m high." },
      { type: "num", kicker: "Try it", prompt: "Find the area of a triangle with sides $14$ and $9$ and an angle of $35^\\circ$ between them, to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "area $\\approx$", answer: 36.14, tol: 0.006, calc: true, skill: "Area of a triangle",
        near: [{ v: 72.27, tol: 0.1, fb: "That is double: you forgot the $\\frac{1}{2}$." }], hints: ["$\\frac{1}{2}(14)(9)\\sin 35^\\circ$."], why: "$63 \\times 0.5736 \\approx 36.14$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Pat has sides $7$ and $9$ and a $40^\\circ$ angle **opposite** the side 7. He writes Area $= \\frac{1}{2}(7)(9)\\sin 40^\\circ$. What is wrong?",
        options: [{ t: "The $40^\\circ$ is not **between** the sides 7 and 9, so the formula does not apply directly" }, { t: "Nothing: any angle can be used", fb: "The formula needs the angle **between** the two sides. Here the angle is opposite the 7, so it sits between the 9 and the unknown side." }, { t: "He should use the cosine", fb: "Area uses the sine of the included angle; the problem is which angle that is." }],
        answer: 0, skill: "Area of a triangle", hints: ["Which two sides make the $40^\\circ$ angle?"], why: "Find the third angle or side first." },
      { type: "num", kicker: "Use it", prompt: "A triangular garden has two fences, $20$ m and $30$ m, that meet at $70^\\circ$. How much turf covers it, in square metres to 1 decimal place? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "area $\\approx$", post: "m²", answer: 281.9, tol: 0.06, calc: true, skill: "Area of a triangle",
        near: [{ v: 563.8, tol: 0.1, fb: "Half of that: you forgot the factor $\\frac{1}{2}$." }], hints: ["$\\frac{1}{2}(20)(30)\\sin 70^\\circ$."], why: "$300 \\times 0.9397 \\approx 281.9$." }
    ]
  });
  /* ============================================ 4 · The Law of Cosines */
  var HOW_4 = [["Match", "Choose the angle, and the side **opposite** it."],
               ["Substitute", "Put the sides and the angle into the formula."],
               ["Solve", "A square root for a side; an inverse cosine for an angle."]];
  LESSONS.push({
    title: "The Law of Cosines", art: "pcpolar",
    blurb: "Book 8.2 · Pythagoras with a correction: $c^2 = a^2 + b^2 - 2ab\\cos C$. Use it for SAS and SSS.",
    mins: 15, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In a right triangle with $C = 90^\\circ$, what is $\\cos C$?",
        options: [{ t: "$0$" }, { t: "$1$", fb: "$\\cos 0^\\circ = 1$. At $90^\\circ$ the cosine is 0." }, { t: "$90$", fb: "$90$ is the angle, not its cosine." }],
        answer: 0, skill: "Cosine values", hints: ["The point on the unit circle at $90^\\circ$ is $(0, 1)$."], why: "$\\cos 90^\\circ = 0$." },
      { type: "learn", kicker: "Explore",
        prompt: "Two sides, $5$ and $7$, meet at $C$. Slide the angle $C$ and watch the third side $c$. Compare it with the Pythagorean value $\\sqrt{5^2 + 7^2}$. Find an angle where $c$ is **shorter** than that, **equal**, and **longer**.",
        scene: { type: "sketch", x: [-7.5, 6], y: [-0.8, 7.6], u: 24, w: 372, grid: false, gate: true, pts: {},
          params: { C: { min: 20, max: 160, step: 10, v: 40, label: "$C$ (°)" } },
          track: function (s) { return s.p.C < 90 ? "short" : s.p.C === 90 ? "right" : "long"; },
          draw: function (s) { var C = s.p.C * DEG, A = [7 * COS(C), 7 * SIN(C)]; return [{ path: [[0, 0], [5, 0], A], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [5, 0]], c: "blue" }, { seg: [[0, 0], A], c: "blue" }, { seg: [[5, 0], A], c: "orange", dash: true }, { text: "C", at: [-0.5, -0.6], c: "ink" }, { text: "5", at: [2.5, -0.6], c: "green" }, { text: "7", at: [A[0] / 2 - 0.5, A[1] / 2 + 0.3], c: "green" }, { text: "c", at: [(5 + A[0]) / 2 + 0.5, A[1] / 2 + 0.4], c: "orange" }, { text: s.p.C + "°", at: [1.7, 0.5], c: "orange" }]; },
          readout: function (s) { var C = s.p.C * DEG, c2 = 74 - 70 * COS(C); return "$c^2 = 5^2 + 7^2 - 2(5)(7)\\cos " + s.p.C + "^\\circ = " + nm(f4(c2, 2)) + "$, so $c = " + nm(f4(Math.sqrt(c2), 2)) + "$ (Pythagoras: $" + nm(f4(Math.sqrt(74), 2)) + "$)<br>Shorter: " + (s.tracked.short ? "✓" : "—") + " · equal: " + (s.tracked.right ? "✓" : "—") + " · longer: " + (s.tracked.long ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.short && s.tracked.right && s.tracked.long); } },
        gate: true, then: "At $C = 90^\\circ$ the cosine is 0 and $c^2 = a^2 + b^2$: **Pythagoras**. For a smaller angle the third side is **shorter**: subtract $2ab\\cos C$. For a larger angle $\\cos C < 0$, so the term **adds** and the side is longer. That is the **Law of Cosines**." },
      { type: "learn", kicker: "The idea",
        prompt: "**Law of Cosines:** $c^2 = a^2 + b^2 - 2ab\\cos C$ ($c$ opposite $C$). **SAS** (two sides and the angle between): find $c$. **SSS**: rearrange, $\\cos C = \\dfrac{a^2 + b^2 - c^2}{2ab}$, and take the inverse cosine.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Two sides of a triangle are $8$ and $11$, with $40^\\circ$ between them. Find the third side.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "c^2 = a^2 + b^2 - 2ab\\cos C", say: "$c$ is opposite the $40^\\circ$ angle $C$." },
          { step: 2, m: "c^2 = 8^2 + 11^2 - 2(8)(11)\\cos 40^\\circ", say: "Substitute the two sides and the angle between them.", ask: { prompt: "Which angle goes in the cosine?", answer: 0, options: [{ t: "$C = 40^\\circ$: opposite the side we want" }, { t: "Either of the other two", fb: "The angle in the cosine is the one **opposite** $c$, which here is also the angle between the known sides." }] } },
          { step: 3, m: "c^2 = 185 - 176(0.766) \\approx 50.18", say: "Work out the brackets first." },
          { step: 3, m: "c \\approx 7.08", say: "Take the square root: about $7.08$." }] },
        gate: true, then: "The third side is about $7.08$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the **largest angle** of a triangle with sides $7$, $9$ and $12$.",
        how: HOW_4, skill: "Law of Cosines",
        steps: [
          { step: 1, ask: "Which angle is the largest?", type: "choice", answer: 0, options: [{ t: "The angle opposite the side 12" }, { t: "The angle opposite the side 7", fb: "The largest angle faces the **longest** side." }], m: "c = 12, \\ a = 7, \\ b = 9", say: "Call the angle opposite 12 the angle $C$." },
          { step: 2, ask: "$\\cos C = \\dfrac{7^2 + 9^2 - 12^2}{2(7)(9)} =$ (a fraction is fine)", type: "num", pre: "$\\cos C \\approx$", answer: -0.1111, tol: 0.0006, calc: true, near: [{ v: 0.1111, tol: 0.0006, fb: "The top is $49 + 81 - 144 = -14$: negative." }], hint: "$\\frac{-14}{126}$.", m: "\\cos C = -\\frac{14}{126}", say: "Negative: the angle is obtuse." },
          { step: 3, ask: "$C = \\arccos(-0.1111) \\approx$ (in degrees to 2 decimal places)", type: "num", pre: "$C \\approx$", post: "degrees", answer: 96.38, tol: 0.006, calc: true, near: [{ v: 83.62, tol: 0.006, fb: "That is the angle with cosine $+0.1111$. The cosine here is negative, so the angle is bigger than $90^\\circ$." }], hint: "Inverse cosine, in degrees.", m: "C \\approx 96.38^\\circ", say: "An obtuse angle, as the negative cosine said." }],
        why: "Match, substitute, solve." },
      { type: "num", kicker: "On your own", prompt: "Two sides of a triangle are $5$ and $9$ with $100^\\circ$ between them. Find the third side to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$c \\approx$", answer: 11.03, tol: 0.006, calc: true, skill: "Law of Cosines",
        near: [{ v: 9.51, tol: 0.1, fb: "The cosine of $100^\\circ$ is **negative**, so $-2ab\\cos C$ **adds**: $c^2 = 106 + 15.6$, not $106 - 15.6$." }], hints: ["$c^2 = 25 + 81 - 90\\cos 100^\\circ$."], why: "$c^2 \\approx 121.63$, so $c \\approx 11.03$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**All three angles from the sides.** A triangle has sides $4$, $6$ and $9$. Find all three angles.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "\\cos C = \\frac{4^2 + 6^2 - 9^2}{2(4)(6)}", say: "Start with the **largest** angle, opposite the longest side 9.", ask: { prompt: "After finding the largest angle, the other two angles must be…", answer: 0, options: [{ t: "acute: a calculator's inverse sine is then safe" }, { t: "obtuse", fb: "A triangle has at most one angle of $90^\\circ$ or more, and the largest is already used." }] } },
          { step: 2, m: "\\cos C = \\frac{-29}{48} \\approx -0.604", say: "Negative: obtuse." },
          { step: 3, m: "C \\approx 127.2^\\circ", say: "The calculator's inverse cosine gives obtuse angles correctly." },
          { step: 3, m: "\\cos B = \\frac{4^2 + 9^2 - 6^2}{2(4)(9)} \\approx 0.847", say: "Another angle: opposite the side 6." },
          { step: 3, m: "B \\approx 32.1^\\circ, \\ A \\approx 20.7^\\circ", say: "The last angle: $180 - 127.2 - 32.1$." }] },
        gate: true, then: "The angles are about $127.2^\\circ$, $32.1^\\circ$ and $20.7^\\circ$." },
      { type: "num", kicker: "Try it", prompt: "A triangle has sides $5$, $6$ and $7$. Find the angle opposite the side $7$, in degrees to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "angle $\\approx$", post: "degrees", answer: 78.46, tol: 0.006, calc: true, skill: "Law of Cosines",
        near: [{ v: 0.2, tol: 0.001, fb: "That is the **cosine**. Take the inverse cosine to get the angle." }], hints: ["$\\cos C = \\frac{5^2 + 6^2 - 7^2}{2(5)(6)}$."], why: "$\\cos C = 0.2$, so $C \\approx 78.46^\\circ$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Rio finds $c$ for $a = 6$, $b = 10$ and $C = 50^\\circ$. Tap the line where the work **first** goes wrong.",
        lines: ["c^2 = a^2 + b^2 - 2ab\\cos C", "c^2 = 6^2 + 10^2 - 2(6)(10)\\cos 50^\\circ", "c^2 = 136 - 120\\cos 50^\\circ = 16\\cos 50^\\circ", "c^2 \\approx 10.28"], answer: 2, fix: "c^2 = 136 - 120(0.6428) \\approx 58.87",
        fb: { 0: GIVEN, 1: "That is the formula with the numbers substituted correctly.", 3: LATER }, skill: "Law of Cosines",
        hints: ["Can you subtract $120\\cos 50^\\circ$ from 136 by combining them like terms?"], why: "$136$ and $120\\cos 50^\\circ$ are not like terms: work out the product first, then subtract. $c \\approx 7.67$." },
      { type: "num", kicker: "Use it", prompt: "Two ships leave a port together on courses $70^\\circ$ apart, at $20$ km/h and $30$ km/h. How far apart are they after 2 hours? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "distance $\\approx$", post: "km", answer: 59.65, tol: 0.006, calc: true, skill: "Law of Cosines",
        near: [{ v: 66.17, tol: 0.1, fb: "That used $ab\\cos C$: the formula has $2ab\\cos C$." }], hints: ["After 2 hours the sides are $40$ and $60$ km."], why: "$c^2 = 40^2 + 60^2 - 2(40)(60)\\cos 70^\\circ \\approx 3558$, so $c \\approx 59.65$ km." }
    ]
  });

  /* ============================================ 5 · Heron's formula, and which law? */
  var HOW_5 = [["Find s", "Half the perimeter: $s = \\frac{a + b + c}{2}$."],
               ["Subtract", "Work out $s - a$, $s - b$ and $s - c$."],
               ["Root", "Multiply the four numbers and take the square root."]];
  LESSONS.push({
    title: "Heron's formula, and which law to use", art: "pcpolar",
    blurb: "Book 8.2 · The area from three sides alone, and how to choose between the two laws.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "You know two angles of a triangle and one side. Which law do you use first?",
        options: [{ t: "The Law of Sines" }, { t: "The Law of Cosines", fb: "The Law of Cosines needs two sides and an angle, or three sides." }, { t: "Neither: it cannot be solved", fb: "The third angle is $180^\\circ$ minus the two, and then the Law of Sines finds the other sides." }],
        answer: 0, skill: "Choosing a law", hints: ["Two angles give you a pair: a side and the angle opposite it."], why: "AAS or ASA: Law of Sines." },
      { type: "learn", kicker: "Explore",
        prompt: "Two sides, $a = 7$ and $b = 9$, are fixed. Slide the third side $c$ and watch the area from **Heron's formula**. Find the two values of $c$ where the \"triangle\" goes **flat** and the area is **zero**.",
        scene: { type: "sketch", x: [-1, 17], y: [-0.8, 9.5], u: 20, w: 408, grid: false, gate: true, pts: {},
          params: { c: { min: 2, max: 16, step: 1, v: 9, label: "side $c$" } },
          track: function (s) { return s.p.c === 2 ? "short" : s.p.c === 16 ? "long" : null; },
          draw: function (s) { var c = s.p.c, x = (81 + c * c - 49) / (2 * c), y = Math.sqrt(Math.max(0, 81 - x * x)); return [{ path: [[0, 0], [c, 0], [x, y]], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [c, 0]], c: "blue" }, { seg: [[c, 0], [x, y]], c: "blue" }, { seg: [[x, y], [0, 0]], c: "blue" }, { text: "c = " + c, at: [c / 2, -0.7], c: "green" }, dot(x, y, "orange")]; },
          readout: function (s) { var c = s.p.c, st = (7 + 9 + c) / 2, ar = Math.sqrt(Math.max(0, st * (st - 7) * (st - 9) * (st - c))); return "$s = " + nm(st) + "$ · area $= \\sqrt{s(s - 7)(s - 9)(s - c)} = " + nm(f4(ar, 2)) + "$<br>Flat at the short end: " + (s.tracked.short ? "✓" : "—") + " · flat at the long end: " + (s.tracked.long ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.short && s.tracked.long); } },
        gate: true, then: "The area is $0$ at $c = 2$ and $c = 16$: the sides $7$, $9$ and $2$ (or $16$) just fit in a straight line, since $9 - 7 = 2$ and $9 + 7 = 16$. Any third side **between** those values makes a real triangle. **Heron's formula** gets the area from three sides, no angle needed." },
      { type: "learn", kicker: "The idea",
        prompt: "**Heron's formula:** with $s = \\dfrac{a + b + c}{2}$, the area is $\\sqrt{s(s - a)(s - b)(s - c)}$. It needs only the three sides. It gives $0$ when the triangle is flat.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the area of a triangle with sides $13$, $14$ and $15$.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "s = \\frac{13 + 14 + 15}{2} = 21", say: "Half the perimeter." },
          { step: 2, m: "s - a = 8, \\ s - b = 7, \\ s - c = 6", say: "Subtract each side from 21.", ask: { prompt: "What is $21 - 13$?", answer: 0, options: [{ t: "$8$" }, { t: "$34$", fb: "That is $21 + 13$. Subtract." }] } },
          { step: 3, m: "\\text{Area} = \\sqrt{21 \\cdot 8 \\cdot 7 \\cdot 6}", say: "Multiply the four numbers under the root." },
          { step: 3, m: "= \\sqrt{7056} = 84", say: "A perfect square: exactly 84." }] },
        gate: true, then: "The area is exactly $84$ square units." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the area with sides $7$, $8$ and $9$.",
        how: HOW_5, skill: "Heron's formula",
        steps: [
          { step: 1, ask: "$s = \\dfrac{7 + 8 + 9}{2} =$", type: "num", pre: "$s =$", answer: 12, near: [{ v: 24, fb: "That is the whole perimeter. $s$ is **half** of it." }], hint: "$24 \\div 2$.", m: "s = 12", say: "The semi-perimeter." },
          { step: 2, ask: "The product $s(s - a)(s - b)(s - c) = 12 \\cdot 5 \\cdot 4 \\cdot 3 =$", type: "num", pre: "$=$", answer: 720, near: [{ v: 60, fb: "$5 \\cdot 4 \\cdot 3 = 60$: do not forget the $s = 12$ in front." }], hint: "$12 \\times 60$.", m: "12 \\cdot 5 \\cdot 4 \\cdot 3 = 720", say: "Four numbers." },
          { step: 3, ask: "Area $= \\sqrt{720} \\approx$ (to 2 decimal places)", type: "num", pre: "area $\\approx$", answer: 26.83, tol: 0.006, calc: true, near: [{ v: 720, fb: "Take the **square root** of 720." }], hint: "$\\sqrt{720}$.", m: "\\text{Area} \\approx 26.83", say: "Not a perfect square, so a decimal." }],
        why: "Find s, subtract, root." },
      { type: "sort", kicker: "On your own", prompt: "Which law do you start with? Sort each case.",
        bins: ["Law of Sines", "Law of Cosines"],
        cards: [{ t: "Two angles and a side (AAS)", bin: 0, fb: "Two angles give a side-angle pair: Law of Sines." }, { t: "Two sides and the angle **between** them (SAS)", bin: 1, fb: "SAS: the Law of Cosines finds the third side." }, { t: "Three sides (SSS)", bin: 1, fb: "SSS: the Law of Cosines finds an angle." }, { t: "Two angles and the side **between** them (ASA)", bin: 0, fb: "Find the third angle, then use the Law of Sines." }, { t: "Two sides and an angle **opposite** one of them (SSA)", bin: 0, fb: "SSA: the Law of Sines, watching for two triangles." }],
        skill: "Choosing a law", hints: ["Is there a side-and-opposite-angle pair, or not?"], why: "A side and its opposite angle: Sines. Otherwise: Cosines." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A big triangle.** A triangular field has sides $120$ ft, $150$ ft and $200$ ft. Find its area.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "s = \\frac{120 + 150 + 200}{2} = 235", say: "Half the perimeter." },
          { step: 2, m: "s - a = 115, \\ s - b = 85, \\ s - c = 35", say: "Subtract each side from 235." },
          { step: 3, m: "\\text{Area} = \\sqrt{235 \\cdot 115 \\cdot 85 \\cdot 35}", say: "Four numbers under the root.", ask: { prompt: "Roughly how big is the product?", answer: 0, options: [{ t: "About 80 million: the root is about 9000" }, { t: "About 80 thousand: the root is about 280", fb: "$235 \\times 115 \\approx 27\\,000$, times $85$ is about $2.3$ million, times $35$ about $80$ million." }] } },
          { step: 3, m: "\\approx 8966.6", say: "A calculator does it in one go." }] },
        gate: true, then: "The field is about $8967$ square feet." },
      { type: "num", kicker: "Try it", prompt: "Find the area of a triangle with sides $9$, $10$ and $17$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "area =", answer: 36, tol: 0.006, calc: true, skill: "Heron's formula",
        near: [{ v: 1296, fb: "That is the number **under** the root: $18 \\cdot 9 \\cdot 8 \\cdot 1 = 1296$. Take its square root." }], hints: ["$s = 18$."], why: "$\\sqrt{18 \\cdot 9 \\cdot 8 \\cdot 1} = \\sqrt{1296} = 36$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Dee uses Heron's formula for sides $6$, $7$ and $9$. Tap the line where the work **first** goes wrong.",
        lines: ["a = 6, \\ b = 7, \\ c = 9", "s = 6 + 7 + 9 = 22", "\\text{Area} = \\sqrt{22(16)(15)(13)}", "\\text{Area} \\approx 261.99"], answer: 1, fix: "s = \\frac{6 + 7 + 9}{2} = 11",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Heron's formula",
        hints: ["Is $s$ the whole perimeter?"], why: "$s$ is **half** the perimeter. With $s = 11$ the area is $\\sqrt{11 \\cdot 5 \\cdot 4 \\cdot 2} \\approx 20.98$." },
      { type: "num", kicker: "Use it", prompt: "A triangular sail has sides $4$ m, $5$ m and $6$ m. How much cloth does it need, in square metres to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "area $\\approx$", post: "m²", answer: 9.92, tol: 0.006, calc: true, skill: "Heron's formula",
        near: [{ v: 7.5, fb: "That is $s$, the semi-perimeter, not the area." }], hints: ["$s = 7.5$."], why: "$\\sqrt{7.5 \\cdot 3.5 \\cdot 2.5 \\cdot 1.5} \\approx 9.92$." }
    ]
  });
  /* ========================================================= polar helpers */
  // A polar grid out to radius R: circles, rays every 30 degrees, axes and ring labels.
  function polGrid(R) {
    var it = [], r, k;
    for (r = 1; r <= R; r++) it.push({ circle: [[0, 0], r], c: "soft" });
    for (k = 0; k < 12; k++) it.push({ seg: [[0, 0], [(R + 0.35) * COS(k * 30 * DEG), (R + 0.35) * SIN(k * 30 * DEG)]], c: "soft", dash: true });
    it.push({ seg: [[-R - 0.5, 0], [R + 0.5, 0]], c: "soft" }, { seg: [[0, -R - 0.5], [0, R + 0.5]], c: "soft" });
    for (r = 1; r <= R; r++) it.push({ text: String(r), at: [r + 0.2, -0.4], c: "soft" });
    return it;
  }
  function polfig(alt, items, R) { R = R || 4; return grid(alt, polGrid(R).concat(items), { x: [-R - 0.9, R + 0.9], y: [-R - 0.9, R + 0.9], grid: false }); }
  var PX = function (r, d) { return [r * COS(d * DEG), r * SIN(d * DEG)]; };

  /* ============================================ 6 · Plotting polar points */
  var HOW_6 = [["Turn", "Face the direction $\\theta$, counterclockwise from the positive $x$-axis."],
               ["Go", "Walk $|r|$ steps along it, or **backwards** if $r < 0$."],
               ["Mark", "That is the point."]];
  var G6 = function (k) {
    var it = [{ seg: [[0, 0], PX(4.3, 120)], c: "orange", dash: true }, { seg: [[0, 0], PX(4.3, 45)], c: "orange", dash: true }];
    if (k >= 2) it.push({ seg: [[0, 0], PX(3, 120)], c: "blue" }, dot(PX(3, 120)[0], PX(3, 120)[1], "blue", "(3, 120°)", "ne"));
    if (k >= 3) it.push({ seg: [[0, 0], PX(-2, 45)], c: "blue" }, dot(PX(-2, 45)[0], PX(-2, 45)[1], "blue", "(-2, 45°)", "sw"));
    return polfig("A polar grid with two dashed rays, at 120 and 45 degrees" + (k >= 2 ? ", the point (3, 120 degrees) in the second quadrant" : "") + (k >= 3 ? " and the point (-2, 45 degrees) in the third quadrant" : "") + ".", it);
  };
  LESSONS.push({
    title: "Plotting points with polar coordinates", art: "pcpolar",
    blurb: "Book 8.3 · Name a point by how far and in which direction, instead of across and up.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A point is 5 units from the origin, straight along the positive $y$-axis. What are its $(x, y)$ coordinates?",
        options: [{ t: "$(0, 5)$" }, { t: "$(5, 0)$", fb: "That is 5 along the $x$-axis. The $y$-axis points up." }, { t: "$(5, 5)$", fb: "That would be $5\\sqrt{2} \\approx 7$ from the origin." }],
        answer: 0, skill: "Coordinates", hints: ["Zero across, five up."], why: "$(0, 5)$." },
      { type: "learn", kicker: "Explore",
        prompt: "A polar point $(r, \\theta)$: turn by $\\theta$, then go $r$ out. Slide $r$ and $\\theta$ to land the blue dot on the **orange target**, which is $(3, 210^\\circ)$. Then find a **second name** for the same point, using a **negative $r$**.",
        scene: { type: "sketch", x: [-4.8, 4.8], y: [-4.8, 4.8], u: 30, w: 336, grid: false, gate: true, pts: {},
          params: { r: { min: -4, max: 4, step: 1, v: 2, label: "$r$" }, t: { min: 0, max: 360, step: 15, v: 60, label: "$\\theta$ (°)" } },
          track: function (s) { return s.p.r === 3 && s.p.t === 210 ? "pos" : s.p.r === -3 && s.p.t === 30 ? "neg" : null; },
          draw: function (s) { var p = PX(s.p.r, s.p.t), it = polGrid(4).concat([{ seg: [[0, 0], PX(4.4, s.p.t)], c: "soft" }, { seg: [[0, 0], p], c: "blue" }, hole(PX(3, 210)[0], PX(3, 210)[1], "orange"), dot(p[0], p[1], "blue")]); if (s.p.t > 0) it.push({ turn: [[0, 0], 0.8, 0, s.p.t], c: "green" }); return it; },
          readout: function (s) { var p = PX(s.p.r, s.p.t); return "$(r, \\theta) = (" + nm(s.p.r) + ", " + s.p.t + "^\\circ)$ is at $(x, y) = (" + nm(f4(p[0], 2)) + ", " + nm(f4(p[1], 2)) + ")$ · target $(-2.60, -1.50)$<br>On the target with $r > 0$: " + (s.tracked.pos ? "✓" : "—") + " · with $r < 0$: " + (s.tracked.neg ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.pos && s.tracked.neg); } },
        gate: true, then: "$(3, 210^\\circ)$ lands on the target. So does $(-3, 30^\\circ)$: a **negative $r$** means walk **backwards**, away from the direction $30^\\circ$, which is the same as going out along $30^\\circ + 180^\\circ = 210^\\circ$. A point has many polar names." },
      { type: "learn", kicker: "The idea",
        prompt: "A point is $(r, \\theta)$: **turn** by $\\theta$ from the positive $x$-axis, then go **out** $r$. A negative $r$ means go the **opposite** way. So $(r, \\theta)$ and $(-r, \\theta + 180^\\circ)$ are the same point, and so are $(r, \\theta)$ and $(r, \\theta + 360^\\circ)$.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Plot $(3, 120^\\circ)$ and $(-2, 45^\\circ)$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "120^\\circ \\text{ and } 45^\\circ", say: "First **turn** to each direction, counterclockwise from the $x$-axis.", fig: G6(1) },
          { step: 2, m: "r = 3", say: "Walk 3 steps **out** along the $120^\\circ$ ray.", fig: G6(2), ask: { prompt: "A positive $r$ takes you…", answer: 0, options: [{ t: "out along the direction $\\theta$" }, { t: "backwards", fb: "Backwards is what a **negative** $r$ does." }] } },
          { step: 2, m: "r = -2", say: "Negative: walk 2 steps **backwards** from the $45^\\circ$ ray.", fig: G6(3) },
          { step: 3, m: "\\text{quadrants II and III}", say: "$(3, 120^\\circ)$ is up and left; $(-2, 45^\\circ)$ is down and left, in the direction $225^\\circ$.", fig: G6(3) }] },
        gate: true, then: "$(3, 120^\\circ)$ is in the second quadrant; $(-2, 45^\\circ)$ is in the third, in the direction $225^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you rewrite $(-3, 150^\\circ)$ with a **positive** $r$.",
        how: HOW_6, skill: "Polar coordinates",
        steps: [
          { step: 1, ask: "A negative $r$ means going **opposite** to the direction $150^\\circ$. That opposite direction is $150^\\circ + 180^\\circ =$", type: "num", pre: "$\\theta =$", post: "degrees", answer: 330, near: [{ v: -30, fb: "$-30^\\circ$ and $330^\\circ$ point the same way, but we want an angle from $0^\\circ$ up to $360^\\circ$." }], hint: "$150 + 180 = 330$.", m: "150^\\circ + 180^\\circ = 330^\\circ", say: "A direction between $0^\\circ$ and $360^\\circ$." },
          { step: 2, ask: "Walking 3 steps **out** along $330^\\circ$, the new $r$ is…", type: "choice", answer: 0, options: [{ t: "$3$, positive" }, { t: "$-3$", fb: "We turned to the opposite direction already, so we walk **forwards**: $r$ is positive." }], m: "r = 3", say: "Out along the new direction." },
          { step: 3, ask: "So $(-3, 150^\\circ)$ is the same point as…", type: "choice", answer: 0, options: [{ t: "$(3, 330^\\circ)$" }, { t: "$(3, 150^\\circ)$", fb: "That is on the **opposite** side of the origin." }, { t: "$(3, 210^\\circ)$", fb: "$210^\\circ$ is $150^\\circ + 60^\\circ$: not the opposite direction." }], m: "(3, 330^\\circ)", say: "A positive $r$ and the opposite direction." }],
        why: "Turn, go, mark." },
      { type: "multi", kicker: "On your own", prompt: "A point has many names. Select **all** the names of the point $(2, 60^\\circ)$.",
        options: [{ t: "$(2, 420^\\circ)$", ok: true }, { t: "$(-2, 240^\\circ)$", ok: true }, { t: "$(2, -300^\\circ)$", ok: true }, { t: "$(-2, 60^\\circ)$", fb: "A negative $r$ with the **same** angle is on the opposite side of the origin." }, { t: "$(2, 240^\\circ)$", fb: "That is $180^\\circ$ round the circle: the opposite side." }],
        skill: "Polar coordinates", hints: ["Add or subtract $360^\\circ$; or flip the sign of $r$ and add $180^\\circ$."], why: "$420 = 60 + 360$, $-300 = 60 - 360$, and $(-2, 240^\\circ)$ flips $r$ and adds $180^\\circ$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Two minus signs.** Where is $(-3, -30^\\circ)$? Give it a positive $r$ and an angle between $0^\\circ$ and $360^\\circ$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "\\theta = -30^\\circ", say: "A negative angle turns **clockwise**: $30^\\circ$ below the positive $x$-axis, in the direction $330^\\circ$." },
          { step: 2, m: "r = -3", say: "Negative: walk 3 steps **backwards**, away from that direction.", ask: { prompt: "Backwards from $330^\\circ$ points in the direction…", answer: 0, options: [{ t: "$330^\\circ - 180^\\circ = 150^\\circ$" }, { t: "$330^\\circ + 30^\\circ = 360^\\circ$", fb: "That is the positive $x$-axis. Backwards means $180^\\circ$ round the circle." }] } },
          { step: 3, m: "(3, 150^\\circ)", say: "The same point with a positive $r$: up and to the left, in quadrant II." }] },
        gate: true, then: "$(-3, -30^\\circ) = (3, 150^\\circ)$: two reversals, one of direction and one of the angle's sign." },
      { type: "num", kicker: "Try it", prompt: "The point $(-5, 40^\\circ)$ can be written $(5, \\theta)$ with $0^\\circ \\le \\theta < 360^\\circ$. What is $\\theta$?", pre: "$\\theta =$", post: "degrees", answer: 220, skill: "Polar coordinates",
        near: [{ v: 40, fb: "That is the same angle with the sign of $r$ unchanged. Going backwards means the opposite direction: add $180^\\circ$." }, { v: -140, fb: "$-140^\\circ$ points the same way as $220^\\circ$, but give an angle from $0^\\circ$ up to $360^\\circ$." }], hints: ["$40 + 180$."], why: "$40^\\circ + 180^\\circ = 220^\\circ$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee plots $(-3, 90^\\circ)$ three units up the positive $y$-axis. What is wrong?",
        options: [{ t: "A negative $r$ goes **backwards**: the point is 3 units **down**, at $(0, -3)$" }, { t: "Nothing is wrong.", fb: "The direction $90^\\circ$ is up, but $r = -3$ reverses it." }, { t: "The point is at $(-3, 0)$", fb: "Backwards from straight up is straight down, not left." }],
        answer: 0, skill: "Polar coordinates", hints: ["What does a negative $r$ do?"], why: "$(-3, 90^\\circ) = (3, 270^\\circ) = (0, -3)$." },
      { type: "num", kicker: "Use it", prompt: "A ship is 8 km from port in the direction $210^\\circ$ (counterclockwise from east). Write it as $(-8, \\theta)$ with $0^\\circ \\le \\theta < 180^\\circ$. What is $\\theta$?", pre: "$\\theta =$", post: "degrees", answer: 30, skill: "Polar coordinates",
        near: [{ v: 390, fb: "$390^\\circ$ is $30^\\circ$ plus a full turn; give the angle from $0^\\circ$ to $180^\\circ$." }, { v: 210, fb: "That is the same direction with a **positive** $r$. With $-8$ we point the opposite way: subtract $180^\\circ$." }], hints: ["Opposite direction: $210^\\circ - 180^\\circ$."], why: "$210 - 180 = 30$: $(-8, 30^\\circ)$." }
    ]
  });

  /* ============================================ 7 · Between polar and rectangular points */
  var HOW_7 = [["Choose", "Polar to rectangular, or the other way?"],
               ["Formula", "$x = r\\cos\\theta$ and $y = r\\sin\\theta$; or $r = \\sqrt{x^2 + y^2}$ and $\\tan\\theta = \\frac{y}{x}$."],
               ["Quadrant", "Check the quadrant: a calculator's inverse tangent only answers in quadrants I and IV."]];
  LESSONS.push({
    title: "Between polar and rectangular points", art: "pcpolar",
    blurb: "Book 8.3 · $(r, \\theta)$ to $(x, y)$ and back, and the quadrant trap.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A point is 8 units from the origin at an angle of $60^\\circ$. How far across (its $x$-coordinate) is it?", pre: "$x =$", answer: 4, skill: "Right triangle trigonometry",
        near: [{ v: 6.93, tol: 0.01, fb: "That is $8\\sin 60^\\circ$, the height. The $x$-coordinate uses the cosine." }], hints: ["$8\\cos 60^\\circ$."], why: "$8 \\times \\frac{1}{2} = 4$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $x$ and $y$ to move the point. The readout gives its polar angle $\\theta$, and what the calculator's $\\arctan\\frac{y}{x}$ says. Find a point in **quadrant II** and one in **quadrant III** and see what goes wrong.",
        scene: { type: "sketch", x: [-5.6, 5.6], y: [-5.6, 5.6], u: 26, w: 339, grid: false, gate: true, pts: {},
          params: { x: { min: -5, max: 5, step: 1, v: 3, label: "$x$" }, y: { min: -5, max: 5, step: 1, v: 4, label: "$y$" } },
          track: function (s) { return s.p.x < 0 && s.p.y > 0 ? "II" : s.p.x < 0 && s.p.y < 0 ? "III" : null; },
          draw: function (s) { var x = s.p.x, y = s.p.y, it = [{ seg: [[-5.3, 0], [5.3, 0]], c: "soft" }, { seg: [[0, -5.3], [0, 5.3]], c: "soft" }, { seg: [[0, 0], [x, 0]], c: "blue", dash: true }, { seg: [[x, 0], [x, y]], c: "orange", dash: true }]; if (x !== 0 || y !== 0) it.push({ seg: [[0, 0], [x, y]], c: "ink" }); if (x !== 0) { var ca = Math.atan(y / x); if (Math.abs(ca - Math.atan2(y, x)) > 1e-9) it.push({ seg: [[0, 0], [4.5 * COS(ca), 4.5 * SIN(ca)]], c: "red", dash: true }); } it.push(dot(x, y, "orange")); return it; },
          readout: function (s) { var x = s.p.x, y = s.p.y; if (x === 0 && y === 0) return "At the origin $r = 0$ and the angle can be anything."; var th = ((Math.atan2(y, x) * 180 / PI) + 360) % 360, r = Math.sqrt(x * x + y * y), ca = x === 0 ? null : Math.atan(y / x) * 180 / PI; return "$(x, y) = (" + nm(x) + ", " + nm(y) + ")$: $r = " + nm(f4(r, 2)) + "$, $\\theta = " + nm(f4(th, 1)) + "^\\circ$<br>calculator $\\arctan\\frac{y}{x} = " + (ca === null ? "$ undefined" : nm(f4(ca, 1)) + "^\\circ$ " + (Math.abs(ca - th) < 1e-6 || Math.abs(ca + 360 - th) < 1e-6 ? "✓" : "✗ wrong quadrant")) + "<br>Quadrant II: " + (s.tracked.II ? "✓" : "—") + " · quadrant III: " + (s.tracked.III ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.II && s.tracked.III); } },
        gate: true, then: "In quadrants **II** and **III** the calculator's $\\arctan\\frac{y}{x}$ points the **wrong way** (the red dashed ray): it only answers between $-90^\\circ$ and $90^\\circ$, in quadrants I and IV. The fix: look at the point, then **add $180^\\circ$** (and add $360^\\circ$ if the result is negative)." },
      { type: "learn", kicker: "The idea",
        prompt: "**Polar to rectangular:** $x = r\\cos\\theta$, $y = r\\sin\\theta$. **Rectangular to polar:** $r = \\sqrt{x^2 + y^2}$ and $\\tan\\theta = \\dfrac{y}{x}$, with $\\theta$ in the **same quadrant as the point**: add $180^\\circ$ to the calculator's angle for quadrants II and III.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Convert $(6, 120^\\circ)$ to rectangular, and $(-2, 2)$ to polar.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "(6, 120^\\circ) \\to (x, y)", say: "Polar to rectangular first; the other way for the second point." },
          { step: 2, m: "x = 6\\cos 120^\\circ = -3", say: "Polar to rectangular: $r\\cos\\theta$." },
          { step: 2, m: "y = 6\\sin 120^\\circ \\approx 5.20", say: "And $r\\sin\\theta$: the point is $(-3, 5.20)$." },
          { step: 2, m: "r = \\sqrt{(-2)^2 + 2^2} \\approx 2.83", say: "Now back the other way for $(-2, 2)$: the distance first." },
          { step: 2, m: "\\tan\\theta = \\frac{2}{-2} = -1", say: "The calculator would say $-45^\\circ$.", ask: { prompt: "$(-2, 2)$ is in which quadrant?", answer: 0, options: [{ t: "II: up and to the left" }, { t: "IV: down and to the right", fb: "$-45^\\circ$ would be in quadrant IV, but the point has a negative $x$ and positive $y$: quadrant II." }] } },
          { step: 3, m: "\\theta = -45^\\circ + 180^\\circ = 135^\\circ", say: "Quadrant II: add $180^\\circ$." }] },
        gate: true, then: "$(6, 120^\\circ) = (-3, 5.20)$ and $(-2, 2) = (2.83, 135^\\circ)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $(-3, -3\\sqrt{3})$ in polar form, with $0^\\circ \\le \\theta < 360^\\circ$.",
        how: HOW_7, skill: "Polar and rectangular points",
        steps: [
          { step: 1, ask: "We are going from rectangular to polar, so we need…", type: "choice", answer: 0, options: [{ t: "$r = \\sqrt{x^2 + y^2}$ and $\\tan\\theta = \\frac{y}{x}$" }, { t: "$x = r\\cos\\theta$ and $y = r\\sin\\theta$", fb: "Those take polar to rectangular. We already have $x$ and $y$." }], m: "(x, y) = (-3, -3\\sqrt{3})", say: "Rectangular in, polar out." },
          { step: 2, ask: "$r = \\sqrt{(-3)^2 + (-3\\sqrt{3})^2} =$ (type it as an expression)", type: "num", pre: "$r =$", answer: 6, calc: true, near: [{ v: 36, fb: "That is $r^2 = 9 + 27$. Take the square root." }], hint: "$\\sqrt{9 + 27}$.", m: "r = \\sqrt{9 + 27} = 6", say: "The distance from the origin." },
          { step: 3, ask: "$(-3, -3\\sqrt{3})$ is in which quadrant?", type: "choice", answer: 0, options: [{ t: "III: both coordinates are negative" }, { t: "I", fb: "Both coordinates are negative: down and to the left." }], m: "\\text{quadrant III}", say: "Below and left of the origin." },
          { step: 3, ask: "$\\tan\\theta = \\sqrt{3}$ gives $60^\\circ$ on a calculator. In quadrant III, $\\theta = 60^\\circ + 180^\\circ =$", type: "num", pre: "$\\theta =$", post: "degrees", answer: 240, near: [{ v: 60, fb: "That is the calculator's angle, in quadrant I. Add $180^\\circ$." }], hint: "$60 + 180$.", m: "(6, 240^\\circ)", say: "In quadrant III." }],
        why: "Choose, formula, quadrant." },
      { type: "num", kicker: "On your own", prompt: "Convert the polar point $(10, 30^\\circ)$ to rectangular coordinates. What is $x$, to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$x \\approx$", answer: 8.66, tol: 0.006, calc: true, skill: "Polar and rectangular points",
        near: [{ v: 5, fb: "That is $y = 10\\sin 30^\\circ$. The $x$-coordinate uses the cosine." }], hints: ["$x = 10\\cos 30^\\circ$."], why: "$10 \\times 0.866 = 8.66$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A negative $r$.** Convert $(-4, 60^\\circ)$ to rectangular coordinates.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "(r, \\theta) = (-4, 60^\\circ)", say: "Polar to rectangular: the same formulas, with the **negative** $r$ left in." },
          { step: 2, m: "x = -4\\cos 60^\\circ = -2", say: "$\\cos 60^\\circ = 0.5$.", ask: { prompt: "What is $-4 \\times 0.5$?", answer: 0, options: [{ t: "$-2$" }, { t: "$2$", fb: "Keep the sign of $r$: it is negative." }] } },
          { step: 2, m: "y = -4\\sin 60^\\circ \\approx -3.46", say: "$\\sin 60^\\circ \\approx 0.866$." },
          { step: 3, m: "\\text{third quadrant}", say: "$(-2, -3.46)$: backwards from the $60^\\circ$ direction, down and to the left, as expected." }] },
        gate: true, then: "$(-4, 60^\\circ) = (-2, -3.46)$: the formulas handle a negative $r$ on their own." },
      { type: "num", kicker: "Try it", prompt: "Write $(5, -12)$ in polar form. What is $\\theta$ in degrees, with $0^\\circ \\le \\theta < 360^\\circ$? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$\\theta \\approx$", post: "degrees", answer: 292.62, tol: 0.006, calc: true, skill: "Polar and rectangular points",
        near: [{ v: -67.38, tol: 0.006, fb: "That is the calculator's angle. It is correct but negative: add $360^\\circ$ to get an angle from $0^\\circ$ to $360^\\circ$." }, { v: 112.62, tol: 0.006, fb: "That has the right size of angle in the wrong quadrant: the point is below the $x$-axis (quadrant IV)." }], hints: ["$\\arctan\\frac{-12}{5} \\approx -67.38^\\circ$."], why: "$-67.38^\\circ + 360^\\circ = 292.62^\\circ$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kay writes $(-1, 1)$ in polar form. Tap the line where the work **first** goes wrong.",
        lines: ["r = \\sqrt{(-1)^2 + 1^2} = \\sqrt{2}", "\\tan\\theta = \\frac{1}{-1} = -1", "\\theta = \\arctan(-1) = -45^\\circ", "(\\sqrt{2}, -45^\\circ)"], answer: 2, fix: "\\theta = -45^\\circ + 180^\\circ = 135^\\circ",
        fb: { 0: GIVEN, 1: "$\\tan\\theta = \\frac{y}{x} = \\frac{1}{-1}$: correct.", 3: LATER }, skill: "Polar and rectangular points",
        hints: ["Which quadrant is $(-1, 1)$ in? Which quadrant is $-45^\\circ$ in?"], why: "The calculator's $-45^\\circ$ is in quadrant IV, but $(-1, 1)$ is in quadrant II: $\\theta = 135^\\circ$." },
      { type: "num", kicker: "Use it", prompt: "A robot is at $(3, -4)$ metres. Its heading from the origin, counterclockwise from east, is $\\theta$ with $0^\\circ \\le \\theta < 360^\\circ$. What is $\\theta$ to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$\\theta \\approx$", post: "degrees", answer: 306.87, tol: 0.006, calc: true, skill: "Polar and rectangular points",
        near: [{ v: -53.13, tol: 0.006, fb: "Correct but negative: add $360^\\circ$." }, { v: 53.13, tol: 0.006, fb: "The point is below the axis: the angle is not in quadrant I." }], hints: ["$\\arctan\\frac{-4}{3}$, then add $360^\\circ$."], why: "$-53.13^\\circ + 360^\\circ = 306.87^\\circ$." }
    ]
  });

  /* ============================================ 8 · Between polar and rectangular equations */
  var HOW_8 = [["Multiply", "Multiply by $r$ (or square both sides) so that $r\\cos\\theta$, $r\\sin\\theta$ and $r^2$ appear."],
               ["Substitute", "Replace $r\\cos\\theta$ by $x$, $r\\sin\\theta$ by $y$ and $r^2$ by $x^2 + y^2$."],
               ["Name it", "Recognise the curve: a circle, a line, a parabola."]];
  var EQ8 = [["r = 3", "$r = 3$: every point 3 from the origin, so $x^2 + y^2 = 9$: a **circle** about the origin"],
             ["θ = π/4", "$\\theta = \\frac{\\pi}{4}$: every point on the line at $45^\\circ$, so $y = x$: a **line** through the origin"],
             ["r cos θ = 2", "$r\\cos\\theta = 2$ is just $x = 2$: a **vertical line**"],
             ["r = 4 cos θ", "$r = 4\\cos\\theta$: multiply by $r$, $x^2 + y^2 = 4x$: a **circle** with centre $(2, 0)$"]];
  LESSONS.push({
    title: "Between polar and rectangular equations", art: "pcpolar",
    blurb: "Book 8.3 · Turn $r = 4\\cos\\theta$ into a circle's equation, and a line into polar form.",
    mins: 15, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which expression is equal to $x^2 + y^2$ in polar coordinates?",
        options: [{ t: "$r^2$" }, { t: "$r$", fb: "$r = \\sqrt{x^2 + y^2}$. Its **square** is $x^2 + y^2$." }, { t: "$r\\cos\\theta$", fb: "That is $x$ alone." }],
        answer: 0, skill: "Polar and rectangular points", hints: ["$r = \\sqrt{x^2 + y^2}$."], why: "$r^2 = x^2 + y^2$." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick a polar equation: the curve is drawn on the polar grid and its **rectangular equation** is shown. Look at **all four** and notice which are circles and which are lines.",
        scene: { type: "sketch", x: [-4.8, 4.8], y: [-4.8, 4.8], u: 30, w: 336, grid: false, gate: true, pts: {},
          chips: { e: { label: "Equation", v: "0", opts: EQ8.map(function (q, i) { return ["" + i, q[0]]; }) } },
          draw: function (s) { var k = +s.c.e, it = polGrid(4); if (k === 0) it.push({ circle: [[0, 0], 3], c: "blue" }); else if (k === 1) it.push({ seg: [[-4.4, -4.4], [4.4, 4.4]], c: "blue" }); else if (k === 2) it.push({ seg: [[2, -4.4], [2, 4.4]], c: "blue" }); else it = it.concat(curveT(function (t) { var r = 4 * COS(t); return [r * COS(t), r * SIN(t)]; }, 0, PI, "blue", 100)); return it; },
          readout: function (s) { return EQ8[+s.c.e][1] + "<br>Looked at " + Math.min(Object.keys(s.seen.e).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.seen.e).length >= 4; } },
        gate: true, then: "Some polar equations are simple in polar form ($r = 3$, $\\theta = \\frac{\\pi}{4}$) and some in rectangular ($x = 2$). To **swap**, use $x = r\\cos\\theta$, $y = r\\sin\\theta$ and $x^2 + y^2 = r^2$. The circle $r = 4\\cos\\theta$ needed a trick: multiply by $r$ first." },
      { type: "learn", kicker: "The idea",
        prompt: "Use $x = r\\cos\\theta$, $y = r\\sin\\theta$, $x^2 + y^2 = r^2$ and $\\tan\\theta = \\frac{y}{x}$. To go to **rectangular**, **multiply by $r$** (or square) until those pieces appear. To go to **polar**, replace $x$ and $y$ by $r\\cos\\theta$ and $r\\sin\\theta$.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write $r = 4\\cos\\theta$ as a rectangular equation.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "r = 4\\cos\\theta", say: "There is a lone $r$ and a lone $\\cos\\theta$: neither is an $x$ or $y$ yet." },
          { step: 1, m: "r^2 = 4r\\cos\\theta", say: "Multiply both sides by $r$.", ask: { prompt: "Why multiply by $r$?", answer: 0, options: [{ t: "To make $r^2$ and $r\\cos\\theta$ appear" }, { t: "To remove the cosine", fb: "The cosine stays, but it now sits next to an $r$: $r\\cos\\theta = x$." }] } },
          { step: 2, m: "x^2 + y^2 = 4x", say: "Swap: $r^2 = x^2 + y^2$ and $r\\cos\\theta = x$." },
          { step: 3, m: "(x - 2)^2 + y^2 = 4", say: "Complete the square: a circle with centre $(2, 0)$ and radius 2." }] },
        gate: true, then: "$r = 4\\cos\\theta$ is the circle $(x - 2)^2 + y^2 = 4$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $r = 6\\sin\\theta$ as a rectangular equation and name the curve.",
        how: HOW_8, skill: "Polar and rectangular equations",
        steps: [
          { step: 1, ask: "What should you multiply both sides by?", type: "choice", answer: 0, options: [{ t: "$r$" }, { t: "$\\sin\\theta$", fb: "That would give $\\sin^2\\theta$. We want $r\\sin\\theta$, which is $y$: multiply by $r$." }], m: "r^2 = 6r\\sin\\theta", say: "Now $r\\sin\\theta$ is there." },
          { step: 2, ask: "Replace $r^2$ and $r\\sin\\theta$: $x^2 + y^2 =$", type: "choice", answer: 0, options: [{ t: "$6y$" }, { t: "$6x$", fb: "$r\\sin\\theta$ is $y$; $r\\cos\\theta$ is $x$." }], m: "x^2 + y^2 = 6y", say: "Rectangular." },
          { step: 3, ask: "Completing the square gives $x^2 + (y - 3)^2 = 9$. The **radius** of this circle is", type: "num", pre: "radius =", answer: 3, near: [{ v: 9, fb: "$9$ is the radius **squared**: take the square root." }], hint: "$\\sqrt{9}$.", m: "\\text{circle, centre } (0, 3), \\ \\text{radius } 3", say: "A circle sitting on the $x$-axis." }],
        why: "Substitute, multiply, name it." },
      { type: "choice", kicker: "On your own", prompt: "Which is the polar form of the line $x = 5$?",
        options: [{ t: "$r\\cos\\theta = 5$" }, { t: "$r\\sin\\theta = 5$", fb: "That is $y = 5$, a horizontal line." }, { t: "$r = 5$", fb: "That is a circle of radius 5." }],
        answer: 0, skill: "Polar and rectangular equations", hints: ["$x = r\\cos\\theta$."], why: "$x = r\\cos\\theta$, so $r\\cos\\theta = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A surprise.** Write $r = \\dfrac{2}{1 - \\cos\\theta}$ as a rectangular equation.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "r(1 - \\cos\\theta) = 2", say: "Clear the fraction." },
          { step: 1, m: "r - r\\cos\\theta = 2", say: "Distribute: now $r\\cos\\theta$ appears." },
          { step: 2, m: "r = 2 + x", say: "Swap $r\\cos\\theta$ for $x$ and isolate $r$.", ask: { prompt: "How do we remove the lone $r$?", answer: 0, options: [{ t: "Square both sides: $r^2 = (2 + x)^2$" }, { t: "Replace it by $x + y$", fb: "$r$ is not $x + y$: it is $\\sqrt{x^2 + y^2}$, so squaring is the way." }] } },
          { step: 2, m: "x^2 + y^2 = x^2 + 4x + 4", say: "$r^2 = x^2 + y^2$." },
          { step: 3, m: "y^2 = 4x + 4", say: "The $x^2$ cancels: a **parabola** opening to the right." }] },
        gate: true, then: "$r = \\dfrac{2}{1 - \\cos\\theta}$ is the parabola $y^2 = 4x + 4$." },
      { type: "num", kicker: "Try it", prompt: "The line $y = 2x$ has polar form $\\theta = c$. What is $c$ in degrees, between $0^\\circ$ and $180^\\circ$, to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$c \\approx$", post: "degrees", answer: 63.43, tol: 0.006, calc: true, skill: "Polar and rectangular equations",
        near: [{ v: 2, fb: "That is the slope $\\tan\\theta$. The angle is $\\arctan 2$." }, { v: 26.57, tol: 0.006, fb: "That is $\\arctan\\frac{1}{2}$: the slope is 2, so $\\tan\\theta = 2$." }], hints: ["$\\tan\\theta = \\frac{y}{x} = 2$."], why: "$\\theta = \\arctan 2 \\approx 63.43^\\circ$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Sam writes $r = 4\\cos\\theta$ in rectangular form. Tap the line where the work **first** goes wrong.",
        lines: ["r = 4\\cos\\theta", "r^2 = 4r\\cos\\theta", "x^2 + y^2 = 4\\cos\\theta", "x^2 + y^2 - 4\\cos\\theta = 0"], answer: 2, fix: "x^2 + y^2 = 4x",
        fb: { 0: GIVEN, 1: "Multiplying both sides by $r$ is correct.", 3: LATER }, skill: "Polar and rectangular equations",
        hints: ["What is $r\\cos\\theta$?"], why: "$r\\cos\\theta = x$, so $4r\\cos\\theta = 4x$: no $\\cos\\theta$ is left in rectangular form." },
      { type: "num", kicker: "Use it", prompt: "A lawn sprinkler waters the region $r = 10\\cos\\theta$ (metres). It is a circle. What is its **radius**?", pre: "radius =", post: "m", answer: 5, skill: "Polar and rectangular equations",
        near: [{ v: 10, fb: "$10$ is the **diameter**: $r = 10\\cos\\theta$ gives $x^2 + y^2 = 10x$, a circle through the origin and $(10, 0)$." }], hints: ["$x^2 + y^2 = 10x$: complete the square."], why: "$(x - 5)^2 + y^2 = 25$: radius 5." }
    ]
  });
  /* ============================================ 9 · Graphing polar equations by plotting points */
  // The curve r = f(theta) for theta from a to b (radians), as a path.
  var polcurve = function (f, a, b, c, n) { return curveT(function (t) { var r = f(t); return [r * COS(t), r * SIN(t)]; }, a, b, c || "blue", n || 240); };
  var HOW_9 = [["Table", "List angles $\\theta$ and find $r$ for each."],
               ["Plot", "Plot each $(r, \\theta)$: a negative $r$ goes backwards."],
               ["Join", "Join the points in order of $\\theta$. Symmetry gives the other half."]];
  var CARD9 = function (t) { return 2 + 2 * COS(t); };
  var G9 = function (k) {
    var it = [], d;
    for (d = 0; d <= (k === 1 ? 90 : 180); d += 30) it.push(dot(PX(CARD9(d * DEG), d)[0], PX(CARD9(d * DEG), d)[1], "blue"));
    if (k >= 3) it = polcurve(CARD9, 0, 2 * PI, "blue").concat(it);
    return polfig("The polar graph of r = 2 + 2 cos theta" + (k === 1 ? ": points for angles 0 to 90 degrees" : k === 2 ? ": points for angles 0 to 180 degrees" : ": a heart-shaped cardioid, symmetric about the horizontal axis") + ".", it);
  };
  LESSONS.push({
    title: "Polar graphs: plotting points and symmetry", art: "pcpolar",
    blurb: "Book 8.4 · Draw $r = 2 + 2\\cos\\theta$ from a table, and use symmetry to halve the work.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "For $r = 2 + 2\\cos\\theta$, find $r$ when $\\theta = 0^\\circ$.", pre: "$r =$", answer: 4, skill: "Evaluate a polar equation",
        near: [{ v: 2, fb: "$\\cos 0^\\circ = 1$, so $r = 2 + 2(1)$." }], hints: ["$\\cos 0^\\circ = 1$."], why: "$2 + 2 = 4$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the angle $\\theta$ and watch the point trace out $r = 2 + 2\\cos\\theta$. Find the angle where the curve is **farthest** from the origin and the angle where it **passes through** the origin.",
        scene: { type: "sketch", x: [-4.8, 4.8], y: [-4.8, 4.8], u: 30, w: 336, grid: false, gate: true, pts: {},
          params: { t: { min: 0, max: 360, step: 15, v: 30, label: "$\\theta$ (°)" } },
          track: function (s) { return s.p.t === 0 ? "far" : s.p.t === 180 ? "origin" : null; },
          draw: function (s) { var t = s.p.t * DEG, p = PX(CARD9(t), s.p.t), it = polGrid(4).concat(polcurve(CARD9, 0, 2 * PI, "soft")); if (s.p.t > 0) it = it.concat(polcurve(CARD9, 0, t, "blue")); it.push({ seg: [[0, 0], p], c: "orange" }, dot(p[0], p[1], "orange")); return it; },
          readout: function (s) { var r = CARD9(s.p.t * DEG); return "$\\theta = " + s.p.t + "^\\circ$: $r = 2 + 2\\cos\\theta = " + nm(f4(r, 2)) + "$<br>Farthest: " + (s.tracked.far ? "✓" : "—") + " · through the origin: " + (s.tracked.origin ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.far && s.tracked.origin); } },
        gate: true, then: "The point is farthest at $\\theta = 0^\\circ$ ($r = 4$) and reaches the origin at $\\theta = 180^\\circ$ ($r = 0$). The curve from $0^\\circ$ to $180^\\circ$ and the curve from $180^\\circ$ to $360^\\circ$ are **mirror images** across the horizontal axis: a heart shape called a **cardioid**." },
      { type: "learn", kicker: "The idea",
        prompt: "To graph $r = f(\\theta)$: make a **table**, **plot** each point (negative $r$ goes backwards) and **join** them in order. **Symmetry**: if replacing $\\theta$ by $-\\theta$ gives the same equation, the graph is symmetric about the **polar axis**; $\\theta \\to \\pi - \\theta$: about the **vertical axis**.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $r = 2 + 2\\cos\\theta$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "\\theta = 0^\\circ: \\ r = 4", say: "$2 + 2\\cos 0^\\circ$." },
          { step: 1, m: "\\theta = 90^\\circ: \\ r = 2", say: "$\\cos 90^\\circ = 0$.", ask: { prompt: "What is $r$ at $\\theta = 180^\\circ$?", answer: 0, options: [{ t: "$0$" }, { t: "$4$", fb: "$\\cos 180^\\circ = -1$, so $r = 2 - 2 = 0$." }] } },
          { step: 1, m: "\\theta = 180^\\circ: \\ r = 0", say: "The curve reaches the origin." },
          { step: 2, m: "0^\\circ, 30^\\circ, \\dots, 180^\\circ", say: "Each angle with its $r$: the first half of the curve.", fig: G9(2) },
          { step: 3, m: "\\cos(-\\theta) = \\cos\\theta", say: "Replacing $\\theta$ by $-\\theta$ changes nothing: symmetric about the horizontal axis, so **mirror** the points.", fig: G9(3) }] },
        gate: true, then: "A **cardioid**, symmetric about the polar axis: farthest point $(4, 0^\\circ)$, passing through the origin at $\\theta = 180^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you test $r = 4\\cos\\theta$ for symmetry.",
        how: HOW_9, skill: "Polar symmetry",
        steps: [
          { step: 1, ask: "Replace $\\theta$ by $-\\theta$: $4\\cos(-\\theta) =$", type: "choice", answer: 0, options: [{ t: "$4\\cos\\theta$: the same" }, { t: "$-4\\cos\\theta$", fb: "Cosine is **even**: $\\cos(-\\theta) = \\cos\\theta$." }], m: "4\\cos(-\\theta) = 4\\cos\\theta", say: "The equation is unchanged." },
          { step: 2, ask: "So the graph is symmetric about…", type: "choice", answer: 0, options: [{ t: "the polar axis ($x$-axis)" }, { t: "the line $\\theta = \\frac{\\pi}{2}$", fb: "That is the $\\theta \\to \\pi - \\theta$ test, a different one." }], m: "\\text{symmetric about the polar axis}", say: "We only need $0^\\circ \\le \\theta \\le 180^\\circ$." },
          { step: 3, ask: "Check a point: $r$ at $\\theta = 60^\\circ$ is $4\\cos 60^\\circ =$", type: "num", pre: "$r =$", answer: 2, near: [{ v: 4, fb: "$\\cos 60^\\circ = \\frac{1}{2}$, not 1." }], hint: "$4 \\times 0.5$.", m: "(2, 60^\\circ)", say: "A point on the circle (which is what $r = 4\\cos\\theta$ is)." }],
        why: "Table, plot, join." },
      { type: "multi", kicker: "On your own", prompt: "Select **all** the graphs that are symmetric about the polar axis (the $x$-axis).",
        options: [{ t: "$r = 2\\cos\\theta$", ok: true }, { t: "$r = 3 + 3\\cos\\theta$", ok: true }, { t: "$r = 4\\cos 3\\theta$", ok: true }, { t: "$r = 2\\sin\\theta$", fb: "This circle is centred on the **$y$-axis**: it is symmetric about the vertical axis, not the horizontal." }, { t: "$r = 1 + \\sin\\theta$", fb: "This cardioid points up: symmetric about the vertical axis only." }],
        skill: "Polar symmetry", hints: ["Which equations stay the same when $\\theta$ becomes $-\\theta$?"], why: "Cosine is even, so cosine equations are symmetric about the polar axis; sine equations (like $r = 2\\sin\\theta$) are symmetric about the vertical axis." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Zeros and maximums.** For $r = 4\\sin 2\\theta$, find where the curve passes through the origin and the largest $|r|$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "r = 0 \\Rightarrow \\sin 2\\theta = 0", say: "The curve is at the origin when $r = 0$." },
          { step: 1, m: "2\\theta = 0^\\circ, 180^\\circ, 360^\\circ, \\dots", say: "Sine is 0 at multiples of $180^\\circ$.", ask: { prompt: "So $\\theta$ is a multiple of…", answer: 0, options: [{ t: "$90^\\circ$ (half of $180^\\circ$)" }, { t: "$180^\\circ$", fb: "$2\\theta = 180^\\circ$ gives $\\theta = 90^\\circ$." }] } },
          { step: 2, m: "\\theta = 0^\\circ, 90^\\circ, 180^\\circ, 270^\\circ", say: "Four angles in one turn: the curve returns to the origin four times." },
          { step: 3, m: "|r| \\text{ largest: } \\sin 2\\theta = \\pm 1", say: "Then $|r| = 4$, at $\\theta = 45^\\circ, 135^\\circ, \\dots$: the tips of the four petals." }] },
        gate: true, then: "It passes through the origin at $0^\\circ$, $90^\\circ$, $180^\\circ$, $270^\\circ$, and the farthest points are $4$ away, at $45^\\circ$, $135^\\circ$ and so on: a four-petal rose." },
      { type: "num", kicker: "Try it", prompt: "How many angles $\\theta$ from $0^\\circ$ up to (but not including) $360^\\circ$ make $r = 4\\sin 2\\theta$ equal to $0$?", pre: "angles =", answer: 4, skill: "Zeros of a polar equation",
        near: [{ v: 2, fb: "$\\sin 2\\theta = 0$ at $2\\theta = 0, 180, 360, 540$: four values of $\\theta$ in one turn." }], hints: ["$\\theta = 0, 90, 180, 270$."], why: "$0^\\circ, 90^\\circ, 180^\\circ, 270^\\circ$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana plots $(-2, 60^\\circ)$ in the **first** quadrant, 2 units out along the $60^\\circ$ ray. What is wrong?",
        options: [{ t: "A negative $r$ goes backwards: the point is in the **third** quadrant, along $240^\\circ$" }, { t: "Nothing: the sign of $r$ does not matter", fb: "It does: $(2, 60^\\circ)$ and $(-2, 60^\\circ)$ are opposite points." }, { t: "The point is on the $x$-axis", fb: "Backwards from $60^\\circ$ is $240^\\circ$, in quadrant III." }],
        answer: 0, skill: "Polar coordinates", hints: ["Backwards = add $180^\\circ$."], why: "$(-2, 60^\\circ) = (2, 240^\\circ)$." },
      { type: "num", kicker: "Use it", prompt: "The signal strength of a cardioid antenna is $r = 1 + \\cos\\theta$ at the angle $\\theta$ from its front. What is the strength at $\\theta = 120^\\circ$?", pre: "$r =$", answer: 0.5, tol: 0.0006, skill: "Evaluate a polar equation",
        near: [{ v: 1.5, fb: "$\\cos 120^\\circ = -0.5$: negative, so $r = 1 - 0.5$." }], hints: ["$\\cos 120^\\circ = -\\frac{1}{2}$."], why: "$1 + (-0.5) = 0.5$." }
    ]
  });

  /* ============================================ 10 · Circles, cardioids and limacons */
  var HOW_10 = [["Name it", "Compare $a$ and $b$ in $r = a \\pm b\\cos\\theta$ (or $\\sin$)."],
                ["Axis", "Cosine: symmetric about the $x$-axis. Sine: about the $y$-axis."],
                ["Key points", "Find $r$ at $0^\\circ$, $90^\\circ$, $180^\\circ$, $270^\\circ$ and sketch."]];
  var LIM = function (a, b) { return function (t) { return a + b * COS(t); }; };
  var CARD3 = function (t) { return 3 + 3 * SIN(t); };
  var kindLim = function (a, b) { return a === b ? "cardioid" : a < b ? "loop" : a < 2 * b ? "dimple" : "convex"; };
  var KINDTXT = { cardioid: "a **cardioid** ($a = b$): it touches the origin in a point", loop: "a limaçon with an **inner loop** ($a < b$)", dimple: "a limaçon with a **dimple** ($b < a < 2b$)", convex: "a **convex** limaçon ($a \\ge 2b$): no dimple" };
  LESSONS.push({
    title: "Circles, cardioids and limaçons", art: "pcpolar",
    blurb: "Book 8.4 · $r = a\\cos\\theta$ is a circle; $r = a + b\\cos\\theta$ is a limaçon, and its shape depends on $a$ against $b$.",
    mins: 15, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "For $r = 3 + 3\\sin\\theta$, what is $r$ at $\\theta = 270^\\circ$?",
        options: [{ t: "$0$" }, { t: "$6$", fb: "$\\sin 270^\\circ = -1$, so $r = 3 - 3$." }, { t: "$3$", fb: "$\\sin 270^\\circ$ is $-1$, not 0." }],
        answer: 0, skill: "Evaluate a polar equation", hints: ["$\\sin 270^\\circ = -1$."], why: "$3 + 3(-1) = 0$." },
      { type: "learn", kicker: "Explore",
        prompt: "The curve is $r = a + b\\cos\\theta$. Slide $a$ and $b$ and find one of each shape: a **cardioid**, a limaçon with an **inner loop**, one with a **dimple** and a **convex** one.",
        scene: { type: "sketch", x: [-3.5, 8.5], y: [-5, 5], u: 24, w: 336, grid: false, gate: true, pts: {},
          params: { a: { min: 1, max: 4, step: 1, v: 3, label: "$a$" }, b: { min: 1, max: 4, step: 1, v: 1, label: "$b$" } },
          track: function (s) { return kindLim(s.p.a, s.p.b); },
          draw: function (s) { return [{ seg: [[-3.3, 0], [8.3, 0]], c: "soft" }, { seg: [[0, -4.8], [0, 4.8]], c: "soft" }].concat(polcurve(LIM(s.p.a, s.p.b), 0, 2 * PI, "blue", 300)); },
          readout: function (s) { var k = kindLim(s.p.a, s.p.b), n = Object.keys(s.tracked).length; return "$r = " + s.p.a + " + " + s.p.b + "\\cos\\theta$: " + KINDTXT[k] + "<br>Shapes found: " + Math.min(n, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        gate: true, then: "$a = b$: **cardioid**. $a < b$: an **inner loop**. $b < a < 2b$: a **dimple**. $a \\ge 2b$: **convex**. These are all **limaçons**. (And $r = a\\cos\\theta$ or $a\\sin\\theta$, with no constant, is a **circle** of diameter $|a|$.)" },
      { type: "learn", kicker: "The idea",
        prompt: "$r = a \\pm b\\cos\\theta$ or $a \\pm b\\sin\\theta$ is a **limaçon**: $a = b$ cardioid; $a < b$ inner loop; $b < a < 2b$ dimple; $a \\ge 2b$ convex. $r = a\\cos\\theta$ or $a\\sin\\theta$ is a **circle** of diameter $|a|$.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch $r = 3 + 3\\sin\\theta$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "a = 3, \\ b = 3", say: "$a = b$: a **cardioid**." },
          { step: 2, m: "\\sin\\theta", say: "A sine: symmetric about the **vertical** axis.", ask: { prompt: "A sine equation is symmetric about…", answer: 0, options: [{ t: "the vertical axis" }, { t: "the horizontal axis", fb: "That is for **cosine**: $\\cos(-\\theta) = \\cos\\theta$. Sine is odd." }] } },
          { step: 3, m: "r: 3, 6, 3, 0", say: "At $\\theta = 0^\\circ, 90^\\circ, 180^\\circ, 270^\\circ$.", fig: polfig("The cardioid r = 3 + 3 sin theta, pointing up with its cusp at the origin.", polcurve(CARD3, 0, 2 * PI, "blue"), 6) }] },
        gate: true, then: "A cardioid pointing **up**: farthest at $\\theta = 90^\\circ$ ($r = 6$), and its point at the origin at $\\theta = 270^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you analyse $r = 2 + 4\\cos\\theta$.",
        how: HOW_10, skill: "Limaçons",
        steps: [
          { step: 1, ask: "Compare $a = 2$ with $b = 4$.", type: "choice", answer: 0, options: [{ t: "$a < b$: a limaçon with an **inner loop**" }, { t: "$a = b$: a cardioid", fb: "$a = 2$ and $b = 4$ are different." }], m: "a < b", say: "An inner loop." },
          { step: 2, ask: "A **cosine** equation is symmetric about…", type: "choice", answer: 0, options: [{ t: "the polar axis ($x$-axis)" }, { t: "the vertical axis", fb: "That is for **sine**. Cosine is even: $\\cos(-\\theta) = \\cos\\theta$." }], m: "\\text{symmetric about the } x\\text{-axis}", say: "So the loop lies on the $x$-axis." },
          { step: 3, ask: "The loop passes through the origin where $r = 0$: $\\cos\\theta = -\\dfrac{2}{4}$. In degrees (between $90^\\circ$ and $180^\\circ$), $\\theta =$", type: "num", pre: "$\\theta =$", post: "degrees", answer: 120, near: [{ v: 60, fb: "$\\cos 60^\\circ = +\\frac{1}{2}$. We need $-\\frac{1}{2}$: in quadrant II." }], hint: "$\\cos 120^\\circ = -\\frac{1}{2}$.", m: "\\theta = 120^\\circ, \\ 240^\\circ", say: "Where the curve crosses itself at the origin." },
          { step: 3, ask: "The farthest point is at $\\theta = 0^\\circ$, with $r = 2 + 4 =$", type: "num", pre: "$r =$", answer: 6, near: [{ v: 2, fb: "That is $a$ alone. At $\\theta = 0^\\circ$, $\\cos\\theta = 1$: add the full $b$." }], hint: "$2 + 4(1)$.", m: "(6, 0^\\circ)", say: "The outer tip." }],
        why: "Name it, axis, key points." },
      { type: "sort", kicker: "On your own", prompt: "Sort each equation by the kind of curve it draws.",
        bins: ["Circle", "Cardioid", "Inner loop", "No inner loop (dimple or convex)"],
        cards: [{ t: "$r = 5\\cos\\theta$", bin: 0, fb: "No constant term: a circle." }, { t: "$r = 4 + 4\\sin\\theta$", bin: 1, fb: "$a = b$: a cardioid." }, { t: "$r = 1 + 3\\cos\\theta$", bin: 2, fb: "$a < b$: an inner loop." }, { t: "$r = 5 + 2\\sin\\theta$", bin: 3, fb: "$a \\ge 2b$: convex." }, { t: "$r = 3 + 2\\cos\\theta$", bin: 3, fb: "$b < a < 2b$: a dimple, no loop." }, { t: "$r = 6\\sin\\theta$", bin: 0, fb: "A circle of diameter 6." }],
        skill: "Limaçons", hints: ["Compare $a$ with $b$; no $a$ at all means a circle."], why: "Circles have no constant; limaçons compare $a$ with $b$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**An inner loop.** For $r = 1 - 2\\cos\\theta$, find the largest $|r|$ and where the curve is at the origin.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "a = 1, \\ b = 2", say: "$a < b$: an inner loop." },
          { step: 2, m: "\\theta = 180^\\circ: \\ r = 1 + 2 = 3", say: "$\\cos 180^\\circ = -1$: the largest $|r|$, at the left.", ask: { prompt: "At $\\theta = 0^\\circ$, what is $r$?", answer: 0, options: [{ t: "$-1$: a small, backward point" }, { t: "$3$", fb: "$\\cos 0^\\circ = 1$, so $r = 1 - 2 = -1$." }] } },
          { step: 3, m: "r = 0: \\ \\cos\\theta = \\frac{1}{2}", say: "At the origin when $\\theta = 60^\\circ$ and $300^\\circ$: the loop starts and ends there." }] },
        gate: true, then: "The farthest point is $3$ away at $\\theta = 180^\\circ$; the curve is at the origin at $\\theta = 60^\\circ$ and $300^\\circ$; the inner loop lies on the right." },
      { type: "num", kicker: "Try it", prompt: "For $r = 4 - 4\\sin\\theta$, what is $r$ at $\\theta = 30^\\circ$?", pre: "$r =$", answer: 2, skill: "Evaluate a polar equation",
        near: [{ v: 6, fb: "$\\sin 30^\\circ = 0.5$: $r = 4 - 4(0.5)$." }, { v: 4, fb: "$\\sin 30^\\circ$ is $0.5$, not 0." }], hints: ["$\\sin 30^\\circ = 0.5$."], why: "$4 - 2 = 2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kim says $r = 2 + 2\\cos\\theta$ is a circle \"because it has a cosine\". What is wrong?",
        options: [{ t: "A circle has no constant term. With $a = b = 2$ this is a **cardioid**" }, { t: "Nothing: any cosine equation is a circle", fb: "$r = 2\\cos\\theta$ is a circle, but adding the constant 2 changes it." }, { t: "It is a rose", fb: "Roses have a multiple angle, like $\\cos 3\\theta$." }],
        answer: 0, skill: "Limaçons", hints: ["Compare $a$ and $b$."], why: "$a = b$: cardioid." },
      { type: "num", kicker: "Use it", prompt: "A microphone's pickup is the cardioid $r = 1 + \\cos\\theta$, with $\\theta$ measured from straight ahead. How strong is the pickup **directly behind** it ($\\theta = 180^\\circ$)?", pre: "$r =$", answer: 0, skill: "Evaluate a polar equation",
        near: [{ v: 2, fb: "That is straight ahead ($\\theta = 0^\\circ$). Behind, $\\cos 180^\\circ = -1$." }], hints: ["$1 + \\cos 180^\\circ$."], why: "$1 - 1 = 0$: it hears nothing from behind." }
    ]
  });

  /* ============================================ 11 · Roses, lemniscates and spirals */
  var HOW_11 = [["Count", "Rose $r = a\\cos n\\theta$: $n$ odd gives $n$ petals; $n$ even gives $2n$."],
                ["Length", "Each petal reaches out $|a|$ from the origin."],
                ["Tips", "Tips are where $\\cos n\\theta = \\pm 1$; the curve is at the origin where it is $0$."]];
  var petals = function (n) { return n % 2 ? n : 2 * n; };
  LESSONS.push({
    title: "Roses, lemniscates and spirals", art: "pcpolar",
    blurb: "Book 8.4 · Count petals, and meet the figure eight and the spiral.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "As $\\theta$ goes once round, from $0^\\circ$ to $360^\\circ$, how many full cycles does $\\cos 3\\theta$ make?",
        options: [{ t: "3" }, { t: "1", fb: "$\\cos\\theta$ makes one cycle. The 3 in $\\cos 3\\theta$ triples the speed." }, { t: "6", fb: "The period of $\\cos 3\\theta$ is $\\frac{360^\\circ}{3} = 120^\\circ$: three fit in $360^\\circ$." }],
        answer: 0, skill: "Period", hints: ["Period of $\\cos n\\theta$ is $\\frac{360^\\circ}{n}$."], why: "3 cycles." },
      { type: "learn", kicker: "Explore",
        prompt: "The rose is $r = 3\\cos n\\theta$. Slide $n$ and **count the petals**. Find a rose with **5** petals and one with **8**.",
        scene: { type: "sketch", x: [-3.6, 3.6], y: [-3.6, 3.6], u: 36, w: 307, grid: false, gate: true, pts: {},
          params: { n: { min: 1, max: 8, step: 1, v: 2, label: "$n$" } },
          track: function (s) { var p = petals(s.p.n); return p === 5 ? "p5" : p === 8 ? "p8" : null; },
          draw: function (s) { return polGrid(3).concat(polcurve(function (t) { return 3 * COS(s.p.n * t); }, 0, 2 * PI, "blue", 500)); },
          readout: function (s) { return "$r = 3\\cos " + (s.p.n === 1 ? "" : s.p.n) + "\\theta$: **" + petals(s.p.n) + "** petals ($n$ is " + (s.p.n % 2 ? "odd" : "even") + ")<br>5 petals: " + (s.tracked.p5 ? "✓" : "—") + " · 8 petals: " + (s.tracked.p8 ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.p5 && s.tracked.p8); } },
        gate: true, then: "When $n$ is **odd** there are $n$ petals (5 petals for $n = 5$). When $n$ is **even** there are $2n$ petals (8 petals for $n = 4$). Notice that **6 petals is impossible**: odd $n$ gives an odd number, even $n$ a multiple of 4. Each petal is $3$ long." },
      { type: "learn", kicker: "The idea",
        prompt: "**Rose:** $r = a\\cos n\\theta$ or $a\\sin n\\theta$. $n$ odd: $n$ petals; $n$ even: $2n$ petals; each reaches $|a|$. **Lemniscate** (figure eight): $r^2 = a^2\\cos 2\\theta$. **Archimedes' spiral:** $r = a\\theta$.",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Describe $r = 4\\cos 3\\theta$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "n = 3 \\text{ (odd)}", say: "Odd: **3** petals." },
          { step: 2, m: "|a| = 4", say: "Each petal is 4 long.", ask: { prompt: "How long is each petal?", answer: 0, options: [{ t: "$4$: the number in front" }, { t: "$3$", fb: "$3$ is the number of petals. The length is $|a| = 4$." }] } },
          { step: 3, m: "\\cos 3\\theta = \\pm 1", say: "Tips: $3\\theta = 0^\\circ, 180^\\circ, 360^\\circ, \\dots$, so $\\theta = 0^\\circ, 60^\\circ, 120^\\circ, \\dots$" },
          { step: 3, m: "\\theta = 0^\\circ, 120^\\circ, 240^\\circ", say: "The three tips point in these directions ($r = 4$): the negative $r$ at $60^\\circ$ points back along $240^\\circ$." }] },
        gate: true, then: "A three-petal rose, each petal $4$ long, pointing at $0^\\circ$, $120^\\circ$ and $240^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $r = 2\\sin 4\\theta$.",
        how: HOW_11, skill: "Roses",
        steps: [
          { step: 1, ask: "$n = 4$ is even. How many petals?", type: "num", pre: "petals =", answer: 8, near: [{ v: 4, fb: "For **even** $n$ there are $2n$ petals." }], hint: "$2 \\times 4$.", m: "2n = 8", say: "Eight petals." },
          { step: 2, ask: "How long is each petal?", type: "num", pre: "length =", answer: 2, near: [{ v: 4, fb: "$4$ is $n$. The length is $|a|$, the number in front: 2." }], hint: "The number in front of the sine.", m: "|a| = 2", say: "Each petal is 2 long." },
          { step: 3, ask: "The first tip is where $\\sin 4\\theta = 1$: $4\\theta = 90^\\circ$, so $\\theta =$", type: "num", pre: "$\\theta =$", post: "degrees", answer: 22.5, tol: 0.06, near: [{ v: 90, fb: "That is $4\\theta$. Divide by 4." }], hint: "$90 \\div 4$.", m: "\\theta = 22.5^\\circ", say: "The petals are $45^\\circ$ apart." }],
        why: "Count, length, tips." },
      { type: "num", kicker: "On your own", prompt: "How many petals does the rose $r = 5\\cos 6\\theta$ have?", pre: "petals =", answer: 12, skill: "Roses",
        near: [{ v: 6, fb: "$n = 6$ is **even**: there are $2n$ petals." }], hints: ["Even $n$: $2n$."], why: "$2 \\times 6 = 12$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A figure eight.** Describe the lemniscate $r^2 = 9\\cos 2\\theta$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "r^2 = 9\\cos 2\\theta", say: "A square is never negative: the curve exists only where $\\cos 2\\theta \\ge 0$.", ask: { prompt: "Where is $\\cos 2\\theta \\ge 0$ for $\\theta$ near $0^\\circ$?", answer: 0, options: [{ t: "For $-45^\\circ \\le \\theta \\le 45^\\circ$" }, { t: "For all angles", fb: "$\\cos 2\\theta$ is negative for $45^\\circ < \\theta < 135^\\circ$ (and so on): no points there." }] } },
          { step: 2, m: "r = \\pm 3\\sqrt{\\cos 2\\theta}", say: "Two values of $r$ for each allowed angle: the right loop and the left loop." },
          { step: 3, m: "\\theta = 0: \\ r = \\pm 3", say: "The farthest points: $3$ out to the right and to the left." }] },
        gate: true, then: "Two loops, one on each side, meeting at the origin, each reaching $3$ from it." },
      { type: "num", kicker: "Try it", prompt: "The Archimedes' spiral is $r = 2\\theta$ with $\\theta$ in **radians**. How far from the origin is the point at $\\theta = 3\\pi$? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$r \\approx$", answer: 18.85, tol: 0.006, calc: true, skill: "Spirals",
        near: [{ v: 6, fb: "That is $2 \\cdot 3$: use $\\theta = 3\\pi \\approx 9.42$ radians." }], hints: ["$r = 2 \\times 3\\pi$."], why: "$6\\pi \\approx 18.85$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rio says $r = 3\\sin 2\\theta$ has 2 petals \"because $n = 2$\". What is wrong?",
        options: [{ t: "$n = 2$ is even, so there are $2n = 4$ petals" }, { t: "Nothing: the number of petals is $n$", fb: "That works for **odd** $n$ only." }, { t: "It has 3 petals", fb: "3 is the petal **length**, not the count." }],
        answer: 0, skill: "Roses", hints: ["Even $n$ doubles."], why: "Four petals." },
      { type: "num", kicker: "Use it", prompt: "A designer wants a rose $r = 5\\cos n\\theta$ with **8 petals**. Which whole number $n$ works?", pre: "$n =$", answer: 4, skill: "Roses",
        near: [{ v: 8, fb: "$n = 8$ is even, so it gives $2n = 16$ petals." }], hints: ["Even $n$ gives $2n$ petals."], why: "$n = 4$ is even: $2 \\times 4 = 8$." }
    ]
  });
  /* ========================================================= complex helpers */
  // Axes with Re and Im labels for a sketch whose window is [-R, R] on both sides.
  function cAxes(R, lab) { lab = lab || ["Re", "Im"]; return [{ seg: [[-R + 0.2, 0], [R - 0.2, 0]], c: "soft" }, { seg: [[0, -R + 0.2], [0, R - 0.2]], c: "soft" }, { text: lab[0], at: [R - 0.55, 0.45], c: "soft" }, { text: lab[1], at: [0.5, R - 0.5], c: "soft" }]; }
  var CS = function (r, d) { return [r * COS(d * DEG), r * SIN(d * DEG)]; };
  // "a + bi" as TeX for numbers, to 2 places.
  var cTex = function (p) { var a = f4(p[0], 2), b = f4(p[1], 2); return nm(a) + (b < 0 ? " - " : " + ") + nm(Math.abs(b)) + "i"; };

  /* ============================================ 12 · Complex numbers in polar form */
  var HOW_12 = [["Modulus", "$r = |z| = \\sqrt{a^2 + b^2}$."],
                ["Argument", "$\\tan\\theta = \\frac{b}{a}$; put $\\theta$ in the quadrant of the point."],
                ["Write it", "$z = r(\\cos\\theta + i\\sin\\theta)$."]];
  var G12 = function (k) {
    var P = [-1, 1.732], it = [{ seg: [[0, 0], P], c: "blue" }, dot(P[0], P[1], "blue", "z", "ne")];
    if (k >= 2) it.push({ text: "r = 2", at: [-0.9, 0.55 + 0.3], c: "green" });
    if (k >= 3) it.push({ turn: [[0, 0], 0.8, 0, 120], c: "orange" }, { text: "120°", at: [0.35, 0.95], c: "orange" });
    return cplane("The complex number z = -1 + sqrt(3) i in the complex plane" + (k >= 2 ? ", at distance 2 from the origin" : "") + (k >= 3 ? ", at an angle of 120 degrees" : "") + ".", it, { x: [-3, 3], y: [-1, 3], u: 36 });
  };
  LESSONS.push({
    title: "Complex numbers in polar form", art: "pcpolar",
    blurb: "Book 8.5 · A complex number $a + bi$ is a point: its distance and angle give the polar form.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "How far from the origin is the point $(3, 4)$?", pre: "distance =", answer: 5, skill: "Distance", near: [{ v: 7, fb: "Add the **squares** and take the root: $9 + 16 = 25$." }], hints: ["$\\sqrt{3^2 + 4^2}$."], why: "$5$." },
      { type: "learn", kicker: "Explore",
        prompt: "The complex number $z$ is the point $r(\\cos\\theta + i\\sin\\theta)$. Slide $r$ and $\\theta$ to land on the **two orange targets**: $4$ out at $120^\\circ$, and $5$ out at $300^\\circ$.",
        scene: { type: "sketch", x: [-5.6, 5.6], y: [-5.6, 5.6], u: 26, w: 339, grid: false, gate: true, pts: {},
          params: { r: { min: 1, max: 5, step: 1, v: 2, label: "$r$" }, t: { min: 0, max: 360, step: 15, v: 45, label: "$\\theta$ (°)" } },
          track: function (s) { return s.p.r === 4 && s.p.t === 120 ? "t1" : s.p.r === 5 && s.p.t === 300 ? "t2" : null; },
          draw: function (s) { var p = CS(s.p.r, s.p.t); return cAxes(5.6).concat([hole(CS(4, 120)[0], CS(4, 120)[1], "orange"), hole(CS(5, 300)[0], CS(5, 300)[1], "orange"), { seg: [[0, 0], p], c: "blue" }, dot(p[0], p[1], "blue")]).concat(s.p.t > 0 ? [{ turn: [[0, 0], 0.9, 0, s.p.t], c: "green" }] : []); },
          readout: function (s) { var p = CS(s.p.r, s.p.t); return "$z = " + s.p.r + "(\\cos " + s.p.t + "^\\circ + i\\sin " + s.p.t + "^\\circ) = " + cTex(p) + "$<br>First target: " + (s.tracked.t1 ? "✓" : "—") + " · second target: " + (s.tracked.t2 ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.t1 && s.tracked.t2); } },
        gate: true, then: "The first target is $4(\\cos 120^\\circ + i\\sin 120^\\circ) = -2 + 3.46i$ and the second is $5(\\cos 300^\\circ + i\\sin 300^\\circ) = 2.5 - 4.33i$. A complex number is **a distance and an angle**: its **modulus** $r$ and **argument** $\\theta$." },
      { type: "learn", kicker: "The idea",
        prompt: "$z = a + bi$ is the point $(a, b)$. Its **modulus** is $r = |z| = \\sqrt{a^2 + b^2}$; its **argument** $\\theta$ has $\\tan\\theta = \\frac{b}{a}$ (check the quadrant). **Polar form:** $z = r(\\cos\\theta + i\\sin\\theta)$, often written $r\\,\\text{cis}\\,\\theta$.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write $z = -1 + \\sqrt{3}\\,i$ in polar form.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "r = \\sqrt{(-1)^2 + (\\sqrt{3})^2}", say: "The distance from the origin.", fig: G12(1) },
          { step: 1, m: "r = \\sqrt{1 + 3} = 2", say: "The modulus.", fig: G12(2) },
          { step: 2, m: "\\tan\\theta = \\frac{\\sqrt{3}}{-1}", say: "The calculator would say $-60^\\circ$.", ask: { prompt: "$z = -1 + \\sqrt{3}\\,i$ is in which quadrant?", answer: 0, options: [{ t: "II: left and up" }, { t: "IV: right and down", fb: "$-60^\\circ$ is in quadrant IV, but $a = -1 < 0$ and $b > 0$: quadrant II." }] } },
          { step: 2, m: "\\theta = -60^\\circ + 180^\\circ", say: "Quadrant II: add $180^\\circ$.", fig: G12(3) },
          { step: 3, m: "z = 2\\,\\text{cis}\\,120^\\circ", say: "$2(\\cos 120^\\circ + i\\sin 120^\\circ)$.", fig: G12(3) }] },
        gate: true, then: "$z = 2(\\cos 120^\\circ + i\\sin 120^\\circ)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $z = 3 - 3i$ in polar form.",
        how: HOW_12, skill: "Polar form of a complex number",
        steps: [
          { step: 1, ask: "The modulus $r = \\sqrt{3^2 + (-3)^2} =$ (type it as an expression)", type: "num", pre: "$r \\approx$", answer: 4.2426, tol: 0.0006, calc: true, near: [{ v: 18, fb: "That is $r^2 = 9 + 9$: take the square root." }], hint: "$\\sqrt{18}$.", m: "r = \\sqrt{18} = 3\\sqrt{2}", say: "About 4.24." },
          { step: 2, ask: "$3 - 3i$ is in which quadrant?", type: "choice", answer: 0, options: [{ t: "IV: right and down" }, { t: "II", fb: "The real part $3$ is positive: right of the axis." }], m: "\\text{quadrant IV}", say: "Right and down." },
          { step: 3, ask: "$\\tan\\theta = -1$ gives $-45^\\circ$, which is in quadrant IV. As an angle from $0^\\circ$ to $360^\\circ$, $\\theta =$", type: "num", pre: "$\\theta =$", post: "degrees", answer: 315, near: [{ v: 135, fb: "That is in quadrant II. Quadrant IV needs $-45^\\circ + 360^\\circ$." }], hint: "$-45 + 360$.", m: "z = 4.24\\,\\text{cis}\\,315^\\circ", say: "The same as $4.24\\,\\text{cis}(-45^\\circ)$." }],
        why: "Modulus, argument, write it." },
      { type: "num", kicker: "On your own", prompt: "Find the modulus $|{-5} + 12i|$.", pre: "$r =$", answer: 13, skill: "Modulus", near: [{ v: 7, fb: "That is $-5 + 12$. Use the distance formula." }, { v: 169, fb: "That is $r^2$: take the square root." }], hints: ["$\\sqrt{25 + 144}$."], why: "$\\sqrt{169} = 13$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Back to $a + bi$.** Write $6\\,\\text{cis}\\,150^\\circ$ in rectangular form.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 3, m: "6(\\cos 150^\\circ + i\\sin 150^\\circ)", say: "Polar form: evaluate the cosine and the sine." },
          { step: 3, m: "\\cos 150^\\circ = -\\frac{\\sqrt{3}}{2}", say: "Quadrant II: cosine negative.", ask: { prompt: "$\\sin 150^\\circ$ is…", answer: 0, options: [{ t: "$\\frac{1}{2}$, positive" }, { t: "$-\\frac{1}{2}$", fb: "Quadrant II is above the axis: the sine is positive." }] } },
          { step: 3, m: "z = 6\\left(-\\tfrac{\\sqrt{3}}{2}\\right) + 6\\left(\\tfrac{1}{2}\\right)i", say: "Multiply by the modulus 6." },
          { step: 3, m: "z \\approx -5.20 + 3i", say: "Real part $-3\\sqrt{3}$, imaginary part 3." }] },
        gate: true, then: "$6\\,\\text{cis}\\,150^\\circ \\approx -5.20 + 3i$." },
      { type: "num", kicker: "Try it", prompt: "Find the argument $\\theta$ of $z = -4 - 4i$, from $0^\\circ$ up to $360^\\circ$.", pre: "$\\theta =$", post: "degrees", answer: 225, skill: "Polar form of a complex number",
        near: [{ v: 45, fb: "That is the calculator's angle, in quadrant I. $-4 - 4i$ is in quadrant III: add $180^\\circ$." }, { v: 135, fb: "That is in quadrant II, but both parts are negative: quadrant III." }], hints: ["$\\arctan\\frac{-4}{-4} = 45^\\circ$, then the quadrant."], why: "$45^\\circ + 180^\\circ = 225^\\circ$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Eli writes $z = -2 + 2i$ in polar form. Tap the line where the work **first** goes wrong.",
        lines: ["r = \\sqrt{(-2)^2 + 2^2} = 2\\sqrt{2}", "\\tan\\theta = \\frac{2}{-2} = -1", "\\theta = \\arctan(-1) = -45^\\circ", "z = 2\\sqrt{2}\\,\\text{cis}(-45^\\circ)"], answer: 2, fix: "\\theta = -45^\\circ + 180^\\circ = 135^\\circ",
        fb: { 0: GIVEN, 1: "$\\frac{b}{a} = \\frac{2}{-2}$: correct.", 3: LATER }, skill: "Polar form of a complex number",
        hints: ["Which quadrant is $-2 + 2i$ in?"], why: "$-2 + 2i$ is in quadrant II: $\\theta = 135^\\circ$, not $-45^\\circ$." },
      { type: "num", kicker: "Use it", prompt: "An electrical impedance is $Z = 3 + 4i$ ohms. Its **phase angle** is the argument of $Z$. What is it, in degrees to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "phase $\\approx$", post: "degrees", answer: 53.13, tol: 0.006, calc: true, skill: "Polar form of a complex number",
        near: [{ v: 36.87, tol: 0.006, fb: "That is $\\arctan\\frac{3}{4}$, the angle from the **imaginary** axis. The argument is measured from the real axis: $\\arctan\\frac{4}{3}$." }], hints: ["$\\arctan\\frac{4}{3}$."], why: "$\\arctan\\frac{4}{3} \\approx 53.13^\\circ$; the magnitude is $|Z| = 5$ ohms." }
    ]
  });

  /* ============================================ 13 · Products, quotients and powers */
  var HOW_13 = [["Moduli", "Multiply (or divide) the moduli. For a power, raise $r$ to the $n$."],
                ["Arguments", "Add (or subtract) the arguments. For a power, multiply $\\theta$ by $n$."],
                ["Write", "Give the result as $r\\,\\text{cis}\\,\\theta$, or in $a + bi$ form."]];
  LESSONS.push({
    title: "Products, quotients and powers", art: "pcpolar",
    blurb: "Book 8.5 · Multiplying turns the number: moduli multiply, angles add. De Moivre's theorem for powers.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$10^2 \\times 10^3 = 10^n$. What is $n$?", pre: "$n =$", answer: 5, skill: "Laws of exponents", near: [{ v: 6, fb: "When you multiply powers of the same base you **add** the exponents: $2 + 3$." }], hints: ["Add the exponents."], why: "$10^{2+3} = 10^5$. Angles will behave like exponents." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $\\theta_1$ and $\\theta_2$. The blue number $z_1 = 2\\,\\text{cis}\\,\\theta_1$ and the orange number $z_2 = 3\\,\\text{cis}\\,\\theta_2$ are multiplied to give the **green** product. Find angles that put the product on the **positive imaginary axis**, then on the **negative real axis**.",
        scene: { type: "sketch", x: [-6.6, 6.6], y: [-6.6, 6.6], u: 22, w: 338, grid: false, gate: true, pts: {},
          params: { a: { min: 0, max: 180, step: 15, v: 30, label: "$\\theta_1$ (°)" }, b: { min: 0, max: 180, step: 15, v: 45, label: "$\\theta_2$ (°)" } },
          track: function (s) { return s.p.a + s.p.b === 90 ? "imag" : s.p.a + s.p.b === 180 ? "neg" : null; },
          draw: function (s) { var z1 = CS(2, s.p.a), z2 = CS(3, s.p.b), z3 = CS(6, s.p.a + s.p.b); return cAxes(6.6).concat([{ seg: [[0, 0], z1], c: "blue" }, { seg: [[0, 0], z2], c: "orange" }, { seg: [[0, 0], z3], c: "green" }, dot(z1[0], z1[1], "blue"), dot(z2[0], z2[1], "orange"), dot(z3[0], z3[1], "green")]); },
          readout: function (s) { return "$|z_1z_2| = 2 \\times 3 = 6$ · argument $= " + s.p.a + "^\\circ + " + s.p.b + "^\\circ = " + (s.p.a + s.p.b) + "^\\circ$<br>On the positive imaginary axis: " + (s.tracked.imag ? "✓" : "—") + " · on the negative real axis: " + (s.tracked.neg ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.imag && s.tracked.neg); } },
        gate: true, then: "The product always has modulus $2 \\times 3 = 6$ and argument $\\theta_1 + \\theta_2$: **multiply the moduli, add the arguments**. (Like $10^2 \\cdot 10^3$: add the exponents.) The product lies on the imaginary axis when the angles add to $90^\\circ$, and on the negative real axis when they add to $180^\\circ$." },
      { type: "learn", kicker: "The idea",
        prompt: "$z_1z_2 = r_1r_2\\,\\text{cis}(\\theta_1 + \\theta_2)$ and $\\dfrac{z_1}{z_2} = \\dfrac{r_1}{r_2}\\,\\text{cis}(\\theta_1 - \\theta_2)$. **De Moivre's theorem:** $z^n = r^n\\,\\text{cis}(n\\theta)$. Multiply moduli, **add** angles; divide moduli, **subtract** angles.",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $(3\\,\\text{cis}\\,20^\\circ)(4\\,\\text{cis}\\,70^\\circ)$ and $\\dfrac{8\\,\\text{cis}\\,150^\\circ}{2\\,\\text{cis}\\,30^\\circ}$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "3 \\cdot 4 = 12", say: "The product: **multiply** the moduli." },
          { step: 1, m: "\\frac{8}{2} = 4", say: "The quotient: **divide** the moduli." },
          { step: 2, m: "20^\\circ + 70^\\circ = 90^\\circ", say: "The product: **add** the arguments.", ask: { prompt: "For a product, the arguments are…", answer: 0, options: [{ t: "added" }, { t: "multiplied", fb: "Multiplying the angles would be wrong: like exponents, they **add**." }] } },
          { step: 2, m: "150^\\circ - 30^\\circ = 120^\\circ", say: "The quotient: **subtract** the arguments." },
          { step: 3, m: "12\\,\\text{cis}\\,90^\\circ = 12i", say: "$\\cos 90^\\circ = 0$ and $\\sin 90^\\circ = 1$." },
          { step: 3, m: "4\\,\\text{cis}\\,120^\\circ \\approx -2 + 3.46i", say: "$4\\cos 120^\\circ = -2$ and $4\\sin 120^\\circ \\approx 3.46$." }] },
        gate: true, then: "The product is $12i$ and the quotient is $4\\,\\text{cis}\\,120^\\circ \\approx -2 + 3.46i$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $(2\\,\\text{cis}\\,35^\\circ)^4$.",
        how: HOW_13, skill: "De Moivre's theorem",
        steps: [
          { step: 1, ask: "The new modulus is $r^4 = 2^4 =$", type: "num", pre: "$r^4 =$", answer: 16, near: [{ v: 8, fb: "$2^4 = 2 \\cdot 2 \\cdot 2 \\cdot 2 = 16$, not $2 \\cdot 4$." }], hint: "$2 \\times 2 \\times 2 \\times 2$.", m: "r^4 = 16", say: "Raise the modulus to the 4th." },
          { step: 2, ask: "The new argument is $4 \\times 35^\\circ =$", type: "num", pre: "$\\theta =$", post: "degrees", answer: 140, near: [{ v: 39, fb: "That is $35 + 4$. For a power we **multiply** the angle by 4." }], hint: "$4 \\times 35$.", m: "4\\theta = 140^\\circ", say: "Multiply the angle by the power." },
          { step: 3, ask: "The real part of $16\\,\\text{cis}\\,140^\\circ$ is $16\\cos 140^\\circ \\approx$ (to 2 decimal places)", type: "num", pre: "real part $\\approx$", answer: -12.26, tol: 0.006, calc: true, near: [{ v: 10.28, tol: 0.006, fb: "That is the **imaginary** part, $16\\sin 140^\\circ$. The real part uses the cosine." }], hint: "$\\cos 140^\\circ \\approx -0.766$.", m: "z \\approx -12.26 + 10.28i", say: "In quadrant II." }],
        why: "Moduli, arguments, write it." },
      { type: "num", kicker: "On your own", prompt: "Find $(1 + i)^8$, using the modulus $\\sqrt{2}$ and argument $45^\\circ$ of $1 + i$.", pre: "$(1 + i)^8 =$", answer: 16, skill: "De Moivre's theorem",
        near: [{ v: 8, fb: "$(\\sqrt{2})^8 = (2^{1/2})^8 = 2^4 = 16$." }, { v: 0, fb: "The angle becomes $8 \\times 45^\\circ = 360^\\circ$: a full turn, so $\\cos 360^\\circ = 1$, not 0." }], hints: ["Modulus $(\\sqrt{2})^8 = 16$; angle $360^\\circ$."], why: "$16\\,\\text{cis}\\,360^\\circ = 16$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A power in rectangular form.** Find the real part of $(1 + i\\sqrt{3})^5$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "r = \\sqrt{1 + 3} = 2", say: "The modulus of $1 + i\\sqrt{3}$.", ask: { prompt: "And its argument is…", answer: 0, options: [{ t: "$60^\\circ$: $\\tan\\theta = \\sqrt{3}$, quadrant I" }, { t: "$30^\\circ$", fb: "$\\tan 30^\\circ = \\frac{1}{\\sqrt{3}}$. Here $\\tan\\theta = \\sqrt{3}$: $60^\\circ$." }] } },
          { step: 2, m: "z = 2\\,\\text{cis}\\,60^\\circ", say: "Polar form first." },
          { step: 2, m: "z^5 = 2^5\\,\\text{cis}(5 \\cdot 60^\\circ)", say: "De Moivre." },
          { step: 3, m: "= 32\\,\\text{cis}\\,300^\\circ", say: "$32$ and $300^\\circ$." },
          { step: 3, m: "32\\cos 300^\\circ = 32 \\cdot \\tfrac{1}{2} = 16", say: "The real part. (The imaginary part is $32\\sin 300^\\circ \\approx -27.71$.)" }] },
        gate: true, then: "$(1 + i\\sqrt{3})^5 = 16 - 27.71i$: the real part is $16$." },
      { type: "num", kicker: "Try it", prompt: "Divide: $\\dfrac{6\\,\\text{cis}\\,200^\\circ}{3\\,\\text{cis}\\,50^\\circ}$. What is the **argument** of the quotient, in degrees?", pre: "$\\theta =$", post: "degrees", answer: 150, skill: "Products and quotients in polar form",
        near: [{ v: 250, fb: "That adds the arguments. For a quotient we **subtract** them." }, { v: 4, fb: "That is the angle $200/50$: arguments are subtracted, not divided." }], hints: ["$200 - 50$."], why: "$200^\\circ - 50^\\circ = 150^\\circ$ (and the modulus is $\\frac{6}{3} = 2$)." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lu says $(2\\,\\text{cis}\\,30^\\circ)(3\\,\\text{cis}\\,40^\\circ) = 6\\,\\text{cis}\\,1200^\\circ$. What is wrong?",
        options: [{ t: "The angles must be **added**: $30^\\circ + 40^\\circ = 70^\\circ$, so the product is $6\\,\\text{cis}\\,70^\\circ$" }, { t: "The modulus should be 5", fb: "Moduli are multiplied: $2 \\times 3 = 6$ is correct." }, { t: "Nothing is wrong.", fb: "$30 \\times 40 = 1200$ multiplies the angles. They should be added." }],
        answer: 0, skill: "Products and quotients in polar form", hints: ["Angles behave like exponents."], why: "$6\\,\\text{cis}\\,70^\\circ$." },
      { type: "num", kicker: "Use it", prompt: "A point 2 units from the origin is moved by **multiplying** by $1.5\\,\\text{cis}\\,20^\\circ$, three times. How far from the origin does it end up? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "distance =", answer: 6.75, tol: 0.006, calc: true, skill: "De Moivre's theorem",
        near: [{ v: 4.5, fb: "That is $2 \\times 1.5 \\times 1.5 = 4.5$, only two multiplications. Three means $2 \\cdot 1.5^3$." }], hints: ["Each multiplication multiplies the distance by 1.5."], why: "$2 \\times 1.5^3 = 6.75$ (and the point has turned $60^\\circ$)." }
    ]
  });

  /* ============================================ 14 · Roots of complex numbers */
  var HOW_14 = [["Modulus", "Take the $n$th root of $r$."],
                ["Angles", "$\\dfrac{\\theta + 360^\\circ k}{n}$ for $k = 0, 1, \\dots, n - 1$."],
                ["List", "The $n$ roots are equally spaced, $\\dfrac{360^\\circ}{n}$ apart."]];
  LESSONS.push({
    title: "Roots of complex numbers", art: "pcpolar",
    blurb: "Book 8.5 · Every number has $n$ different $n$th roots, evenly spaced round a circle.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A circle is split into 6 equal parts. How many degrees is each part?", pre: "angle =", post: "degrees", answer: 60, skill: "Angles", near: [{ v: 6, fb: "Divide $360^\\circ$ by 6." }], hints: ["$360 \\div 6$."], why: "$60^\\circ$." },
      { type: "learn", kicker: "Explore",
        prompt: "The points are the **$n$th roots of $1$**: numbers whose $n$th power is 1. Slide $n$ and find the pattern they make. Look at $n = 3$, $n = 4$ and $n = 6$.",
        scene: { type: "sketch", x: [-1.6, 1.6], y: [-1.6, 1.6], u: 90, w: 336, grid: false, gate: true, pts: {},
          params: { n: { min: 2, max: 8, step: 1, v: 2, label: "$n$" } },
          track: function (s) { return s.p.n === 3 || s.p.n === 4 || s.p.n === 6 ? "n" + s.p.n : null; },
          draw: function (s) { var n = s.p.n, pts = [], k, p; for (k = 0; k < n; k++) pts.push(CS(1, 360 * k / n)); var it = cAxes(1.6).concat([{ circle: [[0, 0], 1], c: "soft" }, { path: pts, closed: true, c: "blue" }]); for (k = 0; k < n; k++) { it.push({ seg: [[0, 0], pts[k]], c: "soft", dash: true }, dot(pts[k][0], pts[k][1], k === 0 ? "green" : "blue")); } return it; },
          readout: function (s) { var n = s.p.n, sp = f4(360 / n, 1); return "The " + n + " roots of 1 are $1$ and the points every $" + nm(sp) + "^\\circ$ round the circle: " + (n === 2 ? "just $1$ and $-1$" : "a regular " + ["", "", "", "triangle", "square", "pentagon", "hexagon", "heptagon", "octagon"][n]) + "<br>$n = 3$: " + (s.tracked.n3 ? "✓" : "—") + " · $n = 4$: " + (s.tracked.n4 ? "✓" : "—") + " · $n = 6$: " + (s.tracked.n6 ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.n3 && s.tracked.n4 && s.tracked.n6); } },
        gate: true, then: "The $n$ roots of 1 are the corners of a **regular $n$-gon** on the unit circle, one of them at $1$, each $\\frac{360^\\circ}{n}$ from the next. For the roots of any other number $r\\,\\text{cis}\\,\\theta$, the same shape is **scaled** to radius $r^{1/n}$ and **turned** by $\\frac{\\theta}{n}$." },
      { type: "learn", kicker: "The idea",
        prompt: "The $n$ **$n$th roots** of $r\\,\\text{cis}\\,\\theta$ are $r^{1/n}\\,\\text{cis}\\!\\left(\\dfrac{\\theta + 360^\\circ k}{n}\\right)$ for $k = 0, 1, \\dots, n - 1$: equally spaced round a circle of radius $r^{1/n}$, $\\frac{360^\\circ}{n}$ apart.",
        scene: { type: "method", how: HOW_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the three cube roots of $8$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "8 = 8\\,\\text{cis}\\,0^\\circ", say: "Polar form: modulus 8, argument $0^\\circ$." },
          { step: 1, m: "\\sqrt[3]{8} = 2", say: "The modulus of each root.", ask: { prompt: "All three roots have modulus…", answer: 0, options: [{ t: "$2$, the same for all" }, { t: "$2$, $4$ and $6$", fb: "The roots lie on **one** circle of radius 2, so they share the modulus." }] } },
          { step: 2, m: "\\frac{0^\\circ + 360^\\circ k}{3} = 0^\\circ, 120^\\circ, 240^\\circ", say: "For $k = 0, 1, 2$." },
          { step: 3, m: "2, \\ \\ 2\\,\\text{cis}\\,120^\\circ, \\ \\ 2\\,\\text{cis}\\,240^\\circ", say: "$120^\\circ$ apart." },
          { step: 3, m: "2, \\ -1 + 1.73i, \\ -1 - 1.73i", say: "In $a + bi$ form: $2\\cos 120^\\circ = -1$, $2\\sin 120^\\circ \\approx 1.73$." }] },
        gate: true, then: "The cube roots of $8$ are $2$, $-1 + 1.73i$ and $-1 - 1.73i$. Cube any of them to check." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the two square roots of $-4$.",
        how: HOW_14, skill: "Roots of complex numbers",
        steps: [
          { step: 1, ask: "$-4 = 4\\,\\text{cis}\\,180^\\circ$. The modulus of each square root is $\\sqrt{4} =$", type: "num", pre: "$r =$", answer: 2, near: [{ v: 4, fb: "Take the **square root** of the modulus 4." }], hint: "$\\sqrt{4}$.", m: "r^{1/2} = 2", say: "Both roots are 2 from the origin." },
          { step: 2, ask: "For $k = 0$: $\\dfrac{180^\\circ}{2} =$", type: "num", pre: "$\\theta =$", post: "degrees", answer: 90, near: [{ v: 360, fb: "Divide $180^\\circ$ by $n = 2$." }], hint: "$180 \\div 2$.", m: "\\theta_0 = 90^\\circ", say: "The first root: $2\\,\\text{cis}\\,90^\\circ = 2i$." },
          { step: 3, ask: "For $k = 1$: $\\dfrac{180^\\circ + 360^\\circ}{2} =$", type: "num", pre: "$\\theta =$", post: "degrees", answer: 270, near: [{ v: 90, fb: "That is the $k = 0$ root. For $k = 1$ add $360^\\circ$ first." }], hint: "$540 \\div 2$.", m: "\\theta_1 = 270^\\circ", say: "The second root: $2\\,\\text{cis}\\,270^\\circ = -2i$." }],
        why: "Modulus, angles, list." },
      { type: "num", kicker: "On your own", prompt: "The five 5th roots of a number are equally spaced round a circle. How many degrees apart are neighbouring roots?", pre: "angle =", post: "degrees", answer: 72, skill: "Roots of complex numbers", near: [{ v: 5, fb: "Divide the full turn, $360^\\circ$, by 5." }], hints: ["$360 \\div 5$."], why: "$72^\\circ$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A negative number.** Find the three cube roots of $-27$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "-27 = 27\\,\\text{cis}\\,180^\\circ", say: "Modulus 27, argument $180^\\circ$." },
          { step: 1, m: "\\sqrt[3]{27} = 3", say: "Each root has modulus 3." },
          { step: 2, m: "\\frac{180^\\circ + 360^\\circ k}{3}", say: "For $k = 0, 1, 2$.", ask: { prompt: "$k = 1$ gives $\\frac{540^\\circ}{3} =$", answer: 0, options: [{ t: "$180^\\circ$" }, { t: "$60^\\circ$", fb: "That is $k = 0$: $\\frac{180^\\circ}{3}$. For $k = 1$ the top is $180 + 360 = 540$." }] } },
          { step: 2, m: "60^\\circ, \\ 180^\\circ, \\ 300^\\circ", say: "The three arguments, $120^\\circ$ apart." },
          { step: 3, m: "1.5 + 2.60i, \\ -3, \\ 1.5 - 2.60i", say: "One root is the real number $-3$: of course, $(-3)^3 = -27$." }] },
        gate: true, then: "The cube roots of $-27$ are $-3$ and $1.5 \\pm 2.60i$." },
      { type: "num", kicker: "Try it", prompt: "One cube root of $64\\,\\text{cis}\\,90^\\circ$ has argument $30^\\circ$. What is its modulus?", pre: "$r =$", answer: 4, skill: "Roots of complex numbers",
        near: [{ v: 64, fb: "Take the **cube root** of 64." }, { v: 21.33, tol: 0.01, fb: "That divides by 3. The modulus of a root is the cube **root** of 64." }], hints: ["$\\sqrt[3]{64}$."], why: "$\\sqrt[3]{64} = 4$; the three roots have arguments $30^\\circ$, $150^\\circ$, $270^\\circ$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben finds the square roots of $4\\,\\text{cis}\\,60^\\circ$ and writes \"$2\\,\\text{cis}\\,60^\\circ$\". What is wrong?",
        options: [{ t: "He halved the modulus correctly, but the **argument** must be halved too: $30^\\circ$ (and $210^\\circ$ for the other root)" }, { t: "The modulus should be 4", fb: "$\\sqrt{4} = 2$ is right." }, { t: "Nothing is wrong.", fb: "Check: $(2\\,\\text{cis}\\,60^\\circ)^2 = 4\\,\\text{cis}\\,120^\\circ$, not $4\\,\\text{cis}\\,60^\\circ$." }],
        answer: 0, skill: "Roots of complex numbers", hints: ["Square $2\\,\\text{cis}\\,60^\\circ$ with De Moivre."], why: "$2\\,\\text{cis}\\,30^\\circ$ and $2\\,\\text{cis}\\,210^\\circ$." },
      { type: "num", kicker: "Use it", prompt: "The six 6th roots of 1 are the corners of a regular hexagon on the unit circle. How far apart are two **neighbouring** roots? (A straight-line distance. The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "distance =", answer: 1, tol: 0.006, calc: true, skill: "Roots of complex numbers",
        near: [{ v: 0.5, fb: "That is half of the distance: from the midpoint of the side to a corner." }], hints: ["The triangle from the centre to two neighbours has a $60^\\circ$ angle and two sides of length 1."], why: "An equilateral triangle: the side is 1. (Also $2\\sin 30^\\circ = 1$.)" }
    ]
  });
  /* ============================================ 15 · Parametric equations: the path of a moving point */
  var HOW_15 = [["Table", "Choose values of $t$ and find $x$ and $y$ for each."],
                ["Plot", "Plot each point $(x, y)$."],
                ["Join", "Join them in the **order of $t$**, and add arrows for the direction."]];
  var PAR1 = function (t) { return [2 * t, 6 * t - t * t]; };
  var G15 = function (k) {
    var ts = [-2, -1, 0, 1, 2], it = [];
    if (k >= 1) ts.forEach(function (t) { it.push(dot(t + 1, t * t - 2, "blue")); });
    if (k >= 2) it = curve(function (x) { return (x - 1) * (x - 1) - 2; }, -1.4, 3.4, "orange", [-3.5, 3.5], true).concat(it);
    return grid("The points (-1, 2), (0, -1), (1, -2), (2, -1), (3, 2)" + (k >= 2 ? " joined in order: a U-shaped parabola" : "") + ".", it, { x: [-3, 5], y: [-3, 3.5], u: 26 });
  };
  var G15c = grid("The circle of radius 3: the points (3, 0), (0, 3), (-3, 0) and (0, -3), reached in that order, counterclockwise.", [{ circle: [[0, 0], 3], c: "orange" }, dot(3, 0, "blue", "t = 0", "ne"), dot(0, 3, "blue", "π/2", "ne"), dot(-3, 0, "blue", "π", "nw"), dot(0, -3, "blue", "3π/2", "se")], { x: [-4.5, 4.5], y: [-4.5, 4.5], u: 26 });
  LESSONS.push({
    title: "Parametric equations: the path of a moving point", art: "pcpolar",
    blurb: "Book 8.6 · Let a third quantity, time, say where the point is: $x = f(t)$ and $y = g(t)$.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $x = 3t - 1$, what is $x$ when $t = 4$?", pre: "$x =$", answer: 11, skill: "Evaluate a function", near: [{ v: 12, fb: "$3 \\cdot 4 = 12$, then subtract 1." }], hints: ["$3(4) - 1$."], why: "$12 - 1 = 11$." },
      { type: "learn", kicker: "Explore",
        prompt: "A ball's position at time $t$ is $x = 2t$, $y = 6t - t^2$. Slide the time $t$ and watch where it goes. Find **when it is highest**, and **when it lands** (back at $y = 0$).",
        scene: { type: "sketch", x: [-1, 13], y: [-1, 10.5], u: 24, w: 384, gate: true, pts: {},
          params: { t: { min: 0, max: 6, step: 0.5, v: 1, label: "time $t$" } },
          track: function (s) { return s.p.t === 3 ? "top" : s.p.t === 6 ? "land" : null; },
          draw: function (s) { var p = PAR1(s.p.t), it = curveT(function (u) { return PAR1(u); }, 0, 6, "soft", 80); if (s.p.t > 0) it = it.concat(curveT(function (u) { return PAR1(u); }, 0, s.p.t, "blue", 60)); it.push({ seg: [[p[0], 0], p], c: "orange", dash: true }, dot(p[0], p[1], "orange")); return it; },
          readout: function (s) { var p = PAR1(s.p.t); return "$t = " + nm(s.p.t) + "$: $(x, y) = (" + nm(f4(p[0], 1)) + ", " + nm(f4(p[1], 2)) + ")$<br>Highest point: " + (s.tracked.top ? "✓" : "—") + " · landing: " + (s.tracked.land ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.top && s.tracked.land); } },
        gate: true, then: "At $t = 3$ the ball is at its highest, $(6, 9)$. It lands when $y = 6t - t^2 = 0$, at $t = 6$, at $(12, 0)$. The curve is described by **two equations that share a third variable**, the **parameter** $t$." },
      { type: "learn", kicker: "The idea",
        prompt: "In **parametric equations** $x = f(t)$ and $y = g(t)$, the **parameter** $t$ (often time) decides where the point is. Make a table of $t$, $x$ and $y$, plot the points **in order of $t$** and join them: the order gives the **direction** of travel.",
        scene: { type: "method", how: HOW_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $x = t + 1$, $y = t^2 - 2$ for $t$ from $-2$ to $2$.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "t: \\ -2, -1, 0, 1, 2", say: "Choose some values of $t$." },
          { step: 1, m: "x = t + 1: \\ -1, 0, 1, 2, 3", say: "Add 1 to each." },
          { step: 1, m: "y = t^2 - 2: \\ 2, -1, -2, -1, 2", say: "Square, then subtract 2.", ask: { prompt: "What is $y$ when $t = -2$?", answer: 0, options: [{ t: "$2$: $(-2)^2 - 2$" }, { t: "$-6$", fb: "$(-2)^2 = +4$, not $-4$. Then $4 - 2 = 2$." }] } },
          { step: 2, m: "(-1, 2), (0, -1), \\dots", say: "Plot each pair $(x, y)$.", fig: G15(1) },
          { step: 3, m: "\\text{in order of } t", say: "Join them from $t = -2$ to $t = 2$: a **parabola**, travelled left to right.", fig: G15(2) }] },
        gate: true, then: "A U-shaped parabola, with the point moving from the upper left, through the bottom $(1, -2)$, to the upper right." },
      { type: "guided", kicker: "Together",
        prompt: "Now you explore $x = 2t - 1$, $y = t + 3$.",
        how: HOW_15, skill: "Parametric equations",
        steps: [
          { step: 1, ask: "At $t = 2$, $x = 2(2) - 1 =$", type: "num", pre: "$x =$", answer: 3, near: [{ v: 4, fb: "Subtract 1 after doubling: $4 - 1$." }], hint: "$4 - 1$.", m: "t = 2: \\ x = 3", say: "One row of the table." },
          { step: 2, ask: "At $t = 2$, $y = 2 + 3 =$ — so the point is $(3, \\ ?)$", type: "num", pre: "$y =$", answer: 5, near: [{ v: 6, fb: "$y = t + 3$, not $2t + 3$: $2 + 3$." }], hint: "$2 + 3$.", m: "(3, 5)", say: "Plot it." },
          { step: 3, ask: "As $t$ increases, $x$ and $y$ both increase. The point moves…", type: "choice", answer: 0, options: [{ t: "up and to the right" }, { t: "down and to the left", fb: "That is the direction as $t$ **decreases**." }], m: "\\text{up and to the right}", say: "A straight line, travelled upwards." }],
        why: "Table, plot, join." },
      { type: "num", kicker: "On your own", prompt: "For $x = 2t$ and $y = t^2 - 4$, what is $y$ when $t = 3$?", pre: "$y =$", answer: 5, skill: "Parametric equations", near: [{ v: 6, fb: "$y = t^2 - 4$ uses $t$, not $x = 2t$: $3^2 - 4$." }, { v: 2, fb: "$3^2 = 9$, not 6." }], hints: ["$3^2 - 4$."], why: "$9 - 4 = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A trigonometric path.** Graph $x = 3\\cos t$, $y = 3\\sin t$ for $t$ from $0$ to $2\\pi$.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "t: \\ 0, \\tfrac{\\pi}{2}, \\pi, \\tfrac{3\\pi}{2}", say: "The four quarter turns.", fig: G15c },
          { step: 1, m: "x = 3\\cos t: \\ 3, 0, -3, 0", say: "Cosine: $1, 0, -1, 0$." },
          { step: 1, m: "y = 3\\sin t: \\ 0, 3, 0, -3", say: "Sine: $0, 1, 0, -1$.", ask: { prompt: "At $t = \\pi$ the point is…", answer: 0, options: [{ t: "$(-3, 0)$" }, { t: "$(0, -3)$", fb: "$\\cos\\pi = -1$ gives $x = -3$; $\\sin\\pi = 0$ gives $y = 0$." }] } },
          { step: 2, m: "(3, 0), (0, 3), (-3, 0), (0, -3)", say: "Plot them." },
          { step: 3, m: "\\text{counterclockwise}", say: "In order of $t$ they go round the circle **counterclockwise**: a circle of radius 3 starting at $(3, 0)$." }] },
        gate: true, then: "A circle of radius 3, travelled counterclockwise, once, starting and ending at $(3, 0)$." },
      { type: "num", kicker: "Try it", prompt: "A point has $x = 4\\cos t$ and $y = 2\\sin t$. Find $y$ when $t = \\frac{\\pi}{3}$, to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$y \\approx$", answer: 1.73, tol: 0.006, calc: true, skill: "Parametric equations",
        near: [{ v: 2, fb: "That is $x = 4\\cos\\frac{\\pi}{3}$. The $y$ equation has the **sine**." }], hints: ["$2\\sin\\frac{\\pi}{3}$."], why: "$2 \\times \\frac{\\sqrt{3}}{2} = \\sqrt{3} \\approx 1.73$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ivy graphs $x = t^2$, $y = t$ for $t = -2, -1, 0, 1, 2$, but joins the points in order of $x$ (smallest first). What goes wrong?",
        options: [{ t: "The points must be joined in order of **$t$**: $(4, -2), (1, -1), (0, 0), (1, 1), (4, 2)$. Ordering by $x$ zigzags" }, { t: "Nothing: any order gives the same curve", fb: "Ordering by $x$ visits $(0, 0), (1, -1), (1, 1), (4, -2), (4, 2)$: a zigzag, not a smooth parabola." }, { t: "The parameter $t$ is not needed to join points", fb: "The whole point of a parameter is the **order** in which the point moves." }],
        answer: 0, skill: "Parametric equations", hints: ["Which variable says where the point is at each moment?"], why: "Join in order of $t$: a parabola lying on its side." },
      { type: "num", kicker: "Use it", prompt: "A drone's position is $x = 4t$, $y = 30 - 5t^2$ (metres, $t$ in seconds). It lands when $y = 0$. How far has it travelled horizontally ($x$) when it lands, to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$x \\approx$", post: "m", answer: 9.8, tol: 0.006, calc: true, skill: "Parametric equations",
        near: [{ v: 2.45, tol: 0.006, fb: "That is the **time** it lands, $t = \\sqrt{6}$. Put it into $x = 4t$." }], hints: ["$30 - 5t^2 = 0$ gives $t = \\sqrt{6}$."], why: "$t = \\sqrt{6} \\approx 2.449$, so $x = 4t \\approx 9.80$ m." }
    ]
  });

  /* ============================================ 16 · Eliminating the parameter */
  var HOW_16 = [["Solve for t", "Solve the simpler equation for $t$."],
                ["Substitute", "Put that into the other equation."],
                ["Check limits", "Does the parameter restrict $x$ or $y$?"]];
  var CAND16 = [["y = x²", function (x) { return x * x; }], ["y = (x − 1)²", function (x) { return (x - 1) * (x - 1); }], ["y = x − 1", function (x) { return x - 1; }], ["y = (x + 1)²", function (x) { return (x + 1) * (x + 1); }]];
  LESSONS.push({
    title: "Eliminating the parameter", art: "pcpolar",
    blurb: "Book 8.6 · Turn $x = t + 1$, $y = t^2$ into one equation in $x$ and $y$.",
    mins: 15, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Solve $x = t + 1$ for $t$.",
        options: [{ t: "$t = x - 1$" }, { t: "$t = x + 1$", fb: "Subtract 1 from both sides: $t = x - 1$." }, { t: "$t = 1 - x$", fb: "That has the wrong sign: $t = x - 1$." }],
        answer: 0, skill: "Solve for a variable", hints: ["Subtract 1 from both sides."], why: "$t = x - 1$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dots are points of the path $x = t + 1$, $y = t^2$ (for $t = -2, -1, 0, 1, 2$). Which **rectangular equation** passes through **all** the dots? Try each.",
        scene: { type: "sketch", x: [-4, 6], y: [-1.5, 9], u: 27, w: 318, gate: true, pts: {},
          chips: { f: { label: "Try", v: "0", opts: CAND16.map(function (q, i) { return ["" + i, q[0]]; }) } },
          track: function (s) { return +s.c.f === 1 ? "yes" : null; },
          draw: function (s) { var q = CAND16[+s.c.f], it = curve(q[1], -4, 6, "blue", [-1.5, 9]); [-2, -1, 0, 1, 2].forEach(function (t) { it.push(dot(t + 1, t * t, "orange")); }); return it; },
          readout: function (s) { var k = +s.c.f, ok = k === 1; return "$" + ["y = x^2", "y = (x - 1)^2", "y = x - 1", "y = (x + 1)^2"][k] + "$: " + (ok ? "passes through **every** dot ✓" : "misses some dots ✗"); },
          goal: function (s) { return !!s.tracked.yes; } },
        gate: true, then: "$y = (x - 1)^2$ passes through all five dots: from $x = t + 1$ we get $t = x - 1$, and then $y = t^2 = (x - 1)^2$. That is **eliminating the parameter**: solve one equation for $t$ and substitute into the other." },
      { type: "learn", kicker: "The idea",
        prompt: "To **eliminate the parameter**: solve one equation for $t$ and **substitute** it into the other. For $x = a\\cos t$, $y = b\\sin t$ use $\\cos^2 t + \\sin^2 t = 1$. Check whether the parameter **limits** $x$ or $y$: you may get only part of the curve.",
        scene: { type: "method", how: HOW_16 } },
      { type: "learn", kicker: "Watch",
        prompt: "Eliminate $t$ from $x = 4\\cos t$ and $y = 3\\sin t$.",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "\\cos t = \\frac{x}{4}, \\ \\ \\sin t = \\frac{y}{3}", say: "Solve each equation for its trigonometric function." },
          { step: 2, m: "\\cos^2 t + \\sin^2 t = 1", say: "The identity links the two.", ask: { prompt: "Why use $\\cos^2 t + \\sin^2 t = 1$?", answer: 0, options: [{ t: "It removes $t$ when both functions are squared" }, { t: "It makes the graph a line", fb: "It removes the parameter; the result is not a line here." }] } },
          { step: 2, m: "\\left(\\frac{x}{4}\\right)^2 + \\left(\\frac{y}{3}\\right)^2 = 1", say: "Substitute." },
          { step: 3, m: "\\frac{x^2}{16} + \\frac{y^2}{9} = 1", say: "An **ellipse**: $x$ goes from $-4$ to $4$ and $y$ from $-3$ to $3$, and both limits are reached." }] },
        gate: true, then: "$\\dfrac{x^2}{16} + \\dfrac{y^2}{9} = 1$: an ellipse, wider than it is tall." },
      { type: "guided", kicker: "Together",
        prompt: "Now you eliminate $t$ from $x = 2t$, $y = t + 3$.",
        how: HOW_16, skill: "Eliminate the parameter",
        steps: [
          { step: 1, ask: "Solve $x = 2t$ for $t$.", type: "choice", answer: 0, options: [{ t: "$t = \\dfrac{x}{2}$" }, { t: "$t = 2x$", fb: "Divide by 2, do not multiply: $t = \\frac{x}{2}$." }], m: "t = \\frac{x}{2}", say: "Solved." },
          { step: 2, ask: "Substitute into $y = t + 3$: $y =$", type: "choice", answer: 0, options: [{ t: "$\\dfrac{x}{2} + 3$" }, { t: "$2x + 3$", fb: "Put in $t = \\frac{x}{2}$, not $2x$." }], m: "y = \\frac{x}{2} + 3", say: "The rectangular equation." },
          { step: 3, ask: "This is a line. Its **slope** is (a decimal is fine)", type: "num", pre: "slope =", answer: 0.5, near: [{ v: 2, fb: "That is the coefficient of $t$ in $x = 2t$, not the slope. $y = \\frac{x}{2} + 3$ has slope $\\frac{1}{2}$." }], hint: "The number multiplying $x$.", m: "\\text{slope } \\tfrac{1}{2}", say: "No limits on $t$: the whole line." }],
        why: "Solve for t, substitute, check limits." },
      { type: "choice", kicker: "On your own", prompt: "Eliminate $t$ from $x = e^t$ and $y = 2t$.",
        options: [{ t: "$y = 2\\ln x$" }, { t: "$y = 2e^x$", fb: "From $x = e^t$, $t = \\ln x$, not $e^x$." }, { t: "$y = \\ln 2x$", fb: "$y = 2t = 2\\ln x$: the 2 multiplies the log." }],
        answer: 0, skill: "Eliminate the parameter", hints: ["$t = \\ln x$."], why: "$t = \\ln x$, so $y = 2\\ln x$ (with $x > 0$)." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A limit on $x$.** Eliminate $t$ from $x = \\sqrt{t}$ and $y = 3t + 1$.",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "x = \\sqrt{t} \\Rightarrow t = x^2", say: "Square both sides to solve for $t$." },
          { step: 2, m: "y = 3x^2 + 1", say: "Substitute into $y = 3t + 1$." },
          { step: 3, m: "x = \\sqrt{t} \\ge 0", say: "A square root is never negative: $x \\ge 0$.", ask: { prompt: "So the graph is…", answer: 0, options: [{ t: "only the **right half** of the parabola $y = 3x^2 + 1$" }, { t: "the whole parabola", fb: "The left half would need negative $x$, which $\\sqrt{t}$ never gives." }] } },
          { step: 3, m: "y = 3x^2 + 1, \\ x \\ge 0", say: "The restriction is part of the answer." }] },
        gate: true, then: "$y = 3x^2 + 1$ with $x \\ge 0$: half a parabola, starting at $(0, 1)$." },
      { type: "num", kicker: "Try it", prompt: "The curve $x = 2\\cos t$, $y = 2\\sin t$ is a circle. What is its **radius**?", pre: "radius =", answer: 2, skill: "Eliminate the parameter", near: [{ v: 4, fb: "$x^2 + y^2 = 4$ is $r^2$: the radius is $\\sqrt{4}$." }], hints: ["$x^2 + y^2 = 4\\cos^2 t + 4\\sin^2 t$."], why: "$x^2 + y^2 = 4$: radius $2$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Jo eliminates $t$ from $x = 3t - 2$, $y = t + 1$. Tap the line where the work **first** goes wrong.",
        lines: ["x = 3t - 2", "t = \\frac{x - 2}{3}", "y = \\frac{x - 2}{3} + 1", "y = \\frac{x + 1}{3}"], answer: 1, fix: "t = \\frac{x + 2}{3}",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Eliminate the parameter",
        hints: ["Add 2 to both sides first."], why: "$x = 3t - 2$ gives $3t = x + 2$, so $t = \\frac{x + 2}{3}$ and $y = \\frac{x + 5}{3}$." },
      { type: "num", kicker: "Use it", prompt: "A bug crawls along $x = 3t$, $y = 4t$ (centimetres). Eliminating $t$ gives $y = mx$. What is $m$? (A fraction is fine.)", pre: "$m =$", answer: 1.3333, tol: 0.001, skill: "Eliminate the parameter",
        near: [{ v: 0.75, tol: 0.001, fb: "That is $\\frac{x}{y}$ upside down: $t = \\frac{x}{3}$, so $y = 4\\cdot\\frac{x}{3}$." }, { v: 5, fb: "That is the bug's **speed** per second, $\\sqrt{3^2 + 4^2}$. We want the slope." }], hints: ["$t = \\frac{x}{3}$."], why: "$y = \\frac{4}{3}x$." }
    ]
  });

  /* ============================================ 17 · Projectile motion */
  var HOW_17 = [["Components", "Find $v\\cos\\theta$ (across) and $v\\sin\\theta$ (up)."],
                ["Equations", "Write $x = (v\\cos\\theta)t$ and $y = (v\\sin\\theta)t - 4.9t^2$."],
                ["Ask", "Set $y = 0$ for the landing time; $x$ at that time is the range."]];
  var PROJ = function (v, th) { return function (t) { return [v * COS(th * DEG) * t, v * SIN(th * DEG) * t - 4.9 * t * t]; }; };
  LESSONS.push({
    title: "Projectile motion", art: "pcpolar",
    blurb: "Book 8.7 · A kicked ball is a pair of parametric equations: steady across, speeding up and down.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A ball is thrown at $10$ m/s at $30^\\circ$. How fast does it go **up**, $10\\sin 30^\\circ$?", pre: "upward speed =", post: "m/s", answer: 5, skill: "Right triangle trigonometry", near: [{ v: 8.66, tol: 0.01, fb: "That is $10\\cos 30^\\circ$, the **horizontal** speed." }], hints: ["$\\sin 30^\\circ = \\frac{1}{2}$."], why: "$5$ m/s." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the launch speed $v$ and the angle $\\theta$ and watch the path. Find the angle with the **longest range**, and **two different angles with the same range**.",
        scene: { type: "sketch", x: [-3, 70], y: [-3, 32], u: 4.6, gx: 10, step: 10, gy: 10, stepY: 10, w: 384, gate: true, pts: {},
          params: { v: { min: 10, max: 25, step: 5, v: 20, label: "speed $v$ (m/s)" }, a: { min: 15, max: 75, step: 15, v: 45, label: "angle $\\theta$ (°)" } },
          track: function (s) { return s.p.a === 45 ? "best" : s.p.a === 30 ? "a30" : s.p.a === 60 ? "a60" : null; },
          draw: function (s) { var T = 2 * s.p.v * SIN(s.p.a * DEG) / 9.8, it = curveT(PROJ(s.p.v, s.p.a), 0, T, "blue", 80), R = s.p.v * s.p.v * SIN(2 * s.p.a * DEG) / 9.8; it.push(dot(R, 0, "orange")); return it; },
          readout: function (s) { var v = s.p.v, a = s.p.a * DEG, R = v * v * SIN(2 * a) / 9.8, H = Math.pow(v * SIN(a), 2) / 19.6; return "$v = " + v + "$, $\\theta = " + s.p.a + "^\\circ$: range $" + nm(f4(R, 1)) + "$ m, height $" + nm(f4(H, 1)) + "$ m<br>Best angle: " + (s.tracked.best ? "✓" : "—") + " · $30^\\circ$: " + (s.tracked.a30 ? "✓" : "—") + " · $60^\\circ$: " + (s.tracked.a60 ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.best && s.tracked.a30 && s.tracked.a60); } },
        gate: true, then: "The range is longest at $45^\\circ$ and **the same for $30^\\circ$ and $60^\\circ$** (they add to $90^\\circ$): the range is $\\frac{v^2\\sin 2\\theta}{9.8}$, and $\\sin 60^\\circ = \\sin 120^\\circ$. The higher angle just takes longer." },
      { type: "learn", kicker: "The idea",
        prompt: "Launched at speed $v$ and angle $\\theta$: $x = (v\\cos\\theta)\\,t$ and $y = (v\\sin\\theta)\\,t - 4.9t^2$ (metres and seconds, from the ground). It lands when $y = 0$, at $t = \\dfrac{2v\\sin\\theta}{9.8}$; the range is $x$ then.",
        scene: { type: "method", how: HOW_17 } },
      { type: "learn", kicker: "Watch",
        prompt: "A ball is kicked at $20$ m/s at $30^\\circ$. How long is it in the air, how far does it go, and how high?",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "v\\cos 30^\\circ \\approx 17.32", say: "Across: the steady speed." },
          { step: 1, m: "v\\sin 30^\\circ = 10", say: "Up: the starting upward speed.", ask: { prompt: "What is $20\\sin 30^\\circ$?", answer: 0, options: [{ t: "$10$" }, { t: "$17.32$", fb: "That is $20\\cos 30^\\circ$, the horizontal part." }] } },
          { step: 2, m: "x = 17.32t, \\ \\ y = 10t - 4.9t^2", say: "The two equations." },
          { step: 3, m: "y = 0: \\ t = \\frac{10}{4.9} \\approx 2.04 \\text{ s}", say: "$10t - 4.9t^2 = t(10 - 4.9t)$: zero again at $t = \\frac{10}{4.9}$." },
          { step: 3, m: "x = 17.32(2.04) \\approx 35.3 \\text{ m}", say: "The range." },
          { step: 3, m: "t = 1.02: \\ y \\approx 5.1 \\text{ m}", say: "Highest halfway through the flight." }] },
        gate: true, then: "In the air about $2.04$ s, range about $35.3$ m, highest about $5.1$ m." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the range of a ball launched at $30$ m/s at $40^\\circ$.",
        how: HOW_17, skill: "Projectile motion",
        steps: [
          { step: 1, ask: "The horizontal speed $30\\cos 40^\\circ \\approx$ (to 2 decimal places)", type: "num", pre: "$v\\cos\\theta \\approx$", answer: 22.98, tol: 0.006, calc: true, near: [{ v: 19.28, tol: 0.006, fb: "That is $30\\sin 40^\\circ$, the upward speed. Across uses the cosine." }], hint: "$30 \\times 0.766$.", m: "x = 22.98\\,t", say: "Across." },
          { step: 2, ask: "Which equation gives the **height**?", type: "choice", answer: 0, options: [{ t: "$y = (30\\sin 40^\\circ)\\,t - 4.9t^2$" }, { t: "$y = (30\\cos 40^\\circ)\\,t - 4.9t^2$", fb: "The height starts with the **upward** speed, $v\\sin\\theta$." }], m: "y = 19.28\\,t - 4.9t^2", say: "Up, then pulled down by gravity." },
          { step: 3, ask: "It lands at $t = \\dfrac{2(30)\\sin 40^\\circ}{9.8} \\approx$ (seconds, to 2 decimal places)", type: "num", pre: "$t \\approx$", post: "s", answer: 3.94, tol: 0.006, calc: true, near: [{ v: 1.97, tol: 0.006, fb: "That is half the flight time (the time to the top). Landing is twice that." }], hint: "$\\frac{60 \\times 0.6428}{9.8}$.", m: "t \\approx 3.94 \\text{ s}", say: "Up and down." },
          { step: 3, ask: "The range is $x$ at that time: $22.98 \\times 3.94 \\approx$ (metres, to 1 decimal place)", type: "num", pre: "range $\\approx$", post: "m", answer: 90.44, tol: 0.15, calc: true, near: [{ v: 22.98, tol: 0.1, fb: "That is the speed across. Multiply it by the **time** in the air." }], hint: "$22.98 \\times 3.935$.", m: "\\approx 90.4 \\text{ m}", say: "Check: $\\frac{v^2\\sin 2\\theta}{9.8} = \\frac{900\\sin 80^\\circ}{9.8} \\approx 90.4$." }],
        why: "Components, equations, ask." },
      { type: "num", kicker: "On your own", prompt: "A ball is launched at $20$ m/s at $30^\\circ$. Its maximum height is $\\dfrac{(v\\sin\\theta)^2}{19.6}$. How high does it go, to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "height $\\approx$", post: "m", answer: 5.1, tol: 0.006, calc: true, skill: "Projectile motion",
        near: [{ v: 10.2, tol: 0.1, fb: "That used $19.6$ with $v\\sin\\theta = 10$ only once: square the 10 first: $\\frac{100}{19.6}$." }], hints: ["$v\\sin\\theta = 10$."], why: "$\\frac{100}{19.6} \\approx 5.10$ m." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Over a wall.** A ball is hit at $18$ m/s at $35^\\circ$. A $3$ m wall is $20$ m away. Does it clear the wall?",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "x = 18\\cos 35^\\circ\\, t \\approx 14.74\\,t", say: "Across." },
          { step: 2, m: "20 = 14.74\\,t \\Rightarrow t \\approx 1.356", say: "When is $x = 20$?" },
          { step: 3, m: "y = 18\\sin 35^\\circ(1.356) - 4.9(1.356)^2", say: "The height at that time.", ask: { prompt: "What do we compare $y$ with?", answer: 0, options: [{ t: "The wall's height, $3$ m" }, { t: "The range", fb: "The question is the **height** when the ball is above the wall." }] } },
          { step: 3, m: "y \\approx 14.0 - 9.0 \\approx 5.0", say: "About $4.99$ m: above $3$ m." }] },
        gate: true, then: "At the wall the ball is about $5$ m up: it **clears** the $3$ m wall." },
      { type: "num", kicker: "Try it", prompt: "A ball is kicked at $15$ m/s at $20^\\circ$. Find its range, $\\dfrac{v^2\\sin 2\\theta}{9.8}$, to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "range $\\approx$", post: "m", answer: 14.76, tol: 0.006, calc: true, skill: "Projectile motion",
        near: [{ v: 7.38, tol: 0.006, fb: "That is half the range: the formula uses $\\sin 2\\theta = \\sin 40^\\circ$, with $v^2 = 225$ over $9.8$." }], hints: ["$\\frac{225\\sin 40^\\circ}{9.8}$."], why: "$\\frac{225 \\times 0.6428}{9.8} \\approx 14.76$ m." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says a ball launched at $60^\\circ$ goes farther than one at $30^\\circ$ \"because it goes higher\". What is wrong?",
        options: [{ t: "The two ranges are **equal**: $\\sin 120^\\circ = \\sin 60^\\circ$, so $\\sin 2\\theta$ is the same. The $60^\\circ$ ball goes higher but also stays up longer" }, { t: "The $30^\\circ$ ball goes farther", fb: "They land at the same distance: $\\frac{v^2\\sin 2\\theta}{9.8}$ is the same for $30^\\circ$ and $60^\\circ$." }, { t: "Nothing is wrong.", fb: "Try the formula: $\\sin 60^\\circ = \\sin 120^\\circ$." }],
        answer: 0, skill: "Projectile motion", hints: ["Compare $\\sin 60^\\circ$ with $\\sin 120^\\circ$."], why: "Complementary angles give equal ranges." },
      { type: "num", kicker: "Use it", prompt: "A goalkeeper kicks a ball at $22$ m/s at $35^\\circ$. How long is it in the air, $\\dfrac{2v\\sin\\theta}{9.8}$, to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$t \\approx$", post: "s", answer: 2.58, tol: 0.006, calc: true, skill: "Projectile motion",
        near: [{ v: 1.29, tol: 0.006, fb: "That is the time to the **top**, half the flight." }], hints: ["$\\frac{2 \\times 22 \\times 0.5736}{9.8}$."], why: "$\\frac{25.24}{9.8} \\approx 2.58$ s." }
    ]
  });
  /* ============================================ 18 · Vectors: magnitude, direction and components */
  var HOW_18 = [["Components", "$\\vec{v} = \\langle a, b\\rangle$: across $a$, up $b$."],
                ["Magnitude", "$|\\vec{v}| = \\sqrt{a^2 + b^2}$."],
                ["Direction", "$\\tan\\theta = \\frac{b}{a}$, with $\\theta$ in the quadrant of the arrow."]];
  var G18 = function (k) {
    var it = [{ arrow: [[0, 0], [-6, 8]], c: "blue" }];
    if (k >= 2) it.push({ seg: [[0, 0], [-6, 0]], c: "soft", dash: true }, { seg: [[-6, 0], [-6, 8]], c: "soft", dash: true }, { text: "10", at: [-3.9, 4.6], c: "green" });
    if (k >= 3) it.push({ turn: [[0, 0], 1.6, 0, 126.87], c: "orange" }, { text: "126.9°", at: [1.8, 2.2], c: "orange" });
    return grid("The vector with components -6 and 8, drawn from the origin to the point (-6, 8)" + (k >= 2 ? ", length 10" : "") + (k >= 3 ? ", at an angle of about 127 degrees" : "") + ".", it, { x: [-8, 3], y: [-1.5, 9.5], u: 22 });
  };
  LESSONS.push({
    title: "Vectors: magnitude, direction and components", art: "pcpolar",
    blurb: "Book 8.8 · An arrow with a length and a direction, written as $\\langle a, b\\rangle$.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A walker goes 3 km east and then 4 km north. How far is she from the start in a straight line?", pre: "distance =", post: "km", answer: 5, skill: "Pythagorean theorem", near: [{ v: 7, fb: "That is the distance she **walked**. In a straight line it is the hypotenuse: $\\sqrt{3^2 + 4^2}$." }], hints: ["$\\sqrt{9 + 16}$."], why: "$5$ km." },
      { type: "learn", kicker: "Explore",
        prompt: "A vector has a **length** (magnitude) $m$ and a **direction** $\\theta$. Slide both to match the **two orange targets**: length $8$ at $120^\\circ$, and length $6$ at $30^\\circ$. The readout gives its **components**.",
        scene: { type: "sketch", x: [-8.5, 8.5], y: [-8.5, 8.5], u: 16, w: 320, grid: false, gate: true, pts: {},
          params: { m: { min: 1, max: 8, step: 1, v: 4, label: "length $m$" }, t: { min: 0, max: 360, step: 15, v: 45, label: "direction $\\theta$ (°)" } },
          track: function (s) { return s.p.m === 8 && s.p.t === 120 ? "t1" : s.p.m === 6 && s.p.t === 30 ? "t2" : null; },
          draw: function (s) { var p = CS(s.p.m, s.p.t); return cAxes(8.5, ["x", "y"]).concat([hole(CS(8, 120)[0], CS(8, 120)[1], "orange"), hole(CS(6, 30)[0], CS(6, 30)[1], "orange"), { seg: [[0, 0], [p[0], 0]], c: "blue", dash: true }, { seg: [[p[0], 0], p], c: "orange", dash: true }, { arrow: [[0, 0], p], c: "blue" }]); },
          readout: function (s) { var p = CS(s.p.m, s.p.t); return "$\\vec{v} = \\langle " + nm(f4(p[0], 2)) + ", " + nm(f4(p[1], 2)) + "\\rangle$ · $|\\vec{v}| = " + s.p.m + "$ · direction $" + s.p.t + "^\\circ$<br>First target: " + (s.tracked.t1 ? "✓" : "—") + " · second target: " + (s.tracked.t2 ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.t1 && s.tracked.t2); } },
        gate: true, then: "The first target is $\\langle -4, 6.93\\rangle$ and the second is $\\langle 5.20, 3\\rangle$. A vector is its two **components** $\\langle a, b\\rangle$ (across and up), and equally its **magnitude** and **direction**: $a = m\\cos\\theta$ and $b = m\\sin\\theta$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **vector** has a **magnitude** and a **direction**. In components, $\\vec{v} = \\langle a, b\\rangle$: $|\\vec{v}| = \\sqrt{a^2 + b^2}$ and $\\tan\\theta = \\frac{b}{a}$ (check the quadrant). Back again: $a = |\\vec{v}|\\cos\\theta$ and $b = |\\vec{v}|\\sin\\theta$.",
        scene: { type: "method", how: HOW_18 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the magnitude and direction of $\\vec{v} = \\langle -6, 8\\rangle$.",
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "\\vec{v} = \\langle -6, 8\\rangle", say: "6 to the left and 8 up.", fig: G18(1) },
          { step: 2, m: "|\\vec{v}| = \\sqrt{36 + 64} = 10", say: "The length of the arrow.", fig: G18(2) },
          { step: 3, m: "\\tan\\theta = \\frac{8}{-6}", say: "The calculator would say $-53.13^\\circ$.", ask: { prompt: "$\\langle -6, 8\\rangle$ points into which quadrant?", answer: 0, options: [{ t: "II: left and up" }, { t: "IV: right and down", fb: "$-53.13^\\circ$ is in quadrant IV, but the arrow goes **left** and **up**: quadrant II." }] } },
          { step: 3, m: "\\theta = -53.13^\\circ + 180^\\circ \\approx 126.87^\\circ", say: "Quadrant II: add $180^\\circ$.", fig: G18(3) }] },
        gate: true, then: "$|\\vec{v}| = 10$ and the direction is about $126.9^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the magnitude and direction of $\\vec{v} = \\langle 5, -12\\rangle$.",
        how: HOW_18, skill: "Vectors",
        steps: [
          { step: 1, ask: "The arrow points…", type: "choice", answer: 0, options: [{ t: "right and **down**" }, { t: "right and up", fb: "The $y$-component is $-12$: negative, so **down**." }], m: "\\langle 5, -12\\rangle", say: "Quadrant IV." },
          { step: 2, ask: "$|\\vec{v}| = \\sqrt{5^2 + (-12)^2} =$", type: "num", pre: "$|\\vec{v}| =$", answer: 13, near: [{ v: 169, fb: "That is the number under the root. Take the square root." }, { v: 7, fb: "Add the **squares**: $25 + 144$." }], hint: "$\\sqrt{169}$.", m: "|\\vec{v}| = 13", say: "A 5-12-13 triangle." },
          { step: 3, ask: "$\\arctan\\dfrac{-12}{5} \\approx -67.38^\\circ$. As an angle from $0^\\circ$ to $360^\\circ$, $\\theta =$ (2 decimal places)", type: "num", pre: "$\\theta \\approx$", post: "degrees", answer: 292.62, tol: 0.006, calc: true, near: [{ v: -67.38, tol: 0.006, fb: "That is correct but negative. Add $360^\\circ$ to get an angle between $0^\\circ$ and $360^\\circ$." }], hint: "$-67.38 + 360$.", m: "\\theta \\approx 292.62^\\circ", say: "Quadrant IV." }],
        why: "Components, magnitude, direction." },
      { type: "num", kicker: "On your own", prompt: "Find the magnitude of $\\vec{v} = \\langle -7, 24\\rangle$.", pre: "$|\\vec{v}| =$", answer: 25, skill: "Vectors", near: [{ v: 17, fb: "That is $-7 + 24$. Use $\\sqrt{a^2 + b^2}$." }, { v: 625, fb: "That is $a^2 + b^2$: take the square root." }], hints: ["$\\sqrt{49 + 576}$."], why: "$\\sqrt{625} = 25$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**From magnitude and direction.** A wind blows at $50$ km/h in the direction $30^\\circ$ north of east. Find its components.",
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "|\\vec{v}| = 50, \\ \\theta = 30^\\circ", say: "We have the length and the direction." },
          { step: 2, m: "a = 50\\cos 30^\\circ \\approx 43.30", say: "East: the cosine.", ask: { prompt: "North uses…", answer: 0, options: [{ t: "the sine: $50\\sin 30^\\circ$" }, { t: "the cosine again", fb: "The side **opposite** the angle (the vertical one) is the sine." }] } },
          { step: 2, m: "b = 50\\sin 30^\\circ = 25", say: "North." },
          { step: 3, m: "\\vec{v} \\approx \\langle 43.30, 25\\rangle", say: "Check: $\\sqrt{43.30^2 + 25^2} = 50$." }] },
        gate: true, then: "The wind is $\\langle 43.30, 25\\rangle$ km/h: $43.3$ east and $25$ north." },
      { type: "num", kicker: "Try it", prompt: "A vector has magnitude $40$ and direction $120^\\circ$. What is its $x$-component? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$a =$", answer: -20, tol: 0.006, calc: true, skill: "Vectors",
        near: [{ v: 20, fb: "At $120^\\circ$ the arrow points **left**: the $x$-component is negative." }, { v: 34.64, tol: 0.006, fb: "That is the magnitude of the **$y$-component**, $40\\sin 120^\\circ$. The $x$-component uses the cosine." }], hints: ["$40\\cos 120^\\circ$, and $\\cos 120^\\circ = -\\frac{1}{2}$."], why: "$40 \\times (-0.5) = -20$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Pia finds $|\\langle 3, -4\\rangle|$. Tap the line where the work **first** goes wrong.",
        lines: ["\\vec{v} = \\langle 3, -4\\rangle", "|\\vec{v}| = \\sqrt{3^2 - 4^2}", "|\\vec{v}| = \\sqrt{-7}", "\\text{no such vector}"], answer: 1, fix: "|\\vec{v}| = \\sqrt{3^2 + (-4)^2} = 5",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Vectors",
        hints: ["The components are squared, and a square is never negative."], why: "$(-4)^2 = +16$: add the squares. $|\\vec{v}| = 5$." },
      { type: "num", kicker: "Use it", prompt: "A plane flies at $300$ km/h in the direction $40^\\circ$ north of east. How fast is it going **north**, to 2 decimal places? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "northward $\\approx$", post: "km/h", answer: 192.84, tol: 0.006, calc: true, skill: "Vectors",
        near: [{ v: 229.81, tol: 0.006, fb: "That is the **eastward** speed, $300\\cos 40^\\circ$. North is the sine." }], hints: ["$300\\sin 40^\\circ$."], why: "$300 \\times 0.6428 \\approx 192.84$." }
    ]
  });

  /* ============================================ 19 · Vector operations and unit vectors */
  var HOW_19 = [["Components", "Write each vector as $\\langle a, b\\rangle$."],
                ["Operate", "Add or scale each component on its own."],
                ["Finish", "If asked, find a magnitude or a unit vector $\\dfrac{\\vec{v}}{|\\vec{v}|}$."]];
  LESSONS.push({
    title: "Adding and scaling vectors, and unit vectors", art: "pcpolar",
    blurb: "Book 8.8 · Add arrows tip to tail, stretch them, and shrink one to length 1.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Add $\\langle 2, 5\\rangle$ and $\\langle 3, -1\\rangle$ by adding matching components. What is the **first** component of the sum?", pre: "first component =", answer: 5, skill: "Vector addition", near: [{ v: 4, fb: "That is the second component, $5 + (-1)$. The first is $2 + 3$." }], hints: ["$2 + 3$."], why: "$\\langle 5, 4\\rangle$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue arrow is $\\vec{u} = \\langle 4, 1\\rangle$. Slide the components of the orange arrow $\\vec{v}$ and watch the **green sum** $\\vec{u} + \\vec{v}$. Make the sum equal $\\langle 1, 5\\rangle$, and then make it the **zero vector**.",
        scene: { type: "sketch", x: [-8, 9], y: [-6, 7], u: 20, w: 388, grid: false, gate: true, pts: {},
          params: { a: { min: -4, max: 4, step: 1, v: 2, label: "$v_1$ (across)" }, b: { min: -4, max: 4, step: 1, v: 2, label: "$v_2$ (up)" } },
          track: function (s) { var x = 4 + s.p.a, y = 1 + s.p.b; return x === 1 && y === 5 ? "t1" : x === 0 && y === 0 ? "zero" : null; },
          draw: function (s) { var a = s.p.a, b = s.p.b, x = 4 + a, y = 1 + b; return [{ seg: [[-7.5, 0], [8.5, 0]], c: "soft" }, { seg: [[0, -5.5], [0, 6.5]], c: "soft" }, { arrow: [[4, 1], [x, y]], c: "orange", dash: true }, { arrow: [[0, 0], [4, 1]], c: "blue" }, { arrow: [[0, 0], [a, b]], c: "orange" }, { arrow: [[0, 0], [x, y]], c: "green" }]; },
          readout: function (s) { var x = 4 + s.p.a, y = 1 + s.p.b; return "$\\langle 4, 1\\rangle + \\langle " + nm(s.p.a) + ", " + nm(s.p.b) + "\\rangle = \\langle " + nm(x) + ", " + nm(y) + "\\rangle$<br>Sum $\\langle 1, 5\\rangle$: " + (s.tracked.t1 ? "✓" : "—") + " · zero vector: " + (s.tracked.zero ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.t1 && s.tracked.zero); } },
        gate: true, then: "Add vectors **component by component**: $\\langle 4, 1\\rangle + \\langle -3, 4\\rangle = \\langle 1, 5\\rangle$. Drawn **tip to tail** (the dashed orange copy of $\\vec{v}$ starts at the tip of $\\vec{u}$), the sum is the arrow from the start to the end. The zero vector comes from $\\vec{v} = \\langle -4, -1\\rangle$, the **opposite** of $\\vec{u}$." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\langle a, b\\rangle + \\langle c, d\\rangle = \\langle a + c, b + d\\rangle$ and $k\\langle a, b\\rangle = \\langle ka, kb\\rangle$ (longer by $|k|$; reversed if $k < 0$). A **unit vector** has length 1: $\\hat{v} = \\frac{\\vec{v}}{|\\vec{v}|}$. $\\mathbf{i} = \\langle 1, 0\\rangle$, $\\mathbf{j} = \\langle 0, 1\\rangle$.",
        scene: { type: "method", how: HOW_19 } },
      { type: "learn", kicker: "Watch",
        prompt: "For $\\vec{u} = \\langle 3, -2\\rangle$ and $\\vec{v} = \\langle -1, 5\\rangle$, find $\\vec{u} + \\vec{v}$ and $2\\vec{u} - \\vec{v}$.",
        scene: { type: "walk", how: HOW_19, rows: [
          { step: 1, m: "\\vec{u} = \\langle 3, -2\\rangle, \\ \\vec{v} = \\langle -1, 5\\rangle", say: "Components." },
          { step: 2, m: "\\vec{u} + \\vec{v} = \\langle 3 - 1, -2 + 5\\rangle", say: "Add across, add up." },
          { step: 2, m: "= \\langle 2, 3\\rangle", say: "The sum.", ask: { prompt: "What is $-2 + 5$?", answer: 0, options: [{ t: "$3$" }, { t: "$-7$", fb: "Adding a positive 5 to $-2$ moves up: $3$." }] } },
          { step: 2, m: "2\\vec{u} - \\vec{v} = \\langle 6, -4\\rangle - \\langle -1, 5\\rangle", say: "Scale first, then subtract each component." },
          { step: 3, m: "= \\langle 7, -9\\rangle", say: "$6 - (-1) = 7$ and $-4 - 5 = -9$." }] },
        gate: true, then: "$\\vec{u} + \\vec{v} = \\langle 2, 3\\rangle$ and $2\\vec{u} - \\vec{v} = \\langle 7, -9\\rangle$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the **unit vector** in the direction of $\\vec{v} = \\langle -3, 4\\rangle$.",
        how: HOW_19, skill: "Unit vectors",
        steps: [
          { step: 1, ask: "$\\vec{v} = \\langle -3, 4\\rangle$ has magnitude $|\\vec{v}| =$", type: "num", pre: "$|\\vec{v}| =$", answer: 5, near: [{ v: 1, fb: "$-3 + 4 = 1$ is not the magnitude. Use $\\sqrt{(-3)^2 + 4^2}$." }], hint: "$\\sqrt{9 + 16}$.", m: "|\\vec{v}| = 5", say: "The length." },
          { step: 2, ask: "Divide each component by 5. The first is $\\dfrac{-3}{5} =$", type: "num", pre: "first $=$", answer: -0.6, tol: 0.0006, near: [{ v: 0.6, tol: 0.0006, fb: "Keep the minus sign: $-3 \\div 5$." }], hint: "$-3 \\div 5$.", m: "\\frac{-3}{5} = -0.6", say: "Same direction, shorter." },
          { step: 3, ask: "The second component is $\\dfrac{4}{5} =$", type: "num", pre: "second $=$", answer: 0.8, tol: 0.0006, near: [{ v: 1.25, tol: 0.0006, fb: "That is $\\frac{5}{4}$, upside down. Divide $4$ by $5$." }], hint: "$4 \\div 5$.", m: "\\hat{v} = \\langle -0.6, 0.8\\rangle", say: "Check: $0.36 + 0.64 = 1$: length 1." }],
        why: "Components, operate, finish." },
      { type: "num", kicker: "On your own", prompt: "For $\\vec{u} = \\langle 2, 1\\rangle$ and $\\vec{v} = \\langle 1, -1\\rangle$, find the magnitude of $3\\vec{u} - 2\\vec{v}$, to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "magnitude $\\approx$", answer: 6.4, tol: 0.006, calc: true, skill: "Vector operations",
        near: [{ v: 3.16, tol: 0.006, fb: "That is $|\\vec{u}| \\cdot$ something smaller: first find $3\\vec{u} - 2\\vec{v} = \\langle 6 - 2, 3 + 2\\rangle$." }], hints: ["$3\\vec{u} - 2\\vec{v} = \\langle 4, 5\\rangle$."], why: "$\\sqrt{16 + 25} = \\sqrt{41} \\approx 6.40$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Two forces.** One pulls $20$ N east and another pulls $30$ N north. Find the single force that does the same job.",
        scene: { type: "walk", how: HOW_19, rows: [
          { step: 1, m: "\\vec{F}_1 = \\langle 20, 0\\rangle, \\ \\vec{F}_2 = \\langle 0, 30\\rangle", say: "East is the $x$-direction, north the $y$-direction." },
          { step: 2, m: "\\vec{F}_1 + \\vec{F}_2 = \\langle 20, 30\\rangle", say: "Add the components." },
          { step: 3, m: "|\\vec{F}| = \\sqrt{400 + 900} \\approx 36.06", say: "The strength of the combined force.", ask: { prompt: "Why is it less than $20 + 30 = 50$?", answer: 0, options: [{ t: "The two forces pull in different directions" }, { t: "Forces cannot be added", fb: "They can: vector addition. The lengths only add if the forces are in the **same** direction." }] } },
          { step: 3, m: "\\theta = \\arctan\\frac{30}{20} \\approx 56.31^\\circ", say: "North of east." }] },
        gate: true, then: "A force of about $36.06$ N at $56.31^\\circ$ north of east." },
      { type: "num", kicker: "Try it", prompt: "Write $\\langle 4, -3\\rangle$ as $a\\mathbf{i} + b\\mathbf{j}$. What is the coefficient $b$ of $\\mathbf{j}$?", pre: "$b =$", answer: -3, skill: "Unit vectors", near: [{ v: 3, fb: "Keep the sign: the $y$-component is $-3$, so the term is $-3\\mathbf{j}$." }, { v: 4, fb: "$4$ goes with $\\mathbf{i}$ (the $x$-direction). $\\mathbf{j}$ goes with the $y$-component." }], hints: ["$\\mathbf{j} = \\langle 0, 1\\rangle$."], why: "$\\langle 4, -3\\rangle = 4\\mathbf{i} - 3\\mathbf{j}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kai says $|\\vec{u} + \\vec{v}| = |\\vec{u}| + |\\vec{v}|$. Which example shows he is wrong?",
        options: [{ t: "$\\vec{u} = \\langle 3, 0\\rangle$, $\\vec{v} = \\langle 0, 4\\rangle$: the sum has length 5, but $3 + 4 = 7$" }, { t: "$\\vec{u} = \\langle 3, 0\\rangle$, $\\vec{v} = \\langle 4, 0\\rangle$: both sides are 7", fb: "That example works because the two arrows point the **same** way: it cannot disprove the claim." }, { t: "No example is needed: it is true", fb: "It is only true when the vectors point in the same direction." }],
        answer: 0, skill: "Vector operations", hints: ["Use arrows at a right angle."], why: "The lengths only add for parallel vectors." },
      { type: "num", kicker: "Use it", prompt: "A boat heads east at $8$ km/h across a current of $6$ km/h flowing north. How fast does it move relative to the ground?", pre: "speed =", post: "km/h", answer: 10, skill: "Vector operations", near: [{ v: 14, fb: "The velocities are at a **right angle**: add them as vectors, $\\langle 8, 6\\rangle$, and find its length." }], hints: ["$\\sqrt{8^2 + 6^2}$."], why: "$\\sqrt{64 + 36} = 10$ km/h." }
    ]
  });

  /* ============================================ 20 · The dot product */
  var HOW_20 = [["Multiply", "Multiply matching components: $ac$ and $bd$."],
                ["Add", "$\\vec{u}\\cdot\\vec{v} = ac + bd$: a **number**, not a vector."],
                ["Use it", "$\\cos\\theta = \\dfrac{\\vec{u}\\cdot\\vec{v}}{|\\vec{u}||\\vec{v}|}$. A dot product of $0$ means **perpendicular**."]];
  LESSONS.push({
    title: "The dot product and the angle between vectors", art: "pcpolar",
    blurb: "Book 8.8 · One number that measures how much two arrows point the same way.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $(2)(5) + (3)(-4)$.", pre: "$=$", answer: -2, skill: "Arithmetic", near: [{ v: 22, fb: "$(3)(-4) = -12$, not $+12$." }], hints: ["$10 - 12$."], why: "$-2$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue arrow is $\\vec{u} = \\langle 4, 0\\rangle$ and the orange arrow $\\vec{v}$ has length $3$. Slide the angle $\\varphi$ between them and watch the **dot product**. Find an angle where it is **positive**, one where it is **negative** and one where it is **zero**.",
        scene: { type: "sketch", x: [-4.5, 6], y: [-0.8, 4], u: 30, w: 363, grid: false, gate: true, pts: {},
          params: { f: { min: 0, max: 180, step: 15, v: 30, label: "angle $\\varphi$ (°)" } },
          track: function (s) { return s.p.f < 90 ? "pos" : s.p.f === 90 ? "zero" : "neg"; },
          draw: function (s) { var v = CS(3, s.p.f); return [{ seg: [[-4.2, 0], [5.6, 0]], c: "soft" }, { arrow: [[0, 0], [4, 0]], c: "blue" }, { arrow: [[0, 0], v], c: "orange" }, { turn: [[0, 0], 0.9, 0, s.p.f], c: "green" }]; },
          readout: function (s) { var d = 12 * COS(s.p.f * DEG); return "$\\vec{u}\\cdot\\vec{v} = 4 \\cdot 3\\cos " + s.p.f + "^\\circ = " + nm(f4(d, 2)) + "$<br>Positive: " + (s.tracked.pos ? "✓" : "—") + " · zero: " + (s.tracked.zero ? "✓" : "—") + " · negative: " + (s.tracked.neg ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.pos && s.tracked.zero && s.tracked.neg); } },
        gate: true, then: "The dot product is $|\\vec{u}||\\vec{v}|\\cos\\varphi$: **positive** when the arrows point roughly the same way (angle under $90^\\circ$), **zero** at exactly $90^\\circ$ (perpendicular) and **negative** when they point roughly opposite ways. And it is also $ac + bd$ from the components." },
      { type: "learn", kicker: "The idea",
        prompt: "For $\\vec{u} = \\langle a, b\\rangle$ and $\\vec{v} = \\langle c, d\\rangle$: $\\vec{u}\\cdot\\vec{v} = ac + bd = |\\vec{u}||\\vec{v}|\\cos\\theta$. So $\\cos\\theta = \\dfrac{\\vec{u}\\cdot\\vec{v}}{|\\vec{u}||\\vec{v}|}$. A dot product of $0$ means the vectors are **perpendicular**.",
        scene: { type: "method", how: HOW_20 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the angle between $\\vec{u} = \\langle 3, 4\\rangle$ and $\\vec{v} = \\langle 5, -2\\rangle$.",
        scene: { type: "walk", how: HOW_20, rows: [
          { step: 1, m: "(3)(5) \\ \\text{and} \\ (4)(-2)", say: "Multiply the matching components." },
          { step: 2, m: "\\vec{u}\\cdot\\vec{v} = 15 - 8 = 7", say: "Add: a single number.", ask: { prompt: "A dot product is…", answer: 0, options: [{ t: "a number" }, { t: "a vector", fb: "It combines two vectors into one **number**." }] } },
          { step: 3, m: "|\\vec{u}| = 5, \\ |\\vec{v}| = \\sqrt{29}", say: "The two lengths." },
          { step: 3, m: "\\cos\\theta = \\frac{7}{5\\sqrt{29}} \\approx 0.260", say: "Divide the dot product by the product of the lengths." },
          { step: 3, m: "\\theta \\approx 74.93^\\circ", say: "The inverse cosine." }] },
        gate: true, then: "The angle between them is about $74.93^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide whether $\\vec{u} = \\langle 2, -1\\rangle$ and $\\vec{v} = \\langle 3, 6\\rangle$ are perpendicular.",
        how: HOW_20, skill: "Dot product",
        steps: [
          { step: 1, ask: "The products of matching components are $(2)(3)$ and $(-1)(6)$. The first is", type: "num", pre: "$=$", answer: 6, near: [{ v: 5, fb: "Multiply, do not add: $2 \\times 3$." }], hint: "$2 \\times 3$.", m: "(2)(3) = 6, \\ (-1)(6) = -6", say: "Two products." },
          { step: 2, ask: "$\\vec{u}\\cdot\\vec{v} = 6 + (-6) =$", type: "num", pre: "$=$", answer: 0, near: [{ v: 12, fb: "The second product is $-6$: $6 - 6$." }], hint: "$6 - 6$.", m: "\\vec{u}\\cdot\\vec{v} = 0", say: "Zero!" },
          { step: 3, ask: "A dot product of zero means the angle between them is", type: "num", pre: "$\\theta =$", post: "degrees", answer: 90, near: [{ v: 0, fb: "An angle of $0^\\circ$ means the arrows point the **same** way: then $\\cos\\theta = 1$, not 0." }], hint: "$\\cos\\theta = 0$.", m: "\\theta = 90^\\circ", say: "Perpendicular." }],
        why: "Multiply, add, use it." },
      { type: "num", kicker: "On your own", prompt: "Find $\\langle 4, -3\\rangle\\cdot\\langle 2, 5\\rangle$.", pre: "$=$", answer: -7, skill: "Dot product", near: [{ v: 23, fb: "$(-3)(5) = -15$: keep the sign." }, { v: 1, fb: "That multiplied the wrong pairs. Multiply matching components: $4 \\cdot 2$ and $(-3)\\cdot 5$." }], hints: ["$8 + (-15)$."], why: "$8 - 15 = -7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Find a missing component.** For what value of $k$ is $\\langle k, 3\\rangle$ perpendicular to $\\langle 4, -2\\rangle$?",
        scene: { type: "walk", how: HOW_20, rows: [
          { step: 1, m: "(k)(4) \\ \\text{and} \\ (3)(-2)", say: "Matching components." },
          { step: 2, m: "4k - 6", say: "The dot product." },
          { step: 3, m: "4k - 6 = 0", say: "Perpendicular means the dot product is **zero**.", ask: { prompt: "So $k =$", answer: 0, options: [{ t: "$\\frac{6}{4} = 1.5$" }, { t: "$\\frac{4}{6}$", fb: "Add 6 to both sides, then divide by 4: $k = \\frac{6}{4}$." }] } },
          { step: 3, m: "k = 1.5", say: "Check: $\\langle 1.5, 3\\rangle\\cdot\\langle 4, -2\\rangle = 6 - 6 = 0$." }] },
        gate: true, then: "$k = 1.5$." },
      { type: "num", kicker: "Try it", prompt: "Find the angle between $\\langle 2, 1\\rangle$ and $\\langle 1, 3\\rangle$, in degrees. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$\\theta =$", post: "degrees", answer: 45, tol: 0.006, calc: true, skill: "Angle between vectors",
        near: [{ v: 0.7071, tol: 0.0006, fb: "That is the **cosine**. Take the inverse cosine to get the angle." }], hints: ["$\\vec{u}\\cdot\\vec{v} = 5$, $|\\vec{u}| = \\sqrt{5}$, $|\\vec{v}| = \\sqrt{10}$."], why: "$\\cos\\theta = \\frac{5}{\\sqrt{50}} \\approx 0.7071$, so $\\theta = 45^\\circ$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ann says $\\langle 1, 2\\rangle\\cdot\\langle 3, 4\\rangle = \\langle 3, 8\\rangle$. What is wrong?",
        options: [{ t: "A dot product is a **number**: add the products, $3 + 8 = 11$" }, { t: "Nothing is wrong.", fb: "Multiplying matching components is right, but the dot product then **adds** them into one number." }, { t: "The answer should be $\\langle 4, 6\\rangle$", fb: "That is the **sum** of the vectors, not the dot product." }],
        answer: 0, skill: "Dot product", hints: ["Does a dot product give a vector?"], why: "$1 \\cdot 3 + 2 \\cdot 4 = 11$." },
      { type: "num", kicker: "Use it", prompt: "**Work** is the dot product of the force and the displacement. A force of $\\langle 20, 30\\rangle$ N moves a box $\\langle 5, 0\\rangle$ m. How much work is done, in joules?", pre: "work =", post: "J", answer: 100, skill: "Dot product", near: [{ v: 150, fb: "Only the part of the force **along** the move counts: $20 \\cdot 5 + 30 \\cdot 0$. The upward 30 N does no work on a sideways move." }], hints: ["$(20)(5) + (30)(0)$."], why: "$100 + 0 = 100$ J." }
    ]
  });
  /* ================================================================ Skills */
  var GENX = " (The box accepts expressions such as 3*sin(20°).)";
  var TRIP8 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [6, 8, 10], [9, 12, 15]];
  var RD8 = function (v) { return Math.round(v * 1e9) / 1e9; };
  var d2 = function (v) { return Math.round(v * 100) / 100; };
  var S8 = function (d) { return Math.sin(d * DEG); }, C8 = function (d) { return Math.cos(d * DEG); };
  var norm360 = function (d) { return ((d % 360) + 360) % 360; };
  var SPEC8 = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
  var NTH8 = ["", "", "square", "cube", "fourth", "fifth", "sixth", "seventh", "eighth"];
  // How many triangles have angle A, the side a opposite it and the side b?
  var cntSSA = function (A, a, b) {
    var sb = b * S8(A) / a;
    if (sb > 1 + 1e-9) return 0;
    var B1 = Math.asin(Math.min(1, sb)) / DEG, n = 0;
    if (A + B1 < 180 - 1e-9) n++;
    if (Math.abs(sb - 1) > 1e-9 && A + (180 - B1) < 180 - 1e-9) n++;
    return n;
  };
  var SKILLS = [
    { id: "pc8-sines", title: "The Law of Sines", lesson: 2,
      gen: function (R) {
        var A = R.int(25, 90), B = R.int(25, Math.min(100, 158 - A)), C = 180 - A - B, ang = { A: A, B: B, C: C }, L = ["A", "B", "C"], g = R.pick(L), q = R.pick(L.filter(function (x) { return x !== g; })), n = R.int(6, 30);
        var shown = R.shuffle(L).slice(0, 2).sort(), z = L.filter(function (x) { return x !== g && x !== q; })[0];
        var sideOf = function (G, Q) { return n * S8(ang[Q]) / S8(ang[G]); };
        var ans = sideOf(g, q), inv = n * S8(ang[g]) / S8(ang[q]), other = sideOf(g, z);
        return { type: "num", prompt: "In triangle $ABC$, $" + shown[0] + " = " + ang[shown[0]] + "^\\circ$, $" + shown[1] + " = " + ang[shown[1]] + "^\\circ$ and $" + g.toLowerCase() + " = " + n + "$. Find $" + q.toLowerCase() + "$ to 2 decimal places." + GENX, pre: "$" + q.toLowerCase() + " \\approx$", answer: RD8(ans), tol: 0.006, calc: true,
          near: near(RD8(ans), [{ v: RD8(inv), tol: 0.006, fb: "The sines are upside down: $" + q.toLowerCase() + "$ goes with $\\sin " + q + "$ on **top**." }, { v: RD8(other), tol: 0.006, fb: "That is the side $" + z.toLowerCase() + "$. We want $" + q.toLowerCase() + "$, opposite $" + q + " = " + ang[q] + "^\\circ$." }]),
          hints: ["Find the third angle first, then $\\frac{" + q.toLowerCase() + "}{\\sin " + q + "} = \\frac{" + n + "}{\\sin " + g + "}$."], why: "$" + q.toLowerCase() + " = \\frac{" + n + "\\sin " + ang[q] + "^\\circ}{\\sin " + ang[g] + "^\\circ} \\approx " + nm(d2(ans)) + "$." };
      } },
    { id: "pc8-ssa", title: "The ambiguous case", lesson: 3,
      gen: function (R) {
        var t = R.int(0, 5), A, a, b, h;
        if (t === 5) {   // the larger of the two possible angles B
          A = R.int(25, 65); b = R.int(18, 26); h = b * S8(A); a = R.int(Math.ceil(h + 0.6), b - 1);
          var sb = b * S8(A) / a, B1 = Math.asin(sb) / DEG, B2 = 180 - B1;
          return { type: "num", prompt: "$A = " + A + "^\\circ$, $a = " + a + "$ and $b = " + b + "$ give two triangles. What is the **larger** possible angle $B$, in degrees to 1 decimal place?" + GENX, pre: "$B \\approx$", post: "degrees", answer: RD8(f4(B2, 1)), tol: 0.06, calc: true,
            near: near(RD8(f4(B2, 1)), [{ v: RD8(f4(B1, 1)), tol: 0.06, fb: "That is the **smaller** angle, from the calculator. The larger is $180^\\circ$ minus it." }]), hints: ["$\\sin B = \\frac{b\\sin A}{a}$; the other angle is $180^\\circ - B$."], why: "$B \\approx " + f4(B1, 1) + "^\\circ$ or $" + f4(B2, 1) + "^\\circ$." };
        }
        if (t === 0) { A = R.int(25, 70); b = R.int(10, 22); a = R.int(2, Math.max(2, Math.floor(b * S8(A) - 0.6))); }
        else if (t === 1 || t === 2) { A = R.int(25, 65); b = R.int(18, 26); a = R.int(Math.ceil(b * S8(A) + 0.6), b - 1); }
        else if (t === 3) { A = R.int(25, 75); b = R.int(8, 20); a = R.int(b, b + 8); }
        else { A = R.int(100, 150); b = R.int(6, 18); a = R.pick([R.int(2, b), R.int(b + 1, b + 8)]); }
        var n = cntSSA(A, a, b);
        return { type: "num", prompt: "How many triangles have $A = " + A + "^\\circ$, $a = " + a + "$ and $b = " + b + "$?", pre: "triangles =", answer: n,
          near: near(n, [{ v: 2, fb: "Check **both** $B$ and $180^\\circ - B$: keep each only if its angles add to less than $180^\\circ$." }, { v: 1, fb: "Look at $\\sin B = \\frac{b\\sin A}{a}$, and then at $180^\\circ - B$ too." }, { v: 0, fb: "$\\sin B = \\frac{b\\sin A}{a}$ is not above 1 here: at least one triangle exists." }]),
          hints: ["$\\sin B = \\frac{b\\sin A}{a}$, then try $B$ and $180^\\circ - B$."], why: "$\\sin B = " + nm(f4(b * S8(A) / a, 3)) + "$: " + n + " triangle" + (n === 1 ? "" : "s") + "." };
      } },
    { id: "pc8-area", title: "The area of a triangle", lesson: 4,
      gen: function (R) {
        var a = R.int(5, 20), b = R.int(5, 20), C = 5 * R.int(4, 32), ans = 0.5 * a * b * S8(C);
        return { type: "num", prompt: "A triangle has sides $" + a + "$ and $" + b + "$ with an angle of $" + C + "^\\circ$ between them. Find its area to 2 decimal places." + GENX, pre: "area $\\approx$", answer: RD8(ans), tol: 0.006, calc: true,
          near: near(RD8(ans), [{ v: RD8(a * b * S8(C)), tol: 0.006, fb: "That is double: area $= \\frac{1}{2}ab\\sin C$." }, { v: RD8(0.5 * a * b * C8(C)), tol: 0.006, fb: "That used the cosine. Area uses the **sine** of the angle between the sides." }]),
          hints: ["$\\frac{1}{2}ab\\sin C$."], why: "$\\frac{1}{2}(" + a + ")(" + b + ")\\sin " + C + "^\\circ \\approx " + nm(d2(ans)) + "$." };
      } },
    { id: "pc8-cosines", title: "The Law of Cosines", lesson: 5,
      gen: function (R) {
        if (R.chance(0.5)) {
          var a = R.int(4, 15), b = R.int(4, 15), C = 5 * R.int(4, 28), c2 = a * a + b * b - 2 * a * b * C8(C), c = Math.sqrt(c2);
          return { type: "num", prompt: "Two sides of a triangle are $" + a + "$ and $" + b + "$, with $" + C + "^\\circ$ between them. Find the third side to 2 decimal places." + GENX, pre: "$c \\approx$", answer: RD8(c), tol: 0.006, calc: true,
            near: near(RD8(c), [{ v: RD8(Math.sqrt(a * a + b * b + 2 * a * b * C8(C))), tol: 0.006, fb: "The sign: it is $-2ab\\cos C$." }, { v: RD8(c2), tol: 0.006, fb: "That is $c^2$. Take the square root." }]),
            hints: ["$c^2 = a^2 + b^2 - 2ab\\cos C$."], why: "$c^2 \\approx " + nm(d2(c2)) + "$, so $c \\approx " + nm(d2(c)) + "$." };
        }
        var s1 = R.int(4, 14), s2 = R.int(4, 14), s3 = R.int(Math.abs(s1 - s2) + 2, s1 + s2 - 2), cs = (s1 * s1 + s2 * s2 - s3 * s3) / (2 * s1 * s2), ang = Math.acos(cs) / DEG;
        return { type: "num", prompt: "A triangle has sides $" + s1 + "$, $" + s2 + "$ and $" + s3 + "$. Find the angle opposite the side $" + s3 + "$, in degrees to 2 decimal places." + GENX, pre: "angle $\\approx$", post: "degrees", answer: RD8(ang), tol: 0.006, calc: true,
          near: near(RD8(ang), [{ v: RD8(cs), tol: 0.006, fb: "That is the **cosine**. Take the inverse cosine to get the angle." }]),
          hints: ["$\\cos C = \\frac{a^2 + b^2 - c^2}{2ab}$, with $c$ the side opposite the angle."], why: "$\\cos C = " + nm(f4(cs, 4)) + "$, so $C \\approx " + nm(d2(ang)) + "^\\circ$." };
      } },
    { id: "pc8-heron", title: "Heron's formula, and which law", lesson: 6,
      gen: function (R) {
        if (R.chance(0.6)) {
          var a = R.int(4, 20), b = R.int(4, 20), c = R.int(Math.abs(a - b) + 2, a + b - 2), s = (a + b + c) / 2, ar = Math.sqrt(s * (s - a) * (s - b) * (s - c));
          return { type: "num", prompt: "Find the area of a triangle with sides $" + a + "$, $" + b + "$ and $" + c + "$, to 2 decimal places." + GENX, pre: "area $\\approx$", answer: RD8(ar), tol: 0.006, calc: true,
            near: near(RD8(ar), [{ v: s, fb: "That is $s$, the semi-perimeter, not the area." }, { v: RD8(Math.sqrt(a + b + c)), tol: 0.006, fb: "Use $s = \\frac{a + b + c}{2}$ and then $\\sqrt{s(s - a)(s - b)(s - c)}$." }]),
            hints: ["$s = \\frac{a + b + c}{2}$."], why: "$s = " + nm(s) + "$, area $= \\sqrt{" + nm(s) + "(" + nm(s - a) + ")(" + nm(s - b) + ")(" + nm(s - c) + ")} \\approx " + nm(d2(ar)) + "$." };
        }
        var K = [["two angles and a side", "The Law of Sines", "Two angles give a side-and-opposite-angle pair, then Sines."], ["two sides and the angle between them", "The Law of Cosines", "SAS: the third side from the Law of Cosines."], ["all three sides", "The Law of Cosines", "SSS: an angle from the Law of Cosines."], ["two sides and an angle opposite one of them", "The Law of Sines", "SSA: Law of Sines (and watch for two triangles)."]], k = R.pick(K);
        var opts = ["The Law of Sines", "The Law of Cosines"], other = opts.filter(function (o) { return o !== k[1]; })[0];
        return mc(R, { prompt: "You know " + k[0] + " of a triangle. Which do you use **first** to solve it?", right: k[1], wrong: [{ t: other, fb: k[2] }, { t: "The Pythagorean theorem", fb: "Pythagoras needs a **right** angle. Use a law that works for any triangle: " + k[1] + "." }], keep: true, hints: ["Is there a side and the angle opposite it?"], why: k[2] });
      } },
    { id: "pc8-polpt", title: "Names for a polar point", lesson: 7,
      gen: function (R) {
        var t = R.int(0, 2), r = R.int(2, 9);
        if (t === 0) { var th = 5 * R.int(1, 35); return { type: "num", prompt: "The point $(-" + r + ", " + th + "^\\circ)$ can be written $(" + r + ", \\theta)$ with $0^\\circ \\le \\theta < 360^\\circ$. What is $\\theta$?", pre: "$\\theta =$", post: "degrees", answer: norm360(th + 180), near: near(norm360(th + 180), [{ v: th, fb: "A negative $r$ goes **backwards**: add $180^\\circ$ to the direction." }, { v: norm360(th - 90), fb: "Backwards is a half turn: $180^\\circ$, not $90^\\circ$." }]), hints: ["Add $180^\\circ$."], why: "$" + th + " + 180 = " + (th + 180) + "$, reduced to $" + norm360(th + 180) + "^\\circ$." }; }
        if (t === 1) { var ph = 5 * R.int(2, 34); return { type: "num", prompt: "The point $(" + r + ", -" + ph + "^\\circ)$ can be written $(" + r + ", \\theta)$ with $0^\\circ \\le \\theta < 360^\\circ$. What is $\\theta$?", pre: "$\\theta =$", post: "degrees", answer: norm360(-ph), near: near(norm360(-ph), [{ v: ph, fb: "A negative angle turns **clockwise**: that is a different direction." }]), hints: ["Add $360^\\circ$ to the negative angle."], why: "$-" + ph + " + 360 = " + norm360(-ph) + "$." }; }
        var th2 = 5 * R.int(1, 17);
        return mc(R, { prompt: "Which polar point is the same as $(" + r + ", " + th2 + "^\\circ)$?", right: "$(-" + r + ", " + (th2 + 180) + "^\\circ)$", wrong: [{ t: "$(-" + r + ", " + th2 + "^\\circ)$", fb: "A negative $r$ with the **same** angle is the opposite point." }, { t: "$(" + r + ", " + (th2 + 180) + "^\\circ)$", fb: "A positive $r$ along $" + (th2 + 180) + "^\\circ$ is the opposite point." }, { t: "$(" + r + ", -" + th2 + "^\\circ)$", fb: "$-" + th2 + "^\\circ$ turns clockwise: a different point." }], keep: true, hints: ["A negative $r$ goes with the direction plus $180^\\circ$."], why: "$(-r, \\theta + 180^\\circ)$." });
      } },
    { id: "pc8-conv", title: "Polar and rectangular points", lesson: 8,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t <= 1) {
          var r = R.int(2, 12), th = R.pick(SPEC8), ans = t === 0 ? r * C8(th) : r * S8(th), wrong = t === 0 ? r * S8(th) : r * C8(th);
          return { type: "num", prompt: "Convert the polar point $(" + r + ", " + th + "^\\circ)$ to rectangular coordinates. What is $" + (t === 0 ? "x" : "y") + "$, to 2 decimal places?" + GENX, pre: "$" + (t === 0 ? "x" : "y") + " \\approx$", answer: RD8(ans), tol: 0.006, calc: true,
            near: near(RD8(ans), [{ v: RD8(wrong), tol: 0.006, fb: "That is the other coordinate: $x = r\\cos\\theta$ and $y = r\\sin\\theta$." }]), hints: [t === 0 ? "$x = r\\cos\\theta$." : "$y = r\\sin\\theta$."], why: (t === 0 ? "$x = " + r + "\\cos " + th + "^\\circ" : "$y = " + r + "\\sin " + th + "^\\circ") + " \\approx " + nm(d2(ans)) + "$." };
        }
        var T = R.pick(TRIP8), sx = R.pick([-1, 1]), sy = R.pick([-1, 1]), sw = R.chance(0.5), x = sx * (sw ? T[0] : T[1]), y = sy * (sw ? T[1] : T[0]);
        if (t === 2) return { type: "num", prompt: "Find $r$ for the point $(" + x + ", " + y + ")$ in polar form.", pre: "$r =$", answer: T[2], near: near(T[2], [{ v: Math.abs(x) + Math.abs(y), fb: "Add the **squares** and take the root: $\\sqrt{x^2 + y^2}$." }, { v: T[2] * T[2], fb: "That is $r^2$: take the square root." }]), hints: ["$\\sqrt{x^2 + y^2}$."], why: "$\\sqrt{" + x * x + " + " + y * y + "} = " + T[2] + "$." };
        var th2 = norm360(Math.atan2(y, x) / DEG), cal = Math.atan(y / x) / DEG;
        return { type: "num", prompt: "Find the angle $\\theta$ (from $0^\\circ$ up to $360^\\circ$) for the point $(" + x + ", " + y + ")$, to 2 decimal places." + GENX, pre: "$\\theta \\approx$", post: "degrees", answer: RD8(th2), tol: 0.006, calc: true,
          near: near(RD8(th2), [{ v: RD8(cal), tol: 0.006, fb: "That is the calculator's $\\arctan\\frac{y}{x}$. Check the quadrant of the point: " + (x < 0 ? "add $180^\\circ$" : "add $360^\\circ$ to a negative result") + "." }]), hints: ["$\\arctan\\frac{y}{x}$, then the quadrant."], why: "The point is in the " + (x > 0 && y > 0 ? "first" : x < 0 && y > 0 ? "second" : x < 0 ? "third" : "fourth") + " quadrant: $\\theta \\approx " + nm(d2(th2)) + "^\\circ$." };
      } },
    { id: "pc8-poleq", title: "Polar and rectangular equations", lesson: 9,
      gen: function (R) {
        var k = R.int(2, 9), m = R.pick([1, 2, 3, -1, -2, -3]), t = R.int(0, 6);
        if (t === 0) return mc(R, { prompt: "Write $r = " + k + "\\cos\\theta$ as a rectangular equation.", right: "$x^2 + y^2 = " + k + "x$", wrong: [{ t: "$x^2 + y^2 = " + k + "y$", fb: "$r\\cos\\theta = x$ (not $y$)." }, { t: "$x^2 + y^2 = " + k + "$", fb: "Multiply by $r$ first: $r^2 = " + k + "r\\cos\\theta$." }, { t: "$x + y = " + k + "$", fb: "$r$ is $\\sqrt{x^2 + y^2}$, not $x + y$: use $r^2 = x^2 + y^2$." }], keep: true, hints: ["Multiply both sides by $r$."], why: "$r^2 = " + k + "r\\cos\\theta$, so $x^2 + y^2 = " + k + "x$." });
        if (t === 1) return mc(R, { prompt: "Write $r = " + k + "\\sin\\theta$ as a rectangular equation.", right: "$x^2 + y^2 = " + k + "y$", wrong: [{ t: "$x^2 + y^2 = " + k + "x$", fb: "$r\\sin\\theta = y$ (not $x$)." }, { t: "$y = " + k + "$", fb: "That would be $r\\sin\\theta = " + k + "$. Here $r$ is on its own: multiply by $r$." }, { t: "$x^2 + y^2 = " + k * k + "$", fb: "$r = " + k + "\\sin\\theta$ is not a constant radius." }], keep: true, hints: ["Multiply both sides by $r$."], why: "$r^2 = " + k + "r\\sin\\theta$, so $x^2 + y^2 = " + k + "y$." });
        if (t === 2) return mc(R, { prompt: "Write $r = " + k + "$ as a rectangular equation.", right: "$x^2 + y^2 = " + k * k + "$", wrong: [{ t: "$x^2 + y^2 = " + k + "$", fb: "Square both sides: $r^2 = " + k * k + "$." }, { t: "$x + y = " + k + "$", fb: "$r$ is the distance $\\sqrt{x^2 + y^2}$, not $x + y$." }, { t: "$y = " + k + "x$", fb: "That is a line. $r = " + k + "$ is a circle." }], keep: true, hints: ["Square both sides."], why: "$r^2 = x^2 + y^2 = " + k * k + "$." });
        if (t === 3) { var xk = R.chance(0.5); return mc(R, { prompt: "Write $" + (xk ? "x" : "y") + " = " + k + "$ in polar form.", right: "$r\\" + (xk ? "cos" : "sin") + "\\theta = " + k + "$", wrong: [{ t: "$r\\" + (xk ? "sin" : "cos") + "\\theta = " + k + "$", fb: "$x = r\\cos\\theta$ and $y = r\\sin\\theta$." }, { t: "$r = " + k + "$", fb: "That is a circle of radius " + k + "." }, { t: "$\\theta = " + k + "$", fb: "That is a line through the origin." }], keep: true, hints: ["$x = r\\cos\\theta$, $y = r\\sin\\theta$."], why: "Replace " + (xk ? "$x$ by $r\\cos\\theta$" : "$y$ by $r\\sin\\theta$") + "." }); }
        if (t === 4) return mc(R, { prompt: "Write $y = " + (m === 1 ? "" : m === -1 ? "-" : m) + "x$ in polar form, for $\\theta$ between $-90^\\circ$ and $90^\\circ$.", right: "$\\theta = \\arctan(" + m + ")$", wrong: [{ t: "$r = " + m + "$", fb: "$y = mx$ is a line through the origin; $r = m$ is a circle." }, { t: "$\\theta = " + m + "$", fb: "The slope is $\\tan\\theta$: $\\theta = \\arctan m$." }, { t: "$r = \\arctan(" + m + ")$", fb: "$r$ is a distance; the slope fixes the **angle**." }], keep: true, hints: ["The slope is $\\tan\\theta$."], why: "$\\tan\\theta = \\frac{y}{x} = " + m + "$." });
        if (t === 5) return mc(R, { prompt: "Write $x^2 + y^2 = " + k * k + "$ in polar form.", right: "$r = " + k + "$", wrong: [{ t: "$r = " + k * k + "$", fb: "$r^2 = " + k * k + "$, so $r = " + k + "$." }, { t: "$r^2 = " + k + "$", fb: "$x^2 + y^2 = r^2 = " + k * k + "$." }, { t: "$r\\cos\\theta = " + k + "$", fb: "That is the line $x = " + k + "$." }], keep: true, hints: ["$x^2 + y^2 = r^2$."], why: "$r^2 = " + k * k + "$." });
        return mc(R, { prompt: "Which rectangular equation is $r\\cos\\theta = " + k + "$?", right: "$x = " + k + "$", wrong: [{ t: "$y = " + k + "$", fb: "$r\\sin\\theta = y$; $r\\cos\\theta = x$." }, { t: "$x^2 + y^2 = " + k + "$", fb: "That has $r^2$." }, { t: "$x = " + k + "y$", fb: "The $r$ is part of $r\\cos\\theta$, which is just $x$." }], keep: true, hints: ["$r\\cos\\theta = x$."], why: "$x = " + k + "$." });
      } },
    { id: "pc8-polval", title: "Values and symmetry of polar graphs", lesson: 10,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 0) {
          var a = R.int(1, 6), b = R.int(1, 6), fn = R.pick(["cos", "sin"]), sg = R.pick([1, -1]), th = R.pick([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300, 330]), F = fn === "cos" ? C8 : S8, ans = a + sg * b * F(th);
          return { type: "num", prompt: "For $r = " + a + (sg > 0 ? " + " : " - ") + (b === 1 ? "" : b) + "\\" + fn + "\\theta$, find $r$ when $\\theta = " + th + "^\\circ$, to 2 decimal places." + GENX, pre: "$r \\approx$", answer: RD8(ans), tol: 0.006, calc: true,
            near: near(RD8(ans), [{ v: RD8(a - sg * b * F(th)), tol: 0.006, fb: "Check the sign in front of the trigonometric term." }, { v: RD8(a + sg * b * (fn === "cos" ? S8(th) : C8(th))), tol: 0.006, fb: "Use the $" + fn + "$, not the other function." }]), hints: ["Substitute $\\theta$ and work out the " + fn + " first."], why: "$" + nm(d2(ans)) + "$." };
        }
        if (t === 1) {
          var n = R.int(2, 7), f2 = R.pick(["sin", "cos"]), a2 = R.int(2, 8);
          return { type: "num", prompt: "How many angles $\\theta$ from $0^\\circ$ up to (not including) $360^\\circ$ make $r = " + a2 + "\\" + f2 + " " + n + "\\theta$ equal to $0$?", pre: "angles =", answer: 2 * n, near: near(2 * n, [{ v: n, fb: "The wave $\\" + f2 + " " + n + "\\theta$ makes " + n + " cycles in a full turn, and each cycle crosses zero **twice**." }, { v: 2, fb: "That is for $\\" + f2 + "\\theta$. The $" + n + "$ multiplies the number of zeros." }]), hints: ["$\\" + f2 + " " + n + "\\theta$ makes $" + n + "$ cycles in $360^\\circ$."], why: "$2n = " + 2 * n + "$." };
        }
        var a3 = R.int(2, 7), b3 = R.int(1, 7), fn3 = R.pick(["cos", "sin"]), sg3 = R.pick(["+", "-"]), right = fn3 === "cos" ? "the polar axis ($x$-axis)" : "the vertical axis ($y$-axis)", wrongs = [fn3 === "cos" ? "the vertical axis ($y$-axis)" : "the polar axis ($x$-axis)", "the pole only (the origin)"];
        return mc(R, { prompt: "The graph of $r = " + a3 + " " + sg3 + " " + (b3 === 1 ? "" : b3) + "\\" + fn3 + "\\theta$ is symmetric about…", right: right, wrong: wrongs.map(function (w, i) { return { t: w, fb: i === 0 ? (fn3 === "cos" ? "That is the symmetry of **sine** equations." : "That is the symmetry of **cosine** equations.") : "A limaçon of this kind has a whole line of symmetry." }; }), keep: true, hints: ["Replace $\\theta$ by $-\\theta$: cosine is even, sine is odd."], why: (fn3 === "cos" ? "Cosine is even: $\\cos(-\\theta) = \\cos\\theta$." : "Sine equations are unchanged by $\\theta \\to \\pi - \\theta$.") });
      } },
    { id: "pc8-limacon", title: "Circles, cardioids and limaçons", lesson: 11,
      gen: function (R) {
        var t = R.int(0, 1), fn = R.pick(["cos", "sin"]), sg = R.pick(["+", "-"]), a, b;
        if (t === 0) {
          var kind = R.pick(["circle", "cardioid", "loop", "dimple", "convex"]);
          if (kind === "circle") { a = R.int(2, 9); return mc(R, { prompt: "What kind of curve is $r = " + a + "\\" + fn + "\\theta$?", right: "A circle", wrong: [{ t: "A cardioid", fb: "A cardioid has the form $r = a \\pm a\\cos\\theta$: a constant too." }, { t: "A limaçon with an inner loop", fb: "A limaçon needs a constant term $a$ and a trigonometric term." }, { t: "A rose", fb: "Roses have a multiple angle, like $\\cos 3\\theta$." }], keep: true, hints: ["No constant term."], why: "A circle of diameter $" + a + "$." }); }
          if (kind === "cardioid") { a = R.int(2, 8); b = a; } else if (kind === "loop") { b = R.int(3, 9); a = R.int(1, b - 1); } else if (kind === "dimple") { b = R.int(2, 6); a = R.int(b + 1, 2 * b - 1); } else { b = R.int(1, 4); a = R.int(2 * b, 2 * b + 5); }
          var K = { cardioid: "A cardioid", loop: "A limaçon with an inner loop", dimple: "A limaçon with a dimple", convex: "A convex limaçon (no dimple)" };
          var wrong = Object.keys(K).filter(function (x) { return x !== kind; }).map(function (x) { return { t: K[x], fb: "Compare $a = " + a + "$ with $b = " + b + "$: " + (a === b ? "$a = b$ is a cardioid" : a < b ? "$a < b$ gives an inner loop" : a < 2 * b ? "$b < a < 2b$ gives a dimple" : "$a \\ge 2b$ is convex") + "." }; });
          return mc(R, { prompt: "What kind of curve is $r = " + a + " " + sg + " " + b + "\\" + fn + "\\theta$?", right: K[kind], wrong: wrong, keep: true, hints: ["Compare $a$ with $b$."], why: "$a = " + a + "$, $b = " + b + "$: " + K[kind].toLowerCase() + "." });
        }
        a = R.int(1, 8); b = R.int(1, 8);
        return { type: "num", prompt: "What is the largest value of $|r|$ on the curve $r = " + a + " " + sg + " " + b + "\\" + fn + "\\theta$?", pre: "largest $|r| =$", answer: a + b, near: near(a + b, [{ v: Math.abs(a - b), fb: "That is the smallest value of $r$. The largest $|r|$ is $a + b$, where the trigonometric term is $\\pm 1$." }, { v: Math.max(a, b), fb: "The extreme is $a$ **plus** $b$ (with the trigonometric term at $\\pm 1$)." }]), hints: ["The trigonometric term reaches $\\pm 1$."], why: "$" + a + " + " + b + " = " + (a + b) + "$." };
      } },
    { id: "pc8-rose", title: "Roses", lesson: 12,
      gen: function (R) {
        var fn = R.pick(["cos", "sin"]);
        if (R.chance(0.6)) { var n = R.int(2, 9), a = R.int(2, 9), p = n % 2 ? n : 2 * n; return { type: "num", prompt: "How many petals does the rose $r = " + a + "\\" + fn + " " + n + "\\theta$ have?", pre: "petals =", answer: p, near: near(p, [{ v: n % 2 ? 2 * n : n, fb: n % 2 ? "$n = " + n + "$ is **odd**: there are $n$ petals." : "$n = " + n + "$ is **even**: there are $2n$ petals." }, { v: a, fb: "$" + a + "$ is the petal **length**, not how many." }]), hints: ["Odd $n$: $n$ petals; even $n$: $2n$."], why: p + " petals." }; }
        var pet = R.pick([3, 5, 7, 9, 4, 8, 12, 16]), nn = pet % 2 ? pet : pet / 2;
        return { type: "num", prompt: "A rose $r = 6\\" + fn + " n\\theta$ has " + pet + " petals. What whole number $n$ gives this?", pre: "$n =$", answer: nn, near: near(nn, [{ v: pet % 2 ? pet / 2 : pet, fb: pet % 2 ? "Odd $n$ gives exactly $n$ petals." : "An even $n$ gives $2n$ petals: halve " + pet + "." }]), hints: ["Odd $n$: $n$ petals; even $n$: $2n$."], why: "$n = " + nn + "$." };
      } },
    { id: "pc8-cpolar", title: "Polar form of a complex number", lesson: 13,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 2) { var r = R.int(2, 10), th = R.pick(SPEC8), pt = R.chance(0.5), ans = pt ? r * C8(th) : r * S8(th); return { type: "num", prompt: "Write $z = " + r + "(\\cos " + th + "^\\circ + i\\sin " + th + "^\\circ)$ as $a + bi$. What is " + (pt ? "$a$" : "$b$") + ", to 2 decimal places?" + GENX, pre: (pt ? "$a$" : "$b$") + " $\\approx$", answer: RD8(ans), tol: 0.006, calc: true, near: near(RD8(ans), [{ v: RD8(pt ? r * S8(th) : r * C8(th)), tol: 0.006, fb: "That is the other part: $a = r\\cos\\theta$ (real), $b = r\\sin\\theta$ (imaginary)." }]), hints: [pt ? "$r\\cos\\theta$." : "$r\\sin\\theta$."], why: "$" + nm(d2(ans)) + "$." }; }
        var T = R.pick(TRIP8), sx = R.pick([-1, 1]), sy = R.pick([-1, 1]), sw = R.chance(0.5), a = sx * (sw ? T[0] : T[1]), b = sy * (sw ? T[1] : T[0]);
        if (t === 0) return { type: "num", prompt: "Find the modulus $|" + a + (b < 0 ? " - " : " + ") + Math.abs(b) + "i|$.", pre: "$r =$", answer: T[2], near: near(T[2], [{ v: Math.abs(a) + Math.abs(b), fb: "Add the **squares** and take the root: $\\sqrt{a^2 + b^2}$." }, { v: T[2] * T[2], fb: "That is $r^2$. Take the square root." }]), hints: ["$\\sqrt{a^2 + b^2}$."], why: "$\\sqrt{" + a * a + " + " + b * b + "} = " + T[2] + "$." };
        var th2 = norm360(Math.atan2(b, a) / DEG), cal = Math.atan(b / a) / DEG;
        return { type: "num", prompt: "Find the argument $\\theta$ of $z = " + a + (b < 0 ? " - " : " + ") + Math.abs(b) + "i$, from $0^\\circ$ up to $360^\\circ$, to 2 decimal places." + GENX, pre: "$\\theta \\approx$", post: "degrees", answer: RD8(th2), tol: 0.006, calc: true, near: near(RD8(th2), [{ v: RD8(cal), tol: 0.006, fb: "That is the calculator's angle: check the quadrant of $z$ and adjust." }]), hints: ["$\\arctan\\frac{b}{a}$, then the quadrant."], why: "$\\theta \\approx " + nm(d2(th2)) + "^\\circ$." };
      } },
    { id: "pc8-demoivre", title: "Products, quotients and powers", lesson: 14,
      gen: function (R) {
        var t = R.int(0, 4), r1 = R.int(2, 6), r2 = R.int(2, 6), t1 = 5 * R.int(2, 40), t2 = 5 * R.int(2, 30), n = R.int(2, 6);
        if (t === 0) return { type: "num", prompt: "Multiply $(" + r1 + "\\,\\text{cis}\\," + t1 + "^\\circ)(" + r2 + "\\,\\text{cis}\\," + t2 + "^\\circ)$. What is the **modulus** of the product?", pre: "$r =$", answer: r1 * r2, near: near(r1 * r2, [{ v: r1 + r2, fb: "Moduli are **multiplied**; the angles are the ones that add." }]), hints: ["Multiply the moduli."], why: "$" + r1 + " \\times " + r2 + " = " + r1 * r2 + "$." };
        if (t === 1) return { type: "num", prompt: "Multiply $(" + r1 + "\\,\\text{cis}\\," + t1 + "^\\circ)(" + r2 + "\\,\\text{cis}\\," + t2 + "^\\circ)$. What is the **argument** of the product, from $0^\\circ$ to $360^\\circ$?", pre: "$\\theta =$", post: "degrees", answer: norm360(t1 + t2), near: near(norm360(t1 + t2), [{ v: norm360(t1 * t2), fb: "Angles **add** when you multiply." }, { v: norm360(t1 - t2), fb: "That is for a **quotient**. For a product, add." }]), hints: ["Add the angles."], why: "$" + t1 + " + " + t2 + " = " + (t1 + t2) + "$, reduced to $" + norm360(t1 + t2) + "^\\circ$." };
        if (t === 2) return { type: "num", prompt: "Divide $\\dfrac{" + r1 * r2 + "\\,\\text{cis}\\," + t1 + "^\\circ}{" + r2 + "\\,\\text{cis}\\," + t2 + "^\\circ}$. What is the **argument** of the quotient, from $0^\\circ$ to $360^\\circ$?", pre: "$\\theta =$", post: "degrees", answer: norm360(t1 - t2), near: near(norm360(t1 - t2), [{ v: norm360(t1 + t2), fb: "That is for a **product**. For a quotient, subtract." }]), hints: ["Subtract the angles."], why: "$" + t1 + " - " + t2 + " = " + (t1 - t2) + "$, reduced to $" + norm360(t1 - t2) + "^\\circ$." };
        if (t === 3) return { type: "num", prompt: "Find the **argument** of $(" + r1 + "\\,\\text{cis}\\," + t1 + "^\\circ)^" + n + "$, from $0^\\circ$ to $360^\\circ$.", pre: "$\\theta =$", post: "degrees", answer: norm360(n * t1), near: near(norm360(n * t1), [{ v: norm360(t1 + n), fb: "For a **power**, multiply the angle by $n$ (De Moivre)." }]), hints: ["Multiply the angle by $" + n + "$."], why: "$" + n + " \\times " + t1 + " = " + n * t1 + "$, reduced to $" + norm360(n * t1) + "^\\circ$." };
        var rr = R.int(2, 3), ans = Math.pow(rr, n) * C8(n * t1);
        return { type: "num", prompt: "Find the real part of $(" + rr + "\\,\\text{cis}\\," + t1 + "^\\circ)^" + n + "$, to 2 decimal places." + GENX, pre: "real part $\\approx$", answer: RD8(ans), tol: 0.006, calc: true, near: near(RD8(ans), [{ v: RD8(Math.pow(rr, n) * S8(n * t1)), tol: 0.006, fb: "That is the **imaginary** part. The real part uses the cosine." }, { v: RD8(rr * n * C8(n * t1)), tol: 0.006, fb: "The modulus is raised to the power $n$: $" + rr + "^" + n + " = " + Math.pow(rr, n) + "$." }]), hints: ["$r^n\\cos(n\\theta)$."], why: "$" + Math.pow(rr, n) + "\\cos " + n * t1 + "^\\circ \\approx " + nm(d2(ans)) + "$." };
      } },
    { id: "pc8-roots", title: "Roots of complex numbers", lesson: 15,
      gen: function (R) {
        var t = R.int(0, 2), n = R.int(2, 8);
        if (t === 0) return { type: "num", prompt: "The $" + NTH8[n] + "$ roots of a complex number ($" + n + "$ of them) are equally spaced round a circle. How many degrees apart are neighbouring roots? (A decimal is fine.)", pre: "angle =", post: "degrees", answer: RD8(360 / n), tol: 0.06, near: near(RD8(360 / n), [{ v: n, fb: "Divide the full turn, $360^\\circ$, by $n$." }]), hints: ["$360 \\div n$."], why: "$\\frac{360}{" + n + "} \\approx " + nm(f4(360 / n, 2)) + "^\\circ$." };
        var m = R.int(2, 4), nn = R.int(2, 4), phi = 30 * R.int(1, 10);
        if (t === 1) return { type: "num", prompt: "The " + NTH8[nn] + " roots of $" + Math.pow(m, nn) + "\\,\\text{cis}\\," + phi + "^\\circ$ all have the same modulus. What is it?", pre: "$r =$", answer: m, near: near(m, [{ v: Math.pow(m, nn), fb: "Take the **" + NTH8[nn] + " root** of the modulus." }, { v: Math.pow(m, nn) / nn, fb: "A root is not a division: take the " + NTH8[nn] + " root of " + Math.pow(m, nn) + "." }]), hints: ["The " + NTH8[nn] + " root of " + Math.pow(m, nn) + "."], why: "$" + m + "^" + nn + " = " + Math.pow(m, nn) + "$." };
        var k = R.int(0, nn - 1), opts = [{ v: RD8(phi + 360 * k), tol: 0.06, fb: "Divide by $n = " + nn + "$ as well." }];
        if (k > 0) opts.unshift({ v: RD8(phi / nn), tol: 0.06, fb: "That is the $k = 0$ root. For $k = " + k + "$ add $360^\\circ \\times " + k + "$ first." });
        return { type: "num", prompt: "One " + NTH8[nn] + " root of $" + Math.pow(m, nn) + "\\,\\text{cis}\\," + phi + "^\\circ$ comes from $k = " + k + "$. What is its argument, in degrees? (A decimal is fine.)", pre: "$\\theta \\approx$", post: "degrees", answer: RD8((phi + 360 * k) / nn), tol: 0.06, near: near(RD8((phi + 360 * k) / nn), opts), hints: ["$\\frac{\\theta + 360^\\circ k}{n}$."], why: "$\\frac{" + phi + " + " + 360 * k + "}{" + nn + "} = " + nm(f4((phi + 360 * k) / nn, 2)) + "^\\circ$." };
      } },
    { id: "pc8-param", title: "Parametric equations", lesson: 16,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) { var a = R.int(2, 6), b = R.int(-5, 5), tt = R.int(-3, 6); return { type: "num", prompt: "For $x = " + a + "t " + (b < 0 ? "- " : "+ ") + Math.abs(b) + "$, find $x$ when $t = " + tt + "$.", pre: "$x =$", answer: a * tt + b, near: near(a * tt + b, [{ v: a + tt + b, fb: "$" + a + "t$ means $" + a + "$ **times** $t$." }]), hints: ["$" + a + "(" + tt + ") " + (b < 0 ? "- " : "+ ") + Math.abs(b) + "$."], why: "$" + (a * tt + b) + "$." }; }
        if (t === 1) { var c = R.int(-4, 4), d = R.int(-6, 6), tt2 = R.int(-3, 5), y = tt2 * tt2 + c * tt2 + d; return { type: "num", prompt: "For $y = t^2 " + (c < 0 ? "- " : "+ ") + Math.abs(c) + "t " + (d < 0 ? "- " : "+ ") + Math.abs(d) + "$, find $y$ when $t = " + tt2 + "$.", pre: "$y =$", answer: y, near: near(y, [{ v: -tt2 * tt2 + c * tt2 + d, fb: "$t^2$ with $t = " + tt2 + "$ is $" + tt2 * tt2 + "$: squares are positive." }]), hints: ["Substitute $t = " + tt2 + "$."], why: "$" + y + "$." }; }
        if (t === 2) { var a3 = R.int(2, 5), b3 = R.int(-6, 6), t3 = R.int(-4, 7), val = a3 * t3 + b3; return { type: "num", prompt: "For $x = " + a3 + "t " + (b3 < 0 ? "- " : "+ ") + Math.abs(b3) + "$, at what time $t$ is $x = " + val + "$?", pre: "$t =$", answer: t3, near: near(t3, [{ v: val - b3, fb: "That is $" + a3 + "t$. Divide by " + a3 + " as well." }]), hints: ["Subtract, then divide."], why: "$t = \\frac{" + val + " " + (b3 < 0 ? "+ " : "- ") + Math.abs(b3) + "}{" + a3 + "} = " + t3 + "$." }; }
        var A = R.int(2, 8), pt = R.pick([[30, "\\frac{\\pi}{6}"], [45, "\\frac{\\pi}{4}"], [60, "\\frac{\\pi}{3}"]]), fn = R.pick(["cos", "sin"]), F = fn === "cos" ? C8 : S8, ans = A * F(pt[0]);
        return { type: "num", prompt: "For $" + (fn === "cos" ? "x" : "y") + " = " + A + "\\" + fn + " t$, find $" + (fn === "cos" ? "x" : "y") + "$ when $t = " + pt[1] + "$, to 2 decimal places." + GENX, pre: "$" + (fn === "cos" ? "x" : "y") + " \\approx$", answer: RD8(ans), tol: 0.006, calc: true, near: near(RD8(ans), [{ v: RD8(A * (fn === "cos" ? S8(pt[0]) : C8(pt[0]))), tol: 0.006, fb: "Use the " + fn + " in this equation." }]), hints: ["$t$ is in radians: " + pt[0] + " degrees."], why: "$" + nm(d2(ans)) + "$." };
      } },
    { id: "pc8-elim", title: "Eliminating the parameter", lesson: 17,
      gen: function (R) {
        var t = R.int(0, 3), s = function (v) { return (v < 0 ? "-" : "+") + " " + Math.abs(v); };
        if (t === 0) { var b = R.int(1, 6), c = R.int(2, 5), dd = R.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]); return mc(R, { prompt: "Eliminate $t$ from $x = t + " + b + "$, $y = " + c + "t " + s(dd) + "$.", right: "$y = " + c + "(x - " + b + ") " + s(dd) + "$", wrong: [{ t: "$y = " + c + "(x + " + b + ") " + s(dd) + "$", fb: "From $x = t + " + b + "$ we get $t = x - " + b + "$: subtract." }, { t: "$y = " + c + "x " + s(dd) + "$", fb: "Substitute $t = x - " + b + "$, not $t = x$." }, { t: "$y = x - " + b + "$", fb: "Put $t = x - " + b + "$ into **$y$'s** equation: $y = " + c + "t " + s(dd) + "$." }], keep: true, hints: ["Solve $x = t + " + b + "$ for $t$."], why: "$t = x - " + b + "$, so $y = " + c + "(x - " + b + ") " + s(dd) + "$." }); }
        if (t === 1) { var h = R.int(1, 5), k = R.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]); return mc(R, { prompt: "Eliminate $t$ from $x = t + " + h + "$, $y = t^2 " + s(k) + "$.", right: "$y = (x - " + h + ")^2 " + s(k) + "$", wrong: [{ t: "$y = (x + " + h + ")^2 " + s(k) + "$", fb: "$t = x - " + h + "$: subtract $" + h + "$." }, { t: "$y = x^2 - " + h + " " + s(k) + "$", fb: "Square the **whole** $t = x - " + h + "$: $(x - " + h + ")^2$." }, { t: "$y = (x - " + h + ")^2$", fb: "Do not lose the constant in $y = t^2 " + s(k) + "$." }], keep: true, hints: ["$t = x - " + h + "$."], why: "$y = (x - " + h + ")^2 " + s(k) + "$." }); }
        if (t === 2) { var m = R.int(2, 6); return mc(R, { prompt: "Eliminate $t$ from $x = e^t$, $y = " + m + "t$.", right: "$y = " + m + "\\ln x$", wrong: [{ t: "$y = " + m + "e^x$", fb: "$x = e^t$ gives $t = \\ln x$, not $e^x$." }, { t: "$y = \\ln(" + m + "x)$", fb: "$y = " + m + "t = " + m + "\\ln x$: the " + m + " multiplies the log." }, { t: "$y = " + m + "x^2$", fb: "$x = e^t$ is exponential in $t$: $t = \\ln x$." }], keep: true, hints: ["$t = \\ln x$."], why: "$t = \\ln x$, so $y = " + m + "\\ln x$ (for $x > 0$)." }); }
        var A = R.int(2, 7), B = R.int(2, 7);
        if (A === B) B = A + 1;
        return mc(R, { prompt: "Eliminate $t$ from $x = " + A + "\\cos t$, $y = " + B + "\\sin t$.", right: "$\\dfrac{x^2}{" + A * A + "} + \\dfrac{y^2}{" + B * B + "} = 1$", wrong: [{ t: "$\\dfrac{x^2}{" + B * B + "} + \\dfrac{y^2}{" + A * A + "} = 1$", fb: "$x = " + A + "\\cos t$ gives $\\cos t = \\frac{x}{" + A + "}$: the " + A * A + " goes under $x^2$." }, { t: "$x^2 + y^2 = 1$", fb: "That needs $A = B = 1$. Here $\\cos t = \\frac{x}{" + A + "}$ and $\\sin t = \\frac{y}{" + B + "}$." }, { t: "$\\dfrac{x}{" + A + "} + \\dfrac{y}{" + B + "} = 1$", fb: "Use $\\cos^2 t + \\sin^2 t = 1$: the terms are **squared**." }], keep: true, hints: ["$\\cos^2 t + \\sin^2 t = 1$."], why: "$\\left(\\frac{x}{" + A + "}\\right)^2 + \\left(\\frac{y}{" + B + "}\\right)^2 = 1$." });
      } },
    { id: "pc8-proj", title: "Projectile motion", lesson: 18,
      gen: function (R) {
        var v = R.pick([10, 12, 15, 18, 20, 22, 25, 28, 30]), th = 5 * R.int(4, 14), t = R.int(0, 2), g = 9.8;
        var T = 2 * v * S8(th) / g, Rg = v * v * S8(2 * th) / g, H = Math.pow(v * S8(th), 2) / (2 * g);
        if (t === 0) return { type: "num", prompt: "A ball is kicked at $" + v + "$ m/s at $" + th + "^\\circ$ above the ground. Using $y = (v\\sin\\theta)t - 4.9t^2$, how long is it in the air, to 2 decimal places?" + GENX, pre: "$t \\approx$", post: "s", answer: RD8(T), tol: 0.006, calc: true, near: near(RD8(T), [{ v: RD8(T / 2), tol: 0.006, fb: "That is the time to the **top**, half of the flight." }, { v: RD8(2 * v * C8(th) / g), tol: 0.006, fb: "That used the cosine. The vertical motion uses $v\\sin\\theta$." }]), hints: ["It lands when $y = 0$: $t = \\frac{2v\\sin\\theta}{9.8}$."], why: "$t = \\frac{2(" + v + ")\\sin " + th + "^\\circ}{9.8} \\approx " + nm(d2(T)) + "$ s." };
        if (t === 1) return { type: "num", prompt: "A ball is kicked at $" + v + "$ m/s at $" + th + "^\\circ$. How far does it travel before landing, $\\dfrac{v^2\\sin 2\\theta}{9.8}$, to 2 decimal places?" + GENX, pre: "range $\\approx$", post: "m", answer: RD8(Rg), tol: 0.006, calc: true, near: near(RD8(Rg), [{ v: RD8(v * v * S8(th) / g), tol: 0.006, fb: "The formula has $\\sin 2\\theta$, the sine of **double** the angle." }, { v: RD8(Rg / 2), tol: 0.006, fb: "That is half of the range." }]), hints: ["$\\sin 2\\theta = \\sin " + 2 * th + "^\\circ$."], why: "$\\frac{" + v * v + "\\sin " + 2 * th + "^\\circ}{9.8} \\approx " + nm(d2(Rg)) + "$ m." };
        return { type: "num", prompt: "A ball is kicked at $" + v + "$ m/s at $" + th + "^\\circ$. What is its maximum height, $\\dfrac{(v\\sin\\theta)^2}{19.6}$, to 2 decimal places?" + GENX, pre: "height $\\approx$", post: "m", answer: RD8(H), tol: 0.006, calc: true, near: near(RD8(H), [{ v: RD8(v * S8(th) / 19.6), tol: 0.006, fb: "Square $v\\sin\\theta$ first." }, { v: RD8(Math.pow(v * C8(th), 2) / 19.6), tol: 0.006, fb: "Use the **sine** (vertical speed)." }]), hints: ["$v\\sin " + th + "^\\circ$, squared, over 19.6."], why: "$\\frac{(" + v + "\\sin " + th + "^\\circ)^2}{19.6} \\approx " + nm(d2(H)) + "$ m." };
      } },
    { id: "pc8-vecmag", title: "Magnitude and direction of a vector", lesson: 19,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t <= 1) {
          var T = R.pick(TRIP8), sx = R.pick([-1, 1]), sy = R.pick([-1, 1]), sw = R.chance(0.5), a = sx * (sw ? T[0] : T[1]), b = sy * (sw ? T[1] : T[0]);
          if (t === 0) return { type: "num", prompt: "Find the magnitude of $\\vec{v} = \\langle " + a + ", " + b + "\\rangle$.", pre: "$|\\vec{v}| =$", answer: T[2], near: near(T[2], [{ v: Math.abs(a) + Math.abs(b), fb: "Add the **squares** and take the root: $\\sqrt{a^2 + b^2}$." }, { v: T[2] * T[2], fb: "That is $|\\vec{v}|^2$: take the square root." }]), hints: ["$\\sqrt{a^2 + b^2}$."], why: "$\\sqrt{" + a * a + " + " + b * b + "} = " + T[2] + "$." };
          var th = norm360(Math.atan2(b, a) / DEG), cal = Math.atan(b / a) / DEG;
          return { type: "num", prompt: "Find the direction angle $\\theta$ (from $0^\\circ$ up to $360^\\circ$) of $\\vec{v} = \\langle " + a + ", " + b + "\\rangle$, to 2 decimal places." + GENX, pre: "$\\theta \\approx$", post: "degrees", answer: RD8(th), tol: 0.006, calc: true, near: near(RD8(th), [{ v: RD8(cal), tol: 0.006, fb: "That is the calculator's $\\arctan\\frac{b}{a}$: check which quadrant the arrow points into." }]), hints: ["$\\arctan\\frac{b}{a}$, then the quadrant."], why: "$\\theta \\approx " + nm(d2(th)) + "^\\circ$." };
        }
        var m = R.int(5, 60), th2 = R.pick(SPEC8.concat([15, 20, 25, 35, 40, 50, 70, 80])), cx = t === 2, ans = cx ? m * C8(th2) : m * S8(th2);
        return { type: "num", prompt: "A vector has magnitude $" + m + "$ and direction $" + th2 + "^\\circ$. What is its " + (cx ? "$x$" : "$y$") + "-component, to 2 decimal places?" + GENX, pre: (cx ? "$a$" : "$b$") + " $\\approx$", answer: RD8(ans), tol: 0.006, calc: true, near: near(RD8(ans), [{ v: RD8(cx ? m * S8(th2) : m * C8(th2)), tol: 0.006, fb: "That is the other component: $a = |\\vec{v}|\\cos\\theta$, $b = |\\vec{v}|\\sin\\theta$." }]), hints: [cx ? "$a = |\\vec{v}|\\cos\\theta$." : "$b = |\\vec{v}|\\sin\\theta$."], why: "$" + nm(d2(ans)) + "$." };
      } },
    { id: "pc8-vecops", title: "Vector operations and unit vectors", lesson: 20,
      gen: function (R) {
        var u = [R.int(-5, 5), R.int(-5, 5)], v = [R.int(-5, 5), R.int(-5, 5)], k = R.int(2, 4), m = R.int(2, 3), t = R.int(0, 3);
        if (t === 0) { var cmp = R.int(0, 1), ans = u[cmp] + v[cmp]; return { type: "num", prompt: "For $\\vec{u} = \\langle " + u[0] + ", " + u[1] + "\\rangle$ and $\\vec{v} = \\langle " + v[0] + ", " + v[1] + "\\rangle$, what is the " + (cmp ? "second" : "first") + " component of $\\vec{u} + \\vec{v}$?", pre: "$=$", answer: ans, near: near(ans, [{ v: u[cmp] - v[cmp], fb: "That subtracts. For $\\vec{u} + \\vec{v}$, add matching components." }, { v: u[1 - cmp] + v[1 - cmp], fb: "That is the **other** component." }]), hints: ["Add the matching components."], why: "$" + u[cmp] + " + (" + v[cmp] + ") = " + ans + "$." }; }
        if (t === 1) { var c2 = R.int(0, 1), a2 = k * u[c2] - m * v[c2]; return { type: "num", prompt: "For $\\vec{u} = \\langle " + u[0] + ", " + u[1] + "\\rangle$ and $\\vec{v} = \\langle " + v[0] + ", " + v[1] + "\\rangle$, what is the " + (c2 ? "second" : "first") + " component of $" + k + "\\vec{u} - " + m + "\\vec{v}$?", pre: "$=$", answer: a2, near: near(a2, [{ v: k * u[c2] + m * v[c2], fb: "The sign: it is $" + k + "\\vec{u}$ **minus** $" + m + "\\vec{v}$." }, { v: k * u[1 - c2] - m * v[1 - c2], fb: "That is the **other** component." }]), hints: ["Scale each vector, then subtract matching components."], why: "$" + k + "(" + u[c2] + ") - " + m + "(" + v[c2] + ") = " + a2 + "$." }; }
        if (t === 2) { var w = [k * u[0] - m * v[0], k * u[1] - m * v[1]]; if (w[0] === 0 && w[1] === 0) { u[0] += 1; w[0] += k; } var mag = Math.sqrt(w[0] * w[0] + w[1] * w[1]); return { type: "num", prompt: "For $\\vec{u} = \\langle " + u[0] + ", " + u[1] + "\\rangle$ and $\\vec{v} = \\langle " + v[0] + ", " + v[1] + "\\rangle$, find the magnitude of $" + k + "\\vec{u} - " + m + "\\vec{v}$, to 2 decimal places." + GENX, pre: "magnitude $\\approx$", answer: RD8(mag), tol: 0.006, calc: true, near: near(RD8(mag), [{ v: RD8(k * Math.sqrt(u[0] * u[0] + u[1] * u[1]) - m * Math.sqrt(v[0] * v[0] + v[1] * v[1])), tol: 0.006, fb: "Magnitudes do not subtract like that. First find the vector $" + k + "\\vec{u} - " + m + "\\vec{v}$, then its length." }]), hints: ["First the components of $" + k + "\\vec{u} - " + m + "\\vec{v}$, then $\\sqrt{a^2 + b^2}$."], why: "$\\langle " + w[0] + ", " + w[1] + "\\rangle$ has length $\\approx " + nm(d2(mag)) + "$." }; }
        var T = R.pick(TRIP8), sx = R.pick([-1, 1]), sy = R.pick([-1, 1]), sw = R.chance(0.5), a = sx * (sw ? T[0] : T[1]), b = sy * (sw ? T[1] : T[0]), c3 = R.int(0, 1), val = (c3 ? b : a) / T[2];
        return { type: "num", prompt: "Find the " + (c3 ? "second" : "first") + " component of the **unit vector** in the direction of $\\langle " + a + ", " + b + "\\rangle$. (A decimal is fine.)", pre: "$=$", answer: RD8(val), tol: 0.0006, near: near(RD8(val), [{ v: c3 ? b : a, fb: "Divide by the magnitude $" + T[2] + "$: a unit vector has length 1." }, { v: RD8((c3 ? a : b) / T[2]), tol: 0.0006, fb: "That is the **other** component." }]), hints: ["Divide by $\\sqrt{a^2 + b^2} = " + T[2] + "$."], why: "$\\frac{" + (c3 ? b : a) + "}{" + T[2] + "} = " + nm(f4(val, 3)) + "$." };
      } },
    { id: "pc8-dot", title: "The dot product", lesson: 21,
      gen: function (R) {
        var t = R.int(0, 2), a = R.int(-6, 6), b = R.int(-6, 6), c = R.int(-6, 6), d = R.int(-6, 6);
        if (t === 0) return { type: "num", prompt: "Find $\\langle " + a + ", " + b + "\\rangle\\cdot\\langle " + c + ", " + d + "\\rangle$.", pre: "$=$", answer: a * c + b * d, near: near(a * c + b * d, [{ v: a * d + b * c, fb: "Multiply **matching** components: $" + a + " \\cdot " + c + "$ and $" + b + " \\cdot " + d + "$." }, { v: a * c - b * d, fb: "Add the two products." }]), hints: ["$ac + bd$."], why: "$" + a * c + " + (" + b * d + ") = " + (a * c + b * d) + "$." };
        if (t === 1) { var u = [R.int(1, 6), R.int(-6, 6)], w = [R.int(1, 6), R.int(-6, 6)], dt = u[0] * w[0] + u[1] * w[1], mu = Math.sqrt(u[0] * u[0] + u[1] * u[1]), mw = Math.sqrt(w[0] * w[0] + w[1] * w[1]), cs = Math.max(-1, Math.min(1, dt / (mu * mw))), ang = Math.acos(cs) / DEG; return { type: "num", prompt: "Find the angle between $\\langle " + u[0] + ", " + u[1] + "\\rangle$ and $\\langle " + w[0] + ", " + w[1] + "\\rangle$, in degrees to 2 decimal places." + GENX, pre: "$\\theta \\approx$", post: "degrees", answer: RD8(ang), tol: 0.006, calc: true, near: near(RD8(ang), [{ v: RD8(cs), tol: 0.006, fb: "That is the **cosine**. Take the inverse cosine." }]), hints: ["$\\cos\\theta = \\frac{\\vec{u}\\cdot\\vec{v}}{|\\vec{u}||\\vec{v}|}$."], why: "$\\cos\\theta = \\frac{" + dt + "}{" + nm(f4(mu * mw, 3)) + "}$, so $\\theta \\approx " + nm(d2(ang)) + "^\\circ$." }; }
        var bb = R.pick([1, 2, 3, 4]), kk = R.pick([-4, -3, -2, 2, 3, 4, 5]), tt = R.pick([1, 2, 3]), cc = -tt * bb, dd = tt * kk;
        return { type: "num", prompt: "For what value of $k$ is $\\langle k, " + bb + "\\rangle$ perpendicular to $\\langle " + cc + ", " + dd + "\\rangle$?", pre: "$k =$", answer: kk, near: near(kk, [{ v: -kk, fb: "Check the sign: perpendicular means $kc + bd = 0$, so $k = -\\frac{bd}{c}$." }, { v: cc * bb, fb: "Set the dot product to zero and solve: $" + cc + "k + " + bb * dd + " = 0$." }]), hints: ["Perpendicular: the dot product is 0."], why: "$" + cc + "k + " + bb * dd + " = 0$, so $k = " + kk + "$." };
      } }
  ];
  L.unit("precalc", 8, {
    title: "Further Applications of Trigonometry",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "The Law of Sines, the ambiguous case and the area of a triangle.", skills: ["pc8-sines", "pc8-ssa", "pc8-area"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "The Law of Cosines, Heron's formula and choosing a law.", skills: ["pc8-cosines", "pc8-heron"], per: 3 },
      { title: "Quiz 3", after: 9, blurb: "Polar points, converting between polar and rectangular, and polar equations.", skills: ["pc8-polpt", "pc8-conv", "pc8-poleq"], per: 2 },
      { title: "Quiz 4", after: 12, blurb: "Polar graphs: values, symmetry, limaçons and roses.", skills: ["pc8-polval", "pc8-limacon", "pc8-rose"], per: 2 },
      { title: "Quiz 5", after: 15, blurb: "Complex numbers in polar form: products, powers and roots.", skills: ["pc8-cpolar", "pc8-demoivre", "pc8-roots"], per: 2 },
      { title: "Quiz 6", after: 18, blurb: "Parametric equations, eliminating the parameter and projectile motion.", skills: ["pc8-param", "pc8-elim", "pc8-proj"], per: 2 },
      { title: "Quiz 7", after: 21, blurb: "Vectors: magnitude and direction, operations, and the dot product.", skills: ["pc8-vecmag", "pc8-vecops", "pc8-dot"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:8", {
    2: { name: "The Law of Sines", frame: "$\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}$: each side over the sine of the [[opposite]] angle. With two angles and a side, find the [[third]] angle first: the three add to [[$180^\\circ$]].",
         chips: ["adjacent", "$90^\\circ$"], fb: { "adjacent": "Each side pairs with the angle **opposite** it, not next to it.", "$90^\\circ$": "The angles of any triangle add to $180^\\circ$; $90^\\circ$ is a right angle." } },
    3: { name: "The ambiguous case", frame: "SSA can give [[none]], one or [[two]] triangles. Find $\\sin B = \\frac{b\\sin A}{a}$: above 1 means no triangle. Otherwise $B$ and $180^\\circ - B$ both have that sine; keep each only if the angles still add to less than [[$180^\\circ$]].",
         chips: ["three", "$90^\\circ$"], fb: { "three": "At most two angles between $0^\\circ$ and $180^\\circ$ share a sine.", "$90^\\circ$": "The test is against $180^\\circ$: the angles of a triangle must add to less than that with the third angle." } },
    4: { name: "The area of a triangle", frame: "Area $= \\frac{1}{2}ab\\sin C$: two sides and the angle [[between]] them. $C$ and $180^\\circ - C$ give the [[same]] area, and the area is largest when $C =$ [[$90^\\circ$]].",
         chips: ["opposite", "double"], fb: { "opposite": "The angle must be the one **between** the two sides.", "double": "The area is $\\frac{1}{2}ab\\sin C$: half of $ab\\sin C$, not double." } },
    5: { name: "The Law of Cosines", frame: "$c^2 = a^2 + b^2 -$ [[$2ab\\cos C$]]. At $C = 90^\\circ$ it becomes [[Pythagoras]]. With three sides, $\\cos C = \\frac{a^2 + b^2 - c^2}{2ab}$ and the angle is the [[inverse]] cosine.",
         chips: ["$ab\\cos C$", "tangent"], fb: { "$ab\\cos C$": "The formula has $2ab\\cos C$: do not drop the 2.", "tangent": "Use the inverse **cosine** of the value you find." } },
    6: { name: "Heron's formula, and which law", frame: "With $s =$ [[$\\frac{a + b + c}{2}$]], the area is [[$\\sqrt{s(s - a)(s - b)(s - c)}$]]. Two angles and a side: the Law of [[Sines]]; two sides and the angle between, or three sides: the Law of Cosines.",
         chips: ["$a + b + c$", "Cosines"], fb: { "$a + b + c$": "$s$ is **half** the perimeter.", "Cosines": "Two angles and a side give a side-and-opposite-angle pair: Sines first." } },
    7: { name: "Polar points", frame: "A polar point $(r, \\theta)$: turn by $\\theta$ from the positive [[$x$-axis]], then go out $r$. A negative $r$ goes [[backwards]]: $(r, \\theta)$ and $(-r, \\theta + 180^\\circ)$ are the same point, and adding [[$360^\\circ$]] to $\\theta$ gives the same point again.",
         chips: ["$y$-axis", "$90^\\circ$"], fb: { "$y$-axis": "Angles are measured from the positive $x$-axis.", "$90^\\circ$": "A full turn is $360^\\circ$; $90^\\circ$ is a quarter turn." } },
    8: { name: "Polar and rectangular points", frame: "$x =$ [[$r\\cos\\theta$]] and $y = r\\sin\\theta$. Going back, $r =$ [[$\\sqrt{x^2 + y^2}$]] and $\\tan\\theta = \\frac{y}{x}$. A calculator's arctan only answers in quadrants I and IV: for quadrants II and III add [[$180^\\circ$]].",
         chips: ["$r\\sin\\theta$", "$90^\\circ$"], fb: { "$r\\sin\\theta$": "That is $y$. The $x$-coordinate is $r\\cos\\theta$.", "$90^\\circ$": "Add a half turn, $180^\\circ$, to move to the opposite side." } },
    9: { name: "Polar and rectangular equations", frame: "Use $r^2 =$ [[$x^2 + y^2$]], $r\\cos\\theta = x$ and $r\\sin\\theta = y$. To convert $r = 4\\cos\\theta$, [[multiply]] both sides by $r$: $x^2 + y^2 = 4x$, a [[circle]].",
         chips: ["divide", "line"], fb: { "divide": "Dividing does not make $r\\cos\\theta$ appear. Multiply by $r$.", "line": "$x^2 + y^2 = 4x$ is a circle through the origin." } },
    10: { name: "Polar graphs", frame: "Make a [[table]], plot each point (a negative $r$ goes backwards) and join them in order of $\\theta$. A cosine equation is symmetric about the [[polar axis]]; a sine equation about the [[vertical axis]].",
         chips: ["pole", "slope"], fb: { "pole": "A graph of this kind has a whole **line** of symmetry, not just the pole.", "slope": "Slope belongs to rectangular lines, not polar symmetry." } },
    11: { name: "Circles, cardioids and limaçons", frame: "$r = a \\pm b\\cos\\theta$: $a = b$ is a [[cardioid]]; $a < b$ has an [[inner loop]]; $b < a < 2b$ has a dimple; $a \\ge 2b$ is convex. $r = a\\cos\\theta$ with no constant is a [[circle]].",
         chips: ["rose", "spiral"], fb: { "rose": "Roses have a multiple angle, like $\\cos 3\\theta$.", "spiral": "A spiral has $r$ growing with $\\theta$: $r = a\\theta$." } },
    12: { name: "Roses", frame: "$r = a\\cos n\\theta$: $n$ odd gives [[$n$]] petals, $n$ even gives [[$2n$]] petals, and each petal reaches out a distance [[$a$]].",
         chips: ["$n^2$", "$a + n$"], fb: { "$n^2$": "The count grows in proportion to $n$, not its square.", "$a + n$": "$a$ is the petal **length**; it does not change how many petals." } },
    13: { name: "Polar form of a complex number", frame: "$z = a + bi$ has modulus $r =$ [[$\\sqrt{a^2 + b^2}$]] and argument $\\theta$ with $\\tan\\theta =$ [[$\\frac{b}{a}$]]: check the [[quadrant]]. Polar form: $z = r(\\cos\\theta + i\\sin\\theta)$.",
         chips: ["$a + b$", "$\\frac{a}{b}$"], fb: { "$a + b$": "The modulus is the **distance** from the origin: add the squares and take the root.", "$\\frac{a}{b}$": "Tangent is opposite over adjacent: $\\frac{b}{a}$." } },
    14: { name: "Products, quotients and powers", frame: "Multiplying: the moduli [[multiply]] and the arguments [[add]]. Dividing: the arguments [[subtract]]. De Moivre: $z^n = r^n\\,\\text{cis}(n\\theta)$, so the angle is multiplied by [[$n$]].",
         chips: ["divide", "$\\frac{1}{n}$"], fb: { "divide": "For a product, the angles add; they are not divided.", "$\\frac{1}{n}$": "That is for **roots**. For a power, multiply the angle by $n$." } },
    15: { name: "Roots of complex numbers", frame: "The $n$ $n$th roots of $r\\,\\text{cis}\\,\\theta$ all have modulus [[$r^{1/n}$]], and are equally spaced [[$\\frac{360^\\circ}{n}$]] apart round a circle. There are exactly [[$n$]] of them.",
         chips: ["$nr$", "$n^2$"], fb: { "$nr$": "The modulus is the $n$th **root** of $r$, not $n$ times $r$.", "$n^2$": "There are $n$ roots, no more." } },
    16: { name: "Parametric equations", frame: "In $x = f(t)$ and $y = g(t)$ the [[parameter]] $t$ decides where the point is. Plot points in order of [[$t$]] and add arrows for the [[direction]].",
         chips: ["slope", "$x$"], fb: { "slope": "The parameter is the third variable $t$, not a slope.", "$x$": "Join the points in order of $t$: ordering by $x$ can zigzag." } },
    17: { name: "Eliminating the parameter", frame: "[[Solve]] one equation for $t$, then [[substitute]] into the other. For cosine and sine use $\\cos^2 t + \\sin^2 t =$ [[1]]. Check whether the parameter [[limits]] $x$ or $y$.",
         chips: ["differentiate", "0"], fb: { "differentiate": "We only rearrange and substitute: no calculus.", "0": "$\\cos^2 t + \\sin^2 t$ is always 1." } },
    18: { name: "Projectile motion", frame: "$x = (v\\cos\\theta)t$ and $y = (v\\sin\\theta)t -$ [[$4.9t^2$]]. It lands when [[$y = 0$]]. The range $\\frac{v^2\\sin 2\\theta}{9.8}$ is the same for $\\theta$ and [[$90^\\circ - \\theta$]].",
         chips: ["$9.8t$", "$x = 0$"], fb: { "$9.8t$": "Gravity pulls with $\\frac{1}{2}(9.8)t^2 = 4.9t^2$ in the height.", "$x = 0$": "That is the starting point. It lands when the height is 0 again." } },
    19: { name: "Vectors", frame: "$\\vec{v} = \\langle a, b\\rangle$ has magnitude [[$\\sqrt{a^2 + b^2}$]] and direction $\\tan\\theta =$ [[$\\frac{b}{a}$]]. From magnitude and direction: $a = |\\vec{v}|$ [[$\\cos\\theta$]] and $b = |\\vec{v}|\\sin\\theta$.",
         chips: ["$a + b$", "$\\sin\\theta$"], fb: { "$a + b$": "Magnitude is a length: $\\sqrt{a^2 + b^2}$.", "$\\sin\\theta$": "That gives $b$, the vertical part. The horizontal part $a$ uses the cosine." } },
    20: { name: "Vector operations and unit vectors", frame: "Add [[component]] by component, and $k\\langle a, b\\rangle = \\langle ka, kb\\rangle$. A [[unit]] vector has length 1: divide $\\vec{v}$ by its [[magnitude]].",
         chips: ["angle", "dot"], fb: { "angle": "To make a unit vector, divide by the **length**, not the angle.", "dot": "The dot product is a separate operation that gives a number." } },
    21: { name: "The dot product", frame: "$\\vec{u}\\cdot\\vec{v} =$ [[$ac + bd$]], a [[number]], not a vector. $\\cos\\theta = \\frac{\\vec{u}\\cdot\\vec{v}}{|\\vec{u}||\\vec{v}|}$. A dot product of [[0]] means the vectors are perpendicular.",
         chips: ["$\\langle ac, bd\\rangle$", "1"], fb: { "$\\langle ac, bd\\rangle$": "A dot product adds those products into **one number**.", "1": "Perpendicular means $\\cos 90^\\circ = 0$: the dot product is 0." } }
  });
})();
