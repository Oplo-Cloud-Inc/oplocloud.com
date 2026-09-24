/* ==========================================================================
   Algebra I — Unit 13: Quadratics: multiplying & factoring. See lab/core.js.

   Written the way Units 1–12 are. Polynomials are met as areas: a monomial
   times a polynomial is a rectangle cut into strips, and a binomial times a
   binomial is algebra tiles laid out in a rectangle whose sides you set.
   Factoring is then the same rectangle run backwards — given the tiles, find
   the sides — first for x² + bx + c on the tiles, then by grouping, and for
   the two special patterns. Answers are checked by meaning and by shape: an
   expansion has to be fully multiplied out and tidied, and a factorisation
   has to be complete, with every common factor taken out.

   Eight lessons, following Khan Academy's topics for the unit. Fifteen
   skills (Khan's list), three quizzes, the unit test at the end, and notes
   that put the unit on one page.
   Standards: HSA.APR.A.1, HSA.SSE.A.2, HSA.SSE.B.3.a.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, gcd = L.gcd;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function lin(a, b) { return poly([[a, "x"], [b, ""]]); }
  function fac(a, b) { return "(" + lin(a, b) + ")"; }
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function typed(s) { return s.replace(/\s+/g, ""); }
  function nz(R, lo, hi, not) { var v; do { v = R.nz(lo, hi); } while (not && not.indexOf(v) >= 0); return v; }
  function paren(v) { return v < 0 ? "(" + v + ")" : String(v); }
  function kFac(k) { return k === 1 ? "" : k === -1 ? "-" : String(k); }
  var KEYS = [["$x$", "x"], ["$x^2$", "^2"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$+$", "+"]];
  function expr(prompt, ans, o) {
    o = o || {};
    return { type: "expr", prompt: prompt, answer: typed(ans), shown: ans, form: o.form || "simplified", keys: KEYS, placeholder: o.ph || (o.form === "fully-factored" ? "e.g. (x + 2)(x - 5)" : "e.g. x^2 + 3x - 4"),
      near: (o.near || []).map(function (n) { return { v: typed(n[0]), fb: n[1] }; }), hints: o.hints, why: o.why, scene: o.scene, pre: o.pre };
  }
  function area(rows, cols, cells, o) {
    o = o || {};
    return { type: "tiles", mode: "area", rows: rows, cols: cols, cells: cells, reveal: o.reveal, readout: o.readout };
  }

  L.unit("alg", 13, {
    title: "Quadratics: multiplying & factoring",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Polynomials",
        blurb: "Terms, degree and leading coefficient — and a monomial times a polynomial as an area.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "New words",
            prompt: "A **monomial** is a number, a letter, or a product of them, like $5$, $x$ or $-3x^2$. A **polynomial** is a sum of monomials — its **terms**.",
            scene: { type: "walk", rows: [
              { m: "4x^3 - 2x + 7", say: "Three terms: $4x^3$, $-2x$ and $7$." },
              { m: "\\text{degree } 3", say: "The **degree** is the highest power of $x$." },
              { m: "\\text{leading coefficient } 4", say: "Written from the highest power down (**standard form**), the first term's number is the **leading coefficient**." }] },
            gate: true },
          { type: "choice", prompt: "What is the degree of $5x^2 - 3x^4 + x - 9$?", skill: "Polynomials intro",
            options: [{ t: "$4$" }, { t: "$2$", fb: "The terms aren't in order. The highest power is $x^4$." }, { t: "$5$", fb: "That's a coefficient. The degree is the highest power." }],
            answer: 0, why: "The highest power is $x^4$." },
          { type: "choice", prompt: "Written in standard form, what is the leading coefficient of $5x^2 - 3x^4 + x - 9$?", skill: "Polynomials intro",
            options: [{ t: "$-3$" }, { t: "$5$", fb: "Put it in order first: $-3x^4 + 5x^2 + x - 9$." }, { t: "$3$", fb: "The term is $-3x^4$ — keep the sign." }],
            answer: 0, why: "$-3x^4 + 5x^2 + x - 9$: the first coefficient is $-3$." },
          { type: "learn", kicker: "As an area",
            prompt: "Multiplying a monomial by a polynomial is finding the area of a rectangle cut into strips. Here is $3x(2x + 5)$: height $3x$, width $2x + 5$. Fill in the areas.",
            scene: area(["3x"], ["2x", "5"], [["6x²", "15x"]], { readout: "$3x(2x + 5) = 6x^2 + 15x$" }), gate: true,
            then: "Each strip is the monomial times one term: $3x \\cdot 2x = 6x^2$ and $3x \\cdot 5 = 15x$. That's the distributive property again." },
          expr("Expand $4x(x - 3)$.", "4x^2 - 12x", { near: [["4x^2 - 3", "The $4x$ multiplies the $-3$ too."]], hints: ["$4x \\cdot x$ and $4x \\cdot (-3)$."], why: "$4x^2 - 12x$." }),
          expr("Expand $-2x(3x^2 - x + 4)$.", "-6x^3 + 2x^2 - 8x", { near: [["-6x^3 - 2x^2 - 8x", "$-2x \\cdot (-x) = +2x^2$."]], hints: ["Multiply $-2x$ by each of the three terms."], why: "$-6x^3 + 2x^2 - 8x$." })
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Multiplying binomials",
        blurb: "(x + a)(x + b) as a rectangle of tiles — and every term times every term.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A **binomial** has two terms. Here is $(x + p)(x + q)$ laid out in algebra tiles: a big $x^2$ square, strips worth $x$, small squares worth $1$. Change $p$ and $q$ and watch what's inside.",
            scene: { type: "tiles", mode: "multiply", adjust: true, p: 3, q: 2, min: -5, gate: true }, gate: true,
            then: "The rectangle always holds one $x^2$, $p + q$ strips and $p \\times q$ unit squares: $(x + p)(x + q) = x^2 + (p + q)x + pq$." },
          { type: "learn", kicker: "Watch",
            prompt: "Without tiles, multiply **each** term of the first bracket by **each** term of the second — four products — and combine like terms.",
            scene: { type: "walk", rows: [
              { m: "(x + 3)(x + 2)", say: "" },
              { m: "x \\cdot x + x \\cdot 2 + 3 \\cdot x + 3 \\cdot 2", say: "Every term times every term." },
              { m: "x^2 + 2x + 3x + 6", say: "" },
              { m: "x^2 + 5x + 6", say: "Combine the like terms in the middle." }] },
            gate: true },
          expr("Expand $(x + 4)(x + 5)$.", "x^2 + 9x + 20", { near: [["x^2 + 20", "There are four products: the middle ones, $5x$ and $4x$, are missing."]], hints: ["$x \\cdot x$, $x \\cdot 5$, $4 \\cdot x$, $4 \\cdot 5$."], why: "$x^2 + 5x + 4x + 20 = x^2 + 9x + 20$." }),
          { type: "learn", kicker: "Negatives",
            prompt: "Signs travel with their terms.",
            scene: { type: "walk", rows: [
              { m: "(x - 3)(x + 7)", say: "" },
              { m: "x^2 + 7x - 3x - 21", say: "$-3 \\cdot x = -3x$ and $-3 \\cdot 7 = -21$." },
              { m: "x^2 + 4x - 21", say: "" }] },
            gate: true },
          expr("Expand $(x - 6)(x - 2)$.", "x^2 - 8x + 12", { near: [["x^2 - 8x - 12", "$-6 \\cdot -2 = +12$."]], hints: ["$(-6)(-2)$ is positive."], why: "$x^2 - 2x - 6x + 12 = x^2 - 8x + 12$." }),
          { type: "learn", kicker: "With coefficients",
            prompt: "The same four products, with numbers in front.",
            scene: { type: "walk", rows: [
              { m: "(2x + 1)(3x - 4)", say: "" },
              { m: "6x^2 - 8x + 3x - 4", say: "$2x \\cdot 3x = 6x^2$, $2x \\cdot (-4) = -8x$, $1 \\cdot 3x$, $1 \\cdot (-4)$." },
              { m: "6x^2 - 5x - 4", say: "" }] },
            gate: true },
          expr("Expand $(3x - 2)(x + 5)$.", "3x^2 + 13x - 10", { near: [["3x^2 - 10", "The middle products, $15x$ and $-2x$, are missing."]], hints: ["$3x \\cdot x$, $3x \\cdot 5$, $-2 \\cdot x$, $-2 \\cdot 5$."], why: "$3x^2 + 15x - 2x - 10 = 3x^2 + 13x - 10$." })
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Special products",
        blurb: "(a + b)(a − b) and (a + b)²: two patterns worth knowing by heart.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Difference of squares",
            prompt: "Multiply a sum by the matching difference and the middle terms cancel.",
            scene: { type: "walk", rows: [
              { m: "(x + 5)(x - 5)", say: "" },
              { m: "x^2 - 5x + 5x - 25", say: "$-5x$ and $+5x$ cancel." },
              { m: "x^2 - 25", say: "A square minus a square." },
              { m: "(a + b)(a - b) = a^2 - b^2", say: "The pattern." }] },
            gate: true },
          expr("Expand $(x + 7)(x - 7)$.", "x^2 - 49", { near: [["x^2 + 49", "$7 \\cdot (-7) = -49$."], ["x^2 - 14x - 49", "The middle terms, $-7x$ and $+7x$, cancel."]], hints: ["It's $a^2 - b^2$."], why: "$x^2 - 49$." }),
          expr("Expand $(3x - 2)(3x + 2)$.", "9x^2 - 4", { near: [["3x^2 - 4", "$(3x)^2 = 9x^2$."]], hints: ["$(3x)^2 - 2^2$."], why: "$9x^2 - 4$." }),
          { type: "learn", kicker: "Perfect squares",
            prompt: "A binomial squared is the binomial times itself — and it has a middle term.",
            scene: { type: "walk", rows: [
              { m: "(x + 3)^2 = (x + 3)(x + 3)", say: "" },
              { m: "= x^2 + 3x + 3x + 9", say: "" },
              { m: "= x^2 + 6x + 9", say: "**Not** $x^2 + 9$: the middle term is twice $3x$." },
              { m: "(a + b)^2 = a^2 + 2ab + b^2", say: "" }] },
            gate: true },
          expr("Expand $(x - 4)^2$.", "x^2 - 8x + 16", { near: [["x^2 + 16", "$(x - 4)^2$ is $(x - 4)(x - 4)$: there's a middle term, $-8x$."], ["x^2 - 16", "$(-4)(-4) = +16$, and there's a middle term."]], hints: ["$(x - 4)(x - 4)$."], why: "$x^2 - 4x - 4x + 16 = x^2 - 8x + 16$." }),
          expr("Expand $(2x + 5)^2$.", "4x^2 + 20x + 25", { near: [["4x^2 + 25", "Don't forget the middle term: $2 \\cdot 2x \\cdot 5 = 20x$."]], hints: ["$(2x)^2 + 2(2x)(5) + 5^2$."], why: "$4x^2 + 20x + 25$." })
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Taking out a common factor",
        blurb: "Factoring runs multiplying backwards — starting with the greatest common factor.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "Backwards",
            prompt: "**Factoring** writes a polynomial as a product. $x + 3$ is a **factor** of $x^2 + 5x + 6$ because $x^2 + 5x + 6 = (x + 2)(x + 3)$ — just as 3 is a factor of 12 because $12 = 4 \\times 3$. The first step is always to take out the **greatest common factor** (GCF) of all the terms.",
            scene: { type: "walk", rows: [
              { m: "6x^3 + 9x^2", say: "Numbers: the GCF of 6 and 9 is 3. Letters: both have at least $x^2$." },
              { m: "= 3x^2(2x + 3)", say: "Divide each term by $3x^2$." },
              { m: "3x^2 \\cdot 2x + 3x^2 \\cdot 3 = 6x^3 + 9x^2 \\; ✓", say: "Check by multiplying back." }] },
            gate: true },
          expr("Factor $10x^2 - 15x$ completely.", "5x(2x - 3)", { form: "fully-factored", ph: "e.g. 2x(x - 4)",
            near: [["5(2x^2 - 3x)", "The terms share an $x$ too."]], hints: ["The GCF of 10 and 15 is 5, and both terms have $x$."], why: "$5x(2x - 3)$." }),
          expr("Factor $4x^3 + 8x^2 + 12x$ completely.", "4x(x^2 + 2x + 3)", { form: "fully-factored", ph: "e.g. 2x(x^2 + x + 1)",
            near: [["2x(2x^2 + 4x + 6)", "$2x^2 + 4x + 6$ still has a common factor of 2."]], hints: ["The GCF is $4x$."], why: "$4x(x^2 + 2x + 3)$ — and $x^2 + 2x + 3$ doesn't factor further." })
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Factoring x² + bx + c",
        blurb: "Two numbers that multiply to c and add to b.",
        mins: 13, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Here are the tiles for $x^2 + 5x + 6$. Set $p$ and $q$ so that the rectangle $(x + p)(x + q)$ uses exactly these tiles: 5 strips and 6 unit squares.",
            scene: { type: "tiles", mode: "factor", target: { b: 5, c: 6 }, p: 1, q: 1, min: -6, gate: true }, gate: true,
            then: "$p = 2$ and $q = 3$: they **add** to 5 (the strips) and **multiply** to 6 (the unit squares). So $x^2 + 5x + 6 = (x + 2)(x + 3)$." },
          { type: "learn", kicker: "Watch",
            prompt: "To factor $x^2 + bx + c$, find two numbers that multiply to $c$ and add to $b$.",
            scene: { type: "walk", rows: [
              { m: "x^2 + 7x + 12", say: "Multiply to 12, add to 7." },
              { m: "1 \\cdot 12, \\; 2 \\cdot 6, \\; 3 \\cdot 4", say: "The pairs that multiply to 12." },
              { m: "3 + 4 = 7", say: "" },
              { m: "(x + 3)(x + 4)", say: "" }] },
            gate: true },
          expr("Factor $x^2 + 9x + 14$.", "(x + 2)(x + 7)", { form: "fully-factored", near: [["(x + 1)(x + 14)", "Those multiply to 14 but add to 15."]], hints: ["Multiply to 14, add to 9."], why: "$2 \\cdot 7 = 14$ and $2 + 7 = 9$." }),
          { type: "learn", kicker: "With negatives",
            prompt: "If $c$ is negative, the two numbers have opposite signs; if $c$ is positive and $b$ negative, both are negative.",
            scene: { type: "walk", rows: [
              { m: "x^2 - 2x - 15", say: "Multiply to $-15$, add to $-2$." },
              { m: "3 \\cdot (-5) = -15, \\;\\; 3 + (-5) = -2", say: "" },
              { m: "(x + 3)(x - 5)", say: "" }] },
            gate: true },
          expr("Factor $x^2 - 5x - 24$.", "(x - 8)(x + 3)", { form: "fully-factored", near: [["(x + 8)(x - 3)", "Those add to $+5$. You need $-5$."]], hints: ["Multiply to $-24$, add to $-5$."], why: "$-8 \\cdot 3 = -24$ and $-8 + 3 = -5$." }),
          { type: "tiles", prompt: "Factor $x^2 - x - 6$ on the tiles: set $p$ and $q$.", skill: "Factoring quadratics intro", mode: "factor", target: { b: -1, c: -6 }, p: 1, q: 1, min: -6, answer: [2, -3],
            hints: ["Multiply to $-6$, add to $-1$."], why: "$p = 2$, $q = -3$: $(x + 2)(x - 3)$." },
          { type: "learn", kicker: "Common factor first",
            prompt: "If every term shares a factor, take it out first — then factor what's left.",
            scene: { type: "walk", rows: [
              { m: "2x^2 + 10x + 12", say: "Every term is even." },
              { m: "= 2(x^2 + 5x + 6)", say: "" },
              { m: "= 2(x + 2)(x + 3)", say: "Factored completely." }] },
            gate: true },
          expr("Factor $3x^2 - 3x - 36$ completely.", "3(x - 4)(x + 3)", { form: "fully-factored", near: [["3(x^2 - x - 12)", "Keep going: $x^2 - x - 12$ factors too."]], hints: ["Take out 3 first: $3(x^2 - x - 12)$.", "Then multiply to $-12$, add to $-1$."], why: "$3(x - 4)(x + 3)$." })
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Factoring by grouping",
        blurb: "Four terms in pairs, and ax² + bx + c by splitting the middle.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "Four terms",
            prompt: "Group the terms in pairs and factor each pair. If the brackets match, that bracket is a common factor.",
            scene: { type: "walk", rows: [
              { m: "x^3 + 3x^2 + 2x + 6", say: "" },
              { m: "x^2(x + 3) + 2(x + 3)", say: "Factor each pair." },
              { m: "(x^2 + 2)(x + 3)", say: "Take out the shared $(x + 3)$." }] },
            gate: true },
          { type: "learn", kicker: "ax² + bx + c",
            prompt: "When $x^2$ has a coefficient, find two numbers that multiply to $a \\times c$ and add to $b$; use them to split the middle term; then group.",
            scene: { type: "walk", rows: [
              { m: "2x^2 + 7x + 3", say: "$a \\times c = 6$: multiply to 6, add to 7 — that's 1 and 6." },
              { m: "2x^2 + x + 6x + 3", say: "Split $7x$ into $x + 6x$." },
              { m: "x(2x + 1) + 3(2x + 1)", say: "Group." },
              { m: "(x + 3)(2x + 1)", say: "" }] },
            gate: true },
          expr("Factor $3x^2 + 10x + 8$.", "(3x + 4)(x + 2)", { form: "fully-factored", near: [["(3x + 2)(x + 4)", "That expands to $3x^2 + 14x + 8$."]], hints: ["$a \\times c = 24$: multiply to 24, add to 10.", "4 and 6: $3x^2 + 4x + 6x + 8$."], why: "$x(3x + 4) + 2(3x + 4) = (3x + 4)(x + 2)$." }),
          expr("Factor $2x^2 - 5x - 3$.", "(2x + 1)(x - 3)", { form: "fully-factored", near: [["(2x - 1)(x + 3)", "That expands to $2x^2 + 5x - 3$."]], hints: ["$a \\times c = -6$: multiply to $-6$, add to $-5$.", "$1$ and $-6$."], why: "$2x^2 + x - 6x - 3 = x(2x + 1) - 3(2x + 1)$." }),
          expr("Factor $6x^2 + 11x - 10$.", "(2x + 5)(3x - 2)", { form: "fully-factored", hints: ["$a \\times c = -60$: multiply to $-60$, add to 11.", "15 and $-4$."], why: "$6x^2 + 15x - 4x - 10 = 3x(2x + 5) - 2(2x + 5)$." })
        ]
      },
      /* ============================================================== 7 */
      {
        title: "Two special patterns",
        blurb: "Differences of squares and perfect squares, spotted and factored in one step.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Difference of squares",
            prompt: "Read the special product backwards: $a^2 - b^2 = (a + b)(a - b)$.",
            scene: { type: "walk", rows: [
              { m: "x^2 - 49 = (x + 7)(x - 7)", say: "$x^2$ and $49 = 7^2$." },
              { m: "4x^2 - 25 = (2x + 5)(2x - 5)", say: "$4x^2 = (2x)^2$." },
              { m: "2x^2 - 18 = 2(x^2 - 9) = 2(x + 3)(x - 3)", say: "Take out a common factor first." }] },
            gate: true },
          expr("Factor $x^2 - 81$.", "(x + 9)(x - 9)", { form: "fully-factored", near: [["(x - 9)^2", "That expands to $x^2 - 18x + 81$."]], hints: ["$81 = 9^2$."], why: "$(x + 9)(x - 9)$." }),
          expr("Factor $9x^2 - 16$.", "(3x + 4)(3x - 4)", { form: "fully-factored", hints: ["$9x^2 = (3x)^2$ and $16 = 4^2$."], why: "$(3x + 4)(3x - 4)$." }),
          { type: "learn", kicker: "Perfect squares",
            prompt: "If the first and last terms are squares and the middle is twice their roots multiplied, it's a perfect square: $a^2 + 2ab + b^2 = (a + b)^2$.",
            scene: { type: "walk", rows: [
              { m: "x^2 + 10x + 25", say: "$x^2$ and $25 = 5^2$; middle $2 \\cdot x \\cdot 5 = 10x$ ✓." },
              { m: "= (x + 5)^2", say: "" },
              { m: "4x^2 - 12x + 9 = (2x - 3)^2", say: "$(2x)^2$, $3^2$, and $2 \\cdot 2x \\cdot 3 = 12x$ — with a minus." }] },
            gate: true },
          expr("Factor $x^2 - 12x + 36$.", "(x - 6)^2", { form: "fully-factored", ph: "e.g. (x - 3)^2", near: [["(x + 6)^2", "The middle term is $-12x$, so it's a minus."], ["(x + 6)(x - 6)", "That's $x^2 - 36$."]], hints: ["$36 = 6^2$ and $2 \\cdot 6 = 12$."], why: "$(x - 6)^2$." }),
          { type: "choice", prompt: "Which of these is a perfect square?", skill: "Perfect squares intro",
            options: [{ t: "$x^2 + 6x + 9$" }, { t: "$x^2 + 6x + 8$", fb: "8 isn't a square number." }, { t: "$x^2 + 9$", fb: "There's no middle term: $(x + 3)^2$ would be $x^2 + 6x + 9$." }],
            answer: 0, why: "$x^2 + 6x + 9 = (x + 3)^2$." }
        ]
      },
      /* ============================================================== 8 */
      {
        title: "Which method?",
        blurb: "A strategy for factoring any quadratic.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "A strategy",
            prompt: "1. Take out any **common factor** first. <br>2. **Two terms**, a square minus a square? Difference of squares. <br>3. **Three terms**? Check for a perfect square; otherwise find two numbers that multiply to $ac$ and add to $b$ (when $a = 1$, just $c$). <br>4. **Four terms**? Group them. <br>5. Check each factor to see whether it factors further, and multiply back to check." },
          expr("Factor $5x^2 - 45$ completely.", "5(x + 3)(x - 3)", { form: "fully-factored", near: [["5(x^2 - 9)", "$x^2 - 9$ is a difference of squares."]], hints: ["Common factor first: 5."], why: "$5(x^2 - 9) = 5(x + 3)(x - 3)$." }),
          expr("Factor $2x^2 + 8x + 8$ completely.", "2(x + 2)^2", { form: "fully-factored", near: [["2(x^2 + 4x + 4)", "$x^2 + 4x + 4$ is a perfect square."]], hints: ["Take out 2 first."], why: "$2(x^2 + 4x + 4) = 2(x + 2)^2$." }),
          expr("Factor $4x^2 - 4x - 15$ completely.", "(2x + 3)(2x - 5)", { form: "fully-factored", hints: ["No common factor. $a \\times c = -60$: multiply to $-60$, add to $-4$.", "6 and $-10$."], why: "$4x^2 + 6x - 10x - 15 = 2x(2x + 3) - 5(2x + 3)$." })
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Polynomials, and multiplying them.", skills: ["a13-poly", "a13-mono", "a13-bin-area", "a13-bin-intro", "a13-bin"], per: 2 },
      { title: "Quiz 2", after: 5, blurb: "Special products, the GCF, and factoring x² + bx + c.", skills: ["a13-dos-mult", "a13-sq-mult", "a13-gcf", "a13-fact", "a13-fact-gcf"], per: 2 },
      { title: "Quiz 3", after: 7, blurb: "Grouping, differences of squares and perfect squares.", skills: ["a13-group", "a13-dos-intro", "a13-dos", "a13-ps-intro", "a13-ps"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Polynomials",
        keys: [["term", "one piece of a sum, with its sign"], ["degree", "the highest power of the letter"], ["standard form", "terms from the highest power down"], ["leading coefficient", "the number in front of the highest power"]],
        eg: { q: "Describe $5x^2 - 3x^4 + x - 9$.", rows: [["-3x^4 + 5x^2 + x - 9", "Standard form."], ["\\text{degree } 4, \\text{ leading coefficient } -3", ""]] } },
      { t: "Multiplying polynomials",
        say: ["Multiply **every** term of one by **every** term of the other, then combine like terms. An area model — a rectangle with the terms along its sides — keeps track of the products."],
        eg: { q: "Expand $(3x - 2)(x + 5)$.", rows: [["3x^2 + 15x - 2x - 10", "Four products."], ["3x^2 + 13x - 10", "Combine."]] },
        watch: "Signs belong to their terms: $(-2)(5) = -10$." },
      { t: "Special products",
        keys: [["$(a + b)(a - b)$", "$a^2 - b^2$ — the middle terms cancel"], ["$(a + b)^2$", "$a^2 + 2ab + b^2$"], ["$(a - b)^2$", "$a^2 - 2ab + b^2$"]],
        watch: "$(x + 3)^2$ is $x^2 + 6x + 9$, **not** $x^2 + 9$." },
      { t: "Factoring: common factors and x² + bx + c",
        say: ["Always take out the greatest common factor first: $10x^2 - 15x = 5x(2x - 3)$.",
              "To factor $x^2 + bx + c$, find two numbers that **multiply to $c$** and **add to $b$**: $x^2 - 5x - 24 = (x - 8)(x + 3)$."],
        eg: { q: "Factor $3x^2 - 3x - 36$.", rows: [["3(x^2 - x - 12)", "Common factor first."], ["3(x - 4)(x + 3)", "$-4 \\cdot 3 = -12$, $-4 + 3 = -1$."]] },
        watch: "Check by multiplying back. $(x + 8)(x - 3)$ gives $+5x$, not $-5x$." },
      { t: "Factoring by grouping",
        say: ["For $ax^2 + bx + c$: find two numbers that multiply to $a \\times c$ and add to $b$, split the middle term with them, then factor each pair and take out the shared bracket."],
        eg: { q: "Factor $2x^2 - 5x - 3$.", rows: [["2x^2 + x - 6x - 3", "$ac = -6$: $1$ and $-6$."], ["x(2x + 1) - 3(2x + 1)", "Group."], ["(2x + 1)(x - 3)", ""]] } },
      { t: "Differences of squares and perfect squares",
        keys: [["$a^2 - b^2$", "$(a + b)(a - b)$"], ["$a^2 + 2ab + b^2$", "$(a + b)^2$"], ["$a^2 - 2ab + b^2$", "$(a - b)^2$"]],
        say: ["Spot them by their shape: two squares with a minus between them; or two square end terms with a middle term twice their roots multiplied."],
        watch: "A **sum** of squares, like $x^2 + 9$, doesn't factor." },
      { t: "A strategy",
        say: ["Common factor first. Then count the terms: two → difference of squares; three → perfect square or the $ac$ method; four → grouping. Finally, check every factor for more factoring, and multiply back."] }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a13-poly", title: "Polynomials intro", lesson: 1,
        gen: function (R) {
          var pows = R.shuffle([4, 3, 2, 1, 0]).slice(0, R.int(3, 4)), coefs = pows.map(function () { return R.nz(-9, 9); });
          var terms = pows.map(function (p, i) { return [coefs[i], p === 0 ? "" : p === 1 ? "x" : "x^" + p]; });
          var tex = poly(terms), deg = Math.max.apply(null, pows), lead = coefs[pows.indexOf(deg)], q = R.int(0, 2);
          if (q === 0) return mc(R, { prompt: "What is the degree of $" + tex + "$?", right: "$" + deg + "$",
            wrong: [{ t: "$" + pows[0] + "$", fb: "The first term isn't necessarily the highest power. Look for the biggest exponent." }, { t: "$" + terms.length + "$", fb: "That's the number of terms." }, { t: "$" + Math.abs(lead) + "$", fb: "That's a coefficient." }].filter(function (w) { return w.t !== "$" + deg + "$"; }),
            hints: ["The degree is the highest power of $x$."], why: "The highest power is $x^{" + deg + "}$." });
          if (q === 1) return mc(R, { prompt: "In standard form, what is the leading coefficient of $" + tex + "$?", right: "$" + lead + "$",
            wrong: [{ t: "$" + coefs[0] + "$", fb: "Put the terms in order, highest power first." }, { t: "$" + -lead + "$", fb: "Keep the sign of the term." }, { t: "$" + deg + "$", fb: "That's the degree." }].filter(function (w) { return w.t !== "$" + lead + "$"; }),
            hints: ["Write the terms from highest power down; the first term's number is the leading coefficient."], why: "The highest-power term is $" + poly([terms[pows.indexOf(deg)]]) + "$." });
          return mc(R, { prompt: "How many terms does $" + tex + "$ have?", right: "$" + terms.length + "$",
            wrong: [{ t: "$" + deg + "$", fb: "That's the degree." }, { t: "$" + (terms.length + 1) + "$", fb: "Count the pieces separated by $+$ and $-$." }].filter(function (w) { return w.t !== "$" + terms.length + "$"; }),
            hints: ["Terms are the pieces between the $+$ and $-$ signs."], why: "$" + terms.map(function (t) { return poly([t]); }).join(", ") + "$." });
        } },
      { id: "a13-mono", title: "Multiply monomials by polynomials", lesson: 1,
        gen: function (R) {
          var k = R.nz(-5, 6), p = R.int(1, 2), a = R.nz(-5, 5), b = R.nz(-9, 9), c = R.chance(0.4) ? R.nz(-6, 6) : 0;
          var mono = poly([[k, p === 1 ? "x" : "x^2"]]);
          var terms = c ? [[a, "x^2"], [b, "x"], [c, ""]] : [[a, "x"], [b, ""]];
          var inner = poly(terms), res = terms.map(function (t) { var e = (t[1] === "x^2" ? 2 : t[1] === "x" ? 1 : 0) + p; return [k * t[0], e === 0 ? "" : e === 1 ? "x" : "x^" + e]; });
          var ans = poly(res);
          var s = expr("Expand $" + mono + "(" + inner + ")$.", ans, { near: [[poly(res.slice(0, 1).concat(terms.slice(1))), "The $" + mono + "$ multiplies every term in the bracket."]],
            hints: ["Multiply $" + mono + "$ by each term in the bracket.", "Add the exponents of $x$: $x^" + p + " \\cdot x = x^" + (p + 1) + "$."], why: "$" + ans + "$." });
          if (!c && R.chance(0.5)) s.scene = area([mono], terms.map(function (t) { return poly([t]); }), [res.map(function (t) { return poly([t]).replace(/\^2/, "²").replace(/\^3/, "³"); })]);
          return s;
        } },
      { id: "a13-bin-area", title: "Multiply binomials: area model", lesson: 2,
        gen: function (R) {
          var p = R.nz(-6, 7), q = R.nz(-6, 7), b = p + q, c = p * q;
          var cells = [["x²", (q < 0 ? "−" : "") + (Math.abs(q) === 1 ? "" : Math.abs(q)) + "x"], [(p < 0 ? "−" : "") + (Math.abs(p) === 1 ? "" : Math.abs(p)) + "x", String(c).replace("-", "−")]];
          return expr("Use the area model to expand $" + fac(1, p) + fac(1, q) + "$.", quad(1, b, c),
            { scene: area(["x", String(p).replace("-", "−")], ["x", String(q).replace("-", "−")], cells), near: [[quad(1, 0, c), "Add the two middle rectangles: $" + poly([[q, "x"]]) + "$ and $" + poly([[p, "x"]]) + "$."]].filter(function () { return b !== 0; }),
              hints: ["Fill in the four areas.", "Add the like terms: $" + poly([[p, "x"], [q, "x"]]) + "$."], why: "$x^2 " + (b ? (b < 0 ? "- " : "+ ") + (Math.abs(b) === 1 ? "" : Math.abs(b)) + "x " : "") + (c < 0 ? "- " + -c : "+ " + c) + "$." });
        } },
      { id: "a13-bin-intro", title: "Multiply binomials intro", lesson: 2,
        gen: function (R) {
          var p = R.nz(-9, 9), q = R.nz(-9, 9), b = p + q, c = p * q;
          return expr("Expand $" + fac(1, p) + fac(1, q) + "$.", quad(1, b, c), {
            near: [[quad(1, 0, c), "There are four products: don't forget the middle ones."], [quad(1, b, -c), "$" + p + " \\times " + q + " = " + c + "$."]].filter(function (n) { return typed(n[0]) !== typed(quad(1, b, c)); }),
            hints: ["Every term times every term: $x \\cdot x$, $x \\cdot " + q + "$, $" + p + " \\cdot x$, $" + p + " \\cdot " + q + "$."], why: "$" + quad(1, b, c) + "$." });
        } },
      { id: "a13-bin", title: "Multiply binomials", lesson: 2,
        gen: function (R) {
          var a = R.int(1, 5), b = R.nz(-7, 7), c = R.int(1, 5), d = R.nz(-7, 7);
          if (a === 1 && c === 1) a = R.int(2, 5);
          var A = a * c, B = a * d + b * c, C = b * d;
          return expr("Expand $" + fac(a, b) + fac(c, d) + "$.", quad(A, B, C), {
            near: [[quad(A, 0, C), "Two of the four products are missing: $" + poly([[a * d, "x"]]) + "$ and $" + poly([[b * c, "x"]]) + "$."], [quad(a + c, B, C), "$" + poly([[a, "x"]]) + " \\cdot " + poly([[c, "x"]]) + " = " + poly([[A, "x^2"]]) + "$."]].filter(function (n) { return typed(n[0]) !== typed(quad(A, B, C)); }),
            hints: ["Four products: $" + poly([[a, "x"]]) + " \\cdot " + poly([[c, "x"]]) + "$, $" + poly([[a, "x"]]) + " \\cdot " + d + "$, $" + b + " \\cdot " + poly([[c, "x"]]) + "$, $" + b + " \\cdot " + d + "$."], why: "$" + poly([[A, "x^2"], [a * d, "x"], [b * c, "x"], [C, ""]]) + " = " + quad(A, B, C) + "$." });
        } },
      { id: "a13-dos-mult", title: "Multiply difference of squares", lesson: 3,
        gen: function (R) {
          var a = R.int(1, 5), b = R.int(1, 9), first = R.chance(0.5);
          var tex = first ? fac(a, b) + fac(a, -b) : fac(a, -b) + fac(a, b);
          return expr("Expand $" + tex + "$.", quad(a * a, 0, -b * b), {
            near: [[quad(a * a, 0, b * b), "$" + b + " \\times (-" + b + ") = -" + b * b + "$."], [quad(a, 0, -b * b), "$(" + a + "x)^2 = " + a * a + "x^2$."]].filter(function (n) { return typed(n[0]) !== typed(quad(a * a, 0, -b * b)); }),
            hints: ["The middle terms cancel: it's $a^2 - b^2$."], why: "$(" + (a === 1 ? "x" : a + "x") + ")^2 - " + b + "^2 = " + quad(a * a, 0, -b * b) + "$." });
        } },
      { id: "a13-sq-mult", title: "Multiply perfect squares of binomials", lesson: 3,
        gen: function (R) {
          var a = R.int(1, 4), b = R.nz(-8, 8);
          return expr("Expand $" + fac(a, b) + "^2$.", quad(a * a, 2 * a * b, b * b), {
            near: [[quad(a * a, 0, b * b), "$" + fac(a, b) + "^2$ is $" + fac(a, b) + fac(a, b) + "$ — it has a middle term."], [quad(a * a, a * b, b * b), "The middle term is **twice** $" + poly([[a, "x"]]) + " \\cdot " + paren(b) + "$."]],
            hints: ["Write it as $" + fac(a, b) + fac(a, b) + "$.", "$(a + b)^2 = a^2 + 2ab + b^2$."], why: "$" + quad(a * a, 2 * a * b, b * b) + "$." });
        } },
      { id: "a13-gcf", title: "GCF factoring introduction", lesson: 4,
        gen: function (R) {
          var g = R.pick([2, 3, 4, 5, 6]), e = R.int(0, 2), a = R.int(1, 5), b = R.nz(-7, 7);
          while (gcd(a, b) !== 1) b = R.nz(-7, 7);
          var mono = poly([[g, e === 0 ? "" : e === 1 ? "x" : "x^2"]]);
          var tA = [g * a, e + 1 === 1 ? "x" : "x^" + (e + 1)], tB = [g * b, e === 0 ? "" : e === 1 ? "x" : "x^2"];
          var ex = poly([tA, tB]), ans = mono + fac(a, b);
          return expr("Factor $" + ex + "$ completely.", ans, { form: "fully-factored", ph: "e.g. 3x(2x - 5)",
            near: e > 0 ? [[g + "(" + poly([[a, e + 1 === 1 ? "x" : "x^" + (e + 1)], [b, e === 1 ? "x" : "x^2"]]) + ")", "The terms share a power of $x$ too."]] : [],
            hints: ["The GCF of " + g * a + " and " + Math.abs(g * b) + " is " + g + (e ? ", and both terms have at least $" + (e === 1 ? "x" : "x^2") + "$." : ".")], why: "$" + ans + "$: check by multiplying back." });
        } },
      { id: "a13-fact", title: "Factoring quadratics intro", lesson: 5,
        gen: function (R) {
          var p = R.nz(-9, 9), q = R.nz(-9, 9), b = p + q, c = p * q;
          if (R.chance(0.3) && Math.abs(p) <= 6 && Math.abs(q) <= 6) return { type: "tiles", prompt: "Factor $" + quad(1, b, c) + "$ on the tiles: set $p$ and $q$ in $(x + p)(x + q)$.", mode: "factor", target: { b: b, c: c }, p: 1, q: 1, min: -6, answer: [p, q],
            hints: ["Multiply to $" + c + "$, add to $" + b + "$."], why: "$p = " + p + "$, $q = " + q + "$: $" + fac(1, p) + fac(1, q) + "$." };
          return expr("Factor $" + quad(1, b, c) + "$.", fac(1, p) + fac(1, q), { form: "fully-factored",
            near: [[fac(1, -p) + fac(1, -q), "Those multiply to " + c + " but add to $" + -b + "$."]].filter(function () { return b !== 0; }),
            hints: ["Find two numbers that multiply to $" + c + "$ and add to $" + b + "$."], why: "$" + p + " \\times " + q + " = " + c + "$ and $" + p + " + " + (q < 0 ? "(" + q + ")" : q) + " = " + b + "$." });
        } },
      { id: "a13-fact-gcf", title: "Factoring quadratics with a common factor", lesson: 5,
        gen: function (R) {
          var k = R.pick([2, 3, 4, 5, -1, -2, -3]), p = R.nz(-7, 7), q = R.nz(-7, 7);
          var ans = kFac(k) + fac(1, p) + fac(1, q);
          if (p === q) ans = kFac(k) + fac(1, p) + "^2";
          return expr("Factor $" + quad(k, k * (p + q), k * p * q) + "$ completely.", ans, { form: "fully-factored",
            near: [[kFac(k) + "(" + quad(1, p + q, p * q) + ")", "Keep going: $" + quad(1, p + q, p * q) + "$ factors too."]],
            hints: ["Take out the common factor, $" + k + "$.", "Then factor $" + quad(1, p + q, p * q) + "$."], why: "$" + kFac(k) + "(" + quad(1, p + q, p * q) + ") = " + ans + "$." });
        } },
      { id: "a13-group", title: "Factor quadratics by grouping", lesson: 6,
        gen: function (R) {
          var a = R.int(2, 5), b = R.nz(-7, 7), c = R.int(1, 3), d = R.nz(-7, 7);
          while (gcd(a, b) !== 1) b = R.nz(-7, 7);
          while (gcd(c, d) !== 1) d = R.nz(-7, 7);
          var A = a * c, B = a * d + b * c, C = b * d;
          return expr("Factor $" + quad(A, B, C) + "$.", fac(a, b) + fac(c, d), { form: "fully-factored",
            near: [[fac(a, d) + fac(c, b), "That expands to $" + quad(A, a * b + c * d, C) + "$."]].filter(function () { return a * b + c * d !== B; }),
            hints: ["$a \\times c = " + A * C + "$: find two numbers that multiply to " + A * C + " and add to " + B + ".", "They're $" + a * d + "$ and $" + b * c + "$: split the middle term and group."],
            why: "$" + poly([[A, "x^2"], [a * d, "x"], [b * c, "x"], [C, ""]]) + " = " + fac(a, b) + fac(c, d) + "$." });
        } },
      { id: "a13-dos-intro", title: "Difference of squares intro", lesson: 7,
        gen: function (R) {
          var b = R.int(1, 12);
          return expr("Factor $" + quad(1, 0, -b * b) + "$.", fac(1, b) + fac(1, -b), { form: "fully-factored",
            near: [[fac(1, -b) + "^2", "That expands to $" + quad(1, -2 * b, b * b) + "$."]], hints: ["$" + b * b + " = " + b + "^2$: it's $a^2 - b^2$."], why: "$" + fac(1, b) + fac(1, -b) + "$." });
        } },
      { id: "a13-dos", title: "Difference of squares", lesson: 7,
        gen: function (R) {
          if (R.chance(0.5)) { var a = R.int(2, 6), b = R.int(1, 9); while (gcd(a, b) !== 1) b = R.int(1, 9);
            return expr("Factor $" + quad(a * a, 0, -b * b) + "$.", fac(a, b) + fac(a, -b), { form: "fully-factored", hints: ["$" + a * a + "x^2 = (" + a + "x)^2$ and $" + b * b + " = " + b + "^2$."], why: "$" + fac(a, b) + fac(a, -b) + "$." }); }
          var k = R.pick([2, 3, 5, 7]), c = R.int(1, 8);
          return expr("Factor $" + quad(k, 0, -k * c * c) + "$ completely.", k + fac(1, c) + fac(1, -c), { form: "fully-factored",
            near: [[k + "(" + quad(1, 0, -c * c) + ")", "Keep going: $" + quad(1, 0, -c * c) + "$ is a difference of squares."]], hints: ["Take out the common factor " + k + " first."], why: "$" + k + "(" + quad(1, 0, -c * c) + ") = " + k + fac(1, c) + fac(1, -c) + "$." });
        } },
      { id: "a13-ps-intro", title: "Perfect squares intro", lesson: 7,
        gen: function (R) {
          var b = R.nz(-10, 10);
          return expr("Factor $" + quad(1, 2 * b, b * b) + "$.", fac(1, b) + "^2", { form: "fully-factored", ph: "e.g. (x - 3)^2",
            near: [[fac(1, -b) + "^2", "Check the middle term's sign."], [fac(1, b) + fac(1, -b), "That's $" + quad(1, 0, -b * b) + "$."]], hints: ["$" + b * b + " = " + Math.abs(b) + "^2$, and the middle term is $2 \\cdot " + Math.abs(b) + " \\cdot x$."], why: "$" + fac(1, b) + "^2$." });
        } },
      { id: "a13-ps", title: "Perfect squares", lesson: 7,
        gen: function (R) {
          if (R.chance(0.6)) { var a = R.int(2, 5), b = R.nz(-7, 7); while (gcd(a, Math.abs(b)) !== 1) b = R.nz(-7, 7);
            return expr("Factor $" + quad(a * a, 2 * a * b, b * b) + "$.", fac(a, b) + "^2", { form: "fully-factored", ph: "e.g. (2x - 3)^2",
              near: [[fac(a, -b) + "^2", "The middle term is " + (b > 0 ? "positive" : "negative") + "."]], hints: ["$" + a * a + "x^2 = (" + a + "x)^2$ and $" + b * b + " = " + Math.abs(b) + "^2$.", "Check the middle: $2 \\cdot " + a + "x \\cdot " + Math.abs(b) + " = " + Math.abs(2 * a * b) + "x$."], why: "$" + fac(a, b) + "^2$." }); }
          var k = R.pick([2, 3, 5]), c = R.nz(-6, 6);
          return expr("Factor $" + quad(k, 2 * k * c, k * c * c) + "$ completely.", k + fac(1, c) + "^2", { form: "fully-factored",
            near: [[k + "(" + quad(1, 2 * c, c * c) + ")", "Keep going: $" + quad(1, 2 * c, c * c) + "$ is a perfect square."]], hints: ["Take out " + k + " first."], why: "$" + k + "(" + quad(1, 2 * c, c * c) + ") = " + k + fac(1, c) + "^2$." });
        } }
    ]
  });
})();
