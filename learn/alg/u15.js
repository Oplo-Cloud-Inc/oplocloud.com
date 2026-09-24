/* ==========================================================================
   Algebra I — Unit 15: Irrational numbers. See lab/core.js.

   Written the way Units 1–14 are. A rational number is a ratio of whole
   numbers — its decimal ends or repeats; an irrational one's never does.
   Then what happens when the two kinds are added and multiplied, argued
   properly (rational plus irrational must be irrational, or the irrational
   one would be a difference of rationals), and the classic proofs: √2 is
   irrational, so is the root of any prime, and there is an irrational
   number between any two rationals.

   Three lessons, following Khan Academy's topics for the unit (whose
   exercises don't count toward course mastery, so there are no quizzes),
   four skills, the unit test at the end, and notes that put the unit on
   one page.
   Standards: HSN.RN.B.3, 8.NS.A.1.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var mc = L.mc;

  function rep(whole, digits) { return whole + ".\\overline{" + digits + "}"; }
  var SQUARES = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
  function isSq(n) { return SQUARES.indexOf(n) >= 0; }
  function nonSq(R, lo, hi) { var n = R.int(lo, hi); while (isSq(n)) n = R.int(lo, hi); return n; }

  // A number to classify: { t, rat, fb } — fb explains the tricky ones.
  function rational(R) {
    return R.pick([
      function () { var n = R.nz(-20, 20); return { t: String(n), fb: "A whole number is a fraction over 1: $\\frac{" + n + "}{1}$." }; },
      function () { var p = R.int(1, 9), q = R.pick([3, 7, 9, 11]); return { t: (R.chance(0.3) ? "-" : "") + "\\frac{" + p + "}{" + q + "}", fb: "It's a fraction of whole numbers already." }; },
      function () { return { t: R.pick(["0.25", "3.7", "-1.125", "0.04"]), fb: "A decimal that ends is a fraction over 10, 100, 1000…" }; },
      function () { var d = R.pick(["3", "12", "142857", "6", "27"]); return { t: rep(R.int(0, 4), d), fb: "It repeats, so it's a fraction in disguise." }; },
      function () { var n = R.int(2, 12); return { t: "\\sqrt{" + n * n + "}", fb: "$\\sqrt{" + n * n + "} = " + n + "$ — a whole number." }; },
      function () { var p = R.int(1, 5), q = R.int(p + 1, 9); return { t: "\\sqrt{\\frac{" + p * p + "}{" + q * q + "}}", fb: "It's $\\frac{" + p + "}{" + q + "}$." }; },
      function () { var n = R.int(2, 5); return { t: "\\sqrt[3]{" + n * n * n + "}", fb: "$\\sqrt[3]{" + n * n * n + "} = " + n + "$." }; }])();
  }
  function irrational(R) {
    return R.pick([
      function () { var n = nonSq(R, 2, 99); return { t: "\\sqrt{" + n + "}", fb: n + " isn't a perfect square, so its root never ends or repeats." }; },
      function () { return { t: R.pick(["\\pi", "2\\pi", "\\frac{\\pi}{2}", "\\pi + 1"]), fb: "$\\pi$ is irrational, and so is any rational (not zero) times it, or plus it." }; },
      function () { return { t: R.pick(["1.010010001\\ldots", "0.123456789101112\\ldots", "2.020020002\\ldots"]), fb: "It never ends, and the pattern keeps changing — so it never repeats." }; },
      function () { var n = nonSq(R, 2, 30); return { t: "\\frac{\\sqrt{" + n + "}}{" + R.int(2, 5) + "}", fb: "An irrational number divided by a whole number is still irrational." }; },
      function () { var n = R.pick([2, 3, 4, 5, 6, 7, 9, 10]); return { t: "\\sqrt[3]{" + n + "}", fb: n + " isn't a perfect cube." }; },
      function () { var n = nonSq(R, 2, 20); return { t: "-\\sqrt{" + n + "}", fb: "The minus sign doesn't change it: $\\sqrt{" + n + "}$ is irrational." }; }])();
  }
  function distinctCards(R, gen, n, seen) {
    var out = [], guard = 0;
    while (out.length < n && guard++ < 100) { var c = gen(R); if (seen.indexOf(c.t) < 0) { seen.push(c.t); out.push(c); } }
    return out;
  }

  var PROOFS = {
    root: function (p) { return ["Suppose $\\sqrt{" + p + "} = \\frac{a}{b}$, a fraction in lowest terms.",
      "Square both sides: $" + p + "b^2 = a^2$.",
      "So $a^2$ is a multiple of " + p + ", and because " + p + " is prime, so is $a$: write $a = " + p + "k$.",
      "Then $" + p + "b^2 = " + p * p + "k^2$, so $b^2 = " + p + "k^2$ — and $b$ is a multiple of " + p + " too.",
      "Both $a$ and $b$ are multiples of " + p + ", so $\\frac{a}{b}$ wasn't in lowest terms. That's impossible, so $\\sqrt{" + p + "}$ is irrational."]; },
    sum: function (r, n) { return ["Suppose $" + r + " + \\sqrt{" + n + "}$ were rational — call it $q$.",
      "Then $\\sqrt{" + n + "} = q - " + r + "$.",
      "$q - " + r + "$ is a rational number take away a rational number, so it's rational.",
      "That makes $\\sqrt{" + n + "}$ rational — but it isn't. So $" + r + " + \\sqrt{" + n + "}$ is irrational."]; },
    prod: function (r, n) { return ["Suppose $" + r + "\\sqrt{" + n + "}$ were rational — call it $q$.",
      "Then $\\sqrt{" + n + "} = \\frac{q}{" + r + "}$.",
      "$\\frac{q}{" + r + "}$ is a rational number divided by one that isn't zero, so it's rational.",
      "That makes $\\sqrt{" + n + "}$ rational — but it isn't. So $" + r + "\\sqrt{" + n + "}$ is irrational."]; }
  };

  L.unit("alg", 15, {
    title: "Irrational numbers",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Rational and irrational numbers",
        blurb: "Fractions, decimals that end or repeat — and the numbers that are neither.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A **rational** number is one you can write as a fraction of whole numbers, $\\frac{p}{q}$ (with $q \\ne 0$). Its decimal either ends or repeats forever.",
            scene: { type: "walk", rows: [
              { m: "0.75 = \\frac{3}{4}", say: "A decimal that ends." },
              { m: rep(0, "3") + " = \\frac{1}{3}", say: "A decimal that repeats." },
              { m: "-4 = \\frac{-4}{1}", say: "Whole numbers too." },
              { m: "\\sqrt{2} = 1.41421356\\ldots", say: "Never ends, never repeats: **irrational**." },
              { m: "\\pi = 3.14159265\\ldots", say: "Irrational too." }] },
            gate: true,
            then: "Irrational numbers are still ordinary numbers with a place on the number line — $\\sqrt{2}$ is the side of a square of area 2 — they just aren't fractions." },
          { type: "sort", prompt: "Sort these numbers. Drag each card into a box, or click a card and then a box.", skill: "Classify numbers",
            bins: ["Rational", "Irrational"],
            cards: [{ t: "$\\frac{5}{8}$", bin: 0 }, { t: "$\\sqrt{3}$", bin: 1 }, { t: "$\\sqrt{81}$", bin: 0, fb: "$\\sqrt{81} = 9$." },
                    { t: "$" + rep(2, "18") + "$", bin: 0, fb: "It repeats, so it's a fraction." }, { t: "$\\pi$", bin: 1 },
                    { t: "$-7$", bin: 0 }, { t: "$0.1010010001\\ldots$", bin: 1, fb: "The gaps keep growing, so it never repeats." }] },
          { type: "choice", prompt: "Is $\\sqrt{50}$ rational or irrational?", skill: "Classify numbers",
            options: [{ t: "Irrational — 50 isn't a perfect square" }, { t: "Rational — it's about 7.07", fb: "7.07 is only close: $7.07^2 = 49.9849$. The decimal never ends or repeats." }],
            answer: 0, why: "50 is between the squares 49 and 64, so its root isn't a whole number — and isn't a fraction either." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Sums and products",
        blurb: "What adding and multiplying do to rational and irrational numbers — and why.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "Two rationals",
            prompt: "Add or multiply two fractions and you get a fraction: rational numbers stay rational.",
            scene: { type: "walk", rows: [
              { m: "\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}", say: "Whole numbers on top and bottom." },
              { m: "\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{ac}{bd}", say: "Whole numbers again." }] },
            gate: true },
          { type: "learn", kicker: "A rational and an irrational",
            prompt: "$3 + \\sqrt{2}$ is irrational. Here's why: if it were a rational number $q$, then $\\sqrt{2} = q - 3$ would be a rational minus a rational — rational. But $\\sqrt{2}$ isn't. <br>The same argument shows $3\\sqrt{2}$ is irrational (then $\\sqrt{2} = \\frac{q}{3}$) — as long as the rational number isn't $0$, since $0 \\cdot \\sqrt{2} = 0$." },
          { type: "choice", prompt: "Is $5 + \\sqrt{7}$ rational or irrational?", skill: "Rational vs. irrational expressions",
            options: [{ t: "Irrational" }, { t: "Rational", fb: "If $5 + \\sqrt{7}$ were rational, $\\sqrt{7}$ would be too — it's a rational minus 5." }], answer: 0,
            why: "Rational plus irrational is irrational." },
          { type: "learn", kicker: "Two irrationals",
            prompt: "Two irrational numbers can give either kind.",
            scene: { type: "walk", rows: [
              { m: "\\sqrt{2} + \\sqrt{3} = 3.146\\ldots", say: "Irrational." },
              { m: "\\sqrt{2} + (-\\sqrt{2}) = 0", say: "Rational." },
              { m: "\\sqrt{2} \\cdot \\sqrt{8} = \\sqrt{16} = 4", say: "Rational." },
              { m: "\\sqrt{2} \\cdot \\sqrt{3} = \\sqrt{6}", say: "Irrational." }] },
            gate: true },
          { type: "choice", prompt: "Is $\\sqrt{3} \\cdot \\sqrt{12}$ rational or irrational?", skill: "Rational vs. irrational expressions",
            options: [{ t: "Rational" }, { t: "Irrational", fb: "Multiply first: $\\sqrt{3 \\cdot 12} = \\sqrt{36}$." }], answer: 0,
            why: "$\\sqrt{36} = 6$." },
          { type: "choice", prompt: "$a$ is a rational number that isn't 0, and $x$ is irrational. What is $a \\cdot x$?", skill: "Rational vs. irrational expressions (unknowns)",
            options: [{ t: "Irrational" }, { t: "Rational", fb: "If $ax$ were rational, $x = \\frac{ax}{a}$ would be rational too." }, { t: "It depends on the numbers", fb: "Because $a$ isn't 0, it's always irrational." }], answer: 0, keep: true,
            why: "A non-zero rational times an irrational is always irrational." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Proofs about irrational numbers",
        blurb: "Why √2 can't be a fraction — and an irrational number between any two rationals.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "The classic proof",
            prompt: "Suppose $\\sqrt{2}$ were a fraction. Follow where that leads.",
            scene: { type: "walk", rows: [
              { m: "\\sqrt{2} = \\frac{a}{b}", say: "In lowest terms: $a$ and $b$ have no common factor." },
              { m: "2b^2 = a^2", say: "Square, then multiply by $b^2$. So $a^2$ is even — and so $a$ is even (an odd number squared is odd)." },
              { m: "a = 2k \\Rightarrow 2b^2 = 4k^2 \\Rightarrow b^2 = 2k^2", say: "So $b^2$ is even, and $b$ is even too." },
              { m: "\\text{both even}", say: "Then 2 is a common factor — but $\\frac{a}{b}$ was in lowest terms. Impossible." }] },
            gate: true,
            then: "The assumption led to something impossible, so it was wrong: $\\sqrt{2}$ is not a fraction. This is a **proof by contradiction**. The same argument works for the root of any prime number." },
          { type: "order", prompt: "Put the proof that $\\sqrt{3}$ is irrational in order.", skill: "Proofs about irrational numbers",
            items: PROOFS.root(3), why: "Assume it's a fraction in lowest terms, square, show both $a$ and $b$ are multiples of 3, and reach the contradiction." },
          { type: "learn", kicker: "Between any two rationals",
            prompt: "Between any two rational numbers there's an irrational one. For $a < b$, go a fraction of the way from $a$ to $b$ — a fraction that's irrational, like $\\frac{1}{\\sqrt{2}} \\approx 0.707$: $$a + \\frac{b - a}{\\sqrt{2}}$$ It's between $a$ and $b$, and it's irrational (a rational plus a non-zero rational times an irrational)." },
          { type: "choice", prompt: "Which of these is an irrational number between 4 and 5?", skill: "Irrational numbers between rationals",
            options: [{ t: "$\\sqrt{19}$" }, { t: "$\\sqrt{25}$", fb: "$\\sqrt{25} = 5$ — rational, and not between." }, { t: "$4.5$", fb: "Between them, but $4.5 = \\frac{9}{2}$ is rational." }, { t: "$\\sqrt{30}$", fb: "Irrational, but $\\sqrt{30} > \\sqrt{25} = 5$." }],
            answer: 0, why: "$16 < 19 < 25$, so $4 < \\sqrt{19} < 5$, and 19 isn't a perfect square." }
        ]
      }
    ],

    quizzes: [],

    /* ================================================================= Notes */
    notes: [
      { t: "Rational and irrational",
        keys: [["rational", "a fraction of whole numbers $\\frac{p}{q}$, $q \\ne 0$; its decimal ends or repeats"], ["irrational", "not a fraction; its decimal never ends and never repeats"]],
        say: ["Rational: $5$, $-\\frac{2}{3}$, $0.25$, $" + rep(0, "3") + "$, $\\sqrt{49}$. Irrational: $\\sqrt{2}$, $\\sqrt{50}$, $\\pi$, $1.0100100001\\ldots$"],
        watch: "$\\sqrt{n}$ is rational only when $n$ is a perfect square — and $3.14$ is only close to $\\pi$." },
      { t: "Sums and products",
        keys: [["rational ± or × rational", "rational"], ["rational + irrational", "irrational"], ["non-zero rational × irrational", "irrational"], ["irrational + or × irrational", "could be either"]],
        eg: { q: "Why is $3 + \\sqrt{2}$ irrational?", rows: [["3 + \\sqrt{2} = q", "Suppose it were rational."], ["\\sqrt{2} = q - 3", "Then this would be rational — it isn't."]] },
        watch: "$0 \\cdot \\sqrt{2} = 0$ and $\\sqrt{2} \\cdot \\sqrt{8} = 4$ are rational." },
      { t: "Proofs",
        say: ["**√2 is irrational:** if $\\sqrt{2} = \\frac{a}{b}$ in lowest terms, then $a^2 = 2b^2$, so $a$ is even; then $b^2 = 2k^2$, so $b$ is even — a contradiction. The same works for the root of any prime.",
              "**An irrational between any two rationals** $a < b$: $a + \\frac{b - a}{\\sqrt{2}}$."] }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a15-classify", title: "Classify numbers: rational & irrational", lesson: 1,
        gen: function (R) {
          var seen = [];
          if (R.chance(0.5)) {
            var rs = distinctCards(R, rational, 3, seen), is = distinctCards(R, irrational, 3, seen);
            return { type: "sort", prompt: "Sort these numbers. Drag each card into a box, or click a card and then a box.", bins: ["Rational", "Irrational"],
              cards: rs.map(function (c) { return { t: "$" + c.t + "$", bin: 0, fb: c.fb }; }).concat(is.map(function (c) { return { t: "$" + c.t + "$", bin: 1, fb: c.fb }; })),
              hints: ["Can it be written as a fraction? Does its decimal end or repeat?", "A square root is rational only if the number is a perfect square."], why: "Rational: $" + rs.map(function (c) { return c.t; }).join("$, $") + "$. Irrational: the rest." };
          }
          var want = R.chance(0.5), odd = want ? irrational(R) : rational(R), rest = distinctCards(R, want ? rational : irrational, 3, [odd.t]);
          return mc(R, { prompt: "Which of these numbers is " + (want ? "irrational" : "rational") + "?", right: "$" + odd.t + "$",
            wrong: rest.map(function (c) { return { t: "$" + c.t + "$", fb: (want ? "Rational: " : "Irrational: ") + c.fb }; }),
            hints: ["Rational numbers are fractions; their decimals end or repeat."], why: "$" + odd.t + "$: " + odd.fb });
        } },
      { id: "a15-expr", title: "Rational vs. irrational expressions", lesson: 2,
        gen: function (R) {
          var T = R.pick([
            function () { var n = R.pick([2, 3, 5, 6, 7]), k = R.int(2, 4); return { e: "\\sqrt{" + n + "} \\cdot \\sqrt{" + n * k * k + "}", r: true, w: "$\\sqrt{" + n + " \\cdot " + n * k * k + "} = \\sqrt{" + n * n * k * k + "} = " + n * k + "$." }; },
            function () { var n = R.pick([2, 3, 5]), m = R.pick([7, 11, 13]); return { e: "\\sqrt{" + n + "} \\cdot \\sqrt{" + m + "}", r: false, w: "$\\sqrt{" + n * m + "}$, and " + n * m + " isn't a perfect square." }; },
            function () { var r = R.nz(-9, 9), n = nonSq(R, 2, 30); return { e: r + " + \\sqrt{" + n + "}", r: false, w: "A rational plus an irrational is irrational." }; },
            function () { var r = R.pick([2, 3, 5, -4, "\\frac{1}{2}"]), n = nonSq(R, 2, 30); return { e: r + "\\sqrt{" + n + "}", r: false, w: "A non-zero rational times an irrational is irrational." }; },
            function () { var n = nonSq(R, 2, 30); return { e: "0 \\cdot \\sqrt{" + n + "}", r: true, w: "Anything times 0 is 0." }; },
            function () { var n = nonSq(R, 2, 30); return { e: "(\\sqrt{" + n + "})^2", r: true, w: "Squaring a square root gives back " + n + "." }; },
            function () { var n = nonSq(R, 2, 30), r = R.int(1, 9); return { e: "(" + r + " + \\sqrt{" + n + "}) - \\sqrt{" + n + "}", r: true, w: "The roots cancel, leaving " + r + "." }; },
            function () { var a = R.int(1, 7), b = R.int(2, 9), c = R.int(1, 7), d = R.int(2, 9); return { e: "\\frac{" + a + "}{" + b + "} + \\frac{" + c + "}{" + d + "}", r: true, w: "The sum of two fractions is a fraction." }; },
            function () { var n = R.pick([2, 3, 5]), m = R.pick([7, 11]); return { e: "\\sqrt{" + n + "} + \\sqrt{" + m + "}", r: false, w: "It's about $" + (Math.sqrt(n) + Math.sqrt(m)).toFixed(3) + "\\ldots$ and never repeats." }; },
            function () { var r = R.int(2, 9); return { e: "\\pi + (" + r + " - \\pi)", r: true, w: "The $\\pi$s cancel: it's " + r + "." }; },
            function () { var k = R.int(2, 6); return { e: "\\frac{" + k + "\\pi}{\\pi}", r: true, w: "It's " + k + "." }; }])();
          return mc(R, { prompt: "Is $" + T.e + "$ rational or irrational?", right: T.r ? "Rational" : "Irrational", keep: true,
            wrong: [{ t: T.r ? "Irrational" : "Rational", fb: T.w }],
            hints: ["Can you simplify it first? Roots that multiply to a perfect square, or terms that cancel, give rational numbers."], why: T.w });
        } },
      { id: "a15-unknowns", title: "Rational vs. irrational expressions (unknowns)", lesson: 2,
        gen: function (R) {
          var T = R.pick([
            ["a + b", "Rational", "Rational numbers added give a rational number."],
            ["a \\cdot b", "Rational", "Rational numbers multiplied give a rational number."],
            ["\\frac{a}{b}", "Rational", "A fraction divided by a (non-zero) fraction is a fraction."],
            ["a + x", "Irrational", "If $a + x$ were rational, $x$ would be too: it would be a rational take away $a$."],
            ["x - b", "Irrational", "If $x - b$ were rational, $x$ would be too: add $b$ back."],
            ["a \\cdot x", "Irrational", "If $ax$ were rational, $x = \\frac{ax}{a}$ would be rational too (and $a \\ne 0$)."],
            ["\\frac{x}{b}", "Irrational", "If $\\frac{x}{b}$ were rational, $x$ would be too: multiply by $b$."],
            ["x + y", "It depends", "$\\sqrt{2} + \\sqrt{3}$ is irrational, but $\\sqrt{2} + (-\\sqrt{2}) = 0$."],
            ["x \\cdot y", "It depends", "$\\sqrt{2} \\cdot \\sqrt{3}$ is irrational, but $\\sqrt{2} \\cdot \\sqrt{2} = 2$."],
            ["x^2", "It depends", "$(\\sqrt{2})^2 = 2$ is rational, but $(\\sqrt[3]{2})^2$ isn't."]]);
          var right = T[1];
          return mc(R, { prompt: "$a$ and $b$ are rational numbers, neither of them 0. $x$ and $y$ are irrational. What kind of number is $" + T[0] + "$?", right: right, keep: true,
            wrong: ["Rational", "Irrational", "It depends"].filter(function (w) { return w !== right; }).map(function (w) { return { t: w, fb: T[2] }; }),
            hints: ["Suppose it were rational: what would that say about $x$?", "Two irrational numbers can combine either way."], why: T[2] });
        } },
      { id: "a15-between", title: "Irrational numbers between rationals", lesson: 3,
        gen: function (R) {
          var A = R.int(1, 8), B = A + 1, n = nonSq(R, A * A + 1, B * B - 1), hi = nonSq(R, B * B + 1, B * B + 2 * B), lo = A >= 2 ? nonSq(R, (A - 1) * (A - 1) + 1, A * A - 1) : null;
          var wrong = [{ t: "$\\sqrt{" + B * B + "}$", fb: "$\\sqrt{" + B * B + "} = " + B + "$ — rational, and not between." },
                       { t: "$" + A + ".5$", fb: "Between them, but $" + A + ".5 = \\frac{" + (2 * A + 1) + "}{2}$ is rational." },
                       { t: "$\\sqrt{" + (lo || hi) + "}$", fb: "Irrational, but $\\sqrt{" + (lo || hi) + "}$ is " + (lo ? "less than $\\sqrt{" + A * A + "} = " + A : "more than $\\sqrt{" + B * B + "} = " + B) + "$." }];
          return mc(R, { prompt: "Which of these is an irrational number between " + A + " and " + B + "?", right: "$\\sqrt{" + n + "}$", wrong: wrong,
            hints: ["Square the ends: the number under the root must be between " + A * A + " and " + B * B + ", and not a perfect square."], why: "$" + A * A + " < " + n + " < " + B * B + "$, so $" + A + " < \\sqrt{" + n + "} < " + B + "$ — and " + n + " isn't a perfect square." });
        } },
      { id: "a15-proof", title: "Proofs about irrational numbers", lesson: 3,
        gen: function (R) {
          var kind = R.pick(["root", "sum", "prod"]), p = R.pick([2, 3, 5, 7, 11, 13]), r = R.int(2, 9), n = R.pick([2, 3, 5, 7]);
          var items = kind === "root" ? PROOFS.root(p) : PROOFS[kind](r, n);
          var what = kind === "root" ? "$\\sqrt{" + p + "}$ is irrational" : kind === "sum" ? "$" + r + " + \\sqrt{" + n + "}$ is irrational" : "$" + r + "\\sqrt{" + n + "}$ is irrational";
          return { type: "order", prompt: "Put the steps of the proof that " + what + " in order.", items: items,
            hints: ["A proof by contradiction starts with “suppose” — the opposite of what it proves."],
            why: kind === "root" ? "Assume a fraction in lowest terms; square; show both top and bottom are multiples of " + p + "; contradiction." : "Assume it's rational; solve for $\\sqrt{" + n + "}$; that makes $\\sqrt{" + n + "}$ rational; contradiction." };
        } }
    ]
  });
})();
