/* ==========================================================================
   Algebra II — Unit 7: Rational Expressions and Functions. See lab/core.js
   for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 7, section for section:
   the readiness check, then 7.1 to 7.6. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   Fractions of polynomials behave like fractions of numbers: multiply and
   divide (7.1), add and subtract (7.2), complex fractions (7.3). Then
   equations (7.4), what they model (7.5), and inequalities (7.6).

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
    blurb: "Book: Chapter 7 Be Prepared · Number fractions, factoring, and a quick equation.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · Number fractions", prompt: "Simplify $\\frac{18}{24}$.",
        options: [{ t: "$\\frac{3}{4}$" }, { t: "$\\frac{9}{12}$", fb: "9 and 12 still share a factor of 3." }, { t: "$\\frac{2}{3}$", fb: "Divide the top and the bottom by 6." }],
        answer: 0, skill: "Simplify a fraction", hints: ["Divide the top and the bottom by their greatest common factor."], why: "$\\frac{18 \\div 6}{24 \\div 6} = \\frac{3}{4}$." },
      { type: "num", prompt: "What is $\\frac{1}{2} + \\frac{1}{3}$? (Type it like 5/6.)", answer: 5 / 6, tol: 1e-9, shown: "5/6", skill: "Add and subtract fractions",
        near: [{ v: 0.4, tol: 1e-9, fb: "Denominators are not added. Use the LCD, 6." }], hints: ["$\\frac{3}{6} + \\frac{2}{6}$."], why: "$\\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$." },
      { type: "choice", kicker: "Check 2 · Factoring", prompt: "Factor $x^2 - 9$.",
        options: [{ t: "$(x - 3)(x + 3)$" }, { t: "$(x - 3)^2$", fb: "$(x - 3)^2$ has a middle term, $-6x$." }, { t: "$(x - 9)(x + 1)$", fb: "That has a middle term, $-8x$." }],
        answer: 0, skill: "Factor special products", hints: ["A difference of squares."], why: "$x^2 - 3^2 = (x - 3)(x + 3)$." },
      { type: "choice", prompt: "Factor $x^2 + 5x + 6$.",
        options: [{ t: "$(x + 2)(x + 3)$" }, { t: "$(x + 1)(x + 6)$", fb: "$1 + 6 = 7$, not 5." }, { t: "$(x + 5)(x + 1)$", fb: "$5 \\cdot 1 = 5$, not 6." }],
        answer: 0, skill: "Factor a trinomial", hints: ["Two numbers that multiply to 6 and add to 5."], why: "$2 \\cdot 3 = 6$ and $2 + 3 = 5$." },
      { type: "numbers", kicker: "Check 3 · Solve", prompt: "Solve $x^2 - 4 = 0$. Give both solutions.",
        answer: [-2, 2], skill: "Solve by factoring", placeholder: "e.g. −3, 3",
        hints: ["$(x - 2)(x + 2) = 0$."], why: "$x = 2$ or $x = -2$." },
      { type: "num", prompt: "Solve $\\frac{x}{4} = 3$.", pre: "$x =$", answer: 12, skill: "Solve a linear equation",
        near: [{ v: 0.75, tol: 1e-9, fb: "Multiply both sides by 4." }], hints: ["Multiply both sides by 4."], why: "$x = 12$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 7.1**. If **check 1** slipped, see lesson 1.3. If **check 2** slipped, Unit 6 is the place: every lesson here begins by factoring. If **check 3** slipped, see lesson 6.5.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================== 7.1 · Multiply and divide rational expressions */
  var HOW_7_1 = [["Factor", "Factor every numerator and denominator completely."],
                 ["Multiply", "Write one fraction: numerators together, denominators together."],
                 ["Divide out", "Divide out the factors common to the top and the bottom."]];
  var HOW_7_1D = [["Flip", "Rewrite the division as multiplying by the reciprocal of the second expression."],
                  ["Factor", "Factor every numerator and denominator completely."],
                  ["Divide out", "Multiply, then divide out the common factors."]];
  LESSONS.push({
    title: "Multiply and divide rational expressions",
    blurb: "Book 7.1 · Where a rational expression is undefined, simplifying, multiplying and dividing.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A fraction is undefined when its denominator is 0. So $\\frac{5}{x - 3}$ is undefined for one value of $x$. Which one?",
        pre: "$x =$", answer: 3, skill: "Undefined values",
        near: [{ v: -3, fb: "$-3 - 3 = -6$, not 0." }, { v: 0, fb: "At $x = 0$ the denominator is $-3$. Solve $x - 3 = 0$." }],
        hints: ["Solve $x - 3 = 0$."], why: "At $x = 3$ the denominator is 0." },
      { type: "learn", kicker: "The idea",
        prompt: "A **rational expression** is a fraction of polynomials, and it behaves like a fraction of numbers. To simplify or multiply, **factor** first, then divide out common **factors**. Terms can never be divided out.",
        scene: { type: "method", how: HOW_7_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a multiplication. $$\\frac{3x}{x^2 - x - 6} \\cdot \\frac{x^2 - 4}{9x^2}$$",
        scene: { type: "walk", how: HOW_7_1, rows: [
          { step: 1, m: "\\frac{3x}{x^2 - x - 6} \\cdot \\frac{x^2 - 4}{9x^2}", say: "Nothing can be divided out until everything is written as a product." },
          { step: 1, m: "\\frac{3x}{(x - 3)(x + 2)} \\cdot \\frac{(x - 2)(x + 2)}{9x^2}", say: "A trinomial and a difference of squares, both factored." },
          { step: 2, m: "\\frac{3x(x - 2)(x + 2)}{9x^2(x - 3)(x + 2)}", say: "One fraction: tops together, bottoms together." },
          { step: 3, m: "\\frac{x - 2}{3x(x - 3)}", say: "$3x$ divides into $9x^2$, and $(x + 2)$ divides out.",
            ask: { prompt: "Which factors are common to the top and the bottom?", answer: 0,
                   options: [{ t: "$3x$ and $(x + 2)$" }, { t: "$(x - 2)$ and $(x - 3)$", fb: "$(x - 2)$ is only on top, and $(x - 3)$ only on the bottom." }, { t: "$x$ only", fb: "$3x$ divides both $3x$ and $9x^2$, and $(x + 2)$ is on both sides too." }] } }] },
        gate: true, then: "Simplifying a single rational expression is the same: factor, then divide out." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$\\frac{x^2 - 16}{x + 3} \\cdot \\frac{x^2 + 3x}{x - 4}$$",
        how: HOW_7_1, skill: "Multiply rational expressions",
        steps: [
          { step: 1, ask: "Factor $x^2 - 16$.", type: "choice", answer: 0,
            options: [{ t: "$(x - 4)(x + 4)$" }, { t: "$(x - 4)^2$", fb: "$(x - 4)^2$ has a middle term. A difference of squares factors into conjugates." }, { t: "$(x - 8)(x + 2)$", fb: "That has a middle term, $-6x$." }],
            m: "\\frac{(x - 4)(x + 4)}{x + 3} \\cdot \\frac{x^2 + 3x}{x - 4}", say: "A difference of squares." },
          { step: 1, ask: "Factor $x^2 + 3x$.", type: "choice", answer: 0,
            options: [{ t: "$x(x + 3)$" }, { t: "$(x + 3)(x + 1)$", fb: "That is $x^2 + 4x + 3$. Take out the common factor $x$." }],
            m: "\\frac{(x - 4)(x + 4)}{x + 3} \\cdot \\frac{x(x + 3)}{x - 4}", say: "A common factor of $x$." },
          { step: 2, ask: "Write it as one fraction.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{x(x - 4)(x + 4)(x + 3)}{(x + 3)(x - 4)}$" }, { t: "$\\frac{(x - 4)(x + 4)(x - 4)}{x(x + 3)(x + 3)}$", fb: "That flips the second fraction: it would be a division." }],
            m: "\\frac{x(x - 4)(x + 4)(x + 3)}{(x + 3)(x - 4)}", say: "Tops together, bottoms together." },
          { step: 3, ask: "Divide out the common factors.", type: "choice", answer: 0,
            options: [{ t: "$x(x + 4)$" }, { t: "$x + 4$", fb: "The $x$ has nothing to divide out with. It stays." }, { t: "$\\frac{x(x + 4)}{(x + 3)(x - 4)}$", fb: "$(x + 3)$ and $(x - 4)$ are on both the top and the bottom: they divide out." }],
            m: "x(x + 4)", say: "$(x - 4)$ and $(x + 3)$ are gone." }],
        why: "Factor, multiply, divide out. Now simplify one on your own." },
      { type: "choice", kicker: "On your own", prompt: "Simplify $\\frac{x^2 + 5x + 6}{x^2 - 4}$.",
        options: [{ t: "$\\frac{x + 3}{x - 2}$" }, { t: "$\\frac{5x + 6}{-4}$", fb: "$x^2$ is a term, not a factor. Only factors divide out." }, { t: "$\\frac{x + 3}{x + 2}$", fb: "$(x + 2)$ is the factor that divides out. $(x - 2)$ is left on the bottom." }],
        answer: 0, skill: "Simplify a rational expression", hints: ["$\\frac{(x + 2)(x + 3)}{(x - 2)(x + 2)}$."], why: "$(x + 2)$ divides out, leaving $\\frac{x + 3}{x - 2}$." },
      { type: "numbers", prompt: "$\\frac{x + 1}{x^2 - 9}$ is undefined for two values of $x$. Give both.",
        answer: [-3, 3], skill: "Undefined values", placeholder: "e.g. −2, 2",
        hints: ["Solve $x^2 - 9 = 0$."], why: "$(x - 3)(x + 3) = 0$ at $x = 3$ and $x = -3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "To divide, multiply by the reciprocal, as with number fractions. $$\\frac{x + 5}{x - 1} \\div \\frac{x^2 - 25}{3x - 3}$$",
        scene: { type: "walk", how: HOW_7_1D, rows: [
          { step: 1, m: "\\frac{x + 5}{x - 1} \\cdot \\frac{3x - 3}{x^2 - 25}", say: "Flip the second expression and multiply." },
          { step: 2, m: "\\frac{x + 5}{x - 1} \\cdot \\frac{3(x - 1)}{(x - 5)(x + 5)}", say: "Factor: a GCF of 3, and a difference of squares." },
          { step: 3, m: "\\frac{3(x + 5)(x - 1)}{(x - 1)(x - 5)(x + 5)}", say: "One fraction." },
          { step: 3, m: "\\frac{3}{x - 5}", say: "$(x + 5)$ and $(x - 1)$ divide out." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "The **domain** of a rational function leaves out every value that makes the denominator 0. What is the domain of $R(x) = \\frac{2x}{x^2 - 5x}$?",
        options: [{ t: "All real numbers except 0 and 5" }, { t: "All real numbers except 5", fb: "$x^2 - 5x = x(x - 5)$ is also 0 at $x = 0$." }, { t: "All real numbers except 0", fb: "$x^2 - 5x = x(x - 5)$ is also 0 at $x = 5$." }],
        answer: 0, skill: "Undefined values", hints: ["Factor the denominator: $x(x - 5)$."], why: "$x(x - 5) = 0$ at $x = 0$ and at $x = 5$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the simplifying **first** goes wrong.",
        lines: ["\\frac{x + 6}{x + 2}", "\\frac{6}{2}", "3"], answer: 1, fix: "\\frac{x + 6}{x + 2}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Simplify a rational expression",
        hints: ["Is $x$ a factor of the numerator, or a term of it?"],
        why: "$x$ is a **term** of each, not a factor, so it cannot be divided out. Test $x = 2$: $\\frac{8}{4} = 2$, not 3. The expression is already in simplest form." },
      { type: "num", kicker: "Use it", prompt: "Making $x$ phone cases costs $5x + 200$ dollars, so the average cost of one case is $\\frac{5x + 200}{x}$. What is the average cost when $x = 50$?",
        pre: "$\\$$", answer: 9, skill: "Rational functions",
        near: [{ v: 205, fb: "Substitute 50 on the bottom as well, then divide." }, { v: 450, fb: "That is the total cost. Divide by the 50 cases." }],
        hints: ["$\\frac{5(50) + 200}{50}$."], why: "$\\frac{450}{50} = 9$." }
    ]
  });

  /* ===================== 7.2 · Add and subtract rational expressions */
  var HOW_7_2 = [["LCD", "Factor each denominator and build the least common denominator."],
                 ["Rewrite", "Rewrite each expression with the LCD: multiply top and bottom by what is missing."],
                 ["Combine", "Add or subtract the numerators over the LCD."],
                 ["Simplify", "Factor the numerator and divide out any common factor."]];
  LESSONS.push({
    title: "Add and subtract rational expressions",
    blurb: "Book 7.2 · Common denominators, opposite denominators, and building an LCD.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Add $\\frac{2}{x} + \\frac{5}{x}$.",
        options: [{ t: "$\\frac{7}{x}$" }, { t: "$\\frac{7}{2x}$", fb: "The denominators are not added. The pieces stay the same size." }, { t: "$\\frac{10}{x}$", fb: "The numerators are added: $2 + 5$." }],
        answer: 0, skill: "Add rational expressions", hints: ["Same denominator: add the numerators and keep it."], why: "$\\frac{2 + 5}{x} = \\frac{7}{x}$." },
      { type: "learn", kicker: "The idea",
        prompt: "Rational expressions add like number fractions: they need a **common denominator** first. Build the LCD from the factors of the denominators, rewrite each expression with it, then combine the numerators.",
        scene: { type: "method", how: HOW_7_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an addition with unlike denominators. $$\\frac{3}{x - 3} + \\frac{2}{x + 2}$$",
        scene: { type: "walk", how: HOW_7_2, rows: [
          { step: 1, m: "\\text{LCD} = (x - 3)(x + 2)", say: "The denominators share no factor, so the LCD is their product." },
          { step: 2, m: "\\frac{3(x + 2)}{(x - 3)(x + 2)} + \\frac{2(x - 3)}{(x - 3)(x + 2)}", say: "Multiply the top and bottom of each fraction by the factor it is missing.",
            ask: { prompt: "Which factor of the LCD is the first fraction, $\\frac{3}{x - 3}$, missing?", answer: 0,
                   options: [{ t: "$(x + 2)$" }, { t: "$(x - 3)$", fb: "It already has $(x - 3)$ in its denominator." }] } },
          { step: 3, m: "\\frac{3x + 6 + 2x - 6}{(x - 3)(x + 2)}", say: "Distribute in the numerators, and write them over the LCD." },
          { step: 4, m: "\\frac{5x}{(x - 3)(x + 2)}", say: "Combine like terms. Nothing divides out." }] },
        gate: true, then: "Leave the denominator factored: it shows at a glance whether anything divides out." },
      { type: "guided", kicker: "Together",
        prompt: "Now a subtraction. $$\\frac{5}{x + 1} - \\frac{2}{x}$$",
        how: HOW_7_2, skill: "Add rational expressions",
        steps: [
          { step: 1, ask: "What is the LCD of $x + 1$ and $x$?", type: "choice", answer: 0,
            options: [{ t: "$x(x + 1)$" }, { t: "$x + 1$", fb: "$x$ does not divide $x + 1$." }, { t: "$2x + 1$", fb: "An LCD is a product of factors, not a sum." }],
            m: "\\text{LCD} = x(x + 1)", say: "No common factor, so multiply them." },
          { step: 2, ask: "Rewrite $\\frac{5}{x + 1}$ with the LCD.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{5x}{x(x + 1)}$" }, { t: "$\\frac{5}{x(x + 1)}$", fb: "The top must be multiplied by $x$ as well." }],
            m: "\\frac{5x}{x(x + 1)} - \\frac{2(x + 1)}{x(x + 1)}", say: "Each fraction multiplied by what it was missing." },
          { step: 3, ask: "Subtract the numerators: $5x - 2(x + 1)$.", type: "choice", answer: 0,
            options: [{ t: "$3x - 2$" }, { t: "$3x + 2$", fb: "The minus sign reaches both terms: $-2x - 2$." }, { t: "$7x + 2$", fb: "This is a subtraction: $5x - 2x$." }],
            m: "\\frac{3x - 2}{x(x + 1)}", say: "$5x - 2x - 2$." },
          { step: 4, ask: "Can anything be divided out?", type: "choice", answer: 0,
            options: [{ t: "No: $3x - 2$ shares no factor with $x(x + 1)$" }, { t: "Yes: the $x$", fb: "The $x$ on top is part of the term $3x$, not a factor of the whole numerator." }],
            m: "\\frac{3x - 2}{x(x + 1)}", say: "Already in simplest form." }],
        why: "LCD, rewrite, combine, simplify. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Add $\\frac{x}{x + 4} + \\frac{4}{x + 4}$.",
        options: [{ t: "$1$" }, { t: "$\\frac{x + 4}{2x + 8}$", fb: "Same denominator: keep it, don't add it." }, { t: "$\\frac{4x}{x + 4}$", fb: "The numerators are added, not multiplied." }],
        answer: 0, skill: "Add rational expressions", hints: ["$\\frac{x + 4}{x + 4}$."], why: "$\\frac{x + 4}{x + 4} = 1$." },
      { type: "choice", prompt: "What is the LCD of $\\frac{1}{x^2 - 4}$ and $\\frac{3}{x^2 + 2x}$?",
        options: [{ t: "$x(x - 2)(x + 2)$" }, { t: "$x(x - 2)(x + 2)^2$", fb: "$(x + 2)$ appears once in each denominator, so the LCD needs it only once." }, { t: "$(x^2 - 4)(x^2 + 2x)$", fb: "That is a common denominator, but not the least: it counts $(x + 2)$ twice." }],
        answer: 0, skill: "Least common denominator", hints: ["Factor: $(x - 2)(x + 2)$ and $x(x + 2)$."], why: "Each factor the most times it appears in either one: $x$, $(x - 2)$, $(x + 2)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the denominators are **opposites**, one of them only needs its signs changed. $$\\frac{4x}{x - 5} + \\frac{20}{5 - x}$$",
        scene: { type: "walk", how: HOW_7_2, rows: [
          { step: 1, m: "5 - x = -(x - 5)", say: "The denominators are opposites. The LCD is $x - 5$." },
          { step: 2, m: "\\frac{4x}{x - 5} + \\frac{-20}{x - 5}", say: "Multiply the top and bottom of the second fraction by $-1$." },
          { step: 3, m: "\\frac{4x - 20}{x - 5}", say: "Add the numerators." },
          { step: 4, m: "\\frac{4(x - 5)}{x - 5} = 4", say: "Factor the top, and the whole denominator divides out." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Subtract and simplify: $\\frac{x^2}{x - 3} - \\frac{9}{x - 3}$.",
        options: [{ t: "$x + 3$" }, { t: "$\\frac{x^2 - 9}{x - 3}$", fb: "Right so far, but the numerator factors: $(x - 3)(x + 3)$." }, { t: "$x - 3$", fb: "$(x - 3)$ is the factor that divides out. $(x + 3)$ is what is left." }],
        answer: 0, skill: "Add rational expressions", hints: ["$\\frac{x^2 - 9}{x - 3}$, then factor the top."], why: "$\\frac{(x - 3)(x + 3)}{x - 3} = x + 3$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the addition **first** goes wrong.",
        lines: ["\\frac{3}{x} + \\frac{2}{x + 1}", "\\frac{3 + 2}{x + x + 1}", "\\frac{5}{2x + 1}"], answer: 1, fix: "\\frac{3(x + 1)}{x(x + 1)} + \\frac{2x}{x(x + 1)}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Add rational expressions",
        hints: ["Is that how $\\frac{1}{2} + \\frac{1}{3}$ is added?"],
        why: "Denominators are never added. With the LCD $x(x + 1)$ the sum is $\\frac{5x + 3}{x(x + 1)}$." },
      { type: "choice", kicker: "Use it", prompt: "One pipe fills $\\frac{1}{x}$ of a tank each hour, and a slower one fills $\\frac{1}{x + 2}$. What fraction do they fill together in an hour?",
        options: [{ t: "$\\frac{2x + 2}{x(x + 2)}$" }, { t: "$\\frac{2}{2x + 2}$", fb: "Denominators are not added. Use the LCD, $x(x + 2)$." }, { t: "$\\frac{1}{x(x + 2)}$", fb: "That multiplies the fractions. The rates add." }],
        answer: 0, skill: "Add rational expressions", hints: ["$\\frac{x + 2}{x(x + 2)} + \\frac{x}{x(x + 2)}$."], why: "$\\frac{(x + 2) + x}{x(x + 2)} = \\frac{2x + 2}{x(x + 2)}$." }
    ]
  });

  /* ==================== 7.3 · Simplify complex rational expressions */
  var HOW_7_3 = [["LCD", "Find the LCD of all the small fractions inside."],
                 ["Multiply", "Multiply the main numerator and the main denominator by that LCD."],
                 ["Simplify", "Distribute, then factor and divide out."]];
  var HOW_7_3D = [["Each part", "Simplify the main numerator and the main denominator into single fractions."],
                  ["Division", "Rewrite the main fraction bar as a division."],
                  ["Divide", "Multiply by the reciprocal, factor, and divide out."]];
  LESSONS.push({
    title: "Simplify complex rational expressions",
    blurb: "Book 7.3 · Fractions inside fractions: by the LCD, or by writing a division.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Simplify $\\frac{\\frac{1}{2}}{\\frac{3}{4}}$. (Type it like 2/3.)", answer: 2 / 3, tol: 1e-9, shown: "2/3", skill: "Complex fractions",
        near: [{ v: 0.375, tol: 1e-9, fb: "That multiplies them. The main bar means divide: $\\frac{1}{2} \\cdot \\frac{4}{3}$." }],
        hints: ["$\\frac{1}{2} \\div \\frac{3}{4}$."], why: "$\\frac{1}{2} \\cdot \\frac{4}{3} = \\frac{4}{6} = \\frac{2}{3}$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **complex rational expression** has fractions inside a fraction. Multiply the main top and the main bottom by the LCD of all the small fractions: every small denominator divides out at once.",
        scene: { type: "method", how: HOW_7_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the LCD clear every small fraction. $$\\frac{\\frac{1}{x} + \\frac{1}{2}}{\\frac{1}{x} - \\frac{1}{2}}$$",
        scene: { type: "walk", how: HOW_7_3, rows: [
          { step: 1, m: "\\text{LCD} = 2x", say: "The small denominators are $x$ and 2." },
          { step: 2, m: "\\frac{2x(\\frac{1}{x} + \\frac{1}{2})}{2x(\\frac{1}{x} - \\frac{1}{2})}", say: "Multiplying the top and the bottom by the same thing does not change the value." },
          { step: 3, m: "\\frac{2x \\cdot \\frac{1}{x} + 2x \\cdot \\frac{1}{2}}{2x \\cdot \\frac{1}{x} - 2x \\cdot \\frac{1}{2}}", say: "Distribute.",
            ask: { prompt: "What is $2x \\cdot \\frac{1}{x}$?", answer: 0,
                   options: [{ t: "$2$" }, { t: "$2x^2$", fb: "$\\frac{1}{x}$ divides by $x$: the $x$s divide out." }, { t: "$x$", fb: "$2x \\cdot \\frac{1}{x} = \\frac{2x}{x} = 2$." }] } },
          { step: 3, m: "\\frac{2 + x}{2 - x}", say: "No small fractions are left." }] },
        gate: true, then: "One multiplication replaced four separate fraction steps." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$\\frac{1 + \\frac{3}{x}}{1 - \\frac{9}{x^2}}$$",
        how: HOW_7_3, skill: "Complex rational expressions",
        steps: [
          { step: 1, ask: "The small denominators are $x$ and $x^2$. What is their LCD?", type: "choice", answer: 0,
            options: [{ t: "$x^2$" }, { t: "$x^3$", fb: "$x^2$ is already a multiple of $x$." }, { t: "$x$", fb: "$x$ is not a multiple of $x^2$." }],
            m: "\\text{LCD} = x^2", say: "The higher power." },
          { step: 2, ask: "Multiply the top, $1 + \\frac{3}{x}$, by $x^2$.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 3x$" }, { t: "$x^2 + 3$", fb: "$x^2 \\cdot \\frac{3}{x} = 3x$: one $x$ is left." }, { t: "$1 + 3x$", fb: "The 1 is multiplied by $x^2$ as well." }],
            m: "\\frac{x^2 + 3x}{x^2 - 9}", say: "The bottom becomes $x^2 - 9$." },
          { step: 3, ask: "Factor the top and the bottom.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{x(x + 3)}{(x - 3)(x + 3)}$" }, { t: "$\\frac{x(x + 3)}{(x - 3)^2}$", fb: "$x^2 - 9$ is a difference of squares: $(x - 3)(x + 3)$." }],
            m: "\\frac{x(x + 3)}{(x - 3)(x + 3)}", say: "A GCF on top, a difference of squares below." },
          { step: 3, ask: "Divide out the common factor.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{x}{x - 3}$" }, { t: "$\\frac{x}{x + 3}$", fb: "$(x + 3)$ is the factor that divides out." }],
            m: "\\frac{x}{x - 3}", say: "$(x + 3)$ is gone." }],
        why: "LCD, multiply, simplify. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "Simplify $\\frac{\\frac{2}{x}}{\\frac{6}{x^2}}$.",
        options: [{ t: "$\\frac{x}{3}$" }, { t: "$\\frac{12}{x^3}$", fb: "That multiplies them. The main bar means divide." }, { t: "$\\frac{3}{x}$", fb: "$\\frac{2}{x} \\cdot \\frac{x^2}{6}$: the $x^2$ ends up on top." }],
        answer: 0, skill: "Complex rational expressions", hints: ["Multiply the top and the bottom by $x^2$."], why: "$\\frac{2x}{6} = \\frac{x}{3}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The other method: make each part a single fraction, then divide. $$\\frac{\\frac{1}{x} + \\frac{1}{y}}{\\frac{x}{y} - \\frac{y}{x}}$$",
        scene: { type: "walk", how: HOW_7_3D, rows: [
          { step: 1, m: "\\frac{\\frac{y + x}{xy}}{\\frac{x^2 - y^2}{xy}}", say: "Top: $\\frac{1}{x} + \\frac{1}{y} = \\frac{y + x}{xy}$. Bottom: $\\frac{x}{y} - \\frac{y}{x} = \\frac{x^2 - y^2}{xy}$." },
          { step: 2, m: "\\frac{y + x}{xy} \\div \\frac{x^2 - y^2}{xy}", say: "The main bar is a division." },
          { step: 3, m: "\\frac{x + y}{xy} \\cdot \\frac{xy}{(x - y)(x + y)}", say: "Multiply by the reciprocal, and factor the difference of squares." },
          { step: 3, m: "\\frac{1}{x - y}", say: "$xy$ and $(x + y)$ divide out." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Simplify $\\frac{1 - \\frac{1}{x}}{1 + \\frac{1}{x}}$.",
        options: [{ t: "$\\frac{x - 1}{x + 1}$" }, { t: "$-1$", fb: "The 1s cannot be divided out: they are terms. Multiply the top and the bottom by $x$." }, { t: "$\\frac{x + 1}{x - 1}$", fb: "The top is $1 - \\frac{1}{x}$, which becomes $x - 1$." }],
        answer: 0, skill: "Complex rational expressions", hints: ["Multiply the top and the bottom by $x$."], why: "$\\frac{x - 1}{x + 1}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To simplify $\\frac{\\frac{1}{x} + \\frac{1}{3}}{\\frac{1}{x}}$, Ed multiplies only the **top** by $3x$. What is wrong?",
        options: [{ t: "The top and the bottom must both be multiplied by the LCD, or the value changes." },
                  { t: "The LCD should be $x + 3$.", fb: "An LCD is a product: $3x$ is right." },
                  { t: "Nothing. Only the top has two fractions.", fb: "Multiplying only the top by $3x$ makes the whole expression $3x$ times larger." }],
        answer: 0, skill: "Complex rational expressions", hints: ["Step 2: what must the LCD multiply?"], why: "Multiplying both by $3x$ gives $\\frac{3 + x}{3}$." },
      { type: "num", kicker: "Use it", prompt: "You drive to a town at **30 mph** and back at **60 mph**. The average speed for the round trip is $\\frac{2}{\\frac{1}{30} + \\frac{1}{60}}$. What is it?",
        post: "mph", answer: 40, skill: "Complex fractions",
        near: [{ v: 45, fb: "That is the plain average. More time is spent at the slower speed, so the true average is lower." }],
        hints: ["Multiply the top and the bottom by 60."], why: "$\\frac{2 \\cdot 60}{2 + 1} = \\frac{120}{3} = 40$." }
    ]
  });
  /* ============================================= 7.4 · Solve rational equations */
  var HOW_7_4 = [["Exclude", "Note any value that makes a denominator zero. It cannot be a solution."],
                 ["LCD", "Find the LCD of all the denominators."],
                 ["Clear", "Multiply both sides by the LCD to clear the fractions."],
                 ["Solve", "Solve the equation that is left."],
                 ["Check", "Discard any solution that was excluded: it is extraneous."]];
  LESSONS.push({
    title: "Solve rational equations",
    blurb: "Book 7.4 · Clearing fractions with the LCD, and catching extraneous solutions.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $\\frac{x}{3} = \\frac{4}{6}$.", pre: "$x =$", answer: 2, skill: "Solve a proportion",
        near: [{ v: 8, fb: "$\\frac{4}{6} = \\frac{2}{3}$, so $\\frac{x}{3} = \\frac{2}{3}$." }], hints: ["Multiply both sides by 3."], why: "$x = 3 \\cdot \\frac{4}{6} = 2$." },
      { type: "learn", kicker: "The idea",
        prompt: "An equation with rational expressions is solved by clearing the fractions: multiply both sides by the LCD. But any value that makes a denominator 0 can never be a solution. If one turns up, it is **extraneous**.",
        scene: { type: "method", how: HOW_7_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a rational equation solved. $$\\frac{1}{x} + \\frac{1}{3} = \\frac{5}{6}$$",
        scene: { type: "walk", how: HOW_7_4, rows: [
          { step: 1, m: "x \\ne 0", say: "$x = 0$ would make the first denominator 0." },
          { step: 2, m: "\\text{LCD} = 6x", say: "The denominators are $x$, 3 and 6." },
          { step: 3, m: "6 + 2x = 5x", say: "Multiply every term by $6x$: $6x \\cdot \\frac{1}{x} = 6$, $6x \\cdot \\frac{1}{3} = 2x$, $6x \\cdot \\frac{5}{6} = 5x$.",
            ask: { prompt: "What is $6x \\cdot \\frac{1}{3}$?", answer: 0,
                   options: [{ t: "$2x$" }, { t: "$18x$", fb: "The 3 is a denominator: $6x \\div 3$." }, { t: "$2$", fb: "The $x$ stays: $\\frac{6x}{3} = 2x$." }] } },
          { step: 4, m: "x = 2", say: "$6 = 3x$." },
          { step: 5, m: "\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}", say: "2 is not the excluded value, and it checks. ✓" }] },
        gate: true, then: "Clearing the fractions turned it into a linear equation." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$\\frac{2}{x + 1} = \\frac{3}{x - 1}$$",
        how: HOW_7_4, skill: "Solve a rational equation",
        steps: [
          { step: 1, ask: "Which values of $x$ must be excluded?", type: "choice", answer: 0,
            options: [{ t: "$-1$ and $1$" }, { t: "Only $1$", fb: "$x = -1$ makes $x + 1$ equal 0 as well." }, { t: "$2$ and $3$", fb: "Those are numerators. Look at where the denominators are 0." }],
            m: "x \\ne -1 \\quad x \\ne 1", say: "Each denominator must not be 0." },
          { step: 2, ask: "What is the LCD?", type: "choice", answer: 0,
            options: [{ t: "$(x + 1)(x - 1)$" }, { t: "$x^2 + 1$", fb: "$(x + 1)(x - 1) = x^2 - 1$." }],
            m: "\\text{LCD} = (x + 1)(x - 1)", say: "The product of the two denominators." },
          { step: 3, ask: "Multiply both sides by the LCD.", type: "choice", answer: 0,
            options: [{ t: "$2(x - 1) = 3(x + 1)$" }, { t: "$2(x + 1) = 3(x - 1)$", fb: "Each side loses its own denominator and keeps the other factor." }],
            m: "2(x - 1) = 3(x + 1)", say: "On the left $(x + 1)$ divides out. On the right $(x - 1)$ does." },
          { step: 4, ask: "Solve $2x - 2 = 3x + 3$.", type: "num", pre: "$x =$", answer: -5, near: [{ v: 5, fb: "$-2 - 3 = -5$, and it equals $x$." }, { v: -1, fb: "Subtract $2x$ and subtract 3: $-5 = x$." }], hint: "Subtract $2x$, then subtract 3.",
            m: "x = -5", say: "$-5 = x$." },
          { step: 5, ask: "Is $-5$ one of the excluded values?", type: "choice", answer: 0,
            options: [{ t: "No: it is the solution" }, { t: "Yes: discard it", fb: "Only $-1$ and $1$ were excluded." }],
            m: "\\frac{2}{-4} = \\frac{3}{-6}", say: "Both sides are $-\\frac{1}{2}$. ✓" }],
        why: "Exclude, LCD, clear, solve, check. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $\\frac{6}{x} = \\frac{3}{4}$.", pre: "$x =$", answer: 8, skill: "Solve a rational equation",
        near: [{ v: 4.5, tol: 1e-9, fb: "Multiply both sides by $4x$: $24 = 3x$." }, { v: 2, fb: "$3x = 24$. Divide by 3." }],
        hints: ["Multiply both sides by $4x$."], why: "$24 = 3x$, so $x = 8$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes the only answer the algebra gives is one that was excluded. $$\\frac{x}{x - 2} = \\frac{2}{x - 2} + 3$$",
        scene: { type: "walk", how: HOW_7_4, rows: [
          { step: 1, m: "x \\ne 2", say: "$x = 2$ makes both denominators 0." },
          { step: 3, m: "x = 2 + 3(x - 2)", say: "Multiply every term by the LCD, $x - 2$." },
          { step: 4, m: "x = 3x - 4", say: "Distribute and combine." },
          { step: 4, m: "x = 2", say: "$-2x = -4$." },
          { step: 5, m: "\\text{no solution}", say: "2 was excluded: it is **extraneous**. The equation has no solution." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Clearing fractions can leave a quadratic. Solve $\\frac{x}{2} = \\frac{8}{x}$. Give both solutions.",
        answer: [-4, 4], skill: "Solve a rational equation", placeholder: "e.g. −3, 3",
        hints: ["Multiply both sides by $2x$: $x^2 = 16$."], why: "$x^2 = 16$, so $x = 4$ or $x = -4$. Neither is excluded." },
      { type: "choice", kicker: "Find the error",
        prompt: "Solving $\\frac{x + 1}{x - 3} = \\frac{4}{x - 3}$, Zed gets $x = 3$ and reports it as the solution. What is wrong?",
        options: [{ t: "$x = 3$ makes the denominators 0. It is extraneous: there is no solution." },
                  { t: "The algebra is wrong: $x$ should be 5.", fb: "$x + 1 = 4$ does give $x = 3$. The trouble is what 3 does to the denominators." },
                  { t: "Nothing. 3 is the solution.", fb: "Put 3 into $x - 3$: the denominator is 0." }],
        answer: 0, skill: "Solve a rational equation", hints: ["Step 1 and step 5 of the method."], why: "The excluded value is 3, so the equation has no solution." },
      { type: "num", kicker: "Use it", prompt: "For the function $f(x) = \\frac{12}{x - 1}$, find the value of $x$ for which $f(x) = 4$.",
        pre: "$x =$", answer: 4, skill: "Rational functions",
        near: [{ v: 3, fb: "$x - 1 = 3$. Add 1." }, { v: 49, fb: "Multiply both sides by $x - 1$: $12 = 4(x - 1)$." }],
        hints: ["$\\frac{12}{x - 1} = 4$, so $12 = 4(x - 1)$."], why: "$x - 1 = 3$, so $x = 4$." }
    ]
  });

  /* ======================= 7.5 · Solve applications with rational equations */
  var HOW_7_5 = [["Model", "Choose the model: a proportion, a work equation, or a variation formula."],
                 ["Set up", "Substitute what you know, and name the unknown."],
                 ["Solve", "Clear the fractions and solve."],
                 ["Answer", "Check that it makes sense, and answer with units."]];
  LESSONS.push({
    title: "Applications with rational equations",
    blurb: "Book 7.5 · Proportions and similar figures, work and motion, and direct and inverse variation.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A **proportion** says two ratios are equal. Solve $\\frac{x}{12} = \\frac{5}{6}$.", pre: "$x =$", answer: 10, skill: "Solve a proportion",
        near: [{ v: 14.4, tol: 1e-9, fb: "Multiply both sides by 12: $x = 12 \\cdot \\frac{5}{6}$." }], hints: ["Multiply both sides by 12."], why: "$x = \\frac{60}{6} = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "Many situations are ratios in disguise. Similar shapes give a **proportion**. People working together **add their rates**. And two quantities may **vary** directly, $y = kx$, or inversely, $y = \\frac{k}{x}$.",
        scene: { type: "method", how: HOW_7_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a work problem: **pump A fills a pool in 6 hours and pump B in 3 hours. How long do they take together?**",
        scene: { type: "walk", how: HOW_7_5, rows: [
          { step: 1, m: "\\text{the rates add}", say: "In one hour A does $\\frac{1}{6}$ of the job and B does $\\frac{1}{3}$ of it." },
          { step: 2, m: "\\frac{1}{6} + \\frac{1}{3} = \\frac{1}{t}", say: "If together they take $t$ hours, then in one hour they do $\\frac{1}{t}$ of the job." },
          { step: 3, m: "t + 2t = 6", say: "Multiply every term by the LCD, $6t$.",
            ask: { prompt: "What is $6t \\cdot \\frac{1}{t}$?", answer: 0,
                   options: [{ t: "$6$" }, { t: "$6t^2$", fb: "$\\frac{1}{t}$ divides by $t$." }, { t: "$t$", fb: "The $t$s divide out, leaving 6." }] } },
          { step: 3, m: "t = 2", say: "$3t = 6$." },
          { step: 4, m: "\\frac{1}{6} + \\frac{1}{3} = \\frac{1}{2}", say: "2 hours: quicker than either pump alone, as it should be. ✓" }] },
        gate: true, then: "Times do not add. **Rates** add." },
      { type: "guided", kicker: "Together",
        prompt: "Now variation. **$y$ varies directly with $x$, and $y = 20$ when $x = 8$. Find $y$ when $x = 14$.**",
        how: HOW_7_5, skill: "Variation",
        steps: [
          { step: 1, ask: "Which formula is direct variation?", type: "choice", answer: 0,
            options: [{ t: "$y = kx$" }, { t: "$y = \\frac{k}{x}$", fb: "That is inverse variation: as $x$ grows, $y$ shrinks." }],
            m: "y = kx", say: "$k$ is the constant of variation." },
          { step: 2, ask: "Substitute $y = 20$ and $x = 8$.", type: "choice", answer: 0,
            options: [{ t: "$20 = k \\cdot 8$" }, { t: "$8 = k \\cdot 20$", fb: "$y$ is 20 and $x$ is 8." }],
            m: "20 = k \\cdot 8", say: "One equation in $k$." },
          { step: 3, ask: "Solve for $k$.", type: "num", pre: "$k =$", answer: 2.5, tol: 1e-9, near: [{ v: 0.4, tol: 1e-9, fb: "Divide 20 by 8, not 8 by 20." }], hint: "$20 \\div 8$.",
            m: "k = 2.5", say: "So the rule is $y = 2.5x$." },
          { step: 3, ask: "Now use $y = 2.5x$ with $x = 14$.", type: "num", pre: "$y =$", answer: 35, near: [{ v: 5.6, tol: 1e-9, fb: "Multiply 2.5 by 14." }], hint: "$2.5 \\cdot 14$.",
            m: "y = 2.5(14) = 35", say: "The value asked for." },
          { step: 4, ask: "$x$ grew from 8 to 14. Should $y$ be more than 20, or less?", type: "choice", answer: 0,
            options: [{ t: "More: in direct variation they grow together" }, { t: "Less", fb: "That is how inverse variation behaves." }],
            m: "35 > 20", say: "The answer makes sense. ✓" }],
        why: "Model, set up, solve, answer. Now a proportion on your own." },
      { type: "num", kicker: "On your own", prompt: "On a map, **2 cm** stands for **15 km**. Two towns are **7 cm** apart on the map. How far apart are they really?",
        post: "km", answer: 52.5, tol: 1e-9, skill: "Solve a proportion",
        near: [{ v: 105, fb: "$\\frac{2}{15} = \\frac{7}{x}$ gives $2x = 105$. Divide by 2." }],
        hints: ["$\\frac{2}{15} = \\frac{7}{x}$."], why: "$2x = 105$, so $x = 52.5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Inverse variation: **the time for a trip varies inversely with the speed. At 60 mph it takes 3 hours. How long does it take at 45 mph?**",
        scene: { type: "walk", how: HOW_7_5, rows: [
          { step: 1, m: "t = \\frac{k}{r}", say: "Inverse variation: the variable is in the denominator." },
          { step: 2, m: "3 = \\frac{k}{60}", say: "Substitute the pair you know." },
          { step: 3, m: "k = 180", say: "Multiply both sides by 60." },
          { step: 3, m: "t = \\frac{180}{45} = 4", say: "Use the rule with $r = 45$." },
          { step: 4, m: "4 \\text{ hours}", say: "A slower speed means a longer time. ✓" }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A boat goes **12 miles upstream** in the same time that it goes **18 miles downstream**. The current is **2 mph**. What is the boat's speed in still water?",
        post: "mph", answer: 10, skill: "Rational applications",
        near: [{ v: 2, fb: "That is the current." }],
        hints: ["Time is distance over rate: $\\frac{12}{b - 2} = \\frac{18}{b + 2}$."], why: "$12(b + 2) = 18(b - 2)$ gives $60 = 6b$, so $b = 10$." },
      { type: "choice", kicker: "Find the error",
        prompt: "“$y$ varies **inversely** with $x$, and $y = 6$ when $x = 4$.” Kai writes $k = \\frac{6}{4}$. What is wrong?",
        options: [{ t: "For inverse variation $y = \\frac{k}{x}$, so $k = xy = 24$." },
                  { t: "It should be $k = \\frac{4}{6}$.", fb: "Neither quotient is right. In $y = \\frac{k}{x}$, multiply both sides by $x$." },
                  { t: "Nothing. $k$ is always $y$ divided by $x$.", fb: "That is true for **direct** variation, $y = kx$." }],
        answer: 0, skill: "Variation", hints: ["Substitute into $y = \\frac{k}{x}$."], why: "$6 = \\frac{k}{4}$ gives $k = 24$." },
      { type: "num", kicker: "Use it", prompt: "Ana can paint a room in **4 hours**. Working with Ben, it takes **3 hours**. How long would Ben take on his own?",
        post: "hours", answer: 12, skill: "Rational applications",
        near: [{ v: 1, fb: "Times do not subtract. The rates add: $\\frac{1}{4} + \\frac{1}{b} = \\frac{1}{3}$." }, { v: 7, fb: "Times do not add. The rates add: $\\frac{1}{4} + \\frac{1}{b} = \\frac{1}{3}$." }],
        hints: ["$\\frac{1}{4} + \\frac{1}{b} = \\frac{1}{3}$. Multiply by $12b$."], why: "$3b + 12 = 4b$, so $b = 12$." }
    ]
  });

  /* ============================================ 7.6 · Solve rational inequalities */
  var HOW_7_6 = [["One quotient", "Write the inequality with a single quotient on the left and 0 on the right."],
                 ["Critical", "Find the critical points: where the quotient is 0 or is undefined."],
                 ["Intervals", "The critical points split the number line into intervals."],
                 ["Test", "Test one value in each interval: is the quotient positive or negative there?"],
                 ["Answer", "Keep the intervals that fit. Never include a point where the denominator is 0."]];
  LESSONS.push({
    title: "Solve rational inequalities",
    blurb: "Book 7.6 · Critical points, sign testing on the number line, and why you never multiply across.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $\\frac{x - 1}{x + 3}$ positive or negative when $x = 0$?",
        options: [{ t: "Negative: $\\frac{-1}{3}$" }, { t: "Positive", fb: "The top is $0 - 1 = -1$ and the bottom is 3." }],
        answer: 0, skill: "Sign of a quotient", hints: ["Work out the top and the bottom separately."], why: "A negative divided by a positive is negative." },
      { type: "learn", kicker: "The idea",
        prompt: "A quotient can only change sign where its top or its bottom is 0. Those **critical points** cut the number line into intervals, and inside each interval the sign never changes. One test value settles each interval.",
        scene: { type: "method", how: HOW_7_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$\\frac{x - 1}{x + 3} \\ge 0$$",
        scene: { type: "walk", how: HOW_7_6, rows: [
          { step: 1, m: "\\frac{x - 1}{x + 3} \\ge 0", say: "Already one quotient compared with 0." },
          { step: 2, m: "1 \\quad\\text{and}\\quad -3", say: "The quotient is 0 at $x = 1$, and it is undefined at $x = -3$." },
          { step: 3, m: "(-\\infty, -3) \\quad (-3, 1) \\quad (1, \\infty)", say: "Two critical points make three intervals." },
          { step: 4, m: "+ \\qquad - \\qquad +", say: "Test $-4$, 0 and 2: $\\frac{-5}{-1}$ is positive, $\\frac{-1}{3}$ is negative, $\\frac{1}{5}$ is positive.",
            ask: { prompt: "At $x = 0$, what is the sign of $\\frac{x - 1}{x + 3}$?", answer: 0,
                   options: [{ t: "Negative" }, { t: "Positive", fb: "$\\frac{-1}{3}$ is negative." }] } },
          { step: 5, m: "(-\\infty, -3) \\cup [1, \\infty)", say: "$\\ge 0$ keeps the positive intervals, and the zero at 1. The point $-3$ is never included." }] },
        gate: true, then: "A bracket where the quotient is 0. A parenthesis where it is undefined." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$\\frac{x + 2}{x - 4} < 0$$",
        how: HOW_7_6, skill: "Rational inequalities",
        steps: [
          { step: 1, ask: "Is it already a single quotient compared with 0?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "No", fb: "One fraction on the left, 0 on the right." }],
            m: "\\frac{x + 2}{x - 4} < 0", say: "Ready for the next step." },
          { step: 2, ask: "What are the critical points?", type: "choice", answer: 0,
            options: [{ t: "$-2$ and $4$" }, { t: "$2$ and $-4$", fb: "Solve $x + 2 = 0$ and $x - 4 = 0$." }],
            m: "-2 \\quad\\text{and}\\quad 4", say: "Zero at $-2$. At 4 it is undefined." },
          { step: 3, ask: "Which intervals do they make?", type: "choice", answer: 0,
            options: [{ t: "$(-\\infty, -2)$, $(-2, 4)$ and $(4, \\infty)$" }, { t: "$(-\\infty, 4)$ and $(4, \\infty)$", fb: "$-2$ splits the line as well." }],
            m: "(-\\infty, -2) \\quad (-2, 4) \\quad (4, \\infty)", say: "Three intervals." },
          { step: 4, ask: "Test $x = 0$ in the middle interval. What is the sign of $\\frac{0 + 2}{0 - 4}$?", type: "choice", answer: 0,
            options: [{ t: "Negative" }, { t: "Positive", fb: "$\\frac{2}{-4}$ is negative." }],
            m: "+ \\qquad - \\qquad +", say: "And $x = -3$ and $x = 5$ both give a positive quotient." },
          { step: 5, ask: "Which is the solution of $\\frac{x + 2}{x - 4} < 0$?", type: "choice", answer: 0,
            options: [{ t: "$(-2, 4)$" }, { t: "$[-2, 4]$", fb: "The inequality is strict, and 4 makes the denominator 0." }, { t: "$(-\\infty, -2) \\cup (4, \\infty)$", fb: "Those are the intervals where the quotient is positive." }],
            m: "(-2, 4)", say: "Where the quotient is negative." }],
        why: "One quotient, critical points, intervals, test, answer. Now graph one yourself." },
      { type: "numberline", kicker: "On your own", prompt: "Graph the solution of $\\frac{x + 2}{x - 4} \\le 0$. Drag each end, and tap an end to switch it between open and filled.",
        min: -6, max: 8, mode: "seg", variable: "x", seg: { a: -1, b: 1, ca: false, cb: false },
        answer: { a: -2, b: 4, ca: true, cb: false }, skill: "Rational inequalities",
        hints: ["The quotient is 0 at $-2$, so that end is included. What happens at 4?"],
        why: "$[-2, 4)$: the zero is included, but 4 makes the denominator 0, so it stays open." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the right side is not 0, bring everything to the left first. $$\\frac{2x}{x - 1} > 1$$",
        scene: { type: "walk", how: HOW_7_6, rows: [
          { step: 1, m: "\\frac{2x}{x - 1} - \\frac{x - 1}{x - 1} > 0", say: "Subtract 1, written with the same denominator. Never multiply both sides by $x - 1$: its sign is unknown." },
          { step: 1, m: "\\frac{x + 1}{x - 1} > 0", say: "$2x - (x - 1) = x + 1$." },
          { step: 2, m: "-1 \\quad\\text{and}\\quad 1", say: "Zero at $-1$. At 1 it is undefined." },
          { step: 4, m: "+ \\qquad - \\qquad +", say: "Test $-2$, 0 and 2: $\\frac{-1}{-3}$, $\\frac{1}{-1}$ and $\\frac{3}{1}$." },
          { step: 5, m: "(-\\infty, -1) \\cup (1, \\infty)", say: "The intervals where the quotient is positive." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which values can **never** be part of the solution of a rational inequality?",
        options: [{ t: "Values that make the denominator 0" }, { t: "Values that make the numerator 0", fb: "Those are included whenever the sign is $\\le$ or $\\ge$." }, { t: "Negative values", fb: "A negative number can be a solution like any other." }],
        answer: 0, skill: "Rational inequalities", hints: ["Where does the quotient have no value at all?"], why: "The expression is undefined there, so it cannot satisfy any inequality." },
      { type: "choice", kicker: "Find the error",
        prompt: "To solve $\\frac{3}{x - 2} > 1$, Mo multiplies both sides by $x - 2$ and gets $3 > x - 2$, so $x < 5$. What is wrong?",
        options: [{ t: "$x - 2$ may be negative, which would reverse the sign. The solution is $(2, 5)$." },
                  { t: "The arithmetic: it should be $x < 1$.", fb: "$3 > x - 2$ does give $x < 5$. The trouble is the multiplying." },
                  { t: "Nothing. $x < 5$ is right.", fb: "Test $x = 0$: $\\frac{3}{-2} > 1$ is false." }],
        answer: 0, skill: "Rational inequalities", hints: ["What happens to an inequality when you multiply by a negative number?"], why: "Bring 1 to the left: $\\frac{5 - x}{x - 2} > 0$, which is true only between 2 and 5." },
      { type: "choice", kicker: "Use it", prompt: "A company's average cost per item is $\\frac{600 + 5x}{x}$ dollars for $x$ items. For which production levels is the average cost **under \\$8**?",
        options: [{ t: "More than 200 items" }, { t: "Fewer than 200 items", fb: "Test $x = 100$: $\\frac{1100}{100} = 11$, which is over \\$8." }, { t: "Exactly 200 items", fb: "At 200 the average is exactly \\$8, not under it." }],
        answer: 0, skill: "Rational inequalities", hints: ["$x$ is positive here, so $600 + 5x < 8x$."], why: "$600 < 3x$, so $x > 200$." }
    ]
  });
  /* ================================================================ Skills */
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function lin(p) { return poly([[1, "x"], [p, ""]]); }
  var SKILLS = [
    { id: "a2u7-excluded", title: "Find the excluded values of a rational expression", lesson: 2,
      gen: function (R) {
        var r1 = R.int(-7, 7), r2 = R.int(-7, 7), n = R.nz(-5, 5);
        if (r1 === r2) r2 = r1 + 2;
        return { type: "numbers", prompt: "Which values of $x$ make the denominator of this expression 0? Give every one. $$\\frac{" + lin(n) + "}{" + quad(1, -(r1 + r2), r1 * r2) + "}$$", answer: [r1, r2], placeholder: "e.g. −2, 3",
          hints: ["Set the denominator equal to 0 and factor it."],
          why: "The denominator is $" + (r1 === 0 ? "x" : "(" + lin(-r1) + ")") + (r2 === 0 ? "x" : "(" + lin(-r2) + ")") + "$, which is 0 at $x = " + r1 + "$ and $x = " + r2 + "$." };
      } },
    { id: "a2u7-simplify", title: "Simplify a rational expression", lesson: 2,
      gen: function (R) {
        var p = R.nz(-6, 6), q = R.nz(-6, 6), r = R.nz(-6, 6);
        if (q === p) q = p + 1; if (q === 0) q = 7;
        if (r === p || r === q) r = Math.max(p, q) + 1; if (r === 0) r = 8;
        var right = "\\frac{" + lin(q) + "}{" + lin(r) + "}";
        return mc(R, { prompt: "Simplify. $$\\frac{" + quad(1, p + q, p * q) + "}{" + quad(1, p + r, p * r) + "}$$", right: "$" + right + "$",
          wrong: [{ t: "$\\frac{" + poly([[p + q, "x"], [p * q, ""]]) + "}{" + poly([[p + r, "x"], [p * r, ""]]) + "}$", fb: "$x^2$ is a term, not a factor. Factor first, then divide out." },
                  { t: "$\\frac{" + lin(p) + "}{" + lin(r) + "}$", fb: "$(" + lin(p) + ")$ is the factor that divides out." }],
          hints: ["Factor the top and the bottom. They share one factor."],
          why: "$\\frac{(" + lin(p) + ")(" + lin(q) + ")}{(" + lin(p) + ")(" + lin(r) + ")} = " + right + "$." });
      } },
    { id: "a2u7-add", title: "Add rational expressions", lesson: 3,
      gen: function (R) {
        var a = R.int(1, 5), b = R.int(1, 5), p = R.nz(-5, 5), q = R.nz(-5, 5);
        if (q === p) q = p + 1; if (q === 0) q = 6;
        var den = "(" + lin(p) + ")(" + lin(q) + ")", top = poly([[a + b, "x"], [a * q + b * p, ""]]);
        return mc(R, { prompt: "Add. $$\\frac{" + a + "}{" + lin(p) + "} + \\frac{" + b + "}{" + lin(q) + "}$$", right: "$\\frac{" + top + "}{" + den + "}$",
          wrong: [{ t: "$\\frac{" + (a + b) + "}{" + poly([[2, "x"], [p + q, ""]]) + "}$", fb: "Denominators are never added. Rewrite each fraction with the LCD." },
                  { t: "$\\frac{" + (a + b) + "}{" + den + "}$", fb: "Each numerator must be multiplied by the factor its denominator was missing." }],
          hints: ["The LCD is $" + den + "$."], why: "$\\frac{" + a + "(" + lin(q) + ") + " + b + "(" + lin(p) + ")}{" + den + "} = \\frac{" + top + "}{" + den + "}$." });
      } },
    { id: "a2u7-equation", title: "Solve a rational equation", lesson: 5,
      gen: function (R) {
        var x0 = R.nz(-8, 9), p = R.nz(-5, 5), m = R.pick([2, 3, 4, 5, 6]);
        if (x0 + p === 0) p += 1;
        var k = m * (x0 + p);
        return { type: "num", prompt: "Solve. $$\\frac{" + k + "}{" + lin(p) + "} = " + m + "$$", pre: "$x =$", answer: x0,
          near: near(x0, [{ v: x0 + p, fb: "That is the value of $" + lin(p) + "$. Now solve for $x$." }]),
          hints: ["Multiply both sides by $" + lin(p) + "$."], why: "$" + k + " = " + m + "(" + lin(p) + ")$, so $" + lin(p) + " = " + (x0 + p) + "$ and $x = " + x0 + "$." };
      } },
    { id: "a2u7-variation", title: "Solve a variation problem", lesson: 6,
      gen: function (R) {
        var direct = R.chance(0.5), k, x1, x2;
        if (direct) { k = R.pick([2, 3, 4, 5, 1.5, 2.5]); x1 = R.pick([2, 4, 6, 8]); x2 = x1 + R.pick([2, 4, 6]);
          return { type: "num", prompt: "$y$ varies **directly** with $x$, and $y = " + num(k * x1) + "$ when $x = " + x1 + "$. Find $y$ when $x = " + x2 + "$.", pre: "$y =$", answer: k * x2, tol: 1e-9,
            near: near(k * x2, [{ v: k * x1 * x1 / x2, tol: 1e-9, fb: "That treats it as inverse variation. Direct variation is $y = kx$." }]),
            hints: ["$y = kx$. Find $k$ first: $" + num(k * x1) + " = k \\cdot " + x1 + "$."], why: "$k = " + num(k) + "$, so $y = " + num(k) + " \\cdot " + x2 + " = " + num(k * x2) + "$." }; }
        var P = R.pick([[2, 12, 6], [3, 8, 4], [4, 15, 10], [5, 12, 6], [6, 10, 4], [2, 20, 8], [3, 12, 9]]); x1 = P[0]; x2 = P[2];
        k = P[0] * P[1];
        return { type: "num", prompt: "$y$ varies **inversely** with $x$, and $y = " + P[1] + "$ when $x = " + x1 + "$. Find $y$ when $x = " + x2 + "$.", pre: "$y =$", answer: k / x2, tol: 1e-9,
          near: near(k / x2, [{ v: P[1] / x1 * x2, tol: 1e-9, fb: "That treats it as direct variation. Inverse variation is $y = \\frac{k}{x}$." }]),
          hints: ["$y = \\frac{k}{x}$. Find $k$ first: $k = " + x1 + " \\cdot " + P[1] + "$."], why: "$k = " + k + "$, so $y = \\frac{" + k + "}{" + x2 + "} = " + num(k / x2) + "$." };
      } },
    { id: "a2u7-inequality", title: "Solve a rational inequality", lesson: 7,
      gen: function (R) {
        var a = R.int(-6, 4), b = a + R.int(1, 6), topSmall = R.chance(0.5), neg = R.chance(0.5);
        var zero = topSmall ? a : b, undef = topSmall ? b : a;
        var q = "\\frac{" + lin(-zero) + "}{" + lin(-undef) + "}";
        var inside = "$(" + a + ", " + b + ")$", outside = "$(-\\infty, " + a + ") \\cup (" + b + ", \\infty)$";
        return mc(R, { prompt: "Solve. $$" + q + (neg ? " < 0" : " > 0") + "$$", right: neg ? inside : outside,
          wrong: [{ t: neg ? outside : inside, fb: "Test a value between $" + a + "$ and $" + b + "$: there the top and the bottom have opposite signs, so the quotient is negative." },
                  { t: "$(" + a + ", \\infty)$", fb: "There are two critical points, $" + a + "$ and $" + b + "$, so three intervals to test." }],
          hints: ["Critical points: $" + a + "$ and $" + b + "$. Test a value in each of the three intervals."],
          why: "The quotient is negative between $" + a + "$ and $" + b + "$, and positive outside them." });
      } }
  ];
  L.unit("alg2", 7, {
    title: "Rational Expressions and Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Undefined values, simplifying, and adding rational expressions.",
        skills: ["a2u7-excluded", "a2u7-simplify", "a2u7-add"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Rational equations, variation, and rational inequalities.",
        skills: ["a2u7-equation", "a2u7-variation", "a2u7-inequality"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:7", {
    2: { name: "Rational expressions", frame: "A rational expression is undefined where its [[denominator]] is 0. To simplify, [[factor]] the top and the bottom, then divide out common [[factors]]. To divide, multiply by the [[reciprocal]].",
         chips: ["terms", "numerator"], fb: { "terms": "Terms are added. Only factors, which are multiplied, can be divided out." } },
    3: { name: "Adding rational expressions", frame: "Rational expressions need a [[common denominator]] before they are added. The LCD uses each factor the [[most]] times it appears. Then combine the [[numerators]].",
         chips: ["fewest", "denominators"] },
    4: { name: "Complex rational expressions", frame: "A complex rational expression has [[fractions]] inside a fraction. Multiply the main top and bottom by the [[LCD]] of the small fractions, or rewrite the main bar as a [[division]].",
         chips: ["product", "exponents"] },
    5: { name: "Rational equations", frame: "Multiply both sides by the [[LCD]] to clear the fractions. A value that makes a denominator [[zero]] cannot be a solution. If one turns up, it is [[extraneous]].",
         chips: ["positive", "exact"] },
    6: { name: "Variation and work", frame: "Direct variation: $y = $ [[$kx$]]. Inverse variation: $y = $ [[$\\frac{k}{x}$]]. In a work problem the [[rates]] add.",
         chips: ["times", "$k + x$"], fb: { "times": "Two workers do not take the sum of their times. Their rates, job per hour, add." } },
    7: { name: "Rational inequalities", frame: "Compare a single quotient with [[zero]]. The critical points are where the numerator or the [[denominator]] is 0. [[Test]] a value in each interval. A point where the denominator is 0 is [[never]] included.",
         chips: ["always", "one"] }
  });
})();
