/* ==========================================================================
   Algebra II — Unit 10: Exponential and Logarithmic Functions. See
   lab/core.js for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 10, section for section:
   the readiness check, then 10.1 to 10.5. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   Composition and inverses come first (10.1), because a logarithm is the
   inverse of an exponential. Then exponential functions (10.2), logarithms
   (10.3), their properties (10.4), and the equations both solve (10.5).

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Six lessons, six skills, two quizzes, and the unit test.
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
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Chapter 10 Be Prepared · Evaluate a function, use the exponent rules, and solve a small equation.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Functions", prompt: "For $f(x) = 2x + 3$, find $f(4)$.", pre: "$f(4) =$", answer: 11, skill: "Evaluate a function",
        near: [{ v: 9, fb: "Multiply first: $2 \\cdot 4 = 8$, then add 3." }], hints: ["$2(4) + 3$."], why: "$8 + 3 = 11$." },
      { type: "choice", prompt: "Solve $y = 3x - 6$ for $x$.",
        options: [{ t: "$x = \\frac{y + 6}{3}$" }, { t: "$x = \\frac{y}{3} + 6$", fb: "Add 6 first, then divide the whole of $y + 6$ by 3." }, { t: "$x = 3y - 6$", fb: "Undo the operations: add 6, then divide by 3." }],
        answer: 0, skill: "Solve a formula", hints: ["Add 6, then divide by 3."], why: "$y + 6 = 3x$, so $x = \\frac{y + 6}{3}$." },
      { type: "num", kicker: "Check 2 · Powers", prompt: "What is $2^5$?", answer: 32, skill: "Evaluate powers",
        near: [{ v: 10, fb: "$2^5$ is five 2s multiplied, not $2 \\cdot 5$." }, { v: 25, fb: "That is $5^2$." }], hints: ["2, 4, 8, 16, …"], why: "$2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 32$." },
      { type: "num", prompt: "$\\frac{1}{9}$ is a power of 3. $$\\frac{1}{9} = 3^{\\square}$$ What goes in the box?", answer: -2, skill: "Negative exponents",
        near: [{ v: 2, fb: "$3^2 = 9$. A reciprocal needs a negative exponent." }, { v: -3, fb: "$3^{-3} = \\frac{1}{27}$." }], hints: ["$9 = 3^2$, and $\\frac{1}{3^2} = 3^{-2}$."], why: "$3^{-2} = \\frac{1}{9}$." },
      { type: "num", kicker: "Check 3 · Exponent rules", prompt: "$$(x^2)^3 = x^{\\square}$$ What goes in the box?", answer: 6, skill: "Exponent properties",
        near: [{ v: 5, fb: "A power of a power **multiplies** the exponents." }, { v: 8, fb: "$2 \\cdot 3$, not $2^3$." }], hints: ["Three groups of two $x$s."], why: "$2 \\cdot 3 = 6$." },
      { type: "num", prompt: "Solve $2x - 1 = 3$.", pre: "$x =$", answer: 2, skill: "Solve a linear equation",
        near: [{ v: 1, fb: "Add 1 first: $2x = 4$." }], hints: ["Add 1, then divide by 2."], why: "$2x = 4$, so $x = 2$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 10.1**. If **check 1** slipped, see lessons 3.5 and 2.3. If **check 2** or **check 3** slipped, see lesson 5.2: logarithms are exponents, so those rules come back.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  // "f ∘ g" set in maths: the ring is written as text, since the renderer has no \circ ring.
  var OF = " \\text{ ∘ } ";

  /* ========================== 10.1 · Finding composite and inverse functions */
  var HOW_10_1 = [["y", "Write $y$ in place of $f(x)$."],
                  ["Swap", "Interchange $x$ and $y$."],
                  ["Solve", "Solve for $y$."],
                  ["Name it", "Write $f^{-1}(x)$ in place of $y$."],
                  ["Verify", "Check that $f^{-1}$ undoes $f$."]];
  var HOW_10_1C = [["Inside", "Start with the inside function: the one written on the right."],
                   ["Substitute", "Put its whole rule in place of $x$ in the outside function."],
                   ["Simplify", "Simplify the result."]];
  LESSONS.push({
    title: "Composite and inverse functions",
    blurb: "Book 10.1 · One function fed into another, one-to-one functions, and the function that undoes another.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "For $f(x) = 2x + 3$, find $f(4)$.", pre: "$f(4) =$", answer: 11, skill: "Evaluate a function",
        near: [{ v: 9, fb: "Multiply first, then add 3." }], hints: ["$2(4) + 3$."], why: "$8 + 3 = 11$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **composition** feeds one function's output into another: $(f" + OF + "g)(x) = f(g(x))$. An **inverse** function, $f^{-1}$, undoes $f$: it sends every output back to its input. Only **one-to-one** functions have inverses.",
        scene: { type: "method", how: HOW_10_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the inverse of $f(x) = 2x - 6$ found.",
        scene: { type: "walk", how: HOW_10_1, rows: [
          { step: 1, m: "y = 2x - 6", say: "Write $y$ for $f(x)$." },
          { step: 2, m: "x = 2y - 6", say: "Swap the two letters. The inverse trades inputs for outputs.",
            ask: { prompt: "What does interchanging $x$ and $y$ in $y = 2x - 6$ give?", answer: 0,
                   options: [{ t: "$x = 2y - 6$" }, { t: "$y = 2x + 6$", fb: "Swap the letters, and leave the numbers and signs alone." }, { t: "$y = \\frac{x}{2} - 6$", fb: "That is a guess at the answer. First just swap $x$ and $y$." }] } },
          { step: 3, m: "y = \\frac{x + 6}{2}", say: "Add 6, then divide by 2." },
          { step: 4, m: "f^{-1}(x) = \\frac{x + 6}{2}", say: "Name it." },
          { step: 5, m: "f^{-1}(f(x)) = \\frac{(2x - 6) + 6}{2} = x", say: "Feeding $f(x)$ into $f^{-1}$ gives back $x$. ✓" }] },
        gate: true, then: "$f$ doubles and then subtracts 6. Its inverse adds 6 and then halves: the opposite steps, in the opposite order." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the inverse of $f(x) = 5x + 4$.",
        how: HOW_10_1, skill: "Inverse functions",
        steps: [
          { step: 1, ask: "Write $y$ in place of $f(x)$.", type: "choice", answer: 0,
            options: [{ t: "$y = 5x + 4$" }, { t: "$x = 5y + 4$", fb: "That is the next step. First, only the name changes." }],
            m: "y = 5x + 4", say: "Same function, written with $y$." },
          { step: 2, ask: "Interchange $x$ and $y$.", type: "choice", answer: 0,
            options: [{ t: "$x = 5y + 4$" }, { t: "$x = 5y - 4$", fb: "Only the letters swap. The $+4$ stays." }],
            m: "x = 5y + 4", say: "Inputs and outputs have traded places." },
          { step: 3, ask: "Solve for $y$.", type: "choice", answer: 0,
            options: [{ t: "$y = \\frac{x - 4}{5}$" }, { t: "$y = \\frac{x}{5} - 4$", fb: "Subtract 4 first. Then the whole of $x - 4$ is divided by 5." }, { t: "$y = 5x - 4$", fb: "Undo the $+4$, then undo the multiplying by 5." }],
            m: "y = \\frac{x - 4}{5}", say: "Subtract 4, then divide by 5." },
          { step: 4, ask: "Name the inverse.", type: "choice", answer: 0,
            options: [{ t: "$f^{-1}(x) = \\frac{x - 4}{5}$" }, { t: "$f^{-1}(x) = \\frac{1}{5x + 4}$", fb: "The $-1$ marks the inverse function. It is not a reciprocal." }],
            m: "f^{-1}(x) = \\frac{x - 4}{5}", say: "Read “$f$ inverse of $x$”." },
          { step: 5, ask: "Verify with a number: $f(2) = 14$. What is $f^{-1}(14)$?", type: "num", answer: 2, near: [{ v: 74, fb: "Use the inverse: $\\frac{14 - 4}{5}$." }], hint: "$\\frac{14 - 4}{5}$.",
            m: "f^{-1}(14) = \\frac{14 - 4}{5} = 2", say: "The output 14 goes back to the input 2. ✓" }],
        why: "$y$, swap, solve, name it, verify. Now a composition on your own." },
      { type: "num", kicker: "On your own", prompt: "With $f(x) = 2x + 1$ and $g(x) = x^2$, find $(f" + OF + "g)(3)$, which is $f(g(3))$.", answer: 19, skill: "Composite functions",
        near: [{ v: 49, fb: "That is $g(f(3))$. In $f(g(3))$ the inside function, $g$, goes first." }, { v: 63, fb: "That multiplies $f(3)$ by $g(3)$. A composition feeds one into the other." }],
        hints: ["First $g(3) = 9$. Then $f(9)$."], why: "$g(3) = 9$, and $f(9) = 19$." },
      { type: "sort", prompt: "A function is **one-to-one** if no two inputs share an output. Sort these.",
        bins: ["One-to-one", "Not one-to-one"],
        cards: [{ t: "$f(x) = 2x + 1$", bin: 0, fb: "Different inputs always give different outputs." },
                { t: "$f(x) = x^2$", bin: 1, fb: "2 and $-2$ both give 4." },
                { t: "$f(x) = x^3$", bin: 0, fb: "Each number has exactly one cube." },
                { t: "$f(x) = |x|$", bin: 1, fb: "3 and $-3$ both give 3." }],
        skill: "One-to-one functions", hints: ["Can you find two different inputs with the same output?"],
        why: "A graph is one-to-one when no horizontal line crosses it twice. Only those functions have inverses." },
      { type: "learn", kicker: "A harder case",
        prompt: "A composition can be written as one rule, and the order matters. Take $f(x) = 3x - 2$ and $g(x) = x + 5$.",
        scene: { type: "walk", how: HOW_10_1C, rows: [
          { step: 1, m: "(f" + OF + "g)(x) = f(g(x))", say: "$g$ is the inside function." },
          { step: 2, m: "f(x + 5) = 3(x + 5) - 2", say: "Put $x + 5$ in place of $x$ in $f$." },
          { step: 3, m: "3x + 13", say: "Distribute and combine." },
          { step: 3, m: "(g" + OF + "f)(x) = (3x - 2) + 5 = 3x + 3", say: "The other order gives a different function. Composition is not commutative." }] },
        gate: true },
      { type: "pair", kicker: "Try it", prompt: "The point $(3, 7)$ is on the graph of $f$. Which point must be on the graph of $f^{-1}$?",
        answer: [7, 3], skill: "Inverse functions",
        near: [{ v: [3, 7], fb: "The inverse swaps inputs and outputs." }, { v: [-3, -7], fb: "The coordinates are swapped, not negated." }],
        hints: ["$f(3) = 7$, so $f^{-1}(7) = \\,?$"], why: "$f^{-1}(7) = 3$. The two graphs are mirror images across the line $y = x$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $f(x) = 2x$, Sam writes $f^{-1}(x) = \\frac{1}{2x}$. What is wrong?",
        options: [{ t: "The inverse undoes doubling: $f^{-1}(x) = \\frac{x}{2}$." },
                  { t: "It should be $f^{-1}(x) = -2x$.", fb: "The opposite of doubling is halving, not negating." },
                  { t: "Nothing. $f^{-1}$ means 1 over $f$.", fb: "$f^{-1}$ is the inverse function. The reciprocal is a different thing." }],
        answer: 0, skill: "Inverse functions", hints: ["$f(3) = 6$. What must $f^{-1}(6)$ be?"], why: "$f^{-1}(6)$ must be 3, and $\\frac{6}{2} = 3$." },
      { type: "choice", kicker: "Use it", prompt: "$F(x) = 1.8x + 32$ turns a Celsius temperature into Fahrenheit. Which function turns Fahrenheit back into Celsius?",
        options: [{ t: "$F^{-1}(x) = \\frac{x - 32}{1.8}$" }, { t: "$F^{-1}(x) = \\frac{x}{1.8} - 32$", fb: "Subtract 32 first, then divide the result by 1.8." }, { t: "$F^{-1}(x) = 1.8x - 32$", fb: "Undo both steps: subtract 32, then divide by 1.8." }],
        answer: 0, skill: "Inverse functions", hints: ["$x = 1.8y + 32$. Solve for $y$."], why: "$x - 32 = 1.8y$, so $y = \\frac{x - 32}{1.8}$." }
    ]
  });

  /* ========================= 10.2 · Evaluate and graph exponential functions */
  var HOW_10_2 = [["Same base", "Write both sides as powers of the same base."],
                  ["Exponents", "Same base, so the exponents are equal. Set them equal."],
                  ["Solve", "Solve that equation."],
                  ["Check", "Check in the original equation."]];
  var HOW_10_2A = [["Formula", "$A = P(1 + \\frac{r}{n})^{nt}$: principal $P$, yearly rate $r$, $n$ compoundings a year, $t$ years."],
                   ["Substitute", "Put in the values, with the rate as a decimal."],
                   ["Evaluate", "Work inside the parentheses first, then the power, then multiply."]];
  LESSONS.push({
    title: "Exponential functions",
    blurb: "Book 10.2 · Growth and decay, the shape of an exponential graph, exponential equations and compound interest.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $2^5$?", answer: 32, skill: "Evaluate powers",
        near: [{ v: 10, fb: "$2^5$ is five 2s multiplied." }, { v: 25, fb: "That is $5^2$." }], hints: ["2, 4, 8, 16, …"], why: "$32$." },
      { type: "learn", kicker: "Explore", prompt: "This is the graph of $f(x) = b^x$. Slide $b$ above and below 1, and watch the curve.",
        scene: { type: "plane", x: [-4, 4], y: [-1, 9], gate: true,
          params: { b: { v: 2, min: 0.25, max: 4, step: 0.25, label: "$b$" } },
          fns: [{ f: function (x, p) { return Math.pow(p.b, x); }, color: "blue" }], marks: [{ x: 0, y: 1, color: "orange", label: "(0, 1)" }],
          readout: function (st) { var b = st.params.b; return "$f(x) = " + (b === 1 ? "1^x$: a flat line" : num(b) + "^x$: " + (b > 1 ? "growth" : "decay")); } }, gate: true,
        then: "When $b > 1$ the curve climbs: **growth**. When $0 < b < 1$ it falls: **decay**. Every one passes through $(0, 1)$, and none ever touches the $x$-axis." },
      { type: "learn", kicker: "The idea",
        prompt: "An **exponential function** has its variable in the exponent: $f(x) = a^x$, with $a > 0$ and $a \\ne 1$. It is one-to-one, so if $a^x = a^y$ then $x = y$. That is how exponential equations are solved.",
        scene: { type: "method", how: HOW_10_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an exponential equation solved. $$3^{2x - 1} = 27$$",
        scene: { type: "walk", how: HOW_10_2, rows: [
          { step: 1, m: "3^{2x - 1} = 27", say: "The left side is a power of 3. Is the right side one too?" },
          { step: 1, m: "3^{2x - 1} = 3^{3}", say: "$27 = 3 \\cdot 3 \\cdot 3$.",
            ask: { prompt: "27 is which power of 3?", answer: 0,
                   options: [{ t: "$3^3$" }, { t: "$3^9$", fb: "$3 \\cdot 9 = 27$, but that is a product. $3^3 = 27$." }, { t: "$3^2$", fb: "$3^2 = 9$." }] } },
          { step: 2, m: "2x - 1 = 3", say: "The bases match, so the exponents must be equal." },
          { step: 3, m: "x = 2", say: "Add 1, then divide by 2." },
          { step: 4, m: "3^{2(2) - 1} = 3^{3}", say: "$3^3 = 27$. ✓" }] },
        gate: true, then: "The whole method rests on getting the same base on both sides." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$4^x = 8$$",
        how: HOW_10_2, skill: "Exponential equations",
        steps: [
          { step: 1, ask: "4 and 8 are both powers of 2. Rewrite both sides.", type: "choice", answer: 0,
            options: [{ t: "$2^{2x} = 2^3$" }, { t: "$2^{x} = 2^3$", fb: "$4^x = (2^2)^x = 2^{2x}$." }, { t: "$2^{2x} = 2^4$", fb: "$8 = 2^3$." }],
            m: "2^{2x} = 2^{3}", say: "$4 = 2^2$ and $8 = 2^3$." },
          { step: 2, ask: "Set the exponents equal.", type: "choice", answer: 0,
            options: [{ t: "$2x = 3$" }, { t: "$x = 3$", fb: "The left exponent is $2x$." }],
            m: "2x = 3", say: "Same base, equal exponents." },
          { step: 3, ask: "Solve for $x$. (Type a fraction like 3/2.)", type: "num", pre: "$x =$", answer: 1.5, tol: 1e-9, near: [{ v: 6, fb: "Divide 3 by 2." }], hint: "$3 \\div 2$.",
            m: "x = \\frac{3}{2}", say: "Divide by 2." },
          { step: 4, ask: "Check: what is $4^{\\frac{3}{2}}$?", type: "num", answer: 8, near: [{ v: 6, fb: "$(\\sqrt{4})^3 = 2^3$." }], hint: "$(\\sqrt{4})^3$.",
            m: "4^{\\frac{3}{2}} = 8", say: "$(\\sqrt{4})^3 = 2^3 = 8$. ✓" }],
        why: "Same base, exponents, solve, check. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $5^{x + 1} = 125$.", pre: "$x =$", answer: 2, skill: "Exponential equations",
        near: [{ v: 3, fb: "$x + 1 = 3$. Subtract 1." }, { v: 24, fb: "$125 = 5^3$, so $x + 1 = 3$." }],
        hints: ["$125 = 5^3$."], why: "$x + 1 = 3$, so $x = 2$." },
      { type: "sort", prompt: "Growth or decay?",
        bins: ["Growth", "Decay"],
        cards: [{ t: "$f(x) = 3^x$", bin: 0, fb: "The base is more than 1." },
                { t: "$f(x) = \\left(\\frac{1}{2}\\right)^x$", bin: 1, fb: "The base is between 0 and 1." },
                { t: "$f(x) = 1.05^x$", bin: 0, fb: "1.05 is more than 1: growth of 5% each step." },
                { t: "$f(x) = 0.8^x$", bin: 1, fb: "0.8 is less than 1: a loss of 20% each step." }],
        skill: "Growth and decay", hints: ["Is the base more than 1 or less than 1?"],
        why: "A base above 1 grows. A base between 0 and 1 decays." },
      { type: "learn", kicker: "A harder case",
        prompt: "Money grows exponentially. **\\$1,000 is invested at 6% a year, compounded monthly. What is it worth after 2 years?**",
        scene: { type: "walk", how: HOW_10_2A, rows: [
          { step: 1, m: "A = P(1 + \\frac{r}{n})^{nt}", say: "The compound interest formula." },
          { step: 2, m: "A = 1000(1 + \\frac{0.06}{12})^{12 \\cdot 2}", say: "$P = 1000$, $r = 0.06$, $n = 12$ and $t = 2$." },
          { step: 3, m: "A = 1000(1.005)^{24}", say: "Half a percent a month, for 24 months." },
          { step: 3, m: "A \\approx 1127.16", say: "\\$1,127.16. Simple interest would have given only \\$1,120." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A culture starts with 100 bacteria and doubles every hour: $N = 100 \\cdot 2^t$. How many are there after 5 hours?",
        answer: 3200, skill: "Exponential models",
        near: [big(3200), { v: 1000, fb: "Doubling five times is $2^5 = 32$, not $2 \\cdot 5$." }],
        hints: ["$100 \\cdot 2^5$."], why: "$100 \\cdot 32 = 3200$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the solving **first** goes wrong.",
        lines: ["2^{x + 3} = 16", "2^{x + 3} = 2^{8}", "x + 3 = 8", "x = 5"], answer: 1, fix: "2^{x + 3} = 2^{4}",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Exponential equations",
        hints: ["16 is which power of 2?"],
        why: "$16 = 2^4$, not $2^8$. So $x + 3 = 4$ and $x = 1$." },
      { type: "num", kicker: "Use it", prompt: "A car bought for **\\$20,000** loses 10% of its value each year: $V = 20000(0.9)^t$. What is it worth after 2 years?",
        pre: "$\\$$", answer: 16200, skill: "Exponential models",
        near: [big(16200), { v: 16000, fb: "The second year's 10% is taken from \\$18,000, not from \\$20,000." }],
        hints: ["$20000 \\cdot 0.9 \\cdot 0.9$."], why: "$20000 \\cdot 0.81 = 16200$." }
    ]
  });

  /* ========================= 10.3 · Evaluate and graph logarithmic functions */
  var HOW_10_3 = [["Name it", "Set the logarithm equal to a letter: $\\log_a x = y$."],
                  ["Convert", "Rewrite it in exponential form: $a^y = x$. The base stays the base."],
                  ["Same base", "Write both sides as powers of the same base."],
                  ["Solve", "Set the exponents equal."]];
  var LOG2 = function (x) { return x > 0 ? Math.log(x) / Math.LN2 : NaN; };
  LESSONS.push({
    title: "Logarithmic functions",
    blurb: "Book 10.3 · A logarithm is an exponent: converting forms, evaluating, graphing and solving.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "2 to which power is 8? $$2^{\\square} = 8$$", answer: 3, skill: "Evaluate powers",
        near: [{ v: 4, fb: "$2 \\cdot 4 = 8$, but the question is about a power: $2 \\cdot 2 \\cdot 2$." }], hints: ["2, 4, 8."], why: "$2^3 = 8$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **logarithm** is an exponent. $\\log_a x$ is the power to which $a$ must be raised to give $x$. So $y = \\log_a x$ means exactly $a^y = x$: the logarithmic function is the inverse of the exponential one.",
        scene: { type: "method", how: HOW_10_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\log_2 32$ evaluated.",
        scene: { type: "walk", how: HOW_10_3, rows: [
          { step: 1, m: "\\log_2 32 = y", say: "Give the unknown exponent a name." },
          { step: 2, m: "2^{y} = 32", say: "The same statement in exponential form.",
            ask: { prompt: "What is $\\log_2 32 = y$ in exponential form?", answer: 0,
                   options: [{ t: "$2^y = 32$" }, { t: "$y^2 = 32$", fb: "The base of the logarithm stays the base of the power." }, { t: "$32^y = 2$", fb: "The base is 2. The logarithm, $y$, is the exponent." }] } },
          { step: 3, m: "2^{y} = 2^{5}", say: "$32 = 2^5$." },
          { step: 4, m: "y = 5", say: "So $\\log_2 32 = 5$." }] },
        gate: true, then: "With no base written, $\\log x$ means base 10. And $\\ln x$ means base $e$, about 2.718." },
      { type: "guided", kicker: "Together",
        prompt: "Now you evaluate $\\log_3 \\frac{1}{9}$.",
        how: HOW_10_3, skill: "Evaluate logarithms",
        steps: [
          { step: 1, ask: "Name it: $\\log_3 \\frac{1}{9} = y$. What does $y$ stand for?", type: "choice", answer: 0,
            options: [{ t: "The exponent that 3 needs, to make $\\frac{1}{9}$" }, { t: "$\\frac{1}{9}$ divided by 3", fb: "A logarithm is an exponent, not a quotient." }],
            m: "\\log_3 \\frac{1}{9} = y", say: "A logarithm is an exponent." },
          { step: 2, ask: "Convert to exponential form.", type: "choice", answer: 0,
            options: [{ t: "$3^y = \\frac{1}{9}$" }, { t: "$y^3 = \\frac{1}{9}$", fb: "The base stays the base: 3." }],
            m: "3^{y} = \\frac{1}{9}", say: "Base 3, exponent $y$." },
          { step: 3, ask: "Write $\\frac{1}{9}$ as a power of 3.", type: "choice", answer: 0,
            options: [{ t: "$3^{-2}$" }, { t: "$3^{2}$", fb: "$3^2 = 9$. The reciprocal needs a negative exponent." }, { t: "$3^{-3}$", fb: "$3^{-3} = \\frac{1}{27}$." }],
            m: "3^{y} = 3^{-2}", say: "$\\frac{1}{9} = \\frac{1}{3^2}$." },
          { step: 4, ask: "So what is $y$?", type: "num", pre: "$y =$", answer: -2, near: [{ v: 2, fb: "The exponent is $-2$." }], hint: "Equal bases, equal exponents.",
            m: "\\log_3 \\frac{1}{9} = -2", say: "A logarithm can be negative. Its input cannot." }],
        why: "Name it, convert, same base, solve. Now convert some on your own." },
      { type: "slots", kicker: "On your own", prompt: "Match each logarithmic statement to its exponential form.",
        slots: [{ id: "a", label: "$5^2 = 25$" }, { id: "b", label: "$2^{-3} = \\frac{1}{8}$" }, { id: "c", label: "$10^3 = 1000$" }, { id: "d", label: "$e^0 = 1$" }],
        cards: [{ t: "$\\log_5 25 = 2$", slot: "a", fb: "Base 5, exponent 2." },
                { t: "$\\log_2 \\frac{1}{8} = -3$", slot: "b", fb: "Base 2, exponent $-3$." },
                { t: "$\\log 1000 = 3$", slot: "c", fb: "No base written means base 10." },
                { t: "$\\ln 1 = 0$", slot: "d", fb: "$\\ln$ is the logarithm with base $e$." }],
        skill: "Convert forms", hints: ["The base stays the base. The logarithm is the exponent."],
        why: "$\\log_a x = y$ and $a^y = x$ say the same thing." },
      { type: "num", prompt: "Evaluate $\\log 0.01$.", answer: -2, skill: "Evaluate logarithms",
        near: [{ v: 2, fb: "$10^2 = 100$. A number less than 1 has a negative logarithm." }], hints: ["$10^{y} = 0.01$."], why: "$0.01 = 10^{-2}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Converting also solves equations. $$\\log_2 (x - 3) = 4$$",
        scene: { type: "walk", how: HOW_10_3, rows: [
          { step: 1, m: "\\log_2 (x - 3) = 4", say: "The logarithm is already equal to a number.", fig: grid("The graph of y = log base 2 of x: rising slowly through (1, 0), (2, 1), (4, 2) and (8, 3), and plunging downward near the y-axis.", curve(LOG2, 0.12, 9, "blue", [-3, 4]).concat([{ pt: [1, 0], c: "orange" }, { pt: [2, 1], c: "orange" }, { pt: [8, 3], c: "orange" }]), { x: [-1, 9], y: [-3, 4] }) },
          { step: 2, m: "2^{4} = x - 3", say: "Exponential form: base 2, exponent 4." },
          { step: 4, m: "x = 19", say: "$16 = x - 3$. Check: $\\log_2 16 = 4$. ✓" }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "The graph of $y = \\log_2 x$ is the graph of $y = 2^x$ with every point's coordinates swapped. Which point is on $y = \\log_2 x$?",
        options: [{ t: "$(8, 3)$" }, { t: "$(3, 8)$", fb: "That point is on $y = 2^x$. Swap the coordinates." }, { t: "$(0, 1)$", fb: "$\\log_2 0$ does not exist: the domain is $x > 0$." }],
        answer: 0, skill: "Graph a logarithm", hints: ["$2^3 = 8$, so $\\log_2 8 = \\,?$"], why: "$\\log_2 8 = 3$. The domain of a logarithm is $(0, \\infty)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ria says $\\log_2 8 = 4$, “because $2 \\cdot 4 = 8$”. What is wrong?",
        options: [{ t: "A logarithm is an exponent, not a factor: $2^3 = 8$, so the answer is 3." },
                  { t: "It should be 16.", fb: "$\\log_2 8$ asks for the exponent that turns 2 into 8." },
                  { t: "Nothing. It is right.", fb: "Check with a power: $2^4 = 16$, not 8." }],
        answer: 0, skill: "Evaluate logarithms", hints: ["Convert it: $2^{y} = 8$."], why: "$\\log_2 8 = 3$." },
      { type: "num", kicker: "Use it", prompt: "An earthquake's magnitude is $M = \\log I$, where $I$ compares its intensity with a standard. What is the magnitude when $I = 100000$?",
        answer: 5, skill: "Logarithmic models",
        near: [{ v: 6, fb: "Count the zeros: $100000 = 10^5$." }], hints: ["$100000 = 10^{5}$."], why: "$\\log 10^5 = 5$. Each whole step in magnitude is ten times the intensity." }
    ]
  });
  /* =================================== 10.4 · Use the properties of logarithms */
  var HOW_10_4 = [["Quotient", "A quotient inside becomes a difference of logarithms."],
                  ["Product", "A product inside becomes a sum of logarithms."],
                  ["Power", "An exponent inside moves to the front as a multiplier."]];
  var HOW_10_4C = [["Power", "Move each multiplier back up as an exponent."],
                   ["Combine", "A sum becomes the log of a product, a difference the log of a quotient."],
                   ["Change base", "To evaluate with a calculator, use $\\log_a M = \\frac{\\log M}{\\log a}$."]];
  LESSONS.push({
    title: "Properties of logarithms",
    blurb: "Book 10.4 · The Product, Quotient and Power Properties, and the Change-of-Base Formula.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$$x^3 \\cdot x^4 = x^{\\square}$$ What goes in the box?", answer: 7, skill: "Exponent properties",
        near: [{ v: 12, fb: "Multiplying powers **adds** the exponents." }], hints: ["Add the exponents."], why: "$3 + 4 = 7$. Multiplying adds exponents, and logarithms are exponents." },
      { type: "learn", kicker: "The idea",
        prompt: "Logarithms are exponents, so they follow the exponent rules. **Product:** $\\log_a (MN) = \\log_a M + \\log_a N$. **Quotient:** $\\log_a \\frac{M}{N} = \\log_a M - \\log_a N$. **Power:** $\\log_a M^p = p \\log_a M$.",
        scene: { type: "method", how: HOW_10_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a logarithm expanded. $$\\log_2 \\frac{8x^3}{y}$$",
        scene: { type: "walk", how: HOW_10_4, rows: [
          { step: 1, m: "\\log_2 8x^3 - \\log_2 y", say: "The quotient becomes a difference." },
          { step: 2, m: "\\log_2 8 + \\log_2 x^3 - \\log_2 y", say: "The product $8x^3$ becomes a sum.",
            ask: { prompt: "What does $\\log_2 (8x^3)$ become?", answer: 0,
                   options: [{ t: "$\\log_2 8 + \\log_2 x^3$" }, { t: "$\\log_2 8 \\cdot \\log_2 x^3$", fb: "A product inside becomes a **sum** of logarithms, not a product of them." }] } },
          { step: 3, m: "\\log_2 8 + 3\\log_2 x - \\log_2 y", say: "The exponent 3 comes to the front." },
          { step: 3, m: "3 + 3\\log_2 x - \\log_2 y", say: "And $\\log_2 8 = 3$, since $2^3 = 8$." }] },
        gate: true, then: "One complicated logarithm became three simple ones." },
      { type: "guided", kicker: "Together",
        prompt: "Now you expand $\\log_3 (9x^2)$.",
        how: HOW_10_4, skill: "Properties of logarithms",
        steps: [
          { step: 1, ask: "Is there a quotient inside the logarithm?", type: "choice", answer: 0,
            options: [{ t: "No: go on to the product" }, { t: "Yes", fb: "$9x^2$ is a product, with nothing divided." }],
            m: "\\log_3 (9x^2)", say: "No difference needed." },
          { step: 2, ask: "Use the Product Property.", type: "choice", answer: 0,
            options: [{ t: "$\\log_3 9 + \\log_3 x^2$" }, { t: "$\\log_3 9 \\cdot \\log_3 x^2$", fb: "A product inside becomes a **sum**." }, { t: "$\\log_3 9 - \\log_3 x^2$", fb: "A difference comes from a quotient." }],
            m: "\\log_3 9 + \\log_3 x^2", say: "The product becomes a sum." },
          { step: 3, ask: "Use the Power Property on $\\log_3 x^2$.", type: "choice", answer: 0,
            options: [{ t: "$2\\log_3 x$" }, { t: "$(\\log_3 x)^2$", fb: "The exponent moves to the front as a multiplier." }],
            m: "\\log_3 9 + 2\\log_3 x", say: "The 2 comes down in front." },
          { step: 3, ask: "What is $\\log_3 9$?", type: "num", answer: 2, near: [{ v: 3, fb: "$3^3 = 27$. Which power of 3 is 9?" }], hint: "$3^{y} = 9$.",
            m: "2 + 2\\log_3 x", say: "$3^2 = 9$." }],
        why: "Quotient, product, power. Now match the properties yourself." },
      { type: "slots", kicker: "On your own", prompt: "Match each logarithm to what it expands to.",
        slots: [{ id: "a", label: "$\\log_a M + \\log_a N$" }, { id: "b", label: "$\\log_a M - \\log_a N$" }, { id: "c", label: "$p \\log_a M$" }],
        cards: [{ t: "$\\log_a (MN)$", slot: "a", fb: "Product: a sum." },
                { t: "$\\log_a \\frac{M}{N}$", slot: "b", fb: "Quotient: a difference." },
                { t: "$\\log_a M^p$", slot: "c", fb: "Power: a multiplier in front." }],
        skill: "Properties of logarithms", hints: ["Multiplying adds exponents. Dividing subtracts them."],
        why: "Each property is an exponent rule in disguise." },
      { type: "num", prompt: "The properties also work backwards. $\\log_2 4 + \\log_2 8 = \\log_2 32$. What is its value?", answer: 5, skill: "Properties of logarithms",
        near: [{ v: 6, fb: "$\\log_2 4 = 2$ and $\\log_2 8 = 3$: add them." }], hints: ["$2^{5} = 32$."], why: "$2 + 3 = 5$, and $2^5 = 32$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Run the properties backwards to **condense**. And for a base your calculator lacks, change the base.",
        scene: { type: "walk", how: HOW_10_4C, rows: [
          { step: 1, m: "2\\log x + \\log (x - 1) = \\log x^2 + \\log (x - 1)", say: "The multiplier 2 goes back up as an exponent." },
          { step: 2, m: "\\log (x^2(x - 1))", say: "A sum of logarithms is the logarithm of a product." },
          { step: 3, m: "\\log_3 20 = \\frac{\\log 20}{\\log 3} \\approx 2.727", say: "A calculator has only $\\log$ and $\\ln$. Divide one by the other." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Condense $\\log_5 x - \\log_5 4$ into one logarithm.",
        options: [{ t: "$\\log_5 \\frac{x}{4}$" }, { t: "$\\log_5 (x - 4)$", fb: "A difference of logarithms is the logarithm of a **quotient**." }, { t: "$\\frac{\\log_5 x}{\\log_5 4}$", fb: "That is a quotient of logarithms: the change-of-base pattern, a different thing." }],
        answer: 0, skill: "Properties of logarithms", hints: ["Subtracting logs: divide inside."], why: "$\\log_5 x - \\log_5 4 = \\log_5 \\frac{x}{4}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the expanding **first** goes wrong.",
        lines: ["\\log_2 (x + 8)", "\\log_2 x + \\log_2 8", "\\log_2 x + 3"], answer: 1, fix: "\\log_2 (x + 8)",
        fb: { 0: GIVEN, 2: LATER }, skill: "Properties of logarithms",
        hints: ["Is $x + 8$ a product?"],
        why: "There is no property for the logarithm of a **sum**. $\\log_2 (x + 8)$ cannot be expanded." },
      { type: "num", kicker: "Use it", prompt: "Use the Change-of-Base Formula with $\\log 50 \\approx 1.699$ and $\\log 2 \\approx 0.301$ to find $\\log_2 50$, to one decimal place.",
        answer: 5.6, tol: 0.06, skill: "Change of base",
        near: [{ v: 1.4, tol: 0.06, fb: "Divide: $\\frac{\\log 50}{\\log 2}$, not a difference." }, { v: 0.2, tol: 0.06, fb: "The number goes on top and the base below: $\\frac{\\log 50}{\\log 2}$." }],
        hints: ["$\\frac{1.699}{0.301}$."], why: "$\\frac{1.699}{0.301} \\approx 5.6$. That fits: $2^5 = 32$ and $2^6 = 64$." }
    ]
  });

  /* ====================== 10.5 · Solve exponential and logarithmic equations */
  var HOW_10_5 = [["Isolate", "Isolate the exponential expression."],
                  ["Take logs", "Take the logarithm of both sides."],
                  ["Power", "Use the Power Property to bring the exponent down."],
                  ["Solve", "Solve for the variable, and approximate if needed."]];
  var HOW_10_5L = [["Condense", "Use the properties to write one logarithm on each side, or one logarithm equal to a number."],
                   ["Drop logs", "If $\\log_a M = \\log_a N$ then $M = N$. Or rewrite in exponential form."],
                   ["Solve", "Solve the equation."],
                   ["Check", "Reject any solution that makes a logarithm's input zero or negative."]];
  LESSONS.push({
    title: "Solve exponential and logarithmic equations",
    blurb: "Book 10.5 · Taking logarithms of both sides, condensing first, and models of growth and decay.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $\\log_2 x = 3$.", pre: "$x =$", answer: 8, skill: "Evaluate logarithms",
        near: [{ v: 6, fb: "Convert: $2^3 = x$, and $2^3$ is $2 \\cdot 2 \\cdot 2$." }, { v: 9, fb: "The base is 2: $2^3$, not $3^2$." }], hints: ["$2^{3} = x$."], why: "$2^3 = 8$." },
      { type: "learn", kicker: "The idea",
        prompt: "$5^x = 11$ cannot be written with one base on both sides. So take the **logarithm of both sides**. The Power Property turns the exponent into a factor, and the equation becomes linear.",
        scene: { type: "method", how: HOW_10_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$5^x = 11$$",
        scene: { type: "walk", how: HOW_10_5, rows: [
          { step: 1, m: "5^{x} = 11", say: "The exponential is already alone." },
          { step: 2, m: "\\log 5^{x} = \\log 11", say: "Equal numbers have equal logarithms." },
          { step: 3, m: "x \\log 5 = \\log 11", say: "The exponent comes down in front.",
            ask: { prompt: "What does the Power Property do to $\\log 5^x$?", answer: 0,
                   options: [{ t: "It gives $x \\log 5$" }, { t: "It gives $\\log 5x$", fb: "The exponent moves in front of the logarithm, as a multiplier." }] } },
          { step: 4, m: "x = \\frac{\\log 11}{\\log 5}", say: "Divide both sides by $\\log 5$, which is just a number." },
          { step: 4, m: "x \\approx 1.490", say: "It makes sense: $5^1 = 5$ and $5^2 = 25$, and 11 lies between them." }] },
        gate: true, then: "$\\frac{\\log 11}{\\log 5}$ is not $\\log \\frac{11}{5}$. It is two logarithms, divided." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$3 \\cdot 2^x = 60$$",
        how: HOW_10_5, skill: "Solve with logarithms",
        steps: [
          { step: 1, ask: "Isolate the exponential.", type: "choice", answer: 0,
            options: [{ t: "$2^x = 20$" }, { t: "$6^x = 60$", fb: "The 3 multiplies the whole power. It cannot be merged into the base." }],
            m: "2^{x} = 20", say: "Divide both sides by 3." },
          { step: 2, ask: "Take the logarithm of both sides.", type: "choice", answer: 0,
            options: [{ t: "$\\log 2^x = \\log 20$" }, { t: "$\\log 2^x = 20$", fb: "Both sides: whatever is done to one side is done to the other." }],
            m: "\\log 2^{x} = \\log 20", say: "Both sides." },
          { step: 3, ask: "Bring the exponent down.", type: "choice", answer: 0,
            options: [{ t: "$x \\log 2 = \\log 20$" }, { t: "$\\log 2x = \\log 20$", fb: "The $x$ goes in front of the logarithm, not inside it." }],
            m: "x \\log 2 = \\log 20", say: "The Power Property." },
          { step: 4, ask: "Solve for $x$.", type: "choice", answer: 0,
            options: [{ t: "$x = \\frac{\\log 20}{\\log 2} \\approx 4.32$" }, { t: "$x = \\log 10 = 1$", fb: "$\\frac{\\log 20}{\\log 2}$ is not $\\log \\frac{20}{2}$." }, { t: "$x = \\log 20 - \\log 2$", fb: "Divide by $\\log 2$. Don't subtract it." }],
            m: "x = \\frac{\\log 20}{\\log 2} \\approx 4.32", say: "And $2^4 = 16$, $2^5 = 32$: 20 lies between. ✓" }],
        why: "Isolate, take logs, power, solve. Now a logarithmic equation on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $\\log_2 x + \\log_2 (x - 2) = 3$. (Condense the left side first.)", pre: "$x =$", answer: 4, skill: "Logarithmic equations",
        near: [{ v: -2, fb: "$x = -2$ solves the quadratic, but $\\log_2 (-2)$ does not exist. Reject it." }, { v: 2.5, tol: 1e-9, fb: "A sum of logs is the log of a **product**: $\\log_2 (x(x - 2)) = 3$." }],
        hints: ["$\\log_2 (x(x - 2)) = 3$, so $x(x - 2) = 2^3$."], why: "$x^2 - 2x - 8 = 0$ gives $x = 4$ or $x = -2$. Only 4 keeps both inputs positive." },
      { type: "learn", kicker: "A harder case",
        prompt: "With logarithms on both sides, condense, then drop them. $$2\\log_3 x = \\log_3 36$$",
        scene: { type: "walk", how: HOW_10_5L, rows: [
          { step: 1, m: "\\log_3 x^2 = \\log_3 36", say: "The Power Property, backwards: one logarithm on each side." },
          { step: 2, m: "x^2 = 36", say: "Equal logarithms with the same base have equal inputs." },
          { step: 3, m: "x = 6 \\quad\\text{or}\\quad x = -6", say: "The Square Root Property." },
          { step: 4, m: "x = 6", say: "$\\log_3 (-6)$ does not exist, so $-6$ is rejected." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Money growing continuously at 5% a year follows $A = A_0 e^{0.05t}$. About how long does it take to **double**? (Use $\\ln 2 \\approx 0.693$.)",
        options: [{ t: "About 13.9 years" }, { t: "40 years", fb: "That is $2 \\div 0.05$. Take the natural log first: $\\ln 2 = 0.05t$." }, { t: "20 years", fb: "That would be simple interest. Continuous growth is quicker." }],
        answer: 0, skill: "Exponential models", hints: ["$2 = e^{0.05t}$, so $\\ln 2 = 0.05t$."], why: "$t = \\frac{0.693}{0.05} \\approx 13.9$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Solving $\\log x + \\log (x - 3) = 1$, Zed gets $x = 5$ and $x = -2$, and keeps both. What is wrong?",
        options: [{ t: "$x = -2$ makes $\\log x$ the logarithm of a negative number. It must be rejected." },
                  { t: "Both must be rejected.", fb: "$x = 5$ works: $\\log 5 + \\log 2 = \\log 10 = 1$." },
                  { t: "Nothing. Both solve $x(x - 3) = 10$.", fb: "They solve that equation, but the original has logarithms, whose inputs must be positive." }],
        answer: 0, skill: "Logarithmic equations", hints: ["Step 4 of the method: check the inputs."], why: "Only $x = 5$ is a solution." },
      { type: "num", kicker: "Use it", prompt: "A culture grows as $N = 500e^{0.2t}$, with $t$ in hours. When does it reach 2,000? (Use $\\ln 4 \\approx 1.386$, and give one decimal place.)",
        post: "hours", answer: 6.9, tol: 0.06, skill: "Exponential models",
        near: [{ v: 20, tol: 0.06, fb: "That is $4 \\div 0.2$. Take the natural log of 4 first." }],
        hints: ["$4 = e^{0.2t}$, so $\\ln 4 = 0.2t$."], why: "$t = \\frac{1.386}{0.2} \\approx 6.9$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "a2u10-compose", title: "Evaluate a composite function", lesson: 2,
      gen: function (R) {
        var a = R.int(2, 4), b = R.nz(-5, 5), c = R.nz(-3, 3), k = R.int(-3, 4), fg = R.chance(0.5);
        var g = k * k + c, f = a * k + b, ans = fg ? a * g + b : f * f + c;
        return { type: "num", prompt: "With $f(x) = " + poly([[a, "x"], [b, ""]]) + "$ and $g(x) = " + poly([[1, "x^2"], [c, ""]]) + "$, find $" + (fg ? "f(g(" + k + "))" : "g(f(" + k + "))") + "$.", answer: ans,
          near: near(ans, [{ v: fg ? f * f + c : a * g + b, fb: "That is the other order. Start with the **inside** function." }]),
          hints: [fg ? "First $g(" + k + ") = " + g + "$. Then find $f(" + g + ")$." : "First $f(" + k + ") = " + f + "$. Then find $g(" + f + ")$."],
          why: fg ? "$g(" + k + ") = " + g + "$, and $f(" + g + ") = " + ans + "$." : "$f(" + k + ") = " + f + "$, and $g(" + f + ") = " + ans + "$." };
      } },
    { id: "a2u10-inverse", title: "Find an inverse function", lesson: 2,
      gen: function (R) {
        var a = R.int(2, 6), b = R.nz(-7, 7), top = poly([[1, "x"], [-b, ""]]);
        return mc(R, { prompt: "Find the inverse of $f(x) = " + poly([[a, "x"], [b, ""]]) + "$.", right: "$f^{-1}(x) = \\frac{" + top + "}{" + a + "}$",
          wrong: [{ t: "$f^{-1}(x) = \\frac{x}{" + a + "} " + signed(-b) + "$", fb: "Undo the " + (b < 0 ? "subtraction" : "addition") + " first. Then the whole result is divided by " + a + "." },
                  { t: "$f^{-1}(x) = \\frac{1}{" + poly([[a, "x"], [b, ""]]) + "}$", fb: "$f^{-1}$ is the inverse function, not the reciprocal." }],
          hints: ["Write $x = " + poly([[a, "y"], [b, ""]]) + "$ and solve for $y$."], why: "$x " + signed(-b) + " = " + a + "y$, so $y = \\frac{" + top + "}{" + a + "}$." });
      } },
    { id: "a2u10-expeq", title: "Solve an exponential equation", lesson: 3,
      gen: function (R) {
        var base = R.pick([2, 3, 5]), k = R.int(2, base === 2 ? 6 : 4), p = R.nz(-4, 4), x0 = k - p;
        return { type: "num", prompt: "Solve. $$" + base + "^{" + poly([[1, "x"], [p, ""]]) + "} = " + Math.pow(base, k) + "$$", pre: "$x =$", answer: x0,
          near: near(x0, [{ v: k, fb: "That is the value of the exponent, $" + poly([[1, "x"], [p, ""]]) + "$. Now solve for $x$." }]),
          hints: ["$" + Math.pow(base, k) + " = " + base + "^{" + k + "}$."], why: "$" + poly([[1, "x"], [p, ""]]) + " = " + k + "$, so $x = " + x0 + "$." };
      } },
    { id: "a2u10-log", title: "Evaluate a logarithm", lesson: 4,
      gen: function (R) {
        var base = R.pick([2, 3, 4, 5, 10]), k = R.pick(base === 2 ? [1, 2, 3, 4, 5, 6, -1, -2, -3] : base === 10 ? [1, 2, 3, 4, -1, -2] : [1, 2, 3, -1, -2, 0]);
        var val = Math.pow(base, Math.abs(k)), arg = k >= 0 ? String(val) : "\\frac{1}{" + val + "}";
        return { type: "num", prompt: "Evaluate $\\log_{" + base + "} " + arg + "$.", answer: k,
          near: near(k, [{ v: -k, fb: k < 0 ? "A number less than 1 has a negative logarithm." : "A number greater than 1 has a positive logarithm." }]),
          hints: ["$" + base + "$ to which power gives $" + arg + "$?"], why: "$" + base + "^{" + k + "} = " + arg + "$." };
      } },
    { id: "a2u10-props", title: "Use the properties of logarithms", lesson: 5,
      gen: function (R) {
        var b = R.pick([2, 3, 5]), p = R.int(2, 5), kind = R.int(0, 1), L1 = "\\log_" + b;
        if (kind === 0) return mc(R, { prompt: "Expand. $$" + L1 + " (x^{" + p + "}y)$$", right: "$" + p + L1 + " x + " + L1 + " y$",
          wrong: [{ t: "$" + p + L1 + " x \\cdot " + L1 + " y$", fb: "A product inside becomes a **sum** of logarithms." }, { t: "$" + p + "(" + L1 + " x + " + L1 + " y)$", fb: "The exponent belongs to $x$ only, so only its logarithm is multiplied." }],
          hints: ["Product first, then the power."], why: "$" + L1 + " x^{" + p + "} + " + L1 + " y = " + p + L1 + " x + " + L1 + " y$." });
        return mc(R, { prompt: "Condense into one logarithm. $$" + L1 + " x - " + p + L1 + " y$$", right: "$" + L1 + " \\frac{x}{y^{" + p + "}}$",
          wrong: [{ t: "$" + L1 + " (x - y^{" + p + "})$", fb: "A difference of logarithms is the logarithm of a **quotient**." }, { t: "$" + L1 + " \\frac{x}{" + p + "y}$", fb: "The multiplier goes back up as an **exponent**: $y^{" + p + "}$." }],
          hints: ["Move the " + p + " up as an exponent, then combine."], why: "$" + L1 + " x - " + L1 + " y^{" + p + "} = " + L1 + " \\frac{x}{y^{" + p + "}}$." });
      } },
    { id: "a2u10-solvelog", title: "Solve a logarithmic equation", lesson: 6,
      gen: function (R) {
        var b = R.pick([2, 3, 4, 5]), k = R.int(1, b === 2 ? 5 : 3), p = R.nz(-6, 6), x0 = Math.pow(b, k) - p;
        return { type: "num", prompt: "Solve. $$\\log_{" + b + "} (" + poly([[1, "x"], [p, ""]]) + ") = " + k + "$$", pre: "$x =$", answer: x0,
          near: near(x0, [{ v: b * k - p, fb: "Convert to a power: $" + b + "^{" + k + "}$, not $" + b + " \\cdot " + k + "$." }, { v: Math.pow(b, k), fb: "That is the value of $" + poly([[1, "x"], [p, ""]]) + "$. Now solve for $x$." }]),
          hints: ["$" + b + "^{" + k + "} = " + poly([[1, "x"], [p, ""]]) + "$."], why: "$" + Math.pow(b, k) + " = " + poly([[1, "x"], [p, ""]]) + "$, so $x = " + x0 + "$." };
      } }
  ];
  L.unit("alg2", 10, {
    title: "Exponential and Logarithmic Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Composite and inverse functions, and exponential equations.",
        skills: ["a2u10-compose", "a2u10-inverse", "a2u10-expeq"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Logarithms, their properties, and logarithmic equations.",
        skills: ["a2u10-log", "a2u10-props", "a2u10-solvelog"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:10", {
    2: { name: "Inverse functions", frame: "A composition feeds one function into another: the [[inside]] function goes first. An inverse function [[undoes]] $f$. To find it, [[swap]] $x$ and $y$ and solve for $y$. Only [[one-to-one]] functions have inverses.",
         chips: ["outside", "squares"] },
    3: { name: "Exponential functions", frame: "In $f(x) = a^x$ the variable is the [[exponent]]. If $a > 1$ the function [[grows]], and if $0 < a < 1$ it [[decays]]. If $a^x = a^y$, then [[$x = y$]].",
         chips: ["base", "$a = y$"] },
    4: { name: "Logarithms", frame: "$y = \\log_a x$ means [[$a^y = x$]]. A logarithm is an [[exponent]]. Its input must be [[positive]].",
         chips: ["$y^a = x$", "negative"], fb: { "$y^a = x$": "The base of the logarithm stays the base of the power." } },
    5: { name: "Log properties", frame: "The log of a product is a [[sum]] of logs. The log of a quotient is a [[difference]]. An exponent inside comes out as a [[multiplier]].",
         chips: ["product", "power"] },
    6: { name: "Solving with logarithms", frame: "To solve $a^x = b$, take the [[logarithm]] of both sides and bring the exponent [[down]]. To solve a logarithmic equation, [[condense]] first. Reject any solution that makes a log's input [[negative]].",
         chips: ["positive", "up"] }
  });
})();
