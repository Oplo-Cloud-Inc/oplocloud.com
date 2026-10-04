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
  var HOW_7_1 = [["Two sides", "The perimeter fixes the sum of the length and the width."], ["Area", "Area = length times width: $x$ times what is left."], ["Table", "Try several lengths and work out each area."], ["Peak", "The areas rise, peak and fall. The peak is the largest area."]];
  LESSONS.push({
    title: "Patterns of change",
    blurb: "Book 7.1 · A quantity that rises, peaks and falls: neither linear nor exponential.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A rectangle is **3 m** long and **7 m** wide. What is its area?",
        answer: 21, post: "m²", skill: "A new pattern of change",
        near: [{ v: 20, fb: "That is the perimeter. The area is length times width." }, { v: 10, fb: "That is $3 + 7$. Multiply for the area." }],
        hints: ["Length times width."], why: "$3 \\times 7 = 21$ square metres." },
      { type: "learn", kicker: "The idea",
        prompt: "Fix the amount of fence, and a pen's two sides trade off: a longer pen is a narrower one. The area rises, reaches a peak, then falls. That pattern is neither linear nor exponential. It is called **quadratic**.",
        scene: { type: "method", how: HOW_7_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "You have **16 m** of fence for a rectangular pen. Watch the largest pen found.",
        scene: { type: "walk", how: HOW_7_1, rows: [
          { step: 1, m: "2x + 2w = 16", say: "16 m goes round all four sides: two lengths and two widths." },
          { step: 1, m: "x + w = 8", say: "Divide every term by 2: the length and the width add to 8." },
          { step: 2, m: "w = 8 - x", say: "If the length is $x$, the width is what is left." },
          { step: 2, m: "A = x(8 - x)", say: "Area is length times width." },
          { step: 3, m: "A = \\op{3}(8 - \\op{3})", say: "Try a length of 3." },
          { step: 3, m: "A = 3 \\cdot 5 = 15", say: "The width is 5, so the area is 15.", 
            ask: { prompt: "A length of 3 leaves a width of 5. What is the area?", answer: 0,
                   options: [{ t: "15" }, { t: "8", fb: "8 is their sum. The area is length times width." }] } },
          { step: 3, m: "7, \\; 12, \\; 15, \\; 16, \\; 15, \\; 12, \\; 7", say: "Do the same for every length from 1 to 7." },
          { step: 4, m: "4 \\times 4 = 16", say: "The areas climb to 16, then come back down. The largest pen is the square." }] },
        gate: true,
        then: "Up, a peak, then down: a new pattern of change." },
      { type: "guided", kicker: "Together",
        prompt: "Now you have **12 m** of fence. Find the largest pen.",
        how: HOW_7_1, skill: "A new pattern of change",
        steps: [
          { step: 1, ask: "What do the length and the width add up to?", type: "num", answer: 6,
            near: [{ v: 12, fb: "12 is the whole perimeter: two lengths and two widths." }], hint: "Half the perimeter.", m: "x + w = 6", say: "Half of 12." },
          { step: 2, ask: "If the length is $x$, what is the area?", type: "choice", answer: 0,
            options: [{ t: "$x(6 - x)$" }, { t: "$6x$", fb: "That would mean a width of 6. The width is what is left: $6 - x$." }],
            m: "A = x(6 - x)", say: "Length times what is left." },
          { step: 3, ask: "What is the area when $x = 2$?", type: "num", answer: 8, hint: "$2 \\times 4$.", lead: [{ m: "A = \\op{2}(6 - \\op{2})", say: "2 goes where $x$ was." }, { m: "A = 2 \\cdot 4 = 8", say: "The width is 4." }], m: "5, \\; 8, \\; 9, \\; 8, \\; 5", say: "Do the same for every length from 1 to 5." },
          { step: 4, ask: "Which pen has the largest area?", type: "choice", answer: 0,
            options: [{ t: "3 by 3" }, { t: "5 by 1", fb: "That has area 5." }, { t: "2 by 4", fb: "That has area 8. One pen beats it." }],
            m: "3 \\times 3 = 9", say: "The square again." }],
        why: "Two sides, area, table, peak. Now try 20 m of fence." },
      { type: "table", kicker: "On your own", prompt: "You have **20 m of fence** for a rectangular pen, so length + width = 10. Fill in the areas.",
        head: ["length", "width", "area"], rows: [[1, 9, 9], [2, 8, null], [3, 7, null], [5, 5, null], [7, 3, null], [9, 1, 9]],
        answers: [[1, 2, 16], [2, 2, 21], [3, 2, 25], [4, 2, 21]], skill: "A new pattern of change", hints: ["Area = length × width."],
        why: "9, 16, 21, 25, 21, 9: the area climbs, peaks at $5 \\times 5$, and comes back down." },
      { type: "rectangle", prompt: "Same fence: the perimeter must stay 20. Find the pen with the **largest area**.",
        l: { v: 8, min: 1, max: 9 }, w: { v: 2, min: 1, max: 9 }, target: { P: 20, A: 25 }, answer: [5, 5], skill: "A new pattern of change",
        hints: ["Keep $l + w = 10$. Try making the sides more equal."], why: "The square, $5 \\times 5$, encloses the most: 25 m²." },
      { type: "learn", kicker: "A harder case",
        prompt: "How do you **recognise** this pattern in a table? Look at how the areas change. Here are the areas for the 20 m fence.",
        scene: { type: "walk", how: HOW_7_1, rows: [
          { step: 3, m: "9, \\; 16, \\; 21, \\; 24, \\; 25", say: "The areas for lengths 1 to 5." },
          { step: 3, m: "16 - 9 = 7", say: "The change from the first area to the second." },
          { step: 3, m: "21 - 16 = 5", say: "The next change." },
          { step: 3, m: "24 - 21 = 3", say: "And the next." },
          { step: 3, m: "25 - 24 = 1", say: "The changes are 7, 5, 3, 1. Not equal, so the pattern is not linear." },
          { step: 4, m: "5 - 7 = -2", say: "Now the change **of the changes**." },
          { step: 4, m: "3 - 5 = -2", say: "The same." },
          { step: 4, m: "1 - 3 = -2", say: "Those changes fall by 2 every time. Constant **second differences** are the mark of a quadratic." }] },
        gate: true },
      { type: "table", kicker: "Try it", prompt: "Look at how the area **changes** as the length goes up by 1. Then how those changes change.",
        head: ["area", "9", "16", "21", "24", "25"], rows: [["\\text{change}", "", 7, null, null, null]], answers: [[0, 3, 5], [0, 4, 3], [0, 5, 1]], skill: "A new pattern of change",
        hints: ["$21 - 16$, then $24 - 21$, then $25 - 24$."], why: "The changes are 7, 5, 3, 1. They aren't constant (so not linear), but they go down by 2 each time: the *changes of the changes* are constant." },
      { type: "choice", prompt: "Here are those areas plotted against the length. What kind of pattern is it?",
        scene: { type: "plane", x: [0, 11], y: [0, 28], labelEveryY: 4, marks: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (l) { return { x: l, y: l * (10 - l), color: "blue", r: 6 }; }) },
        options: [{ t: "Neither linear nor exponential: it rises, then falls." }, { t: "Linear", fb: "A linear pattern would lie on a straight line and never turn round." }, { t: "Exponential", fb: "An exponential pattern keeps growing (or keeps shrinking). It doesn't turn round." }],
        answer: 0, skill: "A new pattern of change", hints: ["Does it keep going the same way?"], why: "The dots make a symmetric arch. This is a new kind of relationship." },
      { type: "expr", prompt: "A different fence gives length + width = 12. Write the area in terms of the length $x$.", answer: "x(12-x)", shown: "x(12 - x)", skill: "Write a quadratic expression", keys: KEYS_Q,
        near: [{ v: "12x", fb: "The width isn't 12. It's what's left of 12 after the length: $12 - x$." }, { v: "x+12-x", fb: "Area multiplies the sides." }],
        hints: ["If the length is $x$, the width is $12 - x$."], why: "Area $= x(12 - x) = 12x - x^2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says: “To get the biggest pen from 20 m of fence, make it as long as possible: 9 by 1.” What is wrong?",
        options: [{ t: "A 9 by 1 pen has area 9. A 5 by 5 pen has area 25." },
                  { t: "A 9 by 1 pen uses more than 20 m of fence.", fb: "$9 + 1 + 9 + 1 = 20$. The fence is right. The area is small." },
                  { t: "Nothing. Longer is always bigger.", fb: "Longer also means narrower. Work out $9 \\times 1$." }],
        answer: 0, skill: "A new pattern of change", hints: ["Step 3: work out both areas."],
        why: "Area is length times width. Stretching one side shrinks the other. The peak is the square." },
      { type: "num", kicker: "Use it", prompt: "With **40 m** of fence, what is the largest area you can enclose?", post: "m²", answer: 100, skill: "A new pattern of change",
        near: [{ v: 400, fb: "That would be a $20 \\times 20$ square, which needs 80 m of fence." }, { v: 10, fb: "10 m is the side. What area does that give?" }],
        hints: ["Length + width = 20. The best pen is a square."], why: "A $10 \\times 10$ square: 100 m²." }
    ]
  });

  /* ============================================ 7.2 · Quadratic relationships */
  var HOW_7_2 = [["Count", "Count the pattern at steps 1, 2, 3 and 4."], ["Squares", "Compare the counts with the squares 1, 4, 9, 16."], ["Extra", "See what is added to each square."], ["Expression", "Write the count for step $n$, and test it."]];
  LESSONS.push({
    title: "Introduction to quadratic relationships",
    blurb: "Book 7.2 · Patterns built from squares, and the expressions that count them.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is $7^2$?",
        answer: 49, skill: "Quadratic patterns",
        near: [{ v: 14, fb: "$7^2$ is $7 \\times 7$, not $7 \\times 2$." }],
        hints: ["$7 \\times 7$."], why: "$7 \\times 7 = 49$." },
      { type: "learn", kicker: "The idea",
        prompt: "Patterns built from squares grow in a special way: each step adds more than the one before. An expression whose highest power is a **square**, such as $n^2$ or $n^2 + 2n$, is a **quadratic expression**.",
        scene: { type: "method", how: HOW_7_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "A pattern has 4, 7, 12 and 19 tiles in steps 1 to 4. Watch an expression found for step $n$.",
        scene: { type: "walk", how: HOW_7_2, rows: [
          { step: 1, m: "4, \\; 7, \\; 12, \\; 19", say: "The counts for steps 1 to 4." },
          { step: 2, m: "1, \\; 4, \\; 9, \\; 16", say: "The squares, for comparison.", 
            ask: { prompt: "Compare 4, 7, 12, 19 with the squares 1, 4, 9, 16. What do you notice?", answer: 0,
                   options: [{ t: "Each is 3 more than a square" }, { t: "Each is double a square", fb: "Double the squares would be 2, 8, 18, 32." }] } },
          { step: 3, m: "4 - 1 = 3", say: "Step 1: the count minus its square." },
          { step: 3, m: "7 - 4 = 3", say: "Step 2." },
          { step: 3, m: "12 - 9 = 3", say: "Step 3. Each count is 3 more than the square." },
          { step: 4, m: "n^2 + 3", say: "Step $n$ has $n^2 + 3$ tiles." },
          { step: 4, m: "(\\op{4})^2 + 3 = 19", say: "Test step 4: $16 + 3 = 19$ ✓." }] },
        gate: true,
        then: "Find the square inside the pattern, then say what is added to it." },
      { type: "guided", kicker: "Together",
        prompt: "Another pattern has 3, 8, 15 and 24 tiles in steps 1 to 4. Find an expression for step $n$.",
        how: HOW_7_2, skill: "Quadratic patterns",
        steps: [
          { step: 2, ask: "Step 3 has 15 tiles. How many more is that than $3^2$?", type: "num", answer: 6, hint: "$15 - 9$.", lead: [{ m: "3 - 1 = 2", say: "Step 1: the count minus its square." }, { m: "8 - 4 = 4", say: "Step 2." }, { m: "15 - 9 = 6", say: "Step 3." }], m: "24 - 16 = 8", say: "Step 4." },
          { step: 3, ask: "The extras are 2, 4, 6, 8. What is the extra at step $n$?", type: "choice", answer: 0,
            options: [{ t: "$2n$" }, { t: "$n + 1$", fb: "At step 3 that gives 4, but the extra there is 6." }, { t: "2", fb: "The extra grows: 2, 4, 6, 8." }],
            m: "2, \\; 4, \\; 6, \\; 8", say: "Twice the step number." },
          { step: 4, ask: "Which expression counts step $n$?", type: "choice", answer: 0,
            options: [{ t: "$n^2 + 2n$" }, { t: "$2n^2$", fb: "At step 1 that gives 2, but the pattern starts with 3." }, { t: "$n^2 + 2$", fb: "At step 2 that gives 6, but the pattern has 8." }],
            m: "n^2 + 2n", say: "Test step 4: $16 + 8 = 24$ ✓." }],
        why: "Count, squares, extra, expression. Now a pattern of dots." },
      { type: "num", kicker: "On your own", prompt: "A pattern of dots: step 1 is a $1 \\times 1$ square, step 2 is $2 \\times 2$, step 3 is $3 \\times 3$. How many dots in **step 10**?", answer: 100, skill: "Quadratic patterns",
        near: [{ v: 20, fb: "The square is 10 by 10: multiply, don't add." }, { v: 40, fb: "That's the perimeter of the square. Count all the dots inside." }],
        hints: ["A $10 \\times 10$ square."], why: "$10 \\times 10 = 100$. Step $n$ has $n^2$ dots." },
      { type: "table", prompt: "Fill in the pattern, and the change from each step to the next.", head: ["step $n$", "dots $n^2$", "change"], rows: [[1, 1, ""], [2, 4, 3], [3, null, null], [4, null, null], [5, null, null]],
        answers: [[2, 1, 9], [2, 2, 5], [3, 1, 16], [3, 2, 7], [4, 1, 25], [4, 2, 9]], skill: "Quadratic patterns", hints: ["Dots: $n \\times n$. Change: this row's dots minus the row above."],
        why: "Dots 1, 4, 9, 16, 25. Changes 3, 5, 7, 9: each change is 2 more than the last." },
      { type: "learn", kicker: "A harder case",
        prompt: "How does a quadratic pattern grow, compared with the others you know?",
        scene: { type: "walk", how: HOW_7_2, rows: [
          { step: 1, m: "1, \\; 4, \\; 9, \\; 16, \\; 25", say: "The squares." },
          { step: 3, m: "4 - 1 = 3", say: "The amount added from the first square to the second." },
          { step: 3, m: "9 - 4 = 5", say: "Then 5." },
          { step: 3, m: "16 - 9 = 7", say: "Then 7. The amount added grows by 2 each time. A linear pattern adds the same amount. An exponential one multiplies." },
          { step: 4, m: "n^2", say: "A quadratic adds a steadily growing amount." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "Linear, quadratic or exponential?",
        bins: ["Linear", "Quadratic", "Exponential"],
        cards: [{ t: "$3n + 1$", bin: 0, fb: "The highest power of $n$ is 1." }, { t: "$n^2 + 2$", bin: 1, fb: "The highest power is $n^2$." }, { t: "$2^n$", bin: 2, fb: "The variable is the exponent." },
                { t: "$n(n + 1)$", bin: 1, fb: "Multiply it out: $n^2 + n$." }, { t: "$5 \\cdot 3^n$", bin: 2, fb: "The variable is the exponent." }, { t: "$7 - n$", bin: 0, fb: "The highest power of $n$ is 1." }],
        skill: "Quadratic patterns", hints: ["Where is the variable: to the first power, squared, or in the exponent?"], why: "$n$: linear. $n^2$: quadratic. $b^n$: exponential." },
      { type: "choice", kicker: "Find the error",
        prompt: "A pattern has $n^2$ dots in step $n$. Kiran says step 5 has 10 dots, “because 5 times 2 is 10”. What is wrong?",
        options: [{ t: "$n^2$ means $n$ times $n$. Step 5 has $5 \\times 5 = 25$ dots." },
                  { t: "Step 5 has 7 dots: $5 + 2$.", fb: "The small 2 is an exponent. It does not get added." },
                  { t: "Nothing. $5^2 = 10$.", fb: "$5^2$ is a 5 by 5 square of dots." }],
        answer: 0, skill: "Quadratic patterns", hints: ["Picture a square of dots, 5 across and 5 down."],
        why: "A square with 5 dots on each side holds 25 dots." },
      { type: "choice", kicker: "Use it", prompt: "A pattern has 2, 5, 10, 17 tiles in steps 1 to 4. Which expression counts them?",
        options: [{ t: "$n^2 + 1$" }, { t: "$3n - 1$", fb: "That gives 2, 5, 8, 11: right at first, then too small." }, { t: "$2^n$", fb: "That gives 2, 4, 8, 16." }, { t: "$n^2$", fb: "That gives 1, 4, 9, 16: each one short." }],
        answer: 0, skill: "Quadratic patterns", hints: ["Compare with the squares: 1, 4, 9, 16."], why: "Each is one more than a square: $1 + 1$, $4 + 1$, $9 + 1$, $16 + 1$." }
    ]
  });

  /* ============================================ 7.3 · Is it quadratic? */
  var HOW_7_3 = [["First", "Subtract each output from the next. These are the first differences."], ["Second", "Subtract each first difference from the next. These are the second differences."], ["Decide", "Constant first differences: linear. Constant second differences: quadratic."]];
  LESSONS.push({
    title: "Determining if a function is quadratic",
    blurb: "Book 7.3 · The test: constant second differences.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A function's outputs are $3, 7, 11, 15$. What is the difference between each output and the next?",
        answer: 4, skill: "Second differences",
        hints: ["$7 - 3$."], why: "$7 - 3 = 4$, $11 - 7 = 4$, $15 - 11 = 4$. Constant differences: a linear function." },
      { type: "learn", kicker: "The idea",
        prompt: "For a linear function the differences between outputs are constant. For a quadratic they are not, but the differences **of those differences** are. That gives a test.",
        scene: { type: "method", how: HOW_7_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the test run on $y = x^2 + 2$, for $x = 1$ to 5.",
        scene: { type: "walk", how: HOW_7_3, rows: [
          { step: 1, m: "3, \\; 6, \\; 11, \\; 18, \\; 27", say: "The outputs." },
          { step: 1, m: "6 - 3 = 3", say: "The first of the first differences." },
          { step: 1, m: "11 - 6 = 5", say: "The second." },
          { step: 1, m: "3, \\; 5, \\; 7, \\; 9", say: "All four first differences. Not constant, so the function is not linear." },
          { step: 2, m: "5 - 3 = 2", say: "Now the differences of those.", 
            ask: { prompt: "The first differences are 3, 5, 7, 9. What are **their** differences?", answer: 0,
                   options: [{ t: "2, 2, 2" }, { t: "8, 12, 16", fb: "Those are sums. Subtract each first difference from the next." }] } },
          { step: 2, m: "7 - 5 = 2", say: "The same." },
          { step: 2, m: "9 - 7 = 2", say: "The second differences are all 2." },
          { step: 3, m: "\\text{quadratic}", say: "Constant second differences." }] },
        gate: true,
        then: "With inputs going up in equal steps, a quadratic has constant **second** differences." },
      { type: "guided", kicker: "Together",
        prompt: "A function's outputs for $x = 1$ to 5 are $1, 6, 15, 28, 45$. Run the test.",
        how: HOW_7_3, skill: "Second differences",
        steps: [
          { step: 1, ask: "What is the first of the first differences, $6 - 1$?", type: "num", answer: 5, hint: "$6 - 1$.", lead: [{ m: "6 - 1 = 5", say: "The first of them." }, { m: "15 - 6 = 9", say: "The second." }], m: "5, \\; 9, \\; 13, \\; 17", say: "All four first differences." },
          { step: 2, ask: "What is $9 - 5$?", type: "num", answer: 4, hint: "The difference between the first two first differences.", lead: [{ m: "9 - 5 = 4", say: "The first of the second differences." }, { m: "13 - 9 = 4", say: "The same." }], m: "17 - 13 = 4", say: "Every second difference is 4." },
          { step: 3, ask: "What kind of function is it?", type: "choice", answer: 0,
            options: [{ t: "Quadratic" }, { t: "Linear", fb: "The first differences, 5, 9, 13, 17, are not constant." }, { t: "Exponential", fb: "The ratios, 6 and 2.5, are not constant." }],
            m: "\\text{quadratic}", say: "Constant second differences." }],
        why: "First differences, second differences, decide. Now fill in a table yourself." },
      { type: "table", kicker: "On your own", prompt: "For $y = x^2 + 3x$, fill in the first differences, then the second differences.",
        head: ["$y$", "0", "4", "10", "18", "28"], rows: [["\\text{1st difference}", "", 4, null, null, null], ["\\text{2nd difference}", "", "", 2, null, null]],
        answers: [[0, 3, 6], [0, 4, 8], [0, 5, 10], [1, 4, 2], [1, 5, 2]], skill: "Second differences", hints: ["First differences: subtract neighbours in the top row.", "Second differences: subtract neighbours in the row you just filled."],
        why: "First differences 4, 6, 8, 10. Second differences 2, 2, 2: constant." },
      { type: "sort", prompt: "Each list is the outputs for $x = 1, 2, 3, 4$. What kind of function?",
        bins: ["Linear", "Quadratic", "Exponential"],
        cards: [{ t: "2, 5, 8, 11", bin: 0, fb: "Differences 3, 3, 3." }, { t: "1, 4, 9, 16", bin: 1, fb: "Differences 3, 5, 7. Second differences 2, 2." }, { t: "3, 6, 12, 24", bin: 2, fb: "Each is double the last." },
                { t: "0, 2, 6, 12", bin: 1, fb: "Differences 2, 4, 6. Second differences 2, 2." }, { t: "5, 3, 1, $-1$", bin: 0, fb: "Differences $-2$, $-2$, $-2$." }],
        skill: "Second differences", hints: ["Find the differences. If they aren't constant, find *their* differences, or try ratios."], why: "First differences, second differences, ratios: one of the three will be constant." },
      { type: "learn", kicker: "A harder case",
        prompt: "The test can run forwards. This sequence is quadratic. Watch its next term found.$$1, \\; 3, \\; 7, \\; 13, \\; 21, \\; \\ldots$$",
        scene: { type: "walk", how: HOW_7_3, rows: [
          { step: 1, m: "3 - 1 = 2", say: "The first of the first differences." },
          { step: 1, m: "2, \\; 4, \\; 6, \\; 8", say: "All four of them." },
          { step: 2, m: "4 - 2 = 2", say: "The second differences are all 2: quadratic." },
          { step: 3, m: "8 + 2 = 10", say: "So the next first difference is 10." },
          { step: 3, m: "21 + 10 = 31", say: "And the next term is 31." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "This sequence is quadratic. What comes next?$$2, \\; 5, \\; 10, \\; 17, \\; \\ldots$$", answer: 26, skill: "Second differences",
        near: [{ v: 24, fb: "The differences are 3, 5, 7. They keep growing by 2, so the next one is 9, not 7." }],
        hints: ["Differences: 3, 5, 7. What's the next difference?"], why: "The next difference is 9: $17 + 9 = 26$." },
      { type: "choice", prompt: "Is $f(x) = x(x + 4)$ a quadratic function?",
        options: [{ t: "Yes: multiplied out, it is $x^2 + 4x$." }, { t: "No: there is no $x^2$ in it.", fb: "Multiply it out: $x \\cdot x = x^2$." }, { t: "No: it's a product, so it's exponential.", fb: "Exponential means the variable is in the exponent. Here $x$ is multiplied by another $x$." }],
        answer: 0, skill: "Second differences", hints: ["Use the distributive property."], why: "$x(x + 4) = x^2 + 4x$. A product of two linear factors is quadratic." },
      { type: "choice", kicker: "Find the error",
        prompt: "A function's outputs are $2, 4, 8, 16$. Kiran says: “The first differences, 2, 4, 8, are not constant, so it is quadratic.” What is wrong?",
        options: [{ t: "He stopped too early. The second differences, 2 and 4, are not constant either. The ratios are: it is exponential." },
                  { t: "The first differences are constant.", fb: "They are 2, 4 and 8." },
                  { t: "Nothing. Non-constant first differences mean quadratic.", fb: "That only rules out linear. Run step 2 as well." }],
        answer: 0, skill: "Second differences", hints: ["Step 2: find the second differences."],
        why: "Second differences 2, 4: not constant. Each output is double the last: exponential." },
      { type: "num", kicker: "Use it", prompt: "When $n$ people all shake hands with each other, there are $\\frac{n(n - 1)}{2}$ handshakes: a quadratic. How many handshakes for **6** people?", answer: 15, skill: "Quadratic patterns",
        near: [{ v: 30, fb: "Each handshake has been counted twice. Halve it." }, { v: 36, fb: "Nobody shakes their own hand: it's $6 \\times 5$, then halved." }],
        hints: ["$\\frac{6 \\times 5}{2}$."], why: "$\\frac{6 \\cdot 5}{2} = 15$." }
    ]
  });

  /* ============================================ 7.4 · Quadratic vs exponential */
  var HOW_7_4 = [["Table", "List both functions for the same inputs."], ["Compare", "At each input, see which is larger."], ["Crossover", "Find the first input where the exponential goes ahead to stay."], ["After", "From there on the exponential pulls away."]];
  LESSONS.push({
    title: "Comparing quadratic and exponential functions",
    blurb: "Book 7.4 · Squaring grows fast. Doubling grows faster, in the end.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is $2^6$?",
        answer: 64, skill: "Quadratic vs exponential",
        near: [{ v: 12, fb: "$2^6$ is six 2s multiplied, not $2 \\times 6$." }, { v: 36, fb: "That is $6^2$. Here the base is 2." }],
        hints: ["2, 4, 8, 16, 32, …"], why: "2, 4, 8, 16, 32, 64." },
      { type: "learn", kicker: "The idea",
        prompt: "Squaring grows fast, and for a while $x^2$ can even lead $2^x$. But a quadratic only **adds** more each step, while an exponential **multiplies**. In the end the exponential always wins.",
        scene: { type: "method", how: HOW_7_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $x^2$ race against $2^x$.",
        scene: { type: "walk", how: HOW_7_4, rows: [
          { step: 1, m: "1, \\; 4, \\; 9, \\; 16, \\; 25, \\; 36", say: "$x^2$ for $x = 1$ to 6." },
          { step: 1, m: "2, \\; 4, \\; 8, \\; 16, \\; 32, \\; 64", say: "$2^x$ for the same inputs." },
          { step: 2, m: "9 > 8", say: "At $x = 3$ the quadratic leads. At $x = 4$ they tie at 16." },
          { step: 3, m: "32 > 25", say: "At $x = 5$ the exponential goes ahead.",
            ask: { prompt: "At $x = 5$: $x^2 = 25$ and $2^x = 32$. Which is ahead?", answer: 0,
                   options: [{ t: "The exponential" }, { t: "The quadratic", fb: "32 is more than 25." }] } },
          { step: 4, m: "64 > 36", say: "At $x = 6$ the gap has grown to 28, and it keeps growing." }] },
        gate: true,
        then: "The quadratic can lead early. The exponential overtakes it and never gives the lead back." },
      { type: "guided", kicker: "Together",
        prompt: "Give the quadratic a head start: race $10x^2$ against $2^x$.",
        how: HOW_7_4, skill: "Quadratic vs exponential",
        steps: [
          { step: 1, ask: "At $x = 8$, $10x^2 = 640$. What is $2^8$?", type: "num", answer: 256, near: [{ v: 16, fb: "That is $2 \\times 8$. $2^8$ is eight 2s multiplied." }], hint: "$2^6 = 64$, so $2^7 = 128$, and $2^8 = \\ldots$",
            m: "640 \\quad\\text{and}\\quad 256", say: "Both functions at $x = 8$." },
          { step: 2, ask: "Which is larger at $x = 8$?", type: "choice", answer: 0,
            options: [{ t: "$10x^2$" }, { t: "$2^x$", fb: "640 is more than 256." }],
            m: "640 > 256", say: "The quadratic still leads." },
          { step: 3, ask: "At $x = 10$, $10x^2 = 1000$. What is $2^{10}$?", type: "num", answer: 1024, near: [big(1024), { v: 512, fb: "That is $2^9$. Double once more." }], hint: "$2^8 = 256$, $2^9 = 512$.",
            m: "1024 > 1000", say: "The exponential is ahead for the first time." },
          { step: 4, ask: "What happens at $x = 11$?", type: "choice", answer: 0,
            options: [{ t: "$2^x$ is further ahead: 2048 against 1210" }, { t: "$10x^2$ takes the lead back", fb: "$10(11)^2 = 1210$ and $2^{11} = 2048$." }],
            m: "2048 > 1210", say: "Once ahead, it stays ahead." }],
        why: "Table, compare, crossover, after. Now the plain race again, on your own." },
      { type: "choice", kicker: "On your own", prompt: "Which is larger at $x = 3$: $x^2$ or $2^x$?",
        options: [{ t: "$x^2$: 9 against 8" }, { t: "$2^x$: exponentials are always bigger", fb: "$3^2 = 9$ and $2^3 = 8$. Not yet." }, { t: "They are equal.", fb: "9 and 8: close, but not equal." }],
        answer: 0, skill: "Quadratic vs exponential", hints: ["Work out both."], why: "$3^2 = 9$ and $2^3 = 8$." },
      { type: "table", prompt: "Keep going.", head: ["$x$", "$x^2$", "$2^x$"], rows: [[3, 9, 8], [4, null, null], [5, null, null], [6, null, null], [10, 100, 1024]],
        answers: [[1, 1, 16], [1, 2, 16], [2, 1, 25], [2, 2, 32], [3, 1, 36], [3, 2, 64]], skill: "Quadratic vs exponential", hints: ["Square the number. Then double from the row above."],
        why: "They tie at $x = 4$ (16 each). After that $2^x$ is ahead: 32 against 25, 64 against 36, 1,024 against 100." },
      { type: "learn", kicker: "Explore", prompt: "Slide $n$ to the end and compare the two.",
        scene: { type: "bars", series: [{ name: "n² (squares)", f: "n^2", color: "green" }, { name: "2ⁿ (doubles)", f: "2^n", color: "blue" }], n: 12, start: 0, gate: true }, gate: true,
        then: "The quadratic grows quickly, and for a while it even leads. But its growth only *adds* more each step. The exponential *multiplies*. **Exponential growth eventually overtakes quadratic growth, always.**" },
      { type: "learn", kicker: "A harder case",
        prompt: "Does a huge head start save the quadratic? Race $100x^2$ against $2^x$.",
        scene: { type: "walk", how: HOW_7_4, rows: [
          { step: 1, m: "100x^2 \\quad\\text{and}\\quad 2^x", say: "A hundred times the quadratic." },
          { step: 2, m: "19600 > 16384", say: "At $x = 14$ the quadratic still leads." },
          { step: 3, m: "32768 > 22500", say: "At $x = 15$ the exponential passes it." },
          { step: 4, m: "65536 > 25600", say: "One step later it is more than double. A head start only delays the crossover." }] },
        gate: true },
      { type: "order", kicker: "Try it", prompt: "Order these from slowest-growing to fastest-growing **in the long run**.",
        items: ["$1000x$", "$x^2$", "$2^x$"], skill: "Quadratic vs exponential", why: "Linear, then quadratic, then exponential. For large enough $x$, each one overtakes everything before it." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says: “$x^2$ beats $2^x$ at $x = 3$, so the quadratic grows faster.” What is wrong?",
        options: [{ t: "One early lead proves nothing. From $x = 5$ on, $2^x$ is ahead and pulling away." },
                  { t: "At $x = 3$ the exponential is larger.", fb: "$3^2 = 9$ and $2^3 = 8$. The quadratic does lead there." },
                  { t: "Nothing. Being ahead once means growing faster.", fb: "Compare them at $x = 10$: 100 against 1024." }],
        answer: 0, skill: "Quadratic vs exponential", hints: ["Step 3: find where the exponential goes ahead to stay."],
        why: "At $x = 10$ it is 100 against 1024. In the long run the exponential always wins." },
      { type: "choice", kicker: "Use it", prompt: "A pond weed covers $A(d) = d^2$ m² after $d$ days in one model, and $B(d) = 2^d$ m² in another. The pond is 1,000 m². Which model fills it first?",
        options: [{ t: "$B$: it passes 1,000 on day 10." }, { t: "$A$: squaring is faster.", fb: "$A$ needs $d^2 \\ge 1000$: about day 32. $B$ needs $2^d \\ge 1000$: day 10." }, { t: "They fill it on the same day.", fb: "$A(10) = 100$ but $B(10) = 1024$." }],
        answer: 0, skill: "Quadratic vs exponential", hints: ["When is $2^d$ over 1,000? When is $d^2$?"], why: "$2^{10} = 1024$. $d^2$ doesn't reach 1,000 until $d = 32$." }
    ]
  });

  /* ============================================ 7.5 · Building quadratic functions, part 1 */
  var HOW_7_5 = [["Fallen", "The distance fallen after $t$ seconds is $16t^2$ feet."], ["Height", "Height above the ground = starting height minus the distance fallen."], ["Use", "Put in a time to get a height."], ["Land", "It lands when the height is 0."]];
  LESSONS.push({
    title: "Building quadratic functions to describe situations, part 1",
    blurb: "Book 7.5 · A falling object: the distance fallen is 16t² feet.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is $16 \\cdot 3^2$?",
        answer: 144, skill: "Falling objects",
        near: [{ v: 96, fb: "$3^2$ is 9, not 6." }, { v: 2304, fb: "Square the 3 first, then multiply: $16 \\cdot 9$." }],
        hints: ["$3^2 = 9$."], why: "$16 \\cdot 9 = 144$." },
      { type: "learn", kicker: "The idea",
        prompt: "Anything that is dropped falls faster and faster. The distance it has fallen grows with the **square** of the time: after $t$ seconds it has fallen $16t^2$ feet. Twice the time means four times the distance.",
        scene: { type: "method", how: HOW_7_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "A rock is dropped from a cliff **400 ft** high. Watch its height worked out.",
        scene: { type: "walk", how: HOW_7_5, rows: [
          { step: 1, m: "16(\\op{1})^2 = 16", say: "The distance fallen after 1 second is $16t^2$: 16 ft." },
          { step: 1, m: "16(\\op{2})^2 = 64", say: "After 2 seconds: $16 \\cdot 4 = 64$ ft." },
          { step: 1, m: "16(\\op{3})^2 = 144", say: "After 3 seconds: $16 \\cdot 9 = 144$ ft." },
          { step: 2, m: "h(t) = 400 - 16t^2", say: "It starts 400 ft up. Take away what it has fallen." },
          { step: 3, m: "h(2) = 400 - 16(\\op{2})^2", say: "Its height after 2 seconds." },
          { step: 3, m: "h(2) = 400 - 64", say: "$16 \\cdot 4 = 64$." },
          { step: 3, m: "h(2) = 336", say: "After 2 seconds the rock is 336 ft above the ground.", 
            ask: { prompt: "After 2 seconds the rock has fallen 64 ft from a 400 ft cliff. How high is it?", answer: 0,
                   options: [{ t: "336 ft" }, { t: "64 ft", fb: "64 ft is how far it has fallen. Its height is what is left: $400 - 64$." }] } },
          { step: 4, m: "400 - 16t^2 = 0", say: "It lands when the height is 0." },
          { step: 4, m: "400 - 16t^2 \\op{+ 16t^2} = 0 \\op{+ 16t^2}", say: "Add $16t^2$ to both sides." },
          { step: 4, m: "400 = 16t^2", say: "The $16t^2$ terms on the left cancel." },
          { step: 4, m: "\\frac{400}{\\op{16}} = \\frac{16t^2}{\\op{16}}", say: "Divide both sides by 16." },
          { step: 4, m: "25 = t^2", say: "$400 \\div 16 = 25$." },
          { step: 4, m: "t = 5", say: "The positive number whose square is 25: it lands after 5 seconds." }] },
        gate: true,
        then: "The distance fallen is a **quadratic function of time**: $d(t) = 16t^2$." },
      { type: "guided", kicker: "Together",
        prompt: "A coin is dropped from a balcony **64 ft** above the ground. Work out its fall.",
        how: HOW_7_5, skill: "Falling objects",
        steps: [
          { step: 1, ask: "How far has it fallen after 1 second?", type: "num", answer: 16, post: "ft", hint: "$16 \\cdot 1^2$.", m: "16t^2", say: "16 ft in the first second." },
          { step: 2, ask: "Which function gives its height above the ground?", type: "choice", answer: 0,
            options: [{ t: "$h(t) = 64 - 16t^2$" }, { t: "$h(t) = 16t^2$", fb: "That is the distance fallen, not the height above the ground." }, { t: "$h(t) = 64 - 16t$", fb: "The distance fallen uses $t^2$: it falls faster and faster." }],
            m: "h(t) = 64 - 16t^2", say: "Start height minus distance fallen." },
          { step: 3, ask: "What is $h(1)$?", type: "num", answer: 48, post: "ft", near: [{ v: 16, fb: "16 ft is how far it has fallen. Subtract that from 64." }], hint: "$64 - 16$.",
            lead: [{ m: "h(1) = 64 - 16(\\op{1})^2", say: "1 goes where $t$ was." }, { m: "h(1) = 64 - 16", say: "$16 \\cdot 1 = 16$." }], m: "h(1) = 48", say: "48 ft up after 1 second." },
          { step: 4, ask: "It lands when $16t^2 = 64$, so $t^2 = 4$. What is $t$?", type: "num", answer: 2, post: "s", near: [{ v: 4, fb: "4 is $t^2$. Which number squared makes 4?" }], hint: "Which number squared makes 4?",
            lead: [{ m: "16t^2 = 64", say: "The coin has fallen the whole 64 ft." }, { m: "\\frac{16t^2}{\\op{16}} = \\frac{64}{\\op{16}}", say: "Divide both sides by 16." }, { m: "t^2 = 4", say: "$64 \\div 16 = 4$." }], m: "t = 2", say: "The positive number whose square is 4. It lands after 2 seconds." }],
        why: "Fallen, height, use, land. Now the rock on the cliff." },
      { type: "num", kicker: "On your own", prompt: "A rock is dropped from a cliff. After 1 second it has fallen **16 ft**, after 2 seconds **64 ft**, after 3 seconds **144 ft**. How far after **4** seconds?", post: "ft", answer: 256, skill: "Falling objects",
        near: [{ v: 224, fb: "The gaps are 48, 80, … and they keep growing by 32. The next gap is 112." }, { v: 64, fb: "It doesn't fall 16 ft every second: it speeds up." }],
        hints: ["Divide each distance by 16: 1, 4, 9, … What are those numbers?"], why: "$16 \\cdot 1$, $16 \\cdot 4$, $16 \\cdot 9$, so next is $16 \\cdot 16 = 256$. The distances are 16 times the square numbers." },
      { type: "num", prompt: "Use $d(t) = 16t^2$: how far does the rock fall in **2.5** seconds?", post: "ft", answer: 100, skill: "Falling objects",
        near: [{ v: 40, fb: "Square 2.5 first: $2.5^2 = 6.25$." }, { v: 1600, fb: "Only $t$ is squared, not the 16." }], hints: ["$2.5^2 = 6.25$."], why: "$16 \\times 6.25 = 100$ ft." },
      { type: "learn", kicker: "Explore", prompt: "Slide $t$ and watch the rock's height. **When does it hit the ground?**",
        scene: { type: "plane", x: [0, 6], y: [0, 420], gridY: 50, labelEveryY: 100, aspect: 0.85, axisLabels: ["t", "h"], gate: true,
          params: { t: { v: 0, min: 0, max: 5, step: 0.5, label: "$t$ (s)" } }, fns: [{ f: rock, color: "blue" }],
          marks: [{ x: function (P) { return P.t; }, y: function (P) { return rock(P.t); }, color: "orange", r: 7 }],
          readout: function (st) { var t = st.params.t; return "$h(" + nm(t) + ") = 400 - 16(" + nm(t) + ")^2 = " + nm(rock(t)) + "$ ft"; }, goal: function (st) { return st.params.t === 5; } },
        gate: true,
        then: "$h(5) = 0$: it lands after 5 seconds. Notice the graph is nearly flat at first and steep at the end: the rock barely moves in the first half-second and is falling fast by the last." },
      { type: "learn", kicker: "A harder case",
        prompt: "The landing time need not be a whole number. A ball is dropped from **100 ft**.",
        scene: { type: "walk", how: HOW_7_5, rows: [
          { step: 1, m: "16t^2", say: "The distance fallen." },
          { step: 2, m: "h(t) = 100 - 16t^2", say: "Height above the ground." },
          { step: 4, m: "16t^2 = 100", say: "It lands when it has fallen the whole 100 ft." },
          { step: 4, m: "\\frac{16t^2}{\\op{16}} = \\frac{100}{\\op{16}}", say: "Divide both sides by 16." },
          { step: 4, m: "t^2 = 6.25", say: "$100 \\div 16 = 6.25$." },
          { step: 4, m: "t = 2.5", say: "The positive number whose square is 6.25: $2.5 \\cdot 2.5 = 6.25$. It lands after 2.5 seconds." }] },
        gate: true },
      { type: "num", kicker: "Try it",
        prompt: "A stone is dropped from **256 ft**: $h(t) = 256 - 16t^2$. After how many seconds does it land?",
        answer: 4, post: "s", skill: "Falling objects",
        near: [{ v: 16, fb: "16 is $t^2$. Which number squared makes 16?" }],
        hints: ["Step 4: $16t^2 = 256$.", "$t^2 = 16$."], why: "$16t^2 = 256$ gives $t^2 = 16$, so $t = 4$ seconds." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says: “It falls 16 ft in the first second, so it falls 32 ft in 2 seconds.” What is wrong?",
        options: [{ t: "The distance grows with $t^2$. In 2 seconds it falls $16 \\cdot 4 = 64$ ft." },
                  { t: "It falls 18 ft in 2 seconds.", fb: "Use the formula: $16 \\cdot 2^2$." },
                  { t: "Nothing. Twice the time means twice the distance.", fb: "That would be true at a steady speed. A falling object keeps speeding up." }],
        answer: 0, skill: "Falling objects", hints: ["Step 1: work out $16t^2$ with $t = 2$."],
        why: "$16 \\cdot 2^2 = 64$. Twice the time gives four times the distance." },
      { type: "num", kicker: "Use it", prompt: "A coin is dropped from a bridge **144 ft** above a river: $h(t) = 144 - 16t^2$. After how many seconds does it reach the water?", post: "s", answer: 3, skill: "Falling objects",
        near: [{ v: 9, fb: "$t^2 = 9$. Now take the square root." }], hints: ["Solve $144 - 16t^2 = 0$.", "$16t^2 = 144$, so $t^2 = 9$."], why: "$t^2 = 9$, so $t = 3$ seconds." }
    ]
  });

  /* ============================================ 7.6 · Building quadratic functions, part 2 */
  var HOW_7_6 = [["Start", "The starting height: where the object is at $t = 0$."], ["Launch", "Launch speed times time: how far up the throw alone would carry it."], ["Gravity", "$16t^2$: how far gravity has pulled it back."], ["Height", "Start, plus the launch, minus gravity's pull."]];
  LESSONS.push({
    title: "Building quadratic functions to describe situations, part 2",
    blurb: "Book 7.6 · Launch something upward: a starting height, a launch speed, and gravity pulling back.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A ball is launched straight up from **5 ft** at **80 ft per second**. If there were **no gravity**, how high would it be after 2 seconds?", post: "ft", answer: 165, skill: "Projectile height",
        near: [{ v: 160, fb: "That's the distance travelled. It started 5 ft up." }], hints: ["It rises 80 ft each second, from 5 ft."], why: "$5 + 80(2) = 165$ ft. Without gravity the height is linear." },
      { type: "learn", kicker: "The idea",
        prompt: "A launched object does two things at once. The launch carries it up at a steady speed. Gravity pulls it back by $16t^2$ feet. Its height is the starting height, plus the launch, minus gravity's pull.",
        scene: { type: "method", how: HOW_7_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "A ball is launched straight up from **5 ft** at **80 ft per second**. Watch its height after 1 second worked out.",
        scene: { type: "walk", how: HOW_7_6, rows: [
          { step: 1, m: "5", say: "It starts 5 ft above the ground." },
          { step: 2, m: "80(\\op{1}) = 80", say: "The launch alone would carry it 80 ft up in 1 second." },
          { step: 3, m: "16(\\op{1})^2 = 16", say: "Gravity has pulled it back 16 ft.", 
            ask: { prompt: "How far does gravity pull an object back in 1 second?", answer: 0,
                   options: [{ t: "$16 \\cdot 1^2 = 16$ ft" }, { t: "80 ft", fb: "80 is the launch speed. Gravity's pull is $16t^2$." }] } },
          { step: 4, m: "h(1) = 5 + 80 - 16", say: "Start, plus launch, minus gravity." },
          { step: 4, m: "h(1) = 85 - 16", say: "$5 + 80 = 85$." },
          { step: 4, m: "h(1) = 69", say: "After 1 second the ball is 69 ft up." },
          { step: 4, m: "h(t) = 5 + 80t - 16t^2", say: "The same three parts, for any time $t$." }] },
        gate: true,
        then: "Starting height, plus launch, minus gravity: a quadratic function of time." },
      { type: "guided", kicker: "Together",
        prompt: "Another ball follows $h(t) = 3 + 48t - 16t^2$. Find its height after 1 second.",
        how: HOW_7_6, skill: "Projectile height",
        steps: [
          { step: 1, ask: "What does the 3 tell you?", type: "choice", answer: 0,
            options: [{ t: "The ball starts 3 ft up" }, { t: "It is launched at 3 ft per second", fb: "The launch speed multiplies $t$: that is the 48." }],
            m: "3", say: "The starting height." },
          { step: 2, ask: "The launch speed is 48 ft per second. How far would the launch alone carry it in 1 second?", type: "num", answer: 48, post: "ft", hint: "$48 \\cdot 1$.", m: "48(1) = 48", say: "The launch." },
          { step: 3, ask: "How far has gravity pulled it back after 1 second?", type: "num", answer: 16, post: "ft", hint: "$16 \\cdot 1^2$.", m: "16(1)^2 = 16", say: "Gravity's pull." },
          { step: 4, ask: "So what is $h(1)$?", type: "num", answer: 35, post: "ft", near: [{ v: 67, fb: "Gravity's pull is subtracted: $3 + 48 - 16$." }], hint: "$3 + 48 - 16$.",
            lead: [{ m: "h(1) = 3 + 48 - 16", say: "Start, plus launch, minus gravity." }, { m: "h(1) = 51 - 16", say: "$3 + 48 = 51$." }], m: "h(1) = 35", say: "35 ft up after 1 second." }],
        why: "Start, launch, gravity, height. Now the first ball, after 2 seconds." },
      { type: "num", kicker: "On your own", prompt: "But gravity pulls it back by $16t^2$ feet. What is its real height after 2 seconds?", post: "ft", answer: 101, skill: "Projectile height",
        near: [{ v: 229, fb: "Gravity pulls it *down*: subtract $16t^2$." }, { v: 133, fb: "$16t^2$ is $16 \\times 4 = 64$, not 32." }], hints: ["$165 - 16(2)^2$."], why: "$165 - 64 = 101$ ft." },
      { type: "table", prompt: "Fill in the ball's height.", head: ["$t$ (s)", "$h(t)$ (ft)"], rows: [[0, 5], [1, null], [2, 101], [3, null], [4, 69], [5, null]],
        answers: [[1, 1, 69], [3, 1, 101], [5, 1, 5]], skill: "Projectile height", hints: ["$5 + 80t - 16t^2$ for each $t$."],
        why: "$h(1) = 69$, $h(3) = 5 + 240 - 144 = 101$, $h(5) = 5 + 400 - 400 = 5$. The heights are symmetric: up, then back down the same way." },
      { type: "learn", kicker: "Explore", prompt: "Slide $t$. **Find the moment the ball is highest.**",
        scene: { type: "plane", x: [0, 6], y: [0, 115], gridY: 10, labelEveryY: 20, aspect: 0.85, axisLabels: ["t", "h"], gate: true,
          params: { t: { v: 0, min: 0, max: 5, step: 0.5, label: "$t$ (s)" } }, fns: [{ f: ball, color: "blue" }],
          marks: [{ x: function (P) { return P.t; }, y: function (P) { return ball(P.t); }, color: "orange", r: 7 }],
          readout: function (st) { var t = st.params.t; return "$h(" + nm(t) + ") = " + nm(ball(t)) + "$ ft" + (t === 2.5 ? " ← the highest point" : ""); }, goal: function (st) { return st.params.t === 2.5; } },
        gate: true,
        then: "The peak is at $t = 2.5$ s, where $h = 105$ ft: halfway between $t = 0$ and $t = 5$, the two times the ball is at 5 ft. A quadratic graph is symmetric about its highest point." },
      { type: "learn", kicker: "A harder case",
        prompt: "When is the ball **highest**? Use the symmetry of $h(t) = 5 + 80t - 16t^2$.",
        scene: { type: "walk", how: HOW_7_6, rows: [
          { step: 1, m: "h(0) = 5", say: "The ball starts at 5 ft." },
          { step: 4, m: "h(5) = 5 + 80(\\op{5}) - 16(\\op{5})^2", say: "Try $t = 5$." },
          { step: 4, m: "h(5) = 5 + 400 - 400", say: "$80 \\cdot 5 = 400$ and $16 \\cdot 25 = 400$." },
          { step: 4, m: "h(5) = 5", say: "At $t = 5$ it is back at 5 ft." },
          { step: 4, m: "t = \\frac{0 + 5}{2} = 2.5", say: "The graph of a quadratic is symmetric, so the peak is halfway between those two times." },
          { step: 4, m: "h(2.5) = 5 + 80(\\op{2.5}) - 16(\\op{2.5})^2", say: "The height at the peak." },
          { step: 4, m: "h(2.5) = 5 + 200 - 100", say: "$80 \\cdot 2.5 = 200$ and $16 \\cdot 6.25 = 100$." },
          { step: 4, m: "h(2.5) = 105", say: "The highest point: 105 ft." }] },
        gate: true },
      { type: "num", kicker: "Try it",
        prompt: "A ball follows $h(t) = 4 + 64t - 16t^2$. It is 4 ft up at $t = 0$, and again at $t = 4$. At what time is it **highest**?",
        answer: 2, post: "s", skill: "Projectile height",
        near: [{ v: 4, fb: "At $t = 4$ it is back down at 4 ft. The peak is halfway there." }],
        hints: ["The peak is halfway between the two times with the same height."], why: "Halfway between 0 and 4 is $t = 2$. There $h = 4 + 128 - 64 = 68$ ft." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $h(t) = 5 + 80t - 16t^2$, Kiran says: “The ball is launched from 80 ft at 5 ft per second.” What is wrong?",
        options: [{ t: "He swapped them. 5 is the starting height, and 80 is the launch speed." },
                  { t: "The ball is launched from 16 ft.", fb: "The 16 belongs to gravity's pull, $16t^2$." },
                  { t: "Nothing. That is right.", fb: "Put in $t = 0$: the height is 5." }],
        answer: 0, skill: "Projectile height", hints: ["Step 1: what is the height at $t = 0$?"],
        why: "At $t = 0$ the height is 5. The number multiplying $t$ is the launch speed: 80 ft per second." },
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
  var HOW_7_7 = [["Zeros", "Find where the graph meets the $x$-axis. The height is 0 there."], ["Vertex", "Find the turning point: halfway between the zeros."], ["Domain", "The inputs that make sense in the situation."], ["Range", "The outputs: from the lowest height to the highest."]];
  LESSONS.push({
    title: "Domain, range, vertex, and zeros of quadratic functions",
    blurb: "Book 7.7 · The turning point is the vertex. Where the graph meets the axis are the zeros.",
    mins: 12, v: 3,
    steps: [
      { type: "plane", kicker: "Warm up", prompt: "A fountain's jet of water follows $h(x) = 6x - x^2$: its height, in feet, at a distance $x$ feet from the nozzle. **Click the highest point of the jet.**",
        x: [-1, 8], y: [-1, 10], axisLabels: ["x", "h"], click: "point", answer: { point: [3, 9] }, skill: "Vertex and zeros", fns: [{ f: arc, color: "blue" }],
        clickFb: function (c) { return arc(c[0]) === c[1] ? "That's on the jet, at height " + nm(c[1]) + ". It gets higher." : "Click a point on the curve."; },
        hints: ["The top of the arch."], why: "$(3, 9)$: 3 ft out, the water is 9 ft high." },
      { type: "learn", kicker: "The idea",
        prompt: "The graph of a quadratic function is a **parabola**. Its turning point is the **vertex**. The inputs where it meets the $x$-axis are its **zeros**. Those few points give its domain and range in a situation.",
        scene: { type: "method", how: HOW_7_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "A jet of water follows $h(x) = 8x - x^2$: its height in feet, $x$ feet from the nozzle. Watch its key features found.",
        scene: { type: "walk", how: HOW_7_7, rows: [
          { step: 1, m: "8x - x^2 = x(8 - x)", say: "Take out the common factor $x$." },
          { step: 1, m: "x = 0", say: "A product is 0 when a factor is 0. The first factor is $x$." },
          { step: 1, m: "8 - x = 0", say: "Or the second factor is 0." },
          { step: 1, m: "x = 8", say: "That happens at 8. The zeros are 0 and 8." },
          { step: 2, m: "x = \\frac{0 + 8}{2} = 4", say: "The vertex is halfway between the zeros.", 
            ask: { prompt: "The zeros are 0 and 8. Where is the vertex?", answer: 0,
                   options: [{ t: "At $x = 4$, halfway between them" }, { t: "At $x = 8$", fb: "At 8 the water lands: the height is 0. The peak is in the middle." }] } },
          { step: 2, m: "h(4) = 8(\\op{4}) - (\\op{4})^2", say: "The height there: put 4 in place of $x$." },
          { step: 2, m: "h(4) = 32 - 16", say: "$8 \\cdot 4 = 32$ and $4^2 = 16$." },
          { step: 2, m: "h(4) = 16", say: "The vertex is $(4, 16)$: the jet's highest point." },
          { step: 3, m: "0 \\le x \\le 8", say: "The water exists only between the nozzle and the place it lands." },
          { step: 4, m: "0 \\le h \\le 16", say: "From the ground up to the vertex." }] },
        gate: true,
        then: "Zeros, vertex, domain, range: four facts that describe the whole jet." },
      { type: "guided", kicker: "Together",
        prompt: "A smaller jet follows $h(x) = 4x - x^2$. Find its features.",
        how: HOW_7_7, skill: "Vertex and zeros",
        steps: [
          { step: 1, ask: "$4x - x^2 = x(4 - x)$. Where is the height 0?", type: "choice", answer: 0,
            options: [{ t: "At $x = 0$ and $x = 4$" }, { t: "At $x = 4$ only", fb: "The factor $x$ is 0 when $x = 0$ as well." }, { t: "At $x = 2$", fb: "$h(2) = 8 - 4 = 4$, not 0." }],
            lead: [{ m: "x = 0", say: "The first factor is 0." }, { m: "4 - x = 0", say: "Or the second factor is 0." }], m: "x = 4", say: "The zeros are 0 and 4." },
          { step: 2, ask: "The vertex is halfway between the zeros. What is its $x$-coordinate?", type: "num", answer: 2, hint: "Halfway between 0 and 4.", m: "x = \\frac{0 + 4}{2} = 2", say: "Halfway between the zeros." },
          { step: 2, ask: "What is $h(2) = 4(2) - 2^2$?", type: "num", answer: 4, near: [{ v: 6, fb: "$2^2$ is 4, not 2: $8 - 4$." }], hint: "$8 - 4$.", lead: [{ m: "h(2) = 4(\\op{2}) - (\\op{2})^2", say: "2 goes where $x$ was." }, { m: "h(2) = 8 - 4", say: "$4 \\cdot 2 = 8$ and $2^2 = 4$." }], m: "h(2) = 4", say: "The vertex is $(2, 4)$." },
          { step: 3, ask: "Which domain makes sense?", type: "choice", answer: 0,
            options: [{ t: "$0 \\le x \\le 4$" }, { t: "All real numbers", fb: "Before the nozzle and beyond the landing point there is no water." }],
            m: "0 \\le x \\le 4", say: "From the nozzle to the landing point." },
          { step: 4, ask: "And the range?", type: "choice", answer: 0,
            options: [{ t: "$0 \\le h \\le 4$" }, { t: "$0 \\le h \\le 2$", fb: "2 is **where** the peak is. The range is about heights, and the peak is 4 high." }],
            m: "0 \\le h \\le 4", say: "From the ground up to the vertex." }],
        why: "Zeros, vertex, domain, range. Now the fountain from the warm-up." },
      { type: "numbers", kicker: "On your own", prompt: "What are the zeros of $h(x) = 6x - x^2$?", scene: graph([-1, 8], [-1, 10], [{ f: arc, color: "blue" }], { axisLabels: ["x", "h"] }),
        answer: [0, 6], skill: "Vertex and zeros", placeholder: "e.g. 1, 4", hints: ["Where does the curve meet the horizontal axis?"], why: "$h(0) = 0$ and $h(6) = 36 - 36 = 0$: the nozzle, and where the water lands." },
      { type: "choice", prompt: "The jet leaves the nozzle at $x = 0$ and lands at $x = 6$. What domain makes sense for $h$?",
        options: [{ t: "$0 \\le x \\le 6$" }, { t: "All real numbers", fb: "The formula works for any $x$, but the water only exists between the nozzle and where it lands." }, { t: "$0 \\le x \\le 9$", fb: "9 is the greatest height, an output." }],
        answer: 0, skill: "Domain and range of a quadratic", hints: ["Where is there actually water?"], why: "The situation limits the inputs to $0 \\le x \\le 6$." },
      { type: "choice", prompt: "And the range, on that domain?",
        options: [{ t: "$0 \\le h \\le 9$" }, { t: "$h \\le 9$", fb: "That's the range of the whole parabola. On this domain the water is never below the ground." }, { t: "$0 \\le h \\le 6$", fb: "The vertex is at height 9." }],
        answer: 0, skill: "Domain and range of a quadratic", hints: ["Lowest and highest outputs."], why: "From ground level, 0, up to the vertex, 9." },
      { type: "learn", kicker: "A harder case",
        prompt: "A parabola that opens **upward** has a lowest point instead.$$y = x^2 - 4x$$",
        scene: { type: "walk", how: HOW_7_7, rows: [
          { step: 1, m: "x^2 - 4x = x(x - 4)", say: "Take out the common factor $x$." },
          { step: 1, m: "x = 0", say: "One zero: the first factor is 0." },
          { step: 1, m: "x = 4", say: "The other: $x - 4 = 0$." },
          { step: 2, m: "x = \\frac{0 + 4}{2} = 2", say: "The vertex is halfway between the zeros." },
          { step: 2, m: "y = (\\op{2})^2 - 4(\\op{2})", say: "Its height: put 2 in place of $x$." },
          { step: 2, m: "y = 4 - 8", say: "$2^2 = 4$ and $4 \\cdot 2 = 8$." },
          { step: 2, m: "y = -4", say: "The vertex is $(2, -4)$, **below** the axis. This parabola opens upward, so the vertex is its lowest point." },
          { step: 3, m: "\\text{all real numbers}", say: "With no situation to limit it, every $x$ is allowed." },
          { step: 4, m: "y \\ge -4", say: "The outputs start at the minimum and go up for ever." }] },
        gate: true },
      { type: "pair", kicker: "Try it", prompt: "This parabola opens **upward**. What are the coordinates of its vertex?", scene: graph([-2, 6], [-3, 8], [{ f: function (x) { return (x - 1) * (x - 3); }, color: "green" }]),
        answer: [2, -1], skill: "Vertex and zeros", near: [{ v: [-1, 2], fb: "Right numbers, wrong order: $x$ first." }, { v: [0, 3], fb: "That's the $y$-intercept. The vertex is the lowest point." }],
        hints: ["The lowest point of the curve."], why: "$(2, -1)$ is the minimum. Its zeros are 1 and 3, and the vertex sits halfway between them." },
      { type: "choice", kicker: "Find the error",
        prompt: "For the fountain $h(x) = 6x - x^2$, Kiran says the range is $0 \\le h \\le 6$, “because the water lands at 6”. What is wrong?",
        options: [{ t: "6 is an input: where it lands. The range is about heights, from 0 up to 9." },
                  { t: "The range is $0 \\le h \\le 3$.", fb: "3 is where the peak is, not how high it is." },
                  { t: "Nothing. The range is 0 to 6.", fb: "Work out the height at the vertex: $h(3) = 18 - 9$." }],
        answer: 0, skill: "Domain and range of a quadratic", hints: ["Step 2: find the vertex's height."],
        why: "The vertex is $(3, 9)$. Heights run from 0 to 9. The 6 belongs to the domain." },
      { type: "num", kicker: "Use it",
        prompt: "A ball's height is $h(t) = 10t - t^2$ metres after $t$ seconds. It is on the ground at $t = 0$ and at $t = 10$. What is its **greatest height**?",
        answer: 25, post: "m", skill: "Vertex and zeros",
        near: [{ v: 5, fb: "5 is **when** it is highest. Put $t = 5$ into the function for the height." }, { v: 10, fb: "At $t = 10$ it is back on the ground." }],
        hints: ["Step 2: the vertex is halfway between the zeros, at $t = 5$.", "$h(5) = 50 - 25$."], why: "The vertex is at $t = 5$: $h(5) = 50 - 25 = 25$ metres." }
    ]
  });

  /* ============================================ 7.8 · Equivalent quadratic expressions */
  var HOW_7_8 = [["Split", "Split each side into its parts."], ["Multiply", "Multiply every part by every part."], ["Combine", "Add the like terms."], ["Test", "Check with a value of $x$: both forms must give the same number."]];
  LESSONS.push({
    title: "Equivalent quadratic expressions",
    blurb: "Book 7.8 · A product of two sides and a sum of areas are the same quantity, written two ways.",
    mins: 12, v: 3,
    steps: [
      { type: "expr", kicker: "Warm up", prompt: "Write $x(x + 5)$ as a sum.", answer: "x^2+5x", shown: "x^2 + 5x", form: "simplified", skill: "Equivalent quadratic expressions", keys: KEYS_Q,
        near: [{ v: "x^2+5", fb: "The $x$ multiplies the 5 as well." }, { v: "2x+5", fb: "$x \\cdot x$ is $x^2$, not $2x$." }], hints: ["Distribute: $x \\cdot x$ and $x \\cdot 5$."], why: "$x \\cdot x + x \\cdot 5 = x^2 + 5x$." },
      { type: "learn", kicker: "Explore", prompt: "A rectangle is $x + 5$ wide and $x + 2$ tall. Fill in the area of each part.",
        scene: { type: "tiles", mode: "area", rows: ["x", "2"], cols: ["x", "5"], cells: [["x^2", "5x"], ["2x", "10"]], readout: "$(x + 2)(x + 5) = x^2 + 5x + 2x + 10 = x^2 + 7x + 10$", gate: true }, gate: true,
        then: "The whole area can be written as a **product**, $(x + 2)(x + 5)$, or as a **sum**, $x^2 + 7x + 10$. They are **equivalent expressions**: equal for every $x$." },
      { type: "learn", kicker: "The idea",
        prompt: "The area of a rectangle can be written as a **product** of its sides, or as a **sum** of its parts. The two are **equivalent expressions**: equal for every value of $x$.",
        scene: { type: "method", how: HOW_7_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a product rewritten as a sum, and checked.$$(x + 2)(x + 5)$$",
        scene: { type: "walk", how: HOW_7_8, rows: [
          { step: 1, m: "(x + 2)(x + 5)", say: "One side is $x$ and 2. The other is $x$ and 5.",
            fig: L.boxFig({ side: ["x", "2"], top: ["x", "5"], cells: [["", ""], ["", ""]], alt: "An empty two by two box. Down the side: x and 2. Along the top: x and 5." }) },
          { step: 2, m: "\\op{x} \\cdot x = x^2", say: "$x$ meets $x$.",
            fig: L.boxFig({ side: ["x", "2"], top: ["x", "5"], cells: [["x^2", ""], ["", ""]], lit: [0, 0], alt: "The box with x squared in the first cell." }) },
          { step: 2, m: "\\op{x} \\cdot 5 = 5x", say: "$x$ meets 5.",
            fig: L.boxFig({ side: ["x", "2"], top: ["x", "5"], cells: [["x^2", "5x"], ["", ""]], lit: [0, 1], alt: "The box with x squared and 5x in the top row." }) },
          { step: 2, m: "\\op{2} \\cdot x = 2x", say: "2 meets $x$.",
            fig: L.boxFig({ side: ["x", "2"], top: ["x", "5"], cells: [["x^2", "5x"], ["2x", ""]], lit: [1, 0], alt: "The box with x squared, 5x and 2x filled in." }) },
          { step: 2, m: "\\op{2} \\cdot 5 = 10", say: "2 meets 5.",
            fig: L.boxFig({ side: ["x", "2"], top: ["x", "5"], cells: [["x^2", "5x"], ["2x", "10"]], lit: [1, 1], alt: "The full box: x squared, 5x, 2x and 10." }) },
          { step: 2, m: "x^2 + 5x + 2x + 10", say: "Every part meets every part.",
            fig: L.boxFig({ side: ["x", "2"], top: ["x", "5"], cells: [["x^2", "5x"], ["2x", "10"]], alt: "The full box: x squared, 5x, 2x and 10." }) },
          { step: 3, m: "x^2 + 7x + 10", say: "$5x + 2x = 7x$." },
          { step: 4, m: "(\\op{1} + 2)(\\op{1} + 5) = 18", say: "Test with $x = 1$: the product gives $3 \\cdot 6 = 18$.", 
            ask: { prompt: "How can you check that two expressions are equivalent?", answer: 0,
                   options: [{ t: "Put the same number into both and compare" }, { t: "See whether they look alike", fb: "Equivalent expressions can look very different. Test them with a number." }] } },
          { step: 4, m: "(\\op{1})^2 + 7(\\op{1}) + 10 = 18", say: "The sum gives $1 + 7 + 10 = 18$. Both forms agree ✓." }] },
        gate: true,
        then: "A product and a sum can be the same quantity, written two ways." },
      { type: "guided", kicker: "Together",
        prompt: "Now you rewrite a product as a sum.$$(x + 3)(x + 4)$$",
        how: HOW_7_8, skill: "Equivalent quadratic expressions",
        steps: [
          { step: 2, ask: "Which list has all four products?", type: "choice", answer: 0,
            options: [{ t: "$x^2$, $4x$, $3x$ and 12" }, { t: "$x^2$ and 12", fb: "The two middle products are missing." }, { t: "$x^2$, $7x$ and 7", fb: "$3 \\cdot 4 = 12$, not 7." }],
            lead: [{ m: "\\op{x} \\cdot x = x^2", say: "$x$ meets $x$." }, { m: "\\op{x} \\cdot 4 = 4x", say: "$x$ meets 4." }, { m: "\\op{3} \\cdot x = 3x", say: "3 meets $x$." }, { m: "\\op{3} \\cdot 4 = 12", say: "3 meets 4." }], m: "x^2 + 4x + 3x + 12", say: "Every part meets every part." },
          { step: 3, ask: "Combine the like terms.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 7x + 12$" }, { t: "$x^2 + 12x + 7$", fb: "The $x$ terms are $4x$ and $3x$: together $7x$. The number is 12." }],
            m: "x^2 + 7x + 12", say: "$4x + 3x = 7x$." },
          { step: 4, ask: "Test with $x = 1$: what is $(1 + 3)(1 + 4)$?", type: "num", answer: 20, hint: "$4 \\times 5$.",
            lead: [{ m: "(\\op{1} + 3)(\\op{1} + 4) = 20", say: "The product: $4 \\cdot 5 = 20$." }], m: "(\\op{1})^2 + 7(\\op{1}) + 12 = 20", say: "The sum: $1 + 7 + 12 = 20$. Both forms give 20 ✓." }],
        why: "Multiply, combine, test. Now match some products to their sums." },
      { type: "slots", kicker: "On your own", prompt: "Match each product to its equivalent sum.",
        slots: [{ id: "a", label: "$x(x - 3)$" }, { id: "b", label: "$(x + 1)(x + 3)$" }, { id: "c", label: "$(x - 1)^2$" }, { id: "d", label: "$2x(x + 4)$" }],
        cards: [{ t: "$x^2 - 3x$", slot: "a", fb: "$x \\cdot x$ and $x \\cdot (-3)$." }, { t: "$x^2 + 4x + 3$", slot: "b", fb: "$x^2 + 3x + x + 3$." }, { t: "$x^2 - 2x + 1$", slot: "c", fb: "$(x - 1)(x - 1)$: two middle products of $-x$." }, { t: "$2x^2 + 8x$", slot: "d", fb: "$2x \\cdot x$ and $2x \\cdot 4$." }, { t: "$x^2 + 1$" }],
        skill: "Equivalent quadratic expressions", hints: ["Multiply each product out."], why: "Each product expands to exactly one of the sums." },
      { type: "learn", kicker: "Explore", prompt: "Are $(x + 2)^2$ and $x^2 + 4$ equivalent? Test some values of $x$.",
        scene: { type: "tester", a: "(x + 2)^2", b: "x^2 + 4", x: { v: 0, min: -5, max: 5 }, goal: "differ" }, gate: true,
        then: "They agree at $x = 0$ and nowhere else. One counter-example is enough: they are **not** equivalent. Squaring a sum is not the same as squaring each part." },
      { type: "learn", kicker: "A harder case",
        prompt: "Squaring a bracket is where the middle term gets lost.$$(x + 5)^2$$",
        scene: { type: "walk", how: HOW_7_8, rows: [
          { step: 1, m: "(x + 5)(x + 5)", say: "Squaring a bracket means multiplying it by itself.",
            fig: L.boxFig({ side: ["x", "5"], top: ["x", "5"], cells: [["x^2", "5x"], ["5x", "25"]], alt: "A two by two box. x and 5 down the side, x and 5 along the top. Inside: x squared, 5x, 5x and 25." }) },
          { step: 2, m: "x^2 + 5x + 5x + 25", say: "Four products, as always." },
          { step: 3, m: "x^2 + 10x + 25", say: "$5x + 5x = 10x$. Not $x^2 + 25$: the two middle products count." },
          { step: 4, m: "(\\op{1} + 5)^2 = 36", say: "Test with $x = 1$: $6^2 = 36$." },
          { step: 4, m: "(\\op{1})^2 + 10(\\op{1}) + 25 = 36", say: "$1 + 10 + 25 = 36$. Both give 36 ✓." }] },
        gate: true },
      { type: "expr", kicker: "Try it", prompt: "So what is $(x + 2)^2$, written as a sum?", answer: "x^2+4x+4", shown: "x^2 + 4x + 4", form: "simplified", skill: "Equivalent quadratic expressions", keys: KEYS_Q,
        near: [{ v: "x^2+4", fb: "That's the pair you just showed are different. Write $(x + 2)(x + 2)$ and find all four products." }, { v: "x^2+2x+4", fb: "There are two middle products, each $2x$." }],
        hints: ["$(x + 2)(x + 2)$."], why: "$x^2 + 2x + 2x + 4 = x^2 + 4x + 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $(x + 4)^2 = x^2 + 16$. Test his claim with $x = 1$. What do you find?",
        options: [{ t: "$(1 + 4)^2 = 25$ but $1 + 16 = 17$. They are not equivalent: the middle term $8x$ is missing." },
                  { t: "Both give 17, so he is right.", fb: "$(1 + 4)^2$ is $5^2 = 25$." },
                  { t: "Both give 25, so he is right.", fb: "$1^2 + 16$ is 17." }],
        answer: 0, skill: "Equivalent quadratic expressions", hints: ["Work out each side with $x = 1$."],
        why: "One value where they differ is enough. $(x + 4)^2 = x^2 + 8x + 16$." },
      { type: "choice", kicker: "Use it", prompt: "A square photo of side $x$ gets a frame that adds 3 cm to each side's length. Which expressions give the framed area?",
        options: [{ t: "Both $(x + 3)^2$ and $x^2 + 6x + 9$" }, { t: "Only $(x + 3)^2$", fb: "$x^2 + 6x + 9$ is the same thing multiplied out." }, { t: "$x^2 + 9$", fb: "That leaves out the two strips of $3x$ along the sides." }],
        answer: 0, skill: "Equivalent quadratic expressions", hints: ["Expand $(x + 3)^2$."], why: "$(x + 3)^2 = x^2 + 6x + 9$: the photo, two strips of $3x$, and a $3 \\times 3$ corner." }
    ]
  });

  /* ============================================ 7.9 · Standard form and factored form */
  var HOW_7_9 = [["Which form?", "A product of brackets is factored form. A sum $ax^2 + bx + c$ is standard form."], ["To standard", "Multiply the brackets out and combine."], ["To factored", "Find two numbers that multiply to $c$ and add to $b$."], ["Check", "Go back the other way. You should get what you started with."]];
  LESSONS.push({
    title: "Standard form and factored form",
    blurb: "Book 7.9 · Two names for two ways of writing the same quadratic.",
    mins: 12, v: 3,
    steps: [
      { type: "expr", kicker: "Warm up", prompt: "Multiply out $(x - 3)(x - 4)$.", answer: "x^2-7x+12", shown: "x^2 - 7x + 12", form: "simplified", skill: "Standard and factored form", keys: KEYS_Q,
        near: [{ v: "x^2-7x-12", fb: "$-3 \\times -4$ is $+12$." }, { v: "x^2+12", fb: "Include the middle products: $-4x$ and $-3x$." }, { v: "x^2-x+12", fb: "$-4x - 3x = -7x$." }],
        hints: ["$x \\cdot x$, $x \\cdot (-4)$, $-3 \\cdot x$, $-3 \\cdot (-4)$."], why: "$x^2 - 4x - 3x + 12 = x^2 - 7x + 12$." },
      { type: "learn", kicker: "The idea",
        prompt: "The same quadratic can be written two ways, and each has a name. **Standard form** is a sum: $ax^2 + bx + c$. **Factored form** is a product, such as $(x - 3)(x - 4)$. You can move between them.",
        scene: { type: "method", how: HOW_7_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch factored form turned into standard form.$$(x + 2)(x - 6)$$",
        scene: { type: "walk", how: HOW_7_9, rows: [
          { step: 1, m: "(x + 2)(x - 6)", say: "A product of brackets: factored form." },
          { step: 2, m: "x^2 - 6x + 2x - 12", say: "Multiply every part by every part: $x \\cdot x$, $x \\cdot (-6)$, $2 \\cdot x$ and $2 \\cdot (-6)$." },
          { step: 2, m: "x^2 - 4x - 12", say: "$-6x + 2x = -4x$. Standard form, with $a = 1$, $b = -4$ and $c = -12$.", 
            ask: { prompt: "In $x^2 - 4x - 12$, what is $c$?", answer: 0,
                   options: [{ t: "$-12$" }, { t: "12", fb: "The sign belongs to the term: $c = -12$." }] } },
          { step: 4, m: "2 \\cdot (-6) = -12", say: "Check: the numbers in the brackets multiply to $c$ ✓." },
          { step: 4, m: "2 + (-6) = -4", say: "And they add to $b$ ✓." }] },
        gate: true,
        then: "**Standard form:** $ax^2 + bx + c$. **Factored form:** a product of factors." },
      { type: "guided", kicker: "Together",
        prompt: "Now go the other way: from standard form to factored form.$$x^2 + 8x + 15$$",
        how: HOW_7_9, skill: "Standard and factored form",
        steps: [
          { step: 1, ask: "Which form is $x^2 + 8x + 15$ in?", type: "choice", answer: 0,
            options: [{ t: "Standard form" }, { t: "Factored form", fb: "Factored form is a product of brackets. This is a sum of three terms." }],
            m: "x^2 + 8x + 15", say: "A sum: standard form." },
          { step: 3, ask: "Which two numbers multiply to 15 and add to 8?", type: "choice", answer: 0,
            options: [{ t: "3 and 5" }, { t: "1 and 15", fb: "$1 + 15 = 16$." }, { t: "2 and 6", fb: "$2 \\cdot 6 = 12$, not 15." }],
            lead: [{ m: "3 \\cdot 5 = 15", say: "The product." }], m: "3 + 5 = 8", say: "The sum." },
          { step: 3, ask: "Write the factored form.", type: "choice", answer: 0,
            options: [{ t: "$(x + 3)(x + 5)$" }, { t: "$(x + 8)(x + 15)$", fb: "8 and 15 are the sum and the product. The brackets hold the two numbers themselves." }],
            m: "(x + 3)(x + 5)", say: "Factored form." },
          { step: 4, ask: "Check by multiplying back. What is the middle term?", type: "choice", answer: 0,
            options: [{ t: "$8x$" }, { t: "$15x$", fb: "The middle term is $5x + 3x$." }],
            lead: [{ m: "x^2 + 5x + 3x + 15", say: "Four products." }], m: "x^2 + 8x + 15", say: "$5x + 3x = 8x$. Back where we started ✓." }],
        why: "Name the form, convert, check. Now sort some expressions by form." },
      { type: "sort", kicker: "On your own", prompt: "Which form is each expression in?",
        bins: ["Standard form", "Factored form"],
        cards: [{ t: "$x^2 + 5x + 6$", bin: 0, fb: "A sum of terms." }, { t: "$(x + 1)(x - 4)$", bin: 1, fb: "A product of two factors." }, { t: "$x(x + 3)$", bin: 1, fb: "A product: $x$ times $(x + 3)$." },
                { t: "$3x^2 - 2$", bin: 0, fb: "A sum of terms, with $b = 0$." }, { t: "$(2x - 1)(x + 7)$", bin: 1, fb: "A product of two factors." }],
        skill: "Standard and factored form", hints: ["Is it a sum of terms, or a product?"], why: "Sum: standard. Product: factored." },
      { type: "expr", prompt: "Write $(2x + 1)(x - 3)$ in standard form.", answer: "2x^2-5x-3", shown: "2x^2 - 5x - 3", form: "simplified", skill: "Standard and factored form", keys: KEYS_Q,
        near: [{ v: "2x^2-3", fb: "Add the middle products: $-6x$ and $x$." }, { v: "2x^2-7x-3", fb: "$-6x + x = -5x$." }], hints: ["$2x \\cdot x$, $2x \\cdot (-3)$, $1 \\cdot x$, $1 \\cdot (-3)$."], why: "$2x^2 - 6x + x - 3 = 2x^2 - 5x - 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes a term goes missing.$$(x - 3)(x + 3)$$",
        scene: { type: "walk", how: HOW_7_9, rows: [
          { step: 1, m: "(x - 3)(x + 3)", say: "Factored form." },
          { step: 2, m: "x^2 + 3x - 3x - 9", say: "Four products: $x \\cdot x$, $x \\cdot 3$, $-3 \\cdot x$ and $-3 \\cdot 3$." },
          { step: 2, m: "x^2 + \\cancel{3x} - \\cancel{3x} - 9", say: "The middle terms cancel: $3x - 3x = 0$." },
          { step: 2, m: "x^2 - 9", say: "In standard form there is no $x$ term, so $b = 0$." },
          { step: 4, m: "x^2 + 0x - 9", say: "A missing term has a coefficient of 0: $a = 1$, $b = 0$, $c = -9$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "In standard form, $(x - 5)(x + 5)$ is $x^2 - 25$. What are $a$, $b$ and $c$?",
        options: [{ t: "$a = 1$, $b = 0$, $c = -25$" }, { t: "$a = 1$, $b = -25$, $c = 0$", fb: "$-25$ has no $x$: it's the constant term, $c$." }, { t: "$a = 1$, $b = 5$, $c = -5$", fb: "Those are the numbers in the factors, not the coefficients of the standard form." }],
        answer: 0, skill: "Standard and factored form", hints: ["$x^2 + 0x - 25$."], why: "$x^2 - 25 = 1x^2 + 0x - 25$. A missing term has coefficient 0." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran writes $(x - 2)(x - 5)$ in standard form. Tap the line where his work **first** goes wrong.",
        lines: ["(x - 2)(x - 5)", "x^2 - 5x - 2x - 10", "x^2 - 7x - 10"], answer: 1, fix: "x^2 - 5x - 2x + 10",
        fb: { 0: "That is the expression as given.", 2: "$-5x - 2x = -7x$, so this follows from the line above. The slip came earlier." },
        skill: "Standard and factored form", hints: ["What is $(-2) \\cdot (-5)$?"],
        why: "A negative times a negative is positive: $(-2)(-5) = +10$. Standard form is $x^2 - 7x + 10$." },
      { type: "expr", kicker: "Use it", prompt: "Now the other way: write $x^2 + 9x + 20$ in factored form.", answer: "(x+4)(x+5)", shown: "(x + 4)(x + 5)", form: "factored", skill: "Standard and factored form", keys: KEYS_Q,
        hints: ["Two numbers that multiply to 20 and add to 9."], why: "$4 \\times 5 = 20$ and $4 + 5 = 9$: $(x + 4)(x + 5)$." }
    ]
  });

  /* ============================================ 7.10 · Graphs in standard and factored form */
  var HOW_7_10 = [["x-intercepts", "From factored form: set each bracket equal to 0."], ["y-intercept", "Put $x = 0$. In standard form that leaves just $c$."], ["Read", "Each form shows one kind of intercept at a glance."]];
  LESSONS.push({
    title: "Graphs of functions in standard and factored forms",
    blurb: "Book 7.10 · Factored form shows the x-intercepts. Standard form shows the y-intercept.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "For $f(x) = (x - 2)(x - 6)$, what is $f(2)$?", pre: "$f(2) =$", answer: 0, skill: "Intercepts from the form",
        near: [{ v: -4, fb: "$(2 - 2)$ is 0, and 0 times anything is 0." }], hints: ["$(2 - 2)(2 - 6)$."], why: "$(0)(-4) = 0$. When one factor is zero, the whole product is zero." },
      { type: "learn", kicker: "The idea",
        prompt: "You got 0 because one bracket became 0. That is the secret of **factored form**: each bracket hands you an $x$-intercept. **Standard form** hands you the $y$-intercept: put $x = 0$ and only $c$ is left.",
        scene: { type: "method", how: HOW_7_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the intercepts found.$$f(x) = (x - 1)(x - 4)$$",
        scene: { type: "walk", how: HOW_7_10, rows: [
          { step: 1, m: "(x - 1)(x - 4) = 0", say: "The $x$-intercepts are where the output is 0. A product is 0 when one of its factors is 0." },
          { step: 1, m: "x - 1 = 0", say: "The first factor." },
          { step: 1, m: "x = 1", say: "Add 1 to both sides. One $x$-intercept is $(1, 0)$." },
          { step: 1, m: "x - 4 = 0", say: "The second factor." },
          { step: 1, m: "x = 4", say: "Add 4 to both sides. The other is $(4, 0)$." },
          { step: 2, m: "f(0) = (\\op{0} - 1)(\\op{0} - 4)", say: "Put $x = 0$ for the $y$-intercept.", 
            ask: { prompt: "How do you find a $y$-intercept?", answer: 0,
                   options: [{ t: "Put $x = 0$" }, { t: "Put $y = 0$", fb: "That gives the $x$-intercepts. On the $y$-axis, $x$ is 0." }] } },
          { step: 2, m: "f(0) = (-1)(-4)", say: "$0 - 1 = -1$ and $0 - 4 = -4$." },
          { step: 2, m: "f(0) = 4", say: "A negative times a negative is positive. The $y$-intercept is $(0, 4)$." },
          { step: 3, m: "x^2 - 5x + 4", say: "Multiplied out, the same function shows its $y$-intercept as $c = 4$." }] },
        gate: true,
        then: "Factored form shows the zeros. Standard form shows the $y$-intercept." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the intercepts.$$g(x) = (x + 1)(x - 5)$$",
        how: HOW_7_10, skill: "Intercepts from the form",
        steps: [
          { step: 1, ask: "Which value makes the bracket $(x + 1)$ equal to 0?", type: "choice", answer: 0,
            options: [{ t: "$x = -1$" }, { t: "$x = 1$", fb: "$1 + 1 = 2$, not 0." }],
            lead: [{ m: "x + 1 = 0", say: "The first factor is 0." }, { m: "x + 1 \\op{- 1} = 0 \\op{- 1}", say: "Subtract 1 from both sides." }], m: "x = -1", say: "A plus in the bracket gives a negative zero." },
          { step: 1, ask: "And which value makes $(x - 5)$ equal to 0?", type: "num", pre: "$x =$", answer: 5, near: [{ v: -5, fb: "$-5 - 5 = -10$, not 0." }], hint: "$x - 5 = 0$.",
            lead: [{ m: "x - 5 = 0", say: "The second factor is 0." }, { m: "x - 5 \\op{+ 5} = 0 \\op{+ 5}", say: "Add 5 to both sides." }], m: "x = 5", say: "The second zero." },
          { step: 2, ask: "Put $x = 0$. What is $(0 + 1)(0 - 5)$?", type: "num", answer: -5, near: [{ v: 5, fb: "$(1)(-5)$ is negative." }], hint: "$1 \\times (-5)$.",
            lead: [{ m: "g(0) = (\\op{0} + 1)(\\op{0} - 5)", say: "0 goes where $x$ was." }, { m: "g(0) = (1)(-5)", say: "$0 + 1 = 1$ and $0 - 5 = -5$." }], m: "g(0) = -5", say: "The $y$-intercept is $(0, -5)$." },
          { step: 3, ask: "In standard form, $g(x) = x^2 - 4x - 5$. Which number there is the $y$-intercept?", type: "choice", answer: 0,
            options: [{ t: "$-5$" }, { t: "$-4$", fb: "$-4$ is $b$, the coefficient of $x$. The $y$-intercept is $c$." }],
            m: "x^2 - 4x - 5", say: "$c$ is the $y$-intercept." }],
        why: "Brackets give the $x$-intercepts. $x = 0$ gives the $y$-intercept. Now read them off a graph." },
      { type: "plane", kicker: "On your own", prompt: "Here is the graph of $f(x) = (x - 2)(x - 6)$. **Click** one of its $x$-intercepts.",
        x: [-1, 9], y: [-5, 14], click: "point", answer: { point: [2, 0] }, skill: "Intercepts from the form", fns: [{ f: f26, color: "blue" }],
        check: function (st) { var c = st.clicked; return c && c[1] === 0 && (c[0] === 2 || c[0] === 6) ? { ok: true } : { ok: false, say: "An $x$-intercept is where the curve crosses the horizontal axis." }; },
        hints: ["Where is $f(x) = 0$?"], why: "The graph crosses at $x = 2$ and $x = 6$: exactly the numbers that make a factor zero." },
      { type: "num", prompt: "What is the $y$-intercept of $y = x^2 - 8x + 12$?", answer: 12, skill: "Intercepts from the form",
        near: [{ v: -8, fb: "$-8$ is the coefficient of $x$. Put $x = 0$: only the constant is left." }], hints: ["Put $x = 0$."], why: "$0 - 0 + 12 = 12$: the point $(0, 12)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Watch the signs. What are the intercepts of this function?$$h(x) = (x + 3)(x - 7)$$",
        scene: { type: "walk", how: HOW_7_10, rows: [
          { step: 1, m: "x + 3 = 0", say: "The first factor is 0." },
          { step: 1, m: "x = -3", say: "Subtract 3 from both sides. The bracket holds $+3$, but the zero is $-3$. The sign flips." },
          { step: 1, m: "x - 7 = 0", say: "The second factor is 0." },
          { step: 1, m: "x = 7", say: "Add 7 to both sides. The bracket holds $-7$, and the zero is 7." },
          { step: 2, m: "h(0) = (\\op{0} + 3)(\\op{0} - 7)", say: "Put $x = 0$." },
          { step: 2, m: "h(0) = (3)(-7)", say: "$0 + 3 = 3$ and $0 - 7 = -7$." },
          { step: 2, m: "h(0) = -21", say: "The $y$-intercept." },
          { step: 3, m: "(-3, 0), \\; (7, 0), \\; (0, -21)", say: "All three intercepts." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "What are the zeros of $k(x) = (x + 4)(x - 2)$?", answer: [-4, 2], skill: "Intercepts from the form", placeholder: "e.g. 4, -1",
        hints: ["Set each bracket equal to 0.", "$x + 4 = 0$ gives $x = -4$."], why: "$x + 4 = 0$ gives $-4$, and $x - 2 = 0$ gives 2." },
      { type: "slots", prompt: "Match each function to what its form shows at a glance.",
        slots: [{ id: "a", label: "$x$-intercepts at 1 and $-4$" }, { id: "b", label: "$y$-intercept at $-10$" }, { id: "c", label: "Only one $x$-intercept, at $-3$" }],
        cards: [{ t: "$y = (x - 1)(x + 4)$", slot: "a", fb: "$x - 1 = 0$ at 1, and $x + 4 = 0$ at $-4$." }, { t: "$y = x^2 + 3x - 10$", slot: "b", fb: "The constant term is the $y$-intercept." }, { t: "$y = (x + 3)(x + 3)$", slot: "c", fb: "Both factors are zero at the same place, $-3$." }],
        skill: "Intercepts from the form", hints: ["Factors give $x$-intercepts. The constant term gives the $y$-intercept."], why: "Each form is good at showing one thing." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says the zeros of $(x + 3)(x - 7)$ are 3 and $-7$. What is wrong?",
        options: [{ t: "The signs are flipped. $x + 3 = 0$ gives $-3$, and $x - 7 = 0$ gives 7." },
                  { t: "The zeros are 0 and $-21$.", fb: "$-21$ is the $y$-intercept. Zeros come from setting each bracket to 0." },
                  { t: "Nothing. Read the numbers straight from the brackets.", fb: "Test it: $(3 + 3)(3 - 7) = -24$, not 0." }],
        answer: 0, skill: "Intercepts from the form", hints: ["Put $x = 3$ into the function. Is the result 0?"],
        why: "A zero makes its bracket equal to 0, so it has the opposite sign to the number in the bracket." },
      { type: "num", kicker: "Use it", prompt: "$f(x) = (x - 2)(x - 6)$ is in factored form, so its $y$-intercept isn't on show. Find it anyway.", answer: 12, skill: "Intercepts from the form",
        near: [{ v: -12, fb: "$(-2)(-6)$ is positive." }, { v: -8, fb: "Multiply the two brackets: $(0 - 2)(0 - 6)$." }], hints: ["Put $x = 0$: $(0 - 2)(0 - 6)$."], why: "$f(0) = (-2)(-6) = 12$." }
    ]
  });

  /* ============================================ 7.11 · Graphing from the factored form */
  var HOW_7_11 = [["Zeros", "Read the zeros from the brackets."], ["Axis", "The axis of symmetry is halfway between them."], ["Vertex", "Put that $x$ into the function to get the vertex's height."], ["Sketch", "Plot the two zeros and the vertex. Draw the parabola through them."]];
  LESSONS.push({
    title: "Graphing from the factored form",
    blurb: "Book 7.11 · Two intercepts and the vertex between them are enough to sketch a parabola.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "Which number is halfway between 1 and 5?",
        answer: 3, skill: "Vertex from factored form",
        near: [{ v: 4, fb: "That is their difference. Halfway is their average: $\\frac{1 + 5}{2}$." }],
        hints: ["Add them and halve."], why: "$\\frac{1 + 5}{2} = 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "A parabola is a mirror image of itself. So its vertex sits exactly **halfway** between its two zeros. Two zeros and a vertex are enough to sketch it.",
        scene: { type: "method", how: HOW_7_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a parabola planned from its factored form.$$f(x) = (x - 2)(x - 8)$$",
        scene: { type: "walk", how: HOW_7_11, rows: [
          { step: 1, m: "x = 2", say: "A zero, from the first bracket: $x - 2 = 0$." },
          { step: 1, m: "x = 8", say: "The other, from the second: $x - 8 = 0$." },
          { step: 2, m: "\\frac{2 + 8}{2}", say: "Halfway between them: add the zeros and divide by 2.", 
            ask: { prompt: "The zeros are 2 and 8. How do we find the number halfway between them?", answer: 0,
                   options: [{ t: "Add them and halve: $\\frac{2 + 8}{2}$" }, { t: "Subtract them: $8 - 2$", fb: "That gives the distance between them, 6. Halfway is their average." }] } },
          { step: 2, m: "\\frac{10}{2} = 5", say: "The axis of symmetry is $x = 5$." },
          { step: 3, m: "f(5) = (\\op{5} - 2)(\\op{5} - 8)", say: "The height at the axis." },
          { step: 3, m: "f(5) = (3)(-3)", say: "$5 - 2 = 3$ and $5 - 8 = -3$." },
          { step: 3, m: "f(5) = -9", say: "The vertex is $(5, -9)$." },
          { step: 4, m: "(2, 0), \\; (8, 0), \\; (5, -9)", say: "Three points, and the parabola opens upward through them." }] },
        gate: true,
        then: "The vertical line through the vertex is the **axis of symmetry**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you plan one.$$f(x) = (x - 1)(x - 5)$$",
        how: HOW_7_11, skill: "Vertex from factored form",
        steps: [
          { step: 1, ask: "What are the zeros?", type: "choice", answer: 0,
            options: [{ t: "1 and 5" }, { t: "$-1$ and $-5$", fb: "$x - 1 = 0$ gives $x = 1$. The sign flips." }],
            lead: [{ m: "x = 1", say: "From the first bracket." }], m: "x = 5", say: "From the second. The zeros." },
          { step: 2, ask: "What is the $x$-coordinate of the vertex?", type: "num", answer: 3, hint: "Halfway between 1 and 5.", lead: [{ m: "\\frac{1 + 5}{2}", say: "Add the zeros and divide by 2." }], m: "\\frac{6}{2} = 3", say: "The axis of symmetry is $x = 3$." },
          { step: 3, ask: "What is $f(3) = (3 - 1)(3 - 5)$?", type: "num", answer: -4, near: [{ v: 4, fb: "$(2)(-2)$ is negative." }], hint: "$2 \\times (-2)$.",
            lead: [{ m: "f(3) = (\\op{3} - 1)(\\op{3} - 5)", say: "3 goes where $x$ was." }, { m: "f(3) = (2)(-2)", say: "$3 - 1 = 2$ and $3 - 5 = -2$." }], m: "f(3) = -4", say: "The vertex is $(3, -4)$." },
          { step: 4, ask: "Which three points do you plot?", type: "choice", answer: 0,
            options: [{ t: "$(1, 0)$, $(5, 0)$ and $(3, -4)$" }, { t: "$(0, 1)$, $(0, 5)$ and $(3, -4)$", fb: "Zeros sit on the $x$-axis: their second number is 0." }],
            m: "(1, 0), \\; (5, 0), \\; (3, -4)", say: "Two zeros and the vertex." }],
        why: "Zeros, axis, vertex, sketch. Now draw it." },
      { type: "plane", kicker: "On your own", prompt: "Sketch $f(x) = (x - 1)(x - 5)$: drag $A$ and $B$ to the $x$-intercepts and $V$ to the vertex.",
        x: [-1, 7], y: [-6, 8],
        points: [{ id: "A", x: 0, y: 2, drag: true, label: "A" }, { id: "B", x: 6, y: 2, drag: true, label: "B" }, { id: "V", x: 3, y: 3, drag: true, label: "V", color: "orange" }],
        segs: function (st) { var a = st.pt("A"), b = st.pt("B"), v = st.pt("V"); if (a.y !== b.y || a.x === b.x || 2 * v.x !== a.x + b.x || v.y === a.y) return []; var k = (a.y - v.y) / ((a.x - v.x) * (a.x - v.x)); return curveSegs(function (x) { return k * (x - v.x) * (x - v.x) + v.y; }, -1, 7, "blue"); },
        check: function (st) { var a = st.pt("A"), b = st.pt("B"), v = st.pt("V"); var ints = (a.x === 1 && b.x === 5 || a.x === 5 && b.x === 1) && a.y === 0 && b.y === 0;
          return !ints ? { ok: false, say: "The intercepts are on the $x$-axis, at the zeros: 1 and 5." } : v.x === 3 && v.y === -4 ? { ok: true } : { ok: false, say: "The vertex is halfway between the intercepts, at $x = 3$, and $f(3) = -4$." }; },
        answer: { points: { A: [1, 0], B: [5, 0], V: [3, -4] } }, skill: "Graph from factored form",
        hints: ["Intercepts: $(1, 0)$ and $(5, 0)$. Vertex: $(3, -4)$."], why: "Three points, and symmetry does the rest." },
      { type: "learn", kicker: "A harder case",
        prompt: "What does a minus sign in front do?$$g(x) = -(x - 1)(x - 5)$$",
        scene: { type: "walk", how: HOW_7_11, rows: [
          { step: 1, m: "x = 1", say: "The same zeros as before. The minus sign does not change where a bracket is 0." },
          { step: 1, m: "x = 5", say: "The second zero." },
          { step: 2, m: "x = \\frac{1 + 5}{2} = 3", say: "The same axis of symmetry." },
          { step: 3, m: "g(3) = -(\\op{3} - 1)(\\op{3} - 5)", say: "The height at the axis." },
          { step: 3, m: "g(3) = -(2)(-2)", say: "$3 - 1 = 2$ and $3 - 5 = -2$." },
          { step: 3, m: "g(3) = -(-4)", say: "$2 \\cdot (-2) = -4$." },
          { step: 3, m: "g(3) = 4", say: "The vertex is $(3, 4)$: **above** the axis this time." },
          { step: 4, m: "(1, 0), \\; (5, 0), \\; (3, 4)", say: "The parabola opens downward. A negative in front flips it." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "How does the graph of $g(x) = -(x - 1)(x - 5)$ differ from $f(x) = (x - 1)(x - 5)$?",
        options: [{ t: "Same zeros, but it opens downward: the vertex is $(3, 4)$." }, { t: "Its zeros change to $-1$ and $-5$.", fb: "The zeros still come from the factors: 1 and 5. The minus sign in front flips the outputs." }, { t: "It is identical.", fb: "Every output changes sign, so the graph is flipped over the $x$-axis." }],
        answer: 0, skill: "Graph from factored form", hints: ["What does multiplying every output by $-1$ do?"], why: "The zeros stay put. Every other point flips over the $x$-axis, so the minimum $(3, -4)$ becomes a maximum $(3, 4)$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran looks for the vertex of $y = (x + 4)(x - 2)$. Tap the line where his work **first** goes wrong.",
        lines: ["x = -4 \\quad\\text{and}\\quad x = 2", "\\frac{-4 + 2}{2} = -3", "y = (-3 + 4)(-3 - 2) = -5"], answer: 1, fix: "\\frac{-4 + 2}{2} = -1",
        fb: { 0: "$x + 4 = 0$ gives $-4$, and $x - 2 = 0$ gives 2. The zeros are right.", 2: "$(1)(-5) = -5$, so this follows from the line above. The slip came earlier." },
        skill: "Vertex from factored form", hints: ["What is $-4 + 2$?"],
        why: "$-4 + 2 = -2$, and half of that is $-1$. The vertex is $(-1, -9)$." },
      { type: "pair", kicker: "Use it", prompt: "Find the vertex of $y = (x + 2)(x - 4)$.", answer: [1, -9], skill: "Vertex from factored form",
        near: [{ v: [1, 9], fb: "$(1 + 2)(1 - 4) = 3 \\times -3$." }, { v: [-1, -5], fb: "The zeros are $-2$ and $4$: their average is $\\frac{-2 + 4}{2} = 1$." }],
        hints: ["Zeros: $-2$ and 4. Average them.", "Then put that $x$ into the function."], why: "$x = \\frac{-2 + 4}{2} = 1$, and $y = (3)(-3) = -9$." }
    ]
  });

  /* ============================================ 7.12 · Graphing the standard form, part 1 */
  var HOW_7_12 = [["Sign of a", "Positive $a$: the parabola opens upward. Negative $a$: downward."], ["Size of a", "Ignore the sign. Further from 0: narrower. Closer to 0: wider."], ["c", "$c$ lifts or lowers the whole parabola. Its vertex is at $(0, c)$."]];
  LESSONS.push({
    title: "Graphing the standard form, part 1",
    blurb: "Book 7.12 · In y = ax² + c, a opens, flips and stretches the parabola, and c lifts it.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "For $y = x^2 - 4$, what is $y$ when $x = 0$?",
        answer: -4, skill: "The roles of a and c",
        near: [{ v: 4, fb: "$0^2 - 4$ is $-4$." }],
        hints: ["$0^2 = 0$."], why: "$0 - 4 = -4$. The parabola crosses the $y$-axis at $(0, -4)$." },
      { type: "plane", kicker: "Explore", prompt: "Set $a$ and $c$ so the parabola $y = ax^2 + c$ passes through **both** orange points.",
        x: [-5, 5], y: [-7, 8], params: { a: { v: -1, min: -3, max: 3, step: 0.5, label: "$a$" }, c: { v: 2, min: -6, max: 6, step: 1, label: "$c$" } },
        fns: [{ f: par, color: "blue" }], marks: [{ x: 0, y: -4, color: "orange", r: 6 }, { x: 2, y: 0, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + (poly([[st.params.a, "x^2"], [st.params.c, ""]]) || "0") + "$"; },
        check: function (st) { var p = st.params; return p.a === 1 && p.c === -4 ? { ok: true } : { ok: false, say: p.c !== -4 ? "At $x = 0$ the curve is at height $c$. The lower orange point is $(0, -4)$." : "The bottom is right. Now change $a$ until the curve reaches $(2, 0)$." }; },
        answer: { params: { a: 1, c: -4 } }, skill: "The roles of a and c", hints: ["$c$ is where the curve crosses the $y$-axis."], why: "$y = x^2 - 4$: at $x = 0$, $y = -4$, and at $x = 2$, $y = 4 - 4 = 0$." },
      { type: "learn", kicker: "The idea",
        prompt: "In $y = ax^2 + c$, two numbers control the whole shape. $a$ decides which way the parabola opens and how wide it is. $c$ slides it up or down.",
        scene: { type: "method", how: HOW_7_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this parabola described from its equation.$$y = -3x^2 + 5$$",
        scene: { type: "walk", how: HOW_7_12, rows: [
          { step: 1, m: "a = -3", say: "Negative: the parabola opens downward." },
          { step: 2, m: "3 > 1", say: "The size of $a$ is 3, more than 1, so it is narrower than $y = x^2$.", 
            ask: { prompt: "$a = -3$. Compared with $y = x^2$, is this parabola narrower or wider?", answer: 0,
                   options: [{ t: "Narrower" }, { t: "Wider", fb: "A bigger size of $a$ makes the outputs change faster, so the curve is steeper and narrower." }] } },
          { step: 3, m: "c = 5", say: "The vertex is lifted to $(0, 5)$." },
          { step: 3, m: "y = -3(\\op{1})^2 + 5", say: "One more point: put $x = 1$." },
          { step: 3, m: "y = -3 + 5", say: "$1^2 = 1$ and $-3 \\cdot 1 = -3$." },
          { step: 3, m: "y = 2", say: "The point $(1, 2)$. By symmetry, $(-1, 2)$ as well." }] },
        gate: true,
        then: "$a$ opens, flips and stretches. $c$ lifts." },
      { type: "guided", kicker: "Together",
        prompt: "Now you describe one.$$y = 0.5x^2 - 2$$",
        how: HOW_7_12, skill: "The roles of a and c",
        steps: [
          { step: 1, ask: "$a = 0.5$. Which way does the parabola open?", type: "choice", answer: 0,
            options: [{ t: "Upward" }, { t: "Downward", fb: "0.5 is positive. Only a negative $a$ opens downward." }],
            m: "a = 0.5", say: "Positive: it opens upward." },
          { step: 2, ask: "Is it narrower or wider than $y = x^2$?", type: "choice", answer: 0,
            options: [{ t: "Wider: 0.5 is closer to 0" }, { t: "Narrower", fb: "A size below 1 makes the outputs grow more slowly, so the curve is flatter and wider." }],
            m: "0.5 < 1", say: "Closer to 0: wider." },
          { step: 3, ask: "Where is its vertex?", type: "choice", answer: 0,
            options: [{ t: "$(0, -2)$" }, { t: "$(-2, 0)$", fb: "$c$ moves the parabola up or down, so it changes the $y$-coordinate." }, { t: "$(0, 0.5)$", fb: "0.5 is $a$. The vertex is at $(0, c)$." }],
            m: "c = -2", say: "Lowered by 2." }],
        why: "Sign of $a$, size of $a$, then $c$. Now build one on the grid." },
      { type: "plane", kicker: "On your own", prompt: "Now make a parabola that opens **downward**, with its vertex at $(0, 3)$, passing through $(1, 1)$.",
        x: [-5, 5], y: [-7, 8], params: { a: { v: 1, min: -3, max: 3, step: 0.5, label: "$a$" }, c: { v: 0, min: -6, max: 6, step: 1, label: "$c$" } },
        fns: [{ f: par, color: "blue" }], marks: [{ x: 0, y: 3, color: "orange", r: 6 }, { x: 1, y: 1, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + (poly([[st.params.a, "x^2"], [st.params.c, ""]]) || "0") + "$"; },
        check: function (st) { var p = st.params; return p.a === -2 && p.c === 3 ? { ok: true } : { ok: false, say: p.a >= 0 ? "To open downward, $a$ must be negative." : p.c !== 3 ? "The vertex is at height 3: that's $c$." : "From $(0, 3)$ to $(1, 1)$ the curve drops 2 in one step. So $a = \\,?$" }; },
        answer: { params: { a: -2, c: 3 } }, skill: "The roles of a and c", hints: ["$c = 3$. At $x = 1$: $a(1)^2 + 3 = 1$."], why: "$y = -2x^2 + 3$: $a + 3 = 1$ gives $a = -2$." },
      { type: "sort", prompt: "Does the parabola open upward or downward?",
        bins: ["Upward", "Downward"],
        cards: [{ t: "$y = x^2 - 9$", bin: 0, fb: "$a = 1$, positive." }, { t: "$y = -x^2 + 4$", bin: 1, fb: "$a = -1$, negative." }, { t: "$y = 3x^2 + 1$", bin: 0, fb: "$a = 3$, positive." },
                { t: "$y = 5 - x^2$", bin: 1, fb: "The $x^2$ term is $-x^2$: $a = -1$." }, { t: "$y = -\\frac{1}{2}x^2$", bin: 1, fb: "$a$ is negative." }],
        skill: "The roles of a and c", hints: ["Look only at the sign of the $x^2$ term."], why: "Positive $a$: a cup. Negative $a$: an arch." },
      { type: "learn", kicker: "A harder case",
        prompt: "Which is the **narrowest**: $y = 0.5x^2$, $y = -3x^2$ or $y = 2x^2$?",
        scene: { type: "walk", how: HOW_7_12, rows: [
          { step: 1, m: "+, \\; -, \\; +", say: "The signs only say which way each one opens." },
          { step: 2, m: "0.5, \\; 3, \\; 2", say: "Width depends on the **size** of $a$, ignoring the sign." },
          { step: 2, m: "3 > 2 > 0.5", say: "The largest size is 3. So $y = -3x^2$ is the narrowest, although it opens downward." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which parabola is the **narrowest**?",
        options: [{ t: "$y = 4x^2$" }, { t: "$y = x^2$", fb: "At $x = 1$ it's at height 1. $y = 4x^2$ is already at 4: it climbs faster, so it's narrower." }, { t: "$y = \\frac{1}{4}x^2$", fb: "That's the widest: it climbs most slowly." }],
        answer: 0, keep: true, skill: "The roles of a and c", hints: ["Which climbs fastest as $x$ moves away from 0?"], why: "A larger $|a|$ makes every output bigger, so the curve rises more steeply and looks narrower." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $y = -5x^2$ is **wider** than $y = x^2$, “because $-5$ is less than 1”. What is wrong?",
        options: [{ t: "Width uses the size of $a$, without its sign. 5 is more than 1, so it is narrower." },
                  { t: "They have the same width.", fb: "The sizes are 5 and 1. They differ." },
                  { t: "Nothing. A smaller $a$ is always wider.", fb: "Test $x = 1$: $y = -5$ against $y = 1$. Which curve has moved further from the axis?" }],
        answer: 0, skill: "The roles of a and c", hints: ["Step 2: ignore the sign and compare 5 with 1."],
        why: "The minus sign flips the parabola. The 5 makes it narrow." },
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
  var HOW_7_13 = [["Read", "Read $a$ and $b$ from $y = ax^2 + bx + c$."], ["Axis", "The vertex is at $x = \\frac{-b}{2a}$."], ["Height", "Put that $x$ back into the function."], ["Vertex", "Write the vertex as a point."]];
  LESSONS.push({
    title: "Graphing the standard form, part 2",
    blurb: "Book 7.13 · The bx term slides the vertex sideways. Its x-coordinate is −b ÷ 2a.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A parabola has zeros at 0 and 6. What is the $x$-coordinate of its vertex?",
        answer: 3, skill: "Vertex from standard form",
        near: [{ v: 6, fb: "The vertex is halfway between the zeros, not at one of them." }],
        hints: ["Halfway between 0 and 6."], why: "The vertex is halfway between the zeros: $x = 3$." },
      { type: "plane", kicker: "Explore", prompt: "The curve is $y = x^2 + bx$. Slide $b$ until the vertex sits on the red line, $x = 2$.",
        x: [-6, 6], y: [-10, 8], vline: [2], params: { b: { v: 2, min: -6, max: 6, step: 1, label: "$b$" } },
        fns: [{ f: function (x, p) { return x * x + p.b * x; }, color: "blue" }],
        marks: [{ x: function (P) { return -P.b / 2; }, y: function (P) { return -P.b * P.b / 4; }, color: "orange", r: 6, label: function (P) { return "(" + nm(-P.b / 2) + ", " + nm(-P.b * P.b / 4) + ")"; } }],
        readout: function (st) { var b = st.params.b; return "$y = " + poly([[1, "x^2"], [b, "x"]]) + "$ &nbsp; vertex at $x = " + nm(-b / 2) + "$"; },
        check: function (st) { return st.params.b === -4 ? { ok: true } : { ok: false, say: "The vertex is at $x = " + nm(-st.params.b / 2) + "$. Notice how it moves the opposite way to $b$." }; },
        answer: { params: { b: -4 } }, skill: "Vertex from standard form", hints: ["Try a negative $b$."],
        why: "$y = x^2 - 4x = x(x - 4)$ has zeros 0 and 4, so its vertex is halfway, at $x = 2$." },
      { type: "learn", kicker: "The idea",
        prompt: "In standard form the zeros are hidden, but the vertex can still be found. $ax^2 + bx$ factors as $x(ax + b)$, with zeros at 0 and $\\frac{-b}{a}$. Halfway between them is $x = \\frac{-b}{2a}$. Adding $c$ only lifts the graph.",
        scene: { type: "method", how: HOW_7_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the vertex found from standard form.$$y = x^2 - 4x + 1$$",
        scene: { type: "walk", how: HOW_7_13, rows: [
          { step: 1, m: "a = 1", say: "The coefficient of $x^2$." },
          { step: 1, m: "b = -4", say: "The coefficient of $x$." },
          { step: 2, m: "x = \\frac{-b}{2a}", say: "The formula for the axis of symmetry." },
          { step: 2, m: "x = \\frac{-(\\op{-4})}{2(\\op{1})}", say: "Put $b = -4$ and $a = 1$ in." },
          { step: 2, m: "x = \\frac{4}{2}", say: "Minus $-4$ is $+4$, and $2 \\cdot 1 = 2$.", 
            ask: { prompt: "$b = -4$. What is $-b$?", answer: 0,
                   options: [{ t: "4" }, { t: "$-4$", fb: "$-b$ is the opposite of $b$. The opposite of $-4$ is 4." }] } },
          { step: 2, m: "x = 2", say: "$4 \\div 2 = 2$." },
          { step: 3, m: "y = (\\op{2})^2 - 4(\\op{2}) + 1", say: "Put $x = 2$ back into the function." },
          { step: 3, m: "y = 4 - 8 + 1", say: "$2^2 = 4$ and $4 \\cdot 2 = 8$." },
          { step: 3, m: "y = -3", say: "$4 - 8 = -4$, and $-4 + 1 = -3$." },
          { step: 4, m: "(2, -3)", say: "The vertex." }] },
        gate: true,
        then: "For $y = ax^2 + bx + c$ the vertex is at $x = \\frac{-b}{2a}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the vertex.$$y = x^2 - 6x + 5$$",
        how: HOW_7_13, skill: "Vertex from standard form",
        steps: [
          { step: 1, ask: "What are $a$ and $b$?", type: "choice", answer: 0,
            options: [{ t: "$a = 1$, $b = -6$" }, { t: "$a = 1$, $b = 6$", fb: "The sign belongs to the term: $b = -6$." }, { t: "$a = -6$, $b = 5$", fb: "$a$ goes with $x^2$ and $b$ goes with $x$." }],
            lead: [{ m: "a = 1", say: "The coefficient of $x^2$." }], m: "b = -6", say: "The coefficient of $x$." },
          { step: 2, ask: "What is $\\frac{-b}{2a} = \\frac{6}{2}$?", type: "num", pre: "$x =$", answer: 3, hint: "$6 \\div 2$.", lead: [{ m: "x = \\frac{-(\\op{-6})}{2(\\op{1})}", say: "Put $b$ and $a$ into $\\frac{-b}{2a}$." }, { m: "x = \\frac{6}{2}", say: "Minus $-6$ is $+6$, and $2 \\cdot 1 = 2$." }], m: "x = 3", say: "The axis of symmetry is $x = 3$." },
          { step: 3, ask: "Put $x = 3$ in. What is $3^2 - 6(3) + 5$?", type: "num", answer: -4, near: [{ v: 32, fb: "$-6(3)$ is $-18$: $9 - 18 + 5$." }], hint: "$9 - 18 + 5$.",
            lead: [{ m: "y = (\\op{3})^2 - 6(\\op{3}) + 5", say: "3 goes where $x$ was." }, { m: "y = 9 - 18 + 5", say: "$3^2 = 9$ and $6 \\cdot 3 = 18$." }], m: "y = -4", say: "$9 - 18 = -9$, and $-9 + 5 = -4$. The height of the vertex." },
          { step: 4, ask: "Write the vertex.", type: "choice", answer: 0,
            options: [{ t: "$(3, -4)$" }, { t: "$(-4, 3)$", fb: "The $x$-coordinate comes first." }],
            m: "(3, -4)", say: "The vertex." }],
        why: "Read, axis, height, vertex. Now find an axis on your own." },
      { type: "num", kicker: "On your own",
        prompt: "Find the $x$-coordinate of the vertex of $y = x^2 + 10x + 3$.",
        pre: "$x =$", answer: -5, skill: "Vertex from standard form",
        near: [{ v: 5, fb: "The formula has **minus** $b$: $\\frac{-10}{2}$." }, { v: -10, fb: "Divide by $2a$, which is 2." }],
        hints: ["$a = 1$ and $b = 10$.", "$\\frac{-10}{2(1)}$."], why: "$x = \\frac{-10}{2} = -5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When $a$ is not 1, the denominator changes.$$y = 2x^2 - 12x + 7$$",
        scene: { type: "walk", how: HOW_7_13, rows: [
          { step: 1, m: "a = 2", say: "The coefficient of $x^2$." },
          { step: 1, m: "b = -12", say: "The coefficient of $x$." },
          { step: 2, m: "x = \\frac{-(\\op{-12})}{2(\\op{2})}", say: "Put them into $\\frac{-b}{2a}$." },
          { step: 2, m: "x = \\frac{12}{4}", say: "The denominator is $2a = 4$, not 2." },
          { step: 2, m: "x = 3", say: "$12 \\div 4 = 3$." },
          { step: 3, m: "y = 2(\\op{3})^2 - 12(\\op{3}) + 7", say: "Put $x = 3$ back in." },
          { step: 3, m: "y = 2(9) - 36 + 7", say: "$3^2 = 9$ and $12 \\cdot 3 = 36$." },
          { step: 3, m: "y = 18 - 36 + 7", say: "$2 \\cdot 9 = 18$." },
          { step: 3, m: "y = -11", say: "$18 - 36 = -18$, and $-18 + 7 = -11$." },
          { step: 4, m: "(3, -11)", say: "The vertex." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the $x$-coordinate of the vertex of $y = 2x^2 + 8x + 1$.", answer: -2, skill: "Vertex from standard form",
        near: [{ v: -4, fb: "Divide by $2a$, and here $a = 2$: $2a = 4$." }, { v: 2, fb: "It's $-b$ on top: $-8$." }], hints: ["$\\frac{-8}{2 \\cdot 2}$."], why: "$\\frac{-8}{4} = -2$." },
      { type: "choice", prompt: "Which equation matches this graph?",
        scene: graph([-4, 6], [-6, 8], [{ f: function (x) { return (x + 1) * (x - 3); }, color: "green" }], { marks: [{ x: -1, y: 0, color: "orange" }, { x: 3, y: 0, color: "orange" }, { x: 0, y: -3, color: "orange" }] }),
        options: [{ t: "$y = x^2 - 2x - 3$" }, { t: "$y = x^2 + 2x - 3$", fb: "That one is $(x + 3)(x - 1)$: zeros at $-3$ and 1. This graph crosses at $-1$ and 3." }, { t: "$y = x^2 - 2x + 3$", fb: "The graph crosses the $y$-axis at $-3$, so $c = -3$." }],
        answer: 0, skill: "Vertex from standard form", hints: ["Zeros at $-1$ and 3 give the factors $(x + 1)(x - 3)$. Multiply them out."], why: "$(x + 1)(x - 3) = x^2 - 2x - 3$, and its $y$-intercept is $-3$ ✓." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran finds the vertex of $y = x^2 + 8x + 2$. Tap the line where his work **first** goes wrong.",
        lines: ["a = 1, \\; b = 8", "x = \\frac{8}{2} = 4", "y = 16 + 32 + 2 = 50"], answer: 1, fix: "x = \\frac{-8}{2} = -4",
        fb: { 0: "The coefficients are right.", 2: "With $x = 4$ this arithmetic is right. The slip came earlier." },
        skill: "Vertex from standard form", hints: ["Look at the formula: is it $b$ or $-b$ on top?"],
        why: "The formula has **minus** $b$: $x = -4$. Then $y = 16 - 32 + 2 = -14$." },
      { type: "num", kicker: "Use it",
        prompt: "A ball's height is $h(t) = -5t^2 + 20t + 1$ metres after $t$ seconds. At what time is it **highest**?",
        answer: 2, post: "s", skill: "Vertex from standard form",
        near: [{ v: -2, fb: "A negative over a negative is positive: $\\frac{-20}{-10}$." }, { v: 4, fb: "Divide by $2a$, which is $-10$, not by $a$." }],
        hints: ["$a = -5$ and $b = 20$.", "$\\frac{-20}{2(-5)}$."], why: "$t = \\frac{-20}{-10} = 2$ seconds." }
    ]
  });

  /* ============================================ 7.14 · Graphs that represent situations */
  var HOW_7_14 = [["Start", "The $y$-intercept: the height at time 0."], ["Peak", "The vertex: when the height is greatest, and how great it is."], ["Land", "The positive zero: when the height is back to 0."], ["Domain", "Only the times from the launch to the landing make sense."]];
  LESSONS.push({
    title: "Graphs that represent situations",
    blurb: "Book 7.14 · Read a quadratic graph as a story: where it starts, its peak, and where it lands.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A firework is launched from a rooftop. $h(t) = -16t^2 + 64t + 80$ is its height in feet after $t$ seconds. How high is the rooftop?",
        scene: graph([0, 6], [0, 160], [{ f: shot, color: "orange" }], { gridY: 20, labelEveryY: 40, aspect: 0.85, axisLabels: ["t", "h"] }),
        post: "ft", answer: 80, skill: "Interpret a quadratic graph", near: [{ v: 144, fb: "That's the highest point. The rooftop is where it *starts*: $t = 0$." }],
        hints: ["The start is $t = 0$: the vertical intercept."], why: "$h(0) = 80$: the constant term, and the vertical intercept." },
      { type: "learn", kicker: "The idea",
        prompt: "The graph of a launch tells its story in three points: where it starts, its peak, and where it lands. Each is a feature you already know: the $y$-intercept, the vertex, and a zero.",
        scene: { type: "method", how: HOW_7_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "A diver leaves a board. $h(t) = -5t^2 + 10t + 15$ is the height above the water in metres, after $t$ seconds. Watch the dive read.",
        scene: { type: "walk", how: HOW_7_14, rows: [
          { step: 1, m: "h(0) = -5(\\op{0})^2 + 10(\\op{0}) + 15", say: "The start: put $t = 0$." },
          { step: 1, m: "h(0) = 15", say: "The board is 15 m above the water." },
          { step: 2, m: "t = \\frac{-(\\op{10})}{2(\\op{-5})}", say: "The peak is at the vertex: $\\frac{-b}{2a}$ with $b = 10$ and $a = -5$." },
          { step: 2, m: "t = \\frac{-10}{-10} = 1", say: "The diver is highest after 1 second." },
          { step: 2, m: "h(1) = -5(\\op{1})^2 + 10(\\op{1}) + 15", say: "The height then." },
          { step: 2, m: "h(1) = -5 + 10 + 15 = 20", say: "20 m above the water." },
          { step: 3, m: "-5t^2 + 10t + 15 = 0", say: "The landing: the height is 0." },
          { step: 3, m: "-5(t^2 - 2t - 3) = 0", say: "Take out the common factor $-5$." },
          { step: 3, m: "-5(t - 3)(t + 1) = 0", say: "Factor the trinomial: $-3 \\cdot 1 = -3$ and $-3 + 1 = -2$." },
          { step: 3, m: "t = 3", say: "One zero, from $t - 3 = 0$." },
          { step: 3, m: "t = -1", say: "The other, from $t + 1 = 0$. A negative time is before the dive." },
          { step: 4, m: "0 \\le t \\le 3", say: "The dive lasts from $t = 0$ to $t = 3$. The other zero is outside the story.", 
            ask: { prompt: "The zeros are $t = 3$ and $t = -1$. When does the diver reach the water?", answer: 0,
                   options: [{ t: "After 3 seconds" }, { t: "At $-1$ seconds", fb: "That would be before the dive began." }] } }] },
        gate: true,
        then: "The intercept, the vertex and a zero: the start, the peak and the landing." },
      { type: "guided", kicker: "Together",
        prompt: "A ball is kicked from the ground. Its height is $h(t) = -5t^2 + 20t$ metres. Read its flight.",
        how: HOW_7_14, skill: "Interpret a quadratic graph",
        steps: [
          { step: 1, ask: "What is $h(0)$?", type: "num", answer: 0, hint: "Put $t = 0$ in.", m: "h(0) = 0", say: "It starts on the ground." },
          { step: 2, ask: "The vertex is at $t = \\frac{-20}{2(-5)}$. What is that?", type: "num", pre: "$t =$", answer: 2, near: [{ v: -2, fb: "A negative over a negative is positive." }], hint: "$\\frac{-20}{-10}$.",
            lead: [{ m: "t = \\frac{-(\\op{20})}{2(\\op{-5})}", say: "$\\frac{-b}{2a}$ with $b = 20$ and $a = -5$." }, { m: "t = \\frac{-20}{-10}", say: "$2 \\cdot (-5) = -10$." }], m: "t = 2", say: "Highest after 2 seconds." },
          { step: 2, ask: "What is $h(2) = -5(4) + 20(2)$?", type: "num", answer: 20, post: "m", hint: "$-20 + 40$.", lead: [{ m: "h(2) = -5(\\op{2})^2 + 20(\\op{2})", say: "2 goes where $t$ was." }, { m: "h(2) = -20 + 40", say: "$-5 \\cdot 4 = -20$ and $20 \\cdot 2 = 40$." }], m: "h(2) = 20", say: "The peak is 20 m." },
          { step: 3, ask: "$-5t^2 + 20t = -5t(t - 4)$. When does the ball land?", type: "choice", answer: 0,
            options: [{ t: "At $t = 4$" }, { t: "At $t = 0$", fb: "That is the kick. It lands at the other zero." }, { t: "At $t = 2$", fb: "At $t = 2$ it is at its highest." }],
            lead: [{ m: "-5t(t - 4) = 0", say: "The height is 0 when a factor is 0." }, { m: "t - 4 = 0", say: "$t = 0$ is the kick. The other factor gives the landing." }], m: "t = 4", say: "Back on the ground after 4 seconds." },
          { step: 4, ask: "Which domain makes sense?", type: "choice", answer: 0,
            options: [{ t: "$0 \\le t \\le 4$" }, { t: "All real numbers", fb: "Before the kick and after the landing, the function does not describe the ball." }],
            m: "0 \\le t \\le 4", say: "From the kick to the landing." }],
        why: "Start, peak, land, domain. Now read the firework's graph." },
      { type: "pair", kicker: "On your own", prompt: "What are the coordinates of the vertex?",
        scene: graph([0, 6], [0, 160], [{ f: shot, color: "orange" }], { gridY: 20, labelEveryY: 40, aspect: 0.85, axisLabels: ["t", "h"] }),
        answer: [2, 144], skill: "Interpret a quadratic graph", near: [{ v: [144, 2], fb: "Time first: $(t, h)$." }, { v: [2, 140], fb: "Work it out exactly: $h(2) = -64 + 128 + 80$." }],
        hints: ["$t = \\frac{-b}{2a} = \\frac{-64}{-32}$.", "Then find $h(2)$."], why: "$t = 2$ and $h(2) = -64 + 128 + 80 = 144$." },
      { type: "choice", prompt: "What does the vertex $(2, 144)$ mean?",
        options: [{ t: "After 2 seconds the firework reaches its greatest height, 144 ft." }, { t: "The firework lands after 2 seconds, 144 ft away.", fb: "The graph shows height against *time*, not distance along the ground. And at $t = 2$ it is at its highest." }, { t: "The firework travels at 144 ft per second for 2 seconds.", fb: "The output is a height, not a speed." }],
        answer: 0, skill: "Interpret a quadratic graph", hints: ["The vertex is the maximum. Input: seconds. Output: feet."], why: "The maximum of $h$ is 144 ft, reached at $t = 2$ s." },
      { type: "num", prompt: "When does the firework hit the ground?", scene: graph([0, 6], [0, 160], [{ f: shot, color: "orange" }], { gridY: 20, labelEveryY: 40, aspect: 0.85, axisLabels: ["t", "h"] }),
        pre: "$t =$", post: "s", answer: 5, skill: "Interpret a quadratic graph", hints: ["Where is $h(t) = 0$?"], why: "$h(5) = -400 + 320 + 80 = 0$. The positive zero is the landing time." },
      { type: "learn", kicker: "A harder case",
        prompt: "Not every parabola is a flight. A stall's daily **profit** depends on the **price** it charges. Its graph is a parabola with zeros at 1 and 9 and vertex $(5, 32)$.",
        scene: { type: "walk", how: HOW_7_14, rows: [
          { step: 2, m: "(5, 32)", say: "The vertex: a price of \\$5 gives the greatest profit, \\$32." },
          { step: 3, m: "x = 1", say: "A zero: at \\$1 the profit is nothing. Too cheap." },
          { step: 3, m: "x = 9", say: "The other zero: at \\$9 the profit is nothing again. Too dear." },
          { step: 4, m: "1 < x < 9", say: "Between the zeros the stall makes money. Outside them it loses money." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A stall's daily profit, $P(x)$ dollars, depends on the price $x$ it charges. The graph is a parabola with zeros at $x = 2$ and $x = 18$ and vertex $(10, 64)$. What do the zeros mean?",
        options: [{ t: "At a price of \\$2 or \\$18 the stall makes no profit: it breaks even." }, { t: "The stall sells 2 items, then 18.", fb: "The input is the price, and the output is profit." }, { t: "The best prices are \\$2 and \\$18.", fb: "The best price is at the vertex: \\$10, for a profit of \\$64." }],
        answer: 0, skill: "Interpret a quadratic graph", hints: ["A zero is an input whose output is 0. What is the output here?"], why: "Profit is 0 at those prices. Between them it's positive, peaking at \\$10." },
      { type: "choice", kicker: "Find the error",
        prompt: "The firework's equation has zeros at $t = -1$ and $t = 5$. Kiran says: “So it hits the ground twice.” What is wrong?",
        options: [{ t: "$t = -1$ is before the launch, outside the domain. It lands once, at $t = 5$." },
                  { t: "It lands at $t = -1$ only.", fb: "A negative time is before the launch." },
                  { t: "Nothing. Two zeros mean two landings.", fb: "The firework starts on a rooftop at $t = 0$. Ask which zeros come after that." }],
        answer: 0, skill: "Interpret a quadratic graph", hints: ["Step 4: which times make sense?"],
        why: "The situation starts at $t = 0$. Only the zero at $t = 5$ is part of the story." },
      { type: "num", kicker: "Use it",
        prompt: "A rocket's height is $h(t) = -16t^2 + 96t$ feet, which factors as $-16t(t - 6)$. For how many seconds is it in the air?",
        answer: 6, post: "s", skill: "Interpret a quadratic graph",
        near: [{ v: 3, fb: "3 is when it is highest. It lands at the other zero." }],
        hints: ["Step 3: when is the height 0 again?"], why: "The zeros are $t = 0$, the launch, and $t = 6$, the landing. It is in the air for 6 seconds." }
    ]
  });

  /* ============================================ 7.15 · Vertex form */
  var HOW_7_15 = [["Match", "Match the equation to $y = a(x - h)^2 + k$."], ["h", "$h$ is the number **subtracted** from $x$. So $(x + 2)$ means $h = -2$."], ["k", "$k$ is the number added at the end."], ["Vertex", "The vertex is $(h, k)$."]];
  LESSONS.push({
    title: "Vertex form",
    blurb: "Book 7.15 · y = a(x − h)² + k puts the vertex in plain sight: (h, k).",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is the **smallest** value that $(x - 3)^2$ can have?",
        answer: 0, skill: "Vertex form",
        near: [{ v: -3, fb: "A square is never negative. What is the least it can be?" }, { v: 9, fb: "That is its value at $x = 0$. Try $x = 3$." }],
        hints: ["A square cannot be negative.", "Try $x = 3$."], why: "A square is never negative, and $(3 - 3)^2 = 0$." },
      { type: "plane", kicker: "Explore", prompt: "The curve is $y = (x - h)^2 + k$. Slide $h$ and $k$ to put its vertex on the orange point.",
        x: [-6, 6], y: [-6, 8], params: { h: { v: 0, min: -5, max: 5, step: 1, label: "$h$" }, k: { v: 0, min: -5, max: 5, step: 1, label: "$k$" } },
        fns: [{ f: vform, color: "blue" }], marks: [{ x: 3, y: -2, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + vtex(1, st.params.h, st.params.k) + "$"; },
        check: function (st) { var p = st.params; return p.h === 3 && p.k === -2 ? { ok: true } : { ok: false, say: "The orange point is $(3, -2)$. One slider moves the curve sideways, the other up and down." }; },
        answer: { params: { h: 3, k: -2 } }, skill: "Vertex form", hints: ["$h$ moves it left and right. $k$ moves it up and down."], why: "$y = (x - 3)^2 - 2$ has its vertex at $(3, -2)$: exactly $(h, k)$." },
      { type: "learn", kicker: "The idea",
        prompt: "$(x - 3)^2$ is never negative, and it is 0 exactly when $x = 3$. So $y = (x - 3)^2 + 2$ is smallest at $x = 3$, where $y = 2$. **Vertex form**, $y = a(x - h)^2 + k$, shows the vertex directly: $(h, k)$.",
        scene: { type: "method", how: HOW_7_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the vertex read straight from the equation.$$y = (x - 4)^2 + 3$$",
        scene: { type: "walk", how: HOW_7_15, rows: [
          { step: 1, m: "y = 1(x - 4)^2 + 3", say: "It matches $a(x - h)^2 + k$, with $a = 1$." },
          { step: 2, m: "h = 4", say: "4 is subtracted from $x$." },
          { step: 3, m: "k = 3", say: "3 is added at the end." },
          { step: 4, m: "y = (\\op{4} - 4)^2 + 3", say: "Why is that the vertex? Put $x = 4$.", 
            ask: { prompt: "At which $x$ is $(x - 4)^2$ equal to 0?", answer: 0,
                   options: [{ t: "$x = 4$" }, { t: "$x = -4$", fb: "$(-4 - 4)^2 = 64$. The bracket is 0 when $x = 4$." }] } },
          { step: 4, m: "y = 0 + 3 = 3", say: "The square is 0, its smallest possible value, so $y$ is at its lowest: 3." },
          { step: 4, m: "(4, 3)", say: "The vertex." }] },
        gate: true,
        then: "In $y = a(x - h)^2 + k$ the vertex is $(h, k)$." },
      { type: "guided", kicker: "Together",
        prompt: "Take care with the sign this time.$$y = (x + 2)^2 - 7$$",
        how: HOW_7_15, skill: "Vertex form",
        steps: [
          { step: 1, ask: "Rewrite $(x + 2)$ as $x$ **minus** something.", type: "choice", answer: 0,
            options: [{ t: "$x - (-2)$" }, { t: "$x - 2$", fb: "$x - 2$ is a different bracket. Adding 2 is the same as subtracting $-2$." }],
            m: "y = (x - (-2))^2 - 7", say: "Adding 2 is subtracting $-2$." },
          { step: 2, ask: "So what is $h$?", type: "num", pre: "$h =$", answer: -2, near: [{ v: 2, fb: "The form **subtracts** $h$. $(x + 2)$ is $x - (-2)$." }], hint: "The number being subtracted.",
            m: "h = -2", say: "The sign flips." },
          { step: 3, ask: "What is $k$?", type: "num", pre: "$k =$", answer: -7, near: [{ v: 7, fb: "The sign belongs to the number: $-7$." }], hint: "The number at the end.",
            m: "k = -7", say: "No flip for $k$." },
          { step: 4, ask: "What is the vertex?", type: "choice", answer: 0,
            options: [{ t: "$(-2, -7)$" }, { t: "$(2, -7)$", fb: "$(x + 2)^2$ is 0 when $x = -2$." }, { t: "$(-7, -2)$", fb: "$h$ comes first, then $k$." }],
            m: "(-2, -7)", say: "The vertex." }],
        why: "Match, $h$, $k$, vertex. Now read one on your own." },
      { type: "pair", kicker: "On your own", prompt: "What is the vertex of $y = (x - 5)^2 + 1$?", answer: [5, 1], skill: "Vertex form",
        near: [{ v: [-5, 1], fb: "$(x - 5)$ is zero when $x = 5$: the vertex is at $x = +5$." }, { v: [1, 5], fb: "$x$ first: $h$ comes from inside the bracket." }], hints: ["Which $x$ makes the bracket zero?"], why: "$h = 5$ and $k = 1$: the vertex is $(5, 1)$." },
      { type: "slots", prompt: "Match each equation to its vertex.",
        slots: [{ id: "a", label: "$(4, 3)$" }, { id: "b", label: "$(-4, 3)$" }, { id: "c", label: "$(4, -3)$" }, { id: "d", label: "$(0, 3)$" }],
        cards: [{ t: "$y = (x - 4)^2 + 3$", slot: "a", fb: "$h = 4$, $k = 3$." }, { t: "$y = (x + 4)^2 + 3$", slot: "b", fb: "$x + 4$ is zero at $-4$." }, { t: "$y = 2(x - 4)^2 - 3$", slot: "c", fb: "The 2 in front changes the width, not the vertex." }, { t: "$y = x^2 + 3$", slot: "d", fb: "No shift sideways: $h = 0$." }],
        skill: "Vertex form", hints: ["The $x$-coordinate has the opposite sign to the number in the bracket."], why: "Read $(h, k)$ straight off, minding the sign of $h$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A number in front changes the shape, not the vertex.$$y = -2(x - 1)^2 + 8$$",
        scene: { type: "walk", how: HOW_7_15, rows: [
          { step: 1, m: "a = -2", say: "The number in front. It does not move the vertex." },
          { step: 2, m: "h = 1", say: "1 is subtracted from $x$." },
          { step: 3, m: "k = 8", say: "8 is added at the end." },
          { step: 4, m: "(1, 8)", say: "Because $a$ is negative the parabola opens downward, so this vertex is the **highest** point." }] },
        gate: true },
      { type: "pair", kicker: "Try it",
        prompt: "What is the vertex of $y = 3(x + 4)^2 - 5$?",
        answer: [-4, -5], skill: "Vertex form",
        near: [{ v: [4, -5], fb: "$(x + 4)$ is $x - (-4)$, so $h = -4$." }, { v: [-5, -4], fb: "$h$ comes first, then $k$." }],
        hints: ["$(x + 4)$ is $x - (-4)$.", "The 3 in front does not move the vertex."], why: "$h = -4$ and $k = -5$: the vertex is $(-4, -5)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says the vertex of $y = (x + 6)^2 + 2$ is $(6, 2)$. What is wrong?",
        options: [{ t: "$(x + 6)$ is $x - (-6)$, so $h = -6$. The vertex is $(-6, 2)$." },
                  { t: "The vertex is $(6, -2)$.", fb: "$k$ keeps its sign. It is $h$ that flips." },
                  { t: "Nothing. Read the numbers as they are.", fb: "Test it: at $x = 6$, $y = 144 + 2$. At $x = -6$, $y = 2$. Which is lower?" }],
        answer: 0, skill: "Vertex form", hints: ["Which $x$ makes $(x + 6)^2$ equal to 0?"],
        why: "The square is 0 when $x = -6$. That is where the vertex is." },
      { type: "sort", kicker: "Use it", prompt: "You now have three forms. Which is which?",
        bins: ["Standard", "Factored", "Vertex"],
        cards: [{ t: "$y = x^2 - 6x + 8$", bin: 0, fb: "A sum of terms." }, { t: "$y = (x - 2)(x - 4)$", bin: 1, fb: "A product of factors." }, { t: "$y = (x - 3)^2 - 1$", bin: 2, fb: "A squared bracket plus a constant." },
                { t: "$y = -2(x + 1)^2 + 5$", bin: 2, fb: "$a(x - h)^2 + k$ with $a = -2$." }, { t: "$y = x(x + 7)$", bin: 1, fb: "A product." }],
        skill: "Vertex form", hints: ["Sum, product, or square-plus-constant?"], why: "The first three cards are all the **same** function: standard shows the $y$-intercept, factored shows the zeros, vertex shows the vertex." }
    ]
  });

  /* ============================================ 7.16 · Graphing from the vertex form */
  var HOW_7_16 = [["Vertex", "Read the vertex $(h, k)$ from the equation."], ["Opens", "Positive $a$: upward, so the vertex is a minimum. Negative $a$: downward, a maximum."], ["Point", "Find one more point. $x = 0$ gives the $y$-intercept."], ["Mirror", "Reflect that point across the axis of symmetry, $x = h$."]];
  LESSONS.push({
    title: "Graphing from the vertex form",
    blurb: "Book 7.16 · Plot the vertex, find one more point, and let symmetry finish the job.",
    mins: 12, v: 3,
    steps: [
      { type: "pair", kicker: "Warm up",
        prompt: "What is the vertex of $y = (x - 2)^2 - 1$?",
        answer: [2, -1], skill: "Graph from vertex form",
        near: [{ v: [-2, -1], fb: "$(x - 2)^2$ is 0 when $x = 2$." }],
        hints: ["Vertex form: $y = (x - h)^2 + k$ has vertex $(h, k)$."], why: "$h = 2$ and $k = -1$: the vertex is $(2, -1)$." },
      { type: "learn", kicker: "The idea",
        prompt: "From vertex form, a sketch takes seconds. Plot the vertex. Find one more point. Then let symmetry give you its mirror image on the other side.",
        scene: { type: "method", how: HOW_7_16 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a sketch planned.$$y = (x - 3)^2 - 4$$",
        scene: { type: "walk", how: HOW_7_16, rows: [
          { step: 1, m: "(3, -4)", say: "The vertex, read from the equation." },
          { step: 2, m: "a = 1", say: "Positive: the parabola opens upward. The vertex is the minimum." },
          { step: 3, m: "y = (\\op{0} - 3)^2 - 4", say: "One more point: put $x = 0$." },
          { step: 3, m: "y = 9 - 4", say: "$(-3)^2 = 9$." },
          { step: 3, m: "y = 5", say: "The $y$-intercept is $(0, 5)$." },
          { step: 4, m: "3 + 3 = 6", say: "$(0, 5)$ is 3 to the left of the axis $x = 3$. Its mirror image is 3 to the right.", 
            ask: { prompt: "$(0, 5)$ is 3 units left of the axis $x = 3$. Where is its mirror image?", answer: 0,
                   options: [{ t: "$(6, 5)$" }, { t: "$(3, 5)$", fb: "That is on the axis itself. Go 3 units to the other side." }, { t: "$(0, -5)$", fb: "The mirror is the vertical line $x = 3$, so the height stays 5." }] } },
          { step: 4, m: "(6, 5)", say: "The same height, on the other side." }] },
        gate: true,
        then: "Vertex, one point, its mirror image: three points fix the parabola." },
      { type: "guided", kicker: "Together",
        prompt: "Now you plan a sketch.$$y = (x - 2)^2 + 1$$",
        how: HOW_7_16, skill: "Graph from vertex form",
        steps: [
          { step: 1, ask: "What is the vertex?", type: "choice", answer: 0,
            options: [{ t: "$(2, 1)$" }, { t: "$(-2, 1)$", fb: "$(x - 2)^2$ is 0 when $x = 2$." }],
            m: "(2, 1)", say: "The vertex." },
          { step: 2, ask: "Which way does the parabola open?", type: "choice", answer: 0,
            options: [{ t: "Upward: $a = 1$ is positive" }, { t: "Downward", fb: "Only a negative number in front opens it downward." }],
            m: "a = 1", say: "Upward. The vertex is a minimum." },
          { step: 3, ask: "Find the $y$-intercept: what is $(0 - 2)^2 + 1$?", type: "num", answer: 5, near: [{ v: -3, fb: "$(-2)^2$ is $+4$." }], hint: "$4 + 1$.",
            lead: [{ m: "y = (\\op{0} - 2)^2 + 1", say: "0 goes where $x$ was." }, { m: "y = 4 + 1", say: "$(-2)^2 = 4$." }], m: "y = 5", say: "The point $(0, 5)$." },
          { step: 4, ask: "$(0, 5)$ is 2 units left of the axis $x = 2$. Where is its mirror image?", type: "choice", answer: 0,
            options: [{ t: "$(4, 5)$" }, { t: "$(2, 5)$", fb: "That is on the axis. Go 2 units to the other side." }, { t: "$(-4, 5)$", fb: "That is further left. The mirror image is on the right of $x = 2$." }],
            m: "(4, 5)", say: "Same height, the other side." }],
        why: "Vertex, opens, point, mirror. Now sketch one on the grid." },
      { type: "plane", kicker: "On your own", prompt: "Sketch $y = 2(x - 1)^2 - 4$: drag $V$ to the vertex and $P$ to the $y$-intercept.",
        x: [-4, 6], y: [-6, 8],
        points: [{ id: "V", x: -2, y: 2, drag: true, label: "V", color: "orange" }, { id: "P", x: 3, y: 4, drag: true, label: "P" }],
        segs: function (st) { var v = st.pt("V"), p = st.pt("P"); if (p.x === v.x) return []; var a = (p.y - v.y) / ((p.x - v.x) * (p.x - v.x)); return curveSegs(function (x) { return a * (x - v.x) * (x - v.x) + v.y; }, -4, 6, "blue"); },
        check: function (st) { var v = st.pt("V"), p = st.pt("P"); return v.x !== 1 || v.y !== -4 ? { ok: false, say: "The vertex is $(h, k)$: read it from $2(x - 1)^2 - 4$." } : p.x === 0 && p.y === -2 ? { ok: true } : { ok: false, say: "The $y$-intercept is at $x = 0$: $2(0 - 1)^2 - 4$." }; },
        answer: { points: { V: [1, -4], P: [0, -2] } }, skill: "Graph from vertex form", hints: ["Vertex $(1, -4)$. Then $x = 0$ gives $2(1) - 4$."], why: "Vertex $(1, -4)$ and $y$-intercept $(0, -2)$. The mirror point $(2, -2)$ comes for free." },
      { type: "num", prompt: "For $f(x) = (x - 2)^2 - 1$, the vertex is $(2, -1)$. What is $f(3)$, one step to the right?", pre: "$f(3) =$", answer: 0, skill: "Graph from vertex form",
        near: [{ v: -1, fb: "That's the vertex's height. At $x = 3$ the bracket is $1$." }], hints: ["$(3 - 2)^2 - 1$."], why: "$1 - 1 = 0$. By symmetry, $f(1)$, one step to the left, is 0 as well." },
      { type: "num", prompt: "What is the $y$-intercept of $y = (x - 3)^2 + 2$?", answer: 11, skill: "Graph from vertex form",
        near: [{ v: 2, fb: "2 is $k$, the height of the vertex. The $y$-intercept is at $x = 0$." }, { v: -7, fb: "$(0 - 3)^2 = +9$." }], hints: ["Put $x = 0$: $(-3)^2 + 2$."], why: "$9 + 2 = 11$. In vertex form the $y$-intercept isn't visible: you have to work it out." },
      { type: "learn", kicker: "A harder case",
        prompt: "A negative in front turns the vertex into a peak.$$y = -(x - 2)^2 + 9$$",
        scene: { type: "walk", how: HOW_7_16, rows: [
          { step: 1, m: "(2, 9)", say: "The vertex." },
          { step: 2, m: "a = -1", say: "Negative: the parabola opens downward. The vertex is the **maximum**: the greatest value is 9." },
          { step: 3, m: "y = -(\\op{0} - 2)^2 + 9", say: "Put $x = 0$." },
          { step: 3, m: "y = -(4) + 9", say: "Square first: $(-2)^2 = 4$. Then apply the minus sign." },
          { step: 3, m: "y = 5", say: "$-4 + 9 = 5$. The $y$-intercept is $(0, 5)$." },
          { step: 4, m: "(4, 5)", say: "Its mirror image across $x = 2$: 2 to the right of the axis instead of 2 to the left." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Does $y = -(x - 4)^2 + 6$ have a maximum or a minimum, and what is it?",
        options: [{ t: "A maximum of 6" }, { t: "A minimum of 6", fb: "$a = -1$ is negative, so the parabola opens downward: its vertex is the top." }, { t: "A maximum of 4", fb: "4 is where it happens ($x = 4$). The maximum *value* is the $y$-coordinate, 6." }],
        answer: 0, skill: "Graph from vertex form", hints: ["The sign of $a$ says which way it opens. $k$ is the height of the vertex."],
        why: "$-(x - 4)^2$ is never positive, so the most $y$ can be is 6, when $x = 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $y = -(x - 1)^2 + 4$, Kiran says: “The minimum value is 4.” What is wrong?",
        options: [{ t: "The number in front is negative, so the parabola opens downward. 4 is the **maximum**." },
                  { t: "The minimum is 1.", fb: "1 is where the vertex is, not how high it is. And this vertex is a peak." },
                  { t: "Nothing. The vertex is always the minimum.", fb: "That is true only when the parabola opens upward." }],
        answer: 0, skill: "Graph from vertex form", hints: ["Step 2: look at the sign in front of the bracket."],
        why: "Everywhere else, $-(x - 1)^2$ takes something away from 4. So 4 is the greatest value." },
      { type: "plane", kicker: "Use it", prompt: "Match the dashed parabola. Set $a$, $h$ and $k$.",
        x: [-5, 7], y: [-6, 8], params: { a: { v: 1, min: -2, max: 2, step: 1, label: "$a$" }, h: { v: 0, min: -5, max: 5, step: 1, label: "$h$" }, k: { v: 0, min: -5, max: 6, step: 1, label: "$k$" } },
        fns: [{ f: function (x) { return -(x - 2) * (x - 2) + 5; }, color: "ink", dashed: true }, { f: vform, color: "blue" }],
        readout: function (st) { var p = st.params; return p.a === 0 ? "$y = " + p.k + "$ (with $a = 0$ it's a flat line)" : "$y = " + vtex(p.a, p.h, p.k) + "$"; },
        check: function (st) { var p = st.params; return p.a === -1 && p.h === 2 && p.k === 5 ? { ok: true } : { ok: false, say: p.a >= 0 ? "The dashed curve opens downward." : "Put the vertex on the dashed curve's top: where is it?" }; },
        answer: { params: { a: -1, h: 2, k: 5 } }, skill: "Graph from vertex form", hints: ["Read the dashed vertex: $(2, 5)$. And it opens downward."], why: "$y = -(x - 2)^2 + 5$." }
    ]
  });

  /* ============================================ 7.17 · Changing the vertex */
  var HOW_7_17 = [["Start", "Start from $y = x^2$, with its vertex at $(0, 0)$."], ["Sideways", "Right by $h$: replace $x$ with $(x - h)$. Left by $h$: use $(x + h)$."], ["Up-down", "Up by $k$: add $k$ at the end. Down: subtract it."], ["Shape", "Multiply the square by $a$ to stretch it. A negative $a$ flips it."]];
  LESSONS.push({
    title: "Changing the vertex",
    blurb: "Book 7.17 · Move a parabola anywhere by changing h and k. Reshape it with a.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up",
        prompt: "What is the vertex of $y = (x - 4)^2 + 1$?",
        options: [{ t: "$(4, 1)$" }, { t: "$(-4, 1)$", fb: "$(x - 4)^2$ is 0 when $x = 4$." }, { t: "$(1, 4)$", fb: "$h$ comes first, then $k$." }],
        answer: 0, skill: "Translate a parabola", hints: ["Vertex form: $(h, k)$."],
        why: "$h = 4$ and $k = 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "Vertex form is a set of handles. Change $h$ and the parabola slides sideways. Change $k$ and it slides up or down. Change $a$ and it stretches or flips. The curve itself stays a parabola.",
        scene: { type: "method", how: HOW_7_17 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $y = x^2$ moved **right 3** and **down 2**.",
        scene: { type: "walk", how: HOW_7_17, rows: [
          { step: 1, m: "y = x^2", say: "The vertex is at $(0, 0)$." },
          { step: 2, m: "y = (x - 3)^2", say: "Right 3: replace $x$ with $(x - 3)$.",
            ask: { prompt: "To move $y = x^2$ **right** 3, what replaces $x$?", answer: 0,
                   options: [{ t: "$(x - 3)$" }, { t: "$(x + 3)$", fb: "$(x + 3)^2$ is 0 at $x = -3$. That moves the vertex left." }] } },
          { step: 3, m: "y = (x - 3)^2 - 2", say: "Down 2: subtract 2 at the end." },
          { step: 3, m: "(3, -2)", say: "The new vertex." }] },
        gate: true,
        then: "Sideways moves go inside the bracket, with the sign reversed. Up and down moves go at the end." },
      { type: "guided", kicker: "Together",
        prompt: "Now you move $y = x^2$ **left 1** and **up 5**.",
        how: HOW_7_17, skill: "Translate a parabola",
        steps: [
          { step: 1, ask: "Where is the vertex of $y = x^2$?", type: "choice", answer: 0,
            options: [{ t: "$(0, 0)$" }, { t: "$(1, 1)$", fb: "$x^2$ is smallest at $x = 0$, where it equals 0." }],
            m: "y = x^2", say: "Vertex at the origin." },
          { step: 2, ask: "Move it left 1. What replaces $x$?", type: "choice", answer: 0,
            options: [{ t: "$(x + 1)$" }, { t: "$(x - 1)$", fb: "$(x - 1)^2$ is 0 at $x = 1$: that moves it right." }],
            m: "y = (x + 1)^2", say: "Left 1: the bracket is 0 at $x = -1$." },
          { step: 3, ask: "Now move it up 5.", type: "choice", answer: 0,
            options: [{ t: "$y = (x + 1)^2 + 5$" }, { t: "$y = (x + 6)^2$", fb: "Up and down changes go outside the bracket, at the end." }, { t: "$y = (x + 1)^2 - 5$", fb: "Up means adding." }],
            m: "y = (x + 1)^2 + 5", say: "The vertex is now $(-1, 5)$." }],
        why: "Start, sideways, up or down, shape. Now write an equation yourself." },
      { type: "choice", kicker: "On your own", prompt: "The graph of $y = x^2$ is moved **right 4** and **up 1**. What is its new equation?",
        options: [{ t: "$y = (x - 4)^2 + 1$" }, { t: "$y = (x + 4)^2 + 1$", fb: "That moves it *left* 4. Its vertex is where $x + 4 = 0$." }, { t: "$y = x^2 + 4x + 1$", fb: "Adding $4x$ doesn't shift the graph 4 to the right. Replace $x$ with $(x - 4)$." }],
        answer: 0, skill: "Translate a parabola", hints: ["The new vertex is $(4, 1)$."], why: "Vertex $(4, 1)$ means $h = 4$, $k = 1$: $y = (x - 4)^2 + 1$." },
      { type: "plane", prompt: "Move the blue parabola onto the dashed one.",
        x: [-7, 5], y: [-5, 8], params: { h: { v: 1, min: -5, max: 4, step: 1, label: "$h$" }, k: { v: 2, min: -4, max: 6, step: 1, label: "$k$" } },
        fns: [{ f: function (x) { return (x + 3) * (x + 3) - 2; }, color: "ink", dashed: true }, { f: vform, color: "blue" }],
        readout: function (st) { return "$y = " + vtex(1, st.params.h, st.params.k) + "$"; },
        check: function (st) { var p = st.params; return p.h === -3 && p.k === -2 ? { ok: true } : { ok: false, say: "The dashed vertex is at $(-3, -2)$." }; },
        answer: { params: { h: -3, k: -2 } }, skill: "Translate a parabola", hints: ["Line up the vertices."], why: "$h = -3$, $k = -2$: $y = (x + 3)^2 - 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "All three handles at once: right 1, up 3, twice as steep, and flipped.",
        scene: { type: "walk", how: HOW_7_17, rows: [
          { step: 1, m: "y = x^2", say: "Start here." },
          { step: 2, m: "(x - 1)^2", say: "Right 1." },
          { step: 3, m: "(x - 1)^2 + 3", say: "Up 3. The vertex is at $(1, 3)$." },
          { step: 4, m: "y = -2(x - 1)^2 + 3", say: "Multiply the square by $-2$: twice as steep, and opening downward. The vertex stays put." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "How does $y = -3x^2$ compare with $y = x^2$?",
        options: [{ t: "It opens downward and is narrower." }, { t: "It opens downward and is wider.", fb: "$|a| = 3$ is bigger than 1, so it climbs (here, falls) faster: narrower." }, { t: "It is moved down 3.", fb: "Subtracting 3 would move it down. Multiplying by $-3$ flips and stretches it." }],
        answer: 0, skill: "Translate a parabola", hints: ["The sign of $a$ flips. The size of $a$ stretches."], why: "Negative: flipped. Size 3: every output three times as far from the axis, so narrower." },
      { type: "slots", prompt: "Starting from $y = x^2$, what does each change do?",
        slots: [{ id: "a", label: "Moves it right 2" }, { id: "b", label: "Moves it left 2" }, { id: "c", label: "Moves it up 2" }, { id: "d", label: "Moves it down 2" }],
        cards: [{ t: "$y = (x - 2)^2$", slot: "a", fb: "The vertex is where $x - 2 = 0$: at $x = 2$." }, { t: "$y = (x + 2)^2$", slot: "b", fb: "The vertex is where $x + 2 = 0$: at $x = -2$." }, { t: "$y = x^2 + 2$", slot: "c", fb: "2 is added to every output." }, { t: "$y = x^2 - 2$", slot: "d", fb: "2 is taken from every output." }],
        skill: "Translate a parabola", hints: ["Inside the bracket: sideways, opposite to the sign. Outside: up or down, as the sign says."], why: "The same rules as for any function: inside changes are horizontal and reversed, outside changes are vertical." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran wants to move $y = x^2$ **up 3**. He writes $y = (x + 3)^2$. What is wrong?",
        options: [{ t: "Up goes outside the bracket: $y = x^2 + 3$. His equation moves it left 3." },
                  { t: "It should be $y = (x - 3)^2$.", fb: "That moves it right 3. Up and down changes go at the end." },
                  { t: "Nothing. That moves it up 3.", fb: "Find his vertex: $(x + 3)^2$ is 0 at $x = -3$, where $y = 0$." }],
        answer: 0, skill: "Translate a parabola", hints: ["Step 3: where does an up or down change go?"],
        why: "Inside the bracket moves sideways. Up 3 is $y = x^2 + 3$, with vertex $(0, 3)$." },
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
        return { type: "num", prompt: "This sequence is quadratic. What comes next? $" + t.slice(0, 4).join(", \\; ") + ", \\; \\ldots$", answer: t[4],
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
