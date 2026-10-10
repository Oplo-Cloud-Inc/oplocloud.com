/* ==========================================================================
   Precalculus — Unit 12: Introduction to Calculus. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 12: limits found from a table and a graph,
   the properties of limits and the 0/0 cases, continuity, and the derivative as an
   instantaneous rate of change and the slope of a tangent line. Each section is split
   into lessons small enough to finish in one sitting; each teaches one method: the
   idea, an example to watch, one done together, then on your own, a harder case, find
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
    blurb: "Before Chapter 12 · Evaluating a function, factoring, slope, cancelling a factor and expanding $(x + h)^2$.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Function", prompt: "If $f(x) = x^2 + 1$, what is $f(3)$?", pre: "$f(3) =$", answer: 10, skill: "Evaluate a function", near: [{ v: 7, fb: "Square first: $3^2 = 9$, then add 1." }, { v: 16, fb: "$x^2$ means $3 \\cdot 3$, not $(3 + 1)^2$." }], hints: ["$9 + 1$."], why: "$f(3) = 10$." },
      { type: "choice", kicker: "Check 2 · Factor", prompt: "Factor $x^2 - 9$.",
        options: [{ t: "$(x - 3)(x + 3)$" }, { t: "$(x - 3)^2$", fb: "$(x - 3)^2 = x^2 - 6x + 9$. A difference of squares factors into a plus and a minus." }, { t: "$(x - 9)(x + 1)$", fb: "Multiply it back: $x^2 - 8x - 9$." }],
        answer: 0, skill: "Difference of squares", hints: ["$a^2 - b^2 = (a - b)(a + b)$."], why: "$(x - 3)(x + 3)$." },
      { type: "num", kicker: "Check 3 · Slope", prompt: "What is the slope of the line through $(1, 2)$ and $(3, 8)$?", pre: "slope =", answer: 3, skill: "Slope", near: [{ v: 6, fb: "That is the rise. Divide by the run: $\\frac{6}{2}$." }, { v: 0.3333, tol: 0.001, fb: "Rise over run, not run over rise." }], hints: ["$\\frac{8 - 2}{3 - 1}$."], why: "$\\frac{6}{2} = 3$." },
      { type: "choice", kicker: "Check 4 · Cancel", prompt: "Simplify $\\dfrac{x^2 - 4}{x - 2}$ for $x \\ne 2$.",
        options: [{ t: "$x + 2$" }, { t: "$x - 2$", fb: "$x^2 - 4 = (x - 2)(x + 2)$: the $(x - 2)$ cancels and $(x + 2)$ is left." }, { t: "$x^2 - 2$", fb: "You cannot cancel the $x$s: factor the top first." }],
        answer: 0, skill: "Cancelling factors", hints: ["Factor the top."], why: "$\\frac{(x - 2)(x + 2)}{x - 2} = x + 2$." },
      { type: "choice", kicker: "Check 5 · Expand", prompt: "Expand $(x + h)^2$.",
        options: [{ t: "$x^2 + 2xh + h^2$" }, { t: "$x^2 + h^2$", fb: "Do not forget the middle term: $(x + h)(x + h)$ has $xh + hx$." }, { t: "$x^2 + 2h$", fb: "Multiply out all four products." }],
        answer: 0, skill: "Squaring a binomial", hints: ["$(x + h)(x + h)$."], why: "$x^2 + 2xh + h^2$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 12.1**. If **check 1** slipped, look again at lesson 1.2. If **check 3** slipped, revisit lesson 2.2. If **check 2** or **4** slipped, lesson 3.7 factors quadratics.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 12 */
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 3 : d); return Math.round(v * k) / k; };
  var HS = [1, 0.5, 0.2, 0.1, 0.01];

  /* ============================================ 1 · What a limit is: tables of values */
  var HOW_1 = [["Pick inputs", "Choose $x$ values closer and closer to $a$, from both sides."],
               ["Evaluate", "Work out $f(x)$ for each one."],
               ["Read", "If both sides head for the same number $L$, that is the limit."]];
  var G1 = function (k) {
    var f = function (x) { return x + 2; }, it = curve(f, 0, 4, "blue", [0, 7]).concat(hole(2, 4, "blue"));
    if (k >= 2) [1.9, 1.99, 2.01, 2.1].forEach(function (x) { it.push(dot(x, f(x), "orange")); });
    if (k >= 3) it.push({ seg: [[0, 4], [4, 4]], c: "green", dash: true });
    return grid("The graph of (x squared minus 4) over (x minus 2), a line with a hole at (2, 4)" + (k >= 2 ? ", with points on both sides of x = 2" : "") + (k >= 3 ? " and the height 4 they approach" : "") + ".", it, { x: [0, 4], y: [0, 7], u: 40, gx: 1, step: 1, gy: 1, stepY: 1 });
  };
  LESSONS.push({
    title: "What a limit is", art: "pclim",
    blurb: "Book 12.1 · $\\lim_{x \\to a} f(x) = L$ says $f(x)$ gets as close to $L$ as you like when $x$ is close to $a$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $f(x) = \\dfrac{x^2 - 9}{x - 3}$, what is $f(4)$?", pre: "$f(4) =$", answer: 7, skill: "Evaluate a function", near: [{ v: 16, fb: "$4^2 - 9 = 7$ and $4 - 3 = 1$: divide." }, { v: 5, fb: "$\\frac{16 - 9}{4 - 3}$." }], hints: ["$\\frac{16 - 9}{1}$."], why: "$7$." },
      { type: "learn", kicker: "Explore",
        prompt: "The function is $f(x) = \\dfrac{x^2 - 9}{x - 3}$: it is **undefined at $x = 3$**, so the graph has a hole there. Slide $x$ closer and closer to 3 from the **left** and from the **right**. What does $f(x)$ head for?",
        scene: { type: "sketch", x: [0, 6], y: [0, 9], u: 50, uy: 30, gx: 1, step: 1, gy: 1, stepY: 1, w: 348, gate: true, pts: {},
          chips: { s: { label: "Approach", v: "l", opts: [["l", "from the left"], ["r", "from the right"]] } },
          params: { k: { min: 1, max: 5, step: 1, v: 1, label: "closeness" } },
          track: function (s) { return s.p.k === 5 ? "k" + s.c.s : null; },
          draw: function (s) { var h = HS[s.p.k - 1], x = s.c.s === "l" ? 3 - h : 3 + h, y = x + 3; return curve(function (t) { return t + 3; }, 0, 6, "blue", [0, 9]).concat([hole(3, 6, "blue"), { seg: [[x, 0], [x, y]], c: "soft", dash: true }, { seg: [[0, y], [x, y]], c: "soft", dash: true }, dot(x, y, "orange")]); },
          readout: function (s) { var h = HS[s.p.k - 1], x = s.c.s === "l" ? 3 - h : 3 + h; return "$x = " + nm(f4(x, 3)) + "$: $f(x) = \\frac{x^2 - 9}{x - 3} = " + nm(f4(x + 3, 3)) + "$<br>Left done: " + (s.tracked.kl ? "✓" : "—") + " · right done: " + (s.tracked.kr ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.kl && s.tracked.kr); } },
        gate: true, then: "From both sides $f(x)$ gets closer and closer to **6**, even though $f(3)$ itself does not exist. We write $\\displaystyle\\lim_{x \\to 3}\\frac{x^2 - 9}{x - 3} = 6$. A **limit** asks what value the outputs approach as $x$ approaches $a$, **not** what happens at $a$." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\displaystyle\\lim_{x \\to a} f(x) = L$ means $f(x)$ gets as close to $L$ as we like when $x$ is close to $a$ (but not equal to it). From a **table**, take $x$ on **both** sides of $a$ and see where the outputs head. $f(a)$ itself does not matter.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Estimate $\\displaystyle\\lim_{x \\to 2}\\frac{x^2 - 4}{x - 2}$ with a table.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "x = 1.9,\\ 1.99,\\ 2.01,\\ 2.1", say: "Two values just below 2 and two just above." },
          { step: 2, m: "f(1.9) = 3.9,\\ f(1.99) = 3.99", say: "From the left the outputs climb towards 4.", fig: G1(2) },
          { step: 2, m: "f(2.01) = 4.01,\\ f(2.1) = 4.1", say: "From the right they come down towards 4.", ask: { prompt: "Do both sides head for the same number?", answer: 0, options: [{ t: "Yes: 4" }, { t: "No", fb: "3.9, 3.99 and 4.01, 4.1 all squeeze in on 4." }] } },
          { step: 3, m: "\\lim_{x \\to 2} f(x) = 4", say: "Both sides agree. Notice $f(2)$ is undefined, and the limit still exists.", fig: G1(3) }] },
        gate: true, then: "The limit is $4$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you estimate $\\displaystyle\\lim_{x \\to 5}\\frac{x^2 - 25}{x - 5}$.",
        how: HOW_1, skill: "Limits from a table",
        steps: [
          { step: 1, ask: "We try $x = 4.9$ and $x = 5.1$: one on each side of 5. Which $x$ value is **on the left**?", type: "choice", answer: 0, options: [{ t: "$4.9$" }, { t: "$5.1$", fb: "The left of 5 means smaller: $4.9$." }], m: "x = 4.9,\\ 5.1", say: "Both sides." },
          { step: 2, ask: "$f(4.9) = \\dfrac{4.9^2 - 25}{4.9 - 5} = \\dfrac{-0.99}{-0.1} =$", type: "num", pre: "$f(4.9) =$", answer: 9.9, tol: 0.001, near: [{ v: 0.099, tol: 0.001, fb: "Divide $-0.99$ by $-0.1$: it is 10 times bigger, not smaller." }], hint: "$0.99 \\div 0.1$.", m: "f(4.9) = 9.9", say: "Just under 10." },
          { step: 2, ask: "$f(5.1) = \\dfrac{5.1^2 - 25}{5.1 - 5} = \\dfrac{1.01}{0.1} =$", type: "num", pre: "$f(5.1) =$", answer: 10.1, tol: 0.001, near: [{ v: 0.101, tol: 0.001, fb: "Divide by 0.1: multiply by 10." }], hint: "$1.01 \\div 0.1$.", m: "f(5.1) = 10.1", say: "Just over 10." },
          { step: 3, ask: "The outputs squeeze in on…", type: "num", pre: "limit =", answer: 10, near: [{ v: 5, fb: "5 is where $x$ is heading. The question asks where $f(x)$ heads." }], hint: "Between 9.9 and 10.1.", m: "\\lim = 10", say: "Both sides agree." }],
        why: "Pick inputs, evaluate, read." },
      { type: "num", kicker: "On your own", prompt: "Use a table to estimate $\\displaystyle\\lim_{x \\to 1}\\frac{x^2 - 1}{x - 1}$.", pre: "limit =", answer: 2, skill: "Limits from a table", near: [{ v: 1, fb: "That is where $x$ is heading. Look at the outputs: $f(0.9) = 1.9$, $f(1.1) = 2.1$." }, { v: 0, fb: "$f(1)$ would be $\\frac{0}{0}$, but the limit looks at nearby values." }], hints: ["Try $x = 0.9, 0.99, 1.01, 1.1$."], why: "The outputs approach $2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**The value at $a$ does not matter.** $f(x) = x + 1$ for $x \\ne 2$, but $f(2) = 7$. What is $\\displaystyle\\lim_{x \\to 2} f(x)$?",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "x = 1.9,\\ 1.99,\\ 2.01,\\ 2.1", say: "Take values near 2, but **not** 2 itself." },
          { step: 2, m: "f(1.99) = 2.99,\\ f(2.01) = 3.01", say: "Away from 2 the rule is $x + 1$.", ask: { prompt: "Does the odd value $f(2) = 7$ change the nearby outputs?", answer: 0, options: [{ t: "No: only the points near 2 are used" }, { t: "Yes, they must move towards 7", fb: "The limit ignores what happens **at** $x = 2$." }] } },
          { step: 3, m: "\\lim_{x \\to 2} f(x) = 3", say: "The outputs head for 3, even though $f(2) = 7$." }] },
        gate: true, then: "The limit is $3$, not $f(2) = 7$." },
      { type: "num", kicker: "Try it", prompt: "A table shows $f(1.9) = 5.8$, $f(1.99) = 5.98$, $f(2.01) = 6.02$ and $f(2.1) = 6.2$. What is $\\displaystyle\\lim_{x \\to 2} f(x)$?", pre: "limit =", answer: 6, skill: "Limits from a table", near: [{ v: 2, fb: "That is where $x$ heads. The outputs head for 6." }], hints: ["Both sides squeeze in on the same number."], why: "$6$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam says $\\displaystyle\\lim_{x \\to 3}\\frac{x^2 - 9}{x - 3}$ does not exist because $f(3)$ is undefined. What is wrong?",
        options: [{ t: "A limit looks at nearby values, not at $x = 3$ itself: the outputs approach 6" }, { t: "Nothing: a missing value means no limit", fb: "A limit can exist even where the function is undefined." }, { t: "The limit is 0", fb: "$f(3.01) = 6.01$ and $f(2.99) = 5.99$: the outputs approach 6." }],
        answer: 0, skill: "Limits from a table", hints: ["Try $x = 2.99$ and $x = 3.01$."], why: "The limit is $6$." },
      { type: "num", kicker: "Use it", prompt: "A cost model is $C(x) = \\dfrac{x^2 - 16}{x - 4}$ and is undefined at $x = 4$. What value does $C(x)$ approach as $x$ approaches 4?", pre: "limit =", answer: 8, skill: "Limits from a table", near: [{ v: 4, fb: "That is where $x$ heads. $C(4.01) = 8.01$ and $C(3.99) = 7.99$." }], hints: ["Try $x = 3.99$ and $x = 4.01$."], why: "The outputs approach $8$." }
    ]
  });

  /* ============================================ 2 · One-sided limits and graphs */
  var HOW_2 = [["Left", "Trace the graph towards $x = a$ **from the left**: that height is $\\lim_{x \\to a^-}$."],
               ["Right", "Trace it **from the right**: that height is $\\lim_{x \\to a^+}$."],
               ["Compare", "If the two agree the limit exists; if not, it does not exist."]];
  var FN2 = [["x + 1", function (x) { return x + 1; }], ["a jump", function (x) { return x < 2 ? x : x + 2; }], ["a hole", function (x) { return x + 2; }], ["1/(x - 2)", function (x) { return 1 / (x - 2); }]];
  var G2 = function (k) {
    var it = curve(function (x) { return x; }, 0, 2, "blue", [-1, 6]).concat(curve(function (x) { return x + 2; }, 2, 4, "blue", [-1, 6]), [hole(2, 2, "blue"), dot(2, 4, "blue")]);
    if (k >= 2) it.push({ seg: [[0, 2], [4, 2]], c: "orange", dash: true });
    if (k >= 3) it.push({ seg: [[0, 4], [4, 4]], c: "green", dash: true });
    return grid("A graph that jumps at x = 2: the left piece ends at height 2 (open dot) and the right piece starts at height 4 (filled dot)" + (k >= 2 ? ", with the height 2 marked" : "") + (k >= 3 ? " and the height 4 marked" : "") + ".", it, { x: [0, 4], y: [-1, 6], u: 50, gx: 1, step: 1, gy: 1, stepY: 1 });
  };
  LESSONS.push({
    title: "One-sided limits and graphs", art: "pclim",
    blurb: "Book 12.1 · The left-hand and right-hand limits, and why a limit exists only when they agree.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A graph climbs to a height of 3 as $x$ approaches 2 from the **left**. What height does it head for?", pre: "height =", answer: 3, skill: "Reading a graph", near: [{ v: 2, fb: "2 is the $x$ value it approaches. The height is 3." }], hints: ["The height is the $y$ value."], why: "$3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick a function. Slide **closeness** to move the two points towards $x = 2$ from the left (green) and right (orange). Find **both** functions where the limit at 2 **does not exist**.",
        scene: { type: "sketch", x: [0, 4], y: [-6, 8], u: 56, uy: 20, gx: 1, step: 1, gy: 2, stepY: 2, w: 272, gate: true, pts: {},
          chips: { f: { label: "Function", v: "0", opts: FN2.map(function (q, i) { return ["" + i, q[0]]; }) } },
          params: { k: { min: 1, max: 5, step: 1, v: 1, label: "closeness" } },
          track: function (s) { var i = +s.c.f, d = HS[s.p.k - 1]; if (s.p.k < 5) return null; var a = FN2[i][1](2 - d), b = FN2[i][1](2 + d); return Math.abs(a - b) > 1 ? "dne" + i : null; },
          draw: function (s) {
            var i = +s.c.f, d = HS[s.p.k - 1], f = FN2[i][1], yr = [-6, 8], it = [];
            if (i === 0) it = curve(f, 0, 4, "blue", yr);
            else if (i === 1) it = curve(function (x) { return x; }, 0, 2, "blue", yr).concat(curve(function (x) { return x + 2; }, 2, 4, "blue", yr), [hole(2, 2, "blue"), dot(2, 4, "blue")]);
            else if (i === 2) it = curve(f, 0, 4, "blue", yr).concat([hole(2, 4, "blue")]);
            else it = curve(f, 0, 4, "blue", yr);
            var a = f(2 - d), b = f(2 + d);
            if (a >= yr[0] && a <= yr[1]) it.push(dot(2 - d, a, "green"));
            if (b >= yr[0] && b <= yr[1]) it.push(dot(2 + d, b, "orange"));
            return it;
          },
          readout: function (s) { var i = +s.c.f, d = HS[s.p.k - 1], f = FN2[i][1], a = f(2 - d), b = f(2 + d); return "$f(" + nm(f4(2 - d, 2)) + ") = " + nm(f4(a, 2)) + "$ (left) · $f(" + nm(f4(2 + d, 2)) + ") = " + nm(f4(b, 2)) + "$ (right)<br>" + (Math.abs(a - b) > 1 ? "the two sides head **different** ways: no limit" : "both sides head for the same height") + "<br>No limit found for: " + Object.keys(s.tracked).length + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "**The jump** has left-hand limit 2 but right-hand limit 4, and **$\\frac{1}{x - 2}$** heads for $-\\infty$ on the left and $+\\infty$ on the right. In both cases the two sides disagree, so $\\lim_{x \\to 2} f(x)$ **does not exist**. $x + 1$ and **the hole** have equal one-sided limits (3 and 4), so their limits exist." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\displaystyle\\lim_{x \\to a^-} f(x)$ is the **left-hand limit** (approach from below) and $\\displaystyle\\lim_{x \\to a^+} f(x)$ the **right-hand limit**. The limit $\\displaystyle\\lim_{x \\to a} f(x)$ **exists** only if both are equal, and then it is that common value.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\displaystyle\\lim_{x \\to 2} f(x)$ for the graph that jumps from height 2 to height 4 at $x = 2$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "\\lim_{x \\to 2^-} f(x) = 2", say: "Coming from the left the graph heads for height 2 (the open dot).", fig: G2(2) },
          { step: 2, m: "\\lim_{x \\to 2^+} f(x) = 4", say: "Coming from the right it starts at height 4 (the filled dot).", fig: G2(3) },
          { step: 3, m: "2 \\ne 4", say: "The two one-sided limits are different.", ask: { prompt: "So $\\displaystyle\\lim_{x \\to 2} f(x)$…", answer: 0, options: [{ t: "does not exist" }, { t: "is 4, because $f(2) = 4$", fb: "The value at 2 does not decide the limit. Both sides must agree." }] } },
          { step: 3, m: "\\lim_{x \\to 2} f(x)\\ \\text{does not exist}", say: "A jump means no limit." }] },
        gate: true, then: "The limit **does not exist**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you look at $f(x) = x + 3$ for $x < 1$ and $f(x) = 6 - 2x$ for $x \\ge 1$, at $x = 1$.",
        how: HOW_2, skill: "One-sided limits",
        steps: [
          { step: 1, ask: "From the left $f(x) = x + 3$, so as $x \\to 1^-$ it heads for", type: "num", pre: "left limit =", answer: 4, near: [{ v: 1, fb: "That is $x$. Put $x = 1$ into $x + 3$." }], hint: "$1 + 3$.", m: "\\lim_{x \\to 1^-} = 4", say: "The left piece." },
          { step: 2, ask: "From the right $f(x) = 6 - 2x$, so as $x \\to 1^+$ it heads for", type: "num", pre: "right limit =", answer: 4, near: [{ v: 8, fb: "Put $x = 1$ into $6 - 2x$: $6 - 2 = 4$." }], hint: "$6 - 2(1)$.", m: "\\lim_{x \\to 1^+} = 4", say: "The right piece." },
          { step: 3, ask: "Both sides give 4, so $\\displaystyle\\lim_{x \\to 1} f(x)$ is…", type: "choice", answer: 0, options: [{ t: "4: the limit exists" }, { t: "does not exist", fb: "The two sides agree, so the limit exists." }], m: "\\lim_{x \\to 1} f(x) = 4", say: "The pieces meet." }],
        why: "Left, right, compare." },
      { type: "choice", kicker: "On your own", prompt: "$f(x) = x^2$ for $x < 2$ and $f(x) = 7 - x$ for $x \\ge 2$. What is $\\displaystyle\\lim_{x \\to 2} f(x)$?",
        options: [{ t: "It does not exist: the left limit is 4 but the right limit is 5" }, { t: "4", fb: "That is only the left-hand limit. The right-hand limit is $7 - 2 = 5$." }, { t: "5", fb: "That is only the right-hand limit. The left-hand limit is $2^2 = 4$." }],
        answer: 0, skill: "One-sided limits", hints: ["Find both one-sided limits."], why: "$4 \\ne 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Growing without bound.** Find $\\displaystyle\\lim_{x \\to 1}\\frac{1}{(x - 1)^2}$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "f(0.9) = 100,\\ f(0.99) = 10000", say: "From the left the outputs shoot up." },
          { step: 2, m: "f(1.1) = 100,\\ f(1.01) = 10000", say: "From the right too: the square makes both sides positive.", ask: { prompt: "Do the outputs settle on a single number?", answer: 0, options: [{ t: "No: they grow without bound" }, { t: "Yes: 10000", fb: "They keep growing as $x$ gets closer to 1." }] } },
          { step: 3, m: "\\text{no finite limit}", say: "No number is approached, so the limit does not exist (as a number). We say $f(x)$ grows without bound." }] },
        gate: true, then: "The limit does **not** exist: the outputs grow without bound." },
      { type: "num", kicker: "Try it", prompt: "The left-hand limit of $f$ at 3 is 5, the right-hand limit is 5, and $f(3) = 8$. What is $\\displaystyle\\lim_{x \\to 3} f(x)$?", pre: "limit =", answer: 5, skill: "One-sided limits", near: [{ v: 8, fb: "That is $f(3)$. The limit uses the one-sided limits, which agree on 5." }], hints: ["Both sides agree."], why: "$5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee reads the jump graph (left height 2, right height 4, $f(2) = 4$) and says $\\displaystyle\\lim_{x \\to 2} f(x) = f(2) = 4$. What is wrong?",
        options: [{ t: "The two sides disagree (2 and 4), so the limit does not exist, whatever $f(2)$ is" }, { t: "Nothing: the limit is the value at 2", fb: "The limit is decided by the nearby values on **both** sides." }, { t: "The limit is 2", fb: "That is only the left-hand limit." }],
        answer: 0, skill: "One-sided limits", hints: ["Compare the left and right limits."], why: "Does not exist." },
      { type: "num", kicker: "Use it", prompt: "A car park charges $\\$5$ for any time up to and including 1 hour and $\\$8$ for a time over 1 hour up to 2 hours. If $f(t)$ is the charge for time $t$ hours, what is $\\displaystyle\\lim_{t \\to 1^+} f(t)$?", pre: "limit =", post: "dollars", answer: 8, skill: "One-sided limits", near: [{ v: 5, fb: "That is the left-hand limit ($t$ just under 1). From the right, $t$ is just over 1 hour." }], hints: ["$t$ just over 1 hour is in the second band."], why: "$8$." }
    ]
  });
  /* ============================================ 3 · Limit laws and direct substitution */
  var HOW_3 = [["Split", "See the expression as sums, products, quotients, powers or roots of simple pieces."],
               ["Substitute", "For a polynomial (or a power or root of one), put $x = a$ straight in."],
               ["Check", "A quotient needs a bottom that does **not** tend to 0."]];
  LESSONS.push({
    title: "Limit laws and direct substitution", art: "pclim",
    blurb: "Book 12.2 · Limits of sums, products, quotients, powers and roots follow from the limits of the pieces.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $3(2)^2 - 5(2) + 1$.", pre: "value =", answer: 3, skill: "Order of operations", near: [{ v: 9, fb: "Square first: $(2)^2 = 4$, then times 3, and so on." }, { v: 21, fb: "$5(2) = 10$ is **subtracted**." }], hints: ["$12 - 10 + 1$."], why: "$3$." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = x^2 - 3x + 2$ is a polynomial. Slide $a$ and read $\\displaystyle\\lim_{x \\to a} f(x)$. Find an $a$ for which the limit is **20**.",
        scene: { type: "sketch", x: [-5, 7], y: [-4, 30], u: 28, uy: 8, gx: 1, step: 1, gy: 5, stepY: 5, w: 384, gate: true, pts: {},
          params: { a: { min: -4, max: 6, step: 1, v: 1, label: "$a$" } },
          draw: function (s) { var a = s.p.a, v = a * a - 3 * a + 2; return curve(function (x) { return x * x - 3 * x + 2; }, -5, 7, "blue", [-4, 30]).concat(v <= 30 ? [{ seg: [[a, 0], [a, v]], c: "soft", dash: true }, { seg: [[-5, v], [a, v]], c: "soft", dash: true }, dot(a, v, "orange")] : []); },
          readout: function (s) { var a = s.p.a, v = a * a - 3 * a + 2; return "$\\displaystyle\\lim_{x \\to " + nm(a) + "}(x^2 - 3x + 2) = (" + nm(a) + ")^2 - 3(" + nm(a) + ") + 2 = " + nm(v) + "$" + (v === 20 ? " ✓" : ""); },
          goal: function (s) { return s.p.a * s.p.a - 3 * s.p.a + 2 === 20; } },
        gate: true, then: "$a = 6$ or $a = -3$: $6^2 - 18 + 2 = 20$ and $9 + 9 + 2 = 20$. For a **polynomial** there is no jump, hole or gap anywhere, so the limit as $x \\to a$ is simply **the value at $a$**. That is **direct substitution**; the limit laws extend it to sums, products, quotients, powers and roots." },
      { type: "learn", kicker: "The idea",
        prompt: "If $\\lim f = L$ and $\\lim g = M$: $\\lim (f \\pm g) = L \\pm M$, $\\lim fg = LM$, $\\lim cf = cL$, $\\lim \\frac{f}{g} = \\frac{L}{M}$ **if $M \\ne 0$**, $\\lim f^n = L^n$ and $\\lim \\sqrt{f} = \\sqrt{L}$. For a **polynomial**, $\\lim_{x \\to a} p(x) = p(a)$.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\displaystyle\\lim_{x \\to 2}(3x^2 - 5x + 1)$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "\\lim (3x^2) - \\lim (5x) + \\lim (1)", say: "The limit of a sum or difference is the sum or difference of the limits." },
          { step: 2, m: "3(2)^2 - 5(2) + 1", say: "Each piece is a polynomial: substitute $x = 2$.", ask: { prompt: "Why may we just substitute?", answer: 0, options: [{ t: "A polynomial has no break: its limit is its value" }, { t: "Because 2 is a whole number", fb: "It works for any $a$: polynomials are smooth everywhere." }] } },
          { step: 3, m: "3(4) - 10 + 1", say: "Square first: $2^2 = 4$." },
          { step: 3, m: "12 - 10 + 1 = 3", say: "Evaluate." }] },
        gate: true, then: "$3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\displaystyle\\lim_{x \\to -1}\\frac{2x^3 + 4}{x^2 + 3}$.",
        how: HOW_3, skill: "Limit laws",
        steps: [
          { step: 1, ask: "The limit of a quotient is the quotient of the limits, **provided** the bottom's limit is…", type: "choice", answer: 0, options: [{ t: "not 0" }, { t: "0", fb: "Dividing by a limit of 0 is not allowed." }], m: "\\frac{\\lim(2x^3 + 4)}{\\lim(x^2 + 3)}", say: "Check the bottom." },
          { step: 2, ask: "The top at $x = -1$: $2(-1)^3 + 4 =$", type: "num", pre: "top =", answer: 2, near: [{ v: 6, fb: "$(-1)^3 = -1$, so $2(-1) + 4$." }], hint: "$-2 + 4$.", m: "2", say: "The top tends to 2." },
          { step: 2, ask: "The bottom at $x = -1$: $(-1)^2 + 3 =$", type: "num", pre: "bottom =", answer: 4, near: [{ v: 2, fb: "$(-1)^2 = +1$, then $+ 3$." }], hint: "$1 + 3$.", m: "4", say: "Not 0: the law applies." },
          { step: 3, ask: "The limit is $\\dfrac{2}{4} =$", type: "num", pre: "limit =", answer: 0.5, tol: 0.001, calc: true, near: [{ v: 2, tol: 0.001, fb: "Top over bottom: $2 \\div 4$." }], hint: "$2 \\div 4$.", m: "\\tfrac{1}{2}", say: "The quotient of the limits." }],
        why: "Split, substitute, check." },
      { type: "num", kicker: "On your own", prompt: "Find $\\displaystyle\\lim_{x \\to 3}\\sqrt{x^2 + 7}$.", pre: "limit =", answer: 4, skill: "Limit laws", near: [{ v: 16, fb: "That is $x^2 + 7$ at 3. Take the square root." }, { v: 3.1623, tol: 0.001, fb: "$3^2 + 7 = 16$, not 10." }], hints: ["The limit of a root is the root of the limit."], why: "$\\sqrt{9 + 7} = \\sqrt{16} = 4$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A product with a power.** Find $\\displaystyle\\lim_{x \\to 4}(x + 1)(x - 2)^2$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "\\lim (x + 1) \\cdot \\lim (x - 2)^2", say: "The limit of a product is the product of the limits." },
          { step: 2, m: "\\lim (x + 1) = 5", say: "A polynomial: put in $x = 4$." },
          { step: 2, m: "\\lim (x - 2)^2 = (4 - 2)^2 = 4", say: "A power: square the limit.", ask: { prompt: "What is $(4 - 2)^2$?", answer: 0, options: [{ t: "$4$" }, { t: "$2$", fb: "The power 2 applies to the whole bracket: $2^2 = 4$." }] } },
          { step: 3, m: "5 \\cdot 4 = 20", say: "Multiply the two limits." }] },
        gate: true, then: "$20$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\displaystyle\\lim_{x \\to 0}\\frac{x^2 + 5}{x + 1}$.", pre: "limit =", answer: 5, skill: "Limit laws", near: [{ v: 0, fb: "The bottom tends to 1, not 0, so the quotient law applies: $\\frac{5}{1}$." }], hints: ["Top tends to 5, bottom to 1."], why: "$\\frac{5}{1} = 5$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Rin finds $\\displaystyle\\lim_{x \\to 2}(2x^2 - 3x)$. Tap the line where the work **first** goes wrong.",
        lines: ["\\lim_{x \\to 2}(2x^2 - 3x)", "= 2(2)^2 - 3(2)", "= 8 - 6 = 14"], answer: 2, fix: "= 8 - 6 = 2",
        fb: { 0: GIVEN, 1: "Substituting $x = 2$ into a polynomial is right." }, skill: "Limit laws",
        hints: ["$8 - 6$."], why: "$8 - 6 = 2$." },
      { type: "num", kicker: "Use it", prompt: "A company's average cost per item is $A(x) = \\dfrac{x^2 + 100}{x}$ dollars when it makes $x$ items. What does $A(x)$ approach as $x$ approaches 10?", pre: "limit =", post: "dollars", answer: 20, skill: "Limit laws", near: [{ v: 200, fb: "That is the top, $10^2 + 100$. Divide by $x = 10$." }], hints: ["The bottom tends to 10, not 0."], why: "$\\frac{200}{10} = 20$." }
    ]
  });

  /* ============================================ 4 · Limits that start as 0/0 */
  var HOW_4 = [["Try it", "Substitute $x = a$. If you get $\\frac{0}{0}$ there is more work to do."],
               ["Rewrite", "Factor and cancel, combine fractions over the LCD, or multiply by a conjugate."],
               ["Substitute", "Put $x = a$ into the simplified expression."]];
  LESSONS.push({
    title: "Limits that start as 0/0", art: "pclim",
    blurb: "Book 12.2 · When substituting gives $\\frac{0}{0}$, rewrite the quotient and cancel the factor that causes it.",
    mins: 15, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Factor $x^2 + x - 6$.",
        options: [{ t: "$(x + 3)(x - 2)$" }, { t: "$(x - 3)(x + 2)$", fb: "Multiply back: $x^2 - x - 6$. We need $+x$: the larger number is positive." }, { t: "$(x + 6)(x - 1)$", fb: "Multiply back: $x^2 + 5x - 6$." }],
        answer: 0, skill: "Factoring", hints: ["Two numbers that multiply to $-6$ and add to $1$."], why: "$(x + 3)(x - 2)$." },
      { type: "learn", kicker: "Explore",
        prompt: "The function is $f(x) = \\dfrac{(x - p)(x + 2)}{x - 3}$. The bottom is 0 at $x = 3$. Slide $p$. Find the $p$ for which $f(x)$ **settles on a number** as $x \\to 3$ (the graph has a hole, not a break).",
        scene: { type: "sketch", x: [-3, 7], y: [-8, 12], u: 30, uy: 14, gx: 1, step: 1, gy: 2, stepY: 2, w: 348, gate: true, pts: {},
          params: { p: { min: -2, max: 6, step: 1, v: 0, label: "$p$" } },
          draw: function (s) { var p = s.p.p, it = curve(function (x) { return (x - p) * (x + 2) / (x - 3); }, -3, 7, "blue", [-8, 12]); if (p === 3) it.push(hole(3, 5, "blue")); it.push({ seg: [[3, -8], [3, 12]], c: "soft", dash: true }); return it; },
          readout: function (s) { var p = s.p.p; return p === 3 ? "$\\frac{(x - 3)(x + 2)}{x - 3} = x + 2$ for $x \\ne 3$: the outputs approach **5** (a hole)" : "at $x = 3$ the top is $(3 - " + p + ")(5) = " + nm(5 * (3 - p)) + " \\ne 0$ over a bottom heading for 0: the outputs **grow without bound**"; },
          goal: function (s) { return s.p.p === 3; } },
        gate: true, then: "$p = 3$: the top **also** vanishes at 3, so the factor $(x - 3)$ cancels, $f(x) = x + 2$ away from 3, and the limit is $3 + 2 = 5$. When substituting gives $\\frac{0}{0}$, the factor that causes the zero is often **cancellable**. For other $p$ the top does not vanish, and the graph has a vertical break." },
      { type: "learn", kicker: "The idea",
        prompt: "If substituting $x = a$ gives $\\frac{0}{0}$, **rewrite** first: **factor and cancel**, combine fractions over the **LCD**, or multiply top and bottom by a **conjugate** when there is a square root. Then substitute into the simpler expression. $\\frac{0}{0}$ is **not** a number and does not mean \"no limit\".",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $\\displaystyle\\lim_{x \\to 2}\\frac{x^2 + x - 6}{x - 2}$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "\\frac{4 + 2 - 6}{2 - 2} = \\frac{0}{0}", say: "Substituting gives $\\frac{0}{0}$: rewrite first." },
          { step: 2, m: "\\frac{(x + 3)(x - 2)}{x - 2}", say: "Factor the top.", ask: { prompt: "May we cancel $(x - 2)$?", answer: 0, options: [{ t: "Yes: $x$ approaches 2 but is not equal to 2" }, { t: "No: it is 0 at $x = 2$", fb: "A limit only uses $x \\ne 2$, so the factor is not 0." }] } },
          { step: 2, m: "= x + 3\\ (x \\ne 2)", say: "Cancel." },
          { step: 3, m: "\\lim_{x \\to 2}(x + 3) = 5", say: "Substitute into what is left." }] },
        gate: true, then: "$5$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $\\displaystyle\\lim_{x \\to -1}\\frac{x^2 - 1}{x + 1}$.",
        how: HOW_4, skill: "Zero over zero",
        steps: [
          { step: 1, ask: "At $x = -1$ the top is $(-1)^2 - 1 = 0$ and the bottom is $0$. So we get $\\frac{0}{0}$: we should…", type: "choice", answer: 0, options: [{ t: "rewrite the quotient first" }, { t: "say the limit does not exist", fb: "$\\frac{0}{0}$ only says there is more work to do." }], m: "\\frac{0}{0}", say: "Rewrite." },
          { step: 2, ask: "$x^2 - 1 = (x - 1)(x + 1)$, so the quotient simplifies to $x -$", type: "num", pre: "$x -$", answer: 1, near: [{ v: -1, fb: "The factor $(x + 1)$ cancels, leaving $(x - 1)$." }], hint: "Cancel $(x + 1)$.", m: "x - 1", say: "After cancelling." },
          { step: 3, ask: "Put in $x = -1$: $-1 - 1 =$", type: "num", pre: "limit =", answer: -2, near: [{ v: 0, fb: "That is $x + 1$. We cancelled it: the expression is $x - 1$." }], hint: "$-1 - 1$.", m: "-2", say: "The limit." }],
        why: "Try, rewrite, substitute." },
      { type: "num", kicker: "On your own", prompt: "Find $\\displaystyle\\lim_{x \\to 4}\\frac{x^2 - 16}{x - 4}$.", pre: "limit =", answer: 8, skill: "Zero over zero", near: [{ v: 0, fb: "That is the top at 4. Factor: $\\frac{(x - 4)(x + 4)}{x - 4}$." }, { v: 16, fb: "Cancel $(x - 4)$ to leave $x + 4$." }], hints: ["$x^2 - 16 = (x - 4)(x + 4)$."], why: "$x + 4 \\to 8$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A square root.** Find $\\displaystyle\\lim_{x \\to 0}\\frac{\\sqrt{x + 4} - 2}{x}$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "\\frac{\\sqrt{4} - 2}{0} = \\frac{0}{0}", say: "$\\frac{0}{0}$ again." },
          { step: 2, m: "\\times \\frac{\\sqrt{x + 4} + 2}{\\sqrt{x + 4} + 2}", say: "Multiply top and bottom by the **conjugate** of the top.", ask: { prompt: "Why use the conjugate?", answer: 0, options: [{ t: "$(a - b)(a + b) = a^2 - b^2$ removes the square root" }, { t: "To make the fraction bigger", fb: "It does not change the value: it is multiplying by 1. It clears the root." }] } },
          { step: 2, m: "\\frac{(x + 4) - 4}{x(\\sqrt{x + 4} + 2)} = \\frac{x}{x(\\sqrt{x + 4} + 2)}", say: "The top becomes $x + 4 - 4 = x$." },
          { step: 2, m: "= \\frac{1}{\\sqrt{x + 4} + 2}", say: "Cancel the $x$." },
          { step: 3, m: "\\frac{1}{\\sqrt{4} + 2} = \\frac{1}{4}", say: "Substitute $x = 0$." }] },
        gate: true, then: "$\\dfrac{1}{4}$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\displaystyle\\lim_{x \\to 2}\\frac{\\frac{1}{x} - \\frac{1}{2}}{x - 2}$. (A decimal is fine.)", pre: "limit =", answer: -0.25, tol: 0.001, calc: true, skill: "Zero over zero", near: [{ v: 0.25, tol: 0.001, fb: "Combine the top over the LCD $2x$: $\\frac{2 - x}{2x}$, which has $2 - x = -(x - 2)$." }], hints: ["Top: $\\frac{2 - x}{2x}$. Then cancel $x - 2$."], why: "$\\frac{-1}{2x} \\to -\\frac{1}{4}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says $\\displaystyle\\lim_{x \\to 2}\\frac{x^2 - 4}{x - 2}$ does not exist because substituting gives $\\frac{0}{0}$. What is wrong?",
        options: [{ t: "$\\frac{0}{0}$ means rewrite: it equals $x + 2$ for $x \\ne 2$, so the limit is 4" }, { t: "Nothing: $\\frac{0}{0}$ is undefined, so no limit", fb: "$\\frac{0}{0}$ is not an answer yet. Simplify, then substitute." }, { t: "The limit is 0", fb: "After cancelling, the expression is $x + 2$, which tends to 4." }],
        answer: 0, skill: "Zero over zero", hints: ["Factor the top."], why: "The limit is $4$." },
      { type: "num", kicker: "Use it", prompt: "The slope of the line through $(2, 4)$ and a nearby point $(x, x^2)$ on $y = x^2$ is $\\dfrac{x^2 - 4}{x - 2}$. What does this slope approach as $x \\to 2$?", pre: "slope =", answer: 4, skill: "Zero over zero", near: [{ v: 0, fb: "$\\frac{0}{0}$ is not the answer. Cancel the $(x - 2)$ first." }], hints: ["Factor $x^2 - 4$."], why: "$x + 2 \\to 4$: the slope of the tangent at $x = 2$." }
    ]
  });
  /* ============================================ 5 · Continuity */
  var HOW_5 = [["Defined?", "Is $f(a)$ a real number? If not, stop: $f$ is not continuous at $a$."],
               ["Limit?", "Do the left and right limits exist and agree?"],
               ["Equal?", "Does the limit equal $f(a)$? If so, all three hold."]];
  var CG = [["x + 1", function (x) { return x + 1; }, 3, 3],
            ["a jump", function (x) { return x < 2 ? x : x + 2; }, 4, null],
            ["a hole", function (x) { return x + 2; }, null, 4],
            ["a moved dot", function (x) { return x + 2; }, 1, 4],
            ["1/(x - 2)", function (x) { return 1 / (x - 2); }, null, null]];
  var G5 = function (k) {
    var it = curve(function (x) { return x + 2; }, 0, 4, "blue", [0, 7]);
    it.push(k >= 3 ? dot(2, 4, "blue") : hole(2, 4, "blue"));
    if (k >= 2) it.push({ seg: [[0, 4], [2, 4]], c: "orange", dash: true });
    return grid("The graph of the line y = x + 2 with a hole at x = 2" + (k >= 2 ? ", the height 4 marked" : "") + (k >= 3 ? ", and the hole filled in" : "") + ".", it, { x: [0, 4], y: [0, 7], u: 50, gx: 1, step: 1, gy: 1, stepY: 1 });
  };
  LESSONS.push({
    title: "Continuity", art: "pclim",
    blurb: "Book 12.3 · A function is continuous at a point when three checks pass: defined, limit exists, and the two are equal.",
    mins: 14, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A graph has an **open dot** at $(2, 4)$ and nothing else at $x = 2$. Is $f(2)$ defined?",
        options: [{ t: "No: an open dot means the point is missing" }, { t: "Yes: $f(2) = 4$", fb: "An open dot marks a point that is **not** on the graph." }],
        answer: 0, skill: "Reading a graph", hints: ["Open dot: the point is left out."], why: "No." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick a graph and read the three checks at $x = 2$. Find the one that passes all three, then the three that each fail exactly **one**.",
        scene: { type: "sketch", x: [0, 4], y: [-2, 7], u: 56, uy: 22, gx: 1, step: 1, gy: 1, stepY: 1, w: 272, gate: true, pts: {},
          chips: { g: { label: "Graph", v: "1", opts: CG.map(function (q, i) { return ["" + i, q[0]]; }) } },
          params: {},
          track: function (s) { return ["ok", "c2", "c1", "c3", null][+s.c.g]; },
          draw: function (s) {
            var i = +s.c.g, q = CG[i], yr = [-2, 7], it;
            if (i === 1) it = curve(function (x) { return x; }, 0, 2, "blue", yr).concat(curve(function (x) { return x + 2; }, 2, 4, "blue", yr), [hole(2, 2, "blue"), dot(2, 4, "blue")]);
            else it = curve(q[1], 0, 4, "blue", yr);
            if (i === 0) it.push(dot(2, 3, "blue"));
            if (i === 2) it.push(hole(2, 4, "blue"));
            if (i === 3) it.push(hole(2, 4, "blue"), dot(2, 1, "orange"));
            return it;
          },
          readout: function (s) {
            var q = CG[+s.c.g], a = q[2] != null, b = q[3] != null, c = a && b && q[2] === q[3];
            return "① $f(2)$ is defined: " + (a ? "yes, $f(2) = " + nm(q[2]) + "$" : "no") + "<br>② $\\lim_{x \\to 2} f(x)$ exists: " + (b ? "yes, it is " + nm(q[3]) : "no") + "<br>③ they are equal: " + (a && b ? (c ? "yes" : "no") : "—") + "<br>" + (c ? "**continuous at 2**" : "**not continuous at 2**") + "<br>Found: " + Object.keys(s.tracked).length + " of 4";
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        gate: true, then: "**$x + 1$** passes all three: continuous. **The jump** fails ② (no limit), **the hole** fails ① ($f(2)$ is missing) and **the moved dot** fails ③ (the limit is 4 but $f(2) = 1$). **$\\frac{1}{x - 2}$** fails both ① and ②. Continuous means you can draw the graph through the point **without lifting your pencil**." },
      { type: "learn", kicker: "The idea",
        prompt: "$f$ is **continuous at $a$** when all three hold: **①** $f(a)$ is defined, **②** $\\lim_{x \\to a} f(x)$ exists, **③** the limit equals $f(a)$. The graph then passes through $x = a$ with no hole, jump or break.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Is $f(x) = \\dfrac{x^2 - 4}{x - 2}$ continuous at $x = 2$?",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "f(2) = \\frac{2^2 - 4}{2 - 2} = \\frac{0}{0}", say: "The formula gives $\\frac{0}{0}$ at $x = 2$: $f(2)$ is **not defined**.", fig: G5(1) },
          { step: 2, m: "\\frac{(x - 2)(x + 2)}{x - 2} = x + 2", say: "Near 2 the quotient factors and cancels." },
          { step: 2, m: "\\lim_{x \\to 2}(x + 2) = 4", say: "The limit **does** exist.", fig: G5(2) },
          { step: 3, m: "f(2)\\ \\text{not defined}", say: "Check ① fails, so $f$ is not continuous at 2.", ask: { prompt: "Which check fails?", answer: 0, options: [{ t: "① $f(2)$ is not defined" }, { t: "② the limit does not exist", fb: "The limit exists: it is 4." }] } },
          { step: 3, m: "\\text{define } f(2) = 4", say: "Define $f(2) = 4$ and the hole fills: all three checks pass. This kind of break is **removable**.", fig: G5(3) }] },
        gate: true, then: "**Not continuous** as given: $f(2)$ is undefined." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide if $f(x) = x + 1$ for $x < 3$ and $f(x) = 2x - 2$ for $x \\ge 3$ is continuous at 3.",
        how: HOW_5, skill: "Continuity",
        steps: [
          { step: 1, ask: "$x = 3$ uses the second piece, $2x - 2$. So $f(3) =$", type: "num", pre: "$f(3) =$", answer: 4, near: [{ v: 5, fb: "$2(3) - 2$: that is $6 - 2$." }, { v: 3, fb: "$2(3) = 6$ first, then subtract 2." }], hint: "$2(3) - 2$.", m: "f(3) = 4", say: "Defined: check ① passes." },
          { step: 2, ask: "From the left, $f(x) = x + 1$, so $\\displaystyle\\lim_{x \\to 3^-} f(x) =$", type: "num", pre: "left =", answer: 4, near: [{ v: 3, fb: "Put $x = 3$ into $x + 1$." }], hint: "$3 + 1$.", m: "\\lim_{x \\to 3^-} = 4", say: "The left piece." },
          { step: 2, ask: "From the right, $f(x) = 2x - 2$, so $\\displaystyle\\lim_{x \\to 3^+} f(x) =$", type: "num", pre: "right =", answer: 4, near: [{ v: 6, fb: "Subtract 2 as well: $2(3) - 2$." }], hint: "$2(3) - 2$.", m: "\\lim_{x \\to 3^+} = 4", say: "The right piece: the limit exists." },
          { step: 3, ask: "The limit is 4 and $f(3) = 4$. Is $f$ continuous at 3?", type: "choice", answer: 0, options: [{ t: "Yes: all three checks pass" }, { t: "No", fb: "①, ② and ③ all hold: the pieces meet at height 4." }], m: "4 = 4", say: "The pieces meet." }],
        why: "Defined, limit, equal." },
      { type: "choice", kicker: "On your own", prompt: "$f(x) = x^2$ for $x \\ne 2$ and $f(2) = 5$. Is $f$ continuous at 2?",
        options: [{ t: "No: the limit is 4 but $f(2) = 5$" }, { t: "Yes: $f(2)$ is defined", fb: "Defined is only check ①. The limit is 4 and $f(2) = 5$, so check ③ fails." }, { t: "No: $f(2)$ is not defined", fb: "$f(2) = 5$ is given." }],
        answer: 0, skill: "Continuity", hints: ["The limit of $x^2$ as $x \\to 2$ is $4$."], why: "$4 \\ne 5$: not continuous." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Where does a fraction break?** Find the $x$ values where $f(x) = \\dfrac{x + 2}{x^2 - 4}$ is **not** continuous, and how.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "x^2 - 4 = 0 \\Rightarrow x = \\pm 2", say: "$f$ is undefined where the bottom is 0, so check ① fails at $x = 2$ and $x = -2$." },
          { step: 2, m: "f(x) = \\frac{x + 2}{(x - 2)(x + 2)} = \\frac{1}{x - 2}\\ (x \\ne -2)", say: "At $x = -2$ the factor $(x + 2)$ cancels.", ask: { prompt: "So the break at $x = -2$ is…", answer: 0, options: [{ t: "a hole: the limit exists, so it is removable" }, { t: "a vertical asymptote", fb: "After cancelling there is no zero left on the bottom at $-2$: $\\frac{1}{-2 - 2}$ is a number." }] } },
          { step: 2, m: "x \\to 2:\\ \\frac{1}{x - 2}\\ \\text{grows without bound}", say: "At $x = 2$ the bottom still tends to 0 while the top tends to 4: a vertical asymptote, no limit." },
          { step: 3, m: "\\text{discontinuous at } x = -2 \\text{ and } x = 2", say: "Two breaks: one removable, one not." }] },
        gate: true, then: "Not continuous at $x = -2$ (a **hole**) or $x = 2$ (an **asymptote**)." },
      { type: "num", kicker: "Try it", prompt: "$f(x) = \\dfrac{1}{x + 4}$ is not continuous at exactly one value of $x$. Which one?", pre: "$x =$", answer: -4, skill: "Continuity", near: [{ v: 4, fb: "The bottom $x + 4$ is 0 when $x = -4$, not 4." }], hints: ["Where is $x + 4 = 0$?"], why: "$x = -4$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Mo checks $f(x) = x + 1$ for $x \\ne 3$ with $f(3) = 7$ at $x = 3$. Tap the line where the work **first** goes wrong.",
        lines: ["f(3) = 7\\ \\text{(defined)}", "\\lim_{x \\to 3} f(x) = 4\\ \\text{(exists)}", "\\text{so } f \\text{ is continuous at } 3"], answer: 2, fix: "4 \\ne 7 \\Rightarrow \\text{not continuous}",
        fb: { 0: GIVEN, 1: "The limit of $x + 1$ as $x \\to 3$ is 4: correct." }, skill: "Continuity",
        hints: ["Is the limit equal to $f(3)$?"], why: "Check ③ fails: $4 \\ne 7$." },
      { type: "choice", kicker: "Use it", prompt: "A car park charges $\\$4$ for up to 1 hour and $\\$8$ for more than 1 hour up to 2 hours. Is the cost continuous at $t = 1$ hour?",
        options: [{ t: "No: just before 1 hour it is $\\$4$, just after it is $\\$8$ (a jump)" }, { t: "Yes: the car park always charges something", fb: "Continuous means no jump. The price leaps from 4 to 8." }, { t: "Yes: both prices are positive", fb: "The two sides must **agree**, not just be positive." }],
        answer: 0, skill: "Continuity", hints: ["Compare the left and right limits at 1."], why: "The limits 4 and 8 differ: a jump." }
    ]
  });

  /* ============================================ 6 · Piecewise functions: finding k */
  var HOW_6 = [["Value", "Find $f(a)$ from the piece that includes $a$."],
               ["Other side", "Substitute $x = a$ into the other piece to get its limit."],
               ["Match", "Set the two equal and solve for the unknown."]];
  LESSONS.push({
    title: "Piecewise functions: finding k", art: "pclim",
    blurb: "Book 12.3 · Choose a constant so that the pieces of a function meet at the break.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $6 - k = 4$.", pre: "$k =$", answer: 2, skill: "Solving equations", near: [{ v: 10, fb: "Subtract 6 from both sides: $-k = -2$, so $k = 2$." }, { v: -2, fb: "$-k = -2$ means $k = 2$." }], hints: ["Subtract 6 from both sides."], why: "$k = 2$." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = 2x + k$ for $x < 1$ and $f(x) = x^2 + 3$ for $x \\ge 1$. Slide $k$ until the two pieces **meet** at $x = 1$.",
        scene: { type: "sketch", x: [-2, 4], y: [-8, 13], u: 50, uy: 9, gx: 1, step: 1, gy: 4, stepY: 4, w: 348, gate: true, pts: {},
          params: { k: { min: -3, max: 5, step: 1, v: 0, label: "$k$" } },
          draw: function (s) { var k = s.p.k; return curve(function (x) { return 2 * x + k; }, -2, 1, "blue", [-8, 13]).concat(curve(function (x) { return x * x + 3; }, 1, 4, "blue", [-8, 13]), [hole(1, 2 + k, "orange"), dot(1, 4, "blue")]); },
          readout: function (s) { var k = s.p.k; return "$k = " + nm(k) + "$: the left piece heads for $2(1) + (" + nm(k) + ") = " + nm(2 + k) + "$; $f(1) = 1^2 + 3 = 4$<br>" + (2 + k === 4 ? "the pieces **meet**: continuous ✓" : "a gap of " + nm(Math.abs(k - 2)) + ": not continuous"); },
          goal: function (s) { return s.p.k === 2; } },
        gate: true, then: "$k = 2$: the left piece heads for $2 + k = 4$, which equals $f(1) = 4$. To make a piecewise function continuous, **match the pieces at the break**: set the left-hand limit equal to the value there and solve for $k$." },
      { type: "learn", kicker: "The idea",
        prompt: "For $f$ to be continuous at the break $x = a$, the limit from the **other** piece must equal $f(a)$. Find $f(a)$ from the piece that includes $a$, substitute $x = a$ into the other piece, **set them equal** and solve.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $k$ so that $f(x) = kx + 1$ for $x < 3$ and $f(x) = 10$ for $x \\ge 3$ is continuous at 3.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "f(3) = 10", say: "$x = 3$ belongs to the second piece." },
          { step: 2, m: "\\lim_{x \\to 3^-}(kx + 1) = 3k + 1", say: "Substitute $x = 3$ into the left piece." },
          { step: 3, m: "3k + 1 = 10", say: "Set the two equal.", ask: { prompt: "Why set them equal?", answer: 0, options: [{ t: "Continuity needs the limit to equal $f(3)$" }, { t: "Because both pieces are lines", fb: "It works for any pieces: check ③ says limit $= f(3)$." }] } },
          { step: 3, m: "3k = 9 \\Rightarrow k = 3", say: "Subtract 1, then divide by 3." }] },
        gate: true, then: "$k = 3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $k$ so that $f(x) = 5x - k$ for $x < 2$ and $f(x) = x^2 + 1$ for $x \\ge 2$ is continuous at 2.",
        how: HOW_6, skill: "Finding k",
        steps: [
          { step: 1, ask: "$x = 2$ uses the second piece, $x^2 + 1$. So $f(2) =$", type: "num", pre: "$f(2) =$", answer: 5, near: [{ v: 4, fb: "Add the 1: $2^2 + 1$." }], hint: "$4 + 1$.", m: "f(2) = 5", say: "The value." },
          { step: 2, ask: "The left piece is $5x - k$. At $x = 2$ it gives $10 - k$. Setting $10 - k = 5$ gives $k =$", type: "num", pre: "$k =$", answer: 5, near: [{ v: -5, fb: "$10 - k = 5$ means $k = 10 - 5$." }, { v: 15, fb: "Subtract from 10: $k = 10 - 5$." }], hint: "$k = 10 - 5$.", m: "10 - k = 5", say: "Match the two." },
          { step: 3, ask: "Check: the left piece at 2 is $10 - 5 =$", type: "num", pre: "left =", answer: 5, near: [{ v: 15, fb: "$10 - k$ with $k = 5$." }], hint: "$10 - 5$.", m: "5 = 5", say: "It equals $f(2)$." }],
        why: "Value, other side, match." },
      { type: "num", kicker: "On your own", prompt: "Find $k$ so that $f(x) = x^2 + k$ for $x < 3$ and $f(x) = 2x + 1$ for $x \\ge 3$ is continuous at 3.", pre: "$k =$", answer: -2, skill: "Finding k", near: [{ v: 2, fb: "$9 + k = 7$, so $k = 7 - 9$: a negative number." }, { v: 7, fb: "That is $f(3)$. Now solve $9 + k = 7$." }], hints: ["$f(3) = 2(3) + 1 = 7$. Then $3^2 + k = 7$."], why: "$9 + k = 7$, so $k = -2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Filling a hole.** $f(x) = \\dfrac{x^2 - 9}{x - 3}$ for $x \\ne 3$ and $f(3) = k$. Find $k$ so that $f$ is continuous at 3.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "f(3) = k", say: "The value is the unknown." },
          { step: 2, m: "\\frac{x^2 - 9}{x - 3} = \\frac{(x - 3)(x + 3)}{x - 3} = x + 3", say: "Substituting gives $\\frac{0}{0}$, so factor and cancel first." },
          { step: 2, m: "\\lim_{x \\to 3}(x + 3) = 6", say: "The limit is 6.", ask: { prompt: "So $f(3)$ must be…", answer: 0, options: [{ t: "6, the same as the limit" }, { t: "0, the value of the top at 3", fb: "Continuity needs $f(3)$ to equal the **limit**, which is 6." }] } },
          { step: 3, m: "k = 6", say: "Set $f(3)$ equal to the limit." }] },
        gate: true, then: "$k = 6$." },
      { type: "num", kicker: "Try it", prompt: "Find $k$ so that $f(x) = kx + 3$ for $x \\le 2$ and $f(x) = x^2$ for $x > 2$ is continuous at 2. (A decimal is fine.)", pre: "$k =$", answer: 0.5, tol: 0.001, calc: true, skill: "Finding k", near: [{ v: 2, tol: 0.001, fb: "Match $2k + 3$ with the limit from the right, $2^2 = 4$." }, { v: 1, tol: 0.001, fb: "$2k + 3 = 4$ gives $2k = 1$, so $k = \\frac{1}{2}$." }], hints: ["$f(2) = 2k + 3$ and the right limit is $4$."], why: "$2k + 3 = 4$, so $k = \\frac{1}{2}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Pat finds $k$ so that $f(x) = 3x + k$ for $x < 1$ and $f(x) = 2x^2$ for $x \\ge 1$ is continuous at 1. Tap the line where the work **first** goes wrong.",
        lines: ["\\lim_{x \\to 1^-}(3x + k) = 3 + k", "f(1) = 2(1)^2 = 2", "3 + k = 2 \\Rightarrow k = 5"], answer: 2, fix: "3 + k = 2 \\Rightarrow k = -1",
        fb: { 0: GIVEN, 1: "$2(1)^2 = 2$: correct." }, skill: "Finding k",
        hints: ["Subtract 3 from both sides."], why: "$k = 2 - 3 = -1$." },
      { type: "num", kicker: "Use it", prompt: "A plumber charges $40 + 5t$ dollars for a job of $t \\le 2$ hours and $30 + kt$ dollars for $t > 2$. For what $k$ does the bill have **no jump** at $t = 2$?", pre: "$k =$", answer: 10, skill: "Finding k", near: [{ v: 5, fb: "The first formula gives $40 + 10 = 50$. Now $30 + 2k = 50$." }, { v: 20, fb: "$30 + 2k = 50$ gives $2k = 20$, so $k = 10$." }], hints: ["At $t = 2$ the first formula gives $50$."], why: "$30 + 2k = 50$, so $k = 10$." }
    ]
  });
  /* ============================================ 7 · Rates of change: secant slopes */
  var H7 = [2, 1.5, 1, 0.5, 0.1, 0.01];
  var HOW_7 = [["Two points", "Find $f(a)$ and $f(b)$ at the two ends of the interval."],
               ["Divide", "Divide the **change in output** by the **change in input**: $\\frac{f(b) - f(a)}{b - a}$."],
               ["Read it", "Say what it means: output units per input unit. Shrink the interval to a point for an **instantaneous** rate."]];
  var G7 = function (k) {
    var it = curve(function (x) { return x * x - 2 * x; }, 0, 4.5, "blue", [-2, 10]);
    if (k >= 1) it.push(dot(1, -1, "blue"));
    if (k >= 2) it.push(dot(4, 8, "blue"));
    if (k >= 3) it.push({ seg: [[1, -1], [4, 8]], c: "orange" });
    return grid("The graph of f(x) = x squared minus 2x" + (k >= 1 ? ", with the point (1, -1)" : "") + (k >= 2 ? " and the point (4, 8)" : "") + (k >= 3 ? ", joined by a straight line of slope 3" : "") + ".", it, { x: [0, 4.5], y: [-2, 10], u: 50, uy: 22, gx: 1, step: 1, gy: 2, stepY: 2 });
  };
  LESSONS.push({
    title: "Rates of change: secant slopes", art: "pclim",
    blurb: "Book 12.4 · The average rate of change over an interval is the slope of the secant line; shrinking the interval gives the instantaneous rate.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "If $f(x) = x^2$, work out $f(3) - f(1)$.", pre: "value =", answer: 8, skill: "Evaluate a function", near: [{ v: 2, fb: "Square first: $f(3) = 9$ and $f(1) = 1$." }, { v: 4, fb: "$f(3) = 9$, not $3 + 1$." }], hints: ["$9 - 1$."], why: "$9 - 1 = 8$." },
      { type: "learn", kicker: "Explore",
        prompt: "On $y = x^2$ the orange line joins $(1, 1)$ to a second point a gap $h$ away. Slide to change $h$. First find the gap where the line's slope is **exactly 3**, then shrink $h$ as far as it goes.",
        scene: { type: "sketch", x: [0, 4], y: [-1, 10], u: 56, uy: 20, gx: 1, step: 1, gy: 2, stepY: 2, w: 272, gate: true, pts: {},
          params: { k: { min: 1, max: 6, step: 1, v: 1, label: "closeness" } },
          track: function (s) { var h = H7[s.p.k - 1]; return 2 + h === 3 ? "three" : (s.p.k === 6 ? "small" : null); },
          draw: function (s) {
            var h = H7[s.p.k - 1], x2 = 1 + h, y2 = x2 * x2, m = 2 + h, xs = Math.max(0, 1 - 2 / m), xe = Math.min(4, 1 + 9 / m);
            return curve(function (x) { return x * x; }, 0, 3.2, "blue", [-1, 10]).concat([{ seg: [[xs, 1 + m * (xs - 1)], [xe, 1 + m * (xe - 1)]], c: "orange" }, dot(1, 1, "blue"), dot(x2, y2, "orange")]);
          },
          readout: function (s) {
            var h = H7[s.p.k - 1], x2 = 1 + h, y2 = x2 * x2;
            return "$h = " + nm(h) + "$: the points are $(1, 1)$ and $(" + nm(f4(x2, 3)) + ", " + nm(f4(y2, 4)) + ")$<br>slope $= \\frac{" + nm(f4(y2, 4)) + " - 1}{" + nm(h) + "} = " + nm(f4(2 + h, 3)) + "$<br>Found: " + Object.keys(s.tracked).length + " of 2";
          },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "The slope is **3** when $h = 1$ (the points $(1, 1)$ and $(2, 4)$). As $h$ shrinks the slope goes 2.5, 2.1, 2.01: it **settles on 2**. The slope of a line through two points is an **average** rate of change; the number it settles on is the **instantaneous** rate at $x = 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **average rate of change** of $f$ on $[a, b]$ is $\\dfrac{f(b) - f(a)}{b - a}$, the slope of the **secant line**. The **instantaneous rate** at $a$ is the limit as the interval shrinks: $\\displaystyle\\lim_{h \\to 0}\\frac{f(a + h) - f(a)}{h}$.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the average rate of change of $f(x) = x^2 - 2x$ on $[1, 4]$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "f(1) = 1 - 2 = -1", say: "The left end of the interval.", fig: G7(1) },
          { step: 1, m: "f(4) = 16 - 8 = 8", say: "The right end.", fig: G7(2) },
          { step: 2, m: "\\frac{f(4) - f(1)}{4 - 1} = \\frac{8 - (-1)}{3}", say: "Change in output over change in input.", ask: { prompt: "What is $8 - (-1)$?", answer: 0, options: [{ t: "$9$" }, { t: "$7$", fb: "Subtracting a negative **adds**: $8 + 1$." }] } },
          { step: 2, m: "= \\frac{9}{3} = 3", say: "This is the slope of the secant line.", fig: G7(3) },
          { step: 3, m: "\\text{rises 3 per 1 in } x", say: "State what the number means." }] },
        gate: true, then: "The average rate of change is $3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the average rate of change of $f(x) = x^2 + 1$ on $[1, 3]$.",
        how: HOW_7, skill: "Rates of change",
        steps: [
          { step: 1, ask: "The left end: $f(1) = 1^2 + 1 =$", type: "num", pre: "$f(1) =$", answer: 2, near: [{ v: 1, fb: "Add the 1: $1 + 1$." }], hint: "$1 + 1$.", m: "f(1) = 2", say: "The left end." },
          { step: 1, ask: "The right end: $f(3) = 3^2 + 1 =$", type: "num", pre: "$f(3) =$", answer: 10, near: [{ v: 9, fb: "Add the 1: $9 + 1$." }], hint: "$9 + 1$.", m: "f(3) = 10", say: "The right end." },
          { step: 2, ask: "Divide the change in output by the change in input: $\\dfrac{10 - 2}{3 - 1} =$", type: "num", pre: "rate =", answer: 4, near: [{ v: 8, fb: "Divide by the change in input, $3 - 1 = 2$." }, { v: 2.667, tol: 0.01, fb: "The change in input is $3 - 1 = 2$, not 3." }], hint: "$8 \\div 2$.", m: "\\frac{8}{2} = 4", say: "The average rate." },
          { step: 3, ask: "The number 4 is the slope of…", type: "choice", answer: 0, options: [{ t: "the secant line through $(1, 2)$ and $(3, 10)$" }, { t: "the tangent line at $x = 1$", fb: "A tangent touches at one point. This line goes through two points." }], m: "\\text{slope of the secant}", say: "An average rate." }],
        why: "Two points, divide, read it." },
      { type: "num", kicker: "On your own", prompt: "Find the average rate of change of $f(x) = 3x^2 - x$ on $[0, 2]$.", pre: "rate =", answer: 5, skill: "Rates of change", near: [{ v: 10, fb: "That is $f(2) - f(0)$. Divide by $2 - 0$." }, { v: 12, fb: "$f(2) = 12 - 2 = 10$: subtract the $x$ term too." }], hints: ["$f(0) = 0$ and $f(2) = 10$."], why: "$\\frac{10 - 0}{2} = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Let the gap shrink.** For $f(x) = x^2$, find the average rate of change on $[3, 3 + h]$, then see what it approaches as $h \\to 0$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "f(3 + h) = (3 + h)^2 = 9 + 6h + h^2,\\quad f(3) = 9", say: "The two ends." },
          { step: 2, m: "\\frac{f(3 + h) - f(3)}{h} = \\frac{6h + h^2}{h}", say: "Subtract the 9, then divide by $(3 + h) - 3 = h$." },
          { step: 2, m: "= 6 + h", say: "Every term on top has a factor $h$: cancel it.", ask: { prompt: "May we cancel $h$?", answer: 0, options: [{ t: "Yes: $h$ is small but not 0" }, { t: "No: $h$ goes to 0", fb: "$h \\to 0$ means very close to 0, never equal to it, so dividing by $h$ is fine." }] } },
          { step: 3, m: "\\lim_{h \\to 0}(6 + h) = 6", say: "The instantaneous rate at $x = 3$ is 6." }] },
        gate: true, then: "The average rate is $6 + h$, which approaches $6$." },
      { type: "num", kicker: "Try it", prompt: "A skater's distance is $s(t) = t^2 + 2t$ metres after $t$ seconds. Find the average speed from $t = 1$ to $t = 3$.", pre: "speed =", post: "m/s", answer: 6, skill: "Rates of change", near: [{ v: 12, fb: "That is the distance travelled, $s(3) - s(1)$. Divide by the 2 seconds." }, { v: 4, fb: "$s(1) = 3$ and $s(3) = 15$." }], hints: ["$s(1) = 3$ and $s(3) = 15$."], why: "$\\frac{15 - 3}{2} = 6$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kit finds the average rate of change of $f(x) = x^2$ on $[1, 3]$. Tap the line where the work **first** goes wrong.",
        lines: ["f(1) = 1,\\quad f(3) = 9", "\\frac{f(3) - f(1)}{3} = \\frac{9 - 1}{3}", "= \\frac{8}{3}"], answer: 1, fix: "\\frac{9 - 1}{3 - 1} = 4",
        fb: { 0: GIVEN, 2: "This line follows from the one above: find where the work **first** goes wrong." }, skill: "Rates of change",
        hints: ["Divide by the change in $x$."], why: "$3 - 1 = 2$, so the rate is $\\frac{8}{2} = 4$." },
      { type: "num", kicker: "Use it", prompt: "A cyclist's distance is $s(t) = 2t^2$ km after $t$ hours. Find the average speed from $t = 1$ to $t = 3$.", pre: "speed =", post: "km/h", answer: 8, skill: "Rates of change", near: [{ v: 16, fb: "That is the distance travelled, $18 - 2$. Divide by the 2 hours." }], hints: ["$s(1) = 2$ and $s(3) = 18$."], why: "$\\frac{18 - 2}{2} = 8$." }
    ]
  });

  /* ============================================ 8 · The derivative */
  var HOW_8 = [["Set up", "Write $\\dfrac{f(x + h) - f(x)}{h}$ using the formula for $f$."],
               ["Simplify", "Expand and simplify the top so every term has a factor $h$."],
               ["Cancel h", "Cancel $h$, then let $h \\to 0$."]];
  LESSONS.push({
    title: "The derivative", art: "pclim",
    blurb: "Book 12.4 · The derivative is the limit of the difference quotient: the slope of the tangent and the instantaneous rate.",
    mins: 16, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Expand $(x + h)^2$.",
        options: [{ t: "$x^2 + 2xh + h^2$" }, { t: "$x^2 + h^2$", fb: "Do not forget the middle term $2xh$." }, { t: "$x^2 + 2h$", fb: "Multiply out all four products." }],
        answer: 0, skill: "Squaring a binomial", hints: ["$(x + h)(x + h)$."], why: "$x^2 + 2xh + h^2$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the point along $y = x^2$. The orange line is the **tangent** and the readout gives its slope. Find the point where the slope is **6**, then where it is **−4**.",
        scene: { type: "sketch", x: [-4, 4], y: [-3, 17], u: 36, uy: 12, gx: 1, step: 1, gy: 4, stepY: 4, w: 336, gate: true, pts: {},
          params: { a: { min: -4, max: 4, step: 1, v: 0, label: "$x$" } },
          track: function (s) { var m = 2 * s.p.a; return m === 6 ? "six" : (m === -4 ? "neg" : null); },
          draw: function (s) { var a = s.p.a, xs = Math.max(-4, a - 1.5), xe = Math.min(4, a + 1.5); return curve(function (x) { return x * x; }, -4, 4, "blue", [-3, 17]).concat([{ seg: [[xs, a * a + 2 * a * (xs - a)], [xe, a * a + 2 * a * (xe - a)]], c: "orange" }, dot(a, a * a, "orange")]); },
          readout: function (s) { var a = s.p.a; return "at $x = " + nm(a) + "$ the point is $(" + nm(a) + ", " + nm(a * a) + ")$ and the tangent has slope **" + nm(2 * a) + "**<br>Found: " + Object.keys(s.tracked).length + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "Slope 6 at $x = 3$ and slope −4 at $x = -2$. Look at the pattern: the slope is always **twice $x$**. That rule, $f'(x) = 2x$, is the **derivative** of $x^2$, found as a limit of secant slopes." },
      { type: "learn", kicker: "The idea",
        prompt: "The **derivative** is $f'(x) = \\displaystyle\\lim_{h \\to 0}\\dfrac{f(x + h) - f(x)}{h}$: the slope of the tangent at $x$ and the instantaneous rate of change. Simplify the **difference quotient**, **cancel $h$**, then let $h \\to 0$.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $f'(x)$ for $f(x) = x^2 + 3x$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\frac{f(x + h) - f(x)}{h} = \\frac{(x + h)^2 + 3(x + h) - (x^2 + 3x)}{h}", say: "Put $x + h$ into $f$, subtract $f(x)$, divide by $h$." },
          { step: 2, m: "= \\frac{x^2 + 2xh + h^2 + 3x + 3h - x^2 - 3x}{h}", say: "Expand the brackets.", ask: { prompt: "Which terms cancel on top?", answer: 0, options: [{ t: "$x^2$ and $3x$ (they appear with both signs)" }, { t: "$2xh$ and $3h$", fb: "Those stay. Only terms that appear with **both** signs cancel." }] } },
          { step: 2, m: "= \\frac{2xh + h^2 + 3h}{h}", say: "Every term left has a factor $h$." },
          { step: 3, m: "= 2x + h + 3", say: "Cancel $h$." },
          { step: 3, m: "\\lim_{h \\to 0}(2x + h + 3) = 2x + 3", say: "Let $h \\to 0$: the $h$ vanishes." }] },
        gate: true, then: "$f'(x) = 2x + 3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $f'(x)$ for $f(x) = 2x^2 - x$, and then $f'(3)$.",
        how: HOW_8, skill: "The derivative",
        steps: [
          { step: 1, ask: "Which is the difference quotient?", type: "choice", answer: 0, options: [{ t: "$\\dfrac{2(x + h)^2 - (x + h) - (2x^2 - x)}{h}$" }, { t: "$\\dfrac{2(x + h)^2 - (x + h)}{h}$", fb: "Subtract $f(x)$ too: $f(x + h) - f(x)$." }], m: "\\frac{f(x + h) - f(x)}{h}", say: "Put in $x + h$, subtract $f(x)$." },
          { step: 2, ask: "After expanding, the top is $4xh + 2h^2 - h$. Dividing by $h$ leaves $4x + 2h -$", type: "num", pre: "$4x + 2h -$", answer: 1, near: [{ v: 0, fb: "$-h \\div h = -1$." }], hint: "$-h \\div h$.", m: "4x + 2h - 1", say: "Every term had a factor $h$." },
          { step: 3, ask: "Let $h \\to 0$: $f'(x) = 4x - 1$. Then $f'(3) =$", type: "num", pre: "$f'(3) =$", answer: 11, near: [{ v: 12, fb: "$4(3) - 1$: subtract the 1 too." }, { v: 4, fb: "Put $x = 3$ into $4x - 1$." }], hint: "$4(3) - 1$.", m: "f'(3) = 11", say: "The slope of the tangent at $x = 3$." }],
        why: "Set up, simplify, cancel $h$." },
      { type: "num", kicker: "On your own", prompt: "For $f(x) = x^2 - 5x$, the difference quotient simplifies to $2x + h - 5$. Find $f'(4)$.", pre: "$f'(4) =$", answer: 3, skill: "The derivative", near: [{ v: 8, fb: "$2(4) = 8$, but subtract 5 as well." }, { v: -5, fb: "Let $h \\to 0$ first: $f'(x) = 2x - 5$." }], hints: ["$f'(x) = 2x - 5$."], why: "$2(4) - 5 = 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A fraction.** Find $f'(x)$ for $f(x) = \\dfrac{1}{x}$, then $f'(2)$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\frac{f(x + h) - f(x)}{h} = \\frac{\\frac{1}{x + h} - \\frac{1}{x}}{h}", say: "Set up the difference quotient." },
          { step: 2, m: "\\frac{1}{x + h} - \\frac{1}{x} = \\frac{x - (x + h)}{x(x + h)}", say: "Combine the fractions over the LCD $x(x + h)$.", ask: { prompt: "What is $x - (x + h)$?", answer: 0, options: [{ t: "$-h$" }, { t: "$h$", fb: "Subtract the whole bracket: $x - x - h = -h$." }] } },
          { step: 2, m: "= \\frac{-h}{x(x + h)}", say: "Now every term on top has a factor $h$." },
          { step: 3, m: "\\frac{-h}{x(x + h)} \\cdot \\frac{1}{h} = \\frac{-1}{x(x + h)}", say: "Cancel $h$." },
          { step: 3, m: "\\lim_{h \\to 0}\\frac{-1}{x(x + h)} = -\\frac{1}{x^2}", say: "Let $h \\to 0$." }] },
        gate: true, then: "$f'(x) = -\\dfrac{1}{x^2}$, so $f'(2) = -\\dfrac{1}{4}$." },
      { type: "num", kicker: "Try it", prompt: "For $f(x) = 3x^2$, the difference quotient simplifies to $6x + 3h$. Find $f'(-2)$.", pre: "$f'(-2) =$", answer: -12, skill: "The derivative", near: [{ v: 12, fb: "$6(-2)$ is negative." }, { v: -6, fb: "That is $3h$ with $h = -2$. Let $h \\to 0$ first: $f'(x) = 6x$." }], hints: ["$f'(x) = 6x$."], why: "$6(-2) = -12$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Jo simplifies the difference quotient of $f(x) = x^2$. Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{(x + h)^2 - x^2}{h}", "= \\frac{x^2 + h^2 - x^2}{h}", "= \\frac{h^2}{h} = h"], answer: 1, fix: "= \\frac{x^2 + 2xh + h^2 - x^2}{h}",
        fb: { 0: GIVEN, 2: "This line follows from the one above: find where the work **first** goes wrong." }, skill: "The derivative",
        hints: ["Expand $(x + h)^2$."], why: "$(x + h)^2 = x^2 + 2xh + h^2$: the middle term was lost." },
      { type: "num", kicker: "Use it", prompt: "A stone falls $s(t) = 5t^2$ metres in $t$ seconds. Its speed at $t = 2$ is $\\displaystyle\\lim_{h \\to 0}\\frac{s(2 + h) - s(2)}{h}$. Find it.", pre: "speed =", post: "m/s", answer: 20, skill: "The derivative", near: [{ v: 10, fb: "$s'(t) = 10t$, and $t = 2$ gives $20$." }, { v: 5, fb: "Let $h \\to 0$ in $20 + 5h$." }], hints: ["$s(2 + h) - s(2) = 5(2 + h)^2 - 20 = 20h + 5h^2$."], why: "$\\frac{20h + 5h^2}{h} = 20 + 5h \\to 20$." }
    ]
  });

  /* ============================================ 9 · Tangent lines and rates */
  var HOW_9 = [["Slope", "Find $f'(a)$: the slope of the tangent at $x = a$."],
               ["Point", "Find $f(a)$: the point $(a, f(a))$ on the curve."],
               ["Line", "Write $y - f(a) = f'(a)(x - a)$ and simplify."]];
  var G9 = function (k) {
    var it = curve(function (x) { return x * x - 2 * x; }, -1, 4.5, "blue", [-2, 12]);
    if (k >= 2) it.push(dot(3, 3, "orange"));
    if (k >= 3) it.push({ seg: [[1.75, -2], [4.5, 9]], c: "orange" });
    return grid("The graph of f(x) = x squared minus 2x" + (k >= 2 ? ", with the point (3, 3)" : "") + (k >= 3 ? " and its tangent line of slope 4 touching the curve at that point" : "") + ".", it, { x: [-1, 4.5], y: [-2, 12], u: 44, uy: 18, gx: 1, step: 1, gy: 2, stepY: 2 });
  };
  LESSONS.push({
    title: "Tangent lines and rates", art: "pclim",
    blurb: "Book 12.4 · Use the derivative to write the tangent line and to read velocity and marginal cost.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A line has slope 4 and passes through $(3, 3)$. At $x = 4$, how far up has the line risen from the point?", pre: "rise =", answer: 4, skill: "Slope", near: [{ v: 3, fb: "Slope 4 means 4 up for each 1 across." }], hints: ["Slope $\\times$ run."], why: "$4 \\cdot 1 = 4$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the point along $y = x^2 - 2x$ and read the slope of the tangent. Find where the tangent is **flat** (slope 0), then where its slope is **4**.",
        scene: { type: "sketch", x: [-2, 5], y: [-4, 16], u: 36, uy: 11, gx: 1, step: 1, gy: 4, stepY: 4, w: 300, gate: true, pts: {},
          params: { a: { min: -1, max: 4, step: 1, v: 0, label: "$x$" } },
          track: function (s) { return s.p.a === 1 ? "flat" : (s.p.a === 3 ? "four" : null); },
          draw: function (s) { var a = s.p.a, m = 2 * a - 2, f = a * a - 2 * a, xs = Math.max(-2, a - 1.5), xe = Math.min(5, a + 1.5); return curve(function (x) { return x * x - 2 * x; }, -2, 5, "blue", [-4, 16]).concat([{ seg: [[xs, f + m * (xs - a)], [xe, f + m * (xe - a)]], c: "orange" }, dot(a, f, "orange")]); },
          readout: function (s) { var a = s.p.a, m = 2 * a - 2; return "at $x = " + nm(a) + "$ the point is $(" + nm(a) + ", " + nm(a * a - 2 * a) + ")$ and the tangent has slope **" + nm(m) + "**" + (m === 0 ? " (flat)" : "") + "<br>Found: " + Object.keys(s.tracked).length + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "The tangent is **flat** at $x = 1$ (the lowest point) and has slope **4** at $x = 3$. The slope is $f'(x) = 2x - 2$, so it is 0 at $x = 1$ and 4 at $x = 3$. Knowing the **slope** and a **point**, you can write the tangent line." },
      { type: "learn", kicker: "The idea",
        prompt: "The **tangent line** to $y = f(x)$ at $x = a$ passes through $(a, f(a))$ with slope $f'(a)$: $y - f(a) = f'(a)(x - a)$. The derivative also gives **rates**: velocity from position, marginal cost from cost.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the tangent line to $f(x) = x^2 - 2x$ at $x = 3$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "f'(x) = 2x - 2 \\Rightarrow f'(3) = 4", say: "The limit of the difference quotient gives $f'(x) = 2x - 2$. The slope at 3 is 4." },
          { step: 2, m: "f(3) = 9 - 6 = 3", say: "The point on the curve is $(3, 3)$.", fig: G9(2) },
          { step: 3, m: "y - 3 = 4(x - 3)", say: "Point and slope into the tangent-line formula.", ask: { prompt: "The slope in the equation is…", answer: 0, options: [{ t: "$f'(3) = 4$" }, { t: "$f(3) = 3$", fb: "$f(3)$ is the height of the point. The slope is the derivative, $f'(3)$." }] } },
          { step: 3, m: "y = 4x - 12 + 3 = 4x - 9", say: "Distribute and add 3.", fig: G9(3) }] },
        gate: true, then: "$y = 4x - 9$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the tangent line to $f(x) = x^2 + 3x$ at $x = 1$. Its derivative is $f'(x) = 2x + 3$.",
        how: HOW_9, skill: "Tangent lines",
        steps: [
          { step: 1, ask: "The slope is $f'(1) = 2(1) + 3 =$", type: "num", pre: "slope =", answer: 5, near: [{ v: 4, fb: "$f(1) = 4$ is the height. The slope is $f'(1)$." }], hint: "$2 + 3$.", m: "f'(1) = 5", say: "The slope of the tangent." },
          { step: 2, ask: "The point has height $f(1) = 1^2 + 3(1) =$", type: "num", pre: "$f(1) =$", answer: 4, near: [{ v: 5, fb: "That is $f'(1)$. Put $x = 1$ into $x^2 + 3x$." }], hint: "$1 + 3$.", m: "(1, 4)", say: "The point of tangency." },
          { step: 3, ask: "$y - 4 = 5(x - 1)$ simplifies to $y = 5x +$", type: "num", pre: "$y = 5x +$", answer: -1, near: [{ v: 1, fb: "Distribute: $5(x - 1) = 5x - 5$, then add 4: $-5 + 4$." }, { v: 9, fb: "Distribute: $5(x - 1) = 5x - 5$, then add 4." }], hint: "$-5 + 4$.", m: "y = 5x - 1", say: "The tangent line." }],
        why: "Slope, point, line." },
      { type: "num", kicker: "On your own", prompt: "The derivative of $f(x) = 3x^2 - x$ is $f'(x) = 6x - 1$. What is the slope of the tangent at $x = 1$?", pre: "slope =", answer: 5, skill: "Tangent lines", near: [{ v: 2, fb: "That is $f(1) = 3 - 1$. The slope is $f'(1)$." }, { v: 6, fb: "Subtract the 1 as well: $6(1) - 1$." }], hints: ["Put $x = 1$ into $6x - 1$."], why: "$6(1) - 1 = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Marginal cost.** Making $x$ items costs $C(x) = 0.1x^2 + 5x + 200$ dollars, and $C'(x) = 0.2x + 5$. Find $C'(50)$ and estimate the cost of the 51st item.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "C'(50) = 0.2(50) + 5 = 15", say: "The slope of the cost curve at 50 items." },
          { step: 1, m: "C'(50) = 15\\ \\text{dollars per item}", say: "It is the **marginal cost**: roughly what one more item costs.", ask: { prompt: "What does $C'(50) = 15$ tell us?", answer: 0, options: [{ t: "One more item costs about $\\$15$" }, { t: "50 items cost $\\$15$", fb: "That would be $C(50)$. The derivative is a **rate**: dollars per item." }] } },
          { step: 2, m: "C(50) = 0.1(2500) + 250 + 200 = 700", say: "The cost of 50 items." },
          { step: 3, m: "C(51) \\approx 700 + 15(1) = 715", say: "Follow the tangent one step to the right." }] },
        gate: true, then: "$C'(50) = 15$ dollars per item, so $C(51) \\approx \\$715$ (the exact cost is $\\$715.10$)." },
      { type: "num", kicker: "Try it", prompt: "Find the tangent line to $f(x) = x^2$ at $x = 2$. What is its $y$-intercept?", pre: "$y$-intercept =", answer: -4, skill: "Tangent lines", near: [{ v: 4, fb: "The tangent is $y - 4 = 4(x - 2)$, so $y = 4x - 4$." }], hints: ["$f(2) = 4$ and $f'(2) = 4$."], why: "$y - 4 = 4(x - 2)$ gives $y = 4x - 4$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Sam writes the tangent line to $f(x) = x^2$ at $x = 3$. Tap the line where the work **first** goes wrong.",
        lines: ["f'(3) = 6,\\quad f(3) = 9", "y - 6 = 9(x - 3)", "y = 9x - 21"], answer: 1, fix: "y - 9 = 6(x - 3)",
        fb: { 0: GIVEN, 2: "This line follows from the one above: find where the work **first** goes wrong." }, skill: "Tangent lines",
        hints: ["The slope goes in front of $(x - 3)$."], why: "The slope is $f'(3) = 6$ and the point is $(3, 9)$." },
      { type: "num", kicker: "Use it", prompt: "A stone falls $s(t) = 4.9t^2$ metres in $t$ seconds. Following the pattern $x^2 \\to 2x$ and $3x^2 \\to 6x$, find its speed at $t = 3$.", pre: "speed =", post: "m/s", answer: 29.4, tol: 0.01, skill: "Tangent lines", near: [{ v: 14.7, tol: 0.01, fb: "$s'(t) = 9.8t$: double the 4.9." }], hints: ["$s'(t) = 9.8t$."], why: "$9.8(3) = 29.4$ m/s." }
    ]
  });
  /* ================================================================ Skills */
  var RD = function (v) { return Math.round(v * 1e9) / 1e9; };
  var GENX = " (A decimal to 3 places is fine; the box also accepts a fraction.)";
  var CO = function (m) { return m === 1 ? "" : m === -1 ? "-" : String(m); };
  // m x + c as TeX, the way a person writes it
  var LIN = function (m, c) { var s = m === 0 ? "" : CO(m) + "x"; return !c ? (s || "0") : (s ? s + (c < 0 ? " - " : " + ") + Math.abs(c) : String(c)); };
  var QUAD = function (A, B, C) { return CO(A) + "x^2" + (B ? (B < 0 ? " - " : " + ") + (Math.abs(B) === 1 ? "" : Math.abs(B)) + "x" : "") + (C ? (C < 0 ? " - " : " + ") + Math.abs(C) : ""); };
  var XM = function (b) { return b === 0 ? "x" : "x " + (b < 0 ? "+ " : "- ") + Math.abs(b); };   // x - b
  var XP = function (b) { return b === 0 ? "x" : "x " + (b < 0 ? "- " : "+ ") + Math.abs(b); };   // x + b
  var UNIQ = function (a) { var seen = {}, out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; };
  var LIM = function (a) { return "\\lim_{x \\to " + a + "}"; };
  var SKILLS = [
    { id: "pc12-table", title: "Limits from a table", lesson: 2,
      gen: function (R) {
        var a = R.int(1, 6), t = R.int(0, 2), m = R.nz(-4, 4), c = R.int(-5, 9), L = m * a + c;
        var xs = [-0.1, -0.01, -0.001, 0.001, 0.01, 0.1].map(function (d) { return RD(a + d); });
        if (t === 2) {
          var p = R.int(-3, 8), q = p + R.nz(-4, 4), ys = [p - 0.1, p - 0.01, p - 0.001, q + 0.001, q + 0.01, q + 0.1].map(RD);
          return mc(R, { prompt: "A table shows $f(x)$ for $x$ close to $" + a + "$. What does it say about $\\lim_{x \\to " + a + "} f(x)$?" + tbl(["$x$", "$f(x)$"], xs.map(function (x, j) { return [x, ys[j]]; })),
            right: "It does not exist", wrong: [{ t: "It is $" + p + "$", fb: "That is only where the left side heads. Both sides must head for the **same** number." }, { t: "It is $" + q + "$", fb: "That is only where the right side heads. Both sides must head for the **same** number." }],
            keep: true, hints: ["Compare where the outputs head from the left and from the right."], why: "The left values head for $" + p + "$ and the right values for $" + q + "$: the limit does not exist." });
        }
        var F = L + R.nz(-3, 3), ys2 = xs.map(function (x) { return RD(m * x + c); });
        return { type: "num", prompt: "A table shows $f(x)$ for $x$ close to $" + a + "$." + (t === 1 ? " Also $f(" + a + ") = " + F + "$." : "") + " What does $\\lim_{x \\to " + a + "} f(x)$ appear to be?" + tbl(["$x$", "$f(x)$"], xs.map(function (x, j) { return [x, ys2[j]]; })), pre: "limit =", answer: L,
          near: t === 1 ? near(L, [{ v: F, fb: "The limit is where the outputs head, not the value at $x = " + a + "$." }]) : [], hints: ["Look at where the outputs head from both sides."], why: "The outputs head for $" + L + "$ from both sides." };
      } },
    { id: "pc12-graphlim", title: "One-sided limits", lesson: 3,
      gen: function (R) {
        var a = R.int(1, 5), m1 = R.nz(-3, 3), c1 = R.int(-5, 6), m2 = R.nz(-3, 3), L1 = m1 * a + c1, meet = R.chance(0.4), L2 = meet ? L1 : L1 + R.nz(-5, 5), c2 = L2 - m2 * a, t = R.int(0, 2);
        var def = "$f(x) = " + LIN(m1, c1) + "$ for $x < " + a + "$ and $f(x) = " + LIN(m2, c2) + "$ for $x \\ge " + a + "$.";
        if (t === 0) return { type: "num", prompt: def + " Find $\\lim_{x \\to " + a + "^-} f(x)$.", pre: "limit =", answer: L1, near: near(L1, [{ v: L2, fb: "That is the right-hand limit. For $x \\to " + a + "^-$ use the piece for $x < " + a + "$." }]), hints: ["Use the piece for $x < " + a + "$ and put in $x = " + a + "$."], why: "$" + L1 + "$." };
        if (t === 1) return { type: "num", prompt: def + " Find $\\lim_{x \\to " + a + "^+} f(x)$.", pre: "limit =", answer: L2, near: near(L2, [{ v: L1, fb: "That is the left-hand limit. For $x \\to " + a + "^+$ use the piece for $x \\ge " + a + "$." }]), hints: ["Use the piece for $x \\ge " + a + "$ and put in $x = " + a + "$."], why: "$" + L2 + "$." };
        if (meet) return { type: "num", prompt: def + " Find $\\lim_{x \\to " + a + "} f(x)$.", pre: "limit =", answer: L1, near: [], hints: ["Find the left-hand and right-hand limits."], why: "Both sides give $" + L1 + "$." };
        return mc(R, { prompt: def + " What is $\\lim_{x \\to " + a + "} f(x)$?", right: "It does not exist", wrong: [{ t: "It is $" + L1 + "$", fb: "That is only the left-hand limit. The right-hand limit is $" + L2 + "$." }, { t: "It is $" + L2 + "$", fb: "That is only the right-hand limit. The left-hand limit is $" + L1 + "$." }],
          keep: true, hints: ["Compare the two one-sided limits."], why: "The sides give $" + L1 + "$ and $" + L2 + "$: no limit." });
      } },
    { id: "pc12-laws", title: "Limit laws and substitution", lesson: 4,
      gen: function (R) {
        var t = R.int(0, 3), a, ans, ex;
        if (t === 0) { a = R.int(-3, 4); var p = R.nz(-3, 3), q = R.int(-6, 6), r = R.int(-8, 8); ans = p * a * a + q * a + r; ex = QUAD(p, q, r); }
        else if (t === 1) { a = R.int(-2, 3); var s = R.int(1, 4), D = a * a + s, k = R.pick([-2, -1, 1, 2]), pp = R.nz(-3, 3), qq = k * D - pp * a; ans = k; ex = "\\dfrac{" + LIN(pp, qq) + "}{x^2 + " + s + "}"; }
        else if (t === 2) { a = R.int(-3, 4); var w = R.int(2, 6), s2 = w * w - a * a; ans = w; ex = s2 === 0 ? "\\sqrt{x^2}" : "\\sqrt{x^2" + (s2 < 0 ? " - " : " + ") + Math.abs(s2) + "}"; }
        else { a = R.int(0, 5); var p3 = R.int(1, 4), q3 = R.int(1, 4); ans = (a + p3) * (a - q3) * (a - q3); ex = "(x + " + p3 + ")(x - " + q3 + ")^2"; }
        return { type: "num", prompt: "Find $" + LIM(a) + (t === 1 ? ex : "\\left(" + ex + "\\right)") + "$.", pre: "limit =", answer: ans,
          near: [], hints: ["The expression has no break at $x = " + a + "$: put in $x = " + a + "$."], why: "Substituting $x = " + a + "$ gives $" + ans + "$." };
      } },
    { id: "pc12-zero", title: "Limits that start as 0/0", lesson: 5,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) { var b = R.nz(-6, 6);
          return { type: "num", prompt: "Find $" + LIM(b) + "\\dfrac{x^2 - " + b * b + "}{" + XM(b) + "}$.", pre: "limit =", answer: 2 * b, near: near(2 * b, [{ v: 0, fb: "Substituting gives $\\frac{0}{0}$. Factor the top and cancel first." }]), hints: ["Factor $x^2 - " + b * b + "$ as a difference of squares."], why: "The quotient simplifies to $" + XP(b) + "$, so the limit is $" + 2 * b + "$." };
        }
        if (t === 1) { var p = R.nz(-5, 5), q = R.int(-5, 5), a0 = -p;
          return { type: "num", prompt: "Find $" + LIM(a0) + "\\dfrac{" + QUAD(1, p + q, p * q) + "}{" + XP(p) + "}$.", pre: "limit =", answer: q - p, near: near(q - p, [{ v: 0, fb: "Substituting gives $\\frac{0}{0}$. Factor the top and cancel first." }]), hints: ["Factor the top: one factor matches the bottom."], why: "The quotient simplifies to $" + XP(q) + "$, so the limit is $" + (q - p) + "$." };
        }
        if (t === 2) { var w = R.int(2, 5);
          return { type: "num", prompt: "Find $\\displaystyle\\lim_{x \\to 0}\\frac{\\sqrt{x + " + w * w + "} - " + w + "}{x}$." + GENX, pre: "limit =", answer: RD(1 / (2 * w)), tol: 0.001, calc: true, near: [{ v: 0, tol: 0.001, fb: "Substituting gives $\\frac{0}{0}$. Multiply top and bottom by the conjugate $\\sqrt{x + " + w * w + "} + " + w + "$." }], hints: ["Multiply top and bottom by the conjugate of the top."], why: "The quotient becomes $\\frac{1}{\\sqrt{x + " + w * w + "} + " + w + "}$, so the limit is $\\frac{1}{" + 2 * w + "}$." };
        }
        var b2 = R.int(2, 5);
        return { type: "num", prompt: "Find $\\displaystyle\\lim_{x \\to " + b2 + "}\\frac{\\frac{1}{x} - \\frac{1}{" + b2 + "}}{x - " + b2 + "}$." + GENX, pre: "limit =", answer: RD(-1 / (b2 * b2)), tol: 0.001, calc: true, near: [{ v: RD(1 / (b2 * b2)), tol: 0.001, fb: "Check the sign: the top is $\\frac{" + b2 + " - x}{" + b2 + "x}$, and $" + b2 + " - x = -(x - " + b2 + ")$." }], hints: ["Combine the top over the LCD $" + b2 + "x$, then cancel $x - " + b2 + "$."], why: "The quotient simplifies to $\\frac{-1}{" + b2 + "x}$, so the limit is $-\\frac{1}{" + b2 * b2 + "}$." };
      } },
    { id: "pc12-cont", title: "Continuity", lesson: 6,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 0) { var a = R.int(1, 5), m1 = R.nz(-3, 3), c1 = R.int(-5, 6), m2 = R.nz(-3, 3), L1 = m1 * a + c1, cont = R.chance(0.5), F = cont ? L1 : L1 + R.nz(-4, 4), c2 = F - m2 * a;
          var def = "$f(x) = " + LIN(m1, c1) + "$ for $x < " + a + "$ and $f(x) = " + LIN(m2, c2) + "$ for $x \\ge " + a + "$. Is $f$ continuous at $x = " + a + "$?";
          if (cont) return mc(R, { prompt: def, right: "Yes: both sides and $f(" + a + ")$ equal $" + L1 + "$", wrong: [{ t: "No: the limit does not exist", fb: "The left-hand and right-hand limits are both $" + L1 + "$." }, { t: "No: $f(" + a + ")$ is not defined", fb: "$f(" + a + ") = " + F + "$ from the second piece." }], keep: true, hints: ["Compare the left-hand limit, the right-hand limit and $f(" + a + ")$."], why: "All three equal $" + L1 + "$." });
          return mc(R, { prompt: def, right: "No: the left-hand limit is $" + L1 + "$ but the right-hand limit is $" + F + "$", wrong: [{ t: "Yes: $f(" + a + ")$ is defined", fb: "Defined is only the first check. The two sides must also agree." }, { t: "No: $f(" + a + ")$ is not defined", fb: "$f(" + a + ") = " + F + "$ from the second piece." }], keep: true, hints: ["Compare the left-hand limit, the right-hand limit and $f(" + a + ")$."], why: "The sides give $" + L1 + "$ and $" + F + "$." });
        }
        if (t === 1) { var b = R.nz(-5, 5), cont1 = R.chance(0.5), v = cont1 ? 2 * b : 2 * b + R.nz(-4, 4);
          var def1 = "$f(x) = \\dfrac{x^2 - " + b * b + "}{" + XM(b) + "}$ for $x \\ne " + b + "$ and $f(" + b + ") = " + v + "$. Is $f$ continuous at $x = " + b + "$?";
          if (cont1) return mc(R, { prompt: def1, right: "Yes: the limit is $" + 2 * b + "$ and $f(" + b + ") = " + 2 * b + "$", wrong: [{ t: "No: the limit does not exist", fb: "The limit exists: the quotient simplifies to $" + XP(b) + "$." }, { t: "No: $f(" + b + ")$ is not defined", fb: "$f(" + b + ") = " + v + "$ is given." }], keep: true, hints: ["Simplify the quotient to find the limit, then compare with $f(" + b + ")$."], why: "The limit is $" + 2 * b + "$ and $f(" + b + ") = " + v + "$: equal." });
          return mc(R, { prompt: def1, right: "No: the limit is $" + 2 * b + "$ but $f(" + b + ") = " + v + "$", wrong: [{ t: "Yes: $f(" + b + ")$ is defined and the limit exists", fb: "The limit and $f(" + b + ")$ must also be **equal**." }, { t: "No: the limit does not exist", fb: "The limit exists: simplify the quotient to $" + XP(b) + "$." }], keep: true, hints: ["Simplify the quotient to find the limit, then compare with $f(" + b + ")$."], why: "The limit is $" + 2 * b + "$ but $f(" + b + ") = " + v + "$." });
        }
        var fam = R.int(0, 3), p = R.int(-4, 4), q = p + R.int(1, 4), c = R.int(1, 5), den, cnt;
        if (fam === 0) { den = "(" + XM(p) + ")(" + XM(q) + ")"; cnt = 2; }
        else if (fam === 1) { den = "(" + XM(p) + ")(x^2 + " + c + ")"; cnt = 1; }
        else if (fam === 2) { den = "x^2 + " + c; cnt = 0; }
        else { den = "(" + XM(p) + ")^2"; cnt = 1; }
        return { type: "num", prompt: "At how many values of $x$ is $f(x) = \\dfrac{1}{" + den + "}$ not continuous?", pre: "number =", answer: cnt, near: [], hints: ["Where is the bottom equal to 0?"], why: "The bottom is 0 at " + cnt + " value" + (cnt === 1 ? "" : "s") + " of $x$." };
      } },
    { id: "pc12-pwise", title: "Finding k", lesson: 7,
      gen: function (R) {
        var t = R.int(0, 3), a = R.int(1, 4);
        if (t === 0) { var m1 = R.nz(-3, 3), m2 = R.nz(-3, 3), c2 = R.int(-6, 6), k = m2 * a + c2 - m1 * a;
          return { type: "num", prompt: "Find $k$ so that $f(x) = " + CO(m1) + "x + k$ for $x < " + a + "$ and $f(x) = " + LIN(m2, c2) + "$ for $x \\ge " + a + "$ is continuous at $x = " + a + "$.", pre: "$k =$", answer: k, near: near(k, [{ v: m2 * a + c2, fb: "That is $f(" + a + ")$. Set $" + m1 * a + " + k$ equal to it and solve for $k$." }]), hints: ["Set the left piece at $x = " + a + "$ equal to $f(" + a + ")$."], why: "$" + m1 * a + " + k = " + (m2 * a + c2) + "$, so $k = " + k + "$." };
        }
        if (t === 1) { var kk = R.nz(-4, 4), c1 = R.int(-5, 5), V = kk * a + c1, lhs = CO(a) + "k" + (c1 === 0 ? "" : (c1 < 0 ? " - " : " + ") + Math.abs(c1));
          return { type: "num", prompt: "Find $k$ so that $f(x) = kx" + (c1 === 0 ? "" : (c1 < 0 ? " - " : " + ") + Math.abs(c1)) + "$ for $x < " + a + "$ and $f(x) = " + V + "$ for $x \\ge " + a + "$ is continuous at $x = " + a + "$.", pre: "$k =$", answer: kk, near: near(kk, [{ v: V, fb: "That is $f(" + a + ")$. Set $" + lhs + "$ equal to it and solve for $k$." }]), hints: ["Set the left piece at $x = " + a + "$ equal to " + V + "."], why: "$" + lhs + " = " + V + "$, so $k = " + kk + "$." };
        }
        if (t === 2) { var m = R.nz(-3, 3), cc = R.int(-6, 6), k2 = m * a + cc - a * a;
          return { type: "num", prompt: "Find $k$ so that $f(x) = x^2 + k$ for $x < " + a + "$ and $f(x) = " + LIN(m, cc) + "$ for $x \\ge " + a + "$ is continuous at $x = " + a + "$.", pre: "$k =$", answer: k2, near: near(k2, [{ v: m * a + cc, fb: "That is $f(" + a + ")$. Set $" + a * a + " + k$ equal to it and solve for $k$." }]), hints: ["Set the left piece at $x = " + a + "$ equal to $f(" + a + ")$."], why: "$" + a * a + " + k = " + (m * a + cc) + "$, so $k = " + k2 + "$." };
        }
        var b = R.nz(-5, 5);
        return { type: "num", prompt: "Find $k$ so that $f(x) = \\dfrac{x^2 - " + b * b + "}{" + XM(b) + "}$ for $x \\ne " + b + "$ and $f(" + b + ") = k$ is continuous at $x = " + b + "$.", pre: "$k =$", answer: 2 * b, near: near(2 * b, [{ v: 0, fb: "That is the top at $x = " + b + "$. Find the limit of the quotient: factor and cancel." }]), hints: ["$k$ must equal the limit of the quotient."], why: "The quotient simplifies to $" + XP(b) + "$, so $k = " + 2 * b + "$." };
      } },
    { id: "pc12-avg", title: "Average rate of change", lesson: 8,
      gen: function (R) {
        var t = R.int(0, 2), p, q, f, ans;
        if (t === 0) { var A = R.nz(-3, 3), B = R.int(-6, 6), C = R.int(-5, 5); p = R.int(-2, 2); q = p + R.int(2, 4); f = function (x) { return A * x * x + B * x + C; };
          ans = (f(q) - f(p)) / (q - p);
          return { type: "num", prompt: "Find the average rate of change of $f(x) = " + QUAD(A, B, C) + "$ on $[" + p + ", " + q + "]$.", pre: "rate =", answer: ans, near: near(ans, [{ v: f(q) - f(p), fb: "That is the change in output. Divide by the change in input, $" + (q - p) + "$." }]), hints: ["$\\frac{f(" + q + ") - f(" + p + ")}{" + q + " - " + par(p) + "}$."], why: "$\\frac{" + f(q) + " - " + par(f(p)) + "}{" + (q - p) + "} = " + ans + "$." };
        }
        if (t === 1) { var B1 = R.int(-5, 5); p = R.int(0, 2); q = p + R.int(1, 3); f = function (x) { return x * x * x + B1 * x; }; ans = (f(q) - f(p)) / (q - p);
          return { type: "num", prompt: "Find the average rate of change of $f(x) = x^3" + (B1 === 0 ? "" : (B1 < 0 ? " - " : " + ") + (Math.abs(B1) === 1 ? "" : Math.abs(B1)) + "x") + "$ on $[" + p + ", " + q + "]$.", pre: "rate =", answer: ans, near: near(ans, [{ v: f(q) - f(p), fb: "That is the change in output. Divide by the change in input, $" + (q - p) + "$." }]), hints: ["$\\frac{f(" + q + ") - f(" + p + ")}{" + q + " - " + p + "}$."], why: "$\\frac{" + f(q) + " - " + par(f(p)) + "}{" + (q - p) + "} = " + ans + "$." };
        }
        var A2 = R.int(1, 5), B2 = R.int(0, 6), t1 = R.int(0, 3), t2 = t1 + R.int(1, 3), s = function (x) { return A2 * x * x + B2 * x; }; ans = (s(t2) - s(t1)) / (t2 - t1);
        return { type: "num", prompt: "A runner's distance is $s(t) = " + QUAD(A2, B2, 0).replace(/x/g, "t") + "$ metres after $t$ seconds. Find the average speed from $t = " + t1 + "$ to $t = " + t2 + "$.", pre: "speed =", post: "m/s", answer: ans, near: near(ans, [{ v: s(t2) - s(t1), fb: "That is the distance covered. Divide by the time taken, $" + (t2 - t1) + "$ s." }]), hints: ["$\\frac{s(" + t2 + ") - s(" + t1 + ")}{" + (t2 - t1) + "}$."], why: "$\\frac{" + s(t2) + " - " + s(t1) + "}{" + (t2 - t1) + "} = " + ans + "$." };
      } },
    { id: "pc12-deriv", title: "The derivative", lesson: 9,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0 || t === 1) { var A = R.nz(-3, 3), B = R.int(-6, 6), C = R.int(-5, 5), a = R.int(-3, 4), d = 2 * A * a + B;
          if (t === 0) return { type: "num", prompt: "For $f(x) = " + QUAD(A, B, C) + "$, find $f'(" + a + ")$.", pre: "$f'(" + a + ") =$", answer: d, near: near(d, [{ v: A * a * a + B * a + C, fb: "That is $f(" + a + ")$. The derivative is the slope: $f'(x) = " + LIN(2 * A, B) + "$." }]), hints: ["$f'(x) = " + LIN(2 * A, B) + "$."], why: "$f'(x) = " + LIN(2 * A, B) + "$, so $f'(" + a + ") = " + d + "$." };
          return { type: "num", prompt: "The difference quotient of $f(x) = " + QUAD(A, B, C) + "$ simplifies to $" + LIN(2 * A, B) + (A < 0 ? " - " : " + ") + (Math.abs(A) === 1 ? "" : Math.abs(A)) + "h$. Find $f'(" + a + ")$.", pre: "$f'(" + a + ") =$", answer: d, near: near(d, [{ v: d + A, fb: "Let $h \\to 0$ first: the $h$ term vanishes." }]), hints: ["Let $h \\to 0$, then put in $x = " + a + "$."], why: "$f'(x) = " + LIN(2 * A, B) + "$, so $f'(" + a + ") = " + d + "$." };
        }
        if (t === 2) { var a2 = R.pick([1, 2, 3, 4, -1, -2, -3]), ans2 = RD(-1 / (a2 * a2));
          return { type: "num", prompt: "For $f(x) = \\dfrac{1}{x}$, find $f'(" + a2 + ")$." + GENX, pre: "$f'(" + a2 + ") =$", answer: ans2, tol: 0.001, calc: true, near: [{ v: RD(1 / (a2 * a2)), tol: 0.001, fb: "Check the sign: $f'(x) = -\\frac{1}{x^2}$." }, { v: RD(1 / a2), tol: 0.001, fb: "That is $f(" + a2 + ")$. The derivative is $-\\frac{1}{x^2}$." }].filter(function (n) { return Math.abs(n.v - ans2) > 0.002; }), hints: ["$f'(x) = -\\frac{1}{x^2}$."], why: "$f'(" + a2 + ") = -\\frac{1}{" + a2 * a2 + "}$." };
        }
        var A3 = R.pick([1, 2, 3]), x0 = R.int(-4, 4), B3 = -2 * A3 * x0, C3 = R.int(-5, 5);
        return { type: "num", prompt: "At what value of $x$ is the tangent to $f(x) = " + QUAD(A3, B3, C3) + "$ horizontal (slope 0)?", pre: "$x =$", answer: x0, near: [], hints: ["Solve $f'(x) = " + LIN(2 * A3, B3) + " = 0$."], why: "$f'(x) = " + LIN(2 * A3, B3) + "$ is 0 at $x = " + x0 + "$." };
      } },
    { id: "pc12-tan", title: "Tangent lines and rates", lesson: 10,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0 || t === 1) { var A, B, C, a, m;
          do { A = R.nz(-2, 2); B = R.int(-5, 5); C = R.int(-5, 5); a = R.int(-2, 3); m = 2 * A * a + B; } while (t === 1 && m === 0);
          var fa = A * a * a + B * a + C, b = fa - m * a;
          if (t === 0) return { type: "num", prompt: "Find the tangent line to $f(x) = " + QUAD(A, B, C) + "$ at $x = " + a + "$. What is its $y$-intercept?", pre: "$y$-intercept =", answer: b, near: near(b, [{ v: fa, fb: "That is $f(" + a + ")$, the height of the point. Write $y - " + par(fa) + " = " + par(m) + "(x - " + par(a) + ")$ and find $y$ when $x = 0$." }]), hints: ["Slope $f'(" + a + ") = " + m + "$ and point $(" + a + ", " + fa + ")$."], why: "$y - " + par(fa) + " = " + par(m) + "(x - " + par(a) + ")$ gives $y = " + LIN(m, b) + "$." };
          var right = LIN(m, b), cand = UNIQ([LIN(fa, m - fa * a), LIN(m, -b), LIN(-m, fa + m * a), LIN(m, fa)]).filter(function (x) { return x !== right; }).slice(0, 3);
          return mc(R, { prompt: "Which is the tangent line to $f(x) = " + QUAD(A, B, C) + "$ at $x = " + a + "$?", right: "$y = " + right + "$", wrong: cand.map(function (x) { return { t: "$y = " + x + "$", fb: "The slope is $f'(" + a + ") = " + m + "$ and the line passes through $(" + a + ", " + fa + ")$." }; }), keep: true, hints: ["Slope $f'(" + a + ") = " + m + "$; point $(" + a + ", " + fa + ")$."], why: "$y - " + par(fa) + " = " + par(m) + "(x - " + par(a) + ")$ gives $y = " + right + "$." });
        }
        if (t === 2) { var beta = R.int(2, 9), gam = R.int(100, 400), n = R.pick([10, 20, 30, 40, 50]), mc1 = RD(0.2 * n + beta);
          return { type: "num", prompt: "Making $x$ items costs $C(x) = 0.1x^2 + " + beta + "x + " + gam + "$ dollars. Find the marginal cost $C'(" + n + ")$: about what one more item costs.", pre: "$C'(" + n + ") =$", post: "dollars", answer: mc1, near: near(mc1, [{ v: RD(0.1 * n * n + beta * n + gam), fb: "That is $C(" + n + ")$, the cost of all " + n + " items. The marginal cost is the **derivative**." }]), hints: ["$C'(x) = 0.2x + " + beta + "$."], why: "$C'(x) = 0.2x + " + beta + "$, so $C'(" + n + ") = " + mc1 + "$." };
        }
        var Av = R.int(1, 5), Bv = R.int(0, 6), Cv = R.int(0, 8), t0 = R.int(1, 5), v0 = 2 * Av * t0 + Bv, tt = function (s) { return s.replace(/x/g, "t"); };
        return { type: "num", prompt: "A stone's height is $s(t) = " + tt(QUAD(Av, Bv, Cv)) + "$ metres after $t$ seconds. Find its velocity at $t = " + t0 + "$.", pre: "velocity =", post: "m/s", answer: v0, near: near(v0, [{ v: Av * t0 * t0 + Bv * t0 + Cv, fb: "That is the height $s(" + t0 + ")$. Velocity is the derivative: $s'(t) = " + tt(LIN(2 * Av, Bv)) + "$." }]), hints: ["$s'(t) = " + tt(LIN(2 * Av, Bv)) + "$."], why: "$s'(" + t0 + ") = " + v0 + "$ m/s." };
      } }
  ];
  L.unit("precalc", 12, {
    title: "Introduction to Calculus",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Limits from a table and one-sided limits.", skills: ["pc12-table", "pc12-graphlim"], per: 3 },
      { title: "Quiz 2", after: 5, blurb: "Limit laws and limits that start as 0/0.", skills: ["pc12-laws", "pc12-zero"], per: 3 },
      { title: "Quiz 3", after: 7, blurb: "Continuity and finding k.", skills: ["pc12-cont", "pc12-pwise"], per: 3 },
      { title: "Quiz 4", after: 10, blurb: "Rates of change, the derivative and tangent lines.", skills: ["pc12-avg", "pc12-deriv", "pc12-tan"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:12", {
    2: { name: "What a limit is", frame: "$\\lim_{x \\to a} f(x) = L$ means $f(x)$ gets [[close]] to $L$ as $x$ gets close to $a$ from [[both]] sides. The value of $f$ **at** $a$ [[does not matter]].",
         chips: ["equal", "one"], fb: { "equal": "The outputs only get **close** to $L$; they need not equal it.", "one": "The outputs must head for $L$ from **both** sides." } },
    3: { name: "One-sided limits", frame: "$\\lim_{x \\to a^-}$ is the [[left-hand]] limit and $\\lim_{x \\to a^+}$ the [[right-hand]] limit. The limit exists only when the two are [[equal]].",
         chips: ["different", "larger"], fb: { "different": "If the sides head for different values, the limit does not exist.", "larger": "Neither side wins: the two must be equal." } },
    4: { name: "Limit laws and substitution", frame: "For a [[polynomial]] the limit as $x \\to a$ is the value [[at $a$]]: substitute. A quotient of limits needs the bottom's limit to be [[not 0]].",
         chips: ["0", "near $a$"], fb: { "0": "A bottom that tends to 0 is not allowed in the quotient law.", "near $a$": "Substitute the value **at** $a$ itself." } },
    5: { name: "Limits that start as 0/0", frame: "If substituting gives $\\frac{0}{0}$, [[rewrite]] first: [[factor]] and cancel, or use the [[LCD]]. Then substitute again.",
         chips: ["stop", "no limit"], fb: { "stop": "$\\frac{0}{0}$ only says there is more work to do.", "no limit": "$\\frac{0}{0}$ does not mean the limit is missing: simplify first." } },
    6: { name: "Continuity", frame: "$f$ is continuous at $a$ when $f(a)$ is [[defined]], the [[limit]] exists, and the limit [[equals]] $f(a)$.",
         chips: ["zero", "jumps"], fb: { "zero": "The limit need not be zero: it must equal $f(a)$.", "jumps": "A jump is a break: a continuous graph has none." } },
    7: { name: "Finding k", frame: "To make a piecewise function continuous, find $f(a)$ from the piece that [[includes]] $a$, substitute $x = a$ into the [[other]] piece, set them [[equal]] and solve.",
         chips: ["add", "ignore"], fb: { "add": "Set the two **equal**; do not add them.", "ignore": "The other piece matters: its limit must meet $f(a)$." } },
    8: { name: "Rates of change", frame: "The average rate of change on $[a, b]$ is $\\frac{f(b) - f(a)}{b - a}$, the slope of the [[secant]] line. Shrinking the interval to a point gives the [[instantaneous]] rate.",
         chips: ["normal", "total"], fb: { "normal": "A normal is perpendicular to the curve. A secant joins two points on it.", "total": "The average rate is a **ratio**: change in output over change in input." } },
    9: { name: "The derivative", frame: "The derivative is the limit of the [[difference quotient]] $\\frac{f(x + h) - f(x)}{h}$ as $h \\to 0$. Simplify, [[cancel]] $h$, and the result is the slope of the [[tangent]].",
         chips: ["secant", "add"], fb: { "secant": "A secant uses two points. The derivative is the slope of the tangent.", "add": "Cancel the common factor $h$; do not add it." } },
    10: { name: "Tangent lines and rates", frame: "The tangent at $x = a$ passes through $(a, f(a))$ with [[slope]] $f'(a)$. Velocity is the derivative of [[position]]; marginal cost is the derivative of [[cost]].",
          chips: ["area", "time"], fb: { "area": "Area is not what velocity or marginal cost measure.", "time": "Position changes with time. Velocity is the derivative of position." } }
  });
})();
