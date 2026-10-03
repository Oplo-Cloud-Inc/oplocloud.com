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
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"], ["$(\;)^2$", "^2"]], hints: ["$25 = 5^2$, and $10x = 2 \\cdot 5 \\cdot x$."], why: "$(x + 5)^2$." },
      { type: "expr", prompt: "Factor $x^2 - 8x + 16$.", answer: "(x-4)^2", shown: "(x - 4)^2", form: "factored", skill: "Factor perfect squares",
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"], ["$(\;)^2$", "^2"]], near: [{ v: "(x+4)^2", fb: "That gives $+8x$. The middle term is negative." }], hints: ["$16 = 4^2$. Mind the sign."], why: "$(x - 4)^2$." },
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
  LESSONS.push({
    title: "What are perfect squares?",
    blurb: "Book 9.1 · An equation is easy when one side is something squared.",
    mins: 7, v: 2,
    steps: [
      { type: "numbers", kicker: "Try it", prompt: "Solve $(x + 3)^2 = 25$.", answer: [2, -8], skill: "Solve with a perfect square", placeholder: "e.g. 4, -6",
        near: [], hints: ["The bracket is 5 or $-5$.", "$x + 3 = 5$, or $x + 3 = -5$."], why: "$x = 2$ or $x = -8$. Easy, because the left side is a square." },
      { type: "choice", prompt: "Now solve $x^2 + 6x + 9 = 25$. What is the quickest first step?",
        options: [{ t: "Notice that $x^2 + 6x + 9$ is $(x + 3)^2$." }, { t: "Divide both sides by $x$.", fb: "That doesn't isolate $x$, and it could lose a solution." }, { t: "Take the square root of each term.", fb: "$\\sqrt{x^2 + 6x + 9}$ is not $x + \\sqrt{6x} + 3$. Roots don't split over a sum." }],
        answer: 0, skill: "Solve with a perfect square", hints: ["Multiply out $(x + 3)^2$."], why: "$(x + 3)^2 = x^2 + 6x + 9$. It's the same equation as before, in disguise: $x = 2$ or $x = -8$." },
      { type: "learn", kicker: "Name it",
        prompt: "An expression like $x^2 + 6x + 9$ is a **perfect square**: it is something multiplied by itself.$$(x + n)^2 = x^2 + 2nx + n^2$$The $x$-coefficient is **twice** $n$. The constant is $n$ **squared**." },
      { type: "sort", prompt: "Perfect square, or not?",
        bins: ["Perfect square", "Not"],
        cards: [{ t: "$x^2 + 10x + 25$", bin: 0, fb: "$n = 5$: twice 5 is 10, and $5^2 = 25$." }, { t: "$x^2 + 10x + 20$", bin: 1, fb: "Half of 10 is 5, and $5^2$ is 25, not 20." }, { t: "$x^2 - 8x + 16$", bin: 0, fb: "$n = -4$: $(x - 4)^2$." },
                { t: "$x^2 + 4x + 16$", bin: 1, fb: "Half of 4 is 2, and $2^2 = 4$, not 16." }, { t: "$x^2 + 2x + 1$", bin: 0, fb: "$(x + 1)^2$." }],
        skill: "Recognise a perfect square", hints: ["Halve the $x$-coefficient and square it. Do you get the constant?"], why: "Half the middle coefficient, squared, must equal the last term." },
      { type: "num", kicker: "Vary it", prompt: "What number makes $x^2 + 10x + \\square$ a perfect square?", answer: 25, skill: "Recognise a perfect square",
        near: [{ v: 5, fb: "5 is half of 10. Now square it." }, { v: 100, fb: "Halve the 10 first, then square." }, { v: 20, fb: "It isn't double. Halve 10, then square." }], hints: ["Half of 10, squared."], why: "$\\left(\\frac{10}{2}\\right)^2 = 25$: $x^2 + 10x + 25 = (x + 5)^2$." },
      { type: "numbers", kicker: "Use it", prompt: "Solve $x^2 + 10x + 25 = 49$.", answer: [2, -12], skill: "Solve with a perfect square", placeholder: "e.g. 4, -6",
        hints: ["The left side is $(x + 5)^2$.", "$x + 5 = \\pm 7$."], why: "$x + 5 = 7$ gives 2. $x + 5 = -7$ gives $-12$." }
    ]
  });

  /* ============================================ 9.2 · Completing the square, part 1 */
  LESSONS.push({
    title: "Completing the square, part 1",
    blurb: "Book 9.2 · If the expression isn't a perfect square, add what's missing.",
    mins: 8, v: 2,
    steps: [
      { type: "learn", kicker: "Try it", prompt: "Here is $x^2 + 6x$ in tiles, arranged as nearly a square. **Add unit tiles until the square is complete.** How many does it take?",
        scene: { type: "tiles", mode: "square", b: 6, gate: true }, gate: true,
        then: "Nine. The six $x$-tiles split into two strips of 3, leaving a $3 \\times 3$ corner. So $x^2 + 6x + 9 = (x + 3)^2$. This is **completing the square**." },
      { type: "learn", kicker: "Name it",
        prompt: "To complete the square for $x^2 + bx$: take **half** of $b$, and **square** it.$$x^2 + bx + \\left(\\frac{b}{2}\\right)^2 = \\left(x + \\frac{b}{2}\\right)^2$$" },
      { type: "num", prompt: "Complete the square: $x^2 + 8x + \\square$.", answer: 16, skill: "Complete the square",
        near: [{ v: 4, fb: "That's half of 8. Square it." }, { v: 64, fb: "Halve first, then square." }], hints: ["Half of 8 is 4."], why: "$4^2 = 16$: $x^2 + 8x + 16 = (x + 4)^2$." },
      { type: "num", prompt: "And $x^2 - 12x + \\square$?", answer: 36, skill: "Complete the square",
        near: [{ v: -36, fb: "A square is always positive: $(-6)^2 = 36$." }, { v: 6, fb: "Half of $-12$ is $-6$. Now square it." }], hints: ["Half of $-12$ is $-6$."], why: "$(-6)^2 = 36$: $x^2 - 12x + 36 = (x - 6)^2$." },
      { type: "learn", kicker: "See it", prompt: "Now use it to solve an equation that isn't a perfect square.",
        scene: { type: "walk", rows: [
          { m: "x^2 + 6x = 7", say: "The left side needs 9 to be a perfect square." },
          { m: "x^2 + 6x + 9 = 7 + 9", say: "Add 9 to **both** sides, to keep the equation balanced." },
          { m: "(x + 3)^2 = 16", say: "Write the left side as a square." },
          { m: "x + 3 = \\pm 4", say: "Take square roots: both of them." },
          { m: "x = 1 \\quad \\text{or} \\quad x = -7", say: "Solve each." }] },
        gate: true },
      { type: "numbers", kicker: "Use it", prompt: "Solve $x^2 + 4x = 12$ by completing the square.", answer: [2, -6], skill: "Solve by completing the square", placeholder: "e.g. 4, -6",
        hints: ["Half of 4 is 2, and $2^2 = 4$. Add 4 to both sides.", "$(x + 2)^2 = 16$."], why: "$(x + 2)^2 = 16$, so $x + 2 = \\pm 4$: $x = 2$ or $x = -6$." }
    ]
  });

  /* ============================================ 9.3 · Completing the square, part 2 */
  LESSONS.push({
    title: "Completing the square, part 2",
    blurb: "Book 9.3 · The whole method, including equations with a constant in the way and odd middle terms.",
    mins: 7, v: 2,
    steps: [
      { type: "numbers", kicker: "Try it", prompt: "Solve $x^2 + 8x + 7 = 0$ by completing the square.", answer: [-1, -7], skill: "Solve by completing the square", placeholder: "e.g. -2, -5",
        near: [], hints: ["Move the 7 first: $x^2 + 8x = -7$.", "Add 16 to both sides: $(x + 4)^2 = 9$."], why: "$(x + 4)^2 = 9$, so $x + 4 = \\pm 3$: $x = -1$ or $x = -7$." },
      { type: "order", kicker: "Name it", prompt: "Put the steps of completing the square in order.",
        items: ["Move the constant term to the other side.", "Add the square of half the $x$-coefficient to both sides.", "Write the left side as a squared bracket.", "Take the square root of both sides, with $\\pm$.", "Solve for $x$."],
        skill: "Solve by completing the square", why: "Clear the constant, complete the square, write it as a square, take roots, solve." },
      { type: "numbers", prompt: "Solve $x^2 - 2x - 8 = 0$.", answer: [4, -2], skill: "Solve by completing the square", placeholder: "e.g. 3, -5",
        hints: ["$x^2 - 2x = 8$. Half of $-2$ is $-1$.", "$(x - 1)^2 = 9$."], why: "$(x - 1)^2 = 9$, so $x - 1 = \\pm 3$: $x = 4$ or $x = -2$." },
      { type: "num", kicker: "Vary it", prompt: "An odd middle term gives a fraction. Complete the square: $x^2 + 3x + \\square$. (A fraction is fine.)", answer: 2.25, tol: 1e-9, shown: "9/4", skill: "Complete the square",
        near: [{ v: 1.5, fb: "That's half of 3. Square it." }, { v: 9, fb: "Halve the 3 first: $\\left(\\frac{3}{2}\\right)^2$." }], hints: ["Half of 3 is $\\frac{3}{2}$. Square it."], why: "$\\left(\\frac{3}{2}\\right)^2 = \\frac{9}{4}$: $x^2 + 3x + \\frac{9}{4} = \\left(x + \\frac{3}{2}\\right)^2$." },
      { type: "numbers", prompt: "Solve $x^2 + 3x = 4$. (Add $\\frac{9}{4}$ to both sides.)", answer: [1, -4], skill: "Solve by completing the square", placeholder: "e.g. 3, -5",
        hints: ["$\\left(x + \\frac{3}{2}\\right)^2 = 4 + \\frac{9}{4} = \\frac{25}{4}$.", "$x + \\frac{3}{2} = \\pm\\frac{5}{2}$."], why: "$x = -\\frac{3}{2} + \\frac{5}{2} = 1$ or $x = -\\frac{3}{2} - \\frac{5}{2} = -4$." },
      { type: "choice", kicker: "Use it", prompt: "Kiran adds 25 to the left side of $x^2 + 10x = 11$ and writes $(x + 5)^2 = 11$. What's the error?",
        options: [{ t: "He didn't add 25 to the right side as well." }, { t: "He should have added 100.", fb: "Half of 10 is 5, and $5^2 = 25$: that part is right." }, { t: "$(x + 5)^2$ is the wrong bracket.", fb: "$x^2 + 10x + 25$ is $(x + 5)^2$." }],
        answer: 0, skill: "Solve by completing the square", hints: ["An equation stays true only if both sides change the same way."], why: "$(x + 5)^2 = 11 + 25 = 36$, so $x + 5 = \\pm 6$: $x = 1$ or $x = -11$." }
    ]
  });

  /* ============================================ 9.4 · Completing the square, part 3 */
  LESSONS.push({
    title: "Completing the square, part 3",
    blurb: "Book 9.4 · When x² has a coefficient, divide it out first. Then choose the method that fits.",
    mins: 7, v: 2,
    steps: [
      { type: "expr", kicker: "Try it", prompt: "Multiply out $(2x + 3)^2$.", answer: "4x^2+12x+9", shown: "4x^2 + 12x + 9", form: "simplified", skill: "Perfect squares with a coefficient", keys: KEYS_Q,
        near: [{ v: "4x^2+9", fb: "A squared binomial has a middle term: twice $2x \\cdot 3$." }, { v: "2x^2+12x+9", fb: "$(2x)^2 = 4x^2$." }, { v: "4x^2+6x+9", fb: "The middle term appears twice: $6x + 6x$." }],
        hints: ["$(2x + 3)(2x + 3)$."], why: "$4x^2 + 6x + 6x + 9$." },
      { type: "choice", prompt: "So which of these is a perfect square?",
        options: [{ t: "$9x^2 + 30x + 25$" }, { t: "$9x^2 + 15x + 25$", fb: "$(3x + 5)^2$ has a middle term of $2 \\cdot 3x \\cdot 5 = 30x$." }, { t: "$9x^2 + 30x + 5$", fb: "The last term must be a square: $5^2 = 25$." }],
        answer: 0, skill: "Perfect squares with a coefficient", hints: ["First and last terms square. Middle: twice the product of their roots."], why: "$(3x + 5)^2 = 9x^2 + 30x + 25$." },
      { type: "learn", kicker: "See it", prompt: "To solve $2x^2 + 8x - 10 = 0$ by completing the square, deal with the 2 first.",
        scene: { type: "walk", rows: [
          { m: "2x^2 + 8x - 10 = 0", say: "The $x^2$ has a coefficient." },
          { m: "x^2 + 4x - 5 = 0", say: "Divide every term by 2." },
          { m: "x^2 + 4x = 5", say: "Move the constant." },
          { m: "(x + 2)^2 = 9", say: "Add 4 to both sides and write the square." },
          { m: "x = 1 \\quad \\text{or} \\quad x = -5", say: "$x + 2 = \\pm 3$." }] },
        gate: true },
      { type: "numbers", prompt: "Solve $3x^2 + 6x - 9 = 0$.", answer: [1, -3], skill: "Solve by completing the square", placeholder: "e.g. 3, -5",
        hints: ["Divide by 3: $x^2 + 2x - 3 = 0$.", "$(x + 1)^2 = 4$."], why: "$x^2 + 2x = 3$, $(x + 1)^2 = 4$, $x + 1 = \\pm 2$: $x = 1$ or $x = -3$." },
      { type: "sort", kicker: "Vary it", prompt: "Three methods now. Which looks easiest for each equation?",
        bins: ["Square roots", "Factoring", "Completing the square"],
        cards: [{ t: "$(x - 4)^2 = 49$", bin: 0, fb: "It's already a square equal to a number." }, { t: "$x^2 + 5x + 6 = 0$", bin: 1, fb: "2 and 3 multiply to 6 and add to 5." }, { t: "$x^2 + 6x - 2 = 0$", bin: 2, fb: "No whole numbers multiply to $-2$ and add to 6. Complete the square." }, { t: "$x^2 = 81$", bin: 0, fb: "$x = \\pm 9$." }],
        skill: "Choose a method", hints: ["Already a square? Factors easily? If neither, complete the square."], why: "Completing the square always works. The others are shortcuts when the equation allows." },
      { type: "numbers", kicker: "Use it", prompt: "Solve $2x^2 - 12x + 10 = 0$ by any method.", answer: [1, 5], skill: "Solve by completing the square", placeholder: "e.g. 2, 7",
        hints: ["Divide by 2: $x^2 - 6x + 5 = 0$."], why: "$x^2 - 6x + 5 = (x - 1)(x - 5)$, or $(x - 3)^2 = 4$. Either way: $x = 1$ or $x = 5$." }
    ]
  });

  /* ============================================ 9.5 · Irrational solutions */
  LESSONS.push({
    title: "Quadratic equations with irrational solutions",
    blurb: "Book 9.5 · When the number under the root isn't a perfect square, leave the root in the answer.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "Solve $x^2 = 7$. No whole number squares to 7. Between which two whole numbers is the positive solution?",
        options: [{ t: "2 and 3" }, { t: "3 and 4", fb: "$3^2 = 9$ is already more than 7." }, { t: "6 and 8", fb: "That's 7 itself. You want the number whose *square* is 7." }],
        answer: 0, skill: "Irrational solutions", hints: ["$2^2 = 4$ and $3^2 = 9$."], why: "$4 < 7 < 9$, so the solution is between 2 and 3: about 2.65." },
      { type: "learn", kicker: "Name it",
        prompt: "The exact solutions of $x^2 = 7$ are written $x = \\pm\\sqrt{7}$.<br><br>$\\sqrt{7}$ is **irrational**: it can't be written as a fraction, and its decimal, 2.6457…, never ends or repeats. A decimal can only approximate it. The root sign says it exactly." },
      { type: "sort", prompt: "Rational or irrational?",
        bins: ["Rational", "Irrational"],
        cards: [{ t: "$\\sqrt{16}$", bin: 0, fb: "It's 4." }, { t: "$\\sqrt{2}$", bin: 1, fb: "2 isn't a perfect square." }, { t: "$\\sqrt{\\frac{9}{4}}$", bin: 0, fb: "It's $\\frac{3}{2}$." }, { t: "$\\sqrt{50}$", bin: 1, fb: "50 isn't a perfect square." }, { t: "$0.75$", bin: 0, fb: "It's $\\frac{3}{4}$." }],
        skill: "Irrational solutions", hints: ["Is the number under the root a perfect square (or a fraction of perfect squares)?"], why: "The root of a perfect square is rational. Other square roots of whole numbers are irrational." },
      { type: "choice", kicker: "Vary it", prompt: "Solve $(x - 2)^2 = 5$ exactly.",
        options: [{ t: "$x = 2 \\pm \\sqrt{5}$" }, { t: "$x = \\pm\\sqrt{5} - 2$", fb: "$x - 2 = \\pm\\sqrt{5}$. *Add* 2 to both sides." }, { t: "$x = \\pm\\sqrt{7}$", fb: "The 2 isn't under the root. Take roots first, then add 2." }],
        answer: 0, skill: "Irrational solutions", hints: ["$x - 2 = \\pm\\sqrt{5}$."], why: "$x = 2 + \\sqrt{5}$ or $x = 2 - \\sqrt{5}$: about 4.24 and $-0.24$." },
      { type: "choice", prompt: "Solve $x^2 + 6x + 4 = 0$ by completing the square.",
        options: [{ t: "$x = -3 \\pm \\sqrt{5}$" }, { t: "$x = 3 \\pm \\sqrt{5}$", fb: "$(x + 3)^2 = 5$ gives $x + 3 = \\pm\\sqrt{5}$, so subtract 3." }, { t: "$x = -3 \\pm \\sqrt{13}$", fb: "$x^2 + 6x = -4$. Adding 9 gives $-4 + 9 = 5$ on the right." }],
        answer: 0, skill: "Irrational solutions", hints: ["$x^2 + 6x = -4$. Add 9 to both sides."], why: "$(x + 3)^2 = 5$, so $x = -3 \\pm \\sqrt{5}$. This equation can't be factored with whole numbers, but completing the square still solves it." },
      { type: "num", kicker: "Use it", prompt: "A square garden has an area of **10 m²**. To one decimal place, how long is its side?", post: "m", answer: 3.2, tol: 0.051, skill: "Irrational solutions",
        near: [{ v: 5, fb: "That's half of 10. The side times itself must make 10." }, { v: 2.5, fb: "That's a quarter of 10. You need $s \\times s = 10$." }],
        hints: ["$3^2 = 9$ and $3.2^2 = 10.24$."], why: "$\\sqrt{10} \\approx 3.16$, so about 3.2 m." }
    ]
  });

  /* ============================================ 9.6 · The quadratic formula */
  LESSONS.push({
    title: "The quadratic formula",
    blurb: "Book 9.6 · One formula that solves every quadratic equation.",
    mins: 8, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "Try to factor $x^2 + 5x + 3$. Which two whole numbers multiply to 3 and add to 5?",
        options: [{ t: "There aren't any." }, { t: "1 and 3", fb: "They multiply to 3, but add to 4." }, { t: "2 and 3", fb: "They add to 5, but multiply to 6." }],
        answer: 0, skill: "The quadratic formula", hints: ["The only whole-number pair multiplying to 3 is 1 and 3."], why: "This one doesn't factor. You could complete the square. Or use the result of completing the square done once and for all." },
      { type: "learn", kicker: "Name it",
        prompt: "The **quadratic formula** solves any equation $ax^2 + bx + c = 0$:" + FORMULA + "Read off $a$, $b$ and $c$, substitute, and simplify. The $\\pm$ gives the two solutions." },
      { type: "learn", kicker: "See it", prompt: "Here is the formula at work. Change $a$, $b$ and $c$. The orange dots are the formula's answers.",
        scene: { type: "plane", x: [-7, 7], y: [-9, 9], gate: true,
          params: { a: { v: 1, min: 1, max: 3, step: 1, label: "$a$" }, b: { v: -1, min: -6, max: 6, step: 1, label: "$b$" }, c: { v: -6, min: -6, max: 6, step: 1, label: "$c$" } },
          fns: [{ f: function (x, p) { return p.a * x * x + p.b * x + p.c; }, color: "blue" }],
          marks: function (st) { var p = st.params, d = p.b * p.b - 4 * p.a * p.c; if (d < 0) return []; var q = Math.sqrt(d); return [{ x: (-p.b + q) / (2 * p.a), y: 0, color: "orange", r: 6 }, { x: (-p.b - q) / (2 * p.a), y: 0, color: "orange", r: 6 }]; },
          readout: function (st) { var p = st.params, d = p.b * p.b - 4 * p.a * p.c, q = Math.sqrt(d);
            return "$" + poly([[p.a, "x^2"], [p.b, "x"], [p.c, ""]]) + " = 0$ &nbsp; $b^2 - 4ac = " + d + "$<br>" + (d < 0 ? "No real solutions: there is no square root of a negative number." : "$x = " + nm(r2((-p.b + q) / (2 * p.a))) + "$" + (d === 0 ? "" : " or $x = " + nm(r2((-p.b - q) / (2 * p.a))) + "$")); } },
        gate: true,
        then: "Whatever the coefficients, the formula lands exactly where the parabola crosses the axis. When $b^2 - 4ac$ goes negative, the parabola lifts clear of the axis and the solutions vanish." },
      { type: "slots", prompt: "For $2x^2 - 7x + 3 = 0$, match each letter to its value.",
        slots: [{ id: "a", label: "$a$" }, { id: "b", label: "$b$" }, { id: "c", label: "$c$" }],
        cards: [{ t: "$2$", slot: "a", fb: "$a$ is the coefficient of $x^2$." }, { t: "$-7$", slot: "b", fb: "$b$ is the coefficient of $x$, with its sign." }, { t: "$3$", slot: "c", fb: "$c$ is the constant." }, { t: "$7$" }],
        skill: "The quadratic formula", hints: ["Keep the signs with the numbers."], why: "$a = 2$, $b = -7$, $c = 3$. The sign belongs to the coefficient." },
      { type: "num", prompt: "Work out the part under the root, $b^2 - 4ac$, for $a = 2$, $b = -7$, $c = 3$.", answer: 25, skill: "The quadratic formula",
        near: [{ v: -73, fb: "$(-7)^2 = +49$." }, { v: 73, fb: "$4ac = 4 \\cdot 2 \\cdot 3 = 24$: subtract it." }, { v: 43, fb: "$4ac = 24$, not 6." }], hints: ["$(-7)^2 - 4(2)(3)$."], why: "$49 - 24 = 25$." },
      { type: "numbers", prompt: "Finish: $x = \\frac{7 \\pm \\sqrt{25}}{4}$. What are the two solutions?", answer: [3, 0.5], skill: "The quadratic formula", placeholder: "e.g. 2, 1/3",
        hints: ["$\\frac{7 + 5}{4}$ and $\\frac{7 - 5}{4}$."], why: "$\\frac{12}{4} = 3$ and $\\frac{2}{4} = \\frac{1}{2}$. Check: $2(9) - 21 + 3 = 0$ ✓." },
      { type: "numbers", kicker: "Use it", prompt: "Use the formula on $x^2 - 4x - 5 = 0$.", answer: [5, -1], skill: "The quadratic formula", placeholder: "e.g. 3, -2",
        hints: ["$a = 1$, $b = -4$, $c = -5$.", "$b^2 - 4ac = 16 + 20 = 36$."], why: "$x = \\frac{4 \\pm 6}{2}$: $x = 5$ or $x = -1$. (It also factors: $(x - 5)(x + 1)$. The formula agrees.)" }
    ]
  });
  /* ============================================ 9.7 · Applying the quadratic formula */
  LESSONS.push({
    title: "Applying the quadratic formula",
    blurb: "Book 9.7 · The usual slips, how to check, and what the number under the root tells you.",
    mins: 8, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "For $2x^2 - 7x + 3 = 0$, Lin writes $x = \\frac{-7 \\pm \\sqrt{25}}{4}$. What's her mistake?",
        options: [{ t: "$b$ is $-7$, so $-b$ is $+7$." }, { t: "The root should be $\\sqrt{73}$.", fb: "$(-7)^2 - 4(2)(3) = 49 - 24 = 25$. That part is right." }, { t: "The denominator should be 2.", fb: "$2a = 2 \\cdot 2 = 4$. That part is right." }],
        answer: 0, skill: "Avoid formula errors", hints: ["The formula starts with $-b$. What is $-(-7)$?"], why: "$-b = -(-7) = 7$: $x = \\frac{7 \\pm 5}{4}$, giving 3 and $\\frac{1}{2}$." },
      { type: "choice", prompt: "Elena writes the formula as $x = -b \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a}$. What's wrong?",
        options: [{ t: "The **whole** top, $-b \\pm \\sqrt{\\ldots}$, is divided by $2a$." }, { t: "Nothing: it's the same thing.", fb: "Try $x^2 - 4x - 5 = 0$: hers gives $4 \\pm 3$, but the true solutions are 5 and $-1$." }, { t: "It should be divided by $a$, not $2a$.", fb: "$2a$ is right. The issue is what gets divided." }],
        answer: 0, skill: "Avoid formula errors", hints: ["Where does the fraction bar stretch to?"], why: "$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$: the $-b$ is divided by $2a$ too." },
      { type: "num", kicker: "See it", prompt: "For $x^2 + 2x + 5 = 0$, work out $b^2 - 4ac$.", answer: -16, skill: "The discriminant",
        near: [{ v: 24, fb: "$4ac = 20$ is subtracted: $4 - 20$." }, { v: 16, fb: "$4 - 20$ is negative." }], hints: ["$2^2 - 4(1)(5)$."], why: "$4 - 20 = -16$. The formula would need $\\sqrt{-16}$, and no real number squares to a negative." },
      { type: "learn", kicker: "Name it",
        prompt: "The number under the root, $b^2 - 4ac$, is the **discriminant**. Its sign tells you how many real solutions there are, before you finish:<br><br>**positive:** two solutions;<br>**zero:** one solution;<br>**negative:** no real solutions." },
      { type: "sort", prompt: "Use the discriminant. How many real solutions?",
        bins: ["Two", "One", "None"],
        cards: [{ t: "$x^2 + 4x + 4 = 0$", bin: 1, fb: "$16 - 16 = 0$." }, { t: "$x^2 + x + 1 = 0$", bin: 2, fb: "$1 - 4 = -3$." }, { t: "$x^2 - 5x + 2 = 0$", bin: 0, fb: "$25 - 8 = 17$." }, { t: "$2x^2 + 3x - 2 = 0$", bin: 0, fb: "$9 + 16 = 25$." }],
        skill: "The discriminant", hints: ["Work out $b^2 - 4ac$ for each."], why: "Positive, zero or negative: two, one or none." },
      { type: "numbers", kicker: "Vary it", prompt: "Solve $2x^2 + 3x - 2 = 0$ with the formula.", answer: [0.5, -2], skill: "The quadratic formula", placeholder: "e.g. 1/3, -4",
        hints: ["$a = 2$, $b = 3$, $c = -2$. Discriminant 25.", "$x = \\frac{-3 \\pm 5}{4}$."], why: "$\\frac{-3 + 5}{4} = \\frac{1}{2}$ and $\\frac{-3 - 5}{4} = -2$." },
      { type: "choice", kicker: "Use it", prompt: "How can you be sure that $x = \\frac{1}{2}$ really solves $2x^2 + 3x - 2 = 0$?",
        options: [{ t: "Substitute it: $2\\left(\\frac{1}{4}\\right) + \\frac{3}{2} - 2 = 0$ ✓" }, { t: "It came from the formula, so it must be right.", fb: "The formula is right, but arithmetic slips are easy. A check costs seconds." }, { t: "It's positive.", fb: "Solutions can be negative, too." }],
        answer: 0, skill: "Avoid formula errors", hints: ["A solution makes the equation true."], why: "$\\frac{1}{2} + \\frac{3}{2} - 2 = 0$ ✓. Substituting back is the surest check." }
    ]
  });

  /* ============================================ 9.8 · Deriving the quadratic formula */
  LESSONS.push({
    title: "Deriving the quadratic formula",
    blurb: "Book 9.8 · Where the formula comes from: completing the square, done once with letters.",
    mins: 7, v: 2,
    steps: [
      { type: "numbers", kicker: "Try it", prompt: "Warm up by completing the square with numbers: solve $x^2 + 6x + 5 = 0$.", answer: [-1, -5], skill: "Solve by completing the square", placeholder: "e.g. -2, -3",
        near: [], hints: ["$x^2 + 6x = -5$. Add 9.", "$(x + 3)^2 = 4$."], why: "$x + 3 = \\pm 2$: $x = -1$ or $x = -5$. Now watch the same moves with letters." },
      { type: "learn", kicker: "See it", prompt: "The same steps on $x^2 + bx + c = 0$, with $b$ and $c$ left as letters.",
        scene: { type: "walk", rows: [
          { m: "x^2 + bx = -c", say: "Move the constant." },
          { m: "x^2 + bx + \\frac{b^2}{4} = \\frac{b^2}{4} - c", say: "Add the square of half of $b$ to both sides." },
          { m: "\\left(x + \\frac{b}{2}\\right)^2 = \\frac{b^2 - 4c}{4}", say: "Left: a square. Right: one fraction." },
          { m: "x + \\frac{b}{2} = \\pm\\frac{\\sqrt{b^2 - 4c}}{2}", say: "Take square roots." },
          { m: "x = \\frac{-b \\pm \\sqrt{b^2 - 4c}}{2}", say: "Subtract $\\frac{b}{2}$. This is the formula with $a = 1$." }] },
        gate: true },
      { type: "learn", prompt: "With a general $a$, there is one extra move at the start: divide by $a$.",
        scene: { type: "walk", rows: [
          { m: "ax^2 + bx + c = 0", say: "The general equation." },
          { m: "x^2 + \\frac{b}{a}x = -\\frac{c}{a}", say: "Divide by $a$ and move the constant." },
          { m: "\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}", say: "Complete the square: add $\\left(\\frac{b}{2a}\\right)^2$ to both sides." },
          { m: "x + \\frac{b}{2a} = \\pm\\frac{\\sqrt{b^2 - 4ac}}{2a}", say: "Take square roots." },
          { m: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", say: "Subtract $\\frac{b}{2a}$. The quadratic formula." }] },
        gate: true,
        then: "Nothing new was needed: only completing the square. The formula is that method, done once and written down, so you never have to repeat it." },
      { type: "order", kicker: "Name it", prompt: "Put the derivation's moves in order.",
        items: ["Divide every term by $a$.", "Move the constant to the other side.", "Add the square of half the $x$-coefficient to both sides.", "Write the left side as a squared bracket.", "Take square roots, with $\\pm$.", "Isolate $x$."],
        skill: "Derive the formula", why: "Exactly the steps of completing the square." },
      { type: "choice", kicker: "Vary it", prompt: "In the derivation, where does the $\\pm$ come from?",
        options: [{ t: "From taking the square root of both sides." }, { t: "From dividing by $a$.", fb: "Dividing by $a$ gives one result, not two." }, { t: "From moving $c$ across.", fb: "That just changes its sign." }],
        answer: 0, skill: "Derive the formula", hints: ["Which step gives two possibilities?"], why: "A positive number has two square roots. That's why a quadratic equation can have two solutions." },
      { type: "choice", kicker: "Use it", prompt: "Why does the discriminant, $b^2 - 4ac$, decide the number of solutions?",
        options: [{ t: "It ends up under the square root: positive gives two roots, zero gives one, negative gives none." }, { t: "It is the larger of the two solutions.", fb: "It isn't a solution. It's the quantity under the root." }, { t: "It's the $y$-intercept.", fb: "That's $c$." }],
        answer: 0, skill: "Derive the formula", hints: ["Look at where it sits in the formula."], why: "Everything else in the formula is ordinary arithmetic. Only the square root can produce two values, one value, or none." }
    ]
  });

  /* ============================================ 9.9 · Different forms */
  LESSONS.push({
    title: "Writing quadratics in different forms",
    blurb: "Book 9.9 · Standard, factored and vertex form are one function in three outfits.",
    mins: 7, v: 2,
    steps: [
      { type: "expr", kicker: "Try it", prompt: "Write $(x - 3)^2 + 2$ in standard form.", answer: "x^2-6x+11", shown: "x^2 - 6x + 11", form: "simplified", skill: "Convert between forms", keys: KEYS_Q,
        near: [{ v: "x^2+11", fb: "$(x - 3)^2$ has a middle term: $-6x$." }, { v: "x^2-6x+9", fb: "Add the 2 as well: $9 + 2$." }, { v: "x^2-6x-7", fb: "$(-3)^2 = +9$." }],
        hints: ["$(x - 3)^2 = x^2 - 6x + 9$. Then add 2."], why: "$x^2 - 6x + 9 + 2 = x^2 - 6x + 11$." },
      { type: "pair", prompt: "What is the vertex of $y = x^2 - 6x + 11$? (You just saw it in another form.)", answer: [3, 2], skill: "Convert between forms",
        near: [{ v: [-3, 2], fb: "$(x - 3)$ is zero at $x = +3$." }], hints: ["It equals $(x - 3)^2 + 2$."], why: "From vertex form: $(3, 2)$. Standard form hides it." },
      { type: "slots", kicker: "Name it", prompt: "These are the **same function**. Match each form to what it shows at a glance.",
        slots: [{ id: "a", label: "The $y$-intercept, 8" }, { id: "b", label: "The zeros, 2 and 4" }, { id: "c", label: "The vertex, $(3, -1)$" }],
        cards: [{ t: "$x^2 - 6x + 8$", slot: "a", fb: "Standard form ends in $c$, the $y$-intercept." }, { t: "$(x - 2)(x - 4)$", slot: "b", fb: "Factored form shows where each factor is zero." }, { t: "$(x - 3)^2 - 1$", slot: "c", fb: "Vertex form shows $(h, k)$." }],
        skill: "Convert between forms", hints: ["Standard: $c$. Factored: zeros. Vertex: $(h, k)$."], why: "Choose the form that shows what you need." },
      { type: "num", kicker: "Vary it", prompt: "A parabola has vertex $(1, 2)$ and passes through $(2, 5)$. In $y = a(x - 1)^2 + 2$, what is $a$?", pre: "$a =$", answer: 3, skill: "Convert between forms",
        near: [{ v: 5, fb: "$5 = a(1)^2 + 2$: subtract the 2." }], hints: ["Put in $x = 2$, $y = 5$: $5 = a(2 - 1)^2 + 2$."], why: "$5 = a + 2$, so $a = 3$: $y = 3(x - 1)^2 + 2$." },
      { type: "choice", prompt: "You need to know where a parabola crosses the $x$-axis. Which form is most useful?",
        options: [{ t: "Factored form" }, { t: "Standard form", fb: "Standard form shows the $y$-intercept. The $x$-intercepts are hidden." }, { t: "Vertex form", fb: "Vertex form shows the turning point. You'd still have to solve for the zeros." }],
        answer: 0, keep: true, skill: "Convert between forms", hints: ["Which form shows the zeros?"], why: "Each factor is zero at one $x$-intercept." },
      { type: "expr", kicker: "Use it", prompt: "Write the equation, in vertex form, of the parabola with $a = 1$ and vertex $(-2, 1)$: $y = \\;?$", answer: "(x+2)^2+1", shown: "(x + 2)^2 + 1", skill: "Convert between forms", keys: KEYS_Q,
        near: [{ v: "(x-2)^2+1", fb: "That has its vertex at $x = +2$." }], hints: ["$y = (x - h)^2 + k$ with $h = -2$, $k = 1$."], why: "$(x - (-2))^2 + 1 = (x + 2)^2 + 1$." }
    ]
  });

  /* ============================================ 9.10 · Into vertex form */
  LESSONS.push({
    title: "Rewriting quadratic expressions in vertex form",
    blurb: "Book 9.10 · Complete the square inside an expression: add what's missing, and take it away again.",
    mins: 7, v: 2,
    steps: [
      { type: "learn", kicker: "See it", prompt: "To put $x^2 + 6x + 5$ into vertex form, complete the square without changing its value.",
        scene: { type: "walk", rows: [
          { m: "x^2 + 6x + 5", say: "$x^2 + 6x$ needs 9 to be a perfect square." },
          { m: "x^2 + 6x + 9 - 9 + 5", say: "Add 9 **and subtract 9**. The value hasn't changed." },
          { m: "(x + 3)^2 - 9 + 5", say: "The first three terms are a square." },
          { m: "(x + 3)^2 - 4", say: "Combine the numbers. Vertex form: the vertex is $(-3, -4)$." }] },
        gate: true,
        then: "With an equation you add to both sides. With an expression there is only one side, so you **add and subtract** the same number." },
      { type: "num", kicker: "Try it", prompt: "$x^2 + 8x + 10 = (x + 4)^2 + \\square$. What goes in the box?", answer: -6, skill: "Write in vertex form",
        near: [{ v: 10, fb: "$(x + 4)^2$ already contains $+16$. Take that back off: $10 - 16$." }, { v: 26, fb: "Subtract the 16 you added: $10 - 16$." }, { v: 6, fb: "$10 - 16$ is negative." }],
        hints: ["$(x + 4)^2 = x^2 + 8x + 16$. You need 10, not 16."], why: "$x^2 + 8x + 16 - 16 + 10 = (x + 4)^2 - 6$." },
      { type: "num", prompt: "$x^2 - 4x + 7 = (x - 2)^2 + \\square$.", answer: 3, skill: "Write in vertex form",
        near: [{ v: 11, fb: "$(x - 2)^2$ contains $+4$. Subtract it: $7 - 4$." }, { v: 7, fb: "The square already brings a $+4$ with it." }], hints: ["$(x - 2)^2 = x^2 - 4x + 4$."], why: "$7 - 4 = 3$: $(x - 2)^2 + 3$." },
      { type: "pair", kicker: "Vary it", prompt: "Find the vertex of $y = x^2 - 10x + 21$ by rewriting it in vertex form.", answer: [5, -4], skill: "Write in vertex form",
        near: [{ v: [-5, -4], fb: "$(x - 5)^2$ is zero at $x = +5$." }, { v: [5, 21], fb: "$(x - 5)^2$ contains $+25$: $21 - 25 = -4$." }], hints: ["Half of $-10$ is $-5$: $(x - 5)^2 = x^2 - 10x + 25$.", "$21 - 25$."], why: "$(x - 5)^2 - 4$: the vertex is $(5, -4)$." },
      { type: "numbers", prompt: "Vertex form solves equations too. Solve $(x - 5)^2 - 4 = 0$.", answer: [7, 3], skill: "Write in vertex form", placeholder: "e.g. 6, 2",
        hints: ["$(x - 5)^2 = 4$."], why: "$x - 5 = \\pm 2$: $x = 7$ or $x = 3$. And indeed $x^2 - 10x + 21 = (x - 3)(x - 7)$." },
      { type: "choice", kicker: "Use it", prompt: "Which is $x^2 + 2x - 8$ in vertex form?",
        options: [{ t: "$(x + 1)^2 - 9$" }, { t: "$(x + 1)^2 - 8$", fb: "$(x + 1)^2$ adds 1, so the constant must drop by 1: $-8 - 1$." }, { t: "$(x + 2)^2 - 12$", fb: "Half of 2 is 1, so the bracket is $(x + 1)$." }],
        answer: 0, skill: "Write in vertex form", hints: ["Half of 2 is 1. $(x + 1)^2 = x^2 + 2x + 1$."], why: "$x^2 + 2x + 1 - 1 - 8 = (x + 1)^2 - 9$. Vertex $(-1, -9)$." }
    ]
  });

  /* ============================================ 9.11 · Using vertex form */
  LESSONS.push({
    title: "Using quadratic expressions in vertex form to solve problems",
    blurb: "Book 9.11 · The biggest profit, the lowest cost, the highest point: read it off the vertex.",
    mins: 7, v: 2,
    steps: [
      { type: "learn", kicker: "Try it", prompt: "A stall's daily profit, in cents, depends on the price $x$ it charges: $P(x) = -(x - 30)^2 + 400$. Slide the price to find the **greatest profit**.",
        scene: { type: "plane", x: [0, 60], y: [0, 450], grid: 10, gridY: 50, labelEvery: 10, labelEveryY: 100, aspect: 0.8, axisLabels: ["price", "profit"], gate: true,
          params: { x: { v: 12, min: 10, max: 50, step: 2, label: "price $x$" } },
          fns: [{ f: function (x) { var v = -(x - 30) * (x - 30) + 400; return v >= 0 ? v : NaN; }, color: "green" }],
          marks: [{ x: function (P) { return P.x; }, y: function (P) { return -(P.x - 30) * (P.x - 30) + 400; }, color: "orange", r: 7 }],
          readout: function (st) { var x = st.params.x, v = -(x - 30) * (x - 30) + 400; return "$P(" + x + ") = -(" + x + " - 30)^2 + 400 = " + v + "$" + (x === 30 ? " ← the greatest" : ""); },
          goal: function (st) { return st.params.x === 30; } },
        gate: true,
        then: "At $x = 30$ the bracket is zero, so nothing is taken away from 400. Any other price subtracts something. Vertex form shows the maximum without any searching." },
      { type: "num", prompt: "So what is the **greatest** profit the stall can make, in cents?", post: "cents", answer: 400, skill: "Maximum and minimum",
        near: [{ v: 30, fb: "30 is the *price* that gives the greatest profit. The profit itself is the other number." }], hints: ["$-(x - 30)^2$ is never positive. When is it zero?"], why: "$-(x - 30)^2$ is at most 0, so $P$ is at most 400, when $x = 30$." },
      { type: "learn", kicker: "Name it",
        prompt: "In vertex form, $y = a(x - h)^2 + k$:<br><br>if $a$ is **negative**, the vertex is the top: the **maximum** value is $k$, at $x = h$;<br>if $a$ is **positive**, the vertex is the bottom: the **minimum** value is $k$, at $x = h$." },
      { type: "choice", prompt: "The cost of running a machine for $x$ hours is $C(x) = (x - 4)^2 + 15$ dollars. What does the vertex tell you?",
        options: [{ t: "The lowest cost is \\$15, when it runs 4 hours." }, { t: "The highest cost is \\$15, when it runs 4 hours.", fb: "$a = 1$ is positive: the parabola opens upward, so the vertex is the minimum." }, { t: "The lowest cost is \\$4, when it runs 15 hours.", fb: "The vertex is $(4, 15)$: 4 hours, 15 dollars." }],
        answer: 0, skill: "Maximum and minimum", hints: ["Which way does it open? What is $(h, k)$?"], why: "$(x - 4)^2$ is at least 0, so $C$ is at least 15, when $x = 4$." },
      { type: "num", kicker: "Vary it", prompt: "A ball's height is $h(t) = -16t^2 + 64t + 6$. In vertex form that is $-16(t - 2)^2 + 70$. What is its greatest height?", post: "ft", answer: 70, skill: "Maximum and minimum",
        near: [{ v: 6, fb: "6 ft is where it starts, at $t = 0$." }, { v: 2, fb: "2 is the time of the peak, in seconds." }], hints: ["Read $k$ from the vertex form."], why: "The vertex is $(2, 70)$: 70 ft, after 2 seconds." },
      { type: "choice", prompt: "Two arcs: $f(x) = -(x - 1)^2 + 8$ and $g(x) = -2(x - 3)^2 + 9$. Which reaches higher?",
        options: [{ t: "$g$: its maximum is 9." }, { t: "$f$: its maximum is 8.", fb: "8 is less than 9." }, { t: "$g$, because $-2$ is steeper.", fb: "$a$ sets the width, not the height. Compare the $k$ values." }],
        answer: 0, skill: "Maximum and minimum", hints: ["Compare the two $k$ values."], why: "$f$ peaks at 8 and $g$ at 9. The height of the vertex is $k$, whatever $a$ and $h$ are." },
      { type: "num", kicker: "Use it", prompt: "$R(x) = -x^2 + 12x$ is a shop's revenue. Completing the square gives $R(x) = -(x - 6)^2 + \\square$. What is the maximum revenue?", answer: 36, skill: "Maximum and minimum",
        near: [{ v: -36, fb: "$-(x - 6)^2 = -x^2 + 12x - 36$, so you must *add* 36 to get back to $-x^2 + 12x$." }, { v: 6, fb: "6 is where the maximum happens. Find the value there: $R(6)$." }],
        hints: ["$R(6) = -36 + 72$."], why: "$-(x - 6)^2 + 36$: the maximum is 36, at $x = 6$." }
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
