/* ==========================================================================
   Prealgebra — Unit 10: Polynomials. See lab/core.js for the format.

   Follows OpenStax Prealgebra 2e, Chapter 10, section for section: the
   readiness check, then 10.1 to 10.6. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   Adding and subtracting polynomials (10.1), the multiplication properties of
   exponents (10.2), multiplying polynomials and FOIL (10.3), dividing
   monomials and the zero exponent (10.4), negative exponents and scientific
   notation (10.5), and factoring out the greatest common factor (10.6).

   Adapted from OpenStax, Prealgebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Seven lessons, six skills, two quizzes, and the unit test.
   ========================================================================== */
(function () {
  "use strict";
  // The keys a student needs to type a polynomial in one letter.
  function polyKeys(v) { return [["$" + v + "$", v], ["$" + v + "^2$", v + "^2"], ["$+$", "+"], ["$-$", "-"]]; }
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
    blurb: "Book: Chapter 10 Be Prepared · Like terms and distributing, exponents, and factors and powers of ten.",
    mins: 6, v: 1,
    steps: [
      { type: "choice", kicker: "Check 1 · Like terms", prompt: "Simplify $8x + 3x$.",
        options: [{ t: "$11x$" }, { t: "$11x^2$", fb: "Adding like terms keeps the variable part: $x$, not $x^2$." }, { t: "$24x$", fb: "Add the coefficients. Do not multiply them." }],
        answer: 0, skill: "Combine like terms", hints: ["$8 + 3$ of the same thing."], why: "$(8 + 3)x = 11x$." },
      { type: "choice", prompt: "Simplify $3(x - 5)$.",
        options: [{ t: "$3x - 15$" }, { t: "$3x - 5$", fb: "The 3 multiplies the 5 as well." }, { t: "$x - 15$", fb: "The 3 multiplies the $x$ as well." }],
        answer: 0, skill: "Distributive property", hints: ["$3 \\cdot x$ and $3 \\cdot 5$."], why: "$3x - 15$." },
      { type: "num", kicker: "Check 2 · Exponents", prompt: "What is $2^5$?", answer: 32, skill: "Exponents",
        near: [{ v: 10, fb: "$2^5$ is five 2s multiplied, not $2 \\cdot 5$." }, { v: 25, fb: "That is $5^2$. Here the base is 2." }], hints: ["$2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2$."], why: "$2^5 = 32$." },
      { type: "num", prompt: "What is $(-3)^2$?", answer: 9, skill: "Exponents",
        near: [{ v: -9, fb: "The parentheses make $-3$ the base: $(-3)(-3)$." }, { v: -6, fb: "$(-3)^2$ is $(-3)(-3)$, not $-3 \\cdot 2$." }], hints: ["$(-3)(-3)$."], why: "Same signs: positive 9." },
      { type: "num", kicker: "Check 3 · Factors and powers of ten", prompt: "Find the greatest common factor of 18 and 24.", answer: 6, skill: "Greatest common factor",
        near: [{ v: 2, fb: "2 divides both, but so does a larger number." }, { v: 72, fb: "That is the least common multiple." }], hints: ["$18 = 6 \\cdot 3$ and $24 = 6 \\cdot 4$."], why: "6 is the largest number that divides both." },
      { type: "num", prompt: "Multiply $4.2 \\cdot 1000$.", answer: 4200, skill: "Powers of 10",
        near: [big(4200), { v: 420, fb: "1000 has three zeros: move the point three places." }], hints: ["Three places to the right."], why: "$4.2 \\to 42 \\to 420 \\to 4200$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 10.1**. If **check 1** slipped, see lessons 2.2 and 7.3. If **check 2** slipped, see lessons 2.1 and 3.4. If **check 3** slipped, see lessons 2.5 and 5.2.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ============================================ 10.1 · Add and subtract polynomials */
  var HOW_10_1 = [["Signs", "For a subtraction, change the sign of every term being subtracted. Then drop the parentheses."],
                  ["Group", "Put like terms together: same variable, same exponent."],
                  ["Combine", "Add the coefficients of each group."]];
  LESSONS.push({
    title: "Add and subtract polynomials",
    blurb: "Book 10.1 · Monomials, binomials and trinomials, the degree of a polynomial, and adding and subtracting them.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which pair are like terms?",
        options: [{ t: "$3x^2$ and $-5x^2$" }, { t: "$3x^2$ and $3x$", fb: "The exponents differ: $x^2$ and $x$." }, { t: "$3x^2$ and $3y^2$", fb: "The variables differ." }],
        answer: 0, skill: "Like terms", hints: ["Same variable, same exponent."], why: "Both are $x^2$ terms." },
      { type: "learn", kicker: "The idea",
        prompt: "A **monomial** is one term, like $5x^2$. A **polynomial** is a monomial or a sum of them: two terms make a binomial, three a trinomial. Its **degree** is the highest exponent. Adding polynomials means combining like terms.",
        scene: { type: "method", how: HOW_10_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one added. $$(5y^2 - 3y + 15) + (3y^2 - 4y - 11)$$",
        scene: { type: "walk", how: HOW_10_1, rows: [
          { step: 1, m: "(5y^2 - 3y + 15) + (3y^2 - 4y - 11)", say: "An addition: no signs change." },
          { step: 1, m: "5y^2 - 3y + 15 + 3y^2 - 4y - 11", say: "Drop the parentheses." },
          { step: 2, m: "5y^2 + 3y^2 - 3y - 4y + 15 - 11", say: "Like terms side by side.",
            ask: { prompt: "Which term is like $5y^2$?", answer: 0,
                   options: [{ t: "$3y^2$" }, { t: "$-3y$", fb: "$-3y$ has exponent 1, not 2." }] } },
          { step: 3, m: "8y^2 - 7y + 4", say: "$5 + 3$, then $-3 - 4$, then $15 - 11$." }] },
        gate: true, then: "The exponents never change when you add: only the coefficients do." },
      { type: "guided", kicker: "Together",
        prompt: "Now you subtract $(9w^2 - 7w + 5) - (2w^2 - 4)$.",
        how: HOW_10_1, skill: "Subtract polynomials",
        steps: [
          { step: 1, ask: "Subtracting changes every sign in the second polynomial. What does $-(2w^2 - 4)$ become?", type: "choice", answer: 0,
            options: [{ t: "$-2w^2 + 4$" }, { t: "$-2w^2 - 4$", fb: "Both signs change: $-(-4) = +4$." }, { t: "$2w^2 - 4$", fb: "The minus sign in front changes every sign inside." }],
            m: "9w^2 - 7w + 5 - 2w^2 + 4", say: "Signs changed, parentheses dropped." },
          { step: 2, ask: "Which term is like $9w^2$?", type: "choice", answer: 0,
            options: [{ t: "$-2w^2$" }, { t: "$-7w$", fb: "$-7w$ has exponent 1." }],
            m: "9w^2 - 2w^2 - 7w + 5 + 4", say: "Like terms side by side." },
          { step: 3, ask: "Combine each group. What is the result?", type: "choice", answer: 0,
            options: [{ t: "$7w^2 - 7w + 9$" }, { t: "$7w^2 - 7w + 1$", fb: "$5 + 4 = 9$: the sign of the 4 changed." }, { t: "$11w^2 - 7w + 9$", fb: "$9w^2 - 2w^2 = 7w^2$." }],
            m: "7w^2 - 7w + 9", say: "$9 - 2$, then $-7w$ alone, then $5 + 4$." }],
        why: "Signs, group, combine. Now two on your own." },
      { type: "sort", kicker: "On your own", prompt: "Monomial, binomial or trinomial?",
        bins: ["Monomial", "Binomial", "Trinomial"],
        cards: [{ t: "$4y^2 - 7y + 2$", bin: 2, fb: "Three terms." }, { t: "$-5a^4$", bin: 0, fb: "One term." }, { t: "$2x^5 - 17$", bin: 1, fb: "Two terms." },
                { t: "$13$", bin: 0, fb: "A constant is a single term." }, { t: "$x^2 + 3x - 1$", bin: 2, fb: "Three terms." }],
        skill: "Name polynomials", hints: ["Count the terms: they are separated by + and − signs."],
        why: "Mono, bi and tri mean one, two and three." },
      { type: "expr", prompt: "Add $(4x^2 + 3x) + (2x^2 - 5x)$.", answer: "6x^2-2x", shown: "6x^2 - 2x", form: "simplified", skill: "Add polynomials",
        near: [{ v: "6x^2+8x", fb: "$3x - 5x = -2x$." }, { v: "4x^3", fb: "Only like terms combine, and the exponents stay as they are." }], keys: polyKeys("x"), placeholder: "Use x",
        hints: ["$4x^2 + 2x^2$, and $3x - 5x$."], why: "$6x^2 - 2x$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A polynomial can be evaluated like any expression. Evaluate $3x^2 - 9x + 7$ when $x = -1$.",
        scene: { type: "walk", how: [["Substitute", "Replace the variable with the value, in parentheses."],
                                    ["Powers", "Work out the exponents first."],
                                    ["Finish", "Multiply, then add and subtract."]], rows: [
          { step: 1, m: "3(-1)^2 - 9(-1) + 7", say: "Parentheses keep the sign with the number." },
          { step: 2, m: "3(1) - 9(-1) + 7", say: "$(-1)^2 = 1$." },
          { step: 3, m: "3 + 9 + 7", say: "$-9 \\cdot (-1) = +9$." },
          { step: 3, m: "19", say: "The value of the polynomial at $-1$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "What is the degree of $6x^3 - 2x^5 + x - 9$?", answer: 5, skill: "Degree",
        near: [{ v: 3, fb: "The degree is the highest exponent, wherever it appears." }, { v: 4, fb: "That is the number of terms. The degree is the highest exponent." }],
        hints: ["Look at every exponent."], why: "The highest exponent is 5." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["(7x^2 + 2x) - (3x^2 - 5x)", "7x^2 + 2x - 3x^2 - 5x", "4x^2 - 3x"], answer: 1, fix: "7x^2 + 2x - 3x^2 + 5x",
        fb: { 0: GIVEN, 2: LATER }, skill: "Subtract polynomials",
        hints: ["What happens to $-5x$ when it is subtracted?"],
        why: "Subtracting $-5x$ adds $5x$: the answer is $4x^2 + 7x$." },
      { type: "num", kicker: "Use it", prompt: "A ball dropped from 250 feet is $-16t^2 + 250$ feet above the ground after $t$ seconds. How high is it after 2 seconds?",
        post: "feet", answer: 186, skill: "Evaluate a polynomial",
        near: [{ v: 1274, fb: "Square the 2 first, then multiply by $-16$." }, { v: 314, fb: "$-16 \\cdot 4$ is negative." }],
        hints: ["$-16(2)^2 + 250$."], why: "$-64 + 250 = 186$." }
    ]
  });

  /* ================================ 10.2 · Multiplication properties of exponents */
  var HOW_10_2 = [["Powers", "Raise every factor in parentheses to the power outside. A power of a power multiplies the exponents."],
                  ["Numbers", "Multiply the coefficients."],
                  ["Same base", "For each variable, add the exponents."]];
  LESSONS.push({
    title: "Multiplication properties of exponents",
    blurb: "Book 10.2 · The product property, the power property, a product to a power, and multiplying monomials.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "$2^3 \\cdot 2^2$ is $(2 \\cdot 2 \\cdot 2)(2 \\cdot 2)$. How many 2s are multiplied in all?", answer: 5, skill: "Product property",
        near: [{ v: 6, fb: "Count the factors: three and two more." }], hints: ["Three, and two more."], why: "$3 + 2 = 5$ factors, so $2^3 \\cdot 2^2 = 2^5$." },
      { type: "learn", kicker: "The idea",
        prompt: "Exponents count factors, so the rules come from counting. $x^2 \\cdot x^3$ has $2 + 3$ factors of $x$: **add**. $(x^2)^3$ is three groups of two: **multiply**. And $(xy)^3$ gives the power to every factor inside: $x^3y^3$.",
        scene: { type: "method", how: HOW_10_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one simplified. $$(5m)^2(3m^3)$$",
        scene: { type: "walk", how: HOW_10_2, rows: [
          { step: 1, m: "(5m)^2(3m^3)", say: "The first factor is a product raised to a power." },
          { step: 1, m: "25m^2 \\cdot 3m^3", say: "Both the 5 and the $m$ are squared.",
            ask: { prompt: "What is $(5m)^2$?", answer: 0,
                   options: [{ t: "$25m^2$" }, { t: "$5m^2$", fb: "The 5 is inside the parentheses, so it is squared too." }, { t: "$10m^2$", fb: "$5^2$ is 25, not 10." }] } },
          { step: 2, m: "75 \\cdot m^2 \\cdot m^3", say: "$25 \\cdot 3 = 75$." },
          { step: 3, m: "75m^5", say: "$2 + 3 = 5$ factors of $m$." }] },
        gate: true, then: "Coefficients are multiplied. Exponents on the same base are added." },
      { type: "guided", kicker: "Together",
        prompt: "Now you simplify $(3y^4)^2 \\cdot y^5$.",
        how: HOW_10_2, skill: "Properties of exponents",
        steps: [
          { step: 1, ask: "Raise each factor to the power. What is $(3y^4)^2$?", type: "choice", answer: 0,
            options: [{ t: "$9y^8$" }, { t: "$6y^8$", fb: "$3^2$ is 9, not 6." }, { t: "$9y^6$", fb: "A power of a power multiplies the exponents: $4 \\cdot 2$." }],
            m: "9y^8 \\cdot y^5", say: "$3^2 = 9$, and $4 \\cdot 2 = 8$." },
          { step: 2, ask: "$y^5$ has coefficient 1. What is $9 \\cdot 1$?", type: "num", answer: 9, hint: "Multiplying by 1 changes nothing.",
            m: "9 \\cdot y^8 \\cdot y^5", say: "The coefficient is 9." },
          { step: 3, ask: "Same base: add the exponents. What is $8 + 5$?", type: "num", answer: 13, near: [{ v: 40, fb: "Multiplying powers of the same base adds the exponents." }], hint: "$8 + 5$.",
            m: "9y^{13}", say: "13 factors of $y$ in all." }],
        why: "Powers, numbers, same base. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Simplify $x^4 \\cdot x^5$. It is $x$ to which power?", answer: 9, skill: "Product property",
        near: [{ v: 20, fb: "Multiplying powers of the same base adds the exponents." }], hints: ["$4 + 5$."], why: "$x^{4 + 5} = x^9$." },
      { type: "choice", prompt: "Multiply the monomials $(-4a^3)(5a^2)$.",
        options: [{ t: "$-20a^5$" }, { t: "$-20a^6$", fb: "Add the exponents: $3 + 2$." }, { t: "$a^5$", fb: "The coefficients are multiplied: $-4 \\cdot 5$." }],
        answer: 0, skill: "Multiply monomials", hints: ["$-4 \\cdot 5$, and $a^{3 + 2}$."], why: "$-20a^5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two variables are handled one at a time. $$(3x^2y)^2(2xy^3)$$",
        scene: { type: "walk", how: HOW_10_2, rows: [
          { step: 1, m: "(3x^2y)^2(2xy^3)", say: "The first factor is squared." },
          { step: 1, m: "9x^4y^2 \\cdot 2xy^3", say: "Every factor inside is squared: $3^2$, $(x^2)^2$ and $y^2$." },
          { step: 2, m: "18 \\cdot x^4 x \\cdot y^2 y^3", say: "$9 \\cdot 2 = 18$." },
          { step: 3, m: "18x^5y^5", say: "For $x$: $4 + 1$. For $y$: $2 + 3$." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Simplify $(x^3)^4$. It is $x$ to which power?", answer: 12, skill: "Power property",
        near: [{ v: 7, fb: "A power of a power multiplies the exponents." }], hints: ["Four groups of three."], why: "$x^{3 \\cdot 4} = x^{12}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["(x^3)(x^4)", "x^{3 \\cdot 4}", "x^{12}"], answer: 1, fix: "x^{3 + 4}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Product property",
        hints: ["Count the factors of $x$."],
        why: "Two powers multiplied: add the exponents. $x^7$." },
      { type: "choice", kicker: "Use it", prompt: "A square tile has sides of length $3x^2$. What is its area?",
        options: [{ t: "$9x^4$" }, { t: "$6x^4$", fb: "$3^2$ is 9, not 6." }, { t: "$9x^2$", fb: "$(x^2)^2 = x^4$." }],
        answer: 0, skill: "Product to a power", hints: ["$(3x^2)^2$."], why: "$3^2 (x^2)^2 = 9x^4$." }
    ]
  });

  /* =================================================== 10.3 · Multiply polynomials */
  var HOW_10_3 = [["First", "Multiply the first terms."], ["Outer", "Multiply the outer terms."], ["Inner", "Multiply the inner terms."],
                  ["Last", "Multiply the last terms."], ["Combine", "Combine like terms."]];
  LESSONS.push({
    title: "Multiply polynomials",
    blurb: "Book 10.3 · A monomial times a polynomial, two binomials by FOIL, and a binomial times a trinomial.",
    mins: 13, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Distribute: $2x(x + 4)$.",
        options: [{ t: "$2x^2 + 8x$" }, { t: "$2x^2 + 4$", fb: "The $2x$ multiplies the 4 as well." }, { t: "$2x + 8x$", fb: "$2x \\cdot x = 2x^2$." }],
        answer: 0, skill: "Monomial times polynomial", hints: ["$2x \\cdot x$ and $2x \\cdot 4$."], why: "$2x^2 + 8x$." },
      { type: "learn", kicker: "Explore", prompt: "This rectangle is $x + 2$ tall and $x + 5$ wide. Press **Fill in the areas**. The four areas add up to the product.",
        scene: { type: "tiles", mode: "area", rows: ["x", "2"], cols: ["x", "5"], cells: [["x^2", "5x"], ["2x", "10"]], readout: "$(x + 2)(x + 5) = x^2 + 5x + 2x + 10 = x^2 + 7x + 10$", gate: true }, gate: true,
        after: "Four regions: every term of one side times every term of the other." },
      { type: "learn", kicker: "The idea",
        prompt: "To multiply two binomials, every term of the first multiplies every term of the second: four products. **FOIL** names them so that none is missed: First, Outer, Inner, Last.",
        scene: { type: "method", how: HOW_10_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one multiplied. $$(x + 3)(x + 7)$$",
        scene: { type: "walk", how: HOW_10_3, rows: [
          { step: 1, m: "x \\cdot x \\to x^2", say: "The first term of each binomial." },
          { step: 2, m: "x \\cdot 7 \\to 7x", say: "The two outside terms." },
          { step: 3, m: "3 \\cdot x \\to 3x", say: "The two inside terms.",
            ask: { prompt: "Which are the inner terms of $(x + 3)(x + 7)$?", answer: 0,
                   options: [{ t: "3 and $x$" }, { t: "$x$ and 7", fb: "Those are the outer terms: the first and the very last." }] } },
          { step: 4, m: "3 \\cdot 7 \\to 21", say: "The last term of each binomial." },
          { step: 5, m: "x^2 + 7x + 3x + 21", say: "The four products." },
          { step: 5, m: "x^2 + 10x + 21", say: "$7x + 3x = 10x$." }] },
        gate: true, then: "The outer and inner products are usually like terms." },
      { type: "guided", kicker: "Together",
        prompt: "Now you multiply $(2x - 5)(x + 4)$.",
        how: HOW_10_3, skill: "FOIL",
        steps: [
          { step: 1, ask: "First: $2x \\cdot x$.", type: "choice", answer: 0,
            options: [{ t: "$2x^2$" }, { t: "$3x$", fb: "Multiply, do not add." }, { t: "$2x$", fb: "$x \\cdot x = x^2$." }],
            m: "2x^2", say: "First." },
          { step: 2, ask: "Outer: $2x \\cdot 4$.", type: "choice", answer: 0,
            options: [{ t: "$8x$" }, { t: "$6x$", fb: "Multiply, do not add." }],
            m: "2x^2 + 8x", say: "Outer." },
          { step: 3, ask: "Inner: $-5 \\cdot x$.", type: "choice", answer: 0,
            options: [{ t: "$-5x$" }, { t: "$5x$", fb: "The 5 is subtracted, so its sign is negative." }],
            m: "2x^2 + 8x - 5x", say: "Inner. The sign goes with the 5." },
          { step: 4, ask: "Last: $-5 \\cdot 4$.", type: "num", answer: -20, near: [{ v: 20, fb: "Different signs give a negative product." }], hint: "Different signs.",
            m: "2x^2 + 8x - 5x - 20", say: "Last." },
          { step: 5, ask: "Combine the like terms $8x - 5x$.", type: "choice", answer: 0,
            options: [{ t: "$3x$" }, { t: "$13x$", fb: "The $5x$ is subtracted." }, { t: "$-3x$", fb: "$8 - 5$ is positive." }],
            m: "2x^2 + 3x - 20", say: "$8x - 5x = 3x$." }],
        why: "First, outer, inner, last, combine. Now two on your own." },
      { type: "expr", kicker: "On your own", prompt: "Multiply $(x + 4)(x + 9)$.", answer: "x^2+13x+36", shown: "x^2 + 13x + 36", form: "simplified", skill: "FOIL",
        near: [{ v: "x^2+36", fb: "The outer and inner products are missing: $9x + 4x$." }, { v: "x^2+13x+13", fb: "The last terms are multiplied: $4 \\cdot 9$." }], keys: polyKeys("x"), placeholder: "Use x",
        hints: ["$x^2 + 9x + 4x + 36$."], why: "$x^2 + 13x + 36$." },
      { type: "expr", prompt: "Multiply $(y - 3)(y + 8)$.", answer: "y^2+5y-24", shown: "y^2 + 5y - 24", form: "simplified", skill: "FOIL",
        near: [{ v: "y^2+5y+24", fb: "$-3 \\cdot 8$ is negative." }, { v: "y^2-11y-24", fb: "$8y - 3y = 5y$." }], keys: polyKeys("y"), placeholder: "Use y",
        hints: ["$y^2 + 8y - 3y - 24$."], why: "$y^2 + 5y - 24$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A binomial times a trinomial: FOIL has no name for six products, so distribute each term in turn. $$(x + 3)(2x^2 - 5x + 8)$$",
        scene: { type: "walk", how: [["Distribute", "Multiply the whole trinomial by each term of the binomial."], ["Combine", "Combine like terms."]], rows: [
          { step: 1, m: "x(2x^2 - 5x + 8) \\to 2x^3 - 5x^2 + 8x", say: "The $x$ multiplies all three terms." },
          { step: 1, m: "3(2x^2 - 5x + 8) \\to 6x^2 - 15x + 24", say: "Then the 3 does the same." },
          { step: 2, m: "2x^3 - 5x^2 + 6x^2 + 8x - 15x + 24", say: "Six products, like terms side by side." },
          { step: 2, m: "2x^3 + x^2 - 7x + 24", say: "$-5x^2 + 6x^2 = x^2$, and $8x - 15x = -7x$." }] },
        gate: true },
      { type: "expr", kicker: "Try it", prompt: "Multiply $(3x + 1)(x - 2)$.", answer: "3x^2-5x-2", shown: "3x^2 - 5x - 2", form: "simplified", skill: "FOIL",
        near: [{ v: "3x^2-2", fb: "The outer and inner products are missing: $-6x + x$." }, { v: "3x^2+5x-2", fb: "$-6x + x = -5x$." }], keys: polyKeys("x"), placeholder: "Use x",
        hints: ["$3x^2 - 6x + x - 2$."], why: "$3x^2 - 5x - 2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Zoe writes $(x + 5)^2 = x^2 + 25$. What is wrong?",
        options: [{ t: "$(x + 5)^2$ is $(x + 5)(x + 5)$. The outer and inner products give $10x$ as well: $x^2 + 10x + 25$." },
                  { t: "It should be $x^2 + 10$.", fb: "$5 \\cdot 5 = 25$ is right. Something else is missing." },
                  { t: "Nothing. It is right.", fb: "Try $x = 1$: $6^2 = 36$, but $1 + 25 = 26$." }],
        answer: 0, skill: "FOIL", hints: ["Write the square as a product of two binomials."], why: "$x^2 + 5x + 5x + 25$." },
      { type: "choice", kicker: "Use it", prompt: "A garden is $x + 6$ feet long and $x + 2$ feet wide. Which polynomial gives its area?",
        options: [{ t: "$x^2 + 8x + 12$" }, { t: "$x^2 + 12$", fb: "The outer and inner products are missing: $2x + 6x$." }, { t: "$2x + 8$", fb: "That adds the sides. Area multiplies them." }],
        answer: 0, skill: "FOIL", hints: ["$(x + 6)(x + 2)$."], why: "$x^2 + 2x + 6x + 12$." }
    ]
  });
  /* ======================================================= 10.4 · Divide monomials */
  var HOW_10_4 = [["Numbers", "Divide or simplify the coefficients."],
                  ["Same base", "For each variable, subtract the exponents: the larger minus the smaller."],
                  ["Place", "The leftover factors stay where there were more: on top or below. Equal powers cancel to 1."]];
  LESSONS.push({
    title: "Divide monomials",
    blurb: "Book 10.4 · The quotient property, the zero exponent, a quotient to a power, and dividing monomials.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "In $\\frac{x \\cdot x \\cdot x \\cdot x \\cdot x}{x \\cdot x}$, each $x$ below cancels one above. How many factors of $x$ are left on top?", answer: 3, skill: "Quotient property",
        near: [{ v: 7, fb: "Dividing cancels factors. It does not add them." }], hints: ["Five on top, two cancelled."], why: "$5 - 2 = 3$, so $\\frac{x^5}{x^2} = x^3$." },
      { type: "learn", kicker: "The idea",
        prompt: "Dividing cancels common factors, so **subtract** the exponents: $\\frac{x^5}{x^2} = x^3$. If the bottom has more, they stay below: $\\frac{x^2}{x^5} = \\frac{1}{x^3}$. Equal powers cancel completely, which is why $x^0 = 1$.",
        scene: { type: "method", how: HOW_10_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one divided. $$\\frac{54a^2b^3}{-6ab^5}$$",
        scene: { type: "walk", how: HOW_10_4, rows: [
          { step: 1, m: "54 \\div (-6) = -9", say: "The coefficients, with different signs." },
          { step: 2, m: "\\frac{a^2}{a} \\to a", say: "$2 - 1 = 1$ factor of $a$, left on top." },
          { step: 2, m: "\\frac{b^3}{b^5} \\to \\frac{1}{b^2}", say: "$5 - 3 = 2$ factors of $b$, left below.",
            ask: { prompt: "$b^3$ over $b^5$: where are the leftover factors?", answer: 0,
                   options: [{ t: "Below: 2 of them" }, { t: "On top: 2 of them", fb: "There are more factors of $b$ in the denominator, so the extras stay there." }] } },
          { step: 3, m: "-\\frac{9a}{b^2}", say: "Put the pieces together." }] },
        gate: true, then: "Handle the numbers and each variable separately, then assemble." },
      { type: "guided", kicker: "Together",
        prompt: "Now you simplify $\\frac{18x^6y^2}{6x^2y^5}$.",
        how: HOW_10_4, skill: "Divide monomials",
        steps: [
          { step: 1, ask: "Divide the coefficients: $18 \\div 6$.", type: "num", answer: 3, hint: "$6 \\cdot 3 = 18$.",
            m: "18 \\div 6 = 3", say: "The number part." },
          { step: 2, ask: "$x^6$ over $x^2$: subtract the exponents. Which power of $x$ is left on top?", type: "num", answer: 4, near: [{ v: 3, fb: "Subtract the exponents. Do not divide them." }], hint: "$6 - 2$.",
            m: "\\frac{x^6}{x^2} \\to x^4", say: "$6 - 2 = 4$." },
          { step: 3, ask: "$y^2$ over $y^5$: the bottom has more. Which is it?", type: "choice", answer: 0,
            options: [{ t: "$\\frac{1}{y^3}$" }, { t: "$y^3$", fb: "The extra factors are in the denominator, so they stay below." }, { t: "$\\frac{1}{y^7}$", fb: "Subtract the exponents: $5 - 2$." }],
            m: "\\frac{3x^4}{y^3}", say: "Three factors of $y$ stay below." }],
        why: "Numbers, same base, place. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Simplify $\\frac{x^{10}}{x^8}$. It is $x$ to which power?", answer: 2, skill: "Quotient property",
        near: [{ v: 18, fb: "Dividing subtracts the exponents." }, { v: 1.25, tol: 1e-9, fb: "Subtract the exponents. Do not divide them." }], hints: ["$10 - 8$."], why: "$x^{10 - 8} = x^2$." },
      { type: "num", prompt: "Simplify $(7z)^0$, where $z$ is not zero.", answer: 1, skill: "Zero exponent",
        near: [{ v: 0, fb: "Any non-zero number to the power 0 is 1, not 0." }, { v: 7, fb: "The whole of $7z$ is raised to the power 0." }], hints: ["Think of $\\frac{(7z)^1}{(7z)^1}$."], why: "Any non-zero number to the power 0 is 1." },
      { type: "learn", kicker: "A harder case",
        prompt: "Several properties in one problem: work from the powers outward. $$\\frac{(y^2)^3(y^2)^4}{(y^5)^4}$$",
        scene: { type: "walk", how: [["Powers", "Apply each power of a power: multiply the exponents."],
                                    ["Products", "Multiply on top: add the exponents."],
                                    ["Quotient", "Divide: subtract the exponents."]], rows: [
          { step: 1, m: "\\frac{(y^2)^3(y^2)^4}{(y^5)^4}", say: "Three powers of powers." },
          { step: 1, m: "\\frac{y^6 \\cdot y^8}{y^{20}}", say: "$2 \\cdot 3$, $2 \\cdot 4$ and $5 \\cdot 4$." },
          { step: 2, m: "\\frac{y^{14}}{y^{20}}", say: "$6 + 8 = 14$." },
          { step: 3, m: "\\frac{1}{y^6}", say: "$20 - 14 = 6$ factors stay below." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "A quotient to a power gives the power to the top and to the bottom. Simplify $\\left(\\frac{x}{3}\\right)^2$.",
        options: [{ t: "$\\frac{x^2}{9}$" }, { t: "$\\frac{x^2}{3}$", fb: "The 3 is squared too." }, { t: "$\\frac{2x}{6}$", fb: "Squaring is not doubling." }],
        answer: 0, skill: "Quotient to a power", hints: ["$\\frac{x}{3} \\cdot \\frac{x}{3}$."], why: "$\\frac{x^2}{3^2} = \\frac{x^2}{9}$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Tap the line where the work **first** goes wrong.",
        lines: ["\\frac{x^8}{x^2}", "x^{8 \\div 2}", "x^4"], answer: 1, fix: "x^{8 - 2}",
        fb: { 0: GIVEN, 2: LATER }, skill: "Quotient property",
        hints: ["Each factor below cancels one above."],
        why: "Dividing powers subtracts the exponents: $x^6$." },
      { type: "choice", kicker: "Use it", prompt: "A rectangle has area $24x^5$ and width $6x^2$. What is its length?",
        options: [{ t: "$4x^3$" }, { t: "$4x^7$", fb: "Dividing subtracts the exponents: $5 - 2$." }, { t: "$18x^3$", fb: "Divide the coefficients: $24 \\div 6$." }],
        answer: 0, skill: "Divide monomials", hints: ["$\\frac{24x^5}{6x^2}$."], why: "$24 \\div 6 = 4$, and $x^{5 - 2} = x^3$." }
    ]
  });

  /* ============================= 10.5 · Integer exponents and scientific notation */
  var HOW_10_5 = [["Move", "Move the decimal point so that the first factor is at least 1 and less than 10."],
                  ["Count", "Count how many places the point moved: that is the size of the exponent."],
                  ["Sign", "A large number gets a positive exponent. A number less than 1 gets a negative one."]];
  LESSONS.push({
    title: "Integer exponents and scientific notation",
    blurb: "Book 10.5 · Negative exponents, and writing very large and very small numbers in scientific notation.",
    mins: 12, v: 1,
    steps: [
      { type: "table", kicker: "Warm up", prompt: "Each power of 10 is one tenth of the one above it. Keep the pattern going.",
        head: ["Power", "Value"], rows: [["10^3", 1000], ["10^2", 100], ["10^1", 10], ["10^0", null], ["10^{-1}", null]],
        answers: [[3, 1, 1], [4, 1, 0.1]], skill: "Negative exponents",
        hints: ["One tenth of 10, then one tenth of that."], why: "$10^0 = 1$ and $10^{-1} = \\frac{1}{10} = 0.1$." },
      { type: "learn", kicker: "The idea",
        prompt: "The pattern defines negative exponents: $a^{-n} = \\frac{1}{a^n}$. A negative exponent means a reciprocal, not a negative number. **Scientific notation** uses this to write very large and very small numbers: a number from 1 up to 10, times a power of 10.",
        scene: { type: "method", how: HOW_10_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $0.0052$ written in scientific notation.",
        scene: { type: "walk", how: HOW_10_5, rows: [
          { step: 1, m: "0.0052 \\to 5.2", say: "Move the point until one non-zero digit is in front of it." },
          { step: 2, m: "3 \\text{ places}", say: "The point moved past 0, 0 and 5.",
            ask: { prompt: "How many places did the point move?", answer: 0,
                   options: [{ t: "3" }, { t: "2", fb: "Count each digit the point passes: 0, 0 and 5." }] } },
          { step: 3, m: "0.0052 = 5.2 \\times 10^{-3}", say: "The number is less than 1, so the exponent is negative." },
          { step: 3, m: "5.2 \\times 0.001 = 0.0052", say: "A check: $10^{-3} = 0.001$." }] },
        gate: true, then: "The exponent tells you how far, and which way, to move the point back." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write 37,000 in scientific notation.",
        how: HOW_10_5, skill: "Scientific notation",
        steps: [
          { step: 1, ask: "Move the point so that one non-zero digit is in front of it. What is the first factor?", type: "num", answer: 3.7, tol: 1e-9, near: [{ v: 37, fb: "The first factor must be less than 10." }, { v: 0.37, tol: 1e-9, fb: "The first factor must be at least 1." }], hint: "Between 1 and 10.",
            m: "37000 \\to 3.7", say: "One digit in front of the point." },
          { step: 2, ask: "How many places did the point move?", type: "num", answer: 4, near: [{ v: 3, fb: "Count each digit the point passes: 7, 0, 0 and 0." }], hint: "From the end of 37000 to just after the 3.",
            m: "4 \\text{ places}", say: "Four places." },
          { step: 3, ask: "37,000 is a large number. Which is it?", type: "choice", answer: 0,
            options: [{ t: "$3.7 \\times 10^{4}$" }, { t: "$3.7 \\times 10^{-4}$", fb: "A negative exponent would make a number less than 1." }],
            m: "37000 = 3.7 \\times 10^{4}", say: "A large number: positive exponent." }],
        why: "Move, count, sign. Now two on your own." },
      { type: "num", kicker: "On your own", prompt: "Simplify $4^{-2}$. (Type a fraction like 1/8.)", answer: 1 / 16, tol: 1e-9, shown: "1/16", skill: "Negative exponents",
        near: [{ v: -16, fb: "A negative exponent means a reciprocal, not a negative number." }, { v: -8, fb: "A negative exponent means a reciprocal: $\\frac{1}{4^2}$." }, { v: 0.125, tol: 1e-9, fb: "$4^2$ is 16, not 8." }],
        hints: ["$\\frac{1}{4^2}$."], why: "$4^{-2} = \\frac{1}{4^2} = \\frac{1}{16}$." },
      { type: "num", prompt: "Write $6.2 \\times 10^{3}$ in decimal form.", answer: 6200, skill: "Scientific notation",
        near: [big(6200), { v: 0.0062, tol: 1e-9, fb: "A positive exponent moves the point to the right." }, { v: 620, fb: "The exponent is 3: move the point three places." }],
        hints: ["Three places to the right."], why: "$6.2 \\to 62 \\to 620 \\to 6200$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Numbers in scientific notation are multiplied part by part. $$(4 \\times 10^{5})(2 \\times 10^{-7})$$",
        scene: { type: "walk", how: [["Numbers", "Multiply the first factors."],
                                    ["Powers", "Multiply the powers of 10: add the exponents."],
                                    ["Write", "Write the result, in decimal form if asked."]], rows: [
          { step: 1, m: "4 \\cdot 2 = 8", say: "The first factors." },
          { step: 2, m: "10^{5} \\cdot 10^{-7} = 10^{-2}", say: "$5 + (-7) = -2$." },
          { step: 3, m: "8 \\times 10^{-2}", say: "In scientific notation." },
          { step: 3, m: "8 \\times 10^{-2} = 0.08", say: "In decimal form: two places to the left." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "The product property still holds. Simplify $x^{-3} \\cdot x^{5}$. It is $x$ to which power?", answer: 2, skill: "Integer exponents",
        near: [{ v: -15, fb: "Multiplying powers adds the exponents." }, { v: 8, fb: "$-3 + 5$, not $3 + 5$." }], hints: ["$-3 + 5$."], why: "$x^{-3 + 5} = x^2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ian says $3^{-2} = -9$. What is wrong?",
        options: [{ t: "A negative exponent means a reciprocal: $3^{-2} = \\frac{1}{3^2} = \\frac{1}{9}$." },
                  { t: "It should be $-6$.", fb: "An exponent is not a multiplication by the base." },
                  { t: "Nothing. It is right.", fb: "A negative exponent never makes a positive base negative." }],
        answer: 0, skill: "Negative exponents", hints: ["What does $a^{-n}$ mean?"], why: "$3^{-2} = \\frac{1}{9}$." },
      { type: "choice", kicker: "Use it", prompt: "A human hair is about $0.00007$ metres wide. Which is that in scientific notation?",
        options: [{ t: "$7 \\times 10^{-5}$" }, { t: "$7 \\times 10^{5}$", fb: "That is 700,000. A small number needs a negative exponent." }, { t: "$7 \\times 10^{-4}$", fb: "Count the places: the point passes 0, 0, 0, 0 and 7." }],
        answer: 0, skill: "Scientific notation", hints: ["Move the point to just after the 7."], why: "Five places, and the number is less than 1." }
    ]
  });

  /* ================================ 10.6 · Introduction to factoring polynomials */
  var HOW_10_6 = [["GCF", "Find the greatest common factor of all the terms."],
                  ["Rewrite", "Write each term as the GCF times what is left."],
                  ["Factor", "Use the distributive property in reverse: the GCF outside, the rest in parentheses."],
                  ["Check", "Multiply back."]];
  LESSONS.push({
    title: "Introduction to factoring polynomials",
    blurb: "Book 10.6 · The greatest common factor of expressions, and factoring it out of a polynomial.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Find the greatest common factor of 24 and 36.", answer: 12, skill: "Greatest common factor",
        near: [{ v: 6, fb: "6 divides both, but so does a larger number." }, { v: 72, fb: "That is the least common multiple." }], hints: ["$24 = 12 \\cdot 2$ and $36 = 12 \\cdot 3$."], why: "12 is the largest number that divides both." },
      { type: "learn", kicker: "Explore", prompt: "This rectangle has area $6x^2 + 9x$. Its height is the factor both regions share. Press **Fill in the areas** to see how it splits.",
        scene: { type: "tiles", mode: "area", rows: ["3x"], cols: ["2x", "3"], cells: [["6x^2", "9x"]], rh: [90], cw: [150, 110], readout: "$6x^2 + 9x = 3x(2x + 3)$", gate: true }, gate: true,
        after: "Factoring finds the sides of a rectangle from its area." },
      { type: "learn", kicker: "The idea",
        prompt: "Factoring is multiplying in reverse. Multiplying turns $3x(2x + 3)$ into $6x^2 + 9x$. Factoring starts from $6x^2 + 9x$ and pulls out the **greatest common factor**, $3x$, to get the product back.",
        scene: { type: "method", how: HOW_10_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one factored. $$5x^3 - 25x^2$$",
        scene: { type: "walk", how: HOW_10_6, rows: [
          { step: 1, m: "\\text{GCF} = 5x^2", say: "5 divides 5 and 25. $x^2$ divides $x^3$ and $x^2$.",
            },
          { step: 2, m: "5x^2 \\cdot x - 5x^2 \\cdot 5", say: "Each term, written as the GCF times what is left.",
            ask: { prompt: "$5x^3$ is $5x^2$ times what?", answer: 0,
                   options: [{ t: "$x$" }, { t: "$x^3$", fb: "$5x^2 \\cdot x^3$ would be $5x^5$." }] } },
          { step: 3, m: "5x^2(x - 5)", say: "The GCF outside, the rest in parentheses." },
          { step: 4, m: "5x^2(x - 5) \\to 5x^3 - 25x^2", say: "Multiplying back gives the original." }] },
        gate: true, then: "For the variable part, the GCF takes the smallest exponent." },
      { type: "guided", kicker: "Together",
        prompt: "Now you factor $8x^2 + 12x$.",
        how: HOW_10_6, skill: "Factor out the GCF",
        steps: [
          { step: 1, ask: "What is the GCF of $8x^2$ and $12x$?", type: "choice", answer: 0,
            options: [{ t: "$4x$" }, { t: "$4$", fb: "$x$ divides both terms too." }, { t: "$2x$", fb: "4 divides both 8 and 12." }],
            m: "\\text{GCF} = 4x", say: "4 from the numbers, and $x$ from the variables." },
          { step: 2, ask: "$8x^2$ is $4x$ times what?", type: "choice", answer: 0,
            options: [{ t: "$2x$" }, { t: "$2$", fb: "$4x \\cdot 2 = 8x$, not $8x^2$." }, { t: "$4x$", fb: "$4x \\cdot 4x = 16x^2$." }],
            m: "4x \\cdot 2x + 4x \\cdot 3", say: "And $12x = 4x \\cdot 3$." },
          { step: 3, ask: "Factor out $4x$. What goes in the parentheses?", type: "choice", answer: 0,
            options: [{ t: "$2x + 3$" }, { t: "$2x + 12$", fb: "$12x \\div 4x = 3$." }, { t: "$8x + 12$", fb: "Each term is divided by $4x$." }],
            m: "4x(2x + 3)", say: "The distributive property, in reverse." },
          { step: 4, ask: "Check: what is $4x \\cdot 3$?", type: "choice", answer: 0,
            options: [{ t: "$12x$" }, { t: "$7x$", fb: "Multiply, do not add." }],
            m: "4x(2x + 3) \\to 8x^2 + 12x", say: "It matches the original." }],
        why: "GCF, rewrite, factor, check. Now two on your own." },
      { type: "choice", kicker: "On your own", prompt: "Factor $9y^2 + 6y$ completely.",
        options: [{ t: "$3y(3y + 2)$" }, { t: "$3(3y^2 + 2y)$", fb: "$y$ is common to both terms as well." }, { t: "$y(9y + 6)$", fb: "3 is common to both terms as well." }, { t: "$3y(3y + 6)$", fb: "$6y \\div 3y = 2$." }],
        answer: 0, skill: "Factor out the GCF", hints: ["The GCF is $3y$."], why: "$3y \\cdot 3y + 3y \\cdot 2$." },
      { type: "sort", prompt: "Which of these are factored completely?",
        bins: ["Completely factored", "Not yet"],
        cards: [{ t: "$5(x + 3)$", bin: 0, fb: "$x$ and 3 share no factor." }, { t: "$2(4x + 6)$", bin: 1, fb: "2 still divides $4x + 6$." },
                { t: "$3x(x - 4)$", bin: 0, fb: "$x$ and 4 share no factor." }, { t: "$x(6x + 9)$", bin: 1, fb: "3 is still common to $6x$ and 9." }],
        skill: "Factor out the GCF", hints: ["Look inside each pair of parentheses for a common factor."],
        why: "Completely factored means nothing common is left inside." },
      { type: "learn", kicker: "A harder case",
        prompt: "When the first term is negative, take the negative out with the GCF. Factor $-4a^2 + 16a$.",
        scene: { type: "walk", how: HOW_10_6, rows: [
          { step: 1, m: "\\text{GCF} = -4a", say: "The leading coefficient is negative, so factor out a negative." },
          { step: 2, m: "-4a \\cdot a + (-4a)(-4)", say: "$16a = (-4a)(-4)$." },
          { step: 3, m: "-4a(a - 4)", say: "The signs inside both change." },
          { step: 4, m: "-4a(a - 4) \\to -4a^2 + 16a", say: "Multiplying back gives the original." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Factor $6x^3 - 9x^2 + 3x$.",
        options: [{ t: "$3x(2x^2 - 3x + 1)$" }, { t: "$3x(2x^2 - 3x)$", fb: "$3x \\div 3x = 1$: the last term leaves a 1 behind." }, { t: "$3(2x^3 - 3x^2 + x)$", fb: "$x$ is common to all three terms as well." }],
        answer: 0, skill: "Factor out the GCF", hints: ["The GCF is $3x$. Divide each term by it."], why: "$3x \\cdot 2x^2 - 3x \\cdot 3x + 3x \\cdot 1$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ravi factors $10x^2 + 5x$ as $5x(2x)$. What is wrong?",
        options: [{ t: "$5x \\div 5x = 1$, so a 1 must stay: $5x(2x + 1)$." },
                  { t: "The GCF should be 5.", fb: "$x$ is common to both terms too." },
                  { t: "Nothing. It is right.", fb: "Multiply back: $5x(2x)$ is only $10x^2$." }],
        answer: 0, skill: "Factor out the GCF", hints: ["Multiply his answer back."], why: "$5x(2x + 1) = 10x^2 + 5x$." },
      { type: "choice", kicker: "Use it", prompt: "A rectangle has area $12x^2 + 20x$, and one side is $4x$. What is the other side?",
        options: [{ t: "$3x + 5$" }, { t: "$3x + 20$", fb: "$20x \\div 4x = 5$." }, { t: "$8x^2 + 16x$", fb: "Divide the area by the side. Do not subtract." }],
        answer: 0, skill: "Factor out the GCF", hints: ["$12x^2 + 20x = 4x(\\ldots)$."], why: "$4x(3x + 5) = 12x^2 + 20x$." }
    ]
  });
  /* ================================================================ Skills */
  function vr(R) { return R.pick(["x", "n", "y", "a"]); }
  var SKILLS = [
    { id: "pa10-add", title: "Add and subtract polynomials", lesson: 2,
      gen: function (R) {
        var v = vr(R), sub = R.chance(0.5), a = R.int(4, 9), b = R.int(1, 9) * R.pick([1, -1]), c = R.int(1, 9), d = R.int(1, 3), e = R.int(1, 9) * R.pick([1, -1]), f = R.int(1, 9) * R.pick([1, -1]);
        if (!sub && b + e === 0) e += 1;
        if (sub && b - e === 0) e += 1;
        if (e === 0) e = 2;
        var P = poly([[a, v + "^2"], [b, v], [c, ""]]), Q = poly([[d, v + "^2"], [e, v], [f, ""]]), s = sub ? -1 : 1;
        var ans = poly([[a + s * d, v + "^2"], [b + s * e, v], [c + s * f, ""]]), slip = poly([[a + s * d, v + "^2"], [b + s * e, v], [c + f, ""]]);
        return { type: "expr", prompt: (sub ? "Subtract" : "Add") + ". $$(" + P + ")" + (sub ? " - " : " + ") + "(" + Q + ")$$", answer: clean(ans), shown: ans, form: "simplified", keys: polyKeys(v), placeholder: "Use " + v,
          near: sub && clean(slip) !== clean(ans) ? [{ v: clean(slip), fb: "Subtracting changes the sign of **every** term in the second polynomial." }] : [],
          hints: [sub ? "Change every sign in the second polynomial, then combine like terms." : "Combine like terms: the squares, the " + v + " terms, and the constants."], why: "$" + ans + "$." };
      } },
    { id: "pa10-product", title: "Multiply with exponents", lesson: 3,
      gen: function (R) {
        var v = vr(R), m = R.int(2, 7), n = R.int(2, 6), k = R.int(2, 5), kind = R.int(0, 2);
        if (kind === 0) return { type: "num", prompt: "Simplify $" + v + "^{" + m + "} \\cdot " + v + "^{" + n + "}$. It is $" + v + "$ to which power?", answer: m + n,
          near: near(m + n, [{ v: m * n, fb: "Multiplying powers of the same base adds the exponents." }]), hints: ["$" + m + " + " + n + "$."], why: "$" + v + "^{" + m + " + " + n + "} = " + v + "^{" + (m + n) + "}$." };
        if (kind === 1) return { type: "num", prompt: "Simplify $(" + v + "^{" + m + "})^{" + n + "}$. It is $" + v + "$ to which power?", answer: m * n,
          near: near(m * n, [{ v: m + n, fb: "A power of a power multiplies the exponents." }]), hints: ["$" + m + " \\cdot " + n + "$."], why: "$" + v + "^{" + m + " \\cdot " + n + "} = " + v + "^{" + m * n + "}$." };
        return mc(R, { prompt: "Simplify $(" + k + v + "^{" + m + "})^2$.", right: "$" + k * k + v + "^{" + 2 * m + "}$",
          wrong: [{ t: "$" + 2 * k + v + "^{" + 2 * m + "}$", fb: "$" + k + "^2$ is " + k * k + ", not " + 2 * k + "." }, { t: "$" + k * k + v + "^{" + (m + 2) + "}$", fb: "A power of a power multiplies the exponents: $" + m + " \\cdot 2$." }, { t: "$" + k + v + "^{" + 2 * m + "}$", fb: "The " + k + " is inside the parentheses, so it is squared too." }],
          hints: ["Square the " + k + ", and double the exponent."], why: "$" + k + "^2 = " + k * k + "$, and $" + m + " \\cdot 2 = " + 2 * m + "$." });
      } },
    { id: "pa10-foil", title: "Multiply two binomials", lesson: 4,
      gen: function (R) {
        var v = vr(R), p = R.int(1, 9) * R.pick([1, -1]), q = R.int(1, 9) * R.pick([1, 1, -1]);
        if (p + q === 0) q += 1;
        var ans = poly([[1, v + "^2"], [p + q, v], [p * q, ""]]);
        return { type: "expr", prompt: "Multiply. $$(" + poly([[1, v], [p, ""]]) + ")(" + poly([[1, v], [q, ""]]) + ")$$", answer: clean(ans), shown: ans, form: "simplified", keys: polyKeys(v), placeholder: "Use " + v,
          near: [{ v: clean(poly([[1, v + "^2"], [p * q, ""]])), fb: "The outer and inner products are missing: $" + poly([[q, v], [0, ""]]) + "$ and $" + poly([[p, v], [0, ""]]) + "$." }],
          hints: ["First, Outer, Inner, Last: $" + v + "^2$, $" + poly([[q, v], [0, ""]]) + "$, $" + poly([[p, v], [0, ""]]) + "$, $" + p * q + "$."], why: "$" + ans + "$." };
      } },
    { id: "pa10-quotient", title: "Divide with exponents", lesson: 5,
      gen: function (R) {
        var v = vr(R), kind = R.int(0, 2), n = R.int(2, 6), d = R.int(1, 5), k = R.int(2, 9);
        if (kind === 0) return { type: "num", prompt: "Simplify $\\frac{" + v + "^{" + (n + d) + "}}{" + v + "^{" + n + "}}$. It is $" + v + "$ to which power?", answer: d,
          near: near(d, [{ v: 2 * n + d, fb: "Dividing subtracts the exponents." }]), hints: ["$" + (n + d) + " - " + n + "$."], why: "$" + v + "^{" + (n + d) + " - " + n + "} = " + v + "^{" + d + "}$." };
        if (kind === 1) return mc(R, { prompt: "Simplify $\\frac{" + v + "^{" + n + "}}{" + v + "^{" + (n + d + 1) + "}}$.", right: "$\\frac{1}{" + v + "^{" + (d + 1) + "}}$",
          wrong: [{ t: "$" + v + "^{" + (d + 1) + "}$", fb: "The extra factors are in the denominator, so they stay below." }, { t: "$\\frac{1}{" + v + "^{" + (2 * n + d + 1) + "}}$", fb: "Dividing subtracts the exponents." }],
          hints: ["$" + (n + d + 1) + " - " + n + "$ factors stay below."], why: "$" + (n + d + 1) + " - " + n + " = " + (d + 1) + "$ factors are left in the denominator." });
        return { type: "num", prompt: "Simplify $(" + k + v + ")^0$, where $" + v + "$ is not zero.", answer: 1,
          near: [{ v: 0, fb: "Any non-zero number to the power 0 is 1, not 0." }, { v: k, fb: "The whole of $" + k + v + "$ is raised to the power 0." }], hints: ["Any non-zero number to the power 0."], why: "Any non-zero number to the power 0 is 1." };
      } },
    { id: "pa10-sci", title: "Use scientific notation", lesson: 6,
      gen: function (R) {
        var d = R.pick([12, 15, 23, 27, 34, 38, 41, 46, 52, 59, 63, 68, 71, 74, 85, 92, 96]), e = R.int(2, 6), neg = R.chance(0.5), man = d / 10;
        var decimal = neg ? "0." + new Array(e).join("0") + d : String(d * Math.pow(10, e - 1)), sci = num(man) + " \\times 10^{" + (neg ? -e : e) + "}";
        if (R.chance(0.5)) return mc(R, { prompt: "Write $" + decimal + "$ in scientific notation.", right: "$" + sci + "$",
          wrong: [{ t: "$" + num(man) + " \\times 10^{" + (neg ? e : -e) + "}$", fb: neg ? "A number less than 1 needs a negative exponent." : "A large number needs a positive exponent." },
                  { t: "$" + num(man) + " \\times 10^{" + (neg ? -(e + 1) : e + 1) + "}$", fb: "Count the places again: the point moves " + e + "." },
                  { t: "$" + d + " \\times 10^{" + (neg ? -(e + 1) : e - 1) + "}$", fb: "The first factor must be less than 10." }],
          hints: ["Move the point to just after the first non-zero digit, and count the places."], why: "The point moves " + e + " places, and the number is " + (neg ? "less than 1." : "large.") });
        var val = neg ? d / Math.pow(10, e + 1) : d * Math.pow(10, e - 1);
        return { type: "num", prompt: "Write $" + sci + "$ in decimal form.", answer: val, tol: 1e-12, shown: decimal,
          near: neg ? [{ v: d * Math.pow(10, e - 1), fb: "A negative exponent moves the point to the left." }] : nearBig(val, [{ v: d / Math.pow(10, e + 1), tol: 1e-12, fb: "A positive exponent moves the point to the right." }]),
          hints: ["Move the point " + e + " places to the " + (neg ? "left." : "right.")], why: "$" + sci + " = " + decimal + "$." };
      } },
    { id: "pa10-gcf", title: "Factor out the greatest common factor", lesson: 7,
      gen: function (R) {
        var v = vr(R), g = R.int(2, 6), P = R.pick([[2, 3], [3, 2], [1, 4], [3, 4], [5, 2], [2, 5], [1, 3], [4, 3], [3, 5], [5, 3]]), a = P[0], b = P[1];
        var inner = poly([[a, v], [b, ""]]);
        return mc(R, { prompt: "Factor completely. $$" + poly([[g * a, v + "^2"], [g * b, v], [0, ""]]) + "$$", right: "$" + g + v + "(" + inner + ")$",
          wrong: [{ t: "$" + g + "(" + poly([[a, v + "^2"], [b, v], [0, ""]]) + ")$", fb: "$" + v + "$ is common to both terms as well." },
                  { t: "$" + v + "(" + poly([[g * a, v], [g * b, ""]]) + ")$", fb: g + " is common to both terms as well." },
                  { t: "$" + g + v + "(" + poly([[a, v], [g * b, ""]]) + ")$", fb: "$" + g * b + v + " \\div " + g + v + " = " + b + "$." }],
          hints: ["The GCF is $" + g + v + "$. Divide each term by it."], why: "$" + g + v + " \\cdot " + poly([[a, v], [0, ""]]) + " + " + g + v + " \\cdot " + b + "$." });
      } }
  ];
  L.unit("prealg", 10, {
    title: "Polynomials",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Adding and subtracting polynomials, the properties of exponents, and multiplying binomials.",
        skills: ["pa10-add", "pa10-product", "pa10-foil"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Dividing with exponents, scientific notation, and factoring out the greatest common factor.",
        skills: ["pa10-quotient", "pa10-sci", "pa10-gcf"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("prealg:10", {
    2: { name: "Polynomials", frame: "A [[monomial]] has one term, a binomial two and a trinomial three. The [[degree]] is the highest exponent. Polynomials are added by combining [[like terms]]. To subtract, change every [[sign]] in the second one.",
         chips: ["factor", "base"] },
    3: { name: "Multiplying with exponents", frame: "To multiply powers of the same base, [[add]] the exponents. For a power of a power, [[multiply]] them. A product raised to a power gives the power to [[every]] factor.",
         chips: ["subtract", "the first"] },
    4: { name: "Multiplying polynomials", frame: "Every term of one polynomial multiplies every term of the other. For two binomials, FOIL names the four products: First, [[Outer]], [[Inner]], Last. Then combine [[like terms]].",
         chips: ["Opposite", "factors"] },
    5: { name: "Dividing with exponents", frame: "To divide powers of the same base, [[subtract]] the exponents. The leftover factors stay where there were [[more]]. Any non-zero number to the power 0 is [[1]].",
         chips: ["add", "0"], fb: { "0": "$x^0$ is 1: equal powers cancel completely." } },
    6: { name: "Negative exponents and scientific notation", frame: "$a^{-n}$ is the [[reciprocal]] of $a^n$. Scientific notation is a number from 1 up to [[10]], times a power of 10. A number less than 1 has a [[negative]] exponent.",
         chips: ["opposite", "100"] },
    7: { name: "Factoring", frame: "Factoring is [[multiplying]] in reverse. Find the [[greatest common factor]] of the terms, write it outside the parentheses, and [[check]] by multiplying back.",
         chips: ["dividing", "least common multiple"] }
  });
})();
