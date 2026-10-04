/* ==========================================================================
   Prealgebra — Unit 1: Whole Numbers. See lab/core.js for the format.

   Follows OpenStax Prealgebra 2e, Chapter 1, section for section: a readiness
   check, then 1.1 to 1.5. Every lesson is taught in the same order as Algebra
   I and II: a warm up, the idea (the book's own method), a worked example to
   watch, one done together, then on your own, a harder case, find the error,
   use it, and the concept built at the end.

   Place value and rounding (1.1), then the four operations, each set out in
   columns beside the work (1.2–1.5).

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
    blurb: "Before Chapter 1 · Number facts, the number line, and comparing two numbers.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Number facts", prompt: "What is $6 + 9$?", answer: 15, skill: "Number facts",
        near: [{ v: 54, fb: "That is $6 \\times 9$. The sign here is a plus." }], hints: ["Count on from 9."], why: "$6 + 9 = 15$." },
      { type: "num", prompt: "What is $7 \\times 6$?", answer: 42, skill: "Number facts",
        near: [{ v: 13, fb: "That is $7 + 6$. The sign here means times." }], hints: ["Six 7s."], why: "$7 \\times 6 = 42$." },
      { type: "numberline", kicker: "Check 2 · The number line", prompt: "Drag the point to 7.",
        min: 0, max: 10, mode: "point", points: [{ v: 2, drag: true }], answer: { points: [7] }, skill: "Number line",
        hints: ["Count the ticks from 0."], why: "7 is seven steps to the right of 0." },
      { type: "num", prompt: "What is $36 \\div 4$?", answer: 9, skill: "Number facts",
        near: [{ v: 32, fb: "That is $36 - 4$. The sign here means divided by." }], hints: ["How many 4s make 36?"], why: "$4 \\times 9 = 36$." },
      { type: "choice", kicker: "Check 3 · Comparing", prompt: "Which number is larger?",
        options: [{ t: "102" }, { t: "98", fb: "98 has only two digits. 102 has a hundred in it." }],
        answer: 0, skill: "Compare numbers", hints: ["Which one has more digits?"], why: "102 is past 100, and 98 is not." },
      { type: "num", prompt: "What is $13 - 5$?", answer: 8, skill: "Number facts",
        near: [{ v: 18, fb: "That is $13 + 5$. The sign here is a minus." }], hints: ["Count back from 13."], why: "$13 - 5 = 8$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "Start with **Lesson 1.1**. This unit rebuilds whole-number arithmetic from the ground up, one operation at a time, so nothing is assumed beyond the facts you have just used.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================================= 1.1 · Introduction to whole numbers */
  var HOW_1_1 = [["Locate", "Find the digit in the place you are rounding to."],
                 ["Look right", "Look at the digit just to its right."],
                 ["Decide", "If that digit is 5 or more, add 1 to the rounding digit. If it is less than 5, leave it alone."],
                 ["Zeros", "Replace every digit to the right with 0."]];
  LESSONS.push({
    title: "Introduction to whole numbers",
    blurb: "Book 1.1 · Counting numbers and whole numbers, place value, naming and writing numbers, and rounding.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "The **counting numbers** are 1, 2, 3 and so on. The **whole numbers** are the counting numbers together with one more number. Which one?",
        options: [{ t: "0" }, { t: "$-1$", fb: "Negative numbers come later, with the integers." }, { t: "$\\frac{1}{2}$", fb: "A whole number has no fraction part." }],
        answer: 0, skill: "Whole numbers", hints: ["What do you have before you start counting?"], why: "The whole numbers are 0, 1, 2, 3 and so on." },
      { type: "learn", kicker: "The idea",
        prompt: "Our number system is built on **place value**: each place is worth ten times the place to its right. **Rounding** uses place value to swap a number for a simpler one that is close to it.",
        scene: { type: "method", how: HOW_1_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch 23,658 rounded to the nearest hundred.",
        scene: { type: "walk", how: HOW_1_1, rows: [
          { step: 1, m: "\\text{23,}\\mathbf{6}\\text{58}", say: "The digit in the hundreds place is 6." },
          { step: 2, m: "\\text{23,6}\\mathbf{5}\\text{8}", say: "The digit just to its right is 5.",
            ask: { prompt: "Which digit decides whether 23,658 rounds up or stays?", answer: 0,
                   options: [{ t: "The 5, just right of the hundreds place" }, { t: "The 8, the last digit", fb: "Only the digit immediately to the right matters." }, { t: "The 6 itself", fb: "The 6 is the digit being rounded. Its neighbour decides." }] } },
          { step: 3, m: "6 + 1 = 7", say: "5 or more, so round up: the 6 becomes 7." },
          { step: 4, m: "\\text{23,700}", say: "Every digit to the right becomes 0." }] },
        gate: true, then: "23,658 is closer to 23,700 than to 23,600." },
      { type: "guided", kicker: "Together",
        prompt: "Now you round 147,032 to the nearest thousand.",
        how: HOW_1_1, skill: "Round whole numbers",
        steps: [
          { step: 1, ask: "Which digit is in the thousands place?", type: "num", answer: 7, near: [{ v: 4, fb: "The 4 is in the ten-thousands place. Count from the right: ones, tens, hundreds, thousands." }], hint: "Count four places from the right.",
            m: "\\text{14}\\mathbf{7}\\text{,032}", say: "The fourth digit from the right." },
          { step: 2, ask: "Which digit is just to its right?", type: "num", answer: 0, hint: "The hundreds digit.",
            m: "\\text{147,}\\mathbf{0}\\text{32}", say: "The hundreds digit." },
          { step: 3, ask: "0 is less than 5. What happens to the 7?", type: "choice", answer: 0,
            options: [{ t: "It stays 7" }, { t: "It becomes 8", fb: "It only goes up when the next digit is 5 or more." }],
            m: "7 \\text{ stays}", say: "Less than 5: round down." },
          { step: 4, ask: "Replace the digits to the right with zeros.", type: "choice", answer: 0,
            options: [{ t: "147,000" }, { t: "148,000", fb: "The 7 stayed: the next digit was 0." }, { t: "147,030", fb: "Every digit to the right of the thousands place becomes 0." }],
            m: "\\text{147,000}", say: "147,032 is closer to 147,000 than to 148,000." }],
        why: "Locate, look right, decide, zeros. Now work with place value yourself." },
      { type: "slots", kicker: "On your own", prompt: "In 4,205,613, match each digit to its place.",
        slots: [{ id: "a", label: "Millions" }, { id: "b", label: "Hundred thousands" }, { id: "c", label: "Thousands" }, { id: "d", label: "Tens" }],
        cards: [{ t: "4", slot: "a", fb: "The seventh place from the right." },
                { t: "2", slot: "b", fb: "The sixth place from the right." },
                { t: "5", slot: "c", fb: "The fourth place from the right." },
                { t: "1", slot: "d", fb: "The second place from the right." }],
        skill: "Place value", hints: ["From the right: ones, tens, hundreds, thousands, ten thousands, hundred thousands, millions."],
        why: "Each place is worth ten times the one to its right." },
      { type: "choice", prompt: "Which number is “two million, three hundred fifty thousand, forty-six”?",
        options: [{ t: "2,350,046" }, { t: "2,350,460", fb: "Forty-six fills the tens and ones: 046." }, { t: "235,046", fb: "Two million needs seven digits." }],
        answer: 0, skill: "Write whole numbers", hints: ["Each group of three digits is a period: millions, thousands, ones."], why: "2 in the millions, 350 in the thousands, 046 in the ones." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes rounding up pushes a 9 over to the next place. Round 3,978 to the nearest hundred.",
        scene: { type: "walk", how: HOW_1_1, rows: [
          { step: 1, m: "\\text{3,}\\mathbf{9}\\text{78}", say: "The hundreds digit is 9." },
          { step: 2, m: "\\text{3,9}\\mathbf{7}\\text{8}", say: "The digit to its right is 7: round up." },
          { step: 3, m: "9 + 1 = 10", say: "The 9 becomes 10: write 0 and carry 1 to the thousands, which makes 4." },
          { step: 4, m: "\\text{4,000}", say: "The digits to the right become 0." }] },
        gate: true },
      { type: "numberline", kicker: "Try it", prompt: "A number line shows why. 37 is between 30 and 40. Drag the point to the ten that 37 rounds to.",
        min: 30, max: 40, mode: "point", points: [{ v: 37, drag: true }], answer: { points: [40] }, skill: "Round whole numbers",
        hints: ["Is 37 closer to 30 or to 40?"], why: "37 is 3 steps from 40 and 7 steps from 30, so it rounds to 40." },
      { type: "choice", kicker: "Find the error",
        prompt: "Rounding 4,549 to the nearest hundred, Ty first rounds it to 4,550 and then rounds that to 4,600. What is wrong?",
        options: [{ t: "Round once, using only the tens digit, 4: the answer is 4,500." },
                  { t: "The answer should be 5,000.", fb: "That is the nearest thousand. The question asks for the nearest hundred." },
                  { t: "Nothing. 4,600 is right.", fb: "4,549 is 49 away from 4,500 but 51 away from 4,600." }],
        answer: 0, skill: "Round whole numbers", hints: ["Step 2: which single digit should he look at?"], why: "The digit right of the hundreds place is 4, which is less than 5." },
      { type: "choice", kicker: "Use it", prompt: "A stadium counted 48,712 fans. A reporter rounds that to the nearest thousand. What does she write?",
        options: [{ t: "49,000" }, { t: "48,000", fb: "The hundreds digit is 7, which is 5 or more: round up." }, { t: "48,700", fb: "That is the nearest hundred." }],
        answer: 0, skill: "Round whole numbers", hints: ["The thousands digit is 8. Look at the digit to its right."], why: "7 is 5 or more, so the 8 becomes 9: 49,000." }
    ]
  });

  /* ================================================== 1.2 · Add whole numbers */
  var HOW_1_2 = [["Line up", "Write the numbers so that each place value lines up."],
                 ["Ones first", "Add the digits in each place, starting from the ones."],
                 ["Carry", "If a sum is more than 9, write its ones digit and carry the 1 to the next place."]];
  LESSONS.push({
    title: "Add whole numbers",
    blurb: "Book 1.2 · Addition notation, adding in columns with carrying, and addition in words and in use.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $8 + 7$?", answer: 15, skill: "Number facts",
        near: [{ v: 56, fb: "That is $8 \\times 7$." }], hints: ["8 and 2 make 10, with 5 more."], why: "$8 + 7 = 15$." },
      { type: "learn", kicker: "The idea",
        prompt: "The numbers being added are **addends**, and the result is the **sum**. To add large numbers, add one place value at a time, from the right. Ten ones make one ten, so any column that reaches 10 passes a 1 to the next column.",
        scene: { type: "method", how: HOW_1_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $247 + 158$ added in columns.",
        scene: { type: "walk", how: HOW_1_2, rows: [
          { step: 1, m: "247 + 158", say: "Ones under ones, tens under tens, hundreds under hundreds.", fig: stack("+", [247, 158], null, { carry: "   " }) },
          { step: 2, m: "7 + 8 = 15", say: "The ones: 15 is 1 ten and 5 ones. Write the 5.", fig: stack("+", [247, 158], "  5", { carry: " 1 " }) },
          { step: 3, m: "1 + 4 + 5 = 10", say: "The tens, with the carried 1. Write 0 and carry 1 again.", fig: stack("+", [247, 158], " 05", { carry: "11 " }),
            ask: { prompt: "The ones made 15. What happens to the 1?", answer: 0,
                   options: [{ t: "It is carried to the tens column" }, { t: "It is dropped", fb: "That 1 is a whole ten. Losing it would make the answer 10 too small." }] } },
          { step: 3, m: "1 + 2 + 1 = 4", say: "The hundreds, with the carried 1.", fig: stack("+", [247, 158], "405", { carry: "11 " }) }] },
        gate: true, then: "$247 + 158 = 405$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you add $386 + 475$.",
        how: HOW_1_2, skill: "Add whole numbers",
        steps: [
          { step: 1, ask: "Which digits are added first?", type: "choice", answer: 0,
            options: [{ t: "The ones: 6 and 5" }, { t: "The hundreds: 3 and 4", fb: "Start from the right, so that carries can move left." }],
            m: "386 + 475", say: "Lined up by place value." },
          { step: 2, ask: "Add the ones: $6 + 5$.", type: "num", answer: 11, hint: "$6 + 5$.",
            m: "6 + 5 = 11", say: "Write 1 and carry 1." },
          { step: 3, ask: "Add the tens with the carry: $1 + 8 + 7$.", type: "num", answer: 16, near: [{ v: 15, fb: "Don't forget the carried 1." }], hint: "$8 + 7 = 15$, plus 1.",
            m: "1 + 8 + 7 = 16", say: "Write 6 and carry 1." },
          { step: 3, ask: "Add the hundreds with the carry: $1 + 3 + 4$.", type: "num", answer: 8, near: [{ v: 7, fb: "Don't forget the carried 1." }], hint: "$3 + 4 = 7$, plus 1.",
            m: "386 + 475 = 861", say: "8 hundreds, 6 tens, 1 one." }],
        why: "Line up, ones first, carry. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Add $529 + 364$.", answer: 893, skill: "Add whole numbers",
        near: [{ v: 883, fb: "$9 + 4 = 13$: carry the 1 into the tens." }, { v: 8813, fb: "A column holds one digit. Write the 3 and carry the 1." }],
        hints: ["Ones: $9 + 4 = 13$. Write 3, carry 1."], why: "Ones 13, tens $1 + 2 + 6 = 9$, hundreds $5 + 3 = 8$: 893." },
      { type: "num", prompt: "“The **sum** of 19 and 27” is an addition. What is it?", answer: 46, skill: "Translate to addition",
        near: [{ v: 36, fb: "$9 + 7 = 16$: carry the 1." }, { v: 8, fb: "A sum is an addition, not a subtraction." }],
        hints: ["$19 + 27$."], why: "$19 + 27 = 46$. “Sum”, “plus”, “increased by” and “total” all mean add." },
      { type: "learn", kicker: "A harder case",
        prompt: "The numbers need not be the same length. Line up the ones and the rest follows. Add $1683 + 79 + 506$.",
        scene: { type: "walk", how: HOW_1_2, rows: [
          { step: 1, m: "1683 + 79 + 506", say: "Three addends, lined up on the right.", fig: stack("+", [1683, 79, 506], null, { carry: "    " }) },
          { step: 2, m: "3 + 9 + 6 = 18", say: "The ones: write 8, carry 1.", fig: stack("+", [1683, 79, 506], "   8", { carry: "  1 " }) },
          { step: 3, m: "1 + 8 + 7 + 0 = 16", say: "The tens: write 6, carry 1.", fig: stack("+", [1683, 79, 506], "  68", { carry: " 11 " }) },
          { step: 3, m: "1 + 6 + 5 = 12", say: "The hundreds: write 2, carry 1.", fig: stack("+", [1683, 79, 506], " 268", { carry: "111 " }) },
          { step: 3, m: "1 + 1 = 2", say: "The thousands. The sum is 2,268.", fig: stack("+", [1683, 79, 506], "2268", { carry: "111 " }) }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The **perimeter** of a shape is the sum of its sides. A patio has sides of 4, 6, 2, 3, 2 and 9 feet. What is its perimeter?",
        post: "feet", answer: 26, skill: "Add whole numbers",
        near: [{ v: 24, fb: "There are six sides. Check that you added all of them." }],
        hints: ["$4 + 6 + 2 + 3 + 2 + 9$."], why: "$10 + 5 + 11 = 26$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where adding $58 + 67$ **first** goes wrong.",
        lines: ["8 + 7 = 15", "5 + 6 = 11", "58 + 67 = 115"], answer: 1, fix: "1 + 5 + 6 = 12",
        fb: { 0: "The ones are right: write 5, carry 1.", 2: LATER }, skill: "Add whole numbers",
        hints: ["What happened to the 1 carried from the ones?"],
        why: "The carried 1 joins the tens: $1 + 5 + 6 = 12$, so the sum is 125." },
      { type: "num", kicker: "Use it", prompt: "Hao drove **317 miles** on Monday and **285 miles** on Tuesday. How far did he drive in all?",
        post: "miles", answer: 602, skill: "Add whole numbers",
        near: [{ v: 592, fb: "$1 + 1 + 8 = 10$ in the tens: carry into the hundreds." }, { v: 32, fb: "“In all” means add." }],
        hints: ["$317 + 285$."], why: "Ones 12, tens $1 + 1 + 8 = 10$, hundreds $1 + 3 + 2 = 6$: 602." }
    ]
  });

  /* ============================================= 1.3 · Subtract whole numbers */
  var HOW_1_3 = [["Line up", "Write the numbers so that each place value lines up, larger number on top."],
                 ["Subtract", "Work one place at a time, from the ones. If the top digit is smaller, borrow 1 from the next place: the top digit gains 10."],
                 ["Check", "Check by adding: the difference plus the number subtracted gives the number you started with."]];
  LESSONS.push({
    title: "Subtract whole numbers",
    blurb: "Book 1.3 · Subtraction notation, subtracting in columns with borrowing, and checking by adding.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $15 - 8$?", answer: 7, skill: "Number facts",
        near: [{ v: 23, fb: "That is $15 + 8$." }], hints: ["8 and what make 15?"], why: "$8 + 7 = 15$, so $15 - 8 = 7$." },
      { type: "learn", kicker: "The idea",
        prompt: "The result of a subtraction is the **difference**. Subtraction undoes addition, which gives a built-in check. In columns, when the top digit is too small, **borrow**: one ten from the next place becomes ten ones here.",
        scene: { type: "method", how: HOW_1_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $543 - 268$ subtracted in columns.",
        scene: { type: "walk", how: HOW_1_3, rows: [
          { step: 1, m: "543 - 268", say: "Lined up by place value.", fig: stack("−", [543, 268]) },
          { step: 2, m: "13 - 8 = 5", say: "The ones: 3 is too small, so borrow a ten. The 4 tens become 3, and the 3 ones become 13.", fig: stack("−", [543, 268], "  5"),
            ask: { prompt: "3 is less than 8. What does borrowing a ten give you in the ones place?", answer: 0,
                   options: [{ t: "13" }, { t: "4", fb: "A borrowed ten is worth 10 ones: $3 + 10$." }] } },
          { step: 2, m: "13 - 6 = 7", say: "The tens: 3 is too small again. Borrow a hundred: the 5 becomes 4, and the 3 tens become 13.", fig: stack("−", [543, 268], " 75") },
          { step: 2, m: "4 - 2 = 2", say: "The hundreds: 4 are left.", fig: stack("−", [543, 268], "275") },
          { step: 3, m: "275 + 268 = 543", say: "Adding back gives the top number. ✓" }] },
        gate: true, then: "$543 - 268 = 275$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you subtract $702 - 356$. There is a zero to borrow across.",
        how: HOW_1_3, skill: "Subtract whole numbers",
        steps: [
          { step: 1, ask: "Which number goes on top?", type: "choice", answer: 0,
            options: [{ t: "702, the number you are subtracting from" }, { t: "356", fb: "The number being taken away goes underneath." }],
            m: "702 - 356", say: "Larger number on top." },
          { step: 2, ask: "The tens digit is 0, so borrow from the hundreds: 70 tens become 69 tens, and the ones become 12. What is $12 - 6$?", type: "num", answer: 6, hint: "$12 - 6$.",
            m: "12 - 6 = 6", say: "The ones." },
          { step: 2, ask: "The tens are now 9. What is $9 - 5$?", type: "num", answer: 4, hint: "$9 - 5$.",
            m: "9 - 5 = 4", say: "The tens." },
          { step: 2, ask: "The hundreds are now 6. What is $6 - 3$?", type: "num", answer: 3, hint: "$6 - 3$.",
            m: "702 - 356 = 346", say: "The hundreds." },
          { step: 3, ask: "Check by adding: what is $346 + 356$?", type: "num", answer: 702, near: [{ v: 692, fb: "$6 + 6 = 12$: carry the 1." }], hint: "Ones 12, tens $1 + 4 + 5$, hundreds $1 + 3 + 3$.",
            m: "346 + 356 = 702", say: "It matches the top number. ✓" }],
        why: "Line up, subtract and borrow, check. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Subtract $825 - 367$.", answer: 458, skill: "Subtract whole numbers",
        near: [{ v: 542, fb: "Subtract the bottom digit from the top one in every column, borrowing when the top is smaller." }, { v: 468, fb: "After lending a ten, the tens digit is 1, not 2." }],
        hints: ["Ones: borrow, $15 - 7 = 8$. Tens: 1 is left, so borrow again."], why: "$15 - 7 = 8$, $11 - 6 = 5$, $7 - 3 = 4$: 458." },
      { type: "num", prompt: "“The **difference** of 52 and 17” is a subtraction. What is it?", answer: 35, skill: "Translate to subtraction",
        near: [{ v: 69, fb: "A difference is a subtraction." }, { v: 45, fb: "Borrow: $12 - 7 = 5$, and then 4 tens are left." }],
        hints: ["$52 - 17$."], why: "$52 - 17 = 35$. “Difference”, “minus”, “less than” and “decreased by” all mean subtract." },
      { type: "learn", kicker: "A harder case",
        prompt: "Borrowing across several zeros works the same way. Subtract $5000 - 1846$.",
        scene: { type: "walk", how: HOW_1_3, rows: [
          { step: 1, m: "5000 - 1846", say: "Three zeros on top.", fig: stack("−", [5000, 1846]) },
          { step: 2, m: "5000 = 4990 + 10", say: "Borrow once from the 5: think of 5000 as 499 tens and 10 ones." },
          { step: 2, m: "10 - 6 = 4 \\quad 9 - 4 = 5 \\quad 9 - 8 = 1 \\quad 4 - 1 = 3", say: "Now every column subtracts cleanly, right to left.", fig: stack("−", [5000, 1846], "3154") },
          { step: 3, m: "3154 + 1846 = 5000", say: "The check. ✓" }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Subtract $90 - 37$, then check by adding.", answer: 53, skill: "Subtract whole numbers",
        near: [{ v: 67, fb: "Borrow: $10 - 7 = 3$, and then 8 tens are left." }, { v: 63, fb: "After lending a ten, the 9 becomes 8." }],
        hints: ["$10 - 7 = 3$, then $8 - 3 = 5$."], why: "$90 - 37 = 53$, and $53 + 37 = 90$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where subtracting $62 - 38$ **first** goes wrong.",
        lines: ["12 - 8 = 4", "6 - 3 = 3", "62 - 38 = 34"], answer: 1, fix: "5 - 3 = 2",
        fb: { 0: "The ones are right: a ten was borrowed.", 2: LATER }, skill: "Subtract whole numbers",
        hints: ["A ten was borrowed for the ones. How many tens are left on top?"],
        why: "After lending a ten, the 6 is 5: $5 - 3 = 2$, so the difference is 24. Check: $24 + 38 = 62$." },
      { type: "num", kicker: "Use it", prompt: "A phone costs **\\$640**. Mira has saved **\\$375**. How much more does she need?",
        pre: "$\\$$", answer: 265, skill: "Subtract whole numbers",
        near: [{ v: 1015, fb: "“How much more” is a difference: subtract." }, { v: 275, fb: "After lending a ten, the 4 tens become 3, and you must borrow again." }],
        hints: ["$640 - 375$."], why: "$10 - 5 = 5$, $13 - 7 = 6$, $5 - 3 = 2$: 265." }
    ]
  });
  /* ============================================= 1.4 · Multiply whole numbers */
  var HOW_1_4 = [["Line up", "Write the numbers one above the other, lined up on the right."],
                 ["Multiply", "Multiply the top number by each digit of the bottom number, one digit at a time."],
                 ["Add", "Add the partial products."]];
  LESSONS.push({
    title: "Multiply whole numbers",
    blurb: "Book 1.4 · Multiplication notation, partial products, the properties of 0 and 1, and area.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $9 \\times 6$?", answer: 54, skill: "Number facts",
        near: [{ v: 15, fb: "That is $9 + 6$." }, { v: 56, fb: "$9 \\times 6$ is six less than $10 \\times 6$." }], hints: ["$10 \\times 6$, less one 6."], why: "$60 - 6 = 54$." },
      { type: "learn", kicker: "Explore", prompt: "A product is the area of a rectangle. Split $13 \\times 24$ into tens and ones, and fill in the area of each piece.",
        scene: { type: "tiles", mode: "area", rows: ["10", "3"], cols: ["20", "4"], cells: [["200", "40"], ["60", "12"]], readout: "$13 \\times 24 = 200 + 40 + 60 + 12 = 312$", gate: true }, gate: true,
        then: "Four small products, added up. Multiplying in columns does exactly this, two pieces at a time." },
      { type: "learn", kicker: "The idea",
        prompt: "Multiplication is repeated addition: $4 \\times 6$ is four 6s. The numbers multiplied are **factors**, and the result is the **product**. For large numbers, multiply by one digit at a time and add the **partial products**.",
        scene: { type: "method", how: HOW_1_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $47 \\times 36$ multiplied.",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "47 \\times 36", say: "Lined up on the right.", fig: stack("×", [47, 36]) },
          { step: 2, m: "47 \\times 6 = 282", say: "First by the ones digit, 6: $6 \\cdot 7 = 42$, write 2 and carry 4. Then $6 \\cdot 4 + 4 = 28$." },
          { step: 2, m: "47 \\times 30 = 1410", say: "Then by the tens digit. It stands for 30, so this product ends in 0.",
            ask: { prompt: "What does the 3 in 36 stand for?", answer: 0,
                   options: [{ t: "30" }, { t: "3", fb: "It is in the tens place: 3 tens." }] } },
          { step: 3, m: "282 + 1410 = 1692", say: "Add the two partial products.", fig: stack("+", [282, 1410], "1692") }] },
        gate: true, then: "$47 \\times 36 = 1692$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you multiply $58 \\times 24$.",
        how: HOW_1_4, skill: "Multiply whole numbers",
        steps: [
          { step: 1, ask: "Which digit of 24 do you multiply by first?", type: "choice", answer: 0,
            options: [{ t: "The 4, in the ones place" }, { t: "The 2, in the tens place", fb: "Start with the ones digit, as with adding." }],
            m: "58 \\times 24", say: "Ones digit first." },
          { step: 2, ask: "What is $58 \\times 4$?", type: "num", answer: 232, near: [{ v: 202, fb: "$4 \\cdot 8 = 32$: write 2 and carry 3. Then $4 \\cdot 5 + 3$." }], hint: "$4 \\cdot 8 = 32$, then $4 \\cdot 5 + 3 = 23$.",
            m: "58 \\times 4 = 232", say: "The first partial product." },
          { step: 2, ask: "What is $58 \\times 20$?", type: "num", answer: 1160, near: [big(1160), { v: 116, fb: "The 2 stands for 20, so the product ends in 0." }], hint: "$58 \\times 2 = 116$, then a zero.",
            m: "58 \\times 20 = 1160", say: "The second partial product." },
          { step: 3, ask: "Add them: $232 + 1160$.", type: "num", answer: 1392, near: [big(1392)], hint: "$232 + 1160$.",
            m: "232 + 1160 = 1392", say: "$58 \\times 24 = 1392$." }],
        why: "Line up, multiply by each digit, add. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Multiply $36 \\times 7$.", answer: 252, skill: "Multiply whole numbers",
        near: [{ v: 212, fb: "$7 \\cdot 6 = 42$: carry the 4, then $7 \\cdot 3 + 4$." }, { v: 2142, fb: "A column holds one digit. Write the 2 and carry the 4." }],
        hints: ["$7 \\cdot 6 = 42$. Write 2, carry 4."], why: "$7 \\cdot 6 = 42$, and $7 \\cdot 3 + 4 = 25$: 252." },
      { type: "num", prompt: "“The **product** of 12 and 15” is a multiplication. What is it?", answer: 180, skill: "Translate to multiplication",
        near: [{ v: 27, fb: "A product is a multiplication, not an addition." }],
        hints: ["$12 \\times 5 = 60$ and $12 \\times 10 = 120$."], why: "$60 + 120 = 180$. “Product”, “times” and “twice” all mean multiply." },
      { type: "learn", kicker: "A harder case",
        prompt: "A zero inside a factor is no trouble: it gives zero in that place. Multiply $304 \\times 26$.",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "304 \\times 26", say: "Lined up on the right.", fig: stack("×", [304, 26]) },
          { step: 2, m: "304 \\times 6 = 1824", say: "$6 \\cdot 4 = 24$, carry 2. $6 \\cdot 0 + 2 = 2$. $6 \\cdot 3 = 18$." },
          { step: 2, m: "304 \\times 20 = 6080", say: "$304 \\times 2 = 608$, with a zero for the tens place." },
          { step: 3, m: "1824 + 6080 = 7904", say: "Add the partial products.", fig: stack("+", [1824, 6080], "7904") }] },
        gate: true },
      { type: "slots", kicker: "Try it", prompt: "Three properties of multiplication. Match each equation to its property.",
        slots: [{ id: "a", label: "Identity Property" }, { id: "b", label: "Property of Zero" }, { id: "c", label: "Commutative Property" }],
        cards: [{ t: "$9 \\times 1 = 9$", slot: "a", fb: "Multiplying by 1 leaves a number as it is." },
                { t: "$9 \\times 0 = 0$", slot: "b", fb: "Any number times 0 is 0." },
                { t: "$4 \\times 7 = 7 \\times 4$", slot: "c", fb: "The order of the factors does not change the product." }],
        skill: "Multiplication properties", hints: ["Which one keeps the number? Which one gives 0? Which one swaps the factors?"],
        why: "1 is the multiplicative identity, 0 wipes a product out, and the factors can change places." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where multiplying $23 \\times 14$ **first** goes wrong.",
        lines: ["23 \\times 4 = 92", "23 \\times 1 = 23", "92 + 23 = 115"], answer: 1, fix: "23 \\times 10 = 230",
        fb: { 0: "The first partial product is right.", 2: LATER }, skill: "Multiply whole numbers",
        hints: ["Which place is the 1 of 14 in?"],
        why: "The 1 stands for 10: $23 \\times 10 = 230$, and $92 + 230 = 322$." },
      { type: "num", kicker: "Use it", prompt: "The **area** of a rectangle is its length times its width. A room is **14 feet** by **12 feet**. What is its area?",
        post: "square feet", answer: 168, skill: "Multiply whole numbers",
        near: [{ v: 52, fb: "That is the perimeter. Area is length **times** width." }, { v: 26, fb: "That adds the two sides. Area multiplies them." }],
        hints: ["$14 \\times 12 = 14 \\times 2 + 14 \\times 10$."], why: "$28 + 140 = 168$." }
    ]
  });

  /* =============================================== 1.5 · Divide whole numbers */
  var HOW_1_5 = [["Set up", "Start with the first digit, or first digits, of the dividend that the divisor goes into."],
                 ["Repeat", "Divide, multiply back, subtract, and bring down the next digit. Repeat until no digits are left."],
                 ["Check", "Check: quotient times divisor, plus any remainder, gives the dividend."]];
  LESSONS.push({
    title: "Divide whole numbers",
    blurb: "Book 1.5 · Division notation, long division, remainders, and division with 0 and 1.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "What is $42 \\div 6$?", answer: 7, skill: "Number facts",
        near: [{ v: 36, fb: "That is $42 - 6$." }], hints: ["How many 6s make 42?"], why: "$6 \\times 7 = 42$." },
      { type: "learn", kicker: "The idea",
        prompt: "Division shares a number into equal groups. The number being divided is the **dividend**, the number of groups is the **divisor**, and the answer is the **quotient**. Long division works from the left, one digit at a time.",
        scene: { type: "method", how: HOW_1_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $852 \\div 6$ worked out.",
        scene: { type: "walk", how: HOW_1_5, rows: [
          { step: 1, m: "852 \\div 6", say: "6 goes into 8, so start with the first digit." },
          { step: 2, m: "8 = 6 \\cdot 1 + 2", say: "6 goes into 8 once, with 2 left. Write 1 in the quotient, and bring down the 5 to make 25." },
          { step: 2, m: "25 = 6 \\cdot 4 + 1", say: "6 goes into 25 four times, with 1 left. Write 4, and bring down the 2 to make 12.",
            ask: { prompt: "How many times does 6 go into 25?", answer: 0,
                   options: [{ t: "4 times, with 1 left over" }, { t: "5 times", fb: "$6 \\cdot 5 = 30$, which is more than 25." }, { t: "3 times", fb: "$6 \\cdot 3 = 18$ leaves 7, and another 6 still fits." }] } },
          { step: 2, m: "12 = 6 \\cdot 2", say: "6 goes into 12 twice, with nothing left. Write 2." },
          { step: 3, m: "142 \\cdot 6 = 852", say: "The quotient is 142, and multiplying back gives the dividend. ✓" }] },
        gate: true, then: "$852 \\div 6 = 142$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you divide $3792 \\div 8$.",
        how: HOW_1_5, skill: "Divide whole numbers",
        steps: [
          { step: 1, ask: "8 does not go into 3. So where do you start?", type: "choice", answer: 0,
            options: [{ t: "With the first two digits: 37" }, { t: "With the last digit: 2", fb: "Long division works from the left." }],
            m: "3792 \\div 8", say: "Start with 37." },
          { step: 2, ask: "How many times does 8 go into 37?", type: "num", answer: 4, near: [{ v: 5, fb: "$8 \\cdot 5 = 40$, which is more than 37." }], hint: "$8 \\cdot 4 = 32$.",
            m: "37 = 8 \\cdot 4 + 5", say: "Write 4. 5 is left: bring down the 9 to make 59." },
          { step: 2, ask: "How many times does 8 go into 59?", type: "num", answer: 7, near: [{ v: 8, fb: "$8 \\cdot 8 = 64$, which is more than 59." }], hint: "$8 \\cdot 7 = 56$.",
            m: "59 = 8 \\cdot 7 + 3", say: "Write 7. 3 is left: bring down the 2 to make 32." },
          { step: 2, ask: "How many times does 8 go into 32?", type: "num", answer: 4, hint: "$8 \\cdot 4$.",
            m: "32 = 8 \\cdot 4", say: "Write 4. Nothing is left." },
          { step: 3, ask: "The quotient is 474. Check: what is $474 \\times 8$?", type: "num", answer: 3792, near: [big(3792)], hint: "$8 \\cdot 4 = 32$, $8 \\cdot 7 + 3 = 59$, $8 \\cdot 4 + 5 = 37$.",
            m: "474 \\cdot 8 = 3792", say: "It matches the dividend. ✓" }],
        why: "Set up, repeat, check. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Divide $96 \\div 4$.", answer: 24, skill: "Divide whole numbers",
        near: [{ v: 22, fb: "$9 = 4 \\cdot 2 + 1$. Bring down the 6 to make 16, and $16 \\div 4 = 4$." }],
        hints: ["4 goes into 9 twice, with 1 left. Bring down the 6."], why: "$24 \\cdot 4 = 96$." },
      { type: "num", prompt: "Not every division comes out evenly. What is the **remainder** when 47 is divided by 5?", answer: 2, skill: "Remainders",
        near: [{ v: 9, fb: "9 is the quotient. The remainder is what is left over." }], hints: ["$5 \\cdot 9 = 45$. How much of 47 is left?"], why: "$47 = 5 \\cdot 9 + 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the divisor does not go into the number you have, write a 0 in the quotient to hold the place. Divide $1224 \\div 12$.",
        scene: { type: "walk", how: HOW_1_5, rows: [
          { step: 1, m: "1224 \\div 12", say: "12 does not go into 1, so start with 12." },
          { step: 2, m: "12 = 12 \\cdot 1", say: "Write 1. Nothing is left. Bring down the 2." },
          { step: 2, m: "2 = 12 \\cdot 0 + 2", say: "12 does not go into 2. Write 0, and bring down the 4 to make 24." },
          { step: 2, m: "24 = 12 \\cdot 2", say: "Write 2." },
          { step: 3, m: "102 \\cdot 12 = 1224", say: "The quotient is 102. Without the 0 it would have come out as 12. ✓" }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Zero and division need care. One of these is undefined. Which?",
        options: [{ t: "$7 \\div 0$" }, { t: "$0 \\div 7$", fb: "0 shared among 7 is 0." }, { t: "$7 \\div 1$", fb: "Any number divided by 1 is itself: 7." }],
        answer: 0, skill: "Division properties", hints: ["Check each by multiplying: what times 0 gives 7?"], why: "No number times 0 gives 7, so dividing by 0 has no answer." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where dividing $624 \\div 6$ **first** goes wrong.",
        lines: ["6 \\div 6 = 1", "24 \\div 6 = 4", "624 \\div 6 = 14"], answer: 2, fix: "624 \\div 6 = 104",
        fb: { 0: "The first digit is right: write 1.", 1: "This is true as well. But before it, 6 did not go into the 2. What goes in the quotient then?" }, skill: "Divide whole numbers",
        hints: ["Check it: is $14 \\cdot 6$ equal to 624?"],
        why: "6 does not go into 2, so a 0 holds the tens place: the quotient is 104." },
      { type: "num", kicker: "Use it", prompt: "A club has **\\$432** to share equally among its **9** members. How much does each member get?",
        pre: "$\\$$", answer: 48, skill: "Divide whole numbers",
        near: [{ v: 423, fb: "“Share equally” means divide." }, { v: 408, fb: "$43 = 9 \\cdot 4 + 7$. Bring down the 2 to make 72." }],
        hints: ["9 goes into 43 four times, with 7 left. Bring down the 2."], why: "$48 \\cdot 9 = 432$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "pa1-round", title: "Round whole numbers", lesson: 2,
      gen: function (R) {
        var n = R.int(1200, 98999), P = R.pick([[10, "ten"], [100, "hundred"], [1000, "thousand"]]), p = P[0];
        if (n % p === 0) n += R.int(1, p - 1);
        var ans = Math.round(n / p) * p, other = ans > n ? ans - p : ans + p;
        return { type: "num", prompt: "Round " + commas(n) + " to the nearest " + P[1] + ". (Type it without a comma.)", answer: ans,
          near: nearBig(ans, [{ v: other, fb: "Look at the digit just right of the " + P[1] + "s place: is it 5 or more?" }]),
          hints: ["Find the " + P[1] + "s digit, then look at the digit to its right."], why: commas(n) + " is closer to " + commas(ans) + " than to " + commas(other) + "." };
      } },
    { id: "pa1-add", title: "Add whole numbers", lesson: 3,
      gen: function (R) {
        var a = R.int(120, 890), b = R.int(105, 780), ans = a + b;
        return { type: "num", prompt: "Add. $$" + a + " + " + b + "$$", answer: ans,
          near: nearBig(ans, [{ v: ans - 10, fb: "Check the ones column: was a 1 carried into the tens?" }, { v: ans - 100, fb: "Check the tens column: was a 1 carried into the hundreds?" }]),
          hints: ["Add the ones first, and carry when a column reaches 10."], why: "$" + a + " + " + b + " = " + ans + "$." };
      } },
    { id: "pa1-subtract", title: "Subtract whole numbers", lesson: 4,
      gen: function (R) {
        var b = R.int(115, 680), ans = R.int(108, 590), a = b + ans;
        return { type: "num", prompt: "Subtract. $$" + a + " - " + b + "$$", answer: ans,
          near: near(ans, [{ v: ans + 10, fb: "After lending a ten to the ones, the tens digit on top is one less." }, { v: a + b, fb: "This is a subtraction." }]),
          hints: ["Borrow from the next place whenever the top digit is smaller. Then check by adding."], why: "$" + ans + " + " + b + " = " + a + "$, so $" + a + " - " + b + " = " + ans + "$." };
      } },
    { id: "pa1-multiply", title: "Multiply whole numbers", lesson: 5,
      gen: function (R) {
        var a = R.int(13, 79), b = R.chance(0.5) ? R.int(3, 9) : R.int(12, 39), ans = a * b;
        var why = b < 10 ? "$" + a + " \\times " + b + " = " + ans + "$." : "$" + a + " \\times " + (b % 10) + " = " + a * (b % 10) + "$ and $" + a + " \\times " + (b - b % 10) + " = " + a * (b - b % 10) + "$. Together: $" + ans + "$.";
        return { type: "num", prompt: "Multiply. $$" + a + " \\times " + b + "$$", answer: ans,
          near: nearBig(ans, b < 10 ? [{ v: a + b, fb: "This is a multiplication." }] : [{ v: a * (b % 10) + a * Math.floor(b / 10), fb: "The tens digit of " + b + " stands for " + (b - b % 10) + ", so that partial product ends in 0." }]),
          hints: [b < 10 ? "Multiply the ones, carry, then multiply the tens." : "Multiply by the ones digit, then by the tens digit, and add."], why: why };
      } },
    { id: "pa1-divide", title: "Divide whole numbers", lesson: 6,
      gen: function (R) {
        var d = R.int(3, 9), q = R.int(14, 148), n = d * q;
        return { type: "num", prompt: "Divide. $$" + n + " \\div " + d + "$$", answer: q,
          near: near(q, [{ v: n - d, fb: "This is a division." }]),
          hints: ["Work from the left, one digit at a time. Then check by multiplying."], why: "$" + q + " \\cdot " + d + " = " + n + "$." };
      } }
  ];
  L.unit("prealg", 1, {
    title: "Whole Numbers",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Rounding, adding and subtracting whole numbers.",
        skills: ["pa1-round", "pa1-add", "pa1-subtract"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Multiplying and dividing whole numbers.",
        skills: ["pa1-multiply", "pa1-divide"], per: 3 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:1", {
    2: { name: "Place value and rounding", frame: "Each place is worth [[ten]] times the place to its right. To round, look at the digit just to the [[right]]. If it is [[5 or more]], round up. Then the digits to the right become [[zeros]].",
         chips: ["left", "less than 5"], fb: { "left": "The digit to the left is not changed by rounding. The neighbour on the right decides." } },
    3: { name: "Adding whole numbers", frame: "Line up the [[place values]] and add from the [[ones]] place. When a column's sum is more than 9, [[carry]] to the next place. The answer is called the [[sum]].",
         chips: ["hundreds", "product"] },
    4: { name: "Subtracting whole numbers", frame: "The answer to a subtraction is the [[difference]]. When the top digit is smaller, [[borrow]] from the next place. Check a subtraction by [[adding]].",
         chips: ["sum", "dividing"] },
    5: { name: "Multiplying whole numbers", frame: "The numbers being multiplied are [[factors]], and the result is the [[product]]. Multiply by one [[digit]] at a time, then [[add]] the partial products.",
         chips: ["sum", "subtract"] },
    6: { name: "Dividing whole numbers", frame: "The number being divided is the [[dividend]], and the answer is the [[quotient]]. Check a division by [[multiplying]]. What is left over is the [[remainder]].",
         chips: ["divisor", "adding"] }
  });
})();
