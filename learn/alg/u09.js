/* ==========================================================================
   Algebra I — Unit 9: Sequences. See lab/core.js.

   Written the way Units 1–8 are. A sequence is met as a growing figure —
   blocks added the same number at a time, or multiplied — before it is a
   list of numbers. Each kind is then written two ways: recursively (where
   to start, and how to get from one term to the next) and explicitly (a
   rule that jumps straight to the nth term), with the step between them
   worked a line at a time. The last lessons model real patterns and look
   at sequences in general — recursive rules that aren't arithmetic or
   geometric, and why a sequence's inputs are whole numbers.

   Six lessons, following Khan Academy's topics for the unit. Fourteen skills
   (Khan's list), three quizzes, the unit test at the end, and notes that
   put the unit on one page.
   Standards: HSF.IF.A.3, HSF.BF.A.1.a, HSF.BF.A.2, HSF.LE.A.2.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, frac = L.frac, fracText = L.fracText;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function paren(v) { return v < 0 ? "(" + num(v) + ")" : num(v); }
  function nears(ans, list) { return list.filter(function (z) { return isFinite(z.v) && Math.abs(z.v - ans) > 1e-9; }); }
  function list(terms) { return terms.map(function (t) { return t % 1 ? String(t) : num(t); }).join(", ") + ", \\ldots"; }
  // A term that may be a fraction, as TeX.
  function ft(v, den) { return den ? frac(Math.round(v * den), den) : num(v); }
  function listF(terms, den) { return terms.map(function (t) { return ft(t, den); }).join(", ") + ", \\ldots"; }
  function arith(a, d, n) { return a + d * (n - 1); }
  function geom(a, r, n) { return a * Math.pow(r, n - 1); }
  function plusTex(d) { return d < 0 ? " - " + num(-d) : " + " + num(d); }
  function explicitA(a, d) { return "a(n) = " + num(a) + plusTex(d).replace(/(\d+(\.\d+)?)$/, "$1(n - 1)"); }
  function recA(a, d) { return "a(1) = " + num(a) + ", \\;\\; a(n) = a(n - 1)" + plusTex(d); }
  function rTex(r) { return r % 1 ? frac(Math.round(r * 6), 6) : num(r); }
  function explicitG(a, r) { return "a(n) = " + num(a) + " \\cdot " + (r < 0 || r % 1 ? "\\left(" + rTex(r) + "\\right)" : rTex(r)) + "^{n - 1}"; }
  function recG(a, r) { return "a(1) = " + num(a) + ", \\;\\; a(n) = a(n - 1) \\cdot " + (r < 0 ? "(" + rTex(r) + ")" : rTex(r)); }
  // Two blanks to fill: the first term and the step (or ratio).
  function blanks(h1, h2, v1, v2) { return { type: "table", head: [h1, h2], rows: [[null, null]], answers: [[0, 0, v1], [0, 1, v2]] }; }

  L.unit("alg", 9, {
    title: "Sequences",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Adding the same amount",
        blurb: "Arithmetic sequences: a pattern that grows by the same step every time.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Here is a pattern of blocks. Move the slider to build the next figures, and watch how many blocks each one adds.",
            scene: { type: "pattern", a: 3, d: 2, n: 2, max: 6, gate: true, gateN: 5 }, gate: true,
            then: "Each figure has 2 more blocks than the one before: $3, 5, 7, 9, 11, \\ldots$ A list of numbers in order is a **sequence**, and each number is a **term**. When you add the same amount every time, it is an **arithmetic sequence**, and the amount added is the **common difference**, $d$." },
          { type: "num", prompt: "What is the next term of $" + list([7, 11, 15, 19]) + "$", answer: 23, skill: "Extend arithmetic sequences",
            near: [{ v: 20, fb: "The terms go up by 4 each time, not 1." }], hints: ["How much is added each time?"], why: "Add $4$: $19 + 4 = 23$." },
          { type: "num", prompt: "And the next term of $" + list([10, 7, 4, 1]) + "$", answer: -2, skill: "Extend arithmetic sequences",
            near: [{ v: 4, fb: "The common difference is $-3$: the terms go **down**." }, { v: 0, fb: "Take 3 away from 1." }],
            hints: ["The difference can be negative: what do you add to 10 to get 7?"], why: "The common difference is $-3$: $1 - 3 = -2$." },
          { type: "learn", kicker: "Formulas",
            prompt: "A sequence is a function whose inputs are the term numbers $1, 2, 3, \\ldots$ — so we write $a(n)$ for the $n$th term. A formula can describe a sequence two ways.",
            scene: { type: "walk", rows: [
              { m: "a(1) = 3, \\;\\; a(n) = a(n - 1) + 2", say: "**Recursive**: where to start, and how each term comes from the one before." },
              { m: "a(n) = 3 + 2(n - 1)", say: "**Explicit**: a rule that goes straight to term $n$." },
              { m: "a(10) = 3 + 2(9) = 21", say: "The explicit form finds the 10th term without listing the first nine." }] },
            gate: true },
          { type: "num", prompt: "A sequence has $a(n) = 5 + 4(n - 1)$. What is $a(12)$?", pre: "$a(12) =$", answer: 49, skill: "Use arithmetic sequence formulas",
            near: [{ v: 53, fb: "It's $n - 1 = 11$ steps of 4, not 12." }], hints: ["$a(12) = 5 + 4(11)$."], why: "$5 + 4(11) = 49$." },
          { type: "num", prompt: "A sequence has $a(1) = -2$ and $a(n) = a(n - 1) + 6$. What is $a(4)$?", pre: "$a(4) =$", answer: 16, skill: "Use arithmetic sequence formulas",
            near: [{ v: 22, fb: "From $a(1)$ to $a(4)$ is 3 steps, not 4." }], hints: ["$a(2) = 4$, $a(3) = 10$…"], why: "$-2, 4, 10, 16$: $a(4) = 16$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Writing arithmetic sequences",
        blurb: "Recursive and explicit formulas, and turning one into the other.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Recursive",
            prompt: "To write a recursive formula you need two things: the first term, and the common difference.",
            scene: { type: "walk", rows: [
              { say: "$8, 5, 2, -1, \\ldots$" },
              { m: "a(1) = 8", say: "The first term." },
              { m: "d = 5 - 8 = -3", say: "The common difference." },
              { m: "a(n) = a(n - 1) - 3", say: "Each term is the one before, minus 3." }] },
            gate: true },
          { type: "table", prompt: "Complete the recursive formula for $" + list([4, 13, 22, 31]) + "$: $$a(1) = \\square, \\;\\; a(n) = a(n - 1) + \\square$$", skill: "Recursive formulas for arithmetic sequences",
            head: ["$a(1)$", "added each time"], rows: [[null, null]], answers: [[0, 0, 4], [0, 1, 9]],
            hints: ["The first term is 4.", "$13 - 4 = 9$."], why: "$a(1) = 4$, $a(n) = a(n - 1) + 9$." },
          { type: "learn", kicker: "Explicit",
            prompt: "To reach term $n$ from the first term takes $n - 1$ steps of $d$. That's the explicit formula: $$a(n) = a(1) + d(n - 1)$$",
            scene: { type: "walk", rows: [
              { say: "$8, 5, 2, -1, \\ldots$" },
              { m: "a(n) = 8 - 3(n - 1)", say: "First term 8, then $n - 1$ steps of $-3$." },
              { m: "= 11 - 3n", say: "Multiplied out, it's the same rule — both are right." }] },
            gate: true },
          { type: "expr", prompt: "Write an explicit formula for $" + list([6, 10, 14, 18]) + "$", pre: "$a(n) =$", answer: "6 + 4(n - 1)", skill: "Explicit formulas for arithmetic sequences",
            keys: [["$n$", "n"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$+$", "+"]], placeholder: "e.g. 6 + 4(n - 1)",
            near: [{ v: "6 + 4n", fb: "Check $n = 1$: that gives 10, but the first term is 6. It's $n - 1$ steps of 4." }, { v: "4 + 6(n - 1)", fb: "The first term is 6 and the difference is 4 — swapped." }],
            hints: ["First term 6, common difference 4.", "$a(n) = a(1) + d(n - 1)$."], why: "$a(n) = 6 + 4(n - 1)$, which is also $4n + 2$." },
          { type: "learn", kicker: "Converting",
            prompt: "Both forms carry the same two numbers — the first term and the difference — so converting is just moving them across.",
            scene: { type: "walk", rows: [
              { m: "a(1) = -5, \\;\\; a(n) = a(n - 1) + 7", say: "Recursive: first term $-5$, difference 7." },
              { m: "a(n) = -5 + 7(n - 1)", say: "Explicit." },
              { m: "a(n) = 2 + 3(n - 1) \\;\\Rightarrow\\; a(1) = 2, \\; a(n) = a(n - 1) + 3", say: "And back again." }] },
            gate: true },
          { type: "expr", prompt: "Write the explicit formula for the sequence $a(1) = 12$, $a(n) = a(n - 1) - 5$.", pre: "$a(n) =$", answer: "12 - 5(n - 1)", skill: "Convert recursive & explicit forms (arithmetic)",
            keys: [["$n$", "n"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$+$", "+"]],
            near: [{ v: "12 - 5n", fb: "At $n = 1$ that's 7, not 12. Use $n - 1$ steps." }], hints: ["$a(n) = a(1) + d(n - 1)$ with $a(1) = 12$ and $d = -5$."], why: "$a(n) = 12 - 5(n - 1)$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Multiplying by the same amount",
        blurb: "Geometric sequences: a pattern that grows — or shrinks — by the same factor.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "This pattern doesn't add the same number of blocks each time. Move the slider and watch.",
            scene: { type: "pattern", r: 2, a: 1, n: 2, max: 6, gate: true, gateN: 5 }, gate: true,
            then: "Each figure has **twice** as many blocks as the one before: $1, 2, 4, 8, 16, \\ldots$ When you multiply by the same amount every time, it is a **geometric sequence**, and the amount is the **common ratio**, $r$." },
          { type: "num", prompt: "What is the next term of $" + list([3, 12, 48, 192]) + "$", answer: 768, skill: "Extend geometric sequences",
            near: [{ v: 336, fb: "The differences aren't equal — it multiplies by 4 each time." }], hints: ["$12 \\div 3 = 4$: what do you multiply by?"], why: "Multiply by 4: $192 \\times 4 = 768$." },
          { type: "learn", kicker: "Negatives and fractions",
            prompt: "The ratio can be a fraction (so the terms shrink) or negative (so the signs alternate). Find it by dividing any term by the one before.",
            scene: { type: "walk", rows: [
              { m: "80, 40, 20, 10, \\ldots", say: "$40 \\div 80 = \\frac{1}{2}$: each term is half the last. Next: $5$." },
              { m: "2, -6, 18, -54, \\ldots", say: "$-6 \\div 2 = -3$: multiply by $-3$, and the sign flips every time. Next: $162$." }] },
            gate: true },
          { type: "num", prompt: "What is the next term of $54, 18, 6, 2, \\ldots$? (A fraction is fine.)", answer: 2 / 3, skill: "Extend geometric sequences: negatives & fractions",
            near: [{ v: -2, fb: "It isn't subtracting a fixed amount: each term is a third of the one before." }, { v: 0, fb: "Divide by 3 — it doesn't reach zero." }],
            hints: ["$18 \\div 54 = \\frac{1}{3}$.", "$2 \\times \\frac{1}{3}$."], why: "$r = \\frac{1}{3}$, so the next term is $\\frac{2}{3}$." },
          { type: "num", prompt: "And the next term of $-1, 4, -16, 64, \\ldots$?", answer: -256, skill: "Extend geometric sequences: negatives & fractions",
            near: [{ v: 256, fb: "The ratio is $-4$, so the signs alternate: after a positive term comes a negative one." }], hints: ["$4 \\div (-1) = -4$."], why: "$64 \\times (-4) = -256$." },
          { type: "learn", kicker: "Formulas",
            prompt: "The same two kinds of formula, with multiplying instead of adding.",
            scene: { type: "walk", rows: [
              { m: "a(1) = 3, \\;\\; a(n) = a(n - 1) \\cdot 2", say: "**Recursive**: start at 3, double each time." },
              { m: "a(n) = 3 \\cdot 2^{n - 1}", say: "**Explicit**: $n - 1$ doublings of the first term." },
              { m: "a(6) = 3 \\cdot 2^5 = 96", say: "" }] },
            gate: true },
          { type: "num", prompt: "A sequence has $a(n) = 5 \\cdot 3^{n - 1}$. What is $a(4)$?", pre: "$a(4) =$", answer: 135, skill: "Use geometric sequence formulas",
            near: [{ v: 405, fb: "It's $3^{n - 1} = 3^3$, not $3^4$." }, { v: 3375, fb: "Only the 3 is raised to the power: $5 \\cdot 27$, not $15^3$." }],
            hints: ["$a(4) = 5 \\cdot 3^3$."], why: "$5 \\cdot 27 = 135$." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Writing geometric sequences",
        blurb: "Recursive and explicit formulas with a common ratio.",
        mins: 9, v: 1,
        steps: [
          { type: "table", prompt: "Complete the recursive formula for $" + list([5, 15, 45, 135]) + "$: $$a(1) = \\square, \\;\\; a(n) = a(n - 1) \\cdot \\square$$", skill: "Recursive formulas for geometric sequences",
            head: ["$a(1)$", "multiplied by"], rows: [[null, null]], answers: [[0, 0, 5], [0, 1, 3]],
            hints: ["The first term is 5.", "$15 \\div 5 = 3$."], why: "$a(1) = 5$, $a(n) = a(n - 1) \\cdot 3$." },
          { type: "learn", kicker: "Explicit",
            prompt: "Term $n$ is the first term multiplied by $r$, $n - 1$ times: $$a(n) = a(1) \\cdot r^{n - 1}$$" },
          { type: "expr", prompt: "Write an explicit formula for $" + list([2, 10, 50, 250]) + "$", pre: "$a(n) =$", answer: "2*5^(n - 1)", skill: "Explicit formulas for geometric sequences",
            keys: [["$n$", "n"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$\\cdot$", "*"], ["$x^{\\square}$", "^()", -1]], placeholder: "e.g. 2*5^(n - 1)",
            near: [{ v: "2*5^n", fb: "At $n = 1$ that gives 10, not 2. The power is $n - 1$." }, { v: "5*2^(n - 1)", fb: "The first term is 2 and the ratio is 5 — swapped." }],
            hints: ["First term 2, ratio 5.", "$a(n) = a(1) \\cdot r^{n - 1}$."], why: "$a(n) = 2 \\cdot 5^{n - 1}$." },
          { type: "table", prompt: "The explicit formula $a(n) = 7 \\cdot \\left(\\frac{1}{2}\\right)^{n - 1}$ as a recursive one: $$a(1) = \\square, \\;\\; a(n) = a(n - 1) \\cdot \\square$$", skill: "Convert recursive & explicit forms (geometric)",
            head: ["$a(1)$", "multiplied by"], rows: [[null, null]], answers: [[0, 0, 7], [0, 1, 0.5]],
            hints: ["The number in front is the first term; the base of the power is the ratio."], why: "$a(1) = 7$, $a(n) = a(n - 1) \\cdot \\frac{1}{2}$." },
          { type: "choice", prompt: "Which explicit formula matches $a(1) = 4$, $a(n) = a(n - 1) \\cdot (-3)$?", skill: "Convert recursive & explicit forms (geometric)",
            options: [{ t: "$a(n) = 4 \\cdot (-3)^{n - 1}$" }, { t: "$a(n) = 4 - 3(n - 1)$", fb: "That adds $-3$ each time. This sequence multiplies by $-3$." },
                      { t: "$a(n) = -3 \\cdot 4^{n - 1}$", fb: "The first term is 4, and the ratio $-3$ is what's raised to the power." }, { t: "$a(n) = 4 \\cdot (-3)^n$", fb: "At $n = 1$ that gives $-12$, not 4." }],
            answer: 0, why: "First term 4, ratio $-3$: $a(n) = 4 \\cdot (-3)^{n - 1}$." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Sequences in the world",
        blurb: "Adding or multiplying? Modelling real patterns with sequences.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "Which kind?",
            prompt: "A real pattern that goes up by the same **amount** each step is arithmetic; one that goes up by the same **factor** is geometric.",
            scene: { type: "walk", rows: [
              { say: "A theatre has 20 seats in the first row and 3 more in each row after." },
              { m: "a(n) = 20 + 3(n - 1)", say: "Adding 3 each time: arithmetic. Row 15 has $20 + 3(14) = 62$ seats." },
              { say: "A colony of bacteria doubles every hour, starting from 50." },
              { m: "b(n) = 50 \\cdot 2^{n - 1}", say: "Multiplying by 2: geometric. At the 6th count it's $50 \\cdot 2^5 = 1600$." }] },
            gate: true },
          { type: "num", prompt: "Mo saves \\$15 in the first week and \\$4 more each week than the week before. How much does he save in week 10?", pre: "\\$", answer: 51, skill: "Sequences word problems",
            near: [{ v: 55, fb: "Week 10 is 9 steps after week 1." }], hints: ["$a(n) = 15 + 4(n - 1)$."], why: "$15 + 4(9) = 51$." },
          { type: "num", prompt: "A bouncing ball rises to 81 cm on its first bounce, and each bounce is $\\frac{2}{3}$ as high as the one before. How high is the 4th bounce, in cm?", answer: 24, skill: "Sequences word problems",
            near: [{ v: 16, fb: "That's the 5th bounce." }], hints: ["$81, 54, 36, \\ldots$"], why: "$81 \\cdot \\left(\\frac{2}{3}\\right)^3 = 24$ cm." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Sequences in general",
        blurb: "Other recursive rules, and why a sequence's inputs are whole numbers.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "Any rule",
            prompt: "A recursive rule doesn't have to add or multiply by a fixed number. To evaluate one, just follow it, one term at a time.",
            scene: { type: "walk", rows: [
              { m: "a(1) = 2, \\;\\; a(n) = 3 \\cdot a(n - 1) - 4", say: "" },
              { m: "a(2) = 3(2) - 4 = 2", say: "" },
              { m: "\\text{and every term is } 2", say: "A rule can even stand still." },
              { m: "f(1) = 1, \\; f(2) = 1, \\; f(n) = f(n - 1) + f(n - 2)", say: "This one adds the two before: $1, 1, 2, 3, 5, 8, \\ldots$ — the Fibonacci sequence." }] },
            gate: true },
          { type: "num", prompt: "$a(1) = 5$ and $a(n) = 2 \\cdot a(n - 1) - 3$. What is $a(4)$?", pre: "$a(4) =$", answer: 19, skill: "Evaluate sequences in recursive form",
            near: [{ v: 11, fb: "That's $a(3)$. One more step." }], hints: ["$a(2) = 2(5) - 3 = 7$.", "$a(3) = 2(7) - 3 = 11$."], why: "$5, 7, 11, 19$." },
          { type: "learn", kicker: "Domain",
            prompt: "A sequence's inputs are term numbers: $1, 2, 3, \\ldots$ There is no term number $2.5$, and none before the first. So the **domain** of a sequence is the positive whole numbers (or a stretch of them, if it stops) — even when its formula would accept other inputs." },
          { type: "choice", prompt: "Which of these is **not** in the domain of the sequence $a(n) = 7 + 2(n - 1)$?", skill: "Sequences and domain",
            options: [{ t: "$n = 3.5$" }, { t: "$n = 1$", fb: "1 is the first term number." }, { t: "$n = 100$", fb: "The 100th term exists: $7 + 2(99) = 205$." }],
            answer: 0, why: "Term numbers are whole: there's a 3rd and a 4th term, but no 3.5th." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Arithmetic sequences: extending them, using and writing their formulas.", skills: ["a9-ext-a", "a9-use-a", "a9-rec-a", "a9-exp-a", "a9-conv-a"], per: 2 },
      { title: "Quiz 2", after: 4, blurb: "Geometric sequences: extending them, using and writing their formulas.", skills: ["a9-ext-g", "a9-ext-g2", "a9-use-g", "a9-rec-g", "a9-exp-g", "a9-conv-g"], per: 2 },
      { title: "Quiz 3", after: 6, blurb: "Sequences in the world, recursive rules, and domain.", skills: ["a9-words", "a9-rec-eval", "a9-domain"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Sequences and terms",
        say: ["A **sequence** is a list of numbers in order; each one is a **term**. $a(n)$ means the $n$th term, so a sequence is a function whose inputs are the term numbers $1, 2, 3, \\ldots$",
              "Its **domain** is those whole numbers — there's no term $2.5$ — even if its formula would accept other inputs."] },
      { t: "Arithmetic sequences",
        say: ["Add the same **common difference** $d$ each time: $3, 5, 7, 9, \\ldots$ ($d = 2$). Find $d$ by subtracting any term from the next; it can be negative."],
        keys: [["Recursive", "$a(1) = \\text{first term}, \\; a(n) = a(n - 1) + d$"], ["Explicit", "$a(n) = a(1) + d(n - 1)$"]],
        eg: { q: "Write both formulas for $8, 5, 2, -1, \\ldots$", rows: [["a(1) = 8, \\; a(n) = a(n - 1) - 3", "First term 8, $d = -3$."], ["a(n) = 8 - 3(n - 1)", "Also $a(n) = 11 - 3n$."]] },
        watch: "Term $n$ is $n - 1$ steps after the first, not $n$ steps: $a(12) = 5 + 4(11)$." },
      { t: "Geometric sequences",
        say: ["Multiply by the same **common ratio** $r$ each time: $1, 2, 4, 8, \\ldots$ ($r = 2$). Find $r$ by dividing any term by the one before. A fraction between 0 and 1 makes the terms shrink; a negative ratio makes their signs alternate."],
        keys: [["Recursive", "$a(1) = \\text{first term}, \\; a(n) = a(n - 1) \\cdot r$"], ["Explicit", "$a(n) = a(1) \\cdot r^{n - 1}$"]],
        eg: { q: "Find $a(4)$ for $a(n) = 5 \\cdot 3^{n - 1}$.", rows: [["5 \\cdot 3^3", "The power is $n - 1 = 3$."], ["5 \\cdot 27 = 135", "Only the 3 is raised to the power."]] },
        watch: "$5 \\cdot 3^3$ is $5 \\times 27$, not $15^3$: powers come before multiplying." },
      { t: "Converting between forms",
        say: ["Both forms carry the same two numbers — the first term and the difference (or ratio). Read them from one form and write them into the other.",
              "If an explicit arithmetic formula is multiplied out, like $a(n) = 11 - 3n$, find the first term by putting in $n = 1$, and the difference is the number multiplying $n$."] },
      { t: "Sequences in the world, and other rules",
        say: ["The same amount added each step → arithmetic. The same factor each step → geometric.",
              "Any recursive rule can be evaluated by following it one term at a time, like $a(n) = 2a(n - 1) - 3$ or the Fibonacci rule $f(n) = f(n - 1) + f(n - 2)$."],
        eg: { q: "$a(1) = 5$, $a(n) = 2a(n - 1) - 3$. Find $a(4)$.", rows: [["a(2) = 7, \\; a(3) = 11", ""], ["a(4) = 2(11) - 3 = 19", ""]] } }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a9-ext-a", title: "Extend arithmetic sequences", lesson: 1,
        gen: function (R) {
          var a = R.int(-20, 30), d = R.nz(-9, 12), k = R.pick([1, 1, 2, 3]);
          var terms = [1, 2, 3, 4].map(function (n) { return arith(a, d, n); }), want = arith(a, d, 4 + k);
          return { type: "num", prompt: "What is the " + ["", "next", "second", "third"][k] + " term after these? $" + list(terms) + "$", answer: want,
            near: nears(want, [{ v: terms[3] + d * k + 1, fb: "Check the difference again: it's " + d + " each time." }, { v: arith(a, -d, 4 + k), fb: "The terms go " + (d > 0 ? "up" : "down") + "." }].filter(function () { return k === 1; })),
            hints: ["The common difference is $" + terms[1] + " - " + paren(terms[0]) + " = " + d + "$."], why: "Add $" + d + "$ " + (k === 1 ? "once" : k + " times") + ": $" + want + "$." };
        } },
      { id: "a9-use-a", title: "Use arithmetic sequence formulas", lesson: 1,
        gen: function (R) {
          var a = R.int(-10, 20), d = R.nz(-8, 9);
          if (R.chance(0.55)) { var n = R.int(8, 40), v = arith(a, d, n);
            return { type: "num", prompt: "A sequence has $" + explicitA(a, d) + "$. What is $a(" + n + ")$?", pre: "$a(" + n + ") =$", answer: v,
              near: nears(v, [{ v: a + d * n, fb: "It's $" + (n - 1) + "$ steps, not " + n + "." }]), hints: ["$a(" + n + ") = " + a + plusTex(d) + "(" + (n - 1) + ")$."], why: "$" + a + plusTex(d) + "(" + (n - 1) + ") = " + v + "$." }; }
          var m = R.int(3, 6), v2 = arith(a, d, m);
          return { type: "num", prompt: "A sequence has $" + recA(a, d) + "$. What is $a(" + m + ")$?", pre: "$a(" + m + ") =$", answer: v2,
            near: nears(v2, [{ v: a + d * m, fb: "From $a(1)$ to $a(" + m + ")$ is " + (m - 1) + " steps." }]),
            hints: ["List the terms: $" + [1, 2, 3].map(function (k) { return arith(a, d, k); }).join(", ") + ", \\ldots$"], why: "$" + [1, 2, 3, 4, 5, 6].slice(0, m).map(function (k) { return arith(a, d, k); }).join(", ") + "$." };
        } },
      { id: "a9-rec-a", title: "Recursive formulas for arithmetic sequences", lesson: 2,
        gen: function (R) {
          var a = R.int(-15, 25), d = R.nz(-9, 12), terms = [1, 2, 3, 4].map(function (n) { return arith(a, d, n); });
          var s = blanks("$a(1)$", "added each time", a, d);
          s.prompt = "Complete the recursive formula for $" + list(terms) + "$: $$a(1) = \\square, \\;\\; a(n) = a(n - 1) + \\square$$";
          s.hints = ["The first term is " + a + ".", "The common difference: $" + terms[1] + " - " + paren(terms[0]) + "$."];
          s.why = "$a(1) = " + a + "$ and $a(n) = a(n - 1)" + plusTex(d) + "$.";
          return s;
        } },
      { id: "a9-exp-a", title: "Explicit formulas for arithmetic sequences", lesson: 2,
        gen: function (R) {
          var a = R.int(-15, 25), d = R.nz(-9, 12), terms = [1, 2, 3, 4].map(function (n) { return arith(a, d, n); });
          return { type: "expr", prompt: "Write an explicit formula for $" + list(terms) + "$", pre: "$a(n) =$", answer: a + " + " + paren(d) + "*(n - 1)", shown: num(a) + plusTex(d) + "(n - 1)",
            keys: [["$n$", "n"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$+$", "+"]], placeholder: "e.g. 6 + 4(n - 1)",
            near: [{ v: a + " + " + paren(d) + "*n", fb: "Check $n = 1$: that gives " + (a + d) + ", not " + a + ". Term $n$ is $n - 1$ steps from the first." }, { v: d + " + " + paren(a) + "*(n - 1)", fb: "First term and difference are swapped." }].filter(function (z) { return a !== d; }),
            hints: ["First term " + a + ", common difference " + d + ".", "$a(n) = a(1) + d(n - 1)$."], why: "$" + explicitA(a, d) + "$, or multiplied out, $a(n) = " + poly([[d, "n"], [a - d, ""]]) + "$." };
        } },
      { id: "a9-conv-a", title: "Convert recursive & explicit forms of arithmetic sequences", lesson: 2,
        gen: function (R) {
          var a = R.int(-12, 20), d = R.nz(-9, 9);
          if (R.chance(0.5)) return { type: "expr", prompt: "Write the explicit formula for the sequence $" + recA(a, d) + "$.", pre: "$a(n) =$", answer: a + " + " + paren(d) + "*(n - 1)", shown: num(a) + plusTex(d) + "(n - 1)",
            keys: [["$n$", "n"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$+$", "+"]],
            near: [{ v: a + " + " + paren(d) + "*n", fb: "At $n = 1$ that isn't " + a + ". Use $n - 1$." }], hints: ["First term " + a + ", difference " + d + ": $a(n) = a(1) + d(n - 1)$."], why: "$" + explicitA(a, d) + "$." };
          var multOut = R.chance(0.5), tex = multOut ? "a(n) = " + poly([[d, "n"], [a - d, ""]]) : explicitA(a, d);
          var s = blanks("$a(1)$", "added each time", a, d);
          s.prompt = "Write $" + tex + "$ as a recursive formula: $$a(1) = \\square, \\;\\; a(n) = a(n - 1) + \\square$$";
          s.hints = [multOut ? "Put $n = 1$ in to find the first term." : "The first term is the number on its own: " + a + ".", "The difference is the number multiplying " + (multOut ? "$n$" : "$(n - 1)$") + "."];
          s.why = "$a(1) = " + a + "$ and $a(n) = a(n - 1)" + plusTex(d) + "$.";
          return s;
        } },
      { id: "a9-ext-g", title: "Extend geometric sequences", lesson: 3,
        gen: function (R) {
          var a = R.pick([1, 2, 3, 4, 5, -2, -3]), r = R.pick([2, 3, 4, 5]), terms = [1, 2, 3, 4].map(function (n) { return geom(a, r, n); }), want = geom(a, r, 5);
          return { type: "num", prompt: "What is the next term of $" + list(terms) + "$", answer: want,
            near: nears(want, [{ v: terms[3] + (terms[3] - terms[2]), fb: "The differences aren't equal: each term is " + r + " times the one before." }]),
            hints: ["$" + terms[1] + " \\div " + paren(terms[0]) + " = " + r + "$."], why: "Multiply by " + r + ": $" + terms[3] + " \\times " + r + " = " + want + "$." };
        } },
      { id: "a9-ext-g2", title: "Extend geometric sequences: negatives & fractions", lesson: 3,
        gen: function (R) {
          var T = R.pick(["half", "third", "neg", "negfrac"]), a, r, den = null;
          if (T === "half") { r = 0.5; a = R.pick([16, 32, 48, 64, 80, 96]); }
          else if (T === "third") { r = 1 / 3; a = R.pick([27, 54, 81, 162]); }
          else if (T === "neg") { r = -R.pick([2, 3]); a = R.pick([1, 2, 3, -1, -2]); }
          else { r = -0.5; a = R.pick([16, 32, 64, 48]); }
          var terms = [1, 2, 3, 4].map(function (n) { return geom(a, r, n); }), want = geom(a, r, 5);
          if (want % 1) den = r === 1 / 3 ? 3 : 2;
          var rt = r === 1 / 3 ? "\\frac{1}{3}" : rTex(r);
          return { type: "num", prompt: "What is the next term of $" + listF(terms, 1) + "$? (A fraction is fine.)", answer: want,
            near: nears(want, [{ v: -want, fb: r < 0 ? "The ratio is negative, so the sign flips every term." : "The terms keep their sign." }, { v: terms[3] + (terms[3] - terms[2]), fb: "Each term is the one before times $" + rt + "$ — not a fixed amount added." }]),
            hints: ["Divide a term by the one before: $" + num(terms[1]) + " \\div " + paren(terms[0]) + " = " + rt + "$."],
            why: "Multiply by $" + rt + "$: $" + num(terms[3]) + " \\times " + (r < 0 ? "\\left(" + rt + "\\right)" : rt) + " = " + (den ? frac(Math.round(want * den), den) : num(want)) + "$." };
        } },
      { id: "a9-use-g", title: "Use geometric sequence formulas", lesson: 3,
        gen: function (R) {
          var a = R.pick([1, 2, 3, 4, 5, 6]), r = R.pick([2, 3, -2]);
          if (R.chance(0.55)) { var n = R.int(3, 6), v = geom(a, r, n);
            return { type: "num", prompt: "A sequence has $" + explicitG(a, r) + "$. What is $a(" + n + ")$?", pre: "$a(" + n + ") =$", answer: v,
              near: nears(v, [{ v: a * Math.pow(r, n), fb: "The power is $n - 1 = " + (n - 1) + "$." }, { v: Math.pow(a * r, n - 1), fb: "Only the ratio is raised to the power; multiply by " + a + " after." }]),
              hints: ["$a(" + n + ") = " + a + " \\cdot " + paren(r) + "^{" + (n - 1) + "}$."], why: "$" + a + " \\cdot " + paren(r) + "^{" + (n - 1) + "} = " + a + " \\cdot " + paren(Math.pow(r, n - 1)) + " = " + v + "$." }; }
          var m = R.int(3, 5), v2 = geom(a, r, m);
          return { type: "num", prompt: "A sequence has $" + recG(a, r) + "$. What is $a(" + m + ")$?", pre: "$a(" + m + ") =$", answer: v2,
            near: nears(v2, [{ v: geom(a, r, m + 1), fb: "That's one term too far." }]),
            hints: ["Start at " + a + " and multiply by " + r + " each time."], why: "$" + [1, 2, 3, 4, 5].slice(0, m).map(function (k) { return geom(a, r, k); }).join(", ") + "$." };
        } },
      { id: "a9-rec-g", title: "Recursive formulas for geometric sequences", lesson: 4,
        gen: function (R) {
          var a = R.pick([1, 2, 3, 4, 5, -2, -3, 6]), r = R.pick([2, 3, 4, -2, -3]), terms = [1, 2, 3, 4].map(function (n) { return geom(a, r, n); });
          var s = blanks("$a(1)$", "multiplied by", a, r);
          s.prompt = "Complete the recursive formula for $" + list(terms) + "$: $$a(1) = \\square, \\;\\; a(n) = a(n - 1) \\cdot \\square$$";
          s.hints = ["The first term is " + a + ".", "The ratio: $" + terms[1] + " \\div " + paren(terms[0]) + "$."];
          s.why = "$a(1) = " + a + "$ and $a(n) = a(n - 1) \\cdot " + paren(r) + "$.";
          return s;
        } },
      { id: "a9-exp-g", title: "Explicit formulas for geometric sequences", lesson: 4,
        gen: function (R) {
          var a = R.pick([1, 2, 3, 4, 5, 6, 7]), r = R.pick([2, 3, 4, 5, 0.5]), terms = [1, 2, 3, 4].map(function (n) { return geom(a, r, n); });
          var rs = r === 0.5 ? "(1/2)" : String(r);
          if (R.chance(0.3)) { var rn = -R.pick([2, 3]), tn = [1, 2, 3, 4].map(function (n) { return geom(a, rn, n); });
            return mc(R, { prompt: "Which explicit formula describes $" + list(tn) + "$", right: "$" + explicitG(a, rn) + "$",
              wrong: [{ t: "$" + explicitG(a, -rn) + "$", fb: "The signs alternate, so the ratio is negative." }, { t: "$a(n) = " + a + " \\cdot (" + rn + ")^n$", fb: "At $n = 1$ that isn't " + a + ". The power is $n - 1$." },
                      { t: "$a(n) = " + a + plusTex(tn[1] - tn[0]) + "(n - 1)$", fb: "That adds a fixed amount; this sequence multiplies." }],
              hints: ["Divide a term by the one before to find the ratio."], why: "First term " + a + ", ratio $" + rn + "$." });
          }
          return { type: "expr", prompt: "Write an explicit formula for $" + listF(terms, r === 0.5 ? 8 : 1) + "$", pre: "$a(n) =$", answer: a + "*" + rs + "^(n - 1)", shown: a + "*" + rs + "^(n - 1)",
            keys: [["$n$", "n"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$\\cdot$", "*"], ["$\\frac{a}{b}$", "/"], ["$x^{\\square}$", "^()", -1]], placeholder: "e.g. 3*2^(n - 1)",
            near: [{ v: a + "*" + rs + "^n", fb: "At $n = 1$ that's " + num(a * r) + ", not " + a + ". The power is $n - 1$." }].concat(a !== r && r !== 0.5 ? [{ v: r + "*" + a + "^(n - 1)", fb: "First term and ratio are swapped." }] : []),
            hints: ["First term " + a + ", ratio " + (r === 0.5 ? "$\\frac{1}{2}$" : r) + ".", "$a(n) = a(1) \\cdot r^{n - 1}$."], why: "$" + explicitG(a, r) + "$." };
        } },
      { id: "a9-conv-g", title: "Convert recursive & explicit forms of geometric sequences", lesson: 4,
        gen: function (R) {
          var a = R.pick([2, 3, 4, 5, 6, 8, 10]), r = R.pick([2, 3, 4, 0.5]);
          if (R.chance(0.5)) { var s = blanks("$a(1)$", "multiplied by", a, r);
            s.prompt = "Write $" + explicitG(a, r) + "$ as a recursive formula: $$a(1) = \\square, \\;\\; a(n) = a(n - 1) \\cdot \\square$$";
            s.hints = ["The number in front is the first term.", "The base of the power is the ratio."]; s.why = "$" + recG(a, r) + "$."; return s; }
          var rs = r === 0.5 ? "(1/2)" : String(r);
          return { type: "expr", prompt: "Write the explicit formula for $" + recG(a, r) + "$.", pre: "$a(n) =$", answer: a + "*" + rs + "^(n - 1)", shown: a + "*" + rs + "^(n - 1)",
            keys: [["$n$", "n"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$\\cdot$", "*"], ["$\\frac{a}{b}$", "/"], ["$x^{\\square}$", "^()", -1]],
            near: [{ v: a + "*" + rs + "^n", fb: "The power is $n - 1$: at $n = 1$ it must give " + a + "." }], hints: ["$a(n) = a(1) \\cdot r^{n - 1}$."], why: "$" + explicitG(a, r) + "$." };
        } },
      { id: "a9-words", title: "Sequences word problems", lesson: 5,
        gen: function (R) {
          var T = R.pick([
            function () { var a = R.int(12, 30), d = R.int(2, 5), n = R.int(8, 25); return { p: "A theatre has " + a + " seats in row 1, and each row has " + d + " more than the row in front. How many seats are in row " + n + "?", a: arith(a, d, n), f: "a(n) = " + a + " + " + d + "(n - 1)", off: a + d * n }; },
            function () { var a = R.int(10, 25), d = R.int(3, 8), n = R.int(6, 15); return { p: "Nia runs " + a + " minutes on day 1 of a training plan, and " + d + " minutes more each day. How many minutes does she run on day " + n + "?", a: arith(a, d, n), f: "a(n) = " + a + " + " + d + "(n - 1)", off: a + d * n }; },
            function () { var a = R.pick([50, 100, 200]), r = R.pick([2, 3]), n = R.int(4, 6); return { p: "A culture of bacteria starts at " + a + " cells and " + (r === 2 ? "doubles" : "triples") + " every hour. The first count is " + a + ". How many cells are there at the " + n + "th count?", a: geom(a, r, n), f: "a(n) = " + a + " \\cdot " + r + "^{n - 1}", off: geom(a, r, n + 1) }; },
            function () { var a = R.pick([64, 128, 256, 96]), n = R.int(3, 5); return { p: "A ball's first bounce reaches " + a + " cm and each bounce reaches half the height of the one before. How high is bounce " + n + ", in cm?", a: geom(a, 0.5, n), f: "a(n) = " + a + " \\cdot \\left(\\frac{1}{2}\\right)^{n - 1}", off: geom(a, 0.5, n + 1) }; },
            function () { var a = R.pick([1000, 2000, 5000]), n = R.int(3, 5); return { p: "A town's population is " + a + " in year 1 and grows by 10% each year, so each year's is 1.1 times the last. What is it in year " + n + "? (Round to the nearest person if needed.)", a: Math.round(geom(a, 1.1, n)), f: "a(n) = " + a + " \\cdot 1.1^{n - 1}", off: Math.round(geom(a, 1.1, n + 1)) }; }])();
          return { type: "num", prompt: T.p, answer: T.a, near: nears(T.a, [{ v: T.off, fb: "That's one term too far: term $n$ is $n - 1$ steps after the first." }]),
            hints: ["Is it adding the same amount (arithmetic) or multiplying (geometric)?", "$" + T.f + "$."], why: "$" + T.f + "$ gives " + num(T.a) + "." };
        } },
      { id: "a9-rec-eval", title: "Evaluate sequences in recursive form", lesson: 6,
        gen: function (R) {
          var T = R.int(0, 2), n = R.int(3, 5), seq = [], rule;
          if (T === 0) { var p = R.pick([2, 3, -1, -2]), q = R.nz(-5, 5), a = R.int(-4, 6); rule = "a(n) = " + (p === -1 ? "-" : p + " \\cdot ") + "a(n - 1)" + plusTex(q); seq = [a]; for (var i = 1; i < n; i++) seq.push(p * seq[i - 1] + q); rule = "a(1) = " + a + ", \\;\\; " + rule; }
          else if (T === 1) { var f1 = R.int(1, 4), f2 = R.int(1, 6); rule = "a(1) = " + f1 + ", \\; a(2) = " + f2 + ", \\; a(n) = a(n - 1) + a(n - 2)"; seq = [f1, f2]; for (var j = 2; j < n + 1; j++) seq.push(seq[j - 1] + seq[j - 2]); n = n + 1; }
          else { var s0 = R.int(1, 5); rule = "a(1) = " + s0 + ", \\;\\; a(n) = a(n - 1) + n"; seq = [s0]; for (var k = 2; k <= n; k++) seq.push(seq[k - 2] + k); }
          var v = seq[n - 1];
          return { type: "num", prompt: "A sequence is defined by $" + rule + "$. What is $a(" + n + ")$?", pre: "$a(" + n + ") =$", answer: v,
            near: nears(v, [{ v: seq[n - 2], fb: "That's $a(" + (n - 1) + ")$. One more step." }]),
            hints: ["Work out the terms one at a time: $a(2)$, then $a(3)$…"], why: "$" + seq.slice(0, n).join(", ") + "$." };
        } },
      { id: "a9-domain", title: "Sequences and domain", lesson: 6,
        gen: function (R) {
          var a = R.int(-5, 20), d = R.nz(-6, 6), T = R.int(0, 1);
          if (T === 0) { var bad = R.pick([0, -1, -3, 2.5, 0.5]), good = R.distinct(2, 1, 60);
            return mc(R, { prompt: "Which of these is **not** in the domain of the sequence $" + explicitA(a, d) + "$?", right: "$n = " + num(bad) + "$",
              wrong: good.map(function (g) { return { t: "$n = " + g + "$", fb: "There is a term number " + g + "." }; }),
              hints: ["A sequence's inputs are term numbers: 1, 2, 3, …"], why: bad % 1 ? "There is no term number " + num(bad) + " — term numbers are whole." : "Term numbers start at 1." }); }
          var N = R.int(8, 30);
          return mc(R, { prompt: "A sequence lists the number of seats in each of the " + N + " rows of a hall. What is its domain?", right: "The whole numbers from 1 to " + N,
            wrong: [{ t: "All real numbers from 1 to " + N, fb: "There's no row 2.5." }, { t: "All whole numbers", fb: "The hall has only " + N + " rows, and no row 0 or −1." }],
            hints: ["The inputs are row numbers. Which ones exist?"], why: "Rows are numbered 1, 2, …, " + N + "." });
        } }
    ]
  });
})();
