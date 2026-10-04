/* ==========================================================================
   Prealgebra — Unit 4: Fractions. See lab/core.js for the format.

   Follows OpenStax Prealgebra 2e, Chapter 4, section for section: the
   readiness check, then 4.1 to 4.7. Each lesson teaches the book's own steps:
   the method, a worked example to watch, one done together, then on your own,
   a harder case, find the error, use it, and the concept built at the end.

   What a fraction is, drawn as strips (4.1), multiplying and dividing
   fractions and mixed numbers (4.2–4.3), adding and subtracting with common
   and different denominators (4.4–4.6), and equations with fractions (4.7).

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
    blurb: "Book: Chapter 4 Be Prepared · Common factors and multiples, integer arithmetic, and one-step equations.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Factors and multiples", prompt: "What is the greatest number that divides both 18 and 24?", answer: 6, skill: "Common factors",
        near: [{ v: 2, fb: "2 divides both, but so does a larger number." }, { v: 3, fb: "3 divides both, but so does a larger number." }, { v: 72, fb: "That is their least common multiple. A factor divides the number." }],
        hints: ["List the factors of 18, and pick the largest that also divides 24."], why: "$18 = 6 \\cdot 3$ and $24 = 6 \\cdot 4$." },
      { type: "num", prompt: "Find the least common multiple of 6 and 8.", answer: 24, skill: "Least common multiple",
        near: [{ v: 48, fb: "That is a common multiple, but a smaller one exists." }, { v: 2, fb: "That is their greatest common factor." }],
        hints: ["List the multiples of 8 until 6 divides one."], why: "$24 = 6 \\cdot 4 = 8 \\cdot 3$." },
      { type: "num", kicker: "Check 2 · Integers", prompt: "Multiply $-6 \\cdot 7$.", answer: -42, skill: "Multiply integers",
        near: [{ v: 42, fb: "Different signs give a negative product." }], hints: ["Different signs."], why: "$6 \\cdot 7 = 42$, and the signs differ." },
      { type: "num", prompt: "Add $-9 + 4$.", answer: -5, skill: "Add integers",
        near: [{ v: 5, fb: "9 is the larger absolute value, and it is negative." }, { v: -13, fb: "Different signs: subtract the absolute values." }], hints: ["$9 - 4$, with the sign of $-9$."], why: "$9 - 4 = 5$, negative." },
      { type: "num", kicker: "Check 3 · Equations", prompt: "Solve $3x = -15$.", pre: "$x =$", answer: -5, skill: "Division Property",
        near: [{ v: 5, fb: "Different signs give a negative quotient." }, { v: -18, fb: "3 multiplies $x$: divide both sides by 3." }], hints: ["Divide both sides by 3."], why: "$-15 \\div 3 = -5$." },
      { type: "num", prompt: "Solve $n - 7 = -2$.", pre: "$n =$", answer: 5, skill: "Solve with integers",
        near: [{ v: -9, fb: "7 is subtracted, so add 7 to both sides." }], hints: ["Add 7 to both sides."], why: "$-2 + 7 = 5$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 4.1**. If **check 1** slipped, see lessons 2.4 and 2.5. If **check 2** or **check 3** slipped, see Unit 3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ==================================================== 4.1 · Visualize fractions */
  var HOW_4_1 = [["Divide", "Divide the numerator by the denominator."],
                 ["Read", "The quotient is the whole number. The remainder is the new numerator."],
                 ["Write", "Write the quotient, then the remainder over the same denominator."]];
  LESSONS.push({
    title: "Visualize fractions",
    blurb: "Book 4.1 · What a fraction means, improper fractions and mixed numbers, equivalent fractions, and the number line.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The strip is cut into equal parts. What fraction of it is shaded?" + strip(3, 4),
        options: [{ t: "$\\frac{3}{4}$" }, { t: "$\\frac{1}{4}$", fb: "That is the part left unshaded." }, { t: "$\\frac{4}{3}$", fb: "The denominator counts the equal parts in one whole: 4." }],
        answer: 0, skill: "Meaning of a fraction", hints: ["Count the parts in the whole, then the shaded ones."], why: "3 of 4 equal parts: $\\frac{3}{4}$." },
      { type: "learn", kicker: "Explore",
        prompt: "Seven quarters do not fit in one strip. They fill one strip and three parts of a second: $\\frac{7}{4} = 1\\frac{3}{4}$. A fraction whose numerator is at least its denominator is **improper**." + strip(7, 4) },
      { type: "learn", kicker: "The idea",
        prompt: "To turn an improper fraction into a **mixed number**, ask how many wholes fit. That is a division, because the denominator tells you how many parts make one whole.",
        scene: { type: "method", how: HOW_4_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $\\frac{17}{5}$ written as a mixed number.",
        scene: { type: "walk", how: HOW_4_1, rows: [
          { step: 1, m: "\\frac{17}{5}", say: "How many fives fit in 17?", fig: strip(17, 5) },
          { step: 1, m: "17 = 5 \\cdot 3 + 2", say: "Five goes into 17 three times, with 2 left over.",
            ask: { prompt: "How many whole fives fit in 17?", answer: 0,
                   options: [{ t: "3" }, { t: "4", fb: "$5 \\cdot 4 = 20$ is too many." }] } },
          { step: 2, m: "3 \\text{ wholes} \\quad 2 \\text{ fifths left}", say: "The quotient and the remainder." },
          { step: 3, m: "\\frac{17}{5} = 3\\frac{2}{5}", say: "Three wholes and two fifths." }] },
        gate: true, then: "The denominator never changes: fifths stay fifths." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write $\\frac{23}{4}$ as a mixed number.",
        how: HOW_4_1, skill: "Improper to mixed",
        steps: [
          { step: 1, ask: "How many whole fours fit in 23?", type: "num", answer: 5, near: [{ v: 6, fb: "$4 \\cdot 6 = 24$ is too many." }], hint: "$4 \\cdot 5 = 20$.",
            m: "23 = 4 \\cdot 5 + 3", say: "Five fours, with 3 left over." },
          { step: 2, ask: "What is the remainder?", type: "num", answer: 3, hint: "$23 - 20$.",
            m: "5 \\text{ wholes} \\quad 3 \\text{ quarters left}", say: "Quotient 5, remainder 3." },
          { step: 3, ask: "Which mixed number is it?", type: "choice", answer: 0,
            options: [{ t: "$5\\frac{3}{4}$" }, { t: "$3\\frac{5}{4}$", fb: "The quotient is the whole number." }, { t: "$5\\frac{3}{23}$", fb: "The denominator stays 4." }],
            m: "\\frac{23}{4} = 5\\frac{3}{4}", say: "Five wholes and three quarters." }],
        why: "Divide, read, write. Now go the other way." },
      Object.assign({ kicker: "On your own", prompt: "Write $2\\frac{3}{5}$ as an improper fraction.", skill: "Mixed to improper",
        hints: ["Each whole is 5 fifths: $2 \\cdot 5 + 3$."], why: "$2 \\cdot 5 + 3 = 13$ fifths: $\\frac{13}{5}$." }, fracIn(13, 5)),
      { type: "numberline", prompt: "Each whole is cut into quarters. Drag the point to $1\\frac{3}{4}$.",
        min: 0, max: 3, tick: 0.25, label: 4, show: false, mode: "point", points: [{ v: 0.5, drag: true }], answer: { points: [1.75] }, skill: "Fractions on the number line",
        hints: ["Go to 1, then three more quarter steps."], why: "$1\\frac{3}{4}$ is three quarter steps past 1." },
      { type: "learn", kicker: "A harder case",
        prompt: "The same amount can have many names. Find a fraction **equivalent** to $\\frac{2}{3}$ with denominator 12.",
        scene: { type: "walk", how: [["Target", "Compare the new denominator with the old one."],
                                    ["Factor", "Find the number the denominator was multiplied by."],
                                    ["Same", "Multiply the numerator by that same number."]], rows: [
          { step: 1, m: "\\frac{2}{3} = \\frac{?}{12}", say: "Thirds have to become twelfths.", fig: strip(2, 3) },
          { step: 2, m: "3 \\cdot 4 = 12", say: "The denominator was multiplied by 4." },
          { step: 3, m: "\\frac{2 \\cdot 4}{3 \\cdot 4} = \\frac{8}{12}", say: "Each third is cut into 4 smaller parts, so there are 4 times as many shaded.", fig: strip(8, 12) },
          { step: 3, m: "\\frac{2}{3} = \\frac{8}{12}", say: "The same amount, with a different name." }] },
        gate: true },
      { type: "order", kicker: "Try it", prompt: "Put these in order, from **least** to **greatest**.",
        items: ["$\\frac{1}{4}$", "$\\frac{1}{2}$", "$\\frac{3}{4}$", "$1\\frac{1}{4}$"], skill: "Order fractions",
        hints: ["Write $\\frac{1}{2}$ as $\\frac{2}{4}$ and compare the numerators."],
        why: "In quarters: 1, 2, 3 and 5 of them." },
      { type: "choice", kicker: "Find the error",
        prompt: "Sam writes $3\\frac{1}{4} = \\frac{7}{4}$. What went wrong?",
        options: [{ t: "He added $3 + 4$. Three wholes are $3 \\cdot 4 = 12$ quarters, so it is $\\frac{13}{4}$." },
                  { t: "The denominator should be 3.", fb: "The parts are still quarters." },
                  { t: "Nothing. It is right.", fb: "$\\frac{7}{4}$ is less than 2, but $3\\frac{1}{4}$ is more than 3." }],
        answer: 0, skill: "Mixed to improper", hints: ["How many quarters are in 3 wholes?"], why: "$3 \\cdot 4 + 1 = 13$ quarters." },
      { type: "choice", kicker: "Use it", prompt: "A recipe uses $\\frac{11}{4}$ cups of flour. How many cups is that, as a mixed number?",
        options: [{ t: "$2\\frac{3}{4}$" }, { t: "$3\\frac{1}{4}$", fb: "$4 \\cdot 3 = 12$ is more than 11. Only 2 wholes fit." }, { t: "$2\\frac{1}{4}$", fb: "$11 - 8 = 3$ quarters are left over." }],
        answer: 0, skill: "Improper to mixed", hints: ["$11 = 4 \\cdot 2 + 3$."], why: "Two wholes and three quarters." }
    ]
  });

  /* ============================================ 4.2 · Multiply and divide fractions */
  var HOW_4_2 = [["Sign", "Decide the sign of the answer."],
                 ["Multiply", "Multiply the numerators, and multiply the denominators."],
                 ["Simplify", "Show the common factors and remove them."]];
  LESSONS.push({
    title: "Multiply and divide fractions",
    blurb: "Book 4.2 · Simplifying a fraction, multiplying fractions, reciprocals, and dividing fractions.",
    mins: 12, v: 1,
    steps: [
      Object.assign({ kicker: "Warm up", prompt: "A fraction is **simplified** when its numerator and denominator share no factor. Simplify $\\frac{6}{8}$.", skill: "Simplify a fraction",
        hints: ["2 divides both."], why: "$\\frac{6 \\div 2}{8 \\div 2} = \\frac{3}{4}$." }, fracIn(3, 4)),
      { type: "learn", kicker: "Explore",
        prompt: "What is $\\frac{1}{2}$ of $\\frac{3}{4}$? Cut each quarter in two. The strip now has 8 parts, and half of the shaded part is 3 of them: $\\frac{3}{8}$." + strip(3, 4) + strip(3, 8) },
      { type: "learn", kicker: "The idea",
        prompt: "“Of” means multiply. The denominators multiply to count the smaller parts, and the numerators multiply to count how many you take: $\\frac{1}{2} \\cdot \\frac{3}{4} = \\frac{1 \\cdot 3}{2 \\cdot 4}$.",
        scene: { type: "method", how: HOW_4_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one multiplied. $$-\\frac{3}{8} \\cdot \\frac{4}{9}$$",
        scene: { type: "walk", how: HOW_4_2, rows: [
          { step: 1, m: "-\\frac{3}{8} \\cdot \\frac{4}{9}", say: "One negative, one positive: the product is negative." },
          { step: 2, m: "-\\frac{3 \\cdot 4}{8 \\cdot 9}", say: "Numerators together, denominators together. Do not multiply out yet." },
          { step: 3, m: "-\\frac{3 \\cdot 4}{4 \\cdot 2 \\cdot 3 \\cdot 3}", say: "Show the common factors: $8 = 4 \\cdot 2$ and $9 = 3 \\cdot 3$.",
            ask: { prompt: "Which factors appear both above and below?", answer: 0,
                   options: [{ t: "3 and 4" }, { t: "8 and 9", fb: "8 and 9 are only in the denominator. Look for factors on both levels." }] } },
          { step: 3, m: "-\\frac{1}{6}", say: "Remove the 3 and the 4. Below, $2 \\cdot 3 = 6$ is left." }] },
        gate: true, then: "Removing common factors before multiplying out keeps the numbers small." },
      { type: "guided", kicker: "Together",
        prompt: "Now you multiply $\\frac{2}{3} \\cdot \\frac{9}{10}$.",
        how: HOW_4_2, skill: "Multiply fractions",
        steps: [
          { step: 1, ask: "What sign will the product have?", type: "choice", answer: 0,
            options: [{ t: "Positive" }, { t: "Negative", fb: "Both fractions are positive." }],
            m: "\\frac{2}{3} \\cdot \\frac{9}{10}", say: "Same signs: positive." },
          { step: 2, ask: "Multiply straight across. What is the numerator, $2 \\cdot 9$?", type: "num", answer: 18, hint: "$2 \\cdot 9$.",
            m: "\\frac{2 \\cdot 9}{3 \\cdot 10} = \\frac{18}{30}", say: "18 over 30." },
          { step: 3, ask: "What is the greatest common factor of 18 and 30?", type: "num", answer: 6,
            near: [{ v: 2, fb: "2 divides both, but so does a larger number." }, { v: 3, fb: "3 divides both, but so does a larger number." }], hint: "$18 = 6 \\cdot 3$ and $30 = 6 \\cdot 5$.",
            m: "\\frac{18 \\div 6}{30 \\div 6} = \\frac{3}{5}", say: "Divide the numerator and the denominator by 6." }],
        why: "Sign, multiply, simplify. Now two on your own." },
      Object.assign({ kicker: "On your own", prompt: "Multiply $\\frac{3}{4} \\cdot \\frac{2}{9}$. Give the answer in simplest form.", skill: "Multiply fractions",
        hints: ["$\\frac{3 \\cdot 2}{4 \\cdot 9}$, then remove the common factors 3 and 2."], why: "$\\frac{6}{36} = \\frac{1}{6}$." }, fracIn(1, 6)),
      { type: "choice", prompt: "The **reciprocal** of a fraction turns it over, so that the two multiply to 1. What is the reciprocal of $-\\frac{5}{8}$?",
        options: [{ t: "$-\\frac{8}{5}$" }, { t: "$\\frac{8}{5}$", fb: "Their product must be $+1$, so the reciprocal has the same sign." }, { t: "$\\frac{5}{8}$", fb: "That is the opposite. The reciprocal turns the fraction over." }],
        answer: 0, skill: "Reciprocals", hints: ["Turn it over, and keep the sign."], why: "$-\\frac{5}{8} \\cdot \\left(-\\frac{8}{5}\\right) = 1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "To **divide** by a fraction, multiply by its reciprocal. $$\\frac{3}{4} \\div \\frac{5}{8}$$",
        scene: { type: "walk", how: [["Flip", "Keep the first fraction. Change the division to a multiplication by the reciprocal of the second."],
                                    ["Multiply", "Multiply the numerators, and multiply the denominators."],
                                    ["Simplify", "Show the common factors and remove them."]], rows: [
          { step: 1, m: "\\frac{3}{4} \\div \\frac{5}{8}", say: "How many $\\frac{5}{8}$s fit in $\\frac{3}{4}$?" },
          { step: 1, m: "\\frac{3}{4} \\cdot \\frac{8}{5}", say: "Multiply by the reciprocal of $\\frac{5}{8}$." },
          { step: 2, m: "\\frac{3 \\cdot 8}{4 \\cdot 5}", say: "Multiply across." },
          { step: 3, m: "\\frac{3 \\cdot 2}{5} = \\frac{6}{5}", say: "$8 = 4 \\cdot 2$, so the 4 goes." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Divide $\\frac{2}{3} \\div \\frac{4}{9}$. (Type a fraction like 5/4.)", answer: 1.5, tol: 1e-9, shown: "3/2", skill: "Divide fractions",
        near: [{ v: 8 / 27, tol: 1e-9, fb: "That multiplies the two fractions. Flip the second one first." }, { v: 2 / 3, tol: 1e-9, fb: "You flipped the first fraction. Flip the one you are dividing by." }],
        hints: ["$\\frac{2}{3} \\cdot \\frac{9}{4}$."], why: "$\\frac{2 \\cdot 9}{3 \\cdot 4} = \\frac{18}{12} = \\frac{3}{2}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{3}{5} \\div \\frac{2}{7}", "\\frac{5}{3} \\cdot \\frac{2}{7}", "\\frac{10}{21}"], answer: 1, fix: "\\frac{3}{5} \\cdot \\frac{7}{2}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Divide fractions",
        hints: ["Which fraction gets turned over?"],
        why: "Flip the fraction you are dividing by: $\\frac{3}{5} \\cdot \\frac{7}{2} = \\frac{21}{10}$." },
      { type: "num", kicker: "Use it", prompt: "A ribbon is $\\frac{3}{4}$ yard long. You cut it into pieces $\\frac{1}{8}$ yard long. How many pieces do you get?",
        post: "pieces", answer: 6, skill: "Divide fractions",
        near: [{ v: 3 / 32, tol: 1e-9, fb: "That multiplies. “How many fit” is a division." }],
        hints: ["$\\frac{3}{4} \\div \\frac{1}{8} = \\frac{3}{4} \\cdot 8$."], why: "$\\frac{3 \\cdot 8}{4} = 6$." }
    ]
  });

  /* ============= 4.3 · Multiply and divide mixed numbers and complex fractions */
  var HOW_4_3 = [["Convert", "Change each mixed number to an improper fraction."],
                 ["Operate", "Multiply. For a division, multiply by the reciprocal."],
                 ["Simplify", "Remove common factors. Write an improper answer as a mixed number."]];
  LESSONS.push({
    title: "Mixed numbers and complex fractions",
    blurb: "Book 4.3 · Multiplying and dividing mixed numbers, complex fractions, and expressions with a fraction bar.",
    mins: 12, v: 1,
    steps: [
      Object.assign({ kicker: "Warm up", prompt: "Write $3\\frac{1}{2}$ as an improper fraction.", skill: "Mixed to improper",
        hints: ["$3 \\cdot 2 + 1$ halves."], why: "$3 \\cdot 2 + 1 = 7$ halves." }, fracIn(7, 2)),
      { type: "learn", kicker: "The idea",
        prompt: "Mixed numbers cannot be multiplied part by part. Turn them into improper fractions first. After that, everything from the last lesson works unchanged.",
        scene: { type: "method", how: HOW_4_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one multiplied. $$2\\frac{1}{2} \\cdot 1\\frac{3}{5}$$",
        scene: { type: "walk", how: HOW_4_3, rows: [
          { step: 1, m: "2\\frac{1}{2} \\cdot 1\\frac{3}{5}", say: "Two mixed numbers." },
          { step: 1, m: "\\frac{5}{2} \\cdot \\frac{8}{5}", say: "$2 \\cdot 2 + 1 = 5$ halves, and $1 \\cdot 5 + 3 = 8$ fifths.",
            ask: { prompt: "How many halves are in $2\\frac{1}{2}$?", answer: 0,
                   options: [{ t: "5" }, { t: "3", fb: "Each whole is 2 halves: $2 \\cdot 2 + 1$." }] } },
          { step: 2, m: "\\frac{5 \\cdot 8}{2 \\cdot 5}", say: "Multiply across." },
          { step: 3, m: "\\frac{8}{2} = 4", say: "The 5s go, and $8 \\div 2 = 4$." }] },
        gate: true, then: "A sensible check: a bit more than 2 times a bit more than 1 should be near 4." },
      { type: "guided", kicker: "Together",
        prompt: "Now you divide $3\\frac{1}{3} \\div 2\\frac{1}{2}$.",
        how: HOW_4_3, skill: "Divide mixed numbers",
        steps: [
          { step: 1, ask: "$3\\frac{1}{3}$ is how many thirds?", type: "num", answer: 10, near: [{ v: 4, fb: "Each whole is 3 thirds: $3 \\cdot 3 + 1$." }], hint: "$3 \\cdot 3 + 1$.",
            m: "\\frac{10}{3} \\div \\frac{5}{2}", say: "10 thirds, and $2\\frac{1}{2}$ is 5 halves." },
          { step: 2, ask: "It is a division. What do you multiply $\\frac{10}{3}$ by?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{2}{5}$" }, { t: "$\\frac{5}{2}$", fb: "That would multiply. To divide, use the reciprocal." }],
            m: "\\frac{10}{3} \\cdot \\frac{2}{5}", say: "Multiply by the reciprocal." },
          { step: 3, ask: "$\\frac{10 \\cdot 2}{3 \\cdot 5}$ simplifies to which?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{4}{3} = 1\\frac{1}{3}$" }, { t: "$\\frac{20}{15}$", fb: "The right value, but 5 is still a common factor." }, { t: "$\\frac{3}{4}$", fb: "That is upside down: the 10 and 2 are on top." }],
            m: "\\frac{4}{3} = 1\\frac{1}{3}", say: "$10 = 5 \\cdot 2$, so the 5 goes." }],
        why: "Convert, operate, simplify. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Multiply $1\\frac{1}{2} \\cdot 2\\frac{2}{3}$.", answer: 4, skill: "Multiply mixed numbers",
        near: [{ v: 7 / 3, tol: 1e-9, fb: "Mixed numbers cannot be multiplied part by part. Convert first." }],
        hints: ["$\\frac{3}{2} \\cdot \\frac{8}{3}$."], why: "$\\frac{3 \\cdot 8}{2 \\cdot 3} = \\frac{8}{2} = 4$." },
      { type: "choice", prompt: "Which expression is “the quotient of $3x$ and 8”?",
        options: [{ t: "$\\frac{3x}{8}$" }, { t: "$\\frac{8}{3x}$", fb: "The quantity named first goes on top." }, { t: "$3x \\cdot 8$", fb: "A quotient is a division." }],
        answer: 0, skill: "Translate with fractions", hints: ["A fraction bar is a division."], why: "$3x \\div 8$ is written $\\frac{3x}{8}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **complex fraction** has a fraction above or below its main bar. The bar is a division. $$\\dfrac{\\frac{3}{4}}{\\frac{5}{8}}$$",
        scene: { type: "walk", how: [["Rewrite", "Write the complex fraction as a division."],
                                    ["Divide", "Multiply by the reciprocal."],
                                    ["Simplify", "Remove common factors."]], rows: [
          { step: 1, m: "\\frac{3}{4} \\div \\frac{5}{8}", say: "The main bar means “divided by”." },
          { step: 2, m: "\\frac{3}{4} \\cdot \\frac{8}{5}", say: "Multiply by the reciprocal." },
          { step: 3, m: "\\frac{3 \\cdot 8}{4 \\cdot 5} = \\frac{6}{5}", say: "$8 \\div 4 = 2$, leaving $3 \\cdot 2$ above." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A fraction bar groups what is above it and what is below it. Simplify. $$\\frac{8 + 2 \\cdot 5}{7 - 4}$$", answer: 6, skill: "Fraction bar",
        near: [{ v: 50 / 3, tol: 1e-6, fb: "In the numerator, multiply before you add." }],
        hints: ["Numerator: $8 + 10$. Denominator: 3."], why: "$\\frac{18}{3} = 6$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana writes $2\\frac{1}{3} \\cdot 3\\frac{1}{2} = 6\\frac{1}{6}$. What went wrong?",
        options: [{ t: "She multiplied the wholes and the fractions separately. Converting first gives $\\frac{7}{3} \\cdot \\frac{7}{2} = 8\\frac{1}{6}$." },
                  { t: "She should have added the fractions.", fb: "This is a product. Nothing is added." },
                  { t: "Nothing. It is right.", fb: "Estimate: it must be more than $2 \\cdot 3\\frac{1}{2} = 7$." }],
        answer: 0, skill: "Multiply mixed numbers", hints: ["What does the method do first?"], why: "$\\frac{49}{6} = 8\\frac{1}{6}$." },
      { type: "num", kicker: "Use it", prompt: "A board $7\\frac{1}{2}$ feet long is cut into pieces $1\\frac{1}{4}$ feet long. How many pieces?",
        post: "pieces", answer: 6, skill: "Divide mixed numbers",
        near: [{ v: 75 / 8, tol: 1e-9, fb: "That multiplies. “How many fit” is a division." }],
        hints: ["$\\frac{15}{2} \\div \\frac{5}{4} = \\frac{15}{2} \\cdot \\frac{4}{5}$."], why: "$\\frac{15 \\cdot 4}{2 \\cdot 5} = \\frac{60}{10} = 6$." }
    ]
  });
  /* ======================== 4.4 · Add and subtract fractions, common denominators */
  var HOW_4_4 = [["Same?", "Check that the denominators are the same."],
                 ["Combine", "Add or subtract the numerators. Keep the denominator."],
                 ["Simplify", "Remove any common factors."]];
  LESSONS.push({
    title: "Add and subtract with common denominators",
    blurb: "Book 4.4 · Adding and subtracting fractions whose parts are the same size.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "One strip has 2 eighths shaded and the other has 3 eighths. How many eighths are shaded altogether?" + strip(2, 8) + strip(3, 8),
        post: "eighths", answer: 5, skill: "Add fractions", hints: ["Count the shaded parts on both strips."], why: "$2 + 3 = 5$ eighths." },
      { type: "learn", kicker: "The idea",
        prompt: "The denominator names the size of the parts. The numerators count them. 2 eighths and 3 eighths make 5 eighths, just as 2 apples and 3 apples make 5 apples. The size of a part does not change.",
        scene: { type: "method", how: HOW_4_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one added. $$\\frac{7}{12} + \\frac{1}{12}$$",
        scene: { type: "walk", how: HOW_4_4, rows: [
          { step: 1, m: "\\frac{7}{12} + \\frac{1}{12}", say: "Both are twelfths." },
          { step: 2, m: "\\frac{7 + 1}{12}", say: "Add the numerators.",
            ask: { prompt: "What happens to the denominator when you add?", answer: 0,
                   options: [{ t: "It stays 12" }, { t: "It becomes 24", fb: "Adding does not change the size of the parts." }] } },
          { step: 2, m: "\\frac{8}{12}", say: "Eight twelfths." },
          { step: 3, m: "\\frac{8 \\div 4}{12 \\div 4} = \\frac{2}{3}", say: "4 divides both." }] },
        gate: true, then: "Add the tops, keep the bottom, then simplify." },
      { type: "guided", kicker: "Together",
        prompt: "Now you subtract $\\frac{5}{8} - \\frac{7}{8}$.",
        how: HOW_4_4, skill: "Subtract fractions",
        steps: [
          { step: 1, ask: "Are the denominators the same?", type: "choice", answer: 0,
            options: [{ t: "Yes: both are eighths" }, { t: "No", fb: "Both denominators are 8." }],
            m: "\\frac{5}{8} - \\frac{7}{8}", say: "Both are eighths." },
          { step: 2, ask: "Subtract the numerators. What is $5 - 7$?", type: "num", answer: -2, near: [{ v: 2, fb: "$5 - 7$ is negative." }], hint: "$5 + (-7)$.",
            m: "\\frac{5 - 7}{8} = \\frac{-2}{8}", say: "The numerator is negative." },
          { step: 3, ask: "Simplify $\\frac{-2}{8}$.", type: "choice", answer: 0,
            options: [{ t: "$-\\frac{1}{4}$" }, { t: "$\\frac{1}{4}$", fb: "The numerator is negative, so the fraction is too." }, { t: "$-\\frac{2}{8}$", fb: "2 still divides both." }],
            m: "-\\frac{1}{4}", say: "Divide the numerator and the denominator by 2." }],
        why: "Same, combine, simplify. Now two on your own." },
      Object.assign({ kicker: "On your own", prompt: "Add $\\frac{3}{10} + \\frac{1}{10}$. Give the answer in simplest form.", skill: "Add fractions",
        hints: ["$\\frac{4}{10}$, then simplify."], why: "$\\frac{4}{10} = \\frac{2}{5}$." }, fracIn(2, 5)),
      { type: "choice", prompt: "Letters work the same way. Add $\\frac{x}{5} + \\frac{3}{5}$.",
        options: [{ t: "$\\frac{x + 3}{5}$" }, { t: "$\\frac{x + 3}{10}$", fb: "The denominator stays 5." }, { t: "$\\frac{3x}{5}$", fb: "$x$ and 3 are added, not multiplied, and they are not like terms." }],
        answer: 0, skill: "Add fractions", hints: ["Add the numerators. Keep the denominator."], why: "The numerators are added: $x + 3$, over 5." },
      { type: "learn", kicker: "A harder case",
        prompt: "With several fractions and negative signs, write one numerator and keep each sign with its number. $$-\\frac{3}{8} - \\frac{7}{8} + \\frac{5}{8}$$",
        scene: { type: "walk", how: HOW_4_4, rows: [
          { step: 1, m: "-\\frac{3}{8} - \\frac{7}{8} + \\frac{5}{8}", say: "Three fractions, all eighths." },
          { step: 2, m: "\\frac{-3 - 7 + 5}{8}", say: "One numerator, each number with its own sign." },
          { step: 2, m: "\\frac{-5}{8}", say: "$-3 - 7 = -10$, and $-10 + 5 = -5$." },
          { step: 3, m: "-\\frac{5}{8}", say: "5 and 8 share no factor. A negative numerator makes the fraction negative." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Subtract $\\frac{11}{15} - \\frac{2}{15}$. (Type a fraction like 2/3.)", answer: 0.6, tol: 1e-9, shown: "3/5", skill: "Subtract fractions",
        near: [{ v: 13 / 15, tol: 1e-9, fb: "This is a subtraction: $11 - 2$." }],
        hints: ["$\\frac{11 - 2}{15}$, then simplify."], why: "$\\frac{9}{15} = \\frac{3}{5}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{2}{7} + \\frac{3}{7}", "\\frac{2 + 3}{7 + 7}", "\\frac{5}{14}"], answer: 1, fix: "\\frac{2 + 3}{7}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Add fractions",
        hints: ["Do the parts change size when you add them?"],
        why: "Only the numerators are added: $\\frac{5}{7}$. Sevenths stay sevenths." },
      { type: "num", kicker: "Use it", prompt: "You walk $\\frac{3}{10}$ mile to the shop and $\\frac{3}{10}$ mile back. How far is that in all? (Type a fraction like 2/3.)",
        post: "mile", answer: 0.6, tol: 1e-9, shown: "3/5", skill: "Add fractions",
        near: [{ v: 0.3, tol: 1e-9, fb: "Do not add the denominators. The parts are still tenths." }],
        hints: ["$\\frac{3 + 3}{10}$."], why: "$\\frac{6}{10} = \\frac{3}{5}$ mile." }
    ]
  });

  /* ===================== 4.5 · Add and subtract fractions, different denominators */
  var HOW_4_5 = [["LCD", "Find the least common denominator: the LCM of the denominators."],
                 ["Convert", "Rewrite each fraction as an equivalent fraction with the LCD."],
                 ["Combine", "Add or subtract the numerators. Keep the LCD."],
                 ["Simplify", "Remove any common factors."]];
  LESSONS.push({
    title: "Add and subtract with different denominators",
    blurb: "Book 4.5 · The least common denominator, converting fractions, and choosing the right fraction operation.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the least common multiple of 4 and 6.", answer: 12, skill: "Least common multiple",
        near: [{ v: 24, fb: "That is a common multiple, but a smaller one exists." }, { v: 2, fb: "That is their greatest common factor." }],
        hints: ["Multiples of 6: 6, 12, …"], why: "$12 = 4 \\cdot 3 = 6 \\cdot 2$." },
      { type: "learn", kicker: "The idea",
        prompt: "Fractions can only be added when their parts are the same size. If the denominators differ, first rename both fractions with a **common denominator**. The least one, the LCM of the denominators, is the **LCD**.",
        scene: { type: "method", how: HOW_4_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one added. $$\\frac{1}{2} + \\frac{1}{3}$$",
        scene: { type: "walk", how: HOW_4_5, rows: [
          { step: 1, m: "\\frac{1}{2} + \\frac{1}{3}", say: "Halves and thirds: parts of different sizes.", fig: strip(1, 2) + strip(1, 3) },
          { step: 1, m: "\\text{LCD} = 6", say: "The least common multiple of 2 and 3.",
            ask: { prompt: "What is the least number that both 2 and 3 divide?", answer: 0,
                   options: [{ t: "6" }, { t: "5", fb: "That is their sum. Neither 2 nor 3 divides 5." }, { t: "12", fb: "A common multiple, but not the least." }] } },
          { step: 2, m: "\\frac{1 \\cdot 3}{2 \\cdot 3} + \\frac{1 \\cdot 2}{3 \\cdot 2}", say: "Multiply top and bottom by whatever makes each denominator 6." },
          { step: 2, m: "\\frac{3}{6} + \\frac{2}{6}", say: "Now both are sixths.", fig: strip(3, 6) + strip(2, 6) },
          { step: 3, m: "\\frac{5}{6}", say: "$3 + 2 = 5$ sixths.", fig: strip(5, 6) },
          { step: 4, m: "\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}", say: "5 and 6 share no factor: already simplified." }] },
        gate: true, then: "Never add the denominators. Rename, then add the numerators." },
      { type: "guided", kicker: "Together",
        prompt: "Now you subtract $\\frac{7}{12} - \\frac{3}{8}$.",
        how: HOW_4_5, skill: "Subtract fractions",
        steps: [
          { step: 1, ask: "Find the LCD: the least common multiple of 12 and 8.", type: "num", answer: 24,
            near: [{ v: 96, fb: "A common multiple, but not the least." }, { v: 48, fb: "A common multiple, but not the least." }, { v: 4, fb: "That is their greatest common factor." }], hint: "Multiples of 12: 12, 24, …",
            m: "\\text{LCD} = 24", say: "$12 \\cdot 2 = 24$ and $8 \\cdot 3 = 24$." },
          { step: 2, ask: "$\\frac{7}{12} = \\frac{?}{24}$. What is the new numerator?", type: "num", answer: 14, near: [{ v: 7, fb: "The denominator doubled, so the numerator must double too." }], hint: "$7 \\cdot 2$.",
            m: "\\frac{14}{24} - \\frac{9}{24}", say: "And $\\frac{3}{8} = \\frac{3 \\cdot 3}{8 \\cdot 3} = \\frac{9}{24}$." },
          { step: 3, ask: "Subtract the numerators: $14 - 9$.", type: "num", answer: 5, hint: "$14 - 9$.",
            m: "\\frac{5}{24}", say: "Five twenty-fourths." },
          { step: 4, ask: "Can $\\frac{5}{24}$ be simplified?", type: "choice", answer: 0,
            options: [{ t: "No: 5 and 24 share no factor" }, { t: "Yes", fb: "5 is prime and does not divide 24." }],
            m: "\\frac{7}{12} - \\frac{3}{8} = \\frac{5}{24}", say: "Already in simplest form." }],
        why: "LCD, convert, combine, simplify. Now two on your own." },
      Object.assign({ kicker: "On your own", prompt: "Add $\\frac{1}{4} + \\frac{2}{3}$.", skill: "Add fractions",
        hints: ["The LCD is 12: $\\frac{3}{12} + \\frac{8}{12}$."], why: "$\\frac{3}{12} + \\frac{8}{12} = \\frac{11}{12}$." }, fracIn(11, 12)),
      { type: "sort", prompt: "Which of these need a common denominator before you can work them out?",
        bins: ["Needs a common denominator", "Does not"],
        cards: [{ t: "$\\frac{2}{3} + \\frac{1}{4}$", bin: 0, fb: "Adding: the parts must be the same size." },
                { t: "$\\frac{2}{3} \\cdot \\frac{1}{4}$", bin: 1, fb: "Multiply straight across." },
                { t: "$\\frac{5}{6} - \\frac{1}{4}$", bin: 0, fb: "Subtracting: the parts must be the same size." },
                { t: "$\\frac{5}{6} \\div \\frac{1}{4}$", bin: 1, fb: "Multiply by the reciprocal." }],
        skill: "Fraction operations", hints: ["Only adding and subtracting count parts of one size."],
        why: "A common denominator is for adding and subtracting only." },
      { type: "learn", kicker: "A harder case",
        prompt: "A complex fraction with sums inside: simplify the top, then the bottom, then divide. $$\\dfrac{\\frac{1}{2} + \\frac{2}{3}}{\\frac{3}{4} - \\frac{1}{6}}$$",
        scene: { type: "walk", how: [["Top", "Simplify the numerator."], ["Bottom", "Simplify the denominator."], ["Divide", "Divide the numerator by the denominator, and simplify."]], rows: [
          { step: 1, m: "\\frac{1}{2} + \\frac{2}{3} = \\frac{3}{6} + \\frac{4}{6} = \\frac{7}{6}", say: "The numerator, with LCD 6." },
          { step: 2, m: "\\frac{3}{4} - \\frac{1}{6} = \\frac{9}{12} - \\frac{2}{12} = \\frac{7}{12}", say: "The denominator, with LCD 12." },
          { step: 3, m: "\\frac{7}{6} \\div \\frac{7}{12} = \\frac{7}{6} \\cdot \\frac{12}{7}", say: "The main bar is a division: multiply by the reciprocal." },
          { step: 3, m: "\\frac{12}{6} = 2", say: "The 7s go." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Evaluate $x + \\frac{1}{3}$ when $x = -\\frac{3}{4}$. (Type a fraction like -2/3.)", answer: -5 / 12, tol: 1e-9, shown: "-5/12", skill: "Evaluate with fractions",
        near: [{ v: -2 / 7, tol: 1e-9, fb: "Do not add numerators and denominators. Use the LCD, 12." }, { v: 13 / 12, tol: 1e-9, fb: "$x$ is negative: $-\\frac{9}{12} + \\frac{4}{12}$." }, { v: 5 / 12, tol: 1e-9, fb: "$-9 + 4$ is negative." }],
        hints: ["$-\\frac{9}{12} + \\frac{4}{12}$."], why: "$\\frac{-9 + 4}{12} = -\\frac{5}{12}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{1}{4} + \\frac{1}{6}", "\\frac{1 + 1}{4 + 6}", "\\frac{2}{10}"], answer: 1, fix: "\\frac{3}{12} + \\frac{2}{12}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Add fractions",
        hints: ["What has to be true before the numerators can be added?"],
        why: "Rename with the LCD first: $\\frac{3}{12} + \\frac{2}{12} = \\frac{5}{12}$." },
      { type: "num", kicker: "Use it", prompt: "A recipe needs $\\frac{3}{4}$ cup of milk. You have $\\frac{1}{3}$ cup. How much more do you need? (Type a fraction like 2/3.)",
        post: "cup", answer: 5 / 12, tol: 1e-9, shown: "5/12", skill: "Subtract fractions",
        near: [{ v: 2, fb: "Do not subtract the denominators. Use the LCD, 12." }, { v: 13 / 12, tol: 1e-9, fb: "“How much more” is a subtraction." }],
        hints: ["$\\frac{9}{12} - \\frac{4}{12}$."], why: "$\\frac{9}{12} - \\frac{4}{12} = \\frac{5}{12}$ cup." }
    ]
  });
  /* ============================================ 4.6 · Add and subtract mixed numbers */
  var HOW_4_6 = [["Wholes", "Add the whole numbers."],
                 ["Fractions", "Add the fractions, with a common denominator if they need one."],
                 ["Simplify", "If the fraction is improper, carry a whole across. Remove common factors."]];
  LESSONS.push({
    title: "Add and subtract mixed numbers",
    blurb: "Book 4.6 · Adding mixed numbers, and subtracting them when you have to borrow a whole.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which mixed number is the same as $\\frac{7}{5}$?",
        options: [{ t: "$1\\frac{2}{5}$" }, { t: "$2\\frac{1}{5}$", fb: "Only one 5 fits in 7, with 2 left over." }, { t: "$1\\frac{2}{7}$", fb: "The denominator stays 5." }],
        answer: 0, skill: "Improper to mixed", hints: ["$7 = 5 \\cdot 1 + 2$."], why: "One whole and two fifths." },
      { type: "learn", kicker: "The idea",
        prompt: "A mixed number is a whole number plus a fraction. So add the wholes, add the fractions, and tidy up. If the fractions make an improper fraction, carry a whole across.",
        scene: { type: "method", how: HOW_4_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one added. $$2\\frac{3}{4} + 1\\frac{3}{4}$$",
        scene: { type: "walk", how: HOW_4_6, rows: [
          { step: 1, m: "2 + 1 = 3", say: "The whole numbers." },
          { step: 2, m: "\\frac{3}{4} + \\frac{3}{4} = \\frac{6}{4}", say: "The fractions: six quarters." },
          { step: 3, m: "\\frac{6}{4} = 1\\frac{2}{4} = 1\\frac{1}{2}", say: "Six quarters is one whole and two quarters.",
            ask: { prompt: "Six quarters make how many wholes?", answer: 0,
                   options: [{ t: "1 whole, with 2 quarters left" }, { t: "6 wholes", fb: "It takes 4 quarters to make one whole." }] } },
          { step: 3, m: "3 + 1\\frac{1}{2} = 4\\frac{1}{2}", say: "Carry the extra whole across." }] },
        gate: true, then: "Carrying a whole here is the same idea as carrying a ten." },
      { type: "guided", kicker: "Together",
        prompt: "Now you add $3\\frac{1}{2} + 2\\frac{2}{3}$.",
        how: HOW_4_6, skill: "Add mixed numbers",
        steps: [
          { step: 1, ask: "Add the whole numbers: $3 + 2$.", type: "num", answer: 5, hint: "$3 + 2$.",
            m: "3 + 2 = 5", say: "Five wholes." },
          { step: 2, ask: "With LCD 6, $\\frac{1}{2} + \\frac{2}{3}$ is $\\frac{3}{6} + \\frac{4}{6}$. What is the numerator of the sum?", type: "num", answer: 7, hint: "$3 + 4$.",
            m: "\\frac{3}{6} + \\frac{4}{6} = \\frac{7}{6}", say: "Seven sixths: improper." },
          { step: 3, ask: "$\\frac{7}{6} = 1\\frac{1}{6}$. What is $5 + 1\\frac{1}{6}$?", type: "choice", answer: 0,
            options: [{ t: "$6\\frac{1}{6}$" }, { t: "$5\\frac{7}{6}$", fb: "The right value, but the fraction part is improper. Carry the whole." }, { t: "$5\\frac{1}{6}$", fb: "The extra whole has to be added on." }],
            m: "5 + 1\\frac{1}{6} = 6\\frac{1}{6}", say: "Carry the whole across." }],
        why: "Wholes, fractions, simplify. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Add $1\\frac{2}{5} + 3\\frac{1}{5}$. (Type a mixed number like 2 1/3.)", answer: 4.6, tol: 1e-9, shown: "4 3/5", skill: "Add mixed numbers",
        near: [{ v: 4.3, tol: 1e-9, fb: "Add the numerators only: $2 + 1 = 3$ fifths." }],
        hints: ["$1 + 3$, and $\\frac{2}{5} + \\frac{1}{5}$."], why: "$4 + \\frac{3}{5} = 4\\frac{3}{5}$." },
      { type: "num", prompt: "Add $2\\frac{1}{4} + 1\\frac{1}{2}$. (Type a mixed number like 2 1/3.)", answer: 3.75, tol: 1e-9, shown: "3 3/4", skill: "Add mixed numbers",
        near: [{ v: 3 + 1 / 3, tol: 1e-9, fb: "Do not add the denominators. Use the LCD, 4: $\\frac{1}{2} = \\frac{2}{4}$." }],
        hints: ["$\\frac{1}{4} + \\frac{2}{4}$."], why: "$3 + \\frac{3}{4} = 3\\frac{3}{4}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Subtracting can need the opposite of carrying: **borrowing** a whole. $$5\\frac{1}{3} - 2\\frac{2}{3}$$",
        scene: { type: "walk", how: [["Compare", "Is the first fraction smaller than the one being subtracted? Then borrow 1 whole."],
                                    ["Fractions", "Subtract the fractions."],
                                    ["Wholes", "Subtract the whole numbers, and simplify."]], rows: [
          { step: 1, m: "5\\frac{1}{3} - 2\\frac{2}{3}", say: "$\\frac{1}{3}$ is smaller than $\\frac{2}{3}$, so borrow." },
          { step: 1, m: "5\\frac{1}{3} = 4\\frac{4}{3}", say: "Take 1 from the 5 and write it as $\\frac{3}{3}$: $\\frac{3}{3} + \\frac{1}{3} = \\frac{4}{3}$." },
          { step: 2, m: "\\frac{4}{3} - \\frac{2}{3} = \\frac{2}{3}", say: "Now the fractions subtract." },
          { step: 3, m: "4 - 2 = 2", say: "The whole numbers." },
          { step: 3, m: "5\\frac{1}{3} - 2\\frac{2}{3} = 2\\frac{2}{3}", say: "Two wholes and two thirds." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Subtract $4\\frac{1}{5} - 1\\frac{3}{5}$. (Type a mixed number like 2 1/3.)", answer: 2.6, tol: 1e-9, shown: "2 3/5", skill: "Subtract mixed numbers",
        near: [{ v: 3.4, tol: 1e-9, fb: "You took $\\frac{1}{5}$ from $\\frac{3}{5}$, the wrong way round. Borrow a whole first." }, { v: 3.6, tol: 1e-9, fb: "After borrowing, the 4 becomes 3." }],
        hints: ["$4\\frac{1}{5} = 3\\frac{6}{5}$."], why: "$3\\frac{6}{5} - 1\\frac{3}{5} = 2\\frac{3}{5}$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kai computes $6\\frac{1}{4} - 2\\frac{3}{4}$ and writes $4\\frac{2}{4}$. What went wrong?",
        options: [{ t: "He took $\\frac{1}{4}$ from $\\frac{3}{4}$, the wrong way round. Borrowing gives $5\\frac{5}{4} - 2\\frac{3}{4} = 3\\frac{1}{2}$." },
                  { t: "He only forgot to simplify. The answer is $4\\frac{1}{2}$.", fb: "Check by adding: $2\\frac{3}{4} + 4\\frac{1}{2}$ is more than 7." },
                  { t: "Nothing. It is right.", fb: "Check by adding: $2\\frac{3}{4} + 4\\frac{2}{4}$ is more than 7." }],
        answer: 0, skill: "Subtract mixed numbers", hints: ["Which fraction is being taken from which?"], why: "$5\\frac{5}{4} - 2\\frac{3}{4} = 3\\frac{2}{4} = 3\\frac{1}{2}$." },
      { type: "num", kicker: "Use it", prompt: "A plank is $8\\frac{1}{2}$ feet long. You cut off $3\\frac{3}{4}$ feet. How long is the piece left? (Type a mixed number like 2 1/3.)",
        post: "feet", answer: 4.75, tol: 1e-9, shown: "4 3/4", skill: "Subtract mixed numbers",
        near: [{ v: 5.25, tol: 1e-9, fb: "$\\frac{2}{4}$ is smaller than $\\frac{3}{4}$: borrow a whole first." }, { v: 12.25, tol: 1e-9, fb: "Cutting off is a subtraction." }],
        hints: ["$8\\frac{2}{4} = 7\\frac{6}{4}$."], why: "$7\\frac{6}{4} - 3\\frac{3}{4} = 4\\frac{3}{4}$ feet." }
    ]
  });

  /* ============================================= 4.7 · Solve equations with fractions */
  var HOW_4_7 = [["Undo", "See what is done to the variable, and do the opposite to both sides."],
                 ["Simplify", "Simplify each side."],
                 ["Check", "Substitute the answer into the original equation."]];
  LESSONS.push({
    title: "Solve equations with fractions",
    blurb: "Book 4.7 · Fractions as solutions, the Multiplication Property of Equality, and fraction coefficients.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $x = \\frac{3}{4}$ a solution of $x + \\frac{1}{4} = 1$?",
        options: [{ t: "Yes: $\\frac{3}{4} + \\frac{1}{4} = 1$" }, { t: "No", fb: "$\\frac{3}{4} + \\frac{1}{4} = \\frac{4}{4}$, which is 1." }],
        answer: 0, skill: "Check a solution", hints: ["Substitute $\\frac{3}{4}$ for $x$."], why: "$\\frac{4}{4} = 1$, a true statement." },
      { type: "learn", kicker: "The idea",
        prompt: "The properties of equality work for fractions too, and one is new: the **Multiplication Property**. Multiply both sides by the same number and the equation stays true. It undoes a division, and with a reciprocal it clears a fraction coefficient.",
        scene: { type: "method", how: HOW_4_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$\\frac{2}{3}x = 18$$",
        scene: { type: "walk", how: HOW_4_7, rows: [
          { step: 1, m: "\\frac{2}{3}x = 18", say: "$x$ is multiplied by $\\frac{2}{3}$." },
          { step: 1, m: "\\frac{3}{2} \\cdot \\frac{2}{3}x = \\frac{3}{2} \\cdot 18", say: "Multiply both sides by the reciprocal, $\\frac{3}{2}$.",
            ask: { prompt: "What is $\\frac{3}{2} \\cdot \\frac{2}{3}$?", answer: 0,
                   options: [{ t: "$1$" }, { t: "$\\frac{4}{9}$", fb: "Multiply across: $\\frac{3 \\cdot 2}{2 \\cdot 3} = \\frac{6}{6}$." }] } },
          { step: 2, m: "x = 27", say: "$\\frac{3}{2} \\cdot 18 = \\frac{54}{2} = 27$." },
          { step: 3, m: "\\frac{2}{3} \\cdot 27 = 18", say: "$\\frac{54}{3} = 18$. True." }] },
        gate: true, then: "A number times its reciprocal is 1, and $1x$ is just $x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $\\frac{x}{4} = -9$.",
        how: HOW_4_7, skill: "Multiplication Property",
        steps: [
          { step: 1, ask: "$x$ is divided by 4. What undoes that?", type: "choice", answer: 0,
            options: [{ t: "Multiply both sides by 4" }, { t: "Divide both sides by 4", fb: "That would give $\\frac{x}{16}$. Do the opposite of dividing." }, { t: "Subtract 4 from both sides", fb: "4 divides $x$. It is not added." }],
            m: "4 \\cdot \\frac{x}{4} = 4(-9)", say: "Multiply both sides by 4." },
          { step: 2, ask: "What is $4(-9)$?", type: "num", answer: -36, near: [{ v: 36, fb: "Different signs give a negative product." }], hint: "$4 \\cdot 9$, with different signs.",
            m: "x = -36", say: "Different signs: negative." },
          { step: 3, ask: "Check: what is $-36 \\div 4$?", type: "num", answer: -9, near: [{ v: 9, fb: "Different signs give a negative quotient." }], hint: "$36 \\div 4$, with different signs.",
            m: "\\frac{-36}{4} = -9", say: "It matches the right side." }],
        why: "Undo, simplify, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $y + \\frac{1}{3} = \\frac{5}{6}$. (Type a fraction like 2/3.)", pre: "$y =$", answer: 0.5, tol: 1e-9, shown: "1/2", skill: "Solve with fractions",
        near: [{ v: 7 / 6, tol: 1e-9, fb: "$\\frac{1}{3}$ is added, so subtract it from both sides." }, { v: 4 / 3, tol: 1e-9, fb: "Use the LCD, 6: $\\frac{5}{6} - \\frac{2}{6}$." }],
        hints: ["$\\frac{5}{6} - \\frac{2}{6}$."], why: "$\\frac{3}{6} = \\frac{1}{2}$." },
      { type: "num", prompt: "Solve $\\frac{3}{4}n = -15$.", pre: "$n =$", answer: -20, skill: "Multiplication Property",
        near: [{ v: -11.25, tol: 1e-9, fb: "Multiply by the reciprocal, $\\frac{4}{3}$, not by $\\frac{3}{4}$." }, { v: 20, fb: "Different signs give a negative product." }],
        hints: ["Multiply both sides by $\\frac{4}{3}$."], why: "$\\frac{4}{3}(-15) = -\\frac{60}{3} = -20$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A negative fraction coefficient: its reciprocal is negative too. $$-\\frac{3}{8}w = 72$$",
        scene: { type: "walk", how: HOW_4_7, rows: [
          { step: 1, m: "-\\frac{3}{8}w = 72", say: "$w$ is multiplied by $-\\frac{3}{8}$." },
          { step: 1, m: "\\left(-\\frac{8}{3}\\right)\\left(-\\frac{3}{8}\\right)w = \\left(-\\frac{8}{3}\\right)(72)", say: "Multiply both sides by the reciprocal, $-\\frac{8}{3}$." },
          { step: 2, m: "w = -192", say: "$72 \\div 3 = 24$, and $24 \\cdot 8 = 192$. Different signs: negative." },
          { step: 3, m: "-\\frac{3}{8}(-192) = 72", say: "$192 \\div 8 = 24$, and $24 \\cdot 3 = 72$. True." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Translate and solve: “$n$ divided by 6 is $-24$.”", pre: "$n =$", answer: -144, skill: "Translate and solve",
        near: [{ v: -4, fb: "The equation is $\\frac{n}{6} = -24$. Multiply both sides by 6." }, { v: 144, fb: "Different signs give a negative product." }],
        hints: ["$\\frac{n}{6} = -24$."], why: "$n = 6(-24) = -144$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{x}{5} = 10", "x = \\frac{10}{5}", "x = 2"], answer: 1, fix: "x = 5 \\cdot 10",
        fb: { 0: GIVEN, 2: LATER }, skill: "Multiplication Property",
        hints: ["$x$ is divided by 5. What undoes a division?"],
        why: "Multiply both sides by 5: $x = 50$. Check: $\\frac{50}{5} = 10$." },
      { type: "num", kicker: "Use it", prompt: "Three quarters of a tank is 12 gallons, so $\\frac{3}{4}t = 12$. How much does the full tank $t$ hold?",
        pre: "$t =$", post: "gallons", answer: 16, skill: "Multiplication Property",
        near: [{ v: 9, fb: "That is $\\frac{3}{4}$ of 12. Multiply by the reciprocal, $\\frac{4}{3}$." }],
        hints: ["Multiply both sides by $\\frac{4}{3}$."], why: "$\\frac{4}{3} \\cdot 12 = 16$." }
    ]
  });
  /* ================================================================ Skills */
  // Proper fractions in lowest terms, small enough to work in the head.
  var PROPER = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 8], [5, 8]];
  // A typed fraction or mixed number, marked by its value.
  function fracAns(n, d, o) { return Object.assign({ type: "num", answer: n / d, tol: 1e-9, shown: o && o.mixed ? mixed(n, d) : L.fracText(n, d) }, o && o.step); }
  var SKILLS = [
    { id: "pa4-convert", title: "Improper fractions and mixed numbers", lesson: 2,
      gen: function (R) {
        var F = R.pick(PROPER), w = R.int(1, 6), r = F[0], d = F[1], n = w * d + r;
        if (R.chance(0.5)) return Object.assign({ prompt: "Write $" + w + "\\frac{" + r + "}{" + d + "}$ as an improper fraction.",
          hints: ["Each whole is " + d + " parts: $" + w + " \\cdot " + d + " + " + r + "$."], why: "$" + w + " \\cdot " + d + " + " + r + " = " + n + "$, over " + d + "." }, fracIn(n, d));
        return mc(R, { prompt: "Write $\\frac{" + n + "}{" + d + "}$ as a mixed number.", right: "$" + w + "\\frac{" + r + "}{" + d + "}$",
          wrong: [{ t: "$" + (w + 1) + "\\frac{" + r + "}{" + d + "}$", fb: "$" + d + " \\cdot " + (w + 1) + " = " + d * (w + 1) + "$ is more than " + n + "." },
                  { t: "$" + w + "\\frac{" + r + "}{" + n + "}$", fb: "The denominator stays " + d + "." },
                  { t: "$" + r + "\\frac{" + w + "}{" + d + "}$", fb: "The quotient is the whole number, and the remainder is the numerator." }],
          hints: ["$" + n + " = " + d + " \\cdot " + w + " + " + r + "$."], why: w + " wholes, and " + r + " left over." });
      } },
    { id: "pa4-simplify", title: "Simplify a fraction", lesson: 3,
      gen: function (R) {
        var F = R.pick(PROPER), g = R.int(2, 9);
        return Object.assign({ prompt: "Simplify. $$\\frac{" + F[0] * g + "}{" + F[1] * g + "}$$",
          hints: ["Both are divisible by " + g + "."], why: "Divide the numerator and the denominator by " + g + ": $\\frac{" + F[0] + "}{" + F[1] + "}$." }, fracIn(F[0], F[1]));
      } },
    { id: "pa4-multiply", title: "Multiply and divide fractions", lesson: 3,
      gen: function (R) {
        var A = R.pick(PROPER), B = R.pick(PROPER), div = R.chance(0.5), n = div ? A[0] * B[1] : A[0] * B[0], d = div ? A[1] * B[0] : A[1] * B[1];
        var other = div ? (A[0] * B[0]) / (A[1] * B[1]) : (A[0] * B[1]) / (A[1] * B[0]);
        return fracAns(n, d, { step: { prompt: (div ? "Divide" : "Multiply") + ". (Type a fraction like 5/4.) $$" + frac(A[0], A[1]) + (div ? " \\div " : " \\cdot ") + frac(B[0], B[1]) + "$$",
          near: near(n / d, [{ v: other, tol: 1e-9, fb: div ? "That multiplies. To divide, flip the second fraction first." : "That divides. To multiply, go straight across." }]),
          hints: [div ? "Multiply by the reciprocal: $" + frac(A[0], A[1]) + " \\cdot \\frac{" + B[1] + "}{" + B[0] + "}$." : "Numerators together, denominators together, then simplify."],
          why: "$\\frac{" + n + "}{" + d + "}" + (L.gcd(n, d) > 1 ? " = " + frac(n, d) : "") + "$." } });
      } },
    { id: "pa4-mixedmul", title: "Multiply and divide mixed numbers", lesson: 4,
      gen: function (R) {
        var A = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5]]), B = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]), w1 = R.int(1, 4), w2 = R.int(1, 3), div = R.chance(0.4);
        var n1 = w1 * A[1] + A[0], n2 = w2 * B[1] + B[0], n = div ? n1 * B[1] : n1 * n2, d = div ? A[1] * n2 : A[1] * B[1];
        var t1 = w1 + "\\frac{" + A[0] + "}{" + A[1] + "}", t2 = w2 + "\\frac{" + B[0] + "}{" + B[1] + "}";
        return fracAns(n, d, { mixed: true, step: { prompt: (div ? "Divide" : "Multiply") + ". (Type a fraction like 5/4 or a mixed number like 2 1/3.) $$" + t1 + (div ? " \\div " : " \\cdot ") + t2 + "$$",
          near: near(n / d, div ? [{ v: n1 * n2 / (A[1] * B[1]), tol: 1e-9, fb: "That multiplies. To divide, flip the second fraction first." }]
                                 : [{ v: w1 * w2 + A[0] * B[0] / (A[1] * B[1]), tol: 1e-9, fb: "Mixed numbers cannot be multiplied part by part. Convert first." }]),
          hints: ["Convert first: $\\frac{" + n1 + "}{" + A[1] + "}$ and $\\frac{" + n2 + "}{" + B[1] + "}$."],
          why: "$\\frac{" + n1 + "}{" + A[1] + "}" + (div ? " \\cdot \\frac{" + B[1] + "}{" + n2 + "}" : " \\cdot \\frac{" + n2 + "}{" + B[1] + "}") + " = " + mixed(n, d, true) + "$." } });
      } },
    { id: "pa4-add-like", title: "Add and subtract with a common denominator", lesson: 5,
      gen: function (R) {
        var d = R.pick([5, 6, 7, 8, 9, 10, 12]), a = R.int(1, d - 1), b = R.int(1, d - 1), sub = R.chance(0.5);
        if (sub && a === b) b = a === 1 ? 2 : a - 1;
        var n = sub ? a - b : a + b;
        return fracAns(n, d, { step: { prompt: (sub ? "Subtract" : "Add") + ". (Type a fraction like 2/3.) $$\\frac{" + a + "}{" + d + "}" + (sub ? " - " : " + ") + "\\frac{" + b + "}{" + d + "}$$",
          near: near(n / d, [sub ? { v: (a + b) / d, tol: 1e-9, fb: "This is a subtraction: $" + a + " - " + b + "$." } : { v: n / (2 * d), tol: 1e-9, fb: "Do not add the denominators. The parts stay the same size." },
                             { v: -n / d, tol: 1e-9, fb: "Check the sign: $" + a + (sub ? " - " : " + ") + b + " = " + n + "$." }]),
          hints: [(sub ? "Subtract" : "Add") + " the numerators. Keep the denominator " + d + "."], why: "$\\frac{" + n + "}{" + d + "}" + (L.gcd(n, d) > 1 ? " = " + frac(n, d) : "") + "$." } });
      } },
    { id: "pa4-add-unlike", title: "Add and subtract with different denominators", lesson: 6,
      gen: function (R) {
        var D = R.pick([[2, 3], [3, 4], [4, 6], [6, 8], [2, 5], [3, 5], [4, 5], [6, 9], [8, 12], [3, 8], [4, 10]]), b = D[0], d = D[1], a = R.int(1, b - 1), c = R.int(1, d - 1), sub = R.chance(0.5);
        var lcd = b * d / L.gcd(b, d), A = a * lcd / b, C = c * lcd / d, n = sub ? A - C : A + C;
        return fracAns(n, lcd, { step: { prompt: (sub ? "Subtract" : "Add") + ". (Type a fraction like 2/3.) $$\\frac{" + a + "}{" + b + "}" + (sub ? " - " : " + ") + "\\frac{" + c + "}{" + d + "}$$",
          near: near(n / lcd, [sub ? { v: (A + C) / lcd, tol: 1e-9, fb: "This is a subtraction." } : { v: (a + c) / (b + d), tol: 1e-9, fb: "Do not add numerators and denominators. Rename both fractions with the LCD, " + lcd + "." },
                               { v: -n / lcd, tol: 1e-9, fb: "Check the sign: $" + A + (sub ? " - " : " + ") + C + " = " + n + "$." }]),
          hints: ["The LCD is " + lcd + ": $\\frac{" + A + "}{" + lcd + "}$ and $\\frac{" + C + "}{" + lcd + "}$."],
          why: "$\\frac{" + A + "}{" + lcd + "}" + (sub ? " - " : " + ") + "\\frac{" + C + "}{" + lcd + "} = " + frac(n, lcd) + "$." } });
      } },
    { id: "pa4-mixed", title: "Add and subtract mixed numbers", lesson: 7,
      gen: function (R) {
        var d = R.pick([3, 4, 5, 6, 8]), w2 = R.int(1, 4), w1 = w2 + R.int(1, 4), a = R.int(1, d - 1), c = R.int(1, d - 1), sub = R.chance(0.5);
        var n = sub ? (w1 * d + a) - (w2 * d + c) : (w1 + w2) * d + a + c;
        var t1 = w1 + "\\frac{" + a + "}{" + d + "}", t2 = w2 + "\\frac{" + c + "}{" + d + "}";
        return fracAns(n, d, { mixed: true, step: { prompt: (sub ? "Subtract" : "Add") + ". (Type a mixed number like 2 1/3.) $$" + t1 + (sub ? " - " : " + ") + t2 + "$$",
          near: near(n / d, sub && a < c ? [{ v: w1 - w2 + (c - a) / d, tol: 1e-9, fb: "You took the smaller fraction from the larger, the wrong way round. Borrow a whole first." }] : []),
          hints: [sub ? (a < c ? "Borrow: $" + w1 + "\\frac{" + a + "}{" + d + "} = " + (w1 - 1) + "\\frac{" + (a + d) + "}{" + d + "}$." : "Subtract the wholes, and subtract the fractions.") : "Add the wholes, add the fractions, and carry if the fraction is improper."],
          why: "$" + t1 + (sub ? " - " : " + ") + t2 + " = " + mixed(n, d, true) + "$." } });
      } },
    { id: "pa4-solve", title: "Solve equations with fractions", lesson: 8,
      gen: function (R) {
        var v = R.pick(["x", "n", "y", "a"]), kind = R.int(0, 2);
        if (kind === 0) {
          var k = R.int(2, 9), q = R.int(2, 12) * R.pick([1, -1]);
          return { type: "num", prompt: "Solve. $$\\frac{" + v + "}{" + k + "} = " + q + "$$", pre: "$" + v + " =$", answer: k * q,
            near: near(k * q, [{ v: -k * q, fb: "Check the sign of $" + k + "(" + q + ")$." }, { v: q / k, tol: 1e-9, fb: "$" + v + "$ is divided by " + k + ", so multiply both sides by " + k + "." }]),
            hints: ["Multiply both sides by " + k + "."], why: "$" + v + " = " + k + "(" + q + ") = " + k * q + "$." };
        }
        if (kind === 1) {
          var F = R.pick([[2, 3], [3, 4], [2, 5], [3, 5], [5, 6], [3, 8]]), t = R.int(1, 6) * R.pick([1, -1]);
          return { type: "num", prompt: "Solve. $$\\frac{" + F[0] + "}{" + F[1] + "}" + v + " = " + F[0] * t + "$$", pre: "$" + v + " =$", answer: F[1] * t,
            near: near(F[1] * t, [{ v: F[0] * F[0] * t / F[1], tol: 1e-9, fb: "Multiply by the reciprocal, $\\frac{" + F[1] + "}{" + F[0] + "}$." }, { v: -F[1] * t, fb: "Check the sign." }]),
            hints: ["Multiply both sides by $\\frac{" + F[1] + "}{" + F[0] + "}$."], why: "$\\frac{" + F[1] + "}{" + F[0] + "}(" + F[0] * t + ") = " + F[1] * t + "$." };
        }
        var d = R.pick([5, 7, 8, 9, 10]), a = R.int(1, d - 2), b = R.int(a + 1, d - 1);
        return fracAns(b - a, d, { step: { prompt: "Solve. (Type a fraction like 2/3.) $$" + v + " + \\frac{" + a + "}{" + d + "} = \\frac{" + b + "}{" + d + "}$$", pre: "$" + v + " =$",
          near: [{ v: (a + b) / d, tol: 1e-9, fb: "$\\frac{" + a + "}{" + d + "}$ is added, so subtract it from both sides." }],
          hints: ["Subtract $\\frac{" + a + "}{" + d + "}$ from both sides."], why: "$\\frac{" + b + " - " + a + "}{" + d + "} = " + frac(b - a, d) + "$." } });
      } }
  ];
  L.unit("prealg", 4, {
    title: "Fractions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Mixed numbers, simplifying, and multiplying and dividing fractions.",
        skills: ["pa4-convert", "pa4-simplify", "pa4-multiply", "pa4-mixedmul"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Adding and subtracting fractions, with common and different denominators.",
        skills: ["pa4-add-like", "pa4-add-unlike"], per: 3 },
      { title: "Quiz 3", after: 8, blurb: "Mixed numbers, and equations with fractions.",
        skills: ["pa4-mixed", "pa4-solve"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:4", {
    2: { name: "Fractions", frame: "In $\\frac{a}{b}$ the [[denominator]] counts the equal parts in one whole, and the [[numerator]] counts the parts taken. An [[improper]] fraction can be written as a [[mixed number]].",
         chips: ["reciprocal", "simplified"] },
    3: { name: "Multiplying and dividing fractions", frame: "To multiply, multiply the [[numerators]] and multiply the [[denominators]]. To divide, multiply by the [[reciprocal]] of the second fraction. Remove common [[factors]] to simplify.",
         chips: ["opposite", "multiples"] },
    4: { name: "Mixed numbers and complex fractions", frame: "Before multiplying or dividing mixed numbers, write them as [[improper]] fractions. The main bar of a complex fraction means [[division]].",
         chips: ["proper", "addition"] },
    5: { name: "Common denominators", frame: "When the denominators are the same, add or subtract the [[numerators]] and [[keep]] the denominator. Then [[simplify]].",
         chips: ["add", "denominators"], fb: { add: "Adding the denominators would change the size of the parts." } },
    6: { name: "The least common denominator", frame: "To add fractions with different denominators, find the [[LCD]], the least common [[multiple]] of the denominators. Rename each fraction with an [[equivalent]] one, then add the numerators.",
         chips: ["factor", "reciprocal"] },
    7: { name: "Adding and subtracting mixed numbers", frame: "Add the [[wholes]] and add the [[fractions]]. An improper fraction part [[carries]] a whole across. In a subtraction, a fraction that is too small [[borrows]] one.",
         chips: ["multiplies", "denominators"] },
    8: { name: "Multiplication Property of Equality", frame: "Multiplying [[both]] sides of an equation by the same number keeps it true. It undoes a [[division]]. A fraction coefficient is cleared by multiplying by its [[reciprocal]].",
         chips: ["opposite", "one"] }
  });
})();
