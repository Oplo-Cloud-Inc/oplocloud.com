/* ==========================================================================
   Prealgebra — Unit 2: The Language of Algebra. See lab/core.js for the
   format.

   Follows OpenStax Prealgebra 2e, Chapter 2, section for section: the
   readiness check, then 2.1 to 2.5. Each lesson teaches the book's own steps:
   the method, a worked example to watch, one done together, then on your own,
   a harder case, find the error, use it, and the concept built at the end.

   Symbols and the order of operations (2.1), expressions (2.2), a first
   equation on the balance (2.3), then multiples, factors and primes
   (2.4–2.5).

   Adapted from OpenStax, Prealgebra 2e (Rice University), CC BY-NC-SA 4.0.
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
    blurb: "Book: Chapter 2 Be Prepared · Add and subtract, multiply and divide, and repeated multiplication.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Add and subtract", prompt: "What is $25 + 18$?", answer: 43, skill: "Add whole numbers",
        near: [{ v: 33, fb: "$5 + 8 = 13$: carry the 1." }], hints: ["$5 + 8 = 13$. Write 3, carry 1."], why: "$25 + 18 = 43$." },
      { type: "num", prompt: "What is $100 - 37$?", answer: 63, skill: "Subtract whole numbers",
        near: [{ v: 73, fb: "After borrowing, 9 tens are left: $9 - 3 = 6$." }], hints: ["$10 - 7 = 3$, then $9 - 3 = 6$."], why: "$63 + 37 = 100$." },
      { type: "num", kicker: "Check 2 · Multiply and divide", prompt: "What is $6 \\cdot 7$? (The dot means times.)", answer: 42, skill: "Number facts",
        near: [{ v: 13, fb: "The dot means multiply, not add." }], hints: ["Six 7s."], why: "$6 \\cdot 7 = 42$." },
      { type: "num", prompt: "What is $56 \\div 8$?", answer: 7, skill: "Number facts",
        near: [{ v: 48, fb: "That is $56 - 8$." }], hints: ["How many 8s make 56?"], why: "$8 \\cdot 7 = 56$." },
      { type: "num", kicker: "Check 3 · Repeated multiplication", prompt: "What is $3 \\cdot 3 \\cdot 3$?", answer: 27, skill: "Number facts",
        near: [{ v: 9, fb: "That is $3 \\cdot 3$. Multiply by 3 once more." }], hints: ["$3 \\cdot 3 = 9$, then $9 \\cdot 3$."], why: "$9 \\cdot 3 = 27$." },
      { type: "choice", prompt: "Which number divides 30 evenly?",
        options: [{ t: "6" }, { t: "4", fb: "$4 \\cdot 7 = 28$ and $4 \\cdot 8 = 32$: 30 is skipped." }, { t: "7", fb: "$7 \\cdot 4 = 28$ and $7 \\cdot 5 = 35$: 30 is skipped." }],
        answer: 0, skill: "Divide whole numbers", hints: ["Which one has 30 in its times table?"], why: "$6 \\cdot 5 = 30$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 2.1**. If **check 1** slipped, see lessons 1.2 and 1.3. If **check 2** or **check 3** slipped, see lessons 1.4 and 1.5.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================= 2.1 · Use the language of algebra */
  var HOW_2_1 = [["Grouping", "Work inside parentheses and other grouping symbols first."],
                 ["Exponents", "Then simplify every power."],
                 ["× and ÷", "Then multiply and divide, in order from left to right."],
                 ["+ and −", "Then add and subtract, in order from left to right."]];
  LESSONS.push({
    title: "Use the language of algebra",
    blurb: "Book 2.1 · Variables and symbols, expressions and equations, exponents, and the order of operations.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "An **equation** says two things are equal, so it has an equals sign. An **expression** is a phrase with no equals sign. Which of these is an equation?",
        options: [{ t: "$3x + 2 = 11$" }, { t: "$3x + 2$", fb: "No equals sign: that is an expression." }, { t: "$11 - 2$", fb: "No equals sign: that is an expression." }],
        answer: 0, skill: "Expressions and equations", hints: ["Look for the equals sign."], why: "Only $3x + 2 = 11$ makes a statement that two things are equal." },
      { type: "learn", kicker: "Explore", prompt: "A letter can stand for a number that changes. That letter is a **variable**. Feed this machine some values of $n$ and watch what $2n + 3$ gives.",
        scene: { type: "machine", rule: "2x + 3", show: "2n + 3", v: "n", name: "result", inputs: [1, 2, 5, 10], gate: true }, gate: true,
        then: "$2n$ means 2 times $n$: no sign is written between a number and a letter. The 2 and the 3 never change, so they are **constants**." },
      { type: "learn", kicker: "The idea",
        prompt: "$4 + 3 \\cdot 2$ could be read two ways, so everyone agrees on one order. A small raised number, an **exponent**, counts repeated factors: $2^3 = 2 \\cdot 2 \\cdot 2$. The order is grouping symbols, exponents, multiply and divide, then add and subtract.",
        scene: { type: "method", how: HOW_2_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one simplified. $$18 \\div (2 + 4) \\cdot 3^2 - 5$$",
        scene: { type: "walk", how: HOW_2_1, rows: [
          { step: 1, m: "18 \\div (2 + 4) \\cdot 3^2 - 5", say: "Parentheses first." },
          { step: 1, m: "18 \\div 6 \\cdot 3^2 - 5", say: "$2 + 4 = 6$." },
          { step: 2, m: "18 \\div 6 \\cdot 9 - 5", say: "The exponent: $3^2 = 3 \\cdot 3 = 9$." },
          { step: 3, m: "3 \\cdot 9 - 5", say: "Divide first, because it is further left.",
            ask: { prompt: "In $18 \\div 6 \\cdot 9$, which comes first?", answer: 0,
                   options: [{ t: "The division: it is further left" }, { t: "The multiplication: always multiply before dividing", fb: "Multiplying and dividing have the same rank. Work from left to right." }] } },
          { step: 3, m: "27 - 5", say: "Then multiply." },
          { step: 4, m: "22", say: "Subtraction comes last." }] },
        gate: true, then: "This is the **order of operations**. Every expression from here on is read this way." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. $$5 + 2(10 - 7)^2$$",
        how: HOW_2_1, skill: "Order of operations",
        steps: [
          { step: 1, ask: "Parentheses first. What is $10 - 7$?", type: "num", answer: 3, hint: "$10 - 7$.",
            m: "5 + 2(3)^2", say: "The parentheses now hold one number." },
          { step: 2, ask: "The exponent next. What is $3^2$?", type: "num", answer: 9, near: [{ v: 6, fb: "$3^2$ is $3 \\cdot 3$, not $3 \\cdot 2$." }], hint: "$3 \\cdot 3$.",
            m: "5 + 2(9)", say: "Only the 3 is squared, not the 2 in front." },
          { step: 3, ask: "Multiply. What is $2(9)$?", type: "num", answer: 18, hint: "$2 \\cdot 9$.",
            m: "5 + 18", say: "A number next to parentheses means multiply." },
          { step: 4, ask: "Add. What is the value?", type: "num", answer: 23, near: [{ v: 63, fb: "The multiplication came before the addition: $5 + 18$, not $7 \\cdot 9$." }], hint: "$5 + 18$.",
            m: "23", say: "Addition comes last." }],
        why: "Grouping, exponents, multiply and divide, add and subtract. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Simplify $2^3 + 5$.", answer: 13, skill: "Exponents",
        near: [{ v: 11, fb: "$2^3$ is $2 \\cdot 2 \\cdot 2 = 8$, not $2 \\cdot 3$." }, { v: 16, fb: "The exponent comes before the addition: $8 + 5$." }],
        hints: ["$2 \\cdot 2 \\cdot 2$, then add 5."], why: "$8 + 5 = 13$." },
      { type: "sort", prompt: "Expression or equation?",
        bins: ["Expression", "Equation"],
        cards: [{ t: "$x + 9$", bin: 0, fb: "No equals sign." },
                { t: "$x + 9 = 15$", bin: 1, fb: "It says two things are equal." },
                { t: "$4 \\cdot 6 = 24$", bin: 1, fb: "An equation need not have a variable." },
                { t: "$2y - 1$", bin: 0, fb: "No equals sign." }],
        skill: "Expressions and equations", hints: ["An equation is a sentence. An expression is only a phrase."],
        why: "The equals sign is the verb. Without it there is no sentence." },
      { type: "learn", kicker: "A harder case",
        prompt: "With grouping symbols inside grouping symbols, start from the innermost. $$3[2 + 4(6 - 4)] - 6$$",
        scene: { type: "walk", how: HOW_2_1, rows: [
          { step: 1, m: "3[2 + 4(6 - 4)] - 6", say: "The parentheses are inside the brackets: do them first." },
          { step: 1, m: "3[2 + 4(2)] - 6", say: "$6 - 4 = 2$." },
          { step: 1, m: "3[2 + 8] - 6", say: "Inside the brackets, multiply before adding." },
          { step: 1, m: "3[10] - 6", say: "The brackets are finished." },
          { step: 3, m: "30 - 6", say: "Multiply." },
          { step: 4, m: "24", say: "Subtract." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Symbols replace words. Which line says “the product of 5 and 3 is greater than 12”?",
        options: [{ t: "$5 \\cdot 3 > 12$" }, { t: "$5 + 3 > 12$", fb: "A product is a multiplication." }, { t: "$5 \\cdot 3 < 12$", fb: "The symbol opens toward the larger side: $>$ means “is greater than”." }],
        answer: 0, skill: "Translate symbols", hints: ["Product means multiply. Which symbol opens toward the bigger number?"], why: "$15 > 12$, and it is true." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["8 + 2 \\cdot 5", "10 \\cdot 5", "50"], answer: 1, fix: "8 + 10",
        fb: { 0: GIVEN, 2: LATER }, skill: "Order of operations",
        hints: ["Which comes first: adding or multiplying?"],
        why: "Multiplication comes before addition: $8 + 10 = 18$." },
      { type: "num", kicker: "Use it", prompt: "A taxi charges **\\$3** to start plus **\\$2** for each mile. A 6-mile ride costs $3 + 2 \\cdot 6$ dollars. How much is that?",
        pre: "$\\$$", answer: 15, skill: "Order of operations",
        near: [{ v: 30, fb: "Only the miles are multiplied by 2. The \\$3 is added once, at the end." }],
        hints: ["Multiply first: $2 \\cdot 6$."], why: "$3 + 12 = 15$." }
    ]
  });

  /* ========================== 2.2 · Evaluate, simplify and translate expressions */
  var HOW_2_2 = [["Identify", "Identify the like terms: the same variable with the same exponent."],
                 ["Rearrange", "Rearrange the expression so that like terms sit together."],
                 ["Add", "Add the coefficients of the like terms."]];
  var HOW_2_2E = [["Substitute", "Put the number in place of the variable, in parentheses."],
                  ["Multiply", "Multiply, following the order of operations."],
                  ["Add", "Add and subtract."]];
  LESSONS.push({
    title: "Evaluate, simplify and translate expressions",
    blurb: "Book 2.2 · Evaluating expressions, terms and coefficients, combining like terms, and words into algebra.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "To **evaluate** an expression, put a number in place of the variable. Evaluate $x + 7$ when $x = 3$.", answer: 10, skill: "Evaluate an expression",
        near: [{ v: 37, fb: "Replace $x$ with 3, then add: $3 + 7$." }], hints: ["$3 + 7$."], why: "$3 + 7 = 10$." },
      { type: "tilemat", kicker: "Explore", prompt: "Each tile is a term: long tiles are $x$, small tiles are 1. A blue tile and a red tile of the **same kind** cancel. Tap pairs until nothing more cancels.",
        terms: [[3, "x"], [4, "1"], [-1, "x"], [-2, "1"]], skill: "Like terms",
        hints: ["Tap an $x$ tile, then a red $x$ tile."], why: "$3x + 4 - x - 2 = 2x + 2$. An $x$ tile can cancel only another $x$ tile, never a unit tile." },
      { type: "learn", kicker: "The idea",
        prompt: "A **term** is a number, a variable, or a product of them: $7$, $y$, $5x^2$. The number in front is the **coefficient**. **Like terms** have the same variable and exponent, and only like terms can be combined.",
        scene: { type: "method", how: HOW_2_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch like terms combined. $$3x + 7 + 4x + 5$$",
        scene: { type: "walk", how: HOW_2_2, rows: [
          { step: 1, m: "3x + 7 + 4x + 5", say: "$3x$ and $4x$ are like terms. So are the constants 7 and 5." },
          { step: 2, m: "3x + 4x + 7 + 5", say: "Like terms side by side.",
            ask: { prompt: "Which term is a like term for $3x$?", answer: 0,
                   options: [{ t: "$4x$" }, { t: "$7$", fb: "7 has no $x$: it is a constant." }, { t: "$5$", fb: "5 has no $x$: it is a constant." }] } },
          { step: 3, m: "(3 + 4)x + (7 + 5)", say: "Add the coefficients, and add the constants." },
          { step: 3, m: "7x + 12", say: "Three $x$s and four $x$s make seven $x$s." }] },
        gate: true, then: "$7x$ and 12 are not like terms, so $7x + 12$ is as simple as it gets." },
      { type: "guided", kicker: "Together",
        prompt: "Now you simplify. $$5x^2 + 2x + 3x^2 + 6x$$",
        how: HOW_2_2, skill: "Combine like terms",
        steps: [
          { step: 1, ask: "Which term is a like term for $5x^2$?", type: "choice", answer: 0,
            options: [{ t: "$3x^2$" }, { t: "$2x$", fb: "The exponents differ: $x^2$ and $x$ are not like terms." }, { t: "$6x$", fb: "The exponents differ: $x^2$ and $x$ are not like terms." }],
            m: "5x^2 + 2x + 3x^2 + 6x", say: "Same variable, same exponent." },
          { step: 2, ask: "Rearrange so that like terms are together.", type: "choice", answer: 0,
            options: [{ t: "$5x^2 + 3x^2 + 2x + 6x$" }, { t: "$5x^2 + 2x^2 + 3x + 6x$", fb: "The terms move whole: $3x^2$ stays $3x^2$." }],
            m: "5x^2 + 3x^2 + 2x + 6x", say: "The $x^2$ terms, then the $x$ terms." },
          { step: 3, ask: "Add the coefficients of the $x^2$ terms: $5 + 3$.", type: "num", answer: 8, hint: "$5 + 3$.",
            m: "8x^2 + 2x + 6x", say: "The exponent does not change." },
          { step: 3, ask: "Add the coefficients of the $x$ terms: $2 + 6$.", type: "num", answer: 8, hint: "$2 + 6$.",
            m: "8x^2 + 8x", say: "Two kinds of term are left, and they cannot be combined." }],
        why: "Identify, rearrange, add. Now evaluate one, then simplify one." },
      { type: "num", kicker: "On your own", prompt: "Evaluate $3x^2 + 4x + 1$ when $x = 2$.", answer: 21, skill: "Evaluate an expression",
        near: [{ v: 45, fb: "The exponent belongs to $x$ only: $3 \\cdot (2^2)$, not $(3 \\cdot 2)^2$." }, { v: 20, fb: "Add the 1 at the end." }],
        hints: ["$3(2)^2 + 4(2) + 1$. The power first."], why: "$3(4) + 8 + 1 = 21$." },
      { type: "expr", prompt: "Simplify $6n + 4 + 2n + 9$.",
        answer: "8n+13", shown: "8n + 13", form: "simplified", skill: "Combine like terms",
        near: [{ v: "21n", fb: "Only like terms combine: the $n$ terms together, and the constants together." }],
        keys: [["$n$", "n"], ["$+$", "+"]], placeholder: "Use n",
        hints: ["$6n + 2n$, and $4 + 9$."], why: "$8n + 13$." },
      { type: "learn", kicker: "A harder case",
        prompt: "An expression can have two variables. Evaluate $2x + 3y - 6$ when $x = 4$ and $y = 2$.",
        scene: { type: "walk", how: HOW_2_2E, rows: [
          { step: 1, m: "2(4) + 3(2) - 6", say: "Each letter is replaced by its own number." },
          { step: 2, m: "8 + 6 - 6", say: "Multiply first." },
          { step: 3, m: "8", say: "Then add and subtract from left to right." }] },
        gate: true },
      { type: "slots", kicker: "Try it", prompt: "Match each phrase to its expression.",
        slots: [{ id: "a", label: "$x + 8$" }, { id: "b", label: "$x - 8$" }, { id: "c", label: "$8x$" }, { id: "d", label: "$\\frac{x}{8}$" }],
        cards: [{ t: "the sum of x and 8", slot: "a", fb: "Sum means add." },
                { t: "8 less than x", slot: "b", fb: "Start with $x$ and take 8 away." },
                { t: "the product of 8 and x", slot: "c", fb: "Product means multiply." },
                { t: "the quotient of x and 8", slot: "d", fb: "Quotient means divide: $x$ by 8." }],
        skill: "Translate a phrase", hints: ["Sum: add. Difference or “less than”: subtract. Product: multiply. Quotient: divide."],
        why: "Each operation has its own key words." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kim writes “8 less than $x$” as $8 - x$. What is wrong?",
        options: [{ t: "“8 less than $x$” starts with $x$ and takes 8 away: $x - 8$." },
                  { t: "It should be $8x$.", fb: "“Less than” is a subtraction, not a multiplication." },
                  { t: "Nothing. The order does not matter.", fb: "Try $x = 10$: 8 less than 10 is 2, but $8 - 10$ is not." }],
        answer: 0, skill: "Translate a phrase", hints: ["Try it with a number: what is 8 less than 10?"], why: "With “less than”, the order is the reverse of the order of the words." },
      { type: "choice", kicker: "Use it", prompt: "Geoff has some quarters and some dimes. The number of dimes is **2 less than** the number of quarters, $q$. Which expression is the number of dimes?",
        options: [{ t: "$q - 2$" }, { t: "$2 - q$", fb: "Start with the quarters and take 2 away." }, { t: "$2q$", fb: "That is twice as many, not 2 fewer." }],
        answer: 0, skill: "Translate a phrase", hints: ["If he had 10 quarters, how many dimes?"], why: "2 less than $q$ is $q - 2$." }
    ]
  });

  /* ============ 2.3 · Solving equations: subtraction and addition properties */
  var HOW_2_3 = [["Isolate", "Undo what is done to the variable, on both sides: subtract what was added, or add what was subtracted."],
                 ["Simplify", "Simplify both sides."],
                 ["Check", "Substitute the solution into the original equation."]];
  var HOW_2_3T = [["Translate", "Turn the sentence into an equation: “is” becomes the equals sign."],
                  ["Solve", "Solve the equation."],
                  ["Check", "Check that the answer fits the sentence."]];
  LESSONS.push({
    title: "Solve equations by subtracting and adding",
    blurb: "Book 2.3 · What a solution is, and the Subtraction and Addition Properties of Equality.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A **solution** of an equation is a value of the variable that makes it true. Is $x = 5$ a solution of $4x - 3 = 17$?",
        options: [{ t: "Yes: $4(5) - 3 = 17$" }, { t: "No", fb: "$4 \\cdot 5 = 20$, and $20 - 3 = 17$." }],
        answer: 0, skill: "Check a solution", hints: ["Put 5 in place of $x$."], why: "$20 - 3 = 17$ is true." },
      { type: "learn", kicker: "Explore", prompt: "This balance shows $x + 3 = 8$. Each blue block is an unknown $x$. Do the same thing to **both** sides until one $x$ sits alone.",
        scene: { type: "balance", L: { x: 1, c: 3 }, R: { x: 0, c: 8 }, x: 5, gate: "solve" }, gate: true,
        then: "Taking 3 from both sides keeps the beam level and leaves $x = 5$. Taking from one side only would tip it." },
      { type: "learn", kicker: "The idea",
        prompt: "An equation is a balance. Subtract the same number from both sides, or add the same number to both sides, and it stays true. So to get the variable alone, **undo** what is done to it, on both sides.",
        scene: { type: "method", how: HOW_2_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$x + 8 = 17$$",
        scene: { type: "walk", how: HOW_2_3, rows: [
          { step: 1, m: "x + 8 = 17", say: "8 is added to $x$." },
          { step: 1, m: "x + 8 - 8 = 17 - 8", say: "Subtract 8 from both sides: the Subtraction Property of Equality.",
            ask: { prompt: "8 is added to $x$. What undoes that?", answer: 0,
                   options: [{ t: "Subtract 8 from both sides" }, { t: "Add 8 to both sides", fb: "That would leave $x + 16$ on the left." }, { t: "Subtract 8 from the left side only", fb: "The balance would tip. Both sides must change together." }] } },
          { step: 2, m: "x = 9", say: "$8 - 8 = 0$ on the left, and $17 - 8 = 9$ on the right." },
          { step: 3, m: "9 + 8 = 17", say: "Substituting 9 gives a true statement. ✓" }] },
        gate: true, then: "The solution is $x = 9$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve. $$y - 6 = 14$$",
        how: HOW_2_3, skill: "Solve an equation",
        steps: [
          { step: 1, ask: "6 is subtracted from $y$. What undoes that?", type: "choice", answer: 0,
            options: [{ t: "Add 6 to both sides" }, { t: "Subtract 6 from both sides", fb: "That would leave $y - 12$ on the left." }],
            m: "y - 6 + 6 = 14 + 6", say: "The Addition Property of Equality." },
          { step: 2, ask: "Simplify the right side: $14 + 6$.", type: "num", pre: "$y =$", answer: 20, near: [{ v: 8, fb: "Add 6 to the 14. Don't subtract it." }], hint: "$14 + 6$.",
            m: "y = 20", say: "$-6 + 6 = 0$ on the left." },
          { step: 3, ask: "Check: what is $20 - 6$?", type: "num", answer: 14, hint: "$20 - 6$.",
            m: "20 - 6 = 14", say: "It matches the right side. ✓" }],
        why: "Isolate, simplify, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $n + 15 = 40$.", pre: "$n =$", answer: 25, skill: "Solve an equation",
        near: [{ v: 55, fb: "15 is added to $n$, so subtract 15 from both sides." }], hints: ["Subtract 15 from both sides."], why: "$40 - 15 = 25$, and $25 + 15 = 40$." },
      { type: "num", prompt: "Solve $a - 9 = 23$.", pre: "$a =$", answer: 32, skill: "Solve an equation",
        near: [{ v: 14, fb: "9 is subtracted from $a$, so add 9 to both sides." }], hints: ["Add 9 to both sides."], why: "$23 + 9 = 32$, and $32 - 9 = 23$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A sentence can be an equation in disguise. **Twelve less than a number is 37.** Find the number.",
        scene: { type: "walk", how: HOW_2_3T, rows: [
          { step: 1, m: "n - 12 = 37", say: "“Twelve less than a number” is $n - 12$, and “is” is the equals sign." },
          { step: 2, m: "n - 12 + 12 = 37 + 12", say: "Add 12 to both sides." },
          { step: 2, m: "n = 49", say: "Simplify." },
          { step: 3, m: "49 - 12 = 37", say: "Twelve less than 49 is 37. ✓" }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Translate and solve: **the sum of a number and 14 is 31.** What is the number?", answer: 17, skill: "Translate and solve",
        near: [{ v: 45, fb: "$n + 14 = 31$: subtract 14 from both sides." }], hints: ["$n + 14 = 31$."], why: "$31 - 14 = 17$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the solving **first** goes wrong.",
        lines: ["x - 7 = 12", "x = 12 - 7", "x = 5"], answer: 1, fix: "x = 12 + 7",
        fb: { 0: GIVEN, 2: LATER }, skill: "Solve an equation",
        hints: ["7 is subtracted from $x$. What undoes a subtraction?"],
        why: "Add 7 to both sides: $x = 19$. Check: $19 - 7 = 12$." },
      { type: "num", kicker: "Use it", prompt: "After a **\\$7** discount, a shirt costs **\\$18**: $p - 7 = 18$. What was the price before the discount?",
        pre: "$\\$$", answer: 25, skill: "Translate and solve",
        near: [{ v: 11, fb: "The discount was taken off, so add it back." }], hints: ["Add 7 to both sides."], why: "$18 + 7 = 25$." }
    ]
  });
  /* =========================================== 2.4 · Find multiples and factors */
  var HOW_2_4 = [["Divide", "Divide the number by 1, 2, 3 and so on. Keep each divisor that divides evenly, together with its quotient."],
                 ["Stop", "Stop when the quotient is smaller than the divisor."],
                 ["List", "Write all the factors in order, smallest first."]];
  var HOW_2_4P = [["Test primes", "Test each prime in order: 2, 3, 5, 7, 11 and so on."],
                  ["Stop", "Stop when the quotient is smaller than the divisor, or when a prime factor is found."],
                  ["Decide", "A prime factor found means composite. None found means prime."]];
  LESSONS.push({
    title: "Multiples and factors",
    blurb: "Book 2.4 · Multiples, divisibility tests, finding every factor, and prime and composite numbers.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The **multiples** of 6 are $6 \\cdot 1$, $6 \\cdot 2$, $6 \\cdot 3$ and so on: 6, 12, 18, … What is the next one?", answer: 24, skill: "Multiples",
        near: [{ v: 19, fb: "Multiples of 6 go up by 6 each time." }], hints: ["Add 6 to 18."], why: "$6 \\cdot 4 = 24$." },
      { type: "learn", kicker: "The idea",
        prompt: "If $a \\cdot b = m$, then $m$ is a **multiple** of $a$, and $a$ is a **factor** of $m$. Factors come in pairs, so to find them all, divide by 1, 2, 3 and so on and keep each pair that works.",
        scene: { type: "method", how: HOW_2_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch every factor of 24 found.",
        scene: { type: "walk", how: HOW_2_4, rows: [
          { step: 1, m: "24 = 1 \\cdot 24 \\quad 24 = 2 \\cdot 12", say: "1 and 2 divide 24. Each one comes with a partner." },
          { step: 1, m: "24 = 3 \\cdot 8 \\quad 24 = 4 \\cdot 6", say: "So do 3 and 4.",
            ask: { prompt: "Does 5 divide 24 evenly?", answer: 0,
                   options: [{ t: "No" }, { t: "Yes", fb: "$5 \\cdot 4 = 20$ and $5 \\cdot 5 = 25$: 24 is skipped." }] } },
          { step: 2, m: "24 \\div 5 = 4.8", say: "5 does not divide evenly, and the quotient is now smaller than the divisor. Every pair has been found." },
          { step: 3, m: "1, \\; 2, \\; 3, \\; 4, \\; 6, \\; 8, \\; 12, \\; 24", say: "The four pairs, in order." }] },
        gate: true, then: "24 has eight factors. It is divisible by each of them." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find every factor of 18. You already have $1 \\cdot 18$ and $2 \\cdot 9$.",
        how: HOW_2_4, skill: "Find factors",
        steps: [
          { step: 1, ask: "Does 3 divide 18 evenly?", type: "choice", answer: 0,
            options: [{ t: "Yes: $3 \\cdot 6 = 18$" }, { t: "No", fb: "$3 \\cdot 6 = 18$." }],
            m: "18 = 1 \\cdot 18 \\quad 18 = 2 \\cdot 9 \\quad 18 = 3 \\cdot 6", say: "Three pairs so far." },
          { step: 1, ask: "Does 4 divide 18 evenly?", type: "choice", answer: 0,
            options: [{ t: "No" }, { t: "Yes", fb: "$4 \\cdot 4 = 16$ and $4 \\cdot 5 = 20$: 18 is skipped." }],
            m: "18 \\div 4 = 4.5", say: "No pair here." },
          { step: 2, ask: "$18 \\div 5 = 3.6$. Why can you stop now?", type: "choice", answer: 0,
            options: [{ t: "The quotient is smaller than the divisor, so any further pair is already found" }, { t: "Because 5 is prime", fb: "It is the size of the quotient that matters: 3.6 is less than 5." }],
            m: "18 \\div 5 = 3.6", say: "Past this point the pairs repeat in reverse." },
          { step: 3, ask: "List all the factors of 18.", type: "choice", answer: 0,
            options: [{ t: "1, 2, 3, 6, 9, 18" }, { t: "1, 2, 3, 6, 9", fb: "18 is a factor of itself: $1 \\cdot 18$." }, { t: "2, 3, 6, 9", fb: "1 and 18 are factors too." }],
            m: "1, \\; 2, \\; 3, \\; 6, \\; 9, \\; 18", say: "Three pairs, six factors." }],
        why: "Divide, stop, list. Now test for divisibility without dividing." },
      { type: "sort", kicker: "On your own", prompt: "A number is divisible by 3 when the **sum of its digits** is divisible by 3. Sort these.",
        bins: ["Divisible by 3", "Not divisible by 3"],
        cards: [{ t: "132", bin: 0, fb: "$1 + 3 + 2 = 6$." },
                { t: "215", bin: 1, fb: "$2 + 1 + 5 = 8$." },
                { t: "471", bin: 0, fb: "$4 + 7 + 1 = 12$." },
                { t: "1000", bin: 1, fb: "$1 + 0 + 0 + 0 = 1$." }],
        skill: "Divisibility tests", hints: ["Add the digits of each number."],
        why: "Other tests: even numbers are divisible by 2, numbers ending in 0 or 5 by 5, and numbers ending in 0 by 10." },
      { type: "sort", prompt: "A **prime** number has exactly two factors: 1 and itself. A **composite** number has more. Sort these.",
        bins: ["Prime", "Composite"],
        cards: [{ t: "2", bin: 0, fb: "Its only factors are 1 and 2. It is the only even prime." },
                { t: "9", bin: 1, fb: "$3 \\cdot 3 = 9$." },
                { t: "17", bin: 0, fb: "Nothing but 1 and 17 divides it." },
                { t: "21", bin: 1, fb: "$3 \\cdot 7 = 21$." }],
        skill: "Prime and composite", hints: ["Can you find a factor other than 1 and the number itself?"],
        why: "The number 1 is neither prime nor composite: it has only one factor." },
      { type: "learn", kicker: "A harder case",
        prompt: "Is 83 prime? Only prime divisors need testing, and you can stop early.",
        scene: { type: "walk", how: HOW_2_4P, rows: [
          { step: 1, m: "2, \\; 3, \\; 5, \\; 7", say: "83 is odd. Its digits add to 11, which 3 does not divide. It does not end in 0 or 5. And $7 \\cdot 11 = 77$, $7 \\cdot 12 = 84$." },
          { step: 2, m: "83 \\div 11 \\approx 7.5", say: "The next prime is 11. The quotient is now smaller than the divisor, so stop." },
          { step: 3, m: "83 \\text{ is prime}", say: "No prime factor was found." }] },
        gate: true },
      { type: "multi", kicker: "Try it", prompt: "Which of these are multiples of 4? Choose every one.",
        options: [{ t: "28", ok: true }, { t: "52", ok: true }, { t: "30", fb: "$4 \\cdot 7 = 28$ and $4 \\cdot 8 = 32$: 30 is skipped." }, { t: "14", fb: "$4 \\cdot 3 = 12$ and $4 \\cdot 4 = 16$: 14 is skipped." }],
        skill: "Multiples", hints: ["Divide each by 4. Is there a remainder?"], why: "$28 = 4 \\cdot 7$ and $52 = 4 \\cdot 13$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana says: “51 is prime. It is odd, and it does not end in 5.” What is wrong?",
        options: [{ t: "She did not test 3: $5 + 1 = 6$, so 3 divides 51. It is composite." },
                  { t: "51 is even.", fb: "51 ends in 1, so it is odd." },
                  { t: "Nothing. 51 is prime.", fb: "$3 \\cdot 17 = 51$." }],
        answer: 0, skill: "Prime and composite", hints: ["Add the digits of 51."], why: "$51 = 3 \\cdot 17$. Every prime up to the stopping point has to be tested." },
      { type: "choice", kicker: "Use it", prompt: "A coach wants to split **24 players** into equal teams with nobody left over. Which team size does **not** work?",
        options: [{ t: "5" }, { t: "4", fb: "$4 \\cdot 6 = 24$: six teams of 4." }, { t: "6", fb: "$6 \\cdot 4 = 24$: four teams of 6." }, { t: "8", fb: "$8 \\cdot 3 = 24$: three teams of 8." }],
        answer: 0, skill: "Find factors", hints: ["Which of these is not a factor of 24?"], why: "5 is not a factor of 24: four players would be left over." }
    ]
  });

  /* ================= 2.5 · Prime factorization and the least common multiple */
  var HOW_2_5 = [["Split", "Write the number as a product of any two factors."],
                 ["Primes", "A prime factor is finished: circle it."],
                 ["Repeat", "Split every factor that is not prime, until only primes are left."],
                 ["Write", "Write the number as the product of all the primes, smallest first."]];
  var HOW_2_5L = [["Factor", "Write the prime factorization of each number."],
                  ["Match", "Line up the primes, matching the ones the numbers share."],
                  ["Bring down", "Take each prime the most times it appears in either number."],
                  ["Multiply", "Multiply them to get the LCM."]];
  LESSONS.push({
    title: "Prime factorization and the least common multiple",
    blurb: "Book 2.5 · Factor trees, and the least common multiple of two numbers.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which of these is a **prime** number?",
        options: [{ t: "13" }, { t: "15", fb: "$3 \\cdot 5 = 15$." }, { t: "9", fb: "$3 \\cdot 3 = 9$." }],
        answer: 0, skill: "Prime and composite", hints: ["Which one has no factors except 1 and itself?"], why: "13 has exactly two factors: 1 and 13." },
      { type: "learn", kicker: "The idea",
        prompt: "Every composite number is a product of primes, and in only one way. That product is its **prime factorization**. Find it by splitting the number into factors, and splitting those, until nothing but primes is left.",
        scene: { type: "method", how: HOW_2_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the prime factorization of 48 found.",
        scene: { type: "walk", how: HOW_2_5, rows: [
          { step: 1, m: "48 = 6 \\cdot 8", say: "Any factor pair will do as a start." },
          { step: 3, m: "48 = 2 \\cdot 3 \\cdot 2 \\cdot 4", say: "$6 = 2 \\cdot 3$: both prime, so that branch is finished. $8 = 2 \\cdot 4$.",
            ask: { prompt: "$8 = 2 \\cdot 4$. Is that branch finished?", answer: 0,
                   options: [{ t: "No: 4 is not prime" }, { t: "Yes", fb: "$4 = 2 \\cdot 2$, so it still has to be split." }] } },
          { step: 3, m: "48 = 2 \\cdot 3 \\cdot 2 \\cdot 2 \\cdot 2", say: "$4 = 2 \\cdot 2$. Only primes are left." },
          { step: 4, m: "48 = 2^4 \\cdot 3", say: "Four 2s and one 3, written with an exponent." }] },
        gate: true, then: "Starting from $4 \\cdot 12$ or $2 \\cdot 24$ would end with the same primes." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the prime factorization of 60.",
        how: HOW_2_5, skill: "Prime factorization",
        steps: [
          { step: 1, ask: "Split 60 into two factors.", type: "choice", answer: 0,
            options: [{ t: "$6 \\cdot 10$" }, { t: "$6 + 10$", fb: "A factorization is a product, not a sum." }],
            m: "60 = 6 \\cdot 10", say: "One factor pair of 60." },
          { step: 2, ask: "Is either 6 or 10 prime?", type: "choice", answer: 0,
            options: [{ t: "No: both can be split" }, { t: "Yes", fb: "$6 = 2 \\cdot 3$ and $10 = 2 \\cdot 5$." }],
            m: "6 = 2 \\cdot 3 \\quad 10 = 2 \\cdot 5", say: "Neither is finished yet." },
          { step: 3, ask: "Split them both. What is 60 now?", type: "choice", answer: 0,
            options: [{ t: "$2 \\cdot 3 \\cdot 2 \\cdot 5$" }, { t: "$2 \\cdot 3 \\cdot 10$", fb: "10 is not prime: split it into $2 \\cdot 5$." }],
            m: "60 = 2 \\cdot 3 \\cdot 2 \\cdot 5", say: "All four factors are prime." },
          { step: 4, ask: "Write it in order, with an exponent.", type: "choice", answer: 0,
            options: [{ t: "$2^2 \\cdot 3 \\cdot 5$" }, { t: "$2 \\cdot 3 \\cdot 5$", fb: "There are two 2s: that product is only 30." }],
            m: "60 = 2^2 \\cdot 3 \\cdot 5", say: "Smallest prime first." }],
        why: "Split, primes, repeat, write. Now one on your own." },
      { type: "choice", kicker: "On your own", prompt: "Which is the prime factorization of 36?",
        options: [{ t: "$2^2 \\cdot 3^2$" }, { t: "$4 \\cdot 9$", fb: "4 and 9 are not prime." }, { t: "$2 \\cdot 3 \\cdot 6$", fb: "6 is not prime: $6 = 2 \\cdot 3$." }],
        answer: 0, skill: "Prime factorization", hints: ["$36 = 4 \\cdot 9$, then split each."], why: "$36 = 2 \\cdot 2 \\cdot 3 \\cdot 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Prime factors give the **least common multiple** (LCM): the smallest number that both numbers divide. Find the LCM of 12 and 18.",
        scene: { type: "walk", how: HOW_2_5L, rows: [
          { step: 1, m: "12 = 2 \\cdot 2 \\cdot 3 \\quad 18 = 2 \\cdot 3 \\cdot 3", say: "The prime factorization of each." },
          { step: 2, m: "2 \\text{ and } 3 \\text{ are shared}", say: "Both have a 2 and a 3. 12 has an extra 2, and 18 an extra 3." },
          { step: 3, m: "2 \\cdot 2 \\cdot 3 \\cdot 3", say: "2 appears at most twice, and 3 at most twice." },
          { step: 4, m: "2 \\cdot 2 \\cdot 3 \\cdot 3 = 36", say: "The LCM is 36: $12 \\cdot 3$ and $18 \\cdot 2$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "For small numbers, listing multiples is quick. Multiples of 4: 4, 8, 12, 16, … Multiples of 6: 6, 12, 18, … What is the LCM of 4 and 6?", answer: 12, skill: "Least common multiple",
        near: [{ v: 24, fb: "24 is a common multiple, but a smaller one comes first." }, { v: 2, fb: "2 is a common **factor**. A multiple is at least as big as both numbers." }],
        hints: ["Which is the first number in both lists?"], why: "12 is the first number that appears in both lists." },
      { type: "choice", kicker: "Find the error",
        prompt: "Zed says: “The LCM of 6 and 8 is 48, because $6 \\cdot 8 = 48$.” What is wrong?",
        options: [{ t: "48 is a common multiple, but not the least: 24 is smaller." },
                  { t: "The LCM is 2.", fb: "2 is their greatest common **factor**." },
                  { t: "Nothing. Multiplying always gives the LCM.", fb: "It gives the LCM only when the numbers share no factor. 6 and 8 share a 2." }],
        answer: 0, skill: "Least common multiple", hints: ["List the multiples of 8: 8, 16, 24, …"], why: "$6 = 2 \\cdot 3$ and $8 = 2 \\cdot 2 \\cdot 2$, so the LCM is $2 \\cdot 2 \\cdot 2 \\cdot 3 = 24$." },
      { type: "num", kicker: "Use it", prompt: "Hot dogs come in packs of **10** and buns in packs of **8**. What is the smallest number of hot dogs you can buy so that there is exactly one bun for each?",
        answer: 40, skill: "Least common multiple",
        near: [{ v: 80, fb: "80 works, but a smaller number does too." }, { v: 2, fb: "That is a common factor. You need a common **multiple**." }],
        hints: ["The LCM of 10 and 8."], why: "$10 = 2 \\cdot 5$ and $8 = 2 \\cdot 2 \\cdot 2$, so the LCM is $2 \\cdot 2 \\cdot 2 \\cdot 5 = 40$: 4 packs of hot dogs and 5 of buns." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "pa2-order", title: "Use the order of operations", lesson: 2,
      gen: function (R) {
        var a = R.int(2, 9), b = R.int(2, 5), c = R.int(2, 5), d = R.int(1, 6), kind = R.int(0, 2), tex, ans, slip;
        if (kind === 0) { tex = a + " + " + b + " \\cdot " + c; ans = a + b * c; slip = { v: (a + b) * c, fb: "Multiply before you add." }; }
        else if (kind === 1) { tex = b + "(" + (c + d) + " - " + d + ")^2"; ans = b * c * c; slip = { v: b * c * b * c, fb: "The exponent belongs to the parentheses only, not to the " + b + " in front." }; }
        else { tex = a * c + " \\div " + c + " + " + b + "^2"; ans = a + b * b; slip = { v: a + 2 * b, fb: "$" + b + "^2$ is $" + b + " \\cdot " + b + "$." }; }
        return { type: "num", prompt: "Simplify. $$" + tex + "$$", answer: ans, near: near(ans, [slip]),
          hints: ["Grouping, exponents, multiply and divide, then add and subtract."], why: "$" + tex + " = " + ans + "$." };
      } },
    { id: "pa2-evaluate", title: "Evaluate an expression", lesson: 3,
      gen: function (R) {
        var a = R.int(2, 6), b = R.int(1, 9), k = R.int(2, 7), sq = R.chance(0.4), v = R.pick(["x", "n", "y"]);
        var tex = sq ? v + "^2 + " + b : a + v + " + " + b, ans = sq ? k * k + b : a * k + b;
        return { type: "num", prompt: "Evaluate $" + tex + "$ when $" + v + " = " + k + "$.", answer: ans,
          near: near(ans, [{ v: sq ? 2 * k + b : a * 10 + k + b, fb: sq ? "$" + v + "^2$ is $" + k + " \\cdot " + k + "$, not $2 \\cdot " + k + "$." : "$" + a + v + "$ means " + a + " times $" + v + "$, not the digits side by side." }]),
          hints: ["Put " + k + " in place of $" + v + "$."], why: sq ? "$" + k + "^2 + " + b + " = " + ans + "$." : "$" + a + "(" + k + ") + " + b + " = " + ans + "$." };
      } },
    { id: "pa2-like", title: "Combine like terms", lesson: 3,
      gen: function (R) {
        var a = R.int(2, 8), b = R.int(1, 9), c = R.int(2, 8), d = R.int(1, 9), v = R.pick(["x", "n", "y", "a"]), ans = poly([[a + c, v], [b + d, ""]]);
        return { type: "expr", prompt: "Simplify. $$" + a + v + " + " + b + " + " + c + v + " + " + d + "$$", answer: clean(ans), shown: ans, form: "simplified", keys: [["$" + v + "$", v], ["$+$", "+"]],
          near: [{ v: (a + b + c + d) + v, fb: "Only like terms combine: the $" + v + "$ terms together, and the constants together." }],
          hints: ["$" + a + v + " + " + c + v + "$, and $" + b + " + " + d + "$."], why: "$" + (a + c) + v + " + " + (b + d) + "$." };
      } },
    { id: "pa2-solve", title: "Solve by adding or subtracting", lesson: 4,
      gen: function (R) {
        var x0 = R.int(4, 40), a = R.int(3, 25), add = R.chance(0.5), v = R.pick(["x", "n", "y", "a"]);
        var eq = add ? v + " + " + a + " = " + (x0 + a) : v + " - " + a + " = " + (x0 - a);
        return { type: "num", prompt: "Solve. $$" + eq + "$$", pre: "$" + v + " =$", answer: x0,
          near: near(x0, [{ v: add ? x0 + 2 * a : x0 - 2 * a, fb: add ? a + " is added, so subtract " + a + " from both sides." : a + " is subtracted, so add " + a + " to both sides." }]),
          hints: [add ? "Subtract " + a + " from both sides." : "Add " + a + " to both sides."], why: add ? "$" + (x0 + a) + " - " + a + " = " + x0 + "$." : "$" + (x0 - a) + " + " + a + " = " + x0 + "$." };
      } },
    { id: "pa2-prime", title: "Prime or composite?", lesson: 5,
      gen: function (R) {
        var P = R.pick([[11, 0], [13, 0], [17, 0], [19, 0], [23, 0], [29, 0], [31, 0], [37, 0], [41, 0], [43, 0], [15, 3], [21, 3], [27, 3], [33, 3], [35, 5], [39, 3], [49, 7], [51, 3], [57, 3], [91, 7]]);
        var prime = !P[1], why = prime ? "No prime up to its square root divides " + P[0] + "." : "$" + P[1] + " \\cdot " + P[0] / P[1] + " = " + P[0] + "$.";
        return mc(R, { prompt: "Is " + P[0] + " prime or composite?", right: prime ? "Prime" : "Composite", wrong: [{ t: prime ? "Composite" : "Prime", fb: why }], keep: true,
          hints: ["Test 2, 3, 5 and 7."], why: why });
      } },
    { id: "pa2-lcm", title: "Find the least common multiple", lesson: 6,
      gen: function (R) {
        var P = R.pick([[4, 6], [6, 8], [6, 9], [4, 10], [8, 12], [9, 12], [10, 15], [6, 10], [3, 7], [4, 9], [12, 18], [5, 6]]), g = L.gcd(P[0], P[1]), ans = P[0] * P[1] / g;
        return { type: "num", prompt: "Find the least common multiple of " + P[0] + " and " + P[1] + ".", answer: ans,
          near: near(ans, [{ v: P[0] * P[1], fb: "That is a common multiple, but a smaller one exists." }, { v: g, fb: "That is their greatest common **factor**. A multiple is at least as big as both numbers." }]),
          hints: ["List the multiples of " + P[1] + " until one is also a multiple of " + P[0] + "."], why: "$" + ans + " = " + P[0] + " \\cdot " + ans / P[0] + " = " + P[1] + " \\cdot " + ans / P[1] + "$." };
      } }
  ];
  L.unit("prealg", 2, {
    title: "The Language of Algebra",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "The order of operations, evaluating, like terms, and first equations.",
        skills: ["pa2-order", "pa2-evaluate", "pa2-like", "pa2-solve"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Primes and the least common multiple.",
        skills: ["pa2-prime", "pa2-lcm"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:2", {
    2: { name: "Order of operations", frame: "Simplify inside [[grouping symbols]] first, then [[exponents]], then multiply and divide from [[left to right]], then add and subtract.",
         chips: ["right to left", "additions"], fb: { "right to left": "Operations of the same rank are done in the order they are met: from the left." } },
    3: { name: "Like terms", frame: "The number in front of a variable is its [[coefficient]]. [[Like terms]] have the same variable and the same [[exponent]]. They are combined by adding their coefficients.",
         chips: ["constant", "sign"] },
    4: { name: "Properties of equality", frame: "A [[solution]] makes an equation true. Whatever you do to one side, do to the [[other]]. Undo an addition by [[subtracting]], and a subtraction by [[adding]].",
         chips: ["expression", "multiplying"] },
    5: { name: "Multiples and factors", frame: "If $a \\cdot b = m$, then $a$ and $b$ are [[factors]] of $m$, and $m$ is a [[multiple]] of each. A [[prime]] number has exactly two factors. A number with more is [[composite]].",
         chips: ["sum", "odd"] },
    6: { name: "Prime factorization", frame: "Every composite number is a product of [[primes]] in exactly one way. The [[least common multiple]] of two numbers is the smallest number that both divide. Build it from each prime the [[most]] times it appears.",
         chips: ["fewest", "factors"] }
  });
})();
