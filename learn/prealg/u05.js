/* ==========================================================================
   Prealgebra — Unit 5: Decimals. See lab/core.js for the format.

   Follows OpenStax Prealgebra 2e, Chapter 5, section for section: the
   readiness check, then 5.1 to 5.7. Each lesson teaches the book's own steps:
   the method, a worked example to watch, one done together, then on your own,
   a harder case, find the error, use it, and the concept built at the end.

   Decimal place value and rounding (5.1), the four operations (5.2),
   fractions as decimals and circles (5.3), equations (5.4), mean, median,
   mode and probability (5.5), ratios and rates (5.6), square roots (5.7).

   Adapted from OpenStax, Prealgebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Eight lessons, eight skills, three quizzes, and the unit test.
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
    blurb: "Book: Chapter 5 Be Prepared · Place value and rounding, fractions, and one-step equations.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · Place value", prompt: "Which digit of 5274 is in the **tens** place?",
        options: [{ t: "7" }, { t: "2", fb: "2 is in the hundreds place." }, { t: "4", fb: "4 is in the ones place." }],
        answer: 0, skill: "Place value", hints: ["From the right: ones, tens, hundreds."], why: "5 thousands, 2 hundreds, 7 tens, 4 ones." },
      { type: "num", prompt: "Round 3846 to the nearest hundred.", answer: 3800, skill: "Round whole numbers",
        near: nearBig(3800, [{ v: 3900, fb: "The tens digit is 4, which is less than 5: round down." }, { v: 3850, fb: "That is the nearest ten." }]),
        hints: ["Look at the tens digit."], why: "The tens digit, 4, is less than 5." },
      Object.assign({ kicker: "Check 2 · Fractions", prompt: "Simplify $\\frac{6}{10}$.", skill: "Simplify a fraction",
        hints: ["2 divides both."], why: "$\\frac{6 \\div 2}{10 \\div 2} = \\frac{3}{5}$." }, fracIn(3, 5)),
      { type: "choice", prompt: "Multiply $\\frac{3}{10} \\cdot \\frac{7}{10}$.",
        options: [{ t: "$\\frac{21}{100}$" }, { t: "$\\frac{21}{10}$", fb: "The denominators multiply too: $10 \\cdot 10$." }, { t: "$\\frac{10}{20}$", fb: "Multiply, do not add." }],
        answer: 0, skill: "Multiply fractions", hints: ["Numerators together, denominators together."], why: "$\\frac{3 \\cdot 7}{10 \\cdot 10} = \\frac{21}{100}$." },
      { type: "num", kicker: "Check 3 · Equations", prompt: "Solve $x + 9 = -4$.", pre: "$x =$", answer: -13, skill: "Solve with integers",
        near: [{ v: 5, fb: "9 is added, so subtract 9 from both sides." }, { v: 13, fb: "$-4 - 9$ is negative." }], hints: ["Subtract 9 from both sides."], why: "$-4 - 9 = -13$." },
      { type: "num", prompt: "Solve $6y = -42$.", pre: "$y =$", answer: -7, skill: "Division Property",
        near: [{ v: 7, fb: "Different signs give a negative quotient." }, { v: -48, fb: "6 multiplies $y$: divide both sides by 6." }], hints: ["Divide both sides by 6."], why: "$-42 \\div 6 = -7$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 5.1**. If **check 1** slipped, see lesson 1.1. If **check 2** slipped, see lesson 4.2. If **check 3** slipped, see lesson 3.5.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ================================================================ 5.1 · Decimals */
  var HOW_5_1 = [["Whole", "The number to the left of the decimal point is the whole-number part."],
                 ["Place", "Find the place value of the final digit."],
                 ["Write", "Write the digits after the point over that place value."],
                 ["Simplify", "Simplify the fraction, if possible."]];
  LESSONS.push({
    title: "Decimals",
    blurb: "Book 5.1 · Naming and writing decimals, decimals as fractions, ordering and rounding.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "In $4.27$, which place is the 7 in?",
        options: [{ t: "Hundredths" }, { t: "Tenths", fb: "The first place after the point is tenths: that is the 2." }, { t: "Hundreds", fb: "Hundreds are to the left of the point. These places end in “ths”." }],
        answer: 0, skill: "Decimal place value", hints: ["After the point: tenths, hundredths, thousandths."], why: "4 ones, 2 tenths, 7 hundredths." },
      { type: "learn", kicker: "The idea",
        prompt: "A decimal is another way to write a fraction whose denominator is 10, 100, 1000, and so on. Each place to the right of the point is ten times smaller: tenths, hundredths, thousandths. The point is read as “and”.",
        scene: { type: "method", how: HOW_5_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $4.36$ written as a mixed number.",
        scene: { type: "walk", how: HOW_5_1, rows: [
          { step: 1, m: "4.36", say: "The 4, to the left of the point, is the whole-number part." },
          { step: 2, m: "0.3\\mathbf{6}", say: "The final digit, 6, is in the hundredths place.",
            ask: { prompt: "Which place is the final digit, 6, in?", answer: 0,
                   options: [{ t: "Hundredths" }, { t: "Tenths", fb: "The 3 is in the tenths place. The 6 is one place further right." }] } },
          { step: 3, m: "4\\frac{36}{100}", say: "Thirty-six hundredths: “four and thirty-six hundredths”." },
          { step: 4, m: "4\\frac{36}{100} = 4\\frac{9}{25}", say: "4 divides both 36 and 100." }] },
        gate: true, then: "The name of the last place is the denominator." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $0.125$ as a fraction.",
        how: HOW_5_1, skill: "Decimal to fraction",
        steps: [
          { step: 1, ask: "What is the whole-number part of $0.125$?", type: "num", answer: 0, hint: "Look to the left of the point.",
            m: "0.125", say: "No wholes: the answer is a proper fraction." },
          { step: 2, ask: "Which place is the final digit, 5, in?", type: "choice", answer: 0,
            options: [{ t: "Thousandths" }, { t: "Hundredths", fb: "The 2 is in the hundredths place." }, { t: "Tenths", fb: "The 1 is in the tenths place." }],
            m: "0.12\\mathbf{5}", say: "Three places after the point: thousandths." },
          { step: 3, ask: "Which fraction is it?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{125}{1000}$" }, { t: "$\\frac{125}{100}$", fb: "Three decimal places means thousandths." }, { t: "$\\frac{1}{125}$", fb: "The digits after the point go on top." }],
            m: "\\frac{125}{1000}", say: "One hundred twenty-five thousandths." },
          { step: 4, ask: "125 divides both. What is $1000 \\div 125$?", type: "num", answer: 8, hint: "$125 \\cdot 8 = 1000$.",
            m: "\\frac{125}{1000} = \\frac{1}{8}", say: "Divide the numerator and the denominator by 125." }],
        why: "Whole, place, write, simplify. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Write “six and seventeen thousandths” as a decimal.", answer: 6.017, tol: 1e-9, skill: "Write decimals",
        near: [{ v: 6.17, tol: 1e-9, fb: "Thousandths need three decimal places. Use a zero as a place holder." }, { v: 0.617, tol: 1e-9, fb: "“And” marks the decimal point: the 6 is a whole number." }],
        hints: ["“And” is the point. Thousandths means three places: 0.017."], why: "$6 + \\frac{17}{1000} = 6.017$." },
      { type: "numberline", prompt: "Each tick is one tenth. Drag the point to $0.4$.",
        min: 0, max: 1, tick: 0.1, label: 5, show: false, mode: "point", points: [{ v: 0.9, drag: true }], answer: { points: [0.4] }, skill: "Decimals on the number line",
        hints: ["Four ticks to the right of 0."], why: "$0.4$ is four tenths." },
      { type: "learn", kicker: "A harder case",
        prompt: "Rounding a decimal works just as it does for whole numbers. Round $18.379$ to the nearest **hundredth**.",
        scene: { type: "walk", how: [["Locate", "Find the digit in the place you are rounding to."],
                                    ["Look", "Look at the digit to its right."],
                                    ["Decide", "5 or more: add 1 to the located digit. Less than 5: leave it."],
                                    ["Rewrite", "Drop all the digits to the right."]], rows: [
          { step: 1, m: "18.3\\mathbf{7}9", say: "The hundredths digit is 7." },
          { step: 2, m: "18.37\\mathbf{9}", say: "The digit to its right is 9." },
          { step: 3, m: "9 \\ge 5", say: "5 or more, so the 7 becomes 8." },
          { step: 4, m: "18.379 \\approx 18.38", say: "Drop the thousandths digit." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Round $2.846$ to the nearest **tenth**.", answer: 2.8, tol: 1e-9, skill: "Round decimals",
        near: [{ v: 2.9, tol: 1e-9, fb: "Look only at the digit right after the tenths: 4 is less than 5." }, { v: 2.85, tol: 1e-9, fb: "That is the nearest hundredth." }, { v: 3, fb: "That is the nearest whole number." }],
        hints: ["The tenths digit is 8. The digit after it is 4."], why: "4 is less than 5, so the 8 stays: $2.8$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ravi says $0.4 < 0.31$, because 4 is less than 31. What is wrong?",
        options: [{ t: "Compare the same places: $0.4 = 0.40$, and 40 hundredths is more than 31 hundredths." },
                  { t: "Nothing. It is right.", fb: "4 tenths is more than 3 tenths." },
                  { t: "Decimals with different lengths cannot be compared.", fb: "They can: write zeros at the end so the lengths match." }],
        answer: 0, skill: "Order decimals", hints: ["Write both with two decimal places."], why: "$0.40 > 0.31$." },
      { type: "order", kicker: "Use it", prompt: "Four sprinters' times, in seconds. Put them in order, **fastest first** (the least time).",
        items: ["$9.58$", "$9.6$", "$9.69$", "$9.7$"], skill: "Order decimals",
        hints: ["Write each with two decimal places: 9.60 and 9.70."],
        why: "$9.58 < 9.60 < 9.69 < 9.70$." }
    ]
  });

  /* ======================================================= 5.2 · Decimal operations */
  var HOW_5_2 = [["Whole", "Multiply as if they were whole numbers, ignoring the decimal points."],
                 ["Count", "Count the decimal places in both factors together."],
                 ["Place", "Put the point that many places from the right, and give the product its sign."]];
  LESSONS.push({
    title: "Decimal operations",
    blurb: "Book 5.2 · Adding, subtracting, multiplying and dividing decimals, and money.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "To add or subtract decimals, line up the **decimal points**. Add $2.5 + 0.34$." + stack("+", ["2.50", "0.34"], null),
        answer: 2.84, tol: 1e-9, skill: "Add decimals",
        near: [{ v: 0.59, tol: 1e-9, fb: "Line up the points, not the last digits: $2.50 + 0.34$." }],
        hints: ["Write 2.5 as 2.50, then add column by column."], why: "$2.50 + 0.34 = 2.84$." },
      { type: "learn", kicker: "Explore",
        prompt: "Multiplying is different. Tenths times tenths gives hundredths: $0.3 \\cdot 0.2 = \\frac{3}{10} \\cdot \\frac{2}{10} = \\frac{6}{100} = 0.06$. One decimal place and one decimal place make **two**." },
      { type: "learn", kicker: "The idea",
        prompt: "So to multiply decimals, do not line up the points. Work with whole numbers, then count: the product has as many decimal places as the two factors have together.",
        scene: { type: "method", how: HOW_5_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $4.2 \\cdot 0.36$ multiplied.",
        scene: { type: "walk", how: HOW_5_2, rows: [
          { step: 1, m: "4.2 \\cdot 0.36", say: "Set the points aside for now." },
          { step: 1, m: "42 \\cdot 36 = 1512", say: "Multiply the whole numbers." },
          { step: 2, m: "1 + 2 = 3", say: "$4.2$ has one decimal place and $0.36$ has two.",
            ask: { prompt: "How many decimal places will the product have?", answer: 0,
                   options: [{ t: "3" }, { t: "2", fb: "Add the places of both factors: $1 + 2$." }] } },
          { step: 3, m: "4.2 \\cdot 0.36 = 1.512", say: "Count three places from the right of 1512." }] },
        gate: true, then: "Estimate to check: about 4 times about a third is a little more than 1." },
      { type: "guided", kicker: "Together",
        prompt: "Now you multiply $-2.7 \\cdot 0.05$.",
        how: HOW_5_2, skill: "Multiply decimals",
        steps: [
          { step: 1, ask: "Ignore the points and the sign. What is $27 \\cdot 5$?", type: "num", answer: 135, hint: "$20 \\cdot 5 + 7 \\cdot 5$.",
            m: "27 \\cdot 5 = 135", say: "The digits of the product." },
          { step: 2, ask: "How many decimal places do $2.7$ and $0.05$ have together?", type: "num", answer: 3, near: [{ v: 2, fb: "$2.7$ has one place and $0.05$ has two." }], hint: "$1 + 2$.",
            m: "1 + 2 = 3", say: "Three decimal places." },
          { step: 3, ask: "Place the point, and give the sign. What is $-2.7 \\cdot 0.05$?", type: "choice", answer: 0,
            options: [{ t: "$-0.135$" }, { t: "$-1.35$", fb: "Three places from the right of 135 puts the point in front: 0.135." }, { t: "$0.135$", fb: "Different signs give a negative product." }],
            m: "-2.7 \\cdot 0.05 = -0.135", say: "Three places, and a negative sign." }],
        why: "Whole, count, place. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Subtract $20 - 14.65$.", answer: 5.35, tol: 1e-9, skill: "Subtract decimals",
        near: [{ v: 6.65, tol: 1e-9, fb: "Borrowing changes the digits to the left: $20.00 - 14.65$." }, { v: 6.35, tol: 1e-9, fb: "After borrowing, 19 − 14 leaves 5 wholes." }],
        hints: ["Write 20 as 20.00 and line up the points."], why: "$20.00 - 14.65 = 5.35$." },
      { type: "num", prompt: "Multiplying by a power of 10 moves the point right, one place for each zero. Multiply $5.63 \\cdot 100$.", answer: 563, skill: "Powers of 10",
        near: [{ v: 56.3, tol: 1e-9, fb: "100 has two zeros: move the point two places." }, { v: 5630, fb: "100 has two zeros: move the point two places, not three." }],
        hints: ["Two zeros, two places."], why: "$5.63 \\to 56.3 \\to 563$." },
      { type: "learn", kicker: "A harder case",
        prompt: "To **divide** by a decimal, first make the divisor a whole number. $$4.56 \\div 0.6$$",
        scene: { type: "walk", how: [["Shift", "Move the decimal point to the right in both numbers until the divisor is whole."],
                                    ["Divide", "Divide as usual. The point in the quotient sits above the point in the dividend."],
                                    ["Check", "Multiply the quotient by the original divisor."]], rows: [
          { step: 1, m: "4.56 \\div 0.6", say: "The divisor, $0.6$, is not a whole number." },
          { step: 1, m: "45.6 \\div 6", say: "Move the point one place in both. That multiplies both by 10, so the quotient is unchanged." },
          { step: 2, m: "45.6 \\div 6 = 7.6", say: "$6 \\cdot 7 = 42$, leaving 3.6, and $36 \\div 6 = 6$ tenths." },
          { step: 3, m: "7.6 \\cdot 0.6 = 4.56", say: "$76 \\cdot 6 = 456$, with two decimal places. True." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Divide $7.2 \\div 0.09$.", answer: 80, skill: "Divide decimals",
        near: [{ v: 8, fb: "Move the point two places in **both** numbers: $720 \\div 9$." }, { v: 0.8, tol: 1e-9, fb: "Move the point two places in both numbers: $720 \\div 9$." }],
        hints: ["$720 \\div 9$."], why: "$720 \\div 9 = 80$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["0.4 \\cdot 0.2", "4 \\cdot 2 = 8", "0.8"], answer: 2, fix: "0.08",
        fb: { 0: GIVEN, 1: "This is right: multiply the whole numbers first." }, skill: "Multiply decimals",
        hints: ["How many decimal places do the two factors have together?"],
        why: "One place and one place make two: $0.08$." },
      { type: "num", kicker: "Use it", prompt: "You buy 3 notebooks at \\$2.75 each and pay with a \\$10 bill. How much change do you get, in dollars?",
        post: "dollars", answer: 1.75, tol: 1e-9, skill: "Money",
        near: [{ v: 8.25, tol: 1e-9, fb: "That is the cost. Subtract it from 10." }, { v: 7.25, tol: 1e-9, fb: "That is the change for one notebook. You bought three." }],
        hints: ["$3 \\cdot 2.75$, then subtract from 10."], why: "$3 \\cdot 2.75 = 8.25$, and $10 - 8.25 = 1.75$." }
    ]
  });

  /* ==================================================== 5.3 · Decimals and fractions */
  var HOW_5_3 = [["Divide", "The fraction bar means division: divide the numerator by the denominator."],
                 ["Continue", "Write zeros after the decimal point and keep dividing until it stops or repeats."],
                 ["Write", "Write the quotient, with a bar over any digits that repeat."]];
  LESSONS.push({
    title: "Decimals and fractions",
    blurb: "Book 5.3 · Fractions as decimals, repeating decimals, comparing the two forms, and circles.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A fraction bar means division. So what is $\\frac{1}{2}$ as a decimal?",
        options: [{ t: "$0.5$" }, { t: "$1.2$", fb: "The digits are not placed side by side. Divide 1 by 2." }, { t: "$0.2$", fb: "$0.2$ is two tenths, or $\\frac{1}{5}$." }],
        answer: 0, skill: "Fraction to decimal", hints: ["$1 \\div 2$."], why: "$1 \\div 2 = 0.5$: five tenths is one half." },
      { type: "learn", kicker: "The idea",
        prompt: "Every fraction is a division, and carrying it out gives the decimal. Some stop: $\\frac{3}{4} = 0.75$. Others repeat for ever: $\\frac{1}{3} = 0.333\\ldots$, written $0.\\overline{3}$.",
        scene: { type: "method", how: HOW_5_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\frac{5}{8}$ written as a decimal.",
        scene: { type: "walk", how: HOW_5_3, rows: [
          { step: 1, m: "\\frac{5}{8} = 5 \\div 8", say: "The bar means “divided by”." },
          { step: 2, m: "5.000 \\div 8", say: "8 does not go into 5, so write a point and zeros.",
            ask: { prompt: "8 into 50 goes how many times?", answer: 0,
                   options: [{ t: "6" }, { t: "5", fb: "$8 \\cdot 5 = 40$ leaves 10, and 8 still fits once more." }] } },
          { step: 2, m: "50 = 8 \\cdot 6 + 2 \\quad 20 = 8 \\cdot 2 + 4 \\quad 40 = 8 \\cdot 5", say: "The digits are 6, then 2, then 5, and the remainder is 0." },
          { step: 3, m: "\\frac{5}{8} = 0.625", say: "The division stops: a terminating decimal." }] },
        gate: true, then: "Each remainder gets a zero and is divided again." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $\\frac{7}{20}$ as a decimal.",
        how: HOW_5_3, skill: "Fraction to decimal",
        steps: [
          { step: 1, ask: "Which division gives the decimal?", type: "choice", answer: 0,
            options: [{ t: "$7 \\div 20$" }, { t: "$20 \\div 7$", fb: "Numerator divided by denominator." }],
            m: "\\frac{7}{20} = 7 \\div 20", say: "Numerator divided by denominator." },
          { step: 2, ask: "20 into 70 goes 3 times, leaving 10. 20 into 100 goes how many times?", type: "num", answer: 5, hint: "$20 \\cdot 5$.",
            m: "70 = 20 \\cdot 3 + 10 \\quad 100 = 20 \\cdot 5", say: "The digits are 3, then 5, and the remainder is 0." },
          { step: 3, ask: "The digits after the point are 3 and 5. What is the decimal?", type: "choice", answer: 0,
            options: [{ t: "$0.35$" }, { t: "$3.5$", fb: "$7 \\div 20$ is less than 1." }, { t: "$0.305$", fb: "No zero belongs between the 3 and the 5." }],
            m: "\\frac{7}{20} = 0.35", say: "Thirty-five hundredths." }],
        why: "Divide, continue, write. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Write $\\frac{3}{4}$ as a decimal.", answer: 0.75, tol: 1e-9, skill: "Fraction to decimal",
        near: [{ v: 3.4, tol: 1e-9, fb: "The bar means division: $3 \\div 4$." }, { v: 4 / 3, tol: 1e-2, fb: "That is $4 \\div 3$. Divide the numerator by the denominator." }],
        hints: ["$3.00 \\div 4$."], why: "$30 = 4 \\cdot 7 + 2$ and $20 = 4 \\cdot 5$: $0.75$." },
      { type: "choice", prompt: "To compare a fraction with a decimal, write both as decimals. Which is greater: $\\frac{3}{8}$ or $0.4$?",
        options: [{ t: "$0.4$, because $\\frac{3}{8} = 0.375$" }, { t: "$\\frac{3}{8}$", fb: "$3 \\div 8 = 0.375$, which is less than $0.400$." }, { t: "They are equal", fb: "$\\frac{3}{8} = 0.375$, not $0.4$." }],
        answer: 0, skill: "Order decimals and fractions", hints: ["$3 \\div 8$."], why: "$0.375 < 0.400$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When a remainder comes back, the digits repeat. Write $\\frac{4}{11}$ as a decimal.",
        scene: { type: "walk", how: HOW_5_3, rows: [
          { step: 1, m: "\\frac{4}{11} = 4 \\div 11", say: "11 does not go into 4: start with 40." },
          { step: 2, m: "40 = 11 \\cdot 3 + 7", say: "First digit 3, remainder 7." },
          { step: 2, m: "70 = 11 \\cdot 6 + 4", say: "Next digit 6, remainder 4: exactly where we started." },
          { step: 3, m: "\\frac{4}{11} = 0.3636\\ldots = 0.\\overline{36}", say: "The remainders repeat, so the digits do. The bar covers the block that repeats." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A circle's circumference is $C = 2\\pi r$. A circle has radius 10 cm. Use $\\pi \\approx 3.14$ to approximate $C$.",
        post: "cm", answer: 62.8, tol: 1e-9, skill: "Circles",
        near: [{ v: 314, fb: "That is the area, $\\pi r^2$." }, { v: 31.4, tol: 1e-9, fb: "$C = 2\\pi r$: do not leave out the 2." }],
        hints: ["$2 \\cdot 3.14 \\cdot 10$."], why: "$2 \\cdot 3.14 \\cdot 10 = 62.8$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Mia writes $\\frac{1}{3} = 0.3$. What is wrong?",
        options: [{ t: "$0.3$ is $\\frac{3}{10}$. One third is $0.333\\ldots$, which never stops: $0.\\overline{3}$." },
                  { t: "It should be $0.13$.", fb: "$1 \\div 3$ gives 3s after the point: 0.333…" },
                  { t: "Nothing. It is right.", fb: "$3 \\cdot 0.3 = 0.9$, not 1." }],
        answer: 0, skill: "Repeating decimals", hints: ["Multiply $0.3$ by 3. Do you get 1?"], why: "$\\frac{1}{3} = 0.\\overline{3}$. Stopping at 0.3 is only an approximation." },
      { type: "num", kicker: "Use it", prompt: "A circle's area is $A = \\pi r^2$. A round table has radius 2 feet. Use $\\pi \\approx 3.14$ to approximate its area.",
        post: "square feet", answer: 12.56, tol: 1e-9, skill: "Circles",
        near: [{ v: 6.28, tol: 1e-9, fb: "Square the radius first: $2^2 = 4$." }, { v: 39.4384, tol: 1e-3, fb: "Only the radius is squared, not $\\pi$." }],
        hints: ["$3.14 \\cdot 2^2$."], why: "$3.14 \\cdot 4 = 12.56$." }
    ]
  });
  /* ============================================== 5.4 · Solve equations with decimals */
  var HOW_5_4 = [["Undo", "See what is done to the variable, and do the opposite to both sides."],
                 ["Simplify", "Simplify each side."],
                 ["Check", "Substitute the answer into the original equation."]];
  LESSONS.push({
    title: "Solve equations with decimals",
    blurb: "Book 5.4 · Decimal solutions, the properties of equality with decimals, and translating to an equation.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $x = 0.8$ a solution of $x + 0.4 = 1.2$?",
        options: [{ t: "Yes: $0.8 + 0.4 = 1.2$" }, { t: "No", fb: "8 tenths and 4 tenths make 12 tenths, which is $1.2$." }],
        answer: 0, skill: "Check a solution", hints: ["Substitute $0.8$ for $x$."], why: "$0.8 + 0.4 = 1.2$, a true statement." },
      { type: "learn", kicker: "The idea",
        prompt: "Nothing new is needed. The same properties of equality work on decimals: undo an addition by subtracting, a multiplication by dividing, a division by multiplying. Only the arithmetic changes.",
        scene: { type: "method", how: HOW_5_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$0.8n = -4.8$$",
        scene: { type: "walk", how: HOW_5_4, rows: [
          { step: 1, m: "0.8n = -4.8", say: "$n$ is multiplied by $0.8$." },
          { step: 1, m: "\\frac{0.8n}{0.8} = \\frac{-4.8}{0.8}", say: "Divide both sides by $0.8$.",
            ask: { prompt: "To divide by $0.8$, move the point one place in both numbers. Which division is that?", answer: 0,
                   options: [{ t: "$-48 \\div 8$" }, { t: "$-4.8 \\div 8$", fb: "The point moves in both numbers, so $-4.8$ becomes $-48$." }] } },
          { step: 2, m: "n = -6", say: "$-48 \\div 8 = -6$." },
          { step: 3, m: "0.8(-6) = -4.8", say: "$8 \\cdot 6 = 48$, with one decimal place, and the signs differ. True." }] },
        gate: true, then: "The steps are the ones you know. The decimal arithmetic is the only new part." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $y - 2.3 = -4.7$.",
        how: HOW_5_4, skill: "Solve with decimals",
        steps: [
          { step: 1, ask: "$2.3$ is subtracted from $y$. What undoes that?", type: "choice", answer: 0,
            options: [{ t: "Add $2.3$ to both sides" }, { t: "Subtract $2.3$ from both sides", fb: "That would give $y - 4.6$. Do the opposite of subtracting." }],
            m: "y - 2.3 + 2.3 = -4.7 + 2.3", say: "Add $2.3$ to both sides." },
          { step: 2, ask: "What is $-4.7 + 2.3$?", type: "num", answer: -2.4, tol: 1e-9,
            near: [{ v: 2.4, tol: 1e-9, fb: "$4.7$ is the larger absolute value, and it is negative." }, { v: -7, tol: 1e-9, fb: "Different signs: subtract the absolute values." }], hint: "$4.7 - 2.3$, with the sign of $-4.7$.",
            m: "y = -2.4", say: "Different signs: subtract, and keep the sign of the larger." },
          { step: 3, ask: "Check: what is $-2.4 - 2.3$?", type: "num", answer: -4.7, tol: 1e-9, near: [{ v: -0.1, tol: 1e-9, fb: "$-2.4 - 2.3$ is $-2.4 + (-2.3)$: same signs, add." }], hint: "$-2.4 + (-2.3)$.",
            m: "-2.4 - 2.3 = -4.7", say: "It matches the right side." }],
        why: "Undo, simplify, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $a + 3.9 = 5.4$.", pre: "$a =$", answer: 1.5, tol: 1e-9, skill: "Solve with decimals",
        near: [{ v: 9.3, tol: 1e-9, fb: "$3.9$ is added, so subtract it from both sides." }],
        hints: ["Subtract $3.9$ from both sides."], why: "$5.4 - 3.9 = 1.5$." },
      { type: "num", prompt: "Solve $\\frac{c}{-2.6} = -4.5$.", pre: "$c =$", answer: 11.7, tol: 1e-9, skill: "Solve with decimals",
        near: [{ v: -11.7, tol: 1e-9, fb: "Same signs give a positive product." }, { v: 4.5 / 2.6, tol: 1e-3, fb: "$c$ is divided by $-2.6$, so multiply both sides by $-2.6$." }],
        hints: ["Multiply both sides by $-2.6$."], why: "$-2.6(-4.5) = 11.7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Translate, then solve: “The product of $-3.1$ and $x$ is $5.27$.”",
        scene: { type: "walk", how: [["Translate", "Turn the sentence into an equation. “Is” is the equals sign."],
                                    ["Solve", "Undo what is done to the variable, on both sides."],
                                    ["Check", "Substitute your answer into the sentence."]], rows: [
          { step: 1, m: "-3.1x = 5.27", say: "“The product of $-3.1$ and $x$” is $-3.1x$." },
          { step: 2, m: "x = \\frac{5.27}{-3.1}", say: "Divide both sides by $-3.1$." },
          { step: 2, m: "x = -1.7", say: "$52.7 \\div 31 = 1.7$, and the signs differ." },
          { step: 3, m: "-3.1(-1.7) = 5.27", say: "$31 \\cdot 17 = 527$, with two decimal places. True." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Translate and solve: “The sum of $n$ and $0.45$ is $4.25$.”", pre: "$n =$", answer: 3.8, tol: 1e-9, skill: "Translate and solve",
        near: [{ v: 4.7, tol: 1e-9, fb: "The equation is $n + 0.45 = 4.25$. Subtract $0.45$ from both sides." }],
        hints: ["$n + 0.45 = 4.25$."], why: "$4.25 - 0.45 = 3.80$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["0.5x = 20", "x = 20 \\cdot 0.5", "x = 10"], answer: 1, fix: "x = \\dfrac{20}{0.5}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Solve with decimals",
        hints: ["$x$ is multiplied by $0.5$. What undoes that?"],
        why: "Divide both sides by $0.5$: $x = 40$. Half of 40 is 20." },
      { type: "num", kicker: "Use it", prompt: "Tickets cost \\$7.50 each, and a group paid \\$52.50 in all, so $7.5t = 52.5$. How many tickets did they buy?",
        pre: "$t =$", post: "tickets", answer: 7, skill: "Solve with decimals",
        near: [{ v: 45, fb: "$7.5$ multiplies $t$: divide both sides by $7.5$." }],
        hints: ["$525 \\div 75$."], why: "$52.5 \\div 7.5 = 7$." }
    ]
  });

  /* ================================================= 5.5 · Averages and probability */
  var HOW_5_5 = [["Sum", "Add all the values."],
                 ["Count", "Count how many values there are."],
                 ["Divide", "Divide the sum by the count."],
                 ["Sense", "Check that the mean lies between the least and the greatest value."]];
  LESSONS.push({
    title: "Averages and probability",
    blurb: "Book 5.5 · The mean, the median and the mode of a set of numbers, and the basic definition of probability.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Three friends have 8, 12 and 10 marbles. They pool them and share equally. How many does each get?", answer: 10, skill: "Mean",
        near: [{ v: 30, fb: "That is the total. Share it among the 3 friends." }], hints: ["$8 + 12 + 10$, then divide by 3."], why: "$30 \\div 3 = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "That equal share is the **mean**: the sum divided by the count. The **median** is the middle value once the values are in order. The **mode** is the value that appears most often. Each describes a typical value.",
        scene: { type: "method", how: HOW_5_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the mean of five quiz scores found: 8, 12, 15, 9, 6.",
        scene: { type: "walk", how: HOW_5_5, rows: [
          { step: 1, m: "8 + 12 + 15 + 9 + 6 = 50", say: "The sum of the values." },
          { step: 2, m: "n = 5", say: "Five values." },
          { step: 3, m: "\\frac{50}{5} = 10", say: "The sum divided by the count.",
            ask: { prompt: "What do you divide the sum by?", answer: 0,
                   options: [{ t: "5, the number of values" }, { t: "15, the greatest value", fb: "Divide by how many values there are." }] } },
          { step: 4, m: "6 < 10 < 15", say: "Between the least and the greatest: sensible." }] },
        gate: true, then: "A mean outside the range of the data is always a mistake." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the mean of $4.5$, $6$, $7.5$ and $6$.",
        how: HOW_5_5, skill: "Mean",
        steps: [
          { step: 1, ask: "Add the values: $4.5 + 6 + 7.5 + 6$.", type: "num", answer: 24, hint: "$4.5 + 7.5 = 12$.",
            m: "4.5 + 6 + 7.5 + 6 = 24", say: "The sum." },
          { step: 2, ask: "How many values are there?", type: "num", answer: 4, near: [{ v: 3, fb: "6 appears twice, and both count." }], hint: "Count them, repeats included.",
            m: "n = 4", say: "Four values. A repeated value is counted each time." },
          { step: 3, ask: "Divide: $24 \\div 4$.", type: "num", answer: 6, hint: "$4 \\cdot 6 = 24$.",
            m: "\\frac{24}{4} = 6", say: "The mean is 6." },
          { step: 4, ask: "Is 6 between the least value and the greatest?", type: "choice", answer: 0,
            options: [{ t: "Yes: $4.5 < 6 < 7.5$" }, { t: "No", fb: "The least is 4.5 and the greatest is 7.5." }],
            m: "4.5 < 6 < 7.5", say: "Sensible." }],
        why: "Sum, count, divide, sense. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the **median** of 9, 3, 12, 5, 8. Put the values in order first.", answer: 8, skill: "Median",
        near: [{ v: 12, fb: "That is the middle of the list as written. Order the values first." }, { v: 7.4, tol: 1e-9, fb: "That is the mean. The median is the middle value." }],
        hints: ["In order: 3, 5, 8, 9, 12."], why: "The middle of 3, 5, 8, 9, 12 is 8." },
      { type: "num", prompt: "Find the **mode** of 2, 5, 3, 5, 8, 5, 2.", answer: 5, skill: "Mode",
        near: [{ v: 2, fb: "2 appears twice, but another value appears three times." }, { v: 3, fb: "The mode is the value that appears most often, not how often." }],
        hints: ["Count how often each value appears."], why: "5 appears three times, more than any other value." },
      { type: "learn", kicker: "A harder case",
        prompt: "With an even number of values there is no single middle. Find the median of 7, 3, 10, 4.",
        scene: { type: "walk", how: [["Order", "List the values from least to greatest."],
                                    ["Middle", "Find the middle. An even count has two middle values."],
                                    ["Average", "With two middle values, take their mean."]], rows: [
          { step: 1, m: "3 \\quad 4 \\quad 7 \\quad 10", say: "The values in order." },
          { step: 2, m: "4 \\text{ and } 7", say: "Four values: the two in the middle." },
          { step: 3, m: "\\frac{4 + 7}{2} = 5.5", say: "Half-way between 4 and 7." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The **probability** of an event is the number of favourable outcomes divided by the total number of outcomes. A bag holds 3 red and 5 blue marbles. What is the probability of picking red? (Type a fraction like 2/3.)",
        answer: 3 / 8, tol: 1e-9, shown: "3/8", skill: "Probability",
        near: [{ v: 0.6, tol: 1e-9, fb: "Divide by the total number of marbles, 8, not by the number of blue ones." }, { v: 5 / 8, tol: 1e-9, fb: "That is the probability of blue." }],
        hints: ["3 red out of $3 + 5$ marbles."], why: "$\\frac{3}{8}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Jo finds the median of 6, 1, 9 and says it is 1, the middle number in the list. What is wrong?",
        options: [{ t: "The values must be put in order first: 1, 6, 9. The median is 6." },
                  { t: "The median is the mean: $\\frac{16}{3}$.", fb: "The mean and the median are different measures." },
                  { t: "Nothing. It is right.", fb: "1 is the least value. It cannot be the middle one." }],
        answer: 0, skill: "Median", hints: ["What is the first step for a median?"], why: "In order: 1, 6, 9. The middle value is 6." },
      { type: "num", kicker: "Use it", prompt: "The high temperatures on five days were 21, 24, 19, 24 and 22 degrees. What was the mean high temperature?",
        post: "degrees", answer: 22, skill: "Mean",
        near: [{ v: 24, fb: "That is the mode. The mean is the sum divided by 5." }, { v: 110, fb: "That is the sum. Divide it by 5." }],
        hints: ["$21 + 24 + 19 + 24 + 22 = 110$."], why: "$110 \\div 5 = 22$." }
    ]
  });
  /* =========================================================== 5.6 · Ratios and rate */
  var HOW_5_6 = [["Fraction", "Write the rate as a fraction, with its units."],
                 ["Divide", "Divide the numerator by the denominator, so that the denominator becomes 1."],
                 ["Units", "Write the answer with its units: so much per one."]];
  LESSONS.push({
    title: "Ratios and rate",
    blurb: "Book 5.6 · Ratios and rates as fractions, unit rates, and unit prices.",
    mins: 12, v: 1,
    steps: [
      Object.assign({ kicker: "Warm up", prompt: "A **ratio** compares two quantities, and is written as a fraction. Write the ratio 20 to 35 in simplest form.", skill: "Ratios",
        hints: ["$\\frac{20}{35}$: 5 divides both."], why: "$\\frac{20 \\div 5}{35 \\div 5} = \\frac{4}{7}$." }, fracIn(4, 7)),
      { type: "learn", kicker: "The idea",
        prompt: "A ratio compares quantities with the same units. A **rate** compares quantities with different units, such as miles and hours. A **unit rate** has a denominator of 1: so much **per** one.",
        scene: { type: "method", how: HOW_5_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Anita is paid \\$384 for 32 hours of work. Watch her hourly rate found.",
        scene: { type: "walk", how: HOW_5_6, rows: [
          { step: 1, m: "\\frac{384 \\text{ dollars}}{32 \\text{ hours}}", say: "Dollars compared with hours: a rate." },
          { step: 2, m: "384 \\div 32 = 12", say: "$32 \\cdot 12 = 384$.",
            ask: { prompt: "A unit rate has what in the denominator?", answer: 0,
                   options: [{ t: "1" }, { t: "32", fb: "That is the rate we started with. A unit rate is per one." }] } },
          { step: 2, m: "\\frac{384 \\div 32}{32 \\div 32} = \\frac{12}{1}", say: "Dividing the top and the bottom by 32 makes the denominator 1." },
          { step: 3, m: "\\frac{12 \\text{ dollars}}{1 \\text{ hour}}", say: "12 dollars per hour." }] },
        gate: true, then: "“Per” means “for each one”, and it marks a division." },
      { type: "guided", kicker: "Together",
        prompt: "A car travels 455 miles on 14 gallons of fuel. Now you find the unit rate.",
        how: HOW_5_6, skill: "Unit rates",
        steps: [
          { step: 1, ask: "Which fraction gives miles per gallon?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{455 \\text{ miles}}{14 \\text{ gallons}}$" }, { t: "$\\frac{14 \\text{ gallons}}{455 \\text{ miles}}$", fb: "Miles per gallon puts miles on top." }],
            m: "\\frac{455 \\text{ miles}}{14 \\text{ gallons}}", say: "Miles over gallons." },
          { step: 2, ask: "Divide: $455 \\div 14$.", type: "num", answer: 32.5, tol: 1e-9, hint: "$14 \\cdot 32 = 448$, leaving 7, which is half of 14.",
            m: "455 \\div 14 = 32.5", say: "$14 \\cdot 32 = 448$, and the 7 left over is half of 14." },
          { step: 3, ask: "What are the units of the answer?", type: "choice", answer: 0,
            options: [{ t: "Miles per gallon" }, { t: "Gallons per mile", fb: "Miles were on top, so it is miles for each one gallon." }],
            m: "32.5 \\text{ miles per gallon}", say: "For each one gallon, 32.5 miles." }],
        why: "Fraction, divide, units. Now two on your own." },
      Object.assign({ kicker: "On your own", prompt: "Write the ratio $4.8$ to $11.2$ as a fraction of whole numbers, in simplest form.", skill: "Ratios",
        hints: ["Multiply both by 10 to clear the decimals: 48 to 112. Then 16 divides both."], why: "$\\frac{48}{112} = \\frac{3}{7}$." }, fracIn(3, 7)),
      { type: "num", prompt: "A **unit price** is the price of one unit. A 12-ounce box of cereal costs \\$3.60. What is the unit price, in dollars per ounce?",
        post: "dollars per ounce", answer: 0.3, tol: 1e-9, skill: "Unit price",
        near: [{ v: 12 / 3.6, tol: 1e-2, fb: "That is ounces per dollar. Divide the price by the number of ounces." }, { v: 30, fb: "In dollars, 30 cents is 0.30." }],
        hints: ["$3.60 \\div 12$."], why: "$3.60 \\div 12 = 0.30$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Which is the better buy: 18 ounces for \\$2.70, or 24 ounces for \\$3.12?",
        scene: { type: "walk", how: [["Unit", "Find each unit price: the price divided by the amount."],
                                    ["Compare", "Compare the unit prices."],
                                    ["Choose", "The lower unit price is the better buy."]], rows: [
          { step: 1, m: "2.70 \\div 18 = 0.15", say: "The small jar: 15 cents per ounce." },
          { step: 1, m: "3.12 \\div 24 = 0.13", say: "The large jar: 13 cents per ounce." },
          { step: 2, m: "0.13 < 0.15", say: "The large jar costs less per ounce." },
          { step: 3, m: "\\text{the 24-ounce jar}", say: "The lower unit price is the better buy." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which expression is “427 miles per $h$ hours”?",
        options: [{ t: "$\\frac{427 \\text{ miles}}{h \\text{ hours}}$" }, { t: "$\\frac{h \\text{ hours}}{427 \\text{ miles}}$", fb: "“Per” means divided by: the miles go on top." }, { t: "$427h$", fb: "“Per” is a division, not a multiplication." }],
        answer: 0, skill: "Translate rates", hints: ["The quantity before “per” goes on top."], why: "Miles on top, hours below." },
      { type: "choice", kicker: "Find the error",
        prompt: "A recipe uses 2 cups of sugar to 3 cups of flour. Li writes the ratio of sugar to flour as $\\frac{3}{2}$. What is wrong?",
        options: [{ t: "The quantity named first goes on top: sugar to flour is $\\frac{2}{3}$." },
                  { t: "A ratio must be a whole number.", fb: "A ratio is written as a fraction." },
                  { t: "Nothing. It is right.", fb: "$\\frac{3}{2}$ is the ratio of flour to sugar." }],
        answer: 0, skill: "Ratios", hints: ["Which quantity is named first?"], why: "Sugar to flour: $\\frac{2}{3}$." },
      { type: "num", kicker: "Use it", prompt: "A runner covers 5 miles in 40 minutes. How many minutes per mile is that?",
        post: "minutes per mile", answer: 8, skill: "Unit rates",
        near: [{ v: 0.125, tol: 1e-9, fb: "That is miles per minute. Divide the minutes by the miles." }],
        hints: ["$40 \\div 5$."], why: "$\\frac{40 \\text{ minutes}}{5 \\text{ miles}} = 8$ minutes per mile." }
    ]
  });

  /* ================================================ 5.7 · Simplify and use square roots */
  var HOW_5_7 = [["Below", "Find the largest perfect square below the number."],
                 ["Above", "Find the smallest perfect square above it."],
                 ["Between", "The square root lies between the two whole-number roots."]];
  LESSONS.push({
    title: "Simplify and use square roots",
    blurb: "Book 5.7 · Square roots of perfect squares, estimating the others, and square roots in use.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $7^2$?", answer: 49, skill: "Squares",
        near: [{ v: 14, fb: "$7^2$ is $7 \\cdot 7$, not $7 \\cdot 2$." }], hints: ["$7 \\cdot 7$."], why: "$7 \\cdot 7 = 49$." },
      { type: "learn", kicker: "Explore", prompt: "Drag the side until the square has area **36**. That side is the **square root** of 36.",
        scene: { type: "square", side: 2, max: 10, target: 36 }, gate: true,
        after: "The side that works, squared, gives 36." },
      { type: "learn", kicker: "The idea",
        prompt: "$\\sqrt{36} = 6$ because $6^2 = 36$. The symbol means the positive root, and $-\\sqrt{36} = -6$ is the negative one. Numbers like 36 are **perfect squares**. Most numbers are not, so their square roots fall between whole numbers.",
        scene: { type: "method", how: HOW_5_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\sqrt{60}$ estimated between two whole numbers.",
        scene: { type: "walk", how: HOW_5_7, rows: [
          { step: 1, m: "\\sqrt{60}", say: "60 is not a perfect square." },
          { step: 1, m: "49 < 60", say: "$7^2 = 49$ is the largest perfect square below 60." },
          { step: 2, m: "60 < 64", say: "$8^2 = 64$ is the smallest one above it.",
            ask: { prompt: "Which perfect square comes next after 49?", answer: 0,
                   options: [{ t: "64" }, { t: "56", fb: "56 is $7 \\cdot 8$, not a square. The next square is $8 \\cdot 8$." }] } },
          { step: 3, m: "7 < \\sqrt{60} < 8", say: "So the root is between 7 and 8, and closer to 8." }] },
        gate: true, then: "A calculator gives about 7.75, between 7 and 8 as predicted." },
      { type: "guided", kicker: "Together",
        prompt: "Now you estimate $\\sqrt{30}$.",
        how: HOW_5_7, skill: "Estimate square roots",
        steps: [
          { step: 1, ask: "What is the largest perfect square below 30?", type: "num", answer: 25, near: [{ v: 16, fb: "$5^2 = 25$ is larger and still below 30." }, { v: 5, fb: "5 is its root. The perfect square is $5^2$." }], hint: "$5^2$.",
            m: "25 < 30", say: "$5^2 = 25$." },
          { step: 2, ask: "What is the smallest perfect square above 30?", type: "num", answer: 36, near: [{ v: 49, fb: "$6^2 = 36$ is smaller and still above 30." }, { v: 6, fb: "6 is its root. The perfect square is $6^2$." }], hint: "$6^2$.",
            m: "30 < 36", say: "$6^2 = 36$." },
          { step: 3, ask: "Between which two whole numbers is $\\sqrt{30}$?", type: "choice", answer: 0,
            options: [{ t: "5 and 6" }, { t: "25 and 36", fb: "Those are the squares. Take their roots." }, { t: "6 and 7", fb: "$6^2 = 36$ is already more than 30." }],
            m: "5 < \\sqrt{30} < 6", say: "Between the two roots." }],
        why: "Below, above, between. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Simplify $\\sqrt{144}$.", answer: 12, skill: "Square roots",
        near: [{ v: 72, fb: "A square root is not a half. Which number times itself is 144?" }],
        hints: ["$12 \\cdot 12$."], why: "$12^2 = 144$." },
      { type: "num", prompt: "The radical sign is a grouping symbol. Simplify $\\sqrt{9 + 16}$.", answer: 5, skill: "Square roots",
        near: [{ v: 7, fb: "Add under the radical first: $\\sqrt{25}$." }],
        hints: ["$9 + 16 = 25$."], why: "$\\sqrt{25} = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Letters work the same way. Here every letter stands for a positive number. Simplify $\\sqrt{49x^2}$.",
        scene: { type: "walk", how: [["Number", "Take the square root of the number part."],
                                    ["Letter", "Take the square root of the variable part."],
                                    ["Check", "Square the answer to check."]], rows: [
          { step: 1, m: "\\sqrt{49} = 7", say: "$7 \\cdot 7 = 49$." },
          { step: 2, m: "\\sqrt{x^2} = x", say: "$x \\cdot x = x^2$." },
          { step: 2, m: "\\sqrt{49x^2} = 7x", say: "Put the two parts together." },
          { step: 3, m: "(7x)^2 = 49x^2", say: "$7x \\cdot 7x = 49x^2$. True." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A square garden has area 200 square feet, so its side is $\\sqrt{200}$ feet. Between which whole numbers is the side?",
        options: [{ t: "14 and 15" }, { t: "13 and 14", fb: "$14^2 = 196$ is still below 200." }, { t: "100 and 200", fb: "Halving is not a square root. Try $14^2$ and $15^2$." }],
        answer: 0, skill: "Estimate square roots", hints: ["$14^2 = 196$ and $15^2 = 225$."], why: "$196 < 200 < 225$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\sqrt{25 + 144}", "5 + 12", "17"], answer: 1, fix: "\\sqrt{169}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Square roots",
        hints: ["What must be done before the root is taken?"],
        why: "Add under the radical first: $\\sqrt{169} = 13$." },
      { type: "num", kicker: "Use it", prompt: "On Earth, an object dropped from $h$ feet takes $\\frac{\\sqrt{h}}{4}$ seconds to land. How long does a fall of 64 feet take?",
        post: "seconds", answer: 2, skill: "Square roots in use",
        near: [{ v: 16, fb: "That is $64 \\div 4$. Take the square root first." }, { v: 8, fb: "That is $\\sqrt{64}$. Now divide by 4." }],
        hints: ["$\\sqrt{64} = 8$."], why: "$\\frac{8}{4} = 2$ seconds." }
    ]
  });
  /* ================================================================ Skills */
  // A decimal made from whole numbers, so that no float noise creeps in: dec(1512, 3) is 1.512.
  function dec(n, places) { return Math.round(n) / Math.pow(10, places); }
  function decAns(v, o) { return Object.assign({ type: "num", answer: v, tol: 1e-9 }, o); }
  var SKILLS = [
    { id: "pa5-round", title: "Round decimals", lesson: 2,
      gen: function (R) {
        var n = R.int(1000, 98999), p = R.int(0, 2), v = dec(n, 3), f = Math.pow(10, p), d = Math.floor(n / Math.pow(10, 2 - p)) % 10;
        if (d === 5 && n % Math.pow(10, 2 - p) === 0 && p < 2) n += 1, v = dec(n, 3);
        var ans = Math.round(v * f + 1e-9) / f, up = d >= 5, other = up ? ans - 1 / f : ans + 1 / f;
        return decAns(ans, { prompt: "Round $" + num(v) + "$ to the nearest **" + ["whole number", "tenth", "hundredth"][p] + "**.",
          near: near(ans, [{ v: Math.round(other * f) / f, tol: 1e-9, fb: "The digit to the right is " + d + ", which is " + (up ? "5 or more: round up." : "less than 5: round down.") }]),
          hints: ["Find the " + ["ones", "tenths", "hundredths"][p] + " digit, then look at the digit to its right."],
          why: "The digit to the right is " + d + ": round " + (up ? "up" : "down") + " to $" + num(ans) + "$." });
      } },
    { id: "pa5-tofraction", title: "Write a decimal as a fraction", lesson: 2,
      gen: function (R) {
        var P = R.pick([[2, 10], [4, 10], [5, 10], [6, 10], [8, 10], [25, 100], [75, 100], [5, 100], [15, 100], [35, 100], [45, 100], [12, 100], [125, 1000], [375, 1000], [8, 100], [64, 100], [55, 100], [65, 100], [85, 100], [95, 100], [4, 100], [16, 100], [24, 100], [36, 100], [48, 100], [625, 1000], [875, 1000], [2, 100]]);
        var g = L.gcd(P[0], P[1]);
        return Object.assign({ prompt: "Write $" + num(P[0] / P[1]) + "$ as a fraction in simplest form.",
          hints: ["It is $\\frac{" + P[0] + "}{" + P[1] + "}$. Then simplify."], why: "$\\frac{" + P[0] + "}{" + P[1] + "} = \\frac{" + P[0] / g + "}{" + P[1] / g + "}$." }, fracIn(P[0] / g, P[1] / g));
      } },
    { id: "pa5-operate", title: "Add, subtract, multiply and divide decimals", lesson: 3,
      gen: function (R) {
        var kind = R.int(0, 3), a, b, ans, tex, slip, hint;
        if (kind === 0) { a = R.int(11, 99); b = R.int(101, 999); ans = dec(a * 10 + b, 2); tex = num(dec(a, 1)) + " + " + num(dec(b, 2)); slip = { v: dec(a + b, 2), fb: "Line up the decimal points, not the last digits." }; hint = "Line up the points: write $" + num(dec(a, 1)) + "$ with two decimal places."; }
        else if (kind === 1) { a = R.int(5, 20); b = R.int(101, 499); ans = dec(a * 100 - b, 2); tex = a + " - " + num(dec(b, 2)); slip = { v: dec(a * 100 - b + 100, 2), fb: "After borrowing, the whole-number part is one less." }; hint = "Write " + a + " as $" + a + ".00$."; }
        else if (kind === 2) { a = R.int(12, 99); b = R.int(2, 9); ans = dec(a * b, 3); tex = num(dec(a, 1)) + " \\cdot " + num(dec(b, 2)); slip = { v: dec(a * b, 2), fb: "Count the decimal places in both factors: $1 + 2 = 3$." }; hint = "$" + a + " \\cdot " + b + " = " + a * b + "$, then three decimal places."; }
        else { a = R.int(12, 95); b = R.int(2, 9); ans = dec(a, 1); tex = num(dec(a * b, 2)) + " \\div " + num(dec(b, 1)); slip = { v: dec(a, 2), fb: "Move the point one place in **both** numbers before dividing." }; hint = "Move the point one place in both: $" + num(dec(a * b, 1)) + " \\div " + b + "$."; }
        return decAns(ans, { prompt: ["Add", "Subtract", "Multiply", "Divide"][kind] + ". $$" + tex + "$$", near: near(ans, [Object.assign({ tol: 1e-9 }, slip)]),
          hints: [hint], why: "$" + tex + " = " + num(ans) + "$." });
      } },
    { id: "pa5-todecimal", title: "Write a fraction as a decimal", lesson: 4,
      gen: function (R) {
        var P = R.pick([[1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [3, 20], [7, 20], [9, 20], [1, 25], [7, 25], [3, 50], [9, 10], [11, 20], [13, 20], [17, 20], [9, 25], [11, 25], [3, 25], [7, 50], [9, 50], [3, 10], [7, 10], [1, 20], [19, 20], [21, 25]]);
        return decAns(P[0] / P[1], { prompt: "Write $\\frac{" + P[0] + "}{" + P[1] + "}$ as a decimal.",
          near: [{ v: P[1] / P[0], tol: 1e-3, fb: "Divide the numerator by the denominator: $" + P[0] + " \\div " + P[1] + "$." }],
          hints: ["$" + P[0] + " \\div " + P[1] + "$."], why: "$" + P[0] + " \\div " + P[1] + " = " + num(P[0] / P[1]) + "$." });
      } },
    { id: "pa5-solve", title: "Solve equations with decimals", lesson: 5,
      gen: function (R) {
        var v = R.pick(["x", "n", "y", "a"]), kind = R.int(0, 2), x0 = R.int(12, 95) * R.pick([1, -1]), k = R.int(2, 9), a = R.int(11, 59), eq, how, slip, ans = dec(x0, 1);
        if (kind === 0) { eq = v + " + " + num(dec(a, 1)) + " = " + num(dec(x0 + a, 1)); how = "Subtract $" + num(dec(a, 1)) + "$ from both sides."; slip = dec(x0 + 2 * a, 1); }
        else if (kind === 1) { eq = num(dec(k, 1)) + v + " = " + num(dec(k * x0, 2)); how = "Divide both sides by $" + num(dec(k, 1)) + "$."; slip = dec(-x0, 1); }
        else { eq = "\\frac{" + v + "}{" + k + "} = " + num(dec(x0, 1)); ans = dec(k * x0, 1); how = "Multiply both sides by " + k + "."; slip = dec(x0, 1) / k; }
        return decAns(ans, { prompt: "Solve. $$" + eq + "$$", pre: "$" + v + " =$", near: near(ans, [{ v: slip, tol: 1e-9, fb: "Do the opposite to both sides, and watch the sign. " + how }]),
          hints: [how], why: how + " $" + v + " = " + num(ans) + "$." });
      } },
    { id: "pa5-mean", title: "Mean, median and mode", lesson: 6,
      gen: function (R) {
        var kind = R.int(0, 2), m0 = R.int(12, 30), a = R.int(1, 5), b = R.int(1, 5), vals, ans, hint, why;
        if (kind === 0) { vals = R.shuffle([m0 - a, m0 + a, m0 - b, m0 + b, m0]); ans = m0; hint = "Add the values, then divide by 5."; why = "The sum is " + 5 * m0 + ", and $" + 5 * m0 + " \\div 5 = " + m0 + "$."; }
        else if (kind === 1) { var s = [m0 - a - b, m0 - a, m0, m0 + b, m0 + a + b + 1]; vals = R.shuffle(s.slice()); ans = m0; hint = "Put the values in order first."; why = "In order: " + s.join(", ") + ". The middle value is " + m0 + "."; }
        else { vals = R.shuffle([m0, m0, m0, m0 + a, m0 + a, m0 - b, m0 + a + b]); ans = m0; hint = "Count how often each value appears."; why = m0 + " appears three times, more than any other value."; }
        return { type: "num", prompt: "Find the **" + ["mean", "median", "mode"][kind] + "** of " + vals.join(", ") + ".", answer: ans,
          near: near(ans, kind === 1 ? [{ v: vals[2], fb: "That is the middle of the list as written. Order the values first." }] : kind === 2 ? [{ v: m0 + a, fb: "That value appears twice. Another appears three times." }] : [{ v: 5 * m0, fb: "That is the sum. Divide it by the number of values." }]),
          hints: [hint], why: why };
      } },
    { id: "pa5-rate", title: "Find a unit rate", lesson: 7,
      gen: function (R) {
        if (R.chance(0.5)) {
          var r = R.int(42, 68), h = R.int(2, 6);
          return { type: "num", prompt: "A car travels " + r * h + " miles in " + h + " hours. Find the unit rate, in miles per hour.", post: "miles per hour", answer: r,
            near: [{ v: h / (r * h), tol: 1e-6, fb: "That is hours per mile. Divide the miles by the hours." }], hints: ["$" + r * h + " \\div " + h + "$."], why: "$" + r * h + " \\div " + h + " = " + r + "$ miles per hour." };
        }
        var n = R.int(4, 12), u = R.int(15, 95), total = dec(n * u, 2);
        return decAns(dec(u, 2), { prompt: "A pack of " + n + " pens costs \\$" + total.toFixed(2) + ". Find the unit price, in dollars per pen.", post: "dollars per pen",
          near: [{ v: u, fb: "In dollars, " + u + " cents is $" + dec(u, 2).toFixed(2) + "$." }], hints: ["$" + total.toFixed(2) + " \\div " + n + "$."], why: "$" + total.toFixed(2) + " \\div " + n + " = " + dec(u, 2).toFixed(2) + "$ dollars per pen." });
      } },
    { id: "pa5-root", title: "Simplify and estimate square roots", lesson: 8,
      gen: function (R) {
        var k = R.int(2, 15);
        if (R.chance(0.5)) {
          var neg = R.chance(0.3);
          return { type: "num", prompt: "Simplify. $$" + (neg ? "-" : "") + "\\sqrt{" + k * k + "}$$", answer: neg ? -k : k,
            near: [{ v: neg ? k : -k, fb: neg ? "The minus sign in front stays." : "The radical sign means the positive root." }], hints: ["Which number times itself is " + k * k + "?"], why: "$" + k + "^2 = " + k * k + "$." };
        }
        var n = k * k + R.int(1, 2 * k);
        return mc(R, { prompt: "Between which two whole numbers is $\\sqrt{" + n + "}$?", right: k + " and " + (k + 1),
          wrong: [{ t: (k - 1) + " and " + k, fb: "$" + k + "^2 = " + k * k + "$ is still below " + n + "." }, { t: (k + 1) + " and " + (k + 2), fb: "$" + (k + 1) + "^2 = " + (k + 1) * (k + 1) + "$ is already above " + n + "." }, { t: k * k + " and " + (k + 1) * (k + 1), fb: "Those are the squares. Take their roots." }],
          hints: ["Find the perfect squares on each side of " + n + "."], why: "$" + k * k + " < " + n + " < " + (k + 1) * (k + 1) + "$." });
      } }
  ];
  L.unit("prealg", 5, {
    title: "Decimals",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Rounding, decimals as fractions, the four operations, and fractions as decimals.",
        skills: ["pa5-round", "pa5-tofraction", "pa5-operate", "pa5-todecimal"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Equations with decimals, and the mean, median and mode.",
        skills: ["pa5-solve", "pa5-mean"], per: 3 },
      { title: "Quiz 3", after: 8, blurb: "Unit rates and square roots.",
        skills: ["pa5-rate", "pa5-root"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:5", {
    2: { name: "Decimals", frame: "The places after the decimal point are [[tenths]], [[hundredths]] and thousandths. The place of the final digit gives the [[denominator]] when a decimal is written as a fraction.",
         chips: ["tens", "numerator"] },
    3: { name: "Decimal operations", frame: "To add or subtract decimals, line up the [[decimal points]]. To multiply, count the decimal places in [[both]] factors. To divide by a decimal, first make the [[divisor]] a whole number.",
         chips: ["last digits", "dividend"] },
    4: { name: "Fractions as decimals", frame: "A fraction becomes a decimal when the numerator is [[divided]] by the denominator. The decimal either [[terminates]] or [[repeats]], and a bar marks the repeating block.",
         chips: ["multiplied", "rounds"] },
    5: { name: "Equations with decimals", frame: "The properties of [[equality]] work on decimals as on whole numbers: do the [[opposite]] operation to [[both]] sides, then check.",
         chips: ["same", "one"] },
    6: { name: "Averages", frame: "The [[mean]] is the sum divided by the count. The [[median]] is the middle value when the values are in order. The [[mode]] is the value that appears most often.",
         chips: ["range", "ratio"] },
    7: { name: "Rates", frame: "A [[ratio]] compares quantities with the same units, and a [[rate]] compares different units. A [[unit rate]] has a denominator of 1.",
         chips: ["mean", "product"] },
    8: { name: "Square roots", frame: "$\\sqrt{n}$ is the [[positive]] number whose [[square]] is $n$. If $n$ is not a perfect square, its root lies [[between]] two whole numbers.",
         chips: ["negative", "half"], fb: { half: "A square root is not a half: $\\sqrt{36}$ is 6, not 18." } }
  });
})();
