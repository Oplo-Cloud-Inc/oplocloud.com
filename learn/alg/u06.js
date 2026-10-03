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
  LESSONS.push({
    title: "Add and subtract polynomials",
    blurb: "Book 6.1 · Only like terms combine: x² with x², x with x, numbers with numbers.",
    mins: 8, v: 2,
    steps: [
      { type: "tilemat", kicker: "Try it", prompt: "Each tile is a term. A blue tile and a red tile **of the same kind** cancel. Tap pairs until nothing more cancels.",
        terms: [[2, "x"], [3, "1"], [-1, "x"], [-2, "1"]], skill: "Like terms",
        hints: ["Tap an $x$ tile, then a $-x$ tile."], why: "$2x + 3 - x - 2 = x + 1$. An $x$ tile can only cancel a $-x$ tile, never a unit tile." },
      { type: "learn", kicker: "Name it",
        prompt: "A **polynomial** is a sum of terms like $3x^2$, $-5x$ and $7$: numbers times whole-number powers of a variable.<br><br>**Like terms** have the same variable to the same power. Only like terms can be combined. The **degree** is the highest power." },
      { type: "sort", prompt: "Name each polynomial by its number of terms.",
        bins: ["Monomial (1)", "Binomial (2)", "Trinomial (3)"],
        cards: [{ t: "$7x$", bin: 0, fb: "One term." }, { t: "$x^2 - 9$", bin: 1, fb: "Two terms." }, { t: "$x^2 + 5x + 6$", bin: 2, fb: "Three terms." }, { t: "$-3$", bin: 0, fb: "A single number is one term." }, { t: "$2x^3 + x$", bin: 1, fb: "Two terms." }],
        skill: "Polynomial vocabulary", hints: ["Count the terms: the pieces separated by $+$ or $-$."], why: "Mono-, bi-, tri-: one, two, three terms." },
      { type: "expr", prompt: "Add.$$(3x^2 + 2x - 5) + (x^2 - 6x + 1)$$", answer: "4x^2-4x-4", shown: "4x^2 - 4x - 4", form: "simplified", skill: "Add polynomials",
        near: [{ v: "4x^2+8x-4", fb: "$2x + (-6x) = -4x$." }, { v: "4x^2-4x-6", fb: "$-5 + 1 = -4$." }], keys: KEYS_POLY,
        hints: ["Combine the $x^2$ terms, then the $x$ terms, then the numbers."], why: "$3x^2 + x^2 = 4x^2$; $2x - 6x = -4x$; $-5 + 1 = -4$." },
      { type: "choice", kicker: "Vary it", prompt: "Subtracting takes care. What is the correct first step?$$(5x^2 + 3x) - (2x^2 - 4x)$$",
        options: [{ t: "$5x^2 + 3x - 2x^2 + 4x$" }, { t: "$5x^2 + 3x - 2x^2 - 4x$", fb: "The minus sign applies to *both* terms in the bracket: $-(-4x) = +4x$." }, { t: "$5x^2 - 2x^2 + 3x^2$", fb: "$x^2$ terms and $x$ terms aren't alike. Keep them separate." }],
        answer: 0, skill: "Subtract polynomials", hints: ["Subtracting a bracket changes the sign of every term inside it."], why: "$-(2x^2 - 4x) = -2x^2 + 4x$." },
      { type: "expr", prompt: "Finish it: $(5x^2 + 3x) - (2x^2 - 4x)$", answer: "3x^2+7x", shown: "3x^2 + 7x", form: "simplified", skill: "Subtract polynomials",
        near: [{ v: "3x^2-x", fb: "$3x - (-4x) = 3x + 4x$." }], keys: KEYS_POLY, hints: ["$5x^2 - 2x^2$ and $3x + 4x$."], why: "$3x^2 + 7x$." },
      { type: "num", prompt: "A polynomial can be a function. For $P(x) = x^2 - 3x + 2$, find $P(4)$.", pre: "$P(4) =$", answer: 6, skill: "Evaluate a polynomial",
        near: [{ v: -2, fb: "$4^2$ is 16, not 8." }, { v: 30, fb: "$-3(4) = -12$: subtract it." }], hints: ["$4^2 - 3(4) + 2$."], why: "$16 - 12 + 2 = 6$." },
      { type: "expr", kicker: "Use it", prompt: "A rectangle has sides $2x + 3$ and $x - 1$. Write its **perimeter** as a simplified polynomial.", answer: "6x+4", shown: "6x + 4", form: "simplified", skill: "Add polynomials",
        near: [{ v: "3x+2", fb: "That's two of the sides. A rectangle has four." }], keys: KEYS_POLY,
        hints: ["Perimeter = 2 × (length + width)."], why: "$2(2x + 3 + x - 1) = 2(3x + 2) = 6x + 4$." }
    ]
  });

  /* ============================================ 6.2 · Multiplying polynomials */
  LESSONS.push({
    title: "Multiplying polynomials",
    blurb: "Book 6.2 and the area-model inquiry · A product is the area of a rectangle. Every part of one side meets every part of the other.",
    mins: 9, v: 2,
    steps: [
      { type: "learn", kicker: "Try it", prompt: "A rectangle is $x + 3$ wide and $x + 2$ tall. Change the sides and watch what tiles fill it.",
        scene: { type: "tiles", mode: "multiply", p: 3, q: 2, adjust: true, min: 0, gate: true }, gate: true,
        then: "One big $x^2$ tile, some $x$ tiles along two edges, and unit tiles in the corner. For $(x + 3)(x + 2)$: $x^2 + 5x + 6$. **Multiplying two binomials always gives these four regions.**" },
      { type: "expr", prompt: "First, single terms. Multiply $3x^2 \\cdot 4x^3$.", answer: "12x^5", shown: "12x^5", skill: "Multiply monomials",
        near: [{ v: "12x^6", fb: "Multiplying powers *adds* the exponents: $2 + 3$." }, { v: "7x^5", fb: "The coefficients multiply: $3 \\times 4$." }],
        keys: [["$x$", "x"], ["$x^{\\square}$", "^"]], hints: ["Multiply the numbers. Add the exponents."], why: "$3 \\cdot 4 = 12$ and $x^2 \\cdot x^3 = x^5$." },
      { type: "learn", kicker: "See it", prompt: "An **area model** does the same without tiles. Each cell is its row times its column. Fill in the areas.",
        scene: { type: "tiles", mode: "area", rows: ["x", "4"], cols: ["x", "3"], cells: [["x^2", "3x"], ["4x", "12"]], readout: "$(x + 4)(x + 3) = x^2 + 3x + 4x + 12 = x^2 + 7x + 12$", gate: true }, gate: true,
        then: "Four cells, four products. Then combine the two $x$ terms. This is the **distributive property** used twice." },
      { type: "expr", prompt: "Multiply $(x - 5)(x + 2)$.", answer: "x^2-3x-10", shown: "x^2 - 3x - 10", form: "simplified", skill: "Multiply binomials",
        near: [{ v: "x^2-10", fb: "That's only the first and last products. The two middle ones, $2x$ and $-5x$, are missing." }, { v: "x^2+3x-10", fb: "$2x + (-5x) = -3x$." }, { v: "x^2-7x-10", fb: "$2x - 5x$ is $-3x$." }],
        keys: KEYS_POLY, hints: ["Four products: $x \\cdot x$, $x \\cdot 2$, $-5 \\cdot x$, $-5 \\cdot 2$."], why: "$x^2 + 2x - 5x - 10 = x^2 - 3x - 10$." },
      { type: "expr", prompt: "Multiply $(2x + 1)(x + 3)$.", answer: "2x^2+7x+3", shown: "2x^2 + 7x + 3", form: "simplified", skill: "Multiply binomials",
        near: [{ v: "2x^2+3", fb: "Don't forget the middle products: $6x$ and $x$." }, { v: "2x^2+6x+3", fb: "There's also $1 \\cdot x$: $6x + x = 7x$." }],
        keys: KEYS_POLY, hints: ["$2x \\cdot x$, $2x \\cdot 3$, $1 \\cdot x$, $1 \\cdot 3$."], why: "$2x^2 + 6x + x + 3 = 2x^2 + 7x + 3$." },
      { type: "learn", kicker: "Vary it", prompt: "Two products turn up so often they are worth knowing on sight.",
        scene: { type: "walk", rows: [
          { m: "(x + 3)^2 = (x + 3)(x + 3)", say: "A binomial squared." },
          { m: "x^2 + 3x + 3x + 9 = x^2 + 6x + 9", say: "The middle term appears twice. It is **not** just $x^2 + 9$." },
          { m: "(x + 3)(x - 3)", say: "A sum times a difference." },
          { m: "x^2 - 3x + 3x - 9 = x^2 - 9", say: "The middle terms cancel." }] },
        gate: true,
        then: "$(a + b)^2 = a^2 + 2ab + b^2$ &nbsp; and &nbsp; $(a + b)(a - b) = a^2 - b^2$." },
      { type: "slots", prompt: "Match each product to its expansion.",
        slots: [{ id: "a", label: "$(x + 5)^2$" }, { id: "b", label: "$(x - 5)^2$" }, { id: "c", label: "$(x + 5)(x - 5)$" }],
        cards: [{ t: "$x^2 + 10x + 25$", slot: "a", fb: "Twice $5x$ in the middle." }, { t: "$x^2 - 10x + 25$", slot: "b", fb: "Twice $-5x$, and $(-5)^2 = +25$." }, { t: "$x^2 - 25$", slot: "c", fb: "The middle terms cancel." }, { t: "$x^2 + 25$" }],
        skill: "Special products", hints: ["Squaring gives a middle term. Sum times difference doesn't."], why: "$x^2 + 25$ is none of them: squaring a binomial always produces a middle term." },
      { type: "expr", kicker: "Use it", prompt: "A garden is $x + 6$ metres long and $x + 2$ metres wide. Write its **area** as a polynomial.", answer: "x^2+8x+12", shown: "x^2 + 8x + 12", form: "simplified", skill: "Multiply binomials",
        near: [{ v: "x^2+12", fb: "Two more regions: $2x$ and $6x$." }, { v: "2x+8", fb: "That adds the sides. Area multiplies them." }], keys: KEYS_POLY,
        hints: ["Area = length × width."], why: "$(x + 6)(x + 2) = x^2 + 2x + 6x + 12 = x^2 + 8x + 12$." }
    ]
  });

  /* ============================================ 6.3 · Dividing polynomials */
  LESSONS.push({
    title: "Dividing polynomials",
    blurb: "Book 6.3 · Division undoes multiplication. And a quick test tells you whether x − c divides exactly.",
    mins: 8, v: 2,
    steps: [
      { type: "expr", kicker: "Try it", prompt: "$3x$ times something makes $6x^3 + 9x^2$. What is the something?$$\\frac{6x^3 + 9x^2}{3x}$$", answer: "2x^2+3x", shown: "2x^2 + 3x", form: "simplified", skill: "Divide by a monomial",
        near: [{ v: "2x^2+9x^2", fb: "Divide *both* terms by $3x$, not just the first." }, { v: "2x^3+3x^2", fb: "Dividing by $x$ lowers each exponent by 1." }], keys: KEYS_POLY,
        hints: ["Divide each term separately: $\\frac{6x^3}{3x}$ and $\\frac{9x^2}{3x}$."], why: "$\\frac{6x^3}{3x} = 2x^2$ and $\\frac{9x^2}{3x} = 3x$." },
      { type: "learn", kicker: "See it", prompt: "Dividing by a binomial works like long division with numbers. Here is $(x^2 + 5x + 6) \\div (x + 2)$.",
        scene: { type: "walk", rows: [
          { m: "x^2 \\div x = x", say: "Divide the leading terms. $x$ is the first part of the answer." },
          { m: "x(x + 2) = x^2 + 2x", say: "Multiply back." },
          { m: "(x^2 + 5x + 6) - (x^2 + 2x) = 3x + 6", say: "Subtract. This is what's still to be divided." },
          { m: "3x \\div x = 3", say: "Divide the leading terms again: $+3$." },
          { m: "(3x + 6) - 3(x + 2) = 0", say: "Multiply back and subtract. Remainder 0." }] },
        gate: true,
        then: "$(x^2 + 5x + 6) \\div (x + 2) = x + 3$ exactly. Check: $(x + 2)(x + 3) = x^2 + 5x + 6$ ✓." },
      { type: "expr", prompt: "Divide: $(x^2 + 7x + 12) \\div (x + 3)$.", answer: "x+4", shown: "x + 4", skill: "Divide polynomials",
        near: [{ v: "x+9", fb: "After the first step, $7x - 3x = 4x$ remains, and $4x \\div x = 4$." }], keys: KEYS_POLY,
        hints: ["What times $(x + 3)$ gives $x^2 + 7x + 12$?", "Start with $x$. Then $7x - 3x = 4x$."], why: "$(x + 3)(x + 4) = x^2 + 7x + 12$." },
      { type: "num", kicker: "Vary it", prompt: "Here's a shortcut. Let $P(x) = x^2 + 5x + 7$. Work out $P(-2)$.", pre: "$P(-2) =$", answer: 1, skill: "Remainder theorem",
        near: [{ v: -7, fb: "$(-2)^2 = +4$." }, { v: 21, fb: "$5(-2) = -10$." }], hints: ["$(-2)^2 + 5(-2) + 7$."],
        why: "$4 - 10 + 7 = 1$. And dividing $x^2 + 5x + 7$ by $(x + 2)$ leaves a remainder of exactly 1." },
      { type: "learn", kicker: "Name it",
        prompt: "**Remainder theorem:** when $P(x)$ is divided by $(x - c)$, the remainder is $P(c)$.<br><br>**Factor theorem:** $(x - c)$ is a factor of $P(x)$ exactly when $P(c) = 0$.<br><br>So you can test a factor by substituting one number." },
      { type: "choice", prompt: "Is $(x - 3)$ a factor of $x^2 - x - 6$?",
        options: [{ t: "Yes: $P(3) = 9 - 3 - 6 = 0$." }, { t: "No: $P(3) = 6$.", fb: "$3^2 - 3 - 6 = 9 - 9 = 0$." }, { t: "No: $P(-3) = 6$.", fb: "For the factor $(x - 3)$, test $c = 3$, the value that makes it zero." }],
        answer: 0, skill: "Factor theorem", hints: ["Substitute the number that makes $x - 3$ equal 0."], why: "$P(3) = 0$, so $(x - 3)$ divides exactly: $x^2 - x - 6 = (x - 3)(x + 2)$." },
      { type: "multi", kicker: "Use it", prompt: "Which are factors of $P(x) = x^2 - 4x - 5$?",
        options: [{ t: "$(x - 5)$", ok: true }, { t: "$(x + 1)$", ok: true }, { t: "$(x - 1)$", fb: "$P(1) = 1 - 4 - 5 = -8$, not 0." }, { t: "$(x + 5)$", fb: "$P(-5) = 25 + 20 - 5 = 40$, not 0." }],
        skill: "Factor theorem", hints: ["For $(x - c)$ test $P(c)$. For $(x + c)$ test $P(-c)$."], why: "$P(5) = 0$ and $P(-1) = 0$: $x^2 - 4x - 5 = (x - 5)(x + 1)$." }
    ]
  });

  /* ============================================ 6.4 · GCF and grouping */
  LESSONS.push({
    title: "Greatest common factor and factor by grouping",
    blurb: "Book 6.4 · Factoring runs multiplication backwards. Start with what every term shares.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "What is the largest number that divides both 12 and 18?", answer: 6, skill: "Greatest common factor",
        near: [{ v: 3, fb: "3 divides both, but so does a bigger number." }, { v: 2, fb: "2 works, but there's a larger one." }, { v: 36, fb: "36 is a common *multiple*. A factor divides into the numbers." }],
        hints: ["Factors of 12: 1, 2, 3, 4, 6, 12."], why: "6 divides both, and nothing bigger does. It is their **greatest common factor**, or GCF." },
      { type: "choice", prompt: "What is the GCF of $6x^2$ and $9x$?",
        options: [{ t: "$3x$" }, { t: "$3$", fb: "Both terms also contain an $x$." }, { t: "$3x^2$", fb: "$9x$ has only one $x$, so $x^2$ doesn't divide it." }, { t: "$18x^2$", fb: "That's a common multiple. The GCF must divide both terms." }],
        answer: 0, skill: "Greatest common factor", hints: ["Largest number dividing 6 and 9. Lowest power of $x$ in both."], why: "GCF of 6 and 9 is 3, and both have at least one $x$: $3x$." },
      { type: "learn", kicker: "See it", prompt: "Factoring out the GCF is the area model **backwards**: you know the area and one side.",
        scene: { type: "tiles", mode: "area", rows: ["3x"], cols: ["2x", "3"], cells: [["6x^2", "9x"]], rh: [90], cw: [150, 110], readout: "$6x^2 + 9x = 3x(2x + 3)$", gate: true }, gate: true,
        then: "The GCF, $3x$, is one side. Dividing each term by it gives the other side: $2x + 3$. Check by multiplying back." },
      { type: "expr", prompt: "Factor out the GCF: $8x^2 + 12x = 4x(\\;\\square\\;)$. What goes in the bracket?", answer: "2x+3", shown: "2x + 3", skill: "Factor out the GCF",
        near: [{ v: "2x^2+3x", fb: "Divide by $4x$, not just by 4." }, { v: "4x+8", fb: "Divide each term by $4x$: $8x^2 \\div 4x$ and $12x \\div 4x$." }], keys: KEYS_POLY,
        hints: ["$8x^2 \\div 4x$ and $12x \\div 4x$."], why: "$8x^2 \\div 4x = 2x$ and $12x \\div 4x = 3$." },
      { type: "learn", kicker: "Vary it", prompt: "Four terms and no factor common to all? Try **grouping** them in pairs.",
        scene: { type: "walk", rows: [
          { m: "x^3 + 2x^2 + 3x + 6", say: "Nothing divides all four terms." },
          { m: "(x^3 + 2x^2) + (3x + 6)", say: "Group in pairs." },
          { m: "x^2(x + 2) + 3(x + 2)", say: "Factor the GCF out of each pair. The same bracket appears twice." },
          { m: "(x + 2)(x^2 + 3)", say: "That bracket is now a common factor. Take it out." }] },
        gate: true },
      { type: "expr", prompt: "Factor by grouping: $xy + 3x + 2y + 6 = (x + 2)(\\;\\square\\;)$.", answer: "y+3", shown: "y + 3", skill: "Factor by grouping",
        keys: [["$x$", "x"], ["$y$", "y"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "x+3", fb: "From $xy + 3x$ you take out $x$, leaving $(y + 3)$." }],
        hints: ["$xy + 3x = x(y + 3)$ and $2y + 6 = 2(y + 3)$."], why: "$x(y + 3) + 2(y + 3) = (x + 2)(y + 3)$." },
      { type: "choice", prompt: "Can $3x + 7$ be factored?",
        options: [{ t: "No. Its terms share no factor except 1: it is **prime**." }, { t: "Yes: $3(x + 7)$", fb: "$3(x + 7) = 3x + 21$. 3 doesn't divide 7." }, { t: "Yes: $x(3 + 7)$", fb: "7 has no $x$ in it." }],
        answer: 0, skill: "Greatest common factor", hints: ["What divides both 3x and 7?"], why: "A polynomial that can't be factored is called prime, like a prime number." },
      { type: "expr", kicker: "Use it", prompt: "A rectangle has area $10x^2 + 15x$ and width $5x$. What is its length?", answer: "2x+3", shown: "2x + 3", skill: "Factor out the GCF",
        near: [{ v: "2x^2+3x", fb: "Divide by $5x$, not just by 5." }], keys: KEYS_POLY, hints: ["Area ÷ width."], why: "$10x^2 + 15x = 5x(2x + 3)$." }
    ]
  });

  /* ============================================ 6.5 · Factor trinomials */
  LESSONS.push({
    title: "Factor trinomials",
    blurb: "Book 6.5 · Find two numbers that multiply to the last term and add to the middle one.",
    mins: 9, v: 2,
    steps: [
      { type: "tiles", kicker: "Try it", prompt: "Arrange $x^2 + 7x + 12$ into a rectangle: choose $p$ and $q$ so the tiles match exactly.",
        mode: "factor", target: { b: 7, c: 12 }, p: 1, q: 1, min: 0, answer: [3, 4], skill: "Factor a trinomial",
        hints: ["You need 7 $x$-tiles in total and 12 unit tiles in the corner.", "Which two numbers multiply to 12 and add to 7?"], why: "$(x + 3)(x + 4)$: $3 + 4 = 7$ $x$-tiles and $3 \\times 4 = 12$ units." },
      { type: "learn", kicker: "Name it",
        prompt: "To factor $x^2 + bx + c$, find two numbers that **multiply** to $c$ and **add** to $b$. They are the numbers in the brackets:$$x^2 + bx + c = (x + p)(x + q) \\quad \\text{where } pq = c \\text{ and } p + q = b$$" },
      { type: "numbers", prompt: "Which two numbers multiply to 12 and add to 8?", answer: [2, 6], skill: "Factor a trinomial", placeholder: "e.g. 3, 4",
        hints: ["Pairs that multiply to 12: 1 and 12, 2 and 6, 3 and 4."], why: "$2 \\times 6 = 12$ and $2 + 6 = 8$." },
      { type: "expr", prompt: "So factor $x^2 + 8x + 12$.", answer: "(x+2)(x+6)", shown: "(x + 2)(x + 6)", form: "factored", skill: "Factor a trinomial", keys: KEYS_POLY,
        near: [], hints: ["Use the two numbers you just found."], why: "$(x + 2)(x + 6) = x^2 + 8x + 12$." },
      { type: "numbers", kicker: "Vary it", prompt: "With a negative last term, the two numbers have opposite signs. Which two multiply to $-15$ and add to $2$?", answer: [5, -3], skill: "Factor a trinomial", placeholder: "e.g. 4, -1",
        hints: ["Pairs for 15: 1 and 15, 3 and 5. One of them must be negative."], why: "$5 \\times -3 = -15$ and $5 + (-3) = 2$." },
      { type: "expr", prompt: "Factor $x^2 + 2x - 15$.", answer: "(x+5)(x-3)", shown: "(x + 5)(x - 3)", form: "factored", skill: "Factor a trinomial", keys: KEYS_POLY,
        hints: ["$(x + 5)(x - 3)$ or the other way round?"], why: "$(x + 5)(x - 3) = x^2 - 3x + 5x - 15 = x^2 + 2x - 15$." },
      { type: "learn", kicker: "See it", prompt: "When the first coefficient isn't 1, use the **ac method**: multiply $a$ and $c$, split the middle term, then group.",
        scene: { type: "walk", rows: [
          { m: "2x^2 + 7x + 3", say: "$a \\cdot c = 2 \\cdot 3 = 6$. Find two numbers that multiply to 6 and add to 7: 6 and 1." },
          { m: "2x^2 + 6x + x + 3", say: "Split $7x$ into $6x + x$." },
          { m: "2x(x + 3) + 1(x + 3)", say: "Group in pairs and factor each." },
          { m: "(2x + 1)(x + 3)", say: "Take out the common bracket." }] },
        gate: true },
      { type: "expr", kicker: "Use it", prompt: "Factor $3x^2 + 10x + 8$.", answer: "(3x+4)(x+2)", shown: "(3x + 4)(x + 2)", form: "factored", skill: "Factor a trinomial", keys: KEYS_POLY,
        hints: ["$a \\cdot c = 24$. Two numbers that multiply to 24 and add to 10?", "$3x^2 + 6x + 4x + 8$."], why: "$3x(x + 2) + 4(x + 2) = (3x + 4)(x + 2)$." }
    ]
  });

  /* ============================================ 6.6 · Factor special products */
  LESSONS.push({
    title: "Factor special products",
    blurb: "Book 6.6 · Recognise a perfect square and a difference of squares, and factor them on sight.",
    mins: 8, v: 2,
    steps: [
      { type: "tiles", kicker: "Try it", prompt: "Arrange $x^2 + 6x + 9$ into a rectangle. What do you notice about its shape?",
        mode: "factor", target: { b: 6, c: 9 }, p: 1, q: 1, min: 0, answer: [3, 3], skill: "Perfect square trinomials",
        hints: ["Two numbers that multiply to 9 and add to 6."], why: "$(x + 3)(x + 3)$: both sides are the same. The rectangle is a **square**." },
      { type: "learn", kicker: "Name it",
        prompt: "A **perfect square trinomial** is the square of a binomial:$$a^2 + 2ab + b^2 = (a + b)^2 \\qquad a^2 - 2ab + b^2 = (a - b)^2$$Spot it: the first and last terms are squares, and the middle term is **twice** the product of their roots." },
      { type: "sort", prompt: "Perfect square trinomial, or not?",
        bins: ["Perfect square", "Not"],
        cards: [{ t: "$x^2 + 10x + 25$", bin: 0, fb: "$25 = 5^2$ and $10x = 2 \\cdot 5 \\cdot x$." }, { t: "$x^2 + 10x + 16$", bin: 1, fb: "$16 = 4^2$, but twice $4x$ is $8x$, not $10x$." },
                { t: "$x^2 - 8x + 16$", bin: 0, fb: "$(x - 4)^2$." }, { t: "$x^2 + 9$", bin: 1, fb: "No middle term at all." }, { t: "$4x^2 + 12x + 9$", bin: 0, fb: "$(2x)^2$, $3^2$, and $2 \\cdot 2x \\cdot 3 = 12x$." }],
        skill: "Perfect square trinomials", hints: ["Take the roots of the first and last terms. Is the middle term twice their product?"], why: "First and last terms square, middle term twice the product of the roots." },
      { type: "expr", prompt: "Factor $x^2 - 14x + 49$.", answer: "(x-7)^2", shown: "(x - 7)^2", form: "factored", skill: "Perfect square trinomials",
        keys: KEYS_POLY.concat([["$(\\;)^2$", "^2"]]), hints: ["$49 = 7^2$ and $14 = 2 \\cdot 7$. Mind the sign."], why: "$(x - 7)^2 = x^2 - 14x + 49$." },
      { type: "learn", kicker: "See it", prompt: "The other special product has only two terms.",
        scene: { type: "walk", rows: [
          { m: "(x + 3)(x - 3)", say: "A sum times a difference." },
          { m: "x^2 - 3x + 3x - 9", say: "The middle terms are opposites." },
          { m: "x^2 - 9", say: "They cancel, leaving a **difference of squares**." }] },
        gate: true,
        then: "Read it backwards and you can factor:$$a^2 - b^2 = (a + b)(a - b)$$" },
      { type: "expr", prompt: "Factor $x^2 - 64$.", answer: "(x+8)(x-8)", shown: "(x + 8)(x - 8)", form: "factored", skill: "Difference of squares", keys: KEYS_POLY,
        hints: ["$64 = 8^2$."], why: "$(x + 8)(x - 8) = x^2 - 64$." },
      { type: "choice", kicker: "Vary it", prompt: "What about $x^2 + 25$, a **sum** of squares?",
        options: [{ t: "It can't be factored with real numbers." }, { t: "$(x + 5)^2$", fb: "$(x + 5)^2 = x^2 + 10x + 25$. There's a middle term." }, { t: "$(x + 5)(x - 5)$", fb: "That gives $x^2 - 25$." }],
        answer: 0, skill: "Difference of squares", hints: ["Multiply each option out and see what you get."], why: "A difference of squares factors. A sum of squares is prime." },
      { type: "expr", kicker: "Use it", prompt: "Factor $4x^2 - 25$.", answer: "(2x+5)(2x-5)", shown: "(2x + 5)(2x - 5)", form: "factored", skill: "Difference of squares", keys: KEYS_POLY,
        hints: ["$4x^2 = (2x)^2$ and $25 = 5^2$."], why: "$(2x)^2 - 5^2 = (2x + 5)(2x - 5)$." }
    ]
  });

  /* ============================================ 6.7 · General strategy */
  LESSONS.push({
    title: "General strategy for factoring polynomials",
    blurb: "Book 6.7 · One checklist for any polynomial: common factor first, then count the terms.",
    mins: 7, v: 2,
    steps: [
      { type: "sort", kicker: "Try it", prompt: "Which method would you reach for **first**?",
        bins: ["Take out a GCF", "Difference of squares", "Trinomial: two numbers", "Grouping"],
        cards: [{ t: "$5x^2 + 10x$", bin: 0, fb: "Both terms share $5x$." }, { t: "$x^2 - 49$", bin: 1, fb: "Two squares, subtracted." },
                { t: "$x^2 + 9x + 20$", bin: 2, fb: "Three terms: find numbers that multiply to 20 and add to 9." }, { t: "$x^3 + x^2 + 4x + 4$", bin: 3, fb: "Four terms: group in pairs." }],
        skill: "Choose a factoring method", hints: ["Is there a common factor? If not, how many terms are there?"], why: "The number of terms points to the method." },
      { type: "order", kicker: "Name it", prompt: "Put the general strategy in order.",
        items: ["Take out the greatest common factor, if there is one.", "Count the terms that are left.", "Two terms: try a difference of squares. Three: a trinomial method. Four: grouping.", "Check whether any factor can be factored again.", "Multiply back to check."],
        skill: "Choose a factoring method", why: "GCF first makes everything after it smaller and easier." },
      { type: "expr", kicker: "See it", prompt: "Two stages. First the GCF: $2x^2 - 18 = 2(\\;\\square\\;)$.", answer: "x^2-9", shown: "x^2 - 9", skill: "Factor completely", keys: KEYS_POLY,
        near: [{ v: "x^2-18", fb: "Divide both terms by 2." }], hints: ["$2x^2 \\div 2$ and $18 \\div 2$."], why: "$2(x^2 - 9)$." },
      { type: "expr", prompt: "$x^2 - 9$ can be factored again. Finish: $2x^2 - 18 = 2 \\cdot (\\;\\square\\;)$, fully factored.", answer: "(x+3)(x-3)", shown: "(x + 3)(x - 3)", form: "factored", skill: "Factor completely", keys: KEYS_POLY,
        hints: ["$x^2 - 9$ is a difference of squares."], why: "$2x^2 - 18 = 2(x + 3)(x - 3)$. Now nothing more can be factored: it is **factored completely**." },
      { type: "multi", kicker: "Vary it", prompt: "Which of these are factored **completely**?",
        options: [{ t: "$3(x + 2)(x + 3)$", ok: true }, { t: "$(x + 7)(x - 7)$", ok: true },
                  { t: "$3(x^2 + 5x + 6)$", fb: "$x^2 + 5x + 6$ still factors, into $(x + 2)(x + 3)$." }, { t: "$(x^2 - 4)(x + 1)$", fb: "$x^2 - 4$ is a difference of squares." }],
        skill: "Factor completely", hints: ["Look inside every bracket. Could it be factored further?"], why: "Completely factored means no factor can be broken down again." },
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
        return { type: "expr", prompt: "Factor out the GCF: $" + out + " = " + g + "x(\;\\square\;)$. What goes in the bracket?", answer: clean(poly([[a, "x"], [b, ""]])), shown: poly([[a, "x"], [b, ""]]), keys: KEYS_POLY,
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
        return { type: "expr", prompt: "Factor. $$" + quad(1, 2 * a * s, a * a) + "$$", answer: "(x+(" + s * a + "))^2", shown: bin(s * a) + "^2", form: "factored", keys: KEYS_POLY.concat([["$(\;)^2$", "^2"]]),
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
