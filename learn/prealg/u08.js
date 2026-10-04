/* ==========================================================================
   Prealgebra — Unit 8: Solving Linear Equations. See lab/core.js for the
   format.

   Follows OpenStax Prealgebra 2e, Chapter 8, section for section: the
   readiness check, then 8.1 to 8.4. Each lesson teaches the book's own steps:
   the method, a worked example to watch, one done together, then on your own,
   a harder case, find the error, use it, and the concept built at the end.

   Equations that must be simplified first (8.1–8.2), variables and constants
   on both sides and the general strategy (8.3), and clearing fractions and
   decimals (8.4).

   Adapted from OpenStax, Prealgebra 2e (Rice University), CC BY-NC-SA 4.0.
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
    blurb: "Book: Chapter 8 Be Prepared · One-step equations, simplifying expressions, and the least common denominator.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · One-step equations", prompt: "Solve $n - 12 = 16$.", pre: "$n =$", answer: 28, skill: "Solve an equation",
        near: [{ v: 4, fb: "12 is subtracted, so add 12 to both sides." }], hints: ["Add 12 to both sides."], why: "$16 + 12 = 28$." },
      { type: "num", prompt: "Solve $-7x = 56$.", pre: "$x =$", answer: -8, skill: "Division Property",
        near: [{ v: 8, fb: "Different signs give a negative quotient." }, { v: 63, fb: "$-7$ multiplies $x$: divide both sides by $-7$." }], hints: ["Divide both sides by $-7$."], why: "$56 \\div (-7) = -8$." },
      { type: "choice", kicker: "Check 2 · Simplifying", prompt: "Simplify $9x - 5 - 8x - 6$.",
        options: [{ t: "$x - 11$" }, { t: "$x - 1$", fb: "$-5 - 6 = -11$." }, { t: "$17x - 11$", fb: "$9x - 8x = x$." }],
        answer: 0, skill: "Combine like terms", hints: ["$9x - 8x$, and $-5 - 6$."], why: "$x - 11$." },
      { type: "choice", prompt: "Simplify $4(x - 3) + 2x$.",
        options: [{ t: "$6x - 12$" }, { t: "$6x - 3$", fb: "The 4 multiplies the 3 as well." }, { t: "$4x - 10$", fb: "$4x + 2x = 6x$, and $4 \\cdot 3 = 12$." }],
        answer: 0, skill: "Distributive property", hints: ["$4x - 12 + 2x$."], why: "$4x - 12 + 2x = 6x - 12$." },
      { type: "num", kicker: "Check 3 · Fractions and decimals", prompt: "Find the least common denominator of $\\frac{1}{6}$ and $\\frac{3}{8}$.", answer: 24, skill: "Least common denominator",
        near: [{ v: 48, fb: "A common denominator, but a smaller one exists." }, { v: 2, fb: "That is the greatest common factor." }], hints: ["Multiples of 8: 8, 16, 24."], why: "$24 = 6 \\cdot 4 = 8 \\cdot 3$." },
      { type: "num", prompt: "Multiply $100(0.15)$.", answer: 15, skill: "Powers of 10",
        near: [{ v: 1.5, tol: 1e-9, fb: "100 has two zeros: move the point two places." }], hints: ["Two places to the right."], why: "$0.15 \\to 1.5 \\to 15$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 8.1**. If **check 1** slipped, see lesson 3.5. If **check 2** slipped, see lesson 7.3. If **check 3** slipped, see lessons 4.5 and 5.2.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* =================== 8.1 · The Subtraction and Addition Properties of Equality */
  var HOW_8_1 = [["Simplify", "Simplify each side: remove parentheses and combine like terms."],
                 ["Isolate", "Undo what is added to or subtracted from the variable, on both sides."],
                 ["Check", "Substitute the answer into the original equation."]];
  LESSONS.push({
    title: "Subtraction and addition properties",
    blurb: "Book 8.1 · Equations that must be simplified before the variable can be isolated, and applications.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $x + 11 = -3$.", pre: "$x =$", answer: -14, skill: "Subtraction Property",
        near: [{ v: 8, fb: "11 is added, so subtract 11 from both sides." }, { v: 14, fb: "$-3 - 11$ is negative." }], hints: ["Subtract 11 from both sides."], why: "$-3 - 11 = -14$." },
      { type: "learn", kicker: "The idea",
        prompt: "You have used these properties with whole numbers, integers, fractions and decimals. One thing is new here: some equations have to be **simplified** before the variable can be isolated.",
        scene: { type: "method", how: HOW_8_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$9x - 5 - 8x - 6 = 7$$",
        scene: { type: "walk", how: HOW_8_1, rows: [
          { step: 1, m: "9x - 5 - 8x - 6 = 7", say: "The left side has like terms to combine." },
          { step: 1, m: "x - 11 = 7", say: "$9x - 8x = x$, and $-5 - 6 = -11$.",
            ask: { prompt: "What is $9x - 8x$?", answer: 0,
                   options: [{ t: "$x$" }, { t: "$17x$", fb: "The $8x$ is subtracted: $9 - 8 = 1$." }] } },
          { step: 2, m: "x - 11 + 11 = 7 + 11", say: "Add 11 to both sides." },
          { step: 2, m: "x = 18", say: "The variable is alone." },
          { step: 3, m: "9(18) - 5 - 8(18) - 6 = 7", say: "$162 - 5 - 144 - 6 = 7$. True." }] },
        gate: true, then: "Simplify first. The equation that is left is one you already know how to solve." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $5(n - 4) - 4n = -8$.",
        how: HOW_8_1, skill: "Simplify, then solve",
        steps: [
          { step: 1, ask: "Distribute, then combine like terms. What does the left side become?", type: "choice", answer: 0,
            options: [{ t: "$n - 20$" }, { t: "$n - 4$", fb: "The 5 multiplies the 4 as well." }, { t: "$9n - 20$", fb: "$5n - 4n = n$." }],
            m: "n - 20 = -8", say: "$5n - 20 - 4n = n - 20$." },
          { step: 2, ask: "20 is subtracted. Add 20 to both sides: what is $-8 + 20$?", type: "num", answer: 12, near: [{ v: -28, fb: "Add 20. Do not subtract it." }], hint: "$20 - 8$.",
            m: "n = 12", say: "Add 20 to both sides." },
          { step: 3, ask: "Check: what is $5(12 - 4) - 4(12)$?", type: "num", answer: -8, near: [{ v: 8, fb: "$40 - 48$ is negative." }], hint: "$5(8) - 48$.",
            m: "5(8) - 48 = -8", say: "It matches the right side." }],
        why: "Simplify, isolate, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $a - 2.75 = -1.5$.", pre: "$a =$", answer: 1.25, tol: 1e-9, skill: "Addition Property",
        near: [{ v: -4.25, tol: 1e-9, fb: "$2.75$ is subtracted, so add it to both sides." }, { v: -1.25, tol: 1e-9, fb: "$-1.5 + 2.75$ is positive." }],
        hints: ["Add $2.75$ to both sides."], why: "$-1.5 + 2.75 = 1.25$." },
      { type: "num", prompt: "Solve $3(2x - 1) - 5x = 9$.", pre: "$x =$", answer: 12, skill: "Simplify, then solve",
        near: [{ v: 10, fb: "The 3 multiplies the 1 as well: $6x - 3 - 5x$." }, { v: 6, fb: "$-3$ is on the left: add 3 to both sides." }],
        hints: ["$6x - 3 - 5x = 9$, so $x - 3 = 9$."], why: "$x - 3 = 9$, so $x = 12$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An application. Two parcels weigh $13.4$ pounds together. One weighs $5.9$ pounds. How much does the other weigh?",
        scene: { type: "walk", how: [["Name", "Choose a variable for what you are looking for."],
                                    ["Translate", "Write the sentence as an equation."],
                                    ["Solve", "Solve, check, and answer the question."]], rows: [
          { step: 1, m: "p = \\text{the other parcel's weight}", say: "Name the unknown." },
          { step: 2, m: "p + 5.9 = 13.4", say: "The two weights together make $13.4$." },
          { step: 3, m: "p = 13.4 - 5.9", say: "Subtract $5.9$ from both sides." },
          { step: 3, m: "p = 7.5", say: "Check: $7.5 + 5.9 = 13.4$. The other parcel weighs $7.5$ pounds." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Translate and solve: “Eleven more than $x$ is equal to 54.”", pre: "$x =$", answer: 43, skill: "Translate and solve",
        near: [{ v: 65, fb: "The equation is $x + 11 = 54$. Subtract 11 from both sides." }],
        hints: ["$x + 11 = 54$."], why: "$54 - 11 = 43$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["x - 9 = -4", "x = -4 - 9", "x = -13"], answer: 1, fix: "x = -4 + 9",
        fb: { 0: GIVEN, 2: LATER }, skill: "Addition Property",
        hints: ["9 is subtracted. What undoes that?"],
        why: "Add 9 to both sides: $x = 5$." },
      { type: "num", kicker: "Use it", prompt: "After paying \\$37.50 for a ticket, Lena has \\$46 left, so $m - 37.5 = 46$. How much did she have at first?",
        pre: "$m =$", post: "dollars", answer: 83.5, tol: 1e-9, skill: "Addition Property",
        near: [{ v: 8.5, tol: 1e-9, fb: "$37.5$ is subtracted, so add it to both sides." }],
        hints: ["Add $37.5$ to both sides."], why: "$46 + 37.5 = 83.5$." }
    ]
  });

  /* ================= 8.2 · The Division and Multiplication Properties of Equality */
  var HOW_8_2 = [["Simplify", "Simplify each side: remove parentheses and combine like terms."],
                 ["Isolate", "Divide both sides by the coefficient, or multiply by its reciprocal."],
                 ["Check", "Substitute the answer into the original equation."]];
  LESSONS.push({
    title: "Division and multiplication properties",
    blurb: "Book 8.2 · Dividing or multiplying both sides, the equation −x = a, and simplifying first.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $-6x = 54$.", pre: "$x =$", answer: -9, skill: "Division Property",
        near: [{ v: 9, fb: "Different signs give a negative quotient." }, { v: 60, fb: "$-6$ multiplies $x$: divide both sides by $-6$." }], hints: ["Divide both sides by $-6$."], why: "$54 \\div (-6) = -9$." },
      { type: "learn", kicker: "The idea",
        prompt: "When the variable is multiplied by a number, divide both sides by it. When it is divided, multiply. A fraction coefficient is cleared by its reciprocal. And $-x$ means $-1 \\cdot x$, so divide by $-1$.",
        scene: { type: "method", how: HOW_8_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$7x + 6x - 4x = -8 + 26$$",
        scene: { type: "walk", how: HOW_8_2, rows: [
          { step: 1, m: "7x + 6x - 4x = -8 + 26", say: "Both sides can be simplified." },
          { step: 1, m: "9x = 18", say: "$7 + 6 - 4 = 9$, and $-8 + 26 = 18$.",
            ask: { prompt: "What is $7x + 6x - 4x$?", answer: 0,
                   options: [{ t: "$9x$" }, { t: "$17x$", fb: "The $4x$ is subtracted: $7 + 6 - 4$." }] } },
          { step: 2, m: "\\frac{9x}{9} = \\frac{18}{9}", say: "Divide both sides by 9." },
          { step: 2, m: "x = 2", say: "The coefficient is now 1." },
          { step: 3, m: "7(2) + 6(2) - 4(2) = 18", say: "$14 + 12 - 8 = 18$. True." }] },
        gate: true, then: "Combine like terms on each side before you divide." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $11 - 20 = 17y - 8y - 6y$.",
        how: HOW_8_2, skill: "Simplify, then solve",
        steps: [
          { step: 1, ask: "Simplify both sides. Which equation do you get?", type: "choice", answer: 0,
            options: [{ t: "$-9 = 3y$" }, { t: "$9 = 3y$", fb: "$11 - 20$ is negative." }, { t: "$-9 = 31y$", fb: "The $8y$ and $6y$ are subtracted: $17 - 8 - 6$." }],
            m: "-9 = 3y", say: "$11 - 20 = -9$, and $17 - 8 - 6 = 3$." },
          { step: 2, ask: "Divide both sides by 3. What is $y$?", type: "num", answer: -3, near: [{ v: 3, fb: "Different signs give a negative quotient." }], hint: "$-9 \\div 3$.",
            m: "y = -3", say: "The variable may end up on the right. That is fine." },
          { step: 3, ask: "Check the right side: what is $17(-3) - 8(-3) - 6(-3)$?", type: "num", answer: -9, near: [{ v: -93, fb: "Subtracting a negative adds: $-51 + 24 + 18$." }], hint: "$-51 + 24 + 18$.",
            m: "-51 + 24 + 18 = -9", say: "It matches the left side." }],
        why: "Simplify, isolate, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $-n = -23$.", pre: "$n =$", answer: 23, skill: "The equation −x = a",
        near: [{ v: -23, fb: "$-n$ means $-1 \\cdot n$. Divide both sides by $-1$." }],
        hints: ["Divide both sides by $-1$."], why: "$-23 \\div (-1) = 23$." },
      { type: "num", prompt: "Solve $-3(n - 2) - 6 = 21$.", pre: "$n =$", answer: -7, skill: "Simplify, then solve",
        near: [{ v: 7, fb: "Different signs give a negative quotient." }, { v: -9, fb: "$-3 \\cdot (-2) = +6$, which cancels the $-6$." }],
        hints: ["$-3n + 6 - 6 = 21$, so $-3n = 21$."], why: "$-3n = 21$, so $n = -7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Fraction coefficients combine like any others. $$\\frac{5}{6}y - \\frac{1}{6}y = -12$$",
        scene: { type: "walk", how: HOW_8_2, rows: [
          { step: 1, m: "\\frac{5}{6}y - \\frac{1}{6}y = -12", say: "Like terms, with a common denominator." },
          { step: 1, m: "\\frac{2}{3}y = -12", say: "$\\frac{5}{6} - \\frac{1}{6} = \\frac{4}{6} = \\frac{2}{3}$." },
          { step: 2, m: "\\frac{3}{2} \\cdot \\frac{2}{3}y = \\frac{3}{2}(-12)", say: "Multiply both sides by the reciprocal." },
          { step: 2, m: "y = -18", say: "$-12 \\div 2 = -6$, and $-6 \\cdot 3 = -18$." },
          { step: 3, m: "\\frac{2}{3}(-18) = -12", say: "True." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Solve $0.25p = 3.5$.", pre: "$p =$", answer: 14, skill: "Division Property",
        near: [{ v: 0.875, tol: 1e-9, fb: "$0.25$ multiplies $p$: divide both sides by $0.25$." }, { v: 1.4, tol: 1e-9, fb: "$3.5 \\div 0.25$ is $350 \\div 25$." }],
        hints: ["$350 \\div 25$."], why: "$3.5 \\div 0.25 = 14$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["3x - 4x = 9", "-x = 9", "x = 9"], answer: 2, fix: "x = -9",
        fb: { 0: GIVEN, 1: "This is right: $3x - 4x = -x$." }, skill: "The equation −x = a",
        hints: ["What does $-x$ mean?"],
        why: "$-x = 9$ means $-1 \\cdot x = 9$. Divide by $-1$: $x = -9$." },
      { type: "num", kicker: "Use it", prompt: "Four friends split a bill equally and each pays \\$13.25, so $\\frac{b}{4} = 13.25$. How much was the bill?",
        pre: "$b =$", post: "dollars", answer: 53, skill: "Multiplication Property",
        near: [{ v: 3.3125, tol: 1e-6, fb: "$b$ is divided by 4, so multiply both sides by 4." }],
        hints: ["Multiply both sides by 4."], why: "$4 \\cdot 13.25 = 53$." }
    ]
  });
  /* =============== 8.3 · Equations with variables and constants on both sides */
  var HOW_8_3 = [["Simplify", "Simplify each side: remove parentheses and combine like terms."],
                 ["Variables", "Collect the variable terms on one side."],
                 ["Constants", "Collect the constants on the other side."],
                 ["Coefficient", "Make the coefficient of the variable 1: divide or multiply."],
                 ["Check", "Substitute the answer into the original equation."]];
  LESSONS.push({
    title: "Variables and constants on both sides",
    blurb: "Book 8.3 · Collecting variables on one side and constants on the other, and the general strategy.",
    mins: 13, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Solve $7x + 8 = -13$.", pre: "$x =$", answer: -3, skill: "Constants on both sides",
        near: [{ v: 3, fb: "$-21 \\div 7$ is negative." }, { v: -5 / 7, tol: 1e-6, fb: "Subtract 8 from both sides: $-13 - 8 = -21$." }], hints: ["$7x = -21$."], why: "$7x = -21$, so $x = -3$." },
      { type: "learn", kicker: "Explore", prompt: "Now the unknown is on **both** pans: $5x + 2 = 3x + 8$. Take the same thing from each side until one box is alone.",
        scene: { type: "balance", L: { x: 5, c: 2 }, R: { x: 3, c: 8 }, x: 3, gate: "solve" }, gate: true,
        after: "Taking boxes from both sides keeps the balance level, just as taking units does." },
      { type: "learn", kicker: "The idea",
        prompt: "When the variable is on both sides, choose one side to be the variable side. Move every variable term there and every constant to the other side, always by doing the same thing to both sides.",
        scene: { type: "method", how: HOW_8_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$8x - 5 = 5x + 13$$",
        scene: { type: "walk", how: HOW_8_3, rows: [
          { step: 1, m: "8x - 5 = 5x + 13", say: "Each side is already simplified." },
          { step: 2, m: "3x - 5 = 13", say: "Subtract $5x$ from both sides.",
            ask: { prompt: "To remove $5x$ from the right side, what do you do to both sides?", answer: 0,
                   options: [{ t: "Subtract $5x$" }, { t: "Add $5x$", fb: "That would leave $10x$ on the right. Do the opposite." }] } },
          { step: 3, m: "3x = 18", say: "Add 5 to both sides." },
          { step: 4, m: "x = 6", say: "Divide both sides by 3." },
          { step: 5, m: "8(6) - 5 = 5(6) + 13", say: "Both sides are 43. True." }] },
        gate: true, then: "Variables to one side, constants to the other, then the coefficient." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $3(x + 2) = x - 8$.",
        how: HOW_8_3, skill: "General strategy",
        steps: [
          { step: 1, ask: "Distribute the 3. What is the left side?", type: "choice", answer: 0,
            options: [{ t: "$3x + 6$" }, { t: "$3x + 2$", fb: "The 3 multiplies the 2 as well." }],
            m: "3x + 6 = x - 8", say: "Parentheses removed." },
          { step: 2, ask: "Subtract $x$ from both sides. What is $3x - x$?", type: "choice", answer: 0,
            options: [{ t: "$2x$" }, { t: "$3$", fb: "$3x - x$ is $3x - 1x$: like terms." }, { t: "$4x$", fb: "The $x$ is subtracted." }],
            m: "2x + 6 = -8", say: "The variable is now on the left only." },
          { step: 3, ask: "Subtract 6 from both sides. What is $-8 - 6$?", type: "num", answer: -14, near: [{ v: -2, fb: "Subtract 6: $-8 + (-6)$." }], hint: "$-8 + (-6)$.",
            m: "2x = -14", say: "The constants are now on the right only." },
          { step: 4, ask: "Divide both sides by 2. What is $x$?", type: "num", answer: -7, near: [{ v: 7, fb: "Different signs give a negative quotient." }], hint: "$-14 \\div 2$.",
            m: "x = -7", say: "The coefficient is 1." },
          { step: 5, ask: "Check the left side: what is $3(-7 + 2)$?", type: "num", answer: -15, near: [{ v: -19, fb: "Parentheses first: $-7 + 2 = -5$." }], hint: "$3(-5)$.",
            m: "3(-5) = -7 - 8", say: "Both sides are $-15$." }],
        why: "Simplify, variables, constants, coefficient, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $5y - 9 = 8y$.", pre: "$y =$", answer: -3, skill: "Variables on both sides",
        near: [{ v: 3, fb: "$-9 = 3y$: different signs give a negative quotient." }, { v: -9 / 13, tol: 1e-6, fb: "Subtract $5y$ from both sides: $-9 = 3y$." }],
        hints: ["Subtract $5y$ from both sides."], why: "$-9 = 3y$, so $y = -3$." },
      { type: "num", prompt: "Solve $7a - 3 = 13a + 9$.", pre: "$a =$", answer: -2, skill: "Variables on both sides",
        near: [{ v: 2, fb: "$-12 = 6a$: different signs give a negative quotient." }, { v: 1, fb: "Subtract 9 from both sides: $-3 - 9 = -12$." }],
        hints: ["Subtract $7a$ and subtract 9: $-12 = 6a$."], why: "$-12 = 6a$, so $a = -2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Parentheses on both sides: the whole strategy, in order. $$3(2x - 5) - 4 = 2(x + 4) + 1$$",
        scene: { type: "walk", how: HOW_8_3, rows: [
          { step: 1, m: "3(2x - 5) - 4 = 2(x + 4) + 1", say: "Simplify each side first." },
          { step: 1, m: "6x - 19 = 2x + 9", say: "Distribute, then combine: $-15 - 4 = -19$ and $8 + 1 = 9$." },
          { step: 2, m: "4x - 19 = 9", say: "Subtract $2x$ from both sides." },
          { step: 3, m: "4x = 28", say: "Add 19 to both sides." },
          { step: 4, m: "x = 7", say: "Divide both sides by 4." },
          { step: 5, m: "3(9) - 4 = 2(11) + 1", say: "Both sides are 23. True." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Solve $2(n - 6) = 5n + 9$.", pre: "$n =$", answer: -7, skill: "General strategy",
        near: [{ v: 7, fb: "$-21 = 3n$: different signs give a negative quotient." }, { v: -5, fb: "The 2 multiplies the 6 as well: $2n - 12$." }],
        hints: ["$2n - 12 = 5n + 9$, so $-21 = 3n$."], why: "$-21 = 3n$, so $n = -7$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["6x + 4 = 2x + 20", "8x + 4 = 20", "8x = 16", "x = 2"], answer: 1, fix: "4x + 4 = 20",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Variables on both sides",
        hints: ["How is $2x$ removed from the right side?"],
        why: "Subtract $2x$ from both sides: $4x + 4 = 20$, so $x = 4$." },
      { type: "num", kicker: "Use it", prompt: "One gym costs \\$24 a month plus \\$5 a visit. Another costs \\$8 a visit with no monthly fee. For how many visits $v$ do they cost the same? Solve $24 + 5v = 8v$.",
        pre: "$v =$", post: "visits", answer: 8, skill: "Variables on both sides",
        near: [{ v: 24 / 13, tol: 1e-6, fb: "Subtract $5v$ from both sides: $24 = 3v$." }],
        hints: ["$24 = 3v$."], why: "$24 = 3v$, so $v = 8$." }
    ]
  });

  /* ================== 8.4 · Equations with fraction or decimal coefficients */
  var HOW_8_4 = [["LCD", "Find the least common denominator of all the fractions in the equation."],
                 ["Clear", "Multiply both sides by the LCD. Every term gets multiplied."],
                 ["Solve", "Solve the equation that is left, and check."]];
  LESSONS.push({
    title: "Fraction or decimal coefficients",
    blurb: "Book 8.4 · Clearing fractions with the least common denominator, and clearing decimals with a power of ten.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Multiply $12 \\cdot \\frac{5}{6}$.", answer: 10, skill: "Multiply fractions",
        near: [{ v: 72 / 5, tol: 1e-9, fb: "Multiply by $\\frac{5}{6}$, not by its reciprocal." }], hints: ["$12 \\div 6 = 2$, then $2 \\cdot 5$."], why: "$\\frac{12 \\cdot 5}{6} = 10$." },
      { type: "learn", kicker: "The idea",
        prompt: "Fractions in an equation can be cleared at the very start. Multiply **both sides** by the LCD of all the fractions. Every denominator divides the LCD, so every fraction becomes a whole number.",
        scene: { type: "method", how: HOW_8_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$\\frac{1}{8}x + \\frac{1}{2} = \\frac{1}{4}$$",
        scene: { type: "walk", how: HOW_8_4, rows: [
          { step: 1, m: "\\frac{1}{8}x + \\frac{1}{2} = \\frac{1}{4}", say: "Denominators 8, 2 and 4." },
          { step: 1, m: "\\text{LCD} = 8", say: "8 is the least number that 8, 2 and 4 all divide." },
          { step: 2, m: "8 \\cdot \\frac{1}{8}x + 8 \\cdot \\frac{1}{2} = 8 \\cdot \\frac{1}{4}", say: "Multiply every term by 8.",
            ask: { prompt: "What is $8 \\cdot \\frac{1}{2}$?", answer: 0,
                   options: [{ t: "4" }, { t: "16", fb: "That is $8 \\cdot 2$. Half of 8 is 4." }] } },
          { step: 2, m: "x + 4 = 2", say: "No fractions are left." },
          { step: 3, m: "x = -2", say: "Subtract 4. Check: $-\\frac{2}{8} + \\frac{1}{2} = \\frac{1}{4}$." }] },
        gate: true, then: "Multiply every term, on both sides, the whole numbers too." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $\\frac{x}{3} + \\frac{1}{2} = \\frac{5}{6}$.",
        how: HOW_8_4, skill: "Clear the fractions",
        steps: [
          { step: 1, ask: "Find the LCD of 3, 2 and 6.", type: "num", answer: 6, near: [{ v: 36, fb: "A common denominator, but a smaller one exists." }, { v: 12, fb: "A common denominator, but a smaller one exists." }], hint: "6 is a multiple of both 3 and 2.",
            m: "\\text{LCD} = 6", say: "6 is divisible by 3, 2 and 6." },
          { step: 2, ask: "Multiply every term by 6. What is $6 \\cdot \\frac{x}{3}$?", type: "choice", answer: 0,
            options: [{ t: "$2x$" }, { t: "$3x$", fb: "$6 \\div 3 = 2$." }, { t: "$18x$", fb: "The 3 is a denominator: divide by it." }],
            m: "2x + 3 = 5", say: "$6 \\cdot \\frac{1}{2} = 3$ and $6 \\cdot \\frac{5}{6} = 5$." },
          { step: 3, ask: "Solve $2x + 3 = 5$.", type: "num", answer: 1, near: [{ v: 4, fb: "Subtract 3 first, then divide by 2." }], hint: "$2x = 2$.",
            m: "x = 1", say: "$2x = 2$, so $x = 1$." }],
        why: "LCD, clear, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $\\frac{1}{2}y - \\frac{1}{3} = \\frac{7}{6}$.", pre: "$y =$", answer: 3, skill: "Clear the fractions",
        near: [{ v: 5 / 3, tol: 1e-6, fb: "Add $\\frac{1}{3}$ to both sides, or clear with 6: $3y - 2 = 7$." }],
        hints: ["Multiply every term by 6: $3y - 2 = 7$."], why: "$3y = 9$, so $y = 3$." },
      { type: "num", prompt: "Solve $7 = \\frac{1}{2}x + \\frac{3}{4}x - \\frac{2}{3}x$.", pre: "$x =$", answer: 12, skill: "Clear the fractions",
        near: [{ v: 7, fb: "Multiply every term by 12, the 7 as well: $84 = 7x$." }],
        hints: ["LCD 12: $84 = 6x + 9x - 8x$."], why: "$84 = 7x$, so $x = 12$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Decimals are fractions with denominators 10, 100, …, so a power of 10 clears them. $$0.06x + 0.02 = 0.25x - 1.5$$",
        scene: { type: "walk", how: [["Count", "Find the greatest number of decimal places in the equation."],
                                    ["Clear", "Multiply both sides by that power of 10. Every term gets multiplied."],
                                    ["Solve", "Solve the equation that is left, and check."]], rows: [
          { step: 1, m: "0.06x + 0.02 = 0.25x - 1.5", say: "Two decimal places at most, so multiply by 100." },
          { step: 2, m: "100(0.06x + 0.02) = 100(0.25x - 1.5)", say: "Both sides, every term." },
          { step: 2, m: "6x + 2 = 25x - 150", say: "Each point moves two places." },
          { step: 3, m: "152 = 19x", say: "Subtract $6x$ and add 150." },
          { step: 3, m: "x = 8", say: "$152 \\div 19 = 8$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Solve $0.4x + 0.6 = 0.5x - 1.2$.", pre: "$x =$", answer: 18, skill: "Clear the decimals",
        near: [{ v: -18, fb: "$6 + 12 = 18$, and $5x - 4x = x$." }, { v: 1.8, tol: 1e-9, fb: "After multiplying by 10 the equation is $4x + 6 = 5x - 12$." }],
        hints: ["Multiply every term by 10: $4x + 6 = 5x - 12$."], why: "$18 = x$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{1}{2}x + 3 = \\frac{1}{4}", "2x + 3 = 1", "2x = -2", "x = -1"], answer: 1, fix: "2x + 12 = 1",
        fb: { 0: GIVEN, 2: LATER, 3: LATER }, skill: "Clear the fractions",
        hints: ["Was every term multiplied by 4?"],
        why: "The 3 is multiplied by 4 as well: $2x + 12 = 1$, so $x = -\\frac{11}{2}$." },
      { type: "num", kicker: "Use it", prompt: "A taxi charges \\$2.50 plus \\$0.75 per mile, and a ride costs \\$10. Solve $2.5 + 0.75m = 10$ for the miles.",
        pre: "$m =$", post: "miles", answer: 10, skill: "Clear the decimals",
        near: [{ v: 16.6667, tol: 1e-3, fb: "Subtract $2.5$ from both sides before dividing." }],
        hints: ["$0.75m = 7.5$."], why: "$7.5 \\div 0.75 = 10$." }
    ]
  });
  /* ================================================================ Skills */
  function vr(R) { return R.pick(["x", "n", "y", "a"]); }
  var SKILLS = [
    { id: "pa8-addsub", title: "Simplify, then add or subtract", lesson: 2,
      gen: function (R) {
        var v = vr(R), x0 = R.int(2, 15) * R.pick([1, -1]), a = R.int(3, 9), c = R.int(1, 9), d = R.int(1, 9), eq, hint;
        if (R.chance(0.5)) { eq = a + v + " - " + c + " - " + (a - 1) + v + " - " + d + " = " + (x0 - c - d); hint = "Combine like terms: $" + v + " - " + (c + d) + " = " + (x0 - c - d) + "$."; }
        else { eq = a + "(" + v + " - " + c + ") - " + (a - 1) + v + " = " + (x0 - a * c); hint = "Distribute and combine: $" + v + " - " + a * c + " = " + (x0 - a * c) + "$."; }
        return { type: "num", prompt: "Solve. $$" + eq + "$$", pre: "$" + v + " =$", answer: x0,
          near: near(x0, [{ v: -x0, fb: "Check the signs when you add to both sides." }]), hints: [hint], why: hint + " So $" + v + " = " + x0 + "$." };
      } },
    { id: "pa8-muldiv", title: "Simplify, then divide or multiply", lesson: 3,
      gen: function (R) {
        var v = vr(R), x0 = R.int(2, 12) * R.pick([1, -1]), kind = R.int(0, 2), eq, hint, ans = x0;
        if (kind === 0) { var a = R.int(4, 9), b = R.int(2, 8), c = R.int(1, a + b - 2), k = a + b - c; eq = a + v + " + " + b + v + " - " + c + v + " = " + k * x0; hint = "Combine like terms: $" + k + v + " = " + k * x0 + "$."; }
        else if (kind === 1) { eq = "-" + v + " = " + (-x0); hint = "$-" + v + "$ means $-1 \\cdot " + v + "$. Divide both sides by $-1$."; }
        else { var F = R.pick([[2, 3], [3, 4], [2, 5], [3, 5], [5, 6]]), t = R.int(1, 6) * R.pick([1, -1]); ans = F[1] * t; eq = "\\frac{" + F[0] + "}{" + F[1] + "}" + v + " = " + F[0] * t; hint = "Multiply both sides by the reciprocal, $\\frac{" + F[1] + "}{" + F[0] + "}$."; }
        return { type: "num", prompt: "Solve. $$" + eq + "$$", pre: "$" + v + " =$", answer: ans,
          near: near(ans, [{ v: -ans, fb: "Check the sign of the quotient." }]), hints: [hint], why: hint + " So $" + v + " = " + ans + "$." };
      } },
    { id: "pa8-both", title: "Variables and constants on both sides", lesson: 4,
      gen: function (R) {
        var v = vr(R), x0 = R.int(1, 9) * R.pick([1, -1]), c = R.int(2, 6), a = c + R.int(2, 6), b = R.int(1, 12) * R.pick([1, -1]), d = (a - c) * x0 + b;
        var eq = poly([[a, v], [b, ""]]) + " = " + poly([[c, v], [d, ""]]);
        return { type: "num", prompt: "Solve. $$" + eq + "$$", pre: "$" + v + " =$", answer: x0,
          near: near(x0, [{ v: -x0, fb: "Check the signs as you move terms across." }, { v: (d - b) / (a + c), tol: 1e-6, fb: "Subtract $" + c + v + "$ from both sides. Do not add it." }]),
          hints: ["Subtract $" + c + v + "$ from both sides: $" + poly([[a - c, v], [b, ""]]) + " = " + d + "$."], why: "$" + (a - c) + v + " = " + (d - b) + "$, so $" + v + " = " + x0 + "$." };
      } },
    { id: "pa8-general", title: "Use the general strategy", lesson: 4,
      gen: function (R) {
        var v = vr(R), x0 = R.int(1, 8) * R.pick([1, -1]), a = R.int(2, 6), b = R.int(1, 6) * R.pick([1, -1]), c = R.pick([1, 2, 3, 4, 5, 6, 7].filter(function (k) { return k !== a; })), d = (a - c) * x0 + a * b;
        var eq = a + "(" + poly([[1, v], [b, ""]]) + ") = " + poly([[c, v], [d, ""]]);
        return { type: "num", prompt: "Solve. $$" + eq + "$$", pre: "$" + v + " =$", answer: x0,
          near: near(x0, [{ v: (d - b) / (a - c), tol: 1e-6, fb: "The " + a + " multiplies **both** terms inside the parentheses." }, { v: -x0, fb: "Check the signs as you move terms across." }]),
          hints: ["Distribute first: $" + poly([[a, v], [a * b, ""]]) + " = " + poly([[c, v], [d, ""]]) + "$."], why: "$" + poly([[a - c, v], [0, ""]]) + " = " + (d - a * b) + "$, so $" + v + " = " + x0 + "$." };
      } },
    { id: "pa8-clear", title: "Clear fractions or decimals", lesson: 5,
      gen: function (R) {
        var v = vr(R);
        if (R.chance(0.5)) {
          var P = R.pick([[2, 3], [2, 4], [3, 2], [3, 4], [4, 2], [2, 6], [3, 6], [4, 3]]), p = P[0], q = P[1], lcd = p * q / L.gcd(p, q), x0 = R.int(1, 6), N = lcd / p * x0 + lcd / q;
          return { type: "num", prompt: "Solve. $$\\frac{" + v + "}{" + p + "} + \\frac{1}{" + q + "} = " + frac(N, lcd) + "$$", pre: "$" + v + " =$", answer: x0,
            near: near(x0, [{ v: N - lcd / q, fb: "After clearing, the coefficient of $" + v + "$ is " + lcd / p + ". Divide by it." }]),
            hints: ["Multiply every term by " + lcd + ": $" + poly([[lcd / p, v], [lcd / q, ""]]) + " = " + N + "$."], why: "$" + poly([[lcd / p, v], [0, ""]]) + " = " + (N - lcd / q) + "$, so $" + v + " = " + x0 + "$." };
        }
        var c = R.int(2, 5), a = c + R.int(1, 4), b = R.int(1, 9), x1 = R.int(2, 12), D = (a - c) * x1 + b;
        var eq = num(a / 10) + v + " + " + num(b / 10) + " = " + num(c / 10) + v + " + " + num(D / 10);
        return { type: "num", prompt: "Solve. $$" + eq + "$$", pre: "$" + v + " =$", answer: x1,
          near: near(x1, [{ v: x1 / 10, tol: 1e-9, fb: "After multiplying every term by 10, the equation has whole numbers only." }]),
          hints: ["Multiply every term by 10: $" + a + v + " + " + b + " = " + c + v + " + " + D + "$."], why: "$" + (a - c) + v + " = " + (D - b) + "$, so $" + v + " = " + x1 + "$." };
      } }
  ];
  L.unit("prealg", 8, {
    title: "Solving Linear Equations",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Equations that are simplified first, then solved with one property of equality.",
        skills: ["pa8-addsub", "pa8-muldiv"], per: 3 },
      { title: "Quiz 2", after: 5, blurb: "Variables on both sides, the general strategy, and clearing fractions and decimals.",
        skills: ["pa8-both", "pa8-general", "pa8-clear"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:8", {
    2: { name: "Simplify first", frame: "Before isolating the variable, [[simplify]] each side: remove parentheses and combine [[like terms]]. Then undo an addition by [[subtracting]] from both sides.",
         chips: ["multiplying", "factors"] },
    3: { name: "Division and multiplication properties", frame: "A coefficient is removed by [[dividing]] both sides by it, and a fraction coefficient by multiplying by its [[reciprocal]]. $-x = a$ is solved by dividing by [[−1]].",
         chips: ["opposite", "0"] },
    4: { name: "The general strategy", frame: "Simplify each side. Collect the [[variable]] terms on one side and the [[constants]] on the other. Make the coefficient [[1]]. Then [[check]] in the original equation.",
         chips: ["0", "fractions"] },
    5: { name: "Clearing fractions and decimals", frame: "Multiply both sides by the [[LCD]] to clear fractions, or by a power of [[10]] to clear decimals. [[Every]] term on both sides must be multiplied.",
         chips: ["GCF", "One"] }
  });
})();
