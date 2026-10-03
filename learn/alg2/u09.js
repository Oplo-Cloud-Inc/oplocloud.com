/* ==========================================================================
   Algebra II — Unit 9: Quadratic Equations and Functions. See lab/core.js
   for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 9, section for section:
   the readiness check, then 9.1 to 9.8. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   Three ways to solve any quadratic equation (9.1–9.3), equations that are
   quadratic in disguise (9.4), what quadratics model (9.5), the parabola
   from its properties and from transformations (9.6–9.7), and quadratic
   inequalities (9.8).

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Nine lessons, eight skills, two quizzes, and the unit test.
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
    blurb: "Book: Chapter 9 Be Prepared · Simplify a radical, factor a trinomial, and evaluate with care for signs.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Radicals", prompt: "What is $\\sqrt{49}$?", answer: 7, skill: "Square roots",
        near: [{ v: 24.5, tol: 1e-9, fb: "A square root is not half." }], hints: ["Which number times itself is 49?"], why: "$7 \\cdot 7 = 49$." },
      { type: "num", prompt: "$$\\sqrt{50} = \\square\\sqrt{2}$$ What goes in the box?", answer: 5, skill: "Simplify radicals",
        near: [{ v: 25, fb: "25 is the perfect square inside. Its root comes out." }], hints: ["$50 = 25 \\cdot 2$."], why: "$\\sqrt{25} \\cdot \\sqrt{2} = 5\\sqrt{2}$." },
      { type: "choice", kicker: "Check 2 · Factoring", prompt: "Factor $x^2 - 5x + 6$.",
        options: [{ t: "$(x - 2)(x - 3)$" }, { t: "$(x + 2)(x + 3)$", fb: "That gives $+5x$ in the middle." }, { t: "$(x - 1)(x - 6)$", fb: "$-1 - 6 = -7$, not $-5$." }],
        answer: 0, skill: "Factor a trinomial", hints: ["Two numbers that multiply to 6 and add to $-5$."], why: "$-2 \\cdot (-3) = 6$ and $-2 - 3 = -5$." },
      { type: "choice", prompt: "Expand $(x + 3)^2$.",
        options: [{ t: "$x^2 + 6x + 9$" }, { t: "$x^2 + 9$", fb: "There is a middle term: $3x + 3x$." }],
        answer: 0, skill: "Special products", hints: ["$(x + 3)(x + 3)$."], why: "$x^2 + 3x + 3x + 9$." },
      { type: "num", kicker: "Check 3 · Signs", prompt: "Evaluate $b^2 - 4ac$ when $a = 1$, $b = -3$ and $c = -4$.", answer: 25, skill: "Evaluate an expression",
        near: [{ v: -7, fb: "$(-3)^2 = 9$, and $-4(1)(-4) = +16$." }, { v: 7, fb: "$(-3)^2 = +9$, and $-4(1)(-4) = +16$." }],
        hints: ["$(-3)^2 - 4(1)(-4)$."], why: "$9 + 16 = 25$." },
      { type: "num", prompt: "For $f(x) = x^2 - 4x + 3$, find $f(2)$.", pre: "$f(2) =$", answer: -1, skill: "Evaluate a function",
        near: [{ v: 15, fb: "$-4(2) = -8$: subtract it." }], hints: ["$4 - 8 + 3$."], why: "$4 - 8 + 3 = -1$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 9.1**. If **check 1** slipped, see lesson 8.2. If **check 2** slipped, see lessons 6.2 and 5.3. If **check 3** slipped, see lessons 1.2 and 3.5.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ============ 9.1 · Solve quadratic equations using the Square Root Property */
  var HOW_9_1 = [["Isolate", "Isolate the squared term, and make its coefficient 1."],
                 ["Root", "Use the Square Root Property: if $x^2 = k$, then $x = \\pm\\sqrt{k}$."],
                 ["Simplify", "Simplify the radical."],
                 ["Check", "Check both solutions."]];
  LESSONS.push({
    title: "The Square Root Property",
    blurb: "Book 9.1 · Solving “a square equals a number” by taking square roots.",
    mins: 12, v: 1,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "Solve $x^2 = 49$. Give both solutions.", answer: [-7, 7], skill: "Square Root Property", placeholder: "e.g. −3, 3",
        hints: ["Two numbers square to 49."], why: "$7^2 = 49$ and $(-7)^2 = 49$." },
      { type: "learn", kicker: "The idea",
        prompt: "If $x^2 = k$, then $x = \\sqrt{k}$ or $x = -\\sqrt{k}$. That is the **Square Root Property**, and it solves any equation of the form “a square equals a number”, whether or not it factors.",
        scene: { type: "method", how: HOW_9_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$3x^2 - 54 = 0$$",
        scene: { type: "walk", how: HOW_9_1, rows: [
          { step: 1, m: "3x^2 - 54 = 0", say: "Get $x^2$ alone." },
          { step: 1, m: "x^2 = 18", say: "Add 54, then divide by 3." },
          { step: 2, m: "x = \\pm\\sqrt{18}", say: "The Square Root Property: both roots.",
            ask: { prompt: "How many solutions does $x^2 = 18$ have?", answer: 0,
                   options: [{ t: "Two: $\\sqrt{18}$ and $-\\sqrt{18}$" }, { t: "One: $\\sqrt{18}$", fb: "$(-\\sqrt{18})^2$ is 18 as well." }] } },
          { step: 3, m: "x = \\pm 3\\sqrt{2}", say: "$18 = 9 \\cdot 2$." },
          { step: 4, m: "3 \\cdot 18 - 54 = 0", say: "Either way $x^2 = 18$, and $54 - 54 = 0$. ✓" }] },
        gate: true, then: "The symbol $\\pm$ packs two solutions into one line." },
      { type: "guided", kicker: "Together",
        prompt: "Now with a binomial squared. $$(x - 3)^2 = 16$$",
        how: HOW_9_1, skill: "Square Root Property",
        steps: [
          { step: 1, ask: "Is the squared part already alone on one side?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "No", fb: "The left side is a square and nothing else." }],
            m: "(x - 3)^2 = 16", say: "A square equal to a number." },
          { step: 2, ask: "Use the Square Root Property.", type: "choice", answer: 0,
            options: [{ t: "$x - 3 = \\pm 4$" }, { t: "$x - 3 = 4$", fb: "Both roots: $-4$ squares to 16 too." }, { t: "$x - 3 = \\pm 8$", fb: "$\\sqrt{16} = 4$, not 8." }],
            m: "x - 3 = \\pm 4", say: "$\\sqrt{16} = 4$, already simplified." },
          { step: 3, ask: "Add 3 in each case: $3 + 4$ and $3 - 4$.", type: "choice", answer: 0,
            options: [{ t: "$x = 7$ or $x = -1$" }, { t: "$x = 7$ or $x = -7$", fb: "$3 - 4 = -1$." }],
            m: "x = 7 \\quad\\text{or}\\quad x = -1", say: "Two solutions." },
          { step: 4, ask: "Check $x = -1$: what is $(-1 - 3)^2$?", type: "num", answer: 16, near: [{ v: -16, fb: "A square is positive: $(-4)^2 = 16$." }], hint: "$(-4)^2$.",
            m: "(-4)^2 = 16 \\quad 4^2 = 16", say: "Both check. ✓" }],
        why: "Isolate, root, simplify, check. Now two on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $x^2 - 25 = 0$.", answer: [-5, 5], skill: "Square Root Property", placeholder: "e.g. −3, 3",
        hints: ["$x^2 = 25$."], why: "$x = \\pm 5$." },
      { type: "numbers", prompt: "Solve $(x + 2)^2 = 9$.", answer: [1, -5], skill: "Square Root Property", placeholder: "e.g. −3, 3",
        hints: ["$x + 2 = 3$ or $x + 2 = -3$."], why: "$x = 1$ or $x = -5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the number is negative, the solutions are complex. $$x^2 + 72 = 0$$",
        scene: { type: "walk", how: HOW_9_1, rows: [
          { step: 1, m: "x^2 = -72", say: "Subtract 72." },
          { step: 2, m: "x = \\pm\\sqrt{-72}", say: "The property still applies." },
          { step: 3, m: "x = \\pm 6\\sqrt{2}\\,i", say: "$\\sqrt{-72} = \\sqrt{72}\\,i$, and $72 = 36 \\cdot 2$. Two complex solutions." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Solve $2x^2 = 50$.",
        options: [{ t: "$x = \\pm 5$" }, { t: "$x = 5$", fb: "$-5$ is a solution too." }, { t: "$x = \\pm 25$", fb: "$x^2 = 25$. Now take the square root." }],
        answer: 0, skill: "Square Root Property", hints: ["Divide by 2 first."], why: "$x^2 = 25$, so $x = \\pm 5$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the solving **first** goes wrong.",
        lines: ["(x + 5)^2 = 9", "x + 5 = 3", "x = -2"], answer: 1, fix: "x + 5 = \\pm 3",
        fb: { 0: GIVEN, 2: LATER }, skill: "Square Root Property",
        hints: ["How many numbers square to 9?"],
        why: "Both roots are needed: $x + 5 = \\pm 3$, so $x = -2$ or $x = -8$." },
      { type: "num", kicker: "Use it", prompt: "An object falls $16t^2$ feet in $t$ seconds. How long does it take to fall **144 feet**?",
        post: "seconds", answer: 3, skill: "Square Root Property",
        near: [{ v: -3, fb: "$t = -3$ solves the equation, but time is not negative." }, { v: 9, fb: "$t^2 = 9$. Take the square root." }],
        hints: ["$16t^2 = 144$."], why: "$t^2 = 9$, so $t = 3$ (the negative root makes no sense here)." }
    ]
  });

  /* =========== 9.2 · Solve quadratic equations by completing the square */
  var HOW_9_2 = [["Isolate", "Put the variable terms on one side and the constant on the other."],
                 ["Half, square", "Take half of $b$, square it, and add the result to both sides."],
                 ["Factor", "Factor the left side as a binomial squared."],
                 ["Root", "Use the Square Root Property."],
                 ["Solve", "Solve the two equations, and check."]];
  LESSONS.push({
    title: "Completing the square",
    blurb: "Book 9.2 · Making a perfect square trinomial, and using it to solve any quadratic equation.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Expand $(x + 4)^2$.",
        options: [{ t: "$x^2 + 8x + 16$" }, { t: "$x^2 + 16$", fb: "There is a middle term: $4x + 4x$." }, { t: "$x^2 + 4x + 16$", fb: "The middle term is twice $4x$." }],
        answer: 0, skill: "Special products", hints: ["$(x + 4)(x + 4)$."], why: "$x^2 + 8x + 16$: the middle is twice 4, and the last is 4 squared." },
      { type: "learn", kicker: "Explore", prompt: "Here is $x^2 + 6x$ in tiles, arranged as nearly a square. **Add unit tiles until the square is complete.** How many does it take?",
        scene: { type: "tiles", mode: "square", b: 6, gate: true }, gate: true,
        then: "Nine. The six $x$-tiles split into two strips of 3, leaving a 3-by-3 corner: $x^2 + 6x + 9 = (x + 3)^2$." },
      { type: "learn", kicker: "The idea",
        prompt: "Most quadratics are not perfect squares, but you can **make** one: add the square of half the $x$-coefficient. In an equation, add it to both sides. Then the Square Root Property finishes the job.",
        scene: { type: "method", how: HOW_9_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one that does not factor. $$x^2 + 6x - 5 = 0$$",
        scene: { type: "walk", how: HOW_9_2, rows: [
          { step: 1, m: "x^2 + 6x - 5 = 0", say: "Move the constant to the right." },
          { step: 1, m: "x^2 + 6x = 5", say: "Add 5 to both sides." },
          { step: 2, m: "x^2 + 6x + 9 = 5 + 9", say: "Half of 6 is 3, and $3^2 = 9$.",
            ask: { prompt: "Half of 6 is 3. What is added to both sides?", answer: 0,
                   options: [{ t: "$3^2 = 9$" }, { t: "$3$", fb: "Square the half: $3^2$." }, { t: "$6^2 = 36$", fb: "Halve the 6 first, then square." }] } },
          { step: 3, m: "(x + 3)^2 = 14", say: "The left side is now a perfect square." },
          { step: 4, m: "x + 3 = \\pm\\sqrt{14}", say: "The Square Root Property." },
          { step: 5, m: "x = -3 \\pm \\sqrt{14}", say: "Subtract 3. Two irrational solutions." }] },
        gate: true, then: "This method works for every quadratic equation, including the ones that will not factor." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$x^2 - 10x + 9 = 0$$",
        how: HOW_9_2, skill: "Completing the square",
        steps: [
          { step: 1, ask: "Move the constant to the right side.", type: "choice", answer: 0,
            options: [{ t: "$x^2 - 10x = -9$" }, { t: "$x^2 - 10x = 9$", fb: "Subtract 9 from both sides." }],
            m: "x^2 - 10x = -9", say: "Variable terms on the left." },
          { step: 2, ask: "Half of $-10$ is $-5$. What is $(-5)^2$?", type: "num", answer: 25, near: [{ v: -25, fb: "A square is positive." }, { v: 100, fb: "Halve first: $-5$, then square." }], hint: "$(-5)(-5)$.",
            m: "x^2 - 10x + 25 = -9 + 25", say: "Add 25 to both sides." },
          { step: 3, ask: "Factor the left side, and simplify the right.", type: "choice", answer: 0,
            options: [{ t: "$(x - 5)^2 = 16$" }, { t: "$(x + 5)^2 = 16$", fb: "Half of $-10$ is $-5$: the binomial is $x - 5$." }, { t: "$(x - 5)^2 = 34$", fb: "$-9 + 25 = 16$." }],
            m: "(x - 5)^2 = 16", say: "A square equal to a number." },
          { step: 4, ask: "Use the Square Root Property.", type: "choice", answer: 0,
            options: [{ t: "$x - 5 = \\pm 4$" }, { t: "$x - 5 = 4$", fb: "Both roots are needed." }],
            m: "x - 5 = \\pm 4", say: "$\\sqrt{16} = 4$." },
          { step: 5, ask: "Solve both: $5 + 4$ and $5 - 4$.", type: "choice", answer: 0,
            options: [{ t: "$x = 9$ or $x = 1$" }, { t: "$x = 9$ or $x = -9$", fb: "$5 - 4 = 1$." }],
            m: "x = 9 \\quad\\text{or}\\quad x = 1", say: "Check: $81 - 90 + 9 = 0$ and $1 - 10 + 9 = 0$. ✓" }],
        why: "Isolate, half and square, factor, root, solve. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Which number completes the square? $$x^2 + 14x + \\square$$", answer: 49, skill: "Completing the square",
        near: [{ v: 7, fb: "Half of 14 is 7. Now square it." }, { v: 196, fb: "Halve the 14 first, then square." }],
        hints: ["Half of 14, squared."], why: "$7^2 = 49$, and $x^2 + 14x + 49 = (x + 7)^2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the leading coefficient is not 1, divide by it first. $$2x^2 + 12x - 14 = 0$$",
        scene: { type: "walk", how: HOW_9_2, rows: [
          { step: 1, m: "2x^2 + 12x - 14 = 0", say: "The coefficient of $x^2$ must be 1: divide every term by 2." },
          { step: 1, m: "x^2 + 6x = 7", say: "And move the constant across." },
          { step: 2, m: "x^2 + 6x + 9 = 16", say: "Half of 6 is 3, squared is 9. Add it to both sides." },
          { step: 3, m: "(x + 3)^2 = 16", say: "Factor." },
          { step: 4, m: "x + 3 = \\pm 4", say: "Square roots of both sides." },
          { step: 5, m: "x = 1 \\quad\\text{or}\\quad x = -7", say: "$-3 + 4$ and $-3 - 4$." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Solve by completing the square: $x^2 + 4x = 12$.", answer: [2, -6], skill: "Completing the square", placeholder: "e.g. −3, 4",
        hints: ["Add $2^2 = 4$ to both sides: $(x + 2)^2 = 16$."], why: "$x + 2 = \\pm 4$, so $x = 2$ or $x = -6$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the solving **first** goes wrong.",
        lines: ["x^2 + 8x = 9", "x^2 + 8x + 16 = 9", "(x + 4)^2 = 9", "x = -1 \\quad\\text{or}\\quad x = -7"], answer: 1, fix: "x^2 + 8x + 16 = 9 + 16",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Completing the square",
        hints: ["What was done to the left side must be done to the right."],
        why: "16 must be added to both sides: $(x + 4)^2 = 25$, so $x = 1$ or $x = -9$." },
      { type: "num", kicker: "Use it", prompt: "A rectangle's length is **6 m more than** its width, and its area is **40 m²**. Find the width.",
        post: "m", answer: 4, skill: "Completing the square",
        near: [{ v: -10, fb: "$w = -10$ solves the equation, but a width cannot be negative." }, { v: 10, fb: "That is the length. The question asks for the width." }],
        hints: ["$w^2 + 6w = 40$. Add 9 to both sides."], why: "$(w + 3)^2 = 49$, so $w + 3 = 7$ and $w = 4$." }
    ]
  });

  /* ============ 9.3 · Solve quadratic equations using the Quadratic Formula */
  var HOW_9_3 = [["Standard", "Write the equation as $ax^2 + bx + c = 0$, and identify $a$, $b$ and $c$."],
                 ["Substitute", "Put them into the formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$."],
                 ["Simplify", "Simplify under the radical first, then the rest."],
                 ["Check", "Check the solutions."]];
  LESSONS.push({
    title: "The Quadratic Formula",
    blurb: "Book 9.3 · One formula for every quadratic equation, the discriminant, and choosing a method.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Evaluate $b^2 - 4ac$ when $a = 1$, $b = 5$ and $c = 6$.", answer: 1, skill: "Discriminant",
        near: [{ v: 49, fb: "$4ac$ is subtracted: $25 - 24$." }], hints: ["$25 - 4(1)(6)$."], why: "$25 - 24 = 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "Completing the square on $ax^2 + bx + c = 0$, with letters instead of numbers, gives a formula for the solutions once and for all: the **Quadratic Formula**. Identify $a$, $b$ and $c$, substitute, and simplify.",
        scene: { type: "method", how: HOW_9_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the formula at work. $$2x^2 + 9x - 5 = 0$$",
        scene: { type: "walk", how: HOW_9_3, rows: [
          { step: 1, m: "2x^2 + 9x - 5 = 0", say: "Already in standard form." },
          { step: 1, m: "a = 2 \\quad b = 9 \\quad c = -5", say: "Each coefficient takes its sign with it." },
          { step: 2, m: "x = \\frac{-9 \\pm \\sqrt{9^2 - 4(2)(-5)}}{2(2)}", say: "Substitute into the formula." },
          { step: 3, m: "x = \\frac{-9 \\pm \\sqrt{121}}{4}", say: "Under the radical: $81 + 40$.",
            ask: { prompt: "What is $9^2 - 4(2)(-5)$?", answer: 0,
                   options: [{ t: "121" }, { t: "41", fb: "$-4(2)(-5) = +40$: two negatives." }, { t: "81", fb: "$4ac$ is not 0 here: $-4(2)(-5) = +40$." }] } },
          { step: 3, m: "x = \\frac{-9 \\pm 11}{4}", say: "$\\sqrt{121} = 11$." },
          { step: 3, m: "x = \\frac{1}{2} \\quad\\text{or}\\quad x = -5", say: "$\\frac{-9 + 11}{4}$ and $\\frac{-9 - 11}{4}$." },
          { step: 4, m: "2(-5)^2 + 9(-5) - 5 = 0", say: "$50 - 45 - 5 = 0$. ✓" }] },
        gate: true, then: "No factoring, no completing the square: only arithmetic." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$x^2 - 4x + 1 = 0$$",
        how: HOW_9_3, skill: "Quadratic Formula",
        steps: [
          { step: 1, ask: "Identify $a$, $b$ and $c$.", type: "choice", answer: 0,
            options: [{ t: "$a = 1$, $b = -4$, $c = 1$" }, { t: "$a = 1$, $b = 4$, $c = 1$", fb: "The sign belongs to the coefficient: $b = -4$." }],
            m: "a = 1 \\quad b = -4 \\quad c = 1", say: "Signs included." },
          { step: 2, ask: "Substitute into the formula. What is $-b$?", type: "choice", answer: 0,
            options: [{ t: "$4$" }, { t: "$-4$", fb: "$-b = -(-4) = 4$." }],
            m: "x = \\frac{4 \\pm \\sqrt{(-4)^2 - 4(1)(1)}}{2(1)}", say: "$-b$ is the opposite of $b$." },
          { step: 3, ask: "Under the radical: what is $16 - 4$?", type: "num", answer: 12, hint: "$16 - 4$.",
            m: "x = \\frac{4 \\pm \\sqrt{12}}{2}", say: "The discriminant is 12." },
          { step: 3, ask: "$\\sqrt{12} = 2\\sqrt{3}$. Simplify $\\frac{4 \\pm 2\\sqrt{3}}{2}$.", type: "choice", answer: 0,
            options: [{ t: "$2 \\pm \\sqrt{3}$" }, { t: "$2 \\pm 2\\sqrt{3}$", fb: "Both terms on top are divided by 2." }, { t: "$4 \\pm \\sqrt{3}$", fb: "The 4 is divided by 2 as well." }],
            m: "x = 2 \\pm \\sqrt{3}", say: "Divide each term of the numerator by 2." },
          { step: 4, ask: "A check: the two solutions should add up to $-\\frac{b}{a}$. What is their sum?", type: "num", answer: 4, hint: "$(2 + \\sqrt{3}) + (2 - \\sqrt{3})$.",
            m: "(2 + \\sqrt{3}) + (2 - \\sqrt{3}) = 4", say: "And $-\\frac{b}{a} = 4$. ✓" }],
        why: "Standard form, substitute, simplify, check. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Use the Quadratic Formula to solve $x^2 + 3x - 10 = 0$.", answer: [2, -5], skill: "Quadratic Formula", placeholder: "e.g. −3, 4",
        hints: ["$a = 1$, $b = 3$, $c = -10$. The discriminant is $9 + 40$."], why: "$x = \\frac{-3 \\pm 7}{2}$: $x = 2$ or $x = -5$." },
      { type: "sort", prompt: "The **discriminant**, $b^2 - 4ac$, tells you what kind of solutions to expect. Work it out for each equation.",
        bins: ["Two real solutions", "One real solution", "Two complex solutions"],
        cards: [{ t: "$x^2 - 5x + 4 = 0$", bin: 0, fb: "$25 - 16 = 9$: positive." },
                { t: "$x^2 + 6x + 9 = 0$", bin: 1, fb: "$36 - 36 = 0$: the $\\pm$ adds and subtracts nothing." },
                { t: "$x^2 + 2x + 5 = 0$", bin: 2, fb: "$4 - 20 = -16$: the square root of a negative." },
                { t: "$2x^2 + x + 1 = 0$", bin: 2, fb: "$1 - 8 = -7$: negative." }],
        skill: "Discriminant", hints: ["Positive, zero or negative?"],
        why: "Positive: two real solutions. Zero: one. Negative: two complex solutions." },
      { type: "learn", kicker: "A harder case",
        prompt: "A negative discriminant gives complex solutions. $$x^2 + 2x + 5 = 0$$",
        scene: { type: "walk", how: HOW_9_3, rows: [
          { step: 1, m: "a = 1 \\quad b = 2 \\quad c = 5", say: "Standard form already." },
          { step: 2, m: "x = \\frac{-2 \\pm \\sqrt{2^2 - 4(1)(5)}}{2(1)}", say: "Substitute." },
          { step: 3, m: "x = \\frac{-2 \\pm \\sqrt{-16}}{2}", say: "$4 - 20 = -16$." },
          { step: 3, m: "x = \\frac{-2 \\pm 4i}{2}", say: "$\\sqrt{-16} = 4i$." },
          { step: 3, m: "x = -1 \\pm 2i", say: "Divide both terms by 2. Two complex solutions." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "Which method is the quickest for each equation?",
        bins: ["Factoring", "Square Root Property", "Quadratic Formula"],
        cards: [{ t: "$x^2 - 5x + 6 = 0$", bin: 0, fb: "It factors at sight: $(x - 2)(x - 3)$." },
                { t: "$(x - 4)^2 = 7$", bin: 1, fb: "A square equal to a number." },
                { t: "$3x^2 + 5x - 1 = 0$", bin: 2, fb: "It does not factor, and completing the square would bring fractions." }],
        skill: "Choose a method", hints: ["Try factoring first, then the Square Root Property, then the formula."],
        why: "Factor if it is easy. Use square roots if it is already a square. Otherwise, the formula always works." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the solving of $x^2 - 6x + 4 = 0$ **first** goes wrong.",
        lines: ["a = 1 \\quad b = -6 \\quad c = 4", "x = \\frac{-6 \\pm \\sqrt{36 - 16}}{2}", "x = \\frac{-6 \\pm \\sqrt{20}}{2}", "x = -3 \\pm \\sqrt{5}"], answer: 1, fix: "x = \\frac{6 \\pm \\sqrt{36 - 16}}{2}",
        fb: { 0: "The coefficients are right.", 2: LATER, 3: LATER }, skill: "Quadratic Formula",
        hints: ["The formula starts with $-b$. What is $-b$ when $b = -6$?"],
        why: "$-b = -(-6) = 6$. The solutions are $x = 3 \\pm \\sqrt{5}$." },
      { type: "num", kicker: "Use it", prompt: "A ball's height after $t$ seconds is $h = -16t^2 + 48t$ feet. When does it **first** reach 32 feet?",
        post: "second", answer: 1, skill: "Quadratic Formula",
        near: [{ v: 2, fb: "That is when it passes 32 feet again, on the way down." }],
        hints: ["$-16t^2 + 48t = 32$. Divide by $-16$: $t^2 - 3t + 2 = 0$."], why: "$(t - 1)(t - 2) = 0$: at 1 second going up, and again at 2 seconds coming down." }
    ]
  });
  /* ========================================= 9.4 · Solve equations in quadratic form */
  var HOW_9_4 = [["Spot u", "Find a substitution $u$ that makes the equation quadratic: usually the variable part of the middle term."],
                 ["Rewrite", "Rewrite the equation in terms of $u$."],
                 ["Solve for u", "Solve the quadratic equation for $u$."],
                 ["Back", "Replace $u$ with what it stands for, and solve for the original variable."],
                 ["Check", "Check every solution in the original equation."]];
  LESSONS.push({
    title: "Equations in quadratic form",
    blurb: "Book 9.4 · A substitution that turns a harder equation into a quadratic one.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is $(x^2)^2$?",
        options: [{ t: "$x^4$" }, { t: "$x^2$", fb: "A power of a power multiplies the exponents: $2 \\cdot 2$." }, { t: "$2x^2$", fb: "Squaring multiplies the exponent by 2. It does not double the term." }],
        answer: 0, skill: "Exponent properties", hints: ["Multiply the exponents."], why: "$x^{2 \\cdot 2} = x^4$." },
      { type: "learn", kicker: "The idea",
        prompt: "$x^4 - 5x^2 + 4 = 0$ is not quadratic, but it has the same shape: the first term is the **square** of the middle term's variable part. Call that part $u$, and the equation becomes $u^2 - 5u + 4 = 0$.",
        scene: { type: "method", how: HOW_9_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the substitution. $$x^4 - 5x^2 + 4 = 0$$",
        scene: { type: "walk", how: HOW_9_4, rows: [
          { step: 1, m: "u = x^2", say: "Then $x^4 = (x^2)^2 = u^2$." },
          { step: 2, m: "u^2 - 5u + 4 = 0", say: "A quadratic equation in $u$." },
          { step: 3, m: "(u - 1)(u - 4) = 0", say: "It factors." },
          { step: 3, m: "u = 1 \\quad\\text{or}\\quad u = 4", say: "But the question asks for $x$, not $u$.",
            ask: { prompt: "$u = 1$ or $u = 4$. Is the equation solved?", answer: 0,
                   options: [{ t: "Not yet: $u$ stands for $x^2$" }, { t: "Yes: those are the solutions", fb: "They are values of $u$. The original equation is in $x$." }] } },
          { step: 4, m: "x^2 = 1 \\quad\\text{or}\\quad x^2 = 4", say: "Put $x^2$ back in place of $u$." },
          { step: 4, m: "x = \\pm 1 \\quad\\text{or}\\quad x = \\pm 2", say: "The Square Root Property, twice. Four solutions, and all four check." }] },
        gate: true, then: "A fourth-degree equation can have four solutions." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$x - 7\\sqrt{x} + 12 = 0$$",
        how: HOW_9_4, skill: "Quadratic form",
        steps: [
          { step: 1, ask: "Which substitution makes it quadratic?", type: "choice", answer: 0,
            options: [{ t: "$u = \\sqrt{x}$, because $x = (\\sqrt{x})^2$" }, { t: "$u = x$", fb: "That changes nothing. The middle term's variable part is $\\sqrt{x}$." }],
            m: "u = \\sqrt{x}", say: "Then $x = u^2$." },
          { step: 2, ask: "Rewrite the equation in terms of $u$.", type: "choice", answer: 0,
            options: [{ t: "$u^2 - 7u + 12 = 0$" }, { t: "$u - 7u^2 + 12 = 0$", fb: "$x$ is $u^2$, and $\\sqrt{x}$ is $u$." }],
            m: "u^2 - 7u + 12 = 0", say: "Quadratic in $u$." },
          { step: 3, ask: "Solve for $u$.", type: "choice", answer: 0,
            options: [{ t: "$u = 3$ or $u = 4$" }, { t: "$u = -3$ or $u = -4$", fb: "$(u - 3)(u - 4) = 0$ gives positive values." }],
            m: "u = 3 \\quad\\text{or}\\quad u = 4", say: "$(u - 3)(u - 4) = 0$." },
          { step: 4, ask: "So $\\sqrt{x} = 3$ or $\\sqrt{x} = 4$. What is $x$?", type: "choice", answer: 0,
            options: [{ t: "$x = 9$ or $x = 16$" }, { t: "$x = \\sqrt{3}$ or $x = 2$", fb: "To undo a square root, square: $3^2$ and $4^2$." }],
            m: "x = 9 \\quad\\text{or}\\quad x = 16", say: "Square both sides of each." },
          { step: 5, ask: "Check $x = 9$: what is $9 - 7(3) + 12$?", type: "num", answer: 0, hint: "$9 - 21 + 12$.",
            m: "9 - 21 + 12 = 0 \\quad 16 - 28 + 12 = 0", say: "Both check. ✓" }],
        why: "Spot $u$, rewrite, solve for $u$, substitute back, check. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $x^4 - 10x^2 + 9 = 0$. Give all four solutions.", answer: [-3, -1, 1, 3], skill: "Quadratic form", placeholder: "e.g. −2, −1, 1, 2",
        hints: ["Let $u = x^2$: $u^2 - 10u + 9 = 0$."], why: "$u = 1$ or $u = 9$, so $x = \\pm 1$ or $x = \\pm 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The repeated part can be a whole expression. $$(x - 2)^2 + 3(x - 2) - 10 = 0$$",
        scene: { type: "walk", how: HOW_9_4, rows: [
          { step: 1, m: "u = x - 2", say: "The expression $x - 2$ appears squared and on its own." },
          { step: 2, m: "u^2 + 3u - 10 = 0", say: "No need to multiply anything out." },
          { step: 3, m: "u = 2 \\quad\\text{or}\\quad u = -5", say: "$(u - 2)(u + 5) = 0$." },
          { step: 4, m: "x - 2 = 2 \\quad\\text{or}\\quad x - 2 = -5", say: "Put $x - 2$ back." },
          { step: 4, m: "x = 4 \\quad\\text{or}\\quad x = -3", say: "Add 2 to each." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which substitution makes $x^{\\frac{2}{3}} - 2x^{\\frac{1}{3}} - 3 = 0$ quadratic?",
        options: [{ t: "$u = x^{\\frac{1}{3}}$" }, { t: "$u = x^{\\frac{2}{3}}$", fb: "Then the middle term would be $\\sqrt{u}$. Choose the middle term's part, so the first term is its square." }, { t: "$u = x$", fb: "That leaves the fractional exponents in place." }],
        answer: 0, skill: "Quadratic form", hints: ["Which part, squared, gives the first term?"], why: "$(x^{\\frac{1}{3}})^2 = x^{\\frac{2}{3}}$, so the equation becomes $u^2 - 2u - 3 = 0$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Solving $x^4 - 5x^2 + 4 = 0$ with $u = x^2$, Ty finds $u = 1$ and $u = 4$ and reports “the solutions are 1 and 4”. What is wrong?",
        options: [{ t: "Those are values of $u$. He must substitute back: $x^2 = 1$ or $x^2 = 4$." },
                  { t: "The factoring is wrong.", fb: "$(u - 1)(u - 4) = 0$ is right." },
                  { t: "Nothing. 1 and 4 are the solutions.", fb: "Test $x = 4$: $256 - 80 + 4$ is not 0." }],
        answer: 0, skill: "Quadratic form", hints: ["Step 4 of the method."], why: "The solutions are $x = \\pm 1$ and $x = \\pm 2$." },
      { type: "numbers", kicker: "Use it", prompt: "Give the **real** solutions of $x^4 - 16 = 0$.", answer: [-2, 2], skill: "Quadratic form", placeholder: "e.g. −3, 3",
        hints: ["$u = x^2$ gives $u^2 = 16$, so $x^2 = 4$ or $x^2 = -4$."], why: "$x^2 = 4$ gives $x = \\pm 2$. $x^2 = -4$ has no real solution." }
    ]
  });

  /* ================================ 9.5 · Solve applications of quadratic equations */
  var HOW_9_5 = [["Read", "Read the problem, and draw a figure if it helps."],
                 ["Name", "Choose a variable for the unknown."],
                 ["Translate", "Write the quadratic equation the problem describes."],
                 ["Solve", "Solve it: factor, complete the square, or use the formula."],
                 ["Answer", "Reject any solution that makes no sense, and answer the question."]];
  LESSONS.push({
    title: "Applications of quadratic equations",
    blurb: "Book 9.5 · Numbers, areas, right triangles and falling objects.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A right triangle has legs of 6 and 8. How long is its hypotenuse?", answer: 10, skill: "Pythagorean Theorem",
        near: [{ v: 14, fb: "The sides are squared before they are added: $6^2 + 8^2$." }, { v: 100, fb: "That is $c^2$. Take the square root." }],
        hints: ["$6^2 + 8^2 = c^2$."], why: "$36 + 64 = 100$, so $c = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "Products of unknowns give quadratic equations: an area, a product of two numbers, the Pythagorean Theorem. The equation usually has two solutions, and the problem decides which of them make sense.",
        scene: { type: "method", how: HOW_9_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one: **the product of two consecutive odd integers is 195. Both are positive. Find them.**",
        scene: { type: "walk", how: HOW_9_5, rows: [
          { step: 1, m: "\\text{two consecutive odd integers}", say: "Consecutive odd integers are 2 apart." },
          { step: 2, m: "n \\quad\\text{and}\\quad n + 2", say: "Let $n$ be the smaller one." },
          { step: 3, m: "n(n + 2) = 195", say: "Their product is 195." },
          { step: 4, m: "n^2 + 2n - 195 = 0", say: "Multiply out, and get 0 on one side." },
          { step: 4, m: "(n + 15)(n - 13) = 0", say: "So $n = -15$ or $n = 13$." },
          { step: 5, m: "n = 13", say: "The integers are positive, so $-15$ is rejected. They are 13 and 15.",
            ask: { prompt: "The equation gives $n = -15$ or $n = 13$. Which fits the problem?", answer: 0,
                   options: [{ t: "$n = 13$: the integers are positive" }, { t: "Both", fb: "The problem says both integers are positive." }] } }] },
        gate: true, then: "The algebra offers two answers. The problem chooses." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. **A rectangular garden is 4 m longer than it is wide, and its area is 96 m².**",
        how: HOW_9_5, skill: "Quadratic applications",
        steps: [
          { step: 1, ask: "What links the length, the width and the 96?", type: "choice", answer: 0,
            options: [{ t: "Area = length × width" }, { t: "Perimeter = 2 lengths + 2 widths", fb: "96 m² is an area, not a perimeter." }],
            m: "\\text{area} = \\text{length} \\times \\text{width}", say: "The formula to use." },
          { step: 2, ask: "Let $w$ be the width. What is the length?", type: "choice", answer: 0,
            options: [{ t: "$w + 4$" }, { t: "$4w$", fb: "4 m **longer**, not 4 times as long." }],
            m: "w \\quad\\text{and}\\quad w + 4", say: "Width and length." },
          { step: 3, ask: "Write the equation.", type: "choice", answer: 0,
            options: [{ t: "$w(w + 4) = 96$" }, { t: "$w + (w + 4) = 96$", fb: "Area is a product, not a sum." }],
            m: "w(w + 4) = 96", say: "Width times length." },
          { step: 4, ask: "That is $w^2 + 4w - 96 = 0$. Factor it.", type: "choice", answer: 0,
            options: [{ t: "$(w + 12)(w - 8) = 0$" }, { t: "$(w - 12)(w + 8) = 0$", fb: "That gives $-4w$ in the middle." }],
            m: "(w + 12)(w - 8) = 0", say: "So $w = -12$ or $w = 8$." },
          { step: 5, ask: "Which solution makes sense?", type: "choice", answer: 0,
            options: [{ t: "$w = 8$: a width cannot be negative" }, { t: "$w = -12$", fb: "A width of $-12$ m means nothing." }],
            m: "w = 8", say: "The garden is 8 m by 12 m, and $8 \\cdot 12 = 96$. ✓" }],
        why: "Read, name, translate, solve, answer. Now a right triangle on your own." },
      { type: "num", kicker: "On your own", prompt: "A right triangle has legs of $x$ and $x + 7$, and a hypotenuse of **13**. Find the shorter leg, $x$.",
        answer: 5, skill: "Quadratic applications",
        near: [{ v: 12, fb: "That is the longer leg, $x + 7$." }, { v: -12, fb: "A length cannot be negative. Take the other solution." }],
        hints: ["$x^2 + (x + 7)^2 = 13^2$ simplifies to $x^2 + 7x - 60 = 0$."], why: "$(x + 12)(x - 5) = 0$, so $x = 5$. The legs are 5 and 12." },
      { type: "learn", kicker: "A harder case",
        prompt: "A ball is thrown upward from an 80-foot roof. Its height is $h = -16t^2 + 64t + 80$. **When does it hit the ground?**",
        scene: { type: "walk", how: HOW_9_5, rows: [
          { step: 1, m: "h = -16t^2 + 64t + 80", say: "Height in feet, $t$ seconds after the throw." },
          { step: 3, m: "-16t^2 + 64t + 80 = 0", say: "On the ground, the height is 0." },
          { step: 4, m: "t^2 - 4t - 5 = 0", say: "Divide every term by $-16$." },
          { step: 4, m: "(t - 5)(t + 1) = 0", say: "So $t = 5$ or $t = -1$." },
          { step: 5, m: "t = 5", say: "Time cannot be negative. The ball lands after 5 seconds." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The product of two consecutive **positive** integers is 132. Find the smaller one.", answer: 11, skill: "Quadratic applications",
        near: [{ v: 12, fb: "That is the larger of the two." }, { v: -12, fb: "The integers are positive." }],
        hints: ["$n(n + 1) = 132$, so $n^2 + n - 132 = 0$."], why: "$(n + 12)(n - 11) = 0$, so $n = 11$. And $11 \\cdot 12 = 132$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For a garden with $w(w + 4) = 96$, Pat reports: “The width is $-12$ m or 8 m.” What is wrong?",
        options: [{ t: "A width cannot be negative. Only 8 m answers the question." },
                  { t: "The equation has only one solution.", fb: "It has two: $-12$ and 8. But only one of them is a width." },
                  { t: "Nothing. Both solve the equation.", fb: "Both solve the equation, but the question is about a real garden." }],
        answer: 0, skill: "Quadratic applications", hints: ["Step 5: does each solution make sense?"], why: "Solving the equation is not the same as answering the problem." },
      { type: "num", kicker: "Use it", prompt: "Each side of a square is made **3 m longer**, and the new area is **64 m²**. How long was the original side?",
        post: "m", answer: 5, skill: "Quadratic applications",
        near: [{ v: 8, fb: "That is the new side. The original was 3 m shorter." }, { v: -11, fb: "A side cannot be negative." }],
        hints: ["$(s + 3)^2 = 64$."], why: "$s + 3 = 8$ (the negative root is rejected), so $s = 5$." }
    ]
  });
  /* ============================ 9.6 · Graph quadratic functions using properties */
  var HOW_9_6 = [["Opens", "$a > 0$: the parabola opens upward. $a < 0$: it opens downward."],
                 ["Axis", "The axis of symmetry is the line $x = -\\frac{b}{2a}$."],
                 ["Vertex", "The vertex is on the axis. Substitute that $x$ to find its $y$."],
                 ["Intercepts", "$y$-intercept: let $x = 0$. $x$-intercepts: solve $f(x) = 0$."],
                 ["Graph", "Plot the points, mirror them across the axis, and draw the curve."]];
  var W96 = { x: [-2, 6], y: [-3, 6] }, F96 = function (x) { return x * x - 4 * x + 3; };
  var AX96 = { seg: [[2, -3], [2, 6]], c: "soft", dash: true }, V96 = { pt: [2, -1], name: "(2, −1)", at: "s", c: "orange" };
  var P96 = [{ pt: [0, 3] }, { pt: [4, 3] }, { pt: [1, 0] }, { pt: [3, 0] }];
  LESSONS.push({
    title: "Graph quadratic functions using properties",
    blurb: "Book 9.6 · Direction, axis of symmetry, vertex and intercepts, and the maximum or minimum.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "For $f(x) = x^2 - 4x + 3$, find $f(2)$.", pre: "$f(2) =$", answer: -1, skill: "Evaluate a function",
        near: [{ v: 15, fb: "$-4(2) = -8$: subtract it." }, { v: 1, fb: "$4 - 8 = -4$, then add 3." }], hints: ["$4 - 8 + 3$."], why: "$4 - 8 + 3 = -1$." },
      { type: "learn", kicker: "The idea",
        prompt: "The graph of $f(x) = ax^2 + bx + c$ is a **parabola**. Four facts pin it down: which way it opens, its axis of symmetry, its vertex, and its intercepts. The vertex is the lowest or the highest point.",
        scene: { type: "method", how: HOW_9_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $f(x) = x^2 - 4x + 3$ graphed from its properties.",
        scene: { type: "walk", how: HOW_9_6, rows: [
          { step: 1, m: "a = 1", say: "$a$ is positive, so the parabola opens upward.", fig: grid("An empty coordinate grid.", [], W96) },
          { step: 2, m: "x = -\\frac{-4}{2(1)} = 2", say: "The axis of symmetry: the vertical line $x = 2$.", fig: grid("The dashed vertical line x = 2.", [AX96], W96) },
          { step: 3, m: "f(2) = 4 - 8 + 3 = -1", say: "The vertex is on the axis: $(2, -1)$.", fig: grid("The axis x = 2 with the vertex (2, −1) marked on it.", [AX96, V96], W96),
            ask: { prompt: "The vertex is on the axis $x = 2$. What is its $y$-coordinate, $f(2)$?", answer: 0,
                   options: [{ t: "$-1$" }, { t: "$3$", fb: "3 is $f(0)$, the $y$-intercept." }, { t: "$15$", fb: "$-4(2) = -8$ is subtracted: $4 - 8 + 3$." }] } },
          { step: 4, m: "(0, 3) \\quad (1, 0) \\quad (3, 0)", say: "$f(0) = 3$, and $(x - 1)(x - 3) = 0$ gives the $x$-intercepts. The mirror image of $(0, 3)$ across the axis is $(4, 3)$.", fig: grid("The axis, the vertex, the intercepts (0, 3), (1, 0), (3, 0) and the mirror point (4, 3).", [AX96, V96].concat(P96), W96) },
          { step: 5, m: "f(x) = x^2 - 4x + 3", say: "Draw a smooth curve through the points.", fig: grid("An upward parabola with vertex (2, −1), crossing the x-axis at 1 and 3 and the y-axis at 3.", curve(F96, -0.6, 4.6, "blue").concat([AX96, V96]).concat(P96), W96) }] },
        gate: true, then: "Because the parabola opens upward, the vertex is its **minimum**: the least value of $f$ is $-1$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find each property of $f(x) = -x^2 + 2x + 3$.",
        how: HOW_9_6, skill: "Graph a parabola",
        steps: [
          { step: 1, ask: "Which way does it open?", type: "choice", answer: 0,
            options: [{ t: "Downward: $a = -1$" }, { t: "Upward", fb: "$a$ is the coefficient of $x^2$, which is $-1$." }],
            m: "a = -1", say: "Negative, so it opens downward." },
          { step: 2, ask: "The axis is $x = -\\frac{b}{2a} = -\\frac{2}{2(-1)}$. What is it?", type: "num", pre: "$x =$", answer: 1, near: [{ v: -1, fb: "$-\\frac{2}{-2}$: a negative divided by a negative." }], hint: "$-\\frac{2}{-2}$.",
            m: "x = 1", say: "The axis of symmetry." },
          { step: 3, ask: "Find the vertex's height: $f(1) = -1 + 2 + 3$.", type: "num", pre: "$f(1) =$", answer: 4, near: [{ v: 6, fb: "$-(1)^2 = -1$, not $+1$." }], hint: "$-1 + 2 + 3$.",
            m: "(1, 4)", say: "The vertex." },
          { step: 4, ask: "Solve $-x^2 + 2x + 3 = 0$ for the $x$-intercepts.", type: "choice", answer: 0,
            options: [{ t: "$(-1, 0)$ and $(3, 0)$" }, { t: "$(1, 0)$ and $(-3, 0)$", fb: "$x^2 - 2x - 3 = (x - 3)(x + 1)$." }],
            m: "(-1, 0) \\quad (3, 0) \\quad (0, 3)", say: "And the $y$-intercept is $f(0) = 3$." },
          { step: 5, ask: "The parabola opens downward. What is the vertex?", type: "choice", answer: 0,
            options: [{ t: "The maximum: the greatest value is 4" }, { t: "The minimum", fb: "A downward parabola has a highest point, not a lowest." }],
            m: "\\text{maximum } 4 \\text{ at } x = 1", say: "The curve rises to $(1, 4)$ and falls away on both sides." }],
        why: "Opens, axis, vertex, intercepts, graph. Now find a vertex on the grid." },
      { type: "plane", kicker: "On your own", prompt: "**Click the vertex** of $f(x) = x^2 + 2x - 3$.",
        x: [-6, 4], y: [-6, 6], click: "point", answer: { point: [-1, -4] }, skill: "Graph a parabola",
        clickFb: function (c) { return c && c[0] === -1 ? "The axis is right: $x = -1$. Now find $f(-1) = 1 - 2 - 3$." : "The vertex is on the axis $x = -\\frac{b}{2a} = -\\frac{2}{2}$."; },
        hints: ["The axis is $x = -1$. Then find $f(-1)$."], why: "$x = -\\frac{2}{2(1)} = -1$ and $f(-1) = 1 - 2 - 3 = -4$." },
      { type: "numbers", prompt: "What are the $x$-intercepts of $f(x) = x^2 + 2x - 3$? Give both $x$-values.", answer: [-3, 1], skill: "Graph a parabola", placeholder: "e.g. −2, 4",
        hints: ["Solve $x^2 + 2x - 3 = 0$."], why: "$(x + 3)(x - 1) = 0$, so $x = -3$ or $x = 1$. They are the same distance from the axis $x = -1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The vertex answers “how high?” and “how much at most?”. A ball's height is $h(t) = -16t^2 + 64t + 5$. **How high does it go?**",
        scene: { type: "walk", how: HOW_9_6, rows: [
          { step: 1, m: "a = -16", say: "The parabola opens downward, so the vertex is the highest point." },
          { step: 2, m: "t = -\\frac{64}{2(-16)} = 2", say: "The axis: the ball is highest after 2 seconds." },
          { step: 3, m: "h(2) = -64 + 128 + 5 = 69", say: "Substitute $t = 2$." },
          { step: 3, m: "\\text{maximum: } 69 \\text{ feet}", say: "The greatest height is 69 feet, reached at 2 seconds." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Does $f(x) = 2x^2 - 8x + 1$ have a minimum or a maximum, and where?",
        options: [{ t: "A minimum, at $x = 2$" }, { t: "A maximum, at $x = 2$", fb: "$a = 2$ is positive: the parabola opens upward, so the vertex is the lowest point." }, { t: "A minimum, at $x = -2$", fb: "$-\\frac{b}{2a} = -\\frac{-8}{4} = 2$." }],
        answer: 0, skill: "Maximum and minimum", hints: ["Which way does it open? Where is the axis?"], why: "It opens upward, and the axis is $x = -\\frac{-8}{2(2)} = 2$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where finding the axis of $f(x) = 2x^2 + 8x - 3$ **first** goes wrong.",
        lines: ["x = -\\frac{b}{2a}", "x = -\\frac{8}{2}", "x = -4"], answer: 1, fix: "x = -\\frac{8}{2(2)}",
        fb: { 0: "The formula is right.", 2: LATER }, skill: "Graph a parabola",
        hints: ["The denominator is $2a$. What is $a$?"],
        why: "$2a = 2(2) = 4$, so the axis is $x = -2$." },
      { type: "num", kicker: "Use it", prompt: "Selling $x$ items brings in revenue $R(x) = -2x^2 + 80x$ dollars. How many items give the **greatest** revenue?",
        post: "items", answer: 20, skill: "Maximum and minimum",
        near: [{ v: 40, fb: "40 is where the revenue falls back to 0. The maximum is at the vertex: $x = -\\frac{b}{2a}$." }, { v: 800, fb: "That is the greatest revenue. The question asks how many items." }],
        hints: ["$x = -\\frac{80}{2(-2)}$."], why: "$x = -\\frac{80}{-4} = 20$." }
    ]
  });

  /* ======================== 9.7 · Graph quadratic functions using transformations */
  var HOW_9_7 = [["Vertex form", "Write the function as $f(x) = a(x - h)^2 + k$, completing the square if needed."],
                 ["Shift", "$h$ moves the graph of $y = x^2$ left or right, and $k$ moves it up or down."],
                 ["Stretch", "$a$ stretches or flattens it, and a negative $a$ flips it over."],
                 ["Vertex", "The vertex is $(h, k)$, and the axis is $x = h$."]];
  var HOW_9_7G = [["Vertex", "Read the vertex $(h, k)$ from the graph, and put it into $f(x) = a(x - h)^2 + k$."],
                  ["Point", "Substitute another point of the graph for $x$ and $f(x)$."],
                  ["Solve", "Solve for $a$, and write the function."]];
  var SQ97 = function (x) { return x * x; };
  function vform(a, h, k) { return "f(x) = " + (a === 1 ? "" : a === -1 ? "-" : num(a)) + "(x " + (h < 0 ? "+ " + num(-h) : "- " + num(h)) + ")^2 " + (k < 0 ? "- " + num(-k) : "+ " + num(k)); }
  LESSONS.push({
    title: "Graph quadratic functions using transformations",
    blurb: "Book 9.7 · Vertex form: every parabola is the basic one, moved, stretched or flipped.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Where is the vertex of the basic parabola $y = x^2$?",
        options: [{ t: "$(0, 0)$" }, { t: "$(1, 1)$", fb: "$(1, 1)$ is on the graph, but it is not the lowest point." }, { t: "$(0, 1)$", fb: "At $x = 0$, $y = 0^2 = 0$." }],
        answer: 0, skill: "Vertex form", hints: ["What is the least value $x^2$ can have?"], why: "$x^2$ is smallest at $x = 0$, where it is 0." },
      { type: "learn", kicker: "Explore", prompt: "The dashed curve is $y = x^2$. Move the sliders, and watch what $a$, $h$ and $k$ each do to it.",
        scene: { type: "plane", x: [-6, 6], y: [-6, 8], gate: true,
          params: { a: { v: 1, min: -2, max: 2, step: 0.5, label: "$a$" }, h: { v: 2, min: -4, max: 4, step: 1, label: "$h$" }, k: { v: 1, min: -4, max: 4, step: 1, label: "$k$" } },
          fns: [{ f: SQ97, color: "ink", dashed: true }, { f: function (x, p) { return p.a * (x - p.h) * (x - p.h) + p.k; }, color: "blue" }],
          readout: function (st) { var p = st.params; return "$" + vform(p.a, p.h, p.k) + "$"; } }, gate: true,
        then: "$h$ slides the parabola sideways, $k$ slides it up or down, and $a$ changes its width. A negative $a$ turns it upside down." },
      { type: "learn", kicker: "The idea",
        prompt: "Every parabola is the basic one, $y = x^2$, transformed. In **vertex form**, $f(x) = a(x - h)^2 + k$, the numbers say exactly how: the vertex has moved to $(h, k)$, and $a$ sets the width and the direction.",
        scene: { type: "method", how: HOW_9_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $f(x) = 2(x - 3)^2 - 4$ read as transformations.",
        scene: { type: "walk", how: HOW_9_7, rows: [
          { step: 1, m: "f(x) = 2(x - 3)^2 - 4", say: "Already in vertex form: $a = 2$, $h = 3$, $k = -4$.", fig: grid("The basic parabola y = x squared, with its vertex at the origin.", curve(SQ97, -2.6, 2.6, "soft", [-5, 7]), { x: [-3, 7], y: [-5, 7] }) },
          { step: 2, m: "h = 3 \\quad k = -4", say: "Shifted 3 to the right and 4 down.",
            ask: { prompt: "In $(x - 3)^2$, which way does the graph shift?", answer: 0,
                   options: [{ t: "3 to the right" }, { t: "3 to the left", fb: "$x - 3$ is 0 when $x = 3$, so the vertex moves to $x = 3$." }] } },
          { step: 3, m: "a = 2", say: "Stretched: twice as steep, so narrower. $a$ is positive, so it still opens upward." },
          { step: 4, m: "(3, -4)", say: "The vertex is $(h, k)$, and the axis is $x = 3$.", fig: grid("The basic parabola, and a narrower one with its vertex moved to (3, −4).", curve(SQ97, -2.6, 2.6, "soft", [-5, 7]).concat(curve(function (x) { return 2 * (x - 3) * (x - 3) - 4; }, 0.6, 5.4, "blue", [-5, 7])).concat([{ pt: [3, -4], name: "(3, −4)", at: "s", c: "orange" }]), { x: [-3, 7], y: [-5, 7] }) }] },
        gate: true, then: "No table of values needed: the form itself tells you the graph." },
      { type: "guided", kicker: "Together",
        prompt: "Now put $f(x) = x^2 + 6x + 5$ into vertex form and read it.",
        how: HOW_9_7, skill: "Vertex form",
        steps: [
          { step: 1, ask: "Complete the square on $x^2 + 6x$. Half of 6, squared, is…", type: "num", answer: 9, near: [{ v: 3, fb: "Square the half: $3^2$." }, { v: 36, fb: "Halve first, then square." }], hint: "$3^2$.",
            m: "f(x) = (x^2 + 6x + 9) + 5 - 9", say: "Add 9 inside, and subtract 9 outside, so the function is unchanged." },
          { step: 1, ask: "Factor the trinomial, and simplify $5 - 9$.", type: "choice", answer: 0,
            options: [{ t: "$f(x) = (x + 3)^2 - 4$" }, { t: "$f(x) = (x + 3)^2 + 14$", fb: "9 was added inside, so 9 is subtracted outside: $5 - 9$." }, { t: "$f(x) = (x + 6)^2 - 4$", fb: "Half of 6 is 3: the binomial is $x + 3$." }],
            m: "f(x) = (x + 3)^2 - 4", say: "Vertex form." },
          { step: 2, ask: "$(x + 3)^2$ is $(x - h)^2$ for which $h$?", type: "choice", answer: 0,
            options: [{ t: "$h = -3$: 3 to the left" }, { t: "$h = 3$: 3 to the right", fb: "$x + 3 = x - (-3)$." }],
            m: "h = -3 \\quad k = -4", say: "3 to the left and 4 down." },
          { step: 3, ask: "$a = 1$. What does that say about the shape?", type: "choice", answer: 0,
            options: [{ t: "The same width as $y = x^2$, opening upward" }, { t: "It is flipped over", fb: "Only a negative $a$ flips the graph." }],
            m: "a = 1", say: "No stretch, no flip." },
          { step: 4, ask: "What is the vertex?", type: "choice", answer: 0,
            options: [{ t: "$(-3, -4)$" }, { t: "$(3, -4)$", fb: "$h = -3$." }, { t: "$(-3, 4)$", fb: "$k = -4$." }],
            m: "(-3, -4)", say: "The vertex is $(h, k)$." }],
        why: "Vertex form, shift, stretch, vertex. Now move a parabola yourself." },
      { type: "plane", kicker: "On your own", prompt: "Set $h$ and $k$ so that the blue parabola is $f(x) = (x + 2)^2 - 3$.",
        x: [-6, 6], y: [-6, 8], params: { h: { v: 1, min: -4, max: 4, step: 1, label: "$h$" }, k: { v: 1, min: -5, max: 5, step: 1, label: "$k$" } },
        fns: [{ f: SQ97, color: "ink", dashed: true }, { f: function (x, p) { return (x - p.h) * (x - p.h) + p.k; }, color: "blue" }],
        readout: function (st) { return "$" + vform(1, st.params.h, st.params.k) + "$"; },
        check: function (st) { var p = st.params; return p.h === -2 && p.k === -3 ? { ok: true } : { ok: false, say: p.h === 2 ? "$(x + 2)^2$ is $(x - (-2))^2$: the shift is to the left." : p.k !== -3 ? "The $-3$ outside moves the graph 3 down." : "$x + 2$ is 0 when $x = -2$: that is where the vertex goes." }; },
        answer: { params: { h: -2, k: -3 } }, skill: "Vertex form",
        hints: ["Where is $(x + 2)^2$ equal to 0? That is $h$."], why: "$h = -2$ and $k = -3$: the vertex is $(-2, -3)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Vertex form also works backwards: from a graph to its function. This parabola has its vertex at $(1, -2)$ and passes through $(0, 1)$.",
        scene: { type: "walk", how: HOW_9_7G, rows: [
          { step: 1, m: "f(x) = a(x - 1)^2 - 2", say: "The vertex gives $h = 1$ and $k = -2$. Only $a$ is unknown.", fig: grid("An upward parabola with vertex (1, −2), passing through the point (0, 1).", curve(function (x) { return 3 * (x - 1) * (x - 1) - 2; }, -0.6, 2.6, "blue").concat([{ pt: [1, -2], name: "(1, −2)", at: "s", c: "orange" }, { pt: [0, 1], name: "(0, 1)", at: "w", c: "orange" }]), { x: [-3, 5], y: [-4, 6] }) },
          { step: 2, m: "1 = a(0 - 1)^2 - 2", say: "The point $(0, 1)$ is on the graph, so $f(0) = 1$." },
          { step: 3, m: "a = 3", say: "$1 = a - 2$." },
          { step: 3, m: "f(x) = 3(x - 1)^2 - 2", say: "The function." }] },
        gate: true },
      { type: "slots", kicker: "Try it", prompt: "Match each function to its vertex.",
        slots: [{ id: "a", label: "$(4, 1)$" }, { id: "b", label: "$(-4, 1)$" }, { id: "c", label: "$(1, -4)$" }, { id: "d", label: "$(-1, 4)$" }],
        cards: [{ t: "$f(x) = (x - 4)^2 + 1$", slot: "a", fb: "$h = 4$, $k = 1$." },
                { t: "$f(x) = (x + 4)^2 + 1$", slot: "b", fb: "$x + 4 = x - (-4)$, so $h = -4$." },
                { t: "$f(x) = 2(x - 1)^2 - 4$", slot: "c", fb: "$h = 1$, $k = -4$. The 2 changes the width, not the vertex." },
                { t: "$f(x) = -(x + 1)^2 + 4$", slot: "d", fb: "$h = -1$, $k = 4$. The minus flips it, but the vertex stays put." }],
        skill: "Vertex form", hints: ["The vertex is $(h, k)$, and the sign inside the parentheses is the opposite of $h$."],
        why: "Read $h$ with the opposite sign from inside the parentheses, and $k$ as it stands." },
      { type: "choice", kicker: "Find the error",
        prompt: "Jo says the vertex of $f(x) = (x + 5)^2 - 2$ is $(5, -2)$. What is wrong?",
        options: [{ t: "$x + 5 = x - (-5)$, so $h = -5$: the vertex is $(-5, -2)$." },
                  { t: "The vertex is $(5, 2)$.", fb: "$k = -2$ is right. It is $h$ that has the wrong sign." },
                  { t: "Nothing. It is right.", fb: "Test it: $f(5) = 98$, but $f(-5) = -2$ is the least value." }],
        answer: 0, skill: "Vertex form", hints: ["Where is $(x + 5)^2$ equal to 0?"], why: "The square is 0 at $x = -5$, and that is where the vertex sits." },
      { type: "choice", kicker: "Use it", prompt: "An arch follows $h(x) = -\\frac{1}{2}(x - 4)^2 + 8$, in metres. How high is it at its highest, and where?",
        options: [{ t: "8 m high, at $x = 4$" }, { t: "4 m high, at $x = 8$", fb: "The vertex is $(h, k) = (4, 8)$: $x$ first, then the height." }, { t: "8 m high, at $x = -4$", fb: "$x - 4$ is 0 at $x = 4$." }],
        answer: 0, skill: "Vertex form", hints: ["The vertex is $(h, k)$, and $a$ is negative."], why: "$a$ is negative, so the vertex $(4, 8)$ is the highest point." }
    ]
  });

  /* =========================================== 9.8 · Solve quadratic inequalities */
  var HOW_9_8 = [["Standard", "Write the inequality with 0 on one side."],
                 ["Critical", "Solve the related equation. Its solutions are the critical points."],
                 ["Intervals", "The critical points split the number line into intervals."],
                 ["Test", "Test one value in each interval."],
                 ["Answer", "Keep the intervals that make the inequality true."]];
  var F98 = function (x) { return x * x - x - 6; };
  LESSONS.push({
    title: "Solve quadratic inequalities",
    blurb: "Book 9.8 · Where a parabola is above or below the axis: by graph, and by testing intervals.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $x^2 - x - 6$ positive or negative when $x = 0$?",
        options: [{ t: "Negative: it is $-6$" }, { t: "Positive", fb: "$0 - 0 - 6 = -6$." }],
        answer: 0, skill: "Sign of an expression", hints: ["Substitute 0."], why: "$0^2 - 0 - 6 = -6$." },
      { type: "learn", kicker: "The idea",
        prompt: "$x^2 - x - 6 < 0$ asks: where is the parabola **below** the $x$-axis? It can only cross the axis at the solutions of $x^2 - x - 6 = 0$. Between those crossings its sign cannot change.",
        scene: { type: "method", how: HOW_9_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$x^2 - x - 6 < 0$$",
        scene: { type: "walk", how: HOW_9_8, rows: [
          { step: 1, m: "x^2 - x - 6 < 0", say: "0 is already on one side." },
          { step: 2, m: "(x - 3)(x + 2) = 0", say: "The related equation gives the critical points $-2$ and 3.", fig: grid("The parabola y = x squared minus x minus 6, crossing the x-axis at −2 and 3.", curve(F98, -3.2, 4.2, "blue").concat([{ pt: [-2, 0], c: "orange" }, { pt: [3, 0], c: "orange" }]), { x: [-5, 6], y: [-8, 8] }) },
          { step: 3, m: "(-\\infty, -2) \\quad (-2, 3) \\quad (3, \\infty)", say: "Three intervals." },
          { step: 4, m: "+ \\qquad - \\qquad +", say: "Test $-3$, 0 and 4: the values are 6, $-6$ and 6.",
            ask: { prompt: "At $x = 0$ the expression is $-6$. What does that say about the whole interval $(-2, 3)$?", answer: 0,
                   options: [{ t: "The expression is negative all the way across it" }, { t: "Nothing: other points might be positive", fb: "The sign can only change at a critical point, and there are none inside the interval." }] } },
          { step: 5, m: "(-2, 3)", say: "$< 0$ keeps the interval where the expression is negative: where the curve is below the axis.", fig: grid("The same parabola, with the part of the x-axis between −2 and 3 highlighted, where the curve is below the axis.", curve(F98, -3.2, 4.2, "blue").concat([{ seg: [[-2, 0], [3, 0]], c: "orange" }, { pt: [-2, 0], c: "orange", open: true }, { pt: [3, 0], c: "orange", open: true }]), { x: [-5, 6], y: [-8, 8] }) }] },
        gate: true, then: "The algebra and the graph tell the same story." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$x^2 + 2x - 8 \\ge 0$$",
        how: HOW_9_8, skill: "Quadratic inequalities",
        steps: [
          { step: 1, ask: "Is 0 already on one side?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "No", fb: "The right side is 0." }],
            m: "x^2 + 2x - 8 \\ge 0", say: "Standard form." },
          { step: 2, ask: "Solve $x^2 + 2x - 8 = 0$ for the critical points.", type: "choice", answer: 0,
            options: [{ t: "$-4$ and $2$" }, { t: "$4$ and $-2$", fb: "$(x + 4)(x - 2) = 0$ gives $x = -4$ or $x = 2$." }],
            m: "(x + 4)(x - 2) = 0", say: "The critical points are $-4$ and 2." },
          { step: 3, ask: "Which intervals do they make?", type: "choice", answer: 0,
            options: [{ t: "$(-\\infty, -4)$, $(-4, 2)$ and $(2, \\infty)$" }, { t: "$(-4, 2)$ only", fb: "The line continues beyond both critical points." }],
            m: "(-\\infty, -4) \\quad (-4, 2) \\quad (2, \\infty)", say: "Three intervals." },
          { step: 4, ask: "Test $x = 0$: what is $0^2 + 2(0) - 8$?", type: "num", answer: -8, hint: "$0 + 0 - 8$.",
            m: "+ \\qquad - \\qquad +", say: "And $x = -5$ gives 7, while $x = 3$ gives 7." },
          { step: 5, ask: "Which is the solution of $x^2 + 2x - 8 \\ge 0$?", type: "choice", answer: 0,
            options: [{ t: "$(-\\infty, -4] \\cup [2, \\infty)$" }, { t: "$[-4, 2]$", fb: "That is where the expression is negative or 0." }, { t: "$(-\\infty, -4) \\cup (2, \\infty)$", fb: "$\\ge$ includes the points where the expression is 0." }],
            m: "(-\\infty, -4] \\cup [2, \\infty)", say: "The positive intervals, with their endpoints." }],
        why: "Standard, critical points, intervals, test, answer. Now graph two solutions yourself." },
      { type: "numberline", kicker: "On your own", prompt: "Graph the solution of $x^2 - 9 > 0$. Drag the two ends, and tap an end to switch it between open and filled.",
        min: -7, max: 7, mode: "seg", variable: "x", seg: { a: -1, b: 1, ca: true, cb: true, outside: true },
        answer: { a: -3, b: 3, ca: false, cb: false }, skill: "Quadratic inequalities",
        hints: ["The critical points are $-3$ and 3. Test $x = 0$ and $x = 4$."], why: "$x < -3$ or $x > 3$: open circles, shaded outward." },
      { type: "numberline", prompt: "Graph the solution of $x^2 - 2x - 3 \\le 0$.",
        min: -6, max: 6, mode: "seg", variable: "x", seg: { a: -2, b: 0, ca: false, cb: false },
        answer: { a: -1, b: 3, ca: true, cb: true }, skill: "Quadratic inequalities",
        hints: ["$(x - 3)(x + 1) = 0$. Test $x = 0$."], why: "$-1 \\le x \\le 3$: the expression is negative between its zeros, and $\\le$ includes them." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes there are no critical points at all. $$x^2 + 4 > 0$$",
        scene: { type: "walk", how: HOW_9_8, rows: [
          { step: 1, m: "x^2 + 4 > 0", say: "Standard form." },
          { step: 2, m: "x^2 = -4", say: "The related equation has no real solution: the parabola never meets the $x$-axis." },
          { step: 4, m: "0^2 + 4 = 4", say: "With no critical points, one test value settles the whole line. At $x = 0$ the expression is positive." },
          { step: 5, m: "(-\\infty, \\infty)", say: "Every real number is a solution. ($x^2 + 4 < 0$ would have none.)" }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Solve $(x - 1)(x - 5) \\le 0$.",
        options: [{ t: "$[1, 5]$" }, { t: "$(-\\infty, 1] \\cup [5, \\infty)$", fb: "Test $x = 3$: $(2)(-2) = -4$, which is negative. The middle interval is the one that works." }, { t: "$(1, 5)$", fb: "$\\le$ includes the points where the product is 0." }],
        answer: 0, skill: "Quadratic inequalities", hints: ["The critical points are 1 and 5. Test $x = 3$."], why: "Between 1 and 5 one factor is positive and the other negative." },
      { type: "choice", kicker: "Find the error",
        prompt: "To solve $x^2 < 9$, Al takes square roots and writes $x < 3$. What is wrong?",
        options: [{ t: "It loses the lower bound. The solution is $-3 < x < 3$." },
                  { t: "It should be $x < \\pm 3$.", fb: "That is not a meaningful statement. Find the critical points and test the intervals." },
                  { t: "Nothing. $x < 3$ is right.", fb: "Test $x = -5$: it is less than 3, but $25 < 9$ is false." }],
        answer: 0, skill: "Quadratic inequalities", hints: ["Test $x = -5$."], why: "$x^2 - 9 < 0$ has critical points $-3$ and 3, and it holds only between them." },
      { type: "choice", kicker: "Use it", prompt: "A ball's height is $h = -16t^2 + 64t$ feet after $t$ seconds. During which times is it **above 48 feet**?",
        options: [{ t: "Between 1 and 3 seconds" }, { t: "After 3 seconds", fb: "By then it is coming back down. Test $t = 4$: $h = 0$." }, { t: "Before 1 second", fb: "Test $t = 0$: $h = 0$." }],
        answer: 0, skill: "Quadratic inequalities", hints: ["$-16t^2 + 64t > 48$ becomes $t^2 - 4t + 3 < 0$."], why: "$(t - 1)(t - 3) < 0$ holds between 1 and 3." }
    ]
  });
  /* ================================================================ Skills */
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  var SKILLS = [
    { id: "a2u9-sqrt", title: "Use the Square Root Property", lesson: 2,
      gen: function (R) {
        var p = R.nz(-7, 7), q = R.int(1, 9);
        return { type: "numbers", prompt: "Solve. Give both solutions. $$(" + poly([[1, "x"], [p, ""]]) + ")^2 = " + q * q + "$$", answer: [q - p, -q - p], placeholder: "e.g. −3, 5",
          hints: ["$" + poly([[1, "x"], [p, ""]]) + " = " + q + "$ or $" + poly([[1, "x"], [p, ""]]) + " = -" + q + "$."],
          why: "$" + poly([[1, "x"], [p, ""]]) + " = \\pm " + q + "$, so $x = " + (q - p) + "$ or $x = " + (-q - p) + "$." };
      } },
    { id: "a2u9-complete", title: "Complete the square", lesson: 3,
      gen: function (R) {
        var h = R.nz(-9, 9), b = 2 * h, ans = h * h;
        return { type: "num", prompt: "Which number completes the square? $$x^2 " + signed(b) + "x + \\square$$", answer: ans,
          near: near(ans, [{ v: Math.abs(h), fb: "That is half of " + Math.abs(b) + ". Now square it." }, { v: b * b, fb: "Halve the coefficient first, then square." }]),
          hints: ["Half of $" + b + "$, squared."], why: "$\\left(\\frac{" + b + "}{2}\\right)^2 = " + ans + "$, giving $(" + poly([[1, "x"], [h, ""]]) + ")^2$." };
      } },
    { id: "a2u9-formula", title: "Use the Quadratic Formula", lesson: 4,
      gen: function (R) {
        var a = R.pick([1, 1, 2, 3]), r1 = R.int(-6, 6), r2 = R.int(-6, 6);
        if (r1 === r2) r2 = r1 + 1;
        var b = -a * (r1 + r2), c = a * r1 * r2, D = b * b - 4 * a * c;
        return { type: "numbers", prompt: "Solve with the Quadratic Formula. Give both solutions. $$" + quad(a, b, c) + " = 0$$", answer: [r1, r2], placeholder: "e.g. −3, 4",
          hints: ["$a = " + a + "$, $b = " + b + "$, $c = " + c + "$. The discriminant is $" + D + "$."],
          why: "$x = \\frac{" + (-b) + " \\pm \\sqrt{" + D + "}}{" + 2 * a + "} = \\frac{" + (-b) + " \\pm " + Math.round(Math.sqrt(D)) + "}{" + 2 * a + "}$, so $x = " + Math.max(r1, r2) + "$ or $x = " + Math.min(r1, r2) + "$." };
      } },
    { id: "a2u9-discriminant", title: "Use the discriminant", lesson: 4,
      gen: function (R) {
        var a = R.int(1, 3), b = R.int(-7, 7), c = R.int(-5, 6), D = b * b - 4 * a * c;
        var right = D > 0 ? "Two real solutions" : D === 0 ? "One real solution" : "Two complex solutions";
        var why = "$b^2 - 4ac = " + b * b + " - " + (4 * a * c < 0 ? "(" + 4 * a * c + ")" : 4 * a * c) + " = " + D + "$, which is " + (D > 0 ? "positive" : D === 0 ? "zero" : "negative") + ".";
        return mc(R, { prompt: "How many solutions, and of what kind? $$" + quad(a, b, c) + " = 0$$", right: right,
          wrong: ["Two real solutions", "One real solution", "Two complex solutions"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: why }; }), keep: true,
          hints: ["Work out $b^2 - 4ac$."], why: why });
      } },
    { id: "a2u9-form", title: "Solve an equation in quadratic form", lesson: 5,
      gen: function (R) {
        var p = R.int(1, 3), q = R.int(p + 1, 5);
        return { type: "numbers", prompt: "Solve. Give all four solutions. $$x^4 - " + (p * p + q * q) + "x^2 + " + p * p * q * q + " = 0$$", answer: [-q, -p, p, q], placeholder: "e.g. −2, −1, 1, 2",
          hints: ["Let $u = x^2$: $u^2 - " + (p * p + q * q) + "u + " + p * p * q * q + " = 0$."],
          why: "$u = " + p * p + "$ or $u = " + q * q + "$, so $x = \\pm " + p + "$ or $x = \\pm " + q + "$." };
      } },
    { id: "a2u9-vertex", title: "Find the vertex of a parabola", lesson: 7,
      gen: function (R) {
        var a = R.pick([1, 1, -1, 2]), h = R.nz(-4, 4), k = R.int(-5, 5), b = -2 * a * h, c = a * h * h + k;
        return { type: "pair", prompt: "Find the vertex of $f(x) = " + quad(a, b, c) + "$. Type it as $(x, y)$.", answer: [h, k],
          near: [{ v: [-h, k], fb: "The axis is $x = -\\frac{b}{2a}$: mind the minus sign in front." }, { v: [h, c], fb: "The $x$ is right. Now substitute it into $f$ to find the height." }],
          hints: ["$x = -\\frac{b}{2a} = -\\frac{" + b + "}{" + 2 * a + "}$. Then find $f$ of that."],
          why: "$x = " + h + "$, and $f(" + h + ") = " + k + "$." };
      } },
    { id: "a2u9-vertexform", title: "Read a function in vertex form", lesson: 8,
      gen: function (R) {
        var a = R.pick([1, 2, -1, -2, 3]), h = R.nz(-6, 6), k = R.nz(-6, 6);
        return { type: "pair", prompt: "What is the vertex of $" + vform(a, h, k) + "$? Type it as $(x, y)$.", answer: [h, k],
          near: [{ v: [-h, k], fb: "The sign inside the parentheses is the opposite of $h$: $(x - h)^2$." }, { v: [k, h], fb: "$h$ comes first: it is the $x$-coordinate." }],
          hints: ["Vertex form is $a(x - h)^2 + k$, with vertex $(h, k)$."], why: "$h = " + h + "$ and $k = " + k + "$." };
      } },
    { id: "a2u9-inequality", title: "Solve a quadratic inequality", lesson: 9,
      gen: function (R) {
        var r1 = R.int(-6, 3), r2 = r1 + R.int(1, 6), neg = R.chance(0.5), strict = R.chance(0.5);
        var sym = neg ? (strict ? "<" : "\\le") : (strict ? ">" : "\\ge"), o = strict ? ["(", ")"] : ["[", "]"];
        var inside = "$" + o[0] + r1 + ", " + r2 + o[1] + "$", outside = "$(-\\infty, " + r1 + o[1] + " \\cup " + o[0] + r2 + ", \\infty)$";
        return mc(R, { prompt: "Solve. $$" + quad(1, -(r1 + r2), r1 * r2) + " " + sym + " 0$$", right: neg ? inside : outside,
          wrong: [{ t: neg ? outside : inside, fb: "Test a value between $" + r1 + "$ and $" + r2 + "$: there the expression is negative." },
                  { t: strict ? (neg ? "$[" + r1 + ", " + r2 + "]$" : "$(-\\infty, " + r1 + "] \\cup [" + r2 + ", \\infty)$") : (neg ? "$(" + r1 + ", " + r2 + ")$" : "$(-\\infty, " + r1 + ") \\cup (" + r2 + ", \\infty)$"), fb: strict ? "A strict inequality leaves the critical points out." : "This inequality includes the points where the expression is 0." }],
          hints: ["The critical points are $" + r1 + "$ and $" + r2 + "$. Test a value in each interval."],
          why: "The parabola opens upward, so the expression is negative between $" + r1 + "$ and $" + r2 + "$ and positive outside." });
      } }
  ];
  L.unit("alg2", 9, {
    title: "Quadratic Equations and Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "The Square Root Property, completing the square, the Quadratic Formula, and quadratic form.",
        skills: ["a2u9-sqrt", "a2u9-complete", "a2u9-formula", "a2u9-discriminant", "a2u9-form"], per: 2 },
      { title: "Quiz 2", after: 9, blurb: "Vertices, vertex form, and quadratic inequalities.",
        skills: ["a2u9-vertex", "a2u9-vertexform", "a2u9-inequality"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:9", {
    2: { name: "Square Root Property", frame: "If $x^2 = k$, then $x = $ [[$\\pm\\sqrt{k}$]]. First [[isolate]] the squared term. A positive $k$ gives [[two]] real solutions, and a negative $k$ gives two [[complex]] ones.",
         chips: ["one", "$\\sqrt{k}$"], fb: { "$\\sqrt{k}$": "That is only one of the two roots. $-\\sqrt{k}$ squares to $k$ as well." } },
    3: { name: "Completing the square", frame: "To complete the square for $x^2 + bx$, add [[$(\\frac{b}{2})^2$]]. In an equation, add it to [[both sides]]. The left side then factors as a [[binomial squared]].",
         chips: ["$b^2$", "one side"] },
    4: { name: "Quadratic Formula", frame: "$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. The [[discriminant]], $b^2 - 4ac$, tells the story: positive means [[two]] real solutions, zero means [[one]], and negative means two [[complex]] solutions.",
         chips: ["coefficient", "no"] },
    5: { name: "Quadratic form", frame: "An equation is in quadratic form if a substitution [[$u$]] turns it into $au^2 + bu + c = 0$. Solve for $u$, then [[substitute back]] and solve for the [[original]] variable.",
         chips: ["factor", "new"] },
    6: { name: "Quadratic applications", frame: "Translate the problem into a [[quadratic]] equation and solve it. It usually gives [[two]] solutions, so [[reject]] any that makes no sense, such as a negative length.",
         chips: ["linear", "keep"] },
    7: { name: "Parabola properties", frame: "The graph of $f(x) = ax^2 + bx + c$ opens upward when $a$ is [[positive]]. Its axis of symmetry is $x = $ [[$-\\frac{b}{2a}$]]. The [[vertex]] lies on the axis and is the minimum or maximum point.",
         chips: ["negative", "$\\frac{b}{2a}$"] },
    8: { name: "Vertex form", frame: "In $f(x) = a(x - h)^2 + k$ the vertex is [[$(h, k)$]]. $h$ shifts the graph [[left or right]], $k$ shifts it [[up or down]], and a negative $a$ [[flips]] it.",
         chips: ["$(-h, k)$", "stretches"] },
    9: { name: "Quadratic inequalities", frame: "The solutions of the related [[equation]] are the critical points. They split the line into [[intervals]], and the sign cannot change inside one. [[Test]] a value in each.",
         chips: ["vertex", "halves"] }
  });
})();
