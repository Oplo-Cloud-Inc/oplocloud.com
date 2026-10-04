/* ==========================================================================
   Prealgebra — Unit 6: Percents. See lab/core.js for the format.

   Follows OpenStax Prealgebra 2e, Chapter 6, section for section: the
   readiness check, then 6.1 to 6.5. Each lesson teaches the book's own steps:
   the method, a worked example to watch, one done together, then on your own,
   a harder case, find the error, use it, and the concept built at the end.

   Percent as “per hundred” (6.1), the percent equation and percent change
   (6.2), sales tax, commission, discount and mark-up (6.3), simple interest
   (6.4), and proportions, including the percent proportion (6.5).

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
    blurb: "Book: Chapter 6 Be Prepared · Decimals, fractions over 100, and equations with decimals.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Decimals", prompt: "Write $\\frac{3}{4}$ as a decimal.", answer: 0.75, tol: 1e-9, skill: "Fraction to decimal",
        near: [{ v: 3.4, tol: 1e-9, fb: "The bar means division: $3 \\div 4$." }], hints: ["$3 \\div 4$."], why: "$3 \\div 4 = 0.75$." },
      { type: "num", prompt: "Multiply $0.35 \\cdot 80$.", answer: 28, skill: "Multiply decimals",
        near: [{ v: 2.8, tol: 1e-9, fb: "$35 \\cdot 80 = 2800$, with two decimal places." }, { v: 280, fb: "$35 \\cdot 80 = 2800$, with two decimal places." }],
        hints: ["$35 \\cdot 80 = 2800$, then two decimal places."], why: "$0.35 \\cdot 80 = 28$." },
      Object.assign({ kicker: "Check 2 · Fractions", prompt: "Simplify $\\frac{45}{100}$.", skill: "Simplify a fraction",
        hints: ["5 divides both."], why: "$\\frac{45 \\div 5}{100 \\div 5} = \\frac{9}{20}$." }, fracIn(9, 20)),
      Object.assign({ prompt: "Write $0.06$ as a fraction in simplest form.", skill: "Decimal to fraction",
        hints: ["Six hundredths: $\\frac{6}{100}$."], why: "$\\frac{6}{100} = \\frac{3}{50}$." }, fracIn(3, 50)),
      { type: "num", kicker: "Check 3 · Equations", prompt: "Solve $0.4n = 12$.", pre: "$n =$", answer: 30, skill: "Solve with decimals",
        near: [{ v: 4.8, tol: 1e-9, fb: "$0.4$ multiplies $n$: divide both sides by $0.4$." }, { v: 3, fb: "$12 \\div 0.4$ is $120 \\div 4$." }], hints: ["$120 \\div 4$."], why: "$12 \\div 0.4 = 30$." },
      { type: "num", prompt: "Solve $\\frac{x}{5} = 7$.", pre: "$x =$", answer: 35, skill: "Multiplication Property",
        near: [{ v: 1.4, tol: 1e-9, fb: "$x$ is divided by 5, so multiply both sides by 5." }], hints: ["Multiply both sides by 5."], why: "$5 \\cdot 7 = 35$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 6.1**. If **check 1** slipped, see lessons 5.2 and 5.3. If **check 2** slipped, see lesson 5.1. If **check 3** slipped, see lesson 5.4.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ======================================================= 6.1 · Understand percent */
  var HOW_6_1 = [["Over 100", "Drop the % sign and write the number over 100."],
                 ["Decimal", "Divide by 100: move the decimal point two places to the left."],
                 ["Fraction", "Simplify the fraction over 100."]];
  LESSONS.push({
    title: "Understand percent",
    blurb: "Book 6.1 · Percent means per hundred, and how percents, decimals and fractions convert into each other.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "The large square is cut into 100 small squares. How many are shaded?" + hundred(25),
        answer: 25, skill: "Meaning of percent", hints: ["Two full columns of 10, and 5 more."], why: "25 out of 100: that is 25 **percent**." },
      { type: "learn", kicker: "The idea",
        prompt: "**Percent** means “per hundred”. 25% is the ratio $\\frac{25}{100}$. So every percent can be written as a decimal and as a fraction, and back again.",
        scene: { type: "method", how: HOW_6_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch 36% written as a decimal and as a fraction.",
        scene: { type: "walk", how: HOW_6_1, rows: [
          { step: 1, m: "36% = \\frac{36}{100}", say: "Per hundred.", fig: hundred(36) },
          { step: 2, m: "36 \\div 100 = 0.36", say: "Dividing by 100 moves the point two places.",
            ask: { prompt: "Dividing by 100 moves the decimal point which way?", answer: 0,
                   options: [{ t: "Two places to the left" }, { t: "Two places to the right", fb: "That would multiply by 100 and make the number bigger." }] } },
          { step: 3, m: "\\frac{36}{100} = \\frac{9}{25}", say: "4 divides both." },
          { step: 3, m: "36% = 0.36 = \\frac{9}{25}", say: "Three names for the same number." }] },
        gate: true, then: "Percent to decimal: two places left. Decimal to percent: two places right." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write 125% as a decimal and as a fraction.",
        how: HOW_6_1, skill: "Convert percents",
        steps: [
          { step: 1, ask: "Write 125% as a ratio. What is the denominator?", type: "num", answer: 100, hint: "Percent means per hundred.",
            m: "125% = \\frac{125}{100}", say: "125 per hundred." },
          { step: 2, ask: "Divide by 100. What is 125% as a decimal?", type: "num", answer: 1.25, tol: 1e-9,
            near: [{ v: 12.5, tol: 1e-9, fb: "Move the point two places, not one." }, { v: 0.125, tol: 1e-9, fb: "Move the point two places, not three." }], hint: "$125. \\to 1.25$.",
            m: "125 \\div 100 = 1.25", say: "Two places to the left." },
          { step: 3, ask: "Simplify $\\frac{125}{100}$.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{5}{4}$" }, { t: "$\\frac{25}{20}$", fb: "5 still divides both." }, { t: "$\\frac{4}{5}$", fb: "More than 100% is more than 1." }],
            m: "\\frac{125}{100} = \\frac{5}{4}", say: "25 divides both. More than 100% is more than one whole." }],
        why: "Over 100, decimal, fraction. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Write 7.5% as a decimal.", answer: 0.075, tol: 1e-9, skill: "Convert percents",
        near: [{ v: 0.75, tol: 1e-9, fb: "Two places to the left: a zero is needed as a place holder." }, { v: 750, fb: "Divide by 100. Do not multiply." }],
        hints: ["$7.5 \\div 100$."], why: "$7.5 \\div 100 = 0.075$." },
      { type: "slots", prompt: "Match each percent to its fraction.",
        slots: [{ id: "a", label: "$\\frac{1}{2}$" }, { id: "b", label: "$\\frac{1}{4}$" }, { id: "c", label: "$\\frac{3}{4}$" }, { id: "d", label: "$\\frac{1}{5}$" }],
        cards: [{ t: "50%", slot: "a", fb: "$\\frac{50}{100} = \\frac{1}{2}$." }, { t: "25%", slot: "b", fb: "$\\frac{25}{100} = \\frac{1}{4}$." },
                { t: "75%", slot: "c", fb: "$\\frac{75}{100} = \\frac{3}{4}$." }, { t: "20%", slot: "d", fb: "$\\frac{20}{100} = \\frac{1}{5}$." }],
        skill: "Convert percents", hints: ["Write each percent over 100 and simplify."],
        why: "These four are worth knowing by heart." },
      { type: "learn", kicker: "A harder case",
        prompt: "Now the other way. Write $\\frac{3}{8}$ as a percent.",
        scene: { type: "walk", how: [["Decimal", "Divide the numerator by the denominator."],
                                    ["Times 100", "Multiply by 100: move the point two places to the right."],
                                    ["Sign", "Write the % sign."]], rows: [
          { step: 1, m: "\\frac{3}{8} = 3 \\div 8 = 0.375", say: "The fraction as a decimal." },
          { step: 2, m: "0.375 \\cdot 100 = 37.5", say: "Two places to the right." },
          { step: 3, m: "\\frac{3}{8} = 37.5%", say: "Thirty-seven and a half per hundred." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Write $0.08$ as a percent.", post: "%", answer: 8, skill: "Convert to percent",
        near: [{ v: 80, fb: "Two places to the right: $0.08 \\to 8$." }, { v: 0.0008, tol: 1e-9, fb: "Multiply by 100. Do not divide." }],
        hints: ["$0.08 \\cdot 100$."], why: "$0.08 \\cdot 100 = 8$, so 8%." },
      { type: "choice", kicker: "Find the error",
        prompt: "Dee says 0.5% is one half. What is wrong?",
        options: [{ t: "0.5% means 0.5 per hundred, which is $0.005$. One half is 50%." },
                  { t: "0.5% is 5%.", fb: "The decimal point does not go away: half of one percent." },
                  { t: "Nothing. It is right.", fb: "$0.5$ is one half, but 0.5% still has to be divided by 100." }],
        answer: 0, skill: "Convert percents", hints: ["Divide $0.5$ by 100."], why: "$0.5 \\div 100 = 0.005$: half of one percent." },
      { type: "num", kicker: "Use it", prompt: "In a class of 25 students, 9 walk to school. What percent of the class walks?",
        post: "%", answer: 36, skill: "Convert to percent",
        near: [{ v: 9, fb: "9 is the count. Compare it with the 25 in the class." }, { v: 0.36, tol: 1e-9, fb: "That is the decimal. Multiply by 100 for the percent." }],
        hints: ["$\\frac{9}{25} = \\frac{36}{100}$."], why: "$9 \\div 25 = 0.36$, which is 36%." }
    ]
  });

  /* ====================================== 6.2 · Solve general applications of percent */
  var HOW_6_2 = [["Translate", "Write the sentence as an equation: “of” is times, “is” is equals. Write the percent as a decimal."],
                 ["Solve", "Solve the equation."],
                 ["Check", "Ask whether the answer is sensible."]];
  LESSONS.push({
    title: "Solve applications of percent",
    blurb: "Book 6.2 · The percent equation, finding the amount, the base or the percent, and percent change.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "10% is one tenth. What is 10% of 80?", answer: 8, skill: "Percent of a number",
        near: [{ v: 800, fb: "10% as a decimal is $0.10$, not 10." }], hints: ["$0.10 \\cdot 80$."], why: "$0.10 \\cdot 80 = 8$." },
      { type: "learn", kicker: "The idea",
        prompt: "Every percent problem is one sentence: **amount = percent · base**. “Of” means multiply and “is” means equals. Two of the three are given. Write the percent as a decimal, and solve for the third.",
        scene: { type: "method", how: HOW_6_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved: “What number is 35% of 90?”",
        scene: { type: "walk", how: HOW_6_2, rows: [
          { step: 1, m: "n = 35% \\text{ of } 90", say: "“What number” is $n$, and “is” is the equals sign." },
          { step: 1, m: "n = 0.35 \\cdot 90", say: "The percent as a decimal, and “of” as times.",
            ask: { prompt: "What is 35% as a decimal?", answer: 0,
                   options: [{ t: "$0.35$" }, { t: "$3.5$", fb: "Divide by 100: two places to the left." }] } },
          { step: 2, m: "n = 31.5", say: "$35 \\cdot 90 = 3150$, with two decimal places." },
          { step: 3, m: "31.5 < 45", say: "35% is less than half, and half of 90 is 45. Sensible." }] },
        gate: true, then: "The same sentence works whichever of the three numbers is missing." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve: “6.5% of what number is $1.17$?”",
        how: HOW_6_2, skill: "Find the base",
        steps: [
          { step: 1, ask: "Which equation says this?", type: "choice", answer: 0,
            options: [{ t: "$0.065b = 1.17$" }, { t: "$6.5b = 1.17$", fb: "6.5% as a decimal is $0.065$." }, { t: "$b = 0.065 \\cdot 1.17$", fb: "“Of what number” puts $b$ beside the percent." }],
            m: "0.065b = 1.17", say: "The percent, times the unknown base, is the amount." },
          { step: 2, ask: "Divide both sides by $0.065$. What is $1.17 \\div 0.065$?", type: "num", answer: 18, hint: "Move the point three places in both: $1170 \\div 65$.",
            m: "b = 18", say: "$1170 \\div 65 = 18$." },
          { step: 3, ask: "Check: is 6.5% of 18 equal to $1.17$?", type: "choice", answer: 0,
            options: [{ t: "Yes: $0.065 \\cdot 18 = 1.17$" }, { t: "No", fb: "$65 \\cdot 18 = 1170$, with three decimal places: $1.170$." }],
            m: "0.065 \\cdot 18 = 1.17", say: "It checks." }],
        why: "Translate, solve, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "What is 36% of 150?", answer: 54, skill: "Find the amount",
        near: [{ v: 5400, fb: "36% as a decimal is $0.36$." }, { v: 5.4, tol: 1e-9, fb: "$36 \\cdot 150 = 5400$, with two decimal places." }],
        hints: ["$0.36 \\cdot 150$."], why: "$0.36 \\cdot 150 = 54$." },
      { type: "num", prompt: "9 is 15% of what number?", answer: 60, skill: "Find the base",
        near: [{ v: 1.35, tol: 1e-9, fb: "That is 15% of 9. Here 9 is the amount: divide 9 by $0.15$." }],
        hints: ["$9 = 0.15b$."], why: "$9 \\div 0.15 = 60$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A price rises from \\$40 to \\$46. Find the **percent increase**.",
        scene: { type: "walk", how: [["Change", "Find the amount of increase or decrease."],
                                    ["Compare", "Write the change as a fraction of the original amount."],
                                    ["Percent", "Convert to a percent."]], rows: [
          { step: 1, m: "46 - 40 = 6", say: "The price went up by 6 dollars." },
          { step: 2, m: "\\frac{6}{40} = 0.15", say: "The change, compared with the **original** price." },
          { step: 3, m: "0.15 = 15%", say: "A 15% increase." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "144 is what percent of 96?", post: "%", answer: 150, skill: "Find the percent",
        near: [{ v: 200 / 3, tol: 0.5, fb: "That is $96 \\div 144$. The amount, 144, is divided by the base, 96." }, { v: 1.5, tol: 1e-9, fb: "That is the decimal. Multiply by 100 for the percent." }],
        hints: ["$144 = p \\cdot 96$."], why: "$144 \\div 96 = 1.5$, which is 150%." },
      { type: "choice", kicker: "Find the error",
        prompt: "A jacket falls from \\$80 to \\$60. Sam says the percent decrease is $\\frac{20}{60}$, about 33%. What is wrong?",
        options: [{ t: "The change is compared with the original price: $\\frac{20}{80} = 0.25$, a 25% decrease." },
                  { t: "The change is 60, not 20.", fb: "$80 - 60 = 20$ is the change." },
                  { t: "Nothing. It is right.", fb: "Percent change always uses the original amount as the base." }],
        answer: 0, skill: "Percent change", hints: ["Which price is the original?"], why: "$20 \\div 80 = 0.25$: 25%." },
      { type: "num", kicker: "Use it", prompt: "A meal costs \\$45 and you leave an 18% tip. How much is the tip, in dollars?",
        post: "dollars", answer: 8.1, tol: 1e-9, skill: "Find the amount",
        near: [{ v: 53.1, tol: 1e-9, fb: "That is the meal plus the tip. The question asks for the tip." }, { v: 810, fb: "18% as a decimal is $0.18$." }],
        hints: ["$0.18 \\cdot 45$."], why: "$0.18 \\cdot 45 = 8.10$." }
    ]
  });

  /* ====================== 6.3 · Sales tax, commission, discount and mark-up */
  var HOW_6_3 = [["Rate", "Write the percent rate as a decimal."],
                 ["Amount", "Multiply the rate by the original price: that is the tax, commission, discount or mark-up."],
                 ["Total", "Add it to the price, or subtract it for a discount."]];
  LESSONS.push({
    title: "Sales tax, commission and discount",
    blurb: "Book 6.3 · Sales tax, commission, discount and mark-up: one calculation, used four ways.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is 8% of 50?", answer: 4, skill: "Percent of a number",
        near: [{ v: 400, fb: "8% as a decimal is $0.08$." }, { v: 40, fb: "8% as a decimal is $0.08$, not $0.8$." }], hints: ["$0.08 \\cdot 50$."], why: "$0.08 \\cdot 50 = 4$." },
      { type: "learn", kicker: "The idea",
        prompt: "Sales tax, commission, discount and mark-up are all the same calculation: a **rate** times an **original amount**. Tax and mark-up are then added on. A discount is taken off.",
        scene: { type: "method", how: HOW_6_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "A jacket costs \\$250 and the sales tax rate is 6%. Watch the total found.",
        scene: { type: "walk", how: HOW_6_3, rows: [
          { step: 1, m: "6% = 0.06", say: "The rate as a decimal." },
          { step: 2, m: "0.06 \\cdot 250 = 15", say: "The sales tax, in dollars.",
            ask: { prompt: "The tax is 6% of what?", answer: 0,
                   options: [{ t: "The purchase price, 250" }, { t: "The total paid", fb: "The total is not known yet. Tax is worked out on the price." }] } },
          { step: 3, m: "250 + 15 = 265", say: "Price plus tax." },
          { step: 3, m: "1.06 \\cdot 250 = 265", say: "A shortcut: the total is 106% of the price." }] },
        gate: true, then: "The rate always multiplies the original amount." },
      { type: "guided", kicker: "Together",
        prompt: "A \\$60 pair of shoes is 35% off. Now you find the sale price.",
        how: HOW_6_3, skill: "Discount",
        steps: [
          { step: 1, ask: "Write 35% as a decimal.", type: "num", answer: 0.35, tol: 1e-9, near: [{ v: 3.5, tol: 1e-9, fb: "Two places to the left." }], hint: "$35 \\div 100$.",
            m: "35% = 0.35", say: "The discount rate." },
          { step: 2, ask: "Find the discount: $0.35 \\cdot 60$.", type: "num", answer: 21, hint: "$35 \\cdot 60 = 2100$, with two decimal places.",
            m: "0.35 \\cdot 60 = 21", say: "21 dollars off." },
          { step: 3, ask: "A discount is taken off. What is the sale price?", type: "num", answer: 39, near: [{ v: 81, fb: "A discount is subtracted, not added." }], hint: "$60 - 21$.",
            m: "60 - 21 = 39", say: "The sale price is 39 dollars." }],
        why: "Rate, amount, total. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "A salesperson earns a 4% **commission** on a sale of \\$3500. How much is the commission, in dollars?",
        post: "dollars", answer: 140, skill: "Commission",
        near: [{ v: 1400, fb: "4% as a decimal is $0.04$, not $0.4$." }, { v: 14000, fb: "4% as a decimal is $0.04$." }],
        hints: ["$0.04 \\cdot 3500$."], why: "$0.04 \\cdot 3500 = 140$." },
      { type: "sort", prompt: "Is each one added to the price, or taken off?",
        bins: ["Added on", "Taken off"],
        cards: [{ t: "Sales tax", bin: 0, fb: "Tax is paid on top of the price." }, { t: "A discount", bin: 1, fb: "A discount lowers the price." },
                { t: "A mark-up", bin: 0, fb: "A shop adds a mark-up to what it paid." }, { t: "A 20%-off coupon", bin: 1, fb: "A coupon is a discount." }],
        skill: "Percent applications", hints: ["Which ones make you pay more?"],
        why: "Tax and mark-up raise the price. Discounts lower it." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes the rate is the unknown. A shop buys a lamp for \\$40 and sells it for \\$52. Find the **mark-up rate**.",
        scene: { type: "walk", how: [["Amount", "Find the tax, discount or mark-up in dollars."],
                                    ["Divide", "Divide it by the original amount."],
                                    ["Percent", "Write the decimal as a percent."]], rows: [
          { step: 1, m: "52 - 40 = 12", say: "The mark-up, in dollars." },
          { step: 2, m: "\\frac{12}{40} = 0.3", say: "Compared with the original cost." },
          { step: 3, m: "0.3 = 30%", say: "A 30% mark-up." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A store buys a chair for \\$24 and marks it up 50%. What is the list price, in dollars?",
        post: "dollars", answer: 36, skill: "Mark-up",
        near: [{ v: 12, fb: "That is the mark-up. Add it to the cost." }],
        hints: ["$0.50 \\cdot 24$, then add."], why: "$24 + 12 = 36$." },
      { type: "choice", kicker: "Find the error",
        prompt: "A \\$200 coat is 25% off, and then 10% sales tax is added. Lee says: “25% off and 10% on is 15% off, so \\$170.” What is wrong?",
        options: [{ t: "The two percents are of different amounts. The sale price is 150, and 10% tax on 150 gives 165." },
                  { t: "Tax should be added before the discount.", fb: "The tax is charged on the price actually paid: the sale price." },
                  { t: "Nothing. It is right.", fb: "The 10% is taken of 150, not of 200." }],
        answer: 0, skill: "Percent applications", hints: ["What amount is the tax a percent of?"], why: "$200 - 50 = 150$, and $150 + 15 = 165$." },
      { type: "num", kicker: "Use it", prompt: "A jacket priced at \\$80 is 15% off. What is the sale price, in dollars?",
        post: "dollars", answer: 68, skill: "Discount",
        near: [{ v: 12, fb: "That is the discount. Subtract it from the price." }, { v: 92, fb: "A discount is subtracted, not added." }],
        hints: ["$0.15 \\cdot 80 = 12$."], why: "$80 - 12 = 68$." }
    ]
  });
  /* ======================================== 6.4 · Solve simple interest applications */
  var HOW_6_4 = [["List", "Write $I = Prt$ and list what you know. The rate is a decimal, and the time is in years."],
                 ["Substitute", "Put the values into the formula."],
                 ["Solve", "Multiply, or divide to find a missing value."]];
  LESSONS.push({
    title: "Simple interest",
    blurb: "Book 6.4 · The simple interest formula, and using it to find the interest, the rate or the principal.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Write 4% as a decimal.", answer: 0.04, tol: 1e-9, skill: "Convert percents",
        near: [{ v: 0.4, tol: 1e-9, fb: "Two places to the left: a zero is needed as a place holder." }], hints: ["$4 \\div 100$."], why: "$4 \\div 100 = 0.04$." },
      { type: "learn", kicker: "The idea",
        prompt: "**Interest** is the fee for using money. Simple interest is $I = Prt$: the **principal** $P$, the amount borrowed or invested, times the yearly rate $r$ as a decimal, times the time $t$ in years.",
        scene: { type: "method", how: HOW_6_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "\\$800 is invested at 5% simple interest for 3 years. Watch the interest found.",
        scene: { type: "walk", how: HOW_6_4, rows: [
          { step: 1, m: "I = Prt", say: "The formula." },
          { step: 1, m: "P = 800 \\quad r = 0.05 \\quad t = 3", say: "The principal, the rate as a decimal, and the time in years.",
            ask: { prompt: "What is 5% as a decimal?", answer: 0,
                   options: [{ t: "$0.05$" }, { t: "$0.5$", fb: "$0.5$ is 50%. Move the point two places." }] } },
          { step: 2, m: "I = 800(0.05)(3)", say: "Each letter replaced by its value." },
          { step: 3, m: "I = 120", say: "$800 \\cdot 0.05 = 40$ each year, for 3 years." }] },
        gate: true, then: "40 dollars a year for 3 years: 120 dollars of interest." },
      { type: "guided", kicker: "Together",
        prompt: "\\$2500 is invested at 6% simple interest for 2 years. Now you find the interest.",
        how: HOW_6_4, skill: "Simple interest",
        steps: [
          { step: 1, ask: "Which of these is the principal $P$?", type: "choice", answer: 0,
            options: [{ t: "2500, the amount invested" }, { t: "6%", fb: "That is the rate, $r$." }, { t: "2 years", fb: "That is the time, $t$." }],
            m: "P = 2500 \\quad r = 0.06 \\quad t = 2", say: "Principal, rate as a decimal, time in years." },
          { step: 2, ask: "Substitute into $I = Prt$. Which product is it?", type: "choice", answer: 0,
            options: [{ t: "$2500(0.06)(2)$" }, { t: "$2500(6)(2)$", fb: "The rate must be written as a decimal." }],
            m: "I = 2500(0.06)(2)", say: "The values in place." },
          { step: 3, ask: "Multiply. What is the interest?", type: "num", answer: 300, near: [{ v: 150, fb: "That is one year of interest. The time is 2 years." }], hint: "$2500 \\cdot 0.06 = 150$.",
            m: "I = 300", say: "150 dollars a year, for 2 years." }],
        why: "List, substitute, solve. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Find the simple interest on \\$600 at 3% for 5 years.", post: "dollars", answer: 90, skill: "Simple interest",
        near: [{ v: 9000, fb: "The rate must be a decimal: $0.03$." }, { v: 18, fb: "That is one year of interest. The time is 5 years." }],
        hints: ["$600(0.03)(5)$."], why: "$600 \\cdot 0.03 = 18$ a year, for 5 years: 90." },
      { type: "num", prompt: "You invest \\$2000 at 4.5% simple interest for 2 years. How much is in the account at the end: principal plus interest?",
        post: "dollars", answer: 2180, skill: "Simple interest",
        near: nearBig(2180, [{ v: 180, fb: "That is the interest. Add the principal." }, { v: 2090, fb: "That is after one year. The time is 2 years." }]),
        hints: ["$I = 2000(0.045)(2)$, then add 2000."], why: "$I = 180$, and $2000 + 180 = 2180$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The formula can be solved for any of its letters. A loan of \\$800 costs \\$96 in interest over 2 years. Find the **rate**.",
        scene: { type: "walk", how: HOW_6_4, rows: [
          { step: 1, m: "I = 96 \\quad P = 800 \\quad t = 2", say: "This time the rate is the unknown." },
          { step: 2, m: "96 = 800 \\cdot r \\cdot 2", say: "The known values in $I = Prt$." },
          { step: 3, m: "96 = 1600r", say: "$800 \\cdot 2 = 1600$." },
          { step: 3, m: "r = 0.06", say: "Divide both sides by 1600." },
          { step: 3, m: "r = 6%", say: "The decimal written as a percent." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Time must be in years. Find the simple interest on \\$1200 at 5% for 6 months.", post: "dollars", answer: 30, skill: "Simple interest",
        near: [{ v: 360, fb: "6 months is half a year: $t = 0.5$." }, { v: 60, fb: "That is a full year of interest. 6 months is half a year." }],
        hints: ["$1200(0.05)(0.5)$."], why: "$1200 \\cdot 0.05 = 60$ a year, so 30 for half a year." },
      { type: "spotline", kicker: "Find the error",
        prompt: "\\$500 is invested at 8% for 2 years. Tap the line where the work **first** goes wrong.",
        lines: ["I = Prt", "I = 500(8)(2)", "I = 8000"], answer: 1, fix: "I = 500(0.08)(2)",
        fb: { 0: "That is the formula, and it is right.", 2: LATER }, skill: "Simple interest",
        hints: ["How is a rate written inside the formula?"],
        why: "8% is $0.08$: $I = 500(0.08)(2) = 80$." },
      { type: "num", kicker: "Use it", prompt: "A loan of \\$5000 at 6% simple interest is repaid after 3 years. How much interest is owed?",
        post: "dollars", answer: 900, skill: "Simple interest",
        near: [{ v: 300, fb: "That is one year of interest. The time is 3 years." }, { v: 5900, fb: "That is the total to repay. The question asks for the interest." }],
        hints: ["$5000(0.06)(3)$."], why: "$5000 \\cdot 0.06 = 300$ a year, for 3 years: 900." }
    ]
  });

  /* ================================== 6.5 · Solve proportions and their applications */
  var HOW_6_5 = [["Cross", "Cross multiply: each numerator times the other denominator."],
                 ["Solve", "Solve the equation for the variable."],
                 ["Check", "Substitute back: the two cross products must be equal."]];
  LESSONS.push({
    title: "Solve proportions",
    blurb: "Book 6.5 · Proportions, cross products, and percent problems written as proportions.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $\\frac{4}{6} = \\frac{6}{9}$ a true statement?",
        options: [{ t: "Yes: both simplify to $\\frac{2}{3}$" }, { t: "No", fb: "$\\frac{4}{6} = \\frac{2}{3}$ and $\\frac{6}{9} = \\frac{2}{3}$." }],
        answer: 0, skill: "Proportions", hints: ["Simplify each fraction."], why: "Both are $\\frac{2}{3}$." },
      { type: "learn", kicker: "The idea",
        prompt: "A **proportion** says that two ratios are equal: $\\frac{a}{b} = \\frac{c}{d}$. In a true proportion the **cross products** are equal: $a \\cdot d = b \\cdot c$. That turns a proportion with an unknown into an equation you can solve.",
        scene: { type: "method", how: HOW_6_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one solved. $$\\frac{x}{63} = \\frac{4}{7}$$",
        scene: { type: "walk", how: HOW_6_5, rows: [
          { step: 1, m: "\\frac{x}{63} = \\frac{4}{7}", say: "Two equal ratios, with one number unknown." },
          { step: 1, m: "7x = 63 \\cdot 4", say: "The cross products are equal.",
            ask: { prompt: "$x$ is multiplied by 7. Which product is on the other side?", answer: 0,
                   options: [{ t: "$63 \\cdot 4$" }, { t: "$63 \\cdot 7$", fb: "Each cross product uses one numerator and the **other** denominator." }] } },
          { step: 2, m: "7x = 252", say: "$63 \\cdot 4 = 252$." },
          { step: 2, m: "x = 36", say: "Divide both sides by 7." },
          { step: 3, m: "7 \\cdot 36 = 63 \\cdot 4", say: "Both cross products are 252. True." }] },
        gate: true, then: "Cross multiplying only works across an equals sign between two fractions." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve $\\frac{144}{a} = \\frac{9}{4}$.",
        how: HOW_6_5, skill: "Solve proportions",
        steps: [
          { step: 1, ask: "Cross multiply. Which equation do you get?", type: "choice", answer: 0,
            options: [{ t: "$9a = 144 \\cdot 4$" }, { t: "$4a = 144 \\cdot 9$", fb: "$a$ is paired with the numerator across from it: 9." }, { t: "$144a = 36$", fb: "Multiply across the equals sign, not along each fraction." }],
            m: "9a = 144 \\cdot 4", say: "The cross products." },
          { step: 2, ask: "$144 \\cdot 4 = 576$. Divide by 9: what is $a$?", type: "num", answer: 64, hint: "$9 \\cdot 64 = 576$.",
            m: "a = 64", say: "$576 \\div 9 = 64$." },
          { step: 3, ask: "Check the cross products, $144 \\cdot 4$ and $64 \\cdot 9$. Are they equal?", type: "choice", answer: 0,
            options: [{ t: "Yes: both are 576" }, { t: "No", fb: "$64 \\cdot 9 = 576$ as well." }],
            m: "144 \\cdot 4 = 64 \\cdot 9", say: "It checks." }],
        why: "Cross, solve, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve $\\frac{n}{12} = \\frac{5}{4}$.", pre: "$n =$", answer: 15, skill: "Solve proportions",
        near: [{ v: 9.6, tol: 1e-9, fb: "Cross multiply: $4n = 12 \\cdot 5$." }],
        hints: ["$4n = 60$."], why: "$n = 60 \\div 4 = 15$." },
      { type: "num", prompt: "A recipe uses 3 cups of flour for 24 cookies. How many cups are needed for 40 cookies? Solve $\\frac{3}{24} = \\frac{c}{40}$.",
        pre: "$c =$", post: "cups", answer: 5, skill: "Proportions in use",
        near: [{ v: 320, fb: "Cross multiply: $24c = 3 \\cdot 40$, then divide by 24." }],
        hints: ["$24c = 120$."], why: "$c = 120 \\div 24 = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A percent problem is a proportion too: the amount is to the base as the percent is to 100. “What number is 45% of 80?”",
        scene: { type: "walk", how: [["Set up", "Write amount over base equal to percent over 100."],
                                    ["Cross", "Cross multiply."],
                                    ["Solve", "Divide to find the unknown."]], rows: [
          { step: 1, m: "\\frac{n}{80} = \\frac{45}{100}", say: "The amount $n$ over the base 80 equals 45 over 100." },
          { step: 2, m: "100n = 80 \\cdot 45", say: "The cross products." },
          { step: 2, m: "100n = 3600", say: "$80 \\cdot 45 = 3600$." },
          { step: 3, m: "n = 36", say: "Divide both sides by 100." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "6.5% of what number is $1.56$? Solve the proportion $\\frac{1.56}{b} = \\frac{6.5}{100}$.", pre: "$b =$", answer: 24, skill: "Percent proportion",
        near: [{ v: 0.1014, tol: 1e-3, fb: "That is 6.5% of 1.56. Cross multiply: $6.5b = 156$." }],
        hints: ["$6.5b = 1.56 \\cdot 100$."], why: "$b = 156 \\div 6.5 = 24$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{x}{8} = \\frac{15}{12}", "15x = 96", "x = 6.4"], answer: 1, fix: "12x = 120",
        fb: { 0: GIVEN, 2: LATER }, skill: "Solve proportions",
        hints: ["Which denominator is across from $x$?"],
        why: "$x$ pairs with 12, and 8 pairs with 15: $12x = 120$, so $x = 10$." },
      { type: "num", kicker: "Use it", prompt: "On a map, 2 inches stand for 75 miles. Two towns are 5 inches apart on the map. How far apart are they really?",
        post: "miles", answer: 187.5, tol: 1e-9, skill: "Proportions in use",
        near: [{ v: 30, fb: "Set it up as $\\frac{2}{75} = \\frac{5}{m}$ and cross multiply." }, { v: 375, fb: "That is $75 \\cdot 5$. Now divide by 2." }],
        hints: ["$\\frac{2}{75} = \\frac{5}{m}$, so $2m = 375$."], why: "$m = 375 \\div 2 = 187.5$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "pa6-convert", title: "Convert percents, decimals and fractions", lesson: 2,
      gen: function (R) {
        var kind = R.int(0, 2), p;
        if (kind === 2) {
          p = R.pick([20, 25, 40, 45, 60, 75, 80, 15, 35, 5, 12, 64, 8, 150, 125]);
          var g = L.gcd(p, 100);
          return Object.assign({ prompt: "Write " + p + "% as a fraction in simplest form.",
            hints: ["It is $\\frac{" + p + "}{100}$. Then simplify."], why: "$\\frac{" + p + "}{100} = \\frac{" + p / g + "}{" + 100 / g + "}$." }, fracIn(p / g, 100 / g));
        }
        p = R.pick([3, 7, 12, 45, 60, 125, 7.5, 0.5, 150, 8, 36, 2.5, 99, 110, 0.8, 62.5]);
        var d = Math.round(p * 1000) / 100000;
        if (kind === 0) return { type: "num", prompt: "Write " + num(p) + "% as a decimal.", answer: d, tol: 1e-9,
          near: [{ v: d * 10, tol: 1e-9, fb: "Move the decimal point two places to the left." }, { v: p * 100, tol: 1e-9, fb: "Divide by 100. Do not multiply." }],
          hints: ["$" + num(p) + " \\div 100$."], why: "$" + num(p) + " \\div 100 = " + num(d) + "$." };
        return { type: "num", prompt: "Write $" + num(d) + "$ as a percent.", post: "%", answer: p, tol: 1e-9,
          near: [{ v: p * 10, tol: 1e-9, fb: "Move the decimal point two places to the right." }, { v: d / 100, tol: 1e-12, fb: "Multiply by 100. Do not divide." }],
          hints: ["$" + num(d) + " \\cdot 100$."], why: "$" + num(d) + " \\cdot 100 = " + num(p) + "$, so " + num(p) + "%." };
      } },
    { id: "pa6-percent", title: "Solve the percent equation", lesson: 3,
      gen: function (R) {
        var p = R.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 75, 80]), base = R.int(2, 20) * 20, amt = p * base / 100, kind = R.int(0, 2);
        if (kind === 0) return { type: "num", prompt: "What is " + p + "% of " + base + "?", answer: amt,
          near: near(amt, [{ v: p * base, fb: p + "% as a decimal is $" + num(p / 100) + "$." }]), hints: ["$" + num(p / 100) + " \\cdot " + base + "$."], why: "$" + num(p / 100) + " \\cdot " + base + " = " + amt + "$." };
        if (kind === 1) return { type: "num", prompt: amt + " is " + p + "% of what number?", answer: base,
          near: near(base, [{ v: Math.round(amt * p) / 100, tol: 1e-9, fb: "That is " + p + "% of " + amt + ". Here " + amt + " is the amount: divide it by $" + num(p / 100) + "$." }]),
          hints: ["$" + amt + " = " + num(p / 100) + "b$."], why: "$" + amt + " \\div " + num(p / 100) + " = " + base + "$." };
        return { type: "num", prompt: amt + " is what percent of " + base + "?", post: "%", answer: p,
          near: near(p, [{ v: p / 100, tol: 1e-9, fb: "That is the decimal. Multiply by 100 for the percent." }]),
          hints: ["$" + amt + " \\div " + base + "$, then write it as a percent."], why: "$" + amt + " \\div " + base + " = " + num(p / 100) + "$, which is " + p + "%." };
      } },
    { id: "pa6-change", title: "Find a percent increase or decrease", lesson: 3,
      gen: function (R) {
        var o = R.int(1, 10) * 20, p = R.pick([5, 10, 15, 20, 25, 30, 40, 50]), ch = o * p / 100, up = R.chance(0.5), n = up ? o + ch : o - ch;
        return { type: "num", prompt: "A price goes from \\$" + o + " to \\$" + n + ". Find the percent " + (up ? "increase" : "decrease") + ".", post: "%", answer: p,
          near: near(p, [{ v: ch, fb: "That is the change in dollars. Compare it with the original price." }, { v: Math.round(ch / n * 1000) / 10, tol: 0.06, fb: "Compare the change with the **original** price, " + o + ", not the new one." }]),
          hints: ["The change is " + ch + ". Divide it by the original price, " + o + "."], why: "$" + ch + " \\div " + o + " = " + num(p / 100) + "$, which is " + p + "%." };
      } },
    { id: "pa6-discount", title: "Sales tax, discount and mark-up", lesson: 4,
      gen: function (R) {
        var price = R.int(2, 30) * 10, kind = R.int(0, 2), rate = kind === 0 ? R.pick([5, 6, 8, 10]) : R.pick([10, 15, 20, 25, 30, 40, 50]);
        var amt = Math.round(price * rate) / 100, total = Math.round((kind === 1 ? price - amt : price + amt) * 100) / 100;
        var what = ["sales tax is " + rate + "%. What is the total cost", "it is " + rate + "% off. What is the sale price", "a shop marks it up " + rate + "%. What is the list price"][kind];
        return { type: "num", prompt: "An item costs \\$" + price + ", and " + what + ", in dollars?", post: "dollars", answer: total, tol: 1e-9,
          near: near(total, [{ v: amt, tol: 1e-9, fb: "That is the " + ["tax", "discount", "mark-up"][kind] + ". " + (kind === 1 ? "Subtract it from" : "Add it to") + " the price." },
                             { v: Math.round((kind === 1 ? price + amt : price - amt) * 100) / 100, tol: 1e-9, fb: kind === 1 ? "A discount is subtracted, not added." : "It is added on, not taken off." }]),
          hints: ["$" + num(rate / 100) + " \\cdot " + price + " = " + num(amt) + "$."], why: "$" + price + (kind === 1 ? " - " : " + ") + num(amt) + " = " + num(total) + "$." };
      } },
    { id: "pa6-interest", title: "Use the simple interest formula", lesson: 5,
      gen: function (R) {
        var P = R.int(2, 40) * 100, r = R.pick([2, 3, 4, 5, 6, 8]), t = R.int(2, 6), I = P * r * t / 100;
        if (R.chance(0.65)) return { type: "num", prompt: "Find the simple interest on \\$" + P + " at " + r + "% for " + t + " years.", post: "dollars", answer: I,
          near: nearBig(I, [{ v: I * 100, fb: "The rate must be written as a decimal: $" + num(r / 100) + "$." }, { v: I / t, tol: 1e-9, fb: "That is one year of interest. The time is " + t + " years." }]),
          hints: ["$I = " + P + "(" + num(r / 100) + ")(" + t + ")$."], why: "$" + P + "(" + num(r / 100) + ")(" + t + ") = " + I + "$." };
        return { type: "num", prompt: "A loan of \\$" + P + " costs \\$" + I + " in simple interest over " + t + " years. Find the yearly rate.", post: "%", answer: r,
          near: near(r, [{ v: r / 100, tol: 1e-9, fb: "That is the decimal. Write it as a percent." }, { v: r * t, fb: "Divide by the time as well: $" + I + " = " + P + " \\cdot r \\cdot " + t + "$." }]),
          hints: ["$" + I + " = " + P * t + "r$."], why: "$r = " + I + " \\div " + P * t + " = " + num(r / 100) + "$, which is " + r + "%." };
      } },
    { id: "pa6-proportion", title: "Solve a proportion", lesson: 6,
      gen: function (R) {
        var d = R.int(2, 9), k = R.int(2, 8), c = R.int(1, 9), v = R.pick(["x", "n", "y", "a"]);
        if (c === d) c = d + 1;
        var b = d * k, x0 = c * k, flip = R.chance(0.5);
        var tex = flip ? "\\frac{" + c + "}{" + d + "} = \\frac{" + v + "}{" + b + "}" : "\\frac{" + v + "}{" + b + "} = \\frac{" + c + "}{" + d + "}";
        return { type: "num", prompt: "Solve the proportion. $$" + tex + "$$", pre: "$" + v + " =$", answer: x0,
          near: near(x0, [{ v: b * d / c, tol: 1e-9, fb: "Cross multiply: $" + d + v + " = " + b + " \\cdot " + c + "$." }]),
          hints: ["$" + d + v + " = " + b * c + "$."], why: "$" + v + " = " + b * c + " \\div " + d + " = " + x0 + "$." };
      } }
  ];
  L.unit("prealg", 6, {
    title: "Percents",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Converting percents, the percent equation, and percent change.",
        skills: ["pa6-convert", "pa6-percent", "pa6-change"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Tax and discount, simple interest, and proportions.",
        skills: ["pa6-discount", "pa6-interest", "pa6-proportion"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:6", {
    2: { name: "Percent", frame: "Percent means per [[hundred]]. To write a percent as a decimal, move the point two places to the [[left]]. To write a decimal as a percent, move it two places to the [[right]].",
         chips: ["ten", "top"] },
    3: { name: "The percent equation", frame: "[[Amount]] = percent · [[base]]. “Of” means [[multiply]] and “is” means equals. A percent change compares the change with the [[original]] amount.",
         chips: ["new", "divide"] },
    4: { name: "Tax, discount and mark-up", frame: "Each one is a [[rate]] times the original amount. Sales tax and mark-up are [[added]] to the price. A discount is [[subtracted]].",
         chips: ["divided", "total"] },
    5: { name: "Simple interest", frame: "$I = Prt$: interest is the [[principal]] times the yearly [[rate]], written as a decimal, times the time in [[years]].",
         chips: ["months", "total"] },
    6: { name: "Proportions", frame: "A [[proportion]] says two ratios are equal. Its [[cross products]] are equal, which gives an equation to solve. In a percent proportion, the amount is to the base as the percent is to [[100]].",
         chips: ["sums", "10"] }
  });
})();
