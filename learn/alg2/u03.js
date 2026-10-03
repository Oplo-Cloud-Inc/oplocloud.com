/* ==========================================================================
   Algebra II — Unit 3: Graphs and Functions. See lab/core.js for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 3, section for section:
   the readiness check, then 3.1 to 3.6. Each lesson teaches the book's own
   steps: the method, a worked example to watch (the graph builds up beside
   it, a line at a time), one done together, then on your own, a harder case,
   find the error, use it, and the concept built at the end.

   Lines come first: graphing them (3.1), slope (3.2) and their equations
   (3.3). Then half-planes (3.4), and last what a function is and how to read
   its graph (3.5–3.6).

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Seven lessons, six skills, two quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, frac = L.frac, num = L.num, mc = L.mc, signed = L.signed;

  // A worked calculation, one line per step.
  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  // Two equations set one above the other: a system.
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

  // Do two dragged points both sit on y = mx + c (and differ)?
  function onLine(st, a, b, m, c) {
    var p = st.pt(a), q = st.pt(b);
    return (p.x !== q.x || p.y !== q.y) && Math.abs(p.y - (m * p.x + c)) < 1e-9 && Math.abs(q.y - (m * q.x + c)) < 1e-9;
  }

  // Two equations on one card ("… and …"): cards and options close up the
  // spaces beside maths, so the gap is written as hard spaces.
  function two(a, b) { return "$" + a + "$\u00a0\u00a0and\u00a0\u00a0$" + b + "$"; }

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

  var LESSONS = [];
  /* Shared by every Algebra II unit (compiled in after the Algebra I helpers). */
  var GIVEN = "That is the problem as it was given.", LATER = "This line follows correctly from the one above it. Look earlier.";
  var fig = L.fig;
  // A coordinate grid beside a worked example: grid("what it shows", items, { x, y, u }).
  // The scale fits the window: about 240 px across the longer side.
  function grid(alt, items, o) {
    o = Object.assign({ x: [-6, 6], y: [-6, 6], alt: alt, items: items }, o || {});
    if (!o.u) o.u = Math.max(14, Math.min(26, Math.floor(240 / Math.max(o.x[1] - o.x[0], o.y[1] - o.y[0]))));
    return fig(o);
  }
  // A curve for a figure, as short segments: curve(f, from, to, colour, [ylo, yhi]).
  // Pieces that leave the window are dropped, so the curve stops at the edge.
  function curve(f, a, b, c, yr) {
    var out = [], n = 60, px = a, py = f(a);
    for (var i = 1; i <= n; i++) {
      var x = a + (b - a) * i / n, y = f(x);
      if (isFinite(py) && isFinite(y) && (!yr || (py >= yr[0] && py <= yr[1] && y >= yr[0] && y <= yr[1]))) out.push({ seg: [[px, py], [x, y]], c: c || "blue" });
      px = x; py = y;
    }
    return out;
  }
  // The same for a curve given as x = g(y): a parabola on its side.
  function curveY(g, a, b, c) {
    return curve(g, a, b, c).map(function (it) { return { seg: [[it.seg[0][1], it.seg[0][0]], [it.seg[1][1], it.seg[1][0]]], c: it.c }; });
  }
  // A matrix on the board beside a worked example: mat([[1, 2, 7], [3, -1, 7]]) is the augmented
  // matrix of x + 2y = 7, 3x − y = 7. { det: true } draws a determinant (straight bars, no
  // augmenting bar); { hot: i } colours the row that has just changed.
  function mat(rows, o) {
    o = o || {};
    var n = rows.length, k = rows[0].length, R = k + 0.2, items = [];
    rows.forEach(function (r, i) {
      r.forEach(function (v, j) { items.push({ text: String(v).replace(/-/g, "−"), at: [j + 0.6, n - i - 0.64], eq: true, c: o.hot === i ? "blue" : "ink" }); });
    });
    // { plain: true }: no brackets at all, with a rule above the last row (a synthetic division).
    if (o.plain) items.push({ seg: [[0.1, 1], [R - 0.1, 1]], c: "soft" });
    else [[0.06, 1], [R - 0.06, -1]].forEach(function (b) {
      items.push({ seg: [[b[0], 0.08], [b[0], n - 0.08]] });
      if (!o.det) items.push({ seg: [[b[0], 0.08], [b[0] + 0.16 * b[1], 0.08]] }, { seg: [[b[0], n - 0.08], [b[0] + 0.16 * b[1], n - 0.08]] });
    });
    if (!o.det && !o.plain) items.push({ seg: [[k - 0.9, 0.2], [k - 0.9, n - 0.2]], c: "soft" });
    return fig({ grid: false, x: [0, R], y: [0, n], u: 42, pad: 8, alt: o.alt || (o.det ? "The determinant with rows " : "The matrix with rows ") + rows.map(function (r) { return r.join(", "); }).join("; ") + ".", items: items });
  }
  // The rows of an augmented matrix set in a line of maths: [1 2 | 7]  [3 −1 | 7].
  function rowsTex(rows) {
    return rows.map(function (r) { return "[\\," + r.slice(0, -1).join(" \\quad ") + " \\;|\\; " + r[r.length - 1] + "\\,]"; }).join(" \\qquad ");
  }
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Chapter 3 Be Prepared · Evaluate an expression, solve for y, and find a point on the grid.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Evaluate", prompt: "Evaluate $3x - 2$ when $x = -1$.", answer: -5, skill: "Evaluate an expression",
        near: [{ v: 1, fb: "$3(-1) = -3$, and $-3 - 2 = -5$." }, { v: -1, fb: "Subtract the 2 after multiplying." }],
        hints: ["$3(-1) - 2$."], why: "$-3 - 2 = -5$." },
      { type: "num", prompt: "Simplify $\\frac{1 - 7}{4 - 2}$.", answer: -3, skill: "Evaluate an expression",
        near: [{ v: 3, fb: "The top is $1 - 7 = -6$: negative." }], hints: ["Top first, then bottom, then divide."], why: "$\\frac{-6}{2} = -3$." },
      { type: "choice", kicker: "Check 2 · Solve for y", prompt: "Solve $4x + 2y = 10$ for $y$.",
        options: [{ t: "$y = 5 - 2x$" }, { t: "$y = 10 - 4x$", fb: "That is $2y$. Divide every term by 2." }, { t: "$y = 5 + 2x$", fb: "Subtract $4x$ from both sides: $2y = 10 - 4x$." }],
        answer: 0, skill: "Solve a formula", hints: ["Subtract $4x$, then divide by 2."], why: "$2y = 10 - 4x$, so $y = 5 - 2x$." },
      { type: "choice", prompt: "Is $(2, 3)$ a solution of $y = 2x - 1$?",
        options: [{ t: "Yes: $2(2) - 1 = 3$" }, { t: "No", fb: "Put $x = 2$ into the right side: $4 - 1 = 3$, which matches $y$." }],
        answer: 0, skill: "Check a solution", hints: ["The first number is $x$, the second is $y$."], why: "$3 = 2(2) - 1$ is true." },
      { type: "plane", kicker: "Check 3 · The grid", prompt: "Click the point $(2, -4)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [2, -4] }, skill: "Plot a point",
        clickFb: function (c) { return c && c[0] === -4 && c[1] === 2 ? "That is $(-4, 2)$. The first number is $x$: across." : "The first number is $x$ (across), the second is $y$ (up or down)."; },
        hints: ["Go 2 to the right, then 4 down."], why: "2 across to the right, 4 down." },
      { type: "numberline", prompt: "Graph $x > -1$.",
        min: -6, max: 6, mode: "ray", variable: "x", ray: { at: 2, dir: "left", closed: true },
        answer: { at: -1, dir: "right", closed: false }, skill: "Graph an inequality",
        hints: ["$-1$ itself is not a solution. Which way are the larger numbers?"], why: "An open circle at $-1$, shaded to the right." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 3.1**. If **check 1** slipped, see Unit 1's lesson 1.2. If **check 2** slipped, lesson 2.3 covers solving for a variable. If **check 3** slipped, lesson 3.1 starts with plotting points.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ===================== 3.1 · Graph linear equations in two variables */
  var HOW_3_1 = [["Table", "Find three solutions: choose a value of $x$ and work out $y$."],
                 ["Plot", "Plot the three points. They should line up."],
                 ["Draw", "Draw the line through them, out to the edges of the grid."]];
  var HOW_3_1B = [["Intercepts", "Let $y = 0$ to find the $x$-intercept. Let $x = 0$ to find the $y$-intercept."],
                  ["Third point", "Find one more solution, as a check."],
                  ["Plot", "Plot the three points and check that they line up."],
                  ["Draw", "Draw the line."]];
  var W31 = { x: [-4, 5], y: [-4, 5] }, P31 = [{ pt: [0, -1], name: "(0, −1)", at: "se" }, { pt: [1, 1], name: "(1, 1)", at: "se" }, { pt: [2, 3], name: "(2, 3)", at: "se" }];
  var W31B = { x: [-2, 8], y: [-5, 4] }, P31B = [{ pt: [3, 0], name: "(3, 0)", at: "se" }, { pt: [0, -2], name: "(0, −2)", at: "se" }, { pt: [6, 2], name: "(6, 2)", at: "se" }];
  LESSONS.push({
    title: "Graph linear equations",
    blurb: "Book 3.1 · Plotting points, graphing a line from a table, vertical and horizontal lines, and intercepts.",
    mins: 12, v: 1,
    steps: [
      { type: "plane", kicker: "Warm up", prompt: "Click the point $(-3, 2)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [-3, 2] }, skill: "Plot a point",
        clickFb: function (c) { return c && c[0] === 2 && c[1] === -3 ? "That is $(2, -3)$. The first number is $x$: across." : "The first number is $x$ (across), the second is $y$ (up or down)."; },
        hints: ["Go 3 to the left, then 2 up."], why: "$x = -3$ is 3 to the left. $y = 2$ is 2 up." },
      { type: "learn", kicker: "The idea",
        prompt: "Every solution of a linear equation in two variables is an ordered pair $(x, y)$, and every ordered pair is a point. Plot a few solutions and they fall on one straight line: the picture of **all** the solutions.",
        scene: { type: "method", how: HOW_3_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $y = 2x - 1$ graphed from three points.",
        scene: { type: "walk", how: HOW_3_1, rows: [
          { step: 1, m: "y = 2x - 1", say: "Choose three easy values of $x$ and work out $y$ for each.", fig: grid("An empty coordinate grid.", [], W31) },
          { step: 1, m: "2(0) - 1 = -1 \\quad 2(1) - 1 = 1 \\quad 2(2) - 1 = 3", say: "For $x = 0$, 1 and 2.",
            ask: { prompt: "When $x = 2$, what is $y = 2x - 1$?", answer: 0,
                   options: [{ t: "3" }, { t: "5", fb: "$2(2) - 1$: subtract the 1." }, { t: "1", fb: "That is the value at $x = 1$." }] } },
          { step: 2, m: "(0, -1) \\quad (1, 1) \\quad (2, 3)", say: "Plot the three solutions. They line up.", fig: grid("Three points in a straight line: (0, −1), (1, 1) and (2, 3).", P31, W31) },
          { step: 3, m: "y = 2x - 1", say: "Draw the line through them. Every point on it is a solution.", fig: grid("A rising line through (0, −1), (1, 1) and (2, 3).", [{ line: [[0, -1], [2, 3]], c: "blue" }].concat(P31), W31) }] },
        gate: true, then: "Two points fix a line. The third one is a check: if it is off the line, a calculation went wrong." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the points. Graph $y = -x + 3$.",
        how: HOW_3_1, skill: "Graph a line",
        steps: [
          { step: 1, ask: "When $x = 0$, what is $y = -x + 3$?", type: "num", pre: "$y =$", answer: 3, hint: "$-0 + 3$.",
            m: "(0, 3)", say: "The first solution." },
          { step: 1, ask: "When $x = 2$?", type: "num", pre: "$y =$", answer: 1, near: [{ v: 5, fb: "$-x$ is $-2$ here: $-2 + 3$." }], hint: "$-2 + 3$.",
            m: "(2, 1)", say: "The second solution." },
          { step: 1, ask: "When $x = 4$?", type: "num", pre: "$y =$", answer: -1, near: [{ v: 7, fb: "$-4 + 3$." }, { v: 1, fb: "$-4 + 3$ is negative." }], hint: "$-4 + 3$.",
            m: "(4, -1)", say: "The third solution." },
          { step: 2, ask: "Plot them. Do the three points line up?", type: "choice", answer: 0,
            options: [{ t: "Yes: each 2 to the right goes 2 down" }, { t: "No", fb: "From $(0, 3)$ to $(2, 1)$ to $(4, -1)$: the same move each time." }],
            m: "(0, 3) \\quad (2, 1) \\quad (4, -1)", say: "The same step each time means one straight line." },
          { step: 3, ask: "Which way does the line through them run?", type: "choice", answer: 0,
            options: [{ t: "Downhill from left to right" }, { t: "Uphill from left to right", fb: "$y$ gets smaller as $x$ grows." }],
            m: "y = -x + 3", say: "The line falls, crossing the $y$-axis at 3." }],
        why: "Table, plot, draw. Now draw one on the grid yourself." },
      { type: "plane", kicker: "On your own", prompt: "Graph $y = \\frac{1}{2}x + 1$. Drag $A$ and $B$ onto two of its points.",
        x: [-6, 6], y: [-5, 5],
        points: [{ id: "A", x: -3, y: 2, drag: true, label: "A" }, { id: "B", x: 3, y: -1, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) { return onLine(st, "A", "B", 0.5, 1) ? { ok: true } : { ok: false, say: "Choose even values of $x$ so that half of $x$ is a whole number: $x = 0$ gives $y = 1$, and $x = 2$ gives $y = 2$." }; },
        answer: { points: { A: [0, 1], B: [2, 2] } }, skill: "Graph a line",
        hints: ["Try $x = 0$ and $x = 2$."], why: "$(0, 1)$ and $(2, 2)$ are on the line, and so is $(-2, 0)$." },
      { type: "choice", prompt: "Some lines have only one variable. Which equation is a **vertical** line?",
        options: [{ t: "$x = 3$" }, { t: "$y = 3$", fb: "$y = 3$ is horizontal: every point on it has height 3." }, { t: "$y = 3x$", fb: "That is a slanted line through the origin." }],
        answer: 0, skill: "Vertical and horizontal lines", hints: ["On which line does every point have the same $x$?"],
        why: "$x = 3$: every point is 3 to the right, whatever its height. The line is vertical." },
      { type: "learn", kicker: "A harder case",
        prompt: "For an equation like $2x - 3y = 6$, the quickest points are the **intercepts**: where the line crosses each axis.",
        scene: { type: "walk", how: HOW_3_1B, rows: [
          { step: 1, m: "y = 0: \\quad 2x = 6 \\quad x = 3", say: "On the $x$-axis, $y$ is 0. The $x$-intercept is $(3, 0)$.", fig: grid("An empty coordinate grid.", [], W31B) },
          { step: 1, m: "x = 0: \\quad -3y = 6 \\quad y = -2", say: "On the $y$-axis, $x$ is 0. The $y$-intercept is $(0, -2)$." },
          { step: 2, m: "(6, 2)", say: "A third point as a check: $x = 6$ gives $12 - 3y = 6$, so $y = 2$." },
          { step: 3, m: "(3, 0) \\quad (0, -2) \\quad (6, 2)", say: "Plot all three. They line up.", fig: grid("Three points in a straight line: (0, −2), (3, 0) and (6, 2).", P31B, W31B) },
          { step: 4, m: "2x - 3y = 6", say: "Draw the line.", fig: grid("A rising line through (0, −2), (3, 0) and (6, 2).", [{ line: [[0, -2], [3, 0]], c: "blue" }].concat(P31B), W31B) }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "What is the $x$-intercept of $3x + 4y = 12$? Give its $x$-coordinate.",
        pre: "$x =$", answer: 4, skill: "Find intercepts",
        near: [{ v: 3, fb: "That is the $y$-intercept (let $x = 0$). For the $x$-intercept, let $y = 0$." }],
        hints: ["Let $y = 0$."], why: "$3x = 12$, so $x = 4$: the point $(4, 0)$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Lee finds the intercepts of $5x - 2y = 10$. Tap the line where the work **first** goes wrong.",
        lines: ["y = 0: \\quad 5x = 10 \\quad x = 2", "x = 0: \\quad -2y = 10 \\quad y = 5", "(2, 0) \\quad (0, 5)"], answer: 1, fix: "x = 0: \\quad -2y = 10 \\quad y = -5",
        fb: { 0: "This line is right: with $y = 0$, $5x = 10$.", 2: LATER }, skill: "Find intercepts",
        hints: ["What is $10 \\div (-2)$?"],
        why: "$-2y = 10$ gives $y = -5$. The intercepts are $(2, 0)$ and $(0, -5)$." },
      { type: "choice", kicker: "Use it", prompt: "A phone's battery level is $y = 100 - 20x$ percent after $x$ hours of video. What is the $x$-intercept, and what does it mean?",
        options: [{ t: "$(5, 0)$: the battery is empty after 5 hours" }, { t: "$(0, 100)$: the battery starts full", fb: "That is the $y$-intercept: the level at 0 hours." }, { t: "$(20, 0)$: it loses 20% an hour", fb: "20 is the rate. For the $x$-intercept, solve $100 - 20x = 0$." }],
        answer: 0, skill: "Find intercepts", hints: ["Let $y = 0$."], why: "$100 - 20x = 0$ gives $x = 5$: no charge left after 5 hours." }
    ]
  });

  /* ================================================= 3.2 · Slope of a line */
  var HOW_3_2 = [["Two points", "Pick two points on the line with whole-number coordinates."],
                 ["Rise", "Find the rise: the change in $y$ from the first point to the second."],
                 ["Run", "Find the run: the change in $x$, in the same order."],
                 ["Ratio", "Slope is rise over run: $m = \\frac{y_2 - y_1}{x_2 - x_1}$."]];
  var HOW_3_2B = [["Solve for y", "Write each equation in slope-intercept form, $y = mx + b$."],
                  ["Slopes", "Read off the two slopes."],
                  ["Compare", "Equal slopes, different intercepts: parallel. Slopes that multiply to $-1$: perpendicular."]];
  var W32 = { x: [-1, 6], y: [-1, 9] }, P32 = [{ line: [[1, 2], [4, 8]], c: "blue" }, { pt: [1, 2], name: "(1, 2)", at: "se" }, { pt: [4, 8], name: "(4, 8)", at: "nw" }];
  LESSONS.push({
    title: "Slope of a line",
    blurb: "Book 3.2 · Rise over run, the slope formula, slope-intercept form, and parallel and perpendicular lines.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Simplify $\\frac{7 - 1}{2 - 5}$.", answer: -2, skill: "Slope formula",
        near: [{ v: 2, fb: "The bottom is $2 - 5 = -3$: negative." }], hints: ["Top: 6. Bottom: $-3$."], why: "$\\frac{6}{-3} = -2$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Slope** measures steepness: how far a line rises for each step it runs. Uphill lines have positive slope and downhill lines negative. A horizontal line has slope 0, and a vertical line has no slope: it is undefined.",
        scene: { type: "method", how: HOW_3_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the slope of the line through $(1, 2)$ and $(4, 8)$.",
        scene: { type: "walk", how: HOW_3_2, rows: [
          { step: 1, m: "(1, 2) \\quad (4, 8)", say: "Two points on the line.", fig: grid("A rising line through (1, 2) and (4, 8).", P32, W32) },
          { step: 2, m: "8 - 2 = 6", say: "Rise: from height 2 up to height 8.", fig: grid("The same line with its rise and run marked: 3 right, 6 up.", P32.concat([{ steps: [[1, 2], [4, 8]], c: "orange" }]), W32) },
          { step: 3, m: "4 - 1 = 3", say: "Run: from 1 across to 4.",
            ask: { prompt: "What is the run from $x = 1$ to $x = 4$?", answer: 0,
                   options: [{ t: "3" }, { t: "5", fb: "The run is a difference: $4 - 1$." }, { t: "6", fb: "6 is the rise. The run is the change in $x$." }] } },
          { step: 4, m: "m = \\frac{6}{3} = 2", say: "Rise over run. The line climbs 2 for every 1 it moves right." }] },
        gate: true, then: "In $y = mx + b$ the slope is the number $m$, and $b$ is the $y$-intercept." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step: the slope of the line through $(-2, 5)$ and $(4, -1)$.",
        how: HOW_3_2, skill: "Find a slope",
        steps: [
          { step: 1, ask: "Take $(-2, 5)$ as the first point and $(4, -1)$ as the second. Which is the rise, $y_2 - y_1$?", type: "choice", answer: 0,
            options: [{ t: "$-1 - 5$" }, { t: "$5 - (-1)$", fb: "Second minus first: start from the second point's $y$." }, { t: "$4 - (-2)$", fb: "Those are the $x$-coordinates: the run." }],
            m: "(-2, 5) \\quad (4, -1)", say: "First point, second point." },
          { step: 2, ask: "What is $-1 - 5$?", type: "num", answer: -6, near: [{ v: 6, fb: "The line goes down, so the rise is negative." }, { v: 4, fb: "$-1 - 5$ moves 5 further down from $-1$." }], hint: "Start at $-1$ and go down 5.",
            m: "-1 - 5 = -6", say: "The line drops 6." },
          { step: 3, ask: "The run is $4 - (-2)$. What is it?", type: "num", answer: 6, near: [{ v: 2, fb: "Subtracting $-2$ adds 2." }], hint: "$4 + 2$.",
            m: "4 - (-2) = 6", say: "It moves 6 to the right." },
          { step: 4, ask: "Rise over run: what is $\\frac{-6}{6}$?", type: "num", pre: "$m =$", answer: -1, near: [{ v: 1, fb: "A falling line has a negative slope." }], hint: "$-6 \\div 6$.",
            m: "m = \\frac{-6}{6} = -1", say: "Down 1 for every 1 to the right." }],
        why: "Two points, rise, run, ratio. Now use a slope to draw a line." },
      { type: "plane", kicker: "On your own", prompt: "Graph $y = -2x + 3$ from its intercept and slope. Drag $A$ to the $y$-intercept and $B$ to another point of the line.",
        x: [-5, 5], y: [-5, 5],
        points: [{ id: "A", x: -3, y: -2, drag: true, label: "A" }, { id: "B", x: 2, y: -3, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) { return onLine(st, "A", "B", -2, 3) ? { ok: true } : { ok: false, say: "Start at the intercept $(0, 3)$. A slope of $-2$ means down 2 for each 1 to the right." }; },
        answer: { points: { A: [0, 3], B: [1, 1] } }, skill: "Graph with slope and intercept",
        hints: ["The intercept is $(0, 3)$. From there go 1 right and 2 down."], why: "$(0, 3)$, then $(1, 1)$, then $(2, -1)$: down 2 for each 1 across." },
      { type: "sort", prompt: "Sort each line by its slope.",
        bins: ["Positive", "Negative", "Zero", "Undefined"],
        cards: [{ t: "$y = 3x - 1$", bin: 0, fb: "$m = 3$." },
                { t: "through\u00a0$(0, 3)$\u00a0and\u00a0$(3, 0)$", bin: 1, fb: "$\\frac{0 - 3}{3 - 0} = -1$." },
                { t: "$y = 4$", bin: 2, fb: "A horizontal line: no rise at all." },
                { t: "through\u00a0$(2, 5)$\u00a0and\u00a0$(2, -1)$", bin: 3, fb: "The run is $2 - 2 = 0$, and dividing by 0 is undefined. The line is vertical." }],
        skill: "Find a slope", hints: ["Uphill, downhill, flat or straight up?"],
        why: "Uphill is positive, downhill negative and horizontal 0. A vertical line has no slope at all." },
      { type: "learn", kicker: "A harder case",
        prompt: "Slopes show how two lines are related. Compare $3x + 2y = 8$ and $2x - 3y = 6$.",
        scene: { type: "walk", how: HOW_3_2B, rows: [
          { step: 1, m: "3x + 2y = 8 \\quad 2x - 3y = 6", say: "Neither equation shows its slope yet." },
          { step: 1, m: "y = -\\frac{3}{2}x + 4 \\quad y = \\frac{2}{3}x - 2", say: "Solve each one for $y$." },
          { step: 2, m: "m_1 = -\\frac{3}{2} \\quad m_2 = \\frac{2}{3}", say: "The slopes are the coefficients of $x$." },
          { step: 3, m: "-\\frac{3}{2} \\cdot \\frac{2}{3} = -1", say: "The slopes are negative reciprocals, so the lines are **perpendicular**." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A taxi ride of $x$ miles costs $y = 2.5x + 4$ dollars. What does the slope tell you?",
        options: [{ t: "Each mile costs \\$2.50." }, { t: "The ride starts at \\$2.50.", fb: "The starting charge is the intercept, \\$4." }, { t: "The ride is 2.5 miles long.", fb: "2.5 multiplies the miles: it is a rate, dollars per mile." }],
        answer: 0, skill: "Interpret slope", hints: ["What is added to the cost for each extra mile?"], why: "The slope is the rate of change: \\$2.50 for each mile." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Ravi finds the slope through $(3, 7)$ and $(5, 1)$. Tap the line where the work **first** goes wrong.",
        lines: ["m = \\frac{y_2 - y_1}{x_2 - x_1}", "m = \\frac{1 - 7}{3 - 5}", "m = \\frac{-6}{-2}", "m = 3"], answer: 1, fix: "m = \\frac{1 - 7}{5 - 3}",
        fb: { 0: "The formula is right.", 2: LATER, 3: LATER }, skill: "Find a slope",
        hints: ["The top starts from the second point. Does the bottom?"],
        why: "Both differences must run in the same order: $\\frac{1 - 7}{5 - 3} = \\frac{-6}{2} = -3$." },
      { type: "num", kicker: "Use it", prompt: "A wheelchair ramp rises **2 feet** over a run of **24 feet**. What is its slope? (Type a fraction like 1/8.)",
        answer: 1 / 12, tol: 1e-9, shown: "1/12", skill: "Interpret slope",
        near: [{ v: 12, fb: "Slope is rise over run, not run over rise." }],
        hints: ["$\\frac{\\text{rise}}{\\text{run}} = \\frac{2}{24}$."], why: "$\\frac{2}{24} = \\frac{1}{12}$." }
    ]
  });

  /* ====================================== 3.3 · Find the equation of a line */
  var HOW_3_3 = [["Slope", "Identify the slope, or find it from two points."],
                 ["Point", "Identify a point on the line."],
                 ["Substitute", "Put them into the point-slope form: $y - y_1 = m(x - x_1)$."],
                 ["Rewrite", "Solve for $y$ to reach slope-intercept form."]];
  LESSONS.push({
    title: "Find the equation of a line",
    blurb: "Book 3.3 · From a slope and a point, from two points, and for parallel and perpendicular lines.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "For $y = -3x + 5$, what are the slope and the $y$-intercept?",
        options: [{ t: "Slope $-3$, intercept $5$" }, { t: "Slope $5$, intercept $-3$", fb: "In $y = mx + b$, the slope multiplies $x$." }, { t: "Slope $3$, intercept $5$", fb: "The sign belongs to the slope: $-3$." }],
        answer: 0, skill: "Slope-intercept form", hints: ["Compare it with $y = mx + b$."], why: "$m = -3$ and $b = 5$." },
      { type: "learn", kicker: "The idea",
        prompt: "A slope and one point pin a line down. The **point-slope form**, $y - y_1 = m(x - x_1)$, turns them straight into an equation. Solve it for $y$ and you have slope-intercept form.",
        scene: { type: "method", how: HOW_3_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the equation of the line with slope 2 through $(3, -1)$.",
        scene: { type: "walk", how: HOW_3_3, rows: [
          { step: 1, m: "m = 2", say: "The slope is given." },
          { step: 2, m: "(x_1, y_1) = (3, -1)", say: "The point is given too." },
          { step: 3, m: "y - (-1) = 2(x - 3)", say: "Substitute into $y - y_1 = m(x - x_1)$.",
            ask: { prompt: "With $y_1 = -1$, what is $y - y_1$?", answer: 0,
                   options: [{ t: "$y + 1$" }, { t: "$y - 1$", fb: "Subtracting $-1$ adds 1." }] } },
          { step: 4, m: "y + 1 = 2x - 6", say: "Distribute the 2." },
          { step: 4, m: "y = 2x - 7", say: "Subtract 1 from both sides. Slope 2, intercept $-7$." }] },
        gate: true, then: "Check: at $x = 3$, $2(3) - 7 = -1$. The line does pass through $(3, -1)$." },
      { type: "guided", kicker: "Together",
        prompt: "Now from two points: find the equation of the line through $(1, 3)$ and $(3, 7)$.",
        how: HOW_3_3, skill: "Equation of a line",
        steps: [
          { step: 1, ask: "No slope is given, so find it. What is $\\frac{7 - 3}{3 - 1}$?", type: "num", pre: "$m =$", answer: 2, near: [{ v: 0.5, tol: 1e-9, fb: "Rise over run: the $y$ difference goes on top." }], hint: "$\\frac{4}{2}$.",
            m: "m = \\frac{7 - 3}{3 - 1} = 2", say: "Rise 4, run 2." },
          { step: 2, ask: "Which point can you use?", type: "choice", answer: 0,
            options: [{ t: "Either one: both are on the line" }, { t: "Only $(1, 3)$", fb: "$(3, 7)$ is on the line too, and gives the same equation." }],
            m: "(x_1, y_1) = (1, 3)", say: "Take $(1, 3)$: smaller numbers." },
          { step: 3, ask: "Substitute $m = 2$ and $(1, 3)$ into the point-slope form.", type: "choice", answer: 0,
            options: [{ t: "$y - 3 = 2(x - 1)$" }, { t: "$y - 1 = 2(x - 3)$", fb: "$y_1 = 3$ goes with $y$, and $x_1 = 1$ goes with $x$." }, { t: "$y + 3 = 2(x + 1)$", fb: "The form subtracts the coordinates." }],
            m: "y - 3 = 2(x - 1)", say: "Point-slope form." },
          { step: 4, ask: "Solve for $y$.", type: "choice", answer: 0,
            options: [{ t: "$y = 2x + 1$" }, { t: "$y = 2x - 1$", fb: "$-2 + 3 = +1$." }, { t: "$y = 2x + 5$", fb: "Distribute first: $2(x - 1) = 2x - 2$. Then add 3." }],
            m: "y = 2x + 1", say: "$y - 3 = 2x - 2$, then add 3." }],
        why: "Slope, point, substitute, rewrite. Now one on your own." },
      { type: "equation", kicker: "On your own", prompt: "Write the equation of the line with slope $-3$ through $(2, 1)$, in slope-intercept form.",
        answer: "y=-3x+7", shown: "y = -3x + 7", form: "slope-intercept", skill: "Equation of a line",
        near: [{ v: "y=-3x+1", fb: "1 is the $y$-value at $x = 2$, not at $x = 0$. Use $y - 1 = -3(x - 2)$." }, { v: "y=-3x-5", fb: "$-3 \\cdot (-2) = +6$, and $6 + 1 = 7$." }],
        hints: ["$y - 1 = -3(x - 2)$."], why: "$y - 1 = -3x + 6$, so $y = -3x + 7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes the slope comes from another line. Find the line **perpendicular** to $y = 2x - 3$ through $(4, 1)$.",
        scene: { type: "walk", how: HOW_3_3, rows: [
          { step: 1, m: "y = 2x - 3", say: "The given line has slope 2." },
          { step: 1, m: "m = -\\frac{1}{2}", say: "A perpendicular line has the negative reciprocal slope. A parallel line would keep the slope 2." },
          { step: 2, m: "(4, 1)", say: "The point the new line must pass through." },
          { step: 3, m: "y - 1 = -\\frac{1}{2}(x - 4)", say: "Point-slope form." },
          { step: 4, m: "y = -\\frac{1}{2}x + 3", say: "Distribute: $-\\frac{1}{2} \\cdot (-4) = +2$. Then add 1." }] },
        gate: true },
      { type: "equation", kicker: "Try it", prompt: "Write the equation of the line through $(0, 4)$ and $(2, 0)$.",
        answer: "y=-2x+4", shown: "y = -2x + 4", skill: "Equation of a line",
        near: [{ v: "y=2x+4", fb: "The line falls from $(0, 4)$ to $(2, 0)$, so its slope is negative." }, { v: "y=-0.5x+4", fb: "Rise over run: $\\frac{0 - 4}{2 - 0}$." }],
        hints: ["The slope is $\\frac{0 - 4}{2 - 0}$, and $(0, 4)$ is the $y$-intercept."], why: "$m = -2$ and $b = 4$: $y = -2x + 4$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tia writes the line with slope 3 through $(2, -5)$. Tap the line where the work **first** goes wrong.",
        lines: ["y - y_1 = m(x - x_1)", "y - 5 = 3(x - 2)", "y - 5 = 3x - 6", "y = 3x - 1"], answer: 1, fix: "y + 5 = 3(x - 2)",
        fb: { 0: "The form is right.", 2: LATER, 3: LATER }, skill: "Equation of a line",
        hints: ["$y_1$ is $-5$. What is $y - (-5)$?"],
        why: "$y - (-5) = y + 5$. Then $y + 5 = 3x - 6$, so $y = 3x - 11$." },
      { type: "equation", kicker: "Use it", prompt: "A plumber charges **\\$140** for a 1-hour job and **\\$260** for a 3-hour job. The cost is linear. Write the cost $y$ of an $x$-hour job.",
        answer: "y=60x+80", shown: "y = 60x + 80", skill: "Equation of a line",
        near: [{ v: "y=60x", fb: "The rate is right. But 1 hour costs \\$140, not \\$60: there is a fixed charge as well." }, { v: "y=120x+20", fb: "The slope is $\\frac{260 - 140}{3 - 1}$: divide by the 2 hours." }],
        hints: ["Two points: $(1, 140)$ and $(3, 260)$."], why: "$m = \\frac{120}{2} = 60$, and $y - 140 = 60(x - 1)$ gives $y = 60x + 80$." }
    ]
  });
  /* ==================== 3.4 · Graph linear inequalities in two variables */
  var HOW_3_4 = [["Boundary", "Graph the boundary line: solid for $\\le$ or $\\ge$, dashed for $<$ or $>$."],
                 ["Test", "Test a point that is not on the line. $(0, 0)$ is the easiest."],
                 ["Shade", "If the test point is a solution, shade its side. If not, shade the other side."]];
  var W34 = { x: [-5, 5], y: [-5, 5] }, B34 = { line: [[0, -1], [2, 3]], c: "blue" }, O34 = { pt: [0, 0], name: "(0, 0)", at: "nw", c: "orange" };
  var B34B = { line: [[0, 0], [2, 1]], c: "blue", dash: true }, T34B = { pt: [0, 1], name: "(0, 1)", at: "nw", c: "orange" };
  LESSONS.push({
    title: "Graph linear inequalities in two variables",
    blurb: "Book 3.4 · A boundary line, a test point, and a shaded half-plane.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $(1, 2)$ a solution of $y > 2x - 3$?",
        options: [{ t: "Yes: $2 > -1$" }, { t: "No: $2 > 5$ is false", fb: "$2(1) - 3 = -1$, not 5." }, { t: "No: $1 > 1$ is false", fb: "Put $x = 1$ and $y = 2$: the left side is $y$." }],
        answer: 0, skill: "Check a solution", hints: ["Substitute $x = 1$ and $y = 2$."], why: "$2 > 2(1) - 3$ is $2 > -1$: true." },
      { type: "learn", kicker: "The idea",
        prompt: "A linear inequality in two variables has a whole **half-plane** of solutions. Its boundary line splits the plane in two, and one test point tells you which side to shade.",
        scene: { type: "method", how: HOW_3_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $y \\le 2x - 1$ graphed.",
        scene: { type: "walk", how: HOW_3_4, rows: [
          { step: 1, m: "y = 2x - 1", say: "The boundary. The sign is $\\le$, so the line is solid: its points are solutions too.", fig: grid("The solid line y = 2x − 1.", [B34], W34) },
          { step: 2, m: "(0, 0): \\quad 0 \\le 2(0) - 1", say: "Test the origin: it is not on the line.", fig: grid("The line y = 2x − 1 with the test point (0, 0) above it.", [B34, O34], W34) },
          { step: 2, m: "0 \\le -1 \\quad\\text{is false}", say: "So $(0, 0)$ is not a solution.",
            ask: { prompt: "Is $0 \\le -1$ true?", answer: 0,
                   options: [{ t: "No" }, { t: "Yes", fb: "0 is greater than $-1$." }] } },
          { step: 3, m: "y \\le 2x - 1", say: "Shade the side that does **not** contain $(0, 0)$: below the line.", fig: grid("The half-plane below the line y = 2x − 1 is shaded. The test point (0, 0) is on the unshaded side.", [{ poly: [[-2, -5], [3, 5], [5, 5], [5, -5]], c: "blue" }, B34, O34], W34) }] },
        gate: true, then: "Every point in the shaded half-plane, and on the solid line, makes the inequality true." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide each step. Graph $y > -x + 2$.",
        how: HOW_3_4, skill: "Graph an inequality in two variables",
        steps: [
          { step: 1, ask: "The sign is $>$. How is the boundary $y = -x + 2$ drawn?", type: "choice", answer: 0,
            options: [{ t: "Dashed: points on it are not solutions" }, { t: "Solid", fb: "Solid is for $\\le$ and $\\ge$, where the line itself is included." }],
            m: "y = -x + 2 \\quad\\text{dashed}", say: "Strict inequality, dashed line." },
          { step: 2, ask: "Test $(0, 0)$. Is $0 > -0 + 2$?", type: "choice", answer: 0,
            options: [{ t: "No: $0 > 2$ is false" }, { t: "Yes", fb: "0 is not greater than 2." }],
            m: "0 > 2 \\quad\\text{is false}", say: "The origin is not a solution." },
          { step: 3, ask: "Which side is shaded?", type: "choice", answer: 0,
            options: [{ t: "The side without $(0, 0)$: above the line" }, { t: "The side with $(0, 0)$: below the line", fb: "The test point failed, so its side is left unshaded." }],
            m: "y > -x + 2", say: "Above the dashed line." }],
        why: "Boundary, test, shade. Now find a solution on the grid yourself." },
      { type: "plane", kicker: "On your own", prompt: "The dashed line is the boundary of $y < -2x + 4$. **Click a point** that is a solution.",
        x: [-5, 5], y: [-5, 5], click: "point", answer: { point: [0, 0] }, skill: "Graph an inequality in two variables",
        fns: [{ f: "-2*x + 4", color: "blue", dashed: true }],
        check: function (st) { var c = st.clicked; if (!c) return { ok: false }; return c[1] < -2 * c[0] + 4 ? { ok: true } : { ok: false, say: c[1] === -2 * c[0] + 4 ? "That point is on the boundary, and the sign is $<$: the line itself is not included." : "Test it: is $" + c[1] + " < -2(" + c[0] + ") + 4$? It is not." }; },
        hints: ["Test $(0, 0)$: is $0 < 4$?"], why: "$(0, 0)$ works: $0 < 4$. So does every point on its side of the line." },
      { type: "sort", prompt: "Sort the points for $2x + y \\le 4$.",
        bins: ["Solution", "Not a solution"],
        cards: [{ t: "$(0, 0)$", bin: 0, fb: "$0 \\le 4$." },
                { t: "$(2, 0)$", bin: 0, fb: "$4 \\le 4$ is true: the point is on the solid boundary." },
                { t: "$(3, 1)$", bin: 1, fb: "$6 + 1 = 7$, which is more than 4." },
                { t: "$(-1, 5)$", bin: 0, fb: "$-2 + 5 = 3$, and $3 \\le 4$." },
                { t: "$(1, 3)$", bin: 1, fb: "$2 + 3 = 5$, which is more than 4." }],
        skill: "Check a solution", hints: ["Work out $2x + y$ for each point."],
        why: "A point is a solution when $2x + y$ comes to 4 or less." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the boundary passes through the origin, $(0, 0)$ cannot be the test point. Graph $x - 2y < 0$.",
        scene: { type: "walk", how: HOW_3_4, rows: [
          { step: 1, m: "x - 2y = 0", say: "The boundary passes through $(0, 0)$. It is dashed, because the sign is $<$.", fig: grid("The dashed line x − 2y = 0 through the origin.", [B34B], W34) },
          { step: 2, m: "(0, 1): \\quad 0 - 2(1) < 0", say: "Pick any point off the line. $(0, 1)$ is easy.", fig: grid("The dashed line with the test point (0, 1) above it.", [B34B, T34B], W34) },
          { step: 2, m: "-2 < 0 \\quad\\text{is true}", say: "So $(0, 1)$ is a solution." },
          { step: 3, m: "x - 2y < 0", say: "Shade the side that contains $(0, 1)$: above the line.", fig: grid("The half-plane above the dashed line is shaded, with the test point (0, 1) inside it.", [{ poly: [[-5, -2.5], [5, 2.5], [5, 5], [-5, 5]], c: "blue" }, B34B, T34B], W34) }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A graph shows a **dashed** line $y = 3x + 1$ with the region **below** it shaded. Which inequality is it?",
        options: [{ t: "$y < 3x + 1$" }, { t: "$y \\le 3x + 1$", fb: "$\\le$ would make the line solid." }, { t: "$y > 3x + 1$", fb: "$y >$ shades above the line: the larger $y$-values." }],
        answer: 0, skill: "Graph an inequality in two variables", hints: ["Dashed means strict. Below means smaller $y$."], why: "Dashed: $<$ or $>$. Below the line: $y$ is less." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $y > x + 1$, Zoe tests $(0, 0)$, finds that $0 > 1$ is false, and shades the side **containing** $(0, 0)$. What is wrong?",
        options: [{ t: "A false test means that side is **not** shaded. Shade the other side." },
                  { t: "$(0, 0)$ can never be a test point.", fb: "It can, whenever it is not on the boundary. Here it is not." },
                  { t: "$0 > 1$ is true.", fb: "0 is less than 1." }],
        answer: 0, skill: "Graph an inequality in two variables", hints: ["Step 3 of the method."], why: "The test point is not a solution, so the solutions are on the other side: above the line." },
      { type: "choice", kicker: "Use it", prompt: "You earn **\\$10** an hour tutoring ($x$ hours) and **\\$15** an hour lifeguarding ($y$ hours), and you need at least **\\$300**: $10x + 15y \\ge 300$. Which plan works?",
        options: [{ t: "15 hours tutoring, 10 lifeguarding" }, { t: "10 hours of each", fb: "$100 + 150 = 250$: short of 300." }, { t: "20 hours tutoring, 5 lifeguarding", fb: "$200 + 75 = 275$: short of 300." }],
        answer: 0, skill: "Inequality applications", hints: ["Put each pair into $10x + 15y$."], why: "$10(15) + 15(10) = 300$, which is at least 300. The point is on the solid boundary." }
    ]
  });

  /* ============================================ 3.5 · Relations and functions */
  var HOW_3_5 = [["Inputs", "List the inputs: the domain."],
                 ["Outputs", "List the outputs: the range."],
                 ["Check", "Does any input have more than one output? If not, the relation is a function."],
                 ["Evaluate", "For a function $f$, find $f(a)$ by putting $a$ in place of $x$."]];
  LESSONS.push({
    title: "Relations and functions",
    blurb: "Book 3.5 · Domain and range, what makes a relation a function, and function notation.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $x^2 - 3x$ when $x = -2$.", answer: 10, skill: "Evaluate an expression",
        near: [{ v: -2, fb: "$(-2)^2 = 4$ and $-3(-2) = +6$." }, { v: -10, fb: "Both parts are positive: $4 + 6$." }],
        hints: ["$(-2)^2 - 3(-2)$."], why: "$4 + 6 = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **relation** is any set of ordered pairs. A **function** is a relation in which each input has exactly one output. The inputs make up the **domain** and the outputs the **range**.",
        scene: { type: "method", how: HOW_3_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a relation taken apart: $(1, 4)$, $(2, 5)$, $(3, 5)$, $(4, 8)$.",
        scene: { type: "walk", how: HOW_3_5, rows: [
          { step: 1, m: "\\text{domain: } 1, 2, 3, 4", say: "The first number of each pair is an input." },
          { step: 2, m: "\\text{range: } 4, 5, 8", say: "The second numbers are the outputs. 5 appears twice but is listed once.",
            ask: { prompt: "Which outputs make up the range?", answer: 0,
                   options: [{ t: "4, 5, 8" }, { t: "4, 5, 5, 8", fb: "A set lists each value once." }, { t: "1, 2, 3, 4", fb: "Those are the inputs: the domain." }] } },
          { step: 3, m: "1 \\to 4 \\quad 2 \\to 5 \\quad 3 \\to 5 \\quad 4 \\to 8", say: "Each input has exactly one output, so this is a function. Two inputs may share an output." },
          { step: 4, m: "f(3) = 5", say: "In function notation: the output for the input 3 is 5." }] },
        gate: true, then: "$f(3)$ is read “$f$ of 3”. It is the output, not a multiplication." },
      { type: "guided", kicker: "Together",
        prompt: "Now you take one apart: $(-2, 4)$, $(0, 0)$, $(2, 4)$, $(3, 9)$.",
        how: HOW_3_5, skill: "Relations and functions",
        steps: [
          { step: 1, ask: "What is the domain?", type: "choice", answer: 0,
            options: [{ t: "$-2, 0, 2, 3$" }, { t: "$0, 4, 9$", fb: "Those are the outputs. The domain is the set of inputs." }],
            m: "\\text{domain: } -2, 0, 2, 3", say: "The first numbers." },
          { step: 2, ask: "What is the range?", type: "choice", answer: 0,
            options: [{ t: "$0, 4, 9$" }, { t: "$4, 0, 4, 9$", fb: "List each output once." }],
            m: "\\text{range: } 0, 4, 9", say: "The second numbers, each listed once." },
          { step: 3, ask: "Is it a function?", type: "choice", answer: 0,
            options: [{ t: "Yes: each input has one output" }, { t: "No: the output 4 appears twice", fb: "Two inputs may share an output. What is not allowed is one input with two outputs." }],
            m: "\\text{a function}", say: "No input is repeated." },
          { step: 4, ask: "Its rule is $f(x) = x^2$. What is $f(3)$?", type: "num", pre: "$f(3) =$", answer: 9, near: [{ v: 6, fb: "$3^2$ is $3 \\cdot 3$." }], hint: "$3^2$.",
            m: "f(3) = 3^2 = 9", say: "It matches the pair $(3, 9)$." }],
        why: "Inputs, outputs, check, evaluate. Now sort some relations on your own." },
      { type: "sort", kicker: "On your own", prompt: "Function, or not a function?",
        bins: ["Function", "Not a function"],
        cards: [{ t: "$(1, 2),\\ (1, 5),\\ (3, 4)$", bin: 1, fb: "The input 1 has two outputs: 2 and 5." },
                { t: "$y = 3x - 2$", bin: 0, fb: "Each $x$ gives exactly one $y$." },
                { t: "$x = y^2$", bin: 1, fb: "$x = 4$ gives $y = 2$ and $y = -2$: two outputs." },
                { t: "$(0, 1),\\ (1, 1),\\ (2, 1)$", bin: 0, fb: "Every input has one output. They happen to share it." }],
        skill: "Relations and functions", hints: ["Look for an input that has two different outputs."],
        why: "A function never sends one input to two outputs." },
      { type: "num", prompt: "For $f(x) = 2x^2 - 3x + 1$, find $f(-2)$.", pre: "$f(-2) =$", answer: 15, skill: "Evaluate a function",
        near: [{ v: 3, fb: "$-3(-2) = +6$: same signs give a positive." }, { v: -1, fb: "$(-2)^2 = 4$, so $2(4) = 8$, a positive number." }],
        hints: ["$2(-2)^2 - 3(-2) + 1$."], why: "$8 + 6 + 1 = 15$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The input can be an expression. For $f(x) = 3x - 5$, find $f(a + 2)$.",
        scene: { type: "walk", how: HOW_3_5, rows: [
          { step: 4, m: "f(x) = 3x - 5", say: "Whatever sits in the parentheses takes the place of $x$." },
          { step: 4, m: "f(a + 2) = 3(a + 2) - 5", say: "Replace $x$ with $(a + 2)$, parentheses and all." },
          { step: 4, m: "f(a + 2) = 3a + 6 - 5", say: "Distribute the 3." },
          { step: 4, m: "f(a + 2) = 3a + 1", say: "Combine the numbers." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "For $f(x) = 2x + 1$, find $f(x + 3)$.",
        options: [{ t: "$2x + 7$" }, { t: "$2x + 4$", fb: "The 2 multiplies the 3 as well: $2(x + 3) = 2x + 6$." }, { t: "$2x + 3$", fb: "Replace $x$ with $(x + 3)$, then distribute and add 1." }],
        answer: 0, skill: "Evaluate a function", hints: ["$2(x + 3) + 1$."], why: "$2x + 6 + 1 = 2x + 7$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says: “$f(x) = x^2$ is not a function, because $f(2) = 4$ and $f(-2) = 4$.” What is wrong?",
        options: [{ t: "Two inputs may share an output. A function only needs each input to have one output." },
                  { t: "$f(-2)$ is $-4$, not 4.", fb: "$(-2)^2 = 4$." },
                  { t: "Nothing. It is not a function.", fb: "Does any single input give two different outputs? No." }],
        answer: 0, skill: "Relations and functions", hints: ["Step 3: what exactly is not allowed?"], why: "Each input of $f(x) = x^2$ has exactly one square. It is a function." },
      { type: "num", kicker: "Use it", prompt: "Renting a bike for $h$ hours costs $C(h) = 6h + 10$ dollars. Find $C(3)$: the cost of a 3-hour rental.",
        pre: "$\\$$", answer: 28, skill: "Evaluate a function",
        near: [{ v: 18, fb: "Add the \\$10 fixed charge." }, { v: 48, fb: "Only the 6 multiplies the hours." }],
        hints: ["$6(3) + 10$."], why: "$18 + 10 = 28$." }
    ]
  });

  /* ================================================ 3.6 · Graphs of functions */
  var HOW_3_6 = [["Line test", "Sweep a vertical line across the graph. If it never meets the graph twice, the graph is a function."],
                 ["Shape", "Name the basic shape: line, parabola, cubic, square root or V."],
                 ["Domain", "Read the domain: every $x$ the graph covers, from left to right."],
                 ["Range", "Read the range: every $y$ the graph reaches, from bottom to top."]];
  var W36 = { x: [-4, 4], y: [-2, 6] }, SQ = function (x) { return x * x; }, ROOT = function (x) { return x >= 0 ? Math.sqrt(x) : NaN; };
  var VEE = function (x) { return Math.abs(x) - 1; }, BALL = function (x) { return x >= 0 && x <= 6 ? 9 - (x - 3) * (x - 3) : NaN; }, BENT = pw([[-3, 2], [1, -1], [4, 3]]);
  LESSONS.push({
    title: "Graphs of functions",
    blurb: "Book 3.6 · The vertical line test, the basic shapes, and reading domain and range from a graph.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "If $f(2) = 7$, which point is on the graph of $f$?",
        options: [{ t: "$(2, 7)$" }, { t: "$(7, 2)$", fb: "The input goes first: $(x, f(x))$." }, { t: "$(2, 0)$", fb: "The height above $x = 2$ is the output, 7." }],
        answer: 0, skill: "Read a graph", hints: ["A point on the graph is $(x, f(x))$."], why: "Input 2, output 7: the point $(2, 7)$." },
      { type: "learn", kicker: "The idea",
        prompt: "The graph of a function is every point $(x, f(x))$. A graph is a function exactly when no vertical line crosses it twice: the **vertical line test**. From the graph you can read the domain and the range.",
        scene: { type: "method", how: HOW_3_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the graph of $f(x) = x^2$ read from top to bottom.",
        scene: { type: "walk", how: HOW_3_6, rows: [
          { step: 1, m: "f(x) = x^2", say: "Any vertical line meets this graph once, so it is a function.", fig: grid("A parabola opening upward from the origin, with a dashed vertical line crossing it once.", curve(SQ, -2.4, 2.4, "blue").concat([{ seg: [[1, -2], [1, 6]], c: "orange", dash: true }, { pt: [1, 1], c: "orange" }]), W36) },
          { step: 2, m: "\\text{a parabola}", say: "The square function makes a U shape called a parabola." },
          { step: 3, m: "(-\\infty, \\infty)", say: "Domain: the arms spread left and right without end, so every $x$ is used." },
          { step: 4, m: "[0, \\infty)", say: "Range: the lowest point is at height 0, and the graph rises without end.",
            ask: { prompt: "What is the lowest $y$-value on the graph of $f(x) = x^2$?", answer: 0,
                   options: [{ t: "0" }, { t: "There isn't one", fb: "A square is never negative, so the graph never dips below 0." }, { t: "$-2$", fb: "No square is negative." }] } }] },
        gate: true, then: "Other basic shapes: $f(x) = x$ is a line, $f(x) = x^3$ an S-shaped curve, and $f(x) = |x|$ a V." },
      { type: "guided", kicker: "Together",
        prompt: "Now you read this graph.",
        scene: graph([-2, 10], [-2, 5], [{ f: ROOT, color: "blue" }], { marks: [{ x: 0, y: 0, color: "blue" }] }),
        how: HOW_3_6, skill: "Read a graph",
        steps: [
          { step: 1, ask: "Does any vertical line cross this graph twice?", type: "choice", answer: 0,
            options: [{ t: "No: it is a function" }, { t: "Yes", fb: "Above each $x$ there is at most one point of the graph." }],
            m: "\\text{a function}", say: "It passes the vertical line test." },
          { step: 2, ask: "Which basic function has this shape?", type: "choice", answer: 0,
            options: [{ t: "The square root, $f(x) = \\sqrt{x}$" }, { t: "The absolute value, $f(x) = |x|$", fb: "That one is a V with two arms." }, { t: "The cube, $f(x) = x^3$", fb: "That one runs through every $x$, positive and negative." }],
            m: "f(x) = \\sqrt{x}", say: "Half of a parabola lying on its side." },
          { step: 3, ask: "What is its domain?", type: "choice", answer: 0,
            options: [{ t: "$[0, \\infty)$" }, { t: "$(-\\infty, \\infty)$", fb: "There is no graph to the left of 0: a negative number has no real square root." }],
            m: "\\text{domain: } [0, \\infty)", say: "The graph starts at $x = 0$ and runs right." },
          { step: 4, ask: "And its range?", type: "choice", answer: 0,
            options: [{ t: "$[0, \\infty)$" }, { t: "$(0, \\infty)$", fb: "The graph touches height 0 at $x = 0$, so 0 is included." }],
            m: "\\text{range: } [0, \\infty)", say: "It starts at height 0 and keeps rising, slowly." }],
        why: "Line test, shape, domain, range. Now match the shapes yourself." },
      { type: "slots", kicker: "On your own", prompt: "Match each function to the shape of its graph.",
        slots: [{ id: "a", label: "Straight line" }, { id: "b", label: "Parabola (U shape)" }, { id: "c", label: "V shape" }, { id: "d", label: "S-shaped curve" }],
        cards: [{ t: "$f(x) = 2x + 1$", slot: "a", fb: "A linear function." },
                { t: "$f(x) = x^2$", slot: "b", fb: "The square function." },
                { t: "$f(x) = |x|$", slot: "c", fb: "The absolute value function: two straight arms meeting at a corner." },
                { t: "$f(x) = x^3$", slot: "d", fb: "The cube function: it falls to the left and rises to the right." }],
        skill: "Basic functions", hints: ["Try $x = -2$, 0 and 2 in each one."],
        why: "Line, parabola, V and S-curve: the basic shapes you will meet again and again." },
      { type: "numbers", prompt: "Use the graph of $f$ to solve $f(x) = 3$. Give every solution.",
        scene: graph([-6, 6], [-3, 6], [{ f: VEE, color: "blue" }], { hline: [3] }),
        answer: [-4, 4], skill: "Read a graph", placeholder: "e.g. −2, 2",
        hints: ["Where does the graph meet the red line at height 3?"], why: "The graph is at height 3 above $x = -4$ and above $x = 4$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Not every graph is a function. Test the circle $x^2 + y^2 = 9$.",
        scene: { type: "walk", how: HOW_3_6, rows: [
          { step: 1, m: "x^2 + y^2 = 9", say: "The vertical line $x = 1$ meets the circle twice.", fig: grid("A circle of radius 3 about the origin, with a dashed vertical line crossing it at two points.", [{ circle: [[0, 0], 3], c: "blue" }, { seg: [[1, -4], [1, 4]], c: "orange", dash: true }, { pt: [1, 2.83], c: "orange" }, { pt: [1, -2.83], c: "orange" }], { x: [-4, 4], y: [-4, 4] }) },
          { step: 1, m: "\\text{not a function}", say: "One input with two outputs: it fails the vertical line test." },
          { step: 3, m: "\\text{domain: } [-3, 3]", say: "A relation still has a domain: the circle runs from $x = -3$ to $x = 3$." },
          { step: 4, m: "\\text{range: } [-3, 3]", say: "And a range: from $y = -3$ up to $y = 3$." }] },
        gate: true },
      { type: "numberline", kicker: "Try it", prompt: "This graph has two endpoints. Show its **domain** on the number line.",
        scene: graph([-5, 6], [-3, 5], [{ f: BENT, color: "blue" }], { marks: [{ x: -3, y: 2, color: "blue" }, { x: 4, y: 3, color: "blue" }] }),
        min: -5, max: 6, mode: "seg", variable: "x", seg: { a: -1, b: 1, ca: false, cb: false },
        answer: { a: -3, b: 4, ca: true, cb: true }, skill: "Domain and range",
        hints: ["How far left does the graph go? How far right? Are the end dots filled?"], why: "The graph runs from $x = -3$ to $x = 4$, with both ends included: $[-3, 4]$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben says: “The range of $f(x) = |x|$ is all real numbers, because the V goes on forever.” What is wrong?",
        options: [{ t: "The V never goes below 0. The range is $[0, \\infty)$." },
                  { t: "Nothing. Both arms go on forever.", fb: "They go on forever **upward**. Is there any point with a negative height?" },
                  { t: "The range is $(-\\infty, 0]$.", fb: "An absolute value is never negative. The V opens upward." }],
        answer: 0, skill: "Domain and range", hints: ["Range is read from bottom to top. What is the lowest point?"], why: "The domain is all real numbers, but the outputs start at 0: $[0, \\infty)$." },
      { type: "num", kicker: "Use it", prompt: "The graph shows a ball's height in metres, $t$ seconds after it is thrown. What is its greatest height?",
        scene: graph([0, 7], [0, 10], [{ f: BALL, color: "blue" }], { axisLabels: ["t", "h"] }),
        post: "m", answer: 9, skill: "Read a graph",
        near: [{ v: 3, fb: "3 is the **time** when it is highest. Read the height at that moment." }, { v: 6, fb: "6 seconds is when it lands. Read the height of the top of the curve." }],
        hints: ["Find the highest point of the curve, then read its height on the vertical axis."], why: "The top of the curve is $(3, 9)$: 9 metres, reached after 3 seconds." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "a2u3-intercepts", title: "Find the intercepts of a line", lesson: 2,
      gen: function (R) {
        var A = R.int(1, 5), B = R.int(1, 5) * R.pick([-1, 1]), k = R.pick([-2, -1, 1, 2]), C = A * Math.abs(B) / L.gcd(A, B) * k, askX = R.chance(0.5);
        var eq = poly([[A, "x"], [B, "y"]]) + " = " + C, ans = askX ? C / A : C / B, other = askX ? C / B : C / A;
        return { type: "num", prompt: "Find the $" + (askX ? "x" : "y") + "$-intercept of $" + eq + "$. Give its $" + (askX ? "x" : "y") + "$-coordinate.", pre: "$" + (askX ? "x" : "y") + " =$", answer: ans,
          near: near(ans, [{ v: other, fb: "That is the other intercept. For the $" + (askX ? "x" : "y") + "$-intercept, let $" + (askX ? "y" : "x") + " = 0$." }, { v: -ans, fb: "Check the sign when you divide." }]),
          hints: ["Let $" + (askX ? "y" : "x") + " = 0$ and solve."], why: "With $" + (askX ? "y" : "x") + " = 0$: $" + poly([[askX ? A : B, askX ? "x" : "y"]]) + " = " + C + "$, so $" + (askX ? "x" : "y") + " = " + ans + "$." };
      } },
    { id: "a2u3-slope", title: "Find the slope through two points", lesson: 3,
      gen: function (R) {
        var x1 = R.int(-5, 4), y1 = R.int(-6, 6), dx = R.int(1, 5), dy = R.nz(-8, 8), x2 = x1 + dx, y2 = y1 + dy;
        return { type: "num", prompt: "Find the slope of the line through $(" + x1 + ", " + y1 + ")$ and $(" + x2 + ", " + y2 + ")$. (A fraction like 3/4 is fine.)", pre: "$m =$", answer: dy / dx, tol: 1e-9, shown: L.fracText(dy, dx),
          near: near(dy / dx, [{ v: dx / dy, tol: 1e-9, fb: "Slope is rise over run: the change in $y$ goes on top." }, { v: -dy / dx, tol: 1e-9, fb: "Subtract in the same order on the top and on the bottom." }]),
          hints: ["$\\frac{y_2 - y_1}{x_2 - x_1}$."], why: "$\\frac{" + y2 + " - " + (y1 < 0 ? "(" + y1 + ")" : y1) + "}{" + x2 + " - " + (x1 < 0 ? "(" + x1 + ")" : x1) + "} = " + frac(dy, dx) + "$." };
      } },
    { id: "a2u3-line", title: "Write the equation of a line", lesson: 4,
      gen: function (R) {
        var m = R.nz(-4, 4), x1 = R.nz(-4, 4), y1 = R.int(-6, 6), b = y1 - m * x1, rhs = poly([[m, "x"], [b, ""]]);
        return { type: "equation", prompt: "Write the equation of the line with slope $" + m + "$ through $(" + x1 + ", " + y1 + ")$, in slope-intercept form.", answer: "y=" + clean(rhs), shown: "y = " + rhs, form: "slope-intercept",
          near: [{ v: "y=" + clean(poly([[m, "x"], [y1, ""]])), fb: "$" + y1 + "$ is the height at $x = " + x1 + "$, not at $x = 0$. Use the point-slope form." }],
          hints: ["$y - " + (y1 < 0 ? "(" + y1 + ")" : y1) + " = " + m + "(x - " + (x1 < 0 ? "(" + x1 + ")" : x1) + ")$."],
          why: "$y - " + (y1 < 0 ? "(" + y1 + ")" : y1) + " = " + m + "(x - " + (x1 < 0 ? "(" + x1 + ")" : x1) + ")$ simplifies to $y = " + rhs + "$." };
      } },
    { id: "a2u3-parallel", title: "Parallel and perpendicular lines", lesson: 3,
      gen: function (R) {
        var a = R.pick([2, 3, 4, -2, -3, -4]), b1 = R.int(-5, 5), b2 = b1 + R.nz(-4, 4), kind = R.int(0, 2);
        var second = kind === 0 ? poly([[a, "x"], [b2, ""]]) : kind === 1 ? frac(-1, a) + "x " + signed(b2) : poly([[-a, "x"], [b2, ""]]);
        var right = ["Parallel", "Perpendicular", "Neither"][kind];
        var why = kind === 0 ? "Both slopes are $" + a + "$, and the intercepts differ." : kind === 1 ? "$" + a + " \\cdot " + (a > 0 ? frac(-1, a) : "\\left(" + frac(-1, a) + "\\right)") + " = -1$." : "The slopes $" + a + "$ and $" + (-a) + "$ are not equal, and their product is $" + (-a * a) + "$, not $-1$.";
        return mc(R, { prompt: "How are these lines related? $$y = " + poly([[a, "x"], [b1, ""]]) + " \\quad\\text{and}\\quad y = " + second + "$$", right: right,
          wrong: ["Parallel", "Perpendicular", "Neither"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: why }; }), keep: true,
          hints: ["Compare the slopes: equal, or multiplying to $-1$?"], why: why });
      } },
    { id: "a2u3-ineq2", title: "Test a point in an inequality", lesson: 5,
      gen: function (R) {
        var m = R.nz(-3, 3), b = R.int(-4, 4), p = R.int(-3, 3), q = R.int(-5, 5), sym = R.pick(["<", ">", "\\le", "\\ge"]), line = m * p + b;
        var ok = sym === "<" ? q < line : sym === ">" ? q > line : sym === "\\le" ? q <= line : q >= line;
        var why = "$" + q + " " + sym + " " + m + "(" + p + ") " + signed(b) + "$ is $" + q + " " + sym + " " + line + "$: " + (ok ? "true" : "false") + ".";
        return mc(R, { prompt: "Is $(" + p + ", " + q + ")$ a solution of $y " + sym + " " + poly([[m, "x"], [b, ""]]) + "$?", right: ok ? "Yes" : "No", wrong: [{ t: ok ? "No" : "Yes", fb: why }], keep: true,
          hints: ["Substitute $x = " + p + "$ and $y = " + q + "$."], why: why });
      } },
    { id: "a2u3-evaluate", title: "Evaluate a function", lesson: 6,
      gen: function (R) {
        var a = R.pick([1, 1, 2, -1, 3]), b = R.nz(-6, 6), c = R.int(-8, 8), k = R.nz(-4, 5), ans = a * k * k + b * k + c;
        var f = poly([[a, "x^2"], [b, "x"], [c, ""]]), K = k < 0 ? "(" + k + ")" : String(k);
        return { type: "num", prompt: "For $f(x) = " + f + "$, find $f(" + k + ")$.", pre: "$f(" + k + ") =$", answer: ans,
          near: near(ans, [{ v: a * k * k - b * k + c, fb: "Watch the sign of $" + b + " \\cdot " + K + "$." }, { v: -a * k * k + b * k + c, fb: "$" + K + "^2 = " + k * k + "$: a square is positive." }]),
          hints: ["Put $" + K + "$ in place of every $x$."], why: "$" + (a === 1 ? "" : a === -1 ? "-" : a) + "(" + k * k + ") " + signed(b * k) + " " + signed(c) + " = " + ans + "$." };
      } }
  ];
  L.unit("alg2", 3, {
    title: "Graphs and Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Intercepts, slope, parallel and perpendicular lines, and the equation of a line.",
        skills: ["a2u3-intercepts", "a2u3-slope", "a2u3-parallel", "a2u3-line"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Inequalities in two variables, and evaluating functions.",
        skills: ["a2u3-ineq2", "a2u3-evaluate"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:3", {
    2: { name: "Graph of a linear equation", frame: "Every [[solution]] of a linear equation is a point on its line. For the $x$-intercept let [[$y = 0$]]. For the $y$-intercept let [[$x = 0$]]. The graph of $x = a$ is a [[vertical]] line.",
         chips: ["horizontal", "$m = 0$"], fb: { "horizontal": "$x = a$ keeps $x$ fixed while $y$ changes: straight up and down." } },
    3: { name: "Slope", frame: "Slope is [[rise]] over [[run]]: $m = \\frac{y_2 - y_1}{x_2 - x_1}$. Parallel lines have [[equal]] slopes. Perpendicular lines have slopes that multiply to [[$-1$]].",
         chips: ["$0$", "opposite"] },
    4: { name: "Equation of a line", frame: "The point-slope form is [[$y - y_1 = m(x - x_1)$]]. It needs a [[slope]] and one [[point]]. Solving it for $y$ gives [[slope-intercept]] form.",
         chips: ["$y = mx$", "standard"] },
    5: { name: "Linear inequality graph", frame: "The boundary is [[dashed]] for $<$ or $>$ and [[solid]] for $\\le$ or $\\ge$. Test a point: if it makes the inequality [[true]], shade its side.",
         chips: ["false", "dotted"], fb: { "false": "A point that fails the test sits on the side that is left unshaded." } },
    6: { name: "Function", frame: "A function gives each [[input]] exactly [[one]] output. The inputs form the [[domain]] and the outputs the [[range]].",
         chips: ["two", "slope"], fb: { "two": "One input with two outputs is exactly what a function may not have." } },
    7: { name: "Vertical line test", frame: "A graph is a function if every [[vertical]] line meets it at most [[once]]. The domain is read along the [[$x$-axis]] and the range along the [[$y$-axis]].",
         chips: ["horizontal", "twice"] }
  });
})();
