/* ==========================================================================
   Algebra I — Unit 5: Introduction to exponential functions. See lab/core.js
   for the format.

   Follows OpenStax Algebra 1, Unit 5, lesson for lesson — the readiness check, 5.1 to 5.15 and
   Project 5. Written to the recipe in docs/OEDU_BRILLIANT_CONCEPT.md and the
   five rules at the top of alg/u02.js: teach, learn by doing, super
   interactive, nothing clumsy, never too much.

   The exponent rules come first (5.1–5.2), then the one idea the unit turns
   on — adding the same amount against multiplying by the same amount
   (5.3–5.6) — then the graph and the function f(x) = a·bˣ read every way
   (5.7–5.13), and last the race between linear and exponential (5.14–5.15).

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   questions, figures, feedback and every step here are OEdu's own.

   Seventeen lessons, fourteen skills, four quizzes, and the unit test.
   Standards: CCSS HSN.RN.A.1–2, HSF.LE.A.1–3, HSF.LE.B.5, HSF.IF.C.7e, HSF.IF.C.8b, HSA.SSE.A.1.
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
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Unit 5 Readiness · Write a line from its graph, read a linear function, and evaluate a power.",
    mins: 6, v: 2,
    steps: [
      { type: "equation", kicker: "Check 1 · Lines from graphs", prompt: "Write the equation of this line.",
        scene: { type: "plane", x: [-4, 5], y: [-3, 9], fns: [{ f: "2*x + 1", color: "blue" }], marks: [{ x: 0, y: 1, color: "orange", label: "(0, 1)" }, { x: 2, y: 5, color: "orange", label: "(2, 5)" }] },
        answer: "y=2x+1", shown: "y = 2x + 1", skill: "Write a linear function",
        near: [{ v: "y=x+2", fb: "The intercept is 1 (where it crosses the $y$-axis), and the slope is $\\frac{4}{2} = 2$." }, { v: "y=2x", fb: "Slope 2 is right. Where does it cross the $y$-axis?" }],
        hints: ["Intercept: where it crosses the $y$-axis. Slope: rise over run between the two points."], why: "Intercept 1, slope $\\frac{5 - 1}{2 - 0} = 2$: $y = 2x + 1$." },
      { type: "equation", prompt: "And this one?",
        scene: { type: "plane", x: [-1, 9], y: [-1, 6], fns: [{ f: "-0.5*x + 4", color: "green" }], marks: [{ x: 0, y: 4, color: "orange", label: "(0, 4)" }, { x: 4, y: 2, color: "orange", label: "(4, 2)" }] },
        answer: "y=-0.5x+4", shown: "y = -0.5x + 4", skill: "Write a linear function",
        near: [{ v: "y=0.5x+4", fb: "The line falls: the slope is negative." }, { v: "y=-2x+4", fb: "Rise over run: $\\frac{-2}{4}$, not $\\frac{4}{-2}$." }],
        hints: ["From $(0, 4)$ to $(4, 2)$: down 2, across 4."], why: "Slope $\\frac{-2}{4} = -\\frac{1}{2}$, intercept 4: $y = -0.5x + 4$." },
      { type: "choice", kicker: "Check 2 · Linear functions", prompt: "A gym charges $C(m) = 15m + 40$ dollars for $m$ months. What does the 15 tell you?",
        options: [{ t: "Each month costs \\$15." }, { t: "Joining costs \\$15.", fb: "Joining is paid once, at $m = 0$: that's the 40." }, { t: "Membership lasts 15 months.", fb: "15 multiplies the months: it's a rate, dollars per month." }],
        answer: 0, skill: "Interpret a linear function", hints: ["What is added for each extra month?"], why: "The slope, 15, is the cost per month." },
      { type: "num", prompt: "What does the same gym cost for a year? Find $C(12)$.", pre: "$\\$$", answer: 220, skill: "Interpret a linear function",
        near: [{ v: 180, fb: "Add the \\$40 joining fee." }, { v: 660, fb: "Only the 15 multiplies the months." }], hints: ["$15(12) + 40$."], why: "$180 + 40 = 220$." },
      { type: "num", kicker: "Check 3 · Powers", prompt: "Evaluate $3^4$.", answer: 81, skill: "Evaluate powers",
        near: [{ v: 12, fb: "$3^4$ isn't $3 \\times 4$. It's $3 \\cdot 3 \\cdot 3 \\cdot 3$." }, { v: 64, fb: "That's $4^3$. Here 3 is multiplied by itself 4 times." }], hints: ["$3 \\cdot 3 \\cdot 3 \\cdot 3$."], why: "$9 \\cdot 9 = 81$." },
      { type: "num", prompt: "Evaluate $2 \\cdot 5^3$.", answer: 250, skill: "Evaluate powers",
        near: [{ v: 1000, fb: "The power applies to the 5 only: $5^3 = 125$, then double it." }, { v: 30, fb: "$5^3$ is $5 \\cdot 5 \\cdot 5$, not $5 \\times 3$." }], hints: ["Power first: $5^3 = 125$."], why: "$2 \\cdot 125 = 250$. Powers come before multiplying." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 5.1**. If **check 1** or **check 2** slipped, Unit 1's lessons 1.10 to 1.13 and Unit 4's lesson 4.7 cover them. If **check 3** slipped, start with 5.1 slowly: it begins from what a power means.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  // y = a·b^x with a and b on sliders.
  function expo(x, p) { return p.a * Math.pow(p.b, x); }

  /* ============================================ 5.1 · Properties of exponents */
  var HOW_5_1 = [["Expand", "Write each power as repeated factors."], ["Count", "Count the factors that are left after multiplying or cancelling."], ["Rewrite", "Write the result as one power."]];
  LESSONS.push({
    title: "Properties of exponents",
    blurb: "Book 5.1 · An exponent counts factors. Every rule comes from counting them.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is $2^3$?",
        answer: 8, skill: "Exponent rules",
        near: [{ v: 6, fb: "$2^3$ is not $2 \\times 3$. It is three 2s multiplied: $2 \\cdot 2 \\cdot 2$." }],
        hints: ["$2 \\cdot 2 \\cdot 2$."], why: "$2 \\cdot 2 \\cdot 2 = 8$." },
      { type: "learn", kicker: "The idea",
        prompt: "An exponent **counts factors**: $2^3$ is three 2s multiplied together. Every rule for exponents comes from counting those factors. So if you forget a rule, write the factors out and count.",
        scene: { type: "method", how: HOW_5_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch two powers multiplied.$$x^4 \\cdot x^3$$",
        scene: { type: "walk", how: HOW_5_1, rows: [
          { step: 1, m: "(x \\cdot x \\cdot x \\cdot x)(x \\cdot x \\cdot x)", say: "Four factors of $x$, times three factors of $x$." },
          { step: 2, m: "4 + 3 = 7", say: "Seven factors in all.",
            ask: { prompt: "Four factors of $x$, then three more. How many altogether?", answer: 0,
                   options: [{ t: "7" }, { t: "12", fb: "The factors join into one long product, so their counts add: $4 + 3$." }] } },
          { step: 3, m: "x^7", say: "Seven factors of $x$, written as one power." },
          { step: 3, m: "x^a \\cdot x^b = x^{a + b}", say: "**Product rule:** to multiply powers of the same base, add the exponents." }] },
        gate: true,
        then: "Multiplying powers of the same base **adds** the exponents." },
      { type: "guided", kicker: "Together",
        prompt: "Now a division. Dividing cancels factors.$$\\frac{x^6}{x^2}$$",
        how: HOW_5_1, skill: "Exponent rules",
        steps: [
          { step: 1, ask: "Written as factors, how many $x$'s are on top and how many underneath?", type: "choice", answer: 0,
            options: [{ t: "6 on top, 2 underneath" }, { t: "2 on top, 6 underneath", fb: "The top is $x^6$: six factors. The bottom is $x^2$: two." }],
            m: "\\frac{x \\cdot x \\cdot x \\cdot x \\cdot x \\cdot x}{x \\cdot x}", say: "Six factors over two factors." },
          { step: 2, ask: "The two underneath cancel two on top. How many are left on top?", type: "num", answer: 4,
            near: [{ v: 3, fb: "Cancelling takes factors away: $6 - 2$, not $6 \\div 2$." }], hint: "$6 - 2$.", m: "6 - 2 = 4", say: "Four factors are left." },
          { step: 3, ask: "Write the result as one power.", type: "choice", answer: 0,
            options: [{ t: "$x^4$" }, { t: "$x^3$", fb: "Cancelling removes factors: subtract, $6 - 2$. Do not divide the exponents." }, { t: "$x^8$", fb: "Adding is for multiplying powers. Dividing cancels factors." }],
            m: "x^4", say: "**Quotient rule:** to divide powers of the same base, subtract the exponents." }],
        why: "Expand, count, rewrite. Now use the product rule with numbers." },
      { type: "num", kicker: "On your own", prompt: "$2^3$ means $2 \\cdot 2 \\cdot 2$. What is $2^3 \\cdot 2^2$?", answer: 32, skill: "Exponent rules",
        near: [{ v: 64, fb: "That's $2^6$. Count the 2s: three of them, then two more." }, { v: 12, fb: "$2^3$ is 8, not 6, and $2^2$ is 4. Then multiply." }],
        hints: ["Write out every 2 and count them."], why: "$(2 \\cdot 2 \\cdot 2)(2 \\cdot 2)$ is five 2s: $2^5 = 32$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A power of a power.$$(x^2)^4$$",
        scene: { type: "walk", how: HOW_5_1, rows: [
          { step: 1, m: "x^2 \\cdot x^2 \\cdot x^2 \\cdot x^2", say: "The outer 4 says: four factors of $x^2$." },
          { step: 1, m: "(x \\cdot x)(x \\cdot x)(x \\cdot x)(x \\cdot x)", say: "Each of those is two factors of $x$." },
          { step: 2, m: "2 \\times 4 = 8", say: "Four groups of two." },
          { step: 3, m: "x^8", say: "**Power rule:** a power of a power multiplies the exponents." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A power of a power: $(x^3)^2 = x^{\\square}$. What goes in the box?", answer: 6, skill: "Exponent rules",
        near: [{ v: 5, fb: "$(x^3)^2$ means $x^3 \\cdot x^3$. That's $3 + 3$, or $3 \\times 2$." }, { v: 9, fb: "That would be $3^2$. The exponents are multiplied: $3 \\times 2$." }],
        hints: ["$(x^3)^2 = x^3 \\cdot x^3$."], why: "**Power rule:** $(x^a)^b = x^{ab}$. Here $3 \\times 2 = 6$." },
      { type: "table", prompt: "Follow the pattern down the table. Each row is the one above **divided by 2**.",
        head: ["power", "value"], rows: [["2^3", 8], ["2^2", 4], ["2^1", 2], ["2^0", null], ["2^{-1}", null], ["2^{-2}", null]],
        answers: [[3, 1, 1], [4, 1, 0.5], [5, 1, 0.25]], skill: "Zero and negative exponents",
        hints: ["Keep halving: 2, then …"], why: "$2^0 = 1$, $2^{-1} = \\frac{1}{2}$, $2^{-2} = \\frac{1}{4}$. Fractions like 1/2 are fine to type." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $2^0 = 0$, “because zero 2s make nothing”. What is wrong?",
        options: [{ t: "The pattern 8, 4, 2 halves each time, so the next value is 1: $2^0 = 1$." },
                  { t: "$2^0$ is 2.", fb: "$2^1$ is 2. One more step down the pattern halves it again." },
                  { t: "Nothing. $2^0 = 0$.", fb: "Each step down the powers of 2 divides by 2: 4, 2, then 1. It never reaches 0." }],
        answer: 0, skill: "Zero and negative exponents", hints: ["$2^3 = 8$, $2^2 = 4$, $2^1 = 2$. What does each step do?"],
        why: "Each step down divides by 2. After 2 comes 1, so $2^0 = 1$. One more step gives $2^{-1} = \\frac{1}{2}$." },
      { type: "slots", kicker: "Use it", prompt: "Match each expression to its simplified form.",
        slots: [{ id: "a", label: "$x^5 \\cdot x^2$" }, { id: "b", label: "$\\frac{x^5}{x^2}$" }, { id: "c", label: "$(x^5)^2$" }, { id: "d", label: "$x^0$" }, { id: "e", label: "$x^{-2}$" }],
        cards: [{ t: "$x^7$", slot: "a", fb: "Multiplying: add the exponents." }, { t: "$x^3$", slot: "b", fb: "Dividing: subtract the exponents." },
                { t: "$x^{10}$", slot: "c", fb: "A power of a power: multiply the exponents." }, { t: "$1$", slot: "d", fb: "Anything (except 0) to the power 0 is 1." },
                { t: "$\\frac{1}{x^2}$", slot: "e", fb: "A negative exponent means one over the positive power." }],
        skill: "Exponent rules", hints: ["Multiply: add. Divide: subtract. Power of a power: multiply."],
        why: "Every rule is a way of counting factors of $x$." }
    ]
  });

  /* ============================================ 5.2 · Rational exponents */
  var HOW_5_2 = [["Root", "The denominator names the root: 2 is a square root, 3 is a cube root."], ["Take it", "Take that root of the base."], ["Power", "Raise the result to the numerator."]];
  LESSONS.push({
    title: "Rational exponents",
    blurb: "Book 5.2 · A fraction as an exponent is a root.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "Which positive number, multiplied by itself, makes 9?",
        answer: 3, skill: "Rational exponents",
        near: [{ v: 4.5, fb: "That is half of 9. Look for a number times itself." }],
        hints: ["$\\square \\cdot \\square = 9$, the same number in both boxes."], why: "$3 \\cdot 3 = 9$. That number is $\\sqrt{9}$." },
      { type: "learn", kicker: "The idea",
        prompt: "The product rule says $9^{\\frac{1}{2}} \\cdot 9^{\\frac{1}{2}} = 9^1$. So $9^{\\frac{1}{2}}$ is the number that, multiplied by itself, makes 9. It is $\\sqrt{9}$. A fraction as an exponent is a **root**.",
        scene: { type: "method", how: HOW_5_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this power worked out.$$27^{\\frac{1}{3}}$$",
        scene: { type: "walk", how: HOW_5_2, rows: [
          { step: 1, m: "27^{\\frac{1}{3}} = \\sqrt[3]{27}", say: "The denominator is 3: a cube root." },
          { step: 2, m: "3 \\cdot 3 \\cdot 3 = 27", say: "Which number, used as a factor three times, makes 27? It is 3.",
            ask: { prompt: "Which number, used as a factor three times, makes 27?", answer: 0,
                   options: [{ t: "3" }, { t: "9", fb: "$9 \\cdot 9 \\cdot 9$ is 729. Try a smaller number." }] } },
          { step: 2, m: "\\sqrt[3]{27} = 3", say: "The cube root of 27 is 3." },
          { step: 3, m: "27^{\\frac{1}{3}} = 3", say: "The numerator is 1, so there is nothing more to do." }] },
        gate: true,
        then: "$x^{\\frac{1}{n}}$ is the $n$th root of $x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you work one out.$$64^{\\frac{1}{2}}$$",
        how: HOW_5_2, skill: "Rational exponents",
        steps: [
          { step: 1, ask: "Which root does the denominator name?", type: "choice", answer: 0,
            options: [{ t: "A square root" }, { t: "A cube root", fb: "A cube root has a denominator of 3. This one is 2." }, { t: "Half of 64", fb: "An exponent of $\\frac{1}{2}$ is not multiplying by $\\frac{1}{2}$." }],
            m: "64^{\\frac{1}{2}} = \\sqrt{64}", say: "Denominator 2: a square root." },
          { step: 2, ask: "Which positive number, multiplied by itself, makes 64?", type: "num", answer: 8,
            near: [{ v: 32, fb: "That is half of 64. Look for a number times itself." }], hint: "Try $7 \\cdot 7$, then $8 \\cdot 8$.", m: "8 \\cdot 8 = 64", say: "The square root of 64 is 8." },
          { step: 3, ask: "The numerator is 1. So what is $64^{\\frac{1}{2}}$?", type: "choice", answer: 0,
            options: [{ t: "8" }, { t: "32", fb: "That is half of 64. The exponent $\\frac{1}{2}$ means a square root." }, { t: "4096", fb: "That is $64^2$. The exponent here is $\\frac{1}{2}$." }],
            m: "64^{\\frac{1}{2}} = 8", say: "A numerator of 1 leaves the root as it is." }],
        why: "Root, take it, power. Now a cube root on your own." },
      { type: "num", kicker: "On your own", prompt: "What is $8^{\\frac{1}{3}}$?", answer: 2, skill: "Rational exponents",
        near: [{ v: 2.667, tol: 0.01, fb: "It isn't $8 \\div 3$. It's the number whose *cube* is 8." }],
        hints: ["Which number, multiplied by itself three times, makes 8?"], why: "$2 \\cdot 2 \\cdot 2 = 8$, so $8^{\\frac{1}{3}} = 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the numerator is not 1, there is one more move.$$8^{\\frac{2}{3}}$$",
        scene: { type: "walk", how: HOW_5_2, rows: [
          { step: 1, m: "8^{\\frac{2}{3}}", say: "Denominator 3: a cube root. The numerator is 2 this time." },
          { step: 2, m: "8^{\\frac{1}{3}} = 2", say: "The cube root of 8 is 2." },
          { step: 3, m: "2^2 = 4", say: "Now the numerator: square the result." },
          { step: 3, m: "8^{\\frac{2}{3}} = 4", say: "Root first, then power. Doing the root first keeps the numbers small." }] },
        gate: true },
      { type: "num", kicker: "Try it",
        prompt: "What is $27^{\\frac{2}{3}}$?",
        answer: 9, skill: "Rational exponents",
        near: [{ v: 3, fb: "That is the cube root. Now raise it to the numerator, 2." }, { v: 18, fb: "The exponent is not a multiplier. Take the cube root, then square." }],
        hints: ["Step 2: the cube root of 27 is 3.", "Step 3: square it."], why: "$27^{\\frac{1}{3}} = 3$, and $3^2 = 9$." },
      { type: "slots", prompt: "Match each power to its value.",
        slots: [{ id: "a", label: "$25^{\\frac{1}{2}}$" }, { id: "b", label: "$64^{\\frac{1}{3}}$" }, { id: "c", label: "$16^{\\frac{3}{4}}$" }, { id: "d", label: "$100^{\\frac{1}{2}}$" }],
        cards: [{ t: "5", slot: "a", fb: "$5^2 = 25$." }, { t: "4", slot: "b", fb: "$4^3 = 64$." }, { t: "8", slot: "c", fb: "Fourth root of 16 is 2, and $2^3 = 8$." }, { t: "10", slot: "d", fb: "$10^2 = 100$." }, { t: "12" }],
        skill: "Rational exponents", hints: ["The denominator is the root. Do that first."], why: "Root first, then the power." },
      { type: "choice", prompt: "Which is the same as $\\sqrt{x} \\cdot \\sqrt{x}$?",
        options: [{ t: "$x$" }, { t: "$x^2$", fb: "$x^{\\frac{1}{2}} \\cdot x^{\\frac{1}{2}}$: add the exponents, $\\frac{1}{2} + \\frac{1}{2} = 1$." }, { t: "$x^{\\frac{1}{4}}$", fb: "Multiplying powers adds the exponents. It doesn't multiply them." }],
        answer: 0, skill: "Rational exponents", hints: ["Write each root as $x^{\\frac{1}{2}}$ and use the product rule."], why: "$x^{\\frac{1}{2}} \\cdot x^{\\frac{1}{2}} = x^{1} = x$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $16^{\\frac{1}{2}} = 8$, “because half of 16 is 8”. What is wrong?",
        options: [{ t: "An exponent of $\\frac{1}{2}$ is a square root, not a half. $16^{\\frac{1}{2}} = 4$." },
                  { t: "Half of 16 is not 8.", fb: "Half of 16 is 8. The trouble is that the exponent does not mean “half of”." },
                  { t: "Nothing. The answer is 8.", fb: "Check with the product rule: $8 \\cdot 8$ would have to be 16." }],
        answer: 0, skill: "Rational exponents", hints: ["Step 1: what does a denominator of 2 name?"],
        why: "$16^{\\frac{1}{2}} = \\sqrt{16} = 4$, because $4 \\cdot 4 = 16$." },
      { type: "num", kicker: "Use it", prompt: "A cube has a volume of **125 cm³**. Its side is $125^{\\frac{1}{3}}$ cm. How long is that?", post: "cm", answer: 5, skill: "Rational exponents",
        hints: ["Which number cubed is 125?"], why: "$5 \\cdot 5 \\cdot 5 = 125$, so the side is 5 cm." }
    ]
  });

  /* ============================================ 5.3 · Patterns of growth */
  var HOW_5_3 = [["Differences", "Subtract each value from the next."], ["Ratios", "Divide each value by the one before."], ["Decide", "Equal differences: **linear**. Equal ratios: **exponential**."]];
  LESSONS.push({
    title: "Patterns of growth",
    blurb: "Book 5.3 · Adding the same amount, or multiplying by the same amount. They start alike and end very differently.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A pattern starts at 2 and **doubles** each step: 2, 4, 8, … What is its **5th** number?",
        answer: 32, skill: "Linear and exponential growth",
        near: [{ v: 16, fb: "That is the 4th number. Double once more." }, { v: 10, fb: "That adds 2 each time. Doubling multiplies by 2." }],
        hints: ["2, 4, 8, 16, …"], why: "2, 4, 8, 16, 32." },
      { type: "learn", kicker: "Explore", prompt: "Two patterns start at 2. One **adds 3** each step. The other **doubles**. Slide $n$ and watch them part.",
        scene: { type: "bars", series: [{ name: "Add 3", f: "2 + 3n", color: "green" }, { name: "Double", f: "2 * 2^n", color: "blue" }], n: 8, start: 0, gate: true },
        gate: true,
        then: "For a few steps they stay close. Then doubling leaves adding far behind." },
      { type: "learn", kicker: "The idea",
        prompt: "There are two ways to grow. **Linear** growth adds the same amount each step. **Exponential** growth multiplies by the same amount each step. They start close together and end very far apart.",
        scene: { type: "method", how: HOW_5_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Linear or exponential? Watch the test.$$3, \\; 6, \\; 12, \\; 24$$",
        scene: { type: "walk", how: HOW_5_3, rows: [
          { step: 1, m: "6 - 3, \\quad 12 - 6, \\quad 24 - 12", say: "Start with the differences." },
          { step: 1, m: "3, \\; 6, \\; 12", say: "They are not equal, so the growth is not linear." },
          { step: 2, m: "2, \\; 2, \\; 2", say: "The ratios: $6 \\div 3$, $12 \\div 6$ and $24 \\div 12$ are all 2.",
            ask: { prompt: "The differences are not equal. What do we check next?", answer: 0,
                   options: [{ t: "The ratios" }, { t: "Nothing. There is no pattern", fb: "A pattern that is not linear may still multiply by the same amount each step." }] } },
          { step: 3, m: "\\text{exponential}", say: "Equal ratios: each step multiplies by 2." }] },
        gate: true,
        then: "Equal differences mean linear. Equal ratios mean exponential." },
      { type: "guided", kicker: "Together",
        prompt: "Now you run the test.$$7, \\; 11, \\; 15, \\; 19$$",
        how: HOW_5_3, skill: "Linear and exponential growth",
        steps: [
          { step: 1, ask: "What is $11 - 7$?", type: "num", answer: 4, hint: "The next value minus this one.", m: "4, \\; 4, \\; 4", say: "Every difference is 4." },
          { step: 2, ask: "$11 \\div 7$ is about 1.57 and $15 \\div 11$ is about 1.36. Are the ratios equal?", type: "choice", answer: 0,
            options: [{ t: "No" }, { t: "Yes", fb: "1.57 and 1.36 are different numbers." }],
            m: "1.57, \\; 1.36", say: "The ratios are not equal." },
          { step: 3, ask: "Linear or exponential?", type: "choice", answer: 0,
            options: [{ t: "Linear: equal differences" }, { t: "Exponential: equal ratios", fb: "The ratios changed. It is the differences that are equal." }],
            m: "\\text{linear}", say: "The same amount, 4, is added each step." }],
        why: "Differences, ratios, decide. Now fill in both kinds of pattern." },
      { type: "table", kicker: "On your own", prompt: "Fill in both patterns.", head: ["step $n$", "add 3", "double"], rows: [[0, 2, 2], [1, 5, 4], [2, null, null], [3, null, null], [4, null, null]],
        answers: [[2, 1, 8], [2, 2, 8], [3, 1, 11], [3, 2, 16], [4, 1, 14], [4, 2, 32]], skill: "Linear and exponential growth",
        hints: ["Left: add 3 to the number above. Right: double the number above."], why: "Add 3: 2, 5, 8, 11, 14. Double: 2, 4, 8, 16, 32." },
      { type: "sort", prompt: "Linear or exponential?",
        bins: ["Linear", "Exponential"],
        cards: [{ t: "A tree grows 30 cm every year", bin: 0, fb: "The same amount is added each year." },
                { t: "Each person who hears a rumour tells two more", bin: 1, fb: "The number hearing it doubles each round." },
                { t: "You save \\$20 a week", bin: 0, fb: "Add \\$20 each week." },
                { t: "A town's population grows by 3% a year", bin: 1, fb: "A percent of the current size: each year it multiplies by 1.03." },
                { t: "A cell divides in two every hour", bin: 1, fb: "The count doubles each hour." }],
        skill: "Linear and exponential growth", hints: ["Is the same amount added, or is it multiplied by the same number?"],
        why: "“A fixed amount more” is linear. “Times as many” or “percent more” is exponential." },
      { type: "learn", kicker: "A harder case",
        prompt: "Which wins in the long run? **Offer A** pays \\$1,000 every day. **Offer B** pays \\$1 on day 1, then doubles every day.",
        scene: { type: "walk", how: HOW_5_3, rows: [
          { step: 1, m: "1000, \\; 1000, \\; 1000", say: "Offer A adds the same amount each day: linear." },
          { step: 2, m: "2, \\; 2, \\; 2", say: "Offer B multiplies by 2 each day: exponential." },
          { step: 3, m: "2^{19} = 524288", say: "On day 20, offer B pays more than half a million dollars for that single day. Offer A still pays \\$1,000." },
          { step: 3, m: "\\text{exponential wins}", say: "Multiplying always overtakes adding in the end." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Offer B again: \\$1 on day 1, doubling each day. On which day does the pay **first pass \\$1,000**?", pre: "day", answer: 11, skill: "Linear and exponential growth",
        near: [{ v: 10, fb: "Day 10 pays $2^9 = 512$ dollars. One more doubling." }, { v: 1000, fb: "Doubling gets there much faster than that. List the powers of 2." }],
        hints: ["1, 2, 4, 8, 16, 32, 64, 128, 256, 512, …"], why: "Day 10 pays \\$512 and day 11 pays \\$1,024." },
      { type: "slots", prompt: "Match each expression to its description. $x$ counts the steps.",
        slots: [{ id: "a", label: "Starts at 100 and adds 5 each step" }, { id: "b", label: "Starts at 100 and doubles each step" }, { id: "c", label: "Starts at 5 and adds 100 each step" }],
        cards: [{ t: "$100 + 5x$", slot: "a", fb: "Repeated adding is multiplication: $5x$." }, { t: "$100 \\cdot 2^x$", slot: "b", fb: "Repeated multiplying is a power: $2^x$." },
                { t: "$5 + 100x$", slot: "c", fb: "The starting value stands alone. The step multiplies $x$." }, { t: "$100 \\cdot 2x$" }],
        skill: "Linear and exponential growth", hints: ["Repeated addition is written as multiplication. Repeated multiplication is written as a power."],
        why: "Adding $d$ each step gives $dx$. Multiplying by $b$ each step gives $b^x$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran sees $5, 10, 20, 40$ and says: “Linear, because it goes up by 5.” What is wrong?",
        options: [{ t: "Only the first gap is 5. The gaps are 5, 10, 20, but every ratio is 2: exponential." },
                  { t: "It goes up by 10 each time.", fb: "The gaps are 5, then 10, then 20." },
                  { t: "Nothing. It is linear.", fb: "Linear needs every difference to be equal. Check $20 - 10$." }],
        answer: 0, skill: "Linear and exponential growth", hints: ["Step 1: work out every difference, not just the first."],
        why: "Differences 5, 10, 20 are not equal. Ratios 2, 2, 2 are. The pattern doubles." },
      { type: "choice", kicker: "Use it",
        prompt: "The price of a phone plan over four years: **\\$20**, **\\$22**, **\\$24.20**, **\\$26.62**. Is the growth linear or exponential?",
        options: [{ t: "Exponential: each price is 1.1 times the one before" },
                  { t: "Linear: it rises by \\$2 each year", fb: "The rises are \\$2, \\$2.20 and \\$2.42. They are not equal." },
                  { t: "Neither", fb: "Check the ratios: $22 \\div 20$ and $24.20 \\div 22$." }],
        answer: 0, skill: "Linear and exponential growth", hints: ["Step 2: divide each price by the one before."],
        why: "$22 \\div 20 = 1.1$, $24.20 \\div 22 = 1.1$ and $26.62 \\div 24.20 = 1.1$. Equal ratios: exponential, 10 percent a year." }
    ]
  });

  /* ============================================ 5.4 · Representing exponential growth */
  var HOW_5_4 = [["Start", "Find the starting amount. That is $a$."], ["Factor", "Find what the amount is multiplied by each step. That is $b$."], ["Write", "Write $f(x) = a \\cdot b^x$."], ["Use", "Put in the number of steps."]];
  LESSONS.push({
    title: "Representing exponential growth",
    blurb: "Book 5.4 · y = a·bˣ: a is where it starts, b is the growth factor.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A dish holds **500 bacteria**, and the number **doubles every hour**. How many after 3 hours?", answer: 4000, skill: "Exponential growth",
        near: [big(4000), { v: 3000, fb: "That's 500 × 2 × 3. Doubling three times is $\\times 2 \\times 2 \\times 2$." }, { v: 1500, fb: "It doesn't gain 500 an hour. It *doubles* each hour." }],
        hints: ["500, then 1000, then …"], why: "$500 \\to 1000 \\to 2000 \\to 4000$. That's $500 \\cdot 2^3$." },
      { type: "learn", kicker: "The idea",
        prompt: "Multiplying by 2 three times is multiplying by $2^3$. So after $h$ hours the dish holds $500 \\cdot 2^h$ bacteria. Every exponential function has that shape: a starting amount, times a growth factor raised to the number of steps.$$f(x) = a \\cdot b^x$$",
        scene: { type: "method", how: HOW_5_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "A dish holds **500 bacteria**, and the number **doubles every hour**. Watch its function written.",
        scene: { type: "walk", how: HOW_5_4, rows: [
          { step: 1, m: "a = 500", say: "The dish starts with 500." },
          { step: 2, m: "b = 2", say: "Each hour multiplies the count by 2.",
            ask: { prompt: "The count doubles every hour. What is the growth factor?", answer: 0,
                   options: [{ t: "2" }, { t: "500", fb: "500 is where it starts. The factor is what each hour multiplies by." }] } },
          { step: 3, m: "f(h) = 500 \\cdot 2^h", say: "Start, times the factor to the power of the hours." },
          { step: 4, m: "f(3) = 500 \\cdot 2^3 = 4000", say: "After 3 hours: $500 \\cdot 8$." },
          { step: 4, m: "f(0) = 500 \\cdot 2^0 = 500", say: "At hour 0 nothing has been multiplied yet, and $2^0 = 1$. The formula gives back the start." }] },
        gate: true,
        then: "In $f(x) = a \\cdot b^x$, $a$ is the **initial value** and $b$ is the **growth factor**." },
      { type: "guided", kicker: "Together",
        prompt: "A rumour: **4 people** know it on day 0, and the number who know **triples** each day. Write the function.",
        how: HOW_5_4, skill: "Exponential growth",
        steps: [
          { step: 1, ask: "How many people know at the start?", type: "num", answer: 4, hint: "Day 0.", m: "a = 4", say: "The initial value." },
          { step: 2, ask: "What is each day's count multiplied by?", type: "num", answer: 3,
            near: [{ v: 4, fb: "4 is the start. “Triples” tells you the factor." }], hint: "Triple means three times.", m: "b = 3", say: "The growth factor." },
          { step: 3, ask: "Which function gives the count after $d$ days?", type: "choice", answer: 0,
            options: [{ t: "$f(d) = 4 \\cdot 3^d$" }, { t: "$f(d) = 3 \\cdot 4^d$", fb: "The start is 4 and the factor is 3. They are swapped here." }, { t: "$f(d) = 4 + 3d$", fb: "That adds 3 each day. Tripling multiplies." }],
            m: "f(d) = 4 \\cdot 3^d", say: "Start times factor to the power of the days." },
          { step: 4, ask: "How many know after 2 days?", type: "num", answer: 36,
            near: [{ v: 24, fb: "$3^2$ is 9, not 6." }, { v: 144, fb: "Do the power first: $3^2 = 9$. Then multiply by 4." }], hint: "$4 \\cdot 3^2$.",
            m: "f(2) = 4 \\cdot 3^2 = 36", say: "$4 \\cdot 9 = 36$ people." }],
        why: "Start, factor, write, use. Now find a factor from a table." },
      { type: "num", kicker: "On your own", prompt: "This table is exponential. What is its growth factor?" + tbl(["$x$", "$y$"], [[0, 4], [1, 12], [2, 36], [3, 108]]), answer: 3, skill: "Growth factor",
        near: [{ v: 8, fb: "That's the first difference. For a growth factor, *divide*: $12 \\div 4$." }, { v: 4, fb: "4 is the initial value, $a$. The factor is what each output is multiplied by." }],
        hints: ["Divide any output by the one before it."], why: "$12 \\div 4 = 3$, $36 \\div 12 = 3$: $y = 4 \\cdot 3^x$." },
      { type: "plane", prompt: "Set $a$ and $b$ so the curve $y = a \\cdot b^x$ passes through **both** orange points.",
        x: [-1, 4], y: [0, 26], labelEveryY: 2, params: { a: { v: 1, min: 1, max: 6, step: 1, label: "$a$" }, b: { v: 1.5, min: 1.5, max: 3, step: 0.5, label: "$b$" } },
        fns: [{ f: expo, color: "blue" }], marks: [{ x: 0, y: 3, color: "orange", r: 6 }, { x: 1, y: 6, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + st.params.a + " \\cdot " + nm(st.params.b) + "^x$"; },
        check: function (st) { var p = st.params; return p.a === 3 && p.b === 2 ? { ok: true } : { ok: false, say: p.a !== 3 ? "At $x = 0$ the curve is at height $a$. The first orange point is $(0, 3)$." : "From $(0, 3)$ to $(1, 6)$ the height is multiplied by what?" }; },
        answer: { params: { a: 3, b: 2 } }, skill: "Exponential growth", hints: ["$a$ is the height at $x = 0$. $b$ is the multiplier for one step right."],
        why: "$a = 3$ (the start) and $b = 6 \\div 3 = 2$ (the factor): $y = 3 \\cdot 2^x$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A growth factor need not be a whole number. A post has **250 views**, and each hour its views are multiplied by **1.5**.",
        scene: { type: "walk", how: HOW_5_4, rows: [
          { step: 1, m: "a = 250", say: "The post starts with 250 views." },
          { step: 2, m: "b = 1.5", say: "Each hour the views grow by half as much again." },
          { step: 3, m: "V(t) = 250 \\cdot (1.5)^t", say: "The function." },
          { step: 4, m: "V(2) = 250 \\cdot 2.25 = 562.5", say: "After 2 hours, about 563 views." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A social-media post has $V(t) = 250 \\cdot (1.5)^t$ views after $t$ hours. What do 250 and 1.5 tell you?",
        options: [{ t: "It started with 250 views, and the views are multiplied by 1.5 each hour." }, { t: "It gains 250 views an hour for 1.5 hours.", fb: "250 is the value at $t = 0$. The 1.5 is a multiplier, not a time." }, { t: "It started with 1.5 views and gains 250 an hour.", fb: "The number in front is the start. The number being raised to a power is the factor." }],
        answer: 0, skill: "Exponential growth", hints: ["In $a \\cdot b^t$: $a$ is the start, $b$ the factor."], why: "$a = 250$ (initial value) and $b = 1.5$ (growth factor): 50% more each hour." },
      { type: "spotline", kicker: "Find the error",
        prompt: "A colony starts with **10** cells and **triples** every hour. Tap the line where Kiran's work **first** goes wrong.",
        lines: ["a = 10", "b = 3", "f(x) = 3 \\cdot 10^x"], answer: 2, fix: "f(x) = 10 \\cdot 3^x",
        fb: { 0: "The colony starts with 10. Right.", 1: "Tripling means a factor of 3. Right." },
        skill: "Exponential growth", hints: ["Which number is raised to the power: the start or the factor?"],
        why: "The factor carries the exponent: $f(x) = 10 \\cdot 3^x$. Check: $f(1) = 30$, three times the start." },
      { type: "num", kicker: "Use it",
        prompt: "A savings account starts with **\\$200** and **doubles every 10 years**. How much is in it after **30 years**?",
        pre: "$\\$$", answer: 1600, skill: "Exponential growth",
        near: [big(1600), { v: 600, fb: "That adds 200 three times. Doubling multiplies: 200, 400, 800, …" }, { v: 800, fb: "That is after 20 years. Double once more." }],
        hints: ["30 years is 3 steps of 10 years.", "$200 \\cdot 2^3$."], why: "$200 \\cdot 2^3 = 200 \\cdot 8 = 1600$." }
    ]
  });

  /* ============================================ 5.5 · Representing exponential decay */
  var HOW_5_5 = [["Start", "Find the starting amount. That is $a$."], ["Factor", "Find what the amount is multiplied by each step. That is $b$. Between 0 and 1, the amount shrinks."], ["Write", "Write $f(x) = a \\cdot b^x$."], ["Use", "Put in the number of steps."]];
  LESSONS.push({
    title: "Representing exponential decay",
    blurb: "Book 5.5 · When the factor is between 0 and 1, the quantity shrinks.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is three-quarters of 16?",
        answer: 12, skill: "Exponential decay",
        near: [{ v: 4, fb: "That is one quarter of 16. Three-quarters is three of those." }],
        hints: ["One quarter of 16 is 4."], why: "$\\frac{3}{4} \\cdot 16 = 12$." },
      { type: "learn", kicker: "The idea",
        prompt: "A growth factor can be **less than 1**. Multiply by $\\frac{3}{4}$ again and again and the quantity shrinks, by the same fraction each time. This is **exponential decay**: $f(x) = a \\cdot b^x$ with $b$ between 0 and 1.",
        scene: { type: "method", how: HOW_5_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "A car is worth **\\$16,000**. Each year it keeps **three-quarters** of its value. Watch its function written.",
        scene: { type: "walk", how: HOW_5_5, rows: [
          { step: 1, m: "a = 16000", say: "The car starts at \\$16,000." },
          { step: 2, m: "b = \\frac{3}{4}", say: "Each year its value is multiplied by three-quarters.",
            ask: { prompt: "The car **keeps** three-quarters of its value each year. What is its value multiplied by?", answer: 0,
                   options: [{ t: "$\\frac{3}{4}$" }, { t: "$\\frac{1}{4}$", fb: "One quarter is what it **loses**. What is left is three-quarters." }] } },
          { step: 3, m: "V(t) = 16000 \\cdot \\left(\\frac{3}{4}\\right)^t", say: "Start, times the factor to the power of the years." },
          { step: 4, m: "V(1) = 12000", say: "After 1 year: three-quarters of 16,000." },
          { step: 4, m: "V(2) = 9000", say: "After 2 years: three-quarters of 12,000." }] },
        gate: true,
        then: "**Exponential decay**: the factor is between 0 and 1, so each step leaves a fraction of what was there." },
      { type: "guided", kicker: "Together",
        prompt: "A dose of **200 mg** of medicine **halves** in the body every 4 hours. Count $x$ in 4-hour steps.",
        how: HOW_5_5, skill: "Exponential decay",
        steps: [
          { step: 1, ask: "How much is there at the start?", type: "num", answer: 200, hint: "Before any time has passed.", m: "a = 200", say: "The initial value." },
          { step: 2, ask: "What is the amount multiplied by in each 4-hour step?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1}{2}$" }, { t: "2", fb: "Multiplying by 2 would make it grow. Halving multiplies by $\\frac{1}{2}$." }, { t: "4", fb: "4 is the number of hours in a step, not the factor." }],
            m: "b = \\frac{1}{2}", say: "Half is left after each step." },
          { step: 3, ask: "Which function gives the amount after $x$ steps?", type: "choice", answer: 0,
            options: [{ t: "$f(x) = 200 \\cdot \\left(\\frac{1}{2}\\right)^x$" }, { t: "$f(x) = 200 - \\frac{1}{2}x$", fb: "That subtracts the same amount each step. Halving multiplies." }],
            m: "f(x) = 200 \\cdot \\left(\\frac{1}{2}\\right)^x", say: "Start times factor to the power of the steps." },
          { step: 4, ask: "How much is left after 2 steps (8 hours)?", type: "num", answer: 50, post: "mg",
            near: [{ v: 100, fb: "That is after one step. Halve again." }], hint: "200, then 100, then …", m: "f(2) = 200 \\cdot \\frac{1}{4} = 50", say: "Half of a half is a quarter." }],
        why: "Start, factor, write, use. Now carry the car's value on." },
      { type: "table", kicker: "On your own", prompt: "Carry on.", head: ["year", "value (\\$)"], rows: [[0, 16000], [1, 12000], [2, 9000], [3, null]], answers: [[3, 1, 6750]], skill: "Exponential decay",
        hints: ["Three-quarters of 9,000."], why: "$9000 \\times 0.75 = 6750$. Each year's loss is smaller than the last, because it is a fraction of a smaller amount." },
      { type: "sort", prompt: "Growth or decay?",
        bins: ["Growth", "Decay"],
        cards: [{ t: "$y = 3 \\cdot (1.2)^x$", bin: 0, fb: "1.2 is more than 1." }, { t: "$y = 50 \\cdot (0.9)^x$", bin: 1, fb: "0.9 is less than 1." },
                { t: "$y = 0.5 \\cdot 4^x$", bin: 0, fb: "The factor is 4. The 0.5 is only the starting value." }, { t: "$y = 1000 \\cdot \\left(\\frac{1}{2}\\right)^x$", bin: 1, fb: "A half is less than 1, however big the start." },
                { t: "$y = 7 \\cdot (0.99)^x$", bin: 1, fb: "0.99 is just below 1: slow decay." }],
        skill: "Exponential decay", hints: ["Look only at the number being raised to the power."], why: "The base $b$ decides. The starting value $a$ doesn't." },
      { type: "plane", prompt: "The curve is $y = 8 \\cdot b^x$. Slide $b$ until the curve shows **decay**.",
        x: [-1, 6], y: [0, 17], params: { b: { v: 1.25, min: 0.25, max: 1.5, step: 0.25, label: "$b$" } },
        fns: [{ f: function (x, p) { return 8 * Math.pow(p.b, x); }, color: "blue" }],
        readout: function (st) { var b = st.params.b; return "$y = 8 \\cdot " + nm(b) + "^x$: " + (b > 1 ? "growth" : b < 1 ? "decay" : "constant"); },
        check: function (st) { var b = st.params.b; return b < 1 ? { ok: true } : { ok: false, say: b === 1 ? "With $b = 1$ nothing changes: $8 \\cdot 1^x = 8$." : "This curve rises. Multiplying by more than 1 makes things bigger." }; },
        answer: { params: { b: 0.5 } }, skill: "Exponential decay", hints: ["What kind of multiplier makes a number smaller?"],
        why: "Any $b$ between 0 and 1 gives decay. $b = 1$ is flat, and $b > 1$ is growth." },
      { type: "learn", kicker: "A harder case",
        prompt: "Often you are told what is **lost**, as a percentage. A bike **loses 30 percent** of its value each year. What is the factor?",
        scene: { type: "walk", how: HOW_5_5, rows: [
          { step: 1, m: "a", say: "Whatever the bike is worth now is the start." },
          { step: 2, m: "100 - 30 = 70", say: "Out of every 100, it loses 30 and **keeps** 70." },
          { step: 2, m: "b = 0.7", say: "The factor is what it keeps, written as a decimal." },
          { step: 3, m: "V(t) = a \\cdot (0.7)^t", say: "The function." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A laptop **loses 20%** of its value each year. What is its growth factor $b$?", answer: 0.8, skill: "Percent change as a factor",
        near: [{ v: 0.2, fb: "20% is what is lost. The factor is what is *kept*: $100\\% - 20\\%$." }, { v: 20, fb: "Write the factor as a decimal: the fraction of the value that remains." }, { v: 1.2, fb: "That would be a 20% gain." }],
        hints: ["If 20% is lost, what percent remains?"], why: "It keeps 80%, so $b = 0.8$. For a 20% *gain*, $b$ would be 1.2." },
      { type: "choice", kicker: "Find the error",
        prompt: "A phone worth \\$800 **loses 25 percent** of its value each year. Kiran writes $V(t) = 800 \\cdot (0.25)^t$. What is wrong?",
        options: [{ t: "0.25 is what it loses. The factor is what it keeps: 0.75." },
                  { t: "The 800 should be raised to the power.", fb: "The factor carries the exponent. 800 is the start." },
                  { t: "Nothing. That is right.", fb: "His formula leaves only \\$200 after one year. Losing 25 percent leaves \\$600." }],
        answer: 0, skill: "Percent change as a factor", hints: ["Step 2: if 25 out of 100 is lost, how much is kept?"],
        why: "It keeps 75 percent: $V(t) = 800 \\cdot (0.75)^t$. After one year that is \\$600." },
      { type: "num", kicker: "Use it", prompt: "A dose of **200 mg** of medicine halves in the body every 4 hours. How much is left after **12 hours**?", post: "mg", answer: 25, skill: "Exponential decay",
        near: [{ v: 50, fb: "That's after 8 hours: two halvings. 12 hours is three." }, { v: 100, fb: "That's after one halving, 4 hours." }],
        hints: ["12 hours is three lots of 4 hours."], why: "$200 \\to 100 \\to 50 \\to 25$: $200 \\cdot \\left(\\frac{1}{2}\\right)^3 = 25$ mg." }
    ]
  });
  function pow2(x) { return Math.pow(2, x); }
  function med(x) { return 80 * Math.pow(0.5, x); }

  /* ============================================ 5.6 · Negative exponents and scientific notation */
  var HOW_5_6 = [["Flip", "A negative exponent means “divide”. Write 1 over the same power with a positive exponent."], ["Power", "Work out that power."], ["Answer", "Write the result as a fraction or a decimal."]];
  LESSONS.push({
    title: "Negative exponents and scientific notation",
    blurb: "Book 5.6 · A negative exponent runs the clock backwards. Powers of ten write very big and very small numbers.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A dish has $P(h) = 500 \\cdot 2^h$ bacteria, where $h$ is hours after noon. How many were there **one hour before** noon?", answer: 250, skill: "Negative exponents",
        near: [{ v: 1000, fb: "That's one hour *after* noon. Going back in time undoes a doubling." }, { v: -1000, fb: "A count can't be negative. $2^{-1}$ means divide by 2." }],
        hints: ["One hour before noon is $h = -1$.", "Doubling forwards is halving backwards."], why: "$P(-1) = 500 \\cdot 2^{-1} = 500 \\cdot \\frac{1}{2} = 250$." },
      { type: "learn", kicker: "The idea",
        prompt: "One hour **before** noon is $h = -1$, and the count was half as big. A negative exponent runs the clock backwards: each step back **divides** by the base.$$b^{-n} = \\frac{1}{b^n}$$",
        scene: { type: "method", how: HOW_5_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a negative exponent worked out.$$5^{-2}$$",
        scene: { type: "walk", how: HOW_5_6, rows: [
          { step: 1, m: "5^{-2} = \\frac{1}{5^2}", say: "Negative exponent: 1 over the positive power." },
          { step: 2, m: "5^2 = 25", say: "Work out the power.",
            ask: { prompt: "$5^{-2}$ is 1 over $5^2$. Will the answer be negative?", answer: 0,
                   options: [{ t: "No. It is a small positive number" }, { t: "Yes, because of the minus sign", fb: "The minus sign in the exponent means “divide”. It does not make the value negative." }] } },
          { step: 3, m: "5^{-2} = \\frac{1}{25}", say: "One twenty-fifth." },
          { step: 3, m: "\\frac{1}{25} = 0.04", say: "As a decimal: small, and positive." }] },
        gate: true,
        then: "A negative exponent gives a **reciprocal**, not a negative number." },
      { type: "guided", kicker: "Together",
        prompt: "Now you work one out.$$2^{-3}$$",
        how: HOW_5_6, skill: "Negative exponents",
        steps: [
          { step: 1, ask: "Write $2^{-3}$ with a positive exponent.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1}{2^3}$" }, { t: "$-2^3$", fb: "The minus sign belongs to the exponent. It means “divide”, not “negative”." }, { t: "$2^{\\frac{1}{3}}$", fb: "That is a cube root. A negative exponent gives 1 over the power." }],
            m: "2^{-3} = \\frac{1}{2^3}", say: "1 over the positive power." },
          { step: 2, ask: "What is $2^3$?", type: "num", answer: 8, near: [{ v: 6, fb: "$2^3$ is $2 \\cdot 2 \\cdot 2$, not $2 \\times 3$." }], hint: "$2 \\cdot 2 \\cdot 2$.", m: "2^3 = 8", say: "Three factors of 2." },
          { step: 3, ask: "So what is $2^{-3}$?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1}{8}$" }, { t: "$-8$", fb: "A negative exponent does not make the value negative." }, { t: "$-6$", fb: "Nothing is multiplied by $-3$. The exponent counts steps of dividing by 2." }],
            m: "2^{-3} = \\frac{1}{8}", say: "One eighth." }],
        why: "Flip, power, answer. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "What is $3^{-2}$? (Type a fraction like 1/4.)", answer: 1 / 9, tol: 1e-9, shown: "1/9", skill: "Negative exponents",
        near: [{ v: -9, fb: "A negative exponent doesn't make the answer negative. It means “one over”." }, { v: -6, fb: "It isn't $3 \\times -2$. $3^{-2} = \\frac{1}{3^2}$." }, { v: 9, fb: "That's $3^2$. The minus sign puts it underneath: $\\frac{1}{9}$." }],
        hints: ["$3^{-2} = \\frac{1}{3^2}$."], why: "$3^{-2} = \\frac{1}{9}$." },
      { type: "choice", prompt: "**Scientific notation** writes a number as a number between 1 and 10, times a power of 10. What is $3.2 \\times 10^4$?",
        options: [{ t: "32,000" }, { t: "320,000", fb: "$10^4$ is 10,000. $3.2 \\times 10000 = 32000$." }, { t: "3,200", fb: "That's $3.2 \\times 10^3$." }, { t: "0.00032", fb: "A positive power of 10 makes the number bigger." }],
        answer: 0, skill: "Scientific notation", hints: ["$10^4$ is ten thousand. Move the decimal point 4 places right."], why: "$3.2 \\times 10000 = 32000$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Powers of 10 write very large and very small numbers. Watch a negative power of 10 turned into a decimal.$$7.2 \\times 10^{-2}$$",
        scene: { type: "walk", how: HOW_5_6, rows: [
          { step: 1, m: "10^{-2} = \\frac{1}{10^2}", say: "The same rule: 1 over the positive power." },
          { step: 2, m: "\\frac{1}{100}", say: "$10^2$ is 100." },
          { step: 3, m: "7.2 \\times \\frac{1}{100} = 0.072", say: "Dividing by 100 moves the decimal point two places to the left." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "And with a negative power: write $4.5 \\times 10^{-3}$ as a decimal.", answer: 0.0045, tol: 1e-9, skill: "Scientific notation",
        near: [{ v: 4500, fb: "A negative power of 10 divides: the number gets smaller." }, { v: 0.045, tol: 1e-9, fb: "$10^{-3}$ is one thousandth: move the point 3 places left." }, { v: 0.00045, tol: 1e-9, fb: "That's 4 places. $10^{-3}$ moves the point 3 places." }],
        hints: ["$10^{-3} = \\frac{1}{1000}$."], why: "$4.5 \\div 1000 = 0.0045$." },
      { type: "sort", prompt: "Is the number bigger or smaller than 1?",
        bins: ["Bigger than 1", "Smaller than 1"],
        cards: [{ t: "$6 \\times 10^{-2}$", bin: 1, fb: "0.06." }, { t: "$2.1 \\times 10^{3}$", bin: 0, fb: "2,100." }, { t: "$9.9 \\times 10^{-1}$", bin: 1, fb: "0.99: just under 1." },
                { t: "$1.5 \\times 10^{1}$", bin: 0, fb: "15." }, { t: "$7 \\times 10^{-9}$", bin: 1, fb: "Seven billionths." }],
        skill: "Scientific notation", hints: ["Negative power of 10: a small number. Positive: a big one."], why: "The sign of the exponent tells you which side of 1 the number is on." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $10^{-2} = -100$. What is wrong?",
        options: [{ t: "A negative exponent means divide: $10^{-2} = \\frac{1}{100} = 0.01$." },
                  { t: "It should be $-20$.", fb: "Nothing is multiplied by $-2$. The exponent counts steps of dividing by 10." },
                  { t: "Nothing. $10^{-2}$ is $-100$.", fb: "Follow the pattern 100, 10, 1, 0.1, 0.01. Each step down divides by 10 and stays positive." }],
        answer: 0, skill: "Negative exponents", hints: ["Step 1: write it as 1 over a positive power."],
        why: "$10^{-2} = \\frac{1}{10^2} = \\frac{1}{100}$. Small, and positive." },
      { type: "num", kicker: "Use it", prompt: "Multiply $(2 \\times 10^3)(4 \\times 10^5)$. The answer is $8 \\times 10^{\\square}$. What goes in the box?", answer: 8, skill: "Scientific notation",
        near: [{ v: 15, fb: "Multiplying powers *adds* the exponents: $3 + 5$." }],
        hints: ["Multiply the 2 and 4. Then use the product rule on $10^3 \\cdot 10^5$."], why: "$2 \\times 4 = 8$ and $10^3 \\cdot 10^5 = 10^8$: the answer is $8 \\times 10^8$." }
    ]
  });

  /* ============================================ 5.7 · Analyzing graphs */
  var HOW_5_7 = [["Intercept", "The curve crosses the $y$-axis at $(0, a)$."], ["Direction", "$b$ greater than 1: the curve rises. $b$ between 0 and 1: it falls."], ["Next point", "At $x = 1$ the height is $a \\cdot b$."], ["Shape", "Draw a smooth curve. It gets close to the $x$-axis and never touches it."]];
  LESSONS.push({
    title: "Analyzing graphs",
    blurb: "Book 5.7 · What a and b do to the graph of y = a·bˣ.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "For $y = 4 \\cdot 2^x$, what is $y$ when $x = 0$?",
        answer: 4, skill: "Exponential graphs",
        near: [{ v: 8, fb: "$2^0$ is 1, not 2. So $y = 4 \\cdot 1$." }, { v: 0, fb: "$2^0$ is 1, not 0." }],
        hints: ["$2^0 = 1$."], why: "$4 \\cdot 2^0 = 4 \\cdot 1 = 4$." },
      { type: "learn", kicker: "Explore", prompt: "Play with $y = a \\cdot b^x$. Move $a$, then move $b$. **What does each one control?**",
        scene: { type: "plane", x: [-3, 5], y: [0, 20], gate: true, params: { a: { v: 2, min: 1, max: 8, step: 1, label: "$a$" }, b: { v: 2, min: 0.25, max: 3, step: 0.25, label: "$b$" } },
          fns: [{ f: expo, color: "blue" }], marks: [{ x: 0, y: function (P) { return P.a; }, color: "orange", r: 6, label: function (P) { return "(0, " + P.a + ")"; } }],
          readout: function (st) { var b = st.params.b; return "$y = " + st.params.a + " \\cdot " + nm(b) + "^x$ — " + (b > 1 ? "growth" : b < 1 ? "decay" : "constant"); } },
        gate: true,
        then: "$a$ is the **vertical intercept**: the curve always crosses the $y$-axis at $(0, a)$. $b$ sets the shape: above 1 the curve rises, below 1 it falls. Either way it gets closer and closer to the $x$-axis without ever touching it." },
      { type: "learn", kicker: "The idea",
        prompt: "The two numbers in $y = a \\cdot b^x$ shape its graph. $a$ is where the curve crosses the $y$-axis. $b$ decides whether it rises or falls, and how sharply.",
        scene: { type: "method", how: HOW_5_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the graph of this function planned.$$y = 3 \\cdot 2^x$$",
        scene: { type: "walk", how: HOW_5_7, rows: [
          { step: 1, m: "(0, 3)", say: "At $x = 0$, $y = 3 \\cdot 2^0 = 3$." },
          { step: 2, m: "b = 2", say: "Greater than 1, so the curve rises.",
            ask: { prompt: "$b = 2$. Does the curve rise or fall from left to right?", answer: 0,
                   options: [{ t: "It rises" }, { t: "It falls", fb: "Multiplying by 2 at each step makes the height grow." }] } },
          { step: 3, m: "(1, 6)", say: "At $x = 1$ the height is $3 \\cdot 2 = 6$." },
          { step: 4, m: "(2, 12), \\; (3, 24)", say: "Each step right doubles the height, so the curve bends upward. To the left it sinks toward the $x$-axis without touching it." }] },
        gate: true,
        then: "$a$ is the vertical intercept. $b$ sets the direction and the steepness." },
      { type: "guided", kicker: "Together",
        prompt: "Now you plan a graph.$$y = 8 \\cdot \\left(\\frac{1}{2}\\right)^x$$",
        how: HOW_5_7, skill: "Exponential graphs",
        steps: [
          { step: 1, ask: "Where does it cross the $y$-axis?", type: "choice", answer: 0,
            options: [{ t: "$(0, 8)$" }, { t: "$(0, \\frac{1}{2})$", fb: "$\\frac{1}{2}$ is the factor. At $x = 0$ the height is $a$, which is 8." }, { t: "$(8, 0)$", fb: "That point is on the $x$-axis. The curve never touches the $x$-axis." }],
            m: "(0, 8)", say: "The intercept is $a$." },
          { step: 2, ask: "$b = \\frac{1}{2}$. Does the curve rise or fall?", type: "choice", answer: 0,
            options: [{ t: "It falls" }, { t: "It rises", fb: "Each step halves the height, so the curve comes down." }],
            m: "b = \\frac{1}{2}", say: "Between 0 and 1: decay." },
          { step: 3, ask: "What is the height at $x = 1$?", type: "num", answer: 4, hint: "$8 \\cdot \\frac{1}{2}$.", m: "(1, 4)", say: "$a \\cdot b = 4$." },
          { step: 4, ask: "What happens far to the right?", type: "choice", answer: 0,
            options: [{ t: "The curve gets closer and closer to the $x$-axis, without reaching it" }, { t: "It crosses the $x$-axis and goes negative", fb: "Halving a positive number never gives 0 or less." }],
            m: "(2, 2), \\; (3, 1)", say: "Halving for ever: always positive, always smaller." }],
        why: "Intercept, direction, next point, shape. Now find an intercept yourself." },
      { type: "pair", kicker: "On your own", prompt: "Where does the graph of $y = 5 \\cdot 3^x$ cross the $y$-axis?", answer: [0, 5], skill: "Exponential graphs",
        near: [{ v: [0, 3], fb: "3 is the growth factor. At $x = 0$, $3^0 = 1$, so $y = 5$." }, { v: [0, 15], fb: "That's $5 \\cdot 3^1$, at $x = 1$. The $y$-axis is $x = 0$." }, { v: [5, 0], fb: "On the $y$-axis, $x$ is 0: the point is $(0, 5)$." }],
        hints: ["Put $x = 0$."], why: "$5 \\cdot 3^0 = 5$: the point $(0, 5)$." },
      { type: "choice", prompt: "One of these graphs is linear and one is exponential. Which is the exponential one?",
        scene: graph([-1, 5], [0, 20], [{ f: "2 + 2*x", color: "green", label: "green", labelAt: 4.4 }, { f: function (x) { return 2 * Math.pow(2, x); }, color: "blue", label: "blue", labelAt: 2.7 }]),
        options: [{ t: "Blue: it bends upward, getting steeper." }, { t: "Green: it's higher at first.", fb: "The green one is straight: it climbs by the same amount each step. That's linear." }, { t: "Both", fb: "A straight line is never exponential." }],
        answer: 0, skill: "Exponential graphs", hints: ["Which one has a slope that keeps changing?"], why: "An exponential graph curves: each step multiplies the height, so the climb gets steeper and steeper." },
      { type: "learn", kicker: "A harder case",
        prompt: "Go the other way: from a graph to its equation. A curve passes through $(0, 2)$ and $(1, 6)$.",
        scene: { type: "walk", how: HOW_5_7, rows: [
          { step: 1, m: "a = 2", say: "It crosses the $y$-axis at 2." },
          { step: 2, m: "2 \\to 6", say: "From 2 up to 6: the curve rises, so $b$ is greater than 1." },
          { step: 3, m: "2 \\cdot b = 6, \\; b = 3", say: "At $x = 1$ the height is $a \\cdot b$." },
          { step: 4, m: "y = 2 \\cdot 3^x", say: "Check the next point: $x = 2$ should give 18." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which equation matches this graph?",
        scene: graph([-1, 5], [0, 9], [{ f: function (x) { return 8 * Math.pow(0.5, x); }, color: "purple" }], { marks: [{ x: 0, y: 8, color: "orange" }, { x: 1, y: 4, color: "orange" }, { x: 2, y: 2, color: "orange" }] }),
        options: [{ t: "$y = 8 \\cdot \\left(\\frac{1}{2}\\right)^x$" }, { t: "$y = 8 \\cdot 2^x$", fb: "That one grows. This graph falls: each step halves the height." }, { t: "$y = \\frac{1}{2} \\cdot 8^x$", fb: "The intercept is 8, so $a = 8$. The factor is what one step multiplies by: a half." }, { t: "$y = 8 - 4x$", fb: "A line through $(0, 8)$ and $(1, 4)$ would reach $(2, 0)$. This graph is at 2 there." }],
        answer: 0, skill: "Exponential graphs", hints: ["Read the intercept for $a$. Compare two neighbouring points for $b$."], why: "It starts at 8 and halves each step: 8, 4, 2." },
      { type: "sort", prompt: "True for **every** function $y = a \\cdot b^x$ with $a > 0$?",
        bins: ["Always true", "Not always"],
        cards: [{ t: "The graph crosses the $y$-axis at $(0, a)$", bin: 0, fb: "$b^0 = 1$, so $y = a$ there." }, { t: "The graph stays above the $x$-axis", bin: 0, fb: "A positive number times a positive power is always positive." },
                { t: "The graph rises from left to right", bin: 1, fb: "Only when $b > 1$. With $b < 1$ it falls." }, { t: "The graph is a straight line", bin: 1, fb: "Only if $b = 1$, which is a flat line. Otherwise it curves." }],
        skill: "Exponential graphs", hints: ["Think of one growth example and one decay example."], why: "The intercept $(0, a)$ and staying positive are shared. Direction depends on $b$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says the graph of $y = 4 \\cdot 3^x$ crosses the $y$-axis at 3. What is wrong?",
        options: [{ t: "At $x = 0$, $3^0 = 1$, so $y = 4$. The intercept is $a$." },
                  { t: "It crosses at 12.", fb: "12 is the height at $x = 1$. The $y$-axis is where $x = 0$." },
                  { t: "Nothing. It crosses at 3.", fb: "Put $x = 0$ into the rule: $4 \\cdot 3^0$." }],
        answer: 0, skill: "Exponential graphs", hints: ["Step 1: put $x = 0$ into the rule."],
        why: "$4 \\cdot 3^0 = 4 \\cdot 1 = 4$. The curve crosses at $(0, 4)$." },
      { type: "choice", kicker: "Use it", prompt: "How does the graph of $y = 6 \\cdot 2^x$ compare with $y = 3 \\cdot 2^x$?",
        options: [{ t: "It is twice as high at every $x$." }, { t: "It grows twice as fast: its factor is doubled.", fb: "Both have growth factor 2. Only the starting value differs." }, { t: "It is 3 units higher everywhere.", fb: "At $x = 0$ the gap is 3, but at $x = 1$ it is $12 - 6 = 6$. The gap keeps growing." }],
        answer: 0, skill: "Exponential graphs", hints: ["Compare the two at $x = 0$, 1 and 2."], why: "$6 \\cdot 2^x = 2(3 \\cdot 2^x)$: the same shape, stretched to twice the height." }
    ]
  });

  /* ============================================ 5.8 · Exponential situations as functions */
  var HOW_5_8 = [["Read", "Find $a$ and $b$ in the rule, and say what each one means."], ["Evaluate", "Put the input in for $t$."], ["Meaning", "Say the result as a sentence about the situation."], ["Domain", "Ask which inputs make sense."]];
  LESSONS.push({
    title: "Exponential situations as functions",
    blurb: "Book 5.8 · The same exponential, as a sentence, a table, a graph and f(t).",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is $100 \\cdot 2^2$?",
        answer: 400, skill: "Exponential functions",
        near: [{ v: 200, fb: "$2^2$ is 4, not 2." }],
        hints: ["Do the power first: $2^2 = 4$."], why: "$100 \\cdot 4 = 400$." },
      { type: "learn", kicker: "The idea",
        prompt: "An exponential situation is a **function**: each time has exactly one amount. So function notation, tables, graphs and domain all work here as well.",
        scene: { type: "method", how: HOW_5_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "A nest holds $g(t) = 50 \\cdot 3^t$ ants after $t$ months. Watch the function read and used.",
        scene: { type: "walk", how: HOW_5_8, rows: [
          { step: 1, m: "a = 50, \\; b = 3", say: "The nest starts with 50 ants, and the number triples each month." },
          { step: 2, m: "g(2) = 50 \\cdot 3^2 = 450", say: "Put 2 in for $t$.",
            ask: { prompt: "To find the number of ants after 2 months, what do we work out?", answer: 0,
                   options: [{ t: "$g(2)$" }, { t: "$g(t) = 2$", fb: "That asks when there are 2 ants. Here 2 is the input: a number of months." }] } },
          { step: 3, m: "g(2) = 450", say: "After 2 months there are 450 ants." },
          { step: 4, m: "t \\ge 0", say: "The count starts at $t = 0$, so the domain begins there." }] },
        gate: true,
        then: "Everything you know about functions applies to exponential situations." },
      { type: "guided", kicker: "Together",
        prompt: "$h(t) = 20 \\cdot 2^t$ is the number of times a video has been shared, $t$ hours after it was posted.",
        how: HOW_5_8, skill: "Exponential functions",
        steps: [
          { step: 1, ask: "What does the 20 mean?", type: "choice", answer: 0,
            options: [{ t: "It starts with 20 shares" }, { t: "It doubles 20 times", fb: "The doubling comes from the 2. The 20 is the value at $t = 0$." }],
            m: "a = 20, \\; b = 2", say: "20 shares to start, doubling every hour." },
          { step: 2, ask: "Find $h(4)$.", type: "num", answer: 320,
            near: [{ v: 160, fb: "$2^4$ is 16, not 8." }], hint: "$2^4 = 16$.", m: "h(4) = 20 \\cdot 2^4 = 320", say: "$20 \\cdot 16$." },
          { step: 3, ask: "What does $h(4) = 320$ mean?", type: "choice", answer: 0,
            options: [{ t: "After 4 hours there are 320 shares" }, { t: "After 320 hours there are 4 shares", fb: "The input, 4, is the time. The output, 320, is the number of shares." }],
            m: "h(4) = 320", say: "Input: hours. Output: shares." },
          { step: 4, ask: "Which inputs make sense?", type: "choice", answer: 0,
            options: [{ t: "$t \\ge 0$" }, { t: "Every number", fb: "Before it was posted there was nothing to share." }, { t: "$t \\le 0$", fb: "Those are times before the video was posted." }],
            m: "t \\ge 0", say: "From the moment it was posted." }],
        why: "Read, evaluate, meaning, domain. Now use the fruit-fly function." },
      { type: "num", kicker: "On your own", prompt: "$f(t) = 100 \\cdot 2^t$ gives the number of fruit flies in a jar after $t$ weeks. Find $f(3)$.", pre: "$f(3) =$", answer: 800, skill: "Exponential functions",
        near: [{ v: 600, fb: "$2^3$ is $2 \\cdot 2 \\cdot 2 = 8$, not 6." }, { v: 8000000, fb: "Work out $2^3$ first, then multiply by 100." }],
        hints: ["$2^3 = 8$."], why: "$100 \\cdot 2^3 = 100 \\cdot 8 = 800$." },
      { type: "choice", prompt: "What does $f(0) = 100$ mean?",
        options: [{ t: "The jar starts with 100 flies." }, { t: "After 100 weeks there are no flies.", fb: "The input is inside the brackets: 0 weeks. The output is 100 flies." }, { t: "The flies increase by 100 a week.", fb: "They double each week. 100 is the starting count." }],
        answer: 0, skill: "Exponential functions", hints: ["Input 0 weeks, output 100 flies."], why: "At $t = 0$: $100 \\cdot 2^0 = 100$, the initial value." },
      { type: "table", prompt: "Fill in the table for $f(t) = 100 \\cdot 2^t$.", head: ["$t$ (weeks)", "$f(t)$"], rows: [[0, 100], [1, null], [2, null], [4, null]],
        answers: [[1, 1, 200], [2, 1, 400], [3, 1, 1600]], skill: "Exponential functions", hints: ["Each week doubles. For week 4, double twice from week 2."], why: "200, 400, then $100 \\cdot 16 = 1600$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The other direction: you know the **amount** and want the **time**. For $f(t) = 100 \\cdot 2^t$, when are there 1600 flies?",
        scene: { type: "walk", how: HOW_5_8, rows: [
          { step: 1, m: "a = 100, \\; b = 2", say: "100 flies to start, doubling each week." },
          { step: 2, m: "f(t) = 1600", say: "This time the **output** is given. We are looking for the input." },
          { step: 2, m: "100, \\; 200, \\; 400, \\; 800, \\; 1600", say: "Count the doublings from 100." },
          { step: 3, m: "t = 4", say: "Four doublings: after 4 weeks there are 1600 flies." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Read the graph of $f$: for which $t$ is $f(t) = 400$?",
        scene: graph([0, 4], [0, 900], [{ f: function (x) { return 100 * Math.pow(2, x); }, color: "blue" }], { gridY: 100, labelEveryY: 200, hline: [400], axisLabels: ["t", "flies"], aspect: 0.8 }),
        pre: "$t =$", answer: 2, skill: "Exponential functions", hints: ["Where does the curve meet the red line?"], why: "$f(2) = 100 \\cdot 4 = 400$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran reads $f(0) = 100$ as: “After 100 weeks there are no flies.” What is wrong?",
        options: [{ t: "He swapped them. The input is 0 weeks and the output is 100 flies." },
                  { t: "$f(0)$ is 0, because of the zero.", fb: "$f(0) = 100 \\cdot 2^0 = 100$." },
                  { t: "Nothing. That is what it says.", fb: "The number in the brackets is the time." }],
        answer: 0, skill: "Exponential functions", hints: ["Which number is inside the brackets?"],
        why: "$f(0) = 100$: at week 0, the start, there are 100 flies." },
      { type: "choice", kicker: "Use it", prompt: "The jar was set up at $t = 0$. What is a sensible **domain** for $f$?",
        options: [{ t: "$t \\ge 0$" }, { t: "All real numbers", fb: "Before $t = 0$ there was no jar. In this situation negative times mean nothing." }, { t: "$t \\ge 100$", fb: "100 is an output: the number of flies. The domain is about time." }],
        answer: 0, skill: "Exponential functions", hints: ["Which times make sense here?"], why: "Time starts when the jar is set up: $t \\ge 0$. (And in real life, growth can't continue for ever.)" }
    ]
  });

  /* ============================================ 5.9 · Interpreting exponential functions */
  var HOW_5_9 = [["Neighbours", "Find the values at the whole numbers on either side."], ["Between", "The value lies between those two. It is not the halfway number: the curve bends."], ["Read", "Read the value from the graph."]];
  LESSONS.push({
    title: "Interpreting exponential functions",
    blurb: "Book 5.9 · Evaluate, read from the graph, and choose a window that shows what matters.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$m(t) = 80 \\cdot \\left(\\frac{1}{2}\\right)^t$ is the milligrams of caffeine in your body $t$ half-lives after a coffee. Find $m(3)$.", pre: "$m(3) =$", post: "mg", answer: 10, skill: "Evaluate an exponential",
        near: [{ v: 120, fb: "$\\left(\\frac{1}{2}\\right)^3$ is $\\frac{1}{8}$, not $\\frac{3}{2}$." }, { v: 40, fb: "That's one halving. $t = 3$ means three." }],
        hints: ["Halve 80 three times."], why: "$80 \\to 40 \\to 20 \\to 10$." },
      { type: "learn", kicker: "Explore", prompt: "Slide $t$ along the graph of $m$. **When is 20 mg left?**",
        scene: { type: "plane", x: [0, 6], y: [0, 90], gridY: 10, labelEveryY: 20, aspect: 0.8, gate: true, hline: [20],
          params: { t: { v: 0, min: 0, max: 5, step: 0.5, label: "$t$" } }, fns: [{ f: med, color: "orange" }],
          marks: [{ x: function (P) { return P.t; }, y: function (P) { return med(P.t); }, color: "blue", r: 7 }],
          readout: function (st) { var t = st.params.t; return "$m(" + nm(t) + ") = " + nm(Math.round(med(t) * 10) / 10) + "$ mg" + (t === 2 ? " ✓" : ""); },
          goal: function (st) { return st.params.t === 2; } },
        gate: true,
        then: "$m(2) = 20$. Notice $t = 0.5$ and $t = 1.5$ work too: an exponential function is defined **between** the whole numbers, and its graph is a smooth curve." },
      { type: "learn", kicker: "The idea",
        prompt: "An exponential function works **between** the whole numbers too: half an hour, a step and a half. Its graph is a smooth curve, not a row of dots. So in-between values can be read from the graph.",
        scene: { type: "method", how: HOW_5_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "$m(t) = 80 \\cdot \\left(\\frac{1}{2}\\right)^t$ is the caffeine left, in milligrams, $t$ half-lives after a coffee. Watch $m(1.5)$ found.",
        scene: { type: "walk", how: HOW_5_9, rows: [
          { step: 1, m: "m(1) = 40, \\; m(2) = 20", say: "The whole-number neighbours of 1.5." },
          { step: 2, m: "20 < m(1.5) < 40", say: "The value lies between them.",
            ask: { prompt: "Halfway in time between 40 and 20. Is the value exactly 30?", answer: 0,
                   options: [{ t: "No. The curve bends, so it is a little under 30" }, { t: "Yes. Halfway is 30", fb: "That would be true on a straight line. This curve drops fastest at the start of each step." }] } },
          { step: 3, m: "m(1.5) \\approx 28", say: "Read from the graph: about 28 mg, not 30." }] },
        gate: true,
        then: "Between whole numbers the function still has a value. It is not the average of its neighbours." },
      { type: "guided", kicker: "Together",
        prompt: "$f(x) = 100 \\cdot 2^x$. Estimate $f(0.5)$.",
        how: HOW_5_9, skill: "Evaluate an exponential",
        steps: [
          { step: 1, ask: "$f(0) = 100$. What is $f(1)$?", type: "num", answer: 200, hint: "$100 \\cdot 2^1$.", m: "f(0) = 100, \\; f(1) = 200", say: "The neighbours of 0.5." },
          { step: 2, ask: "Where must $f(0.5)$ be?", type: "choice", answer: 0,
            options: [{ t: "Between 100 and 200" }, { t: "Below 100", fb: "The function is growing, so it has passed 100 already." }, { t: "Above 200", fb: "It does not reach 200 until $x = 1$." }],
            m: "100 < f(0.5) < 200", say: "Between its neighbours." },
          { step: 3, ask: "The graph gives the value. Which is it closest to?", type: "choice", answer: 0,
            options: [{ t: "About 141" }, { t: "Exactly 150", fb: "150 would be halfway on a straight line. This curve bends upward, so the value is lower." }, { t: "About 175", fb: "A growth curve stays below the straight line joining its neighbours." }],
            m: "f(0.5) \\approx 141", say: "A little under halfway." }],
        why: "Neighbours, between, read. Now read one from the caffeine graph." },
      { type: "choice", kicker: "On your own", prompt: "For $m(t) = 80 \\cdot \\left(\\frac{1}{2}\\right)^t$, what is $m(0.5)$ closest to?",
        scene: graph([0, 6], [0, 90], [{ f: med, color: "orange" }], { gridY: 10, labelEveryY: 20, aspect: 0.8 }),
        options: [{ t: "About 57 mg" }, { t: "Exactly 60 mg", fb: "60 is halfway between 80 and 40, but the graph curves below the straight line between them." }, { t: "About 40 mg", fb: "40 is $m(1)$. Halfway to it, there is more than 40 left." }],
        answer: 0, skill: "Evaluate an exponential", hints: ["Read the height of the curve above $t = 0.5$."], why: "$80 \\cdot \\left(\\frac{1}{2}\\right)^{0.5} = \\frac{80}{\\sqrt{2}} \\approx 56.6$. The curve sags below the halfway point of 60." },
      { type: "learn", kicker: "A harder case",
        prompt: "To graph an exponential you must choose a window that shows it. Watch one chosen for $y = 200 \\cdot 3^x$, from $x = 0$ to $x = 4$.",
        scene: { type: "walk", how: HOW_5_9, rows: [
          { step: 1, m: "200 \\quad\\text{and}\\quad 200 \\cdot 3^4 = 16200", say: "The values at the two ends of the interval." },
          { step: 2, m: "200 \\le y \\le 16200", say: "Every value in between lies in that range." },
          { step: 3, m: "0 \\le x \\le 4, \\quad 0 \\le y \\le 17000", say: "A window that reaches a little above the largest value. Too small, and the curve runs off the top." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "You want to graph $y = 1000 \\cdot (1.5)^x$ for $0 \\le x \\le 6$. It reaches about 11,400. Which window shows it well?",
        options: [{ t: "$x$ from 0 to 6, $y$ from 0 to 12,000" }, { t: "$x$ from 0 to 6, $y$ from 0 to 10", fb: "The graph starts at 1,000. It would be far off the top of this window." }, { t: "$x$ from $-10$ to 10, $y$ from $-10$ to 10", fb: "The standard window misses it completely: the smallest value in range is 1,000." }],
        answer: 0, skill: "Graphing window", hints: ["The window must contain the smallest and largest outputs you care about."], why: "Outputs run from 1,000 to about 11,400, so the vertical axis needs to reach about 12,000." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says: “$m(0.5)$ makes no sense. You can't have half a half-life.” What is wrong?",
        options: [{ t: "The function is defined between whole numbers. Its graph is a smooth curve." },
                  { t: "$m(0.5)$ is the same as $m(0)$.", fb: "Some caffeine has gone by then. The value is lower than at the start." },
                  { t: "Nothing. Only whole inputs work.", fb: "Time passes smoothly. Half-way through a half-life is a real moment." }],
        answer: 0, skill: "Evaluate an exponential", hints: ["Does the graph have gaps between the whole numbers?"],
        why: "Time does not jump. At $t = 0.5$ about 57 mg is left." },
      { type: "choice", kicker: "Use it", prompt: "A graph of a town's population passes through $(0, 5000)$ and $(1, 5500)$ and is exponential. What is the growth factor, and what does it mean?",
        options: [{ t: "1.1: the population grows 10% each year." }, { t: "500: it gains 500 people each year.", fb: "That would be linear. For an exponential, divide: $5500 \\div 5000$." }, { t: "0.1: it grows by a tenth.", fb: "The growth *rate* is 0.1, but the factor is what you multiply by: 1.1." }],
        answer: 0, skill: "Evaluate an exponential", hints: ["Factor = next value ÷ this value."], why: "$5500 \\div 5000 = 1.1$. Multiplying by 1.1 is a 10% increase." }
    ]
  });

  /* ============================================ 5.10 · Looking at rates of change */
  var HOW_5_10 = [["Two values", "Find the outputs at the two ends of the interval."], ["Change", "Subtract the outputs: end minus start."], ["Length", "Subtract the inputs: end minus start."], ["Divide", "Change in output over change in input."]];
  LESSONS.push({
    title: "Looking at rates of change",
    blurb: "Book 5.10 · A line has one slope. An exponential's average rate of change keeps changing.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A line passes through $(0, 1)$ and $(2, 7)$. What is its slope?",
        answer: 3, skill: "Rate of change of an exponential",
        near: [{ v: 6, fb: "6 is the rise. Divide it by the run, 2." }],
        hints: ["Rise $7 - 1$, run $2 - 0$."], why: "$\\frac{7 - 1}{2 - 0} = 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "A line has one slope. An exponential does not: its **average rate of change** depends on where you measure it. For growth it keeps getting larger. For decay it shrinks toward zero.",
        scene: { type: "method", how: HOW_5_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the average rate of change of $f(x) = 2^x$ found, from $x = 1$ to $x = 3$.",
        scene: { type: "walk", how: HOW_5_10, rows: [
          { step: 1, m: "f(1) = 2, \\; f(3) = 8", say: "The outputs at the two ends." },
          { step: 2, m: "8 - 2 = 6", say: "The output rose by 6." },
          { step: 3, m: "3 - 1 = 2", say: "Over an interval of length 2." },
          { step: 4, m: "\\frac{6}{2} = 3", say: "On average, 3 for each 1 of $x$.",
            ask: { prompt: "The change in output is 6 and the change in input is 2. Which goes on top?", answer: 0,
                   options: [{ t: "The change in output, 6" }, { t: "The change in input, 2", fb: "A rate of change is output per input: the output change goes on top." }] } }] },
        gate: true,
        then: "The same four steps as for any function. What changes is the answer, from one interval to the next." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the average rate of change of $f(x) = 3^x$ from $x = 0$ to $x = 2$.",
        how: HOW_5_10, skill: "Rate of change of an exponential",
        steps: [
          { step: 1, ask: "$f(0) = 1$. What is $f(2)$?", type: "num", answer: 9, near: [{ v: 6, fb: "$3^2$ is $3 \\cdot 3$." }], hint: "$3 \\cdot 3$.", m: "f(0) = 1, \\; f(2) = 9", say: "The two ends." },
          { step: 2, ask: "Change in output?", type: "num", answer: 8, hint: "$9 - 1$.", m: "9 - 1 = 8", say: "End minus start." },
          { step: 3, ask: "Change in input?", type: "num", answer: 2, hint: "$2 - 0$.", m: "2 - 0 = 2", say: "End minus start." },
          { step: 4, ask: "Average rate of change?", type: "num", answer: 4, hint: "$8 \\div 2$.", m: "\\frac{8}{2} = 4", say: "On average, 4 for each 1 of $x$." }],
        why: "Two values, change, length, divide. Now compare two intervals of the same curve." },
      { type: "num", kicker: "On your own", prompt: "For $f(x) = 2^x$, find the average rate of change from $x = 0$ to $x = 2$." + tbl(["$x$", "0", "1", "2", "3", "4"], [["f(x)", 1, 2, 4, 8, 16]]), answer: 1.5, skill: "Rate of change of an exponential",
        near: [{ v: 3, fb: "That's the change in output. Divide by the change in input, 2." }, { v: 2, fb: "$\\frac{f(2) - f(0)}{2 - 0} = \\frac{4 - 1}{2}$." }],
        hints: ["$\\frac{f(2) - f(0)}{2 - 0}$."], why: "$\\frac{4 - 1}{2} = 1.5$." },
      { type: "num", prompt: "Same function, same width of interval, further along: from $x = 2$ to $x = 4$.", answer: 6, skill: "Rate of change of an exponential",
        near: [{ v: 12, fb: "Divide by the width of the interval, 2." }, { v: 1.5, fb: "That was the first interval. Use $f(4) = 16$ and $f(2) = 4$." }],
        hints: ["$\\frac{16 - 4}{4 - 2}$."], why: "$\\frac{12}{2} = 6$: four times the rate on the first interval." },
      { type: "learn", kicker: "Explore", prompt: "Slide the interval along the curve and watch the slope of the orange line.",
        scene: { type: "plane", x: [0, 5], y: [0, 34], labelEveryY: 4, aspect: 1, gate: true,
          params: { a: { v: 0, min: 0, max: 3, step: 1, label: "interval starts at" } }, fns: [{ f: pow2, color: "blue" }],
          marks: function (st) { var a = st.params.a; return [{ x: a, y: pow2(a), color: "orange", r: 6 }, { x: a + 2, y: pow2(a + 2), color: "orange", r: 6 }]; },
          segs: function (st) { var a = st.params.a; return [[a, pow2(a), a + 2, pow2(a + 2), "orange"]]; },
          readout: function (st) { var a = st.params.a; return "From $x = " + a + "$ to $x = " + (a + 2) + "$: average rate of change $= " + nm((pow2(a + 2) - pow2(a)) / 2) + "$"; } },
        gate: true,
        then: "1.5, 3, 6, 12: the average rate of change itself **doubles** each time the interval moves one step right. A growing exponential gets steeper without end." },
      { type: "learn", kicker: "A harder case",
        prompt: "For decay the rate is negative, and it fades. $g(x) = 64 \\cdot \\left(\\frac{1}{2}\\right)^x$ gives $g(2) = 16$ and $g(4) = 4$.",
        scene: { type: "walk", how: HOW_5_10, rows: [
          { step: 1, m: "g(2) = 16, \\; g(4) = 4", say: "The two ends." },
          { step: 2, m: "4 - 16 = -12", say: "It fell, so the change is negative." },
          { step: 3, m: "4 - 2 = 2", say: "Over an interval of length 2." },
          { step: 4, m: "\\frac{-12}{2} = -6", say: "On average it drops 6 for each 1 of $x$ here. Earlier on, it dropped faster." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Decay: $g(x) = 64 \\cdot \\left(\\frac{1}{2}\\right)^x$ gives $g(0) = 64$, $g(2) = 16$, $g(4) = 4$. Find the average rate of change from $x = 0$ to $x = 2$.", answer: -24, skill: "Rate of change of an exponential",
        near: [{ v: 24, fb: "The function is falling, so the rate is negative." }, { v: -48, fb: "Divide by the width of the interval, 2." }],
        hints: ["$\\frac{16 - 64}{2 - 0}$."], why: "$\\frac{16 - 64}{2} = -24$." },
      { type: "choice", kicker: "Find the error",
        prompt: "From $x = 0$ to $x = 2$, $f(x) = 2^x$ has an average rate of change of 1.5. Kiran says: “So it rises 1.5 for each step, everywhere.” What is wrong?",
        options: [{ t: "Only a line has the same rate everywhere. From $x = 2$ to $x = 4$ the rate is 6." },
                  { t: "The rate from 0 to 2 is 3, not 1.5.", fb: "$\\frac{4 - 1}{2 - 0}$ is 1.5. That part is right." },
                  { t: "Nothing. The rate is always 1.5.", fb: "Try the next interval: $f(2) = 4$ and $f(4) = 16$." }],
        answer: 0, skill: "Rate of change of an exponential", hints: ["Work out the rate from $x = 2$ to $x = 4$."],
        why: "$\\frac{16 - 4}{4 - 2} = 6$. On an exponential, the average rate of change keeps changing." },
      { type: "choice", kicker: "Use it", prompt: "From $x = 2$ to $x = 4$ the average rate of change of $g$ is $-6$. A cup of tea cools like $g$. What does that tell you?",
        options: [{ t: "It cools quickly at first, then more slowly." }, { t: "It cools at a steady rate.", fb: "The rates are $-24$ and then $-6$: not steady." }, { t: "It cools slowly at first, then faster.", fb: "The first rate, $-24$, is the bigger drop." }],
        answer: 0, skill: "Rate of change of an exponential", hints: ["Compare $-24$ with $-6$."], why: "The drop per step shrinks from 24 to 6. Exponential decay slows down as it goes." }
    ]
  });
  var BOUNCE = [[0, 20], [1, 9.8], [2, 5.2], [3, 2.4], [4, 1.3]];

  /* ============================================ 5.11 · Modeling exponential behavior */
  var HOW_5_11 = [["Ratios", "Divide each measurement by the one before."], ["Choose", "Roughly equal ratios: an exponential model fits. Roughly equal differences: a linear one."], ["Write", "Use the first value as $a$ and the typical ratio as $b$: $y = a \\cdot b^x$."], ["Predict", "Use the model, and expect small misses."]];
  LESSONS.push({
    title: "Modeling exponential behavior",
    blurb: "Book 5.11 · Real data isn't exact. Decide which kind of model fits, then fit it.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A sequence goes $200, 100, 50$. What is each term divided by the one before? (A fraction or a decimal is fine.)",
        answer: 0.5, skill: "Choose a model",
        near: [{ v: 2, fb: "That is the earlier term divided by the later one. Divide the later by the earlier: $100 \\div 200$." }],
        hints: ["$100 \\div 200$."], why: "$100 \\div 200 = \\frac{1}{2}$ and $50 \\div 100 = \\frac{1}{2}$." },
      { type: "learn", kicker: "The idea",
        prompt: "Real measurements are never exact. A **model** is a function that captures how the data behaves without hitting every point. First decide which kind of model fits. Then write it.",
        scene: { type: "method", how: HOW_5_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "A ball is dropped from 200 cm. Its next bounce heights are **98**, **52** and **24** cm. Watch a model built.",
        scene: { type: "walk", how: HOW_5_11, rows: [
          { step: 1, m: "\\frac{98}{200} = 0.49, \\quad \\frac{52}{98} \\approx 0.53, \\quad \\frac{24}{52} \\approx 0.46", say: "Each bounce is about half the one before." },
          { step: 2, m: "\\text{exponential}", say: "The ratios are roughly equal. The differences, 102, 46 and 28, are not.",
            ask: { prompt: "The ratios are 0.49, 0.53 and 0.46. Are they “equal enough”?", answer: 0,
                   options: [{ t: "Yes. Real data wobbles a little" }, { t: "No. They must match exactly", fb: "Measurements always carry small errors. Roughly equal ratios are what an exponential pattern looks like in real data." }] } },
          { step: 3, m: "h(n) = 200 \\cdot (0.5)^n", say: "Start at 200, and use 0.5 as the typical ratio." },
          { step: 4, m: "h(3) = 200 \\cdot 0.125 = 25", say: "The model predicts 25 cm for bounce 3. The measurement was 24: a small miss." }] },
        gate: true,
        then: "A model does not hit every measurement. It captures how they behave." },
      { type: "learn", kicker: "Explore", prompt: "The dots are the measured heights, in tens of cm. Slide $b$ until $y = 20 \\cdot b^x$ runs through them.",
        scene: { type: "plane", x: [-0.5, 5], y: [0, 22], gate: true, labelEveryY: 2, params: { b: { v: 0.9, min: 0.3, max: 0.9, step: 0.1, label: "$b$" } },
          fns: [{ f: function (x, p) { return 20 * Math.pow(p.b, x); }, color: "blue" }], marks: BOUNCE.map(function (p) { return { x: p[0], y: p[1], color: "orange", r: 6 }; }),
          readout: function (st) { var b = st.params.b; return "$y = 20 \\cdot " + nm(b) + "^x$" + (Math.abs(b - 0.5) < 1e-9 ? " ✓ a good fit" : ""); },
          goal: function (st) { return Math.abs(st.params.b - 0.5) < 1e-9; } },
        gate: true,
        then: "$h(n) = 200 \\cdot (0.5)^n$ is a **model**: it doesn't hit every measurement, but it captures how the bounces behave." },
      { type: "guided", kicker: "Together",
        prompt: "The fish in a pond are counted each year: **500**, **452**, **405**, **366**. Build a model.",
        how: HOW_5_11, skill: "Choose a model",
        steps: [
          { step: 1, ask: "$452 \\div 500 \\approx 0.90$, $405 \\div 452 \\approx 0.90$ and $366 \\div 405 \\approx 0.90$. What do you notice?", type: "choice", answer: 0,
            options: [{ t: "The ratios are all about 0.9" }, { t: "The ratios keep falling", fb: "They are all close to 0.90." }],
            m: "0.90, \\; 0.90, \\; 0.90", say: "Each year about 90 percent of the fish remain." },
          { step: 2, ask: "Which kind of model fits?", type: "choice", answer: 0,
            options: [{ t: "Exponential" }, { t: "Linear", fb: "The differences are 48, 47 and 39: not steady. The ratios are." }],
            m: "\\text{exponential}", say: "Equal ratios." },
          { step: 3, ask: "Which model?", type: "choice", answer: 0,
            options: [{ t: "$F(t) = 500 \\cdot (0.9)^t$" }, { t: "$F(t) = 0.9 \\cdot 500^t$", fb: "The factor, 0.9, carries the exponent. 500 is the start." }, { t: "$F(t) = 500 - 0.9t$", fb: "That subtracts the same amount each year. The data multiplies." }],
            m: "F(t) = 500 \\cdot (0.9)^t", say: "Start times ratio to the power of the years." },
          { step: 4, ask: "Predict year 2: what is $500 \\cdot 0.81$?", type: "num", answer: 405, hint: "$(0.9)^2 = 0.81$.", m: "F(2) = 500 \\cdot (0.9)^2 = 405", say: "The count in year 2 was 405. The model fits." }],
        why: "Ratios, choose, write, predict. Now use the bounce model yourself." },
      { type: "num", kicker: "On your own", prompt: "Use the model $h(n) = 200 \\cdot (0.5)^n$ to predict the height of bounce 5, in cm.", post: "cm", answer: 6.25, skill: "Use an exponential model",
        near: [{ v: 12.5, fb: "That's bounce 4. Halve once more." }, { v: 500, fb: "$(0.5)^5$ is $\\frac{1}{32}$, not 2.5." }],
        hints: ["Halve 200 five times."], why: "$200 \\to 100 \\to 50 \\to 25 \\to 12.5 \\to 6.25$." },
      { type: "sort", prompt: "Which kind of model suits each table?",
        bins: ["Linear", "Exponential"],
        cards: [{ t: "$y$: 5, 10, 20, 40", bin: 1, fb: "Each value is double the last." }, { t: "$y$: 5, 10, 15, 20", bin: 0, fb: "Each value is 5 more than the last." },
                { t: "$y$: 81, 27, 9, 3", bin: 1, fb: "Each is a third of the last." }, { t: "$y$: 81, 71, 61, 51", bin: 0, fb: "Each is 10 less than the last." }, { t: "$y$: 2.0, 3.1, 4.4, 6.8", bin: 1, fb: "The ratios are all about 1.5. The differences keep growing." }],
        skill: "Choose a model", hints: ["Roughly equal differences: linear. Roughly equal ratios: exponential."], why: "Test the differences and the ratios. Real data will only be close." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes a line fits better. A plant's height, in centimetres, each week: **20**, **26**, **31**, **37**.",
        scene: { type: "walk", how: HOW_5_11, rows: [
          { step: 1, m: "1.3, \\; 1.19, \\; 1.19", say: "The ratios drift downward." },
          { step: 2, m: "6, \\; 5, \\; 6", say: "But the **differences** are almost equal. A linear model fits better." },
          { step: 3, m: "y = 6x + 20", say: "For a linear model: the start, plus about 6 for each week." },
          { step: 4, m: "6(4) + 20 = 44", say: "The model predicts about 44 cm in week 4." }] },
        gate: true },
      { type: "choice", kicker: "Try it",
        prompt: "A candle's height in centimetres, measured each hour: **30**, **27**, **24**, **21**. Which model fits?",
        options: [{ t: "Linear: it loses about 3 cm each hour" },
                  { t: "Exponential: each height is about 0.9 times the last", fb: "The ratios are 0.90, 0.89 and 0.875: they drift. The differences are all exactly 3." },
                  { t: "Neither", fb: "Check the differences: $27 - 30$, $24 - 27$, $21 - 24$." }],
        answer: 0, skill: "Choose a model", hints: ["Step 2: are the differences equal, or the ratios?"],
        why: "Every difference is $-3$. Equal differences: a linear model, $y = 30 - 3x$." },
      { type: "choice", kicker: "Find the error",
        prompt: "The bounce model predicts 25 cm for bounce 3. The measurement was 24 cm. Kiran says: “So the model is wrong.” What is wrong with that?",
        options: [{ t: "A small miss is normal for real data. The model captures the pattern well." },
                  { t: "The measurement must be wrong.", fb: "Measurements wobble, but nothing says this one is at fault." },
                  { t: "Nothing. A model has to match exactly.", fb: "No model of real measurements matches every point." }],
        answer: 0, skill: "Use an exponential model", hints: ["How big is the miss, compared with the heights?"],
        why: "1 cm out of 24 is a small miss. A model is judged by whether it follows the behaviour of the data." },
      { type: "num", kicker: "Use it", prompt: "A lake has 1,000 fish, and the number falls by about 10% a year: $F(t) = 1000 \\cdot (0.9)^t$. About how many after **2 years**?", answer: 810, skill: "Use an exponential model",
        near: [{ v: 800, fb: "It doesn't lose 100 each year. The second year it loses 10% of 900." }, { v: 900, fb: "That's after 1 year." }],
        hints: ["Year 1: 900. Year 2: 90% of 900."], why: "$1000 \\cdot 0.9 \\cdot 0.9 = 810$." }
    ]
  });

  /* ============================================ 5.12 · Reasoning about exponential graphs, part 1 */
  var HOW_5_12 = [["Start", "Read the height at $x = 0$. That is $a$."], ["One step", "Read the height at $x = 1$."], ["Divide", "Divide the height at 1 by the height at 0. That is $b$."], ["Compare", "The smaller $b$ is, the faster the curve falls."]];
  LESSONS.push({
    title: "Reasoning about exponential graphs, part 1",
    blurb: "Book 5.12 · Same start, different factors. Read b from the graph.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "$y = 8 \\cdot \\left(\\frac{1}{2}\\right)^x$. What is $y$ when $x = 1$?",
        answer: 4, skill: "Graphs of exponential decay",
        near: [{ v: 8, fb: "That is the height at $x = 0$. At $x = 1$, multiply by $\\frac{1}{2}$ once." }],
        hints: ["$8 \\cdot \\frac{1}{2}$."], why: "$8 \\cdot \\frac{1}{2} = 4$." },
      { type: "learn", kicker: "Explore", prompt: "Slide $b$ from 0.1 up to 0.9. All the curves start at the same place. **What changes?**",
        scene: { type: "plane", x: [-0.5, 6], y: [0, 9], gate: true, params: { b: { v: 0.5, min: 0.1, max: 0.9, step: 0.1, label: "$b$" } },
          fns: [{ f: function (x, p) { return 8 * Math.pow(p.b, x); }, color: "blue" }], marks: [{ x: 1, y: function (P) { return 8 * P.b; }, color: "orange", r: 6, label: function (P) { return "(1, " + nm(r2(8 * P.b)) + ")"; } }],
          readout: function (st) { return "$y = 8 \\cdot " + nm(st.params.b) + "^x$: after one step, $8 \\times " + nm(st.params.b) + " = " + nm(r2(8 * st.params.b)) + "$"; } },
        gate: true,
        then: "Every curve starts at $(0, 8)$. The point at $x = 1$ is at height $8b$, so it shows the factor directly. The closer $b$ is to 0, the faster the fall. The closer to 1, the flatter." },
      { type: "learn", kicker: "The idea",
        prompt: "Curves that start at the same height can fall at different speeds. The factor $b$ sets the speed. You can read it from a graph: compare the height at $x = 1$ with the height at $x = 0$.",
        scene: { type: "method", how: HOW_5_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "A decay graph passes through $(0, 10)$ and $(1, 4)$. Watch its factor read.",
        scene: { type: "walk", how: HOW_5_12, rows: [
          { step: 1, m: "a = 10", say: "The curve starts at height 10." },
          { step: 2, m: "(1, 4)", say: "One step later it is at height 4." },
          { step: 3, m: "b = \\frac{4}{10} = 0.4", say: "After one step, 40 percent is left.",
            ask: { prompt: "The height goes from 10 to 4 in one step. How do we find $b$?", answer: 0,
                   options: [{ t: "Divide 4 by 10" }, { t: "Subtract: $10 - 4$", fb: "Subtracting gives the amount lost. The factor is what the height was **multiplied** by." }] } },
          { step: 4, m: "y = 10 \\cdot (0.4)^x", say: "A small $b$: this curve falls fast." }] },
        gate: true,
        then: "The point at $x = 1$ shows the factor directly: its height is $a \\cdot b$." },
      { type: "guided", kicker: "Together",
        prompt: "Another decay graph passes through $(0, 12)$ and $(1, 9)$. Read its factor.",
        how: HOW_5_12, skill: "Graphs of exponential decay",
        steps: [
          { step: 1, ask: "What is $a$?", type: "num", answer: 12, hint: "The height at $x = 0$.", m: "a = 12", say: "The start." },
          { step: 2, ask: "What is the height at $x = 1$?", type: "num", answer: 9, hint: "Read the second point.", m: "(1, 9)", say: "One step later." },
          { step: 3, ask: "What is $b$? Divide 9 by 12.", type: "num", answer: 0.75,
            near: [{ v: 3, fb: "3 is the amount lost. Divide 9 by 12 to get the factor." }], hint: "$\\frac{9}{12} = \\frac{3}{4}$.", m: "b = \\frac{9}{12} = 0.75", say: "Three-quarters is left after each step." },
          { step: 4, ask: "A second curve has $b = 0.3$. Which of the two falls faster?", type: "choice", answer: 0,
            options: [{ t: "The one with $b = 0.3$" }, { t: "The one with $b = 0.75$", fb: "0.75 keeps three-quarters each step. 0.3 keeps less, so it falls faster." }],
            m: "0.3 < 0.75", say: "The smaller factor falls faster." }],
        why: "Start, one step, divide, compare. Now read a factor on your own." },
      { type: "num", kicker: "On your own", prompt: "A decay graph passes through $(0, 6)$ and $(1, 3)$. What is $b$?", answer: 0.5, skill: "Graphs of exponential decay",
        near: [{ v: 3, fb: "That's the difference. The factor is the ratio: $3 \\div 6$." }, { v: 2, fb: "Divide the *later* value by the earlier one: $3 \\div 6$." }],
        hints: ["Height at $x = 1$ divided by height at $x = 0$."], why: "$b = 3 \\div 6 = \\frac{1}{2}$, so $y = 6 \\cdot \\left(\\frac{1}{2}\\right)^x$." },
      { type: "choice", prompt: "All three curves are $y = 8 \\cdot b^x$ with a different $b$. Which has the **smallest** $b$?",
        scene: graph([-0.5, 6], [0, 9], [{ f: function (x) { return 8 * Math.pow(0.75, x); }, color: "green", label: "green", labelAt: 4.5 }, { f: function (x) { return 8 * Math.pow(0.5, x); }, color: "blue", label: "blue", labelAt: 1.6 }, { f: function (x) { return 8 * Math.pow(0.25, x); }, color: "orange", label: "orange", labelAt: 0.75 }]),
        options: [{ t: "Orange" }, { t: "Blue", fb: "Blue falls, but orange falls faster." }, { t: "Green", fb: "Green falls most slowly: it keeps the most each step, so its $b$ is the largest." }],
        answer: 0, keep: true, skill: "Graphs of exponential decay", hints: ["A smaller factor leaves less each step."], why: "Orange drops fastest: it keeps only a quarter each step. $b = 0.25$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Compare two rules without a graph. Two phones lose charge: $A(t) = 80 \\cdot (0.9)^t$ and $B(t) = 80 \\cdot (0.6)^t$.",
        scene: { type: "walk", how: HOW_5_12, rows: [
          { step: 1, m: "a = 80", say: "Both start at 80 percent." },
          { step: 2, m: "72 \\quad\\text{and}\\quad 48", say: "After one hour: $80 \\cdot 0.9 = 72$ and $80 \\cdot 0.6 = 48$." },
          { step: 3, m: "0.9 \\quad\\text{and}\\quad 0.6", say: "Phone A keeps 90 percent each hour. Phone B keeps only 60 percent." },
          { step: 4, m: "0.6 < 0.9", say: "The smaller factor drains faster: phone B." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Two medicines start at 100 mg. A is $100 \\cdot (0.7)^t$ and B is $100 \\cdot (0.4)^t$. Which leaves the body faster?",
        options: [{ t: "B: it keeps only 40% each hour." }, { t: "A: 0.7 is bigger.", fb: "A bigger factor means *more* remains each hour: A lasts longer." }, { t: "The same: both start at 100.", fb: "Same start, different factors. Their graphs separate at once." }],
        answer: 0, skill: "Graphs of exponential decay", hints: ["Which keeps less each hour?"], why: "After 1 hour: A has 70 mg, B has 40 mg. B's graph is lower." },
      { type: "slots", prompt: "Match each equation to its description.",
        slots: [{ id: "a", label: "Starts at 100, loses half each step" }, { id: "b", label: "Starts at 100, loses a tenth each step" }, { id: "c", label: "Starts at 50, keeps a tenth each step" }],
        cards: [{ t: "$y = 100 \\cdot (0.5)^x$", slot: "a", fb: "Losing half leaves a factor of 0.5." }, { t: "$y = 100 \\cdot (0.9)^x$", slot: "b", fb: "Losing a tenth leaves nine-tenths: 0.9." },
                { t: "$y = 50 \\cdot (0.1)^x$", slot: "c", fb: "Keeping a tenth is a factor of 0.1." }, { t: "$y = 100 \\cdot (0.1)^x$" }],
        skill: "Graphs of exponential decay", hints: ["The factor is the fraction that is *kept*."], why: "“Loses a tenth” keeps 0.9. “Keeps a tenth” is 0.1. They are very different." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $y = 8 \\cdot (0.9)^x$ falls **faster** than $y = 8 \\cdot (0.2)^x$, “because 0.9 is bigger”. What is wrong?",
        options: [{ t: "A bigger factor keeps more at each step, so that curve falls more slowly." },
                  { t: "They fall at the same speed, because both start at 8.", fb: "The start is the same. The factor sets the speed." },
                  { t: "Nothing. A bigger number means a faster fall.", fb: "After one step: $8 \\cdot 0.9 = 7.2$ and $8 \\cdot 0.2 = 1.6$. Which has dropped more?" }],
        answer: 0, skill: "Graphs of exponential decay", hints: ["Step 2: find each curve's height at $x = 1$."],
        why: "At $x = 1$ the heights are 7.2 and 1.6. The curve with $b = 0.2$ has fallen much further." },
      { type: "choice", kicker: "Use it", prompt: "Which equation could match this graph?",
        scene: graph([-0.5, 6], [0, 13], [{ f: function (x) { return 12 * Math.pow(1 / 3, x); }, color: "purple" }], { marks: [{ x: 0, y: 12, color: "orange" }, { x: 1, y: 4, color: "orange" }] }),
        options: [{ t: "$y = 12 \\cdot \\left(\\frac{1}{3}\\right)^x$" }, { t: "$y = 12 \\cdot 3^x$", fb: "That grows. This graph falls from 12 to 4." }, { t: "$y = 4 \\cdot \\left(\\frac{1}{3}\\right)^x$", fb: "The graph crosses the $y$-axis at 12, so $a = 12$." }],
        answer: 0, skill: "Graphs of exponential decay", hints: ["Intercept gives $a$. The next point gives $b$."], why: "$a = 12$ and $b = 4 \\div 12 = \\frac{1}{3}$." }
    ]
  });

  /* ============================================ 5.13 · Reasoning about exponential graphs, part 2 */
  var HOW_5_13 = [["Start", "The point at $x = 0$ gives $a$."], ["Steps", "Count how many steps of $x$ separate the two points."], ["Factor", "Divide the heights. One step apart: that is $b$. Two steps apart: that is $b^2$."], ["Write", "Write $f(x) = a \\cdot b^x$ and check the second point."]];
  LESSONS.push({
    title: "Reasoning about exponential graphs, part 2",
    blurb: "Book 5.13 · Write the function from two points, and compare two exponentials.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "An exponential graph passes through $(0, 5)$ and $(1, 15)$. What is $b$?",
        answer: 3, skill: "Write an exponential function",
        near: [{ v: 10, fb: "10 is the difference. The factor comes from dividing: $15 \\div 5$." }],
        hints: ["Divide the height at 1 by the height at 0."], why: "$15 \\div 5 = 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "Two points pin down an exponential function. The point on the $y$-axis gives the start. The other point gives the factor: directly if it is one step away, or as a power if it is several steps away.",
        scene: { type: "method", how: HOW_5_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "An exponential graph passes through $(0, 2)$ and $(1, 10)$. Watch its function written.",
        scene: { type: "walk", how: HOW_5_13, rows: [
          { step: 1, m: "a = 2", say: "The point on the $y$-axis gives the start." },
          { step: 2, m: "1 \\text{ step}", say: "From $x = 0$ to $x = 1$." },
          { step: 3, m: "b = \\frac{10}{2} = 5", say: "One step multiplied the height by 5.",
            ask: { prompt: "The height goes from 2 to 10 in one step. What is $b$?", answer: 0,
                   options: [{ t: "5" }, { t: "8", fb: "8 is the difference. The factor comes from dividing: $10 \\div 2$." }] } },
          { step: 4, m: "f(x) = 2 \\cdot 5^x", say: "Check: $f(1) = 2 \\cdot 5 = 10$ ✓." }] },
        gate: true,
        then: "Start from the $y$-axis, factor from the next point." },
      { type: "guided", kicker: "Together",
        prompt: "Another exponential graph passes through $(0, 3)$ and $(1, 12)$. Write its function.",
        how: HOW_5_13, skill: "Write an exponential function",
        steps: [
          { step: 1, ask: "What is $a$?", type: "num", answer: 3, hint: "The height at $x = 0$.", m: "a = 3", say: "The start." },
          { step: 2, ask: "How many steps of $x$ separate the two points?", type: "num", answer: 1, hint: "From $x = 0$ to $x = 1$.", m: "1 \\text{ step}", say: "One step." },
          { step: 3, ask: "What is $b$? Divide 12 by 3.", type: "num", answer: 4, near: [{ v: 9, fb: "9 is the difference. Divide instead." }], hint: "$12 \\div 3$.", m: "b = \\frac{12}{3} = 4", say: "The growth factor." },
          { step: 4, ask: "Which function is it?", type: "choice", answer: 0,
            options: [{ t: "$f(x) = 3 \\cdot 4^x$" }, { t: "$f(x) = 4 \\cdot 3^x$", fb: "The start is 3 and the factor is 4. They are swapped here." }, { t: "$f(x) = 3 + 4x$", fb: "That is linear. It gives 7 at $x = 1$, not 12." }],
            m: "f(x) = 3 \\cdot 4^x", say: "Check: $f(1) = 12$ ✓." }],
        why: "Start, steps, factor, write. Now fit a curve through two points by hand." },
      { type: "plane", kicker: "On your own", prompt: "Set $a$ and $b$ so the curve passes through both orange points.",
        x: [-1, 3], y: [0, 20], labelEveryY: 2, aspect: 1, params: { a: { v: 5, min: 1, max: 6, step: 1, label: "$a$" }, b: { v: 1.5, min: 1.5, max: 4, step: 0.5, label: "$b$" } },
        fns: [{ f: expo, color: "blue" }], marks: [{ x: 0, y: 2, color: "orange", r: 6 }, { x: 2, y: 18, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + st.params.a + " \\cdot " + nm(st.params.b) + "^x$"; },
        check: function (st) { var p = st.params; return p.a === 2 && p.b === 3 ? { ok: true } : { ok: false, say: p.a !== 2 ? "The curve must cross the $y$-axis at 2." : "From 2 to 18 in two steps: $b \\cdot b = 9$." }; },
        answer: { params: { a: 2, b: 3 } }, skill: "Write an exponential function", hints: ["$a = 2$. Then $2 \\cdot b^2 = 18$."], why: "$b^2 = 9$, so $b = 3$: $y = 2 \\cdot 3^x$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What if the points are **two** steps apart? A graph passes through $(0, 5)$ and $(2, 45)$.",
        scene: { type: "walk", how: HOW_5_13, rows: [
          { step: 1, m: "a = 5", say: "The start." },
          { step: 2, m: "2 \\text{ steps}", say: "From $x = 0$ to $x = 2$." },
          { step: 3, m: "b^2 = \\frac{45}{5} = 9", say: "Two steps multiply by $b$ twice, so the heights' ratio is $b^2$." },
          { step: 3, m: "b = 3", say: "The positive number whose square is 9." },
          { step: 4, m: "f(x) = 5 \\cdot 3^x", say: "Check: $f(2) = 5 \\cdot 9 = 45$ ✓." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Harder: a graph passes through $(0, 10)$ and $(2, 40)$. What is $b$?", answer: 2, skill: "Write an exponential function",
        near: [{ v: 4, fb: "40 is 4 times 10, but that took **two** steps: $b \\cdot b = 4$." }, { v: 15, fb: "The steps multiply. Find $b$ with $b^2 = 4$." }],
        hints: ["Two steps multiply by $b$ twice: $10 \\cdot b^2 = 40$."], why: "$b^2 = 4$, so $b = 2$: $y = 10 \\cdot 2^x$." },
      { type: "choice", prompt: "Compare $f(x) = 50 \\cdot 2^x$ and $g(x) = 400 \\cdot (1.5)^x$. Which is larger at $x = 0$, and which wins in the long run?",
        options: [{ t: "$g$ starts larger, but $f$ overtakes it." }, { t: "$g$ is always larger.", fb: "$g$ starts ahead, 400 to 50, but $f$ doubles while $g$ only grows by half." }, { t: "$f$ is always larger.", fb: "At $x = 0$: $f = 50$ and $g = 400$." }],
        answer: 0, skill: "Compare exponential functions", hints: ["Compare the starting values. Then compare the factors."],
        why: "A bigger factor always wins eventually, whatever the head start. Here $f$ passes $g$ a little after $x = 7$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "An exponential graph passes through $(0, 4)$ and $(2, 36)$. Tap the line where Kiran's work **first** goes wrong.",
        lines: ["a = 4", "b = \\frac{36}{4} = 9", "f(x) = 4 \\cdot 9^x"], answer: 1, fix: "b^2 = \\frac{36}{4} = 9, \\; b = 3",
        fb: { 0: "The point on the $y$-axis gives $a = 4$. Right.", 2: "This uses the $b$ from the line above. The slip came earlier." },
        skill: "Write an exponential function", hints: ["Step 2: how many steps apart are the two points?"],
        why: "The points are two steps apart, so 9 is $b^2$ and $b = 3$. Check: $4 \\cdot 3^2 = 36$ ✓, but $4 \\cdot 9^2 = 324$." },
      { type: "choice", kicker: "Use it", prompt: "Account A: \\$1,000 growing 5% a year. Account B: \\$1,200 growing 3% a year. Which statement is true?",
        options: [{ t: "B has more at first. A has more eventually." }, { t: "A always has more.", fb: "At the start A has \\$1,000 and B has \\$1,200." }, { t: "B always has more.", fb: "A's factor, 1.05, beats B's 1.03. Given time, A catches up and passes." }],
        answer: 0, skill: "Compare exponential functions", hints: ["Start values: 1000 and 1200. Factors: 1.05 and 1.03."], why: "$1000 \\cdot (1.05)^t$ against $1200 \\cdot (1.03)^t$: the larger factor wins in the end (after about 10 years)." }
    ]
  });

  /* ============================================ 5.14 · Which one changes faster? */
  var HOW_5_14 = [["Table", "List both functions for the same inputs."], ["Compare", "At each input, see which is larger."], ["Crossover", "Find the first input where the exponential is ahead."], ["After", "From there on the exponential stays ahead, and the gap widens."]];
  LESSONS.push({
    title: "Which one changes faster?",
    blurb: "Book 5.14 · A linear function can lead for a long time. An exponential one always catches it.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is $2^5$?",
        answer: 32, skill: "Linear vs exponential",
        near: [{ v: 10, fb: "$2^5$ is five 2s multiplied, not $2 \\times 5$." }, { v: 16, fb: "That is $2^4$. Double once more." }],
        hints: ["2, 4, 8, 16, …"], why: "$2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 32$." },
      { type: "learn", kicker: "The idea",
        prompt: "A linear function can lead for a long time. An exponential function **always** catches it in the end, however big the line's head start. Adding the same amount cannot keep up with multiplying.",
        scene: { type: "method", how: HOW_5_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $f(x) = 10x$ race against $g(x) = 2^x$.",
        scene: { type: "walk", how: HOW_5_14, rows: [
          { step: 1, m: "10, \\; 20, \\; 30, \\; 40, \\; 50, \\; 60", say: "$10x$ for $x = 1$ to 6." },
          { step: 1, m: "2, \\; 4, \\; 8, \\; 16, \\; 32, \\; 64", say: "$2^x$ for the same inputs." },
          { step: 2, m: "50 > 32", say: "At $x = 5$ the line is still ahead." },
          { step: 3, m: "64 > 60", say: "At $x = 6$ the exponential passes it.",
            ask: { prompt: "At $x = 6$: $10x = 60$ and $2^x = 64$. Which is ahead?", answer: 0,
                   options: [{ t: "The exponential" }, { t: "The linear one", fb: "64 is more than 60." }] } },
          { step: 4, m: "128 > 70", say: "At $x = 7$ the gap is already 58, and it keeps widening." }] },
        gate: true,
        then: "The exponential starts far behind, crosses once, and never looks back." },
      { type: "guided", kicker: "Together",
        prompt: "Now race $f(x) = 20x$ against $g(x) = 3^x$.",
        how: HOW_5_14, skill: "Linear vs exponential",
        steps: [
          { step: 1, ask: "$20x$ gives 20, 40, 60. $3^x$ gives 3, 9, and then what is $3^3$?", type: "num", answer: 27, near: [{ v: 9, fb: "That is $3^2$. Multiply by 3 once more." }], hint: "$9 \\times 3$.",
            m: "20, \\; 40, \\; 60 \\qquad 3, \\; 9, \\; 27", say: "Both functions, for $x = 1$, 2 and 3." },
          { step: 2, ask: "At $x = 3$, which is larger?", type: "choice", answer: 0,
            options: [{ t: "$20x$: 60 against 27" }, { t: "$3^x$", fb: "$3^3 = 27$, and $20(3) = 60$." }],
            m: "60 > 27", say: "The line still leads." },
          { step: 3, ask: "At $x = 4$, $20x = 80$. What is $3^4$?", type: "num", answer: 81, hint: "$27 \\times 3$.", m: "81 > 80", say: "The exponential is ahead for the first time." },
          { step: 4, ask: "What happens from $x = 5$ on?", type: "choice", answer: 0,
            options: [{ t: "The exponential stays ahead and pulls away" }, { t: "The line catches up again", fb: "At $x = 5$ it is 243 against 100. The gap only grows." }],
            m: "243 > 100", say: "Once ahead, it stays ahead." }],
        why: "Table, compare, crossover, after. Now race two more." },
      { type: "choice", kicker: "On your own", prompt: "$f(x) = 100x$ and $g(x) = 2^x$. Which is larger at $x = 5$?",
        options: [{ t: "$f$: 500 against 32" }, { t: "$g$: exponential is always bigger", fb: "Not at the start: $g(5) = 32$ and $f(5) = 500$." }, { t: "They are equal.", fb: "$100 \\times 5 = 500$ and $2^5 = 32$." }],
        answer: 0, skill: "Linear vs exponential", hints: ["Work out both."], why: "$f(5) = 500$, $g(5) = 32$. The linear function is far ahead." },
      { type: "table", prompt: "Keep going. Fill in the gaps.", head: ["$x$", "$100x$", "$2^x$"], rows: [[5, 500, 32], [10, null, 1024], [15, 1500, 32768], [20, null, 1048576]],
        answers: [[1, 1, 1000], [3, 1, 2000]], skill: "Linear vs exponential", hints: ["Multiply $x$ by 100."],
        why: "At $x = 10$ it is 1,000 against 1,024: the exponential has just gone ahead. By $x = 20$ it is 2,000 against more than a million." },
      { type: "learn", kicker: "Explore", prompt: "Slide $n$ to the end. The bars show $100n$ and $2^n$ on the same scale.",
        scene: { type: "bars", series: [{ name: "100n (adds 100)", f: "100n", color: "green" }, { name: "2ⁿ (doubles)", f: "2^n", color: "blue" }], n: 14, start: 0, gate: true },
        gate: true,
        then: "For most of the way the exponential is too small to see. Then it shoots past and the linear bars shrink to nothing beside it." },
      { type: "learn", kicker: "A harder case",
        prompt: "Does a much steeper line save it? Race $f(x) = 1000x$ against $g(x) = 2^x$.",
        scene: { type: "walk", how: HOW_5_14, rows: [
          { step: 1, m: "1000x \\quad\\text{and}\\quad 2^x", say: "The line climbs 1000 at every step." },
          { step: 2, m: "13000 > 8192", say: "At $x = 13$ the line is far ahead." },
          { step: 3, m: "16384 > 14000", say: "At $x = 14$ the exponential passes it anyway." },
          { step: 4, m: "32768 > 15000", say: "One step later it is more than double. A steeper line only delays the crossover." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "What is the first whole number $x$ for which $2^x$ is greater than $100x$?", answer: 10, skill: "Linear vs exponential",
        near: [{ v: 9, fb: "$2^9 = 512$, but $100 \\times 9 = 900$. Not yet." }, { v: 11, fb: "It's already ahead at an earlier $x$. Check $x = 10$." }],
        hints: ["Try $x = 9$ and $x = 10$."], why: "$2^9 = 512 < 900$, but $2^{10} = 1024 > 1000$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says: “$f(x) = 500x$ is always bigger than $g(x) = 2^x$, because it starts so far ahead.” What is wrong?",
        options: [{ t: "A line can lead for a while, but an exponential always overtakes it in the end." },
                  { t: "$2^x$ is bigger from the very first step.", fb: "At $x = 1$ it is 500 against 2. The line does lead at first." },
                  { t: "Nothing. A big enough line stays ahead.", fb: "Try $x = 13$: $500(13) = 6500$, and $2^{13} = 8192$." }],
        answer: 0, skill: "Linear vs exponential", hints: ["Step 3: compare them at $x = 13$."],
        why: "$2^{13} = 8192$ beats $500 \\cdot 13 = 6500$. From there the exponential pulls away." },
      { type: "choice", kicker: "Use it", prompt: "Two pay plans. **A:** \\$50,000 a year, plus \\$2,000 more each year. **B:** \\$40,000, growing 6% each year. Over a 40-year career, which pays more in the final years?",
        options: [{ t: "Plan B" }, { t: "Plan A", fb: "A leads at first. But A adds while B multiplies. After about 10 years B passes it, and by year 40 B pays over three times as much." }, { t: "The same", fb: "One is linear, one exponential: they cross once and then separate." }],
        answer: 0, keep: true, skill: "Linear vs exponential", hints: ["Which plan is exponential?"], why: "A reaches \\$130,000 in year 40. B reaches $40000 \\cdot (1.06)^{40}$, about \\$411,000." }
    ]
  });

  /* ============================================ 5.15 · Changes over equal intervals */
  var HOW_5_15 = [["Interval", "Fix the width of the step in $x$."], ["Linear", "A linear function **adds** the same amount on every step of that width: slope times width."], ["Exponential", "An exponential function **multiplies** by the same amount on every such step: $b$ raised to the width."]];
  LESSONS.push({
    title: "Changes over equal intervals",
    blurb: "Book 5.15 · Over equal steps, a linear function adds the same amount and an exponential one multiplies by the same amount.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "For $f(x) = 3x + 2$, how much does the output change when $x$ goes up by **2**, from any starting point?", answer: 6, skill: "Equal intervals",
        near: [{ v: 3, fb: "That's for a step of 1. A step of 2 does it twice." }, { v: 8, fb: "$f(2) = 8$ is an output. You want the *change*: try $f(2) - f(0)$." }],
        hints: ["Try $f(2) - f(0)$, then $f(5) - f(3)$."], why: "$f(x + 2) - f(x) = 3(x + 2) + 2 - (3x + 2) = 6$. Always 6, wherever you start." },
      { type: "learn", kicker: "The idea",
        prompt: "Take steps of equal width in $x$. A linear function changes by the same **difference** on every step. An exponential function changes by the same **factor** on every step. That is the cleanest way to tell them apart.",
        scene: { type: "method", how: HOW_5_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "For $g(x) = 2^x$, watch what a step of width 4 does to the output, starting from **any** $x$.",
        scene: { type: "walk", how: HOW_5_15, rows: [
          { step: 1, m: "x \\to x + 4", say: "A step of width 4, from any starting point." },
          { step: 3, m: "\\frac{2^{x + 4}}{2^x}", say: "The factor is the new output divided by the old one." },
          { step: 3, m: "2^{(x + 4) - x} = 2^4", say: "The quotient rule: subtract the exponents. The $x$ cancels.",
            ask: { prompt: "What is $(x + 4) - x$?", answer: 0,
                   options: [{ t: "4" }, { t: "$2x + 4$", fb: "$x - x$ is 0. Only the 4 is left." }] } },
          { step: 3, m: "16", say: "Whatever $x$ is, a step of 4 multiplies the output by 16." }] },
        gate: true,
        then: "Equal steps: a linear function adds equal **differences**, an exponential one multiplies by equal **factors**." },
      { type: "guided", kicker: "Together",
        prompt: "For $h(x) = 4 \\cdot 10^x$, find what a step of width 2 does to the output.",
        how: HOW_5_15, skill: "Equal intervals",
        steps: [
          { step: 1, ask: "The step has width 2. What are we comparing?", type: "choice", answer: 0,
            options: [{ t: "$h(x + 2)$ with $h(x)$" }, { t: "Only $h(2)$ with $h(0)$", fb: "That is one case. The claim is about every starting point $x$." }],
            m: "x \\to x + 2", say: "A step of 2 from any $x$." },
          { step: 3, ask: "Divide the new output by the old one. What is left?", type: "choice", answer: 0,
            options: [{ t: "$10^2$" }, { t: "$10^{2x + 2}$", fb: "Dividing powers subtracts the exponents: $(x + 2) - x$." }, { t: "$4 \\cdot 10^2$", fb: "The 4 on top cancels the 4 underneath." }],
            m: "\\frac{4 \\cdot 10^{x + 2}}{4 \\cdot 10^x} = 10^2", say: "The 4s cancel, and the exponents subtract." },
          { step: 3, ask: "So the output is multiplied by what?", type: "num", answer: 100, hint: "$10^2$.", m: "100", say: "Every step of width 2 multiplies the output by 100." }],
        why: "The factor depends only on the width of the step. Now try one yourself." },
      { type: "num", kicker: "On your own", prompt: "For $g(x) = 2^x$, when $x$ goes up by **3**, the output is multiplied by what?", answer: 8, skill: "Equal intervals",
        near: [{ v: 6, fb: "Three steps multiply by 2 three times: $2 \\cdot 2 \\cdot 2$." }, { v: 2, fb: "That's for one step. Three steps: $2^3$." }],
        hints: ["Compare $g(0) = 1$ with $g(3)$. Or $g(1)$ with $g(4)$."], why: "$g(3) \\div g(0) = 8$, and $g(4) \\div g(1) = 16 \\div 2 = 8$. Always 8." },
      { type: "sort", prompt: "The inputs go up in equal steps. Is the function linear or exponential?",
        bins: ["Linear", "Exponential"],
        cards: [{ t: "Outputs: 7, 10, 13, 16", bin: 0, fb: "Equal differences of 3." }, { t: "Outputs: 7, 14, 28, 56", bin: 1, fb: "Equal factors of 2." },
                { t: "Outputs: 200, 100, 50, 25", bin: 1, fb: "Equal factors of a half." }, { t: "Outputs: 200, 150, 100, 50", bin: 0, fb: "Equal differences of $-50$." }],
        skill: "Equal intervals", hints: ["Subtract neighbours. Then divide neighbours."], why: "Equal differences: linear. Equal ratios: exponential." },
      { type: "learn", kicker: "A harder case",
        prompt: "Percentages hide a trap here. A balance grows **10 percent a year**. What happens over any **2 years**?",
        scene: { type: "walk", how: HOW_5_15, rows: [
          { step: 1, m: "x \\to x + 2", say: "Any 2-year period." },
          { step: 3, m: "b = 1.1", say: "Growing 10 percent a year multiplies the balance by 1.1 each year." },
          { step: 3, m: "(1.1)^2 = 1.21", say: "Two years multiply by 1.1 twice. That is 21 percent, not 20." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A savings account grows 5% a year. Over **any** 2-year period, the balance is multiplied by:",
        options: [{ t: "1.1025" }, { t: "1.10", fb: "5% twice isn't 10%: the second year's interest is on a bigger balance. $1.05 \\times 1.05$." }, { t: "2.10", fb: "The factor for one year is 1.05. For two years, multiply it by itself." }],
        answer: 0, skill: "Equal intervals", hints: ["$1.05 \\times 1.05$."], why: "$(1.05)^2 = 1.1025$: a 10.25% gain over two years, whenever they are." },
      { type: "num", prompt: "For $h(x) = 5 \\cdot 3^x$, what is the output multiplied by each time $x$ goes up by **2**?", answer: 9, skill: "Equal intervals",
        near: [{ v: 6, fb: "Two steps multiply by 3 twice: $3 \\cdot 3$." }, { v: 45, fb: "The 5 cancels when you compare two outputs. The factor is $3^2$." }],
        hints: ["$3^2$."], why: "$\\frac{5 \\cdot 3^{x + 2}}{5 \\cdot 3^x} = 3^2 = 9$." },
      { type: "choice", kicker: "Find the error",
        prompt: "$f(x) = 2^x$ goes from 2 to 4 as $x$ goes from 1 to 2. Kiran says: “So every step adds 2.” What is wrong?",
        options: [{ t: "It multiplies by 2 each step. The next value is 8, not 6." },
                  { t: "It adds 4 each step.", fb: "From 2 to 4 is $+2$, from 4 to 8 is $+4$. The amount added keeps changing." },
                  { t: "Nothing. It adds 2 each step.", fb: "Check the next step: $f(3) = 8$." }],
        answer: 0, skill: "Equal intervals", hints: ["Work out $f(3)$."],
        why: "2, 4, 8, 16: equal factors, not equal differences." },
      { type: "num", kicker: "Use it",
        prompt: "A town's population is multiplied by **1.2** every 10 years. By what is it multiplied over **20 years**?",
        answer: 1.44, skill: "Equal intervals",
        near: [{ v: 2.4, fb: "Two steps multiply by 1.2 twice: $1.2 \\times 1.2$, not $1.2 \\times 2$." }, { v: 1.4, fb: "That adds the two increases. They multiply: $1.2 \\times 1.2$." }],
        hints: ["20 years is two steps of 10 years."], why: "$1.2 \\times 1.2 = 1.44$. Over 20 years the population grows by 44 percent." }
    ]
  });

  /* ============================================ Project 5 */
  LESSONS.push({
    title: "Project: Introduction to exponential functions",
    tag: "Project",
    blurb: "Book Project 5 · One grain of rice, doubled on every square of a chessboard.",
    mins: 9, v: 2,
    steps: [
      { type: "learn", kicker: "The brief",
        prompt: "An old story: a king offers an inventor any reward. She asks for **1 grain of rice** on the first square of a chessboard, **2** on the second, **4** on the third, doubling on every square up to the 64th. The king laughs and agrees." },
      { type: "num", prompt: "How many grains go on square **10**?", answer: 512, skill: "Geometric sequences",
        near: [{ v: 1024, fb: "Square 1 has $2^0 = 1$ grain, so square 10 has $2^9$." }, { v: 20, fb: "The grains double each square. They don't go up by 2." }],
        hints: ["Square 1: 1. Square 2: 2. Square 3: 4. Square $n$: $2^{n - 1}$."], why: "$2^9 = 512$." },
      { type: "choice", prompt: "Which function gives the grains on square $n$?",
        options: [{ t: "$r(n) = 2^{n - 1}$" }, { t: "$r(n) = 2n$", fb: "That's linear: 2, 4, 6. The grains go 1, 2, 4, 8." }, { t: "$r(n) = 2^n$", fb: "Check square 1: $2^1 = 2$, but it holds 1 grain." }],
        answer: 0, skill: "nth term", hints: ["Check it against squares 1, 2 and 3."], why: "$2^0 = 1$, $2^1 = 2$, $2^2 = 4$: one doubling fewer than the square number." },
      { type: "choice", prompt: "Square 64 holds $2^{63}$ grains, about $9.2 \\times 10^{18}$. A grain weighs about $2 \\times 10^{-5}$ kg. Roughly how heavy is that last square's rice?",
        options: [{ t: "About $1.8 \\times 10^{14}$ kg: more rice than the world grows in a century" }, { t: "About $1.8 \\times 10^{23}$ kg", fb: "Multiplying powers adds the exponents: $18 + (-5) = 13$, and $9.2 \\times 2 = 18.4$." }, { t: "About 180 kg", fb: "$10^{18} \\times 10^{-5} = 10^{13}$: a vastly bigger number." }],
        answer: 0, skill: "Scientific notation", hints: ["$9.2 \\times 2 \\approx 18.4$ and $10^{18} \\cdot 10^{-5} = 10^{13}$."], why: "$18.4 \\times 10^{13} = 1.84 \\times 10^{14}$ kg. The king could not pay." },
      { type: "explain", kicker: "Make it yours",
        prompt: "The king expected a small pile of rice. In two or three sentences, explain what he got wrong, using the words **linear** and **exponential**.",
        placeholder: "e.g. He thought the amount would grow steadily, but…",
        model: "A good answer contrasts adding with multiplying: “The king pictured linear growth, a bit more rice on each square. But doubling is exponential: each square holds as much as all the squares before it put together, plus one. It starts tiny and ends larger than anything linear could reach.”" }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "u5-rules", title: "Use the exponent rules", lesson: 2,
      gen: function (R) {
        var a = R.int(2, 9), b = R.int(2, 6), v = R.pick(["x", "y", "a", "n"]), kind = R.int(0, 2), tex, ans, why, slip;
        if (kind === 0) { tex = v + "^{" + a + "} \\cdot " + v + "^{" + b + "}"; ans = a + b; why = "Multiplying: add the exponents, $" + a + " + " + b + "$."; slip = { v: a * b, fb: "Multiplying powers *adds* the exponents." }; }
        else if (kind === 1) { a += b; tex = "\\frac{" + v + "^{" + a + "}}{" + v + "^{" + b + "}}"; ans = a - b; why = "Dividing: subtract the exponents, $" + a + " - " + b + "$."; slip = { v: a / b, fb: "Dividing powers *subtracts* the exponents." }; }
        else { tex = "(" + v + "^{" + a + "})^{" + b + "}"; ans = a * b; why = "A power of a power: multiply the exponents, $" + a + " \\times " + b + "$."; slip = { v: a + b, fb: "A power of a power *multiplies* the exponents." }; }
        return { type: "num", prompt: "Simplify. $$" + tex + " = " + v + "^{\\square}$$ What goes in the box?", answer: ans, near: near(ans, [slip]),
          hints: ["Count the factors of $" + v + "$."], why: why };
      } },
    { id: "u5-zero-neg", title: "Zero and negative exponents", lesson: 2,
      gen: function (R) {
        var b = R.pick([2, 3, 4, 5, 10]), n = R.int(0, 3), ans = 1 / Math.pow(b, n);
        return { type: "num", prompt: "Evaluate $" + b + "^{" + (n === 0 ? "0" : "-" + n) + "}$." + (n ? " (A fraction like 1/8 is fine.)" : ""), answer: ans, tol: 1e-9, shown: n === 0 ? "1" : "1/" + Math.pow(b, n),
          near: near(ans, [{ v: 0, fb: "Any non-zero number to the power 0 is 1, not 0." }, { v: -Math.pow(b, n), fb: "A negative exponent doesn't make the value negative. It means “one over”." }, { v: -b * n, fb: "An exponent isn't a multiplier. $" + b + "^{-" + n + "} = \\frac{1}{" + b + "^{" + n + "}}$." }]),
          hints: [n === 0 ? "What does every power of 0 equal?" : "$b^{-n} = \\frac{1}{b^n}$."], why: n === 0 ? "$" + b + "^0 = 1$." : "$" + b + "^{-" + n + "} = \\frac{1}{" + Math.pow(b, n) + "}$." };
      } },
    { id: "u5-rational", title: "Evaluate rational exponents", lesson: 3,
      gen: function (R) {
        var P = R.pick([[4, 2], [9, 2], [16, 2], [25, 2], [49, 2], [8, 3], [27, 3], [64, 3], [16, 4], [81, 4], [32, 5]]), root = Math.round(Math.pow(P[0], 1 / P[1])), m = R.chance(0.4) ? 2 : 1, ans = Math.pow(root, m);
        return { type: "num", prompt: "Evaluate $" + P[0] + "^{\\frac{" + m + "}{" + P[1] + "}}$.", answer: ans,
          near: near(ans, [{ v: P[0] * m / P[1], tol: 1e-9, fb: "The exponent isn't a multiplier. The " + P[1] + " underneath means a root." }]),
          hints: ["First find the number whose power " + P[1] + " is " + P[0] + "." + (m > 1 ? " Then square it." : "")],
          why: "$" + root + "^{" + P[1] + "} = " + P[0] + "$, so the root is " + root + (m > 1 ? ", and $" + root + "^2 = " + ans + "$." : ".") };
      } },
    { id: "u5-lin-exp", title: "Linear or exponential?", lesson: 4,
      gen: function (R) {
        var exp = R.chance(0.5), a = exp ? R.int(1, 6) : R.int(2, 30), s = exp ? R.pick([2, 3, 4, 0.5]) : R.nz(-8, 9), t = [a];
        if (exp && s === 0.5) t[0] = a = R.pick([48, 64, 80, 160]);
        for (var i = 1; i < 4; i++) t.push(exp ? t[i - 1] * s : t[i - 1] + s);
        var why = exp ? "Each output is the one before multiplied by $" + nm(s) + "$: equal ratios." : "Each output is the one before plus $" + s + "$: equal differences.";
        return mc(R, { prompt: "Is this table linear or exponential?" + tbl(["$x$", "0", "1", "2", "3"], [["y"].concat(t)]), right: exp ? "Exponential" : "Linear",
          wrong: [{ t: exp ? "Linear" : "Exponential", fb: why }], keep: true, hints: ["Check the differences between neighbours. Then check the ratios."], why: why });
      } },
    { id: "u5-eval", title: "Evaluate an exponential model", lesson: 5,
      gen: function (R) {
        var S = R.pick([{ s: "A colony of {a} bacteria doubles every hour. How many after {t} hours?", b: 2 }, { s: "A post has {a} views, and the views triple every day. How many after {t} days?", b: 3 },
                        { s: "A {a} mg dose halves every hour. How many mg are left after {t} hours?", b: 0.5 }]);
        var t = R.int(2, 4), a = S.b === 0.5 ? R.pick([80, 160, 240, 400]) : R.pick([5, 20, 50, 100, 300]), ans = a * Math.pow(S.b, t);
        return { type: "num", prompt: S.s.replace("{a}", a).replace("{t}", t), answer: ans,
          near: near(ans, [big(ans), { v: a * S.b * t, fb: "Multiplying by " + nm(S.b) + " again and again is a power: $" + nm(S.b) + "^{" + t + "}$, not $" + nm(S.b) + " \\times " + t + "$." }]),
          hints: ["Multiply by " + nm(S.b) + ", " + t + " times."], why: "$" + a + " \\cdot " + (S.b === 0.5 ? "\\left(\\frac{1}{2}\\right)" : S.b) + "^{" + t + "} = " + nm(ans) + "$." };
      } },
    { id: "u5-factor", title: "Find the growth factor", lesson: 5,
      gen: function (R) {
        var b = R.pick([2, 3, 4, 5, 1.5, 0.5, 0.25]), a = b < 1 ? R.pick([64, 128, 256]) : b === 1.5 ? R.pick([8, 16, 24]) : R.int(1, 6), t = [a, a * b, a * b * b, a * b * b * b];
        return { type: "num", prompt: "This table is exponential. What is its growth factor?" + tbl(["$x$", "0", "1", "2", "3"], [["y"].concat(t)]), answer: b, tol: 1e-9,
          near: near(b, [{ v: t[1] - t[0], fb: "That's a difference. A factor is a ratio: $" + nm(t[1]) + " \\div " + a + "$." }, { v: a, fb: "That's the initial value. The factor is what each output is multiplied by." }]),
          hints: ["Divide any output by the one before it."], why: "$" + nm(t[1]) + " \\div " + a + " = " + nm(b) + "$." };
      } },
    { id: "u5-decay", title: "Growth or decay?", lesson: 6,
      gen: function (R) {
        var a = R.pick([0.5, 3, 12, 80, 500, 2000]), b = R.pick([0.2, 0.5, 0.75, 0.9, 0.98, 1.02, 1.1, 1.5, 2, 3]), g = b > 1;
        var why = "The base is $" + nm(b) + "$, which is " + (g ? "greater than 1: growth." : "between 0 and 1: decay.") + " The $" + nm(a) + "$ is only the starting value.";
        return mc(R, { prompt: "Does $y = " + nm(a) + " \\cdot (" + nm(b) + ")^x$ show growth or decay?", right: g ? "Growth" : "Decay", wrong: [{ t: g ? "Decay" : "Growth", fb: why }], keep: true,
          hints: ["Look at the number being raised to the power."], why: why });
      } },
    { id: "u5-percent", title: "Percent change as a growth factor", lesson: 6,
      gen: function (R) {
        var p = R.pick([2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40]), up = R.chance(0.5), ans = up ? 1 + p / 100 : 1 - p / 100;
        var S = up ? R.pick(["A town's population grows " + p + "% a year.", "An investment gains " + p + "% a year."]) : R.pick(["A car loses " + p + "% of its value each year.", "A battery loses " + p + "% of its charge each hour."]);
        return { type: "num", prompt: S + " What is the growth factor $b$?", answer: ans, tol: 1e-9,
          near: near(ans, [{ v: p / 100, fb: up ? "That's the increase alone. The factor keeps the original 100% too: add it to 1." : "That's the part that is lost. The factor is the part that *remains*." }, { v: up ? 1 - p / 100 : 1 + p / 100, fb: up ? "That would be a " + p + "% loss." : "That would be a " + p + "% gain." }, { v: p, fb: "Write it as a decimal multiplier, close to 1." }]),
          hints: [up ? "100% plus " + p + "%, as a decimal." : "100% minus " + p + "%, as a decimal."], why: (up ? "$1 + " : "$1 - ") + nm(p / 100) + " = " + nm(ans) + "$." };
      } },
    { id: "u5-sci", title: "Read scientific notation", lesson: 7,
      gen: function (R) {
        var c = R.pick([1.2, 2.5, 3, 4.8, 6.1, 7, 9.9]), e = R.pick([-4, -3, -2, -1, 2, 3, 4, 5]), ans = Number((c * Math.pow(10, e)).toPrecision(6));
        return { type: "num", prompt: "Write $" + c + " \\times 10^{" + e + "}$ as an ordinary number.", answer: ans, tol: Math.abs(ans) * 1e-9, shown: String(ans),
          near: near(ans, [{ v: Number((c * Math.pow(10, -e)).toPrecision(6)), tol: 1e-12, fb: e > 0 ? "A positive power of 10 makes the number bigger." : "A negative power of 10 makes the number smaller." }].concat(ans >= 1000 && ans < 1e6 ? [big(ans)] : [])),
          hints: ["Move the decimal point " + Math.abs(e) + " places to the " + (e > 0 ? "right." : "left.")], why: "$" + c + " \\times 10^{" + e + "} = " + ans + "$." };
      } },
    { id: "u5-intercept", title: "Read a and b from an equation", lesson: 8,
      gen: function (R) {
        var a = R.pick([3, 5, 12, 40, 200]), b = R.pick([2, 3, 1.5, 0.5, 0.8]), ask = R.chance(0.5);
        return mc(R, { prompt: "For $y = " + a + " \\cdot (" + nm(b) + ")^x$, " + (ask ? "where does the graph cross the $y$-axis?" : "what happens to $y$ each time $x$ goes up by 1?"),
          right: ask ? "At $(0, " + a + ")$" : "It is multiplied by " + nm(b),
          wrong: ask ? [{ t: "At $(0, " + nm(b) + ")$", fb: "$" + nm(b) + "$ is the factor. At $x = 0$ the power is 1, leaving $" + a + "$." }, { t: "At $(0, " + nm(a * b) + ")$", fb: "That's the value at $x = 1$." }, { t: "At $(" + a + ", 0)$", fb: "On the $y$-axis, $x = 0$." }]
                     : [{ t: "It is multiplied by " + a, fb: a + " is the starting value." }, { t: "It goes up by " + nm(b), fb: "Exponential functions multiply. They don't add." }, { t: "It goes up by " + a, fb: "Adding the same amount each step would be linear." }],
          hints: [ask ? "Put $x = 0$." : "In $a \\cdot b^x$, which number is the factor?"], why: ask ? "$" + a + " \\cdot (" + nm(b) + ")^0 = " + a + "$." : "The base $" + nm(b) + "$ is the growth factor." });
      } },
    { id: "u5-aroc", title: "Average rate of change of an exponential", lesson: 11,
      gen: function (R) {
        var b = R.pick([2, 3]), a = R.int(1, 4), x1 = R.int(0, 2), x2 = x1 + R.pick([1, 2]), f1 = a * Math.pow(b, x1), f2 = a * Math.pow(b, x2), ans = (f2 - f1) / (x2 - x1);
        return { type: "num", prompt: "For $f(x) = " + (a === 1 ? "" : a + " \\cdot ") + b + "^x$, find the average rate of change from $x = " + x1 + "$ to $x = " + x2 + "$.", answer: ans,
          near: near(ans, [{ v: f2 - f1, fb: "That's the change in output. Divide by the change in input, " + (x2 - x1) + "." }]),
          hints: ["$f(" + x1 + ") = " + f1 + "$ and $f(" + x2 + ") = " + f2 + "$."], why: "$\\frac{" + f2 + " - " + f1 + "}{" + x2 + " - " + x1 + "} = " + nm(ans) + "$." };
      } },
    { id: "u5-write", title: "Write an exponential function", lesson: 14,
      gen: function (R) {
        var a = R.int(2, 9), b = R.pick([2, 3, 4, 5]);
        if (a === b) a += 1;
        return mc(R, { prompt: "An exponential graph passes through $(0, " + a + ")$ and $(1, " + a * b + ")$. Which function is it?", right: "$f(x) = " + a + " \\cdot " + b + "^x$",
          wrong: [{ t: "$f(x) = " + b + " \\cdot " + a + "^x$", fb: "At $x = 0$ that gives " + b + ", but the graph is at " + a + "." }, { t: "$f(x) = " + a * b + " \\cdot " + b + "^x$", fb: a * b + " is the value at $x = 1$, not the start." },
                  { t: "$f(x) = " + a + " + " + (a * b - a) + "x$", fb: "That's the line through the two points. The question says exponential." }],
          hints: ["$a$ is the value at $x = 0$. $b$ is the next value divided by it."], why: "$a = " + a + "$ and $b = " + a * b + " \\div " + a + " = " + b + "$." });
      } },
    { id: "u5-compare", title: "Linear against exponential", lesson: 15,
      gen: function (R) {
        var m = R.pick([5, 10, 20, 30, 50, 100, 200, 500]), b = R.pick([2, 3, 4]), x = 1;
        while (Math.pow(b, x) <= m * x) x++;
        return { type: "num", prompt: "What is the first whole number $x$ (from 1 up) for which $" + b + "^x$ is greater than $" + m + "x$?", answer: x,
          near: [{ v: x - 1, fb: "$" + b + "^{" + (x - 1) + "} = " + Math.pow(b, x - 1) + "$, but $" + m + " \\times " + (x - 1) + " = " + m * (x - 1) + "$. Not yet." }],
          hints: ["Make a table of both for $x = 1, 2, 3, \\ldots$"], why: "$" + b + "^{" + x + "} = " + Math.pow(b, x) + "$ beats $" + m + " \\times " + x + " = " + m * x + "$, and it stays ahead from then on." };
      } },
    { id: "u5-interval", title: "Change over an interval", lesson: 16,
      gen: function (R) {
        if (R.chance(0.5)) {
          var b = R.pick([2, 3, 4, 5]), a = R.int(1, 9), k = R.int(2, 3);
          return { type: "num", prompt: "For $f(x) = " + (a === 1 ? "" : a + " \\cdot ") + b + "^x$, the output is multiplied by what each time $x$ goes up by " + k + "?", answer: Math.pow(b, k),
            near: near(Math.pow(b, k), [{ v: b * k, fb: k + " steps multiply by " + b + " again and again: $" + b + "^{" + k + "}$." }, { v: b, fb: "That's for one step." }]),
            hints: ["One step multiplies by " + b + "."], why: "$" + b + "^{" + k + "} = " + Math.pow(b, k) + "$, wherever you start." };
        }
        var m = R.nz(-6, 8), c = R.int(-5, 9), k2 = R.int(2, 5);
        return { type: "num", prompt: "For $f(x) = " + poly([[m, "x"], [c, ""]]) + "$, how much does the output change each time $x$ goes up by " + k2 + "?", answer: m * k2,
          near: near(m * k2, [{ v: m, fb: "That's for a step of 1." }, { v: m * k2 + c, fb: "The $" + c + "$ cancels when you subtract two outputs." }]),
          hints: ["One step changes the output by $" + m + "$."], why: "$" + m + " \\times " + k2 + " = " + m * k2 + "$, wherever you start." };
      } }
  ];
  L.unit("alg", 5, {
    title: "Introduction to exponential functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "The exponent rules, zero and negative exponents, and roots as exponents.",
        skills: ["u5-rules", "u5-zero-neg", "u5-rational"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Linear against exponential, growth factors, decay, and scientific notation.",
        skills: ["u5-lin-exp", "u5-eval", "u5-factor", "u5-decay", "u5-percent", "u5-sci"], per: 2 },
      { title: "Quiz 3", after: 12, blurb: "Reading a and b, and how an exponential's rate of change behaves.",
        skills: ["u5-intercept", "u5-aroc"], per: 3 },
      { title: "Quiz 4", after: 16, blurb: "Writing exponential functions, and the race between linear and exponential.",
        skills: ["u5-write", "u5-compare", "u5-interval"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg:5", {
    2: { name: "Exponent rules", frame: "To multiply powers of the same base, [[add]] the exponents. Any non-zero number to the power 0 is [[1]]. A negative exponent means [[one over]] the positive power.",
         chips: ["multiply", "0", "negative"], fb: { "0": "$2^0$ sits between $2^1 = 2$ and $2^{-1} = \\frac{1}{2}$ in the halving pattern: it is 1.", "negative": "$x^{-n} = \\frac{1}{x^n}$: a negative exponent divides, it doesn't make the value negative." } },
    3: { name: "Rational exponents", frame: "A fraction as an exponent is a [[root]]: the [[denominator]] says which root. For $x^{\\frac{m}{n}}$, take the root, then raise it to the power [[$m$]].",
         chips: ["numerator", "$n$"] },
    4: { name: "Linear vs exponential growth", frame: "[[Linear]] growth adds the same amount each step: constant differences. [[Exponential]] growth multiplies by the same amount: constant [[ratios]].",
         chips: ["Quadratic", "sums"] },
    5: { name: "Exponential function", frame: "In $f(x) = a \\cdot b^x$, $a$ is the [[initial value]], the output when $x = 0$, and $b$ is the [[growth factor]], what the output is [[multiplied]] by each step.",
         chips: ["slope", "added"], fb: { "added": "Exponential functions multiply by $b$ each step. Adding would be linear." } },
    6: { name: "Exponential decay", frame: "When the factor $b$ is between [[0]] and [[1]], the quantity [[decays]]: it shrinks by the same fraction each step.",
         chips: ["2", "grows"] },
    7: { name: "Negative exponents and powers of ten", frame: "A negative input in $a \\cdot b^x$ means steps [[before]] the start: each step back [[divides]] by $b$. A negative power of 10 makes a number [[smaller]] than 1.",
         chips: ["after", "bigger"] },
    8: { name: "Exponential graphs", frame: "The graph of $y = a \\cdot b^x$ crosses the $y$-axis at [[$(0, a)$]]. It rises when $b$ is [[greater]] than 1, and it never touches the [[$x$-axis]].",
         chips: ["$(0, b)$", "less"] },
    9: { name: "Exponential situations as functions", frame: "An exponential situation is a [[function]]: each time has one amount. $f(3) = 800$ means after [[3]] weeks there are [[800]] flies.",
         chips: ["8", "100"] },
    10: { name: "Between the whole numbers", frame: "Exponential functions take inputs [[between]] whole numbers too, so $m(0.5)$ makes sense and the graph is a smooth [[curve]].",
          chips: ["only at", "line"] },
    11: { name: "Changing rates", frame: "A linear function's rate of change is [[constant]]. A growing exponential's average rate of change keeps [[increasing]]; a decaying one falls fast, then more [[slowly]].",
          chips: ["decreasing", "quickly"] },
    12: { name: "Choosing a model", frame: "A model needn't hit every point. Roughly constant ratios suggest an [[exponential]] model; roughly constant differences, a [[linear]] one.",
          chips: ["quadratic"] },
    13: { name: "Reading b from a graph", frame: "For $y = 8 \\cdot b^x$ with $b$ between 0 and 1, a smaller $b$ makes the graph fall [[faster]]. At $x = 1$ the graph is at height [[$8b$]].",
          chips: ["slower", "$8 + b$"] },
    14: { name: "Exponential from two points", at: 4, frame: "Through $(0, a)$ and $(1, c)$, the initial value is [[$a$]] and the factor is [[$c \\div a$]]. Of two exponentials, the larger [[factor]] wins in the end.",
          chips: ["$c - a$", "start"] },
    15: { name: "Exponential beats linear", frame: "Exponential growth always [[overtakes]] linear growth in the end, however big the linear one's [[head start]].",
          chips: ["trails", "slope"] },
    16: { name: "Equal intervals", frame: "Over equal intervals, a linear function changes by equal [[differences]] and an exponential function by equal [[factors]].",
          chips: ["sums", "exponents"] }
  });
})();
