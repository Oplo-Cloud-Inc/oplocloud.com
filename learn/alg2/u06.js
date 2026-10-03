/* ==========================================================================
   Algebra II — Unit 6: Factoring. See lab/core.js for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 6, section for section:
   the readiness check, then 6.1 to 6.5. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   The greatest common factor and grouping (6.1), trinomials (6.2, with the
   tiles), the special products (6.3), one strategy that chooses between them
   (6.4), and what factoring is for: solving polynomial equations (6.5).

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
  var KEYS_POLY = [["$x$", "x"], ["$x^2$", "x^2"], ["$x^3$", "x^3"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]];

  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Chapter 6 Be Prepared · Multiply polynomials, find a common factor, and solve a small equation.",
    mins: 6, v: 1,
    steps: [
      { type: "expr", kicker: "Check 1 · Multiply", prompt: "Multiply $(x + 3)(x + 4)$.",
        answer: "x^2+7x+12", shown: "x^2 + 7x + 12", form: "simplified", skill: "Multiply binomials", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "x^2+12", fb: "Add the Outer and Inner products: $4x$ and $3x$." }],
        hints: ["First, Outer, Inner, Last."], why: "$x^2 + 4x + 3x + 12 = x^2 + 7x + 12$." },
      { type: "expr", prompt: "Multiply $3x(x - 2)$.",
        answer: "3x^2-6x", shown: "3x^2 - 6x", form: "simplified", skill: "Distributive Property", keys: KEYS_POLY, placeholder: "Use x",
        near: [{ v: "3x^2-2", fb: "The $3x$ multiplies the 2 as well." }],
        hints: ["$3x \\cdot x$ and $3x \\cdot (-2)$."], why: "$3x^2 - 6x$." },
      { type: "num", kicker: "Check 2 · Common factors", prompt: "What is the greatest common factor of 12 and 18?", answer: 6, skill: "Greatest common factor",
        near: [{ v: 3, fb: "3 divides both, but so does a larger number." }, { v: 36, fb: "36 is their least common multiple. A factor divides them." }],
        hints: ["List the factors of each."], why: "6 is the largest number that divides both." },
      { type: "choice", prompt: "Which is $(x + 5)(x - 5)$?",
        options: [{ t: "$x^2 - 25$" }, { t: "$x^2 + 25$", fb: "$5 \\cdot (-5) = -25$." }, { t: "$x^2 - 10x - 25$", fb: "The middle terms are $-5x$ and $+5x$: they cancel." }],
        answer: 0, skill: "Special products", hints: ["The Outer and Inner products cancel."], why: "$x^2 - 5x + 5x - 25 = x^2 - 25$." },
      { type: "num", kicker: "Check 3 · Solve", prompt: "Solve $2x - 6 = 0$.", pre: "$x =$", answer: 3, skill: "Solve a linear equation",
        near: [{ v: -3, fb: "Add 6 to both sides: $2x = 6$." }], hints: ["Add 6, then divide by 2."], why: "$2x = 6$, so $x = 3$." },
      { type: "num", prompt: "Which two whole numbers multiply to 12 and add to 7? Type the **smaller** one.", answer: 3, skill: "Number pairs",
        near: [{ v: 4, fb: "That is the larger of the two." }, { v: 2, fb: "$2 \\cdot 6 = 12$, but $2 + 6 = 8$." }],
        hints: ["Try the factor pairs of 12: 1 and 12, 2 and 6, 3 and 4."], why: "$3 \\cdot 4 = 12$ and $3 + 4 = 7$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 6.1**. If **check 1** slipped, see lesson 5.3: factoring is that lesson run backwards. If **check 3** slipped, see lesson 2.1.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================= 6.1 · Greatest common factor and factor by grouping */
  var HOW_6_1 = [["GCF", "Find the greatest common factor of all the terms."],
                 ["Rewrite", "Rewrite each term as the GCF times what is left."],
                 ["Factor", "Use the Distributive Property in reverse: the GCF outside, the rest in parentheses."],
                 ["Check", "Multiply back. You should get the original polynomial."]];
  var HOW_6_1G = [["Group", "Group the terms in pairs that share a common factor."],
                  ["Factor each", "Factor the common factor out of each group."],
                  ["Factor again", "The two groups now share a binomial. Factor it out."],
                  ["Check", "Multiply back."]];
  LESSONS.push({
    title: "Greatest common factor and grouping",
    blurb: "Book 6.1 · Factoring out the GCF, and factoring four terms by grouping.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is the greatest common factor of 8 and 12?", answer: 4, skill: "Greatest common factor",
        near: [{ v: 2, fb: "2 divides both, but so does a larger number." }, { v: 24, fb: "24 is their least common multiple." }],
        hints: ["The largest number that divides both."], why: "$8 = 4 \\cdot 2$ and $12 = 4 \\cdot 3$." },
      { type: "learn", kicker: "Explore", prompt: "Factoring is the area model run **backwards**: you know the area and one side.",
        scene: { type: "tiles", mode: "area", rows: ["4x"], cols: ["2x", "3"], cells: [["8x^2", "12x"]], rh: [90], cw: [150, 110], readout: "$8x^2 + 12x = 4x(2x + 3)$", gate: true }, gate: true,
        then: "The GCF, $4x$, is one side. Dividing each term by it gives the other side, $2x + 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "To **factor** is to write a polynomial as a product. The first thing to look for is a factor that every term shares. Take the greatest one out, and what is left goes in parentheses.",
        scene: { type: "method", how: HOW_6_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the GCF taken out. $$8x^3 + 12x^2$$",
        scene: { type: "walk", how: HOW_6_1, rows: [
          { step: 1, m: "8x^3 + 12x^2", say: "The GCF of 8 and 12 is 4. The GCF of $x^3$ and $x^2$ is the lower power." },
          { step: 1, m: "\\text{GCF} = 4x^2", say: "Numbers and variables together.",
            ask: { prompt: "What is the GCF of $x^3$ and $x^2$?", answer: 0,
                   options: [{ t: "$x^2$" }, { t: "$x^3$", fb: "$x^3$ does not divide $x^2$. Take the lower power." }, { t: "$x$", fb: "$x$ is common, but $x^2$ is greater and still divides both." }] } },
          { step: 2, m: "4x^2 \\cdot 2x + 4x^2 \\cdot 3", say: "Each term as the GCF times what is left." },
          { step: 3, m: "4x^2(2x + 3)", say: "The GCF comes out in front." },
          { step: 4, m: "4x^2(2x + 3) = 8x^3 + 12x^2", say: "Multiplying back gives the original. ✓" }] },
        gate: true, then: "For variables, the GCF takes the **smallest** exponent that appears." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$15y^4 - 10y^2 + 5y$$",
        how: HOW_6_1, skill: "Factor out the GCF",
        steps: [
          { step: 1, ask: "What is the GCF of the three terms?", type: "choice", answer: 0,
            options: [{ t: "$5y$" }, { t: "$5y^2$", fb: "The last term, $5y$, has only one $y$." }, { t: "$5$", fb: "Every term has a $y$ as well." }],
            m: "\\text{GCF} = 5y", say: "5 divides 15, 10 and 5. The smallest power of $y$ is $y$." },
          { step: 2, ask: "Write $15y^4$ as the GCF times what is left.", type: "choice", answer: 0,
            options: [{ t: "$5y \\cdot 3y^3$" }, { t: "$5y \\cdot 3y^4$", fb: "$y \\cdot y^3 = y^4$: one $y$ has gone into the GCF." }],
            m: "5y \\cdot 3y^3 - 5y \\cdot 2y + 5y \\cdot 1", say: "The last term is $5y \\cdot 1$." },
          { step: 3, ask: "Factor out $5y$.", type: "choice", answer: 0,
            options: [{ t: "$5y(3y^3 - 2y + 1)$" }, { t: "$5y(3y^3 - 2y)$", fb: "$5y \\div 5y = 1$, not 0. A term is still left." }],
            m: "5y(3y^3 - 2y + 1)", say: "Three terms in, three terms out." },
          { step: 4, ask: "Check the last term: what is $5y \\cdot 1$?", type: "choice", answer: 0,
            options: [{ t: "$5y$" }, { t: "$5$", fb: "$5y$ times 1 is $5y$." }],
            m: "15y^4 - 10y^2 + 5y", say: "It multiplies back to the original. ✓" }],
        why: "GCF, rewrite, factor, check. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "Factor $6x^2 + 9x$ completely.",
        options: [{ t: "$3x(2x + 3)$" }, { t: "$3(2x^2 + 3x)$", fb: "Both terms inside still share an $x$." }, { t: "$x(6x + 9)$", fb: "6 and 9 still share a factor of 3." }],
        answer: 0, skill: "Factor out the GCF", hints: ["The GCF has a number part and a variable part."], why: "The GCF is $3x$: $3x \\cdot 2x + 3x \\cdot 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Four terms with no factor common to all of them? Factor **by grouping**. $$xy + 3y + 2x + 6$$",
        scene: { type: "walk", how: HOW_6_1G, rows: [
          { step: 1, m: "(xy + 3y) + (2x + 6)", say: "The first two terms share a $y$. The last two share a 2." },
          { step: 2, m: "y(x + 3) + 2(x + 3)", say: "Factor each group." },
          { step: 3, m: "(x + 3)(y + 2)", say: "Both groups contain $(x + 3)$. Factor it out." },
          { step: 4, m: "(x + 3)(y + 2) = xy + 2x + 3y + 6", say: "The same four terms. ✓" }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Factor by grouping: $x^2 + 5x + 2x + 10$.",
        options: [{ t: "$(x + 5)(x + 2)$" }, { t: "$x(x + 5) + 2(x + 5)$", fb: "One step remains: both groups share $(x + 5)$." }, { t: "$(x + 5)(x + 10)$", fb: "The second group is $2(x + 5)$, so the other factor is $x + 2$." }],
        answer: 0, skill: "Factor by grouping", hints: ["$x(x + 5) + 2(x + 5)$."], why: "$x(x + 5) + 2(x + 5) = (x + 5)(x + 2)$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the factoring **first** goes wrong.",
        lines: ["4x^2 - 8x", "4x \\cdot x - 4x \\cdot 2", "4x(x + 2)"], answer: 2, fix: "4x(x - 2)",
        fb: { 0: GIVEN, 1: "This line is right: each term is written as $4x$ times what is left." }, skill: "Factor out the GCF",
        hints: ["Multiply the last line back. Do you get $-8x$?"],
        why: "The sign stays with the term: $4x(x - 2)$." },
      { type: "choice", kicker: "Use it", prompt: "A rectangle has area $12x^2 + 20x$ and width $4x$. What is its length?",
        options: [{ t: "$3x + 5$" }, { t: "$3x^2 + 5x$", fb: "Divide each term by $4x$, not by 4." }, { t: "$8x^2 + 16x$", fb: "Area is width times length. Divide the area by the width." }],
        answer: 0, skill: "Factor out the GCF", hints: ["$12x^2 + 20x = 4x(\\ldots)$."], why: "$12x^2 + 20x = 4x(3x + 5)$." }
    ]
  });

  /* ================================================== 6.2 · Factor trinomials */
  var HOW_6_2 = [["Set up", "Write two binomials with first terms $x$: $(x \\quad)(x \\quad)$."],
                 ["Find", "Find two numbers that multiply to $c$ and add to $b$."],
                 ["Fill in", "Use those numbers as the last terms."],
                 ["Check", "Multiply the factors back."]];
  var HOW_6_2AC = [["GCF", "Factor out any GCF first."],
                   ["ac", "Multiply $a$ and $c$."],
                   ["Find", "Find two numbers that multiply to $ac$ and add to $b$."],
                   ["Split", "Split the middle term using those two numbers."],
                   ["Group", "Factor by grouping."]];
  LESSONS.push({
    title: "Factor trinomials",
    blurb: "Book 6.2 · Trinomials with a leading coefficient of 1, and the “ac” method for the rest.",
    mins: 12, v: 1,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "Which two numbers multiply to 12 and add to 7? Give both.",
        answer: [3, 4], skill: "Number pairs", placeholder: "e.g. 2, 6",
        hints: ["The factor pairs of 12: 1 and 12, 2 and 6, 3 and 4."], why: "$3 \\cdot 4 = 12$ and $3 + 4 = 7$." },
      { type: "tiles", kicker: "Explore", prompt: "Arrange $x^2 + 8x + 15$ into a rectangle: choose $p$ and $q$ so that the tiles fit exactly.",
        mode: "factor", target: { b: 8, c: 15 }, p: 1, q: 1, min: 0, answer: [3, 5], skill: "Factor a trinomial",
        hints: ["You need 8 $x$-tiles in all, and 15 unit tiles in the corner.", "Which two numbers multiply to 15 and add to 8?"], why: "$(x + 3)(x + 5)$: $3 + 5 = 8$ $x$-tiles and $3 \\cdot 5 = 15$ units." },
      { type: "learn", kicker: "The idea",
        prompt: "Multiplying $(x + m)(x + n)$ gives $x^2 + (m + n)x + mn$. So to factor $x^2 + bx + c$, run it backwards: find two numbers whose **product** is $c$ and whose **sum** is $b$.",
        scene: { type: "method", how: HOW_6_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a trinomial factored. $$x^2 - 2x - 15$$",
        scene: { type: "walk", how: HOW_6_2, rows: [
          { step: 1, m: "(x \\quad)(x \\quad)", say: "The first terms multiply to $x^2$." },
          { step: 2, m: "-5 \\cdot 3 = -15 \\quad -5 + 3 = -2", say: "The product is negative, so the signs differ. The sum is negative, so the larger number is the negative one.",
            ask: { prompt: "Which pair multiplies to $-15$ and adds to $-2$?", answer: 0,
                   options: [{ t: "$-5$ and $3$" }, { t: "$5$ and $-3$", fb: "Their sum is $+2$." }, { t: "$-15$ and $1$", fb: "Their sum is $-14$." }] } },
          { step: 3, m: "(x - 5)(x + 3)", say: "The two numbers become the last terms." },
          { step: 4, m: "(x - 5)(x + 3) = x^2 + 3x - 5x - 15", say: "The middle terms combine to $-2x$. ✓" }] },
        gate: true, then: "The signs of $b$ and $c$ tell you the signs of the two numbers before you search." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$x^2 - 9x + 20$$",
        how: HOW_6_2, skill: "Factor a trinomial",
        steps: [
          { step: 1, ask: "How does the factored form start?", type: "choice", answer: 0,
            options: [{ t: "$(x \\quad)(x \\quad)$" }, { t: "$(x^2 \\quad)(x \\quad)$", fb: "$x^2 \\cdot x = x^3$. The first terms must multiply to $x^2$." }],
            m: "(x \\quad)(x \\quad)", say: "$x \\cdot x = x^2$." },
          { step: 2, ask: "The product is $+20$ and the sum is $-9$. What must the signs of the two numbers be?", type: "choice", answer: 0,
            options: [{ t: "Both negative" }, { t: "Both positive", fb: "Then their sum would be positive." }, { t: "One of each", fb: "Then their product would be negative." }],
            m: "\\text{both negative}", say: "A positive product with a negative sum." },
          { step: 2, ask: "Which two negative numbers multiply to 20 and add to $-9$?", type: "choice", answer: 0,
            options: [{ t: "$-4$ and $-5$" }, { t: "$-2$ and $-10$", fb: "Their sum is $-12$." }, { t: "$-1$ and $-20$", fb: "Their sum is $-21$." }],
            m: "-4 \\cdot (-5) = 20 \\quad -4 + (-5) = -9", say: "Product 20, sum $-9$." },
          { step: 3, ask: "Fill in the binomials.", type: "choice", answer: 0,
            options: [{ t: "$(x - 4)(x - 5)$" }, { t: "$(x + 4)(x + 5)$", fb: "That gives $+9x$ in the middle." }],
            m: "(x - 4)(x - 5)", say: "Both last terms are negative." },
          { step: 4, ask: "Check the middle term: what is $-5x - 4x$?", type: "choice", answer: 0,
            options: [{ t: "$-9x$" }, { t: "$9x$", fb: "Both are negative." }],
            m: "x^2 - 9x + 20", say: "It multiplies back to the original. ✓" }],
        why: "Set up, find, fill in, check. Now one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Factor $x^2 + 2x - 24$.",
        answer: "(x+6)(x-4)", shown: "(x + 6)(x - 4)", form: "factored", skill: "Factor a trinomial", keys: KEYS_POLY, placeholder: "( … )( … )",
        near: [{ v: "(x-6)(x+4)", fb: "That gives $-2x$ in the middle. The larger number must be the positive one." }, { v: "(x+12)(x-2)", fb: "$12 - 2 = 10$, not 2." }],
        hints: ["Two numbers that multiply to $-24$ and add to $2$."], why: "$6 \\cdot (-4) = -24$ and $6 + (-4) = 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the leading coefficient is not 1, use the **“ac” method**. $$6x^2 + 7x + 2$$",
        scene: { type: "walk", how: HOW_6_2AC, rows: [
          { step: 1, m: "6x^2 + 7x + 2", say: "The three terms share no common factor." },
          { step: 2, m: "ac = 6 \\cdot 2 = 12", say: "Multiply the first and last coefficients." },
          { step: 3, m: "3 \\cdot 4 = 12 \\quad 3 + 4 = 7", say: "Two numbers with product 12 and sum 7." },
          { step: 4, m: "6x^2 + 3x + 4x + 2", say: "Split $7x$ into $3x + 4x$." },
          { step: 5, m: "3x(2x + 1) + 2(2x + 1)", say: "Factor each pair." },
          { step: 5, m: "(2x + 1)(3x + 2)", say: "Both groups share $(2x + 1)$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Factor $2x^2 + 7x + 3$.",
        options: [{ t: "$(2x + 1)(x + 3)$" }, { t: "$(2x + 3)(x + 1)$", fb: "The middle term would be $2x + 3x = 5x$." }, { t: "$(x + 1)(x + 3)$", fb: "The first terms must multiply to $2x^2$." }],
        answer: 0, skill: "Factor a trinomial", hints: ["$ac = 6$. Which two numbers multiply to 6 and add to 7?"], why: "$2x^2 + 6x + x + 3 = 2x(x + 3) + 1(x + 3)$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the factoring of $x^2 + 5x - 6$ **first** goes wrong.",
        lines: ["x^2 + 5x - 6", "2 \\cdot 3 = 6 \\quad 2 + 3 = 5", "(x + 2)(x + 3)"], answer: 1, fix: "6 \\cdot (-1) = -6 \\quad 6 + (-1) = 5",
        fb: { 0: GIVEN, 2: LATER }, skill: "Factor a trinomial",
        hints: ["The product must be $-6$, not $+6$."],
        why: "The numbers must multiply to $-6$: 6 and $-1$. The factors are $(x + 6)(x - 1)$." },
      { type: "choice", kicker: "Use it", prompt: "A rectangle has area $x^2 + 10x + 21$. What are its side lengths?",
        options: [{ t: "$x + 3$ and $x + 7$" }, { t: "$x + 1$ and $x + 21$", fb: "$1 + 21 = 22$, not 10." }, { t: "$x + 10$ and $x + 21$", fb: "The last terms must multiply to 21 and add to 10." }],
        answer: 0, skill: "Factor a trinomial", hints: ["Two numbers that multiply to 21 and add to 10."], why: "$3 \\cdot 7 = 21$ and $3 + 7 = 10$." }
    ]
  });

  /* ============================================ 6.3 · Factor special products */
  var HOW_6_3 = [["Pattern", "Name the pattern: perfect square trinomial, difference of squares, or sum or difference of cubes."],
                 ["a and b", "Write each term as a square (or a cube) to find $a$ and $b$."],
                 ["Apply", "Put $a$ and $b$ into the pattern."],
                 ["Check", "Multiply back."]];
  LESSONS.push({
    title: "Factor special products",
    blurb: "Book 6.3 · Perfect square trinomials, differences of squares, and sums and differences of cubes.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is $(x + 5)(x - 5)$?",
        options: [{ t: "$x^2 - 25$" }, { t: "$x^2 + 25$", fb: "$5 \\cdot (-5) = -25$." }, { t: "$x^2 - 10x - 25$", fb: "The middle terms, $-5x$ and $+5x$, cancel." }],
        answer: 0, skill: "Special products", hints: ["FOIL it: the Outer and Inner products cancel."], why: "$x^2 - 5x + 5x - 25 = x^2 - 25$." },
      { type: "learn", kicker: "The idea",
        prompt: "Special products factor on sight, once you know the patterns. $a^2 - b^2 = (a - b)(a + b)$. $a^2 + 2ab + b^2 = (a + b)^2$. A **sum** of two squares, $a^2 + b^2$, does not factor.",
        scene: { type: "method", how: HOW_6_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a difference of squares. $$9x^2 - 25$$",
        scene: { type: "walk", how: HOW_6_3, rows: [
          { step: 1, m: "9x^2 - 25", say: "Two terms, both perfect squares, with a minus between them: a difference of squares." },
          { step: 2, m: "(3x)^2 - 5^2", say: "So $a = 3x$ and $b = 5$.",
            ask: { prompt: "$9x^2$ is the square of what?", answer: 0,
                   options: [{ t: "$3x$" }, { t: "$9x$", fb: "$(9x)^2 = 81x^2$." }, { t: "$3x^2$", fb: "$(3x^2)^2 = 9x^4$." }] } },
          { step: 3, m: "(3x - 5)(3x + 5)", say: "$(a - b)(a + b)$." },
          { step: 4, m: "(3x - 5)(3x + 5) = 9x^2 + 15x - 15x - 25", say: "The middle terms cancel. ✓" }] },
        gate: true, then: "Conjugates multiply to a difference of squares, and a difference of squares factors into conjugates." },
      { type: "guided", kicker: "Together",
        prompt: "Now a trinomial. $$4x^2 + 12x + 9$$",
        how: HOW_6_3, skill: "Factor special products",
        steps: [
          { step: 1, ask: "Three terms, and the first and last are perfect squares. Which pattern might fit?", type: "choice", answer: 0,
            options: [{ t: "A perfect square trinomial" }, { t: "A difference of squares", fb: "That pattern has only two terms." }],
            m: "4x^2 + 12x + 9", say: "$a^2 + 2ab + b^2$, if the middle term fits." },
          { step: 2, ask: "What are $a$ and $b$?", type: "choice", answer: 0,
            options: [{ t: "$a = 2x$ and $b = 3$" }, { t: "$a = 4x$ and $b = 9$", fb: "$a$ and $b$ are what is squared: $(2x)^2 = 4x^2$ and $3^2 = 9$." }],
            m: "(2x)^2 + 12x + 3^2", say: "The square roots of the first and last terms." },
          { step: 2, ask: "The middle term must be $2ab$. Is it?", type: "choice", answer: 0,
            options: [{ t: "Yes: $2(2x)(3) = 12x$" }, { t: "No", fb: "$2 \\cdot 2x \\cdot 3 = 12x$, which is the middle term." }],
            m: "2(2x)(3) = 12x", say: "The pattern fits." },
          { step: 3, ask: "Apply the pattern.", type: "choice", answer: 0,
            options: [{ t: "$(2x + 3)^2$" }, { t: "$(2x - 3)^2$", fb: "The middle term is $+12x$, so the sign is plus." }, { t: "$(4x + 9)^2$", fb: "Use $a$ and $b$, not their squares." }],
            m: "(2x + 3)^2", say: "$(a + b)^2$." },
          { step: 4, ask: "Check the middle term of $(2x + 3)(2x + 3)$.", type: "choice", answer: 0,
            options: [{ t: "$6x + 6x = 12x$" }, { t: "$3x + 3x = 6x$", fb: "Outer: $2x \\cdot 3$. Inner: $3 \\cdot 2x$." }],
            m: "4x^2 + 12x + 9", say: "It multiplies back to the original. ✓" }],
        why: "Pattern, $a$ and $b$, apply, check. Now sort some patterns yourself." },
      { type: "sort", kicker: "On your own", prompt: "Which pattern does each fit?",
        bins: ["Difference of squares", "Perfect square trinomial", "Neither"],
        cards: [{ t: "$x^2 - 49$", bin: 0, fb: "$x^2 - 7^2$." },
                { t: "$x^2 + 10x + 25$", bin: 1, fb: "$x^2 + 2(x)(5) + 5^2$." },
                { t: "$x^2 + 16$", bin: 2, fb: "A **sum** of squares does not factor: it is prime." },
                { t: "$x^2 - 6x + 9$", bin: 1, fb: "$x^2 - 2(x)(3) + 3^2 = (x - 3)^2$." },
                { t: "$x^2 + 5x + 9$", bin: 2, fb: "The middle term would have to be $2(x)(3) = 6x$." }],
        skill: "Factor special products", hints: ["Two squares with a minus? Or two squares with a middle term of $2ab$?"],
        why: "A difference of squares has two terms. A perfect square trinomial needs a middle term of exactly $2ab$." },
      { type: "expr", prompt: "Factor $16y^2 - 1$.",
        answer: "(4y-1)(4y+1)", shown: "(4y - 1)(4y + 1)", form: "factored", skill: "Factor special products",
        keys: [["$y$", "y"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]], placeholder: "( … )( … )",
        near: [{ v: "(4y-1)(4y-1)", fb: "That is $(4y - 1)^2$, which has a middle term. Use one plus and one minus." }],
        hints: ["$(4y)^2 - 1^2$."], why: "$(4y)^2 - 1^2 = (4y - 1)(4y + 1)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Cubes have a pattern too: $a^3 + b^3 = (a + b)(a^2 - ab + b^2)$. $$8x^3 + 27$$",
        scene: { type: "walk", how: HOW_6_3, rows: [
          { step: 1, m: "8x^3 + 27", say: "Two terms, both perfect cubes: a sum of cubes." },
          { step: 2, m: "(2x)^3 + 3^3", say: "So $a = 2x$ and $b = 3$." },
          { step: 3, m: "(2x + 3)((2x)^2 - (2x)(3) + 3^2)", say: "Put $a$ and $b$ into the pattern." },
          { step: 3, m: "(2x + 3)(4x^2 - 6x + 9)", say: "Simplify inside. For a **difference** of cubes the signs swap: $(a - b)(a^2 + ab + b^2)$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Factor $x^3 - 8$.",
        options: [{ t: "$(x - 2)(x^2 + 2x + 4)$" }, { t: "$(x - 2)(x^2 - 2x + 4)$", fb: "For a difference of cubes the middle sign of the trinomial is plus." }, { t: "$(x - 2)^3$", fb: "$(x - 2)^3$ has four terms when multiplied out." }],
        answer: 0, skill: "Factor special products", hints: ["$a = x$, $b = 2$, and $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$."], why: "$x^3 - 2^3 = (x - 2)(x^2 + 2x + 4)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lia factors $x^2 + 36$ as $(x + 6)(x + 6)$. What is wrong?",
        options: [{ t: "$(x + 6)^2 = x^2 + 12x + 36$. A sum of squares does not factor." },
                  { t: "It should be $(x + 6)(x - 6)$.", fb: "That gives $x^2 - 36$: a difference, not a sum." },
                  { t: "Nothing. It is right.", fb: "Multiply it back: there is a middle term, $12x$." }],
        answer: 0, skill: "Factor special products", hints: ["Step 4: multiply back."], why: "$x^2 + 36$ is prime. Only a **difference** of squares factors." },
      { type: "num", kicker: "Use it", prompt: "Use a difference of squares to work out $51 \\cdot 49$ in your head: it is $(50 + 1)(50 - 1)$.",
        answer: 2499, skill: "Special products",
        near: [{ v: 2501, fb: "$a^2 - b^2$: subtract the 1." }, { v: 2500, fb: "That is $50^2$. Now subtract $1^2$." }],
        hints: ["$50^2 - 1^2$."], why: "$2500 - 1 = 2499$." }
    ]
  });
  /* ======================= 6.4 · General strategy for factoring polynomials */
  var HOW_6_4 = [["GCF", "Is there a greatest common factor? Factor it out first."],
                 ["Count", "Count the terms that are left: two, three, or more than three."],
                 ["Method", "Two terms: squares or cubes. Three terms: a trinomial method. Four or more: grouping."],
                 ["Completely", "Look at each factor: can it be factored again? Then multiply back to check."]];
  LESSONS.push({
    title: "A general strategy for factoring",
    blurb: "Book 6.4 · One checklist that chooses the right method and finishes the job.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Look at $3x^2 - 12$. How many terms does it have, and do they share a factor?",
        options: [{ t: "Two terms, with a common factor of 3" }, { t: "Two terms, with no common factor", fb: "3 divides both $3x^2$ and 12." }, { t: "Three terms", fb: "$3x^2$ and $-12$: two terms." }],
        answer: 0, skill: "Factoring strategy", hints: ["Count the parts separated by $+$ or $-$. Then look for a common factor."], why: "$3x^2 - 12 = 3(x^2 - 4)$, and $x^2 - 4$ can be factored again." },
      { type: "learn", kicker: "The idea",
        prompt: "You now know every factoring method you need. The skill is choosing. Always take out a GCF first. Then the **number of terms** tells you which method to try, and you keep going until nothing factors further.",
        scene: { type: "method", how: HOW_6_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the strategy. $$2x^3 - 18x$$",
        scene: { type: "walk", how: HOW_6_4, rows: [
          { step: 1, m: "2x^3 - 18x", say: "Both terms share $2x$." },
          { step: 1, m: "2x(x^2 - 9)", say: "Factor out the GCF." },
          { step: 2, m: "x^2 - 9", say: "Two terms are left inside the parentheses." },
          { step: 3, m: "x^2 - 9 = (x - 3)(x + 3)", say: "Two terms, both squares, with a minus: a difference of squares.",
            ask: { prompt: "$x^2 - 9$ has two terms. Which pattern fits?", answer: 0,
                   options: [{ t: "A difference of squares" }, { t: "A perfect square trinomial", fb: "A trinomial has three terms." }, { t: "None: it is prime", fb: "$x^2 - 3^2$ is a difference of squares." }] } },
          { step: 4, m: "2x(x - 3)(x + 3)", say: "No factor can be broken down further. That is **factored completely**." }] },
        gate: true, then: "Stopping at $2x(x^2 - 9)$ would have left the job half done." },
      { type: "guided", kicker: "Together",
        prompt: "Now you choose each move. $$3x^2 + 6x - 24$$",
        how: HOW_6_4, skill: "Factoring strategy",
        steps: [
          { step: 1, ask: "Is there a GCF?", type: "choice", answer: 0,
            options: [{ t: "Yes: 3" }, { t: "Yes: $3x$", fb: "The last term, 24, has no $x$." }, { t: "No", fb: "3 divides 3, 6 and 24." }],
            m: "3(x^2 + 2x - 8)", say: "Take out the 3." },
          { step: 2, ask: "How many terms are inside the parentheses?", type: "choice", answer: 0,
            options: [{ t: "Three" }, { t: "Two", fb: "$x^2$, $2x$ and $-8$." }],
            m: "x^2 + 2x - 8 \\quad\\text{three terms}", say: "A trinomial." },
          { step: 3, ask: "Factor $x^2 + 2x - 8$: two numbers that multiply to $-8$ and add to 2.", type: "choice", answer: 0,
            options: [{ t: "$(x + 4)(x - 2)$" }, { t: "$(x - 4)(x + 2)$", fb: "That gives $-2x$ in the middle." }, { t: "$(x + 8)(x - 1)$", fb: "$8 - 1 = 7$, not 2." }],
            m: "x^2 + 2x - 8 = (x + 4)(x - 2)", say: "$4 \\cdot (-2) = -8$ and $4 - 2 = 2$." },
          { step: 4, ask: "Write the complete factorization.", type: "choice", answer: 0,
            options: [{ t: "$3(x + 4)(x - 2)$" }, { t: "$(x + 4)(x - 2)$", fb: "The GCF, 3, is part of the answer." }],
            m: "3(x + 4)(x - 2)", say: "The GCF stays in front. Nothing factors further." }],
        why: "GCF, count, method, completely. Now pick the method yourself." },
      { type: "sort", kicker: "On your own", prompt: "Which method does each polynomial call for **first**?",
        bins: ["Take out a GCF", "Difference of squares", "Trinomial", "Grouping"],
        cards: [{ t: "$5x^2 + 10x$", bin: 0, fb: "Both terms share $5x$." },
                { t: "$x^2 - 81$", bin: 1, fb: "No common factor, two terms, both squares." },
                { t: "$x^2 + 6x + 8$", bin: 2, fb: "No common factor, three terms." },
                { t: "$x^3 + 2x^2 + 3x + 6$", bin: 3, fb: "No factor common to all four terms: group them in pairs." }],
        skill: "Factoring strategy", hints: ["GCF first. If there is none, count the terms."],
        why: "A GCF comes first. After that, two terms, three terms or four terms each point to a method." },
      { type: "choice", prompt: "Factor $4x^2 - 36$ completely.",
        options: [{ t: "$4(x - 3)(x + 3)$" }, { t: "$(2x - 6)(2x + 6)$", fb: "Each factor still has a common factor of 2. Take the GCF out first." }, { t: "$4(x^2 - 9)$", fb: "$x^2 - 9$ is a difference of squares: keep going." }],
        answer: 0, skill: "Factoring strategy", hints: ["GCF first: $4(x^2 - 9)$. Then look inside."], why: "$4(x^2 - 9) = 4(x - 3)(x + 3)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "One factor may need factoring again. $$x^4 - 16$$",
        scene: { type: "walk", how: HOW_6_4, rows: [
          { step: 1, m: "x^4 - 16", say: "No common factor." },
          { step: 3, m: "(x^2 - 4)(x^2 + 4)", say: "Two terms: $(x^2)^2 - 4^2$, a difference of squares." },
          { step: 4, m: "(x - 2)(x + 2)(x^2 + 4)", say: "$x^2 - 4$ is a difference of squares again. $x^2 + 4$ is a sum of squares, so it stays." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Factor $x^3 + 3x^2 - 4x - 12$ completely.",
        options: [{ t: "$(x + 3)(x - 2)(x + 2)$" }, { t: "$(x + 3)(x^2 - 4)$", fb: "$x^2 - 4$ is a difference of squares. Keep going." }, { t: "$(x - 3)(x - 2)(x + 2)$", fb: "Grouping gives $x^2(x + 3) - 4(x + 3)$: the binomial is $x + 3$." }],
        answer: 0, skill: "Factoring strategy", hints: ["Four terms: group. $x^2(x + 3) - 4(x + 3)$."], why: "$(x + 3)(x^2 - 4) = (x + 3)(x - 2)(x + 2)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam factors $2x^2 + 10x + 12$ as $(2x + 4)(x + 3)$ and stops. What is wrong?",
        options: [{ t: "It is not factored completely: $2x + 4$ still has a common factor of 2." },
                  { t: "The product does not equal the original.", fb: "It does: multiply it out. The trouble is that it can be factored further." },
                  { t: "Nothing. It is finished.", fb: "$2x + 4 = 2(x + 2)$." }],
        answer: 0, skill: "Factoring strategy", hints: ["Step 1 was skipped. Does every term share a factor?"], why: "Take out the GCF first: $2(x^2 + 5x + 6) = 2(x + 2)(x + 3)$." },
      { type: "choice", kicker: "Use it", prompt: "The volume of a box is $x^3 - 4x$ cubic inches. Which could be its three dimensions?",
        options: [{ t: "$x$, $x - 2$ and $x + 2$" }, { t: "$x$ and $x^2 - 4$", fb: "That is only two factors. $x^2 - 4$ factors again." }, { t: "$x$, $x - 4$ and $x + 1$", fb: "Multiply them back: the product is not $x^3 - 4x$." }],
        answer: 0, skill: "Factoring strategy", hints: ["$x(x^2 - 4)$, then factor the difference of squares."], why: "$x^3 - 4x = x(x^2 - 4) = x(x - 2)(x + 2)$." }
    ]
  });

  /* ================================================ 6.5 · Polynomial equations */
  var HOW_6_5 = [["Standard", "Write the equation with 0 on one side."],
                 ["Factor", "Factor the polynomial."],
                 ["Zero product", "Set each factor equal to 0."],
                 ["Solve", "Solve each small equation."],
                 ["Check", "Check every solution in the original equation."]];
  LESSONS.push({
    title: "Polynomial equations",
    blurb: "Book 6.5 · The Zero Product Property, solving quadratic equations by factoring, and applications.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "If $a \\cdot b = 0$, what must be true?",
        options: [{ t: "At least one of $a$ and $b$ is 0" }, { t: "Both $a$ and $b$ are 0", fb: "$0 \\cdot 5 = 0$: one of them is enough." }, { t: "$a$ and $b$ are opposites", fb: "$3 \\cdot (-3) = -9$, not 0." }],
        answer: 0, skill: "Zero Product Property", hints: ["Can two non-zero numbers multiply to 0?"], why: "A product is 0 only when one of its factors is 0." },
      { type: "learn", kicker: "The idea",
        prompt: "The **Zero Product Property**: if a product is 0, then at least one factor is 0. So an equation with 0 on one side and a factored polynomial on the other splits into small equations you can solve at once.",
        scene: { type: "method", how: HOW_6_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a quadratic equation solved by factoring. $$x^2 + 2x = 15$$",
        scene: { type: "walk", how: HOW_6_5, rows: [
          { step: 1, m: "x^2 + 2x = 15", say: "The property needs 0 on one side." },
          { step: 1, m: "x^2 + 2x - 15 = 0", say: "Subtract 15 from both sides." },
          { step: 2, m: "(x + 5)(x - 3) = 0", say: "Factor: 5 and $-3$ multiply to $-15$ and add to 2." },
          { step: 3, m: "x + 5 = 0 \\quad\\text{or}\\quad x - 3 = 0", say: "A product is 0, so one of the factors is 0.",
            ask: { prompt: "$(x + 5)(x - 3) = 0$. What does the Zero Product Property say?", answer: 0,
                   options: [{ t: "$x + 5 = 0$ or $x - 3 = 0$" }, { t: "$x + 5 = 0$ and $x - 3 = 0$ at once", fb: "No single $x$ makes both 0. One factor being 0 is enough." }, { t: "$x = 0$", fb: "At $x = 0$ the product is $5 \\cdot (-3) = -15$." }] } },
          { step: 4, m: "x = -5 \\quad\\text{or}\\quad x = 3", say: "Solve each one." },
          { step: 5, m: "(-5)^2 + 2(-5) = 15 \\quad 3^2 + 2(3) = 15", say: "$25 - 10$ and $9 + 6$: both check. ✓" }] },
        gate: true, then: "A quadratic equation usually has two solutions." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$x^2 - 5x = -6$$",
        how: HOW_6_5, skill: "Solve by factoring",
        steps: [
          { step: 1, ask: "Get 0 on one side.", type: "choice", answer: 0,
            options: [{ t: "$x^2 - 5x + 6 = 0$" }, { t: "$x^2 - 5x - 6 = 0$", fb: "Add 6 to both sides: the left gains $+6$." }],
            m: "x^2 - 5x + 6 = 0", say: "Add 6 to both sides." },
          { step: 2, ask: "Factor the left side.", type: "choice", answer: 0,
            options: [{ t: "$(x - 2)(x - 3) = 0$" }, { t: "$(x + 2)(x + 3) = 0$", fb: "That gives $+5x$ in the middle." }, { t: "$(x - 1)(x - 6) = 0$", fb: "$-1 - 6 = -7$, not $-5$." }],
            m: "(x - 2)(x - 3) = 0", say: "$-2$ and $-3$ multiply to 6 and add to $-5$." },
          { step: 3, ask: "Use the Zero Product Property.", type: "choice", answer: 0,
            options: [{ t: "$x - 2 = 0$ or $x - 3 = 0$" }, { t: "$x - 2 = 6$ or $x - 3 = 6$", fb: "The other side of the equation is 0 now, not 6." }],
            m: "x - 2 = 0 \\quad\\text{or}\\quad x - 3 = 0", say: "Each factor set equal to 0." },
          { step: 4, ask: "Solve each equation.", type: "choice", answer: 0,
            options: [{ t: "$x = 2$ or $x = 3$" }, { t: "$x = -2$ or $x = -3$", fb: "$x - 2 = 0$ gives $x = 2$." }],
            m: "x = 2 \\quad\\text{or}\\quad x = 3", say: "Two solutions." },
          { step: 5, ask: "Check $x = 2$ in the original: what is $2^2 - 5(2)$?", type: "num", answer: -6, near: [{ v: 14, fb: "$5(2) = 10$ is subtracted." }], hint: "$4 - 10$.",
            m: "4 - 10 = -6 \\quad 9 - 15 = -6", say: "Both check. ✓" }],
        why: "Standard form, factor, zero product, solve, check. Now two on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $x^2 - 3x - 10 = 0$. Give both solutions.",
        answer: [-2, 5], skill: "Solve by factoring", placeholder: "e.g. −3, 4",
        hints: ["Factor: two numbers that multiply to $-10$ and add to $-3$."], why: "$(x - 5)(x + 2) = 0$, so $x = 5$ or $x = -2$." },
      { type: "numbers", prompt: "Solve $(2x - 1)(x + 4) = 0$. Give both solutions.",
        answer: [0.5, -4], skill: "Zero Product Property", placeholder: "e.g. 1/2, −3",
        hints: ["$2x - 1 = 0$ or $x + 4 = 0$."], why: "$2x = 1$ gives $x = \\frac{1}{2}$, and $x + 4 = 0$ gives $x = -4$.", shown: "1/2, −4" },
      { type: "learn", kicker: "A harder case",
        prompt: "The property works for any number of factors. $$x^3 - 4x = 0$$",
        scene: { type: "walk", how: HOW_6_5, rows: [
          { step: 1, m: "x^3 - 4x = 0", say: "It already has 0 on one side." },
          { step: 2, m: "x(x^2 - 4) = 0", say: "Factor out the GCF, $x$. Never divide both sides by $x$: that would lose a solution." },
          { step: 2, m: "x(x - 2)(x + 2) = 0", say: "Then the difference of squares." },
          { step: 3, m: "x = 0 \\quad\\text{or}\\quad x - 2 = 0 \\quad\\text{or}\\quad x + 2 = 0", say: "Three factors, three small equations." },
          { step: 4, m: "x = 0 \\quad\\text{or}\\quad x = 2 \\quad\\text{or}\\quad x = -2", say: "A cubic equation can have three solutions." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "The **zeros** of a function are the inputs where its value is 0. Find the zeros of $f(x) = x^2 - 4x - 5$.",
        answer: [-1, 5], skill: "Solve by factoring", placeholder: "e.g. −3, 4",
        hints: ["Solve $x^2 - 4x - 5 = 0$."], why: "$(x - 5)(x + 1) = 0$, so $x = 5$ or $x = -1$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the solving of $x^2 - 2x = 8$ **first** goes wrong.",
        lines: ["x^2 - 2x = 8", "x(x - 2) = 8", "x = 8 \\quad\\text{or}\\quad x - 2 = 8", "x = 8 \\quad\\text{or}\\quad x = 10"], answer: 2, fix: "(x - 4)(x + 2) = 0",
        fb: { 0: GIVEN, 1: "This factoring is true, though it does not help. The mistake comes next.", 3: LATER }, skill: "Zero Product Property",
        hints: ["The Zero Product Property is about a product that equals 0."],
        why: "A product of 8 tells you nothing about its factors. Get 0 first: $x^2 - 2x - 8 = 0$, so $x = 4$ or $x = -2$." },
      { type: "num", kicker: "Use it", prompt: "A rectangle's length is **3 m more than** its width, and its area is **40 m²**. Find the width.",
        post: "m", answer: 5, skill: "Polynomial applications",
        near: [{ v: -8, fb: "$w = -8$ solves the equation, but a width cannot be negative." }, { v: 8, fb: "That is the length. The question asks for the width." }],
        hints: ["$w(w + 3) = 40$, so $w^2 + 3w - 40 = 0$."], why: "$(w + 8)(w - 5) = 0$. Only $w = 5$ makes sense for a width." }
    ]
  });
  /* ================================================================ Skills */
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function bin(p) { return "(" + poly([[1, "x"], [p, ""]]) + ")"; }
  var SKILLS = [
    { id: "a2u6-gcf", title: "Factor out the GCF", lesson: 2,
      gen: function (R) {
        var g = R.pick([2, 3, 4, 5, 6]), a = R.pick([2, 3, 5, 7]), b = R.pick([1, 3, 5, 7, 9]) * R.pick([-1, 1]);
        if (L.gcd(a, b) !== 1) b = b > 0 ? 1 : -1;
        var orig = poly([[g * a, "x^2"], [g * b, "x"]]), right = g + "x(" + poly([[a, "x"], [b, ""]]) + ")";
        return mc(R, { prompt: "Factor completely. $$" + orig + "$$", right: "$" + right + "$",
          wrong: [{ t: "$" + g + "(" + poly([[a, "x^2"], [b, "x"]]) + ")$", fb: "Both terms inside still share an $x$." },
                  { t: "$x(" + poly([[g * a, "x"], [g * b, ""]]) + ")$", fb: "The numbers inside still share a factor of " + g + "." }],
          hints: ["The GCF has a number part and a variable part."], why: "The GCF is $" + g + "x$: $" + right + "$." });
      } },
    { id: "a2u6-trinomial", title: "Factor a trinomial", lesson: 3,
      gen: function (R) {
        var p = R.nz(-9, 9), q = R.nz(-9, 9);
        if (p + q === 0) q += 1;
        var ans = bin(p) + bin(q);
        return { type: "expr", prompt: "Factor. $$" + quad(1, p + q, p * q) + "$$", answer: clean(ans), shown: ans, form: "factored", keys: KEYS_POLY, placeholder: "( … )( … )",
          near: [{ v: clean(bin(-p) + bin(-q)), fb: "The numbers are right, but check their signs: the middle term must be $" + poly([[p + q, "x"]]) + "$." }],
          hints: ["Two numbers that multiply to $" + p * q + "$ and add to $" + (p + q) + "$."], why: "$" + p + " \\cdot " + (q < 0 ? "(" + q + ")" : q) + " = " + p * q + "$ and $" + p + " + " + (q < 0 ? "(" + q + ")" : q) + " = " + (p + q) + "$." };
      } },
    { id: "a2u6-special", title: "Factor a difference of squares", lesson: 4,
      gen: function (R) {
        var a = R.pick([1, 2, 3, 4, 5]), b = R.int(1, 9), A = a === 1 ? "x" : a + "x";
        if (L.gcd(a, b) !== 1) b = 1;
        return mc(R, { prompt: "Factor. $$" + (a === 1 ? "" : a * a) + "x^2 - " + b * b + "$$", right: "$(" + A + " - " + b + ")(" + A + " + " + b + ")$",
          wrong: [{ t: "$(" + A + " - " + b + ")^2$", fb: "A binomial squared has a middle term. A difference of squares factors into conjugates." },
                  { t: "$(" + (a === 1 ? "" : a * a) + "x - " + b * b + ")(x + 1)$", fb: "Use the square roots: $" + A + "$ and $" + b + "$." }],
          hints: ["$a^2 - b^2 = (a - b)(a + b)$."], why: "$(" + A + ")^2 - " + b + "^2$." });
      } },
    { id: "a2u6-strategy", title: "Factor completely", lesson: 5,
      gen: function (R) {
        var g = R.pick([2, 3, 4, 5]), p = R.nz(-6, 6), q = R.nz(-6, 6);
        if (p + q === 0) q += 1;
        return mc(R, { prompt: "Factor completely. $$" + quad(g, g * (p + q), g * p * q) + "$$", right: "$" + g + bin(p) + bin(q) + "$",
          wrong: [{ t: "$(" + poly([[g, "x"], [g * p, ""]]) + ")" + bin(q) + "$", fb: "The first factor still has a common factor of " + g + ". Take the GCF out first." },
                  { t: "$" + g + "(" + quad(1, p + q, p * q) + ")$", fb: "The trinomial inside can be factored again." }],
          hints: ["GCF first, then the trinomial."], why: "$" + g + "(" + quad(1, p + q, p * q) + ") = " + g + bin(p) + bin(q) + "$." });
      } },
    { id: "a2u6-solve", title: "Solve a quadratic equation by factoring", lesson: 6,
      gen: function (R) {
        var r1 = R.int(-8, 8), r2 = R.int(-8, 8);
        if (r1 === r2) r2 = r1 + 1;
        return { type: "numbers", prompt: "Solve. Give every solution. $$" + quad(1, -(r1 + r2), r1 * r2) + " = 0$$", answer: [r1, r2], placeholder: "e.g. −3, 4",
          hints: ["Factor the left side, then set each factor equal to 0."],
          why: "$" + (r1 === 0 ? "x" : bin(-r1)) + (r2 === 0 ? "x" : bin(-r2)) + " = 0$, so $x = " + r1 + "$ or $x = " + r2 + "$." };
      } }
  ];
  L.unit("alg2", 6, {
    title: "Factoring",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "The greatest common factor, trinomials and differences of squares.",
        skills: ["a2u6-gcf", "a2u6-trinomial", "a2u6-special"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Factoring completely, and solving equations by factoring.",
        skills: ["a2u6-strategy", "a2u6-solve"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:6", {
    2: { name: "Factoring out the GCF", frame: "Factoring is multiplying in [[reverse]]. The GCF takes the [[smallest]] power of each shared variable. Check by [[multiplying]] back. With four terms, try [[grouping]].",
         chips: ["largest", "adding"], fb: { "largest": "$x^3$ does not divide $x^2$. The GCF can only use the smaller power." } },
    3: { name: "Factoring trinomials", frame: "To factor $x^2 + bx + c$, find two numbers that [[multiply]] to $c$ and [[add]] to $b$. If $c$ is positive, the two numbers have the [[same]] sign. If $c$ is negative, their signs are [[different]].",
         chips: ["subtract", "equal"] },
    4: { name: "Special products", frame: "$a^2 - b^2 = $ [[$(a - b)(a + b)$]]. $a^2 + 2ab + b^2 = $ [[$(a + b)^2$]]. A [[sum]] of two squares does not factor.",
         chips: ["$(a - b)^2$", "difference"] },
    5: { name: "Factoring strategy", frame: "Always look for a [[GCF]] first. Then count the terms: [[two]] terms means squares or cubes, three means a trinomial, [[four]] or more means grouping. Keep going until nothing factors further.",
         chips: ["five", "pattern"] },
    6: { name: "Zero Product Property", frame: "If $a \\cdot b = 0$, then $a = 0$ [[or]] $b = 0$. To solve by factoring, first get [[zero]] on one side, then [[factor]], then set [[each factor]] equal to zero.",
         chips: ["and", "one"], fb: { "and": "One factor being 0 is enough. They need not both be 0." } }
  });
})();
