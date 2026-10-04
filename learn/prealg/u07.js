/* ==========================================================================
   Prealgebra — Unit 7: The Properties of Real Numbers. See lab/core.js for
   the format.

   Follows OpenStax Prealgebra 2e, Chapter 7, section for section: the
   readiness check, then 7.1 to 7.5. Each lesson teaches the book's own steps:
   the method, a worked example to watch, one done together, then on your own,
   a harder case, find the error, use it, and the concept built at the end.

   Rational and irrational numbers (7.1), the commutative and associative
   properties (7.2), the distributive property (7.3), identities, inverses
   and zero (7.4), and unit conversion in both systems of measurement (7.5).

   Adapted from OpenStax, Prealgebra 2e (Rice University), CC BY-NC-SA 4.0.
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
  /* Shared by every Prealgebra unit (compiled in after the Algebra I helpers). */
  var GIVEN = "That is the problem as it was given.", LATER = "This line follows correctly from the one above it. Look earlier.";
  var fig = L.fig;
  // A coordinate grid beside a worked example: grid("what it shows", items, { x, y, u }).
  // The scale fits the window: about 240 px across the longer side.
  function grid(alt, items, o) {
    o = Object.assign({ x: [-6, 6], y: [-6, 6], alt: alt, items: items }, o || {});
    if (!o.u) o.u = Math.max(14, Math.min(26, Math.floor(240 / Math.max(o.x[1] - o.x[0], o.y[1] - o.y[0]))));
    return fig(o);
  }
  // Whole numbers stacked for column arithmetic, digits right-aligned:
  //   stack("+", [247, 158], "405")
  // The result may be partial ("  5") or left out while the work is in progress. o.carry writes
  // small digits above the top number: "11 " puts a 1 over the hundreds and over the tens.
  function stack(op, nums, res, o) {
    o = o || {};
    var strs = nums.map(String), all = strs.concat(res != null ? [String(res)] : []).concat(o.carry ? [o.carry] : []);
    var w = Math.max.apply(null, all.map(function (s) { return s.length; })), r0 = o.carry ? 1 : 0, n = strs.length + 1 + r0, items = [], dx = 0.62;
    function put(s, row, c, small) {
      s = String(s);
      for (var i = 0; i < s.length; i++) if (s[i] !== " ") items.push({ text: s[i], at: [(w - s.length + i + 1.5) * dx, n - row - 0.68], eq: !small, c: c || "ink" });
    }
    if (o.carry) put(o.carry, 0, "orange", true);
    strs.forEach(function (s, i) { put(s, r0 + i); });
    items.push({ text: op, at: [0.45 * dx, n - (r0 + strs.length - 1) - 0.68], eq: true, c: "soft" });
    items.push({ seg: [[0.1, 1], [(w + 1.6) * dx, 1]], c: "soft" });
    if (res != null) put(res, n - 1, "blue");
    return fig({ grid: false, x: [0, (w + 1.7) * dx], y: [0, n], u: 40, pad: 8,
      alt: o.alt || (strs.join(" " + op + " ") + (res != null && String(res).trim() ? ", with " + String(res).trim() + " written below the line." : ", set out in columns.")), items: items });
  }
  // A number line beside a worked example: nline(-6, 6, [{ v: -2, name: "−2" }], { hops: [[0, 3, "orange", "+3"]] }).
  // Each hop is an arrow drawn above the line, one row higher than the last.
  function nline(lo, hi, marks, o) {
    o = o || {};
    var step = o.step || 1, hops = o.hops || [], items = [{ line: [[lo, 0], [hi, 0]], c: "soft" }];
    // A named mark takes the place of the tick label under it, so the two never print on top of each other.
    function named(v) { return (marks || []).some(function (m) { return m.name && Math.abs(m.v - v) < 1e-9; }); }
    for (var v = lo; v <= hi + 1e-9; v += step) {
      items.push({ seg: [[v, -0.2], [v, 0.2]], c: "soft" });
      if (named(v)) continue;
      if (!o.every || Math.abs(Math.round(v / (step * o.every)) * step * o.every - v) < 1e-9) items.push({ text: (o.label ? o.label(v) : num(v)).replace("-", "−"), at: [v, -0.85], c: "soft" });
    }
    hops.forEach(function (h, i) { items.push({ arrow: [[h[0], 0.6 + 0.6 * i], [h[1], 0.6 + 0.6 * i]], c: h[2] || "orange", say: h[3] }); });
    (marks || []).forEach(function (m) { items.push({ pt: [m.v, 0], name: m.name, at: m.at || "s", c: m.c || "blue" }); });
    var span = hi - lo + 1.2;
    return fig({ grid: false, x: [lo - 0.6, hi + 0.6], y: [-1.5, 0.9 + 0.6 * hops.length], u: Math.max(12, Math.min(40, Math.floor(300 / span))), pad: 6,
      alt: o.alt || "A number line from " + lo + " to " + hi + ".", items: items });
  }
  // A fraction strip: d equal parts with n shaded. strip(3, 4) is three quarters. More than d
  // parts carry on into a second strip, which is what an improper fraction looks like.
  function strip(n, d, o) {
    o = o || {};
    var bars = Math.max(1, Math.ceil(n / d)), items = [], w = 6 / d;
    for (var b = 0; b < bars; b++) for (var i = 0; i < d; i++) {
      var x = i * w, y = (bars - 1 - b) * 1.35, on = b * d + i < n;
      items.push({ poly: [[x, y], [x + w, y], [x + w, y + 1], [x, y + 1]], c: on ? (o.c || "blue") : "soft", fill: on });
    }
    return fig({ grid: false, x: [0, 6], y: [0, bars * 1.35 - 0.35], u: 40, pad: 6, alt: o.alt || (n + " of " + d + " equal parts shaded" + (bars > 1 ? ", across " + bars + " strips." : ".")), items: items });
  }
  // A geometry sketch with no graph paper behind it: shape("what it shows", [x0, x1], [y0, y1], items).
  function shape(alt, x, y, items, o) { return fig(Object.assign({ grid: false, x: x, y: y, u: 24, pad: 10, alt: alt, items: items }, o || {})); }
  // A hundred grid, ten by ten, with n small squares shaded column by column: what n percent looks like.
  function hundred(n, o) {
    var items = [], full = Math.floor(n / 10), rest = n % 10;
    if (full) items.push({ poly: [[0, 0], [full, 0], [full, 10], [0, 10]], c: "blue", fill: true });
    if (rest) items.push({ poly: [[full, 10 - rest], [full + 1, 10 - rest], [full + 1, 10], [full, 10]], c: "blue", fill: true });
    for (var i = 0; i <= 10; i++) { items.push({ seg: [[i, 0], [i, 10]], c: "soft" }); items.push({ seg: [[0, i], [10, i]], c: "soft" }); }
    return fig({ grid: false, x: [0, 10], y: [0, 10], u: 18, pad: 6, alt: (o && o.alt) || "A ten-by-ten grid of 100 small squares, " + n + " of them shaded.", items: items });
  }
  // A typed 6/8 is marked as 3/4, so "in simplest form" is asked with two boxes instead:
  // Object.assign({ prompt: … }, fracIn(3, 4)).
  function fracIn(n, d) { return { type: "table", head: ["Numerator", "Denominator"], rows: [[null, null]], answers: [[0, 0, n], [0, 1, d]] }; }
  // 11/4 as a mixed number: "2 3/4" to type, 2\frac{3}{4} to print. Simplified on the way.
  function mixed(n, d, tex) {
    var g = L.gcd(n, d), s = n < 0 ? "-" : ""; n = Math.abs(n) / g; d = d / g;
    var w = Math.floor(n / d), r = n - w * d;
    if (!r) return s + w;
    return s + (tex ? (w || "") + "\\frac{" + r + "}{" + d + "}" : (w ? w + " " : "") + r + "/" + d);
  }
  // 23658 as it is written in a sentence: 23,658.
  function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  // A typed "4,000" is read as 4, so every answer of 1000 or more carries the reply that says so.
  function nearBig(ans, list) { return near(ans, (ans >= 1000 ? [big(ans)] : []).concat(list || [])); }
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Chapter 7 Be Prepared · Decimals and roots, like terms, and multiplying fractions and decimals.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Decimals and roots", prompt: "Write $\\frac{3}{8}$ as a decimal.", answer: 0.375, tol: 1e-9, skill: "Fraction to decimal",
        near: [{ v: 3.8, tol: 1e-9, fb: "The bar means division: $3 \\div 8$." }], hints: ["$3.000 \\div 8$."], why: "$3 \\div 8 = 0.375$." },
      { type: "num", prompt: "Simplify $\\sqrt{49}$.", answer: 7, skill: "Square roots",
        near: [{ v: 24.5, tol: 1e-9, fb: "A square root is not a half. Which number times itself is 49?" }], hints: ["$7 \\cdot 7$."], why: "$7^2 = 49$." },
      { type: "choice", kicker: "Check 2 · Like terms", prompt: "Simplify $3x + 9 + 5x + 2$.",
        options: [{ t: "$8x + 11$" }, { t: "$19x$", fb: "Only like terms combine: the $x$ terms together, and the constants together." }, { t: "$8x + 18$", fb: "$9 + 2 = 11$." }],
        answer: 0, skill: "Combine like terms", hints: ["$3x + 5x$, and $9 + 2$."], why: "$8x + 11$." },
      { type: "num", prompt: "Evaluate $2x + 7$ when $x = -3$.", answer: 1, skill: "Evaluate with integers",
        near: [{ v: 13, fb: "$2(-3) = -6$, not 6." }, { v: -16, fb: "Multiply before you add: $2(-3) + 7$." }], hints: ["$2(-3) + 7$."], why: "$-6 + 7 = 1$." },
      { type: "num", kicker: "Check 3 · Multiplying", prompt: "Multiply $\\frac{2}{3} \\cdot \\frac{3}{2}$.", answer: 1, skill: "Multiply fractions",
        near: [{ v: 4 / 9, tol: 1e-9, fb: "Multiply across: $\\frac{2 \\cdot 3}{3 \\cdot 2}$." }], hints: ["$\\frac{6}{6}$."], why: "A number times its reciprocal is 1." },
      { type: "num", prompt: "Multiply $7.2 \\cdot 100$.", answer: 720, skill: "Powers of 10",
        near: [{ v: 72, fb: "100 has two zeros: move the point two places." }], hints: ["Two places to the right."], why: "$7.2 \\to 72 \\to 720$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 7.1**. If **check 1** slipped, see lessons 5.3 and 5.7. If **check 2** slipped, see lessons 2.2 and 3.2. If **check 3** slipped, see lessons 4.2 and 5.2.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================== 7.1 · Rational and irrational numbers */
  var HOW_7_1 = [["Simplify", "Simplify the number if you can: the root of a perfect square, or a fraction that divides exactly."],
                 ["Ratio?", "Can it be written as a ratio of two integers, or as a decimal that stops or repeats? Then it is rational. If not, it is irrational."],
                 ["Sets", "Name every set it belongs to: whole, integer, rational, irrational, real."]];
  LESSONS.push({
    title: "Rational and irrational numbers",
    blurb: "Book 7.1 · Rational and irrational numbers, and the sets that make up the real numbers.",
    mins: 12, v: 1,
    steps: [
      Object.assign({ kicker: "Warm up", prompt: "Write $0.25$ as a ratio of two whole numbers, in simplest form.", skill: "Decimal to fraction",
        hints: ["Twenty-five hundredths: $\\frac{25}{100}$."], why: "$\\frac{25}{100} = \\frac{1}{4}$." }, fracIn(1, 4)),
      { type: "learn", kicker: "The idea",
        prompt: "A **rational number** can be written as a ratio of two integers: every integer, every fraction, and every decimal that stops or repeats. An **irrational number** cannot. Its decimal never stops and never repeats, like $\\pi$. Together they are the **real numbers**.",
        scene: { type: "method", how: HOW_7_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\sqrt{44}$ classified.",
        scene: { type: "walk", how: HOW_7_1, rows: [
          { step: 1, m: "\\sqrt{44}", say: "Can it be simplified? Only if 44 is a perfect square." },
          { step: 1, m: "36 < 44 < 49", say: "44 lies between $6^2$ and $7^2$, so it is not a perfect square.",
            ask: { prompt: "Is 44 a perfect square?", answer: 0,
                   options: [{ t: "No" }, { t: "Yes", fb: "$6^2 = 36$ and $7^2 = 49$. Nothing squares to 44." }] } },
          { step: 2, m: "\\sqrt{44} = 6.63324958\\ldots", say: "Its decimal never stops and never repeats: irrational." },
          { step: 3, m: "\\text{irrational, and real}", say: "Not whole, not an integer, not rational." }] },
        gate: true, then: "The square root of any whole number that is not a perfect square is irrational." },
      { type: "guided", kicker: "Together",
        prompt: "Now you classify $-\\sqrt{25}$.",
        how: HOW_7_1, skill: "Classify real numbers",
        steps: [
          { step: 1, ask: "25 is a perfect square. Simplify $-\\sqrt{25}$.", type: "num", answer: -5, near: [{ v: 5, fb: "The minus sign in front stays." }], hint: "$\\sqrt{25} = 5$.",
            m: "-\\sqrt{25} = -5", say: "It simplifies to an integer." },
          { step: 2, ask: "Can $-5$ be written as a ratio of two integers?", type: "choice", answer: 0,
            options: [{ t: "Yes: $\\frac{-5}{1}$" }, { t: "No", fb: "Any integer can be written over 1." }],
            m: "-5 = \\frac{-5}{1}", say: "So it is rational." },
          { step: 3, ask: "Which sets contain $-5$?", type: "choice", answer: 0,
            options: [{ t: "Integer, rational and real" }, { t: "Whole, integer, rational and real", fb: "The whole numbers are 0, 1, 2, …: no negatives." }, { t: "Irrational and real", fb: "It is a ratio of integers, so it is rational." }],
            m: "\\text{integer, rational, real}", say: "Every integer is rational, and every rational number is real." }],
        why: "Simplify, ratio, sets. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Rational or irrational?",
        bins: ["Rational", "Irrational"],
        cards: [{ t: "$0.58\\overline{3}$", bin: 0, fb: "It repeats, so it is rational." },
                { t: "$\\sqrt{17}$", bin: 1, fb: "17 is not a perfect square." },
                { t: "$-\\frac{4}{9}$", bin: 0, fb: "It is a ratio of two integers." },
                { t: "$\\pi$", bin: 1, fb: "Its decimal never stops and never repeats." },
                { t: "$\\sqrt{81}$", bin: 0, fb: "$\\sqrt{81} = 9$, an integer." },
                { t: "$0.475$", bin: 0, fb: "It stops: $\\frac{475}{1000}$." }],
        skill: "Rational or irrational", hints: ["Simplify any roots first."],
        why: "A decimal that stops or repeats, and any ratio of integers, is rational." },
      { type: "multi", prompt: "Which sets does $\\sqrt{16}$ belong to? Choose **all** that apply.",
        options: [{ t: "Whole numbers", ok: true }, { t: "Integers", ok: true }, { t: "Rational numbers", ok: true },
                  { t: "Irrational numbers", fb: "$\\sqrt{16} = 4$, which is the ratio $\\frac{4}{1}$." }, { t: "Real numbers", ok: true }],
        skill: "Classify real numbers", hints: ["Simplify first: $\\sqrt{16} = 4$."],
        why: "4 is whole, so it is also an integer, a rational number and a real number." },
      { type: "learn", kicker: "A harder case",
        prompt: "A pattern is not the same as repeating. Classify $0.101001000100001\\ldots$",
        scene: { type: "walk", how: HOW_7_1, rows: [
          { step: 1, m: "0.101001000100001\\ldots", say: "Nothing here can be simplified." },
          { step: 2, m: "1 \\quad 01 \\quad 001 \\quad 0001", say: "There is a pattern, but each run of zeros is longer. No fixed block of digits repeats." },
          { step: 2, m: "\\text{not a ratio of integers}", say: "It never stops and never repeats: irrational." },
          { step: 3, m: "\\text{irrational, and real}", say: "The only sets it belongs to." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which of these is irrational?",
        options: [{ t: "$\\sqrt{50}$" }, { t: "$\\sqrt{49}$", fb: "$\\sqrt{49} = 7$, an integer." }, { t: "$0.\\overline{49}$", fb: "It repeats, so it is rational." }, { t: "$\\frac{49}{50}$", fb: "It is a ratio of two integers." }],
        answer: 0, skill: "Rational or irrational", hints: ["Which one is the root of a number that is not a perfect square?"], why: "50 lies between 49 and 64, so $\\sqrt{50}$ is irrational." },
      { type: "choice", kicker: "Find the error",
        prompt: "Tia says $3.14$ is irrational, because it is $\\pi$. What is wrong?",
        options: [{ t: "$3.14$ stops, so it is rational: $\\frac{314}{100}$. It is only an approximation of $\\pi$." },
                  { t: "$\\pi$ is rational too.", fb: "$\\pi$ never stops and never repeats: it is irrational." },
                  { t: "Nothing. It is right.", fb: "$\\pi = 3.14159\\ldots$ goes on. $3.14$ has only two decimal places." }],
        answer: 0, skill: "Rational or irrational", hints: ["Does $3.14$ stop?"], why: "A decimal that stops is rational." },
      { type: "choice", kicker: "Use it", prompt: "A square tile has area 20 square inches, so its side is $\\sqrt{20}$ inches. Which statement is true?",
        options: [{ t: "The side is irrational, between 4 and 5 inches" }, { t: "The side is exactly 4.5 inches", fb: "$4.5^2 = 20.25$, not 20." }, { t: "The side is rational: 10 inches", fb: "A square root is not a half." }],
        answer: 0, skill: "Rational or irrational", hints: ["$16 < 20 < 25$."], why: "20 is not a perfect square, and it lies between $4^2$ and $5^2$." }
    ]
  });

  /* ====================================== 7.2 · Commutative and associative properties */
  var HOW_7_2 = [["Spot", "Look for numbers that combine easily: like terms, a common denominator, or a round sum or product."],
                 ["Reorder", "Use the commutative property to change the order, and the associative property to change the grouping."],
                 ["Compute", "Work out the easy part first, then finish."]];
  LESSONS.push({
    title: "Commutative and associative properties",
    blurb: "Book 7.2 · Changing the order and the grouping, to evaluate and to simplify.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which pair gives the same result in either order?",
        options: [{ t: "$7 + 5$ and $5 + 7$" }, { t: "$7 - 5$ and $5 - 7$", fb: "One is 2 and the other is $-2$." }, { t: "$8 \\div 2$ and $2 \\div 8$", fb: "One is 4 and the other is $\\frac{1}{4}$." }],
        answer: 0, skill: "Commutative property", hints: ["Work each pair out."], why: "Both are 12. Order does not matter for addition." },
      { type: "learn", kicker: "The idea",
        prompt: "**Commutative**: order does not matter when you add or multiply. $a + b = b + a$ and $ab = ba$. **Associative**: grouping does not matter either. $(a + b) + c = a + (b + c)$. Subtraction and division have neither property.",
        scene: { type: "method", how: HOW_7_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the properties make an addition easy. $$\\frac{7}{15} + \\frac{5}{8} + \\frac{8}{15}$$",
        scene: { type: "walk", how: HOW_7_2, rows: [
          { step: 1, m: "\\frac{7}{15} + \\frac{5}{8} + \\frac{8}{15}", say: "Two of these already share a denominator." },
          { step: 2, m: "\\frac{7}{15} + \\frac{8}{15} + \\frac{5}{8}", say: "Commutative: change the order so that they meet.",
            ask: { prompt: "Which two fractions are easiest to add first?", answer: 0,
                   options: [{ t: "$\\frac{7}{15}$ and $\\frac{8}{15}$" }, { t: "$\\frac{7}{15}$ and $\\frac{5}{8}$", fb: "Those need an LCD of 120. The fifteenths add at once." }] } },
          { step: 3, m: "\\frac{15}{15} + \\frac{5}{8}", say: "$7 + 8 = 15$ fifteenths." },
          { step: 3, m: "1\\frac{5}{8}", say: "One whole, and five eighths." }] },
        gate: true, then: "No common denominator was needed at all." },
      { type: "guided", kicker: "Together",
        prompt: "Now you multiply $25 \\cdot 37 \\cdot 4$ the easy way.",
        how: HOW_7_2, skill: "Use the properties",
        steps: [
          { step: 1, ask: "Which two factors multiply to a round number?", type: "choice", answer: 0,
            options: [{ t: "25 and 4" }, { t: "25 and 37", fb: "$25 \\cdot 37 = 925$: not easy." }, { t: "37 and 4", fb: "$37 \\cdot 4 = 148$: not round." }],
            m: "25 \\cdot 37 \\cdot 4", say: "$25 \\cdot 4 = 100$." },
          { step: 2, ask: "Swapping 37 and 4 changes the order. Which property allows it?", type: "choice", answer: 0,
            options: [{ t: "Commutative" }, { t: "Associative", fb: "Associative changes the grouping. A swap changes the order." }],
            m: "25 \\cdot 4 \\cdot 37", say: "Commutative property of multiplication." },
          { step: 3, ask: "$25 \\cdot 4 = 100$. What is $100 \\cdot 37$?", type: "num", answer: 3700, near: [big(3700), { v: 370, fb: "100 has two zeros." }], hint: "Write two zeros after 37.",
            m: "100 \\cdot 37 = 3700", say: "The whole product, in your head." }],
        why: "Spot, reorder, compute. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Use the properties to add quickly. $$36 + 58 + 64$$", answer: 158, skill: "Use the properties",
        near: [{ v: 148, fb: "$36 + 64 = 100$, and then add 58." }], hints: ["$36 + 64$ first."], why: "$(36 + 64) + 58 = 100 + 58 = 158$." },
      { type: "expr", prompt: "The associative property lets you regroup a product. Simplify $6(9x)$.",
        answer: "54x", shown: "54x", form: "simplified", skill: "Simplify with the properties",
        near: [{ v: "15x", fb: "Multiply 6 and 9. Do not add them." }], keys: [["$x$", "x"]], placeholder: "Use x",
        hints: ["$(6 \\cdot 9)x$."], why: "$6(9x) = (6 \\cdot 9)x = 54x$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The same properties are what let you combine like terms. $$18p + 6q + 15p + 5q$$",
        scene: { type: "walk", how: HOW_7_2, rows: [
          { step: 1, m: "18p + 6q + 15p + 5q", say: "The like terms are not next to each other." },
          { step: 2, m: "18p + 15p + 6q + 5q", say: "Commutative: reorder so that like terms meet." },
          { step: 3, m: "33p + 11q", say: "Add the coefficients of each kind." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "Which property does each equation show?",
        bins: ["Commutative", "Associative"],
        cards: [{ t: "$4 + 9 = 9 + 4$", bin: 0, fb: "The order changed." },
                { t: "$(2 \\cdot 5) \\cdot 7 = 2 \\cdot (5 \\cdot 7)$", bin: 1, fb: "The order is the same. Only the grouping changed." },
                { t: "$xy = yx$", bin: 0, fb: "The order changed." },
                { t: "$(a + 3) + 8 = a + (3 + 8)$", bin: 1, fb: "The order is the same. Only the grouping changed." }],
        skill: "Name the property", hints: ["Did the order change, or only the parentheses?"],
        why: "Commutative changes the order. Associative changes the grouping." },
      { type: "choice", kicker: "Find the error",
        prompt: "Max says $(12 - 5) - 2 = 12 - (5 - 2)$, by the associative property. What is wrong?",
        options: [{ t: "Subtraction is not associative: the left side is 5 and the right side is 9." },
                  { t: "He should have used the commutative property.", fb: "Subtraction is not commutative either." },
                  { t: "Nothing. It is right.", fb: "Work out each side: $7 - 2$ and $12 - 3$." }],
        answer: 0, skill: "Name the property", hints: ["Work out each side."], why: "$7 - 2 = 5$, but $12 - 3 = 9$." },
      { type: "num", kicker: "Use it", prompt: "Three items cost \\$2.50, \\$4.99 and \\$7.50. Add them the quick way. What is the total, in dollars?",
        post: "dollars", answer: 14.99, tol: 1e-9, skill: "Use the properties",
        near: [{ v: 13.99, tol: 1e-9, fb: "$2.50 + 7.50 = 10$, and then add 4.99." }], hints: ["$2.50 + 7.50$ first."], why: "$10 + 4.99 = 14.99$." }
    ]
  });

  /* ======================================================= 7.3 · Distributive property */
  var HOW_7_3 = [["Multiply", "Multiply the number outside by **every** term inside the parentheses."],
                 ["Signs", "Keep each term's sign. A minus sign in front of a group changes every sign inside it."],
                 ["Combine", "Combine any like terms."]];
  LESSONS.push({
    title: "Distributive property",
    blurb: "Book 7.3 · Removing parentheses with the distributive property, and checking by evaluating.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$3 \\cdot 14$ can be split up as $3 \\cdot 10 + 3 \\cdot 4$. What is it?", answer: 42, skill: "Distributive property",
        near: [{ v: 34, fb: "The 3 multiplies both parts: $30 + 12$." }], hints: ["$30 + 12$."], why: "$3 \\cdot 10 + 3 \\cdot 4 = 30 + 12 = 42$." },
      { type: "learn", kicker: "Explore", prompt: "Are $3(x + 4)$ and $3x + 12$ really the same? Try at least **three** values of $x$ and compare the two sides.",
        scene: { type: "tester", a: "3(x + 4)", b: "3x + 12", x: { v: 1, min: -5, max: 10 }, goal: "agree3" }, gate: true,
        after: "They agree for every $x$: the two expressions are equivalent." },
      { type: "learn", kicker: "The idea",
        prompt: "That is the **distributive property**: $a(b + c) = ab + ac$. The number outside multiplies every term inside. It removes parentheses even when the terms inside cannot be combined.",
        scene: { type: "method", how: HOW_7_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one distributed. $$-2(4y + 1)$$",
        scene: { type: "walk", how: HOW_7_3, rows: [
          { step: 1, m: "-2(4y + 1)", say: "The $-2$ is outside the parentheses." },
          { step: 1, m: "-2 \\cdot 4y + (-2) \\cdot 1", say: "It multiplies each term inside.",
            ask: { prompt: "Which terms does the $-2$ multiply?", answer: 0,
                   options: [{ t: "Both $4y$ and 1" }, { t: "Only $4y$", fb: "Every term inside the parentheses is multiplied." }] } },
          { step: 2, m: "-8y + (-2)", say: "$-2 \\cdot 4y = -8y$ and $-2 \\cdot 1 = -2$." },
          { step: 2, m: "-8y - 2", say: "Adding a negative is subtracting." }] },
        gate: true, then: "The most common slip is to multiply only the first term." },
      { type: "guided", kicker: "Together",
        prompt: "Now you simplify $8 - 2(x + 3)$.",
        how: HOW_7_3, skill: "Distribute",
        steps: [
          { step: 1, ask: "Multiplication comes before subtraction. Which terms does the $-2$ multiply?", type: "choice", answer: 0,
            options: [{ t: "Both $x$ and 3" }, { t: "Only $x$", fb: "Every term inside the parentheses is multiplied." }, { t: "The 8 as well", fb: "The 8 is outside the parentheses." }],
            m: "8 + (-2)(x) + (-2)(3)", say: "The $-2$ goes to each term inside." },
          { step: 2, ask: "What is $(-2)(3)$?", type: "num", answer: -6, near: [{ v: 6, fb: "Different signs give a negative product." }], hint: "Different signs.",
            m: "8 - 2x - 6", say: "Each product keeps its sign." },
          { step: 3, ask: "Combine the constants: $8 - 6$.", type: "num", answer: 2, hint: "$8 - 6$.",
            m: "-2x + 2", say: "$8 - 6 = 2$, and $-2x$ has no like term." }],
        why: "Multiply, signs, combine. Now two on your own." },
      { type: "expr", kicker: "On your own", prompt: "Simplify $5(2n + 3)$.", answer: "10n+15", shown: "10n + 15", form: "simplified", skill: "Distribute",
        near: [{ v: "10n+3", fb: "The 5 multiplies the 3 as well." }, { v: "7n+8", fb: "Multiply by 5. Do not add it." }], keys: [["$n$", "n"], ["$+$", "+"]], placeholder: "Use n",
        hints: ["$5 \\cdot 2n$ and $5 \\cdot 3$."], why: "$5 \\cdot 2n + 5 \\cdot 3 = 10n + 15$." },
      { type: "choice", prompt: "A minus sign in front of parentheses is $-1$. Simplify $-(a - 7)$.",
        options: [{ t: "$-a + 7$" }, { t: "$-a - 7$", fb: "The minus sign changes **both** signs: $-1 \\cdot (-7) = +7$." }, { t: "$a - 7$", fb: "The minus sign cannot just be dropped." }],
        answer: 0, skill: "Distribute a negative", hints: ["$-1 \\cdot a$ and $-1 \\cdot (-7)$."], why: "$-1(a) + (-1)(-7) = -a + 7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two sets of parentheses, the second with a minus sign in front. $$4(x - 8) - (x + 3)$$",
        scene: { type: "walk", how: HOW_7_3, rows: [
          { step: 1, m: "4(x - 8) - (x + 3)", say: "Distribute the 4 first." },
          { step: 1, m: "4x - 32 - (x + 3)", say: "$4 \\cdot x$ and $4 \\cdot (-8)$." },
          { step: 2, m: "4x - 32 - x - 3", say: "The minus sign is $-1$: it changes both signs inside." },
          { step: 3, m: "3x - 35", say: "$4x - x = 3x$, and $-32 - 3 = -35$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Evaluate $3(y + 6)$ and $3y + 18$ when $y = 10$. Both give the same value. What is it?", answer: 48, skill: "Evaluate both ways",
        near: [{ v: 36, fb: "$3(10 + 6)$ is $3 \\cdot 16$." }], hints: ["$3 \\cdot 16$, or $30 + 18$."], why: "$3(16) = 48$ and $30 + 18 = 48$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["2 + 3(x + 5)", "2 + 3x + 5", "3x + 7"], answer: 1, fix: "2 + 3x + 15",
        fb: { 0: GIVEN, 2: LATER }, skill: "Distribute",
        hints: ["Did the 3 multiply every term inside?"],
        why: "$3 \\cdot 5 = 15$, so it is $2 + 3x + 15 = 3x + 17$." },
      { type: "num", kicker: "Use it", prompt: "The distributive property is mental arithmetic too. Find $7 \\cdot 98$ as $7(100 - 2)$.", answer: 686, skill: "Distributive property",
        near: [{ v: 698, fb: "The 7 multiplies the 2 as well: $700 - 14$." }], hints: ["$700 - 14$."], why: "$7 \\cdot 100 - 7 \\cdot 2 = 700 - 14 = 686$." }
    ]
  });
  /* ====================================== 7.4 · Properties of identity, inverses and zero */
  var HOW_7_4 = [["Spot", "Look for a pair that makes 0 (opposites) or 1 (reciprocals), or a 0 or a 1 already there."],
                 ["Apply", "Opposites add to 0. Reciprocals multiply to 1. Anything times 0 is 0."],
                 ["Finish", "Adding 0 or multiplying by 1 changes nothing: simplify what is left."]];
  LESSONS.push({
    title: "Identity, inverses and zero",
    blurb: "Book 7.4 · The identity properties, opposites and reciprocals, and what zero does in each operation.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $-9 + 9$?", answer: 0, skill: "Inverse property",
        near: [{ v: 18, fb: "The signs differ: subtract the absolute values." }, { v: -18, fb: "The signs differ: subtract the absolute values." }], hints: ["A number plus its opposite."], why: "Opposites add to 0." },
      { type: "learn", kicker: "The idea",
        prompt: "0 is the **additive identity**: adding 0 changes nothing. 1 is the **multiplicative identity**. A number's **opposite** adds with it to 0, and its **reciprocal** multiplies with it to 1. And anything times 0 is 0.",
        scene: { type: "method", how: HOW_7_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the properties do the work. $$\\frac{7}{15} \\cdot \\frac{8}{23} \\cdot \\frac{15}{7}$$",
        scene: { type: "walk", how: HOW_7_4, rows: [
          { step: 1, m: "\\frac{7}{15} \\cdot \\frac{8}{23} \\cdot \\frac{15}{7}", say: "The first and the last are reciprocals." },
          { step: 2, m: "\\frac{7}{15} \\cdot \\frac{15}{7} \\cdot \\frac{8}{23}", say: "Reorder so that they meet.",
            ask: { prompt: "What is a number times its reciprocal?", answer: 0,
                   options: [{ t: "1" }, { t: "0", fb: "It is opposites that **add** to 0. Reciprocals multiply to 1." }] } },
          { step: 2, m: "1 \\cdot \\frac{8}{23}", say: "The inverse property of multiplication." },
          { step: 3, m: "\\frac{8}{23}", say: "1 is the multiplicative identity." }] },
        gate: true, then: "Nothing had to be multiplied out." },
      { type: "guided", kicker: "Together",
        prompt: "Now you simplify $-84n + (-73n) + 84n$.",
        how: HOW_7_4, skill: "Use inverses",
        steps: [
          { step: 1, ask: "Which two terms are opposites?", type: "choice", answer: 0,
            options: [{ t: "$-84n$ and $84n$" }, { t: "$-84n$ and $-73n$", fb: "Opposites have the same size and different signs." }],
            m: "-84n + 84n + (-73n)", say: "Reorder so that the opposites meet." },
          { step: 2, ask: "What is $-84n + 84n$?", type: "num", answer: 0, hint: "Opposites.",
            m: "0 + (-73n)", say: "Opposites add to 0." },
          { step: 3, ask: "Adding 0 changes nothing. What is left?", type: "choice", answer: 0,
            options: [{ t: "$-73n$" }, { t: "$0$", fb: "Only the two opposites made 0. The third term remains." }, { t: "$73n$", fb: "The term keeps its sign." }],
            m: "-73n", say: "0 is the additive identity." }],
        why: "Spot, apply, finish. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Zero in a multiplication or a division: which of these equal 0, and which have no value?",
        bins: ["Equals 0", "No value: division by zero"],
        cards: [{ t: "$0 \\div 5$", bin: 0, fb: "Nothing shared among 5 is nothing each." },
                { t: "$5 \\div 0$", bin: 1, fb: "No number times 0 gives 5." },
                { t: "$\\frac{0}{-3}$", bin: 0, fb: "Zero divided by a non-zero number is 0." },
                { t: "$\\frac{-3}{0}$", bin: 1, fb: "No number times 0 gives $-3$." },
                { t: "$0 \\cdot 17$", bin: 0, fb: "Anything times 0 is 0." }],
        skill: "Properties of zero", hints: ["Is the zero being divided, or is it doing the dividing?"],
        why: "Zero can be divided. Nothing can be divided **by** zero." },
      { type: "choice", prompt: "What is the **multiplicative inverse** of $-\\frac{1}{6}$?",
        options: [{ t: "$-6$" }, { t: "$6$", fb: "The product must be $+1$, so the reciprocal has the same sign." }, { t: "$\\frac{1}{6}$", fb: "That is its opposite: the additive inverse." }],
        answer: 0, skill: "Inverse property", hints: ["Turn it over and keep the sign."], why: "$-\\frac{1}{6} \\cdot (-6) = 1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The rules for zero hold for expressions too. Compare these two. $$\\frac{0}{n + 5} \\qquad \\frac{10 - 3p}{0}$$",
        scene: { type: "walk", how: [["Where?", "Find where the zero is: in the numerator or in the denominator."],
                                    ["Rule", "Zero divided by a non-zero number is 0. Nothing can be divided by zero."],
                                    ["Why", "Check with a multiplication."]], rows: [
          { step: 1, m: "\\frac{0}{n + 5} \\qquad \\frac{10 - 3p}{0}", say: "On the left, zero is the numerator. On the right, it is the denominator." },
          { step: 2, m: "\\frac{0}{n + 5} = 0", say: "Zero shared out is zero each, as long as $n + 5$ is not 0." },
          { step: 2, m: "\\frac{10 - 3p}{0} \\text{ has no value}", say: "A division by zero is undefined." },
          { step: 3, m: "? \\cdot 0 = 10 - 3p", say: "Any number times 0 is 0, so no number can fill the gap." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Simplify $\\frac{3}{4} \\cdot \\frac{4}{3}(6x + 12)$.",
        options: [{ t: "$6x + 12$" }, { t: "$0$", fb: "Reciprocals multiply to 1, not 0." }, { t: "$\\frac{9}{16}(6x + 12)$", fb: "$\\frac{3}{4} \\cdot \\frac{4}{3} = \\frac{12}{12} = 1$." }],
        answer: 0, skill: "Use inverses", hints: ["$\\frac{3}{4} \\cdot \\frac{4}{3} = 1$."], why: "$1(6x + 12) = 6x + 12$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ben says $\\frac{7}{0} = 0$, “because there is nothing to divide by.” What is wrong?",
        options: [{ t: "A division by zero is undefined: no number times 0 gives 7. It is $\\frac{0}{7}$ that equals 0." },
                  { t: "It should be 7.", fb: "$7 \\cdot 0$ is 0, not 7, so 7 is not the answer either." },
                  { t: "Nothing. It is right.", fb: "Check by multiplying: $0 \\cdot 0$ is not 7." }],
        answer: 0, skill: "Properties of zero", hints: ["Check a division by multiplying back."], why: "No number times 0 gives 7." },
      { type: "num", kicker: "Use it", prompt: "Use opposites to add quickly. $$47 + 19 + (-47)$$", answer: 19, skill: "Use inverses",
        near: [{ v: 113, fb: "$-47$ is negative: it cancels the 47." }], hints: ["$47 + (-47) = 0$."], why: "$0 + 19 = 19$." }
    ]
  });

  /* ===================================================== 7.5 · Systems of measurement */
  var HOW_7_5 = [["Factor", "Write a conversion factor equal to 1, with the unit you want on top and the unit you have below."],
                 ["Multiply", "Multiply the measurement by it."],
                 ["Cancel", "Cancel the common units and simplify."]];
  LESSONS.push({
    title: "Systems of measurement",
    blurb: "Book 7.5 · Converting units in the U.S. and metric systems, between the two, and between Fahrenheit and Celsius.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "There are 12 inches in 1 foot. How many inches are in 3 feet?", post: "inches", answer: 36, skill: "Unit conversion",
        near: [{ v: 4, fb: "Feet are bigger than inches, so there are more inches: multiply." }], hints: ["$3 \\cdot 12$."], why: "$3 \\cdot 12 = 36$." },
      { type: "learn", kicker: "Explore", prompt: "Convert 66 inches to feet. Click the conversion you need. If the inches do not cancel, **flip** it.",
        scene: { type: "units", start: [66, "in", ""], target: ["ft", ""], factors: [[12, "in", 1, "ft"], [3, "ft", 1, "yd"]], answer: [[0, true]], gate: true }, gate: true,
        after: "The unit you want to remove must sit on the opposite level, so that it cancels." },
      { type: "learn", kicker: "The idea",
        prompt: "To convert units, multiply by 1 in disguise: a fraction such as $\\frac{1 \\text{ ft}}{12 \\text{ in}}$, whose top and bottom are equal. Choose it so the unit you have cancels and the unit you want is left.",
        scene: { type: "method", how: HOW_7_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch 4.5 pounds converted to ounces. (1 pound = 16 ounces.)",
        scene: { type: "walk", how: HOW_7_5, rows: [
          { step: 1, m: "4.5 \\text{ lb}", say: "We have pounds, and want ounces." },
          { step: 1, m: "\\frac{16 \\text{ oz}}{1 \\text{ lb}}", say: "Ounces on top, pounds below.",
            ask: { prompt: "Which unit must be in the denominator of the factor?", answer: 0,
                   options: [{ t: "Pounds, to cancel the pounds we have" }, { t: "Ounces", fb: "Then ounces would cancel nothing, and pounds would stay." }] } },
          { step: 2, m: "4.5 \\text{ lb} \\cdot \\frac{16 \\text{ oz}}{1 \\text{ lb}}", say: "Multiplying by 1 does not change the amount." },
          { step: 3, m: "72 \\text{ oz}", say: "The pounds cancel, and $4.5 \\cdot 16 = 72$." }] },
        gate: true, then: "The units tell you whether the factor is the right way up." },
      { type: "guided", kicker: "Together",
        prompt: "Now you convert 350 centimetres to metres. (1 m = 100 cm.)",
        how: HOW_7_5, skill: "Metric conversion",
        steps: [
          { step: 1, ask: "Which factor cancels the centimetres?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1 \\text{ m}}{100 \\text{ cm}}$" }, { t: "$\\frac{100 \\text{ cm}}{1 \\text{ m}}$", fb: "Centimetres must be below, to cancel the centimetres we have." }],
            m: "\\frac{1 \\text{ m}}{100 \\text{ cm}}", say: "Metres on top, centimetres below." },
          { step: 2, ask: "Multiply: what is $350 \\div 100$?", type: "num", answer: 3.5, tol: 1e-9, near: [{ v: 35, fb: "Dividing by 100 moves the point two places." }], hint: "Two places to the left.",
            m: "350 \\text{ cm} \\cdot \\frac{1 \\text{ m}}{100 \\text{ cm}}", say: "$350 \\cdot 1 \\div 100$." },
          { step: 3, ask: "Which unit is left after cancelling?", type: "choice", answer: 0,
            options: [{ t: "Metres" }, { t: "Centimetres", fb: "The centimetres cancel: one above and one below." }],
            m: "3.5 \\text{ m}", say: "In the metric system, a conversion only moves the decimal point." }],
        why: "Factor, multiply, cancel. Now two on your own." },
      { type: "units", kicker: "On your own", prompt: "Convert 3 hours to seconds. Click the conversions you need, and flip any whose units do not cancel.",
        start: [3, "h", ""], target: ["s", ""], factors: [[60, "min", 1, "h"], [60, "s", 1, "min"], [24, "h", 1, "day"]], answer: [[0, false], [1, false]],
        skill: "Unit conversion", hints: ["Hours to minutes, then minutes to seconds."],
        why: "$3 \\cdot 60 \\cdot 60 = 10800$ seconds." },
      { type: "num", prompt: "A recipe needs 2.5 kilograms of flour. How many grams is that? (1 kg = 1000 g.)", post: "grams", answer: 2500, skill: "Metric conversion",
        near: [big(2500), { v: 0.0025, tol: 1e-9, fb: "Grams are smaller than kilograms, so there are more of them: multiply by 1000." }, { v: 250, fb: "1000 has three zeros: move the point three places." }],
        hints: ["$2.5 \\cdot 1000$."], why: "$2.5 \\cdot 1000 = 2500$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Temperatures are converted with a formula, not a single factor. Convert 50° Fahrenheit to Celsius.",
        scene: { type: "walk", how: [["Formula", "Choose the formula: $C = \\frac{5}{9}(F - 32)$, or $F = \\frac{9}{5}C + 32$."],
                                    ["Substitute", "Put the known temperature in."],
                                    ["Simplify", "Follow the order of operations."]], rows: [
          { step: 1, m: "C = \\frac{5}{9}(F - 32)", say: "We know $F$ and want $C$." },
          { step: 2, m: "C = \\frac{5}{9}(50 - 32)", say: "$F = 50$." },
          { step: 3, m: "C = \\frac{5}{9}(18)", say: "Parentheses first." },
          { step: 3, m: "C = 10", say: "$18 \\div 9 = 2$, and $5 \\cdot 2 = 10$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Convert 20° Celsius to Fahrenheit, using $F = \\frac{9}{5}C + 32$.", post: "°F", answer: 68, skill: "Temperature",
        near: [{ v: 93.6, tol: 1e-9, fb: "Multiply before you add: $\\frac{9}{5} \\cdot 20 = 36$." }, { v: 4, fb: "That subtracts 32. This formula adds it." }],
        hints: ["$\\frac{9}{5} \\cdot 20 = 36$."], why: "$36 + 32 = 68$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Converting 5 feet to inches. Tap the line where the work **first** goes wrong.",
        lines: ["5 \\text{ ft}", "5 \\text{ ft} \\cdot \\frac{1 \\text{ ft}}{12 \\text{ in}}", "\\frac{5}{12} \\text{ in}"], answer: 1, fix: "5 \\text{ ft} \\cdot \\frac{12 \\text{ in}}{1 \\text{ ft}}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Unit conversion",
        hints: ["Which unit has to cancel?"],
        why: "Feet must be below, to cancel: $5 \\cdot 12 = 60$ inches." },
      { type: "num", kicker: "Use it", prompt: "A race is 10 kilometres long. Using 1 mile ≈ 1.6 km, about how many miles is that?", post: "miles", answer: 6.25, tol: 1e-9, skill: "Between systems",
        near: [{ v: 16, fb: "A mile is longer than a kilometre, so there are fewer miles: divide by 1.6." }],
        hints: ["$10 \\text{ km} \\cdot \\frac{1 \\text{ mi}}{1.6 \\text{ km}}$."], why: "$10 \\div 1.6 = 6.25$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "pa7-classify", title: "Rational or irrational?", lesson: 2,
      gen: function (R) {
        var k = R.int(2, 12), n = k * k + R.int(1, 2 * k), a = R.int(1, 9), b = R.int(2, 9);
        var Q = R.pick([["\\sqrt{" + k * k + "}", true, "$\\sqrt{" + k * k + "} = " + k + "$, an integer."],
                        ["\\sqrt{" + n + "}", false, n + " is not a perfect square, so its root never stops and never repeats."],
                        ["-\\frac{" + a + "}{" + (a + b) + "}", true, "It is a ratio of two integers."],
                        ["0." + a + "\\overline{" + b + "}", true, "It repeats, so it is rational."],
                        ["" + a + "." + b + k, true, "It stops, so it is rational."],
                        ["\\pi", false, "Its decimal never stops and never repeats."],
                        ["-" + k, true, "An integer is the ratio of itself to 1."],
                        ["-\\sqrt{" + n + "}", false, n + " is not a perfect square, so its root never stops and never repeats."]]);
        return mc(R, { prompt: "Is $" + Q[0] + "$ rational or irrational?", right: Q[1] ? "Rational" : "Irrational", wrong: [{ t: Q[1] ? "Irrational" : "Rational", fb: Q[2] }], keep: true,
          hints: ["Can it be written as a ratio of two integers?"], why: Q[2] });
      } },
    { id: "pa7-property", title: "Name the property", lesson: 3,
      gen: function (R) {
        var a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 9), NAMES = ["Commutative property of addition", "Commutative property of multiplication", "Associative property of addition", "Associative property of multiplication"], k = R.int(0, 3);
        if (a === b) b = a + 1;
        var tex = [a + " + " + b + " = " + b + " + " + a, a + " \\cdot " + b + " = " + b + " \\cdot " + a,
                   "(" + a + " + " + b + ") + " + c + " = " + a + " + (" + b + " + " + c + ")", "(" + a + " \\cdot " + b + ") \\cdot " + c + " = " + a + " \\cdot (" + b + " \\cdot " + c + ")"][k];
        return mc(R, { prompt: "Which property does this show? $$" + tex + "$$", right: NAMES[k],
          wrong: NAMES.filter(function (n, i) { return i !== k; }).map(function (n, i) { return { t: n, fb: (n.indexOf("Comm") === 0) === (k < 2) ? "Look at the operation: is it adding or multiplying?" : k < 2 ? "The order changed, and there is no regrouping." : "The order is the same. Only the grouping changed." }; }),
          hints: ["Did the order change, or only the parentheses?"], why: k < 2 ? "The order changed: commutative." : "Only the grouping changed: associative." });
      } },
    { id: "pa7-distribute", title: "Use the distributive property", lesson: 4,
      gen: function (R) {
        var a = R.int(2, 9) * R.pick([1, 1, -1]), b = R.int(1, 6), c = R.int(1, 9) * R.pick([1, -1]), v = R.pick(["x", "n", "y", "a"]);
        var inside = poly([[b, v], [c, ""]]), ans = poly([[a * b, v], [a * c, ""]]);
        return { type: "expr", prompt: "Simplify. $$" + a + "(" + inside + ")$$", answer: clean(ans), shown: ans, form: "simplified", keys: [["$" + v + "$", v], ["$+$", "+"], ["$-$", "-"]], placeholder: "Use " + v,
          near: [{ v: clean(poly([[a * b, v], [c, ""]])), fb: "The " + nm(a) + " multiplies **every** term inside, the " + nm(c) + " as well." }, { v: clean(poly([[a * b, v], [-a * c, ""]])), fb: "Check the sign of $" + a + " \\cdot " + (c < 0 ? "(" + c + ")" : c) + "$." }],
          hints: ["$" + a + " \\cdot " + (b === 1 ? "" : b) + v + "$ and $" + a + " \\cdot " + (c < 0 ? "(" + c + ")" : c) + "$."], why: "$" + ans + "$." };
      } },
    { id: "pa7-zero", title: "Identities, inverses and zero", lesson: 5,
      gen: function (R) {
        var a = R.int(12, 95), b = R.int(3, 40), k = R.int(2, 12), kind = R.int(0, 2);
        if (kind === 0) return { type: "num", prompt: "Use opposites to add quickly. $$" + a + " + " + b + " + (-" + a + ")$$", answer: b,
          near: [{ v: 2 * a + b, fb: "$-" + a + "$ is negative: it cancels the " + a + "." }], hints: ["$" + a + " + (-" + a + ") = 0$."], why: "$0 + " + b + " = " + b + "$." };
        if (kind === 1) { var F = R.pick([[2, 3], [3, 4], [5, 8], [7, 9], [4, 5]]);
          return { type: "num", prompt: "Use reciprocals to multiply quickly. $$\\frac{" + F[0] + "}{" + F[1] + "} \\cdot " + b + " \\cdot \\frac{" + F[1] + "}{" + F[0] + "}$$", answer: b,
            near: [{ v: 0, fb: "Reciprocals multiply to 1, not 0." }], hints: ["$\\frac{" + F[0] + "}{" + F[1] + "} \\cdot \\frac{" + F[1] + "}{" + F[0] + "} = 1$."], why: "$1 \\cdot " + b + " = " + b + "$." }; }
        var zeroTop = R.chance(0.5);
        return mc(R, { prompt: "What is $" + (zeroTop ? "0 \\div " + k : k + " \\div 0") + "$?", right: zeroTop ? "0" : "It has no value",
          wrong: [{ t: zeroTop ? "It has no value" : "0", fb: zeroTop ? "Zero can be divided: nothing shared among " + k + " is nothing each." : "No number times 0 gives " + k + "." }, { t: String(k), fb: zeroTop ? "$" + k + " \\cdot " + k + "$ is not 0." : "$" + k + " \\cdot 0$ is 0, not " + k + "." }],
          hints: ["Check by multiplying back."], why: zeroTop ? "$0 \\cdot " + k + " = 0$, so the quotient is 0." : "No number times 0 gives " + k + ", so the division has no answer." });
      } },
    { id: "pa7-convert", title: "Convert units of measurement", lesson: 6,
      gen: function (R) {
        var U = R.pick([[12, "feet", "inches"], [3, "yards", "feet"], [16, "pounds", "ounces"], [60, "hours", "minutes"], [1000, "kilometres", "metres"], [100, "metres", "centimetres"], [1000, "kilograms", "grams"], [1000, "litres", "millilitres"]]);
        var n = R.pick([2, 3, 4, 5, 6, 7, 8, 9, 2.5, 4.5, 1.5]), down = R.chance(0.5), have = down ? n : Math.round(n * U[0] * 10) / 10, ans = down ? Math.round(n * U[0] * 10) / 10 : n;
        return { type: "num", prompt: "Convert " + num(have) + " " + U[down ? 1 : 2] + " to " + U[down ? 2 : 1] + ". (1 " + U[1].replace(/s$/, "").replace("feet", "foot") + " = " + U[0] + " " + U[2] + ".)", post: U[down ? 2 : 1], answer: ans, tol: 1e-9,
          near: nearBig(ans, [{ v: down ? n / U[0] : have * U[0], tol: 1e-6, fb: down ? "The new unit is smaller, so there are more of them: multiply by " + U[0] + "." : "The new unit is bigger, so there are fewer of them: divide by " + U[0] + "." }]),
          hints: [down ? "$" + num(have) + " \\cdot " + U[0] + "$." : "$" + num(have) + " \\div " + U[0] + "$."], why: "$" + num(have) + (down ? " \\cdot " : " \\div ") + U[0] + " = " + num(ans) + "$." };
      } }
  ];
  L.unit("prealg", 7, {
    title: "The Properties of Real Numbers",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Rational and irrational numbers, and the commutative, associative and distributive properties.",
        skills: ["pa7-classify", "pa7-property", "pa7-distribute"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Identities, inverses and zero, and converting units.",
        skills: ["pa7-zero", "pa7-convert"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:7", {
    2: { name: "Real numbers", frame: "A [[rational]] number is a ratio of two integers: its decimal stops or [[repeats]]. An [[irrational]] number's decimal does neither. Together they make the [[real]] numbers.",
         chips: ["whole", "rounds"] },
    3: { name: "Commutative and associative", frame: "The [[commutative]] property lets you change the order of an addition or a multiplication. The [[associative]] property lets you change the [[grouping]]. Neither works for [[subtraction]] or division.",
         chips: ["distributive", "sign"] },
    4: { name: "Distributive property", frame: "$a(b + c) = ab + ac$: the number outside multiplies [[every]] term inside. A minus sign in front of parentheses changes [[both]] signs.",
         chips: ["the first", "neither"], fb: { "the first": "Multiplying only the first term is the classic slip." } },
    5: { name: "Identities, inverses and zero", frame: "Adding [[0]] or multiplying by [[1]] changes nothing. Opposites add to 0, and [[reciprocals]] multiply to 1. Zero divided by a number is 0, but division [[by zero]] has no value.",
         chips: ["opposites", "by one"] },
    6: { name: "Unit conversion", frame: "A conversion factor is a fraction equal to [[1]]. Write it with the unit you [[want]] on top and the unit you [[have]] below, so that the old unit [[cancels]].",
         chips: ["0", "doubles"] }
  });
})();
