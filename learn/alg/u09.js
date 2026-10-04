/* ==========================================================================
   Algebra I — Unit 9: More quadratic equations. See lab/core.js for the
   format.

   Follows OpenStax Algebra 1, Unit 9, lesson for lesson — the readiness check, 9.1 to 9.11 and
   Project 9. Written to the recipe in docs/OEDU_BRILLIANT_CONCEPT.md and the
   five rules at the top of alg/u02.js: teach, learn by doing, super
   interactive, nothing clumsy, never too much.

   Factoring only solves the equations that happen to factor. This unit
   builds the method that always works: make a perfect square (9.1–9.5),
   do it once with letters to get the quadratic formula (9.6–9.8), and use
   the same move to reach vertex form and the maximum or minimum (9.9–9.11).

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   questions, figures, feedback and every step here are OEdu's own.

   Thirteen lessons, ten skills, three quizzes, and the unit test.
   Standards: CCSS HSA.REI.B.4a–b, HSA.SSE.B.3b, HSF.IF.C.8a, HSN.RN.B.3.
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
    blurb: "Book: Unit 9 Readiness · Simplify a square root, factor a perfect square, and read a parabola's moves from vertex form.",
    mins: 6, v: 2,
    steps: [
      { type: "choice", kicker: "Check 1 · Square roots", prompt: "Simplify $\\sqrt{50}$.",
        options: [{ t: "$5\\sqrt{2}$" }, { t: "$25\\sqrt{2}$", fb: "$50 = 25 \\times 2$, and $\\sqrt{25}$ is 5, not 25." }, { t: "$2\\sqrt{5}$", fb: "$(2\\sqrt{5})^2 = 20$, not 50." }],
        answer: 0, skill: "Simplify radicals", hints: ["Find a perfect square that divides 50."], why: "$\\sqrt{50} = \\sqrt{25 \\cdot 2} = 5\\sqrt{2}$." },
      { type: "num", prompt: "$\\sqrt{18} = \\square\\sqrt{2}$. What goes in the box?", answer: 3, skill: "Simplify radicals",
        near: [{ v: 9, fb: "$18 = 9 \\times 2$, and $\\sqrt{9} = 3$." }], hints: ["$18 = 9 \\times 2$."], why: "$\\sqrt{9 \\cdot 2} = 3\\sqrt{2}$." },
      { type: "expr", kicker: "Check 2 · Perfect squares", prompt: "Factor $x^2 + 10x + 25$.", answer: "(x+5)^2", shown: "(x + 5)^2", form: "factored", skill: "Factor perfect squares",
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"], ["$(\\;)^2$", "^2"]], hints: ["$25 = 5^2$, and $10x = 2 \\cdot 5 \\cdot x$."], why: "$(x + 5)^2$." },
      { type: "expr", prompt: "Factor $x^2 - 8x + 16$.", answer: "(x-4)^2", shown: "(x - 4)^2", form: "factored", skill: "Factor perfect squares",
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"], ["$(\\;)^2$", "^2"]], near: [{ v: "(x+4)^2", fb: "That gives $+8x$. The middle term is negative." }], hints: ["$16 = 4^2$. Mind the sign."], why: "$(x - 4)^2$." },
      { type: "choice", kicker: "Check 3 · Vertex form", prompt: "How is $y = (x - 3)^2 + 2$ moved from $y = x^2$?",
        options: [{ t: "Right 3 and up 2" }, { t: "Left 3 and up 2", fb: "$(x - 3)$ is zero at $x = +3$: the vertex moves right." }, { t: "Right 2 and up 3", fb: "The bracket gives the sideways move (3). The added number gives the vertical one (2)." }],
        answer: 0, skill: "Vertex form", hints: ["The vertex is $(h, k)$."], why: "The vertex moves from $(0, 0)$ to $(3, 2)$." },
      { type: "plane", prompt: "Move the blue parabola onto the dashed one, $y = (x + 1)^2 - 3$.",
        x: [-6, 5], y: [-5, 8], params: { h: { v: 2, min: -4, max: 4, step: 1, label: "$h$" }, k: { v: 1, min: -4, max: 4, step: 1, label: "$k$" } },
        fns: [{ f: function (x) { return (x + 1) * (x + 1) - 3; }, color: "ink", dashed: true }, { f: function (x, p) { return (x - p.h) * (x - p.h) + p.k; }, color: "blue" }],
        readout: function (st) { var p = st.params; return "$y = (x " + (p.h < 0 ? "+ " + -p.h : "- " + p.h) + ")^2 " + (p.k < 0 ? "- " + -p.k : "+ " + p.k) + "$"; },
        check: function (st) { var p = st.params; return p.h === -1 && p.k === -3 ? { ok: true } : { ok: false, say: "The dashed vertex is $(-1, -3)$." }; },
        answer: { params: { h: -1, k: -3 } }, skill: "Vertex form", hints: ["$(x + 1)$ means $h = -1$."], why: "$h = -1$ and $k = -3$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 9.1**. **Check 1** comes up again in 9.5. For **check 2**, see Unit 6's lesson 6.6. For **check 3**, Unit 7's lessons 7.15 to 7.17.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  var KEYS_Q = [["$x$", "x"], ["$x^2$", "x^2"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"], ["$(\\;)^2$", "^2"]];
  var FORMULA = "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$";

  /* ============================================ 9.1 · Perfect squares */
  var HOW_9_1 = [["Spot it", "Check whether one side is a perfect square: $x^2 + 2nx + n^2$."], ["Rewrite", "Write it as a squared bracket: $(x + n)^2$."], ["Roots", "Take square roots. The bracket is plus or minus the root."], ["Solve", "Solve each case."]];
  LESSONS.push({
    title: "What are perfect squares?",
    blurb: "Book 9.1 · An equation is easy when one side is something squared.",
    mins: 12, v: 3,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "Solve $x^2 = 25$.", answer: [5, -5], skill: "Solve with a perfect square", placeholder: "e.g. 4, -1",
        hints: ["Which numbers, squared, make 25? There are two."], why: "$5^2 = 25$ and $(-5)^2 = 25$." },
      { type: "learn", kicker: "The idea",
        prompt: "An equation is easy when one side is **something squared**: take square roots and you are nearly done. Expressions like $x^2 + 6x + 9$ are squares in disguise: $(x + 3)^2$. Spot them, and a hard equation becomes an easy one.",
        scene: { type: "method", how: HOW_9_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a disguised square spotted and used.$$x^2 + 8x + 16 = 9$$",
        scene: { type: "walk", how: HOW_9_1, rows: [
          { step: 1, m: "\\frac{8}{2} = 4", say: "Is the left side a perfect square? Take half of the middle coefficient.",
            fig: L.boxFig({ side: ["x", "4"], top: ["x", "4"], cells: [["x^2", "4x"], ["4x", "16"]], lit: [1, 1], alt: "A square box. x and 4 down the side, x and 4 along the top. Inside: x squared, 4x, 4x and 16." }) },
          { step: 1, m: "4^2 = 16", say: "Its square matches the last term. So $x^2 + 8x + 16$ is a perfect square." },
          { step: 2, m: "(x + 4)^2 = 9", say: "The left side, rewritten.", 
            ask: { prompt: "$x^2 + 8x + 16$ is the square of which bracket?", answer: 0,
                   options: [{ t: "$(x + 4)$" }, { t: "$(x + 16)$", fb: "$(x + 16)^2$ ends in 256. Use half of 8." }, { t: "$(x + 8)$", fb: "$(x + 8)^2$ has $16x$ in the middle." }] } },
          { step: 3, m: "\\sqrt{9} = 3", say: "The square root of 9." },
          { step: 3, m: "x + 4 = 3", say: "The bracket is 3 …" },
          { step: 3, m: "x + 4 = -3", say: "… or it is $-3$." },
          { step: 4, m: "x + 4 \\op{- 4} = 3 \\op{- 4}", say: "First case: subtract 4 from both sides." },
          { step: 4, m: "x = -1", say: "$3 - 4 = -1$." },
          { step: 4, m: "x + 4 \\op{- 4} = -3 \\op{- 4}", say: "Second case: the same move." },
          { step: 4, m: "x = -7", say: "$-3 - 4 = -7$." }] },
        gate: true,
        then: "$(x + n)^2 = x^2 + 2nx + n^2$: the last term is the square of **half** the middle coefficient." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve one.$$x^2 + 4x + 4 = 36$$",
        how: HOW_9_1, skill: "Solve with a perfect square",
        steps: [
          { step: 1, ask: "Is $x^2 + 4x + 4$ a perfect square?", type: "choice", answer: 0,
            options: [{ t: "Yes: half of 4 is 2, and $2^2 = 4$" }, { t: "No", fb: "Half of the middle coefficient is 2, and its square is the last term." }],
            m: "x^2 + 4x + 4", say: "A perfect square." },
          { step: 2, ask: "Rewrite the left side.", type: "choice", answer: 0,
            options: [{ t: "$(x + 2)^2 = 36$" }, { t: "$(x + 4)^2 = 36$", fb: "$(x + 4)^2$ has $8x$ in the middle. Use half of 4." }],
            m: "(x + 2)^2 = 36", say: "A squared bracket." },
          { step: 3, ask: "Take square roots.", type: "choice", answer: 0,
            options: [{ t: "$x + 2 = 6$ or $x + 2 = -6$" }, { t: "$x + 2 = 6$ only", fb: "$(-6)^2$ is 36 as well." }],
            lead: [{ m: "\\sqrt{36} = 6", say: "The square root of 36." }], m: "x + 2 = \\pm 6", say: "Both roots." },
          { step: 4, ask: "Solve each case.", type: "choice", answer: 0,
            options: [{ t: "$x = 4$ or $x = -8$" }, { t: "$x = 4$ or $x = -4$", fb: "$-6 - 2$ is $-8$." }],
            lead: [{ m: "x + 2 \\op{- 2} = 6 \\op{- 2}", say: "First case: subtract 2 from both sides." }, { m: "x = 4", say: "$6 - 2 = 4$." }, { m: "x + 2 \\op{- 2} = -6 \\op{- 2}", say: "Second case." }], m: "x = -8", say: "$-6 - 2 = -8$." }],
        why: "Spot it, rewrite, roots, solve. Now one that is already a squared bracket." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $(x + 3)^2 = 25$.", answer: [2, -8], skill: "Solve with a perfect square", placeholder: "e.g. 4, -6",
        near: [], hints: ["The bracket is 5 or $-5$.", "$x + 3 = 5$, or $x + 3 = -5$."], why: "$x = 2$ or $x = -8$. Easy, because the left side is a square." },
      { type: "sort", prompt: "Perfect square, or not?",
        bins: ["Perfect square", "Not"],
        cards: [{ t: "$x^2 + 10x + 25$", bin: 0, fb: "$n = 5$: twice 5 is 10, and $5^2 = 25$." }, { t: "$x^2 + 10x + 20$", bin: 1, fb: "Half of 10 is 5, and $5^2$ is 25, not 20." }, { t: "$x^2 - 8x + 16$", bin: 0, fb: "$n = -4$: $(x - 4)^2$." },
                { t: "$x^2 + 4x + 16$", bin: 1, fb: "Half of 4 is 2, and $2^2 = 4$, not 16." }, { t: "$x^2 + 2x + 1$", bin: 0, fb: "$(x + 1)^2$." }],
        skill: "Recognise a perfect square", hints: ["Halve the $x$-coefficient and square it. Do you get the constant?"], why: "Half the middle coefficient, squared, must equal the last term." },
      { type: "learn", kicker: "A harder case",
        prompt: "A negative middle term gives a minus sign in the bracket.$$x^2 - 12x + 36 = 4$$",
        scene: { type: "walk", how: HOW_9_1, rows: [
          { step: 1, m: "\\frac{-12}{2} = -6", say: "Half of the middle coefficient." },
          { step: 1, m: "(-6)^2 = 36", say: "Its square matches the last term: a perfect square." },
          { step: 2, m: "(x - 6)^2 = 4", say: "The bracket takes the sign of the middle term." },
          { step: 3, m: "\\sqrt{4} = 2", say: "The square root of 4." },
          { step: 3, m: "x - 6 = \\pm 2", say: "The bracket is 2, or it is $-2$." },
          { step: 4, m: "x - 6 \\op{+ 6} = 2 \\op{+ 6}", say: "First case: add 6 to both sides." },
          { step: 4, m: "x = 8", say: "$2 + 6 = 8$." },
          { step: 4, m: "x - 6 \\op{+ 6} = -2 \\op{+ 6}", say: "Second case." },
          { step: 4, m: "x = 4", say: "$-2 + 6 = 4$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "What number makes $x^2 + 10x + \\square$ a perfect square?", answer: 25, skill: "Recognise a perfect square",
        near: [{ v: 5, fb: "5 is half of 10. Now square it." }, { v: 100, fb: "Halve the 10 first, then square." }, { v: 20, fb: "It isn't double. Halve 10, then square." }], hints: ["Half of 10, squared."], why: "$\\left(\\frac{10}{2}\\right)^2 = 25$: $x^2 + 10x + 25 = (x + 5)^2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $x^2 + 6x + 36$ is a perfect square, “because 36 is $6^2$”. What is wrong?",
        options: [{ t: "The last term must be the square of **half** the middle coefficient: $3^2 = 9$, not 36." },
                  { t: "36 is not a perfect square.", fb: "36 is $6^2$. The trouble is that it does not match the middle term." },
                  { t: "Nothing. It is $(x + 6)^2$.", fb: "Expand it: $(x + 6)^2 = x^2 + 12x + 36$. The middle term is $12x$, not $6x$." }],
        answer: 0, skill: "Recognise a perfect square", hints: ["Expand $(x + 6)^2$ and compare the middle term."],
        why: "$(x + 3)^2 = x^2 + 6x + 9$. With a middle term of $6x$, the last term has to be 9." },
      { type: "numbers", kicker: "Use it", prompt: "Solve $x^2 + 10x + 25 = 49$.", answer: [2, -12], skill: "Solve with a perfect square", placeholder: "e.g. 4, -6",
        hints: ["The left side is $(x + 5)^2$.", "$x + 5 = \\pm 7$."], why: "$x + 5 = 7$ gives 2. $x + 5 = -7$ gives $-12$." }
    ]
  });

  /* ============================================ 9.2 · Completing the square, part 1 */
  var HOW_9_2 = [["Half", "Take half of the coefficient of $x$."], ["Square", "Square it. That is the number to add."], ["Add", "Add it to **both** sides."], ["Solve", "Write the left side as a squared bracket, then take square roots."]];
  LESSONS.push({
    title: "Completing the square, part 1",
    blurb: "Book 9.2 · If the expression isn't a perfect square, add what's missing.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Complete the square: $x^2 + 8x + \\square$.", answer: 16, skill: "Complete the square",
        near: [{ v: 4, fb: "That's half of 8. Square it." }, { v: 64, fb: "Halve first, then square." }], hints: ["Half of 8 is 4."], why: "$4^2 = 16$: $x^2 + 8x + 16 = (x + 4)^2$." },
      { type: "learn", kicker: "Explore", prompt: "Here is $x^2 + 6x$ in tiles, arranged as nearly a square. **Add unit tiles until the square is complete.** How many does it take?",
        scene: { type: "tiles", mode: "square", b: 6, gate: true }, gate: true,
        then: "Nine. The six $x$-tiles split into two strips of 3, leaving a $3 \\times 3$ corner. So $x^2 + 6x + 9 = (x + 3)^2$. This is **completing the square**." },
      { type: "learn", kicker: "The idea",
        prompt: "Most expressions are not perfect squares, but you can **make** one. Add the number that is missing: the square of half the $x$-coefficient. This is **completing the square**. In an equation, add it to both sides.",
        scene: { type: "method", how: HOW_9_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an equation solved by completing the square.$$x^2 + 6x = 7$$",
        scene: { type: "walk", how: HOW_9_2, rows: [
          { step: 1, m: "\\frac{6}{2} = 3", say: "Half of the coefficient of $x$.",
            fig: L.boxFig({ side: ["x", "3"], top: ["x", "3"], cells: [["x^2", "3x"], ["3x", ""]], cap: "$x^2 + 6x$ is a square with a corner missing.", alt: "A square box with one corner empty. Inside: x squared, 3x and 3x." }) },
          { step: 2, m: "3^2 = 9", say: "The number that completes the square.", 
            ask: { prompt: "Half of 6 is 3. What number completes the square?", answer: 0,
                   options: [{ t: "9" }, { t: "3", fb: "The missing corner is 3 by 3: add $3^2$." }, { t: "36", fb: "Halve first, then square: $3^2$." }] },
            fig: L.boxFig({ side: ["x", "3"], top: ["x", "3"], cells: [["x^2", "3x"], ["3x", "9"]], lit: [1, 1], cap: "Adding 9 fills the corner.", alt: "The same box with 9 in the last cell." }) },
          { step: 3, m: "x^2 + 6x \\op{+ 9} = 7 \\op{+ 9}", say: "Add 9 to both sides, to keep the equation balanced." },
          { step: 3, m: "x^2 + 6x + 9 = 16", say: "$7 + 9 = 16$." },
          { step: 4, m: "(x + 3)^2 = 16", say: "The left side is now a perfect square." },
          { step: 4, m: "x + 3 = \\pm 4", say: "Take square roots: $\\sqrt{16} = 4$." },
          { step: 4, m: "x + 3 \\op{- 3} = 4 \\op{- 3}", say: "First case: subtract 3 from both sides." },
          { step: 4, m: "x = 1", say: "$4 - 3 = 1$." },
          { step: 4, m: "x + 3 \\op{- 3} = -4 \\op{- 3}", say: "Second case." },
          { step: 4, m: "x = -7", say: "$-4 - 3 = -7$." }] },
        gate: true,
        then: "To complete the square for $x^2 + bx$: take half of $b$, and square it." },
      { type: "guided", kicker: "Together",
        prompt: "Now you complete the square.$$x^2 + 2x = 15$$",
        how: HOW_9_2, skill: "Solve by completing the square",
        steps: [
          { step: 1, ask: "What is half of 2?", type: "num", answer: 1, hint: "Half of the coefficient of $x$.", m: "\\frac{2}{2} = 1", say: "Half of the coefficient of $x$." },
          { step: 2, ask: "Square it.", type: "num", answer: 1, hint: "$1^2$.", m: "1^2 = 1", say: "The number to add." },
          { step: 3, ask: "Add 1 to both sides.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 2x + 1 = 16$" }, { t: "$x^2 + 2x + 1 = 15$", fb: "Add 1 to the right side as well: $15 + 1$." }],
            lead: [{ m: "x^2 + 2x \\op{+ 1} = 15 \\op{+ 1}", say: "Add 1 to both sides." }], m: "x^2 + 2x + 1 = 16", say: "$15 + 1 = 16$." },
          { step: 4, ask: "Write the left side as a square.", type: "choice", answer: 0,
            options: [{ t: "$(x + 1)^2 = 16$" }, { t: "$(x + 2)^2 = 16$", fb: "The bracket holds **half** of the coefficient: 1." }],
            m: "(x + 1)^2 = 16", say: "A perfect square." },
          { step: 4, ask: "Take square roots and solve.", type: "choice", answer: 0,
            options: [{ t: "$x = 3$ or $x = -5$" }, { t: "$x = 3$ only", fb: "The bracket can be $-4$ as well, which gives $x = -5$." }, { t: "$x = 5$ or $x = -3$", fb: "$x + 1 = 4$ gives 3, and $x + 1 = -4$ gives $-5$." }],
            lead: [{ m: "x + 1 = \\pm 4", say: "Take square roots: $\\sqrt{16} = 4$." }, { m: "x + 1 \\op{- 1} = 4 \\op{- 1}", say: "First case: subtract 1 from both sides." }, { m: "x = 3", say: "$4 - 1 = 3$." }, { m: "x + 1 \\op{- 1} = -4 \\op{- 1}", say: "Second case." }], m: "x = -5", say: "$-4 - 1 = -5$." }],
        why: "Half, square, add, solve. Now complete a square with a negative middle term." },
      { type: "num", kicker: "On your own", prompt: "And $x^2 - 12x + \\square$?", answer: 36, skill: "Complete the square",
        near: [{ v: -36, fb: "A square is always positive: $(-6)^2 = 36$." }, { v: 6, fb: "Half of $-12$ is $-6$. Now square it." }], hints: ["Half of $-12$ is $-6$."], why: "$(-6)^2 = 36$: $x^2 - 12x + 36 = (x - 6)^2$." },
      { type: "numbers", prompt: "Solve $x^2 + 10x = 11$ by completing the square.", answer: [1, -11], skill: "Solve by completing the square", placeholder: "e.g. 4, -1",
        hints: ["Half of 10 is 5, and $5^2 = 25$. Add 25 to both sides.", "$(x + 5)^2 = 36$."], why: "$(x + 5)^2 = 36$ gives $x + 5 = \\pm 6$, so $x = 1$ or $x = -11$." },
      { type: "learn", kicker: "A harder case",
        prompt: "With a negative middle term, the number you add is still positive.$$x^2 - 6x = 16$$",
        scene: { type: "walk", how: HOW_9_2, rows: [
          { step: 1, m: "\\frac{-6}{2} = -3", say: "Half of $-6$." },
          { step: 2, m: "(-3)^2 = 9", say: "A negative number squared is positive. Still add 9." },
          { step: 3, m: "x^2 - 6x \\op{+ 9} = 16 \\op{+ 9}", say: "Add 9 to both sides." },
          { step: 3, m: "x^2 - 6x + 9 = 25", say: "$16 + 9 = 25$." },
          { step: 4, m: "(x - 3)^2 = 25", say: "The bracket holds $-3$." },
          { step: 4, m: "x - 3 = \\pm 5", say: "Take square roots: $\\sqrt{25} = 5$." },
          { step: 4, m: "x - 3 \\op{+ 3} = 5 \\op{+ 3}", say: "First case: add 3 to both sides." },
          { step: 4, m: "x = 8", say: "$5 + 3 = 8$." },
          { step: 4, m: "x - 3 \\op{+ 3} = -5 \\op{+ 3}", say: "Second case." },
          { step: 4, m: "x = -2", say: "$-5 + 3 = -2$." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Solve $x^2 - 4x = 5$ by completing the square.", answer: [5, -1], skill: "Solve by completing the square", placeholder: "e.g. 4, -1",
        hints: ["Half of $-4$ is $-2$, and $(-2)^2 = 4$.", "$(x - 2)^2 = 9$."], why: "$(x - 2)^2 = 9$ gives $x - 2 = \\pm 3$, so $x = 5$ or $x = -1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To complete the square for $x^2 + 8x$, Kiran adds 64. What is wrong?",
        options: [{ t: "Halve first, then square: half of 8 is 4, and $4^2 = 16$." },
                  { t: "He should add 8.", fb: "8 is the coefficient itself. Take half of it, then square." },
                  { t: "Nothing. $8^2 = 64$.", fb: "$x^2 + 8x + 64$ would have to be $(x + 8)^2$, but that has $16x$ in the middle." }],
        answer: 0, skill: "Complete the square", hints: ["Step 1 comes before step 2."],
        why: "$x^2 + 8x + 16 = (x + 4)^2$. The number to add is 16." },
      { type: "numbers", kicker: "Use it", prompt: "Solve $x^2 + 4x = 12$ by completing the square.", answer: [2, -6], skill: "Solve by completing the square", placeholder: "e.g. 4, -6",
        hints: ["Half of 4 is 2, and $2^2 = 4$. Add 4 to both sides.", "$(x + 2)^2 = 16$."], why: "$(x + 2)^2 = 16$, so $x + 2 = \\pm 4$: $x = 2$ or $x = -6$." }
    ]
  });

  /* ============================================ 9.3 · Completing the square, part 2 */
  var HOW_9_3 = [["Move", "Move the constant term to the other side."], ["Complete", "Add the square of half the $x$-coefficient to both sides."], ["Square", "Write the left side as a squared bracket."], ["Roots", "Take square roots, and solve each case."]];
  LESSONS.push({
    title: "Completing the square, part 2",
    blurb: "Book 9.3 · The whole method, including equations with a constant in the way and odd middle terms.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "Complete the square: $x^2 + 10x + \\square$. Which number goes in the box?",
        answer: 25, skill: "Complete the square",
        near: [{ v: 100, fb: "Halve first, then square: half of 10 is 5." }, { v: 5, fb: "5 is half of 10. Now square it." }],
        hints: ["Half of 10, squared."], why: "Half of 10 is 5, and $5^2 = 25$: $x^2 + 10x + 25 = (x + 5)^2$." },
      { type: "learn", kicker: "The idea",
        prompt: "Completing the square solves **any** quadratic equation, even one that will not factor. If a constant is in the way, move it across first. Then complete the square on both sides.",
        scene: { type: "method", how: HOW_9_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the whole method.$$x^2 + 6x + 5 = 0$$",
        scene: { type: "walk", how: HOW_9_3, rows: [
          { step: 1, m: "x^2 + 6x + 5 \\op{- 5} = 0 \\op{- 5}", say: "Subtract 5 from both sides." },
          { step: 1, m: "x^2 + 6x = -5", say: "The constant is across." },
          { step: 2, m: "\\left(\\frac{6}{2}\\right)^2 = 9", say: "Half of 6 is 3, and $3^2 = 9$." },
          { step: 2, m: "x^2 + 6x \\op{+ 9} = -5 \\op{+ 9}", say: "Add 9 to both sides.", 
            ask: { prompt: "We add 9 to the left side to complete the square. What must we do to the right side?", answer: 0,
                   options: [{ t: "Add 9 as well" }, { t: "Nothing", fb: "An equation is a balance. Add to one side only and it is no longer true." }] } },
          { step: 3, m: "(x + 3)^2 = 4", say: "The left side is a square. The right side is $-5 + 9 = 4$." },
          { step: 4, m: "x + 3 = \\pm 2", say: "Take square roots: $\\sqrt{4} = 2$." },
          { step: 4, m: "x + 3 \\op{- 3} = 2 \\op{- 3}", say: "First case: subtract 3 from both sides." },
          { step: 4, m: "x = -1", say: "$2 - 3 = -1$." },
          { step: 4, m: "x + 3 \\op{- 3} = -2 \\op{- 3}", say: "Second case." },
          { step: 4, m: "x = -5", say: "$-2 - 3 = -5$." }] },
        gate: true,
        then: "Move, complete, square, roots." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do the whole method.$$x^2 + 8x + 7 = 0$$",
        how: HOW_9_3, skill: "Solve by completing the square",
        steps: [
          { step: 1, ask: "Move the 7 across.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 8x = -7$" }, { t: "$x^2 + 8x = 7$", fb: "Subtracting 7 from both sides leaves $-7$ on the right." }],
            lead: [{ m: "x^2 + 8x + 7 \\op{- 7} = 0 \\op{- 7}", say: "Subtract 7 from both sides." }], m: "x^2 + 8x = -7", say: "The constant is across." },
          { step: 2, ask: "Half of 8 is 4. What number do you add to both sides?", type: "num", answer: 16, near: [{ v: 4, fb: "4 is the half. Now square it." }], hint: "$4^2$.",
            lead: [{ m: "4^2 = 16", say: "Half of 8, squared." }], m: "x^2 + 8x \\op{+ 16} = -7 \\op{+ 16}", say: "Add 16 to both sides." },
          { step: 3, ask: "Write it with a squared bracket.", type: "choice", answer: 0,
            options: [{ t: "$(x + 4)^2 = 9$" }, { t: "$(x + 4)^2 = -7$", fb: "16 was added to the right side too: $-7 + 16 = 9$." }, { t: "$(x + 8)^2 = 9$", fb: "The bracket holds half of 8." }],
            m: "(x + 4)^2 = 9", say: "$-7 + 16 = 9$." },
          { step: 4, ask: "Solve.", type: "choice", answer: 0,
            options: [{ t: "$x = -1$ or $x = -7$" }, { t: "$x = 1$ or $x = 7$", fb: "$x + 4 = 3$ gives $x = -1$, and $x + 4 = -3$ gives $x = -7$." }, { t: "$x = -1$ only", fb: "The bracket can be $-3$ as well." }],
            lead: [{ m: "x + 4 = \\pm 3", say: "Take square roots: $\\sqrt{9} = 3$." }, { m: "x + 4 \\op{- 4} = 3 \\op{- 4}", say: "First case: subtract 4 from both sides." }, { m: "x = -1", say: "$3 - 4 = -1$." }, { m: "x + 4 \\op{- 4} = -3 \\op{- 4}", say: "Second case." }], m: "x = -7", say: "$-3 - 4 = -7$." }],
        why: "Move, complete, square, roots. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $x^2 - 2x - 8 = 0$.", answer: [4, -2], skill: "Solve by completing the square", placeholder: "e.g. 3, -5",
        hints: ["$x^2 - 2x = 8$. Half of $-2$ is $-1$.", "$(x - 1)^2 = 9$."], why: "$(x - 1)^2 = 9$, so $x - 1 = \\pm 3$: $x = 4$ or $x = -2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An odd middle term gives fractions. The method is the same.$$x^2 + 5x = 6$$",
        scene: { type: "walk", how: HOW_9_3, rows: [
          { step: 1, m: "x^2 + 5x = 6", say: "The constant is already across." },
          { step: 2, m: "\\frac{5}{2}", say: "Half of 5. It stays a fraction." },
          { step: 2, m: "\\left(\\frac{5}{2}\\right)^2 = \\frac{25}{4}", say: "Its square: $5^2 = 25$ over $2^2 = 4$." },
          { step: 3, m: "x^2 + 5x \\op{+ \\frac{25}{4}} = 6 \\op{+ \\frac{25}{4}}", say: "Add it to both sides." },
          { step: 3, m: "6 + \\frac{25}{4} = \\frac{24}{4} + \\frac{25}{4}", say: "On the right, write 6 as quarters." },
          { step: 3, m: "\\left(x + \\frac{5}{2}\\right)^2 = \\frac{49}{4}", say: "The left side is a square. On the right, $24 + 25 = 49$ quarters." },
          { step: 4, m: "x + \\frac{5}{2} = \\pm\\frac{7}{2}", say: "Take square roots: $\\sqrt{49} = 7$ and $\\sqrt{4} = 2$." },
          { step: 4, m: "x = \\frac{7}{2} - \\frac{5}{2}", say: "First case: subtract $\\frac{5}{2}$ from both sides." },
          { step: 4, m: "x = 1", say: "$\\frac{2}{2} = 1$." },
          { step: 4, m: "x = -\\frac{7}{2} - \\frac{5}{2}", say: "Second case." },
          { step: 4, m: "x = -6", say: "$-\\frac{12}{2} = -6$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "An odd middle term gives a fraction. Complete the square: $x^2 + 3x + \\square$. (A fraction is fine.)", answer: 2.25, tol: 1e-9, shown: "9/4", skill: "Complete the square",
        near: [{ v: 1.5, fb: "That's half of 3. Square it." }, { v: 9, fb: "Halve the 3 first: $\\left(\\frac{3}{2}\\right)^2$." }], hints: ["Half of 3 is $\\frac{3}{2}$. Square it."], why: "$\\left(\\frac{3}{2}\\right)^2 = \\frac{9}{4}$: $x^2 + 3x + \\frac{9}{4} = \\left(x + \\frac{3}{2}\\right)^2$." },
      { type: "numbers", prompt: "Solve $x^2 + 3x = 4$. (Add $\\frac{9}{4}$ to both sides.)", answer: [1, -4], skill: "Solve by completing the square", placeholder: "e.g. 3, -5",
        hints: ["$\\left(x + \\frac{3}{2}\\right)^2 = 4 + \\frac{9}{4} = \\frac{25}{4}$.", "$x + \\frac{3}{2} = \\pm\\frac{5}{2}$."], why: "$x = -\\frac{3}{2} + \\frac{5}{2} = 1$ or $x = -\\frac{3}{2} - \\frac{5}{2} = -4$." },
      { type: "choice", kicker: "Find the error", prompt: "Kiran adds 25 to the left side of $x^2 + 10x = 11$ and writes $(x + 5)^2 = 11$. What's the error?",
        options: [{ t: "He didn't add 25 to the right side as well." }, { t: "He should have added 100.", fb: "Half of 10 is 5, and $5^2 = 25$: that part is right." }, { t: "$(x + 5)^2$ is the wrong bracket.", fb: "$x^2 + 10x + 25$ is $(x + 5)^2$." }],
        answer: 0, skill: "Solve by completing the square", hints: ["An equation stays true only if both sides change the same way."], why: "$(x + 5)^2 = 11 + 25 = 36$, so $x + 5 = \\pm 6$: $x = 1$ or $x = -11$." },
      { type: "num", kicker: "Use it",
        prompt: "A rectangle is $x$ metres wide and $x + 6$ metres long. Its area is **16 m²**, so $x^2 + 6x = 16$. Find the width.",
        pre: "$x =$", answer: 2, post: "m", skill: "Solve by completing the square",
        near: [{ v: -8, fb: "$-8$ solves the equation, but a width cannot be negative." }, { v: 5, fb: "5 is the value of the bracket, $x + 3$. Subtract 3." }],
        hints: ["Half of 6 is 3: add 9 to both sides.", "$(x + 3)^2 = 25$."], why: "$(x + 3)^2 = 25$ gives $x = 2$ or $x = -8$. The width is 2 m." }
    ]
  });

  /* ============================================ 9.4 · Completing the square, part 3 */
  var HOW_9_4 = [["Divide", "Divide every term by the coefficient of $x^2$."], ["Move", "Move the constant to the other side."], ["Complete", "Add the square of half the $x$-coefficient to both sides."], ["Roots", "Write the square, take roots, and solve."]];
  LESSONS.push({
    title: "Completing the square, part 3",
    blurb: "Book 9.4 · When x² has a coefficient, divide it out first. Then choose the method that fits.",
    mins: 12, v: 3,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "Solve $x^2 + 6x = 7$ by completing the square.", answer: [1, -7], skill: "Solve by completing the square", placeholder: "e.g. 4, -1",
        hints: ["Half of 6 is 3: add 9 to both sides.", "$(x + 3)^2 = 16$."], why: "$(x + 3)^2 = 16$ gives $x + 3 = \\pm 4$, so $x = 1$ or $x = -7$." },
      { type: "learn", kicker: "The idea",
        prompt: "Completing the square needs a plain $x^2$, with no number in front. If there is one, **divide every term by it** first. Then carry on as before.",
        scene: { type: "method", how: HOW_9_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the extra first step.$$2x^2 + 8x - 10 = 0$$",
        scene: { type: "walk", how: HOW_9_4, rows: [
          { step: 1, m: "\\frac{2x^2}{\\op{2}} + \\frac{8x}{\\op{2}} - \\frac{10}{\\op{2}} = \\frac{0}{\\op{2}}", say: "Divide every term by 2." },
          { step: 1, m: "x^2 + 4x - 5 = 0", say: "Now the coefficient of $x^2$ is 1." },
          { step: 2, m: "x^2 + 4x - 5 \\op{+ 5} = 0 \\op{+ 5}", say: "Move the constant across: add 5 to both sides." },
          { step: 2, m: "x^2 + 4x = 5", say: "Ready to complete the square." },
          { step: 3, m: "\\left(\\frac{4}{2}\\right)^2 = 4", say: "Half of 4 is 2, and $2^2 = 4$." },
          { step: 3, m: "x^2 + 4x \\op{+ 4} = 5 \\op{+ 4}", say: "Add 4 to both sides.", 
            ask: { prompt: "Half of 4 is 2. What is added to both sides?", answer: 0,
                   options: [{ t: "4" }, { t: "2", fb: "Square the half: $2^2 = 4$." }, { t: "16", fb: "Halve first, then square." }] } },
          { step: 3, m: "x^2 + 4x + 4 = 9", say: "$5 + 4 = 9$." },
          { step: 4, m: "(x + 2)^2 = 9", say: "A perfect square." },
          { step: 4, m: "x + 2 = \\pm 3", say: "Take square roots." },
          { step: 4, m: "x + 2 \\op{- 2} = 3 \\op{- 2}", say: "First case: subtract 2 from both sides." },
          { step: 4, m: "x = 1", say: "$3 - 2 = 1$." },
          { step: 4, m: "x + 2 \\op{- 2} = -3 \\op{- 2}", say: "Second case." },
          { step: 4, m: "x = -5", say: "$-3 - 2 = -5$." }] },
        gate: true,
        then: "Divide out the coefficient of $x^2$ first. Then complete the square." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve one.$$3x^2 + 6x - 9 = 0$$",
        how: HOW_9_4, skill: "Solve by completing the square",
        steps: [
          { step: 1, ask: "Divide every term by 3.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 2x - 3 = 0$" }, { t: "$x^2 + 6x - 9 = 0$", fb: "Divide the $6x$ and the 9 by 3 as well." }, { t: "$x^2 + 2x - 9 = 0$", fb: "Divide the 9 by 3 as well." }],
            lead: [{ m: "\\frac{3x^2}{\\op{3}} + \\frac{6x}{\\op{3}} - \\frac{9}{\\op{3}} = \\frac{0}{\\op{3}}", say: "Divide every term by 3." }], m: "x^2 + 2x - 3 = 0", say: "$6 \\div 3 = 2$ and $9 \\div 3 = 3$." },
          { step: 2, ask: "Move the constant across.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 2x = 3$" }, { t: "$x^2 + 2x = -3$", fb: "Add 3 to both sides: the right side becomes $+3$." }],
            lead: [{ m: "x^2 + 2x - 3 \\op{+ 3} = 0 \\op{+ 3}", say: "Add 3 to both sides." }], m: "x^2 + 2x = 3", say: "The constant is across." },
          { step: 3, ask: "Half of 2 is 1. What number is added to both sides?", type: "num", answer: 1, hint: "$1^2$.", lead: [{ m: "x^2 + 2x \\op{+ 1} = 3 \\op{+ 1}", say: "Half of 2 is 1, and $1^2 = 1$. Add 1 to both sides." }], m: "x^2 + 2x + 1 = 4", say: "$3 + 1 = 4$." },
          { step: 4, ask: "Solve $(x + 1)^2 = 4$.", type: "choice", answer: 0,
            options: [{ t: "$x = 1$ or $x = -3$" }, { t: "$x = 3$ or $x = -1$", fb: "$x + 1 = 2$ gives 1, and $x + 1 = -2$ gives $-3$." }, { t: "$x = 1$ only", fb: "The bracket can be $-2$ as well." }],
            lead: [{ m: "x + 1 = \\pm 2", say: "Take square roots: $\\sqrt{4} = 2$." }, { m: "x + 1 \\op{- 1} = 2 \\op{- 1}", say: "First case: subtract 1 from both sides." }, { m: "x = 1", say: "$2 - 1 = 1$." }, { m: "x + 1 \\op{- 1} = -2 \\op{- 1}", say: "Second case." }], m: "x = -3", say: "$-2 - 1 = -3$." }],
        why: "Divide, move, complete, roots. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $2x^2 + 12x + 10 = 0$.", answer: [-1, -5], skill: "Solve by completing the square", placeholder: "e.g. 4, -1",
        hints: ["Step 1: divide by 2: $x^2 + 6x + 5 = 0$.", "Step 3: $x^2 + 6x + 9 = 4$."], why: "$x^2 + 6x = -5$, then $(x + 3)^2 = 4$, so $x = -1$ or $x = -5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes the square is already there, coefficient and all.$$4x^2 + 12x + 9 = 25$$",
        scene: { type: "walk", how: HOW_9_4, rows: [
          { step: 4, m: "4x^2 = (2x)^2", say: "The first term is a square." },
          { step: 4, m: "9 = 3^2", say: "So is the last." },
          { step: 4, m: "12x = 2 \\cdot 2x \\cdot 3", say: "And the middle term is twice the product of the roots." },
          { step: 4, m: "4x^2 + 12x + 9 = (2x + 3)^2", say: "Already a perfect square: no dividing needed." },
          { step: 4, m: "(2x + 3)^2 = 25", say: "The equation, rewritten." },
          { step: 4, m: "2x + 3 = \\pm 5", say: "Take square roots." },
          { step: 4, m: "2x + 3 \\op{- 3} = 5 \\op{- 3}", say: "First case: subtract 3 from both sides." },
          { step: 4, m: "2x = 2", say: "$5 - 3 = 2$." },
          { step: 4, m: "\\frac{2x}{\\op{2}} = \\frac{2}{\\op{2}}", say: "Divide both sides by 2." },
          { step: 4, m: "x = 1", say: "One solution." },
          { step: 4, m: "2x + 3 \\op{- 3} = -5 \\op{- 3}", say: "Second case." },
          { step: 4, m: "2x = -8", say: "$-5 - 3 = -8$." },
          { step: 4, m: "\\frac{2x}{\\op{2}} = \\frac{-8}{\\op{2}}", say: "Divide both sides by 2." },
          { step: 4, m: "x = -4", say: "The other solution." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "So which of these is a perfect square?",
        options: [{ t: "$9x^2 + 30x + 25$" }, { t: "$9x^2 + 15x + 25$", fb: "$(3x + 5)^2$ has a middle term of $2 \\cdot 3x \\cdot 5 = 30x$." }, { t: "$9x^2 + 30x + 5$", fb: "The last term must be a square: $5^2 = 25$." }],
        answer: 0, skill: "Perfect squares with a coefficient", hints: ["First and last terms square. Middle: twice the product of their roots."], why: "$(3x + 5)^2 = 9x^2 + 30x + 25$." },
      { type: "sort", prompt: "Three methods now. Which looks easiest for each equation?",
        bins: ["Square roots", "Factoring", "Completing the square"],
        cards: [{ t: "$(x - 4)^2 = 49$", bin: 0, fb: "It's already a square equal to a number." }, { t: "$x^2 + 5x + 6 = 0$", bin: 1, fb: "2 and 3 multiply to 6 and add to 5." }, { t: "$x^2 + 6x - 2 = 0$", bin: 2, fb: "No whole numbers multiply to $-2$ and add to 6. Complete the square." }, { t: "$x^2 = 81$", bin: 0, fb: "$x = \\pm 9$." }],
        skill: "Choose a method", hints: ["Already a square? Factors easily? If neither, complete the square."], why: "Completing the square always works. The others are shortcuts when the equation allows." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran completes the square without step 1. Tap the line where his work **first** goes wrong.",
        lines: ["2x^2 + 8x = 10", "2x^2 + 8x + 16 = 26", "(2x + 4)^2 = 26"], answer: 1, fix: "x^2 + 4x = 5",
        fb: { 0: "That is the equation as given.", 2: "This follows his plan from the line above. The slip came earlier." },
        skill: "Solve by completing the square", hints: ["Which step comes first when $x^2$ has a coefficient?"],
        why: "Divide by 2 first: $x^2 + 4x = 5$. Then add 4: $(x + 2)^2 = 9$, so $x = 1$ or $x = -5$." },
      { type: "numbers", kicker: "Use it", prompt: "Solve $2x^2 - 12x + 10 = 0$ by any method.", answer: [1, 5], skill: "Solve by completing the square", placeholder: "e.g. 2, 7",
        hints: ["Divide by 2: $x^2 - 6x + 5 = 0$."], why: "$x^2 - 6x + 5 = (x - 1)(x - 5)$, or $(x - 3)^2 = 4$. Either way: $x = 1$ or $x = 5$." }
    ]
  });

  /* ============================================ 9.5 · Irrational solutions */
  var HOW_9_5 = [["Square", "Get a squared part alone on one side."], ["Roots", "Take square roots: plus or minus."], ["Exact", "If the number is not a perfect square, keep the root sign. That is the exact answer."], ["Decimal", "Use a decimal only when a measurement is wanted."]];
  LESSONS.push({
    title: "Quadratic equations with irrational solutions",
    blurb: "Book 9.5 · When the number under the root isn't a perfect square, leave the root in the answer.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Solve $x^2 = 7$. No whole number squares to 7. Between which two whole numbers is the positive solution?",
        options: [{ t: "2 and 3" }, { t: "3 and 4", fb: "$3^2 = 9$ is already more than 7." }, { t: "6 and 8", fb: "That's 7 itself. You want the number whose *square* is 7." }],
        answer: 0, skill: "Irrational solutions", hints: ["$2^2 = 4$ and $3^2 = 9$."], why: "$4 < 7 < 9$, so the solution is between 2 and 3: about 2.65." },
      { type: "learn", kicker: "The idea",
        prompt: "Most quadratic equations do not have whole-number answers. The exact solutions of $x^2 = 7$ are $x = \\pm\\sqrt{7}$. The decimal 2.645… never ends, so any decimal is only close. The root sign **is** the number.",
        scene: { type: "method", how: HOW_9_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an exact answer written.$$(x + 1)^2 = 3$$",
        scene: { type: "walk", how: HOW_9_5, rows: [
          { step: 1, m: "(x + 1)^2 = 3", say: "The squared part is already alone." },
          { step: 2, m: "x + 1 = \\pm\\sqrt{3}", say: "Take square roots. 3 is not a perfect square, so the root stays." },
          { step: 3, m: "x + 1 \\op{- 1} = \\pm\\sqrt{3} \\op{- 1}", say: "Subtract 1 from both sides." },
          { step: 3, m: "x = -1 \\pm \\sqrt{3}", say: "The exact solutions.", 
            ask: { prompt: "$\\sqrt{3}$ is about 1.732. Which is the **exact** answer?", answer: 0,
                   options: [{ t: "$-1 \\pm \\sqrt{3}$" }, { t: "$-1 \\pm 1.732$", fb: "1.732 is only close. The root sign is exact." }] } },
          { step: 4, m: "x \\approx -1 + 1.73 = 0.73", say: "As a decimal, with $\\sqrt{3} \\approx 1.73$: the plus case." },
          { step: 4, m: "x \\approx -1 - 1.73 = -2.73", say: "The minus case. Decimals are for when a measurement is needed." }] },
        gate: true,
        then: "$\\sqrt{3}$ is **irrational**: it cannot be written as a fraction, and its decimal never ends or repeats." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve one exactly, by completing the square.$$x^2 + 6x + 4 = 0$$",
        how: HOW_9_5, skill: "Irrational solutions",
        steps: [
          { step: 1, ask: "Move the 4 across, then add 9 to both sides. Which equation do you get?", type: "choice", answer: 0,
            options: [{ t: "$(x + 3)^2 = 5$" }, { t: "$(x + 3)^2 = 13$", fb: "The right side is $-4 + 9 = 5$." }, { t: "$(x + 6)^2 = 5$", fb: "The bracket holds half of 6." }],
            lead: [{ m: "x^2 + 6x + 4 \\op{- 4} = 0 \\op{- 4}", say: "Subtract 4 from both sides." }, { m: "x^2 + 6x = -4", say: "The constant is across." }, { m: "x^2 + 6x \\op{+ 9} = -4 \\op{+ 9}", say: "Half of 6 is 3, and $3^2 = 9$. Add 9 to both sides." }], m: "(x + 3)^2 = 5", say: "The left side is a square, and $-4 + 9 = 5$." },
          { step: 2, ask: "Take square roots.", type: "choice", answer: 0,
            options: [{ t: "$x + 3 = \\pm\\sqrt{5}$" }, { t: "$x + 3 = \\sqrt{5}$", fb: "There are two roots: positive and negative." }, { t: "$x + 3 = \\pm 5$", fb: "Take the square root of 5, which is $\\sqrt{5}$." }],
            m: "x + 3 = \\pm\\sqrt{5}", say: "Both roots." },
          { step: 3, ask: "Write the exact solutions.", type: "choice", answer: 0,
            options: [{ t: "$x = -3 \\pm \\sqrt{5}$" }, { t: "$x = 3 \\pm \\sqrt{5}$", fb: "Subtract 3 from both sides: $-3$." }, { t: "$x = \\pm\\sqrt{2}$", fb: "$-3$ and $\\sqrt{5}$ cannot be combined into one number like that." }],
            lead: [{ m: "x + 3 \\op{- 3} = \\pm\\sqrt{5} \\op{- 3}", say: "Subtract 3 from both sides." }], m: "x = -3 \\pm \\sqrt{5}", say: "Exact, with the root left in." }],
        why: "Square, roots, exact. Now sort some numbers." },
      { type: "sort", kicker: "On your own", prompt: "Rational or irrational?",
        bins: ["Rational", "Irrational"],
        cards: [{ t: "$\\sqrt{16}$", bin: 0, fb: "It's 4." }, { t: "$\\sqrt{2}$", bin: 1, fb: "2 isn't a perfect square." }, { t: "$\\sqrt{\\frac{9}{4}}$", bin: 0, fb: "It's $\\frac{3}{2}$." }, { t: "$\\sqrt{50}$", bin: 1, fb: "50 isn't a perfect square." }, { t: "$0.75$", bin: 0, fb: "It's $\\frac{3}{4}$." }],
        skill: "Irrational solutions", hints: ["Is the number under the root a perfect square (or a fraction of perfect squares)?"], why: "The root of a perfect square is rational. Other square roots of whole numbers are irrational." },
      { type: "choice", prompt: "Solve $(x - 2)^2 = 5$ exactly.",
        options: [{ t: "$x = 2 \\pm \\sqrt{5}$" }, { t: "$x = \\pm\\sqrt{5} - 2$", fb: "$x - 2 = \\pm\\sqrt{5}$. *Add* 2 to both sides." }, { t: "$x = \\pm\\sqrt{7}$", fb: "The 2 isn't under the root. Take roots first, then add 2." }],
        answer: 0, skill: "Irrational solutions", hints: ["$x - 2 = \\pm\\sqrt{5}$."], why: "$x = 2 + \\sqrt{5}$ or $x = 2 - \\sqrt{5}$: about 4.24 and $-0.24$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When is a decimal the right answer? A square has an area of **20 m²**. How long is its side?",
        scene: { type: "walk", how: HOW_9_5, rows: [
          { step: 1, m: "s^2 = 20", say: "Side times side is the area." },
          { step: 2, m: "s = \\pm\\sqrt{20}", say: "Both roots solve the equation." },
          { step: 3, m: "s = \\sqrt{20}", say: "A length cannot be negative, so only the positive root makes sense." },
          { step: 4, m: "s \\approx 4.5", say: "$4.5^2 = 20.25$: close. To build the fence, you need the decimal." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A square garden has an area of **10 m²**. To one decimal place, how long is its side?", post: "m", answer: 3.2, tol: 0.051, skill: "Irrational solutions",
        near: [{ v: 5, fb: "That's half of 10. The side times itself must make 10." }, { v: 2.5, fb: "That's a quarter of 10. You need $s \\times s = 10$." }],
        hints: ["$3^2 = 9$ and $3.2^2 = 10.24$."], why: "$\\sqrt{10} \\approx 3.16$, so about 3.2 m." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran writes the solutions of $x^2 = 7$ as “$x = 2.65$”. What is wrong?",
        options: [{ t: "It is rounded, and the negative solution is missing. Exactly: $x = \\pm\\sqrt{7}$." },
                  { t: "The answer is $x = 3.5$.", fb: "3.5 is half of 7. A square root is not a half." },
                  { t: "Nothing. $2.65^2 = 7$.", fb: "$2.65^2 = 7.0225$: close, not equal. And $-2.65$ would work just as well." }],
        answer: 0, skill: "Irrational solutions", hints: ["Step 2: how many roots? Step 3: is 2.65 exact?"],
        why: "$\\sqrt{7}$ is exact, and there are two solutions: $\\sqrt{7}$ and $-\\sqrt{7}$." },
      { type: "choice", kicker: "Use it",
        prompt: "A ball lands when $t^2 = 6$, with $t$ in seconds after it is dropped. Which is the exact landing time?",
        options: [{ t: "$t = \\sqrt{6}$ seconds" },
                  { t: "$t = \\pm\\sqrt{6}$ seconds", fb: "Both solve the equation, but a time before the drop makes no sense." },
                  { t: "$t = 3$ seconds", fb: "3 is half of 6. $3^2$ is 9, not 6." }],
        answer: 0, skill: "Irrational solutions", hints: ["Take square roots, then ask which root makes sense."],
        why: "$t = \\sqrt{6}$, about 2.4 seconds. The negative root is before the drop." }
    ]
  });

  /* ============================================ 9.6 · The quadratic formula */
  var HOW_9_6 = [["Zero", "Write the equation as $ax^2 + bx + c = 0$."], ["Read", "Read off $a$, $b$ and $c$, with their signs."], ["Under root", "Work out $b^2 - 4ac$."], ["Finish", "Put everything into the formula, and work out both solutions."]];
  LESSONS.push({
    title: "The quadratic formula",
    blurb: "Book 9.6 · One formula that solves every quadratic equation.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Try to factor $x^2 + 5x + 3$. Which two whole numbers multiply to 3 and add to 5?",
        options: [{ t: "There aren't any." }, { t: "1 and 3", fb: "They multiply to 3, but add to 4." }, { t: "2 and 3", fb: "They add to 5, but multiply to 6." }],
        answer: 0, skill: "The quadratic formula", hints: ["The only whole-number pair multiplying to 3 is 1 and 3."], why: "This one doesn't factor. You could complete the square. Or use the result of completing the square done once and for all." },
      { type: "learn", kicker: "The idea",
        prompt: "Factoring fails for most equations. Completing the square always works, but it is slow. Do it once with letters and you get a formula that solves **every** quadratic equation $ax^2 + bx + c = 0$.$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$",
        scene: { type: "method", how: HOW_9_6 } },
      { type: "learn", kicker: "Explore", prompt: "Here is the formula at work. Change $a$, $b$ and $c$. The orange dots are the formula's answers.",
        scene: { type: "plane", x: [-7, 7], y: [-9, 9], gate: true,
          params: { a: { v: 1, min: 1, max: 3, step: 1, label: "$a$" }, b: { v: -1, min: -6, max: 6, step: 1, label: "$b$" }, c: { v: -6, min: -6, max: 6, step: 1, label: "$c$" } },
          fns: [{ f: function (x, p) { return p.a * x * x + p.b * x + p.c; }, color: "blue" }],
          marks: function (st) { var p = st.params, d = p.b * p.b - 4 * p.a * p.c; if (d < 0) return []; var q = Math.sqrt(d); return [{ x: (-p.b + q) / (2 * p.a), y: 0, color: "orange", r: 6 }, { x: (-p.b - q) / (2 * p.a), y: 0, color: "orange", r: 6 }]; },
          readout: function (st) { var p = st.params, d = p.b * p.b - 4 * p.a * p.c, q = Math.sqrt(d);
            return "$" + poly([[p.a, "x^2"], [p.b, "x"], [p.c, ""]]) + " = 0$ &nbsp; $b^2 - 4ac = " + d + "$<br>" + (d < 0 ? "No real solutions: there is no square root of a negative number." : "$x = " + nm(r2((-p.b + q) / (2 * p.a))) + "$" + (d === 0 ? "" : " or $x = " + nm(r2((-p.b - q) / (2 * p.a))) + "$")); } },
        gate: true,
        then: "Whatever the coefficients, the formula lands exactly where the parabola crosses the axis. When $b^2 - 4ac$ goes negative, the parabola lifts clear of the axis and the solutions vanish." },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the formula used.$$x^2 - 6x + 5 = 0$$",
        scene: { type: "walk", how: HOW_9_6, rows: [
          { step: 1, m: "x^2 - 6x + 5 = 0", say: "Already equal to 0." },
          { step: 2, m: "a = 1", say: "The coefficient of $x^2$." },
          { step: 2, m: "b = -6", say: "The coefficient of $x$, with its sign." },
          { step: 2, m: "c = 5", say: "The constant." },
          { step: 3, m: "b^2 - 4ac = (\\op{-6})^2 - 4(\\op{1})(\\op{5})", say: "The part under the root." },
          { step: 3, m: "36 - 20", say: "$(-6)^2 = 36$ and $4 \\cdot 1 \\cdot 5 = 20$.", 
            ask: { prompt: "$b = -6$. What is $b^2$?", answer: 0,
                   options: [{ t: "36" }, { t: "$-36$", fb: "A negative number squared is positive: $(-6)(-6) = 36$." }] } },
          { step: 3, m: "16", say: "$36 - 20 = 16$." },
          { step: 4, m: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", say: "The formula." },
          { step: 4, m: "x = \\frac{-(\\op{-6}) \\pm \\sqrt{\\op{16}}}{2(\\op{1})}", say: "Put the values in." },
          { step: 4, m: "x = \\frac{6 \\pm 4}{2}", say: "$-b$ is $+6$, $\\sqrt{16} = 4$ and $2a$ is 2." },
          { step: 4, m: "x = \\frac{6 + 4}{2}", say: "The plus case." },
          { step: 4, m: "x = 5", say: "$10 \\div 2 = 5$." },
          { step: 4, m: "x = \\frac{6 - 4}{2}", say: "The minus case." },
          { step: 4, m: "x = 1", say: "$2 \\div 2 = 1$." }] },
        gate: true,
        then: "The **quadratic formula** works for every quadratic equation, whether it factors or not." },
      { type: "guided", kicker: "Together",
        prompt: "Now you use the formula.$$2x^2 - 7x + 3 = 0$$",
        how: HOW_9_6, skill: "The quadratic formula",
        steps: [
          { step: 2, ask: "What are $a$, $b$ and $c$?", type: "choice", answer: 0,
            options: [{ t: "$a = 2$, $b = -7$, $c = 3$" }, { t: "$a = 2$, $b = 7$, $c = 3$", fb: "The sign belongs to the term: $b = -7$." }],
            lead: [{ m: "a = 2", say: "The coefficient of $x^2$." }, { m: "b = -7", say: "The coefficient of $x$, with its sign." }], m: "c = 3", say: "The constant." },
          { step: 3, ask: "Work out $b^2 - 4ac = (-7)^2 - 4(2)(3)$.", type: "num", answer: 25,
            near: [{ v: -73, fb: "$(-7)^2$ is $+49$." }, { v: 49, fb: "Now subtract $4ac$, which is 24." }], hint: "$49 - 24$.",
            lead: [{ m: "(\\op{-7})^2 - 4(\\op{2})(\\op{3})", say: "The values go into $b^2 - 4ac$." }, { m: "49 - 24", say: "$(-7)^2 = 49$ and $4 \\cdot 2 \\cdot 3 = 24$." }], m: "25", say: "The part under the root." },
          { step: 4, ask: "Put it into the formula.", type: "choice", answer: 0,
            options: [{ t: "$x = \\frac{7 \\pm 5}{4}$" }, { t: "$x = \\frac{-7 \\pm 5}{4}$", fb: "$-b$ is $-(-7) = +7$." }, { t: "$x = \\frac{7 \\pm 5}{2}$", fb: "The denominator is $2a = 4$." }],
            lead: [{ m: "x = \\frac{-(\\op{-7}) \\pm \\sqrt{\\op{25}}}{2(\\op{2})}", say: "Put the values into the formula." }], m: "x = \\frac{7 \\pm 5}{4}", say: "$-b = 7$, $\\sqrt{25} = 5$, $2a = 4$." },
          { step: 4, ask: "Work out both solutions.", type: "choice", answer: 0,
            options: [{ t: "$x = 3$ or $x = \\frac{1}{2}$" }, { t: "$x = 3$ only", fb: "Use the minus as well: $\\frac{7 - 5}{4}$." }, { t: "$x = 12$ or $x = 2$", fb: "Divide by 4." }],
            lead: [{ m: "x = \\frac{7 + 5}{4}", say: "The plus case." }, { m: "x = \\frac{12}{4} = 3", say: "$12 \\div 4 = 3$." }, { m: "x = \\frac{7 - 5}{4}", say: "The minus case." }], m: "x = \\frac{2}{4} = \\frac{1}{2}", say: "Simplify the fraction." }],
        why: "Read, under the root, finish. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Use the formula on $x^2 - 4x - 5 = 0$.", answer: [5, -1], skill: "The quadratic formula", placeholder: "e.g. 3, -2",
        hints: ["$a = 1$, $b = -4$, $c = -5$.", "$b^2 - 4ac = 16 + 20 = 36$."], why: "$x = \\frac{4 \\pm 6}{2}$: $x = 5$ or $x = -1$. (It also factors: $(x - 5)(x + 1)$. The formula agrees.)" },
      { type: "learn", kicker: "A harder case",
        prompt: "Now the equation from the warm-up, which would not factor.$$x^2 + 5x + 3 = 0$$",
        scene: { type: "walk", how: HOW_9_6, rows: [
          { step: 2, m: "a = 1", say: "The coefficient of $x^2$." },
          { step: 2, m: "b = 5", say: "The coefficient of $x$." },
          { step: 2, m: "c = 3", say: "The constant." },
          { step: 3, m: "b^2 - 4ac = (\\op{5})^2 - 4(\\op{1})(\\op{3})", say: "The part under the root." },
          { step: 3, m: "25 - 12 = 13", say: "$5^2 = 25$ and $4 \\cdot 1 \\cdot 3 = 12$." },
          { step: 4, m: "x = \\frac{-(\\op{5}) \\pm \\sqrt{\\op{13}}}{2(\\op{1})}", say: "Put the values into the formula." },
          { step: 4, m: "x = \\frac{-5 \\pm \\sqrt{13}}{2}", say: "13 is not a perfect square, so the root stays. These are the exact solutions that factoring could not find." }] },
        gate: true },
      { type: "choice", kicker: "Try it",
        prompt: "Use the formula on $x^2 + 3x + 1 = 0$. Which are its solutions?",
        options: [{ t: "$x = \\frac{-3 \\pm \\sqrt{5}}{2}$" },
                  { t: "$x = \\frac{3 \\pm \\sqrt{5}}{2}$", fb: "The formula starts with $-b$, and $b = 3$." },
                  { t: "$x = \\frac{-3 \\pm \\sqrt{13}}{2}$", fb: "$b^2 - 4ac = 9 - 4 = 5$." }],
        answer: 0, skill: "The quadratic formula", hints: ["$a = 1$, $b = 3$, $c = 1$.", "$b^2 - 4ac = 9 - 4$."],
        why: "$b^2 - 4ac = 5$, $-b = -3$ and $2a = 2$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran uses the formula on $x^2 - 2x - 3 = 0$. Tap the line where his work **first** goes wrong.",
        lines: ["a = 1, \\; b = -2, \\; c = -3", "b^2 - 4ac = 4 - 12 = -8", "\\text{no real solutions}"], answer: 1, fix: "b^2 - 4ac = 4 + 12 = 16",
        fb: { 0: "The coefficients are right, signs included.", 2: "A negative number under the root would mean no real solutions, so this follows. The slip came earlier." },
        skill: "The quadratic formula", hints: ["What is $-4 \\cdot 1 \\cdot (-3)$?"],
        why: "$-4(1)(-3) = +12$, so $b^2 - 4ac = 16$. Then $x = \\frac{2 \\pm 4}{2}$: $x = 3$ or $x = -1$." },
      { type: "num", kicker: "Use it",
        prompt: "A diver's height is $h(t) = -5t^2 + 10t + 15$ metres. Setting it to 0, the formula gives $t = \\frac{-10 \\pm 20}{-10}$. What is the **positive** landing time?",
        answer: 3, post: "s", skill: "The quadratic formula",
        near: [{ v: -1, fb: "That is the other solution: a time before the dive." }, { v: 1, fb: "$\\frac{-10 - 20}{-10}$ is $\\frac{-30}{-10}$." }],
        hints: ["Work out both: $\\frac{-10 + 20}{-10}$ and $\\frac{-10 - 20}{-10}$."], why: "$\\frac{-30}{-10} = 3$ and $\\frac{10}{-10} = -1$. The diver reaches the water after 3 seconds." }
    ]
  });
  /* ============================================ 9.7 · Applying the quadratic formula */
  var HOW_9_7 = [["Read", "Read off $a$, $b$ and $c$, with their signs."], ["Under root", "Work out $b^2 - 4ac$. This is the **discriminant**."], ["How many", "Positive: two solutions. Zero: one. Negative: none."], ["Finish", "If there are solutions, complete the formula. Check by substituting."]];
  LESSONS.push({
    title: "Applying the quadratic formula",
    blurb: "Book 9.7 · The usual slips, how to check, and what the number under the root tells you.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "For $x^2 - 6x + 5 = 0$, work out $b^2 - 4ac$.",
        answer: 16, skill: "The discriminant",
        near: [{ v: -56, fb: "$(-6)^2$ is $+36$." }, { v: 56, fb: "Subtract $4ac$: $36 - 20$." }],
        hints: ["$a = 1$, $b = -6$, $c = 5$.", "$36 - 20$."], why: "$(-6)^2 - 4(1)(5) = 36 - 20 = 16$." },
      { type: "learn", kicker: "The idea",
        prompt: "The formula is reliable. The slips are human: a lost sign, a fraction bar that is too short. And one part of it, the number under the root, tells you how many solutions to expect before you finish.",
        scene: { type: "method", how: HOW_9_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the formula used with care.$$3x^2 + 5x - 2 = 0$$",
        scene: { type: "walk", how: HOW_9_7, rows: [
          { step: 1, m: "a = 3", say: "The coefficient of $x^2$." },
          { step: 1, m: "b = 5", say: "The coefficient of $x$." },
          { step: 1, m: "c = -2", say: "The constant, with its sign." },
          { step: 2, m: "b^2 - 4ac = (\\op{5})^2 - 4(\\op{3})(\\op{-2})", say: "The part under the root." },
          { step: 2, m: "25 - (-24)", say: "$5^2 = 25$ and $4 \\cdot 3 \\cdot (-2) = -24$.", 
            ask: { prompt: "What is $-4 \\cdot 3 \\cdot (-2)$?", answer: 0,
                   options: [{ t: "$+24$" }, { t: "$-24$", fb: "A negative times a negative is positive." }] } },
          { step: 2, m: "25 + 24 = 49", say: "Subtracting a negative adds: two negatives make a plus." },
          { step: 3, m: "49 > 0", say: "Positive: there are two solutions." },
          { step: 4, m: "x = \\frac{-(\\op{5}) \\pm \\sqrt{\\op{49}}}{2(\\op{3})}", say: "Put the values into the formula." },
          { step: 4, m: "x = \\frac{-5 \\pm 7}{6}", say: "$\\sqrt{49} = 7$ and $2 \\cdot 3 = 6$. The **whole** top is divided by $2a$." },
          { step: 4, m: "x = \\frac{-5 + 7}{6}", say: "The plus case." },
          { step: 4, m: "x = \\frac{2}{6} = \\frac{1}{3}", say: "Simplify the fraction." },
          { step: 4, m: "x = \\frac{-5 - 7}{6}", say: "The minus case." },
          { step: 4, m: "x = \\frac{-12}{6} = -2", say: "Check $x = -2$ in the original: $12 - 10 - 2 = 0$ ✓." }] },
        gate: true,
        then: "The number under the root, $b^2 - 4ac$, is the **discriminant**." },
      { type: "guided", kicker: "Together",
        prompt: "Now you look before you finish.$$x^2 + 2x + 5 = 0$$",
        how: HOW_9_7, skill: "The discriminant",
        steps: [
          { step: 1, ask: "What are $a$, $b$ and $c$?", type: "choice", answer: 0,
            options: [{ t: "$a = 1$, $b = 2$, $c = 5$" }, { t: "$a = 0$, $b = 2$, $c = 5$", fb: "$x^2$ is $1x^2$, so $a = 1$." }],
            lead: [{ m: "a = 1", say: "The coefficient of $x^2$." }, { m: "b = 2", say: "The coefficient of $x$." }], m: "c = 5", say: "The constant." },
          { step: 2, ask: "Work out $b^2 - 4ac$.", type: "num", answer: -16, near: [{ v: 24, fb: "$4 - 20$, not $4 + 20$." }, { v: 16, fb: "4 is smaller than 20, so the result is negative." }], hint: "$4 - 20$.",
            lead: [{ m: "(\\op{2})^2 - 4(\\op{1})(\\op{5})", say: "The values go into $b^2 - 4ac$." }], m: "4 - 20 = -16", say: "$2^2 = 4$ and $4 \\cdot 1 \\cdot 5 = 20$. The discriminant." },
          { step: 3, ask: "The discriminant is negative. How many real solutions are there?", type: "choice", answer: 0,
            options: [{ t: "None" }, { t: "Two", fb: "Two needs a positive discriminant." }, { t: "One", fb: "One needs a discriminant of exactly 0." }],
            m: "-16 < 0", say: "No real number has a negative square, so there is nothing to finish." }],
        why: "The discriminant saved the work. Now use it to count solutions." },
      { type: "sort", kicker: "On your own", prompt: "Use the discriminant. How many real solutions?",
        bins: ["Two", "One", "None"],
        cards: [{ t: "$x^2 + 4x + 4 = 0$", bin: 1, fb: "$16 - 16 = 0$." }, { t: "$x^2 + x + 1 = 0$", bin: 2, fb: "$1 - 4 = -3$." }, { t: "$x^2 - 5x + 2 = 0$", bin: 0, fb: "$25 - 8 = 17$." }, { t: "$2x^2 + 3x - 2 = 0$", bin: 0, fb: "$9 + 16 = 25$." }],
        skill: "The discriminant", hints: ["Work out $b^2 - 4ac$ for each."], why: "Positive, zero or negative: two, one or none." },
      { type: "numbers", prompt: "Solve $2x^2 + 3x - 2 = 0$ with the formula.", answer: [0.5, -2], skill: "The quadratic formula", placeholder: "e.g. 1/3, -4",
        hints: ["$a = 2$, $b = 3$, $c = -2$. Discriminant 25.", "$x = \\frac{-3 \\pm 5}{4}$."], why: "$\\frac{-3 + 5}{4} = \\frac{1}{2}$ and $\\frac{-3 - 5}{4} = -2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What if the discriminant is exactly 0?$$x^2 - 6x + 9 = 0$$",
        scene: { type: "walk", how: HOW_9_7, rows: [
          { step: 1, m: "a = 1", say: "The coefficient of $x^2$." },
          { step: 1, m: "b = -6", say: "The coefficient of $x$." },
          { step: 1, m: "c = 9", say: "The constant." },
          { step: 2, m: "(\\op{-6})^2 - 4(\\op{1})(\\op{9})", say: "The discriminant, $b^2 - 4ac$." },
          { step: 2, m: "36 - 36 = 0", say: "$(-6)^2 = 36$ and $4 \\cdot 1 \\cdot 9 = 36$." },
          { step: 3, m: "0", say: "Zero: exactly one solution. The $\\pm$ adds and subtracts nothing." },
          { step: 4, m: "x = \\frac{-(\\op{-6}) \\pm \\sqrt{\\op{0}}}{2(\\op{1})}", say: "Put the values into the formula." },
          { step: 4, m: "x = \\frac{6 \\pm 0}{2}", say: "$-b$ is $+6$ and $\\sqrt{0} = 0$." },
          { step: 4, m: "x = 3", say: "$6 \\div 2 = 3$. The parabola touches the axis at one point." }] },
        gate: true },
      { type: "choice", kicker: "Try it",
        prompt: "How many real solutions does $x^2 + 4x + 4 = 0$ have?",
        options: [{ t: "One" }, { t: "Two", fb: "$b^2 - 4ac = 16 - 16 = 0$. Two needs a positive discriminant." }, { t: "None", fb: "$b^2 - 4ac = 16 - 16 = 0$, which is not negative." }],
        answer: 0, skill: "The discriminant", hints: ["Work out $b^2 - 4ac$ with $a = 1$, $b = 4$, $c = 4$."],
        why: "The discriminant is 0: one solution, $x = -2$." },
      { type: "choice", kicker: "Find the error", prompt: "For $2x^2 - 7x + 3 = 0$, Lin writes $x = \\frac{-7 \\pm \\sqrt{25}}{4}$. What's her mistake?",
        options: [{ t: "$b$ is $-7$, so $-b$ is $+7$." }, { t: "The root should be $\\sqrt{73}$.", fb: "$(-7)^2 - 4(2)(3) = 49 - 24 = 25$. That part is right." }, { t: "The denominator should be 2.", fb: "$2a = 2 \\cdot 2 = 4$. That part is right." }],
        answer: 0, skill: "Avoid formula errors", hints: ["The formula starts with $-b$. What is $-(-7)$?"], why: "$-b = -(-7) = 7$: $x = \\frac{7 \\pm 5}{4}$, giving 3 and $\\frac{1}{2}$." },
      { type: "choice", prompt: "Elena writes the formula as $x = -b \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a}$. What's wrong?",
        options: [{ t: "The **whole** top, $-b \\pm \\sqrt{\\ldots}$, is divided by $2a$." }, { t: "Nothing: it's the same thing.", fb: "Try $x^2 - 4x - 5 = 0$: hers gives $4 \\pm 3$, but the true solutions are 5 and $-1$." }, { t: "It should be divided by $a$, not $2a$.", fb: "$2a$ is right. The issue is what gets divided." }],
        answer: 0, skill: "Avoid formula errors", hints: ["Where does the fraction bar stretch to?"], why: "$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$: the $-b$ is divided by $2a$ too." },
      { type: "choice", kicker: "Use it", prompt: "How can you be sure that $x = \\frac{1}{2}$ really solves $2x^2 + 3x - 2 = 0$?",
        options: [{ t: "Substitute it: $2\\left(\\frac{1}{4}\\right) + \\frac{3}{2} - 2 = 0$ ✓" }, { t: "It came from the formula, so it must be right.", fb: "The formula is right, but arithmetic slips are easy. A check costs seconds." }, { t: "It's positive.", fb: "Solutions can be negative, too." }],
        answer: 0, skill: "Avoid formula errors", hints: ["A solution makes the equation true."], why: "$\\frac{1}{2} + \\frac{3}{2} - 2 = 0$ ✓. Substituting back is the surest check." }
    ]
  });

  /* ============================================ 9.8 · Deriving the quadratic formula */
  var HOW_9_8 = [["Divide", "Divide every term by $a$."], ["Move", "Move the constant to the other side."], ["Complete", "Add the square of half the $x$-coefficient to both sides."], ["Roots", "Take square roots, then get $x$ alone."]];
  LESSONS.push({
    title: "Deriving the quadratic formula",
    blurb: "Book 9.8 · Where the formula comes from: completing the square, done once with letters.",
    mins: 12, v: 3,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "Warm up by completing the square with numbers: solve $x^2 + 6x + 5 = 0$.", answer: [-1, -5], skill: "Solve by completing the square", placeholder: "e.g. -2, -3",
        near: [], hints: ["$x^2 + 6x = -5$. Add 9.", "$(x + 3)^2 = 4$."], why: "$x + 3 = \\pm 2$: $x = -1$ or $x = -5$. Now watch the same moves with letters." },
      { type: "learn", kicker: "The idea",
        prompt: "Where does the formula come from? From completing the square, done once with **letters** in place of numbers. Every step is one you already know. Nothing new is needed.",
        scene: { type: "method", how: HOW_9_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the same steps on $x^2 + bx + c = 0$, with $b$ and $c$ left as letters. Here $a = 1$, so there is nothing to divide by.",
        scene: { type: "walk", how: HOW_9_8, rows: [
          { step: 2, m: "x^2 + bx + c \\op{- c} = 0 \\op{- c}", say: "Move $c$ across: subtract it from both sides." },
          { step: 2, m: "x^2 + bx = -c", say: "The constant is across." },
          { step: 3, m: "\\left(\\frac{b}{2}\\right)^2 = \\frac{b^2}{4}", say: "Half of $b$ is $\\frac{b}{2}$. Its square is $\\frac{b^2}{4}$." },
          { step: 3, m: "x^2 + bx \\op{+ \\frac{b^2}{4}} = -c \\op{+ \\frac{b^2}{4}}", say: "Add it to both sides." },
          { step: 3, m: "\\left(x + \\frac{b}{2}\\right)^2 = \\frac{b^2}{4} - c", say: "The left side is a square." },
          { step: 3, m: "\\left(x + \\frac{b}{2}\\right)^2 = \\frac{b^2}{4} - \\frac{4c}{4}", say: "Write $c$ as quarters: $c = \\frac{4c}{4}$." },
          { step: 3, m: "\\left(x + \\frac{b}{2}\\right)^2 = \\frac{b^2 - 4c}{4}", say: "One denominator." },
          { step: 4, m: "x + \\frac{b}{2} = \\pm\\frac{\\sqrt{b^2 - 4c}}{2}", say: "Take square roots: $\\sqrt{4} = 2$ underneath.", 
            ask: { prompt: "Which move brings in the $\\pm$?", answer: 0,
                   options: [{ t: "Taking square roots" }, { t: "Moving $c$ across", fb: "That only changes a sign. Two answers appear when you take a square root." }] } },
          { step: 4, m: "x = -\\frac{b}{2} \\pm \\frac{\\sqrt{b^2 - 4c}}{2}", say: "Subtract $\\frac{b}{2}$ from both sides." },
          { step: 4, m: "x = \\frac{-b \\pm \\sqrt{b^2 - 4c}}{2}", say: "Over one denominator. This is the formula for $a = 1$." }] },
        gate: true,
        then: "The formula is completing the square, done once and written down." },
      { type: "guided", kicker: "Together",
        prompt: "Now you make each move. Keep $c$ as a letter.$$x^2 + 4x + c = 0$$",
        how: HOW_9_8, skill: "Derive the formula",
        steps: [
          { step: 2, ask: "Move $c$ across.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 4x = -c$" }, { t: "$x^2 + 4x = c$", fb: "Subtracting $c$ from both sides leaves $-c$ on the right." }],
            lead: [{ m: "x^2 + 4x + c \\op{- c} = 0 \\op{- c}", say: "Subtract $c$ from both sides." }], m: "x^2 + 4x = -c", say: "The constant is across." },
          { step: 3, ask: "Half of 4 is 2. Add its square to both sides.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 4x + 4 = 4 - c$" }, { t: "$x^2 + 4x + 4 = -c$", fb: "The 4 goes on the right side as well." }],
            lead: [{ m: "x^2 + 4x \\op{+ 4} = -c \\op{+ 4}", say: "$2^2 = 4$. Add 4 to both sides." }], m: "x^2 + 4x + 4 = 4 - c", say: "$-c + 4$ is written $4 - c$." },
          { step: 3, ask: "Write the left side as a square.", type: "choice", answer: 0,
            options: [{ t: "$(x + 2)^2 = 4 - c$" }, { t: "$(x + 4)^2 = 4 - c$", fb: "The bracket holds half of 4." }],
            m: "(x + 2)^2 = 4 - c", say: "A perfect square." },
          { step: 4, ask: "Take square roots and get $x$ alone.", type: "choice", answer: 0,
            options: [{ t: "$x = -2 \\pm \\sqrt{4 - c}$" }, { t: "$x = -2 + \\sqrt{4 - c}$", fb: "A square root gives two cases: $\\pm$." }, { t: "$x = 2 \\pm \\sqrt{4 - c}$", fb: "Subtract 2 from both sides: $-2$." }],
            lead: [{ m: "x + 2 = \\pm\\sqrt{4 - c}", say: "Take square roots." }, { m: "x + 2 \\op{- 2} = \\pm\\sqrt{4 - c} \\op{- 2}", say: "Subtract 2 from both sides." }], m: "x = -2 \\pm \\sqrt{4 - c}", say: "One result for every value of $c$." }],
        why: "With $c = 3$ that gives $-2 \\pm 1$: $-1$ and $-3$. One derivation covers every $c$." },
      { type: "order", kicker: "On your own", prompt: "Put the derivation's moves in order.",
        items: ["Divide every term by $a$.", "Move the constant to the other side.", "Add the square of half the $x$-coefficient to both sides.", "Write the left side as a squared bracket.", "Take square roots, with $\\pm$.", "Isolate $x$."],
        skill: "Derive the formula", why: "Exactly the steps of completing the square." },
      { type: "learn", kicker: "A harder case",
        prompt: "With a general $a$ there is one extra move at the start: divide by $a$.$$ax^2 + bx + c = 0$$",
        scene: { type: "walk", how: HOW_9_8, rows: [
          { step: 1, m: "\\frac{ax^2}{\\op{a}} + \\frac{bx}{\\op{a}} + \\frac{c}{\\op{a}} = \\frac{0}{\\op{a}}", say: "Divide every term by $a$." },
          { step: 1, m: "x^2 + \\frac{b}{a}x + \\frac{c}{a} = 0", say: "Now the coefficient of $x^2$ is 1." },
          { step: 2, m: "x^2 + \\frac{b}{a}x = -\\frac{c}{a}", say: "Move the constant across: subtract $\\frac{c}{a}$ from both sides." },
          { step: 3, m: "\\left(\\frac{b}{2a}\\right)^2 = \\frac{b^2}{4a^2}", say: "Half of $\\frac{b}{a}$ is $\\frac{b}{2a}$. Its square." },
          { step: 3, m: "x^2 + \\frac{b}{a}x \\op{+ \\frac{b^2}{4a^2}} = -\\frac{c}{a} \\op{+ \\frac{b^2}{4a^2}}", say: "Add it to both sides." },
          { step: 3, m: "\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2}{4a^2} - \\frac{4ac}{4a^2}", say: "The left side is a square. On the right, write $\\frac{c}{a}$ over $4a^2$." },
          { step: 3, m: "\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}", say: "One denominator." },
          { step: 4, m: "x + \\frac{b}{2a} = \\pm\\frac{\\sqrt{b^2 - 4ac}}{2a}", say: "Take square roots: $\\sqrt{4a^2} = 2a$ underneath." },
          { step: 4, m: "x = -\\frac{b}{2a} \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a}", say: "Subtract $\\frac{b}{2a}$ from both sides." },
          { step: 4, m: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", say: "Over one denominator: the quadratic formula." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Why does the discriminant, $b^2 - 4ac$, decide the number of solutions?",
        options: [{ t: "It ends up under the square root: positive gives two roots, zero gives one, negative gives none." }, { t: "It is the larger of the two solutions.", fb: "It isn't a solution. It's the quantity under the root." }, { t: "It's the $y$-intercept.", fb: "That's $c$." }],
        answer: 0, skill: "Derive the formula", hints: ["Look at where it sits in the formula."], why: "Everything else in the formula is ordinary arithmetic. Only the square root can produce two values, one value, or none." },
      { type: "choice", kicker: "Find the error",
        prompt: "In the derivation, Kiran writes: $x^2 + bx + \\frac{b^2}{4} = -c$. What is wrong?",
        options: [{ t: "He added $\\frac{b^2}{4}$ to the left side only. The right side must be $\\frac{b^2}{4} - c$." },
                  { t: "He should have added $b^2$.", fb: "Half of $b$ is $\\frac{b}{2}$, and its square is $\\frac{b^2}{4}$. That part is right." },
                  { t: "Nothing. That is the next line.", fb: "An equation is a balance. What is added on the left must be added on the right." }],
        answer: 0, skill: "Derive the formula", hints: ["Step 3 says: add to **both** sides."],
        why: "Both sides: $x^2 + bx + \\frac{b^2}{4} = \\frac{b^2}{4} - c$." },
      { type: "numbers", kicker: "Use it", prompt: "Use the formula you derived for $a = 1$, $x = \\frac{-b \\pm \\sqrt{b^2 - 4c}}{2}$, on the warm-up equation $x^2 + 6x + 5 = 0$.", answer: [-1, -5], skill: "Derive the formula", placeholder: "e.g. 4, -1",
        hints: ["$b = 6$ and $c = 5$.", "$\\frac{-6 \\pm \\sqrt{36 - 20}}{2} = \\frac{-6 \\pm 4}{2}$."], why: "$\\frac{-6 + 4}{2} = -1$ and $\\frac{-6 - 4}{2} = -5$. The same answers as completing the square, as they must be." }
    ]
  });

  /* ============================================ 9.9 · Different forms */
  var HOW_9_9 = [["Vertex form", "$a(x - h)^2 + k$ shows the vertex $(h, k)$."], ["Factored", "$a(x - m)(x - n)$ shows the zeros $m$ and $n$."], ["Standard", "$ax^2 + bx + c$ shows the $y$-intercept $c$."], ["Choose", "Pick the form that shows what you need. Multiply out to reach standard form."]];
  LESSONS.push({
    title: "Writing quadratics in different forms",
    blurb: "Book 9.9 · Standard, factored and vertex form are one function in three outfits.",
    mins: 12, v: 3,
    steps: [
      { type: "pair", kicker: "Warm up",
        prompt: "What is the vertex of $y = (x - 3)^2 + 2$?",
        answer: [3, 2], skill: "Convert between forms",
        near: [{ v: [-3, 2], fb: "$(x - 3)^2$ is 0 when $x = 3$." }],
        hints: ["Vertex form: $(h, k)$."], why: "$h = 3$ and $k = 2$." },
      { type: "learn", kicker: "The idea",
        prompt: "Standard, factored and vertex form are **one function** in three outfits. Each shows something different at a glance. Knowing all three lets you pick the one that answers your question.",
        scene: { type: "method", how: HOW_9_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one function written three ways.",
        scene: { type: "walk", how: HOW_9_9, rows: [
          { step: 1, m: "(x - 3)^2 - 4", say: "Vertex form shows the vertex: $(3, -4)$." },
          { step: 2, m: "(x - 1)(x - 5)", say: "Factored form shows the zeros: 1 and 5.", 
            ask: { prompt: "Which form shows the zeros at a glance?", answer: 0,
                   options: [{ t: "Factored form" }, { t: "Standard form", fb: "Standard form shows the $y$-intercept. The zeros are hidden in it." }] } },
          { step: 3, m: "x^2 - 6x + 5", say: "Standard form shows the $y$-intercept: 5." },
          { step: 4, m: "(x - 3)(x - 3) - 4", say: "Are they really the same? Multiply the vertex form out." },
          { step: 4, m: "x^2 - 3x - 3x + 9 - 4", say: "Four products, then the $-4$." },
          { step: 4, m: "x^2 - 6x + 5", say: "$-3x - 3x = -6x$ and $9 - 4 = 5$. The same standard form: one function." }] },
        gate: true,
        then: "Three forms, one function. Each shows a different feature." },
      { type: "guided", kicker: "Together",
        prompt: "Now you take a function from vertex form to standard form.$$(x - 3)^2 + 2$$",
        how: HOW_9_9, skill: "Convert between forms",
        steps: [
          { step: 1, ask: "What does this form show at a glance?", type: "choice", answer: 0,
            options: [{ t: "The vertex, $(3, 2)$" }, { t: "The zeros", fb: "Zeros are shown by factored form. This is vertex form." }],
            m: "(x - 3)^2 + 2", say: "Vertex form." },
          { step: 4, ask: "Expand $(x - 3)^2$.", type: "choice", answer: 0,
            options: [{ t: "$x^2 - 6x + 9$" }, { t: "$x^2 + 9$", fb: "The middle term, $-6x$, is missing." }, { t: "$x^2 - 9$", fb: "$(-3)(-3) = +9$, and there is a middle term too." }],
            lead: [{ m: "(x - 3)(x - 3) + 2", say: "A square is the bracket times itself." }, { m: "x^2 - 3x - 3x + 9 + 2", say: "Four products, then the $+ 2$." }], m: "x^2 - 6x + 9 + 2", say: "$-3x - 3x = -6x$." },
          { step: 3, ask: "So what is the standard form?", type: "choice", answer: 0,
            options: [{ t: "$x^2 - 6x + 11$" }, { t: "$x^2 - 6x + 9$", fb: "Add the 2 that was outside the bracket." }],
            m: "x^2 - 6x + 11", say: "$9 + 2 = 11$." },
          { step: 3, ask: "What is its $y$-intercept?", type: "num", answer: 11, hint: "In standard form, it is $c$.", m: "c = 11", say: "Standard form shows it." }],
        why: "Same function, new outfit. Now go back the other way." },
      { type: "pair", kicker: "On your own", prompt: "What is the vertex of $y = x^2 - 6x + 11$? (You just saw it in another form.)", answer: [3, 2], skill: "Convert between forms",
        near: [{ v: [-3, 2], fb: "$(x - 3)$ is zero at $x = +3$." }], hints: ["It equals $(x - 3)^2 + 2$."], why: "From vertex form: $(3, 2)$. Standard form hides it." },
      { type: "slots", prompt: "These are the **same function**. Match each form to what it shows at a glance.",
        slots: [{ id: "a", label: "The $y$-intercept, 8" }, { id: "b", label: "The zeros, 2 and 4" }, { id: "c", label: "The vertex, $(3, -1)$" }],
        cards: [{ t: "$x^2 - 6x + 8$", slot: "a", fb: "Standard form ends in $c$, the $y$-intercept." }, { t: "$(x - 2)(x - 4)$", slot: "b", fb: "Factored form shows where each factor is zero." }, { t: "$(x - 3)^2 - 1$", slot: "c", fb: "Vertex form shows $(h, k)$." }],
        skill: "Convert between forms", hints: ["Standard: $c$. Factored: zeros. Vertex: $(h, k)$."], why: "Choose the form that shows what you need." },
      { type: "learn", kicker: "A harder case",
        prompt: "A vertex alone does not fix a parabola. Find the one with vertex $(2, 1)$ that passes through $(3, 5)$.",
        scene: { type: "walk", how: HOW_9_9, rows: [
          { step: 1, m: "y = a(x - 2)^2 + 1", say: "The vertex gives $h$ and $k$. $a$ is still unknown." },
          { step: 4, m: "\\op{5} = a(\\op{3} - 2)^2 + 1", say: "Put the point $(3, 5)$ in." },
          { step: 4, m: "5 = a(1)^2 + 1", say: "$3 - 2 = 1$." },
          { step: 4, m: "5 = a + 1", say: "$1^2 = 1$, and $a \\cdot 1 = a$." },
          { step: 4, m: "5 \\op{- 1} = a + 1 \\op{- 1}", say: "Subtract 1 from both sides." },
          { step: 4, m: "4 = a", say: "$5 - 1 = 4$." },
          { step: 4, m: "y = 4(x - 2)^2 + 1", say: "The parabola." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A parabola has vertex $(1, 2)$ and passes through $(2, 5)$. In $y = a(x - 1)^2 + 2$, what is $a$?", pre: "$a =$", answer: 3, skill: "Convert between forms",
        near: [{ v: 5, fb: "$5 = a(1)^2 + 2$: subtract the 2." }], hints: ["Put in $x = 2$, $y = 5$: $5 = a(2 - 1)^2 + 2$."], why: "$5 = a + 2$, so $a = 3$: $y = 3(x - 1)^2 + 2$." },
      { type: "choice", prompt: "You need to know where a parabola crosses the $x$-axis. Which form is most useful?",
        options: [{ t: "Factored form" }, { t: "Standard form", fb: "Standard form shows the $y$-intercept. The $x$-intercepts are hidden." }, { t: "Vertex form", fb: "Vertex form shows the turning point. You'd still have to solve for the zeros." }],
        answer: 0, keep: true, skill: "Convert between forms", hints: ["Which form shows the zeros?"], why: "Each factor is zero at one $x$-intercept." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran writes $(x - 3)^2 + 2$ in standard form as $x^2 + 11$. What is wrong?",
        options: [{ t: "$(x - 3)^2$ has a middle term: $x^2 - 6x + 9$. The standard form is $x^2 - 6x + 11$." },
                  { t: "It should be $x^2 - 7$.", fb: "$(-3)^2$ is $+9$, and $9 + 2 = 11$. The number is right. A term is missing." },
                  { t: "Nothing. $9 + 2 = 11$.", fb: "The number is right, but squaring a bracket makes four products." }],
        answer: 0, skill: "Convert between forms", hints: ["Expand $(x - 3)(x - 3)$."],
        why: "$(x - 3)^2 = x^2 - 6x + 9$. Do not lose the $-6x$." },
      { type: "expr", kicker: "Use it", prompt: "Write the equation, in vertex form, of the parabola with $a = 1$ and vertex $(-2, 1)$: $y = \\;?$", answer: "(x+2)^2+1", shown: "(x + 2)^2 + 1", skill: "Convert between forms", keys: KEYS_Q,
        near: [{ v: "(x-2)^2+1", fb: "That has its vertex at $x = +2$." }], hints: ["$y = (x - h)^2 + k$ with $h = -2$, $k = 1$."], why: "$(x - (-2))^2 + 1 = (x + 2)^2 + 1$." }
    ]
  });

  /* ============================================ 9.10 · Into vertex form */
  var HOW_9_10 = [["Half", "Take half of the $x$-coefficient, and square it."], ["Add-subtract", "Add that number **and** subtract it, so the value does not change."], ["Square", "Write the first three terms as a squared bracket."], ["Tidy", "Combine the numbers that are left."]];
  LESSONS.push({
    title: "Rewriting quadratic expressions in vertex form",
    blurb: "Book 9.10 · Complete the square inside an expression: add what's missing, and take it away again.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "Complete the square: $x^2 + 6x + \\square$. Which number goes in the box?",
        answer: 9, skill: "Write in vertex form",
        near: [{ v: 36, fb: "Halve first, then square: half of 6 is 3." }, { v: 3, fb: "3 is the half. Now square it." }],
        hints: ["Half of 6, squared."], why: "Half of 6 is 3, and $3^2 = 9$." },
      { type: "learn", kicker: "The idea",
        prompt: "To put an expression into vertex form, complete the square inside it. An equation has two sides to add to. An expression has only one, so you **add and subtract** the same number. Its value stays the same.",
        scene: { type: "method", how: HOW_9_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an expression put into vertex form.$$x^2 + 6x + 5$$",
        scene: { type: "walk", how: HOW_9_10, rows: [
          { step: 1, m: "\\frac{6}{2} = 3", say: "Half of the coefficient of $x$.",
            fig: L.boxFig({ side: ["x", "3"], top: ["x", "3"], cells: [["x^2", "3x"], ["3x", "9"]], lit: [1, 1], cap: "$x^2 + 6x$ needs a corner of 9 to be a square.", alt: "A square box. Inside: x squared, 3x, 3x, and 9 in the corner." }) },
          { step: 1, m: "3^2 = 9", say: "Squared: the number that completes the square." },
          { step: 2, m: "x^2 + 6x \\op{+ 9 - 9} + 5", say: "Add 9 and take it away again. Nothing has changed.", 
            ask: { prompt: "Why subtract 9 as well as adding it?", answer: 0,
                   options: [{ t: "So that the expression keeps its value" }, { t: "To make the numbers smaller", fb: "Adding 9 alone would change the expression. Taking it away again keeps it equal." }] } },
          { step: 3, m: "(x^2 + 6x + 9) - 9 + 5", say: "The first three terms are a perfect square." },
          { step: 3, m: "(x + 3)^2 - 9 + 5", say: "Written as a squared bracket." },
          { step: 4, m: "(x + 3)^2 - 4", say: "$-9 + 5 = -4$. Vertex form. The vertex is $(-3, -4)$." }] },
        gate: true,
        then: "Add and subtract the same number: the expression looks different and is worth the same." },
      { type: "guided", kicker: "Together",
        prompt: "Now you put one into vertex form.$$x^2 + 8x + 10$$",
        how: HOW_9_10, skill: "Write in vertex form",
        steps: [
          { step: 1, ask: "What is half of 8, squared?", type: "num", answer: 16, near: [{ v: 4, fb: "4 is the half. Now square it." }, { v: 64, fb: "Halve first, then square." }], hint: "$4^2$.",
            m: "\\left(\\frac{8}{2}\\right)^2 = 16", say: "The number to add and subtract." },
          { step: 2, ask: "Add and subtract 16.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 8x + 16 - 16 + 10$" }, { t: "$x^2 + 8x + 16 + 10$", fb: "That adds 16 without taking it away again, which changes the value." }],
            m: "x^2 + 8x \\op{+ 16 - 16} + 10", say: "The value is unchanged." },
          { step: 3, ask: "Write the first three terms as a square.", type: "choice", answer: 0,
            options: [{ t: "$(x + 4)^2 - 16 + 10$" }, { t: "$(x + 8)^2 - 16 + 10$", fb: "The bracket holds half of 8." }],
            m: "(x + 4)^2 - 16 + 10", say: "A perfect square, plus what is left." },
          { step: 4, ask: "Combine: what is $-16 + 10$?", type: "num", answer: -6, near: [{ v: 6, fb: "16 is the larger, and it is negative." }, { v: -26, fb: "$-16 + 10$, not $-16 - 10$." }], hint: "$10 - 16$.",
            m: "(x + 4)^2 - 6", say: "Vertex form. The vertex is $(-4, -6)$." }],
        why: "Half, add and subtract, square, tidy. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "$x^2 - 4x + 7 = (x - 2)^2 + \\square$.", answer: 3, skill: "Write in vertex form",
        near: [{ v: 11, fb: "$(x - 2)^2$ contains $+4$. Subtract it: $7 - 4$." }, { v: 7, fb: "The square already brings a $+4$ with it." }], hints: ["$(x - 2)^2 = x^2 - 4x + 4$."], why: "$7 - 4 = 3$: $(x - 2)^2 + 3$." },
      { type: "pair", prompt: "Find the vertex of $y = x^2 - 10x + 21$ by rewriting it in vertex form.", answer: [5, -4], skill: "Write in vertex form",
        near: [{ v: [-5, -4], fb: "$(x - 5)^2$ is zero at $x = +5$." }, { v: [5, 21], fb: "$(x - 5)^2$ contains $+25$: $21 - 25 = -4$." }], hints: ["Half of $-10$ is $-5$: $(x - 5)^2 = x^2 - 10x + 25$.", "$21 - 25$."], why: "$(x - 5)^2 - 4$: the vertex is $(5, -4)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Vertex form solves equations too.$$x^2 - 6x + 5 = 0$$",
        scene: { type: "walk", how: HOW_9_10, rows: [
          { step: 1, m: "\\left(\\frac{-6}{2}\\right)^2 = 9", say: "Half of $-6$, squared." },
          { step: 2, m: "x^2 - 6x \\op{+ 9 - 9} + 5 = 0", say: "Add and subtract 9." },
          { step: 3, m: "(x - 3)^2 - 9 + 5 = 0", say: "The first three terms are a perfect square." },
          { step: 4, m: "(x - 3)^2 - 4 = 0", say: "$-9 + 5 = -4$. Vertex form, set equal to 0." },
          { step: 4, m: "(x - 3)^2 - 4 \\op{+ 4} = 0 \\op{+ 4}", say: "Add 4 to both sides." },
          { step: 4, m: "(x - 3)^2 = 4", say: "The square is alone." },
          { step: 4, m: "x - 3 = \\pm 2", say: "Take square roots." },
          { step: 4, m: "x - 3 \\op{+ 3} = 2 \\op{+ 3}", say: "First case: add 3 to both sides." },
          { step: 4, m: "x = 5", say: "$2 + 3 = 5$." },
          { step: 4, m: "x - 3 \\op{+ 3} = -2 \\op{+ 3}", say: "Second case." },
          { step: 4, m: "x = 1", say: "$-2 + 3 = 1$." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Vertex form solves equations too. Solve $(x - 5)^2 - 4 = 0$.", answer: [7, 3], skill: "Write in vertex form", placeholder: "e.g. 6, 2",
        hints: ["$(x - 5)^2 = 4$."], why: "$x - 5 = \\pm 2$: $x = 7$ or $x = 3$. And indeed $x^2 - 10x + 21 = (x - 3)(x - 7)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran rewrites $x^2 + 6x + 5$ as $(x + 3)^2 + 5$. What is wrong?",
        options: [{ t: "He added 9 to make the square and never subtracted it. It should be $(x + 3)^2 - 4$." },
                  { t: "The bracket should be $(x + 6)$.", fb: "The bracket holds half of 6, which is 3. That part is right." },
                  { t: "Nothing. The two are equal.", fb: "Test $x = 0$: the first gives 5, and his gives $9 + 5 = 14$." }],
        answer: 0, skill: "Write in vertex form", hints: ["Test both expressions with $x = 0$."],
        why: "$(x + 3)^2$ brings in an extra 9. Take it away again: $(x + 3)^2 - 9 + 5 = (x + 3)^2 - 4$." },
      { type: "choice", kicker: "Use it", prompt: "Which is $x^2 + 2x - 8$ in vertex form?",
        options: [{ t: "$(x + 1)^2 - 9$" }, { t: "$(x + 1)^2 - 8$", fb: "$(x + 1)^2$ adds 1, so the constant must drop by 1: $-8 - 1$." }, { t: "$(x + 2)^2 - 12$", fb: "Half of 2 is 1, so the bracket is $(x + 1)$." }],
        answer: 0, skill: "Write in vertex form", hints: ["Half of 2 is 1. $(x + 1)^2 = x^2 + 2x + 1$."], why: "$x^2 + 2x + 1 - 1 - 8 = (x + 1)^2 - 9$. Vertex $(-1, -9)$." }
    ]
  });

  /* ============================================ 9.11 · Using vertex form */
  var HOW_9_11 = [["Vertex form", "Write the function as $a(x - h)^2 + k$."], ["Sign of a", "Negative $a$: the vertex is a maximum. Positive $a$: a minimum."], ["Read", "The extreme value is $k$. It happens at $x = h$."], ["Answer", "Say it in the words of the situation."]];
  LESSONS.push({
    title: "Using quadratic expressions in vertex form to solve problems",
    blurb: "Book 9.11 · The biggest profit, the lowest cost, the highest point: read it off the vertex.",
    mins: 12, v: 3,
    steps: [
      { type: "pair", kicker: "Warm up",
        prompt: "What is the vertex of $y = -(x - 30)^2 + 400$?",
        answer: [30, 400], skill: "Maximum and minimum",
        near: [{ v: [-30, 400], fb: "$(x - 30)^2$ is 0 when $x = 30$." }, { v: [400, 30], fb: "$h$ comes first, then $k$." }],
        hints: ["Vertex form: $(h, k)$. The minus in front does not move the vertex."], why: "$h = 30$ and $k = 400$." },
      { type: "learn", kicker: "Explore", prompt: "A stall's daily profit, in cents, depends on the price $x$ it charges: $P(x) = -(x - 30)^2 + 400$. Slide the price to find the **greatest profit**.",
        scene: { type: "plane", x: [0, 60], y: [0, 450], grid: 10, gridY: 50, labelEvery: 10, labelEveryY: 100, aspect: 0.8, axisLabels: ["price", "profit"], gate: true,
          params: { x: { v: 12, min: 10, max: 50, step: 2, label: "price $x$" } },
          fns: [{ f: function (x) { var v = -(x - 30) * (x - 30) + 400; return v >= 0 ? v : NaN; }, color: "green" }],
          marks: [{ x: function (P) { return P.x; }, y: function (P) { return -(P.x - 30) * (P.x - 30) + 400; }, color: "orange", r: 7 }],
          readout: function (st) { var x = st.params.x, v = -(x - 30) * (x - 30) + 400; return "$P(" + x + ") = -(" + x + " - 30)^2 + 400 = " + v + "$" + (x === 30 ? " ← the greatest" : ""); },
          goal: function (st) { return st.params.x === 30; } },
        gate: true,
        then: "At $x = 30$ the bracket is zero, so nothing is taken away from 400. Any other price subtracts something. Vertex form shows the maximum without any searching." },
      { type: "learn", kicker: "The idea",
        prompt: "The biggest profit, the lowest cost, the highest point: each is a **vertex**. In vertex form you can read it straight off. $(x - h)^2$ is never negative, so it can only take away from $k$, or only add to it.",
        scene: { type: "method", how: HOW_9_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "A ball's height after $t$ seconds is $h(t) = -5(t - 3)^2 + 50$ metres. Watch its greatest height read off.",
        scene: { type: "walk", how: HOW_9_11, rows: [
          { step: 1, m: "-5(t - 3)^2 + 50", say: "Already in vertex form." },
          { step: 2, m: "a = -5", say: "Negative: the parabola opens downward, so the vertex is a maximum.", 
            ask: { prompt: "$a = -5$. Is the vertex a maximum or a minimum?", answer: 0,
                   options: [{ t: "A maximum" }, { t: "A minimum", fb: "A negative $a$ makes the squared bracket take away from 50. So 50 is the most the height can be." }] } },
          { step: 3, m: "k = 50", say: "The extreme value: the number added at the end." },
          { step: 3, m: "h = 3", say: "Where it happens: the number subtracted from $t$." },
          { step: 4, m: "50 \\text{ m at } 3 \\text{ s}", say: "The ball's greatest height is 50 m, reached after 3 seconds." }] },
        gate: true,
        then: "Negative $a$: the maximum is $k$. Positive $a$: the minimum is $k$. Either way it happens at $x = h$." },
      { type: "guided", kicker: "Together",
        prompt: "The cost of running a machine for $x$ hours is $C(x) = (x - 4)^2 + 15$ dollars. Read off its best running time.",
        how: HOW_9_11, skill: "Maximum and minimum",
        steps: [
          { step: 1, ask: "Is $C(x)$ in vertex form?", type: "choice", answer: 0,
            options: [{ t: "Yes, with $h = 4$ and $k = 15$" }, { t: "No", fb: "It matches $a(x - h)^2 + k$ with $a = 1$." }],
            m: "(x - 4)^2 + 15", say: "Vertex form." },
          { step: 2, ask: "$a = 1$. Is the vertex a maximum or a minimum?", type: "choice", answer: 0,
            options: [{ t: "A minimum: the bracket can only add to 15" }, { t: "A maximum", fb: "A positive $a$ opens the parabola upward. The vertex is its lowest point." }],
            m: "a = 1", say: "Positive: a minimum." },
          { step: 3, ask: "What is the lowest cost, in dollars?", type: "num", answer: 15, near: [{ v: 4, fb: "4 is **when** the cost is lowest. The cost itself is $k$." }], hint: "The extreme value is $k$.",
            lead: [{ m: "k = 15", say: "The lowest value." }], m: "h = 4", say: "Where it happens." },
          { step: 4, ask: "Say it in the words of the situation.", type: "choice", answer: 0,
            options: [{ t: "The lowest cost is \\$15, when the machine runs for 4 hours" }, { t: "The lowest cost is \\$4, after 15 hours", fb: "$h = 4$ is the number of hours. $k = 15$ is the cost." }],
            m: "15 \\text{ dollars at } 4 \\text{ hours}", say: "The vertex, in context." }],
        why: "Vertex form, sign of $a$, read, answer. Now the stall's profit." },
      { type: "num", kicker: "On your own", prompt: "So what is the **greatest** profit the stall can make, in cents?", post: "cents", answer: 400, skill: "Maximum and minimum",
        near: [{ v: 30, fb: "30 is the *price* that gives the greatest profit. The profit itself is the other number." }], hints: ["$-(x - 30)^2$ is never positive. When is it zero?"], why: "$-(x - 30)^2$ is at most 0, so $P$ is at most 400, when $x = 30$." },
      { type: "num", prompt: "A ball's height is $h(t) = -16t^2 + 64t + 6$. In vertex form that is $-16(t - 2)^2 + 70$. What is its greatest height?", post: "ft", answer: 70, skill: "Maximum and minimum",
        near: [{ v: 6, fb: "6 ft is where it starts, at $t = 0$." }, { v: 2, fb: "2 is the time of the peak, in seconds." }], hints: ["Read $k$ from the vertex form."], why: "The vertex is $(2, 70)$: 70 ft, after 2 seconds." },
      { type: "learn", kicker: "A harder case",
        prompt: "What if the function comes in standard form? A shop's revenue is $R(x) = -x^2 + 8x$.",
        scene: { type: "walk", how: HOW_9_11, rows: [
          { step: 1, m: "-(x^2 - 8x)", say: "Take out the $-1$ first, so that $x^2$ is plain." },
          { step: 1, m: "\\left(\\frac{-8}{2}\\right)^2 = 16", say: "Half of $-8$, squared." },
          { step: 1, m: "-(x^2 - 8x \\op{+ 16 - 16})", say: "Complete the square inside the bracket: add and subtract 16." },
          { step: 1, m: "-((x - 4)^2 - 16)", say: "The first three terms are a perfect square." },
          { step: 1, m: "-(x - 4)^2 + 16", say: "The minus in front reaches both parts: the $-16$ inside becomes $+16$ outside." },
          { step: 2, m: "a = -1", say: "Negative: a maximum." },
          { step: 3, m: "k = 16", say: "The greatest revenue is 16." },
          { step: 3, m: "h = 4", say: "It happens when $x = 4$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "$R(x) = -x^2 + 12x$ is a shop's revenue. Completing the square gives $R(x) = -(x - 6)^2 + \\square$. What is the maximum revenue?", answer: 36, skill: "Maximum and minimum",
        near: [{ v: -36, fb: "$-(x - 6)^2 = -x^2 + 12x - 36$, so you must *add* 36 to get back to $-x^2 + 12x$." }, { v: 6, fb: "6 is where the maximum happens. Find the value there: $R(6)$." }],
        hints: ["$R(6) = -36 + 72$."], why: "$-(x - 6)^2 + 36$: the maximum is 36, at $x = 6$." },
      { type: "choice", prompt: "Two arcs: $f(x) = -(x - 1)^2 + 8$ and $g(x) = -2(x - 3)^2 + 9$. Which reaches higher?",
        options: [{ t: "$g$: its maximum is 9." }, { t: "$f$: its maximum is 8.", fb: "8 is less than 9." }, { t: "$g$, because $-2$ is steeper.", fb: "$a$ sets the width, not the height. Compare the $k$ values." }],
        answer: 0, skill: "Maximum and minimum", hints: ["Compare the two $k$ values."], why: "$f$ peaks at 8 and $g$ at 9. The height of the vertex is $k$, whatever $a$ and $h$ are." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $P(x) = -(x - 30)^2 + 400$, Kiran says: “The greatest profit is 30.” What is wrong?",
        options: [{ t: "30 is the price that gives the greatest profit. The profit itself is $k = 400$." },
                  { t: "The greatest profit is $-400$.", fb: "At $x = 30$ the bracket is 0, so $P = 400$." },
                  { t: "Nothing. The vertex is at 30.", fb: "The vertex is the point $(30, 400)$. Which of its numbers is the profit?" }],
        answer: 0, skill: "Maximum and minimum", hints: ["Step 3: the extreme **value** is $k$. It happens at $x = h$."],
        why: "$h = 30$ is where. $k = 400$ is how much." },
      { type: "num", kicker: "Use it",
        prompt: "A farmer fences a rectangle against a wall. Its area is $A(x) = -(x - 25)^2 + 625$ square metres, where $x$ is the length of one side. What is the **largest** area?",
        answer: 625, post: "m²", skill: "Maximum and minimum",
        near: [{ v: 25, fb: "25 is the side length that gives the largest area. The area itself is $k$." }],
        hints: ["$a$ is negative, so the vertex is a maximum. Read off $k$."], why: "The maximum is $k = 625$ m², when $x = 25$ m." }
    ]
  });

  /* ============================================ Project 9 */
  LESSONS.push({
    title: "Project: Using quadratic equations to model situations and solve problems",
    tag: "Project",
    blurb: "Book Project 9 · Forty metres of fence, one wall, and the biggest garden you can make.",
    mins: 10, v: 2,
    steps: [
      { type: "learn", kicker: "The brief",
        prompt: "A school has **40 m of fence** for a rectangular garden against a wall. The wall is one side, so the fence makes the other three: two sides of length $x$ and one of length $40 - 2x$." },
      { type: "expr", prompt: "Write the garden's area in terms of $x$.", answer: "x(40-2x)", shown: "x(40 - 2x)", skill: "Write a quadratic expression", keys: KEYS_Q,
        near: [{ v: "x(40-x)", fb: "Two sides of length $x$ use $2x$ of the fence, leaving $40 - 2x$." }], hints: ["Area = width × length = $x$ times $(40 - 2x)$."], why: "$A(x) = x(40 - 2x) = -2x^2 + 40x$." },
      { type: "num", prompt: "In vertex form, $A(x) = -2(x - 10)^2 + 200$. What is the largest possible area?", post: "m²", answer: 200, skill: "Maximum and minimum",
        near: [{ v: 10, fb: "10 m is the side length that gives the largest area." }], hints: ["Read $k$."], why: "200 m², when $x = 10$: the garden is 10 m by 20 m." },
      { type: "numbers", prompt: "The school only needs **150 m²**. Which values of $x$ give exactly that? Solve $-2x^2 + 40x = 150$.", answer: [5, 15], skill: "Solve by factoring", placeholder: "e.g. 4, 16",
        hints: ["Rearrange and divide by $-2$: $x^2 - 20x + 75 = 0$.", "$(x - 5)(x - 15) = 0$."], why: "$x = 5$ (a 5 by 30 garden) or $x = 15$ (a 15 by 10 garden). Both have area 150." },
      { type: "explain", kicker: "Make it yours",
        prompt: "Suppose you had **60 m** of fence instead. Write the area function, find the largest garden, and say which form of the quadratic you used and why.",
        placeholder: "e.g. A(x) = x(60 − 2x). Its zeros are 0 and 30, so…",
        model: "A(x) = x(60 − 2x) has zeros 0 and 30, so the vertex is at x = 15, where A = 15 × 30 = 450 m². A good answer explains the choice of form: factored form gives the zeros and, by symmetry, the vertex; or vertex form −2(x − 15)² + 450 shows the maximum directly." }
    ]
  });
  /* ================================================================ Skills */
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function bin(p) { return "(x " + signed(p) + ")"; }

  var SKILLS = [
    { id: "u9-complete", title: "Complete the square", lesson: 3,
      gen: function (R) {
        var n = R.nz(-9, 9), b = 2 * n;
        return { type: "num", prompt: "What number makes this a perfect square? $$x^2 " + signed(b) + "x + \\square$$", answer: n * n,
          near: near(n * n, [{ v: Math.abs(n), fb: "That's half of " + Math.abs(b) + ". Now square it." }, { v: b * b, fb: "Halve the coefficient first, then square." }, { v: -n * n, fb: "A square is always positive." }]),
          hints: ["Half of $" + b + "$ is $" + n + "$. Square it."], why: "$(" + n + ")^2 = " + n * n + "$: $x^2 " + signed(b) + "x + " + n * n + " = " + bin(n) + "^2$." };
      } },
    { id: "u9-square-eq", title: "Solve with a perfect square", lesson: 2,
      gen: function (R) {
        var n = R.nz(-7, 7), r = R.int(1, 9);
        return { type: "numbers", prompt: "Solve. $$" + quad(1, 2 * n, n * n) + " = " + r * r + "$$", answer: [-n + r, -n - r], placeholder: "e.g. 4, -6",
          hints: ["The left side is $" + bin(n) + "^2$.", "$x " + signed(n) + " = \\pm " + r + "$."], why: "$" + bin(n) + "^2 = " + r * r + "$, so $x = " + (-n + r) + "$ or $x = " + (-n - r) + "$." };
      } },
    { id: "u9-cts", title: "Solve by completing the square", lesson: 4,
      gen: function (R) {
        var n = R.nz(-6, 6), r = R.int(1, 7), b = 2 * n, c = n * n - r * r;
        if (c === 0) { r += 1; c = n * n - r * r; }
        return { type: "numbers", prompt: "Solve by completing the square. $$" + quad(1, b, c) + " = 0$$", answer: [-n + r, -n - r], placeholder: "e.g. 4, -6",
          hints: ["Move the constant: $" + poly([[1, "x^2"], [b, "x"]]) + " = " + -c + "$.", "Add $" + n * n + "$ to both sides: $" + bin(n) + "^2 = " + r * r + "$."],
          why: "$" + bin(n) + "^2 = " + r * r + "$, so $x " + signed(n) + " = \\pm " + r + "$: $x = " + (-n + r) + "$ or $x = " + (-n - r) + "$." };
      } },
    { id: "u9-exact", title: "Exact irrational solutions", lesson: 6,
      gen: function (R) {
        var n = R.nz(-6, 6), k = R.pick([2, 3, 5, 6, 7, 10, 11]), right = "$x = " + -n + " \\pm \\sqrt{" + k + "}$";
        return mc(R, { prompt: "Solve exactly. $$" + bin(n) + "^2 = " + k + "$$", right: right,
          wrong: [{ t: "$x = " + n + " \\pm \\sqrt{" + k + "}$", fb: "$x " + signed(n) + " = \\pm\\sqrt{" + k + "}$. To isolate $x$, " + (n > 0 ? "subtract " + n : "add " + -n) + "." }, { t: "$x = \\pm\\sqrt{" + (k + Math.abs(n)) + "}$", fb: "The $" + n + "$ isn't under the root. Take roots first, then move it." },
                  { t: "$x = " + -n + " + \\sqrt{" + k + "}$ only", fb: "A positive number has two square roots: use $\\pm$." }],
          hints: ["Take the square root of both sides, with $\\pm$."], why: "$x " + signed(n) + " = \\pm\\sqrt{" + k + "}$, so " + right + "." });
      } },
    { id: "u9-disc", title: "Find the discriminant", lesson: 8,
      gen: function (R) {
        var a = R.pick([1, 1, 2, 3]), b = R.nz(-8, 8), c = R.nz(-6, 6), d = b * b - 4 * a * c;
        return { type: "num", prompt: "Work out the discriminant, $b^2 - 4ac$, for $" + quad(a, b, c) + " = 0$.", answer: d,
          near: near(d, [{ v: -b * b - 4 * a * c, fb: "$(" + b + ")^2$ is positive." }, { v: b * b + 4 * a * c, fb: "Check the sign of $4ac$: $4(" + a + ")(" + c + ") = " + 4 * a * c + "$, and it is subtracted." }]),
          hints: ["$a = " + a + "$, $b = " + b + "$, $c = " + c + "$."], why: "$(" + b + ")^2 - 4(" + a + ")(" + c + ") = " + b * b + " " + signed(-4 * a * c) + " = " + d + "$." };
      } },
    { id: "u9-count", title: "How many solutions, from the discriminant", lesson: 8,
      gen: function (R) {
        var kind = R.int(0, 2), a = 1, b, c, names = ["Two", "One", "None"];
        if (kind === 0) { b = R.nz(-8, 8); c = R.int(-9, Math.floor(b * b / 4) - 1); if (c === 0) c = -1; }
        else if (kind === 1) { var n = R.nz(-6, 6); b = 2 * n; c = n * n; }
        else { b = R.int(-5, 5); c = Math.floor(b * b / 4) + R.int(1, 6); }
        var d = b * b - 4 * a * c;
        var why = "$b^2 - 4ac = " + d + "$, which is " + (d > 0 ? "positive: two solutions." : d === 0 ? "zero: one solution." : "negative: no real solutions.");
        return mc(R, { prompt: "How many real solutions does $" + quad(a, b, c) + " = 0$ have?", right: names[kind], wrong: names.filter(function (x, i) { return i !== kind; }).map(function (x) { return { t: x, fb: why }; }), keep: true,
          hints: ["Work out $b^2 - 4ac$ and look at its sign."], why: why });
      } },
    { id: "u9-formula", title: "Use the quadratic formula", lesson: 7,
      gen: function (R) {
        var a = R.pick([1, 2, 2, 3]), p = R.pick([1, -1, 3, -3, 5].filter(function (v) { return a === 1 || v % a !== 0; })), q = R.nz(-5, 5), b = a * q + p, c = p * q, d = b * b - 4 * a * c, s = Math.round(Math.sqrt(d));
        return { type: "numbers", prompt: "Solve with the quadratic formula. $$" + quad(a, b, c) + " = 0$$", answer: [-p / a, -q].filter(function (v, i, arr) { return arr.indexOf(v) === i; }), shown: -p / a === -q ? String(-q) : L.fracText(-p, a) + ", " + -q, placeholder: "e.g. 1/2, -3",
          hints: ["$a = " + a + "$, $b = " + b + "$, $c = " + c + "$. The discriminant is $" + d + "$.", "$x = \\frac{" + -b + " \\pm " + s + "}{" + 2 * a + "}$."],
          why: "$x = \\frac{" + -b + " \\pm \\sqrt{" + d + "}}{" + 2 * a + "} = \\frac{" + -b + " \\pm " + s + "}{" + 2 * a + "}$: $x = " + frac(-b + s, 2 * a) + "$ or $x = " + frac(-b - s, 2 * a) + "$." };
      } },
    { id: "u9-to-vertex", title: "Write in vertex form", lesson: 11,
      gen: function (R) {
        var n = R.nz(-7, 7), k = R.int(-9, 9), b = 2 * n, c = n * n + k;
        return { type: "num", prompt: "Complete the square. $$" + quad(1, b, c) + " = " + bin(n) + "^2 + \\square$$ What goes in the box?", answer: k,
          near: near(k, [{ v: c, fb: "$" + bin(n) + "^2$ already contains $+" + n * n + "$. Take it off: $" + c + " - " + n * n + "$." }, { v: c + n * n, fb: "Subtract the $" + n * n + "$ you added, don't add it again." }]),
          hints: ["$" + bin(n) + "^2 = " + quad(1, b, n * n) + "$."], why: "$" + c + " - " + n * n + " = " + k + "$." };
      } },
    { id: "u9-vertex", title: "Find the vertex by completing the square", lesson: 11,
      gen: function (R) {
        var h = R.nz(-7, 7), k = R.int(-9, 9), b = -2 * h, c = h * h + k;
        return { type: "pair", prompt: "Find the vertex of $y = " + quad(1, b, c) + "$.", answer: [h, k], near: [{ v: [-h, k], fb: "$" + bin(-h) + "^2$ is zero at $x = " + h + "$." }, { v: [h, c], fb: "The square contains $+" + h * h + "$: the constant left over is $" + c + " - " + h * h + "$." }],
          hints: ["Half of $" + b + "$ is $" + -h + "$: write $" + bin(-h) + "^2$.", "Then $" + c + " - " + h * h + "$."], why: "$" + quad(1, b, c) + " = " + bin(-h) + "^2 " + signed(k) + "$: vertex $(" + h + ", " + k + ")$." };
      } },
    { id: "u9-maxmin", title: "Maximum or minimum value", lesson: 12,
      gen: function (R) {
        var a = R.pick([-16, -5, -2, -1, 1, 2, 3]), h = R.int(1, 9), k = R.int(5, 90), max = a < 0, ask = R.chance(0.5);
        var S = max ? R.pick(["A ball's height in feet after $x$ seconds", "A stall's profit in dollars at a price of $x$ dollars"]) : R.pick(["The cost in dollars of making $x$ items", "The temperature in a cave, in °C, $x$ hours after midnight"]);
        return { type: "num", prompt: S + " is $f(x) = " + (a === 1 ? "" : a === -1 ? "-" : a) + "(x - " + h + ")^2 + " + k + "$. " + (ask ? "What is its **" + (max ? "greatest" : "least") + " value**?" : "At what $x$ is it " + (max ? "greatest" : "least") + "?"), answer: ask ? k : h,
          near: near(ask ? k : h, [{ v: ask ? h : k, fb: ask ? "That's *where* it happens. The value is the other number in the vertex." : "That's the value. The question asks where it happens." }]),
          hints: ["The vertex is $(h, k)$."], why: "The vertex is $(" + h + ", " + k + ")$, and since $a$ is " + (max ? "negative it is a maximum." : "positive it is a minimum.") };
      } }
  ];
  L.unit("alg", 9, {
    title: "More quadratic equations",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 6, blurb: "Perfect squares, completing the square, and exact irrational solutions.",
        skills: ["u9-square-eq", "u9-complete", "u9-cts", "u9-exact"], per: 2 },
      { title: "Quiz 2", after: 9, blurb: "The quadratic formula and the discriminant.",
        skills: ["u9-formula", "u9-disc", "u9-count"], per: 2 },
      { title: "Quiz 3", after: 12, blurb: "Vertex form by completing the square, and maximum and minimum values.",
        skills: ["u9-to-vertex", "u9-vertex", "u9-maxmin"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg:9", {
    2: { name: "Perfect square", frame: "$(x + n)^2 = x^2 + 2nx + n^2$: in a perfect square, the $x$-coefficient is [[twice]] $n$ and the constant is $n$ [[squared]].",
         chips: ["half", "doubled"] },
    3: { name: "Completing the square", frame: "To complete the square for $x^2 + bx$, take [[half]] of $b$, [[square]] it, and add it to [[both sides]].",
         chips: ["double", "one side"], fb: { "one side": "In an equation, whatever you add must go on both sides." } },
    4: { name: "The method", at: 2, frame: "Move the [[constant]], complete the square, write the left side as a [[squared bracket]], then take square roots with [[$\\pm$]].",
         chips: ["$+$", "sum"] },
    5: { name: "Choosing a method", at: 3, frame: "If $x^2$ has a coefficient, [[divide]] it out first. Completing the square works [[every]] time; factoring is a shortcut when the expression [[factors]].",
         chips: ["multiply", "never"] },
    6: { name: "Irrational solutions", frame: "$\\sqrt{7}$ is [[irrational]]: its decimal never ends or repeats, so an exact answer keeps the [[root]], like $x = 2 \\pm \\sqrt{5}$.",
         chips: ["rational", "decimal"] },
    7: { name: "The quadratic formula", frame: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$It solves [[any]] equation $ax^2 + bx + c = 0$. Read off $a$, $b$ and $c$ with their [[signs]]; the $\\pm$ gives [[two]] solutions.",
         chips: ["some", "three"] },
    8: { name: "The discriminant", frame: "The [[discriminant]], $b^2 - 4ac$, counts the real solutions: positive gives [[two]], zero gives one, negative gives [[none]].",
         chips: ["one", "coefficient"] },
    9: { name: "Where the formula comes from", frame: "The quadratic formula is [[completing the square]], done once with letters. The $\\pm$ comes from taking the [[square root]].",
         chips: ["factoring", "dividing"] },
    10: { name: "Three forms", at: 3, frame: "Standard form shows the [[$y$-intercept]], factored form the [[zeros]], and vertex form the [[vertex]].",
          chips: ["slope"] },
    11: { name: "Into vertex form", frame: "To rewrite an expression in vertex form, [[add and subtract]] the number that completes the square, so its value doesn't [[change]].",
          chips: ["multiply", "grow"] },
    12: { name: "Maximum and minimum", frame: "In $y = a(x - h)^2 + k$, a negative $a$ makes $k$ the [[maximum]]; a positive $a$ makes it the [[minimum]]. It happens at $x =$ [[$h$]].",
          chips: ["$k$", "average"] }
  });
})();
