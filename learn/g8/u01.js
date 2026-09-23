/* ==========================================================================
   8th Grade Math (NY) — Unit 1: Numbers and operations. See lab/core.js.

   Built the way Algebra I's units are, for someone meeting each idea for the
   first time. Every lesson goes: say it in plain words with something you can
   see, show it worked through a line at a time (the "walk" scene), ask for
   the same thing with new numbers, then a step harder.

   Ten lessons, one for each part of the unit: repeating decimals both ways,
   square roots, cube roots, rational against irrational, pinning an
   irrational between two rationals, the exponent rules, zero and negative
   exponents, powers of ten, scientific notation, and arithmetic with it.

   Twelve skills practise it, three quizzes check it along the way, and the
   unit test at the end draws from every skill.

   NY Next Generation standards: NY-8.NS.1, NY-8.NS.2, NY-8.EE.1, NY-8.EE.2,
   NY-8.EE.3, NY-8.EE.4.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var num = L.num, mc = L.mc, frac = L.frac, gcd = L.gcd;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  // 0.overline{37}: the digits that repeat, with a bar over them.
  function rep(whole, digits) { return whole + ".\\overline{" + digits + "}"; }

  L.unit("g8", 1, {
    title: "Numbers and operations",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Fractions that go on forever",
        blurb: "Divide it out and the answer either stops or repeats — and repeating has its own notation.",
        mins: 8,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A fraction is a division waiting to happen: $\\frac{3}{4}$ means $3 \\div 4$. Sometimes that division stops. Sometimes it never does.",
            scene: { type: "walk", rows: [
              { m: "\\frac{3}{4} = 0.75", say: "$3 \\div 4$ stops after two places. A **terminating** decimal." },
              { m: "\\frac{1}{3} = 0.333\\ldots", say: "$1 \\div 3$ gives 3 after 3 after 3, and never lands on zero." },
              { m: "\\frac{1}{3} = " + rep(0, 3), say: "Instead of writing dots, put a **bar** over the digits that repeat. That is a **repeating decimal**." }] },
            gate: true,
            then: "The bar covers exactly the block that repeats: $" + rep(0, 3) + "$ is $0.3333\\ldots$, and $" + rep(0, "27") + "$ is $0.272727\\ldots$" },
          { type: "learn", kicker: "Watch",
            prompt: "To turn a fraction into a decimal, divide the top by the bottom and keep going until a remainder comes back.",
            scene: { type: "walk", rows: [
              { m: "\\frac{2}{11} = 2 \\div 11", say: "Start the division. 11 doesn't go into 2, so the answer starts $0.$" },
              { m: "20 \\div 11 = 1 \\text{ r } 9", say: "Bring down a zero: 11 goes into 20 once, remainder 9. First digit: 1." },
              { m: "90 \\div 11 = 8 \\text{ r } 2", say: "Bring down a zero: 11 goes into 90 eight times, remainder 2. Second digit: 8." },
              { m: "\\text{remainder } 2 \\text{ again}", say: "The remainder 2 is where we started, so 1 and 8 will now repeat forever." },
              { m: "\\frac{2}{11} = " + rep(0, "18"), say: "Bar over the whole repeating block." }] },
            gate: true },
          { type: "choice", prompt: "Which decimal is $\\frac{1}{9}$?", skill: "Fractions to decimals",
            options: [{ t: "$" + rep(0, 1) + "$" }, { t: "$0.19$", fb: "$0.19$ stops. $1 \\div 9$ keeps giving 1s: $0.111\\ldots$" },
                      { t: "$" + rep(0, 9) + "$", fb: "That is $0.999\\ldots$ Try the division: $1 \\div 9$ gives 1 each time, not 9." }],
            answer: 0,
            hints: ["Do $1 \\div 9$: bring down a zero, 9 goes into 10 once, remainder 1 — and you are back where you started."],
            why: "$1 \\div 9 = 0.111\\ldots = " + rep(0, 1) + "$." },
          { type: "num", prompt: "In $\\frac{5}{6} = 0.8333\\ldots$, which single digit is under the bar?", answer: 3, skill: "Fractions to decimals",
            near: [{ v: 8, fb: "The 8 happens once and then stops. It is the 3 that goes on forever." }],
            hints: ["Write it as $0.8\\,333\\ldots$ — which part keeps coming back?"],
            why: "$\\frac{5}{6} = 0.8" + "\\overline{3}$: the 8 appears once, then 3 repeats." },
          { type: "num", prompt: "How many digits are in the repeating block of $\\frac{4}{11}$?", answer: 2, skill: "Fractions to decimals",
            hints: ["$4 \\div 11 = 0.363636\\ldots$", "The block that comes back is “36”."],
            why: "$\\frac{4}{11} = " + rep(0, "36") + "$ — a block of two digits." },
          { type: "choice", prompt: "Which of these fractions gives a decimal that **stops**?", skill: "Fractions to decimals",
            options: [{ t: "$\\frac{7}{8}$" }, { t: "$\\frac{7}{6}$", fb: "$7 \\div 6 = 1.1666\\ldots$ — the 6 repeats." },
                      { t: "$\\frac{7}{9}$", fb: "$7 \\div 9 = 0.777\\ldots$ — the 7 repeats." }],
            answer: 0,
            hints: ["Try each division, or look at the bottom number: 8 is made only of 2s ($2 \\times 2 \\times 2$)."],
            why: "$\\frac{7}{8} = 0.875$. A fraction stops exactly when its bottom (in lowest terms) is made only of 2s and 5s." },
          { type: "num", prompt: "Write $\\frac{3}{8}$ as a decimal.", answer: 0.375, skill: "Fractions to decimals",
            label: "Your answer (a decimal)",
            hints: ["$3 \\div 8$. Bring down zeros: 8 into 30 is 3, remainder 6."],
            why: "$3 \\div 8 = 0.375$, and it stops." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "A repeating decimal back to a fraction",
        blurb: "One trick — multiply, subtract, and the infinite tail cancels itself.",
        mins: 9,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Here is how to go back the other way. The trick is to make two numbers with the **same** endless tail, then subtract so the tails cancel.",
            scene: { type: "walk", rows: [
              { m: "x = 0.777\\ldots", say: "Give the repeating decimal a name." },
              { m: "10x = 7.777\\ldots", say: "Multiply by 10, which shifts it one place. The tail is the same." },
              { m: "10x - x = 7.777\\ldots - 0.777\\ldots", say: "Subtract. Every 7 after the point cancels." },
              { m: "9x = 7", say: "That leaves a plain whole number." },
              { m: "x = \\frac{7}{9}", say: "Divide by 9. So $" + rep(0, 7) + " = \\frac{7}{9}$." }] },
            gate: true,
            then: "One repeating digit, so multiply by 10 and divide by 9. Check it on a calculator: $7 \\div 9 = 0.777\\ldots$" },
          { type: "num", prompt: "Your turn. Write $" + rep(0, 4) + "$ as a fraction.", answer: 4 / 9, shown: "4/9", skill: "Decimals to fractions",
            label: "Your answer (a fraction)", placeholder: "e.g. 2/9",
            near: [{ v: 0.4, fb: "$0.4$ stops after one place. $" + rep(0, 4) + "$ goes on forever, and is a ninth of something." }],
            hints: ["Call it $x$, then $10x = 4.444\\ldots$", "Subtract: $9x = 4$."],
            why: lines(["10x = 4.444\\ldots", "9x = 4", "x = \\frac{4}{9}"]) },
          { type: "learn", kicker: "Two digits",
            prompt: "If **two** digits repeat, shift by two places instead — multiply by 100.",
            scene: { type: "walk", rows: [
              { m: "x = 0.363636\\ldots", say: "The block “36” repeats." },
              { m: "100x = 36.363636\\ldots", say: "Multiply by 100 to shift past the whole block." },
              { m: "99x = 36", say: "Subtract: the endless tails are identical, so they cancel." },
              { m: "x = \\frac{36}{99} = \\frac{4}{11}", say: "Divide by 99, then cancel by 9." }] },
            gate: true,
            then: "One repeating digit gives ninths, two give ninety-ninths, three give $999$ths. The pattern comes straight from the shift." },
          { type: "num", prompt: "Write $" + rep(0, "27") + "$ as a fraction in lowest terms.", answer: 27 / 99, shown: "3/11", skill: "Decimals to fractions (2 digits)",
            label: "Your answer (a fraction)", placeholder: "e.g. 3/11",
            hints: ["Two digits repeat, so $100x = 27.2727\\ldots$ and $99x = 27$.", "$\\frac{27}{99}$ cancels by 9."],
            why: lines(["100x = 27.2727\\ldots", "99x = 27", "x = \\frac{27}{99} = \\frac{3}{11}"]) },
          { type: "choice", prompt: "Why does the subtraction work?", skill: "Decimals to fractions",
            options: [{ t: "Both numbers have exactly the same endless tail, so it cancels" },
                      { t: "Because $10x - x = 9x$", fb: "True, but that is the easy half. The point is that the endless tails are identical and vanish." },
                      { t: "Because the decimal is close to a fraction", fb: "It isn't an approximation — after subtracting, the answer is exact." }],
            answer: 0,
            why: "Shifting by the length of the repeating block lines the tails up, and subtracting removes them exactly." },
          { type: "num", prompt: "A harder one: write $0.1\\overline{6}$ (that is $0.1666\\ldots$) as a fraction.", answer: 1 / 6, shown: "1/6",
            skill: "Decimals to fractions (2 digits)", label: "Your answer (a fraction)", placeholder: "e.g. 1/6",
            near: [{ v: 16 / 99, fb: "Only the 6 repeats, not “16”. Shift so the repeating part lines up: $10x = 1.666\\ldots$ and $100x = 16.666\\ldots$" }],
            hints: ["$10x = 1.666\\ldots$ and $100x = 16.666\\ldots$", "Subtract those two: $90x = 15$."],
            why: lines(["100x = 16.666\\ldots", "10x = 1.666\\ldots", "90x = 15", "x = \\frac{15}{90} = \\frac{1}{6}"]) }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Square roots",
        blurb: "The side of a square, given its area.",
        mins: 9,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A square's area is its side times itself: side $5$ gives area $25$. A **square root** asks that backwards: what side gives this area? Size the square until its area is $36$.",
            scene: { type: "square", side: 2, max: 10, target: 36 },
            gate: true,
            then: "Side 6, because $6 \\times 6 = 36$. We write $\\sqrt{36} = 6$. A number like 36, with a whole-number root, is called a **perfect square**." },
          { type: "num", prompt: "What is $\\sqrt{49}$?", answer: 7, skill: "Square roots",
            near: [{ v: 24.5, fb: "A square root isn't half: $\\sqrt{49}$ is the number that times **itself** gives 49." },
                   { v: 6, fb: "$6 \\times 6 = 36$. Try one bigger." }],
            hints: ["Which number times itself is 49?"],
            why: "$7 \\times 7 = 49$, so $\\sqrt{49} = 7$." },
          { type: "num", prompt: "What is $\\sqrt{144}$?", answer: 12, skill: "Square roots",
            near: [{ v: 72, fb: "That's half of 144. You want the number that times itself gives 144." }],
            hints: ["It is between 10 ($10^2 = 100$) and 13 ($13^2 = 169$)."],
            why: "$12 \\times 12 = 144$." },
          { type: "learn", kicker: "Both answers",
            prompt: "Careful with equations. $\\sqrt{25}$ means the **positive** root, 5. But the equation $x^2 = 25$ has **two** answers, because a negative times a negative is positive.",
            scene: { type: "walk", rows: [
              { m: "5 \\times 5 = 25", say: "One answer: $x = 5$." },
              { m: "(-5) \\times (-5) = 25", say: "And another: $x = -5$." },
              { m: "x^2 = 25 \\;\\to\\; x = 5 \\text{ or } x = -5", say: "So an equation like this has two solutions, written $x = \\pm 5$." }] },
            gate: true },
          { type: "numbers", prompt: "Solve $x^2 = 81$. Give both answers, separated by a comma.", answer: [9, -9], skill: "Equations with roots",
            placeholder: "e.g. 4, -4",
            hints: ["$9 \\times 9 = 81$.", "And a negative times a negative is positive, so $-9$ works too."],
            why: "$9^2 = 81$ and $(-9)^2 = 81$, so $x = \\pm 9$." },
          { type: "learn", kicker: "Fractions and decimals",
            prompt: "Roots of fractions and decimals work the same way: find the root of the top and the bottom, or think about which number times itself gives the decimal.",
            scene: { type: "walk", rows: [
              { m: "\\sqrt{\\frac{9}{16}} = \\frac{\\sqrt{9}}{\\sqrt{16}} = \\frac{3}{4}", say: "Root the top and the bottom separately." },
              { m: "0.3 \\times 0.3 = 0.09", say: "So $\\sqrt{0.09} = 0.3$." },
              { m: "\\sqrt{0.64} = 0.8", say: "Because $8 \\times 8 = 64$, and two decimal places halve to one." }] },
            gate: true },
          { type: "num", prompt: "What is $\\sqrt{\\frac{4}{25}}$?", answer: 0.4, shown: "2/5", skill: "Square roots",
            label: "Your answer (a fraction or a decimal)",
            hints: ["Root the top and the bottom: $\\sqrt{4} = 2$ and $\\sqrt{25} = 5$."],
            why: "$\\frac{2}{5}$, because $\\frac{2}{5} \\times \\frac{2}{5} = \\frac{4}{25}$." },
          { type: "num", prompt: "What is $\\sqrt{0.16}$?", answer: 0.4, skill: "Square roots",
            near: [{ v: 0.04, fb: "$0.04 \\times 0.04 = 0.0016$, too small. Try $0.4$." }],
            hints: ["$4 \\times 4 = 16$, so try $0.4 \\times 0.4$."],
            why: "$0.4 \\times 0.4 = 0.16$." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Cube roots",
        blurb: "The edge of a cube, given its volume.",
        mins: 7,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A cube's volume is its edge times itself times itself: edge 2 gives $2 \\times 2 \\times 2 = 8$. A **cube root** asks it backwards. Turn the cube, and size it until its volume is $27$.",
            scene: { type: "solid", edge: 1, max: 6, target: 27 },
            gate: true,
            then: "Edge 3, because $3 \\times 3 \\times 3 = 27$. We write $\\sqrt[3]{27} = 3$." },
          { type: "num", prompt: "What is $\\sqrt[3]{64}$?", answer: 4, skill: "Cube roots",
            near: [{ v: 8, fb: "$8$ is the **square** root of 64. A cube root needs three of the same: $4 \\times 4 \\times 4 = 64$." },
                   { v: 21.33, fb: "Not a third — the number that appears three times in the multiplication." }],
            hints: ["Which number, three times over, multiplies to 64?"],
            why: "$4 \\times 4 \\times 4 = 64$, so $\\sqrt[3]{64} = 4$." },
          { type: "num", prompt: "A cube of sugar has volume $125\\,\\text{mm}^3$. How long is each edge, in mm?", answer: 5, skill: "Cube roots",
            hints: ["You need $e \\times e \\times e = 125$.", "$5 \\times 5 = 25$, and $25 \\times 5 = 125$."],
            why: "$\\sqrt[3]{125} = 5$ mm." },
          { type: "learn", kicker: "One answer, not two",
            prompt: "Unlike square roots, a cube root has just **one** answer — and negatives are allowed, because a negative multiplied three times stays negative.",
            scene: { type: "walk", rows: [
              { m: "(-2) \\times (-2) = 4", say: "Two negatives make a positive…" },
              { m: "4 \\times (-2) = -8", say: "…and the third makes it negative again." },
              { m: "\\sqrt[3]{-8} = -2", say: "So a cube root of a negative number is fine, and there is only one." }] },
            gate: true },
          { type: "num", prompt: "Solve $x^3 = -27$.", pre: "$x =$", answer: -3, skill: "Equations with roots",
            near: [{ v: 3, fb: "$3^3 = 27$, positive. You need the one that stays negative: $(-3)^3$." }],
            hints: ["$(-3) \\times (-3) = 9$, then $9 \\times (-3) = -27$."],
            why: "$(-3)^3 = -27$, so $x = -3$. (Only one answer — cube roots don't come in pairs.)" },
          { type: "num", prompt: "Solve $x^3 = 1000$.", pre: "$x =$", answer: 10, skill: "Equations with roots",
            hints: ["$10 \\times 10 \\times 10 = 1000$."],
            why: "$\\sqrt[3]{1000} = 10$." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Rational and irrational",
        blurb: "Numbers that can be written as a fraction — and the ones that can't.",
        mins: 8,
        steps: [
          { type: "learn", kicker: "New words",
            prompt: "A **rational** number is any number you can write as a fraction of two whole numbers. That is more numbers than it sounds.",
            scene: { type: "walk", rows: [
              { m: "7 = \\frac{7}{1}", say: "Every whole number is rational." },
              { m: "0.75 = \\frac{3}{4}", say: "Every decimal that stops is rational." },
              { m: "" + rep(0, 3) + " = \\frac{1}{3}", say: "And every decimal that repeats, as Lesson 2 showed." },
              { m: "\\sqrt{9} = 3 = \\frac{3}{1}", say: "A root that comes out whole is rational too." }] },
            gate: true,
            then: "An **irrational** number is one that cannot be written as such a fraction. Its decimal never stops and never repeats — $\\pi = 3.14159\\ldots$ and $\\sqrt{2} = 1.41421\\ldots$ go on without a pattern forever." },
          { type: "choice", prompt: "Is $\\sqrt{16}$ rational or irrational?", skill: "Rational or irrational",
            options: [{ t: "Rational — it is $4$" },
                      { t: "Irrational — it has a root sign", fb: "The sign doesn't decide it. $\\sqrt{16}$ works out to exactly 4, which is $\\frac{4}{1}$." }],
            answer: 0, why: "$\\sqrt{16} = 4$, a whole number, so it is rational." },
          { type: "choice", prompt: "Is $\\sqrt{10}$ rational or irrational?", skill: "Rational or irrational",
            options: [{ t: "Irrational — 10 is not a perfect square" },
                      { t: "Rational — you can write it as $\\frac{10}{1}$", fb: "$\\frac{10}{1}$ is 10 itself, not its root. $\\sqrt{10} = 3.1622\\ldots$, which never repeats." },
                      { t: "Rational — it is $3.16$", fb: "$3.16$ is only close: $3.16^2 = 9.9856$, not 10." }],
            answer: 0,
            hints: ["The root of a whole number is rational only when that number is a perfect square (1, 4, 9, 16, 25…)."],
            why: "10 sits between the perfect squares 9 and 16, so its root is irrational." },
          { type: "sort", prompt: "Sort these numbers. Drag each card into a box, or click a card and then a box.",
            bins: ["Rational", "Irrational"],
            cards: [{ t: "$0.5$", bin: 0 }, { t: "$\\pi$", bin: 1 }, { t: "$\\sqrt{25}$", bin: 0 },
                    { t: "$\\sqrt{7}$", bin: 1 }, { t: "$-\\frac{2}{3}$", bin: 0 }, { t: "$" + rep(0, "12") + "$", bin: 0, fb: "It repeats, so it is a fraction in disguise: $\\frac{12}{99} = \\frac{4}{33}$." },
                    { t: "$\\sqrt[3]{8}$", bin: 0, fb: "$\\sqrt[3]{8} = 2$, a whole number." }, { t: "$1.010010001\\ldots$", bin: 1, fb: "It never stops and never repeats — the pattern of zeros keeps changing." }],
            skill: "Rational or irrational" },
          { type: "choice", prompt: "$\\sqrt{2} + 3$ — rational or irrational?", skill: "Rational or irrational",
            options: [{ t: "Irrational — adding 3 shifts it, but the endless non-repeating part stays" },
                      { t: "Rational, because 3 is rational", fb: "Adding a rational number to an irrational one leaves it irrational: the digits still never repeat." }],
            answer: 0,
            why: "$\\sqrt{2} + 3 = 4.41421\\ldots$, still endless and without a pattern." },
          { type: "multi", prompt: "Which of these are rational? Pick every one.", skill: "Rational or irrational",
            options: [{ t: "$\\sqrt{36}$", ok: true }, { t: "$\\frac{9}{4}$", ok: true }, { t: "$0.125$", ok: true },
                      { t: "$\\sqrt{20}$", ok: false, fb: "20 is not a perfect square, so its root never repeats." },
                      { t: "$\\pi$", ok: false, fb: "$\\pi$ is the classic irrational number: $3.14159\\ldots$, no pattern, forever." }],
            hints: ["Ask of each: can I write this as one whole number over another?"],
            why: "$\\sqrt{36} = 6$, $\\frac{9}{4}$ is already a fraction, and $0.125 = \\frac{1}{8}$." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Pinning down an irrational",
        blurb: "You can't write it exactly, but you can trap it between numbers you can.",
        mins: 8,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "$\\sqrt{40}$ has no exact decimal. But it is easy to say which two whole numbers it sits between: look at the perfect squares on either side.",
            scene: { type: "walk", rows: [
              { m: "6^2 = 36 \\;\\text{ and }\\; 7^2 = 49", say: "40 lies between 36 and 49." },
              { m: "6 < \\sqrt{40} < 7", say: "So its root lies between 6 and 7." },
              { m: "6.3^2 = 39.69", say: "40 is closer to 36 than to 49, so try 6.3." },
              { m: "6.4^2 = 40.96", say: "That overshoots — so $\\sqrt{40}$ is between 6.3 and 6.4, nearer 6.3." }] },
            gate: true,
            then: "That is what approximating a root means: squeeze it between numbers you can write, then tighten." },
          { type: "num", prompt: "$\\sqrt{30}$ lies between two whole numbers. What is the smaller one?", answer: 5, skill: "Approximating roots",
            near: [{ v: 6, fb: "$6^2 = 36$, which is already past 30. The one below is $5$, since $5^2 = 25$." }],
            hints: ["List the perfect squares: 25, 36. Where does 30 fall?"],
            why: "$25 < 30 < 36$, so $5 < \\sqrt{30} < 6$." },
          { type: "numberline", prompt: "Drag the point to where $\\sqrt{30}$ belongs, to the nearest tenth.", skill: "Approximating roots",
            min: 0, max: 8, tick: 0.5, snap: 0.1, label: 2,
            points: [{ v: 2, drag: true, label: "\\sqrt{30}" }],
            check: function (st) {
              var v = st.points[0];
              return Math.abs(v - 5.5) < 0.101 ? { ok: true }
                : { ok: false, say: v < 5 ? "Too small: $5^2 = 25$, which is under 30." : v > 6 ? "Too big: $6^2 = 36$, which is over 30." : "Close. Try squaring your guess: you want it as near 30 as you can get." };
            },
            hints: ["It is between 5 and 6.", "$5.5^2 = 30.25$ — very close to 30."],
            why: "$\\sqrt{30} \\approx 5.48$, so to the nearest tenth it sits at 5.5." },
          { type: "choice", prompt: "Which is bigger, $\\sqrt{50}$ or $7.5$?", skill: "Comparing irrationals",
            options: [{ t: "$7.5$" }, { t: "$\\sqrt{50}$", fb: "Square both: $\\sqrt{50}$ squared is 50, and $7.5^2 = 56.25$. So $7.5$ is bigger." }],
            answer: 0,
            hints: ["Square them both and compare — squaring keeps the order for positive numbers."],
            why: "$7.5^2 = 56.25 > 50$, so $7.5 > \\sqrt{50}$ ($\\sqrt{50} \\approx 7.07$)." },
          { type: "num", prompt: "Between which two whole numbers does $\\sqrt{90}$ lie? Give the **smaller** one.", answer: 9, skill: "Approximating roots",
            hints: ["$9^2 = 81$ and $10^2 = 100$."],
            why: "$81 < 90 < 100$, so $9 < \\sqrt{90} < 10$." },
          { type: "choice", prompt: "Put $\\sqrt{8}$, $2.5$ and $\\pi$ in order, smallest first.", skill: "Comparing irrationals",
            options: [{ t: "$2.5$, $\\sqrt{8}$, $\\pi$" },
                      { t: "$\\sqrt{8}$, $2.5$, $\\pi$", fb: "$\\sqrt{8} \\approx 2.83$, which is more than 2.5." },
                      { t: "$2.5$, $\\pi$, $\\sqrt{8}$", fb: "$\\pi \\approx 3.14$ and $\\sqrt{8} \\approx 2.83$, so $\\pi$ is the biggest." }],
            answer: 0,
            hints: ["$\\sqrt{8}$ is between $\\sqrt{4} = 2$ and $\\sqrt{9} = 3$, nearer 3."],
            why: "$2.5 < 2.83 < 3.14$." }
        ]
      },
      /* ============================================================== 7 */
      {
        title: "The exponent rules",
        blurb: "Count the factors and every rule explains itself.",
        mins: 9,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "$2^5$ means five 2s multiplied: $2 \\times 2 \\times 2 \\times 2 \\times 2$. Every exponent rule is just counting those factors.",
            scene: { type: "walk", rows: [
              { m: "2^3 \\times 2^4", say: "Three 2s, then four more 2s." },
              { m: "(2 \\cdot 2 \\cdot 2)(2 \\cdot 2 \\cdot 2 \\cdot 2)", say: "Write them all out: seven 2s altogether." },
              { m: "2^7", say: "So $2^3 \\times 2^4 = 2^{3+4}$. **Multiplying** powers of the same base **adds** the exponents." }] },
            gate: true },
          { type: "num", prompt: "$3^4 \\times 3^2 = 3^{\\square}$. What goes in the box?", answer: 6, skill: "Exponent rules",
            near: [{ v: 8, fb: "Adding the exponents, not multiplying them: $4 + 2 = 6$." }],
            hints: ["Four 3s and then two more 3s — how many 3s in total?"],
            why: "$3^4 \\times 3^2 = 3^{4+2} = 3^6$." },
          { type: "learn", kicker: "Dividing",
            prompt: "Dividing cancels factors instead of adding them.",
            scene: { type: "walk", rows: [
              { m: "\\frac{2^5}{2^2}", say: "Five 2s on top, two on the bottom." },
              { m: "\\frac{2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2}{2 \\cdot 2}", say: "Each 2 on the bottom cancels one on top." },
              { m: "2^3", say: "Three are left: $2^{5-2}$. **Dividing** powers **subtracts** the exponents." }] },
            gate: true },
          { type: "num", prompt: "$\\frac{7^9}{7^5} = 7^{\\square}$. What goes in the box?", answer: 4, skill: "Exponent rules",
            near: [{ v: 45, fb: "Subtract the exponents when dividing: $9 - 5 = 4$." }],
            hints: ["Nine 7s on top, five cancelled away."],
            why: "$\\frac{7^9}{7^5} = 7^{9-5} = 7^4$." },
          { type: "learn", kicker: "A power of a power",
            prompt: "And one more, which trips people up.",
            scene: { type: "walk", rows: [
              { m: "(2^3)^4", say: "Four copies of $2^3$." },
              { m: "2^3 \\cdot 2^3 \\cdot 2^3 \\cdot 2^3", say: "Each copy is three 2s, and there are four copies." },
              { m: "2^{12}", say: "$3 \\times 4 = 12$ factors. A **power of a power multiplies** the exponents." }] },
            gate: true },
          { type: "num", prompt: "$(5^2)^3 = 5^{\\square}$. What goes in the box?", answer: 6, skill: "Exponent rules",
            near: [{ v: 5, fb: "That's the rule for multiplying two powers. A power of a power multiplies: $2 \\times 3$." }],
            hints: ["Three copies of $5^2$, each worth two 5s."],
            why: "$(5^2)^3 = 5^{2 \\times 3} = 5^6$." },
          { type: "choice", prompt: "Which is $(3x)^2$ written out?", skill: "Exponent rules",
            options: [{ t: "$9x^2$" }, { t: "$3x^2$", fb: "The bracket means the 3 is squared too: $(3x)^2 = 3x \\cdot 3x$." },
                      { t: "$6x^2$", fb: "$3^2 = 9$, not $3 \\times 2$." }],
            answer: 0,
            hints: ["$(3x)^2 = 3x \\times 3x = 3 \\times 3 \\times x \\times x$."],
            why: "Everything inside the bracket gets the power: $(3x)^2 = 9x^2$." },
          { type: "num", prompt: "Work it out: $\\frac{2^6 \\times 2^3}{2^7} = 2^{\\square}$", answer: 2, skill: "Exponent rules",
            hints: ["Top first: $2^6 \\times 2^3 = 2^9$.", "Then divide: $9 - 7$."],
            why: lines(["\\frac{2^6 \\times 2^3}{2^7} = \\frac{2^9}{2^7}", "2^{9-7} = 2^2"]) }
        ]
      },
      /* ============================================================== 8 */
      {
        title: "Zero and negative exponents",
        blurb: "Keep halving past the end and the pattern tells you what they must mean.",
        mins: 8,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "What could $2^0$ possibly mean — no 2s at all? Follow the pattern downwards: each step down divides by 2.",
            scene: { type: "walk", rows: [
              { m: "2^3 = 8,\\; 2^2 = 4,\\; 2^1 = 2", say: "Going down one step halves the answer each time." },
              { m: "2^0 = 1", say: "Half of 2 is 1. So anything to the power 0 is 1." },
              { m: "2^{-1} = \\frac{1}{2}", say: "Keep going: half of 1." },
              { m: "2^{-2} = \\frac{1}{4}", say: "And half again. A negative exponent means **one over** the positive power." }] },
            gate: true,
            then: "In short: $a^0 = 1$, and $a^{-n} = \\frac{1}{a^n}$. Negative exponents make small numbers, not negative ones." },
          { type: "num", prompt: "What is $5^0$?", answer: 1, skill: "Negative exponents",
            near: [{ v: 0, fb: "Anything (except 0) to the power 0 is 1 — follow the halving pattern down." }, { v: 5, fb: "$5^1$ is 5. $5^0$ is one step further down." }],
            why: "$5^0 = 1$." },
          { type: "num", prompt: "What is $3^{-2}$?", answer: 1 / 9, shown: "1/9", skill: "Negative exponents",
            label: "Your answer (a fraction or a decimal)",
            near: [{ v: -9, fb: "A negative exponent doesn't make the answer negative. It flips it: $\\frac{1}{3^2}$." },
                   { v: -6, fb: "$3^{-2} = \\frac{1}{3^2} = \\frac{1}{9}$." }],
            hints: ["$3^{-2} = \\frac{1}{3^2}$.", "$3^2 = 9$."],
            why: "$3^{-2} = \\frac{1}{9}$." },
          { type: "num", prompt: "What is $10^{-3}$, as a decimal?", answer: 0.001, skill: "Negative exponents",
            hints: ["$10^3 = 1000$, so $10^{-3} = \\frac{1}{1000}$."],
            why: "$\\frac{1}{1000} = 0.001$ — the negative exponent counts places to the right of the point." },
          { type: "learn", kicker: "The rules still hold",
            prompt: "The rules from Lesson 7 work with negative exponents too — add when multiplying, subtract when dividing.",
            scene: { type: "walk", rows: [
              { m: "2^5 \\times 2^{-3}", say: "Same base, so add the exponents." },
              { m: "2^{5 + (-3)} = 2^2", say: "$5 + (-3) = 2$, so the answer is 4." },
              { m: "\\frac{3^{-2}}{3^{-5}} = 3^{-2 - (-5)} = 3^3", say: "Subtracting a negative adds: $-2 + 5 = 3$." }] },
            gate: true },
          { type: "num", prompt: "$4^{-6} \\times 4^{8} = 4^{\\square}$. What goes in the box?", answer: 2, skill: "Negative exponents",
            near: [{ v: -2, fb: "Add them in the right order: $-6 + 8 = 2$." }],
            hints: ["Add the exponents: $-6 + 8$."],
            why: "$4^{-6} \\times 4^8 = 4^{-6+8} = 4^2$." },
          { type: "num", prompt: "$\\frac{x^3}{x^{-2}} = x^{\\square}$. What goes in the box?", answer: 5, skill: "Negative exponents",
            near: [{ v: 1, fb: "Subtracting a negative adds: $3 - (-2) = 3 + 2$." }],
            hints: ["Dividing subtracts: $3 - (-2)$.", "Taking away a negative adds."],
            why: "$\\frac{x^3}{x^{-2}} = x^{3-(-2)} = x^5$." }
        ]
      },
      /* ============================================================== 9 */
      {
        title: "Powers of 10 and scientific notation",
        blurb: "A short way to write numbers too big or too small to read.",
        mins: 9,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Powers of ten are just place value. The exponent counts the places.",
            scene: { type: "walk", rows: [
              { m: "10^3 = 1000", say: "Three zeros — three places to the left." },
              { m: "10^6 = 1{,}000{,}000", say: "A million." },
              { m: "10^{-3} = 0.001", say: "A negative exponent counts places to the right instead." },
              { m: "4.2 \\times 10^3 = 4200", say: "Multiplying by $10^3$ moves the point three places right." }] },
            gate: true,
            then: "**Scientific notation** writes a number as one digit, then a decimal point, then the rest — times a power of ten. The first part must be **at least 1 and less than 10**." },
          { type: "choice", prompt: "Which of these is written correctly in scientific notation?", skill: "Scientific notation",
            options: [{ t: "$3.4 \\times 10^5$" }, { t: "$34 \\times 10^4$", fb: "$34$ is not between 1 and 10. Move the point one more place: $3.4 \\times 10^5$." },
                      { t: "$0.34 \\times 10^6$", fb: "$0.34$ is less than 1. The first part has to be at least 1." }],
            answer: 0,
            hints: ["The first part must be at least 1 and under 10."],
            why: "All three equal 340,000, but only $3.4 \\times 10^5$ is in the required form." },
          { type: "num", prompt: "Write $52{,}000$ in scientific notation. What is the **power of ten**?", answer: 4, skill: "Scientific notation",
            near: [{ v: 5, fb: "Count the places the point moves: $52000 \\to 5.2$ is four places." }],
            hints: ["First make the digits into $5.2$.", "Count how many places the point moved: $52000. \\to 5.2$"],
            why: "$52{,}000 = 5.2 \\times 10^4$." },
          { type: "learn", kicker: "Small numbers",
            prompt: "Tiny numbers work the same way, with a negative power.",
            scene: { type: "walk", rows: [
              { m: "0.00047", say: "Move the point to just after the first non-zero digit." },
              { m: "4.7", say: "That took four places — to the **right**." },
              { m: "4.7 \\times 10^{-4}", say: "Moving right means a negative exponent. Check: $10^{-4}$ makes it small again." }] },
            gate: true },
          { type: "num", prompt: "Write $0.0000031$ in scientific notation. What is the power of ten?", answer: -6, skill: "Scientific notation",
            near: [{ v: 6, fb: "The number is smaller than 1, so the exponent is negative." },
                   { v: -7, fb: "Count to the first non-zero digit: $0.0000031 \\to 3.1$ is six places." }],
            hints: ["The digits become $3.1$.", "Count the places the point moves: six, to the right, so the exponent is $-6$."],
            why: "$0.0000031 = 3.1 \\times 10^{-6}$." },
          { type: "num", prompt: "Write $6.03 \\times 10^{4}$ as an ordinary number.", answer: 60300, skill: "Scientific notation",
            near: [{ v: 6.0304, fb: "The $10^4$ moves the point four places right, it doesn't get added on." }],
            hints: ["Move the decimal point four places right, filling with zeros."],
            why: "$6.03 \\times 10^4 = 60{,}300$." },
          { type: "choice", prompt: "Roughly how many times bigger is $6 \\times 10^{8}$ than $3 \\times 10^{5}$?", skill: "Scientific notation",
            options: [{ t: "About 2000 times" }, { t: "About 2 times", fb: "The digits are only twice as big, but the powers of ten differ by $10^3$ as well." },
                      { t: "About 3 times", fb: "Compare both parts: $6 \\div 3 = 2$, and $10^8 \\div 10^5 = 10^3$." }],
            answer: 0,
            hints: ["Divide the digit parts, then the powers of ten."],
            why: "$\\frac{6 \\times 10^8}{3 \\times 10^5} = 2 \\times 10^3 = 2000$." }
        ]
      },
      /* ============================================================= 10 */
      {
        title: "Working in scientific notation",
        blurb: "Multiply the fronts, add the exponents — then tidy the answer back into form.",
        mins: 9,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "To multiply two numbers in scientific notation, handle the two parts separately.",
            scene: { type: "walk", rows: [
              { m: "(3 \\times 10^4)(2 \\times 10^5)", say: "Multiplication can be rearranged in any order." },
              { m: "(3 \\times 2)(10^4 \\times 10^5)", say: "Digits with digits, powers with powers." },
              { m: "6 \\times 10^9", say: "$3 \\times 2 = 6$, and multiplying powers adds the exponents." }] },
            gate: true },
          { type: "num", prompt: "$(2 \\times 10^3)(4 \\times 10^6) = \\square \\times 10^9$. What is the front number?", answer: 8, skill: "Arithmetic in scientific notation",
            hints: ["$2 \\times 4 = 8$, and $3 + 6 = 9$."],
            why: "$(2 \\times 10^3)(4 \\times 10^6) = 8 \\times 10^9$." },
          { type: "learn", kicker: "Tidying up",
            prompt: "Sometimes the front number comes out too big, and the answer has to be put back into form.",
            scene: { type: "walk", rows: [
              { m: "(5 \\times 10^3)(4 \\times 10^2)", say: "Multiply the parts." },
              { m: "20 \\times 10^5", say: "$5 \\times 4 = 20$ — but 20 is not between 1 and 10." },
              { m: "2.0 \\times 10^1 \\times 10^5", say: "Write 20 itself in scientific notation." },
              { m: "2 \\times 10^6", say: "Add the exponents. Now the front is between 1 and 10." }] },
            gate: true },
          { type: "num", prompt: "$(6 \\times 10^5)(5 \\times 10^2)$ comes to $3 \\times 10^{\\square}$. What is the exponent?", answer: 8, skill: "Arithmetic in scientific notation",
            near: [{ v: 7, fb: "$6 \\times 5 = 30$, which is $3 \\times 10^1$ — that extra ten counts: $5 + 2 + 1 = 8$." }],
            hints: ["$6 \\times 5 = 30$ and $10^5 \\times 10^2 = 10^7$, so the answer is $30 \\times 10^7$.", "$30 = 3 \\times 10^1$, so add one more to the exponent."],
            why: lines(["(6 \\times 10^5)(5 \\times 10^2) = 30 \\times 10^7", "3 \\times 10^1 \\times 10^7 = 3 \\times 10^8"]) },
          { type: "learn", kicker: "Dividing, adding",
            prompt: "Dividing subtracts the exponents. Adding is different: the powers have to **match** first.",
            scene: { type: "walk", rows: [
              { m: "\\frac{8 \\times 10^9}{2 \\times 10^4} = 4 \\times 10^5", say: "Divide the fronts, subtract the exponents." },
              { m: "7 \\times 10^5 + 2 \\times 10^5 = 9 \\times 10^5", say: "Same power of ten, so just add the fronts — like 7 apples plus 2 apples." },
              { m: "3 \\times 10^6 + 4 \\times 10^5", say: "Different powers: rewrite one of them first." },
              { m: "30 \\times 10^5 + 4 \\times 10^5 = 34 \\times 10^5 = 3.4 \\times 10^6", say: "Now they match, add, and tidy." }] },
            gate: true },
          { type: "num", prompt: "$\\frac{9 \\times 10^{12}}{3 \\times 10^{4}} = 3 \\times 10^{\\square}$. What is the exponent?", answer: 8, skill: "Arithmetic in scientific notation",
            near: [{ v: 16, fb: "Dividing subtracts the exponents: $12 - 4$." }],
            hints: ["$9 \\div 3 = 3$, and $12 - 4 = 8$."],
            why: "$\\frac{9 \\times 10^{12}}{3 \\times 10^4} = 3 \\times 10^8$." },
          { type: "num", prompt: "$5 \\times 10^7 + 3 \\times 10^7 = \\square \\times 10^7$. What is the front number?", answer: 8, skill: "Arithmetic in scientific notation",
            near: [{ v: 15, fb: "The powers already match, so add the fronts: $5 + 3$. Multiplying would be for $\\times$." }],
            hints: ["The powers of ten are the same, so this is $5$ of something plus $3$ of the same thing."],
            why: "$5 \\times 10^7 + 3 \\times 10^7 = 8 \\times 10^7$." },
          { type: "num", prompt: "A red blood cell is about $7 \\times 10^{-6}$ m across. About how many, side by side, would span $1.4 \\times 10^{-2}$ m? Give the front number of the answer $\\square \\times 10^{3}$.", answer: 2, skill: "Arithmetic in scientific notation",
            hints: ["Divide: $\\frac{1.4 \\times 10^{-2}}{7 \\times 10^{-6}}$.", "$1.4 \\div 7 = 0.2$, and $-2 - (-6) = 4$, giving $0.2 \\times 10^4$.", "$0.2 \\times 10^4 = 2 \\times 10^3$."],
            why: lines(["\\frac{1.4 \\times 10^{-2}}{7 \\times 10^{-6}} = 0.2 \\times 10^{4}", "= 2 \\times 10^{3} \\;\\text{(about 2000 cells)}"]) }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Repeating decimals, both directions.",
        skills: ["g8-fd", "g8-df1", "g8-df2"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Square and cube roots, rational against irrational, and approximating.",
        skills: ["g8-sqrt", "g8-cbrt", "g8-rooteq", "g8-class", "g8-approx"], per: 2 },
      { title: "Quiz 3", after: 8, blurb: "The exponent rules, including zero and negative exponents.",
        skills: ["g8-exp", "g8-negexp"], per: 2 }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "g8-fd", title: "Fractions as repeating decimals", lesson: 1,
        gen: function (R) {
          var T = R.pick([
            { f: [1, 3], d: "3", lead: "0." }, { f: [2, 3], d: "6", lead: "0." },
            { f: [1, 9], d: "1", lead: "0." }, { f: [5, 9], d: "5", lead: "0." },
            { f: [1, 11], d: "09", lead: "0." }, { f: [3, 11], d: "27", lead: "0." },
            { f: [5, 6], d: "3", lead: "0.8" }, { f: [1, 6], d: "6", lead: "0.1" },
            { f: [7, 9], d: "7", lead: "0." }, { f: [4, 11], d: "36", lead: "0." }
          ]);
          var n = T.f[0], d = T.f[1];
          var wrong = [{ t: "$" + T.lead + T.d + "$", fb: "That stops after a few places. This division never stops — it repeats." },
                       { t: "$" + T.lead + "\\overline{" + T.d.split("").reverse().join("") + "}$", fb: "The digits are right but in the wrong order. Do the division one step at a time." }];
          if (T.d.length === 1) wrong.push({ t: "$" + T.lead + "\\overline{" + (T.d === "9" ? "1" : Number(T.d) + 1) + "}$", fb: "Check the division: $" + n + " \\div " + d + "$." });
          return mc(R, { prompt: "Write $\\frac{" + n + "}{" + d + "}$ as a repeating decimal.",
            right: "$" + T.lead + "\\overline{" + T.d + "}$", wrong: wrong,
            skill: "Fractions as repeating decimals",
            hints: ["Divide " + n + " by " + d + ", bringing down a zero each time.", "When a remainder comes back, the digits from there on repeat."],
            why: "$" + n + " \\div " + d + " = " + T.lead + "\\overline{" + T.d + "}$." });
        } },
      { id: "g8-df1", title: "One repeating digit to a fraction", lesson: 2,
        gen: function (R) {
          var d = R.int(1, 8), g = gcd(d, 9);
          return { type: "num", prompt: "Write $0.\\overline{" + d + "}$ as a fraction.", answer: d / 9,
            shown: frac(d / g, 9 / g), label: "Your answer (a fraction)", placeholder: "e.g. 4/9",
            near: [{ v: d / 10, fb: "$0." + d + "$ stops after one place; $0.\\overline{" + d + "}$ goes on forever." }],
            hints: ["Call it $x$. Then $10x = " + d + "." + d + d + d + "\\ldots$", "Subtract: $9x = " + d + "$."],
            why: lines(["10x = " + d + "." + d + d + d + "\\ldots", "9x = " + d, "x = \\frac{" + d + "}{9}" + (g > 1 ? " = " + frac(d / g, 9 / g) : "")]) };
        } },
      { id: "g8-df2", title: "Two repeating digits to a fraction", lesson: 2,
        gen: function (R) {
          var n = R.int(10, 98);
          while (n % 11 === 0) n = R.int(10, 98);
          var g = gcd(n, 99);
          return { type: "num", prompt: "Write $0.\\overline{" + n + "}$ as a fraction in lowest terms.", answer: n / 99,
            shown: frac(n / g, 99 / g), label: "Your answer (a fraction)", placeholder: "e.g. 12/99",
            hints: ["Two digits repeat, so multiply by 100: $100x = " + n + "." + n + n + "\\ldots$", "Subtract: $99x = " + n + "$."],
            why: lines(["100x = " + n + "." + n + n + "\\ldots", "99x = " + n, "x = \\frac{" + n + "}{99}" + (g > 1 ? " = " + frac(n / g, 99 / g) : "")]) };
        } },
      { id: "g8-sqrt", title: "Square roots", lesson: 3,
        gen: function (R) {
          var kind = R.int(0, 2);
          if (kind === 0) {
            var a = R.int(2, 15);
            return { type: "num", prompt: "What is $\\sqrt{" + a * a + "}$?", answer: a,
              near: [{ v: a * a / 2, fb: "A square root isn't half. Which number times **itself** gives " + a * a + "?" }],
              hints: ["Which number times itself gives " + a * a + "?"],
              why: "$" + a + " \\times " + a + " = " + a * a + "$." };
          }
          if (kind === 1) {
            var p = R.int(2, 9), q = R.int(2, 9);
            while (q === p) q = R.int(2, 9);
            return { type: "num", prompt: "What is $\\sqrt{\\frac{" + p * p + "}{" + q * q + "}}$?", answer: p / q,
              shown: frac(p / gcd(p, q), q / gcd(p, q)), label: "Your answer (a fraction or a decimal)",
              hints: ["Take the root of the top and of the bottom separately."],
              why: "$\\frac{\\sqrt{" + p * p + "}}{\\sqrt{" + q * q + "}} = \\frac{" + p + "}{" + q + "}$." };
          }
          var t = R.pick([[0.04, 0.2], [0.09, 0.3], [0.16, 0.4], [0.25, 0.5], [0.36, 0.6], [0.49, 0.7], [0.64, 0.8], [0.81, 0.9], [1.21, 1.1], [1.44, 1.2]]);
          return { type: "num", prompt: "What is $\\sqrt{" + num(t[0]) + "}$?", answer: t[1],
            near: [{ v: t[0] / 2, fb: "Halving isn't rooting. Which number times itself gives " + num(t[0]) + "?" }],
            hints: ["Ignore the point first: $\\sqrt{" + Math.round(t[0] * 100) + "} = " + Math.round(t[1] * 10) + "$.", "Two decimal places in, one decimal place out."],
            why: "$" + num(t[1]) + " \\times " + num(t[1]) + " = " + num(t[0]) + "$." };
        } },
      { id: "g8-cbrt", title: "Cube roots", lesson: 4,
        gen: function (R) {
          var a = R.int(2, 10) * (R.chance(0.3) ? -1 : 1);
          return { type: "num", prompt: "What is $\\sqrt[3]{" + a * a * a + "}$?", answer: a,
            near: [{ v: Math.abs(a) * Math.abs(a), fb: "That is the number squared. A cube root undoes three of them." },
                   { v: -a, fb: "Check the sign: a negative cubed stays negative, a positive stays positive." }],
            hints: ["Which number, multiplied by itself three times, gives " + a * a * a + "?"],
            why: "$" + a + " \\times " + a + " \\times " + a + " = " + a * a * a + "$." };
        } },
      { id: "g8-rooteq", title: "Equations with square & cube roots", lesson: 4,
        gen: function (R) {
          if (R.chance(0.5)) {
            var a = R.int(2, 13);
            return { type: "numbers", prompt: "Solve $x^2 = " + a * a + "$. Give every answer, separated by a comma.",
              answer: [a, -a], placeholder: "e.g. 4, -4",
              hints: ["$" + a + " \\times " + a + " = " + a * a + "$.", "A negative times a negative is positive, so there is a second answer."],
              why: "$x = " + a + "$ or $x = -" + a + "$." };
          }
          var b = R.int(2, 9) * (R.chance(0.35) ? -1 : 1);
          return { type: "num", prompt: "Solve $x^3 = " + b * b * b + "$.", pre: "$x =$", answer: b,
            near: [{ v: -b, fb: "A cube keeps the sign: $(" + -b + ")^3 = " + -(b * b * b) + "$." }],
            hints: ["A cube root has only one answer, and it keeps the sign."],
            why: "$" + b + "^3 = " + b * b * b + "$, so $x = " + b + "$." };
        } },
      { id: "g8-class", title: "Rational or irrational", lesson: 5,
        gen: function (R) {
          var perfect = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
          var T = R.pick([
            { t: "\\sqrt{" + R.pick(perfect) + "}", ok: true, why: "The root comes out whole, so it is a fraction over 1." },
            { t: "\\sqrt{" + R.pick([2, 3, 5, 6, 7, 10, 11, 15, 20, 30]) + "}", ok: false, why: "That number is not a perfect square, so its root never stops and never repeats." },
            { t: "\\frac{" + R.int(1, 9) + "}{" + R.int(2, 12) + "}", ok: true, why: "It is already a fraction of two whole numbers." },
            { t: "0.\\overline{" + R.int(1, 8) + "}", ok: true, why: "A repeating decimal can always be written as a fraction." },
            { t: "\\pi", ok: false, why: "$\\pi = 3.14159\\ldots$ never repeats." },
            { t: "-" + R.int(2, 40), ok: true, why: "Every whole number is a fraction over 1." },
            { t: num(R.int(1, 99) / 100), ok: true, why: "A decimal that stops is a fraction of hundredths." },
            { t: "\\sqrt[3]{" + R.pick([8, 27, 64, 125]) + "}", ok: true, why: "The cube root comes out whole." }
          ]);
          return mc(R, { prompt: "Is $" + T.t + "$ rational or irrational?",
            right: T.ok ? "Rational" : "Irrational",
            wrong: [{ t: T.ok ? "Irrational" : "Rational", fb: T.ok ? "It can be written as a fraction of two whole numbers." : "It cannot be written as a fraction: the decimal never stops and never repeats." }],
            keep: true, skill: "Rational or irrational",
            hints: ["Ask: can this be written as one whole number over another?"],
            why: T.why });
        } },
      { id: "g8-approx", title: "Approximating & comparing roots", lesson: 6,
        gen: function (R) {
          if (R.chance(0.5)) {
            var lo = R.int(2, 11), n = lo * lo + R.int(1, 2 * lo);
            return { type: "num", prompt: "$\\sqrt{" + n + "}$ lies between two whole numbers. What is the **smaller** one?",
              answer: lo,
              near: [{ v: lo + 1, fb: "$" + (lo + 1) + "^2 = " + (lo + 1) * (lo + 1) + "$, which is already past " + n + "." }],
              hints: ["List perfect squares until you pass " + n + ": $" + lo + "^2 = " + lo * lo + "$ and $" + (lo + 1) + "^2 = " + (lo + 1) * (lo + 1) + "$."],
              why: "$" + lo * lo + " < " + n + " < " + (lo + 1) * (lo + 1) + "$, so $" + lo + " < \\sqrt{" + n + "} < " + (lo + 1) + "$." };
          }
          var base = R.int(3, 10), k = R.int(1, 2 * base - 1), m = base * base + k;
          var dec = Math.round(Math.sqrt(m) * 10) / 10 + (R.chance(0.5) ? 0.4 : -0.4);
          dec = Math.round(dec * 10) / 10;
          var bigger = dec > Math.sqrt(m);
          return mc(R, { prompt: "Which is bigger, $\\sqrt{" + m + "}$ or $" + num(dec) + "$?",
            right: bigger ? "$" + num(dec) + "$" : "$\\sqrt{" + m + "}$",
            wrong: [{ t: bigger ? "$\\sqrt{" + m + "}$" : "$" + num(dec) + "$",
                      fb: "Square them both: $" + num(dec) + "^2 = " + num(Math.round(dec * dec * 100) / 100) + "$, and the root squared is just " + m + "." }],
            keep: true, skill: "Approximating & comparing roots",
            hints: ["Square both — for positive numbers, squaring keeps the order."],
            why: "$" + num(dec) + "^2 = " + num(Math.round(dec * dec * 100) / 100) + "$ against " + m + ", so " +
                 (bigger ? "$" + num(dec) + "$ is bigger." : "$\\sqrt{" + m + "}$ is bigger.") });
        } },
      { id: "g8-exp", title: "The exponent rules", lesson: 7,
        gen: function (R) {
          var b = R.pick([2, 3, 5, 7, "x", "a"]), kind = R.int(0, 2);
          var p = R.int(2, 9), q = R.int(2, 9);
          if (kind === 0) {
            return { type: "num", prompt: "$" + b + "^{" + p + "} \\times " + b + "^{" + q + "} = " + b + "^{\\square}$. What goes in the box?",
              answer: p + q,
              near: [{ v: p * q, fb: "Multiplying powers **adds** the exponents: $" + p + " + " + q + "$." }],
              hints: ["Write them out: " + p + " of them and then " + q + " more."],
              why: "$" + b + "^{" + p + "} \\times " + b + "^{" + q + "} = " + b + "^{" + p + "+" + q + "} = " + b + "^{" + (p + q) + "}$." };
          }
          if (kind === 1) {
            var hi = Math.max(p, q) + R.int(1, 4), lo2 = Math.min(p, q);
            return { type: "num", prompt: "$\\frac{" + b + "^{" + hi + "}}{" + b + "^{" + lo2 + "}} = " + b + "^{\\square}$. What goes in the box?",
              answer: hi - lo2,
              near: [{ v: hi / lo2, fb: "Dividing powers **subtracts** the exponents: $" + hi + " - " + lo2 + "$." }],
              hints: ["Each factor on the bottom cancels one on top."],
              why: "$" + b + "^{" + hi + "-" + lo2 + "} = " + b + "^{" + (hi - lo2) + "}$." };
          }
          return { type: "num", prompt: "$(" + b + "^{" + p + "})^{" + q + "} = " + b + "^{\\square}$. What goes in the box?",
            answer: p * q,
            near: [{ v: p + q, fb: "A power of a power **multiplies** the exponents: $" + p + " \\times " + q + "$." }],
            hints: [q + " copies of $" + b + "^{" + p + "}$, each worth " + p + " factors."],
            why: "$(" + b + "^{" + p + "})^{" + q + "} = " + b + "^{" + p + " \\times " + q + "} = " + b + "^{" + p * q + "}$." };
        } },
      { id: "g8-negexp", title: "Zero & negative exponents", lesson: 8,
        gen: function (R) {
          var kind = R.int(0, 2);
          if (kind === 0) {
            var a = R.int(2, 9), n = R.int(1, 3), v = 1 / Math.pow(a, n);
            return { type: "num", prompt: "What is $" + a + "^{-" + n + "}$?", answer: v,
              shown: frac(1, Math.pow(a, n)), label: "Your answer (a fraction or a decimal)",
              near: [{ v: -Math.pow(a, n), fb: "A negative exponent doesn't make the answer negative — it flips it: $\\frac{1}{" + a + "^{" + n + "}}$." }],
              hints: ["$" + a + "^{-" + n + "} = \\frac{1}{" + a + "^{" + n + "}}$.", "$" + a + "^{" + n + "} = " + Math.pow(a, n) + "$."],
              why: "$" + a + "^{-" + n + "} = \\frac{1}{" + Math.pow(a, n) + "}$." };
          }
          if (kind === 1) {
            var b2 = R.pick([2, 3, 4, 5, "x", "y"]), p2 = R.nz(-7, 8), q2 = R.nz(-7, 8);
            return { type: "num", prompt: "$" + b2 + "^{" + p2 + "} \\times " + b2 + "^{" + q2 + "} = " + b2 + "^{\\square}$. What goes in the box?",
              answer: p2 + q2,
              hints: ["Add the exponents, signs and all: $" + p2 + " + (" + q2 + ")$."],
              why: "$" + p2 + " + (" + q2 + ") = " + (p2 + q2) + "$." };
          }
          var b3 = R.pick([2, 3, 6, "x", "m"]), p3 = R.nz(-6, 7), q3 = R.nz(-6, 7);
          return { type: "num", prompt: "$\\frac{" + b3 + "^{" + p3 + "}}{" + b3 + "^{" + q3 + "}} = " + b3 + "^{\\square}$. What goes in the box?",
            answer: p3 - q3,
            near: [{ v: p3 + q3, fb: "Dividing subtracts: $" + p3 + " - (" + q3 + ")$. Taking away a negative adds." }],
            hints: ["Subtract the exponents: $" + p3 + " - (" + q3 + ")$."],
            why: "$" + p3 + " - (" + q3 + ") = " + (p3 - q3) + "$." };
        } },
      { id: "g8-sci", title: "Scientific notation", lesson: 9,
        gen: function (R) {
          if (R.chance(0.5)) {
            var digits = R.int(11, 99) / 10, e = R.int(-7, 8);
            while (e === 0 || e === 1) e = R.int(-7, 8);
            var plain = digits * Math.pow(10, e);
            var shown = e > 0 ? plain.toLocaleString("en-US") : num(Math.round(plain * 1e10) / 1e10);
            return { type: "num", prompt: "Write $" + shown + "$ in scientific notation. What is the **power of ten**?",
              answer: e,
              near: [{ v: -e, fb: e > 0 ? "The number is bigger than 10, so the exponent is positive." : "The number is smaller than 1, so the exponent is negative." }],
              hints: ["First move the point so the front is between 1 and 10: $" + num(digits) + "$.",
                      "Count the places it moved" + (e < 0 ? " — to the right, so the exponent is negative." : ".")],
              why: "$" + shown + " = " + num(digits) + " \\times 10^{" + e + "}$." };
          }
          var d2 = R.int(101, 999) / 100, e2 = R.int(2, 6);
          var val = Math.round(d2 * Math.pow(10, e2) * 100) / 100;
          return { type: "num", prompt: "Write $" + num(d2) + " \\times 10^{" + e2 + "}$ as an ordinary number.", answer: val,
            near: [{ v: d2 + e2, fb: "The power of ten multiplies, it isn't added on." }],
            hints: ["Move the decimal point " + e2 + " places to the right, filling with zeros."],
            why: "$" + num(d2) + " \\times 10^{" + e2 + "} = " + val.toLocaleString("en-US") + "$." };
        } },
      { id: "g8-sciarith", title: "Arithmetic in scientific notation", lesson: 10,
        gen: function (R) {
          var a = R.int(2, 9), b = R.int(2, 9), p = R.int(-6, 8), q = R.int(-6, 8);
          if (R.chance(0.5)) {
            var prod = a * b, carry = prod >= 10 ? 1 : 0, front = prod / Math.pow(10, carry);
            return { type: "num", prompt: "$(" + a + " \\times 10^{" + p + "})(" + b + " \\times 10^{" + q + "}) = " + num(front) + " \\times 10^{\\square}$. What is the exponent?",
              answer: p + q + carry,
              near: carry ? [{ v: p + q, fb: "$" + a + " \\times " + b + " = " + prod + "$, which is $" + num(front) + " \\times 10^1$ — that extra ten goes into the exponent." }] : [],
              hints: ["Multiply the fronts: $" + a + " \\times " + b + " = " + prod + "$.",
                      "Add the exponents: $" + p + " + (" + q + ")$." + (carry ? " Then tidy $" + prod + "$ into $" + num(front) + " \\times 10^1$." : "")],
              why: "$" + prod + " \\times 10^{" + (p + q) + "} = " + num(front) + " \\times 10^{" + (p + q + carry) + "}$." };
          }
          var big = a * b, e3 = R.int(-4, 9), e4 = R.int(-6, 4);
          return { type: "num", prompt: "$\\frac{" + big + " \\times 10^{" + e3 + "}}{" + a + " \\times 10^{" + e4 + "}} = " + b + " \\times 10^{\\square}$. What is the exponent?",
            answer: e3 - e4,
            near: [{ v: e3 + e4, fb: "Dividing subtracts the exponents: $" + e3 + " - (" + e4 + ")$." }],
            hints: ["$" + big + " \\div " + a + " = " + b + "$.", "Subtract the exponents: $" + e3 + " - (" + e4 + ")$."],
            why: "$" + e3 + " - (" + e4 + ") = " + (e3 - e4) + "$." };
        } }
    ]
  });
})();
