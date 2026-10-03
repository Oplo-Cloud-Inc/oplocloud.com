/* ==========================================================================
   Algebra I — Unit 6: Working with polynomials. See lab/core.js for the
   format.

   Follows OpenStax Algebra 1, Unit 6, lesson for lesson — the readiness check, the area-model
   inquiry (folded into 6.2), lessons 6.1 to 6.7, and Project 6. Written to
   the recipe in docs/OEDU_BRILLIANT_CONCEPT.md and the five rules at the top
   of alg/u02.js: teach, learn by doing, super interactive, nothing clumsy,
   never too much.

   The unit's picture is a rectangle. Multiplying is finding its area from
   its sides; factoring is finding its sides from its area. The algebra
   tiles and area models carry both directions.

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   questions, figures, feedback and every step here are OEdu's own.

   Nine lessons, eleven skills, two quizzes, and the unit test.
   Standards: CCSS HSA.APR.A.1, HSA.APR.B.2, HSA.SSE.A.2, HSA.SSE.B.3a.
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
    blurb: "Book: Unit 6 Readiness · Use the exponent rules, distribute, and find a greatest common factor.",
    mins: 6, v: 2,
    steps: [
      { type: "num", kicker: "Check 1 · Exponents", prompt: "$x^3 \\cdot x^5 = x^{\\square}$. What goes in the box?", answer: 8, skill: "Exponent rules",
        near: [{ v: 15, fb: "Multiplying powers *adds* the exponents." }], hints: ["Count the $x$'s: three, then five more."], why: "$3 + 5 = 8$." },
      { type: "num", prompt: "$\\frac{x^9}{x^3} = x^{\\square}$.", answer: 6, skill: "Exponent rules",
        near: [{ v: 3, fb: "Dividing powers *subtracts* the exponents: $9 - 3$." }, { v: 12, fb: "Dividing removes factors: subtract." }], hints: ["Three of the nine $x$'s cancel."], why: "$9 - 3 = 6$." },
      { type: "expr", kicker: "Check 2 · Distributing", prompt: "Multiply out $3(2x - 5)$.", answer: "6x-15", shown: "6x - 15", form: "simplified", skill: "Distributive property",
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "6x-5", fb: "The 3 multiplies the 5 as well." }], hints: ["$3 \\cdot 2x$ and $3 \\cdot (-5)$."], why: "$6x - 15$." },
      { type: "expr", prompt: "Simplify $-2(x + 4) + 3x$.", answer: "x-8", shown: "x - 8", form: "simplified", skill: "Distributive property",
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "x+8", fb: "$-2 \\cdot 4 = -8$." }, { v: "5x-8", fb: "$-2x + 3x = x$." }], hints: ["$-2(x + 4) = -2x - 8$. Then combine the $x$ terms."], why: "$-2x - 8 + 3x = x - 8$." },
      { type: "num", kicker: "Check 3 · Common factors", prompt: "What is the greatest common factor of 18 and 24?", answer: 6, skill: "Greatest common factor",
        near: [{ v: 3, fb: "3 divides both, but so does a bigger number." }, { v: 2, fb: "2 divides both, but there's a larger one." }, { v: 72, fb: "72 is a common *multiple*. A factor divides into both." }],
        hints: ["List the factors of 18: 1, 2, 3, 6, 9, 18."], why: "6 divides both, and nothing larger does." },
      { type: "num", prompt: "And of 16 and 40?", answer: 8, skill: "Greatest common factor",
        near: [{ v: 4, fb: "4 works, but a larger number does too." }], hints: ["Factors of 16: 1, 2, 4, 8, 16. Which is the largest that divides 40?"], why: "$16 = 8 \\times 2$ and $40 = 8 \\times 5$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 6.1**. If **check 1** slipped, Unit 5's lesson 5.1 rebuilds the exponent rules. **Check 2** comes back in 6.1 and 6.2, and **check 3** in 6.4, where the area model makes it visual.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  var KEYS_POLY = [["$x$", "x"], ["$x^2$", "x^2"], ["$x^3$", "x^3"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]];

  /* ============================================ 6.1 · Add and subtract polynomials */
  var HOW_6_1 = [["Brackets", "Remove the brackets. When subtracting, change the sign of **every** term in the second bracket."], ["Group", "Put like terms side by side: $x^2$ with $x^2$, $x$ with $x$, numbers with numbers."], ["Combine", "Add the coefficients in each group."]];
  LESSONS.push({
    title: "Add and subtract polynomials",
    blurb: "Book 6.1 · Only like terms combine: x² with x², x with x, numbers with numbers.",
    mins: 12, v: 3,
    steps: [
      { type: "tilemat", kicker: "Warm up", prompt: "Each tile is a term. A blue tile and a red tile **of the same kind** cancel. Tap pairs until nothing more cancels.",
        terms: [[2, "x"], [3, "1"], [-1, "x"], [-2, "1"]], skill: "Like terms",
        hints: ["Tap an $x$ tile, then a $-x$ tile."], why: "$2x + 3 - x - 2 = x + 1$. An $x$ tile can only cancel a $-x$ tile, never a unit tile." },
      { type: "learn", kicker: "The idea",
        prompt: "A **polynomial** is a sum of terms such as $3x^2$, $-5x$ and 7. Only **like terms** combine: the same variable to the same power. An $x^2$ tile and an $x$ tile are different shapes, so they stay separate.",
        scene: { type: "method", how: HOW_6_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch two polynomials added.$$(2x^2 + 3x - 4) + (x^2 - 5x + 6)$$",
        scene: { type: "walk", how: HOW_6_1, rows: [
          { step: 1, m: "2x^2 + 3x - 4 + x^2 - 5x + 6", say: "Adding: the brackets simply come off." },
          { step: 2, m: "(2x^2 + x^2) + (3x - 5x) + (-4 + 6)", say: "Like terms side by side." },
          { step: 3, m: "3x^2 - 2x + 2", say: "$2 + 1 = 3$, then $3 - 5 = -2$, then $-4 + 6 = 2$.",
            ask: { prompt: "What is $3x - 5x$?", answer: 0,
                   options: [{ t: "$-2x$" }, { t: "$-2$", fb: "The $x$ stays: 3 of them take away 5 of them leaves $-2$ of them." }, { t: "$-2x^2$", fb: "Combining like terms never changes the power." }] } }] },
        gate: true,
        then: "Combining like terms changes the coefficients. The powers stay as they are." },
      { type: "guided", kicker: "Together",
        prompt: "Now you add two.$$(4x^2 + x + 2) + (3x^2 + 5x - 7)$$",
        how: HOW_6_1, skill: "Add polynomials",
        steps: [
          { step: 1, ask: "Remove the brackets. What do you get?", type: "choice", answer: 0,
            options: [{ t: "$4x^2 + x + 2 + 3x^2 + 5x - 7$" }, { t: "$4x^2 + x + 2 - 3x^2 - 5x + 7$", fb: "Signs change only when you **subtract** a bracket. This is an addition." }],
            m: "4x^2 + x + 2 + 3x^2 + 5x - 7", say: "Adding: nothing changes sign." },
          { step: 2, ask: "Which term is like $4x^2$?", type: "choice", answer: 0,
            options: [{ t: "$3x^2$" }, { t: "$5x$", fb: "$5x$ has $x$ to the first power. Like terms need the same power." }, { t: "$x$", fb: "$x$ is not squared." }],
            m: "(4x^2 + 3x^2) + (x + 5x) + (2 - 7)", say: "Like terms side by side." },
          { step: 3, ask: "Combine.", type: "choice", answer: 0,
            options: [{ t: "$7x^2 + 6x - 5$" }, { t: "$7x^2 + 6x + 9$", fb: "$2 - 7$ is $-5$." }, { t: "$13x^3 - 5$", fb: "$x^2$ terms and $x$ terms are not like terms. They stay apart." }],
            m: "7x^2 + 6x - 5", say: "$4 + 3 = 7$, then $1 + 5 = 6$, then $2 - 7 = -5$." }],
        why: "Brackets, group, combine. Now add two on your own." },
      { type: "expr", kicker: "On your own", prompt: "Add.$$(3x^2 + 2x - 5) + (x^2 - 6x + 1)$$", answer: "4x^2-4x-4", shown: "4x^2 - 4x - 4", form: "simplified", skill: "Add polynomials",
        near: [{ v: "4x^2+8x-4", fb: "$2x + (-6x) = -4x$." }, { v: "4x^2-4x-6", fb: "$-5 + 1 = -4$." }], keys: KEYS_POLY,
        hints: ["Combine the $x^2$ terms, then the $x$ terms, then the numbers."], why: "$3x^2 + x^2 = 4x^2$; $2x - 6x = -4x$; $-5 + 1 = -4$." },
      { type: "sort", prompt: "Name each polynomial by its number of terms.",
        bins: ["Monomial (1)", "Binomial (2)", "Trinomial (3)"],
        cards: [{ t: "$7x$", bin: 0, fb: "One term." }, { t: "$x^2 - 9$", bin: 1, fb: "Two terms." }, { t: "$x^2 + 5x + 6$", bin: 2, fb: "Three terms." }, { t: "$-3$", bin: 0, fb: "A single number is one term." }, { t: "$2x^3 + x$", bin: 1, fb: "Two terms." }],
        skill: "Polynomial vocabulary", hints: ["Count the terms: the pieces separated by $+$ or $-$."], why: "Mono-, bi-, tri-: one, two, three terms." },
      { type: "learn", kicker: "A harder case",
        prompt: "Subtracting is where slips happen.$$(6x^2 + 2x) - (4x^2 - 3x)$$",
        scene: { type: "walk", how: HOW_6_1, rows: [
          { step: 1, m: "6x^2 + 2x - 4x^2 + 3x", say: "Subtracting flips the sign of **every** term in the second bracket. $-(-3x)$ becomes $+3x$." },
          { step: 2, m: "(6x^2 - 4x^2) + (2x + 3x)", say: "Like terms side by side." },
          { step: 3, m: "2x^2 + 5x", say: "$6 - 4 = 2$ and $2 + 3 = 5$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Subtracting takes care. What is the correct first step?$$(5x^2 + 3x) - (2x^2 - 4x)$$",
        options: [{ t: "$5x^2 + 3x - 2x^2 + 4x$" }, { t: "$5x^2 + 3x - 2x^2 - 4x$", fb: "The minus sign applies to *both* terms in the bracket: $-(-4x) = +4x$." }, { t: "$5x^2 - 2x^2 + 3x^2$", fb: "$x^2$ terms and $x$ terms aren't alike. Keep them separate." }],
        answer: 0, skill: "Subtract polynomials", hints: ["Subtracting a bracket changes the sign of every term inside it."], why: "$-(2x^2 - 4x) = -2x^2 + 4x$." },
      { type: "expr", prompt: "Finish it: $(5x^2 + 3x) - (2x^2 - 4x)$", answer: "3x^2+7x", shown: "3x^2 + 7x", form: "simplified", skill: "Subtract polynomials",
        near: [{ v: "3x^2-x", fb: "$3x - (-4x) = 3x + 4x$." }], keys: KEYS_POLY, hints: ["$5x^2 - 2x^2$ and $3x + 4x$."], why: "$3x^2 + 7x$." },
      { type: "num", prompt: "A polynomial can be a function. For $P(x) = x^2 - 3x + 2$, find $P(4)$.", pre: "$P(4) =$", answer: 6, skill: "Evaluate a polynomial",
        near: [{ v: -2, fb: "$4^2$ is 16, not 8." }, { v: 30, fb: "$-3(4) = -12$: subtract it." }], hints: ["$4^2 - 3(4) + 2$."], why: "$16 - 12 + 2 = 6$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran subtracts two polynomials. Tap the line where his work **first** goes wrong.",
        lines: ["(7x + 5) - (2x - 3)", "7x + 5 - 2x - 3", "5x + 2"], answer: 1, fix: "7x + 5 - 2x + 3",
        fb: { 0: "That is the problem as given.", 2: "$7x - 2x = 5x$ and $5 - 3 = 2$, so this follows from the line above. The slip came earlier." },
        skill: "Subtract polynomials", hints: ["What happens to $-3$ when the bracket is subtracted?"],
        why: "The minus sign flips both terms: $-(2x - 3) = -2x + 3$. The answer is $5x + 8$." },
      { type: "expr", kicker: "Use it", prompt: "A rectangle has sides $2x + 3$ and $x - 1$. Write its **perimeter** as a simplified polynomial.", answer: "6x+4", shown: "6x + 4", form: "simplified", skill: "Add polynomials",
        near: [{ v: "3x+2", fb: "That's two of the sides. A rectangle has four." }], keys: KEYS_POLY,
        hints: ["Perimeter = 2 × (length + width)."], why: "$2(2x + 3 + x - 1) = 2(3x + 2) = 6x + 4$." }
    ]
  });

  /* ============================================ 6.2 · Multiplying polynomials */
  var HOW_6_2 = [["Split", "Split each factor into its terms. A minus sign travels with its term."], ["Multiply", "Multiply every term of one factor by every term of the other."], ["Combine", "Add the like terms."]];
  LESSONS.push({
    title: "Multiplying polynomials",
    blurb: "Book 6.2 and the area-model inquiry · A product is the area of a rectangle. Every part of one side meets every part of the other.",
    mins: 12, v: 3,
    steps: [
      { type: "expr", kicker: "Warm up", prompt: "First, single terms. Multiply $3x^2 \\cdot 4x^3$.", answer: "12x^5", shown: "12x^5", skill: "Multiply monomials",
        near: [{ v: "12x^6", fb: "Multiplying powers *adds* the exponents: $2 + 3$." }, { v: "7x^5", fb: "The coefficients multiply: $3 \\times 4$." }],
        keys: [["$x$", "x"], ["$x^{\\square}$", "^"]], hints: ["Multiply the numbers. Add the exponents."], why: "$3 \\cdot 4 = 12$ and $x^2 \\cdot x^3 = x^5$." },
      { type: "learn", kicker: "Explore", prompt: "A rectangle is $x + 3$ wide and $x + 2$ tall. Change the sides and watch what tiles fill it.",
        scene: { type: "tiles", mode: "multiply", p: 3, q: 2, adjust: true, min: 0, gate: true }, gate: true,
        then: "One big $x^2$ tile, some $x$ tiles along two edges, and unit tiles in the corner. For $(x + 3)(x + 2)$: $x^2 + 5x + 6$. **Multiplying two binomials always gives these four regions.**" },
      { type: "learn", kicker: "The idea",
        prompt: "A product is the **area of a rectangle**. Split each side into its parts, and every part of one side meets every part of the other. Two binomials give four products.",
        scene: { type: "method", how: HOW_6_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch two binomials multiplied.$$(x + 3)(x + 2)$$",
        scene: { type: "walk", how: HOW_6_2, rows: [
          { step: 1, m: "(x + 3)(x + 2)", say: "One side is $x$ and 3. The other is $x$ and 2." },
          { step: 2, m: "x \\cdot x = x^2, \\quad x \\cdot 2 = 2x", say: "The $x$ of the first bracket meets both parts of the second." },
          { step: 2, m: "3 \\cdot x = 3x, \\quad 3 \\cdot 2 = 6", say: "Then the 3 does the same.",
            ask: { prompt: "How many products do two binomials make?", answer: 0,
                   options: [{ t: "Four" }, { t: "Two", fb: "Each of the 2 terms in one bracket meets each of the 2 in the other: $2 \\times 2$." }] } },
          { step: 3, m: "x^2 + 5x + 6", say: "$2x + 3x = 5x$." }] },
        gate: true,
        then: "Four products, then combine. That is the **distributive property** used twice." },
      { type: "learn", kicker: "Explore", prompt: "An **area model** does the same without tiles. Each cell is its row times its column. Fill in the areas.",
        scene: { type: "tiles", mode: "area", rows: ["x", "4"], cols: ["x", "3"], cells: [["x^2", "3x"], ["4x", "12"]], readout: "$(x + 4)(x + 3) = x^2 + 3x + 4x + 12 = x^2 + 7x + 12$", gate: true }, gate: true,
        then: "Four cells, four products. Then combine the two $x$ terms. This is the **distributive property** used twice." },
      { type: "guided", kicker: "Together",
        prompt: "Now you multiply.$$(x + 4)(x + 5)$$",
        how: HOW_6_2, skill: "Multiply binomials",
        steps: [
          { step: 1, ask: "What are the parts of each side?", type: "choice", answer: 0,
            options: [{ t: "$x$ and 4, then $x$ and 5" }, { t: "$x + 4$ and 5", fb: "The second bracket has two parts as well: $x$ and 5." }],
            m: "(x + 4)(x + 5)", say: "Two parts on each side." },
          { step: 2, ask: "Which list has all four products?", type: "choice", answer: 0,
            options: [{ t: "$x^2$, $5x$, $4x$ and 20" }, { t: "$x^2$ and 20", fb: "Those are only the first and the last. The two middle products are missing." }, { t: "$x^2$ and $9x$", fb: "$4 \\cdot 5 = 20$ is missing." }],
            m: "x^2 + 5x + 4x + 20", say: "Every part meets every part." },
          { step: 3, ask: "Combine the like terms.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 9x + 20$" }, { t: "$x^2 + 20x + 9$", fb: "The $x$ terms are $5x$ and $4x$: together $9x$. The number is 20." }, { t: "$x^2 + 20$", fb: "The middle terms $5x$ and $4x$ are missing." }],
            m: "x^2 + 9x + 20", say: "$5x + 4x = 9x$." }],
        why: "Split, multiply, combine. Now one where a coefficient is not 1." },
      { type: "expr", kicker: "On your own", prompt: "Multiply $(2x + 1)(x + 3)$.", answer: "2x^2+7x+3", shown: "2x^2 + 7x + 3", form: "simplified", skill: "Multiply binomials",
        near: [{ v: "2x^2+3", fb: "Don't forget the middle products: $6x$ and $x$." }, { v: "2x^2+6x+3", fb: "There's also $1 \\cdot x$: $6x + x = 7x$." }],
        keys: KEYS_POLY, hints: ["$2x \\cdot x$, $2x \\cdot 3$, $1 \\cdot x$, $1 \\cdot 3$."], why: "$2x^2 + 6x + x + 3 = 2x^2 + 7x + 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A minus sign travels with its term.$$(x - 4)(x + 3)$$",
        scene: { type: "walk", how: HOW_6_2, rows: [
          { step: 1, m: "(x - 4)(x + 3)", say: "The parts are $x$ and $-4$, then $x$ and 3." },
          { step: 2, m: "x^2 + 3x - 4x - 12", say: "$-4 \\cdot x = -4x$ and $-4 \\cdot 3 = -12$." },
          { step: 3, m: "x^2 - x - 12", say: "$3x - 4x = -x$." }] },
        gate: true },
      { type: "expr", kicker: "Try it", prompt: "Multiply $(x - 5)(x + 2)$.", answer: "x^2-3x-10", shown: "x^2 - 3x - 10", form: "simplified", skill: "Multiply binomials",
        near: [{ v: "x^2-10", fb: "That's only the first and last products. The two middle ones, $2x$ and $-5x$, are missing." }, { v: "x^2+3x-10", fb: "$2x + (-5x) = -3x$." }, { v: "x^2-7x-10", fb: "$2x - 5x$ is $-3x$." }],
        keys: KEYS_POLY, hints: ["Four products: $x \\cdot x$, $x \\cdot 2$, $-5 \\cdot x$, $-5 \\cdot 2$."], why: "$x^2 + 2x - 5x - 10 = x^2 - 3x - 10$." },
      { type: "slots", prompt: "Match each product to its expansion.",
        slots: [{ id: "a", label: "$(x + 5)^2$" }, { id: "b", label: "$(x - 5)^2$" }, { id: "c", label: "$(x + 5)(x - 5)$" }],
        cards: [{ t: "$x^2 + 10x + 25$", slot: "a", fb: "Twice $5x$ in the middle." }, { t: "$x^2 - 10x + 25$", slot: "b", fb: "Twice $-5x$, and $(-5)^2 = +25$." }, { t: "$x^2 - 25$", slot: "c", fb: "The middle terms cancel." }, { t: "$x^2 + 25$" }],
        skill: "Special products", hints: ["Squaring gives a middle term. Sum times difference doesn't."], why: "$x^2 + 25$ is none of them: squaring a binomial always produces a middle term." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran expands a square. Tap the line where his work **first** goes wrong.",
        lines: ["(x + 3)^2 = (x + 3)(x + 3)", "x^2 + 3^2", "x^2 + 9"], answer: 1, fix: "x^2 + 3x + 3x + 9",
        fb: { 0: "Squaring means multiplying the bracket by itself. Right.", 2: "$3^2$ is 9, so this follows from the line above. The slip came earlier." },
        skill: "Special products", hints: ["How many products do two binomials make?"],
        why: "Two binomials make four products: $x^2 + 3x + 3x + 9 = x^2 + 6x + 9$. The middle term is easy to lose." },
      { type: "expr", kicker: "Use it", prompt: "A garden is $x + 6$ metres long and $x + 2$ metres wide. Write its **area** as a polynomial.", answer: "x^2+8x+12", shown: "x^2 + 8x + 12", form: "simplified", skill: "Multiply binomials",
        near: [{ v: "x^2+12", fb: "Two more regions: $2x$ and $6x$." }, { v: "2x+8", fb: "That adds the sides. Area multiplies them." }], keys: KEYS_POLY,
        hints: ["Area = length × width."], why: "$(x + 6)(x + 2) = x^2 + 2x + 6x + 12 = x^2 + 8x + 12$." }
    ]
  });

  /* ============================================ 6.3 · Dividing polynomials */
  var HOW_6_3 = [["Divide", "Divide the first term of what is left by the first term of the divisor."], ["Multiply", "Multiply the divisor by that result."], ["Subtract", "Subtract, to see what is left."], ["Repeat", "Do it again, until nothing is left or only a remainder."]];
  LESSONS.push({
    title: "Dividing polynomials",
    blurb: "Book 6.3 · Division undoes multiplication. And a quick test tells you whether x − c divides exactly.",
    mins: 12, v: 3,
    steps: [
      { type: "expr", kicker: "Warm up", prompt: "$3x$ times something makes $6x^3 + 9x^2$. What is the something?$$\\frac{6x^3 + 9x^2}{3x}$$", answer: "2x^2+3x", shown: "2x^2 + 3x", form: "simplified", skill: "Divide by a monomial",
        near: [{ v: "2x^2+9x^2", fb: "Divide *both* terms by $3x$, not just the first." }, { v: "2x^3+3x^2", fb: "Dividing by $x$ lowers each exponent by 1." }], keys: KEYS_POLY,
        hints: ["Divide each term separately: $\\frac{6x^3}{3x}$ and $\\frac{9x^2}{3x}$."], why: "$\\frac{6x^3}{3x} = 2x^2$ and $\\frac{9x^2}{3x} = 3x$." },
      { type: "learn", kicker: "The idea",
        prompt: "Division undoes multiplication. Dividing by a binomial works like long division with numbers: divide, multiply, subtract, then repeat with what is left.",
        scene: { type: "method", how: HOW_6_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a long division.$$(x^2 + 5x + 6) \\div (x + 2)$$",
        scene: { type: "walk", how: HOW_6_3, rows: [
          { step: 1, m: "x^2 \\div x = x", say: "The first term of $x^2 + 5x + 6$, divided by the first term of $x + 2$." },
          { step: 2, m: "x(x + 2) = x^2 + 2x", say: "Multiply the divisor by that $x$." },
          { step: 3, m: "(x^2 + 5x + 6) - (x^2 + 2x) = 3x + 6", say: "Subtract. This is what is left.",
            ask: { prompt: "After subtracting, $3x + 6$ is left. What next?", answer: 0,
                   options: [{ t: "Divide $3x$ by $x$" }, { t: "Stop. That is the remainder", fb: "$3x + 6$ can still be divided by $x + 2$. A remainder has a lower power than the divisor." }] } },
          { step: 4, m: "3x \\div x = 3", say: "Repeat with what is left." },
          { step: 4, m: "(3x + 6) - 3(x + 2) = 0", say: "Nothing is left. The quotient is $x + 3$." }] },
        gate: true,
        then: "$(x^2 + 5x + 6) \\div (x + 2) = x + 3$. Check: $(x + 2)(x + 3) = x^2 + 5x + 6$ ✓." },
      { type: "guided", kicker: "Together",
        prompt: "Now you divide.$$(x^2 + 7x + 12) \\div (x + 3)$$",
        how: HOW_6_3, skill: "Divide polynomials",
        steps: [
          { step: 1, ask: "Divide $x^2$ by $x$.", type: "choice", answer: 0,
            options: [{ t: "$x$" }, { t: "$x^2$", fb: "Dividing by $x$ removes one factor of $x$." }, { t: "1", fb: "$x^2 \\div x$ leaves one $x$." }],
            m: "x^2 \\div x = x", say: "The first term of the quotient." },
          { step: 2, ask: "Multiply $x$ by the divisor, $x + 3$.", type: "choice", answer: 0,
            options: [{ t: "$x^2 + 3x$" }, { t: "$x^2 + 3$", fb: "The $x$ multiplies both terms: $x \\cdot 3 = 3x$." }],
            m: "x(x + 3) = x^2 + 3x", say: "Multiply the whole divisor." },
          { step: 3, ask: "Subtract that from $x^2 + 7x + 12$. What is left?", type: "choice", answer: 0,
            options: [{ t: "$4x + 12$" }, { t: "$10x + 12$", fb: "Subtract: $7x - 3x$, not $7x + 3x$." }, { t: "$4x$", fb: "The 12 is still there." }],
            m: "(x^2 + 7x + 12) - (x^2 + 3x) = 4x + 12", say: "$7x - 3x = 4x$, and the 12 comes down." },
          { step: 4, ask: "Repeat: $4x \\div x$ is what number?", type: "num", answer: 4, hint: "Remove the $x$.", m: "4x \\div x = 4", say: "The next term of the quotient." },
          { step: 4, ask: "$4(x + 3) = 4x + 12$. Subtract it from $4x + 12$. What is the quotient?", type: "choice", answer: 0,
            options: [{ t: "Nothing is left. The quotient is $x + 4$" }, { t: "12 is left over", fb: "$4x + 12$ minus $4x + 12$ is 0." }],
            m: "(4x + 12) - 4(x + 3) = 0", say: "It divides exactly: $x + 4$." }],
        why: "Divide, multiply, subtract, repeat. Now one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Divide: $(x^2 + 6x + 8) \\div (x + 2)$.",
        answer: "x+4", shown: "x + 4", skill: "Divide polynomials",
        near: [{ v: "x+6", fb: "After the first step, $6x - 2x = 4x$ is left with the 8." }, { v: "x+8", fb: "Subtract $x^2 + 2x$ first. What is left is $4x + 8$." }], keys: KEYS_POLY,
        hints: ["Step 1: $x^2 \\div x = x$.", "Step 3: $(x^2 + 6x + 8) - (x^2 + 2x) = 4x + 8$."], why: "$x + 4$. Check: $(x + 2)(x + 4) = x^2 + 6x + 8$ ✓." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes something is left over.$$(x^2 + 5x + 7) \\div (x + 2)$$",
        scene: { type: "walk", how: HOW_6_3, rows: [
          { step: 1, m: "x^2 \\div x = x", say: "The first term of the quotient." },
          { step: 3, m: "(x^2 + 5x + 7) - (x^2 + 2x) = 3x + 7", say: "Multiply and subtract, as before." },
          { step: 4, m: "(3x + 7) - 3(x + 2) = 1", say: "This time 1 is left over: the **remainder**." },
          { step: 4, m: "P(-2) = 4 - 10 + 7 = 1", say: "A shortcut: put $x = -2$ into the polynomial and you get the remainder at once. A remainder of 0 means the divisor is a **factor**." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Is $(x - 3)$ a factor of $x^2 - x - 6$?",
        options: [{ t: "Yes: $P(3) = 9 - 3 - 6 = 0$." }, { t: "No: $P(3) = 6$.", fb: "$3^2 - 3 - 6 = 9 - 9 = 0$." }, { t: "No: $P(-3) = 6$.", fb: "For the factor $(x - 3)$, test $c = 3$, the value that makes it zero." }],
        answer: 0, skill: "Factor theorem", hints: ["Substitute the number that makes $x - 3$ equal 0."], why: "$P(3) = 0$, so $(x - 3)$ divides exactly: $x^2 - x - 6 = (x - 3)(x + 2)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To test whether $(x + 2)$ is a factor of $P(x)$, Kiran works out $P(2)$. What is wrong?",
        options: [{ t: "$(x + 2)$ is $x - (-2)$, so the number to try is $-2$." },
                  { t: "He should work out $P(0)$.", fb: "$P(0)$ tests the divisor $x$, not $x + 2$." },
                  { t: "Nothing. $P(2)$ is the test.", fb: "$P(2)$ tests the divisor $(x - 2)$." }],
        answer: 0, skill: "Factor theorem", hints: ["Which value of $x$ makes $x + 2$ equal to 0?"],
        why: "The test value is the one that makes the divisor zero: $x = -2$." },
      { type: "multi", kicker: "Use it", prompt: "Which are factors of $P(x) = x^2 - 4x - 5$?",
        options: [{ t: "$(x - 5)$", ok: true }, { t: "$(x + 1)$", ok: true }, { t: "$(x - 1)$", fb: "$P(1) = 1 - 4 - 5 = -8$, not 0." }, { t: "$(x + 5)$", fb: "$P(-5) = 25 + 20 - 5 = 40$, not 0." }],
        skill: "Factor theorem", hints: ["For $(x - c)$ test $P(c)$. For $(x + c)$ test $P(-c)$."], why: "$P(5) = 0$ and $P(-1) = 0$: $x^2 - 4x - 5 = (x - 5)(x + 1)$." }
    ]
  });

  /* ============================================ 6.4 · GCF and grouping */
  var HOW_6_4 = [["Find it", "Find the greatest factor that every term shares: the numbers first, then the letters."], ["Divide", "Divide each term by it."], ["Write", "Write the GCF outside a bracket and the quotients inside."], ["Check", "Multiply back."]];
  LESSONS.push({
    title: "Greatest common factor and factor by grouping",
    blurb: "Book 6.4 · Factoring runs multiplication backwards. Start with what every term shares.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is the largest number that divides both 12 and 18?", answer: 6, skill: "Greatest common factor",
        near: [{ v: 3, fb: "3 divides both, but so does a bigger number." }, { v: 2, fb: "2 works, but there's a larger one." }, { v: 36, fb: "36 is a common *multiple*. A factor divides into the numbers." }],
        hints: ["Factors of 12: 1, 2, 3, 4, 6, 12."], why: "6 divides both, and nothing bigger does. It is their **greatest common factor**, or GCF." },
      { type: "learn", kicker: "The idea",
        prompt: "Factoring runs multiplication **backwards**: from a sum to a product. Always begin with what every term shares, the **greatest common factor**, or GCF.",
        scene: { type: "method", how: HOW_6_4 } },
      { type: "learn", kicker: "Explore", prompt: "Factoring out the GCF is the area model **backwards**: you know the area and one side.",
        scene: { type: "tiles", mode: "area", rows: ["3x"], cols: ["2x", "3"], cells: [["6x^2", "9x"]], rh: [90], cw: [150, 110], readout: "$6x^2 + 9x = 3x(2x + 3)$", gate: true }, gate: true,
        then: "The GCF, $3x$, is one side. Dividing each term by it gives the other side: $2x + 3$. Check by multiplying back." },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the GCF taken out.$$6x^2 + 9x$$",
        scene: { type: "walk", how: HOW_6_4, rows: [
          { step: 1, m: "3", say: "Numbers first: the largest number that divides 6 and 9 is 3." },
          { step: 1, m: "3x", say: "Both terms also contain at least one $x$. So the GCF is $3x$.",
            ask: { prompt: "$6x^2$ and $9x$ both divide by 3. What else do they share?", answer: 0,
                   options: [{ t: "One $x$" }, { t: "$x^2$", fb: "$9x$ has only one $x$, so $x^2$ is not shared." }] } },
          { step: 2, m: "6x^2 \\div 3x = 2x, \\quad 9x \\div 3x = 3", say: "Divide each term by the GCF." },
          { step: 3, m: "3x(2x + 3)", say: "GCF outside, quotients inside." },
          { step: 4, m: "3x \\cdot 2x + 3x \\cdot 3 = 6x^2 + 9x", say: "Multiply back ✓." }] },
        gate: true,
        then: "The GCF is one side of the rectangle. Dividing by it gives the other side." },
      { type: "guided", kicker: "Together",
        prompt: "Now you factor out the GCF.$$8x^2 + 12x$$",
        how: HOW_6_4, skill: "Factor out the GCF",
        steps: [
          { step: 1, ask: "What is the GCF of $8x^2$ and $12x$?", type: "choice", answer: 0,
            options: [{ t: "$4x$" }, { t: "$2x$", fb: "$2x$ divides both, but a bigger factor does too." }, { t: "$4x^2$", fb: "$12x$ has only one $x$." }],
            m: "4x", say: "4 is the largest number dividing 8 and 12, and both terms contain $x$." },
          { step: 2, ask: "Divide each term by $4x$. What do you get?", type: "choice", answer: 0,
            options: [{ t: "$2x$ and 3" }, { t: "$2x^2$ and $3x$", fb: "Divide by $4x$, not just by 4." }, { t: "2 and 3", fb: "$8x^2 \\div 4x$ leaves one $x$: $2x$." }],
            m: "8x^2 \\div 4x = 2x, \\quad 12x \\div 4x = 3", say: "The quotients." },
          { step: 3, ask: "Write the factored form.", type: "choice", answer: 0,
            options: [{ t: "$4x(2x + 3)$" }, { t: "$4x(2x) + 3$", fb: "Both quotients go inside the bracket." }],
            m: "4x(2x + 3)", say: "GCF outside, quotients inside." },
          { step: 4, ask: "Check by multiplying back. What is $4x \\cdot 3$?", type: "choice", answer: 0,
            options: [{ t: "$12x$" }, { t: "12", fb: "The $x$ is still there: $4x \\cdot 3 = 12x$." }],
            m: "4x(2x + 3) = 8x^2 + 12x", say: "It matches ✓." }],
        why: "Find it, divide, write, check. Now one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Factor out the GCF: $6x^2 + 10x = 2x(\\;\\square\\;)$. What goes in the bracket?",
        answer: "3x+5", shown: "3x + 5", skill: "Factor out the GCF",
        near: [{ v: "3x^2+5x", fb: "Divide by $2x$, not just by 2." }, { v: "3x+10", fb: "Divide the second term too: $10x \\div 2x$." }], keys: KEYS_POLY,
        hints: ["$6x^2 \\div 2x$ and $10x \\div 2x$."], why: "$6x^2 \\div 2x = 3x$ and $10x \\div 2x = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Four terms, and no factor common to all of them? Try **grouping** them in pairs.$$x^3 + 2x^2 + 3x + 6$$",
        scene: { type: "walk", how: HOW_6_4, rows: [
          { step: 1, m: "(x^3 + 2x^2) + (3x + 6)", say: "Group in pairs. Each pair has its own GCF: $x^2$ and 3." },
          { step: 3, m: "x^2(x + 2) + 3(x + 2)", say: "Factor each pair. Now both parts share the bracket $(x + 2)$." },
          { step: 3, m: "(x + 2)(x^2 + 3)", say: "Take out that common bracket." },
          { step: 4, m: "x^3 + 3x + 2x^2 + 6", say: "Multiply back: the same four terms ✓." }] },
        gate: true },
      { type: "expr", kicker: "Try it", prompt: "Factor by grouping: $xy + 3x + 2y + 6 = (x + 2)(\\;\\square\\;)$.", answer: "y+3", shown: "y + 3", skill: "Factor by grouping",
        keys: [["$x$", "x"], ["$y$", "y"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "x+3", fb: "From $xy + 3x$ you take out $x$, leaving $(y + 3)$." }],
        hints: ["$xy + 3x = x(y + 3)$ and $2y + 6 = 2(y + 3)$."], why: "$x(y + 3) + 2(y + 3) = (x + 2)(y + 3)$." },
      { type: "choice", prompt: "Can $3x + 7$ be factored?",
        options: [{ t: "No. Its terms share no factor except 1: it is **prime**." }, { t: "Yes: $3(x + 7)$", fb: "$3(x + 7) = 3x + 21$. 3 doesn't divide 7." }, { t: "Yes: $x(3 + 7)$", fb: "7 has no $x$ in it." }],
        answer: 0, skill: "Greatest common factor", hints: ["What divides both 3x and 7?"], why: "A polynomial that can't be factored is called prime, like a prime number." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran factors $12x^2 + 8x$. His answer multiplies back correctly, but he was asked for the **greatest** common factor. Tap the line that falls short.",
        lines: ["\\text{GCF} = 2x", "12x^2 \\div 2x = 6x, \\quad 8x \\div 2x = 4", "2x(6x + 4)"], answer: 0, fix: "\\text{GCF} = 4x",
        fb: { 1: "Those divisions are right for $2x$. The trouble is the factor he chose.", 2: "This follows from his GCF. The trouble started earlier." },
        skill: "Factor out the GCF", hints: ["Look inside his bracket. Do $6x$ and 4 still share a factor?"],
        why: "$6x + 4$ still shares a 2, so $2x$ was not the greatest. The GCF is $4x$: $4x(3x + 2)$." },
      { type: "expr", kicker: "Use it", prompt: "A rectangle has area $10x^2 + 15x$ and width $5x$. What is its length?", answer: "2x+3", shown: "2x + 3", skill: "Factor out the GCF",
        near: [{ v: "2x^2+3x", fb: "Divide by $5x$, not just by 5." }], keys: KEYS_POLY, hints: ["Area ÷ width."], why: "$10x^2 + 15x = 5x(2x + 3)$." }
    ]
  });

  /* ============================================ 6.5 · Factor trinomials */
  var HOW_6_5 = [["Read", "In $x^2 + bx + c$, note $b$ and $c$."], ["Pairs", "List the pairs of numbers that multiply to $c$."], ["Pick", "Pick the pair that adds to $b$."], ["Write", "Write $(x + p)(x + q)$. Multiply to check."]];
  LESSONS.push({
    title: "Factor trinomials",
    blurb: "Book 6.5 · Find two numbers that multiply to the last term and add to the middle one.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up",
        prompt: "Multiply.$$(x + 2)(x + 6)$$",
        options: [{ t: "$x^2 + 8x + 12$" }, { t: "$x^2 + 12x + 8$", fb: "The $x$ terms are $6x$ and $2x$: together $8x$. The number is $2 \\cdot 6 = 12$." }, { t: "$x^2 + 12$", fb: "The two middle products, $6x$ and $2x$, are missing." }],
        answer: 0, skill: "Factor a trinomial", hints: ["Four products: $x^2$, $6x$, $2x$ and 12."],
        why: "$x^2 + 6x + 2x + 12 = x^2 + 8x + 12$." },
      { type: "learn", kicker: "The idea",
        prompt: "Look at where the 8 and the 12 came from: $2 + 6$ and $2 \\cdot 6$. To factor $x^2 + bx + c$, run that backwards. Find two numbers that **multiply** to $c$ and **add** to $b$.",
        scene: { type: "method", how: HOW_6_5 } },
      { type: "tiles", kicker: "Explore", prompt: "Arrange $x^2 + 7x + 12$ into a rectangle: choose $p$ and $q$ so the tiles match exactly.",
        mode: "factor", target: { b: 7, c: 12 }, p: 1, q: 1, min: 0, answer: [3, 4], skill: "Factor a trinomial",
        hints: ["You need 7 $x$-tiles in total and 12 unit tiles in the corner.", "Which two numbers multiply to 12 and add to 7?"], why: "$(x + 3)(x + 4)$: $3 + 4 = 7$ $x$-tiles and $3 \\times 4 = 12$ units." },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a trinomial factored.$$x^2 + 9x + 20$$",
        scene: { type: "walk", how: HOW_6_5, rows: [
          { step: 1, m: "b = 9, \\; c = 20", say: "The two numbers must multiply to 20 and add to 9." },
          { step: 2, m: "1 \\cdot 20, \\quad 2 \\cdot 10, \\quad 4 \\cdot 5", say: "The pairs that multiply to 20." },
          { step: 3, m: "4 + 5 = 9", say: "This pair adds to 9.",
            ask: { prompt: "Which pair adds to 9?", answer: 0,
                   options: [{ t: "4 and 5" }, { t: "2 and 10", fb: "$2 + 10 = 12$." }, { t: "1 and 20", fb: "$1 + 20 = 21$." }] } },
          { step: 4, m: "(x + 4)(x + 5)", say: "Check: $x^2 + 5x + 4x + 20 = x^2 + 9x + 20$ ✓." }] },
        gate: true,
        then: "$x^2 + bx + c = (x + p)(x + q)$, where $p \\cdot q = c$ and $p + q = b$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you factor one.$$x^2 + 8x + 12$$",
        how: HOW_6_5, skill: "Factor a trinomial",
        steps: [
          { step: 1, ask: "What must the two numbers do?", type: "choice", answer: 0,
            options: [{ t: "Multiply to 12 and add to 8" }, { t: "Multiply to 8 and add to 12", fb: "The last term is the product. The middle coefficient is the sum." }],
            m: "b = 8, \\; c = 12", say: "Product 12, sum 8." },
          { step: 2, ask: "Which list has every pair that multiplies to 12?", type: "choice", answer: 0,
            options: [{ t: "1 and 12, 2 and 6, 3 and 4" }, { t: "2 and 6, 3 and 4", fb: "$1 \\cdot 12$ is a pair too." }, { t: "6 and 6", fb: "$6 \\cdot 6$ is 36." }],
            m: "1 \\cdot 12, \\quad 2 \\cdot 6, \\quad 3 \\cdot 4", say: "Every pair, so that none is missed." },
          { step: 3, ask: "Which pair adds to 8?", type: "choice", answer: 0,
            options: [{ t: "2 and 6" }, { t: "3 and 4", fb: "$3 + 4 = 7$." }, { t: "1 and 12", fb: "$1 + 12 = 13$." }],
            m: "2 + 6 = 8", say: "The pair we need." },
          { step: 4, ask: "Write the factors.", type: "choice", answer: 0,
            options: [{ t: "$(x + 2)(x + 6)$" }, { t: "$(x + 8)(x + 12)$", fb: "8 and 12 are the sum and the product. The brackets hold the two numbers themselves." }, { t: "$(x + 2)(x - 6)$", fb: "That gives $-12$ at the end. Both numbers are positive here." }],
            m: "(x + 2)(x + 6)", say: "Check: $x^2 + 8x + 12$ ✓." }],
        why: "Read, pairs, pick, write. Now factor one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Factor $x^2 + 10x + 21$.", answer: "(x+3)(x+7)", shown: "(x + 3)(x + 7)", form: "factored", skill: "Factor a trinomial", keys: KEYS_POLY,
        near: [], hints: ["Step 2: the pairs for 21 are 1 and 21, 3 and 7.", "Step 3: which pair adds to 10?"], why: "$3 \\cdot 7 = 21$ and $3 + 7 = 10$: $(x + 3)(x + 7)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "With a **negative** last term, one number is positive and the other negative.$$x^2 - 3x - 10$$",
        scene: { type: "walk", how: HOW_6_5, rows: [
          { step: 1, m: "b = -3, \\; c = -10", say: "Multiply to $-10$, add to $-3$." },
          { step: 2, m: "1 \\cdot (-10), \\quad -1 \\cdot 10, \\quad 2 \\cdot (-5), \\quad -2 \\cdot 5", say: "A negative product needs one positive number and one negative." },
          { step: 3, m: "2 + (-5) = -3", say: "This pair adds to $-3$." },
          { step: 4, m: "(x + 2)(x - 5)", say: "Check the middle term: $-5x + 2x = -3x$ ✓." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "With a negative last term, the two numbers have opposite signs. Which two multiply to $-15$ and add to $2$?", answer: [5, -3], skill: "Factor a trinomial", placeholder: "e.g. 4, -1",
        hints: ["Pairs for 15: 1 and 15, 3 and 5. One of them must be negative."], why: "$5 \\times -3 = -15$ and $5 + (-3) = 2$." },
      { type: "expr", prompt: "Factor $x^2 + 2x - 15$.", answer: "(x+5)(x-3)", shown: "(x + 5)(x - 3)", form: "factored", skill: "Factor a trinomial", keys: KEYS_POLY,
        hints: ["$(x + 5)(x - 3)$ or the other way round?"], why: "$(x + 5)(x - 3) = x^2 - 3x + 5x - 15 = x^2 + 2x - 15$." },
      { type: "learn", kicker: "Explore", prompt: "When the first coefficient isn't 1, use the **ac method**: multiply $a$ and $c$, split the middle term, then group.",
        scene: { type: "walk", rows: [
          { m: "2x^2 + 7x + 3", say: "$a \\cdot c = 2 \\cdot 3 = 6$. Find two numbers that multiply to 6 and add to 7: 6 and 1." },
          { m: "2x^2 + 6x + x + 3", say: "Split $7x$ into $6x + x$." },
          { m: "2x(x + 3) + 1(x + 3)", say: "Group in pairs and factor each." },
          { m: "(2x + 1)(x + 3)", say: "Take out the common bracket." }] },
        gate: true },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran factors $x^2 + 7x + 10$. Tap the line where his work **first** goes wrong.",
        lines: ["2 \\cdot 5 = 10", "2 + 5 = 7", "(x + 7)(x + 10)"], answer: 2, fix: "(x + 2)(x + 5)",
        fb: { 0: "2 and 5 do multiply to 10. Right.", 1: "2 and 5 do add to 7. Right." },
        skill: "Factor a trinomial", hints: ["Which numbers go in the brackets: the pair, or the sum and product?"],
        why: "The brackets hold the pair he found: $(x + 2)(x + 5)$. 7 and 10 are only what they add and multiply to." },
      { type: "expr", kicker: "Use it", prompt: "Factor $3x^2 + 10x + 8$.", answer: "(3x+4)(x+2)", shown: "(3x + 4)(x + 2)", form: "factored", skill: "Factor a trinomial", keys: KEYS_POLY,
        hints: ["$a \\cdot c = 24$. Two numbers that multiply to 24 and add to 10?", "$3x^2 + 6x + 4x + 8$."], why: "$3x(x + 2) + 4(x + 2) = (3x + 4)(x + 2)$." }
    ]
  });

  /* ============================================ 6.6 · Factor special products */
  var HOW_6_6 = [["Squares?", "Check that the first and last terms are perfect squares."], ["Roots", "Take their square roots. Call them $a$ and $b$."], ["Middle", "Three terms: is the middle term $2ab$? Two terms: is it a **difference**?"], ["Write", "Perfect square: $(a + b)^2$ or $(a - b)^2$. Difference of squares: $(a + b)(a - b)$."]];
  LESSONS.push({
    title: "Factor special products",
    blurb: "Book 6.6 · Recognise a perfect square and a difference of squares, and factor them on sight.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up",
        prompt: "Multiply.$$(x + 3)(x + 3)$$",
        options: [{ t: "$x^2 + 6x + 9$" }, { t: "$x^2 + 9$", fb: "The two middle products, $3x$ and $3x$, are missing." }, { t: "$x^2 + 3x + 9$", fb: "There are two middle products: $3x + 3x = 6x$." }],
        answer: 0, skill: "Perfect square trinomials", hints: ["Four products: $x^2$, $3x$, $3x$ and 9."],
        why: "$x^2 + 3x + 3x + 9 = x^2 + 6x + 9$." },
      { type: "tiles", kicker: "Explore", prompt: "Arrange $x^2 + 6x + 9$ into a rectangle. What do you notice about its shape?",
        mode: "factor", target: { b: 6, c: 9 }, p: 1, q: 1, min: 0, answer: [3, 3], skill: "Perfect square trinomials",
        hints: ["Two numbers that multiply to 9 and add to 6."], why: "$(x + 3)(x + 3)$: both sides are the same. The rectangle is a **square**." },
      { type: "learn", kicker: "The idea",
        prompt: "Some polynomials come from special products, and you can factor them on sight. $x^2 + 6x + 9$ makes a **square**: $(x + 3)^2$. Its first and last terms are squares, and its middle term is twice the product of their roots.",
        scene: { type: "method", how: HOW_6_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a perfect square recognised.$$x^2 + 10x + 25$$",
        scene: { type: "walk", how: HOW_6_6, rows: [
          { step: 1, m: "x^2 = (x)^2, \\quad 25 = 5^2", say: "The first and last terms are perfect squares." },
          { step: 2, m: "a = x, \\; b = 5", say: "Their square roots." },
          { step: 3, m: "2 \\cdot x \\cdot 5 = 10x", say: "Twice the product of the roots matches the middle term.",
            ask: { prompt: "The roots are $x$ and 5. What should the middle term be for a perfect square?", answer: 0,
                   options: [{ t: "$10x$" }, { t: "$5x$", fb: "It is **twice** the product: $2 \\cdot x \\cdot 5$." }] } },
          { step: 4, m: "(x + 5)^2", say: "A perfect square trinomial." }] },
        gate: true,
        then: "$a^2 + 2ab + b^2 = (a + b)^2$ and $a^2 - 2ab + b^2 = (a - b)^2$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you test one.$$x^2 - 14x + 49$$",
        how: HOW_6_6, skill: "Perfect square trinomials",
        steps: [
          { step: 1, ask: "Are the first and last terms perfect squares?", type: "choice", answer: 0,
            options: [{ t: "Yes: $x^2$ and $7^2$" }, { t: "No", fb: "$49 = 7 \\cdot 7$, and $x^2 = x \\cdot x$." }],
            m: "x^2 = (x)^2, \\quad 49 = 7^2", say: "Both are squares." },
          { step: 2, ask: "What is the square root of 49?", type: "num", answer: 7, hint: "Which number times itself is 49?", m: "a = x, \\; b = 7", say: "The roots are $x$ and 7." },
          { step: 3, ask: "Is the middle term twice the product of the roots?", type: "choice", answer: 0,
            options: [{ t: "Yes: $2 \\cdot x \\cdot 7 = 14x$, with a minus sign" }, { t: "No", fb: "$2 \\cdot x \\cdot 7$ is $14x$. The middle term is $-14x$: the same size." }],
            m: "2 \\cdot x \\cdot 7 = 14x", say: "It matches, and the sign is minus." },
          { step: 4, ask: "Write the factored form.", type: "choice", answer: 0,
            options: [{ t: "$(x - 7)^2$" }, { t: "$(x + 7)^2$", fb: "That gives $+14x$ in the middle." }, { t: "$(x - 7)(x + 7)$", fb: "That has no middle term: it is $x^2 - 49$." }],
            m: "(x - 7)^2", say: "A minus in the middle gives a minus in the bracket." }],
        why: "Squares, roots, middle, write. Now sort some trinomials." },
      { type: "sort", kicker: "On your own", prompt: "Perfect square trinomial, or not?",
        bins: ["Perfect square", "Not"],
        cards: [{ t: "$x^2 + 10x + 25$", bin: 0, fb: "$25 = 5^2$ and $10x = 2 \\cdot 5 \\cdot x$." }, { t: "$x^2 + 10x + 16$", bin: 1, fb: "$16 = 4^2$, but twice $4x$ is $8x$, not $10x$." },
                { t: "$x^2 - 8x + 16$", bin: 0, fb: "$(x - 4)^2$." }, { t: "$x^2 + 9$", bin: 1, fb: "No middle term at all." }, { t: "$4x^2 + 12x + 9$", bin: 0, fb: "$(2x)^2$, $3^2$, and $2 \\cdot 2x \\cdot 3 = 12x$." }],
        skill: "Perfect square trinomials", hints: ["Take the roots of the first and last terms. Is the middle term twice their product?"], why: "First and last terms square, middle term twice the product of the roots." },
      { type: "learn", kicker: "A harder case",
        prompt: "The other special product has only **two** terms.$$x^2 - 36$$",
        scene: { type: "walk", how: HOW_6_6, rows: [
          { step: 1, m: "x^2 = (x)^2, \\quad 36 = 6^2", say: "Two terms, both perfect squares." },
          { step: 2, m: "a = x, \\; b = 6", say: "Their square roots." },
          { step: 3, m: "x^2 - 36", say: "No middle term, and the squares are **subtracted**: a difference of squares." },
          { step: 4, m: "(x + 6)(x - 6)", say: "Check: $x^2 - 6x + 6x - 36$. The middle terms cancel ✓." }] },
        gate: true },
      { type: "expr", kicker: "Try it", prompt: "Factor $x^2 - 64$.", answer: "(x+8)(x-8)", shown: "(x + 8)(x - 8)", form: "factored", skill: "Difference of squares", keys: KEYS_POLY,
        hints: ["$64 = 8^2$."], why: "$(x + 8)(x - 8) = x^2 - 64$." },
      { type: "choice", prompt: "What about $x^2 + 25$, a **sum** of squares?",
        options: [{ t: "It can't be factored with real numbers." }, { t: "$(x + 5)^2$", fb: "$(x + 5)^2 = x^2 + 10x + 25$. There's a middle term." }, { t: "$(x + 5)(x - 5)$", fb: "That gives $x^2 - 25$." }],
        answer: 0, skill: "Difference of squares", hints: ["Multiply each option out and see what you get."], why: "A difference of squares factors. A sum of squares is prime." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran factors $x^2 + 16$ as $(x + 4)^2$. What is wrong?",
        options: [{ t: "$(x + 4)^2$ is $x^2 + 8x + 16$. It has a middle term, and $x^2 + 16$ does not." },
                  { t: "It should be $(x + 4)(x - 4)$.", fb: "That is $x^2 - 16$, a difference. This is a sum." },
                  { t: "Nothing. That is right.", fb: "Multiply it out: $(x + 4)(x + 4)$ makes four products." }],
        answer: 0, skill: "Difference of squares", hints: ["Expand $(x + 4)^2$ and compare."],
        why: "A **sum** of two squares cannot be factored with real numbers. Only a difference can." },
      { type: "expr", kicker: "Use it", prompt: "Factor $4x^2 - 25$.", answer: "(2x+5)(2x-5)", shown: "(2x + 5)(2x - 5)", form: "factored", skill: "Difference of squares", keys: KEYS_POLY,
        hints: ["$4x^2 = (2x)^2$ and $25 = 5^2$."], why: "$(2x)^2 - 5^2 = (2x + 5)(2x - 5)$." }
    ]
  });

  /* ============================================ 6.7 · General strategy */
  var HOW_6_7 = [["GCF", "Take out the greatest common factor, if there is one."], ["Count", "Count the terms that are left."], ["Method", "Two terms: difference of squares. Three: a trinomial. Four: grouping."], ["Again", "Look at each factor. Can it be factored further?"]];
  LESSONS.push({
    title: "General strategy for factoring polynomials",
    blurb: "Book 6.7 · One checklist for any polynomial: common factor first, then count the terms.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up",
        prompt: "What is the greatest common factor of $2x^2$ and 18?",
        options: [{ t: "2" }, { t: "$2x$", fb: "18 has no $x$ in it, so $x$ is not shared." }, { t: "18", fb: "18 does not divide $2x^2$." }],
        answer: 0, skill: "Choose a factoring method", hints: ["Which is the largest number that divides both 2 and 18?"],
        why: "2 divides both, and nothing larger does. The 18 has no $x$." },
      { type: "learn", kicker: "The idea",
        prompt: "You now have several ways to factor. One checklist tells you which to use, and when you are finished. A polynomial is **factored completely** when no factor can be factored again.",
        scene: { type: "method", how: HOW_6_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the checklist used.$$3x^2 - 12$$",
        scene: { type: "walk", how: HOW_6_7, rows: [
          { step: 1, m: "3(x^2 - 4)", say: "Both terms share a 3." },
          { step: 2, m: "2 \\text{ terms}", say: "Inside the bracket: $x^2$ and 4." },
          { step: 3, m: "x^2 - 4 = (x + 2)(x - 2)", say: "Two terms, both squares, subtracted.",
            ask: { prompt: "$x^2 - 4$ has two terms, both perfect squares, subtracted. Which method?", answer: 0,
                   options: [{ t: "Difference of squares" }, { t: "Grouping", fb: "Grouping is for four terms." }] } },
          { step: 4, m: "3(x + 2)(x - 2)", say: "No factor can be factored again. Finished." }] },
        gate: true,
        then: "Common factor first. Then let the number of terms choose the method." },
      { type: "guided", kicker: "Together",
        prompt: "Now you use the checklist.$$2x^2 + 14x + 24$$",
        how: HOW_6_7, skill: "Factor completely",
        steps: [
          { step: 1, ask: "Is there a common factor?", type: "choice", answer: 0,
            options: [{ t: "Yes: 2" }, { t: "Yes: $2x$", fb: "24 has no $x$ in it." }, { t: "No", fb: "2, 14 and 24 are all even." }],
            m: "2(x^2 + 7x + 12)", say: "Take out the 2." },
          { step: 2, ask: "How many terms are left inside the bracket?", type: "num", answer: 3, hint: "Count them: $x^2$, $7x$, 12.", m: "3 \\text{ terms}", say: "A trinomial." },
          { step: 3, ask: "Which two numbers multiply to 12 and add to 7?", type: "choice", answer: 0,
            options: [{ t: "3 and 4" }, { t: "2 and 6", fb: "$2 + 6 = 8$." }, { t: "1 and 12", fb: "$1 + 12 = 13$." }],
            m: "x^2 + 7x + 12 = (x + 3)(x + 4)", say: "Product 12, sum 7." },
          { step: 4, ask: "Can any factor be factored again?", type: "choice", answer: 0,
            options: [{ t: "No. It is factored completely" }, { t: "Yes", fb: "$x + 3$ and $x + 4$ have no common factor and nothing to split." }],
            m: "2(x + 3)(x + 4)", say: "Finished." }],
        why: "GCF, count, method, again. Now choose the method yourself." },
      { type: "sort", kicker: "On your own", prompt: "Which method would you reach for **first**?",
        bins: ["Take out a GCF", "Difference of squares", "Trinomial: two numbers", "Grouping"],
        cards: [{ t: "$5x^2 + 10x$", bin: 0, fb: "Both terms share $5x$." }, { t: "$x^2 - 49$", bin: 1, fb: "Two squares, subtracted." },
                { t: "$x^2 + 9x + 20$", bin: 2, fb: "Three terms: find numbers that multiply to 20 and add to 9." }, { t: "$x^3 + x^2 + 4x + 4$", bin: 3, fb: "Four terms: group in pairs." }],
        skill: "Choose a factoring method", hints: ["Is there a common factor? If not, how many terms are there?"], why: "The number of terms points to the method." },
      { type: "expr", prompt: "Two stages. First the GCF: $2x^2 - 18 = 2(\\;\\square\\;)$.", answer: "x^2-9", shown: "x^2 - 9", skill: "Factor completely", keys: KEYS_POLY,
        near: [{ v: "x^2-18", fb: "Divide both terms by 2." }], hints: ["$2x^2 \\div 2$ and $18 \\div 2$."], why: "$2(x^2 - 9)$." },
      { type: "expr", prompt: "$x^2 - 9$ can be factored again. Finish: $2x^2 - 18 = 2 \\cdot (\\;\\square\\;)$, fully factored.", answer: "(x+3)(x-3)", shown: "(x + 3)(x - 3)", form: "factored", skill: "Factor completely", keys: KEYS_POLY,
        hints: ["$x^2 - 9$ is a difference of squares."], why: "$2x^2 - 18 = 2(x + 3)(x - 3)$. Now nothing more can be factored: it is **factored completely**." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes the last step sends you round again.$$x^4 - 16$$",
        scene: { type: "walk", how: HOW_6_7, rows: [
          { step: 1, m: "x^4 - 16", say: "No common factor." },
          { step: 2, m: "2 \\text{ terms}", say: "Both are squares: $x^4 = (x^2)^2$ and $16 = 4^2$." },
          { step: 3, m: "(x^2 + 4)(x^2 - 4)", say: "A difference of squares." },
          { step: 4, m: "(x^2 + 4)(x + 2)(x - 2)", say: "$x^2 - 4$ is a difference of squares again. $x^2 + 4$, a sum of squares, is not." }] },
        gate: true },
      { type: "multi", kicker: "Try it", prompt: "Which of these are factored **completely**?",
        options: [{ t: "$3(x + 2)(x + 3)$", ok: true }, { t: "$(x + 7)(x - 7)$", ok: true },
                  { t: "$3(x^2 + 5x + 6)$", fb: "$x^2 + 5x + 6$ still factors, into $(x + 2)(x + 3)$." }, { t: "$(x^2 - 4)(x + 1)$", fb: "$x^2 - 4$ is a difference of squares." }],
        skill: "Factor completely", hints: ["Look inside every bracket. Could it be factored further?"], why: "Completely factored means no factor can be broken down again." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran factors $2x^2 - 8$ as $2(x^2 - 4)$ and says he is finished. What did he miss?",
        options: [{ t: "$x^2 - 4$ factors again: $2(x + 2)(x - 2)$." },
                  { t: "The common factor should be $2x$.", fb: "8 has no $x$ in it." },
                  { t: "Nothing. It is factored completely.", fb: "Run step 4 on $x^2 - 4$: two squares, subtracted." }],
        answer: 0, skill: "Factor completely", hints: ["Step 4: look at each factor again."],
        why: "$x^2 - 4$ is a difference of squares. Completely factored: $2(x + 2)(x - 2)$." },
      { type: "expr", kicker: "Use it", prompt: "Factor completely: $3x^2 + 15x + 18 = 3 \\cdot (\\;\\square\\;)$.", answer: "(x+2)(x+3)", shown: "(x + 2)(x + 3)", form: "factored", skill: "Factor completely", keys: KEYS_POLY,
        hints: ["Take out 3: $x^2 + 5x + 6$.", "Two numbers that multiply to 6 and add to 5."], why: "$3(x^2 + 5x + 6) = 3(x + 2)(x + 3)$." }
    ]
  });

  /* ============================================ Project 6 */
  LESSONS.push({
    title: "Project: Polynomials and rectangles",
    tag: "Project",
    blurb: "Book Project 6 · Design a patio: from its sides to its area, and back again.",
    mins: 9, v: 2,
    steps: [
      { type: "learn", kicker: "The brief",
        prompt: "You're designing a rectangular patio. You don't yet know one measurement, so call it $x$ metres. The patio will be $x + 5$ long and $x + 3$ wide." },
      { type: "expr", prompt: "Write the patio's **area** as a polynomial.", answer: "x^2+8x+15", shown: "x^2 + 8x + 15", form: "simplified", skill: "Multiply binomials", keys: KEYS_POLY,
        near: [{ v: "x^2+15", fb: "Include the two middle regions: $3x$ and $5x$." }], hints: ["$(x + 5)(x + 3)$."], why: "$x^2 + 3x + 5x + 15 = x^2 + 8x + 15$." },
      { type: "num", prompt: "If $x = 4$, what is the area in square metres?", post: "m²", answer: 63, skill: "Evaluate a polynomial",
        hints: ["Use either form: $(4 + 5)(4 + 3)$ or $4^2 + 8(4) + 15$."], why: "$9 \\times 7 = 63$, and $16 + 32 + 15 = 63$. Both forms agree, as they must." },
      { type: "tiles", prompt: "A second patio has area $x^2 + 9x + 14$. Find its sides: arrange the tiles into a rectangle.",
        mode: "factor", target: { b: 9, c: 14 }, p: 1, q: 1, min: 0, answer: [2, 7], skill: "Factor a trinomial",
        hints: ["Two numbers that multiply to 14 and add to 9."], why: "$(x + 2)(x + 7)$: the sides are $x + 2$ and $x + 7$." },
      { type: "explain", kicker: "Make it yours",
        prompt: "Design your own patio: choose two sides of the form $x + \\text{a number}$. Give its area as a polynomial, and explain how someone could get back from the area to your sides.",
        placeholder: "e.g. Sides x + 4 and x + 6. Area x² + 10x + 24. To get back…",
        model: "A good answer multiplies correctly and describes factoring: “Sides x + 4 and x + 6 give area x² + 10x + 24. To get back, look for two numbers that multiply to 24 and add to 10: 4 and 6.”" }
    ]
  });
  /* ================================================================ Skills */
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function bin(p) { return "(x " + signed(p) + ")"; }

  var SKILLS = [
    { id: "u6-add", title: "Add and subtract polynomials", lesson: 2,
      gen: function (R) {
        var a = R.int(1, 6), b = R.nz(-8, 8), c = R.nz(-9, 9), d = R.int(1, 5), e = R.nz(-8, 8), f = R.nz(-9, 9), sub = R.chance(0.5), s = sub ? -1 : 1;
        if (sub && a === d) a += 1;
        var A = a + s * d, B = b + s * e, C = c + s * f;
        return { type: "expr", prompt: (sub ? "Subtract." : "Add.") + " $$(" + quad(a, b, c) + ") " + (sub ? "-" : "+") + " (" + quad(d, e, f) + ")$$", answer: clean(quad(A, B, C)), shown: quad(A, B, C), form: "simplified", keys: KEYS_POLY,
          near: sub ? [{ v: clean(quad(a - d, b + e, c + f)), fb: "The minus sign applies to every term in the second bracket." }] : [],
          hints: [sub ? "Change the sign of every term in the second bracket, then combine like terms." : "Combine the $x^2$ terms, the $x$ terms and the numbers separately."],
          why: "$x^2$: $" + a + (sub ? " - " : " + ") + d + " = " + A + "$. &nbsp; $x$: $" + B + "$. &nbsp; Numbers: $" + C + "$. So $" + quad(A, B, C) + "$." };
      } },
    { id: "u6-eval", title: "Evaluate a polynomial function", lesson: 2,
      gen: function (R) {
        var a = R.pick([1, 1, 2, -1]), b = R.nz(-6, 6), c = R.int(-8, 8), k = R.nz(-4, 5), ans = a * k * k + b * k + c;
        return { type: "num", prompt: "For $P(x) = " + quad(a, b, c) + "$, find $P(" + k + ")$.", pre: "$P(" + k + ") =$", answer: ans,
          near: near(ans, [{ v: a * 2 * k + b * k + c, fb: "$x^2$ means $x \\cdot x$, not $2x$." }, { v: -a * k * k + b * k + c, fb: "Square first: $(" + k + ")^2 = " + k * k + "$." }]),
          hints: ["Replace each $x$ with $(" + k + ")$."], why: "$" + L.sub(quad(a, b, c), { x: k }) + " = " + ans + "$." };
      } },
    { id: "u6-mono", title: "Multiply monomials", lesson: 3,
      gen: function (R) {
        var c1 = R.nz(-6, 7), c2 = R.int(2, 6), a = R.int(1, 5), b = R.int(2, 5);
        function mono(c, e) { return (c === 1 ? "" : c === -1 ? "-" : c) + "x" + (e === 1 ? "" : "^" + e); }
        return { type: "expr", prompt: "Multiply. $$" + mono(c1, a) + " \\cdot " + mono(c2, b) + "$$", answer: c1 * c2 + "x^" + (a + b), shown: c1 * c2 + "x^" + (a + b), keys: [["$x$", "x"], ["$x^{\\square}$", "^"], ["$-$", "-"]],
          near: [{ v: c1 * c2 + "x^" + a * b, fb: "Multiplying powers *adds* the exponents." }, { v: (c1 + c2) + "x^" + (a + b), fb: "The coefficients are multiplied, not added." }],
          hints: ["Multiply the numbers. Add the exponents."], why: "$" + c1 + " \\cdot " + c2 + " = " + c1 * c2 + "$ and $x^{" + a + "} \\cdot x^{" + b + "} = x^{" + (a + b) + "}$." };
      } },
    { id: "u6-foil", title: "Multiply two binomials", lesson: 3,
      gen: function (R) {
        var p = R.nz(-8, 8), q = R.nz(-8, 8);
        return { type: "expr", prompt: "Multiply. $$" + bin(p) + bin(q) + "$$", answer: clean(quad(1, p + q, p * q)), shown: quad(1, p + q, p * q), form: "simplified", keys: KEYS_POLY,
          near: [{ v: clean(quad(1, 0, p * q)), fb: "That's the first and last products only. Add the two middle ones: $" + q + "x$ and $" + p + "x$." }],
          hints: ["Four products: first, outer, inner, last."], why: "$x^2 " + signed(q) + "x " + signed(p) + "x " + signed(p * q) + " = " + quad(1, p + q, p * q) + "$." };
      } },
    { id: "u6-special", title: "Special products", lesson: 3,
      gen: function (R) {
        var a = R.int(2, 9), kind = R.int(0, 2), tex = kind === 0 ? bin(a) + "^2" : kind === 1 ? bin(-a) + "^2" : bin(a) + bin(-a), ans = kind === 0 ? quad(1, 2 * a, a * a) : kind === 1 ? quad(1, -2 * a, a * a) : quad(1, 0, -a * a);
        return { type: "expr", prompt: "Expand. $$" + tex + "$$", answer: clean(ans), shown: ans, form: "simplified", keys: KEYS_POLY,
          near: kind < 2 ? [{ v: clean(quad(1, 0, a * a)), fb: "A squared binomial has a middle term: twice $" + a + "x$." }] : [{ v: clean(quad(1, 0, a * a)), fb: "The last product is $" + a + " \\times -" + a + "$, which is negative." }],
          hints: [kind < 2 ? "Write it as two brackets and multiply." : "The two middle products cancel."], why: "$" + tex + " = " + ans + "$." };
      } },
    { id: "u6-factor-thm", title: "Test a factor", lesson: 4,
      gen: function (R) {
        var p = R.nz(-5, 5), q = R.nz(-5, 5), b = p + q, c = p * q, yes = R.chance(0.5), k = yes ? -p : -p + R.pick([-2, -1, 1, 2]);
        if (!yes && (k === -q || k === 0)) k = -p + 3;
        if (k === -q) k += 1;
        var val = k * k + b * k + c, isF = val === 0;
        var say = "$P(" + k + ") = " + L.sub(quad(1, b, c), { x: k }) + " = " + val + "$.";
        return mc(R, { prompt: "Is $" + bin(-k) + "$ a factor of $P(x) = " + quad(1, b, c) + "$?", right: isF ? "Yes" : "No", wrong: [{ t: isF ? "No" : "Yes", fb: say + (isF ? " Zero means it divides exactly." : " Not zero, so there's a remainder.") }], keep: true,
          hints: ["Work out $P(" + k + ")$: the value of $x$ that makes $" + bin(-k) + "$ equal zero."], why: say + (isF ? " So it is a factor." : " So it is not a factor.") });
      } },
    { id: "u6-gcf", title: "Factor out the GCF", lesson: 5,
      gen: function (R) {
        var g = R.int(2, 6), a = R.int(1, 5), b = R.nz(-7, 7);
        if (L.gcd(a, b) !== 1) a = Math.abs(b) + 1;
        var out = poly([[g * a, "x^2"], [g * b, "x"]]);
        return { type: "expr", prompt: "Factor out the GCF: $" + out + " = " + g + "x(\\;\\square\\;)$. What goes in the bracket?", answer: clean(poly([[a, "x"], [b, ""]])), shown: poly([[a, "x"], [b, ""]]), keys: KEYS_POLY,
          near: [{ v: clean(poly([[a, "x^2"], [b, "x"]])), fb: "Divide by $" + g + "x$, not just by " + g + "." }],
          hints: ["Divide each term by $" + g + "x$."], why: "$" + g * a + "x^2 \\div " + g + "x = " + poly([[a, "x"]]) + "$ and $" + g * b + "x \\div " + g + "x = " + b + "$." };
      } },
    { id: "u6-trinomial", title: "Factor x² + bx + c", lesson: 6,
      gen: function (R) {
        var p = R.nz(-8, 8), q = R.nz(-8, 8);
        if (p + q === 0) q += 1;
        return { type: "expr", prompt: "Factor. $$" + quad(1, p + q, p * q) + "$$", answer: "(x+(" + p + "))*(x+(" + q + "))", shown: bin(p) + bin(q), form: "factored", keys: KEYS_POLY,
          hints: ["Find two numbers that multiply to $" + p * q + "$ and add to $" + (p + q) + "$."], why: "$" + p + " \\times " + L.sub("a", { a: q }) + " = " + p * q + "$ and $" + p + " + " + L.sub("a", { a: q }) + " = " + (p + q) + "$: $" + bin(p) + bin(q) + "$." };
      } },
    { id: "u6-ac", title: "Factor ax² + bx + c", lesson: 6,
      gen: function (R) {
        var a = R.pick([2, 3, 5]), p = R.pick([1, 2, 3, 4, 5, 7].filter(function (v) { return v % a !== 0; })), q = R.int(1, 6);
        var b = a * q + p, c = p * q, shown = "(" + a + "x + " + p + ")(x + " + q + ")";
        return { type: "expr", prompt: "Factor. $$" + quad(a, b, c) + "$$", answer: "(" + a + "x+" + p + ")*(x+" + q + ")", shown: shown, form: "factored", keys: KEYS_POLY,
          hints: ["$a \\cdot c = " + a * c + "$. Find two numbers that multiply to " + a * c + " and add to " + b + ".", "Split the middle term: $" + a + "x^2 + " + a * q + "x + " + p + "x + " + c + "$, then group."],
          why: "$" + a + "x(x + " + q + ") + " + p + "(x + " + q + ") = " + shown + "$." };
      } },
    { id: "u6-squares", title: "Factor special products", lesson: 7,
      gen: function (R) {
        var a = R.int(2, 11), kind = R.int(0, 2);
        if (kind === 0) return { type: "expr", prompt: "Factor. $$x^2 - " + a * a + "$$", answer: "(x+" + a + ")*(x-" + a + ")", shown: bin(a) + bin(-a), form: "factored", keys: KEYS_POLY,
          hints: ["$" + a * a + " = " + a + "^2$: a difference of squares."], why: "$a^2 - b^2 = (a + b)(a - b)$, so $" + bin(a) + bin(-a) + "$." };
        var s = kind === 1 ? 1 : -1;
        return { type: "expr", prompt: "Factor. $$" + quad(1, 2 * a * s, a * a) + "$$", answer: "(x+(" + s * a + "))^2", shown: bin(s * a) + "^2", form: "factored", keys: KEYS_POLY.concat([["$(\\;)^2$", "^2"]]),
          hints: ["$" + a * a + " = " + a + "^2$, and the middle term is twice $" + a + "x$."], why: "A perfect square trinomial: $" + bin(s * a) + "^2$." };
      } },
    { id: "u6-method", title: "Choose a factoring method", lesson: 8,
      gen: function (R) {
        var a = R.int(2, 9), b = R.int(2, 6), names = ["Take out a common factor", "Difference of squares", "Find two numbers (trinomial)", "Grouping"], kind = R.int(0, 3);
        var tex = [poly([[a * b, "x^2"], [a, "x"]]), "x^2 - " + a * a, quad(1, a + b, a * b), "x^3 + " + a + "x^2 + " + b + "x + " + a * b][kind];
        var why = ["Both terms share $" + a + "x$.", "Two terms, both squares, subtracted.", "Three terms with leading coefficient 1.", "Four terms with no factor common to all."][kind];
        return mc(R, { prompt: "Which method would you use first to factor $" + tex + "$?", right: names[kind], wrong: names.filter(function (n, i) { return i !== kind; }).map(function (n) { return { t: n, fb: why }; }), keep: true,
          hints: ["Is there a common factor? If not, count the terms."], why: why });
      } }
  ];
  L.unit("alg", 6, {
    title: "Working with polynomials",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Adding, subtracting, multiplying and dividing polynomials.",
        skills: ["u6-add", "u6-eval", "u6-mono", "u6-foil", "u6-special", "u6-factor-thm"], per: 2 },
      { title: "Quiz 2", after: 8, blurb: "Factoring: common factors, trinomials, special products, and choosing a method.",
        skills: ["u6-gcf", "u6-trinomial", "u6-ac", "u6-squares", "u6-method"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg:6", {
    2: { name: "Polynomials", frame: "A [[polynomial]] is a sum of terms. Only [[like terms]], with the same variable to the same power, combine. The highest power is the [[degree]].",
         chips: ["coefficients", "slope"] },
    3: { name: "Multiplying polynomials", frame: "To multiply polynomials, multiply [[every]] term of one by every term of the other: the [[distributive property]]. Squaring a binomial always gives a [[middle term]].",
         chips: ["one", "no middle term"], fb: { "no middle term": "$(x + 3)^2 = x^2 + 6x + 9$: the middle term is there, twice $3x$." } },
    4: { name: "Remainder and factor theorems", frame: "Dividing $P(x)$ by $(x - c)$ leaves the remainder [[$P(c)$]]. So $(x - c)$ is a [[factor]] exactly when $P(c)$ equals [[$0$]].",
         chips: ["$P(0)$", "$1$"] },
    5: { name: "Factoring out", frame: "Factoring runs multiplication [[backwards]]. Take out the [[greatest common factor]] first; with four terms, try [[grouping]].",
         chips: ["forwards", "slope"] },
    6: { name: "Factoring trinomials", frame: "To factor $x^2 + bx + c$, find two numbers that [[multiply]] to $c$ and [[add]] to $b$.",
         chips: ["divide", "subtract"] },
    7: { name: "Special products", frame: "$a^2 + 2ab + b^2$ is a [[perfect square]], $(a + b)^2$. $a^2 - b^2$ is a [[difference of squares]], $(a + b)(a - b)$. A [[sum]] of squares doesn't factor.",
         chips: ["product"] },
    8: { name: "Factoring strategy", at: 4, frame: "Always take out the [[common factor]] first. Then count the [[terms]], and keep going until no factor can be factored [[again]].",
         chips: ["slope", "once"] }
  });
})();
