/* ==========================================================================
   Algebra I — Unit 1: Algebra foundations. See lab/core.js for the format.

   Seven lessons, each built round something to move: a number trick that
   only algebra can explain, a function machine, an order-of-operations board
   you tap through, a rectangle you size, algebra tiles whose zero pairs
   cancel, an area model, a side-by-side substitution tester, and a bar cut
   into ever-smaller pieces. Problems come first; the idea is named after it
   has been used; every likely wrong answer has its own reply.

   Eleven skills practise it, Khan-style: every sitting is freshly generated,
   with hints and a worked solution. Two quizzes check it along the way, and
   the unit test at the end draws from every skill.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, frac = L.frac, num = L.num, mc = L.mc;

  // A worked calculation, one line per step.
  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }

  L.unit("alg", 1, {
    title: "Algebra foundations",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Think of a number",
        blurb: "A trick that works for every number — and the only way to prove it.",
        mins: 7,
        steps: [
          { type: "learn", kicker: "Try this",
            prompt: "Pick a number and follow the steps. Then pick another. Try at least three — and then press **Show it with a letter**.",
            scene: { type: "trick", v: 7, min: 1, max: 50,
                     steps: [{ t: "Think of a number", e: "n" }, { t: "Double it", e: "2n" }, { t: "Add 6", e: "2n + 6" },
                             { t: "Halve it", e: "n + 3" }, { t: "Take away the number you started with", e: "3" }] },
            gate: true,
            then: "It always lands on 3. Trying numbers can only show it works for *those* numbers. The letter $n$ shows it works for **every** number: doubling and halving cancel out, the 6 halves to 3, and taking away $n$ leaves exactly 3." },
          { type: "choice", prompt: "So why does the trick always end at 3?",
            options: [{ t: "Doubling then halving undo each other, and the added 6 is halved to 3" },
                      { t: "3 is special — tricks like this always end at 3", fb: "Change “Add 6” to “Add 10” and it ends at 5. The ending comes from the steps, not from 3." },
                      { t: "It only works for small numbers", fb: "Try 1,000: 2,000, then 2,006, then 1,003, then 3. It works for every number." },
                      { t: "Because you take away your number at the end", fb: "That's part of it — but it only leaves 3 because the earlier steps turned $n$ into $n + 3$." }],
            answer: 0, skill: "Explain with a letter",
            why: "With a letter: $n \\to 2n \\to 2n + 6 \\to n + 3 \\to 3$." },
          { type: "learn", prompt: "That letter is a **variable**: a symbol that stands for a number — any number, or one we don't know yet. Algebra is arithmetic with some of the numbers left as slots, so an argument can cover every number at once.",
            after: "The word comes from *al-jabr* — “restoring”, “putting back together” — in the title of a book written in Baghdad around 820 by Muhammad ibn Musa al-Khwarizmi, about solving problems by keeping both sides of an equation balanced. His own name gave us the word *algorithm*." },
          { type: "choice", prompt: "A new trick: think of a number, **add 5**, **multiply by 2**, **take away 10**, **halve it**. Whatever you start with, what do you end on?",
            scene: { type: "trick", v: 4, min: 1, max: 40,
                     steps: [{ t: "Think of a number", e: "n" }, { t: "Add 5", e: "n + 5" }, { t: "Multiply by 2", e: "2n + 10" }, { t: "Take away 10", e: "2n" }, { t: "Halve it", e: "n" }] },
            options: [{ t: "The number you started with" }, { t: "5", fb: "Try the scene with two different numbers — do they end in the same place?" },
                      { t: "10", fb: "The 10 you took away was the 10 made by doubling the 5." }, { t: "0", fb: "Try it with 4: 9, 18, 8, 4." }],
            answer: 0, skill: "Explain with a letter",
            why: "$n + 5 \\to 2n + 10 \\to 2n \\to n$: every step is undone by a later one." },
          { type: "expr", prompt: "Start with $n$. **Multiply by 3**, **add 12**, **divide by 3**. What expression do you have now?", answer: "n + 4",
            keys: [["$n$", "n"], ["$+$", "+"], ["$-$", "-"]], placeholder: "Type it with n", skill: "Write an expression",
            near: [{ v: "n + 12", fb: "Dividing by 3 divides the 12 as well: $\\frac{3n + 12}{3} = n + 4$." }, { v: "3n + 4", fb: "Dividing by 3 undoes the multiplying by 3 too." }],
            hints: ["After two steps you have $3n + 12$.", "Divide *each part* by 3."],
            why: "$n \\to 3n \\to 3n + 12 \\to n + 4$. (So if the trick then takes away your number, it always ends on 4.)" },
          { type: "choice", prompt: "Design a trick that always ends on **7**. Which final step works after $n \\to 2n \\to 2n + 14 \\to n + 7$?",
            options: [{ t: "Take away the number you started with" }, { t: "Take away 7", fb: "That leaves $n$ — the number you started with, not 7." }, { t: "Halve it again", fb: "$\\frac{n + 7}{2}$ still depends on $n$." }],
            answer: 0, skill: "Explain with a letter", why: "$n + 7 - n = 7$, for every $n$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "A letter for a number",
        blurb: "Put a number in, get a number out — in the right order.",
        mins: 10,
        steps: [
          { type: "num", kicker: "Warm up",
            prompt: "A taxi charges $\\$3$ to get in, then $\\$2$ for every mile. What does a 4-mile ride cost?",
            pre: "$\\$$", answer: 11,
            near: [{ v: 20, fb: "That charges the $\\$3$ for every mile too. It's paid once, when you get in." },
                   { v: 8, fb: "That's the miles — $4 \\times \\$2$ — but you haven't paid to get in yet." },
                   { v: 14, fb: "That's $\\$3$ a mile plus $\\$2$. The $\\$2$ is per mile; the $\\$3$ is once." }],
            hints: ["Pay to get in first. Then add the cost of the miles."],
            why: "$\\$3$ to get in, plus $4 \\times \\$2 = \\$8$ for the miles: $\\$11$." },
          { type: "num", prompt: "Same taxi. A 10-mile ride?", pre: "$\\$$", answer: 23,
            near: [{ v: 50, fb: "The $\\$3$ is only paid once." }, { v: 20, fb: "Add the $\\$3$ to get in." }],
            why: "$3 + 2 \\times 10 = 23$ — exactly the same calculation, with a different number." },
          { type: "learn",
            prompt: "You did the same calculation twice. Algebra writes it once: if a ride is $m$ miles, it costs $$3 + 2m$$ Put some numbers into the machine and watch the rule work.",
            scene: { type: "machine", rule: "3 + 2x", show: "3 + 2m", v: "m", name: "cost", inputs: [1, 2, 4, 10, 25] },
            gate: true, then: "The letter is a slot for any value. And $2m$ means $2 \\times m$: a number written right next to a letter is multiplied by it." },
          { type: "choice", prompt: "A gym charges a $\\$25$ joining fee and $\\$15$ a month. Which expression gives the cost for $n$ months?",
            options: [{ t: "$25 + 15n$" },
                      { t: "$15 + 25n$", fb: "That pays the joining fee every month and the monthly price once — backwards." },
                      { t: "$40n$", fb: "That adds the fee to every month. The joining fee is paid once." },
                      { t: "$25n + 15$", fb: "The number multiplied by $n$ is the one paid every month." }],
            answer: 0, skill: "Write an expression",
            why: "The one-off cost stands alone; the monthly cost is multiplied by the number of months." },
          { type: "learn",
            prompt: "**Evaluating** means putting a value in and working it out. After you substitute, the order matters: $$2 + 3x^2 \\text{ when } x = 4$$ Tap the operation you would do **first**, then the next, until one number is left.",
            scene: { type: "evalsteps",
                     stages: [
                       [{ t: "2" }, { t: "+", op: true, fb: "Adding comes last — the 3 is still being multiplied, and the 4 is still being squared." },
                        { t: "3" }, { t: "\\cdot", op: true, fb: "Close — but the square belongs to the 4 alone, and powers come before multiplying." },
                        { t: "4" }, { t: "^{2}", go: true }],
                       [{ t: "2" }, { t: "+", op: true, fb: "Multiplication still comes before addition." }, { t: "3" }, { t: "\\cdot", go: true }, { t: "16", now: true }],
                       [{ t: "2" }, { t: "+", go: true }, { t: "48", now: true }],
                       [{ t: "50", now: true }]],
                     done: "$2 + 3(4)^2 = 2 + 3 \\cdot 16 = 2 + 48 = 50$" },
            gate: true,
            then: "The order is always: **brackets**, then **powers**, then **multiplying and dividing** (left to right), then **adding and subtracting** (left to right)." },
          { type: "evalsteps", prompt: "Now $(8 - x)^2 \\div 4$ when $x = 2$. Tap each step in order.", skill: "Order of operations",
            stages: [
              [{ t: "(8" }, { t: "-", go: true }, { t: "2)" }, { t: "^{2}", op: true, fb: "The brackets come first: work out $8 - 2$ before squaring." }, { t: "\\div", op: true, fb: "Brackets first, then the power, and only then the division." }, { t: "4" }],
              [{ t: "6", now: true }, { t: "^{2}", go: true }, { t: "\\div", op: true, fb: "Powers come before division." }, { t: "4" }],
              [{ t: "36", now: true }, { t: "\\div", go: true }, { t: "4" }],
              [{ t: "9", now: true }]],
            done: "$(8 - 2)^2 \\div 4 = 6^2 \\div 4 = 36 \\div 4 = 9$",
            why: "Brackets, then the power, then the division: $9$." },
          { type: "num", prompt: "Evaluate $5x - 4$ when $x = 6$.", answer: 26, skill: "Evaluate with one variable",
            near: [{ v: 60, fb: "$5x$ is $5 \\times 6$ — not the digits 5 and 6 side by side." }, { v: 5, fb: "Multiply first: $5 \\times 6 = 30$, then subtract 4." }],
            why: "$5(6) - 4 = 30 - 4 = 26$." },
          { type: "num", prompt: "Evaluate $\\frac{12}{n} + 1$ when $n = 4$.", answer: 4, skill: "Evaluate with one variable",
            near: [{ v: 2.4, fb: "Divide 12 by $n$ first, then add 1." }],
            why: "$\\frac{12}{4} + 1 = 3 + 1 = 4$." },
          { type: "num", prompt: "Evaluate $2x^2$ when $x = 3$.", answer: 18, skill: "Powers before multiplication",
            near: [{ v: 36, fb: "That squares $2x$. The exponent belongs to $x$ alone: $2 \\cdot 3^2 = 2 \\cdot 9$." },
                   { v: 12, fb: "$3^2$ is $3 \\times 3 = 9$, not $3 \\times 2$." }],
            why: "Powers come before multiplication: $3^2 = 9$, then $2 \\times 9 = 18$." },
          { type: "choice", prompt: "What is $-x^2$ when $x = 4$?",
            options: [{ t: "$-16$" }, { t: "$16$", fb: "The square is done before the minus sign: $-(4^2) = -16$. To square $-4$ you'd write $(-x)^2$." },
                      { t: "$-8$", fb: "$x^2$ is $4 \\times 4$, not $4 \\times 2$." }, { t: "$8$", fb: "Square first, then apply the minus: $-(4 \\times 4)$." }],
            answer: 0, skill: "Powers before multiplication",
            why: "$-x^2$ means “the negative of $x^2$”: $-(4^2) = -16$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "More than one letter",
        blurb: "Formulas with two variables — and puzzles you solve by trying.",
        mins: 9,
        steps: [
          { type: "learn", prompt: "A rectangle has two measurements, so its formulas have two letters: $$P = 2l + 2w \\qquad A = lw$$ Size the rectangle and watch both change.",
            scene: { type: "rectangle", l: { v: 5, min: 1, max: 12 }, w: { v: 3, min: 1, max: 8 } },
            gate: true, then: "Each formula takes *both* values at once. Changing either letter changes the result." },
          { type: "rectangle", prompt: "Find a rectangle with **perimeter 20** and **area 24**.", l: { v: 3, min: 1, max: 12 }, w: { v: 2, min: 1, max: 8 },
            target: { P: 20, A: 24 }, answer: [6, 4], skill: "Evaluate with several variables",
            hints: ["A perimeter of 20 means $l + w = 10$.", "Which two numbers add to 10 and multiply to 24?"],
            why: "$l = 6, w = 4$: $2(6) + 2(4) = 20$ and $6 \\cdot 4 = 24$." },
          { type: "rectangle", prompt: "Keep the **perimeter at 16**. Make the **area as big as it can be**.", l: { v: 7, min: 1, max: 12 }, w: { v: 1, min: 1, max: 8 },
            target: { P: 16, A: 16 }, answer: [4, 4], skill: "Evaluate with several variables",
            hints: ["List the rectangles with perimeter 16: $7 \\times 1$, $6 \\times 2$, … Work out each area."],
            why: "$7 \\cdot 1 = 7$, $6 \\cdot 2 = 12$, $5 \\cdot 3 = 15$, $4 \\cdot 4 = 16$. The square wins." },
          { type: "table", prompt: "Fill in the value of $3a - b$ for each pair.",
            head: ["$a$", "$b$", "$3a - b$"], rows: [[2, 1, null], [4, 5, null], [0, 3, null], [-1, 2, null]],
            answers: [[0, 2, 5], [1, 2, 7], [2, 2, -3], [3, 2, -5]], skill: "Evaluate with several variables",
            hints: ["Row by row: triple $a$, then take away $b$."],
            why: "$3(2) - 1 = 5$, $3(4) - 5 = 7$, $3(0) - 3 = -3$, $3(-1) - 2 = -5$." },
          { type: "learn", prompt: "With negatives, **brackets keep the signs honest**. When $b = -2$, write $a - b$ as $a - (-2)$ — which is $a + 2$. Taking away a negative is adding." },
          { type: "choice", prompt: "What is $ab - b$ when $a = 3$ and $b = -2$?",
            options: [{ t: "$-4$" }, { t: "$-8$", fb: "$-b$ with $b = -2$ is $-(-2) = +2$, not $-2$." }, { t: "$4$", fb: "$ab = 3 \\times (-2) = -6$ — it's negative." }, { t: "$8$", fb: "Start with $ab$: $3 \\times (-2) = -6$." }],
            answer: 0, skill: "Evaluate with several variables",
            why: "$3(-2) - (-2) = -6 + 2 = -4$." },
          { type: "num", prompt: "The average of two numbers is $\\frac{a + b}{2}$. What is it when $a = -3$ and $b = 8$?", answer: 2.5, shown: "5/2", skill: "Evaluate with several variables",
            near: [{ v: -5.5, fb: "$-3 + 8 = 5$, not $-11$." }, { v: 5, fb: "That's the sum — now halve it." }],
            why: "$\\frac{-3 + 8}{2} = \\frac{5}{2} = 2.5$." },
          { type: "num", prompt: "Evaluate $\\frac{1}{2}x + y$ when $x = 6$ and $y = \\frac{3}{4}$.", answer: 3.75, shown: "15/4",
            label: "Your answer (a fraction or a decimal)", skill: "Fractions and decimals",
            why: "$\\frac{1}{2}(6) + \\frac{3}{4} = 3 + \\frac{3}{4} = 3\\frac{3}{4}$, or $3.75$." },
          { type: "num", prompt: "Evaluate $0.5p - 2q$ when $p = 8$ and $q = 1.5$.", answer: 1, skill: "Fractions and decimals",
            why: "$0.5(8) - 2(1.5) = 4 - 3 = 1$." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Like terms",
        blurb: "Tiles you can count, cancel and combine.",
        mins: 9,
        steps: [
          { type: "learn", prompt: "A fruit bowl has 3 apples and 2 oranges. You add 4 more apples. That's “7 apples and 2 oranges” — never “9 apples”. Algebra counts the same way: $$3x + 2y + 4x = 7x + 2y$$ Terms with the same letter, to the same power, are **like terms**, and only like terms combine." },
          { type: "learn",
            prompt: "Here is $3x + 2 - x - 5$ as **algebra tiles**: blue bars are $x$, yellow squares are $1$, and red means negative. A positive and a negative of the same kind make a **zero pair** — together they're worth nothing. Tap one tile, then its opposite, until no pairs are left.",
            scene: { type: "tilemat", terms: [[3, "x"], [2, "1"], [-1, "x"], [-5, "1"]] },
            gate: true,
            then: "What's left — two $x$ tiles and three negative units — is $2x - 3$. That's what combining like terms means: $3x - x = 2x$ and $2 - 5 = -3$." },
          { type: "sort", prompt: "Sort these terms by what they're counting.",
            bins: ["$x$ terms", "$y$ terms", "just numbers"],
            cards: [{ t: "$3x$", bin: 0 }, { t: "$-2y$", bin: 1 }, { t: "$5$", bin: 2 }, { t: "$x$", bin: 0 },
                    { t: "$4y$", bin: 1 }, { t: "$-1$", bin: 2 }, { t: "$-6x$", bin: 0, fb: "$-6x$ counts $x$'s — six owed. The sign stays with the term." },
                    { t: "$\\frac{1}{2}y$", bin: 1 }],
            skill: "Identify like terms" },
          { type: "tilemat", prompt: "Simplify $2x - 4 + 3 - 5x$ on the tiles: clear every zero pair.", terms: [[2, "x"], [-4, "1"], [3, "1"], [-5, "x"]], skill: "Combine like terms",
            hints: ["Pair each blue $x$ with a red $-x$.", "Then pair yellow units with red ones."],
            why: "Two $x$ pairs and three unit pairs cancel, leaving $-3x - 1$." },
          { type: "expr", prompt: "So $2x - 4 + 3 - 5x$ simplifies to…", answer: "-3x - 1", form: "simplified", skill: "Combine like terms",
            near: [{ v: "3x - 1", fb: "Five negative $x$'s against two positive: three negative $x$'s are left, $-3x$." }, { v: "-3x - 7", fb: "$-4 + 3 = -1$." }],
            why: "$2x - 5x = -3x$ and $-4 + 3 = -1$." },
          { type: "expr", prompt: "Simplify $3x + 2y + 4x$.", answer: "7x + 2y", form: "simplified", skill: "Combine like terms",
            near: [{ v: "9xy", fb: "$x$'s and $y$'s don't combine — like apples and oranges." }, { v: "9x", fb: "The $2y$ can't join the $x$'s." }],
            why: "$3x + 4x = 7x$, and $2y$ stays: $7x + 2y$." },
          { type: "expr", prompt: "Simplify $4a - 7 - 6a + 2$.", answer: "-2a - 5", form: "simplified", skill: "Negative coefficients",
            near: [{ v: "2a - 5", fb: "$4a - 6a$ is $-2a$: more $a$'s owed than held." }, { v: "-2a - 9", fb: "$-7 + 2 = -5$." }],
            hints: ["Collect the $a$ terms, keeping each one's sign: $4a - 6a$.", "Then the numbers: $-7 + 2$."],
            why: "$4a - 6a = -2a$ and $-7 + 2 = -5$: $-2a - 5$." },
          { type: "expr", prompt: "Simplify $\\frac{1}{2}x + \\frac{1}{3}x$.", answer: "5/6 x", form: "simplified", skill: "Rational coefficients",
            near: [{ v: "2/5 x", fb: "Fractions don't add top-and-bottom. Use a common denominator: $\\frac{3}{6} + \\frac{2}{6}$." }],
            placeholder: "e.g. 5/6x",
            why: "$\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$, so $\\frac{5}{6}x$." },
          { type: "choice", prompt: "Priya writes $3x + 2 = 5x$. Is she right?",
            options: [{ t: "No — $3x$ and $2$ aren't like terms, so they can't combine" },
                      { t: "Yes — $3 + 2 = 5$", fb: "Test it at $x = 10$: $3x + 2 = 32$ but $5x = 50$." },
                      { t: "Only when $x = 1$", fb: "They are equal at $x = 1$ — but an expression is simplified correctly only if it's equal for *every* $x$." }],
            answer: 0, skill: "Identify like terms", why: "$3x + 2$ is already as simple as it gets." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "The distributive property",
        blurb: "Multiplying out brackets, seen as area.",
        mins: 9,
        steps: [
          { type: "learn", prompt: "Mental maths trick: $7 \\times 23$ is hard, but $23 = 20 + 3$. Split the rectangle and fill in the two areas.",
            scene: { type: "tiles", mode: "area", rows: ["7"], cols: ["20", "3"], cw: [230, 60], rh: [100], cells: [["140", "21"]], readout: "$7 \\times 23 = 140 + 21 = 161$" },
            gate: true, then: "Seven rows of twenty, plus seven rows of three: $7(20 + 3) = 7 \\cdot 20 + 7 \\cdot 3$." },
          { type: "num", prompt: "Use the same split: $6 \\times 47 = 6 \\times 40 + 6 \\times 7 = \\;?$", answer: 282, skill: "The distributive property",
            near: [{ v: 247, fb: "The 6 multiplies the 7 as well: $6 \\times 7 = 42$." }],
            why: "$240 + 42 = 282$." },
          { type: "learn", prompt: "The same picture with a letter: a rectangle 3 tall and $x + 2$ wide.",
            scene: { type: "tiles", mode: "area", rows: ["3"], cols: ["x", "2"], cw: [170, 70], rh: [110], cells: [["3x", "6"]], readout: "$3(x + 2) = 3x + 6$" },
            gate: true, then: "The **distributive property**: the number outside multiplies *every* term inside. $$a(b + c) = ab + ac$$" },
          { type: "expr", prompt: "Expand $2(x + 5)$.", answer: "2x + 10", form: "simplified", skill: "The distributive property",
            near: [{ v: "2x + 5", fb: "The 2 multiplies the 5 as well." }],
            why: "$2 \\cdot x + 2 \\cdot 5 = 2x + 10$." },
          { type: "learn", prompt: "Negatives distribute too — sign and all. Check that $-3(2x - 1)$ and $-6x + 3$ agree: try at least three values of $x$.",
            scene: { type: "tester", a: "-3*(2x - 1)", aTex: "-3(2x - 1)", b: "-6x + 3", x: { v: 1, min: -5, max: 5, step: 1 }, goal: "agree3" },
            gate: true, then: "They agree every time: $-3 \\cdot 2x = -6x$ and $-3 \\cdot (-1) = +3$." },
          { type: "expr", prompt: "Expand and simplify $-3(2x - 1) + 4x$.", answer: "-2x + 3", form: "simplified", skill: "Distribute and combine",
            near: [{ v: "-2x - 3", fb: "$-3 \\times -1 = +3$. Two negatives make a positive." }, { v: "10x + 3", fb: "$-3 \\times 2x = -6x$, and $-6x + 4x = -2x$." }],
            hints: ["The $-3$ multiplies both $2x$ and $-1$."],
            why: "$-3(2x - 1) = -6x + 3$; $-6x + 4x = -2x$. So $-2x + 3$." },
          { type: "choice", prompt: "What is $-(x - 4)$?",
            options: [{ t: "$-x + 4$" }, { t: "$-x - 4$", fb: "The minus sign multiplies the $-4$ too: $-(-4) = +4$." }, { t: "$x + 4$", fb: "The minus applies to the $x$ as well." }],
            answer: 0, skill: "Distribute and combine", why: "$-(x - 4)$ is $-1 \\cdot (x - 4) = -x + 4$." },
          { type: "expr", prompt: "Now backwards. Fill the bracket: $6x + 9 = 3(\\;\\square\\;)$", pre: "$3($", post: "$)$", answer: "2x + 3", skill: "Factor out a common number",
            near: [{ v: "6x + 3", fb: "Divide *both* terms by 3: $6x \\div 3 = 2x$." }, { v: "2x + 9", fb: "The 9 has to be divided by 3 too." }],
            why: "$3 \\cdot 2x = 6x$ and $3 \\cdot 3 = 9$, so $6x + 9 = 3(2x + 3)$." },
          { type: "expr", prompt: "Expand and simplify $2(x + 5) + 3(x - 1)$.", answer: "5x + 7", form: "simplified", skill: "Distribute and combine",
            near: [{ v: "5x + 4", fb: "$3(x - 1) = 3x - 3$ — the 3 multiplies the 1." }, { v: "5x + 13", fb: "$3(x - 1)$ gives $-3$, not $+3$." }],
            why: "$2x + 10 + 3x - 3 = 5x + 7$." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Equivalent expressions",
        blurb: "Two expressions are the same when they agree for every value.",
        mins: 8,
        steps: [
          { type: "learn", prompt: "The blue line shows $2(x + 3)$ for every $x$. The orange line shows $ax + b$. Move the sliders until the two agree **everywhere**.",
            scene: { type: "plane", x: [-6, 6], y: [-8, 16], grid: 1, labelEveryY: 4,
                     params: { a: { v: 1, min: -3, max: 4, step: 1, label: "$a$" }, b: { v: 0, min: -6, max: 10, step: 1, label: "$b$" } },
                     fns: [{ f: "2*(x+3)", color: "blue", label: "2(x + 3)", labelAt: -4.2 }, { f: "a*x + b", color: "orange", dashed: true }],
                     readout: function (s) { return "$2(x + 3)$ vs. $" + L.poly([[s.params.a, "x"], [s.params.b, ""]]) + "$" + (s.params.a === 2 && s.params.b === 6 ? " — the same everywhere" : ""); },
                     goal: function (s) { return s.params.a === 2 && s.params.b === 6; } },
            gate: true, then: "At $a = 2$, $b = 6$ the lines are one line: $2(x + 3)$ and $2x + 6$ are **equivalent** — equal for every value of $x$, not just some." },
          { type: "learn", prompt: "Maya thinks $(x + 2)^2$ is the same as $x^2 + 4$. Hunt for a value of $x$ where they **disagree**.",
            scene: { type: "tester", a: "(x + 2)^2", b: "x^2 + 4", x: { v: 0, min: -5, max: 5, step: 1 }, goal: "differ" },
            gate: true, then: "At $x = 0$ they agree — but one disagreement is enough to prove two expressions are **not** equivalent. In fact $(x + 2)^2 = x^2 + 4x + 4$: Maya forgot the middle term." },
          { type: "choice", prompt: "Which expression is equivalent to $3(x - 4)$?",
            options: [{ t: "$3x - 12$" }, { t: "$3x - 4$", fb: "The 3 multiplies the $-4$ too." }, { t: "$x - 12$", fb: "The 3 multiplies the $x$ too." }, { t: "$3x + 12$", fb: "$3 \\times (-4) = -12$." }],
            answer: 0, skill: "Equivalent expressions" },
          { type: "multi", prompt: "Which of these are equivalent to $6x + 9$? Pick every one.",
            options: [{ t: "$3(2x + 3)$", ok: true }, { t: "$9 + 6x$", ok: true }, { t: "$2x + 3 + 4x + 6$", ok: true },
                      { t: "$3(2x + 9)$", ok: false, fb: "$3(2x + 9) = 6x + 27$." }, { t: "$15x$", ok: false, fb: "$6x$ and $9$ aren't like terms — they don't make $15x$." }],
            skill: "Equivalent expressions" },
          { type: "choice", prompt: "Are $2(x + 3) - x$ and $x + 6$ equivalent? Test a few values, then decide.",
            scene: { type: "tester", a: "2*(x + 3) - x", aTex: "2(x + 3) - x", b: "x + 6", x: { v: 1, min: -5, max: 5, step: 1 } },
            options: [{ t: "Yes" }, { t: "No", fb: "Try several values in the tester — do they ever disagree? Then simplify $2(x + 3) - x$." }],
            answer: 0, skill: "Equivalent expressions",
            why: "Simplify: $2x + 6 - x = x + 6$. The same expression." },
          { type: "choice", prompt: "Sam checks $x^2$ and $x$ at $x = 0$ and $x = 1$. Both times they're equal. Are they equivalent?",
            options: [{ t: "No — try $x = 2$: $4 \\ne 2$" }, { t: "Yes — two matching values is enough", fb: "Matching values can be a coincidence. $x^2$ and $x$ happen to agree at 0 and 1 only." }],
            answer: 0, skill: "Test by substituting",
            why: "Agreeing at a few points doesn't prove equivalence; one disagreement disproves it." }
        ]
      },
      /* ============================================================== 7 */
      {
        title: "Why you can't divide by zero",
        blurb: "Division undoes multiplication — and multiplying by zero can't be undone.",
        mins: 7,
        steps: [
          { type: "learn", prompt: "$12 \\div 3 = 4$ because $3 \\times 4 = 12$. Division asks: *how many 3s fit into 12?* Shrink the pieces and count how many fit.",
            scene: { type: "share", total: 12, d: { v: 3, min: 0, max: 6, step: 0.25 } },
            gate: true,
            then: "Smaller pieces, more of them: $12 \\div 0.5 = 24$, $12 \\div 0.25 = 48$. But pieces of size $0$ never add up to 12, however many you use — so $12 \\div 0$ has no answer." },
          { type: "choice", prompt: "So $12 \\div 0$ asks: what number, multiplied by $0$, gives $12$?",
            options: [{ t: "There's no such number" }, { t: "$0$", fb: "$0 \\times 0 = 0$, not 12." }, { t: "$12$", fb: "$0 \\times 12 = 0$, not 12." },
                      { t: "Infinity", fb: "Infinity isn't a number you can multiply by — and zero times anything is still zero." }],
            answer: 0, skill: "Division by zero",
            why: "Anything times 0 is 0 — never 12. So $12 \\div 0$ is **undefined**." },
          { type: "learn", prompt: "Here is $y = \\frac{12}{x}$. Slide $x$ towards $0$ from either side and watch $y$.",
            scene: { type: "plane", x: [-6, 6], y: [-30, 30], grid: 1, labelEveryY: 10, aspect: 0.8,
                     params: { t: { v: 3, min: -3, max: 3, step: 0.25, label: "$x$" } },
                     fns: [{ f: "12/x", color: "blue" }],
                     marks: [{ x: function (p) { return p.t; }, y: function (p) { return p.t === 0 ? NaN : 12 / p.t; }, color: "orange", label: function (p) { return p.t === 0 ? "" : "y = " + L.num(Math.round(1200 / p.t) / 100); } }],
                     readout: function (s) { var t = s.params.t; return t === 0 ? "$x = 0$: $\\frac{12}{0}$ is undefined — there's no point" : "$x = " + L.num(t) + "$, $y = " + L.num(Math.round(1200 / t) / 100) + "$"; },
                     goal: function (s) { return s.params.t === 0; } },
            gate: true, then: "From the right, $y$ shoots up; from the left, it plunges down. There's no single value it could be — at $x = 0$ the graph has a gap." },
          { type: "choice", prompt: "What about $0 \\div 0$? It asks what number times $0$ gives $0$.",
            options: [{ t: "Every number works, so there's no single answer — it's undefined too" }, { t: "$0$", fb: "0 works — but so does 5, and $-17$. A division has to have one answer." },
                      { t: "$1$", fb: "1 works — but so does every other number." }],
            answer: 0, skill: "Division by zero",
            why: "Every number times 0 is 0, so $0 \\div 0$ can't pick one. It's called *indeterminate*; either way it has no value." },
          { type: "multi", prompt: "Which of these are undefined? Pick every one.",
            options: [{ t: "$\\frac{5}{0}$", ok: true }, { t: "$\\frac{0}{5}$", ok: false, fb: "$\\frac{0}{5} = 0$: five equal shares of nothing are nothing. Zero on top is fine." },
                      { t: "$\\frac{7}{3 - 3}$", ok: true }, { t: "$\\frac{x - 2}{x - 2}$ when $x = 2$", ok: true },
                      { t: "$\\frac{x}{4}$ when $x = 0$", ok: false, fb: "That's $\\frac{0}{4} = 0$." }],
            skill: "Division by zero" },
          { type: "num", prompt: "For which value of $x$ is $\\frac{5}{x - 3}$ undefined?", pre: "$x =$", answer: 3, skill: "Division by zero",
            near: [{ v: -3, fb: "At $x = -3$ the bottom is $-6$. Which $x$ makes $x - 3 = 0$?" }, { v: 5, fb: "A 5 on top is fine. It's the bottom that can't be zero." }],
            why: "The bottom $x - 3$ is zero when $x = 3$." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Evaluating expressions — one letter, several letters, and the order of operations.",
        skills: ["a1-eval1", "a1-order", "a1-eval2", "a1-eval3"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Like terms, the distributive property and equivalent expressions.",
        skills: ["a1-like1", "a1-like2", "a1-like3", "a1-dist", "a1-equiv"], per: 2 }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a1-words", title: "Writing expressions from words", lesson: 2,
        gen: function (R) {
          var a = R.int(2, 9), b = R.int(2, 12);
          var T = R.pick([
            { p: b + " more than a number", a: "n + " + b },
            { p: b + " less than a number", a: "n - " + b, near: [{ v: b + " - n", fb: "“" + b + " less than a number” starts with the number and takes " + b + " away: $n - " + b + "$." }] },
            { p: a + " times a number, increased by " + b, a: a + "n + " + b },
            { p: b + " less than " + a + " times a number", a: a + "n - " + b, near: [{ v: b + " - " + a + "n", fb: "“Less than” reverses the order: start with $" + a + "n$, then take " + b + " away." }] },
            { p: "a number divided by " + a, a: "n/" + a, near: [{ v: a + "/n", fb: "The number is divided *by* " + a + ": $\\frac{n}{" + a + "}$." }] },
            { p: a + " times the sum of a number and " + b, a: a + "(n + " + b + ")", near: [{ v: a + "n + " + b, fb: "“The sum” is one thing: $(n + " + b + ")$, all of it multiplied by " + a + "." }] },
            { p: "the difference of a number and " + b + ", squared", a: "(n - " + b + ")^2", near: [{ v: "n - " + b * b, fb: "Square the whole difference: $(n - " + b + ")^2$." }, { v: "n^2 - " + b, fb: "It's the *difference* that's squared, not just the number." }] },
            { p: "half of a number, plus " + b, a: "n/2 + " + b },
            { p: "the product of " + a + " and a number, decreased by " + b, a: a + "n - " + b }
          ]);
          return { type: "expr", prompt: "Write an expression for “" + T.p + "”, using $n$ for the number.", answer: T.a, near: T.near || [],
            keys: [["$n$", "n"], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"], ["$x^2$", "^2"]], placeholder: "Use n",
            hints: ["Read it piece by piece: what happens to the number first?"],
            why: "“" + T.p + "” is $" + T.a.replace(/(\w)\/(\d)/, "\\frac{$1}{$2}").replace(/(\d)\/n/, "\\frac{$1}{n}") + "$." };
        } },
      { id: "a1-eval1", title: "Evaluating expressions with one variable", lesson: 2,
        gen: function (R) {
          var x = R.int(-5, 9), a = R.nz(-6, 9), b = R.int(1, 12), kind = R.int(0, 4), tex, val = null;
          if (kind === 0) { tex = poly([[a, "x"], [b * R.sign(), ""]]); }
          if (kind === 1) { tex = a + "(x " + L.signed(b) + ")"; val = a * (x + b); }
          if (kind === 2) { x = R.nz(-4, 5); tex = poly([[a, "x^2"], [b, ""]]); val = a * x * x + b; }
          if (kind === 3) { var d = R.pick([1, 2, 3, 4, 6]); x = d * R.sign(); var top = d * R.int(2, 9); tex = "\\frac{" + top + "}{x} " + L.signed(b); val = top / x + b; }
          if (kind === 4) { tex = b + " - " + (Math.abs(a) === 1 ? "" : Math.abs(a)) + "x"; val = b - Math.abs(a) * x; }
          if (val === null) val = L.evalTree(L.parse(tex), { x: x });
          return { type: "num", prompt: "Evaluate $" + tex + "$ when $x = " + x + "$.", answer: val,
            hints: ["Replace $x$ with $(" + x + ")$ — the brackets keep the sign.", "Powers first, then multiply and divide, then add and subtract."],
            why: "Substitute $x = " + x + "$: $" + L.sub(tex, { x: x }) + " = " + num(val) + "$." };
        } },
      { id: "a1-order", title: "Order of operations", lesson: 2,
        gen: function (R) {
          var a = R.int(2, 9), b = R.int(2, 6), c = R.int(2, 5), d = R.int(1, 9), kind = R.int(0, 3), tex, val, work, near = [];
          if (kind === 0) { tex = a + " + " + b + " \\cdot " + c + "^2"; val = a + b * c * c; work = [a + " + " + b + " \\cdot " + c * c, a + " + " + b * c * c, String(val)]; near = [{ v: a + Math.pow(b * c, 2), fb: "The square belongs to the " + c + " alone." }, { v: (a + b) * c * c, fb: "Multiplication comes before addition." }]; }
          if (kind === 1) { var s = c * R.int(1, 4); var big = s + d; tex = "(" + big + " - " + d + ")^2 \\div " + c; val = s * s / c; work = [s + "^2 \\div " + c, s * s + " \\div " + c, num(val)]; near = [{ v: big * big - d / c, fb: "Brackets first: $" + big + " - " + d + " = " + s + "$." }]; }
          if (kind === 2) { tex = a + "(" + b + " + " + c + ") - " + d; val = a * (b + c) - d; work = [a + "(" + (b + c) + ") - " + d, a * (b + c) + " - " + d, String(val)]; near = [{ v: a * b + c - d, fb: "The " + a + " multiplies the whole bracket, $" + (b + c) + "$." }]; }
          if (kind === 3) { tex = a + "^2 - " + b + " \\cdot " + c; val = a * a - b * c; work = [a * a + " - " + b + " \\cdot " + c, a * a + " - " + b * c, String(val)]; near = [{ v: (a * a - b) * c, fb: "Multiply before you subtract." }]; }
          return { type: "num", prompt: "Evaluate $" + tex + "$.", answer: val, near: near,
            hints: ["Brackets, then powers, then multiply and divide, then add and subtract."],
            why: lines([tex].concat(work)) };
        } },
      { id: "a1-eval2", title: "Evaluating expressions with multiple variables", lesson: 3,
        gen: function (R) {
          var a = R.nz(-5, 7), b = R.nz(-5, 7), p = R.nz(-4, 5), q = R.nz(-4, 5), kind = R.int(0, 3), tex, val;
          if (kind === 0) { tex = poly([[p, "a"], [q, "b"]]); val = p * a + q * b; }
          if (kind === 1) { tex = "ab " + L.signed(q); val = a * b + q; }
          if (kind === 2) { tex = "a^2 - " + (Math.abs(q) === 1 ? "" : Math.abs(q)) + "b"; val = a * a - Math.abs(q) * b; }
          if (kind === 3) { tex = p + "(a - b)"; val = p * (a - b); }
          return { type: "num", prompt: "Evaluate $" + tex + "$ when $a = " + a + "$ and $b = " + b + "$.", answer: val,
            hints: ["Put each value in its place, in brackets."],
            why: "With $a = " + a + "$ and $b = " + b + "$: $" + L.sub(tex, { a: a, b: b }).replace(/\)\(/g, ")\\cdot(") + " = " + num(val) + "$." };
        } },
      { id: "a1-eval3", title: "Evaluating with fractions & decimals", lesson: 3,
        gen: function (R) {
          if (R.chance(0.5)) {
            var d = R.pick([2, 3, 4, 5]), n;
            do { n = R.int(1, d - 1); } while (L.gcd(n, d) !== 1);
            var x = d * R.int(1, 6), y = R.pick([0.5, 1.5, 2.5, 0.25, 0.75]);
            var val = n / d * x + y;
            return { type: "num", prompt: "Evaluate $\\frac{" + n + "}{" + d + "}x + y$ when $x = " + x + "$ and $y = " + y + "$.", answer: val,
              hints: ["$\\frac{" + n + "}{" + d + "}$ of " + x + " is " + x + " ÷ " + d + " × " + n + "."],
              why: "$\\frac{" + n + "}{" + d + "}(" + x + ") + " + y + " = " + num(n / d * x) + " + " + y + " = " + num(val) + "$." };
          }
          var p = R.pick([0.2, 0.5, 1.5, 2.5]), q = R.int(2, 6), a = R.int(2, 12), b = R.pick([0.5, 1.5, 2, 0.25]);
          var v = p * a - q * b;
          return { type: "num", prompt: "Evaluate $" + p + "m - " + q + "n$ when $m = " + a + "$ and $n = " + b + "$.", answer: Math.round(v * 1e6) / 1e6,
            why: "$" + p + "(" + a + ") - " + q + "(" + b + ") = " + num(p * a) + " - " + num(q * b) + " = " + num(v) + "$." };
        } },
      { id: "a1-like1", title: "Combining like terms with negative coefficients", lesson: 4,
        gen: function (R) {
          var a = R.nz(-9, 9), b = R.nz(-9, 9), c = R.nz(-9, 9), d = R.nz(-9, 9), v = R.pick(["x", "y", "a", "k"]);
          var tex = poly([[a, v], [c, ""], [b, v], [d, ""]]);
          var ans = poly([[a + b, v], [c + d, ""]]);
          return { type: "expr", prompt: "Simplify $" + tex + "$.", answer: ans.replace(/\s/g, ""), shown: ans, form: "simplified",
            hints: ["Collect the $" + v + "$ terms with their signs: $" + poly([[a, v], [b, v]]) + "$.", "Then the numbers: $" + poly([[c, ""], [d, ""]], { keepZero: true }) + "$."],
            why: "$" + poly([[a, v], [b, v]]) + " = " + poly([[a + b, v]]) + "$ and $" + poly([[c, ""], [d, ""]], { keepZero: true }) + " = " + (c + d) + "$: $" + ans + "$." };
        } },
      { id: "a1-like3", title: "Combining like terms with rational coefficients", lesson: 4,
        gen: function (R) {
          var d1 = R.pick([2, 3, 4, 5, 6]), d2 = R.pick([2, 3, 4, 5]), n1, n2;
          do { n1 = R.int(1, d1 - 1); } while (L.gcd(n1, d1) !== 1);
          do { n2 = R.int(1, d2 - 1); } while (L.gcd(n2, d2) !== 1 || d2 === d1 && n2 === n1);
          n2 *= R.sign();
          var top = n1 * d2 + n2 * d1, bot = d1 * d2;
          if (top === 0) top = bot;
          var c = R.nz(-5, 5);
          var tex = "\\frac{" + n1 + "}{" + d1 + "}x " + (n2 < 0 ? "- " : "+ ") + "\\frac{" + Math.abs(n2) + "}{" + d2 + "}x " + L.signed(c);
          var ansT = L.fracText(top, bot) + "x " + (c < 0 ? "- " + -c : "+ " + c);
          return { type: "expr", prompt: "Simplify $" + tex + "$.", answer: "(" + top + "/" + bot + ")x + " + c, shown: ansT, form: "simplified",
            placeholder: "e.g. 5/6x + 2",
            hints: ["Give the fractions a common denominator: " + bot + "."],
            why: "$\\frac{" + n1 + "}{" + d1 + "} " + (n2 < 0 ? "-" : "+") + " \\frac{" + Math.abs(n2) + "}{" + d2 + "} = \\frac{" + n1 * d2 + "}{" + bot + "} " + (n2 < 0 ? "-" : "+") + " \\frac{" + Math.abs(n2) * d1 + "}{" + bot + "} = " + frac(top, bot) + "$, so $" + (top === bot ? "" : top === -bot ? "-" : frac(top, bot)) + "x " + L.signed(c) + "$." };
        } },
      { id: "a1-like2", title: "Combining like terms with distribution", lesson: 5,
        gen: function (R) {
          var k = R.int(2, 6) * R.sign(), a = R.nz(-4, 5), b = R.nz(-7, 7), c = R.nz(-6, 6), v = R.pick(["x", "p", "t"]);
          var tex = k + "(" + poly([[a, v], [b, ""]]) + ") " + (c < 0 ? "- " : "+ ") + (Math.abs(c) === 1 ? "" : Math.abs(c)) + v;
          var ans = poly([[k * a + c, v], [k * b, ""]]);
          return { type: "expr", prompt: "Expand and simplify $" + tex + "$.", answer: ans.replace(/\s/g, ""), shown: ans, form: "simplified",
            hints: ["Multiply every term in the bracket by $" + k + "$.", "$" + k + " \\cdot " + poly([[a, v]]) + " = " + poly([[k * a, v]]) + "$ and $" + k + " \\cdot " + b + " = " + k * b + "$."],
            near: [{ v: poly([[k * a + c, v], [b, ""]]).replace(/\s/g, ""), fb: "The number outside multiplies *every* term inside — the " + b + " too." }],
            why: "$" + k + "(" + poly([[a, v], [b, ""]]) + ") = " + poly([[k * a, v], [k * b, ""]]) + "$; then $" + poly([[k * a, v], [c, v]]) + " = " + poly([[k * a + c, v]]) + "$. Answer: $" + ans + "$." };
        } },
      { id: "a1-dist", title: "The distributive property", lesson: 5,
        gen: function (R) {
          if (R.chance(0.5)) {
            var k = R.int(2, 9) * R.sign(), a = R.nz(-6, 7), b = R.nz(-9, 9);
            var ans = poly([[k * a, "x"], [k * b, ""]]);
            return { type: "expr", prompt: "Expand $" + k + "(" + poly([[a, "x"], [b, ""]]) + ")$.", answer: ans.replace(/\s/g, ""), shown: ans, form: "simplified",
              near: [{ v: poly([[k * a, "x"], [b, ""]]).replace(/\s/g, ""), fb: "The " + k + " multiplies the " + b + " too." }],
              hints: ["Multiply " + k + " by each term inside."],
              why: "$" + k + " \\cdot " + poly([[a, "x"]]) + " = " + poly([[k * a, "x"]]) + "$ and $" + k + " \\cdot " + b + " = " + k * b + "$: $" + ans + "$." };
          }
          var g = R.int(2, 9), p = R.nz(-6, 7), q = R.nz(-8, 9);
          while (L.gcd(p, q) !== 1) q++;
          var inside = poly([[p, "x"], [q, ""]]);
          return { type: "expr", prompt: "Fill the bracket: $" + poly([[g * p, "x"], [g * q, ""]]) + " = " + g + "(\\;\\square\\;)$", pre: "$" + g + "($", post: "$)$",
            answer: inside.replace(/\s/g, ""), shown: inside,
            near: [{ v: poly([[g * p, "x"], [q, ""]]).replace(/\s/g, ""), fb: "Divide *both* terms by " + g + "." }],
            hints: ["Divide each term by " + g + "."],
            why: "$" + g * p + "x \\div " + g + " = " + poly([[p, "x"]]) + "$ and $" + g * q + " \\div " + g + " = " + q + "$, so it's $" + g + "(" + inside + ")$." };
        } },
      { id: "a1-equiv", title: "Equivalent expressions", lesson: 6,
        gen: function (R) {
          var k = R.pick([2, 3, 4, 5, -2, -3]), a = R.nz(-5, 6), b = R.nz(-8, 8);
          var tex = k + "(" + poly([[a, "x"], [b, ""]]) + ")";
          var right = poly([[k * a, "x"], [k * b, ""]]);
          return mc(R, { prompt: "Which expression is equivalent to $" + tex + "$?", right: "$" + right + "$",
            wrong: [{ t: "$" + poly([[k * a, "x"], [b, ""]]) + "$", fb: "The " + k + " multiplies the " + b + " too." },
                    { t: "$" + poly([[a, "x"], [k * b, ""]]) + "$", fb: "The " + k + " multiplies the $" + poly([[a, "x"]]) + "$ too." },
                    { t: "$" + poly([[k * a, "x"], [-k * b, ""]]) + "$", fb: "Check the sign: $" + k + " \\times " + b + " = " + k * b + "$." }],
            hints: ["Multiply each term in the bracket by " + k + "."],
            why: "$" + tex + " = " + right + "$." });
        } },
      { id: "a1-undef", title: "Undefined expressions", lesson: 7,
        gen: function (R) {
          var c = R.int(1, 9), top = R.int(1, 20);
          var zeroAt = R.chance(0.5);
          var val = zeroAt ? c : c + R.nz(-3, 3);
          var tex = "\\frac{" + top + "}{x - " + c + "}";
          return mc(R, { prompt: "Is $" + tex + "$ defined when $x = " + val + "$?",
            right: zeroAt ? "No — the bottom would be $0$" : "Yes — it's $" + frac(top, val - c) + "$",
            wrong: zeroAt ? [{ t: "Yes — it's $0$", fb: "A zero on the *bottom* isn't a value of 0 — there's no number at all." }, { t: "Yes — it's $" + top + "$", fb: "The bottom is $" + val + " - " + c + " = 0$. Nothing can be divided by 0." }]
                          : [{ t: "No — the bottom would be $0$", fb: "The bottom is $" + val + " - " + c + " = " + (val - c) + "$, which isn't zero." }, { t: "Yes — it's $0$", fb: "Only a zero on *top* makes the value 0." }],
            why: zeroAt ? "At $x = " + val + "$ the bottom is $" + val + " - " + c + " = 0$: undefined." : "The bottom is $" + (val - c) + "$, so the value is $" + frac(top, val - c) + "$." });
        } }
    ]
  });
})();
