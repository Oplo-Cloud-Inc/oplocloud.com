/* ==========================================================================
   Algebra II — Unit 12: Sequences, Series and Binomial Theorem. See
   lab/core.js for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 12, section for section:
   the readiness check, then 12.1 to 12.4. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   What a sequence and a series are (12.1), sequences that add the same
   amount (12.2), sequences that multiply by the same amount (12.3), and the
   pattern in the powers of a binomial (12.4).

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Five lessons, five skills, two quizzes, and the unit test.
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
  // The maths renderer drops a bare "!" and has no sigma, so both are written as text.
  var FACT = "\\text{!}", SIG = "\\text{Σ}";

  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Chapter 12 Be Prepared · Evaluate a rule, spot a pattern, and square a binomial.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Evaluate", prompt: "Evaluate $3n - 1$ when $n = 4$.", answer: 11, skill: "Evaluate an expression",
        near: [{ v: 33, fb: "$3n$ means 3 times $n$: $3 \\cdot 4 = 12$, then subtract 1." }], hints: ["$3(4) - 1$."], why: "$12 - 1 = 11$." },
      { type: "num", prompt: "What is $2^5$?", answer: 32, skill: "Evaluate powers",
        near: [{ v: 10, fb: "$2^5$ is five 2s multiplied." }], hints: ["2, 4, 8, 16, …"], why: "$32$." },
      { type: "num", kicker: "Check 2 · Patterns", prompt: "What comes next? $$5, \\; 9, \\; 13, \\; 17, \\; \\ldots$$", answer: 21, skill: "Number patterns",
        near: [{ v: 20, fb: "Each term is 4 more than the one before." }], hints: ["What is added each time?"], why: "Add 4 each time: $17 + 4 = 21$." },
      { type: "num", prompt: "What comes next? $$3, \\; 6, \\; 12, \\; 24, \\; \\ldots$$", answer: 48, skill: "Number patterns",
        near: [{ v: 36, fb: "The terms are doubling, not growing by 12." }], hints: ["What is each term multiplied by?"], why: "Double each time: $24 \\cdot 2 = 48$." },
      { type: "choice", kicker: "Check 3 · Binomials", prompt: "Expand $(x + 1)^2$.",
        options: [{ t: "$x^2 + 2x + 1$" }, { t: "$x^2 + 1$", fb: "There is a middle term: $x + x$." }],
        answer: 0, skill: "Special products", hints: ["$(x + 1)(x + 1)$."], why: "$x^2 + x + x + 1$." },
      { type: "num", prompt: "What is $4 \\cdot 3 \\cdot 2 \\cdot 1$?", answer: 24, skill: "Whole-number arithmetic",
        near: [{ v: 10, fb: "That is the sum. This is a product." }], hints: ["$12 \\cdot 2$."], why: "$12 \\cdot 2 \\cdot 1 = 24$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 12.1**. If **check 1** slipped, see lesson 3.5: a sequence is a function. If **check 3** slipped, see lesson 5.3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================================= 12.1 · Sequences */
  var HOW_12_1 = [["n = 1", "Substitute $n = 1$ into the general term for the first term."],
                  ["Next", "Substitute $n = 2$, 3, 4 and so on for the terms that follow."],
                  ["List", "Write the terms in order, separated by commas."]];
  var HOW_12_1S = [["Index", "Read the index: it starts at the number below " + "Σ" + " and stops at the number above."],
                   ["Terms", "Substitute each value of the index into the rule."],
                   ["Add", "Add the terms."]];
  LESSONS.push({
    title: "Sequences",
    blurb: "Book 12.1 · Terms and general terms, factorials, partial sums and summation notation.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "For $f(n) = 3n - 1$, find $f(4)$.", pre: "$f(4) =$", answer: 11, skill: "Evaluate a function",
        near: [{ v: 33, fb: "$3 \\cdot 4 = 12$, then subtract 1." }], hints: ["$3(4) - 1$."], why: "$12 - 1 = 11$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **sequence** is a function whose inputs are the counting numbers 1, 2, 3, and so on. Its outputs are the **terms** $a_1, a_2, a_3, \\ldots$, and a formula for $a_n$ is called the **general term**.",
        scene: { type: "method", how: HOW_12_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the first four terms of $a_n = n^2 - 1$ written out.",
        scene: { type: "walk", how: HOW_12_1, rows: [
          { step: 1, m: "a_n = n^2 - 1", say: "The general term: a rule for every term at once." },
          { step: 1, m: "a_1 = 1^2 - 1 = 0", say: "Put 1 in place of $n$." },
          { step: 2, m: "a_2 = 2^2 - 1 = 3", say: "Then 2.",
            ask: { prompt: "What is $a_2 = 2^2 - 1$?", answer: 0,
                   options: [{ t: "3" }, { t: "1", fb: "$2^2 = 4$, then subtract 1." }, { t: "4", fb: "Subtract the 1." }] } },
          { step: 2, m: "a_3 = 3^2 - 1 = 8 \\quad a_4 = 4^2 - 1 = 15", say: "Then 3 and 4." },
          { step: 3, m: "0, \\; 3, \\; 8, \\; 15, \\; \\ldots", say: "The sequence. The dots say it carries on." }] },
        gate: true, then: "$a_4$ is read “$a$ sub 4”: the fourth term. The small number is a position, not an exponent." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write the first terms of $a_n = (-1)^n \\cdot 2n$.",
        how: HOW_12_1, skill: "Terms of a sequence",
        steps: [
          { step: 1, ask: "$a_1 = (-1)^1 \\cdot 2(1)$. What is it?", type: "num", answer: -2, near: [{ v: 2, fb: "$(-1)^1 = -1$." }], hint: "$-1 \\cdot 2$.",
            m: "a_1 = -2", say: "An odd power of $-1$ is $-1$." },
          { step: 2, ask: "$a_2 = (-1)^2 \\cdot 2(2)$. What is it?", type: "num", answer: 4, near: [{ v: -4, fb: "$(-1)^2 = +1$." }], hint: "$1 \\cdot 4$.",
            m: "a_2 = 4", say: "An even power of $-1$ is 1." },
          { step: 2, ask: "And $a_3 = (-1)^3 \\cdot 2(3)$?", type: "num", answer: -6, near: [{ v: 6, fb: "$(-1)^3 = -1$." }], hint: "$-1 \\cdot 6$.",
            m: "a_3 = -6", say: "Negative again." },
          { step: 3, ask: "Which list is the sequence?", type: "choice", answer: 0,
            options: [{ t: "$-2, \\; 4, \\; -6, \\; 8, \\; \\ldots$" }, { t: "$2, \\; 4, \\; 6, \\; 8, \\; \\ldots$", fb: "The factor $(-1)^n$ makes the signs alternate." }],
            m: "-2, \\; 4, \\; -6, \\; 8, \\; \\ldots", say: "The factor $(-1)^n$ makes the signs alternate." }],
        why: "$n = 1$, the next ones, list. Now fill in a sequence yourself." },
      { type: "table", kicker: "On your own", prompt: "Fill in the terms of $a_n = 3n - 2$.",
        head: ["$n$", "$a_n$"], rows: [[1, 1], [2, null], [3, null], [4, null]],
        answers: [[1, 1, 4], [2, 1, 7], [3, 1, 10]], skill: "Terms of a sequence",
        hints: ["Multiply $n$ by 3, then subtract 2."], why: "$3(2) - 2 = 4$, $3(3) - 2 = 7$, $3(4) - 2 = 10$." },
      { type: "choice", prompt: "Going the other way: which general term gives $4, 8, 12, 16, \\ldots$?",
        options: [{ t: "$a_n = 4n$" }, { t: "$a_n = n + 4$", fb: "That gives 5, 6, 7, 8." }, { t: "$a_n = 4^n$", fb: "That gives 4, 16, 64." }],
        answer: 0, skill: "General term", hints: ["Compare each term with its position: 1, 2, 3, 4."], why: "Each term is 4 times its position." },
      { type: "learn", kicker: "A harder case",
        prompt: "Adding the terms of a sequence gives a **series**. Summation notation writes the sum compactly. $$" + SIG + "_{i = 1}^{4} (2i + 1)$$",
        scene: { type: "walk", how: HOW_12_1S, rows: [
          { step: 1, m: "i = 1, \\; 2, \\; 3, \\; 4", say: "The index $i$ runs from 1 up to 4." },
          { step: 2, m: "3, \\; 5, \\; 7, \\; 9", say: "Put each value into $2i + 1$." },
          { step: 3, m: "3 + 5 + 7 + 9 = 24", say: "The sum is 24." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "$n$ **factorial**, written $n" + FACT + "$, is the product of the whole numbers from $n$ down to 1. What is $5" + FACT + "$?", answer: 120, skill: "Factorials",
        near: [{ v: 15, fb: "That is the sum. A factorial is a product: $5 \\cdot 4 \\cdot 3 \\cdot 2 \\cdot 1$." }, { v: 25, fb: "$5 \\cdot 4 \\cdot 3 \\cdot 2 \\cdot 1$, not $5 \\cdot 5$." }],
        hints: ["$5 \\cdot 4 \\cdot 3 \\cdot 2 \\cdot 1$."], why: "$5 \\cdot 4 = 20$, $20 \\cdot 3 = 60$, $60 \\cdot 2 = 120$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $a_n = n^2$, Lu writes the first three terms as $0, 1, 4$. What is wrong?",
        options: [{ t: "A sequence starts at $n = 1$: the terms are $1, 4, 9$." },
                  { t: "The terms should be $2, 4, 6$.", fb: "That is $2n$. Here $n$ is squared." },
                  { t: "Nothing. It is right.", fb: "$0$ comes from $n = 0$, but the first term is $a_1$." }],
        answer: 0, skill: "Terms of a sequence", hints: ["Step 1: which value of $n$ gives the first term?"], why: "$a_1 = 1$, $a_2 = 4$, $a_3 = 9$." },
      { type: "num", kicker: "Use it", prompt: "Row $n$ of a theater has $a_n = 18 + 2n$ seats. How many seats are in row 15?",
        post: "seats", answer: 48, skill: "Terms of a sequence",
        near: [{ v: 300, fb: "Only the 2 multiplies the row number: $18 + 30$." }],
        hints: ["$18 + 2(15)$."], why: "$18 + 30 = 48$." }
    ]
  });

  /* =============================================== 12.2 · Arithmetic sequences */
  var HOW_12_2 = [["Difference", "Subtract consecutive terms. If the difference $d$ is always the same, the sequence is arithmetic."],
                  ["First term", "Identify the first term, $a_1$."],
                  ["Formula", "Use $a_n = a_1 + (n - 1)d$ for the $n$th term."],
                  ["Simplify", "Substitute and simplify."]];
  var HOW_12_2S = [["Last term", "Find the last term of the sum, $a_n$."],
                   ["Formula", "Use $S_n = \\frac{n}{2}(a_1 + a_n)$."],
                   ["Evaluate", "Substitute and calculate."]];
  LESSONS.push({
    title: "Arithmetic sequences",
    blurb: "Book 12.2 · A common difference, a formula for any term, and the sum of the first terms.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What comes next? $$5, \\; 9, \\; 13, \\; 17, \\; \\ldots$$", answer: 21, skill: "Number patterns",
        near: [{ v: 20, fb: "Each term is 4 more than the one before." }], hints: ["What is added each time?"], why: "$17 + 4 = 21$." },
      { type: "learn", kicker: "The idea",
        prompt: "An **arithmetic sequence** adds the same number each time: the **common difference**, $d$. To reach the $n$th term you start at $a_1$ and add $d$ exactly $n - 1$ times.",
        scene: { type: "method", how: HOW_12_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the 20th term of $7, 10, 13, 16, \\ldots$ found.",
        scene: { type: "walk", how: HOW_12_2, rows: [
          { step: 1, m: "10 - 7 = 3 \\quad 13 - 10 = 3 \\quad 16 - 13 = 3", say: "The same difference every time: $d = 3$." },
          { step: 2, m: "a_1 = 7", say: "The first term." },
          { step: 3, m: "a_{20} = 7 + (20 - 1)(3)", say: "From the first term to the 20th there are 19 steps.",
            ask: { prompt: "How many times is $d$ added to get from $a_1$ to $a_{20}$?", answer: 0,
                   options: [{ t: "19 times" }, { t: "20 times", fb: "The first term has had nothing added yet. Each later term adds one more $d$." }] } },
          { step: 4, m: "a_{20} = 7 + 57 = 64", say: "$19 \\cdot 3 = 57$." }] },
        gate: true, then: "No need to write out all 20 terms." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the 12th term of $50, 44, 38, \\ldots$",
        how: HOW_12_2, skill: "Arithmetic sequences",
        steps: [
          { step: 1, ask: "What is the common difference, $44 - 50$?", type: "num", pre: "$d =$", answer: -6, near: [{ v: 6, fb: "The terms are going down: second minus first." }], hint: "$44 - 50$.",
            m: "d = -6", say: "A decreasing sequence has a negative difference." },
          { step: 2, ask: "What is $a_1$?", type: "num", pre: "$a_1 =$", answer: 50, hint: "The first term in the list.",
            m: "a_1 = 50", say: "The first term." },
          { step: 3, ask: "Use the formula. How many times is $d$ added for $a_{12}$?", type: "num", answer: 11, near: [{ v: 12, fb: "$n - 1 = 11$." }], hint: "$12 - 1$.",
            m: "a_{12} = 50 + 11(-6)", say: "$a_1 + (n - 1)d$." },
          { step: 4, ask: "What is $50 + 11(-6)$?", type: "num", pre: "$a_{12} =$", answer: -16, near: [{ v: 116, fb: "$11(-6) = -66$." }, { v: -22, fb: "That uses 12 steps. There are 11." }], hint: "$50 - 66$.",
            m: "a_{12} = -16", say: "$50 - 66$." }],
        why: "Difference, first term, formula, simplify. Now sort some sequences." },
      { type: "sort", kicker: "On your own", prompt: "Arithmetic, or not?",
        bins: ["Arithmetic", "Not arithmetic"],
        cards: [{ t: "$2, \\; 5, \\; 8, \\; 11$", bin: 0, fb: "Add 3 each time." },
                { t: "$1, \\; 2, \\; 4, \\; 8$", bin: 1, fb: "The differences are 1, 2, 4: not constant." },
                { t: "$10, \\; 7, \\; 4, \\; 1$", bin: 0, fb: "Add $-3$ each time." },
                { t: "$1, \\; 4, \\; 9, \\; 16$", bin: 1, fb: "The differences are 3, 5, 7." }],
        skill: "Arithmetic sequences", hints: ["Subtract each term from the next. Is the result always the same?"],
        why: "An arithmetic sequence has one common difference." },
      { type: "expr", prompt: "Write the general term $a_n$ of $4, 9, 14, 19, \\ldots$ in simplest form.",
        answer: "5n-1", shown: "5n - 1", form: "simplified", skill: "General term",
        near: [{ v: "5n+4", fb: "$d$ is added $n - 1$ times, not $n$ times: $4 + (n - 1)5$." }, { v: "4n+5", fb: "The difference, 5, is what multiplies $n$." }],
        keys: [["$n$", "n"], ["$+$", "+"], ["$-$", "-"]], placeholder: "Use n",
        hints: ["$a_n = 4 + (n - 1)5$."], why: "$4 + 5n - 5 = 5n - 1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "To add an arithmetic sequence, pair the first term with the last: every such pair has the same sum. Add the first 20 terms of $7, 10, 13, \\ldots$",
        scene: { type: "walk", how: HOW_12_2S, rows: [
          { step: 1, m: "a_{20} = 7 + 19(3) = 64", say: "The last term of the sum." },
          { step: 2, m: "S_{20} = \\frac{20}{2}(7 + 64)", say: "Ten pairs, and each pair adds to $7 + 64$." },
          { step: 3, m: "S_{20} = 10(71) = 710", say: "The sum of the first 20 terms." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Find the sum $1 + 2 + 3 + \\ldots + 100$.", answer: 5050, skill: "Arithmetic series",
        near: [big(5050), { v: 10100, fb: "There are 50 pairs, not 100: $\\frac{100}{2}(1 + 100)$." }],
        hints: ["$S_n = \\frac{n}{2}(a_1 + a_n)$ with $n = 100$."], why: "$50 \\cdot 101 = 5050$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where finding the 10th term of $3, 7, 11, \\ldots$ **first** goes wrong.",
        lines: ["d = 4", "a_{10} = 3 + 10(4)", "a_{10} = 43"], answer: 1, fix: "a_{10} = 3 + 9(4)",
        fb: { 0: "The common difference is right.", 2: LATER }, skill: "Arithmetic sequences",
        hints: ["How many steps are there from the 1st term to the 10th?"],
        why: "$d$ is added $n - 1 = 9$ times: $a_{10} = 3 + 36 = 39$." },
      { type: "num", kicker: "Use it", prompt: "You save **\\$50** in week 1, and each week you save **\\$15 more** than the week before. How much do you save in week 12?",
        pre: "$\\$$", answer: 215, skill: "Arithmetic sequences",
        near: [{ v: 230, fb: "From week 1 to week 12 there are 11 increases, not 12." }],
        hints: ["$a_{12} = 50 + 11(15)$."], why: "$50 + 165 = 215$." }
    ]
  });

  /* ==================================== 12.3 · Geometric sequences and series */
  var HOW_12_3 = [["Ratio", "Divide consecutive terms. If the ratio $r$ is always the same, the sequence is geometric."],
                  ["First term", "Identify the first term, $a_1$."],
                  ["Formula", "Use $a_n = a_1 r^{n - 1}$ for the $n$th term."],
                  ["Simplify", "Substitute and simplify."]];
  var HOW_12_3S = [["Ratio", "Find the common ratio, $r$."],
                   ["Converges?", "An infinite geometric series has a sum only when $|r| < 1$."],
                   ["Formula", "Then the sum is $S = \\frac{a_1}{1 - r}$."]];
  LESSONS.push({
    title: "Geometric sequences and series",
    blurb: "Book 12.3 · A common ratio, a formula for any term, and sums that go on for ever.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What comes next? $$3, \\; 6, \\; 12, \\; 24, \\; \\ldots$$", answer: 48, skill: "Number patterns",
        near: [{ v: 36, fb: "The terms are doubling, not growing by 12." }], hints: ["What is each term multiplied by?"], why: "$24 \\cdot 2 = 48$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **geometric sequence** multiplies by the same number each time: the **common ratio**, $r$. To reach the $n$th term you start at $a_1$ and multiply by $r$ exactly $n - 1$ times.",
        scene: { type: "method", how: HOW_12_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the 6th term of $5, 15, 45, \\ldots$ found.",
        scene: { type: "walk", how: HOW_12_3, rows: [
          { step: 1, m: "\\frac{15}{5} = 3 \\quad \\frac{45}{15} = 3", say: "The same ratio each time: $r = 3$." },
          { step: 2, m: "a_1 = 5", say: "The first term." },
          { step: 3, m: "a_6 = 5 \\cdot 3^{6 - 1}", say: "Five multiplications by 3 take the first term to the sixth.",
            ask: { prompt: "What is the exponent on $r$ for the 6th term?", answer: 0,
                   options: [{ t: "5" }, { t: "6", fb: "The first term has not been multiplied yet: the exponent is $n - 1$." }] } },
          { step: 4, m: "a_6 = 5 \\cdot 243 = 1215", say: "$3^5 = 243$." }] },
        gate: true, then: "Arithmetic: add $d$, and the formula has $(n - 1)d$. Geometric: multiply by $r$, and the formula has $r^{n - 1}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the 8th term of $64, 32, 16, \\ldots$",
        how: HOW_12_3, skill: "Geometric sequences",
        steps: [
          { step: 1, ask: "What is the common ratio, $\\frac{32}{64}$? (Type a fraction like 1/3.)", type: "num", pre: "$r =$", answer: 0.5, tol: 1e-9, near: [{ v: 2, fb: "Divide each term by the one **before** it: $32 \\div 64$." }], hint: "$32 \\div 64$.",
            m: "r = \\frac{1}{2}", say: "The terms are halving." },
          { step: 2, ask: "What is $a_1$?", type: "num", pre: "$a_1 =$", answer: 64, hint: "The first term in the list.",
            m: "a_1 = 64", say: "The first term." },
          { step: 3, ask: "Which expression is $a_8$?", type: "choice", answer: 0,
            options: [{ t: "$64 \\cdot \\left(\\frac{1}{2}\\right)^7$" }, { t: "$64 \\cdot \\left(\\frac{1}{2}\\right)^8$", fb: "The exponent is $n - 1 = 7$." }, { t: "$64 + 7 \\cdot \\frac{1}{2}$", fb: "That is the arithmetic formula. A geometric sequence multiplies." }],
            m: "a_8 = 64 \\cdot \\left(\\frac{1}{2}\\right)^{7}", say: "$a_1 r^{n - 1}$." },
          { step: 4, ask: "$\\left(\\frac{1}{2}\\right)^7 = \\frac{1}{128}$. What is $\\frac{64}{128}$? (Type a fraction like 1/3.)", type: "num", pre: "$a_8 =$", answer: 0.5, tol: 1e-9, near: [{ v: 2, fb: "64 is the smaller number: $\\frac{64}{128}$." }], hint: "Half of 128 is 64.",
            m: "a_8 = \\frac{1}{2}", say: "$\\frac{64}{128}$ reduces to $\\frac{1}{2}$." }],
        why: "Ratio, first term, formula, simplify. Now sort some sequences." },
      { type: "sort", kicker: "On your own", prompt: "Arithmetic, geometric, or neither?",
        bins: ["Arithmetic", "Geometric", "Neither"],
        cards: [{ t: "$3, \\; 6, \\; 12, \\; 24$", bin: 1, fb: "Multiply by 2 each time." },
                { t: "$3, \\; 6, \\; 9, \\; 12$", bin: 0, fb: "Add 3 each time." },
                { t: "$81, \\; 27, \\; 9, \\; 3$", bin: 1, fb: "Multiply by $\\frac{1}{3}$ each time." },
                { t: "$1, \\; 4, \\; 9, \\; 16$", bin: 2, fb: "No common difference and no common ratio: these are the squares." }],
        skill: "Geometric sequences", hints: ["Is there a common difference? A common ratio?"],
        why: "Constant differences: arithmetic. Constant ratios: geometric." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the terms shrink fast enough, even infinitely many of them have a finite sum. $$8 + 4 + 2 + 1 + \\ldots$$",
        scene: { type: "walk", how: HOW_12_3S, rows: [
          { step: 1, m: "r = \\frac{4}{8} = \\frac{1}{2}", say: "Each term is half of the one before." },
          { step: 2, m: "\\frac{1}{2} < 1", say: "The ratio is between $-1$ and 1, so the terms shrink toward 0 and the sums settle." },
          { step: 3, m: "S = \\frac{8}{1 - \\frac{1}{2}} = 16", say: "$8 \\div \\frac{1}{2} = 16$. The partial sums 8, 12, 14, 15, … creep up toward 16." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The sum of the first $n$ terms is $S_n = \\frac{a_1(1 - r^n)}{1 - r}$. Find the sum of the first 5 terms of $2, 6, 18, \\ldots$", answer: 242, skill: "Geometric series",
        near: [{ v: 162, fb: "That is the 5th term. The question asks for the sum of all five." }, { v: -242, fb: "Both the top and the bottom are negative, so the quotient is positive." }],
        hints: ["$\\frac{2(1 - 3^5)}{1 - 3}$."], why: "$\\frac{2(-242)}{-2} = 242$. Check: $2 + 6 + 18 + 54 + 162$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ray says the infinite series $2 + 4 + 8 + 16 + \\ldots$ has the sum $\\frac{2}{1 - 2} = -2$. What is wrong?",
        options: [{ t: "$r = 2$ is not between $-1$ and 1, so the series has no sum." },
                  { t: "The sum should be $+2$.", fb: "The terms keep growing, so no finite number can be their sum." },
                  { t: "Nothing. The formula gives $-2$.", fb: "Adding positive numbers cannot give a negative total. The formula does not apply here." }],
        answer: 0, skill: "Geometric series", hints: ["Step 2: is $|r| < 1$?"], why: "The formula $\\frac{a_1}{1 - r}$ works only when $|r| < 1$." },
      { type: "num", kicker: "Use it", prompt: "A ball is dropped from **10 m**, and after each bounce it rises to half its previous height. What is the total distance of all its **falls**: $10 + 5 + 2.5 + \\ldots$?",
        post: "m", answer: 20, skill: "Geometric series",
        near: [{ v: 17.5, tol: 1e-9, fb: "That is only the first three falls. Use $\\frac{a_1}{1 - r}$ for all of them." }],
        hints: ["$a_1 = 10$ and $r = \\frac{1}{2}$."], why: "$\\frac{10}{1 - \\frac{1}{2}} = 20$." }
    ]
  });

  /* ==================================================== 12.4 · Binomial Theorem */
  var HOW_12_4 = [["Row", "Take row $n$ of Pascal's Triangle for the coefficients."],
                  ["Powers of a", "The powers of the first term fall from $n$ down to 0."],
                  ["Powers of b", "The powers of the second term rise from 0 up to $n$."],
                  ["Simplify", "Multiply out each term."]];
  // Pascal's Triangle as a figure, rows 0 to n, with one row picked out.
  function pascal(n, hot) {
    var items = [], row = [1];
    for (var r = 0; r <= n; r++) {
      for (var j = 0; j < row.length; j++) items.push({ text: String(row[j]), at: [(n - r) / 2 + j + 0.5, n - r + 0.3], eq: true, c: r === hot ? "blue" : "ink" });
      var next = [1];
      for (var k = 0; k < row.length - 1; k++) next.push(row[k] + row[k + 1]);
      next.push(1); row = next;
    }
    return fig({ grid: false, x: [0, n + 1], y: [0, n + 1], u: 34, pad: 6, alt: "Pascal's Triangle, rows 0 to " + n + ". Each number is the sum of the two above it.", items: items });
  }
  LESSONS.push({
    title: "The Binomial Theorem",
    blurb: "Book 12.4 · Pascal's Triangle, binomial coefficients, and expanding a power of a binomial.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Expand $(x + 1)^2$.",
        options: [{ t: "$x^2 + 2x + 1$" }, { t: "$x^2 + 1$", fb: "There is a middle term: $x + x$." }, { t: "$x^2 + x + 1$", fb: "The middle term is $x + x = 2x$." }],
        answer: 0, skill: "Special products", hints: ["$(x + 1)(x + 1)$."], why: "The coefficients are 1, 2, 1." },
      { type: "learn", kicker: "Explore", prompt: "This is **Pascal's Triangle**. Every row starts and ends with 1, and each number in between is the sum of the two above it." + pascal(5),
        after: "The top row is row 0. Row 2 reads 1, 2, 1: the coefficients of $(x + 1)^2$." },
      { type: "learn", kicker: "The idea",
        prompt: "The coefficients of $(a + b)^n$ are row $n$ of Pascal's Triangle. Across the expansion the powers of $a$ count down from $n$ to 0, and the powers of $b$ count up from 0 to $n$.",
        scene: { type: "method", how: HOW_12_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $(x + 2)^4$ expanded.",
        scene: { type: "walk", how: HOW_12_4, rows: [
          { step: 1, m: "(x + 2)^4", say: "$n = 4$, so take row 4 of the triangle.", fig: pascal(4, 4) },
          { step: 1, m: "1 \\quad 4 \\quad 6 \\quad 4 \\quad 1", say: "The five coefficients." },
          { step: 2, m: "x^4 \\quad x^3 \\quad x^2 \\quad x \\quad 1", say: "The powers of $x$ fall from 4 to 0." },
          { step: 3, m: "1 \\quad 2 \\quad 4 \\quad 8 \\quad 16", say: "The powers of 2 rise from $2^0$ to $2^4$.",
            ask: { prompt: "What is the last power of 2 needed, for the fifth term?", answer: 0,
                   options: [{ t: "$2^4 = 16$" }, { t: "$2^5 = 32$", fb: "The powers run from $2^0$ to $2^4$: five of them." }] } },
          { step: 4, m: "x^4 + 4x^3(2) + 6x^2(4) + 4x(8) + 16", say: "Coefficient times power of $x$ times power of 2, term by term." },
          { step: 4, m: "x^4 + 8x^3 + 24x^2 + 32x + 16", say: "Multiply out each term." }] },
        gate: true, then: "Multiplying $(x + 2)$ by itself four times would give the same answer, far more slowly." },
      { type: "guided", kicker: "Together",
        prompt: "Now you expand $(a + b)^3$.",
        how: HOW_12_4, skill: "Binomial expansion",
        steps: [
          { step: 1, ask: "Which row of Pascal's Triangle is needed?", type: "choice", answer: 0,
            options: [{ t: "$1, \\; 3, \\; 3, \\; 1$" }, { t: "$1, \\; 2, \\; 1$", fb: "That is row 2, for a square." }, { t: "$1, \\; 4, \\; 6, \\; 4, \\; 1$", fb: "That is row 4." }],
            m: "1 \\quad 3 \\quad 3 \\quad 1", say: "Row 3." },
          { step: 2, ask: "What are the powers of $a$, in order?", type: "choice", answer: 0,
            options: [{ t: "$a^3, \\; a^2, \\; a, \\; 1$" }, { t: "$1, \\; a, \\; a^2, \\; a^3$", fb: "The first term's powers count **down**." }],
            m: "a^3 \\quad a^2 \\quad a \\quad 1", say: "Falling from 3 to 0." },
          { step: 3, ask: "And the powers of $b$?", type: "choice", answer: 0,
            options: [{ t: "$1, \\; b, \\; b^2, \\; b^3$" }, { t: "$b^3, \\; b^2, \\; b, \\; 1$", fb: "The second term's powers count **up**." }],
            m: "1 \\quad b \\quad b^2 \\quad b^3", say: "Rising from 0 to 3." },
          { step: 4, ask: "Put them together.", type: "choice", answer: 0,
            options: [{ t: "$a^3 + 3a^2b + 3ab^2 + b^3$" }, { t: "$a^3 + b^3$", fb: "That leaves out the two middle terms." }, { t: "$a^3 + 3a^2b^2 + 3ab + b^3$", fb: "In each term the exponents add up to 3." }],
            m: "a^3 + 3a^2b + 3ab^2 + b^3", say: "In every term the two exponents add up to 3." }],
        why: "Row, powers of $a$, powers of $b$, simplify. Now build the next row yourself." },
      { type: "num", kicker: "On your own", prompt: "Row 4 is $1, 4, 6, 4, 1$. Row 5 begins $1, 5, \\ldots$ What is its **third** number?", answer: 10, skill: "Pascal's Triangle",
        near: [{ v: 6, fb: "That is from row 4. Each number is the sum of the two above it: $4 + 6$." }, { v: 9, fb: "Add the two numbers above it: $4 + 6$." }],
        hints: ["Add the two numbers above it in row 4."], why: "$4 + 6 = 10$. Row 5 is $1, 5, 10, 10, 5, 1$." },
      { type: "num", prompt: "The numbers in the triangle are **binomial coefficients**, and a formula gives each one directly: $_{n}C_{r} = \\frac{n" + FACT + "}{r" + FACT + "(n - r)" + FACT + "}$. Find $_{5}C_{2} = \\frac{5" + FACT + "}{2" + FACT + " \\cdot 3" + FACT + "}$.", answer: 10, skill: "Binomial coefficients",
        near: [{ v: 20, fb: "Divide by $2" + FACT + " = 2$ as well as by $3" + FACT + " = 6$." }, { v: 60, fb: "$\\frac{120}{2 \\cdot 6}$." }],
        hints: ["$\\frac{120}{2 \\cdot 6}$."], why: "$\\frac{120}{12} = 10$: the same 10 as in row 5." },
      { type: "learn", kicker: "A harder case",
        prompt: "When a term has a coefficient or a minus sign, keep it in parentheses. $$(2x - 1)^3$$",
        scene: { type: "walk", how: HOW_12_4, rows: [
          { step: 1, m: "1 \\quad 3 \\quad 3 \\quad 1", say: "Row 3. Here $a = 2x$ and $b = -1$." },
          { step: 2, m: "(2x)^3 \\quad (2x)^2 \\quad (2x) \\quad 1", say: "The powers of $2x$ fall." },
          { step: 3, m: "1 \\quad (-1) \\quad (-1)^2 \\quad (-1)^3", say: "The powers of $-1$ rise, so the signs alternate." },
          { step: 4, m: "8x^3 - 12x^2 + 6x - 1", say: "$1 \\cdot 8x^3$, then $3 \\cdot 4x^2 \\cdot (-1)$, then $3 \\cdot 2x \\cdot 1$, then $-1$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "How many terms does the expansion of $(x + y)^7$ have?", answer: 8, skill: "Binomial expansion",
        near: [{ v: 7, fb: "The powers of $y$ run from 0 to 7: that is 8 of them." }],
        hints: ["Count the powers of $y$: 0, 1, 2, …, 7."], why: "$n + 1 = 8$ terms." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mo says $(x + 3)^2 = x^2 + 9$: “just square each term”. What is wrong?",
        options: [{ t: "Row 2 is $1, 2, 1$: there is a middle term, $2 \\cdot x \\cdot 3 = 6x$." },
                  { t: "It should be $x^2 + 6$.", fb: "$3^2 = 9$ is right. A term is missing." },
                  { t: "Nothing. It is right.", fb: "Test $x = 1$: $(1 + 3)^2 = 16$, but $1 + 9 = 10$." }],
        answer: 0, skill: "Binomial expansion", hints: ["How many terms should the expansion have?"], why: "$(x + 3)^2 = x^2 + 6x + 9$." },
      { type: "num", kicker: "Use it", prompt: "What is the coefficient of $x^2$ in the expansion of $(x + 1)^5$?", answer: 10, skill: "Binomial coefficients",
        near: [{ v: 5, fb: "5 is the coefficient of $x^4$ and of $x$. Row 5 is $1, 5, 10, 10, 5, 1$." }],
        hints: ["Row 5 is $1, 5, 10, 10, 5, 1$, for $x^5, x^4, x^3, x^2, x, 1$."], why: "The fourth entry of row 5 goes with $x^2$: 10." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "a2u12-terms", title: "Find a term of a sequence", lesson: 2,
      gen: function (R) {
        var k = R.int(3, 9), sq = R.chance(0.4), a = R.int(2, 6), b = R.nz(-7, 7);
        var rule = sq ? poly([[1, "n^2"], [b, ""]]) : poly([[a, "n"], [b, ""]]), ans = sq ? k * k + b : a * k + b;
        return { type: "num", prompt: "For the sequence $a_n = " + rule + "$, find $a_{" + k + "}$.", pre: "$a_{" + k + "} =$", answer: ans,
          near: near(ans, [{ v: sq ? 2 * k + b : a + k + b, fb: sq ? "$n^2$ is $n \\cdot n$, not $2n$." : a + "n means " + a + " times $n$." }]),
          hints: ["Put $" + k + "$ in place of $n$."], why: sq ? "$" + k + "^2 " + signed(b) + " = " + ans + "$." : "$" + a + "(" + k + ") " + signed(b) + " = " + ans + "$." };
      } },
    { id: "a2u12-arith", title: "Find a term of an arithmetic sequence", lesson: 3,
      gen: function (R) {
        var a1 = R.int(-10, 20), d = R.nz(-6, 7), n = R.pick([10, 12, 15, 20, 25]), ans = a1 + (n - 1) * d;
        return { type: "num", prompt: "Find the " + n + "th term of the arithmetic sequence $" + [a1, a1 + d, a1 + 2 * d, a1 + 3 * d].join(", \\; ") + ", \\; \\ldots$", pre: "$a_{" + n + "} =$", answer: ans,
          near: near(ans, [{ v: a1 + n * d, fb: "The difference is added $n - 1 = " + (n - 1) + "$ times, not " + n + " times." }]),
          hints: ["$d = " + d + "$. Use $a_n = a_1 + (n - 1)d$."], why: "$" + a1 + " + " + (n - 1) + "(" + d + ") = " + ans + "$." };
      } },
    { id: "a2u12-arithsum", title: "Sum an arithmetic sequence", lesson: 3,
      gen: function (R) {
        var a1 = R.int(1, 12), d = R.int(1, 6), n = R.pick([8, 10, 12, 20]), an = a1 + (n - 1) * d, ans = n * (a1 + an) / 2;
        return { type: "num", prompt: "An arithmetic sequence has first term $" + a1 + "$ and " + n + "th term $" + an + "$. Find the sum of its first " + n + " terms.", pre: "$S_{" + n + "} =$", answer: ans,
          near: near(ans, [{ v: n * (a1 + an), fb: "There are $\\frac{" + n + "}{2}$ pairs, not " + n + "." }, { v: a1 + an, fb: "That is one pair. There are $\\frac{" + n + "}{2}$ of them." }]),
          hints: ["$S_n = \\frac{n}{2}(a_1 + a_n)$."], why: "$\\frac{" + n + "}{2}(" + a1 + " + " + an + ") = " + n / 2 + " \\cdot " + (a1 + an) + " = " + ans + "$." };
      } },
    { id: "a2u12-geo", title: "Find a term of a geometric sequence", lesson: 4,
      gen: function (R) {
        var a1 = R.int(1, 6), r = R.pick([2, 3, -2, 2, 3]), n = R.int(5, r === 3 ? 6 : 8), ans = a1 * Math.pow(r, n - 1);
        return { type: "num", prompt: "Find the " + n + "th term of the geometric sequence $" + [a1, a1 * r, a1 * r * r].join(", \\; ") + ", \\; \\ldots$", pre: "$a_{" + n + "} =$", answer: ans,
          near: near(ans, [{ v: a1 * Math.pow(r, n), fb: "The exponent is $n - 1 = " + (n - 1) + "$: the first term has not been multiplied yet." }, { v: a1 + (n - 1) * (a1 * r - a1), fb: "That treats it as arithmetic. A geometric sequence multiplies by $" + r + "$ each time." }]),
          hints: ["$r = " + r + "$. Use $a_n = a_1 r^{n - 1}$."], why: "$" + a1 + " \\cdot " + (r < 0 ? "(" + r + ")" : r) + "^{" + (n - 1) + "} = " + ans + "$." };
      } },
    { id: "a2u12-binomial", title: "Evaluate a binomial coefficient", lesson: 5,
      gen: function (R) {
        var n = R.int(4, 8), r = R.int(1, n - 1), ans = 1;
        for (var i = 1; i <= r; i++) ans = ans * (n - r + i) / i;
        ans = Math.round(ans);
        return { type: "num", prompt: "Find the binomial coefficient $_{" + n + "}C_{" + r + "}$: entry " + r + " of row " + n + " of Pascal's Triangle, counting from 0.", answer: ans,
          near: near(ans, [{ v: n * r, fb: "It is not a product of $n$ and $r$. Build row " + n + " of the triangle, or use the factorial formula." }]),
          hints: ["$\\frac{" + n + FACT + "}{" + r + FACT + " \\cdot " + (n - r) + FACT + "}$, or build the triangle row by row."],
          why: "$\\frac{" + n + FACT + "}{" + r + FACT + " \\cdot " + (n - r) + FACT + "} = " + ans + "$." };
      } }
  ];
  L.unit("alg2", 12, {
    title: "Sequences, Series and Binomial Theorem",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Terms of a sequence, arithmetic sequences and their sums.",
        skills: ["a2u12-terms", "a2u12-arith", "a2u12-arithsum"], per: 2 },
      { title: "Quiz 2", after: 5, blurb: "Geometric sequences, and binomial coefficients.",
        skills: ["a2u12-geo", "a2u12-binomial"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:12", {
    2: { name: "Sequences", frame: "A sequence is a function whose inputs are the [[counting numbers]]. $a_n$ is the [[general term]]. Adding the terms of a sequence gives a [[series]].",
         chips: ["integers", "factor"] },
    3: { name: "Arithmetic sequences", frame: "An arithmetic sequence has a common [[difference]] $d$. To reach the $n$th term, $d$ is added [[$n - 1$]] times. The sum of the first $n$ terms is $\\frac{n}{2}$ times the sum of the [[first and last]] terms.",
         chips: ["ratio", "$n$"], fb: { "$n$": "The first term has had nothing added to it yet, so there are only $n - 1$ steps." } },
    4: { name: "Geometric sequences", frame: "A geometric sequence has a common [[ratio]] $r$. Its $n$th term is $a_1$ times [[$r^{n - 1}$]]. An infinite geometric series has a sum only when [[$|r| < 1$]].",
         chips: ["difference", "$r^n$", "$r > 1$"] },
    5: { name: "Binomial Theorem", frame: "The coefficients of $(a + b)^n$ are row [[$n$]] of Pascal's Triangle. The powers of $a$ [[fall]] and the powers of $b$ [[rise]]. The expansion has [[$n + 1$]] terms.",
         chips: ["$n - 1$", "double"] }
  });
})();
