/* ==========================================================================
   Algebra II — Unit 8: Roots and Radicals. See lab/core.js for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 8, section for section:
   the readiness check, then 8.1 to 8.8. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   What a root is (8.1), simplifying radicals (8.2), roots as exponents (8.3),
   the four operations (8.4–8.5), radical equations and functions (8.6–8.7),
   and the numbers that square roots of negatives lead to (8.8).

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
    blurb: "Book: Chapter 8 Be Prepared · Squares and cubes, exponent rules, and a binomial squared.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Squares and cubes", prompt: "What is $\\sqrt{81}$?", answer: 9, skill: "Square roots",
        near: [{ v: 40.5, tol: 1e-9, fb: "A square root is not half. Which number times itself is 81?" }], hints: ["Which number times itself is 81?"], why: "$9 \\cdot 9 = 81$." },
      { type: "num", prompt: "What is $2^3$?", answer: 8, skill: "Evaluate powers",
        near: [{ v: 6, fb: "$2^3$ is $2 \\cdot 2 \\cdot 2$, not $2 \\cdot 3$." }], hints: ["$2 \\cdot 2 \\cdot 2$."], why: "$2 \\cdot 2 \\cdot 2 = 8$." },
      { type: "num", kicker: "Check 2 · Exponent rules", prompt: "$$x^3 \\cdot x^4 = x^{\\square}$$ What goes in the box?", answer: 7, skill: "Exponent properties",
        near: [{ v: 12, fb: "Multiplying powers **adds** the exponents." }], hints: ["Count the factors of $x$."], why: "$3 + 4 = 7$." },
      { type: "num", prompt: "$$(x^5)^2 = x^{\\square}$$ What goes in the box?", answer: 10, skill: "Exponent properties",
        near: [{ v: 7, fb: "A power of a power **multiplies** the exponents." }, { v: 25, fb: "Multiply 5 by 2." }], hints: ["Two groups of five $x$s."], why: "$5 \\cdot 2 = 10$." },
      { type: "choice", kicker: "Check 3 · Squaring a binomial", prompt: "What is $(x + 3)^2$?",
        options: [{ t: "$x^2 + 6x + 9$" }, { t: "$x^2 + 9$", fb: "$(x + 3)(x + 3)$ has a middle term: $3x + 3x$." }, { t: "$x^2 + 3x + 9$", fb: "The middle term is $3x + 3x = 6x$." }],
        answer: 0, skill: "Special products", hints: ["$(x + 3)(x + 3)$."], why: "$x^2 + 3x + 3x + 9$." },
      { type: "numbers", prompt: "Solve $x^2 = 25$. Give both solutions.", answer: [-5, 5], skill: "Solve by factoring", placeholder: "e.g. −3, 3",
        hints: ["Two numbers square to 25."], why: "$5^2 = 25$ and $(-5)^2 = 25$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 8.1**. If **check 2** slipped, see lesson 5.2: rational exponents obey the same rules. If **check 3** slipped, see lesson 5.3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ======================================= 8.1 · Simplify expressions with roots */
  var HOW_8_1 = [["Index", "Read the index $n$: which root is it? No index written means a square root."],
                 ["Power", "Find the number whose $n$th power is the radicand."],
                 ["Sign", "Even index: the radicand cannot be negative, and the root is the positive one. Odd index: the root takes the radicand's sign."],
                 ["Variables", "For a variable, divide its exponent by the index. With an even index, use absolute value bars if the result has an odd exponent."]];
  var HOW_8_1E = [["Squares", "Find the perfect squares on either side of the radicand."],
                  ["Between", "The root lies between their roots."],
                  ["Closer", "See which one the radicand is closer to."]];
  LESSONS.push({
    title: "Simplify expressions with roots",
    blurb: "Book 8.1 · Square roots, cube roots and higher roots, estimating them, and roots of variables.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\sqrt{144}$?", answer: 12, skill: "Square roots",
        near: [{ v: 72, fb: "A square root is not half. Which number times itself is 144?" }], hints: ["$10^2 = 100$. Try a little higher."], why: "$12 \\cdot 12 = 144$." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\sqrt[n]{a}$ asks: which number, raised to the power $n$, gives $a$? A positive number has two square roots, and the radical sign means the **principal** one: the positive one. An even root of a negative number is not real. An odd root is.",
        scene: { type: "method", how: HOW_8_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch four roots simplified.",
        scene: { type: "walk", how: HOW_8_1, rows: [
          { step: 1, m: "\\sqrt[3]{-125}", say: "The index is 3: a cube root." },
          { step: 2, m: "5^3 = 125", say: "125 is a perfect cube." },
          { step: 3, m: "\\sqrt[3]{-125} = -5", say: "Odd index: a negative radicand is fine, and the root is negative.",
            ask: { prompt: "Why is $\\sqrt[3]{-125}$ real, when $\\sqrt{-25}$ is not?", answer: 0,
                   options: [{ t: "A negative number cubed is negative, but no real number squared is negative" }, { t: "Cube roots ignore the sign", fb: "The sign is kept: the root is $-5$, because $(-5)^3 = -125$." }] } },
          { step: 3, m: "\\sqrt[4]{-16} \\quad\\text{is not a real number}", say: "Even index, negative radicand: no real fourth power is negative." },
          { step: 4, m: "\\sqrt{x^6} = |x^3|", say: "$6 \\div 2 = 3$. The index is even and the result has an odd exponent, so the bars keep it from being negative." }] },
        gate: true, then: "$-\\sqrt{25} = -5$ is fine: the negative is outside the radical. $\\sqrt{-25}$ is the one that is not real." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. Simplify $\\sqrt[4]{81x^8}$.",
        how: HOW_8_1, skill: "Simplify roots",
        steps: [
          { step: 1, ask: "What is the index?", type: "num", answer: 4, near: [{ v: 2, fb: "The small number tucked into the radical sign is the index: 4." }], hint: "The small number in the notch of the radical.",
            m: "\\sqrt[4]{81x^8}", say: "A fourth root." },
          { step: 2, ask: "Which number, raised to the 4th power, is 81?", type: "num", answer: 3, near: [{ v: 9, fb: "$9^2 = 81$. For a 4th power: $3 \\cdot 3 \\cdot 3 \\cdot 3$." }], hint: "$3 \\cdot 3 = 9$, and $9 \\cdot 9 = 81$.",
            m: "3^4 = 81", say: "81 is a perfect fourth power." },
          { step: 3, ask: "Even index, positive radicand. Which root does the radical sign mean?", type: "choice", answer: 0,
            options: [{ t: "The positive one: 3" }, { t: "Both 3 and $-3$", fb: "The radical sign means the principal root only." }],
            m: "\\sqrt[4]{81} = 3", say: "The principal root." },
          { step: 4, ask: "For $x^8$, divide the exponent by the index. What is $8 \\div 4$?", type: "num", answer: 2, hint: "$8 \\div 4$.",
            m: "\\sqrt[4]{81x^8} = 3x^2", say: "$x^2$ is never negative, so no bars are needed." }],
        why: "Index, power, sign, variables. Now sort some roots yourself." },
      { type: "sort", kicker: "On your own", prompt: "Is each one a real number?",
        bins: ["Real", "Not real"],
        cards: [{ t: "$\\sqrt{-36}$", bin: 1, fb: "No real number squared is $-36$." },
                { t: "$\\sqrt[3]{-8}$", bin: 0, fb: "$(-2)^3 = -8$, so it is $-2$." },
                { t: "$-\\sqrt{36}$", bin: 0, fb: "The negative is outside the radical: $-6$." },
                { t: "$\\sqrt[4]{-1}$", bin: 1, fb: "An even root of a negative number is not real." }],
        skill: "Simplify roots", hints: ["Even index with a negative under the radical? Then it is not real."],
        why: "Only an even root of a negative radicand fails to be real." },
      { type: "num", prompt: "What is $\\sqrt[3]{64}$?", answer: 4, skill: "Simplify roots",
        near: [{ v: 8, fb: "$8^2 = 64$, but this is a cube root: which number cubed is 64?" }], hints: ["$4 \\cdot 4 \\cdot 4$."], why: "$4^3 = 64$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Most roots are not whole numbers, but you can always trap one between two whole numbers. Estimate $\\sqrt{50}$.",
        scene: { type: "walk", how: HOW_8_1E, rows: [
          { step: 1, m: "49 < 50 < 64", say: "The perfect squares on either side of 50." },
          { step: 2, m: "7 < \\sqrt{50} < 8", say: "So the root is between 7 and 8." },
          { step: 3, m: "\\sqrt{50} \\approx 7.07", say: "50 is much closer to 49 than to 64, so the root is only just over 7." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "For **any** real number $x$, what is $\\sqrt{x^2}$?",
        options: [{ t: "$|x|$" }, { t: "$x$", fb: "Try $x = -3$: $\\sqrt{(-3)^2} = \\sqrt{9} = 3$, which is not $-3$." }, { t: "$\\pm x$", fb: "The radical sign means the principal root only." }],
        answer: 0, skill: "Simplify roots", hints: ["Try a negative value of $x$."], why: "The principal root is never negative, so the result is $|x|$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kai says $\\sqrt{-9} = -3$. What is wrong?",
        options: [{ t: "$(-3)^2 = 9$, not $-9$. No real number squares to $-9$." },
                  { t: "It should be 3.", fb: "$3^2 = 9$, not $-9$." },
                  { t: "Nothing. It is right.", fb: "Check by squaring: $(-3)^2 = +9$." }],
        answer: 0, skill: "Simplify roots", hints: ["Check a root by raising it to the power."], why: "$\\sqrt{-9}$ is not a real number. ($-\\sqrt{9}$ would be $-3$.)" },
      { type: "num", kicker: "Use it", prompt: "A square garden has an area of **196 m²**. How long is each side?",
        post: "m", answer: 14, skill: "Square roots",
        near: [{ v: 49, fb: "That divides by 4, as for a perimeter. The side is the square root of the area." }, { v: 98, fb: "A square root is not half." }],
        hints: ["Which number times itself is 196?"], why: "$14 \\cdot 14 = 196$." }
    ]
  });

  /* ======================================= 8.2 · Simplify radical expressions */
  var HOW_8_2 = [["Factor", "Find the largest perfect-square factor of the radicand, and write the radicand as a product."],
                 ["Split", "Use the Product Property: $\\sqrt{ab} = \\sqrt{a} \\cdot \\sqrt{b}$."],
                 ["Simplify", "Take the root of the perfect square."]];
  var HOW_8_2Q = [["Fraction", "Simplify the fraction under the radical, if you can."],
                  ["Split", "Use the Quotient Property: $\\sqrt{\\frac{a}{b}} = \\frac{\\sqrt{a}}{\\sqrt{b}}$."],
                  ["Simplify", "Simplify the radical on top and the radical below."]];
  LESSONS.push({
    title: "Simplify radical expressions",
    blurb: "Book 8.2 · The Product Property and the Quotient Property of radicals.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is the **largest perfect square** that divides 48?", answer: 16, skill: "Perfect square factors",
        near: [{ v: 4, fb: "4 divides 48, but a larger perfect square does too." }, { v: 24, fb: "24 is not a perfect square." }],
        hints: ["Try 4, 9, 16, 25, 36."], why: "$48 = 16 \\cdot 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "A radical is **simplified** when its radicand has no perfect-square factor left. The Product Property, $\\sqrt{ab} = \\sqrt{a} \\cdot \\sqrt{b}$, lets you split one off and take its root.",
        scene: { type: "method", how: HOW_8_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\sqrt{72}$ simplified.",
        scene: { type: "walk", how: HOW_8_2, rows: [
          { step: 1, m: "\\sqrt{72}", say: "72 is not a perfect square, but it has perfect-square factors." },
          { step: 1, m: "\\sqrt{72} = \\sqrt{36 \\cdot 2}", say: "Use the largest one.",
            ask: { prompt: "What is the largest perfect square that divides 72?", answer: 0,
                   options: [{ t: "36" }, { t: "9", fb: "9 works, but 36 is larger. Using 9 would leave more to do." }, { t: "4", fb: "4 works, but 36 is larger." }] } },
          { step: 2, m: "\\sqrt{36} \\cdot \\sqrt{2}", say: "The Product Property splits the radical." },
          { step: 3, m: "6\\sqrt{2}", say: "$\\sqrt{36} = 6$. The 2 has no square factor, so it stays." }] },
        gate: true, then: "Check with a calculator: $\\sqrt{72}$ and $6\\sqrt{2}$ are both about 8.49." },
      { type: "guided", kicker: "Together",
        prompt: "Now with a variable. Simplify $\\sqrt{48x^5}$, for $x \\ge 0$.",
        how: HOW_8_2, skill: "Simplify radicals",
        steps: [
          { step: 1, ask: "What is the largest perfect-square factor of 48?", type: "choice", answer: 0,
            options: [{ t: "16" }, { t: "4", fb: "4 works, but 16 is larger." }, { t: "8", fb: "8 is not a perfect square." }],
            m: "\\sqrt{16 \\cdot 3 \\cdot x^5}", say: "$48 = 16 \\cdot 3$." },
          { step: 1, ask: "What is the largest perfect-square factor of $x^5$?", type: "choice", answer: 0,
            options: [{ t: "$x^4$" }, { t: "$x^5$", fb: "An odd power is not a perfect square." }, { t: "$x^2$", fb: "$x^2$ works, but $x^4$ is larger." }],
            m: "\\sqrt{16x^4 \\cdot 3x}", say: "$x^5 = x^4 \\cdot x$, and $x^4 = (x^2)^2$." },
          { step: 2, ask: "Split the radical.", type: "choice", answer: 0,
            options: [{ t: "$\\sqrt{16x^4} \\cdot \\sqrt{3x}$" }, { t: "$\\sqrt{16} + \\sqrt{x^4} + \\sqrt{3x}$", fb: "The property splits a **product** into a product, never into a sum." }],
            m: "\\sqrt{16x^4} \\cdot \\sqrt{3x}", say: "Perfect squares in one radical, the rest in the other." },
          { step: 3, ask: "What is $\\sqrt{16x^4}$?", type: "choice", answer: 0,
            options: [{ t: "$4x^2$" }, { t: "$4x^4$", fb: "Halve the exponent: $4 \\div 2 = 2$." }, { t: "$8x^2$", fb: "$\\sqrt{16} = 4$, not 8." }],
            m: "4x^2\\sqrt{3x}", say: "What is left under the radical has no square factor." }],
        why: "Factor, split, simplify. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$$\\sqrt{50} = \\square\\sqrt{2}$$ What goes in the box?", answer: 5, skill: "Simplify radicals",
        near: [{ v: 25, fb: "25 is the perfect square inside. Its **root**, 5, is what comes out." }], hints: ["$50 = 25 \\cdot 2$."], why: "$\\sqrt{25} \\cdot \\sqrt{2} = 5\\sqrt{2}$." },
      { type: "num", prompt: "$$\\sqrt{98} = \\square\\sqrt{2}$$ What goes in the box?", answer: 7, skill: "Simplify radicals",
        near: [{ v: 49, fb: "49 is the perfect square inside. Its root comes out." }], hints: ["$98 = 49 \\cdot 2$."], why: "$\\sqrt{49} \\cdot \\sqrt{2} = 7\\sqrt{2}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A quotient under a radical splits the same way. Simplify $\\sqrt{\\frac{45}{80}}$.",
        scene: { type: "walk", how: HOW_8_2Q, rows: [
          { step: 1, m: "\\sqrt{\\frac{45}{80}} = \\sqrt{\\frac{9}{16}}", say: "Divide the top and the bottom by 5 first." },
          { step: 2, m: "\\frac{\\sqrt{9}}{\\sqrt{16}}", say: "The Quotient Property: a radical on top and a radical below." },
          { step: 3, m: "\\frac{3}{4}", say: "Both are perfect squares." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Cube roots work the same way, with perfect **cubes**. $$\\sqrt[3]{54} = \\square\\sqrt[3]{2}$$ What goes in the box?", answer: 3, skill: "Simplify radicals",
        near: [{ v: 27, fb: "27 is the perfect cube inside. Its cube root comes out." }, { v: 9, fb: "$\\sqrt[3]{27}$ is 3, since $3^3 = 27$." }],
        hints: ["$54 = 27 \\cdot 2$."], why: "$\\sqrt[3]{27} \\cdot \\sqrt[3]{2} = 3\\sqrt[3]{2}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\sqrt{16 + 9}", "\\sqrt{16} + \\sqrt{9}", "4 + 3 = 7"], answer: 1, fix: "\\sqrt{25}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Simplify radicals",
        hints: ["Is the radicand a product or a sum?"],
        why: "The Product Property is for products, not sums. $\\sqrt{16 + 9} = \\sqrt{25} = 5$." },
      { type: "choice", kicker: "Use it", prompt: "A square has an area of **200 cm²**. What is its side, in simplest radical form?",
        options: [{ t: "$10\\sqrt{2}$ cm" }, { t: "$2\\sqrt{10}$ cm", fb: "$(2\\sqrt{10})^2 = 40$. The perfect square inside 200 is 100." }, { t: "$100\\sqrt{2}$ cm", fb: "The **root** of 100 comes out: 10." }],
        answer: 0, skill: "Simplify radicals", hints: ["$200 = 100 \\cdot 2$."], why: "$\\sqrt{100 \\cdot 2} = 10\\sqrt{2}$." }
    ]
  });

  /* =========================================== 8.3 · Simplify rational exponents */
  var HOW_8_3 = [["Negative?", "A negative exponent means a reciprocal: write 1 over the positive power."],
                 ["Root", "The denominator of the exponent is the index of the root. Take the root first."],
                 ["Power", "The numerator of the exponent is the power. Raise the root to it."]];
  var HOW_8_3R = [["Same base", "Multiplying powers of one base: add the exponents."],
                  ["Fractions", "Add the fractions with a common denominator."],
                  ["Simplify", "Reduce the fraction."]];
  LESSONS.push({
    title: "Simplify rational exponents",
    blurb: "Book 8.3 · Fractions as exponents: the denominator is a root, the numerator a power.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\sqrt[3]{8}$?", answer: 2, skill: "Simplify roots",
        near: [{ v: 4, fb: "$4 \\cdot 4 \\cdot 4 = 64$. Which number cubed is 8?" }], hints: ["Which number cubed is 8?"], why: "$2^3 = 8$." },
      { type: "learn", kicker: "The idea",
        prompt: "A fraction as an exponent is a root: $a^{\\frac{1}{n}} = \\sqrt[n]{a}$, because raising it to the power $n$ gives $a^1$. In $a^{\\frac{m}{n}}$ the **denominator is the root** and the **numerator is the power**.",
        scene: { type: "method", how: HOW_8_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $27^{-\\frac{2}{3}}$ evaluated.",
        scene: { type: "walk", how: HOW_8_3, rows: [
          { step: 1, m: "27^{-\\frac{2}{3}} = \\frac{1}{27^{\\frac{2}{3}}}", say: "A negative exponent: write the reciprocal." },
          { step: 2, m: "\\frac{1}{(\\sqrt[3]{27})^2}", say: "The denominator 3 is a cube root. Take it first: the numbers stay small.",
            ask: { prompt: "In $27^{\\frac{2}{3}}$, what does the 3 tell you to do?", answer: 0,
                   options: [{ t: "Take the cube root" }, { t: "Cube the number", fb: "The denominator is the root. The numerator is the power." }, { t: "Divide by 3", fb: "An exponent is not a divisor." }] } },
          { step: 2, m: "\\frac{1}{3^2}", say: "$\\sqrt[3]{27} = 3$." },
          { step: 3, m: "\\frac{1}{9}", say: "The numerator 2 is the power: $3^2 = 9$." }] },
        gate: true, then: "Root first, then power: $(\\sqrt[3]{27})^2$ is far easier than $\\sqrt[3]{27^2}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. Evaluate $16^{\\frac{3}{4}}$.",
        how: HOW_8_3, skill: "Rational exponents",
        steps: [
          { step: 1, ask: "Is the exponent negative?", type: "choice", answer: 0,
            options: [{ t: "No: no reciprocal is needed" }, { t: "Yes", fb: "$\\frac{3}{4}$ is positive." }],
            m: "16^{\\frac{3}{4}}", say: "Straight to the root." },
          { step: 2, ask: "Which root does the denominator 4 mean?", type: "choice", answer: 0,
            options: [{ t: "The fourth root" }, { t: "The cube root", fb: "The **denominator** is the index: 4." }],
            m: "(\\sqrt[4]{16})^3", say: "Root first." },
          { step: 2, ask: "What is $\\sqrt[4]{16}$?", type: "num", answer: 2, near: [{ v: 4, fb: "$4^2 = 16$, but for a fourth root: $2 \\cdot 2 \\cdot 2 \\cdot 2$." }], hint: "$2^4 = 16$.",
            m: "2^3", say: "$2^4 = 16$." },
          { step: 3, ask: "The numerator is the power. What is $2^3$?", type: "num", answer: 8, near: [{ v: 6, fb: "$2^3$ is $2 \\cdot 2 \\cdot 2$." }], hint: "$2 \\cdot 2 \\cdot 2$.",
            m: "16^{\\frac{3}{4}} = 8", say: "Root, then power." }],
        why: "Negative, root, power. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Evaluate $25^{\\frac{3}{2}}$.", answer: 125, skill: "Rational exponents",
        near: [{ v: 37.5, tol: 1e-9, fb: "An exponent does not multiply. $\\sqrt{25} = 5$, then $5^3$." }, { v: 15, fb: "$5^3$ is $5 \\cdot 5 \\cdot 5$." }],
        hints: ["$(\\sqrt{25})^3$."], why: "$5^3 = 125$." },
      { type: "num", prompt: "Evaluate $8^{-\\frac{1}{3}}$. (Type a fraction like 1/4.)", answer: 0.5, tol: 1e-9, shown: "1/2", skill: "Rational exponents",
        near: [{ v: -2, fb: "A negative exponent means a reciprocal, not a negative number." }, { v: 2, fb: "That is $8^{\\frac{1}{3}}$. The negative exponent makes it a reciprocal." }],
        hints: ["$\\frac{1}{\\sqrt[3]{8}}$."], why: "$\\frac{1}{\\sqrt[3]{8}} = \\frac{1}{2}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Every exponent property still holds, now with fractions. Simplify $x^{\\frac{1}{2}} \\cdot x^{\\frac{5}{6}}$.",
        scene: { type: "walk", how: HOW_8_3R, rows: [
          { step: 1, m: "x^{\\frac{1}{2} + \\frac{5}{6}}", say: "Same base, multiplying: add the exponents." },
          { step: 2, m: "\\frac{1}{2} + \\frac{5}{6} = \\frac{3}{6} + \\frac{5}{6} = \\frac{8}{6}", say: "A common denominator of 6." },
          { step: 3, m: "x^{\\frac{4}{3}}", say: "$\\frac{8}{6}$ reduces to $\\frac{4}{3}$." }] },
        gate: true },
      { type: "slots", kicker: "Try it", prompt: "Match each radical to its exponent form.",
        slots: [{ id: "a", label: "$x^{\\frac{1}{2}}$" }, { id: "b", label: "$x^{\\frac{2}{3}}$" }, { id: "c", label: "$x^{\\frac{3}{2}}$" }, { id: "d", label: "$x^{-\\frac{1}{2}}$" }],
        cards: [{ t: "$\\sqrt{x}$", slot: "a", fb: "A square root is the power $\\frac{1}{2}$." },
                { t: "$\\sqrt[3]{x^2}$", slot: "b", fb: "Index 3 below, power 2 on top." },
                { t: "$\\sqrt{x^3}$", slot: "c", fb: "Index 2 below, power 3 on top." },
                { t: "$\\frac{1}{\\sqrt{x}}$", slot: "d", fb: "A reciprocal is a negative exponent." }],
        skill: "Rational exponents", hints: ["Index goes in the denominator. Power goes in the numerator."],
        why: "$\\sqrt[n]{x^m} = x^{\\frac{m}{n}}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the evaluating of $9^{\\frac{3}{2}}$ **first** goes wrong.",
        lines: ["9^{\\frac{3}{2}}", "(\\sqrt[3]{9})^2", "\\text{about } 4.33"], answer: 1, fix: "(\\sqrt{9})^3",
        fb: { 0: GIVEN, 2: LATER }, skill: "Rational exponents",
        hints: ["Which part of the fraction is the root?"],
        why: "The denominator, 2, is the root, and the numerator, 3, is the power: $(\\sqrt{9})^3 = 27$." },
      { type: "num", kicker: "Use it", prompt: "The side of a cube with volume $V$ is $V^{\\frac{1}{3}}$. What is the side of a cube with a volume of **125 cm³**?",
        post: "cm", answer: 5, skill: "Rational exponents",
        near: [{ v: 41.67, tol: 0.01, fb: "The exponent $\\frac{1}{3}$ is a cube root, not a division by 3." }],
        hints: ["$\\sqrt[3]{125}$."], why: "$5^3 = 125$." }
    ]
  });
  /* ================ 8.4 · Add, subtract and multiply radical expressions */
  var HOW_8_4 = [["Simplify", "Simplify each radical first."],
                 ["Like?", "Like radicals have the same index and the same radicand."],
                 ["Combine", "Add or subtract the coefficients of the like radicals. The radical itself stays."]];
  var HOW_8_4M = [["Distribute", "Multiply each term by each term, as with polynomials."],
                  ["Products", "$\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$, and $\\sqrt{a} \\cdot \\sqrt{a} = a$."],
                  ["Combine", "Combine the like radicals, and combine the plain numbers."]];
  LESSONS.push({
    title: "Add, subtract and multiply radicals",
    blurb: "Book 8.4 · Like radicals combine like like terms, and radicals multiply like polynomials.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Simplify $3x + 5x$.",
        options: [{ t: "$8x$" }, { t: "$8x^2$", fb: "Adding like terms keeps the variable part as it is." }, { t: "$15x$", fb: "The coefficients are added, not multiplied." }],
        answer: 0, skill: "Combine like terms", hints: ["Three of something plus five of the same thing."], why: "$3 + 5 = 8$ of them: $8x$." },
      { type: "learn", kicker: "The idea",
        prompt: "$3\\sqrt{2} + 5\\sqrt{2}$ is three of something plus five of the same thing: $8\\sqrt{2}$. Radicals combine only when they are **like radicals**: same index, same radicand. Simplify first, because unlike-looking radicals may turn out alike.",
        scene: { type: "method", how: HOW_8_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch three radicals combined. $$\\sqrt{18} + \\sqrt{50} - \\sqrt{8}$$",
        scene: { type: "walk", how: HOW_8_4, rows: [
          { step: 1, m: "\\sqrt{18} + \\sqrt{50} - \\sqrt{8}", say: "The radicands differ, so they look unlike. Simplify each one first." },
          { step: 1, m: "3\\sqrt{2} + 5\\sqrt{2} - 2\\sqrt{2}", say: "$18 = 9 \\cdot 2$, $50 = 25 \\cdot 2$ and $8 = 4 \\cdot 2$.",
            ask: { prompt: "What is $\\sqrt{50}$, simplified?", answer: 0,
                   options: [{ t: "$5\\sqrt{2}$" }, { t: "$25\\sqrt{2}$", fb: "The **root** of 25 comes out: 5." }, { t: "$2\\sqrt{5}$", fb: "$50 = 25 \\cdot 2$: the perfect square is 25, and 2 stays inside." }] } },
          { step: 2, m: "\\text{all three are like radicals}", say: "Each one is a multiple of $\\sqrt{2}$." },
          { step: 3, m: "(3 + 5 - 2)\\sqrt{2} = 6\\sqrt{2}", say: "Combine the coefficients." }] },
        gate: true, then: "Before simplifying, nothing could be combined. After, everything could." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$2\\sqrt{12} + \\sqrt{27}$$",
        how: HOW_8_4, skill: "Add and subtract radicals",
        steps: [
          { step: 1, ask: "Simplify $2\\sqrt{12}$.", type: "choice", answer: 0,
            options: [{ t: "$4\\sqrt{3}$" }, { t: "$2\\sqrt{3}$", fb: "$\\sqrt{12} = 2\\sqrt{3}$, and there is already a 2 in front: $2 \\cdot 2$." }, { t: "$8\\sqrt{3}$", fb: "$\\sqrt{4} = 2$ comes out, giving $2 \\cdot 2 = 4$." }],
            m: "4\\sqrt{3} + \\sqrt{27}", say: "$2 \\cdot \\sqrt{4} \\cdot \\sqrt{3}$." },
          { step: 1, ask: "Simplify $\\sqrt{27}$.", type: "choice", answer: 0,
            options: [{ t: "$3\\sqrt{3}$" }, { t: "$9\\sqrt{3}$", fb: "The root of 9 comes out: 3." }],
            m: "4\\sqrt{3} + 3\\sqrt{3}", say: "$27 = 9 \\cdot 3$." },
          { step: 2, ask: "Are they like radicals now?", type: "choice", answer: 0,
            options: [{ t: "Yes: both are multiples of $\\sqrt{3}$" }, { t: "No", fb: "Same index, same radicand: 3." }],
            m: "4\\sqrt{3} + 3\\sqrt{3}", say: "Same index and same radicand." },
          { step: 3, ask: "Add the coefficients: $4 + 3$.", type: "num", answer: 7, hint: "$4 + 3$.",
            m: "7\\sqrt{3}", say: "The radical stays as it is." }],
        why: "Simplify, like, combine. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$$5\\sqrt{7} - 2\\sqrt{7} = \\square\\sqrt{7}$$ What goes in the box?", answer: 3, skill: "Add and subtract radicals",
        near: [{ v: 7, fb: "This is a subtraction: $5 - 2$." }], hints: ["Five of them, take away two."], why: "$5 - 2 = 3$." },
      { type: "sort", prompt: "Can each one be combined with $4\\sqrt{3}$?",
        bins: ["Yes", "No"],
        cards: [{ t: "$\\sqrt{12}$", bin: 0, fb: "$\\sqrt{12} = 2\\sqrt{3}$." },
                { t: "$\\sqrt{6}$", bin: 1, fb: "6 has no perfect-square factor, so it stays $\\sqrt{6}$." },
                { t: "$\\sqrt[3]{3}$", bin: 1, fb: "The index is different: a cube root." },
                { t: "$\\sqrt{75}$", bin: 0, fb: "$\\sqrt{75} = 5\\sqrt{3}$." }],
        skill: "Add and subtract radicals", hints: ["Simplify each one. Is it then a multiple of $\\sqrt{3}$?"],
        why: "Only square roots that simplify to a multiple of $\\sqrt{3}$ are like radicals with it." },
      { type: "learn", kicker: "A harder case",
        prompt: "Radical expressions multiply like polynomials. $$(2 + \\sqrt{3})(4 - \\sqrt{3})$$",
        scene: { type: "walk", how: HOW_8_4M, rows: [
          { step: 1, m: "(2 + \\sqrt{3})(4 - \\sqrt{3})", say: "FOIL: four products." },
          { step: 2, m: "8 - 2\\sqrt{3} + 4\\sqrt{3} - 3", say: "The last product is $\\sqrt{3} \\cdot \\sqrt{3} = 3$, with a minus sign." },
          { step: 3, m: "5 + 2\\sqrt{3}", say: "$8 - 3 = 5$, and $-2\\sqrt{3} + 4\\sqrt{3} = 2\\sqrt{3}$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Multiply and simplify: $\\sqrt{6} \\cdot \\sqrt{24}$.", answer: 12, skill: "Multiply radicals",
        near: [{ v: 144, fb: "That is the number under the radical. Take its square root." }],
        hints: ["$\\sqrt{6 \\cdot 24} = \\sqrt{144}$."], why: "$\\sqrt{144} = 12$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia says $\\sqrt{2} + \\sqrt{3} = \\sqrt{5}$. What is wrong?",
        options: [{ t: "Unlike radicals cannot be combined. The radicands are never added." },
                  { t: "It should be $\\sqrt{6}$.", fb: "$\\sqrt{6}$ is the **product** $\\sqrt{2} \\cdot \\sqrt{3}$." },
                  { t: "Nothing. It is right.", fb: "Check: $\\sqrt{2} + \\sqrt{3}$ is about 3.15, but $\\sqrt{5}$ is about 2.24." }],
        answer: 0, skill: "Add and subtract radicals", hints: ["Are they like radicals?"], why: "$\\sqrt{2} + \\sqrt{3}$ is already as simple as it gets." },
      { type: "num", kicker: "Use it", prompt: "A rectangle has sides $3 + \\sqrt{5}$ and $3 - \\sqrt{5}$. What is its area?", answer: 4, skill: "Multiply radicals",
        near: [{ v: 14, fb: "The last product is $\\sqrt{5} \\cdot (-\\sqrt{5}) = -5$." }, { v: 6, fb: "That adds the sides. Area is their product." }],
        hints: ["Conjugates: $(a + b)(a - b) = a^2 - b^2$."], why: "$3^2 - (\\sqrt{5})^2 = 9 - 5 = 4$. The radicals cancel." }
    ]
  });

  /* ============================================ 8.5 · Divide radical expressions */
  var HOW_8_5 = [["Simplify", "Simplify the fraction and the radicals first, if you can."],
                 ["Multiply", "Multiply the top and the bottom by whatever makes the denominator rational."],
                 ["Tidy", "Simplify the result."]];
  LESSONS.push({
    title: "Divide radical expressions",
    blurb: "Book 8.5 · The Quotient Property, and rationalizing a denominator with one term or two.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $\\sqrt{5} \\cdot \\sqrt{5}$?", answer: 5, skill: "Multiply radicals",
        near: [{ v: 25, fb: "$\\sqrt{5} \\cdot \\sqrt{5} = \\sqrt{25}$, and that is 5." }], hints: ["A square root times itself."], why: "$\\sqrt{25} = 5$." },
      { type: "learn", kicker: "The idea",
        prompt: "A simplified expression has no radical in its denominator. To **rationalize** a one-term denominator, multiply the top and the bottom by that radical. For a two-term denominator, multiply by its **conjugate**.",
        scene: { type: "method", how: HOW_8_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a denominator rationalized. $$\\frac{6}{\\sqrt{3}}$$",
        scene: { type: "walk", how: HOW_8_5, rows: [
          { step: 1, m: "\\frac{6}{\\sqrt{3}}", say: "Nothing simplifies yet, and the denominator is irrational." },
          { step: 2, m: "\\frac{6}{\\sqrt{3}} \\cdot \\frac{\\sqrt{3}}{\\sqrt{3}}", say: "Multiply the top and the bottom by $\\sqrt{3}$.",
            ask: { prompt: "Why multiply by $\\frac{\\sqrt{3}}{\\sqrt{3}}$?", answer: 0,
                   options: [{ t: "It equals 1, and it turns the denominator into 3" }, { t: "It makes the fraction larger", fb: "It equals 1, so the value does not change." }] } },
          { step: 2, m: "\\frac{6\\sqrt{3}}{3}", say: "$\\sqrt{3} \\cdot \\sqrt{3} = 3$: the denominator is rational." },
          { step: 3, m: "2\\sqrt{3}", say: "$6 \\div 3 = 2$." }] },
        gate: true, then: "The value is the same. Only its form has changed." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$\\frac{4}{\\sqrt{8}}$$",
        how: HOW_8_5, skill: "Rationalize a denominator",
        steps: [
          { step: 1, ask: "Simplify $\\sqrt{8}$ first.", type: "choice", answer: 0,
            options: [{ t: "$2\\sqrt{2}$" }, { t: "$4\\sqrt{2}$", fb: "The root of 4 comes out: 2." }],
            m: "\\frac{4}{2\\sqrt{2}} = \\frac{2}{\\sqrt{2}}", say: "And $4 \\div 2 = 2$." },
          { step: 2, ask: "What should the top and the bottom of $\\frac{2}{\\sqrt{2}}$ be multiplied by?", type: "choice", answer: 0,
            options: [{ t: "$\\sqrt{2}$" }, { t: "$2$", fb: "The denominator would be $2\\sqrt{2}$: still irrational." }],
            m: "\\frac{2\\sqrt{2}}{2}", say: "$\\sqrt{2} \\cdot \\sqrt{2} = 2$." },
          { step: 3, ask: "Simplify $\\frac{2\\sqrt{2}}{2}$.", type: "choice", answer: 0,
            options: [{ t: "$\\sqrt{2}$" }, { t: "$2\\sqrt{2}$", fb: "The 2s divide out." }],
            m: "\\sqrt{2}", say: "No radical below, nothing left to reduce." }],
        why: "Simplify, multiply, tidy. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "Rationalize $\\frac{10}{\\sqrt{5}}$.",
        options: [{ t: "$2\\sqrt{5}$" }, { t: "$\\frac{10\\sqrt{5}}{25}$", fb: "$\\sqrt{5} \\cdot \\sqrt{5} = 5$, not 25." }, { t: "$10\\sqrt{5}$", fb: "The denominator becomes 5, and $10 \\div 5 = 2$." }],
        answer: 0, skill: "Rationalize a denominator", hints: ["Multiply the top and the bottom by $\\sqrt{5}$."], why: "$\\frac{10\\sqrt{5}}{5} = 2\\sqrt{5}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "With two terms below, multiplying by the radical alone would not clear it. Use the **conjugate**. $$\\frac{4}{3 - \\sqrt{5}}$$",
        scene: { type: "walk", how: HOW_8_5, rows: [
          { step: 1, m: "\\frac{4}{3 - \\sqrt{5}}", say: "Nothing to simplify first." },
          { step: 2, m: "\\frac{4}{3 - \\sqrt{5}} \\cdot \\frac{3 + \\sqrt{5}}{3 + \\sqrt{5}}", say: "The conjugate has the same terms with the opposite sign." },
          { step: 2, m: "\\frac{4(3 + \\sqrt{5})}{9 - 5}", say: "$(a - b)(a + b) = a^2 - b^2$: the radical is squared away." },
          { step: 3, m: "3 + \\sqrt{5}", say: "$9 - 5 = 4$, and the 4s divide out." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "What is the conjugate of $2 + \\sqrt{7}$?",
        options: [{ t: "$2 - \\sqrt{7}$" }, { t: "$-2 - \\sqrt{7}$", fb: "Only the sign between the terms changes." }, { t: "$\\sqrt{7} + 2$", fb: "That is the same number, written in a different order." }],
        answer: 0, skill: "Rationalize a denominator", hints: ["Same terms, opposite sign in the middle."], why: "$(2 + \\sqrt{7})(2 - \\sqrt{7}) = 4 - 7$, with no radical left." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the rationalizing **first** goes wrong.",
        lines: ["\\frac{3}{1 + \\sqrt{2}}", "\\frac{3}{1 + \\sqrt{2}} \\cdot \\frac{\\sqrt{2}}{\\sqrt{2}}", "\\frac{3\\sqrt{2}}{\\sqrt{2} + 2}"], answer: 1, fix: "\\frac{3}{1 + \\sqrt{2}} \\cdot \\frac{1 - \\sqrt{2}}{1 - \\sqrt{2}}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Rationalize a denominator",
        hints: ["Look at the last line: is the denominator rational?"],
        why: "A two-term denominator needs its conjugate, $1 - \\sqrt{2}$. The result is $\\frac{3(1 - \\sqrt{2})}{1 - 2} = -3 + 3\\sqrt{2}$." },
      { type: "num", kicker: "Use it", prompt: "The Quotient Property also works backwards: $\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}$. Simplify $\\frac{\\sqrt{72}}{\\sqrt{2}}$.", answer: 6, skill: "Divide radicals",
        near: [{ v: 36, fb: "$\\sqrt{\\frac{72}{2}} = \\sqrt{36}$. Now take the root." }],
        hints: ["$\\sqrt{\\frac{72}{2}}$."], why: "$\\sqrt{36} = 6$." }
    ]
  });

  /* ================================================ 8.6 · Solve radical equations */
  var HOW_8_6 = [["Isolate", "Get the radical alone on one side."],
                 ["Raise", "Raise both sides to the power of the index."],
                 ["Solve", "Solve the new equation."],
                 ["Check", "Check in the original equation. Raising to an even power can create extraneous solutions."]];
  LESSONS.push({
    title: "Solve radical equations",
    blurb: "Book 8.6 · Isolate, square, solve, and always check.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $(\\sqrt{7})^2$?", answer: 7, skill: "Multiply radicals",
        near: [{ v: 49, fb: "Squaring undoes the square root: you get the 7 back." }], hints: ["Squaring undoes a square root."], why: "$\\sqrt{7} \\cdot \\sqrt{7} = 7$." },
      { type: "learn", kicker: "The idea",
        prompt: "Squaring undoes a square root. So to solve a radical equation, get the radical alone and square both sides. But squaring can let in answers that do not work in the original, so the check is part of the method.",
        scene: { type: "method", how: HOW_8_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$\\sqrt{2x - 1} + 3 = 6$$",
        scene: { type: "walk", how: HOW_8_6, rows: [
          { step: 1, m: "\\sqrt{2x - 1} + 3 = 6", say: "The radical is not alone yet." },
          { step: 1, m: "\\sqrt{2x - 1} = 3", say: "Subtract 3 from both sides." },
          { step: 2, m: "2x - 1 = 9", say: "Square both sides. The radical is gone.",
            ask: { prompt: "What does squaring do to $\\sqrt{2x - 1}$?", answer: 0,
                   options: [{ t: "It leaves $2x - 1$" }, { t: "It leaves $4x^2 - 1$", fb: "Squaring a square root gives back the radicand, unchanged." }] } },
          { step: 3, m: "x = 5", say: "Add 1, then divide by 2." },
          { step: 4, m: "\\sqrt{2(5) - 1} + 3 = 6", say: "$\\sqrt{9} + 3 = 6$. It checks. ✓" }] },
        gate: true, then: "Isolate first. Squaring $\\sqrt{2x - 1} + 3$ as it stood would have kept a radical." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$\\sqrt{x + 7} = x - 5$$",
        how: HOW_8_6, skill: "Solve a radical equation",
        steps: [
          { step: 1, ask: "Is the radical already alone on one side?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "No", fb: "The left side is the radical and nothing else." }],
            m: "\\sqrt{x + 7} = x - 5", say: "Ready to square." },
          { step: 2, ask: "Square both sides.", type: "choice", answer: 0,
            options: [{ t: "$x + 7 = x^2 - 10x + 25$" }, { t: "$x + 7 = x^2 - 25$", fb: "$(x - 5)^2$ has a middle term: $-10x$." }, { t: "$x + 7 = x^2 + 25$", fb: "$(x - 5)^2 = x^2 - 10x + 25$." }],
            m: "x + 7 = x^2 - 10x + 25", say: "The right side is a binomial squared." },
          { step: 3, ask: "That gives $0 = x^2 - 11x + 18$. Factor it.", type: "choice", answer: 0,
            options: [{ t: "$(x - 9)(x - 2) = 0$" }, { t: "$(x + 9)(x + 2) = 0$", fb: "That gives $+11x$." }, { t: "$(x - 6)(x - 3) = 0$", fb: "$-6 - 3 = -9$, not $-11$." }],
            m: "(x - 9)(x - 2) = 0", say: "So $x = 9$ or $x = 2$, as far as the algebra goes." },
          { step: 4, ask: "Check $x = 2$ in the original: the left is $\\sqrt{9} = 3$ and the right is $2 - 5 = -3$.", type: "choice", answer: 0,
            options: [{ t: "Extraneous: discard it" }, { t: "A solution", fb: "$3 \\ne -3$. It fails the original equation." }],
            m: "x = 9", say: "$x = 9$ checks: $\\sqrt{16} = 4$ and $9 - 5 = 4$. It is the only solution." }],
        why: "Isolate, raise, solve, check. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $\\sqrt{x - 3} = 4$.", pre: "$x =$", answer: 19, skill: "Solve a radical equation",
        near: [{ v: 7, fb: "Square the 4 first: $x - 3 = 16$." }, { v: 13, fb: "$x - 3 = 16$. Add 3." }],
        hints: ["Square both sides: $x - 3 = 16$."], why: "$x - 3 = 16$, so $x = 19$. Check: $\\sqrt{16} = 4$." },
      { type: "learn", kicker: "A harder case",
        prompt: "With two radicals, one squaring is not enough. $$\\sqrt{x} + 2 = \\sqrt{x + 16}$$",
        scene: { type: "walk", how: HOW_8_6, rows: [
          { step: 1, m: "\\sqrt{x} + 2 = \\sqrt{x + 16}", say: "One radical is already alone, on the right." },
          { step: 2, m: "x + 4\\sqrt{x} + 4 = x + 16", say: "Square both sides. The left side is a binomial squared, so it keeps a radical in its middle term." },
          { step: 3, m: "4\\sqrt{x} = 12", say: "A radical is still there. Isolate it: subtract $x$ and 4." },
          { step: 3, m: "\\sqrt{x} = 3", say: "Divide by 4." },
          { step: 3, m: "x = 9", say: "Square both sides again." },
          { step: 4, m: "\\sqrt{9} + 2 = \\sqrt{25}", say: "$3 + 2 = 5$. It checks. ✓" }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Solve $\\sqrt{x} = -4$.",
        options: [{ t: "No solution" }, { t: "$x = 16$", fb: "Check it: $\\sqrt{16} = 4$, not $-4$." }, { t: "$x = -16$", fb: "$\\sqrt{-16}$ is not a real number." }],
        answer: 0, skill: "Solve a radical equation", hints: ["Can a principal square root be negative?"], why: "A principal square root is never negative, so no $x$ works." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the solving **first** goes wrong.",
        lines: ["\\sqrt{x} + 3 = 7", "x + 9 = 49", "x = 40"], answer: 1, fix: "\\sqrt{x} = 4",
        fb: { 0: GIVEN, 2: LATER }, skill: "Solve a radical equation",
        hints: ["Was the radical alone before both sides were squared?"],
        why: "Isolate first: $\\sqrt{x} = 4$, so $x = 16$. And $(\\sqrt{x} + 3)^2$ is not $x + 9$ in any case." },
      { type: "num", kicker: "Use it", prompt: "An object dropped from a height of $h$ feet takes $t = \\frac{\\sqrt{h}}{4}$ seconds to land. From what height does the fall take **3 seconds**?",
        post: "feet", answer: 144, skill: "Radical applications",
        near: [{ v: 12, fb: "That is $\\sqrt{h}$. Square it." }, { v: 36, fb: "$\\sqrt{h} = 12$, so $h = 12^2$." }],
        hints: ["$3 = \\frac{\\sqrt{h}}{4}$, so $\\sqrt{h} = 12$."], why: "$\\sqrt{h} = 12$, so $h = 144$." }
    ]
  });
  /* =============================================== 8.7 · Use radicals in functions */
  var HOW_8_7 = [["Index", "Is the index even or odd?"],
                 ["Radicand", "Even index: the radicand must be greater than or equal to 0. Odd index: any radicand works."],
                 ["Solve", "Solve the inequality for $x$."],
                 ["Write", "Write the domain in interval notation."]];
  var ROOT87 = function (x) { return x >= 2 ? Math.sqrt(3 * x - 6) : NaN; }, CBRT = function (x) { return Math.cbrt(x); };
  LESSONS.push({
    title: "Radical functions",
    blurb: "Book 8.7 · Evaluating a radical function, finding its domain, and the shape of its graph.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "For $f(x) = \\sqrt{x + 5}$, find $f(4)$.", pre: "$f(4) =$", answer: 3, skill: "Evaluate a radical function",
        near: [{ v: 9, fb: "That is the radicand. Take its square root." }, { v: 7, fb: "Add inside the radical first: $\\sqrt{4 + 5}$." }],
        hints: ["$\\sqrt{4 + 5}$."], why: "$\\sqrt{9} = 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **radical function** has its variable under a radical. With an even index it only makes sense where the radicand is not negative, so its domain comes from solving an inequality. With an odd index, every real number works.",
        scene: { type: "method", how: HOW_8_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the domain of $f(x) = \\sqrt{3x - 6}$ found.",
        scene: { type: "walk", how: HOW_8_7, rows: [
          { step: 1, m: "f(x) = \\sqrt{3x - 6}", say: "A square root: the index is 2, which is even." },
          { step: 2, m: "3x - 6 \\ge 0", say: "The radicand must not be negative.",
            ask: { prompt: "For an even index, the radicand must be…", answer: 0,
                   options: [{ t: "$\\ge 0$" }, { t: "$> 0$", fb: "0 is allowed: $\\sqrt{0} = 0$." }, { t: "any real number", fb: "A negative radicand has no real square root." }] } },
          { step: 3, m: "x \\ge 2", say: "Add 6, then divide by 3." },
          { step: 4, m: "[2, \\infty)", say: "The graph starts at $x = 2$ and runs to the right.", fig: grid("A curve starting at the point (2, 0) and rising to the right, flattening as it goes.", curve(ROOT87, 2, 10, "blue").concat([{ pt: [2, 0], c: "blue" }]), { x: [-1, 10], y: [-1, 6] }) }] },
        gate: true, then: "The domain is exactly where the graph exists." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. Find the domain of $g(x) = \\sqrt{10 - 2x}$.",
        how: HOW_8_7, skill: "Domain of a radical function",
        steps: [
          { step: 1, ask: "Is the index even or odd?", type: "choice", answer: 0,
            options: [{ t: "Even: it is a square root" }, { t: "Odd", fb: "A square root has index 2." }],
            m: "g(x) = \\sqrt{10 - 2x}", say: "So the radicand is restricted." },
          { step: 2, ask: "Which inequality must hold?", type: "choice", answer: 0,
            options: [{ t: "$10 - 2x \\ge 0$" }, { t: "$10 - 2x > 0$", fb: "A radicand of 0 is allowed." }, { t: "$x \\ge 0$", fb: "It is the whole radicand, $10 - 2x$, that must not be negative." }],
            m: "10 - 2x \\ge 0", say: "The whole radicand." },
          { step: 3, ask: "Solve $-2x \\ge -10$.", type: "choice", answer: 0,
            options: [{ t: "$x \\le 5$" }, { t: "$x \\ge 5$", fb: "Dividing by $-2$ reverses the inequality sign." }],
            m: "x \\le 5", say: "Dividing by a negative reverses the sign." },
          { step: 4, ask: "Write the domain in interval notation.", type: "choice", answer: 0,
            options: [{ t: "$(-\\infty, 5]$" }, { t: "$[5, \\infty)$", fb: "That is $x \\ge 5$." }, { t: "$(-\\infty, 5)$", fb: "5 is included: $g(5) = \\sqrt{0} = 0$." }],
            m: "(-\\infty, 5]", say: "This graph starts at $x = 5$ and runs to the left." }],
        why: "Index, radicand, solve, write. Now graph a domain yourself." },
      { type: "numberline", kicker: "On your own", prompt: "Graph the domain of $f(x) = \\sqrt{x + 3}$.",
        min: -8, max: 6, mode: "ray", variable: "x", ray: { at: 0, dir: "left", closed: false },
        answer: { at: -3, dir: "right", closed: true }, skill: "Domain of a radical function",
        hints: ["$x + 3 \\ge 0$."], why: "$x \\ge -3$: a filled circle at $-3$, shaded to the right." },
      { type: "num", prompt: "For $g(x) = \\sqrt[3]{x - 4}$, find $g(-4)$.", pre: "$g(-4) =$", answer: -2, skill: "Evaluate a radical function",
        near: [{ v: 2, fb: "$\\sqrt[3]{-8}$ is negative: $(-2)^3 = -8$." }], hints: ["$\\sqrt[3]{-8}$."], why: "$-4 - 4 = -8$, and $\\sqrt[3]{-8} = -2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An odd index changes everything. Find the domain and range of $g(x) = \\sqrt[3]{x}$.",
        scene: { type: "walk", how: HOW_8_7, rows: [
          { step: 1, m: "g(x) = \\sqrt[3]{x}", say: "A cube root: the index is odd.", fig: grid("An S-shaped curve through the origin, rising slowly from the lower left to the upper right.", curve(CBRT, -8, 8, "blue").concat([{ pt: [0, 0], c: "blue" }]), { x: [-8, 8], y: [-4, 4] }) },
          { step: 2, m: "\\text{any radicand}", say: "Negative numbers have cube roots, so nothing is ruled out." },
          { step: 4, m: "\\text{domain: } (-\\infty, \\infty)", say: "Every real number is an input." },
          { step: 4, m: "\\text{range: } (-\\infty, \\infty)", say: "And every real number is an output. For $\\sqrt{x}$, both would be $[0, \\infty)$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "What is the **range** of $f(x) = \\sqrt{x}$?",
        options: [{ t: "$[0, \\infty)$" }, { t: "$(-\\infty, \\infty)$", fb: "A principal square root is never negative." }, { t: "$(0, \\infty)$", fb: "0 is an output: $\\sqrt{0} = 0$." }],
        answer: 0, skill: "Domain of a radical function", hints: ["What is the smallest value a square root can have?"], why: "The outputs start at 0 and grow without end." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lee says the domain of $h(x) = \\sqrt[3]{x - 1}$ is $[1, \\infty)$. What is wrong?",
        options: [{ t: "The index is odd, so the radicand may be negative. The domain is all real numbers." },
                  { t: "It should be $(1, \\infty)$.", fb: "No value needs to be left out at all." },
                  { t: "Nothing. $x - 1 \\ge 0$ gives $x \\ge 1$.", fb: "That inequality is only needed for an even index." }],
        answer: 0, skill: "Domain of a radical function", hints: ["Step 1: even or odd?"], why: "$h(0) = \\sqrt[3]{-1} = -1$ is perfectly real." },
      { type: "num", kicker: "Use it", prompt: "From a height of $h$ feet you can see about $d(h) = 1.2\\sqrt{h}$ miles. How far can you see from a **100-foot** tower?",
        post: "miles", answer: 12, skill: "Evaluate a radical function",
        near: [{ v: 120, fb: "Take the square root of 100 first." }],
        hints: ["$1.2 \\cdot \\sqrt{100}$."], why: "$1.2 \\cdot 10 = 12$." }
    ]
  });

  /* ========================================== 8.8 · Use the complex number system */
  var HOW_8_8 = [["Use i", "Write every square root of a negative number with $i$ first: $\\sqrt{-b} = \\sqrt{b}\\,i$."],
                 ["Distribute", "Multiply like binomials: each term by each term."],
                 ["i² = −1", "Replace $i^2$ with $-1$."],
                 ["Standard", "Combine like parts and write the result as $a + bi$."]];
  var HOW_8_8D = [["Conjugate", "Multiply the top and the bottom by the complex conjugate of the denominator."],
                  ["Multiply", "Multiply out both, using $i^2 = -1$."],
                  ["Standard", "Write the result as $a + bi$."]];
  LESSONS.push({
    title: "The complex number system",
    blurb: "Book 8.8 · The imaginary unit, and adding, multiplying and dividing complex numbers.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Does $x^2 = -9$ have a real solution?",
        options: [{ t: "No: a real number squared is never negative" }, { t: "Yes: $x = -3$", fb: "$(-3)^2 = +9$." }, { t: "Yes: $x = 3$", fb: "$3^2 = +9$." }],
        answer: 0, skill: "Complex numbers", hints: ["Square a positive number. Square a negative number."], why: "Squares of real numbers are never negative." },
      { type: "learn", kicker: "The idea",
        prompt: "No real number squares to a negative, so a new number is defined: $i = \\sqrt{-1}$, with $i^2 = -1$. A **complex number** is $a + bi$: a real part and an imaginary part. Complex numbers add and multiply like binomials.",
        scene: { type: "method", how: HOW_8_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a product. $$(2 + \\sqrt{-9})(1 - \\sqrt{-4})$$",
        scene: { type: "walk", how: HOW_8_8, rows: [
          { step: 1, m: "(2 + \\sqrt{-9})(1 - \\sqrt{-4})", say: "First rewrite the square roots of negatives." },
          { step: 1, m: "(2 + 3i)(1 - 2i)", say: "$\\sqrt{-9} = 3i$ and $\\sqrt{-4} = 2i$." },
          { step: 2, m: "2 - 4i + 3i - 6i^2", say: "FOIL, exactly as with binomials." },
          { step: 3, m: "2 - 4i + 3i + 6", say: "$i^2 = -1$, so $-6i^2 = +6$.",
            ask: { prompt: "What does $-6i^2$ become?", answer: 0,
                   options: [{ t: "$+6$" }, { t: "$-6$", fb: "$i^2 = -1$, so $-6 \\cdot (-1) = +6$." }, { t: "$6i$", fb: "$i^2$ is the real number $-1$. No $i$ is left." }] } },
          { step: 4, m: "8 - i", say: "Real parts: $2 + 6$. Imaginary parts: $-4i + 3i$." }] },
        gate: true, then: "Adding is simpler still: real with real, imaginary with imaginary." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$(2 - 5i)(3 + i)$$",
        how: HOW_8_8, skill: "Multiply complex numbers",
        steps: [
          { step: 1, ask: "Is anything still written as a square root of a negative number?", type: "choice", answer: 0,
            options: [{ t: "No: go straight to multiplying" }, { t: "Yes", fb: "Both factors are already written with $i$." }],
            m: "(2 - 5i)(3 + i)", say: "Already in terms of $i$." },
          { step: 2, ask: "Multiply out the four products.", type: "choice", answer: 0,
            options: [{ t: "$6 + 2i - 15i - 5i^2$" }, { t: "$6 - 5i^2$", fb: "That is only First and Last. Add the Outer and Inner products." }, { t: "$6 + 2i - 15i + 5i^2$", fb: "$-5i \\cdot i = -5i^2$." }],
            m: "6 + 2i - 15i - 5i^2", say: "First, Outer, Inner, Last." },
          { step: 3, ask: "What does $-5i^2$ become?", type: "choice", answer: 0,
            options: [{ t: "$+5$" }, { t: "$-5$", fb: "$-5 \\cdot (-1) = +5$." }],
            m: "6 + 2i - 15i + 5", say: "$i^2 = -1$." },
          { step: 4, ask: "Combine the real parts and the imaginary parts.", type: "choice", answer: 0,
            options: [{ t: "$11 - 13i$" }, { t: "$1 - 13i$", fb: "$6 + 5 = 11$." }, { t: "$11 + 17i$", fb: "$2i - 15i = -13i$." }],
            m: "11 - 13i", say: "Standard form: $a + bi$." }],
        why: "Use $i$, distribute, $i^2 = -1$, standard form. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Add $(5 - 2i) + (3 + 7i)$.",
        options: [{ t: "$8 + 5i$" }, { t: "$8 + 9i$", fb: "$-2i + 7i = 5i$." }, { t: "$13i$", fb: "Real parts and imaginary parts stay separate." }],
        answer: 0, skill: "Add complex numbers", hints: ["Real with real, imaginary with imaginary."], why: "$5 + 3 = 8$ and $-2i + 7i = 5i$." },
      { type: "num", prompt: "Multiply $(2 + 3i)(2 - 3i)$. The answer is a real number.", answer: 13, skill: "Multiply complex numbers",
        near: [{ v: -5, fb: "$-9i^2 = +9$, so it is $4 + 9$." }, { v: 4, fb: "The last product is $-9i^2 = +9$. Add it." }],
        hints: ["$4 - 6i + 6i - 9i^2$."], why: "$4 - 9i^2 = 4 + 9 = 13$. A complex number times its conjugate is always real." },
      { type: "learn", kicker: "A harder case",
        prompt: "That is the key to dividing: multiply by the conjugate, and the denominator turns real. $$\\frac{3 + 2i}{1 - i}$$",
        scene: { type: "walk", how: HOW_8_8D, rows: [
          { step: 1, m: "\\frac{3 + 2i}{1 - i} \\cdot \\frac{1 + i}{1 + i}", say: "The conjugate of $1 - i$ is $1 + i$." },
          { step: 2, m: "\\frac{3 + 3i + 2i + 2i^2}{1 - i^2}", say: "FOIL on top. Below, the product of conjugates." },
          { step: 2, m: "\\frac{1 + 5i}{2}", say: "$2i^2 = -2$ on top, and $1 - i^2 = 2$ below." },
          { step: 3, m: "\\frac{1}{2} + \\frac{5}{2}i", say: "Divide each part by 2." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "The powers of $i$ repeat every four: $i$, $-1$, $-i$, $1$. Simplify $i^{10}$.",
        options: [{ t: "$-1$" }, { t: "$1$", fb: "$i^8 = 1$, and two more factors give $i^2$." }, { t: "$i$", fb: "$i^{10} = i^8 \\cdot i^2$." }, { t: "$-i$", fb: "$i^{10} = i^8 \\cdot i^2$." }],
        answer: 0, skill: "Powers of i", hints: ["$i^{10} = i^8 \\cdot i^2$, and $i^8 = (i^4)^2 = 1$."], why: "$i^{10} = 1 \\cdot i^2 = -1$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\sqrt{-4} \\cdot \\sqrt{-9}", "\\sqrt{36}", "6"], answer: 1, fix: "2i \\cdot 3i",
        fb: { 0: GIVEN, 2: LATER }, skill: "Multiply complex numbers",
        hints: ["Step 1 of the method was skipped."],
        why: "The Product Property needs non-negative radicands. Rewrite first: $2i \\cdot 3i = 6i^2 = -6$." },
      { type: "choice", kicker: "Use it", prompt: "With complex numbers, every quadratic equation has solutions. Solve $x^2 = -49$.",
        options: [{ t: "$x = 7i$ or $x = -7i$" }, { t: "$x = 7$ or $x = -7$", fb: "Those square to $+49$." }, { t: "$x = -7i$ only", fb: "$(7i)^2 = 49i^2 = -49$ as well." }],
        answer: 0, skill: "Complex numbers", hints: ["$\\sqrt{-49} = 7i$, and there are two square roots."], why: "$(7i)^2 = -49$ and $(-7i)^2 = -49$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "a2u8-roots", title: "Evaluate a root", lesson: 2,
      gen: function (R) {
        var P = R.pick([[2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [11, 2], [12, 2], [2, 3], [3, 3], [4, 3], [5, 3], [-2, 3], [-3, 3], [-4, 3], [2, 4], [3, 4], [2, 5], [-2, 5]]);
        var b = P[0], n = P[1], rad = Math.pow(b, n), tex = n === 2 ? "\\sqrt{" + rad + "}" : "\\sqrt[" + n + "]{" + rad + "}";
        return { type: "num", prompt: "Evaluate $" + tex + "$.", answer: b,
          near: near(b, [{ v: -b, fb: b < 0 ? "An odd root of a negative number is negative." : "The radical sign means the principal root, which is positive." }, { v: rad / n, tol: 1e-9, fb: "A root is not a division. Which number, raised to the power " + n + ", gives " + rad + "?" }]),
          hints: ["Which number, raised to the power " + n + ", gives $" + rad + "$?"], why: "$" + (b < 0 ? "(" + b + ")" : b) + "^" + n + " = " + rad + "$." };
      } },
    { id: "a2u8-simplify", title: "Simplify a square root", lesson: 3,
      gen: function (R) {
        var k = R.int(2, 9), m = R.pick([2, 3, 5, 6, 7, 10]);
        return { type: "num", prompt: "$$\\sqrt{" + k * k * m + "} = \\square\\sqrt{" + m + "}$$ What goes in the box?", answer: k,
          near: near(k, [{ v: k * k, fb: k * k + " is the perfect square inside. Its **root**, " + k + ", is what comes out." }]),
          hints: ["$" + k * k * m + " = " + k * k + " \\cdot " + m + "$."], why: "$\\sqrt{" + k * k + "} \\cdot \\sqrt{" + m + "} = " + k + "\\sqrt{" + m + "}$." };
      } },
    { id: "a2u8-rational", title: "Evaluate a rational exponent", lesson: 4,
      gen: function (R) {
        var P = R.pick([[4, 2, 3], [9, 2, 3], [16, 2, 3], [25, 2, 3], [8, 3, 2], [27, 3, 2], [64, 3, 2], [16, 4, 3], [81, 4, 3], [32, 5, 2], [32, 5, 3], [8, 3, 4], [27, 3, 4], [4, 2, 5]]);
        var root = Math.round(Math.pow(P[0], 1 / P[1])), ans = Math.pow(root, P[2]);
        return { type: "num", prompt: "Evaluate $" + P[0] + "^{\\frac{" + P[2] + "}{" + P[1] + "}}$.", answer: ans,
          near: near(ans, [{ v: P[0] * P[2] / P[1], tol: 1e-9, fb: "An exponent is not a multiplier. Take the root, then the power." }, { v: Math.pow(Math.round(Math.pow(P[0], 1 / P[2])), P[1]), fb: "The **denominator** is the root, and the numerator is the power." }]),
          hints: ["The " + (P[1] === 2 ? "square" : P[1] === 3 ? "cube" : P[1] === 4 ? "fourth" : "fifth") + " root of " + P[0] + " is " + root + ". Then raise it to the power " + P[2] + "."], why: "$" + root + "^" + P[2] + " = " + ans + "$." };
      } },
    { id: "a2u8-combine", title: "Add and subtract radicals", lesson: 5,
      gen: function (R) {
        var m = R.pick([2, 3, 5, 7]), a = R.int(2, 7), k = R.int(2, 5), b = R.int(1, 3), sub = R.chance(0.4), ans = sub ? a - b * k : a + b * k;
        if (ans === 0) { a += 1; ans += 1; }
        return { type: "num", prompt: "$$" + a + "\\sqrt{" + m + "} " + (sub ? "-" : "+") + " " + (b === 1 ? "" : b) + "\\sqrt{" + k * k * m + "} = \\square\\sqrt{" + m + "}$$ What goes in the box?", answer: ans,
          near: near(ans, [{ v: sub ? a - b : a + b, fb: "Simplify $\\sqrt{" + k * k * m + "}$ first: it is $" + k + "\\sqrt{" + m + "}$." }]),
          hints: ["$\\sqrt{" + k * k * m + "} = " + k + "\\sqrt{" + m + "}$."], why: "$" + a + "\\sqrt{" + m + "} " + (sub ? "-" : "+") + " " + b * k + "\\sqrt{" + m + "} = " + ans + "\\sqrt{" + m + "}$." };
      } },
    { id: "a2u8-rationalize", title: "Rationalize a denominator", lesson: 6,
      gen: function (R) {
        var m = R.pick([2, 3, 5, 6, 7]), c = R.int(2, 6), k = c * m, S = "\\sqrt{" + m + "}";
        return mc(R, { prompt: "Rationalize the denominator. $$\\frac{" + k + "}{" + S + "}$$", right: "$" + c + S + "$",
          wrong: [{ t: "$\\frac{" + k + S + "}{" + m * m + "}$", fb: "$" + S + " \\cdot " + S + " = " + m + "$, not " + m * m + "." },
                  { t: "$" + k + S + "$", fb: "The denominator becomes " + m + ". Divide " + k + " by it." }],
          hints: ["Multiply the top and the bottom by $" + S + "$."], why: "$\\frac{" + k + S + "}{" + m + "} = " + c + S + "$." });
      } },
    { id: "a2u8-equation", title: "Solve a radical equation", lesson: 7,
      gen: function (R) {
        var q = R.int(2, 9), p = R.nz(-9, 9), c = R.int(0, 5), x0 = q * q - p;
        return { type: "num", prompt: "Solve. $$\\sqrt{" + poly([[1, "x"], [p, ""]]) + "}" + (c ? " + " + c : "") + " = " + (q + c) + "$$", pre: "$x =$", answer: x0,
          near: near(x0, [{ v: q - p, fb: "Square the " + q + " before you undo the " + (p < 0 ? "subtraction" : "addition") + "." }]),
          hints: [(c ? "Subtract " + c + " first. Then square" : "Square") + " both sides: $" + poly([[1, "x"], [p, ""]]) + " = " + q * q + "$."],
          why: "$" + poly([[1, "x"], [p, ""]]) + " = " + q * q + "$, so $x = " + x0 + "$." };
      } },
    { id: "a2u8-domain", title: "Find the domain of a radical function", lesson: 8,
      gen: function (R) {
        var a = R.pick([1, 2, 3, -1, -2]), k = R.int(-5, 5), b = -a * k, rad = poly([[a, "x"], [b, ""]]);
        var right = a > 0 ? "$[" + k + ", \\infty)$" : "$(-\\infty, " + k + "]$", flip = a > 0 ? "$(-\\infty, " + k + "]$" : "$[" + k + ", \\infty)$";
        return mc(R, { prompt: "What is the domain of $f(x) = \\sqrt{" + rad + "}$?", right: right,
          wrong: [{ t: flip, fb: a > 0 ? "Solve $" + rad + " \\ge 0$: $x \\ge " + k + "$." : "Dividing by a negative number reverses the sign: $x \\le " + k + "$." },
                  { t: "$(-\\infty, \\infty)$", fb: "With an even index the radicand must not be negative." }],
          hints: ["Solve $" + rad + " \\ge 0$."], why: "$" + rad + " \\ge 0$ gives $x " + (a > 0 ? "\\ge" : "\\le") + " " + k + "$." });
      } },
    { id: "a2u8-complex", title: "Multiply complex numbers", lesson: 9,
      gen: function (R) {
        var a = R.int(1, 5), b = R.nz(-5, 5), c = R.int(1, 5), d = R.nz(-5, 5), re = a * c - b * d, im = a * d + b * c;
        function cx(x, y) { return y === 0 ? String(x) : x + " " + (y < 0 ? "-" : "+") + " " + (Math.abs(y) === 1 ? "" : Math.abs(y)) + "i"; }
        return mc(R, { prompt: "Multiply. $$(" + cx(a, b) + ")(" + cx(c, d) + ")$$", right: "$" + cx(re, im) + "$",
          wrong: [{ t: "$" + cx(a * c + b * d, im) + "$", fb: "$i^2 = -1$, so the last product changes sign." },
                  { t: "$" + cx(a * c, b * d) + "$", fb: "That is only First and Last. Add the Outer and Inner products, and replace $i^2$ with $-1$." }],
          hints: ["FOIL, then replace $i^2$ with $-1$."], why: "Real part: $" + a * c + " - (" + b * d + ") = " + re + "$. Imaginary part: $" + a * d + " + (" + b * c + ") = " + im + "$." });
      } }
  ];
  L.unit("alg2", 8, {
    title: "Roots and Radicals",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Roots, simplifying radicals, rational exponents, and adding radicals.",
        skills: ["a2u8-roots", "a2u8-simplify", "a2u8-rational", "a2u8-combine"], per: 2 },
      { title: "Quiz 2", after: 9, blurb: "Rationalizing, radical equations, domains, and complex numbers.",
        skills: ["a2u8-rationalize", "a2u8-equation", "a2u8-domain", "a2u8-complex"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:8", {
    2: { name: "Roots", frame: "$\\sqrt[n]{a}$ is the number whose [[$n$th power]] is $a$. The radical sign means the [[principal]] root. An [[even]] root of a negative number is not real. An [[odd]] root of a negative number is negative.",
         chips: ["half", "smaller"] },
    3: { name: "Simplifying radicals", frame: "$\\sqrt{ab} = \\sqrt{a} \\cdot \\sqrt{b}$. To simplify, pull out the largest [[perfect square]] factor. The property works for products and [[quotients]], never for [[sums]].",
         chips: ["prime", "powers"], fb: { "prime": "A prime has no square factor. It is the perfect squares that come out." } },
    4: { name: "Rational exponents", frame: "$a^{\\frac{1}{n}}$ is the [[$n$th root]] of $a$. In $a^{\\frac{m}{n}}$ the [[denominator]] is the root and the [[numerator]] is the power. A negative exponent still means a [[reciprocal]].",
         chips: ["opposite", "product"] },
    5: { name: "Like radicals", frame: "Like radicals have the same [[index]] and the same [[radicand]]. Add their [[coefficients]] and keep the radical. Always [[simplify]] first.",
         chips: ["exponent", "multiply"] },
    6: { name: "Rationalizing", frame: "To rationalize a denominator of $\\sqrt{a}$, multiply the top and the bottom by [[$\\sqrt{a}$]]. For a two-term denominator, multiply by its [[conjugate]], because $(a - b)(a + b) = $ [[$a^2 - b^2$]].",
         chips: ["$a$", "reciprocal"] },
    7: { name: "Radical equations", frame: "[[Isolate]] the radical, then raise both sides to the power of the [[index]]. Squaring can create [[extraneous]] solutions, so always [[check]] in the original equation.",
         chips: ["factor", "exponent"] },
    8: { name: "Radical functions", frame: "For an [[even]] index, the radicand must be [[$\\ge 0$]]. For an [[odd]] index, the domain is all real numbers.",
         chips: ["$> 0$", "negative"], fb: { "$> 0$": "A radicand of exactly 0 is fine: $\\sqrt{0} = 0$." } },
    9: { name: "Complex numbers", frame: "$i = $ [[$\\sqrt{-1}$]], so $i^2 = $ [[$-1$]]. A complex number has the form [[$a + bi$]]. To divide, multiply the top and the bottom by the [[conjugate]] of the denominator.",
         chips: ["$1$", "reciprocal"] }
  });
})();
