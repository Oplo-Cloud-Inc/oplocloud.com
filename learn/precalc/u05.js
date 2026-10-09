/* ==========================================================================
   Precalculus — Unit 5: Trigonometric Functions. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 5: angles in degrees and
   radians, arc length and circular motion, the unit circle with sine and
   cosine, the other four trigonometric functions, and right-triangle
   trigonometry. Each section is split into lessons small enough to finish
   in one sitting; each teaches one method: the idea, an example to watch,
   one done together, then on your own, a harder case, find the error, use
   it, and the concept built at the end.

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
    blurb: "Before Chapter 5 · The circumference of a circle, the Pythagorean theorem, a fraction of a turn, cancelling $\\pi$ and similar triangles.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · Circles", prompt: "A circle has radius 3. What is its circumference?",
        options: [{ t: "$6\\pi$" }, { t: "$9\\pi$", fb: "$9\\pi$ is the area $\\pi r^2$. The circumference is $2\\pi r$." }, { t: "$3\\pi$", fb: "That leaves out the 2: $C = 2\\pi r$." }],
        answer: 0, skill: "Circumference", hints: ["$C = 2\\pi r$."], why: "$2\\pi \\cdot 3 = 6\\pi$." },
      { type: "num", kicker: "Check 2 · Pythagoras", prompt: "A right triangle has legs 6 and 8. How long is the hypotenuse?", answer: 10, skill: "Pythagorean theorem",
        near: [{ v: 14, fb: "Add the **squares**, then take the square root: $36 + 64 = 100$." }, { v: 100, fb: "That is $c^2$. Take the square root." }], hints: ["$6^2 + 8^2 = c^2$."], why: "$\\sqrt{100} = 10$." },
      { type: "choice", kicker: "Check 3 · Fractions of a turn", prompt: "What fraction of a full turn (360°) is 90°?",
        options: [{ t: "$\\frac{1}{4}$" }, { t: "$\\frac{1}{3}$", fb: "$\\frac{360}{3} = 120$. Check: $\\frac{90}{360}$." }, { t: "$\\frac{1}{2}$", fb: "A half turn is 180°." }],
        answer: 0, skill: "Fractions", hints: ["$\\frac{90}{360}$."], why: "$\\frac{90}{360} = \\frac{1}{4}$." },
      { type: "num", kicker: "Check 4 · Cancelling", prompt: "Evaluate $\\dfrac{\\pi}{6} \\cdot \\dfrac{180}{\\pi}$.", answer: 30, skill: "Cancel factors",
        near: [{ v: 0.0095, tol: 0.001, fb: "The two $\\pi$'s cancel: it is $\\frac{180}{6}$." }], hints: ["The $\\pi$ on top cancels the $\\pi$ on the bottom."], why: "$\\frac{180}{6} = 30$." },
      { type: "num", kicker: "Check 5 · Similar triangles", prompt: "A triangle with sides 3, 4, 5 is enlarged so its shortest side is 6. How long is its longest side?", answer: 10, skill: "Similar triangles",
        near: [{ v: 8, fb: "That is the middle side. The longest side is the one that was 5." }], hints: ["Every side doubles."], why: "$5 \\cdot 2 = 10$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 5.1**. If **check 3** slipped, lesson 5.1 starts with it. If **check 4** slipped, look again at lesson 5.3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 5 */
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; };
  var GC5 = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; };
  // An angle in degrees as TeX in radians: radTex(150) is "\frac{5\pi}{6}".
  var radTex = function (d) {
    if (d === 0) return "0";
    var g = GC5(d, 180), n = d / g, m = 180 / g, sg = n < 0 ? "-" : "", an = Math.abs(n);
    return sg + (m === 1 ? (an === 1 ? "\\pi" : an + "\\pi") : (an === 1 ? "\\frac{\\pi}{" + m + "}" : "\\frac{" + an + "\\pi}{" + m + "}"));
  };
  var angDeg = function (p) { var d = Math.round(Math.atan2(p[1], p[0]) * 180 / Math.PI); return d < 0 ? d + 360 : d; };
  var QUADN = function (d) { d = ((d % 360) + 360) % 360; return d % 90 === 0 ? "on an axis" : d < 90 ? "quadrant I" : d < 180 ? "quadrant II" : d < 270 ? "quadrant III" : "quadrant IV"; };
  var ROM = ["", "I", "II", "III", "IV"];
  var QLAB = function (r) { return [{ text: "I", at: [r, r], c: "soft" }, { text: "II", at: [-r, r], c: "soft" }, { text: "III", at: [-r, -r], c: "soft" }, { text: "IV", at: [r, -r], c: "soft" }]; };
  // An angle in standard position: the initial side (blue), the terminal side (orange) and the turn (green).
  function angfig(deg, alt) {
    var r = 2.4, a = deg * Math.PI / 180, it = [{ seg: [[0, 0], [r, 0]], c: "blue" }, { seg: [[0, 0], [r * Math.cos(a), r * Math.sin(a)]], c: "orange" }], m = deg % 360;
    if (deg !== 0) it.push(deg > 0 ? { turn: [[0, 0], 0.9, 0, m === 0 ? 359.9 : m], c: "green" } : { turn: [[0, 0], 0.9, 0, m === 0 ? -359.9 : m], cw: true, c: "green" });
    return grid(alt, it.concat(QLAB(2.6)), { x: [-3, 3], y: [-3, 3], u: 38 });
  }

  /* ============================================ 1 · Angles in standard position */
  var HOW_1 = [["Start", "The initial side lies along the positive $x$-axis, with the vertex at the origin."],
               ["Turn", "Turn counterclockwise for a positive angle, clockwise for a negative one."],
               ["Mark", "Draw the terminal side where the turn stops, and name its quadrant."]];
  LESSONS.push({
    title: "Angles in standard position", art: "pcang",
    blurb: "Book 5.1 · Start on the positive $x$-axis and turn: counterclockwise is positive.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A full turn is $360^\\circ$. How many degrees is **half** a turn?", answer: 180, post: "degrees", skill: "Fractions of a turn",
        near: [{ v: 90, fb: "90° is a quarter turn." }], hints: ["Half of 360."], why: "$360 \\div 2 = 180$." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue side stays on the positive $x$-axis. Drag the orange point round the circle and watch the angle it turns through. Stop in **each of the four quadrants**.",
        scene: { type: "sketch", x: [-3, 3], y: [-3, 3], u: 52, w: 340, gate: true,
          pts: { P: { at: [1.556, 1.556], drag: true, c: "orange", say: "The terminal side", on: { circle: [[0, 0], 2.2], snapDeg: 15 } } },
          track: function (s) { var d = angDeg(s.P); return d % 90 === 0 ? null : "q" + (Math.floor(d / 90) + 1); },
          draw: function (s) { var d = angDeg(s.P); return [{ seg: [[0, 0], [2.2, 0]], c: "blue" }, { seg: [[0, 0], s.P], c: "orange" }].concat(d > 0 ? [{ turn: [[0, 0], 0.8, 0, d], c: "green" }] : [], QLAB(2.6)); },
          readout: function (s) { var d = angDeg(s.P), n = Object.keys(s.tracked).length; return "$\\theta = " + d + "^\\circ$ — " + QUADN(d) + "<br>Quadrants visited: " + Math.min(n, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        gate: true, then: "The quadrants run counterclockwise: **I** from $0^\\circ$ to $90^\\circ$, **II** to $180^\\circ$, **III** to $270^\\circ$ and **IV** to $360^\\circ$. An angle that stops exactly on an axis is a **quadrantal** angle." },
      { type: "learn", kicker: "The idea",
        prompt: "An angle is **in standard position** when its vertex is at the origin and its **initial side** lies along the positive $x$-axis. The **terminal side** is where the turn stops. A **positive** angle turns counterclockwise, a **negative** angle turns clockwise.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Draw $225^\\circ$ in standard position.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\text{start on the positive } x\\text{-axis}", say: "The blue initial side is fixed." },
          { step: 2, m: "225^\\circ = 180^\\circ + 45^\\circ", say: "A half turn, then 45° more. All counterclockwise, since 225 is positive.", ask: { prompt: "Which way do we turn?", answer: 0, options: [{ t: "Counterclockwise" }, { t: "Clockwise", fb: "A positive angle turns counterclockwise." }] } },
          { step: 3, m: "\\text{terminal side in quadrant III}", say: "Between 180° and 270°.", fig: angfig(225, "The angle 225 degrees in standard position: the terminal side points into the lower left, quadrant III.") }] },
        gate: true, then: "$225^\\circ$ ends in quadrant III." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $-90^\\circ$.",
        how: HOW_1, skill: "Standard position",
        steps: [
          { step: 1, ask: "Where does every angle in standard position start?", type: "choice", answer: 0, options: [{ t: "On the positive $x$-axis" }, { t: "On the positive $y$-axis", fb: "The initial side is along the positive $x$-axis." }], m: "\\text{positive } x\\text{-axis}", say: "The initial side." },
          { step: 2, ask: "The angle is negative. Which way do we turn?", type: "choice", answer: 0, options: [{ t: "Clockwise" }, { t: "Counterclockwise", fb: "Negative angles turn clockwise." }], m: "\\text{clockwise } 90^\\circ", say: "A quarter turn the other way." },
          { step: 3, ask: "Where does the terminal side end up?", type: "choice", answer: 0, options: [{ t: "On the negative $y$-axis" }, { t: "On the positive $y$-axis", fb: "Clockwise from the positive $x$-axis you go **down**." }, { t: "On the negative $x$-axis", fb: "That is a half turn." }], m: "\\text{negative } y\\text{-axis}", say: "A quadrantal angle." }],
        why: "Start, turn, mark." },
      { type: "sort", kicker: "On your own", prompt: "Where does the terminal side of each angle lie?",
        bins: ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV", "On an axis"],
        cards: [{ t: "$30^\\circ$", bin: 0, fb: "Between 0° and 90°." }, { t: "$135^\\circ$", bin: 1, fb: "Between 90° and 180°." }, { t: "$200^\\circ$", bin: 2, fb: "Between 180° and 270°." }, { t: "$300^\\circ$", bin: 3, fb: "Between 270° and 360°." }, { t: "$-45^\\circ$", bin: 3, fb: "A negative angle turns clockwise: 45° below the positive $x$-axis." }, { t: "$270^\\circ$", bin: 4, fb: "Exactly three quarters of a turn: the negative $y$-axis." }],
        skill: "Standard position", hints: ["Which two multiples of 90° is it between?"], why: "The quadrants are 90° wide." },
      { type: "learn", kicker: "A harder case",
        prompt: "**More than a full turn.** Draw $480^\\circ$ in standard position.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "480^\\circ > 360^\\circ", say: "More than one full turn." },
          { step: 2, m: "480^\\circ = 360^\\circ + 120^\\circ", say: "One full turn, then 120° more.", ask: { prompt: "What is $480 - 360$?", answer: 0, options: [{ t: "$120$" }, { t: "$840$", fb: "Subtract the full turn." }] } },
          { step: 3, m: "\\text{terminal side in quadrant II}", say: "After the full turn you are back at the start, then 120° counterclockwise is between 90° and 180°.", fig: angfig(480, "The angle 480 degrees: one full turn and then 120 degrees, so the terminal side is in quadrant II.") }] },
        gate: true, then: "$480^\\circ$ and $120^\\circ$ end in the **same place**." },
      { type: "choice", kicker: "Try it", prompt: "On which axis does the terminal side of $-270^\\circ$ lie?",
        options: [{ t: "The positive $y$-axis" }, { t: "The negative $y$-axis", fb: "$-270^\\circ$ turns clockwise three quarters: that goes round to the top." }, { t: "The negative $x$-axis", fb: "That would be $-180^\\circ$." }],
        answer: 0, skill: "Standard position", hints: ["$-270 + 360 = 90$."], why: "$-270^\\circ$ ends where $90^\\circ$ does." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says $150^\\circ$ is in quadrant III \"because it is past 90° twice\". What is wrong?",
        options: [{ t: "150° is between 90° and 180°: quadrant II." }, { t: "Nothing is wrong.", fb: "Quadrant III starts at 180°." }, { t: "It is in quadrant I.", fb: "Quadrant I stops at 90°." }],
        answer: 0, skill: "Standard position", hints: ["Quadrants are 90° wide: I, II, III, IV."], why: "$90^\\circ < 150^\\circ < 180^\\circ$." },
      { type: "choice", kicker: "Use it", prompt: "A turntable spins $540^\\circ$ counterclockwise from its start. Where does it stop, relative to the start?",
        options: [{ t: "Half a turn from the start (180°)" }, { t: "Back at the start", fb: "$540 = 360 + 180$: one full turn plus a half." }, { t: "A quarter turn from the start", fb: "$540 - 360 = 180$, not 90." }],
        answer: 0, skill: "Standard position", hints: ["Remove full turns of 360°."], why: "$540^\\circ - 360^\\circ = 180^\\circ$." }
    ]
  });

  /* ============================================ 2 · What is a radian? */
  var HOW_2 = [["Arc ÷ radius", "The radian measure of an angle is arc length divided by radius: $\\theta = \\dfrac{s}{r}$."],
               ["Full turn", "A full turn is $2\\pi$ radians; a half turn is $\\pi$."],
               ["Use it", "Find $\\theta$, $s$ or $r$ from the other two."]];
  var G2c = grid("A circle of radius 4 with an arc of length 6: the angle is 1.5 radians.",
    curveT(function (t) { return [4 * Math.cos(t), 4 * Math.sin(t)]; }, 0, 1.5, "green", 60).concat([{ circle: [[0, 0], 4], c: "soft" }, { seg: [[0, 0], [4, 0]], c: "blue" }, { seg: [[0, 0], [4 * Math.cos(1.5), 4 * Math.sin(1.5)]], c: "orange" }, { text: "θ = 1.5", at: [1.2, 0.9], c: "ink" }]),
    { x: [-5, 5], y: [-5, 5], u: 30 });
  LESSONS.push({
    title: "What is a radian?", art: "pcang",
    blurb: "Book 5.1 · A radian measures an angle by the length of the arc it cuts off.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The circumference of a circle is $2\\pi r$. For a circle of radius 1, how many times does the radius fit round the circle? Write it as a decimal, to 2 places.", answer: 6.28, tol: 0.006, calc: true, skill: "Circumference",
        near: [{ v: 3.14, tol: 0.006, fb: "That is half way round. The full circumference is $2\\pi$." }], hints: ["$2\\pi \\approx 6.283$."], why: "$2\\pi \\approx 6.28$." },
      { type: "learn", kicker: "Explore",
        prompt: "On a circle of radius **1**, slide the arc length $s$ along the circle. The angle it cuts off is **$s$ radians**. Find the arc length that gives **1 radian**, a **half turn** and a **full turn**.",
        scene: { type: "sketch", x: [-1.5, 1.5], y: [-1.5, 1.5], u: 100, w: 340, gate: true, pts: {},
          params: { s: { min: 0, max: 6.5, step: 0.1, v: 0, label: "arc length $s$" } },
          track: function (s) { var v = s.p.s; return Math.abs(v - 1) < 0.05 ? "one" : Math.abs(v - Math.PI) < 0.06 ? "half" : Math.abs(v - 2 * Math.PI) < 0.06 ? "full" : null; },
          draw: function (s) { var v = s.p.s; return [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [1, 0]], c: "blue" }, { seg: [[0, 0], [Math.cos(v), Math.sin(v)]], c: "orange" }].concat(v > 0 ? curveT(function (t) { return [Math.cos(t), Math.sin(t)]; }, 0, v, "green", 80) : []); },
          readout: function (s) { var v = s.p.s; return "arc length $" + nm(v) + "$ on a circle of radius 1: the angle is $" + nm(v) + "$ radians $= " + nm(f4(v * 180 / Math.PI, 1)) + "^\\circ$<br>1 radian " + (s.tracked.one ? "✓" : "—") + " · half turn " + (s.tracked.half ? "✓" : "—") + " · full turn " + (s.tracked.full ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.one && s.tracked.half && s.tracked.full); } },
        gate: true, then: "**1 radian** is the angle whose arc is exactly one radius long: about $57.3^\\circ$. A half turn is $\\pi \\approx 3.14$ radians and a full turn is $2\\pi \\approx 6.28$ radians." },
      { type: "learn", kicker: "The idea",
        prompt: "An angle of $\\theta$ **radians** cuts off an arc of length $s = r\\theta$ on a circle of radius $r$, so $\\theta = \\dfrac{s}{r}$. Because the circumference is $2\\pi r$, a full turn is $2\\pi$ radians, and $\\pi$ radians $= 180^\\circ$.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "An arc of length 6 lies on a circle of radius 4. What angle does it cut off?",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "\\theta = \\frac{s}{r} = \\frac{6}{4}", say: "Arc length divided by radius." },
          { step: 1, m: "\\theta = 1.5 \\text{ radians}", say: "No units on the answer: radians are a ratio of two lengths.", fig: G2c, ask: { prompt: "What are the units of $\\frac{6 \\text{ cm}}{4 \\text{ cm}}$?", answer: 0, options: [{ t: "None: the lengths cancel" }, { t: "cm", fb: "Both lengths are in cm, so they cancel." }] } },
          { step: 2, m: "\\frac{1.5}{2\\pi} \\approx 0.24", say: "That is about a quarter of a full turn ($2\\pi \\approx 6.28$)." },
          { step: 3, m: "1.5 \\cdot \\frac{180}{\\pi} \\approx 85.9^\\circ", say: "Multiply by $\\frac{180}{\\pi}$ to see it in degrees." }] },
        gate: true, then: "$\\theta = 1.5$ radians $\\approx 85.9^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do an arc of length 10 on a circle of radius 5.",
        how: HOW_2, skill: "Radians",
        steps: [
          { step: 1, ask: "$\\theta = \\dfrac{s}{r} = \\dfrac{10}{5}$", type: "num", pre: "$\\theta =$", post: "radians", answer: 2, near: [{ v: 0.5, fb: "Arc length on top: $\\frac{10}{5}$, not $\\frac{5}{10}$." }, { v: 50, fb: "Divide, do not multiply." }], hint: "$10 \\div 5$.", m: "\\theta = 2", say: "2 radians." },
          { step: 2, ask: "A full turn is $2\\pi \\approx 6.28$. Is 2 radians more or less than a quarter turn ($\\frac{\\pi}{2} \\approx 1.57$)?", type: "choice", answer: 0, options: [{ t: "More: a little over a quarter turn" }, { t: "Less", fb: "$2 > 1.57$." }], m: "2 > \\tfrac{\\pi}{2}", say: "Between a quarter and a half turn." },
          { step: 3, ask: "In degrees: $2 \\cdot \\dfrac{180}{\\pi}$. (Type 2*180/pi.)", type: "num", pre: "$\\approx$", post: "degrees", answer: 114.59, tol: 0.005, calc: true, near: [{ v: 360, fb: "Multiply by $\\frac{180}{\\pi}$, which is about 57.3." }], hint: "$\\approx 2 \\cdot 57.3$.", m: "\\approx 114.6^\\circ", say: "About 114.6°." }],
        why: "Arc over radius, sense-check, convert." },
      { type: "choice", kicker: "On your own", prompt: "A **quarter** turn is how many radians?",
        options: [{ t: "$\\dfrac{\\pi}{2}$" }, { t: "$\\dfrac{\\pi}{4}$", fb: "That is an eighth of a turn." }, { t: "$\\dfrac{\\pi}{3}$", fb: "That is a sixth of a turn." }],
        answer: 0, skill: "Radians", hints: ["A full turn is $2\\pi$. A quarter of it is…"], why: "$\\frac{2\\pi}{4} = \\frac{\\pi}{2}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Find the radius.** A pendulum swings through 0.4 radians. Its tip travels an arc of 0.6 metres. How long is the pendulum?",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "s = r\\theta", say: "The pendulum length is the radius." },
          { step: 2, m: "0.6 = r \\cdot 0.4", say: "Put in the numbers.", ask: { prompt: "To find $r$ we…", answer: 0, options: [{ t: "divide both sides by 0.4" }, { t: "multiply both sides by 0.4", fb: "$r$ is multiplied by 0.4: undo it by dividing." }] } },
          { step: 3, m: "r = \\frac{0.6}{0.4} = 1.5", say: "The pendulum is 1.5 metres long." }] },
        gate: true, then: "$r = \\dfrac{s}{\\theta} = 1.5$ m." },
      { type: "num", kicker: "Try it", prompt: "An arc of length 9 lies on a circle of radius 6. What is the angle in radians?", pre: "$\\theta =$", post: "radians", answer: 1.5, skill: "Radians",
        near: [{ v: 0.67, tol: 0.01, fb: "That is $\\frac{6}{9}$: upside down. Arc over radius." }, { v: 54, fb: "Divide, do not multiply." }], hints: ["$\\frac{s}{r}$."], why: "$\\frac{9}{6} = 1.5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ali says an arc of 4 on a circle of radius 6 cuts off $\\theta = \\frac{r}{s} = \\frac{6}{4} = 1.5$ radians. What is wrong?",
        options: [{ t: "It is arc over radius: $\\theta = \\frac{s}{r} = \\frac{4}{6} \\approx 0.67$." }, { t: "Nothing is wrong.", fb: "A short arc on a big circle should be a **small** angle: 1.5 is too big." }, { t: "He should multiply: $4 \\cdot 6$.", fb: "$s = r\\theta$, so $\\theta = \\frac{s}{r}$." }],
        answer: 0, skill: "Radians", hints: ["Short arc, big circle: small angle."], why: "$\\theta = \\frac{4}{6} = \\frac{2}{3}$." },
      { type: "num", kicker: "Use it", prompt: "A pizza slice has a crust (arc) 12 cm long and a radius of 8 cm. What angle does the slice make, in radians?", pre: "$\\theta =$", post: "radians", answer: 1.5, skill: "Radians",
        near: [{ v: 0.67, tol: 0.01, fb: "That is $\\frac{8}{12}$: upside down." }], hints: ["$\\theta = \\frac{s}{r}$."], why: "$\\frac{12}{8} = 1.5$ radians." }
    ]
  });

  /* ============================================ 3 · Converting between degrees and radians */
  var HOW_3 = [["Know the link", "$180^\\circ = \\pi$ radians."],
               ["Factor", "Degrees to radians: multiply by $\\dfrac{\\pi}{180}$. Radians to degrees: multiply by $\\dfrac{180}{\\pi}$."],
               ["Simplify", "Cancel, and reduce the fraction."]];
  var SP3 = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
  LESSONS.push({
    title: "Converting between degrees and radians", art: "pcang",
    blurb: "Book 5.1 · One fact, $180^\\circ = \\pi$ radians, converts everything.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Simplify $\\dfrac{150}{180}$. (A fraction like 5/6 is fine.)", answer: 0.8333, tol: 0.001, shown: "5/6", skill: "Fractions",
        near: [{ v: 1.2, tol: 0.001, fb: "That is $\\frac{180}{150}$, upside down." }], hints: ["Divide top and bottom by 30."], why: "$\\frac{150}{180} = \\frac{5}{6}$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the point round the circle. The readout gives the angle in **degrees** and in **radians**. Visit **six** different special angles (multiples of 30° or 45°).",
        scene: { type: "sketch", x: [-1.5, 1.5], y: [-1.5, 1.5], u: 100, w: 340, gate: true,
          pts: { P: { at: [0.7071, 0.7071], drag: true, c: "orange", say: "The angle", on: { circle: [[0, 0], 1], snapDeg: 15 } } },
          track: function (s) { var d = angDeg(s.P); return d % 30 === 0 || d % 45 === 0 ? "a" + d : null; },
          draw: function (s) { var d = angDeg(s.P); return [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [1, 0]], c: "blue" }, { seg: [[0, 0], s.P], c: "orange" }].concat(d > 0 ? [{ turn: [[0, 0], 0.3, 0, d], c: "green" }] : []); },
          readout: function (s) { var d = angDeg(s.P); return "$" + d + "^\\circ = " + (d === 0 ? "0" : radTex(d)) + "$ radians<br>Special angles visited: " + Math.min(Object.keys(s.tracked).length, 6) + " of 6"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 6; } },
        gate: true, then: "$180^\\circ = \\pi$, so $90^\\circ = \\frac{\\pi}{2}$, $60^\\circ = \\frac{\\pi}{3}$, $45^\\circ = \\frac{\\pi}{4}$ and $30^\\circ = \\frac{\\pi}{6}$. Every other special angle is a **multiple** of these." },
      { type: "learn", kicker: "The idea",
        prompt: "Since $180^\\circ = \\pi$ radians, to go from **degrees to radians** multiply by $\\dfrac{\\pi}{180}$; to go from **radians to degrees** multiply by $\\dfrac{180}{\\pi}$. Keep $\\pi$ in the answer unless a decimal is asked for.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Convert $150^\\circ$ to radians.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "180^\\circ = \\pi \\text{ rad}", say: "The link between the two units." },
          { step: 2, m: "150 \\cdot \\frac{\\pi}{180}", say: "Degrees to radians: multiply by $\\frac{\\pi}{180}$.", ask: { prompt: "Which factor takes degrees to radians?", answer: 0, options: [{ t: "$\\frac{\\pi}{180}$" }, { t: "$\\frac{180}{\\pi}$", fb: "That goes the other way: radians to degrees." }] } },
          { step: 3, m: "\\frac{150\\pi}{180} = \\frac{5\\pi}{6}", say: "Divide top and bottom by 30." }] },
        gate: true, then: "$150^\\circ = \\dfrac{5\\pi}{6}$ radians." },
      { type: "guided", kicker: "Together",
        prompt: "Now you convert $\\dfrac{5\\pi}{4}$ radians to degrees.",
        how: HOW_3, skill: "Degrees and radians",
        steps: [
          { step: 1, ask: "Which equals $\\pi$ radians?", type: "choice", answer: 0, options: [{ t: "$180^\\circ$" }, { t: "$360^\\circ$", fb: "$2\\pi$ radians is $360^\\circ$." }], m: "\\pi = 180^\\circ", say: "The link." },
          { step: 2, ask: "Replace $\\pi$ by $180^\\circ$ in $\\dfrac{5\\pi}{4}$: $\\dfrac{5 \\cdot 180}{4} =$", type: "num", pre: "degrees =", answer: 225, near: [{ v: 900, fb: "Divide by 4 as well: $900 \\div 4$." }], hint: "$900 \\div 4$.", m: "\\frac{5 \\cdot 180^\\circ}{4}", say: "Swap $\\pi$ for $180^\\circ$." },
          { step: 3, ask: "Which quadrant is $225^\\circ$ in?", type: "choice", answer: 0, options: [{ t: "III" }, { t: "II", fb: "225 is past 180." }], m: "225^\\circ", say: "Check: $\\frac{5\\pi}{4}$ is just past $\\pi$." }],
        why: "Link, factor, simplify." },
      { type: "num", kicker: "On your own", prompt: "Convert $60^\\circ$ to radians. (Type pi/3, or a decimal like 1.0472.)", pre: "radians =", answer: 1.0472, tol: 0.0006, calc: true, shown: "pi/3", skill: "Degrees and radians",
        near: [{ v: 60, fb: "That is the degrees. Multiply by $\\frac{\\pi}{180}$." }, { v: 3437.7, tol: 0.1, fb: "That is $60 \\cdot \\frac{180}{\\pi}$: the wrong way round." }], hints: ["$\\frac{60\\pi}{180}$."], why: "$\\frac{60\\pi}{180} = \\frac{\\pi}{3} \\approx 1.0472$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A radian measure without $\\pi$.** Convert 2 radians to degrees.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "\\pi \\text{ rad} = 180^\\circ", say: "The same link." },
          { step: 2, m: "2 \\cdot \\frac{180}{\\pi}", say: "Radians to degrees: multiply by $\\frac{180}{\\pi}$.", ask: { prompt: "Does the answer keep a $\\pi$?", answer: 0, options: [{ t: "No: the $\\pi$ is on the bottom, so it is a decimal" }, { t: "Yes", fb: "2 has no $\\pi$ to cancel with, so $\\frac{360}{\\pi}$ is a decimal." }] } },
          { step: 3, m: "\\frac{360}{\\pi} \\approx 114.6^\\circ", say: "Use a calculator (type 360/pi)." }] },
        gate: true, then: "$2$ radians $\\approx 114.6^\\circ$: a bit more than a quarter turn." },
      { type: "choice", kicker: "Try it", prompt: "$\\dfrac{7\\pi}{6}$ radians is how many degrees?",
        options: [{ t: "$210^\\circ$" }, { t: "$150^\\circ$", fb: "$\\frac{5\\pi}{6}$ is $150^\\circ$. Here: $\\frac{7 \\cdot 180}{6}$." }, { t: "$420^\\circ$", fb: "$\\frac{7 \\cdot 180}{6} = 210$: remember to divide by 6." }],
        answer: 0, skill: "Degrees and radians", hints: ["$7 \\cdot 30$."], why: "$7 \\cdot 30 = 210$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Jo converts $90^\\circ$ to radians as $90 \\cdot \\frac{180}{\\pi} = \\frac{16200}{\\pi}$. What is wrong?",
        options: [{ t: "Degrees to radians multiplies by $\\frac{\\pi}{180}$: the answer is $\\frac{\\pi}{2}$." }, { t: "Nothing is wrong.", fb: "$\\frac{16200}{\\pi} \\approx 5157$ radians is far more than a full turn." }, { t: "It should be $90\\pi$.", fb: "That leaves out the division by 180." }],
        answer: 0, skill: "Degrees and radians", hints: ["Is 5157 radians a sensible size for a quarter turn?"], why: "$\\frac{90\\pi}{180} = \\frac{\\pi}{2}$." },
      { type: "num", kicker: "Use it", prompt: "A wheel turns through $3\\pi$ radians. How many full turns is that? (A decimal is fine.)", pre: "turns =", answer: 1.5, skill: "Degrees and radians",
        near: [{ v: 3, fb: "A full turn is $2\\pi$, not $\\pi$." }], hints: ["$\\frac{3\\pi}{2\\pi}$."], why: "$\\frac{3\\pi}{2\\pi} = 1.5$ turns." }
    ]
  });

  /* ============================================ 4 · Coterminal angles */
  var HOW_4 = [["Same side", "Coterminal angles share a terminal side."],
               ["Turns", "Add or subtract a full turn ($360^\\circ$ or $2\\pi$) as many times as needed."],
               ["Check", "Stop when the angle is between $0$ and one full turn."]];
  LESSONS.push({
    title: "Coterminal angles", art: "pcang",
    blurb: "Book 5.1 · Different angles, same terminal side: they differ by whole turns.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $800 - 720$.", answer: 80, skill: "Subtraction",
        near: [{ v: 1520, fb: "Subtract: 800 take away 720." }], hints: ["720 is 2 times 360."], why: "$800 - 720 = 80$." },
      { type: "learn", kicker: "Explore",
        prompt: "The terminal side points at $50^\\circ$. Slide $k$, the number of **full turns** added to the angle: $\\theta = 50^\\circ + 360^\\circ k$. Find **three different** $k$ with the same terminal side.",
        scene: { type: "sketch", x: [-2.4, 2.4], y: [-2.4, 2.4], u: 70, w: 340, gate: true, pts: {},
          params: { k: { min: -3, max: 3, step: 1, v: 0, label: "$k$ (full turns)" } },
          track: function (s) { return "k" + s.p.k; },
          draw: function (s) { var a = 50 * Math.PI / 180; return [{ circle: [[0, 0], 2], c: "soft" }, { seg: [[0, 0], [2, 0]], c: "blue" }, { seg: [[0, 0], [2 * Math.cos(a), 2 * Math.sin(a)]], c: "orange" }, { turn: [[0, 0], 0.7, 0, 50], c: "green" }].concat(s.p.k === 0 ? [] : [{ text: (s.p.k > 0 ? "+" : "−") + Math.abs(s.p.k) + " full turn" + (Math.abs(s.p.k) === 1 ? "" : "s"), at: [0, -1.2], c: "soft" }]); },
          readout: function (s) { var k = s.p.k, th = 50 + 360 * k; return "$\\theta = 50^\\circ " + (k < 0 ? "- " + 360 * -k : "+ " + 360 * k) + "^\\circ = " + nm(th) + "^\\circ$ — the terminal side is still at $50^\\circ$<br>Different $k$ tried: " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "$50^\\circ$, $410^\\circ$ and $-310^\\circ$ all end in the same place. They are **coterminal**: they differ by a whole number of full turns." },
      { type: "learn", kicker: "The idea",
        prompt: "Two angles are **coterminal** when they have the same terminal side. Add or subtract $360^\\circ$ (or $2\\pi$ radians) to find one in the usual range, $0^\\circ \\le \\theta < 360^\\circ$ (or $0 \\le \\theta < 2\\pi$).",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the angle between $0^\\circ$ and $360^\\circ$ that is coterminal with $800^\\circ$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "800^\\circ - 360^\\circ = 440^\\circ", say: "Take away one full turn." },
          { step: 2, m: "440^\\circ - 360^\\circ = 80^\\circ", say: "Still more than 360°, so take away another.", ask: { prompt: "Is 440° already in the range 0° to 360°?", answer: 0, options: [{ t: "No: it is more than 360°" }, { t: "Yes", fb: "440 is bigger than 360: subtract again." }] } },
          { step: 3, m: "0^\\circ \\le 80^\\circ < 360^\\circ", say: "In range: stop. $80^\\circ$ is coterminal with $800^\\circ$." }] },
        gate: true, then: "$800^\\circ \\sim 80^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the angle coterminal with $-150^\\circ$ between $0^\\circ$ and $360^\\circ$.",
        how: HOW_4, skill: "Coterminal angles",
        steps: [
          { step: 1, ask: "A negative angle turns…", type: "choice", answer: 0, options: [{ t: "clockwise, so we should add turns" }, { t: "counterclockwise, so we should subtract turns", fb: "Negative angles turn clockwise. To get positive we **add** 360°." }], m: "-150^\\circ", say: "Add full turns." },
          { step: 2, ask: "$-150 + 360 =$", type: "num", pre: "$\\theta =$", answer: 210, near: [{ v: -510, fb: "Add 360, do not subtract it." }], hint: "$360 - 150$.", m: "-150^\\circ + 360^\\circ = 210^\\circ", say: "One full turn added." },
          { step: 3, ask: "Is 210° between 0° and 360°?", type: "choice", answer: 0, options: [{ t: "Yes: quadrant III" }, { t: "No", fb: "$0 \\le 210 < 360$." }], m: "0^\\circ \\le 210^\\circ < 360^\\circ", say: "In range." }],
        why: "Same side, add or subtract, check." },
      { type: "num", kicker: "On your own", prompt: "Find the angle between $0^\\circ$ and $360^\\circ$ that is coterminal with $1000^\\circ$.", pre: "$\\theta =$", post: "degrees", answer: 280, skill: "Coterminal angles",
        near: [{ v: 640, fb: "That is $1000 - 360$: still more than one turn. Subtract again." }, { v: 40, fb: "$1000 - 720 = 280$, not 40." }], hints: ["$1000 - 720$."], why: "$1000 - 2 \\cdot 360 = 280$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**In radians.** Find the angle between $0$ and $2\\pi$ that is coterminal with $\\dfrac{17\\pi}{4}$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "2\\pi = \\tfrac{8\\pi}{4}", say: "A full turn, written with the same denominator." },
          { step: 2, m: "\\frac{17\\pi}{4} - \\frac{8\\pi}{4} = \\frac{9\\pi}{4}", say: "Subtract one full turn.", ask: { prompt: "Is $\\frac{9\\pi}{4}$ less than $2\\pi$ ($= \\frac{8\\pi}{4}$)?", answer: 0, options: [{ t: "No: subtract another turn" }, { t: "Yes", fb: "$\\frac{9\\pi}{4}$ is bigger than $\\frac{8\\pi}{4}$." }] } },
          { step: 2, m: "\\frac{9\\pi}{4} - \\frac{8\\pi}{4} = \\frac{\\pi}{4}", say: "Again." },
          { step: 3, m: "0 \\le \\tfrac{\\pi}{4} < 2\\pi", say: "In range: $\\frac{\\pi}{4}$ (45°)." }] },
        gate: true, then: "$\\dfrac{17\\pi}{4}$ is two full turns plus $\\dfrac{\\pi}{4}$." },
      { type: "num", kicker: "Try it", prompt: "Find the angle between $0$ and $2\\pi$ coterminal with $-\\dfrac{7\\pi}{3}$. (Type 5pi/3, or a decimal.)", pre: "$\\theta \\approx$", answer: 5.236, tol: 0.0006, calc: true, shown: "5pi/3", skill: "Coterminal angles",
        near: [{ v: -2.356, tol: 0.001, fb: "That is $-\\frac{7\\pi}{3} + 2\\pi$: still negative. Add another $2\\pi$." }, { v: 1.0472, tol: 0.001, fb: "That is $\\frac{\\pi}{3}$, which is coterminal with $+\\frac{7\\pi}{3}$, not with $-\\frac{7\\pi}{3}$." }], hints: ["Add $2\\pi = \\frac{6\\pi}{3}$ twice."], why: "$-\\frac{7\\pi}{3} + \\frac{12\\pi}{3} = \\frac{5\\pi}{3}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee says $-30^\\circ$ and $30^\\circ$ are coterminal because they are \"the same size\". What is wrong?",
        options: [{ t: "They differ by $60^\\circ$, not a whole number of turns: $-30^\\circ$ is coterminal with $330^\\circ$." }, { t: "Nothing is wrong.", fb: "$30^\\circ$ is above the $x$-axis and $-30^\\circ$ is below it." }, { t: "They differ by $180^\\circ$.", fb: "$30 - (-30) = 60$." }],
        answer: 0, skill: "Coterminal angles", hints: ["Coterminal angles differ by multiples of 360°."], why: "$-30 + 360 = 330$." },
      { type: "num", kicker: "Use it", prompt: "A Ferris wheel car is at $20^\\circ$ at the start of a ride and the wheel turns $+800^\\circ$ in all. At what angle (between $0^\\circ$ and $360^\\circ$) is it at the end?", pre: "$\\theta =$", post: "degrees", answer: 100, skill: "Coterminal angles",
        near: [{ v: 820, fb: "That is the total angle. Subtract full turns to get into the range." }, { v: 80, fb: "That is the turn alone. The car also started at $20^\\circ$." }], hints: ["$20 + 800 = 820$, then subtract 720."], why: "$820 - 720 = 100$." }
    ]
  });
  /* ============================================ 5 · Arc length and the area of a sector */
  var HOW_5 = [["Radians", "Convert the angle to radians first."],
               ["Arc length", "$s = r\\theta$."],
               ["Area", "$A = \\tfrac{1}{2}r^2\\theta$."]];
  var SEC5 = function (r, th, c) { var pts = [[0, 0]], N = 40, i; for (i = 0; i <= N; i++) pts.push([r * Math.cos(th * i / N), r * Math.sin(th * i / N)]); return { path: pts, closed: true, fill: true, c: c || "blue" }; };
  var G5 = grid("A sector of radius 10 and angle 60 degrees, which is pi over 3 radians.", [SEC5(10, Math.PI / 3, "blue"), { seg: [[0, 0], [10, 0]], c: "blue" }, { seg: [[0, 0], [10 * Math.cos(Math.PI / 3), 10 * Math.sin(Math.PI / 3)]], c: "orange" }, { text: "r = 10", at: [5, -1.4], c: "ink" }, { text: "60°", at: [2.6, 1.4], c: "ink" }], { x: [-1, 12], y: [-3, 10], u: 22 });
  LESSONS.push({
    title: "Arc length and the area of a sector", art: "pcang",
    blurb: "Book 5.1 · A slice of a circle: how long is its edge, and how big is it?",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The area of a full circle of radius 4 is $\\pi r^2 = 16\\pi$. What is the area of **half** the circle, in terms of $\\pi$? (Type the number in front of $\\pi$.)", pre: "$\\pi \\cdot$", answer: 8, skill: "Area of a circle",
        near: [{ v: 32, fb: "Half of 16, not double." }], hints: ["Half of $16\\pi$."], why: "$\\frac{16\\pi}{2} = 8\\pi$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the radius $r$ and the angle ($k$ lots of $\\frac{\\pi}{6}$). The arc length is $s = r\\theta$. Find **two different** sectors whose arc length is exactly $4\\pi$.",
        scene: { type: "sketch", x: [-6.5, 6.5], y: [-6.5, 6.5], u: 24, w: 340, gate: true, pts: {},
          params: { r: { min: 1, max: 6, step: 1, v: 3, label: "$r$" }, k: { min: 1, max: 12, step: 1, v: 2, label: "$k$ (× π/6)" } },
          track: function (s) { return s.p.r * s.p.k === 24 ? "r" + s.p.r : null; },
          draw: function (s) { var r = s.p.r, th = s.p.k * Math.PI / 6; return [{ circle: [[0, 0], r], c: "soft" }, SEC5(r, th, "blue"), { seg: [[0, 0], [r, 0]], c: "blue" }, { seg: [[0, 0], [r * Math.cos(th), r * Math.sin(th)]], c: "orange" }].concat(curveT(function (t) { return [r * Math.cos(t), r * Math.sin(t)]; }, 0, th, "green", 60)); },
          readout: function (s) { var r = s.p.r, k = s.p.k, d = 30 * k, sd = 30 * r * k; return "$r = " + r + "$, $\\theta = " + radTex(d) + "$: arc length $s = r\\theta = " + radTex(sd) + " \\approx " + nm(f4(r * k * Math.PI / 6, 2)) + "$<br>Sectors with $s = 4\\pi$ found: " + Math.min(Object.keys(s.tracked).length, 2) + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "$r = 6$ with $\\frac{4\\pi}{6}$, $r = 4$ with $\\pi$, $r = 3$ with $\\frac{4\\pi}{3}$ … all have $r\\theta = 4\\pi$. The arc length is the **radius times the angle in radians**." },
      { type: "learn", kicker: "The idea",
        prompt: "For a circle of radius $r$ and a central angle $\\theta$ **in radians**: arc length $s = r\\theta$ and sector area $A = \\dfrac{1}{2}r^2\\theta$. If $\\theta$ is given in degrees, **convert first**: the formulas only work in radians.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "A sector has radius 10 and angle $60^\\circ$. Find its arc length and its area.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "60^\\circ = \\frac{\\pi}{3}", say: "Convert to radians first.", fig: G5 },
          { step: 2, m: "s = r\\theta = 10 \\cdot \\frac{\\pi}{3}", say: "Radius times the angle.", ask: { prompt: "What is $10 \\cdot \\frac{\\pi}{3}$?", answer: 0, options: [{ t: "$\\frac{10\\pi}{3} \\approx 10.47$" }, { t: "$600$", fb: "That used degrees. The formula needs radians." }] } },
          { step: 3, m: "A = \\tfrac{1}{2}(10)^2 \\cdot \\tfrac{\\pi}{3}", say: "Half the radius squared times the angle." },
          { step: 3, m: "A = \\frac{50\\pi}{3} \\approx 52.36", say: "Square units." }] },
        gate: true, then: "$s = \\dfrac{10\\pi}{3} \\approx 10.47$ and $A = \\dfrac{50\\pi}{3} \\approx 52.36$." },
      { type: "guided", kicker: "Together",
        prompt: "Now a sector with radius 6 and angle $150^\\circ$.",
        how: HOW_5, skill: "Arc length and sector area",
        steps: [
          { step: 1, ask: "$150^\\circ$ in radians is $\\dfrac{5\\pi}{6}$. Which is the arc length formula?", type: "choice", answer: 0, options: [{ t: "$s = r\\theta$" }, { t: "$s = \\frac{1}{2}r^2\\theta$", fb: "That is the **area** formula." }], m: "\\theta = \\tfrac{5\\pi}{6}", say: "Radians first." },
          { step: 2, ask: "$s = 6 \\cdot \\dfrac{5\\pi}{6}$. (Type 5*pi.)", type: "num", pre: "$s \\approx$", answer: 15.708, tol: 0.006, calc: true, near: [{ v: 900, fb: "That used degrees: $6 \\cdot 150$." }], hint: "The 6s cancel: $5\\pi$.", m: "s = 5\\pi \\approx 15.71", say: "The edge of the sector." },
          { step: 3, ask: "$A = \\tfrac{1}{2} \\cdot 6^2 \\cdot \\dfrac{5\\pi}{6}$. (Type 0.5*36*5*pi/6.)", type: "num", pre: "$A \\approx$", answer: 47.124, tol: 0.006, calc: true, near: [{ v: 15.708, tol: 0.006, fb: "That is the arc length. The area has $\\frac{1}{2}r^2$." }], hint: "$\\frac{1}{2} \\cdot 36 \\cdot \\frac{5\\pi}{6} = 15\\pi$.", m: "A = 15\\pi \\approx 47.12", say: "Square units." }],
        why: "Radians, arc, area." },
      { type: "num", kicker: "On your own", prompt: "Find the arc length of a sector with radius 8 and angle $\\dfrac{3\\pi}{4}$ radians. (Type 8*3*pi/4.)", pre: "$s \\approx$", answer: 18.85, tol: 0.006, calc: true, skill: "Arc length and sector area",
        near: [{ v: 6, fb: "That leaves out the $\\pi$: $s = 8 \\cdot \\frac{3\\pi}{4} = 6\\pi$." }, { v: 90, fb: "$\\frac{3\\pi}{4}$ is the angle in radians: do not turn it into 135 first." }], hints: ["$s = r\\theta$."], why: "$6\\pi \\approx 18.85$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Find the angle.** An arc of length $7\\pi$ lies on a circle of radius 12. What is the central angle in degrees?",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "s = r\\theta \\ \\Rightarrow \\ \\theta = \\frac{s}{r}", say: "Solve the arc-length formula for the angle." },
          { step: 2, m: "\\theta = \\frac{7\\pi}{12}", say: "Divide the arc length by the radius.", ask: { prompt: "What is $\\frac{7\\pi}{12}$ in degrees?", answer: 0, options: [{ t: "$105^\\circ$" }, { t: "$420^\\circ$", fb: "$\\frac{7 \\cdot 180}{12}$: divide by 12." }] } },
          { step: 3, m: "\\frac{7 \\cdot 180^\\circ}{12} = 105^\\circ", say: "Replace $\\pi$ by 180°." }] },
        gate: true, then: "$\\theta = \\dfrac{7\\pi}{12} = 105^\\circ$." },
      { type: "choice", kicker: "Try it", prompt: "Which finds the **area** of a sector of radius $r$ and angle $\\theta$ (radians)?",
        options: [{ t: "$A = \\frac{1}{2}r^2\\theta$" }, { t: "$A = r\\theta$", fb: "That is the arc **length**." }, { t: "$A = \\pi r^2\\theta$", fb: "$\\pi r^2$ is the full circle. A sector is the fraction $\\frac{\\theta}{2\\pi}$ of it, which gives $\\frac{1}{2}r^2\\theta$." }],
        answer: 0, skill: "Arc length and sector area", hints: ["$\\frac{\\theta}{2\\pi} \\cdot \\pi r^2$."], why: "$\\frac{\\theta}{2\\pi}\\pi r^2 = \\frac{1}{2}r^2\\theta$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee finds the arc length for $r = 5$ and $\\theta = 60^\\circ$ as $s = 5 \\cdot 60 = 300$. What is wrong?",
        options: [{ t: "The angle must be in radians: $60^\\circ = \\frac{\\pi}{3}$, so $s = \\frac{5\\pi}{3}$." }, { t: "Nothing is wrong.", fb: "An arc of 300 on a circle of radius 5 would wrap round the circle nearly 10 times." }, { t: "She should square the radius.", fb: "That is for the area." }],
        answer: 0, skill: "Arc length and sector area", hints: ["Is 300 a sensible arc on a circle of radius 5?"], why: "$s = \\frac{5\\pi}{3} \\approx 5.24$." },
      { type: "num", kicker: "Use it", prompt: "A windscreen wiper blade is 0.5 m long and sweeps through $120^\\circ$. How long is the arc its tip travels, in metres to 2 decimal places? (Type 0.5*2*pi/3.)", pre: "$s \\approx$", post: "m", answer: 1.05, tol: 0.006, calc: true, skill: "Arc length and sector area",
        near: [{ v: 60, fb: "That used degrees. Convert $120^\\circ$ to $\\frac{2\\pi}{3}$ radians first." }], hints: ["$s = 0.5 \\cdot \\frac{2\\pi}{3}$."], why: "$\\frac{\\pi}{3} \\approx 1.05$ m." }
    ]
  });

  /* ============================================ 6 · Angular and linear speed */
  var HOW_6 = [["Angular speed", "$\\omega = \\dfrac{\\theta}{t}$, with $\\theta$ in radians."],
               ["Linear speed", "$v = r\\omega$: the radius times the angular speed."],
               ["Units", "Give $v$ in length per time, and keep $\\omega$ in radians per time."]];
  LESSONS.push({
    title: "Angular and linear speed", art: "pcang",
    blurb: "Book 5.1 · Turning fast is not the same as travelling fast: it depends how far you are from the centre.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "One revolution is $2\\pi$ radians. How many radians are in **3 revolutions**? Write it as a decimal to 2 places. (Type 6*pi.)", pre: "radians =", answer: 18.85, tol: 0.006, calc: true, skill: "Radians",
        near: [{ v: 6.28, tol: 0.006, fb: "That is one revolution. Three revolutions: $3 \\cdot 2\\pi$." }], hints: ["$3 \\cdot 2\\pi = 6\\pi$."], why: "$6\\pi \\approx 18.85$." },
      { type: "learn", kicker: "Explore",
        prompt: "A point on the rim of a wheel of radius $r$ metres turns at $\\omega$ radians per second. Its speed along the rim is the orange arrow. Find **two different** combinations that give a speed of **6 metres per second**.",
        scene: { type: "sketch", x: [-5, 5], y: [-5, 5], u: 32, w: 340, gate: true, pts: {},
          params: { w: { min: 1, max: 6, step: 1, v: 1, label: "$\\omega$ (rad/s)" }, r: { min: 1, max: 4, step: 1, v: 1, label: "$r$ (m)" } },
          track: function (s) { return s.p.w * s.p.r === 6 ? "w" + s.p.w : null; },
          draw: function (s) { var r = s.p.r, v = s.p.w * s.p.r; return [{ circle: [[0, 0], r], c: "soft" }, { seg: [[0, 0], [r, 0]], c: "blue" }, dot(r, 0, "orange"), { dline: [[r, 0], [r, v * 0.7]], ray: true, c: "orange" }]; },
          readout: function (s) { var w = s.p.w, r = s.p.r, v = w * r; return "$\\omega = " + w + "$ rad/s, $r = " + r + "$ m: $v = r\\omega = " + v + "$ m/s" + (v === 6 ? " ✓" : "") + "<br>Combinations with $v = 6$: " + Math.min(Object.keys(s.tracked).length, 2) + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "$\\omega = 3$, $r = 2$ and $\\omega = 2$, $r = 3$ (and $\\omega = 6$, $r = 1$) all give $v = 6$. The **linear speed** is the radius times the **angular speed**: $v = r\\omega$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Angular speed** $\\omega = \\dfrac{\\theta}{t}$ is how fast the angle changes (radians per unit time). **Linear speed** $v = \\dfrac{s}{t} = r\\omega$ is how fast a point on the rim travels. Two points on one wheel have the same $\\omega$, but the one farther out moves faster.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "A bicycle wheel of radius 0.35 m turns 2 revolutions every second. How fast is the rim moving?",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "\\theta = 2 \\cdot 2\\pi = 4\\pi \\text{ rad in } 1 \\text{ s}", say: "Two revolutions, each $2\\pi$ radians." },
          { step: 1, m: "\\omega = 4\\pi \\text{ rad/s}", say: "About 12.57 radians per second.", ask: { prompt: "Why is it $4\\pi$ and not 2?", answer: 0, options: [{ t: "Each revolution is $2\\pi$ radians" }, { t: "2 is already in radians", fb: "2 is revolutions per second. In radians each revolution is $2\\pi$." }] } },
          { step: 2, m: "v = r\\omega = 0.35 \\cdot 4\\pi", say: "Radius times angular speed." },
          { step: 3, m: "v \\approx 4.40 \\text{ m/s}", say: "About 15.8 km per hour." }] },
        gate: true, then: "$v = 1.4\\pi \\approx 4.40$ m/s." },
      { type: "guided", kicker: "Together",
        prompt: "A Ferris wheel of radius 20 m makes one rotation in 80 seconds. How fast does a car move?",
        how: HOW_6, skill: "Angular and linear speed",
        steps: [
          { step: 1, ask: "$\\omega = \\dfrac{2\\pi}{80}$. (Type 2*pi/80.)", type: "num", pre: "$\\omega \\approx$", post: "rad/s", answer: 0.0785, tol: 0.0006, calc: true, near: [{ v: 0.0125, tol: 0.0006, fb: "That is revolutions per second, $\\frac{1}{80}$. Use radians: $\\frac{2\\pi}{80}$." }], hint: "One rotation is $2\\pi$ radians.", m: "\\omega = \\tfrac{\\pi}{40}", say: "A very slow turn." },
          { step: 2, ask: "$v = r\\omega = 20 \\cdot \\dfrac{\\pi}{40}$. (Type 20*pi/40.)", type: "num", pre: "$v \\approx$", post: "m/s", answer: 1.5708, tol: 0.0006, calc: true, near: [{ v: 31.4, tol: 0.1, fb: "That is $20 \\cdot \\pi$: you forgot to divide by 40." }], hint: "$\\frac{20\\pi}{40} = \\frac{\\pi}{2}$.", m: "v = \\tfrac{\\pi}{2} \\approx 1.57", say: "About 1.6 metres per second." },
          { step: 3, ask: "The units of $v$ are…", type: "choice", answer: 0, options: [{ t: "metres per second" }, { t: "radians per second", fb: "Radians per second is the **angular** speed. The linear speed is a length per time." }], m: "\\text{m/s}", say: "Length per time." }],
        why: "Angular speed, linear speed, units." },
      { type: "num", kicker: "On your own", prompt: "A fan blade 0.5 m long spins at 3 revolutions per second. How fast does its tip move? (Type 0.5*3*2*pi.)", pre: "$v \\approx$", post: "m/s", answer: 9.42, tol: 0.006, calc: true, skill: "Angular and linear speed",
        near: [{ v: 1.5, fb: "That is $r$ times the revolutions. Convert to radians: each revolution is $2\\pi$." }], hints: ["$\\omega = 3 \\cdot 2\\pi = 6\\pi$."], why: "$0.5 \\cdot 6\\pi = 3\\pi \\approx 9.42$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Go backwards.** A bicycle with wheels of radius 0.35 m travels at 7 m/s. How fast are the wheels turning, in revolutions per second?",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "v = r\\omega \\ \\Rightarrow \\ \\omega = \\frac{v}{r}", say: "Solve $v = r\\omega$ for $\\omega$." },
          { step: 2, m: "\\omega = \\frac{7}{0.35} = 20 \\text{ rad/s}", say: "Radians per second.", ask: { prompt: "What is $7 \\div 0.35$?", answer: 0, options: [{ t: "$20$" }, { t: "$2.45$", fb: "Divide: how many 0.35s in 7?" }] } },
          { step: 3, m: "\\frac{20}{2\\pi} \\approx 3.18 \\text{ rev/s}", say: "Each revolution is $2\\pi$ radians." }] },
        gate: true, then: "About 3.18 revolutions per second." },
      { type: "num", kicker: "Try it", prompt: "A point on a wheel of radius 2.5 m has angular speed 4 radians per second. How fast does it move?", pre: "$v =$", post: "m/s", answer: 10, skill: "Angular and linear speed",
        near: [{ v: 0.625, tol: 0.001, fb: "Multiply by the radius: $v = r\\omega$." }, { v: 1.6, fb: "That divides. $v = r\\omega$." }], hints: ["$v = r\\omega$."], why: "$2.5 \\cdot 4 = 10$ m/s." },
      { type: "choice", kicker: "Find the error",
        prompt: "Two children sit on a roundabout, one near the edge and one near the centre. Max says the one near the edge has the greater **angular** speed. What is wrong?",
        options: [{ t: "They turn through the same angle in the same time, so $\\omega$ is equal. The one at the edge has the greater **linear** speed." }, { t: "Nothing is wrong.", fb: "Both go once round in the same time: same $\\omega$." }, { t: "The one near the centre is faster.", fb: "Farther from the centre means a longer circle in the same time." }],
        answer: 0, skill: "Angular and linear speed", hints: ["Same time per turn means same angular speed."], why: "$\\omega$ is shared; $v = r\\omega$ grows with $r$." },
      { type: "num", kicker: "Use it", prompt: "The Earth turns once in 24 hours. The radius at the equator is 6371 km. How fast does a person at the equator move because of the rotation, in km per hour? (Type 6371*2*pi/24.)", pre: "$v \\approx$", post: "km/h", answer: 1668, tol: 1, calc: true, skill: "Angular and linear speed",
        near: [{ v: 265.5, tol: 1, fb: "That is $\\frac{6371}{24}$. Include the $2\\pi$ radians in one turn." }], hints: ["$\\omega = \\frac{2\\pi}{24}$ radians per hour."], why: "$6371 \\cdot \\frac{\\pi}{12} \\approx 1668$ km/h." }
    ]
  });

  /* ============================================ 7 · The unit circle: cosine and sine */
  var HOW_7 = [["Find P", "Find where the terminal side of the angle meets the unit circle."],
               ["Read x and y", "$\\cos\\theta = x$ and $\\sin\\theta = y$."],
               ["Check", "$x^2 + y^2 = 1$, and the signs match the quadrant."]];
  var UC7 = function (deg, alt, extra) {
    var a = deg * Math.PI / 180, x = Math.cos(a), y = Math.sin(a), it = [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [x, 0]], c: "blue" }, { seg: [[x, 0], [x, y]], c: "orange" }, { seg: [[0, 0], [x, y]], c: "ink" }, dot(x, y, "orange")];
    return grid(alt, it.concat(extra || []), { x: [-1.5, 1.5], y: [-1.5, 1.5], u: 80, step: 1 });
  };
  var G7 = grid("The point (-0.6, 0.8) on the unit circle in quadrant II.", [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [-0.6, 0]], c: "blue" }, { seg: [[-0.6, 0], [-0.6, 0.8]], c: "orange" }, { seg: [[0, 0], [-0.6, 0.8]], c: "ink" }, dot(-0.6, 0.8, "orange", "(−0.6, 0.8)", "nw")], { x: [-1.5, 1.5], y: [-1.5, 1.5], u: 80, step: 1 });
  LESSONS.push({
    title: "The unit circle: cosine and sine", art: "pcang",
    blurb: "Book 5.2 · Walk round a circle of radius 1: the point's coordinates are cosine and sine.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A point is at $(0.6, 0.8)$. Find $0.6^2 + 0.8^2$.", answer: 1, skill: "Squares",
        near: [{ v: 1.4, tol: 0.001, fb: "Square each number first: $0.36 + 0.64$." }], hints: ["$0.36 + 0.64$."], why: "$0.36 + 0.64 = 1$: the point is on a circle of radius 1." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the point round the **unit circle** (radius 1). Its **$x$-coordinate** (blue) is the cosine of the angle and its **$y$-coordinate** (orange) is the sine. Find **both** angles between $0^\\circ$ and $360^\\circ$ where the sine is **exactly 0.5**.",
        scene: { type: "sketch", x: [-1.5, 1.5], y: [-1.5, 1.5], u: 100, w: 340, gate: true,
          pts: { P: { at: [0.866, 0.5], drag: true, c: "orange", say: "The point on the unit circle", on: { circle: [[0, 0], 1], snapDeg: 15 } } },
          track: function (s) { var d = angDeg(s.P); return d === 30 || d === 150 ? "d" + d : null; },
          draw: function (s) { return [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [s.P[0], 0]], c: "blue" }, { seg: [[s.P[0], 0], s.P], c: "orange" }, { seg: [[0, 0], s.P], c: "ink" }]; },
          readout: function (s) { var d = angDeg(s.P), c = Math.cos(d * Math.PI / 180), n = Math.sin(d * Math.PI / 180); return "$\\theta = " + d + "^\\circ$: $\\cos\\theta = " + nm(f4(c, 3)) + "$, $\\sin\\theta = " + nm(f4(n, 3)) + "$<br>$\\sin\\theta = 0.5$ found at: " + (s.tracked.d30 ? "30° ✓ " : "") + (s.tracked.d150 ? "150° ✓" : "") + (!s.tracked.d30 && !s.tracked.d150 ? "—" : ""); },
          goal: function (s) { return !!(s.tracked.d30 && s.tracked.d150); } },
        gate: true, then: "$\\sin 30^\\circ = \\sin 150^\\circ = 0.5$: the point is at the same **height** on both sides. On the unit circle, $\\cos\\theta$ is the point's $x$ and $\\sin\\theta$ is its $y$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **unit circle** has radius 1 and centre at the origin. For an angle $\\theta$ in standard position, the terminal side meets the circle at $P = (x, y)$. Then $\\cos\\theta = x$ and $\\sin\\theta = y$. Because $P$ is on the circle, $x^2 + y^2 = 1$.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "The point $P(-0.6, 0.8)$ is on the unit circle at angle $\\theta$. Find $\\cos\\theta$ and $\\sin\\theta$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "P = (-0.6,\\ 0.8)", say: "Given.", fig: G7 },
          { step: 2, m: "\\cos\\theta = x = -0.6", say: "Cosine is the $x$-coordinate.", ask: { prompt: "Which coordinate is the sine?", answer: 0, options: [{ t: "The $y$-coordinate, 0.8" }, { t: "The $x$-coordinate, $-0.6$", fb: "Cosine is $x$. Sine is $y$." }] } },
          { step: 2, m: "\\sin\\theta = y = 0.8", say: "Sine is the $y$-coordinate." },
          { step: 3, m: "0.36 + 0.64 = 1", say: "The check: $(-0.6)^2 + 0.8^2 = 1$, so $x^2 + y^2 = 1$." },
          { step: 3, m: "x < 0, \\ y > 0", say: "Negative $x$ and positive $y$: quadrant II." }] },
        gate: true, then: "$\\cos\\theta = -0.6$ and $\\sin\\theta = 0.8$." },
      { type: "guided", kicker: "Together",
        prompt: "Now the point $P\\left(\\dfrac{5}{13}, -\\dfrac{12}{13}\\right)$ is on the unit circle.",
        how: HOW_7, skill: "Unit circle",
        steps: [
          { step: 1, ask: "Which quadrant is $P$ in? ($x$ positive, $y$ negative)", type: "choice", answer: 0, options: [{ t: "IV" }, { t: "II", fb: "In quadrant II, $x$ is negative and $y$ positive." }, { t: "I", fb: "In quadrant I both are positive." }], m: "x > 0,\\ y < 0", say: "Quadrant IV." },
          { step: 2, ask: "$\\cos\\theta = x$. (Type 5/13.)", type: "num", pre: "$\\cos\\theta \\approx$", answer: 0.3846, tol: 0.0006, near: [{ v: -0.9231, tol: 0.0006, fb: "That is $y$, the sine." }], hint: "The $x$-coordinate.", m: "\\cos\\theta = \\tfrac{5}{13}", say: "The $x$-coordinate." },
          { step: 2, ask: "$\\sin\\theta = y$. (Type -12/13.)", type: "num", pre: "$\\sin\\theta \\approx$", answer: -0.9231, tol: 0.0006, near: [{ v: 0.9231, tol: 0.0006, fb: "The point is below the axis: negative." }], hint: "The $y$-coordinate.", m: "\\sin\\theta = -\\tfrac{12}{13}", say: "Negative in quadrant IV." },
          { step: 3, ask: "Check: $\\left(\\frac{5}{13}\\right)^2 + \\left(\\frac{12}{13}\\right)^2 = \\frac{25 + 144}{169} =$", type: "num", pre: "$=$", answer: 1, near: [{ v: 169, fb: "That is the numerator. Divide by 169." }], hint: "$\\frac{169}{169}$.", m: "x^2 + y^2 = 1", say: "On the circle." }],
        why: "Find P, read x and y, check." },
      { type: "choice", kicker: "On your own", prompt: "What is $\\cos 180^\\circ$?",
        options: [{ t: "$-1$" }, { t: "$0$", fb: "At $180^\\circ$ the point is $(-1, 0)$: $x = -1$, $y = 0$. Cosine is $x$." }, { t: "$1$", fb: "$(1, 0)$ is at $0^\\circ$." }],
        answer: 0, skill: "Unit circle", hints: ["Where is the point at $180^\\circ$?"], why: "The point is $(-1, 0)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**One coordinate missing.** A point on the unit circle has $x = 0.6$ and is in quadrant IV. Find $\\sin\\theta$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "x^2 + y^2 = 1", say: "The point is on the unit circle." },
          { step: 2, m: "y^2 = 1 - 0.36 = 0.64", say: "Put in $x = 0.6$.", ask: { prompt: "So $y$ is…", answer: 0, options: [{ t: "$0.8$ or $-0.8$" }, { t: "$0.64$", fb: "That is $y^2$. Take the square root, with both signs." }] } },
          { step: 3, m: "y = -0.8", say: "Quadrant IV has $y < 0$: choose the negative root." },
          { step: 3, m: "\\sin\\theta = -0.8", say: "Sine is $y$." }] },
        gate: true, then: "$\\sin\\theta = -0.8$." },
      { type: "num", kicker: "Try it", prompt: "A point on the unit circle is $(0, -1)$. What is $\\sin\\theta$ there?", pre: "$\\sin\\theta =$", answer: -1, skill: "Unit circle",
        near: [{ v: 0, fb: "That is the cosine: the $x$-coordinate. Sine is $y$." }, { v: 1, fb: "$y = -1$: negative." }], hints: ["Sine is the $y$-coordinate."], why: "$\\sin\\theta = y = -1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Tia says the point at $60^\\circ$ on the unit circle is $(\\sin 60^\\circ, \\cos 60^\\circ)$. What is wrong?",
        options: [{ t: "The point is $(\\cos 60^\\circ, \\sin 60^\\circ)$: cosine is $x$ and goes first." }, { t: "Nothing is wrong.", fb: "Cosine is the $x$-coordinate; it goes first." }, { t: "The point is $(1, 60)$.", fb: "On the unit circle both coordinates are between $-1$ and 1." }],
        answer: 0, skill: "Unit circle", hints: ["$(x, y) = (\\cos\\theta, \\sin\\theta)$."], why: "$P = (\\cos\\theta, \\sin\\theta)$." },
      { type: "choice", kicker: "Use it", prompt: "A point moves round a circle of radius 1 and at some moment is at $(0.28, 0.96)$. What is its height above the centre?",
        options: [{ t: "$0.96$" }, { t: "$0.28$", fb: "That is the horizontal distance, $x$." }, { t: "$1$", fb: "1 is the radius. The height is the $y$-coordinate." }],
        answer: 0, skill: "Unit circle", hints: ["Height is $y$, which is $\\sin\\theta$."], why: "$\\sin\\theta = 0.96$." }
    ]
  });

  /* ============================================ 8 · Quadrantal angles and the Pythagorean identity */
  var HOW_8 = [["Put it in", "Substitute the known value into $\\cos^2\\theta + \\sin^2\\theta = 1$."],
               ["Solve", "Solve for the other value: there are two roots, $\\pm$."],
               ["Sign", "Pick the sign that matches the quadrant."]];
  var QA8 = [[0, 1, 0], [90, 0, 1], [180, -1, 0], [270, 0, -1]];
  LESSONS.push({
    title: "Quadrantal angles and the Pythagorean identity", art: "pcang",
    blurb: "Book 5.2 · The four axis angles, and finding one coordinate from the other.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $x^2 = 0.64$ for the **positive** value of $x$.", pre: "$x =$", answer: 0.8, skill: "Square roots",
        near: [{ v: 0.32, fb: "That halves it. Take the square root." }, { v: 0.4096, tol: 0.001, fb: "That squares it again." }], hints: ["$0.8 \\cdot 0.8$."], why: "$x = 0.8$ (or $-0.8$)." },
      { type: "learn", kicker: "Explore",
        prompt: "The four **quadrantal** angles sit on the axes. Pick each one and read the point $(\\cos\\theta, \\sin\\theta)$. Try **all four**.",
        scene: { type: "sketch", x: [-1.5, 1.5], y: [-1.5, 1.5], u: 100, w: 340, gate: true, pts: {},
          chips: { a: { label: "Angle", v: "0", opts: [["0", "0°"], ["90", "90°"], ["180", "180°"], ["270", "270°"]] } },
          draw: function (s) { var d = +s.c.a, x = Math.cos(d * Math.PI / 180), y = Math.sin(d * Math.PI / 180); x = Math.round(x); y = Math.round(y); return [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [x, y]], c: "orange" }, dot(x, y, "orange")].concat(d > 0 ? [{ turn: [[0, 0], 0.3, 0, d], c: "green" }] : []); },
          readout: function (s) { var d = +s.c.a, x = Math.round(Math.cos(d * Math.PI / 180)), y = Math.round(Math.sin(d * Math.PI / 180)); return "$" + d + "^\\circ$: the point is $(" + nm(x) + ",\\ " + nm(y) + ")$, so $\\cos = " + nm(x) + "$ and $\\sin = " + nm(y) + "$<br>Looked at " + Math.min(Object.keys(s.seen.a).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.seen.a).length >= 4; } },
        gate: true, then: "On an axis one of $x$ and $y$ is 0 and the other is $\\pm 1$: $\\cos 0^\\circ = 1$, $\\sin 90^\\circ = 1$, $\\cos 180^\\circ = -1$, $\\sin 270^\\circ = -1$. The others are 0." },
      { type: "learn", kicker: "The idea",
        prompt: "Every point on the unit circle satisfies $x^2 + y^2 = 1$, so $\\cos^2\\theta + \\sin^2\\theta = 1$: the **Pythagorean identity**. Given $\\sin\\theta$ (or $\\cos\\theta$) and the **quadrant**, you can find the other: solve, then choose $+$ or $-$ by the quadrant.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "$\\sin\\theta = \\dfrac{3}{5}$ and $\\theta$ is in quadrant II. Find $\\cos\\theta$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\cos^2\\theta + \\left(\\tfrac{3}{5}\\right)^2 = 1", say: "Put the known value into the identity." },
          { step: 2, m: "\\cos^2\\theta = 1 - \\tfrac{9}{25} = \\tfrac{16}{25}", say: "Solve for $\\cos^2\\theta$.", ask: { prompt: "What is $1 - \\frac{9}{25}$?", answer: 0, options: [{ t: "$\\frac{16}{25}$" }, { t: "$\\frac{8}{25}$", fb: "$1 = \\frac{25}{25}$, so $\\frac{25 - 9}{25}$." }] } },
          { step: 2, m: "\\cos\\theta = \\pm\\tfrac{4}{5}", say: "Two roots." },
          { step: 3, m: "\\cos\\theta = -\\tfrac{4}{5}", say: "In quadrant II the $x$-coordinate is negative: choose the negative root." }] },
        gate: true, then: "$\\cos\\theta = -\\dfrac{4}{5}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now $\\cos\\theta = \\dfrac{5}{13}$ and $\\theta$ is in quadrant IV. Find $\\sin\\theta$.",
        how: HOW_8, skill: "Pythagorean identity",
        steps: [
          { step: 1, ask: "$\\sin^2\\theta = 1 - \\left(\\dfrac{5}{13}\\right)^2 = 1 - \\dfrac{25}{169} =$", type: "num", pre: "$\\sin^2\\theta \\approx$", answer: 0.8521, tol: 0.0006, near: [{ v: 0.1479, tol: 0.0006, fb: "That is $\\frac{25}{169}$. Subtract it from 1." }], hint: "$\\frac{144}{169}$.", m: "\\sin^2\\theta = \\tfrac{144}{169}", say: "Type 144/169 if you like." },
          { step: 2, ask: "$\\sin\\theta = \\pm\\sqrt{\\dfrac{144}{169}} = \\pm$ (give the positive value)", type: "num", pre: "$\\approx$", answer: 0.9231, tol: 0.0006, near: [{ v: 0.8521, tol: 0.0006, fb: "That is $\\sin^2\\theta$. Take the square root." }], hint: "$\\frac{12}{13}$.", m: "\\sin\\theta = \\pm\\tfrac{12}{13}", say: "Two roots." },
          { step: 3, ask: "In quadrant IV the $y$-coordinate is…", type: "choice", answer: 0, options: [{ t: "negative, so $\\sin\\theta = -\\frac{12}{13}$" }, { t: "positive, so $\\sin\\theta = \\frac{12}{13}$", fb: "Quadrant IV is below the $x$-axis." }], m: "\\sin\\theta = -\\tfrac{12}{13}", say: "The sign comes from the quadrant." }],
        why: "Put in, solve, choose the sign." },
      { type: "choice", kicker: "On your own", prompt: "Which pair is $(\\cos 270^\\circ, \\sin 270^\\circ)$?",
        options: [{ t: "$(0, -1)$" }, { t: "$(-1, 0)$", fb: "That is the point at $180^\\circ$." }, { t: "$(0, 1)$", fb: "That is the point at $90^\\circ$." }],
        answer: 0, skill: "Quadrantal angles", hints: ["Three quarters of the way round."], why: "The point is at the bottom: $(0, -1)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A negative sine, an unknown quadrant.** $\\cos\\theta = -\\dfrac{3}{5}$ and $\\sin\\theta < 0$. Find $\\sin\\theta$ and the quadrant.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\sin^2\\theta = 1 - \\left(-\\tfrac{3}{5}\\right)^2", say: "Squaring removes the sign of the cosine." },
          { step: 2, m: "\\sin^2\\theta = \\tfrac{16}{25}, \\ \\ \\sin\\theta = \\pm\\tfrac{4}{5}", say: "Two roots.", ask: { prompt: "We are told $\\sin\\theta < 0$. Which root?", answer: 0, options: [{ t: "$-\\frac{4}{5}$" }, { t: "$\\frac{4}{5}$", fb: "The problem says the sine is negative." }] } },
          { step: 3, m: "\\sin\\theta = -\\tfrac{4}{5}", say: "Negative sine." },
          { step: 3, m: "x < 0, \\ y < 0 \\ \\Rightarrow \\ \\text{quadrant III}", say: "Both coordinates are negative." }] },
        gate: true, then: "$\\sin\\theta = -\\dfrac{4}{5}$, in quadrant III." },
      { type: "num", kicker: "Try it", prompt: "$\\sin\\theta = 0.6$ and $\\theta$ is in quadrant I. Find $\\cos\\theta$.", pre: "$\\cos\\theta =$", answer: 0.8, skill: "Pythagorean identity",
        near: [{ v: -0.8, fb: "Quadrant I has positive $x$." }, { v: 0.4, fb: "That is $1 - 0.6$. Use the squares: $1 - 0.36$." }], hints: ["$\\cos^2\\theta = 1 - 0.36 = 0.64$."], why: "$\\cos\\theta = 0.8$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Eve finds $\\cos\\theta$ from $\\sin\\theta = \\frac{3}{5}$ as $1 - \\frac{3}{5} = \\frac{2}{5}$. What is wrong?",
        options: [{ t: "She forgot to square: $\\cos^2\\theta = 1 - \\frac{9}{25}$, so $\\cos\\theta = \\pm\\frac{4}{5}$." }, { t: "Nothing is wrong.", fb: "Check: $\\left(\\frac{2}{5}\\right)^2 + \\left(\\frac{3}{5}\\right)^2 = \\frac{13}{25}$, not 1." }, { t: "She should add: $1 + \\frac{3}{5}$.", fb: "The identity subtracts the square: $1 - \\sin^2\\theta$." }],
        answer: 0, skill: "Pythagorean identity", hints: ["The identity is $\\cos^2\\theta + \\sin^2\\theta = 1$."], why: "$\\cos^2\\theta = \\frac{16}{25}$." },
      { type: "choice", kicker: "Use it", prompt: "A point on a circle of radius 1 is at height $-\\dfrac{1}{2}$ and to the right of the centre. How far to the right is it?",
        options: [{ t: "$\\dfrac{\\sqrt{3}}{2}$" }, { t: "$\\dfrac{1}{2}$", fb: "That is the height again. Use $x^2 + y^2 = 1$: $x^2 = \\frac{3}{4}$." }, { t: "$-\\dfrac{\\sqrt{3}}{2}$", fb: "To the **right** means $x$ is positive." }],
        answer: 0, skill: "Pythagorean identity", hints: ["$x^2 = 1 - \\frac{1}{4}$."], why: "$x = +\\sqrt{\\frac{3}{4}} = \\frac{\\sqrt{3}}{2}$." }
    ]
  });
  /* ============================================ 9 · Special angles: 30°, 45° and 60° */
  var HOW_9 = [["Triangle", "A $30^\\circ$-$60^\\circ$-$90^\\circ$ or $45^\\circ$-$45^\\circ$-$90^\\circ$ triangle sits inside the unit circle."],
               ["Sides", "The hypotenuse is 1. Its legs are the cosine and sine."],
               ["Value", "Read $\\cos\\theta$ (the adjacent leg) and $\\sin\\theta$ (the opposite leg)."]];
  var QC = curveT(function (t) { return [Math.cos(t), Math.sin(t)]; }, 0, Math.PI / 2, "soft", 60);   // the quarter circle: a whole one would spill out of this window
  var SPV = { 30: ["\\frac{\\sqrt{3}}{2}", "\\frac{1}{2}", "0.866", "0.5"], 45: ["\\frac{\\sqrt{2}}{2}", "\\frac{\\sqrt{2}}{2}", "0.707", "0.707"], 60: ["\\frac{1}{2}", "\\frac{\\sqrt{3}}{2}", "0.5", "0.866"] };
  var TRI9 = function (deg, alt) {
    var a = deg * Math.PI / 180, x = Math.cos(a), y = Math.sin(a);
    return grid(alt, QC.concat([{ seg: [[0, 0], [x, 0]], c: "blue" }, { seg: [[x, 0], [x, y]], c: "orange" }, { seg: [[0, 0], [x, y]], c: "ink" }, dot(x, y, "orange"), { turn: [[0, 0], 0.3, 0, deg], c: "green" }]), { x: [-0.3, 1.3], y: [-0.3, 1.3], u: 120, step: 1 });
  };
  LESSONS.push({
    title: "Special angles: 30°, 45° and 60°", art: "pcang",
    blurb: "Book 5.2 · Three triangles give the exact sine and cosine of the angles you will meet most.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A square has sides of length 1. How long is its diagonal? (Type sqrt(2) or a decimal.)", pre: "diagonal $\\approx$", answer: 1.4142, tol: 0.0006, calc: true, shown: "sqrt(2)", skill: "Pythagorean theorem",
        near: [{ v: 2, fb: "$1^2 + 1^2 = 2$ is the **square** of the diagonal. Take the square root." }], hints: ["$d^2 = 1 + 1$."], why: "$d = \\sqrt{2} \\approx 1.4142$." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick $30^\\circ$, $45^\\circ$ or $60^\\circ$. The triangle inside the unit circle has hypotenuse 1, so its legs are the **cosine** (blue) and **sine** (orange). Look at **all three**.",
        scene: { type: "sketch", x: [-0.3, 1.3], y: [-0.3, 1.3], u: 200, w: 340, gate: true, pts: {},
          chips: { a: { label: "Angle", v: "30", opts: [["30", "30°"], ["45", "45°"], ["60", "60°"]] } },
          draw: function (s) { var d = +s.c.a, a = d * Math.PI / 180, x = Math.cos(a), y = Math.sin(a); return QC.concat([{ seg: [[0, 0], [x, 0]], c: "blue" }, { seg: [[x, 0], [x, y]], c: "orange" }, { seg: [[0, 0], [x, y]], c: "ink" }, dot(x, y, "orange"), { turn: [[0, 0], 0.22, 0, d], c: "green" }]); },
          readout: function (s) { var v = SPV[s.c.a]; return "$\\cos " + s.c.a + "^\\circ = " + v[0] + " \\approx " + v[2] + "$ &nbsp; $\\sin " + s.c.a + "^\\circ = " + v[1] + " \\approx " + v[3] + "$<br>Looked at " + Math.min(Object.keys(s.seen.a).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.seen.a).length >= 3; } },
        gate: true, then: "Notice the **pattern**: $30^\\circ$ and $60^\\circ$ swap the values $\\frac{\\sqrt{3}}{2}$ and $\\frac{1}{2}$, and $45^\\circ$ has two equal legs, $\\frac{\\sqrt{2}}{2}$." },
      { type: "learn", kicker: "The idea",
        prompt: "Two special triangles give exact values. **$45^\\circ$:** equal legs, so $x^2 + x^2 = 1$ and $\\cos 45^\\circ = \\sin 45^\\circ = \\frac{\\sqrt{2}}{2}$. **$30^\\circ$-$60^\\circ$:** half an equilateral triangle: the short leg is $\\frac{1}{2}$ and the long leg is $\\frac{\\sqrt{3}}{2}$. The **smaller** angle faces the **shorter** side.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\cos 60^\\circ$ and $\\sin 60^\\circ$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "\\text{half an equilateral triangle}", say: "An equilateral triangle with side 1, cut down the middle, makes two $30^\\circ$-$60^\\circ$-$90^\\circ$ triangles.", fig: TRI9(60, "The point at 60 degrees on the unit circle, with its right triangle: the base is 1/2 and the height is root 3 over 2.") },
          { step: 2, m: "\\text{short leg} = \\tfrac{1}{2}", say: "The base of the half-triangle is half of the side 1.", ask: { prompt: "The short leg is opposite the…", answer: 0, options: [{ t: "smaller angle, $30^\\circ$" }, { t: "larger angle, $60^\\circ$", fb: "The smaller angle faces the shorter side." }] } },
          { step: 2, m: "\\text{long leg}^2 = 1 - \\tfrac{1}{4} = \\tfrac{3}{4}", say: "Pythagoras with hypotenuse 1." },
          { step: 3, m: "\\cos 60^\\circ = \\tfrac{1}{2}, \\ \\ \\sin 60^\\circ = \\tfrac{\\sqrt{3}}{2}", say: "The $60^\\circ$ angle is at the vertex of the base: its adjacent leg is the short one." }] },
        gate: true, then: "$\\cos 60^\\circ = \\dfrac{1}{2}$ and $\\sin 60^\\circ = \\dfrac{\\sqrt{3}}{2} \\approx 0.866$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\cos 45^\\circ$ and $\\sin 45^\\circ$.",
        how: HOW_9, skill: "Special angles",
        steps: [
          { step: 1, ask: "At $45^\\circ$ the two legs are…", type: "choice", answer: 0, options: [{ t: "equal" }, { t: "different", fb: "At $45^\\circ$ the point is exactly halfway round the quarter circle: $x = y$." }], m: "x = y", say: "An isosceles right triangle." },
          { step: 2, ask: "$x^2 + x^2 = 1$, so $x^2 =$ (a decimal is fine)", type: "num", pre: "$x^2 =$", answer: 0.5, near: [{ v: 2, fb: "$2x^2 = 1$: divide by 2." }], hint: "$2x^2 = 1$.", m: "x^2 = \\tfrac{1}{2}", say: "Half." },
          { step: 3, ask: "$x = \\sqrt{\\tfrac{1}{2}}$. (Type sqrt(1/2) or sqrt(2)/2.)", type: "num", pre: "$x \\approx$", answer: 0.7071, tol: 0.0006, calc: true, near: [{ v: 0.5, fb: "That is $x^2$. Take the square root." }], hint: "$\\frac{\\sqrt{2}}{2} \\approx 0.7071$.", m: "\\cos 45^\\circ = \\sin 45^\\circ = \\tfrac{\\sqrt{2}}{2}", say: "Both equal." }],
        why: "Triangle, sides, value." },
      { type: "sort", kicker: "On your own", prompt: "Sort each value into the box it equals.",
        bins: ["1/2", "√2/2", "√3/2"],
        cards: [{ t: "$\\sin 30^\\circ$", bin: 0, fb: "$\\sin 30^\\circ = \\frac{1}{2}$." }, { t: "$\\cos 60^\\circ$", bin: 0, fb: "$\\cos 60^\\circ = \\frac{1}{2}$." }, { t: "$\\sin 45^\\circ$", bin: 1, fb: "$\\frac{\\sqrt{2}}{2}$." }, { t: "$\\cos 45^\\circ$", bin: 1, fb: "$\\frac{\\sqrt{2}}{2}$." }, { t: "$\\sin 60^\\circ$", bin: 2, fb: "$\\frac{\\sqrt{3}}{2}$." }, { t: "$\\cos 30^\\circ$", bin: 2, fb: "$\\frac{\\sqrt{3}}{2}$." }],
        skill: "Special angles", hints: ["30° and 60° swap sine and cosine."], why: "$\\sin\\theta = \\cos(90^\\circ - \\theta)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Where does $\\frac{\\sqrt{3}}{2}$ come from?** Show that the height of an equilateral triangle with side 1 is $\\frac{\\sqrt{3}}{2}$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "\\text{side } 1, \\ \\text{base halved: } \\tfrac{1}{2}", say: "Cut the triangle along its height. The hypotenuse is 1 and one leg is $\\frac{1}{2}$." },
          { step: 2, m: "h^2 + \\left(\\tfrac{1}{2}\\right)^2 = 1^2", say: "Pythagoras.", ask: { prompt: "$h^2 = 1 - \\frac{1}{4} =$", answer: 0, options: [{ t: "$\\frac{3}{4}$" }, { t: "$\\frac{1}{2}$", fb: "$\\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4}$, and $1 - \\frac{1}{4} = \\frac{3}{4}$." }] } },
          { step: 3, m: "h = \\sqrt{\\tfrac{3}{4}} = \\tfrac{\\sqrt{3}}{2}", say: "The long leg. So $\\sin 60^\\circ = \\frac{\\sqrt{3}}{2}$." }] },
        gate: true, then: "$h = \\dfrac{\\sqrt{3}}{2} \\approx 0.866$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\cos 45^\\circ$ as a decimal. (Type sqrt(2)/2.)", pre: "$\\cos 45^\\circ \\approx$", answer: 0.7071, tol: 0.0006, calc: true, skill: "Special angles",
        near: [{ v: 0.5, fb: "$\\cos 60^\\circ = \\frac{1}{2}$. At $45^\\circ$ the legs are $\\frac{\\sqrt{2}}{2}$." }, { v: 0.866, tol: 0.0006, fb: "That is $\\cos 30^\\circ$." }], hints: ["The legs are equal: $x^2 = \\frac{1}{2}$."], why: "$\\frac{\\sqrt{2}}{2} \\approx 0.7071$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam says $\\sin 60^\\circ = \\dfrac{1}{2}$, \"because 60 is bigger, so half\". What is wrong?",
        options: [{ t: "$\\sin 30^\\circ = \\frac{1}{2}$. At $60^\\circ$ the point is higher: $\\sin 60^\\circ = \\frac{\\sqrt{3}}{2} \\approx 0.866$." }, { t: "Nothing is wrong.", fb: "Sine grows from 0 at $0^\\circ$ to 1 at $90^\\circ$: at $60^\\circ$ it is well past one half." }, { t: "$\\sin 60^\\circ = \\frac{\\sqrt{2}}{2}$.", fb: "That is $\\sin 45^\\circ$." }],
        answer: 0, skill: "Special angles", hints: ["Sine rises from 0 to 1 as the angle goes from 0° to 90°."], why: "$\\sin 60^\\circ \\approx 0.866$." },
      { type: "num", kicker: "Use it", prompt: "A point on a circle of radius 10 is at an angle of $60^\\circ$ from the positive $x$-axis. How high above the $x$-axis is it? (Type 10*sqrt(3)/2.)", pre: "height $\\approx$", answer: 8.66, tol: 0.006, calc: true, skill: "Special angles",
        near: [{ v: 5, fb: "That is $10\\cos 60^\\circ$, the horizontal distance." }], hints: ["height $= 10\\sin 60^\\circ$."], why: "$10 \\cdot \\frac{\\sqrt{3}}{2} \\approx 8.66$." }
    ]
  });

  /* ============================================ 10 · Reference angles */
  var HOW_10 = [["Reduce", "Find a coterminal angle between $0^\\circ$ and $360^\\circ$."],
                ["Quadrant", "Which quadrant is the terminal side in?"],
                ["Subtract", "I: $\\theta$. II: $180^\\circ - \\theta$. III: $\\theta - 180^\\circ$. IV: $360^\\circ - \\theta$."]];
  var REF10 = function (d) { d = ((d % 360) + 360) % 360; return d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d; };
  var RF10 = function (d, alt) {
    var a = d * Math.PI / 180, r = REF10(d), x = 2.2 * Math.cos(a), y = 2.2 * Math.sin(a), a0 = d <= 90 ? 0 : d <= 180 ? d : d <= 270 ? 180 : d, a1 = d <= 90 ? d : d <= 180 ? 180 : d <= 270 ? d : 360;
    return grid(alt, [{ seg: [[0, 0], [x, y]], c: "orange" }, { seg: [[x, y], [x, 0]], c: "soft", dash: true }, { turn: [[0, 0], 0.8, a0, a1], c: "green" }, dot(x, y, "orange")].concat(QLAB(2.6), [{ text: r + "°", at: [x * 0.45 + (x > 0 ? 0.5 : -0.5), y > 0 ? 0.35 : -0.35], c: "green" }]), { x: [-3, 3], y: [-3, 3], u: 38 });
  };
  LESSONS.push({
    title: "Reference angles", art: "pcang",
    blurb: "Book 5.2 · The acute angle between a terminal side and the $x$-axis: every angle borrows its values from it.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "How many degrees is it from $150^\\circ$ round to a half turn ($180^\\circ$)?", answer: 30, post: "degrees", skill: "Angles",
        near: [{ v: 330, fb: "Subtract the other way: $180 - 150$." }], hints: ["$180 - 150$."], why: "$30^\\circ$." },
      { type: "learn", kicker: "Explore",
        prompt: "The **reference angle** (green) is the acute angle between the terminal side and the **$x$-axis**. Drag the point and find, in **each quadrant**, an angle whose reference angle is exactly **$30^\\circ$**.",
        scene: { type: "sketch", x: [-3, 3], y: [-3, 3], u: 52, w: 340, gate: true,
          pts: { P: { at: [1.556, 1.556], drag: true, c: "orange", say: "The terminal side", on: { circle: [[0, 0], 2.2], snapDeg: 15 } } },
          track: function (s) { var d = angDeg(s.P); return REF10(d) === 30 ? "q" + (Math.floor(d / 90) + 1) : null; },
          draw: function (s) { var d = angDeg(s.P), a0 = d <= 90 ? 0 : d <= 180 ? d : d <= 270 ? 180 : d, a1 = d <= 90 ? d : d <= 180 ? 180 : d <= 270 ? d : 360, it = [{ seg: [[-2.5, 0], [2.5, 0]], c: "soft" }, { seg: [[0, 0], s.P], c: "orange" }, { seg: [[s.P[0], s.P[1]], [s.P[0], 0]], c: "soft", dash: true }]; if (d % 180 !== 0) it.push({ turn: [[0, 0], 0.8, a0, a1], c: "green" }); return it.concat(QLAB(2.6)); },
          readout: function (s) { var d = angDeg(s.P); return "$\\theta = " + d + "^\\circ$: reference angle $" + REF10(d) + "^\\circ$ (" + QUADN(d) + ")<br>Quadrants with a $30^\\circ$ reference angle: " + Math.min(Object.keys(s.tracked).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        gate: true, then: "$30^\\circ$, $150^\\circ$, $210^\\circ$ and $330^\\circ$ all have the reference angle $30^\\circ$. They are mirror images of each other in the axes, so they share the same sizes of sine and cosine." },
      { type: "learn", kicker: "The idea",
        prompt: "The **reference angle** of $\\theta$ is the acute angle (at most $90^\\circ$) between its terminal side and the **$x$-axis**. Find a coterminal angle in $[0^\\circ, 360^\\circ)$, decide the quadrant, then subtract from $180^\\circ$ or $360^\\circ$ (or from $\\theta$).",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the reference angle of $225^\\circ$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "0^\\circ \\le 225^\\circ < 360^\\circ", say: "Already in range." },
          { step: 2, m: "180^\\circ < 225^\\circ < 270^\\circ", say: "Quadrant III.", ask: { prompt: "In which quadrant is $225^\\circ$?", answer: 0, options: [{ t: "III" }, { t: "II", fb: "Quadrant II ends at 180°." }] } },
          { step: 3, m: "225^\\circ - 180^\\circ = 45^\\circ", say: "In quadrant III the reference angle is $\\theta - 180^\\circ$.", fig: RF10(225, "The angle 225 degrees and its reference angle of 45 degrees, measured from the negative x-axis.") }] },
        gate: true, then: "The reference angle of $225^\\circ$ is $45^\\circ$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the reference angle of $-120^\\circ$.",
        how: HOW_10, skill: "Reference angles",
        steps: [
          { step: 1, ask: "$-120^\\circ + 360^\\circ =$", type: "num", pre: "$\\theta =$", answer: 240, near: [{ v: -480, fb: "Add 360 to a negative angle." }], hint: "$360 - 120$.", m: "-120^\\circ \\sim 240^\\circ", say: "A coterminal angle in range." },
          { step: 2, ask: "Which quadrant is $240^\\circ$ in?", type: "choice", answer: 0, options: [{ t: "III" }, { t: "II", fb: "240 is past 180." }, { t: "IV", fb: "Quadrant IV starts at 270." }], m: "\\text{quadrant III}", say: "Between 180° and 270°." },
          { step: 3, ask: "$\\theta - 180^\\circ = 240 - 180 =$", type: "num", pre: "reference angle =", post: "degrees", answer: 60, near: [{ v: 120, fb: "That is $360 - 240$: the quadrant III rule is $\\theta - 180$." }], hint: "$240 - 180$.", m: "60^\\circ", say: "The reference angle." }],
        why: "Reduce, find the quadrant, subtract." },
      { type: "num", kicker: "On your own", prompt: "Find the reference angle of $330^\\circ$.", pre: "reference angle =", post: "degrees", answer: 30, skill: "Reference angles",
        near: [{ v: 150, fb: "$330 - 180$ is for quadrant III. Quadrant IV: $360 - 330$." }, { v: 60, fb: "$360 - 330 = 30$." }], hints: ["Quadrant IV: $360^\\circ - \\theta$."], why: "$360 - 330 = 30$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**In radians, and more than a turn.** Find the reference angle of $\\dfrac{13\\pi}{6}$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "\\tfrac{13\\pi}{6} - 2\\pi = \\tfrac{13\\pi}{6} - \\tfrac{12\\pi}{6} = \\tfrac{\\pi}{6}", say: "Take off one full turn.", ask: { prompt: "Is $\\frac{\\pi}{6}$ between 0 and $2\\pi$?", answer: 0, options: [{ t: "Yes" }, { t: "No", fb: "$\\frac{\\pi}{6} \\approx 0.52$, less than $2\\pi \\approx 6.28$." }] } },
          { step: 2, m: "0 < \\tfrac{\\pi}{6} < \\tfrac{\\pi}{2}", say: "Quadrant I." },
          { step: 3, m: "\\text{reference angle} = \\tfrac{\\pi}{6}", say: "In quadrant I an angle is its own reference angle." }] },
        gate: true, then: "$\\dfrac{13\\pi}{6}$ has the reference angle $\\dfrac{\\pi}{6}$ ($30^\\circ$)." },
      { type: "choice", kicker: "Try it", prompt: "What is the reference angle of $\\dfrac{5\\pi}{6}$?",
        options: [{ t: "$\\dfrac{\\pi}{6}$" }, { t: "$\\dfrac{5\\pi}{6}$", fb: "That is the angle itself. It is in quadrant II: $\\pi - \\frac{5\\pi}{6}$." }, { t: "$\\dfrac{\\pi}{3}$", fb: "$\\pi - \\frac{5\\pi}{6} = \\frac{\\pi}{6}$." }],
        answer: 0, skill: "Reference angles", hints: ["Quadrant II: $\\pi - \\theta$."], why: "$\\pi - \\frac{5\\pi}{6} = \\frac{\\pi}{6}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Jay says the reference angle of $150^\\circ$ is $150 - 90 = 60^\\circ$. What is wrong?",
        options: [{ t: "It is measured from the $x$-axis: $180^\\circ - 150^\\circ = 30^\\circ$." }, { t: "Nothing is wrong.", fb: "A reference angle is measured from the **$x$-axis**, not from the $y$-axis." }, { t: "It is $150^\\circ$.", fb: "A reference angle is always acute." }],
        answer: 0, skill: "Reference angles", hints: ["How far is $150^\\circ$ from the nearest part of the $x$-axis?"], why: "$30^\\circ$." },
      { type: "num", kicker: "Use it", prompt: "A swing is $210^\\circ$ round from its starting position on the right. How many degrees is it from the horizontal line through its pivot?", post: "degrees", answer: 30, skill: "Reference angles",
        near: [{ v: 150, fb: "That is the angle to the $x$-axis measured the long way round. The reference angle is the acute one." }], hints: ["$210 - 180$."], why: "$30^\\circ$ below the horizontal." }
    ]
  });

  /* ============================================ 11 · Sine and cosine in every quadrant */
  var HOW_11 = [["Reference", "Find the reference angle of $\\theta$."],
                ["Values", "Find $\\cos$ and $\\sin$ of the reference angle."],
                ["Signs", "Give $x$ and $y$ their signs from the quadrant."]];
  var DM11 = function (d, alt) {
    var a = d * Math.PI / 180, r = REF10(d), b = r * Math.PI / 180;
    return grid(alt, [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [Math.cos(a), Math.sin(a)]], c: "orange" }, dot(Math.cos(a), Math.sin(a), "orange"), { seg: [[0, 0], [Math.cos(b), Math.sin(b)]], c: "blue", dash: true }, dot(Math.cos(b), Math.sin(b), "blue")], { x: [-1.4, 1.4], y: [-1.4, 1.4], u: 86, step: 1 });
  };
  LESSONS.push({
    title: "Sine and cosine in every quadrant", art: "pcang",
    blurb: "Book 5.2 · A reference angle gives the size; the quadrant gives the sign.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In which quadrant are **both** $x$ and $y$ negative?",
        options: [{ t: "III" }, { t: "II", fb: "In quadrant II, $x$ is negative but $y$ is positive." }, { t: "IV", fb: "In quadrant IV, $x$ is positive but $y$ is negative." }],
        answer: 0, skill: "Quadrants", hints: ["Down and to the left."], why: "Quadrant III." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the orange point round. The **blue** twin is the point with the same **reference angle** in quadrant I. Compare their coordinates. Stop in **quadrants II, III and IV**.",
        scene: { type: "sketch", x: [-1.4, 1.4], y: [-1.4, 1.4], u: 108, w: 340, gate: true,
          pts: { P: { at: [-0.5, 0.866], drag: true, c: "orange", say: "The angle", on: { circle: [[0, 0], 1], snapDeg: 15 } } },
          track: function (s) { var d = angDeg(s.P); return d % 90 === 0 || d < 90 ? null : "q" + (Math.floor(d / 90) + 1); },
          draw: function (s) { var d = angDeg(s.P), b = REF10(d) * Math.PI / 180; return [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], s.P], c: "orange" }, { seg: [[0, 0], [Math.cos(b), Math.sin(b)]], c: "blue", dash: true }, dot(Math.cos(b), Math.sin(b), "blue")]; },
          readout: function (s) { var d = angDeg(s.P), c = Math.cos(d * Math.PI / 180), n = Math.sin(d * Math.PI / 180); return "$\\theta = " + d + "^\\circ$ (reference $" + REF10(d) + "^\\circ$): $\\cos\\theta = " + nm(f4(c, 3)) + "$, $\\sin\\theta = " + nm(f4(n, 3)) + "$<br>Quadrants II, III, IV visited: " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "The twin and the point have the **same sizes** $|x|$ and $|y|$: only the **signs** change with the quadrant. So $\\cos\\theta = \\pm\\cos(\\text{reference})$ and $\\sin\\theta = \\pm\\sin(\\text{reference})$." },
      { type: "learn", kicker: "The idea",
        prompt: "To find $\\cos\\theta$ and $\\sin\\theta$: find the **reference angle**, take its cosine and sine, then give each the **sign** it has in the quadrant: $x$ is positive in I and IV; $y$ is positive in I and II.",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\cos 150^\\circ$ and $\\sin 150^\\circ$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "180^\\circ - 150^\\circ = 30^\\circ", say: "$150^\\circ$ is in quadrant II: the reference angle is $30^\\circ$.", fig: DM11(150, "The point at 150 degrees on the unit circle and its mirror image at 30 degrees in quadrant I.") },
          { step: 2, m: "\\cos 30^\\circ = \\tfrac{\\sqrt{3}}{2}, \\ \\ \\sin 30^\\circ = \\tfrac{1}{2}", say: "The sizes, from the special triangle." },
          { step: 3, m: "x < 0, \\ \\ y > 0", say: "Quadrant II: $x$ is negative, $y$ is positive.", ask: { prompt: "So $\\cos 150^\\circ$ is…", answer: 0, options: [{ t: "$-\\frac{\\sqrt{3}}{2}$" }, { t: "$\\frac{\\sqrt{3}}{2}$", fb: "The cosine is the $x$-coordinate: negative in quadrant II." }] } },
          { step: 3, m: "\\cos 150^\\circ = -\\tfrac{\\sqrt{3}}{2}", say: "Negative $x$." },
          { step: 3, m: "\\sin 150^\\circ = \\tfrac{1}{2}", say: "Positive $y$." }] },
        gate: true, then: "$\\left(\\cos 150^\\circ, \\sin 150^\\circ\\right) = \\left(-\\dfrac{\\sqrt{3}}{2}, \\dfrac{1}{2}\\right)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\cos 300^\\circ$ and $\\sin 300^\\circ$.",
        how: HOW_11, skill: "Sine and cosine by reference angle",
        steps: [
          { step: 1, ask: "$300^\\circ$ is in quadrant IV. Its reference angle is $360 - 300 =$", type: "num", pre: "$\\theta_{ref} =$", post: "degrees", answer: 60, near: [{ v: 120, fb: "$300 - 180$ is the quadrant III rule. Quadrant IV: $360 - 300$." }], hint: "$360 - 300$.", m: "60^\\circ", say: "The reference angle." },
          { step: 2, ask: "$\\cos 60^\\circ$ is…", type: "choice", answer: 0, options: [{ t: "$\\frac{1}{2}$" }, { t: "$\\frac{\\sqrt{3}}{2}$", fb: "That is $\\sin 60^\\circ$." }], m: "\\cos 60^\\circ = \\tfrac{1}{2}, \\ \\ \\sin 60^\\circ = \\tfrac{\\sqrt{3}}{2}", say: "The sizes." },
          { step: 3, ask: "In quadrant IV, $y$ is…", type: "choice", answer: 0, options: [{ t: "negative, so $\\sin 300^\\circ = -\\frac{\\sqrt{3}}{2}$" }, { t: "positive", fb: "Quadrant IV is below the $x$-axis." }], m: "\\cos 300^\\circ = \\tfrac{1}{2}, \\ \\ \\sin 300^\\circ = -\\tfrac{\\sqrt{3}}{2}", say: "Positive cosine, negative sine." }],
        why: "Reference, values, signs." },
      { type: "num", kicker: "On your own", prompt: "Find $\\cos 225^\\circ$ as a decimal. (Type -sqrt(2)/2.)", pre: "$\\cos 225^\\circ \\approx$", answer: -0.7071, tol: 0.0006, calc: true, skill: "Sine and cosine by reference angle",
        near: [{ v: 0.7071, tol: 0.0006, fb: "Quadrant III has a negative $x$-coordinate: cosine is negative." }], hints: ["Reference angle $45^\\circ$, quadrant III."], why: "$-\\frac{\\sqrt{2}}{2} \\approx -0.7071$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A circle of radius 10.** Find the coordinates of the point on a circle of radius 10 at an angle of $120^\\circ$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "180^\\circ - 120^\\circ = 60^\\circ", say: "Quadrant II: reference angle $60^\\circ$." },
          { step: 2, m: "(x, y) = (10\\cos 120^\\circ, \\ 10\\sin 120^\\circ)", say: "On a circle of radius $r$ the coordinates are $r$ times the unit-circle ones." },
          { step: 2, m: "\\cos 60^\\circ = \\tfrac{1}{2}, \\ \\ \\sin 60^\\circ = \\tfrac{\\sqrt{3}}{2}", say: "The sizes." },
          { step: 3, m: "x = -10 \\cdot \\tfrac{1}{2} = -5", say: "Quadrant II: $x$ is negative.", ask: { prompt: "What sign is $y$ in quadrant II?", answer: 0, options: [{ t: "positive" }, { t: "negative", fb: "Quadrant II is above the $x$-axis." }] } },
          { step: 3, m: "y = 10 \\cdot \\tfrac{\\sqrt{3}}{2} \\approx 8.66", say: "The point is about $(-5,\\ 8.66)$." }] },
        gate: true, then: "$(-5,\\ 5\\sqrt{3}) \\approx (-5,\\ 8.66)$." },
      { type: "choice", kicker: "Try it", prompt: "What is $\\sin 210^\\circ$?",
        options: [{ t: "$-\\dfrac{1}{2}$" }, { t: "$\\dfrac{1}{2}$", fb: "$210^\\circ$ is in quadrant III: below the $x$-axis, so the sine is negative." }, { t: "$-\\dfrac{\\sqrt{3}}{2}$", fb: "The reference angle is $30^\\circ$, and $\\sin 30^\\circ = \\frac{1}{2}$." }],
        answer: 0, skill: "Sine and cosine by reference angle", hints: ["$210 - 180 = 30$."], why: "$-\\sin 30^\\circ = -\\frac{1}{2}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kim says $\\cos 135^\\circ = +\\dfrac{\\sqrt{2}}{2}$ \"because the reference angle is $45^\\circ$\". What is wrong?",
        options: [{ t: "$135^\\circ$ is in quadrant II, where $x$ is negative: $\\cos 135^\\circ = -\\frac{\\sqrt{2}}{2}$." }, { t: "Nothing is wrong.", fb: "The reference angle gives only the size. The quadrant decides the sign." }, { t: "$\\cos 135^\\circ = \\frac{1}{2}$.", fb: "That is $\\cos 60^\\circ$." }],
        answer: 0, skill: "Sine and cosine by reference angle", hints: ["Which way is the point from the $y$-axis?"], why: "$-\\frac{\\sqrt{2}}{2}$." },
      { type: "num", kicker: "Use it", prompt: "A Ferris wheel has radius 20 m and its centre is 25 m above the ground. A car is at an angle of $210^\\circ$ round from the rightmost point. Its height is $25 + 20\\sin 210^\\circ$. How high is it?", post: "m", answer: 15, skill: "Sine and cosine by reference angle",
        near: [{ v: 35, fb: "The sine of $210^\\circ$ is **negative**: the car is below the centre." }], hints: ["$\\sin 210^\\circ = -\\frac{1}{2}$."], why: "$25 + 20 \\cdot (-\\frac{1}{2}) = 15$ m." }
    ]
  });
  /* ============================================ 12 · Tangent, secant, cosecant and cotangent */
  var HOW_12 = [["Read", "Read $x$ and $y$ from the point on the unit circle."],
                ["Ratios", "$\\tan\\theta = \\dfrac{y}{x}$ and $\\cot\\theta = \\dfrac{x}{y}$."],
                ["Reciprocals", "$\\sec\\theta = \\dfrac{1}{x}$ and $\\csc\\theta = \\dfrac{1}{y}$. They are undefined when the bottom is 0."]];
  var SIX12 = function (d) {
    var a = d * Math.PI / 180, x = Math.round(Math.cos(a) * 1e9) / 1e9, y = Math.round(Math.sin(a) * 1e9) / 1e9, T = function (v) { return isFinite(v) ? nm(f4(v, 3)) : "undefined"; };
    return { x: x, y: y, tan: x === 0 ? "undefined" : T(y / x), cot: y === 0 ? "undefined" : T(x / y), sec: x === 0 ? "undefined" : T(1 / x), csc: y === 0 ? "undefined" : T(1 / y) };
  };
  var G12 = grid("The point (-3/5, 4/5) on the unit circle in quadrant II.", [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [-0.6, 0.8]], c: "orange" }, dot(-0.6, 0.8, "orange", "(−3/5, 4/5)", "ne")], { x: [-1.5, 1.5], y: [-1.5, 1.5], u: 80, step: 1 });
  LESSONS.push({
    title: "The other four trigonometric functions", art: "pcang",
    blurb: "Book 5.3 · Tangent and cotangent are ratios of $x$ and $y$. Secant and cosecant are their reciprocals.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\dfrac{1}{0.5}$?", answer: 2, skill: "Reciprocals",
        near: [{ v: 0.5, fb: "A reciprocal flips: $1 \\div 0.5 = 2$." }], hints: ["How many halves in 1?"], why: "$1 \\div 0.5 = 2$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the point round the unit circle. The readout shows **all six** trigonometric functions. Division by zero is impossible, so some are **undefined**. Find an angle where **tangent** is undefined, and one where **cotangent** is undefined.",
        scene: { type: "sketch", x: [-1.5, 1.5], y: [-1.5, 1.5], u: 100, w: 340, gate: true,
          pts: { P: { at: [0.7071, 0.7071], drag: true, c: "orange", say: "The angle", on: { circle: [[0, 0], 1], snapDeg: 15 } } },
          track: function (s) { var d = angDeg(s.P); return d % 180 === 90 ? "tan" : d % 180 === 0 ? "cot" : null; },
          draw: function (s) { return [{ circle: [[0, 0], 1], c: "soft" }, { seg: [[0, 0], [s.P[0], 0]], c: "blue" }, { seg: [[s.P[0], 0], s.P], c: "orange" }, { seg: [[0, 0], s.P], c: "ink" }]; },
          readout: function (s) { var d = angDeg(s.P), v = SIX12(d); return "$\\theta = " + d + "^\\circ$: $\\tan = " + v.tan + "$, $\\cot = " + v.cot + "$, $\\sec = " + v.sec + "$, $\\csc = " + v.csc + "$<br>$\\tan$ undefined found: " + (s.tracked.tan ? "✓" : "—") + " · $\\cot$ undefined found: " + (s.tracked.cot ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.tan && s.tracked.cot); } },
        gate: true, then: "$\\tan\\theta = \\frac{y}{x}$ is undefined when $x = 0$ ($90^\\circ$ and $270^\\circ$); $\\cot\\theta = \\frac{x}{y}$ is undefined when $y = 0$ ($0^\\circ$ and $180^\\circ$). Secant is undefined with tangent, and cosecant with cotangent." },
      { type: "learn", kicker: "The idea",
        prompt: "For a point $(x, y)$ on the unit circle at angle $\\theta$: $\\tan\\theta = \\frac{y}{x}$, $\\sec\\theta = \\frac{1}{x}$, $\\csc\\theta = \\frac{1}{y}$, $\\cot\\theta = \\frac{x}{y}$. Equivalently $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$. If the **bottom** is 0, the value is **undefined**.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "The point $\\left(-\\dfrac{3}{5}, \\dfrac{4}{5}\\right)$ is on the unit circle. Find all six trigonometric functions of its angle.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "x = -\\tfrac{3}{5}, \\ \\ y = \\tfrac{4}{5}", say: "So $\\cos\\theta = -\\frac{3}{5}$ and $\\sin\\theta = \\frac{4}{5}$.", fig: G12 },
          { step: 2, m: "\\tan\\theta = \\frac{y}{x} = \\frac{4/5}{-3/5} = -\\tfrac{4}{3}", say: "The fifths cancel.", ask: { prompt: "What is $\\frac{4/5}{-3/5}$?", answer: 0, options: [{ t: "$-\\frac{4}{3}$" }, { t: "$-\\frac{3}{4}$", fb: "$y$ goes on **top**: $\\frac{4}{-3}$." }] } },
          { step: 2, m: "\\cot\\theta = \\frac{x}{y} = -\\tfrac{3}{4}", say: "Cotangent is tangent upside down." },
          { step: 3, m: "\\sec\\theta = \\frac{1}{x} = -\\tfrac{5}{3}", say: "Flip $x$." },
          { step: 3, m: "\\csc\\theta = \\frac{1}{y} = \\tfrac{5}{4}", say: "Flip $y$." }] },
        gate: true, then: "$\\tan = -\\frac{4}{3}$, $\\cot = -\\frac{3}{4}$, $\\sec = -\\frac{5}{3}$, $\\csc = \\frac{5}{4}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now the point $\\left(\\dfrac{5}{13}, -\\dfrac{12}{13}\\right)$.",
        how: HOW_12, skill: "Six trigonometric functions",
        steps: [
          { step: 1, ask: "Which is $y$?", type: "choice", answer: 0, options: [{ t: "$-\\frac{12}{13}$" }, { t: "$\\frac{5}{13}$", fb: "That is $x$, the first coordinate." }], m: "x = \\tfrac{5}{13}, \\ \\ y = -\\tfrac{12}{13}", say: "Read the coordinates." },
          { step: 2, ask: "$\\tan\\theta = \\dfrac{y}{x} =$ (type -12/5)", type: "num", pre: "$\\tan\\theta =$", answer: -2.4, tol: 0.001, near: [{ v: -0.4167, tol: 0.001, fb: "That is $\\frac{x}{y}$, the cotangent. Tangent is $\\frac{y}{x}$." }], hint: "$\\frac{-12/13}{5/13}$.", m: "\\tan\\theta = -\\tfrac{12}{5}", say: "The 13s cancel." },
          { step: 3, ask: "$\\sec\\theta = \\dfrac{1}{x} =$ (type 13/5)", type: "num", pre: "$\\sec\\theta =$", answer: 2.6, tol: 0.001, near: [{ v: 0.3846, tol: 0.001, fb: "That is $x$ itself. Secant is $\\frac{1}{x}$." }], hint: "Flip $\\frac{5}{13}$.", m: "\\sec\\theta = \\tfrac{13}{5}", say: "Reciprocal of $x$." }],
        why: "Read, ratios, reciprocals." },
      { type: "sort", kicker: "On your own", prompt: "What is the value of each? (Think about the point on the unit circle.)",
        bins: ["0", "1", "−1", "undefined"],
        cards: [{ t: "$\\tan 0^\\circ$", bin: 0, fb: "$\\frac{y}{x} = \\frac{0}{1} = 0$." }, { t: "$\\cot 90^\\circ$", bin: 0, fb: "$\\frac{x}{y} = \\frac{0}{1} = 0$." }, { t: "$\\csc 90^\\circ$", bin: 1, fb: "$\\frac{1}{y} = \\frac{1}{1} = 1$." }, { t: "$\\sec 180^\\circ$", bin: 2, fb: "$\\frac{1}{x} = \\frac{1}{-1} = -1$." }, { t: "$\\tan 90^\\circ$", bin: 3, fb: "$\\frac{y}{x} = \\frac{1}{0}$, which is undefined." }, { t: "$\\cot 0^\\circ$", bin: 3, fb: "$\\frac{x}{y} = \\frac{1}{0}$, which is undefined." }],
        skill: "Six trigonometric functions", hints: ["Write the point $(x, y)$ first."], why: "Put $(x, y)$ into the ratio; a zero on the bottom is undefined." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Start from a different function.** $\\sec\\theta = \\dfrac{5}{3}$ and $\\theta$ is in quadrant IV. Find $\\tan\\theta$.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "\\cos\\theta = \\frac{1}{\\sec\\theta} = \\tfrac{3}{5}", say: "Secant is the reciprocal of cosine, so $x = \\frac{3}{5}$." },
          { step: 2, m: "y^2 = 1 - \\tfrac{9}{25} = \\tfrac{16}{25}", say: "Put $x$ into $x^2 + y^2 = 1$.", ask: { prompt: "In quadrant IV, is $y$ positive or negative?", answer: 0, options: [{ t: "Negative: $y = -\\frac{4}{5}$" }, { t: "Positive", fb: "Quadrant IV is below the $x$-axis." }] } },
          { step: 2, m: "y = -\\tfrac{4}{5}", say: "Choose the negative root." },
          { step: 3, m: "\\tan\\theta = \\frac{y}{x} = \\frac{-4/5}{3/5} = -\\tfrac{4}{3}", say: "Divide." }] },
        gate: true, then: "$\\tan\\theta = -\\dfrac{4}{3}$." },
      { type: "num", kicker: "Try it", prompt: "$\\sin\\theta = \\dfrac{3}{5}$ and $\\cos\\theta = \\dfrac{4}{5}$. Find $\\tan\\theta$. (Type 3/4 or 0.75.)", pre: "$\\tan\\theta =$", answer: 0.75, tol: 0.001, skill: "Six trigonometric functions",
        near: [{ v: 1.3333, tol: 0.001, fb: "That is $\\cot\\theta = \\frac{\\cos}{\\sin}$. Tangent is sine over cosine." }], hints: ["$\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$."], why: "$\\frac{3/5}{4/5} = \\frac{3}{4}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben says $\\sec\\theta = \\dfrac{1}{y}$. What is wrong?",
        options: [{ t: "Secant is $\\frac{1}{x}$, the reciprocal of **cosine**. Cosecant is $\\frac{1}{y}$." }, { t: "Nothing is wrong.", fb: "Secant goes with cosine: it is $\\frac{1}{\\cos\\theta} = \\frac{1}{x}$." }, { t: "Secant is $\\frac{y}{x}$.", fb: "That is the tangent." }],
        answer: 0, skill: "Six trigonometric functions", hints: ["Sec goes with Cos; Csc goes with Sin."], why: "$\\sec\\theta = \\frac{1}{x}$." },
      { type: "num", kicker: "Use it", prompt: "The terminal side of an angle of $60^\\circ$ has **slope** $\\tan 60^\\circ$. What is this slope? (Type sqrt(3) or tan(60°).)", pre: "slope $\\approx$", answer: 1.7321, tol: 0.0006, calc: true, skill: "Six trigonometric functions",
        near: [{ v: 0.5774, tol: 0.0006, fb: "That is $\\tan 30^\\circ$. At $60^\\circ$ the line is steeper." }], hints: ["$\\tan 60^\\circ = \\frac{\\sin 60^\\circ}{\\cos 60^\\circ} = \\frac{\\sqrt{3}/2}{1/2}$."], why: "$\\sqrt{3} \\approx 1.7321$." }
    ]
  });

  /* ============================================ 13 · All six functions by reference angle */
  var HOW_13 = [["Reference", "Find the reference angle and the quadrant."],
                ["Size", "Find the value of the function at the reference angle."],
                ["Sign", "Choose the sign: All, Sine, Tangent, Cosine (counterclockwise from I)."]];
  var SGN13 = { sin: [1, 1, -1, -1], cos: [1, -1, -1, 1], tan: [1, -1, 1, -1], csc: [1, 1, -1, -1], sec: [1, -1, -1, 1], cot: [1, -1, 1, -1] };
  LESSONS.push({
    title: "All six functions in every quadrant", art: "pcang",
    blurb: "Book 5.3 · The reference angle gives the size; \"All Students Take Calculus\" gives the sign.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In quadrant II, $x$ is negative and $y$ is positive. So $\\dfrac{y}{x}$ is…",
        options: [{ t: "negative" }, { t: "positive", fb: "A positive divided by a negative is negative." }, { t: "zero", fb: "Neither coordinate is zero." }],
        answer: 0, skill: "Signs", hints: ["Positive over negative."], why: "$\\tan\\theta < 0$ in quadrant II." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick a function. The circle shows whether it is **positive** (+) or **negative** (−) in each quadrant. Look at **all six**.",
        scene: { type: "sketch", x: [-2.4, 2.4], y: [-2.4, 2.4], u: 70, w: 340, gate: true, pts: {},
          chips: { f: { label: "Function", v: "sin", opts: [["sin", "sin"], ["cos", "cos"], ["tan", "tan"], ["csc", "csc"], ["sec", "sec"], ["cot", "cot"]] } },
          draw: function (s) { var g = SGN13[s.c.f], it = [{ circle: [[0, 0], 2], c: "soft" }, { seg: [[-2.2, 0], [2.2, 0]], c: "soft" }, { seg: [[0, -2.2], [0, 2.2]], c: "soft" }], pos = [[1.1, 1.1], [-1.1, 1.1], [-1.1, -1.1], [1.1, -1.1]]; g.forEach(function (v, i) { var p = pos[i]; it.push({ seg: [[p[0] - 0.3, p[1]], [p[0] + 0.3, p[1]]], c: v > 0 ? "green" : "orange" }); if (v > 0) it.push({ seg: [[p[0], p[1] - 0.3], [p[0], p[1] + 0.3]], c: "green" }); it.push({ text: ROM[i + 1], at: [p[0] * 1.8, p[1] * 1.8], c: "soft" }); }); return it; },
          readout: function (s) { var g = SGN13[s.c.f], pq = g.map(function (v, i) { return v > 0 ? ROM[i + 1] : null; }).filter(Boolean).join(" and "); return "$" + s.c.f + "\\theta$ is positive in quadrants " + pq + "<br>Looked at " + Math.min(Object.keys(s.seen.f).length, 6) + " of 6"; },
          goal: function (s) { return Object.keys(s.seen.f).length >= 6; } },
        gate: true, then: "Quadrant **I**: **A**ll are positive. **II**: only **S**ine (and cosecant). **III**: only **T**angent (and cotangent). **IV**: only **C**osine (and secant). \"All Students Take Calculus\"." },
      { type: "learn", kicker: "The idea",
        prompt: "To find any of the six functions of $\\theta$: use its **reference angle** for the size and the **quadrant** for the sign. A reciprocal has the same sign as its partner: $\\csc$ with $\\sin$, $\\sec$ with $\\cos$, $\\cot$ with $\\tan$.",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\tan 150^\\circ$ and $\\sec 150^\\circ$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "180^\\circ - 150^\\circ = 30^\\circ", say: "Quadrant II, reference angle $30^\\circ$." },
          { step: 2, m: "\\tan 30^\\circ = \\frac{1/2}{\\sqrt{3}/2} = \\tfrac{1}{\\sqrt{3}} \\approx 0.577", say: "The size of the tangent." },
          { step: 2, m: "\\sec 30^\\circ = \\frac{1}{\\sqrt{3}/2} = \\tfrac{2}{\\sqrt{3}} \\approx 1.155", say: "The size of the secant." },
          { step: 3, m: "\\text{II: only sine is positive}", say: "Tangent and secant are both negative in quadrant II.", ask: { prompt: "So $\\tan 150^\\circ$ is…", answer: 0, options: [{ t: "$-0.577$" }, { t: "$0.577$", fb: "Only sine and cosecant are positive in quadrant II." }] } },
          { step: 3, m: "\\tan 150^\\circ \\approx -0.577, \\ \\ \\sec 150^\\circ \\approx -1.155", say: "Sizes from $30^\\circ$, signs from the quadrant." }] },
        gate: true, then: "$\\tan 150^\\circ = -\\dfrac{1}{\\sqrt{3}}$ and $\\sec 150^\\circ = -\\dfrac{2}{\\sqrt{3}}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\sec 300^\\circ$.",
        how: HOW_13, skill: "Trigonometric functions by reference angle",
        steps: [
          { step: 1, ask: "$300^\\circ$ is in quadrant IV. Its reference angle is…", type: "choice", answer: 0, options: [{ t: "$60^\\circ$" }, { t: "$30^\\circ$", fb: "$360 - 300 = 60$." }], m: "360^\\circ - 300^\\circ = 60^\\circ", say: "Quadrant IV." },
          { step: 2, ask: "$\\cos 60^\\circ = \\frac{1}{2}$, so $\\sec 60^\\circ = \\dfrac{1}{1/2} =$", type: "num", pre: "$\\sec 60^\\circ =$", answer: 2, near: [{ v: 0.5, fb: "A reciprocal flips: $\\frac{1}{0.5} = 2$." }], hint: "$1 \\div 0.5$.", m: "\\sec 60^\\circ = 2", say: "The size." },
          { step: 3, ask: "In quadrant IV, cosine (and so secant) is…", type: "choice", answer: 0, options: [{ t: "positive: $\\sec 300^\\circ = 2$" }, { t: "negative: $\\sec 300^\\circ = -2$", fb: "In quadrant IV the $x$-coordinate is positive." }], m: "\\sec 300^\\circ = 2", say: "Cosine is the \"C\" of ASTC: positive in IV." }],
        why: "Reference, size, sign." },
      { type: "sort", kicker: "On your own", prompt: "Is each value positive or negative?",
        bins: ["Positive", "Negative"],
        cards: [{ t: "$\\sin 200^\\circ$", bin: 1, fb: "Quadrant III: sine is negative." }, { t: "$\\tan 200^\\circ$", bin: 0, fb: "Quadrant III: tangent is positive." }, { t: "$\\cot 100^\\circ$", bin: 1, fb: "Quadrant II: tangent and cotangent are negative." }, { t: "$\\csc 100^\\circ$", bin: 0, fb: "Quadrant II: sine and cosecant are positive." }, { t: "$\\sec 320^\\circ$", bin: 0, fb: "Quadrant IV: cosine and secant are positive." }, { t: "$\\cos 120^\\circ$", bin: 1, fb: "Quadrant II: cosine is negative." }],
        skill: "Trigonometric functions by reference angle", hints: ["All, Sine, Tangent, Cosine."], why: "ASTC." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A negative angle.** Find $\\sin(-30^\\circ)$ and $\\cos(-60^\\circ)$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "-30^\\circ \\sim 330^\\circ", say: "Add $360^\\circ$: quadrant IV, reference angle $30^\\circ$.", ask: { prompt: "Is $-30^\\circ$ above or below the $x$-axis?", answer: 0, options: [{ t: "Below (clockwise)" }, { t: "Above", fb: "A negative angle turns clockwise, below the axis." }] } },
          { step: 2, m: "\\sin 30^\\circ = \\tfrac{1}{2}", say: "The size." },
          { step: 3, m: "\\sin(-30^\\circ) = -\\tfrac{1}{2}", say: "Below the axis: negative. In general $\\sin(-\\theta) = -\\sin\\theta$: sine is **odd**." },
          { step: 3, m: "\\cos(-60^\\circ) = \\cos 60^\\circ = \\tfrac{1}{2}", say: "Cosine keeps its sign: $\\cos(-\\theta) = \\cos\\theta$: cosine is **even**." }] },
        gate: true, then: "Sine, tangent, cosecant and cotangent are **odd**; cosine and secant are **even**." },
      { type: "num", kicker: "Try it", prompt: "Find $\\cot 225^\\circ$. (Type 1.)", pre: "$\\cot 225^\\circ =$", answer: 1, skill: "Trigonometric functions by reference angle",
        near: [{ v: -1, fb: "Quadrant III: tangent and cotangent are **positive**." }], hints: ["The reference angle is $45^\\circ$, and $\\cot 45^\\circ = 1$."], why: "$\\cot 225^\\circ = \\cot 45^\\circ = 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rae says $\\cos(-60^\\circ) = -\\dfrac{1}{2}$ \"because the angle is negative\". What is wrong?",
        options: [{ t: "Cosine is even: $\\cos(-60^\\circ) = \\cos 60^\\circ = \\frac{1}{2}$. The point is in quadrant IV, where $x$ is positive." }, { t: "Nothing is wrong.", fb: "A negative **angle** does not make the cosine negative: look at the quadrant." }, { t: "$\\cos(-60^\\circ) = \\sin 60^\\circ$.", fb: "$\\sin 60^\\circ = \\frac{\\sqrt{3}}{2}$." }],
        answer: 0, skill: "Trigonometric functions by reference angle", hints: ["$-60^\\circ$ is in quadrant IV."], why: "$+\\frac{1}{2}$." },
      { type: "choice", kicker: "Use it", prompt: "A line through the origin makes an angle of $135^\\circ$ with the positive $x$-axis. Its slope is $\\tan 135^\\circ$. What is the slope?",
        options: [{ t: "$-1$" }, { t: "$1$", fb: "$135^\\circ$ is in quadrant II, where the tangent is negative: the line slopes **down**." }, { t: "$-\\dfrac{\\sqrt{2}}{2}$", fb: "That is $\\cos 135^\\circ$. Tangent is $\\frac{\\sin}{\\cos} = \\frac{\\sqrt{2}/2}{-\\sqrt{2}/2}$." }],
        answer: 0, skill: "Trigonometric functions by reference angle", hints: ["Reference angle $45^\\circ$, and $\\tan 45^\\circ = 1$."], why: "$\\tan 135^\\circ = -\\tan 45^\\circ = -1$." }
    ]
  });
  /* ============================================ 14 · Right triangle trigonometry */
  var HOW_14 = [["Label", "From the angle, name the sides: opposite, adjacent, hypotenuse."],
                ["Choose", "SOH-CAH-TOA: $\\sin = \\frac{\\text{opp}}{\\text{hyp}}$, $\\cos = \\frac{\\text{adj}}{\\text{hyp}}$, $\\tan = \\frac{\\text{opp}}{\\text{adj}}$."],
                ["Write", "Write the ratio. Flip it for $\\csc$, $\\sec$ and $\\cot$."]];
  var TRI14 = function (A, hyp) { var a = A * Math.PI / 180, x = hyp * Math.cos(a), y = hyp * Math.sin(a); return [{ path: [[0, 0], [x, 0], [x, y]], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [x, y]], c: "ink" }, { seg: [[x, 0], [x, y]], c: "orange" }, { seg: [[0, 0], [x, 0]], c: "blue" }, { turn: [[0, 0], hyp * 0.22, 0, A], c: "green" }, { path: [[x - hyp * 0.06, 0], [x - hyp * 0.06, hyp * 0.06], [x, hyp * 0.06]], c: "ink" }]; };
  var G14 = grid("A right triangle with sides 3, 4 and 5. The angle A is between the sides 4 and 5, so 3 is opposite, 4 is adjacent and 5 is the hypotenuse.", [{ path: [[0, 0], [4, 0], [4, 3]], closed: true, fill: true, c: "blue" }, { seg: [[0, 0], [4, 0]], c: "blue" }, { seg: [[4, 0], [4, 3]], c: "orange" }, { seg: [[0, 0], [4, 3]], c: "ink" }, { text: "A", at: [1.2, 0.35], c: "green" }, { text: "4 (adjacent)", at: [2, -0.55], c: "blue" }, { text: "3 (opposite)", at: [5.3, 1.5], c: "orange" }, { text: "5 (hypotenuse)", at: [1.7, 2.4], c: "ink" }], { x: [-1, 7], y: [-1.5, 4.5], u: 36, grid: false });
  LESSONS.push({
    title: "Right triangle trigonometry", art: "pcang",
    blurb: "Book 5.4 · Sine, cosine and tangent as ratios of the sides of a right triangle.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A right triangle has legs 9 and 12. How long is the hypotenuse?", answer: 15, skill: "Pythagorean theorem",
        near: [{ v: 21, fb: "Add the squares, then take the square root: $81 + 144 = 225$." }, { v: 225, fb: "That is $c^2$. Take the square root." }], hints: ["$9^2 + 12^2 = c^2$."], why: "$\\sqrt{225} = 15$." },
      { type: "learn", kicker: "Explore",
        prompt: "The angle $A$ is at the left. Pick an angle and **stretch** the triangle by changing the hypotenuse. Watch the three **ratios**. Try **three sizes** and **two angles**.",
        scene: { type: "sketch", x: [-0.3, 4.5], y: [-0.3, 4.5], u: 66, w: 340, gate: true, pts: {},
          chips: { a: { label: "Angle A", v: "35", opts: [["35", "35°"], ["50", "50°"], ["65", "65°"]] } },
          params: { h: { min: 1, max: 4, step: 0.5, v: 2, label: "hypotenuse" } },
          draw: function (s) { return TRI14(+s.c.a, s.p.h); },
          readout: function (s) { var A = +s.c.a * Math.PI / 180, h = s.p.h, o = h * Math.sin(A), a = h * Math.cos(A); return "hypotenuse $" + nm(h) + "$: opposite $" + nm(f4(o, 2)) + "$, adjacent $" + nm(f4(a, 2)) + "$<br>$\\frac{opp}{hyp} = " + nm(f4(o / h, 3)) + "$ &nbsp; $\\frac{adj}{hyp} = " + nm(f4(a / h, 3)) + "$ &nbsp; $\\frac{opp}{adj} = " + nm(f4(o / a, 3)) + "$"; },
          track: function (s) { return "h" + s.p.h; },
          goal: function (s) { return Object.keys(s.seen.a).length >= 2 && Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "The ratios did **not** change when the triangle grew. They depend only on the **angle**: that is why $\\sin A$, $\\cos A$ and $\\tan A$ are functions of the angle. **SOH-CAH-TOA**." },
      { type: "learn", kicker: "The idea",
        prompt: "In a right triangle, label the sides from the angle $A$: **opposite** (across from $A$), **adjacent** (next to $A$, not the hypotenuse) and the **hypotenuse**. **SOH-CAH-TOA:** $\\sin A = \\frac{O}{H}$, $\\cos A = \\frac{A}{H}$, $\\tan A = \\frac{O}{A}$. The reciprocals are $\\csc A = \\frac{H}{O}$, $\\sec A = \\frac{H}{A}$, $\\cot A = \\frac{A}{O}$.",
        scene: { type: "method", how: HOW_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "A right triangle has sides 3, 4 and 5. Find all six trigonometric functions of the angle $A$ marked.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "\\text{opp} = 3, \\ \\text{adj} = 4, \\ \\text{hyp} = 5", say: "The side across from $A$ is 3; the side beside it is 4; the longest side is 5.", fig: G14 },
          { step: 2, m: "\\sin A = \\tfrac{3}{5}, \\ \\ \\cos A = \\tfrac{4}{5}", say: "Opposite over hypotenuse; adjacent over hypotenuse.", ask: { prompt: "What is $\\tan A$?", answer: 0, options: [{ t: "$\\frac{3}{4}$: opposite over adjacent" }, { t: "$\\frac{4}{3}$", fb: "That is $\\cot A$. Tangent is opposite over adjacent." }] } },
          { step: 2, m: "\\tan A = \\tfrac{3}{4}", say: "Opposite over adjacent." },
          { step: 3, m: "\\csc A = \\tfrac{5}{3}, \\ \\sec A = \\tfrac{5}{4}", say: "Flip $\\sin$ and $\\cos$." },
          { step: 3, m: "\\cot A = \\tfrac{4}{3}", say: "Flip $\\tan$." }] },
        gate: true, then: "$\\sin A = \\frac{3}{5}$, $\\cos A = \\frac{4}{5}$, $\\tan A = \\frac{3}{4}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now a triangle with sides 5, 12 and 13, where the **opposite** side is 5.",
        how: HOW_14, skill: "Right triangle ratios",
        steps: [
          { step: 1, ask: "Which side is the hypotenuse?", type: "choice", answer: 0, options: [{ t: "13, the longest" }, { t: "12", fb: "The hypotenuse is the longest side, across from the right angle." }], m: "\\text{hyp} = 13, \\ \\text{opp} = 5, \\ \\text{adj} = 12", say: "The adjacent side is the one left over." },
          { step: 2, ask: "$\\sin A = \\dfrac{\\text{opp}}{\\text{hyp}}$. (Type 5/13.)", type: "num", pre: "$\\sin A \\approx$", answer: 0.3846, tol: 0.0006, near: [{ v: 0.4167, tol: 0.0006, fb: "That is $\\tan A = \\frac{5}{12}$. Sine uses the hypotenuse." }], hint: "$\\frac{5}{13}$.", m: "\\sin A = \\tfrac{5}{13}", say: "Opposite over hypotenuse." },
          { step: 3, ask: "$\\tan A = \\dfrac{\\text{opp}}{\\text{adj}}$. (Type 5/12.)", type: "num", pre: "$\\tan A \\approx$", answer: 0.4167, tol: 0.0006, near: [{ v: 0.3846, tol: 0.0006, fb: "That is $\\sin A$." }], hint: "$\\frac{5}{12}$.", m: "\\tan A = \\tfrac{5}{12}", say: "Opposite over adjacent." }],
        why: "Label, choose, write." },
      { type: "choice", kicker: "On your own", prompt: "A right triangle has legs 8 and 15 and hypotenuse 17. For the angle opposite the side 8, which is $\\cos A$?",
        options: [{ t: "$\\dfrac{15}{17}$" }, { t: "$\\dfrac{8}{17}$", fb: "That is $\\sin A$: the opposite side over the hypotenuse." }, { t: "$\\dfrac{8}{15}$", fb: "That is $\\tan A$." }],
        answer: 0, skill: "Right triangle ratios", hints: ["Adjacent is the leg that is not opposite: 15."], why: "$\\cos A = \\frac{\\text{adj}}{\\text{hyp}} = \\frac{15}{17}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Special triangles.** In a $30^\\circ$-$60^\\circ$-$90^\\circ$ triangle the hypotenuse is 10. Find the legs and $\\sin 30^\\circ$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "\\text{hypotenuse} = 10", say: "A triangle similar to the one with hypotenuse 1, ten times bigger." },
          { step: 2, m: "\\text{short leg} = 10 \\cdot \\tfrac{1}{2} = 5", say: "The side opposite $30^\\circ$ is half the hypotenuse.", ask: { prompt: "Which side is opposite the $30^\\circ$ angle?", answer: 0, options: [{ t: "The short leg" }, { t: "The long leg", fb: "The smaller angle faces the shorter side." }] } },
          { step: 2, m: "\\text{long leg} = 10 \\cdot \\tfrac{\\sqrt{3}}{2} = 5\\sqrt{3}", say: "Opposite $60^\\circ$." },
          { step: 3, m: "\\sin 30^\\circ = \\frac{5}{10} = \\tfrac{1}{2}", say: "The same value as before: the ratio does not depend on the size." }] },
        gate: true, then: "Sides $5$, $5\\sqrt{3}$, $10$; and $\\sin 30^\\circ = \\frac{1}{2}$ still." },
      { type: "num", kicker: "Try it", prompt: "In a right triangle the side opposite angle $A$ is 9 and the adjacent side is 12. Find $\\tan A$. (Type 9/12 or 0.75.)", pre: "$\\tan A =$", answer: 0.75, tol: 0.001, skill: "Right triangle ratios",
        near: [{ v: 1.3333, tol: 0.001, fb: "That is $\\cot A$. Tangent is opposite over adjacent." }], hints: ["$\\frac{\\text{opp}}{\\text{adj}}$."], why: "$\\frac{9}{12} = \\frac{3}{4}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee says $\\cos A = \\dfrac{\\text{opposite}}{\\text{hypotenuse}}$. What is wrong?",
        options: [{ t: "That is sine. Cosine is **adjacent** over hypotenuse." }, { t: "Nothing is wrong.", fb: "SOH is sine = Opposite over Hypotenuse. CAH is cosine = Adjacent over Hypotenuse." }, { t: "Cosine is opposite over adjacent.", fb: "That is tangent: TOA." }],
        answer: 0, skill: "Right triangle ratios", hints: ["SOH-CAH-TOA."], why: "CAH: $\\cos A = \\frac{A}{H}$." },
      { type: "num", kicker: "Use it", prompt: "A ramp rises 3 m over a horizontal distance of 12 m. What is the **tangent** of the angle it makes with the ground? (A decimal is fine.)", pre: "$\\tan\\theta =$", answer: 0.25, tol: 0.001, skill: "Right triangle ratios",
        near: [{ v: 4, fb: "That is run over rise. Tangent is rise (opposite) over run (adjacent)." }], hints: ["Opposite is the rise; adjacent is the run."], why: "$\\frac{3}{12} = 0.25$." }
    ]
  });

  /* ============================================ 15 · Finding missing sides and angles */
  var HOW_15 = [["Sketch", "Draw the triangle. Mark what you know and what you want."],
                ["Pick a ratio", "Choose the ratio that links the unknown to one known side or angle."],
                ["Solve", "Solve for the unknown; for an angle use $\\sin^{-1}$, $\\cos^{-1}$ or $\\tan^{-1}$."]];
  var G15 = grid("A right triangle with hypotenuse 12 and an angle of 35 degrees. The side opposite the angle is the unknown.", TRI14(35, 12).concat([{ text: "12", at: [4.4, 4.4], c: "ink" }, { text: "?", at: [10.6, 3.4], c: "orange" }, { text: "35°", at: [2.9, 0.7], c: "green" }]), { x: [-1, 13], y: [-2, 9], u: 24, grid: false });
  LESSONS.push({
    title: "Finding missing sides and angles", art: "pcang",
    blurb: "Book 5.4 · A ratio, a known side and a calculator: solve the triangle.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which ratio uses the side **opposite** an angle and the **hypotenuse**?",
        options: [{ t: "sine" }, { t: "cosine", fb: "Cosine is adjacent over hypotenuse." }, { t: "tangent", fb: "Tangent uses the opposite and the adjacent sides." }],
        answer: 0, skill: "SOH-CAH-TOA", hints: ["SOH."], why: "$\\sin A = \\frac{O}{H}$." },
      { type: "learn", kicker: "Explore",
        prompt: "The hypotenuse is **10**. Slide the angle $A$ and watch the two legs. Find the angle for which the **opposite** side is exactly **5**, and the angle for which the **adjacent** side is exactly 5.",
        scene: { type: "sketch", x: [-1, 11], y: [-1, 11], u: 28, w: 340, gate: true, pts: {},
          params: { a: { min: 10, max: 80, step: 5, v: 45, label: "angle $A$ (°)" } },
          track: function (s) { return s.p.a === 30 ? "opp" : s.p.a === 60 ? "adj" : null; },
          draw: function (s) { return TRI14(s.p.a, 10); },
          readout: function (s) { var A = s.p.a * Math.PI / 180, o = 10 * Math.sin(A), a = 10 * Math.cos(A); return "$A = " + s.p.a + "^\\circ$: opposite $= 10\\sin A = " + nm(f4(o, 2)) + "$, adjacent $= 10\\cos A = " + nm(f4(a, 2)) + "$<br>Opposite = 5 found: " + (s.tracked.opp ? "✓" : "—") + " · adjacent = 5 found: " + (s.tracked.adj ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.opp && s.tracked.adj); } },
        gate: true, then: "$\\text{opposite} = 10\\sin A = 5$ at $30^\\circ$, and $\\text{adjacent} = 10\\cos A = 5$ at $60^\\circ$. Each side is the **hypotenuse times** a sine or a cosine." },
      { type: "learn", kicker: "The idea",
        prompt: "To find a **side**, choose the ratio that links it to a known side and the angle, then solve. To find an **angle**, use the **inverse**: $A = \\sin^{-1}\\left(\\frac{O}{H}\\right)$. Use degree mode, or type the angle with a $°$ sign: sin(35°).",
        scene: { type: "method", how: HOW_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "A right triangle has hypotenuse 12 and an angle of $35^\\circ$. How long is the side opposite the angle?",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "H = 12, \\ \\ A = 35^\\circ, \\ \\ O = \\,?", say: "Draw it and mark what you know.", fig: G15 },
          { step: 2, m: "\\sin 35^\\circ = \\frac{O}{12}", say: "The opposite side and the hypotenuse: sine.", ask: { prompt: "Which ratio links the opposite side to the hypotenuse?", answer: 0, options: [{ t: "sine" }, { t: "cosine", fb: "Cosine uses the adjacent side." }] } },
          { step: 3, m: "O = 12\\sin 35^\\circ", say: "Multiply both sides by 12." },
          { step: 3, m: "O \\approx 6.88", say: "Type 12*sin(35°) in a calculator." }] },
        gate: true, then: "$O = 12\\sin 35^\\circ \\approx 6.88$." },
      { type: "guided", kicker: "Together",
        prompt: "Now the **adjacent** side is 8 and the angle is $40^\\circ$. How long is the hypotenuse?",
        how: HOW_15, skill: "Solve a right triangle",
        steps: [
          { step: 1, ask: "Which ratio links the adjacent side and the hypotenuse?", type: "choice", answer: 0, options: [{ t: "cosine" }, { t: "sine", fb: "Sine uses the opposite side." }], m: "\\cos 40^\\circ = \\frac{8}{H}", say: "CAH." },
          { step: 2, ask: "Solving $\\cos 40^\\circ = \\dfrac{8}{H}$ gives $H = \\dfrac{8}{\\cos 40^\\circ}$. (Type 8/cos(40°).)", type: "num", pre: "$H \\approx$", answer: 10.443, tol: 0.006, calc: true, near: [{ v: 6.128, tol: 0.006, fb: "That is $8\\cos 40^\\circ$. The unknown is on the **bottom**, so divide." }], hint: "$\\cos 40^\\circ \\approx 0.766$.", m: "H \\approx 10.44", say: "The hypotenuse." },
          { step: 3, ask: "Is that sensible? The hypotenuse must be…", type: "choice", answer: 0, options: [{ t: "longer than the adjacent side, 8" }, { t: "shorter than 8", fb: "The hypotenuse is always the longest side." }], m: "10.44 > 8", say: "It passes the check." }],
        why: "Sketch, pick a ratio, solve." },
      { type: "num", kicker: "On your own", prompt: "The side opposite angle $A$ is 3 and the hypotenuse is 5. Find $A$ in degrees. (Type arcsin(3/5)*180/pi.)", pre: "$A \\approx$", post: "degrees", answer: 36.87, tol: 0.006, calc: true, skill: "Solve a right triangle",
        near: [{ v: 0.6435, tol: 0.001, fb: "That is the angle in **radians**. Multiply by $\\frac{180}{\\pi}$." }, { v: 0.6, fb: "That is $\\sin A$, not the angle $A$. Use the inverse function." }], hints: ["$\\sin A = \\frac{3}{5}$, so $A = \\sin^{-1}(0.6)$."], why: "$\\sin^{-1}(0.6) \\approx 36.87^\\circ$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Solve the whole triangle.** The hypotenuse is 20 and one angle is $25^\\circ$. Find the other angle and both legs.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "B = 90^\\circ - 25^\\circ = 65^\\circ", say: "The angles of a triangle add to $180^\\circ$, and one is a right angle." },
          { step: 2, m: "O = 20\\sin 25^\\circ \\approx 8.45", say: "Opposite the $25^\\circ$ angle.", ask: { prompt: "For the adjacent side we use…", answer: 0, options: [{ t: "$20\\cos 25^\\circ$" }, { t: "$20\\sin 25^\\circ$", fb: "That is the opposite side. Adjacent is cosine." }] } },
          { step: 2, m: "A = 20\\cos 25^\\circ \\approx 18.13", say: "Adjacent to the $25^\\circ$ angle." },
          { step: 3, m: "8.45^2 + 18.13^2 \\approx 400 = 20^2", say: "Check with Pythagoras." }] },
        gate: true, then: "Angles $25^\\circ$, $65^\\circ$, $90^\\circ$; sides $8.45$, $18.13$, $20$." },
      { type: "choice", kicker: "Try it", prompt: "To find the **height** of a point on a 15 m slope that makes a $40^\\circ$ angle with the ground, which expression do you use?",
        options: [{ t: "$15\\sin 40^\\circ$" }, { t: "$15\\cos 40^\\circ$", fb: "Cosine gives the **horizontal** distance (adjacent side)." }, { t: "$\\dfrac{15}{\\sin 40^\\circ}$", fb: "Height is opposite, and $\\sin = \\frac{O}{H}$ gives $O = H\\sin A$: multiply." }],
        answer: 0, skill: "Solve a right triangle", hints: ["Height is the opposite side."], why: "$O = H\\sin A$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Max types sin(35) into his calculator and gets $-0.43$. The answer should be $0.57$. What is the problem?",
        options: [{ t: "The calculator is in radian mode: it is computing $\\sin(35\\text{ radians})$. Use degree mode, or type sin(35°)." }, { t: "Nothing is wrong.", fb: "$\\sin 35^\\circ$ must be positive: it is a first-quadrant angle." }, { t: "He should use cosine.", fb: "The calculator mode is the issue." }],
        answer: 0, skill: "Solve a right triangle", hints: ["35 radians is many full turns."], why: "$\\sin 35^\\circ \\approx 0.574$." },
      { type: "num", kicker: "Use it", prompt: "A 6 m ladder leans against a wall and makes a $70^\\circ$ angle with the ground. How high up the wall does it reach? (Type 6*sin(70°).)", pre: "height $\\approx$", post: "m", answer: 5.64, tol: 0.006, calc: true, skill: "Solve a right triangle",
        near: [{ v: 2.05, tol: 0.006, fb: "That is $6\\cos 70^\\circ$, the distance of the foot from the wall." }], hints: ["The height is the opposite side: $6\\sin 70^\\circ$."], why: "$6\\sin 70^\\circ \\approx 5.64$ m." }
    ]
  });

  /* ============================================ 16 · Angles of elevation and depression */
  var HOW_16 = [["Draw", "Sketch the situation, mark the right angle and the angle you are given."],
                ["Ratio", "Pick sin, cos or tan for the sides involved."],
                ["Solve", "Solve, and answer with units."]];
  LESSONS.push({
    title: "Angles of elevation and depression", art: "pcang",
    blurb: "Book 5.4 · Heights and distances you cannot measure directly.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Use a calculator: $\\tan 40^\\circ$ to 2 decimal places. (Type tan(40°).)", answer: 0.84, tol: 0.006, calc: true, skill: "Calculator trig",
        near: [{ v: -2.23, tol: 0.006, fb: "That is the calculator in radian mode. Use degrees: type tan(40°)." }], hints: ["tan(40°) $\\approx$ 0.839."], why: "$\\tan 40^\\circ \\approx 0.84$." },
      { type: "learn", kicker: "Explore",
        prompt: "You stand 50 m from a tower that is **60 m** tall. The **angle of elevation** is the angle your line of sight makes above the horizontal. Slide the angle to find where your line of sight meets the **top** of the tower.",
        scene: { type: "sketch", x: [-5, 58], y: [-5, 82], u: 3.6, w: 260, gx: 10, step: 10, gy: 10, stepY: 10, gate: true, pts: {},
          params: { a: { min: 10, max: 70, step: 1, v: 20, label: "elevation (°)" } },
          draw: function (s) { var a = s.p.a * Math.PI / 180, ht = 50 * Math.tan(a), hit = Math.abs(ht - 60) < 1; return [{ path: [[50, 0], [50, 60]], c: "ink" }, { seg: [[0, 0], [50, 0]], c: "soft" }, { seg: [[0, 0], [50, Math.min(ht, 80)]], c: hit ? "green" : "orange" }, { turn: [[0, 0], 12, 0, s.p.a], c: "green" }, dot(50, Math.min(ht, 80), hit ? "green" : "orange")]; },
          readout: function (s) { var a = s.p.a * Math.PI / 180, ht = 50 * Math.tan(a); return "elevation $" + s.p.a + "^\\circ$: the line of sight reaches $50\\tan " + s.p.a + "^\\circ = " + nm(f4(ht, 1)) + "$ m up the tower" + (Math.abs(ht - 60) < 1 ? " — **the top!** ✓" : ""); },
          goal: function (s) { return Math.abs(50 * Math.tan(s.p.a * Math.PI / 180) - 60) < 1; } },
        gate: true, then: "At about $50^\\circ$ the line of sight meets the top: $\\tan\\theta = \\frac{60}{50} = 1.2$, so $\\theta = \\tan^{-1}(1.2) \\approx 50.2^\\circ$. Heights come from $\\text{distance} \\times \\tan(\\text{elevation})$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **angle of elevation** is measured **up** from the horizontal to a line of sight; the **angle of depression** is measured **down** from the horizontal. Both are measured from the **horizontal**, never from the vertical. Draw the right triangle, then use $\\tan$, $\\sin$ or $\\cos$.",
        scene: { type: "method", how: HOW_16 } },
      { type: "learn", kicker: "Watch",
        prompt: "You stand 50 m from a tower. The angle of elevation to its top is $40^\\circ$. How tall is the tower?",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "\\text{adjacent} = 50, \\ \\ A = 40^\\circ, \\ \\ \\text{opposite} = h", say: "The horizontal distance is the adjacent side; the height is the opposite side." },
          { step: 2, m: "\\tan 40^\\circ = \\frac{h}{50}", say: "Opposite and adjacent: tangent.", ask: { prompt: "Which ratio uses opposite and adjacent?", answer: 0, options: [{ t: "tangent" }, { t: "sine", fb: "Sine uses the hypotenuse." }] } },
          { step: 3, m: "h = 50\\tan 40^\\circ", say: "Multiply both sides by 50." },
          { step: 3, m: "h \\approx 41.95 \\text{ m}", say: "About 42 metres." }] },
        gate: true, then: "$h = 50\\tan 40^\\circ \\approx 41.95$ m." },
      { type: "guided", kicker: "Together",
        prompt: "From a lighthouse 30 m above the sea, the **angle of depression** to a boat is $25^\\circ$. How far is the boat from the foot of the lighthouse?",
        how: HOW_16, skill: "Elevation and depression",
        steps: [
          { step: 1, ask: "The angle of depression is measured from…", type: "choice", answer: 0, options: [{ t: "the horizontal, looking down" }, { t: "the vertical", fb: "Both elevation and depression are measured from the horizontal." }], m: "25^\\circ \\text{ below the horizontal}", say: "By alternate angles, the angle at the boat is also $25^\\circ$." },
          { step: 2, ask: "The height 30 is opposite the $25^\\circ$ angle at the boat. $\\tan 25^\\circ = \\dfrac{30}{d}$, so $d = \\dfrac{30}{\\tan 25^\\circ}$. (Type 30/tan(25°).)", type: "num", pre: "$d \\approx$", post: "m", answer: 64.33, tol: 0.006, calc: true, near: [{ v: 13.99, tol: 0.006, fb: "That is $30\\tan 25^\\circ$. The distance is on the **bottom** of the ratio." }], hint: "$\\tan 25^\\circ \\approx 0.4663$.", m: "d \\approx 64.33", say: "About 64.3 metres." },
          { step: 3, ask: "Is that sensible? A shallow $25^\\circ$ angle should put the boat…", type: "choice", answer: 0, options: [{ t: "farther away than the lighthouse is high" }, { t: "closer than 30 m", fb: "A shallow angle means a long way out." }], m: "64 > 30", say: "It passes the check." }],
        why: "Draw, ratio, solve." },
      { type: "num", kicker: "On your own", prompt: "A pole 8 m tall casts a shadow 5 m long. What is the angle of elevation of the sun, in degrees? (Type arctan(8/5)*180/pi.)", pre: "$\\theta \\approx$", post: "degrees", answer: 57.99, tol: 0.006, calc: true, skill: "Elevation and depression",
        near: [{ v: 32.01, tol: 0.006, fb: "That is the angle at the **top** of the pole. The sun's elevation is at the ground: opposite is the pole." }], hints: ["$\\tan\\theta = \\frac{8}{5}$."], why: "$\\tan^{-1}(1.6) \\approx 57.99^\\circ$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Two angles.** From one spot the angle of elevation to the top of a tower is $30^\\circ$. After walking 40 m **towards** it, the angle is $45^\\circ$. How tall is the tower?",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "h = x\\tan 45^\\circ = x", say: "Let $x$ be the distance from the second spot. $\\tan 45^\\circ = 1$." },
          { step: 2, m: "h = (x + 40)\\tan 30^\\circ", say: "From the first spot the distance is $x + 40$.", ask: { prompt: "$\\tan 30^\\circ$ is…", answer: 0, options: [{ t: "$\\frac{1}{\\sqrt{3}}$" }, { t: "$\\sqrt{3}$", fb: "That is $\\tan 60^\\circ$." }] } },
          { step: 2, m: "x = \\frac{x + 40}{\\sqrt{3}}", say: "Both expressions equal $h$." },
          { step: 3, m: "x(\\sqrt{3} - 1) = 40 \\ \\Rightarrow \\ x \\approx 54.64", say: "Multiply by $\\sqrt{3}$, gather the $x$ terms and divide." },
          { step: 3, m: "h = x \\approx 54.64 \\text{ m}", say: "The tower is about 54.6 metres tall." }] },
        gate: true, then: "$h \\approx 54.64$ m." },
      { type: "num", kicker: "Try it", prompt: "A road rises 10 m for every 100 m of horizontal distance (a 10% grade). What angle does it make with the horizontal, in degrees? (Type arctan(0.1)*180/pi.)", pre: "$\\theta \\approx$", post: "degrees", answer: 5.71, tol: 0.006, calc: true, skill: "Elevation and depression",
        near: [{ v: 10, fb: "A 10% grade is not a 10° angle: use $\\tan^{-1}\\left(\\frac{10}{100}\\right)$." }], hints: ["$\\tan\\theta = \\frac{10}{100}$."], why: "$\\tan^{-1}(0.1) \\approx 5.71^\\circ$." },
      { type: "choice", kicker: "Find the error",
        prompt: "From the top of a cliff the angle of depression to a boat is $20^\\circ$. Ana says the angle of elevation of the cliff top, seen from the boat, is $70^\\circ$, \"because depression is measured from the vertical\". What is wrong?",
        options: [{ t: "Both are measured from the **horizontal**. The two horizontals are parallel, so the angle of elevation is also $20^\\circ$." }, { t: "Nothing is wrong.", fb: "Depression is measured down from the horizontal, not from the vertical." }, { t: "The two angles are not related.", fb: "Alternate angles between parallel lines are equal." }],
        answer: 0, skill: "Elevation and depression", hints: ["Parallel horizontals: alternate angles are equal."], why: "Depression and elevation are equal." },
      { type: "num", kicker: "Use it", prompt: "A drone is 40 m above the ground and flies so that the angle of elevation from a point on the ground is $35^\\circ$. How far from the point is it, along the line of sight? (Type 40/sin(35°).)", pre: "distance $\\approx$", post: "m", answer: 69.74, tol: 0.006, calc: true, skill: "Elevation and depression",
        near: [{ v: 57.13, tol: 0.006, fb: "That is the **horizontal** distance, $\\frac{40}{\\tan 35^\\circ}$. The line of sight is the hypotenuse." }], hints: ["Height is opposite; the line of sight is the hypotenuse: sine."], why: "$\\frac{40}{\\sin 35^\\circ} \\approx 69.74$ m." }
    ]
  });
  /* ================================================================ Skills */
  var TRIPLES5 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  var SPEC5 = { 30: ["\\frac{1}{2}", "\\frac{\\sqrt{3}}{2}"], 45: ["\\frac{\\sqrt{2}}{2}", "\\frac{\\sqrt{2}}{2}"], 60: ["\\frac{\\sqrt{3}}{2}", "\\frac{1}{2}"] };   // [sin, cos]
  var QN5 = function (d) { d = ((d % 360) + 360) % 360; return d % 90 === 0 ? "On an axis" : "Quadrant " + ROM[Math.floor(d / 90) + 1]; };
  var SKILLS = [
    { id: "pc5-quad", title: "Which quadrant?", lesson: 2,
      gen: function (R) {
        var d = R.chance(0.12) ? R.pick([-270, -180, -90, 90, 180, 270, 450, 540, 630]) : R.int(-700, 880), right = QN5(d), red = ((d % 360) + 360) % 360;
        var opts = ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV", "On an axis"];
        return mc(R, { prompt: "In which quadrant does the terminal side of $" + d + "^\\circ$ lie?", right: right,
          wrong: opts.filter(function (t) { return t !== right; }).slice(0, 4).map(function (t) { return { t: t, fb: "Reduce first: $" + d + "^\\circ$ is coterminal with $" + red + "^\\circ$, " + (right === "On an axis" ? "on an axis" : "in " + right.toLowerCase()) + "." }; }), keep: true,
          hints: ["Add or subtract 360° until the angle is between 0° and 360°."], why: "$" + d + "^\\circ \\sim " + red + "^\\circ$: " + right.toLowerCase() + "." });
      } },
    { id: "pc5-radian", title: "Radian measure from arc and radius", lesson: 3,
      gen: function (R) {
        var r = R.int(2, 9), th = R.pick([0.5, 1, 1.5, 2, 2.5, 3]), s = r * th, t = R.int(0, 2);
        if (t === 0) return { type: "num", prompt: "An arc of length " + s + " lies on a circle of radius " + r + ". What is the angle in radians?", pre: "$\\theta =$", post: "radians", answer: th, near: near(th, [{ v: r / s, tol: 0.001, fb: "That is $\\frac{r}{s}$, upside down: $\\theta = \\frac{s}{r}$." }, { v: r * s, fb: "Divide the arc length by the radius." }]), hints: ["$\\theta = \\frac{s}{r}$."], why: "$\\frac{" + s + "}{" + r + "} = " + th + "$." };
        if (t === 1) return { type: "num", prompt: "A circle has radius " + r + ". An angle of $" + th + "$ radians cuts off an arc. How long is the arc?", pre: "$s =$", answer: s, near: near(s, [{ v: th / r, tol: 0.001, fb: "Multiply: $s = r\\theta$." }]), hints: ["$s = r\\theta$."], why: "$" + r + " \\cdot " + th + " = " + s + "$." };
        return { type: "num", prompt: "An arc of length " + s + " is cut off by an angle of $" + th + "$ radians. What is the radius?", pre: "$r =$", answer: r, near: near(r, [{ v: s * th, fb: "Divide: $r = \\frac{s}{\\theta}$." }]), hints: ["$r = \\frac{s}{\\theta}$."], why: "$\\frac{" + s + "}{" + th + "} = " + r + "$." };
      } },
    { id: "pc5-convert", title: "Degrees and radians", lesson: 4,
      gen: function (R) {
        var d = R.pick([30, 45, 60, 90, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
        if (R.chance(0.5)) {
          var cand = [d + 30, d - 30, 360 - d, 180 - d, d + 15].filter(function (x) { return x > 0 && x < 360 && x !== d; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 3);
          return mc(R, { prompt: "Convert $" + d + "^\\circ$ to radians.", right: "$" + radTex(d) + "$", wrong: cand.map(function (x) { return { t: "$" + radTex(x) + "$", fb: "Multiply by $\\frac{\\pi}{180}$: $\\frac{" + d + "\\pi}{180}$, then reduce." }; }), keep: true, hints: ["$d \\cdot \\frac{\\pi}{180}$."], why: "$\\frac{" + d + "\\pi}{180} = " + radTex(d) + "$." });
        }
        return { type: "num", prompt: "Convert $" + radTex(d) + "$ radians to degrees.", pre: "degrees =", post: "°", answer: d, near: near(d, [{ v: Math.round(d * Math.PI / 180 * 100) / 100, tol: 0.01, fb: "That multiplied by $\\frac{\\pi}{180}$ instead of $\\frac{180}{\\pi}$. Replace $\\pi$ by 180°." }]), hints: ["Replace $\\pi$ with $180^\\circ$."], why: "$" + radTex(d) + " = " + d + "^\\circ$." };
      } },
    { id: "pc5-coterm", title: "Coterminal angles", lesson: 5,
      gen: function (R) {
        var base = R.int(1, 35) * 10, k = R.pick([-3, -2, -1, 1, 2, 3]), d = base + 360 * k;
        return { type: "num", prompt: "Find the angle between $0^\\circ$ and $360^\\circ$ that is coterminal with $" + d + "^\\circ$.", pre: "$\\theta =$", post: "degrees", answer: base,
          near: near(base, [{ v: base + (k > 0 ? 360 : -360), fb: "That is still outside $0^\\circ$ to $360^\\circ$. " + (k > 0 ? "Subtract" : "Add") + " another full turn." }, { v: 360 - base, fb: "Do not reflect: add or subtract whole turns of $360^\\circ$." }]),
          hints: [(k > 0 ? "Subtract" : "Add") + " $360^\\circ$ " + Math.abs(k) + " time" + (Math.abs(k) === 1 ? "" : "s") + "."], why: "$" + d + " " + (k > 0 ? "-" : "+") + " " + 360 * Math.abs(k) + " = " + base + "$." };
      } },
    { id: "pc5-arc", title: "Arc length and sector area", lesson: 6,
      gen: function (R) {
        var r = R.int(3, 12), d = R.pick([30, 45, 60, 90, 120, 150, 180]), th = d * Math.PI / 180;
        if (R.chance(0.5)) { var s = Math.round(r * th * 100) / 100; return { type: "num", prompt: "Find the arc length of a sector with radius " + r + " and angle $" + d + "^\\circ$, to 2 decimal places. (Type " + r + "*" + d + "*pi/180.)", pre: "$s \\approx$", answer: s, tol: 0.006, calc: true, near: near(s, [{ v: r * d, fb: "Convert the angle to radians first: the formula $s = r\\theta$ needs radians." }]), hints: ["$\\theta = \\frac{" + d + "\\pi}{180}$, then $s = r\\theta$."], why: "$" + r + " \\cdot " + radTex(d) + " \\approx " + s + "$." }; }
        var A = Math.round(0.5 * r * r * th * 100) / 100;
        return { type: "num", prompt: "Find the area of a sector with radius " + r + " and angle $" + d + "^\\circ$, to 2 decimal places. (Type 0.5*" + r + "^2*" + d + "*pi/180.)", pre: "$A \\approx$", answer: A, tol: 0.006, calc: true, near: near(A, [{ v: Math.round(r * th * 100) / 100, tol: 0.006, fb: "That is the arc length. The area is $\\frac{1}{2}r^2\\theta$." }]), hints: ["$A = \\frac{1}{2}r^2\\theta$ with $\\theta$ in radians."], why: "$\\frac{1}{2} \\cdot " + r * r + " \\cdot " + radTex(d) + " \\approx " + A + "$." };
      } },
    { id: "pc5-speed", title: "Angular and linear speed", lesson: 7,
      gen: function (R) {
        var r = R.pick([0.25, 0.5, 2, 3, 5, 10, 20]), k = R.int(2, 6), v = Math.round(r * k * 2 * Math.PI * 100) / 100;
        return { type: "num", prompt: "A wheel of radius " + r + " m turns " + k + " times every second. How fast does a point on its rim move, to 2 decimal places? (Type " + r + "*" + k + "*2*pi.)", pre: "$v \\approx$", post: "m/s", answer: v, tol: 0.006, calc: true,
          near: near(v, [{ v: r * k, fb: "Each turn is $2\\pi$ radians: $\\omega = " + k + " \\cdot 2\\pi$, then $v = r\\omega$." }]),
          hints: ["$\\omega = " + k + " \\cdot 2\\pi$, then $v = r\\omega$."], why: "$" + r + " \\cdot " + 2 * k + "\\pi \\approx " + v + "$ m/s." };
      } },
    { id: "pc5-ucircle", title: "Cosine and sine from a point on the unit circle", lesson: 8,
      gen: function (R) {
        var T = R.pick(TRIPLES5), a = R.pick([0, 1]) ? T[0] : T[1], b = a === T[0] ? T[1] : T[0], c = T[2], sx = R.pick([-1, 1]), sy = R.pick([-1, 1]), ask = R.pick(["cos", "sin"]);
        var x = sx * a, y = sy * b, ans = (ask === "cos" ? x : y) / c, q = sx > 0 ? (sy > 0 ? "I" : "IV") : (sy > 0 ? "II" : "III");
        return { type: "num", prompt: "The point $\\left(" + ratTex(x, c) + ",\\ " + ratTex(y, c) + "\\right)$ is on the unit circle at angle $\\theta$. Find $\\" + ask + "\\theta$. (A fraction like " + x + "/" + c + " is fine.)", pre: "$\\" + ask + "\\theta =$", answer: ans, tol: 0.001,
          near: near(ans, [{ v: (ask === "cos" ? y : x) / c, tol: 0.001, fb: "Cosine is the $x$-coordinate and sine is the $y$-coordinate." }, { v: -ans, tol: 0.001, fb: "Check the sign: the point is in quadrant " + q + "." }]),
          hints: ["$(x, y) = (\\cos\\theta, \\sin\\theta)$."], why: "$\\" + ask + "\\theta = " + ratTex(ask === "cos" ? x : y, c) + "$." };
      } },
    { id: "pc5-pyth", title: "The Pythagorean identity", lesson: 9,
      gen: function (R) {
        var T = R.pick(TRIPLES5), a = T[0], b = T[1], c = T[2], q = R.int(1, 4), sx = (q === 1 || q === 4) ? 1 : -1, sy = (q === 1 || q === 2) ? 1 : -1, givenSin = R.chance(0.5);
        var gv = givenSin ? sy * b : sx * b, ansN = givenSin ? sx * a : sy * a;
        var ans = ansN / c, gname = givenSin ? "sin" : "cos", aname = givenSin ? "cos" : "sin";
        return { type: "num", prompt: "$\\" + gname + "\\theta = " + ratTex(gv, c) + "$ and $\\theta$ is in quadrant " + ROM[q] + ". Find $\\" + aname + "\\theta$. (A fraction like " + ansN + "/" + c + " is fine.)", pre: "$\\" + aname + "\\theta =$", answer: ans, tol: 0.001,
          near: near(ans, [{ v: -ans, tol: 0.001, fb: "Take the sign from the quadrant: " + (aname === "cos" ? "$x$" : "$y$") + " is " + (ans > 0 ? "positive" : "negative") + " in quadrant " + ROM[q] + "." }, { v: 1 - Math.abs(gv / c), tol: 0.001, fb: "The identity uses squares: $\\" + aname + "^2\\theta = 1 - \\" + gname + "^2\\theta$." }]),
          hints: ["$\\cos^2\\theta + \\sin^2\\theta = 1$, then choose the sign."], why: "$\\" + aname + "^2\\theta = 1 - \\left(" + ratTex(Math.abs(gv), c) + "\\right)^2$, so $\\" + aname + "\\theta = " + ratTex(ansN, c) + "$." };
      } },
    { id: "pc5-special", title: "Exact values at 30°, 45° and 60°", lesson: 10,
      gen: function (R) {
        var d = R.pick([30, 45, 60]), f = R.pick(["sin", "cos"]), v = SPEC5[d][f === "sin" ? 0 : 1], all = ["\\frac{1}{2}", "\\frac{\\sqrt{2}}{2}", "\\frac{\\sqrt{3}}{2}", "1"];
        if (R.chance(0.4)) {
          var angs = [30, 45, 60, 90].filter(function (a) { return a !== d; });
          return mc(R, { prompt: "$\\" + f + "\\theta = " + v + "$ and $\\theta$ is acute. What is $\\theta$?", right: d + "°",
            wrong: angs.slice(0, 3).map(function (a) { return { t: a + "°", fb: "At $" + a + "^\\circ$: $\\sin = " + (a === 90 ? "1" : SPEC5[a][0]) + "$ and $\\cos = " + (a === 90 ? "0" : SPEC5[a][1]) + "$." }; }), keep: true,
            hints: ["Which special angle has that value of $\\" + f + "$?"], why: "$\\" + f + " " + d + "^\\circ = " + v + "$." });
        }
        return mc(R, { prompt: "What is $\\" + f + " " + d + "^\\circ$?", right: "$" + v + "$",
          wrong: all.filter(function (t) { return t !== v; }).slice(0, 3).map(function (t) { return { t: "$" + t + "$", fb: "At $" + d + "^\\circ$: $\\sin = " + SPEC5[d][0] + "$ and $\\cos = " + SPEC5[d][1] + "$." }; }), keep: true,
          hints: ["Use the $30^\\circ$-$60^\\circ$-$90^\\circ$ and $45^\\circ$-$45^\\circ$-$90^\\circ$ triangles."], why: "$\\" + f + " " + d + "^\\circ = " + v + "$." });
      } },
    { id: "pc5-refangle", title: "Reference angles", lesson: 11,
      gen: function (R) {
        var ref = R.pick([20, 30, 35, 40, 45, 50, 60, 70]), q = R.int(1, 4), base = q === 1 ? ref : q === 2 ? 180 - ref : q === 3 ? 180 + ref : 360 - ref, k = R.pick([0, 0, 1, -1, 2]), d = base + 360 * k;
        return { type: "num", prompt: "Find the reference angle of $" + d + "^\\circ$.", pre: "reference angle =", post: "degrees", answer: ref,
          near: near(ref, [{ v: base, fb: "First reduce to $0^\\circ$-$360^\\circ$; then subtract from $180^\\circ$ or $360^\\circ$, or from the angle, as the quadrant says." }, { v: 90 - ref, fb: "A reference angle is measured from the **$x$-axis**, not from the $y$-axis." }].filter(function (o) { return o.v > 0; })),
          hints: ["Reduce to between 0° and 360°, find the quadrant, then subtract."], why: "$" + d + "^\\circ \\sim " + base + "^\\circ$, in quadrant " + ROM[q] + ": reference angle $" + ref + "^\\circ$." };
      } },
    { id: "pc5-cossin", title: "Exact sine and cosine in any quadrant", lesson: 12,
      gen: function (R) {
        var ref = R.pick([30, 45, 60]), q = R.int(2, 4), d = q === 2 ? 180 - ref : q === 3 ? 180 + ref : 360 - ref, f = R.pick(["sin", "cos"]), mag = SPEC5[ref][f === "sin" ? 0 : 1];
        var sgn = f === "sin" ? (q === 2 ? 1 : -1) : (q === 4 ? 1 : -1), right = (sgn < 0 ? "-" : "") + mag, ALL = ["\\frac{1}{2}", "\\frac{\\sqrt{2}}{2}", "\\frac{\\sqrt{3}}{2}"];
        var other = ALL.filter(function (t) { return t !== mag; })[0];
        return mc(R, { prompt: "What is $\\" + f + " " + d + "^\\circ$?", right: "$" + right + "$",
          wrong: [{ t: "$" + (sgn < 0 ? "" : "-") + mag + "$", fb: "The size $" + mag + "$ is right, but check the sign: $" + d + "^\\circ$ is in quadrant " + ROM[q] + ", where " + (f === "sin" ? "$y$" : "$x$") + " is " + (sgn < 0 ? "negative" : "positive") + "." }, { t: "$" + (sgn < 0 ? "-" : "") + other + "$", fb: "The reference angle is $" + ref + "^\\circ$: $\\" + f + " " + ref + "^\\circ = " + mag + "$." }, { t: "$" + (sgn < 0 ? "" : "-") + other + "$", fb: "Use the reference angle $" + ref + "^\\circ$ for the size, and the quadrant for the sign." }], keep: true,
          hints: ["Reference angle $" + ref + "^\\circ$, quadrant " + ROM[q] + "."], why: "$\\" + f + " " + d + "^\\circ = " + right + "$." });
      } },
    { id: "pc5-six", title: "Tangent, secant, cosecant and cotangent", lesson: 13,
      gen: function (R) {
        var T = R.pick(TRIPLES5), a = T[0], b = T[1], c = T[2], sw = R.chance(0.5), xa = sw ? a : b, ya = sw ? b : a, sx = R.pick([-1, 1]), sy = R.pick([-1, 1]), x = sx * xa, y = sy * ya, f = R.pick(["tan", "cot", "sec", "csc"]);
        var ans = f === "tan" ? y / x : f === "cot" ? x / y : f === "sec" ? c / x : c / y, expr = f === "tan" ? "y/x" : f === "cot" ? "x/y" : f === "sec" ? "1/x" : "1/y";
        var text = f === "tan" ? "\\frac{y}{x}" : f === "cot" ? "\\frac{x}{y}" : f === "sec" ? "\\frac{1}{x}" : "\\frac{1}{y}";
        var wrongv = f === "tan" ? x / y : f === "cot" ? y / x : f === "sec" ? c / y : c / x;
        return { type: "num", prompt: "The point $\\left(" + ratTex(x, c) + ",\\ " + ratTex(y, c) + "\\right)$ is on the unit circle at angle $\\theta$. Find $\\" + f + "\\theta = " + text + "$. (A fraction is fine.)", pre: "$\\" + f + "\\theta =$", answer: ans, tol: 0.001,
          near: near(ans, [{ v: wrongv, tol: 0.001, fb: "Check which coordinate goes where: $\\" + f + "\\theta = " + text + "$." }, { v: -ans, tol: 0.001, fb: "Check the signs: $x = " + ratTex(x, c) + "$ and $y = " + ratTex(y, c) + "$." }]),
          hints: ["$" + text + "$ with $x = " + ratTex(x, c) + "$, $y = " + ratTex(y, c) + "$."], why: "$\\" + f + "\\theta = " + text + " \\approx " + nm(f4(ans, 3)) + "$." };
      } },
    { id: "pc5-sign", title: "The sign of a trigonometric function", lesson: 14,
      gen: function (R) {
        var f = R.pick(["sin", "cos", "tan", "csc", "sec", "cot"]), q = R.int(1, 4), d = [0, 25, 115, 205, 295][q] + R.pick([0, 10, 20, 30]), pos = SGN13[f][q - 1] > 0;
        return mc(R, { prompt: "Is $\\" + f + " " + d + "^\\circ$ positive or negative?", right: pos ? "Positive" : "Negative",
          wrong: [{ t: pos ? "Negative" : "Positive", fb: "$" + d + "^\\circ$ is in quadrant " + ROM[q] + ". " + ({ 1: "In quadrant I all six are positive.", 2: "In quadrant II only sine and cosecant are positive.", 3: "In quadrant III only tangent and cotangent are positive.", 4: "In quadrant IV only cosine and secant are positive." })[q] }], keep: true,
          hints: ["All Students Take Calculus."], why: "Quadrant " + ROM[q] + ": " + (pos ? "positive" : "negative") + "." });
      } },
    { id: "pc5-sohcahtoa", title: "Ratios in a right triangle", lesson: 15,
      gen: function (R) {
        var T = R.pick(TRIPLES5), o = R.pick([0, 1]) ? T[0] : T[1], a = o === T[0] ? T[1] : T[0], h = T[2], f = R.pick(["sin", "cos", "tan"]);
        var val = f === "sin" ? [o, h] : f === "cos" ? [a, h] : [o, a], right = "$\\frac{" + val[0] + "}{" + val[1] + "}$", names = ["sin", "cos", "tan"];
        var ALL = [[o, h], [a, h], [o, a], [h, o], [a, o]].map(function (p) { return "$\\frac{" + p[0] + "}{" + p[1] + "}$"; }).filter(function (t, i, arr) { return arr.indexOf(t) === i && t !== right; }).slice(0, 3);
        return mc(R, { prompt: "In a right triangle the side opposite angle $A$ is " + o + ", the side adjacent to $A$ is " + a + " and the hypotenuse is " + h + ". Which is $\\" + f + " A$?", right: right,
          wrong: ALL.map(function (t) { return { t: t, fb: "SOH-CAH-TOA: $\\sin A = \\frac{O}{H}$, $\\cos A = \\frac{A}{H}$, $\\tan A = \\frac{O}{A}$." }; }), keep: true,
          hints: ["SOH-CAH-TOA."], why: "$\\" + f + " A = " + right.slice(1, -1) + "$." });
      } },
    { id: "pc5-solvetri", title: "Find a side of a right triangle", lesson: 16,
      gen: function (R) {
        var A = R.pick([20, 25, 30, 35, 40, 50, 55, 65]), H = R.int(5, 20), t = R.int(0, 2), a = A * Math.PI / 180;
        if (t === 0) { var o = Math.round(H * Math.sin(a) * 100) / 100; return { type: "num", prompt: "A right triangle has hypotenuse " + H + " and an angle $A = " + A + "^\\circ$. How long is the side **opposite** $A$? (Type " + H + "*sin(" + A + "°).)", pre: "$O \\approx$", answer: o, tol: 0.006, calc: true, near: near(o, [{ v: Math.round(H * Math.cos(a) * 100) / 100, tol: 0.006, fb: "That is the **adjacent** side, $H\\cos A$. Opposite is $H\\sin A$." }]), hints: ["$\\sin A = \\frac{O}{H}$."], why: "$" + H + "\\sin " + A + "^\\circ \\approx " + o + "$." }; }
        if (t === 1) { var ad = Math.round(H * Math.cos(a) * 100) / 100; return { type: "num", prompt: "A right triangle has hypotenuse " + H + " and an angle $A = " + A + "^\\circ$. How long is the side **adjacent** to $A$? (Type " + H + "*cos(" + A + "°).)", pre: "adj $\\approx$", answer: ad, tol: 0.006, calc: true, near: near(ad, [{ v: Math.round(H * Math.sin(a) * 100) / 100, tol: 0.006, fb: "That is the **opposite** side, $H\\sin A$. Adjacent is $H\\cos A$." }]), hints: ["$\\cos A = \\frac{\\text{adj}}{H}$."], why: "$" + H + "\\cos " + A + "^\\circ \\approx " + ad + "$." }; }
        var adj = H, hyp = Math.round(adj / Math.cos(a) * 100) / 100; return { type: "num", prompt: "In a right triangle the side **adjacent** to $A = " + A + "^\\circ$ is " + adj + ". How long is the hypotenuse? (Type " + adj + "/cos(" + A + "°).)", pre: "$H \\approx$", answer: hyp, tol: 0.006, calc: true, near: near(hyp, [{ v: Math.round(adj * Math.cos(a) * 100) / 100, tol: 0.006, fb: "The unknown is on the **bottom** of $\\cos A = \\frac{\\text{adj}}{H}$: divide." }]), hints: ["$H = \\frac{\\text{adj}}{\\cos A}$."], why: "$\\frac{" + adj + "}{\\cos " + A + "^\\circ} \\approx " + hyp + "$." };
      } },
    { id: "pc5-elev", title: "Angles of elevation", lesson: 17,
      gen: function (R) {
        var d = R.pick([20, 30, 40, 50, 80]), A = R.pick([20, 25, 30, 35, 40, 50, 55]), h = Math.round(d * Math.tan(A * Math.PI / 180) * 100) / 100;
        if (R.chance(0.6)) return { type: "num", prompt: "You stand " + d + " m from a building. The angle of elevation to its top is $" + A + "^\\circ$. How tall is the building (ignore your height)? (Type " + d + "*tan(" + A + "°).)", pre: "$h \\approx$", post: "m", answer: h, tol: 0.006, calc: true, near: near(h, [{ v: Math.round(d / Math.tan(A * Math.PI / 180) * 100) / 100, tol: 0.006, fb: "Height is the **opposite** side: $h = d\\tan A$, not $\\frac{d}{\\tan A}$." }]), hints: ["$\\tan A = \\frac{h}{d}$."], why: "$" + d + "\\tan " + A + "^\\circ \\approx " + h + "$ m." };
        var ang = Math.round(Math.atan(h / d) * 180 / Math.PI * 100) / 100; return { type: "num", prompt: "A tree is " + h + " m tall and you stand " + d + " m from it. What is the angle of elevation to its top, in degrees? (Type arctan(" + h + "/" + d + ")*180/pi.)", pre: "$\\theta \\approx$", post: "degrees", answer: ang, tol: 0.006, calc: true, near: near(ang, [{ v: Math.round((90 - ang) * 100) / 100, tol: 0.006, fb: "That is the other acute angle. The elevation is measured at your feet, from the horizontal." }]), hints: ["$\\tan\\theta = \\frac{h}{d}$."], why: "$\\tan^{-1}\\left(\\frac{" + h + "}{" + d + "}\\right) \\approx " + ang + "^\\circ$." };
      } }
  ];
  L.unit("precalc", 5, {
    title: "Trigonometric Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Angles, radians, degrees and coterminal angles.", skills: ["pc5-quad", "pc5-radian", "pc5-convert", "pc5-coterm"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Arc length, sector area and circular motion.", skills: ["pc5-arc", "pc5-speed"], per: 2 },
      { title: "Quiz 3", after: 12, blurb: "The unit circle, special angles, reference angles and exact values.", skills: ["pc5-ucircle", "pc5-pyth", "pc5-special", "pc5-refangle", "pc5-cossin"], per: 2 },
      { title: "Quiz 4", after: 14, blurb: "All six trigonometric functions and their signs.", skills: ["pc5-six", "pc5-sign"], per: 2 },
      { title: "Quiz 5", after: 17, blurb: "Right triangles: ratios, missing sides and angles of elevation.", skills: ["pc5-sohcahtoa", "pc5-solvetri", "pc5-elev"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:5", {
    2: { name: "Angles in standard position", frame: "An angle in standard position has its vertex at the [[origin]] and its initial side on the positive [[$x$-axis]]. A [[positive]] angle turns counterclockwise and a negative angle turns [[clockwise]]. The quadrants are [[90°]] wide.",
         chips: ["$y$-axis", "negative"], fb: { "$y$-axis": "The initial side is on the positive $x$-axis.", "negative": "Positive angles turn counterclockwise." } },
    3: { name: "Radians", frame: "An angle of $\\theta$ radians cuts off an arc of length $s = r\\theta$, so $\\theta =$ [[$\\frac{s}{r}$]]. A full turn is [[$2\\pi$]] radians and a half turn is [[$\\pi$]]. One radian is about [[57.3°]].",
         chips: ["$\\frac{r}{s}$", "360"], fb: { "$\\frac{r}{s}$": "Arc over radius: $\\theta = \\frac{s}{r}$.", "360": "A full turn is $2\\pi$ radians; 360 is its size in degrees." } },
    4: { name: "Degrees and radians", frame: "$\\pi$ radians $=$ [[$180^\\circ$]]. Degrees to radians: multiply by [[$\\frac{\\pi}{180}$]]. Radians to degrees: multiply by [[$\\frac{180}{\\pi}$]]. For example $\\frac{\\pi}{6} =$ [[$30^\\circ$]].",
         chips: ["$360^\\circ$", "$\\frac{\\pi}{90}$"], fb: { "$360^\\circ$": "$2\\pi$ radians is $360^\\circ$; $\\pi$ is $180^\\circ$.", "$\\frac{\\pi}{90}$": "The factor is $\\frac{\\pi}{180}$." } },
    5: { name: "Coterminal angles", frame: "Coterminal angles share a [[terminal side]]. They differ by whole [[turns]]: add or subtract [[$360^\\circ$]] (or $2\\pi$) until the angle is in the range $0^\\circ \\le \\theta <$ [[$360^\\circ$]].",
         chips: ["initial side", "$180^\\circ$"], fb: { "initial side": "All angles in standard position share the initial side. Coterminal means the same **terminal** side.", "$180^\\circ$": "A half turn changes the side; a full turn does not." } },
    6: { name: "Arc length and sector area", frame: "With $\\theta$ in [[radians]]: arc length $s =$ [[$r\\theta$]] and sector area $A =$ [[$\\frac{1}{2}r^2\\theta$]]. If the angle is in degrees, [[convert]] it first.",
         chips: ["degrees", "$\\pi r^2\\theta$"], fb: { "degrees": "The formulas need radians.", "$\\pi r^2\\theta$": "$\\pi r^2$ is a whole circle. A sector is $\\frac{1}{2}r^2\\theta$." } },
    7: { name: "Angular and linear speed", frame: "Angular speed $\\omega =$ [[$\\frac{\\theta}{t}$]], in radians per unit time. Linear speed $v =$ [[$r\\omega$]]. Points farther from the centre have the same $\\omega$ but a greater [[linear]] speed.",
         chips: ["$\\frac{r}{\\omega}$", "angular"], fb: { "$\\frac{r}{\\omega}$": "Speed grows with the radius: $v = r\\omega$.", "angular": "On one wheel the angular speed is the same everywhere; it is the linear speed that grows." } },
    8: { name: "The unit circle", frame: "On the unit circle the point at angle $\\theta$ is $(x, y) = ($[[$\\cos\\theta$]], [[$\\sin\\theta$]]$)$. Because the point is on the circle, $x^2 + y^2 =$ [[1]].",
         chips: ["$\\tan\\theta$", "2"], fb: { "$\\tan\\theta$": "The coordinates are cosine and sine.", "2": "$x^2 + y^2 = 1$ for a circle of radius 1." } },
    9: { name: "Pythagorean identity", frame: "$\\cos^2\\theta + \\sin^2\\theta =$ [[1]]. Given one value, solve for the other, which gives two [[roots]], and choose the sign from the [[quadrant]]. On an axis, one coordinate is 0 and the other is [[$\\pm 1$]].",
         chips: ["$\\tan\\theta$", "positive"], fb: { "$\\tan\\theta$": "The identity is about cosine and sine.", "positive": "The sign depends on the quadrant, not always positive." } },
    10: { name: "Special angles", frame: "$\\sin 30^\\circ =$ [[$\\frac{1}{2}$]], $\\sin 45^\\circ =$ [[$\\frac{\\sqrt{2}}{2}$]], $\\sin 60^\\circ =$ [[$\\frac{\\sqrt{3}}{2}$]]. The cosines run the [[other]] way: $\\cos 30^\\circ = \\frac{\\sqrt{3}}{2}$, $\\cos 60^\\circ = \\frac{1}{2}$.",
          chips: ["$1$", "same"], fb: { "$1$": "$\\sin 90^\\circ = 1$; 60° is not that high.", "same": "Sine and cosine swap for 30° and 60°." } },
    11: { name: "Reference angles", frame: "The reference angle is the [[acute]] angle between the terminal side and the [[$x$-axis]]. In quadrant II it is $180^\\circ - \\theta$; in III, $\\theta -$ [[$180^\\circ$]]; in IV, [[$360^\\circ$]]$ - \\theta$.",
          chips: ["$y$-axis", "obtuse"], fb: { "$y$-axis": "Always measure from the $x$-axis.", "obtuse": "A reference angle is acute (at most 90°)." } },
    12: { name: "Sine and cosine in every quadrant", frame: "Find the [[reference angle]], take its cosine and sine, then give each its [[sign]] from the quadrant: $x$ is positive in quadrants [[I and IV]] and $y$ is positive in [[I and II]].",
          chips: ["radius", "II and III"], fb: { "radius": "The reference angle gives the size; the quadrant gives the sign.", "II and III": "$x$ is positive on the right: I and IV." } },
    13: { name: "Tangent, secant, cosecant, cotangent", frame: "$\\tan\\theta =$ [[$\\frac{y}{x}$]], $\\cot\\theta =$ [[$\\frac{x}{y}$]], $\\sec\\theta =$ [[$\\frac{1}{x}$]], $\\csc\\theta =$ [[$\\frac{1}{y}$]]. A value is [[undefined]] when the bottom is 0.",
          chips: ["$\\frac{x}{y}$ for tan", "zero"], fb: { "$\\frac{x}{y}$ for tan": "Tangent is $\\frac{y}{x}$; cotangent is $\\frac{x}{y}$.", "zero": "Division by zero is undefined, not zero." } },
    14: { name: "Signs in the quadrants", frame: "All Students Take Calculus: quadrant I has [[all]] positive, II only [[sine]] (and cosecant), III only [[tangent]] (and cotangent), IV only [[cosine]] (and secant). Cosine and secant are [[even]]; the other four are odd.",
          chips: ["cosine in II", "odd"], fb: { "cosine in II": "Cosine is negative in II.", "odd": "Cosine and secant are even; sine, tangent, cosecant, cotangent are odd." } },
    15: { name: "SOH-CAH-TOA", frame: "In a right triangle: $\\sin A =$ [[$\\frac{\\text{opp}}{\\text{hyp}}$]], $\\cos A =$ [[$\\frac{\\text{adj}}{\\text{hyp}}$]], $\\tan A =$ [[$\\frac{\\text{opp}}{\\text{adj}}$]]. The ratios depend only on the [[angle]], not on the size of the triangle.",
          chips: ["$\\frac{\\text{hyp}}{\\text{opp}}$", "size"], fb: { "$\\frac{\\text{hyp}}{\\text{opp}}$": "That is the cosecant. Sine is opposite over hypotenuse.", "size": "Similar triangles share their ratios." } },
    16: { name: "Solving right triangles", frame: "To find a [[side]], pick the ratio that links it to a known side and angle. To find an [[angle]], use the [[inverse]] function ($\\sin^{-1}$, $\\cos^{-1}$, $\\tan^{-1}$). Keep the calculator in [[degree]] mode.",
          chips: ["radian", "guess"], fb: { "radian": "Use degree mode for angles in degrees.", "guess": "Choose the ratio and solve." } },
    17: { name: "Elevation and depression", frame: "The angle of [[elevation]] is measured up from the [[horizontal]]; the angle of [[depression]] is measured down from it. A height is [[distance]] times $\\tan$ of the elevation.",
          chips: ["vertical", "sine"], fb: { "vertical": "Both angles are measured from the horizontal.", "sine": "Height over horizontal distance is a tangent." } }
  });
})();
