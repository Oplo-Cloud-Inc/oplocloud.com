/* ==========================================================================
   Precalculus — Unit 1: Functions. See lab/core.js for the format.

   Follows OpenStax Precalculus 2e, Chapter 1: functions and function
   notation, domain and range, rates of change and the behaviour of graphs,
   composition, transformations, absolute value, and inverse functions.
   Each section is split into lessons small enough to finish in one sitting.
   Every lesson teaches one method: the idea, an example to watch (the
   picture builds up beside it, a line at a time), one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

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
    var u0 = o.u || 22, W0 = (xr[1] - xr[0]) * u0 + 48, H0 = (yr[1] - yr[0]) * u0 + 48;
    return { type: "sketch", x: xr, y: yr, u: u0, w: o.w || Math.min(480, Math.round(360 * W0 / H0)), gate: true, pts: {}, params: o.params, chips: o.keys.length > 1 ? chips : undefined, gx: o.gx, gy: o.gy, step: o.step, stepY: o.stepY,
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
  // The keys under an expression answer.
  var KEYS_POLY = [["$x$", "x"], ["$x^2$", "x^2"], ["$x^3$", "x^3"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]];
  var LESSONS = [];
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Five quick checks", art: "ready",
    tag: "Ready?",
    blurb: "Before Chapter 1 · Evaluate an expression, solve an equation, solve for a letter, plot a point, and graph an inequality.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Evaluate", prompt: "Evaluate $2x^2 - 3x + 1$ when $x = -2$.", answer: 15, skill: "Evaluate an expression",
        near: [{ v: 23, fb: "Only the $-2$ is squared: $2(-2)^2 = 2 \\cdot 4 = 8$, not $(2 \\cdot -2)^2$." }, { v: 3, fb: "$-3x$ is $-3(-2) = +6$." }, { v: -1, fb: "$(-2)^2 = +4$: a square is never negative." }],
        hints: ["$2(-2)^2 - 3(-2) + 1$."], why: "$2(4) + 6 + 1 = 15$." },
      { type: "num", kicker: "Check 2 · Solve", prompt: "Solve $3x - 4 = 11$.", pre: "$x =$", answer: 5, skill: "Solve a linear equation",
        near: [{ v: 7 / 3, fb: "Add 4 to both sides first: $3x = 15$." }, { v: 15, fb: "That is $3x$. Divide by 3 as the last step." }],
        hints: ["Undo the $-4$, then undo the $\\times 3$."], why: "$3x = 15$, so $x = 5$." },
      { type: "choice", kicker: "Check 3 · Solve for a letter", prompt: "Solve $2x + 4y = 12$ for $y$.",
        options: [{ t: "$y = 3 - \\frac{x}{2}$" }, { t: "$y = 12 - 2x$", fb: "Divide every term by 4, not only the 12." }, { t: "$y = 3 + \\frac{x}{2}$", fb: "Subtracting $2x$ makes it $-2x$ on the right." }],
        answer: 0, skill: "Solve a formula", hints: ["Subtract $2x$, then divide each term by 4."], why: "$4y = 12 - 2x$, so $y = 3 - \\frac{x}{2}$." },
      { type: "plane", kicker: "Check 4 · The grid", prompt: "Click the point $(-3, 2)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [-3, 2] }, skill: "Plot a point",
        clickFb: function (c) { return c && c[0] === 2 && c[1] === -3 ? "That is $(2, -3)$. The first number is $x$: across." : "The first number is $x$ (across), the second is $y$ (up or down)."; },
        hints: ["Go 3 to the left, then 2 up."], why: "3 left, 2 up." },
      { type: "numberline", kicker: "Check 5 · Inequalities", prompt: "Graph $x \\ge 1$.",
        min: -6, max: 6, mode: "ray", variable: "x", ray: { at: 3, dir: "left", closed: false },
        answer: { at: 1, dir: "right", closed: true }, skill: "Graph an inequality",
        hints: ["Is $1$ itself a solution? Which way are the larger numbers?"], why: "A filled circle at $1$, shaded to the right." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 1.1**. If **check 1 or 2** slipped, Algebra I's first unit has the practice. If **check 4** slipped, lesson 1.3 starts with the grid.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ==================================================== 1 · What is a function? */
  var HOW_1 = [["Inputs", "List the inputs: the first number of each pair."],
               ["Outputs", "List the outputs: the second number of each pair."],
               ["Check", "Does any input have more than one output? If none does, it is a function."]];
  var W1 = ["1", "2", "3", "4"], W1O = ["2", "4", "6", "8"], W1P = [[0, 0], [1, 1], [2, 2], [3, 3]];
  var CAFE = ["Tea", "Juice", "Soup"];
  LESSONS.push({
    title: "What is a function?", art: "fxrel",
    blurb: "Book 1.1 · Inputs, outputs, and the one rule that makes a relation a function.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In the pair $(3, 7)$, which number is the **input** and which is the **output**?",
        options: [{ t: "Input $3$, output $7$" }, { t: "Input $7$, output $3$", fb: "A pair is written (input, output). The input comes first." }, { t: "Both are inputs", fb: "Each pair has one of each: something you put in, and what comes out." }],
        answer: 0, skill: "Ordered pairs", hints: ["Think of $(x, y)$: which letter is the input?"], why: "In $(x, y)$ the first number is the input $x$ and the second is the output $y$." },
      { type: "learn", kicker: "Explore",
        prompt: "Draw arrows from inputs to outputs: tap an input, then an output. Make a diagram where **every input has one arrow**. Then make one where an input has **two**.",
        scene: { type: "sketch", x: [-3.7, 3.7], y: [-2.9, 2.9], u: 31, grid: false, gate: true, w: 390,
          pts: {},
          taps: { i1: { at: [-2.1, 1.1], label: "1", c: "blue", say: "Input 1" }, i2: { at: [-2.1, 0], label: "2", c: "blue", say: "Input 2" }, i3: { at: [-2.1, -1.1], label: "3", c: "blue", say: "Input 3" },
                  o4: { at: [2.1, 1.1], label: "4", c: "orange", say: "Output 4" }, o5: { at: [2.1, 0], label: "5", c: "orange", say: "Output 5" }, o6: { at: [2.1, -1.1], label: "6", c: "orange", say: "Output 6" } },
          maxSel: 2,
          track: function (s) {
            var a = s.arrows || [], c = {};
            a.forEach(function (p) { c[p[0]] = (c[p[0]] || 0) + 1; });
            if (Object.keys(c).some(function (k) { return c[k] > 1; })) return "notfn";
            return ["i1", "i2", "i3"].every(function (k) { return c[k] === 1; }) ? "fn" : null;
          },
          draw: function (s) {
            s.arrows = s.arrows || [];
            if (s.selList.length === 2) {
              var a = s.selList[0], b = s.selList[1], inn = a[0] === "i" ? a : b[0] === "i" ? b : null, out = a[0] === "o" ? a : b[0] === "o" ? b : null;
              if (inn && out) {
                var at = -1; s.arrows.forEach(function (p, i) { if (p[0] === inn && p[1] === out) at = i; });
                if (at > -1) s.arrows.splice(at, 1); else s.arrows.push([inn, out]);
                s.sel = {}; s.selList = [];
              } else { var keep = s.selList[1]; s.sel = {}; s.sel[keep] = true; s.selList = [keep]; }
            }
            var Y = { i1: 1.1, i2: 0, i3: -1.1, o4: 1.1, o5: 0, o6: -1.1 };
            var items = [{ ell: [[-2.1, 0], 0.8, 1.9], c: "blue" }, { ell: [[2.1, 0], 0.8, 1.9], c: "orange" }, { word: "inputs", at: [-2.1, 2.45], c: "blue" }, { word: "outputs", at: [2.1, 2.45], c: "orange" }];
            s.arrows.forEach(function (p) { items.push({ arrow: [[-1.5, Y[p[0]]], [1.5, Y[p[1]]]], c: "ink" }); });
            return items;
          },
          readout: function (s) {
            var a = s.arrows || [], c = {};
            a.forEach(function (p) { c[p[0]] = (c[p[0]] || 0) + 1; });
            var two = Object.keys(c).filter(function (k) { return c[k] > 1; }), all1 = ["i1", "i2", "i3"].every(function (k) { return c[k] === 1; });
            var found = (s.tracked.fn || all1 ? "✓ " : "· ") + "every input has one arrow &nbsp;&nbsp; " + (s.tracked.notfn || two.length ? "✓ " : "· ") + "an input with two arrows";
            if (!a.length) return "Tap an input, then an output.<br>" + found;
            if (two.length) return "**Not a function.** Input " + two[0].slice(1) + " has two arrows: it would not know which output to give.<br>" + found;
            if (all1) return "**A function.** Every input has exactly one arrow. (Two inputs may share an output.)<br>" + found;
            return "So far no input has two arrows, but some input has none yet.<br>" + found;
          },
          goal: function (s) {
            var c = {}; (s.arrows || []).forEach(function (p) { c[p[0]] = (c[p[0]] || 0) + 1; });
            var fn = ["i1", "i2", "i3"].every(function (k) { return c[k] === 1; }), bad = Object.keys(c).some(function (k) { return c[k] > 1; });
            return (s.tracked.fn || fn) && (s.tracked.notfn || bad);
          } },
        gate: true, then: "One arrow from each input: a **function**. Two arrows from one input: not a function, because the output would be a guess." },
      { type: "learn", kicker: "The idea",
        prompt: "A **relation** is any set of pairs (input, output). A **function** is a relation in which each input has **exactly one** output. The inputs are the **domain**; the outputs are the **range**.",
        scene: { type: "method", how: HOW_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Is this relation a function? Watch: $(1, 2),\\ (2, 4),\\ (3, 6),\\ (4, 8)$.",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\text{inputs: } 1, 2, 3, 4", say: "The first number of each pair. Together they are the **domain**.", fig: mapfig("The inputs 1, 2, 3 and 4 in a blue oval.", W1, W1O, W1P, { outs: false }) },
          { step: 2, m: "\\text{outputs: } 2, 4, 6, 8", say: "The second numbers. Together they are the **range**.",
            fig: mapfig("The inputs on the left and the outputs 2, 4, 6, 8 on the right, not yet joined.", W1, W1O, W1P, { arrows: false }),
            ask: { prompt: "Which numbers are the outputs?", answer: 0,
                   options: [{ t: "$2, 4, 6, 8$" }, { t: "$1, 2, 3, 4$", fb: "Those are the inputs: the first numbers." }, { t: "$1, 2, 4, 6, 8$", fb: "Only the second number of each pair is an output." }] } },
          { step: 3, m: "1 \\to 2 \\quad 2 \\to 4 \\quad 3 \\to 6 \\quad 4 \\to 8", say: "Draw the arrows. Each input has exactly one leaving it.", fig: mapfig("Each input has one arrow: 1 to 2, 2 to 4, 3 to 6, 4 to 8.", W1, W1O, W1P) },
          { step: 3, m: "\\text{a function}", say: "No input has two outputs." }] },
        gate: true, then: "No input is used twice with different outputs, so the relation is a **function**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide each step: $(1, 5),\\ (2, 7),\\ (2, 9),\\ (3, 6)$.",
        how: HOW_1, skill: "Relations and functions",
        steps: [
          { step: 1, ask: "What are the inputs? List each one once.", type: "choice", answer: 0,
            options: [{ t: "$1, 2, 3$" }, { t: "$5, 6, 7, 9$", fb: "Those are the second numbers: the outputs." }, { t: "$1, 2, 2, 3$", fb: "List each input once: 2 appears in two pairs but is one input." }],
            m: "\\text{inputs: } 1, 2, 3", say: "The first numbers, each listed once." },
          { step: 2, ask: "What are the outputs?", type: "choice", answer: 0,
            options: [{ t: "$5, 6, 7, 9$" }, { t: "$1, 2, 3$", fb: "Those are the inputs." }],
            m: "\\text{outputs: } 5, 6, 7, 9", say: "The second numbers." },
          { step: 3, ask: "Does any input have two outputs?", type: "choice", answer: 0,
            options: [{ t: "Yes: $2 \\to 7$ and $2 \\to 9$" }, { t: "No", fb: "Look at the input 2: it is paired with 7 and also with 9." }],
            m: "2 \\to 7 \\quad\\text{and}\\quad 2 \\to 9", say: "One input, two different outputs." },
          { step: 3, ask: "So is it a function?", type: "choice", answer: 0,
            options: [{ t: "No" }, { t: "Yes", fb: "A function needs exactly one output for each input. The input 2 has two." }],
            m: "\\text{not a function}", say: "A single input with two outputs breaks the rule." }],
        why: "Inputs, outputs, check. Now sort some relations on your own." },
      { type: "sort", kicker: "On your own", prompt: "Function, or not a function?",
        bins: ["Function", "Not a function"],
        cards: [{ t: "$(0, 1),\\ (1, 1),\\ (2, 1)$", bin: 0, fb: "Every input is different, so each has one output. Outputs may repeat." },
                { t: "$(3, 1),\\ (3, 2),\\ (4, 5)$", bin: 1, fb: "The input 3 has two outputs: 1 and 2." },
                { t: "Each person → their birthday", bin: 0, fb: "A person has exactly one birthday." },
                { t: "A birthday → the people born that day", bin: 1, fb: "Many people can share a birthday: one input, many outputs." },
                { t: "A square's side → its area", bin: 0, fb: "A side of 3 gives an area of 9, every time." }],
        skill: "Relations and functions", hints: ["Look for one input that leads to two different outputs."],
        why: "Only one thing is forbidden: the same input leading to two different outputs." },
      { type: "learn", kicker: "A harder case",
        prompt: "Swap the roles. A café sells tea and juice for 3 dollars each, and soup for 5. Is the **item** a function of the **price**?",
        scene: { type: "walk", how: HOW_1, rows: [
          { step: 1, m: "\\text{inputs: the prices } 3, 5", say: "Now the price goes in, and we ask for the item.", fig: mapfig("The prices 3 and 5 in a blue oval.", ["3", "5"], CAFE, [[0, 0], [0, 1], [1, 2]], { outs: false, inName: "price" }) },
          { step: 2, m: "\\text{outputs: Tea, Juice, Soup}", say: "The items are the outputs.", fig: mapfig("The prices on the left and the items on the right.", ["3", "5"], CAFE, [[0, 0], [0, 1], [1, 2]], { arrows: false, inName: "price", outName: "item" }) },
          { step: 3, m: "3 \\to \\text{Tea} \\quad\\text{and}\\quad 3 \\to \\text{Juice}", say: "The input 3 has two outputs.", fig: mapfig("The price 3 has arrows to both Tea and Juice. The price 5 has an arrow to Soup.", ["3", "5"], CAFE, [[0, 0], [0, 1], [1, 2]], { hot: [0, 1], inName: "price", outName: "item" }) },
          { step: 3, m: "\\text{not a function}", say: "Price tells you the item only if no two items share it. Item does tell you the price." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "On a test, Ana scored 90, Ben 85 and Cy 90. Which statement is true?",
        options: [{ t: "The score is a function of the student, but the student is not a function of the score." }, { t: "Both are functions.", fb: "A score of 90 leads to two students: Ana and Cy." }, { t: "Neither is a function.", fb: "Each student has exactly one score, so score is a function of student." }],
        answer: 0, skill: "Relations and functions", hints: ["Which direction has an input with two outputs?"], why: "Student → score: one score each. Score → student: 90 leads to Ana and to Cy." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says: “$(1, 3),\\ (2, 3),\\ (3, 3)$ is **not** a function, because the output 3 appears three times.” What is wrong?",
        options: [{ t: "Outputs may repeat. A function only forbids one **input** having two outputs." }, { t: "Nothing: repeated outputs break the rule.", fb: "Repeated outputs are fine: every input here still has exactly one output." }, { t: "The inputs repeat.", fb: "The inputs are 1, 2 and 3: all different." }],
        answer: 0, skill: "Relations and functions", hints: ["Which of the two numbers in a pair must not repeat with a different partner?"], why: "Each input (1, 2, 3) has exactly one output (3). Many inputs may share one output." },
      { type: "choice", kicker: "Use it", prompt: "A bus fare depends on age: under 12 pays \\$2, ages 12 to 64 pay \\$3, and 65 or over pays \\$1. Is the **age** a function of the **fare**?",
        options: [{ t: "No: the fare \\$3 goes with many ages." }, { t: "Yes: every fare has one age.", fb: "A 20-year-old and a 40-year-old both pay \\$3: one input, many outputs." }],
        answer: 0, skill: "Relations and functions", hints: ["Try the input \\$3: how many ages pay it?"], why: "Fare is a function of age, but not the other way round." }
    ]
  });
  /* ======================================================= 2 · Function notation */
  var HOW_2 = [["Read", "Read the rule: $f(x)$ says what to do with the input $x$."],
               ["Substitute", "Replace every $x$ in the rule with the input, in brackets."],
               ["Calculate", "Work out the result, one operation at a time. That is the output."]];
  var QF = function (x) { return x * x - 2; };
  LESSONS.push({
    title: "Function notation", art: "pcfx",
    blurb: "Book 1.1 · $f(x)$ is a name for the output; evaluate it by substituting the input.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $3x + 2$ when $x = 4$.", answer: 14, skill: "Evaluate an expression",
        near: [{ v: 18, fb: "That is $3 \\cdot 4 + 6$. Multiply, then add the 2." }, { v: 9, fb: "$3x$ means $3$ times $x$, not $3 + x$." }],
        hints: ["Put 4 where $x$ is: $3(4) + 2$."], why: "$3(4) + 2 = 12 + 2 = 14$." },
      { type: "learn", kicker: "Explore",
        prompt: "The rule is $f(x) = x^2 - 2$. Slide the point along the graph. Find **both** inputs whose output is $-1$.",
        scene: slide(QF, { x: [-4, 4], y: [-3, 7], u: 30, from: 0, snap: 1, xlim: [-3, 3],
          track: function (s) { return s.P[1] === -1 ? "x" + s.P[0] : null; },
          goal: function (s) { return s.tracked.x1 && s.tracked["x-1"]; },
          read: function (x, y, s) { return "$f(" + nm(x) + ") = " + nm(y) + "$" + "<br>" + (s.tracked["x-1"] ? "✓ " : "· ") + "one input with output $-1$ &nbsp;&nbsp; " + (s.tracked.x1 ? "✓ " : "· ") + "the other"; } }),
        gate: true, then: "$f(1) = -1$ and $f(-1) = -1$. The notation $f(x)$ is just a name for the height of the graph above $x$." },
      { type: "learn", kicker: "The idea",
        prompt: "$f(x)$ is read “$f$ of $x$”. It is the **output** when the input is $x$. The brackets hold the input; they do **not** mean multiply. To find $f(4)$, put 4 in place of every $x$.",
        scene: { type: "method", how: HOW_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Let $f(x) = 2x + 3$. Watch $f(4)$ found.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "f(x) = 2x + 3", say: "The rule: double the input, then add 3.", fig: machfig("A machine that doubles the input and adds 3.", "x", "2x + 3", "f(x)") },
          { step: 2, m: "f(4) = 2(4) + 3", say: "Put 4 in place of $x$, in brackets.", fig: machfig("The input 4 goes into the machine.", "4", "2(4) + 3", "?"),
            ask: { prompt: "In $f(4)$, what replaces $x$?", answer: 0,
                   options: [{ t: "$4$" }, { t: "$f$", fb: "$f$ is the name of the rule. The input is the number in brackets." }, { t: "$4x$", fb: "The brackets do not multiply. They hold the input." }] } },
          { step: 3, m: "f(4) = 8 + 3", say: "Multiply first: $2(4) = 8$.", fig: machfig("The machine doubles 4 to get 8, then adds 3.", "4", "8 + 3", "?") },
          { step: 3, m: "f(4) = 11", say: "The output for the input 4 is 11.", fig: machfig("The input 4 comes out as 11.", "4", "2x + 3", "11") }] },
        gate: true, then: "So $f(4) = 11$: **input 4, output 11**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. Let $g(x) = x^2 - 2x$. Find $g(-3)$.",
        how: HOW_2, skill: "Evaluate a function",
        steps: [
          { step: 1, ask: "What does $g$ do to its input $x$?", type: "choice", answer: 0,
            options: [{ t: "Squares it, then subtracts twice the input" }, { t: "Squares it, then subtracts 2", fb: "The $-2x$ term is twice the input, not the number 2." }],
            m: "g(x) = x^2 - 2x", say: "Square the input, then take away twice the input." },
          { step: 2, ask: "Which line puts $-3$ into the rule?", type: "choice", answer: 0,
            options: [{ t: "$g(-3) = (-3)^2 - 2(-3)$" }, { t: "$g(-3) = -3^2 - 2(-3)$", fb: "$-3^2$ means $-(3^2)$. Put the whole $-3$ in brackets." }],
            m: "g(-3) = (-3)^2 - 2(-3)", say: "A negative input goes in brackets." },
          { step: 3, ask: "Work it out: $(-3)^2 - 2(-3)$.", type: "num", pre: "$g(-3) =$", answer: 15,
            near: [{ v: 3, fb: "$-2(-3)$ is $+6$: two negatives make a positive." }, { v: -15, fb: "$(-3)^2 = +9$, and $-2(-3) = +6$." }], hint: "$9 + 6$.",
            m: "g(-3) = 9 + 6 = 15", say: "$(-3)^2 = 9$ and $-2(-3) = +6$." }],
        why: "Read the rule, substitute in brackets, calculate. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Let $h(x) = 4 - x^2$. Find $h(3)$.", pre: "$h(3) =$", answer: -5, skill: "Evaluate a function",
        near: [{ v: 7, fb: "Square first: $3^2 = 9$, then $4 - 9$." }, { v: 13, fb: "It is $4 - 9$, not $4 + 9$." }],
        hints: ["Step 2: $h(3) = 4 - (3)^2$."], why: "$h(3) = 4 - 9 = -5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The input can be a whole expression. Let $f(x) = 2x + 3$. Find $f(a + 1)$.",
        scene: { type: "walk", how: HOW_2, rows: [
          { step: 1, m: "f(x) = 2x + 3", say: "The same rule as before." },
          { step: 2, m: "f(a + 1) = 2(a + 1) + 3", say: "The whole input $a + 1$ goes where $x$ was. Keep it in brackets.",
            ask: { prompt: "What goes in place of $x$ in $f(a + 1)$?", answer: 0,
                   options: [{ t: "all of $a + 1$, in brackets" }, { t: "only the $a$", fb: "The input is everything inside the brackets of $f(\\;)$." }] } },
          { step: 3, m: "f(a + 1) = 2a + 2 + 3", say: "Multiply out: $2(a + 1) = 2a + 2$." },
          { step: 3, m: "f(a + 1) = 2a + 5", say: "Add the numbers." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Let $f(x) = x^2 - 4$. What is $f(t + 1)$?",
        options: [{ t: "$t^2 + 2t - 3$" }, { t: "$t^2 - 3$", fb: "$(t + 1)^2$ is not $t^2 + 1$. It also has a middle term, $2t$." }, { t: "$t + 1 - 4$", fb: "The input is squared first: $(t + 1)^2$." }],
        answer: 0, skill: "Evaluate a function", hints: ["$(t + 1)^2 - 4$, then multiply out."], why: "$(t + 1)^2 - 4 = t^2 + 2t + 1 - 4 = t^2 + 2t - 3$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Sam finds $f(3)$ for $f(x) = x^2 - 4x$. Tap the line where the work **first** goes wrong.",
        lines: ["f(x) = x^2 - 4x", "f(3) = 3^2 - 4(3)", "f(3) = 6 - 12", "f(3) = -6"], answer: 2, fix: "f(3) = 9 - 12",
        fb: { 0: GIVEN, 1: "Substituting 3 for $x$ is right.", 3: LATER }, skill: "Evaluate a function",
        hints: ["Check $3^2$."], why: "$3^2 = 9$, not 6. So $f(3) = 9 - 12 = -3$." },
      { type: "num", kicker: "Use it", prompt: "A ball thrown upwards is $h(t) = -5t^2 + 20t$ metres high after $t$ seconds. How high is it after 2 seconds?", pre: "$h(2) =$", post: "metres", answer: 20, skill: "Evaluate a function",
        near: [{ v: 60, fb: "$-5(2)^2 = -20$: the squared term is negative." }, { v: -60, fb: "$-5(4) + 40$: the second term is $+40$." }],
        hints: ["$h(2) = -5(2)^2 + 20(2)$."], why: "$-5(4) + 40 = -20 + 40 = 20$ metres." }
    ]
  });

  /* ================================================ 3 · Reading tables and graphs */
  var HOW_3 = [["Locate", "Find the number you were given: an input on the horizontal axis, or in the $x$ row of a table."],
               ["Move", "Go straight up or down to the graph, or along the row of the table."],
               ["Read", "Read the matching number on the other axis. That is the output."]];
  var CUB = function (x) { return (x * x * x - 3 * x) / 2 + 2; };
  var WC = { x: [-3.5, 3.5], y: [-1.5, 6.5] }, CUBC = curve(CUB, -3.5, 3.5, "blue", [-1.5, 6.5]);
  var G3 = [[-2, 1], [-1, 4], [0, 2], [1, 4], [2, 6]];
  LESSONS.push({
    title: "Reading tables and graphs", art: "fxread",
    blurb: "Book 1.1 · Find $f(a)$ from a table or a graph, and find the inputs that give a chosen output.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The point $(2, 5)$ is on a graph. How high is the graph above $x = 2$?", answer: 5, skill: "Plot a point",
        near: [{ v: 2, fb: "2 is how far across. The height is the second number." }], hints: ["The second number of $(x, y)$ is the height."], why: "The point $(2, 5)$ is 5 up." },
      { type: "learn", kicker: "Explore",
        prompt: "Here is the graph of $f$. Slide the point. Find **every** input whose output is 3.",
        scene: slide(CUB, { x: [-4, 4], y: [-1.5, 6.5], u: 36, from: 0, snap: 1, xlim: [-2, 2],
          track: function (s) { return s.P[1] === 3 ? "x" + s.P[0] : null; },
          goal: function (s) { return s.tracked.x2 && s.tracked["x-1"]; },
          read: function (x, y, s) { return "$f(" + nm(x) + ") = " + nm(y) + "$<br>" + (s.tracked["x-1"] ? "✓ " : "· ") + "one input with output 3 &nbsp;&nbsp; " + (s.tracked.x2 ? "✓ " : "· ") + "the other"; } }),
        gate: true, then: "$f(-1) = 3$ and $f(2) = 3$. **Two different inputs can have the same output**: a graph can be at one height in more than one place." },
      { type: "learn", kicker: "The idea",
        prompt: "A graph is a table you can see. Each point $(a, f(a))$ pairs an **input** (across) with its **output** (height). Find $f(a)$ by going to $a$ on the horizontal axis, up to the graph, then across.",
        scene: { type: "method", how: HOW_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $f(2)$ read off the graph.",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "x = 2", say: "Find the input 2 on the horizontal axis.", fig: grid("The graph of f with the input 2 marked on the horizontal axis.", CUBC.concat([dot(2, 0, "orange", "2", "s")]), WC) },
          { step: 2, m: "\\text{up from } x = 2", say: "Go straight up until you meet the curve.", fig: grid("A dashed line goes up from 2 to the curve.", CUBC.concat([{ seg: [[2, 0], [2, 3]], c: "orange", dash: true }, dot(2, 0, "orange"), dot(2, 3, "blue")]), WC) },
          { step: 3, m: "\\text{across to the } y\\text{-axis}", say: "Now go straight across to the vertical axis.", fig: grid("A dashed line goes across from the curve to the vertical axis at 3.", CUBC.concat([{ seg: [[2, 0], [2, 3]], c: "orange", dash: true }, { seg: [[2, 3], [0, 3]], c: "orange", dash: true }, dot(2, 0, "orange"), dot(2, 3, "blue"), dot(0, 3, "orange", "3", "w")]), WC),
            ask: { prompt: "Which number do you read on the vertical axis?", answer: 0, options: [{ t: "$3$" }, { t: "$2$", fb: "2 is the input you started with. The output is the height." }, { t: "$-1$", fb: "That is a different input with the same output. Read the axis." }] } },
          { step: 3, m: "f(2) = 3", say: "The output for the input 2 is 3." }] },
        gate: true, then: "Locate the input, move to the graph, read the output." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do the same with a table. $g$ is given by:" + tbl(["$x$", "$g(x)$"], [[-2, 1], [-1, 4], [0, 2], [1, 4], [2, 6]]) + "Find $g(2)$.",
        how: HOW_3, skill: "Read a table or graph",
        steps: [
          { step: 1, ask: "Which column holds the input $x = 2$?", type: "choice", answer: 0,
            options: [{ t: "The last column, where $x = 2$" }, { t: "The first column, where $x = -2$", fb: "$x = -2$ is the input $-2$, not 2." }],
            m: "x = 2", say: "Find 2 in the $x$ row." },
          { step: 2, ask: "Move down from $x = 2$ to the $g(x)$ row. What do you see?", type: "num", pre: "$g(2) =$", answer: 6, near: [{ v: 2, fb: "2 is the input. Read the $g(x)$ row." }], hint: "Same column, other row.",
            m: "g(2) = 6", say: "The output is in the same column." },
          { step: 3, ask: "Now the other way: which input has the output $2$?", type: "num", pre: "$x =$", answer: 0, near: [{ v: 2, fb: "$g(2) = 6$. Look for the column where $g(x)$ is 2." }], hint: "Find 2 in the $g(x)$ row.",
            m: "g(0) = 2", say: "Find 2 in the output row, then read its input: $x = 0$." }],
        why: "Locate, move, read. Now try a graph on your own." },
      { type: "num", kicker: "On your own", prompt: "Use the graph of $f$. What is $f(-1)$?", art: grid("The graph of f.", CUBC, WC),
        pre: "$f(-1) =$", answer: 3, skill: "Read a table or graph", near: [{ v: -1, fb: "$-1$ is the input. The output is how high the graph is there." }],
        hints: ["Find $-1$ on the horizontal axis, go up to the curve, then across."], why: "Above $x = -1$ the curve is at height 3." },
      { type: "multi", prompt: "Use the graph of $f$. Which inputs give the output $2$?", art: grid("The graph of f.", CUBC, WC),
        options: [{ t: "$0$", ok: true }, { t: "$-1$", fb: "$f(-1) = 3$, not 2." }, { t: "$1$", fb: "$f(1) = 1$, not 2." }, { t: "$2$", fb: "$f(2) = 3$, not 2." }],
        skill: "Read a table or graph", hints: ["Start at height 2 on the vertical axis and go across."], why: "Only $x = 0$ has $f(0) = 2$ among these." },
      { type: "learn", kicker: "A harder case",
        prompt: "Now go **backwards**: start from an output. For which inputs is $f(x) = 1$?",
        scene: { type: "walk", how: HOW_3, rows: [
          { step: 1, m: "f(x) = 1", say: "Start on the vertical axis at height 1.", fig: grid("The graph of f with height 1 marked on the vertical axis.", CUBC.concat([dot(0, 1, "orange", "1", "w")]), WC) },
          { step: 2, m: "\\text{across to the curve}", say: "Go straight across. The line meets the curve in **two** places.", fig: grid("A dashed line at height 1 meets the curve at -2 and at 1.", CUBC.concat([{ seg: [[-3.5, 1], [3.5, 1]], c: "orange", dash: true }, dot(-2, 1, "blue"), dot(1, 1, "blue"), dot(0, 1, "orange", "1", "w")]), WC),
            ask: { prompt: "How many inputs will we find?", answer: 0, options: [{ t: "Two: one for each place the line meets the curve" }, { t: "One", fb: "Count the places where the dashed line crosses or touches the curve." }] } },
          { step: 3, m: "x = -2 \\quad\\text{and}\\quad x = 1", say: "Drop down from each meeting point to read its input.", fig: grid("Dashed lines drop from both points to the inputs -2 and 1.", CUBC.concat([{ seg: [[-3.5, 1], [3.5, 1]], c: "orange", dash: true }, { seg: [[-2, 1], [-2, 0]], c: "orange", dash: true }, { seg: [[1, 1], [1, 0]], c: "orange", dash: true }, dot(-2, 1, "blue"), dot(1, 1, "blue"), dot(-2, 0, "orange", "-2", "s"), dot(1, 0, "orange", "1", "s")]), WC) }] },
        gate: true, then: "$f(-2) = 1$ and $f(1) = 1$. A table or graph can answer both questions: **what is $f(a)$?** and **where is $f(x) = k$?**" },
      { type: "num", kicker: "Try it", prompt: "Using the table for $g$, find $g(1) + g(2)$." + tbl(["$x$", "$g(x)$"], [[-2, 1], [-1, 4], [0, 2], [1, 4], [2, 6]]), answer: 10, skill: "Read a table or graph",
        near: [{ v: 3, fb: "Those are the inputs $1 + 2$. Add the outputs." }, { v: 8, fb: "$g(1) = 4$ and $g(2) = 6$." }],
        hints: ["Read $g(1)$ and $g(2)$ separately, then add."], why: "$g(1) = 4$ and $g(2) = 6$, so the sum is 10." },
      { type: "choice", kicker: "Find the error",
        prompt: "To find $f(2)$ on a graph, Lena starts at **height 2** on the vertical axis and goes across to the curve. What did she do wrong?",
        options: [{ t: "The 2 in $f(2)$ is an **input**: she should start at $x = 2$ on the horizontal axis." }, { t: "Nothing: that is how you find $f(2)$.", fb: "Starting from a height finds *which input* gives that output. $f(2)$ starts from the input 2." }, { t: "She should have gone down, not across.", fb: "The direction is not the problem. The starting point is." }],
        answer: 0, skill: "Read a table or graph", hints: ["What does the number inside the brackets of $f(\\;)$ mean?"], why: "Start at the input 2 on the horizontal axis, go up to the curve, then across to read the output." },
      { type: "num", kicker: "Use it", prompt: "A phone's battery charge is $B(t)$ per cent after $t$ hours." + tbl(["$t$", "$B(t)$"], [[0, 100], [1, 85], [2, 70], [3, 55]]) + "After how many hours is the charge 70 per cent?", pre: "$t =$", post: "hours", answer: 2, skill: "Read a table or graph",
        near: [{ v: 70, fb: "70 is the charge: an output. Find the input that gives it." }],
        hints: ["Find 70 in the $B(t)$ row, then read its $t$."], why: "$B(2) = 70$, so $t = 2$ hours." }
    ]
  });

  /* ================================================ 4 · One-to-one: the line tests */
  var HOW_4 = [["Slide", "Slide a vertical line across the graph, then a horizontal line."],
               ["Count", "Count how many times the line meets the graph."],
               ["Decide", "A vertical line meeting it twice: not a function. A horizontal line meeting a function twice: not one-to-one."]];
  var LT = {
    a: { cv: function () { return curve(function (x) { return x * x / 2 - 2; }, -4.4, 4.4, "blue", [-4.4, 4.4]); },
         hit: function (d, v) { return d === "v" ? [[v, v * v / 2 - 2]] : v < -2 ? [] : v === -2 ? [[0, v]] : [[-Math.sqrt(2 * (v + 2)), v], [Math.sqrt(2 * (v + 2)), v]]; } },
    b: { cv: function () { return curveY(function (y) { return y * y / 2 - 2; }, -4.4, 4.4, "blue"); },
         hit: function (d, v) { return d === "h" ? [[v * v / 2 - 2, v]] : v < -2 ? [] : v === -2 ? [[v, 0]] : [[v, -Math.sqrt(2 * (v + 2))], [v, Math.sqrt(2 * (v + 2))]]; } },
    c: { cv: function () { return curve(function (x) { return x * x * x / 4; }, -4.4, 4.4, "blue", [-4.4, 4.4]); },
         hit: function (d, v) { return d === "v" ? [[v, v * v * v / 4]] : [[Math.cbrt(4 * v), v]]; } },
    d: { cv: function () { return [{ circle: [[0, 0], 3], c: "blue" }]; },
         hit: function (d, v) { var r = 9 - v * v; return r < 0 ? [] : r === 0 ? (d === "v" ? [[v, 0]] : [[0, v]]) : d === "v" ? [[v, -Math.sqrt(r)], [v, Math.sqrt(r)]] : [[-Math.sqrt(r), v], [Math.sqrt(r), v]]; } }
  };
  function ltHits(s) { var c = LT[s.c.curve], v = s.c.dir === "v" ? s.P[0] : s.P[1]; return c.hit(s.c.dir, v).filter(function (p) { return Math.abs(p[0]) <= 4.4 && Math.abs(p[1]) <= 4.4; }); }
  LESSONS.push({
    title: "One-to-one functions and the line tests", art: "fxline",
    blurb: "Book 1.1 · The vertical line test tells you a graph is a function; the horizontal line test tells you it is one-to-one.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A function gives each input exactly one output. Which relation is **not** a function?",
        options: [{ t: "$(1, 2),\\ (1, 5),\\ (3, 4)$" }, { t: "$(1, 2),\\ (2, 2),\\ (3, 4)$", fb: "Two inputs share the output 2, but each input has only one output. That is allowed." }],
        answer: 0, skill: "Relations and functions", hints: ["Is any first number used twice?"], why: "The input 1 has two outputs, 2 and 5." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the orange point to slide a line across each graph. Find a graph and a **vertical** line that meets it twice, then a graph and a **horizontal** line that meets it twice.",
        scene: { type: "sketch", x: [-4.4, 4.4], y: [-4.4, 4.4], u: 34, w: 330, gate: true,
          pts: { P: { at: [1, 1], drag: true, c: "orange", snap: 0.5, say: "The line" } },
          chips: { curve: { label: "Graph", v: "a", opts: [["a", "Parabola up"], ["b", "Parabola sideways"], ["c", "Cubic"], ["d", "Circle"]] },
                   dir: { label: "Line", v: "v", opts: [["v", "Vertical"], ["h", "Horizontal"]] } },
          track: function (s) { return ltHits(s).length >= 2 ? s.c.dir + "2" : null; },
          draw: function (s) {
            var v = s.c.dir === "v" ? s.P[0] : s.P[1], items = LT[s.c.curve].cv();
            items.push(s.c.dir === "v" ? { seg: [[v, -4.4], [v, 4.4]], c: "orange" } : { seg: [[-4.4, v], [4.4, v]], c: "orange" });
            ltHits(s).forEach(function (p) { items.push({ pt: p, c: "green" }); });
            return items;
          },
          readout: function (s) { var n = ltHits(s).length; return "The " + (s.c.dir === "v" ? "vertical" : "horizontal") + " line meets the graph in **" + n + "** point" + (n === 1 ? "" : "s") + ".<br>" + (s.tracked.v2 ? "✓ " : "· ") + "a vertical line meeting a graph twice &nbsp;&nbsp; " + (s.tracked.h2 ? "✓ " : "· ") + "a horizontal line meeting it twice"; },
          goal: function (s) { return s.tracked.v2 && s.tracked.h2; } },
        gate: true, then: "A **vertical** line meeting a graph twice means one input has two outputs. A **horizontal** line meeting it twice means two inputs share an output." },
      { type: "learn", kicker: "The idea",
        prompt: "**Vertical line test:** a graph is a function if no vertical line meets it twice. **Horizontal line test:** a function is **one-to-one** (each output comes from only one input) if no horizontal line meets it twice.",
        scene: { type: "method", how: HOW_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch both tests on the graph of $y = \\frac{x^2}{2} - 2$.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "x = 1", say: "Slide a vertical line to $x = 1$.", fig: grid("The parabola with a vertical line at x = 1.", LT.a.cv().concat([{ seg: [[1, -4.4], [1, 4.4]], c: "orange" }]), { x: [-4.4, 4.4], y: [-4.4, 4.4] }) },
          { step: 1, m: "y = 0", say: "Now slide a horizontal line to $y = 0$.", fig: grid("The parabola with a vertical line at x = 1 and a horizontal line at y = 0.", LT.a.cv().concat([{ seg: [[1, -4.4], [1, 4.4]], c: "orange" }, { seg: [[-4.4, 0], [4.4, 0]], c: "purple" }]), { x: [-4.4, 4.4], y: [-4.4, 4.4] }) },
          { step: 2, m: "x = 1: \\text{ one crossing}", say: "The vertical line meets the graph once. Try any other: always once.", fig: grid("The vertical line at x = 1 meets the parabola once.", LT.a.cv().concat([{ seg: [[1, -4.4], [1, 4.4]], c: "orange" }, { pt: [1, -1.5], c: "green" }]), { x: [-4.4, 4.4], y: [-4.4, 4.4] }),
            ask: { prompt: "How many times does the horizontal line $y = 0$ meet the graph?", answer: 0, options: [{ t: "Twice" }, { t: "Once", fb: "Look at both sides of the vertical axis." }, { t: "Never", fb: "It crosses the curve where $y = 0$: at $x = -2$ and $x = 2$." }] } },
          { step: 2, m: "y = 0: \\text{ two crossings}", say: "At $x = -2$ and $x = 2$: two inputs share the output 0.", fig: grid("The horizontal line at y = 0 meets the parabola at x = -2 and x = 2.", LT.a.cv().concat([{ seg: [[-4.4, 0], [4.4, 0]], c: "purple" }, { pt: [-2, 0], c: "green" }, { pt: [2, 0], c: "green" }]), { x: [-4.4, 4.4], y: [-4.4, 4.4] }) },
          { step: 3, m: "\\text{a function}", say: "No vertical line meets it twice." },
          { step: 3, m: "\\text{not one-to-one}", say: "A horizontal line meets it twice." }] },
        gate: true, then: "A function that **fails** the horizontal line test is still a function. It is just not one-to-one." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide each step. The graph of $y = \\frac{x^3}{4}$ rises from the bottom left to the top right." + grid("The graph of y = x cubed over 4.", LT.c.cv(), { x: [-4.4, 4.4], y: [-4.4, 4.4] }),
        how: HOW_4, skill: "Line tests",
        steps: [
          { step: 2, ask: "How many times can a vertical line meet this graph?", type: "choice", answer: 0,
            options: [{ t: "Once, every time" }, { t: "Sometimes twice", fb: "Slide a vertical line: the curve is always one height above each $x$." }],
            m: "\\text{vertical: once}", say: "Each input has one output." },
          { step: 3, ask: "So is it a function?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "No", fb: "No vertical line meets it twice, so it passes." }],
            m: "\\text{a function}", say: "It passes the vertical line test." },
          { step: 2, ask: "How many times can a **horizontal** line meet it?", type: "choice", answer: 0,
            options: [{ t: "Once, every time" }, { t: "Sometimes twice", fb: "The curve only climbs, so each height is reached once." }],
            m: "\\text{horizontal: once}", say: "Each output comes from one input." },
          { step: 3, ask: "So is it one-to-one?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "No", fb: "It passes the horizontal line test, so it is one-to-one." }],
            m: "\\text{one-to-one}", say: "A function that passes both tests." }],
        why: "Slide, count, decide. Now sort five graphs on your own." },
      { type: "sort", kicker: "On your own", prompt: "Sort each graph by the two tests.",
        bins: ["Not a function", "A function, not one-to-one", "One-to-one"],
        cards: [{ t: grid("A circle.", [{ circle: [[0, 0], 2.2], c: "blue" }], { x: [-3, 3], y: [-3, 3], u: 16 }), bin: 0, fb: "A vertical line meets a circle twice." },
                { t: grid("A parabola opening up.", curve(function (x) { return x * x / 2 - 2; }, -3, 3, "blue", [-3, 3]), { x: [-3, 3], y: [-3, 3], u: 16 }), bin: 1, fb: "Passes the vertical test, but a horizontal line meets it twice." },
                { t: grid("A cubic.", curve(function (x) { return x * x * x / 4; }, -3, 3, "blue", [-3, 3]), { x: [-3, 3], y: [-3, 3], u: 16 }), bin: 2, fb: "Passes both tests." },
                { t: grid("A V shape.", curve(function (x) { return Math.abs(x) - 2; }, -3, 3, "blue", [-3, 3]), { x: [-3, 3], y: [-3, 3], u: 16 }), bin: 1, fb: "Passes the vertical test. A horizontal line meets the V twice." },
                { t: grid("A parabola on its side.", curveY(function (y) { return y * y / 2 - 2; }, -3, 3, "blue"), { x: [-3, 3], y: [-3, 3], u: 16 }), bin: 0, fb: "A vertical line meets it twice." },
                { t: grid("A straight line going up.", curve(function (x) { return x; }, -3, 3, "blue"), { x: [-3, 3], y: [-3, 3], u: 16 }), bin: 2, fb: "Every vertical and horizontal line meets it once." }],
        skill: "Line tests", hints: ["First ask: does a vertical line ever meet it twice? If not, ask the same about horizontal lines."],
        why: "Vertical test first (function or not). Then the horizontal test (one-to-one or not)." },
      { type: "learn", kicker: "A harder case",
        prompt: "A function has $f(2) = 5$ **and** $f(-2) = 5$. Is it one-to-one? Draw it and test.",
        scene: { type: "walk", how: HOW_4, rows: [
          { step: 1, m: "y = 5", say: "Slide a horizontal line to height 5: the output both inputs share.", fig: grid("The graph through (-2, 5) and (2, 5) with a horizontal line at height 5.", curve(function (x) { return x * x / 2 + 3; }, -4.4, 4.4, "blue", [-1, 8]).concat([{ seg: [[-4.4, 5], [4.4, 5]], c: "purple" }]), { x: [-4.4, 4.4], y: [-1, 8] }) },
          { step: 2, m: "x = -2 \\quad\\text{and}\\quad x = 2", say: "The line meets the graph twice.", fig: grid("The horizontal line meets the graph at x = -2 and x = 2.", curve(function (x) { return x * x / 2 + 3; }, -4.4, 4.4, "blue", [-1, 8]).concat([{ seg: [[-4.4, 5], [4.4, 5]], c: "purple" }, { pt: [-2, 5], c: "green" }, { pt: [2, 5], c: "green" }]), { x: [-4.4, 4.4], y: [-1, 8] }),
            ask: { prompt: "How many inputs give the output 5?", answer: 0, options: [{ t: "At least two: $-2$ and $2$" }, { t: "Only one", fb: "We were told both $f(2) = 5$ and $f(-2) = 5$." }] } },
          { step: 3, m: "\\text{not one-to-one}", say: "Two different inputs share the output 5.", fig: grid("The two meeting points highlighted.", curve(function (x) { return x * x / 2 + 3; }, -4.4, 4.4, "blue", [-1, 8]).concat([{ seg: [[-4.4, 5], [4.4, 5]], c: "purple" }, { pt: [-2, 5], c: "red" }, { pt: [2, 5], c: "red" }]), { x: [-4.4, 4.4], y: [-1, 8] }) }] },
        gate: true, then: "Only **one input per output** makes a function one-to-one. Here the output 5 comes from two." },
      { type: "choice", kicker: "Try it", prompt: "The graph of $y = x^2$ is…",
        options: [{ t: "a function, but not one-to-one" }, { t: "one-to-one", fb: "$x = 2$ and $x = -2$ both give $y = 4$: a horizontal line meets it twice." }, { t: "not a function", fb: "Each $x$ gives exactly one $x^2$, so it passes the vertical line test." }],
        answer: 0, skill: "Line tests", hints: ["Vertical test first."], why: "Passes the vertical test; fails the horizontal one." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dev says: “A horizontal line meets this parabola twice, so it is **not a function**.” What is wrong?",
        options: [{ t: "Functions are tested with **vertical** lines. A horizontal line meeting it twice only shows it is not one-to-one." }, { t: "Nothing: that is the test for a function.", fb: "The test for a function uses vertical lines." }, { t: "A parabola can never be a function.", fb: "$y = x^2$ is a function: one output for each input." }],
        answer: 0, skill: "Line tests", hints: ["Which line tests for a function?"], why: "A vertical line meets $y = x^2$ once, so it is a function. The horizontal line test is about one-to-one." },
      { type: "choice", kicker: "Use it", prompt: "Which of these is **one-to-one**?",
        options: [{ t: "Each student → their ID number (no two share one)" }, { t: "Each student → their year of birth", fb: "Many students share a year of birth: one output, many inputs." }, { t: "Each country → its continent", fb: "Many countries share a continent." }],
        answer: 0, skill: "Line tests", hints: ["Can two different inputs share an output?"], why: "Only the ID number keeps every output different." }
    ]
  });
  /* ============================================================ 5 · Meet the toolkit */
  var HOW_5 = [["Try 0", "Put $x = 0$ in. Does anything break?"],
               ["Try 1 and −1", "Compare $f(1)$ with $f(-1)$: equal, opposite, or one is missing?"],
               ["Try 2", "Use $x = 2$ to tell the look-alikes apart."]];
  var TK = {
    k: { f: function () { return 2; } },
    x: { f: function (x) { return x; } },
    a: { f: function (x) { return Math.abs(x); } },
    s: { f: function (x) { return x * x; } },
    c: { f: function (x) { return x * x * x; } },
    r: { f: function (x) { return x === 0 ? NaN : 1 / x; } },
    q: { f: function (x) { return x === 0 ? NaN : 1 / (x * x); } },
    t: { f: function (x) { return x < 0 ? NaN : Math.sqrt(x); } },
    u: { f: function (x) { return Math.cbrt(x); } }
  };
  function tkVal(k, x) { var v = TK[k].f(x); return isFinite(v) ? nm(r2(v)) : "\\text{undefined}"; }
  LESSONS.push({
    title: "Meet the toolkit", art: "fxtool",
    blurb: "Book 1.1 · Nine basic functions and their graphs, told apart by a few test inputs.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $(-3)^2$.", answer: 9, skill: "Evaluate an expression",
        near: [{ v: -9, fb: "A negative number squared is positive: $(-3)(-3) = 9$." }, { v: 6, fb: "Squaring is multiplying by itself, not doubling." }],
        hints: ["$(-3) \\cdot (-3)$."], why: "$(-3)^2 = (-3)(-3) = 9$." },
      { type: "learn", kicker: "Explore",
        prompt: "Nine functions turn up everywhere. Pick each one and look at its graph and its four **test inputs**: $0$, $1$, $-1$ and $2$. Look at six of them.",
        scene: { type: "sketch", x: [-4, 4], y: [-4, 4], u: 34, w: 320, gate: true, pts: {},
          chips: { fn: { label: "Function", v: "x", opts: [["k", "$2$"], ["x", "$x$"], ["a", "$|x|$"], ["s", "$x^2$"], ["c", "$x^3$"], ["r", "$\\frac{1}{x}$"], ["q", "$\\frac{1}{x^2}$"], ["t", "$\\sqrt{x}$"], ["u", "$\\sqrt[3]{x}$"]] } },
          draw: function (s) {
            var f = TK[s.c.fn].f, items = curve(f, -4, 4, "blue", [-4, 4]);
            [0, 1, -1, 2].forEach(function (x) { var y = f(x); if (isFinite(y) && Math.abs(y) <= 4) items.push({ pt: [x, y], c: "orange" }); });
            return items;
          },
          readout: function (s) {
            var seen = Object.keys(s.seen.fn).length;
            return [0, 1, -1, 2].map(function (x) { return "$f(" + nm(x) + ") = " + tkVal(s.c.fn, x) + "$"; }).join(" &nbsp; ") + "<br>Looked at " + Math.min(seen, 6) + " of 6";
          },
          goal: function (s) { return Object.keys(s.seen.fn).length >= 6; } },
        gate: true, then: "The four numbers are a fingerprint. $\\frac{1}{x}$ and $\\sqrt{x}$ **break** somewhere. $x^2$ and $|x|$ treat $1$ and $-1$ alike. $x$ and $x^3$ flip the sign." },
      { type: "learn", kicker: "The idea",
        prompt: "These nine are the **toolkit functions**. To tell one from its look-alikes, test $x = 0$, then $1$ and $-1$, then $2$.",
        scene: { type: "method", how: HOW_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "A mystery function has $f(0) = 0$, $f(1) = 1$, $f(-1) = 1$ and $f(2) = 4$. Watch it found.",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "f(0) = 0", say: "It works at 0, so it is not $\\frac{1}{x}$ or $\\frac{1}{x^2}$, which break there. It is not constant either." },
          { step: 2, m: "f(1) = 1 \\quad f(-1) = 1", say: "Same output for $1$ and $-1$. That rules out $x$, $x^3$ and $\\sqrt[3]{x}$, which flip the sign.", ask: { prompt: "Which functions give the same output for 1 and $-1$?", answer: 0, options: [{ t: "$x^2$ and $|x|$" }, { t: "$x$ and $x^3$", fb: "Those flip the sign: $f(-1) = -f(1)$." }] }, fig: plot("The graphs of x squared and the absolute value of x, which both pass through (-1, 1), (0, 0) and (1, 1).", [{ f: function (x) { return x * x; }, a: -2, b: 2, c: "blue", yr: [-1, 4] }, { f: Math.abs, a: -3, b: 3, c: "orange", yr: [-1, 4] }], [], { x: [-3, 3], y: [-1, 4] }) },
          { step: 3, m: "f(2) = 4", say: "$|2| = 2$, but $2^2 = 4$.", ask: { prompt: "Which one gives 4 at $x = 2$?", answer: 0, options: [{ t: "$x^2$" }, { t: "$|x|$", fb: "$|2| = 2$." }] } },
          { step: 3, m: "f(x) = x^2", say: "The mystery function is the **square** function." }] },
        gate: true, then: "Three tests were enough: zero first, then $\\pm 1$, then 2." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do it. $f(0)$ is undefined, $f(1) = 1$, $f(-1) = -1$, $f(2) = \\frac{1}{2}$. Which function is it?",
        how: HOW_5, skill: "Toolkit functions",
        steps: [
          { step: 1, ask: "$f(0)$ is undefined. What kind of function breaks at 0?", type: "choice", answer: 0,
            options: [{ t: "A reciprocal: it divides by $x$" }, { t: "A square", fb: "$0^2 = 0$ is fine. Something must be dividing by $x$." }],
            m: "f(0) \\text{ undefined}", say: "Division by zero." },
          { step: 2, ask: "$f(1) = 1$ but $f(-1) = -1$. Is it $\\frac{1}{x}$ or $\\frac{1}{x^2}$?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1}{x}$: the sign flips" }, { t: "$\\frac{1}{x^2}$", fb: "$\\frac{1}{(-1)^2} = 1$, not $-1$. Squaring removes the sign." }],
            m: "f(-1) = -1", say: "The sign flips, so it is $\\frac{1}{x}$." },
          { step: 3, ask: "Check with $x = 2$. What is $\\frac{1}{2}$ as a decimal?", type: "num", pre: "$f(2) =$", answer: 0.5, tol: 1e-9, near: [{ v: 2, fb: "$\\frac{1}{x}$ at 2 is $\\frac{1}{2}$, not 2." }], hint: "1 divided by 2.",
            m: "f(2) = \\frac{1}{2}", say: "It matches: $f(x) = \\frac{1}{x}$." }],
        why: "Zero, then $\\pm 1$, then 2. Now sort the functions yourself." },
      { type: "sort", kicker: "On your own", prompt: "Compare $f(-1)$ with $f(1)$. Sort each function.",
        bins: ["$f(-1) = f(1)$", "$f(-1) = -f(1)$", "A test input fails"],
        cards: [{ t: "$x^2$", bin: 0, fb: "$(-1)^2 = 1^2$." }, { t: "$|x|$", bin: 0, fb: "$|-1| = |1|$." }, { t: "$x^3$", bin: 1, fb: "$(-1)^3 = -1$." }, { t: "$x$", bin: 1, fb: "$f(-1) = -1$ and $f(1) = 1$." },
                { t: "$\\frac{1}{x}$", bin: 1, fb: "$f(-1) = -1$, $f(1) = 1$." }, { t: "$\\sqrt{x}$", bin: 2, fb: "You cannot take the square root of $-1$." }],
        skill: "Toolkit functions", hints: ["Work out $f(1)$ and $f(-1)$ for each."], why: "Equal outputs for $\\pm 1$: $x^2$ and $|x|$. Opposite: $x$, $x^3$, $\\frac{1}{x}$. $\\sqrt{x}$ has no value at $-1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Look-alikes. $f(0) = 0$, $f(1) = 1$, $f(-1) = -1$, and $f(2) = 8$. Which one?",
        scene: { type: "walk", how: HOW_5, rows: [
          { step: 1, m: "f(0) = 0", say: "It works at 0: not a reciprocal." },
          { step: 2, m: "f(1) = 1 \\quad f(-1) = -1", say: "The sign flips. Candidates: $x$, $x^3$, $\\sqrt[3]{x}$.", fig: plot("The graphs of x, x cubed and the cube root of x, which all pass through (-1, -1), (0, 0) and (1, 1).", [{ f: function (x) { return x; }, a: -2, b: 2, c: "soft", yr: [-3, 3] }, { f: function (x) { return x * x * x; }, a: -2, b: 2, c: "blue", yr: [-3, 3] }, { f: Math.cbrt, a: -3, b: 3, c: "orange", yr: [-3, 3] }], [], { x: [-3, 3], y: [-3, 3] }) },
          { step: 3, m: "f(2) = 8", say: "$2^3 = 8$. For $x$ it would be 2, for $\\sqrt[3]{x}$ about 1.26.", ask: { prompt: "Which candidate gives 8 at $x = 2$?", answer: 0, options: [{ t: "$x^3$" }, { t: "$x$", fb: "$f(2) = 2$ for the identity." }, { t: "$\\sqrt[3]{x}$", fb: "The cube root of 2 is about 1.26." }] } },
          { step: 3, m: "f(x) = x^3", say: "The **cube** function." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "$f(0) = 0$, $f(1) = 1$, and $f(-1)$ is undefined. Which function is it?",
        options: [{ t: "$\\sqrt{x}$" }, { t: "$|x|$", fb: "$|-1| = 1$, which is defined." }, { t: "$\\frac{1}{x}$", fb: "That one is undefined at 0, not at $-1$." }],
        answer: 0, skill: "Toolkit functions", hints: ["Which function cannot accept a negative input?"], why: "You cannot take the square root of $-1$, so $\\sqrt{x}$ fails there." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ravi says $\\frac{1}{x}$ and $\\frac{1}{x^2}$ are the same function, because both give 1 at $x = 1$. What is wrong?",
        options: [{ t: "One test input is not enough: at $x = -1$ they differ ($-1$ against $1$)." }, { t: "Nothing: equal at 1 means equal everywhere.", fb: "Two functions can agree at a point and differ elsewhere. Try another input." }, { t: "$\\frac{1}{x^2}$ is undefined at 1.", fb: "$\\frac{1}{1^2} = 1$ is fine." }],
        answer: 0, skill: "Toolkit functions", hints: ["Try $x = -1$ in both."], why: "$\\frac{1}{-1} = -1$ but $\\frac{1}{(-1)^2} = 1$." },
      { type: "choice", kicker: "Use it", prompt: "A cube has edge length $s$. Its **volume** is $V(s) = s^3$. Which toolkit function is that?",
        options: [{ t: "The cube function" }, { t: "The square function", fb: "A square gives an area: $s^2$." }, { t: "The cube root function", fb: "The cube root would take the volume back to the edge." }],
        answer: 0, skill: "Toolkit functions", hints: ["Edge times edge times edge."], why: "$s^3$ is the cube function: each doubling of the edge multiplies the volume by 8." }
    ]
  });

  /* ======================================================= 6 · Interval notation */
  var HOW_6 = [["Ends", "Find the two ends of the set."],
               ["Brackets", "Use [ ] for an end that is included and ( ) for one that is not."],
               ["Join", "Join separate pieces with $\\cup$. Infinity always gets a round bracket."]];
  LESSONS.push({
    title: "Interval notation", art: "fxint",
    blurb: "Book 1.2 · A short way to write a set of numbers: its ends, and whether each end is in.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is the number 2 a solution of $x > 2$?",
        options: [{ t: "No: 2 is not greater than 2" }, { t: "Yes", fb: "$2 > 2$ is false. Only numbers above 2 work." }],
        answer: 0, skill: "Graph an inequality", hints: ["Is 2 bigger than 2?"], why: "$2 > 2$ is false, so 2 is not a solution." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the two ends. Tap an end to fill it (included) or empty it (not included). Make the set from $-2$ up to but not including $3$.",
        scene: { type: "numberline", min: -6, max: 6, mode: "seg", variable: "x", seg: { a: -4, b: 1, ca: false, cb: true }, gate: true,
          readout: function (st) { var g = st.seg; return "$" + (g.ca ? "[" : "(") + nm(g.a) + ",\\ " + nm(g.b) + (g.cb ? "]" : ")") + "$ &nbsp; means &nbsp; $" + nm(g.a) + (g.ca ? " \\le " : " < ") + "x" + (g.cb ? " \\le " : " < ") + nm(g.b) + "$"; },
          goal: function (st) { var g = st.seg; return g.a === -2 && g.b === 3 && g.ca && !g.cb; } },
        gate: true, then: "A **square** bracket means the end is **in**. A **round** one means it is **out**. That is interval notation: $[-2, 3)$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Interval notation** writes a set of numbers by its two ends: $[\\,2, 5\\,)$ means from 2 up to, but not including, 5. A set can run off forever: $(\\,3, \\infty\\,)$.",
        scene: { type: "method", how: HOW_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $-1 < x \\le 4$ written as an interval.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "-1 < x \\le 4", say: "The ends are $-1$ and $4$.", fig: nline("The number line from -1 to 4.", -3, 6, nline.rng(-1, 4, true, true, "soft")) },
          { step: 1, m: "-1 \\text{ is out} \\quad 4 \\text{ is in}", say: "$-1 < x$ leaves $-1$ out. $x \\le 4$ lets 4 in." },
          { step: 2, m: "(\\,-1,\\ 4\\,]", say: "$-1$ is **not** included: round. $4$ **is** included: square.",
            fig: nline("A heavy line from -1 to 4, hollow at -1 and filled at 4.", -3, 6, nline.rng(-1, 4, false, true)),
            ask: { prompt: "Which bracket goes at the end $4$, where $x \\le 4$?", answer: 0, options: [{ t: "A square one, $]$" }, { t: "A round one, $)$", fb: "$x \\le 4$ includes 4, so the end is closed: square." }] } },
          { step: 3, m: "x \\in (\\,-1,\\ 4\\,]", say: "One piece, so there is nothing to join. Read: all $x$ from $-1$ up to and including 4." }] },
        gate: true, then: "Hollow circle ↔ round bracket. Filled circle ↔ square bracket." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $x \\ge 1$ as an interval.",
        how: HOW_6, skill: "Interval notation",
        steps: [
          { step: 1, ask: "What are the two ends of $x \\ge 1$?", type: "choice", answer: 0,
            options: [{ t: "$1$ and $\\infty$" }, { t: "$0$ and $1$", fb: "The set starts at 1 and goes on for ever to the right." }],
            m: "1 \\ \\text{ to } \\ \\infty", say: "It starts at 1 and never stops." },
          { step: 2, ask: "Which brackets: at $1$, and at $\\infty$?", type: "choice", answer: 0,
            options: [{ t: "$[1,\\ \\infty)$" }, { t: "$(1,\\ \\infty)$", fb: "$x \\ge 1$ includes 1, so the end at 1 is square." }, { t: "$[1,\\ \\infty]$", fb: "Infinity is not a number you can reach: it always gets a round bracket." }],
            m: "[\\,1,\\ \\infty\\,)", say: "1 is in (square). Infinity never is (round)." },
          { step: 3, ask: "Is there more than one piece to join?", type: "choice", answer: 0,
            options: [{ t: "No: one piece, so no $\\cup$" }, { t: "Yes", fb: "The set is one unbroken stretch." }],
            m: "x \\in [\\,1,\\ \\infty\\,)", say: "One piece. Done." }],
        why: "Ends, brackets, join. Now go the other way: from the interval to the line." },
      { type: "numberline", kicker: "On your own", prompt: "Graph the interval $(-3,\\ 2]$. Drag each end, and tap it to fill or empty it.",
        min: -6, max: 6, mode: "seg", variable: "x", seg: { a: -1, b: 1, ca: true, cb: false },
        answer: { a: -3, b: 2, ca: false, cb: true }, skill: "Interval notation",
        hints: ["Round bracket: hollow. Square bracket: filled."], why: "Hollow at $-3$ (round), filled at $2$ (square)." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two pieces. Write $x < -1$ **or** $x \\ge 3$ as an interval.",
        scene: { type: "walk", how: HOW_6, rows: [
          { step: 1, m: "x < -1 \\quad\\text{or}\\quad x \\ge 3", say: "Two stretches: one running off to the left, one off to the right.", fig: nline("Two pieces: everything left of -1, and everything from 3 rightwards.", -4, 6, nline.rng(null, -1, false, false).concat(nline.rng(3, null, true, false))) },
          { step: 2, m: "(\\,-\\infty,\\ -1\\,) \\quad [\\,3,\\ \\infty\\,)", say: "Each piece gets its own brackets. $-\\infty$ and $\\infty$ always round.",
            ask: { prompt: "What bracket goes next to $-\\infty$?", answer: 0, options: [{ t: "A round one, $($" }, { t: "A square one, $[$", fb: "You can never reach infinity, so it is never included." }] } },
          { step: 3, m: "(\\,-\\infty,\\ -1\\,) \\cup [\\,3,\\ \\infty\\,)", say: "$\\cup$ means “together with”: the set is in one piece or the other." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which interval is $x \\le 0$ **or** $x > 5$?",
        options: [{ t: "$(-\\infty,\\ 0] \\cup (5,\\ \\infty)$" }, { t: "$(-\\infty,\\ 0) \\cup (5,\\ \\infty)$", fb: "$x \\le 0$ includes 0: a square bracket at 0." }, { t: "$(-\\infty,\\ 0] \\cup [5,\\ \\infty)$", fb: "$x > 5$ does not include 5: a round bracket." }],
        answer: 0, skill: "Interval notation", hints: ["Check each end separately."], why: "$\\le$ means closed at 0 (square); $>$ means open at 5 (round)." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lila writes $x \\ge 2$ as $[\\,2,\\ \\infty\\,]$. What is wrong?",
        options: [{ t: "Infinity cannot be included: it needs a round bracket, $[\\,2,\\ \\infty\\,)$." }, { t: "The 2 should have a round bracket.", fb: "$x \\ge 2$ includes 2, so the square bracket at 2 is right." }, { t: "Nothing is wrong.", fb: "Infinity is not a number: it is “never ending”, so it is never included." }],
        answer: 0, skill: "Interval notation", hints: ["Look at the end next to $\\infty$."], why: "$[\\,2,\\ \\infty\\,)$." },
      { type: "choice", kicker: "Use it", prompt: "A ride needs a height of at least 120 cm and at most 195 cm. Which interval lists the allowed heights?",
        options: [{ t: "$[\\,120,\\ 195\\,]$" }, { t: "$(\\,120,\\ 195\\,)$", fb: "“At least” and “at most” include the ends: square brackets." }, { t: "$[\\,120,\\ \\infty)$", fb: "There is also an upper limit, 195." }],
        answer: 0, skill: "Interval notation", hints: ["Are 120 and 195 allowed?"], why: "Both ends are allowed: $[\\,120,\\ 195\\,]$." }
    ]
  });

  /* ================================================ 7 · The domain of a formula */
  var HOW_7 = [["Spot trouble", "Look for a fraction (the bottom can't be 0) or an even root (the inside can't be negative)."],
               ["Exclude", "Find the inputs that cause the trouble: set the bottom equal to 0, or the inside below 0."],
               ["Write", "Write every other input as an interval."]];
  var DM = { r: function (x) { return x === 2 ? NaN : 1 / (x - 2); }, t: function (x) { return x < -1 ? NaN : Math.sqrt(x + 1); }, p: function (x) { return x * x - 1; } };
  LESSONS.push({
    title: "The domain of a formula", art: "fxdom",
    blurb: "Book 1.2 · The inputs a formula can accept: nothing divided by zero, no even root of a negative.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which of these has no answer?",
        options: [{ t: "$5 \\div 0$" }, { t: "$0 \\div 5$", fb: "$0 \\div 5 = 0$. It is dividing **by** zero that fails." }],
        answer: 0, skill: "Evaluate an expression", hints: ["Which one divides by zero?"], why: "Nothing multiplied by 0 gives 5, so $5 \\div 0$ has no answer." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the point along each graph. For $\\frac{1}{x-2}$ and for $\\sqrt{x+1}$, find an input where the formula **breaks**.",
        scene: { type: "sketch", x: [-4, 6], y: [-4, 4], u: 30, w: 360, gate: true,
          pts: { P: { at: [1, 0], drag: true, c: "orange", snap: 0.5, say: "The input", on: { fn: function (p, s) { var x = Math.max(-3.5, Math.min(5.5, Math.round(p[0] * 2) / 2)), y = DM[s.c.fn](x); return [x, isFinite(y) ? Math.max(-4, Math.min(4, y)) : 0]; } } } },
          chips: { fn: { label: "Formula", v: "r", opts: [["r", "$\\frac{1}{x-2}$"], ["t", "$\\sqrt{x+1}$"], ["p", "$x^2 - 1$"]] } },
          track: function (s) { return isFinite(DM[s.c.fn](s.P[0])) ? null : s.c.fn; },
          draw: function (s) {
            var f = DM[s.c.fn], x = s.P[0], ok = isFinite(f(x)), items = curve(f, -4, 6, "blue", [-4, 4]);
            if (ok) items.push({ seg: [[x, 0], [x, f(x)]], c: "orange", dash: true }); else items.push({ seg: [[x, -4], [x, 4]], c: "red", dash: true });
            if (s.c.fn === "r") items.push({ seg: [[2, -4], [2, 4]], c: "soft", dash: true });
            return items;
          },
          readout: function (s) { var x = s.P[0], y = DM[s.c.fn](x), seen = (s.tracked.r ? "✓ " : "· ") + "$\\frac{1}{x-2}$ breaks &nbsp;&nbsp; " + (s.tracked.t ? "✓ " : "· ") + "$\\sqrt{x+1}$ breaks"; return (isFinite(y) ? "$f(" + nm(x) + ") = " + nm(r2(y)) + "$" : "$f(" + nm(x) + ")$ is **undefined**") + "<br>" + seen; },
          goal: function (s) { return s.tracked.r && s.tracked.t; } },
        gate: true, then: "$\\frac{1}{x-2}$ breaks at $x = 2$ (the bottom is 0). $\\sqrt{x+1}$ breaks below $x = -1$ (a negative inside the root). The inputs that **work** are the **domain**." },
      { type: "learn", kicker: "The idea",
        prompt: "The **domain** is every input a formula accepts. Two things stop an input: a **zero on the bottom of a fraction**, and a **negative inside an even root** (square root, fourth root…).",
        scene: { type: "method", how: HOW_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the domain of $f(x) = \\dfrac{3}{x - 4}$ found.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "f(x) = \\frac{3}{x - 4}", say: "A fraction. The bottom, $x - 4$, must not be 0." },
          { step: 2, m: "x - 4 = 0", say: "Find the input that makes the bottom zero.",
            ask: { prompt: "Which input makes $x - 4 = 0$?", answer: 0, options: [{ t: "$x = 4$" }, { t: "$x = -4$", fb: "$-4 - 4 = -8$, not 0." }] } },
          { step: 2, m: "x \\ne 4", say: "Every other input works.", fig: nline("The number line with a hole at 4.", 0, 8, nline.rng(null, 4, false, false).concat(nline.rng(4, null, false, false))) },
          { step: 3, m: "(\\,-\\infty,\\ 4\\,) \\cup (\\,4,\\ \\infty\\,)", say: "Everything except 4, written as two pieces." }] },
        gate: true, then: "The domain is all real numbers **except** the one that makes the bottom zero." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the domain of $g(x) = \\sqrt{x + 3}$.",
        how: HOW_7, skill: "Domain of a formula",
        steps: [
          { step: 1, ask: "What could go wrong with $\\sqrt{x + 3}$?", type: "choice", answer: 0,
            options: [{ t: "The inside, $x + 3$, could be negative" }, { t: "The bottom of a fraction could be 0", fb: "There is no fraction here. It is a square root." }],
            m: "x + 3 \\text{ must not be negative}", say: "An even root needs a non-negative inside." },
          { step: 2, ask: "Solve $x + 3 \\ge 0$. What is the smallest allowed $x$?", type: "num", pre: "$x \\ge$", answer: -3, near: [{ v: 3, fb: "Subtract 3 from both sides: $x \\ge -3$." }], hint: "Subtract 3.",
            m: "x + 3 \\ge 0 \\quad\\Rightarrow\\quad x \\ge -3", say: "Inside the root is allowed to be 0." },
          { step: 3, ask: "Write it as an interval.", type: "choice", answer: 0,
            options: [{ t: "$[\\,-3,\\ \\infty)$" }, { t: "$(\\,-3,\\ \\infty)$", fb: "At $x = -3$ the root is $\\sqrt{0} = 0$: allowed, so the bracket is square." }],
            m: "[\\,-3,\\ \\infty\\,)", say: "Square at $-3$, round at infinity." }],
        why: "Spot, exclude, write. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "What is the domain of $h(x) = \\dfrac{5}{x + 2}$?",
        options: [{ t: "all real numbers except $-2$" }, { t: "all real numbers except $2$", fb: "$2 + 2 = 4$. The bottom is zero when $x = -2$." }, { t: "all real numbers", fb: "A fraction's bottom can be zero: look for the input that does it." }],
        answer: 0, skill: "Domain of a formula", hints: ["Solve $x + 2 = 0$."], why: "$x + 2 = 0$ at $x = -2$, so the domain is $(-\\infty, -2) \\cup (-2, \\infty)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A root **on the bottom**. Find the domain of $f(x) = \\dfrac{1}{\\sqrt{x - 1}}$.",
        scene: { type: "walk", how: HOW_7, rows: [
          { step: 1, m: "f(x) = \\frac{1}{\\sqrt{x - 1}}", say: "Both troubles: a root, and it is on the bottom of a fraction." },
          { step: 2, m: "x - 1 \\ge 0", say: "The root needs a non-negative inside." },
          { step: 2, m: "x - 1 \\ne 0", say: "But the bottom cannot be zero, so the inside cannot be 0 either. Strictly bigger.",
            ask: { prompt: "Can $x = 1$ be in the domain?", answer: 0, options: [{ t: "No: the bottom would be $\\sqrt{0} = 0$" }, { t: "Yes: $x - 1 \\ge 0$ allows 0", fb: "It would put 0 under the 1, which is division by zero." }] } },
          { step: 3, m: "x > 1 \\quad\\Rightarrow\\quad (\\,1,\\ \\infty\\,)", say: "Round at 1.", fig: nline("Everything to the right of 1, with a hollow circle at 1.", -1, 6, nline.rng(1, null, false, false)) }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which numbers are **not** in the domain of $f(x) = \\dfrac{x}{x^2 - 9}$?",
        options: [{ t: "$3$ and $-3$" }, { t: "only $3$", fb: "$(-3)^2 - 9 = 0$ as well." }, { t: "only $9$", fb: "Solve $x^2 - 9 = 0$, not $x = 9$." }],
        answer: 0, skill: "Domain of a formula", hints: ["Solve $x^2 - 9 = 0$."], why: "$x^2 = 9$ gives $x = 3$ or $x = -3$: both make the bottom zero." },
      { type: "choice", kicker: "Find the error",
        prompt: "Omar says the domain of $\\sqrt{x - 5}$ is $(\\,5,\\ \\infty)$. What is wrong?",
        options: [{ t: "At $x = 5$ the root is $\\sqrt{0} = 0$: it works. The domain is $[\\,5,\\ \\infty)$." }, { t: "The domain is all real numbers.", fb: "$\\sqrt{-1}$ is not a real number: small inputs fail." }, { t: "Nothing is wrong.", fb: "Test $x = 5$: $\\sqrt{5 - 5} = 0$ is a perfectly good number." }],
        answer: 0, skill: "Domain of a formula", hints: ["Try $x = 5$ in the formula."], why: "$x - 5 \\ge 0$ includes 0, so the end at 5 is closed." },
      { type: "choice", kicker: "Use it", prompt: "$n$ friends share a taxi that costs 120 dollars: each pays $C(n) = \\dfrac{120}{n}$. Which inputs make sense?",
        options: [{ t: "$n = 1, 2, 3, \\dots$ (whole numbers of friends)" }, { t: "every real number except 0", fb: "That is the domain of the formula. The **situation** only allows whole numbers of people." }, { t: "every real number", fb: "$n = 0$ would be division by zero, and 2.5 friends makes no sense." }],
        answer: 0, skill: "Domain of a formula", hints: ["Can you have $-3$ friends? Or 2.5?"], why: "A real situation can restrict the domain more than the formula does." }
    ]
  });

  /* ============================================ 8 · Domain and range from a graph */
  var HOW_8 = [["Left to right", "Slide across the graph. Which $x$-values does it cover? That is the domain."],
               ["Bottom to top", "Which heights does it reach? That is the range."],
               ["Write", "Write each as an interval. Hollow dots and arrows decide the brackets."]];
  var PA = function (x) { return 4 - x * x; };
  var DR = [{ f: function (x) { return Math.sqrt(x + 2) - 1; }, a: -2, b: 6, c: "blue", yr: [-3, 4] }];
  LESSONS.push({
    title: "Domain and range from a graph", art: "fxdr",
    blurb: "Book 1.2 · The domain is the shadow of the graph on the $x$-axis; the range is its shadow on the $y$-axis.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A graph starts at the point $(-1, 3)$ and ends at $(3, -5)$. Which is the **left-most** input?",
        options: [{ t: "$-1$" }, { t: "$3$", fb: "3 is further right. The left-most is the smaller $x$." }, { t: "$-5$", fb: "$-5$ is an output, a height." }],
        answer: 0, skill: "Plot a point", hints: ["Inputs are the first numbers."], why: "The $x$-values are $-1$ and $3$; $-1$ is further left." },
      { type: "learn", kicker: "Explore",
        prompt: "Imagine a lamp shining on the graph from the side and from above. Drag the **blue** handles on the $x$-axis to cover its shadow there, and the **orange** ones on the $y$-axis.",
        scene: { type: "sketch", x: [-3, 5], y: [-6, 5], u: 26, w: 300, gate: true,
          pts: { A: { at: [-2, 0], drag: true, c: "blue", snap: 1, on: { y: 0 }, say: "Left end of the domain" }, B: { at: [4, 0], drag: true, c: "blue", snap: 1, on: { y: 0 }, say: "Right end of the domain" },
                 C: { at: [0, -4], drag: true, c: "orange", snap: 1, on: { x: 0 }, say: "Bottom of the range" }, D: { at: [0, 3], drag: true, c: "orange", snap: 1, on: { x: 0 }, say: "Top of the range" } },
          draw: function (s) {
            var x1 = Math.min(s.A[0], s.B[0]), x2 = Math.max(s.A[0], s.B[0]), y1 = Math.min(s.C[1], s.D[1]), y2 = Math.max(s.C[1], s.D[1]);
            return curve(PA, -1, 3, "soft", [-6, 5]).concat([{ pt: [-1, 3], c: "soft" }, { pt: [3, -5], c: "soft" }, { poly: [[x1, -0.18], [x2, -0.18], [x2, 0.18], [x1, 0.18]], c: "blue", fill: true }, { poly: [[-0.18, y1], [0.18, y1], [0.18, y2], [-0.18, y2]], c: "orange", fill: true }]);
          },
          readout: function (s) { return "Domain: $[\\," + nm(Math.min(s.A[0], s.B[0])) + ",\\ " + nm(Math.max(s.A[0], s.B[0])) + "\\,]$ &nbsp;&nbsp; Range: $[\\," + nm(Math.min(s.C[1], s.D[1])) + ",\\ " + nm(Math.max(s.C[1], s.D[1])) + "\\,]$"; },
          goal: function (s) { return Math.min(s.A[0], s.B[0]) === -1 && Math.max(s.A[0], s.B[0]) === 3 && Math.min(s.C[1], s.D[1]) === -5 && Math.max(s.C[1], s.D[1]) === 4; } },
        gate: true, then: "The graph lies over $x$ from $-1$ to $3$: the **domain**. It reaches heights from $-5$ up to its peak, $4$: the **range**." },
      { type: "learn", kicker: "The idea",
        prompt: "The **domain** is the $x$-values a graph covers, left to right. The **range** is the $y$-values it reaches, bottom to top. Read each as an interval.",
        scene: { type: "method", how: HOW_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the domain and range of the graph $y = \\sqrt{x + 2} - 1$.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "x \\ge -2", say: "The graph starts at $x = -2$ (a filled dot) and goes on to the right for ever.", fig: grid("The graph starts at (-2, -1) and rises to the right. The x-axis from -2 onwards is shaded.", curve(DR[0].f, -2, 6, "blue", [-3, 4]).concat([dot(-2, -1, "blue"), { poly: [[-2, -0.18], [6, -0.18], [6, 0.18], [-2, 0.18]], c: "blue", fill: true }]), { x: [-4, 7], y: [-3, 4], u: 22 }) },
          { step: 2, m: "y \\ge -1", say: "Its lowest point is at height $-1$. It then keeps rising.", fig: grid("The y-axis from -1 upwards is shaded.", curve(DR[0].f, -2, 6, "blue", [-3, 4]).concat([dot(-2, -1, "blue"), { poly: [[-2, -0.18], [6, -0.18], [6, 0.18], [-2, 0.18]], c: "blue", fill: true }, { poly: [[-0.18, -1], [0.18, -1], [0.18, 4], [-0.18, 4]], c: "orange", fill: true }]), { x: [-4, 7], y: [-3, 4], u: 22 }),
            ask: { prompt: "How high does the graph go?", answer: 0, options: [{ t: "For ever: it keeps rising" }, { t: "Up to 4", fb: "4 is only where this picture stops. The graph does not." }] } },
          { step: 3, m: "\\text{domain } [\\,-2,\\ \\infty\\,)", say: "A filled dot at $-2$: square. Then infinity: round." },
          { step: 3, m: "\\text{range } [\\,-1,\\ \\infty\\,)", say: "A filled dot at height $-1$: square. Then infinity: round." }] },
        gate: true, then: "Domain: $[-2, \\infty)$. Range: $[-1, \\infty)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you read the graph of $y = x^2 - 1$ (a parabola with its lowest point $(0, -1)$)." + grid("A parabola opening up with its lowest point at (0, -1).", curve(function (x) { return x * x - 1; }, -3, 3, "blue", [-2, 6]), { x: [-4, 4], y: [-2, 6], u: 24 }),
        how: HOW_8, skill: "Domain and range from a graph",
        steps: [
          { step: 1, ask: "Slide left to right. Where does it stop?", type: "choice", answer: 0,
            options: [{ t: "It never stops: every $x$ works" }, { t: "At $x = 3$", fb: "The picture ends at 3, but the parabola keeps going. The arrows would show it." }],
            m: "\\text{domain: } (\\,-\\infty,\\ \\infty\\,)", say: "Every input has a point above or below it." },
          { step: 2, ask: "What is the lowest height?", type: "num", pre: "$y \\ge$", answer: -1, near: [{ v: 0, fb: "The lowest point is $(0, -1)$: the height is $-1$." }], hint: "Look at the bottom of the bowl.",
            m: "y \\ge -1", say: "Nothing goes below $-1$, and the arms rise for ever." },
          { step: 3, ask: "Write the range.", type: "choice", answer: 0,
            options: [{ t: "$[\\,-1,\\ \\infty)$" }, { t: "$(\\,-1,\\ \\infty)$", fb: "The graph does reach $-1$ at its lowest point, so it is included." }],
            m: "\\text{range: } [\\,-1,\\ \\infty\\,)", say: "Square at $-1$." }],
        why: "Left to right, bottom to top, write. Now try one on your own." },
      { type: "choice", kicker: "On your own", prompt: "A graph is a line segment from the point $(-2, 1)$ to the point $(4, 7)$, with both ends filled. What is its range?",
        options: [{ t: "$[\\,1,\\ 7\\,]$" }, { t: "$[\\,-2,\\ 4\\,]$", fb: "Those are the $x$-values: the domain." }, { t: "$(\\,1,\\ 7\\,)$", fb: "Both ends are filled dots, so both heights are included." }],
        answer: 0, skill: "Domain and range from a graph", hints: ["The range uses the second numbers, the heights."], why: "The heights run from 1 to 7, both included." },
      { type: "learn", kicker: "A harder case",
        prompt: "A hollow dot changes a bracket. A graph runs from the **hollow** dot $(-3, 2)$ to the **filled** dot $(1, -4)$. Find its domain and range.",
        scene: { type: "walk", how: HOW_8, rows: [
          { step: 1, m: "\\text{from } x = -3 \\text{ to } x = 1", say: "Left end hollow, right end filled.", fig: grid("A line from a hollow dot at (-3, 2) to a filled dot at (1, -4).", [{ seg: [[-3, 2], [1, -4]], c: "blue" }, hole(-3, 2, "blue"), dot(1, -4, "blue")], { x: [-5, 4], y: [-5, 4], u: 24 }) },
          { step: 2, m: "\\text{from } y = -4 \\text{ to } y = 2", say: "The lowest height is $-4$ (filled), the highest $2$ (hollow).",
            ask: { prompt: "Is the height 2 reached?", answer: 0, options: [{ t: "No: that end is hollow" }, { t: "Yes", fb: "A hollow dot means the point itself is not on the graph." }] } },
          { step: 3, m: "\\text{domain } (\\,-3,\\ 1\\,] \\qquad \\text{range } [\\,-4,\\ 2\\,)", say: "Hollow: round. Filled: square. Note the ends swap in the range, because the line goes down." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "What is the range of $y = |x|$?",
        options: [{ t: "$[\\,0,\\ \\infty)$" }, { t: "$(-\\infty,\\ \\infty)$", fb: "$|x|$ is never negative. That is the domain, not the range." }, { t: "$(\\,0,\\ \\infty)$", fb: "$|0| = 0$, so 0 is reached." }],
        answer: 0, skill: "Domain and range from a graph", hints: ["Picture the V shape: how low does it go?"], why: "The V has its point at height 0 and rises for ever." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana reads the domain of $y = x^2 - 1$ as $[-1, \\infty)$ from the lowest point of the graph. What did she do?",
        options: [{ t: "She gave the **range**. The domain is the $x$-values: all real numbers." }, { t: "Nothing is wrong.", fb: "$-1$ is the lowest **height**, an output." }, { t: "She should have used round brackets.", fb: "The brackets are fine for the range. The problem is which axis she read." }],
        answer: 0, skill: "Domain and range from a graph", hints: ["Which axis holds the heights?"], why: "Left-to-right is the domain; bottom-to-top is the range." },
      { type: "choice", kicker: "Use it", prompt: "A drone's height $h$ (metres) over its flight lasting 0 to 12 minutes never goes below 5 or above 40. What is the **range** of $h$?",
        options: [{ t: "$[\\,5,\\ 40\\,]$" }, { t: "$[\\,0,\\ 12\\,]$", fb: "That is the domain: the minutes." }, { t: "$[\\,0,\\ 40\\,]$", fb: "The height never drops below 5." }],
        answer: 0, skill: "Domain and range from a graph", hints: ["Range = heights."], why: "The range is the set of heights: from 5 to 40 metres." }
    ]
  });
  /* ============================================================ 9 · Piecewise functions */
  var HOW_9 = [["Find the piece", "Check which condition the input meets. Look closely at the boundary."],
               ["Use its rule", "Put the input into that piece's formula, and no other."],
               ["Calculate", "Work it out. That is the output."]];
  var PW9 = function (x) { return x < 2 ? x + 1 : 6 - x; };
  var PW9L = function (x) { return x + 1; }, PW9R = function (x) { return 6 - x; };
  var CASE9 = "$$f(x) = \\cases{x + 1 & x < 2 \\\\ 6 - x & x \\ge 2}$$";
  function pwFig(alt, ok) {      // the graph of f above, or look-alikes with the dots wrong
    var hl = ok === 1 ? [dot(2, 3, "blue"), dot(2, 4, "blue")] : ok === 2 ? [hole(2, 3, "blue"), hole(2, 4, "blue")] : [hole(2, 3, "blue"), dot(2, 4, "blue")];
    return grid(alt, curve(PW9L, -3, 2, "blue", [-3, 7]).concat(curve(PW9R, 2, 6, "blue", [-3, 7]), hl), { x: [-3, 6], y: [-1, 5], u: 17 });
  }
  LESSONS.push({
    title: "Piecewise functions", art: "fxpw",
    blurb: "Book 1.2 · A function with a different rule on each stretch of inputs.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $x = 5$ a solution of $x \\ge 5$?",
        options: [{ t: "Yes: 5 is allowed" }, { t: "No", fb: "$\\ge$ means “greater than **or equal to**”, so 5 itself works." }],
        answer: 0, skill: "Graph an inequality", hints: ["Is 5 greater than or equal to 5?"], why: "$5 \\ge 5$ is true." },
      { type: "learn", kicker: "Explore",
        prompt: "This function has **two rules**." + CASE9 + "Slide the point. Watch which rule is used, and what happens at $x = 2$.",
        scene: { type: "sketch", x: [-4, 7], y: [-3, 6], u: 28, w: 340, gate: true,
          pts: { P: { at: [0, 1], drag: true, c: "orange", snap: 0.5, say: "The input", on: { fn: function (p) { var x = Math.max(-3, Math.min(5, Math.round(p[0] * 2) / 2)); return [x, PW9(x)]; } } } },
          track: function (s) { return s.P[0] < 2 ? "L" : "R"; },
          draw: function (s) {
            var l = s.P[0] < 2;
            return curve(PW9L, -3, 2, l ? "blue" : "soft", [-3, 7]).concat(curve(PW9R, 2, 6, l ? "soft" : "blue", [-3, 7]), [hole(2, 3, l ? "blue" : "soft"), dot(2, 4, l ? "soft" : "blue"), { seg: [[s.P[0], 0], [s.P[0], PW9(s.P[0])]], c: "orange", dash: true }]);
          },
          readout: function (s) { var x = s.P[0], l = x < 2; return "$x = " + nm(x) + "$ is " + (l ? "less than 2: use $x + 1$" : "2 or more: use $6 - x$") + "<br>$f(" + nm(x) + ") = " + nm(PW9(x)) + "$ &nbsp;&nbsp; " + (s.tracked.L ? "✓ " : "· ") + "left rule &nbsp; " + (s.tracked.R ? "✓ " : "· ") + "right rule"; },
          goal: function (s) { return s.tracked.L && s.tracked.R; } },
        gate: true, then: "At $x = 2$ the graph **jumps**. Just before 2 it heads for 3 (hollow dot). At 2 itself it is 4 (filled dot): the rule that includes the boundary decides." },
      { type: "learn", kicker: "The idea",
        prompt: "A **piecewise function** has a different formula on each part of its domain. To evaluate it, find which condition the input meets, then use **only that formula**.",
        scene: { type: "method", how: HOW_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find $f(2)$ for" + CASE9,
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "2 < 2 \\ \\text{is false}", say: "Test the first condition, $x < 2$. At the boundary, 2 is not less than 2.", fig: pwFig("The graph of f.") },
          { step: 1, m: "2 \\ge 2 \\ \\text{is true}", say: "The second condition fits. So the second piece is the one.",
            ask: { prompt: "Which piece does $x = 2$ belong to?", answer: 0, options: [{ t: "The second: $6 - x$" }, { t: "The first: $x + 1$", fb: "That piece needs $x < 2$, and 2 is not below 2." }] } },
          { step: 2, m: "f(2) = 6 - 2", say: "Use only the second formula." },
          { step: 3, m: "f(2) = 4", say: "The filled dot at $(2, 4)$." }] },
        gate: true, then: "The boundary input belongs to the piece whose condition **includes** it." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do $f(-1)$ for the same function." + CASE9,
        how: HOW_9, skill: "Piecewise functions",
        steps: [
          { step: 1, ask: "Which condition does $x = -1$ meet?", type: "choice", answer: 0,
            options: [{ t: "$x < 2$" }, { t: "$x \\ge 2$", fb: "$-1$ is not 2 or more." }],
            m: "-1 < 2", say: "So the first piece." },
          { step: 2, ask: "Which formula do you use?", type: "choice", answer: 0,
            options: [{ t: "$x + 1$" }, { t: "$6 - x$", fb: "That belongs to $x \\ge 2$." }],
            m: "f(-1) = -1 + 1", say: "Put $-1$ into $x + 1$ only." },
          { step: 3, ask: "Work it out.", type: "num", pre: "$f(-1) =$", answer: 0, near: [{ v: 7, fb: "$6 - (-1) = 7$ is the other formula." }], hint: "$-1 + 1$.",
            m: "f(-1) = 0", say: "The output is 0." }],
        why: "Find the piece, use its rule, calculate. Now spot the graph." },
      { type: "choice", kicker: "On your own", prompt: "Which graph shows $f$?" + CASE9,
        options: [{ t: pwFig("Both dots filled.", 1), fb: "Two filled dots at $x = 2$ would give $f(2)$ two values. The first line only **approaches** 3: its end is hollow." }, { t: pwFig("Hollow dot at (2, 3), filled dot at (2, 4).", 0) }, { t: pwFig("Both dots hollow.", 2), fb: "$f(2) = 4$ is a real value (the rule $x \\ge 2$ includes 2), so the dot at height 4 is filled." }],
        answer: 1, skill: "Piecewise functions", hints: ["At $x = 2$ which rule is used? Is its dot filled?"], why: "$f(2) = 4$, so the filled dot is at height 4. The first line only approaches 3, so its end is hollow." },
      { type: "learn", kicker: "A harder case",
        prompt: "Three pieces, and **two** conditions with $\\le$. Find $f(3)$.$$f(x) = \\cases{x^2 & x \\le -1 \\\\ 2x + 1 & -1 < x \\le 3 \\\\ 7 & x > 3}$$",
        scene: { type: "walk", how: HOW_9, rows: [
          { step: 1, m: "3 \\le -1 \\ \\text{false}", say: "Not the first piece." },
          { step: 1, m: "-1 < 3 \\le 3 \\ \\text{true}", say: "The middle condition fits: 3 is bigger than $-1$ and **equal** to 3.",
            ask: { prompt: "Is $x = 3$ in the third piece, $x > 3$?", answer: 0, options: [{ t: "No: 3 is not greater than 3" }, { t: "Yes", fb: "$3 > 3$ is false. Only numbers above 3 belong there." }] } },
          { step: 2, m: "f(3) = 2(3) + 1", say: "Use $2x + 1$." },
          { step: 3, m: "f(3) = 7", say: "And $f(4) = 7$ as well: the third piece is the constant 7." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Let $f(x) = \\cases{2x + 1 & x < 0 \\\\ x^2 - 3 & x \\ge 0}$ . Find $f(-2) + f(3)$.", answer: 3, skill: "Piecewise functions",
        near: [{ v: 5, fb: "$f(-2) = 2(-2) + 1 = -3$, not $+3$." }, { v: 13, fb: "Use the right piece for each: $f(-2) = -3$ and $f(3) = 6$." }],
        hints: ["$-2 < 0$ uses $2x + 1$; $3 \\ge 0$ uses $x^2 - 3$."], why: "$f(-2) = -3$ and $f(3) = 9 - 3 = 6$, so the sum is 3." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kai finds $f(2)$ for the function above ($x + 1$ if $x < 2$, $6 - x$ if $x \\ge 2$). Tap the line where the work **first** goes wrong.",
        lines: ["f(x) = x + 1 \\text{ if } x < 2", "x = 2: \\text{ use } x + 1", "f(2) = 2 + 1", "f(2) = 3"], answer: 1, fix: "x = 2: \\text{ use } 6 - x",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Piecewise functions", hints: ["Does $2 < 2$ hold?"], why: "$2 < 2$ is false but $2 \\ge 2$ is true, so use $6 - x$: $f(2) = 4$." },
      { type: "num", kicker: "Use it", prompt: "A phone plan costs 20 dollars for up to 2 GB. After that, each extra GB costs 10 dollars more. So $C(g) = 20$ for $g \\le 2$, and $C(g) = 20 + 10(g - 2)$ for $g > 2$. What is $C(4)$?", pre: "$C(4) =$", post: "dollars", answer: 40, skill: "Piecewise functions",
        near: [{ v: 20, fb: "4 GB is more than 2, so the second rule applies." }, { v: 60, fb: "Only the 2 extra GB are charged: $10(4 - 2) = 20$." }],
        hints: ["$4 > 2$: use the second rule."], why: "$C(4) = 20 + 10(2) = 40$ dollars." }
    ]
  });

  /* ======================================================= 10 · Average rate of change */
  var HOW_10 = [["Outputs", "Find $f(a)$ and $f(b)$ for the two inputs."],
                ["Changes", "Subtract the outputs, and subtract the inputs."],
                ["Divide", "Divide the change in output by the change in input."]];
  var SQ10 = function (x) { return (x - 2) * (x - 2); };
  LESSONS.push({
    title: "Average rate of change", art: "fxarc",
    blurb: "Book 1.3 · How fast a function changes over a stretch: the slope of the line between two of its points.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the slope of the line through $(1, 2)$ and $(3, 8)$.", answer: 3, skill: "Slope",
        near: [{ v: 1 / 3, fb: "Slope is rise over run: the change in $y$ goes on top." }, { v: 6, fb: "That is the rise. Divide by the run, $3 - 1 = 2$." }],
        hints: ["$\\frac{8 - 2}{3 - 1}$."], why: "$\\frac{6}{2} = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Drag the two points along the graph of $f(x) = (x - 2)^2$. The line through them shows the **average rate of change**. Can you find two points where it is **zero**?",
        scene: { type: "sketch", x: [-1, 5], y: [-1, 6], u: 36, w: 330, gate: true,
          pts: { A: { at: [0, 4], drag: true, c: "orange", snap: 1, say: "First point", on: { fn: function (p) { var x = Math.max(0, Math.min(4, Math.round(p[0]))); return [x, SQ10(x)]; } } },
                 B: { at: [3, 1], drag: true, c: "blue", snap: 1, say: "Second point", on: { fn: function (p) { var x = Math.max(0, Math.min(4, Math.round(p[0]))); return [x, SQ10(x)]; } } } },
          track: function (s) { return s.A[0] !== s.B[0] && s.A[1] === s.B[1] ? "zero" : null; },
          draw: function (s) {
            var a = s.A[0] <= s.B[0] ? s.A : s.B, b = s.A[0] <= s.B[0] ? s.B : s.A, items = curve(SQ10, -1, 5, "soft", [-1, 6]);
            if (a[0] !== b[0]) items.push({ line: [a, b], c: "green", bare: true }, { steps: [a, b], c: "ink" });
            return items;
          },
          readout: function (s) {
            var a = s.A[0] <= s.B[0] ? s.A : s.B, b = s.A[0] <= s.B[0] ? s.B : s.A;
            if (a[0] === b[0]) return "Put the points on **different** inputs.";
            var dy = b[1] - a[1], dx = b[0] - a[0];
            return "$\\frac{f(" + nm(b[0]) + ") - f(" + nm(a[0]) + ")}{" + nm(b[0]) + " - " + nm(a[0]) + "} = \\frac{" + nm(dy) + "}{" + nm(dx) + "} = " + nm(r2(dy / dx)) + "$<br>" + (s.tracked.zero ? "✓ " : "· ") + "found a rate of 0";
          },
          goal: function (s) { return !!s.tracked.zero; } },
        gate: true, then: "$f(0) = 4$ and $f(4) = 4$: the output ends where it began, so on average it did not change: the line is **flat**." },
      { type: "learn", kicker: "The idea",
        prompt: "The **average rate of change** of $f$ from $x = a$ to $x = b$ is $\\dfrac{f(b) - f(a)}{b - a}$: output change over input change. It is the **slope of the line** through the two points.",
        scene: { type: "method", how: HOW_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the average rate of change of $f(x) = x^2$ from $x = 1$ to $x = 3$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "f(1) = 1 \\quad f(3) = 9", say: "Square each input.", fig: plot("The parabola y = x squared with the points (1, 1) and (3, 9) joined by a line.", [{ f: function (x) { return x * x; }, a: -1, b: 3.2, c: "soft", yr: [-1, 10] }], [dot(1, 1, "blue", "(1, 1)", "se"), dot(3, 9, "orange", "(3, 9)", "nw"), { line: [[1, 1], [3, 9]], c: "green", bare: true }], { x: [-1, 4], y: [-1, 10], u: 22 }) },
          { step: 2, m: "f(3) - f(1) = 9 - 1 = 8", say: "The change in output.",
            ask: { prompt: "What is the change in input, from 1 to 3?", answer: 0, options: [{ t: "$3 - 1 = 2$" }, { t: "$3 + 1 = 4$", fb: "A change is a **difference**: subtract." }] } },
          { step: 2, m: "3 - 1 = 2", say: "The change in input." },
          { step: 3, m: "\\frac{8}{2} = 4", say: "On average, $f$ rises 4 for every 1 step to the right." }] },
        gate: true, then: "It is the slope of the green line: **4**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do the average rate of change of $g(x) = 2x^2 - 1$ from $x = 1$ to $x = 4$.",
        how: HOW_10, skill: "Average rate of change",
        steps: [
          { step: 1, ask: "What is $g(1)$?", type: "num", pre: "$g(1) =$", answer: 1, near: [{ v: 2, fb: "$2(1)^2 - 1 = 2 - 1 = 1$." }], hint: "$2(1)^2 - 1$.", m: "g(1) = 1", say: "$2 \\cdot 1 - 1$." },
          { step: 1, ask: "What is $g(4)$?", type: "num", pre: "$g(4) =$", answer: 31, near: [{ v: 63, fb: "Square first: $4^2 = 16$, then $2(16) - 1$." }], hint: "$2(16) - 1$.", m: "g(4) = 31", say: "$2 \\cdot 16 - 1$." },
          { step: 2, ask: "What is the change in output, $g(4) - g(1)$?", type: "num", pre: "$\\Delta g =$", answer: 30, near: [{ v: 32, fb: "$31 - 1 = 30$." }], hint: "$31 - 1$.", m: "31 - 1 = 30", say: "How far the output moved." },
          { step: 3, ask: "Divide by the change in input, $4 - 1 = 3$.", type: "num", pre: "$\\text{rate} =$", answer: 10, near: [{ v: 30, fb: "Divide the 30 by 3." }], hint: "$30 \\div 3$.", m: "\\frac{30}{3} = 10", say: "On average, $g$ rises 10 per step." }],
        why: "Outputs, changes, divide. Now do one from a table." },
      { type: "num", kicker: "On your own", prompt: "A car's distance in metres: $d(2) = 10$ and $d(5) = 40$. What is its average speed from $t = 2$ to $t = 5$ seconds?", pre: "speed =", post: "m/s", answer: 10, skill: "Average rate of change",
        near: [{ v: 30, fb: "That is the change in distance. Divide by the 3 seconds." }, { v: 4, fb: "Divide the change in distance by the change in time: $\\frac{30}{3}$." }],
        hints: ["$\\frac{40 - 10}{5 - 2}$."], why: "$\\frac{30}{3} = 10$ metres per second." },
      { type: "learn", kicker: "A harder case",
        prompt: "Make the second input **a letter**. Find the average rate of change of $f(x) = x^2$ from $x = 3$ to $x = 3 + h$.",
        scene: { type: "walk", how: HOW_10, rows: [
          { step: 1, m: "f(3 + h) = (3 + h)^2 = 9 + 6h + h^2", say: "Square the whole input, in brackets.", ask: { prompt: "What is $(3 + h)^2$ when multiplied out?", answer: 0, options: [{ t: "$9 + 6h + h^2$" }, { t: "$9 + h^2$", fb: "There is a middle term: $2 \\cdot 3 \\cdot h = 6h$." }] } },
          { step: 1, m: "f(3) = 9", say: "The first output." },
          { step: 2, m: "f(3 + h) - f(3) = 6h + h^2", say: "The 9s cancel." },
          { step: 2, m: "(3 + h) - 3 = h", say: "The change in input is just $h$." },
          { step: 3, m: "\\frac{6h + h^2}{h} = 6 + h", say: "Divide every term by $h$." }] },
        gate: true, then: "$6 + h$: as $h$ gets smaller, the rate gets closer to **6**. That idea becomes the **derivative**, at the end of the course." },
      { type: "num", kicker: "Try it", prompt: "$f(2) = 7$ and $f(6) = -1$. What is the average rate of change from 2 to 6?", answer: -2, skill: "Average rate of change",
        near: [{ v: 2, fb: "The output went **down**: the rate is negative." }, { v: -0.5, fb: "Put the change in output on top: $\\frac{-8}{4}$." }],
        hints: ["$\\frac{-1 - 7}{6 - 2}$."], why: "$\\frac{-8}{4} = -2$: on average it falls 2 for each step." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Mo finds the average rate of change of $f(x) = x^2$ from 1 to 3. Tap the line where the work **first** goes wrong.",
        lines: ["f(3) - f(1) = 9 - 1 = 8", "\\text{change in input: } 3 + 1 = 4", "\\frac{8}{4} = 2"], answer: 1, fix: "\\text{change in input: } 3 - 1 = 2",
        fb: { 0: "$9 - 1 = 8$ is right.", 2: LATER }, skill: "Average rate of change", hints: ["How do you find a change?"], why: "A change is a subtraction: $3 - 1 = 2$, and $\\frac{8}{2} = 4$." },
      { type: "num", kicker: "Use it", prompt: "A town had 12 thousand people in 2010 and 15 thousand in 2020. What is the average growth per year, in people?", post: "people per year", answer: 300, skill: "Average rate of change",
        near: [{ v: 3, fb: "That is 3 thousand over 10 years: $\\frac{3000}{10}$ people, not 3." }, { v: 3000, fb: "That is the total growth. Divide by 10 years." }],
        hints: ["Growth: $15000 - 12000$. Time: $2020 - 2010$."], why: "$\\frac{3000}{10} = 300$ people per year." }
    ]
  });

  /* ============================================ 11 · Increasing, decreasing and turning points */
  var HOW_11 = [["Left to right", "Move along the graph from left to right. Is it rising, falling or flat?"],
                ["Mark the turns", "Mark each point where it switches between rising and falling."],
                ["Name them", "Write each rising or falling stretch as an interval of $x$."]];
  var CB11 = function (x) { return x * x * x - 3 * x; };
  var PL11 = pw([[-4, 0], [-2, 3], [0, 1], [2, 4], [4, -2]]);
  function plFig(alt, extra) { return grid(alt, curve(PL11, -4, 4, "blue", [-4, 6]).concat(extra || []), { x: [-5, 5], y: [-3, 5], u: 22 }); }
  LESSONS.push({
    title: "Increasing, decreasing and turning points", art: "fxinc",
    blurb: "Book 1.3 · Where a graph rises and falls, and its highest and lowest points.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Reading left to right, a line with slope $-2$ is…",
        options: [{ t: "falling" }, { t: "rising", fb: "A negative slope goes **down** as $x$ grows." }],
        answer: 0, skill: "Slope", hints: ["Negative slope: down."], why: "Slope $-2$: the line falls 2 for each step right." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the point along $f(x) = x^3 - 3x$. The curve is **green** where it rises and **red** where it falls. Find the **two** places where it turns.",
        scene: { type: "sketch", x: [-3, 3], y: [-3, 3], u: 40, w: 330, gate: true,
          pts: { P: { at: [0, 0], drag: true, c: "orange", snap: 0.5, say: "The input", on: { fn: function (p) { var x = Math.max(-2, Math.min(2, Math.round(p[0] * 2) / 2)); return [x, CB11(x)]; } } } },
          track: function (s) { return Math.abs(3 * s.P[0] * s.P[0] - 3) < 1e-9 ? "t" + s.P[0] : null; },
          draw: function (s) {
            var x = s.P[0], m = 3 * x * x - 3;
            return curve(CB11, -2.2, -1, "green", [-3, 3]).concat(curve(CB11, -1, 1, "red", [-3, 3]), curve(CB11, 1, 2.2, "green", [-3, 3]),
              [{ seg: [[x - 0.6, CB11(x) - 0.6 * m], [x + 0.6, CB11(x) + 0.6 * m]], c: "ink" }]);
          },
          readout: function (s) { var x = s.P[0], m = 3 * x * x - 3; return "$x = " + nm(x) + "$: " + (Math.abs(m) < 1e-9 ? "**flat: a turning point!**" : m > 0 ? "rising ↗" : "falling ↘") + "<br>" + (s.tracked["t-1"] ? "✓ " : "· ") + "one turn &nbsp;&nbsp; " + (s.tracked.t1 ? "✓ " : "· ") + "the other"; },
          goal: function (s) { return s.tracked["t-1"] && s.tracked.t1; } },
        gate: true, then: "At $x = -1$ it stops rising and starts falling: a **local maximum**. At $x = 1$ it stops falling and starts rising: a **local minimum**." },
      { type: "learn", kicker: "The idea",
        prompt: "A function is **increasing** where its graph rises as $x$ grows, and **decreasing** where it falls. A **turning point** is a **local maximum** (a peak) or **local minimum** (a valley).",
        scene: { type: "method", how: HOW_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Describe the graph of $f(x) = -x^2 + 4x$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "\\text{rises, then falls}", say: "Left to right, it climbs for a while and then drops.", fig: plot("The parabola y = 4x minus x squared, rising to its top at (2, 4) and falling after.", [{ f: function (x) { return 4 * x - x * x; }, a: -0.5, b: 4.5, c: "blue", yr: [-3, 5] }], [], { x: [-1, 5], y: [-3, 5], u: 24 }) },
          { step: 2, m: "\\text{turn at } (2,\\ 4)", say: "The top of the hill: a local maximum, with value 4.", fig: plot("The same parabola with its top at (2, 4) marked.", [{ f: function (x) { return 4 * x - x * x; }, a: -0.5, b: 4.5, c: "blue", yr: [-3, 5] }], [dot(2, 4, "orange", "(2, 4)", "n")], { x: [-1, 5], y: [-3, 5], u: 24 }),
            ask: { prompt: "What is the local maximum **value**?", answer: 0, options: [{ t: "$4$ (the height)" }, { t: "$2$", fb: "2 is **where** it happens, the input. The value is the height." }] } },
          { step: 3, m: "\\text{increasing on } (-\\infty,\\ 2)", say: "Rising before $x = 2$." },
          { step: 3, m: "\\text{decreasing on } (2,\\ \\infty)", say: "Falling after it. The turning point itself is in neither interval." }] },
        gate: true, then: "Increasing and decreasing intervals are **intervals of $x$**, written with round brackets around the turn." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $f(x) = x^3 - 3x$. Its turns are at $x = -1$ and $x = 1$.",
        how: HOW_11, skill: "Increasing and decreasing",
        steps: [
          { step: 1, ask: "Far to the left, is it rising or falling?", type: "choice", answer: 0, options: [{ t: "Rising" }, { t: "Falling", fb: "Look at the green part on the left of the Explore: it climbs." }], m: "\\text{left: rising}", say: "Climbing up to the first turn." },
          { step: 2, ask: "Which point is the local **maximum**?", type: "choice", answer: 0, options: [{ t: "$x = -1$: rising then falling" }, { t: "$x = 1$", fb: "At $x = 1$ it falls then rises: a valley, a minimum." }], m: "\\text{local max at } x = -1", say: "A peak." },
          { step: 3, ask: "Where is it **decreasing**?", type: "choice", answer: 0, options: [{ t: "$(-1,\\ 1)$" }, { t: "$(-\\infty,\\ -1) \\cup (1,\\ \\infty)$", fb: "Those are the rising parts." }], m: "\\text{decreasing on } (-1,\\ 1)", say: "Between the peak and the valley." }],
        why: "Left to right, mark the turns, name the stretches. Now a graph with three turns." },
      { type: "multi", kicker: "On your own", prompt: "Use the graph. On which intervals is $f$ **increasing**?", art: plFig("A graph that rises from (-4, 0) to (-2, 3), falls to (0, 1), rises to (2, 4), then falls to (4, -2)."),
        options: [{ t: "$(-4,\\ -2)$", ok: true }, { t: "$(0,\\ 2)$", ok: true }, { t: "$(-2,\\ 0)$", fb: "From $x = -2$ to $0$ the graph falls." }, { t: "$(2,\\ 4)$", fb: "It falls from $(2, 4)$ down to $(4, -2)$." }],
        skill: "Increasing and decreasing", hints: ["Go left to right and mark each turn: $x = -2$, $0$ and $2$."], why: "It rises on $(-4, -2)$ and $(0, 2)$, and falls on $(-2, 0)$ and $(2, 4)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The highest and lowest points of the whole graph are **absolute** maximum and minimum. They can sit at an **end**. Find them for the graph from $x = -4$ to $x = 4$.",
        scene: { type: "walk", how: HOW_11, rows: [
          { step: 1, m: "\\text{highest height: } 4", say: "Scan the whole graph for its tallest point.", fig: plFig("The graph with its highest point (2, 4) marked.", [dot(2, 4, "green", "(2, 4)", "n")]) },
          { step: 2, m: "\\text{lowest height: } -2, \\ \\text{at the end } x = 4", say: "The deepest point is the right-hand end, not a valley.", fig: plFig("The graph with its highest point (2, 4) and its lowest point (4, -2) marked.", [dot(2, 4, "green", "(2, 4)", "n"), dot(4, -2, "red", "(4, -2)", "s")]),
            ask: { prompt: "Is the lowest point a **turning point**?", answer: 0, options: [{ t: "No: it is where the graph ends" }, { t: "Yes", fb: "A turning point is where the graph changes direction. At the end it just stops." }] } },
          { step: 3, m: "\\text{absolute max } 4 \\quad \\text{absolute min } -2", say: "Local peaks at $x = -2$ and $x = 2$; the biggest is at 2." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "For the same graph, the **local minimum** is at…",
        art: plFig("The graph again."),
        options: [{ t: "$x = 0$" }, { t: "$x = -2$", fb: "At $x = -2$ the graph peaks: a local maximum." }, { t: "$x = 4$", fb: "$x = 4$ is the end of the graph, not a valley." }],
        answer: 0, skill: "Increasing and decreasing", hints: ["A valley: falling, then rising."], why: "At $x = 0$ the graph stops falling and starts rising." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dev says the graph above is increasing on $[\\,-4,\\ 0\\,]$, because $f(-4) = 0$ is less than $f(0) = 1$. What is wrong?",
        options: [{ t: "In between, it rises and then **falls**. Increasing means rising the whole way." }, { t: "Nothing is wrong.", fb: "Comparing only the two ends hides the dip: from $x = -2$ to $0$ the graph falls." }, { t: "It should be $(\\,-4,\\ 4\\,)$.", fb: "It is not rising all the way to 4." }],
        answer: 0, skill: "Increasing and decreasing", hints: ["Check the middle of the interval."], why: "It only rises on $(-4, -2)$." },
      { type: "choice", kicker: "Use it", prompt: "A shop's profit $P(t)$ rises until month 6 and then falls. In which month is profit highest?",
        options: [{ t: "Month 6: the turning point (a maximum)" }, { t: "Month 1", fb: "Profit is still climbing then." }, { t: "The last month", fb: "It is falling by then." }],
        answer: 0, skill: "Increasing and decreasing", hints: ["Where does it stop rising?"], why: "Rising then falling: the peak is at the turn, month 6." }
    ]
  });

  /* ============================================================ 12 · Combining functions */
  var HOW_12 = [["Name it", "Write what you want: $(f + g)(x)$ means $f(x) + g(x)$. The same for $-$, $\\times$ and $\\div$."],
                ["Substitute", "Put each formula in, in brackets."],
                ["Simplify", "Combine like terms. For a quotient, note any input that makes the bottom 0."]];
  var F12 = function (x) { return x / 2 + 1; }, G12 = function (x) { return x * x / 4; };
  LESSONS.push({
    title: "Combining functions", art: "fxcomb",
    blurb: "Book 1.4 · Add, subtract, multiply and divide functions to make new ones.",
    mins: 12, v: 1,
    steps: [
      { type: "expr", kicker: "Warm up", prompt: "Simplify $(2x + 3) + (x - 5)$.", answer: "3x-2", shown: "3x - 2", form: "simplified", skill: "Combine like terms", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "3x+8", fb: "$3 + (-5) = -2$, not $+8$." }],
        hints: ["$2x + x$, and $3 - 5$."], why: "$3x - 2$." },
      { type: "learn", kicker: "Explore",
        prompt: "$f$ is blue and $g$ is orange. Slide the point. Their **heights stack** to make $f + g$, the green curve. Look at four inputs.",
        scene: { type: "sketch", x: [-5, 5], y: [-2, 8], u: 30, w: 320, gate: true,
          pts: { P: { at: [0, 1], drag: true, c: "orange", snap: 2, say: "The input", on: { fn: function (p) { var x = Math.max(-4, Math.min(4, Math.round(p[0] / 2) * 2)); return [x, F12(x) + G12(x)]; } } } },
          track: function (s) { return "x" + s.P[0]; },
          draw: function (s) {
            var x = s.P[0], f = F12(x), g = G12(x);
            return curve(F12, -5, 5, "blue", [-2, 8]).concat(curve(G12, -5, 5, "orange", [-2, 8]), curve(function (t) { return F12(t) + G12(t); }, -5, 5, "green", [-2, 8]),
              [{ seg: [[x, 0], [x, f]], c: "blue" }, { seg: [[x, f], [x, f + g]], c: "orange" }]);
          },
          readout: function (s) { var x = s.P[0]; return "$f(" + nm(x) + ") + g(" + nm(x) + ") = " + nm(F12(x)) + " + " + nm(G12(x)) + " = " + nm(F12(x) + G12(x)) + "$<br>Looked at " + Math.min(Object.keys(s.tracked).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 4; } },
        gate: true, then: "At every input, the green height is the blue height plus the orange height. That is $(f + g)(x) = f(x) + g(x)$." },
      { type: "learn", kicker: "The idea",
        prompt: "Functions combine the way numbers do: $(f + g)(x) = f(x) + g(x)$, and the same for $-$, $\\cdot$ and $\\div$. Work it out at one input, **or** write a new formula.",
        scene: { type: "method", how: HOW_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Let $f(x) = x + 2$ and $g(x) = x - 3$. Watch $(f \\cdot g)(x)$ found.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "(f \\cdot g)(x) = f(x) \\cdot g(x)", say: "A product of functions is the product of their outputs." },
          { step: 2, m: "(f \\cdot g)(x) = (x + 2)(x - 3)", say: "Each formula goes in brackets.", ask: { prompt: "Why the brackets?", answer: 0, options: [{ t: "So each formula is multiplied as a whole" }, { t: "They change the answer", fb: "They only keep each formula together, so the multiplication covers all of it." }] } },
          { step: 3, m: "= x^2 - 3x + 2x - 6", say: "Multiply each term by each term." },
          { step: 3, m: "= x^2 - x - 6", say: "Combine $-3x + 2x$." }] },
        gate: true, then: "$(f \\cdot g)(x) = x^2 - x - 6$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $(f - g)(x)$ for $f(x) = 2x + 1$ and $g(x) = x^2 - 3$.",
        how: HOW_12, skill: "Combine functions",
        steps: [
          { step: 1, ask: "What does $(f - g)(x)$ mean?", type: "choice", answer: 0, options: [{ t: "$f(x) - g(x)$" }, { t: "$f(x) \\cdot g(x)$", fb: "A minus sign between them means subtract." }], m: "(f - g)(x) = f(x) - g(x)", say: "Subtract the outputs." },
          { step: 2, ask: "Which line puts them in correctly?", type: "choice", answer: 0, options: [{ t: "$(2x + 1) - (x^2 - 3)$" }, { t: "$2x + 1 - x^2 - 3$", fb: "The minus must apply to **all** of $g$, so $g$ needs brackets." }], m: "(2x + 1) - (x^2 - 3)", say: "Brackets around $g$: the minus reaches both terms." },
          { step: 3, ask: "Removing the brackets, what is the constant term?", type: "num", pre: "constant =", answer: 4, near: [{ v: -2, fb: "$-(-3)$ is $+3$, so $1 + 3 = 4$." }], hint: "$1 - (-3)$.", m: "= -x^2 + 2x + 4", say: "$x^2$ becomes $-x^2$ and $-3$ becomes $+3$." }],
        why: "Name it, substitute in brackets, simplify. Now you try." },
      { type: "expr", kicker: "On your own", prompt: "For $f(x) = 3x - 1$ and $g(x) = x^2 + 4$, find $(f + g)(x)$.", answer: "x^2+3x+3", shown: "x^2 + 3x + 3", form: "simplified", skill: "Combine functions", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "x^2+3x-5", fb: "$-1 + 4 = 3$." }], hints: ["$(3x - 1) + (x^2 + 4)$."], why: "$3x - 1 + x^2 + 4 = x^2 + 3x + 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A quotient has a catch. For $f(x) = x + 2$ and $g(x) = x - 3$, find $\\left(\\dfrac{f}{g}\\right)(x)$ and say which input is **not allowed**.",
        scene: { type: "walk", how: HOW_12, rows: [
          { step: 1, m: "\\left(\\frac{f}{g}\\right)(x) = \\frac{f(x)}{g(x)}", say: "A quotient is the quotient of the outputs." },
          { step: 2, m: "\\left(\\frac{f}{g}\\right)(x) = \\frac{x + 2}{x - 3}", say: "Substitute. This cannot be simplified." },
          { step: 3, m: "g(x) = 0 \\ \\text{when} \\ x = 3", say: "The bottom must not be 0.", ask: { prompt: "Which input is not allowed?", answer: 0, options: [{ t: "$x = 3$" }, { t: "$x = -2$", fb: "At $x = -2$ the **top** is 0, which is fine. It is the bottom that matters." }] } },
          { step: 3, m: "x \\ne 3", say: "$(f/g)(3)$ does not exist, even though $f(3)$ and $g(3)$ both do." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "$f(x) = x^2 + 1$ and $g(x) = 2x - 3$. Find $(f \\cdot g)(2)$.", answer: 5, skill: "Combine functions",
        near: [{ v: 10, fb: "$g(2) = 2(2) - 3 = 1$, not 2." }, { v: 6, fb: "That is the **sum** $f(2) + g(2)$. Multiply them." }],
        hints: ["$f(2) = 5$ and $g(2) = 1$."], why: "$f(2) = 5$, $g(2) = 1$, so the product is 5." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Mia finds $(f - g)(x)$ for $f(x) = 5x + 2$ and $g(x) = 3x - 4$. Tap the line where the work **first** goes wrong.",
        lines: ["(f - g)(x) = (5x + 2) - (3x - 4)", "= 5x + 2 - 3x - 4", "= 2x - 2"], answer: 1, fix: "= 5x + 2 - 3x + 4",
        fb: { 0: GIVEN, 2: LATER }, skill: "Combine functions", hints: ["What happens to $-4$ when a minus sign sits in front of the brackets?"], why: "$-(3x - 4) = -3x + 4$. So the result is $2x + 6$." },
      { type: "num", kicker: "Use it", prompt: "A stall's revenue is $R(x) = 12x$ and its cost is $C(x) = 5x + 40$ for $x$ items. What is the profit $(R - C)(10)$?", pre: "profit =", post: "dollars", answer: 30, skill: "Combine functions",
        near: [{ v: 120, fb: "That is only the revenue. Subtract the cost, $C(10) = 90$." }, { v: 90, fb: "That is the cost. Profit is revenue minus cost." }],
        hints: ["$R(10) = 120$ and $C(10) = 90$."], why: "$120 - 90 = 30$ dollars." }
    ]
  });
  /* ============================================================ 13 · Composition of functions */
  var HOW_13 = [["Inside first", "Work out the inside function, $g$, for your input."],
                ["Feed it in", "Use that result as the input of the outside function, $f$."],
                ["Finish", "Work out the final result."]];
  var G13 = function (x) { return x + 3; }, F13 = function (x) { return 2 * x; };
  LESSONS.push({
    title: "Composition of functions", art: "fxcomp",
    blurb: "Book 1.4 · Feed the output of one function into another: $f(g(x))$.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Let $f(x) = 2x + 1$. Find $f(3)$.", pre: "$f(3) =$", answer: 7, skill: "Evaluate a function",
        near: [{ v: 6, fb: "Double 3, then add 1: $2(3) + 1 = 7$." }], hints: ["$2(3) + 1$."], why: "$f(3) = 6 + 1 = 7$." },
      { type: "learn", kicker: "Explore",
        prompt: "Two machines in a row. Slide the input along the number line. Then switch the **order** of the machines and try the same input.",
        scene: { type: "sketch", x: [-5, 14], y: [-3.4, 2.8], u: 23, w: 480, grid: false, gate: true,
          pts: { P: { at: [2, -2.4], drag: true, c: "orange", say: "The input", on: { fn: function (p) { return [Math.max(-4, Math.min(4, Math.round(p[0]))), -2.4]; } } } },
          chips: { order: { label: "Order", v: "gf", opts: [["gf", "$g$ first, then $f$"], ["fg", "$f$ first, then $g$"]] } },
          draw: function (s) {
            var v = s.P[0], gf = s.c.order === "gf", a = gf ? G13 : F13, b = gf ? F13 : G13, m = a(v), o = b(m), items = chainItems(nm(v), gf ? "x + 3" : "2x", nm(m), gf ? "2x" : "x + 3", nm(o));
            items.push({ word: gf ? "g" : "f", at: [0, 2.2], c: "ink" }, { word: gf ? "f" : "g", at: [8.6, 2.2], c: "ink" }, { seg: [[-4, -2.4], [4, -2.4]], c: "soft" });
            for (var t = -4; t <= 4; t++) { items.push({ seg: [[t, -2.25], [t, -2.55]], c: "soft" }); items.push({ text: String(t), at: [t, -3.05], eq: true, c: "soft" }); }
            return items;
          },
          readout: function (s) { var v = s.P[0], gf = s.c.order === "gf"; return gf ? "$f(g(" + nm(v) + ")) = f(" + nm(G13(v)) + ") = " + nm(F13(G13(v))) + "$" : "$g(f(" + nm(v) + ")) = g(" + nm(F13(v)) + ") = " + nm(G13(F13(v))) + "$"; },
          goal: function (s) { return Object.keys(s.seen.order).length >= 2; } },
        gate: true, then: "The same input gives **different** answers. The order matters: $f(g(x))$ and $g(f(x))$ are usually not the same." },
      { type: "learn", kicker: "The idea",
        prompt: "**Composition** feeds the output of one function into another. $(f \\comp g)(x) = f(g(x))$: do $g$ first, then $f$. Read $f \\comp g$ as “$f$ **of** $g$”.",
        scene: { type: "method", how: HOW_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Let $f(x) = x^2$ and $g(x) = 3x - 2$. Watch $f(g(2))$ found.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "g(2) = 3(2) - 2 = 4", say: "The inside function first. Its input is 2.", fig: chainfig("The input 2 goes into the machine 3x minus 2 and comes out as 4.", "2", "3x − 2", "4", "x²", "?") },
          { step: 2, m: "f(g(2)) = f(4)", say: "The 4 is now the input of $f$.", fig: chainfig("The 4 goes into the machine x squared.", "2", "3x − 2", "4", "x²", "?"),
            ask: { prompt: "What is the input of $f$?", answer: 0, options: [{ t: "$4$: the output of $g$" }, { t: "$2$", fb: "2 was the input of $g$. $f$ receives what $g$ produced." }] } },
          { step: 3, m: "f(4) = 4^2 = 16", say: "Square it.", fig: chainfig("The 4 comes out of x squared as 16.", "2", "3x − 2", "4", "x²", "16") }] },
        gate: true, then: "$f(g(2)) = 16$: the input 2 became 4, then 16." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find $f(g(-2))$ for $f(x) = x + 5$ and $g(x) = x^2 - 1$.",
        how: HOW_13, skill: "Composition of functions",
        steps: [
          { step: 1, ask: "Inside first. What is $g(-2)$?", type: "num", pre: "$g(-2) =$", answer: 3, near: [{ v: -5, fb: "$(-2)^2 = +4$, so $4 - 1 = 3$." }], hint: "$(-2)^2 - 1$.", m: "g(-2) = (-2)^2 - 1 = 3", say: "A negative input goes in brackets." },
          { step: 2, ask: "What is the input of $f$ now?", type: "choice", answer: 0, options: [{ t: "$3$" }, { t: "$-2$", fb: "$-2$ went into $g$. $f$ gets $g$'s output." }], m: "f(g(-2)) = f(3)", say: "The output of $g$." },
          { step: 3, ask: "Finish: $f(3) = 3 + 5$.", type: "num", pre: "$f(3) =$", answer: 8, near: [{ v: 3, fb: "$f$ adds 5: $3 + 5$." }], hint: "$3 + 5$.", m: "f(3) = 8", say: "So $f(g(-2)) = 8$." }],
        why: "Inside first, feed it in, finish. Now the other order." },
      { type: "num", kicker: "On your own", prompt: "$f(x) = 3x - 1$ and $g(x) = x^2 + 2$. Find $(g \\comp f)(2)$.", answer: 27, skill: "Composition of functions",
        near: [{ v: 17, fb: "That is $f(g(2))$. In $(g \\comp f)(2)$ the **inside** function is $f$: $f(2) = 5$ first." }],
        hints: ["$f(2) = 5$. Then $g(5)$."], why: "$f(2) = 3(2) - 1 = 5$, then $g(5) = 25 + 2 = 27$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Now with a **letter**. Let $f(x) = 2x + 1$ and $g(x) = x^2$. Find a formula for $f(g(x))$.",
        scene: { type: "walk", how: HOW_13, rows: [
          { step: 1, m: "g(x) = x^2", say: "The inside function, left as it is." },
          { step: 2, m: "f(g(x)) = f(x^2)", say: "The whole $x^2$ is the input of $f$.",
            ask: { prompt: "What replaces $x$ in $2x + 1$?", answer: 0, options: [{ t: "$x^2$" }, { t: "$2x$", fb: "$g$'s output is $x^2$. That goes where $x$ was." }] } },
          { step: 3, m: "f(x^2) = 2(x^2) + 1", say: "Replace $x$ in $f$'s rule." },
          { step: 3, m: "f(g(x)) = 2x^2 + 1", say: "A new function of $x$." }] },
        gate: true, then: "$f(g(x)) = 2x^2 + 1$. The other order, $g(f(x))$, will be different." },
      { type: "choice", kicker: "Try it", prompt: "For the same $f(x) = 2x + 1$ and $g(x) = x^2$, what is $g(f(x))$?",
        options: [{ t: "$4x^2 + 4x + 1$" }, { t: "$4x^2 + 1$", fb: "$(2x + 1)^2$ has a middle term: $2 \\cdot 2x \\cdot 1 = 4x$." }, { t: "$2x^2 + 1$", fb: "That is $f(g(x))$, the other order." }],
        answer: 0, skill: "Composition of functions", hints: ["Put $2x + 1$ into $x^2$: $(2x + 1)^2$."], why: "$g(f(x)) = (2x + 1)^2 = 4x^2 + 4x + 1$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Ella finds $f(g(1))$ for $f(x) = x + 2$ and $g(x) = 3x$. Tap the line where the work **first** goes wrong.",
        lines: ["g(1) = 3(1) = 3", "f(g(1)) = f(1)", "f(1) = 1 + 2 = 3"], answer: 1, fix: "f(g(1)) = f(3)",
        fb: { 0: "$g(1) = 3$ is right.", 2: LATER }, skill: "Composition of functions", hints: ["What is the input of $f$?"], why: "$f$'s input is $g(1) = 3$, not 1. So $f(3) = 5$." },
      { type: "num", kicker: "Use it", prompt: "A 40-dollar jacket is **25 per cent off**: $d(p) = 0.75p$. Then **10 per cent tax** is added: $t(p) = 1.1p$. What is the final price, $t(d(40))$?", pre: "price =", post: "dollars", answer: 33, skill: "Composition of functions",
        near: [{ v: 30, fb: "That is after the discount only. Now add the tax: $t(30)$." }, { v: 34, fb: "$t(30) = 1.1 \\cdot 30 = 33$." }],
        hints: ["$d(40) = 30$. Then $t(30)$."], why: "$d(40) = 30$, then $t(30) = 33$ dollars." }
    ]
  });

  /* ================================================ 14 · Composites from tables and graphs */
  var HOW_14 = [["Inner input", "Find your input in the **inner** function's table or graph."],
                ["Inner output", "Read its output. That number becomes the input of the outer function."],
                ["Outer output", "Find that number in the **outer** function and read its output."]];
  var G14 = { 1: 3, 2: 1, 3: 4, 4: 2 }, F14 = { 1: 4, 2: 2, 3: 1, 4: 3 };
  var GP = pw([[0, 2], [1, 3], [2, 1], [3, 0]]), FP = pw([[0, 1], [1, 2], [2, 0], [3, 4]]);
  var GFP = function (alt) { return grid(alt, curve(GP, 0, 3, "blue", [-1, 5]).concat(curve(FP, 0, 3, "orange", [-1, 5]), [{ text: "g", at: [0.45, 2.6], c: "blue", eq: true }, { text: "f", at: [2.65, 3.4], c: "orange", eq: true }]), { x: [-1, 4], y: [-1, 5], u: 30 }); };
  LESSONS.push({
    title: "Composites from tables and graphs", art: "fxtab",
    blurb: "Book 1.4 · Evaluate $f(g(x))$ when you have tables or graphs instead of formulas.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$g$ is given by this table. Find $g(3)$." + tbl(["$x$", "$g(x)$"], [[1, 3], [2, 1], [3, 4], [4, 2]]), pre: "$g(3) =$", answer: 4, skill: "Read a table or graph",
        near: [{ v: 3, fb: "3 is the input. Read the $g(x)$ row." }], hints: ["Find 3 in the $x$ row."], why: "Below $x = 3$ the table says 4." },
      { type: "learn", kicker: "Explore",
        prompt: "Tap an input on the left and follow it through $g$ and then $f$. Try **three** different inputs.",
        scene: { type: "sketch", x: [-6, 6], y: [-2.4, 3.4], u: 30, w: 340, grid: false, gate: true, pts: {}, maxSel: 1,
          taps: { k1: { at: [CH3.xs[0], CH3.ys[0]], label: "1", c: "blue", r: 13, say: "Input 1" }, k2: { at: [CH3.xs[0], CH3.ys[1]], label: "2", c: "blue", r: 13, say: "Input 2" }, k3: { at: [CH3.xs[0], CH3.ys[2]], label: "3", c: "blue", r: 13, say: "Input 3" }, k4: { at: [CH3.xs[0], CH3.ys[3]], label: "4", c: "blue", r: 13, say: "Input 4" } },
          track: function (s) { return s.selList[0] || null; },
          draw: function (s) { return chain3Items(G14, F14, s.selList.length ? +s.selList[0].slice(1) : null, 2, true); },
          readout: function (s) { if (!s.selList.length) return "Tap an input on the left.<br>Tried " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; var k = +s.selList[0].slice(1); return "$g(" + k + ") = " + G14[k] + "$, then $f(" + G14[k] + ") = " + F14[G14[k]] + "$, so $f(g(" + k + ")) = " + F14[G14[k]] + "$<br>Tried " + Math.min(Object.keys(s.tracked).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.tracked).length >= 3; } },
        gate: true, then: "Every path goes **through the middle column**: the output of $g$ is the input of $f$." },
      { type: "learn", kicker: "The idea",
        prompt: "With tables or graphs, composing is **looking up twice**. The output you read from the inner function is the input you look up in the outer one.",
        scene: { type: "method", how: HOW_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "Use the two tables. Watch $f(g(2))$ found.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "x = 2 \\ \\text{in the table of } g", say: "Start with the input 2, in $g$.", fig: chain3("The input 2 on the left of three columns.", G14, F14, 2, 0) },
          { step: 2, m: "g(2) = 1", say: "Read across: $g$ turns 2 into 1. Now 1 is the input of $f$.", fig: chain3("An arrow from 2 to 1 in the middle column.", G14, F14, 2, 1),
            ask: { prompt: "What do we look up in the $f$ table?", answer: 0, options: [{ t: "$1$" }, { t: "$2$", fb: "$f$ receives what $g$ produced, which is 1." }] } },
          { step: 3, m: "f(1) = 4", say: "In $f$'s table, 1 goes to 4.", fig: chain3("The arrow continues from 1 to 4.", G14, F14, 2, 2) },
          { step: 3, m: "f(g(2)) = 4", say: "Two lookups, one answer." }] },
        gate: true, then: "$f(g(2)) = 4$." },
      { type: "guided", kicker: "Together",
        prompt: "Now graphs. $g$ is blue and $f$ is orange. Find $f(g(1))$." + GFP("The graph of g, blue, through (0, 2), (1, 3), (2, 1) and (3, 0), and the graph of f, orange, through (0, 1), (1, 2), (2, 0) and (3, 4)."),
        how: HOW_14, skill: "Composites from tables and graphs",
        steps: [
          { step: 1, ask: "Which graph do you start in?", type: "choice", answer: 0, options: [{ t: "$g$, the inside function, at $x = 1$" }, { t: "$f$ at $x = 1$", fb: "$f(g(1))$ means $g$ comes first." }], m: "x = 1 \\ \\text{on the graph of } g", say: "Inside first." },
          { step: 2, ask: "Read up from $x = 1$ on the blue graph. What is $g(1)$?", type: "num", pre: "$g(1) =$", answer: 3, near: [{ v: 2, fb: "$g(0) = 2$. At $x = 1$ the blue graph is at height 3." }], hint: "Go up from 1 to the blue graph.", m: "g(1) = 3", say: "The output of $g$." },
          { step: 3, ask: "Now use 3 as an input of $f$. What is $f(3)$ on the orange graph?", type: "num", pre: "$f(3) =$", answer: 4, near: [{ v: 3, fb: "3 is the input. Read the **height** of the orange graph at $x = 3$." }], hint: "Go up from 3 to the orange graph.", m: "f(g(1)) = f(3) = 4", say: "Two readings, one answer." }],
        why: "Inner input, inner output, outer output. Now two tables on your own." },
      { type: "num", kicker: "On your own", prompt: "Use the two tables to find $f(g(3))$." + tbl(["$x$", "$g(x)$"], [[1, 3], [2, 1], [3, 4], [4, 2]]) + tbl(["$x$", "$f(x)$"], [[1, 4], [2, 2], [3, 1], [4, 3]]), pre: "$f(g(3)) =$", answer: 3, skill: "Composites from tables and graphs",
        near: [{ v: 4, fb: "$g(3) = 4$. That is the input for $f$: now find $f(4)$." }, { v: 1, fb: "That is $f(3)$. The inside function is $g$: $g(3) = 4$ first." }],
        hints: ["$g(3) = 4$. Then look up 4 in $f$."], why: "$g(3) = 4$, and $f(4) = 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **formula** inside and a **table** outside. $g(x) = x + 1$, and $f$ is the table from before. Find $f(g(2))$.",
        scene: { type: "walk", how: HOW_14, rows: [
          { step: 1, m: "x = 2 \\ \\text{in } g(x) = x + 1", say: "The inside function is a formula this time." },
          { step: 2, m: "g(2) = 2 + 1 = 3", say: "Work it out. The 3 goes to $f$.", ask: { prompt: "What do we look up in the table of $f$?", answer: 0, options: [{ t: "$3$" }, { t: "$2$", fb: "2 is what we put into $g$." }] } },
          { step: 3, m: "f(3) = 1", say: "In $f$'s table, 3 goes to 1." },
          { step: 3, m: "f(g(2)) = 1", say: "Formula inside, table outside: the same two steps." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Using the blue and orange graphs, find $g(f(2))$." + GFP("The graph of g, blue, and the graph of f, orange."), pre: "$g(f(2)) =$", answer: 2, skill: "Composites from tables and graphs",
        near: [{ v: 0, fb: "$f(2) = 0$ is the inside result. Now find $g(0)$: it is not 0." }, { v: 4, fb: "$f(3) = 4$. Here the input is 2, and $f$ is **inside**." }],
        hints: ["The inside function is $f$. $f(2) = 0$."], why: "$f(2) = 0$, then $g(0) = 2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To find $f(g(1))$ from tables, Eli looks up 1 in the table of $f$ first. What is wrong?",
        options: [{ t: "$g$ is inside, so look in $g$ first. $f$ gets $g$'s output." }, { t: "Nothing: either table can go first.", fb: "The order matters: the first table is the inside function." }, { t: "He should add the two answers.", fb: "Composition does not add: it passes one output into the next function." }],
        answer: 0, skill: "Composites from tables and graphs", hints: ["Which function is inside the brackets?"], why: "$f(g(1))$: $g$ first." },
      { type: "num", kicker: "Use it", prompt: "A recycling centre gives points for paper, then dollars for points. Paper (kg) to points: $g(1) = 10$, $g(2) = 25$, $g(3) = 40$. Points to dollars: $f(10) = 1$, $f(25) = 3$, $f(40) = 5$. How many dollars for 2 kg?", pre: "dollars =", answer: 3, skill: "Composites from tables and graphs",
        near: [{ v: 25, fb: "25 is the points. Now turn the points into dollars with $f$." }], hints: ["$g(2) = 25$ points. Then $f(25)$."], why: "$f(g(2)) = f(25) = 3$ dollars." }
    ]
  });
  /* ================================================== 15 · The domain of a composite function */
  var HOW_15 = [["Inside works?", "Which inputs can go into the inside function $g$?"],
                ["Outside works?", "Which outputs of $g$ can go into the outside function $f$?"],
                ["Keep both", "Keep only the inputs that pass both tests."]];
  var SQ15 = function (v) { return v < 0 ? NaN : Math.sqrt(v); };
  LESSONS.push({
    title: "The domain of a composite function", art: "fxdom",
    blurb: "Book 1.4 · An input must work in $g$, and what comes out of $g$ must work in $f$.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which numbers can go into $\\sqrt{x}$?",
        options: [{ t: "$x \\ge 0$" }, { t: "all real numbers", fb: "$\\sqrt{-4}$ is not a real number." }, { t: "$x > 0$", fb: "$\\sqrt{0} = 0$ is fine, so 0 is allowed." }],
        answer: 0, skill: "Domain of a formula", hints: ["What is under the root allowed to be?"], why: "The inside of a square root must be 0 or more." },
      { type: "learn", kicker: "Explore",
        prompt: "Machine $g$ subtracts 4. Machine $f$ takes a square root. Slide the input. Find one that **works**, and one that **breaks**.",
        scene: { type: "sketch", x: [-5, 14], y: [-3.4, 2.8], u: 23, w: 480, grid: false, gate: true,
          pts: { P: { at: [2, -2.4], drag: true, c: "orange", say: "The input", on: { fn: function (p) { return [Math.max(-2, Math.min(8, Math.round(p[0]))), -2.4]; } } } },
          track: function (s) { return isFinite(SQ15(s.P[0] - 4)) ? "good" : "bad"; },
          draw: function (s) {
            var v = s.P[0], m = v - 4, o = SQ15(m), bad = !isFinite(o), items = chainItems(nm(v), "x − 4", nm(m), "√x", bad ? "undefined" : nm(r2(o)), bad);
            items.push({ word: "g", at: [0, 2.2], c: "ink" }, { word: "f", at: [8.6, 2.2], c: "ink" }, { seg: [[-2, -2.4], [8, -2.4]], c: "soft" });
            for (var t = -2; t <= 8; t++) { items.push({ seg: [[t, -2.25], [t, -2.55]], c: "soft" }); items.push({ text: String(t), at: [t, -3.05], eq: true, c: "soft" }); }
            return items;
          },
          readout: function (s) { var v = s.P[0], m = v - 4; return "$g(" + nm(v) + ") = " + nm(m) + "$, and $\\sqrt{" + nm(m) + "}$ is " + (m < 0 ? "**undefined**" : "$" + nm(r2(Math.sqrt(m))) + "$") + "<br>" + (s.tracked.good ? "✓ " : "· ") + "an input that works &nbsp;&nbsp; " + (s.tracked.bad ? "✓ " : "· ") + "one that breaks"; },
          goal: function (s) { return s.tracked.good && s.tracked.bad; } },
        gate: true, then: "$g$ accepts every number, but $f$ only accepts what $g$ **hands it**. If $g(x) < 0$, the chain breaks. So $x \\ge 4$ is the domain of $f(g(x))$." },
      { type: "learn", kicker: "The idea",
        prompt: "For $f(g(x))$, an input $x$ must pass **two tests**: it must be allowed in $g$, and $g(x)$ must be allowed in $f$.",
        scene: { type: "method", how: HOW_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the domain of $f(g(x))$ for $f(x) = \\dfrac{1}{x}$ and $g(x) = x - 3$.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "g(x) = x - 3", say: "Any number can go into $g$." },
          { step: 2, m: "f(g(x)) = \\frac{1}{g(x)} \\quad\\Rightarrow\\quad g(x) \\ne 0", say: "$f$ cannot accept 0: so $g(x)$ must not be 0.",
            ask: { prompt: "Which output of $g$ can $f$ not accept?", answer: 0, options: [{ t: "$0$: it would divide by zero" }, { t: "$3$", fb: "$\\frac{1}{3}$ is fine. The trouble is only 0." }] } },
          { step: 2, m: "x - 3 \\ne 0 \\quad\\Rightarrow\\quad x \\ne 3", say: "Find the input that makes $g(x) = 0$." },
          { step: 3, m: "(-\\infty,\\ 3) \\cup (3,\\ \\infty)", say: "Both tests passed by everything except 3.", fig: nline("The number line with a hole at 3.", -1, 7, nline.rng(null, 3, false, false).concat(nline.rng(3, null, false, false))) }] },
        gate: true, then: "The domain of $f(g(x)) = \\dfrac{1}{x - 3}$ is every real number except 3." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the domain of $f(g(x))$ for $f(x) = \\sqrt{x}$ and $g(x) = 2x + 6$.",
        how: HOW_15, skill: "Domain of a composite",
        steps: [
          { step: 1, ask: "Which inputs can go into $g(x) = 2x + 6$?", type: "choice", answer: 0, options: [{ t: "All real numbers" }, { t: "Only $x \\ge -3$", fb: "That is what $f$ will ask for. $g$ itself accepts anything." }], m: "g \\text{ accepts all } x", say: "A line has no restrictions." },
          { step: 2, ask: "$f$ needs $g(x) \\ge 0$. Solve $2x + 6 \\ge 0$: what is the smallest $x$?", type: "num", pre: "$x \\ge$", answer: -3, near: [{ v: 3, fb: "Subtract 6 first: $2x \\ge -6$, then divide by 2." }], hint: "$2x \\ge -6$.", m: "2x + 6 \\ge 0 \\quad\\Rightarrow\\quad x \\ge -3", say: "The outside function needs a non-negative input." },
          { step: 3, ask: "Write the domain.", type: "choice", answer: 0, options: [{ t: "$[\\,-3,\\ \\infty)$" }, { t: "$(\\,-3,\\ \\infty)$", fb: "At $x = -3$, $g = 0$ and $\\sqrt{0} = 0$: allowed. Square bracket." }], m: "[\\,-3,\\ \\infty\\,)", say: "Everything from $-3$ up." }],
        why: "Inside, outside, keep both. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "What is the domain of $f(g(x))$ for $f(x) = \\sqrt{x}$ and $g(x) = 5 - x$?",
        options: [{ t: "$(-\\infty,\\ 5]$" }, { t: "$[\\,5,\\ \\infty)$", fb: "Solve $5 - x \\ge 0$: add $x$ to both sides to get $5 \\ge x$, which means $x \\le 5$." }, { t: "all real numbers", fb: "At $x = 6$, $g(6) = -1$ and $\\sqrt{-1}$ breaks." }],
        answer: 0, skill: "Domain of a composite", hints: ["$5 - x \\ge 0$."], why: "$5 - x \\ge 0$ gives $x \\le 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When **both** functions have rules. Let $f(x) = \\dfrac{1}{x}$ and $g(x) = \\sqrt{x}$. Find the domain of $f(g(x)) = \\dfrac{1}{\\sqrt{x}}$.",
        scene: { type: "walk", how: HOW_15, rows: [
          { step: 1, m: "g(x) = \\sqrt{x} \\quad\\Rightarrow\\quad x \\ge 0", say: "The inside function already limits $x$." },
          { step: 2, m: "f \\text{ needs } g(x) \\ne 0 \\quad\\Rightarrow\\quad \\sqrt{x} \\ne 0", say: "And $f$ cannot take 0, so $\\sqrt{x}$ must not be 0.", ask: { prompt: "Which $x$ makes $\\sqrt{x} = 0$?", answer: 0, options: [{ t: "$x = 0$" }, { t: "$x = 1$", fb: "$\\sqrt{1} = 1$." }] } },
          { step: 3, m: "x \\ge 0 \\ \\text{and} \\ x \\ne 0 \\quad\\Rightarrow\\quad x > 0", say: "Both tests together: strictly bigger than 0.", fig: nline("The number line from 0 rightwards, with a hollow circle at 0.", -1, 7, nline.rng(0, null, false, false)) },
          { step: 3, m: "(\\,0,\\ \\infty\\,)", say: "Round at 0." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "$f(x) = \\sqrt{x}$ and $g(x) = x^2 - 9$. What is the domain of $f(g(x))$?",
        options: [{ t: "$(-\\infty,\\ -3] \\cup [\\,3,\\ \\infty)$" }, { t: "$[\\,-3,\\ 3\\,]$", fb: "Test $x = 0$: $g(0) = -9$ and $\\sqrt{-9}$ breaks. So the numbers between $-3$ and $3$ fail." }, { t: "$[\\,3,\\ \\infty)$", fb: "Test $x = -4$: $g(-4) = 7$, which works. So the numbers below $-3$ are allowed as well." }],
        answer: 0, skill: "Domain of a composite", hints: ["Solve $x^2 - 9 \\ge 0$: when is $x^2$ at least 9?"], why: "$x^2 \\ge 9$ means $x \\le -3$ or $x \\ge 3$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dev says the domain of $f(g(x))$ is always just the domain of $g$. What is wrong?",
        options: [{ t: "$g(x)$ must also be allowed in $f$. That can remove more inputs." }, { t: "Nothing: it is always the domain of $g$.", fb: "Try $f = \\sqrt{x}$ and $g(x) = x - 4$: $g$ accepts $x = 0$ but $\\sqrt{-4}$ does not." }, { t: "It is always the domain of $f$.", fb: "$f$'s domain is about $g$'s outputs, not the inputs $x$." }],
        answer: 0, skill: "Domain of a composite", hints: ["Two tests."], why: "The inside test and the outside test must both pass." },
      { type: "choice", kicker: "Use it", prompt: "A circle's radius grows as $r(t) = 2t$ centimetres after $t$ seconds. The area is $A(r) = \\pi r^2$. What is a sensible domain of $A(r(t))$?",
        options: [{ t: "$t \\ge 0$: time cannot be negative" }, { t: "all real numbers", fb: "The formula accepts them, but a negative time makes no sense here." }, { t: "$t > 2$", fb: "Nothing stops $t$ from being between 0 and 2." }],
        answer: 0, skill: "Domain of a composite", hints: ["Can the clock run backwards?"], why: "$A(r(t)) = 4\\pi t^2$. The situation limits $t$ to $t \\ge 0$." }
    ]
  });

  /* ================================================ 16 · Taking a function apart */
  var HOW_16 = [["The inside", "Find the part that is worked out first: inside brackets, under a root, or on the bottom."],
                ["Name it g", "Name that part $g(x)$."],
                ["The outside", "What happens to $g(x)$ afterwards? That is $f$."]];
  var H16 = function (x) { return (x + 2) * (x + 2); };
  var DEC = { a: { r1: "x + 2", f1: function (x) { return x + 2; }, r2: "x²", f2: function (x) { return x * x; } },
              b: { r1: "x²", f1: function (x) { return x * x; }, r2: "x + 2", f2: function (x) { return x + 2; } },
              c: { r1: "x + 2", f1: function (x) { return x + 2; }, r2: "2x", f2: function (x) { return 2 * x; } } };
  LESSONS.push({
    title: "Taking a function apart", art: "fxdec",
    blurb: "Book 1.4 · Write a function as one function inside another: $h(x) = f(g(x))$.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Let $h(x) = (x + 2)^2$. Find $h(3)$.", pre: "$h(3) =$", answer: 25, skill: "Order of operations",
        near: [{ v: 11, fb: "The brackets come first: add 2, **then** square. $3^2 + 2$ is a different thing." }], hints: ["Brackets first: $3 + 2$."], why: "$3 + 2 = 5$, then $5^2 = 25$." },
      { type: "learn", kicker: "Explore",
        prompt: "$h(x) = (x + 2)^2$. Which pair of machines builds it? Pick a pair, slide the input, and compare the chain's answer with $h(x)$.",
        scene: { type: "sketch", x: [-5, 14], y: [-3.4, 2.8], u: 23, w: 480, grid: false, gate: true,
          pts: { P: { at: [3, -2.4], drag: true, c: "orange", say: "The input", on: { fn: function (p) { return [Math.max(-4, Math.min(4, Math.round(p[0]))), -2.4]; } } } },
          chips: { pair: { label: "Pair", v: "b", opts: [["b", "$g$: squares, $f$: adds 2"], ["c", "$g$: adds 2, $f$: doubles"], ["a", "$g$: adds 2, $f$: squares"]] } },
          track: function (s) { var d = DEC[s.c.pair], v = s.P[0]; return d.f2(d.f1(v)) === H16(v) ? "ok" + v : null; },
          draw: function (s) {
            var d = DEC[s.c.pair], v = s.P[0], m = d.f1(v), o = d.f2(m), items = chainItems(nm(v), d.r1, nm(m), d.r2, nm(o), o !== H16(v));
            items.push({ word: "g", at: [0, 2.2], c: "ink" }, { word: "f", at: [8.6, 2.2], c: "ink" }, { seg: [[-4, -2.4], [4, -2.4]], c: "soft" });
            for (var t = -4; t <= 4; t++) { items.push({ seg: [[t, -2.25], [t, -2.55]], c: "soft" }); items.push({ text: String(t), at: [t, -3.05], eq: true, c: "soft" }); }
            return items;
          },
          readout: function (s) { var d = DEC[s.c.pair], v = s.P[0], o = d.f2(d.f1(v)); return "The chain gives $" + nm(o) + "$. $h(" + nm(v) + ") = (" + nm(v) + " + 2)^2 = " + nm(H16(v)) + "$: " + (o === H16(v) ? "**the same** ✓" : "**different** ✗"); },
          goal: function (s) { return Object.keys(s.tracked).filter(function (k) { return /^ok/.test(k); }).length >= 2 && s.c.pair === "a"; } },
        gate: true, then: "Add 2 first ($g$), then square ($f$): $h(x) = f(g(x))$ with $g(x) = x + 2$ and $f(x) = x^2$." },
      { type: "learn", kicker: "The idea",
        prompt: "To take $h$ apart, ask: **what is done to $x$ first?** That is the inside function $g$. What happens to the result? That is the outside function $f$.",
        scene: { type: "method", how: HOW_16 } },
      { type: "learn", kicker: "Watch",
        prompt: "Write $h(x) = \\sqrt{3x - 1}$ as $f(g(x))$.",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "h(x) = \\sqrt{3x - 1}", say: "The $3x - 1$ sits **under the root**. It is worked out first." },
          { step: 2, m: "g(x) = 3x - 1", say: "The inside function.", ask: { prompt: "What is worked out first?", answer: 0, options: [{ t: "$3x - 1$, under the root" }, { t: "the square root", fb: "The root acts on $3x - 1$, so $3x - 1$ must be ready first." }] } },
          { step: 3, m: "f(x) = \\sqrt{x}", say: "What happens to $g(x)$ afterwards? It is square-rooted." },
          { step: 3, m: "f(g(x)) = \\sqrt{3x - 1} = h(x)", say: "Check: it puts back together." }] },
        gate: true, then: "$h(x) = f(g(x))$ with $g(x) = 3x - 1$ and $f(x) = \\sqrt{x}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you take apart $h(x) = \\dfrac{5}{x - 2}$.",
        how: HOW_16, skill: "Decomposing functions",
        steps: [
          { step: 1, ask: "What is worked out first, to the number $x$?", type: "choice", answer: 0, options: [{ t: "$x - 2$, on the bottom" }, { t: "the division by 5", fb: "The 5 is divided by the result of $x - 2$. So the subtraction is first." }], m: "x - 2 \\text{ first}", say: "The bottom of the fraction." },
          { step: 2, ask: "So $g(x)$ is…", type: "choice", answer: 0, options: [{ t: "$x - 2$" }, { t: "$\\frac{5}{x}$", fb: "That is what is done **afterwards**." }], m: "g(x) = x - 2", say: "The inside." },
          { step: 3, ask: "And $f(x)$ is…", type: "choice", answer: 0, options: [{ t: "$\\frac{5}{x}$" }, { t: "$5x$", fb: "$h$ divides 5 by the inside; it does not multiply." }], m: "f(x) = \\frac{5}{x}", say: "Check: $f(g(x)) = \\frac{5}{x - 2}$." }],
        why: "Find the inside, call it $g$, call the rest $f$. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "Which pair makes $h(x) = (x^2 + 1)^3$?",
        options: [{ t: "$g(x) = x^2 + 1$ and $f(x) = x^3$" }, { t: "$g(x) = x^3$ and $f(x) = x^2 + 1$", fb: "That gives $x^6 + 1$. The cube is applied to the whole $x^2 + 1$." }, { t: "$g(x) = x^2$ and $f(x) = x^3 + 1$", fb: "That gives $x^6 + 1$." }],
        answer: 0, skill: "Decomposing functions", hints: ["Which part is inside the brackets?"], why: "$x^2 + 1$ is worked out first; then it is cubed." },
      { type: "learn", kicker: "A harder case",
        prompt: "There can be **more than one** correct answer. For $h(x) = (2x + 1)^2$, check whether $g(x) = 2x$ and $f(x) = (x + 1)^2$ also work.",
        scene: { type: "walk", how: HOW_16, rows: [
          { step: 1, m: "g(x) = 2x", say: "A different inside function: only the doubling." },
          { step: 2, m: "f(g(x)) = f(2x)", say: "Feed $2x$ into $f$." },
          { step: 3, m: "f(2x) = (2x + 1)^2", say: "$f$ adds 1 to its input, then squares.", ask: { prompt: "Is that equal to $h(x)$?", answer: 0, options: [{ t: "Yes: $(2x + 1)^2$" }, { t: "No", fb: "Compare: it is exactly $(2x + 1)^2$." }] } },
          { step: 3, m: "\\text{it works too}", say: "The usual choice is $g(x) = 2x + 1$ and $f(x) = x^2$. Both rebuild $h$." }] },
        gate: true, then: "A function can be split apart in more than one way. Use the **simplest** one." },
      { type: "choice", kicker: "Try it", prompt: "Which pair makes $h(x) = |x - 4| + 1$ if we call $g(x) = x - 4$?",
        options: [{ t: "$f(x) = |x| + 1$" }, { t: "$f(x) = |x + 1|$", fb: "That gives $|x - 4 + 1|$." }, { t: "$f(x) = x + 1$", fb: "That gives $x - 3$: the absolute value bars disappeared." }],
        answer: 0, skill: "Decomposing functions", hints: ["Put $x - 4$ into each $f$ and see which gives $h$."], why: "$f(g(x)) = |x - 4| + 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ravi takes apart $h(x) = \\sqrt{x} + 3$ as $g(x) = x + 3$ and $f(x) = \\sqrt{x}$. What is wrong?",
        options: [{ t: "That gives $\\sqrt{x + 3}$. The 3 is added **after** the root, so $g(x) = \\sqrt{x}$, $f(x) = x + 3$." }, { t: "Nothing is wrong.", fb: "Check: $f(g(x)) = \\sqrt{x + 3}$, which is not $h(x)$." }, { t: "$f$ and $g$ must be the same function.", fb: "They can differ. The error is the order." }],
        answer: 0, skill: "Decomposing functions", hints: ["Put his $g$ into his $f$ and see what you get."], why: "In $\\sqrt{x} + 3$ the root is done first." },
      { type: "choice", kicker: "Use it", prompt: "A circle's radius is $5t$ cm after $t$ seconds, and its area is $A = \\pi(5t)^2$. Which is the inside function?",
        options: [{ t: "$g(t) = 5t$, the radius" }, { t: "$f(r) = \\pi r^2$, the area", fb: "The area is worked out **from** the radius, so it is the outside function." }, { t: "$g(t) = \\pi t$", fb: "$\\pi$ only appears in the area rule." }],
        answer: 0, skill: "Decomposing functions", hints: ["What is worked out first: the radius, or the area?"], why: "Time gives the radius ($g$); the radius gives the area ($f$)." }
    ]
  });

  /* ============================================================ 17 · Shifting graphs */
  var HOW_17 = [["In or out", "Is the change inside the brackets, $f(x - h)$, or outside, $f(x) + k$?"],
                ["Say the move", "Outside: $+k$ moves up, $-k$ down. Inside: $x - h$ moves right $h$, and $x + h$ moves left."],
                ["Move points", "Slide every key point that way, then redraw the curve through them."]];
  LESSONS.push({
    title: "Shifting graphs", art: "fxshift",
    blurb: "Book 1.5 · Adding to the output moves a graph up or down; changing the input moves it sideways.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The point $(1, 4)$ is moved **up 3**. Where does it land?",
        options: [{ t: "$(1, 7)$" }, { t: "$(4, 4)$", fb: "Up changes the height, the second number." }, { t: "$(1, 1)$", fb: "Up makes the height bigger." }],
        answer: 0, skill: "Plot a point", hints: ["Up changes $y$."], why: "$(1, 4 + 3) = (1, 7)$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $h$ and $k$ to move the **blue** graph onto the **dashed** one. Watch the equation as you go.",
        scene: morph({ keys: ["sq", "ab", "rt"], params: { h: { min: -5, max: 5, step: 1, v: 0, label: "$h$" }, k: { min: -5, max: 5, step: 1, v: 0, label: "$k$" } },
          tf: function (f, p) { return function (x) { return f(x - p.h) + p.k; }; }, map: function (pt, p) { return [pt[0] + p.h, pt[1] + p.k]; }, target: { h: 3, k: -2 },
          read: function (p) { return "$y = f(x " + (p.h < 0 ? "+ " + nm(-p.h) : "- " + nm(p.h)) + ") " + (p.k < 0 ? "- " + nm(-p.k) : "+ " + nm(p.k)) + "$: " + (p.h === 0 ? "" : nm(Math.abs(p.h)) + (p.h > 0 ? " right" : " left") + ", ") + (p.k === 0 ? "" : nm(Math.abs(p.k)) + (p.k > 0 ? " up" : " down")); } }),
        gate: true, then: "$f(x - 3) - 2$: **3 right, 2 down**. Notice the sign: $x - 3$ moves the graph **right**." },
      { type: "learn", kicker: "The idea",
        prompt: "**Outside** the brackets, $f(x) + k$, changes the heights: up or down. **Inside**, $f(x - h)$, changes the inputs: it moves the graph sideways, and the sign looks backwards.",
        scene: { type: "method", how: HOW_17 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $y = |x - 2| + 1$ by moving the graph of $y = |x|$.",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "y = |x - 2| + 1", say: "Inside: $x - 2$, so sideways. Outside: $+1$, so vertical.", fig: plot("The V shape of absolute x, with its point at the origin.", [{ f: Math.abs, a: -5, b: 5, c: "soft", yr: [-2, 6] }], [dot(0, 0, "soft")], { x: [-4, 6], y: [-2, 6], u: 22 }) },
          { step: 2, m: "\\text{right } 2, \\ \\text{up } 1", say: "$x - 2$ moves right 2. The $+1$ moves up 1.",
            ask: { prompt: "Does $x - 2$ move the graph left or right?", answer: 0, options: [{ t: "Right 2" }, { t: "Left 2", fb: "The new graph reaches the old height **later**, 2 steps further right." }] },
            fig: plot("The V with arrows showing a move of 2 right and 1 up.", [{ f: Math.abs, a: -5, b: 5, c: "soft", yr: [-2, 6] }], [dot(0, 0, "soft"), { steps: [[0, 0], [2, 1]], c: "orange" }, dot(2, 1, "blue")], { x: [-4, 6], y: [-2, 6], u: 22 }) },
          { step: 3, m: "(0,\\ 0) \\to (2,\\ 1)", say: "The point of the V moves. Every other point moves the same way.", fig: plot("The shifted V with its point at (2, 1), above the original in grey.", [{ f: Math.abs, a: -5, b: 5, c: "soft", yr: [-2, 6] }, { f: function (x) { return Math.abs(x - 2) + 1; }, a: -4, b: 6, c: "blue", yr: [-2, 6] }], [dot(0, 0, "soft"), dot(2, 1, "blue", "(2, 1)", "s")], { x: [-4, 6], y: [-2, 6], u: 22 }) }] },
        gate: true, then: "$y = |x - 2| + 1$ is the V with its point at $(2, 1)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $y = \\sqrt{x + 3} - 1$ as a move of $y = \\sqrt{x}$.",
        how: HOW_17, skill: "Shifting graphs",
        steps: [
          { step: 1, ask: "$x + 3$ is inside the root. $-1$ is outside it. Which is the sideways move?", type: "choice", answer: 0, options: [{ t: "$x + 3$ (inside)" }, { t: "$-1$ (outside)", fb: "Outside changes the heights: that is the vertical move." }], m: "x + 3 \\ \\text{inside}, \\ -1 \\ \\text{outside}", say: "Inside: sideways." },
          { step: 2, ask: "What is the move?", type: "choice", answer: 0, options: [{ t: "Left 3, down 1" }, { t: "Right 3, down 1", fb: "$x + 3$ moves **left**: the sign looks backwards." }, { t: "Left 3, up 1", fb: "$-1$ moves down." }], m: "\\text{left } 3, \\ \\text{down } 1", say: "$x + 3 = x - (-3)$: a move of $-3$ to the right is 3 to the left." },
          { step: 3, ask: "$\\sqrt{x}$ starts at $(0, 0)$. Where is the start of the new graph? Give the $x$-coordinate.", type: "num", pre: "$x =$", answer: -3, near: [{ v: 3, fb: "It moved **left**: $0 - 3 = -3$." }], hint: "Move 3 left from 0.", m: "(0,\\ 0) \\to (-3,\\ -1)", say: "Left 3, down 1." }],
        why: "Inside or outside, say the move, move the points. Now find a point." },
      { type: "choice", kicker: "On your own", prompt: "The point $(4, 2)$ is on $y = f(x)$. Which point is on $y = f(x - 1) + 3$?",
        options: [{ t: "$(5, 5)$" }, { t: "$(3, 5)$", fb: "$x - 1$ moves the point **right** 1, not left." }, { t: "$(5, -1)$", fb: "$+3$ moves up 3." }],
        answer: 0, skill: "Shifting graphs", hints: ["Right 1, up 3."], why: "$(4 + 1, 2 + 3) = (5, 5)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two moves with confusing signs. The point $(0, 0)$ is on $y = f(x)$. Where is it on $y = f(x + 2) - 3$?",
        scene: { type: "walk", how: HOW_17, rows: [
          { step: 1, m: "y = f(x + 2) - 3", say: "Inside: $+2$. Outside: $-3$." },
          { step: 2, m: "x + 2 \\to \\text{left } 2 \\qquad -3 \\to \\text{down } 3", say: "Plus inside means **left**. Minus outside means **down**.", ask: { prompt: "Which way does $f(x + 2)$ move the graph?", answer: 0, options: [{ t: "Left 2" }, { t: "Right 2", fb: "To get the old output you now need an input 2 smaller: the graph moves left." }] } },
          { step: 3, m: "(0,\\ 0) \\to (-2,\\ -3)", say: "Left 2, down 3." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which equation moves $y = x^2$ **right 4** and **down 1**?",
        options: [{ t: "$y = (x - 4)^2 - 1$" }, { t: "$y = (x + 4)^2 - 1$", fb: "$x + 4$ moves left." }, { t: "$y = (x - 4)^2 + 1$", fb: "$+1$ moves up." }],
        answer: 0, skill: "Shifting graphs", hints: ["Inside: minus for right. Outside: minus for down."], why: "$(x - 4)^2 - 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana says $y = (x + 3)^2$ moves the graph of $y = x^2$ **3 to the right**. What is wrong?",
        options: [{ t: "$x + 3$ moves it 3 to the **left**: the new graph needs an input 3 smaller." }, { t: "Nothing is wrong.", fb: "Test the point $(0, 9)$ on $(x + 3)^2$: the old vertex $(0, 0)$ is now at $x = -3$, to the left." }, { t: "It moves up 3.", fb: "Up and down is changed outside the brackets." }],
        answer: 0, skill: "Shifting graphs", hints: ["Where is the vertex of $(x + 3)^2$? When is $x + 3 = 0$?"], why: "The vertex is where $x + 3 = 0$: at $x = -3$." },
      { type: "choice", kicker: "Use it", prompt: "A model rocket's height is $h(t)$. It is launched **2 seconds later** from a platform **5 metres higher**. Which gives its new height?",
        options: [{ t: "$h(t - 2) + 5$" }, { t: "$h(t + 2) + 5$", fb: "$h(t + 2)$ is 2 seconds **earlier**." }, { t: "$h(t - 2) - 5$", fb: "A higher platform adds to the height." }],
        answer: 0, skill: "Shifting graphs", hints: ["Later: the clock must reach the old moment later."], why: "$t - 2$ delays by 2; $+5$ lifts by 5." }
    ]
  });
  /* ============================================================ 18 · Reflecting graphs */
  var HOW_18 = [["Find the minus", "Is the minus outside, $-f(x)$, or inside, $f(-x)$?"],
                ["The mirror", "Outside: the $x$-axis is the mirror. Inside: the $y$-axis is the mirror."],
                ["Flip points", "$(x, y)$ becomes $(x, -y)$ in the $x$-axis, or $(-x, y)$ in the $y$-axis."]];
  var RT18 = function (x) { return x < -2 ? NaN : Math.sqrt(x + 2); };
  var RW = { x: [-5, 5], y: [-4, 4], u: 24 };
  function refFig(alt, how, extra) {
    var f = function (x) { return x < 0 ? NaN : Math.sqrt(x); };
    var g = how === "x" ? function (x) { return x < 0 ? NaN : -Math.sqrt(x); } : function (x) { return x > 0 ? NaN : Math.sqrt(-x); };
    return grid(alt, curve(f, 0, 5, "soft", [-4, 4]).concat(curve(g, how === "x" ? 0 : -5, how === "x" ? 5 : 0, "blue", [-4, 4]), extra || []), RW);
  }
  LESSONS.push({
    title: "Reflecting graphs", art: "fxref",
    blurb: "Book 1.5 · A minus outside flips a graph over the $x$-axis; a minus inside flips it over the $y$-axis.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The point $(3, 2)$ is reflected in the $x$-axis. Where does it land?",
        options: [{ t: "$(3, -2)$" }, { t: "$(-3, 2)$", fb: "That is a reflection in the $y$-axis." }, { t: "$(-3, -2)$", fb: "That flips both: a turn about the origin." }],
        answer: 0, skill: "Plot a point", hints: ["The $x$-axis is a mirror: the point stays above the same spot, on the other side."], why: "Across the $x$-axis only the height changes sign: $(3, -2)$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the point along the blue graph. Choose which mirror to use and watch its **image**. Try **both** mirrors.",
        scene: { type: "sketch", x: [-8, 8], y: [-4.5, 4.5], u: 22, w: 360, gate: true,
          pts: { P: { at: [2, 2], drag: true, c: "blue", snap: 1, say: "The point", on: { fn: function (p) { var x = Math.max(-2, Math.min(7, Math.round(p[0]))); return [x, RT18(x)]; } } } },
          chips: { m: { label: "Mirror", v: "x", opts: [["x", "$-f(x)$: the $x$-axis"], ["y", "$f(-x)$: the $y$-axis"]] } },
          draw: function (s) {
            var x = s.P[0], y = s.P[1], mx = s.c.m === "x", q = mx ? [x, -y] : [-x, y];
            return curve(RT18, -2, 8, "blue", [-4.5, 4.5]).concat(curve(mx ? function (t) { return -RT18(t); } : function (t) { return RT18(-t); }, mx ? -2 : -8, mx ? 8 : 2, "orange", [-4.5, 4.5]),
              [mx ? { seg: [[-8, 0], [8, 0]], c: "purple" } : { seg: [[0, -4.5], [0, 4.5]], c: "purple" }, { seg: [[x, y], q], c: "ink", dash: true }, { pt: q, c: "orange" }]);
          },
          readout: function (s) { var x = s.P[0], y = r2(s.P[1]), mx = s.c.m === "x"; return "$(" + nm(x) + ",\\ " + nm(y) + ") \\to (" + (mx ? nm(x) + ",\\ " + nm(-y) : nm(-x) + ",\\ " + nm(y)) + ")$"; },
          goal: function (s) { return Object.keys(s.seen.m).length >= 2; } },
        gate: true, then: "$-f(x)$ flips the graph **upside down**: heights change sign. $f(-x)$ flips it **left to right**: inputs change sign." },
      { type: "learn", kicker: "The idea",
        prompt: "A minus sign **outside**, $-f(x)$, reflects the graph in the $x$-axis. A minus sign **inside**, $f(-x)$, reflects it in the $y$-axis.",
        scene: { type: "method", how: HOW_18 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $y = -\\sqrt{x}$ from the graph of $y = \\sqrt{x}$ (grey).",
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "y = -\\sqrt{x}", say: "The minus is **outside**: it multiplies the whole $\\sqrt{x}$.", fig: grid("The grey graph of the square root of x.", curve(function (x) { return x < 0 ? NaN : Math.sqrt(x); }, 0, 5, "soft", [-4, 4]), RW) },
          { step: 2, m: "\\text{mirror: the } x\\text{-axis}", say: "Flip the graph over the horizontal axis.", ask: { prompt: "Which axis is the mirror for a minus outside?", answer: 0, options: [{ t: "The $x$-axis" }, { t: "The $y$-axis", fb: "The $y$-axis mirrors a minus **inside**, $f(-x)$." }] }, fig: refFig("The root graph with the x-axis marked as a mirror.", "x") },
          { step: 3, m: "(4,\\ 2) \\to (4,\\ -2)", say: "Each point keeps its $x$ and changes the sign of its height.", fig: refFig("The root graph reflected below the x-axis, the point (4, 2) going to (4, -2).", "x", [dot(4, 2, "soft"), dot(4, -2, "blue", "(4, −2)", "s")]) }] },
        gate: true, then: "$y = -\\sqrt{x}$ is $\\sqrt{x}$ turned **upside down**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you graph $y = \\sqrt{-x}$ from $y = \\sqrt{x}$.",
        how: HOW_18, skill: "Reflecting graphs",
        steps: [
          { step: 1, ask: "Where is the minus sign?", type: "choice", answer: 0, options: [{ t: "Inside: next to $x$" }, { t: "Outside", fb: "It sits under the root, with $x$." }], m: "f(-x) = \\sqrt{-x}", say: "Inside." },
          { step: 2, ask: "So which axis is the mirror?", type: "choice", answer: 0, options: [{ t: "The $y$-axis" }, { t: "The $x$-axis", fb: "A minus inside changes the inputs, so it flips left to right." }], m: "\\text{mirror: the } y\\text{-axis}", say: "Left to right." },
          { step: 3, ask: "The point $(4, 2)$ is on $\\sqrt{x}$. What is the $x$-coordinate of its image?", type: "num", pre: "$x =$", answer: -4, near: [{ v: 4, fb: "In the $y$-axis the **$x$** changes sign." }], hint: "$-4$.", m: "(4,\\ 2) \\to (-4,\\ 2)", say: "The height stays 2." }],
        why: "Find the minus, pick the mirror, flip the points. Now find a point." },
      { type: "choice", kicker: "On your own", prompt: "The point $(3, 5)$ is on $y = f(x)$. Which point must be on $y = -f(x)$?",
        options: [{ t: "$(3, -5)$" }, { t: "$(-3, 5)$", fb: "That would be on $f(-x)$." }, { t: "$(-3, -5)$", fb: "That needs both a minus inside and outside." }],
        answer: 0, skill: "Reflecting graphs", hints: ["The minus is outside: heights change sign."], why: "$-f(3) = -5$, so $(3, -5)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Two** minus signs. The point $(2, 1)$ is on $y = f(x)$. Where is it on $y = -f(-x)$?",
        scene: { type: "walk", how: HOW_18, rows: [
          { step: 1, m: "y = -f(-x)", say: "One minus inside, one outside." },
          { step: 2, m: "\\text{both axes}", say: "The inside minus flips left to right. The outside minus flips upside down.", ask: { prompt: "How many mirrors are used?", answer: 0, options: [{ t: "Two: both axes" }, { t: "One", fb: "There are two minus signs, so two flips." }] } },
          { step: 3, m: "(2,\\ 1) \\to (-2,\\ -1)", say: "Both coordinates change sign: the graph is turned half a turn about the origin." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which equation reflects the graph of $y = x^3 + 1$ in the **$y$-axis**?",
        options: [{ t: "$y = (-x)^3 + 1$" }, { t: "$y = -(x^3 + 1)$", fb: "That is a reflection in the $x$-axis." }, { t: "$y = x^3 - 1$", fb: "That is a shift down, not a reflection." }],
        answer: 0, skill: "Reflecting graphs", hints: ["Replace $x$ by $-x$."], why: "$f(-x) = (-x)^3 + 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says $y = -f(x)$ flips the graph **left to right**. What is wrong?",
        options: [{ t: "A minus outside flips it **upside down**. Left to right is $f(-x)$." }, { t: "Nothing is wrong.", fb: "Try a point: $(3, 2)$ on $f$ goes to $(3, -2)$ on $-f$: it did not move sideways." }, { t: "It does not flip at all.", fb: "Heights change sign, so it does flip." }],
        answer: 0, skill: "Reflecting graphs", hints: ["Which coordinate changes sign?"], why: "$-f(x)$ changes the sign of every height." },
      { type: "choice", kicker: "Use it", prompt: "A cliff's height above a calm lake is $h(x)$ metres. Its reflection in the water shows at depths $-h(x)$. Which kind of reflection is that?",
        options: [{ t: "In the $x$-axis (the water surface): $-h(x)$" }, { t: "In the $y$-axis: $h(-x)$", fb: "That would flip the cliff left to right." }, { t: "No reflection", fb: "The lake mirrors the cliff upside down." }],
        answer: 0, skill: "Reflecting graphs", hints: ["Which direction does a lake mirror things?"], why: "A lake flips things upside down: heights change sign." }
    ]
  });

  /* ================================================== 19 · Stretching and compressing */
  var HOW_19 = [["In or out", "Is the number multiplying the whole $f(x)$ (outside), or sitting next to $x$ (inside)?"],
                ["Say the move", "Outside $a$: every height is multiplied by $a$. Inside $b$: every width is divided by $b$."],
                ["Move points", "Outside: $(x, y) \\to (x,\\ ay)$. Inside: $(x, y) \\to (x/b,\\ y)$."]];
  var HAT = PARENTS.hat.f;
  function hatFig(alt, f, extra, o) { return grid(alt, curve(HAT, -3, 3, "soft", [-1, 8]).concat(curve(f, -6, 6, "blue", [-1, 8]), extra || []), o || { x: [-6, 6], y: [-1, 8], u: 22 }); }
  LESSONS.push({
    title: "Stretching and compressing graphs", art: "fxstr",
    blurb: "Book 1.5 · Multiplying the output stretches a graph up; multiplying the input squeezes it sideways.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The point $(2, 3)$ has its height tripled. What is the new height?", answer: 9, skill: "Plot a point",
        near: [{ v: 6, fb: "That doubles it. Tripled means times 3." }], hints: ["$3 \\times 3$."], why: "$3 \\cdot 3 = 9$: the point becomes $(2, 9)$." },
      { type: "learn", kicker: "Explore",
        prompt: "The grey **hat** is $y = f(x)$. Slide $a$ and $b$ so the blue graph lands on the dashed one: **twice as tall and half as wide**.",
        scene: morph({ keys: ["hat"], x: [-6, 6], y: [-1, 8], u: 24, w: 330, params: { a: { min: 0.5, max: 3, step: 0.5, v: 1, label: "$a$" }, b: { min: 0.5, max: 3, step: 0.5, v: 1, label: "$b$" } },
          tf: function (f, p) { return function (x) { return p.a * f(p.b * x); }; }, map: function (pt, p) { return [pt[0] / p.b, pt[1] * p.a]; }, target: { a: 2, b: 2 },
          read: function (p) { return "$y = " + nm(p.a) + "\\,f(" + nm(p.b) + "x)$: heights $\\times " + nm(p.a) + "$, widths $\\div " + nm(p.b) + "$"; } }),
        gate: true, then: "$a$ on the outside stretches the graph **up**. $b$ on the inside squeezes it **sideways**: a bigger $b$ makes it **narrower**." },
      { type: "learn", kicker: "The idea",
        prompt: "$y = a f(x)$ multiplies every **height** by $a$. $y = f(bx)$ divides every **width** by $b$, so a bigger $b$ makes the graph narrower. The inside works backwards.",
        scene: { type: "method", how: HOW_19 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $y = 3f(x)$ from the grey hat.",
        scene: { type: "walk", how: HOW_19, rows: [
          { step: 1, m: "y = 3f(x)", say: "The 3 is **outside**: it multiplies the heights.", fig: hatFig("The grey hat with corners (-3, 0), (-1, 2), (1, 2) and (3, 0).", HAT, [dot(-1, 2, "soft"), dot(1, 2, "soft")]) },
          { step: 2, m: "\\text{heights} \\times 3", say: "Every point moves away from the $x$-axis, 3 times as far. Points **on** the axis stay put.", ask: { prompt: "What happens to the point $(3, 0)$ on the axis?", answer: 0, options: [{ t: "It stays: $3 \\times 0 = 0$" }, { t: "It moves up", fb: "A height of 0 times 3 is still 0." }] } },
          { step: 3, m: "(1,\\ 2) \\to (1,\\ 6)", say: "Same $x$, three times the height.", fig: hatFig("The hat stretched to three times the height, its top corners at (-1, 6) and (1, 6).", function (x) { return 3 * HAT(x); }, [dot(-1, 2, "soft"), dot(1, 2, "soft"), dot(-1, 6, "blue"), dot(1, 6, "blue", "(1, 6)", "ne")]) }] },
        gate: true, then: "$y = 3f(x)$ is the hat **three times as tall**: a vertical stretch." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $y = f(2x)$.",
        how: HOW_19, skill: "Stretching graphs",
        steps: [
          { step: 1, ask: "Is the 2 inside or outside?", type: "choice", answer: 0, options: [{ t: "Inside: next to $x$" }, { t: "Outside", fb: "It is multiplying $x$, not the whole $f(x)$." }], m: "f(2x)", say: "Inside." },
          { step: 2, ask: "What does an inside 2 do to widths?", type: "choice", answer: 0, options: [{ t: "Divides them by 2: the graph gets narrower" }, { t: "Doubles them", fb: "The inside works backwards: $f(2x)$ squeezes." }], m: "\\text{widths} \\div 2", say: "A horizontal compression by a factor of 2." },
          { step: 3, ask: "The point $(3, 0)$ is on the hat. What is the $x$-coordinate of its image?", type: "num", pre: "$x =$", answer: 1.5, tol: 1e-9, near: [{ v: 6, fb: "That would double it. Inside works backwards: divide by 2." }], hint: "$3 \\div 2$.", m: "(3,\\ 0) \\to (1.5,\\ 0)", say: "Half as far from the $y$-axis." }],
        why: "In or out, say the move, move the points. Now find a point." },
      { type: "choice", kicker: "On your own", prompt: "The point $(6, 4)$ is on $y = f(x)$. Which point is on $y = \\frac{1}{2}f(x)$?",
        options: [{ t: "$(6, 2)$" }, { t: "$(3, 4)$", fb: "The $\\frac{1}{2}$ is outside, so it changes heights, not widths." }, { t: "$(12, 4)$", fb: "That would be a horizontal stretch." }],
        answer: 0, skill: "Stretching graphs", hints: ["Outside: multiply the height by $\\frac{1}{2}$."], why: "$(6,\\ \\frac{1}{2} \\cdot 4) = (6, 2)$: a vertical compression." },
      { type: "learn", kicker: "A harder case",
        prompt: "The inside works **backwards**. The point $(2, 3)$ is on $y = f(x)$. Where is it on $y = f\\!\\left(\\frac{x}{2}\\right)$?",
        scene: { type: "walk", how: HOW_19, rows: [
          { step: 1, m: "f\\!\\left(\\frac{x}{2}\\right) = f\\!\\left(\\tfrac{1}{2}x\\right)", say: "So $b = \\frac{1}{2}$, and it is inside." },
          { step: 2, m: "\\text{widths} \\div \\tfrac{1}{2} = \\text{widths} \\times 2", say: "Dividing by one half doubles them: the graph gets **wider**.", ask: { prompt: "Does $f(x/2)$ make the graph wider or narrower?", answer: 0, options: [{ t: "Wider" }, { t: "Narrower", fb: "It needs an input twice as big to reach the same height: it is stretched sideways." }] } },
          { step: 3, m: "(2,\\ 3) \\to (4,\\ 3)", say: "The $x$ doubles. The height stays 3." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which equation makes the graph of $f$ **twice as wide**?",
        options: [{ t: "$y = f\\!\\left(\\frac{x}{2}\\right)$" }, { t: "$y = f(2x)$", fb: "That squeezes it to half as wide." }, { t: "$y = 2f(x)$", fb: "That makes it twice as tall." }],
        answer: 0, skill: "Stretching graphs", hints: ["Inside works backwards."], why: "Dividing the input by 2 doubles every width." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam says $y = f(2x)$ **stretches** the graph sideways by a factor of 2. What is wrong?",
        options: [{ t: "It **compresses**: every width is divided by 2." }, { t: "Nothing is wrong.", fb: "Test $(2, 3)$: on $f(2x)$ it moves to $(1, 3)$, closer to the $y$-axis." }, { t: "It stretches it up.", fb: "Inside changes widths, not heights." }],
        answer: 0, skill: "Stretching graphs", hints: ["Where does the point $(2, 3)$ go?"], why: "$(2, 3) \\to (1, 3)$." },
      { type: "choice", kicker: "Use it", prompt: "A sound wave is $f(t)$. Which equation gives a sound with **twice as many waves per second** (a higher pitch)?",
        options: [{ t: "$f(2t)$: the wave is squeezed in time" }, { t: "$2f(t)$", fb: "That is twice as loud, not higher." }, { t: "$f\\!\\left(\\frac{t}{2}\\right)$", fb: "That stretches the wave: fewer waves per second, a lower pitch." }],
        answer: 0, skill: "Stretching graphs", hints: ["More waves in the same time means each one is narrower."], why: "$f(2t)$ fits two waves where there was one." }
    ]
  });

  /* ============================================== 20 · Combining transformations */
  var HOW_20 = [["Inside", "Do the inside first: it works backwards. Flip or squeeze the inputs, then move left or right."],
                ["Outside", "Then the outside: stretch or flip the heights, then move up or down."],
                ["Track a point", "Follow one point through every move, to check."]];
  LESSONS.push({
    title: "Combining transformations", art: "fxshift",
    blurb: "Book 1.5 · $y = a\\,f(x - h) + k$: several moves in the right order.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Start with the point $(1, 2)$. Move it **right 3**. Then **up 1**. Where is it?",
        options: [{ t: "$(4, 3)$" }, { t: "$(3, 4)$", fb: "Right changes the first number; up changes the second." }, { t: "$(2, 5)$", fb: "Right 3 adds 3 to the **first** number." }],
        answer: 0, skill: "Plot a point", hints: ["Right: add to $x$. Up: add to $y$."], why: "$(1 + 3, 2 + 1) = (4, 3)$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide $a$, $h$ and $k$ to land the blue graph on the dashed one. It has been **flipped**, **moved** and **stretched**.",
        scene: morph({ keys: ["ab", "sq"], x: [-6, 6], y: [-6, 6], u: 24, w: 330, params: { a: { min: -3, max: 3, step: 1, v: 1, label: "$a$" }, h: { min: -4, max: 4, step: 1, v: 0, label: "$h$" }, k: { min: -4, max: 4, step: 1, v: 0, label: "$k$" } },
          tf: function (f, p) { return function (x) { return p.a * f(x - p.h) + p.k; }; }, map: function (pt, p) { return [pt[0] + p.h, p.a * pt[1] + p.k]; }, target: { a: -2, h: 1, k: 3 },
          read: function (p) { return "$y = " + (p.a === 1 ? "" : p.a === -1 ? "-" : nm(p.a)) + "f(x " + (p.h < 0 ? "+ " + nm(-p.h) : "- " + nm(p.h)) + ") " + (p.k < 0 ? "- " + nm(-p.k) : "+ " + nm(p.k)) + "$"; } }),
        gate: true, then: "$y = -2f(x - 1) + 3$: **flipped and stretched by 2**, then moved **1 right and 3 up**." },
      { type: "learn", kicker: "The idea",
        prompt: "For $y = a\\,f(x - h) + k$: first the **inside** ($x - h$: move left or right), then the **outside** ($a$ stretches or flips, $k$ moves up or down). Follow one point to check.",
        scene: { type: "method", how: HOW_20 } },
      { type: "learn", kicker: "Watch",
        prompt: "Follow the point $(1, 1)$ on $y = |x|$ to the graph of $y = -2|x + 1| + 3$.",
        scene: { type: "walk", how: HOW_20, rows: [
          { step: 1, m: "x + 1 \\ \\to \\ \\text{left } 1", say: "Inside: $x + 1$ moves the graph 1 **left**.", fig: plot("The V of absolute x moved 1 left, with the point (1, 1) now at (0, 1).", [{ f: Math.abs, a: -6, b: 6, c: "soft", yr: [-6, 6] }, { f: function (x) { return Math.abs(x + 1); }, a: -6, b: 6, c: "blue", yr: [-6, 6] }], [dot(1, 1, "soft"), dot(0, 1, "blue", "(0, 1)", "ne")], { x: [-6, 6], y: [-6, 6], u: 20 }) },
          { step: 2, m: "-2 \\ \\to \\ \\text{flip, stretch by 2}", say: "Outside: the $-2$ flips the graph over the $x$-axis and makes it twice as steep.", fig: plot("The V flipped upside down and twice as steep.", [{ f: function (x) { return Math.abs(x + 1); }, a: -6, b: 6, c: "soft", yr: [-6, 6] }, { f: function (x) { return -2 * Math.abs(x + 1); }, a: -6, b: 6, c: "blue", yr: [-6, 6] }], [dot(0, 1, "soft"), dot(0, -2, "blue", "(0, −2)", "se")], { x: [-6, 6], y: [-6, 6], u: 20 }),
            ask: { prompt: "What happens to the point $(0, 1)$ under the $-2$?", answer: 0, options: [{ t: "Its height becomes $-2 \\cdot 1 = -2$" }, { t: "Its height becomes 2", fb: "The minus flips it below the axis." }] } },
          { step: 2, m: "+3 \\ \\to \\ \\text{up } 3", say: "Then move everything up 3.", fig: plot("The upside-down V moved up 3, with its point at (-1, 3).", [{ f: function (x) { return -2 * Math.abs(x + 1); }, a: -6, b: 6, c: "soft", yr: [-6, 6] }, { f: function (x) { return -2 * Math.abs(x + 1) + 3; }, a: -6, b: 6, c: "blue", yr: [-6, 6] }], [dot(0, -2, "soft"), dot(0, 1, "blue", "(0, 1)", "ne"), dot(-1, 3, "blue", "(−1, 3)", "nw")], { x: [-6, 6], y: [-6, 6], u: 20 }) },
          { step: 3, m: "(1,\\ 1) \\to (0,\\ 1) \\to (0,\\ -2) \\to (0,\\ 1)", say: "Left 1; then flip and stretch; then up 3." }] },
        gate: true, then: "$y = -2|x + 1| + 3$: an upside-down V with its point at $(-1, 3)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe $y = -\\sqrt{x - 2} + 1$ from $y = \\sqrt{x}$, and follow the point $(1, 1)$.",
        how: HOW_20, skill: "Combining transformations",
        steps: [
          { step: 1, ask: "What does the inside, $x - 2$, do?", type: "choice", answer: 0, options: [{ t: "Moves it right 2" }, { t: "Moves it left 2", fb: "$x - 2$ looks like left but moves right." }], m: "(1,\\ 1) \\to (3,\\ 1)", say: "Right 2." },
          { step: 2, ask: "What do the outside parts, $-$ and $+1$, do?", type: "choice", answer: 0, options: [{ t: "Flip over the $x$-axis, then move up 1" }, { t: "Move up 1, then flip", fb: "Do the flip **first**, then the shift: the shift is the last thing added." }], m: "-\\sqrt{x - 2} + 1", say: "Flip, then up 1." },
          { step: 3, ask: "Follow $(3, 1)$: after the flip its height is $-1$. After moving up 1, what is the height?", type: "num", pre: "$y =$", answer: 0, near: [{ v: 2, fb: "The flip comes first: $-1$, then $+1$ gives 0." }], hint: "$-1 + 1$.", m: "(3,\\ 1) \\to (3,\\ -1) \\to (3,\\ 0)", say: "The point ends at $(3, 0)$." }],
        why: "Inside first, then outside, tracking a point. Now your turn." },
      { type: "choice", kicker: "On your own", prompt: "The graph of $f$ is reflected in the $x$-axis, stretched vertically by 3, and moved left 2. Which equation is it?",
        options: [{ t: "$y = -3f(x + 2)$" }, { t: "$y = -3f(x - 2)$", fb: "Left 2 is $x + 2$: the inside sign looks backwards." }, { t: "$y = 3f(-x + 2)$", fb: "A reflection in the $x$-axis is a minus **outside**." }],
        answer: 0, skill: "Combining transformations", hints: ["Outside: the minus and the 3. Inside: left 2."], why: "$-3f(x + 2)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A number **inside** that is not alone. $y = f(2x - 6)$: factor first. Where does the point $(4, 5)$ on $f$ go?",
        scene: { type: "walk", how: HOW_20, rows: [
          { step: 1, m: "f(2x - 6) = f(2(x - 3))", say: "Factor out the 2 first. Now you can see both inside moves.", ask: { prompt: "What is $2x - 6$ when the 2 is factored out?", answer: 0, options: [{ t: "$2(x - 3)$" }, { t: "$2(x - 6)$", fb: "$2(x - 6) = 2x - 12$. Divide both terms by 2: $x - 3$." }] } },
          { step: 1, m: "\\text{squeeze by 2, then right } 3", say: "A compression by 2, then a shift of **3** (not 6)." },
          { step: 3, m: "(4,\\ 5) \\to (2,\\ 5) \\to (5,\\ 5)", say: "Halve the $x$: 2. Then right 3: 5. The height stays 5." }] },
        gate: true, then: "Factor first: the shift is 3, not 6." },
      { type: "num", kicker: "Try it", prompt: "The point $(4, 8)$ is on $y = f(x)$. It is moved to a point on $y = \\frac{1}{2}f(x - 2) + 1$. What is the new height?", pre: "$y =$", answer: 5, skill: "Combining transformations",
        near: [{ v: 4, fb: "Half of 8 is 4, then **add** the 1 from the outside." }, { v: 9, fb: "Multiply by $\\frac{1}{2}$ first: 4. Then add 1." }],
        hints: ["$x \\to 6$, and the height is $\\frac{1}{2}(8) + 1$."], why: "The point goes to $(6, 5)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dev says $y = f(2x - 6)$ moves $f$ right **6**, then squeezes it. What is wrong?",
        options: [{ t: "Factor first: $f(2(x - 3))$. The shift is 3, then the squeeze." }, { t: "Nothing is wrong.", fb: "Try the point where $2x - 6 = 0$: that is $x = 3$, not $x = 6$." }, { t: "It moves left 6.", fb: "Subtraction inside moves right." }],
        answer: 0, skill: "Combining transformations", hints: ["Where does $2x - 6$ equal 0?"], why: "$2x - 6 = 0$ at $x = 3$." },
      { type: "choice", kicker: "Use it", prompt: "A game sprite follows the path $f(x)$. You want a copy that is **mirrored left to right**, **2 units higher**. Which equation?",
        options: [{ t: "$y = f(-x) + 2$" }, { t: "$y = -f(x) + 2$", fb: "That flips it upside down." }, { t: "$y = f(-x + 2)$", fb: "That moves it sideways, not up." }],
        answer: 0, skill: "Combining transformations", hints: ["Mirrored left to right: minus inside. Higher: plus outside."], why: "$f(-x) + 2$." }
    ]
  });

  /* ====================================================== 21 · Even and odd functions */
  var HOW_21 = [["Find f(−x)", "Replace every $x$ with $-x$ and simplify."],
                ["Compare", "Is $f(-x)$ the same as $f(x)$? Or the exact opposite, $-f(x)$?"],
                ["Decide", "The same: even. The opposite: odd. Neither: neither."]];
  var EO = { s: { f: function (x) { return x * x; }, lab: "$x^2$" }, c: { f: function (x) { return x * x * x; }, lab: "$x^3$" }, m: { f: function (x) { return x * x + x; }, lab: "$x^2 + x$" }, a: { f: Math.abs, lab: "$|x|$" } };
  LESSONS.push({
    title: "Even and odd functions", art: "fxeo",
    blurb: "Book 1.5 · Functions whose graphs are mirror images of themselves.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $(-2)^3$.", answer: -8, skill: "Evaluate an expression",
        near: [{ v: 8, fb: "An odd power keeps the sign: $(-2)(-2)(-2) = -8$." }, { v: -6, fb: "$(-2)^3$ is $(-2) \\cdot (-2) \\cdot (-2)$, not $-2 \\cdot 3$." }],
        hints: ["$(-2)(-2) = 4$, then times $-2$."], why: "$4 \\cdot (-2) = -8$." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the point $P$ along each graph. Its partner $Q$ sits at the input $-x$. Compare the **heights** of $P$ and $Q$ for all four functions.",
        scene: { type: "sketch", x: [-4, 4], y: [-4, 7], u: 28, w: 300, gate: true,
          pts: { P: { at: [2, 4], drag: true, c: "blue", snap: 1, say: "The point P", on: { fn: function (p, s) { var x = Math.max(1, Math.min(2, Math.round(p[0]))); return [x, EO[s.c.fn].f(x)]; } } } },
          chips: { fn: { label: "Function", v: "s", opts: [["s", "$x^2$"], ["c", "$x^3$"], ["m", "$x^2 + x$"], ["a", "$|x|$"]] } },
          draw: function (s) {
            var f = EO[s.c.fn].f, x = s.P[0], q = [-x, f(-x)];
            return curve(f, -2.2, 2.2, "soft", [-4, 7]).concat([{ pt: q, c: "orange" }, { seg: [[x, f(x)], [x, 0]], c: "blue", dash: true }, { seg: [[-x, f(-x)], [-x, 0]], c: "orange", dash: true }]);
          },
          readout: function (s) { var f = EO[s.c.fn].f, x = s.P[0], a = f(x), b = f(-x); return "$f(" + nm(x) + ") = " + nm(a) + "$ and $f(" + nm(-x) + ") = " + nm(b) + "$: " + (a === b ? "the **same**" : a === -b ? "**opposites**" : "**neither**") + "<br>Looked at " + Math.min(Object.keys(s.seen.fn).length, 4) + " of 4"; },
          goal: function (s) { return Object.keys(s.seen.fn).length >= 4; } },
        gate: true, then: "$x^2$ and $|x|$: **the same** heights at $x$ and $-x$ (a mirror in the $y$-axis): **even**. $x^3$: **opposite** heights (a half-turn about the origin): **odd**. $x^2 + x$: neither." },
      { type: "learn", kicker: "The idea",
        prompt: "A function is **even** if $f(-x) = f(x)$: its graph is a mirror image in the $y$-axis. It is **odd** if $f(-x) = -f(x)$: turning the graph half a turn about the origin leaves it unchanged.",
        scene: { type: "method", how: HOW_21 } },
      { type: "learn", kicker: "Watch",
        prompt: "Is $f(x) = x^3 - x$ even, odd or neither?",
        scene: { type: "walk", how: HOW_21, rows: [
          { step: 1, m: "f(-x) = (-x)^3 - (-x)", say: "Replace every $x$ with $-x$, in brackets." },
          { step: 1, m: "f(-x) = -x^3 + x", say: "$(-x)^3 = -x^3$, and $-(-x) = +x$." },
          { step: 2, m: "-f(x) = -(x^3 - x) = -x^3 + x", say: "Work out the opposite of $f(x)$ too.", ask: { prompt: "Is $f(-x)$ equal to $-f(x)$?", answer: 0, options: [{ t: "Yes: both are $-x^3 + x$" }, { t: "No", fb: "Compare the two lines: they match." }] } },
          { step: 3, m: "f(-x) = -f(x) \\quad\\Rightarrow\\quad \\text{odd}", say: "The opposite: odd." }] },
        gate: true, then: "$x^3 - x$ is **odd**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide for $g(x) = x^4 - 2x^2$.",
        how: HOW_21, skill: "Even and odd functions",
        steps: [
          { step: 1, ask: "$(-x)^4$ is…", type: "choice", answer: 0, options: [{ t: "$x^4$" }, { t: "$-x^4$", fb: "An even power loses the minus: $(-x)^4 = x^4$." }], m: "g(-x) = (-x)^4 - 2(-x)^2", say: "Replace $x$ with $-x$." },
          { step: 1, ask: "So $g(-x)$ simplifies to…", type: "choice", answer: 0, options: [{ t: "$x^4 - 2x^2$" }, { t: "$-x^4 - 2x^2$", fb: "Both powers are even, so both signs vanish." }], m: "g(-x) = x^4 - 2x^2", say: "Both powers are even." },
          { step: 2, ask: "Compare with $g(x)$.", type: "choice", answer: 0, options: [{ t: "The same as $g(x)$" }, { t: "The opposite of $g(x)$", fb: "The signs of the terms did not change." }], m: "g(-x) = g(x)", say: "Equal." },
          { step: 3, ask: "So $g$ is…", type: "choice", answer: 0, options: [{ t: "Even" }, { t: "Odd", fb: "Odd would need the **opposite**." }], m: "\\text{even}", say: "Its graph is symmetric about the $y$-axis." }],
        why: "Find $f(-x)$, compare, decide. Now sort some." },
      { type: "sort", kicker: "On your own", prompt: "Even, odd or neither?",
        bins: ["Even", "Odd", "Neither"],
        cards: [{ t: "$x^2 + 3$", bin: 0, fb: "$(-x)^2 + 3 = x^2 + 3$." }, { t: "$x^3$", bin: 1, fb: "$(-x)^3 = -x^3$." }, { t: "$x^2 + x$", bin: 2, fb: "$f(-x) = x^2 - x$: not $f(x)$, not $-f(x)$." }, { t: "$|x|$", bin: 0, fb: "$|-x| = |x|$." }, { t: "$\\frac{1}{x}$", bin: 1, fb: "$\\frac{1}{-x} = -\\frac{1}{x}$." }, { t: "$x^3 + 1$", bin: 2, fb: "$f(-x) = -x^3 + 1$, while $-f(x) = -x^3 - 1$." }],
        skill: "Even and odd functions", hints: ["Work out $f(-x)$ and compare with $f(x)$ and $-f(x)$."], why: "Even powers and $|x|$ keep the sign; odd powers flip it; a constant added breaks oddness." },
      { type: "learn", kicker: "A harder case",
        prompt: "When it is **neither**. Test $f(x) = x^2 + 2x$.",
        scene: { type: "walk", how: HOW_21, rows: [
          { step: 1, m: "f(-x) = (-x)^2 + 2(-x) = x^2 - 2x", say: "The square loses its minus; the $2x$ term keeps it." },
          { step: 2, m: "f(x) = x^2 + 2x \\quad -f(x) = -x^2 - 2x", say: "Compare with both.", ask: { prompt: "Does $x^2 - 2x$ match $f(x)$ or $-f(x)$?", answer: 0, options: [{ t: "Neither" }, { t: "$f(x)$", fb: "$f(x)$ has $+2x$, not $-2x$." }, { t: "$-f(x)$", fb: "$-f(x)$ has $-x^2$, not $+x^2$." }] } },
          { step: 3, m: "\\text{neither even nor odd}", say: "Most functions are neither: the symmetry is special." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "$f$ is **odd** and $(3, 5)$ is on its graph. Which other point must be on it?",
        options: [{ t: "$(-3, -5)$" }, { t: "$(-3, 5)$", fb: "That would be true for an **even** function." }, { t: "$(3, -5)$", fb: "That would put two outputs at $x = 3$." }],
        answer: 0, skill: "Even and odd functions", hints: ["Odd: $f(-3) = -f(3)$."], why: "$f(-3) = -f(3) = -5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lena says $f(x) = x^3 + 1$ is odd, because $f(-x) = -x^3 + 1$ \"flips the sign\". What is wrong?",
        options: [{ t: "$-f(x) = -x^3 - 1$. The $+1$ did not flip, so $f(-x) \\ne -f(x)$: it is neither." }, { t: "Nothing is wrong.", fb: "An odd function needs every term to flip, including the constant." }, { t: "It is even.", fb: "$f(-x) = -x^3 + 1 \\ne x^3 + 1$." }],
        answer: 0, skill: "Even and odd functions", hints: ["Work out $-f(x)$ completely."], why: "Comparing $-x^3 + 1$ with $-x^3 - 1$ shows they differ." },
      { type: "choice", kicker: "Use it", prompt: "A graph looks the same when folded along the $y$-axis. Which type is it?",
        options: [{ t: "Even" }, { t: "Odd", fb: "An odd graph looks the same after a **half-turn** about the origin." }, { t: "Neither", fb: "A fold-symmetry about the $y$-axis is exactly what even means." }],
        answer: 0, skill: "Even and odd functions", hints: ["Folding along the $y$-axis matches $f(-x) = f(x)$."], why: "$f(-x) = f(x)$: even." }
    ]
  });
  /* ============================================================ 22 · Absolute value functions */
  var HOW_22 = [["Vertex", "In $a|x - h| + k$ the vertex, the point of the V, is $(h, k)$."],
                ["Direction", "$a > 0$ opens up and $a < 0$ opens down. $|a|$ says how steep."],
                ["Plot", "Plot the vertex. Then go 1 right and $a$ up (or down), and 1 left the same way."]];
  var AB22 = function (a, h, k) { return function (x) { return a * Math.abs(x - h) + k; }; };
  LESSONS.push({
    title: "Absolute value functions", art: "fxabs",
    blurb: "Book 1.6 · The V shape: its point, which way it opens, and how steep it is.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $|3 - 7|$.", answer: 4, skill: "Absolute value",
        near: [{ v: -4, fb: "Absolute value is a **distance**: never negative." }, { v: 10, fb: "Work out $3 - 7 = -4$ first, then take the absolute value." }], hints: ["$3 - 7 = -4$."], why: "$|-4| = 4$." },
      { type: "learn", kicker: "Explore",
        prompt: "Move the blue V onto the dashed one. The green steps show the **slope**: 1 right, $a$ up.",
        scene: morph({ keys: ["ab"], x: [-7, 7], y: [-7, 7], u: 23, w: 320, params: { a: { min: -4, max: 4, step: 1, v: 1, label: "$a$" }, h: { min: -5, max: 5, step: 1, v: 0, label: "$h$" }, k: { min: -5, max: 5, step: 1, v: 0, label: "$k$" } },
          tf: function (f, p) { return AB22(p.a, p.h, p.k); }, map: function (pt, p) { return [pt[0] + p.h, p.a * pt[1] + p.k]; }, target: { a: 3, h: -2, k: -4 },
          extra: function (p) { return p.a ? [{ steps: [[p.h, p.k], [p.h + 1, p.k + p.a]], c: "green" }] : []; },
          read: function (p) { return "$y = " + (p.a === 1 ? "" : p.a === -1 ? "-" : nm(p.a)) + "|x " + (p.h < 0 ? "+ " + nm(-p.h) : "- " + nm(p.h)) + "| " + (p.k < 0 ? "- " + nm(-p.k) : "+ " + nm(p.k)) + "$: vertex $(" + nm(p.h) + ",\\ " + nm(p.k) + ")$, " + (p.a > 0 ? "opens up" : p.a < 0 ? "opens down" : "flat"); } }),
        gate: true, then: "$y = 3|x + 2| - 4$: vertex $(-2, -4)$, opening **up**, rising 3 for each 1 across." },
      { type: "learn", kicker: "The idea",
        prompt: "An **absolute value function** $y = a|x - h| + k$ has a V shape. Its point, the **vertex**, is $(h, k)$. The sign of $a$ says which way it opens, and $|a|$ how steep.",
        scene: { type: "method", how: HOW_22 } },
      { type: "learn", kicker: "Watch",
        prompt: "Graph $y = 2|x + 1| - 3$.",
        scene: { type: "walk", how: HOW_22, rows: [
          { step: 1, m: "y = 2|x - (-1)| + (-3)", say: "Match it with $a|x - h| + k$: $h = -1$ and $k = -3$. The vertex is $(-1, -3)$.", fig: plot("The vertex at (-1, -3).", [], [dot(-1, -3, "blue", "(−1, −3)", "s")], { x: [-6, 6], y: [-6, 6], u: 20 }) },
          { step: 2, m: "a = 2 > 0", say: "Positive: it opens **up**. It is steeper than the plain V.", ask: { prompt: "Which way does it open?", answer: 0, options: [{ t: "Up, because $a = 2$ is positive" }, { t: "Down", fb: "A negative $a$ would open it down." }] } },
          { step: 3, m: "(0,\\ -1) \\quad (-2,\\ -1)", say: "From the vertex: 1 right and 2 up gives $(0, -1)$. 1 left and 2 up gives $(-2, -1)$.", fig: plot("The V with its vertex at (-1, -3) and points (0, -1) and (-2, -1).", [{ f: AB22(2, -1, -3), a: -4, b: 4, c: "blue", yr: [-6, 6] }], [dot(-1, -3, "blue"), dot(0, -1, "blue", "(0, −1)", "e"), dot(-2, -1, "blue", "(−2, −1)", "w"), { steps: [[-1, -3], [0, -1]], c: "green" }], { x: [-6, 6], y: [-6, 6], u: 20 }) }] },
        gate: true, then: "Vertex, direction, two points each side: the V is done." },
      { type: "guided", kicker: "Together",
        prompt: "Now you graph $y = -|x - 2| + 4$.",
        how: HOW_22, skill: "Absolute value functions",
        steps: [
          { step: 1, ask: "What is the vertex?", type: "choice", answer: 0, options: [{ t: "$(2,\\ 4)$" }, { t: "$(-2,\\ 4)$", fb: "$x - 2$ means $h = 2$, not $-2$." }, { t: "$(4,\\ 2)$", fb: "The vertex is $(h, k)$: first the shift inside, then the number added outside." }], m: "\\text{vertex } (2,\\ 4)", say: "$h = 2$, $k = 4$." },
          { step: 2, ask: "$a = -1$. Which way does the V open?", type: "choice", answer: 0, options: [{ t: "Down" }, { t: "Up", fb: "A negative $a$ flips it over." }], m: "a = -1 < 0 \\ \\Rightarrow \\ \\text{opens down}", say: "A negative sign turns it upside down." },
          { step: 3, ask: "From the vertex, go 1 right and $a$ up. What is the height there?", type: "num", pre: "$y =$", answer: 3, near: [{ v: 5, fb: "$a = -1$: that is **down** 1, not up." }], hint: "$4 + (-1)$.", m: "(3,\\ 3)", say: "1 right, 1 down: the point $(3, 3)$." }],
        why: "Vertex, direction, plot. Now match an equation." },
      { type: "choice", kicker: "On your own", prompt: "Which equation has vertex $(-3, 2)$, opens **down**, and is no steeper than the plain V?",
        options: [{ t: "$y = -|x + 3| + 2$" }, { t: "$y = -|x - 3| + 2$", fb: "That vertex is at $(3, 2)$. $x + 3$ puts it at $x = -3$." }, { t: "$y = |x + 3| + 2$", fb: "That opens up." }],
        answer: 0, skill: "Absolute value functions", hints: ["$h = -3$ means $x - (-3) = x + 3$."], why: "$y = -|x + 3| + 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Go **backwards**. A V has its vertex at $(2, -1)$ and passes through $(3, 2)$. Write its equation.",
        scene: { type: "walk", how: HOW_22, rows: [
          { step: 1, m: "y = a|x - 2| - 1", say: "The vertex gives $h = 2$ and $k = -1$. Only $a$ is unknown.", fig: plot("The vertex at (2, -1) and the point (3, 2).", [], [dot(2, -1, "blue", "(2, −1)", "s"), dot(3, 2, "orange", "(3, 2)", "ne")], { x: [-2, 6], y: [-4, 5], u: 24 }) },
          { step: 2, m: "(3,\\ 2) \\ \\text{is 1 right and 3 up}", say: "From the vertex to the point: 1 across and 3 up. The V opens up, and $a = 3$.", ask: { prompt: "How far up is $(3, 2)$ from the vertex $(2, -1)$?", answer: 0, options: [{ t: "3" }, { t: "1", fb: "That is how far **across** it is." }] } },
          { step: 3, m: "y = 3|x - 2| - 1", say: "Check: $x = 3$ gives $3(1) - 1 = 2$ ✓.", fig: plot("The V y = 3|x - 2| - 1.", [{ f: AB22(3, 2, -1), a: -2, b: 6, c: "blue", yr: [-4, 5] }], [dot(2, -1, "blue"), dot(3, 2, "blue")], { x: [-2, 6], y: [-4, 5], u: 24 }) }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "What is the **range** of $y = -|x| + 4$?",
        options: [{ t: "$(-\\infty,\\ 4]$" }, { t: "$[\\,4,\\ \\infty)$", fb: "The V opens **down** from its vertex at height 4, so it never goes above 4." }, { t: "$(-\\infty,\\ \\infty)$", fb: "$-|x|$ is never positive, so $-|x| + 4$ is never above 4." }],
        answer: 0, skill: "Absolute value functions", hints: ["Picture an upside-down V with its point at height 4."], why: "The highest height is the vertex, 4." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ravi says $y = |x + 2| - 1$ has its vertex at $(2, -1)$. What is wrong?",
        options: [{ t: "$x + 2 = 0$ at $x = -2$. The vertex is $(-2, -1)$." }, { t: "Nothing is wrong.", fb: "Test $x = 2$: $|4| - 1 = 3$, not the lowest value. The lowest value is at $x = -2$." }, { t: "The vertex is $(-2, 1)$.", fb: "The number added outside is $-1$, so the height is $-1$." }],
        answer: 0, skill: "Absolute value functions", hints: ["When is the inside, $x + 2$, equal to 0?"], why: "The vertex is where the inside is 0." },
      { type: "choice", kicker: "Use it", prompt: "A V-shaped valley has height $e(x) = 20|x - 5|$ metres, with $x$ in kilometres. Where is its lowest point?",
        options: [{ t: "At $x = 5$ km" }, { t: "At $x = -5$ km", fb: "$x - 5 = 0$ at $x = 5$." }, { t: "At $x = 20$ km", fb: "20 is the steepness." }],
        answer: 0, skill: "Absolute value functions", hints: ["The vertex is where $x - 5 = 0$."], why: "The vertex is $(5, 0)$." }
    ]
  });

  /* ============================================ 23 · Absolute value equations and inequalities */
  var HOW_23 = [["Alone", "Get the absolute value alone on one side."],
                ["Split", "$|A| = B$: $A = B$ or $A = -B$. $|A| < B$: $-B < A < B$. $|A| > B$: $A < -B$ or $A > B$."],
                ["Solve each", "Solve each part. Write an inequality's answer as an interval."]];
  var REL23 = { eq: function (d) { return d === 2; }, lt: function (d) { return d < 2; }, gt: function (d) { return d > 2; } };
  LESSONS.push({
    title: "Absolute value equations and inequalities", art: "fxabsq",
    blurb: "Book 1.6 · $|A| = B$, $|A| < B$ and $|A| > B$: distance from a centre.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $2x - 3 = 7$.", pre: "$x =$", answer: 5, skill: "Solve a linear equation",
        near: [{ v: 2, fb: "Add 3 to both sides first: $2x = 10$." }], hints: ["Add 3, then divide by 2."], why: "$2x = 10$, so $x = 5$." },
      { type: "learn", kicker: "Explore",
        prompt: "$|x - 3|$ is the **distance** from $x$ to 3. Slide the point and try $=$, $<$ and $>$ against **2**. Find both points where the distance equals 2.",
        scene: { type: "sketch", x: [-3, 9], y: [-1.6, 1.6], u: 32, w: 440, grid: false, gate: true,
          pts: { P: { at: [3, 0], drag: true, c: "orange", snap: 1, say: "The point x", on: { fn: function (p) { return [Math.max(-2, Math.min(8, Math.round(p[0]))), 0]; } } } },
          chips: { rel: { label: "Test", v: "eq", opts: [["eq", "$|x - 3| = 2$"], ["lt", "$|x - 3| < 2$"], ["gt", "$|x - 3| > 2$"]] } },
          track: function (s) { return REL23[s.c.rel](Math.abs(s.P[0] - 3)) ? s.c.rel + s.P[0] : null; },
          draw: function (s) {
            var r = s.c.rel, items = nlItems(-2, 8, 0).concat([{ pt: [3, 0], c: "purple" }, { seg: [[1, 0.5], [5, 0.5]], c: "soft", dash: true }]);
            if (r === "eq") items.push({ pt: [1, 0], c: "blue" }, { pt: [5, 0], c: "blue" });
            else if (r === "lt") items.push({ seg: [[1, 0], [5, 0]], c: "blue" }, { pt: [1, 0], c: "blue", open: true }, { pt: [5, 0], c: "blue", open: true });
            else items.push({ seg: [[-2, 0], [1, 0]], c: "blue" }, { seg: [[5, 0], [8, 0]], c: "blue" }, { pt: [1, 0], c: "blue", open: true }, { pt: [5, 0], c: "blue", open: true });
            return items;
          },
          readout: function (s) { var x = s.P[0], d = Math.abs(x - 3), ok = REL23[s.c.rel](d), sym = { eq: "=", lt: "<", gt: ">" }[s.c.rel]; return "$|" + nm(x) + " - 3| = " + nm(d) + "$, and $" + nm(d) + (sym === "=" ? " = " : " " + sym + " ") + "2$ is " + (ok ? "**true** ✓" : "false") + "<br>" + (s.tracked.eq1 ? "✓ " : "· ") + "$x = 1$ &nbsp;&nbsp; " + (s.tracked.eq5 ? "✓ " : "· ") + "$x = 5$"; },
          goal: function (s) { return s.tracked.eq1 && s.tracked.eq5; } },
        gate: true, then: "Distance 2 from 3: **two** points, 1 and 5. Less than 2: the stretch **between** them. More than 2: the stretches **outside**." },
      { type: "learn", kicker: "The idea",
        prompt: "$|A|$ is the distance of $A$ from 0. So $|A| = B$ means $A$ is $B$ away: $A = B$ **or** $A = -B$. Less than $B$ means **between** $-B$ and $B$. More than $B$ means **outside** them.",
        scene: { type: "method", how: HOW_23 } },
      { type: "learn", kicker: "Watch",
        prompt: "Solve $|2x - 1| = 5$.",
        scene: { type: "walk", how: HOW_23, rows: [
          { step: 1, m: "|2x - 1| = 5", say: "The absolute value is already alone." },
          { step: 2, m: "2x - 1 = 5 \\quad\\text{or}\\quad 2x - 1 = -5", say: "Two cases: the inside is 5 away from 0, in either direction.", ask: { prompt: "Why two equations?", answer: 0, options: [{ t: "Both $5$ and $-5$ have absolute value 5" }, { t: "To make it harder", fb: "Both $2x - 1 = 5$ and $2x - 1 = -5$ really satisfy $|\\ldots| = 5$." }] } },
          { step: 3, m: "x = 3 \\quad\\text{or}\\quad x = -2", say: "$2x = 6$, and $2x = -4$." },
          { step: 3, m: "|2(3) - 1| = 5 \\ \\checkmark \\quad |2(-2) - 1| = 5 \\ \\checkmark", say: "Both check." }] },
        gate: true, then: "Two solutions: $x = 3$ and $x = -2$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $|x + 3| < 4$.",
        how: HOW_23, skill: "Absolute value equations and inequalities",
        steps: [
          { step: 1, ask: "Is the absolute value alone?", type: "choice", answer: 0, options: [{ t: "Yes" }, { t: "No", fb: "Nothing else is added or multiplied: it is alone." }], m: "|x + 3| < 4", say: "Alone already." },
          { step: 2, ask: "Less than: between $-4$ and $4$. Which line is right?", type: "choice", answer: 0, options: [{ t: "$-4 < x + 3 < 4$" }, { t: "$x + 3 < -4 \\ \\text{or} \\ x + 3 > 4$", fb: "That is for **greater than**: outside." }], m: "-4 < x + 3 < 4", say: "Between." },
          { step: 3, ask: "Subtract 3 from every part. What is the **lower** bound for $x$?", type: "num", pre: "$x >$", answer: -7, near: [{ v: -1, fb: "Subtract 3 from the $-4$ as well: $-4 - 3 = -7$." }], hint: "$-4 - 3$.", m: "-7 < x < 1", say: "Interval: $(-7, 1)$." }],
        why: "Alone, split, solve each. Now another." },
      { type: "choice", kicker: "On your own", prompt: "Solve $|3x| - 2 = 7$.",
        options: [{ t: "$x = 3$ or $x = -3$" }, { t: "$x = 3$ only", fb: "$|3x| = 9$ gives two cases: $3x = 9$ and $3x = -9$." }, { t: "$x = \\frac{5}{3}$ or $x = -\\frac{5}{3}$", fb: "Add 2 first: $|3x| = 9$, not 5." }],
        answer: 0, skill: "Absolute value equations and inequalities", hints: ["First get $|3x|$ alone: add 2."], why: "$|3x| = 9$, so $3x = 9$ or $3x = -9$." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Greater than** goes outside. Solve $|2x - 4| \\ge 6$.",
        scene: { type: "walk", how: HOW_23, rows: [
          { step: 1, m: "|2x - 4| \\ge 6", say: "Alone already." },
          { step: 2, m: "2x - 4 \\le -6 \\quad\\text{or}\\quad 2x - 4 \\ge 6", say: "At least 6 away from 0: either below $-6$ or above 6.", ask: { prompt: "Which word joins the two parts?", answer: 0, options: [{ t: "or" }, { t: "and", fb: "No number is both below $-6$ and above 6. It is one side or the other." }] } },
          { step: 3, m: "x \\le -1 \\quad\\text{or}\\quad x \\ge 5", say: "$2x \\le -2$ and $2x \\ge 10$.", fig: nline("The number line with everything at most -1 and everything at least 5 highlighted.", -3, 7, nline.rng(null, -1, false, true).concat(nline.rng(5, null, true, false))) },
          { step: 3, m: "(-\\infty,\\ -1\\,] \\cup [\\,5,\\ \\infty)", say: "Square brackets: equal is allowed." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Solve $|x + 1| = -2$.",
        options: [{ t: "No solution" }, { t: "$x = 1$ or $x = -3$", fb: "A distance can never be negative, so there is nothing to solve." }, { t: "$x = 1$", fb: "$|1 + 1| = 2$, not $-2$." }],
        answer: 0, skill: "Absolute value equations and inequalities", hints: ["Can an absolute value be negative?"], why: "$|\\ldots| \\ge 0$ always, so it can never equal $-2$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Lin solves $|x - 2| < 3$. Tap the line where the work **first** goes wrong.",
        lines: ["|x - 2| < 3", "x - 2 < 3 \\ \\text{or} \\ x - 2 < -3", "x < 5 \\ \\text{or} \\ x < -1"], answer: 1, fix: "-3 < x - 2 < 3",
        fb: { 0: GIVEN, 2: LATER }, skill: "Absolute value equations and inequalities", hints: ["Less than means between."], why: "$-3 < x - 2 < 3$, so $-1 < x < 5$." },
      { type: "choice", kicker: "Use it", prompt: "A bolt must be 20 mm long, give or take 0.5 mm: $|d - 20| \\le 0.5$. Which lengths pass?",
        options: [{ t: "$19.5 \\le d \\le 20.5$" }, { t: "$d \\le 19.5$ or $d \\ge 20.5$", fb: "Those are the lengths that **fail**: too far from 20." }, { t: "$d \\le 20.5$", fb: "Too short is bad as well: it must be within 0.5 on both sides." }],
        answer: 0, skill: "Absolute value equations and inequalities", hints: ["Less than or equal: between."], why: "$-0.5 \\le d - 20 \\le 0.5$ gives $19.5 \\le d \\le 20.5$." }
    ]
  });

  /* ================================================================ 24 · Inverse functions */
  var HOW_24 = [["Swap", "An inverse swaps each input with its output: $(a, b)$ becomes $(b, a)$."],
                ["Check", "Undoing must bring you back: $f^{-1}(f(x)) = x$."],
                ["One-to-one?", "Only a one-to-one function has an inverse."]];
  var INV = { l: { f: function (x) { return 2 * x - 1; }, lab: "$2x - 1$", lo: -2, hi: 2 }, c: { f: function (x) { return x * x * x / 4; }, lab: "$\\frac{x^3}{4}$", lo: -2, hi: 2 }, e: { f: function (x) { return Math.pow(2, x); }, lab: "$2^x$", lo: -3, hi: 2 } };
  var IW = { x: [-5, 5], y: [-5, 5], u: 24 };
  LESSONS.push({
    title: "Inverse functions", art: "fxinv",
    blurb: "Book 1.7 · A function that undoes another: inputs and outputs swap places.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which operation **undoes** “add 5”?",
        options: [{ t: "subtract 5" }, { t: "multiply by 5", fb: "Multiplying is not the opposite of adding." }, { t: "add $-5$ twice", fb: "That undoes it twice over." }],
        answer: 0, skill: "Inverse operations", hints: ["What takes you back to where you started?"], why: "Subtracting 5 undoes adding 5." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide the point $P$ along $f$. Its **swap**, the orange point, has its coordinates the other way round. All the swaps make a new curve. Try **all three** functions.",
        scene: { type: "sketch", x: [-5, 5], y: [-5, 5], u: 26, w: 320, gate: true,
          pts: { P: { at: [1, 1], drag: true, c: "blue", snap: 0.5, say: "The point P", on: { fn: function (p, s) { var I = INV[s.c.fn], x = Math.max(I.lo, Math.min(I.hi, Math.round(p[0] * 2) / 2)); return [x, I.f(x)]; } } } },
          chips: { fn: { label: "Function", v: "l", opts: [["l", "$2x - 1$"], ["c", "$\\frac{x^3}{4}$"], ["e", "$2^x$"]] } },
          draw: function (s) {
            var I = INV[s.c.fn], x = s.P[0], y = s.P[1];
            return [{ line: [[-5, -5], [5, 5]], c: "purple", dash: true, bare: true }].concat(curve(I.f, -5, 5, "blue", [-5, 5]), curveT(function (t) { return [I.f(t), t]; }, -5, 5, "orange"),
              [{ seg: [[x, y], [y, x]], c: "ink", dash: true }, { pt: [y, x], c: "orange" }]);
          },
          readout: function (s) { var x = s.P[0], y = r2(s.P[1]); return "$(" + nm(x) + ",\\ " + nm(y) + ")$ on $f$ &nbsp;→&nbsp; $(" + nm(y) + ",\\ " + nm(x) + ")$ on the inverse<br>Looked at " + Math.min(Object.keys(s.seen.fn).length, 3) + " of 3"; },
          goal: function (s) { return Object.keys(s.seen.fn).length >= 3; } },
        gate: true, then: "The inverse is the graph of $f$ **reflected in the line $y = x$**: every point $(a, b)$ becomes $(b, a)$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **inverse** of $f$, written $f^{-1}$, undoes $f$: if $f(a) = b$ then $f^{-1}(b) = a$. $f^{-1}$ is **not** $\\frac{1}{f}$: the $-1$ is a name, not a power.",
        scene: { type: "method", how: HOW_24 } },
      { type: "learn", kicker: "Watch",
        prompt: "$f$ takes $1 \\to 4$, $2 \\to 7$ and $3 \\to 10$. Watch its inverse built.",
        scene: { type: "walk", how: HOW_24, rows: [
          { step: 1, m: "1 \\to 4 \\quad 2 \\to 7 \\quad 3 \\to 10", say: "The function $f$, as arrows from inputs to outputs.", fig: mapfig("Arrows from 1, 2, 3 to 4, 7, 10.", ["1", "2", "3"], ["4", "7", "10"], [[0, 0], [1, 1], [2, 2]]) },
          { step: 1, m: "4 \\to 1 \\quad 7 \\to 2 \\quad 10 \\to 3", say: "**Swap**: now 4, 7 and 10 are the inputs. Turn every arrow round.", fig: mapfig("Arrows from 4, 7, 10 back to 1, 2, 3.", ["4", "7", "10"], ["1", "2", "3"], [[0, 0], [1, 1], [2, 2]], { inName: "inputs of f⁻¹", outName: "outputs" }),
            ask: { prompt: "What is $f^{-1}(7)$?", answer: 0, options: [{ t: "$2$, because $f(2) = 7$" }, { t: "$\\frac{1}{7}$", fb: "$f^{-1}$ is not a reciprocal: it undoes $f$." }] } },
          { step: 2, m: "f^{-1}(f(2)) = f^{-1}(7) = 2", say: "Check: do $f$, then $f^{-1}$: you are back at 2." },
          { step: 3, m: "\\text{one-to-one} \\ \\Rightarrow \\ \\text{inverse exists}", say: "Each output came from exactly one input, so the arrows can be turned round." }] },
        gate: true, then: "$f^{-1}$ sends every output back to its input." },
      { type: "guided", kicker: "Together",
        prompt: "Now you work with $f(x) = x + 5$.",
        how: HOW_24, skill: "Inverse functions",
        steps: [
          { step: 1, ask: "$f(3) = 8$. So what is $f^{-1}(8)$?", type: "num", pre: "$f^{-1}(8) =$", answer: 3, near: [{ v: 8, fb: "$f^{-1}$ takes the output 8 **back** to its input." }], hint: "What did $f$ turn into 8?", m: "f^{-1}(8) = 3", say: "Swap: 8 goes back to 3." },
          { step: 2, ask: "Check: $f^{-1}(f(3)) = f^{-1}(8)$. What is it?", type: "num", pre: "$=$", answer: 3, near: [{ v: 8, fb: "It must bring us back to the **3** we started with." }], hint: "The same as the line above.", m: "f^{-1}(f(3)) = 3", say: "Back where we began." },
          { step: 3, ask: "$f(x) = x + 5$ gives each output from exactly one input. So it…", type: "choice", answer: 0, options: [{ t: "has an inverse" }, { t: "has no inverse", fb: "One-to-one functions always have an inverse." }], m: "\\text{one-to-one}", say: "So it has an inverse: $f^{-1}(x) = x - 5$." }],
        why: "Swap, check, one-to-one. Now from a table." },
      { type: "num", kicker: "On your own", prompt: "$f$ is one-to-one with $f(2) = 9$ and $f(5) = 4$. What is $f^{-1}(4)$?", pre: "$f^{-1}(4) =$", answer: 5, skill: "Inverse functions",
        near: [{ v: 2, fb: "$f(2) = 9$, so $f^{-1}(9) = 2$. The output 4 came from the input 5." }, { v: 0.25, fb: "$f^{-1}$ is not $\\frac{1}{f}$." }],
        hints: ["Which input gave the output 4?"], why: "$f(5) = 4$, so $f^{-1}(4) = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Not every function has an inverse. $f(x) = x^2$ has $f(2) = 4$ **and** $f(-2) = 4$. What would $f^{-1}(4)$ be?",
        scene: { type: "walk", how: HOW_24, rows: [
          { step: 1, m: "2 \\to 4 \\quad -2 \\to 4", say: "Two different inputs lead to the output 4.", fig: mapfig("Arrows from 2 and -2 to 4.", ["2", "−2"], ["4"], [[0, 0], [1, 0]]) },
          { step: 1, m: "4 \\to 2 \\ \\text{and} \\ 4 \\to -2", say: "Turn the arrows round: the input 4 now has **two** outputs.", fig: mapfig("Arrows from 4 to 2 and to -2.", ["4"], ["2", "−2"], [[0, 0], [0, 1]], { hot: [0, 1] }), ask: { prompt: "Is the reversed relation a function?", answer: 0, options: [{ t: "No: 4 has two outputs" }, { t: "Yes", fb: "A function gives each input one output. Here 4 has two." }] } },
          { step: 3, m: "f(x) = x^2 \\ \\text{is not one-to-one}", say: "Two inputs share an output, so the swap fails: no inverse. (Restrict the domain, and it works: next lesson.)" }] },
        gate: true, then: "A function that is **not** one-to-one has no inverse." },
      { type: "num", kicker: "Try it", prompt: "$f(x) = 2x + 3$ and $g(x) = \\dfrac{x - 3}{2}$. Find $g(f(5))$.", pre: "$g(f(5)) =$", answer: 5, skill: "Inverse functions",
        near: [{ v: 13, fb: "$f(5) = 13$. Now put 13 into $g$: $\\frac{13 - 3}{2}$." }],
        hints: ["$f(5) = 13$. Then $g(13)$."], why: "$f(5) = 13$ and $g(13) = \\frac{10}{2} = 5$: $g$ undoes $f$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Eli says $f^{-1}(x)$ means $\\dfrac{1}{f(x)}$. What is wrong?",
        options: [{ t: "$f^{-1}$ is the **inverse function**, which undoes $f$. The reciprocal is a different thing." }, { t: "Nothing is wrong.", fb: "For $f(x) = x + 5$, $\\frac{1}{f(x)} = \\frac{1}{x + 5}$, but the inverse is $x - 5$." }, { t: "It means $-f(x)$.", fb: "The $-1$ is not a sign: it is part of the name." }],
        answer: 0, skill: "Inverse functions", hints: ["What undoes $x + 5$?"], why: "The $-1$ is a name, not a power." },
      { type: "num", kicker: "Use it", prompt: "Fahrenheit is $F(C) = 1.8C + 32$. $F^{-1}$ turns Fahrenheit back into Celsius. What is $F^{-1}(212)$?", pre: "$F^{-1}(212) =$", post: "°C", answer: 100, skill: "Inverse functions",
        near: [{ v: 212, fb: "212 is the output of $F$. Which input gives it?" }], hints: ["Which $C$ makes $1.8C + 32 = 212$?"], why: "$F(100) = 180 + 32 = 212$, so $F^{-1}(212) = 100$." }
    ]
  });

  /* ===================================================== 25 · Finding and graphing an inverse */
  var HOW_25 = [["Write y", "Write the function as $y = \\dots$"],
                ["Swap", "Swap $x$ and $y$."],
                ["Solve for y", "Solve for $y$. That is $f^{-1}(x)$."]];
  LESSONS.push({
    title: "Finding and graphing an inverse", art: "fxinv",
    blurb: "Book 1.7 · Find the formula by swapping $x$ and $y$, and see why a domain sometimes has to be cut.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Solve $x = 2y + 1$ for $y$.",
        options: [{ t: "$y = \\dfrac{x - 1}{2}$" }, { t: "$y = 2x - 1$", fb: "Subtract 1 first, then divide by 2." }, { t: "$y = \\dfrac{x}{2} + 1$", fb: "Subtract 1 from both sides first: $x - 1 = 2y$." }],
        answer: 0, skill: "Solve a formula", hints: ["Undo the $+1$, then undo the $\\times 2$."], why: "$x - 1 = 2y$, so $y = \\frac{x - 1}{2}$." },
      { type: "learn", kicker: "Explore",
        prompt: "$f(x) = x^2$. Slide the point, and swap it. Does the swapped curve pass the **vertical line test**? Try both domains: **all $x$**, and **$x \\ge 0$** only.",
        scene: { type: "sketch", x: [-5, 5], y: [-3, 5], u: 28, w: 320, gate: true,
          pts: { P: { at: [2, 4], drag: true, c: "blue", snap: 1, say: "The point P", on: { fn: function (p, s) { var lo = s.c.dom === "all" ? -2 : 0, x = Math.max(lo, Math.min(2, Math.round(p[0]))); return [x, x * x]; } } } },
          chips: { dom: { label: "Domain", v: "all", opts: [["all", "all $x$"], ["pos", "$x \\ge 0$"]] } },
          draw: function (s) {
            var all = s.c.dom === "all", x = s.P[0], y = s.P[1], lo = all ? -2.2 : 0;
            var items = [{ line: [[-5, -5], [5, 5]], c: "purple", dash: true, bare: true }].concat(curve(function (t) { return t * t; }, lo, 2.2, "blue", [-3, 5]), curveT(function (t) { return [t * t, t]; }, lo, 2.2, "orange"), [{ seg: [[x, y], [y, x]], c: "ink", dash: true }, { pt: [y, x], c: "orange" }]);
            if (all && x > 0) items.push({ pt: [y, -x], c: "red" });
            return items;
          },
          readout: function (s) { var all = s.c.dom === "all", x = s.P[0], y = s.P[1]; return all ? "$x = " + nm(x) + "$ swaps to $(" + nm(y) + ",\\ " + nm(x) + ")$." + (x > 0 ? " But $x = " + nm(-x) + "$ also gives " + nm(y) + ", so the input " + nm(y) + " has **two** outputs ✗" : "") : "Only the right half, so every swapped input has **one** output ✓ (it is $\\sqrt{x}$)"; },
          goal: function (s) { return Object.keys(s.seen.dom).length >= 2; } },
        gate: true, then: "With every $x$, the swapped curve is a sideways parabola: **not a function**. Cut the domain to $x \\ge 0$ and the swap is $\\sqrt{x}$: a function." },
      { type: "learn", kicker: "The idea",
        prompt: "To find $f^{-1}$: write $y = f(x)$, **swap** $x$ and $y$, then **solve for $y$**. The graph of $f^{-1}$ is the graph of $f$ reflected in the line $y = x$.",
        scene: { type: "method", how: HOW_25 } },
      { type: "learn", kicker: "Watch",
        prompt: "Find the inverse of $f(x) = 3x - 2$.",
        scene: { type: "walk", how: HOW_25, rows: [
          { step: 1, m: "y = 3x - 2", say: "Write $f(x)$ as $y$." },
          { step: 2, m: "x = 3y - 2", say: "Swap $x$ and $y$.", ask: { prompt: "What do we swap?", answer: 0, options: [{ t: "The letters $x$ and $y$" }, { t: "The numbers $3$ and $2$", fb: "Only the variables trade places." }] } },
          { step: 3, m: "x + 2 = 3y", say: "Add 2 to both sides." },
          { step: 3, m: "y = \\frac{x + 2}{3}", say: "Divide both sides by 3.", fig: plot("The line y = 3x - 2 and its inverse y = (x + 2) / 3, mirror images in the dashed line y = x.", [{ f: function (x) { return 3 * x - 2; }, a: -2, b: 3, c: "blue", yr: [-5, 5] }, { f: function (x) { return (x + 2) / 3; }, a: -5, b: 5, c: "orange", yr: [-5, 5] }], [{ line: [[-5, -5], [5, 5]], c: "purple", dash: true, bare: true }], { x: [-5, 5], y: [-5, 5], u: 22 }) }] },
        gate: true, then: "$f^{-1}(x) = \\dfrac{x + 2}{3}$. Its graph is the mirror image of $f$ in the line $y = x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the inverse of $f(x) = 2x + 6$.",
        how: HOW_25, skill: "Finding an inverse",
        steps: [
          { step: 1, ask: "Write it with $y$.", type: "choice", answer: 0, options: [{ t: "$y = 2x + 6$" }, { t: "$x = 2y + 6$", fb: "That is the **next** step: swapping." }], m: "y = 2x + 6", say: "Rename $f(x)$ as $y$." },
          { step: 2, ask: "Swap $x$ and $y$.", type: "choice", answer: 0, options: [{ t: "$x = 2y + 6$" }, { t: "$y = 6x + 2$", fb: "Swap only the letters. The numbers stay where they are." }], m: "x = 2y + 6", say: "Trade the letters." },
          { step: 3, ask: "Solve for $y$. After subtracting 6, what do you divide by?", type: "num", pre: "divide by", answer: 2, near: [{ v: 6, fb: "$x - 6 = 2y$: the 2 multiplies $y$." }], hint: "The number multiplying $y$.", m: "y = \\frac{x - 6}{2}", say: "$f^{-1}(x) = \\frac{x - 6}{2}$." }],
        why: "Write $y$, swap, solve. Now type one yourself." },
      { type: "expr", kicker: "On your own", prompt: "Find $f^{-1}(x)$ for $f(x) = 4x - 8$.", answer: "(x+8)/4", shown: "(x + 8)/4", skill: "Finding an inverse", placeholder: "Use x",
        near: [{ v: "(x-8)/4", fb: "$x = 4y - 8$: **add** 8 to both sides, not subtract." }, { v: "4x+8", fb: "Solve for $y$: divide by 4 as well." }],
        hints: ["$x = 4y - 8$. Add 8, then divide by 4."], why: "$x + 8 = 4y$, so $y = \\frac{x + 8}{4}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A function that needs its domain **cut**. $f(x) = x^2 + 1$ for $x \\ge 0$. Find $f^{-1}$.",
        scene: { type: "walk", how: HOW_25, rows: [
          { step: 1, m: "y = x^2 + 1, \\quad x \\ge 0", say: "Cutting the domain makes it one-to-one." },
          { step: 2, m: "x = y^2 + 1", say: "Swap. The old inputs ($x \\ge 0$) are now the **outputs**: $y \\ge 0$." },
          { step: 3, m: "y^2 = x - 1 \\quad\\Rightarrow\\quad y = \\pm\\sqrt{x - 1}", say: "Two roots appear.", ask: { prompt: "Which root fits $y \\ge 0$?", answer: 0, options: [{ t: "The positive one, $+\\sqrt{x - 1}$" }, { t: "The negative one", fb: "The outputs of $f^{-1}$ were the inputs of $f$, which were at least 0." }] } },
          { step: 3, m: "f^{-1}(x) = \\sqrt{x - 1}, \\quad x \\ge 1", say: "Domain of $f^{-1}$ is the range of $f$: $[\\,1,\\ \\infty)$." }] },
        gate: true, then: "The **domain** of $f^{-1}$ is the **range** of $f$ — and the range of $f^{-1}$ is the domain of $f$." },
      { type: "choice", kicker: "Try it", prompt: "What is the inverse of $f(x) = x^3 + 2$?",
        options: [{ t: "$\\sqrt[3]{x - 2}$" }, { t: "$\\sqrt[3]{x} - 2$", fb: "Subtract 2 **inside** the root: $x - 2 = y^3$." }, { t: "$(x - 2)^3$", fb: "That is not undoing the cube: undo it with a cube **root**." }],
        answer: 0, skill: "Finding an inverse", hints: ["$x = y^3 + 2$."], why: "$x - 2 = y^3$, so $y = \\sqrt[3]{x - 2}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Dan finds the inverse of $f(x) = 2x + 4$. Tap the line where the work **first** goes wrong.",
        lines: ["y = 2x + 4", "x = 2y + 4", "y = 2x - 4"], answer: 2, fix: "y = \\frac{x - 4}{2}",
        fb: { 0: GIVEN, 1: "Swapping the letters is right." }, skill: "Finding an inverse", hints: ["What multiplies $y$?"], why: "$x - 4 = 2y$, so $y = \\frac{x - 4}{2}$." },
      { type: "num", kicker: "Use it", prompt: "A taxi costs $c(d) = 3 + 2d$ dollars for $d$ kilometres. The inverse tells you how far you can go for a given cost. How many km for 15 dollars?", pre: "$d =$", post: "km", answer: 6, skill: "Finding an inverse",
        near: [{ v: 27, fb: "That is $c(12)$. We want the $d$ with $3 + 2d = 15$." }, { v: 12, fb: "Subtract 3 first: $2d = 12$. Then divide by 2." }],
        hints: ["$c^{-1}(x) = \\frac{x - 3}{2}$."], why: "$c^{-1}(15) = \\frac{12}{2} = 6$ km." }
    ]
  });
  /* ================================================================ Skills */
  function ivl(a, b, ca, cb) { return (ca ? "[" : "(") + "\\," + a + ",\\ " + b + "\\," + (cb ? "]" : ")"); }
  var SKILLS = [
    { id: "pc1-function", title: "Is the relation a function?", lesson: 2,
      gen: function (R) {
        var n = R.int(3, 4), xs = R.shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, n), isFn = R.chance(0.5), pairs = xs.map(function (x) { return [x, R.int(1, 9)]; });
        var k = R.int(0, n - 1), twice = null;
        if (!isFn) { var y2 = pairs[k][1] + R.nz(-3, 3); if (y2 < 1 || y2 === pairs[k][1]) y2 = pairs[k][1] + 2; twice = [pairs[k][0], pairs[k][1], y2]; pairs.splice(k + 1, 0, [pairs[k][0], y2]); }
        var txt = pairs.map(function (p) { return "(" + p[0] + ", " + p[1] + ")"; }).join(",\\ ");
        var why = isFn ? "Every input appears once, so each has exactly one output." : "The input " + twice[0] + " has two outputs, " + twice[1] + " and " + twice[2] + ".";
        return mc(R, { prompt: "Is this relation a function? $" + txt + "$", right: isFn ? "Yes, a function" : "No, not a function",
          wrong: [{ t: isFn ? "No, not a function" : "Yes, a function", fb: why }], keep: true,
          hints: ["Does any input appear in two pairs with different outputs?"], why: why });
      } },
    { id: "pc1-evaluate", title: "Evaluate a function", lesson: 3,
      gen: function (R) {
        var a = R.pick([1, 1, 2, 3, -1, -2]), b = R.nz(-5, 5), c = R.int(-6, 6), k = R.nz(-4, 4), ans = a * k * k + b * k + c, f = poly([[a, "x^2"], [b, "x"], [c, ""]]);
        return { type: "num", prompt: "Let $f(x) = " + f + "$. Find $f(" + k + ")$.", pre: "$f(" + k + ") =$", answer: ans,
          near: near(ans, [{ v: a * k * k - b * k + c, fb: "Watch the sign of $" + b + " \\cdot " + par(k) + "$." }, { v: -a * k * k + b * k + c, fb: "$" + par(k) + "^2 = " + k * k + "$: a square is never negative." }]),
          hints: ["Put $" + par(k) + "$ in place of every $x$."], why: "$f(" + k + ") = " + a + "(" + k * k + ") " + signed(b * k) + " " + signed(c) + " = " + ans + "$." };
      } },
    { id: "pc1-readtable", title: "Read a table of a function", lesson: 4,
      gen: function (R) {
        var xs = [-2, -1, 0, 1, 2, 3], ys = R.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 6), i = R.int(0, 5), back = R.chance(0.5);
        var t = tbl(["$x$", "$f(x)$"], xs.map(function (x, j) { return [x, ys[j]]; }));
        return back ? { type: "num", prompt: "Use the table. For which input is $f(x) = " + ys[i] + "$?" + t, pre: "$x =$", answer: xs[i], near: near(xs[i], [{ v: ys[i], fb: "That is the output. Find it in the $f(x)$ row, then read its $x$." }]),
                        hints: ["Find " + ys[i] + " in the $f(x)$ row."], why: "$f(" + xs[i] + ") = " + ys[i] + "$." }
                    : { type: "num", prompt: "Use the table. Find $f(" + xs[i] + ")$." + t, pre: "$f(" + xs[i] + ") =$", answer: ys[i], near: near(ys[i], [{ v: xs[i], fb: "That is the input. Read the $f(x)$ row." }]),
                        hints: ["Find $x = " + xs[i] + "$ in the top row."], why: "$f(" + xs[i] + ") = " + ys[i] + "$." };
      } },
    { id: "pc1-interval", title: "Write a set in interval notation", lesson: 7,
      gen: function (R) {
        var a = R.int(-6, 2), b = a + R.int(2, 7), ca = R.chance(0.5), cb = R.chance(0.5);
        var ineq = "$" + a + (ca ? " \\le " : " < ") + "x" + (cb ? " \\le " : " < ") + b + "$", right = "$" + ivl(a, b, ca, cb) + "$";
        return mc(R, { prompt: "Write " + ineq + " in interval notation.", right: right,
          wrong: [{ t: "$" + ivl(a, b, !ca, cb) + "$", fb: "Check the left end: $" + (ca ? "\\le" : "<") + "$ means " + (ca ? "included: a square bracket." : "not included: a round bracket.") },
                  { t: "$" + ivl(a, b, ca, !cb) + "$", fb: "Check the right end: $" + (cb ? "\\le" : "<") + "$ means " + (cb ? "included: a square bracket." : "not included: a round bracket.") },
                  { t: "$" + ivl(b, a, ca, cb) + "$", fb: "The smaller number goes first." }],
          hints: ["$\\le$ is a square bracket; $<$ is a round one."], why: "Left: " + (ca ? "square" : "round") + ". Right: " + (cb ? "square" : "round") + "." });
      } },
    { id: "pc1-domain", title: "Find the domain of a formula", lesson: 8,
      gen: function (R) {
        var p = R.nz(-6, 6), kind = R.int(0, 2), c = R.int(1, 7);
        if (kind === 0) {
          var f = "\\frac{" + c + "}{x " + (p < 0 ? "+ " + (-p) : "- " + p) + "}";
          return mc(R, { prompt: "What is the domain of $f(x) = " + f + "$?", right: "all real numbers except $" + p + "$",
            wrong: [{ t: "all real numbers except $" + (-p) + "$", fb: "Solve $x " + (p < 0 ? "+ " + (-p) : "- " + p) + " = 0$: $x = " + p + "$." }, { t: "all real numbers", fb: "The bottom must not be 0." }, { t: "$[\\," + p + ",\\ \\infty)$", fb: "There is no root here: only the bottom matters." }], keep: true,
            hints: ["Solve (bottom) $= 0$."], why: "The bottom is 0 at $x = " + p + "$." });
        }
        var up = kind === 1, f2 = up ? "\\sqrt{x " + (p < 0 ? "+ " + (-p) : "- " + p) + "}" : "\\sqrt{" + p + " - x}";
        return mc(R, { prompt: "What is the domain of $f(x) = " + f2 + "$?", right: up ? "$[\\," + p + ",\\ \\infty)$" : "$(-\\infty,\\ " + p + "\\,]$",
          wrong: [{ t: up ? "$(\\," + p + ",\\ \\infty)$" : "$(-\\infty,\\ " + p + "\\,)$", fb: "At the end, the root is $\\sqrt{0} = 0$: allowed. Square bracket." }, { t: up ? "$[\\," + (-p) + ",\\ \\infty)$" : "$(-\\infty,\\ " + (-p) + "\\,]$", fb: "Solve (inside) $\\ge 0$ carefully." }, { t: up ? "$(-\\infty,\\ " + p + "\\,]$" : "$[\\," + p + ",\\ \\infty)$", fb: "Test a number: is the inside non-negative there?" }], keep: true,
          hints: ["The inside of a root must be $\\ge 0$."], why: "Inside $\\ge 0$ gives " + (up ? "$x \\ge " + p + "$" : "$x \\le " + p + "$") + "." });
      } },
    { id: "pc1-piecewise", title: "Evaluate a piecewise function", lesson: 10,
      gen: function (R) {
        var t = R.int(-1, 3), m1 = R.nz(-3, 3), b1 = R.int(-4, 4), m2 = R.nz(-3, 3), b2 = R.int(-4, 4), x0 = R.pick([t - 2, t - 1, t, t, t + 1, t + 3]);
        var f = function (x) { return x < t ? m1 * x + b1 : m2 * x + b2; }, left = x0 < t;
        var ans = f(x0), other = left ? m2 * x0 + b2 : m1 * x0 + b1;
        return { type: "num", prompt: "$$f(x) = \\cases{" + poly([[m1, "x"], [b1, ""]]) + " & x < " + t + " \\\\ " + poly([[m2, "x"], [b2, ""]]) + " & x \\ge " + t + "}$$Find $f(" + x0 + ")$.", pre: "$f(" + x0 + ") =$", answer: ans,
          near: near(ans, [{ v: other, fb: "That uses the wrong piece. " + (x0 === t ? "At the boundary, $x \\ge " + t + "$ includes " + t + "." : "Is $" + x0 + " < " + t + "$?") }]),
          hints: ["First decide: is $" + x0 + " < " + t + "$?"], why: (left ? "$" + x0 + " < " + t + "$: use the first rule." : "$" + x0 + " \\ge " + t + "$: use the second rule.") + " $f(" + x0 + ") = " + ans + "$." };
      } },
    { id: "pc1-arc", title: "Average rate of change", lesson: 11,
      gen: function (R) {
        var p = R.pick([1, 2, 3, -1, -2]), q = R.nz(-4, 4), r = R.int(-5, 5), a = R.int(-3, 2), b = a + R.int(1, 4), f = function (x) { return p * x * x + q * x + r; };
        var ans = (f(b) - f(a)) / (b - a), form = poly([[p, "x^2"], [q, "x"], [r, ""]]);
        return { type: "num", prompt: "Find the average rate of change of $f(x) = " + form + "$ from $x = " + a + "$ to $x = " + b + "$.", answer: ans,
          near: near(ans, [{ v: f(b) - f(a), fb: "That is only the change in output. Divide by the change in input, $" + b + " - " + par(a) + "$." }, { v: (f(a) - f(b)) / (b - a), fb: "Subtract in the same order on the top and the bottom." }]),
          hints: ["$\\frac{f(" + b + ") - f(" + a + ")}{" + b + " - " + par(a) + "}$."], why: "$f(" + b + ") = " + f(b) + "$ and $f(" + a + ") = " + f(a) + "$, so $\\frac{" + (f(b) - f(a)) + "}{" + (b - a) + "} = " + ans + "$." };
      } },
    { id: "pc1-combine", title: "Combine functions", lesson: 13,
      gen: function (R) {
        var a = R.nz(-3, 3), b = R.int(-4, 4), c = R.pick([1, 2, -1]), d = R.int(-4, 4), e = R.nz(-3, 3), k = R.nz(-3, 3), op = R.pick(["+", "-", "\\cdot"]);
        var f = function (x) { return a * x + b; }, g = function (x) { return c * x * x + d * x + e; }, ans = op === "+" ? f(k) + g(k) : op === "-" ? f(k) - g(k) : f(k) * g(k);
        var name = op === "+" ? "f + g" : op === "-" ? "f - g" : "f \\cdot g", wrongOp = op === "+" ? f(k) - g(k) : op === "-" ? f(k) + g(k) : f(k) + g(k);
        return { type: "num", prompt: "$f(x) = " + poly([[a, "x"], [b, ""]]) + "$ and $g(x) = " + poly([[c, "x^2"], [d, "x"], [e, ""]]) + "$. Find $(" + name + ")(" + k + ")$.", pre: "$(" + name + ")(" + k + ") =$", answer: ans,
          near: near(ans, [{ v: wrongOp, fb: "Check the operation: $" + name + "$ means " + (op === "+" ? "add" : op === "-" ? "subtract" : "multiply") + " the outputs." }]),
          hints: ["$f(" + k + ") = " + f(k) + "$ and $g(" + k + ") = " + g(k) + "$."], why: "$f(" + k + ") = " + f(k) + "$ and $g(" + k + ") = " + g(k) + "$, so the result is " + ans + "." };
      } },
    { id: "pc1-compose", title: "Evaluate a composite function", lesson: 14,
      gen: function (R) {
        var a = R.nz(-3, 3), b = R.int(-4, 4), c = R.pick([1, 2, -1]), d = R.int(-4, 4), k = R.nz(-3, 3), fg = R.chance(0.5);
        var f = function (x) { return a * x + b; }, g = function (x) { return c * x * x + d; }, inner = fg ? g(k) : f(k), ans = fg ? f(g(k)) : g(f(k)), other = fg ? g(f(k)) : f(g(k));
        return { type: "num", prompt: "$f(x) = " + poly([[a, "x"], [b, ""]]) + "$ and $g(x) = " + poly([[c, "x^2"], [d, ""]]) + "$. Find $" + (fg ? "f(g(" + k + "))" : "g(f(" + k + "))") + "$.", answer: ans,
          near: near(ans, [{ v: other, fb: "That is the other order. In $" + (fg ? "f(g(" + k + "))" : "g(f(" + k + "))") + "$ the **inside** function is $" + (fg ? "g" : "f") + "$." }]),
          hints: ["Work out the inside first: $" + (fg ? "g" : "f") + "(" + k + ") = " + inner + "$."], why: "$" + (fg ? "g" : "f") + "(" + k + ") = " + inner + "$, then the outside gives " + ans + "." };
      } },
    { id: "pc1-shift", title: "Move a point under a transformation", lesson: 18,
      gen: function (R) {
        var p = R.int(-4, 4), q = R.int(-4, 4), h = R.nz(-4, 4), k = R.nz(-4, 4);
        var tf = "f(x " + (h < 0 ? "+ " + (-h) : "- " + h) + ") " + (k < 0 ? "- " + (-k) : "+ " + k);
        var right = "$(" + (p + h) + ",\\ " + (q + k) + ")$";
        return mc(R, { prompt: "$(" + p + ", " + q + ")$ is on $y = f(x)$. Which point is on $y = " + tf + "$?", right: right,
          wrong: [{ t: "$(" + (p - h) + ",\\ " + (q + k) + ")$", fb: "The sign inside looks backwards: $x " + (h < 0 ? "+ " + (-h) : "- " + h) + "$ moves **" + (h > 0 ? "right" : "left") + "**." }, { t: "$(" + (p + h) + ",\\ " + (q - k) + ")$", fb: "The number outside moves the graph the way its sign says: " + (k > 0 ? "up" : "down") + "." }, { t: "$(" + p + ",\\ " + q + ")$", fb: "A shift moves every point." }], keep: true,
          hints: ["Inside moves sideways (backwards), outside moves up or down."], why: "$x \\to " + (p + h) + "$ and $y \\to " + (q + k) + "$." });
      } },
    { id: "pc1-reflect", title: "Reflect a point", lesson: 19,
      gen: function (R) {
        var p = R.nz(-5, 5), q = R.nz(-5, 5), kind = R.int(0, 2), name = ["-f(x)", "f(-x)", "-f(-x)"][kind], img = [[p, -q], [-p, q], [-p, -q]][kind];
        var all = [[p, -q], [-p, q], [-p, -q], [p, q]].filter(function (z) { return !(z[0] === img[0] && z[1] === img[1]); });
        return mc(R, { prompt: "$(" + p + ", " + q + ")$ is on $y = f(x)$. Which point is on $y = " + name + "$?", right: "$(" + img[0] + ",\\ " + img[1] + ")$",
          wrong: all.slice(0, 3).map(function (z) { return { t: "$(" + z[0] + ",\\ " + z[1] + ")$", fb: "A minus **outside** changes the sign of the height. A minus **inside** changes the sign of the input." }; }), keep: true,
          hints: ["Outside: height. Inside: input."], why: "$" + name + "$ sends $(" + p + ", " + q + ")$ to $(" + img[0] + ", " + img[1] + ")$." });
      } },
    { id: "pc1-evenodd", title: "Even, odd or neither", lesson: 22,
      gen: function (R) {
        var pool = [["x^2 + " + R.int(1, 5), "Even", "Only even powers and a constant: $f(-x) = f(x)$."], ["x^3 - " + R.int(1, 4) + "x", "Odd", "Every power is odd, so $f(-x) = -f(x)$."], ["x^2 + " + R.int(1, 4) + "x", "Neither", "The $x^2$ term keeps its sign and the $x$ term flips, so $f(-x)$ matches neither $f(x)$ nor $-f(x)$."], ["x^4 - " + R.int(2, 6) + "x^2", "Even", "Only even powers: $f(-x) = f(x)$."], ["x^3 + " + R.int(1, 5), "Neither", "The constant does not flip, so it is not odd; the cube does, so it is not even."], ["|x| + " + R.int(1, 3), "Even", "$|-x| = |x|$."]];
        var q = R.pick(pool), right = q[1];
        return mc(R, { prompt: "Is $f(x) = " + q[0] + "$ even, odd or neither?", right: right, wrong: ["Even", "Odd", "Neither"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: q[2] }; }), keep: true,
          hints: ["Work out $f(-x)$ and compare with $f(x)$ and $-f(x)$."], why: q[2] });
      } },
    { id: "pc1-vertex", title: "The vertex of an absolute value graph", lesson: 23,
      gen: function (R) {
        var a = R.pick([1, 2, 3, -1, -2]), h = R.nz(-5, 5), k = R.nz(-5, 5);
        var f = (a === 1 ? "" : a === -1 ? "-" : String(a)) + "|x " + (h < 0 ? "+ " + (-h) : "- " + h) + "| " + (k < 0 ? "- " + (-k) : "+ " + k);
        return mc(R, { prompt: "What is the vertex of $y = " + f + "$?", right: "$(" + h + ",\\ " + k + ")$",
          wrong: [{ t: "$(" + (-h) + ",\\ " + k + ")$", fb: "$x " + (h < 0 ? "+ " + (-h) : "- " + h) + " = 0$ at $x = " + h + "$: the inside sign looks backwards." }, { t: "$(" + h + ",\\ " + (-k) + ")$", fb: "The number added outside is the height itself: $" + k + "$." }, { t: "$(" + k + ",\\ " + h + ")$", fb: "The vertex is $(h, k)$: sideways first." }], keep: true,
          hints: ["The vertex is where the inside is 0."], why: "The inside is 0 at $x = " + h + "$, where $y = " + k + "$." });
      } },
    { id: "pc1-absvalue", title: "Solve an absolute value equation", lesson: 24,
      gen: function (R) {
        var s1 = R.int(-5, 3), s2 = s1 + 2 * R.int(1, 4), a = R.pick([1, 2, 3]), b = -a * (s1 + s2) / 2, c = a * (s2 - s1) / 2;
        var ins = poly([[a, "x"], [b, ""]]), larger = Math.max(s1, s2), smaller = Math.min(s1, s2), askBig = R.chance(0.5), ans = askBig ? larger : smaller;
        return { type: "num", prompt: "Solve $|" + ins + "| = " + c + "$. Give the " + (askBig ? "larger" : "smaller") + " solution.", pre: "$x =$", answer: ans,
          near: near(ans, [{ v: askBig ? smaller : larger, fb: "That is the other solution. There are two: $" + ins + " = " + c + "$ and $" + ins + " = -" + c + "$." }]),
          hints: ["Two cases: $" + ins + " = " + c + "$ and $" + ins + " = -" + c + "$."], why: "$x = " + smaller + "$ or $x = " + larger + "$." };
      } },
    { id: "pc1-inverse", title: "Evaluate an inverse function", lesson: 25,
      gen: function (R) {
        var a = R.pick([2, 3, 4, 5, -2, -3]), b = R.int(-6, 6), t = R.nz(-5, 5), c = a * t + b;
        return { type: "num", prompt: "$f(x) = " + poly([[a, "x"], [b, ""]]) + "$. Find $f^{-1}(" + c + ")$.", pre: "$f^{-1}(" + c + ") =$", answer: t,
          near: near(t, [{ v: a * c + b, fb: "That is $f(" + c + ")$. For $f^{-1}(" + c + ")$ find the input that **gives** " + c + "." }]),
          hints: ["Solve $" + poly([[a, "x"], [b, ""]]) + " = " + c + "$."], why: "$f(" + t + ") = " + c + "$, so $f^{-1}(" + c + ") = " + t + "$." };
      } },
    { id: "pc1-findinverse", title: "Find an inverse formula", lesson: 26,
      gen: function (R) {
        var a = R.pick([2, 3, 4, 5]), b = R.nz(-6, 6);
        return mc(R, { prompt: "What is the inverse of $f(x) = " + poly([[a, "x"], [b, ""]]) + "$?", right: "$f^{-1}(x) = \\frac{x " + (b < 0 ? "+ " + (-b) : "- " + b) + "}{" + a + "}$",
          wrong: [{ t: "$f^{-1}(x) = \\frac{x " + (b < 0 ? "- " + (-b) : "+ " + b) + "}{" + a + "}$", fb: "Undo the " + (b < 0 ? "$-" + (-b) + "$ by **adding** " + (-b) : "$+" + b + "$ by **subtracting** " + b) + "." }, { t: "$f^{-1}(x) = " + a + "x " + (b < 0 ? "+ " + (-b) : "- " + b) + "$", fb: "Divide by " + a + " as well: $y = \\frac{x - b}{a}$." }, { t: "$f^{-1}(x) = \\frac{1}{" + poly([[a, "x"], [b, ""]]) + "}$", fb: "That is the reciprocal, not the inverse." }], keep: true,
          hints: ["Swap $x$ and $y$, then solve for $y$."], why: "$x = " + a + "y " + signed(b) + "$ gives $y = \\frac{x " + (b < 0 ? "+ " + (-b) : "- " + b) + "}{" + a + "}$." });
      } }
  ];
  L.unit("precalc", 1, {
    title: "Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Functions, function notation and reading tables.", skills: ["pc1-function", "pc1-evaluate", "pc1-readtable"], per: 2 },
      { title: "Quiz 2", after: 9, blurb: "Interval notation and the domain of a formula.", skills: ["pc1-interval", "pc1-domain"], per: 3 },
      { title: "Quiz 3", after: 13, blurb: "Piecewise functions, rates of change and combining functions.", skills: ["pc1-piecewise", "pc1-arc", "pc1-combine"], per: 2 },
      { title: "Quiz 4", after: 17, blurb: "Composition of functions.", skills: ["pc1-compose"], per: 5 },
      { title: "Quiz 5", after: 22, blurb: "Shifts, reflections, and even and odd functions.", skills: ["pc1-shift", "pc1-reflect", "pc1-evenodd"], per: 2 },
      { title: "Quiz 6", after: 26, blurb: "Absolute value and inverse functions.", skills: ["pc1-vertex", "pc1-absvalue", "pc1-inverse", "pc1-findinverse"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("precalc:1", {
    2: { name: "Function", frame: "A function gives each [[input]] exactly [[one]] output. The inputs form the [[domain]] and the outputs the [[range]]. Two inputs may share an output, but one input may never have [[two]] outputs.",
         chips: ["slope", "three"], fb: { "slope": "Slope belongs to lines. Here we are matching inputs to outputs." } },
    3: { name: "Function notation", frame: "$f(x)$ is read “$f$ of $x$”. It is the [[output]] when the input is $x$. To evaluate $f(a)$, replace every [[$x$]] with [[$a$]]. The brackets hold the input; they do not mean [[multiply]].",
         chips: ["slope", "add"], fb: { "add": "The brackets in $f(x)$ are not an operation: they say which input goes in." } },
    4: { name: "Reading a graph", frame: "To find $f(a)$, start at the input on the [[horizontal]] axis, go [[up or down]] to the graph, then across to read the [[output]]. To solve $f(x) = k$, start at $k$ on the [[vertical]] axis. There may be [[more than one]] answer.",
         chips: ["slope", "only one"], fb: { "only one": "Two different inputs can share an output: the graph can be at the same height more than once." } },
    5: { name: "The line tests", frame: "A graph is a function if no [[vertical]] line meets it twice. A function is one-to-one if no [[horizontal]] line meets it [[twice]].",
         chips: ["diagonal", "once"], fb: { "once": "Meeting the graph once is fine. Meeting it twice breaks the test." } },
6: { name: "The toolkit", frame: "$\\frac{1}{x}$ breaks at [[0]]. $\\sqrt{x}$ breaks for [[negative]] inputs. $x^2$ and $|x|$ give the [[same]] output for $1$ and $-1$; $x^3$ gives [[opposite]] outputs.",
         chips: ["positive", "slope"], fb: { "positive": "$\\sqrt{x}$ is happy with positive inputs: it is the negative ones that break it." } },
    7: { name: "Interval notation", frame: "[[Square]] brackets include the end; [[round]] brackets do not. Infinity always gets a [[round]] bracket. Separate pieces are joined with [[$\\cup$]].",
         chips: ["curly", "$\\cap$"], fb: { "$\\cap$": "$\\cap$ means “both at once”. To join two pieces use $\\cup$." } },
    8: { name: "Domain of a formula", frame: "The domain leaves out inputs that make a [[denominator]] equal to [[zero]], or put a [[negative]] under an [[even]] root.",
         chips: ["odd", "positive"], fb: { "odd": "An odd root, like a cube root, accepts negative numbers. Only even roots are fussy." } },
    9: { name: "Domain and range", frame: "The domain is read [[left to right]] on a graph and the range [[bottom to top]]. A [[hollow]] dot gives a round bracket and a filled dot a square one.",
         chips: ["right to left", "dashed"] },
10: { name: "Piecewise function", frame: "A piecewise function uses a different [[rule]] on each [[interval]] of inputs. Use only the piece whose condition the input [[meets]]. A boundary input belongs to the piece whose condition [[includes]] it.",
          chips: ["every", "average"], fb: { "every": "Only one piece applies to any one input." } },
    11: { name: "Average rate of change", frame: "From $a$ to $b$ it is [[$\\frac{f(b) - f(a)}{b - a}$]]. It is the [[slope]] of the line through the two points. A [[negative]] rate means the output falls on average.",
          chips: ["$\\frac{f(b) + f(a)}{b + a}$", "area"], fb: { "$\\frac{f(b) + f(a)}{b + a}$": "A change is a difference: subtract on the top and on the bottom." } },
    12: { name: "Increasing and decreasing", frame: "Left to right, a graph that [[rises]] is increasing and one that [[falls]] is decreasing. A peak is a local [[maximum]] and a valley a local [[minimum]]. Name each stretch with an interval of [[$x$]].",
          chips: ["$y$", "flat"], fb: { "$y$": "The intervals are about where you are along the horizontal axis: $x$." } },
    13: { name: "Combining functions", frame: "To add functions, add their [[outputs]]: $(f + g)(x) =$ [[$f(x) + g(x)$]]. For a quotient, the inputs where $g(x) =$ [[$0$]] are [[not allowed]].",
          chips: ["$f(x) \\cdot g(x)$", "$1$"], fb: { "$f(x) \\cdot g(x)$": "That is a product. A sum adds the outputs." } },
14: { name: "Composition", frame: "$(f \\comp g)(x) = f(g(x))$: work out [[g]] first, then feed its [[output]] into [[f]]. The order matters: $f(g(x))$ and $g(f(x))$ are usually [[different]].",
          chips: ["add", "the same"], fb: { "the same": "Try $f(x) = 2x$ and $g(x) = x + 3$: the two orders give $2x + 6$ and $2x + 3$." } },
    15: { name: "Composites from tables and graphs", frame: "To find $f(g(2))$, look up 2 in the [[inside]] function first. Its [[output]] is the [[input]] you look up in the outside function.",
          chips: ["outside", "slope"], fb: { "outside": "The first lookup is in the inside function, $g$." } },
16: { name: "Domain of a composite", frame: "An input $x$ must pass [[two]] tests: it must work in the [[inside]] function, and its output must work in the [[outside]] function. Keep only the inputs that pass [[both]].",
          chips: ["one", "either"], fb: { "either": "Passing just one test is not enough: a chain breaks at its first weak link." } },
    17: { name: "Taking a function apart", frame: "In $h(x) = f(g(x))$, the inside function $g$ is what is worked out [[first]]. The outside function $f$ is what happens to the [[result]]. The pair is not always [[unique]].",
          chips: ["last", "never"], fb: { "last": "The inside function acts first: the outside one acts on its result." } },
    18: { name: "Shifting a graph", frame: "$f(x) + k$ moves a graph [[up]] by $k$. $f(x - h)$ moves it [[right]] by $h$. Inside the brackets the sign looks [[backwards]]: $x + 3$ moves it left.",
          chips: ["down", "forwards"], fb: { "forwards": "The sign inside looks the wrong way round: minus moves right, plus moves left." } },
19: { name: "Reflecting a graph", frame: "A minus [[outside]], $-f(x)$, reflects the graph in the [[$x$-axis]]: heights change sign. A minus [[inside]], $f(-x)$, reflects it in the [[$y$-axis]]: inputs change sign.",
          chips: ["above", "$x = y$"], fb: { "$x = y$": "That line is the mirror for inverse functions, later in this unit." } },
    20: { name: "Stretching a graph", frame: "$a f(x)$ multiplies every [[height]] by $a$. $f(bx)$ divides every [[width]] by $b$, so a bigger $b$ makes the graph [[narrower]]. The inside works [[backwards]].",
          chips: ["wider", "forwards"], fb: { "wider": "A bigger $b$ squeezes the graph, so it is narrower." } },
    21: { name: "Several transformations", frame: "For $a\\,f(x - h) + k$, do the [[inside]] first, then the [[outside]]. $x - h$ moves the graph [[right]]. Follow one [[point]] through every move to check.",
          chips: ["outside first", "left"], fb: { "outside first": "The inside is worked out first, just as in a composition." } },
    22: { name: "Even and odd", frame: "[[Even]]: $f(-x) = f(x)$, symmetric about the [[$y$-axis]]. [[Odd]]: $f(-x) = -f(x)$, symmetric about the [[origin]].",
          chips: ["$x$-axis", "$y = x$"], fb: { "$x$-axis": "Neither type is a mirror in the $x$-axis: a function cannot be." } },
23: { name: "Absolute value functions", frame: "In $a|x - h| + k$ the vertex is [[$(h, k)$]]. $a > 0$ opens [[up]], $a < 0$ opens [[down]], and $|a|$ is the [[steepness]].",
          chips: ["$(k, h)$", "left"], fb: { "$(k, h)$": "The vertex is $(h, k)$: the shift inside comes first." } },
    24: { name: "Absolute value equations", frame: "$|A| = B$ means $A = B$ or $A =$ [[$-B$]]. $|A| < B$ means [[between]] $-B$ and $B$. $|A| > B$ means [[outside]] them. An absolute value never equals a [[negative]] number.",
          chips: ["inside", "positive"], fb: { "positive": "A positive target has two solutions. It is a negative target that has none." } },
    25: { name: "Inverse functions", frame: "An inverse [[swaps]] inputs and outputs: $(a, b)$ becomes [[$(b, a)$]]. Its graph is the reflection in the line [[$y = x$]]. Only a [[one-to-one]] function has an inverse.",
          chips: ["$\\frac{1}{f(x)}$", "$y = 0$"], fb: { "$\\frac{1}{f(x)}$": "That is the reciprocal. $f^{-1}$ undoes $f$." } },
    26: { name: "Finding an inverse", frame: "Write $y$, then [[swap]] $x$ and $y$, then [[solve for $y$]]. The domain of $f^{-1}$ is the [[range]] of $f$.",
          chips: ["multiply", "domain"], fb: { "domain": "The roles swap: the domain of $f^{-1}$ is the range of $f$." } }
  });
})();
