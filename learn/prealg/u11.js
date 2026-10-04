/* ==========================================================================
   Prealgebra — Unit 11: Graphs. See lab/core.js for the format.

   Follows OpenStax Prealgebra 2e, Chapter 11, section for section: the
   readiness check, then 11.1 to 11.4. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   Ordered pairs and solutions in two variables (11.1), graphing a line by
   plotting points (11.2), graphing with intercepts (11.3), and the slope of
   a line (11.4).

   Adapted from OpenStax, Prealgebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Five lessons, five skills, two quizzes, and the unit test.
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
  /* Shared by every Prealgebra unit (compiled in after the Algebra I helpers). */
  var GIVEN = "That is the problem as it was given.", LATER = "This line follows correctly from the one above it. Look earlier.";
  var fig = L.fig;
  // A coordinate grid beside a worked example: grid("what it shows", items, { x, y, u }).
  // The scale fits the window: about 240 px across the longer side.
  function grid(alt, items, o) {
    o = Object.assign({ x: [-6, 6], y: [-6, 6], alt: alt, items: items }, o || {});
    if (!o.u) o.u = Math.max(14, Math.min(26, Math.floor(240 / Math.max(o.x[1] - o.x[0], o.y[1] - o.y[0]))));
    return fig(o);
  }
  // Whole numbers stacked for column arithmetic, digits right-aligned:
  //   stack("+", [247, 158], "405")
  // The result may be partial ("  5") or left out while the work is in progress. o.carry writes
  // small digits above the top number: "11 " puts a 1 over the hundreds and over the tens.
  function stack(op, nums, res, o) {
    o = o || {};
    var strs = nums.map(String), all = strs.concat(res != null ? [String(res)] : []).concat(o.carry ? [o.carry] : []);
    var w = Math.max.apply(null, all.map(function (s) { return s.length; })), r0 = o.carry ? 1 : 0, n = strs.length + 1 + r0, items = [], dx = 0.62;
    function put(s, row, c, small) {
      s = String(s);
      for (var i = 0; i < s.length; i++) if (s[i] !== " ") items.push({ text: s[i], at: [(w - s.length + i + 1.5) * dx, n - row - 0.68], eq: !small, c: c || "ink" });
    }
    if (o.carry) put(o.carry, 0, "orange", true);
    strs.forEach(function (s, i) { put(s, r0 + i); });
    items.push({ text: op, at: [0.45 * dx, n - (r0 + strs.length - 1) - 0.68], eq: true, c: "soft" });
    items.push({ seg: [[0.1, 1], [(w + 1.6) * dx, 1]], c: "soft" });
    if (res != null) put(res, n - 1, "blue");
    return fig({ grid: false, x: [0, (w + 1.7) * dx], y: [0, n], u: 40, pad: 8,
      alt: o.alt || (strs.join(" " + op + " ") + (res != null && String(res).trim() ? ", with " + String(res).trim() + " written below the line." : ", set out in columns.")), items: items });
  }
  // A number line beside a worked example: nline(-6, 6, [{ v: -2, name: "−2" }], { hops: [[0, 3, "orange", "+3"]] }).
  // Each hop is an arrow drawn above the line, one row higher than the last.
  function nline(lo, hi, marks, o) {
    o = o || {};
    var step = o.step || 1, hops = o.hops || [], items = [{ line: [[lo, 0], [hi, 0]], c: "soft" }];
    // A named mark takes the place of the tick label under it, so the two never print on top of each other.
    function named(v) { return (marks || []).some(function (m) { return m.name && Math.abs(m.v - v) < 1e-9; }); }
    for (var v = lo; v <= hi + 1e-9; v += step) {
      items.push({ seg: [[v, -0.2], [v, 0.2]], c: "soft" });
      if (named(v)) continue;
      if (!o.every || Math.abs(Math.round(v / (step * o.every)) * step * o.every - v) < 1e-9) items.push({ text: (o.label ? o.label(v) : num(v)).replace("-", "−"), at: [v, -0.85], c: "soft" });
    }
    hops.forEach(function (h, i) { items.push({ arrow: [[h[0], 0.6 + 0.6 * i], [h[1], 0.6 + 0.6 * i]], c: h[2] || "orange", say: h[3] }); });
    (marks || []).forEach(function (m) { items.push({ pt: [m.v, 0], name: m.name, at: m.at || "s", c: m.c || "blue" }); });
    var span = hi - lo + 1.2;
    return fig({ grid: false, x: [lo - 0.6, hi + 0.6], y: [-1.5, 0.9 + 0.6 * hops.length], u: Math.max(12, Math.min(40, Math.floor(300 / span))), pad: 6,
      alt: o.alt || "A number line from " + lo + " to " + hi + ".", items: items });
  }
  // A fraction strip: d equal parts with n shaded. strip(3, 4) is three quarters. More than d
  // parts carry on into a second strip, which is what an improper fraction looks like.
  function strip(n, d, o) {
    o = o || {};
    var bars = Math.max(1, Math.ceil(n / d)), items = [], w = 6 / d;
    for (var b = 0; b < bars; b++) for (var i = 0; i < d; i++) {
      var x = i * w, y = (bars - 1 - b) * 1.35, on = b * d + i < n;
      items.push({ poly: [[x, y], [x + w, y], [x + w, y + 1], [x, y + 1]], c: on ? (o.c || "blue") : "soft", fill: on });
    }
    return fig({ grid: false, x: [0, 6], y: [0, bars * 1.35 - 0.35], u: 40, pad: 6, alt: o.alt || (n + " of " + d + " equal parts shaded" + (bars > 1 ? ", across " + bars + " strips." : ".")), items: items });
  }
  // A geometry sketch with no graph paper behind it: shape("what it shows", [x0, x1], [y0, y1], items).
  function shape(alt, x, y, items, o) { return fig(Object.assign({ grid: false, x: x, y: y, u: 24, pad: 10, alt: alt, items: items }, o || {})); }
  // A hundred grid, ten by ten, with n small squares shaded column by column: what n percent looks like.
  function hundred(n, o) {
    var items = [], full = Math.floor(n / 10), rest = n % 10;
    if (full) items.push({ poly: [[0, 0], [full, 0], [full, 10], [0, 10]], c: "blue", fill: true });
    if (rest) items.push({ poly: [[full, 10 - rest], [full + 1, 10 - rest], [full + 1, 10], [full, 10]], c: "blue", fill: true });
    for (var i = 0; i <= 10; i++) { items.push({ seg: [[i, 0], [i, 10]], c: "soft" }); items.push({ seg: [[0, i], [10, i]], c: "soft" }); }
    return fig({ grid: false, x: [0, 10], y: [0, 10], u: 18, pad: 6, alt: (o && o.alt) || "A ten-by-ten grid of 100 small squares, " + n + " of them shaded.", items: items });
  }
  // A typed 6/8 is marked as 3/4, so "in simplest form" is asked with two boxes instead:
  // Object.assign({ prompt: … }, fracIn(3, 4)).
  function fracIn(n, d) { return { type: "table", head: ["Numerator", "Denominator"], rows: [[null, null]], answers: [[0, 0, n], [0, 1, d]] }; }
  // 11/4 as a mixed number: "2 3/4" to type, 2\frac{3}{4} to print. Simplified on the way.
  function mixed(n, d, tex) {
    var g = L.gcd(n, d), s = n < 0 ? "-" : ""; n = Math.abs(n) / g; d = d / g;
    var w = Math.floor(n / d), r = n - w * d;
    if (!r) return s + w;
    return s + (tex ? (w || "") + "\\frac{" + r + "}{" + d + "}" : (w ? w + " " : "") + r + "/" + d);
  }
  // 23658 as it is written in a sentence: 23,658.
  function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  // A typed "4,000" is read as 4, so every answer of 1000 or more carries the reply that says so.
  function nearBig(ans, list) { return near(ans, (ans >= 1000 ? [big(ans)] : []).concat(list || [])); }
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Chapter 11 Be Prepared · The number line, evaluating and solving, and simplifying a fraction.",
    mins: 6, v: 1,
    steps: [
      { type: "numberline", kicker: "Check 1 · The number line", prompt: "Drag the point to $-3$.",
        min: -6, max: 6, mode: "point", points: [{ v: 2, drag: true }], answer: { points: [-3] }, skill: "Locate integers",
        hints: ["Three steps to the left of 0."], why: "$-3$ is three steps to the left of 0." },
      { type: "num", prompt: "Evaluate $2x - 5$ when $x = -1$.", answer: -7, skill: "Evaluate with integers",
        near: [{ v: -3, fb: "$2(-1) = -2$, and $-2 - 5 = -7$." }, { v: 7, fb: "$-2 - 5$ is negative." }], hints: ["$2(-1) - 5$."], why: "$-2 - 5 = -7$." },
      { type: "num", kicker: "Check 2 · Equations", prompt: "Solve $3x + 6 = 0$.", pre: "$x =$", answer: -2, skill: "Solve an equation",
        near: [{ v: 2, fb: "$3x = -6$: different signs give a negative quotient." }], hints: ["$3x = -6$."], why: "$3x = -6$, so $x = -2$." },
      { type: "num", prompt: "Solve $6 + 3y = 12$.", pre: "$y =$", answer: 2, skill: "Solve an equation",
        near: [{ v: 6, fb: "That is $3y$. Divide by 3." }], hints: ["$3y = 6$."], why: "$3y = 6$, so $y = 2$." },
      { type: "num", kicker: "Check 3 · Fractions", prompt: "Simplify $\\frac{7 - 1}{5 - 2}$.", answer: 2, skill: "Fraction bar",
        near: [{ v: 0.5, tol: 1e-9, fb: "Top over bottom: $\\frac{6}{3}$." }], hints: ["$\\frac{6}{3}$."], why: "$\\frac{6}{3} = 2$." },
      { type: "choice", prompt: "Simplify $\\frac{-4}{6}$.",
        options: [{ t: "$-\\frac{2}{3}$" }, { t: "$\\frac{2}{3}$", fb: "A negative numerator makes the fraction negative." }, { t: "$-\\frac{3}{2}$", fb: "Divide the top and the bottom by 2. Do not turn the fraction over." }],
        answer: 0, skill: "Simplify a fraction", hints: ["2 divides both."], why: "$\\frac{-4 \\div 2}{6 \\div 2} = -\\frac{2}{3}$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 11.1**. If **check 1** slipped, see Unit 3. If **check 2** slipped, see Unit 8. If **check 3** slipped, see lessons 4.2 and 4.3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ===================================== 11.1 · Use the rectangular coordinate system */
  var HOW_11_1 = [["Substitute", "Put the known value, or both values of the pair, into the equation."],
                  ["Simplify", "Work out the result."],
                  ["Pair", "Write the solution as an ordered pair $(x, y)$, or decide whether the pair fits."]];
  LESSONS.push({
    title: "The rectangular coordinate system",
    blurb: "Book 11.1 · Plotting points, naming points, and ordered pairs as solutions of an equation in two variables.",
    mins: 12, v: 1,
    steps: [
      { type: "plane", kicker: "Warm up", prompt: "An ordered pair $(x, y)$ says how far across, then how far up. Click the point $(4, 2)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [4, 2] }, skill: "Plot a point",
        clickFb: function (c) { return c && c[0] === 2 && c[1] === 4 ? "That is $(2, 4)$. The first number is $x$: across." : "The first number is $x$ (across), the second is $y$ (up or down)."; },
        hints: ["Go 4 to the right, then 2 up."], why: "$x = 4$ is 4 to the right. $y = 2$ is 2 up." },
      { type: "learn", kicker: "The idea",
        prompt: "An ordered pair $(x, y)$ gives a position: $x$ across from the origin, then $y$ up or down. An equation in two variables has ordered pairs as its solutions. A pair is a solution if it makes the equation true.",
        scene: { type: "method", how: HOW_11_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Is $(-4, 3)$ a solution of $x + 4y = 8$? Watch it tested.",
        scene: { type: "walk", how: HOW_11_1, rows: [
          { step: 1, m: "x + 4y = 8", say: "The pair gives $x = -4$ and $y = 3$." },
          { step: 1, m: "-4 + 4(3) = 8", say: "Both values go in. Is this true?",
            ask: { prompt: "Which number replaces $x$?", answer: 0,
                   options: [{ t: "$-4$, the first of the pair" }, { t: "$3$", fb: "The first number of an ordered pair is always $x$." }] } },
          { step: 2, m: "-4 + 12 = 8", say: "$4(3) = 12$." },
          { step: 3, m: "8 = 8", say: "True, so $(-4, 3)$ is a solution." }] },
        gate: true, then: "A pair that gives a false statement is not a solution." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the solution of $y = 4x - 2$ that has $x = 2$.",
        how: HOW_11_1, skill: "Find a solution",
        steps: [
          { step: 1, ask: "Substitute $x = 2$. Which is it?", type: "choice", answer: 0,
            options: [{ t: "$y = 4(2) - 2$" }, { t: "$2 = 4x - 2$", fb: "2 replaces $x$, not $y$." }],
            m: "y = 4(2) - 2", say: "2 in place of $x$." },
          { step: 2, ask: "Simplify. What is $y$?", type: "num", answer: 6, near: [{ v: 0, fb: "Multiply before you subtract: $8 - 2$." }], hint: "$8 - 2$.",
            m: "y = 6", say: "$8 - 2 = 6$." },
          { step: 3, ask: "Write the solution as an ordered pair.", type: "choice", answer: 0,
            options: [{ t: "$(2, 6)$" }, { t: "$(6, 2)$", fb: "$x$ is written first." }],
            m: "(2, 6)", say: "$x$ first, then $y$." }],
        why: "Substitute, simplify, pair. Now two on your own." },
      { type: "table", kicker: "On your own", prompt: "Complete this table of solutions of $y = 2x - 1$.",
        head: ["$x$", "$y$"], rows: [[0, null], [1, null], [3, null]],
        answers: [[0, 1, -1], [1, 1, 1], [2, 1, 5]], skill: "Table of solutions",
        hints: ["Double $x$, then subtract 1."], why: "$2(0) - 1 = -1$, $2(1) - 1 = 1$, $2(3) - 1 = 5$." },
      { type: "plane", prompt: "Negative coordinates go left and down. Click the point $(-2, -3)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [-2, -3] }, skill: "Plot a point",
        clickFb: function (c) { return c && c[0] === -3 && c[1] === -2 ? "That is $(-3, -2)$. The first number is $x$: across." : "Go 2 to the left, then 3 down."; },
        hints: ["2 to the left, then 3 down."], why: "$x = -2$ is 2 to the left. $y = -3$ is 3 down." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the equation is not solved for $y$, zero is the easiest value to try. Find two solutions of $3x + 2y = 6$.",
        scene: { type: "walk", how: [["Zero for x", "Let $x = 0$ and solve for $y$."],
                                    ["Zero for y", "Let $y = 0$ and solve for $x$."],
                                    ["Pairs", "Write each solution as an ordered pair."]], rows: [
          { step: 1, m: "3(0) + 2y = 6", say: "With $x = 0$, the $x$ term disappears." },
          { step: 1, m: "y = 3", say: "$2y = 6$." },
          { step: 2, m: "3x + 2(0) = 6", say: "With $y = 0$, the $y$ term disappears." },
          { step: 2, m: "x = 2", say: "$3x = 6$." },
          { step: 3, m: "(0, 3) \\quad (2, 0)", say: "Two solutions of the equation." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which ordered pair is a solution of $y = 5x - 1$?",
        options: [{ t: "$(1, 4)$" }, { t: "$(4, 1)$", fb: "With $x = 4$: $5(4) - 1 = 19$, not 1." }, { t: "$(0, 1)$", fb: "With $x = 0$: $5(0) - 1 = -1$, not 1." }, { t: "$(-1, -4)$", fb: "With $x = -1$: $5(-1) - 1 = -6$, not $-4$." }],
        answer: 0, skill: "Verify a solution", hints: ["Put each $x$ into $5x - 1$ and compare with the $y$."], why: "$5(1) - 1 = 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To plot $(3, -4)$, Lin goes 4 to the left and then 3 up. What is wrong?",
        options: [{ t: "The first number is $x$: 3 to the right. The second is $y$: 4 down." },
                  { t: "She should go 3 to the left and 4 down.", fb: "$x = 3$ is positive: to the right." },
                  { t: "Nothing. It is right.", fb: "She has plotted $(-4, 3)$." }],
        answer: 0, skill: "Plot a point", hints: ["Which coordinate comes first?"], why: "$(x, y)$: across first, then up or down." },
      { type: "choice", kicker: "Use it", prompt: "Which ordered pair names the point $P$?",
        scene: { type: "plane", x: [-6, 6], y: [-6, 6], points: [{ id: "P", x: -4, y: 3, drag: false, label: "P", coords: false }] },
        options: [{ t: "$(-4, 3)$" }, { t: "$(3, -4)$", fb: "$x$ comes first: $P$ is 4 to the left." }, { t: "$(4, 3)$", fb: "$P$ is to the left of the $y$-axis, so $x$ is negative." }],
        answer: 0, skill: "Name a point", hints: ["How far left or right, then how far up or down?"], why: "4 to the left and 3 up." }
    ]
  });

  /* ===================================================== 11.2 · Graphing linear equations */
  var HOW_11_2 = [["Table", "Find three points whose coordinates are solutions, and organise them in a table."],
                  ["Plot", "Plot the points, and check that they line up."],
                  ["Draw", "Draw the line through them, right across the grid."]];
  LESSONS.push({
    title: "Graphing linear equations",
    blurb: "Book 11.2 · The graph as the picture of all solutions, plotting points, and vertical and horizontal lines.",
    mins: 13, v: 1,
    steps: [
      { type: "table", kicker: "Warm up", prompt: "Complete this table of solutions of $y = x + 2$.",
        head: ["$x$", "$y$"], rows: [[-1, null], [0, null], [2, null]],
        answers: [[0, 1, 1], [1, 1, 2], [2, 1, 4]], skill: "Table of solutions",
        hints: ["Add 2 to each $x$."], why: "$-1 + 2 = 1$, $0 + 2 = 2$, $2 + 2 = 4$." },
      { type: "learn", kicker: "The idea",
        prompt: "Every solution of a linear equation is a point, and all of them lie on one straight line. That line is the **graph** of the equation: every point on it is a solution, and every solution is on it.",
        scene: { type: "method", how: HOW_11_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $y = 2x + 1$ graphed.",
        scene: { type: "walk", how: HOW_11_2, rows: [
          { step: 1, m: "x = 0 \\to y = 1", say: "$2(0) + 1$." },
          { step: 1, m: "x = 1 \\to y = 3", say: "$2(1) + 1$." },
          { step: 1, m: "x = -2 \\to y = -3", say: "$2(-2) + 1$. A third point is a check on the other two.",
            ask: { prompt: "With $x = -2$, what is $2(-2) + 1$?", answer: 0,
                   options: [{ t: "$-3$" }, { t: "$5$", fb: "$2(-2) = -4$, and $-4 + 1 = -3$." }] } },
          { step: 2, m: "(0, 1) \\quad (1, 3) \\quad (-2, -3)", say: "The three points line up.",
            fig: grid("The points (0, 1), (1, 3) and (−2, −3) plotted on a grid.", [{ pt: [0, 1], name: "(0, 1)", at: "e" }, { pt: [1, 3], name: "(1, 3)", at: "e" }, { pt: [-2, -3], name: "(−2, −3)", at: "e" }]) },
          { step: 3, m: "y = 2x + 1", say: "The line through them is the graph.",
            fig: grid("The line y = 2x + 1 drawn through the points (0, 1), (1, 3) and (−2, −3).", [{ line: [[-2, -3], [1, 3]], c: "blue" }, { pt: [0, 1] }, { pt: [1, 3] }, { pt: [-2, -3] }]) }] },
        gate: true, then: "Two points fix a line. The third tells you if you slipped." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find three points on $y = -x + 4$ and check them.",
        how: HOW_11_2, skill: "Graph by plotting points",
        steps: [
          { step: 1, ask: "Let $x = 0$. What is $y$?", type: "num", answer: 4, hint: "$-0 + 4$.",
            m: "(0, 4)", say: "The first point." },
          { step: 1, ask: "Let $x = 2$. What is $y$?", type: "num", answer: 2, near: [{ v: 6, fb: "$-x$ is $-2$ here: $-2 + 4$." }], hint: "$-2 + 4$.",
            m: "(0, 4) \\quad (2, 2)", say: "The second point." },
          { step: 2, ask: "A third point is $(4, 0)$. Do the three line up?", type: "choice", answer: 0,
            options: [{ t: "Yes: each 2 to the right goes 2 down" }, { t: "No", fb: "From $(0, 4)$ to $(2, 2)$ to $(4, 0)$ the steps are the same." }],
            m: "(0, 4) \\quad (2, 2) \\quad (4, 0)", say: "Equal steps: they are in line." },
          { step: 3, ask: "The line carries on. Which other point is on it?", type: "choice", answer: 0,
            options: [{ t: "$(5, -1)$" }, { t: "$(5, 1)$", fb: "$-5 + 4 = -1$." }],
            m: "y = -x + 4", say: "Every point of the line is a solution." }],
        why: "Table, plot, draw. Now two on your own." },
      { type: "plane", kicker: "On your own", prompt: "Graph $y = 3x - 2$. Drag $A$ and $B$ onto two of its points.",
        x: [-6, 6], y: [-6, 6],
        points: [{ id: "A", x: -3, y: 2, drag: true, label: "A" }, { id: "B", x: 3, y: -1, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) { return onLine(st, "A", "B", 3, -2) ? { ok: true } : { ok: false, say: "Try $x = 0$, which gives $y = -2$, and $x = 1$, which gives $y = 1$." }; },
        answer: { points: { A: [0, -2], B: [1, 1] } }, skill: "Graph a line",
        hints: ["Try $x = 0$ and $x = 1$."], why: "$(0, -2)$ and $(1, 1)$ are on the line, and so is $(2, 4)$." },
      { type: "choice", prompt: "Which point lies on the graph of $y = \\frac{1}{2}x - 1$?",
        options: [{ t: "$(4, 1)$" }, { t: "$(1, 4)$", fb: "With $x = 1$: $\\frac{1}{2} - 1 = -\\frac{1}{2}$." }, { t: "$(2, 2)$", fb: "With $x = 2$: $1 - 1 = 0$." }],
        answer: 0, skill: "Verify a solution", hints: ["Half of $x$, minus 1."], why: "$\\frac{1}{2}(4) - 1 = 1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An equation with only one variable is still a line. Graph $x = -3$, and then $y = 2$.",
        scene: { type: "walk", how: [["One letter", "With only one variable in the equation, the other can be anything."],
                                    ["Points", "List some points: the named coordinate never changes."],
                                    ["Draw", "$x = a$ is a vertical line. $y = b$ is a horizontal line."]], rows: [
          { step: 1, m: "x = -3", say: "There is no $y$ in the equation, so $y$ can be any number." },
          { step: 2, m: "(-3, 0) \\quad (-3, 2) \\quad (-3, -4)", say: "Every point has $x$-coordinate $-3$." },
          { step: 3, m: "x = -3", say: "A vertical line, 3 to the left of the $y$-axis.",
            fig: grid("The vertical line x = −3.", [{ line: [[-3, -4], [-3, 2]], c: "blue" }, { pt: [-3, 0] }, { pt: [-3, 2] }, { pt: [-3, -4] }]) },
          { step: 3, m: "y = 2", say: "In the same way, every point of $y = 2$ is 2 up: a horizontal line.",
            fig: grid("The vertical line x = −3 and the horizontal line y = 2.", [{ line: [[-3, -4], [-3, 2]], c: "blue" }, { line: [[-4, 2], [4, 2]], c: "green" }]) }] },
        gate: true },
      { type: "plane", kicker: "Try it", prompt: "Graph $y = -2$. Drag $A$ and $B$ onto two of its points.",
        x: [-6, 6], y: [-6, 6],
        points: [{ id: "A", x: -3, y: 3, drag: true, label: "A" }, { id: "B", x: 2, y: 1, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) { return onLine(st, "A", "B", 0, -2) ? { ok: true } : { ok: false, say: "Every point of $y = -2$ is 2 below the $x$-axis, whatever its $x$." }; },
        answer: { points: { A: [-3, -2], B: [2, -2] } }, skill: "Horizontal and vertical lines",
        hints: ["Both points need $y$-coordinate $-2$."], why: "A horizontal line through $-2$ on the $y$-axis." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kay graphs $x = 4$ as a horizontal line through 4 on the $y$-axis. What is wrong?",
        options: [{ t: "Every point of $x = 4$ has $x$-coordinate 4, so the line is vertical, through 4 on the $x$-axis." },
                  { t: "The line should slant.", fb: "$x$ never changes, so the line goes straight up and down." },
                  { t: "Nothing. It is right.", fb: "She has drawn $y = 4$." }],
        answer: 0, skill: "Horizontal and vertical lines", hints: ["Name two points with $x = 4$."], why: "$(4, 0)$ and $(4, 3)$ are on it: a vertical line." },
      { type: "choice", kicker: "Use it", prompt: "A taxi ride of $x$ miles costs $y = 2x + 3$ dollars. Which point on the graph shows a 4-mile ride?",
        options: [{ t: "$(4, 11)$" }, { t: "$(11, 4)$", fb: "The miles, $x$, come first." }, { t: "$(4, 8)$", fb: "Add the 3 as well: $2(4) + 3$." }],
        answer: 0, skill: "Read a graph", hints: ["$x = 4$."], why: "$2(4) + 3 = 11$ dollars." }
    ]
  });
  /* ======================================================= 11.3 · Graphing with intercepts */
  var HOW_11_3 = [["x-intercept", "Let $y = 0$ and solve for $x$."],
                  ["y-intercept", "Let $x = 0$ and solve for $y$."],
                  ["Third", "Find a third point as a check."],
                  ["Draw", "Plot the points and draw the line."]];
  LESSONS.push({
    title: "Graphing with intercepts",
    blurb: "Book 11.3 · Reading intercepts from a graph, finding them from an equation, and choosing a method to graph a line.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Where does this line cross the $y$-axis?",
        scene: graph([-6, 6], [-6, 6], [{ f: "-x + 3", color: "blue" }]),
        options: [{ t: "$(0, 3)$" }, { t: "$(3, 0)$", fb: "That is where it crosses the $x$-axis." }, { t: "$(0, 0)$", fb: "The line does not pass through the origin." }],
        answer: 0, skill: "Read intercepts", hints: ["The $y$-axis is the vertical one."], why: "It crosses the $y$-axis 3 up: $(0, 3)$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **intercepts** are where a line crosses the axes. On the $x$-axis, $y$ is 0. On the $y$-axis, $x$ is 0. So each intercept is found by putting 0 in for the other variable. They are often the two quickest points on a line.",
        scene: { type: "method", how: HOW_11_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $2x + y = 6$ graphed from its intercepts.",
        scene: { type: "walk", how: HOW_11_3, rows: [
          { step: 1, m: "2x + 0 = 6", say: "Let $y = 0$." },
          { step: 1, m: "(3, 0)", say: "$x = 3$: the $x$-intercept." },
          { step: 2, m: "2(0) + y = 6", say: "Let $x = 0$.",
            ask: { prompt: "On the $y$-axis, which coordinate is 0?", answer: 0,
                   options: [{ t: "$x$" }, { t: "$y$", fb: "$y$ is 0 on the $x$-axis. On the $y$-axis you have not moved across at all." }] } },
          { step: 2, m: "(0, 6)", say: "$y = 6$: the $y$-intercept." },
          { step: 3, m: "(1, 4)", say: "A third point: $x = 1$ gives $2 + y = 6$." },
          { step: 4, m: "2x + y = 6", say: "The three points line up.",
            fig: grid("The line 2x + y = 6 through its intercepts (3, 0) and (0, 6), and the point (1, 4).", [{ line: [[0, 6], [3, 0]], c: "blue" }, { pt: [3, 0], name: "(3, 0)", at: "ne" }, { pt: [0, 6], name: "(0, 6)", at: "e" }, { pt: [1, 4], name: "(1, 4)", at: "e" }], { x: [-3, 6], y: [-2, 8] }) }] },
        gate: true, then: "Zeros make the arithmetic easy, which is why intercepts are quick." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find three points on $x - 2y = 4$.",
        how: HOW_11_3, skill: "Find intercepts",
        steps: [
          { step: 1, ask: "Let $y = 0$. What is $x$?", type: "num", answer: 4, hint: "$x - 0 = 4$.",
            m: "(4, 0)", say: "The $x$-intercept." },
          { step: 2, ask: "Let $x = 0$, so that $-2y = 4$. What is $y$?", type: "num", answer: -2, near: [{ v: 2, fb: "Different signs give a negative quotient." }], hint: "$4 \\div (-2)$.",
            m: "(0, -2)", say: "The $y$-intercept." },
          { step: 3, ask: "A third point: let $x = 2$, so that $2 - 2y = 4$. What is $y$?", type: "num", answer: -1, near: [{ v: 1, fb: "$-2y = 2$, so $y$ is negative." }], hint: "$-2y = 2$.",
            m: "(2, -1)", say: "A check point." },
          { step: 4, ask: "Do $(4, 0)$, $(0, -2)$ and $(2, -1)$ line up?", type: "choice", answer: 0,
            options: [{ t: "Yes: $(2, -1)$ is half-way between the other two" }, { t: "No", fb: "From $(0, -2)$, 2 right and 1 up reaches $(2, -1)$. The same again reaches $(4, 0)$." }],
            m: "x - 2y = 4", say: "The line through them is the graph." }],
        why: "Two intercepts, a third point, then draw. Now two on your own." },
      { type: "plane", kicker: "On your own", prompt: "Graph $3x + 2y = 6$ from its intercepts. Drag $A$ to the $x$-intercept and $B$ to the $y$-intercept.",
        x: [-6, 6], y: [-6, 6],
        points: [{ id: "A", x: -3, y: 2, drag: true, label: "A" }, { id: "B", x: 3, y: -2, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) {
          var a = st.pt("A"), b = st.pt("B");
          if (a.x === 2 && a.y === 0 && b.x === 0 && b.y === 3) return { ok: true };
          return { ok: false, say: onLine(st, "A", "B", -1.5, 3) ? "Those points are on the line. Now put $A$ on the $x$-axis and $B$ on the $y$-axis." : "Let $y = 0$ to find $A$: $3x = 6$. Let $x = 0$ to find $B$: $2y = 6$." };
        },
        answer: { points: { A: [2, 0], B: [0, 3] } }, skill: "Graph with intercepts",
        hints: ["$3x = 6$ gives $A$. $2y = 6$ gives $B$."], why: "The intercepts are $(2, 0)$ and $(0, 3)$." },
      { type: "pair", prompt: "Find the $x$-intercept of $4x - 3y = 12$. Type it as a point $(x, y)$.",
        answer: [3, 0], skill: "Find intercepts",
        near: [{ v: [0, -4], fb: "That is the $y$-intercept. For the $x$-intercept, let $y = 0$." }, { v: [0, 3], fb: "The $x$-intercept is on the $x$-axis, so its $y$ is 0. Write $x$ first." }],
        hints: ["Let $y = 0$: $4x = 12$."], why: "$x = 3$, so the point is $(3, 0)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Three ways to graph a line. The form of the equation tells you which is quickest.",
        scene: { type: "walk", how: [["One letter", "Only one variable: a vertical or a horizontal line."],
                                    ["y alone", "With $y$ alone on one side: plot points."],
                                    ["Standard", "With both variables on one side: use the intercepts."]], rows: [
          { step: 1, m: "y = 5 \\to \\text{horizontal line}", say: "No $x$ at all." },
          { step: 2, m: "y = -3x + 4 \\to \\text{plot points}", say: "Choosing $x$ gives $y$ straight away." },
          { step: 3, m: "2x - 5y = 10 \\to \\text{intercepts}", say: "Putting in 0 clears a term each time." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "Which method is quickest for each equation?",
        bins: ["Vertical or horizontal", "Plot points", "Intercepts"],
        cards: [{ t: "$x = 7$", bin: 0, fb: "Only one variable: a vertical line." }, { t: "$y = 2x - 5$", bin: 1, fb: "$y$ is alone: choose $x$ and work out $y$." },
                { t: "$3x + 4y = 12$", bin: 2, fb: "Both variables on one side: use 0 for each in turn." }, { t: "$y = -1$", bin: 0, fb: "Only one variable: a horizontal line." },
                { t: "$x - y = 6$", bin: 2, fb: "Both variables on one side: use 0 for each in turn." }],
        skill: "Choose a method", hints: ["Look at which variables appear, and where."],
        why: "The form of the equation picks the method." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $5x + 2y = 10$, Ali says the $x$-intercept is $(0, 5)$. What is wrong?",
        options: [{ t: "$(0, 5)$ is the $y$-intercept. For the $x$-intercept let $y = 0$: $5x = 10$, so it is $(2, 0)$." },
                  { t: "It should be $(5, 0)$.", fb: "$5(5) + 0 = 25$, not 10." },
                  { t: "Nothing. It is right.", fb: "A point on the $x$-axis has $y = 0$." }],
        answer: 0, skill: "Find intercepts", hints: ["Which coordinate is 0 on the $x$-axis?"], why: "$5x = 10$ gives $(2, 0)$." },
      { type: "choice", kicker: "Use it", prompt: "A phone card has $y = 40 - 5x$ dollars of credit left after $x$ weeks. Its graph has $x$-intercept $(8, 0)$. What does that mean?",
        options: [{ t: "After 8 weeks the credit is used up" }, { t: "The card starts with 8 dollars", fb: "The starting credit is the $y$-intercept: 40 dollars." }, { t: "The credit falls by 8 dollars a week", fb: "It falls by 5 dollars a week." }],
        answer: 0, skill: "Read intercepts", hints: ["At the $x$-intercept, $y = 0$."], why: "$y = 0$ when $x = 8$: nothing is left after 8 weeks." }
    ]
  });

  /* ====================================================== 11.4 · Understand slope of a line */
  var HOW_11_4 = [["Points", "Pick two points on the line with whole-number coordinates."],
                  ["Rise", "Find the rise: the change in $y$ from the first point to the second. Down is negative."],
                  ["Run", "Find the run: the change in $x$."],
                  ["Ratio", "Slope is rise over run. Simplify."]];
  LESSONS.push({
    title: "Understand slope of a line",
    blurb: "Book 11.4 · Slope as rise over run, the slopes of horizontal and vertical lines, and graphing from a point and a slope.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which ramp is steeper?",
        options: [{ t: "One that rises 3 feet for every 4 feet along" }, { t: "One that rises 1 foot for every 4 feet along", fb: "Over the same distance, it gains less height." }],
        answer: 0, skill: "Slope", hints: ["Same distance along. Which gains more height?"], why: "More rise over the same run is steeper." },
      { type: "learn", kicker: "The idea",
        prompt: "**Slope** measures steepness: $m = \\frac{\\text{rise}}{\\text{run}}$, how far a line goes up for each step to the right. Rising lines have positive slope, and falling lines negative. A horizontal line has slope 0. A vertical line has no slope: its slope is undefined.",
        scene: { type: "method", how: HOW_11_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the slope of the line through $(1, 1)$ and $(4, 3)$ found.",
        scene: { type: "walk", how: HOW_11_4, rows: [
          { step: 1, m: "(1, 1) \\quad (4, 3)", say: "Two points with whole-number coordinates.",
            fig: grid("A line through the points (1, 1) and (4, 3).", [{ line: [[1, 1], [4, 3]], c: "blue" }, { pt: [1, 1], name: "(1, 1)", at: "s" }, { pt: [4, 3], name: "(4, 3)", at: "n" }], { x: [-1, 6], y: [-1, 5] }) },
          { step: 2, m: "3 - 1 = 2", say: "The rise: from height 1 up to height 3.",
            fig: grid("The same line, with the move from (1, 1) to (4, 3) drawn as 3 across and 2 up.", [{ line: [[1, 1], [4, 3]], c: "blue" }, { steps: [[1, 1], [4, 3]], c: "orange" }, { pt: [1, 1] }, { pt: [4, 3] }], { x: [-1, 6], y: [-1, 5] }),
            ask: { prompt: "From $(1, 1)$ to $(4, 3)$, how far up does the line go?", answer: 0,
                   options: [{ t: "2" }, { t: "3", fb: "3 is how far across. Up, it goes from 1 to 3." }] } },
          { step: 3, m: "4 - 1 = 3", say: "The run: from 1 across to 4." },
          { step: 4, m: "m = \\frac{2}{3}", say: "Rise over run: up 2 for every 3 across." }] },
        gate: true, then: "Any two points of the line give the same slope." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the slope of the line through $(-2, 5)$ and $(2, -3)$.",
        how: HOW_11_4, skill: "Slope from two points",
        steps: [
          { step: 1, ask: "Going from $(-2, 5)$ to $(2, -3)$, does the line rise or fall?", type: "choice", answer: 0,
            options: [{ t: "It falls: $y$ goes from 5 down to $-3$" }, { t: "It rises", fb: "$y$ goes from 5 to $-3$: down." }],
            m: "(-2, 5) \\quad (2, -3)", say: "A falling line: expect a negative slope." },
          { step: 2, ask: "The rise is the second $y$ minus the first: $-3 - 5$.", type: "num", answer: -8, near: [{ v: 8, fb: "It falls, so the rise is negative." }, { v: 2, fb: "$-3 - 5$ is $-3 + (-5)$." }], hint: "$-3 + (-5)$.",
            m: "-3 - 5 = -8", say: "Down 8." },
          { step: 3, ask: "The run is the second $x$ minus the first: $2 - (-2)$.", type: "num", answer: 4, near: [{ v: 0, fb: "Subtracting $-2$ adds 2." }], hint: "$2 + 2$.",
            m: "2 - (-2) = 4", say: "4 to the right." },
          { step: 4, ask: "Slope: what is $\\frac{-8}{4}$?", type: "num", answer: -2, near: [{ v: 2, fb: "Different signs give a negative quotient." }, { v: -0.5, tol: 1e-9, fb: "Rise over run, not run over rise." }], hint: "$-8 \\div 4$.",
            m: "m = \\frac{-8}{4} = -2", say: "Down 2 for every 1 across." }],
        why: "Points, rise, run, ratio. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the slope of the line through $(1, 2)$ and $(3, 8)$.", answer: 3, skill: "Slope from two points",
        near: [{ v: 1 / 3, tol: 1e-9, fb: "Rise over run, not run over rise." }, { v: 6, fb: "That is the rise. Divide by the run, 2." }],
        hints: ["$\\frac{8 - 2}{3 - 1}$."], why: "$\\frac{6}{2} = 3$." },
      { type: "slots", prompt: "Match each line to its slope.",
        slots: [{ id: "p", label: "Positive" }, { id: "n", label: "Negative" }, { id: "z", label: "Zero" }, { id: "u", label: "No slope" }],
        cards: [{ t: "Rises to the right", slot: "p", fb: "A positive rise for a positive run." },
                { t: "Falls to the right", slot: "n", fb: "The rise is negative." },
                { t: "Horizontal", slot: "z", fb: "The rise is 0, and $\\frac{0}{\\text{run}} = 0$." },
                { t: "Vertical", slot: "u", fb: "The run is 0, and nothing can be divided by 0." }],
        skill: "Kinds of slope", hints: ["Think about the rise and the run of each."],
        why: "Zero rise gives slope 0. Zero run gives no slope at all." },
      { type: "learn", kicker: "A harder case",
        prompt: "A point and a slope are enough to draw a line. Graph the line through $(1, -1)$ with slope $\\frac{3}{4}$.",
        scene: { type: "walk", how: [["Plot", "Plot the given point."],
                                    ["Count", "From it, count the rise and the run to mark a second point."],
                                    ["Draw", "Draw the line through the two points."]], rows: [
          { step: 1, m: "(1, -1)", say: "The starting point.",
            fig: grid("The point (1, −1) on a grid.", [{ pt: [1, -1], name: "(1, −1)", at: "s" }], { x: [-2, 7], y: [-3, 4] }) },
          { step: 2, m: "\\text{rise } 3 \\quad \\text{run } 4", say: "Slope $\\frac{3}{4}$: up 3 for every 4 to the right.",
            fig: grid("From (1, −1), a move of 4 across and 3 up reaches (5, 2).", [{ steps: [[1, -1], [5, 2]], c: "orange" }, { pt: [1, -1] }, { pt: [5, 2], name: "(5, 2)", at: "n" }], { x: [-2, 7], y: [-3, 4] }) },
          { step: 2, m: "(5, 2)", say: "$1 + 4 = 5$ across, and $-1 + 3 = 2$ up." },
          { step: 3, m: "m = \\frac{3}{4}", say: "The line through the two points.",
            fig: grid("The line through (1, −1) and (5, 2), with slope three quarters.", [{ line: [[1, -1], [5, 2]], c: "blue" }, { pt: [1, -1] }, { pt: [5, 2] }], { x: [-2, 7], y: [-3, 4] }) }] },
        gate: true },
      { type: "plane", kicker: "Try it", prompt: "Graph the line through $(0, 2)$ with slope $-\\frac{1}{2}$. Drag $A$ and $B$ onto two of its points.",
        x: [-6, 6], y: [-6, 6],
        points: [{ id: "A", x: -3, y: -2, drag: true, label: "A" }, { id: "B", x: 3, y: 3, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        check: function (st) { return onLine(st, "A", "B", -0.5, 2) ? { ok: true } : { ok: false, say: "Start at $(0, 2)$. A slope of $-\\frac{1}{2}$ means down 1 for every 2 to the right." }; },
        answer: { points: { A: [0, 2], B: [2, 1] } }, skill: "Graph from a point and a slope",
        hints: ["From $(0, 2)$ go 2 right and 1 down."], why: "$(0, 2)$, then $(2, 1)$, then $(4, 0)$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "The slope of the line through $(1, 2)$ and $(3, 6)$. Tap the line where the work **first** goes wrong.",
        lines: ["(1, 2) \\quad (3, 6)", "m = \\frac{3 - 1}{6 - 2}", "m = \\frac{1}{2}"], answer: 1, fix: "m = \\frac{6 - 2}{3 - 1}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Slope from two points",
        hints: ["Which change goes on top?"],
        why: "The rise, the change in $y$, goes on top: $\\frac{4}{2} = 2$." },
      { type: "num", kicker: "Use it", prompt: "A wheelchair ramp rises 1 foot over a run of 12 feet. What is its slope? (Type a fraction like 2/3.)", answer: 1 / 12, tol: 1e-9, shown: "1/12", skill: "Slope",
        near: [{ v: 12, fb: "Rise over run: the rise, 1, goes on top." }],
        hints: ["$\\frac{\\text{rise}}{\\text{run}}$."], why: "$\\frac{1}{12}$." }
    ]
  });
  /* ================================================================ Skills */
  function pt(x, y) { return "(" + x + ", " + y + ")"; }
  var SKILLS = [
    { id: "pa11-plot", title: "Plot a point", lesson: 2,
      gen: function (R) {
        var x = R.int(-5, 5), y = R.int(-5, 5);
        if (x === y) y = y < 5 ? y + 1 : y - 1;
        return { type: "plane", prompt: "Click the point $" + pt(x, y) + "$.", x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [x, y] },
          hints: [(x < 0 ? Math.abs(x) + " to the left" : x + " to the right") + ", then " + (y < 0 ? Math.abs(y) + " down." : y + " up.")],
          why: "The first number is $x$, across. The second is $y$, up or down." };
      } },
    { id: "pa11-solution", title: "Find a solution of an equation", lesson: 2,
      gen: function (R) {
        var m = R.int(2, 5) * R.pick([1, -1]), b = R.int(1, 9) * R.pick([1, -1]), x = R.int(-3, 4), y = m * x + b, eq = "y = " + poly([[m, "x"], [b, ""]]);
        if (R.chance(0.5)) return { type: "num", prompt: "Complete the solution of $" + eq + "$: when $x = " + x + "$, what is $y$?", pre: "$y =$", answer: y,
          near: near(y, [{ v: m + x + b, fb: "$" + m + "x$ means " + m + " times $x$." }, { v: -m * x + b, fb: "Check the sign of $" + m + "(" + x + ")$." }]),
          hints: ["$" + m + "(" + x + ") " + (b < 0 ? "- " + (-b) : "+ " + b) + "$."], why: "$" + m * x + (b < 0 ? " - " + (-b) : " + " + b) + " = " + y + "$." };
        var bad = y + R.pick([1, -1, 2]);
        return mc(R, { prompt: "Which ordered pair is a solution of $" + eq + "$?", right: "$" + pt(x, y) + "$",
          wrong: [{ t: "$" + pt(y, x) + "$", fb: "The $x$-value comes first." }, { t: "$" + pt(x, bad) + "$", fb: "With $x = " + x + "$, $y$ is $" + y + "$." }].filter(function (w) { return w.t !== "$" + pt(x, y) + "$"; }),
          hints: ["Put each $x$ into the equation and compare with the $y$."], why: "With $x = " + x + "$: $y = " + y + "$." });
      } },
    { id: "pa11-graph", title: "Find a point of a graph", lesson: 3,
      gen: function (R) {
        var m = R.pick([-2, -1, 1, 2]), b = R.int(-2, 2), x = R.int(-2, 2), y = m * x + b, eq = "y = " + poly([[m, "x"], [b, ""]]);
        return { type: "plane", prompt: "Click the point of the graph of $" + eq + "$ that has $x = " + x + "$.", x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [x, y] },
          hints: ["Work out $y$ when $x = " + x + "$."], why: "When $x = " + x + "$, $y = " + y + "$: the point $" + pt(x, y) + "$." };
      } },
    { id: "pa11-intercepts", title: "Find the intercepts", lesson: 4,
      gen: function (R) {
        var p = R.int(1, 6) * R.pick([1, -1]), q = R.int(1, 6) * R.pick([1, -1]), k = R.int(1, 3), a = k * q, b = k * p, c = k * p * q, wantX = R.chance(0.5);
        var eq = poly([[a, "x"], [0, ""]]) + (b < 0 ? " - " + poly([[-b, "y"], [0, ""]]) : " + " + poly([[b, "y"], [0, ""]])) + " = " + c;
        return { type: "pair", prompt: "Find the $" + (wantX ? "x" : "y") + "$-intercept of $" + eq + "$. Type it as a point $(x, y)$.", answer: wantX ? [p, 0] : [0, q],
          near: [{ v: wantX ? [0, q] : [p, 0], fb: "That is the other intercept. For the $" + (wantX ? "x" : "y") + "$-intercept, let $" + (wantX ? "y" : "x") + " = 0$." },
                 { v: wantX ? [0, p] : [q, 0], fb: "Write $x$ first: the $" + (wantX ? "x" : "y") + "$-intercept is on the $" + (wantX ? "x" : "y") + "$-axis." }],
          hints: ["Let $" + (wantX ? "y" : "x") + " = 0$: $" + (wantX ? poly([[a, "x"], [0, ""]]) : poly([[b, "y"], [0, ""]])) + " = " + c + "$."],
          why: "$" + (wantX ? "x = " + p : "y = " + q) + "$, so the point is $" + (wantX ? pt(p, 0) : pt(0, q)) + "$." };
      } },
    { id: "pa11-slope", title: "Find the slope of a line", lesson: 5,
      gen: function (R) {
        var x1 = R.int(-4, 3), y1 = R.int(-5, 5), run = R.int(1, 4), m = R.pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5, 1.5]), rise;
        if (m % 1 !== 0) run = 2 * R.int(1, 2);
        rise = m * run;
        var x2 = x1 + run, y2 = y1 + rise;
        return { type: "num", prompt: "Find the slope of the line through $" + pt(x1, y1) + "$ and $" + pt(x2, y2) + "$." + (m % 1 !== 0 ? " (Type a fraction like 2/3.)" : ""), answer: m, tol: 1e-9, shown: L.fracText(rise, run),
          near: near(m, [{ v: 1 / m, tol: 1e-9, fb: "Rise over run: the change in $y$ goes on top." }, { v: -m, tol: 1e-9, fb: "Check the signs: the rise is $" + y2 + " - " + (y1 < 0 ? "(" + y1 + ")" : y1) + " = " + rise + "$." }]),
          hints: ["$\\frac{" + y2 + " - " + (y1 < 0 ? "(" + y1 + ")" : y1) + "}{" + x2 + " - " + (x1 < 0 ? "(" + x1 + ")" : x1) + "}$."], why: "$\\frac{" + rise + "}{" + run + "} = " + frac(rise, run) + "$." };
      } }
  ];
  L.unit("prealg", 11, {
    title: "Graphs",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Plotting points, solutions in two variables, and points of a graph.",
        skills: ["pa11-plot", "pa11-solution", "pa11-graph"], per: 2 },
      { title: "Quiz 2", after: 5, blurb: "Intercepts and slope.",
        skills: ["pa11-intercepts", "pa11-slope"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:11", {
    2: { name: "Ordered pairs", frame: "In $(x, y)$ the first number says how far [[across]] and the second how far [[up or down]]. A pair is a [[solution]] of an equation if it makes the equation true.",
         chips: ["around", "factor"] },
    3: { name: "The graph of a line", frame: "The graph of a linear equation is a straight [[line]]: every point on it is a [[solution]]. $x = a$ is a [[vertical]] line, and $y = b$ is a [[horizontal]] one.",
         chips: ["curve", "slanted"] },
    4: { name: "Intercepts", frame: "The $x$-intercept is found by letting [[y]] be 0, and the $y$-intercept by letting [[x]] be 0. Two intercepts and a [[third]] point as a check are enough to draw the line.",
         chips: ["m", "tenth"] },
    5: { name: "Slope", frame: "Slope is [[rise]] over [[run]]. A line that falls to the right has a [[negative]] slope, a horizontal line has slope [[0]], and a vertical line has no slope.",
         chips: ["1", "length"] }
  });
})();
