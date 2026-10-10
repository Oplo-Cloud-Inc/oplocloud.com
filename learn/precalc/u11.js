/* ==========================================================================
   Precalculus — Unit 11: Sequences, Probability and Counting Theory. See lab/core.js.

   Follows OpenStax Precalculus 2e, Chapter 11: sequences (explicit and recursive
   formulas, factorials), arithmetic and geometric sequences, series and summation
   notation (finite and infinite), the counting principles, permutations and
   combinations, the Binomial Theorem and probability. Each section is split into
   lessons small enough to finish in one sitting; each teaches one method: the idea,
   an example to watch, one done together, then on your own, a harder case, find the
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
    blurb: "Before Chapter 11 · Evaluating a formula, powers, a negative power of $-1$, a linear equation and a product.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Evaluate", prompt: "Work out $n^2 + 1$ when $n = 4$.", pre: "value =", answer: 17, skill: "Evaluate a formula", near: [{ v: 9, fb: "Square first: $4^2 = 16$, then add 1." }, { v: 10, fb: "$n^2$ means $n \\cdot n$, not $2n$." }], hints: ["$16 + 1$."], why: "$16 + 1 = 17$." },
      { type: "num", kicker: "Check 2 · Powers", prompt: "Work out $3 \\cdot 2^4$.", pre: "value =", answer: 48, skill: "Powers", near: [{ v: 1296, fb: "The power belongs to the 2 only: $2^4 = 16$, then times 3." }], hints: ["$2^4 = 16$."], why: "$3 \\cdot 16 = 48$." },
      { type: "choice", kicker: "Check 3 · Signs", prompt: "What is $(-1)^5$?",
        options: [{ t: "$-1$" }, { t: "$1$", fb: "An **odd** power of $-1$ is negative: $-1 \\cdot -1 \\cdot -1 \\cdot -1 \\cdot -1 = -1$." }, { t: "$-5$", fb: "The power counts how many $-1$s are multiplied, it does not multiply by 5." }],
        answer: 0, skill: "Signs of powers", hints: ["Pairs of $-1$ make $+1$; one is left over."], why: "$-1$." },
      { type: "num", kicker: "Check 4 · Equation", prompt: "Solve $5 + 3(n - 1) = 20$.", pre: "$n =$", answer: 6, skill: "Linear equations", near: [{ v: 5, fb: "Subtract 5, then divide by 3: $n - 1 = 5$, so $n = 6$." }, { v: 8.3333, tol: 0.001, fb: "Undo the 5 and the 3 first, then the $-1$." }], hints: ["$3(n - 1) = 15$."], why: "$n - 1 = 5$, so $n = 6$." },
      { type: "num", kicker: "Check 5 · Product", prompt: "Work out $5 \\cdot 4 \\cdot 3$.", pre: "value =", answer: 60, skill: "Multiplication", near: [{ v: 12, fb: "That is $4 \\cdot 3$. Include the 5." }, { v: 20, fb: "That is $5 \\cdot 4$. Include the 3." }], hints: ["$5 \\cdot 4 = 20$."], why: "$20 \\cdot 3 = 60$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 11.1**. If **check 4** slipped, look again at lesson 2.1. If **check 2** slipped, revisit lesson 4.1.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= helpers for Chapter 11 */
  var f4 = function (v, d) { var k = Math.pow(10, d == null ? 2 : d); return Math.round(v * k) / k; };
  var FACT = function (n) { var r = 1, i; for (i = 2; i <= n; i++) r *= i; return r; };
  var CHOOSE = function (n, r) { return FACT(n) / (FACT(r) * FACT(n - r)); };
  // the dots (n, f(n)) for n = n0..n1 that fall inside the window, in a colour
  var SQDOTS = function (f, n0, n1, c, yr) {
    var out = [], n;
    for (n = n0; n <= n1; n++) { var v = f(n); if (v >= yr[0] && v <= yr[1]) out.push(dot(n, v, c)); }
    return out;
  };
  // the terms of a sequence as a list in TeX: LISTTEX(f, 1, 6) is "3,\ 5,\ 7,\ \dots"
  var LISTTEX = function (f, n0, n1) { var out = [], n; for (n = n0; n <= n1; n++) out.push(nm(f4(f(n), 2))); return out.join(",\\ ") + ",\\ \\dots"; };

  /* ============================================ 1 · Sequences and explicit formulas */
  var HOW_1 = [["Name", "$a_n$ is the $n$th term, and $n$ counts $1, 2, 3, \\dots$"],
               ["Substitute", "Put $n = 1, 2, 3, \\dots$ into the formula."],
               ["List", "Write the terms in order."]];
  var G1 = function (k) {
    var f = function (n) { return n * n - 3; }, it = SQDOTS(f, 1, Math.min(5, k + 1), "blue", [-4, 24]);
    return grid("The first " + Math.min(5, k + 1) + " terms of the sequence a_n = n squared minus 3 plotted against n.", it, { x: [0, 6], y: [-4, 24], u: 30, uy: 8, gx: 1, step: 1, gy: 4, stepY: 4 });
  };
  LESSONS.push({
    title: "Sequences and explicit formulas", art: "pcseq",
    blurb: "Book 11.1 · A sequence is a list of numbers in order; an explicit formula gives the $n$th term directly.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $n^2 - 3$ when $n = 4$.", pre: "value =", answer: 13, skill: "Evaluate a formula", near: [{ v: 5, fb: "Square first: $4^2 = 16$, then subtract 3." }, { v: 1, fb: "$n^2$ means $4 \\cdot 4$, not $4 + 4$." }], hints: ["$16 - 3$."], why: "$16 - 3 = 13$." },
      { type: "learn", kicker: "Explore",
        prompt: "The orange dots are the first six terms of a sequence: $3, 5, 7, 9, 11, 13$. Slide $a$ and $b$ so the blue dots of $a_n = an + b$ land **on top** of them.",
        scene: { type: "sketch", x: [0, 7], y: [-4, 16], u: 40, uy: 16, gx: 1, step: 1, gy: 2, stepY: 2, w: 328, gate: true, pts: {},
          params: { a: { min: -3, max: 5, step: 1, v: 1, label: "$a$" }, b: { min: -4, max: 6, step: 1, v: 0, label: "$b$" } },
          draw: function (s) { return SQDOTS(function (n) { return 2 * n + 1; }, 1, 6, "orange", [-4, 16]).concat(SQDOTS(function (n) { return s.p.a * n + s.p.b; }, 1, 6, "blue", [-4, 16])); },
          readout: function (s) { var a = s.p.a, b = s.p.b, ok = a === 2 && b === 1; return "$a_n = " + (a === 1 ? "" : a === -1 ? "-" : nm(a)) + "n " + (b < 0 ? "-" : "+") + " " + Math.abs(b) + "$ gives $" + LISTTEX(function (n) { return a * n + b; }, 1, 6).replace(",\\ \\dots", "") + "$" + (ok ? " ✓ every term matches" : ""); },
          goal: function (s) { return s.p.a === 2 && s.p.b === 1; } },
        gate: true, then: "$a_n = 2n + 1$: each term is the previous one plus 2, and $a_1 = 3$. An **explicit formula** gives any term straight from its position $n$: for the 100th term just put in $n = 100$, with no need to list the 99 before it." },
      { type: "learn", kicker: "The idea",
        prompt: "A **sequence** is a list of numbers in a fixed order: $a_1, a_2, a_3, \\dots$ An **explicit formula** such as $a_n = n^2 - 3$ gives the $n$th term directly: substitute $n = 1, 2, 3, \\dots$ A factor $(-1)^n$ makes the signs **alternate**.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write the first five terms of $a_n = n^2 - 3$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "a_n = n^2 - 3", say: "$n$ is the position: $n = 1$ is the first term.", fig: G1(0) },
          { step: 2, m: "a_1 = 1^2 - 3 = -2", say: "Put in $n = 1$." },
          { step: 2, m: "a_2 = 2^2 - 3 = 1", say: "Put in $n = 2$.", fig: G1(1), ask: { prompt: "What is $a_3$?", answer: 0, options: [{ t: "$3^2 - 3 = 6$" }, { t: "$3 \\cdot 2 - 3 = 3$", fb: "$n^2$ means $n \\cdot n$: $3^2 = 9$." }] } },
          { step: 2, m: "a_3 = 6,\\ a_4 = 13,\\ a_5 = 22", say: "$9 - 3$, $16 - 3$, $25 - 3$.", fig: G1(4) },
          { step: 3, m: "-2,\\ 1,\\ 6,\\ 13,\\ 22,\\ \\dots", say: "The terms, in order." }] },
        gate: true, then: "$-2, 1, 6, 13, 22$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write terms of the **alternating** sequence $a_n = (-1)^n(n + 2)$.",
        how: HOW_1, skill: "Explicit formulas",
        steps: [
          { step: 1, ask: "In $a_n = (-1)^n(n + 2)$, the factor $(-1)^n$ is negative when $n$ is…", type: "choice", answer: 0, options: [{ t: "odd" }, { t: "even", fb: "$(-1)^2 = +1$: even powers are positive." }], m: "(-1)^n", say: "Odd $n$: negative; even $n$: positive." },
          { step: 2, ask: "$a_1 = (-1)^1(1 + 2) =$", type: "num", pre: "$a_1 =$", answer: -3, near: [{ v: 3, fb: "$(-1)^1 = -1$: the first term is **negative**." }], hint: "$-1 \\cdot 3$.", m: "a_1 = -3", say: "Odd $n$: negative." },
          { step: 2, ask: "$a_4 = (-1)^4(4 + 2) =$", type: "num", pre: "$a_4 =$", answer: 6, near: [{ v: -6, fb: "$(-1)^4 = +1$: an even power is positive." }], hint: "$(-1)^4 = 1$.", m: "a_4 = 6", say: "Even $n$: positive." },
          { step: 3, ask: "$a_5 =$", type: "num", pre: "$a_5 =$", answer: -7, near: [{ v: 7, fb: "$n = 5$ is odd, so $(-1)^5 = -1$." }], hint: "$-1 \\cdot 7$.", m: "-3,\\ 4,\\ -5,\\ 6,\\ -7", say: "The signs alternate with $n$." }],
        why: "Name, substitute, list." },
      { type: "num", kicker: "On your own", prompt: "Find $a_6$ for the sequence $a_n = 2n^2 - 5$.", pre: "$a_6 =$", answer: 67, skill: "Explicit formulas", near: [{ v: 7, fb: "$n^2$ first: $6^2 = 36$, then double it." }, { v: 139, fb: "$2n^2$ means $2 \\cdot 6^2 = 72$, not $(2 \\cdot 6)^2$." }], hints: ["$2(36) - 5$."], why: "$72 - 5 = 67$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Finding the formula.** Find an explicit formula for $3, 6, 11, 18, 27, \\dots$",
        scene: { type: "walk", how: [["Compare", "Compare each term with simple patterns: $n$, $n^2$, $2^n$."], ["Test", "Check your guess on the first few terms."], ["Write", "State the formula."]], rows: [
          { step: 1, m: "3,\\ 6,\\ 11,\\ 18,\\ 27", say: "The gaps are $3, 5, 7, 9$: they grow by 2 each time." },
          { step: 1, m: "n^2:\\ 1,\\ 4,\\ 9,\\ 16,\\ 25", say: "A gap that grows steadily by 2 suggests $n^2$.", ask: { prompt: "What is $a_n - n^2$ for each term?", answer: 0, options: [{ t: "Always 2" }, { t: "It keeps growing", fb: "$3 - 1 = 2$, $6 - 4 = 2$, $11 - 9 = 2$: it is always 2." }] } },
          { step: 2, m: "a_n = n^2 + 2", say: "Test: $1 + 2 = 3$, $4 + 2 = 6$, $9 + 2 = 11$, $16 + 2 = 18$." },
          { step: 3, m: "a_n = n^2 + 2", say: "It matches all five terms, so this is the explicit formula." }] },
        gate: true, then: "$a_n = n^2 + 2$." },
      { type: "num", kicker: "Try it", prompt: "Find $a_4$ for the sequence $a_n = 5 \\cdot 2^{n-1}$.", pre: "$a_4 =$", answer: 40, skill: "Explicit formulas", near: [{ v: 80, fb: "The exponent is $n - 1 = 3$, not 4: $2^3 = 8$." }, { v: 20, fb: "$2^3 = 8$, then times 5." }], hints: ["$2^{n-1} = 2^3$."], why: "$5 \\cdot 8 = 40$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee says the first term of $a_n = (-1)^n \\cdot 4$ is $4$. What is wrong?",
        options: [{ t: "$n = 1$ is odd, so $(-1)^1 = -1$ and $a_1 = -4$" }, { t: "Nothing: the first term is the positive one", fb: "The sign comes from $(-1)^n$: odd $n$ gives a minus." }, { t: "$a_1 = 0$", fb: "Substitute $n = 1$: $(-1)^1 \\cdot 4 = -4$." }],
        answer: 0, skill: "Explicit formulas", hints: ["What is $(-1)^1$?"], why: "$a_1 = -4$, $a_2 = 4$, $a_3 = -4$, $\\dots$" },
      { type: "num", kicker: "Use it", prompt: "In week $n$ you save $\\$(5n + 10)$. How much do you save in week 7, in dollars?", pre: "savings =", post: "dollars", answer: 45, skill: "Explicit formulas", near: [{ v: 35, fb: "Add the 10 as well: $5(7) + 10$." }, { v: 75, fb: "$5n$ means $5 \\times 7 = 35$, then $+ 10$." }], hints: ["Substitute $n = 7$."], why: "$5(7) + 10 = 45$." }
    ]
  });

  /* ============================================ 2 · Recursive formulas and factorials */
  var HOW_2 = [["Start", "Read the first term (or two)."],
               ["Apply", "Use the rule on the previous term(s) to get the next one."],
               ["Repeat", "Go on until you reach the term you want."]];
  LESSONS.push({
    title: "Recursive formulas and factorials", art: "pcseq",
    blurb: "Book 11.1 · A recursive formula builds each term from the ones before it; $n!$ multiplies $n(n-1)\\cdots 1$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $2 \\cdot 5 - 1$.", pre: "value =", answer: 9, skill: "Arithmetic", near: [{ v: 11, fb: "Subtract the 1: $10 - 1$." }, { v: 8, fb: "Multiply first: $2 \\cdot 5 = 10$." }], hints: ["$10 - 1$."], why: "$9$." },
      { type: "learn", kicker: "Explore",
        prompt: "A sequence starts at $a_1$ and then follows $a_n = \\frac{1}{2}a_{n-1} + 3$. Slide $a_1$ and watch the dots. Find the starting value for which **every term is the same**.",
        scene: { type: "sketch", x: [0, 9], y: [0, 14], u: 30, uy: 20, gx: 1, step: 1, gy: 2, stepY: 2, w: 318, gate: true, pts: {},
          params: { a: { min: 0, max: 12, step: 1, v: 2, label: "$a_1$" } },
          draw: function (s) { var v = s.p.a, it = [], n; for (n = 1; n <= 8; n++) { it.push(dot(n, v, n === 1 ? "orange" : "blue")); v = v / 2 + 3; } return it; },
          readout: function (s) { var v = s.p.a, out = [], n; for (n = 1; n <= 6; n++) { out.push(nm(f4(v, 2))); v = v / 2 + 3; } return "$" + out.join(",\\ ") + ",\\ \\dots$" + (s.p.a === 6 ? "<br>every term is the same ✓" : "<br>the terms move towards a fixed value"); },
          goal: function (s) { return s.p.a === 6; } },
        gate: true, then: "$a_1 = 6$: then $a_2 = \\frac{1}{2}(6) + 3 = 6$, and so on, for ever. From any other start the terms creep towards 6. A **recursive formula** needs a **starting value** and a **rule** that turns one term into the next." },
      { type: "learn", kicker: "The idea",
        prompt: "A **recursive formula** gives the first term (or two) and a rule for $a_n$ in terms of earlier terms, such as $a_n = 2a_{n-1} - 1$. Work forwards one term at a time. A **factorial** is $n! = n(n-1)(n-2)\\cdots 1$, with $0! = 1$.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write the first five terms of $a_1 = 3$, $a_n = 2a_{n-1} - 1$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "a_1 = 3", say: "The first term is given." },
          { step: 2, m: "a_2 = 2(3) - 1 = 5", say: "Use the rule with $a_{n-1} = a_1 = 3$." },
          { step: 2, m: "a_3 = 2(5) - 1 = 9", say: "Now $a_{n-1} = a_2 = 5$.", ask: { prompt: "To find $a_4$ we use…", answer: 0, options: [{ t: "$a_3 = 9$, the term just before" }, { t: "$a_1 = 3$, the first term", fb: "Each term is built from the **previous** one." }] } },
          { step: 3, m: "a_4 = 2(9) - 1 = 17", say: "Repeat." },
          { step: 3, m: "a_5 = 2(17) - 1 = 33", say: "And again: $3, 5, 9, 17, 33$." }] },
        gate: true, then: "$3, 5, 9, 17, 33$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you use **two** starting terms: $a_1 = 2$, $a_2 = 3$, $a_n = a_{n-1} + a_{n-2}$.",
        how: HOW_2, skill: "Recursive formulas",
        steps: [
          { step: 1, ask: "The rule adds the **two terms before**. $a_3 = a_2 + a_1 = 3 + 2 =$", type: "num", pre: "$a_3 =$", answer: 5, near: [{ v: 6, fb: "$a_3 = a_2 + a_1$: $3 + 2$." }], hint: "$3 + 2$.", m: "a_3 = 5", say: "Now the two before $a_4$ are $a_3$ and $a_2$." },
          { step: 2, ask: "$a_4 = a_3 + a_2 = 5 + 3 =$", type: "num", pre: "$a_4 =$", answer: 8, near: [{ v: 7, fb: "$a_4 = a_3 + a_2 = 5 + 3$." }], hint: "$5 + 3$.", m: "a_4 = 8", say: "Slide the pair along." },
          { step: 3, ask: "$a_5 = a_4 + a_3 =$", type: "num", pre: "$a_5 =$", answer: 13, near: [{ v: 11, fb: "$a_5 = a_4 + a_3 = 8 + 5$." }], hint: "$8 + 5$.", m: "2,\\ 3,\\ 5,\\ 8,\\ 13", say: "A Fibonacci-style sequence." }],
        why: "Start, apply, repeat." },
      { type: "num", kicker: "On your own", prompt: "$a_1 = 4$ and $a_n = 3a_{n-1} - 2$. Find $a_4$.", pre: "$a_4 =$", answer: 82, skill: "Recursive formulas", near: [{ v: 28, fb: "That is $a_3$. One more step: $3(28) - 2$." }, { v: 10, fb: "That is $a_2$. Keep going to $a_4$." }], hints: ["$a_2 = 10$, $a_3 = 28$."], why: "$4, 10, 28, 82$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Factorials.** Work out $\\dfrac{7!}{5!\\,2!}$.",
        scene: { type: "walk", how: [["Expand", "Write each factorial as a product."], ["Cancel", "Cancel the common factors."], ["Multiply", "Multiply and divide what is left."]], rows: [
          { step: 1, m: "\\frac{7 \\cdot 6 \\cdot 5!}{5!\\cdot 2 \\cdot 1}", say: "$7! = 7 \\cdot 6 \\cdot 5!$: stop writing at $5!$." },
          { step: 2, m: "\\frac{7 \\cdot 6}{2}", say: "The $5!$ cancels top and bottom.", ask: { prompt: "Why stop at $5!$ in $7!$?", answer: 0, options: [{ t: "So $5!$ cancels with the one underneath" }, { t: "Because $7!$ has only three factors", fb: "$7!$ has seven factors. We just keep the last five together as $5!$." }] } },
          { step: 3, m: "\\frac{42}{2} = 21", say: "Multiply, then divide." }] },
        gate: true, then: "$21$." },
      { type: "num", kicker: "Try it", prompt: "Work out $\\dfrac{8!}{6!}$.", pre: "value =", answer: 56, skill: "Factorials", near: [{ v: 2, fb: "That is $\\frac{8}{6}$ with the factorial signs dropped. $8! = 8 \\cdot 7 \\cdot 6!$." }, { v: 40320, fb: "That is $8!$. Cancel the $6!$ first." }], hints: ["$8! = 8 \\cdot 7 \\cdot 6!$."], why: "$8 \\cdot 7 = 56$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says $0! = 0$. What is wrong?",
        options: [{ t: "$0! = 1$ by definition, so formulas such as $\\frac{n!}{0!\\,n!}$ still work" }, { t: "Nothing: nothing times anything is 0", fb: "$0!$ is the empty product, which is defined to be 1." }, { t: "$0!$ has no value", fb: "It does have a value: $0! = 1$." }],
        answer: 0, skill: "Factorials", hints: ["Think of $1! = 1 \\cdot 0!$."], why: "$0! = 1$." },
      { type: "num", kicker: "Use it", prompt: "A plant starts at 4 cm. Each year it grows to double its height plus 3 cm: $a_n = 2a_{n-1} + 3$. What is its height after the third **step** (that is, $a_4$)? Start from $a_1 = 4$.", pre: "$a_4 =$", post: "cm", answer: 53, skill: "Recursive formulas", near: [{ v: 25, fb: "That is $a_3$. One more step." }, { v: 11, fb: "That is $a_2$. Keep going to $a_4$." }], hints: ["$a_2 = 11$, $a_3 = 25$."], why: "$4, 11, 25, 53$." }
    ]
  });
  /* ============================================ 3 · Arithmetic sequences: the common difference */
  var HOW_3 = [["Subtract", "Subtract each term from the next one."],
               ["Compare", "Are **all** the differences equal?"],
               ["Use", "If so it is arithmetic: add $d$ to go on."]];
  var SEQ3 = [[4, 7, 10, 13, 16], [2, 4, 8, 16, 32], [20, 17, 14, 11, 8], [1, 4, 9, 16, 25], [5, 5, 5, 5, 5]];
  var DIFFS = function (a) { var out = [], i; for (i = 1; i < a.length; i++) out.push(a[i] - a[i - 1]); return out; };
  var G3 = function (k) {
    var a = [8, 5, 2, -1, -4], it = [], i;
    for (i = 0; i < Math.min(5, k + 1); i++) it.push(dot(i + 1, a[i], "blue", String(a[i]).replace("-", "−"), "ne"));
    return grid("The terms 8, 5, 2, minus 1, minus 4 plotted against n: they fall in a straight line.", it, { x: [0, 6], y: [-6, 10], u: 30, uy: 14, gx: 1, step: 1, gy: 2, stepY: 2 });
  };
  LESSONS.push({
    title: "Arithmetic sequences", art: "pcseq",
    blurb: "Book 11.2 · A sequence that adds the same number every step: the common difference $d$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "By how much does each number grow: $5,\\ 9,\\ 13,\\ 17$?", pre: "growth =", answer: 4, skill: "Differences", near: [{ v: 5, fb: "That is the first number. Subtract neighbours: $9 - 5$." }, { v: 17, fb: "Subtract each number from the next: $9 - 5$." }], hints: ["$9 - 5$."], why: "$4$ each time." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick a sequence. The readout shows the **differences** between neighbouring terms. Find **all three** sequences that go up (or down) by the same amount every step.",
        scene: { type: "sketch", x: [0, 6], y: [0, 34], u: 44, uy: 8, gx: 1, step: 1, gy: 4, stepY: 4, w: 312, grid: true, gate: true, pts: {},
          chips: { q: { label: "Sequence", v: "1", opts: SEQ3.map(function (q, i) { return ["" + i, q.join(", ")]; }) } },
          track: function (s) { var d = DIFFS(SEQ3[+s.c.q]); return d.every(function (x) { return x === d[0]; }) ? "a" + s.c.q : null; },
          draw: function (s) { var q = SEQ3[+s.c.q], it = [], i; for (i = 0; i < q.length; i++) it.push(dot(i + 1, q[i], "blue")); return it; },
          readout: function (s) { var q = SEQ3[+s.c.q], d = DIFFS(q), ok = d.every(function (x) { return x === d[0]; }); return "differences: $" + d.map(function (x) { return nm(x); }).join(",\\ ") + "$ · " + (ok ? "the **same** each time: arithmetic, $d = " + nm(d[0]) + "$" : "**not** all equal: not arithmetic") + "<br>Found " + Math.min(3, Object.keys(s.tracked).length) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "$4, 7, 10, \\dots$ goes up by 3, $20, 17, 14, \\dots$ goes **down** by 3, and $5, 5, 5, \\dots$ goes up by 0. These are **arithmetic sequences**, with $d = 3$, $-3$ and $0$. The others change by a different amount each time, and their dots do not lie on a straight line." },
      { type: "learn", kicker: "The idea",
        prompt: "In an **arithmetic sequence** each term is the previous one **plus the same number** $d$, the **common difference**. Find $d$ by subtracting a term from the next, and check that **every** difference is the same. Recursively: $a_n = a_{n-1} + d$.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write the first five terms and the recursive formula of the arithmetic sequence with $a_1 = 8$ and $d = -3$.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "a_1 = 8,\\ d = -3", say: "The difference is negative: the terms **fall**.", fig: G3(0) },
          { step: 2, m: "a_2 = 8 + (-3) = 5", say: "Add $d$ to the previous term.", fig: G3(1) },
          { step: 2, m: "a_3 = 2,\\ a_4 = -1,\\ a_5 = -4", say: "$5 - 3$, $2 - 3$, $-1 - 3$.", fig: G3(4), ask: { prompt: "What is $a_5 - a_4$?", answer: 0, options: [{ t: "$-3$, the same $d$ every time" }, { t: "$3$", fb: "The terms are falling, so each difference is $-3$." }] } },
          { step: 3, m: "a_1 = 8,\\ a_n = a_{n-1} - 3", say: "The recursive formula: start at 8 and subtract 3 each time." }] },
        gate: true, then: "$8, 5, 2, -1, -4$ with $a_1 = 8$, $a_n = a_{n-1} - 3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide whether $6,\\ 11,\\ 17,\\ 22$ is arithmetic.",
        how: HOW_3, skill: "Arithmetic sequences",
        steps: [
          { step: 1, ask: "$11 - 6 =$", type: "num", pre: "difference =", answer: 5, near: [{ v: 17, fb: "Subtract neighbours: $11 - 6$." }], hint: "$11 - 6$.", m: "11 - 6 = 5", say: "The first difference." },
          { step: 1, ask: "$17 - 11 =$", type: "num", pre: "difference =", answer: 6, near: [{ v: 5, fb: "That is the first difference. Now $17 - 11$." }], hint: "$17 - 11$.", m: "17 - 11 = 6", say: "The second difference." },
          { step: 2, ask: "The differences are 5 and 6. They are…", type: "choice", answer: 0, options: [{ t: "different" }, { t: "the same", fb: "$5 \\ne 6$." }], m: "5 \\ne 6", say: "Not all equal." },
          { step: 3, ask: "So the sequence is…", type: "choice", answer: 0, options: [{ t: "not arithmetic" }, { t: "arithmetic", fb: "It needs **every** difference to be the same." }], m: "\\text{not arithmetic}", say: "One unequal pair is enough." }],
        why: "Subtract, compare, use." },
      { type: "num", kicker: "On your own", prompt: "Find the common difference of $25,\\ 19,\\ 13,\\ 7$.", pre: "$d =$", answer: -6, skill: "Arithmetic sequences", near: [{ v: 6, fb: "The terms are **falling**, so $d$ is negative." }], hints: ["$19 - 25$."], why: "$19 - 25 = -6$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Missing terms.** An arithmetic sequence has $a_1 = 5$ and $a_4 = 17$. Find $a_2$ and $a_3$.",
        scene: { type: "walk", how: [["Count steps", "From $a_1$ to $a_4$ is 3 steps of $d$."], ["Find d", "Total change divided by the number of steps."], ["Fill in", "Add $d$ to get the missing terms."]], rows: [
          { step: 1, m: "a_1 \\to a_4:\\ 3\\text{ steps}", say: "$a_4 - a_1 = 17 - 5 = 12$ is the total change." },
          { step: 2, m: "d = 12 \\div 3 = 4", say: "Three equal steps add up to 12.", ask: { prompt: "Why divide by 3, not 4?", answer: 0, options: [{ t: "Going from term 1 to term 4 takes 3 steps" }, { t: "There are 4 terms", fb: "The number of **steps** between terms is one less than the number of terms." }] } },
          { step: 3, m: "5,\\ 9,\\ 13,\\ 17", say: "$a_2 = 9$ and $a_3 = 13$." }] },
        gate: true, then: "$a_2 = 9$ and $a_3 = 13$." },
      { type: "num", kicker: "Try it", prompt: "An arithmetic sequence has $a_1 = 40$ and $d = -7$. What is $a_5$?", pre: "$a_5 =$", answer: 12, skill: "Arithmetic sequences", near: [{ v: 19, fb: "That is $a_4$. One more step." }, { v: -28, fb: "That is the total change. Add it to 40." }], hints: ["$40, 33, 26, \\dots$"], why: "$40, 33, 26, 19, 12$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rin says $2,\\ 4,\\ 8,\\ 14$ is arithmetic because it keeps increasing. What is wrong?",
        options: [{ t: "The differences are $2, 4, 6$: not all the same" }, { t: "Nothing: increasing means arithmetic", fb: "Arithmetic needs the **same** difference each step, not just growth." }, { t: "The differences are $2, 4, 8$", fb: "$4 - 2 = 2$, $8 - 4 = 4$, $14 - 8 = 6$." }],
        answer: 0, skill: "Arithmetic sequences", hints: ["Subtract neighbours."], why: "$2, 4, 6$." },
      { type: "num", kicker: "Use it", prompt: "A shelf holds 12 books and you add 3 books every week. How many books are on it after 4 weeks?", pre: "books =", answer: 24, skill: "Arithmetic sequences", near: [{ v: 21, fb: "That is after 3 weeks. One more week." }, { v: 15, fb: "That is after 1 week. Four weeks add $4 \\times 3$." }], hints: ["$12, 15, 18, \\dots$"], why: "$12 + 4 \\cdot 3 = 24$." }
    ]
  });

  /* ============================================ 4 · The explicit formula of an arithmetic sequence */
  var HOW_4 = [["Find a, d", "Read the first term $a_1$ and the common difference $d$."],
               ["Substitute", "Put them into $a_n = a_1 + (n - 1)d$."],
               ["Solve", "Simplify, or solve for $n$ if a term is given."]];
  LESSONS.push({
    title: "The explicit formula of an arithmetic sequence", art: "pcseq",
    blurb: "Book 11.2 · $a_n = a_1 + (n - 1)d$ jumps straight to any term, and counts how many terms there are.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $7 + 5(10 - 1)$.", pre: "value =", answer: 52, skill: "Order of operations", near: [{ v: 115, fb: "Brackets first, then multiply, then add: $5 \\cdot 9 = 45$." }, { v: 57, fb: "$10 - 1 = 9$, not 10." }], hints: ["$5 \\cdot 9 + 7$."], why: "$45 + 7 = 52$." },
      { type: "learn", kicker: "Explore",
        prompt: "The sequence is $7, 12, 17, 22, \\dots$ Slide $n$. The readout builds $a_n$ from $a_1$ by adding $d$ **$n - 1$ times**. Find which term is **$52$**.",
        scene: { type: "sketch", x: [0, 16], y: [0, 82], u: 21, uy: 3.4, gx: 1, step: 2, gy: 10, stepY: 10, w: 384, gate: true, pts: {},
          params: { n: { min: 1, max: 15, step: 1, v: 3, label: "$n$" } },
          draw: function (s) { var it = [], k; for (k = 1; k <= 15; k++) it.push(dot(k, 7 + 5 * (k - 1), k === s.p.n ? "orange" : "blue")); return it; },
          readout: function (s) { var n = s.p.n, v = 7 + 5 * (n - 1); return "$a_{" + n + "} = 7 + 5(" + n + " - 1) = " + v + "$" + (v === 52 ? " ✓" : ""); },
          goal: function (s) { return 7 + 5 * (s.p.n - 1) === 52; } },
        gate: true, then: "$a_{10} = 7 + 5(9) = 52$. The 10th term is $a_1$ plus **nine** steps of 5, because there are $n - 1$ steps between term 1 and term $n$. That gives the **explicit formula** $a_n = a_1 + (n - 1)d$." },
      { type: "learn", kicker: "The idea",
        prompt: "$a_n = a_1 + (n - 1)d$: start at $a_1$ and take $n - 1$ steps of size $d$. To find **how many terms** there are, set $a_n$ equal to the last term and solve for $n$. Two known terms give $d$, then $a_1$.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write an explicit formula for $3,\\ 7,\\ 11,\\ 15,\\ \\dots$ and find $a_{20}$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "a_1 = 3,\\ d = 4", say: "The first term is 3 and each step adds $7 - 3 = 4$." },
          { step: 2, m: "a_n = 3 + 4(n - 1)", say: "Substitute into $a_n = a_1 + (n - 1)d$." },
          { step: 2, m: "a_n = 4n - 1", say: "Distribute and tidy: $3 + 4n - 4$.", ask: { prompt: "Check with $n = 3$: $4(3) - 1 =$", answer: 0, options: [{ t: "$11$, the third term" }, { t: "$12$", fb: "$4 \\cdot 3 = 12$, then subtract 1: 11, the third term." }] } },
          { step: 3, m: "a_{20} = 4(20) - 1 = 79", say: "Put in $n = 20$." }] },
        gate: true, then: "$a_n = 4n - 1$, and $a_{20} = 79$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you count the terms of $4,\\ 10,\\ 16,\\ \\dots,\\ 100$.",
        how: HOW_4, skill: "Explicit arithmetic formula",
        steps: [
          { step: 1, ask: "$a_1 = 4$ and $d = 10 - 4 =$", type: "num", pre: "$d =$", answer: 6, near: [{ v: 4, fb: "That is $a_1$. The difference is $10 - 4$." }], hint: "$10 - 4$.", m: "a_1 = 4,\\ d = 6", say: "The last term is 100." },
          { step: 2, ask: "Set $a_n = 100$: $4 + 6(n - 1) = 100$, so $6(n - 1) =$", type: "num", pre: "$6(n-1) =$", answer: 96, near: [{ v: 104, fb: "Subtract the 4: $100 - 4$." }], hint: "$100 - 4$.", m: "6(n - 1) = 96", say: "Divide by 6 next." },
          { step: 3, ask: "$n - 1 = 96 \\div 6 =$", type: "num", pre: "$n - 1 =$", answer: 16, near: [{ v: 17, fb: "That is $n$. First $n - 1$." }], hint: "$96 \\div 6$.", m: "n - 1 = 16", say: "One more step." },
          { step: 3, ask: "So the number of terms is $n =$", type: "num", pre: "$n =$", answer: 17, near: [{ v: 16, fb: "Add the 1 back: $n = 16 + 1$." }], hint: "$16 + 1$.", m: "n = 17", say: "Check: $4 + 6(16) = 100$." }],
        why: "Find $a$ and $d$, substitute, solve." },
      { type: "num", kicker: "On your own", prompt: "An arithmetic sequence has $a_1 = 9$ and $d = 4$. Find $a_{25}$.", pre: "$a_{25} =$", answer: 105, skill: "Explicit arithmetic formula", near: [{ v: 109, fb: "There are $n - 1 = 24$ steps, not 25: $9 + 24 \\cdot 4$." }, { v: 100, fb: "$24 \\cdot 4 = 96$, then add $a_1 = 9$." }], hints: ["$9 + 24 \\cdot 4$."], why: "$9 + 96 = 105$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**From two terms.** An arithmetic sequence has $a_3 = 11$ and $a_8 = 31$. Find a formula for $a_n$.",
        scene: { type: "walk", how: [["Find d", "Change in value divided by change in position."], ["Find first", "Step back from a known term."], ["Write", "Use $a_n = a_1 + (n - 1)d$."]], rows: [
          { step: 1, m: "d = \\frac{31 - 11}{8 - 3} = 4", say: "From term 3 to term 8 is 5 steps, adding 20 in all." },
          { step: 2, m: "a_1 = 11 - 2(4) = 3", say: "Term 1 is two steps before term 3.", ask: { prompt: "Why subtract $2 \\cdot 4$?", answer: 0, options: [{ t: "Going back from term 3 to term 1 is 2 steps of 4" }, { t: "Because 11 is the second term", fb: "11 is the **third** term: two steps back from it is term 1." }] } },
          { step: 3, m: "a_n = 3 + 4(n - 1) = 4n - 1", say: "Check: $a_8 = 4(8) - 1 = 31$ ✓." }] },
        gate: true, then: "$a_n = 4n - 1$." },
      { type: "num", kicker: "Try it", prompt: "An arithmetic sequence starts at 100 and goes down by 3 each step. Which term is equal to $-2$?", pre: "$n =$", answer: 35, skill: "Explicit arithmetic formula", near: [{ v: 34, fb: "That is $n - 1$. Solve $100 - 3(n - 1) = -2$ then add 1." }, { v: 36, fb: "$102 \\div 3 = 34$ gives $n - 1$; $n = 35$." }], hints: ["$100 + (n - 1)(-3) = -2$."], why: "$102 = 3(n - 1)$, so $n - 1 = 34$ and $n = 35$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Mia writes the formula for $5,\\ 8,\\ 11,\\ \\dots$ Tap the line where the work **first** goes wrong.",
        lines: ["a_1 = 5,\\ d = 3", "a_n = 5 + 3n", "a_{10} = 5 + 3(10) = 35"], answer: 1, fix: "a_n = 5 + 3(n - 1)",
        fb: { 0: "The first term is 5 and each step adds 3.", 2: LATER }, skill: "Explicit arithmetic formula",
        hints: ["Check $n = 1$: it must give 5."], why: "$5 + 3(1) = 8$ is the second term, not the first. With $n - 1$: $a_{10} = 5 + 27 = 32$." },
      { type: "num", kicker: "Use it", prompt: "The first row of a theatre has 20 seats and every row has 3 more seats than the one in front. How many seats are in row 12?", pre: "seats =", answer: 53, skill: "Explicit arithmetic formula", near: [{ v: 56, fb: "There are 11 steps from row 1 to row 12, not 12: $20 + 11 \\cdot 3$." }, { v: 33, fb: "That is the extra seats; add the 20 in row 1." }], hints: ["$20 + 11 \\cdot 3$."], why: "$20 + 33 = 53$." }
    ]
  });
  /* ============================================ 5 · Geometric sequences: the common ratio */
  var HOW_5 = [["Divide", "Divide each term by the one before it."],
               ["Compare", "Are **all** the ratios equal?"],
               ["Use", "If so it is geometric: multiply by $r$ to go on."]];
  var SEQ5 = [[3, 6, 12, 24, 48], [3, 6, 9, 12, 15], [81, 27, 9, 3, 1], [2, 4, 8, 14, 22], [5, -10, 20, -40, 80]];
  var RATIOS = function (a) { var out = [], i; for (i = 1; i < a.length; i++) out.push(a[i] / a[i - 1]); return out; };
  var RFMT = function (r) { return Math.abs(r) < 1 && Math.abs(1 / r - Math.round(1 / r)) < 1e-9 ? (r < 0 ? "-" : "") + "\\frac{1}{" + Math.abs(Math.round(1 / r)) + "}" : nm(f4(r, 2)); };
  var RTEX = function (a) { return a.map(RFMT).join(",\\ "); };
  LESSONS.push({
    title: "Geometric sequences", art: "pcseq",
    blurb: "Book 11.3 · A sequence that multiplies by the same number every step: the common ratio $r$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "By what do you multiply 3 to get 12?", pre: "factor =", answer: 4, skill: "Ratios", near: [{ v: 9, fb: "That is the difference. We want the factor: $12 \\div 3$." }], hints: ["$12 \\div 3$."], why: "$12 \\div 3 = 4$." },
      { type: "learn", kicker: "Explore",
        prompt: "Pick a sequence. The readout shows the **ratios** of neighbouring terms (each term divided by the one before). Find **all three** sequences with the same ratio every step.",
        scene: { type: "sketch", x: [0, 6], y: [-45, 85], u: 44, uy: 2.2, gx: 1, step: 1, gy: 20, stepY: 20, w: 312, gate: true, pts: {},
          chips: { q: { label: "Sequence", v: "1", opts: SEQ5.map(function (q, i) { return ["" + i, q.join(", ")]; }) } },
          track: function (s) { var r = RATIOS(SEQ5[+s.c.q]); return r.every(function (x) { return Math.abs(x - r[0]) < 1e-9; }) ? "g" + s.c.q : null; },
          draw: function (s) { var q = SEQ5[+s.c.q], it = [], i; for (i = 0; i < q.length; i++) it.push(dot(i + 1, q[i], "blue")); return it; },
          readout: function (s) { var q = SEQ5[+s.c.q], r = RATIOS(q), ok = r.every(function (x) { return Math.abs(x - r[0]) < 1e-9; }); return "ratios: $" + RTEX(r) + "$ · " + (ok ? "the **same** each time: geometric, $r = " + RFMT(r[0]) + "$" : "**not** all equal: not geometric") + "<br>Found " + Math.min(3, Object.keys(s.tracked).length) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "$3, 6, 12, \\dots$ has $r = 2$, $81, 27, 9, \\dots$ has $r = \\frac{1}{3}$ and $5, -10, 20, \\dots$ has $r = -2$. These are **geometric sequences**. $3, 6, 9, \\dots$ is arithmetic (the **differences** match, not the ratios), and $2, 4, 8, 14, \\dots$ is neither." },
      { type: "learn", kicker: "The idea",
        prompt: "In a **geometric sequence** each term is the previous one **times the same number** $r$, the **common ratio**. Find $r$ by dividing a term by the one before it, and check that **every** ratio is the same. Recursively: $a_n = r\\,a_{n-1}$.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Is $2,\\ 6,\\ 18,\\ 54$ geometric? If so, write the next two terms.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "\\frac{6}{2} = 3", say: "Divide the second term by the first." },
          { step: 1, m: "\\frac{18}{6} = 3,\\ \\frac{54}{18} = 3", say: "The other ratios.", ask: { prompt: "All the ratios are 3, so the sequence is…", answer: 0, options: [{ t: "geometric, with $r = 3$" }, { t: "arithmetic", fb: "Arithmetic needs equal **differences** ($4, 12, 36$ are not)." }] } },
          { step: 2, m: "r = 3", say: "A common ratio, so it is geometric." },
          { step: 3, m: "54 \\cdot 3 = 162", say: "Multiply the last term by $r$." },
          { step: 3, m: "162 \\cdot 3 = 486", say: "And again: $2, 6, 18, 54, 162, 486$." }] },
        gate: true, then: "Geometric with $r = 3$; the next terms are $162$ and $486$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you work with $12,\\ 6,\\ 3,\\ 1.5$.",
        how: HOW_5, skill: "Geometric sequences",
        steps: [
          { step: 1, ask: "$\\dfrac{6}{12} =$ (a decimal is fine)", type: "num", pre: "ratio =", answer: 0.5, tol: 0.001, calc: true, near: [{ v: 2, tol: 0.001, fb: "Divide the **later** term by the earlier: $6 \\div 12$." }], hint: "$6 \\div 12$.", m: "\\frac{6}{12} = 0.5", say: "The first ratio." },
          { step: 1, ask: "$\\dfrac{3}{6} =$", type: "num", pre: "ratio =", answer: 0.5, tol: 0.001, calc: true, near: [{ v: 2, tol: 0.001, fb: "Later term over earlier: $3 \\div 6$." }], hint: "$3 \\div 6$.", m: "\\frac{3}{6} = 0.5", say: "The same. So $r = \\frac{1}{2}$." },
          { step: 2, ask: "A ratio below 1 means the terms are…", type: "choice", answer: 0, options: [{ t: "getting smaller" }, { t: "getting larger", fb: "Multiplying by $\\frac{1}{2}$ halves each term." }], m: "r = \\tfrac{1}{2}", say: "Shrinking." },
          { step: 3, ask: "The term after 1.5 is $1.5 \\times 0.5 =$", type: "num", pre: "next =", answer: 0.75, tol: 0.001, calc: true, near: [{ v: 3, tol: 0.001, fb: "Multiply by $r = 0.5$, do not double." }], hint: "Half of 1.5.", m: "0.75", say: "The next term." }],
        why: "Divide, compare, use." },
      { type: "num", kicker: "On your own", prompt: "Find the common ratio of $5,\\ -15,\\ 45,\\ -135$.", pre: "$r =$", answer: -3, skill: "Geometric sequences", near: [{ v: 3, fb: "The terms alternate in sign, so $r$ is **negative**." }, { v: -20, fb: "That is a difference. Divide: $-15 \\div 5$." }], hints: ["$-15 \\div 5$."], why: "$r = -3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A negative ratio.** A geometric sequence has $a_1 = 4$ and $r = -2$. Write the first five terms and the recursive formula.",
        scene: { type: "walk", how: [["Start", "Write $a_1$ and $r$."], ["Multiply", "Multiply the previous term by $r$ each time."], ["Write the rule", "$a_1 = \\dots,\\ a_n = r\\,a_{n-1}$."]], rows: [
          { step: 1, m: "a_1 = 4,\\ r = -2", say: "A negative ratio flips the sign of every term." },
          { step: 2, m: "a_2 = 4(-2) = -8", say: "Multiply by $-2$." },
          { step: 2, m: "a_3 = 16,\\ a_4 = -32,\\ a_5 = 64", say: "$-8 \\cdot -2 = 16$, $16 \\cdot -2 = -32$, $-32 \\cdot -2 = 64$.", ask: { prompt: "Why do the signs alternate?", answer: 0, options: [{ t: "Each step multiplies by a negative number" }, { t: "Because 4 is even", fb: "It is the negative ratio that flips the sign each time." }] } },
          { step: 3, m: "a_1 = 4,\\ a_n = -2a_{n-1}", say: "The recursive formula." }] },
        gate: true, then: "$4, -8, 16, -32, 64$; $a_1 = 4$, $a_n = -2a_{n-1}$." },
      { type: "num", kicker: "Try it", prompt: "A geometric sequence has $a_1 = 81$ and $r = \\frac{1}{3}$. What is $a_4$?", pre: "$a_4 =$", answer: 3, skill: "Geometric sequences", near: [{ v: 9, fb: "That is $a_3$. One more step." }, { v: 27, fb: "That is $a_2$. Keep going to $a_4$." }], hints: ["$81, 27, 9, \\dots$"], why: "$81, 27, 9, 3$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says $1,\\ 3,\\ 6,\\ 10$ is geometric because it grows quickly. What is wrong?",
        options: [{ t: "The ratios are $3, 2, \\frac{5}{3}$: not all equal" }, { t: "Nothing: fast growth means geometric", fb: "Geometric needs the **same ratio** every step." }, { t: "The ratios are all 3", fb: "$6 \\div 3 = 2$ and $10 \\div 6 \\approx 1.67$." }],
        answer: 0, skill: "Geometric sequences", hints: ["Divide each term by the one before."], why: "$3, 2, 1.67$: not constant." },
      { type: "num", kicker: "Use it", prompt: "A ball bounces to $\\frac{3}{4}$ of its previous height. The first bounce is 80 cm. How high is the third bounce, in cm?", pre: "height =", post: "cm", answer: 45, skill: "Geometric sequences", near: [{ v: 60, fb: "That is the second bounce. One more multiplication by $\\frac{3}{4}$." }, { v: 35, fb: "Multiply by $\\frac{3}{4}$ each time, do not subtract." }], hints: ["$80,\\ 80 \\cdot 0.75,\\ \\dots$"], why: "$80, 60, 45$." }
    ]
  });

  /* ============================================ 6 · The explicit formula of a geometric sequence */
  var HOW_6 = [["Find a, r", "Read the first term $a_1$ and the common ratio $r$."],
               ["Substitute", "Put them into $a_n = a_1 r^{\\,n-1}$."],
               ["Evaluate", "Work out the power, then multiply."]];
  LESSONS.push({
    title: "The explicit formula of a geometric sequence", art: "pcseq",
    blurb: "Book 11.3 · $a_n = a_1r^{n-1}$: multiply by $r$ a total of $n - 1$ times.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $5 \\cdot 3^3$.", pre: "value =", answer: 135, skill: "Powers", near: [{ v: 3375, fb: "The power belongs to the 3 only: $3^3 = 27$, then times 5." }, { v: 45, fb: "$3^3 = 27$, not $3 \\cdot 3$." }], hints: ["$3^3 = 27$."], why: "$5 \\cdot 27 = 135$." },
      { type: "learn", kicker: "Explore",
        prompt: "The sequence is $3, 6, 12, 24, \\dots$ (each term doubles). Slide $n$ and watch $a_n = 3 \\cdot 2^{n-1}$. Find the **first term above 1000**.",
        scene: { type: "sketch", x: [0, 12], y: [0, 1700], u: 28, uy: 0.18, gx: 1, step: 2, gy: 400, stepY: 400, pad: 36, w: 408, gate: true, pts: {},
          params: { n: { min: 1, max: 11, step: 1, v: 4, label: "$n$" } },
          draw: function (s) { var it = [], k; for (k = 1; k <= 11; k++) it.push(dot(k, 3 * Math.pow(2, k - 1), k === s.p.n ? "orange" : "blue")); return it; },
          readout: function (s) { var n = s.p.n, v = 3 * Math.pow(2, n - 1); return "$a_{" + n + "} = 3 \\cdot 2^{" + (n - 1) + "} = " + v + "$" + (v > 1000 ? " · above 1000" : ""); },
          goal: function (s) { return s.p.n === 10; } },
        gate: true, then: "$a_9 = 3 \\cdot 2^8 = 768$ is still below 1000, but $a_{10} = 3 \\cdot 2^9 = 1536$ is above it. The terms **multiply** by $r = 2$ each step, so $a_n = a_1 r^{n-1}$: $n - 1$ multiplications between term 1 and term $n$. Geometric growth is far faster than arithmetic growth." },
      { type: "learn", kicker: "The idea",
        prompt: "$a_n = a_1 r^{\\,n-1}$: start at $a_1$ and multiply by $r$ a total of $n - 1$ times. Given two terms, **divide** them to find a power of $r$. Given $a_n$ and want $n$? Solve $r^{n-1} = \\frac{a_n}{a_1}$.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write an explicit formula for $5,\\ 10,\\ 20,\\ 40,\\ \\dots$ and find $a_8$.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "a_1 = 5,\\ r = 2", say: "The first term is 5 and each term doubles." },
          { step: 2, m: "a_n = 5 \\cdot 2^{n-1}", say: "Substitute into $a_n = a_1 r^{n-1}$." },
          { step: 3, m: "a_8 = 5 \\cdot 2^7", say: "$n - 1 = 7$.", ask: { prompt: "Why is the exponent $7$ and not $8$?", answer: 0, options: [{ t: "From term 1 to term 8 you multiply 7 times" }, { t: "Because 8 is even", fb: "$a_1$ needs no multiplication, so the exponent is $n - 1$." }] } },
          { step: 3, m: "5 \\cdot 128 = 640", say: "$2^7 = 128$." }] },
        gate: true, then: "$a_n = 5 \\cdot 2^{n-1}$, and $a_8 = 640$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you work with $a_1 = 2$ and $r = 3$.",
        how: HOW_6, skill: "Explicit geometric formula",
        steps: [
          { step: 1, ask: "The formula is…", type: "choice", answer: 0, options: [{ t: "$a_n = 2 \\cdot 3^{n-1}$" }, { t: "$a_n = 2 \\cdot 3^{n}$", fb: "The exponent is $n - 1$: $a_1$ has no multiplication." }, { t: "$a_n = 3 \\cdot 2^{n-1}$", fb: "$a_1 = 2$ is the starting value and $r = 3$ is the ratio." }], m: "a_n = 2 \\cdot 3^{n-1}", say: "Start 2, ratio 3." },
          { step: 2, ask: "For $a_5$ the exponent is $4$. $3^4 =$", type: "num", pre: "$3^4 =$", answer: 81, near: [{ v: 12, fb: "$3^4 = 3 \\cdot 3 \\cdot 3 \\cdot 3$, not $3 \\cdot 4$." }], hint: "$9 \\cdot 9$.", m: "a_5 = 2 \\cdot 3^4", say: "Work out the power." },
          { step: 3, ask: "$a_5 = 2 \\cdot 81 =$", type: "num", pre: "$a_5 =$", answer: 162, near: [{ v: 486, fb: "$n - 1 = 4$: $3^4 = 81$, then times 2." }], hint: "$2 \\cdot 81$.", m: "a_5 = 162", say: "The sequence runs $2, 6, 18, 54, 162$." }],
        why: "Find $a_1$ and $r$, substitute, evaluate." },
      { type: "num", kicker: "On your own", prompt: "A geometric sequence has $a_1 = 6$ and $r = 2$. Find $a_7$.", pre: "$a_7 =$", answer: 384, skill: "Explicit geometric formula", near: [{ v: 768, fb: "The exponent is $n - 1 = 6$, not 7: $2^6 = 64$." }, { v: 42, fb: "$2^6 = 64$, then times 6." }], hints: ["$6 \\cdot 2^6$."], why: "$6 \\cdot 64 = 384$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**From two terms.** A geometric sequence has $a_2 = 12$ and $a_5 = 96$. Find $r$ and $a_1$.",
        scene: { type: "walk", how: [["Divide", "Divide the later term by the earlier one."], ["Take the root", "The result is $r$ to the power of the number of steps."], ["Step back", "Divide by $r$ to find $a_1$."]], rows: [
          { step: 1, m: "\\frac{a_5}{a_2} = \\frac{96}{12} = 8", say: "From term 2 to term 5 is 3 steps: the ratio is multiplied in 3 times." },
          { step: 2, m: "r^3 = 8 \\ \\Rightarrow \\ r = 2", say: "$2 \\cdot 2 \\cdot 2 = 8$.", ask: { prompt: "Why $r^3$ and not $r^5$?", answer: 0, options: [{ t: "There are 3 steps from term 2 to term 5" }, { t: "Because 5 is the last term", fb: "The number of multiplications is $5 - 2 = 3$." }] } },
          { step: 3, m: "a_1 = \\frac{12}{2} = 6", say: "Term 1 is one step before term 2." }] },
        gate: true, then: "$r = 2$ and $a_1 = 6$, so $a_n = 6 \\cdot 2^{n-1}$." },
      { type: "num", kicker: "Try it", prompt: "A geometric sequence has $a_1 = 1000$ and $r = 0.9$. Find $a_3$.", pre: "$a_3 =$", answer: 810, skill: "Explicit geometric formula", near: [{ v: 900, fb: "That is $a_2$. $a_3 = 1000 \\cdot 0.9^2$." }, { v: 729, fb: "The exponent is $n - 1 = 2$, not 3." }], hints: ["$1000 \\cdot 0.9^2$."], why: "$1000 \\cdot 0.81 = 810$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Rio writes the formula for $4,\\ 12,\\ 36,\\ \\dots$ Tap the line where the work **first** goes wrong.",
        lines: ["a_1 = 4,\\ r = 3", "a_n = 4 \\cdot 3^n", "a_4 = 4 \\cdot 3^4 = 324"], answer: 1, fix: "a_n = 4 \\cdot 3^{n-1}",
        fb: { 0: "The first term is 4 and $\\frac{12}{4} = 3$.", 2: LATER }, skill: "Explicit geometric formula",
        hints: ["Check $n = 1$: it must give 4."], why: "$4 \\cdot 3^1 = 12$ is the second term. With $n - 1$: $a_4 = 4 \\cdot 27 = 108$." },
      { type: "num", kicker: "Use it", prompt: "A town of 8000 people grows 5% a year, so $a_n = 8000(1.05)^{n-1}$ with $a_1 = 8000$. What is the population in year 4, to the nearest person? (The box accepts expressions such as 2000*(1+0.05/12)^24.)", pre: "people =", answer: 9261, tol: 0.5, calc: true, skill: "Explicit geometric formula", near: [{ v: 9724, tol: 1, fb: "The exponent is $n - 1 = 3$, not 4." }, { v: 9200, tol: 1, fb: "Growth compounds: multiply by 1.05 three times, do not add 5% of 8000 three times." }], hints: ["$8000 \\cdot 1.05^3$."], why: "$8000 \\cdot 1.157625 = 9261$." }
    ]
  });
  /* ========================================================= series helpers */
  var BAR = function (k, v, c) { return { poly: [[k - 0.35, 0], [k + 0.35, 0], [k + 0.35, v], [k - 0.35, v]], c: c, fill: true }; };

  /* ============================================ 7 · Summation notation */
  var HOW_7 = [["Read", "The lower limit, the upper limit and the rule for each term."],
               ["List", "Write the term for each $k$ from the lower to the upper limit."],
               ["Add", "Add the terms."]];
  LESSONS.push({
    title: "Summation notation", art: "pcseq",
    blurb: "Book 11.4 · $\\sum_{k=1}^{5}$ is a short way to say \"add these terms\"; a sum of a sequence is a series.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Add: $2 + 4 + 6 + 8$.", pre: "sum =", answer: 20, skill: "Adding terms", near: [{ v: 14, fb: "$2 + 4 = 6$, $6 + 6 = 12$, $12 + 8 = 20$." }], hints: ["$6 + 6 + 8$."], why: "$20$." },
      { type: "learn", kicker: "Explore",
        prompt: "The bars are the terms $2k + 1$ for $k = 1, 2, \\dots, 8$. Slide the **lower** and **upper** limits: the green bars are the terms being added. Find the limits that give a total of **35**.",
        scene: { type: "sketch", x: [0, 9], y: [0, 18], u: 36, uy: 15, gx: 1, step: 1, gy: 2, stepY: 2, w: 372, gate: true, pts: {},
          params: { lo: { min: 1, max: 6, step: 1, v: 2, label: "lower $k$" }, hi: { min: 1, max: 8, step: 1, v: 3, label: "upper $k$" } },
          draw: function (s) { var it = [], k; for (k = 1; k <= 8; k++) it.push(BAR(k, 2 * k + 1, k >= s.p.lo && k <= s.p.hi ? "green" : "soft")); return it; },
          readout: function (s) { var lo = s.p.lo, hi = s.p.hi, t = [], tot = 0, k; for (k = lo; k <= hi; k++) { t.push(2 * k + 1); tot += 2 * k + 1; } return "$\\sum_{k=" + lo + "}^{" + hi + "}(2k + 1) = " + (t.length ? t.join(" + ") + " = " + tot : "0") + "$" + (t.length ? "" : " (the lower limit is above the upper: nothing to add)") + (tot === 35 ? " ✓" : ""); },
          goal: function (s) { var tot = 0, k; for (k = s.p.lo; k <= s.p.hi; k++) tot += 2 * k + 1; return tot === 35; } },
        gate: true, then: "$\\sum_{k=1}^{5}(2k + 1) = 3 + 5 + 7 + 9 + 11 = 35$. **Summation notation** says: put $k = 1$, then $2$, up to $5$ into the rule $2k + 1$, and add. The numbers under and over the $\\sum$ are the **limits**." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\sum_{k=a}^{b} f(k)$ means: put $k = a, a + 1, \\dots, b$ into $f(k)$ and **add** the results. The sum of the terms of a sequence is a **series**. The number of terms is $b - a + 1$.",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Evaluate $\\displaystyle\\sum_{k=1}^{4}(3k - 1)$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "k = 1\\text{ to }4,\\ 3k - 1", say: "The limits are 1 and 4: four terms." },
          { step: 2, m: "3(1) - 1 = 2", say: "$k = 1$." },
          { step: 2, m: "3(2) - 1 = 5,\\ \\ 3(3) - 1 = 8", say: "$k = 2$ and $k = 3$.", ask: { prompt: "What is the term for $k = 4$?", answer: 0, options: [{ t: "$3(4) - 1 = 11$" }, { t: "$3 \\cdot 4 = 12$", fb: "Do not forget the $-1$ in the rule." }] } },
          { step: 3, m: "2 + 5 + 8 + 11 = 26", say: "Add the four terms." }] },
        gate: true, then: "$26$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you evaluate $\\displaystyle\\sum_{k=2}^{5}k^2$.",
        how: HOW_7, skill: "Summation notation",
        steps: [
          { step: 1, ask: "The limits are 2 and 5. How many terms are there?", type: "num", pre: "terms =", answer: 4, near: [{ v: 3, fb: "$2, 3, 4, 5$: four terms ($5 - 2 + 1$)." }, { v: 5, fb: "The sum starts at 2, not 1." }], hint: "$5 - 2 + 1$.", m: "k = 2, 3, 4, 5", say: "Four terms." },
          { step: 2, ask: "The first term is $2^2 =$", type: "num", pre: "first =", answer: 4, near: [{ v: 1, fb: "The sum starts at $k = 2$: $2^2$." }], hint: "$2 \\cdot 2$.", m: "4 + 9 + 16 + 25", say: "$2^2, 3^2, 4^2, 5^2$." },
          { step: 3, ask: "The sum $4 + 9 + 16 + 25 =$", type: "num", pre: "sum =", answer: 54, near: [{ v: 55, fb: "That includes $1^2$. The sum starts at 2: $4 + 9 + 16 + 25$." }], hint: "$13 + 41$.", m: "54", say: "The series." }],
        why: "Read, list, add." },
      { type: "num", kicker: "On your own", prompt: "Evaluate $\\displaystyle\\sum_{k=1}^{6}(2k - 3)$.", pre: "sum =", answer: 24, skill: "Summation notation", near: [{ v: 30, fb: "Do not forget the $-3$ in each term: $-1, 1, 3, 5, 7, 9$." }, { v: 21, fb: "Check the terms: $-1, 1, 3, 5, 7, 9$." }], hints: ["The terms are $-1, 1, 3, \\dots$"], why: "$-1 + 1 + 3 + 5 + 7 + 9 = 24$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Alternating signs.** Evaluate $\\displaystyle\\sum_{k=1}^{5}(-1)^k\\,k$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "(-1)^k k,\\ k = 1\\text{ to }5", say: "The factor $(-1)^k$ alternates the signs." },
          { step: 2, m: "-1,\\ +2,\\ -3,\\ +4,\\ -5", say: "Odd $k$ gives a minus, even $k$ a plus.", ask: { prompt: "The sign of the $k = 3$ term is…", answer: 0, options: [{ t: "negative: $(-1)^3 = -1$" }, { t: "positive", fb: "An odd power of $-1$ is $-1$." }] } },
          { step: 3, m: "-1 + 2 - 3 + 4 - 5 = -3", say: "Add them in order." }] },
        gate: true, then: "$-3$." },
      { type: "num", kicker: "Try it", prompt: "$4 + 8 + 12 + 16 + 20 = \\displaystyle\\sum_{k=1}^{5} c\\,k$. What is $c$?", pre: "$c =$", answer: 4, skill: "Summation notation", near: [{ v: 5, fb: "5 is the upper limit. The terms are 4 times $k$." }, { v: 20, fb: "That is the last term. Look at the first: $4 = c \\cdot 1$." }], hints: ["The first term is $c \\cdot 1$."], why: "$4(1), 4(2), \\dots, 4(5)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee works out $\\displaystyle\\sum_{k=3}^{6}k$ as $1 + 2 + 3 + 4 + 5 + 6 = 21$. What is wrong?",
        options: [{ t: "The sum starts at $k = 3$: it is $3 + 4 + 5 + 6 = 18$" }, { t: "Nothing: sums always start at 1", fb: "The lower limit tells you where to start." }, { t: "It should be $3 \\cdot 6 = 18$", fb: "It is a sum of the terms $3, 4, 5, 6$; it happens to be 18, but not as $3 \\cdot 6$." }],
        answer: 0, skill: "Summation notation", hints: ["Read the lower limit."], why: "$3 + 4 + 5 + 6 = 18$." },
      { type: "num", kicker: "Use it", prompt: "You pay $\\$50k$ in month $k$ for four months: $\\sum_{k=1}^{4}50k$. How much do you pay in total, in dollars?", pre: "total =", post: "dollars", answer: 500, skill: "Summation notation", near: [{ v: 200, fb: "That is 4 payments of 50. The payments are 50, 100, 150, 200." }, { v: 250, fb: "Add all four payments: 50, 100, 150, 200." }], hints: ["$50 + 100 + 150 + 200$."], why: "$500$." }
    ]
  });

  /* ============================================ 8 · Arithmetic series */
  var HOW_8 = [["First, last", "The first and last terms (find $a_n$ if it is not given)."],
               ["Pair up", "$S_n = \\frac{n}{2}(a_1 + a_n)$: the average term times the number of terms."],
               ["Compute", "Substitute and evaluate."]];
  LESSONS.push({
    title: "Arithmetic series", art: "pcseq",
    blurb: "Book 11.4 · Add the first and last term, multiply by half the number of terms.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is the average of 3 and 99?", pre: "average =", answer: 51, skill: "Averages", near: [{ v: 102, fb: "That is the sum. The average is half of it." }], hints: ["Add, then halve."], why: "$\\frac{3 + 99}{2} = 51$." },
      { type: "learn", kicker: "Explore",
        prompt: "The series is $3 + 7 + 11 + 15 + \\dots$, with $a_n = 4n - 1$. Slide the number of terms $n$. The readout uses $S_n = \\frac{n}{2}(a_1 + a_n)$. Find $n$ so that the sum is **300**.",
        scene: { type: "sketch", x: [0, 16], y: [0, 70], u: 21, uy: 4, gx: 1, step: 2, gy: 10, stepY: 10, w: 384, gate: true, pts: {},
          params: { n: { min: 1, max: 15, step: 1, v: 5, label: "$n$" } },
          draw: function (s) { var it = [], k; for (k = 1; k <= 15; k++) it.push(BAR(k, 4 * k - 1, k <= s.p.n ? "green" : "soft")); return it; },
          readout: function (s) { var n = s.p.n, an = 4 * n - 1, S = n * (3 + an) / 2; return "$a_n = " + an + "$ · $S_n = \\frac{" + n + "}{2}(3 + " + an + ") = " + S + "$" + (S === 300 ? " ✓" : ""); },
          goal: function (s) { return s.p.n * (3 + 4 * s.p.n - 1) / 2 === 300; } },
        gate: true, then: "$n = 12$: $a_{12} = 47$ and $S_{12} = \\frac{12}{2}(3 + 47) = 300$. **Pair up** the terms: first with last ($3 + 47$), second with second-to-last ($7 + 43$), and so on: every pair adds to $50$, and there are $\\frac{12}{2} = 6$ pairs. That is Gauss's trick." },
      { type: "learn", kicker: "The idea",
        prompt: "In an **arithmetic series** the first and last terms, the second and second-to-last, and so on, all add to the **same total**. So $S_n = \\frac{n}{2}(a_1 + a_n)$. If you do not know $a_n$, use $a_n = a_1 + (n - 1)d$ first.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $1 + 2 + 3 + \\dots + 100$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "a_1 = 1,\\ a_n = 100,\\ n = 100", say: "An arithmetic series with $d = 1$." },
          { step: 2, m: "1 + 100 = 101,\\ 2 + 99 = 101", say: "Pair first with last: every pair adds to 101.", ask: { prompt: "How many pairs are there?", answer: 0, options: [{ t: "$\\frac{100}{2} = 50$" }, { t: "$100$", fb: "Each pair uses two terms, so there are half as many pairs as terms." }] } },
          { step: 3, m: "S_{100} = \\frac{100}{2}(1 + 100)", say: "Substitute into $S_n = \\frac{n}{2}(a_1 + a_n)$." },
          { step: 3, m: "50 \\cdot 101 = 5050", say: "Multiply." }] },
        gate: true, then: "$5050$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you add $5 + 9 + 13 + \\dots + 49$.",
        how: HOW_8, skill: "Arithmetic series",
        steps: [
          { step: 1, ask: "$d = 9 - 5 = 4$. Solve $5 + 4(n - 1) = 49$: $4(n - 1) = 44$, so $n =$", type: "num", pre: "$n =$", answer: 12, near: [{ v: 11, fb: "That is $n - 1$. Add 1." }, { v: 44, fb: "That is $4(n - 1)$. Divide by 4, then add 1." }], hint: "$44 \\div 4 + 1$.", m: "n = 12", say: "Twelve terms." },
          { step: 2, ask: "$S_{12} = \\frac{12}{2}(5 + 49)$. The bracket is", type: "num", pre: "$a_1 + a_n =$", answer: 54, near: [{ v: 44, fb: "Add the first and last terms: $5 + 49$." }], hint: "$5 + 49$.", m: "6(54)", say: "Six pairs of 54." },
          { step: 3, ask: "$6 \\cdot 54 =$", type: "num", pre: "$S_{12} =$", answer: 324, near: [{ v: 648, fb: "Halve the number of terms first: $\\frac{12}{2} = 6$." }], hint: "$6 \\cdot 50 + 6 \\cdot 4$.", m: "S_{12} = 324", say: "The sum of the series." }],
        why: "Find first and last, pair up, compute." },
      { type: "num", kicker: "On your own", prompt: "An arithmetic series has $a_1 = 4$ and $d = 3$. Find $S_{20}$.", pre: "$S_{20} =$", answer: 650, skill: "Arithmetic series", near: [{ v: 61, fb: "That is $a_{20} = 4 + 19 \\cdot 3$. Now $S_{20} = 10(4 + 61)$." }, { v: 1300, fb: "Halve: $S_n = \\frac{n}{2}(a_1 + a_n)$." }], hints: ["$a_{20} = 4 + 19 \\cdot 3$."], why: "$a_{20} = 61$, so $S_{20} = 10 \\cdot 65 = 650$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**From a formula.** The terms are $a_n = 3n - 2$. Find $S_{15}$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "a_1 = 3(1) - 2 = 1", say: "The first term." },
          { step: 1, m: "a_{15} = 3(15) - 2 = 43", say: "The last term of the 15.", ask: { prompt: "Is this an arithmetic sequence?", answer: 0, options: [{ t: "Yes: $3n - 2$ is linear in $n$, with $d = 3$" }, { t: "No", fb: "A formula $an + b$ always gives an arithmetic sequence, with $d = a$." }] } },
          { step: 2, m: "S_{15} = \\frac{15}{2}(1 + 43)", say: "Substitute." },
          { step: 3, m: "\\frac{15}{2}(44) = 330", say: "$15 \\times 22 = 330$." }] },
        gate: true, then: "$330$." },
      { type: "num", kicker: "Try it", prompt: "Find the sum $7 + 10 + 13 + \\dots + 52$.", pre: "sum =", answer: 472, skill: "Arithmetic series", near: [{ v: 944, fb: "Halve the number of terms: $S = \\frac{n}{2}(a_1 + a_n)$." }, { v: 16, fb: "That is the number of terms. Now add them: $\\frac{16}{2}(7 + 52)$." }], hints: ["$7 + 3(n - 1) = 52$ gives $n$."], why: "$n = 16$, so $S = 8 \\cdot 59 = 472$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee finds $S_6$ for $2 + 4 + 6 + 8 + 10 + 12$ as $6(2 + 12) = 84$. What is wrong?",
        options: [{ t: "She forgot to halve: $S_6 = \\frac{6}{2}(2 + 12) = 42$" }, { t: "Nothing: that is the formula", fb: "The formula has $\\frac{n}{2}$, because each pair is counted from both ends." }, { t: "$S_6 = 14$", fb: "That is $a_1 + a_n$. Multiply by $\\frac{n}{2}$." }],
        answer: 0, skill: "Arithmetic series", hints: ["$2 + 4 + 6 + 8 + 10 + 12 = 42$."], why: "$3 \\cdot 14 = 42$." },
      { type: "num", kicker: "Use it", prompt: "Logs are stacked: 20 in the bottom row, 19 in the next, and so on, one fewer each row, for 10 rows. How many logs are there in all?", pre: "logs =", answer: 155, skill: "Arithmetic series", near: [{ v: 310, fb: "Halve: $S = \\frac{10}{2}(20 + 11)$." }, { v: 11, fb: "That is the top row. Add the 10 rows: $\\frac{10}{2}(20 + 11)$." }], hints: ["The top (tenth) row has $20 - 9 = 11$ logs."], why: "$5 \\cdot 31 = 155$." }
    ]
  });

  /* ============================================ 9 · Geometric series */
  var HOW_9 = [["Find a, r", "The first term and the common ratio."],
               ["Formula", "$S_n = \\dfrac{a_1(1 - r^n)}{1 - r}$."],
               ["Compute", "Work out the power, then the fraction."]];
  LESSONS.push({
    title: "Geometric series", art: "pcseq",
    blurb: "Book 11.4 · $S_n = \\frac{a_1(1 - r^n)}{1 - r}$ adds $n$ terms of a geometric sequence in one step.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $\\dfrac{3^4 - 1}{3 - 1}$.", pre: "value =", answer: 40, skill: "Powers and fractions", near: [{ v: 80, fb: "Divide by $3 - 1 = 2$: $\\frac{80}{2}$." }, { v: 26, fb: "$3^4 = 81$, not $27$." }], hints: ["$3^4 = 81$."], why: "$\\frac{80}{2} = 40$." },
      { type: "learn", kicker: "Explore",
        prompt: "The series is $2 + 6 + 18 + 54 + \\dots$ (each term triples). Slide the number of terms $n$ and watch the **total so far**, $S_n$. Find the first $n$ for which the total is **over 1000**.",
        scene: { type: "sketch", x: [0, 9], y: [0, 2400], u: 36, uy: 0.115, gx: 1, step: 1, gy: 500, stepY: 500, pad: 36, w: 396, gate: true, pts: {},
          params: { n: { min: 1, max: 8, step: 1, v: 3, label: "$n$" } },
          draw: function (s) { var it = [], k; for (k = 1; k <= 8; k++) it.push(BAR(k, Math.pow(3, k) - 1, k === s.p.n ? "orange" : "blue")); return it.filter(function (b) { return b.poly[2][1] <= 2400; }); },
          readout: function (s) { var n = s.p.n, S = Math.pow(3, n) - 1; return "$S_{" + n + "} = \\frac{2(1 - 3^{" + n + "})}{1 - 3} = " + S + "$" + (S > 1000 ? " · over 1000" : ""); },
          goal: function (s) { return Math.pow(3, s.p.n) - 1 > 1000 && Math.pow(3, s.p.n - 1) - 1 <= 1000; } },
        gate: true, then: "$S_6 = 728$ is still under 1000, but $S_7 = 2186$ is over. The formula $S_n = \\frac{a_1(1 - r^n)}{1 - r}$ gives each total at once, here $\\frac{2(1 - 3^n)}{1 - 3} = 3^n - 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "For a **geometric series** with first term $a_1$ and ratio $r \\ne 1$, the sum of the first $n$ terms is $S_n = \\dfrac{a_1(1 - r^n)}{1 - r}$. Find $a_1$ and $r$, count the terms, and substitute.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $3 + 6 + 12 + 24 + 48$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "a_1 = 3,\\ r = 2,\\ n = 5", say: "Five terms, each double the one before." },
          { step: 2, m: "S_5 = \\frac{3(1 - 2^5)}{1 - 2}", say: "Substitute into the formula." },
          { step: 3, m: "= \\frac{3(1 - 32)}{-1}", say: "$2^5 = 32$.", ask: { prompt: "What is $\\frac{3(-31)}{-1}$?", answer: 0, options: [{ t: "$93$" }, { t: "$-93$", fb: "A negative divided by a negative is positive." }] } },
          { step: 3, m: "= 93", say: "Check: $3 + 6 + 12 + 24 + 48 = 93$." }] },
        gate: true, then: "$93$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you add $1 + 3 + 9 + 27 + 81 + 243$.",
        how: HOW_9, skill: "Geometric series",
        steps: [
          { step: 1, ask: "$a_1 = 1$ and $r = 3 \\div 1 =$", type: "num", pre: "$r =$", answer: 3, near: [{ v: 2, fb: "That is a difference. The ratio is $3 \\div 1$." }], hint: "$3 \\div 1$.", m: "a_1 = 1,\\ r = 3,\\ n = 6", say: "Six terms." },
          { step: 2, ask: "$r^n = 3^6 =$", type: "num", pre: "$3^6 =$", answer: 729, near: [{ v: 18, fb: "$3^6 = 3 \\cdot 3 \\cdot 3 \\cdot 3 \\cdot 3 \\cdot 3$." }], hint: "$27 \\cdot 27$.", m: "S_6 = \\frac{1 - 729}{1 - 3}", say: "Substitute." },
          { step: 3, ask: "$S_6 = \\dfrac{1 - 729}{-2} =$", type: "num", pre: "$S_6 =$", answer: 364, near: [{ v: -364, fb: "$-728 \\div -2$ is positive." }, { v: 728, fb: "Divide by $-2$ as well." }], hint: "$728 \\div 2$.", m: "S_6 = 364", say: "Check: the last term is 243 and $364 = 243 + 121$." }],
        why: "Find $a_1$ and $r$, formula, compute." },
      { type: "num", kicker: "On your own", prompt: "A geometric series has $a_1 = 5$, $r = 2$ and 8 terms. Find $S_8$.", pre: "$S_8 =$", answer: 1275, skill: "Geometric series", near: [{ v: 640, fb: "That is the last term $5 \\cdot 2^7$. The sum is $\\frac{5(1 - 256)}{1 - 2}$." }, { v: 1280, fb: "$2^8 = 256$, so $1 - 256 = -255$." }], hints: ["$2^8 = 256$."], why: "$\\frac{5(-255)}{-1} = 1275$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A ratio below 1.** Find $80 + 40 + 20 + 10$.",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "a_1 = 80,\\ r = \\tfrac{1}{2},\\ n = 4", say: "Each term is half the one before." },
          { step: 2, m: "S_4 = \\frac{80(1 - \\frac{1}{16})}{1 - \\frac{1}{2}}", say: "$\\left(\\frac{1}{2}\\right)^4 = \\frac{1}{16}$.", ask: { prompt: "What is $1 - \\frac{1}{16}$?", answer: 0, options: [{ t: "$\\frac{15}{16}$" }, { t: "$\\frac{1}{16}$", fb: "$1 = \\frac{16}{16}$, so $1 - \\frac{1}{16} = \\frac{15}{16}$." }] } },
          { step: 3, m: "\\frac{80 \\cdot \\frac{15}{16}}{\\frac{1}{2}} = \\frac{75}{0.5}", say: "$80 \\cdot \\frac{15}{16} = 75$." },
          { step: 3, m: "= 150", say: "Check: $80 + 40 + 20 + 10 = 150$." }] },
        gate: true, then: "$150$." },
      { type: "num", kicker: "Try it", prompt: "Find $\\displaystyle\\sum_{k=1}^{5}4 \\cdot 3^{k-1}$.", pre: "sum =", answer: 484, skill: "Geometric series", near: [{ v: 968, fb: "Divide by $1 - 3 = -2$ after the negative: $\\frac{4(1 - 243)}{-2}$." }, { v: 324, fb: "That is the last term $4 \\cdot 81$. Add all five terms." }], hints: ["$a_1 = 4$, $r = 3$, $n = 5$."], why: "$\\frac{4(1 - 243)}{1 - 3} = \\frac{-968}{-2} = 484$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kay finds $S_4$ for $2 + 4 + 8 + 16$. Tap the line where the work **first** goes wrong.",
        lines: ["a_1 = 2,\\ r = 2,\\ n = 4", "S_4 = \\frac{2(1 - 2^4)}{1 - 2}", "S_4 = \\frac{2(1 - 8)}{1 - 2} = 14"], answer: 2, fix: "S_4 = \\frac{2(1 - 16)}{1 - 2} = 30",
        fb: { 0: "Four terms, doubling from 2.", 1: "That is the formula with the right numbers." }, skill: "Geometric series",
        hints: ["What is $2^4$?"], why: "$2^4 = 16$, so $S_4 = \\frac{2(-15)}{-1} = 30$." },
      { type: "num", kicker: "Use it", prompt: "You save $\\$1$ on day 1 and double the amount each day. How much have you saved in total after 10 days, in dollars?", pre: "total =", post: "dollars", answer: 1023, skill: "Geometric series", near: [{ v: 512, fb: "That is what you save on day 10 alone. The total adds all ten days." }, { v: 1024, fb: "$S_{10} = \\frac{1 - 2^{10}}{1 - 2} = 1024 - 1$." }], hints: ["$a_1 = 1$, $r = 2$, $n = 10$."], why: "$2^{10} - 1 = 1023$." }
    ]
  });

  /* ============================================ 10 · Infinite geometric series */
  var HOW_10 = [["Check r", "If $|r| < 1$ the sum exists; if $|r| \\ge 1$ it does not."],
                ["Formula", "$S = \\dfrac{a_1}{1 - r}$."],
                ["Compute", "Simplify the fraction."]];
  LESSONS.push({
    title: "Infinite geometric series", art: "pcseq",
    blurb: "Book 11.4 · When the ratio is smaller than 1 in size, infinitely many terms still add to a fixed number.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $1 - 0.2$.", pre: "value =", answer: 0.8, tol: 0.001, skill: "Decimals", near: [{ v: 1.2, tol: 0.001, fb: "Subtract: $1 - 0.2$." }], hints: ["$1.0 - 0.2$."], why: "$0.8$." },
      { type: "learn", kicker: "Explore",
        prompt: "The series starts at $a_1 = 4$ with ratio $r$. The dots are the **running totals** $S_1, S_2, \\dots, S_{12}$. Slide $r$. Find a ratio where the totals **settle down** and one where they **do not**.",
        scene: { type: "sketch", x: [0, 13], y: [-12, 40], u: 25, uy: 6, gx: 1, step: 2, gy: 10, stepY: 10, w: 372, gate: true, pts: {},
          params: { r: { min: -1.5, max: 1.5, step: 0.25, v: 0.5, label: "$r$" } },
          track: function (s) { return Math.abs(s.p.r) < 1 ? "conv" : "div"; },
          draw: function (s) { var r = s.p.r, it = [], S = 0, t = 4, n; for (n = 1; n <= 12; n++) { S += t; t *= r; if (S >= -12 && S <= 40) it.push(dot(n, S, "blue")); } if (Math.abs(r) < 1) it.push({ seg: [[0, 4 / (1 - r)], [13, 4 / (1 - r)]], c: "orange", dash: true }); return it; },
          readout: function (s) { var r = s.p.r; return (Math.abs(r) < 1 ? "$r = " + nm(r) + "$: the totals settle at $\\frac{4}{1 - (" + nm(r) + ")} = " + nm(f4(4 / (1 - r), 2)) + "$ (dashed)" : "$r = " + nm(r) + "$: $|r| \\ge 1$, the totals do **not** settle: no sum") + "<br>Settles: " + (s.tracked.conv ? "✓" : "—") + " · does not: " + (s.tracked.div ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.conv && s.tracked.div); } },
        gate: true, then: "When $|r| < 1$ the terms shrink to nothing and the totals approach $\\frac{a_1}{1 - r}$ (the dashed line). When $|r| \\ge 1$ the terms do not shrink: the totals grow without limit or bounce about. An **infinite geometric series** has a sum only when $|r| < 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "An infinite geometric series has a sum **only if $|r| < 1$**; then $S = \\dfrac{a_1}{1 - r}$. If $|r| \\ge 1$ the sum is **not defined**. A repeating decimal such as $0.\\overline{36}$ is an infinite geometric series, so it equals a fraction.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $6 + 3 + 1.5 + 0.75 + \\dots$",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "a_1 = 6,\\ r = \\tfrac{1}{2}", say: "Each term is half the one before." },
          { step: 1, m: "|r| < 1", say: "The ratio is smaller than 1 in size: the sum exists.", ask: { prompt: "Would $6 + 12 + 24 + \\dots$ have a sum?", answer: 0, options: [{ t: "No: $r = 2$, so $|r| \\ge 1$" }, { t: "Yes: it is geometric", fb: "Its terms get bigger, so the total grows without limit." }] } },
          { step: 2, m: "S = \\frac{6}{1 - \\frac{1}{2}}", say: "Substitute into $S = \\frac{a_1}{1 - r}$." },
          { step: 3, m: "S = \\frac{6}{\\frac{1}{2}} = 12", say: "Dividing by $\\frac{1}{2}$ doubles." }] },
        gate: true, then: "$12$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $9 - 3 + 1 - \\frac{1}{3} + \\dots$",
        how: HOW_10, skill: "Infinite geometric series",
        steps: [
          { step: 1, ask: "$r = \\dfrac{-3}{9} =$ (a decimal is fine)", type: "num", pre: "$r =$", answer: -0.3333, tol: 0.001, calc: true, near: [{ v: 0.3333, tol: 0.001, fb: "The terms alternate in sign, so $r$ is **negative**." }], hint: "$-3 \\div 9$.", m: "r = -\\tfrac{1}{3}", say: "Negative ratio." },
          { step: 1, ask: "Is $|r| < 1$, so the sum exists?", type: "choice", answer: 0, options: [{ t: "Yes: $\\frac{1}{3} < 1$" }, { t: "No", fb: "The size of $r$ is $\\frac{1}{3}$, below 1." }], m: "|r| < 1", say: "The sum exists." },
          { step: 2, ask: "$1 - r = 1 - (-\\tfrac{1}{3}) =$ (a decimal is fine)", type: "num", pre: "$1 - r =$", answer: 1.3333, tol: 0.001, calc: true, near: [{ v: 0.6667, tol: 0.001, fb: "Subtracting a negative **adds**: $1 + \\frac{1}{3}$." }], hint: "$1 + \\frac{1}{3}$.", m: "1 - r = \\tfrac{4}{3}", say: "Now divide $a_1$ by it." },
          { step: 3, ask: "$S = \\dfrac{9}{4/3} =$", type: "num", pre: "$S =$", answer: 6.75, tol: 0.001, calc: true, near: [{ v: 12, tol: 0.001, fb: "Dividing by $\\frac{4}{3}$ multiplies by $\\frac{3}{4}$: $9 \\cdot \\frac{3}{4}$." }], hint: "$9 \\cdot \\frac{3}{4}$.", m: "S = 6.75", say: "$\\frac{27}{4}$." }],
        why: "Check $r$, formula, compute." },
      { type: "num", kicker: "On your own", prompt: "Find the sum of $8 + 4 + 2 + 1 + \\dots$", pre: "$S =$", answer: 16, skill: "Infinite geometric series", near: [{ v: 15, fb: "That is $8 + 4 + 2 + 1$. The infinite sum is $\\frac{8}{1 - 0.5}$." }, { v: 4, fb: "Divide $a_1 = 8$ by $1 - r = 0.5$." }], hints: ["$r = \\frac{1}{2}$."], why: "$\\frac{8}{0.5} = 16$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**A repeating decimal.** Write $0.363636\\ldots$ as a fraction.",
        scene: { type: "walk", how: [["Split", "Write it as a sum: $0.36 + 0.0036 + \\dots$"], ["Find r", "Each term is $0.01$ times the one before."], ["Sum", "Use $S = \\frac{a_1}{1 - r}$ and simplify."]], rows: [
          { step: 1, m: "0.36 + 0.0036 + 0.000036 + \\dots", say: "Each repeat is two places further along." },
          { step: 2, m: "a_1 = 0.36,\\ r = 0.01", say: "$0.0036 \\div 0.36 = 0.01$.", ask: { prompt: "Is $|r| < 1$?", answer: 0, options: [{ t: "Yes: 0.01 is tiny, so the sum exists" }, { t: "No", fb: "$0.01 < 1$." }] } },
          { step: 3, m: "S = \\frac{0.36}{1 - 0.01} = \\frac{0.36}{0.99}", say: "Substitute." },
          { step: 3, m: "\\frac{36}{99} = \\frac{4}{11}", say: "Multiply top and bottom by 100, then divide by 9." }] },
        gate: true, then: "$0.363636\\ldots = \\dfrac{4}{11}$." },
      { type: "num", kicker: "Try it", prompt: "Find the sum $12 + 4 + \\frac{4}{3} + \\dots$ (ratio $\\frac{1}{3}$).", pre: "$S =$", answer: 18, skill: "Infinite geometric series", near: [{ v: 16, fb: "That is $12 + 4$. The infinite sum is $\\frac{12}{1 - 1/3}$." }, { v: 36, fb: "$1 - \\frac{1}{3} = \\frac{2}{3}$, and $12 \\div \\frac{2}{3} = 18$." }], hints: ["$\\frac{12}{2/3}$."], why: "$12 \\cdot \\frac{3}{2} = 18$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rin says $2 + 4 + 8 + \\dots = \\dfrac{2}{1 - 2} = -2$. What is wrong?",
        options: [{ t: "$r = 2$, so $|r| \\ge 1$ and the series has **no sum** (the formula does not apply)" }, { t: "Nothing: the sum is $-2$", fb: "Adding positive numbers can never give $-2$." }, { t: "It should be $\\frac{2}{1 + 2}$", fb: "The formula is $\\frac{a_1}{1 - r}$, but only for $|r| < 1$." }],
        answer: 0, skill: "Infinite geometric series", hints: ["Do the totals settle?"], why: "The terms grow, so the totals grow without limit." },
      { type: "num", kicker: "Use it", prompt: "A ball is dropped from 10 m and each rebound is 60% of the previous height, so the heights it falls from are $10,\\ 6,\\ 3.6,\\ \\dots$ What is the **total distance it falls**, in metres?", pre: "distance =", post: "m", answer: 25, skill: "Infinite geometric series", near: [{ v: 16, fb: "That is $10 + 6$. Add all the falls: $\\frac{10}{1 - 0.6}$." }, { v: 40, fb: "$1 - 0.6 = 0.4$ and $10 \\div 0.4 = 25$." }], hints: ["$a_1 = 10$, $r = 0.6$."], why: "$\\frac{10}{0.4} = 25$ m." }
    ]
  });
  /* ========================================================= counting helpers */
  var BOX = function (cx, cy, c) { return { poly: [[cx - 0.4, cy - 0.4], [cx + 0.4, cy - 0.4], [cx + 0.4, cy + 0.4], [cx - 0.4, cy + 0.4]], c: c || "blue" }; };
  var PERM = function (n, r) { return FACT(n) / FACT(n - r); };

  /* ============================================ 11 · The addition and multiplication principles */
  var HOW_11 = [["Choices", "List the choices, and whether they are **both** made or **either-or**."],
                ["Rule", "Both (one after the other): **multiply**. Either one: **add**."],
                ["Compute", "Work out the product or the sum."]];
  LESSONS.push({
    title: "The counting principles", art: "pcseq",
    blurb: "Book 11.5 · Choices made one after another multiply; a choice between separate groups adds.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $4 \\cdot 3 \\cdot 2$.", pre: "value =", answer: 24, skill: "Multiplication", near: [{ v: 9, fb: "That adds. Multiply: $4 \\cdot 3 = 12$, then $\\cdot 2$." }, { v: 12, fb: "Include the last factor: $12 \\cdot 2$." }], hints: ["$12 \\cdot 2$."], why: "$24$." },
      { type: "learn", kicker: "Explore",
        prompt: "You pick **one shirt** and **one pair of trousers**. Each dot is one outfit. Slide the number of shirts $s$ and trousers $p$. Find **two different ways** to get exactly **12 outfits**.",
        scene: { type: "sketch", x: [0, 7], y: [0, 6], u: 40, w: 328, grid: false, gate: true, pts: {},
          params: { s: { min: 1, max: 6, step: 1, v: 2, label: "shirts $s$" }, p: { min: 1, max: 5, step: 1, v: 3, label: "trousers $p$" } },
          track: function (s) { return s.p.s * s.p.p === 12 ? "w" + s.p.s : null; },
          draw: function (s) { var it = [], i, j; for (i = 1; i <= s.p.s; i++) for (j = 1; j <= s.p.p; j++) it.push(dot(i, j, "blue")); return it; },
          readout: function (s) { var t = s.p.s * s.p.p; return "$" + s.p.s + " \\times " + s.p.p + " = " + t + "$ outfits" + (t === 12 ? " ✓" : "") + "<br>Ways to make 12 found: " + Math.min(2, Object.keys(s.tracked).length) + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "$3 \\times 4$, $4 \\times 3$, $2 \\times 6$ or $6 \\times 2$ all give 12. Each shirt can be worn with **every** pair of trousers, so the dots form a grid and the count is a **product**. That is the **Multiplication Principle**: if one choice has $m$ options and, after it, another has $n$, together they have $m \\times n$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Multiplication Principle:** a task done in steps, with $m$ ways for the first, $n$ for the second, and so on, can be done in $m \\times n \\times \\cdots$ ways. **Addition Principle:** if you choose **either** one of two groups that cannot overlap, add the ways: $m + n$.",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "A lunch deal has 3 sandwiches, 4 drinks and 2 desserts. You pick one of each. How many lunches?",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "3,\\ \\ 4,\\ \\ 2", say: "Three separate choices, all made: one sandwich **and** one drink **and** one dessert." },
          { step: 2, m: "3 \\times 4 = 12", say: "Each of the 3 sandwiches goes with each of the 4 drinks: 12 sandwich-and-drink pairs.", ask: { prompt: "Why multiply and not add?", answer: 0, options: [{ t: "Each sandwich can go with every drink" }, { t: "Because multiplying gives a bigger number", fb: "It is because each choice multiplies the possibilities of the others." }] } },
          { step: 2, m: "12 \\times 2", say: "Each of those 12 pairs goes with each of the 2 desserts." },
          { step: 3, m: "= 24", say: "24 different lunches." }] },
        gate: true, then: "$24$ different lunches." },
      { type: "guided", kicker: "Together",
        prompt: "Now you count 3-digit codes, each digit $0$ to $9$.",
        how: HOW_11, skill: "Counting principles",
        steps: [
          { step: 1, ask: "Each of the three digits is chosen separately. The counts are…", type: "choice", answer: 0, options: [{ t: "multiplied" }, { t: "added", fb: "All three choices are made, one after the other: multiply." }], m: "10 \\times 10 \\times 10", say: "Ten options each time." },
          { step: 2, ask: "If digits may repeat: $10 \\cdot 10 \\cdot 10 =$", type: "num", pre: "codes =", answer: 1000, near: [{ v: 30, fb: "Multiply, do not add: $10 \\cdot 10 \\cdot 10$." }], hint: "$10^3$.", m: "10^3 = 1000", say: "From 000 to 999." },
          { step: 3, ask: "If **no digit may repeat**, the options shrink: $10 \\cdot 9 \\cdot 8 =$", type: "num", pre: "codes =", answer: 720, near: [{ v: 1000, fb: "Each choice removes one digit already used: $10, 9, 8$." }], hint: "$90 \\cdot 8$.", m: "10 \\times 9 \\times 8 = 720", say: "Once a digit is used, one fewer is left." }],
        why: "Choices, rule, compute." },
      { type: "num", kicker: "On your own", prompt: "A café offers 5 soups **or** 3 salads. You choose one item. How many choices do you have?", pre: "choices =", answer: 8, skill: "Counting principles", near: [{ v: 15, fb: "You pick **one** item, either a soup or a salad: add $5 + 3$." }], hints: ["Either-or: add."], why: "$5 + 3 = 8$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Both rules together.** You choose either a hot drink (5 kinds) or a cold drink (4 kinds), **and** one snack (6 kinds). How many combinations?",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "(5\\text{ or }4)\\text{ and }6", say: "A drink (hot **or** cold), then a snack." },
          { step: 2, m: "5 + 4 = 9", say: "Either-or: add the drinks.", ask: { prompt: "Why add the 5 and the 4?", answer: 0, options: [{ t: "You pick one drink: hot **or** cold" }, { t: "Because they are both drinks", fb: "It is the either-or choice that adds." }] } },
          { step: 3, m: "9 \\times 6 = 54", say: "Then each drink goes with every snack: multiply." }] },
        gate: true, then: "$54$." },
      { type: "num", kicker: "Try it", prompt: "A password is one letter (26 options) followed by two digits (10 options each). How many passwords are possible?", pre: "passwords =", answer: 2600, skill: "Counting principles", near: [{ v: 46, fb: "Multiply, do not add: $26 \\cdot 10 \\cdot 10$." }, { v: 260, fb: "There are **two** digits: $26 \\cdot 10 \\cdot 10$." }], hints: ["$26 \\cdot 10 \\cdot 10$."], why: "$2600$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam chooses a shirt (4 kinds) **and** a hat (3 kinds) and says there are $4 + 3 = 7$ outfits. What is wrong?",
        options: [{ t: "Both are chosen, so multiply: $4 \\times 3 = 12$" }, { t: "Nothing: add the options", fb: "Adding is for either-or. Here every shirt can go with every hat." }, { t: "It should be $4^3$", fb: "That would be three choices from 4 options each." }],
        answer: 0, skill: "Counting principles", hints: ["Is it either-or, or both?"], why: "$12$." },
      { type: "num", kicker: "Use it", prompt: "A restaurant has 6 starters, 8 mains and 5 desserts. How many different three-course meals (one of each) are there?", pre: "meals =", answer: 240, skill: "Counting principles", near: [{ v: 19, fb: "Multiply, do not add: $6 \\cdot 8 \\cdot 5$." }], hints: ["$6 \\cdot 8 = 48$."], why: "$48 \\cdot 5 = 240$." }
    ]
  });

  /* ============================================ 12 · Permutations */
  var HOW_12 = [["Order?", "Does the **order** matter? If yes, count permutations."],
                ["Slots", "Fill the places one at a time: $n$ options, then $n - 1$, and so on."],
                ["Formula", "$P(n, r) = \\dfrac{n!}{(n - r)!}$."]];
  LESSONS.push({
    title: "Permutations", art: "pcseq",
    blurb: "Book 11.5 · Arrangements where order matters: $P(n, r) = \\frac{n!}{(n-r)!}$, and repeats are divided out.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $6 \\cdot 5 \\cdot 4$.", pre: "value =", answer: 120, skill: "Multiplication", near: [{ v: 15, fb: "Multiply, do not add: $30 \\cdot 4$." }, { v: 30, fb: "Include the last factor: $30 \\cdot 4$." }], hints: ["$30 \\cdot 4$."], why: "$120$." },
      { type: "learn", kicker: "Explore",
        prompt: "You fill $r$ places in order from $n$ different things. The boxes show the number of options for each place. Slide $n$ and $r$. Find the way to get **60** arrangements.",
        scene: { type: "sketch", x: [0, 6.5], y: [0, 3], u: 50, w: 372, grid: false, gate: true, pts: {},
          params: { n: { min: 3, max: 7, step: 1, v: 5, label: "$n$ things" }, r: { min: 1, max: 5, step: 1, v: 2, label: "$r$ places" } },
          draw: function (s) { var it = [], i; if (s.p.r > s.p.n) return it; for (i = 1; i <= s.p.r; i++) it.push(BOX(i, 1.5, "blue"), { word: String(s.p.n - i + 1), at: [i, 1.5], c: "ink", eq: true }); return it; },
          readout: function (s) { var n = s.p.n, r = s.p.r; if (r > n) return "$r$ cannot be bigger than $n$: you cannot fill more places than you have things"; var f = [], i; for (i = 0; i < r; i++) f.push(n - i); var P = PERM(n, r); return "$" + f.join(" \\times ") + " = " + P + "$" + (P === 60 ? " ✓" : ""); },
          goal: function (s) { return s.p.r <= s.p.n && PERM(s.p.n, s.p.r) === 60; } },
        gate: true, then: "$n = 5$ things in $r = 3$ places: $5 \\times 4 \\times 3 = 60$. The first place has $n$ options, the next one fewer (that thing is used), and so on: $n(n - 1)\\cdots(n - r + 1) = \\dfrac{n!}{(n - r)!}$. These ordered arrangements are **permutations**." },
      { type: "learn", kicker: "The idea",
        prompt: "When **order matters**, the number of ways to arrange $r$ of $n$ different things is $P(n, r) = \\dfrac{n!}{(n - r)!}$. Arranging **all** $n$ gives $n!$. If some items are **identical** (repeated $a$, $b$, … times), divide: $\\dfrac{n!}{a!\\,b!\\cdots}$.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Five runners are in a race. How many ways can first, second and third place be filled?",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "1^{\\text{st}},\\ 2^{\\text{nd}},\\ 3^{\\text{rd}}", say: "Gold, silver and bronze are different, so **order matters**." },
          { step: 2, m: "5 \\times 4 \\times 3", say: "Five runners could win; then four are left for second; then three for third.", ask: { prompt: "Why $4$ for second place?", answer: 0, options: [{ t: "The winner cannot also come second" }, { t: "Because there are 4 medals", fb: "There are 3 medals; it is the winner being used up that leaves 4." }] } },
          { step: 3, m: "= 60", say: "Multiply." },
          { step: 3, m: "\\frac{5!}{(5 - 3)!} = \\frac{120}{2} = 60", say: "The formula $P(5, 3)$ agrees." }] },
        gate: true, then: "$60$ ways." },
      { type: "guided", kicker: "Together",
        prompt: "Now you arrange 3 of 6 different books on a shelf.",
        how: HOW_12, skill: "Permutations",
        steps: [
          { step: 1, ask: "Does the order on the shelf matter?", type: "choice", answer: 0, options: [{ t: "Yes: a different order is a different arrangement" }, { t: "No", fb: "Books in a different order look different, so it matters." }], m: "P(6, 3)", say: "Permutations." },
          { step: 2, ask: "Fill three places: $6 \\cdot 5 \\cdot 4 =$", type: "num", pre: "ways =", answer: 120, near: [{ v: 18, fb: "Multiply: $6 \\cdot 5 \\cdot 4$." }], hint: "$30 \\cdot 4$.", m: "6 \\times 5 \\times 4", say: "Six, then five, then four options." },
          { step: 3, ask: "The formula: $\\dfrac{6!}{(6 - 3)!} = \\dfrac{720}{6} =$", type: "num", pre: "ways =", answer: 120, near: [{ v: 720, fb: "Divide by $3! = 6$: $\\frac{720}{6}$." }], hint: "$720 \\div 6$.", m: "\\frac{6!}{3!} = 120", say: "The same answer." }],
        why: "Order, slots, formula." },
      { type: "num", kicker: "On your own", prompt: "Find $P(7, 2)$.", pre: "$P(7, 2) =$", answer: 42, skill: "Permutations", near: [{ v: 21, fb: "That is $C(7, 2)$, where order does not matter. For permutations: $7 \\cdot 6$." }, { v: 14, fb: "Multiply: $7 \\cdot 6$." }], hints: ["$7 \\cdot 6$."], why: "$42$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Repeated letters.** How many different arrangements are there of the letters of LEVEL?",
        scene: { type: "walk", how: [["Count", "How many letters, and how many of each?"], ["Divide", "Divide $n!$ by $a!$ for each repeated letter."], ["Compute", "Cancel and multiply."]], rows: [
          { step: 1, m: "L, E, V, E, L", say: "Five letters: L twice, E twice, V once." },
          { step: 2, m: "\\frac{5!}{2!\\,2!}", say: "If all five were different there would be $5!$; swapping the two Ls (or the two Es) changes nothing, so divide.", ask: { prompt: "Why divide by $2!$ twice?", answer: 0, options: [{ t: "The two Ls can swap in $2!$ ways and the two Es in $2!$ ways, with no visible change" }, { t: "Because there are two vowels", fb: "It is the repeated letters L and E: each repeated pair is counted twice too often." }] } },
          { step: 3, m: "\\frac{120}{2 \\cdot 2} = 30", say: "Divide." }] },
        gate: true, then: "$30$ arrangements." },
      { type: "num", kicker: "Try it", prompt: "How many different arrangements are there of the letters of BOOK?", pre: "arrangements =", answer: 12, skill: "Permutations", near: [{ v: 24, fb: "Divide by $2!$ for the repeated O: $\\frac{4!}{2!}$." }, { v: 6, fb: "That is $\\frac{4!}{2! \\cdot 2!}$. Only the O is repeated." }], hints: ["$\\frac{4!}{2!}$."], why: "$\\frac{24}{2} = 12$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says the number of ways five runners can fill first, second and third place is $C(5, 3) = 10$. What is wrong?",
        options: [{ t: "Order matters (gold, silver, bronze differ), so it is $P(5, 3) = 60$" }, { t: "Nothing: choosing 3 of 5 is 10", fb: "$C(5, 3)$ ignores which place each runner takes." }, { t: "It should be $5^3 = 125$", fb: "A runner cannot take two places, so the options shrink: $5 \\cdot 4 \\cdot 3$." }],
        answer: 0, skill: "Permutations", hints: ["Does swapping two runners change the result?"], why: "$P(5, 3) = 60$." },
      { type: "num", kicker: "Use it", prompt: "A club of 8 people elects a president, a secretary and a treasurer (three different people). In how many ways can this be done?", pre: "ways =", answer: 336, skill: "Permutations", near: [{ v: 56, fb: "That ignores the order of the roles. The jobs are different: $8 \\cdot 7 \\cdot 6$." }, { v: 512, fb: "A person cannot hold two jobs: $8 \\cdot 7 \\cdot 6$." }], hints: ["$8 \\cdot 7 \\cdot 6$."], why: "$336$." }
    ]
  });

  /* ============================================ 13 · Combinations and subsets */
  var HOW_13 = [["Order?", "If the **order does not matter**, count combinations."],
                ["Formula", "$C(n, r) = \\dfrac{n!}{r!\\,(n - r)!}$."],
                ["Compute", "Cancel first, then multiply."]];
  LESSONS.push({
    title: "Combinations and subsets", art: "pcseq",
    blurb: "Book 11.5 · Choosing groups where order does not matter: $C(n, r) = \\frac{P(n, r)}{r!}$.",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $\\dfrac{60}{3!}$.", pre: "value =", answer: 10, skill: "Factorials", near: [{ v: 20, fb: "$3! = 6$, not 3." }, { v: 360, fb: "Divide by $3! = 6$." }], hints: ["$3! = 6$."], why: "$\\frac{60}{6} = 10$." },
      { type: "learn", kicker: "Explore",
        prompt: "You pick a **group** of $r$ from $n$ people; the order of the group does not matter. The readout shows the ordered count $P(n, r)$ and the group count $C(n, r) = \\frac{P(n, r)}{r!}$. Find **two different** $(n, r)$ with exactly **10 groups**.",
        scene: { type: "sketch", x: [0, 8], y: [0, 3], u: 40, w: 368, grid: false, gate: true, pts: {},
          params: { n: { min: 4, max: 7, step: 1, v: 6, label: "$n$ people" }, r: { min: 1, max: 6, step: 1, v: 2, label: "$r$ chosen" } },
          track: function (s) { return s.p.r <= s.p.n && CHOOSE(s.p.n, s.p.r) === 10 ? "c" + s.p.n + s.p.r : null; },
          draw: function (s) { var it = [], i; for (i = 1; i <= s.p.n; i++) it.push(dot(i, 1.5, i <= s.p.r ? "green" : "soft")); return it; },
          readout: function (s) { var n = s.p.n, r = s.p.r; if (r > n) return "$r$ cannot be bigger than $n$"; var C = CHOOSE(n, r); return "$P(" + n + ", " + r + ") = " + PERM(n, r) + "$ ordered · $C(" + n + ", " + r + ") = \\frac{" + PERM(n, r) + "}{" + FACT(r) + "} = " + C + "$ groups" + (C === 10 ? " ✓" : "") + "<br>Groups of 10 found: " + Math.min(2, Object.keys(s.tracked).length) + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "$C(5, 2) = 10$ and $C(5, 3) = 10$. A group of $r$ can be put in order in $r!$ ways, and all those orders count as the **same group**, so $C(n, r) = \\frac{P(n, r)}{r!} = \\frac{n!}{r!(n - r)!}$. Picking 2 to go is the same as picking the 3 to stay, which is why $C(5, 2) = C(5, 3)$." },
      { type: "learn", kicker: "The idea",
        prompt: "When **order does not matter**, the number of ways to choose $r$ of $n$ different things is a **combination**: $C(n, r) = \\dfrac{n!}{r!\\,(n - r)!}$. A set of $n$ elements has $2^n$ **subsets** in all (each element is in or out).",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "A club of 6 people chooses a committee of 3. How many committees are possible?",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "\\text{committee of 3}", say: "A committee has no first or second place: **order does not matter**." },
          { step: 2, m: "C(6, 3) = \\frac{6!}{3!\\,3!}", say: "Substitute into $C(n, r) = \\frac{n!}{r!(n - r)!}$.", ask: { prompt: "Why divide by $3!$ as well as $(6 - 3)!$?", answer: 0, options: [{ t: "Each committee of 3 was counted in $3!$ different orders" }, { t: "To make the number smaller", fb: "Dividing by $r!$ removes the orderings that the committee does not care about." }] } },
          { step: 3, m: "\\frac{6 \\cdot 5 \\cdot 4}{3 \\cdot 2 \\cdot 1}", say: "Cancel $3!$ top and bottom: $6! = 6 \\cdot 5 \\cdot 4 \\cdot 3!$." },
          { step: 3, m: "\\frac{120}{6} = 20", say: "Multiply, then divide." }] },
        gate: true, then: "$20$ committees." },
      { type: "guided", kicker: "Together",
        prompt: "Now you choose 2 of 5 friends to come to dinner.",
        how: HOW_13, skill: "Combinations",
        steps: [
          { step: 1, ask: "Does the order of the two chosen friends matter?", type: "choice", answer: 0, options: [{ t: "No: Ana and Ben is the same pair as Ben and Ana" }, { t: "Yes", fb: "A pair is just a pair: no first or second." }], m: "C(5, 2)", say: "Combinations." },
          { step: 2, ask: "Count them in order first: $P(5, 2) = 5 \\cdot 4 =$", type: "num", pre: "ordered =", answer: 20, near: [{ v: 10, fb: "That is the answer after dividing. First the ordered count: $5 \\cdot 4$." }], hint: "$5 \\cdot 4$.", m: "P(5, 2) = 20", say: "Each pair appears twice." },
          { step: 3, ask: "Divide by $2! = 2$: $\\dfrac{20}{2} =$", type: "num", pre: "$C(5, 2) =$", answer: 10, near: [{ v: 20, fb: "Each pair was counted twice (in both orders): divide by 2." }], hint: "$20 \\div 2$.", m: "C(5, 2) = 10", say: "Ten possible pairs." }],
        why: "Order, formula, compute." },
      { type: "num", kicker: "On your own", prompt: "Find $C(8, 3)$.", pre: "$C(8, 3) =$", answer: 56, skill: "Combinations", near: [{ v: 336, fb: "That is $P(8, 3)$. Divide by $3! = 6$." }, { v: 24, fb: "$C(8, 3) = \\frac{8 \\cdot 7 \\cdot 6}{3 \\cdot 2 \\cdot 1}$." }], hints: ["$\\frac{8 \\cdot 7 \\cdot 6}{6}$."], why: "$56$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Subsets.** How many subsets does $\\{a, b, c, d, e\\}$ have, and how many of them have exactly 2 elements?",
        scene: { type: "walk", how: [["Each element", "Each element is either in the subset or out."], ["Multiply", "Two choices for each of the $n$ elements."], ["Group", "Subsets of size $r$: $C(n, r)$."]], rows: [
          { step: 1, m: "\\text{in or out}", say: "For each of the 5 elements there are 2 choices." },
          { step: 2, m: "2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 2^5 = 32", say: "Multiplication Principle: **32 subsets** (including the empty set and the whole set).", ask: { prompt: "Is the empty set counted?", answer: 0, options: [{ t: "Yes: all 5 elements \"out\" is one of the 32" }, { t: "No", fb: "Choosing \"out\" for every element gives the empty set, one of the 32." }] } },
          { step: 3, m: "C(5, 2) = 10", say: "Exactly two elements in: choose which two." },
          { step: 3, m: "1 + 5 + 10 + 10 + 5 + 1 = 32", say: "Sizes 0 to 5 add up to $2^5$." }] },
        gate: true, then: "$32$ subsets in all, and $10$ with exactly 2 elements." },
      { type: "num", kicker: "Try it", prompt: "A pizza shop has 7 toppings. How many different pizzas can have exactly 4 different toppings?", pre: "pizzas =", answer: 35, skill: "Combinations", near: [{ v: 840, fb: "That is $P(7, 4)$. The order of toppings does not matter: divide by $4! = 24$." }, { v: 128, fb: "That is all subsets, $2^7$. We want exactly 4 toppings." }], hints: ["$C(7, 4) = \\frac{7 \\cdot 6 \\cdot 5 \\cdot 4}{4!}$."], why: "$\\frac{840}{24} = 35$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says choosing 2 of 5 students for a committee can be done in $5 \\cdot 4 = 20$ ways. What is wrong?",
        options: [{ t: "A committee has no order, so each pair was counted twice: $\\frac{20}{2} = 10$" }, { t: "Nothing: 5 choices then 4", fb: "That counts ordered pairs. Ana-then-Ben and Ben-then-Ana are the same committee." }, { t: "It should be $2^5 = 32$", fb: "That counts every subset of any size." }],
        answer: 0, skill: "Combinations", hints: ["Is a committee of Ana and Ben different from one of Ben and Ana?"], why: "$C(5, 2) = 10$." },
      { type: "num", kicker: "Use it", prompt: "A lottery asks you to choose 4 different numbers from 10, in any order. How many different tickets are possible?", pre: "tickets =", answer: 210, skill: "Combinations", near: [{ v: 5040, fb: "That is $P(10, 4)$. Divide by $4! = 24$ since the order does not matter." }, { v: 40, fb: "That adds. $C(10, 4) = \\frac{10 \\cdot 9 \\cdot 8 \\cdot 7}{4 \\cdot 3 \\cdot 2 \\cdot 1}$." }], hints: ["$\\frac{5040}{24}$."], why: "$210$." }
    ]
  });
  /* ============================================ 14 · The Binomial Theorem */
  var HOW_14 = [["Coefficients", "Row $n$ of Pascal's triangle, or $C(n, k)$ for each $k$."],
                ["Powers", "The power of the first term falls from $n$ to 0; the second rises from 0 to $n$."],
                ["Write", "Multiply each coefficient by its two powers and add the terms."]];
  LESSONS.push({
    title: "The Binomial Theorem", art: "pcseq",
    blurb: "Book 11.6 · $(x + y)^n = \\sum C(n, k)\\,x^{n-k}y^k$: Pascal's triangle gives the coefficients.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Expand $(x + 1)^2 = x^2 + \\square\\,x + 1$. What number goes in the box?", pre: "$\\square =$", answer: 2, skill: "Squaring a binomial", near: [{ v: 1, fb: "$(x + 1)(x + 1)$ has two middle terms, $x + x$." }], hints: ["$(x + 1)(x + 1) = x^2 + x + x + 1$."], why: "$2x$." },
      { type: "learn", kicker: "Explore",
        prompt: "Pascal's triangle: each number is the sum of the two above it. Slide the row number $n$; the orange row gives the coefficients of $(x + y)^n$. Find the row whose numbers **add up to 64**.",
        scene: { type: "sketch", x: [-5, 5], y: [0, 9.5], u: 34, uy: 28, w: 388, grid: false, gate: true, pts: {},
          params: { n: { min: 0, max: 8, step: 1, v: 3, label: "row $n$" } },
          draw: function (s) { var it = [], r, j; for (r = 0; r <= s.p.n; r++) for (j = 0; j <= r; j++) it.push({ word: String(CHOOSE(r, j)), at: [j - r / 2, 9 - r], c: r === s.p.n ? "orange" : "ink", eq: true }); return it; },
          readout: function (s) { var n = s.p.n, row = [], j; for (j = 0; j <= n; j++) row.push(CHOOSE(n, j)); return "row " + n + ": $" + row.join(",\\ ") + "$ · sum $= " + Math.pow(2, n) + "$" + (Math.pow(2, n) === 64 ? " ✓" : ""); },
          goal: function (s) { return s.p.n === 6; } },
        gate: true, then: "Row 6 is $1, 6, 15, 20, 15, 6, 1$, which adds to $64 = 2^6$. Each row sums to $2^n$. Row $n$ lists $C(n, 0), C(n, 1), \\dots, C(n, n)$, and these are the coefficients in $(x + y)^n$: for example $(x + y)^2 = 1x^2 + 2xy + 1y^2$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Binomial Theorem:** $(x + y)^n = \\sum_{k=0}^{n} C(n, k)\\,x^{n-k}y^k$. The coefficients $C(n, k)$ are row $n$ of Pascal's triangle. The powers of $x$ **fall** from $n$ to 0 and the powers of $y$ **rise** from 0 to $n$. The $(k + 1)$th term is $C(n, k)\\,x^{n-k}y^k$.",
        scene: { type: "method", how: HOW_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "Expand $(x + 2)^4$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "1,\\ 4,\\ 6,\\ 4,\\ 1", say: "Row 4 of Pascal's triangle gives the coefficients." },
          { step: 2, m: "x^4,\\ x^3 y,\\ x^2 y^2,\\ x y^3,\\ y^4", say: "Powers of $x$ fall, powers of $y$ rise. Here $y = 2$." },
          { step: 3, m: "x^4 + 4x^3(2) + 6x^2(4)", say: "$2^1 = 2$ and $2^2 = 4$.", ask: { prompt: "What is the coefficient of the $x^2$ term?", answer: 0, options: [{ t: "$6 \\cdot 4 = 24$" }, { t: "$6$", fb: "Multiply the Pascal coefficient 6 by $2^2 = 4$." }] } },
          { step: 3, m: "+ 4x(8) + 16", say: "$2^3 = 8$ and $2^4 = 16$." },
          { step: 3, m: "x^4 + 8x^3 + 24x^2 + 32x + 16", say: "Tidy up." }] },
        gate: true, then: "$x^4 + 8x^3 + 24x^2 + 32x + 16$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you expand $(2x - 1)^3$.",
        how: HOW_14, skill: "Binomial Theorem",
        steps: [
          { step: 1, ask: "Row 3 of Pascal's triangle is…", type: "choice", answer: 0, options: [{ t: "$1, 3, 3, 1$" }, { t: "$1, 2, 1$", fb: "That is row 2. Row 3 has four numbers." }], m: "1,\\ 3,\\ 3,\\ 1", say: "Take $a = 2x$ and $b = -1$." },
          { step: 2, ask: "The $x^2$ term is $3(2x)^2(-1) = 3 \\cdot 4x^2 \\cdot (-1)$. Its coefficient is", type: "num", pre: "coefficient =", answer: -12, near: [{ v: 12, fb: "The $-1$ makes it negative." }, { v: -6, fb: "$(2x)^2 = 4x^2$: square the 2 as well." }], hint: "$3 \\cdot 4 \\cdot (-1)$.", m: "-12x^2", say: "Square the whole $2x$." },
          { step: 2, ask: "The $x$ term is $3(2x)(-1)^2$. Its coefficient is", type: "num", pre: "coefficient =", answer: 6, near: [{ v: -6, fb: "$(-1)^2 = +1$." }], hint: "$3 \\cdot 2 \\cdot 1$.", m: "+6x", say: "An even power of $-1$ is positive." },
          { step: 3, ask: "The last term is $(-1)^3 =$", type: "num", pre: "constant =", answer: -1, near: [{ v: 1, fb: "An odd power of $-1$ is negative." }], hint: "$-1 \\cdot -1 \\cdot -1$.", m: "8x^3 - 12x^2 + 6x - 1", say: "The first term is $(2x)^3 = 8x^3$." }],
        why: "Coefficients, powers, write." },
      { type: "num", kicker: "On your own", prompt: "Find the coefficient of $x^2$ in the expansion of $(x + 3)^4$.", pre: "coefficient =", answer: 54, skill: "Binomial Theorem", near: [{ v: 6, fb: "That is the Pascal coefficient. Multiply by $3^2 = 9$." }, { v: 18, fb: "The $y$ power is $4 - 2 = 2$: $3^2 = 9$, then times 6." }], hints: ["The term is $C(4, 2)\\,x^2\\,3^2$."], why: "$6 \\cdot 9 = 54$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**One term only.** Find the 4th term of $(x + 2)^6$ without expanding the rest.",
        scene: { type: "walk", how: [["Which k", "The $(k + 1)$th term has $k$ on the second part."], ["Build it", "$C(n, k)\\,x^{n-k}\\,y^k$."], ["Simplify", "Evaluate the coefficient and the power."]], rows: [
          { step: 1, m: "(k + 1) = 4 \\ \\Rightarrow \\ k = 3", say: "The first term has $k = 0$, so the 4th has $k = 3$.", ask: { prompt: "Why $k = 3$ and not 4?", answer: 0, options: [{ t: "Counting starts at $k = 0$ for the first term" }, { t: "Because 4 is even", fb: "The term number is $k + 1$, since the first term has $k = 0$." }] } },
          { step: 2, m: "C(6, 3)\\,x^{3}\\,2^3", say: "$n - k = 3$ for the power of $x$." },
          { step: 3, m: "20 \\cdot 8\\,x^3 = 160x^3", say: "$C(6, 3) = 20$ and $2^3 = 8$." }] },
        gate: true, then: "$160x^3$." },
      { type: "num", kicker: "Try it", prompt: "Find the coefficient of $x^2$ in the expansion of $(x - 1)^5$.", pre: "coefficient =", answer: -10, skill: "Binomial Theorem", near: [{ v: 10, fb: "The $y = -1$ is raised to the power $5 - 2 = 3$, which is **negative**." }, { v: 5, fb: "The Pascal coefficient is $C(5, 3) = 10$." }], hints: ["The term is $C(5, 3)\\,x^2(-1)^3$."], why: "$10 \\cdot (-1) = -10$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam says $(x + y)^2 = x^2 + y^2$. What is wrong?",
        options: [{ t: "There is a middle term: $(x + y)^2 = x^2 + 2xy + y^2$" }, { t: "Nothing: squaring distributes", fb: "Squaring does not distribute over a sum. Try $x = y = 1$: $(1 + 1)^2 = 4$, not 2." }, { t: "It should be $x^2 + xy + y^2$", fb: "The coefficient of the middle term is $C(2, 1) = 2$." }],
        answer: 0, skill: "Binomial Theorem", hints: ["Try $x = 1$ and $y = 1$."], why: "Row 2 of Pascal's triangle is $1, 2, 1$." },
      { type: "num", kicker: "Use it", prompt: "Put $x = 1$ in $(1 + x)^7$ to find the **sum of all the coefficients** of its expansion.", pre: "sum =", answer: 128, skill: "Binomial Theorem", near: [{ v: 7, fb: "Set $x = 1$: $(1 + 1)^7$." }, { v: 64, fb: "$2^7 = 128$: that is row 7 of Pascal's triangle added up." }], hints: ["$(1 + 1)^7$."], why: "$2^7 = 128$." }
    ]
  });

  /* ============================================ 15 · Probability of equally likely outcomes */
  var HOW_15 = [["Outcomes", "List (or count) **all** the equally likely outcomes."],
                ["Favourable", "Count the outcomes that belong to the event."],
                ["Divide", "$P(E) = \\dfrac{\\text{favourable}}{\\text{total}}$."]];
  var DIEEV = [["Sum is 7", function (a, b) { return a + b === 7; }], ["Sum is at least 10", function (a, b) { return a + b >= 10; }], ["Doubles", function (a, b) { return a === b; }], ["Sum is 12", function (a, b) { return a + b === 12; }], ["Sum is even", function (a, b) { return (a + b) % 2 === 0; }]];
  LESSONS.push({
    title: "Probability of equally likely outcomes", art: "pcseq",
    blurb: "Book 11.7 · $P(E) = \\frac{\\text{favourable}}{\\text{total}}$: a number from 0 (impossible) to 1 (certain).",
    mins: 14, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $\\dfrac{12}{36}$ as a decimal to 3 places.", pre: "value =", answer: 0.333, tol: 0.001, skill: "Fractions to decimals", near: [{ v: 3, tol: 0.001, fb: "Divide the smaller number by the larger: $12 \\div 36$." }], hints: ["$\\frac{12}{36} = \\frac{1}{3}$."], why: "$0.333$." },
      { type: "learn", kicker: "Explore",
        prompt: "Two dice are rolled. Each dot is one of the $6 \\times 6 = 36$ equally likely outcomes (first die across, second up). Pick an event: the **green** dots are its favourable outcomes. Find **two different events** with probability $\\frac{1}{6}$.",
        scene: { type: "sketch", x: [0, 7], y: [0, 7], u: 40, w: 328, grid: false, gate: true, pts: {},
          chips: { e: { label: "Event", v: "3", opts: DIEEV.map(function (q, i) { return ["" + i, q[0]]; }) } },
          track: function (s) { var q = DIEEV[+s.c.e], c = 0, a, b; for (a = 1; a <= 6; a++) for (b = 1; b <= 6; b++) if (q[1](a, b)) c++; return c === 6 ? "e" + s.c.e : null; },
          draw: function (s) { var q = DIEEV[+s.c.e], it = [], a, b; for (a = 1; a <= 6; a++) for (b = 1; b <= 6; b++) it.push(dot(a, b, q[1](a, b) ? "green" : "soft")); return it; },
          readout: function (s) { var q = DIEEV[+s.c.e], c = 0, a, b; for (a = 1; a <= 6; a++) for (b = 1; b <= 6; b++) if (q[1](a, b)) c++; return "$P = \\frac{" + c + "}{36}$" + (c === 6 ? " $= \\frac{1}{6}$ ✓" : "") + "<br>Events with $\\frac{1}{6}$ found: " + Math.min(2, Object.keys(s.tracked).length) + " of 2"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 2; } },
        gate: true, then: "\"Sum is 7\", \"sum at least 10\" and \"doubles\" each have 6 favourable outcomes, so each has probability $\\frac{6}{36} = \\frac{1}{6}$. When all outcomes are **equally likely**, $P(E) = \\frac{\\text{number of favourable outcomes}}{\\text{total number of outcomes}}$." },
      { type: "learn", kicker: "The idea",
        prompt: "When all outcomes are **equally likely**, $P(E) = \\dfrac{\\text{favourable outcomes}}{\\text{total outcomes}}$. A probability is always between 0 (impossible) and 1 (certain), and the probabilities of all the outcomes add to 1. Count the **total** first, then the **favourable** ones.",
        scene: { type: "method", how: HOW_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "Two dice are rolled. What is the probability that the sum is 8?",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "6 \\times 6 = 36", say: "Each die has 6 faces: 36 equally likely outcomes." },
          { step: 2, m: "(2,6),\\ (3,5),\\ (4,4)", say: "The pairs that add to 8: list them." },
          { step: 2, m: "(5,3),\\ (6,2)", say: "Five pairs in all.", ask: { prompt: "Is $(3, 5)$ different from $(5, 3)$?", answer: 0, options: [{ t: "Yes: they are different outcomes (first die, second die)" }, { t: "No", fb: "With two dice, a 3 on the first and 5 on the second is a different outcome from 5 then 3." }] } },
          { step: 3, m: "P = \\frac{5}{36}", say: "Favourable over total." },
          { step: 3, m: "\\approx 0.139", say: "About 14%." }] },
        gate: true, then: "$\\frac{5}{36} \\approx 0.139$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you work with a bag of 3 red, 5 blue and 2 green marbles. One is drawn at random.",
        how: HOW_15, skill: "Probability",
        steps: [
          { step: 1, ask: "How many outcomes are there in total?", type: "num", pre: "total =", answer: 10, near: [{ v: 3, fb: "Count **all** the marbles: $3 + 5 + 2$." }], hint: "$3 + 5 + 2$.", m: "3 + 5 + 2 = 10", say: "Each marble is equally likely." },
          { step: 2, ask: "How many marbles are blue?", type: "num", pre: "favourable =", answer: 5, near: [{ v: 10, fb: "That is every marble. The event is blue only." }], hint: "Read the question.", m: "5", say: "The favourable outcomes." },
          { step: 3, ask: "$P(\\text{blue}) = \\dfrac{5}{10} =$", type: "num", pre: "$P =$", answer: 0.5, tol: 0.001, calc: true, near: [{ v: 2, tol: 0.001, fb: "Favourable over total: $5 \\div 10$." }], hint: "$5 \\div 10$.", m: "P = \\tfrac{1}{2}", say: "Half the marbles are blue." }],
        why: "Outcomes, favourable, divide." },
      { type: "num", kicker: "On your own", prompt: "A card is drawn from a standard deck of 52. What is the probability it is a heart?", pre: "$P =$", answer: 0.25, tol: 0.001, calc: true, skill: "Probability", near: [{ v: 13, tol: 0.001, fb: "That is the **number** of hearts. Divide by 52." }, { v: 0.0192, tol: 0.001, fb: "There are 13 hearts: $\\frac{13}{52}$." }], hints: ["13 hearts in 52 cards."], why: "$\\frac{13}{52} = 0.25$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Counting the pairs.** Two dice are rolled. What is the probability that the sum is **at least 10**?",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "36\\text{ outcomes}", say: "Two dice again." },
          { step: 2, m: "\\text{sum }10:\\ (4,6),(5,5),(6,4)", say: "Count each sum separately: three pairs make 10." },
          { step: 2, m: "\\text{sum }11:\\ (5,6),(6,5)", say: "Two pairs make 11.", ask: { prompt: "How many pairs make 12?", answer: 0, options: [{ t: "One: $(6, 6)$" }, { t: "Two", fb: "Only 6 and 6 make 12." }] } },
          { step: 3, m: "3 + 2 + 1 = 6", say: "Add the favourable outcomes: 6 pairs." },
          { step: 3, m: "P = \\frac{6}{36} = \\frac{1}{6}", say: "Favourable over total." }] },
        gate: true, then: "$\\frac{1}{6} \\approx 0.167$." },
      { type: "num", kicker: "Try it", prompt: "A fair coin is flipped three times. What is the probability of getting **exactly two heads**? (A decimal is fine.)", pre: "$P =$", answer: 0.375, tol: 0.001, calc: true, skill: "Probability", near: [{ v: 0.5, tol: 0.001, fb: "List all 8 outcomes: HHH, HHT, HTH, HTT, THH, THT, TTH, TTT." }, { v: 0.25, tol: 0.001, fb: "Three of the 8 outcomes have exactly two heads: HHT, HTH, THH." }], hints: ["There are $2^3 = 8$ outcomes."], why: "$\\frac{3}{8} = 0.375$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says the probability that two dice add to 7 is $\\dfrac{1}{11}$, because the sums $2, 3, \\dots, 12$ are 11 possibilities. What is wrong?",
        options: [{ t: "The 11 sums are **not equally likely**: count the 36 pairs; 6 of them add to 7, so $P = \\frac{6}{36}$" }, { t: "Nothing: 7 is one of 11 sums", fb: "A sum of 7 can happen in 6 ways but a sum of 2 in only 1 way, so the sums are not equally likely." }, { t: "It should be $\\frac{1}{12}$", fb: "Count the pairs: $(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)$." }],
        answer: 0, skill: "Probability", hints: ["How many ways make a sum of 2? Of 7?"], why: "$\\frac{6}{36} = \\frac{1}{6}$." },
      { type: "num", kicker: "Use it", prompt: "A spinner has 8 equal sections numbered 1 to 8. What is the probability that it lands on a **prime** number? (Primes: 2, 3, 5, 7.)", pre: "$P =$", answer: 0.5, tol: 0.001, calc: true, skill: "Probability", near: [{ v: 4, tol: 0.001, fb: "That is the **number** of primes. Divide by 8." }, { v: 0.625, tol: 0.001, fb: "1 is not prime: the primes are 2, 3, 5, 7." }], hints: ["4 primes out of 8."], why: "$\\frac{4}{8} = 0.5$." }
    ]
  });

  /* ============================================ 16 · Union, complement and counting */
  var HOW_16 = [["Name", "Name the events. \"Or\" is a union, \"not\" is a complement."],
                ["Rule", "$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ and $P(\\text{not } A) = 1 - P(A)$."],
                ["Compute", "Substitute and simplify."]];
  LESSONS.push({
    title: "Union, complement and counting", art: "pcseq",
    blurb: "Book 11.7 · \"A or B\" without counting the overlap twice, \"not A\" as $1 - P(A)$, and probabilities from counting.",
    mins: 15, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Work out $1 - 0.35$.", pre: "value =", answer: 0.65, tol: 0.001, skill: "Decimals", near: [{ v: 1.35, tol: 0.001, fb: "Subtract: $1 - 0.35$." }, { v: 0.35, tol: 0.001, fb: "That is the number you subtract from 1." }], hints: ["$1.00 - 0.35$."], why: "$0.65$." },
      { type: "learn", kicker: "Explore",
        prompt: "Of 20 students, 12 take art and 9 take music; some take **both**. Slide the number taking both. Green = both, blue = art only, orange = music only, grey = **neither**. Find the overlap leaving **3** with neither, and the one leaving **none**.",
        scene: { type: "sketch", x: [0, 11], y: [0, 3], u: 30, w: 378, grid: false, gate: true, pts: {},
          params: { o: { min: 1, max: 9, step: 1, v: 5, label: "both" } },
          track: function (s) { var nei = 20 - (21 - s.p.o); return nei === 3 ? "n3" : nei === 0 ? "n0" : null; },
          draw: function (s) { var o = s.p.o, it = [], i, c; for (i = 0; i < 20; i++) { c = i < o ? "green" : i < 12 ? "blue" : i < 12 + (9 - o) ? "orange" : "soft"; it.push(dot(i % 10 + 1, i < 10 ? 2 : 1, c)); } return it; },
          readout: function (s) { var o = s.p.o, u = 21 - o, nei = 20 - u; return "art $12$ + music $9$ − both $" + o + "$ = $" + u + "$ take art or music · **" + nei + "** take neither<br>$P(\\text{neither}) = " + nm(f4(nei / 20, 2)) + "$<br>Neither = 3: " + (s.tracked.n3 ? "✓" : "—") + " · neither = 0: " + (s.tracked.n0 ? "✓" : "—"); },
          goal: function (s) { return !!(s.tracked.n3 && s.tracked.n0); } },
        gate: true, then: "With 4 taking both, $12 + 9 - 4 = 17$ take art or music, leaving 3. With only 1 taking both, $12 + 9 - 1 = 20$: everyone takes something. The **union rule** $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ subtracts the overlap, which would be counted twice. The **complement rule** is $P(\\text{not } A) = 1 - P(A)$." },
      { type: "learn", kicker: "The idea",
        prompt: "$P(A \\text{ or } B) = P(A) + P(B) - P(A \\text{ and } B)$: subtract the overlap counted twice. If $A$ and $B$ **cannot** both happen, the overlap is 0. The **complement**: $P(\\text{not } A) = 1 - P(A)$; use it for \"at least one\". With counting: $P = \\frac{\\text{ways for the event}}{\\text{all ways}}$.",
        scene: { type: "method", how: HOW_16 } },
      { type: "learn", kicker: "Watch",
        prompt: "A card is drawn from a standard 52-card deck. What is $P(\\text{heart or king})$?",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "P(H) = \\frac{13}{52},\\ P(K) = \\frac{4}{52}", say: "13 hearts and 4 kings." },
          { step: 1, m: "P(H \\cap K) = \\frac{1}{52}", say: "Only the king of hearts is both.", ask: { prompt: "Why subtract $\\frac{1}{52}$?", answer: 0, options: [{ t: "The king of hearts was counted in both the hearts and the kings" }, { t: "Because there is one king of hearts to remove", fb: "It is a card counted twice: once as a heart and once as a king." }] } },
          { step: 2, m: "\\frac{13}{52} + \\frac{4}{52} - \\frac{1}{52}", say: "The union rule." },
          { step: 3, m: "\\frac{16}{52} = \\frac{4}{13}", say: "There are 16 such cards: 13 hearts and 3 other kings." }] },
        gate: true, then: "$\\frac{4}{13} \\approx 0.308$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you use the complement: a fair coin is flipped 3 times. What is the probability of **at least one head**?",
        how: HOW_16, skill: "Complement rule",
        steps: [
          { step: 1, ask: "\"At least one head\" is the opposite of…", type: "choice", answer: 0, options: [{ t: "no heads at all (TTT)" }, { t: "exactly one head", fb: "The opposite of \"at least one\" is \"none\"." }], m: "\\text{not (no heads)}", say: "Easier to count the opposite." },
          { step: 2, ask: "$P(\\text{TTT}) = \\left(\\dfrac{1}{2}\\right)^3 =$ (a decimal is fine)", type: "num", pre: "$P =$", answer: 0.125, tol: 0.001, calc: true, near: [{ v: 0.375, tol: 0.001, fb: "Only one of the 8 outcomes is TTT: $\\frac{1}{8}$." }], hint: "$\\frac{1}{8}$.", m: "P(\\text{TTT}) = \\tfrac{1}{8}", say: "One of 8 outcomes." },
          { step: 3, ask: "$P(\\text{at least one head}) = 1 - 0.125 =$", type: "num", pre: "$P =$", answer: 0.875, tol: 0.001, calc: true, near: [{ v: 0.125, tol: 0.001, fb: "That is the opposite. Subtract it from 1." }], hint: "$1 - 0.125$.", m: "P = 0.875", say: "Seven of the 8 outcomes." }],
        why: "Name, rule, compute." },
      { type: "num", kicker: "On your own", prompt: "$P(A) = 0.4$, $P(B) = 0.5$ and $P(A \\text{ and } B) = 0.2$. What is $P(A \\text{ or } B)$?", pre: "$P =$", answer: 0.7, tol: 0.001, skill: "Union rule", near: [{ v: 0.9, tol: 0.001, fb: "Subtract the overlap $0.2$ that was counted twice." }, { v: 1.1, tol: 0.001, fb: "$0.4 + 0.5 - 0.2$." }], hints: ["$0.4 + 0.5 - 0.2$."], why: "$0.7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Using counting.** A committee of 3 is chosen at random from 5 men and 4 women. What is the probability it is **all women**?",
        scene: { type: "walk", how: [["Count all", "All ways to choose the committee."], ["Favourable", "The ways that give the event."], ["Divide", "Favourable over total."]], rows: [
          { step: 1, m: "C(9, 3) = 84", say: "Choose 3 of the 9 people: order does not matter." },
          { step: 2, m: "C(4, 3) = 4", say: "All women: choose 3 of the 4 women.", ask: { prompt: "Why $C(4, 3)$ and not $C(9, 3)$?", answer: 0, options: [{ t: "The three must all come from the 4 women" }, { t: "Because there are 4 groups", fb: "The favourable committees pick all three members from the women only." }] } },
          { step: 3, m: "P = \\frac{4}{84} = \\frac{1}{21}", say: "Divide: about 0.048." }] },
        gate: true, then: "$\\frac{1}{21} \\approx 0.048$." },
      { type: "num", kicker: "Try it", prompt: "Two students are chosen at random from 6 (3 girls and 3 boys). What is the probability both are girls? (A decimal is fine.)", pre: "$P =$", answer: 0.2, tol: 0.001, calc: true, skill: "Probability with counting", near: [{ v: 0.25, tol: 0.001, fb: "Count with combinations: $\\frac{C(3, 2)}{C(6, 2)}$." }, { v: 0.5, tol: 0.001, fb: "That is the chance for the first pick. For two girls: $\\frac{C(3, 2)}{C(6, 2)}$." }], hints: ["$C(3, 2) = 3$ and $C(6, 2) = 15$."], why: "$\\frac{3}{15} = 0.2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rin finds $P(\\text{heart or king}) = \\dfrac{13}{52} + \\dfrac{4}{52} = \\dfrac{17}{52}$. What is wrong?",
        options: [{ t: "The king of hearts is counted twice: subtract $\\frac{1}{52}$ to get $\\frac{16}{52}$" }, { t: "Nothing: add the two probabilities", fb: "Only when the events cannot both happen. Here one card is both." }, { t: "It should be $\\frac{13}{52} \\times \\frac{4}{52}$", fb: "\"Or\" uses addition (minus the overlap), not multiplication." }],
        answer: 0, skill: "Union rule", hints: ["Is there a card that is both a heart and a king?"], why: "$\\frac{13 + 4 - 1}{52} = \\frac{16}{52}$." },
      { type: "num", kicker: "Use it", prompt: "A family has 3 children, each equally likely to be a boy or a girl. What is the probability of **at least one girl**? (A decimal is fine.)", pre: "$P =$", answer: 0.875, tol: 0.001, calc: true, skill: "Complement rule", near: [{ v: 0.125, tol: 0.001, fb: "That is the probability of **no** girl (all boys). Subtract from 1." }, { v: 0.5, tol: 0.001, fb: "Use the complement: $1 - P(\\text{all boys})$." }], hints: ["$P(\\text{all boys}) = \\left(\\frac{1}{2}\\right)^3$."], why: "$1 - 0.125 = 0.875$." }
    ]
  });
  /* ================================================================ Skills */
  var RD = function (v) { return Math.round(v * 1e9) / 1e9; };
  var GENX = " (A decimal to 3 places is fine; the box also accepts a fraction.)";
  var LST = function (a) { return a.join(",\\ "); };
  var PQ = function (p, q, v) { return CF1(p) + v + (q === 0 ? "" : (q < 0 ? " - " : " + ") + Math.abs(q)); };
  var CF1 = function (m) { return m === 1 ? "" : m === -1 ? "-" : String(m); };
  var SGN = function (c) { return c < 0 ? "-" : "+"; };
  // distinct options only, in the order given
  var UNIQ = function (a) { var seen = {}, out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; };
  var SKILLS = [
    { id: "pc11-explicit", title: "Explicit formulas", lesson: 2,
      gen: function (R) {
        var t = R.int(0, 4), fam = R.pick(["lin", "quad", "geo"]);
        if (t === 4) {
          var p, q, tex, f, bad = [];
          if (fam === "lin") { p = R.int(2, 7); q = R.int(-5, 9); tex = PQ(p, q, "n"); f = function (n) { return p * n + q; }; bad = [PQ(p, q + R.pick([-2, -1, 1, 2]), "n"), PQ(p + R.pick([-1, 1]), q, "n"), PQ(q === 0 ? p + 2 : q, p, "n")]; }
          else if (fam === "quad") { p = R.int(1, 3); q = R.int(-6, 6); tex = CF1(p) + "n^2" + (q === 0 ? "" : (q < 0 ? " - " : " + ") + Math.abs(q)); f = function (n) { return p * n * n + q; }; bad = [CF1(p) + "n^2" + " " + SGN(-q || 1) + " " + (Math.abs(q) || 2), CF1(p + 1) + "n^2" + (q === 0 ? "" : (q < 0 ? " - " : " + ") + Math.abs(q)), CF1(p) + "n" + (q === 0 ? " + 2" : (q < 0 ? " - " : " + ") + Math.abs(q))]; }
          else { p = R.int(1, 6); var rr = R.pick([2, 3]); tex = (p === 1 ? "" : p + " \\cdot ") + rr + "^{n-1}"; f = function (n) { return p * Math.pow(rr, n - 1); }; bad = [(p === 1 ? "" : p + " \\cdot ") + rr + "^{n}", (rr === 2 ? 3 : 2) + " \\cdot " + p + "^{n-1}", p + " \\cdot " + rr + "n"]; }
          var terms = [1, 2, 3, 4].map(f);
          var wrong = UNIQ(bad).filter(function (b) { return b !== tex; }).slice(0, 3).map(function (b) { return { t: "$a_n = " + b + "$", fb: "Test $n = 1, 2, 3$ in the formula and compare with the terms." }; });
          return mc(R, { prompt: "Which explicit formula gives the sequence $" + LST(terms) + ",\\ \\dots$?", right: "$a_n = " + tex + "$", wrong: wrong, keep: true, hints: ["Put $n = 1$ and $n = 2$ into each formula."], why: "$a_n = " + tex + "$." });
        }
        var tex2, f2, k;
        if (t === 0) { var p0 = R.int(2, 7), q0 = R.int(-5, 9); k = R.int(5, 12); tex2 = PQ(p0, q0, "n"); f2 = p0 * k + q0; }
        else if (t === 1) { var p1 = R.int(1, 3), q1 = R.int(-6, 6); k = R.int(3, 8); tex2 = CF1(p1) + "n^2" + (q1 === 0 ? "" : (q1 < 0 ? " - " : " + ") + Math.abs(q1)); f2 = p1 * k * k + q1; }
        else if (t === 2) { var c2 = R.int(1, 5); k = R.int(3, 9); tex2 = "(-1)^n(n + " + c2 + ")"; f2 = (k % 2 ? -1 : 1) * (k + c2); }
        else { var p3 = R.int(1, 6), r3 = R.pick([2, 3]); k = R.int(3, 6); tex2 = (p3 === 1 ? "" : p3 + " \\cdot ") + r3 + "^{n-1}"; f2 = p3 * Math.pow(r3, k - 1); }
        return { type: "num", prompt: "Find $a_{" + k + "}$ for the sequence $a_n = " + tex2 + "$.", pre: "$a_{" + k + "} =$", answer: f2,
          near: near(f2, [{ v: -f2, fb: "Check the sign of the term: substitute $n = " + k + "$ carefully." }, { v: f2 + 1, fb: "Check the arithmetic: substitute $n = " + k + "$ and work out each part." }]), hints: ["Put $n = " + k + "$ into the formula."], why: "$a_{" + k + "} = " + f2 + "$." };
      } },
    { id: "pc11-recursive", title: "Recursive formulas and factorials", lesson: 3,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 0) { var s = R.int(1, 5), p = R.pick([2, 3, -2]), q = R.int(-3, 5), k = R.int(3, 5), a = s, i;
          for (i = 2; i <= k; i++) a = p * a + q;
          return { type: "num", prompt: "$a_1 = " + s + "$ and $a_n = " + CF1(p) + "a_{n-1}" + (q === 0 ? "" : (q < 0 ? " - " : " + ") + Math.abs(q)) + "$. Find $a_{" + k + "}$.", pre: "$a_{" + k + "} =$", answer: a,
            near: near(a, [{ v: a - q, fb: "Check the last step: apply the rule once more to the previous term." }]), hints: ["Work out $a_2$, then $a_3$, one term at a time."], why: "Each term comes from the one before it: $a_{" + k + "} = " + a + "$." }; }
        if (t === 1) { var s1 = R.int(1, 4), s2 = R.int(1, 5), op = R.pick(["+", "2"]), k1 = R.int(5, 7), x = s1, y = s2, j, z;
          for (j = 3; j <= k1; j++) { z = op === "+" ? y + x : 2 * y - x; x = y; y = z; }
          var tex = op === "+" ? "a_{n-1} + a_{n-2}" : "2a_{n-1} - a_{n-2}";
          return { type: "num", prompt: "$a_1 = " + s1 + "$, $a_2 = " + s2 + "$ and $a_n = " + tex + "$. Find $a_{" + k1 + "}$.", pre: "$a_{" + k1 + "} =$", answer: y,
            near: near(y, [{ v: x, fb: "That is the term before. Go one more step." }]), hints: ["Each new term uses the **two** terms before it."], why: "$a_{" + k1 + "} = " + y + "$." }; }
        var f = R.int(0, 2), val, ex;
        if (f === 0) { var n = R.int(6, 9), m = R.int(3, n - 2); val = FACT(n) / FACT(m); ex = "\\dfrac{" + n + "!}{" + m + "!}"; }
        else if (f === 1) { var n2 = R.int(6, 9), a2 = R.int(2, n2 - 2); val = FACT(n2) / (FACT(a2) * FACT(n2 - a2)); ex = "\\dfrac{" + n2 + "!}{" + a2 + "!\\," + (n2 - a2) + "!}"; }
        else { var n3 = R.int(3, 8); val = (n3 + 1) * n3; ex = "\\dfrac{" + (n3 + 1) + "!}{" + (n3 - 1) + "!}"; }
        return { type: "num", prompt: "Work out $" + ex + "$.", pre: "value =", answer: val,
          near: near(val, [{ v: 1, fb: "Expand the larger factorial until the smaller one appears, then cancel." }]), hints: ["Write the larger factorial as a product that ends in the smaller one."], why: "The value is " + val + "." };
      } },
    { id: "pc11-arith", title: "Arithmetic sequences", lesson: 4,
      gen: function (R) {
        var t = R.int(0, 3), a1 = R.int(-10, 30), d = R.nz(-9, 9);
        var seq = function (a, dd, n) { var o = [], i; for (i = 0; i < n; i++) o.push(a + i * dd); return o; };
        if (t === 0) return { type: "num", prompt: "Find the common difference of the arithmetic sequence $" + LST(seq(a1, d, 4)) + ",\\ \\dots$", pre: "$d =$", answer: d,
          near: near(d, [{ v: -d, fb: "Check the sign: " + (d > 0 ? "the terms rise" : "the terms fall") + ", so $d$ is " + (d > 0 ? "positive" : "negative") + "." }]), hints: ["Subtract a term from the next one."], why: "$d = " + d + "$." };
        if (t === 1) {
          var good = seq(a1, d, 4), q = R.int(1, 3), quad = [1, 2, 3, 4].map(function (n) { return n * n + q; }), oneoff = seq(a1, d, 4); oneoff[3] += R.pick([-2, -1, 1, 2]);
          var geo = [R.int(1, 4)]; geo.push(geo[0] * 2, geo[0] * 4, geo[0] * 8);
          var toS = function (x) { return "$" + LST(x) + "$"; };
          return mc(R, { prompt: "Which of these sequences is arithmetic?", right: toS(good), wrong: UNIQ([toS(geo), toS(quad), toS(oneoff)]).filter(function (x) { return x !== toS(good); }).map(function (x) { return { t: x, fb: "Subtract neighbouring terms: **every** difference must be the same." }; }), keep: true, hints: ["Check that every difference is equal."], why: "Its differences are all $" + d + "$." });
        }
        if (t === 2) { var k = R.int(4, 6), v = a1 + (k - 1) * d; return { type: "num", prompt: "An arithmetic sequence has $a_1 = " + a1 + "$ and $d = " + d + "$. What is $a_{" + k + "}$?", pre: "$a_{" + k + "} =$", answer: v,
          near: near(v, [{ v: a1 + k * d, fb: "There are $" + (k - 1) + "$ steps from $a_1$ to $a_{" + k + "}$, not $" + k + "$." }]), hints: ["Add $d$ one step at a time."], why: "$a_{" + k + "} = " + v + "$." }; }
        var dd = R.nz(-6, 8), a4 = a1 + 3 * dd, which = R.pick([2, 3]);
        return { type: "num", prompt: "An arithmetic sequence has $a_1 = " + a1 + "$ and $a_4 = " + a4 + "$. What is $a_{" + which + "}$?", pre: "$a_{" + which + "} =$", answer: a1 + (which - 1) * dd,
          near: near(a1 + (which - 1) * dd, [{ v: a4 - (which - 1) * dd, fb: "Count the steps from $a_1$: it is " + (which - 1) + " step" + (which === 2 ? "" : "s") + " of $d$." }]), hints: ["From $a_1$ to $a_4$ is 3 steps: find $d$ first."], why: "$d = " + dd + "$." };
      } },
    { id: "pc11-arithn", title: "The explicit formula of an arithmetic sequence", lesson: 5,
      gen: function (R) {
        var t = R.int(0, 3), a1 = R.int(-10, 30), d = R.nz(-8, 9);
        if (t === 0) { var k = R.int(10, 40), v = a1 + (k - 1) * d; return { type: "num", prompt: "An arithmetic sequence has $a_1 = " + a1 + "$ and $d = " + d + "$. Find $a_{" + k + "}$.", pre: "$a_{" + k + "} =$", answer: v,
          near: near(v, [{ v: a1 + k * d, fb: "There are $n - 1 = " + (k - 1) + "$ steps from $a_1$." }]), hints: ["$a_n = a_1 + (n - 1)d$."], why: "$" + a1 + " + " + (k - 1) + "(" + d + ") = " + v + "$." }; }
        if (t === 1) { var n = R.int(8, 30), last = a1 + (n - 1) * d; return { type: "num", prompt: "How many terms are in the arithmetic sequence $" + a1 + ",\\ " + (a1 + d) + ",\\ " + (a1 + 2 * d) + ",\\ \\dots,\\ " + last + "$?", pre: "terms =", answer: n,
          near: near(n, [{ v: n - 1, fb: "That is $n - 1$. Add the 1 back." }, { v: n + 1, fb: "Solve $a_1 + (n - 1)d = $ last term, then add 1 to $n - 1$." }]), hints: ["Set $a_1 + (n - 1)d$ equal to the last term and solve for $n$."], why: "$n = " + n + "$." }; }
        if (t === 2) { var i = R.int(2, 5), j = R.int(i + 2, i + 7), m = R.int(j + 2, j + 8), ai = a1 + (i - 1) * d, aj = a1 + (j - 1) * d, am = a1 + (m - 1) * d;
          return { type: "num", prompt: "An arithmetic sequence has $a_{" + i + "} = " + ai + "$ and $a_{" + j + "} = " + aj + "$. Find $a_{" + m + "}$.", pre: "$a_{" + m + "} =$", answer: am,
            near: near(am, [{ v: aj + (m - j) * d + d, fb: "Count the steps from $a_{" + j + "}$ to $a_{" + m + "}$: " + (m - j) + " of them." }]), hints: ["Find $d = \\frac{a_{" + j + "} - a_{" + i + "}}{" + (j - i) + "}$ first."], why: "$d = " + d + "$." }; }
        var n4 = R.int(6, 30), val = a1 + (n4 - 1) * d;
        return { type: "num", prompt: "An arithmetic sequence starts at $" + a1 + "$ and changes by $" + d + "$ each step. Which term is equal to $" + val + "$?", pre: "$n =$", answer: n4,
          near: near(n4, [{ v: n4 - 1, fb: "That is $n - 1$ from $a_1 + (n - 1)d$. Add 1." }]), hints: ["Solve $" + a1 + " + (n - 1)(" + d + ") = " + val + "$."], why: "$n = " + n4 + "$." };
      } },
    { id: "pc11-geo", title: "Geometric sequences", lesson: 6,
      gen: function (R) {
        var t = R.int(0, 2), a1 = R.int(1, 6), r = R.pick([2, 3, 4, -2, -3]);
        var seq = function (a, rr, n) { var o = [], i; for (i = 0; i < n; i++) o.push(a * Math.pow(rr, i)); return o; };
        if (t === 0) { var rf = R.pick([[1, 2], [1, 3], [2, 3], [3, 2]]), base = rf[1] * rf[1] * rf[1] * R.int(1, 2), rr2 = rf[0] / rf[1], s4 = seq(base, rr2, 4).map(RD);
          var useFrac = R.chance(0.4);
          if (useFrac) return { type: "num", prompt: "Find the common ratio of the geometric sequence $" + LST(s4) + ",\\ \\dots$" + GENX, pre: "$r =$", answer: RD(rr2), tol: 0.006, calc: true, near: near(RD(rr2), [{ v: RD(1 / rr2), tol: 0.006, fb: "Divide the **later** term by the earlier one." }]), hints: ["Divide the second term by the first."], why: "$r = \\frac{" + rf[0] + "}{" + rf[1] + "}$." };
          return { type: "num", prompt: "Find the common ratio of the geometric sequence $" + LST(seq(a1, r, 4)) + ",\\ \\dots$", pre: "$r =$", answer: r, near: near(r, [{ v: -r, fb: "Check the sign: do the terms alternate?" }, { v: seq(a1, r, 2)[1] - a1, fb: "That is a difference. Divide: later term over earlier." }]), hints: ["Divide the second term by the first."], why: "$r = " + r + "$." }; }
        if (t === 1) { var geo = seq(a1, r, 4), ar = [a1, a1 + 3, a1 + 6, a1 + 9], quad = [1, 2, 3, 4].map(function (n) { return n * n * a1; }), part = geo.slice(); part[3] += R.pick([-1, 1, 2]);
          var toS = function (x) { return "$" + LST(x) + "$"; };
          return mc(R, { prompt: "Which of these sequences is geometric?", right: toS(geo), wrong: UNIQ([toS(ar), toS(quad), toS(part)]).filter(function (x) { return x !== toS(geo); }).map(function (x) { return { t: x, fb: "Divide each term by the one before: **every** ratio must be the same." }; }), keep: true, hints: ["Check that every ratio is equal."], why: "Its ratios are all $" + r + "$." }); }
        var k = R.int(4, 5), v = a1 * Math.pow(r, k - 1);
        return { type: "num", prompt: "A geometric sequence has $a_1 = " + a1 + "$ and $r = " + r + "$. What is $a_{" + k + "}$?", pre: "$a_{" + k + "} =$", answer: v,
          near: near(v, [{ v: a1 * Math.pow(r, k), fb: "There are $" + (k - 1) + "$ multiplications from $a_1$ to $a_{" + k + "}$." }, { v: -v, fb: "Check the signs: a negative ratio flips the sign each step." }]), hints: ["Multiply by $r$ one step at a time."], why: "$a_{" + k + "} = " + v + "$." };
      } },
    { id: "pc11-geon", title: "The explicit formula of a geometric sequence", lesson: 7,
      gen: function (R) {
        var t = R.int(0, 2), a1 = R.int(1, 6), r = R.pick([2, 3, -2]);
        if (t === 0) { var k = R.int(4, 8), v = a1 * Math.pow(r, k - 1); return { type: "num", prompt: "A geometric sequence has $a_1 = " + a1 + "$ and $r = " + r + "$. Find $a_{" + k + "}$.", pre: "$a_{" + k + "} =$", answer: v,
          near: near(v, [{ v: a1 * Math.pow(r, k), fb: "The exponent is $n - 1 = " + (k - 1) + "$." }]), hints: ["$a_n = a_1 r^{n-1}$."], why: "$" + a1 + " \\cdot (" + r + ")^{" + (k - 1) + "} = " + v + "$." }; }
        if (t === 1) { var i = R.int(2, 3), gap = r < 0 ? 3 : R.pick([2, 3]), j = i + gap, ai = a1 * Math.pow(r, i - 1), aj = a1 * Math.pow(r, j - 1); return { type: "num", prompt: "A geometric sequence has $a_{" + i + "} = " + ai + "$ and $a_{" + j + "} = " + aj + "$ with a " + (gap === 2 ? "**positive** whole-number" : "**whole-number**") + " ratio. What is $r$?", pre: "$r =$", answer: r,
          near: near(r, [{ v: -r, fb: "Check the sign: " + (aj / ai > 0 ? "the two terms have the same sign" : "the signs differ") + "." }, { v: aj / ai, fb: "That is $r^{" + (j - i) + "}$. Take the root." }]), hints: ["$\\frac{a_{" + j + "}}{a_{" + i + "}} = r^{" + (j - i) + "}$."], why: "$r = " + r + "$." }; }
        var n = R.int(4, 8), val = a1 * Math.pow(r, n - 1);
        return { type: "num", prompt: "A geometric sequence has $a_1 = " + a1 + "$ and $r = " + r + "$. Which term is equal to $" + val + "$?", pre: "$n =$", answer: n,
          near: near(n, [{ v: n - 1, fb: "That is the exponent $n - 1$. Add 1." }]), hints: ["Solve $" + a1 + "(" + r + ")^{n-1} = " + val + "$."], why: "$n = " + n + "$." };
      } },
    { id: "pc11-sigma", title: "Summation notation", lesson: 8,
      gen: function (R) {
        var t = R.int(0, 3), lo = R.int(1, 3), hi = lo + R.int(2, 6), tex, f;
        if (t === 0) { var p = R.int(2, 6), q = R.int(-5, 6); tex = "(" + PQ(p, q, "k") + ")"; f = function (k) { return p * k + q; }; }
        else if (t === 1) { tex = "k^2"; f = function (k) { return k * k; }; }
        else if (t === 2) { tex = "(-1)^k\\,k"; f = function (k) { return (k % 2 ? -1 : 1) * k; }; }
        else { tex = "2^k"; f = function (k) { return Math.pow(2, k); }; hi = lo + R.int(2, 4); }
        var s = 0, k; for (k = lo; k <= hi; k++) s += f(k);
        return { type: "num", prompt: "Evaluate $\\displaystyle\\sum_{k=" + lo + "}^{" + hi + "} " + tex + "$.", pre: "sum =", answer: s,
          near: near(s, [{ v: s - f(hi), fb: "Include the last term, $k = " + hi + "$." }, { v: s + f(lo - 1), fb: "Start at the lower limit, $k = " + lo + "$." }]), hints: ["Write out the terms for $k = " + lo + "$ up to $k = " + hi + "$, then add."], why: "The sum is " + s + "." };
      } },
    { id: "pc11-arithS", title: "Arithmetic series", lesson: 9,
      gen: function (R) {
        var t = R.int(0, 2), a1 = R.int(-5, 20), d = R.nz(-5, 9);
        if (t === 0) { var n = R.int(8, 30), S = n * (2 * a1 + (n - 1) * d) / 2; return { type: "num", prompt: "An arithmetic series has $a_1 = " + a1 + "$ and $d = " + d + "$. Find $S_{" + n + "}$.", pre: "$S_{" + n + "} =$", answer: S,
          near: near(S, [{ v: 2 * S, fb: "Halve: $S_n = \\frac{n}{2}(a_1 + a_n)$." }]), hints: ["Find $a_n$ first, then $S_n = \\frac{n}{2}(a_1 + a_n)$."], why: "$S_{" + n + "} = " + S + "$." }; }
        if (t === 1) { var n1 = R.int(8, 25), last = a1 + (n1 - 1) * d, S1 = n1 * (a1 + last) / 2; return { type: "num", prompt: "Find the sum $" + [a1, a1 + d, a1 + 2 * d].join(" + ").replace(/\+ -/g, "- ") + " + \\dots " + (last < 0 ? "- " + (-last) : "+ " + last) + "$ (an arithmetic series).", pre: "sum =", answer: S1,
          near: near(S1, [{ v: 2 * S1, fb: "Halve: $S_n = \\frac{n}{2}(a_1 + a_n)$." }, { v: n1, fb: "That is the number of terms. Now add them up." }]), hints: ["Find the number of terms, then $\\frac{n}{2}(a_1 + a_n)$."], why: "$n = " + n1 + "$, so $S = " + S1 + "$." }; }
        var p = R.int(2, 7), q = R.int(-4, 5), n2 = R.int(8, 25), S2 = 0, k; for (k = 1; k <= n2; k++) S2 += p * k + q;
        return { type: "num", prompt: "The terms are $a_n = " + PQ(p, q, "n") + "$. Find $S_{" + n2 + "}$, the sum of the first " + n2 + " terms.", pre: "$S_{" + n2 + "} =$", answer: S2,
          near: near(S2, [{ v: 2 * S2, fb: "Halve: $S_n = \\frac{n}{2}(a_1 + a_n)$." }]), hints: ["$a_1$ and $a_{" + n2 + "}$ from the formula, then $\\frac{n}{2}(a_1 + a_n)$."], why: "$S_{" + n2 + "} = " + S2 + "$." };
      } },
    { id: "pc11-geoS", title: "Geometric series", lesson: 10,
      gen: function (R) {
        var t = R.int(0, 1), n = R.int(4, 8);
        if (t === 0) { var a1 = R.int(1, 6), r = R.pick([2, 3, -2, 4]), S = 0, k; for (k = 0; k < n; k++) S += a1 * Math.pow(r, k);
          return { type: "num", prompt: "A geometric series has $a_1 = " + a1 + "$, $r = " + r + "$ and " + n + " terms. Find $S_{" + n + "}$.", pre: "$S_{" + n + "} =$", answer: S,
            near: near(S, [{ v: a1 * Math.pow(r, n - 1), fb: "That is the last term. $S_n = \\frac{a_1(1 - r^n)}{1 - r}$ adds them all." }]), hints: ["$S_n = \\frac{a_1(1 - r^n)}{1 - r}$."], why: "$S_{" + n + "} = " + S + "$." }; }
        var m = R.int(1, 3), a = m * Math.pow(2, n - 1), S2 = 0, k2; for (k2 = 0; k2 < n; k2++) S2 += a / Math.pow(2, k2);
        return { type: "num", prompt: "Find the sum of the first " + n + " terms of $" + a + " + " + a / 2 + " + " + a / 4 + " + \\dots$ (each term is half the one before).", pre: "sum =", answer: S2,
          near: near(S2, [{ v: 2 * a, fb: "That is the sum of **all** the terms (infinitely many). Here only " + n + " terms are added." }]), hints: ["$a_1 = " + a + "$ and $r = \\frac{1}{2}$."], why: "The sum is " + S2 + "." };
      } },
    { id: "pc11-inf", title: "Infinite geometric series", lesson: 11,
      gen: function (R) {
        var t = R.int(0, 2), RT = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [-1, 2], [-1, 3], [-2, 3]], rf = R.pick(RT), r = rf[0] / rf[1], q = Math.abs(rf[1]);
        if (t === 0) { var a1 = q * q * q * R.int(1, 2), terms = [a1, a1 * r, a1 * r * r, a1 * r * r * r].map(RD), S = a1 / (1 - r);
          return { type: "num", prompt: "Find the sum of the infinite geometric series $" + terms.join(" + ").replace(/\+ -/g, "- ") + " + \\dots$" + GENX, pre: "$S =$", answer: RD(S), tol: 0.006, calc: true,
            near: near(RD(S), [{ v: RD(terms[0] + terms[1] + terms[2] + terms[3]), tol: 0.006, fb: "That is the sum of four terms only. For all of them use $S = \\frac{a_1}{1 - r}$." }, { v: RD(a1 / (1 + r)), tol: 0.006, fb: "The formula is $\\frac{a_1}{1 - r}$: subtract $r$." }]), hints: ["Find $r$, then $S = \\frac{a_1}{1 - r}$."], why: "$r = " + RD(r) + "$, so $S = " + RD(S) + "$." }; }
        if (t === 1) { var bigR = R.pick([[3, 2], [2, 1], [-2, 1], [5, 4]]), conv = R.chance(0.5), use = conv ? rf : bigR, rr = use[0] / use[1], base = conv ? Math.pow(Math.abs(use[1]), 3) : Math.pow(Math.abs(use[1]), 3) * R.int(1, 2), ts = [base, base * rr, base * rr * rr, base * rr * rr * rr].map(RD);
          var yes = "Yes: the series has a sum", no = "No: the series does not have a sum", right = Math.abs(rr) < 1 ? yes : no;
          return mc(R, { prompt: "Does the geometric series $" + ts.join(" + ").replace(/\+ -/g, "- ") + " + \\dots$ have a sum?", right: right, wrong: [{ t: right === yes ? no : yes, fb: "The sum exists only when $|r| < 1$. Find $r$: here $r = " + RD(rr) + "$." }], keep: true, hints: ["Find $r$ and compare $|r|$ with 1."], why: "$r = " + RD(rr) + "$: " + (Math.abs(rr) < 1 ? "$|r| < 1$, so a sum exists." : "$|r| \\ge 1$, so there is no sum.") }); }
        var a = R.int(2, 9), S3 = a / (1 - 0.1);
        return { type: "num", prompt: "Find the sum of the infinite series $" + a / 10 + " + " + a / 100 + " + " + a / 1000 + " + \\dots$ (each term is one tenth of the one before)." + GENX, pre: "$S =$", answer: RD(a / 10 / 0.9), tol: 0.006, calc: true,
          near: near(RD(a / 10 / 0.9), [{ v: RD(a / 10), tol: 0.006, fb: "That is $a_1$. The sum is $\\frac{a_1}{1 - r}$ with $r = 0.1$." }]), hints: ["$a_1 = " + a / 10 + "$ and $r = 0.1$."], why: "$\\frac{" + a / 10 + "}{0.9}$." };
      } },
    { id: "pc11-count", title: "The counting principles", lesson: 12,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) { var a = R.int(3, 8), b = R.int(3, 8), c = R.int(2, 6); return { type: "num", prompt: "A meal is one of " + a + " starters, one of " + b + " mains and one of " + c + " desserts. How many different meals are there?", pre: "meals =", answer: a * b * c,
          near: near(a * b * c, [{ v: a + b + c, fb: "All three are chosen: **multiply**, do not add." }]), hints: ["Choices made one after another multiply."], why: "$" + a + " \\cdot " + b + " \\cdot " + c + " = " + a * b * c + "$." }; }
        if (t === 1) { var s = R.int(3, 8), sa = R.int(2, 6), p = R.int(2, 7); return { type: "num", prompt: "A café offers " + s + " soups, " + sa + " salads **or** " + p + " pasta dishes. You choose one item. How many choices are there?", pre: "choices =", answer: s + sa + p,
          near: near(s + sa + p, [{ v: s * sa * p, fb: "You pick **one** item, either-or: **add** the groups." }]), hints: ["Either-or choices add."], why: "$" + s + " + " + sa + " + " + p + "$." }; }
        if (t === 2) { var L = R.int(1, 3), D = R.int(2, 4), rep = R.chance(0.5), v = 1, i;
          if (rep) { v = Math.pow(26, L) * Math.pow(10, D); } else { for (i = 0; i < L; i++) v *= 26 - i; for (i = 0; i < D; i++) v *= 10 - i; }
          return { type: "num", prompt: "A code is " + L + " letter" + (L > 1 ? "s" : "") + " (from 26) followed by " + D + " digits (from 0 to 9). How many codes are possible if letters and digits " + (rep ? "**may** repeat" : "may **not** repeat") + "?", pre: "codes =", answer: v,
            near: near(v, rep ? [{ v: Math.pow(26, L) + Math.pow(10, D), fb: "Choices made one after another **multiply**." }] : [{ v: Math.pow(26, L) * Math.pow(10, D), fb: "With no repeats each choice has one fewer option than the last, within letters and within digits." }]), hints: ["Fill the places one at a time and multiply the options."], why: "The count is " + v + "." }; }
        var h = R.int(2, 6), c2 = R.int(2, 5), sn = R.int(3, 7);
        return { type: "num", prompt: "You choose either one of " + h + " hot drinks or one of " + c2 + " cold drinks, **and** one of " + sn + " snacks. How many combinations are there?", pre: "combinations =", answer: (h + c2) * sn,
          near: near((h + c2) * sn, [{ v: h + c2 + sn, fb: "The drink and the snack are both chosen: multiply." }, { v: h * c2 * sn, fb: "A drink is **either** hot **or** cold: add those first." }]), hints: ["Add the either-or drinks, then multiply by the snacks."], why: "$(" + h + " + " + c2 + ") \\cdot " + sn + "$." };
      } },
    { id: "pc11-perm", title: "Permutations", lesson: 13,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) { var n = R.int(5, 10), r = R.int(2, 4); return { type: "num", prompt: "Find $P(" + n + ", " + r + ")$.", pre: "$P(" + n + ", " + r + ") =$", answer: FACT(n) / FACT(n - r),
          near: near(FACT(n) / FACT(n - r), [{ v: CHOOSE(n, r), fb: "That is $C(" + n + ", " + r + ")$, where order does not matter. For $P$: $\\frac{n!}{(n - r)!}$." }]), hints: ["Multiply $" + r + "$ numbers downwards from $" + n + "$."], why: "$P(" + n + ", " + r + ") = " + FACT(n) / FACT(n - r) + "$." }; }
        if (t === 1) { var n1 = R.int(4, 8); return { type: "num", prompt: "In how many different orders can " + n1 + " different books be arranged on a shelf?", pre: "orders =", answer: FACT(n1),
          near: near(FACT(n1), [{ v: n1 * n1, fb: "Each place has one fewer option than the last: $" + n1 + "!$." }]), hints: ["Fill the places one at a time: $n$, then $n - 1$, and so on."], why: "$" + n1 + "! = " + FACT(n1) + "$." }; }
        if (t === 2) { var W = R.pick([["BOOK", 12], ["LEVEL", 30], ["APPLE", 60], ["BANANA", 60], ["TOOTH", 30], ["SEEDS", 30], ["RADAR", 30], ["LETTER", 180], ["PEPPER", 60], ["BALLOON", 1260]]);
          return { type: "num", prompt: "How many different arrangements are there of the letters of the word " + W[0] + "?", pre: "arrangements =", answer: W[1],
            near: near(W[1], [{ v: FACT(W[0].length), fb: "Some letters repeat, so divide $n!$ by the factorial of each repeat count." }]), hints: ["Divide $n!$ by the factorials of the repeated-letter counts."], why: W[0] + ": " + W[1] + " arrangements." }; }
        var n3 = R.int(6, 12), r3 = R.int(2, 3), roles = r3 === 2 ? "a president and a secretary" : "a president, a secretary and a treasurer";
        return { type: "num", prompt: "A club of " + n3 + " people elects " + roles + " (all different people). In how many ways can this be done?", pre: "ways =", answer: FACT(n3) / FACT(n3 - r3),
          near: near(FACT(n3) / FACT(n3 - r3), [{ v: CHOOSE(n3, r3), fb: "The roles are different, so **order matters**: use $P(n, r)$." }]), hints: ["Fill the jobs one at a time."], why: "$P(" + n3 + ", " + r3 + ") = " + FACT(n3) / FACT(n3 - r3) + "$." };
      } },
    { id: "pc11-comb", title: "Combinations and subsets", lesson: 14,
      gen: function (R) {
        var t = R.int(0, 3);
        if (t === 0) { var n = R.int(6, 12), r = R.int(2, 4); return { type: "num", prompt: "Find $C(" + n + ", " + r + ")$.", pre: "$C(" + n + ", " + r + ") =$", answer: CHOOSE(n, r),
          near: near(CHOOSE(n, r), [{ v: FACT(n) / FACT(n - r), fb: "That is $P(" + n + ", " + r + ")$. Divide by $" + r + "! = " + FACT(r) + "$." }]), hints: ["$C(n, r) = \\frac{n!}{r!\\,(n - r)!}$."], why: "$C(" + n + ", " + r + ") = " + CHOOSE(n, r) + "$." }; }
        if (t === 1) { var n1 = R.int(4, 9); return { type: "num", prompt: "How many subsets (including the empty set and the whole set) does a set with " + n1 + " elements have?", pre: "subsets =", answer: Math.pow(2, n1),
          near: near(Math.pow(2, n1), [{ v: n1 * n1, fb: "Each element is in or out: $2 \\cdot 2 \\cdots 2$." }, { v: FACT(n1), fb: "Each element has 2 choices (in or out), so $2^n$." }]), hints: ["Each element is either in the subset or out."], why: "$2^{" + n1 + "} = " + Math.pow(2, n1) + "$." }; }
        if (t === 2) { var n2 = R.int(5, 9), r2 = R.int(2, 3); return { type: "num", prompt: "How many subsets of exactly " + r2 + " elements does a set of " + n2 + " elements have?", pre: "subsets =", answer: CHOOSE(n2, r2),
          near: near(CHOOSE(n2, r2), [{ v: Math.pow(2, n2), fb: "That counts subsets of every size. We want exactly " + r2 + "." }]), hints: ["Choose which " + r2 + " elements are in."], why: "$C(" + n2 + ", " + r2 + ") = " + CHOOSE(n2, r2) + "$." }; }
        var n3 = R.int(6, 12), r3 = R.int(2, 4);
        return { type: "num", prompt: "A class of " + n3 + " students chooses a committee of " + r3 + " (no roles: just a group). How many committees are possible?", pre: "committees =", answer: CHOOSE(n3, r3),
          near: near(CHOOSE(n3, r3), [{ v: FACT(n3) / FACT(n3 - r3), fb: "The order does not matter, so divide the ordered count by $" + r3 + "!$." }]), hints: ["Order does not matter: use $C(n, r)$."], why: "$C(" + n3 + ", " + r3 + ") = " + CHOOSE(n3, r3) + "$." };
      } },
    { id: "pc11-binom", title: "The Binomial Theorem", lesson: 15,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 0) { var n = R.int(4, 7), a = R.nz(-4, 4), k = R.int(1, n - 1), c = CHOOSE(n, k) * Math.pow(a, n - k);
          return { type: "num", prompt: "Find the coefficient of $x^{" + k + "}$ in the expansion of $(x " + (a < 0 ? "- " + (-a) : "+ " + a) + ")^{" + n + "}$.", pre: "coefficient =", answer: c,
            near: near(c, [{ v: CHOOSE(n, k), fb: "That is the Pascal coefficient. Multiply by $" + a + "^{" + (n - k) + "}$." }, { v: CHOOSE(n, k) * Math.pow(a, k), fb: "The power of the second term is $n - k = " + (n - k) + "$." }]), hints: ["The term is $C(" + n + ", " + k + ")\\,x^{" + k + "}\\,(" + a + ")^{" + (n - k) + "}$."], why: "$" + CHOOSE(n, k) + " \\cdot (" + a + ")^{" + (n - k) + "} = " + c + "$." }; }
        if (t === 1) { var n1 = R.int(3, 5), p = R.int(2, 3), q = R.nz(-3, 3), k1 = R.int(1, n1 - 1), c1 = CHOOSE(n1, k1) * Math.pow(p, k1) * Math.pow(q, n1 - k1);
          return { type: "num", prompt: "Find the coefficient of $x^{" + k1 + "}$ in the expansion of $(" + p + "x " + (q < 0 ? "- " + (-q) : "+ " + q) + ")^{" + n1 + "}$.", pre: "coefficient =", answer: c1,
            near: near(c1, [{ v: CHOOSE(n1, k1) * Math.pow(q, n1 - k1), fb: "The $" + p + "$ is raised to the power too: $(" + p + "x)^{" + k1 + "}$." }]), hints: ["The term is $C(" + n1 + ", " + k1 + ")\\,(" + p + "x)^{" + k1 + "}\\,(" + q + ")^{" + (n1 - k1) + "}$."], why: "The coefficient is " + c1 + "." }; }
        var n2 = R.int(5, 8), a2 = R.nz(-2, 3);
        return { type: "num", prompt: "Put $x = 1$ in $(x " + (a2 < 0 ? "- " + (-a2) : "+ " + a2) + ")^{" + n2 + "}$ to find the **sum of all the coefficients** of its expansion.", pre: "sum =", answer: Math.pow(1 + a2, n2),
          near: near(Math.pow(1 + a2, n2), [{ v: Math.pow(a2, n2), fb: "Replace $x$ by 1 first: $(1 + " + a2 + ")^{" + n2 + "}$." }]), hints: ["Replace $x$ by 1."], why: "$(1 + " + a2 + ")^{" + n2 + "} = " + Math.pow(1 + a2, n2) + "$." };
      } },
    { id: "pc11-prob", title: "Probability of equally likely outcomes", lesson: 16,
      gen: function (R) {
        var t = R.int(0, 3), ans, prompt, hint;
        if (t === 0) { var kind = R.pick(["is", "least", "most"]), s = kind === "is" ? R.int(3, 11) : kind === "least" ? R.int(5, 11) : R.int(3, 9), c = 0, a, b;
          for (a = 1; a <= 6; a++) for (b = 1; b <= 6; b++) { var sum = a + b; if (kind === "is" ? sum === s : kind === "least" ? sum >= s : sum <= s) c++; }
          ans = c / 36; prompt = "Two fair dice are rolled. What is the probability that the sum is " + (kind === "is" ? "" : kind === "least" ? "at least " : "at most ") + s + "?"; hint = "Count the pairs out of the 36 possible."; }
        else if (t === 1) { var n = R.int(3, 5), k = R.int(0, n); ans = CHOOSE(n, k) / Math.pow(2, n); prompt = "A fair coin is flipped " + n + " times. What is the probability of exactly " + k + " head" + (k === 1 ? "" : "s") + "?"; hint = "There are $2^" + n + "$ equally likely outcomes."; }
        else if (t === 2) { var E = R.pick([["a heart", 13], ["a king", 4], ["a face card (jack, queen or king)", 12], ["a red card", 26], ["an ace", 4], ["a black king", 2], ["a card numbered 2 to 10", 36]]); ans = E[1] / 52; prompt = "A card is drawn at random from a standard deck of 52. What is the probability it is " + E[0] + "?"; hint = "Count the favourable cards out of 52."; }
        else { var rd = R.int(2, 6), bl = R.int(2, 7), gr = R.int(1, 5), col = R.pick(["red", "blue", "green"]), cnt = col === "red" ? rd : col === "blue" ? bl : gr; ans = cnt / (rd + bl + gr); prompt = "A bag holds " + rd + " red, " + bl + " blue and " + gr + " green marbles. One is drawn at random. What is the probability it is " + col + "?"; hint = "Favourable over the total number of marbles."; }
        return { type: "num", prompt: prompt + GENX, pre: "$P =$", answer: RD(ans), tol: 0.0011, calc: true,
          near: near(RD(ans), [{ v: RD(1 - ans), tol: 0.0011, fb: "That is the probability of the **opposite** event." }]), hints: [hint], why: "$P = " + RD(ans) + "$." };
      } },
    { id: "pc11-prob2", title: "Union, complement and counting", lesson: 17,
      gen: function (R) {
        var t = R.int(0, 2);
        if (t === 0) { var pa = R.int(2, 6) / 10, pb = R.int(2, 6) / 10, pab = R.int(1, Math.min(Math.round(pa * 10), Math.round(pb * 10))) / 10, u = RD(pa + pb - pab);
          return { type: "num", prompt: "$P(A) = " + pa + "$, $P(B) = " + pb + "$ and $P(A \\text{ and } B) = " + pab + "$. What is $P(A \\text{ or } B)$?", pre: "$P =$", answer: u, tol: 0.001,
            near: near(u, [{ v: RD(pa + pb), tol: 0.001, fb: "Subtract the overlap $" + pab + "$ that was counted twice." }]), hints: ["$P(A) + P(B) - P(A \\text{ and } B)$."], why: "$" + pa + " + " + pb + " - " + pab + " = " + u + "$." }; }
        if (t === 1) { var kind = R.pick(["heads", "six"]), n = kind === "heads" ? R.int(3, 6) : R.int(2, 3), p = kind === "heads" ? 1 - Math.pow(0.5, n) : 1 - Math.pow(5 / 6, n);
          var prompt = kind === "heads" ? "A fair coin is flipped " + n + " times. What is the probability of at least one head?" : "A fair die is rolled " + n + " times. What is the probability of at least one six?";
          return { type: "num", prompt: prompt + GENX, pre: "$P =$", answer: RD(p), tol: 0.0011, calc: true,
            near: near(RD(p), [{ v: RD(1 - p), tol: 0.0011, fb: "That is the probability of **none**. Subtract it from 1." }]), hints: ["Use the complement: $1 - P(\\text{none})$."], why: "$P = " + RD(p) + "$." }; }
        var m = R.int(3, 6), w = R.int(3, 6), r = 3, who = R.pick(["women", "men"]), fav = who === "women" ? w : m, pr = CHOOSE(fav, r) / CHOOSE(m + w, r);
        return { type: "num", prompt: "A committee of " + r + " is chosen at random from " + m + " men and " + w + " women. What is the probability that it is all " + who + "?" + GENX, pre: "$P =$", answer: RD(pr), tol: 0.0011, calc: true,
          near: near(RD(pr), [{ v: RD(fav / (m + w)), tol: 0.0011, fb: "Count committees with combinations: $\\frac{C(" + fav + ", " + r + ")}{C(" + (m + w) + ", " + r + ")}$." }]), hints: ["Favourable committees over all committees, both counted with $C(n, r)$."], why: "$P = " + RD(pr) + "$." };
      } }
  ];
  L.unit("precalc", 11, {
    title: "Sequences, Probability and Counting Theory",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Explicit and recursive formulas, and factorials.", skills: ["pc11-explicit", "pc11-recursive"], per: 3 },
      { title: "Quiz 2", after: 5, blurb: "Arithmetic sequences.", skills: ["pc11-arith", "pc11-arithn"], per: 3 },
      { title: "Quiz 3", after: 7, blurb: "Geometric sequences.", skills: ["pc11-geo", "pc11-geon"], per: 3 },
      { title: "Quiz 4", after: 9, blurb: "Summation notation and arithmetic series.", skills: ["pc11-sigma", "pc11-arithS"], per: 3 },
      { title: "Quiz 5", after: 11, blurb: "Geometric series, finite and infinite.", skills: ["pc11-geoS", "pc11-inf"], per: 3 },
      { title: "Quiz 6", after: 14, blurb: "The counting principles, permutations and combinations.", skills: ["pc11-count", "pc11-perm", "pc11-comb"], per: 2 },
      { title: "Quiz 7", after: 17, blurb: "The Binomial Theorem and probability.", skills: ["pc11-binom", "pc11-prob", "pc11-prob2"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:11", {
    2: { name: "Sequences and explicit formulas", frame: "A sequence is a list in a fixed [[order]]. An explicit formula such as $a_n = n^2 - 3$ gives the $n$th term directly: [[substitute]] $n = 1, 2, 3, \\dots$ A factor $(-1)^n$ makes the signs [[alternate]].",
         chips: ["random", "differentiate"], fb: { "random": "A sequence has a fixed order: the first term, the second term, and so on.", "differentiate": "Just substitute $n$ into the formula." } },
    3: { name: "Recursive formulas and factorials", frame: "A recursive formula gives the [[first term]] and a rule for each term from the [[previous]] one(s). $n! = n(n - 1)\\cdots 1$, and $0! =$ [[1]].",
         chips: ["last term", "0"], fb: { "last term": "A recursion starts from the **first** term and builds forwards.", "0": "$0! = 1$ by definition: the empty product." } },
    4: { name: "Arithmetic sequences", frame: "An arithmetic sequence adds the [[same]] number $d$ every step, the common [[difference]]. Check that [[every]] difference is equal. Recursively, $a_n = a_{n-1} + d$.",
         chips: ["ratio", "first"], fb: { "ratio": "The ratio belongs to geometric sequences. Here we subtract.", "first": "Check **every** difference, not only the first." } },
    5: { name: "The explicit formula of an arithmetic sequence", frame: "$a_n = a_1 +$ [[$(n - 1)d$]]: start at $a_1$ and take $n - 1$ steps of size $d$. For the number of terms, set $a_n$ equal to the last term and solve for [[$n$]].",
         chips: ["$nd$", "$d$"], fb: { "$nd$": "There are $n - 1$ steps between term 1 and term $n$, not $n$.", "$d$": "Solve for $n$: how many terms there are." } },
    6: { name: "Geometric sequences", frame: "A geometric sequence multiplies by the [[same]] number $r$, the common [[ratio]], found by dividing a term by the one [[before]] it. Recursively, $a_n = r\\,a_{n-1}$.",
         chips: ["difference", "after"], fb: { "difference": "A difference belongs to arithmetic sequences. Here we divide.", "after": "Divide a term by the one **before** it: later over earlier." } },
    7: { name: "The explicit formula of a geometric sequence", frame: "$a_n = a_1\\,$[[$r^{\\,n-1}$]]: multiply by $r$ a total of [[$n - 1$]] times. Given two terms, [[divide]] them to find a power of $r$.",
         chips: ["$r^n$", "subtract"], fb: { "$r^n$": "$a_1$ has no multiplication: the exponent is $n - 1$.", "subtract": "Dividing two terms gives a power of $r$." } },
    8: { name: "Summation notation", frame: "$\\sum_{k=a}^{b} f(k)$ means put $k = a, a + 1, \\dots, b$ into $f(k)$ and [[add]]. The number of terms is [[$b - a + 1$]]. The sum of a sequence is a [[series]].",
         chips: ["multiply", "$b - a$"], fb: { "multiply": "A sigma says to **add** the terms.", "$b - a$": "Count both ends: $b - a + 1$ terms." } },
    9: { name: "Arithmetic series", frame: "$S_n =$ [[$\\frac{n}{2}(a_1 + a_n)$]]: pair the first with the last, the second with the second-to-last, and so on. If $a_n$ is not given, use $a_n = a_1 + (n - 1)d$ [[first]].",
         chips: ["$n(a_1 + a_n)$", "last"], fb: { "$n(a_1 + a_n)$": "Do not forget to halve: each pair is counted from both ends.", "last": "You need $a_n$ **before** you can use the sum formula." } },
    10: { name: "Geometric series", frame: "$S_n = \\dfrac{a_1(1 - r^n)}{1 - r}$ for $r \\ne$ [[1]]. Find $a_1$ and $r$, count the [[terms]], then work out the power before the fraction.",
         chips: ["0", "sum"], fb: { "0": "$r = 1$ makes the denominator $1 - r$ zero: the formula needs $r \\ne 1$.", "sum": "Count the number of terms $n$." } },
    11: { name: "Infinite geometric series", frame: "An infinite geometric series has a sum only if [[$|r| < 1$]]; then $S = \\dfrac{a_1}{1 - r}$. If $|r| \\ge 1$ the sum is [[not defined]]. A repeating decimal is an infinite geometric series, so it equals a [[fraction]].",
         chips: ["$|r| > 1$", "always defined"], fb: { "$|r| > 1$": "The terms must shrink: $|r| < 1$.", "always defined": "Terms that do not shrink give totals that grow or bounce about." } },
    12: { name: "The counting principles", frame: "Choices made one after another [[multiply]]: $m \\times n$. If you choose [[either]] one of two groups that cannot overlap, you [[add]]: $m + n$.",
         chips: ["subtract", "both"], fb: { "subtract": "Counting choices multiply or add: they do not subtract.", "both": "Choosing **both** multiplies; choosing **either** adds." } },
    13: { name: "Permutations", frame: "When [[order]] matters, arranging $r$ of $n$ different things gives $P(n, r) =$ [[$\\frac{n!}{(n - r)!}$]]. If some items are identical, [[divide]] by the factorial of each repeat count.",
         chips: ["groups", "multiply"], fb: { "groups": "Groups (where order does not matter) are combinations.", "multiply": "Identical items are counted too often, so we divide." } },
    14: { name: "Combinations and subsets", frame: "When order does [[not]] matter, $C(n, r) =$ [[$\\frac{n!}{r!\\,(n - r)!}$]]. A set of $n$ elements has [[$2^n$]] subsets.",
         chips: ["$n^2$", "$\\frac{n!}{(n - r)!}$"], fb: { "$n^2$": "Each element is in or out: $2 \\cdot 2 \\cdots 2 = 2^n$.", "$\\frac{n!}{(n - r)!}$": "That counts ordered arrangements, $P(n, r)$. Divide by $r!$ for $C(n, r)$." } },
    15: { name: "The Binomial Theorem", frame: "$(x + y)^n = \\sum C(n, k)\\,x^{n-k}y^k$. The coefficients are row $n$ of [[Pascal's triangle]]; the powers of $x$ [[fall]] and those of $y$ [[rise]]. The coefficients of row $n$ add to $2^n$.",
         chips: ["Euler's", "stay the same"], fb: { "Euler's": "Pascal's triangle gives the binomial coefficients.", "stay the same": "The powers of $x$ and $y$ trade off: one falls as the other rises." } },
    16: { name: "Probability of equally likely outcomes", frame: "When outcomes are equally likely, $P(E) =$ [[$\\frac{\\text{favourable}}{\\text{total}}$]]. A probability is between [[0]] and [[1]]. Count the [[total]] outcomes first.",
         chips: ["$\\frac{\\text{total}}{\\text{favourable}}$", "100"], fb: { "$\\frac{\\text{total}}{\\text{favourable}}$": "It is favourable **over** total.", "100": "A probability runs from 0 to 1 (or 0% to 100%)." } },
    17: { name: "Union, complement and counting", frame: "$P(A \\text{ or } B) = P(A) + P(B) -$ [[$P(A \\text{ and } B)$]], so the overlap is not counted [[twice]]. The complement: $P(\\text{not } A) =$ [[$1 - P(A)$]].",
         chips: ["$P(A) \\cdot P(B)$", "once"], fb: { "$P(A) \\cdot P(B)$": "That is for independent events happening together, not for \"or\".", "once": "Adding both counts the overlap **twice**; subtracting once fixes it." } }
  });
})();
