/* ==========================================================================
   Prealgebra — Unit 3: Integers. See lab/core.js for the format.

   Follows OpenStax Prealgebra 2e, Chapter 3, section for section: the
   readiness check, then 3.1 to 3.5. Each lesson teaches the book's own steps:
   the method, a worked example to watch, one done together, then on your own,
   a harder case, find the error, use it, and the concept built at the end.

   Negative numbers on the number line (3.1), the four operations with
   integers, modelled with zero pairs and hops (3.2–3.4), and equations that
   need the Division Property of Equality (3.5).

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
    blurb: "Book: Chapter 3 Be Prepared · The number line, evaluating an expression, and a first equation.",
    mins: 6, v: 1,
    steps: [
      { type: "numberline", kicker: "Check 1 · The number line", prompt: "Drag the point to 5.",
        min: 0, max: 10, mode: "point", points: [{ v: 1, drag: true }], answer: { points: [5] }, skill: "Number line",
        hints: ["Count the ticks from 0."], why: "5 is five steps to the right of 0." },
      { type: "choice", prompt: "On a number line, where is the larger of two numbers?",
        options: [{ t: "Further to the right" }, { t: "Further to the left", fb: "Numbers grow as you move right: 2, 3, 4, …" }],
        answer: 0, skill: "Compare numbers", hints: ["Which way do the numbers count up?"], why: "Numbers increase from left to right." },
      { type: "num", kicker: "Check 2 · Evaluate", prompt: "Evaluate $x + 8$ when $x = 6$.", answer: 14, skill: "Evaluate an expression",
        near: [{ v: 68, fb: "Replace $x$ with 6, then add." }], hints: ["$6 + 8$."], why: "$6 + 8 = 14$." },
      { type: "num", prompt: "Simplify $20 - 2 \\cdot 3$.", answer: 14, skill: "Order of operations",
        near: [{ v: 54, fb: "Multiply before you subtract." }], hints: ["$2 \\cdot 3$ first."], why: "$20 - 6 = 14$." },
      { type: "num", kicker: "Check 3 · A first equation", prompt: "Solve $n + 5 = 12$.", pre: "$n =$", answer: 7, skill: "Solve an equation",
        near: [{ v: 17, fb: "5 is added, so subtract 5 from both sides." }], hints: ["Subtract 5 from both sides."], why: "$12 - 5 = 7$." },
      { type: "num", prompt: "Solve $a - 4 = 9$.", pre: "$a =$", answer: 13, skill: "Solve an equation",
        near: [{ v: 5, fb: "4 is subtracted, so add 4 to both sides." }], hints: ["Add 4 to both sides."], why: "$9 + 4 = 13$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 3.1**. If **check 2** slipped, see lessons 2.1 and 2.2. If **check 3** slipped, see lesson 2.3.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* =============================================== 3.1 · Introduction to integers */
  var HOW_3_1 = [["Inside", "Simplify inside the absolute value bars first. They act as grouping symbols."],
                 ["Distance", "Take each absolute value: the distance from 0, which is never negative."],
                 ["Outside", "Then deal with any sign or operation outside the bars."]];
  LESSONS.push({
    title: "Introduction to integers",
    blurb: "Book 3.1 · Negative numbers on the number line, ordering, opposites and absolute value.",
    mins: 12, v: 1,
    steps: [
      { type: "numberline", kicker: "Warm up", prompt: "Numbers to the left of 0 are **negative**. Drag the point to $-4$.",
        min: -8, max: 8, mode: "point", points: [{ v: 3, drag: true }], answer: { points: [-4] }, skill: "Locate integers",
        hints: ["Count 4 steps to the left of 0."], why: "$-4$ is four steps to the left of 0." },
      { type: "learn", kicker: "The idea",
        prompt: "Every number has an **opposite**: the number the same distance from 0 on the other side. That distance is the number's **absolute value**, written with bars: $|-5| = 5$. The whole numbers and their opposites are the **integers**.",
        scene: { type: "method", how: HOW_3_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one simplified. $$20 - |-8| + |3|$$",
        scene: { type: "walk", how: HOW_3_1, rows: [
          { step: 1, m: "20 - |-8| + |3|", say: "Inside each pair of bars there is a single number: nothing to simplify there." },
          { step: 2, m: "|-8| = 8 \\quad |3| = 3", say: "$-8$ is 8 units from 0, and 3 is 3 units from 0.", fig: nline(-9, 5, [{ v: -8, name: "−8" }, { v: 3, name: "3", c: "green" }], { hops: [[0, -8, "orange", "8 units"], [0, 3, "green", "3 units"]], alt: "A number line. −8 is 8 units to the left of 0, and 3 is 3 units to the right." }),
            ask: { prompt: "What is $|-8|$?", answer: 0,
                   options: [{ t: "8" }, { t: "$-8$", fb: "A distance is never negative." }] } },
          { step: 3, m: "20 - 8 + 3", say: "Replace each absolute value with its number." },
          { step: 3, m: "15", say: "Subtract and add from left to right." }] },
        gate: true, then: "The bars strip the sign away. Whatever is outside them is still done afterwards." },
      { type: "guided", kicker: "Together",
        prompt: "Now you simplify $-|-15|$.",
        how: HOW_3_1, skill: "Absolute value",
        steps: [
          { step: 1, ask: "What is inside the bars?", type: "choice", answer: 0,
            options: [{ t: "$-15$: a single number, nothing to simplify" }, { t: "$15$", fb: "Inside the bars is $-15$. The bars have not been applied yet." }],
            m: "-|-15|", say: "One number inside the bars." },
          { step: 2, ask: "What is $|-15|$?", type: "num", answer: 15, near: [{ v: -15, fb: "An absolute value is a distance: never negative." }], hint: "How far is $-15$ from 0?",
            m: "|-15| = 15", say: "15 units from 0." },
          { step: 3, ask: "Now the sign outside the bars. What is $-|-15|$?", type: "choice", answer: 0,
            options: [{ t: "$-15$" }, { t: "$15$", fb: "The bars give 15. The minus sign in front then makes it negative." }],
            m: "-|-15| = -15", say: "The opposite of 15." }],
        why: "Inside, distance, outside. Now put some integers in order." },
      { type: "order", kicker: "On your own", prompt: "Put these in order, from **least** to **greatest**.",
        items: ["$-5$", "$-2$", "$0$", "$3$"], skill: "Order integers",
        hints: ["Further left on the number line means smaller."],
        why: "$-5 < -2 < 0 < 3$. Among negatives, the one further from 0 is the smaller." },
      { type: "slots", prompt: "Opposite, or absolute value? Match each expression to its value.",
        slots: [{ id: "a", label: "$-7$" }, { id: "b", label: "$7$" }, { id: "c", label: "$4$" }, { id: "d", label: "$-4$" }],
        cards: [{ t: "the opposite of 7", slot: "a", fb: "Same distance from 0, on the other side." },
                { t: "$|-7|$", slot: "b", fb: "$-7$ is 7 units from 0." },
                { t: "$-(-4)$", slot: "c", fb: "The opposite of $-4$ is 4." },
                { t: "$-|-4|$", slot: "d", fb: "The bars give 4. The sign outside makes it $-4$." }],
        skill: "Opposites", hints: ["Bars mean distance. A minus sign in front means opposite."],
        why: "$-(-4)$ and $-|-4|$ look alike, but only the first one is positive." },
      { type: "learn", kicker: "A harder case",
        prompt: "Which is greater: $|-9|$ or $-(-4)$? Simplify each side before comparing.",
        scene: { type: "walk", how: HOW_3_1, rows: [
          { step: 2, m: "|-9| = 9", say: "The distance of $-9$ from 0." },
          { step: 3, m: "-(-4) = 4", say: "No bars here: the opposite of $-4$." },
          { step: 3, m: "9 > 4", say: "So $|-9| > -(-4)$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which expression is “the opposite of negative fifteen”?",
        options: [{ t: "$-(-15)$" }, { t: "$-15$", fb: "That is negative fifteen itself. Its opposite needs one more sign." }, { t: "$|15|$", fb: "Bars mean absolute value, not opposite." }],
        answer: 0, skill: "Translate with integers", hints: ["“Negative fifteen” is $-15$. “The opposite of” puts a minus sign in front."], why: "$-(-15) = 15$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Lu says: “$-|-8| = 8$, because two negatives make a positive.” What is wrong?",
        options: [{ t: "The bars come first and give 8. The sign outside then makes it $-8$." },
                  { t: "It should be 0.", fb: "$|-8|$ is 8, not 0." },
                  { t: "Nothing. It is right.", fb: "That rule is for $-(-8)$. Bars are not parentheses." }],
        answer: 0, skill: "Absolute value", hints: ["Step 2 before step 3."], why: "$-|-8| = -8$, while $-(-8) = 8$." },
      { type: "choice", kicker: "Use it", prompt: "A submarine is **250 feet below** sea level. Which integer describes its position?",
        options: [{ t: "$-250$" }, { t: "$250$", fb: "Above sea level is positive. Below it is negative." }, { t: "$|-250|$", fb: "That equals 250: its distance from the surface, not its position." }],
        answer: 0, skill: "Translate with integers", hints: ["Sea level is 0. Which side of 0 is “below”?"], why: "Below sea level is the negative direction." }
    ]
  });

  /* ========================================================= 3.2 · Add integers */
  var HOW_3_2 = [["Signs", "Are the signs the same, or different?"],
                 ["Sizes", "Same signs: add the absolute values. Different signs: subtract the smaller from the larger."],
                 ["Sign", "Same signs: keep that sign. Different signs: take the sign of the number with the larger absolute value."]];
  LESSONS.push({
    title: "Add integers",
    blurb: "Book 3.2 · Zero pairs, adding with like and unlike signs, and integer addition in use.",
    mins: 12, v: 1,
    steps: [
      { type: "tilemat", kicker: "Warm up", prompt: "A yellow tile is $+1$ and a red tile is $-1$. Together they make 0: a **zero pair**. This mat shows $5 + (-3)$. Tap pairs until nothing more cancels.",
        terms: [[5, "1"], [-3, "1"]], skill: "Add integers",
        hints: ["Tap a yellow tile, then a red tile."], why: "Three zero pairs go, and two yellow tiles are left: $5 + (-3) = 2$." },
      { type: "learn", kicker: "The idea",
        prompt: "When the signs are the same, the tiles pile up: add. When the signs differ, some tiles cancel: subtract, and whichever colour had more tiles decides the sign.",
        scene: { type: "method", how: HOW_3_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $-7 + 4$ added.",
        scene: { type: "walk", how: HOW_3_2, rows: [
          { step: 1, m: "-7 + 4", say: "One negative, one positive: different signs.", fig: nline(-9, 3, [{ v: -7, name: "−7" }], { hops: [[0, -7, "orange", "−7"]], alt: "A number line with a hop from 0 left to −7." }) },
          { step: 2, m: "|-7| = 7 \\quad |4| = 4", say: "The absolute values." },
          { step: 2, m: "7 - 4 = 3", say: "Different signs: subtract the smaller from the larger.",
            ask: { prompt: "Seven red tiles and four yellow tiles. How many are left after the zero pairs go?", answer: 0,
                   options: [{ t: "3 red tiles" }, { t: "3 yellow tiles", fb: "There were more red tiles, so red is what is left." }, { t: "11 tiles", fb: "Opposite colours cancel. They do not pile up." }] } },
          { step: 3, m: "-7 + 4 = -3", say: "$-7$ has the larger absolute value, so the sum is negative.", fig: nline(-9, 3, [{ v: -3, name: "−3" }], { hops: [[0, -7, "orange", "−7"], [-7, -3, "green", "+4"]], alt: "A hop from 0 left to −7, then a hop 4 to the right, landing on −3." }) }] },
        gate: true, then: "On the number line: go 7 left, then 4 right. You land on $-3$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you add $-8 + (-5)$.",
        how: HOW_3_2, skill: "Add integers",
        steps: [
          { step: 1, ask: "Are the signs the same or different?", type: "choice", answer: 0,
            options: [{ t: "The same: both are negative" }, { t: "Different", fb: "$-8$ and $-5$ are both negative." }],
            m: "-8 + (-5)", say: "Same signs." },
          { step: 2, ask: "Same signs: add the absolute values. What is $8 + 5$?", type: "num", answer: 13, near: [{ v: 3, fb: "Same signs: the tiles pile up. Add." }], hint: "$8 + 5$.",
            m: "8 + 5 = 13", say: "Thirteen tiles, all red." },
          { step: 3, ask: "Which sign does the sum take?", type: "choice", answer: 0,
            options: [{ t: "Negative: $-13$" }, { t: "Positive: $13$", fb: "Both numbers are negative, so their sum is too." }],
            m: "-8 + (-5) = -13", say: "Two negatives add to a negative." }],
        why: "Signs, sizes, sign. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Add $-14 + 9$.", answer: -5, skill: "Add integers",
        near: [{ v: 5, fb: "$-14$ has the larger absolute value, so the sum is negative." }, { v: -23, fb: "Different signs: subtract the absolute values." }],
        hints: ["$14 - 9$, with the sign of the $-14$."], why: "$14 - 9 = 5$, and the larger absolute value is negative: $-5$." },
      { type: "num", prompt: "Add $-6 + (-9)$.", answer: -15, skill: "Add integers",
        near: [{ v: 15, fb: "Both are negative, so the sum is negative." }, { v: -3, fb: "Same signs: add the absolute values." }, { v: 3, fb: "Same signs: add the absolute values, and keep the negative sign." }],
        hints: ["$6 + 9$, and keep the sign."], why: "$6 + 9 = 15$, and both are negative: $-15$." },
      { type: "learn", kicker: "A harder case",
        prompt: "With several numbers, gather the positives and the negatives. $$-5 + 12 + (-3) + 2$$",
        scene: { type: "walk", how: HOW_3_2, rows: [
          { step: 1, m: "-5 + 12 + (-3) + 2", say: "Two positives and two negatives." },
          { step: 2, m: "12 + 2 = 14 \\quad 5 + 3 = 8", say: "Same signs add: 14 positive in all, and 8 negative in all." },
          { step: 2, m: "14 - 8 = 6", say: "Now the two totals have different signs: subtract." },
          { step: 3, m: "14 + (-8) = 6", say: "The positives had the larger total, so the answer is positive." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Evaluate $x + 8$ when $x = -13$.", answer: -5, skill: "Evaluate with integers",
        near: [{ v: 5, fb: "13 is the larger absolute value, and it is negative." }, { v: -21, fb: "Different signs: subtract." }, { v: 21, fb: "$x$ is $-13$, not 13." }],
        hints: ["$-13 + 8$."], why: "$13 - 8 = 5$, with the sign of $-13$: $-5$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where adding $-9 + 4$ **first** goes wrong.",
        lines: ["-9 + 4", "9 + 4 = 13", "-13"], answer: 1, fix: "9 - 4 = 5",
        fb: { 0: GIVEN, 2: LATER }, skill: "Add integers",
        hints: ["Are the signs the same or different?"],
        why: "The signs differ, so subtract the absolute values: $9 - 4 = 5$, and the sum is $-5$." },
      { type: "num", kicker: "Use it", prompt: "At dawn the temperature was $-6$ degrees. By noon it had **risen 15 degrees**. What was the temperature at noon?",
        post: "degrees", answer: 9, skill: "Add integers",
        near: [{ v: -21, fb: "Rising means adding 15." }, { v: 21, fb: "It started at $-6$, not 6." }, { v: -9, fb: "15 is the larger absolute value, and it is positive." }],
        hints: ["$-6 + 15$."], why: "$15 - 6 = 9$, and 15 is the larger: positive 9." }
    ]
  });

  /* ==================================================== 3.3 · Subtract integers */
  var HOW_3_3 = [["Opposite", "Change the subtraction to adding the opposite: $a - b = a + (-b)$."],
                 ["Add", "Add, using the rules for signs."],
                 ["Sense", "Does the answer make sense on the number line?"]];
  LESSONS.push({
    title: "Subtract integers",
    blurb: "Book 3.3 · Subtracting is adding the opposite, and what it means to subtract a negative.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Add $-4 + (-6)$.", answer: -10, skill: "Add integers",
        near: [{ v: 10, fb: "Both are negative, so the sum is negative." }, { v: -2, fb: "Same signs: add the absolute values." }], hints: ["Same signs: add, and keep the sign."], why: "$4 + 6 = 10$, both negative: $-10$." },
      { type: "learn", kicker: "The idea",
        prompt: "Subtracting a number gives the same result as **adding its opposite**. $7 - 3$ and $7 + (-3)$ are both 4. So every subtraction can be turned into an addition, and you already know how to add.",
        scene: { type: "method", how: HOW_3_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $5 - (-3)$ subtracted.",
        scene: { type: "walk", how: HOW_3_3, rows: [
          { step: 1, m: "5 - (-3)", say: "A subtraction: turn it into adding the opposite." },
          { step: 1, m: "5 + 3", say: "The opposite of $-3$ is 3.",
            ask: { prompt: "What is the opposite of $-3$?", answer: 0,
                   options: [{ t: "$3$" }, { t: "$-3$", fb: "That is the number itself. Its opposite is on the other side of 0." }] } },
          { step: 2, m: "8", say: "Same signs: add." },
          { step: 3, m: "5 - (-3) = 8", say: "Taking away a debt of 3 leaves you 3 better off, so the answer is to the right of 5.", fig: nline(-1, 9, [{ v: 5, name: "5" }, { v: 8, name: "8", c: "green" }], { hops: [[5, 8, "green", "+3"]], alt: "A number line with a hop from 5 right to 8." }) }] },
        gate: true, then: "Subtracting a negative is the same as adding a positive." },
      { type: "guided", kicker: "Together",
        prompt: "Now you subtract $-4 - 9$.",
        how: HOW_3_3, skill: "Subtract integers",
        steps: [
          { step: 1, ask: "Rewrite it as adding the opposite.", type: "choice", answer: 0,
            options: [{ t: "$-4 + (-9)$" }, { t: "$-4 + 9$", fb: "The opposite of 9 is $-9$." }, { t: "$4 + (-9)$", fb: "Only the number being subtracted changes to its opposite." }],
            m: "-4 + (-9)", say: "The opposite of 9 is $-9$." },
          { step: 2, ask: "Same signs: add the absolute values. What is $4 + 9$?", type: "num", answer: 13, hint: "$4 + 9$.",
            m: "-4 + (-9) = -13", say: "Both negative, so the sum is negative." },
          { step: 3, ask: "Starting at $-4$ and subtracting 9 moves which way?", type: "choice", answer: 0,
            options: [{ t: "Left, further from 0: $-13$ makes sense" }, { t: "Right, toward 0", fb: "Subtracting a positive number moves left." }],
            m: "-4 - 9 = -13", say: "Nine steps to the left of $-4$." }],
        why: "Opposite, add, sense. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Subtract $-7 - (-10)$.", answer: 3, skill: "Subtract integers",
        near: [{ v: -17, fb: "The opposite of $-10$ is $+10$: $-7 + 10$." }, { v: -3, fb: "10 is the larger absolute value, and it is positive." }, { v: 17, fb: "$-7 + 10$ has different signs: subtract the absolute values." }],
        hints: ["$-7 + 10$."], why: "$-7 + 10 = 3$." },
      { type: "sort", prompt: "Without working them out fully, decide: is each result positive or negative?",
        bins: ["Positive", "Negative"],
        cards: [{ t: "$3 - 8$", bin: 1, fb: "$3 + (-8) = -5$." },
                { t: "$-3 - (-8)$", bin: 0, fb: "$-3 + 8 = 5$." },
                { t: "$-3 - 8$", bin: 1, fb: "$-3 + (-8) = -11$." },
                { t: "$3 - (-8)$", bin: 0, fb: "$3 + 8 = 11$." }],
        skill: "Subtract integers", hints: ["Rewrite each as adding the opposite."],
        why: "The same four digits give four different answers: $-5$, $5$, $-11$ and $11$." },
      { type: "learn", kicker: "A harder case",
        prompt: "In a longer expression, turn every subtraction into an addition first. $$-2 - (-9) + 4 - 7$$",
        scene: { type: "walk", how: HOW_3_3, rows: [
          { step: 1, m: "-2 + 9 + 4 + (-7)", say: "Two subtractions, each replaced by adding the opposite." },
          { step: 2, m: "9 + 4 = 13 \\quad 2 + 7 = 9", say: "13 positive in all, and 9 negative in all." },
          { step: 2, m: "13 + (-9) = 4", say: "Different signs: subtract, and the positives win." },
          { step: 3, m: "-2 - (-9) + 4 - 7 = 4", say: "A small positive answer: sensible." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Overnight the temperature was $-9$ degrees. By afternoon it was 6 degrees. How many degrees did it **rise**? That is $6 - (-9)$.",
        post: "degrees", answer: 15, skill: "Subtract integers",
        near: [{ v: -3, fb: "$6 - (-9)$ is $6 + 9$." }, { v: 3, fb: "Subtracting $-9$ adds 9." }],
        hints: ["$6 + 9$."], why: "$6 + 9 = 15$: nine degrees up to 0, then six more." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["-6 - (-2)", "-6 + (-2)", "-8"], answer: 1, fix: "-6 + 2",
        fb: { 0: GIVEN, 2: LATER }, skill: "Subtract integers",
        hints: ["What is the opposite of $-2$?"],
        why: "The opposite of $-2$ is $+2$: $-6 + 2 = -4$." },
      { type: "num", kicker: "Use it", prompt: "A mountain top is at **14,505 feet**. A valley floor is at $-282$ feet. How much higher is the mountain top? (Type the answer without a comma.)",
        post: "feet", answer: 14787, skill: "Subtract integers",
        near: [big(14787), { v: 14223, fb: "Subtracting $-282$ adds 282." }],
        hints: ["$14505 - (-282) = 14505 + 282$."], why: "$14505 + 282 = 14787$." }
    ]
  });
  /* ========================================= 3.4 · Multiply and divide integers */
  var HOW_3_4 = [["Signs", "Are the signs the same, or different?"],
                 ["Compute", "Multiply or divide the absolute values."],
                 ["Sign", "Same signs give a positive answer. Different signs give a negative answer."]];
  LESSONS.push({
    title: "Multiply and divide integers",
    blurb: "Book 3.4 · The sign rules for products and quotients, and powers of negative numbers.",
    mins: 12, v: 1,
    steps: [
      { type: "table", kicker: "Warm up", prompt: "Each product is 5 less than the one above it. Keep the pattern going.",
        head: ["Multiply", "Product"], rows: [["5 \\cdot 2", 10], ["5 \\cdot 1", 5], ["5 \\cdot 0", 0], ["5 \\cdot (-1)", null], ["5 \\cdot (-2)", null]],
        answers: [[3, 1, -5], [4, 1, -10]], skill: "Multiply integers",
        hints: ["0 take away 5, then take away 5 again."], why: "A positive times a negative is negative: $5 \\cdot (-2) = -10$." },
      { type: "table", kicker: "Explore", prompt: "Now the first number is negative. Each product is 5 **more** than the one above it. Keep going.",
        head: ["Multiply", "Product"], rows: [["-5 \\cdot 2", -10], ["-5 \\cdot 1", -5], ["-5 \\cdot 0", 0], ["-5 \\cdot (-1)", null], ["-5 \\cdot (-2)", null]],
        answers: [[3, 1, 5], [4, 1, 10]], skill: "Multiply integers",
        hints: ["0 and 5 more, then 5 more again."], why: "A negative times a negative is positive: $-5 \\cdot (-2) = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "The two patterns give one rule, and division follows it too, because dividing undoes multiplying. Only the signs need thought. The arithmetic is the arithmetic you already know.",
        scene: { type: "method", how: HOW_3_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $-9 \\cdot 6$ multiplied.",
        scene: { type: "walk", how: HOW_3_4, rows: [
          { step: 1, m: "-9 \\cdot 6", say: "One negative, one positive: different signs." },
          { step: 2, m: "|-9| = 9 \\quad |6| = 6", say: "The absolute values." },
          { step: 2, m: "9 \\cdot 6 = 54", say: "Multiply them." },
          { step: 3, m: "-9 \\cdot 6 = -54", say: "Different signs: the product is negative.",
            ask: { prompt: "What would $-9 \\cdot (-6)$ be?", answer: 0,
                   options: [{ t: "$54$" }, { t: "$-54$", fb: "Two negatives are the same sign, so the product is positive." }] } }] },
        gate: true, then: "Same signs positive, different signs negative: for products and for quotients." },
      { type: "guided", kicker: "Together",
        prompt: "Now you divide $-56 \\div (-8)$.",
        how: HOW_3_4, skill: "Divide integers",
        steps: [
          { step: 1, ask: "Are the signs the same or different?", type: "choice", answer: 0,
            options: [{ t: "The same: both negative" }, { t: "Different", fb: "$-56$ and $-8$ are both negative." }],
            m: "-56 \\div (-8)", say: "Same signs." },
          { step: 2, ask: "Divide the absolute values. What is $56 \\div 8$?", type: "num", answer: 7, hint: "$8 \\cdot 7 = 56$.",
            m: "56 \\div 8 = 7", say: "The size of the answer." },
          { step: 3, ask: "Which sign does the quotient take?", type: "choice", answer: 0,
            options: [{ t: "Positive: $7$" }, { t: "Negative: $-7$", fb: "Same signs give a positive quotient. Check: $-8 \\cdot 7 = -56$." }],
            m: "-56 \\div (-8) = 7", say: "Check by multiplying: $-8 \\cdot 7 = -56$." }],
        why: "Signs, compute, sign. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Multiply $-7 \\cdot (-8)$.", answer: 56, skill: "Multiply integers",
        near: [{ v: -56, fb: "Same signs give a positive product." }, { v: -15, fb: "This is a product, not a sum." }],
        hints: ["$7 \\cdot 8$, and the signs are the same."], why: "$7 \\cdot 8 = 56$, and same signs give a positive." },
      { type: "num", prompt: "Divide $36 \\div (-4)$.", answer: -9, skill: "Divide integers",
        near: [{ v: 9, fb: "Different signs give a negative quotient." }],
        hints: ["$36 \\div 4$, and the signs are different."], why: "$36 \\div 4 = 9$, and different signs give a negative." },
      { type: "learn", kicker: "A harder case",
        prompt: "With an exponent, look at what the exponent is attached to. Compare $(-2)^4$ and $-2^4$.",
        scene: { type: "walk", how: [["Base", "Find the base. Parentheses make the negative number the base. Without them the base is the number alone."],
                                    ["Power", "Write the power as a repeated product and multiply."],
                                    ["Sign", "Apply any sign left outside."]], rows: [
          { step: 1, m: "(-2)^4 \\qquad -2^4", say: "On the left the base is $-2$. On the right the base is 2, and the sign waits outside." },
          { step: 2, m: "(-2)(-2)(-2)(-2) = 16", say: "Four negatives: two pairs, each pair positive." },
          { step: 2, m: "2 \\cdot 2 \\cdot 2 \\cdot 2 = 16", say: "The right-hand power, without its sign." },
          { step: 3, m: "(-2)^4 = 16 \\qquad -2^4 = -16", say: "The sign outside makes the second one negative." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Simplify $7 - 3(-4 - 2)$.", answer: 25, skill: "Order of operations",
        near: [{ v: -11, fb: "$-3 \\cdot (-6)$ is $+18$." }, { v: -24, fb: "Multiply before you subtract: $3(-6)$ first." }, { v: 13, fb: "Inside the parentheses, $-4 - 2 = -6$." }],
        hints: ["Parentheses first: $-4 - 2 = -6$. Then $-3 \\cdot (-6)$."], why: "$7 - 3(-6) = 7 + 18 = 25$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["-3^2 + 4", "9 + 4", "13"], answer: 1, fix: "-9 + 4",
        fb: { 0: GIVEN, 2: LATER }, skill: "Powers of negatives",
        hints: ["Is the base $-3$, or 3?"],
        why: "Without parentheses the base is 3: $-3^2 = -9$, so the answer is $-5$." },
      { type: "num", kicker: "Use it", prompt: "A diver goes down **4 feet every second** for 12 seconds. Each second changes the depth by $-4$ feet. What is the total change, as an integer?",
        post: "feet", answer: -48, skill: "Multiply integers",
        near: [{ v: 48, fb: "Going down is the negative direction." }, { v: -3, fb: "Multiply the change each second by the number of seconds." }, { v: 8, fb: "Multiply, do not add." }],
        hints: ["$12 \\cdot (-4)$."], why: "$12 \\cdot (-4) = -48$." }
    ]
  });

  /* ====== 3.5 · Solve equations using integers; the Division Property of Equality */
  var HOW_3_5 = [["Undo", "See what is done to the variable. Do the opposite to **both** sides."],
                 ["Simplify", "Simplify each side."],
                 ["Check", "Substitute your answer into the original equation."]];
  LESSONS.push({
    title: "Solve equations using integers",
    blurb: "Book 3.5 · Checking a solution, the Division Property of Equality, and translating to an equation.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $x = -4$ a solution of $2x - 5 = -13$?",
        options: [{ t: "Yes: $2(-4) - 5 = -13$" }, { t: "No", fb: "$2(-4) = -8$, and $-8 - 5 = -13$. It is true." }],
        answer: 0, skill: "Check a solution", hints: ["Substitute $-4$ for $x$ and simplify."], why: "$-8 - 5 = -13$, a true statement." },
      { type: "learn", kicker: "Explore", prompt: "Three equal boxes balance 12. **Split each side into 3 equal groups** to find one box.",
        scene: { type: "balance", L: { x: 3, c: 0 }, R: { x: 0, c: 12 }, x: 4, gate: "solve" }, gate: true,
        after: "Dividing both sides by the same number keeps the balance level." },
      { type: "learn", kicker: "The idea",
        prompt: "That is the **Division Property of Equality**: divide both sides of an equation by the same number, not zero, and it stays true. It undoes a multiplication, just as subtracting undoes an addition.",
        scene: { type: "method", how: HOW_3_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$-3y = 63$$",
        scene: { type: "walk", how: HOW_3_5, rows: [
          { step: 1, m: "-3y = 63", say: "$y$ is multiplied by $-3$. Undo it: divide by $-3$." },
          { step: 1, m: "\\dfrac{-3y}{-3} = \\dfrac{63}{-3}", say: "Divide both sides by $-3$, sign and all.",
            ask: { prompt: "What is $63 \\div (-3)$?", answer: 0,
                   options: [{ t: "$-21$" }, { t: "$21$", fb: "Different signs give a negative quotient." }] } },
          { step: 2, m: "y = -21", say: "On the left, $-3 \\div (-3) = 1$, leaving $y$." },
          { step: 3, m: "-3(-21) = 63", say: "Same signs, positive: 63. True." }] },
        gate: true, then: "Divide by the whole coefficient, with its sign." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $7x = -49$.",
        how: HOW_3_5, skill: "Division Property",
        steps: [
          { step: 1, ask: "$x$ is multiplied by 7. What undoes that?", type: "choice", answer: 0,
            options: [{ t: "Divide both sides by 7" }, { t: "Subtract 7 from both sides", fb: "7 is multiplied, not added. Subtracting would not remove it." }, { t: "Multiply both sides by 7", fb: "That would give $49x$. Do the opposite of multiplying." }],
            m: "\\dfrac{7x}{7} = \\dfrac{-49}{7}", say: "Divide both sides by 7." },
          { step: 2, ask: "What is $-49 \\div 7$?", type: "num", answer: -7, near: [{ v: 7, fb: "Different signs give a negative quotient." }], hint: "$49 \\div 7$, with different signs.",
            m: "x = -7", say: "Different signs: negative." },
          { step: 3, ask: "Check: what is $7(-7)$?", type: "num", answer: -49, near: [{ v: 49, fb: "Different signs give a negative product." }], hint: "$7 \\cdot 7$, with different signs.",
            m: "7(-7) = -49", say: "It matches the right side." }],
        why: "Undo, simplify, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $a - 6 = -8$.", pre: "$a =$", answer: -2, skill: "Solve with integers",
        near: [{ v: -14, fb: "6 is subtracted, so add 6 to both sides." }, { v: 2, fb: "$-8 + 6$: the larger absolute value is negative." }],
        hints: ["Add 6 to both sides."], why: "$-8 + 6 = -2$. Check: $-2 - 6 = -8$." },
      { type: "sort", prompt: "What would you do to both sides to solve each equation?",
        bins: ["Add or subtract", "Divide"],
        cards: [{ t: "$x + 7 = -2$", bin: 0, fb: "7 is added: subtract 7." },
                { t: "$-5x = 30$", bin: 1, fb: "$x$ is multiplied by $-5$: divide by $-5$." },
                { t: "$n - 9 = -12$", bin: 0, fb: "9 is subtracted: add 9." },
                { t: "$4a = -28$", bin: 1, fb: "$a$ is multiplied by 4: divide by 4." }],
        skill: "Choose the property", hints: ["Is a number added to the variable, or multiplied by it?"],
        why: "A number written against the variable is multiplied. A number after $+$ or $-$ is added or subtracted." },
      { type: "learn", kicker: "A harder case",
        prompt: "Translate, then solve: “The number 108 is the product of $-9$ and $y$.”",
        scene: { type: "walk", how: [["Translate", "Turn the sentence into an equation. “Is” is the equals sign."],
                                    ["Solve", "Undo what is done to the variable, on both sides."],
                                    ["Check", "Substitute your answer into the sentence."]], rows: [
          { step: 1, m: "108 = -9y", say: "“Is” becomes $=$, and “the product of $-9$ and $y$” is $-9y$." },
          { step: 2, m: "\\dfrac{108}{-9} = \\dfrac{-9y}{-9}", say: "Divide both sides by $-9$." },
          { step: 2, m: "-12 = y", say: "Different signs: negative." },
          { step: 3, m: "-9(-12) = 108", say: "The product of $-9$ and $-12$ is 108. True." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Translate and solve: “Five more than $x$ is equal to $-3$.”", pre: "$x =$", answer: -8, skill: "Translate and solve",
        near: [{ v: 2, fb: "The equation is $x + 5 = -3$. Subtract 5 from both sides." }, { v: -2, fb: "$-3 - 5$ is $-3 + (-5)$." }, { v: 8, fb: "$-3 - 5$ is negative." }],
        hints: ["$x + 5 = -3$."], why: "$x = -3 - 5 = -8$. Check: $-8 + 5 = -3$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["-4x = 20", "x = 20 + 4", "x = 24"], answer: 1, fix: "x = \\dfrac{20}{-4}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Division Property",
        hints: ["Is $-4$ added to $x$, or multiplied by it?"],
        why: "$-4$ multiplies $x$, so divide both sides by $-4$: $x = -5$." },
      { type: "num", kicker: "Use it", prompt: "Over 6 hours the temperature changed by $-18$ degrees, the same amount each hour. If $c$ is the change each hour, then $6c = -18$. Find $c$.",
        pre: "$c =$", post: "degrees", answer: -3, skill: "Division Property",
        near: [{ v: 3, fb: "Different signs give a negative quotient: it fell each hour." }, { v: -24, fb: "6 multiplies $c$, so divide by 6." }, { v: -108, fb: "Divide both sides by 6. Do not multiply." }],
        hints: ["Divide both sides by 6."], why: "$-18 \\div 6 = -3$: it fell 3 degrees each hour." }
    ]
  });
  /* ================================================================ Skills */
  // An integer inside a sum or product: negatives go in parentheses.
  function par(v) { return v < 0 ? "(" + v + ")" : String(v); }
  var SKILLS = [
    { id: "pa3-absolute", title: "Opposites and absolute value", lesson: 2,
      gen: function (R) {
        var a = R.int(2, 19), kind = R.int(0, 3);
        var Q = [["|-" + a + "|", a, -a, "An absolute value is a distance: never negative."],
                 ["-|-" + a + "|", -a, a, "The bars give " + a + ". The sign outside then makes it negative."],
                 ["-(-" + a + ")", a, -a, "The opposite of a negative number is positive."],
                 ["-|" + a + "|", -a, a, "The bars give " + a + ". The sign outside then makes it negative."]][kind];
        return { type: "num", prompt: "Simplify. $$" + Q[0] + "$$", answer: Q[1], near: [{ v: Q[2], fb: Q[3] }],
          hints: ["Bars mean the distance from 0. A minus sign in front means the opposite."], why: "$" + Q[0] + " = " + Q[1] + "$." };
      } },
    { id: "pa3-add", title: "Add integers", lesson: 3,
      gen: function (R) {
        var a = R.int(2, 15) * R.pick([1, -1]), b = R.int(2, 15) * (a > 0 ? -1 : R.pick([1, -1])), ans = a + b, same = a < 0 && b < 0;
        if (Math.abs(a) === Math.abs(b) && !same) b -= 1, ans = a + b;
        return { type: "num", prompt: "Add. $$" + a + " + " + par(b) + "$$", answer: ans,
          near: near(ans, [{ v: -ans, fb: same ? "Both are negative, so the sum is negative." : "The sum takes the sign of the number with the larger absolute value." },
                           { v: same ? Math.abs(a) - Math.abs(b) : -(Math.abs(a) + Math.abs(b)), fb: same ? "Same signs: add the absolute values." : "Different signs: subtract the absolute values." },
                           { v: same ? Math.abs(b) - Math.abs(a) : Math.abs(a) + Math.abs(b), fb: same ? "Same signs: add the absolute values." : "Different signs: subtract the absolute values." }]),
          hints: [same ? "Same signs: add, and keep the sign." : "Different signs: subtract, and take the sign of the larger absolute value."], why: "$" + a + " + " + par(b) + " = " + ans + "$." };
      } },
    { id: "pa3-subtract", title: "Subtract integers", lesson: 4,
      gen: function (R) {
        var a = R.int(2, 15) * R.pick([1, -1]), b = R.int(2, 15) * R.pick([1, -1]), ans = a - b;
        return { type: "num", prompt: "Subtract. $$" + a + " - " + par(b) + "$$", answer: ans,
          near: near(ans, [{ v: a + b, fb: "Subtracting is adding the opposite: $" + a + " + " + par(-b) + "$." }, { v: -ans, fb: "Rewrite it as $" + a + " + " + par(-b) + "$ and use the rules for adding." }]),
          hints: ["Add the opposite: $" + a + " + " + par(-b) + "$."], why: "$" + a + " + " + par(-b) + " = " + ans + "$." };
      } },
    { id: "pa3-muldiv", title: "Multiply and divide integers", lesson: 5,
      gen: function (R) {
        var a = R.int(2, 9) * R.pick([1, -1]), b = R.int(2, 9) * (a > 0 ? -1 : R.pick([1, -1])), div = R.chance(0.5);
        var tex = div ? a * b + " \\div " + par(b) : a + " \\cdot " + par(b), ans = div ? a : a * b;
        var same = div ? a > 0 : a * b > 0;
        return { type: "num", prompt: (div ? "Divide" : "Multiply") + ". $$" + tex + "$$", answer: ans,
          near: [{ v: -ans, fb: same ? "Same signs give a positive answer." : "Different signs give a negative answer." }],
          hints: ["Work with the absolute values, then decide the sign."], why: "$" + tex + " = " + ans + "$: " + (same ? "same signs, positive." : "different signs, negative.") };
      } },
    { id: "pa3-solve", title: "Solve equations with integers", lesson: 6,
      gen: function (R) {
        var v = R.pick(["x", "n", "y", "a"]), kind = R.int(0, 2), x0 = R.int(2, 12) * R.pick([1, -1]), k = R.int(2, 9), eq, how, slip;
        if (kind === 0) { k *= R.pick([1, -1]); eq = k + v + " = " + k * x0; how = "Divide both sides by $" + k + "$."; slip = { v: -x0, fb: "Check the sign: " + (k * x0 > 0 === k > 0 ? "same signs give a positive quotient." : "different signs give a negative quotient.") }; }
        else if (kind === 1) { eq = v + " + " + k + " = " + (x0 + k); how = "Subtract " + k + " from both sides."; slip = { v: x0 + 2 * k, fb: k + " is added, so subtract " + k + " from both sides." }; }
        else { eq = v + " - " + k + " = " + (x0 - k); how = "Add " + k + " to both sides."; slip = { v: x0 - 2 * k, fb: k + " is subtracted, so add " + k + " to both sides." }; }
        return { type: "num", prompt: "Solve. $$" + eq + "$$", pre: "$" + v + " =$", answer: x0, near: near(x0, [slip]),
          hints: [how], why: how + " $" + v + " = " + x0 + "$." };
      } }
  ];
  L.unit("prealg", 3, {
    title: "Integers",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Opposites, absolute value, and adding and subtracting integers.",
        skills: ["pa3-absolute", "pa3-add", "pa3-subtract"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Multiplying and dividing integers, and equations with integers.",
        skills: ["pa3-muldiv", "pa3-solve"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:3", {
    2: { name: "Integers", frame: "The [[opposite]] of a number is the same distance from 0 on the other side. That distance is its [[absolute value]], which is never [[negative]]. The whole numbers and their opposites are the [[integers]].",
         chips: ["positive", "factor"] },
    3: { name: "Adding integers", frame: "Same signs: [[add]] the absolute values and keep the sign. Different signs: [[subtract]] them, and take the sign of the number with the [[larger]] absolute value.",
         chips: ["smaller", "multiply"] },
    4: { name: "Subtracting integers", frame: "Subtracting a number is the same as adding its [[opposite]]: $a - b = a + (-b)$. So subtracting a negative is the same as adding a [[positive]].",
         chips: ["negative", "absolute value"] },
    5: { name: "Multiplying and dividing integers", frame: "When the signs are the [[same]], a product or quotient is [[positive]]. When the signs are [[different]], it is [[negative]].",
         chips: ["zero", "larger"] },
    6: { name: "Division Property of Equality", frame: "Dividing [[both]] sides of an equation by the same non-zero number keeps it true. It undoes a [[multiplication]]. Then [[check]] the answer in the original equation.",
         chips: ["one", "subtraction"] }
  });
})();
