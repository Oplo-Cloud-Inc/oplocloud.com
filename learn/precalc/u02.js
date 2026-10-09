/* ==========================================================================
   Precalculus — Unit 2: Linear Functions. See lab/core.js for the format.

   Follows OpenStax Precalculus 2e, Chapter 2: linear functions and slope,
   graphs and equations of lines, parallel and perpendicular lines, modeling
   with linear functions, and fitting a line to data. Each section is split
   into lessons small enough to finish in one sitting; each teaches one
   method: the idea, an example to watch, one done together, then on your
   own, a harder case, find the error, use it, and the concept built at the
   end.

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
    blurb: "Before Chapter 2 · Evaluate a function, solve an equation, plot a point, find a slope, and solve for $y$.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Evaluate", prompt: "Let $f(x) = 2x - 1$. Find $f(3)$.", pre: "$f(3) =$", answer: 5, skill: "Evaluate a function",
        near: [{ v: 7, fb: "Double 3, then subtract 1: $6 - 1 = 5$." }], hints: ["$2(3) - 1$."], why: "$2(3) - 1 = 5$." },
      { type: "num", kicker: "Check 2 · Solve", prompt: "Solve $3x + 2 = 11$.", pre: "$x =$", answer: 3, skill: "Solve a linear equation",
        near: [{ v: 13 / 3, fb: "Subtract 2 first: $3x = 9$." }], hints: ["Subtract 2, then divide by 3."], why: "$3x = 9$, so $x = 3$." },
      { type: "plane", kicker: "Check 3 · The grid", prompt: "Click the point $(-2, 3)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [-2, 3] }, skill: "Plot a point",
        clickFb: function (c) { return c && c[0] === 3 && c[1] === -2 ? "That is $(3, -2)$. The first number is $x$: across." : "The first number is $x$ (across), the second is $y$ (up or down)."; },
        hints: ["Go 2 left, then 3 up."], why: "2 left, 3 up." },
      { type: "num", kicker: "Check 4 · Slope", prompt: "Find the slope of the line through $(0, 1)$ and $(2, 5)$.", answer: 2, skill: "Slope",
        near: [{ v: 0.5, fb: "Slope is rise over run: the change in $y$ goes on top." }, { v: 4, fb: "Divide the rise, 4, by the run, 2." }], hints: ["$\\frac{5 - 1}{2 - 0}$."], why: "$\\frac{4}{2} = 2$." },
      { type: "choice", kicker: "Check 5 · Solve for a letter", prompt: "Solve $2x + y = 5$ for $y$.",
        options: [{ t: "$y = 5 - 2x$" }, { t: "$y = 5 + 2x$", fb: "Subtracting $2x$ from both sides gives $-2x$." }, { t: "$y = 2x - 5$", fb: "Move $2x$ to the right: it changes sign, and the 5 stays positive." }],
        answer: 0, skill: "Solve a formula", hints: ["Subtract $2x$ from both sides."], why: "$y = 5 - 2x$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 2.1**. If **check 4** slipped, lesson 2.2 is all about slope.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ===================================== 1 · Linear functions: a rate and a starting value */
  var HOW_1 = [["Find the rate", "How much does the output change for each 1 step of the input?"],
               ["Find the start", "What is the output when the input is 0? Go back to 0 if you must."],
               ["Write it", "$f(x) = mx + b$: $m$ is the rate and $b$ is the starting value."]];
  LESSONS.push({
    title: "Linear functions: a rate and a starting value", art: "pcline",
    blurb: "Book 2.1 · A linear function changes by the same amount for each step: a rate, and a place to start.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A tank holds 20 litres and gains 3 litres every minute. How many litres are in it after 4 minutes?", post: "litres", answer: 32, skill: "Evaluate a function",
        near: [{ v: 12, fb: "That is only the new water. The tank started with 20." }, { v: 23, fb: "3 litres **every** minute: four minutes add $4 \\cdot 3$." }], hints: ["$20 + 4 \\cdot 3$."], why: "$20 + 12 = 32$ litres." },
      { type: "learn", kicker: "Explore",
        prompt: "A seedling is 3 cm tall and grows 2 cm every week. Slide $m$ and $b$ to draw its **height** onto the dashed line.",
        scene: morph({ keys: ["lin"], noGhost: true, noPts: true, x: [-1, 6], y: [-1, 13], u: 22, params: { m: { min: -2, max: 4, step: 1, v: 1, label: "$m$" }, b: { min: 0, max: 6, step: 1, v: 0, label: "$b$" } },
          tf: function (f, p) { return function (x) { return p.m * x + p.b; }; }, map: function (pt) { return pt; }, target: { m: 2, b: 3 },
          read: function (p) { return "$h(w) = " + (p.m === 0 ? "" : p.m === 1 ? "w" : p.m === -1 ? "-w" : nm(p.m) + "w") + (p.m === 0 ? nm(p.b) : (p.b === 0 ? "" : " + " + nm(p.b))) + "$: starts at " + nm(p.b) + ", " + (p.m > 0 ? "grows " + nm(p.m) + " each week" : p.m < 0 ? "shrinks " + nm(-p.m) + " each week" : "does not change"); } }),
        gate: true, then: "$h(w) = 2w + 3$: **starts at 3** (the height at $w = 0$) and **rises 2 each week**: a linear function." },
      { type: "learn", kicker: "The idea",
        prompt: "A **linear function** changes by the **same amount** for each 1 step of the input. That amount is the **rate** $m$. The output at input 0 is the **starting value** $b$. Together: $f(x) = mx + b$.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "A pool costs 3 dollars to join, then 2 dollars for each swim. Watch the cost function built.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "C(1) - C(0) = 5 - 3 = 2", say: "One more swim adds 2 dollars: the rate.", fig: grid("The cost: 3 dollars at 0 swims, 5 at 1, 7 at 2, rising 2 each swim.", [dot(0, 3, "blue"), dot(1, 5, "blue"), dot(2, 7, "blue"), { steps: [[0, 3], [1, 5]], c: "orange" }], { x: [-1, 5], y: [-1, 12], u: 20 }) },
          { step: 2, m: "C(0) = 3", say: "With 0 swims you have only paid to join: the starting value.",
            ask: { prompt: "Which number is paid only once?", answer: 0, options: [{ t: "$3$, the joining fee" }, { t: "$2$", fb: "2 dollars is paid for **each** swim: that is the rate." }] }, fig: grid("The cost: 3 dollars at 0 swims, 5 at 1, 7 at 2, rising 2 each swim.", [dot(0, 3, "orange", "(0, 3)", "nw"), dot(1, 5, "blue"), dot(2, 7, "blue")], { x: [-1, 5], y: [-1, 12], u: 20 }) },
          { step: 3, m: "C(n) = 2n + 3", say: "Rate times the number of swims, plus the starting value.", fig: grid("The line C = 2n + 3 through (0, 3), (1, 5), (2, 7), (3, 9).", curve(function (n) { return 2 * n + 3; }, 0, 4.5, "blue", [-1, 12]).concat([dot(0, 3, "orange"), dot(1, 5, "blue"), dot(2, 7, "blue"), dot(3, 9, "blue")]), { x: [-1, 5], y: [-1, 12], u: 20 }) }] },
        gate: true, then: "$C(n) = 2n + 3$: **rate 2**, **starting value 3**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write a function. A candle is 12 cm tall and burns down 2 cm every hour.",
        how: HOW_1, skill: "Linear functions",
        steps: [
          { step: 1, ask: "What is the rate? (It is going down.)", type: "num", pre: "$m =$", answer: -2, near: [{ v: 2, fb: "The candle gets **shorter**: the rate is negative." }], hint: "Down 2 each hour.", m: "m = -2", say: "A negative rate: the output falls." },
          { step: 2, ask: "What is the starting value, the height at hour 0?", type: "num", pre: "$b =$", answer: 12, near: [{ v: 2, fb: "2 is the rate. The starting height is 12 cm." }], hint: "Before it burns at all.", m: "b = 12", say: "The height when the clock starts." },
          { step: 3, ask: "Which is the function?", type: "choice", answer: 0, options: [{ t: "$f(h) = -2h + 12$" }, { t: "$f(h) = 2h + 12$", fb: "The candle burns **down**, so the rate has a minus." }, { t: "$f(h) = 12h - 2$", fb: "The rate multiplies the hours, and the starting value is added." }], m: "f(h) = -2h + 12", say: "Rate times hours, plus the start." }],
        why: "Rate, start, write. Now read them from a table." },
      { type: "expr", kicker: "On your own", prompt: "Write $f$ from the table." + tbl(["$x$", "$f(x)$"], [[0, 5], [1, 8], [2, 11], [3, 14]]), answer: "3x+5", shown: "3x + 5", form: "simplified", skill: "Linear functions", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "5x+3", fb: "The output rises by 3 each step, and starts at 5 when $x = 0$." }], hints: ["Each step adds 3. The output at $x = 0$ is 5."], why: "Rate 3, start 5: $f(x) = 3x + 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The table **skips 0**. $f(2) = 9$, $f(3) = 12$, $f(4) = 15$. Write $f(x)$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "12 - 9 = 3 \\quad 15 - 12 = 3", say: "Each step of 1 adds 3: the rate is 3.", ask: { prompt: "What is the rate?", answer: 0, options: [{ t: "$3$" }, { t: "$9$", fb: "9 is an output, not a change." }] } },
          { step: 2, m: "f(2) = 9 \\ \\Rightarrow \\ f(0) = 9 - 3 - 3", say: "To get from $x = 2$ back to $x = 0$ takes two steps down, each of 3." },
          { step: 2, m: "b = f(0) = 3", say: "The starting value." },
          { step: 3, m: "f(x) = 3x + 3", say: "Check: $f(2) = 6 + 3 = 9$ ✓." }] },
        gate: true, then: "No $x = 0$ in the table? Walk back to it with the rate, or use $b = f(x) - mx$." },
      { type: "choice", kicker: "Try it", prompt: "$f(t) = 150 - 12t$ is the amount of water (litres) left in a barrel after $t$ minutes. What does $-12$ mean?",
        options: [{ t: "The barrel loses 12 litres every minute" }, { t: "The barrel starts with 12 litres", fb: "The starting value is the 150: the amount at $t = 0$." }, { t: "The barrel is empty after 12 minutes", fb: "$150 - 12t = 0$ at $t = 12.5$, but the $-12$ itself is a **rate**." }],
        answer: 0, skill: "Linear functions", hints: ["Which number multiplies $t$?"], why: "The number multiplying the input is the rate: $-12$ litres per minute." },
      { type: "choice", kicker: "Find the error",
        prompt: "Eli says the starting value of $f(x) = 4x + 9$ is 4, “because it comes first”. What is wrong?",
        options: [{ t: "The starting value is $f(0)$, which is 9. The 4 is the rate." }, { t: "Nothing is wrong.", fb: "Put $x = 0$ in: $f(0) = 0 + 9 = 9$." }, { t: "It is 13.", fb: "That is $f(1)$." }],
        answer: 0, skill: "Linear functions", hints: ["Work out $f(0)$."], why: "$f(0) = 4(0) + 9 = 9$." },
      { type: "num", kicker: "Use it", prompt: "A phone plan costs 25 dollars a month plus 5 dollars for each gigabyte of data. What is the cost for 3 GB?", post: "dollars", answer: 40, skill: "Linear functions",
        near: [{ v: 15, fb: "That is only the data. Add the 25 dollars a month." }, { v: 90, fb: "The 25 is added once, not multiplied." }], hints: ["$C(g) = 5g + 25$."], why: "$C(3) = 15 + 25 = 40$ dollars." }
    ]
  });

  /* ============================================================ 2 · Slope: change per step */
  var HOW_2 = [["Outputs", "Subtract the outputs: the change in output."],
               ["Inputs", "Subtract the inputs **in the same order**: the change in input."],
               ["Divide", "Slope = change in output ÷ change in input. Say it with its units."]];
  LESSONS.push({
    title: "Slope: change per step", art: "slope",
    blurb: "Book 2.1 · How steep a line is, what its sign says, and what it means with units.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A car's distance goes from 30 km to 90 km in 2 hours. How many kilometres per hour is that?",
        options: [{ t: "30 km/h" }, { t: "60 km/h", fb: "60 km is the change in distance. Divide by the 2 hours." }, { t: "45 km/h", fb: "That is $\\frac{90}{2}$. Subtract first: $90 - 30 = 60$." }],
        answer: 0, skill: "Rate", hints: ["$\\frac{90 - 30}{2}$."], why: "$\\frac{60}{2} = 30$ km per hour." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the two points. The orange steps show **across** and **up**. Make a line that **rises**, one that **falls**, and one that is **flat**.",
        scene: { type: "sketch", x: [-6, 6], y: [-6, 6], u: 24, w: 320, gate: true,
          pts: { A: { at: [-3, -2], drag: true, c: "blue", snap: 1, say: "First point" }, B: { at: [2, 3], drag: true, c: "orange", snap: 1, say: "Second point" } },
          track: function (s) { var dx = s.B[0] - s.A[0], dy = s.B[1] - s.A[1]; if (dx === 0) return null; return dy === 0 ? "flat" : (dy / dx > 0 ? "up" : "down"); },
          draw: function (s) {
            var a = s.A[0] <= s.B[0] ? s.A : s.B, b = s.A[0] <= s.B[0] ? s.B : s.A, items = [];
            if (a[0] !== b[0]) items.push({ line: [a, b], c: "green", bare: true }, { steps: [a, b], c: "ink" }); else if (a[1] !== b[1]) items.push({ line: [a, b], c: "red", bare: true });
            return items;
          },
          readout: function (s) {
            var dx = s.B[0] - s.A[0], dy = s.B[1] - s.A[1], t = (s.tracked.up ? "✓ " : "· ") + "rising &nbsp; " + (s.tracked.down ? "✓ " : "· ") + "falling &nbsp; " + (s.tracked.flat ? "✓ " : "· ") + "flat";
            if (dx === 0) return "Same $x$: a **vertical** line. $\\frac{" + nm(dy) + "}{0}$: slope is **undefined**.<br>" + t;
            return "slope $= \\frac{" + nm(dy) + "}{" + nm(dx) + "} = " + ratTex(dy, dx) + "$: " + (dy === 0 ? "**flat**" : dy / dx > 0 ? "**rising**" : "**falling**") + "<br>" + t;
          },
          goal: function (s) { return s.tracked.up && s.tracked.down && s.tracked.flat; } },
        gate: true, then: "**Positive** slope: rising. **Negative**: falling. **Zero**: flat. Slope is how many steps **up** for each step **across**." },
      { type: "learn", kicker: "The idea",
        prompt: "The **slope** $m = \\dfrac{\\text{change in output}}{\\text{change in input}} = \\dfrac{f(b) - f(a)}{b - a}$. It is the rate of change. Its **units** are output units per input unit: “dollars per month”.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "At 2 hours a train is 150 km from the start. At 5 hours it is 600 km. Watch the slope found.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "600 - 150 = 450", say: "The change in distance, in kilometres." },
          { step: 2, m: "5 - 2 = 3", say: "The change in time, in hours, subtracted in the same order.", ask: { prompt: "Why subtract in the same order?", answer: 0, options: [{ t: "So the signs agree and the slope has the right sign" }, { t: "It does not matter at all", fb: "Mixing the order would flip the sign of the slope." }] } },
          { step: 3, m: "\\frac{450}{3} = 150", say: "Divide." },
          { step: 3, m: "150 \\ \\text{km per hour}", say: "On average the train moves 150 kilometres every hour. That is its speed." }] },
        gate: true, then: "Slope $= 150$ km/h. A slope is always a **rate**, so say its units." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the slope. A town's population was 9 thousand in 2015 and 4 thousand in 2020.",
        how: HOW_2, skill: "Slope",
        steps: [
          { step: 1, ask: "Change in population, $4 - 9$ (in thousands).", type: "num", pre: "$\\Delta P =$", answer: -5, near: [{ v: 5, fb: "It **fell**, so the change is negative: $4 - 9 = -5$." }], hint: "$4 - 9$.", m: "4 - 9 = -5", say: "The population dropped." },
          { step: 2, ask: "Change in years, $2020 - 2015$.", type: "num", pre: "$\\Delta t =$", answer: 5, near: [{ v: -5, fb: "Same order as before: later minus earlier, $2020 - 2015$." }], hint: "Later minus earlier.", m: "2020 - 2015 = 5", say: "Five years." },
          { step: 3, ask: "Divide. What is the slope?", type: "num", pre: "$m =$", answer: -1, near: [{ v: 1, fb: "The sign comes from the change in population: negative." }], hint: "$\\frac{-5}{5}$.", m: "m = \\frac{-5}{5} = -1", say: "Negative 1 thousand per year." }],
        why: "Outputs, inputs, divide. Now say what it means." },
      { type: "num", kicker: "On your own", prompt: "Find the slope of the line through $(-2, 7)$ and $(4, -5)$.", answer: -2, skill: "Slope",
        near: [{ v: 2, fb: "The line goes **down** as it goes right: negative." }, { v: -0.5, fb: "Rise over run: the change in $y$ goes on top." }], hints: ["$\\frac{-5 - 7}{4 - (-2)}$."], why: "$\\frac{-12}{6} = -2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two special lines. First the points $(3, 1)$ and $(3, 6)$. Then $(1, 4)$ and $(5, 4)$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "6 - 1 = 5 \\quad (1, 4) \\ \\text{and} \\ (5, 4): \\ 4 - 4 = 0", say: "The first pair rises 5. The second pair does not change at all.", fig: grid("A vertical line at x = 3 and a horizontal line at y = 4.", [{ line: [[3, 0], [3, 1]], c: "blue", bare: true }, { line: [[0, 4], [1, 4]], c: "orange", bare: true }, dot(3, 1, "blue"), dot(3, 6, "blue"), dot(1, 4, "orange"), dot(5, 4, "orange")], { x: [-1, 7], y: [-1, 7], u: 24 }) },
          { step: 2, m: "3 - 3 = 0 \\quad 5 - 1 = 4", say: "The first pair has **no** sideways change. The second changes 4 across.", ask: { prompt: "Which pair has an input change of 0?", answer: 0, options: [{ t: "The first: $(3, 1)$ and $(3, 6)$" }, { t: "The second", fb: "The second goes from $x = 1$ to $x = 5$." }] } },
          { step: 3, m: "\\frac{5}{0} \\ \\text{undefined} \\qquad \\frac{0}{4} = 0", say: "You cannot divide by 0: a vertical line has **no slope**. A horizontal line has slope **0**." }] },
        gate: true, then: "Vertical: slope **undefined**. Horizontal: slope **0**." },
      { type: "choice", kicker: "Try it", prompt: "A savings account goes from 200 dollars to 500 dollars in 6 months. The slope is…",
        options: [{ t: "50 dollars per month" }, { t: "300 dollars per month", fb: "300 dollars is the total change. Divide by 6 months." }, { t: "50 months per dollar", fb: "Slope is output per input: dollars per month." }],
        answer: 0, skill: "Slope", hints: ["$\\frac{500 - 200}{6}$, with units."], why: "$\\frac{300}{6} = 50$ dollars per month." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Pia finds the slope through $(1, 2)$ and $(5, 10)$. Tap the line where the work **first** goes wrong.",
        lines: ["\\text{change in } y: 10 - 2 = 8", "\\text{change in } x: 1 - 5 = -4", "\\text{slope} = \\frac{8}{-4} = -2"], answer: 1, fix: "\\text{change in } x: 5 - 1 = 4",
        fb: { 0: "$10 - 2 = 8$ is right.", 2: LATER }, skill: "Slope", hints: ["Both subtractions must start with the same point."], why: "$5 - 1 = 4$, so the slope is $\\frac{8}{4} = 2$: the line rises." },
      { type: "choice", kicker: "Use it", prompt: "A hiker's height is 300 m at 1 p.m. and 100 m at 3 p.m. What is the slope, with its meaning?",
        options: [{ t: "$-100$: she descends 100 metres each hour" }, { t: "$100$: she climbs 100 metres each hour", fb: "Her height **dropped** from 300 to 100: the slope is negative." }, { t: "$-200$: she descends 200 metres each hour", fb: "$-200$ is the total drop. It took 2 hours." }],
        answer: 0, skill: "Slope", hints: ["$\\frac{100 - 300}{3 - 1}$."], why: "$\\frac{-200}{2} = -100$ metres per hour." }
    ]
  });

  /* ======================================================= 3 · Writing the equation of a line */
  var HOW_3 = [["Slope", "Find the slope $m$ from two points."],
               ["Pick a point", "Choose one of the points: call it $(x_1, y_1)$."],
               ["Write it", "Point-slope form: $y - y_1 = m(x - x_1)$. Solve for $y$ if you want $y = mx + b$."]];
  LESSONS.push({
    title: "Writing the equation of a line", art: "eqn",
    blurb: "Book 2.1 · From two points, or a point and a slope, to an equation.",
    mins: 12, v: 1,
    steps: [
      { type: "expr", kicker: "Warm up", prompt: "Simplify $3(x - 2) + 5$.", answer: "3x-1", shown: "3x - 1", form: "simplified", skill: "Combine like terms", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "3x+3", fb: "$3 \\cdot (-2) = -6$, and $-6 + 5 = -1$." }], hints: ["$3x - 6 + 5$."], why: "$3x - 6 + 5 = 3x - 1$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the two points. The equation of the line through them is written live. Make the line **$y = -2x + 3$**.",
        scene: { type: "sketch", x: [-6, 6], y: [-6, 6], u: 24, w: 320, gate: true,
          pts: { A: { at: [-1, 2], drag: true, c: "blue", snap: 1, say: "First point" }, B: { at: [2, 1], drag: true, c: "orange", snap: 1, say: "Second point" } },
          draw: function (s) { return s.A[0] === s.B[0] && s.A[1] === s.B[1] ? [] : [{ line: [s.A, s.B], c: "green", bare: true }]; },
          readout: function (s) {
            var dx = s.B[0] - s.A[0], dy = s.B[1] - s.A[1];
            if (dx === 0 && dy === 0) return "Move the points apart.";
            if (dx === 0) return "A vertical line: $x = " + nm(s.A[0]) + "$ (not a function)";
            var b = ratTex(s.A[1] * dx - dy * s.A[0], dx), m = ratTex(dy, dx);
            return "$y = " + (m === "0" ? "" : (m === "1" ? "" : m === "-1" ? "-" : m) + "x") + (b === "0" ? (m === "0" ? "0" : "") : (m === "0" ? "" : " ") + (b[0] === "-" ? (m === "0" ? "-" : "- ") + b.slice(1) : (m === "0" ? "" : "+ ") + b)) + "$";
          },
          goal: function (s) { var dx = s.B[0] - s.A[0], dy = s.B[1] - s.A[1]; return dx !== 0 && dy === -2 * dx && s.A[1] === -2 * s.A[0] + 3; } },
        gate: true, then: "Two points are enough: they fix the slope, and then where the line crosses the $y$-axis." },
      { type: "learn", kicker: "The idea",
        prompt: "A line is fixed by two points. Find the **slope**, then use **point-slope form**: $y - y_1 = m(x - x_1)$. It says: from the known point, $y$ changes by the slope times the change in $x$.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write the equation of the line through $(1, 2)$ and $(3, 8)$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "m = \\frac{8 - 2}{3 - 1} = 3", say: "Rise 6 over run 2.", fig: grid("The line through (1, 2) and (3, 8).", [{ line: [[1, 2], [3, 8]], c: "blue", bare: true }, dot(1, 2, "orange", "(1, 2)", "se"), dot(3, 8, "blue", "(3, 8)", "se")], { x: [-1, 5], y: [-2, 10], u: 20 }) },
          { step: 2, m: "(x_1,\\ y_1) = (1,\\ 2)", say: "Either point works. Take the first.", ask: { prompt: "Could we use $(3, 8)$ instead?", answer: 0, options: [{ t: "Yes: both points are on the line" }, { t: "No: only the first", fb: "Both are on the line, so both give the same equation in the end." }] } },
          { step: 3, m: "y - 2 = 3(x - 1)", say: "Point-slope form." },
          { step: 3, m: "y = 3x - 3 + 2 = 3x - 1", say: "Multiply out and add 2: slope-intercept form." }] },
        gate: true, then: "$y = 3x - 1$. Check with the other point: $3(3) - 1 = 8$ ✓." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write the line through $(2, 5)$ and $(4, 1)$.",
        how: HOW_3, skill: "Equation of a line",
        steps: [
          { step: 1, ask: "What is the slope?", type: "num", pre: "$m =$", answer: -2, near: [{ v: 2, fb: "The line falls: from 5 down to 1. The slope is negative." }], hint: "$\\frac{1 - 5}{4 - 2}$.", m: "m = \\frac{1 - 5}{4 - 2} = -2", say: "Down 4 over across 2." },
          { step: 2, ask: "Which point shall we use?", type: "choice", answer: 0, options: [{ t: "Either: say $(2, 5)$" }, { t: "Only $(4, 1)$", fb: "Both are on the line, so either works." }], m: "(x_1,\\ y_1) = (2,\\ 5)", say: "The first point." },
          { step: 3, ask: "After $y - 5 = -2(x - 2)$, what is the $y$-intercept $b$?", type: "num", pre: "$b =$", answer: 9, near: [{ v: -1, fb: "$-2(x - 2) = -2x + 4$, and $4 + 5 = 9$." }], hint: "$-2x + 4 + 5$.", m: "y = -2x + 9", say: "Multiply out, then add 5." }],
        why: "Slope, point, write. Now with a point and a slope." },
      { type: "equation", kicker: "On your own", prompt: "Write the equation of the line with slope 2 through $(1, -1)$, in the form $y = mx + b$.",
        answer: "y=2x-3", shown: "y = 2x - 3", form: "slope-intercept", skill: "Equation of a line",
        near: [{ v: "y=2x-1", fb: "$-1$ is the height at $x = 1$, not at $x = 0$. Use $y + 1 = 2(x - 1)$." }, { v: "y=2x+3", fb: "$2(x - 1) = 2x - 2$, and $-2 - 1 = -3$." }],
        hints: ["$y - (-1) = 2(x - 1)$."], why: "$y + 1 = 2x - 2$, so $y = 2x - 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **fraction** slope. Find the line through $(0, 1)$ and $(3, 3)$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "m = \\frac{3 - 1}{3 - 0} = \\frac{2}{3}", say: "Rise 2 over run 3. Leave it as a fraction.", fig: grid("The line through (0, 1) and (3, 3), with steps of 3 across and 2 up.", [{ line: [[0, 1], [3, 3]], c: "blue", bare: true }, { steps: [[0, 1], [3, 3]], c: "orange" }, dot(0, 1, "blue"), dot(3, 3, "blue")], { x: [-2, 6], y: [-1, 6], u: 24 }) },
          { step: 2, m: "(0,\\ 1) \\ \\text{is on the } y\\text{-axis}", say: "The point $(0, 1)$ is the $y$-intercept: $b = 1$.", ask: { prompt: "What is $b$ when a point has $x = 0$?", answer: 0, options: [{ t: "Its height, 1" }, { t: "$\\frac{2}{3}$", fb: "That is the slope, not the intercept." }] } },
          { step: 3, m: "y = \\frac{2}{3}x + 1", say: "No point-slope needed: slope and intercept are both known." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which line passes through $(0, -2)$ and has slope $\\frac{1}{2}$?",
        options: [{ t: "$y = \\frac{1}{2}x - 2$" }, { t: "$y = -2x + \\frac{1}{2}$", fb: "The slope multiplies $x$; $-2$ is the intercept." }, { t: "$y = \\frac{1}{2}x + 2$", fb: "The intercept is $-2$: the point is $(0, -2)$." }],
        answer: 0, skill: "Equation of a line", hints: ["$(0, -2)$ gives $b$ directly."], why: "$m = \\frac{1}{2}$ and $b = -2$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tom writes the line with slope 4 through $(2, 3)$. Tap the line where the work **first** goes wrong.",
        lines: ["y - 3 = 4(x - 2)", "y - 3 = 4x - 2", "y = 4x + 1"], answer: 1, fix: "y - 3 = 4x - 8",
        fb: { 0: "That is point-slope form, correctly.", 2: LATER }, skill: "Equation of a line", hints: ["Multiply the 4 by **both** terms in the brackets."], why: "$4(x - 2) = 4x - 8$, so $y = 4x - 5$." },
      { type: "num", kicker: "Use it", prompt: "Water freezes at 0 on the Celsius scale (32 on the Fahrenheit scale) and boils at 100 (212). The line through $(0, 32)$ and $(100, 212)$ gives $F$ from $C$. What is $F$ at 50 degrees Celsius?", pre: "$F =$", post: "°F", answer: 122, skill: "Equation of a line",
        near: [{ v: 82, fb: "The slope is 1.8, not 1: $F = 1.8C + 32$." }], hints: ["Slope $= \\frac{180}{100} = 1.8$, intercept 32."], why: "$F = 1.8(50) + 32 = 122$." }
    ]
  });
  /* ============================================================ 4 · Graphing a line */
  var HOW_4 = [["Start", "Plot the $y$-intercept, $(0, b)$."],
               ["Step", "From it go 1 right and $m$ up (down if $m$ is negative). For $m = \\frac{p}{q}$: $q$ right and $p$ up."],
               ["Draw", "Plot a few steps and draw the line through them."]];
  LESSONS.push({
    title: "Graphing a line", art: "slope",
    blurb: "Book 2.2 · Start at the $y$-intercept and climb the slope, one step at a time.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Let $f(x) = 2x - 1$. Find $f(0)$.", pre: "$f(0) =$", answer: -1, skill: "Evaluate a function",
        near: [{ v: 1, fb: "$2(0) = 0$, and $0 - 1 = -1$." }, { v: 0, fb: "Do not forget the $-1$." }], hints: ["$2(0) - 1$."], why: "$f(0) = -1$: where the line crosses the $y$-axis." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $m$ and $b$ to lay the line on the dashed one. The **green steps** show 1 across and $m$ up, from the $y$-intercept.",
        scene: morph({ keys: ["lin"], noGhost: true, noPts: true, x: [-5, 5], y: [-4, 8], u: 24, params: { m: { min: -3, max: 3, step: 1, v: 1, label: "$m$" }, b: { min: -3, max: 6, step: 1, v: 0, label: "$b$" } },
          tf: function (f, p) { return function (x) { return p.m * x + p.b; }; }, map: function (pt) { return pt; }, target: { m: -1, b: 3 },
          extra: function (p) { return [{ steps: [[0, p.b], [1, p.b + p.m]], c: "green" }, { steps: [[1, p.b + p.m], [2, p.b + 2 * p.m]], c: "green" }, { pt: [0, p.b], c: "orange" }]; },
          read: function (p) { return "$y = " + (p.m === 0 ? "" : p.m === 1 ? "x" : p.m === -1 ? "-x" : nm(p.m) + "x") + (p.m === 0 ? nm(p.b) : (p.b === 0 ? "" : (p.b < 0 ? " - " + nm(-p.b) : " + " + nm(p.b)))) + "$: start at $(0, " + nm(p.b) + ")$, then 1 right and " + (p.m === 0 ? "no change" : nm(Math.abs(p.m)) + (p.m > 0 ? " up" : " down")); } }),
        gate: true, then: "$y = -x + 3$: start at $(0, 3)$, then **1 right, 1 down**, again and again." },
      { type: "learn", kicker: "The idea",
        prompt: "In $y = mx + b$, the **$y$-intercept** $(0, b)$ is where to start. The **slope** $m$ is the staircase: 1 across, $m$ up. Plot a few steps and the line is there.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $y = 2x - 1$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "b = -1 \\ \\Rightarrow \\ (0,\\ -1)", say: "The number on its own is the $y$-intercept. Plot it.", fig: grid("The point (0, -1) on the y-axis.", [dot(0, -1, "orange", "(0, −1)", "se")], { x: [-4, 4], y: [-4, 6], u: 22 }) },
          { step: 2, m: "m = 2 = \\frac{2}{1}", say: "1 right and 2 up from $(0, -1)$: the point $(1, 1)$. Again: $(2, 3)$.", fig: grid("Steps of 1 across and 2 up from (0, -1) to (1, 1) and (2, 3).", [dot(0, -1, "orange"), { steps: [[0, -1], [1, 1]], c: "green" }, { steps: [[1, 1], [2, 3]], c: "green" }, dot(1, 1, "blue"), dot(2, 3, "blue")], { x: [-4, 4], y: [-4, 6], u: 22 }),
            ask: { prompt: "After 1 right and 2 up from $(0, -1)$, which point?", answer: 0, options: [{ t: "$(1,\\ 1)$" }, { t: "$(2,\\ 1)$", fb: "1 right means $x$ becomes 1, and $-1 + 2 = 1$." }] } },
          { step: 3, m: "y = 2x - 1", say: "Draw the line through the points. Go the other way too: 1 left, 2 down.", fig: grid("The line y = 2x - 1.", curve(function (x) { return 2 * x - 1; }, -2, 3.5, "blue", [-4, 6]).concat([dot(0, -1, "orange"), dot(1, 1, "blue"), dot(2, 3, "blue")]), { x: [-4, 4], y: [-4, 6], u: 22 }) }] },
        gate: true, then: "Start at $(0, -1)$ and climb **1 across, 2 up**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you graph $y = -\\frac{1}{2}x + 2$.",
        how: HOW_4, skill: "Graph a line",
        steps: [
          { step: 1, ask: "Where do you start?", type: "choice", answer: 0, options: [{ t: "$(0,\\ 2)$" }, { t: "$(2,\\ 0)$", fb: "The number added is the **height** at $x = 0$: the point is $(0, 2)$." }], m: "(0,\\ 2)", say: "The $y$-intercept." },
          { step: 2, ask: "The slope is $-\\frac{1}{2}$: 2 right and 1 **down**. From $(0, 2)$ what is the height after 2 right?", type: "num", pre: "$y =$", answer: 1, near: [{ v: 3, fb: "A negative slope goes **down**: $2 - 1 = 1$." }], hint: "$2 - 1$.", m: "(0,\\ 2) \\to (2,\\ 1)", say: "2 right, 1 down." },
          { step: 3, ask: "So the graph is…", type: "choice", answer: 0, options: [{ t: "a line falling gently from left to right" }, { t: "a line rising steeply", fb: "The slope is negative and small: gentle and falling." }], m: "y = -\\frac{1}{2}x + 2", say: "Through $(0, 2)$ and $(2, 1)$." }],
        why: "Start, step, draw. Now graph one yourself." },
      { type: "plane", kicker: "On your own", prompt: "Graph $y = 2x - 3$. Drag $A$ and $B$ onto two points of the line.",
        x: [-6, 6], y: [-6, 6], points: [{ id: "A", x: -2, y: 2, drag: true, label: "A" }, { id: "B", x: 3, y: -2, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) { return onLine(st, "A", "B", 2, -3) ? { ok: true } : { ok: false, say: "Start at $(0, -3)$, then go 1 right and 2 up: $(1, -1)$ is on the line." }; },
        answer: { points: { A: [0, -3], B: [2, 1] } }, skill: "Graph a line", hints: ["$(0, -3)$ and $(1, -1)$."], why: "$(0, -3)$ and $(2, 1)$ are on the line, and so is $(1, -1)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**No intercept given.** Graph $3x + 2y = 6$. First write it as $y = mx + b$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "2y = -3x + 6 \\quad\\Rightarrow\\quad y = -\\frac{3}{2}x + 3", say: "Solve for $y$. Divide **every** term by 2.", ask: { prompt: "What is $6 \\div 2$?", answer: 0, options: [{ t: "$3$" }, { t: "$6$", fb: "Each term is divided by 2, including the 6." }] } },
          { step: 1, m: "(0,\\ 3)", say: "The $y$-intercept." },
          { step: 2, m: "m = -\\frac{3}{2}: \\ \\text{2 right, 3 down}", say: "From $(0, 3)$: the point $(2, 0)$.", fig: grid("From (0, 3), 2 right and 3 down reaches (2, 0).", [dot(0, 3, "orange"), { steps: [[0, 3], [2, 0]], c: "green" }, dot(2, 0, "blue")], { x: [-4, 6], y: [-3, 5], u: 24 }) },
          { step: 3, m: "\\text{draw through } (0, 3) \\text{ and } (2, 0)", say: "Join them, and carry on in both directions.", fig: grid("The line through (0, 3) and (2, 0).", curve(function (x) { return -1.5 * x + 3; }, -1.5, 4, "blue", [-3, 5]).concat([dot(0, 3, "orange"), dot(2, 0, "blue")]), { x: [-4, 6], y: [-3, 5], u: 24 }) }] },
        gate: true, then: "Tidy the equation into $y = mx + b$ first, then start and step." },
      { type: "choice", kicker: "Try it", prompt: "Which line starts at $(0, -2)$ and falls 3 for every 1 across?",
        options: [{ t: "$y = -3x - 2$" }, { t: "$y = 3x - 2$", fb: "That rises 3 for each 1 across." }, { t: "$y = -2x - 3$", fb: "The slope is $-3$ and the start is $-2$: swap them." }],
        answer: 0, skill: "Graph a line", hints: ["Slope $-3$, intercept $-2$."], why: "$m = -3$ and $b = -2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben graphs $y = 3x + 1$ by starting at $(1, 0)$ and going 1 right, 3 up. What is wrong?",
        options: [{ t: "The start is the $y$-intercept, $(0, 1)$, not $(1, 0)$." }, { t: "Nothing is wrong.", fb: "Check $x = 1$: $y = 4$, but his first step lands at $(2, 3)$." }, { t: "He should go 3 right and 1 up.", fb: "Slope 3 is $\\frac{3}{1}$: 1 across, 3 up." }],
        answer: 0, skill: "Graph a line", hints: ["Work out $y$ when $x = 0$."], why: "$b = 1$: the line starts at $(0, 1)$." },
      { type: "choice", kicker: "Use it", prompt: "A bamboo plant is 4 cm tall and grows 3 cm a day. Graphing its height, which is the first point and the first step?",
        options: [{ t: "Start at $(0, 4)$; each day 1 across, 3 up" }, { t: "Start at $(4, 0)$; each day 1 across, 3 up", fb: "At day 0 the height is 4: the point is $(0, 4)$." }, { t: "Start at $(0, 3)$; each day 1 across, 4 up", fb: "3 is the rate, 4 the start: swap them." }],
        answer: 0, skill: "Graph a line", hints: ["Day on the axis across, height up."], why: "Start $(0, 4)$, then 1 day across and 3 cm up." }
    ]
  });

  /* ================================================ 5 · Intercepts, horizontal and vertical lines */
  var HOW_5 = [["y-intercept", "Put $x = 0$ and solve for $y$."],
               ["x-intercept", "Put $y = 0$ and solve for $x$."],
               ["Join them", "Mark both on the axes and draw the line through them."]];
  LESSONS.push({
    title: "Intercepts, horizontal and vertical lines", art: "eqn",
    blurb: "Book 2.2 · Where a line crosses the axes, and the two lines that are special.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $2x + 6 = 0$.", pre: "$x =$", answer: -3, skill: "Solve a linear equation",
        near: [{ v: 3, fb: "$2x = -6$: the answer is negative." }], hints: ["Subtract 6, then divide by 2."], why: "$2x = -6$, so $x = -3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the **blue** point along the $x$-axis and the **orange** point along the $y$-axis. The line through them is drawn. Make it cross at **$-2$** and **$4$**.",
        scene: { type: "sketch", x: [-6, 6], y: [-6, 6], u: 24, w: 320, gate: true,
          pts: { A: { at: [3, 0], drag: true, c: "blue", snap: 1, on: { y: 0 }, say: "The x-intercept" }, B: { at: [0, 2], drag: true, c: "orange", snap: 1, on: { x: 0 }, say: "The y-intercept" } },
          draw: function (s) { var a = s.A[0], b = s.B[1]; if (a === 0 && b === 0) return []; return [{ line: [[a, 0], [0, b]], c: "green", bare: true }]; },
          readout: function (s) {
            var a = s.A[0], b = s.B[1];
            if (a === 0 && b === 0) return "Both points are at the origin: move one away.";
            if (a === 0) return "A vertical line: $x = 0$.";
            if (b === 0) return "A horizontal line: $y = 0$.";
            var m = ratTex(-b, a);
            return "crosses the $x$-axis at $" + nm(a) + "$ and the $y$-axis at $" + nm(b) + "$<br>$y = " + (m === "1" ? "" : m === "-1" ? "-" : m) + "x " + (b < 0 ? "- " + nm(-b) : "+ " + nm(b)) + "$";
          },
          goal: function (s) { return s.A[0] === -2 && s.B[1] === 4; } },
        gate: true, then: "Cross at $-2$ and $4$: $y = 2x + 4$. Two intercepts are enough to draw any slanted line." },
      { type: "learn", kicker: "The idea",
        prompt: "The **$y$-intercept** is where the line meets the $y$-axis: there $x = 0$. The **$x$-intercept** is where it meets the $x$-axis: there $y = 0$. Plot both and join them.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $2x + 3y = 12$ by its intercepts.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "2(0) + 3y = 12 \\ \\Rightarrow \\ y = 4", say: "Put $x = 0$ and solve.", fig: grid("The y-intercept (0, 4).", [dot(0, 4, "orange", "(0, 4)", "ne")], { x: [-2, 8], y: [-2, 6], u: 24 }) },
          { step: 2, m: "2x + 3(0) = 12 \\ \\Rightarrow \\ x = 6", say: "Put $y = 0$ and solve.", ask: { prompt: "What is $12 \\div 2$?", answer: 0, options: [{ t: "$6$" }, { t: "$10$", fb: "$2x = 12$: divide by 2." }] }, fig: grid("The y-intercept (0, 4) and the x-intercept (6, 0).", [dot(0, 4, "orange"), dot(6, 0, "blue", "(6, 0)", "ne")], { x: [-2, 8], y: [-2, 6], u: 24 }) },
          { step: 3, m: "\\text{line through } (0, 4) \\text{ and } (6, 0)", say: "Join the two points.", fig: grid("The line through (0, 4) and (6, 0).", curve(function (x) { return 4 - 2 * x / 3; }, -2, 7, "blue", [-2, 6]).concat([dot(0, 4, "orange"), dot(6, 0, "blue")]), { x: [-2, 8], y: [-2, 6], u: 24 }) }] },
        gate: true, then: "$(0, 4)$ and $(6, 0)$: the line is drawn without solving for $y$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the intercepts of $3x - 2y = 6$.",
        how: HOW_5, skill: "Intercepts",
        steps: [
          { step: 1, ask: "Put $x = 0$. What is $y$?", type: "num", pre: "$y =$", answer: -3, near: [{ v: 3, fb: "$-2y = 6$, so $y = -3$: divide by $-2$." }], hint: "$-2y = 6$.", m: "-2y = 6 \\ \\Rightarrow \\ y = -3", say: "The $y$-intercept is $(0, -3)$." },
          { step: 2, ask: "Put $y = 0$. What is $x$?", type: "num", pre: "$x =$", answer: 2, near: [{ v: 6, fb: "$3x = 6$: divide by 3." }], hint: "$3x = 6$.", m: "3x = 6 \\ \\Rightarrow \\ x = 2", say: "The $x$-intercept is $(2, 0)$." },
          { step: 3, ask: "The line goes through $(0, -3)$ and $(2, 0)$. Does it rise or fall to the right?", type: "choice", answer: 0, options: [{ t: "It rises" }, { t: "It falls", fb: "From $-3$ up to 0 as $x$ grows: it rises." }], m: "\\text{slope} = \\frac{3}{2} > 0", say: "Rising." }],
        why: "Both intercepts, then join them. Now place them yourself." },
      { type: "plane", kicker: "On your own", prompt: "Find the intercepts of $4x + 2y = 8$ and drag $A$ and $B$ onto them.",
        x: [-6, 6], y: [-6, 6], points: [{ id: "A", x: -2, y: -2, drag: true, label: "A" }, { id: "B", x: 3, y: 3, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) { var p = st.pt("A"), q = st.pt("B"), ok = (p.x === 2 && p.y === 0 && q.x === 0 && q.y === 4) || (q.x === 2 && q.y === 0 && p.x === 0 && p.y === 4); return ok ? { ok: true } : { ok: false, say: "Put $x = 0$: $2y = 8$, so $y = 4$. Put $y = 0$: $4x = 8$, so $x = 2$." }; },
        answer: { points: { A: [2, 0], B: [0, 4] } }, skill: "Intercepts", hints: ["$x = 0$ gives one, $y = 0$ gives the other."], why: "$(2, 0)$ and $(0, 4)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two lines with **one** variable. What are the intercepts of $y = -2$, and of $x = 3$?",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "y = -2: \\ x = 0 \\ \\Rightarrow \\ y = -2", say: "Every point has height $-2$. The $y$-intercept is $(0, -2)$.", fig: grid("A horizontal line at height -2 and a vertical line at x = 3.", [{ line: [[0, -2], [1, -2]], c: "blue", bare: true }, { line: [[3, 0], [3, 1]], c: "orange", bare: true }, dot(0, -2, "blue", "(0, −2)", "ne"), dot(3, 0, "orange", "(3, 0)", "ne")], { x: [-4, 6], y: [-5, 4], u: 24 }) },
          { step: 2, m: "y = 0 \\text{ never happens on } y = -2", say: "The line never reaches the $x$-axis: **no** $x$-intercept. On $x = 3$ it is the other way round.", ask: { prompt: "Does $y = -2$ cross the $x$-axis?", answer: 0, options: [{ t: "No: it runs parallel to it" }, { t: "Yes, at $x = -2$", fb: "The $x$-intercept needs $y = 0$, but every height here is $-2$." }] } },
          { step: 3, m: "y = c \\ \\text{horizontal} \\qquad x = c \\ \\text{vertical}", say: "$y = c$ is flat (slope 0) and is a function. $x = c$ is vertical, and **not** a function." }] },
        gate: true, then: "A horizontal line has no $x$-intercept (unless it is $y = 0$). A vertical line has no $y$-intercept (unless it is $x = 0$)." },
      { type: "choice", kicker: "Try it", prompt: "Which line has **no** $x$-intercept?",
        options: [{ t: "$y = 5$" }, { t: "$x = 5$", fb: "$x = 5$ meets the $x$-axis at $(5, 0)$." }, { t: "$y = x + 5$", fb: "$y = 0$ gives $x = -5$." }],
        answer: 0, skill: "Intercepts", hints: ["Can $y$ ever be 0 on this line?"], why: "Every height on $y = 5$ is 5." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lena finds the $x$-intercept of $2x + y = 6$ by putting $x = 0$, and gets 6. What is wrong?",
        options: [{ t: "$x = 0$ gives the **$y$**-intercept. For the $x$-intercept put $y = 0$: $x = 3$." }, { t: "Nothing is wrong.", fb: "The $x$-intercept is where $y = 0$, not $x = 0$." }, { t: "The intercept is $-6$.", fb: "$2(0) + y = 6$ gives $y = 6$: it is a **$y$**-intercept." }],
        answer: 0, skill: "Intercepts", hints: ["At the $x$-axis, what is $y$?"], why: "$2x + 0 = 6$ gives $x = 3$." },
      { type: "num", kicker: "Use it", prompt: "A school sells adult tickets for 3 dollars and child tickets for 2 dollars to raise exactly 12 dollars: $3a + 2c = 12$. How many adult tickets if **no** child tickets are sold?", answer: 4, skill: "Intercepts",
        near: [{ v: 6, fb: "6 is the number of child tickets when no adult tickets are sold." }], hints: ["Put $c = 0$."], why: "$3a = 12$, so $a = 4$: the $a$-intercept." }
    ]
  });

  /* ============================================== 6 · Parallel and perpendicular lines */
  var HOW_6 = [["Slopes", "Write each line as $y = mx + b$ and read its slope."],
               ["Compare", "Equal slopes: parallel. Slopes that multiply to $-1$: perpendicular."],
               ["Decide", "Otherwise: neither."]];
  LESSONS.push({
    title: "Parallel and perpendicular lines", art: "perp",
    blurb: "Book 2.2 · Lines that never meet, and lines that meet at a right angle.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is the slope of $y = 3x - 7$?", answer: 3, skill: "Slope",
        near: [{ v: -7, fb: "$-7$ is the intercept. The slope multiplies $x$." }], hints: ["The number multiplying $x$."], why: "In $y = mx + b$, $m = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Line 1 is $y = 2x + 1$. Slide the slope $m$ of Line 2. Find a slope that makes it **parallel**, and one that makes it **perpendicular**.",
        scene: { type: "sketch", x: [-6, 6], y: [-6, 6], u: 24, w: 320, gate: true, pts: {},
          params: { m: { min: -4, max: 4, step: 0.5, v: 0.5, label: "$m$" } },
          track: function (s) { return s.p.m === 2 ? "par" : s.p.m === -0.5 ? "perp" : null; },
          draw: function (s) {
            var m = s.p.m, items = [{ line: [[0, 1], [1, 3]], c: "blue", bare: true }, { line: [[0, -2], [1, -2 + m]], c: "orange", bare: true }];
            if (m === -0.5) items.push({ angle: [[-0.7, -0.4], [-1.2, -1.4], [-0.2, -1.9]], right: true, c: "green" });
            return items;
          },
          readout: function (s) { var m = s.p.m, pr = 2 * m; return "Line 2: $y = " + nm(m) + "x - 2$. Slopes $2$ and $" + nm(m) + "$: " + (m === 2 ? "**equal: parallel!**" : pr === -1 ? "**product $-1$: perpendicular!**" : "product $" + nm(pr) + "$: neither") + "<br>" + (s.tracked.par ? "✓ " : "· ") + "parallel &nbsp; " + (s.tracked.perp ? "✓ " : "· ") + "perpendicular"; },
          goal: function (s) { return s.tracked.par && s.tracked.perp; } },
        gate: true, then: "**Parallel**: equal slopes (2 and 2). **Perpendicular**: slopes 2 and $-\\frac{1}{2}$, which multiply to $-1$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Parallel** lines have the **same slope**. **Perpendicular** lines have slopes that are **negative reciprocals**: they multiply to $-1$, like $2$ and $-\\frac{1}{2}$.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "How are $y = 2x + 1$ and $y = -\\frac{1}{2}x + 3$ related?",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "m_1 = 2 \\qquad m_2 = -\\frac{1}{2}", say: "Both are already $y = mx + b$: read the slopes.", fig: plot("The lines y = 2x + 1 and y = -x/2 + 3 crossing at a right angle.", [{ f: function (x) { return 2 * x + 1; }, a: -3, b: 3, c: "blue", yr: [-4, 6] }, { f: function (x) { return -x / 2 + 3; }, a: -3, b: 6, c: "orange", yr: [-4, 6] }], [], { x: [-4, 6], y: [-4, 6], u: 22 }) },
          { step: 2, m: "2 \\cdot \\left(-\\frac{1}{2}\\right) = -1", say: "Multiply the slopes.", ask: { prompt: "Are the slopes equal?", answer: 0, options: [{ t: "No: 2 and $-\\frac{1}{2}$ differ" }, { t: "Yes", fb: "2 and $-0.5$ are different, so not parallel." }] } },
          { step: 3, m: "\\text{perpendicular}", say: "The product is $-1$: they cross at a right angle." }] },
        gate: true, then: "Product $-1$: **perpendicular**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide for $3x + 2y = 6$ (whose slope is $-\\frac{3}{2}$) and $2x - 3y = 6$.",
        how: HOW_6, skill: "Parallel and perpendicular",
        steps: [
          { step: 1, ask: "Solve $2x - 3y = 6$ for $y$. What is its slope?", type: "choice", answer: 0, options: [{ t: "$\\frac{2}{3}$" }, { t: "$-\\frac{2}{3}$", fb: "$-3y = -2x + 6$, so $y = \\frac{2}{3}x - 2$: positive." }, { t: "$-\\frac{3}{2}$", fb: "That is the slope of the **first** line." }], m: "m_1 = -\\frac{3}{2} \\qquad m_2 = \\frac{2}{3}", say: "Solve each for $y$." },
          { step: 2, ask: "Multiply the slopes. What is $-\\frac{3}{2} \\cdot \\frac{2}{3}$?", type: "num", pre: "product =", answer: -1, near: [{ v: 1, fb: "A negative times a positive is negative." }], hint: "The 3s and 2s cancel.", m: "-\\frac{3}{2} \\cdot \\frac{2}{3} = -1", say: "Exactly $-1$." },
          { step: 3, ask: "So the lines are…", type: "choice", answer: 0, options: [{ t: "perpendicular" }, { t: "parallel", fb: "Parallel needs **equal** slopes." }, { t: "neither", fb: "The product is exactly $-1$." }], m: "\\text{perpendicular}", say: "A right angle." }],
        why: "Slopes, compare, decide. Now sort some pairs." },
      { type: "sort", kicker: "On your own", prompt: "How are the two lines related?",
        bins: ["Parallel", "Perpendicular", "Neither"],
        cards: [{ t: "$y = 3x + 1$ and $y = 3x - 4$", bin: 0, fb: "Both slopes are 3." }, { t: "$y = 4x$ and $y = -\\frac{1}{4}x + 2$", bin: 1, fb: "$4 \\cdot (-\\frac{1}{4}) = -1$." }, { t: "$y = 2x + 1$ and $y = -2x + 1$", bin: 2, fb: "Slopes 2 and $-2$: the product is $-4$, not $-1$." }, { t: "$y = -\\frac{2}{3}x$ and $y = \\frac{3}{2}x + 5$", bin: 1, fb: "$-\\frac{2}{3} \\cdot \\frac{3}{2} = -1$." }, { t: "$y = \\frac{1}{2}x + 3$ and $y = 0.5x - 1$", bin: 0, fb: "$\\frac{1}{2} = 0.5$." }],
        skill: "Parallel and perpendicular", hints: ["Equal, or multiplying to $-1$?"], why: "Equal slopes: parallel. Product $-1$: perpendicular. Anything else: neither." },
      { type: "learn", kicker: "A harder case",
        prompt: "Slopes of 0 and **undefined**. Are the lines $y = 5$ and $x = 2$ perpendicular?",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "y = 5: \\ m = 0 \\qquad x = 2: \\ m \\ \\text{undefined}", say: "A flat line has slope 0. A vertical line has no slope.", fig: grid("A horizontal line at height 5 and a vertical line at x = 2, crossing at (2, 5).", [{ line: [[0, 5], [1, 5]], c: "blue", bare: true }, { line: [[2, 0], [2, 1]], c: "orange", bare: true }, { pt: [2, 5], c: "green" }], { x: [-2, 6], y: [-1, 8], u: 24 }) },
          { step: 2, m: "0 \\cdot \\text{(undefined)}", say: "The product rule cannot be used: a vertical line has no slope to multiply.", ask: { prompt: "Can we use the “product is $-1$” test here?", answer: 0, options: [{ t: "No: one slope is undefined" }, { t: "Yes", fb: "There is no number to multiply." }] } },
          { step: 3, m: "\\text{perpendicular}", say: "But look at the picture: a horizontal and a vertical line **always** meet at a right angle." }] },
        gate: true, then: "Horizontal and vertical lines are perpendicular, even though the slope rule cannot show it." },
      { type: "choice", kicker: "Try it", prompt: "A line has slope $\\frac{3}{5}$. A perpendicular line has slope…",
        options: [{ t: "$-\\frac{5}{3}$" }, { t: "$-\\frac{3}{5}$", fb: "That only flips the sign. Flip the fraction too." }, { t: "$\\frac{5}{3}$", fb: "That flips the fraction but keeps the sign." }],
        answer: 0, skill: "Parallel and perpendicular", hints: ["Flip it **and** change the sign."], why: "$\\frac{3}{5} \\cdot (-\\frac{5}{3}) = -1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mo says $y = 2x$ and $y = -2x$ are perpendicular, because the slopes are opposites. What is wrong?",
        options: [{ t: "Opposites are not enough: perpendicular slopes multiply to $-1$, and $2 \\cdot (-2) = -4$." }, { t: "Nothing is wrong.", fb: "Test: the product is $-4$, not $-1$." }, { t: "They are parallel.", fb: "The slopes differ, so not parallel." }],
        answer: 0, skill: "Parallel and perpendicular", hints: ["Multiply the two slopes."], why: "They are the mirror images in the $y$-axis, not perpendicular." },
      { type: "choice", kicker: "Use it", prompt: "Two streets: Main St is $y = 3x - 1$ and Oak St is $y = -\\frac{1}{3}x + 4$. How do they meet?",
        options: [{ t: "At a right angle" }, { t: "They are parallel", fb: "The slopes 3 and $-\\frac{1}{3}$ differ." }, { t: "At an angle that is not a right angle", fb: "$3 \\cdot (-\\frac{1}{3}) = -1$: a right angle." }],
        answer: 0, skill: "Parallel and perpendicular", hints: ["Multiply the slopes."], why: "The product is $-1$." }
    ]
  });

  /* ================================== 7 · Writing parallel and perpendicular lines */
  var HOW_7 = [["The slope", "Parallel: the same slope. Perpendicular: the negative reciprocal."],
               ["The point", "Put the given point into $y - y_1 = m(x - x_1)$."],
               ["Simplify", "Solve for $y$."]];
  LESSONS.push({
    title: "Writing parallel and perpendicular lines", art: "proofpar",
    blurb: "Book 2.2 · A line through a given point, parallel or perpendicular to a given line.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is the negative reciprocal of 4?",
        options: [{ t: "$-\\frac{1}{4}$" }, { t: "$-4$", fb: "That is only the negative. The reciprocal flips the number: $\\frac{1}{4}$." }, { t: "$\\frac{1}{4}$", fb: "That is only the reciprocal: it also needs the minus." }],
        answer: 0, skill: "Reciprocals", hints: ["Flip it, then change its sign."], why: "$4 = \\frac{4}{1}$ flips to $\\frac{1}{4}$, and the sign changes: $-\\frac{1}{4}$." },
      { type: "learn", kicker: "Explore",
        prompt: "The grey line is $y = 2x - 1$. The point $Q = (2, 5)$ is marked. Slide $m$ to turn a line round $Q$. Find the one that is **parallel**, and the one that is **perpendicular**.",
        scene: { type: "sketch", x: [-3, 7], y: [-3, 9], u: 26, w: 300, gate: true, pts: {},
          params: { m: { min: -3, max: 3, step: 0.5, v: 1, label: "$m$" } },
          track: function (s) { return s.p.m === 2 ? "par" : s.p.m === -0.5 ? "perp" : null; },
          draw: function (s) {
            var m = s.p.m;
            return [{ line: [[0, -1], [1, 1]], c: "soft", bare: true }, { line: [[2, 5], [3, 5 + m]], c: "orange", bare: true }, { pt: [2, 5], c: "green", name: "Q", at: "ne" }];
          },
          readout: function (s) { var m = s.p.m; return "slope $" + nm(m) + "$: " + (m === 2 ? "**parallel** to the grey line" : m === -0.5 ? "**perpendicular** to the grey line" : "neither") + "<br>" + (s.tracked.par ? "✓ " : "· ") + "parallel &nbsp; " + (s.tracked.perp ? "✓ " : "· ") + "perpendicular"; },
          goal: function (s) { return s.tracked.par && s.tracked.perp; } },
        gate: true, then: "Slope $2$ (the same) through $Q$ is parallel. Slope $-\\frac{1}{2}$ (negative reciprocal) is perpendicular. Then only the **point** is left to use." },
      { type: "learn", kicker: "The idea",
        prompt: "To write a line through a point, first decide the **slope you need**: the **same** as the given line for parallel, its **negative reciprocal** for perpendicular. Then use the point in point-slope form.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write the line **parallel** to $y = 3x + 1$ through $(2, 4)$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "m = 3", say: "Parallel lines share a slope." },
          { step: 2, m: "y - 4 = 3(x - 2)", say: "The point $(2, 4)$ and the slope 3.", ask: { prompt: "Which number is $x_1$?", answer: 0, options: [{ t: "$2$" }, { t: "$4$", fb: "4 is $y_1$: the second number of the point." }] } },
          { step: 3, m: "y = 3x - 6 + 4 = 3x - 2", say: "Multiply out and add 4.", fig: plot("The line y = 3x + 1 and the parallel line y = 3x - 2 through (2, 4).", [{ f: function (x) { return 3 * x + 1; }, a: -2, b: 3, c: "soft", yr: [-5, 8] }, { f: function (x) { return 3 * x - 2; }, a: -2, b: 3, c: "blue", yr: [-5, 8] }], [dot(2, 4, "orange", "(2, 4)", "se")], { x: [-3, 4], y: [-5, 8], u: 20 }) }] },
        gate: true, then: "$y = 3x - 2$: parallel to $y = 3x + 1$, and through $(2, 4)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now write the line **perpendicular** to $y = 2x - 3$ through $(4, 1)$.",
        how: HOW_7, skill: "Parallel and perpendicular lines",
        steps: [
          { step: 1, ask: "What slope do you need?", type: "choice", answer: 0, options: [{ t: "$-\\frac{1}{2}$" }, { t: "$2$", fb: "That is the slope of the given line: it would be parallel." }, { t: "$-2$", fb: "Flip it as well: the negative **reciprocal**." }], m: "m = -\\frac{1}{2}", say: "Negative reciprocal of 2." },
          { step: 2, ask: "Write it with the point $(4, 1)$. After $y - 1 = -\\frac{1}{2}(x - 4)$, what is $-\\frac{1}{2} \\cdot (-4)$?", type: "num", pre: "$=$", answer: 2, near: [{ v: -2, fb: "A negative times a negative is positive." }], hint: "$\\frac{1}{2} \\cdot 4$.", m: "y - 1 = -\\frac{1}{2}x + 2", say: "Multiply out." },
          { step: 3, ask: "Add 1 to both sides. What is $b$?", type: "num", pre: "$b =$", answer: 3, near: [{ v: 2, fb: "$2 + 1 = 3$." }], hint: "$2 + 1$.", m: "y = -\\frac{1}{2}x + 3", say: "Done." }],
        why: "The slope you need, the point, simplify. Now type one." },
      { type: "equation", kicker: "On your own", prompt: "Write the line **parallel** to $y = -2x + 5$ through $(1, 0)$, as $y = mx + b$.",
        answer: "y=-2x+2", shown: "y = -2x + 2", form: "slope-intercept", skill: "Parallel and perpendicular lines",
        near: [{ v: "y=-2x+5", fb: "That is the given line. It has to pass through $(1, 0)$." }, { v: "y=2x-2", fb: "Parallel means the **same** slope, $-2$." }],
        hints: ["$y - 0 = -2(x - 1)$."], why: "$y = -2x + 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The given line is in **standard form**. Write the line perpendicular to $3x + 2y = 6$ through $(3, 4)$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "2y = -3x + 6 \\ \\Rightarrow \\ y = -\\frac{3}{2}x + 3", say: "First find the slope of the given line: it is $-\\frac{3}{2}$." },
          { step: 1, m: "m_{\\perp} = \\frac{2}{3}", say: "The perpendicular slope: flip and change the sign.", ask: { prompt: "What is the negative reciprocal of $-\\frac{3}{2}$?", answer: 0, options: [{ t: "$\\frac{2}{3}$" }, { t: "$-\\frac{2}{3}$", fb: "The sign must change: negative becomes positive." }] } },
          { step: 2, m: "y - 4 = \\frac{2}{3}(x - 3)", say: "Use $(3, 4)$." },
          { step: 3, m: "y = \\frac{2}{3}x - 2 + 4 = \\frac{2}{3}x + 2", say: "$\\frac{2}{3} \\cdot 3 = 2$: multiply out, then add 4." }] },
        gate: true, then: "$y = \\frac{2}{3}x + 2$." },
      { type: "choice", kicker: "Try it", prompt: "Which line is perpendicular to $y = \\frac{1}{3}x + 2$ and passes through $(0, 5)$?",
        options: [{ t: "$y = -3x + 5$" }, { t: "$y = 3x + 5$", fb: "Perpendicular needs the **negative** reciprocal: $-3$." }, { t: "$y = \\frac{1}{3}x + 5$", fb: "That is parallel." }],
        answer: 0, skill: "Parallel and perpendicular lines", hints: ["The point $(0, 5)$ gives $b = 5$."], why: "$m = -3$ and $b = 5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sia writes the line perpendicular to $y = 3x$ through $(0, 1)$ as $y = -3x + 1$. What is wrong?",
        options: [{ t: "The slope should be $-\\frac{1}{3}$, the negative **reciprocal**." }, { t: "Nothing is wrong.", fb: "Test the product: $3 \\cdot (-3) = -9$, not $-1$." }, { t: "The intercept should be 3.", fb: "The point $(0, 1)$ gives $b = 1$." }],
        answer: 0, skill: "Parallel and perpendicular lines", hints: ["Slopes multiply to $-1$."], why: "$y = -\\frac{1}{3}x + 1$." },
      { type: "num", kicker: "Use it", prompt: "Main Street is $y = -\\frac{1}{3}x + 2$. A new street is built perpendicular to it through $(3, 1)$. What is the **slope** of the new street?", pre: "$m =$", answer: 3, skill: "Parallel and perpendicular lines",
        near: [{ v: -3, fb: "Change the sign too: the negative reciprocal of $-\\frac{1}{3}$ is $3$." }, { v: 1 / 3, tol: 1e-9, fb: "Flip it and change the sign: $-\\frac{1}{3} \\to 3$." }], hints: ["Flip $-\\frac{1}{3}$ and change its sign."], why: "The new street has slope 3: $y = 3x - 8$." }
    ]
  });
  /* ======================================== 8 · Modeling with a linear function */
  var HOW_8 = [["Start", "What is the output when the input is 0? That is $b$."],
               ["Rate", "How much does the output change for each 1 of input? That is $m$."],
               ["Use it", "Write $f(x) = mx + b$, then evaluate it or solve with it."]];
  var PL8 = function (w) { return 2 * w + 3; };
  LESSONS.push({
    title: "Modeling with a linear function", art: "pcline",
    blurb: "Book 2.3 · Turn a story into $f(x) = mx + b$, and use it to answer questions.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A band has 120 songs and adds 15 songs every month. How many after 2 months?", answer: 150, skill: "Evaluate a function",
        near: [{ v: 30, fb: "That is the new songs only. The band already had 120." }, { v: 135, fb: "That is one month. Two months add $2 \\cdot 15$." }], hints: ["$120 + 2 \\cdot 15$."], why: "$120 + 30 = 150$ songs." },
      { type: "learn", kicker: "Explore",
        prompt: "A plant is 3 cm tall and grows 2 cm each week: $h(w) = 2w + 3$. Slide the week. **When is it 11 cm tall?**",
        scene: slide(PL8, { x: [-1, 7], y: [-1, 16], from: 0, snap: 1, xlim: [0, 6], name: "h",
          goal: function (s) { return s.P[1] === 11; },
          read: function (x, y) { return "week " + nm(x) + ": $h(" + nm(x) + ") = " + nm(y) + "$ cm" + (y === 11 ? " ✓ 11 cm!" : ""); } }),
        gate: true, then: "$2w + 3 = 11$ gives $w = 4$. A linear model answers both: **what is the output?** and **when is it this big?**" },
      { type: "learn", kicker: "The idea",
        prompt: "To model a story with a line, find two things: where it **starts** (the value at input 0) and how fast it **changes** (the change for each 1 of input). Then $f(x) = mx + b$ answers questions about it.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "A music app has 120 songs and adds 15 a month. How many songs after 6 months?",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "b = 120", say: "At month 0 there are 120 songs: the starting value." },
          { step: 2, m: "m = 15 \\ \\text{songs per month}", say: "Each month adds 15: the rate.", ask: { prompt: "Which number multiplies the months?", answer: 0, options: [{ t: "$15$, the rate" }, { t: "$120$", fb: "120 is the starting value: added once." }] } },
          { step: 3, m: "N(t) = 15t + 120", say: "Rate times months, plus the start." },
          { step: 3, m: "N(6) = 15(6) + 120 = 210", say: "Put in $t = 6$: 210 songs." }] },
        gate: true, then: "After 6 months: **210 songs**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you model a sales job. It pays 500 dollars a week plus 20 dollars for each sale.",
        how: HOW_8, skill: "Linear models",
        steps: [
          { step: 1, ask: "What is the starting value?", type: "num", pre: "$b =$", answer: 500, near: [{ v: 20, fb: "20 is paid for each sale. The pay with **no** sales is the fixed 500." }], hint: "The pay when there are 0 sales.", m: "b = 500", say: "The fixed weekly pay." },
          { step: 2, ask: "What is the rate, in dollars per sale?", type: "num", pre: "$m =$", answer: 20, near: [{ v: 500, fb: "The rate is what each extra sale adds." }], hint: "Each sale adds…", m: "m = 20", say: "Dollars per sale." },
          { step: 3, ask: "Use $P(s) = 20s + 500$. What is the pay for 7 sales?", type: "num", pre: "$P(7) =$", answer: 640, near: [{ v: 140, fb: "That is only the commission. Add the 500 dollars." }], hint: "$20(7) + 500$.", m: "P(7) = 140 + 500 = 640", say: "640 dollars." }],
        why: "Start, rate, use. Now work backwards." },
      { type: "num", kicker: "On your own", prompt: "A pool holds 80 litres and drains 4 litres every minute: $V(t) = 80 - 4t$. After how many minutes does it hold 40 litres?", pre: "$t =$", post: "minutes", answer: 10, skill: "Linear models",
        near: [{ v: 20, fb: "That is when it is empty: $80 - 4t = 0$. Solve $80 - 4t = 40$." }, { v: 40, fb: "40 is the volume. Solve for the minutes." }], hints: ["$80 - 4t = 40$."], why: "$-4t = -40$, so $t = 10$ minutes." },
      { type: "learn", kicker: "A harder case",
        prompt: "No story to read, just **two data points**: the cost of 3 items is 19 dollars and the cost of 5 items is 29. Find $C(n)$ and the cost of 10 items.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\text{rate} = \\frac{29 - 19}{5 - 3} = 5", say: "No $n = 0$ given: find the rate first. 5 dollars per item.", ask: { prompt: "What is $\\frac{29 - 19}{5 - 3}$?", answer: 0, options: [{ t: "$5$" }, { t: "$10$", fb: "Divide by the change in items, 2." }] } },
          { step: 2, m: "C(3) = 5(3) + b = 19 \\ \\Rightarrow \\ b = 4", say: "Use one point to find the start: a 4-dollar fixed charge." },
          { step: 3, m: "C(n) = 5n + 4 \\quad C(10) = 54", say: "Ten items cost 54 dollars." }] },
        gate: true, then: "Two data points always give a line: rate first, then the start." },
      { type: "choice", kicker: "Try it", prompt: "$f(10) = 60$, where $f(x) = 5x + 10$ is a taxi fare in dollars for $x$ kilometres. What does it say?",
        options: [{ t: "A 10 km trip costs 60 dollars" }, { t: "A 60 km trip costs 10 dollars", fb: "The input is inside the brackets: 10 km." }, { t: "The fare rises 60 dollars per km", fb: "The rate is the 5." }],
        answer: 0, skill: "Linear models", hints: ["Input inside the brackets, output on the right."], why: "Input 10 km, output 60 dollars." },
      { type: "choice", kicker: "Find the error",
        prompt: "A skate park charges 5 dollars to enter plus 3 dollars per hour. Ana writes $C(h) = 5h + 3$. What is wrong?",
        options: [{ t: "The rate multiplies the hours: $C(h) = 3h + 5$." }, { t: "Nothing is wrong.", fb: "Check 0 hours: her formula gives 3 dollars, but entry alone costs 5." }, { t: "It should be $8h$.", fb: "The entry fee is paid once, not per hour." }],
        answer: 0, skill: "Linear models", hints: ["Test $h = 0$: what should it cost?"], why: "$C(0)$ should be the entry fee, 5." },
      { type: "num", kicker: "Use it", prompt: "A taxi charges 3 dollars plus 2 dollars per kilometre. How much for a 9 km trip?", post: "dollars", answer: 21, skill: "Linear models",
        near: [{ v: 18, fb: "That is only the distance charge. Add the 3 dollars." }, { v: 45, fb: "The 3 is added once: $3 + 2 \\cdot 9$." }], hints: ["$2(9) + 3$."], why: "$18 + 3 = 21$ dollars." }
    ]
  });

  /* ========================================================== 9 · Where two lines meet */
  var HOW_9 = [["Two functions", "Write a linear function for each situation, with the same input."],
               ["Set equal", "Set the two formulas equal and solve for $x$."],
               ["Say it", "Check that both give the same output, then say what it means."]];
  var PA9 = function (x) { return x + 2; }, PB9 = function (x) { return 2 * x; };
  LESSONS.push({
    title: "Where two lines meet", art: "pcsys",
    blurb: "Book 2.3 · Compare two plans: when are they equal, and which is cheaper before and after?",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $x + 4 = 2x$.", pre: "$x =$", answer: 4, skill: "Solve a linear equation",
        near: [{ v: 0, fb: "Subtract $x$ from both sides: $4 = x$." }], hints: ["Subtract $x$ from both sides."], why: "$4 = x$." },
      { type: "learn", kicker: "Explore",
        prompt: "**Plan A** costs 2 dollars to join, then 1 dollar a ride: $A(x) = x + 2$. **Plan B** has no fee, 2 dollars a ride: $B(x) = 2x$. Slide the number of rides. When are they **equal**?",
        scene: { type: "sketch", x: [-1, 8], y: [-1, 12], u: 24, w: 300, gate: true,
          pts: { P: { at: [0, 0], drag: true, c: "orange", snap: 1, on: { fn: function (p) { return [Math.max(0, Math.min(6, Math.round(p[0]))), 0]; } }, say: "Number of rides" } },
          track: function (s) { return PA9(s.P[0]) === PB9(s.P[0]) ? "eq" : null; },
          draw: function (s) {
            var x = s.P[0];
            return curve(PA9, 0, 7, "blue", [-1, 12]).concat(curve(PB9, 0, 6.2, "orange", [-1, 12]), [{ seg: [[x, 0], [x, PA9(x)]], c: "blue", dash: true }, { seg: [[x + 0.15, 0], [x + 0.15, PB9(x)]], c: "orange", dash: true }, { pt: [x, PA9(x)], c: "blue" }, { pt: [x + 0.15, PB9(x)], c: "orange" }]);
          },
          readout: function (s) { var x = s.P[0], a = PA9(x), b = PB9(x); return nm(x) + " rides: Plan A costs " + nm(a) + ", Plan B costs " + nm(b) + " — " + (a === b ? "**equal!** ✓" : a < b ? "A is cheaper" : "B is cheaper"); },
          goal: function (s) { return !!s.tracked.eq; } },
        gate: true, then: "At **2 rides** both cost 4. Before that B is cheaper; after that A is cheaper. The lines **cross** where the plans are equal." },
      { type: "learn", kicker: "The idea",
        prompt: "Where two lines **meet**, both functions give the **same output** for the same input. To find it, write each plan as a function, **set them equal**, and solve.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Plan A: 4 dollars to join and 1 dollar a ride. Plan B: 2 dollars a ride. When do they cost the same?",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "A(x) = x + 4 \\qquad B(x) = 2x", say: "Both are functions of the number of rides $x$.", fig: plot("The lines A = x + 4 and B = 2x meeting at (4, 8).", [{ f: function (x) { return x + 4; }, a: 0, b: 6, c: "blue", yr: [-1, 12] }, { f: function (x) { return 2 * x; }, a: 0, b: 6, c: "orange", yr: [-1, 12] }], [], { x: [-1, 7], y: [-1, 12], u: 22 }) },
          { step: 2, m: "x + 4 = 2x", say: "Set the two costs equal.", ask: { prompt: "Which step comes next?", answer: 0, options: [{ t: "Subtract $x$: $4 = x$" }, { t: "Add 4 to both sides", fb: "That moves in the wrong direction: gather the $x$ terms." }] } },
          { step: 2, m: "4 = x", say: "Four rides." },
          { step: 3, m: "A(4) = 8 = B(4)", say: "Both cost 8 dollars at 4 rides.", fig: plot("The lines meet at the point (4, 8).", [{ f: function (x) { return x + 4; }, a: 0, b: 6, c: "blue", yr: [-1, 12] }, { f: function (x) { return 2 * x; }, a: 0, b: 6, c: "orange", yr: [-1, 12] }], [dot(4, 8, "green", "(4, 8)", "se")], { x: [-1, 7], y: [-1, 12], u: 22 }) }] },
        gate: true, then: "They meet at $(4, 8)$: **4 rides, 8 dollars**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you compare two plans. Plan 1: $C_1(t) = 3t + 12$. Plan 2: $C_2(t) = 5t + 4$.",
        how: HOW_9, skill: "Where two lines meet",
        steps: [
          { step: 1, ask: "Which equation says the plans cost the same?", type: "choice", answer: 0, options: [{ t: "$3t + 12 = 5t + 4$" }, { t: "$3t + 12 = 5t + 4t$", fb: "Plan 2's cost is $5t + 4$ all together." }], m: "3t + 12 = 5t + 4", say: "Set them equal." },
          { step: 2, ask: "Subtract $3t$ and $4$ to get $8 = 2t$. What is $t$?", type: "num", pre: "$t =$", answer: 4, near: [{ v: 16, fb: "Divide 8 by 2." }], hint: "$8 \\div 2$.", m: "8 = 2t \\ \\Rightarrow \\ t = 4", say: "At 4 hours." },
          { step: 3, ask: "What do both plans cost then?", type: "num", pre: "cost =", answer: 24, near: [{ v: 4, fb: "4 is the time. Put it in $3t + 12$." }], hint: "$3(4) + 12$.", m: "C_1(4) = 24 = C_2(4)", say: "24 dollars." }],
        why: "Two functions, set equal, say it. Now one more." },
      { type: "num", kicker: "On your own", prompt: "$A(x) = 3x + 2$ and $B(x) = x + 8$. For which $x$ are they equal?", pre: "$x =$", answer: 3, skill: "Where two lines meet",
        near: [{ v: 5, fb: "$3x + 2 = x + 8$: subtract $x$ and 2 to get $2x = 6$." }, { v: 11, fb: "That is the sum of the constants. Solve $2x = 6$." }], hints: ["$3x + 2 = x + 8$."], why: "$2x = 6$, so $x = 3$: both give 11." },
      { type: "learn", kicker: "A harder case",
        prompt: "After they meet, **which is cheaper**? Plan A: $A(x) = x + 4$. Plan B: $B(x) = 2x$. They meet at $x = 4$. Which plan is cheaper for 6 rides?",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "A(6) = 10 \\qquad B(6) = 12", say: "Work out both costs at 6 rides." },
          { step: 2, m: "10 < 12", say: "Plan A costs less.", ask: { prompt: "Which plan is cheaper at 6 rides?", answer: 0, options: [{ t: "Plan A" }, { t: "Plan B", fb: "B costs 12, A costs 10." }] } },
          { step: 3, m: "x < 4: B \\ \\text{cheaper} \\qquad x > 4: A \\ \\text{cheaper}", say: "Plan B's steeper line is below Plan A's before the meeting point and above it after: B costs more as the rides pile up." }] },
        gate: true, then: "The meeting point is where the **better deal changes**." },
      { type: "choice", kicker: "Try it", prompt: "A gym: Plan X is 30 dollars + 10 per month. Plan Y is 20 per month. For how many months do the plans cost the same?",
        options: [{ t: "3 months" }, { t: "1 month", fb: "$30 + 10(1) = 40$, but $20(1) = 20$." }, { t: "6 months", fb: "$30 + 10(6) = 90$, but $20(6) = 120$." }],
        answer: 0, skill: "Where two lines meet", hints: ["$30 + 10m = 20m$."], why: "$30 = 10m$, so $m = 3$: both cost 90 dollars." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kai solves $2x + 6 = 5x$ and gets $x = 6$. What is wrong?",
        options: [{ t: "Subtracting $2x$ leaves $6 = 3x$, so $x = 2$." }, { t: "Nothing is wrong.", fb: "Check: $2(6) + 6 = 18$, but $5(6) = 30$." }, { t: "It should be $x = 12$.", fb: "$2(12) + 6 = 30$ but $5(12) = 60$." }],
        answer: 0, skill: "Where two lines meet", hints: ["Subtract $2x$ from both sides."], why: "$6 = 3x$, so $x = 2$." },
      { type: "choice", kicker: "Use it", prompt: "Two plumbers: Jo charges 40 dollars + 20 per hour; Lee charges 30 per hour. For a 5-hour job, who is cheaper?",
        options: [{ t: "Jo: 140 dollars against 150" }, { t: "Lee: 150 dollars against 160", fb: "Jo: $40 + 20(5) = 140$. Lee: $30(5) = 150$." }, { t: "The same", fb: "They are equal at 4 hours, not 5." }],
        answer: 0, skill: "Where two lines meet", hints: ["Work out both costs at 5 hours."], why: "Jo $= 140$, Lee $= 150$. They are equal at 4 hours." }
    ]
  });
  /* ========================================================= 10 · Lines of fit */
  var HOW_10 = [["Plot", "Plot the data as points."],
                ["Draw a line", "Draw a line that passes as close as possible to the points: about as many above as below."],
                ["Read it", "Take two points **on your line** and find its equation."]];
  var D10 = [[1, 2], [2, 2], [3, 5], [4, 4], [5, 7], [6, 6], [7, 9]];
  function sse10(a, b) { return D10.reduce(function (t, p) { var g = p[1] - (a + (b - a) * p[0] / 8); return t + g * g; }, 0); }
  function scatterFig(alt, data, extra, o) { return grid(alt, data.map(function (p) { return dot(p[0], p[1], "blue"); }).concat(extra || []), o || { x: [-1, 9], y: [-1, 11], u: 22 }); }
  LESSONS.push({
    title: "Lines of fit", art: "pcline",
    blurb: "Book 2.4 · Data points that follow a trend, and the line that follows them.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "As $x$ goes up, the points **mostly go up**. The trend is…",
        options: [{ t: "positive" }, { t: "negative", fb: "A negative trend goes **down** as $x$ goes up." }, { t: "none", fb: "Going up is a trend." }],
        answer: 0, skill: "Scatter plots", hints: ["Up as you go right: the slope would be positive."], why: "Rising to the right: a positive trend." },
      { type: "learn", kicker: "Explore",
        prompt: "The blue dots are real measurements. Slide the two **orange ends** up or down to lay a line through them. The dashed gaps are the **errors**. Make the total of their squares **6.5 or less**.",
        scene: { type: "sketch", x: [-1, 9], y: [-1, 11], u: 26, w: 340, gate: true,
          pts: { L: { at: [0, 4], drag: true, c: "orange", snap: 0.5, on: { x: 0 }, say: "Left end of the line" }, R: { at: [8, 3], drag: true, c: "orange", snap: 0.5, on: { x: 8 }, say: "Right end of the line" } },
          draw: function (s) {
            var a = s.L[1], b = s.R[1], items = [{ line: [[0, a], [8, b]], c: "green", bare: true }];
            D10.forEach(function (p) { var yh = a + (b - a) * p[0] / 8; items.push({ seg: [p, [p[0], yh]], c: "orange", dash: true }); });
            D10.forEach(function (p) { items.push({ pt: p, c: "blue" }); });
            return items;
          },
          readout: function (s) { var t = sse10(s.L[1], s.R[1]); return "total of the squared gaps: **" + nm(Math.round(t * 10) / 10) + "**" + (t <= 6.5 ? " ✓ a good fit" : " — keep going"); },
          goal: function (s) { return sse10(s.L[1], s.R[1]) <= 6.5; } },
        gate: true, then: "A good line has **small gaps on both sides**: about as many dots above as below. The very best line has a total of about 5.7: yours is close." },
      { type: "learn", kicker: "The idea",
        prompt: "When data follow a trend, a **line of fit** summarises it. It need not pass through any data point: it should pass **close to all of them**, with gaps above and below. Its equation lets you predict.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a line of fit drawn for these seven points.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "(1,\\ 2),\\ (2,\\ 2),\\ (3,\\ 5),\\ (4,\\ 4),\\ (5,\\ 7),\\ (6,\\ 6),\\ (7,\\ 9)", say: "Plot them. They climb, but not in a perfectly straight line.", fig: scatterFig("Seven points rising from left to right.", D10) },
          { step: 2, m: "\\text{through } (0, 1) \\text{ and } (8, 9)", say: "Lay a line through the middle of the cloud: some points above it, some below.", ask: { prompt: "What makes a line of fit good?", answer: 0, options: [{ t: "It stays close to all the points, with some above and some below" }, { t: "It goes through the first and last points", fb: "That can leave every other point on one side." }] }, fig: scatterFig("The points with a rising line through their middle.", D10, [{ line: [[0, 1], [8, 9]], c: "green", bare: true }, dot(0, 1, "orange"), dot(8, 9, "orange")]) },
          { step: 3, m: "m = \\frac{9 - 1}{8 - 0} = 1 \\qquad b = 1", say: "Use two points **on the line**, $(0, 1)$ and $(8, 9)$, not data points." },
          { step: 3, m: "y = x + 1", say: "The line of fit." }] },
        gate: true, then: "$y = x + 1$. Two points on the line fixed its slope and intercept." },
      { type: "guided", kicker: "Together",
        prompt: "Now you read a line of fit. It passes through $(0, 2)$ and $(5, 12)$.",
        how: HOW_10, skill: "Lines of fit",
        steps: [
          { step: 1, ask: "Why can we use $(0, 2)$ and $(5, 12)$ even if no data point is there?", type: "choice", answer: 0, options: [{ t: "They are on the **line**, and the line is what we want" }, { t: "They must be data points", fb: "The line need not touch any data point." }], m: "(0,\\ 2) \\ \\text{and} \\ (5,\\ 12)", say: "Points on the line." },
          { step: 2, ask: "Find the slope.", type: "num", pre: "$m =$", answer: 2, near: [{ v: 0.5, fb: "Rise over run: $\\frac{12 - 2}{5 - 0}$." }], hint: "$\\frac{10}{5}$.", m: "m = \\frac{12 - 2}{5 - 0} = 2", say: "Rises 2 per step." },
          { step: 3, ask: "The line passes through $(0, 2)$. What is $b$?", type: "num", pre: "$b =$", answer: 2, near: [{ v: 12, fb: "$(5, 12)$ is not on the $y$-axis. $(0, 2)$ is." }], hint: "$x = 0$.", m: "y = 2x + 2", say: "The line of fit." }],
        why: "Plot, draw, read. Now choose the best line." },
      { type: "choice", kicker: "On your own", prompt: "Which line fits these five points best?" + scatterFig("Five points: (1, 3), (2, 4), (3, 7), (4, 8), (5, 11).", [[1, 3], [2, 4], [3, 7], [4, 8], [5, 11]], [], { x: [-1, 7], y: [-1, 13], u: 20 }),
        options: [{ t: "$y = 2x + 1$" }, { t: "$y = 2x + 5$", fb: "That line sits above every point: all the gaps are on one side." }, { t: "$y = -2x + 12$", fb: "The points go **up**; this line goes **down**." }],
        answer: 0, skill: "Lines of fit", hints: ["The slope should be positive and the line should pass among the points."], why: "$y = 2x + 1$ passes through the middle of the cloud." },
      { type: "learn", kicker: "A harder case",
        prompt: "Not every cloud has a trend. These five points have **no direction**. Should we draw a line of fit?",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "(1,\\ 3),\\ (2,\\ 5),\\ (3,\\ 1),\\ (4,\\ 4),\\ (5,\\ 2)", say: "Plot them: they jump about, up and down.", fig: scatterFig("Five points scattered with no pattern.", [[1, 3], [2, 5], [3, 1], [4, 4], [5, 2]], [], { x: [0, 6], y: [0, 6], u: 24 }) },
          { step: 2, m: "\\text{rising? falling? no}", say: "Any line you draw has points far above and far below. It would not describe them.", ask: { prompt: "Does a line through this cloud say anything useful?", answer: 0, options: [{ t: "No: there is no trend to follow" }, { t: "Yes, any line works", fb: "A line should stay close to the points. Here every line leaves large gaps." }] }, fig: scatterFig("The same points with a flat line, far from several of them.", [[1, 3], [2, 5], [3, 1], [4, 4], [5, 2]], [{ line: [[0, 3], [6, 3]], c: "green", bare: true }], { x: [0, 6], y: [0, 6], u: 24 }) },
          { step: 3, m: "\\text{no correlation: no line of fit}", say: "When the points show no trend, there is nothing to predict with. Check first that there is a trend." }] },
        gate: true, then: "A line of fit makes sense only when the points follow a **trend**." },
      { type: "sort", kicker: "Try it", prompt: "Sort the scatter plots by their **correlation**.",
        bins: ["Positive", "Negative", "None"],
        cards: [{ t: scatterFig("Points rising to the right.", [[1, 1], [2, 2], [3, 2], [4, 4], [5, 4]], [], { x: [0, 6], y: [0, 6], u: 12, grid: false }), bin: 0, fb: "Rising to the right: positive." },
                { t: scatterFig("Points falling to the right.", [[1, 5], [2, 4], [3, 4], [4, 2], [5, 1]], [], { x: [0, 6], y: [0, 6], u: 12, grid: false }), bin: 1, fb: "Falling to the right: negative." },
                { t: scatterFig("Points scattered with no pattern.", [[1, 3], [2, 5], [3, 1], [4, 4], [5, 2]], [], { x: [0, 6], y: [0, 6], u: 12, grid: false }), bin: 2, fb: "No direction: no correlation." },
                { t: scatterFig("Points rising steeply with little scatter.", [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]], [], { x: [0, 6], y: [0, 6], u: 12, grid: false }), bin: 0, fb: "A strong positive trend." }],
        skill: "Scatter plots", hints: ["Look at the direction of the cloud."], why: "Positive: up. Negative: down. None: no direction." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dev draws his line of fit through the first and last data points, because “those are real measurements”. What is wrong?",
        options: [{ t: "A line of fit should stay close to **all** the points, with gaps above and below." }, { t: "Nothing is wrong: that is always best.", fb: "If the first and last points are unusual, the line can miss all the middle ones." }, { t: "It must go through the middle point.", fb: "No single point is required." }],
        answer: 0, skill: "Lines of fit", hints: ["Which points are far from his line?"], why: "A good line balances the gaps." },
      { type: "num", kicker: "Use it", prompt: "A line of fit for a phone's battery passes through $(0, 90)$ and $(6, 60)$, where $x$ is hours and $y$ is per cent charge. By how many per cent does it fall each hour?", post: "per cent per hour", answer: -5, skill: "Lines of fit",
        near: [{ v: 5, fb: "The charge **falls**: the slope is negative." }, { v: -30, fb: "That is the total change. Divide by the 6 hours." }], hints: ["$\\frac{60 - 90}{6 - 0}$."], why: "$\\frac{-30}{6} = -5$: the line of fit is $y = -5x + 90$." }
    ]
  });

  /* ====================================================== 11 · Using a line of fit */
  var HOW_11 = [["Equation", "Write the equation of the line of fit."],
                ["Substitute", "To predict an output, put the input in. To find an input, solve for it."],
                ["Judge", "Inside the data's range: fairly safe. Far outside: a risky guess."]];
  var M11 = function (x) { return x + 2; };
  LESSONS.push({
    title: "Using a line of fit", art: "pcline",
    blurb: "Book 2.4 · Predict with a fitted line, and know how far to trust it.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $y = x + 2$ at $x = 7$.", pre: "$y =$", answer: 9, skill: "Evaluate a function",
        near: [{ v: 14, fb: "Add 2, do not multiply: $7 + 2$." }], hints: ["$7 + 2$."], why: "$7 + 2 = 9$." },
      { type: "learn", kicker: "Explore",
        prompt: "A plant was measured on days 1 to 5 (the shaded strip). The line is $h = d + 2$. Slide the day to predict the height **inside** the data, and **outside** it.",
        scene: { type: "sketch", x: [-1, 11], y: [-1, 13], u: 24, w: 340, gate: true,
          pts: { P: { at: [3, 5], drag: true, c: "orange", snap: 1, say: "The day", on: { fn: function (p) { var x = Math.max(0, Math.min(10, Math.round(p[0]))); return [x, M11(x)]; } } } },
          track: function (s) { return s.P[0] >= 1 && s.P[0] <= 5 ? "in" : "out"; },
          draw: function (s) {
            var items = [{ poly: [[1, -1], [5, -1], [5, 13], [1, 13]], c: "blue", fill: true }].concat(curve(M11, 0, 10.5, "green", [-1, 13]));
            [[1, 3], [2, 5], [3, 5], [4, 6], [5, 7]].forEach(function (p) { items.push({ pt: p, c: "blue" }); });
            items.push({ seg: [[s.P[0], 0], [s.P[0], M11(s.P[0])]], c: "orange", dash: true });
            return items;
          },
          readout: function (s) { var x = s.P[0], inside = x >= 1 && x <= 5; return "day " + nm(x) + ": predicted $" + nm(M11(x)) + "$ cm — " + (inside ? "**inside** the data: fairly safe" : "**outside** the data: a guess") + "<br>" + (s.tracked.in ? "✓ " : "· ") + "inside &nbsp; " + (s.tracked.out ? "✓ " : "· ") + "outside"; },
          goal: function (s) { return s.tracked.in && s.tracked.out; } },
        gate: true, then: "Predicting **between** measured days is **interpolation**: safe. Predicting **beyond** them is **extrapolation**: the further out, the more you are guessing." },
      { type: "learn", kicker: "The idea",
        prompt: "Once you have the line of fit, **substitute** to predict: put in an input to get an output, or solve to find the input for an output. Always ask: **is the input inside the data's range?**",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "The line of fit for a plant is $h = d + 2$, from data on days 1 to 5. Predict day 4 and day 8.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "h = d + 2", say: "The equation of the line." },
          { step: 2, m: "h(4) = 4 + 2 = 6 \\qquad h(8) = 8 + 2 = 10", say: "Substitute each day.", ask: { prompt: "What is $h(8)$?", answer: 0, options: [{ t: "$10$" }, { t: "$6$", fb: "6 is day 4." }] } },
          { step: 3, m: "\\text{day 4: inside} \\qquad \\text{day 8: outside}", say: "Day 4 is within days 1–5: fairly safe. Day 8 is beyond them: a guess, because the plant may not keep growing at the same rate." }] },
        gate: true, then: "Day 4: **6 cm**, a safe prediction. Day 8: **10 cm**, only a guess." },
      { type: "guided", kicker: "Together",
        prompt: "Now you use $h = d + 2$ backwards. On which day is the plant 9 cm tall?",
        how: HOW_11, skill: "Using a line of fit",
        steps: [
          { step: 1, ask: "Which equation do we solve?", type: "choice", answer: 0, options: [{ t: "$d + 2 = 9$" }, { t: "$9 + 2 = d$", fb: "The height is 9, so the **output** $h$ is 9: $d + 2 = 9$." }], m: "d + 2 = 9", say: "The output is 9." },
          { step: 2, ask: "Solve for $d$.", type: "num", pre: "$d =$", answer: 7, near: [{ v: 11, fb: "Subtract 2: $d = 9 - 2$." }], hint: "$9 - 2$.", m: "d = 7", say: "Day 7." },
          { step: 3, ask: "The data cover days 1 to 5. Is day 7 inside?", type: "choice", answer: 0, options: [{ t: "No: it is outside, so it is a guess" }, { t: "Yes", fb: "7 is beyond the last day, 5." }], m: "7 > 5", say: "Outside the data." }],
        why: "Equation, substitute, judge. Now another." },
      { type: "num", kicker: "On your own", prompt: "A line of fit for the cost of a taxi ride is $C = 2.5d + 4$ dollars for $d$ km, from rides of 1 to 8 km. Predict the cost of a 6 km ride.", post: "dollars", answer: 19, skill: "Using a line of fit",
        near: [{ v: 15, fb: "Add the 4 dollars base charge." }, { v: 90, fb: "$2.5(6) + 4$: the 4 is added once." }], hints: ["$2.5 \\cdot 6 + 4$."], why: "$15 + 4 = 19$ dollars. 6 km is inside 1–8 km: a good prediction." },
      { type: "learn", kicker: "A harder case",
        prompt: "How far can you trust it? A line fitted to children aged 2 to 10 is $H = 6a + 80$ cm. Predict the height of a 40-year-old.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "H = 6a + 80", say: "The equation, from ages 2 to 10." },
          { step: 2, m: "H(40) = 6(40) + 80 = 320", say: "Substitute 40.", ask: { prompt: "A prediction of 320 cm: is that sensible?", answer: 0, options: [{ t: "No: over 3 metres tall" }, { t: "Yes, 320 cm is normal", fb: "No person is 3.2 metres tall." }] } },
          { step: 3, m: "40 \\gg 10 \\ \\Rightarrow \\ \\text{far outside}", say: "Ages 2 to 10 say nothing about adults: people stop growing. Far outside the data, a line of fit can be nonsense." }] },
        gate: true, then: "A model is only as good as the range it was built on." },
      { type: "choice", kicker: "Try it", prompt: "A line of fit uses data for $x$ from 10 to 50. For which input is a prediction **most** trustworthy?",
        options: [{ t: "$x = 30$" }, { t: "$x = 55$", fb: "That is just beyond the data: a bit risky." }, { t: "$x = 200$", fb: "Far beyond the data: a wild guess." }],
        answer: 0, skill: "Using a line of fit", hints: ["Which one is inside the range 10 to 50?"], why: "30 is inside the data (interpolation)." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ravi says: “Hours of study and test score have a strong positive trend, so more study **causes** a higher score.” What is wrong?",
        options: [{ t: "A trend shows the two **move together**. It does not prove one causes the other." }, { t: "Nothing is wrong.", fb: "Other things (like interest in the subject) may drive both." }, { t: "The trend must be negative.", fb: "More study goes with higher scores: positive." }],
        answer: 0, skill: "Using a line of fit", hints: ["Could a third thing cause both?"], why: "Correlation is not causation." },
      { type: "num", kicker: "Use it", prompt: "A line of fit for a town's population (in thousands) is $P = 2t + 30$, where $t$ is years after 2010. Predict the population in 2018.", post: "thousand", answer: 46, skill: "Using a line of fit",
        near: [{ v: 2018, fb: "$t$ is the years **after 2010**: $2018 - 2010 = 8$." }, { v: 78, fb: "Use $t = 8$, not 24." }], hints: ["$t = 2018 - 2010 = 8$."], why: "$P(8) = 16 + 30 = 46$ thousand." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "pc2-linfn", title: "Write a linear function from a table", lesson: 2,
      gen: function (R) {
        var m = R.nz(-4, 5), b = R.int(-6, 8), rhs = poly([[m, "x"], [b, ""]]);
        return { type: "expr", prompt: "A linear function has this table. Write $f(x)$." + tbl(["$x$", "$f(x)$"], [0, 1, 2, 3].map(function (x) { return [x, m * x + b]; })),
          answer: clean(rhs), shown: rhs, form: "simplified", keys: KEYS_POLY, placeholder: "Use x",
          near: [{ v: clean(poly([[b, "x"], [m, ""]])), fb: "The output at $x = 0$ is $" + b + "$: that is the starting value $b$. The change per step, $" + m + "$, multiplies $x$." }],
          hints: ["The starting value is $f(0) = " + b + "$. The rate is the change per step."], why: "Rate $" + m + "$, start $" + b + "$: $f(x) = " + rhs + "$." };
      } },
    { id: "pc2-slope", title: "Find a slope", lesson: 3,
      gen: function (R) {
        var x1 = R.int(-5, 4), y1 = R.int(-6, 6), dx = R.int(1, 5), dy = R.nz(-8, 8), x2 = x1 + dx, y2 = y1 + dy;
        return { type: "num", prompt: "Find the slope of the line through $(" + x1 + ", " + y1 + ")$ and $(" + x2 + ", " + y2 + ")$. (A fraction is fine.)", pre: "$m =$", answer: dy / dx, tol: 1e-9, shown: L.fracText(dy, dx),
          near: near(dy / dx, [{ v: dx / dy, tol: 1e-9, fb: "Slope is rise over run: the change in $y$ goes on top." }, { v: -dy / dx, tol: 1e-9, fb: "Subtract in the same order on the top and on the bottom." }]),
          hints: ["$\\frac{y_2 - y_1}{x_2 - x_1}$."], why: "$\\frac{" + y2 + " - " + par(y1) + "}{" + x2 + " - " + par(x1) + "} = " + ratTex(dy, dx) + "$." };
      } },
    { id: "pc2-line", title: "Write the equation of a line", lesson: 4,
      gen: function (R) {
        var m = R.nz(-4, 4), x1 = R.nz(-4, 4), y1 = R.int(-6, 6), b = y1 - m * x1, rhs = poly([[m, "x"], [b, ""]]);
        return { type: "equation", prompt: "Write the equation of the line with slope $" + m + "$ through $(" + x1 + ", " + y1 + ")$, in the form $y = mx + b$.", answer: "y=" + clean(rhs), shown: "y = " + rhs, form: "slope-intercept",
          near: [{ v: "y=" + clean(poly([[m, "x"], [y1, ""]])), fb: "$" + y1 + "$ is the height at $x = " + x1 + "$, not at $x = 0$. Use $y - " + par(y1) + " = " + m + "(x - " + par(x1) + ")$." }],
          hints: ["$y - " + par(y1) + " = " + m + "(x - " + par(x1) + ")$."], why: "$y - " + par(y1) + " = " + m + "(x - " + par(x1) + ")$ simplifies to $y = " + rhs + "$." };
      } },
    { id: "pc2-graph", title: "Which point is on the line?", lesson: 5,
      gen: function (R) {
        var m = R.nz(-3, 3), b = R.int(-5, 5), x0 = R.nz(-3, 3), ans = m * x0 + b, eq = poly([[m, "x"], [b, ""]]);
        return mc(R, { prompt: "Which point is on the line $y = " + eq + "$?", right: "$(" + x0 + ",\\ " + ans + ")$",
          wrong: [{ t: "$(" + x0 + ",\\ " + (ans + R.pick([-2, -1, 1, 2])) + ")$", fb: "Put $x = " + x0 + "$ into the equation: $y = " + ans + "$." }, { t: "$(" + ans + ",\\ " + x0 + ")$", fb: "The first number of a point is $x$: across." }, { t: "$(" + x0 + ",\\ " + (m * x0 - b) + ")$", fb: "The intercept $" + b + "$ is added: $" + m * x0 + " " + signed(b) + "$." }], keep: true,
          hints: ["Substitute $x = " + x0 + "$."], why: "$y = " + m + "(" + x0 + ") " + signed(b) + " = " + ans + "$." });
      } },
    { id: "pc2-intercept", title: "Find an intercept", lesson: 6,
      gen: function (R) {
        var A = R.int(1, 5), B = R.int(1, 5) * R.pick([-1, 1]), k = R.pick([-2, -1, 1, 2]), C = A * Math.abs(B) * k, askX = R.chance(0.5);
        var eq = poly([[A, "x"], [B, "y"]]) + " = " + C, ans = askX ? C / A : C / B, other = askX ? C / B : C / A;
        return { type: "num", prompt: "Find the $" + (askX ? "x" : "y") + "$-intercept of $" + eq + "$. Give its $" + (askX ? "x" : "y") + "$-coordinate.", pre: "$" + (askX ? "x" : "y") + " =$", answer: ans,
          near: near(ans, [{ v: other, fb: "That is the other intercept. For the $" + (askX ? "x" : "y") + "$-intercept, put $" + (askX ? "y" : "x") + " = 0$." }]),
          hints: ["Put $" + (askX ? "y" : "x") + " = 0$ and solve."], why: "With $" + (askX ? "y" : "x") + " = 0$: $" + poly([[askX ? A : B, askX ? "x" : "y"]]) + " = " + C + "$, so $" + (askX ? "x" : "y") + " = " + ans + "$." };
      } },
    { id: "pc2-parperp", title: "Parallel, perpendicular or neither", lesson: 7,
      gen: function (R) {
        var a = R.pick([2, 3, 4, -2, -3, -4]), b1 = R.int(-5, 5), b2 = b1 + R.nz(-4, 4), kind = R.int(0, 2);
        var second = kind === 0 ? poly([[a, "x"], [b2, ""]]) : kind === 1 ? ratTex(-1, a) + "x " + signed(b2) : poly([[-a, "x"], [b2, ""]]);
        var right = ["Parallel", "Perpendicular", "Neither"][kind];
        var why = kind === 0 ? "Both slopes are $" + a + "$." : kind === 1 ? "$" + a + " \\cdot " + (a > 0 ? ratTex(-1, a) : "\\left(" + ratTex(-1, a) + "\\right)") + " = -1$." : "The slopes $" + a + "$ and $" + (-a) + "$ differ, and their product is $" + (-a * a) + "$, not $-1$.";
        return mc(R, { prompt: "How are these lines related? $$y = " + poly([[a, "x"], [b1, ""]]) + " \\quad\\text{and}\\quad y = " + second + "$$", right: right,
          wrong: ["Parallel", "Perpendicular", "Neither"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: why }; }), keep: true,
          hints: ["Compare the slopes: equal, or multiplying to $-1$?"], why: why });
      } },
    { id: "pc2-parperpeq", title: "Write a parallel or perpendicular line", lesson: 8,
      gen: function (R) {
        var m = R.pick([2, 3, 4, -2, -3, -4]), b0 = R.int(-5, 5), x1 = R.nz(-3, 3), y1 = R.int(-6, 6), par_ = R.chance(0.5);
        var m2 = par_ ? m : -1 / m, given = poly([[m, "x"], [b0, ""]]);
        if (!par_) { x1 = m * R.nz(-2, 2); }      // keeps the intercept a whole number
        var b2 = y1 - m2 * x1, rhs = par_ ? poly([[m, "x"], [b2, ""]]) : ratTex(-1, m) + "x " + signed(b2);
        return { type: "equation", prompt: "Write the line **" + (par_ ? "parallel" : "perpendicular") + "** to $y = " + given + "$ through $(" + x1 + ", " + y1 + ")$, as $y = mx + b$.", answer: par_ ? "y=" + clean(poly([[m, "x"], [b2, ""]])) : "y=(-1)/(" + m + ")*x" + (b2 < 0 ? b2 : "+" + b2), shown: par_ ? "y = " + poly([[m, "x"], [b2, ""]]) : "y = (-1/" + m + ")x " + (b2 < 0 ? "- " + (-b2) : "+ " + b2), form: "slope-intercept",
          near: [{ v: "y=" + clean(poly([[par_ ? -1 / m : m, "x"], [b2, ""]])), fb: par_ ? "Parallel lines share the **same** slope, $" + m + "$." : "Perpendicular needs the negative **reciprocal** of $" + m + "$." }],
          hints: ["The slope you need is $" + (par_ ? m : ratTex(-1, m)) + "$. Then $y - " + par(y1) + " = m(x - " + par(x1) + ")$."], why: "Slope $" + (par_ ? m : ratTex(-1, m)) + "$ through $(" + x1 + ", " + y1 + ")$ gives $y = " + rhs + "$." };
      } },
    { id: "pc2-model", title: "Use a linear model", lesson: 9,
      gen: function (R) {
        var start = R.int(2, 9) * 5, rate = R.int(2, 8), n = R.int(3, 9), ctx = R.pick([["A gym charges", "to join plus", "per visit", "visits"], ["A taxi charges", "to start plus", "per kilometre", "kilometres"], ["A tutor charges", "for a session plus", "per hour", "hours"]]), ans = start + rate * n;
        return { type: "num", prompt: ctx[0] + " " + start + " dollars " + ctx[1] + " " + rate + " dollars " + ctx[2] + ". What is the cost for " + n + " " + ctx[3] + "?", post: "dollars", answer: ans,
          near: near(ans, [{ v: rate * n, fb: "That is only the per-" + ctx[2].replace("per ", "") + " part. Add the " + start + " dollars." }, { v: (start + rate) * n, fb: "The " + start + " dollars is charged once, not each time." }]),
          hints: ["$C = " + rate + "n + " + start + "$."], why: "$" + rate + "(" + n + ") + " + start + " = " + ans + "$ dollars." };
      } },
    { id: "pc2-meet", title: "When are two plans equal?", lesson: 10,
      gen: function (R) {
        var x = R.int(2, 8), c = R.int(1, 3), a = c + R.int(1, 3), b = (a - c) * x + R.int(0, 0), d = R.int(0, 0), eq1 = poly([[a, "x"], [0, ""]]), eq2 = poly([[c, "x"], [(a - c) * x, ""]]);
        return { type: "num", prompt: "$A(x) = " + eq1 + "$ and $B(x) = " + eq2 + "$. For which $x$ are they equal?", pre: "$x =$", answer: x,
          near: near(x, [{ v: (a - c) * x, fb: "That is the number added, not $x$. Solve $" + a + "x = " + c + "x + " + (a - c) * x + "$." }, { v: (a + c) * x, fb: "Subtract $" + c + "x$ from both sides, do not add." }]),
          hints: ["Set them equal: $" + a + "x = " + c + "x + " + (a - c) * x + "$."], why: "$" + (a - c) + "x = " + (a - c) * x + "$, so $x = " + x + "$." };
      } },
    { id: "pc2-fit", title: "The slope of a line of fit", lesson: 11,
      gen: function (R) {
        var b = R.int(10, 60), m = R.nz(-6, 6), x2 = R.int(2, 8), y2 = b + m * x2;
        return { type: "num", prompt: "A line of fit passes through $(0, " + b + ")$ and $(" + x2 + ", " + y2 + ")$. What is its slope?", answer: m,
          near: near(m, [{ v: y2 - b === 0 ? 99 : -m, fb: "Check the sign: the line " + (m > 0 ? "rises" : "falls") + "." }, { v: m * x2, fb: "That is the total change. Divide by $" + x2 + "$." }]),
          hints: ["$\\frac{" + y2 + " - " + b + "}{" + x2 + " - 0}$."], why: "$\\frac{" + (y2 - b) + "}{" + x2 + "} = " + m + "$: $y = " + poly([[m, "x"], [b, ""]]) + "$." };
      } },
    { id: "pc2-predict", title: "Predict with a line of fit", lesson: 12,
      gen: function (R) {
        var m = R.nz(-4, 5), b = R.int(5, 40), x = R.int(2, 9), ans = m * x + b;
        return { type: "num", prompt: "A line of fit is $y = " + poly([[m, "x"], [b, ""]]) + "$, from data with $x$ from 1 to 10. Predict $y$ when $x = " + x + "$.", pre: "$y =$", answer: ans,
          near: near(ans, [{ v: m * x - b, fb: "Add the $" + b + "$: the intercept keeps its sign." }, { v: m + b + x, fb: "Multiply the slope by $x$: $" + m + " \\cdot " + x + "$." }]),
          hints: ["Put $x = " + x + "$ in."], why: "$y = " + m + "(" + x + ") " + signed(b) + " = " + ans + "$. $x = " + x + "$ is inside the data, so the prediction is trustworthy." };
      } }
  ];
  L.unit("precalc", 2, {
    title: "Linear Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Linear functions, slope, equations of lines and graphing.", skills: ["pc2-linfn", "pc2-slope", "pc2-line", "pc2-graph"], per: 2 },
      { title: "Quiz 2", after: 8, blurb: "Intercepts, and parallel and perpendicular lines.", skills: ["pc2-intercept", "pc2-parperp", "pc2-parperpeq"], per: 2 },
      { title: "Quiz 3", after: 12, blurb: "Modeling, comparing plans, and lines of fit.", skills: ["pc2-model", "pc2-meet", "pc2-fit", "pc2-predict"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:2", {
    2: { name: "Linear function", frame: "A linear function changes by the same [[amount]] for each step of the input. In $f(x) = mx + b$, $m$ is the [[rate]] and $b$ is the [[starting value]], the output when $x =$ [[$0$]].",
         chips: ["square", "$x$"], fb: { "square": "A linear function has no squares: the change per step is constant." } },
    3: { name: "Slope", frame: "Slope is the change in [[output]] divided by the change in [[input]], subtracted in the same [[order]]. A positive slope rises, a negative slope [[falls]], and a vertical line has no slope: it is [[undefined]].",
         chips: ["zero", "area"], fb: { "zero": "A flat line has slope 0. A vertical line is the one that has no slope." } },
    4: { name: "Equation of a line", frame: "From a point $(x_1, y_1)$ and a slope $m$, point-slope form is [[$y - y_1 = m(x - x_1)$]]. Two points give the slope $m =$ [[$\\frac{y_2 - y_1}{x_2 - x_1}$]]. Solve for $y$ to get [[slope-intercept]] form.",
         chips: ["$y + y_1 = m(x + x_1)$", "standard"], fb: { "$y + y_1 = m(x + x_1)$": "Both brackets subtract: $y - y_1$ and $x - x_1$." } },
    5: { name: "Graphing a line", frame: "Start at the [[$y$-intercept]] $(0, b)$. Then step [[1]] across and [[$m$]] up (down if $m$ is negative). Draw the [[line]] through the points.",
         chips: ["$(b, 0)$", "$m$ across"], fb: { "$(b, 0)$": "The intercept is where $x = 0$: the point is $(0, b)$." } },
    6: { name: "Intercepts", frame: "For the $y$-intercept put $x =$ [[$0$]]; for the $x$-intercept put $y =$ [[$0$]]. A [[horizontal]] line $y = c$ has no $x$-intercept, and a [[vertical]] line $x = c$ has no $y$-intercept.",
         chips: ["$1$", "slanted"], fb: { "slanted": "A slanted line crosses both axes. It is the horizontal and vertical lines that miss one." } },
    7: { name: "Parallel and perpendicular", frame: "Parallel lines have the [[same]] slope. Perpendicular lines have slopes that [[multiply]] to [[$-1$]]: negative reciprocals.",
         chips: ["add", "$1$"], fb: { "$1$": "Perpendicular slopes multiply to $-1$, not $1$." } },
    8: { name: "A line through a point", frame: "To write a line through a point, decide the [[slope]] first: the [[same]] for parallel, the negative [[reciprocal]] for perpendicular. Then use [[point-slope]] form with the given point.",
         chips: ["intercept", "opposite"], fb: { "opposite": "The opposite (just the sign) is not enough: flip the fraction too." } },
    9: { name: "A linear model", frame: "In a linear model, $b$ is the value at [[zero]] and $m$ is the change per [[unit]] of input, with its units. Evaluate to find an output; [[solve]] to find an input.",
         chips: ["square", "average"], fb: { "average": "The rate of a line is the same everywhere, not just on average." } },
    10: { name: "Where two lines meet", frame: "Set the two formulas [[equal]] and solve for $x$. At that input both give the [[same]] output. On one side of it one plan is cheaper, and on the other side the other is [[cheaper]].",
          chips: ["added", "parallel"], fb: { "parallel": "Parallel lines never meet." } },
    11: { name: "Line of fit", frame: "A line of fit follows the [[trend]] of the data and passes [[close]] to all the points, with about as many [[above]] as below. Its equation comes from two points on the [[line]].",
          chips: ["through every point", "data"], fb: { "through every point": "It need not touch any data point." } },
    12: { name: "Using a fitted model", frame: "To predict, [[substitute]] an input into the line's equation. Inside the data's range this is [[interpolation]], fairly safe. Far outside it is [[extrapolation]], a guess. A trend does not prove [[cause]].",
          chips: ["proof", "slope"], fb: { "proof": "A trend shows two things move together. It does not prove one causes the other." } }
  });
})();
