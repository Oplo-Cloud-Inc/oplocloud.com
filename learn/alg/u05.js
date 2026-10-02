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
  LESSONS.push({
    title: "Properties of exponents",
    blurb: "Book 5.1 · An exponent counts factors. Every rule comes from counting them.",
    mins: 9, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "$2^3$ means $2 \\cdot 2 \\cdot 2$. What is $2^3 \\cdot 2^2$?", answer: 32, skill: "Exponent rules",
        near: [{ v: 64, fb: "That's $2^6$. Count the 2s: three of them, then two more." }, { v: 12, fb: "$2^3$ is 8, not 6, and $2^2$ is 4. Then multiply." }],
        hints: ["Write out every 2 and count them."], why: "$(2 \\cdot 2 \\cdot 2)(2 \\cdot 2)$ is five 2s: $2^5 = 32$." },
      { type: "learn", kicker: "See it", prompt: "The same thing with a letter.",
        scene: { type: "walk", rows: [
          { m: "x^4 \\cdot x^3", say: "Four $x$'s, times three $x$'s." },
          { m: "(x \\cdot x \\cdot x \\cdot x)(x \\cdot x \\cdot x)", say: "Write them out." },
          { m: "x^7", say: "Seven $x$'s altogether: $4 + 3$." }] },
        gate: true,
        then: "**Product rule:** to multiply powers of the same base, **add** the exponents.$$x^a \\cdot x^b = x^{a + b}$$" },
      { type: "num", prompt: "Dividing cancels factors. $\\frac{x^6}{x^2} = x^{\\square}$. What goes in the box?", answer: 4, skill: "Exponent rules",
        near: [{ v: 3, fb: "The exponents aren't divided. Two of the six $x$'s cancel: $6 - 2$." }, { v: 8, fb: "Dividing removes factors, so subtract." }],
        hints: ["Six $x$'s on top, two underneath. How many are left after cancelling?"], why: "**Quotient rule:** $\\frac{x^a}{x^b} = x^{a - b}$. Here $6 - 2 = 4$." },
      { type: "table", kicker: "Vary it", prompt: "Follow the pattern down the table. Each row is the one above **divided by 2**.",
        head: ["power", "value"], rows: [["2^3", 8], ["2^2", 4], ["2^1", 2], ["2^0", null], ["2^{-1}", null], ["2^{-2}", null]],
        answers: [[3, 1, 1], [4, 1, 0.5], [5, 1, 0.25]], skill: "Zero and negative exponents",
        hints: ["Keep halving: 2, then …"], why: "$2^0 = 1$, $2^{-1} = \\frac{1}{2}$, $2^{-2} = \\frac{1}{4}$. Fractions like 1/2 are fine to type." },
      { type: "learn", kicker: "Name it",
        prompt: "The pattern forces two more rules.<br><br>**Zero exponent:** $x^0 = 1$ for any $x$ except 0.<br>**Negative exponent:** $x^{-n} = \\frac{1}{x^n}$. A negative exponent means “divide”, not “negative number”." },
      { type: "num", prompt: "A power of a power: $(x^3)^2 = x^{\\square}$. What goes in the box?", answer: 6, skill: "Exponent rules",
        near: [{ v: 5, fb: "$(x^3)^2$ means $x^3 \\cdot x^3$. That's $3 + 3$, or $3 \\times 2$." }, { v: 9, fb: "That would be $3^2$. The exponents are multiplied: $3 \\times 2$." }],
        hints: ["$(x^3)^2 = x^3 \\cdot x^3$."], why: "**Power rule:** $(x^a)^b = x^{ab}$. Here $3 \\times 2 = 6$." },
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
  LESSONS.push({
    title: "Rational exponents",
    blurb: "Book 5.2 · A fraction as an exponent is a root.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "The product rule says $9^{\\frac{1}{2}} \\cdot 9^{\\frac{1}{2}} = 9^1 = 9$. So $9^{\\frac{1}{2}}$ is a number that, multiplied by itself, makes 9. What is it?",
        answer: 3, skill: "Rational exponents",
        near: [{ v: 4.5, fb: "$4.5 \\times 4.5$ is 20.25. You need a number whose *square* is 9." }, { v: 81, fb: "That's $9 \\times 9$. You want the number that gives 9 when squared." }],
        hints: ["What number times itself is 9?"], why: "$3 \\cdot 3 = 9$, so $9^{\\frac{1}{2}} = 3$: the square root of 9." },
      { type: "learn", kicker: "Name it",
        prompt: "A fractional exponent is a **root**:$$x^{\\frac{1}{2}} = \\sqrt{x} \\qquad x^{\\frac{1}{3}} = \\sqrt[3]{x} \\qquad x^{\\frac{1}{n}} = \\sqrt[n]{x}$$The denominator says which root. It is the only meaning that keeps the exponent rules true." },
      { type: "num", prompt: "What is $8^{\\frac{1}{3}}$?", answer: 2, skill: "Rational exponents",
        near: [{ v: 2.667, tol: 0.01, fb: "It isn't $8 \\div 3$. It's the number whose *cube* is 8." }],
        hints: ["Which number, multiplied by itself three times, makes 8?"], why: "$2 \\cdot 2 \\cdot 2 = 8$, so $8^{\\frac{1}{3}} = 2$." },
      { type: "learn", kicker: "See it", prompt: "When the numerator isn't 1, do it in two moves.",
        scene: { type: "walk", rows: [
          { m: "27^{\\frac{2}{3}}", say: "The 3 underneath is a root. The 2 on top is a power." },
          { m: "\\left(27^{\\frac{1}{3}}\\right)^2", say: "Power rule, backwards: $\\frac{2}{3} = \\frac{1}{3} \\times 2$." },
          { m: "3^2", say: "The cube root of 27 is 3." },
          { m: "9", say: "Then square." }] },
        gate: true,
        then: "$x^{\\frac{m}{n}}$: take the $n$th **root**, then raise to the power $m$. Root first keeps the numbers small." },
      { type: "slots", kicker: "Vary it", prompt: "Match each power to its value.",
        slots: [{ id: "a", label: "$25^{\\frac{1}{2}}$" }, { id: "b", label: "$64^{\\frac{1}{3}}$" }, { id: "c", label: "$16^{\\frac{3}{4}}$" }, { id: "d", label: "$100^{\\frac{1}{2}}$" }],
        cards: [{ t: "5", slot: "a", fb: "$5^2 = 25$." }, { t: "4", slot: "b", fb: "$4^3 = 64$." }, { t: "8", slot: "c", fb: "Fourth root of 16 is 2, and $2^3 = 8$." }, { t: "10", slot: "d", fb: "$10^2 = 100$." }, { t: "12" }],
        skill: "Rational exponents", hints: ["The denominator is the root. Do that first."], why: "Root first, then the power." },
      { type: "choice", prompt: "Which is the same as $\\sqrt{x} \\cdot \\sqrt{x}$?",
        options: [{ t: "$x$" }, { t: "$x^2$", fb: "$x^{\\frac{1}{2}} \\cdot x^{\\frac{1}{2}}$: add the exponents, $\\frac{1}{2} + \\frac{1}{2} = 1$." }, { t: "$x^{\\frac{1}{4}}$", fb: "Multiplying powers adds the exponents. It doesn't multiply them." }],
        answer: 0, skill: "Rational exponents", hints: ["Write each root as $x^{\\frac{1}{2}}$ and use the product rule."], why: "$x^{\\frac{1}{2}} \\cdot x^{\\frac{1}{2}} = x^{1} = x$." },
      { type: "num", kicker: "Use it", prompt: "A cube has a volume of **125 cm³**. Its side is $125^{\\frac{1}{3}}$ cm. How long is that?", post: "cm", answer: 5, skill: "Rational exponents",
        hints: ["Which number cubed is 125?"], why: "$5 \\cdot 5 \\cdot 5 = 125$, so the side is 5 cm." }
    ]
  });

  /* ============================================ 5.3 · Patterns of growth */
  LESSONS.push({
    title: "Patterns of growth",
    blurb: "Book 5.3 · Adding the same amount, or multiplying by the same amount. They start alike and end very differently.",
    mins: 8, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "Two job offers for 20 days. **A:** \\$1,000 every day. **B:** \\$1 on day 1, then double the day before, every day. Which pays more **on day 20**?",
        options: [{ t: "Offer B" }, { t: "Offer A", fb: "A pays \\$1,000 on day 20. B has doubled 19 times by then: over \\$500,000." }, { t: "They pay the same.", fb: "B looks tiny at first: \\$1, \\$2, \\$4. Keep doubling." }],
        answer: 0, keep: true, skill: "Linear and exponential growth", hints: ["Try doubling: 1, 2, 4, 8, 16, … How fast does it get big?"],
        why: "On day 20, B pays $2^{19}$ dollars: that is \\$524,288. Doubling starts slowly and then runs away." },
      { type: "learn", kicker: "See it", prompt: "Two patterns start at 2. One **adds 3** each step. The other **doubles**. Slide $n$ and watch them part.",
        scene: { type: "bars", series: [{ name: "Add 3", f: "2 + 3n", color: "green" }, { name: "Double", f: "2 * 2^n", color: "blue" }], n: 8, start: 0, gate: true },
        gate: true,
        then: "For a few steps they stay close. Then doubling leaves adding far behind." },
      { type: "table", prompt: "Fill in both patterns.", head: ["step $n$", "add 3", "double"], rows: [[0, 2, 2], [1, 5, 4], [2, null, null], [3, null, null], [4, null, null]],
        answers: [[2, 1, 8], [2, 2, 8], [3, 1, 11], [3, 2, 16], [4, 1, 14], [4, 2, 32]], skill: "Linear and exponential growth",
        hints: ["Left: add 3 to the number above. Right: double the number above."], why: "Add 3: 2, 5, 8, 11, 14. Double: 2, 4, 8, 16, 32." },
      { type: "learn", kicker: "Name it",
        prompt: "**Linear growth:** each step **adds** the same amount. The differences are constant.<br><br>**Exponential growth:** each step **multiplies** by the same amount. The ratios are constant." },
      { type: "sort", kicker: "Vary it", prompt: "Linear or exponential?",
        bins: ["Linear", "Exponential"],
        cards: [{ t: "A tree grows 30 cm every year", bin: 0, fb: "The same amount is added each year." },
                { t: "Each person who hears a rumour tells two more", bin: 1, fb: "The number hearing it doubles each round." },
                { t: "You save \\$20 a week", bin: 0, fb: "Add \\$20 each week." },
                { t: "A town's population grows by 3% a year", bin: 1, fb: "A percent of the current size: each year it multiplies by 1.03." },
                { t: "A cell divides in two every hour", bin: 1, fb: "The count doubles each hour." }],
        skill: "Linear and exponential growth", hints: ["Is the same amount added, or is it multiplied by the same number?"],
        why: "“A fixed amount more” is linear. “Times as many” or “percent more” is exponential." },
      { type: "slots", prompt: "Match each expression to its description. $x$ counts the steps.",
        slots: [{ id: "a", label: "Starts at 100 and adds 5 each step" }, { id: "b", label: "Starts at 100 and doubles each step" }, { id: "c", label: "Starts at 5 and adds 100 each step" }],
        cards: [{ t: "$100 + 5x$", slot: "a", fb: "Repeated adding is multiplication: $5x$." }, { t: "$100 \\cdot 2^x$", slot: "b", fb: "Repeated multiplying is a power: $2^x$." },
                { t: "$5 + 100x$", slot: "c", fb: "The starting value stands alone. The step multiplies $x$." }, { t: "$100 \\cdot 2x$" }],
        skill: "Linear and exponential growth", hints: ["Repeated addition is written as multiplication. Repeated multiplication is written as a power."],
        why: "Adding $d$ each step gives $dx$. Multiplying by $b$ each step gives $b^x$." },
      { type: "num", kicker: "Use it", prompt: "Offer B again: \\$1 on day 1, doubling each day. On which day does the pay **first pass \\$1,000**?", pre: "day", answer: 11, skill: "Linear and exponential growth",
        near: [{ v: 10, fb: "Day 10 pays $2^9 = 512$ dollars. One more doubling." }, { v: 1000, fb: "Doubling gets there much faster than that. List the powers of 2." }],
        hints: ["1, 2, 4, 8, 16, 32, 64, 128, 256, 512, …"], why: "Day 10 pays \\$512 and day 11 pays \\$1,024." }
    ]
  });

  /* ============================================ 5.4 · Representing exponential growth */
  LESSONS.push({
    title: "Representing exponential growth",
    blurb: "Book 5.4 · y = a·bˣ: a is where it starts, b is the growth factor.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A dish holds **500 bacteria**, and the number **doubles every hour**. How many after 3 hours?", answer: 4000, skill: "Exponential growth",
        near: [big(4000), { v: 3000, fb: "That's 500 × 2 × 3. Doubling three times is $\\times 2 \\times 2 \\times 2$." }, { v: 1500, fb: "It doesn't gain 500 an hour. It *doubles* each hour." }],
        hints: ["500, then 1000, then …"], why: "$500 \\to 1000 \\to 2000 \\to 4000$. That's $500 \\cdot 2^3$." },
      { type: "choice", prompt: "Which expression gives the number of bacteria after $h$ hours?",
        options: [{ t: "$500 \\cdot 2^h$" }, { t: "$500 \\cdot 2h$", fb: "$2h$ doubles the hours. Doubling the *count* each hour is repeated multiplication: $2^h$." }, { t: "$2 \\cdot 500^h$", fb: "500 is the starting amount. The 2 is what gets multiplied again and again." }, { t: "$500 + 2h$", fb: "That adds 2 bacteria an hour." }],
        answer: 0, skill: "Exponential growth", hints: ["After 3 hours it was $500 \\cdot 2 \\cdot 2 \\cdot 2$."], why: "Multiply by 2 once for each hour: $500 \\cdot 2^h$." },
      { type: "num", prompt: "Use $500 \\cdot 2^h$ with $h = 0$. How many bacteria at the very start?", answer: 500, skill: "Exponential growth",
        near: [{ v: 0, fb: "$2^0$ is 1, not 0. So $500 \\cdot 1$." }, { v: 1000, fb: "$2^0 = 1$: no doublings yet." }],
        hints: ["$2^0 = 1$."], why: "$500 \\cdot 2^0 = 500 \\cdot 1 = 500$. The zero exponent rule makes the formula right at the start." },
      { type: "learn", kicker: "Name it",
        prompt: "An **exponential function** has the form$$f(x) = a \\cdot b^x$$$a$ is the **initial value**: the output when $x = 0$.<br>$b$ is the **growth factor**: what the output is multiplied by each time $x$ goes up by 1." },
      { type: "plane", kicker: "See it", prompt: "Set $a$ and $b$ so the curve $y = a \\cdot b^x$ passes through **both** orange points.",
        x: [-1, 4], y: [0, 26], labelEveryY: 2, params: { a: { v: 1, min: 1, max: 6, step: 1, label: "$a$" }, b: { v: 1.5, min: 1.5, max: 3, step: 0.5, label: "$b$" } },
        fns: [{ f: expo, color: "blue" }], marks: [{ x: 0, y: 3, color: "orange", r: 6 }, { x: 1, y: 6, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + st.params.a + " \\cdot " + nm(st.params.b) + "^x$"; },
        check: function (st) { var p = st.params; return p.a === 3 && p.b === 2 ? { ok: true } : { ok: false, say: p.a !== 3 ? "At $x = 0$ the curve is at height $a$. The first orange point is $(0, 3)$." : "From $(0, 3)$ to $(1, 6)$ the height is multiplied by what?" }; },
        answer: { params: { a: 3, b: 2 } }, skill: "Exponential growth", hints: ["$a$ is the height at $x = 0$. $b$ is the multiplier for one step right."],
        why: "$a = 3$ (the start) and $b = 6 \\div 3 = 2$ (the factor): $y = 3 \\cdot 2^x$." },
      { type: "num", kicker: "Vary it", prompt: "This table is exponential. What is its growth factor?" + tbl(["$x$", "$y$"], [[0, 4], [1, 12], [2, 36], [3, 108]]), answer: 3, skill: "Growth factor",
        near: [{ v: 8, fb: "That's the first difference. For a growth factor, *divide*: $12 \\div 4$." }, { v: 4, fb: "4 is the initial value, $a$. The factor is what each output is multiplied by." }],
        hints: ["Divide any output by the one before it."], why: "$12 \\div 4 = 3$, $36 \\div 12 = 3$: $y = 4 \\cdot 3^x$." },
      { type: "choice", kicker: "Use it", prompt: "A social-media post has $V(t) = 250 \\cdot (1.5)^t$ views after $t$ hours. What do 250 and 1.5 tell you?",
        options: [{ t: "It started with 250 views, and the views are multiplied by 1.5 each hour." }, { t: "It gains 250 views an hour for 1.5 hours.", fb: "250 is the value at $t = 0$. The 1.5 is a multiplier, not a time." }, { t: "It started with 1.5 views and gains 250 an hour.", fb: "The number in front is the start. The number being raised to a power is the factor." }],
        answer: 0, skill: "Exponential growth", hints: ["In $a \\cdot b^t$: $a$ is the start, $b$ the factor."], why: "$a = 250$ (initial value) and $b = 1.5$ (growth factor): 50% more each hour." }
    ]
  });

  /* ============================================ 5.5 · Representing exponential decay */
  LESSONS.push({
    title: "Representing exponential decay",
    blurb: "Book 5.5 · When the factor is between 0 and 1, the quantity shrinks.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A car is worth **\\$16,000**. Each year it keeps **three-quarters** of its value. What is it worth after 2 years?", pre: "$\\$$", answer: 9000, skill: "Exponential decay",
        near: [big(9000), { v: 12000, fb: "That's after 1 year. Take three-quarters again." }, { v: 8000, fb: "It doesn't lose \\$4,000 every year. The second year it loses a quarter of \\$12,000." }],
        hints: ["Year 1: $\\frac{3}{4}$ of 16,000.", "Year 2: $\\frac{3}{4}$ of that."], why: "$16000 \\to 12000 \\to 9000$. That's $16000 \\cdot \\left(\\frac{3}{4}\\right)^2$." },
      { type: "table", prompt: "Carry on.", head: ["year", "value (\\$)"], rows: [[0, 16000], [1, 12000], [2, 9000], [3, null]], answers: [[3, 1, 6750]], skill: "Exponential decay",
        hints: ["Three-quarters of 9,000."], why: "$9000 \\times 0.75 = 6750$. Each year's loss is smaller than the last, because it is a fraction of a smaller amount." },
      { type: "learn", kicker: "Name it",
        prompt: "This is **exponential decay**: $f(x) = a \\cdot b^x$ with a growth factor **between 0 and 1**. Here, $V(t) = 16000 \\cdot (0.75)^t$.<br><br>The quantity shrinks by the same *fraction* each step, so it falls quickly at first and then more and more slowly." },
      { type: "plane", kicker: "See it", prompt: "The curve is $y = 8 \\cdot b^x$. Slide $b$ until the curve shows **decay**.",
        x: [-1, 6], y: [0, 17], params: { b: { v: 1.25, min: 0.25, max: 1.5, step: 0.25, label: "$b$" } },
        fns: [{ f: function (x, p) { return 8 * Math.pow(p.b, x); }, color: "blue" }],
        readout: function (st) { var b = st.params.b; return "$y = 8 \\cdot " + nm(b) + "^x$: " + (b > 1 ? "growth" : b < 1 ? "decay" : "constant"); },
        check: function (st) { var b = st.params.b; return b < 1 ? { ok: true } : { ok: false, say: b === 1 ? "With $b = 1$ nothing changes: $8 \\cdot 1^x = 8$." : "This curve rises. Multiplying by more than 1 makes things bigger." }; },
        answer: { params: { b: 0.5 } }, skill: "Exponential decay", hints: ["What kind of multiplier makes a number smaller?"],
        why: "Any $b$ between 0 and 1 gives decay. $b = 1$ is flat, and $b > 1$ is growth." },
      { type: "sort", kicker: "Vary it", prompt: "Growth or decay?",
        bins: ["Growth", "Decay"],
        cards: [{ t: "$y = 3 \\cdot (1.2)^x$", bin: 0, fb: "1.2 is more than 1." }, { t: "$y = 50 \\cdot (0.9)^x$", bin: 1, fb: "0.9 is less than 1." },
                { t: "$y = 0.5 \\cdot 4^x$", bin: 0, fb: "The factor is 4. The 0.5 is only the starting value." }, { t: "$y = 1000 \\cdot \\left(\\frac{1}{2}\\right)^x$", bin: 1, fb: "A half is less than 1, however big the start." },
                { t: "$y = 7 \\cdot (0.99)^x$", bin: 1, fb: "0.99 is just below 1: slow decay." }],
        skill: "Exponential decay", hints: ["Look only at the number being raised to the power."], why: "The base $b$ decides. The starting value $a$ doesn't." },
      { type: "num", prompt: "A laptop **loses 20%** of its value each year. What is its growth factor $b$?", answer: 0.8, skill: "Percent change as a factor",
        near: [{ v: 0.2, fb: "20% is what is lost. The factor is what is *kept*: $100\\% - 20\\%$." }, { v: 20, fb: "Write the factor as a decimal: the fraction of the value that remains." }, { v: 1.2, fb: "That would be a 20% gain." }],
        hints: ["If 20% is lost, what percent remains?"], why: "It keeps 80%, so $b = 0.8$. For a 20% *gain*, $b$ would be 1.2." },
      { type: "num", kicker: "Use it", prompt: "A dose of **200 mg** of medicine halves in the body every 4 hours. How much is left after **12 hours**?", post: "mg", answer: 25, skill: "Exponential decay",
        near: [{ v: 50, fb: "That's after 8 hours: two halvings. 12 hours is three." }, { v: 100, fb: "That's after one halving, 4 hours." }],
        hints: ["12 hours is three lots of 4 hours."], why: "$200 \\to 100 \\to 50 \\to 25$: $200 \\cdot \\left(\\frac{1}{2}\\right)^3 = 25$ mg." }
    ]
  });
  function pow2(x) { return Math.pow(2, x); }
  function med(x) { return 80 * Math.pow(0.5, x); }

  /* ============================================ 5.6 · Negative exponents and scientific notation */
  LESSONS.push({
    title: "Negative exponents and scientific notation",
    blurb: "Book 5.6 · A negative exponent runs the clock backwards. Powers of ten write very big and very small numbers.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A dish has $P(h) = 500 \\cdot 2^h$ bacteria, where $h$ is hours after noon. How many were there **one hour before** noon?", answer: 250, skill: "Negative exponents",
        near: [{ v: 1000, fb: "That's one hour *after* noon. Going back in time undoes a doubling." }, { v: -1000, fb: "A count can't be negative. $2^{-1}$ means divide by 2." }],
        hints: ["One hour before noon is $h = -1$.", "Doubling forwards is halving backwards."], why: "$P(-1) = 500 \\cdot 2^{-1} = 500 \\cdot \\frac{1}{2} = 250$." },
      { type: "learn", kicker: "Name it",
        prompt: "In $a \\cdot b^x$, a **negative** $x$ means steps *before* the start. Each step back divides by $b$:$$b^{-n} = \\frac{1}{b^n}$$For growth, going back makes the amount smaller. For decay, going back makes it bigger." },
      { type: "num", prompt: "What is $3^{-2}$? (Type a fraction like 1/4.)", answer: 1 / 9, tol: 1e-9, shown: "1/9", skill: "Negative exponents",
        near: [{ v: -9, fb: "A negative exponent doesn't make the answer negative. It means “one over”." }, { v: -6, fb: "It isn't $3 \\times -2$. $3^{-2} = \\frac{1}{3^2}$." }, { v: 9, fb: "That's $3^2$. The minus sign puts it underneath: $\\frac{1}{9}$." }],
        hints: ["$3^{-2} = \\frac{1}{3^2}$."], why: "$3^{-2} = \\frac{1}{9}$." },
      { type: "choice", kicker: "See it", prompt: "**Scientific notation** writes a number as a number between 1 and 10, times a power of 10. What is $3.2 \\times 10^4$?",
        options: [{ t: "32,000" }, { t: "320,000", fb: "$10^4$ is 10,000. $3.2 \\times 10000 = 32000$." }, { t: "3,200", fb: "That's $3.2 \\times 10^3$." }, { t: "0.00032", fb: "A positive power of 10 makes the number bigger." }],
        answer: 0, skill: "Scientific notation", hints: ["$10^4$ is ten thousand. Move the decimal point 4 places right."], why: "$3.2 \\times 10000 = 32000$." },
      { type: "num", prompt: "And with a negative power: write $4.5 \\times 10^{-3}$ as a decimal.", answer: 0.0045, tol: 1e-9, skill: "Scientific notation",
        near: [{ v: 4500, fb: "A negative power of 10 divides: the number gets smaller." }, { v: 0.045, tol: 1e-9, fb: "$10^{-3}$ is one thousandth: move the point 3 places left." }, { v: 0.00045, tol: 1e-9, fb: "That's 4 places. $10^{-3}$ moves the point 3 places." }],
        hints: ["$10^{-3} = \\frac{1}{1000}$."], why: "$4.5 \\div 1000 = 0.0045$." },
      { type: "sort", kicker: "Vary it", prompt: "Is the number bigger or smaller than 1?",
        bins: ["Bigger than 1", "Smaller than 1"],
        cards: [{ t: "$6 \\times 10^{-2}$", bin: 1, fb: "0.06." }, { t: "$2.1 \\times 10^{3}$", bin: 0, fb: "2,100." }, { t: "$9.9 \\times 10^{-1}$", bin: 1, fb: "0.99: just under 1." },
                { t: "$1.5 \\times 10^{1}$", bin: 0, fb: "15." }, { t: "$7 \\times 10^{-9}$", bin: 1, fb: "Seven billionths." }],
        skill: "Scientific notation", hints: ["Negative power of 10: a small number. Positive: a big one."], why: "The sign of the exponent tells you which side of 1 the number is on." },
      { type: "num", kicker: "Use it", prompt: "Multiply $(2 \\times 10^3)(4 \\times 10^5)$. The answer is $8 \\times 10^{\\square}$. What goes in the box?", answer: 8, skill: "Scientific notation",
        near: [{ v: 15, fb: "Multiplying powers *adds* the exponents: $3 + 5$." }],
        hints: ["Multiply the 2 and 4. Then use the product rule on $10^3 \\cdot 10^5$."], why: "$2 \\times 4 = 8$ and $10^3 \\cdot 10^5 = 10^8$: the answer is $8 \\times 10^8$." }
    ]
  });

  /* ============================================ 5.7 · Analyzing graphs */
  LESSONS.push({
    title: "Analyzing graphs",
    blurb: "Book 5.7 · What a and b do to the graph of y = a·bˣ.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "One of these graphs is linear and one is exponential. Which is the exponential one?",
        scene: graph([-1, 5], [0, 20], [{ f: "2 + 2*x", color: "green", label: "green", labelAt: 4.4 }, { f: function (x) { return 2 * Math.pow(2, x); }, color: "blue", label: "blue", labelAt: 2.7 }]),
        options: [{ t: "Blue: it bends upward, getting steeper." }, { t: "Green: it's higher at first.", fb: "The green one is straight: it climbs by the same amount each step. That's linear." }, { t: "Both", fb: "A straight line is never exponential." }],
        answer: 0, skill: "Exponential graphs", hints: ["Which one has a slope that keeps changing?"], why: "An exponential graph curves: each step multiplies the height, so the climb gets steeper and steeper." },
      { type: "learn", kicker: "See it", prompt: "Play with $y = a \\cdot b^x$. Move $a$, then move $b$. **What does each one control?**",
        scene: { type: "plane", x: [-3, 5], y: [0, 20], gate: true, params: { a: { v: 2, min: 1, max: 8, step: 1, label: "$a$" }, b: { v: 2, min: 0.25, max: 3, step: 0.25, label: "$b$" } },
          fns: [{ f: expo, color: "blue" }], marks: [{ x: 0, y: function (P) { return P.a; }, color: "orange", r: 6, label: function (P) { return "(0, " + P.a + ")"; } }],
          readout: function (st) { var b = st.params.b; return "$y = " + st.params.a + " \\cdot " + nm(b) + "^x$ — " + (b > 1 ? "growth" : b < 1 ? "decay" : "constant"); } },
        gate: true,
        then: "$a$ is the **vertical intercept**: the curve always crosses the $y$-axis at $(0, a)$. $b$ sets the shape: above 1 the curve rises, below 1 it falls. Either way it gets closer and closer to the $x$-axis without ever touching it." },
      { type: "pair", prompt: "Where does the graph of $y = 5 \\cdot 3^x$ cross the $y$-axis?", answer: [0, 5], skill: "Exponential graphs",
        near: [{ v: [0, 3], fb: "3 is the growth factor. At $x = 0$, $3^0 = 1$, so $y = 5$." }, { v: [0, 15], fb: "That's $5 \\cdot 3^1$, at $x = 1$. The $y$-axis is $x = 0$." }, { v: [5, 0], fb: "On the $y$-axis, $x$ is 0: the point is $(0, 5)$." }],
        hints: ["Put $x = 0$."], why: "$5 \\cdot 3^0 = 5$: the point $(0, 5)$." },
      { type: "choice", kicker: "Vary it", prompt: "Which equation matches this graph?",
        scene: graph([-1, 5], [0, 9], [{ f: function (x) { return 8 * Math.pow(0.5, x); }, color: "purple" }], { marks: [{ x: 0, y: 8, color: "orange" }, { x: 1, y: 4, color: "orange" }, { x: 2, y: 2, color: "orange" }] }),
        options: [{ t: "$y = 8 \\cdot \\left(\\frac{1}{2}\\right)^x$" }, { t: "$y = 8 \\cdot 2^x$", fb: "That one grows. This graph falls: each step halves the height." }, { t: "$y = \\frac{1}{2} \\cdot 8^x$", fb: "The intercept is 8, so $a = 8$. The factor is what one step multiplies by: a half." }, { t: "$y = 8 - 4x$", fb: "A line through $(0, 8)$ and $(1, 4)$ would reach $(2, 0)$. This graph is at 2 there." }],
        answer: 0, skill: "Exponential graphs", hints: ["Read the intercept for $a$. Compare two neighbouring points for $b$."], why: "It starts at 8 and halves each step: 8, 4, 2." },
      { type: "sort", prompt: "True for **every** function $y = a \\cdot b^x$ with $a > 0$?",
        bins: ["Always true", "Not always"],
        cards: [{ t: "The graph crosses the $y$-axis at $(0, a)$", bin: 0, fb: "$b^0 = 1$, so $y = a$ there." }, { t: "The graph stays above the $x$-axis", bin: 0, fb: "A positive number times a positive power is always positive." },
                { t: "The graph rises from left to right", bin: 1, fb: "Only when $b > 1$. With $b < 1$ it falls." }, { t: "The graph is a straight line", bin: 1, fb: "Only if $b = 1$, which is a flat line. Otherwise it curves." }],
        skill: "Exponential graphs", hints: ["Think of one growth example and one decay example."], why: "The intercept $(0, a)$ and staying positive are shared. Direction depends on $b$." },
      { type: "choice", kicker: "Use it", prompt: "How does the graph of $y = 6 \\cdot 2^x$ compare with $y = 3 \\cdot 2^x$?",
        options: [{ t: "It is twice as high at every $x$." }, { t: "It grows twice as fast: its factor is doubled.", fb: "Both have growth factor 2. Only the starting value differs." }, { t: "It is 3 units higher everywhere.", fb: "At $x = 0$ the gap is 3, but at $x = 1$ it is $12 - 6 = 6$. The gap keeps growing." }],
        answer: 0, skill: "Exponential graphs", hints: ["Compare the two at $x = 0$, 1 and 2."], why: "$6 \\cdot 2^x = 2(3 \\cdot 2^x)$: the same shape, stretched to twice the height." }
    ]
  });

  /* ============================================ 5.8 · Exponential situations as functions */
  LESSONS.push({
    title: "Exponential situations as functions",
    blurb: "Book 5.8 · The same exponential, as a sentence, a table, a graph and f(t).",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "$f(t) = 100 \\cdot 2^t$ gives the number of fruit flies in a jar after $t$ weeks. Find $f(3)$.", pre: "$f(3) =$", answer: 800, skill: "Exponential functions",
        near: [{ v: 600, fb: "$2^3$ is $2 \\cdot 2 \\cdot 2 = 8$, not 6." }, { v: 8000000, fb: "Work out $2^3$ first, then multiply by 100." }],
        hints: ["$2^3 = 8$."], why: "$100 \\cdot 2^3 = 100 \\cdot 8 = 800$." },
      { type: "choice", prompt: "What does $f(0) = 100$ mean?",
        options: [{ t: "The jar starts with 100 flies." }, { t: "After 100 weeks there are no flies.", fb: "The input is inside the brackets: 0 weeks. The output is 100 flies." }, { t: "The flies increase by 100 a week.", fb: "They double each week. 100 is the starting count." }],
        answer: 0, skill: "Exponential functions", hints: ["Input 0 weeks, output 100 flies."], why: "At $t = 0$: $100 \\cdot 2^0 = 100$, the initial value." },
      { type: "table", kicker: "See it", prompt: "Fill in the table for $f(t) = 100 \\cdot 2^t$.", head: ["$t$ (weeks)", "$f(t)$"], rows: [[0, 100], [1, null], [2, null], [4, null]],
        answers: [[1, 1, 200], [2, 1, 400], [3, 1, 1600]], skill: "Exponential functions", hints: ["Each week doubles. For week 4, double twice from week 2."], why: "200, 400, then $100 \\cdot 16 = 1600$." },
      { type: "num", prompt: "Read the graph of $f$: for which $t$ is $f(t) = 400$?",
        scene: graph([0, 4], [0, 900], [{ f: function (x) { return 100 * Math.pow(2, x); }, color: "blue" }], { gridY: 100, labelEveryY: 200, hline: [400], axisLabels: ["t", "flies"], aspect: 0.8 }),
        pre: "$t =$", answer: 2, skill: "Exponential functions", hints: ["Where does the curve meet the red line?"], why: "$f(2) = 100 \\cdot 4 = 400$." },
      { type: "learn", kicker: "Name it",
        prompt: "An exponential situation is a **function**: each input (time) has exactly one output (amount). So everything from Unit 4 applies.<br><br>$f(3) = 800$: after 3 weeks, 800 flies. Solving $f(t) = 400$ asks *when* there are 400. And the graph, table and equation all show the same function." },
      { type: "choice", kicker: "Use it", prompt: "The jar was set up at $t = 0$. What is a sensible **domain** for $f$?",
        options: [{ t: "$t \\ge 0$" }, { t: "All real numbers", fb: "Before $t = 0$ there was no jar. In this situation negative times mean nothing." }, { t: "$t \\ge 100$", fb: "100 is an output: the number of flies. The domain is about time." }],
        answer: 0, skill: "Exponential functions", hints: ["Which times make sense here?"], why: "Time starts when the jar is set up: $t \\ge 0$. (And in real life, growth can't continue for ever.)" }
    ]
  });

  /* ============================================ 5.9 · Interpreting exponential functions */
  LESSONS.push({
    title: "Interpreting exponential functions",
    blurb: "Book 5.9 · Evaluate, read from the graph, and choose a window that shows what matters.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "$m(t) = 80 \\cdot \\left(\\frac{1}{2}\\right)^t$ is the milligrams of caffeine in your body $t$ half-lives after a coffee. Find $m(3)$.", pre: "$m(3) =$", post: "mg", answer: 10, skill: "Evaluate an exponential",
        near: [{ v: 120, fb: "$\\left(\\frac{1}{2}\\right)^3$ is $\\frac{1}{8}$, not $\\frac{3}{2}$." }, { v: 40, fb: "That's one halving. $t = 3$ means three." }],
        hints: ["Halve 80 three times."], why: "$80 \\to 40 \\to 20 \\to 10$." },
      { type: "learn", kicker: "See it", prompt: "Slide $t$ along the graph of $m$. **When is 20 mg left?**",
        scene: { type: "plane", x: [0, 6], y: [0, 90], gridY: 10, labelEveryY: 20, aspect: 0.8, gate: true, hline: [20],
          params: { t: { v: 0, min: 0, max: 5, step: 0.5, label: "$t$" } }, fns: [{ f: med, color: "orange" }],
          marks: [{ x: function (P) { return P.t; }, y: function (P) { return med(P.t); }, color: "blue", r: 7 }],
          readout: function (st) { var t = st.params.t; return "$m(" + nm(t) + ") = " + nm(Math.round(med(t) * 10) / 10) + "$ mg" + (t === 2 ? " ✓" : ""); },
          goal: function (st) { return st.params.t === 2; } },
        gate: true,
        then: "$m(2) = 20$. Notice $t = 0.5$ and $t = 1.5$ work too: an exponential function is defined **between** the whole numbers, and its graph is a smooth curve." },
      { type: "choice", prompt: "You want to graph $y = 1000 \\cdot (1.5)^x$ for $0 \\le x \\le 6$. It reaches about 11,400. Which window shows it well?",
        options: [{ t: "$x$ from 0 to 6, $y$ from 0 to 12,000" }, { t: "$x$ from 0 to 6, $y$ from 0 to 10", fb: "The graph starts at 1,000. It would be far off the top of this window." }, { t: "$x$ from $-10$ to 10, $y$ from $-10$ to 10", fb: "The standard window misses it completely: the smallest value in range is 1,000." }],
        answer: 0, skill: "Graphing window", hints: ["The window must contain the smallest and largest outputs you care about."], why: "Outputs run from 1,000 to about 11,400, so the vertical axis needs to reach about 12,000." },
      { type: "choice", kicker: "Vary it", prompt: "For $m(t) = 80 \\cdot \\left(\\frac{1}{2}\\right)^t$, what is $m(0.5)$ closest to?",
        scene: graph([0, 6], [0, 90], [{ f: med, color: "orange" }], { gridY: 10, labelEveryY: 20, aspect: 0.8 }),
        options: [{ t: "About 57 mg" }, { t: "Exactly 60 mg", fb: "60 is halfway between 80 and 40, but the graph curves below the straight line between them." }, { t: "About 40 mg", fb: "40 is $m(1)$. Halfway to it, there is more than 40 left." }],
        answer: 0, skill: "Evaluate an exponential", hints: ["Read the height of the curve above $t = 0.5$."], why: "$80 \\cdot \\left(\\frac{1}{2}\\right)^{0.5} = \\frac{80}{\\sqrt{2}} \\approx 56.6$. The curve sags below the halfway point of 60." },
      { type: "choice", kicker: "Use it", prompt: "A graph of a town's population passes through $(0, 5000)$ and $(1, 5500)$ and is exponential. What is the growth factor, and what does it mean?",
        options: [{ t: "1.1: the population grows 10% each year." }, { t: "500: it gains 500 people each year.", fb: "That would be linear. For an exponential, divide: $5500 \\div 5000$." }, { t: "0.1: it grows by a tenth.", fb: "The growth *rate* is 0.1, but the factor is what you multiply by: 1.1." }],
        answer: 0, skill: "Evaluate an exponential", hints: ["Factor = next value ÷ this value."], why: "$5500 \\div 5000 = 1.1$. Multiplying by 1.1 is a 10% increase." }
    ]
  });

  /* ============================================ 5.10 · Looking at rates of change */
  LESSONS.push({
    title: "Looking at rates of change",
    blurb: "Book 5.10 · A line has one slope. An exponential's average rate of change keeps changing.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "For $f(x) = 2^x$, find the average rate of change from $x = 0$ to $x = 2$." + tbl(["$x$", "0", "1", "2", "3", "4"], [["f(x)", 1, 2, 4, 8, 16]]), answer: 1.5, skill: "Rate of change of an exponential",
        near: [{ v: 3, fb: "That's the change in output. Divide by the change in input, 2." }, { v: 2, fb: "$\\frac{f(2) - f(0)}{2 - 0} = \\frac{4 - 1}{2}$." }],
        hints: ["$\\frac{f(2) - f(0)}{2 - 0}$."], why: "$\\frac{4 - 1}{2} = 1.5$." },
      { type: "num", prompt: "Same function, same width of interval, further along: from $x = 2$ to $x = 4$.", answer: 6, skill: "Rate of change of an exponential",
        near: [{ v: 12, fb: "Divide by the width of the interval, 2." }, { v: 1.5, fb: "That was the first interval. Use $f(4) = 16$ and $f(2) = 4$." }],
        hints: ["$\\frac{16 - 4}{4 - 2}$."], why: "$\\frac{12}{2} = 6$: four times the rate on the first interval." },
      { type: "learn", kicker: "See it", prompt: "Slide the interval along the curve and watch the slope of the orange line.",
        scene: { type: "plane", x: [0, 5], y: [0, 34], labelEveryY: 4, aspect: 1, gate: true,
          params: { a: { v: 0, min: 0, max: 3, step: 1, label: "interval starts at" } }, fns: [{ f: pow2, color: "blue" }],
          marks: function (st) { var a = st.params.a; return [{ x: a, y: pow2(a), color: "orange", r: 6 }, { x: a + 2, y: pow2(a + 2), color: "orange", r: 6 }]; },
          segs: function (st) { var a = st.params.a; return [[a, pow2(a), a + 2, pow2(a + 2), "orange"]]; },
          readout: function (st) { var a = st.params.a; return "From $x = " + a + "$ to $x = " + (a + 2) + "$: average rate of change $= " + nm((pow2(a + 2) - pow2(a)) / 2) + "$"; } },
        gate: true,
        then: "1.5, 3, 6, 12: the average rate of change itself **doubles** each time the interval moves one step right. A growing exponential gets steeper without end." },
      { type: "learn", kicker: "Name it",
        prompt: "A **linear** function has the same rate of change on every interval.<br><br>An **exponential** function does not. For growth, the average rate of change keeps increasing. For decay, the function falls fast at first and then ever more slowly." },
      { type: "num", kicker: "Vary it", prompt: "Decay: $g(x) = 64 \\cdot \\left(\\frac{1}{2}\\right)^x$ gives $g(0) = 64$, $g(2) = 16$, $g(4) = 4$. Find the average rate of change from $x = 0$ to $x = 2$.", answer: -24, skill: "Rate of change of an exponential",
        near: [{ v: 24, fb: "The function is falling, so the rate is negative." }, { v: -48, fb: "Divide by the width of the interval, 2." }],
        hints: ["$\\frac{16 - 64}{2 - 0}$."], why: "$\\frac{16 - 64}{2} = -24$." },
      { type: "choice", kicker: "Use it", prompt: "From $x = 2$ to $x = 4$ the average rate of change of $g$ is $-6$. A cup of tea cools like $g$. What does that tell you?",
        options: [{ t: "It cools quickly at first, then more slowly." }, { t: "It cools at a steady rate.", fb: "The rates are $-24$ and then $-6$: not steady." }, { t: "It cools slowly at first, then faster.", fb: "The first rate, $-24$, is the bigger drop." }],
        answer: 0, skill: "Rate of change of an exponential", hints: ["Compare $-24$ with $-6$."], why: "The drop per step shrinks from 24 to 6. Exponential decay slows down as it goes." }
    ]
  });
  var BOUNCE = [[0, 20], [1, 9.8], [2, 5.2], [3, 2.4], [4, 1.3]];

  /* ============================================ 5.11 · Modeling exponential behavior */
  LESSONS.push({
    title: "Modeling exponential behavior",
    blurb: "Book 5.11 · Real data isn't exact. Decide which kind of model fits, then fit it.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "A ball is dropped from 200 cm. Its bounce heights are measured:" + tbl(["bounce", "0", "1", "2", "3"], [["\\text{height (cm)}", 200, 98, 52, 24]]) + "Which model fits better?",
        options: [{ t: "Exponential: each bounce is about half the one before." }, { t: "Linear: it loses about the same height each bounce.", fb: "The drops are 102, 46, 28: nowhere near equal. Look at the ratios instead." }, { t: "Neither: the numbers aren't exact.", fb: "Measurements never are. A model only needs to be close." }],
        answer: 0, skill: "Choose a model", hints: ["Check the differences. Then check the ratios."],
        why: "Ratios: $98 \\div 200 \\approx 0.49$, $52 \\div 98 \\approx 0.53$, $24 \\div 52 \\approx 0.46$. All close to a half: exponential." },
      { type: "learn", kicker: "See it", prompt: "The dots are the measured heights, in tens of cm. Slide $b$ until $y = 20 \\cdot b^x$ runs through them.",
        scene: { type: "plane", x: [-0.5, 5], y: [0, 22], gate: true, labelEveryY: 2, params: { b: { v: 0.9, min: 0.3, max: 0.9, step: 0.1, label: "$b$" } },
          fns: [{ f: function (x, p) { return 20 * Math.pow(p.b, x); }, color: "blue" }], marks: BOUNCE.map(function (p) { return { x: p[0], y: p[1], color: "orange", r: 6 }; }),
          readout: function (st) { var b = st.params.b; return "$y = 20 \\cdot " + nm(b) + "^x$" + (Math.abs(b - 0.5) < 1e-9 ? " ✓ a good fit" : ""); },
          goal: function (st) { return Math.abs(st.params.b - 0.5) < 1e-9; } },
        gate: true,
        then: "$h(n) = 200 \\cdot (0.5)^n$ is a **model**: it doesn't hit every measurement, but it captures how the bounces behave." },
      { type: "num", prompt: "Use the model $h(n) = 200 \\cdot (0.5)^n$ to predict the height of bounce 5, in cm.", post: "cm", answer: 6.25, skill: "Use an exponential model",
        near: [{ v: 12.5, fb: "That's bounce 4. Halve once more." }, { v: 500, fb: "$(0.5)^5$ is $\\frac{1}{32}$, not 2.5." }],
        hints: ["Halve 200 five times."], why: "$200 \\to 100 \\to 50 \\to 25 \\to 12.5 \\to 6.25$." },
      { type: "sort", kicker: "Vary it", prompt: "Which kind of model suits each table?",
        bins: ["Linear", "Exponential"],
        cards: [{ t: "$y$: 5, 10, 20, 40", bin: 1, fb: "Each value is double the last." }, { t: "$y$: 5, 10, 15, 20", bin: 0, fb: "Each value is 5 more than the last." },
                { t: "$y$: 81, 27, 9, 3", bin: 1, fb: "Each is a third of the last." }, { t: "$y$: 81, 71, 61, 51", bin: 0, fb: "Each is 10 less than the last." }, { t: "$y$: 2.0, 3.1, 4.4, 6.8", bin: 1, fb: "The ratios are all about 1.5. The differences keep growing." }],
        skill: "Choose a model", hints: ["Roughly equal differences: linear. Roughly equal ratios: exponential."], why: "Test the differences and the ratios. Real data will only be close." },
      { type: "choice", kicker: "Name it", prompt: "The measured third bounce was 24 cm. The model says 25 cm. What should you conclude?",
        options: [{ t: "The model is good: a small miss is normal for real data." }, { t: "The model is wrong and should be thrown out.", fb: "No model matches measurements exactly. One centimetre out of 25 is close." }, { t: "The measurement must be wrong.", fb: "Models approximate reality, not the other way round." }],
        answer: 0, skill: "Use an exponential model", hints: ["How big is the miss compared with the height?"], why: "A model describes the pattern. Small residuals are expected." },
      { type: "num", kicker: "Use it", prompt: "A lake has 1,000 fish, and the number falls by about 10% a year: $F(t) = 1000 \\cdot (0.9)^t$. About how many after **2 years**?", answer: 810, skill: "Use an exponential model",
        near: [{ v: 800, fb: "It doesn't lose 100 each year. The second year it loses 10% of 900." }, { v: 900, fb: "That's after 1 year." }],
        hints: ["Year 1: 900. Year 2: 90% of 900."], why: "$1000 \\cdot 0.9 \\cdot 0.9 = 810$." }
    ]
  });

  /* ============================================ 5.12 · Reasoning about exponential graphs, part 1 */
  LESSONS.push({
    title: "Reasoning about exponential graphs, part 1",
    blurb: "Book 5.12 · Same start, different factors. Read b from the graph.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "All three curves are $y = 8 \\cdot b^x$ with a different $b$. Which has the **smallest** $b$?",
        scene: graph([-0.5, 6], [0, 9], [{ f: function (x) { return 8 * Math.pow(0.75, x); }, color: "green", label: "green", labelAt: 4.5 }, { f: function (x) { return 8 * Math.pow(0.5, x); }, color: "blue", label: "blue", labelAt: 1.6 }, { f: function (x) { return 8 * Math.pow(0.25, x); }, color: "orange", label: "orange", labelAt: 0.75 }]),
        options: [{ t: "Orange" }, { t: "Blue", fb: "Blue falls, but orange falls faster." }, { t: "Green", fb: "Green falls most slowly: it keeps the most each step, so its $b$ is the largest." }],
        answer: 0, keep: true, skill: "Graphs of exponential decay", hints: ["A smaller factor leaves less each step."], why: "Orange drops fastest: it keeps only a quarter each step. $b = 0.25$." },
      { type: "learn", kicker: "See it", prompt: "Slide $b$ from 0.1 up to 0.9. All the curves start at the same place. **What changes?**",
        scene: { type: "plane", x: [-0.5, 6], y: [0, 9], gate: true, params: { b: { v: 0.5, min: 0.1, max: 0.9, step: 0.1, label: "$b$" } },
          fns: [{ f: function (x, p) { return 8 * Math.pow(p.b, x); }, color: "blue" }], marks: [{ x: 1, y: function (P) { return 8 * P.b; }, color: "orange", r: 6, label: function (P) { return "(1, " + nm(r2(8 * P.b)) + ")"; } }],
          readout: function (st) { return "$y = 8 \\cdot " + nm(st.params.b) + "^x$: after one step, $8 \\times " + nm(st.params.b) + " = " + nm(r2(8 * st.params.b)) + "$"; } },
        gate: true,
        then: "Every curve starts at $(0, 8)$. The point at $x = 1$ is at height $8b$, so it shows the factor directly. The closer $b$ is to 0, the faster the fall. The closer to 1, the flatter." },
      { type: "num", prompt: "A decay graph passes through $(0, 6)$ and $(1, 3)$. What is $b$?", answer: 0.5, skill: "Graphs of exponential decay",
        near: [{ v: 3, fb: "That's the difference. The factor is the ratio: $3 \\div 6$." }, { v: 2, fb: "Divide the *later* value by the earlier one: $3 \\div 6$." }],
        hints: ["Height at $x = 1$ divided by height at $x = 0$."], why: "$b = 3 \\div 6 = \\frac{1}{2}$, so $y = 6 \\cdot \\left(\\frac{1}{2}\\right)^x$." },
      { type: "slots", kicker: "Vary it", prompt: "Match each equation to its description.",
        slots: [{ id: "a", label: "Starts at 100, loses half each step" }, { id: "b", label: "Starts at 100, loses a tenth each step" }, { id: "c", label: "Starts at 50, keeps a tenth each step" }],
        cards: [{ t: "$y = 100 \\cdot (0.5)^x$", slot: "a", fb: "Losing half leaves a factor of 0.5." }, { t: "$y = 100 \\cdot (0.9)^x$", slot: "b", fb: "Losing a tenth leaves nine-tenths: 0.9." },
                { t: "$y = 50 \\cdot (0.1)^x$", slot: "c", fb: "Keeping a tenth is a factor of 0.1." }, { t: "$y = 100 \\cdot (0.1)^x$" }],
        skill: "Graphs of exponential decay", hints: ["The factor is the fraction that is *kept*."], why: "“Loses a tenth” keeps 0.9. “Keeps a tenth” is 0.1. They are very different." },
      { type: "choice", prompt: "Two medicines start at 100 mg. A is $100 \\cdot (0.7)^t$ and B is $100 \\cdot (0.4)^t$. Which leaves the body faster?",
        options: [{ t: "B: it keeps only 40% each hour." }, { t: "A: 0.7 is bigger.", fb: "A bigger factor means *more* remains each hour: A lasts longer." }, { t: "The same: both start at 100.", fb: "Same start, different factors. Their graphs separate at once." }],
        answer: 0, skill: "Graphs of exponential decay", hints: ["Which keeps less each hour?"], why: "After 1 hour: A has 70 mg, B has 40 mg. B's graph is lower." },
      { type: "choice", kicker: "Use it", prompt: "Which equation could match this graph?",
        scene: graph([-0.5, 6], [0, 13], [{ f: function (x) { return 12 * Math.pow(1 / 3, x); }, color: "purple" }], { marks: [{ x: 0, y: 12, color: "orange" }, { x: 1, y: 4, color: "orange" }] }),
        options: [{ t: "$y = 12 \\cdot \\left(\\frac{1}{3}\\right)^x$" }, { t: "$y = 12 \\cdot 3^x$", fb: "That grows. This graph falls from 12 to 4." }, { t: "$y = 4 \\cdot \\left(\\frac{1}{3}\\right)^x$", fb: "The graph crosses the $y$-axis at 12, so $a = 12$." }],
        answer: 0, skill: "Graphs of exponential decay", hints: ["Intercept gives $a$. The next point gives $b$."], why: "$a = 12$ and $b = 4 \\div 12 = \\frac{1}{3}$." }
    ]
  });

  /* ============================================ 5.13 · Reasoning about exponential graphs, part 2 */
  LESSONS.push({
    title: "Reasoning about exponential graphs, part 2",
    blurb: "Book 5.13 · Write the function from two points, and compare two exponentials.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "An exponential graph passes through $(0, 3)$ and $(1, 12)$. What is its growth factor?", answer: 4, skill: "Write an exponential function",
        near: [{ v: 9, fb: "That's the difference. For a factor, divide: $12 \\div 3$." }], hints: ["$12 \\div 3$."], why: "One step right multiplies the height by $12 \\div 3 = 4$." },
      { type: "choice", prompt: "So which function is it?",
        options: [{ t: "$f(x) = 3 \\cdot 4^x$" }, { t: "$f(x) = 4 \\cdot 3^x$", fb: "Check $x = 0$: that gives 4, but the graph is at 3." }, { t: "$f(x) = 12 \\cdot 3^x$", fb: "12 is the value at $x = 1$. The starting value is 3." }],
        answer: 0, skill: "Write an exponential function", hints: ["$a$ is the value at $x = 0$."], why: "$a = 3$, $b = 4$: $f(0) = 3$ and $f(1) = 12$ ✓." },
      { type: "num", kicker: "Vary it", prompt: "Harder: a graph passes through $(0, 10)$ and $(2, 40)$. What is $b$?", answer: 2, skill: "Write an exponential function",
        near: [{ v: 4, fb: "40 is 4 times 10, but that took **two** steps: $b \\cdot b = 4$." }, { v: 15, fb: "The steps multiply. Find $b$ with $b^2 = 4$." }],
        hints: ["Two steps multiply by $b$ twice: $10 \\cdot b^2 = 40$."], why: "$b^2 = 4$, so $b = 2$: $y = 10 \\cdot 2^x$." },
      { type: "plane", kicker: "See it", prompt: "Set $a$ and $b$ so the curve passes through both orange points.",
        x: [-1, 3], y: [0, 20], labelEveryY: 2, aspect: 1, params: { a: { v: 5, min: 1, max: 6, step: 1, label: "$a$" }, b: { v: 1.5, min: 1.5, max: 4, step: 0.5, label: "$b$" } },
        fns: [{ f: expo, color: "blue" }], marks: [{ x: 0, y: 2, color: "orange", r: 6 }, { x: 2, y: 18, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + st.params.a + " \\cdot " + nm(st.params.b) + "^x$"; },
        check: function (st) { var p = st.params; return p.a === 2 && p.b === 3 ? { ok: true } : { ok: false, say: p.a !== 2 ? "The curve must cross the $y$-axis at 2." : "From 2 to 18 in two steps: $b \\cdot b = 9$." }; },
        answer: { params: { a: 2, b: 3 } }, skill: "Write an exponential function", hints: ["$a = 2$. Then $2 \\cdot b^2 = 18$."], why: "$b^2 = 9$, so $b = 3$: $y = 2 \\cdot 3^x$." },
      { type: "choice", prompt: "Compare $f(x) = 50 \\cdot 2^x$ and $g(x) = 400 \\cdot (1.5)^x$. Which is larger at $x = 0$, and which wins in the long run?",
        options: [{ t: "$g$ starts larger, but $f$ overtakes it." }, { t: "$g$ is always larger.", fb: "$g$ starts ahead, 400 to 50, but $f$ doubles while $g$ only grows by half." }, { t: "$f$ is always larger.", fb: "At $x = 0$: $f = 50$ and $g = 400$." }],
        answer: 0, skill: "Compare exponential functions", hints: ["Compare the starting values. Then compare the factors."],
        why: "A bigger factor always wins eventually, whatever the head start. Here $f$ passes $g$ a little after $x = 7$." },
      { type: "choice", kicker: "Use it", prompt: "Account A: \\$1,000 growing 5% a year. Account B: \\$1,200 growing 3% a year. Which statement is true?",
        options: [{ t: "B has more at first. A has more eventually." }, { t: "A always has more.", fb: "At the start A has \\$1,000 and B has \\$1,200." }, { t: "B always has more.", fb: "A's factor, 1.05, beats B's 1.03. Given time, A catches up and passes." }],
        answer: 0, skill: "Compare exponential functions", hints: ["Start values: 1000 and 1200. Factors: 1.05 and 1.03."], why: "$1000 \\cdot (1.05)^t$ against $1200 \\cdot (1.03)^t$: the larger factor wins in the end (after about 10 years)." }
    ]
  });

  /* ============================================ 5.14 · Which one changes faster? */
  LESSONS.push({
    title: "Which one changes faster?",
    blurb: "Book 5.14 · A linear function can lead for a long time. An exponential one always catches it.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "$f(x) = 100x$ and $g(x) = 2^x$. Which is larger at $x = 5$?",
        options: [{ t: "$f$: 500 against 32" }, { t: "$g$: exponential is always bigger", fb: "Not at the start: $g(5) = 32$ and $f(5) = 500$." }, { t: "They are equal.", fb: "$100 \\times 5 = 500$ and $2^5 = 32$." }],
        answer: 0, skill: "Linear vs exponential", hints: ["Work out both."], why: "$f(5) = 500$, $g(5) = 32$. The linear function is far ahead." },
      { type: "table", prompt: "Keep going. Fill in the gaps.", head: ["$x$", "$100x$", "$2^x$"], rows: [[5, 500, 32], [10, null, 1024], [15, 1500, 32768], [20, null, 1048576]],
        answers: [[1, 1, 1000], [3, 1, 2000]], skill: "Linear vs exponential", hints: ["Multiply $x$ by 100."],
        why: "At $x = 10$ it is 1,000 against 1,024: the exponential has just gone ahead. By $x = 20$ it is 2,000 against more than a million." },
      { type: "learn", kicker: "See it", prompt: "Slide $n$ to the end. The bars show $100n$ and $2^n$ on the same scale.",
        scene: { type: "bars", series: [{ name: "100n (adds 100)", f: "100n", color: "green" }, { name: "2ⁿ (doubles)", f: "2^n", color: "blue" }], n: 14, start: 0, gate: true },
        gate: true,
        then: "For most of the way the exponential is too small to see. Then it shoots past and the linear bars shrink to nothing beside it." },
      { type: "learn", kicker: "Name it",
        prompt: "A quantity that grows **exponentially** will eventually overtake one that grows **linearly**, however large the linear one's head start or slope.<br><br>Adding the same amount can't keep up with multiplying by the same amount." },
      { type: "num", kicker: "Vary it", prompt: "What is the first whole number $x$ for which $2^x$ is greater than $100x$?", answer: 10, skill: "Linear vs exponential",
        near: [{ v: 9, fb: "$2^9 = 512$, but $100 \\times 9 = 900$. Not yet." }, { v: 11, fb: "It's already ahead at an earlier $x$. Check $x = 10$." }],
        hints: ["Try $x = 9$ and $x = 10$."], why: "$2^9 = 512 < 900$, but $2^{10} = 1024 > 1000$." },
      { type: "choice", kicker: "Use it", prompt: "Two pay plans. **A:** \\$50,000 a year, plus \\$2,000 more each year. **B:** \\$40,000, growing 6% each year. Over a 40-year career, which pays more in the final years?",
        options: [{ t: "Plan B" }, { t: "Plan A", fb: "A leads at first. But A adds while B multiplies. After about 10 years B passes it, and by year 40 B pays over three times as much." }, { t: "The same", fb: "One is linear, one exponential: they cross once and then separate." }],
        answer: 0, keep: true, skill: "Linear vs exponential", hints: ["Which plan is exponential?"], why: "A reaches \\$130,000 in year 40. B reaches $40000 \\cdot (1.06)^{40}$, about \\$411,000." }
    ]
  });

  /* ============================================ 5.15 · Changes over equal intervals */
  LESSONS.push({
    title: "Changes over equal intervals",
    blurb: "Book 5.15 · Over equal steps, a linear function adds the same amount and an exponential one multiplies by the same amount.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "For $f(x) = 3x + 2$, how much does the output change when $x$ goes up by **2**, from any starting point?", answer: 6, skill: "Equal intervals",
        near: [{ v: 3, fb: "That's for a step of 1. A step of 2 does it twice." }, { v: 8, fb: "$f(2) = 8$ is an output. You want the *change*: try $f(2) - f(0)$." }],
        hints: ["Try $f(2) - f(0)$, then $f(5) - f(3)$."], why: "$f(x + 2) - f(x) = 3(x + 2) + 2 - (3x + 2) = 6$. Always 6, wherever you start." },
      { type: "num", prompt: "For $g(x) = 2^x$, when $x$ goes up by **3**, the output is multiplied by what?", answer: 8, skill: "Equal intervals",
        near: [{ v: 6, fb: "Three steps multiply by 2 three times: $2 \\cdot 2 \\cdot 2$." }, { v: 2, fb: "That's for one step. Three steps: $2^3$." }],
        hints: ["Compare $g(0) = 1$ with $g(3)$. Or $g(1)$ with $g(4)$."], why: "$g(3) \\div g(0) = 8$, and $g(4) \\div g(1) = 16 \\div 2 = 8$. Always 8." },
      { type: "learn", kicker: "See it", prompt: "Why is it always 8? The exponent rules show it.",
        scene: { type: "walk", rows: [
          { m: "\\frac{g(x + 3)}{g(x)}", say: "The output three steps later, divided by the output now." },
          { m: "\\frac{2^{x + 3}}{2^x}", say: "Use the rule $g(x) = 2^x$." },
          { m: "2^{(x + 3) - x}", say: "Quotient rule: subtract the exponents." },
          { m: "2^3 = 8", say: "The $x$ has gone. It doesn't matter where you start." }] },
        gate: true,
        then: "Over equal intervals:<br>a **linear** function changes by equal **differences**;<br>an **exponential** function changes by equal **factors**.<br>This is the test that tells the two apart." },
      { type: "sort", kicker: "Vary it", prompt: "The inputs go up in equal steps. Is the function linear or exponential?",
        bins: ["Linear", "Exponential"],
        cards: [{ t: "Outputs: 7, 10, 13, 16", bin: 0, fb: "Equal differences of 3." }, { t: "Outputs: 7, 14, 28, 56", bin: 1, fb: "Equal factors of 2." },
                { t: "Outputs: 200, 100, 50, 25", bin: 1, fb: "Equal factors of a half." }, { t: "Outputs: 200, 150, 100, 50", bin: 0, fb: "Equal differences of $-50$." }],
        skill: "Equal intervals", hints: ["Subtract neighbours. Then divide neighbours."], why: "Equal differences: linear. Equal ratios: exponential." },
      { type: "num", prompt: "For $h(x) = 5 \\cdot 3^x$, what is the output multiplied by each time $x$ goes up by **2**?", answer: 9, skill: "Equal intervals",
        near: [{ v: 6, fb: "Two steps multiply by 3 twice: $3 \\cdot 3$." }, { v: 45, fb: "The 5 cancels when you compare two outputs. The factor is $3^2$." }],
        hints: ["$3^2$."], why: "$\\frac{5 \\cdot 3^{x + 2}}{5 \\cdot 3^x} = 3^2 = 9$." },
      { type: "choice", kicker: "Use it", prompt: "A savings account grows 5% a year. Over **any** 2-year period, the balance is multiplied by:",
        options: [{ t: "1.1025" }, { t: "1.10", fb: "5% twice isn't 10%: the second year's interest is on a bigger balance. $1.05 \\times 1.05$." }, { t: "2.10", fb: "The factor for one year is 1.05. For two years, multiply it by itself." }],
        answer: 0, skill: "Equal intervals", hints: ["$1.05 \\times 1.05$."], why: "$(1.05)^2 = 1.1025$: a 10.25% gain over two years, whenever they are." }
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
})();
