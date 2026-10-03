/* ==========================================================================
   Algebra II — Unit 5: Polynomials and Polynomial Functions. See lab/core.js
   for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 5, section for section:
   the readiness check, then 5.1 to 5.4. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   Adding and subtracting (5.1), the properties of exponents and scientific
   notation (5.2), multiplying (5.3, with the tiles), and dividing: long
   division, synthetic division and the Remainder and Factor Theorems (5.4).

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
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
  var KEYS_POLY = [["$x$", "x"], ["$x^2$", "x^2"], ["$x^3$", "x^3"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]];

  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Chapter 5 Be Prepared · Combine like terms, distribute, and work with powers.",
    mins: 6, v: 1,
    steps: [
      { type: "expr", kicker: "Check 1 · Like terms", prompt: "Simplify $3x^2 + 5x - x^2 + 2x$.",
        answer: "2x^2+7x", shown: "2x^2 + 7x", form: "simplified", skill: "Combine like terms", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "9x^3", fb: "Only like terms combine: the $x^2$ terms together, the $x$ terms together." }],
        hints: ["$3x^2 - x^2$, and $5x + 2x$."], why: "$2x^2 + 7x$." },
      { type: "expr", prompt: "Simplify $-2(3x - 4)$.",
        answer: "-6x+8", shown: "-6x + 8", form: "simplified", skill: "Distributive Property", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "-6x-8", fb: "$-2 \\cdot (-4) = +8$." }, { v: "-6x-4", fb: "The $-2$ multiplies the 4 as well." }],
        hints: ["$-2 \\cdot 3x$ and $-2 \\cdot (-4)$."], why: "$-6x + 8$." },
      { type: "num", kicker: "Check 2 · Powers", prompt: "Evaluate $2^3 \\cdot 2^2$.", answer: 32, skill: "Evaluate powers",
        near: [{ v: 64, fb: "$2^3 \\cdot 2^2 = 8 \\cdot 4$. That is $2^5$, not $2^6$." }, { v: 12, fb: "$2^3 = 8$ and $2^2 = 4$: multiply them." }],
        hints: ["$8 \\cdot 4$."], why: "$8 \\cdot 4 = 32 = 2^5$." },
      { type: "num", prompt: "Evaluate $(-3)^2$.", answer: 9, skill: "Evaluate powers",
        near: [{ v: -9, fb: "With parentheses, the base is $-3$: a negative times a negative is positive." }, { v: -6, fb: "$(-3)^2$ is $(-3)(-3)$." }],
        hints: ["$(-3)(-3)$."], why: "$(-3)(-3) = 9$." },
      { type: "choice", kicker: "Check 3 · Multiplying letters", prompt: "What is $x \\cdot x$?",
        options: [{ t: "$x^2$" }, { t: "$2x$", fb: "$2x$ is $x + x$. A product of two $x$s is a square." }],
        answer: 0, skill: "Multiply monomials", hints: ["Two factors of $x$."], why: "$x \\cdot x = x^2$." },
      { type: "num", prompt: "What is $0.01$ written as a power of ten? $0.01 = 10^{\\square}$", answer: -2, skill: "Powers of ten",
        near: [{ v: 2, fb: "$10^2 = 100$. A number less than 1 needs a negative exponent." }], hints: ["$0.01 = \\frac{1}{100}$."], why: "$\\frac{1}{10^2} = 10^{-2}$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 5.1**. If **check 1** slipped, see lessons 1.1 and 1.5. If **check 2** or **check 3** slipped, lesson 5.2 rebuilds the exponent rules from the start.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ======================================= 5.1 · Add and subtract polynomials */
  var HOW_5_1 = [["Standard", "Write each polynomial in standard form: highest degree first."],
                 ["Signs", "Subtracting? Change the sign of every term of the polynomial being subtracted."],
                 ["Group", "Put like terms together: same variable, same exponent."],
                 ["Combine", "Add the coefficients of the like terms. The exponents stay."]];
  LESSONS.push({
    title: "Add and subtract polynomials",
    blurb: "Book 5.1 · Degree, like terms, adding and subtracting polynomials and polynomial functions.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The **degree** of a polynomial is its highest exponent. What is the degree of $5x^3 - 2x + 7$?",
        answer: 3, skill: "Degree of a polynomial",
        near: [{ v: 5, fb: "5 is a coefficient. The degree is the highest exponent." }, { v: 4, fb: "Don't add the exponents. Take the largest one." }],
        hints: ["Which term has the largest exponent?"], why: "The term $5x^3$ has the highest exponent, 3." },
      { type: "learn", kicker: "The idea",
        prompt: "A polynomial is a sum of terms. To add or subtract polynomials, combine **like terms**: only the coefficients change, never the exponents. Subtracting a polynomial means adding the opposite of **each** of its terms.",
        scene: { type: "method", how: HOW_5_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a subtraction. $$(4x^2 - 3x + 5) - (x^2 - 6x - 2)$$",
        scene: { type: "walk", how: HOW_5_1, rows: [
          { step: 1, m: "(4x^2 - 3x + 5) - (x^2 - 6x - 2)", say: "Both are already in standard form." },
          { step: 2, m: "4x^2 - 3x + 5 - x^2 + 6x + 2", say: "The minus sign reaches every term of the second polynomial.",
            ask: { prompt: "What does $-(x^2 - 6x - 2)$ become?", answer: 0,
                   options: [{ t: "$-x^2 + 6x + 2$" }, { t: "$-x^2 - 6x - 2$", fb: "The minus sign changes every term, not only the first." }, { t: "$x^2 + 6x + 2$", fb: "The first term changes sign as well." }] } },
          { step: 3, m: "4x^2 - x^2 - 3x + 6x + 5 + 2", say: "Like terms side by side." },
          { step: 4, m: "3x^2 + 3x + 7", say: "$4 - 1 = 3$, $-3 + 6 = 3$, $5 + 2 = 7$." }] },
        gate: true, then: "Adding is the same without step 2: no signs change." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$(5a^2 - 2a + 1) - (3a^2 + 4a - 6)$$",
        how: HOW_5_1, skill: "Add and subtract polynomials",
        steps: [
          { step: 1, ask: "Both are in standard form. What is the degree of each?", type: "choice", answer: 0,
            options: [{ t: "2" }, { t: "3", fb: "The degree is the highest exponent, not the number of terms." }],
            m: "(5a^2 - 2a + 1) - (3a^2 + 4a - 6)", say: "Two trinomials of degree 2." },
          { step: 2, ask: "Change the signs of the polynomial being subtracted.", type: "choice", answer: 0,
            options: [{ t: "$-3a^2 - 4a + 6$" }, { t: "$-3a^2 + 4a - 6$", fb: "Every term changes sign, not only the first." }, { t: "$3a^2 - 4a + 6$", fb: "The first term changes as well." }],
            m: "5a^2 - 2a + 1 - 3a^2 - 4a + 6", say: "Now it is an addition." },
          { step: 3, ask: "Which term is a like term for $-2a$?", type: "choice", answer: 0,
            options: [{ t: "$-4a$" }, { t: "$-3a^2$", fb: "The exponents differ: $a$ and $a^2$ are not like terms." }, { t: "$6$", fb: "6 has no variable." }],
            m: "5a^2 - 3a^2 - 2a - 4a + 1 + 6", say: "Grouped by exponent." },
          { step: 4, ask: "Combine the like terms.", type: "choice", answer: 0,
            options: [{ t: "$2a^2 - 6a + 7$" }, { t: "$2a^2 + 2a + 7$", fb: "$-2a - 4a = -6a$." }, { t: "$2a^2 - 6a - 5$", fb: "$1 + 6 = 7$." }],
            m: "2a^2 - 6a + 7", say: "The exponents did not change." }],
        why: "Standard form, signs, group, combine. Now an addition on your own." },
      { type: "expr", kicker: "On your own", prompt: "Add. $$(3x^2 - 4x + 1) + (x^2 + 6x - 5)$$",
        answer: "4x^2+2x-4", shown: "4x^2 + 2x - 4", form: "simplified", skill: "Add and subtract polynomials", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "4x^4+2x^2-4", fb: "Adding like terms keeps the exponent: $3x^2 + x^2 = 4x^2$." }, { v: "4x^2-10x-4", fb: "$-4x + 6x = 2x$." }],
        hints: ["$3x^2 + x^2$, then $-4x + 6x$, then $1 - 5$."], why: "$4x^2 + 2x - 4$." },
      { type: "sort", prompt: "A polynomial is named by its number of terms. Sort these.",
        bins: ["Monomial", "Binomial", "Trinomial"],
        cards: [{ t: "$7x^3$", bin: 0, fb: "One term." },
                { t: "$x^2 - 9$", bin: 1, fb: "Two terms." },
                { t: "$2a^2 + 3a - 1$", bin: 2, fb: "Three terms." },
                { t: "$-5$", bin: 0, fb: "A constant is a single term: a monomial of degree 0." }],
        skill: "Degree of a polynomial", hints: ["Count the terms: the parts separated by $+$ or $-$."],
        why: "One term: monomial. Two: binomial. Three: trinomial." },
      { type: "learn", kicker: "A harder case",
        prompt: "Functions subtract the same way. With $f(x) = 3x^2 - 5x + 2$ and $g(x) = x^2 + 4x - 7$, find $(f - g)(x)$ and then $(f - g)(2)$.",
        scene: { type: "walk", how: HOW_5_1, rows: [
          { step: 1, m: "(f - g)(x) = f(x) - g(x)", say: "Subtracting functions means subtracting their rules." },
          { step: 2, m: "3x^2 - 5x + 2 - x^2 - 4x + 7", say: "Change every sign of the rule for $g$." },
          { step: 4, m: "(f - g)(x) = 2x^2 - 9x + 9", say: "Combine like terms." },
          { step: 4, m: "(f - g)(2) = 8 - 18 + 9 = -1", say: "To evaluate, put 2 in place of $x$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "For $f(x) = 2x^2 - 3x + 4$, find $f(-2)$.", pre: "$f(-2) =$", answer: 18, skill: "Evaluate a polynomial function",
        near: [{ v: 6, fb: "$-3(-2) = +6$: same signs give a positive." }, { v: 2, fb: "$(-2)^2 = 4$, so $2(4) = 8$: positive." }],
        hints: ["$2(-2)^2 - 3(-2) + 4$."], why: "$8 + 6 + 4 = 18$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where this subtraction **first** goes wrong.",
        lines: ["(6x^2 + 2x - 3) - (4x^2 - 5x + 1)", "6x^2 + 2x - 3 - 4x^2 - 5x + 1", "2x^2 - 3x - 2"], answer: 1, fix: "6x^2 + 2x - 3 - 4x^2 + 5x - 1",
        fb: { 0: GIVEN, 2: LATER }, skill: "Add and subtract polynomials",
        hints: ["Did the minus sign reach every term of the second polynomial?"],
        why: "All three signs change: $-4x^2 + 5x - 1$. The answer is $2x^2 + 7x - 4$." },
      { type: "choice", kicker: "Use it", prompt: "A company's revenue is $R(x) = 5x^2 + 20x$ and its cost is $C(x) = 3x^2 + 5x + 100$. Profit is $P = R - C$. Which is $P(x)$?",
        options: [{ t: "$2x^2 + 15x - 100$" }, { t: "$2x^2 + 25x + 100$", fb: "Every term of $C$ is subtracted: $20x - 5x$ and $0 - 100$." }, { t: "$8x^2 + 25x + 100$", fb: "That is $R + C$. Profit is revenue **minus** cost." }],
        answer: 0, skill: "Add and subtract polynomials", hints: ["$(5x^2 + 20x) - (3x^2 + 5x + 100)$."], why: "$5x^2 - 3x^2 = 2x^2$, $20x - 5x = 15x$, and $0 - 100 = -100$." }
    ]
  });

  /* ============= 5.2 · Properties of exponents and scientific notation */
  var HOW_5_2 = [["Powers", "Apply any outside exponent first: it multiplies each exponent inside the parentheses."],
                 ["Same base", "Combine powers of the same base: add the exponents to multiply, subtract them to divide."],
                 ["Negatives", "Rewrite a negative exponent as a reciprocal: $a^{-n} = \\frac{1}{a^n}$. Any non-zero base to the power 0 is 1."]];
  var HOW_5_2B = [["Move", "Move the decimal point until exactly one non-zero digit is to its left."],
                  ["Count", "Count the places it moved. That is the size of the exponent."],
                  ["Sign", "A large number gets a positive exponent. A number less than 1 gets a negative one."]];
  LESSONS.push({
    title: "Properties of exponents and scientific notation",
    blurb: "Book 5.2 · The product, quotient and power properties, negative exponents, and scientific notation.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$x^3 \\cdot x^4$ is three $x$s times four $x$s. $$x^3 \\cdot x^4 = x^{\\square}$$ What goes in the box?",
        answer: 7, skill: "Exponent properties",
        near: [{ v: 12, fb: "Count the factors: three $x$s and four more make seven. Multiplying powers **adds** the exponents." }],
        hints: ["How many $x$s are multiplied altogether?"], why: "$3 + 4 = 7$ factors of $x$." },
      { type: "learn", kicker: "The idea",
        prompt: "An exponent counts repeated factors, and every property follows from counting. Multiply powers of one base: **add** the exponents. Divide: **subtract**. A power of a power: **multiply**. A negative exponent means a reciprocal.",
        scene: { type: "method", how: HOW_5_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one simplified. $$(2x^3)^2 \\cdot x^{-8}$$",
        scene: { type: "walk", how: HOW_5_2, rows: [
          { step: 1, m: "(2x^3)^2 \\cdot x^{-8}", say: "Start with the exponent outside the parentheses." },
          { step: 1, m: "4x^6 \\cdot x^{-8}", say: "It reaches both factors: $2^2 = 4$ and $(x^3)^2 = x^6$.",
            ask: { prompt: "What is $(x^3)^2$?", answer: 0,
                   options: [{ t: "$x^6$" }, { t: "$x^5$", fb: "A power of a power **multiplies** the exponents: $3 \\cdot 2$." }, { t: "$x^9$", fb: "Multiply the exponents: $3 \\cdot 2$, not $3^2$." }] } },
          { step: 2, m: "4x^{6 + (-8)} = 4x^{-2}", say: "Same base, multiplying: add the exponents." },
          { step: 3, m: "\\frac{4}{x^2}", say: "The negative exponent moves $x^2$ to the denominator. The 4 stays on top." }] },
        gate: true, then: "A negative exponent never makes a number negative. It makes a reciprocal." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$\\frac{(3y^4)^2}{y^{11}}$$",
        how: HOW_5_2, skill: "Exponent properties",
        steps: [
          { step: 1, ask: "Apply the outside exponent. What is $(3y^4)^2$?", type: "choice", answer: 0,
            options: [{ t: "$9y^8$" }, { t: "$3y^8$", fb: "The 3 is squared as well." }, { t: "$9y^6$", fb: "Multiply the exponents: $4 \\cdot 2 = 8$." }],
            m: "\\frac{9y^8}{y^{11}}", say: "$3^2 = 9$ and $(y^4)^2 = y^8$." },
          { step: 2, ask: "Same base, dividing: subtract the exponents. What is $8 - 11$?", type: "num", answer: -3, near: [{ v: 3, fb: "Top minus bottom: $8 - 11$ is negative." }], hint: "$8 - 11$.",
            m: "9y^{-3}", say: "Three more $y$s on the bottom than on the top." },
          { step: 3, ask: "Rewrite $9y^{-3}$ without a negative exponent.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{9}{y^3}$" }, { t: "$\\frac{1}{9y^3}$", fb: "Only $y$ carries the negative exponent. The 9 stays on top." }, { t: "$-9y^3$", fb: "A negative exponent does not make the value negative." }],
            m: "\\frac{9}{y^3}", say: "Only the power of $y$ moves down." }],
        why: "Powers, same base, negatives. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "$$(x^2)^5 \\cdot x^3 = x^{\\square}$$ What goes in the box?", answer: 13, skill: "Exponent properties",
        near: [{ v: 10, fb: "$(x^2)^5 = x^{10}$. Then multiply by $x^3$." }, { v: 30, fb: "The last step is a multiplication of powers: add 10 and 3." }],
        hints: ["Power of a power first, then add."], why: "$x^{10} \\cdot x^3 = x^{13}$." },
      { type: "num", prompt: "Evaluate $2^{-3}$. (Type a fraction like 1/4.)", answer: 0.125, tol: 1e-9, shown: "1/8", skill: "Negative exponents",
        near: [{ v: -8, fb: "A negative exponent means “one over”, not a negative number." }, { v: -6, fb: "An exponent is not a multiplier. $2^{-3} = \\frac{1}{2^3}$." }],
        hints: ["$\\frac{1}{2^3}$."], why: "$\\frac{1}{2^3} = \\frac{1}{8}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Powers of ten write very large and very small numbers compactly. That is **scientific notation**: a number from 1 up to 10, times a power of 10.",
        scene: { type: "walk", how: HOW_5_2B, rows: [
          { step: 1, m: "0.00052 \\to 5.2", say: "Move the decimal point until the first factor is at least 1 and less than 10." },
          { step: 2, m: "4 \\text{ places}", say: "The point moved 4 places." },
          { step: 3, m: "0.00052 = 5.2 \\times 10^{-4}", say: "The original number is less than 1, so the exponent is negative." },
          { step: 3, m: "37000 = 3.7 \\times 10^4", say: "A large number works the same way, with a positive exponent." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Write $6.3 \\times 10^{-3}$ in decimal form.", answer: 0.0063, tol: 1e-12, skill: "Scientific notation",
        near: [{ v: 6300, fb: "A negative exponent makes a small number: move the point to the left." }, { v: 0.063, tol: 1e-12, fb: "Move the point **three** places." }, { v: 0.00063, tol: 1e-12, fb: "Three places, not four." }],
        hints: ["Move the decimal point 3 places to the left."], why: "$6.3 \\to 0.0063$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["(2x^3)^4", "2^4 \\cdot x^{3 + 4}", "16x^7"], answer: 1, fix: "2^4 \\cdot x^{3 \\cdot 4}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Exponent properties",
        hints: ["A power of a power: add the exponents, or multiply them?"],
        why: "$(x^3)^4$ is four groups of three $x$s: $x^{12}$. The answer is $16x^{12}$." },
      { type: "choice", kicker: "Use it", prompt: "Light travels about $3 \\times 10^5$ km each second. How far does it go in $2 \\times 10^3$ seconds?",
        options: [{ t: "$6 \\times 10^8$ km" }, { t: "$6 \\times 10^{15}$ km", fb: "Multiplying powers of ten **adds** the exponents: $5 + 3$." }, { t: "$5 \\times 10^8$ km", fb: "The front numbers are multiplied: $3 \\cdot 2$." }],
        answer: 0, skill: "Scientific notation", hints: ["Multiply the front numbers. Add the exponents."], why: "$(3 \\cdot 2) \\times 10^{5 + 3} = 6 \\times 10^8$." }
    ]
  });
  /* ================================================ 5.3 · Multiply polynomials */
  var HOW_5_3 = [["Distribute", "Multiply each term of the first polynomial by each term of the second."],
                 ["Products", "Write down every product: coefficients multiply, exponents add."],
                 ["Combine", "Combine like terms, and write the result in standard form."]];
  LESSONS.push({
    title: "Multiply polynomials",
    blurb: "Book 5.3 · Monomials, FOIL for two binomials, larger polynomials, and the special products.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Multiply the monomials $3x^2 \\cdot 5x^4$.",
        options: [{ t: "$15x^6$" }, { t: "$15x^8$", fb: "Multiplying powers **adds** the exponents: $2 + 4$." }, { t: "$8x^6$", fb: "The coefficients are multiplied: $3 \\cdot 5$." }],
        answer: 0, skill: "Multiply monomials", hints: ["Multiply the numbers. Add the exponents."], why: "$3 \\cdot 5 = 15$ and $x^2 \\cdot x^4 = x^6$." },
      { type: "learn", kicker: "Explore", prompt: "A product is the area of a rectangle. This one is $x + 3$ wide and $x + 2$ tall. Change the sides and watch which tiles fill it.",
        scene: { type: "tiles", mode: "multiply", p: 3, q: 2, adjust: true, min: 0, gate: true }, gate: true,
        then: "One $x^2$ tile, $x$ tiles along two edges, and unit tiles in the corner: $(x + 3)(x + 2) = x^2 + 5x + 6$. Two binomials always give four regions." },
      { type: "learn", kicker: "The idea",
        prompt: "To multiply polynomials, every term of one must multiply every term of the other: the Distributive Property, used more than once. For two binomials the four products are **F**irst, **O**uter, **I**nner, **L**ast.",
        scene: { type: "method", how: HOW_5_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch two binomials multiplied. $$(2x + 3)(x - 5)$$",
        scene: { type: "walk", how: HOW_5_3, rows: [
          { step: 1, m: "(2x + 3)(x - 5)", say: "Each term of the first binomial multiplies each term of the second." },
          { step: 2, m: "2x \\cdot x \\quad 2x \\cdot (-5) \\quad 3 \\cdot x \\quad 3 \\cdot (-5)", say: "First, Outer, Inner, Last: four products." },
          { step: 2, m: "2x^2 - 10x + 3x - 15", say: "Work each one out, keeping its sign.",
            ask: { prompt: "What are the Outer and Inner products?", answer: 0,
                   options: [{ t: "$-10x$ and $3x$" }, { t: "$10x$ and $3x$", fb: "$2x \\cdot (-5)$ is negative." }, { t: "$2x^2$ and $-15$", fb: "Those are the First and the Last." }] } },
          { step: 3, m: "2x^2 - 7x - 15", say: "The two middle terms are like terms: $-10x + 3x = -7x$." }] },
        gate: true, then: "Four products, then one combining step." },
      { type: "guided", kicker: "Together",
        prompt: "Now you multiply. $$(3y - 2)(y + 4)$$",
        how: HOW_5_3, skill: "Multiply binomials",
        steps: [
          { step: 1, ask: "How many products will there be?", type: "choice", answer: 0,
            options: [{ t: "Four: each term times each term" }, { t: "Two: first times first, last times last", fb: "That leaves out the Outer and Inner products." }],
            m: "(3y - 2)(y + 4)", say: "Two terms times two terms." },
          { step: 2, ask: "First and Outer: $3y \\cdot y$ and $3y \\cdot 4$.", type: "choice", answer: 0,
            options: [{ t: "$3y^2$ and $12y$" }, { t: "$3y$ and $12y$", fb: "$y \\cdot y = y^2$." }, { t: "$3y^2$ and $7y$", fb: "$3y \\cdot 4$ multiplies: $12y$." }],
            m: "3y^2 + 12y", say: "The $3y$ has met both terms." },
          { step: 2, ask: "Inner and Last: $-2 \\cdot y$ and $-2 \\cdot 4$.", type: "choice", answer: 0,
            options: [{ t: "$-2y$ and $-8$" }, { t: "$2y$ and $8$", fb: "The factor is $-2$: both products are negative." }, { t: "$-2y$ and $8$", fb: "$-2 \\cdot 4 = -8$." }],
            m: "3y^2 + 12y - 2y - 8", say: "The $-2$ has met both terms." },
          { step: 3, ask: "Combine the like terms.", type: "choice", answer: 0,
            options: [{ t: "$3y^2 + 10y - 8$" }, { t: "$3y^2 + 14y - 8$", fb: "$12y - 2y = 10y$." }, { t: "$13y^2 - 8$", fb: "$3y^2$ and $10y$ are not like terms." }],
            m: "3y^2 + 10y - 8", say: "$12y - 2y = 10y$." }],
        why: "Distribute, products, combine. Now one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Multiply $(x + 6)(x - 2)$.",
        answer: "x^2+4x-12", shown: "x^2 + 4x - 12", form: "simplified", skill: "Multiply binomials", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "x^2-12", fb: "That is only First and Last. Add the Outer and Inner: $-2x$ and $6x$." }, { v: "x^2+8x-12", fb: "$-2x + 6x = 4x$." }, { v: "x^2+4x+12", fb: "$6 \\cdot (-2) = -12$." }],
        hints: ["$x^2 - 2x + 6x - 12$."], why: "$x^2 - 2x + 6x - 12 = x^2 + 4x - 12$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A binomial times a trinomial: six products. $$(x + 2)(x^2 - 3x + 4)$$",
        scene: { type: "walk", how: HOW_5_3, rows: [
          { step: 1, m: "(x + 2)(x^2 - 3x + 4)", say: "Distribute $x$ over the trinomial, then distribute 2 over it." },
          { step: 2, m: "x^3 - 3x^2 + 4x", say: "$x$ times each of the three terms." },
          { step: 2, m: "2x^2 - 6x + 8", say: "2 times each of the three terms." },
          { step: 3, m: "x^3 - x^2 - 2x + 8", say: "Add the two rows: $-3x^2 + 2x^2 = -x^2$ and $4x - 6x = -2x$." }] },
        gate: true },
      { type: "slots", kicker: "Try it", prompt: "Three products come up so often that they are worth knowing on sight. Match each to its result.",
        slots: [{ id: "a", label: "$x^2 + 10x + 25$" }, { id: "b", label: "$x^2 - 10x + 25$" }, { id: "c", label: "$x^2 - 25$" }],
        cards: [{ t: "$(x + 5)^2$", slot: "a", fb: "$(a + b)^2 = a^2 + 2ab + b^2$." },
                { t: "$(x - 5)^2$", slot: "b", fb: "$(a - b)^2 = a^2 - 2ab + b^2$." },
                { t: "$(x + 5)(x - 5)$", slot: "c", fb: "Conjugates: the middle terms cancel, leaving $a^2 - b^2$." }],
        skill: "Special products", hints: ["Multiply one of them out with FOIL."],
        why: "A binomial squared has a middle term, $2ab$. A product of conjugates has none." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["(x + 4)^2", "x^2 + 4^2", "x^2 + 16"], answer: 1, fix: "(x + 4)(x + 4)",
        fb: { 0: GIVEN, 2: LATER }, skill: "Special products",
        hints: ["Squaring means multiplying the binomial by itself."],
        why: "$(x + 4)(x + 4) = x^2 + 4x + 4x + 16 = x^2 + 8x + 16$. The middle term cannot be skipped." },
      { type: "expr", kicker: "Use it", prompt: "A rectangle's sides are $2x + 1$ and $x + 3$. Write its area as a polynomial.",
        answer: "2x^2+7x+3", shown: "2x^2 + 7x + 3", form: "simplified", skill: "Multiply binomials", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "2x^2+3", fb: "Add the Outer and Inner products: $6x$ and $x$." }, { v: "3x+4", fb: "That adds the sides. Area is length **times** width." }],
        hints: ["$(2x + 1)(x + 3)$."], why: "$2x^2 + 6x + x + 3 = 2x^2 + 7x + 3$." }
    ]
  });

  /* ================================================ 5.4 · Dividing polynomials */
  var HOW_5_4 = [["Divide", "Divide the first term of the dividend by the first term of the divisor."],
                 ["Multiply", "Multiply the whole divisor by that result."],
                 ["Subtract", "Subtract, and bring down the next term."],
                 ["Repeat", "Repeat until what is left has a lower degree than the divisor. That is the remainder."]];
  var HOW_5_4S = [["Set up", "Write $c$, the zero of the divisor $x - c$, and the coefficients of the dividend."],
                  ["Bring down", "Bring down the first coefficient."],
                  ["× and +", "Multiply it by $c$, write the result under the next coefficient, and add. Repeat."],
                  ["Read", "The last number is the remainder. The others are the coefficients of the quotient."]];
  LESSONS.push({
    title: "Divide polynomials",
    blurb: "Book 5.4 · Long division, synthetic division, and the Remainder and Factor Theorems.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Divide the monomials: $\\frac{12x^5}{3x^2}$.",
        options: [{ t: "$4x^3$" }, { t: "$4x^7$", fb: "Dividing powers **subtracts** the exponents: $5 - 2$." }, { t: "$9x^3$", fb: "The coefficients are divided: $12 \\div 3$." }],
        answer: 0, skill: "Divide monomials", hints: ["Divide the numbers. Subtract the exponents."], why: "$12 \\div 3 = 4$ and $x^5 \\div x^2 = x^3$." },
      { type: "learn", kicker: "The idea",
        prompt: "Dividing by a binomial works like long division with numbers. Four moves repeat: divide the leading terms, multiply back, subtract, bring down the next term.",
        scene: { type: "method", how: HOW_5_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a long division. $$(x^2 + 7x + 10) \\div (x + 2)$$",
        scene: { type: "walk", how: HOW_5_4, rows: [
          { step: 1, m: "x^2 \\div x = x", say: "The first term of the dividend divided by the first term of the divisor." },
          { step: 2, m: "x(x + 2) = x^2 + 2x", say: "Multiply the whole divisor by that $x$." },
          { step: 3, m: "(x^2 + 7x) - (x^2 + 2x) = 5x", say: "Subtract. Then bring down the $+10$, leaving $5x + 10$." },
          { step: 4, m: "5x \\div x = 5", say: "Repeat with the new first term.",
            ask: { prompt: "What is $5x \\div x$?", answer: 0,
                   options: [{ t: "$5$" }, { t: "$5x$", fb: "The $x$ divides out." }, { t: "$x$", fb: "The 5 stays: $5x \\div x = 5$." }] } },
          { step: 4, m: "5(x + 2) = 5x + 10", say: "Multiply and subtract: nothing is left." },
          { step: 4, m: "(x^2 + 7x + 10) \\div (x + 2) = x + 5", say: "The quotient is $x + 5$, and the remainder is 0." }] },
        gate: true, then: "Check by multiplying: $(x + 2)(x + 5) = x^2 + 7x + 10$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you divide. $$(2x^2 + 5x - 3) \\div (x + 3)$$",
        how: HOW_5_4, skill: "Divide polynomials",
        steps: [
          { step: 1, ask: "Divide the first terms: $2x^2 \\div x$.", type: "choice", answer: 0,
            options: [{ t: "$2x$" }, { t: "$2x^2$", fb: "$x^2 \\div x = x$." }, { t: "$x$", fb: "The 2 stays: $2x^2 \\div x = 2x$." }],
            m: "2x^2 \\div x = 2x", say: "The first term of the quotient." },
          { step: 2, ask: "Multiply the divisor by it: $2x(x + 3)$.", type: "choice", answer: 0,
            options: [{ t: "$2x^2 + 6x$" }, { t: "$2x^2 + 3$", fb: "The $2x$ multiplies the 3 as well." }],
            m: "2x(x + 3) = 2x^2 + 6x", say: "This is what gets subtracted." },
          { step: 3, ask: "Subtract $(2x^2 + 5x) - (2x^2 + 6x)$, then bring down the $-3$.", type: "choice", answer: 0,
            options: [{ t: "$-x - 3$" }, { t: "$11x - 3$", fb: "$5x - 6x = -x$. Subtract, don't add." }, { t: "$x - 3$", fb: "$5x - 6x$ is negative." }],
            m: "-x - 3", say: "What is left to divide." },
          { step: 4, ask: "Repeat: what is $-x \\div x$?", type: "choice", answer: 0,
            options: [{ t: "$-1$" }, { t: "$1$", fb: "The sign stays: $-x \\div x = -1$." }, { t: "$-x$", fb: "The $x$ divides out." }],
            m: "-1(x + 3) = -x - 3", say: "The next term of the quotient is $-1$." },
          { step: 4, ask: "Subtract $(-x - 3) - (-x - 3)$. What is the remainder?", type: "num", answer: 0, near: [{ v: -6, fb: "Subtracting $-3$ adds 3: $-3 + 3 = 0$." }], hint: "Anything minus itself.",
            m: "(2x^2 + 5x - 3) \\div (x + 3) = 2x - 1", say: "Remainder 0. The quotient is $2x - 1$." }],
        why: "Divide, multiply, subtract, repeat. Now one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Divide $(x^2 + 8x + 15) \\div (x + 3)$.",
        answer: "x+5", shown: "x + 5", skill: "Divide polynomials", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "x+11", fb: "After the first subtraction, $8x - 3x = 5x$ is left." }, { v: "x+3", fb: "That is the divisor. The quotient is what multiplies it to give the dividend." }],
        hints: ["$x^2 \\div x = x$. Then $x(x + 3) = x^2 + 3x$, and $8x - 3x = 5x$."], why: "$(x + 3)(x + 5) = x^2 + 8x + 15$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the divisor is $x - c$, **synthetic division** does the same work with the coefficients alone. $$(x^3 - 2x^2 - 5x + 8) \\div (x - 3)$$",
        scene: { type: "walk", how: HOW_5_4S, rows: [
          { step: 1, m: "c = 3: \\quad 1 \\quad -2 \\quad -5 \\quad 8", say: "The divisor is $x - 3$, so $c = 3$. List the coefficients of the dividend.", fig: mat([[1, -2, -5, 8], ["", "", "", ""], ["", "", "", ""]], { plain: true, alt: "The coefficients 1, −2, −5, 8 in a row, with space for two more rows." }) },
          { step: 2, m: "1", say: "Bring down the first coefficient.", fig: mat([[1, -2, -5, 8], ["", "", "", ""], [1, "", "", ""]], { plain: true, hot: 2, alt: "The first coefficient, 1, brought down to the bottom row." }) },
          { step: 3, m: "3(1) = 3 \\quad -2 + 3 = 1", say: "Multiply by 3, write it under the next coefficient, and add.", fig: mat([[1, -2, -5, 8], ["", 3, "", ""], [1, 1, "", ""]], { plain: true, hot: 2, alt: "Second column: −2 plus 3 is 1." }) },
          { step: 3, m: "3(1) = 3 \\quad -5 + 3 = -2", say: "Again.", fig: mat([[1, -2, -5, 8], ["", 3, 3, ""], [1, 1, -2, ""]], { plain: true, hot: 2, alt: "Third column: −5 plus 3 is −2." }) },
          { step: 3, m: "3(-2) = -6 \\quad 8 + (-6) = 2", say: "And once more.", fig: mat([[1, -2, -5, 8], ["", 3, 3, -6], [1, 1, -2, 2]], { plain: true, hot: 2, alt: "Fourth column: 8 plus −6 is 2. The bottom row reads 1, 1, −2, 2." }) },
          { step: 4, m: "x^2 + x - 2 \\quad\\text{remainder } 2", say: "The bottom row gives the quotient's coefficients, 1, 1 and $-2$, and then the remainder, 2." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The **Remainder Theorem**: dividing $f(x)$ by $x - c$ leaves the remainder $f(c)$. What is the remainder when $f(x) = x^3 - 4x + 1$ is divided by $x - 2$?",
        answer: 1, skill: "Remainder Theorem",
        near: [{ v: 17, fb: "$-4(2) = -8$: subtract it." }, { v: 9, fb: "$2^3 = 8$, then $8 - 8 + 1$." }],
        hints: ["Find $f(2) = 2^3 - 4(2) + 1$."], why: "$8 - 8 + 1 = 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To divide by $x + 4$ with synthetic division, Max uses $c = 4$. What is wrong?",
        options: [{ t: "$x + 4$ is $x - (-4)$, so $c = -4$." },
                  { t: "Synthetic division cannot be used with $x + 4$.", fb: "It can: write the divisor as $x - (-4)$." },
                  { t: "Nothing. $c$ is the number in the divisor.", fb: "$c$ is the **zero** of the divisor: the value of $x$ that makes $x + 4$ equal 0." }],
        answer: 0, skill: "Synthetic division", hints: ["Which value of $x$ makes $x + 4 = 0$?"], why: "The divisor must be read as $x - c$. For $x + 4$, $c = -4$." },
      { type: "choice", kicker: "Use it", prompt: "The **Factor Theorem**: if $f(c) = 0$, then $x - c$ is a factor of $f(x)$. For $f(x) = x^3 - 7x + 6$ you find $f(1) = 0$. What does that tell you?",
        options: [{ t: "$x - 1$ is a factor of $f(x)$" }, { t: "$x + 1$ is a factor of $f(x)$", fb: "$c = 1$ gives the factor $x - 1$. For $x + 1$ you would need $f(-1) = 0$." }, { t: "The remainder on dividing by $x - 1$ is 1", fb: "The remainder is $f(1)$, which is 0." }],
        answer: 0, skill: "Remainder Theorem", hints: ["A remainder of 0 means the division comes out exactly."], why: "$f(1) = 1 - 7 + 6 = 0$, so $x - 1$ divides $f(x)$ exactly." }
    ]
  });
  /* ================================================================ Skills */
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  var SKILLS = [
    { id: "a2u5-addsub", title: "Add and subtract polynomials", lesson: 2,
      gen: function (R) {
        var a = R.int(2, 7), b = R.nz(-8, 8), c = R.nz(-9, 9), d = R.int(1, 6), e = R.nz(-8, 8), f = R.nz(-9, 9), sub = R.chance(0.6), s = sub ? -1 : 1;
        if (sub && a === d) a += 1;
        var A = a + s * d, B = b + s * e, C = c + s * f, ans = quad(A, B, C);
        return { type: "expr", prompt: (sub ? "Subtract." : "Add.") + " $$(" + quad(a, b, c) + ") " + (sub ? "-" : "+") + " (" + quad(d, e, f) + ")$$", answer: clean(ans), shown: ans, form: "simplified", keys: KEYS_POLY,
          near: sub ? [{ v: clean(quad(a - d, b + e, c + f)), fb: "The minus sign reaches every term of the second polynomial." }] : [],
          hints: [sub ? "Change the sign of every term of the second polynomial, then combine like terms." : "Combine the $x^2$ terms, the $x$ terms and the numbers."],
          why: "$x^2$: $" + A + "$. $x$: $" + B + "$. Numbers: $" + C + "$. So $" + ans + "$." };
      } },
    { id: "a2u5-exponents", title: "Use the properties of exponents", lesson: 3,
      gen: function (R) {
        var a = R.int(2, 9), b = R.int(2, 6), v = R.pick(["x", "y", "a", "n"]), kind = R.int(0, 3), tex, ans, why, slip;
        if (kind === 0) { tex = v + "^{" + a + "} \\cdot " + v + "^{" + b + "}"; ans = a + b; why = "Multiplying: add the exponents, $" + a + " + " + b + "$."; slip = { v: a * b, fb: "Multiplying powers **adds** the exponents." }; }
        else if (kind === 1) { tex = "\\frac{" + v + "^{" + b + "}}{" + v + "^{" + (a + b) + "}}"; ans = -a; why = "Dividing: subtract the exponents, $" + b + " - " + (a + b) + "$."; slip = { v: a, fb: "Top exponent minus bottom exponent: the result is negative." }; }
        else if (kind === 2) { tex = "(" + v + "^{" + a + "})^{" + b + "}"; ans = a * b; why = "A power of a power: multiply the exponents, $" + a + " \\cdot " + b + "$."; slip = { v: a + b, fb: "A power of a power **multiplies** the exponents." }; }
        else { tex = v + "^{-" + a + "} \\cdot " + v + "^{" + (a + b) + "}"; ans = b; why = "Add the exponents: $-" + a + " + " + (a + b) + "$."; slip = { v: 2 * a + b, fb: "The first exponent is negative: $-" + a + " + " + (a + b) + "$." }; }
        return { type: "num", prompt: "Simplify. $$" + tex + " = " + v + "^{\\square}$$ What goes in the box?", answer: ans, near: near(ans, [slip]),
          hints: ["Multiply: add exponents. Divide: subtract. Power of a power: multiply."], why: why };
      } },
    { id: "a2u5-scinot", title: "Use scientific notation", lesson: 3,
      gen: function (R) {
        var d = R.pick([1.2, 2.5, 3.6, 4.8, 5.1, 6.3, 7.4, 8.9, 9.2]), n = R.pick([-4, -3, -2, 3, 4, 5]), ans = Number((d * Math.pow(10, n)).toPrecision(6));
        return { type: "num", prompt: "Write $" + d + " \\times 10^{" + n + "}$ in decimal form.", answer: ans, tol: Math.abs(ans) * 1e-9, shown: n > 0 ? String(ans) : ans.toFixed(-n + 1),
          near: [{ v: Number((d * Math.pow(10, -n)).toPrecision(6)), tol: 1e-12, fb: n > 0 ? "A positive exponent makes a large number: move the point to the right." : "A negative exponent makes a small number: move the point to the left." }],
          hints: ["Move the decimal point " + Math.abs(n) + " places to the " + (n > 0 ? "right" : "left") + "."], why: "The point moves " + Math.abs(n) + " places to the " + (n > 0 ? "right" : "left") + "." };
      } },
    { id: "a2u5-multiply", title: "Multiply two binomials", lesson: 4,
      gen: function (R) {
        var a = R.pick([1, 1, 2, 3]), p = R.nz(-7, 7), q = R.nz(-7, 7), first = poly([[a, "x"], [p, ""]]), second = poly([[1, "x"], [q, ""]]), ans = quad(a, a * q + p, p * q);
        return { type: "expr", prompt: "Multiply. $$(" + first + ")(" + second + ")$$", answer: clean(ans), shown: ans, form: "simplified", keys: KEYS_POLY,
          near: [{ v: clean(quad(a, 0, p * q)), fb: "That is only First and Last. Add the Outer and Inner products: $" + poly([[a * q, "x"]]) + "$ and $" + poly([[p, "x"]]) + "$." }],
          hints: ["Four products: First, Outer, Inner, Last."], why: "$" + poly([[a, "x^2"]]) + " " + signed(a * q) + "x " + signed(p) + "x " + signed(p * q) + " = " + ans + "$." };
      } },
    { id: "a2u5-remainder", title: "Use the Remainder Theorem", lesson: 5,
      gen: function (R) {
        var b = R.nz(-5, 5), c = R.nz(-6, 6), d = R.int(-8, 8), k = R.nz(-3, 3), ans = k * k * k + b * k * k + c * k + d;
        var f = poly([[1, "x^3"], [b, "x^2"], [c, "x"], [d, ""]]), K = k < 0 ? "(" + k + ")" : String(k);
        return { type: "num", prompt: "What is the remainder when $f(x) = " + f + "$ is divided by $x " + (k < 0 ? "+ " + (-k) : "- " + k) + "$?", answer: ans,
          near: near(ans, [{ v: -k * k * k + b * k * k - c * k + d, fb: "The divisor is $x - c$ with $c = " + k + "$: evaluate $f(" + k + ")$, not $f(" + (-k) + ")$." }]),
          hints: ["By the Remainder Theorem it is $f(" + k + ")$."],
          why: "$f(" + k + ") = " + K + "^3 " + signed(b) + " \\cdot " + K + "^2 " + signed(c) + " \\cdot " + K + " " + signed(d) + " = " + ans + "$." };
      } }
  ];
  L.unit("alg2", 5, {
    title: "Polynomials and Polynomial Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Adding and subtracting polynomials, the properties of exponents, and scientific notation.",
        skills: ["a2u5-addsub", "a2u5-exponents", "a2u5-scinot"], per: 2 },
      { title: "Quiz 2", after: 5, blurb: "Multiplying polynomials, and the Remainder Theorem.",
        skills: ["a2u5-multiply", "a2u5-remainder"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:5", {
    2: { name: "Adding polynomials", frame: "Only [[like terms]] combine: same variable and same [[exponent]]. Add the [[coefficients]] and keep the exponents. To subtract, change the [[sign]] of every term being subtracted.",
         chips: ["degree", "order"] },
    3: { name: "Exponent properties", frame: "To multiply powers of the same base, [[add]] the exponents. To divide, [[subtract]] them. For a power of a power, [[multiply]] them. A negative exponent means a [[reciprocal]].",
         chips: ["negative number", "square"], fb: { "negative number": "$2^{-3} = \\frac{1}{8}$: small and positive, not negative." } },
    4: { name: "Multiplying polynomials", frame: "Multiply [[each]] term of one polynomial by each term of the other, then [[combine]] like terms. $(a + b)^2 = a^2 + $ [[$2ab$]] $ + b^2$, and $(a + b)(a - b) = $ [[$a^2 - b^2$]].",
         chips: ["$ab$", "$a^2 + b^2$"], fb: { "$a^2 + b^2$": "Conjugates give a **difference** of squares: the last product is $b \\cdot (-b)$." } },
    5: { name: "Dividing polynomials", frame: "Long division repeats four moves: [[divide]], multiply, [[subtract]], bring down. Dividing $f(x)$ by $x - c$ leaves the remainder [[$f(c)$]]. If that remainder is 0, then $x - c$ is a [[factor]].",
         chips: ["$f(-c)$", "add"] }
  });
})();
