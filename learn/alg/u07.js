/* ==========================================================================
   Algebra I — Unit 7: Introduction to quadratic functions. See lab/core.js
   for the format.

   Follows OpenStax Algebra 1, Unit 7, lesson for lesson — the readiness check, 7.1 to 7.17 and
   Project 7. Written to the recipe in docs/OEDU_BRILLIANT_CONCEPT.md and the
   five rules at the top of alg/u02.js: teach, learn by doing, super
   interactive, nothing clumsy, never too much.

   Three movements: a new pattern of change, neither linear nor exponential,
   met in areas, patterns and falling objects (7.1–7.7); the same function
   written as a product and as a sum, and what each form shows (7.8–7.14);
   and vertex form, where the graph can be moved by hand (7.15–7.17).

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   questions, figures, feedback and every step here are OEdu's own.

   Nineteen lessons, fourteen skills, four quizzes, and the unit test.
   Standards: CCSS HSF.IF.B.4, HSF.IF.C.7a, HSF.IF.C.8a, HSF.BF.A.1, HSF.BF.B.3, HSF.LE.A.3, HSA.SSE.B.3.
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
    blurb: "Book: Unit 7 Readiness · Multiply binomials, factor a trinomial, and tell linear from exponential.",
    mins: 6, v: 2,
    steps: [
      { type: "expr", kicker: "Check 1 · Multiplying", prompt: "Multiply out $(x + 4)(x + 2)$.", answer: "x^2+6x+8", shown: "x^2 + 6x + 8", form: "simplified", skill: "Multiply binomials",
        keys: [["$x$", "x"], ["$x^2$", "x^2"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "x^2+8", fb: "Add the two middle products: $2x$ and $4x$." }], hints: ["Four products: $x \\cdot x$, $x \\cdot 2$, $4 \\cdot x$, $4 \\cdot 2$."], why: "$x^2 + 2x + 4x + 8 = x^2 + 6x + 8$." },
      { type: "expr", prompt: "Multiply out $(x - 3)(x + 5)$.", answer: "x^2+2x-15", shown: "x^2 + 2x - 15", form: "simplified", skill: "Multiply binomials",
        keys: [["$x$", "x"], ["$x^2$", "x^2"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "x^2-15", fb: "Add the middle products: $5x$ and $-3x$." }, { v: "x^2+2x+15", fb: "$-3 \\times 5 = -15$." }], hints: ["$5x - 3x = 2x$."], why: "$x^2 + 5x - 3x - 15 = x^2 + 2x - 15$." },
      { type: "tiles", kicker: "Check 2 · Factoring", prompt: "Arrange $x^2 + 5x + 6$ into a rectangle: choose $p$ and $q$.",
        mode: "factor", target: { b: 5, c: 6 }, p: 1, q: 1, min: 0, answer: [2, 3], skill: "Factor trinomials",
        hints: ["Two numbers that multiply to 6 and add to 5."], why: "$(x + 2)(x + 3)$." },
      { type: "expr", prompt: "Factor $x^2 - x - 12$.", answer: "(x-4)(x+3)", shown: "(x - 4)(x + 3)", form: "factored", skill: "Factor trinomials",
        keys: [["$x$", "x"], ["$x^2$", "x^2"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]], near: [{ v: "(x+4)(x-3)", fb: "That gives $+x$ in the middle. The larger number must be negative." }],
        hints: ["Multiply to $-12$, add to $-1$."], why: "$-4 \\times 3 = -12$ and $-4 + 3 = -1$." },
      { type: "choice", kicker: "Check 3 · Linear or exponential", prompt: "Which kind of function is this?" + tbl(["$x$", "0", "1", "2", "3"], [["y", 5, 15, 45, 135]]),
        options: [{ t: "Exponential: it triples each step." }, { t: "Linear: it goes up each step.", fb: "It goes up by 10, then 30, then 90: not by equal amounts. Look at the ratios." }],
        answer: 0, keep: true, skill: "Linear or exponential", hints: ["Differences or ratios: which are constant?"], why: "$15 \\div 5 = 45 \\div 15 = 3$: equal ratios." },
      { type: "choice", prompt: "$f(x) = 50x$ and $g(x) = 2^x$. Which is larger for large values of $x$?",
        options: [{ t: "$g$: exponential growth always overtakes linear." }, { t: "$f$: 50 is bigger than 2.", fb: "$f$ leads for a while, but $g(10) = 1024$ already beats $f(10) = 500$." }],
        answer: 0, keep: true, skill: "Linear or exponential", hints: ["Try $x = 10$."], why: "Multiplying by 2 again and again beats adding 50 again and again, eventually." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 7.1**. If **check 1** slipped, see Unit 6's lesson 6.2. For **check 2**, lesson 6.5. For **check 3**, Unit 5's lessons 5.3 and 5.14.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  var KEYS_Q = [["$x$", "x"], ["$x^2$", "x^2"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]];
  function rock(t) { return t >= 0 && t <= 5 ? 400 - 16 * t * t : NaN; }
  function ball(t) { return t >= 0 && t <= 5.1 ? 5 + 80 * t - 16 * t * t : NaN; }
  function arc(x) { return 6 * x - x * x; }

  /* ============================================ 7.1 · Patterns of change */
  LESSONS.push({
    title: "Patterns of change",
    blurb: "Book 7.1 · A quantity that rises, peaks and falls: neither linear nor exponential.",
    mins: 8, v: 2,
    steps: [
      { type: "table", kicker: "Try it", prompt: "You have **20 m of fence** for a rectangular pen, so length + width = 10. Fill in the areas.",
        head: ["length", "width", "area"], rows: [[1, 9, 9], [2, 8, null], [3, 7, null], [5, 5, null], [7, 3, null], [9, 1, 9]],
        answers: [[1, 2, 16], [2, 2, 21], [3, 2, 25], [4, 2, 21]], skill: "A new pattern of change", hints: ["Area = length × width."],
        why: "9, 16, 21, 25, 21, 9: the area climbs, peaks at $5 \\times 5$, and comes back down." },
      { type: "rectangle", kicker: "See it", prompt: "Same fence: the perimeter must stay 20. Find the pen with the **largest area**.",
        l: { v: 8, min: 1, max: 9 }, w: { v: 2, min: 1, max: 9 }, target: { P: 20, A: 25 }, answer: [5, 5], skill: "A new pattern of change",
        hints: ["Keep $l + w = 10$. Try making the sides more equal."], why: "The square, $5 \\times 5$, encloses the most: 25 m²." },
      { type: "choice", prompt: "Here are those areas plotted against the length. What kind of pattern is it?",
        scene: { type: "plane", x: [0, 11], y: [0, 28], labelEveryY: 4, marks: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (l) { return { x: l, y: l * (10 - l), color: "blue", r: 6 }; }) },
        options: [{ t: "Neither linear nor exponential: it rises, then falls." }, { t: "Linear", fb: "A linear pattern would lie on a straight line and never turn round." }, { t: "Exponential", fb: "An exponential pattern keeps growing (or keeps shrinking). It doesn't turn round." }],
        answer: 0, skill: "A new pattern of change", hints: ["Does it keep going the same way?"], why: "The dots make a symmetric arch. This is a new kind of relationship." },
      { type: "table", kicker: "Vary it", prompt: "Look at how the area **changes** as the length goes up by 1. Then how those changes change.",
        head: ["area", "9", "16", "21", "24", "25"], rows: [["\\text{change}", "", 7, null, null, null]], answers: [[0, 3, 5], [0, 4, 3], [0, 5, 1]], skill: "A new pattern of change",
        hints: ["$21 - 16$, then $24 - 21$, then $25 - 24$."], why: "The changes are 7, 5, 3, 1. They aren't constant (so not linear), but they go down by 2 each time: the *changes of the changes* are constant." },
      { type: "learn", kicker: "Name it",
        prompt: "This is a **quadratic** relationship. Its first differences aren't constant, but its **second differences** are.<br><br>For the pen, the area is $x(10 - x) = 10x - x^2$, where $x$ is the length. The $x^2$ is what makes it quadratic." },
      { type: "expr", prompt: "A different fence gives length + width = 12. Write the area in terms of the length $x$.", answer: "x(12-x)", shown: "x(12 - x)", skill: "Write a quadratic expression", keys: KEYS_Q,
        near: [{ v: "12x", fb: "The width isn't 12. It's what's left of 12 after the length: $12 - x$." }, { v: "x+12-x", fb: "Area multiplies the sides." }],
        hints: ["If the length is $x$, the width is $12 - x$."], why: "Area $= x(12 - x) = 12x - x^2$." },
      { type: "num", kicker: "Use it", prompt: "With **40 m** of fence, what is the largest area you can enclose?", post: "m²", answer: 100, skill: "A new pattern of change",
        near: [{ v: 400, fb: "That would be a $20 \\times 20$ square, which needs 80 m of fence." }, { v: 10, fb: "10 m is the side. What area does that give?" }],
        hints: ["Length + width = 20. The best pen is a square."], why: "A $10 \\times 10$ square: 100 m²." }
    ]
  });

  /* ============================================ 7.2 · Quadratic relationships */
  LESSONS.push({
    title: "Introduction to quadratic relationships",
    blurb: "Book 7.2 · Patterns built from squares, and the expressions that count them.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A pattern of dots: step 1 is a $1 \\times 1$ square, step 2 is $2 \\times 2$, step 3 is $3 \\times 3$. How many dots in **step 10**?", answer: 100, skill: "Quadratic patterns",
        near: [{ v: 20, fb: "The square is 10 by 10: multiply, don't add." }, { v: 40, fb: "That's the perimeter of the square. Count all the dots inside." }],
        hints: ["A $10 \\times 10$ square."], why: "$10 \\times 10 = 100$. Step $n$ has $n^2$ dots." },
      { type: "table", prompt: "Fill in the pattern, and the change from each step to the next.", head: ["step $n$", "dots $n^2$", "change"], rows: [[1, 1, ""], [2, 4, 3], [3, null, null], [4, null, null], [5, null, null]],
        answers: [[2, 1, 9], [2, 2, 5], [3, 1, 16], [3, 2, 7], [4, 1, 25], [4, 2, 9]], skill: "Quadratic patterns", hints: ["Dots: $n \\times n$. Change: this row's dots minus the row above."],
        why: "Dots 1, 4, 9, 16, 25. Changes 3, 5, 7, 9: each change is 2 more than the last." },
      { type: "learn", kicker: "Name it",
        prompt: "An expression with a **squared** variable as its highest power, like $n^2$, $n^2 + 2n$ or $3x^2 - 5$, is a **quadratic expression**.<br><br>Linear: grows by a constant amount. Exponential: grows by a constant factor. **Quadratic: its growth itself grows by a constant amount.**" },
      { type: "sort", kicker: "Vary it", prompt: "Linear, quadratic or exponential?",
        bins: ["Linear", "Quadratic", "Exponential"],
        cards: [{ t: "$3n + 1$", bin: 0, fb: "The highest power of $n$ is 1." }, { t: "$n^2 + 2$", bin: 1, fb: "The highest power is $n^2$." }, { t: "$2^n$", bin: 2, fb: "The variable is the exponent." },
                { t: "$n(n + 1)$", bin: 1, fb: "Multiply it out: $n^2 + n$." }, { t: "$5 \\cdot 3^n$", bin: 2, fb: "The variable is the exponent." }, { t: "$7 - n$", bin: 0, fb: "The highest power of $n$ is 1." }],
        skill: "Quadratic patterns", hints: ["Where is the variable: to the first power, squared, or in the exponent?"], why: "$n$: linear. $n^2$: quadratic. $b^n$: exponential." },
      { type: "num", prompt: "A pattern has $n^2 + 2n$ tiles in step $n$. How many in step 4?", answer: 24, skill: "Quadratic patterns",
        near: [{ v: 16, fb: "That's $n^2$ alone. Add $2n = 8$." }, { v: 12, fb: "$4^2$ is 16, not 8." }], hints: ["$4^2 + 2(4)$."], why: "$16 + 8 = 24$." },
      { type: "choice", kicker: "Use it", prompt: "A pattern has 2, 5, 10, 17 tiles in steps 1 to 4. Which expression counts them?",
        options: [{ t: "$n^2 + 1$" }, { t: "$3n - 1$", fb: "That gives 2, 5, 8, 11: right at first, then too small." }, { t: "$2^n$", fb: "That gives 2, 4, 8, 16." }, { t: "$n^2$", fb: "That gives 1, 4, 9, 16: each one short." }],
        answer: 0, skill: "Quadratic patterns", hints: ["Compare with the squares: 1, 4, 9, 16."], why: "Each is one more than a square: $1 + 1$, $4 + 1$, $9 + 1$, $16 + 1$." }
    ]
  });

  /* ============================================ 7.3 · Is it quadratic? */
  LESSONS.push({
    title: "Determining if a function is quadratic",
    blurb: "Book 7.3 · The test: constant second differences.",
    mins: 7, v: 2,
    steps: [
      { type: "table", kicker: "Try it", prompt: "For $y = x^2 + 3x$, fill in the first differences, then the second differences.",
        head: ["$y$", "0", "4", "10", "18", "28"], rows: [["\\text{1st difference}", "", 4, null, null, null], ["\\text{2nd difference}", "", "", 2, null, null]],
        answers: [[0, 3, 6], [0, 4, 8], [0, 5, 10], [1, 4, 2], [1, 5, 2]], skill: "Second differences", hints: ["First differences: subtract neighbours in the top row.", "Second differences: subtract neighbours in the row you just filled."],
        why: "First differences 4, 6, 8, 10. Second differences 2, 2, 2: constant." },
      { type: "learn", kicker: "Name it",
        prompt: "With inputs going up in equal steps:<br><br>**Linear:** the first differences are constant.<br>**Quadratic:** the **second** differences are constant.<br>**Exponential:** the ratios are constant." },
      { type: "sort", prompt: "Each list is the outputs for $x = 1, 2, 3, 4$. What kind of function?",
        bins: ["Linear", "Quadratic", "Exponential"],
        cards: [{ t: "2, 5, 8, 11", bin: 0, fb: "Differences 3, 3, 3." }, { t: "1, 4, 9, 16", bin: 1, fb: "Differences 3, 5, 7. Second differences 2, 2." }, { t: "3, 6, 12, 24", bin: 2, fb: "Each is double the last." },
                { t: "0, 2, 6, 12", bin: 1, fb: "Differences 2, 4, 6. Second differences 2, 2." }, { t: "5, 3, 1, $-1$", bin: 0, fb: "Differences $-2$, $-2$, $-2$." }],
        skill: "Second differences", hints: ["Find the differences. If they aren't constant, find *their* differences, or try ratios."], why: "First differences, second differences, ratios: one of the three will be constant." },
      { type: "num", kicker: "Vary it", prompt: "This sequence is quadratic. What comes next?$$2, \\; 5, \\; 10, \\; 17, \\; \\ldots$$", answer: 26, skill: "Second differences",
        near: [{ v: 24, fb: "The differences are 3, 5, 7. They keep growing by 2, so the next one is 9, not 7." }],
        hints: ["Differences: 3, 5, 7. What's the next difference?"], why: "The next difference is 9: $17 + 9 = 26$." },
      { type: "choice", prompt: "Is $f(x) = x(x + 4)$ a quadratic function?",
        options: [{ t: "Yes: multiplied out, it is $x^2 + 4x$." }, { t: "No: there is no $x^2$ in it.", fb: "Multiply it out: $x \\cdot x = x^2$." }, { t: "No: it's a product, so it's exponential.", fb: "Exponential means the variable is in the exponent. Here $x$ is multiplied by another $x$." }],
        answer: 0, skill: "Second differences", hints: ["Use the distributive property."], why: "$x(x + 4) = x^2 + 4x$. A product of two linear factors is quadratic." },
      { type: "num", kicker: "Use it", prompt: "When $n$ people all shake hands with each other, there are $\\frac{n(n - 1)}{2}$ handshakes: a quadratic. How many handshakes for **6** people?", answer: 15, skill: "Quadratic patterns",
        near: [{ v: 30, fb: "Each handshake has been counted twice. Halve it." }, { v: 36, fb: "Nobody shakes their own hand: it's $6 \\times 5$, then halved." }],
        hints: ["$\\frac{6 \\times 5}{2}$."], why: "$\\frac{6 \\cdot 5}{2} = 15$." }
    ]
  });

  /* ============================================ 7.4 · Quadratic vs exponential */
  LESSONS.push({
    title: "Comparing quadratic and exponential functions",
    blurb: "Book 7.4 · Squaring grows fast. Doubling grows faster, in the end.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "Which is larger at $x = 3$: $x^2$ or $2^x$?",
        options: [{ t: "$x^2$: 9 against 8" }, { t: "$2^x$: exponentials are always bigger", fb: "$3^2 = 9$ and $2^3 = 8$. Not yet." }, { t: "They are equal.", fb: "9 and 8: close, but not equal." }],
        answer: 0, skill: "Quadratic vs exponential", hints: ["Work out both."], why: "$3^2 = 9$ and $2^3 = 8$." },
      { type: "table", prompt: "Keep going.", head: ["$x$", "$x^2$", "$2^x$"], rows: [[3, 9, 8], [4, null, null], [5, null, null], [6, null, null], [10, 100, 1024]],
        answers: [[1, 1, 16], [1, 2, 16], [2, 1, 25], [2, 2, 32], [3, 1, 36], [3, 2, 64]], skill: "Quadratic vs exponential", hints: ["Square the number. Then double from the row above."],
        why: "They tie at $x = 4$ (16 each). After that $2^x$ is ahead: 32 against 25, 64 against 36, 1,024 against 100." },
      { type: "learn", kicker: "See it", prompt: "Slide $n$ to the end and compare the two.",
        scene: { type: "bars", series: [{ name: "n² (squares)", f: "n^2", color: "green" }, { name: "2ⁿ (doubles)", f: "2^n", color: "blue" }], n: 12, start: 0, gate: true }, gate: true,
        then: "The quadratic grows quickly, and for a while it even leads. But its growth only *adds* more each step. The exponential *multiplies*. **Exponential growth eventually overtakes quadratic growth, always.**" },
      { type: "num", kicker: "Vary it", prompt: "Give the quadratic a huge head start: compare $100x^2$ with $2^x$. At $x = 15$, $2^x = 32768$. What is $100x^2$ there?", answer: 22500, skill: "Quadratic vs exponential",
        near: [big(22500), { v: 3000, fb: "Square first: $15^2 = 225$. Then multiply by 100." }], hints: ["$15^2 = 225$."], why: "$100 \\cdot 225 = 22500$, already less than 32,768. Even a factor of 100 only delays the exponential." },
      { type: "order", prompt: "Order these from slowest-growing to fastest-growing **in the long run**.",
        items: ["$1000x$", "$x^2$", "$2^x$"], skill: "Quadratic vs exponential", why: "Linear, then quadratic, then exponential. For large enough $x$, each one overtakes everything before it." },
      { type: "choice", kicker: "Use it", prompt: "A pond weed covers $A(d) = d^2$ m² after $d$ days in one model, and $B(d) = 2^d$ m² in another. The pond is 1,000 m². Which model fills it first?",
        options: [{ t: "$B$: it passes 1,000 on day 10." }, { t: "$A$: squaring is faster.", fb: "$A$ needs $d^2 \\ge 1000$: about day 32. $B$ needs $2^d \\ge 1000$: day 10." }, { t: "They fill it on the same day.", fb: "$A(10) = 100$ but $B(10) = 1024$." }],
        answer: 0, skill: "Quadratic vs exponential", hints: ["When is $2^d$ over 1,000? When is $d^2$?"], why: "$2^{10} = 1024$. $d^2$ doesn't reach 1,000 until $d = 32$." }
    ]
  });

  /* ============================================ 7.5 · Building quadratic functions, part 1 */
  LESSONS.push({
    title: "Building quadratic functions to describe situations, part 1",
    blurb: "Book 7.5 · A falling object: the distance fallen is 16t² feet.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A rock is dropped from a cliff. After 1 second it has fallen **16 ft**, after 2 seconds **64 ft**, after 3 seconds **144 ft**. How far after **4** seconds?", post: "ft", answer: 256, skill: "Falling objects",
        near: [{ v: 224, fb: "The gaps are 48, 80, … and they keep growing by 32. The next gap is 112." }, { v: 64, fb: "It doesn't fall 16 ft every second: it speeds up." }],
        hints: ["Divide each distance by 16: 1, 4, 9, … What are those numbers?"], why: "$16 \\cdot 1$, $16 \\cdot 4$, $16 \\cdot 9$, so next is $16 \\cdot 16 = 256$. The distances are 16 times the square numbers." },
      { type: "learn", kicker: "Name it",
        prompt: "The distance a dropped object falls is a **quadratic function of time**:$$d(t) = 16t^2$$with $t$ in seconds and $d$ in feet. Gravity makes it fall faster every second, so equal times do not mean equal distances." },
      { type: "num", prompt: "Use $d(t) = 16t^2$: how far does the rock fall in **2.5** seconds?", post: "ft", answer: 100, skill: "Falling objects",
        near: [{ v: 40, fb: "Square 2.5 first: $2.5^2 = 6.25$." }, { v: 1600, fb: "Only $t$ is squared, not the 16." }], hints: ["$2.5^2 = 6.25$."], why: "$16 \\times 6.25 = 100$ ft." },
      { type: "expr", kicker: "Vary it", prompt: "The cliff is **400 ft** high. Write the rock's **height above the ground** after $t$ seconds.", answer: "400-16t^2", shown: "400 - 16t^2", skill: "Falling objects",
        keys: [["$t$", "t"], ["$t^2$", "t^2"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "16t^2", fb: "That's how far it has fallen. Its height is what's left of the 400 ft." }, { v: "400+16t^2", fb: "It's falling: the height goes down." }],
        hints: ["Start at 400 and take away the distance fallen."], why: "$h(t) = 400 - 16t^2$." },
      { type: "learn", kicker: "See it", prompt: "Slide $t$ and watch the rock's height. **When does it hit the ground?**",
        scene: { type: "plane", x: [0, 6], y: [0, 420], gridY: 50, labelEveryY: 100, aspect: 0.85, axisLabels: ["t", "h"], gate: true,
          params: { t: { v: 0, min: 0, max: 5, step: 0.5, label: "$t$ (s)" } }, fns: [{ f: rock, color: "blue" }],
          marks: [{ x: function (P) { return P.t; }, y: function (P) { return rock(P.t); }, color: "orange", r: 7 }],
          readout: function (st) { var t = st.params.t; return "$h(" + nm(t) + ") = 400 - 16(" + nm(t) + ")^2 = " + nm(rock(t)) + "$ ft"; }, goal: function (st) { return st.params.t === 5; } },
        gate: true,
        then: "$h(5) = 0$: it lands after 5 seconds. Notice the graph is nearly flat at first and steep at the end: the rock barely moves in the first half-second and is falling fast by the last." },
      { type: "num", kicker: "Use it", prompt: "A coin is dropped from a bridge **144 ft** above a river: $h(t) = 144 - 16t^2$. After how many seconds does it reach the water?", post: "s", answer: 3, skill: "Falling objects",
        near: [{ v: 9, fb: "$t^2 = 9$. Now take the square root." }], hints: ["Solve $144 - 16t^2 = 0$.", "$16t^2 = 144$, so $t^2 = 9$."], why: "$t^2 = 9$, so $t = 3$ seconds." }
    ]
  });

  /* ============================================ 7.6 · Building quadratic functions, part 2 */
  LESSONS.push({
    title: "Building quadratic functions to describe situations, part 2",
    blurb: "Book 7.6 · Launch something upward: a starting height, a launch speed, and gravity pulling back.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A ball is launched straight up from **5 ft** at **80 ft per second**. If there were **no gravity**, how high would it be after 2 seconds?", post: "ft", answer: 165, skill: "Projectile height",
        near: [{ v: 160, fb: "That's the distance travelled. It started 5 ft up." }], hints: ["It rises 80 ft each second, from 5 ft."], why: "$5 + 80(2) = 165$ ft. Without gravity the height is linear." },
      { type: "num", prompt: "But gravity pulls it back by $16t^2$ feet. What is its real height after 2 seconds?", post: "ft", answer: 101, skill: "Projectile height",
        near: [{ v: 229, fb: "Gravity pulls it *down*: subtract $16t^2$." }, { v: 133, fb: "$16t^2$ is $16 \\times 4 = 64$, not 32." }], hints: ["$165 - 16(2)^2$."], why: "$165 - 64 = 101$ ft." },
      { type: "learn", kicker: "Name it",
        prompt: "The height of a launched object is$$h(t) = 5 + 80t - 16t^2$$The 5 is the **starting height**.<br>The $80t$ is the **launch**: 80 ft upward each second.<br>The $-16t^2$ is **gravity**, pulling down more and more." },
      { type: "table", prompt: "Fill in the ball's height.", head: ["$t$ (s)", "$h(t)$ (ft)"], rows: [[0, 5], [1, null], [2, 101], [3, null], [4, 69], [5, null]],
        answers: [[1, 1, 69], [3, 1, 101], [5, 1, 5]], skill: "Projectile height", hints: ["$5 + 80t - 16t^2$ for each $t$."],
        why: "$h(1) = 69$, $h(3) = 5 + 240 - 144 = 101$, $h(5) = 5 + 400 - 400 = 5$. The heights are symmetric: up, then back down the same way." },
      { type: "learn", kicker: "See it", prompt: "Slide $t$. **Find the moment the ball is highest.**",
        scene: { type: "plane", x: [0, 6], y: [0, 115], gridY: 10, labelEveryY: 20, aspect: 0.85, axisLabels: ["t", "h"], gate: true,
          params: { t: { v: 0, min: 0, max: 5, step: 0.5, label: "$t$ (s)" } }, fns: [{ f: ball, color: "blue" }],
          marks: [{ x: function (P) { return P.t; }, y: function (P) { return ball(P.t); }, color: "orange", r: 7 }],
          readout: function (st) { var t = st.params.t; return "$h(" + nm(t) + ") = " + nm(ball(t)) + "$ ft" + (t === 2.5 ? " ← the highest point" : ""); }, goal: function (st) { return st.params.t === 2.5; } },
        gate: true,
        then: "The peak is at $t = 2.5$ s, where $h = 105$ ft: halfway between $t = 0$ and $t = 5$, the two times the ball is at 5 ft. A quadratic graph is symmetric about its highest point." },
      { type: "choice", kicker: "Use it", prompt: "A different ball follows $h(t) = 3 + 48t - 16t^2$. What do the 3 and the 48 tell you?",
        options: [{ t: "It starts 3 ft up and is launched at 48 ft per second." }, { t: "It starts 48 ft up and falls for 3 seconds.", fb: "The constant term is the height at $t = 0$. The coefficient of $t$ is the launch speed." }, { t: "It reaches 48 ft after 3 seconds.", fb: "$h(3) = 3 + 144 - 144 = 3$. The numbers describe the start, not a later moment." }],
        answer: 0, skill: "Projectile height", hints: ["Put $t = 0$ to see what the 3 is."], why: "$h(0) = 3$: starting height. $48t$: upward launch at 48 ft/s. $-16t^2$: gravity." }
    ]
  });
  // A curve drawn as short segments, so it can follow dragged points.
  function curveSegs(f, x0, x1, color) {
    var out = [], n = 60, px = x0, py = f(x0);
    for (var i = 1; i <= n; i++) {
      var x = x0 + (x1 - x0) * i / n, y = f(x);
      if (isFinite(py) && isFinite(y) && Math.abs(y) < 80 && Math.abs(py) < 80) out.push([px, py, x, y, color || "blue"]);
      px = x; py = y;
    }
    return out;
  }
  function f26(x) { return (x - 2) * (x - 6); }
  function f15(x) { return (x - 1) * (x - 5); }
  function par(x, p) { return p.a * x * x + p.c; }

  /* ============================================ 7.7 · Domain, range, vertex and zeros */
  LESSONS.push({
    title: "Domain, range, vertex, and zeros of quadratic functions",
    blurb: "Book 7.7 · The turning point is the vertex. Where the graph meets the axis are the zeros.",
    mins: 7, v: 2,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "A fountain's jet of water follows $h(x) = 6x - x^2$: its height, in feet, at a distance $x$ feet from the nozzle. **Click the highest point of the jet.**",
        x: [-1, 8], y: [-1, 10], axisLabels: ["x", "h"], click: "point", answer: { point: [3, 9] }, skill: "Vertex and zeros", fns: [{ f: arc, color: "blue" }],
        clickFb: function (c) { return arc(c[0]) === c[1] ? "That's on the jet, at height " + nm(c[1]) + ". It gets higher." : "Click a point on the curve."; },
        hints: ["The top of the arch."], why: "$(3, 9)$: 3 ft out, the water is 9 ft high." },
      { type: "learn", kicker: "Name it",
        prompt: "The graph of a quadratic function is a **parabola**.<br><br>Its turning point is the **vertex**: the maximum if the parabola opens downward, the minimum if it opens upward.<br><br>The **zeros** of the function are the inputs where the output is 0: the $x$-intercepts of the graph." },
      { type: "numbers", prompt: "What are the zeros of $h(x) = 6x - x^2$?", scene: graph([-1, 8], [-1, 10], [{ f: arc, color: "blue" }], { axisLabels: ["x", "h"] }),
        answer: [0, 6], skill: "Vertex and zeros", placeholder: "e.g. 1, 4", hints: ["Where does the curve meet the horizontal axis?"], why: "$h(0) = 0$ and $h(6) = 36 - 36 = 0$: the nozzle, and where the water lands." },
      { type: "choice", kicker: "Vary it", prompt: "The jet leaves the nozzle at $x = 0$ and lands at $x = 6$. What domain makes sense for $h$?",
        options: [{ t: "$0 \\le x \\le 6$" }, { t: "All real numbers", fb: "The formula works for any $x$, but the water only exists between the nozzle and where it lands." }, { t: "$0 \\le x \\le 9$", fb: "9 is the greatest height, an output." }],
        answer: 0, skill: "Domain and range of a quadratic", hints: ["Where is there actually water?"], why: "The situation limits the inputs to $0 \\le x \\le 6$." },
      { type: "choice", prompt: "And the range, on that domain?",
        options: [{ t: "$0 \\le h \\le 9$" }, { t: "$h \\le 9$", fb: "That's the range of the whole parabola. On this domain the water is never below the ground." }, { t: "$0 \\le h \\le 6$", fb: "The vertex is at height 9." }],
        answer: 0, skill: "Domain and range of a quadratic", hints: ["Lowest and highest outputs."], why: "From ground level, 0, up to the vertex, 9." },
      { type: "pair", kicker: "Use it", prompt: "This parabola opens **upward**. What are the coordinates of its vertex?", scene: graph([-2, 6], [-3, 8], [{ f: function (x) { return (x - 1) * (x - 3); }, color: "green" }]),
        answer: [2, -1], skill: "Vertex and zeros", near: [{ v: [-1, 2], fb: "Right numbers, wrong order: $x$ first." }, { v: [0, 3], fb: "That's the $y$-intercept. The vertex is the lowest point." }],
        hints: ["The lowest point of the curve."], why: "$(2, -1)$ is the minimum. Its zeros are 1 and 3, and the vertex sits halfway between them." }
    ]
  });

  /* ============================================ 7.8 · Equivalent quadratic expressions */
  LESSONS.push({
    title: "Equivalent quadratic expressions",
    blurb: "Book 7.8 · A product of two sides and a sum of areas are the same quantity, written two ways.",
    mins: 7, v: 2,
    steps: [
      { type: "learn", kicker: "Try it", prompt: "A rectangle is $x + 5$ wide and $x + 2$ tall. Fill in the area of each part.",
        scene: { type: "tiles", mode: "area", rows: ["x", "2"], cols: ["x", "5"], cells: [["x^2", "5x"], ["2x", "10"]], readout: "$(x + 2)(x + 5) = x^2 + 5x + 2x + 10 = x^2 + 7x + 10$", gate: true }, gate: true,
        then: "The whole area can be written as a **product**, $(x + 2)(x + 5)$, or as a **sum**, $x^2 + 7x + 10$. They are **equivalent expressions**: equal for every $x$." },
      { type: "expr", prompt: "Write $x(x + 5)$ as a sum.", answer: "x^2+5x", shown: "x^2 + 5x", form: "simplified", skill: "Equivalent quadratic expressions", keys: KEYS_Q,
        near: [{ v: "x^2+5", fb: "The $x$ multiplies the 5 as well." }, { v: "2x+5", fb: "$x \\cdot x$ is $x^2$, not $2x$." }], hints: ["Distribute: $x \\cdot x$ and $x \\cdot 5$."], why: "$x \\cdot x + x \\cdot 5 = x^2 + 5x$." },
      { type: "learn", kicker: "See it", prompt: "Are $(x + 2)^2$ and $x^2 + 4$ equivalent? Test some values of $x$.",
        scene: { type: "tester", a: "(x + 2)^2", b: "x^2 + 4", x: { v: 0, min: -5, max: 5 }, goal: "differ" }, gate: true,
        then: "They agree at $x = 0$ and nowhere else. One counter-example is enough: they are **not** equivalent. Squaring a sum is not the same as squaring each part." },
      { type: "expr", prompt: "So what is $(x + 2)^2$, written as a sum?", answer: "x^2+4x+4", shown: "x^2 + 4x + 4", form: "simplified", skill: "Equivalent quadratic expressions", keys: KEYS_Q,
        near: [{ v: "x^2+4", fb: "That's the pair you just showed are different. Write $(x + 2)(x + 2)$ and find all four products." }, { v: "x^2+2x+4", fb: "There are two middle products, each $2x$." }],
        hints: ["$(x + 2)(x + 2)$."], why: "$x^2 + 2x + 2x + 4 = x^2 + 4x + 4$." },
      { type: "slots", kicker: "Vary it", prompt: "Match each product to its equivalent sum.",
        slots: [{ id: "a", label: "$x(x - 3)$" }, { id: "b", label: "$(x + 1)(x + 3)$" }, { id: "c", label: "$(x - 1)^2$" }, { id: "d", label: "$2x(x + 4)$" }],
        cards: [{ t: "$x^2 - 3x$", slot: "a", fb: "$x \\cdot x$ and $x \\cdot (-3)$." }, { t: "$x^2 + 4x + 3$", slot: "b", fb: "$x^2 + 3x + x + 3$." }, { t: "$x^2 - 2x + 1$", slot: "c", fb: "$(x - 1)(x - 1)$: two middle products of $-x$." }, { t: "$2x^2 + 8x$", slot: "d", fb: "$2x \\cdot x$ and $2x \\cdot 4$." }, { t: "$x^2 + 1$" }],
        skill: "Equivalent quadratic expressions", hints: ["Multiply each product out."], why: "Each product expands to exactly one of the sums." },
      { type: "choice", kicker: "Use it", prompt: "A square photo of side $x$ gets a frame that adds 3 cm to each side's length. Which expressions give the framed area?",
        options: [{ t: "Both $(x + 3)^2$ and $x^2 + 6x + 9$" }, { t: "Only $(x + 3)^2$", fb: "$x^2 + 6x + 9$ is the same thing multiplied out." }, { t: "$x^2 + 9$", fb: "That leaves out the two strips of $3x$ along the sides." }],
        answer: 0, skill: "Equivalent quadratic expressions", hints: ["Expand $(x + 3)^2$."], why: "$(x + 3)^2 = x^2 + 6x + 9$: the photo, two strips of $3x$, and a $3 \\times 3$ corner." }
    ]
  });

  /* ============================================ 7.9 · Standard form and factored form */
  LESSONS.push({
    title: "Standard form and factored form",
    blurb: "Book 7.9 · Two names for two ways of writing the same quadratic.",
    mins: 6, v: 2,
    steps: [
      { type: "expr", kicker: "Try it", prompt: "Multiply out $(x - 3)(x - 4)$.", answer: "x^2-7x+12", shown: "x^2 - 7x + 12", form: "simplified", skill: "Standard and factored form", keys: KEYS_Q,
        near: [{ v: "x^2-7x-12", fb: "$-3 \\times -4$ is $+12$." }, { v: "x^2+12", fb: "Include the middle products: $-4x$ and $-3x$." }, { v: "x^2-x+12", fb: "$-4x - 3x = -7x$." }],
        hints: ["$x \\cdot x$, $x \\cdot (-4)$, $-3 \\cdot x$, $-3 \\cdot (-4)$."], why: "$x^2 - 4x - 3x + 12 = x^2 - 7x + 12$." },
      { type: "learn", kicker: "Name it",
        prompt: "**Standard form:** $ax^2 + bx + c$. A sum of terms, highest power first.<br><br>**Factored form:** a product of factors, such as $(x - 3)(x - 4)$ or $x(x + 5)$.<br><br>The same quadratic can be written either way. Each form makes different things easy to see." },
      { type: "sort", prompt: "Which form is each expression in?",
        bins: ["Standard form", "Factored form"],
        cards: [{ t: "$x^2 + 5x + 6$", bin: 0, fb: "A sum of terms." }, { t: "$(x + 1)(x - 4)$", bin: 1, fb: "A product of two factors." }, { t: "$x(x + 3)$", bin: 1, fb: "A product: $x$ times $(x + 3)$." },
                { t: "$3x^2 - 2$", bin: 0, fb: "A sum of terms, with $b = 0$." }, { t: "$(2x - 1)(x + 7)$", bin: 1, fb: "A product of two factors." }],
        skill: "Standard and factored form", hints: ["Is it a sum of terms, or a product?"], why: "Sum: standard. Product: factored." },
      { type: "expr", kicker: "Vary it", prompt: "Write $(2x + 1)(x - 3)$ in standard form.", answer: "2x^2-5x-3", shown: "2x^2 - 5x - 3", form: "simplified", skill: "Standard and factored form", keys: KEYS_Q,
        near: [{ v: "2x^2-3", fb: "Add the middle products: $-6x$ and $x$." }, { v: "2x^2-7x-3", fb: "$-6x + x = -5x$." }], hints: ["$2x \\cdot x$, $2x \\cdot (-3)$, $1 \\cdot x$, $1 \\cdot (-3)$."], why: "$2x^2 - 6x + x - 3 = 2x^2 - 5x - 3$." },
      { type: "expr", prompt: "Now the other way: write $x^2 + 9x + 20$ in factored form.", answer: "(x+4)(x+5)", shown: "(x + 4)(x + 5)", form: "factored", skill: "Standard and factored form", keys: KEYS_Q,
        hints: ["Two numbers that multiply to 20 and add to 9."], why: "$4 \\times 5 = 20$ and $4 + 5 = 9$: $(x + 4)(x + 5)$." },
      { type: "choice", kicker: "Use it", prompt: "In standard form, $(x - 5)(x + 5)$ is $x^2 - 25$. What are $a$, $b$ and $c$?",
        options: [{ t: "$a = 1$, $b = 0$, $c = -25$" }, { t: "$a = 1$, $b = -25$, $c = 0$", fb: "$-25$ has no $x$: it's the constant term, $c$." }, { t: "$a = 1$, $b = 5$, $c = -5$", fb: "Those are the numbers in the factors, not the coefficients of the standard form." }],
        answer: 0, skill: "Standard and factored form", hints: ["$x^2 + 0x - 25$."], why: "$x^2 - 25 = 1x^2 + 0x - 25$. A missing term has coefficient 0." }
    ]
  });

  /* ============================================ 7.10 · Graphs in standard and factored form */
  LESSONS.push({
    title: "Graphs of functions in standard and factored forms",
    blurb: "Book 7.10 · Factored form shows the x-intercepts. Standard form shows the y-intercept.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "For $f(x) = (x - 2)(x - 6)$, what is $f(2)$?", pre: "$f(2) =$", answer: 0, skill: "Intercepts from the form",
        near: [{ v: -4, fb: "$(2 - 2)$ is 0, and 0 times anything is 0." }], hints: ["$(2 - 2)(2 - 6)$."], why: "$(0)(-4) = 0$. When one factor is zero, the whole product is zero." },
      { type: "plane", prompt: "Here is the graph of $f(x) = (x - 2)(x - 6)$. **Click** one of its $x$-intercepts.",
        x: [-1, 9], y: [-5, 14], click: "point", answer: { point: [2, 0] }, skill: "Intercepts from the form", fns: [{ f: f26, color: "blue" }],
        check: function (st) { var c = st.clicked; return c && c[1] === 0 && (c[0] === 2 || c[0] === 6) ? { ok: true } : { ok: false, say: "An $x$-intercept is where the curve crosses the horizontal axis." }; },
        hints: ["Where is $f(x) = 0$?"], why: "The graph crosses at $x = 2$ and $x = 6$: exactly the numbers that make a factor zero." },
      { type: "learn", kicker: "Name it",
        prompt: "**Factored form** shows the $x$-intercepts (the **zeros**): each factor is zero at one of them. $(x - 2)(x - 6)$ has zeros 2 and 6.<br><br>**Standard form** shows the $y$-intercept: put $x = 0$ and only $c$ is left. $x^2 - 8x + 12$ crosses the $y$-axis at 12." },
      { type: "numbers", prompt: "What are the zeros of $g(x) = (x + 1)(x - 5)$?", answer: [-1, 5], skill: "Intercepts from the form", placeholder: "e.g. 2, -3",
        hints: ["What makes $x + 1$ zero? What makes $x - 5$ zero?"], why: "$x + 1 = 0$ at $x = -1$, and $x - 5 = 0$ at $x = 5$. Notice the signs are opposite to those in the factors." },
      { type: "num", prompt: "What is the $y$-intercept of $y = x^2 - 8x + 12$?", answer: 12, skill: "Intercepts from the form",
        near: [{ v: -8, fb: "$-8$ is the coefficient of $x$. Put $x = 0$: only the constant is left." }], hints: ["Put $x = 0$."], why: "$0 - 0 + 12 = 12$: the point $(0, 12)$." },
      { type: "slots", kicker: "Vary it", prompt: "Match each function to what its form shows at a glance.",
        slots: [{ id: "a", label: "$x$-intercepts at 1 and $-4$" }, { id: "b", label: "$y$-intercept at $-10$" }, { id: "c", label: "Only one $x$-intercept, at $-3$" }],
        cards: [{ t: "$y = (x - 1)(x + 4)$", slot: "a", fb: "$x - 1 = 0$ at 1, and $x + 4 = 0$ at $-4$." }, { t: "$y = x^2 + 3x - 10$", slot: "b", fb: "The constant term is the $y$-intercept." }, { t: "$y = (x + 3)(x + 3)$", slot: "c", fb: "Both factors are zero at the same place, $-3$." }],
        skill: "Intercepts from the form", hints: ["Factors give $x$-intercepts. The constant term gives the $y$-intercept."], why: "Each form is good at showing one thing." },
      { type: "num", kicker: "Use it", prompt: "$f(x) = (x - 2)(x - 6)$ is in factored form, so its $y$-intercept isn't on show. Find it anyway.", answer: 12, skill: "Intercepts from the form",
        near: [{ v: -12, fb: "$(-2)(-6)$ is positive." }, { v: -8, fb: "Multiply the two brackets: $(0 - 2)(0 - 6)$." }], hints: ["Put $x = 0$: $(0 - 2)(0 - 6)$."], why: "$f(0) = (-2)(-6) = 12$." }
    ]
  });

  /* ============================================ 7.11 · Graphing from the factored form */
  LESSONS.push({
    title: "Graphing from the factored form",
    blurb: "Book 7.11 · Two intercepts and the vertex between them are enough to sketch a parabola.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "$f(x) = (x - 1)(x - 5)$ has zeros at 1 and 5. A parabola is symmetric, so its vertex is **halfway** between them. What is the $x$-coordinate of the vertex?", answer: 3, skill: "Vertex from factored form",
        near: [{ v: 2, fb: "That's half the *distance* between them. The midpoint is the average: $\\frac{1 + 5}{2}$." }, { v: 6, fb: "Halve the sum." }], hints: ["Average the two zeros."], why: "$\\frac{1 + 5}{2} = 3$." },
      { type: "num", prompt: "Now its $y$-coordinate: what is $f(3)$?", pre: "$f(3) =$", answer: -4, skill: "Vertex from factored form",
        near: [{ v: 4, fb: "$(3 - 5)$ is $-2$." }], hints: ["$(3 - 1)(3 - 5)$."], why: "$(2)(-2) = -4$. The vertex is $(3, -4)$." },
      { type: "plane", kicker: "See it", prompt: "Sketch $f(x) = (x - 1)(x - 5)$: drag $A$ and $B$ to the $x$-intercepts and $V$ to the vertex.",
        x: [-1, 7], y: [-6, 8],
        points: [{ id: "A", x: 0, y: 2, drag: true, label: "A" }, { id: "B", x: 6, y: 2, drag: true, label: "B" }, { id: "V", x: 3, y: 3, drag: true, label: "V", color: "orange" }],
        segs: function (st) { var a = st.pt("A"), b = st.pt("B"), v = st.pt("V"); if (a.y !== b.y || a.x === b.x || 2 * v.x !== a.x + b.x || v.y === a.y) return []; var k = (a.y - v.y) / ((a.x - v.x) * (a.x - v.x)); return curveSegs(function (x) { return k * (x - v.x) * (x - v.x) + v.y; }, -1, 7, "blue"); },
        check: function (st) { var a = st.pt("A"), b = st.pt("B"), v = st.pt("V"); var ints = (a.x === 1 && b.x === 5 || a.x === 5 && b.x === 1) && a.y === 0 && b.y === 0;
          return !ints ? { ok: false, say: "The intercepts are on the $x$-axis, at the zeros: 1 and 5." } : v.x === 3 && v.y === -4 ? { ok: true } : { ok: false, say: "The vertex is halfway between the intercepts, at $x = 3$, and $f(3) = -4$." }; },
        answer: { points: { A: [1, 0], B: [5, 0], V: [3, -4] } }, skill: "Graph from factored form",
        hints: ["Intercepts: $(1, 0)$ and $(5, 0)$. Vertex: $(3, -4)$."], why: "Three points, and symmetry does the rest." },
      { type: "learn", kicker: "Name it",
        prompt: "The vertical line through the vertex is the **axis of symmetry**: the parabola is a mirror image on either side of it.<br><br>For zeros $m$ and $n$, the axis is at $x = \\frac{m + n}{2}$." },
      { type: "choice", kicker: "Vary it", prompt: "How does the graph of $g(x) = -(x - 1)(x - 5)$ differ from $f(x) = (x - 1)(x - 5)$?",
        options: [{ t: "Same zeros, but it opens downward: the vertex is $(3, 4)$." }, { t: "Its zeros change to $-1$ and $-5$.", fb: "The zeros still come from the factors: 1 and 5. The minus sign in front flips the outputs." }, { t: "It is identical.", fb: "Every output changes sign, so the graph is flipped over the $x$-axis." }],
        answer: 0, skill: "Graph from factored form", hints: ["What does multiplying every output by $-1$ do?"], why: "The zeros stay put. Every other point flips over the $x$-axis, so the minimum $(3, -4)$ becomes a maximum $(3, 4)$." },
      { type: "pair", kicker: "Use it", prompt: "Find the vertex of $y = (x + 2)(x - 4)$.", answer: [1, -9], skill: "Vertex from factored form",
        near: [{ v: [1, 9], fb: "$(1 + 2)(1 - 4) = 3 \\times -3$." }, { v: [-1, -5], fb: "The zeros are $-2$ and $4$: their average is $\\frac{-2 + 4}{2} = 1$." }],
        hints: ["Zeros: $-2$ and 4. Average them.", "Then put that $x$ into the function."], why: "$x = \\frac{-2 + 4}{2} = 1$, and $y = (3)(-3) = -9$." }
    ]
  });

  /* ============================================ 7.12 · Graphing the standard form, part 1 */
  LESSONS.push({
    title: "Graphing the standard form, part 1",
    blurb: "Book 7.12 · In y = ax² + c, a opens, flips and stretches the parabola, and c lifts it.",
    mins: 7, v: 2,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "Set $a$ and $c$ so the parabola $y = ax^2 + c$ passes through **both** orange points.",
        x: [-5, 5], y: [-7, 8], params: { a: { v: -1, min: -3, max: 3, step: 0.5, label: "$a$" }, c: { v: 2, min: -6, max: 6, step: 1, label: "$c$" } },
        fns: [{ f: par, color: "blue" }], marks: [{ x: 0, y: -4, color: "orange", r: 6 }, { x: 2, y: 0, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + (poly([[st.params.a, "x^2"], [st.params.c, ""]]) || "0") + "$"; },
        check: function (st) { var p = st.params; return p.a === 1 && p.c === -4 ? { ok: true } : { ok: false, say: p.c !== -4 ? "At $x = 0$ the curve is at height $c$. The lower orange point is $(0, -4)$." : "The bottom is right. Now change $a$ until the curve reaches $(2, 0)$." }; },
        answer: { params: { a: 1, c: -4 } }, skill: "The roles of a and c", hints: ["$c$ is where the curve crosses the $y$-axis."], why: "$y = x^2 - 4$: at $x = 0$, $y = -4$, and at $x = 2$, $y = 4 - 4 = 0$." },
      { type: "learn", kicker: "Name it",
        prompt: "In $y = ax^2 + c$:<br><br>$c$ moves the whole parabola **up or down**. It is the $y$-intercept.<br>The **sign** of $a$ decides the direction: positive opens upward, negative opens downward.<br>The **size** of $a$ decides the width: further from 0 is narrower, closer to 0 is wider." },
      { type: "plane", prompt: "Now make a parabola that opens **downward**, with its vertex at $(0, 3)$, passing through $(1, 1)$.",
        x: [-5, 5], y: [-7, 8], params: { a: { v: 1, min: -3, max: 3, step: 0.5, label: "$a$" }, c: { v: 0, min: -6, max: 6, step: 1, label: "$c$" } },
        fns: [{ f: par, color: "blue" }], marks: [{ x: 0, y: 3, color: "orange", r: 6 }, { x: 1, y: 1, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + (poly([[st.params.a, "x^2"], [st.params.c, ""]]) || "0") + "$"; },
        check: function (st) { var p = st.params; return p.a === -2 && p.c === 3 ? { ok: true } : { ok: false, say: p.a >= 0 ? "To open downward, $a$ must be negative." : p.c !== 3 ? "The vertex is at height 3: that's $c$." : "From $(0, 3)$ to $(1, 1)$ the curve drops 2 in one step. So $a = \\,?$" }; },
        answer: { params: { a: -2, c: 3 } }, skill: "The roles of a and c", hints: ["$c = 3$. At $x = 1$: $a(1)^2 + 3 = 1$."], why: "$y = -2x^2 + 3$: $a + 3 = 1$ gives $a = -2$." },
      { type: "sort", kicker: "Vary it", prompt: "Does the parabola open upward or downward?",
        bins: ["Upward", "Downward"],
        cards: [{ t: "$y = x^2 - 9$", bin: 0, fb: "$a = 1$, positive." }, { t: "$y = -x^2 + 4$", bin: 1, fb: "$a = -1$, negative." }, { t: "$y = 3x^2 + 1$", bin: 0, fb: "$a = 3$, positive." },
                { t: "$y = 5 - x^2$", bin: 1, fb: "The $x^2$ term is $-x^2$: $a = -1$." }, { t: "$y = -\\frac{1}{2}x^2$", bin: 1, fb: "$a$ is negative." }],
        skill: "The roles of a and c", hints: ["Look only at the sign of the $x^2$ term."], why: "Positive $a$: a cup. Negative $a$: an arch." },
      { type: "choice", prompt: "Which parabola is the **narrowest**?",
        options: [{ t: "$y = 4x^2$" }, { t: "$y = x^2$", fb: "At $x = 1$ it's at height 1. $y = 4x^2$ is already at 4: it climbs faster, so it's narrower." }, { t: "$y = \\frac{1}{4}x^2$", fb: "That's the widest: it climbs most slowly." }],
        answer: 0, keep: true, skill: "The roles of a and c", hints: ["Which climbs fastest as $x$ moves away from 0?"], why: "A larger $|a|$ makes every output bigger, so the curve rises more steeply and looks narrower." },
      { type: "slots", kicker: "Use it", prompt: "Match each equation to how it compares with $y = x^2$.",
        slots: [{ id: "a", label: "Moved up 3" }, { id: "b", label: "Moved down 3" }, { id: "c", label: "Flipped upside down" }, { id: "d", label: "Narrower" }],
        cards: [{ t: "$y = x^2 + 3$", slot: "a", fb: "Adding 3 to every output lifts the graph." }, { t: "$y = x^2 - 3$", slot: "b", fb: "Subtracting 3 lowers it." }, { t: "$y = -x^2$", slot: "c", fb: "Every output changes sign." }, { t: "$y = 3x^2$", slot: "d", fb: "Every output is tripled, so it climbs faster." }],
        skill: "The roles of a and c", hints: ["Adding moves. A negative sign flips. Multiplying stretches."], why: "These are the same shifts and stretches you met with functions in Unit 4." }
    ]
  });
  function shot(t) { return t >= 0 && t <= 5 ? -16 * t * t + 64 * t + 80 : NaN; }
  function vform(x, p) { return (p.a == null ? 1 : p.a) * (x - p.h) * (x - p.h) + p.k; }
  function vtex(a, h, k) { return (a === 1 ? "" : a === -1 ? "-" : nm(a)) + "(x " + (h < 0 ? "+ " + -h : "- " + h) + ")^2 " + (k < 0 ? "- " + -k : "+ " + k); }

  /* ============================================ 7.13 · Graphing the standard form, part 2 */
  LESSONS.push({
    title: "Graphing the standard form, part 2",
    blurb: "Book 7.13 · The bx term slides the vertex sideways. Its x-coordinate is −b ÷ 2a.",
    mins: 7, v: 2,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "The curve is $y = x^2 + bx$. Slide $b$ until the vertex sits on the red line, $x = 2$.",
        x: [-6, 6], y: [-10, 8], vline: [2], params: { b: { v: 2, min: -6, max: 6, step: 1, label: "$b$" } },
        fns: [{ f: function (x, p) { return x * x + p.b * x; }, color: "blue" }],
        marks: [{ x: function (P) { return -P.b / 2; }, y: function (P) { return -P.b * P.b / 4; }, color: "orange", r: 6, label: function (P) { return "(" + nm(-P.b / 2) + ", " + nm(-P.b * P.b / 4) + ")"; } }],
        readout: function (st) { var b = st.params.b; return "$y = " + poly([[1, "x^2"], [b, "x"]]) + "$ &nbsp; vertex at $x = " + nm(-b / 2) + "$"; },
        check: function (st) { return st.params.b === -4 ? { ok: true } : { ok: false, say: "The vertex is at $x = " + nm(-st.params.b / 2) + "$. Notice how it moves the opposite way to $b$." }; },
        answer: { params: { b: -4 } }, skill: "Vertex from standard form", hints: ["Try a negative $b$."],
        why: "$y = x^2 - 4x = x(x - 4)$ has zeros 0 and 4, so its vertex is halfway, at $x = 2$." },
      { type: "learn", kicker: "Name it",
        prompt: "For $y = ax^2 + bx + c$, the vertex is at$$x = \\frac{-b}{2a}$$To find its $y$-coordinate, put that $x$ back into the function. The constant $c$ is still the $y$-intercept." },
      { type: "num", prompt: "Find the $x$-coordinate of the vertex of $y = x^2 - 6x + 5$.", answer: 3, skill: "Vertex from standard form",
        near: [{ v: -3, fb: "$-b$ is $-(-6) = 6$. Then divide by $2a = 2$." }, { v: 6, fb: "Divide by $2a$, which is 2." }], hints: ["$a = 1$, $b = -6$. Use $\\frac{-b}{2a}$."], why: "$\\frac{-(-6)}{2(1)} = 3$." },
      { type: "num", prompt: "And its $y$-coordinate? Put $x = 3$ into $y = x^2 - 6x + 5$.", answer: -4, skill: "Vertex from standard form",
        near: [{ v: 32, fb: "$-6(3) = -18$: subtract it." }, { v: 5, fb: "5 is the $y$-intercept, at $x = 0$." }], hints: ["$9 - 18 + 5$."], why: "$9 - 18 + 5 = -4$. The vertex is $(3, -4)$." },
      { type: "choice", kicker: "Vary it", prompt: "Which equation matches this graph?",
        scene: graph([-4, 6], [-6, 8], [{ f: function (x) { return (x + 1) * (x - 3); }, color: "green" }], { marks: [{ x: -1, y: 0, color: "orange" }, { x: 3, y: 0, color: "orange" }, { x: 0, y: -3, color: "orange" }] }),
        options: [{ t: "$y = x^2 - 2x - 3$" }, { t: "$y = x^2 + 2x - 3$", fb: "That one is $(x + 3)(x - 1)$: zeros at $-3$ and 1. This graph crosses at $-1$ and 3." }, { t: "$y = x^2 - 2x + 3$", fb: "The graph crosses the $y$-axis at $-3$, so $c = -3$." }],
        answer: 0, skill: "Vertex from standard form", hints: ["Zeros at $-1$ and 3 give the factors $(x + 1)(x - 3)$. Multiply them out."], why: "$(x + 1)(x - 3) = x^2 - 2x - 3$, and its $y$-intercept is $-3$ ✓." },
      { type: "num", kicker: "Use it", prompt: "Find the $x$-coordinate of the vertex of $y = 2x^2 + 8x + 1$.", answer: -2, skill: "Vertex from standard form",
        near: [{ v: -4, fb: "Divide by $2a$, and here $a = 2$: $2a = 4$." }, { v: 2, fb: "It's $-b$ on top: $-8$." }], hints: ["$\\frac{-8}{2 \\cdot 2}$."], why: "$\\frac{-8}{4} = -2$." }
    ]
  });

  /* ============================================ 7.14 · Graphs that represent situations */
  LESSONS.push({
    title: "Graphs that represent situations",
    blurb: "Book 7.14 · Read a quadratic graph as a story: where it starts, its peak, and where it lands.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A firework is launched from a rooftop. $h(t) = -16t^2 + 64t + 80$ is its height in feet after $t$ seconds. How high is the rooftop?",
        scene: graph([0, 6], [0, 160], [{ f: shot, color: "orange" }], { gridY: 20, labelEveryY: 40, aspect: 0.85, axisLabels: ["t", "h"] }),
        post: "ft", answer: 80, skill: "Interpret a quadratic graph", near: [{ v: 144, fb: "That's the highest point. The rooftop is where it *starts*: $t = 0$." }],
        hints: ["The start is $t = 0$: the vertical intercept."], why: "$h(0) = 80$: the constant term, and the vertical intercept." },
      { type: "pair", prompt: "What are the coordinates of the vertex?",
        scene: graph([0, 6], [0, 160], [{ f: shot, color: "orange" }], { gridY: 20, labelEveryY: 40, aspect: 0.85, axisLabels: ["t", "h"] }),
        answer: [2, 144], skill: "Interpret a quadratic graph", near: [{ v: [144, 2], fb: "Time first: $(t, h)$." }, { v: [2, 140], fb: "Work it out exactly: $h(2) = -64 + 128 + 80$." }],
        hints: ["$t = \\frac{-b}{2a} = \\frac{-64}{-32}$.", "Then find $h(2)$."], why: "$t = 2$ and $h(2) = -64 + 128 + 80 = 144$." },
      { type: "choice", prompt: "What does the vertex $(2, 144)$ mean?",
        options: [{ t: "After 2 seconds the firework reaches its greatest height, 144 ft." }, { t: "The firework lands after 2 seconds, 144 ft away.", fb: "The graph shows height against *time*, not distance along the ground. And at $t = 2$ it is at its highest." }, { t: "The firework travels at 144 ft per second for 2 seconds.", fb: "The output is a height, not a speed." }],
        answer: 0, skill: "Interpret a quadratic graph", hints: ["The vertex is the maximum. Input: seconds. Output: feet."], why: "The maximum of $h$ is 144 ft, reached at $t = 2$ s." },
      { type: "num", kicker: "Vary it", prompt: "When does the firework hit the ground?", scene: graph([0, 6], [0, 160], [{ f: shot, color: "orange" }], { gridY: 20, labelEveryY: 40, aspect: 0.85, axisLabels: ["t", "h"] }),
        pre: "$t =$", post: "s", answer: 5, skill: "Interpret a quadratic graph", hints: ["Where is $h(t) = 0$?"], why: "$h(5) = -400 + 320 + 80 = 0$. The positive zero is the landing time." },
      { type: "choice", prompt: "The equation also has a zero at $t = -1$. Why isn't that on the graph?",
        options: [{ t: "Time before the launch has no meaning here: the domain is $0 \\le t \\le 5$." }, { t: "The equation is wrong.", fb: "$h(-1) = -16 - 64 + 80 = 0$: it really is a zero of the formula." }, { t: "Negative numbers can't be squared.", fb: "They can: $(-1)^2 = 1$." }],
        answer: 0, skill: "Interpret a quadratic graph", hints: ["When does the flight start?"], why: "The formula doesn't know the firework wasn't flying before $t = 0$. The situation sets the domain." },
      { type: "choice", kicker: "Use it", prompt: "A stall's daily profit, $P(x)$ dollars, depends on the price $x$ it charges. The graph is a parabola with zeros at $x = 2$ and $x = 18$ and vertex $(10, 64)$. What do the zeros mean?",
        options: [{ t: "At a price of \\$2 or \\$18 the stall makes no profit: it breaks even." }, { t: "The stall sells 2 items, then 18.", fb: "The input is the price, and the output is profit." }, { t: "The best prices are \\$2 and \\$18.", fb: "The best price is at the vertex: \\$10, for a profit of \\$64." }],
        answer: 0, skill: "Interpret a quadratic graph", hints: ["A zero is an input whose output is 0. What is the output here?"], why: "Profit is 0 at those prices. Between them it's positive, peaking at \\$10." }
    ]
  });

  /* ============================================ 7.15 · Vertex form */
  LESSONS.push({
    title: "Vertex form",
    blurb: "Book 7.15 · y = a(x − h)² + k puts the vertex in plain sight: (h, k).",
    mins: 7, v: 2,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "The curve is $y = (x - h)^2 + k$. Slide $h$ and $k$ to put its vertex on the orange point.",
        x: [-6, 6], y: [-6, 8], params: { h: { v: 0, min: -5, max: 5, step: 1, label: "$h$" }, k: { v: 0, min: -5, max: 5, step: 1, label: "$k$" } },
        fns: [{ f: vform, color: "blue" }], marks: [{ x: 3, y: -2, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + vtex(1, st.params.h, st.params.k) + "$"; },
        check: function (st) { var p = st.params; return p.h === 3 && p.k === -2 ? { ok: true } : { ok: false, say: "The orange point is $(3, -2)$. One slider moves the curve sideways, the other up and down." }; },
        answer: { params: { h: 3, k: -2 } }, skill: "Vertex form", hints: ["$h$ moves it left and right. $k$ moves it up and down."], why: "$y = (x - 3)^2 - 2$ has its vertex at $(3, -2)$: exactly $(h, k)$." },
      { type: "learn", kicker: "Name it",
        prompt: "**Vertex form** of a quadratic:$$y = a(x - h)^2 + k$$The vertex is $(h, k)$. Take care with the sign of $h$: the form has $x - h$ in it, so $(x - 3)^2$ means $h = 3$, and $(x + 3)^2$ means $h = -3$." },
      { type: "pair", prompt: "What is the vertex of $y = (x - 5)^2 + 1$?", answer: [5, 1], skill: "Vertex form",
        near: [{ v: [-5, 1], fb: "$(x - 5)$ is zero when $x = 5$: the vertex is at $x = +5$." }, { v: [1, 5], fb: "$x$ first: $h$ comes from inside the bracket." }], hints: ["Which $x$ makes the bracket zero?"], why: "$h = 5$ and $k = 1$: the vertex is $(5, 1)$." },
      { type: "pair", prompt: "And of $y = (x + 2)^2 - 7$?", answer: [-2, -7], skill: "Vertex form",
        near: [{ v: [2, -7], fb: "$(x + 2)$ is zero when $x = -2$." }], hints: ["$x + 2 = x - (-2)$."], why: "$h = -2$ and $k = -7$: the vertex is $(-2, -7)$." },
      { type: "slots", kicker: "Vary it", prompt: "Match each equation to its vertex.",
        slots: [{ id: "a", label: "$(4, 3)$" }, { id: "b", label: "$(-4, 3)$" }, { id: "c", label: "$(4, -3)$" }, { id: "d", label: "$(0, 3)$" }],
        cards: [{ t: "$y = (x - 4)^2 + 3$", slot: "a", fb: "$h = 4$, $k = 3$." }, { t: "$y = (x + 4)^2 + 3$", slot: "b", fb: "$x + 4$ is zero at $-4$." }, { t: "$y = 2(x - 4)^2 - 3$", slot: "c", fb: "The 2 in front changes the width, not the vertex." }, { t: "$y = x^2 + 3$", slot: "d", fb: "No shift sideways: $h = 0$." }],
        skill: "Vertex form", hints: ["The $x$-coordinate has the opposite sign to the number in the bracket."], why: "Read $(h, k)$ straight off, minding the sign of $h$." },
      { type: "sort", kicker: "Use it", prompt: "You now have three forms. Which is which?",
        bins: ["Standard", "Factored", "Vertex"],
        cards: [{ t: "$y = x^2 - 6x + 8$", bin: 0, fb: "A sum of terms." }, { t: "$y = (x - 2)(x - 4)$", bin: 1, fb: "A product of factors." }, { t: "$y = (x - 3)^2 - 1$", bin: 2, fb: "A squared bracket plus a constant." },
                { t: "$y = -2(x + 1)^2 + 5$", bin: 2, fb: "$a(x - h)^2 + k$ with $a = -2$." }, { t: "$y = x(x + 7)$", bin: 1, fb: "A product." }],
        skill: "Vertex form", hints: ["Sum, product, or square-plus-constant?"], why: "The first three cards are all the **same** function: standard shows the $y$-intercept, factored shows the zeros, vertex shows the vertex." }
    ]
  });

  /* ============================================ 7.16 · Graphing from the vertex form */
  LESSONS.push({
    title: "Graphing from the vertex form",
    blurb: "Book 7.16 · Plot the vertex, find one more point, and let symmetry finish the job.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "For $f(x) = (x - 2)^2 - 1$, the vertex is $(2, -1)$. What is $f(3)$, one step to the right?", pre: "$f(3) =$", answer: 0, skill: "Graph from vertex form",
        near: [{ v: -1, fb: "That's the vertex's height. At $x = 3$ the bracket is $1$." }], hints: ["$(3 - 2)^2 - 1$."], why: "$1 - 1 = 0$. By symmetry, $f(1)$, one step to the left, is 0 as well." },
      { type: "plane", kicker: "See it", prompt: "Sketch $y = 2(x - 1)^2 - 4$: drag $V$ to the vertex and $P$ to the $y$-intercept.",
        x: [-4, 6], y: [-6, 8],
        points: [{ id: "V", x: -2, y: 2, drag: true, label: "V", color: "orange" }, { id: "P", x: 3, y: 4, drag: true, label: "P" }],
        segs: function (st) { var v = st.pt("V"), p = st.pt("P"); if (p.x === v.x) return []; var a = (p.y - v.y) / ((p.x - v.x) * (p.x - v.x)); return curveSegs(function (x) { return a * (x - v.x) * (x - v.x) + v.y; }, -4, 6, "blue"); },
        check: function (st) { var v = st.pt("V"), p = st.pt("P"); return v.x !== 1 || v.y !== -4 ? { ok: false, say: "The vertex is $(h, k)$: read it from $2(x - 1)^2 - 4$." } : p.x === 0 && p.y === -2 ? { ok: true } : { ok: false, say: "The $y$-intercept is at $x = 0$: $2(0 - 1)^2 - 4$." }; },
        answer: { points: { V: [1, -4], P: [0, -2] } }, skill: "Graph from vertex form", hints: ["Vertex $(1, -4)$. Then $x = 0$ gives $2(1) - 4$."], why: "Vertex $(1, -4)$ and $y$-intercept $(0, -2)$. The mirror point $(2, -2)$ comes for free." },
      { type: "choice", kicker: "Name it", prompt: "Does $y = -(x - 4)^2 + 6$ have a maximum or a minimum, and what is it?",
        options: [{ t: "A maximum of 6" }, { t: "A minimum of 6", fb: "$a = -1$ is negative, so the parabola opens downward: its vertex is the top." }, { t: "A maximum of 4", fb: "4 is where it happens ($x = 4$). The maximum *value* is the $y$-coordinate, 6." }],
        answer: 0, skill: "Graph from vertex form", hints: ["The sign of $a$ says which way it opens. $k$ is the height of the vertex."],
        why: "$-(x - 4)^2$ is never positive, so the most $y$ can be is 6, when $x = 4$." },
      { type: "num", prompt: "What is the $y$-intercept of $y = (x - 3)^2 + 2$?", answer: 11, skill: "Graph from vertex form",
        near: [{ v: 2, fb: "2 is $k$, the height of the vertex. The $y$-intercept is at $x = 0$." }, { v: -7, fb: "$(0 - 3)^2 = +9$." }], hints: ["Put $x = 0$: $(-3)^2 + 2$."], why: "$9 + 2 = 11$. In vertex form the $y$-intercept isn't visible: you have to work it out." },
      { type: "plane", kicker: "Use it", prompt: "Match the dashed parabola. Set $a$, $h$ and $k$.",
        x: [-5, 7], y: [-6, 8], params: { a: { v: 1, min: -2, max: 2, step: 1, label: "$a$" }, h: { v: 0, min: -5, max: 5, step: 1, label: "$h$" }, k: { v: 0, min: -5, max: 6, step: 1, label: "$k$" } },
        fns: [{ f: function (x) { return -(x - 2) * (x - 2) + 5; }, color: "ink", dashed: true }, { f: vform, color: "blue" }],
        readout: function (st) { var p = st.params; return p.a === 0 ? "$y = " + p.k + "$ (with $a = 0$ it's a flat line)" : "$y = " + vtex(p.a, p.h, p.k) + "$"; },
        check: function (st) { var p = st.params; return p.a === -1 && p.h === 2 && p.k === 5 ? { ok: true } : { ok: false, say: p.a >= 0 ? "The dashed curve opens downward." : "Put the vertex on the dashed curve's top: where is it?" }; },
        answer: { params: { a: -1, h: 2, k: 5 } }, skill: "Graph from vertex form", hints: ["Read the dashed vertex: $(2, 5)$. And it opens downward."], why: "$y = -(x - 2)^2 + 5$." }
    ]
  });

  /* ============================================ 7.17 · Changing the vertex */
  LESSONS.push({
    title: "Changing the vertex",
    blurb: "Book 7.17 · Move a parabola anywhere by changing h and k. Reshape it with a.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "The graph of $y = x^2$ is moved **right 4** and **up 1**. What is its new equation?",
        options: [{ t: "$y = (x - 4)^2 + 1$" }, { t: "$y = (x + 4)^2 + 1$", fb: "That moves it *left* 4. Its vertex is where $x + 4 = 0$." }, { t: "$y = x^2 + 4x + 1$", fb: "Adding $4x$ doesn't shift the graph 4 to the right. Replace $x$ with $(x - 4)$." }],
        answer: 0, skill: "Translate a parabola", hints: ["The new vertex is $(4, 1)$."], why: "Vertex $(4, 1)$ means $h = 4$, $k = 1$: $y = (x - 4)^2 + 1$." },
      { type: "plane", kicker: "See it", prompt: "Move the blue parabola onto the dashed one.",
        x: [-7, 5], y: [-5, 8], params: { h: { v: 1, min: -5, max: 4, step: 1, label: "$h$" }, k: { v: 2, min: -4, max: 6, step: 1, label: "$k$" } },
        fns: [{ f: function (x) { return (x + 3) * (x + 3) - 2; }, color: "ink", dashed: true }, { f: vform, color: "blue" }],
        readout: function (st) { return "$y = " + vtex(1, st.params.h, st.params.k) + "$"; },
        check: function (st) { var p = st.params; return p.h === -3 && p.k === -2 ? { ok: true } : { ok: false, say: "The dashed vertex is at $(-3, -2)$." }; },
        answer: { params: { h: -3, k: -2 } }, skill: "Translate a parabola", hints: ["Line up the vertices."], why: "$h = -3$, $k = -2$: $y = (x + 3)^2 - 2$." },
      { type: "slots", kicker: "Name it", prompt: "Starting from $y = x^2$, what does each change do?",
        slots: [{ id: "a", label: "Moves it right 2" }, { id: "b", label: "Moves it left 2" }, { id: "c", label: "Moves it up 2" }, { id: "d", label: "Moves it down 2" }],
        cards: [{ t: "$y = (x - 2)^2$", slot: "a", fb: "The vertex is where $x - 2 = 0$: at $x = 2$." }, { t: "$y = (x + 2)^2$", slot: "b", fb: "The vertex is where $x + 2 = 0$: at $x = -2$." }, { t: "$y = x^2 + 2$", slot: "c", fb: "2 is added to every output." }, { t: "$y = x^2 - 2$", slot: "d", fb: "2 is taken from every output." }],
        skill: "Translate a parabola", hints: ["Inside the bracket: sideways, opposite to the sign. Outside: up or down, as the sign says."], why: "The same rules as for any function: inside changes are horizontal and reversed, outside changes are vertical." },
      { type: "choice", kicker: "Vary it", prompt: "How does $y = -3x^2$ compare with $y = x^2$?",
        options: [{ t: "It opens downward and is narrower." }, { t: "It opens downward and is wider.", fb: "$|a| = 3$ is bigger than 1, so it climbs (here, falls) faster: narrower." }, { t: "It is moved down 3.", fb: "Subtracting 3 would move it down. Multiplying by $-3$ flips and stretches it." }],
        answer: 0, skill: "Translate a parabola", hints: ["The sign of $a$ flips. The size of $a$ stretches."], why: "Negative: flipped. Size 3: every output three times as far from the axis, so narrower." },
      { type: "expr", prompt: "Write the equation of a parabola the same shape as $y = x^2$, with its vertex at $(-1, 5)$: $y = \\;?$", answer: "(x+1)^2+5", shown: "(x + 1)^2 + 5", skill: "Translate a parabola",
        keys: KEYS_Q.concat([["$(\\;)^2$", "^2"]]), near: [{ v: "(x-1)^2+5", fb: "That has its vertex at $x = +1$. For $h = -1$ the bracket is $(x + 1)$." }, { v: "(x+1)^2-5", fb: "$k = 5$ is added." }],
        hints: ["$y = (x - h)^2 + k$ with $h = -1$, $k = 5$."], why: "$y = (x - (-1))^2 + 5 = (x + 1)^2 + 5$." },
      { type: "choice", kicker: "Use it", prompt: "A basketball shot follows $y = -0.1(x - 5)^2 + 4$, heights in metres. The player wants the peak **1 m higher**, at the same place. What changes?",
        options: [{ t: "$k$: make it $-0.1(x - 5)^2 + 5$" }, { t: "$h$: make it $-0.1(x - 6)^2 + 4$", fb: "That moves the peak 1 m further along, not higher." }, { t: "$a$: make it $-1.1(x - 5)^2 + 4$", fb: "That makes the arc much narrower. The peak stays at 4." }],
        answer: 0, skill: "Translate a parabola", hints: ["The peak is the vertex, $(h, k)$. Which letter is its height?"], why: "The vertex is $(5, 4)$. Raising it by 1 means $k = 5$." }
    ]
  });

  /* ============================================ Project 7 */
  LESSONS.push({
    title: "Project: Design a fountain",
    tag: "Project",
    blurb: "Book Project 7 · Shape a jet of water with a quadratic: where it lands and how high it goes.",
    mins: 9, v: 2,
    steps: [
      { type: "learn", kicker: "The brief",
        prompt: "A fountain's nozzle is at $x = 0$. A jet of water follows a parabola and must land **6 ft** away, in a basin. In factored form, that's $y = a \\cdot x(x - 6)$: zeros at 0 and 6. Your job is to choose $a$." },
      { type: "plane", prompt: "The designer wants the jet to peak at exactly **9 ft**. Slide $a$ until it does.",
        x: [-1, 8], y: [-1, 14], axisLabels: ["x", "y"], params: { a: { v: -0.5, min: -1.5, max: -0.25, step: 0.25, label: "$a$" } },
        fns: [{ f: function (x, p) { return x >= 0 && x <= 6 ? p.a * x * (x - 6) : NaN; }, color: "blue" }],
        marks: [{ x: 3, y: function (P) { return -9 * P.a; }, color: "orange", r: 6, label: function (P) { return "(3, " + nm(-9 * P.a) + ")"; } }],
        readout: function (st) { return "$y = " + (st.params.a === -1 ? "-" : nm(st.params.a)) + "x(x - 6)$ &nbsp; peak: " + nm(-9 * st.params.a) + " ft"; },
        check: function (st) { return st.params.a === -1 ? { ok: true } : { ok: false, say: "The peak is at $x = 3$, where $y = a \\cdot 3 \\cdot (-3) = -9a$." }; },
        answer: { params: { a: -1 } }, skill: "Graph from factored form", hints: ["At the vertex, $x = 3$: $y = -9a$. You want 9."], why: "$-9a = 9$ gives $a = -1$: $y = -x(x - 6)$." },
      { type: "expr", prompt: "Write $y = -x(x - 6)$ in standard form.", answer: "-x^2+6x", shown: "-x^2 + 6x", form: "simplified", skill: "Standard and factored form", keys: KEYS_Q,
        near: [{ v: "-x^2-6x", fb: "$-x \\cdot (-6) = +6x$." }], hints: ["Distribute the $-x$."], why: "$-x \\cdot x = -x^2$ and $-x \\cdot (-6) = 6x$." },
      { type: "choice", prompt: "And in vertex form?",
        options: [{ t: "$y = -(x - 3)^2 + 9$" }, { t: "$y = -(x + 3)^2 + 9$", fb: "That vertex would be at $x = -3$, behind the nozzle." }, { t: "$y = (x - 3)^2 + 9$", fb: "That opens upward. The jet is an arch: $a = -1$." }],
        answer: 0, skill: "Vertex form", hints: ["The vertex is $(3, 9)$, and it opens downward."], why: "Vertex $(3, 9)$ with $a = -1$: $y = -(x - 3)^2 + 9$. Three forms, one jet." },
      { type: "explain", kicker: "Make it yours",
        prompt: "Design a second jet that lands **8 ft** away and peaks at **8 ft**. Give its equation in factored form, and explain how you found $a$.",
        placeholder: "e.g. y = a·x(x − 8). The vertex is at x = 4, so…",
        model: "Zeros at 0 and 8 give y = a·x(x − 8). The vertex is halfway, at x = 4, where y = a(4)(−4) = −16a. Setting −16a = 8 gives a = −0.5, so y = −0.5x(x − 8)." }
    ]
  });
  /* ================================================================ Skills */
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function bin(p) { return "(x " + signed(p) + ")"; }
  function seqOf(f) { return [1, 2, 3, 4].map(f); }

  var SKILLS = [
    { id: "u7-classify", title: "Linear, quadratic or exponential", lesson: 4,
      gen: function (R) {
        var kind = R.int(0, 2), names = ["Linear", "Quadratic", "Exponential"], t, why;
        if (kind === 0) { var m = R.nz(-6, 7), b = R.int(-5, 9); t = seqOf(function (x) { return m * x + b; }); why = "The first differences are all $" + m + "$."; }
        else if (kind === 1) { var a = R.pick([1, 1, 2, -1]), b2 = R.int(-3, 4), c = R.int(-4, 6); t = seqOf(function (x) { return a * x * x + b2 * x + c; }); why = "The first differences change, but the second differences are all $" + 2 * a + "$."; }
        else { var r = R.pick([2, 3]), s = R.int(1, 5); t = seqOf(function (x) { return s * Math.pow(r, x); }); why = "Each output is " + r + " times the one before."; }
        return mc(R, { prompt: "These are the outputs for $x = 1, 2, 3, 4$. What kind of function is it?" + tbl(["$x$", "1", "2", "3", "4"], [["y"].concat(t)]), right: names[kind],
          wrong: names.filter(function (n, i) { return i !== kind; }).map(function (n) { return { t: n, fb: why }; }), keep: true,
          hints: ["Find the differences. If they aren't constant, find their differences, or try ratios."], why: why });
      } },
    { id: "u7-next", title: "Continue a quadratic sequence", lesson: 4,
      gen: function (R) {
        var a = R.pick([1, 1, 2]), b = R.int(-2, 4), c = R.int(-3, 8), t = [1, 2, 3, 4, 5].map(function (x) { return a * x * x + b * x + c; }), d = [t[1] - t[0], t[2] - t[1], t[3] - t[2]];
        return { type: "num", prompt: "This sequence is quadratic. What comes next? $" + t.slice(0, 4).join(", \; ") + ", \; \\ldots$", answer: t[4],
          near: near(t[4], [{ v: t[3] + d[2], fb: "The differences are " + d.join(", ") + ". They keep growing by " + 2 * a + ", so the next one is bigger." }]),
          hints: ["Differences: " + d.join(", ") + ". What is the next difference?"], why: "The next difference is $" + (d[2] + 2 * a) + "$: $" + t[3] + " + " + (d[2] + 2 * a) + " = " + t[4] + "$." };
      } },
    { id: "u7-fall", title: "Distance fallen", lesson: 6,
      gen: function (R) {
        if (R.chance(0.5)) { var t = R.pick([1, 2, 3, 4, 5, 1.5, 2.5]); return { type: "num", prompt: "An object dropped from rest falls $d(t) = 16t^2$ feet in $t$ seconds. How far does it fall in " + nm(t) + " seconds?", post: "ft", answer: 16 * t * t,
          near: near(16 * t * t, [{ v: 32 * t, fb: "$t^2$ means $t \\times t$, not $2t$." }, { v: 16 * t, fb: "Square the time first." }]), hints: ["Square " + nm(t) + ", then multiply by 16."], why: "$16 \\times " + nm(t * t) + " = " + nm(16 * t * t) + "$ ft." }; }
        var T = R.int(2, 6), H = 16 * T * T;
        return { type: "num", prompt: "A stone is dropped from " + H + " ft: its height is $h(t) = " + H + " - 16t^2$. After how many seconds does it reach the ground?", post: "s", answer: T,
          near: [{ v: T * T, fb: "That's $t^2$. Take the square root." }], hints: ["Solve $" + H + " - 16t^2 = 0$.", "$t^2 = " + T * T + "$."], why: "$16t^2 = " + H + "$, so $t^2 = " + T * T + "$ and $t = " + T + "$." };
      } },
    { id: "u7-projectile", title: "Height of a launched object", lesson: 7,
      gen: function (R) {
        var h0 = R.pick([0, 4, 5, 6, 10]), v = R.pick([48, 64, 80, 96]), t = R.int(1, 3), ans = h0 + v * t - 16 * t * t;
        return { type: "num", prompt: "A ball's height is $h(t) = " + (h0 ? h0 + " + " : "") + v + "t - 16t^2$ feet. Find $h(" + t + ")$.", post: "ft", answer: ans,
          near: near(ans, [{ v: h0 + v * t + 16 * t * t, fb: "Gravity pulls it down: subtract $16t^2$." }, { v: h0 + v * t - 32 * t, fb: "$t^2$ is $t \\times t$." }]),
          hints: ["$" + (h0 ? h0 + " + " : "") + v + "(" + t + ") - 16(" + t + ")^2$."], why: "$" + (h0 ? h0 + " + " : "") + v * t + " - " + 16 * t * t + " = " + ans + "$ ft." };
      } },
    { id: "u7-expand", title: "Factored form to standard form", lesson: 10,
      gen: function (R) {
        var p = R.nz(-7, 7), q = R.nz(-7, 7);
        return { type: "expr", prompt: "Write in standard form. $$" + bin(p) + bin(q) + "$$", answer: clean(quad(1, p + q, p * q)), shown: quad(1, p + q, p * q), form: "simplified", keys: KEYS_Q,
          near: [{ v: clean(quad(1, 0, p * q)), fb: "Add the two middle products: $" + q + "x$ and $" + p + "x$." }, { v: clean(quad(1, p + q, -p * q)), fb: "Check the sign of the last term: $" + p + " \\times " + L.sub("a", { a: q }) + "$." }],
          hints: ["Multiply every term of one bracket by every term of the other."], why: "$x^2 " + signed(q) + "x " + signed(p) + "x " + signed(p * q) + " = " + quad(1, p + q, p * q) + "$." };
      } },
    { id: "u7-zeros", title: "Zeros from factored form", lesson: 11,
      gen: function (R) {
        var m = R.int(-7, 7), n = R.int(-7, 7);
        if (m === n) n = m + 2;
        return { type: "numbers", prompt: "What are the zeros of $f(x) = " + (m === 0 ? "x" : bin(-m)) + (n === 0 ? " \\cdot x" : bin(-n)) + "$?", answer: [m, n], placeholder: "e.g. 2, -5",
          hints: ["Find the value of $x$ that makes each factor zero."], why: "The factors are zero at $x = " + m + "$ and $x = " + n + "$. The signs are opposite to those inside the brackets." };
      } },
    { id: "u7-yint", title: "The y-intercept", lesson: 11,
      gen: function (R) {
        if (R.chance(0.5)) { var a = R.pick([1, 2, -1, 3]), b = R.nz(-9, 9), c = R.nz(-12, 12); return { type: "num", prompt: "What is the $y$-intercept of $y = " + quad(a, b, c) + "$?", answer: c,
          near: near(c, [{ v: b, fb: "That's the coefficient of $x$. Put $x = 0$ and only the constant is left." }]), hints: ["Put $x = 0$."], why: "At $x = 0$, $y = " + c + "$." }; }
        var p = R.nz(-6, 6), q = R.nz(-6, 6);
        return { type: "num", prompt: "What is the $y$-intercept of $y = " + bin(p) + bin(q) + "$?", answer: p * q, near: near(p * q, [{ v: -p * q, fb: "Check the signs: $(" + p + ")(" + q + ")$." }, { v: p + q, fb: "At $x = 0$ the brackets are *multiplied*." }]),
          hints: ["Put $x = 0$ into both brackets."], why: "$(" + p + ")(" + q + ") = " + p * q + "$." };
      } },
    { id: "u7-vertex-fact", title: "Vertex from factored form", lesson: 12,
      gen: function (R) {
        var m = R.int(-6, 4), n = m + R.pick([2, 4, 6]), h = (m + n) / 2, k = (h - m) * (h - n);
        return { type: "pair", prompt: "Find the vertex of $y = " + bin(-m) + bin(-n) + "$.", answer: [h, k], near: [{ v: [h, -k], fb: "Check the sign: $(" + (h - m) + ")(" + (h - n) + ")$." }],
          hints: ["The zeros are $" + m + "$ and $" + n + "$. The vertex is halfway between them.", "Then put that $x$ into the function."], why: "$x = \\frac{" + m + " + " + n + "}{2} = " + h + "$ and $y = (" + (h - m) + ")(" + (h - n) + ") = " + k + "$." };
      } },
    { id: "u7-shape", title: "Which way, and how wide", lesson: 13,
      gen: function (R) {
        var a = R.pick([-4, -3, -2, -0.5, -0.25, 0.25, 0.5, 2, 3, 5]), c = R.int(-6, 6), up = a > 0, narrow = Math.abs(a) > 1;
        var names = ["Opens upward, narrower than $y = x^2$", "Opens upward, wider than $y = x^2$", "Opens downward, narrower than $y = x^2$", "Opens downward, wider than $y = x^2$"], right = names[(up ? 0 : 2) + (narrow ? 0 : 1)];
        return mc(R, { prompt: "Describe the graph of $y = " + (poly([[a, "x^2"], [c, ""]])) + "$.", right: right,
          wrong: names.filter(function (n) { return n !== right; }).map(function (n) { return { t: n, fb: "$a = " + nm(a) + "$: its sign is " + (up ? "positive (upward)" : "negative (downward)") + ", and its size is " + (narrow ? "more than 1 (narrower)." : "less than 1 (wider).") }; }),
          keep: true, hints: ["Sign of $a$: direction. Size of $a$: width."], why: "$a = " + nm(a) + "$: " + (up ? "positive, so it opens upward" : "negative, so it opens downward") + ", and $|a|$ is " + (narrow ? "greater than 1, so it is narrower." : "less than 1, so it is wider.") });
      } },
    { id: "u7-vertex-std", title: "Vertex from standard form", lesson: 14,
      gen: function (R) {
        var a = R.pick([1, 1, 2, -1]), h = R.int(-4, 5), k = R.int(-6, 6), b = -2 * a * h, c = a * h * h + k;
        return { type: "pair", prompt: "Find the vertex of $y = " + quad(a, b, c) + "$.", answer: [h, k], near: [{ v: [-h, a * h * h - b * h + c], fb: "It's $-b$ on top: $\\frac{" + -b + "}{" + 2 * a + "}$." }],
          hints: ["$x = \\frac{-b}{2a} = \\frac{" + -b + "}{" + 2 * a + "}$.", "Then put that $x$ into the function."], why: "$x = " + h + "$, and $y = " + L.sub(quad(a, b, c), { x: h }) + " = " + k + "$." };
      } },
    { id: "u7-read", title: "Read a quadratic model", lesson: 15,
      gen: function (R) {
        var T = R.int(2, 4), a = -16, hmax = 16 * T * T + R.pick([0, 20, 36]), h0 = hmax - 16 * T * T, ask = R.int(0, 1);
        var f = function (t) { return hmax - 16 * (t - T) * (t - T); };
        return { type: "num", prompt: "A ball's height is $h(t) = -16(t - " + T + ")^2 + " + hmax + "$ feet after $t$ seconds. " + (ask ? "What is its **greatest height**?" : "**When** does it reach its greatest height?"), post: ask ? "ft" : "s", answer: ask ? hmax : T,
          near: near(ask ? hmax : T, [{ v: ask ? T : hmax, fb: ask ? "That's *when* it peaks. The height is the other number in the vertex." : "That's the height. The question asks for the time." }, { v: h0, fb: "That's the starting height, $h(0)$." }]),
          hints: ["The vertex is $(h, k)$: read it from the vertex form."], why: "The vertex is $(" + T + ", " + hmax + ")$: at " + T + " seconds the ball is " + hmax + " ft up." };
      } },
    { id: "u7-vertex-form", title: "Vertex from vertex form", lesson: 16,
      gen: function (R) {
        var a = R.pick([1, 1, 2, -1, -3]), h = R.nz(-8, 8), k = R.int(-9, 9);
        return { type: "pair", prompt: "What is the vertex of $y = " + vtex(a, h, k) + "$?", answer: [h, k], near: [{ v: [-h, k], fb: "The bracket is zero when $x = " + h + "$, so that's the $x$-coordinate." }, { v: [k, h], fb: "$x$ first: it comes from inside the bracket." }],
          hints: ["Which $x$ makes the bracket zero?"], why: "$(h, k) = (" + h + ", " + k + ")$." };
      } },
    { id: "u7-maxmin", title: "Maximum or minimum", lesson: 17,
      gen: function (R) {
        var a = R.pick([-3, -2, -1, 1, 2, 4]), h = R.nz(-6, 6), k = R.int(-8, 9), max = a < 0;
        return mc(R, { prompt: "What is true of $y = " + vtex(a, h, k) + "$?", right: "It has a " + (max ? "maximum" : "minimum") + " of $" + k + "$",
          wrong: [{ t: "It has a " + (max ? "minimum" : "maximum") + " of $" + k + "$", fb: "$a = " + a + "$ is " + (max ? "negative, so the parabola opens downward and the vertex is its top." : "positive, so the parabola opens upward and the vertex is its bottom.") },
                  { t: "It has a " + (max ? "maximum" : "minimum") + " of $" + h + "$", fb: "$" + h + "$ is *where* it happens. The value is the $y$-coordinate, $" + k + "$." }],
          hints: ["Sign of $a$: which way it opens. $k$: the height of the vertex."], why: "$a = " + a + "$ opens " + (max ? "downward" : "upward") + ", and the vertex is $(" + h + ", " + k + ")$." });
      } },
    { id: "u7-translate", title: "Move a parabola", lesson: 18,
      gen: function (R) {
        var h = R.int(1, 7) * R.sign(), k = R.int(1, 7) * R.sign(), right = "$y = " + vtex(1, h, k) + "$";
        return mc(R, { prompt: "The graph of $y = x^2$ is moved " + (h > 0 ? "right " + h : "left " + -h) + " and " + (k > 0 ? "up " + k : "down " + -k) + ". What is its new equation?", right: right,
          wrong: [{ t: "$y = " + vtex(1, -h, k) + "$", fb: "That moves it sideways the wrong way. The vertex is where the bracket is zero." }, { t: "$y = " + vtex(1, h, -k) + "$", fb: "The number outside the bracket moves it up when positive, down when negative." }, { t: "$y = " + vtex(1, k, h) + "$", fb: "The sideways shift goes inside the bracket, the vertical one outside." }],
          hints: ["The new vertex is $(" + h + ", " + k + ")$."], why: "Vertex $(" + h + ", " + k + ")$: " + right + "." });
      } }
  ];
  L.unit("alg", 7, {
    title: "Introduction to quadratic functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Recognising quadratic patterns, and how they compare with linear and exponential ones.",
        skills: ["u7-classify", "u7-next"], per: 3 },
      { title: "Quiz 2", after: 8, blurb: "Falling and launched objects.",
        skills: ["u7-fall", "u7-projectile"], per: 3 },
      { title: "Quiz 3", after: 14, blurb: "Standard and factored form: zeros, intercepts, the vertex, and the shape.",
        skills: ["u7-expand", "u7-zeros", "u7-yint", "u7-vertex-fact", "u7-shape", "u7-vertex-std"], per: 2 },
      { title: "Quiz 4", after: 18, blurb: "Reading models, vertex form, and moving a parabola.",
        skills: ["u7-read", "u7-vertex-form", "u7-maxmin", "u7-translate"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg:7", {
    2: { name: "A new pattern", frame: "When the first differences change but the [[second]] differences are constant, the relationship is [[quadratic]]: the area $x(10 - x)$ has an [[$x^2$]] in it.",
         chips: ["first", "exponential", "$x^3$"] },
    3: { name: "Quadratic expression", frame: "A [[quadratic]] expression has a squared variable as its [[highest]] power, like $n^2 + 2n$.",
         chips: ["linear", "only"] },
    4: { name: "Testing for quadratic", frame: "With equal input steps: linear means constant [[first differences]], quadratic means constant [[second differences]], exponential means constant [[ratios]].",
         chips: ["sums"] },
    5: { name: "Quadratic vs exponential", frame: "Exponential growth eventually [[overtakes]] quadratic growth, because it [[multiplies]] where the quadratic only adds a little more each step.",
         chips: ["trails", "adds"] },
    6: { name: "Falling objects", frame: "A dropped object falls $d = 16t^2$ feet: a [[quadratic]] function of time. It falls [[faster]] every second.",
         chips: ["linear", "slower"] },
    7: { name: "Launched objects", frame: "In $h(t) = 5 + 80t - 16t^2$, the 5 is the [[starting height]], the $80t$ is the [[launch]], and the $-16t^2$ is [[gravity]].",
         chips: ["peak"] },
    8: { name: "Parabola", frame: "The graph of a quadratic is a [[parabola]]. Its turning point is the [[vertex]], and its $x$-intercepts are the function's [[zeros]].",
         chips: ["line", "slope"] },
    9: { name: "Equivalent quadratics", frame: "$(x + 2)(x + 5)$ and $x^2 + 7x + 10$ are [[equivalent]]: equal for [[every]] value of $x$. But $(x + 2)^2$ is [[not]] $x^2 + 4$.",
         chips: ["one", "always"] },
    10: { name: "Two forms", frame: "[[Standard]] form is a sum, $ax^2 + bx + c$. [[Factored]] form is a [[product]] of factors.",
          chips: ["Vertex", "sum"] },
    11: { name: "What each form shows", frame: "Factored form shows the [[$x$-intercepts]]. Standard form shows the [[$y$-intercept]], $c$.",
          chips: ["vertex", "slope"] },
    12: { name: "Symmetry", frame: "A parabola is [[symmetric]]: its vertex is [[halfway]] between the zeros, on the [[axis of symmetry]].",
          chips: ["slope", "at a zero"] },
    13: { name: "The roles of a and c", frame: "In $y = ax^2 + c$, $c$ moves the parabola [[up or down]]. A [[negative]] $a$ opens it downward, and a larger $|a|$ makes it [[narrower]].",
          chips: ["positive", "wider"] },
    14: { name: "Vertex from standard form", frame: "For $y = ax^2 + bx + c$, the vertex is at $x =$ [[$\\frac{-b}{2a}$]]. The constant $c$ is still the [[$y$-intercept]].",
          chips: ["$\\frac{b}{2a}$", "$x$-intercept"], fb: { "$\\frac{b}{2a}$": "It's $-b$ on top: for $x^2 - 6x$, the vertex is at $+3$." } },
    15: { name: "Reading a height model", at: 3, frame: "In a height model, the vertex gives the [[greatest height]], the positive zero is when it [[lands]], and the vertical intercept is where it [[starts]].",
          chips: ["slope"] },
    16: { name: "Vertex form", frame: "In $y = a(x - h)^2 + k$ the vertex is [[$(h, k)$]]. So $(x - 3)^2$ means $h$ is [[$3$]], and $(x + 3)^2$ means $h$ is [[$-3$]].",
          chips: ["$(k, h)$"], fb: { "$(k, h)$": "$x$ comes first: $h$ is the horizontal position." } },
    17: { name: "Sketch from vertex form", at: 3, frame: "Plot the [[vertex]], find one more point, and [[mirror]] it across the axis of symmetry. If $a$ is negative, the vertex is a [[maximum]].",
          chips: ["minimum", "intercept"] },
    18: { name: "Moving a parabola", at: 3, frame: "Replacing $x$ with $x - h$ moves the graph [[right]] by $h$. Adding $k$ moves it [[up]] by $k$. Changing $a$ [[stretches]] or flips it.",
          chips: ["left", "down"], fb: { "left": "$(x - 4)^2$ is zero at $x = 4$: the graph moves right." } }
  });
})();
