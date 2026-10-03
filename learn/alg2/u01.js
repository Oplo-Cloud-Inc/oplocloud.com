/* ==========================================================================
   Algebra II — Unit 1: Foundations. See lab/core.js for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 1, section for section:
   the readiness check, then 1.1 to 1.5. Every lesson is taught in the same
   order as Algebra I: a warm up, the idea (the book's own method), a worked
   example to watch, one done together, then on your own, a harder case, find
   the error, use it, and the concept built at the end.

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Six lessons, five skills, two quizzes, and the unit test.
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
    blurb: "Book: Chapter 1 opener · Whole-number arithmetic, a first negative number, and a first fraction.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Arithmetic", prompt: "What is $7 \\cdot 8 - 6$?", answer: 50, skill: "Whole-number arithmetic",
        near: [{ v: 14, fb: "Multiply first: $7 \\cdot 8 = 56$. Then subtract 6." }, { v: 9, fb: "That is $7 + 8 - 6$. The dot means multiply." }],
        hints: ["Multiply before you subtract."], why: "$56 - 6 = 50$." },
      { type: "num", prompt: "What is $84 \\div 7$?", answer: 12, skill: "Whole-number arithmetic",
        near: [{ v: 14, fb: "$7 \\cdot 14 = 98$. Try a smaller number." }], hints: ["$7 \\cdot 10 = 70$. How many more 7s reach 84?"], why: "$7 \\cdot 12 = 84$." },
      { type: "numberline", kicker: "Check 2 · Negative numbers", prompt: "Drag the point to $-4$.",
        min: -8, max: 8, mode: "point", points: [{ v: 2, drag: true }], answer: { points: [-4] }, skill: "Place a negative number",
        hints: ["Negative numbers sit to the left of 0."], why: "$-4$ is 4 steps to the left of 0." },
      { type: "choice", prompt: "Which number is larger?", options: [{ t: "$-2$" }, { t: "$-9$", fb: "$-9$ is further left on the number line, so it is smaller." }],
        answer: 0, skill: "Place a negative number", hints: ["Further right on the number line means larger."], why: "$-2$ is to the right of $-9$." },
      { type: "choice", kicker: "Check 3 · Fractions", prompt: "Which fraction equals $\\frac{1}{2}$?",
        options: [{ t: "$\\frac{4}{8}$" }, { t: "$\\frac{2}{3}$", fb: "Half of 3 is 1.5, not 2." }, { t: "$\\frac{1}{4}$", fb: "A quarter is half of a half." }],
        answer: 0, skill: "Equivalent fractions", hints: ["The top must be half of the bottom."], why: "4 is half of 8." },
      { type: "num", prompt: "What is $\\frac{1}{4} + \\frac{2}{4}$? (Type it like 3/4.)", answer: 0.75, tol: 1e-9, shown: "3/4", skill: "Equivalent fractions",
        near: [{ v: 0.375, fb: "Same denominator: add the tops, keep the 4." }], hints: ["One quarter and two quarters make how many quarters?"], why: "$\\frac{1 + 2}{4} = \\frac{3}{4}$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Start with **Lesson 1.1**. If a check slipped, start there too and take it slowly: this unit rebuilds integers, fractions and decimals from the ground up before the algebra begins.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================================== 1.1 · Use the language of algebra */
  var HOW_1_1 = [["Grouping", "Work inside parentheses, brackets and other grouping symbols first."],
                 ["Exponents", "Simplify every power."],
                 ["× and ÷", "Multiply and divide in order, from left to right."],
                 ["+ and −", "Add and subtract in order, from left to right."]];
  LESSONS.push({
    title: "Use the language of algebra",
    blurb: "Book 1.1 · Prime factors, the order of operations, evaluating, like terms, and words into symbols.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which is the **prime factorization** of 48?",
        options: [{ t: "$2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 3$" }, { t: "$6 \\cdot 8$", fb: "6 and 8 are not prime. Keep splitting them." }, { t: "$2 \\cdot 2 \\cdot 2 \\cdot 6$", fb: "6 is not prime: $6 = 2 \\cdot 3$." }],
        answer: 0, skill: "Prime factorization", hints: ["Split 48 into two factors, then split each factor until only primes are left."],
        why: "$48 = 6 \\cdot 8 = (2 \\cdot 3)(2 \\cdot 2 \\cdot 2)$: four 2s and one 3." },
      { type: "learn", kicker: "The idea",
        prompt: "An expression like $4 + 3 \\cdot 2$ could be read two ways. So everyone agrees on one order: **grouping symbols**, then **exponents**, then multiply and divide from left to right, then add and subtract from left to right.",
        scene: { type: "method", how: HOW_1_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one simplified from the inside out. $$4 + 3^2 + 2[10 - 2(5 - 2)]$$",
        scene: { type: "walk", how: HOW_1_1, rows: [
          { step: 1, m: "4 + 3^2 + 2[10 - 2(5 - 2)]", say: "Start with the innermost grouping symbol: the parentheses." },
          { step: 1, m: "4 + 3^2 + 2[10 - 2(3)]", say: "$5 - 2 = 3$. Now work inside the brackets." },
          { step: 1, m: "4 + 3^2 + 2[10 - 6]", say: "Inside the brackets the same order applies: multiply before you subtract.",
            ask: { prompt: "Inside $[10 - 2(3)]$, what comes first?", answer: 0,
                   options: [{ t: "Multiply $2(3)$" }, { t: "Subtract $10 - 2$", fb: "Multiplication comes before subtraction, inside brackets too." }] } },
          { step: 1, m: "4 + 3^2 + 2[4]", say: "$10 - 6 = 4$. The grouping symbols are finished." },
          { step: 2, m: "4 + 9 + 2[4]", say: "Exponents next: $3^2 = 9$." },
          { step: 3, m: "4 + 9 + 8", say: "Then multiply: $2 \\cdot 4 = 8$." },
          { step: 4, m: "21", say: "Last, add from left to right." }] },
        gate: true, then: "That order is the **order of operations**. Every expression in this course is read this way." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$30 \\div 5 + 2(7 - 4)^2$$",
        how: HOW_1_1, skill: "Order of operations",
        steps: [
          { step: 1, ask: "Parentheses first. What is $7 - 4$?", type: "num", answer: 3, hint: "Count up from 4 to 7.",
            m: "30 \\div 5 + 2(3)^2", say: "The parentheses now hold a single number." },
          { step: 2, ask: "Exponents next. What is $3^2$?", type: "num", answer: 9, near: [{ v: 6, fb: "$3^2$ is $3 \\cdot 3$, not $3 \\cdot 2$." }], hint: "$3 \\cdot 3$.",
            m: "30 \\div 5 + 2(9)", say: "Only the 3 is squared, not the 2 in front." },
          { step: 3, ask: "Multiply and divide, left to right. What is $30 \\div 5$?", type: "num", answer: 6, hint: "How many 5s make 30?",
            m: "6 + 18", say: "$30 \\div 5 = 6$ and $2(9) = 18$." },
          { step: 4, ask: "Add. What is the value?", type: "num", answer: 24, hint: "$6 + 18$.",
            m: "24", say: "Addition comes last." }],
        why: "Grouping, exponents, multiply and divide, add and subtract. Now evaluate an expression on your own." },
      { type: "num", kicker: "On your own", prompt: "To **evaluate** an expression, substitute the number, then simplify. Evaluate $2x^2 + 3x + 8$ when $x = 4$.",
        answer: 52, skill: "Evaluate an expression",
        near: [{ v: 84, fb: "The exponent belongs to $x$ only: $2 \\cdot (4^2)$, not $(2 \\cdot 4)^2$." }, { v: 36, fb: "$4^2$ is $4 \\cdot 4 = 16$, not 8." }],
        hints: ["$2(4)^2 + 3(4) + 8$. Do the power first."], why: "$2(16) + 12 + 8 = 32 + 12 + 8 = 52$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A fraction bar is a grouping symbol too. $$\\frac{6 + 2 \\cdot 3^2}{2(5 - 1)}$$",
        scene: { type: "walk", how: HOW_1_1, rows: [
          { step: 1, m: "\\frac{6 + 2 \\cdot 3^2}{2(5 - 1)}", say: "The bar groups the top and the bottom. Simplify each one separately." },
          { step: 1, m: "\\frac{6 + 2 \\cdot 3^2}{2(4)}", say: "The parentheses in the bottom: $5 - 1 = 4$." },
          { step: 2, m: "\\frac{6 + 2 \\cdot 9}{2(4)}", say: "The exponent in the top: $3^2 = 9$." },
          { step: 3, m: "\\frac{6 + 18}{8}", say: "Multiply in the top and in the bottom." },
          { step: 4, m: "\\frac{24}{8} = 3", say: "Add in the top. Then the bar itself divides." }] },
        gate: true },
      { type: "expr", kicker: "Try it", prompt: "**Like terms** have the same variable and exponent. Combine them. $$4y^2 + 5y + 2 + 3y^2 + 6y + 7$$",
        answer: "7y^2+11y+9", shown: "7y^2 + 11y + 9", form: "simplified", skill: "Combine like terms",
        near: [{ v: "7y^4+11y^2+9", fb: "Adding like terms keeps the variable part: $4y^2 + 3y^2 = 7y^2$." }, { v: "27y^2", fb: "Only like terms combine: the $y^2$ terms, the $y$ terms, and the numbers." }],
        keys: [["$y$", "y"], ["$y^2$", "y^2"], ["$+$", "+"]], placeholder: "Use y",
        hints: ["Group them: $4y^2 + 3y^2$, then $5y + 6y$, then $2 + 7$."], why: "$4y^2 + 3y^2 = 7y^2$, $5y + 6y = 11y$, $2 + 7 = 9$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Mia simplified $18 - 6 \\div 3 \\cdot 2$ and got 8. Tap the line where the work **first** goes wrong.",
        lines: ["18 - 6 \\div 3 \\cdot 2", "12 \\div 3 \\cdot 2", "4 \\cdot 2", "8"], answer: 1, fix: "18 - 2 \\cdot 2",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Order of operations",
        hints: ["Which comes first: subtracting or dividing?"],
        why: "Division and multiplication come before subtraction: $18 - 2 \\cdot 2 = 18 - 4 = 14$." },
      { type: "choice", kicker: "Use it", prompt: "The length of a rectangle is **7 less than twice the width** $w$. Which expression is the length?",
        options: [{ t: "$2w - 7$" }, { t: "$7 - 2w$", fb: "“7 less than” takes 7 away from what follows it: $2w - 7$." }, { t: "$2(w - 7)$", fb: "That is twice “7 less than the width”. Here the width is doubled first." }],
        answer: 0, skill: "Translate a phrase", hints: ["Twice the width is $2w$. Then make it 7 less."], why: "Twice the width is $2w$, and 7 less than that is $2w - 7$." }
    ]
  });

  /* ======================================================= 1.2 · Integers */
  var HOW_1_2 = [["Opposite", "Rewrite each subtraction as adding the opposite."],
                 ["Signs", "Same signs or different signs? That decides what to do with the sizes."],
                 ["Sizes", "Same signs: add the absolute values. Different signs: subtract them."],
                 ["Sign", "Same signs keep that sign. Different signs take the sign of the larger absolute value."]];
  LESSONS.push({
    title: "Integers",
    blurb: "Book 1.2 · Absolute value, the four operations with signed numbers, and integers in use.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The **absolute value** of a number is its distance from 0. What is $|-9|$?",
        answer: 9, skill: "Absolute value", near: [{ v: -9, fb: "A distance is never negative." }],
        hints: ["How many steps is $-9$ from 0?"], why: "$-9$ is 9 steps from 0, so $|-9| = 9$." },
      { type: "learn", kicker: "The idea",
        prompt: "Every subtraction can be rewritten as **adding the opposite**: $a - b = a + (-b)$. After that there is only addition, and the signs tell you whether to add or subtract the sizes.",
        scene: { type: "method", how: HOW_1_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $-8 - (-3)$ worked one step at a time.",
        scene: { type: "walk", how: HOW_1_2, rows: [
          { step: 1, m: "-8 - (-3)", say: "Subtracting a number is the same as adding its opposite." },
          { step: 1, m: "-8 + 3", say: "The opposite of $-3$ is 3.",
            ask: { prompt: "How is $-8 - (-3)$ written as an addition?", answer: 0,
                   options: [{ t: "$-8 + 3$" }, { t: "$-8 + (-3)$", fb: "Subtracting $-3$ adds its opposite, which is $+3$." }] } },
          { step: 2, m: "-8 \\quad\\text{and}\\quad 3", say: "One negative, one positive: different signs." },
          { step: 3, m: "8 - 3 = 5", say: "Different signs, so subtract the absolute values." },
          { step: 4, m: "-8 + 3 = -5", say: "$-8$ has the larger absolute value, so the answer is negative." }] },
        gate: true, then: "Subtraction became addition, and the signs decided the rest." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. Simplify $-6 - 9$.",
        how: HOW_1_2, skill: "Add and subtract integers",
        steps: [
          { step: 1, ask: "Rewrite $-6 - 9$ as an addition.", type: "choice", answer: 0,
            options: [{ t: "$-6 + (-9)$" }, { t: "$-6 + 9$", fb: "Subtracting 9 adds its opposite, $-9$." }, { t: "$6 + (-9)$", fb: "Only the number being subtracted changes to its opposite." }],
            m: "-6 + (-9)", say: "Add the opposite of 9." },
          { step: 2, ask: "Are the signs the same or different?", type: "choice", answer: 0,
            options: [{ t: "The same: both are negative" }, { t: "Different", fb: "$-6$ and $-9$ are both negative." }],
            m: "-6 \\quad\\text{and}\\quad -9", say: "Same signs." },
          { step: 3, ask: "Same signs: add the absolute values. What is $6 + 9$?", type: "num", answer: 15, near: [{ v: 3, fb: "Same signs: add the sizes, don't subtract them." }], hint: "$6 + 9$.",
            m: "6 + 9 = 15", say: "The size of the answer." },
          { step: 4, ask: "Which sign does the answer take?", type: "choice", answer: 0,
            options: [{ t: "Negative: $-15$" }, { t: "Positive: $15$", fb: "Both numbers are negative, so their sum is negative." }],
            m: "-6 - 9 = -15", say: "Two negatives add to a negative." }],
        why: "Opposite, signs, sizes, sign. Try one on your own." },
      { type: "num", kicker: "On your own", prompt: "Simplify $-14 + 9$.", answer: -5, skill: "Add and subtract integers",
        near: [{ v: 5, fb: "The larger absolute value is 14, and it is negative." }, { v: -23, fb: "Different signs: subtract the sizes." }],
        hints: ["Different signs: $14 - 9$, with the sign of the $-14$."], why: "$14 - 9 = 5$, and $-14$ is larger in size, so $-5$." },
      { type: "sort", prompt: "Multiplying or dividing: **same signs give a positive, different signs a negative**. Sort each result.",
        bins: ["Positive", "Negative"],
        cards: [{ t: "$-6 \\cdot (-7)$", bin: 0, fb: "Same signs: positive 42." },
                { t: "$-48 \\div 6$", bin: 1, fb: "Different signs: $-8$." },
                { t: "$(-2)^4$", bin: 0, fb: "Four negatives multiplied: 16." },
                { t: "$-2^4$", bin: 1, fb: "No parentheses, so the exponent belongs to 2 only: $-(2^4) = -16$." }],
        skill: "Multiply and divide integers", hints: ["Count the negative factors. An even number of them gives a positive."],
        why: "$42$, $-8$, $16$ and $-16$. Parentheses decide whether the negative is part of the base." },
      { type: "learn", kicker: "A harder case",
        prompt: "With several operations, the order of operations comes first and the sign rules work inside it. $$20 - 3(2 - 7)$$",
        scene: { type: "walk", how: HOW_1_1, rows: [
          { step: 1, m: "20 - 3(2 - 7)", say: "Parentheses first." },
          { step: 1, m: "20 - 3(-5)", say: "$2 - 7 = 2 + (-7) = -5$." },
          { step: 3, m: "20 - (-15)", say: "Multiply: $3(-5) = -15$. Different signs give a negative." },
          { step: 4, m: "20 + 15 = 35", say: "Subtracting $-15$ adds 15." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Evaluate $x^2 - 4x$ when $x = -3$.", answer: 21, skill: "Evaluate with integers",
        near: [{ v: -3, fb: "$-4(-3) = +12$: same signs give a positive." }, { v: 3, fb: "$(-3)^2 = 9$: a negative squared is positive." }, { v: -21, fb: "Both parts are positive: $9$ and $+12$." }],
        hints: ["Put $-3$ in parentheses: $(-3)^2 - 4(-3)$."], why: "$(-3)^2 - 4(-3) = 9 + 12 = 21$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Dev simplified $-5^2 + 4(-3)$ and got 13. Tap the line where the work **first** goes wrong.",
        lines: ["-5^2 + 4(-3)", "25 + 4(-3)", "25 - 12", "13"], answer: 1, fix: "-25 + 4(-3)",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Multiply and divide integers",
        hints: ["Is the base of the exponent 5 or $-5$?"],
        why: "Without parentheses, $-5^2$ means $-(5^2) = -25$. The answer is $-25 - 12 = -37$." },
      { type: "num", kicker: "Use it", prompt: "At dawn the temperature was $-7$ degrees. By noon it had **risen 18 degrees**. What was the temperature at noon?",
        post: "degrees", answer: 11, skill: "Use integers",
        near: [{ v: -25, fb: "Rising means adding 18, not subtracting it." }, { v: 25, fb: "The start is $-7$, not 7." }],
        hints: ["$-7 + 18$."], why: "$-7 + 18 = 11$: different signs, $18 - 7$, and 18 is the larger." }
    ]
  });

  /* ====================================================== 1.3 · Fractions */
  var HOW_1_3 = [["LCD", "No common denominator? Find the least common denominator."],
                 ["Convert", "Rewrite each fraction as an equivalent fraction with the LCD."],
                 ["Combine", "Add or subtract the numerators. Keep the denominator."],
                 ["Simplify", "Divide out any common factors."]];
  LESSONS.push({
    title: "Fractions",
    blurb: "Book 1.3 · Simplify, multiply, divide, add and subtract fractions, and work with a fraction bar.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which is $\\frac{18}{24}$ in **simplest form**?",
        options: [{ t: "$\\frac{3}{4}$" }, { t: "$\\frac{9}{12}$", fb: "9 and 12 still share a factor of 3." }, { t: "$\\frac{2}{3}$", fb: "Divide the top and the bottom by the same number: $18 \\div 6$ and $24 \\div 6$." }],
        answer: 0, skill: "Simplify a fraction", hints: ["What is the largest number that divides both 18 and 24?"], why: "$\\frac{18}{24} = \\frac{3 \\cdot 6}{4 \\cdot 6} = \\frac{3}{4}$." },
      { type: "learn", kicker: "The idea",
        prompt: "Fractions can be added only when their pieces are the same size: the same denominator. If the denominators differ, rewrite both fractions with the **least common denominator** (LCD) first.",
        scene: { type: "method", how: HOW_1_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an addition with unlike denominators. $$\\frac{7}{12} + \\frac{5}{18}$$",
        scene: { type: "walk", how: HOW_1_3, rows: [
          { step: 1, m: "\\frac{7}{12} + \\frac{5}{18}", say: "The denominators differ: 12 and 18." },
          { step: 1, m: "12 = 2 \\cdot 2 \\cdot 3 \\quad 18 = 2 \\cdot 3 \\cdot 3", say: "Write each denominator as a product of primes." },
          { step: 1, m: "\\text{LCD} = 2 \\cdot 2 \\cdot 3 \\cdot 3 = 36", say: "Take each prime the most times it appears in either one.",
            ask: { prompt: "What is the least common denominator of 12 and 18?", answer: 0,
                   options: [{ t: "36" }, { t: "216", fb: "$12 \\cdot 18 = 216$ is a common denominator, but not the least." }, { t: "6", fb: "6 is their greatest common factor. The LCD is a multiple of both." }] } },
          { step: 2, m: "\\frac{7 \\cdot 3}{12 \\cdot 3} + \\frac{5 \\cdot 2}{18 \\cdot 2}", say: "Multiply the top and bottom of each fraction by what its denominator is missing." },
          { step: 2, m: "\\frac{21}{36} + \\frac{10}{36}", say: "Now the pieces are the same size." },
          { step: 3, m: "\\frac{21 + 10}{36} = \\frac{31}{36}", say: "Add the numerators. The denominator stays 36." },
          { step: 4, m: "\\frac{31}{36}", say: "31 is prime and does not divide 36, so this is in simplest form." }] },
        gate: true, then: "Same-size pieces first, then combine the numerators." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$\\frac{5}{6} - \\frac{3}{8}$$",
        how: HOW_1_3, skill: "Add and subtract fractions",
        steps: [
          { step: 1, ask: "What is the LCD of 6 and 8?", type: "num", answer: 24,
            near: [{ v: 48, fb: "48 is a common denominator, but there is a smaller one." }, { v: 2, fb: "2 is a common factor. The LCD is a multiple of both 6 and 8." }], hint: "$6 = 2 \\cdot 3$ and $8 = 2 \\cdot 2 \\cdot 2$.",
            m: "\\text{LCD} = 24", say: "$2 \\cdot 2 \\cdot 2 \\cdot 3 = 24$." },
          { step: 2, ask: "Rewrite both fractions with denominator 24.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{20}{24} - \\frac{9}{24}$" }, { t: "$\\frac{5}{24} - \\frac{3}{24}$", fb: "The tops must be multiplied too: $\\frac{5 \\cdot 4}{6 \\cdot 4}$." }, { t: "$\\frac{20}{24} - \\frac{12}{24}$", fb: "$8 \\cdot 3 = 24$, so the 3 on top is multiplied by 3." }],
            m: "\\frac{20}{24} - \\frac{9}{24}", say: "$\\frac{5 \\cdot 4}{6 \\cdot 4}$ and $\\frac{3 \\cdot 3}{8 \\cdot 3}$." },
          { step: 3, ask: "Subtract the numerators. What is $20 - 9$?", type: "num", answer: 11, near: [{ v: 29, fb: "This one is a subtraction." }], hint: "$20 - 9$.",
            m: "\\frac{11}{24}", say: "The denominator stays 24." },
          { step: 4, ask: "Can $\\frac{11}{24}$ be simplified?", type: "choice", answer: 0,
            options: [{ t: "No: 11 and 24 share no factor" }, { t: "Yes", fb: "11 is prime, and it does not divide 24." }],
            m: "\\frac{5}{6} - \\frac{3}{8} = \\frac{11}{24}", say: "Already in simplest form." }],
        why: "LCD, convert, combine, simplify. Multiplying and dividing need no common denominator: try them next." },
      { type: "num", kicker: "On your own", prompt: "To multiply fractions, multiply the tops and multiply the bottoms. Find $\\frac{3}{4} \\cdot \\frac{8}{9}$. (Type it like 2/3.)",
        answer: 2 / 3, tol: 1e-9, shown: "2/3", skill: "Multiply and divide fractions",
        near: [{ v: 27 / 32, tol: 1e-9, fb: "That is the division. To multiply, go straight across: tops, then bottoms." }],
        hints: ["$\\frac{3 \\cdot 8}{4 \\cdot 9}$, then simplify."], why: "$\\frac{24}{36} = \\frac{2}{3}$." },
      { type: "num", prompt: "To divide, multiply by the **reciprocal**. Find $\\frac{5}{6} \\div \\frac{2}{3}$. (Type it like 5/4.)",
        answer: 1.25, tol: 1e-9, shown: "5/4", skill: "Multiply and divide fractions",
        near: [{ v: 5 / 9, tol: 1e-9, fb: "That multiplies the two fractions. Flip the second one first: $\\frac{5}{6} \\cdot \\frac{3}{2}$." }],
        hints: ["$\\frac{5}{6} \\cdot \\frac{3}{2}$."], why: "$\\frac{5}{6} \\cdot \\frac{3}{2} = \\frac{15}{12} = \\frac{5}{4}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **complex fraction** has a fraction inside a fraction. Simplify the top, then divide. $$\\frac{\\frac{1}{2} + \\frac{2}{3}}{\\frac{5}{6}}$$",
        scene: { type: "walk", how: HOW_1_3, rows: [
          { step: 1, m: "\\frac{1}{2} + \\frac{2}{3}", say: "Start with the numerator. The LCD of 2 and 3 is 6." },
          { step: 2, m: "\\frac{3}{6} + \\frac{4}{6}", say: "Convert both to sixths." },
          { step: 3, m: "\\frac{7}{6}", say: "Add the numerators. The top of the complex fraction is $\\frac{7}{6}$." },
          { step: 4, m: "\\frac{7}{6} \\div \\frac{5}{6} = \\frac{7}{6} \\cdot \\frac{6}{5}", say: "The main fraction bar means divide: multiply by the reciprocal of the bottom." },
          { step: 4, m: "\\frac{7}{5}", say: "The 6s divide out." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Simplify the top and the bottom, then divide. $$\\frac{4(-3) + 6(-2)}{-3(2) - 2}$$",
        answer: 3, skill: "Fraction bar as grouping",
        near: [{ v: -3, fb: "A negative divided by a negative is positive." }, { v: 6, fb: "The bottom is $-6 - 2 = -8$, not $-4$." }],
        hints: ["Top: $-12 + (-12)$. Bottom: $-6 - 2$."], why: "$\\frac{-24}{-8} = 3$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Leo added $\\frac{2}{3} + \\frac{1}{4}$ and got $\\frac{3}{7}$. Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{2}{3} + \\frac{1}{4}", "\\frac{2 + 1}{3 + 4}", "\\frac{3}{7}"], answer: 1, fix: "\\frac{8}{12} + \\frac{3}{12}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Add and subtract fractions",
        hints: ["Are thirds and quarters the same size of piece?"],
        why: "Denominators are never added. With the LCD 12: $\\frac{8}{12} + \\frac{3}{12} = \\frac{11}{12}$." },
      { type: "num", kicker: "Use it", prompt: "A recipe needs $\\frac{3}{4}$ cup of flour. Your only scoop holds $\\frac{1}{8}$ cup. How many scoops do you need?",
        post: "scoops", answer: 6, skill: "Multiply and divide fractions",
        near: [{ v: 3 / 32, tol: 1e-9, fb: "That multiplies. How many eighths fit into three quarters? Divide." }],
        hints: ["$\\frac{3}{4} \\div \\frac{1}{8}$."], why: "$\\frac{3}{4} \\cdot \\frac{8}{1} = \\frac{24}{4} = 6$." }
    ]
  });
  /* ======================================================= 1.4 · Decimals */
  var HOW_1_4 = [["Simplify", "Simplify the number first: work out any square root that comes out even."],
                 ["Integer?", "No fraction or decimal part left? It is an integer."],
                 ["Rational?", "A ratio of two integers? Its decimal stops or repeats. It is rational."],
                 ["Irrational?", "A decimal that never stops and never repeats is irrational."]];
  LESSONS.push({
    title: "Decimals and the real numbers",
    blurb: "Book 1.4 · Decimal arithmetic, percents, square roots, and sorting numbers into rational and irrational.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $0.3 \\times 0.2$?", answer: 0.06, tol: 1e-9, skill: "Decimal arithmetic",
        near: [{ v: 0.6, tol: 1e-9, fb: "Count the decimal places: one and one make two. $3 \\times 2 = 6$, placed two places in." }, { v: 6, fb: "Both factors are less than 1, so the product is smaller still." }],
        hints: ["$3 \\times 2 = 6$. How many decimal places do the two factors have in total?"], why: "Two decimal places in all: $0.06$." },
      { type: "learn", kicker: "The idea",
        prompt: "Every number on the number line is a **real number**, and each one is either **rational** (a ratio of two integers) or **irrational**. To classify a number, simplify it first, then ask these questions in order.",
        scene: { type: "method", how: HOW_1_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch four numbers classified: $-\\sqrt{64}$, $0.75$, $0.1666\\ldots$ and $\\sqrt{5}$.",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "-\\sqrt{64} = -8", say: "Simplify first. 64 is a perfect square." },
          { step: 2, m: "-8 \\quad\\text{integer}", say: "No fraction part: an integer. Every integer is also rational, since $-8 = \\frac{-8}{1}$." },
          { step: 3, m: "0.75 = \\frac{3}{4} \\quad\\text{rational}", say: "A decimal that stops can be written as a ratio of integers.",
            ask: { prompt: "Is $0.75$ rational?", answer: 0,
                   options: [{ t: "Yes: it equals $\\frac{3}{4}$" }, { t: "No: it has a decimal point", fb: "A decimal that stops is a ratio of integers: $\\frac{75}{100}$." }] } },
          { step: 3, m: "0.1666\\ldots = \\frac{1}{6} \\quad\\text{rational}", say: "A decimal that repeats is rational too." },
          { step: 4, m: "\\sqrt{5} = 2.2360679\\ldots \\quad\\text{irrational}", say: "5 is not a perfect square. Its decimal never stops and never repeats." }] },
        gate: true, then: "Integers sit inside the rationals. Rationals and irrationals together are the real numbers." },
      { type: "guided", kicker: "Together",
        prompt: "Now you classify three numbers: $-\\sqrt{81}$, $0.4$ and $\\sqrt{12}$.",
        how: HOW_1_4, skill: "Classify real numbers",
        steps: [
          { step: 1, ask: "Simplify first. What is $\\sqrt{81}$?", type: "num", answer: 9, hint: "Which number times itself is 81?",
            m: "-\\sqrt{81} = -9", say: "81 is a perfect square." },
          { step: 2, ask: "Which of the three is an integer?", type: "choice", answer: 0,
            options: [{ t: "$-\\sqrt{81}$" }, { t: "$0.4$", fb: "0.4 has a decimal part." }, { t: "$\\sqrt{12}$", fb: "12 is not a perfect square, so its root is not a whole number." }],
            m: "-9 \\quad\\text{integer}", say: "Integers include the negatives." },
          { step: 3, ask: "$0.4$ stops. Which ratio of integers is it?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{2}{5}$" }, { t: "$\\frac{1}{4}$", fb: "$\\frac{1}{4} = 0.25$." }, { t: "$\\frac{4}{1}$", fb: "That is 4, not 0.4." }],
            m: "0.4 = \\frac{2}{5} \\quad\\text{rational}", say: "$\\frac{4}{10}$ simplifies to $\\frac{2}{5}$." },
          { step: 4, ask: "Is $\\sqrt{12}$ rational or irrational?", type: "choice", answer: 0,
            options: [{ t: "Irrational: 12 is not a perfect square" }, { t: "Rational: it is written with whole numbers", fb: "What matters is its value. $\\sqrt{12} = 3.4641\\ldots$ never stops or repeats." }],
            m: "\\sqrt{12} = 3.4641\\ldots \\quad\\text{irrational}", say: "It lies between 3 and 4 and never settles into a pattern." }],
        why: "Simplify, then integer, rational or irrational. Now sort some on your own." },
      { type: "sort", kicker: "On your own", prompt: "Sort each number.",
        bins: ["Rational", "Irrational"],
        cards: [{ t: "$\\sqrt{25}$", bin: 0, fb: "$\\sqrt{25} = 5$, an integer." },
                { t: "$\\sqrt{7}$", bin: 1, fb: "7 is not a perfect square." },
                { t: "$-0.8$", bin: 0, fb: "$-0.8 = -\\frac{4}{5}$." },
                { t: "$\\frac{22}{7}$", bin: 0, fb: "A ratio of two integers. It is close to $\\pi$, but it is not $\\pi$." },
                { t: "$\\pi$", bin: 1, fb: "The decimal of $\\pi$ never stops and never repeats." }],
        skill: "Classify real numbers", hints: ["Simplify each one first. Does it come out as a ratio of integers?"],
        why: "A root of a perfect square, a stopping decimal and a fraction are rational. $\\sqrt{7}$ and $\\pi$ are not." },
      { type: "numberline", prompt: "Every real number has a place on the number line. Drag the point to $-\\frac{3}{4}$.",
        min: -2, max: 2, tick: 0.25, label: 4, mode: "point", points: [{ v: 0.5, drag: true }], answer: { points: [-0.75] }, skill: "Locate a number",
        hints: ["Each tick is one quarter. Negative numbers are to the left of 0."], why: "Three quarter-steps to the left of 0." },
      { type: "learn", kicker: "A harder case",
        prompt: "Some numbers are not what they look like. Classify $\\sqrt{\\frac{4}{9}}$ and $0.101001000\\ldots$",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "\\sqrt{\\frac{4}{9}} = \\frac{2}{3}", say: "Simplify first: 4 and 9 are both perfect squares." },
          { step: 3, m: "\\frac{2}{3} = 0.666\\ldots \\quad\\text{rational}", say: "A ratio of integers. Its decimal repeats." },
          { step: 4, m: "0.101001000\\ldots \\quad\\text{irrational}", say: "There is a pattern, but no block of digits repeats. Never stopping and never repeating means irrational." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A percent is a ratio out of 100. Write $6.5\\%$ as a decimal.", answer: 0.065, tol: 1e-9, skill: "Convert percents",
        near: [{ v: 0.65, tol: 1e-9, fb: "Move the decimal point **two** places left: $6.5 \\to 0.065$." }, { v: 6.5, fb: "Drop the percent sign and divide by 100." }],
        hints: ["Divide by 100: move the decimal point two places to the left."], why: "$6.5 \\div 100 = 0.065$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Tomas says: “$\\sqrt{16}$ is irrational, because it has a square root sign.” What is wrong?",
        options: [{ t: "$\\sqrt{16} = 4$, an integer. Simplify before you classify." },
                  { t: "Nothing. Every square root is irrational.", fb: "Roots of perfect squares come out even: $\\sqrt{16} = 4$." },
                  { t: "$\\sqrt{16} = 8$, which is rational.", fb: "$8^2 = 64$. The root of 16 is 4." }],
        answer: 0, skill: "Classify real numbers", hints: ["Step 1 of the method."], why: "$\\sqrt{16} = 4$. It is an integer, so it is rational." },
      { type: "num", kicker: "Use it", prompt: "A phone plan costs **\\$34.95** a month plus **\\$0.08** for each text. What is the bill for a month with 150 texts?",
        pre: "$\\$$", answer: 46.95, tol: 1e-9, skill: "Decimal arithmetic",
        near: [{ v: 154.95, tol: 1e-9, fb: "$0.08 \\times 150 = 12$, not 120." }, { v: 12, fb: "That is the cost of the texts. Add the monthly charge." }],
        hints: ["$0.08 \\times 150$, then add 34.95."], why: "$0.08 \\times 150 = 12$, and $34.95 + 12 = 46.95$." }
    ]
  });

  /* ====================================== 1.5 · Properties of real numbers */
  var HOW_1_5 = [["Distribute", "Multiply the factor outside by every term inside the parentheses."],
                 ["Signs", "A negative factor outside changes the sign of every term inside."],
                 ["Reorder", "Use the commutative property to put like terms next to each other."],
                 ["Combine", "Add or subtract the like terms."]];
  LESSONS.push({
    title: "Properties of real numbers",
    blurb: "Book 1.5 · Commutative, associative, identity, inverse and zero properties, and the Distributive Property.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which property says the **order** of an addition does not matter: $a + b = b + a$?",
        options: [{ t: "Commutative" }, { t: "Associative", fb: "Associative is about the grouping: $(a + b) + c = a + (b + c)$." }, { t: "Distributive", fb: "Distributive mixes multiplying and adding: $a(b + c) = ab + ac$." }],
        answer: 0, skill: "Name a property", hints: ["Think of numbers commuting: changing places."], why: "Commutative: the numbers change places. It holds for addition and multiplication." },
      { type: "learn", kicker: "The idea",
        prompt: "The **Distributive Property**, $a(b + c) = ab + ac$, removes parentheses you cannot simplify inside. Then the commutative and associative properties let you reorder and regroup so that like terms combine.",
        scene: { type: "method", how: HOW_1_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one simplified. $$8 - 2(x + 3) + 5x$$",
        scene: { type: "walk", how: HOW_1_5, rows: [
          { step: 1, m: "8 - 2(x + 3) + 5x", say: "Multiplying comes before subtracting, so the factor to distribute is $-2$." },
          { step: 2, m: "8 - 2x - 6 + 5x", say: "$-2 \\cdot x = -2x$ and $-2 \\cdot 3 = -6$. Both terms turn negative.",
            ask: { prompt: "What is $-2(x + 3)$?", answer: 0,
                   options: [{ t: "$-2x - 6$" }, { t: "$-2x + 3$", fb: "The $-2$ multiplies both terms, the 3 as well." }, { t: "$-2x + 6$", fb: "$-2 \\cdot 3 = -6$." }] } },
          { step: 3, m: "-2x + 5x + 8 - 6", say: "Reorder so that like terms sit together. Each term keeps its own sign." },
          { step: 4, m: "3x + 2", say: "$-2x + 5x = 3x$ and $8 - 6 = 2$." }] },
        gate: true, then: "Distribute, mind the signs, reorder, combine." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$4(3x - 5) - (x - 7)$$",
        how: HOW_1_5, skill: "Distributive Property",
        steps: [
          { step: 1, ask: "Distribute the 4. What is $4(3x - 5)$?", type: "choice", answer: 0,
            options: [{ t: "$12x - 20$" }, { t: "$12x - 5$", fb: "The 4 multiplies the 5 as well." }, { t: "$7x - 20$", fb: "$4 \\cdot 3x = 12x$: multiply, don't add." }],
            m: "12x - 20 - (x - 7)", say: "4 times each term." },
          { step: 2, ask: "$-(x - 7)$ means $-1(x - 7)$. What is it?", type: "choice", answer: 0,
            options: [{ t: "$-x + 7$" }, { t: "$-x - 7$", fb: "$-1 \\cdot (-7) = +7$." }, { t: "$x - 7$", fb: "The negative in front changes every sign inside." }],
            m: "12x - 20 - x + 7", say: "A negative outside flips both signs." },
          { step: 3, ask: "Reorder so that like terms are together.", type: "choice", answer: 0,
            options: [{ t: "$12x - x - 20 + 7$" }, { t: "$12x + x - 20 + 7$", fb: "Each term keeps its own sign when it moves: $-x$ stays $-x$." }],
            m: "12x - x - 20 + 7", say: "The $x$ terms, then the numbers." },
          { step: 4, ask: "Combine the like terms.", type: "choice", answer: 0,
            options: [{ t: "$11x - 13$" }, { t: "$11x - 27$", fb: "$-20 + 7 = -13$." }, { t: "$13x - 13$", fb: "$12x - x = 11x$." }],
            m: "11x - 13", say: "$12x - x = 11x$ and $-20 + 7 = -13$." }],
        why: "Distribute, signs, reorder, combine. Now one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Simplify $3(2y + 4) - 5$.",
        answer: "6y+7", shown: "6y + 7", form: "simplified", skill: "Distributive Property",
        near: [{ v: "6y-1", fb: "$3 \\cdot 4 = 12$, and $12 - 5 = 7$." }, { v: "6y-3", fb: "Distribute first: the 3 multiplies only what is inside the parentheses." }],
        keys: [["$y$", "y"], ["$+$", "+"], ["$-$", "-"]], placeholder: "Use y",
        hints: ["$3 \\cdot 2y$ and $3 \\cdot 4$, then subtract 5."], why: "$6y + 12 - 5 = 6y + 7$." },
      { type: "slots", prompt: "Match each equation to the property it shows.",
        slots: [{ id: "a", label: "Commutative" }, { id: "b", label: "Associative" }, { id: "c", label: "Identity" }, { id: "d", label: "Inverse" }],
        cards: [{ t: "$4 \\cdot x = x \\cdot 4$", slot: "a", fb: "The factors change places." },
                { t: "$5 + (3 + x) = (5 + 3) + x$", slot: "b", fb: "The order is the same. Only the grouping changes." },
                { t: "$y + 0 = y$", slot: "c", fb: "Adding 0 leaves a number as it is: 0 is the additive identity." },
                { t: "$7 \\cdot \\frac{1}{7} = 1$", slot: "d", fb: "A number times its reciprocal is 1: the multiplicative inverse." }],
        skill: "Name a property", hints: ["Did the order change, the grouping, or neither?"],
        why: "Order: commutative. Grouping: associative. Unchanged by 0 or 1: identity. Back to 0 or 1: inverse." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two sets of parentheses, and a fraction outside one of them. $$\\frac{1}{2}(6x - 10) - 3(x - 4)$$",
        scene: { type: "walk", how: HOW_1_5, rows: [
          { step: 1, m: "\\frac{1}{2}(6x - 10) - 3(x - 4)", say: "Distribute into each set of parentheses." },
          { step: 2, m: "3x - 5 - 3x + 12", say: "Half of each term. Then $-3$ times each term: $-3 \\cdot (-4) = +12$." },
          { step: 3, m: "3x - 3x - 5 + 12", say: "Reorder." },
          { step: 4, m: "7", say: "$3x - 3x = 0$: opposites add to zero, the inverse property. Only 7 is left." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Zero has properties of its own. Which of these is **undefined**?",
        options: [{ t: "$\\frac{9}{0}$" }, { t: "$\\frac{0}{9}$", fb: "0 divided by 9 is 0." }, { t: "$0 \\cdot 9$", fb: "Any number times 0 is 0." }],
        answer: 0, skill: "Properties of zero", hints: ["Which one asks “what times 0 makes 9?”"], why: "No number times 0 gives 9, so division by 0 is undefined." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Ana simplified $10 - 3(2x - 4)$. Tap the line where the work **first** goes wrong.",
        lines: ["10 - 3(2x - 4)", "10 - 6x - 12", "-6x - 2"], answer: 1, fix: "10 - 6x + 12",
        fb: { 0: GIVEN, 2: LATER }, skill: "Distributive Property",
        hints: ["What is $-3 \\cdot (-4)$?"],
        why: "$-3 \\cdot (-4) = +12$, so the result is $10 - 6x + 12 = -6x + 22$." },
      { type: "num", kicker: "Use it", prompt: "Tickets cost **\\$19** each. Work out the cost of 6 tickets in your head as $6(20 - 1)$.",
        pre: "$\\$$", answer: 114, skill: "Distributive Property",
        near: [{ v: 119, fb: "The 6 multiplies the 1 as well: $120 - 6$." }, { v: 126, fb: "19 is one **less** than 20: subtract the 6." }],
        hints: ["$6 \\cdot 20 - 6 \\cdot 1$."], why: "$120 - 6 = 114$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "a2u1-order", title: "Use the order of operations", lesson: 2,
      gen: function (R) {
        var a = R.int(2, 9), b = R.int(2, 5), c = R.int(2, 6), d = R.int(1, 9), kind = R.int(0, 2), tex, ans, slip;
        if (kind === 0) { tex = a + " + " + b + " \\cdot " + c + "^2"; ans = a + b * c * c; slip = { v: (a + b) * c * c, fb: "The power first, then multiply, then add." }; }
        else if (kind === 1) { tex = b + "(" + (c + d) + " - " + d + ")^2 - " + a; ans = b * c * c - a; slip = { v: b * c * b * c - a, fb: "The exponent belongs to the parentheses only, not to the " + b + " in front." }; }
        else { tex = a * c + " \\div " + c + " + " + b + " \\cdot " + d; ans = a + b * d; slip = { v: (a + b) * d, fb: "Divide and multiply before you add." }; }
        return { type: "num", prompt: "Simplify. $$" + tex + "$$", answer: ans, near: near(ans, [slip]),
          hints: ["Grouping, exponents, multiply and divide, then add and subtract."], why: "$" + tex + " = " + ans + "$." };
      } },
    { id: "a2u1-integers", title: "Add, subtract and multiply integers", lesson: 3,
      gen: function (R) {
        var a = R.int(2, 15) * R.pick([-1, 1]), b = -R.int(2, 12), kind = R.int(0, 2), tex, ans, slip, hint;
        if (kind === 0) { tex = a + " - (" + b + ")"; ans = a - b; slip = { v: a + b, fb: "Subtracting a negative adds its opposite." }; hint = "Rewrite it as $" + a + " + " + (-b) + "$."; }
        else if (kind === 1) { tex = a + " + (" + b + ")"; ans = a + b; slip = { v: a - b, fb: "Adding a negative moves left on the number line." }; hint = "Same signs: add the sizes. Different signs: subtract them."; }
        else { tex = a + "(" + b + ")"; ans = a * b; slip = { v: -a * b, fb: "Same signs give a positive product. Different signs give a negative one." }; hint = "Multiply the sizes, then decide the sign."; }
        return { type: "num", prompt: "Simplify. $$" + tex + "$$", answer: ans, near: near(ans, [slip]), hints: [hint], why: "$" + tex + " = " + ans + "$." };
      } },
    { id: "a2u1-fractions", title: "Add and subtract fractions", lesson: 4,
      gen: function (R) {
        var P = R.pick([[2, 3], [3, 4], [4, 6], [6, 8], [3, 5], [2, 5], [4, 5], [6, 9], [4, 10]]), d1 = P[0], d2 = P[1];
        var n1 = R.int(1, d1 - 1), n2 = R.int(1, d2 - 1), sub = R.chance(0.4), s = sub ? -1 : 1;
        var lcd = d1 * d2 / L.gcd(d1, d2), top = n1 * (lcd / d1) + s * n2 * (lcd / d2), ans = top / lcd;
        return { type: "num", prompt: "Simplify. (Type a fraction like 7/12.) $$\\frac{" + n1 + "}{" + d1 + "} " + (sub ? "-" : "+") + " \\frac{" + n2 + "}{" + d2 + "}$$",
          answer: ans, tol: 1e-9, shown: L.fracText(top, lcd),
          near: near(ans, [{ v: (n1 + s * n2) / (d1 + s * d2 || 1), tol: 1e-9, fb: "Denominators are never added or subtracted. Rewrite both fractions with the LCD, " + lcd + "." }]),
          hints: ["The LCD of " + d1 + " and " + d2 + " is " + lcd + "."],
          why: "$\\frac{" + n1 * (lcd / d1) + "}{" + lcd + "} " + (sub ? "-" : "+") + " \\frac{" + n2 * (lcd / d2) + "}{" + lcd + "} = " + frac(top, lcd) + "$." };
      } },
    { id: "a2u1-classify", title: "Classify real numbers", lesson: 5,
      gen: function (R) {
        var P = R.pick([["\\sqrt{36}", true, "$\\sqrt{36} = 6$, an integer."], ["\\sqrt{10}", false, "10 is not a perfect square, so its decimal never stops or repeats."],
                        ["0.375", true, "A decimal that stops: $\\frac{375}{1000}$."], ["\\frac{5}{11}", true, "A ratio of two integers."], ["\\pi", false, "The decimal of $\\pi$ never stops and never repeats."],
                        ["-\\sqrt{49}", true, "$-\\sqrt{49} = -7$, an integer."], ["\\sqrt{2}", false, "2 is not a perfect square."], ["0.272727\\ldots", true, "A repeating decimal: it equals $\\frac{3}{11}$."],
                        ["\\sqrt{\\frac{1}{4}}", true, "$\\sqrt{\\frac{1}{4}} = \\frac{1}{2}$."], ["\\sqrt{20}", false, "20 is not a perfect square."]]);
        return mc(R, { prompt: "Is $" + P[0] + "$ rational or irrational?", right: P[1] ? "Rational" : "Irrational", wrong: [{ t: P[1] ? "Irrational" : "Rational", fb: P[2] }], keep: true,
          hints: ["Simplify it first. Can it be written as a ratio of two integers?"], why: P[2] });
      } },
    { id: "a2u1-distribute", title: "Simplify with the Distributive Property", lesson: 6,
      gen: function (R) {
        var a = R.nz(-6, 6), b = R.int(1, 5), c = R.nz(-7, 7), d = R.nz(-8, 8);
        if (a === 1) a = 2;
        var X = a * b + d, C = a * c;
        if (X === 0) { d += 1; X += 1; }
        var ans = poly([[X, "x"], [C, ""]]), tex = a + "(" + poly([[b, "x"], [c, ""]]) + ") " + (d < 0 ? "- " : "+ ") + (Math.abs(d) === 1 ? "" : Math.abs(d)) + "x";
        return { type: "expr", prompt: "Simplify. $$" + tex + "$$", answer: clean(ans), shown: ans, form: "simplified", keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"]],
          near: [{ v: clean(poly([[X, "x"], [c, ""]])), fb: "The " + a + " multiplies **both** terms inside the parentheses." }],
          hints: ["Distribute the " + a + ", then combine the $x$ terms."],
          why: "$" + poly([[a * b, "x"], [C, ""]]) + " " + (d < 0 ? "- " : "+ ") + (Math.abs(d) === 1 ? "" : Math.abs(d)) + "x = " + ans + "$." };
      } }
  ];
  L.unit("alg2", 1, {
    title: "Foundations",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "The order of operations, integers and fractions.",
        skills: ["a2u1-order", "a2u1-integers", "a2u1-fractions"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Rational and irrational numbers, and the Distributive Property.",
        skills: ["a2u1-classify", "a2u1-distribute"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:1", {
    2: { name: "Order of operations", frame: "Simplify inside [[grouping symbols]] first, then [[exponents]], then multiply and divide from [[left to right]], then add and subtract from left to right.",
         chips: ["right to left", "additions"], fb: { "right to left": "Operations of the same rank are done in the order they are met: from the left." } },
    3: { name: "Adding integers", frame: "To subtract, add the [[opposite]]. Same signs: [[add]] the absolute values. Different signs: [[subtract]] them and keep the sign of the [[larger]] absolute value.",
         chips: ["reciprocal", "smaller"], fb: { "reciprocal": "The reciprocal is for dividing fractions. Subtraction uses the opposite." } },
    4: { name: "Adding fractions", frame: "To add or subtract fractions, rewrite them with the [[least common denominator]]. Then combine the [[numerators]] and keep the denominator. To divide by a fraction, multiply by its [[reciprocal]].",
         chips: ["opposite", "denominators"], fb: { "denominators": "The denominators stay as they are. Only the numerators are combined." } },
    5: { name: "Real numbers", frame: "A [[rational]] number is a ratio of two integers: its decimal stops or [[repeats]]. An [[irrational]] number has a decimal that never stops and never repeats. Together they are the [[real]] numbers.",
         chips: ["whole", "ends"] },
    6: { name: "Distributive Property", frame: "$a(b + c) = $ [[$ab + ac$]]. A [[negative]] factor outside changes every sign inside. After distributing, combine [[like terms]].",
         chips: ["$ab + c$", "positive"], fb: { "$ab + c$": "The factor outside multiplies every term inside, the last one too." } }
  });
})();
