/* ==========================================================================
   Algebra II — Unit 2: Solving Linear Equations. See lab/core.js for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 2, section for section:
   the readiness check, then 2.1 to 2.7. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   The general strategy comes first (2.1), then the problem-solving strategy
   and the word problems it unlocks (2.2–2.4), then inequalities: linear,
   compound and absolute value (2.5–2.7).

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Eight lessons, seven skills, two quizzes, and the unit test.
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
    blurb: "Book: Chapter 2 Be Prepared · Simplify an expression, find an LCD, and turn words into symbols.",
    mins: 6, v: 1,
    steps: [
      { type: "expr", kicker: "Check 1 · Simplify", prompt: "Simplify $2(x - 4) + 5x$.",
        answer: "7x-8", shown: "7x - 8", form: "simplified", skill: "Simplify an expression",
        near: [{ v: "7x-4", fb: "The 2 multiplies the 4 as well: $2 \\cdot 4 = 8$." }],
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"]], placeholder: "Use x",
        hints: ["Distribute the 2, then combine the $x$ terms."], why: "$2x - 8 + 5x = 7x - 8$." },
      { type: "num", prompt: "Evaluate $3a - 2b$ when $a = 4$ and $b = -5$.", answer: 22, skill: "Simplify an expression",
        near: [{ v: 2, fb: "$-2(-5) = +10$: same signs give a positive." }], hints: ["$3(4) - 2(-5)$."], why: "$12 + 10 = 22$." },
      { type: "num", kicker: "Check 2 · Fractions and percents", prompt: "What is the least common denominator of $\\frac{5}{6}$ and $\\frac{3}{4}$?", answer: 12, skill: "Least common denominator",
        near: [{ v: 24, fb: "24 is a common denominator, but there is a smaller one." }], hints: ["The smallest number that both 6 and 4 divide."], why: "$6 \\cdot 2 = 12$ and $4 \\cdot 3 = 12$." },
      { type: "num", prompt: "What is 25% of 80?", answer: 20, skill: "Percent of a number",
        near: [{ v: 2000, fb: "Write 25% as 0.25 before you multiply." }], hints: ["$0.25 \\cdot 80$, or a quarter of 80."], why: "$0.25 \\cdot 80 = 20$." },
      { type: "choice", kicker: "Check 3 · Words into symbols", prompt: "Which expression is “5 less than a number $n$”?",
        options: [{ t: "$n - 5$" }, { t: "$5 - n$", fb: "“5 less than $n$” starts from $n$ and takes 5 away." }, { t: "$5n$", fb: "That is 5 times the number." }],
        answer: 0, skill: "Translate a phrase", hints: ["Start with the number. Then make it 5 less."], why: "$n - 5$." },
      { type: "choice", prompt: "Which symbol makes this true? $-7 \\;\\square\\; -3$",
        options: [{ t: "$<$" }, { t: "$>$", fb: "$-7$ is further left on the number line, so it is smaller." }, { t: "$=$", fb: "They are different numbers." }],
        answer: 0, skill: "Compare numbers", hints: ["Which one is further left on the number line?"], why: "$-7 < -3$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 2.1**. If **check 1** slipped, Unit 1's lessons 1.2 and 1.5 cover it. If **check 2** slipped, see lessons 1.3 and 1.4. If **check 3** slipped, lesson 1.1 ends with translating.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================= 2.1 · Use a general strategy to solve linear equations */
  var HOW_2_1 = [["Simplify", "Simplify each side: distribute and combine like terms."],
                 ["Variables", "Collect the variable terms on one side."],
                 ["Constants", "Collect the constant terms on the other side."],
                 ["Coefficient", "Make the coefficient of the variable 1: multiply or divide both sides."],
                 ["Check", "Substitute the solution into the original equation."]];
  LESSONS.push({
    title: "A general strategy for linear equations",
    blurb: "Book 2.1 · One strategy for every linear equation, three kinds of equation, and clearing fractions and decimals.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A **solution** makes the equation true. Is $x = 3$ a solution of $5x - 4 = 2x + 5$?",
        options: [{ t: "Yes: both sides are 11" }, { t: "No: the sides are 11 and 6", fb: "$2(3) + 5 = 11$, not 6." }, { t: "No: the sides are different expressions", fb: "They look different, but at $x = 3$ they have the same value." }],
        answer: 0, skill: "Check a solution", hints: ["Put 3 in place of $x$ on each side."], why: "$5(3) - 4 = 11$ and $2(3) + 5 = 11$." },
      { type: "learn", kicker: "The idea",
        prompt: "One strategy solves every linear equation. Simplify each side, collect the variable terms on one side and the constants on the other, then make the coefficient 1. Whatever you do to one side, do to the other.",
        scene: { type: "method", how: HOW_2_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the strategy from start to finish. $$5(x - 2) + 3 = 2x + 11$$",
        scene: { type: "walk", how: HOW_2_1, rows: [
          { step: 1, m: "5(x - 2) + 3 = 2x + 11", say: "The left side has parentheses. Simplify it first." },
          { step: 1, m: "5x - 10 + 3 = 2x + 11", say: "Distribute the 5." },
          { step: 1, m: "5x - 7 = 2x + 11", say: "Combine $-10 + 3$." },
          { step: 2, m: "3x - 7 = 11", say: "Subtract $2x$ from both sides. The variable is now only on the left.",
            ask: { prompt: "How do you collect the variable terms on the left?", answer: 0,
                   options: [{ t: "Subtract $2x$ from both sides" }, { t: "Add 7 to both sides", fb: "That collects the constants: the next step." }, { t: "Divide both sides by 5", fb: "Dividing comes last, when one variable term is left." }] } },
          { step: 3, m: "3x = 18", say: "Add 7 to both sides." },
          { step: 4, m: "x = 6", say: "Divide both sides by 3." },
          { step: 5, m: "5(6 - 2) + 3 = 23 \\quad 2(6) + 11 = 23", say: "Both sides are 23, so $x = 6$ checks. ✓" }] },
        gate: true, then: "Simplify, variables, constants, coefficient, check. The same five steps every time." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$4(y - 3) = 2(y + 5)$$",
        how: HOW_2_1, skill: "Solve a linear equation",
        steps: [
          { step: 1, ask: "Distribute on both sides.", type: "choice", answer: 0,
            options: [{ t: "$4y - 12 = 2y + 10$" }, { t: "$4y - 3 = 2y + 5$", fb: "The factor outside multiplies both terms inside." }, { t: "$4y - 12 = 2y + 5$", fb: "Distribute the 2 on the right as well: $2 \\cdot 5 = 10$." }],
            m: "4y - 12 = 2y + 10", say: "Each side is now simplified." },
          { step: 2, ask: "Collect the variables on the left. What do you do to both sides?", type: "choice", answer: 0,
            options: [{ t: "Subtract $2y$" }, { t: "Add $2y$", fb: "That would leave $4y$ on the right. Subtract to remove the $2y$." }],
            m: "2y - 12 = 10", say: "$4y - 2y = 2y$." },
          { step: 3, ask: "Add 12 to both sides. What does $2y$ equal?", type: "num", pre: "$2y =$", answer: 22, near: [{ v: -2, fb: "Add 12 to the 10. Don't subtract it." }], hint: "$10 + 12$.",
            m: "2y = 22", say: "The constants are on the right." },
          { step: 4, ask: "Divide both sides by 2.", type: "num", pre: "$y =$", answer: 11, near: [{ v: 44, fb: "Divide by 2. Don't multiply." }], hint: "$22 \\div 2$.",
            m: "y = 11", say: "The coefficient is now 1." },
          { step: 5, ask: "Check. With $y = 11$, what are the two sides of $4(y - 3) = 2(y + 5)$?", type: "choice", answer: 0,
            options: [{ t: "32 and 32" }, { t: "44 and 32", fb: "$4(11 - 3) = 4 \\cdot 8$." }],
            m: "4(8) = 32 \\quad 2(16) = 32", say: "True, so 11 is the solution. ✓" }],
        why: "All five steps, in order. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $7x - 3 = 4x + 12$.", pre: "$x =$", answer: 5, skill: "Solve a linear equation",
        near: [{ v: 3, fb: "Add 3 to both sides: $3x = 15$." }, { v: 15, fb: "$3x = 15$. One more step." }],
        hints: ["Subtract $4x$ from both sides, then add 3."], why: "$3x - 3 = 12$, so $3x = 15$ and $x = 5$." },
      { type: "sort", prompt: "Not every equation has exactly one solution. Simplify each, then sort it.",
        bins: ["One solution", "No solution", "Every number"],
        cards: [{ t: "$2x + 6 = 2(x + 3)$", bin: 2, fb: "Both sides are the same expression. It is true for every $x$: an **identity**." },
                { t: "$3x + 1 = 3x + 5$", bin: 1, fb: "Subtract $3x$: $1 = 5$ is never true. A **contradiction**." },
                { t: "$5x - 2 = 3x + 8$", bin: 0, fb: "$2x = 10$, so $x = 5$: a **conditional** equation." },
                { t: "$4(x - 1) = 4x - 1$", bin: 1, fb: "$4x - 4 = 4x - 1$ gives $-4 = -1$: never true." }],
        skill: "Classify an equation", hints: ["Collect the variables. Do they vanish? If so, is what remains true or false?"],
        why: "Conditional: one solution. Identity: every number. Contradiction: none." },
      { type: "learn", kicker: "A harder case",
        prompt: "Fractions make every step harder, so clear them first: multiply both sides by the LCD. $$\\frac{1}{2}x + \\frac{2}{3} = \\frac{1}{6}x + 2$$",
        scene: { type: "walk", how: HOW_2_1, rows: [
          { step: 1, m: "\\frac{1}{2}x + \\frac{2}{3} = \\frac{1}{6}x + 2", say: "The LCD of 2, 3 and 6 is 6." },
          { step: 1, m: "3x + 4 = x + 12", say: "Multiply every term on both sides by 6. No fractions are left." },
          { step: 2, m: "2x + 4 = 12", say: "Subtract $x$ from both sides." },
          { step: 3, m: "2x = 8", say: "Subtract 4 from both sides." },
          { step: 4, m: "x = 4", say: "Divide by 2. Check: $2 + \\frac{2}{3}$ on the left, $\\frac{2}{3} + 2$ on the right. ✓" }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Decimals clear the same way. Solve $0.25n + 0.5 = 3$.", pre: "$n =$", answer: 10, skill: "Clear fractions and decimals",
        near: [{ v: 14, fb: "Subtract 0.5 first: $0.25n = 2.5$." }, { v: 0.625, tol: 1e-9, fb: "Divide 2.5 by 0.25. Don't multiply." }],
        hints: ["Multiply every term by 100: $25n + 50 = 300$."], why: "$25n = 250$, so $n = 10$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Sam solved $3(x - 4) = x + 6$ and got $x = 5$. Tap the line where the work **first** goes wrong.",
        lines: ["3(x - 4) = x + 6", "3x - 4 = x + 6", "2x - 4 = 6", "2x = 10", "x = 5"], answer: 1, fix: "3x - 12 = x + 6",
        fb: { 0: GIVEN, 2: LATER, 3: LATER, 4: LATER }, skill: "Solve a linear equation",
        hints: ["Check the distributing."],
        why: "$3 \\cdot 4 = 12$. Then $2x - 12 = 6$, so $2x = 18$ and $x = 9$." },
      { type: "num", kicker: "Use it", prompt: "One gym charges **\\$25** to join and **\\$15** a month. Another charges **\\$55** to join and **\\$10** a month. After how many months have you paid the same at both?",
        post: "months", answer: 6, skill: "Solve a linear equation",
        near: [{ v: 30, fb: "$5m = 30$. Divide by 5." }],
        hints: ["$25 + 15m = 55 + 10m$."], why: "$5m = 30$, so $m = 6$. Both cost \\$115 by then." }
    ]
  });

  /* ============================== 2.2 · Use a problem solving strategy */
  var HOW_2_2 = [["Read", "Read the problem until every word and idea is clear."],
                 ["Name", "Say what you are looking for, and choose a variable for it."],
                 ["Translate", "Restate the problem in one sentence, then write it as an equation."],
                 ["Solve", "Solve the equation."],
                 ["Answer", "Check that the answer makes sense, then answer in a sentence."]];
  LESSONS.push({
    title: "A problem solving strategy",
    blurb: "Book 2.2 · Read, name, translate, solve, answer: number problems, percents and simple interest.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which equation says “the sum of twice a number and 7 is 15”?",
        options: [{ t: "$2n + 7 = 15$" }, { t: "$2(n + 7) = 15$", fb: "Only the number is doubled. The 7 is added after." }, { t: "$2n = 7 + 15$", fb: "“Is” marks the equals sign: everything before it is the left side." }],
        answer: 0, skill: "Translate a sentence", hints: ["“Twice a number” is $2n$. “Is” means equals."], why: "Twice a number, $2n$, plus 7, equals 15." },
      { type: "learn", kicker: "The idea",
        prompt: "Most of a word problem is solved before any algebra. Read it, name the unknown, and translate one sentence into one equation. After that, the solving is what you already know.",
        scene: { type: "method", how: HOW_2_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the strategy on a number problem: **the sum of three consecutive integers is 84. Find them.**",
        scene: { type: "walk", how: HOW_2_2, rows: [
          { step: 1, m: "\\text{three consecutive integers add to } 84", say: "Consecutive integers follow one another: each is 1 more than the one before." },
          { step: 2, m: "n \\quad n + 1 \\quad n + 2", say: "Let $n$ be the first integer. The next two are $n + 1$ and $n + 2$.",
            ask: { prompt: "If the first integer is $n$, what is the third?", answer: 0,
                   options: [{ t: "$n + 2$" }, { t: "$3n$", fb: "Tripling is not the same as counting up two." }, { t: "$n + 3$", fb: "$n$, $n + 1$, $n + 2$: the third is two more than the first." }] } },
          { step: 3, m: "n + (n + 1) + (n + 2) = 84", say: "Their sum is 84." },
          { step: 4, m: "3n + 3 = 84", say: "Combine like terms." },
          { step: 4, m: "n = 27", say: "Subtract 3, then divide by 3." },
          { step: 5, m: "27 + 28 + 29 = 84", say: "The integers are 27, 28 and 29, and they do add to 84. ✓" }] },
        gate: true, then: "The naming step did the real work: three unknowns became one variable." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. **After a 20% discount, a bike costs \\$280. What was the original price?**",
        how: HOW_2_2, skill: "Percent problems",
        steps: [
          { step: 1, ask: "What are you asked to find?", type: "choice", answer: 0,
            options: [{ t: "The original price" }, { t: "The sale price", fb: "That is given: \\$280." }, { t: "The discount in dollars", fb: "That can be found later. The question asks for the price before the discount." }],
            m: "\\text{find the original price}", say: "Know the target before you start." },
          { step: 2, ask: "Let $p$ be the original price. What is the discount, in terms of $p$?", type: "choice", answer: 0,
            options: [{ t: "$0.20p$" }, { t: "$20p$", fb: "20% as a decimal is 0.20." }, { t: "$p - 20$", fb: "The discount is 20 percent of the price, not 20 dollars." }],
            m: "p \\quad\\text{and}\\quad 0.20p", say: "The price, and the discount taken from it." },
          { step: 3, ask: "Translate: the original price minus the discount is the sale price.", type: "choice", answer: 0,
            options: [{ t: "$p - 0.20p = 280$" }, { t: "$p + 0.20p = 280$", fb: "A discount is taken off, not added." }, { t: "$0.20p = 280$", fb: "That says the discount itself is \\$280." }],
            m: "p - 0.20p = 280", say: "One sentence, one equation." },
          { step: 4, ask: "Combine: $0.80p = 280$. What is $p$?", type: "num", pre: "$p =$", answer: 350, near: [{ v: 224, fb: "Divide 280 by 0.80. Don't multiply." }], hint: "$280 \\div 0.8$.",
            m: "p = 350", say: "Divide both sides by 0.80." },
          { step: 5, ask: "Check. 20% of \\$350 is \\$70. Does that fit the problem?", type: "choice", answer: 0,
            options: [{ t: "Yes: $350 - 70 = 280$" }, { t: "No", fb: "$350 - 70 = 280$, which is the sale price." }],
            m: "350 - 70 = 280", say: "The original price was \\$350. ✓" }],
        why: "Read, name, translate, solve, answer. Now a number problem on your own." },
      { type: "num", kicker: "On your own", prompt: "One number is **5 more than twice** another. Their sum is 41. Find the **smaller** number.",
        answer: 12, skill: "Number problems",
        near: [{ v: 29, fb: "That is the larger number, $2(12) + 5$. The question asks for the smaller." }, { v: 18, fb: "The two numbers are $n$ and $2n + 5$: $3n + 5 = 41$." }],
        hints: ["Call the smaller $n$. The other is $2n + 5$."], why: "$n + 2n + 5 = 41$, so $3n = 36$ and $n = 12$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A formula can be the equation. **Lena invested \\$4,000 for 3 years and earned \\$540 in simple interest. What was the rate?**",
        scene: { type: "walk", how: HOW_2_2, rows: [
          { step: 1, m: "I = Prt", say: "Simple interest: interest = principal × rate × time." },
          { step: 2, m: "r = \\text{the rate}", say: "The rate is the unknown. Everything else is given." },
          { step: 3, m: "540 = 4000 \\cdot r \\cdot 3", say: "Substitute $I = 540$, $P = 4000$ and $t = 3$." },
          { step: 4, m: "540 = 12000r", say: "Multiply 4000 by 3." },
          { step: 4, m: "r = 0.045", say: "Divide both sides by 12000." },
          { step: 5, m: "r = 4.5%", say: "As a percent, 4.5%. Check: $4000(0.045)(3) = 540$. ✓" }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "**Percent change** is the change divided by the **original** amount. A town grew from 12,500 people to 14,000. What was the percent increase?",
        post: "%", answer: 12, skill: "Percent problems",
        near: [{ v: 10.71, tol: 0.06, fb: "Divide the change by the **original** amount, 12,500, not the new one." }, { v: 0.12, tol: 1e-9, fb: "That is the decimal. As a percent it is 12." }, { v: 1500, fb: "That is the change. Divide it by 12,500." }],
        hints: ["The change is 1,500. Divide it by 12,500."], why: "$1500 \\div 12500 = 0.12 = 12%$." },
      { type: "choice", kicker: "Find the error",
        prompt: "“The sum of two consecutive **odd** integers is 56.” Kai writes $n + (n + 1) = 56$. What is wrong?",
        options: [{ t: "Consecutive odd integers are 2 apart: $n + (n + 2) = 56$." },
                  { t: "Nothing. The equation is right.", fb: "$n$ and $n + 1$ are next to each other, so one of them is even." },
                  { t: "It should be $n + 2n = 56$.", fb: "$2n$ doubles the number. The next odd integer is two more." }],
        answer: 0, skill: "Number problems", hints: ["Step 2: name each unknown carefully. What comes after 27 among the odd numbers?"],
        why: "$2n + 2 = 56$ gives $n = 27$: the integers are 27 and 29." },
      { type: "num", kicker: "Use it", prompt: "You put **\\$3,000** in an account that pays **4% simple interest** a year. How much interest does it earn in 5 years?",
        pre: "$\\$$", answer: 600, skill: "Simple interest",
        near: [{ v: 120, fb: "That is one year's interest. Multiply by the 5 years." }, { v: 60000, fb: "Write 4% as 0.04." }, { v: 3600, fb: "That is the balance. The question asks for the interest alone." }],
        hints: ["$I = Prt = 3000(0.04)(5)$."], why: "$3000 \\cdot 0.04 \\cdot 5 = 600$." }
    ]
  });

  /* ======================= 2.3 · Solve a formula for a specific variable */
  var HOW_2_3 = [["Target", "Choose the variable to solve for. Treat every other letter as a number."],
                 ["Undo", "Undo what is done to the target, one operation at a time, on both sides."],
                 ["Tidy", "Write the target alone on the left and simplify."]];
  LESSONS.push({
    title: "Solve a formula for a variable",
    blurb: "Book 2.3 · Rearranging formulas, and using them in geometry problems.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $3x + 5 = 20$.", pre: "$x =$", answer: 5, skill: "Solve a linear equation",
        near: [{ v: 15, fb: "$3x = 15$. Divide by 3." }], hints: ["Subtract 5, then divide by 3."], why: "$3x = 15$, so $x = 5$." },
      { type: "learn", kicker: "The idea",
        prompt: "A formula can be solved for any of its letters. Treat the letter you want as the variable and every other letter as a number. Then undo the operations exactly as you would with numbers.",
        scene: { type: "method", how: HOW_2_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the perimeter formula solved for $W$. $$P = 2L + 2W$$",
        scene: { type: "walk", how: HOW_2_3, rows: [
          { step: 1, m: "P = 2L + 2W", say: "The target is $W$. Treat $P$ and $L$ as numbers." },
          { step: 2, m: "P - 2L = 2W", say: "The term $2L$ has no $W$ in it. Subtract it from both sides.",
            ask: { prompt: "What has to be undone first?", answer: 0,
                   options: [{ t: "The $+\\,2L$: subtract $2L$ from both sides" }, { t: "The 2 on $W$: divide both sides by 2", fb: "That would have to divide every term. Undoing the addition first is simpler." }] } },
          { step: 2, m: "\\frac{P - 2L}{2} = W", say: "$W$ is multiplied by 2, so divide both sides by 2." },
          { step: 3, m: "W = \\frac{P - 2L}{2}", say: "Write the target on the left." }] },
        gate: true, then: "Exactly the moves that solve $20 = 6 + 2W$, with letters in place of the numbers." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. Solve $3x + 2y = 18$ for $y$.",
        how: HOW_2_3, skill: "Solve a formula",
        steps: [
          { step: 1, ask: "The target is $y$. Which term must move away from the left side?", type: "choice", answer: 0,
            options: [{ t: "$3x$" }, { t: "$2y$", fb: "$2y$ holds the target. It stays." }, { t: "$18$", fb: "18 is already on the other side." }],
            m: "3x + 2y = 18", say: "$3x$ has no $y$, so it goes." },
          { step: 2, ask: "Subtract $3x$ from both sides.", type: "choice", answer: 0,
            options: [{ t: "$2y = 18 - 3x$" }, { t: "$2y = 18 + 3x$", fb: "Subtracting $3x$ from the right gives $18 - 3x$." }, { t: "$2y = 15x$", fb: "18 and $3x$ are not like terms. They cannot be combined." }],
            m: "2y = 18 - 3x", say: "Only the term with the target is left on the left." },
          { step: 2, ask: "Divide both sides by 2.", type: "choice", answer: 0,
            options: [{ t: "$y = \\frac{18 - 3x}{2}$" }, { t: "$y = 18 - \\frac{3x}{2}$", fb: "Every term on the right is divided by 2, the 18 as well." }],
            m: "y = \\frac{18 - 3x}{2}", say: "The whole right side is divided by 2." },
          { step: 3, ask: "Tidy up: divide each term by 2.", type: "choice", answer: 0,
            options: [{ t: "$y = 9 - \\frac{3}{2}x$" }, { t: "$y = 9 - 3x$", fb: "$3x$ is divided by 2 as well." }],
            m: "y = 9 - \\frac{3}{2}x", say: "This form is ready to graph: you will use it in Unit 3." }],
        why: "Target, undo, tidy. Now one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Distance is rate times time: $d = rt$. Solve it for $t$, and type what $t$ equals.",
        answer: "d/r", shown: "d/r", skill: "Solve a formula",
        near: [{ v: "d*r", fb: "$t$ is multiplied by $r$. Undo that by dividing." }, { v: "r/d", fb: "Divide both sides by $r$: the $d$ stays on top." }, { v: "d-r", fb: "$r$ multiplies $t$. Subtracting does not undo a multiplication." }],
        keys: [["$d$", "d"], ["$r$", "r"], ["$\\div$", "/"]], placeholder: "Use d and r",
        hints: ["$t$ is multiplied by $r$. What undoes that?"], why: "Divide both sides by $r$: $t = \\frac{d}{r}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Here the target is inside parentheses. Solve for $F$. $$C = \\frac{5}{9}(F - 32)$$",
        scene: { type: "walk", how: HOW_2_3, rows: [
          { step: 1, m: "C = \\frac{5}{9}(F - 32)", say: "The target is $F$. The last thing done to it is the multiplying by $\\frac{5}{9}$, so undo that first." },
          { step: 2, m: "\\frac{9}{5}C = F - 32", say: "Multiply both sides by the reciprocal, $\\frac{9}{5}$." },
          { step: 2, m: "\\frac{9}{5}C + 32 = F", say: "Then add 32 to both sides." },
          { step: 3, m: "F = \\frac{9}{5}C + 32", say: "The formula that turns Celsius into Fahrenheit." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The perimeter of a rectangle is **58 cm**. Its length is **5 cm more than twice** its width. Find the width.",
        post: "cm", answer: 8, skill: "Geometry applications",
        near: [{ v: 21, fb: "That is the length. The question asks for the width." }, { v: 17.67, tol: 0.01, fb: "A perimeter has two lengths and two widths: $2(2w + 5) + 2w = 58$." }],
        hints: ["$P = 2L + 2W$ with $L = 2w + 5$."], why: "$2(2w + 5) + 2w = 58$ gives $6w + 10 = 58$, so $w = 8$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Noor solved $y = mx + b$ for $m$. Tap the line where the work **first** goes wrong.",
        lines: ["y = mx + b", "\\frac{y}{x} = m + b", "m = \\frac{y}{x} - b"], answer: 1, fix: "y - b = mx",
        fb: { 0: GIVEN, 2: LATER }, skill: "Solve a formula",
        hints: ["Dividing a side by $x$ divides every term on it."],
        why: "Dividing by $x$ must divide $b$ too. Subtract $b$ first: $m = \\frac{y - b}{x}$." },
      { type: "num", kicker: "Use it", prompt: "In a right triangle, $a^2 + b^2 = c^2$. A **13-foot** ladder leans on a wall with its foot **5 feet** from the wall. How high up the wall does it reach?",
        post: "feet", answer: 12, skill: "Geometry applications",
        near: [{ v: 8, fb: "The sides are squared before they are subtracted: $13^2 - 5^2$." }, { v: 144, fb: "That is $b^2$. Take the square root." }],
        hints: ["$5^2 + b^2 = 13^2$."], why: "$b^2 = 169 - 25 = 144$, so $b = 12$." }
    ]
  });
  /* ================= 2.4 · Solve mixture and uniform motion applications */
  var HOW_2_4 = [["Name", "Choose a variable for one unknown, and write the others in terms of it."],
                 ["Table", "Fill in a table: number · value = total value, or rate · time = distance."],
                 ["Equation", "Write the equation the table gives you."],
                 ["Solve", "Solve the equation."],
                 ["Answer", "Check, and answer the question that was asked."]];
  LESSONS.push({
    title: "Mixture and motion problems",
    blurb: "Book 2.4 · Coins, tickets, mixtures and trips: one table, one equation.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is the total value of **7 dimes** and **4 quarters**, in dollars?",
        pre: "$\\$$", answer: 1.7, tol: 1e-9, skill: "Total value",
        near: [{ v: 11, fb: "That is the number of coins. Multiply each count by the coin's value." }, { v: 170, fb: "That is in cents. In dollars it is 1.70." }],
        hints: ["$7(0.10) + 4(0.25)$."], why: "$0.70 + 1.00 = 1.70$." },
      { type: "learn", kicker: "The idea",
        prompt: "Coins, tickets, mixtures and trips share one pattern: **number · value = total value**, or **rate · time = distance**. Put the facts in a table, and the last column writes the equation.",
        scene: { type: "method", how: HOW_2_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a coin problem: **Maya has \\$3.30 in nickels and dimes, with 6 more dimes than nickels. How many of each?**",
        scene: { type: "walk", how: HOW_2_4, rows: [
          { step: 1, m: "n \\quad\\text{and}\\quad n + 6", say: "Let $n$ be the number of nickels. There are 6 more dimes: $n + 6$." },
          { step: 2, m: "0.05n \\quad\\text{and}\\quad 0.10(n + 6)", say: "Number times value: a nickel is worth \\$0.05 and a dime \\$0.10." },
          { step: 3, m: "0.05n + 0.10(n + 6) = 3.30", say: "The two values add up to the total, \\$3.30.",
            ask: { prompt: "What must the two values add up to?", answer: 0,
                   options: [{ t: "The total value, \\$3.30" }, { t: "The number of coins", fb: "The table multiplies number by value, so its last column is money." }] } },
          { step: 4, m: "0.15n + 0.60 = 3.30", say: "Distribute, then combine the $n$ terms." },
          { step: 4, m: "n = 18", say: "Subtract 0.60, then divide by 0.15." },
          { step: 5, m: "18 \\text{ nickels and } 24 \\text{ dimes}", say: "Check: \\$0.90 + \\$2.40 = \\$3.30. ✓" }] },
        gate: true, then: "Tickets and stamps work the same way: number times price." },
      { type: "guided", kicker: "Together",
        prompt: "Now a trip. **Two cyclists leave the same point in opposite directions, at 12 mph and 15 mph. After how many hours are they 81 miles apart?**",
        how: HOW_2_4, skill: "Uniform motion",
        steps: [
          { step: 1, ask: "What is the unknown?", type: "choice", answer: 0,
            options: [{ t: "The time $t$, the same for both riders" }, { t: "The speed of each rider", fb: "The speeds are given: 12 and 15 mph." }],
            m: "t = \\text{hours each has ridden}", say: "They start together, so they ride for the same time." },
          { step: 2, ask: "Rate · time = distance. How far does the 12 mph rider go?", type: "choice", answer: 0,
            options: [{ t: "$12t$" }, { t: "$12 + t$", fb: "Distance is rate **times** time." }, { t: "$\\frac{12}{t}$", fb: "Distance is rate **times** time." }],
            m: "12t \\quad\\text{and}\\quad 15t", say: "One distance for each rider." },
          { step: 3, ask: "They ride in opposite directions. Which equation fits?", type: "choice", answer: 0,
            options: [{ t: "$12t + 15t = 81$" }, { t: "$15t - 12t = 81$", fb: "Subtracting fits riders going the same way. In opposite directions the distances add." }, { t: "$12t = 15t$", fb: "That would say they cover equal distances." }],
            m: "12t + 15t = 81", say: "Their distances add up to the gap between them." },
          { step: 4, ask: "Solve $27t = 81$.", type: "num", pre: "$t =$", answer: 3, hint: "$81 \\div 27$.",
            m: "t = 3", say: "Divide both sides by 27." },
          { step: 5, ask: "Check. In 3 hours they ride 36 and 45 miles. How far apart is that?", type: "num", answer: 81, near: [{ v: 9, fb: "Opposite directions: the distances add." }], hint: "$36 + 45$.",
            m: "36 + 45 = 81", say: "They are 81 miles apart after 3 hours. ✓" }],
        why: "Name, table, equation, solve, answer. Now a ticket problem on your own." },
      { type: "num", kicker: "On your own", prompt: "A play sold **200 tickets**: adults at **\\$12** and children at **\\$8**, for **\\$2,160** in all. How many **adult** tickets were sold?",
        answer: 140, skill: "Value problems",
        near: [{ v: 60, fb: "That is the number of child tickets." }, { v: 108, fb: "Two prices are involved: $12a + 8(200 - a) = 2160$." }],
        hints: ["Adults: $a$. Children: $200 - a$. Then $12a + 8(200 - a) = 2160$."], why: "$4a + 1600 = 2160$, so $4a = 560$ and $a = 140$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A mixture: **how many liters of a 20% acid solution must be added to 6 liters of a 50% solution to make a 30% solution?**",
        scene: { type: "walk", how: HOW_2_4, rows: [
          { step: 1, m: "x \\quad\\text{and}\\quad x + 6", say: "Let $x$ be the liters of 20% solution. The mixture then has $x + 6$ liters." },
          { step: 2, m: "0.20x \\quad 0.50(6) \\quad 0.30(x + 6)", say: "Amount times strength gives the acid in each part and in the mixture." },
          { step: 3, m: "0.20x + 0.50(6) = 0.30(x + 6)", say: "The acid in the two parts equals the acid in the mixture." },
          { step: 4, m: "0.20x + 3 = 0.30x + 1.8", say: "Multiply out." },
          { step: 4, m: "x = 12", say: "Subtract $0.20x$ and 1.8: $1.2 = 0.10x$. Then divide by 0.10." },
          { step: 5, m: "2.4 + 3 = 5.4", say: "12 liters. Check: 30% of the 18 liters is 5.4 liters of acid. ✓" }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A car leaves town at **60 mph**. Half an hour later a second car follows at **75 mph**. How many hours does the **second** car take to catch up?",
        post: "hours", answer: 2, skill: "Uniform motion",
        near: [{ v: 2.5, fb: "That is the first car's time. The second car left half an hour later." }],
        hints: ["When it catches up, the distances are equal: $60(t + 0.5) = 75t$."], why: "$60t + 30 = 75t$, so $15t = 30$ and $t = 2$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "A cashier has **30 bills**, all \\$5s and \\$10s, worth **\\$210**. With $f$ for the number of fives, Eli writes this. Tap the line where the work **first** goes wrong.",
        lines: ["5f + 10(f - 30) = 210", "15f - 300 = 210", "f = 34"], answer: 0, fix: "5f + 10(30 - f) = 210",
        fb: { 1: LATER, 2: LATER }, skill: "Value problems",
        hints: ["If $f$ of the 30 bills are fives, how many are tens?"],
        why: "The tens number $30 - f$, not $f - 30$. Then $300 - 5f = 210$, so $f = 18$ fives and 12 tens." },
      { type: "num", kicker: "Use it", prompt: "A café blends beans costing **\\$8** a pound with beans costing **\\$12** a pound to make **20 pounds** worth **\\$9** a pound. How many pounds of the \\$8 beans does it use?",
        post: "pounds", answer: 15, skill: "Mixture problems",
        near: [{ v: 5, fb: "That is the \\$12 beans. The question asks for the \\$8 beans." }, { v: 10, fb: "Equal amounts would be worth \\$10 a pound. The blend is cheaper, so it has more of the \\$8 beans." }],
        hints: ["$8x + 12(20 - x) = 9(20)$."], why: "$240 - 4x = 180$, so $4x = 60$ and $x = 15$." }
    ]
  });

  /* ======================================= 2.5 · Solve linear inequalities */
  var HOW_2_5 = [["Simplify", "Simplify each side, as you would for an equation."],
                 ["Collect", "Collect the variables on one side and the constants on the other."],
                 ["Divide", "Divide or multiply to get the variable alone. A negative number reverses the inequality sign."],
                 ["Graph", "Graph the solution on a number line and write it in interval notation."]];
  LESSONS.push({
    title: "Solve linear inequalities",
    blurb: "Book 2.5 · Number-line graphs, interval notation, and the one rule that differs from equations.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which number is a solution of $x > 3$?",
        options: [{ t: "$3.5$" }, { t: "$3$", fb: "3 is not greater than 3." }, { t: "$-4$", fb: "$-4$ is far to the left of 3." }],
        answer: 0, skill: "Graph an inequality", hints: ["Greater than 3 means to the right of 3 on the number line."], why: "$3.5 > 3$. In fact every number to the right of 3 is a solution." },
      { type: "learn", kicker: "The idea",
        prompt: "An inequality is solved like an equation, with one new rule: **multiplying or dividing both sides by a negative number reverses the inequality sign**. The answer is a whole range of numbers: graph it, and write it as an interval.",
        scene: { type: "method", how: HOW_2_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$5 - 2(x + 1) < 9$$",
        scene: { type: "walk", how: HOW_2_5, rows: [
          { step: 1, m: "5 - 2(x + 1) < 9", say: "Simplify the left side first." },
          { step: 1, m: "3 - 2x < 9", say: "Distribute $-2$, then combine $5 - 2$." },
          { step: 2, m: "-2x < 6", say: "Subtract 3 from both sides. Adding or subtracting never changes the sign." },
          { step: 3, m: "x > -3", say: "Divide by $-2$. Dividing by a negative reverses the sign.",
            ask: { prompt: "Divide both sides of $-2x < 6$ by $-2$. What happens to the sign?", answer: 0,
                   options: [{ t: "It reverses: $x > -3$" }, { t: "It stays: $x < -3$", fb: "Test $x = 0$: $-2(0) < 6$ is true, and 0 is greater than $-3$. The sign must reverse." }] } },
          { step: 4, m: "(-3, \\infty)", say: "An open circle at $-3$, shaded to the right. A parenthesis means the endpoint is not included." }] },
        gate: true, then: "In interval notation a **parenthesis** leaves the endpoint out, a **bracket** includes it, and infinity always takes a parenthesis." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$3(x - 2) \\le 5x + 4$$",
        how: HOW_2_5, skill: "Solve a linear inequality",
        steps: [
          { step: 1, ask: "Distribute the 3.", type: "choice", answer: 0,
            options: [{ t: "$3x - 6 \\le 5x + 4$" }, { t: "$3x - 2 \\le 5x + 4$", fb: "The 3 multiplies the 2 as well." }],
            m: "3x - 6 \\le 5x + 4", say: "The left side is simplified." },
          { step: 2, ask: "Subtract $5x$ and add 6 on both sides.", type: "choice", answer: 0,
            options: [{ t: "$-2x \\le 10$" }, { t: "$8x \\le 10$", fb: "$3x - 5x = -2x$." }, { t: "$-2x \\le -2$", fb: "$4 + 6 = 10$." }],
            m: "-2x \\le 10", say: "Variables on the left, constants on the right. The sign has not changed." },
          { step: 3, ask: "Divide both sides by $-2$.", type: "choice", answer: 0,
            options: [{ t: "$x \\ge -5$" }, { t: "$x \\le -5$", fb: "Dividing by a negative number reverses the sign." }, { t: "$x \\ge 5$", fb: "$10 \\div (-2) = -5$." }],
            m: "x \\ge -5", say: "Negative divisor, so $\\le$ became $\\ge$." },
          { step: 4, ask: "Which interval is $x \\ge -5$?", type: "choice", answer: 0,
            options: [{ t: "$[-5, \\infty)$" }, { t: "$(-5, \\infty)$", fb: "$-5$ is included, so it takes a bracket." }, { t: "$(-\\infty, -5]$", fb: "That is $x \\le -5$: everything to the left." }],
            m: "[-5, \\infty)", say: "A filled circle at $-5$, shaded to the right." }],
        why: "Simplify, collect, divide, graph. Now solve one and graph it yourself." },
      { type: "numberline", kicker: "On your own", prompt: "Solve $2x + 7 > 1$ and graph the solution. Drag the endpoint, and tap it to switch between open and filled.",
        min: -8, max: 4, mode: "ray", variable: "x", ray: { at: 0, dir: "right", closed: true },
        answer: { at: -3, dir: "right", closed: false }, skill: "Graph an inequality",
        hints: ["Subtract 7, then divide by 2. Is the endpoint itself a solution?"],
        why: "$2x > -6$, so $x > -3$: an open circle at $-3$, shaded to the right." },
      { type: "learn", kicker: "A harder case",
        prompt: "A fraction, and variables on both sides. $$7 - \\frac{2}{3}x > 3x - 4$$",
        scene: { type: "walk", how: HOW_2_5, rows: [
          { step: 1, m: "7 - \\frac{2}{3}x > 3x - 4", say: "Clear the fraction: multiply every term by 3. A positive multiplier keeps the sign." },
          { step: 1, m: "21 - 2x > 9x - 12", say: "No fractions left." },
          { step: 2, m: "-11x > -33", say: "Subtract $9x$ and subtract 21 on both sides." },
          { step: 3, m: "x < 3", say: "Divide by $-11$: the sign reverses." },
          { step: 4, m: "(-\\infty, 3)", say: "An open circle at 3, shaded to the left." }] },
        gate: true },
      { type: "ineq", kicker: "Try it", prompt: "Translate and solve: **six more than twice a number $n$ is at most 20.** Type the solution.",
        answer: "n<=7", variable: "n", skill: "Translate an inequality",
        near: [{ v: "n<7", fb: "“At most 20” includes 20 itself: use $\\le$." }, { v: "n>=7", fb: "“At most” means that number or less." }, { v: "n<=13", fb: "$2n + 6 \\le 20$ gives $2n \\le 14$. Then halve it." }],
        keys: [["$n$", "n"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="]], placeholder: "n …",
        hints: ["$2n + 6 \\le 20$."], why: "$2n \\le 14$, so $n \\le 7$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Ivy solved $-4x - 3 > 9$. Tap the line where the work **first** goes wrong.",
        lines: ["-4x - 3 > 9", "-4x > 12", "x > -3"], answer: 2, fix: "x < -3",
        fb: { 0: GIVEN, 1: "Adding 3 to both sides is right, and adding never changes the sign." }, skill: "Solve a linear inequality",
        hints: ["Which step divides by a negative number?"],
        why: "Dividing by $-4$ reverses the sign: $x < -3$. Test $x = -4$: $16 - 3 > 9$ is true." },
      { type: "num", kicker: "Use it", prompt: "A taxi charges **\\$4** plus **\\$2.50** a mile. You have **\\$29**. What is the greatest number of whole miles you can ride?",
        post: "miles", answer: 10, skill: "Inequality applications",
        near: [{ v: 11, fb: "11 miles costs \\$31.50, more than you have." }, { v: 13, fb: "Subtract the \\$4 charge before you divide." }],
        hints: ["$4 + 2.5m \\le 29$."], why: "$2.5m \\le 25$, so $m \\le 10$." }
    ]
  });

  /* ===================================== 2.6 · Solve compound inequalities */
  var HOW_2_6 = [["Solve each", "Solve each inequality on its own."],
                 ["Graph each", "Graph the two solutions on number lines."],
                 ["Combine", "“And” keeps the numbers in both graphs. “Or” keeps the numbers in either one."],
                 ["Interval", "Write the result in interval notation."]];
  LESSONS.push({
    title: "Solve compound inequalities",
    blurb: "Book 2.6 · Two inequalities joined by “and” or by “or”.",
    mins: 12, v: 1,
    steps: [
      { type: "numberline", kicker: "Warm up", prompt: "Graph $x \\le 2$. Drag the endpoint, tap it to fill or empty it, and set the direction.",
        min: -6, max: 6, mode: "ray", variable: "x", ray: { at: 0, dir: "right", closed: false },
        answer: { at: 2, dir: "left", closed: true }, skill: "Graph an inequality",
        hints: ["2 is included, and the solutions are the numbers below it."], why: "A filled circle at 2, shaded to the left." },
      { type: "learn", kicker: "The idea",
        prompt: "A **compound inequality** joins two inequalities. With **and**, a number must make both true: the overlap of the two graphs. With **or**, one is enough: everything in either graph.",
        scene: { type: "method", how: HOW_2_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an “and”. $$2x + 1 \\ge -3 \\quad\\text{and}\\quad 3x - 4 < 5$$",
        scene: { type: "walk", how: HOW_2_6, rows: [
          { step: 1, m: "2x + 1 \\ge -3 \\quad\\text{and}\\quad 3x - 4 < 5", say: "Two inequalities. Solve each one separately." },
          { step: 1, m: "x \\ge -2 \\quad\\text{and}\\quad x < 3", say: "Subtract 1 and halve. Add 4 and divide by 3." },
          { step: 2, m: "[-2, \\infty) \\quad\\text{and}\\quad (-\\infty, 3)", say: "One graph runs right from $-2$. The other runs left from 3." },
          { step: 3, m: "-2 \\le x < 3", say: "“And” keeps only the overlap: the numbers between $-2$ and 3.",
            ask: { prompt: "Which numbers are in **both** graphs?", answer: 0,
                   options: [{ t: "From $-2$ up to 3" }, { t: "Every number", fb: "5 is in the first graph but not in the second." }, { t: "None", fb: "0 is in both: $0 \\ge -2$ and $0 < 3$." }] } },
          { step: 4, m: "[-2, 3)", say: "$-2$ is included and 3 is not." }] },
        gate: true, then: "An “and” often comes written as one chain: $-2 \\le x < 3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now an “or”. $$x - 4 > 1 \\quad\\text{or}\\quad 2x + 3 \\le -5$$",
        how: HOW_2_6, skill: "Compound inequalities",
        steps: [
          { step: 1, ask: "Solve $x - 4 > 1$.", type: "num", pre: "$x >$", answer: 5, near: [{ v: -3, fb: "Add 4 to both sides." }], hint: "Add 4 to both sides.",
            m: "x > 5", say: "The first inequality." },
          { step: 1, ask: "Solve $2x + 3 \\le -5$.", type: "num", pre: "$x \\le$", answer: -4, near: [{ v: -1, fb: "Subtract 3 first: $2x \\le -8$." }], hint: "Subtract 3, then divide by 2.",
            m: "x \\le -4", say: "The second inequality." },
          { step: 2, ask: "One graph runs left from $-4$, the other right from 5. Do they overlap?", type: "choice", answer: 0,
            options: [{ t: "No: there is a gap between $-4$ and 5" }, { t: "Yes", fb: "No number is both at most $-4$ and greater than 5." }],
            m: "(-\\infty, -4] \\quad (5, \\infty)", say: "Two separate pieces." },
          { step: 3, ask: "The word is “or”. Which numbers are solutions?", type: "choice", answer: 0,
            options: [{ t: "Every number in either graph" }, { t: "None, because the graphs don't overlap", fb: "That would be “and”. For “or”, one true inequality is enough." }],
            m: "x \\le -4 \\quad\\text{or}\\quad x > 5", say: "Both pieces are kept." },
          { step: 4, ask: "Write it in interval notation.", type: "choice", answer: 0,
            options: [{ t: "$(-\\infty, -4] \\cup (5, \\infty)$" }, { t: "$[-4, 5)$", fb: "That is the gap: the numbers that are **not** solutions." }],
            m: "(-\\infty, -4] \\cup (5, \\infty)", say: "The symbol $\\cup$ means union: one set or the other." }],
        why: "Solve each, graph each, combine, interval. Now graph an “and” yourself." },
      { type: "numberline", kicker: "On your own", prompt: "Solve $-4 < 2x \\le 6$ and graph it. Drag each end, and tap an end to switch it between open and filled.",
        min: -6, max: 6, mode: "seg", variable: "x", seg: { a: -1, b: 1, ca: true, cb: true },
        answer: { a: -2, b: 3, ca: false, cb: true }, skill: "Compound inequalities",
        hints: ["Divide all three parts by 2. Which end is included?"],
        why: "$-2 < x \\le 3$: open at $-2$, filled at 3." },
      { type: "learn", kicker: "A harder case",
        prompt: "A chain can be solved in one go: do the same thing to all three parts. $$-5 \\le 3 - 2x < 7$$",
        scene: { type: "walk", how: HOW_2_6, rows: [
          { step: 1, m: "-5 \\le 3 - 2x < 7", say: "A chain is an “and”. Work on all three parts at once." },
          { step: 1, m: "-8 \\le -2x < 4", say: "Subtract 3 from all three parts." },
          { step: 1, m: "4 \\ge x > -2", say: "Divide all three parts by $-2$. Both signs reverse." },
          { step: 3, m: "-2 < x \\le 4", say: "Rewrite it with the smaller number on the left." },
          { step: 4, m: "(-2, 4]", say: "Open at $-2$, included at 4." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Solve: $x < -1$ **and** $x > 4$.",
        options: [{ t: "No solution" }, { t: "All real numbers", fb: "0 makes neither inequality true." }, { t: "$-1 < x < 4$", fb: "Those are the numbers that make **neither** one true." }],
        answer: 0, skill: "Compound inequalities", hints: ["Can one number be below $-1$ and above 4 at once?"], why: "The two graphs do not overlap, so no number makes both true." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rui solves “$x > 2$ **or** $x > 6$” and answers $x > 6$. What is wrong?",
        options: [{ t: "“Or” keeps every number in either graph: the answer is $x > 2$." },
                  { t: "Nothing. $x > 6$ is right.", fb: "$x = 4$ makes $x > 2$ true, so it is a solution, and Rui left it out." },
                  { t: "There is no solution.", fb: "$x = 10$ makes both true." }],
        answer: 0, skill: "Compound inequalities", hints: ["Is $x = 4$ a solution?"], why: "$x > 6$ would be the answer for “and”. For “or” it is $x > 2$." },
      { type: "choice", kicker: "Use it", prompt: "To earn a B, the average of two tests must be **at least 80 and less than 90**. You scored 76 on the first. Which scores $s$ on the second give a B?",
        options: [{ t: "$84 \\le s < 104$" }, { t: "$80 \\le s < 90$", fb: "That is the range for the average, not for the second test." }, { t: "$4 \\le s < 14$", fb: "Multiply all three parts by 2 before you subtract 76." }],
        answer: 0, skill: "Compound inequalities", hints: ["$80 \\le \\frac{76 + s}{2} < 90$."], why: "Multiply by 2: $160 \\le 76 + s < 180$. Subtract 76: $84 \\le s < 104$." }
    ]
  });

  /* ================================ 2.7 · Solve absolute value inequalities */
  var HOW_2_7 = [["Isolate", "Get the absolute value expression alone on one side."],
                 ["Rewrite", "Write it without bars: “=” gives two equations, “<” gives an *and*, “>” gives an *or*."],
                 ["Solve", "Solve the equations or the compound inequality."],
                 ["Check", "Check the solutions, and graph an inequality's solution."]];
  LESSONS.push({
    title: "Absolute value equations and inequalities",
    blurb: "Book 2.7 · Absolute value as distance: equal to, less than, greater than.",
    mins: 12, v: 1,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "Which numbers are exactly **5 units from 0** on the number line? Give both.",
        answer: [-5, 5], skill: "Absolute value", placeholder: "e.g. −3, 3",
        hints: ["One is to the right of 0, one to the left."], why: "$5$ and $-5$: both have absolute value 5." },
      { type: "learn", kicker: "The idea",
        prompt: "$|x|$ is the distance from 0. So $|x| = 5$ means 5 away: two numbers. $|x| < 5$ means closer than 5: the numbers in between. $|x| > 5$ means further than 5: the two outer parts.",
        scene: { type: "method", how: HOW_2_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an equation solved. $$|2x - 1| + 3 = 10$$",
        scene: { type: "walk", how: HOW_2_7, rows: [
          { step: 1, m: "|2x - 1| + 3 = 10", say: "Isolate the absolute value first." },
          { step: 1, m: "|2x - 1| = 7", say: "Subtract 3 from both sides." },
          { step: 2, m: "2x - 1 = -7 \\quad\\text{or}\\quad 2x - 1 = 7", say: "The expression inside the bars is 7 units from 0, so it is $-7$ or 7.",
            ask: { prompt: "$|u| = 7$. What can $u$ be?", answer: 0,
                   options: [{ t: "$-7$ or $7$" }, { t: "Only $7$", fb: "$-7$ is also 7 units from 0." }, { t: "Any number from $-7$ to 7", fb: "That is $|u| \\le 7$. Equal to 7 means exactly 7 away." }] } },
          { step: 3, m: "x = -3 \\quad\\text{or}\\quad x = 4", say: "In each equation, add 1 and then divide by 2." },
          { step: 4, m: "|-7| = 7 \\quad |7| = 7", say: "$2(-3) - 1 = -7$ and $2(4) - 1 = 7$. Both check. ✓" }] },
        gate: true, then: "One absolute value equation, two ordinary equations." },
      { type: "guided", kicker: "Together",
        prompt: "Now a “less than”. $$2|x - 4| \\le 6$$",
        how: HOW_2_7, skill: "Absolute value inequalities",
        steps: [
          { step: 1, ask: "Isolate the absolute value: divide both sides by 2.", type: "choice", answer: 0,
            options: [{ t: "$|x - 4| \\le 3$" }, { t: "$|x - 4| \\le 12$", fb: "Divide 6 by 2. Don't multiply." }],
            m: "|x - 4| \\le 3", say: "Dividing by a positive number keeps the sign." },
          { step: 2, ask: "The inside is within 3 units of 0. Rewrite it without bars.", type: "choice", answer: 0,
            options: [{ t: "$-3 \\le x - 4 \\le 3$" }, { t: "$x - 4 \\le -3$ or $x - 4 \\ge 3$", fb: "That is the “greater than” pattern: further than 3 from 0." }, { t: "$x - 4 \\le 3$", fb: "That would allow $x - 4 = -50$, which is far more than 3 from 0." }],
            m: "-3 \\le x - 4 \\le 3", say: "“Less than” becomes an “and”: a chain." },
          { step: 3, ask: "Add 4 to all three parts.", type: "choice", answer: 0,
            options: [{ t: "$1 \\le x \\le 7$" }, { t: "$-7 \\le x \\le -1$", fb: "Add 4. Don't subtract it." }],
            m: "1 \\le x \\le 7", say: "Every $x$ within 3 units of 4." },
          { step: 4, ask: "Which interval is that?", type: "choice", answer: 0,
            options: [{ t: "$[1, 7]$" }, { t: "$(1, 7)$", fb: "$\\le$ includes both ends: brackets." }],
            m: "[1, 7]", say: "Filled circles at 1 and 7, shaded between." }],
        why: "Isolate, rewrite, solve, check. Now graph a “greater than” yourself." },
      { type: "numberline", kicker: "On your own", prompt: "Graph the solution of $|x| > 2$: every number **more than 2 units** from 0. Drag the two ends, and tap an end to switch open and filled.",
        min: -6, max: 6, mode: "seg", variable: "x", seg: { a: -1, b: 1, ca: true, cb: true, outside: true },
        answer: { a: -2, b: 2, ca: false, cb: false }, skill: "Absolute value inequalities",
        hints: ["The solutions are the two outer parts. Are $-2$ and 2 themselves included?"],
        why: "$x < -2$ or $x > 2$: open circles at $-2$ and 2, shaded outward." },
      { type: "numbers", prompt: "Solve $|x + 2| = 6$. Give both solutions.",
        answer: [-8, 4], skill: "Absolute value equations", placeholder: "e.g. −3, 3",
        hints: ["$x + 2 = 6$ or $x + 2 = -6$."], why: "$x = 4$ or $x = -8$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A “greater than”, with the absolute value not yet alone. $$|3x + 2| - 4 \\ge 3$$",
        scene: { type: "walk", how: HOW_2_7, rows: [
          { step: 1, m: "|3x + 2| - 4 \\ge 3", say: "Isolate the absolute value." },
          { step: 1, m: "|3x + 2| \\ge 7", say: "Add 4 to both sides." },
          { step: 2, m: "3x + 2 \\le -7 \\quad\\text{or}\\quad 3x + 2 \\ge 7", say: "“Greater than” becomes an “or”: the inside is 7 or more from 0, on either side." },
          { step: 3, m: "x \\le -3 \\quad\\text{or}\\quad x \\ge \\frac{5}{3}", say: "Subtract 2, then divide by 3, in each one." },
          { step: 4, m: "(-\\infty, -3] \\cup [\\frac{5}{3}, \\infty)", say: "Two rays pointing outward, with both endpoints included." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Solve $|x - 1| = -4$.",
        options: [{ t: "No solution" }, { t: "$x = -3$ or $x = 5$", fb: "Those solve $|x - 1| = 4$. An absolute value can never equal $-4$." }, { t: "$x = -3$", fb: "$|-3 - 1| = 4$, not $-4$." }],
        answer: 0, skill: "Absolute value equations", hints: ["Can a distance be negative?"], why: "An absolute value is a distance, so it is never negative. No solution." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Omar solved $|x + 3| > 5$. Tap the line where the work **first** goes wrong.",
        lines: ["|x + 3| > 5", "-5 < x + 3 < 5", "-8 < x < 2"], answer: 1, fix: "x + 3 < -5 \\quad\\text{or}\\quad x + 3 > 5",
        fb: { 0: GIVEN, 2: LATER }, skill: "Absolute value inequalities",
        hints: ["“Greater than” means further from 0. Is that an “and” or an “or”?"],
        why: "“Greater than” is an “or”: $x + 3 < -5$ or $x + 3 > 5$, so $x < -8$ or $x > 2$." },
      { type: "num", kicker: "Use it", prompt: "A machine cuts rods **60 mm** long with a tolerance of **0.5 mm**: an acceptable length $x$ satisfies $|x - 60| \\le 0.5$. What is the **shortest** acceptable rod?",
        post: "mm", answer: 59.5, tol: 1e-9, skill: "Absolute value inequalities",
        near: [{ v: 60.5, tol: 1e-9, fb: "That is the longest acceptable rod." }, { v: 0.5, tol: 1e-9, fb: "That is the tolerance. The length is within 0.5 of 60." }],
        hints: ["$-0.5 \\le x - 60 \\le 0.5$."], why: "$59.5 \\le x \\le 60.5$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "a2u2-solve", title: "Solve a linear equation", lesson: 2,
      gen: function (R) {
        var x0 = R.nz(-8, 9), a = R.int(3, 7), b = R.nz(-6, 6), c = R.int(1, a - 1), d = a * (x0 + b) - c * x0;
        var tex = a + "(" + poly([[1, "x"], [b, ""]]) + ") = " + poly([[c, "x"], [d, ""]], { keepZero: false });
        return { type: "num", prompt: "Solve. $$" + tex + "$$", pre: "$x =$", answer: x0,
          near: near(x0, [{ v: (d - b) / (a - c), tol: 1e-9, fb: "Distribute first: the " + a + " multiplies the " + Math.abs(b) + " as well." }, { v: -x0, fb: "Check the signs when you move terms across." }]),
          hints: ["Distribute, collect the $x$ terms on the left, then the numbers on the right."],
          why: "$" + poly([[a, "x"], [a * b, ""]]) + " = " + poly([[c, "x"], [d, ""]]) + "$, so $" + poly([[a - c, "x"]]) + " = " + (d - a * b) + "$ and $x = " + x0 + "$." };
      } },
    { id: "a2u2-percent", title: "Solve percent problems", lesson: 3,
      gen: function (R) {
        var kind = R.int(0, 2), p = R.pick([10, 15, 20, 25, 30, 40]), base = R.pick([40, 60, 80, 120, 200, 240, 360]);
        if (kind === 0) {
          var part = p * base / 100;
          return { type: "num", prompt: "$" + part + "$ is what percent of $" + base + "$?", post: "%", answer: p,
            near: near(p, [{ v: p / 100, tol: 1e-9, fb: "That is the decimal. As a percent it is " + p + "." }]),
            hints: ["Divide the part by the whole, then write it as a percent."], why: "$" + part + " \\div " + base + " = " + num(p / 100) + " = " + p + "%$." };
        }
        if (kind === 1) {
          var sale = base * (100 - p) / 100;
          return { type: "num", prompt: "After a " + p + "% discount, a jacket costs \\$" + num(sale) + ". What was the original price?", pre: "$\\$$", answer: base,
            near: near(base, [{ v: sale * (100 + p) / 100, tol: 0.01, fb: "The discount was taken from the original price, so divide: $" + num(sale) + " \\div " + num((100 - p) / 100) + "$." }]),
            hints: ["If $p$ is the original price, then $" + num((100 - p) / 100) + "p = " + num(sale) + "$."], why: "$" + num(sale) + " \\div " + num((100 - p) / 100) + " = " + base + "$." };
        }
        var now = base * (100 + p) / 100;
        return { type: "num", prompt: "A price rose from \\$" + base + " to \\$" + num(now) + ". What was the percent increase?", post: "%", answer: p,
          near: near(p, [{ v: Math.round((now - base) / now * 1000) / 10, tol: 0.06, fb: "Divide the change by the **original** amount, " + base + "." }]),
          hints: ["Change divided by the original amount."], why: "$" + num(now - base) + " \\div " + base + " = " + num(p / 100) + " = " + p + "%$." };
      } },
    { id: "a2u2-formula", title: "Solve a formula for a variable", lesson: 4,
      gen: function (R) {
        var P = R.pick([
          ["A = lw", "w", "w = \\frac{A}{l}", [["w = Al", "$w$ is multiplied by $l$. Undo that by dividing."], ["w = A - l", "$l$ multiplies $w$. Subtracting does not undo a multiplication."]]],
          ["P = 2L + 2W", "L", "L = \\frac{P - 2W}{2}", [["L = \\frac{P}{2} - 2W", "Dividing by 2 divides every term, the $2W$ as well."], ["L = P - 2W", "That is $2L$. Divide by 2."]]],
          ["y = mx + b", "x", "x = \\frac{y - b}{m}", [["x = \\frac{y}{m} - b", "Subtract $b$ first. Then the whole of $y - b$ is divided by $m$."], ["x = \\frac{y + b}{m}", "Undo the $+\\,b$ by subtracting $b$."]]],
          ["V = \\frac{1}{3}Bh", "h", "h = \\frac{3V}{B}", [["h = \\frac{V}{3B}", "Multiply by 3 to clear the fraction, then divide by $B$."], ["h = 3VB", "$h$ is multiplied by $B$. Divide to undo it."]]],
          ["I = Prt", "r", "r = \\frac{I}{Pt}", [["r = IPt", "$r$ is multiplied by $P$ and $t$. Divide by both."], ["r = \\frac{I}{P} - t", "$t$ multiplies $r$. It is undone by dividing."]]],
          ["2x + 5y = 20", "y", "y = \\frac{20 - 2x}{5}", [["y = 20 - 2x", "That is $5y$. Divide by 5."], ["y = \\frac{20 + 2x}{5}", "Subtract $2x$ from both sides: $20 - 2x$."]]],
          ["A = \\frac{1}{2}bh", "b", "b = \\frac{2A}{h}", [["b = \\frac{A}{2h}", "Multiply both sides by 2 to clear the $\\frac{1}{2}$."], ["b = 2Ah", "$b$ is multiplied by $h$. Divide to undo it."]]]]);
        return mc(R, { prompt: "Solve $" + P[0] + "$ for $" + P[1] + "$.", right: "$" + P[2] + "$",
          wrong: P[3].map(function (w) { return { t: "$" + w[0] + "$", fb: w[1] }; }),
          hints: ["Treat every other letter as a number, and undo what is done to $" + P[1] + "$."], why: "$" + P[2] + "$." });
      } },
    { id: "a2u2-motion", title: "Solve a uniform motion problem", lesson: 5,
      gen: function (R) {
        var r1 = R.pick([40, 45, 50, 55, 60]), r2 = r1 + R.pick([5, 10, 15, 20]), t = R.pick([2, 3, 4, 5]), opp = R.chance(0.5);
        var gap = opp ? (r1 + r2) * t : (r2 - r1) * t;
        return { type: "num", prompt: "Two trains leave the same station at the same time, travelling in " + (opp ? "**opposite directions**" : "the **same direction**") + " at " + r1 + " mph and " + r2 + " mph. After how many hours are they " + gap + " miles apart?",
          post: "hours", answer: t,
          near: near(t, [{ v: opp ? gap / (r2 - r1) : gap / (r1 + r2), tol: 1e-9, fb: opp ? "In opposite directions the distances **add**: $" + r1 + "t + " + r2 + "t$." : "In the same direction the gap is the **difference**: $" + r2 + "t - " + r1 + "t$." }]),
          hints: [opp ? "$" + r1 + "t + " + r2 + "t = " + gap + "$." : "$" + r2 + "t - " + r1 + "t = " + gap + "$."],
          why: "$" + (opp ? r1 + r2 : r2 - r1) + "t = " + gap + "$, so $t = " + t + "$." };
      } },
    { id: "a2u2-inequality", title: "Solve a linear inequality", lesson: 6,
      gen: function (R) {
        var a = -R.int(2, 6), k = R.nz(-6, 6), b = R.nz(-9, 9), c = a * k + b, sym = R.pick(["<", ">", "\\le", "\\ge"]);
        var flip = { "<": ">", ">": "<", "\\le": "\\ge", "\\ge": "\\le" }[sym];
        return mc(R, { prompt: "Solve. $$" + poly([[a, "x"], [b, ""]]) + " " + sym + " " + c + "$$", right: "$x " + flip + " " + k + "$",
          wrong: [{ t: "$x " + sym + " " + k + "$", fb: "Dividing by a negative number reverses the inequality sign." },
                  { t: "$x " + flip + " " + (-k) + "$", fb: "$" + (c - b) + " \\div " + a + " = " + k + "$." }],
          hints: ["Subtract " + (b < 0 ? "$-" + Math.abs(b) + "$" : b) + " from both sides, then divide by $" + a + "$."],
          why: "$" + a + "x " + sym + " " + (c - b) + "$. Dividing by $" + a + "$ reverses the sign: $x " + flip + " " + k + "$." });
      } },
    { id: "a2u2-compound", title: "Solve a compound inequality", lesson: 7,
      gen: function (R) {
        var m = R.int(2, 4), lo = R.int(-5, 1), hi = lo + R.int(2, 6), b = R.nz(-6, 6), A = m * lo + b, C = m * hi + b;
        return mc(R, { prompt: "Solve. $$" + A + " < " + poly([[m, "x"], [b, ""]]) + " \\le " + C + "$$", right: "$" + lo + " < x \\le " + hi + "$",
          wrong: [{ t: "$" + (A - b) + " < x \\le " + (C - b) + "$", fb: "After subtracting, divide all three parts by " + m + "." },
                  { t: "$" + lo + " \\le x < " + hi + "$", fb: "Each sign stays where it was: $<$ on the left, $\\le$ on the right." }],
          hints: ["Do the same thing to all three parts: undo the " + (b < 0 ? "$-" + Math.abs(b) + "$" : "$+" + b + "$") + ", then divide by " + m + "."],
          why: "$" + (A - b) + " < " + m + "x \\le " + (C - b) + "$, then divide by " + m + "." });
      } },
    { id: "a2u2-abs", title: "Solve an absolute value equation", lesson: 8,
      gen: function (R) {
        var b = R.nz(-7, 7), c = R.int(1, 9), k = R.int(0, 5);
        return { type: "numbers", prompt: "Solve. Give every solution. $$|" + poly([[1, "x"], [b, ""]]) + "|" + (k ? " + " + k : "") + " = " + (c + k) + "$$", answer: [-c - b, c - b], placeholder: "e.g. −3, 3",
          hints: [(k ? "Subtract " + k + " first. Then $" : "$") + poly([[1, "x"], [b, ""]]) + " = " + c + "$ or $" + poly([[1, "x"], [b, ""]]) + " = -" + c + "$."],
          why: "$" + poly([[1, "x"], [b, ""]]) + " = " + c + "$ gives $x = " + (c - b) + "$, and $" + poly([[1, "x"], [b, ""]]) + " = -" + c + "$ gives $x = " + (-c - b) + "$." };
      } }
  ];
  L.unit("alg2", 2, {
    title: "Solving Linear Equations",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Linear equations, percent problems, formulas and motion problems.",
        skills: ["a2u2-solve", "a2u2-percent", "a2u2-formula", "a2u2-motion"], per: 2 },
      { title: "Quiz 2", after: 8, blurb: "Linear, compound and absolute value inequalities.",
        skills: ["a2u2-inequality", "a2u2-compound", "a2u2-abs"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:2", {
    2: { name: "General strategy", frame: "First [[simplify]] each side. Collect the [[variable]] terms on one side and the [[constant]] terms on the other. Then make the [[coefficient]] of the variable 1, and check.",
         chips: ["exponent", "graph"] },
    3: { name: "Problem solving strategy", frame: "[[Read]] the problem, [[name]] the unknown with a variable, [[translate]] one sentence into an equation, solve it, and [[check]] that the answer makes sense.",
         chips: ["guess", "graph"], fb: { "guess": "A guess is not a method. Name the unknown, then translate." } },
    4: { name: "Solving a formula", frame: "To solve a formula for one variable, treat every other letter as a [[number]]. [[Undo]] each operation on [[both sides]] until the variable is alone.",
         chips: ["variable", "one side"], fb: { "one side": "Whatever is done to one side must be done to the other." } },
    5: { name: "Value and motion tables", frame: "In coin, ticket and mixture problems, [[number]] · value = total value. In motion problems, rate · [[time]] = [[distance]]. The table's last column gives the [[equation]].",
         chips: ["speed", "answer"] },
    6: { name: "Solving inequalities", frame: "Solve an inequality like an equation, but [[reverse]] the sign when you multiply or divide by a [[negative]] number. In interval notation a [[parenthesis]] leaves the endpoint out and a [[bracket]] includes it.",
         chips: ["positive", "keep"], fb: { "positive": "A positive multiplier leaves the sign alone. Only a negative one reverses it." } },
    7: { name: "Compound inequalities", frame: "“And” keeps the numbers in [[both]] solutions: the [[overlap]]. “Or” keeps the numbers in [[either]] one, written with the [[union]] symbol.",
         chips: ["neither", "gap"] },
    8: { name: "Absolute value", frame: "First [[isolate]] the absolute value. $|u| = a$ gives [[two]] equations. $|u| < a$ puts $u$ [[between]] $-a$ and $a$. $|u| > a$ puts $u$ [[outside]] them.",
         chips: ["one", "equal to"], fb: { "one": "Two numbers are $a$ units from 0: $a$ and $-a$." } }
  });
})();
