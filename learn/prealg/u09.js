/* ==========================================================================
   Prealgebra — Unit 9: Math Models and Geometry. See lab/core.js for the
   format.

   Follows OpenStax Prealgebra 2e, Chapter 9, section for section: the
   readiness check, then 9.1 to 9.7. Each lesson teaches the book's own steps:
   the method, a worked example to watch, one done together, then on your own,
   a harder case, find the error, use it, and the concept built at the end.

   A strategy for word problems (9.1), coin and ticket problems (9.2), angles,
   triangles and the Pythagorean Theorem (9.3), perimeter and area (9.4),
   circles and irregular figures (9.5), volume and surface area (9.6), and
   solving a formula for one of its letters (9.7).

   Adapted from OpenStax, Prealgebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Eight lessons, seven skills, three quizzes, and the unit test.
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
    blurb: "Book: Chapter 9 Be Prepared · Translating and solving, evaluating a formula, and square roots.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · Translate and solve", prompt: "Which expression is “five less than twice $n$”?",
        options: [{ t: "$2n - 5$" }, { t: "$5 - 2n$", fb: "“Five less than” takes 5 away from what follows." }, { t: "$2(n - 5)$", fb: "Only $n$ is doubled. Then 5 is taken away." }],
        answer: 0, skill: "Translate to algebra", hints: ["Twice $n$ is $2n$. Then take 5 away."], why: "$2n - 5$." },
      { type: "num", prompt: "Solve $3x + 8 = 14$.", pre: "$x =$", answer: 2, skill: "Solve an equation",
        near: [{ v: 22 / 3, tol: 1e-6, fb: "Subtract 8 from both sides first: $3x = 6$." }], hints: ["$3x = 6$."], why: "$3x = 6$, so $x = 2$." },
      { type: "num", kicker: "Check 2 · Formulas", prompt: "Evaluate $2l + 2w$ when $l = 7$ and $w = 4$.", answer: 22, skill: "Evaluate an expression",
        near: [{ v: 28, fb: "That is $l \\cdot w$. Here each is doubled, then they are added." }], hints: ["$2(7) + 2(4)$."], why: "$14 + 8 = 22$." },
      { type: "num", prompt: "Multiply $0.25 \\cdot 12$.", answer: 3, skill: "Multiply decimals",
        near: [{ v: 30, fb: "$25 \\cdot 12 = 300$, with two decimal places." }], hints: ["A quarter of 12."], why: "$0.25 \\cdot 12 = 3$." },
      { type: "num", kicker: "Check 3 · Roots and π", prompt: "Simplify $\\sqrt{9 + 16}$.", answer: 5, skill: "Square roots",
        near: [{ v: 7, fb: "Add under the radical first: $\\sqrt{25}$." }], hints: ["$\\sqrt{25}$."], why: "$\\sqrt{25} = 5$." },
      { type: "num", prompt: "Use $\\pi \\approx 3.14$. What is $3.14 \\cdot 10$?", answer: 31.4, tol: 1e-9, skill: "Powers of 10",
        near: [{ v: 314, fb: "One zero: move the point one place." }], hints: ["Move the point one place to the right."], why: "$3.14 \\cdot 10 = 31.4$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 9.1**. If **check 1** slipped, see Unit 8. If **check 2** slipped, see lessons 2.2 and 5.2. If **check 3** slipped, see lessons 5.3 and 5.7.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================================================ 9.1 · Use a problem solving strategy */
  var HOW_9_1 = [["Read", "Read the problem, and identify what you are looking for."],
                 ["Name", "Choose a variable to stand for it."],
                 ["Translate", "Put all the information in one sentence, then turn it into an equation."],
                 ["Solve", "Solve the equation."],
                 ["Check", "Check the answer in the problem, and answer in a sentence."]];
  LESSONS.push({
    title: "Use a problem solving strategy",
    blurb: "Book 9.1 · One strategy for every word problem, tried out on number problems.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which expression is “seven more than twice a number $n$”?",
        options: [{ t: "$2n + 7$" }, { t: "$2(n + 7)$", fb: "Only the number is doubled. Then 7 is added." }, { t: "$7n + 2$", fb: "“Twice” multiplies the number by 2." }],
        answer: 0, skill: "Translate to algebra", hints: ["Twice $n$ is $2n$."], why: "$2n$, and then 7 more." },
      { type: "learn", kicker: "The idea",
        prompt: "A word problem is solved the same way every time. Read it, name the unknown, translate the words into an equation, solve, and then check that the answer makes sense in the story.",
        scene: { type: "method", how: HOW_9_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "A jacket is on sale for \\$36, which is three quarters of its original price. Watch the original price found.",
        scene: { type: "walk", how: HOW_9_1, rows: [
          { step: 1, m: "\\text{Find the original price.}", say: "That is what the question asks for." },
          { step: 2, m: "p = \\text{the original price}", say: "Name it." },
          { step: 3, m: "36 = \\frac{3}{4}p", say: "“36 is three quarters of the original price.”",
            ask: { prompt: "Which word becomes the equals sign?", answer: 0,
                   options: [{ t: "“is”" }, { t: "“of”", fb: "“Of” becomes a multiplication." }] } },
          { step: 4, m: "p = 48", say: "Multiply both sides by $\\frac{4}{3}$: $36 \\cdot \\frac{4}{3} = 48$." },
          { step: 5, m: "\\frac{3}{4}(48) = 36", say: "True, and 48 is more than the sale price. The jacket was 48 dollars." }] },
        gate: true, then: "The check is done in the words of the problem, not only in the equation." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. **The sum of twice a number and seven is 15. Find the number.**",
        how: HOW_9_1, skill: "Number problems",
        steps: [
          { step: 1, ask: "What are you asked to find?", type: "choice", answer: 0,
            options: [{ t: "A number" }, { t: "A sum", fb: "The sum is given: it is 15." }],
            m: "\\text{Find the number.}", say: "The unknown is the number." },
          { step: 2, ask: "Which is a sensible way to name it?", type: "choice", answer: 0,
            options: [{ t: "Let $n$ = the number" }, { t: "Let $n$ = 15", fb: "15 is already known. The variable stands for what is unknown." }],
            m: "n = \\text{the number}", say: "One letter for the one unknown." },
          { step: 3, ask: "Translate “the sum of twice a number and seven is 15”.", type: "choice", answer: 0,
            options: [{ t: "$2n + 7 = 15$" }, { t: "$2(n + 7) = 15$", fb: "Only the number is doubled." }, { t: "$2n = 7 + 15$", fb: "The sum of $2n$ and 7 is on one side. “Is 15” puts 15 on the other." }],
            m: "2n + 7 = 15", say: "Twice the number, plus seven, is 15." },
          { step: 4, ask: "Solve it. What is $n$?", type: "num", answer: 4, near: [{ v: 11, fb: "Subtract 7, then divide by 2." }], hint: "$2n = 8$.",
            m: "n = 4", say: "$2n = 8$, so $n = 4$." },
          { step: 5, ask: "Check: what is twice 4, plus 7?", type: "num", answer: 15, hint: "$8 + 7$.",
            m: "2(4) + 7 = 15", say: "It matches. The number is 4." }],
        why: "Read, name, translate, solve, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "The difference of a number and six is 13. Find the number.", answer: 19, skill: "Number problems",
        near: [{ v: 7, fb: "The equation is $n - 6 = 13$. Add 6 to both sides." }],
        hints: ["$n - 6 = 13$."], why: "$13 + 6 = 19$." },
      { type: "num", prompt: "One number is five more than another, and their sum is 21. Find the **smaller** number.", answer: 8, skill: "Number problems",
        near: [{ v: 13, fb: "That is the larger number. The question asks for the smaller." }, { v: 16, fb: "The two numbers are $n$ and $n + 5$: $2n + 5 = 21$." }],
        hints: ["$n + (n + 5) = 21$."], why: "$2n = 16$, so $n = 8$. The other is 13." },
      { type: "learn", kicker: "A harder case",
        prompt: "**Consecutive integers** follow one another, like 14 and 15. The sum of two consecutive integers is 47. Find them.",
        scene: { type: "walk", how: HOW_9_1, rows: [
          { step: 1, m: "\\text{Find two consecutive integers.}", say: "Two unknowns, but they are linked." },
          { step: 2, m: "n \\quad \\text{and} \\quad n + 1", say: "Consecutive integers differ by 1, so one letter is enough." },
          { step: 3, m: "n + (n + 1) = 47", say: "Their sum is 47." },
          { step: 4, m: "2n + 1 = 47", say: "Combine like terms." },
          { step: 4, m: "n = 23", say: "$2n = 46$." },
          { step: 5, m: "23 + 24 = 47", say: "The integers are 23 and 24." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The sum of three consecutive integers is 42. Find the **smallest**.", answer: 13, skill: "Consecutive integers",
        near: [{ v: 14, fb: "That is the middle one." }, { v: 15, fb: "That is the largest." }],
        hints: ["$n + (n + 1) + (n + 2) = 42$."], why: "$3n + 3 = 42$, so $n = 13$." },
      { type: "choice", kicker: "Find the error",
        prompt: "“A number decreased by 8 is 20.” Kim writes $8 - n = 20$. What is wrong?",
        options: [{ t: "The number comes first: $n - 8 = 20$, so $n = 28$." },
                  { t: "It should be $n + 8 = 20$.", fb: "“Decreased by” is a subtraction." },
                  { t: "Nothing. It is right.", fb: "$8 - n$ decreases 8, not the number." }],
        answer: 0, skill: "Translate to algebra", hints: ["What is being decreased?"], why: "$n - 8 = 20$, so $n = 28$." },
      { type: "num", kicker: "Use it", prompt: "A car insurance bill went up by \\$60, which was 8% of the original cost. What was the original cost, in dollars?",
        post: "dollars", answer: 750, skill: "Problem solving strategy",
        near: [{ v: 4.8, tol: 1e-9, fb: "That is 8% of 60. Here 60 is the amount: $60 = 0.08c$." }],
        hints: ["$60 = 0.08c$."], why: "$60 \\div 0.08 = 750$." }
    ]
  });

  /* ====================================================== 9.2 · Solve money applications */
  var HOW_9_2 = [["Table", "Organise the facts: for each type, its number, its value, and number times value."],
                 ["Name", "Choose a variable for one number, and write the other in terms of it."],
                 ["Translate", "Add the total values to get the equation."],
                 ["Solve", "Solve the equation, then find each number."],
                 ["Check", "Check that the values add up."]];
  LESSONS.push({
    title: "Solve money applications",
    blurb: "Book 9.2 · Coin, ticket and stamp problems, organised with number times value.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is the total value of 7 dimes, in dollars?", post: "dollars", answer: 0.7, tol: 1e-9, skill: "Number times value",
        near: [{ v: 70, fb: "That is in cents. In dollars it is 0.70." }], hints: ["$7 \\cdot 0.10$."], why: "$7 \\cdot 0.10 = 0.70$." },
      { type: "table", kicker: "Explore", prompt: "Number times value gives the total value. Fill in the last column, in dollars.",
        head: ["Coin", "Number", "Value", "Total value"], rows: [["\\text{dimes}", 9, 0.10, null], ["\\text{nickels}", 12, 0.05, null]],
        answers: [[0, 3, 0.9], [1, 3, 0.6]], skill: "Number times value",
        hints: ["$9 \\cdot 0.10$ and $12 \\cdot 0.05$."], why: "$9 \\cdot 0.10 = 0.90$ and $12 \\cdot 0.05 = 0.60$." },
      { type: "learn", kicker: "The idea",
        prompt: "**number · value = total value.** For a coin problem, put the facts in a table with one row for each type of coin. The equation comes from adding the last column.",
        scene: { type: "method", how: HOW_9_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Mia has \\$2.10 in dimes and nickels. She has 6 more nickels than dimes. Watch the number of each found.",
        scene: { type: "walk", how: HOW_9_2, rows: [
          { step: 1, m: "\\text{number} \\cdot \\text{value} = \\text{total value}", say: "One row for dimes, one for nickels." },
          { step: 2, m: "d \\quad \\text{and} \\quad d + 6", say: "Let $d$ be the dimes. The nickels are 6 more." },
          { step: 3, m: "0.10d + 0.05(d + 6) = 2.10", say: "The two total values add up to 2.10.",
            ask: { prompt: "What is the total value of the nickels?", answer: 0,
                   options: [{ t: "$0.05(d + 6)$" }, { t: "$0.05d + 6$", fb: "All $d + 6$ nickels are worth 0.05 each." }] } },
          { step: 4, m: "0.15d + 0.30 = 2.10", say: "Distribute and combine." },
          { step: 4, m: "d = 12", say: "$0.15d = 1.80$. So 12 dimes and 18 nickels." },
          { step: 5, m: "1.20 + 0.90 = 2.10", say: "True." }] },
        gate: true, then: "The table turns the words into the equation, one cell at a time." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. **Maria has \\$2.43 in quarters and pennies. She has twice as many pennies as quarters.**",
        how: HOW_9_2, skill: "Coin problems",
        steps: [
          { step: 1, ask: "What is the value of one quarter, in dollars?", type: "num", answer: 0.25, tol: 1e-9, near: [{ v: 25, fb: "That is in cents. In dollars it is 0.25." }], hint: "A quarter of a dollar.",
            m: "\\text{quarters: } 0.25 \\qquad \\text{pennies: } 0.01", say: "The value of each coin." },
          { step: 2, ask: "With $q$ quarters and twice as many pennies, how many pennies are there?", type: "choice", answer: 0,
            options: [{ t: "$2q$" }, { t: "$q + 2$", fb: "“Twice as many” multiplies by 2." }, { t: "$\\frac{q}{2}$", fb: "There are more pennies than quarters, not fewer." }],
            m: "q \\quad \\text{and} \\quad 2q", say: "Twice as many pennies." },
          { step: 3, ask: "Which equation adds the two total values?", type: "choice", answer: 0,
            options: [{ t: "$0.25q + 0.01(2q) = 2.43$" }, { t: "$0.25q + 2q = 2.43$", fb: "Each penny is worth 0.01." }],
            m: "0.25q + 0.01(2q) = 2.43", say: "Number times value, for each coin." },
          { step: 4, ask: "That simplifies to $0.27q = 2.43$. What is $q$?", type: "num", answer: 9, hint: "$243 \\div 27$.",
            m: "q = 9", say: "9 quarters, and so 18 pennies." },
          { step: 5, ask: "9 quarters and 18 pennies: what is their total value, in dollars?", type: "num", answer: 2.43, tol: 1e-9, hint: "$2.25 + 0.18$.",
            m: "2.25 + 0.18 = 2.43", say: "It matches." }],
        why: "Table, name, translate, solve, check. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Jo has 5 more dimes than quarters, worth \\$4.00 in all. Solve $0.25q + 0.10(q + 5) = 4.00$ for the number of quarters.",
        pre: "$q =$", answer: 10, skill: "Coin problems",
        near: [{ v: 15, fb: "That is the number of dimes." }, { v: 80 / 7, tol: 1e-3, fb: "Distribute first: $0.25q + 0.10q + 0.50 = 4.00$." }],
        hints: ["$0.35q + 0.50 = 4.00$."], why: "$0.35q = 3.50$, so $q = 10$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Tickets work like coins. A play sold 200 tickets for \\$1150. Adult tickets cost \\$8 and student tickets \\$5. How many of each?",
        scene: { type: "walk", how: HOW_9_2, rows: [
          { step: 1, m: "\\text{number} \\cdot \\text{price} = \\text{total}", say: "One row for adult tickets, one for student tickets." },
          { step: 2, m: "a \\quad \\text{and} \\quad 200 - a", say: "If $a$ are adult tickets, the rest of the 200 are student tickets." },
          { step: 3, m: "8a + 5(200 - a) = 1150", say: "The two totals add up to 1150." },
          { step: 4, m: "3a + 1000 = 1150", say: "Distribute and combine." },
          { step: 4, m: "a = 50", say: "50 adult tickets, and 150 student tickets." },
          { step: 5, m: "8(50) + 5(150) = 1150", say: "$400 + 750$. True." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "You buy 30 stamps for \\$10.20. Some cost \\$0.50 and the rest \\$0.20. Solve $0.50x + 0.20(30 - x) = 10.20$ for the number of 50-cent stamps.",
        pre: "$x =$", answer: 14, skill: "Ticket and stamp problems",
        near: [{ v: 16, fb: "That is the number of 20-cent stamps." }],
        hints: ["$0.30x + 6 = 10.20$."], why: "$0.30x = 4.20$, so $x = 14$." },
      { type: "choice", kicker: "Find the error",
        prompt: "There are 8 more nickels than dimes, and $d$ dimes. Raj writes the value of the nickels as $0.05d + 8$. What is wrong?",
        options: [{ t: "The 8 extra nickels have a value too: it is $0.05(d + 8)$." },
                  { t: "Nickels are worth 0.10.", fb: "A nickel is 5 cents: 0.05." },
                  { t: "Nothing. It is right.", fb: "$0.05d + 8$ would make the extra nickels worth 8 dollars." }],
        answer: 0, skill: "Coin problems", hints: ["How many nickels are there in all?"], why: "Number times value: $(d + 8) \\cdot 0.05$." },
      { type: "num", kicker: "Use it", prompt: "A jar holds 12 quarters and 15 dimes. What is the total value, in dollars?",
        post: "dollars", answer: 4.5, tol: 1e-9, skill: "Number times value",
        near: [{ v: 27, fb: "That is the number of coins. Multiply each count by the coin's value." }, { v: 450, fb: "That is in cents. In dollars it is 4.50." }],
        hints: ["$12 \\cdot 0.25 + 15 \\cdot 0.10$."], why: "$3.00 + 1.50 = 4.50$." }
    ]
  });
  /* ================= 9.3 · Angles, triangles and the Pythagorean Theorem */
  var HOW_GEO = [["Draw", "Draw the figure and label it with what you know."],
                 ["Name", "Choose a variable for what you are looking for."],
                 ["Formula", "Write the formula or fact that fits, and substitute."],
                 ["Solve", "Solve the equation, check, and answer."]];
  var FIG_ANGLES = shape("A triangle with angles of 55 degrees and 82 degrees marked, and the third angle labelled x.", [-0.8, 7.8], [-0.8, 4.8], [
    { poly: [[0, 0], [7, 0], [2.6, 4]], c: "blue" },
    { angle: [[7, 0], [0, 0], [2.6, 4]], say: "55°" }, { angle: [[0, 0], [2.6, 4], [7, 0]], say: "82°" }, { angle: [[2.6, 4], [7, 0], [0, 0]], say: "x", c: "orange" }]);
  var FIG_LEGS = shape("A right triangle with legs 5 and 12, and hypotenuse c.", [-1.2, 6.8], [-1, 3.2], [
    { poly: [[0, 0], [6, 0], [0, 2.5]], c: "blue" }, { angle: [[6, 0], [0, 0], [0, 2.5]], right: true },
    { text: "12", at: [3, -0.6] }, { text: "5", at: [-0.6, 1.25] }, { text: "c", at: [3.3, 1.8], c: "orange", eq: true }]);
  var FIG_LADDER = shape("A right triangle: the ground leg is 6, the wall leg is x, and the ladder, the hypotenuse, is 10.", [-1.4, 4.4], [-1, 4.6], [
    { poly: [[0, 0], [3, 0], [0, 4]], c: "blue" }, { angle: [[3, 0], [0, 0], [0, 4]], right: true },
    { text: "6", at: [1.5, -0.6] }, { text: "x", at: [-0.6, 2], c: "orange", eq: true }, { text: "10", at: [2.1, 2.4] }]);
  LESSONS.push({
    title: "Angles, triangles and the Pythagorean Theorem",
    blurb: "Book 9.3 · Supplementary and complementary angles, the angles of a triangle, similar triangles, and right triangles.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Two angles are **supplementary** if they add to 180°. One measures 40°. What is the other?", post: "°", answer: 140, skill: "Angles",
        near: [{ v: 50, fb: "That adds to 90°: a complement. Supplementary angles add to 180°." }], hints: ["$180 - 40$."], why: "$180 - 40 = 140$." },
      { type: "learn", kicker: "The idea",
        prompt: "Three facts do most of the work. Supplementary angles add to 180°, and complementary angles add to 90°. The angles of any triangle add to 180°. And in a right triangle, $a^2 + b^2 = c^2$, where $c$ is the hypotenuse.",
        scene: { type: "method", how: HOW_GEO } },
      { type: "learn", kicker: "Watch",
        prompt: "Two angles of a triangle measure 55° and 82°. Watch the third found.",
        scene: { type: "walk", how: HOW_GEO, rows: [
          { step: 1, m: "55° \\quad 82° \\quad x", say: "Sketch the triangle and mark what is known.", fig: FIG_ANGLES },
          { step: 2, m: "x = \\text{the third angle}", say: "Name the unknown." },
          { step: 3, m: "55 + 82 + x = 180", say: "The angles of a triangle add to 180°.",
            ask: { prompt: "What do the three angles of any triangle add up to?", answer: 0,
                   options: [{ t: "180°" }, { t: "360°", fb: "That is a full turn, or the angles of a four-sided figure." }, { t: "90°", fb: "That is a single right angle." }] } },
          { step: 4, m: "137 + x = 180", say: "$55 + 82 = 137$." },
          { step: 4, m: "x = 43", say: "The third angle is 43°. Check: $55 + 82 + 43 = 180$." }] },
        gate: true, then: "A sketch with the known values on it is half the solution." },
      { type: "guided", kicker: "Together",
        prompt: "A right triangle has legs 5 and 12. Now you find the hypotenuse." + FIG_LEGS,
        how: HOW_GEO, skill: "Pythagorean Theorem",
        steps: [
          { step: 1, ask: "Which side of a right triangle is the hypotenuse?", type: "choice", answer: 0,
            options: [{ t: "The side opposite the right angle" }, { t: "The shortest side", fb: "The hypotenuse is always the longest side." }],
            m: "a = 5 \\quad b = 12", say: "The two legs meet at the right angle." },
          { step: 2, ask: "Which letter stands for the hypotenuse in the theorem?", type: "choice", answer: 0,
            options: [{ t: "$c$" }, { t: "$a$", fb: "$a$ and $b$ are the legs." }],
            m: "c = \\text{the hypotenuse}", say: "Name the unknown." },
          { step: 3, ask: "Substitute into $a^2 + b^2 = c^2$. What is $5^2 + 12^2$?", type: "num", answer: 169,
            near: [{ v: 34, fb: "Square each leg: $25 + 144$." }, { v: 289, fb: "Square each leg, then add. Do not add first." }], hint: "$25 + 144$.",
            m: "5^2 + 12^2 = c^2", say: "$25 + 144 = 169$." },
          { step: 4, ask: "$c^2 = 169$. What is $c$?", type: "num", answer: 13, near: [{ v: 84.5, tol: 1e-9, fb: "Take the square root, not half." }], hint: "$13 \\cdot 13$.",
            m: "c = 13", say: "$\\sqrt{169} = 13$. A length is positive, so the negative root is set aside." }],
        why: "Draw, name, formula, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Two angles are **complementary**: they add to 90°. One measures 28°. Find the other.", post: "°", answer: 62, skill: "Angles",
        near: [{ v: 152, fb: "That adds to 180°. Complementary angles add to 90°." }], hints: ["$90 - 28$."], why: "$90 - 28 = 62$." },
      { type: "num", prompt: "**Similar** triangles have the same shape, so matching sides are proportional. One triangle has sides 3 and 4. The matching sides of a similar triangle are 9 and $x$. Find $x$.",
        pre: "$x =$", answer: 12, skill: "Similar triangles",
        near: [{ v: 10, fb: "The sides are multiplied by the same number, not increased by the same amount." }],
        hints: ["$\\frac{3}{9} = \\frac{4}{x}$."], why: "Each side is 3 times as long: $4 \\cdot 3 = 12$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The unknown can be a leg. A 10-foot ladder stands with its base 6 feet from a wall. How high up the wall does it reach?",
        scene: { type: "walk", how: HOW_GEO, rows: [
          { step: 1, m: "6 \\quad x \\quad 10", say: "The ladder is the hypotenuse.", fig: FIG_LADDER },
          { step: 2, m: "x = \\text{the height reached}", say: "Name the unknown leg." },
          { step: 3, m: "6^2 + x^2 = 10^2", say: "The Pythagorean Theorem." },
          { step: 4, m: "36 + x^2 = 100", say: "Square the known sides." },
          { step: 4, m: "x^2 = 64", say: "Subtract 36 from both sides." },
          { step: 4, m: "x = 8", say: "A length is positive: the ladder reaches 8 feet. Check: $36 + 64 = 100$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Two angles are supplementary. The larger is 30° more than the smaller. Find the **smaller** angle.", post: "°", answer: 75, skill: "Angles",
        near: [{ v: 105, fb: "That is the larger angle." }, { v: 30, fb: "The angles are $s$ and $s + 30$, and they add to 180." }],
        hints: ["$s + (s + 30) = 180$."], why: "$2s = 150$, so $s = 75$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "A right triangle has legs 3 and 4. Tap the line where the work **first** goes wrong.",
        lines: ["a^2 + b^2 = c^2", "3^2 + 4^2 = c^2", "6 + 8 = c^2", "c^2 = 14"], answer: 2, fix: "9 + 16 = c^2",
        fb: { 0: "That is the theorem, and it is right.", 1: "The legs are substituted correctly.", 3: LATER }, skill: "Pythagorean Theorem",
        hints: ["What does $3^2$ mean?"],
        why: "$3^2 = 9$ and $4^2 = 16$: $c^2 = 25$, so $c = 5$." },
      { type: "num", kicker: "Use it", prompt: "A rectangular park is 80 metres wide and 150 metres long. How long is the straight path from one corner to the opposite corner?",
        post: "metres", answer: 170, skill: "Pythagorean Theorem",
        near: [{ v: 230, fb: "That walks round two sides. The diagonal is the hypotenuse." }],
        hints: ["$80^2 + 150^2 = c^2$."], why: "$6400 + 22500 = 28900$, and $\\sqrt{28900} = 170$." }
    ]
  });

  /* ======================= 9.4 · Rectangles, triangles and trapezoids */
  var FIG_POOL = shape("A rectangle with width w and length w plus 15.", [-1.6, 7.2], [-1.1, 3.6], [
    { poly: [[0, 0], [6, 0], [6, 3], [0, 3]], c: "blue" }, { text: "w + 15", at: [3, -0.6], eq: true }, { text: "w", at: [-0.6, 1.5], eq: true }]);
  var FIG_TRAP = shape("A trapezoid with parallel sides of 11 and 14, and height 6.", [-0.8, 7.8], [-1.1, 4.1], [
    { poly: [[0, 0], [7, 0], [6.5, 3], [1, 3]], c: "blue" }, { seg: [[1, 3], [1, 0]], dash: true, c: "soft" },
    { text: "14", at: [3.5, -0.6] }, { text: "11", at: [3.75, 3.5] }, { text: "6", at: [1.5, 1.5] }]);
  LESSONS.push({
    title: "Rectangles, triangles and trapezoids",
    blurb: "Book 9.4 · Linear, square and cubic measure, and the perimeter and area of rectangles, triangles and trapezoids.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which unit measures **area**?",
        options: [{ t: "Square feet" }, { t: "Feet", fb: "Feet measure a length, such as a perimeter." }, { t: "Cubic feet", fb: "Cubic feet measure a volume." }],
        answer: 0, skill: "Units of measure", hints: ["Area covers a surface."], why: "Area counts unit squares." },
      { type: "learn", kicker: "Explore", prompt: "Size the rectangle so that its perimeter is **20** and its area is **24**.",
        scene: { type: "rectangle", l: { v: 5, min: 1, max: 9 }, w: { v: 3, min: 1, max: 5 }, target: { P: 20, A: 24 }, answer: [6, 4] }, gate: true,
        after: "Perimeter goes round the edge. Area fills the inside." },
      { type: "learn", kicker: "The idea",
        prompt: "Perimeter is the distance around: for a rectangle, $P = 2l + 2w$. Area is the surface inside: $A = lw$ for a rectangle, $A = \\frac{1}{2}bh$ for a triangle, and $A = \\frac{1}{2}h(b + B)$ for a trapezoid.",
        scene: { type: "method", how: HOW_GEO } },
      { type: "learn", kicker: "Watch",
        prompt: "The perimeter of a rectangular pool is 150 feet. Its length is 15 feet more than its width. Watch both found.",
        scene: { type: "walk", how: HOW_GEO, rows: [
          { step: 1, m: "P = 150", say: "Sketch the pool and label the sides.", fig: FIG_POOL },
          { step: 2, m: "w \\quad \\text{and} \\quad w + 15", say: "Let $w$ be the width. The length is 15 more." },
          { step: 3, m: "2(w + 15) + 2w = 150", say: "$P = 2l + 2w$, with the labels in place.",
            ask: { prompt: "Which formula gives a rectangle's perimeter?", answer: 0,
                   options: [{ t: "$P = 2l + 2w$" }, { t: "$P = lw$", fb: "That is the area." }] } },
          { step: 4, m: "4w + 30 = 150", say: "Distribute and combine." },
          { step: 4, m: "w = 30", say: "Width 30 feet, length 45 feet. Check: $90 + 60 = 150$." }] },
        gate: true, then: "The same four steps as for angles: only the formula changed." },
      { type: "guided", kicker: "Together",
        prompt: "A triangular sail has area 54 square feet and base 12 feet. Now you find its height.",
        how: HOW_GEO, skill: "Area of a triangle",
        steps: [
          { step: 1, ask: "What are you given?", type: "choice", answer: 0,
            options: [{ t: "The area and the base" }, { t: "The base and the height", fb: "The height is what you are asked to find." }],
            m: "A = 54 \\quad b = 12", say: "Label the sketch with these." },
          { step: 2, ask: "What is the unknown?", type: "choice", answer: 0,
            options: [{ t: "The height, $h$" }, { t: "The area, $A$", fb: "The area is given: 54." }],
            m: "h = \\text{the height}", say: "Name it." },
          { step: 3, ask: "Substitute into $A = \\frac{1}{2}bh$. What is $\\frac{1}{2} \\cdot 12$?", type: "num", answer: 6, hint: "Half of 12.",
            m: "54 = 6h", say: "$54 = \\frac{1}{2} \\cdot 12 \\cdot h$." },
          { step: 4, ask: "Solve $54 = 6h$.", type: "num", answer: 9, near: [{ v: 324, fb: "Divide both sides by 6." }], hint: "$54 \\div 6$.",
            m: "h = 9", say: "The height is 9 feet. Check: $\\frac{1}{2} \\cdot 12 \\cdot 9 = 54$." }],
        why: "Draw, name, formula, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A rectangle is 12 cm long and 7 cm wide. Find its area.", post: "square cm", answer: 84, skill: "Area of a rectangle",
        near: [{ v: 38, fb: "That is the perimeter. Area is length times width." }], hints: ["$12 \\cdot 7$."], why: "$A = lw = 84$." },
      { type: "num", prompt: "A triangle has base 10 inches and height 7 inches. Find its area.", post: "square inches", answer: 35, skill: "Area of a triangle",
        near: [{ v: 70, fb: "A triangle is half of the rectangle around it: $\\frac{1}{2}bh$." }], hints: ["$\\frac{1}{2} \\cdot 10 \\cdot 7$."], why: "$\\frac{1}{2} \\cdot 70 = 35$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **trapezoid** has two parallel sides, its bases. This one has bases 11 feet and 14 feet, and height 6 feet. Find its area.",
        scene: { type: "walk", how: HOW_GEO, rows: [
          { step: 1, m: "h = 6 \\quad b = 11 \\quad B = 14", say: "The height is the distance between the parallel sides.", fig: FIG_TRAP },
          { step: 2, m: "A = \\text{the area}", say: "Name the unknown." },
          { step: 3, m: "A = \\frac{1}{2} \\cdot 6 \\cdot (11 + 14)", say: "$A = \\frac{1}{2}h(b + B)$." },
          { step: 4, m: "A = 3 \\cdot 25", say: "Half of 6, and $11 + 14$." },
          { step: 4, m: "A = 75", say: "75 square feet: between $6 \\cdot 11 = 66$ and $6 \\cdot 14 = 84$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "An isosceles triangle has perimeter 34 cm. Its two equal sides are each 12 cm. Find the third side.", post: "cm", answer: 10, skill: "Perimeter",
        near: [{ v: 22, fb: "There are two sides of 12: $34 - 12 - 12$." }], hints: ["$12 + 12 + x = 34$."], why: "$34 - 24 = 10$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A rectangle is 9 metres by 4 metres. Dana says its area is 26 square metres. What went wrong?",
        options: [{ t: "She found the perimeter, $2(9) + 2(4) = 26$. The area is $9 \\cdot 4 = 36$ square metres." },
                  { t: "She should have halved it: 18 square metres.", fb: "Halving is for triangles." },
                  { t: "Nothing. It is right.", fb: "Area is length times width." }],
        answer: 0, skill: "Area of a rectangle", hints: ["Where could 26 have come from?"], why: "$A = lw = 36$." },
      { type: "num", kicker: "Use it", prompt: "A room is 15 feet by 12 feet. Carpet costs \\$3 per square foot. What does it cost to carpet the room?",
        post: "dollars", answer: 540, skill: "Area of a rectangle",
        near: [{ v: 180, fb: "That is the area. Multiply it by the price per square foot." }, { v: 162, fb: "That uses the perimeter. Carpet covers the area." }],
        hints: ["$15 \\cdot 12 = 180$ square feet."], why: "$180 \\cdot 3 = 540$." }
    ]
  });
  /* ============================== 9.5 · Circles and irregular figures */
  var HOW_9_5 = [["Split", "Break the figure into shapes whose formulas you know."],
                 ["Areas", "Find the area of each shape."],
                 ["Combine", "Add the areas, or subtract a piece that was cut out."]];
  var FIG_ELL = shape("An L-shaped figure: 8 wide at the bottom and 7 tall on the left, with a step 3 up and 3 across. A dashed line splits it into two rectangles.", [-1.2, 9.2], [-1.1, 7.9], [
    { poly: [[0, 0], [8, 0], [8, 3], [3, 3], [3, 7], [0, 7]], c: "blue" }, { seg: [[0, 3], [3, 3]], dash: true, c: "soft" },
    { text: "8", at: [4, -0.6] }, { text: "7", at: [-0.6, 3.5] }, { text: "3", at: [8.5, 1.5] }, { text: "3", at: [1.5, 7.5] }], { u: 20 });
  var ARCH = [];
  for (var deg = 0; deg <= 180; deg += 12) ARCH.push([2 + 2 * Math.cos(deg * Math.PI / 180), 5 + 2 * Math.sin(deg * Math.PI / 180)]);
  var FIG_WINDOW = shape("A window: a rectangle 4 wide and 5 tall, with a half circle of diameter 4 on top.", [-1.2, 5.2], [-1.1, 7.6], [
    { poly: [[0, 5], [0, 0], [4, 0], [4, 5]].concat(ARCH), c: "blue" }, { seg: [[0, 5], [4, 5]], dash: true, c: "soft" },
    { text: "4", at: [2, -0.6] }, { text: "5", at: [-0.6, 2.5] }], { u: 20 });
  var FIG_HOLE = shape("A square of side 10 with a circle of radius 5 cut out of it.", [-1, 6], [-1.1, 5.6], [
    { poly: [[0, 0], [5, 0], [5, 5], [0, 5]], c: "blue" }, { circle: [[2.5, 2.5], 2.5], c: "orange" }, { seg: [[2.5, 2.5], [5, 2.5]], c: "orange" },
    { text: "10", at: [2.5, -0.6] }, { text: "5", at: [3.75, 2.9], c: "orange" }]);
  LESSONS.push({
    title: "Circles and irregular figures",
    blurb: "Book 9.5 · Circumference and area of circles, and the area of figures built from simpler shapes.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A circle has radius 5 cm. What is its diameter?", post: "cm", answer: 10, skill: "Circles",
        near: [{ v: 2.5, tol: 1e-9, fb: "The diameter is twice the radius, not half." }], hints: ["$d = 2r$."], why: "$2 \\cdot 5 = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "For a circle, $d = 2r$, $C = 2\\pi r$ and $A = \\pi r^2$. An irregular figure has no formula of its own. Split it into rectangles, triangles and circles, and combine their areas.",
        scene: { type: "method", how: HOW_9_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the area of this L-shaped figure found.",
        scene: { type: "walk", how: HOW_9_5, rows: [
          { step: 1, m: "8 \\times 3 \\quad \\text{and} \\quad 3 \\times 4", say: "One cut makes two rectangles.", fig: FIG_ELL },
          { step: 2, m: "8 \\cdot 3 = 24", say: "The bottom rectangle." },
          { step: 2, m: "3 \\cdot 4 = 12", say: "The top rectangle.",
            ask: { prompt: "The top piece is 3 wide. How tall is it?", answer: 0,
                   options: [{ t: "4, because $7 - 3 = 4$" }, { t: "7", fb: "7 is the full height. The bottom 3 belongs to the other rectangle." }] } },
          { step: 3, m: "24 + 12 = 36", say: "36 square units." }] },
        gate: true, then: "A missing length is found by subtracting the lengths you know." },
      { type: "guided", kicker: "Together",
        prompt: "A window is a rectangle 4 feet wide and 5 feet tall, with a half circle on top. Now you find its area, using $\\pi \\approx 3.14$." + FIG_WINDOW,
        how: HOW_9_5, skill: "Irregular figures",
        steps: [
          { step: 1, ask: "Which two shapes make the window?", type: "choice", answer: 0,
            options: [{ t: "A rectangle and a half circle" }, { t: "Two rectangles", fb: "The top is curved." }],
            m: "\\text{rectangle} + \\text{half circle}", say: "The dashed line is the cut." },
          { step: 2, ask: "The area of the rectangle: $4 \\cdot 5$.", type: "num", answer: 20, hint: "$4 \\cdot 5$.",
            m: "4 \\cdot 5 = 20", say: "20 square feet." },
          { step: 2, ask: "The half circle has radius 2. What is $\\frac{1}{2} \\cdot 3.14 \\cdot 2^2$?", type: "num", answer: 6.28, tol: 1e-9,
            near: [{ v: 12.56, tol: 1e-9, fb: "That is the whole circle. Take half of it." }, { v: 25.12, tol: 1e-9, fb: "The radius is 2: half the width of 4." }], hint: "$\\frac{1}{2} \\cdot 3.14 \\cdot 4$.",
            m: "\\frac{1}{2} \\cdot 3.14 \\cdot 2^2 = 6.28", say: "Half of $\\pi r^2$." },
          { step: 3, ask: "Add the two areas.", type: "num", answer: 26.28, tol: 1e-9, hint: "$20 + 6.28$.",
            m: "20 + 6.28 = 26.28", say: "About 26.28 square feet." }],
        why: "Split, areas, combine. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Use $\\pi \\approx 3.14$. Find the circumference of a circle with diameter 20 cm.", post: "cm", answer: 62.8, tol: 1e-9, skill: "Circles",
        near: [{ v: 125.6, tol: 1e-9, fb: "20 is the diameter. $C = \\pi d$, or $2\\pi r$ with $r = 10$." }, { v: 314, fb: "That is the area." }],
        hints: ["$C = \\pi d$."], why: "$3.14 \\cdot 20 = 62.8$." },
      { type: "num", prompt: "Use $\\pi \\approx 3.14$. Find the area of a circle with radius 3 metres.", post: "square metres", answer: 28.26, tol: 1e-9, skill: "Circles",
        near: [{ v: 18.84, tol: 1e-9, fb: "That is the circumference. Area is $\\pi r^2$." }, { v: 9.42, tol: 1e-9, fb: "Square the radius: $3^2 = 9$." }],
        hints: ["$3.14 \\cdot 3^2$."], why: "$3.14 \\cdot 9 = 28.26$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes a piece is cut **out**. A circle of radius 5 is cut from a square of side 10. Find the area left, using $\\pi \\approx 3.14$.",
        scene: { type: "walk", how: HOW_9_5, rows: [
          { step: 1, m: "\\text{square} - \\text{circle}", say: "The circle is removed, so its area is subtracted.", fig: FIG_HOLE },
          { step: 2, m: "10 \\cdot 10 = 100", say: "The square." },
          { step: 2, m: "3.14 \\cdot 5^2 = 78.5", say: "The circle." },
          { step: 3, m: "100 - 78.5 = 21.5", say: "About 21.5 square units are left, in the four corners." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A round table top has circumference 9.42 feet. Use $\\pi \\approx 3.14$ to find its diameter.", post: "feet", answer: 3, skill: "Circles",
        near: [{ v: 1.5, tol: 1e-9, fb: "That is the radius. The question asks for the diameter." }, { v: 29.5788, tol: 1e-3, fb: "$C = \\pi d$, so divide by 3.14." }],
        hints: ["$9.42 = 3.14d$."], why: "$9.42 \\div 3.14 = 3$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A circle has diameter 10. Omar computes its area as $3.14 \\cdot 10^2 = 314$. What is wrong?",
        options: [{ t: "The formula uses the radius, 5: $3.14 \\cdot 5^2 = 78.5$." },
                  { t: "He should not have squared.", fb: "The area formula is $\\pi r^2$." },
                  { t: "Nothing. It is right.", fb: "10 is the diameter, not the radius." }],
        answer: 0, skill: "Circles", hints: ["Which length goes into $\\pi r^2$?"], why: "$r = 5$, so $A \\approx 78.5$." },
      { type: "num", kicker: "Use it", prompt: "A room is a 10 ft by 12 ft rectangle with a 4 ft by 5 ft closet opening off it. What is the total floor area?",
        post: "square feet", answer: 140, skill: "Irregular figures",
        near: [{ v: 100, fb: "The closet is added on, not cut out." }, { v: 120, fb: "Add the closet: $4 \\cdot 5$." }],
        hints: ["$10 \\cdot 12 + 4 \\cdot 5$."], why: "$120 + 20 = 140$." }
    ]
  });

  /* ================================== 9.6 · Volume and surface area */
  var HOW_9_6 = [["Shape", "Identify the solid and write down its dimensions."],
                 ["Formula", "Write the formula for the volume or the surface area."],
                 ["Compute", "Substitute and simplify. Volume is in cubic units, surface area in square units."]];
  LESSONS.push({
    title: "Volume and surface area",
    blurb: "Book 9.6 · Rectangular solids, cubes, spheres, cylinders and cones.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A box is 4 units long, 3 units wide and 2 units high. How many unit cubes fill it?", post: "cubes", answer: 24, skill: "Volume",
        near: [{ v: 9, fb: "Multiply the three dimensions. Do not add them." }, { v: 12, fb: "That is one layer. There are 2 layers." }], hints: ["12 cubes in each layer, and 2 layers."], why: "$4 \\cdot 3 \\cdot 2 = 24$." },
      { type: "learn", kicker: "Explore", prompt: "Change the edge until the cube is built from exactly **27** unit cubes. Drag to turn it.",
        scene: { type: "solid", edge: 1, max: 6, target: 27 }, gate: true,
        after: "A cube's volume is its edge, cubed." },
      { type: "learn", kicker: "The idea",
        prompt: "**Volume** counts the unit cubes inside a solid, in cubic units. **Surface area** is the total area of its faces, in square units. A rectangular solid has $V = lwh$ and $S = 2lw + 2lh + 2wh$.",
        scene: { type: "method", how: HOW_9_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "A box is 6 cm long, 4 cm wide and 3 cm high. Watch its volume and its surface area found.",
        scene: { type: "walk", how: HOW_9_6, rows: [
          { step: 1, m: "l = 6 \\quad w = 4 \\quad h = 3", say: "A rectangular solid." },
          { step: 2, m: "V = lwh \\qquad S = 2lw + 2lh + 2wh", say: "One formula for each question." },
          { step: 3, m: "6 \\cdot 4 \\cdot 3 = 72", say: "The volume: 72 cubic centimetres.",
            ask: { prompt: "Which units measure a volume?", answer: 0,
                   options: [{ t: "Cubic units" }, { t: "Square units", fb: "Square units measure area. Volume fills space." }] } },
          { step: 3, m: "2(24) + 2(18) + 2(12) = 108", say: "The surface area: three pairs of matching faces, 108 square centimetres." }] },
        gate: true, then: "Top and bottom, front and back, left and right: each face has a twin." },
      { type: "guided", kicker: "Together",
        prompt: "A soup can has radius 3 cm and height 10 cm. Now you find its volume, using $\\pi \\approx 3.14$.",
        how: HOW_9_6, skill: "Volume of a cylinder",
        steps: [
          { step: 1, ask: "Which solid is a soup can?", type: "choice", answer: 0,
            options: [{ t: "A cylinder" }, { t: "A cone", fb: "A cone comes to a point." }, { t: "A sphere", fb: "A sphere is a ball." }],
            m: "r = 3 \\quad h = 10", say: "A cylinder, with these dimensions." },
          { step: 2, ask: "Which formula gives its volume?", type: "choice", answer: 0,
            options: [{ t: "$V = \\pi r^2 h$" }, { t: "$V = lwh$", fb: "That is for a rectangular solid." }, { t: "$V = \\frac{4}{3}\\pi r^3$", fb: "That is for a sphere." }],
            m: "V = \\pi r^2 h", say: "The area of the circular base, times the height." },
          { step: 3, ask: "What is $3.14 \\cdot 3^2 \\cdot 10$?", type: "num", answer: 282.6, tol: 1e-9,
            near: [{ v: 188.4, tol: 1e-9, fb: "$3^2$ is 9, not 6." }, { v: 94.2, tol: 1e-9, fb: "Square the radius: $3^2 = 9$." }], hint: "$3.14 \\cdot 9 \\cdot 10$.",
            m: "3.14 \\cdot 9 \\cdot 10 = 282.6", say: "About 282.6 cubic centimetres." }],
        why: "Shape, formula, compute. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A cube has edges of 5 cm. Find its volume.", post: "cubic cm", answer: 125, skill: "Volume of a cube",
        near: [{ v: 150, fb: "That is its surface area. Volume is $5^3$." }, { v: 15, fb: "$5^3$ is $5 \\cdot 5 \\cdot 5$." }, { v: 25, fb: "That is one face. Volume is $5^3$." }],
        hints: ["$5 \\cdot 5 \\cdot 5$."], why: "$5^3 = 125$." },
      { type: "num", prompt: "Now find the **surface area** of that cube: six faces, each 5 cm by 5 cm.", post: "square cm", answer: 150, skill: "Surface area",
        near: [{ v: 125, fb: "That is the volume. Surface area adds up the faces." }, { v: 25, fb: "That is one face. There are six." }],
        hints: ["$6 \\cdot 25$."], why: "$6 \\cdot 5^2 = 150$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A cone holds one third of the cylinder around it: $V = \\frac{1}{3}\\pi r^2 h$. Find the volume of a cone with radius 3 and height 7, using $\\pi \\approx 3.14$.",
        scene: { type: "walk", how: HOW_9_6, rows: [
          { step: 1, m: "r = 3 \\quad h = 7", say: "A cone." },
          { step: 2, m: "V = \\frac{1}{3}\\pi r^2 h", say: "One third of base times height." },
          { step: 3, m: "\\frac{1}{3} \\cdot 3.14 \\cdot 9 \\cdot 7", say: "$r^2 = 9$." },
          { step: 3, m: "3.14 \\cdot 3 \\cdot 7 = 65.94", say: "$\\frac{1}{3} \\cdot 9 = 3$. About 65.94 cubic units." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A sphere has $V = \\frac{4}{3}\\pi r^3$. Find the volume of a ball with radius 3 inches, using $\\pi \\approx 3.14$.", post: "cubic inches", answer: 113.04, tol: 1e-6, skill: "Volume of a sphere",
        near: [{ v: 37.68, tol: 1e-6, fb: "$r^3$ is $3 \\cdot 3 \\cdot 3 = 27$, not 9." }, { v: 84.78, tol: 1e-6, fb: "Multiply by $\\frac{4}{3}$ as well." }],
        hints: ["$\\frac{4}{3} \\cdot 3.14 \\cdot 27$."], why: "$\\frac{4}{3} \\cdot 27 = 36$, and $36 \\cdot 3.14 = 113.04$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A box is 2 m by 3 m by 4 m. Eli says its volume is 9 cubic metres. What went wrong?",
        options: [{ t: "He added the dimensions. Volume multiplies them: $2 \\cdot 3 \\cdot 4 = 24$ cubic metres." },
                  { t: "He should have squared each one.", fb: "Volume is $lwh$: one of each dimension." },
                  { t: "Nothing. It is right.", fb: "$2 + 3 + 4 = 9$ is a length, not a volume." }],
        answer: 0, skill: "Volume", hints: ["How could 9 come from 2, 3 and 4?"], why: "$V = lwh = 24$." },
      { type: "num", kicker: "Use it", prompt: "A fish tank is 20 inches long, 10 inches wide and 12 inches high. How many cubic inches of water fill it?",
        post: "cubic inches", answer: 2400, skill: "Volume",
        near: [big(2400), { v: 42, fb: "Multiply the three dimensions. Do not add them." }],
        hints: ["$20 \\cdot 10 \\cdot 12$."], why: "$200 \\cdot 12 = 2400$." }
    ]
  });

  /* ============================ 9.7 · Solve a formula for a specific variable */
  var HOW_9_7 = [["Formula", "Write the formula, and put in any values you know."],
                 ["Undo", "Undo what is done to the wanted variable: do the opposite to both sides."],
                 ["Write", "Write the wanted variable alone on one side."]];
  LESSONS.push({
    title: "Solve a formula for a specific variable",
    blurb: "Book 9.7 · The distance, rate and time formula, and solving any formula for one of its letters.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A car travels at 60 miles per hour for 3 hours. How far does it go?", post: "miles", answer: 180, skill: "Distance, rate, time",
        near: [{ v: 20, fb: "Distance is rate times time. Do not divide." }], hints: ["$60 \\cdot 3$."], why: "$d = rt = 180$." },
      { type: "learn", kicker: "The idea",
        prompt: "$d = rt$: distance is rate times time. A formula is an equation, so it can be solved for any of its letters. Divide both sides by $r$ and it becomes a formula for time: $t = \\frac{d}{r}$.",
        scene: { type: "method", how: HOW_9_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Rey cycles 45 miles at 15 miles per hour. Watch the time found.",
        scene: { type: "walk", how: HOW_9_7, rows: [
          { step: 1, m: "d = rt", say: "The formula." },
          { step: 1, m: "45 = 15t", say: "$d = 45$ and $r = 15$.",
            ask: { prompt: "Which letter is the unknown?", answer: 0,
                   options: [{ t: "$t$, the time" }, { t: "$d$, the distance", fb: "The distance is given: 45 miles." }] } },
          { step: 2, m: "\\frac{45}{15} = \\frac{15t}{15}", say: "$t$ is multiplied by 15, so divide both sides by 15." },
          { step: 3, m: "t = 3", say: "3 hours. Check: $15 \\cdot 3 = 45$." }] },
        gate: true, then: "The units agree too: miles divided by miles per hour gives hours." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve the area formula $A = \\frac{1}{2}bh$ for $h$, with no numbers at all.",
        how: HOW_9_7, skill: "Solve a formula",
        steps: [
          { step: 1, ask: "Which formula are we starting from?", type: "choice", answer: 0,
            options: [{ t: "$A = \\frac{1}{2}bh$" }, { t: "$A = bh$", fb: "A triangle is half of the rectangle around it." }],
            m: "A = \\frac{1}{2}bh", say: "No values to put in this time." },
          { step: 2, ask: "Multiply both sides by 2 to clear the fraction. What does the equation become?", type: "choice", answer: 0,
            options: [{ t: "$2A = bh$" }, { t: "$\\frac{A}{2} = bh$", fb: "Multiplying by 2 doubles the left side." }],
            m: "2A = bh", say: "The $\\frac{1}{2}$ is gone." },
          { step: 2, ask: "$h$ is multiplied by $b$. What undoes that?", type: "choice", answer: 0,
            options: [{ t: "Divide both sides by $b$" }, { t: "Subtract $b$ from both sides", fb: "$b$ multiplies $h$. It is not added." }],
            m: "\\frac{2A}{b} = h", say: "Divide both sides by $b$." },
          { step: 3, ask: "Write it with $h$ on the left.", type: "choice", answer: 0,
            options: [{ t: "$h = \\frac{2A}{b}$" }, { t: "$h = \\frac{b}{2A}$", fb: "The two sides swap places. Neither is turned over." }],
            m: "h = \\frac{2A}{b}", say: "A formula for the height." }],
        why: "Formula, undo, write. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Use $d = rt$. A plane flies 1500 miles at 500 miles per hour. How long does the flight take?", post: "hours", answer: 3, skill: "Distance, rate, time",
        near: [{ v: 750000, fb: "Divide the distance by the rate. Do not multiply." }], hints: ["$1500 = 500t$."], why: "$1500 \\div 500 = 3$." },
      { type: "choice", prompt: "Solve $I = Prt$ for $t$.",
        options: [{ t: "$t = \\frac{I}{Pr}$" }, { t: "$t = IPr$", fb: "$t$ is multiplied by $Pr$. Undo that by dividing." }, { t: "$t = \\frac{Pr}{I}$", fb: "Divide $I$ by $Pr$, not the other way round." }],
        answer: 0, skill: "Solve a formula", hints: ["Divide both sides by $Pr$."], why: "$\\frac{I}{Pr} = t$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The same steps solve an equation in two letters for one of them. Solve $6x + 2y = 10$ for $y$.",
        scene: { type: "walk", how: HOW_9_7, rows: [
          { step: 1, m: "6x + 2y = 10", say: "We want $y$ alone." },
          { step: 2, m: "2y = 10 - 6x", say: "Subtract $6x$ from both sides." },
          { step: 2, m: "\\frac{2y}{2} = \\frac{10 - 6x}{2}", say: "Divide both sides by 2." },
          { step: 3, m: "y = 5 - 3x", say: "Every term on the right is divided by 2." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Solve $P = a + b + c$ for $a$.",
        options: [{ t: "$a = P - b - c$" }, { t: "$a = P + b + c$", fb: "$b$ and $c$ are added, so subtract them from both sides." }, { t: "$a = \\frac{P}{bc}$", fb: "$b$ and $c$ are added to $a$, not multiplied." }],
        answer: 0, skill: "Solve a formula", hints: ["Subtract $b$ and $c$ from both sides."], why: "$P - b - c = a$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Solving $d = rt$ for $r$. Tap the line where the work **first** goes wrong.",
        lines: ["d = rt", "\\frac{d}{t} = \\frac{rt}{t}", "r = dt"], answer: 2, fix: "r = \\frac{d}{t}",
        fb: { 0: "That is the formula, and it is right.", 1: "Dividing both sides by $t$ is the right move." }, skill: "Solve a formula",
        hints: ["What is left on each side after dividing by $t$?"],
        why: "The left side is $\\frac{d}{t}$, so $r = \\frac{d}{t}$." },
      { type: "num", kicker: "Use it", prompt: "Use $d = rt$. A hiker walks 14 miles in 4 hours. What is her average rate?", post: "miles per hour", answer: 3.5, tol: 1e-9, skill: "Distance, rate, time",
        near: [{ v: 56, fb: "Divide the distance by the time. Do not multiply." }], hints: ["$14 = r \\cdot 4$."], why: "$14 \\div 4 = 3.5$." }
    ]
  });
  /* ================================================================ Skills */
  function r100(v) { return Math.round(v * 100) / 100; }
  var SKILLS = [
    { id: "pa9-number", title: "Solve number problems", lesson: 2,
      gen: function (R) {
        var n = R.int(3, 25), k = R.int(2, 9), kind = R.int(0, 2);
        if (kind === 0) return { type: "num", prompt: "The sum of twice a number and " + k + " is " + (2 * n + k) + ". Find the number.", answer: n,
          near: near(n, [{ v: 2 * n, fb: "That is twice the number. Divide by 2." }]), hints: ["$2n + " + k + " = " + (2 * n + k) + "$."], why: "$2n = " + 2 * n + "$, so $n = " + n + "$." };
        if (kind === 1) return { type: "num", prompt: "One number is " + k + " more than another, and their sum is " + (2 * n + k) + ". Find the **smaller** number.", answer: n,
          near: near(n, [{ v: n + k, fb: "That is the larger number. The question asks for the smaller." }]), hints: ["$n + (n + " + k + ") = " + (2 * n + k) + "$."], why: "$2n = " + 2 * n + "$, so $n = " + n + "$. The other is " + (n + k) + "." };
        return { type: "num", prompt: "The sum of two consecutive integers is " + (2 * n + 1) + ". Find the **smaller** one.", answer: n,
          near: near(n, [{ v: n + 1, fb: "That is the larger of the two." }]), hints: ["$n + (n + 1) = " + (2 * n + 1) + "$."], why: "$2n = " + 2 * n + "$, so the integers are " + n + " and " + (n + 1) + "." };
      } },
    { id: "pa9-coins", title: "Solve coin problems", lesson: 3,
      gen: function (R) {
        var q = R.int(3, 14), k = R.int(1, 8), total = (25 * q + 10 * (q + k)) / 100;
        return { type: "num", prompt: "A jar holds quarters and dimes worth \\$" + total.toFixed(2) + ". There are " + k + " more dimes than quarters. How many **quarters** are there?", post: "quarters", answer: q,
          near: near(q, [{ v: q + k, fb: "That is the number of dimes." }]),
          hints: ["$0.25q + 0.10(q + " + k + ") = " + total.toFixed(2) + "$."], why: "$0.35q = " + (0.35 * q).toFixed(2) + "$, so $q = " + q + "$." };
      } },
    { id: "pa9-angles", title: "Angles and right triangles", lesson: 4,
      gen: function (R) {
        var kind = R.int(0, 2);
        if (kind === 0) { var a = R.int(25, 80), b = R.int(25, 150 - a), c = 180 - a - b;
          return { type: "num", prompt: "Two angles of a triangle measure " + a + "° and " + b + "°. Find the third angle.", post: "°", answer: c,
            near: near(c, [{ v: a + b, fb: "That is the sum of the two given angles. Subtract it from 180." }, { v: 360 - a - b, fb: "The angles of a triangle add to 180°, not 360°." }]),
            hints: ["$" + a + " + " + b + " + x = 180$."], why: "$180 - " + (a + b) + " = " + c + "$." }; }
        if (kind === 1) { var sup = R.chance(0.5), tot = sup ? 180 : 90, g = R.int(12, tot - 12);
          return { type: "num", prompt: "Two angles are " + (sup ? "supplementary" : "complementary") + ". One measures " + g + "°. Find the other.", post: "°", answer: tot - g,
            near: near(tot - g, [{ v: (sup ? 90 : 180) - g, fb: (sup ? "Supplementary angles add to 180°." : "Complementary angles add to 90°.") }]),
            hints: ["$" + tot + " - " + g + "$."], why: "$" + tot + " - " + g + " = " + (tot - g) + "$." }; }
        var T = R.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [10, 24, 26]]), leg = R.chance(0.4);
        return leg ? { type: "num", prompt: "A right triangle has hypotenuse " + T[2] + " and one leg " + T[0] + ". Find the other leg.", answer: T[1],
            near: near(T[1], [{ v: T[2] - T[0], fb: "Use the squares: $" + T[0] + "^2 + b^2 = " + T[2] + "^2$." }]), hints: ["$b^2 = " + T[2] * T[2] + " - " + T[0] * T[0] + "$."], why: "$b^2 = " + T[1] * T[1] + "$, so $b = " + T[1] + "$." }
          : { type: "num", prompt: "A right triangle has legs " + T[0] + " and " + T[1] + ". Find the hypotenuse.", answer: T[2],
            near: near(T[2], [{ v: T[0] + T[1], fb: "Square each leg and add: $c^2 = " + T[0] * T[0] + " + " + T[1] * T[1] + "$." }]), hints: ["$c^2 = " + T[0] * T[0] + " + " + T[1] * T[1] + "$."], why: "$c^2 = " + T[2] * T[2] + "$, so $c = " + T[2] + "$." };
      } },
    { id: "pa9-area", title: "Perimeter and area", lesson: 5,
      gen: function (R) {
        var kind = R.int(0, 3), l = R.int(5, 15), w = R.int(2, l - 1), h = 2 * R.int(2, 6), b = R.int(3, 12), B = b + R.int(2, 6);
        if (kind === 0) return { type: "num", prompt: "A rectangle is " + l + " cm long and " + w + " cm wide. Find its **area**.", post: "square cm", answer: l * w,
          near: near(l * w, [{ v: 2 * l + 2 * w, fb: "That is the perimeter. Area is length times width." }]), hints: ["$" + l + " \\cdot " + w + "$."], why: "$A = lw = " + l * w + "$." };
        if (kind === 1) return { type: "num", prompt: "A rectangle is " + l + " cm long and " + w + " cm wide. Find its **perimeter**.", post: "cm", answer: 2 * l + 2 * w,
          near: near(2 * l + 2 * w, [{ v: l * w, fb: "That is the area. Perimeter is the distance around." }, { v: l + w, fb: "There are two lengths and two widths." }]), hints: ["$2(" + l + ") + 2(" + w + ")$."], why: "$P = " + 2 * l + " + " + 2 * w + " = " + (2 * l + 2 * w) + "$." };
        if (kind === 2) return { type: "num", prompt: "A triangle has base " + b + " in and height " + h + " in. Find its area.", post: "square inches", answer: b * h / 2,
          near: near(b * h / 2, [{ v: b * h, fb: "A triangle is half of the rectangle around it." }]), hints: ["$\\frac{1}{2} \\cdot " + b + " \\cdot " + h + "$."], why: "$\\frac{1}{2} \\cdot " + b * h + " = " + b * h / 2 + "$." };
        return { type: "num", prompt: "A trapezoid has bases " + b + " ft and " + B + " ft, and height " + h + " ft. Find its area.", post: "square feet", answer: h * (b + B) / 2,
          near: near(h * (b + B) / 2, [{ v: h * (b + B), fb: "Take half: $A = \\frac{1}{2}h(b + B)$." }]), hints: ["$\\frac{1}{2} \\cdot " + h + " \\cdot (" + b + " + " + B + ")$."], why: "$" + h / 2 + " \\cdot " + (b + B) + " = " + h * (b + B) / 2 + "$." };
      } },
    { id: "pa9-circle", title: "Circumference and area of a circle", lesson: 6,
      gen: function (R) {
        var r = R.int(2, 15), area = R.chance(0.5), C = r100(2 * 3.14 * r), A = r100(3.14 * r * r), ans = area ? A : C;
        return { type: "num", prompt: "Use $\\pi \\approx 3.14$. Find the " + (area ? "area" : "circumference") + " of a circle with radius " + r + " cm.", post: area ? "square cm" : "cm", answer: ans, tol: 1e-6,
          near: near(ans, [{ v: area ? C : A, tol: 1e-6, fb: area ? "That is the circumference. Area is $\\pi r^2$." : "That is the area. Circumference is $2\\pi r$." }, { v: area ? r100(3.14 * r) : r100(3.14 * r), tol: 1e-6, fb: area ? "Square the radius." : "$C = 2\\pi r$: do not leave out the 2." }]),
          hints: [area ? "$3.14 \\cdot " + r + "^2$." : "$2 \\cdot 3.14 \\cdot " + r + "$."], why: area ? "$3.14 \\cdot " + r * r + " = " + num(A) + "$." : "$6.28 \\cdot " + r + " = " + num(C) + "$." };
      } },
    { id: "pa9-volume", title: "Volume and surface area", lesson: 7,
      gen: function (R) {
        var kind = R.int(0, 3), l = R.int(3, 9), w = R.int(2, 6), h = R.int(2, 8), e = R.int(2, 9), r = R.int(2, 6), ans;
        if (kind === 0) return { type: "num", prompt: "A box is " + l + " cm long, " + w + " cm wide and " + h + " cm high. Find its volume.", post: "cubic cm", answer: l * w * h,
          near: near(l * w * h, [{ v: l + w + h, fb: "Multiply the three dimensions. Do not add them." }]), hints: ["$" + l + " \\cdot " + w + " \\cdot " + h + "$."], why: "$V = lwh = " + l * w * h + "$." };
        if (kind === 1) { ans = 2 * (l * w + l * h + w * h);
          return { type: "num", prompt: "A box is " + l + " cm long, " + w + " cm wide and " + h + " cm high. Find its surface area.", post: "square cm", answer: ans,
            near: near(ans, [{ v: l * w * h, fb: "That is the volume. Surface area adds up the six faces." }, { v: ans / 2, fb: "Each face has a twin on the opposite side: double it." }]),
            hints: ["$2(" + l * w + ") + 2(" + l * h + ") + 2(" + w * h + ")$."], why: "$" + 2 * l * w + " + " + 2 * l * h + " + " + 2 * w * h + " = " + ans + "$." }; }
        if (kind === 2) return { type: "num", prompt: "A cube has edges of " + e + " cm. Find its volume.", post: "cubic cm", answer: e * e * e,
          near: near(e * e * e, [{ v: 3 * e, fb: "$" + e + "^3$ is $" + e + " \\cdot " + e + " \\cdot " + e + "$." }, { v: 6 * e * e, fb: "That is the surface area." }]), hints: ["$" + e + "^3$."], why: "$" + e + " \\cdot " + e + " \\cdot " + e + " = " + e * e * e + "$." };
        ans = r100(3.14 * r * r * h);
        return { type: "num", prompt: "Use $\\pi \\approx 3.14$. A cylinder has radius " + r + " cm and height " + h + " cm. Find its volume.", post: "cubic cm", answer: ans, tol: 1e-6,
          near: near(ans, [{ v: r100(3.14 * 2 * r * h), tol: 1e-6, fb: "$" + r + "^2$ is $" + r * r + "$, not $" + 2 * r + "$." }]), hints: ["$3.14 \\cdot " + r + "^2 \\cdot " + h + "$."], why: "$3.14 \\cdot " + r * r + " \\cdot " + h + " = " + num(ans) + "$." };
      } },
    { id: "pa9-formula", title: "Use distance, rate and time", lesson: 8,
      gen: function (R) {
        var r = R.int(8, 65), t = R.pick([2, 3, 4, 5, 6, 1.5, 2.5]), d = r * t, kind = R.int(0, 2);
        if (kind === 0) return { type: "num", prompt: "Use $d = rt$. Find the distance travelled at " + r + " miles per hour for " + num(t) + " hours.", post: "miles", answer: d, tol: 1e-9,
          near: near(d, [{ v: r / t, tol: 1e-6, fb: "Distance is rate times time." }]), hints: ["$" + r + " \\cdot " + num(t) + "$."], why: "$d = " + num(d) + "$." };
        if (kind === 1) return { type: "num", prompt: "Use $d = rt$. A trip of " + num(d) + " miles takes " + num(t) + " hours. Find the average rate.", post: "miles per hour", answer: r, tol: 1e-9,
          near: near(r, [{ v: d * t, tol: 1e-6, fb: "Divide the distance by the time." }]), hints: ["$" + num(d) + " = r \\cdot " + num(t) + "$."], why: "$" + num(d) + " \\div " + num(t) + " = " + r + "$." };
        return { type: "num", prompt: "Use $d = rt$. How long does it take to travel " + num(d) + " miles at " + r + " miles per hour?", post: "hours", answer: t, tol: 1e-9,
          near: near(t, [{ v: d * r, tol: 1e-6, fb: "Divide the distance by the rate." }]), hints: ["$" + num(d) + " = " + r + "t$."], why: "$" + num(d) + " \\div " + r + " = " + num(t) + "$." };
      } }
  ];
  L.unit("prealg", 9, {
    title: "Math Models and Geometry",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Number problems and coin problems.",
        skills: ["pa9-number", "pa9-coins"], per: 3 },
      { title: "Quiz 2", after: 6, blurb: "Angles and right triangles, perimeter and area, and circles.",
        skills: ["pa9-angles", "pa9-area", "pa9-circle"], per: 2 },
      { title: "Quiz 3", after: 8, blurb: "Volume and surface area, and the distance, rate and time formula.",
        skills: ["pa9-volume", "pa9-formula"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:9", {
    2: { name: "Problem solving strategy", frame: "Read the problem and [[name]] the unknown with a variable. [[Translate]] the words into an equation, solve it, and [[check]] the answer in the problem.",
         chips: ["guess", "estimate"] },
    3: { name: "Money problems", frame: "Number · [[value]] = total value. Organise the facts in a [[table]], and [[add]] the total values to write the equation.",
         chips: ["multiply", "weight"] },
    4: { name: "Angles and triangles", frame: "Supplementary angles add to [[180°]] and complementary angles to [[90°]]. The angles of a triangle add to 180°. In a right triangle, $a^2 + b^2 = c^2$, where $c$ is the [[hypotenuse]].",
         chips: ["360°", "shortest leg"] },
    5: { name: "Perimeter and area", frame: "[[Perimeter]] is the distance around a figure, in linear units. [[Area]] is the surface inside, in [[square]] units. A triangle's area is [[half]] of base times height.",
         chips: ["cubic", "twice"] },
    6: { name: "Circles and irregular figures", frame: "A circle has $C = 2\\pi r$ and $A = \\pi r^2$, both using the [[radius]]. An irregular figure is [[split]] into known shapes whose areas are added, or [[subtracted]] for a piece cut out.",
         chips: ["diameter", "multiplied"] },
    7: { name: "Volume and surface area", frame: "[[Volume]] fills a solid and is measured in [[cubic]] units. [[Surface area]] covers its faces and is measured in square units.",
         chips: ["Perimeter", "linear"] },
    8: { name: "Formulas", frame: "$d = rt$: distance is [[rate]] times [[time]]. A formula can be solved for any letter by doing the [[opposite]] operation to both sides.",
         chips: ["area", "same"] }
  });
})();
