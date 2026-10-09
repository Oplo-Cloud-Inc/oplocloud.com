/* ==========================================================================
   Precalculus — Unit 6: Periodic Functions. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 6: the graphs of sine and cosine
   with amplitude, period, phase shift and vertical shift; modeling with
   sinusoids; the graphs of tangent, secant, cosecant and cotangent; and the
   inverse trigonometric functions. Each section is split into lessons small
   enough to finish in one sitting; each teaches one method: the idea, an
   example to watch, one done together, then on your own, a harder case, find
   the error, use it, and the concept built at the end.

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
    blurb: "Before Chapter 6 · Sine and cosine values, radians, shifting a graph and the length of a cycle.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · Sine values", prompt: "What is $\\sin 30^\\circ$?",
        options: [{ t: "$\\dfrac{1}{2}$" }, { t: "$\\dfrac{\\sqrt{3}}{2}$", fb: "That is $\\sin 60^\\circ$." }, { t: "$1$", fb: "$\\sin 90^\\circ = 1$." }],
        answer: 0, skill: "Special angles", hints: ["The 30°-60°-90° triangle."], why: "$\\sin 30^\\circ = \\frac{1}{2}$." },
      { type: "choice", kicker: "Check 2 · Radians", prompt: "$\\dfrac{\\pi}{2}$ radians is how many degrees?",
        options: [{ t: "$90^\\circ$" }, { t: "$180^\\circ$", fb: "That is $\\pi$ radians." }, { t: "$45^\\circ$", fb: "That is $\\frac{\\pi}{4}$." }],
        answer: 0, skill: "Radians", hints: ["$\\pi$ radians is 180°."], why: "$\\frac{180}{2} = 90$." },
      { type: "choice", kicker: "Check 3 · Cosine values", prompt: "What is $\\cos \\pi$?",
        options: [{ t: "$-1$" }, { t: "$0$", fb: "$\\cos\\frac{\\pi}{2} = 0$. At $\\pi$ the point is $(-1, 0)$." }, { t: "$1$", fb: "$\\cos 0 = 1$." }],
        answer: 0, skill: "Unit circle", hints: ["At $\\pi$ the point on the unit circle is $(-1, 0)$."], why: "$\\cos\\pi = -1$." },
      { type: "choice", kicker: "Check 4 · Shifts", prompt: "The graph of $y = f(x - 2)$ is the graph of $y = f(x)$ moved…",
        options: [{ t: "2 to the right" }, { t: "2 to the left", fb: "$f(x - 2)$ needs a bigger $x$: the graph moves right." }, { t: "2 up", fb: "A number added outside moves it up." }],
        answer: 0, skill: "Shifts", hints: ["When is $x - 2 = 0$?"], why: "Right 2." },
      { type: "num", kicker: "Check 5 · Cycles", prompt: "A wheel makes 3 full turns in 12 seconds. How many seconds does one turn take?", answer: 4, skill: "Rates",
        near: [{ v: 36, fb: "Divide the time by the number of turns." }, { v: 0.25, fb: "That is turns per second." }], hints: ["$12 \\div 3$."], why: "$4$ seconds." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 6.1**. If **check 2** slipped, look again at lesson 5.3. If **check 4** slipped, lesson 6.3 starts with it.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 6 */
  var PI = Math.PI;
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; };
  var GC6 = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; };
  // An angle in degrees as TeX in radians: radTex(150) is "\\frac{5\\pi}{6}".
  var radTex = function (d) {
    if (d === 0) return "0";
    var g = GC6(d, 180), n = d / g, m = 180 / g, sg = n < 0 ? "-" : "", an = Math.abs(n);
    return sg + (m === 1 ? (an === 1 ? "\\pi" : an + "\\pi") : (an === 1 ? "\\frac{\\pi}{" + m + "}" : "\\frac{" + an + "\\pi}{" + m + "}"));
  };
  // The label for k quarters of pi.
  var qlab = function (k) { if (k === 0) return "0"; var s = k < 0 ? "−" : "", a = Math.abs(k); if (a % 4 === 0) return s + (a / 4 === 1 ? "π" : a / 4 + "π"); if (a % 2 === 0) return s + (a / 2 === 1 ? "π/2" : a / 2 + "π/2"); return s + (a === 1 ? "π/4" : a + "π/4"); };
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
  function wavefig(alt, items, o) { return grid(alt, waveAx(o.x[0], o.x[1], o.y[0], o.y[1], o).concat(items), Object.assign({}, o, { grid: false })); }
  var SIN = function (x) { return Math.sin(x); }, COS = function (x) { return Math.cos(x); };
  var KP = function (f, xs, c) { return xs.map(function (x) { return dot(x, f(x), c || "orange"); }); };
  var HALVES = [0, PI / 2, PI, 3 * PI / 2, 2 * PI];

  /* ============================================ 1 · The graphs of sine and cosine */
  var HOW_1 = [["Key points", "One period has five key points: the start, quarter, half, three-quarters and end."],
               ["Plot", "Plot them at multiples of $\\frac{\\pi}{2}$."],
               ["Curve", "Draw a smooth wave through them, then repeat it."]];
  var G1a = wavefig("The five key points of y = sin x: (0, 0), (pi/2, 1), (pi, 0), (3pi/2, -1) and (2pi, 0).", KP(SIN, HALVES), { x: [-0.6, 6.9], y: [-1.5, 1.5], u: 40, uy: 80 });
  var G1b = wavefig("One period of y = sin x, a smooth wave from 0 up to 1, down through 0 to -1 and back to 0.", curve(SIN, 0, 2 * PI, "blue").concat(KP(SIN, HALVES)), { x: [-0.6, 6.9], y: [-1.5, 1.5], u: 40, uy: 80 });
  var G1c = wavefig("The graph of y = sin x repeating: two full periods from -2pi to 2pi.", curve(SIN, -2 * PI, 2 * PI, "blue"), { x: [-6.9, 6.9], y: [-1.5, 1.5], u: 30, uy: 96 });
  LESSONS.push({
    title: "The graphs of sine and cosine", art: "pcwave",
    blurb: "Book 6.1 · Unwrap the unit circle: the height of a point going round is the sine wave.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "As the angle goes from $0$ to $\\frac{\\pi}{2}$, the height of the point on the unit circle goes from…",
        options: [{ t: "0 up to 1" }, { t: "1 down to 0", fb: "At $0$ the point is $(1, 0)$: height 0." }, { t: "0 up to $\\frac{\\pi}{2}$", fb: "The height of a point on the unit circle never exceeds 1." }],
        answer: 0, skill: "Unit circle", hints: ["At $0$ the point is $(1, 0)$. At $\\frac{\\pi}{2}$ it is $(0, 1)$."], why: "The height is the sine: from $0$ to $1$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the angle round the circle. The **height** of the point (sine) or its **horizontal distance** (cosine) is plotted on the right. Find **where each graph peaks and bottoms out**: all **four** (sine's high and low, cosine's high and low).",
        scene: { type: "sketch", x: [-2.7, 7.2], y: [-1.5, 1.5], u: 38, w: 410, grid: false, gate: true, pts: {},
          chips: { f: { label: "Graph", v: "sin", opts: [["sin", "sine"], ["cos", "cosine"]] } },
          params: { t: { min: 0, max: 360, step: 15, v: 0, label: "angle (°)" } },
          track: function (s) { var f = s.c.f === "sin" ? SIN : COS, v = f(s.p.t * PI / 180); return Math.abs(v - 1) < 1e-9 ? s.c.f + "max" : Math.abs(v + 1) < 1e-9 ? s.c.f + "min" : null; },
          draw: function (s) {
            var t = s.p.t * PI / 180, f = s.c.f === "sin" ? SIN : COS, cx = -1.6, it = waveAx(-0.3, 6.7, -1.4, 1.4).concat([{ circle: [[cx, 0], 1], c: "soft" }, { seg: [[cx, 0], [cx + Math.cos(t), Math.sin(t)]], c: "ink" }], curve(f, 0, 2 * PI, "soft", null, true));
            if (t > 0) it = it.concat(curve(f, 0, t, "blue"));
            if (s.c.f === "sin") it.push({ seg: [[cx + Math.cos(t), Math.sin(t)], [t, Math.sin(t)]], c: "orange", dash: true }, { seg: [[t, 0], [t, Math.sin(t)]], c: "orange" });
            else it.push({ seg: [[cx, 0], [cx + Math.cos(t), 0]], c: "blue" }, { seg: [[t, 0], [t, Math.cos(t)]], c: "blue" });
            return it.concat([dot(cx + Math.cos(t), Math.sin(t), "orange"), dot(t, f(t), s.c.f === "sin" ? "orange" : "blue")]);
          },
          readout: function (s) { var d = s.p.t, f = s.c.f === "sin" ? SIN : COS, n = Object.keys(s.tracked).length; return "angle $" + d + "^\\circ$ ($" + (d === 0 ? "0" : radTex(d)) + "$ radians): $" + s.c.f + " = " + nm(f4(f(d * PI / 180), 3)) + "$<br>Highs and lows found: " + Math.min(n, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        gate: true, then: "Sine **starts at 0**, peaks at $\\frac{\\pi}{2}$ and bottoms out at $\\frac{3\\pi}{2}$. Cosine **starts at its peak**, 1, and bottoms out at $\\pi$. Both are the same wave, shifted, and both repeat every $2\\pi$." },
      { type: "learn", kicker: "The idea",
        prompt: "$y = \\sin x$ and $y = \\cos x$ are **periodic**: they repeat every $2\\pi$ (the **period**). Both stay between $-1$ and $1$. Sine starts at 0 and rises; cosine starts at 1 and falls. Plot the **five key points** of a period, then draw a smooth wave.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch one period of $y = \\sin x$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "x: \\ 0, \\ \\tfrac{\\pi}{2}, \\ \\pi, \\ \\tfrac{3\\pi}{2}, \\ 2\\pi", say: "Cut one period, $0$ to $2\\pi$, into four equal steps of $\\frac{\\pi}{2}$." },
          { step: 2, m: "y: \\ 0, \\ 1, \\ 0, \\ -1, \\ 0", say: "The sine of each one.", fig: G1a, ask: { prompt: "What is $\\sin\\frac{3\\pi}{2}$?", answer: 0, options: [{ t: "$-1$" }, { t: "$0$", fb: "At $\\frac{3\\pi}{2}$ the point is at the bottom of the circle, $(0, -1)$." }] } },
          { step: 3, m: "\\text{smooth wave through the points}", say: "Up to 1, back through 0, down to $-1$, and back to 0.", fig: G1b },
          { step: 3, m: "\\text{period } 2\\pi, \\ \\ -1 \\le y \\le 1", say: "Then it repeats, left and right, for ever.", fig: G1c }] },
        gate: true, then: "$\\sin x$: period $2\\pi$, range $[-1, 1]$, starts at 0 and rises." },
      { type: "guided", kicker: "Together",
        prompt: "Now you sketch one period of $y = \\cos x$.",
        how: HOW_1, skill: "Graph of sine and cosine",
        steps: [
          { step: 1, ask: "Cosine at the start: $\\cos 0 =$", type: "num", pre: "$\\cos 0 =$", answer: 1, near: [{ v: 0, fb: "$\\cos 0 = 1$: the point $(1, 0)$ on the unit circle has $x = 1$." }], hint: "The $x$-coordinate at $(1, 0)$.", m: "(0, 1)", say: "Cosine starts at its **maximum**." },
          { step: 2, ask: "Halfway round: $\\cos\\pi =$", type: "num", pre: "$\\cos\\pi =$", answer: -1, near: [{ v: 0, fb: "At $\\pi$ the point is $(-1, 0)$, so $x = -1$." }], hint: "The point is at the far left.", m: "(\\pi, -1)", say: "The minimum." },
          { step: 3, ask: "So the key points of one period are $1, 0, -1, 0, 1$. Where does the first **zero** occur?", type: "choice", answer: 0, options: [{ t: "$x = \\frac{\\pi}{2}$" }, { t: "$x = \\pi$", fb: "At $\\pi$ cosine is $-1$." }], m: "x = \\tfrac{\\pi}{2}", say: "A quarter of the way along." }],
        why: "Key points, plot, curve." },
      { type: "multi", kicker: "On your own", prompt: "Select **all** the true statements about $y = \\sin x$.",
        options: [{ t: "It passes through the origin", ok: true }, { t: "Its period is $2\\pi$", ok: true }, { t: "Its maximum value is 1, at $x = \\frac{\\pi}{2}$", ok: true }, { t: "It is symmetric about the $y$-axis", fb: "That is cosine. Sine is symmetric about the **origin**: $\\sin(-x) = -\\sin x$." }, { t: "Its range is all real numbers", fb: "The range is $-1 \\le y \\le 1$." }],
        skill: "Graph of sine and cosine", hints: ["Remember the five key points."], why: "Through $(0,0)$, period $2\\pi$, range $[-1, 1]$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Use the repeating pattern.** Find $\\sin\\dfrac{7\\pi}{2}$ without a calculator.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\tfrac{7\\pi}{2} = 2\\pi + \\tfrac{3\\pi}{2}", say: "$\\frac{7\\pi}{2}$ is one full period ($2\\pi = \\frac{4\\pi}{2}$) plus $\\frac{3\\pi}{2}$." },
          { step: 2, m: "\\sin\\tfrac{7\\pi}{2} = \\sin\\tfrac{3\\pi}{2}", say: "The wave repeats every $2\\pi$, so the value is the same.", ask: { prompt: "Why can we drop $2\\pi$?", answer: 0, options: [{ t: "The graph repeats every $2\\pi$" }, { t: "$2\\pi$ is zero", fb: "$2\\pi \\approx 6.28$. The **graph repeats**, so adding a period changes nothing." }] } },
          { step: 3, m: "\\sin\\tfrac{3\\pi}{2} = -1", say: "The bottom of the wave." }] },
        gate: true, then: "$\\sin\\dfrac{7\\pi}{2} = -1$." },
      { type: "choice", kicker: "Try it", prompt: "What is the first $x > 0$ where $\\cos x = 0$?",
        options: [{ t: "$\\dfrac{\\pi}{2}$" }, { t: "$\\pi$", fb: "At $\\pi$, $\\cos\\pi = -1$." }, { t: "$0$", fb: "$\\cos 0 = 1$, and the question asks for $x > 0$." }],
        answer: 0, skill: "Graph of sine and cosine", hints: ["Cosine starts at 1 and falls."], why: "$\\cos\\frac{\\pi}{2} = 0$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee sketches $y = \\sin x$ starting at height 1. What is wrong?",
        options: [{ t: "Sine starts at $(0, 0)$. It is **cosine** that starts at 1." }, { t: "Nothing is wrong.", fb: "$\\sin 0 = 0$: the sine wave starts on the axis." }, { t: "Sine starts at $-1$.", fb: "Sine starts at 0 and rises." }],
        answer: 0, skill: "Graph of sine and cosine", hints: ["$\\sin 0 = 0$."], why: "$\\sin 0 = 0$." },
      { type: "num", kicker: "Use it", prompt: "A point goes round the unit circle many times, so its height is $\\sin x$ for large $x$. Find $\\sin\\left(10\\pi + \\dfrac{\\pi}{2}\\right)$.", pre: "$\\sin(\\ldots) =$", answer: 1, skill: "Graph of sine and cosine",
        near: [{ v: 0, fb: "$10\\pi$ is five full periods, so it can be dropped: $\\sin\\frac{\\pi}{2} = 1$." }], hints: ["$10\\pi = 5 \\cdot 2\\pi$."], why: "$\\sin\\frac{\\pi}{2} = 1$." }
    ]
  });

  /* ============================================ 2 · Amplitude and period */
  var HOW_2 = [["Amplitude", "The amplitude is $|A|$: how far the wave rises above its midline."],
               ["Period", "The period is $\\dfrac{2\\pi}{|B|}$: the length of one full wave."],
               ["Key points", "Cut one period into four equal steps and plot the five key points."]];
  var AP2 = function (A, B) { return function (x) { return A * Math.sin(B * x); }; };
  var G2a = function (k) {
    var f = AP2(3, 2), xs = [0, PI / 4, PI / 2, 3 * PI / 4, PI], it = [];
    if (k >= 1) it = it.concat([{ seg: [[-0.4, 3], [3.6, 3]], c: "soft", dash: true }, { seg: [[-0.4, -3], [3.6, -3]], c: "soft", dash: true }]);
    if (k >= 2) it = it.concat(KP(f, xs));
    if (k >= 3) it = it.concat(curve(f, 0, 2 * PI, "blue"));
    return wavefig("The graph of y = 3 sin 2x: amplitude 3 and period pi.", it, { x: [-0.6, 6.9], y: [-3.5, 3.5], u: 32, step: PI / 4, lab: qlab });
  };
  LESSONS.push({
    title: "Amplitude and period", art: "pcwave",
    blurb: "Book 6.1 · $A$ stretches the wave up and down, $B$ squeezes it left and right.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The wave $y = \\sin x$ has a period of $2\\pi \\approx 6.28$. If you squeeze it so it repeats twice as often, what is the new period in terms of $\\pi$? (Type the number in front of $\\pi$.)", pre: "$\\pi \\cdot$", answer: 1, skill: "Period",
        near: [{ v: 4, fb: "Repeating **more** often means a **shorter** period: half of $2\\pi$." }], hints: ["Half of $2\\pi$."], why: "$\\pi$." },
      { type: "learn", kicker: "Explore",
        prompt: "Match the dashed target by sliding $A$ and $B$ in $y = A\\sin(Bx)$. Watch what $A$ does to the **height** and what $B$ does to the **length of a wave**.",
        scene: { type: "sketch", x: [-0.6, 6.9], y: [-3.5, 3.5], u: 36, w: 400, grid: false, gate: true, pts: {},
          params: { A: { min: 0.5, max: 3, step: 0.5, v: 1, label: "$A$" }, B: { min: 0.5, max: 4, step: 0.5, v: 1, label: "$B$" } },
          draw: function (s) { return waveAx(-0.3, 6.6, -3.3, 3.3).concat(curve(AP2(2, 2), 0, 6.6, "orange", null, true), curve(AP2(s.p.A, s.p.B), 0, 6.6, "blue")); },
          readout: function (s) { var A = s.p.A, B = s.p.B, ok = A === 2 && B === 2; return "$y = " + (A === 1 ? "" : nm(A)) + "\\sin(" + (B === 1 ? "" : nm(B)) + "x)$: amplitude $" + nm(A) + "$, period $\\frac{2\\pi}{" + nm(B) + "} \\approx " + nm(f4(2 * PI / B, 2)) + "$" + (ok ? " ✓ on the target" : ""); },
          goal: function (s) { return s.p.A === 2 && s.p.B === 2; } },
        gate: true, then: "$y = 2\\sin 2x$: **amplitude 2** (twice as tall) and **period $\\pi$** (twice as fast). $A$ stretches vertically; a bigger $B$ squeezes the wave horizontally." },
      { type: "learn", kicker: "The idea",
        prompt: "For $y = A\\sin(Bx)$ or $y = A\\cos(Bx)$: the **amplitude** is $|A|$ and the **period** is $\\dfrac{2\\pi}{|B|}$. A **negative** $A$ flips the wave over. Cut one period into four equal steps to find the key points.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch one period of $y = 3\\sin 2x$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "|A| = 3", say: "The wave rises 3 above the axis and falls 3 below.", fig: G2a(1) },
          { step: 2, m: "\\text{period} = \\frac{2\\pi}{2} = \\pi", say: "One full wave takes $\\pi$, not $2\\pi$.", ask: { prompt: "What is $\\frac{2\\pi}{2}$?", answer: 0, options: [{ t: "$\\pi$" }, { t: "$4\\pi$", fb: "Divide by $B = 2$." }] } },
          { step: 3, m: "x: \\ 0, \\ \\tfrac{\\pi}{4}, \\ \\tfrac{\\pi}{2}, \\ \\tfrac{3\\pi}{4}, \\ \\pi", say: "Four equal steps of $\\frac{\\pi}{4}$.", fig: G2a(2) },
          { step: 3, m: "y: \\ 0, \\ 3, \\ 0, \\ -3, \\ 0", say: "Sine's pattern, times the amplitude 3.", fig: G2a(3) }] },
        gate: true, then: "Amplitude 3, period $\\pi$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you analyse $y = -3\\cos 2x$.",
        how: HOW_2, skill: "Amplitude and period",
        steps: [
          { step: 1, ask: "What is the amplitude?", type: "num", pre: "amplitude =", answer: 3, near: [{ v: -3, fb: "Amplitude is a **distance**: it is $|A| = 3$. The minus sign flips the wave." }], hint: "$|-3|$.", m: "|A| = 3", say: "The minus sign only flips the wave." },
          { step: 2, ask: "The period is $\\dfrac{2\\pi}{2} =$ (type it as an expression)", type: "num", pre: "period $\\approx$", answer: 3.1416, tol: 0.0006, calc: true, near: [{ v: 6.2832, tol: 0.0006, fb: "That is $2\\pi$: divide by $B = 2$." }], hint: "$\\pi \\approx 3.1416$.", m: "\\text{period} = \\pi", say: "One wave in $\\pi$." },
          { step: 3, ask: "A cosine starts at its maximum. Because $A = -3 < 0$, this wave starts at…", type: "choice", answer: 0, options: [{ t: "its **minimum**, $-3$" }, { t: "its maximum, 3", fb: "The minus sign flips the wave: where $\\cos$ would be at its peak, this is at its trough." }], m: "(0, -3)", say: "Then it rises to 3 at $x = \\frac{\\pi}{2}$." }],
        why: "Amplitude, period, key points." },
      { type: "choice", kicker: "On your own", prompt: "What is the period of $y = \\sin 3x$?",
        options: [{ t: "$\\dfrac{2\\pi}{3}$" }, { t: "$6\\pi$", fb: "Divide $2\\pi$ by $B = 3$; do not multiply." }, { t: "$3$", fb: "The period is $\\frac{2\\pi}{B}$, not $B$." }],
        answer: 0, skill: "Amplitude and period", hints: ["$\\frac{2\\pi}{|B|}$."], why: "$\\frac{2\\pi}{3}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A fractional $B$.** Analyse $y = 2\\cos\\dfrac{x}{4}$ and find where it first returns to its maximum.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "|A| = 2", say: "The wave runs from $-2$ to $2$." },
          { step: 2, m: "B = \\tfrac{1}{4}", say: "$\\frac{x}{4}$ is $\\frac{1}{4}x$.", ask: { prompt: "So the period is $\\frac{2\\pi}{1/4} =$", answer: 0, options: [{ t: "$8\\pi$" }, { t: "$\\frac{\\pi}{2}$", fb: "Dividing by $\\frac{1}{4}$ multiplies by 4: $2\\pi \\cdot 4$." }] } },
          { step: 2, m: "\\text{period} = 8\\pi", say: "A very stretched-out wave." },
          { step: 3, m: "\\text{maximum at } x = 0 \\text{ and } x = 8\\pi", say: "A cosine starts at its maximum and returns after one period." }] },
        gate: true, then: "A small $B$ **stretches** the wave: the period $8\\pi$ is four times the usual $2\\pi$." },
      { type: "num", kicker: "Try it", prompt: "What is the amplitude of $y = -\\dfrac{1}{2}\\sin 5x$? (A decimal is fine.)", pre: "amplitude =", answer: 0.5, tol: 1e-9, shown: "1/2", skill: "Amplitude and period",
        near: [{ v: -0.5, tol: 1e-9, fb: "Amplitude is always positive: $|A|$." }, { v: 5, fb: "5 is $B$. The amplitude is $|A|$." }], hints: ["$|A| = \\left|-\\frac{1}{2}\\right|$."], why: "$\\frac{1}{2}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben says the period of $y = \\sin 4x$ is $4$ \"because $B = 4$\". What is wrong?",
        options: [{ t: "The period is $\\frac{2\\pi}{B} = \\frac{2\\pi}{4} = \\frac{\\pi}{2}$." }, { t: "Nothing is wrong.", fb: "The wave would repeat every 4 units only if $B$ were $\\frac{\\pi}{2}$. The period is $\\frac{2\\pi}{B}$." }, { t: "The period is $8\\pi$.", fb: "A larger $B$ makes the period **shorter**." }],
        answer: 0, skill: "Amplitude and period", hints: ["Period $= \\frac{2\\pi}{|B|}$."], why: "$\\frac{\\pi}{2}$." },
      { type: "num", kicker: "Use it", prompt: "The depth of tide in a harbour is modelled by $h = 3\\sin\\left(\\dfrac{\\pi}{6}t\\right)$ metres from its average, with $t$ in hours. How many hours is one full tide cycle?", post: "hours", answer: 12, skill: "Amplitude and period",
        near: [{ v: 6, fb: "That is a half cycle. The period is $\\frac{2\\pi}{\\pi/6}$." }, { v: 3, fb: "3 is the amplitude, in metres." }], hints: ["$\\frac{2\\pi}{B}$ with $B = \\frac{\\pi}{6}$."], why: "$\\frac{2\\pi}{\\pi/6} = 12$ hours." }
    ]
  });

  /* ============================================ 3 · Phase shift and vertical shift */
  var HOW_3 = [["Midline", "The midline is $y = D$. The wave swings $|A|$ above and below it."],
               ["Shift", "$C$ is the phase shift: right if positive, left if negative."],
               ["Key points", "Start at the shifted start, then step a quarter period at a time."]];
  var SH3 = function (A, B, C, D) { return function (x) { return A * Math.sin(B * (x - C)) + D; }; };
  var G3 = function (k) {
    var f = SH3(2, 1, PI / 3, 1), xs = [PI / 3, 5 * PI / 6, 4 * PI / 3, 11 * PI / 6, 7 * PI / 3], it = [];
    if (k >= 1) it.push({ seg: [[-0.6, 1], [7.4, 1]], c: "orange", dash: true });
    if (k >= 2) it = it.concat(KP(f, xs));
    if (k >= 3) it = it.concat(curve(f, -0.5, 7.4, "blue"));
    return wavefig("The graph of y = 2 sin(x - pi/3) + 1, a sine wave with midline y = 1 starting at x = pi/3.", it, { x: [-0.6, 7.4], y: [-2, 3.5], u: 36 });
  };
  LESSONS.push({
    title: "Phase shift and vertical shift", art: "pcwave",
    blurb: "Book 6.1 · The same wave, slid sideways and lifted up.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The graph of $y = f(x + 2) - 3$ is the graph of $f$ moved…",
        options: [{ t: "2 left and 3 down" }, { t: "2 right and 3 down", fb: "$x + 2$ moves the graph **left**." }, { t: "2 left and 3 up", fb: "$-3$ moves it down." }],
        answer: 0, skill: "Shifts", hints: ["Inside: opposite. Outside: as it says."], why: "Left 2, down 3." },
      { type: "learn", kicker: "Explore",
        prompt: "Match the dashed target with $y = \\sin(x - C) + D$. Slide $C$ (in steps of $\\frac{\\pi}{4}$) and $D$. Watch the **orange midline**.",
        scene: { type: "sketch", x: [-3.4, 7.4], y: [-2.5, 3.5], u: 34, w: 400, grid: false, gate: true, pts: {},
          params: { k: { min: -4, max: 6, step: 1, v: 0, label: "$C$ (× π/4)" }, D: { min: -2, max: 2, step: 1, v: 0, label: "$D$" } },
          draw: function (s) { var C = s.p.k * PI / 4, D = s.p.D; return waveAx(-3.2, 7.2, -2.3, 3.3).concat(curve(SH3(1, 1, PI / 2, 1), -3.2, 7.2, "orange", null, true), [{ seg: [[-3.2, D], [7.2, D]], c: "purple", dash: true }], curve(SH3(1, 1, C, D), -3.2, 7.2, "blue")); },
          readout: function (s) { var k = s.p.k, D = s.p.D, ok = k === 2 && D === 1; return "$y = \\sin(x " + (k < 0 ? "+ " : "- ") + (k === 0 ? "0" : radTex(45 * Math.abs(k))) + ")" + (D < 0 ? " - " + nm(-D) : D > 0 ? " + " + nm(D) : "") + "$: " + (k === 0 ? "not shifted sideways" : "shifted " + (k > 0 ? "right" : "left") + " $" + radTex(45 * Math.abs(k)) + "$") + ", midline $y = " + nm(D) + "$" + (ok ? " ✓ on the target" : ""); },
          goal: function (s) { return s.p.k === 2 && s.p.D === 1; } },
        gate: true, then: "$y = \\sin\\left(x - \\frac{\\pi}{2}\\right) + 1$. The **phase shift** $C = \\frac{\\pi}{2}$ moves the wave right; $D = 1$ lifts it, and the **midline** moves to $y = D$." },
      { type: "learn", kicker: "The idea",
        prompt: "In $y = A\\sin(B(x - C)) + D$: **$D$** is the vertical shift and the **midline** is $y = D$. **$C$** is the **phase shift** (right if positive). If the formula is written $\\sin(Bx - E)$, **factor out $B$** first: $\\sin(Bx - E) = \\sin\\left(B\\left(x - \\frac{E}{B}\\right)\\right)$.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch one period of $y = 2\\sin\\left(x - \\dfrac{\\pi}{3}\\right) + 1$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "A = 2, \\ \\ D = 1", say: "Midline $y = 1$; the wave runs from $1 - 2 = -1$ up to $1 + 2 = 3$.", fig: G3(1) },
          { step: 2, m: "C = \\tfrac{\\pi}{3}", say: "The wave starts at $x = \\frac{\\pi}{3}$ instead of 0.", ask: { prompt: "Does it move left or right?", answer: 0, options: [{ t: "Right: $x - \\frac{\\pi}{3}$" }, { t: "Left", fb: "$x - C$ with $C > 0$ moves the graph right." }] } },
          { step: 3, m: "x: \\tfrac{\\pi}{3}, \\ \\tfrac{5\\pi}{6}, \\ \\tfrac{4\\pi}{3}, \\ \\tfrac{11\\pi}{6}, \\ \\tfrac{7\\pi}{3}", say: "Start at $\\frac{\\pi}{3}$ and step a quarter period ($\\frac{\\pi}{2}$) each time.", fig: G3(2) },
          { step: 3, m: "y: \\ 1, \\ 3, \\ 1, \\ -1, \\ 1", say: "Midline, top, midline, bottom, midline.", fig: G3(3) }] },
        gate: true, then: "Midline $y = 1$, amplitude 2, period $2\\pi$, starting at $x = \\frac{\\pi}{3}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you analyse $y = \\cos\\left(x + \\dfrac{\\pi}{2}\\right) - 1$.",
        how: HOW_3, skill: "Phase shift and vertical shift",
        steps: [
          { step: 1, ask: "What is the midline? $y =$", type: "num", pre: "$y =$", answer: -1, near: [{ v: 1, fb: "$-1$ at the end is $D$: the midline is $y = -1$, below the axis." }], hint: "The number added at the end.", m: "y = -1", say: "The wave swings 1 above and below $-1$." },
          { step: 2, ask: "$x + \\frac{\\pi}{2} = x - \\left(-\\frac{\\pi}{2}\\right)$, so the wave moves…", type: "choice", answer: 0, options: [{ t: "left $\\frac{\\pi}{2}$" }, { t: "right $\\frac{\\pi}{2}$", fb: "$x + \\frac{\\pi}{2}$ has $C = -\\frac{\\pi}{2}$: left." }], m: "C = -\\tfrac{\\pi}{2}", say: "A negative phase shift." },
          { step: 3, ask: "A normal cosine peaks at $x = 0$. This one peaks at $x =$ (type it as an expression)", type: "num", pre: "$x \\approx$", answer: -1.5708, tol: 0.0006, calc: true, near: [{ v: 1.5708, tol: 0.0006, fb: "It moved **left**, so the peak is at a negative $x$." }], hint: "$0 - \\frac{\\pi}{2}$.", m: "x = -\\tfrac{\\pi}{2}", say: "The maximum, at height $1 + (-1) = 0$." }],
        why: "Midline, shift, key points." },
      { type: "choice", kicker: "On your own", prompt: "What is the phase shift of $y = \\sin\\left(2x - \\pi\\right)$? (Factor out the 2 first.)",
        options: [{ t: "right $\\dfrac{\\pi}{2}$" }, { t: "right $\\pi$", fb: "$2x - \\pi = 2\\left(x - \\frac{\\pi}{2}\\right)$: the shift is $\\frac{\\pi}{2}$, not $\\pi$." }, { t: "left $\\dfrac{\\pi}{2}$", fb: "$x - \\frac{\\pi}{2}$ moves the graph to the right." }],
        answer: 0, skill: "Phase shift and vertical shift", hints: ["Factor 2 out of $2x - \\pi$."], why: "$2\\left(x - \\frac{\\pi}{2}\\right)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A stretched, flipped and shifted wave.** Analyse $y = -3\\cos\\left(2x + \\pi\\right) + 2$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "\\text{midline } y = 2, \\ \\ |A| = 3", say: "The wave runs between $2 - 3 = -1$ and $2 + 3 = 5$." },
          { step: 2, m: "2x + \\pi = 2\\left(x + \\tfrac{\\pi}{2}\\right)", say: "Factor out $B = 2$.", ask: { prompt: "So the phase shift is…", answer: 0, options: [{ t: "left $\\frac{\\pi}{2}$" }, { t: "left $\\pi$", fb: "Divide by 2: $\\frac{\\pi}{2}$." }] } },
          { step: 2, m: "\\text{period} = \\tfrac{2\\pi}{2} = \\pi", say: "The factor 2 also shortens the period." },
          { step: 3, m: "\\text{start: } x = -\\tfrac{\\pi}{2}, \\ y = 2 - 3 = -1", say: "A cosine starts at its peak, but $A = -3$ flips it: it starts at the **bottom** of the wave." }] },
        gate: true, then: "Midline 2, amplitude 3, period $\\pi$, shifted left $\\frac{\\pi}{2}$, starting at a minimum." },
      { type: "num", kicker: "Try it", prompt: "What is the midline of $y = 4\\sin(3x) - 5$? $y =$", pre: "$y =$", answer: -5, skill: "Phase shift and vertical shift",
        near: [{ v: 5, fb: "The midline is $y = D$ where $D = -5$." }, { v: 4, fb: "4 is the amplitude." }], hints: ["The number added at the end."], why: "$y = -5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Amy says $y = \\sin\\left(x + \\dfrac{\\pi}{4}\\right)$ is $\\sin x$ shifted **right** $\\frac{\\pi}{4}$. What is wrong?",
        options: [{ t: "$x + \\frac{\\pi}{4} = x - \\left(-\\frac{\\pi}{4}\\right)$: it moves **left** $\\frac{\\pi}{4}$." }, { t: "Nothing is wrong.", fb: "At $x = -\\frac{\\pi}{4}$ the inside is 0, so the wave starts at $-\\frac{\\pi}{4}$: to the left." }, { t: "It moves up $\\frac{\\pi}{4}$.", fb: "A number inside the bracket shifts sideways." }],
        answer: 0, skill: "Phase shift and vertical shift", hints: ["Where does the inside equal 0?"], why: "Left $\\frac{\\pi}{4}$." },
      { type: "num", kicker: "Use it", prompt: "A Ferris wheel car's height (m) is $h = 25 + 20\\sin\\left(\\dfrac{\\pi}{40}(t - 20)\\right)$ at $t$ seconds. What is its height at $t = 20$?", post: "m", answer: 25, skill: "Phase shift and vertical shift",
        near: [{ v: 45, fb: "At $t = 20$ the inside of the sine is 0, so the sine is 0, not at its peak." }, { v: 5, fb: "That is the lowest point. At $t = 20$ the sine is 0." }], hints: ["$\\sin 0 = 0$."], why: "$25 + 20 \\cdot 0 = 25$: on the midline." }
    ]
  });
  /* ============================================ 4 · Writing a sinusoidal function from a graph */
  var HOW_4 = [["Midline", "Midline $D = \\frac{\\max + \\min}{2}$ and amplitude $|A| = \\frac{\\max - \\min}{2}$."],
               ["Period", "The period $T$ is the distance between two peaks. Then $B = \\dfrac{2\\pi}{T}$."],
               ["Shift", "Use cosine with $C$ at a peak, or sine with $C$ where it crosses the midline going up."]];
  var CO4 = function (A, B, C, D) { return function (x) { return A * Math.cos(B * (x - C)) + D; }; };
  var G4 = function (k) {
    var f = CO4(3, PI / 3, 1, 2), it = [];
    if (k >= 1) it.push({ seg: [[-2.8, 2], [8.8, 2]], c: "orange", dash: true });
    if (k >= 2) it = it.concat([dot(1, 5, "orange"), dot(4, -1, "orange"), dot(7, 5, "orange")]);
    if (k >= 3) it = it.concat(curve(f, -2.8, 8.8, "blue"));
    return grid("A wave with a maximum of 5 at x = 1 and a minimum of -1 at x = 4.", it, { x: [-3, 9], y: [-2, 6], u: 30 });
  };
  LESSONS.push({
    title: "Writing a sinusoidal function from a graph", art: "pcwave",
    blurb: "Book 6.1 · Read the peaks and troughs, and build the formula.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A wave has a highest point 5 and a lowest point $-1$. What number is exactly halfway between them?", answer: 2, skill: "Midpoint",
        near: [{ v: 3, fb: "Half the **distance** is 3. The halfway **value** is $\\frac{5 + (-1)}{2}$." }, { v: 4, fb: "That is $5 - 1$. Add $5 + (-1) = 4$ and then halve." }], hints: ["$\\frac{5 + (-1)}{2}$."], why: "$\\frac{4}{2} = 2$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dots are peaks and troughs of a wave. Build $y = A\\cos(B(x - C)) + D$ to pass through all of them. $B$ is in steps of $\\frac{\\pi}{6}$. Slide $A$, $D$, $B$ and $C$.",
        scene: { type: "sketch", x: [-3, 9], y: [-2, 6], u: 28, w: 384, gate: true, pts: {},
          params: { A: { min: 1, max: 4, step: 1, v: 1, label: "$A$" }, D: { min: -1, max: 4, step: 1, v: 0, label: "$D$" }, k: { min: 1, max: 6, step: 1, v: 1, label: "$B$ (× π/6)" }, C: { min: -2, max: 5, step: 1, v: 0, label: "$C$" } },
          draw: function (s) { return curve(CO4(s.p.A, s.p.k * PI / 6, s.p.C, s.p.D), -3, 9, "blue", [-2, 6]).concat([dot(1, 5, "orange"), dot(4, -1, "orange"), dot(7, 5, "orange"), dot(-2, -1, "orange")]); },
          readout: function (s) { var p = s.p, ok = p.A === 3 && p.D === 2 && p.k === 2 && p.C === 1; return "$y = " + nm(p.A) + "\\cos\\left(" + radTex(30 * p.k) + "(x " + (p.C < 0 ? "+ " + nm(-p.C) : p.C > 0 ? "- " + nm(p.C) : "") + ")\\right) " + (p.D < 0 ? "- " + nm(-p.D) : "+ " + nm(p.D)) + "$" + (ok ? " ✓ through every dot" : ""); },
          goal: function (s) { var p = s.p; return p.A === 3 && p.D === 2 && p.k === 2 && p.C === 1; } },
        gate: true, then: "$y = 3\\cos\\left(\\frac{\\pi}{3}(x - 1)\\right) + 2$. **Midline** $2$ is halfway between 5 and $-1$; **amplitude** 3 is half the distance between them; the peaks are 6 apart, so the **period** is 6 and $B = \\frac{2\\pi}{6}$; the first peak is at $x = 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "From the graph: **midline** $D$ is halfway between max and min; **amplitude** $|A|$ is half the distance between them; the **period** $T$ is the distance between two peaks, and $B = \\frac{2\\pi}{T}$. Use cosine shifted to a **peak**, or sine shifted to a midline crossing going **up**.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "A wave has a maximum of 5 at $x = 1$ and its next minimum of $-1$ at $x = 4$. Write its formula.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "D = \\frac{5 + (-1)}{2} = 2", say: "Halfway between the top and bottom.", fig: G4(1) },
          { step: 1, m: "|A| = \\frac{5 - (-1)}{2} = 3", say: "Half the distance from top to bottom.", ask: { prompt: "What is $5 - (-1)$?", answer: 0, options: [{ t: "$6$" }, { t: "$4$", fb: "Subtracting a negative adds: $5 + 1$." }] } },
          { step: 2, m: "T = 2 \\cdot (4 - 1) = 6", say: "A peak to the next trough is half a period.", fig: G4(2) },
          { step: 2, m: "B = \\frac{2\\pi}{6} = \\frac{\\pi}{3}", say: "$B = \\frac{2\\pi}{T}$." },
          { step: 3, m: "y = 3\\cos\\left(\\tfrac{\\pi}{3}(x - 1)\\right) + 2", say: "A cosine, shifted to put its peak at $x = 1$.", fig: G4(3) }] },
        gate: true, then: "$y = 3\\cos\\left(\\dfrac{\\pi}{3}(x - 1)\\right) + 2$." },
      { type: "guided", kicker: "Together",
        prompt: "Now a wave has a maximum of 4 at $x = 0$ and a minimum of $-2$ at $x = 5$.",
        how: HOW_4, skill: "Writing a sinusoid",
        steps: [
          { step: 1, ask: "The midline $D = \\dfrac{4 + (-2)}{2} =$", type: "num", pre: "$D =$", answer: 1, near: [{ v: 3, fb: "$\\frac{4 - 2}{2}$: add the max and the min, then halve." }], hint: "$\\frac{2}{2}$.", m: "D = 1", say: "Halfway." },
          { step: 1, ask: "The amplitude $|A| = \\dfrac{4 - (-2)}{2} =$", type: "num", pre: "$|A| =$", answer: 3, near: [{ v: 1, fb: "Subtract the min from the max: $4 + 2$, then halve." }], hint: "$\\frac{6}{2}$.", m: "|A| = 3", say: "Half the height." },
          { step: 2, ask: "Max to min is half a period (5), so $T = 10$ and $B = \\dfrac{2\\pi}{10}$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", type: "num", pre: "$B \\approx$", answer: 0.6283, tol: 0.0006, calc: true, near: [{ v: 10, fb: "10 is the period $T$. $B = \\frac{2\\pi}{T}$." }], hint: "$\\frac{\\pi}{5}$.", m: "B = \\tfrac{\\pi}{5}", say: "One wave every 10." },
          { step: 3, ask: "The peak is at $x = 0$, so no shift is needed. The formula is…", type: "choice", answer: 0, options: [{ t: "$y = 3\\cos\\left(\\frac{\\pi}{5}x\\right) + 1$" }, { t: "$y = 3\\sin\\left(\\frac{\\pi}{5}x\\right) + 1$", fb: "Sine starts on the midline. Cosine starts at a peak, as this wave does." }], m: "y = 3\\cos\\left(\\tfrac{\\pi}{5}x\\right) + 1", say: "Cosine with no shift." }],
        why: "Midline, period, shift." },
      { type: "choice", kicker: "On your own", prompt: "A cosine wave has amplitude 2, midline $y = 1$, period $\\pi$ and a peak at $x = 0$. Which formula?",
        options: [{ t: "$y = 2\\cos 2x + 1$" }, { t: "$y = 2\\cos x + 1$", fb: "That has period $2\\pi$. Period $\\pi$ needs $B = \\frac{2\\pi}{\\pi} = 2$." }, { t: "$y = \\cos 2x + 2$", fb: "The amplitude is the number in front of the cosine (2) and the midline is added (1)." }],
        answer: 0, skill: "Writing a sinusoid", hints: ["$B = \\frac{2\\pi}{T}$."], why: "$B = 2$, $A = 2$, $D = 1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Use a sine instead.** A wave crosses its midline $y = 0$ **going up** at $x = 2$, has amplitude 4, and its period is 8. Write it as a sine.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "D = 0, \\ \\ A = 4", say: "The midline is 0 and the wave swings 4 either way." },
          { step: 2, m: "B = \\frac{2\\pi}{8} = \\frac{\\pi}{4}", say: "$B = \\frac{2\\pi}{T}$.", ask: { prompt: "What is $\\frac{2\\pi}{8}$?", answer: 0, options: [{ t: "$\\frac{\\pi}{4}$" }, { t: "$4\\pi$", fb: "Divide $2\\pi$ by the period, 8." }] } },
          { step: 3, m: "y = 4\\sin\\left(\\tfrac{\\pi}{4}(x - 2)\\right)", say: "A sine starts on the midline going up, so shift it to start at $x = 2$." },
          { step: 3, m: "y(2) = 4\\sin 0 = 0", say: "Check: it is on the midline at $x = 2$." }] },
        gate: true, then: "$y = 4\\sin\\left(\\dfrac{\\pi}{4}(x - 2)\\right)$." },
      { type: "num", kicker: "Try it", prompt: "A wave has a maximum of 10 and a minimum of 2. What is its midline?", pre: "$D =$", answer: 6, skill: "Writing a sinusoid",
        near: [{ v: 4, fb: "That is the amplitude, $\\frac{10 - 2}{2}$. The midline is $\\frac{10 + 2}{2}$." }, { v: 8, fb: "That is the distance between max and min. The midline is the average." }], hints: ["$\\frac{10 + 2}{2}$."], why: "$6$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kay says the amplitude of a wave with maximum 5 and minimum $-1$ is $5 - (-1) = 6$. What is wrong?",
        options: [{ t: "6 is the full height. The amplitude is **half** of it, 3." }, { t: "Nothing is wrong.", fb: "Amplitude is measured from the midline, not from bottom to top." }, { t: "The amplitude is 5.", fb: "That is the maximum, not the distance from the midline." }],
        answer: 0, skill: "Writing a sinusoid", hints: ["Amplitude = distance from the midline to a peak."], why: "$\\frac{6}{2} = 3$." },
      { type: "num", kicker: "Use it", prompt: "The temperature $T$ (°F) is hottest, 80°, at 3 pm ($t = 15$) and coldest, 60°, 12 hours later. A model is $T = 10\\cos\\left(\\dfrac{\\pi}{12}(t - 15)\\right) + 70$. What is the temperature at 9 am ($t = 9$)?", post: "°F", answer: 70, skill: "Writing a sinusoid",
        near: [{ v: 80, fb: "That is the peak, at $t = 15$." }, { v: 60, fb: "That is the low, at $t = 3$." }], hints: ["$\\frac{\\pi}{12}(9 - 15) = -\\frac{\\pi}{2}$, and $\\cos\\left(-\\frac{\\pi}{2}\\right) = 0$."], why: "$10 \\cdot 0 + 70 = 70$." }
    ]
  });

  /* ============================================ 5 · Modeling with sinusoids */
  var HOW_5 = [["Read", "Find the highest and lowest values and the time of one full cycle."],
               ["Build", "Midline $D$, amplitude $|A|$, $B = \\frac{2\\pi}{T}$. Use $-\\cos$ if it starts at the bottom."],
               ["Use it", "Evaluate the model for a value, or solve it for a time."]];
  var FW5 = function (t) { return 25 - 20 * Math.cos(2 * PI * t / 80); };
  var G5 = grid("The height of a Ferris wheel car over time: a wave from 5 m at the start up to 45 m at 40 seconds, with midline 25.",
    curve(FW5, 0, 160, "blue").concat([{ seg: [[0, 25], [160, 25]], c: "orange", dash: true }, dot(0, 5, "orange"), dot(40, 45, "orange"), dot(80, 5, "orange")]),
    { x: [0, 160], y: [0, 50], u: 2.6, uy: 5.4, gx: 20, step: 20, gy: 10, stepY: 10 });
  LESSONS.push({
    title: "Modeling with sinusoids", art: "pcwave",
    blurb: "Book 6.1 · Ferris wheels, tides and temperature: anything that cycles.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A Ferris wheel's lowest car is 5 m above the ground and its highest is 45 m. How far above the ground is the **centre** of the wheel?", post: "m", answer: 25, skill: "Midpoint",
        near: [{ v: 20, fb: "That is the radius, half the distance between lowest and highest. The centre is the average height." }, { v: 40, fb: "That is the diameter (45 − 5)." }], hints: ["$\\frac{5 + 45}{2}$."], why: "$25$ m." },
      { type: "learn", kicker: "Explore",
        prompt: "A Ferris wheel car starts at the **bottom** (5 m) and one turn takes 80 seconds. Slide the time and watch its height. Find the **first time it is at the top**, and the **first time it is at the height of the centre** (25 m).",
        scene: { type: "sketch", x: [0, 160], y: [0, 50], u: 2.6, uy: 5.4, gx: 20, step: 20, gy: 10, stepY: 10, w: 440, gate: true, pts: {},
          params: { t: { min: 0, max: 160, step: 10, v: 0, label: "time (s)" } },
          track: function (s) { var t = s.p.t; return t === 40 ? "top" : t === 20 ? "mid" : null; },
          draw: function (s) { var t = s.p.t, h = FW5(t); return curve(FW5, 0, 160, "soft").concat(t > 0 ? curve(FW5, 0, t, "blue") : [], [{ seg: [[0, 25], [160, 25]], c: "orange", dash: true }, { seg: [[t, 0], [t, h]], c: "soft", dash: true }, dot(t, h, h === 45 ? "green" : "blue")]); },
          readout: function (s) { var t = s.p.t, h = FW5(t); return "$t = " + t + "$ s: height $" + nm(f4(h, 1)) + "$ m" + (h === 45 ? " — **the top!**" : h === 5 ? " — the bottom" : Math.abs(h - 25) < 1e-9 ? " — level with the centre" : "") + "<br>Top found: " + (s.tracked.top ? "✓" : "—") + " · centre height found: " + (s.tracked.mid ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.top && s.tracked.mid); } },
        gate: true, then: "It reaches the top after **half** a turn, 40 s, and passes the centre height after a **quarter** turn, 20 s. The height is a **sinusoid**: midline 25, amplitude 20, period 80." },
      { type: "learn", kicker: "The idea",
        prompt: "Anything that **cycles** can be modelled by a sinusoid: $y = A\\cos(Bt) + D$ or $y = -A\\cos(Bt) + D$ if it starts at the bottom. Read off the **maximum**, **minimum** and the **time of one cycle**, then build $D$, $A$ and $B = \\frac{2\\pi}{T}$.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "A Ferris wheel's lowest point is 5 m and its highest is 45 m. One turn takes 80 s and a rider starts at the bottom. Model the height.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "\\max = 45, \\ \\ \\min = 5, \\ \\ T = 80", say: "Read the facts." },
          { step: 2, m: "D = \\tfrac{45 + 5}{2} = 25", say: "The midline: halfway between top and bottom." },
          { step: 2, m: "A = \\tfrac{45 - 5}{2} = 20", say: "The amplitude: half the distance between them.", ask: { prompt: "The rider starts at the **bottom**. So we use…", answer: 0, options: [{ t: "$-\\cos$: a cosine flipped over" }, { t: "$+\\cos$", fb: "$+\\cos$ would start at the top. We start at the bottom." }] } },
          { step: 2, m: "B = \\frac{2\\pi}{80} = \\frac{\\pi}{40}", say: "One cycle every 80 seconds." },
          { step: 3, m: "h(t) = -20\\cos\\left(\\tfrac{\\pi}{40}t\\right) + 25", say: "Check: $h(0) = -20 + 25 = 5$ and $h(40) = 20 + 25 = 45$.", fig: G5 }] },
        gate: true, then: "$h(t) = -20\\cos\\left(\\dfrac{\\pi}{40}t\\right) + 25$." },
      { type: "guided", kicker: "Together",
        prompt: "Now a tide. High tide is 4 m at $t = 0$ and low tide is 1 m at $t = 6$ hours. Model $h(t)$.",
        how: HOW_5, skill: "Modeling with sinusoids",
        steps: [
          { step: 1, ask: "Starting at the **high** point means we use…", type: "choice", answer: 0, options: [{ t: "$+\\cos$" }, { t: "$-\\cos$", fb: "A cosine starts at its maximum, so $+\\cos$ matches a start at the top." }], m: "h(t) = A\\cos(Bt) + D", say: "Cosine." },
          { step: 2, ask: "$D = \\dfrac{4 + 1}{2} =$ (a decimal is fine)", type: "num", pre: "$D =$", answer: 2.5, tol: 1e-9, near: [{ v: 1.5, fb: "That is the amplitude, $\\frac{4 - 1}{2}$." }], hint: "$\\frac{5}{2}$.", m: "D = 2.5, \\ \\ A = 1.5", say: "Midline 2.5, amplitude 1.5." },
          { step: 2, ask: "High to low is half a cycle (6 h), so $T = 12$ and $B = \\dfrac{2\\pi}{12} = \\dfrac{\\pi}{6}$. At $t = 3$ the cosine is $\\cos\\frac{\\pi}{2} = 0$. So $h(3) =$", type: "num", pre: "$h(3) =$", post: "m", answer: 2.5, tol: 1e-9, near: [{ v: 4, fb: "That is the high tide, at $t = 0$." }], hint: "$1.5 \\cdot 0 + 2.5$.", m: "h(t) = 1.5\\cos\\left(\\tfrac{\\pi}{6}t\\right) + 2.5", say: "Halfway between high and low." },
          { step: 3, ask: "Check the model at the low tide: $h(6) = 1.5\\cos\\pi + 2.5 =$", type: "num", pre: "$h(6) =$", post: "m", answer: 1, near: [{ v: 4, fb: "$\\cos\\pi = -1$: so $-1.5 + 2.5$." }], hint: "$-1.5 + 2.5$.", m: "h(6) = 1", say: "It matches the low tide." }],
        why: "Read, build, use it." },
      { type: "num", kicker: "On your own", prompt: "Using $h(t) = 1.5\\cos\\left(\\dfrac{\\pi}{6}t\\right) + 2.5$, find the tide height at $t = 2$ hours. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$h(2) =$", post: "m", answer: 3.25, tol: 0.006, calc: true, skill: "Modeling with sinusoids",
        near: [{ v: 4, fb: "That is the high tide at $t = 0$." }], hints: ["$\\cos\\frac{\\pi}{3} = \\frac{1}{2}$."], why: "$1.5 \\cdot 0.5 + 2.5 = 3.25$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Solve for the time.** When is the Ferris wheel car **first** at a height of 35 m?",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "-20\\cos\\left(\\tfrac{\\pi}{40}t\\right) + 25 = 35", say: "Set the model equal to 35." },
          { step: 2, m: "\\cos\\left(\\tfrac{\\pi}{40}t\\right) = -\\tfrac{1}{2}", say: "Subtract 25, then divide by $-20$.", ask: { prompt: "$(35 - 25) \\div (-20) =$", answer: 0, options: [{ t: "$-\\frac{1}{2}$" }, { t: "$\\frac{1}{2}$", fb: "Dividing by $-20$ makes it negative." }] } },
          { step: 2, m: "\\tfrac{\\pi}{40}t = \\tfrac{2\\pi}{3}", say: "The first angle with cosine $-\\frac{1}{2}$ is $\\frac{2\\pi}{3}$ ($120^\\circ$)." },
          { step: 3, m: "t = \\tfrac{2\\pi}{3} \\cdot \\tfrac{40}{\\pi} = \\tfrac{80}{3} \\approx 26.67", say: "Multiply both sides by $\\frac{40}{\\pi}$." }] },
        gate: true, then: "About 26.7 seconds (and again at $80 - 26.67 \\approx 53.3$ s on the way down)." },
      { type: "choice", kicker: "Try it", prompt: "For how long in each 80-second turn is the car **above** the centre height (25 m)?",
        options: [{ t: "40 s: half the turn" }, { t: "20 s", fb: "It is above the centre for the whole top half of the wheel: half the turn." }, { t: "80 s", fb: "That is the whole turn." }],
        answer: 0, skill: "Modeling with sinusoids", hints: ["The wave spends equal time above and below its midline."], why: "$\\frac{80}{2} = 40$ s." },
      { type: "choice", kicker: "Find the error",
        prompt: "A model is $T = 10\\cos\\left(\\dfrac{\\pi}{12}t\\right) + 70$. Leo says its period is 12 hours. What is wrong?",
        options: [{ t: "The period is $\\frac{2\\pi}{B} = \\frac{2\\pi}{\\pi/12} = 24$ hours." }, { t: "Nothing is wrong.", fb: "12 is the half-period. A full cycle takes 24 hours." }, { t: "The period is $\\frac{\\pi}{12}$.", fb: "That is $B$. The period is $\\frac{2\\pi}{B}$." }],
        answer: 0, skill: "Modeling with sinusoids", hints: ["$\\frac{2\\pi}{B}$."], why: "$24$ hours." },
      { type: "num", kicker: "Use it", prompt: "A mass on a spring moves up and down as $y = 4\\cos(2\\pi t)$ cm, with $t$ in seconds. How many full oscillations does it make **per second**? (Frequency $= \\frac{1}{\\text{period}}$.)", answer: 1, skill: "Modeling with sinusoids",
        near: [{ v: 6.28, tol: 0.01, fb: "That is $B = 2\\pi$. The period is $\\frac{2\\pi}{B} = 1$ s, so 1 oscillation per second." }, { v: 4, fb: "4 is the amplitude in cm." }], hints: ["Period $= \\frac{2\\pi}{2\\pi}$."], why: "Period 1 s: 1 oscillation per second." }
    ]
  });
  /* ============================================ 6 · The graph of the tangent function */
  var TAN = function (x) { return Math.tan(x); }, SEC = function (x) { return 1 / Math.cos(x); }, CSC = function (x) { return 1 / Math.sin(x); }, COT = function (x) { return Math.cos(x) / Math.sin(x); };
  var ASYM = function (xs, y0, y1, c) { return xs.map(function (x) { return { seg: [[x, y0], [x, y1]], c: c || "orange", dash: true }; }); };
  var HOW_6 = [["Asymptotes", "$\\tan x = \\frac{\\sin x}{\\cos x}$ is undefined where $\\cos x = 0$: $x = \\frac{\\pi}{2} + k\\pi$."],
               ["Key points", "Zeros at $x = k\\pi$, and the points $\\left(\\pm\\frac{\\pi}{4}, \\pm 1\\right)$."],
               ["Branch", "Draw a rising curve between the asymptotes; then repeat every $\\pi$."]];
  var T6 = function (A, B) { return function (x) { return A * Math.tan(B * x); }; };
  var G6 = function (k) {
    var f = T6(2, 0.5), it = [];
    if (k >= 1) it = it.concat(ASYM([-PI, PI], -4.8, 4.8));
    if (k >= 2) it = it.concat([dot(-PI / 2, -2, "orange"), dot(0, 0, "orange"), dot(PI / 2, 2, "orange")]);
    if (k >= 3) it = it.concat(curve(f, -3.1, 3.1, "blue", [-4.8, 4.8]));
    return wavefig("The graph of y = 2 tan(x/2): one branch between the asymptotes x = -pi and x = pi, through (-pi/2, -2), (0, 0) and (pi/2, 2).", it, { x: [-4.2, 4.2], y: [-5, 5], u: 30 });
  };
  var G6b = function (k) {
    var f = function (x) { return Math.tan(x - PI / 4) + 1; }, it = [];
    if (k >= 1) it = it.concat(ASYM([-PI / 4, 3 * PI / 4], -4.8, 4.8), [{ seg: [[-1.4, 1], [3.4, 1]], c: "purple", dash: true }]);
    if (k >= 2) it = it.concat([dot(PI / 4, 1, "orange"), dot(PI / 2, 2, "orange"), dot(0, 0, "orange")]);
    if (k >= 3) it = it.concat(curve(f, -0.75, 2.35, "blue", [-4.8, 4.8]));
    return wavefig("The graph of y = tan(x - pi/4) + 1: asymptotes at x = -pi/4 and 3pi/4, centre (pi/4, 1).", it, { x: [-1.6, 3.6], y: [-5, 5], u: 32 });
  };
  LESSONS.push({
    title: "The graph of the tangent function", art: "pcwave",
    blurb: "Book 6.2 · A curve that climbs and climbs, then jumps to start again.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\tan 45^\\circ$?", answer: 1, skill: "Tangent",
        near: [{ v: 0.7071, tol: 0.001, fb: "That is $\\sin 45^\\circ$. Tangent is $\\frac{\\sin}{\\cos} = 1$ at $45^\\circ$." }], hints: ["$\\sin 45^\\circ = \\cos 45^\\circ$."], why: "$\\tan 45^\\circ = 1$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the angle. The blue dot is $(t, \\tan t)$. Find where $\\tan t = 1$, where $\\tan t = -1$, and then **slide up to $85^\\circ$** to see what happens near $90^\\circ$.",
        scene: { type: "sketch", x: [-3.4, 3.4], y: [-4, 4], u: 36, w: 300, grid: false, gate: true, pts: {},
          params: { t: { min: -85, max: 85, step: 5, v: 0, label: "angle (°)" } },
          track: function (s) { var t = s.p.t; return t === 45 ? "one" : t === -45 ? "neg" : t >= 80 ? "big" : null; },
          draw: function (s) { var t = s.p.t * PI / 180, v = Math.tan(t); return waveAx(-3.2, 3.2, -3.9, 3.9).concat(ASYM([-PI / 2, PI / 2], -3.9, 3.9), curve(TAN, -3.3, 3.3, "blue", [-4, 4]), [{ seg: [[t, 0], [t, Math.max(-3.9, Math.min(3.9, v))]], c: "orange", dash: true }], Math.abs(v) <= 3.9 ? [dot(t, v, "orange")] : []); },
          readout: function (s) { var d = s.p.t, v = Math.tan(d * PI / 180); return "$t = " + nm(d) + "^\\circ$: $\\tan t = " + (Math.abs(v) > 3.9 ? nm(f4(v, 1)) + "$ (off the chart)" : nm(f4(v, 3)) + "$") + "<br>$\\tan = 1$: " + (s.tracked.one ? "✓" : "—") + " · $\\tan = -1$: " + (s.tracked.neg ? "✓" : "—") + " · near $90^\\circ$: " + (s.tracked.big ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.one && s.tracked.neg && s.tracked.big); } },
        gate: true, then: "Tangent passes through $(\\frac{\\pi}{4}, 1)$ and $(-\\frac{\\pi}{4}, -1)$, then **shoots up without limit** as $t \\to 90^\\circ$ ($\\frac{\\pi}{2}$): a **vertical asymptote**, where the cosine in $\\frac{\\sin}{\\cos}$ is 0. It then repeats." },
      { type: "learn", kicker: "The idea",
        prompt: "$y = \\tan x$ has period $\\pi$, vertical asymptotes at $x = \\frac{\\pi}{2} + k\\pi$, zeros at $x = k\\pi$, and rises on each branch. For $y = A\\tan(Bx)$ the period is $\\dfrac{\\pi}{|B|}$, the asymptotes are at $x = \\pm\\dfrac{\\pi}{2|B|}$ and the points $\\left(\\pm\\dfrac{\\pi}{4B}, \\pm A\\right)$ are on the curve.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch one branch of $y = 2\\tan\\dfrac{x}{2}$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "A = 2, \\ \\ B = \\tfrac{1}{2}", say: "Read $A$ and $B$ from $y = 2\\tan\\left(\\frac{1}{2}x\\right)$." },
          { step: 1, m: "\\text{period} = \\frac{\\pi}{1/2} = 2\\pi", say: "Half the speed: twice as wide.", ask: { prompt: "What is $\\frac{\\pi}{1/2}$?", answer: 0, options: [{ t: "$2\\pi$" }, { t: "$\\frac{\\pi}{2}$", fb: "Dividing by $\\frac{1}{2}$ doubles: $\\pi \\cdot 2$." }] } },
          { step: 1, m: "\\text{asymptotes at } x = \\pm\\pi", say: "Half a period either side of the centre.", fig: G6(1) },
          { step: 2, m: "(0, 0), \\ \\ \\left(\\pm\\tfrac{\\pi}{2}, \\pm 2\\right)", say: "A quarter-period out, the value is $\\pm A = \\pm 2$.", fig: G6(2) },
          { step: 3, m: "\\text{one rising branch}", say: "Through the three points, steeper and steeper towards the asymptotes.", fig: G6(3) }] },
        gate: true, then: "Period $2\\pi$; asymptotes $x = \\pm\\pi$; through $(0, 0)$ and $\\left(\\pm\\frac{\\pi}{2}, \\pm 2\\right)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now analyse $y = -\\tan 2x$.",
        how: HOW_6, skill: "Graph of tangent",
        steps: [
          { step: 1, ask: "The period is $\\dfrac{\\pi}{2}$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", type: "num", pre: "period $\\approx$", answer: 1.5708, tol: 0.0006, calc: true, near: [{ v: 3.1416, tol: 0.0006, fb: "That is $\\pi$, the period of plain $\\tan x$. Divide by $B = 2$." }], hint: "$\\frac{\\pi}{B}$.", m: "\\text{period} = \\tfrac{\\pi}{2}", say: "Twice as fast." },
          { step: 1, ask: "The asymptotes are half a period either side of 0: $x = \\pm\\dfrac{\\pi}{4}$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", type: "num", pre: "$x \\approx$", answer: 0.7854, tol: 0.0006, calc: true, near: [{ v: 1.5708, tol: 0.0006, fb: "That is a whole period away. Half the period: $\\frac{\\pi}{4}$." }], hint: "$\\frac{1}{2} \\cdot \\frac{\\pi}{2}$.", m: "x = \\pm\\tfrac{\\pi}{4}", say: "The branch lives between them." },
          { step: 2, ask: "At $x = \\frac{\\pi}{8}$ (a quarter period), $y = -\\tan\\frac{\\pi}{4} =$", type: "num", pre: "$y =$", answer: -1, near: [{ v: 1, fb: "The minus sign: $-\\tan\\frac{\\pi}{4} = -1$." }], hint: "$\\tan\\frac{\\pi}{4} = 1$.", m: "\\left(\\tfrac{\\pi}{8}, -1\\right)", say: "A key point." },
          { step: 3, ask: "Because of the minus sign, the branch…", type: "choice", answer: 0, options: [{ t: "falls from left to right" }, { t: "rises from left to right", fb: "$-\\tan$ is $\\tan$ flipped over: it falls." }], m: "\\text{decreasing}", say: "A flipped tangent." }],
        why: "Asymptotes, key points, branch." },
      { type: "choice", kicker: "On your own", prompt: "What is the period of $y = \\tan 3x$?",
        options: [{ t: "$\\dfrac{\\pi}{3}$" }, { t: "$\\dfrac{2\\pi}{3}$", fb: "That is for sine or cosine. Tangent repeats every $\\pi$, divided by $B$." }, { t: "$3\\pi$", fb: "Divide by $B$, do not multiply." }],
        answer: 0, skill: "Graph of tangent", hints: ["$\\frac{\\pi}{|B|}$."], why: "$\\frac{\\pi}{3}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Shifted.** Sketch one branch of $y = \\tan\\left(x - \\dfrac{\\pi}{4}\\right) + 1$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "-\\tfrac{\\pi}{2} < x - \\tfrac{\\pi}{4} < \\tfrac{\\pi}{2}", say: "A branch lives where the inside is between $-\\frac{\\pi}{2}$ and $\\frac{\\pi}{2}$." },
          { step: 1, m: "-\\tfrac{\\pi}{4} < x < \\tfrac{3\\pi}{4}", say: "Add $\\frac{\\pi}{4}$ to every part: the asymptotes are at $x = -\\frac{\\pi}{4}$ and $\\frac{3\\pi}{4}$.", fig: G6b(1), ask: { prompt: "The branch is centred on…", answer: 0, options: [{ t: "$x = \\frac{\\pi}{4}$, the shift" }, { t: "$x = 0$", fb: "The graph moved right $\\frac{\\pi}{4}$, so the centre moves too." }] } },
          { step: 2, m: "\\text{centre } \\left(\\tfrac{\\pi}{4}, 1\\right)", say: "The middle of the branch is on the midline $y = 1$, at the shifted $x$.", fig: G6b(2) },
          { step: 3, m: "\\text{rising curve through the points}", say: "A quarter-period either side of the centre the height is $1 \\pm 1$.", fig: G6b(3) }] },
        gate: true, then: "Asymptotes $x = -\\frac{\\pi}{4}$ and $\\frac{3\\pi}{4}$; centre $\\left(\\frac{\\pi}{4}, 1\\right)$." },
      { type: "choice", kicker: "Try it", prompt: "Where is $y = \\tan x$ **undefined**?",
        options: [{ t: "$x = \\dfrac{\\pi}{2} + k\\pi$" }, { t: "$x = k\\pi$", fb: "At $x = k\\pi$ the tangent is **zero**. It is undefined where $\\cos x = 0$." }, { t: "Nowhere", fb: "At $\\frac{\\pi}{2}$, $\\cos = 0$, so $\\frac{\\sin}{\\cos}$ is undefined." }],
        answer: 0, skill: "Graph of tangent", hints: ["$\\tan x = \\frac{\\sin x}{\\cos x}$."], why: "Where $\\cos x = 0$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Tom says $y = \\tan x$ has period $2\\pi$ \"like sine and cosine\". What is wrong?",
        options: [{ t: "Tangent repeats every $\\pi$: $\\tan(x + \\pi) = \\tan x$." }, { t: "Nothing is wrong.", fb: "Check: $\\tan\\frac{\\pi}{4} = 1$ and $\\tan\\frac{5\\pi}{4} = 1$: it repeats after only $\\pi$." }, { t: "Tangent has no period.", fb: "It does repeat: every $\\pi$." }],
        answer: 0, skill: "Graph of tangent", hints: ["Compare $\\tan\\frac{\\pi}{4}$ and $\\tan\\frac{5\\pi}{4}$."], why: "Period $\\pi$." },
      { type: "num", kicker: "Use it", prompt: "A lighthouse beam turns, and the spot on a straight shore 10 km away is $d = 10\\tan\\theta$ km from the point opposite the lighthouse. How far is the spot when $\\theta = 60^\\circ$? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$d \\approx$", post: "km", answer: 17.32, tol: 0.006, calc: true, skill: "Graph of tangent",
        near: [{ v: 10, fb: "That is the distance at $45^\\circ$, where $\\tan = 1$." }], hints: ["$\\tan 60^\\circ = \\sqrt{3}$."], why: "$10\\sqrt{3} \\approx 17.32$ km." }
    ]
  });

  /* ============================================ 7 · The graphs of secant and cosecant */
  var HOW_7 = [["Partner", "$\\sec x = \\frac{1}{\\cos x}$ and $\\csc x = \\frac{1}{\\sin x}$. Sketch the partner wave lightly."],
               ["Asymptotes", "Draw a vertical asymptote wherever the partner is 0."],
               ["Branches", "At each peak or trough of the partner, draw a U that touches it and opens away from the axis."]];
  var G7 = function (k) {
    var it = [];
    it = it.concat(curve(COS, -0.4, 6.7, "soft", null, true));
    if (k >= 1) it = it.concat(ASYM([PI / 2, 3 * PI / 2], -3.9, 3.9));
    if (k >= 2) it = it.concat([dot(0, 1, "orange"), dot(PI, -1, "orange"), dot(2 * PI, 1, "orange")]);
    if (k >= 3) it = it.concat(curve(SEC, -0.4, 6.7, "blue", [-3.9, 3.9]));
    return wavefig("The graph of y = sec x: U-shaped branches touching the cosine curve at its peaks and troughs, with asymptotes at pi/2 and 3pi/2.", it, { x: [-0.6, 6.9], y: [-4, 4], u: 32 });
  };
  var G7b = function (k) {
    var f = function (x) { return 3 / Math.sin(2 * x); }, it = [];
    it = it.concat(curve(function (x) { return 3 * Math.sin(2 * x); }, -0.2, 3.5, "soft", null, true));
    if (k >= 1) it = it.concat(ASYM([0, PI / 2, PI], -4.8, 4.8));
    if (k >= 2) it = it.concat([dot(PI / 4, 3, "orange"), dot(3 * PI / 4, -3, "orange")]);
    if (k >= 3) it = it.concat(curve(f, -0.2, 3.5, "blue", [-4.8, 4.8]));
    return wavefig("The graph of y = 3 csc 2x: asymptotes at 0, pi/2 and pi, touching 3 sin 2x at (pi/4, 3) and (3pi/4, -3).", it, { x: [-0.4, 3.7], y: [-5, 5], u: 40, step: PI / 4, lab: qlab });
  };
  LESSONS.push({
    title: "The graphs of secant and cosecant", art: "pcwave",
    blurb: "Book 6.2 · Reciprocals of the waves: U-shaped branches that never enter the band between $-1$ and 1.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $\\cos x = 0.25$, what is $\\sec x = \\dfrac{1}{\\cos x}$?", answer: 4, skill: "Reciprocals",
        near: [{ v: 0.25, fb: "That is $\\cos x$ itself. The reciprocal flips it: $1 \\div 0.25$." }], hints: ["$1 \\div 0.25$."], why: "$4$." },
      { type: "learn", kicker: "Explore",
        prompt: "The **blue** curve is the partner wave and the **orange** is its reciprocal. Slide the angle. Find where the reciprocal **equals** its partner, and where it is **undefined**, for **both** pairs.",
        scene: { type: "sketch", x: [-0.6, 6.9], y: [-4, 4], u: 38, w: 330, grid: false, gate: true, pts: {},
          chips: { f: { label: "Reciprocal", v: "sec", opts: [["sec", "sec (of cos)"], ["csc", "csc (of sin)"]] } },
          params: { t: { min: 0, max: 360, step: 15, v: 45, label: "angle (°)" } },
          track: function (s) { var t = s.p.t, p = s.c.f === "sec" ? Math.cos(t * PI / 180) : Math.sin(t * PI / 180); return Math.abs(Math.abs(p) - 1) < 1e-9 ? s.c.f + "same" : Math.abs(p) < 1e-9 ? s.c.f + "undef" : null; },
          draw: function (s) { var t = s.p.t * PI / 180, P = s.c.f === "sec" ? COS : SIN, R = s.c.f === "sec" ? SEC : CSC, p = P(t), r = R(t); return waveAx(-0.3, 6.7, -3.9, 3.9).concat(curve(P, 0, 2 * PI, "blue"), curve(R, 0, 2 * PI, "orange", [-3.9, 3.9]), [{ seg: [[t, 0], [t, p]], c: "blue", dash: true }, dot(t, p, "blue")], Math.abs(r) <= 3.9 ? [{ seg: [[t, p], [t, r]], c: "soft", dash: true }, dot(t, r, "orange")] : []); },
          readout: function (s) { var d = s.p.t, P = s.c.f === "sec" ? Math.cos(d * PI / 180) : Math.sin(d * PI / 180), p = Math.abs(P) < 1e-9 ? 0 : P; return "$" + (s.c.f === "sec" ? "\\cos" : "\\sin") + " = " + nm(f4(p, 3)) + "$, so $" + s.c.f + " = " + (p === 0 ? "$ undefined" : nm(f4(1 / p, 3)) + "$") + "<br>Found: equal " + (s.tracked.secsame ? "sec ✓ " : "") + (s.tracked.cscsame ? "csc ✓" : "") + " · undefined " + (s.tracked.secundef ? "sec ✓ " : "") + (s.tracked.cscundef ? "csc ✓" : ""); },
          goal: function (s) { return !!(s.tracked.secsame && s.tracked.secundef && s.tracked.cscsame && s.tracked.cscundef); } },
        gate: true, then: "Where the partner is **$\\pm 1$** the reciprocal **touches** it. Where the partner is **0** the reciprocal is undefined: a **vertical asymptote**. In between, when the partner is small the reciprocal is **large**: so secant and cosecant never enter the band $-1 < y < 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "$y = \\sec x = \\dfrac{1}{\\cos x}$ and $y = \\csc x = \\dfrac{1}{\\sin x}$ have period $2\\pi$ and **range** $|y| \\ge 1$. They have vertical asymptotes where the partner is 0, and touch the partner at its peaks and troughs. To sketch: draw the partner lightly, the asymptotes, then a U at every peak or trough.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch $y = \\sec x$ over one period, $0$ to $2\\pi$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "\\text{draw } y = \\cos x \\text{ lightly}", say: "Secant is its reciprocal.", fig: G7(0) },
          { step: 2, m: "\\cos x = 0 \\ \\Rightarrow \\ x = \\tfrac{\\pi}{2}, \\ \\tfrac{3\\pi}{2}", say: "A vertical asymptote at each.", fig: G7(1), ask: { prompt: "Why are there asymptotes where $\\cos x = 0$?", answer: 0, options: [{ t: "$\\frac{1}{0}$ is undefined" }, { t: "$\\sec$ is zero there", fb: "$\\sec x = \\frac{1}{\\cos x}$ is never 0." }] } },
          { step: 3, m: "(0, 1), \\ (\\pi, -1), \\ (2\\pi, 1)", say: "At the peaks and troughs of cosine, $\\sec = \\cos$: the U's touch the cosine there.", fig: G7(2) },
          { step: 3, m: "\\text{U-shaped branches}", say: "Up from $(0, 1)$ to the asymptote; a downward U through $(\\pi, -1)$; an upward U back down to $(2\\pi, 1)$.", fig: G7(3) }] },
        gate: true, then: "$\\sec x$: asymptotes at $\\frac{\\pi}{2} + k\\pi$, touching $\\cos x$ at its peaks and troughs." },
      { type: "guided", kicker: "Together",
        prompt: "Now $y = \\csc x$.",
        how: HOW_7, skill: "Graphs of secant and cosecant",
        steps: [
          { step: 1, ask: "The partner of $\\csc x$ is…", type: "choice", answer: 0, options: [{ t: "$\\sin x$" }, { t: "$\\cos x$", fb: "$\\csc x = \\frac{1}{\\sin x}$." }], m: "\\csc x = \\frac{1}{\\sin x}", say: "Sketch $\\sin x$ lightly." },
          { step: 2, ask: "$\\sin x = 0$ at $x = 0, \\pi, 2\\pi$. These are the…", type: "choice", answer: 0, options: [{ t: "vertical asymptotes of $\\csc x$" }, { t: "peaks of $\\csc x$", fb: "Where the partner is 0, the reciprocal is undefined." }], m: "x = 0, \\ \\pi, \\ 2\\pi", say: "Three asymptotes." },
          { step: 3, ask: "At $x = \\frac{\\pi}{2}$, $\\sin x = 1$. So $\\csc\\frac{\\pi}{2} =$", type: "num", pre: "$\\csc\\frac{\\pi}{2} =$", answer: 1, near: [{ v: 0, fb: "$\\csc\\frac{\\pi}{2} = \\frac{1}{1} = 1$: it touches the sine wave at its peak." }], hint: "$\\frac{1}{1}$.", m: "\\left(\\tfrac{\\pi}{2}, 1\\right)", say: "A U opens upward from here." }],
        why: "Partner, asymptotes, branches." },
      { type: "choice", kicker: "On your own", prompt: "What is the **range** of $y = \\sec x$?",
        options: [{ t: "$y \\le -1$ or $y \\ge 1$" }, { t: "$-1 \\le y \\le 1$", fb: "That is the range of cosine. Its reciprocal is never inside the band $-1 < y < 1$." }, { t: "all real numbers", fb: "Secant skips the band between $-1$ and 1." }],
        answer: 0, skill: "Graphs of secant and cosecant", hints: ["If $|\\cos x| \\le 1$, then $\\left|\\frac{1}{\\cos x}\\right| \\ge 1$."], why: "$|\\sec x| \\ge 1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Stretch and squeeze.** Sketch $y = 3\\csc 2x$ over $0 \\le x \\le \\pi$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "y = 3\\sin 2x, \\ \\ \\text{period } \\pi", say: "The partner: amplitude 3, period $\\frac{2\\pi}{2} = \\pi$.", fig: G7b(0) },
          { step: 2, m: "3\\sin 2x = 0 \\ \\Rightarrow \\ x = 0, \\ \\tfrac{\\pi}{2}, \\ \\pi", say: "Asymptotes where $\\sin 2x = 0$.", fig: G7b(1), ask: { prompt: "When is $\\sin 2x = 0$?", answer: 0, options: [{ t: "$2x = 0, \\pi, 2\\pi$, so $x = 0, \\frac{\\pi}{2}, \\pi$" }, { t: "$x = 0, \\pi, 2\\pi$", fb: "The **inside** is $2x$: set $2x = 0, \\pi, 2\\pi$ and divide by 2." }] } },
          { step: 3, m: "\\left(\\tfrac{\\pi}{4}, 3\\right), \\ \\left(\\tfrac{3\\pi}{4}, -3\\right)", say: "The sine's peak and trough: $\\csc$ touches them (values $\\pm 3$).", fig: G7b(2) },
          { step: 3, m: "\\text{U-shaped branches}", say: "Up from $(\\frac{\\pi}{4}, 3)$ to the asymptotes; down from $(\\frac{3\\pi}{4}, -3)$.", fig: G7b(3) }] },
        gate: true, then: "Asymptotes at $0, \\frac{\\pi}{2}, \\pi$; the branches touch $\\pm 3$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\sec 60^\\circ$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$\\sec 60^\\circ =$", answer: 2, tol: 0.001, calc: true, skill: "Graphs of secant and cosecant",
        near: [{ v: 0.5, fb: "That is $\\cos 60^\\circ$. Secant is its reciprocal." }], hints: ["$\\frac{1}{\\cos 60^\\circ} = \\frac{1}{0.5}$."], why: "$2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Jo says $\\sec x = \\dfrac{1}{\\sin x}$ and draws its asymptotes where $\\sin x = 0$. What is wrong?",
        options: [{ t: "$\\sec x = \\frac{1}{\\cos x}$: the asymptotes are where $\\cos x = 0$. (She has described $\\csc x$.)" }, { t: "Nothing is wrong.", fb: "$\\sec$ goes with $\\cos$ and $\\csc$ with $\\sin$." }, { t: "Secant has no asymptotes.", fb: "It does, wherever the cosine is 0." }],
        answer: 0, skill: "Graphs of secant and cosecant", hints: ["Sec goes with Cos."], why: "$\\sec x = \\frac{1}{\\cos x}$." },
      { type: "num", kicker: "Use it", prompt: "A camera 100 m from a long wall turns to point at a spot on the wall at angle $\\theta$ from the straight-ahead direction. The distance to the spot is $100\\sec\\theta$ metres. How far is the spot when $\\theta = 60^\\circ$? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "distance =", post: "m", answer: 200, tol: 0.01, calc: true, skill: "Graphs of secant and cosecant",
        near: [{ v: 50, fb: "That is $100\\cos 60^\\circ$. The distance is $\\frac{100}{\\cos\\theta}$: longer, not shorter." }], hints: ["$\\sec 60^\\circ = 2$."], why: "$200$ m." }
    ]
  });

  /* ============================================ 8 · The graph of the cotangent function */
  var HOW_8 = [["Asymptotes", "$\\cot x = \\frac{\\cos x}{\\sin x}$ is undefined where $\\sin x = 0$: $x = k\\pi$."],
               ["Key points", "Zero at $x = \\frac{\\pi}{2}$, with $\\left(\\frac{\\pi}{4}, 1\\right)$ and $\\left(\\frac{3\\pi}{4}, -1\\right)$."],
               ["Branch", "Draw a **falling** curve between the asymptotes, then repeat every $\\pi$."]];
  var G8 = function (k) {
    var it = [];
    if (k >= 1) it = it.concat(ASYM([0, PI], -4.8, 4.8));
    if (k >= 2) it = it.concat([dot(PI / 4, 1, "orange"), dot(PI / 2, 0, "orange"), dot(3 * PI / 4, -1, "orange")]);
    if (k >= 3) it = it.concat(curve(COT, 0.02, PI - 0.02, "blue", [-4.8, 4.8]));
    return wavefig("The graph of y = cot x between the asymptotes x = 0 and x = pi: falling through (pi/4, 1), (pi/2, 0) and (3pi/4, -1).", it, { x: [-0.8, 4], y: [-5, 5], u: 36, step: PI / 4, lab: qlab });
  };
  LESSONS.push({
    title: "The graph of the cotangent function", art: "pcwave",
    blurb: "Book 6.2 · Tangent's mirror: falling branches, with asymptotes where sine is 0.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $\\tan x = 4$, what is $\\cot x = \\dfrac{1}{\\tan x}$? (A decimal is fine.)", answer: 0.25, tol: 1e-9, shown: "1/4", skill: "Reciprocals",
        near: [{ v: 4, fb: "Cotangent is the **reciprocal** of tangent: $\\frac{1}{4}$." }], hints: ["$1 \\div 4$."], why: "$0.25$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the angle. The blue dot is $(t, \\cot t)$ and the orange dot is $(t, \\tan t)$. Find where $\\cot t = \\tan t$, and where **$\\cot t = 0$**.",
        scene: { type: "sketch", x: [-0.6, 3.8], y: [-4, 4], u: 40, w: 230, grid: false, gate: true, pts: {},
          params: { t: { min: 15, max: 165, step: 15, v: 15, label: "angle (°)" } },
          track: function (s) { return s.p.t === 45 ? "equal" : s.p.t === 90 ? "zero" : null; },
          draw: function (s) { var t = s.p.t * PI / 180, c = COT(t), n = TAN(t); return waveAx(-0.5, 3.6, -3.9, 3.9, { step: PI / 4, lab: qlab }).concat(ASYM([0, PI, PI / 2], -3.9, 3.9, "soft"), curve(TAN, 0, PI, "orange", [-3.9, 3.9], true), curve(COT, 0.02, PI - 0.02, "blue", [-3.9, 3.9]), [dot(t, c, "blue")], Math.abs(n) <= 3.9 ? [dot(t, n, "orange")] : []); },
          readout: function (s) { var d = s.p.t, c = Math.round(COT(d * PI / 180) * 1e6) / 1e6, n = d === 90 ? "undefined" : nm(f4(TAN(d * PI / 180), 3)); return "$t = " + d + "^\\circ$: $\\cot t = " + nm(f4(c, 3)) + "$, $\\tan t = " + n + "$<br>$\\cot = \\tan$: " + (s.tracked.equal ? "✓" : "—") + " · $\\cot = 0$: " + (s.tracked.zero ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.equal && s.tracked.zero); } },
        gate: true, then: "$\\cot t = \\tan t = 1$ at $45^\\circ$, and $\\cot t = 0$ at $90^\\circ$, where the tangent has its asymptote. Cotangent **falls** from the asymptote at $0$ to the asymptote at $\\pi$." },
      { type: "learn", kicker: "The idea",
        prompt: "$y = \\cot x = \\dfrac{\\cos x}{\\sin x}$ has period $\\pi$, asymptotes at $x = k\\pi$, zeros at $x = \\frac{\\pi}{2} + k\\pi$, and **falls** on each branch. For $y = A\\cot(Bx)$ the period is $\\dfrac{\\pi}{|B|}$ and the asymptotes are at $0$ and $\\dfrac{\\pi}{|B|}$.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Sketch one branch of $y = \\cot x$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\cot x = \\frac{\\cos x}{\\sin x}", say: "The bottom is $\\sin x$." },
          { step: 1, m: "\\sin x = 0 \\ \\Rightarrow \\ x = 0, \\ \\pi", say: "A branch lives between two neighbouring asymptotes.", fig: G8(1), ask: { prompt: "Where is $\\cot x$ undefined?", answer: 0, options: [{ t: "Where $\\sin x = 0$" }, { t: "Where $\\cos x = 0$", fb: "That is where $\\cot x = 0$ (the numerator). Undefined needs the **denominator** 0: $\\sin x$." }] } },
          { step: 2, m: "\\left(\\tfrac{\\pi}{4}, 1\\right), \\ \\left(\\tfrac{\\pi}{2}, 0\\right), \\ \\left(\\tfrac{3\\pi}{4}, -1\\right)", say: "Quarter, half and three-quarter points of the period.", fig: G8(2) },
          { step: 3, m: "\\text{falling curve}", say: "From high near $x = 0$ down through the three points to low near $x = \\pi$.", fig: G8(3) }] },
        gate: true, then: "Period $\\pi$; asymptotes at $0$ and $\\pi$; through $\\left(\\frac{\\pi}{2}, 0\\right)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now analyse $y = -\\cot 2x$.",
        how: HOW_8, skill: "Graph of cotangent",
        steps: [
          { step: 1, ask: "The period is $\\dfrac{\\pi}{2}$. The asymptotes of the first branch are at $x = 0$ and $x =$ (type it as an expression)", type: "num", pre: "$x \\approx$", answer: 1.5708, tol: 0.0006, calc: true, near: [{ v: 3.1416, tol: 0.0006, fb: "That is $\\pi$. Divide by $B = 2$: $\\frac{\\pi}{2}$." }], hint: "$\\frac{\\pi}{B}$.", m: "x = 0 \\text{ and } \\tfrac{\\pi}{2}", say: "A branch fits between them." },
          { step: 2, ask: "The zero is in the middle: $x =$ (type it as an expression)", type: "num", pre: "$x \\approx$", answer: 0.7854, tol: 0.0006, calc: true, near: [{ v: 0.3927, tol: 0.0006, fb: "That is $\\frac{\\pi}{8}$, a quarter of the branch. The zero is **half way**: $\\frac{\\pi}{4}$." }], hint: "Half of $\\frac{\\pi}{2}$.", m: "\\left(\\tfrac{\\pi}{4}, 0\\right)", say: "The middle of the branch." },
          { step: 3, ask: "A plain cotangent falls. With the minus sign, this one…", type: "choice", answer: 0, options: [{ t: "rises from left to right" }, { t: "falls from left to right", fb: "The minus sign flips the curve over: a falling curve becomes rising." }], m: "\\text{increasing}", say: "$-\\cot$ rises." }],
        why: "Asymptotes, zero, direction." },
      { type: "sort", kicker: "On your own", prompt: "Is the period $\\dfrac{2\\pi}{|B|}$ or $\\dfrac{\\pi}{|B|}$?",
        bins: ["2π ÷ |B|", "π ÷ |B|"],
        cards: [{ t: "$y = \\sin(Bx)$", bin: 0, fb: "Sine repeats every $2\\pi$." }, { t: "$y = \\tan(Bx)$", bin: 1, fb: "Tangent repeats every $\\pi$." }, { t: "$y = \\sec(Bx)$", bin: 0, fb: "Secant repeats every $2\\pi$, like cosine." }, { t: "$y = \\cot(Bx)$", bin: 1, fb: "Cotangent repeats every $\\pi$." }, { t: "$y = \\cos(Bx)$", bin: 0, fb: "Cosine repeats every $2\\pi$." }, { t: "$y = \\csc(Bx)$", bin: 0, fb: "Cosecant repeats every $2\\pi$, like sine." }],
        skill: "Periods of the six functions", hints: ["Tangent and cotangent are the two that repeat twice as often."], why: "Only $\\tan$ and $\\cot$ have period $\\pi$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A stretched cotangent.** Find the period and asymptotes of $y = 3\\cot\\dfrac{\\pi x}{2}$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "B = \\tfrac{\\pi}{2}", say: "The coefficient of $x$." },
          { step: 1, m: "\\text{period} = \\frac{\\pi}{\\pi/2} = 2", say: "The period of cotangent is $\\frac{\\pi}{B}$.", ask: { prompt: "What is $\\frac{\\pi}{\\pi/2}$?", answer: 0, options: [{ t: "$2$" }, { t: "$\\frac{\\pi^2}{2}$", fb: "Dividing by $\\frac{\\pi}{2}$ is multiplying by $\\frac{2}{\\pi}$: the $\\pi$'s cancel." }] } },
          { step: 2, m: "\\text{asymptotes at } x = 0 \\text{ and } x = 2", say: "A branch spans one period." },
          { step: 3, m: "\\left(\\tfrac{1}{2}, 3\\right), \\ (1, 0), \\ \\left(\\tfrac{3}{2}, -3\\right)", say: "At a quarter, half and three-quarters of the period; the heights are $\\pm A = \\pm 3$ and 0." }] },
        gate: true, then: "Period 2; asymptotes at $x = 0$ and $x = 2$; zero at $x = 1$." },
      { type: "choice", kicker: "Try it", prompt: "Where does $y = \\cot x$ cross the $x$-axis?",
        options: [{ t: "$x = \\dfrac{\\pi}{2} + k\\pi$" }, { t: "$x = k\\pi$", fb: "At $x = k\\pi$ the cotangent has **asymptotes**." }, { t: "$x = \\dfrac{\\pi}{4} + k\\pi$", fb: "At $\\frac{\\pi}{4}$ the cotangent is 1." }],
        answer: 0, skill: "Graph of cotangent", hints: ["$\\cot x = 0$ where $\\cos x = 0$."], why: "$\\cos x = 0$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ada draws $y = \\cot x$ rising from left to right like the tangent. What is wrong?",
        options: [{ t: "Cotangent **falls** on each branch: it is $\\frac{1}{\\tan x}$, and the reciprocal reverses the direction." }, { t: "Nothing is wrong.", fb: "Check: $\\cot\\frac{\\pi}{4} = 1$ and $\\cot\\frac{\\pi}{2} = 0$: it goes **down**." }, { t: "Cotangent is flat.", fb: "It goes from $+\\infty$ down to $-\\infty$ on each branch." }],
        answer: 0, skill: "Graph of cotangent", hints: ["$\\cot\\frac{\\pi}{4} = 1$ and $\\cot\\frac{\\pi}{2} = 0$."], why: "Falling branches." },
      { type: "num", kicker: "Use it", prompt: "A road rises at an angle $\\theta$ to the horizontal. The **horizontal run** for a 10 m rise is $10\\cot\\theta$. Find the run for $\\theta = 30^\\circ$ to 2 decimal places. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "run $\\approx$", post: "m", answer: 17.32, tol: 0.006, calc: true, skill: "Graph of cotangent",
        near: [{ v: 5.77, tol: 0.006, fb: "That is $10\\tan 30^\\circ$. The run is $10\\cot 30^\\circ$, the reciprocal." }], hints: ["$\\cot 30^\\circ = \\sqrt{3}$."], why: "$10\\sqrt{3} \\approx 17.32$ m." }
    ]
  });
  /* ============================================ 9 · The inverse trigonometric functions */
  var HOW_9 = [["Restrict", "Only part of each wave is one-to-one: $\\sin$ on $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$, $\\cos$ on $[0, \\pi]$, $\\tan$ on $\\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right)$."],
               ["Swap", "Mirror that part in the line $y = x$: that is $\\arcsin$, $\\arccos$, $\\arctan$."],
               ["Read it", "$\\arcsin x$ is the angle **in that range** whose sine is $x$."]];
  var DOM9 = { sin: [-90, 90], cos: [0, 180], tan: [-60, 60] }, FN9 = { sin: Math.sin, cos: Math.cos, tan: Math.tan }, ARC9 = { sin: "arcsin", cos: "arccos", tan: "arctan" };
  var G9 = function (k) {
    var it = [{ seg: [[-1.8, -1.8], [1.9, 1.9]], c: "soft", dash: true }];
    if (k >= 1) it = it.concat(curve(SIN, -PI / 2, PI / 2, "blue"), [dot(-PI / 2, -1, "blue"), dot(PI / 2, 1, "blue")]);
    if (k >= 2) it = it.concat(curveT(function (t) { return [Math.sin(t), t]; }, -PI / 2, PI / 2, "orange", 60), [dot(-1, -PI / 2, "orange"), dot(1, PI / 2, "orange")]);
    return grid("The sine graph on the interval from -pi/2 to pi/2 (blue) and its mirror image in the line y = x, the arcsine graph (orange).", it, { x: [-2, 2.1], y: [-2, 2.1], u: 52, step: 1 });
  };
  LESSONS.push({
    title: "The inverse trigonometric functions", art: "pcwave",
    blurb: "Book 6.3 · Run a trig function backwards: from a ratio to its angle.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A function has an inverse only if it is…",
        options: [{ t: "one-to-one" }, { t: "periodic", fb: "Periodic functions repeat their values, so they are **not** one-to-one." }, { t: "even", fb: "Even functions repeat values too: $f(-x) = f(x)$." }],
        answer: 0, skill: "Inverse functions", hints: ["Each output must come from only one input."], why: "One-to-one." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick $\\sin$, $\\cos$ or $\\tan$. Only the **blue** part of each wave is used. Its mirror image in the dashed line $y = x$ (orange) is the **inverse**. Slide the angle and look at **all three**.",
        scene: { type: "sketch", x: [-2.2, 3.7], y: [-2.2, 3.7], u: 40, w: 300, gate: true, pts: {},
          chips: { f: { label: "Function", v: "sin", opts: [["sin", "sine"], ["cos", "cosine"], ["tan", "tangent"]] } },
          params: { d: { min: -90, max: 180, step: 15, v: 30, label: "angle (°)" } },
          draw: function (s) { var f = s.c.f, F = FN9[f], D = DOM9[f], d = Math.max(D[0], Math.min(D[1], s.p.d)), t = d * PI / 180, y = F(t); return [{ seg: [[-2, -2], [3.5, 3.5]], c: "soft", dash: true }].concat(curve(F, D[0] * PI / 180, D[1] * PI / 180, "blue", [-2.1, 3.6]), curveT(function (u) { return [F(u), u]; }, D[0] * PI / 180, D[1] * PI / 180, "orange", 60), [{ seg: [[t, y], [y, t]], c: "soft", dash: true }, dot(t, y, "blue"), dot(y, t, "orange")]); },
          readout: function (s) { var f = s.c.f, F = FN9[f], D = DOM9[f], d = Math.max(D[0], Math.min(D[1], s.p.d)), y = F(d * PI / 180), n = Object.keys(s.seen.f).length; return "$\\" + f + " " + nm(d) + "^\\circ = " + nm(f4(y, 3)) + "$, so $\\" + ARC9[f] + "(" + nm(f4(y, 3)) + ") = " + nm(d) + "^\\circ$ ($" + (d === 0 ? "0" : radTex(d)) + "$)<br>Looked at " + Math.min(n, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.seen.f).length >= 3; } },
        gate: true, then: "The inverse swaps inputs and outputs: $\\sin\\theta = y$ becomes $\\arcsin y = \\theta$. To make that a **function**, we keep one piece: **$\\arcsin$** gives angles in $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$, **$\\arccos$** in $[0, \\pi]$ and **$\\arctan$** in $\\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right)$." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\arcsin x$ (also written $\\sin^{-1}x$) is the **angle** whose sine is $x$, chosen from the restricted range: $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$. $\\arccos x$ is in $[0, \\pi]$. $\\arctan x$ is in $\\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right)$. $\\arcsin$ and $\\arccos$ need $-1 \\le x \\le 1$.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\arcsin\\dfrac{1}{2}$, $\\arccos\\left(-\\dfrac{\\sqrt{3}}{2}\\right)$ and $\\arctan(-1)$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "\\arcsin\\tfrac{1}{2}: \\ \\sin\\theta = \\tfrac{1}{2}", say: "Which angle has sine $\\frac{1}{2}$? Both $\\frac{\\pi}{6}$ and $\\frac{5\\pi}{6}$ do.", fig: G9(2) },
          { step: 2, m: "\\theta \\in \\left[-\\tfrac{\\pi}{2}, \\tfrac{\\pi}{2}\\right] \\ \\Rightarrow \\ \\theta = \\tfrac{\\pi}{6}", say: "Only $\\frac{\\pi}{6}$ is in the allowed range for arcsine.", ask: { prompt: "Why not $\\frac{5\\pi}{6}$?", answer: 0, options: [{ t: "It is outside $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$" }, { t: "Its sine is not $\\frac{1}{2}$", fb: "It is: $\\sin\\frac{5\\pi}{6} = \\frac{1}{2}$. But arcsine only returns angles from the range $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$." }] } },
          { step: 3, m: "\\arccos\\left(-\\tfrac{\\sqrt{3}}{2}\\right) = \\tfrac{5\\pi}{6}", say: "Cosine is $-\\frac{\\sqrt{3}}{2}$ in quadrants II and III. Arccos stays in $[0, \\pi]$: quadrant II." },
          { step: 3, m: "\\arctan(-1) = -\\tfrac{\\pi}{4}", say: "Tangent is $-1$ at $-\\frac{\\pi}{4}$, which is in $\\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right)$." }] },
        gate: true, then: "$\\frac{\\pi}{6}$, $\\frac{5\\pi}{6}$ and $-\\frac{\\pi}{4}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\arccos\\left(-\\dfrac{1}{2}\\right)$.",
        how: HOW_9, skill: "Inverse trigonometric functions",
        steps: [
          { step: 1, ask: "The range of arccos is…", type: "choice", answer: 0, options: [{ t: "$[0, \\pi]$" }, { t: "$\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$", fb: "That is the range of arcsine." }], m: "0 \\le \\theta \\le \\pi", say: "Quadrants I and II only." },
          { step: 2, ask: "Cosine is $-\\frac{1}{2}$ with reference angle $\\frac{\\pi}{3}$, in quadrant II: $\\theta = \\pi - \\frac{\\pi}{3} =$ (type it as an expression)", type: "num", pre: "$\\theta \\approx$", answer: 2.0944, tol: 0.0006, calc: true, near: [{ v: 1.0472, tol: 0.0006, fb: "That is $\\frac{\\pi}{3}$ with positive cosine. We need quadrant II, where cosine is negative." }, { v: 4.1888, tol: 0.0006, fb: "That is in quadrant III, outside $[0, \\pi]$." }], hint: "$\\frac{2\\pi}{3} \\approx 2.0944$.", m: "\\theta = \\tfrac{2\\pi}{3}", say: "The only angle in $[0, \\pi]$ with cosine $-\\frac{1}{2}$." },
          { step: 3, ask: "Check: $\\cos\\dfrac{2\\pi}{3} =$", type: "choice", answer: 0, options: [{ t: "$-\\frac{1}{2}$" }, { t: "$\\frac{1}{2}$", fb: "In quadrant II the cosine is negative." }], m: "\\cos\\tfrac{2\\pi}{3} = -\\tfrac{1}{2}", say: "It checks." }],
        why: "Restrict, swap, read." },
      { type: "choice", kicker: "On your own", prompt: "What is $\\arcsin\\left(-\\dfrac{1}{2}\\right)$?",
        options: [{ t: "$-\\dfrac{\\pi}{6}$" }, { t: "$\\dfrac{7\\pi}{6}$", fb: "That has sine $-\\frac{1}{2}$ but is outside the range $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$." }, { t: "$\\dfrac{\\pi}{6}$", fb: "That has sine $+\\frac{1}{2}$." }],
        answer: 0, skill: "Inverse trigonometric functions", hints: ["Arcsine can return a negative angle."], why: "$\\sin\\left(-\\frac{\\pi}{6}\\right) = -\\frac{1}{2}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**An inverse that does not cancel.** Find $\\arcsin\\left(\\sin\\dfrac{5\\pi}{6}\\right)$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "\\sin\\tfrac{5\\pi}{6} = \\tfrac{1}{2}", say: "First the inside." },
          { step: 2, m: "\\arcsin\\tfrac{1}{2}", say: "Now arcsine of that.", ask: { prompt: "Is the answer $\\frac{5\\pi}{6}$?", answer: 0, options: [{ t: "No: arcsine only returns angles in $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$" }, { t: "Yes: $\\arcsin$ undoes $\\sin$", fb: "It undoes it only inside the restricted range. $\\frac{5\\pi}{6}$ is outside it." }] } },
          { step: 3, m: "= \\tfrac{\\pi}{6}", say: "The angle in the range with sine $\\frac{1}{2}$." },
          { step: 3, m: "\\arcsin(\\sin x) = x \\text{ only for } -\\tfrac{\\pi}{2} \\le x \\le \\tfrac{\\pi}{2}", say: "Outside that range, the answer is a different angle with the same sine." }] },
        gate: true, then: "$\\arcsin\\left(\\sin\\frac{5\\pi}{6}\\right) = \\dfrac{\\pi}{6}$, not $\\frac{5\\pi}{6}$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\arccos 0$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$\\arccos 0 \\approx$", answer: 1.5708, tol: 0.0006, calc: true, skill: "Inverse trigonometric functions",
        near: [{ v: 0, fb: "That would be $\\cos 0 = 1$. We want the angle whose cosine is 0: $\\frac{\\pi}{2}$." }, { v: 4.7124, tol: 0.0006, fb: "$\\frac{3\\pi}{2}$ also has cosine 0, but arccos stays in $[0, \\pi]$." }], hints: ["$\\cos\\frac{\\pi}{2} = 0$."], why: "$\\frac{\\pi}{2}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Max says $\\arcsin 2 = \\dfrac{\\pi}{2}$ \"because it is the biggest angle\". What is wrong?",
        options: [{ t: "No angle has a sine of 2: sine never exceeds 1, so $\\arcsin 2$ is undefined." }, { t: "Nothing is wrong.", fb: "$\\sin\\frac{\\pi}{2} = 1$, not 2." }, { t: "$\\arcsin 2 = 0$.", fb: "$\\sin 0 = 0$, not 2." }],
        answer: 0, skill: "Inverse trigonometric functions", hints: ["What is the largest value of sine?"], why: "Domain of arcsin: $[-1, 1]$." },
      { type: "num", kicker: "Use it", prompt: "A 10 m ladder leans against a wall and reaches 8 m up. What angle does it make with the ground, in degrees? (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "$\\theta \\approx$", post: "degrees", answer: 53.13, tol: 0.006, calc: true, skill: "Inverse trigonometric functions",
        near: [{ v: 0.9273, tol: 0.001, fb: "That is the angle in radians. Multiply by $\\frac{180}{\\pi}$." }, { v: 36.87, tol: 0.006, fb: "That is the angle between the ladder and the wall. The angle with the ground has $\\sin\\theta = \\frac{8}{10}$." }], hints: ["$\\sin\\theta = \\frac{8}{10}$."], why: "$\\sin^{-1}(0.8) \\approx 53.13^\\circ$." }
    ]
  });

  /* ============================================ 10 · Compositions with inverse trigonometric functions */
  var HOW_10 = [["Name it", "Let $\\theta$ be the inverse function's value. Write its trig ratio."],
                ["Triangle", "Draw a right triangle for $\\theta$: label two sides from the ratio, find the third with Pythagoras."],
                ["Read", "Read the new ratio off the triangle."]];
  var TRI10 = function (adj, opp, alt) {
    var hyp = Math.sqrt(adj * adj + opp * opp), th = Math.atan2(opp, adj) * 180 / PI;
    return grid(alt, [{ path: [[0, 0], [adj, 0], [adj, opp]], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [adj, 0]], c: "blue" }, { seg: [[adj, 0], [adj, opp]], c: "orange" }, { seg: [[0, 0], [adj, opp]], c: "ink" }, { turn: [[0, 0], 0.7, 0, th], c: "green" }], { x: [-0.8, adj + 1.2], y: [-0.8, opp + 1], u: 34, grid: false });
  };
  LESSONS.push({
    title: "Compositions with inverse trigonometric functions", art: "pcwave",
    blurb: "Book 6.3 · Evaluate things like $\\sin(\\arccos\\frac{3}{5})$ with a right triangle.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A right triangle has legs 3 and 4. What is its hypotenuse?", answer: 5, skill: "Pythagorean theorem",
        near: [{ v: 7, fb: "Add the squares and take the root: $9 + 16 = 25$." }], hints: ["$\\sqrt{3^2 + 4^2}$."], why: "$5$." },
      { type: "learn", kicker: "Explore",
        prompt: "Let $\\theta = \\arccos x$. The triangle has hypotenuse 1 and adjacent side $x$. Slide $x$ and watch the **opposite** side, which is $\\sin\\theta = \\sin(\\arccos x)$. Find $x$ for which $\\sin(\\arccos x) = 0.6$, and for which it equals $0.8$.",
        scene: { type: "sketch", x: [-0.2, 1.3], y: [-0.2, 1.3], u: 210, w: 340, gate: true, pts: {},
          params: { x: { min: 0, max: 1, step: 0.1, v: 0.5, label: "$x = \\cos\\theta$" } },
          track: function (s) { var x = s.p.x; return Math.abs(x - 0.8) < 1e-9 ? "s06" : Math.abs(x - 0.6) < 1e-9 ? "s08" : null; },
          draw: function (s) { var x = s.p.x, y = Math.sqrt(Math.max(0, 1 - x * x)), th = Math.atan2(y, x) * 180 / PI; return curveT(function (t) { return [Math.cos(t), Math.sin(t)]; }, 0, PI / 2, "soft", 60).concat([{ path: [[0, 0], [x, 0], [x, y]], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [x, 0]], c: "blue" }, { seg: [[x, 0], [x, y]], c: "orange" }, { seg: [[0, 0], [x, y]], c: "ink" }], th > 1 ? [{ turn: [[0, 0], 0.2, 0, th], c: "green" }] : []); },
          readout: function (s) { var x = s.p.x, y = Math.sqrt(Math.max(0, 1 - x * x)); return "$\\cos\\theta = " + nm(f4(x, 1)) + "$, so $\\sin\\theta = \\sqrt{1 - " + nm(f4(x * x, 2)) + "} = " + nm(f4(y, 3)) + "$<br>$\\sin = 0.6$: " + (s.tracked.s06 ? "✓" : "—") + " · $\\sin = 0.8$: " + (s.tracked.s08 ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.s06 && s.tracked.s08); } },
        gate: true, then: "$\\sin(\\arccos x) = \\sqrt{1 - x^2}$. With $x = 0.8$ the opposite side is $0.6$, and with $x = 0.6$ it is $0.8$: a $3$-$4$-$5$ triangle in disguise. Drawing the triangle is how we evaluate these." },
      { type: "learn", kicker: "The idea",
        prompt: "To evaluate $\\sin(\\arccos x)$: let $\\theta = \\arccos x$, so $\\cos\\theta = x$. **Draw a right triangle**, label two sides from the ratio, find the third with Pythagoras, and read off the ratio you want. Check the **sign** from the quadrant of $\\theta$.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\sin\\left(\\arccos\\dfrac{3}{5}\\right)$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "\\theta = \\arccos\\tfrac{3}{5} \\ \\Rightarrow \\ \\cos\\theta = \\tfrac{3}{5}", say: "Call the angle $\\theta$. We need $\\sin\\theta$." },
          { step: 2, m: "\\text{adj} = 3, \\ \\text{hyp} = 5", say: "Cosine is adjacent over hypotenuse.", fig: TRI10(3, 4, "A right triangle with adjacent side 3, hypotenuse 5 and opposite side 4.") , ask: { prompt: "The missing side is…", answer: 0, options: [{ t: "$\\sqrt{25 - 9} = 4$" }, { t: "$\\sqrt{25 + 9}$", fb: "A leg is $\\sqrt{\\text{hyp}^2 - \\text{leg}^2}$: subtract." }] } },
          { step: 2, m: "\\text{opp} = \\sqrt{5^2 - 3^2} = 4", say: "Pythagoras." },
          { step: 3, m: "\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}} = \\tfrac{4}{5}", say: "Read it off. $\\theta$ is acute (cosine positive), so the sine is positive." }] },
        gate: true, then: "$\\sin\\left(\\arccos\\frac{3}{5}\\right) = \\dfrac{4}{5}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\cos(\\arctan 2)$.",
        how: HOW_10, skill: "Compositions of inverse trigonometric functions",
        steps: [
          { step: 1, ask: "$\\theta = \\arctan 2$ means $\\tan\\theta = 2 = \\dfrac{2}{1}$. Tangent is opposite over…", type: "choice", answer: 0, options: [{ t: "adjacent, so opp $= 2$, adj $= 1$" }, { t: "hypotenuse", fb: "Tangent is opposite over **adjacent**." }], m: "\\text{opp} = 2, \\ \\text{adj} = 1", say: "Label the legs." },
          { step: 2, ask: "The hypotenuse is $\\sqrt{2^2 + 1^2} =$ (type it as an expression)", type: "num", pre: "hyp $\\approx$", answer: 2.2361, tol: 0.0006, calc: true, near: [{ v: 3, fb: "Add the squares first: $4 + 1 = 5$, then take the square root." }], hint: "$\\sqrt{5} \\approx 2.236$.", m: "\\text{hyp} = \\sqrt{5}", say: "Pythagoras." },
          { step: 3, ask: "$\\cos\\theta = \\dfrac{\\text{adj}}{\\text{hyp}} = \\dfrac{1}{\\sqrt{5}}$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", type: "num", pre: "$\\cos\\theta \\approx$", answer: 0.4472, tol: 0.0006, calc: true, near: [{ v: 0.8944, tol: 0.0006, fb: "That is $\\sin\\theta = \\frac{2}{\\sqrt{5}}$. Cosine is adjacent over hypotenuse." }], hint: "$\\frac{1}{2.236}$.", m: "\\cos\\theta = \\tfrac{1}{\\sqrt{5}}", say: "About 0.447." }],
        why: "Name it, draw the triangle, read it off." },
      { type: "num", kicker: "On your own", prompt: "Find $\\tan\\left(\\arcsin\\dfrac{5}{13}\\right)$. (A fraction or decimal is fine.)", pre: "value $\\approx$", answer: 0.4167, tol: 0.0006, skill: "Compositions of inverse trigonometric functions",
        near: [{ v: 0.3846, tol: 0.0006, fb: "That is $\\sin\\theta = \\frac{5}{13}$. We want the tangent: opposite over adjacent." }, { v: 2.4, tol: 0.001, fb: "That is $\\cot\\theta = \\frac{12}{5}$, upside down." }], hints: ["opp $= 5$, hyp $= 13$, adj $= 12$."], why: "$\\frac{5}{12}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A negative argument.** Find $\\sin\\left(\\arccos\\left(-\\dfrac{3}{5}\\right)\\right)$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "\\theta = \\arccos\\left(-\\tfrac{3}{5}\\right)", say: "$\\cos\\theta = -\\frac{3}{5}$, and $\\theta$ is in $[0, \\pi]$." },
          { step: 1, m: "\\cos\\theta < 0 \\ \\Rightarrow \\ \\theta \\text{ in quadrant II}", say: "Within $[0, \\pi]$, a negative cosine means quadrant II.", ask: { prompt: "In quadrant II, is the sine positive or negative?", answer: 0, options: [{ t: "positive" }, { t: "negative", fb: "Quadrant II is above the $x$-axis." }] } },
          { step: 2, m: "|\\text{adj}| = 3, \\ \\text{hyp} = 5, \\ \\text{opp} = 4", say: "Use the triangle with the **positive** numbers, as before." },
          { step: 3, m: "\\sin\\theta = +\\tfrac{4}{5}", say: "The sign comes from the quadrant: positive in quadrant II." }] },
        gate: true, then: "$\\sin\\left(\\arccos\\left(-\\frac{3}{5}\\right)\\right) = \\dfrac{4}{5}$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\cos\\left(\\arcsin\\dfrac{1}{2}\\right)$. (The box accepts expressions such as 2*ln(5), 3*sin(20°) or 1.05^3.)", pre: "value $\\approx$", answer: 0.866, tol: 0.0006, calc: true, skill: "Compositions of inverse trigonometric functions",
        near: [{ v: 0.5, fb: "That is $\\sin\\theta$. The cosine is the other leg over the hypotenuse." }], hints: ["$\\arcsin\\frac{1}{2} = \\frac{\\pi}{6}$, and $\\cos\\frac{\\pi}{6} = \\frac{\\sqrt{3}}{2}$."], why: "$\\frac{\\sqrt{3}}{2} \\approx 0.866$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Eve says $\\sin\\left(\\arccos\\dfrac{3}{5}\\right) = \\dfrac{3}{5}$ \"because the functions cancel\". What is wrong?",
        options: [{ t: "$\\sin$ and $\\arccos$ are **not** inverses of each other: $\\sin$ and $\\arcsin$ are. Use a triangle: the answer is $\\frac{4}{5}$." }, { t: "Nothing is wrong.", fb: "Test it: $\\arccos\\frac{3}{5} \\approx 53^\\circ$, and $\\sin 53^\\circ \\approx 0.8$, not 0.6." }, { t: "The answer is $\\frac{5}{3}$.", fb: "A sine is never above 1." }],
        answer: 0, skill: "Compositions of inverse trigonometric functions", hints: ["Cancelling only works for a function and **its own** inverse."], why: "$\\frac{4}{5}$." },
      { type: "num", kicker: "Use it", prompt: "A 5 m ramp rises 3 m, so $\\sin\\theta = \\frac{3}{5}$. How far along the ground does it reach? That is $5\\cos(\\arcsin\\frac{3}{5})$.", pre: "run =", post: "m", answer: 4, skill: "Compositions of inverse trigonometric functions",
        near: [{ v: 3, fb: "3 is the rise. The run is the other leg." }], hints: ["The triangle is 3-4-5."], why: "$5 \\cdot \\frac{4}{5} = 4$ m." }
    ]
  });
  /* ================================================================ Skills */
  var TRIP6 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  var SKILLS = [
    { id: "pc6-sinecos", title: "Sine and cosine at multiples of π/2", lesson: 2,
      gen: function (R) {
        var k = R.int(-9, 15), f = R.pick(["sin", "cos"]), ans = f === "sin" ? [0, 1, 0, -1][((k % 4) + 4) % 4] : [1, 0, -1, 0][((k % 4) + 4) % 4], arg = k === 0 ? "0" : k % 2 === 0 ? (k / 2 === 1 ? "\\pi" : k / 2 === -1 ? "-\\pi" : (k / 2) + "\\pi") : (k === 1 ? "\\frac{\\pi}{2}" : k === -1 ? "-\\frac{\\pi}{2}" : "\\frac{" + k + "\\pi}{2}");
        return { type: "num", prompt: "Find $\\" + f + "\\left(" + arg + "\\right)$.", pre: "value =", answer: ans,
          near: near(ans, [{ v: -ans === 0 ? 5 : -ans, fb: "Reduce by whole periods of $2\\pi$, then use the key points $0, \\frac{\\pi}{2}, \\pi, \\frac{3\\pi}{2}$." }, { v: ans === 0 ? 1 : 0, fb: "Check the key points of the wave: sine is $0, 1, 0, -1$ and cosine is $1, 0, -1, 0$ at $0, \\frac{\\pi}{2}, \\pi, \\frac{3\\pi}{2}$." }].filter(function (o) { return o.v !== ans; })),
          hints: ["Subtract multiples of $2\\pi$ to get between 0 and $2\\pi$."], why: "$\\" + f + "\\left(" + arg + "\\right) = " + ans + "$." };
      } },
    { id: "pc6-ampperiod", title: "Amplitude and period", lesson: 3,
      gen: function (R) {
        var A = R.pick([-3, -2, -1.5, 2, 3, 4, 0.5]), B = R.pick([2, 3, 4, 0.5, 1.5, 6]), f = R.pick(["sin", "cos"]);
        if (R.chance(0.5)) return { type: "num", prompt: "What is the amplitude of $y = " + (A === 1 ? "" : A === -1 ? "-" : nm(A)) + "\\" + f + "(" + nm(B) + "x)$?", pre: "amplitude =", answer: Math.abs(A), near: near(Math.abs(A), [{ v: A, fb: "Amplitude is a distance, so it is positive: $|A|$." }, { v: B, fb: "$B$ sets the period. The amplitude is $|A|$." }]), hints: ["$|A|$."], why: "$|" + nm(A) + "| = " + nm(Math.abs(A)) + "$." };
        var per = 2 / B;
        return { type: "num", prompt: "What is the period of $y = " + nm(A) + "\\" + f + "(" + nm(B) + "x)$? Give the number in front of $\\pi$ (a fraction is fine).", pre: "period $=$", post: "× π", answer: per, tol: 0.001, near: near(per, [{ v: B / 2, tol: 0.001, fb: "Divide: the period is $\\frac{2\\pi}{B}$." }, { v: 2 * B, tol: 0.001, fb: "A bigger $B$ gives a **shorter** period: $\\frac{2\\pi}{B}$." }]), hints: ["$\\frac{2\\pi}{|B|}$."], why: "$\\frac{2\\pi}{" + nm(B) + "} = " + ratTex(2, B === 0.5 ? 0.5 : B) + "\\pi$." };
      } },
    { id: "pc6-shift", title: "Phase shift", lesson: 4,
      gen: function (R) {
        var B = R.pick([1, 2, 3, 4]), c = R.pick([[1, 6], [1, 4], [1, 3], [1, 2], [2, 3]]), dir = R.pick([1, -1]), sh = "\\frac{" + (c[0] === 1 ? "" : c[0]) + "\\pi}{" + c[1] + "}", E = [c[0] * B, c[1]], g = GC6(E[0], E[1]), Etex = (E[0] / g === 1 ? "" : E[0] / g) + "\\pi" + (E[1] / g === 1 ? "" : "/" + E[1] / g);
        var f = R.pick(["sin", "cos"]), Etx = E[1] / g === 1 ? (E[0] / g === 1 ? "\\pi" : (E[0] / g) + "\\pi") : "\\frac{" + (E[0] / g === 1 ? "" : E[0] / g) + "\\pi}{" + E[1] / g + "}";
        var inside = (B === 1 ? "x" : B + "x") + " " + (dir > 0 ? "-" : "+") + " " + Etx, right = (dir > 0 ? "right " : "left ") + "$" + sh + "$";
        var wrongs = [{ t: (dir > 0 ? "left " : "right ") + "$" + sh + "$", fb: "$x - C$ moves the graph **right**; $x + C$ moves it left." }];
        if (B > 1) wrongs.push({ t: (dir > 0 ? "right " : "left ") + "$" + Etx + "$", fb: "Factor out $B = " + B + "$ first: $" + inside + " = " + B + "\\left(x " + (dir > 0 ? "-" : "+") + " " + sh + "\\right)$." }, { t: (dir > 0 ? "left " : "right ") + "$" + Etx + "$", fb: "Factor out $B$ first, and remember $x - C$ is a shift **right**." });
        else wrongs.push({ t: "no shift", fb: "There is a number added inside the bracket: that shifts the graph sideways." });
        return mc(R, { prompt: "What is the phase shift of $y = \\" + f + "(" + inside + ")$?", right: right, wrong: wrongs, keep: true, hints: ["Write the inside as $B(x - C)$."], why: "$" + inside + " = " + (B === 1 ? "" : B) + "\\left(x " + (dir > 0 ? "-" : "+") + " " + sh + "\\right)$: " + right + "." });
      } },
    { id: "pc6-writesin", title: "Midline, amplitude and B from a graph", lesson: 5,
      gen: function (R) {
        var mn = R.int(-4, 2), amp = R.int(1, 5), mx = mn + 2 * amp, T = R.pick([2, 3, 4, 6, 8, 12]), t = R.int(0, 2);
        if (t === 0) return { type: "num", prompt: "A wave has a maximum of " + mx + " and a minimum of " + mn + ". What is its midline $y = D$?", pre: "$D =$", answer: (mx + mn) / 2, near: near((mx + mn) / 2, [{ v: amp, fb: "That is the amplitude, half the distance between them. The midline is the average." }, { v: mx - mn, fb: "That is the distance between max and min." }]), hints: ["$\\frac{\\max + \\min}{2}$."], why: "$\\frac{" + mx + " + " + par(mn) + "}{2} = " + (mx + mn) / 2 + "$." };
        if (t === 1) return { type: "num", prompt: "A wave has a maximum of " + mx + " and a minimum of " + mn + ". What is its amplitude?", pre: "$|A| =$", answer: amp, near: near(amp, [{ v: mx - mn, fb: "That is the full height. The amplitude is **half** of it." }, { v: (mx + mn) / 2, fb: "That is the midline. The amplitude is half the distance between max and min." }]), hints: ["$\\frac{\\max - \\min}{2}$."], why: "$\\frac{" + mx + " - " + par(mn) + "}{2} = " + amp + "$." };
        return { type: "num", prompt: "The peaks of a wave are " + T + " units apart. In $y = A\\cos(Bx)$, what is $B$? Give the number in front of $\\pi$ (a fraction is fine).", pre: "$B =$", post: "× π", answer: 2 / T, tol: 0.001, near: near(2 / T, [{ v: T / 2, tol: 0.001, fb: "$B = \\frac{2\\pi}{T}$: divide $2\\pi$ by the period." }, { v: 2 * T, tol: 0.001, fb: "$B = \\frac{2\\pi}{T}$, not $2\\pi T$." }]), hints: ["$B = \\frac{2\\pi}{T}$."], why: "$\\frac{2\\pi}{" + T + "} = " + ratTex(2, T) + "\\pi$." };
      } },
    { id: "pc6-model", title: "Evaluate a sinusoidal model", lesson: 6,
      gen: function (R) {
        var D = R.pick([20, 25, 30, 50, 70]), A = R.pick([5, 10, 20]), P = R.pick([8, 12, 24, 40, 80]), q = R.int(0, 4), t = q * P / 4, sg = R.pick([1, -1]);
        var cv = Math.round(Math.cos(2 * PI * t / P) * 1e9) / 1e9, ans = D + sg * A * cv;
        return { type: "num", prompt: "A quantity is modelled by $y = " + D + " " + (sg > 0 ? "+" : "-") + " " + A + "\\cos\\left(\\dfrac{2\\pi}{" + P + "}t\\right)$. Find $y$ when $t = " + t + "$.", pre: "$y =$", answer: ans,
          near: near(ans, [{ v: D, fb: "Work out the cosine of $\\frac{2\\pi}{" + P + "} \\cdot " + t + "$ first; it is not always 0." }, { v: D + A, fb: "That is the maximum. At $t = " + t + "$ the angle is $" + q + "\\cdot\\frac{\\pi}{2}$." }]),
          hints: ["The angle is $\\frac{2\\pi}{" + P + "} \\cdot " + t + " = " + q + "\\cdot\\frac{\\pi}{2}$."], why: "$\\cos\\left(" + q + "\\cdot\\frac{\\pi}{2}\\right) = " + cv + "$, so $y = " + ans + "$." };
      } },
    { id: "pc6-tan", title: "Period and asymptotes of tangent", lesson: 7,
      gen: function (R) {
        var B = R.pick([2, 3, 4, 0.5, 1.5]), t = R.int(0, 1);
        if (t === 0) return { type: "num", prompt: "What is the period of $y = \\tan(" + nm(B) + "x)$? Give the number in front of $\\pi$ (a fraction is fine).", pre: "period $=$", post: "× π", answer: 1 / B, tol: 0.001, near: near(1 / B, [{ v: 2 / B, tol: 0.001, fb: "That is the period of sine or cosine. Tangent repeats every $\\pi$: divide by $B$." }, { v: B, tol: 0.001, fb: "Divide: the period is $\\frac{\\pi}{B}$." }]), hints: ["$\\frac{\\pi}{|B|}$."], why: "$\\frac{\\pi}{" + nm(B) + "}$." };
        return { type: "num", prompt: "The first vertical asymptote of $y = \\tan(" + nm(B) + "x)$ to the right of 0 is at $x = $ (number in front of $\pi$; a fraction is fine).", pre: "$x =$", post: "× π", answer: 1 / (2 * B), tol: 0.001, near: near(1 / (2 * B), [{ v: 1 / B, tol: 0.001, fb: "That is a whole period away. The asymptote is half a period from the centre." }, { v: 0.5, tol: 0.001, fb: "$\\frac{\\pi}{2}$ is the asymptote of plain $\\tan x$. With $B = " + nm(B) + "$ solve $" + nm(B) + "x = \\frac{\\pi}{2}$." }]), hints: ["Solve $Bx = \\frac{\\pi}{2}$."], why: "$x = \\frac{\\pi}{2 \\cdot " + nm(B) + "}$." };
      } },
    { id: "pc6-asym", title: "The first vertical asymptote", lesson: 8,
      gen: function (R) {
        var f = R.pick(["sec", "csc", "tan", "cot"]), B = R.pick([1, 2, 3, 4]), odd = f === "sec" || f === "tan", d = odd ? 2 * B : B;
        var pit = function (n, dd) { return dd === 1 ? (n === 1 ? "\\pi" : n + "\\pi") : "\\frac{" + (n === 1 ? "" : n) + "\\pi}{" + dd + "}"; };
        var right = "$x = " + pit(1, d) + "$", cands = [pit(1, B), pit(1, 2 * B), pit(1, 4 * B), pit(2, B)].filter(function (t, i, a) { return a.indexOf(t) === i && "$x = " + t + "$" !== right; });
        var why = (odd ? "The bottom is $\\cos(" + (B === 1 ? "" : B) + "x)$, which is 0 first when $" + (B === 1 ? "" : B) + "x = \\frac{\\pi}{2}" : "The bottom is $\\sin(" + (B === 1 ? "" : B) + "x)$, which is 0 first when $" + (B === 1 ? "" : B) + "x = \\pi") + "$, so $x = " + pit(1, d) + "$.";
        return mc(R, { prompt: "What is the first vertical asymptote of $y = \\" + f + "(" + (B === 1 ? "" : B) + "x)$ to the right of 0?", right: right, wrong: cands.slice(0, 3).map(function (t) { return { t: "$x = " + t + "$", fb: "Find where the bottom of the ratio is 0. " + why }; }), keep: true, hints: ["Where is the denominator 0?"], why: why });
      } },
    { id: "pc6-cot", title: "The first zero of a trigonometric function", lesson: 9,
      gen: function (R) {
        var B = R.pick([1, 2, 3, 4, 6]), f = R.pick(["sin", "tan", "cos", "cot"]), half = f === "cos" || f === "cot", ans = half ? 1 / (2 * B) : 1 / B;
        return { type: "num", prompt: "The first zero of $y = \\" + f + "(" + (B === 1 ? "" : B) + "x)$ to the right of 0 is at $x = $ (number in front of $\pi$; a fraction is fine).", pre: "$x =$", post: "× π", answer: ans, tol: 0.001,
          near: near(ans, [{ v: half ? 1 / B : 1 / (2 * B), tol: 0.001, fb: half ? "That is the first zero of sine or tangent. For $\\" + f + "$ the first zero is at $" + (B === 1 ? "" : B) + "x = \\frac{\\pi}{2}$." : "That is where $\\" + (f === "sin" ? "cos" : "cot") + "$ is zero. For $\\" + f + "$ solve $" + (B === 1 ? "" : B) + "x = \\pi$." }, { v: 0.5, tol: 0.001, fb: "That is the zero of the plain function. Divide by $B = " + B + "$." }].filter(function (o) { return Math.abs(o.v - ans) > 1e-9; })),
          hints: ["Set the inside " + (half ? "$= \\frac{\\pi}{2}$" : "$= \\pi$") + "."], why: "$x = " + ratTex(1, half ? 2 * B : B) + "\\pi$." };
      } },
    { id: "pc6-arcvalue", title: "Exact values of inverse trigonometric functions", lesson: 10,
      gen: function (R) {
        var T = R.pick([["\\arcsin\\frac{1}{2}", "\\frac{\\pi}{6}", ["\\frac{5\\pi}{6}", "\\frac{\\pi}{3}", "\\frac{7\\pi}{6}"]], ["\\arcsin\\left(-\\frac{\\sqrt{2}}{2}\\right)", "-\\frac{\\pi}{4}", ["\\frac{5\\pi}{4}", "\\frac{\\pi}{4}", "\\frac{7\\pi}{4}"]], ["\\arccos\\left(-\\frac{1}{2}\\right)", "\\frac{2\\pi}{3}", ["\\frac{4\\pi}{3}", "-\\frac{\\pi}{3}", "\\frac{\\pi}{3}"]], ["\\arccos\\frac{\\sqrt{3}}{2}", "\\frac{\\pi}{6}", ["-\\frac{\\pi}{6}", "\\frac{\\pi}{3}", "\\frac{11\\pi}{6}"]], ["\\arctan 1", "\\frac{\\pi}{4}", ["\\frac{5\\pi}{4}", "\\frac{\\pi}{2}", "-\\frac{\\pi}{4}"]], ["\\arctan\\left(-\\sqrt{3}\\right)", "-\\frac{\\pi}{3}", ["\\frac{2\\pi}{3}", "\\frac{\\pi}{3}", "-\\frac{\\pi}{6}"]], ["\\arcsin(-1)", "-\\frac{\\pi}{2}", ["\\frac{3\\pi}{2}", "\\frac{\\pi}{2}", "-\\pi"]], ["\\arccos(-1)", "\\pi", ["-\\pi", "0", "\\frac{3\\pi}{2}"]]]);
        return mc(R, { prompt: "Find $" + T[0] + "$.", right: "$" + T[1] + "$", wrong: T[2].map(function (t) { return { t: "$" + t + "$", fb: "That angle may have the right ratio, but the inverse function returns an angle in its own range: arcsin and arctan in $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$, arccos in $[0, \\pi]$." }; }), keep: true, hints: ["Find the angle in the **restricted range** with that ratio."], why: "$" + T[0] + " = " + T[1] + "$." });
      } },
    { id: "pc6-arccomp", title: "Trigonometric functions of inverse functions", lesson: 11,
      gen: function (R) {
        var T = R.pick(TRIP6), a = T[0], b = T[1], c = T[2], k = R.int(0, 3);
        if (k === 0) return { type: "num", prompt: "Find $\\sin\\left(\\arccos\\frac{" + a + "}{" + c + "}\\right)$. (A fraction is fine.)", pre: "value =", answer: b / c, tol: 0.001, near: near(b / c, [{ v: a / c, tol: 0.001, fb: "$\\sin$ and $\\arccos$ do not cancel. Draw the triangle: adjacent $" + a + "$, hypotenuse $" + c + "$, opposite $" + b + "$." }]), hints: ["Draw a right triangle with $\\cos\\theta = \\frac{" + a + "}{" + c + "}$."], why: "$\\frac{" + b + "}{" + c + "}$." };
        if (k === 1) return { type: "num", prompt: "Find $\\cos\\left(\\arcsin\\frac{" + b + "}{" + c + "}\\right)$. (A fraction is fine.)", pre: "value =", answer: a / c, tol: 0.001, near: near(a / c, [{ v: b / c, tol: 0.001, fb: "$\\cos$ and $\\arcsin$ do not cancel. Draw the triangle: opposite $" + b + "$, hypotenuse $" + c + "$, adjacent $" + a + "$." }]), hints: ["Draw a right triangle with $\\sin\\theta = \\frac{" + b + "}{" + c + "}$."], why: "$\\frac{" + a + "}{" + c + "}$." };
        if (k === 2) return { type: "num", prompt: "Find $\\tan\\left(\\arcsin\\frac{" + b + "}{" + c + "}\\right)$. (A fraction is fine.)", pre: "value =", answer: b / a, tol: 0.001, near: near(b / a, [{ v: a / b, tol: 0.001, fb: "That is $\\cot\\theta$. Tangent is opposite over adjacent: $\\frac{" + b + "}{" + a + "}$." }]), hints: ["opp $= " + b + "$, hyp $= " + c + "$, adj $= " + a + "$."], why: "$\\frac{" + b + "}{" + a + "}$." };
        return { type: "num", prompt: "Find $\\cos\\left(\\arctan\\frac{" + b + "}{" + a + "}\\right)$. (A fraction is fine.)", pre: "value =", answer: a / c, tol: 0.001, near: near(a / c, [{ v: b / c, tol: 0.001, fb: "That is $\\sin\\theta$. Cosine is adjacent over hypotenuse: $\\frac{" + a + "}{" + c + "}$." }]), hints: ["opp $= " + b + "$, adj $= " + a + "$, so hyp $= " + c + "$."], why: "$\\frac{" + a + "}{" + c + "}$." };
      } }
  ];
  L.unit("precalc", 6, {
    title: "Periodic Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Graphs of sine and cosine: amplitude, period, shifts and writing a formula.", skills: ["pc6-sinecos", "pc6-ampperiod", "pc6-shift", "pc6-writesin"], per: 2 },
      { title: "Quiz 2", after: 9, blurb: "Models, and the graphs of tangent, secant, cosecant and cotangent.", skills: ["pc6-model", "pc6-tan", "pc6-asym", "pc6-cot"], per: 2 },
      { title: "Quiz 3", after: 11, blurb: "The inverse trigonometric functions and their compositions.", skills: ["pc6-arcvalue", "pc6-arccomp"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:6", {
    2: { name: "Graphs of sine and cosine", frame: "Sine and cosine are [[periodic]]: they repeat every [[$2\\pi$]]. Both stay between [[$-1$]] and 1. Sine starts at [[0]] and rises; cosine starts at its [[maximum]], 1. Plot the five key points of a period and draw a smooth wave.",
         chips: ["$\\pi$", "tangent"], fb: { "$\\pi$": "The period of sine and cosine is $2\\pi$.", "tangent": "This is about sine and cosine." } },
    3: { name: "Amplitude and period", frame: "For $y = A\\sin(Bx)$: the amplitude is [[$\\vert A\\vert$]] and the period is [[$\\frac{2\\pi}{\\vert B\\vert}$]]. A negative $A$ [[flips]] the wave. A larger $B$ makes the period [[shorter]].",
         chips: ["$B$", "longer"], fb: { "$B$": "The amplitude is $|A|$; $B$ sets the period.", "longer": "A larger $B$ squeezes the wave: a shorter period." } },
    4: { name: "Phase and vertical shift", frame: "In $y = A\\sin(B(x - C)) + D$, the midline is $y =$ [[$D$]] and the phase shift is [[$C$]] to the right. If the formula is $\\sin(Bx - E)$, [[factor]] out $B$ first: the shift is $\\frac{E}{B}$.",
         chips: ["$A$", "multiply"], fb: { "$A$": "The midline is the vertical shift $D$.", "multiply": "To find the phase shift, factor $B$ out; do not multiply." } },
    5: { name: "Writing a sinusoid", frame: "Midline $D = \\frac{\\max + \\min}{2}$, amplitude $|A| = \\frac{\\max - \\min}{2}$, and $B = \\frac{2\\pi}{T}$ where $T$ is the distance between two [[peaks]]. Use [[cosine]] with a shift to a peak, or sine with a shift to a midline crossing going [[up]].",
         chips: ["troughs", "down"], fb: { "troughs": "Peaks or troughs both work; the period is the distance between two peaks.", "down": "A sine rises through the midline at its start." } },
    6: { name: "Modeling with sinusoids", frame: "Anything that cycles can be modelled by $y = A\\cos(Bt) + D$. Read the maximum, minimum and [[period]] $T$; then $B =$ [[$\\frac{2\\pi}{T}$]]. If it starts at the bottom use [[$-\\cos$]]. Solve the model to find [[when]] it reaches a value.",
         chips: ["$T$", "sin"], fb: { "$T$": "$B = \\frac{2\\pi}{T}$: the period goes on the bottom.", "sin": "Starting at the bottom needs a flipped cosine." } },
    7: { name: "The tangent graph", frame: "$\\tan x = \\frac{\\sin x}{\\cos x}$ has period [[$\\pi$]], vertical asymptotes where $\\cos x =$ [[0]], and it [[rises]] on each branch. For $y = A\\tan(Bx)$ the period is [[$\\frac{\\pi}{\\vert B\\vert}$]].",
         chips: ["$2\\pi$", "falls"], fb: { "$2\\pi$": "Tangent repeats every $\\pi$.", "falls": "Tangent rises; cotangent falls." } },
    8: { name: "Secant and cosecant", frame: "$\\sec x = \\frac{1}{\\cos x}$ and $\\csc x = \\frac{1}{\\sin x}$ have period [[$2\\pi$]]. Their vertical asymptotes are where the partner is [[0]]. They touch the partner at its [[peaks]] and troughs, and never enter the band between [[$-1$]] and 1.",
         chips: ["$\\pi$", "tangent"], fb: { "$\\pi$": "Secant and cosecant repeat every $2\\pi$, like their partners.", "tangent": "The partner of secant is cosine." } },
    9: { name: "The cotangent graph", frame: "$\\cot x = \\frac{\\cos x}{\\sin x}$ has period [[$\\pi$]], asymptotes at $x = k\\pi$, zeros at [[$\\frac{\\pi}{2} + k\\pi$]], and [[falls]] on each branch. $\\tan$ and $\\cot$ have period $\\pi$; the other four have period [[$2\\pi$]].",
         chips: ["rises", "$k\\pi$ zeros"], fb: { "rises": "Cotangent falls on each branch.", "$k\\pi$ zeros": "At $k\\pi$ cotangent has asymptotes; its zeros are at $\\frac{\\pi}{2} + k\\pi$." } },
    10: { name: "Inverse trigonometric functions", frame: "$\\arcsin x$ is the angle in [[$\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$]] whose sine is $x$. $\\arccos x$ is in [[$[0, \\pi]$]]. $\\arctan x$ is in $\\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right)$. $\\arcsin$ and $\\arccos$ need $|x| \\le$ [[1]].",
          chips: ["$[0, 2\\pi]$", "$2$"], fb: { "$[0, 2\\pi]$": "Each inverse picks one-to-one part of the wave: not a whole period.", "$2$": "Sine and cosine never exceed 1, so $|x| \\le 1$." } },
    11: { name: "Compositions", frame: "To evaluate $\\sin(\\arccos x)$, let $\\theta = \\arccos x$ and draw a [[right triangle]]. Label two sides from the ratio, find the third with [[Pythagoras]], then read off the new ratio. Check the [[sign]] from the quadrant of $\\theta$.",
          chips: ["cancel", "radians"], fb: { "cancel": "Only a function and **its own** inverse cancel: $\\sin(\\arcsin x) = x$, but $\\sin(\\arccos x) \\ne x$.", "radians": "A triangle gives the ratio directly; no conversion needed." } }
  });
})();
