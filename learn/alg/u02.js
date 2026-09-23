/* ==========================================================================
   Algebra I — Unit 2: Solving equations & inequalities. See lab/core.js.

   Written the way Unit 1 is, for someone who has just met algebra. Every
   lesson builds one idea at a time, in the same order:

     1. say it in plain words, with something you can see (a balance that
        tips, a number line, pencils on a desk)
     2. show it worked through, one line at a time, each line with its
        reason (the "walk" scene)
     3. ask for the same thing with only the numbers changed
     4. then a step harder

   Every new word — equation, solution, inequality, compound — is explained
   the first time it is used, and the mistakes this unit is known for are met
   head on rather than waited for: combining like terms across the equals
   sign, mixing up no solution with every number, forgetting to flip an
   inequality when both sides are multiplied by a negative, and reading AND
   as OR.

   Six lessons, ten skills, two quizzes, and the unit test at the end.
   Standards: 8.EE.C.7, 8.EE.C.7.a, 8.EE.C.7.b, HSA.CED.A.1, HSA.REI.A.1,
   HSA.REI.B.3.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, signed = L.signed;

  // A worked calculation, one line per step.
  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }

  L.unit("alg", 2, {
    title: "Solving equations & inequalities",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "x on both sides",
        blurb: "Whatever you do to one side, do to the other — and the balance stays level.",
        mins: 10,
        v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "An **equation** says two things are worth the same. This balance is level, so the left side and the right side weigh the same: a blue $x$ block weighs the same as the letter $x$ stands for, a yellow block weighs $1$. <br><br>Take the **same** off both sides and it stays level. Keep going until one $x$ block is alone.",
            scene: { type: "balance", L: { x: 3, c: 2 }, R: { x: 1, c: 8 }, x: 3, gate: "solve" },
            gate: true,
            then: "One $x$ balances three $1$s, so $x = 3$. Every move you made was the same on both sides — that is the whole rule for solving an equation." },
          { type: "learn", kicker: "Watch",
            prompt: "Here is that balance written down. The equation is $3x + 2 = x + 8$.",
            scene: { type: "walk", rows: [
              { m: "3x + 2 = x + 8", say: "The two sides are worth the same." },
              { m: "2x + 2 = 8", say: "Take one $x$ from **both** sides. Left: $3x - x = 2x$. Right: the $x$ is gone." },
              { m: "2x = 6", say: "Take $2$ from both sides." },
              { m: "x = 3", say: "Split both sides into 2 equal groups (divide by 2)." },
              { m: "3(3) + 2 = 11 \\;\\text{ and }\\; 3 + 8 = 11", say: "Check it: put $3$ back in. Both sides give $11$, so $x = 3$ is right." }] },
            gate: true,
            then: "The number that makes the equation true is called the **solution**. Checking it costs ten seconds and catches nearly every mistake." },
          { type: "num", prompt: "Your turn. Solve $5x = 2x + 12$.", pre: "$x =$", answer: 4, skill: "Variables on both sides",
            near: [{ v: 12, fb: "$12$ is on the right by itself, but there is still a $2x$ with it. Take $2x$ from both sides first." },
                   { v: 7, fb: "Take $2x$ from both sides: $5x - 2x = 3x$, so $3x = 12$." }],
            hints: ["Take $2x$ from both sides.", "That leaves $3x = 12$. Now divide both sides by 3."],
            why: lines(["5x = 2x + 12", "3x = 12", "x = 4"]) },
          { type: "num", prompt: "Solve $4x + 1 = 2x + 9$.", pre: "$x =$", answer: 4, skill: "Variables on both sides",
            near: [{ v: 5, fb: "Take $2x$ from both sides and $1$ from both sides: $2x = 8$." },
                   { v: 2, fb: "$4x - 2x = 2x$ and $9 - 1 = 8$, so $2x = 8$." }],
            hints: ["Take $2x$ from both sides: $2x + 1 = 9$.", "Take 1 from both sides, then divide by 2."],
            why: lines(["4x + 1 = 2x + 9", "2x + 1 = 9", "2x = 8", "x = 4"]) },
          { type: "learn", kicker: "Which side?",
            prompt: "You can gather the $x$'s on **either** side. It is usually tidier to gather them where there are more of them, so the number in front stays positive. Here the right side has more.",
            scene: { type: "walk", rows: [
              { m: "2x + 9 = 6x + 1", say: "More $x$'s on the right, so move the left ones over." },
              { m: "9 = 4x + 1", say: "Take $2x$ from both sides." },
              { m: "8 = 4x", say: "Take $1$ from both sides." },
              { m: "2 = x", say: "Divide both sides by 4. Written the usual way round: $x = 2$." }] },
            gate: true },
          { type: "num", prompt: "Solve $3x + 14 = 7x + 2$.", pre: "$x =$", answer: 3, skill: "Variables on both sides",
            hints: ["The right side has more $x$'s: take $3x$ from both sides.", "That leaves $14 = 4x + 2$. Take 2 from both, then divide by 4."],
            why: lines(["3x + 14 = 7x + 2", "14 = 4x + 2", "12 = 4x", "3 = x"]) },
          { type: "choice", prompt: "Jo starts with $3 + 4x = 5 - 2x$ and writes $8 + 2x$ on the next line. What went wrong?", skill: "Variables on both sides",
            options: [{ t: "Terms on opposite sides of the $=$ can't be added together" },
                      { t: "Nothing — $3 + 5 = 8$ and $4x - 2x = 2x$", fb: "Those terms are on opposite sides of the $=$. Adding across the equals sign changes what the equation says." },
                      { t: "The $2x$ should have stayed negative", fb: "The sign isn't the problem: the two sides can't be added together at all." }],
            answer: 0,
            hints: ["Combining like terms happens **within** one side. Crossing the $=$ is a different move: doing the same thing to both sides."],
            why: "Add $2x$ to both sides instead: $3 + 6x = 5$, then $6x = 2$, so $x = \\frac{1}{3}$." },
          { type: "num", prompt: "Now with negatives. Solve $7 - 2x = 3x - 8$.", pre: "$x =$", answer: 3, skill: "Variables on both sides",
            near: [{ v: -3, fb: "Add $2x$ to both sides (not take away): $7 = 5x - 8$." },
                   { v: 1, fb: "$7 + 8 = 15$ and $15 \\div 5 = 3$." }],
            hints: ["Add $2x$ to both sides, so the $x$'s are all on the right: $7 = 5x - 8$.", "Add 8 to both sides: $15 = 5x$."],
            why: lines(["7 - 2x = 3x - 8", "7 = 5x - 8", "15 = 5x", "3 = x"]) },
          { type: "choice", prompt: "Which value is the solution of $6x - 5 = 4x + 7$? (Check by putting it in.)", skill: "Variables on both sides",
            options: [{ t: "$x = 6$" }, { t: "$x = 1$", fb: "Put $1$ in: the left is $1$, the right is $11$. Not equal." },
                      { t: "$x = 2$", fb: "Put $2$ in: the left is $7$, the right is $15$. Not equal." }],
            answer: 0,
            hints: ["Take $4x$ from both sides, then add 5 to both sides."],
            why: lines(["6x - 5 = 4x + 7", "2x - 5 = 7", "2x = 12", "x = 6"]) }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Brackets in an equation",
        blurb: "Multiply out first, then solve as usual — fractions and decimals included.",
        mins: 10,
        v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "When an equation has brackets, multiply them out first — the distributive property from Unit 1 — and then it is an equation like any other. Picture the bracket as a rectangle: the number outside is the height, and the terms inside are the width.",
            scene: { type: "tiles", mode: "area", rows: ["2"], cols: ["x", "3"], cw: [150, 80], rh: [100], cells: [["2x", "6"]], readout: "2(x + 3) = 2x + 6" },
            gate: true,
            then: "The total area is the sum of the two parts. Multiplying the number outside by every term inside is just finding the area of this rectangle." },
          { type: "learn", kicker: "Watch",
            scene: { type: "walk", rows: [
              { m: "2(x + 3) = 14", say: "The 2 multiplies everything inside the bracket." },
              { m: "2x + 6 = 14", say: "$2 \\times x = 2x$ and $2 \\times 3 = 6$." },
              { m: "2x = 8", say: "Take 6 from both sides." },
              { m: "x = 4", say: "Divide both sides by 2. Check: $2(4 + 3) = 2 \\times 7 = 14$." }] },
            gate: true },
          { type: "num", prompt: "Your turn. Solve $3(x - 2) = 12$.", pre: "$x =$", answer: 6, skill: "Equations with brackets",
            near: [{ v: 4, fb: "Multiply out first: $3x - 6 = 12$, so $3x = 18$." },
                   { v: 2, fb: "$3 \\times (-2) = -6$, so add 6 to both sides: $3x = 18$." }],
            hints: ["Multiply out: $3 \\times x = 3x$ and $3 \\times (-2) = -6$.", "$3x - 6 = 12$. Add 6 to both sides, then divide by 3."],
            why: lines(["3(x - 2) = 12", "3x - 6 = 12", "3x = 18", "x = 6"]) },
          { type: "learn", kicker: "A minus outside",
            prompt: "A negative number outside the bracket multiplies every term inside, sign and all.",
            scene: { type: "walk", rows: [
              { m: "5 - 2(x + 1) = 9", say: "The $-2$ multiplies both things in the bracket." },
              { m: "5 - 2x - 2 = 9", say: "$-2 \\times x = -2x$ and $-2 \\times 1 = -2$." },
              { m: "3 - 2x = 9", say: "Tidy the left: $5 - 2 = 3$." },
              { m: "-2x = 6", say: "Take 3 from both sides." },
              { m: "x = -3", say: "Divide both sides by $-2$. Check: $5 - 2(-3 + 1) = 5 - 2(-2) = 9$." }] },
            gate: true },
          { type: "num", prompt: "Solve $4 - 3(x - 2) = 16$.", pre: "$x =$", answer: -2, skill: "Equations with brackets",
            near: [{ v: 2, fb: "$-3 \\times (-2) = +6$, so the left is $4 + 6 - 3x = 10 - 3x$." },
                   { v: -6, fb: "After $10 - 3x = 16$, take 10 from both sides: $-3x = 6$." }],
            hints: ["Multiply out: $-3 \\times x = -3x$ and $-3 \\times (-2) = +6$.", "That gives $10 - 3x = 16$. Take 10 from both sides."],
            why: lines(["4 - 3(x - 2) = 16", "4 - 3x + 6 = 16", "10 - 3x = 16", "-3x = 6", "x = -2"]) },
          { type: "learn", kicker: "Brackets on both sides",
            prompt: "If both sides have brackets, multiply out both, then gather the $x$'s as you did in Lesson 1.",
            scene: { type: "walk", rows: [
              { m: "3(x + 2) = 2(x + 5)", say: "Two brackets, one on each side." },
              { m: "3x + 6 = 2x + 10", say: "Multiply out each side on its own." },
              { m: "x + 6 = 10", say: "Take $2x$ from both sides." },
              { m: "x = 4", say: "Take 6 from both sides. Check: $3(6) = 18$ and $2(9) = 18$." }] },
            gate: true },
          { type: "num", prompt: "Solve $4(x - 1) = 2(x + 3)$.", pre: "$x =$", answer: 5, skill: "Equations with brackets",
            hints: ["Multiply out both sides: $4x - 4 = 2x + 6$.", "Take $2x$ from both sides, then add 4."],
            why: lines(["4(x - 1) = 2(x + 3)", "4x - 4 = 2x + 6", "2x - 4 = 6", "2x = 10", "x = 5"]) },
          { type: "learn", kicker: "Fractions and decimals",
            prompt: "A fraction in front of $x$ is nothing new: undo it by multiplying both sides.",
            scene: { type: "walk", rows: [
              { m: "\\frac{1}{2}x + 3 = 7", say: "$\\frac{1}{2}x$ means half of $x$." },
              { m: "\\frac{1}{2}x = 4", say: "Take 3 from both sides." },
              { m: "x = 8", say: "Half of $x$ is 4, so $x$ is 8 — multiply both sides by 2." }] },
            gate: true },
          { type: "num", prompt: "Solve $\\frac{1}{3}x - 2 = 4$.", pre: "$x =$", answer: 18, skill: "Fractions and decimals",
            near: [{ v: 2, fb: "$\\frac{1}{3}x = 6$ means a third of $x$ is 6. Multiply both sides by 3." },
                   { v: 6, fb: "That's $\\frac{1}{3}x$. Multiply both sides by 3 to get $x$." }],
            hints: ["Add 2 to both sides: $\\frac{1}{3}x = 6$.", "A third of $x$ is 6, so multiply both sides by 3."],
            why: lines(["\\frac{1}{3}x - 2 = 4", "\\frac{1}{3}x = 6", "x = 18"]) },
          { type: "num", prompt: "Solve $0.2x + 1 = 3$.", pre: "$x =$", answer: 10, skill: "Fractions and decimals",
            near: [{ v: 2, fb: "$0.2x = 2$ means $0.2 \\times x = 2$. Divide both sides by $0.2$." }],
            hints: ["Take 1 from both sides: $0.2x = 2$.", "Divide both sides by $0.2$ — the same as multiplying by 5."],
            why: lines(["0.2x + 1 = 3", "0.2x = 2", "x = 10"]) },
          { type: "choice", prompt: "Ana has $2x + 6 = 14$ and writes $2x = 8$ next. What did she do?", skill: "Reasoning with equations",
            options: [{ t: "Took 6 from both sides" }, { t: "Divided both sides by 2", fb: "Dividing by 2 would give $x + 3 = 7$." },
                      { t: "Took 6 from the left only", fb: "Then the sides would no longer be equal. The right went from 14 to 8, so 6 left it too." }],
            answer: 0,
            why: "Each step in solving is the same move on both sides, which is why the two sides stay equal." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "None, one, or every number",
        blurb: "Some equations have one solution, some have none, and some are true for every number.",
        mins: 9,
        v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Every equation you have solved so far had exactly **one** solution. Not all of them do. Watch what happens with this one.",
            scene: { type: "walk", rows: [
              { m: "2(x + 5) = 2x - 3", say: "Multiply out the bracket." },
              { m: "2x + 10 = 2x - 3", say: "Both sides have exactly $2x$." },
              { m: "10 = -3", say: "Take $2x$ from both sides. The $x$ is gone — and what is left is false." },
              { say: "$10 = -3$ is never true, so **no number** works. The equation has **no solution**." }] },
            gate: true,
            then: "It makes sense: both sides hold the same $2x$, so the left is always 13 more than the right. They can never be equal." },
          { type: "learn", kicker: "Try it",
            prompt: "Use the slider to put numbers into $2(x + 5) = 2x - 3$. Notice that no matter what $x$ is, the two sides never agree. This is why it has **no solution**.",
            scene: { type: "tester", a: "2*(x + 5)", aTex: "2(x + 5)", b: "2*x - 3", x: { v: 1, min: -10, max: 10, step: 1 }, goal: "differ" },
            gate: true },
          { type: "learn", kicker: "And this one",
            prompt: "Now the other surprise.",
            scene: { type: "walk", rows: [
              { m: "4x - 7 + 2x = 6x - 7", say: "Tidy the left first: $4x + 2x = 6x$." },
              { m: "6x - 7 = 6x - 7", say: "The two sides are identical." },
              { m: "-7 = -7", say: "Take $6x$ from both sides. What is left is true, whatever $x$ was." },
              { say: "Every number works. The equation has **infinitely many solutions**." }] },
            gate: true,
            then: "So: the $x$ vanishing is not an error. If what remains is **false**, nothing works; if it is **true**, everything works." },
          { type: "learn", kicker: "Try it",
            prompt: "Use the slider to put numbers into $4x - 7 + 2x = 6x - 7$. Notice that they always agree, whatever $x$ is. This is why it has **infinitely many solutions**.",
            scene: { type: "tester", a: "4*x - 7 + 2*x", aTex: "4x - 7 + 2x", b: "6*x - 7", x: { v: 1, min: -10, max: 10, step: 1 }, goal: "agree3" },
            gate: true },
          { type: "choice", prompt: "You solve an equation and end with $5 = 5$. How many solutions does it have?", skill: "Number of solutions",
            options: [{ t: "Infinitely many — every number works" },
                      { t: "None", fb: "$5 = 5$ is true. A true statement means every number works." },
                      { t: "One: $x = 5$", fb: "There is no $x$ left in $5 = 5$, so it says nothing about a particular number." }],
            answer: 0, why: "A true statement with no $x$ left means every value of $x$ makes the equation true." },
          { type: "choice", prompt: "You solve a different equation and end with $3 = 8$. How many solutions?", skill: "Number of solutions",
            options: [{ t: "None — no number works" },
                      { t: "Infinitely many", fb: "$3 = 8$ is false. A false statement means no number works." },
                      { t: "One", fb: "There is no $x$ left to solve for, and what remains is false." }],
            answer: 0, why: "A false statement with no $x$ left means nothing can make the equation true." },
          { type: "num", prompt: "This one does have a solution. Solve $-3(y + 4) = 2y - 2$.", pre: "$y =$", answer: -2, skill: "Number of solutions",
            near: [{ v: 2, fb: "$-3 \\times 4 = -12$, so the left is $-3y - 12$." },
                   { v: -10, fb: "After $-12 = 5y - 2$, add 2 to both sides: $-10 = 5y$." }],
            hints: ["Multiply out: $-3y - 12 = 2y - 2$.", "Add $3y$ to both sides: $-12 = 5y - 2$."],
            why: lines(["-3(y + 4) = 2y - 2", "-3y - 12 = 2y - 2", "-12 = 5y - 2", "-10 = 5y", "-2 = y"]) },
          { type: "multi", prompt: "Which of these have **no** solution? Pick every one.", skill: "Number of solutions",
            options: [{ t: "$4x + 1 = 4x + 9$", ok: true },
                      { t: "$2(x + 3) = 2x + 1$", ok: true },
                      { t: "$5x + 2 = 3x + 2$", ok: false, fb: "Different numbers of $x$, so there is one solution: $x = 0$." },
                      { t: "$x + 7 = 7 + x$", ok: false, fb: "The two sides are identical, so every number works." }],
            hints: ["Multiply out any brackets, then compare the two sides.", "Same number of $x$'s on both sides but different plain numbers means no solution."],
            why: "$4x + 1 = 4x + 9$ becomes $1 = 9$, and $2(x + 3) = 2x + 1$ becomes $6 = 1$. Both are false." },
          { type: "learn", kicker: "The pattern",
            prompt: "Once both sides are tidied into $ax + b = cx + d$, you can tell without finishing:",
            scene: { type: "walk", rows: [
              { m: "a \\ne c", say: "**One solution.** Different numbers of $x$, so the two sides cross at exactly one value." },
              { m: "a = c,\\; b \\ne d", say: "**No solution.** The same $x$ part but different numbers: the sides stay a fixed distance apart." },
              { m: "a = c,\\; b = d", say: "**Every number.** The two sides are the same expression written twice." }] },
            gate: true },
          { type: "choice", prompt: "Fill the blank so that $6x + 5 = \\square x + 5$ has **infinitely many** solutions.", skill: "Number of solutions",
            options: [{ t: "$6$" }, { t: "$5$", fb: "Then it's $6x + 5 = 5x + 5$, which has one solution, $x = 0$." },
                      { t: "$0$", fb: "Then it's $6x + 5 = 5$, which has one solution, $x = 0$." }],
            answer: 0,
            hints: ["For every number to work, the two sides have to be identical."],
            why: "$6x + 5 = 6x + 5$ is true whatever $x$ is." },
          { type: "choice", prompt: "Now fill it so that $6x + 5 = 6x + \\square$ has **no** solution.", skill: "Number of solutions",
            options: [{ t: "$2$" }, { t: "$5$", fb: "That makes both sides identical, so every number works." },
                      { t: "There is no such number", fb: "Any number except 5 works — for example 2 gives $5 = 2$, which is false." }],
            answer: 0,
            why: "With the same $6x$ on both sides, any number other than 5 makes it impossible." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Letters instead of numbers",
        blurb: "Tidying a formula is the same moves — the answer just keeps its letters.",
        mins: 8,
        v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A rectangle's perimeter is $P = 2l + 2w$. If you know the perimeter and the length, what is the width? You can tidy the formula once and use it forever. The moves are the ones you already know.",
            scene: { type: "walk", rows: [
              { m: "P = 2l + 2w", say: "Get $w$ on its own. Everything else is just a number wearing a letter." },
              { m: "P - 2l = 2w", say: "Take $2l$ from both sides." },
              { m: "\\frac{P - 2l}{2} = w", say: "Divide both sides by 2 — the whole left side, so it goes over the bar." }] },
            gate: true,
            then: "The answer still has letters in it, and that is finished. You were tidying, not finding a number." },
          { type: "learn", kicker: "Feel it",
            prompt: "Let's fix the perimeter at $P = 20$. Slide the length $l$ and watch what happens to the width $w$. Notice how they always balance to keep the perimeter at 20.",
            scene: { type: "tester", a: "20 - 2*x", aTex: "w = \\frac{20 - 2l}{2}", b: "20 - 2*x", x: { v: 4, min: 1, max: 9, step: 1 }, goal: "agree3" },
            gate: true,
            then: "As $l$ gets bigger, $w$ must get smaller to keep the total at 20. That relationship is exactly what the formula $\\frac{P - 2l}{2} = w$ describes." },
          { type: "expr", prompt: "Your turn. Distance is $d = rt$ (rate times time). Solve for $t$.", pre: "$t =$", answer: "d/r", skill: "Letters for coefficients",
            keys: [["$d$", "d"], ["$r$", "r"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]],
            placeholder: "e.g. d/r",
            near: [{ v: "r/d", fb: "Divide both sides by $r$, not the other way round: $\\frac{d}{r} = t$." }],
            hints: ["$rt$ means $r \\times t$. Divide both sides by $r$."],
            why: "$d = rt$, so $\\frac{d}{r} = t$." },
          { type: "expr", prompt: "Solve $y = mx + b$ for $x$.", pre: "$x =$", answer: "(y - b)/m", skill: "Letters for coefficients",
            keys: [["$y$", "y"], ["$m$", "m"], ["$b$", "b"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]],
            placeholder: "e.g. (y - b)/m",
            near: [{ v: "y/m - b", fb: "The whole of $y - b$ is divided by $m$, so keep it together: $\\frac{y - b}{m}$." }],
            hints: ["Take $b$ from both sides: $y - b = mx$.", "Divide both sides by $m$. The whole left side goes over the bar."],
            why: lines(["y = mx + b", "y - b = mx", "\\frac{y - b}{m} = x"]) },
          { type: "learn", kicker: "Watch",
            prompt: "The same when the letters are in front of $x$. Solve $ax + b = c$ for $x$.",
            scene: { type: "walk", rows: [
              { m: "ax + b = c", say: "$a$, $b$ and $c$ stand for numbers you have not been told." },
              { m: "ax = c - b", say: "Take $b$ from both sides." },
              { m: "x = \\frac{c - b}{a}", say: "Divide both sides by $a$ — whatever number $a$ is." }] },
            gate: true },
          { type: "expr", prompt: "Solve $px - q = r$ for $x$.", pre: "$x =$", answer: "(r + q)/p", skill: "Letters for coefficients",
            keys: [["$p$", "p"], ["$q$", "q"], ["$r$", "r"], ["$-$", "-"], ["$+$", "+"], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]],
            placeholder: "e.g. (r + q)/p",
            near: [{ v: "(r - q)/p", fb: "The $q$ is being taken away, so undo it by **adding** $q$ to both sides." }],
            hints: ["Add $q$ to both sides: $px = r + q$.", "Divide both sides by $p$."],
            why: lines(["px - q = r", "px = r + q", "x = \\frac{r + q}{p})"]) },
          { type: "expr", prompt: "One with a bracket. Solve $k(x + n) = m$ for $x$.", pre: "$x =$", answer: "m/k - n", skill: "Letters for coefficients",
            keys: [["$k$", "k"], ["$m$", "m"], ["$n$", "n"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]],
            placeholder: "e.g. m/k - n",
            near: [{ v: "(m - n)/k", fb: "Divide by $k$ first: $x + n = \\frac{m}{k}$, then take $n$ away." }],
            hints: ["Divide both sides by $k$ first: $x + n = \\frac{m}{k}$.", "Then take $n$ from both sides."],
            why: lines(["k(x + n) = m", "x + n = \\frac{m}{k}", "x = \\frac{m}{k} - n"]) },
          { type: "choice", prompt: "Why is $\\frac{C}{2\\pi} = r$ a finished answer for the circumference formula $C = 2\\pi r$?", skill: "Letters for coefficients",
            options: [{ t: "$r$ is alone on one side, so the formula now gives $r$ from any $C$" },
                      { t: "It isn't — there are still letters in it", fb: "Letters in the answer are fine. $C$ and $\\pi$ are whatever you're given; $r$ is on its own, which is what was asked." },
                      { t: "It isn't — you can't divide by a letter", fb: "You can divide by any letter that isn't zero, exactly as you would divide by a number." }],
            answer: 0,
            why: "Solving for a letter means getting that letter alone, not getting a number." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Inequalities",
        blurb: "A range of answers instead of one — and the one rule that catches everybody.",
        mins: 10,
        v: 1,
        steps: [
          { type: "learn", kicker: "New word",
            prompt: "An **inequality** says one side is bigger or smaller, not equal. Its answer is a whole range of numbers, so it is drawn on a number line. Drag the circle and the arrow to see what $x > 3$ looks like.",
            scene: { type: "numberline", min: -8, max: 8, ray: { at: 3, dir: "right", closed: false }, gate: true },
            gate: true,
            then: "The arrow covers every number to the right of 3. The circle is **open** ($>$) because 3 itself is not included. A filled circle means $\\ge$ — “or equal to” — so the end **is** included." },
          { type: "numberline", prompt: "Show $x \\le -1$: put the circle at $-1$, fill it, and point the arrow left.", skill: "Inequalities on a line",
            min: -8, max: 8, ray: { at: 0, dir: "right", closed: false, drag: true }, mode: "ray",
            answer: { at: -1, dir: "left", closed: true },
            hints: ["“Less than or equal to” points left from $-1$.", "“Or equal to” means the circle is filled in."],
            why: "$x \\le -1$ is every number from $-1$ leftwards, with $-1$ included." },
          { type: "learn", kicker: "Watch",
            prompt: "Solving an inequality is exactly like solving an equation. Do the same to both sides until $x$ is alone.",
            scene: { type: "walk", rows: [
              { m: "3x + 4 < 19", say: "Same moves as an equation." },
              { m: "3x < 15", say: "Take 4 from both sides." },
              { m: "x < 5", say: "Divide both sides by 3." },
              { say: "Every number below 5 works. Check one: $x = 0$ gives $4 < 19$ ✓. And $x = 5$ gives $19 < 19$ ✗, so 5 itself is out." }] },
            gate: true },
          { type: "ineq", prompt: "Your turn. Solve $2x + 5 \\le 17$.", answer: "x <= 6", skill: "Multi-step inequalities",
            near: [{ v: "x >= 6", fb: "Nothing was multiplied by a negative here, so the sign stays the way it was: $\\le$." },
                   { v: "x <= 11", fb: "After taking 5 from both sides you have $2x \\le 12$. Now divide by 2." }],
            hints: ["Take 5 from both sides: $2x \\le 12$.", "Divide both sides by 2. The sign does not change."],
            why: lines(["2x + 5 \\le 17", "2x \\le 12", "x \\le 6"]) },
          { type: "learn", kicker: "The one rule",
            prompt: "Here is the rule everybody forgets. Watch what multiplying by a negative does to a true statement.",
            scene: { type: "tester", a: "x", aTex: "x", b: "10", bTex: "10", x: { v: 4, min: -10, max: 10, step: 1 }, goal: "differ" },
            gate: true,
            then: "Wait — $4$ was smaller than $10$, but $-4$ is actually **bigger** than $-10$. Multiplying by a negative flips the whole world upside down. So: multiply or divide by a **negative**, and $<$ becomes $>$ (and $\\le$ becomes $\\ge$). Adding and subtracting never flip it." },
          { type: "ineq", prompt: "Solve $-2x > 6$.", answer: "x < -3", skill: "Multiplying by a negative",
            near: [{ v: "x > -3", fb: "Dividing both sides by $-2$ flips the sign: $x < -3$." },
                   { v: "x < 3", fb: "$6 \\div (-2) = -3$, not 3." }],
            hints: ["Divide both sides by $-2$ — and flip the sign as you do.", "$6 \\div (-2) = -3$."],
            why: lines(["-2x > 6", "x < -3 \\;\\text{(divided by a negative, so the sign flipped)}"]) },
          { type: "ineq", prompt: "Solve $8 - 3x \\ge 20$.", answer: "x <= -4", skill: "Multiplying by a negative",
            near: [{ v: "x >= -4", fb: "The last step divides by $-3$, so the sign flips to $\\le$." }],
            hints: ["Take 8 from both sides: $-3x \\ge 12$.", "Divide by $-3$ and flip: $x \\le -4$."],
            why: lines(["8 - 3x \\ge 20", "-3x \\ge 12", "x \\le -4"]) },
          { type: "ineq", prompt: "With $x$ on both sides: solve $5x - 3 > 2x + 9$.", answer: "x > 4", skill: "Multi-step inequalities",
            hints: ["Take $2x$ from both sides: $3x - 3 > 9$.", "Add 3 to both sides, then divide by 3. Dividing by a **positive** number keeps the sign."],
            why: lines(["5x - 3 > 2x + 9", "3x - 3 > 9", "3x > 12", "x > 4"]) },
          { type: "ineq", prompt: "A taxi costs \\$3 to get in plus \\$2 a mile, and you have \\$20. Write and solve an inequality for the number of miles $m$ you can afford.", answer: "m <= 8.5", variable: "m", skill: "Inequalities from words",
            keys: [["$m$", "m"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="], ["$-$", "-"]],
            placeholder: "m <= …",
            near: [{ v: "m < 8.5", fb: "Spending exactly \\$20 is allowed, so $8.5$ miles is still affordable: $\\le$." },
                   { v: "m <= 10", fb: "Don't forget the \\$3 to get in: $3 + 2m \\le 20$." }],
            hints: ["The cost is $3 + 2m$, and it has to be at most 20: $3 + 2m \\le 20$.", "Take 3 from both sides: $2m \\le 17$."],
            why: lines(["3 + 2m \\le 20", "2m \\le 17", "m \\le 8.5"]) },
          { type: "num", prompt: "Same taxi. What is the greatest **whole** number of miles you can afford?", pre: "$m =$", answer: 8, skill: "Inequalities from words",
            near: [{ v: 9, fb: "9 miles would cost $3 + 18 = \\$21$, which is more than \\$20." }],
            hints: ["You can afford $8.5$ miles, and miles here are whole."],
            why: "8 miles costs $3 + 16 = \\$19$; 9 would cost \\$21." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Two inequalities at once",
        blurb: "And means both; or means either. The number line shows the difference.",
        mins: 9,
        v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Ask a friend for “a red **or** a blue pencil” and either one will do. Ask for “a red **and** a blue pencil” and you want both. <br><br>Two inequalities joined this way make a **compound inequality**, and the joining word decides the answer. Here is $x > -1$ **and** $x < 3$: only the numbers that satisfy **both**.",
            scene: { type: "numberline", min: -8, max: 8, seg: { a: -1, b: 3, ca: false, cb: false }, gate: true },
            gate: true,
            then: "The shaded piece between $-1$ and $3$ is the answer, written $-1 < x < 3$. With **or**, you would shade both arrows instead, and a number in either one would do." },
          { type: "choice", prompt: "Is $4$ a solution of “$x < 3$ **or** $x \\ge 5$”?", skill: "Compound inequalities",
            options: [{ t: "No — it fails both" },
                      { t: "Yes — “or” means anything goes", fb: "“Or” still needs one of the two to be true. $4 < 3$ is false, and $4 \\ge 5$ is false." }],
            answer: 0, why: "With **or**, a number needs at least one of the two to be true. 4 satisfies neither." },
          { type: "choice", prompt: "Is $0$ a solution of “$x > -1$ **and** $x < 6$”?", skill: "Compound inequalities",
            options: [{ t: "Yes — it satisfies both" },
                      { t: "No — it has to be bigger than 6", fb: "Read it again: $x$ must be **less** than 6 and more than $-1$. Zero is both." }],
            answer: 0, why: "$0 > -1$ ✓ and $0 < 6$ ✓, so it satisfies both." },
          { type: "numberline", prompt: "Show “$x \\ge -2$ **and** $x < 4$”: shade from $-2$ (filled) to $4$ (open).", skill: "Compound inequalities",
            min: -8, max: 8, seg: { a: 0, b: 2, ca: false, cb: false }, mode: "seg",
            answer: { a: -2, b: 4, ca: true, cb: false },
            hints: ["The shaded piece runs between the two ends.", "“Or equal to” fills the circle; a plain $<$ leaves it open."],
            why: "Both conditions hold only between $-2$ and $4$, with $-2$ included: $-2 \\le x < 4$." },
          { type: "learn", kicker: "Watch",
            prompt: "Solving one is just solving each part. Here is an **and** written the short way, with $x$ in the middle.",
            scene: { type: "walk", rows: [
              { m: "-3 < 2x + 1 \\le 9", say: "It means $2x + 1 > -3$ **and** $2x + 1 \\le 9$." },
              { m: "-4 < 2x \\le 8", say: "Take 1 from all three parts." },
              { m: "-2 < x \\le 4", say: "Divide all three parts by 2." },
              { say: "So $x$ is between $-2$ and $4$, with $4$ included. Check $0$: $-3 < 1 \\le 9$ ✓." }] },
            gate: true },
          { type: "ineq", prompt: "Your turn. Solve $-5 < 3x + 1 < 7$.", answer: "-2 < x < 2", skill: "Compound inequalities",
            keys: [["$x$", "x"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="], ["$-$", "-"]],
            placeholder: "e.g. -2 < x < 5",
            near: [{ v: "-2 < x < 6", fb: "Divide **all three** parts by 3, the right one too: $6 \\div 3 = 2$." }],
            hints: ["Take 1 from all three parts: $-6 < 3x < 6$.", "Divide all three parts by 3."],
            why: lines(["-5 < 3x + 1 < 7", "-6 < 3x < 6", "-2 < x < 2"]) },
          { type: "learn", kicker: "Or",
            prompt: "An **or** is solved the same way, one piece at a time — but the answer is two separate stretches, not one.",
            scene: { type: "walk", rows: [
              { m: "2x + 1 > 7 \\;\\text{ or }\\; 3x < -6", say: "Solve each on its own." },
              { m: "2x > 6 \\;\\text{ or }\\; 3x < -6", say: "Take 1 from both sides of the first." },
              { m: "x > 3 \\;\\text{ or }\\; x < -2", say: "Divide each by its own number." },
              { say: "Anything above 3 works, and so does anything below $-2$. On a line that is two arrows pointing away from each other." }] },
            gate: true },
          { type: "numberline", prompt: "Show “$x \\le -2$ **or** $x > 3$”: drag the ends to $-2$ and $3$, fill the left circle and leave the right one open.", skill: "Compound inequalities",
            min: -8, max: 8, seg: { a: -1, b: 1, ca: false, cb: false, outside: true }, mode: "seg",
            answer: { a: -2, b: 3, ca: true, cb: false },
            hints: ["With **or**, the two arrows point away from each other and everything they cover counts.", "“Or equal to” fills that end's circle."],
            why: "Everything from $-2$ leftwards (including $-2$) and everything past 3." },
          { type: "choice", prompt: "How many numbers satisfy “$x < -1$ **and** $x > 3$”?", skill: "Compound inequalities",
            options: [{ t: "None — no number is both" },
                      { t: "Every number", fb: "That would be the **or** version. With **and**, a number has to be under $-1$ and over 3 at the same time." },
                      { t: "The numbers between $-1$ and $3$", fb: "Those are neither under $-1$ nor over 3." }],
            answer: 0,
            hints: ["Picture both arrows: they point away from each other and never overlap."],
            why: "The two stretches don't overlap, so nothing satisfies both." },
          { type: "choice", prompt: "And how many satisfy “$x \\ge -1$ **or** $x < 3$”?", skill: "Compound inequalities",
            options: [{ t: "Every number" },
                      { t: "Only the numbers between $-1$ and $3$", fb: "That's the **and** answer. With **or**, only one of the two has to be true." },
                      { t: "None", fb: "Try any number: $5$ satisfies the first, $-7$ satisfies the second." }],
            answer: 0,
            why: "Every number is either at least $-1$ or less than 3 — most are both, and none are neither." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Solving equations — variables on both sides, brackets, fractions and decimals.",
        skills: ["a2-both", "a2-both-rat", "a2-paren", "a2-paren-both"], per: 2 },
      { title: "Quiz 2", after: 4, blurb: "How many solutions an equation has, and rearranging a formula for one letter.",
        skills: ["a2-nsol", "a2-make", "a2-unknown"], per: 2 },
      { title: "Quiz 3", after: 6, blurb: "Multi-step and compound inequalities — and the sign-flip rule.",
        skills: ["a2-ineq", "a2-ineq-neg", "a2-compound"], per: 2 },
      { title: "Unit Test", after: 6, blurb: "Everything from Unit 2: variables on both sides, brackets, solutions, formulas and inequalities.",
        skills: ["a2-both", "a2-both-rat", "a2-paren", "a2-paren-both", "a2-nsol", "a2-make", "a2-unknown", "a2-ineq", "a2-ineq-neg", "a2-compound"], per: 3 }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a2-both", title: "Equations with variables on both sides", lesson: 1,
        gen: function (R) {
          var x = R.nz(-8, 9), a = R.nz(-6, 7), c = R.nz(-6, 7);
          while (a === c) c = R.nz(-6, 7);
          var b = R.int(-9, 9), d = (a - c) * x + b;
          var tex = poly([[a, "x"], [b, ""]], { keepZero: true }) + " = " + poly([[c, "x"], [d, ""]], { keepZero: true });
          return { type: "num", prompt: "Solve $" + tex + "$.", pre: "$x =$", answer: x,
            hints: ["Gather the $x$'s on one side: take $" + poly([[c, "x"]]) + "$ from both sides.",
                    "Then get the numbers on the other side, and divide by what is left in front of $x$."],
            why: lines([tex, poly([[a - c, "x"], [b, ""]], { keepZero: true }) + " = " + d,
                        poly([[a - c, "x"]]) + " = " + (d - b), "x = " + num(x)]) };
        } },
      { id: "a2-both-rat", title: "Both sides, with fractions & decimals", lesson: 2,
        gen: function (R) {
          if (R.chance(0.5)) {
            var d1 = R.pick([2, 3, 4, 5]), x = d1 * R.nz(-4, 5), b = R.int(-8, 9), c = R.nz(-4, 4);
            var right = x / d1 * 1 + b - c * x;                    // (1/d1)x + b = c x + right
            var tex = "\\frac{1}{" + d1 + "}x " + signed(b) + " = " + poly([[c, "x"], [right, ""]], { keepZero: true });
            return { type: "num", prompt: "Solve $" + tex + "$.", pre: "$x =$", answer: x,
              hints: ["Multiply **every** term on both sides by " + d1 + " to clear the fraction.",
                      "That gives $" + poly([[1, "x"], [b * d1, ""]], { keepZero: true }) + " = " + poly([[c * d1, "x"], [right * d1, ""]], { keepZero: true }) + "$."],
              why: "Multiply both sides by " + d1 + ", then gather the $x$'s: $x = " + num(x) + "$." };
          }
          var p = R.pick([0.2, 0.5, 1.5, 2.5]), q = R.pick([0.5, 1, 1.5, 2]), xv = R.int(-6, 8), k = R.int(-8, 9);
          while (Math.abs(p - q) < 1e-9) q = R.pick([0.5, 1, 1.5, 2]);
          var rhs = Math.round(((p - q) * xv + k) * 100) / 100;
          var tex2 = num(p) + "x " + signed(k) + " = " + num(q) + "x " + signed(rhs);
          return { type: "num", prompt: "Solve $" + tex2 + "$.", pre: "$x =$", answer: xv,
            hints: ["Take $" + num(q) + "x$ from both sides.", "Then take " + num(k) + " from both sides and divide."],
            why: "$" + num(p - q) + "x = " + num(rhs - k) + "$, so $x = " + num(xv) + "$." };
        } },
      { id: "a2-paren", title: "Equations with brackets", lesson: 2,
        gen: function (R) {
          var k = R.nz(-5, 6), a = R.nz(-6, 7), x = R.nz(-6, 8);
          var inside = poly([[1, "x"], [a, ""]], { keepZero: true });
          var rhs = k * (x + a);
          var tex = k + "(" + inside + ") = " + rhs;
          return { type: "num", prompt: "Solve $" + tex + "$.", pre: "$x =$", answer: x,
            near: [{ v: rhs - a, fb: "Multiply out first: $" + poly([[k, "x"], [k * a, ""]], { keepZero: true }) + " = " + rhs + "$." }],
            hints: ["Divide both sides by " + k + " first: $" + inside + " = " + num(rhs / k) + "$.",
                    "Or multiply out: $" + poly([[k, "x"], [k * a, ""]], { keepZero: true }) + " = " + rhs + "$."],
            why: lines([tex, poly([[k, "x"], [k * a, ""]], { keepZero: true }) + " = " + rhs,
                        poly([[k, "x"]]) + " = " + (rhs - k * a), "x = " + num(x)]) };
        } },
      { id: "a2-paren-both", title: "Brackets on both sides", lesson: 2,
        gen: function (R) {
          var x = R.nz(-6, 7), j = R.nz(-4, 5), k = R.nz(-4, 5);
          while (j === k) k = R.nz(-4, 5);
          var a = R.int(-6, 6), b = Math.round((j * (x + a) - k * x) / k * 100) / 100;
          while (b % 1 !== 0) { a++; b = (j * (x + a) - k * x) / k; }
          var tex = j + "(" + poly([[1, "x"], [a, ""]], { keepZero: true }) + ") = " + k + "(" + poly([[1, "x"], [b, ""]], { keepZero: true }) + ")";
          return { type: "num", prompt: "Solve $" + tex + "$.", pre: "$x =$", answer: x,
            hints: ["Multiply out each side on its own: $" + poly([[j, "x"], [j * a, ""]], { keepZero: true }) + " = " + poly([[k, "x"], [k * b, ""]], { keepZero: true }) + "$.",
                    "Then gather the $x$'s on one side and the numbers on the other."],
            why: lines([tex, poly([[j, "x"], [j * a, ""]], { keepZero: true }) + " = " + poly([[k, "x"], [k * b, ""]], { keepZero: true }),
                        poly([[j - k, "x"]]) + " = " + (k * b - j * a), "x = " + num(x)]) };
        } },
      { id: "a2-nsol", title: "How many solutions", lesson: 3,
        gen: function (R) {
          var kind = R.int(0, 2), a = R.nz(-5, 6), b = R.int(-9, 9), c, d, tex;
          if (kind === 0) { c = R.nz(-5, 6); while (c === a) c = R.nz(-5, 6); d = R.int(-9, 9); }
          else if (kind === 1) { c = a; d = b + R.nz(-6, 6); }
          else { c = a; d = b; }
          tex = poly([[a, "x"], [b, ""]], { keepZero: true }) + " = " + poly([[c, "x"], [d, ""]], { keepZero: true });
          var right = kind === 0 ? "Exactly one solution" : kind === 1 ? "No solutions" : "Infinitely many solutions";
          return mc(R, { prompt: "How many solutions does $" + tex + "$ have?",
            right: right,
            wrong: [{ t: "Exactly one solution", fb: "Both sides have the same $" + poly([[a, "x"]]) + "$, so no single value of $x$ is picked out." },
                    { t: "No solutions", fb: kind === 0 ? "The two sides have different numbers of $x$, so they meet at one value." : "Take $" + poly([[a, "x"]]) + "$ from both sides: what is left is true, so every number works." },
                    { t: "Infinitely many solutions", fb: kind === 1 ? "Take $" + poly([[a, "x"]]) + "$ from both sides: $" + b + " = " + d + "$, which is false." : "The two sides are not identical." }],
            skill: "How many solutions",
            hints: ["Compare the number of $x$'s on each side, then the plain numbers.",
                    "Same $x$'s and same numbers: every value works. Same $x$'s, different numbers: none."],
            why: kind === 0 ? "Different numbers of $x$ ($" + a + "$ and $" + c + "$), so there is exactly one solution."
              : kind === 1 ? "Take $" + poly([[a, "x"]]) + "$ from both sides and you get $" + b + " = " + d + "$, which is false: no solution."
              : "Both sides are the same expression, so every number works." });
        } },
      { id: "a2-make", title: "Making 0 or infinitely many solutions", lesson: 3,
        gen: function (R) {
          var a = R.nz(-6, 7), b = R.int(-9, 9), infinite = R.chance(0.5);
          var tex = poly([[a, "x"], [b, ""]], { keepZero: true }) + " = " + poly([[a, "x"]]) + " + \\square";
          var right = infinite ? String(b) : String(b + R.nz(-5, 6));
          var wrongs = [{ t: String(b + (infinite ? R.nz(-5, 6) : 0)), fb: infinite ? "That leaves different numbers on the two sides, which gives no solution." : "That makes both sides identical, so every number works." },
                        { t: String(a), fb: "Look at the plain numbers, not the number in front of $x$." }];
          return mc(R, { prompt: "What goes in the box so that $" + tex + "$ has **" + (infinite ? "infinitely many" : "no") + "** solutions?",
            right: right, wrong: wrongs, skill: "How many solutions",
            hints: [infinite ? "Every number works only when the two sides are identical." : "No number works when the $x$ parts match but the plain numbers don't."],
            why: infinite ? "With $" + b + "$ in the box both sides read $" + poly([[a, "x"], [b, ""]], { keepZero: true }) + "$, so every value of $x$ works."
                          : "With $" + right + "$ in the box, taking $" + poly([[a, "x"]]) + "$ from both sides leaves $" + b + " = " + right + "$, which is false." });
        } },
      { id: "a2-unknown", title: "Solving for a letter", lesson: 4,
        gen: function (R) {
          var T = R.pick([
            { p: "$ax + b = c$", v: "x", a: "(c - b)/a", keys: ["a", "b", "c"], hint: "Take $b$ from both sides, then divide by $a$." },
            { p: "$y = mx + b$", v: "x", a: "(y - b)/m", keys: ["y", "m", "b"], hint: "Take $b$ from both sides, then divide by $m$." },
            { p: "$P = 2l + 2w$", v: "w", a: "(P - 2l)/2", keys: ["P", "l"], hint: "Take $2l$ from both sides, then divide by 2." },
            { p: "$d = rt$", v: "t", a: "d/r", keys: ["d", "r"], hint: "Divide both sides by $r$." },
            { p: "$A = \\frac{1}{2}bh$", v: "h", a: "2A/b", keys: ["A", "b"], hint: "Multiply both sides by 2, then divide by $b$." },
            { p: "$k(x + n) = m$", v: "x", a: "m/k - n", keys: ["k", "m", "n"], hint: "Divide both sides by $k$, then take $n$ away." },
            { p: "$px - q = r$", v: "x", a: "(r + q)/p", keys: ["p", "q", "r"], hint: "Add $q$ to both sides, then divide by $p$." },
            { p: "$C = 2\\pi r$", v: "r", a: "C/(2*3.14159265)", keys: ["C"], hint: "Divide both sides by $2\\pi$." }
          ]);
          var keys = T.keys.map(function (k) { return ["$" + k + "$", k]; })
            .concat([["$-$", "-"], ["$+$", "+"], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]]);
          return { type: "expr", prompt: "Solve " + T.p + " for $" + T.v + "$.", pre: "$" + T.v + " =$",
            answer: T.a, keys: keys, placeholder: "Use the letters",
            hints: [T.hint, "The answer keeps its letters — that is what a rearranged formula looks like."],
            why: "$" + T.v + " = " + T.a.replace(/\(([^)]+)\)\/(\w+)/, "\\frac{$1}{$2}").replace(/(\w+)\/(\w+)/, "\\frac{$1}{$2}") + "$." };
        } },
      { id: "a2-ineq", title: "Multi-step inequalities", lesson: 5,
        gen: function (R) {
          var a = R.int(2, 7), b = R.int(-9, 9), x = R.nz(-6, 8), rel = R.pick(["<", ">", "<=", ">="]);
          var c = a * x + b;
          var tex = poly([[a, "x"], [b, ""]], { keepZero: true }) + " " + relTex(rel) + " " + c;
          return { type: "ineq", prompt: "Solve $" + tex + "$.", answer: "x " + rel + " " + x,
            shown: "x " + relTex(rel) + " " + x,
            near: [{ v: "x " + flip(rel) + " " + x, fb: "Nothing here was multiplied or divided by a negative, so the sign stays as it was." }],
            hints: ["Take " + b + " from both sides.", "Divide both sides by " + a + ". It is positive, so the sign does not flip."],
            why: lines([tex, poly([[a, "x"]]) + " " + relTex(rel) + " " + (c - b), "x " + relTex(rel) + " " + num(x)]) };
        } },
      { id: "a2-ineq-neg", title: "Inequalities that flip", lesson: 5,
        gen: function (R) {
          var a = -R.int(2, 6), b = R.int(-9, 9), x = R.nz(-6, 8), rel = R.pick(["<", ">", "<=", ">="]);
          var c = a * x + b;
          var tex = poly([[a, "x"], [b, ""]], { keepZero: true }) + " " + relTex(rel) + " " + c;
          return { type: "ineq", prompt: "Solve $" + tex + "$. Careful with the sign.", answer: "x " + flip(rel) + " " + x,
            shown: "x " + relTex(flip(rel)) + " " + x,
            near: [{ v: "x " + rel + " " + x, fb: "The last step divides by $" + a + "$, a negative number, so the sign flips." }],
            hints: ["Take " + b + " from both sides: $" + poly([[a, "x"]]) + " " + relTex(rel) + " " + (c - b) + "$.",
                    "Now divide by $" + a + "$ — and flip the sign, because it is negative."],
            why: lines([tex, poly([[a, "x"]]) + " " + relTex(rel) + " " + (c - b),
                        "x " + relTex(flip(rel)) + " " + num(x) + " \\;\\text{(divided by a negative)}"]) };
        } },
      { id: "a2-compound", title: "Compound inequalities", lesson: 6,
        gen: function (R) {
          if (R.chance(0.5)) {
            var a = R.int(2, 5), b = R.int(-6, 6), lo = R.int(-6, 2), hi = lo + R.int(2, 6);
            var left = a * lo + b, right = a * hi + b;
            var tex = left + " < " + poly([[a, "x"], [b, ""]], { keepZero: true }) + " < " + right;
            return { type: "ineq", prompt: "Solve $" + tex + "$.", answer: lo + " < x < " + hi,
              shown: lo + " < x < " + hi,
              keys: [["$x$", "x"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="], ["$-$", "-"]],
              placeholder: "e.g. -2 < x < 5",
              hints: ["Take " + b + " from all three parts.", "Divide all three parts by " + a + "."],
              why: lines([tex, (left - b) + " < " + poly([[a, "x"]]) + " < " + (right - b), lo + " < x < " + hi]) };
          }
          var p = R.int(-6, 2), q = p + R.int(3, 7), andOr = R.chance(0.5);
          var test = R.chance(0.5) ? R.int(p + 1, q - 1) : R.pick([p - R.int(1, 4), q + R.int(1, 4)]);
          var inMiddle = test > p && test < q;
          var yes = andOr ? inMiddle : !inMiddle;
          return mc(R, { prompt: "Is $x = " + test + "$ a solution of “$x > " + p + "$ **" + (andOr ? "and" : "or") + "** $x < " + q + "$”?",
            right: yes ? "Yes" : "No",
            wrong: [{ t: yes ? "No" : "Yes", fb: andOr ? "**And** needs both to be true. $" + test + " > " + p + "$ is " + (test > p ? "true" : "false") + " and $" + test + " < " + q + "$ is " + (test < q ? "true" : "false") + "." : "**Or** needs at least one to be true. Here " + (test > p || test < q ? "one is" : "neither is") + "." }],
            skill: "Compound inequalities", keep: true,
            hints: [andOr ? "**And**: both parts have to be true." : "**Or**: one part is enough."],
            why: "$" + test + " > " + p + "$ is " + (test > p ? "true" : "false") + ", and $" + test + " < " + q + "$ is " +
                 (test < q ? "true" : "false") + ". With **" + (andOr ? "and" : "or") + "**, that makes it " + (yes ? "a solution." : "not a solution.") });
        } }
    ]
  });

  function relTex(r) { return r === "<=" ? "\\le" : r === ">=" ? "\\ge" : r; }
  function flip(r) { return { "<": ">", ">": "<", "<=": ">=", ">=": "<=" }[r]; }
})();
