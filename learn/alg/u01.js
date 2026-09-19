/* ==========================================================================
   Algebra I — Unit 1: Algebra foundations. See lab/core.js for the format.

   Seven lessons, written for someone meeting algebra for the first time.
   (v: 2 on each lesson: rewritten for beginners on 2026-09-19, so the
   record of the earlier version doesn't carry over onto new steps.)
   Every lesson builds one idea at a time, in the same order:

     1. say it in plain words, with something everyday (a taxi fare, a
        fruit bowl, a rectangle)
     2. show it worked through, one line at a time, each line with its
        reason (the "walk" scene)
     3. ask for the same thing with only the numbers changed
     4. then a step harder

   Every new word — variable, expression, evaluate, term, like terms,
   expand, equivalent, undefined — is named and explained the first time it
   is used, and nothing is asked before it has been taught. Every likely
   wrong answer has its own reply, and every problem has hints.

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
        title: "Letters stand for numbers",
        blurb: "What a variable is, and algebra's shorthand for multiply, divide and squared.",
        mins: 8, v: 2,
        steps: [
          { type: "num", kicker: "Warm up",
            prompt: "What number goes in the box? $$\\square + 3 = 8$$",
            pre: "$\\square =$", answer: 5,
            near: [{ v: 11, fb: "$11 + 3$ is $14$, not $8$. Which number, plus 3, makes 8?" }],
            hints: ["Count up from 3 to 8. How many steps is that?"],
            why: "$5 + 3 = 8$, so the box is $5$." },
          { type: "learn", kicker: "New word",
            prompt: "Algebra does exactly that, but with a **letter** instead of a box: $$x + 3 = 8$$ The letter $x$ is called a **variable**: a letter that stands for a number. Here $x$ stands for $5$, because $5 + 3 = 8$.",
            after: "Any letter can be a variable — $x$, $n$, $a$, $m$. The letter is just a name for a number." },
          { type: "num", prompt: "What number is $n$? $$n + 4 = 10$$", pre: "$n =$", answer: 6, skill: "Variables",
            near: [{ v: 14, fb: "$14 + 4$ is $18$. Which number, plus 4, makes 10?" }],
            hints: ["Which number plus 4 makes 10?"],
            why: "$6 + 4 = 10$, so $n = 6$." },
          { type: "num", prompt: "What number is $a$? $$a - 2 = 7$$", pre: "$a =$", answer: 9, skill: "Variables",
            near: [{ v: 5, fb: "$5 - 2$ is $3$. Which number, take away 2, leaves 7?" }],
            hints: ["Which number, take away 2, leaves 7?"],
            why: "$9 - 2 = 7$, so $a = 9$." },
          { type: "learn", kicker: "Algebra's shorthand",
            prompt: "Algebra writes a few things in a short way. Here are the three you'll see all through this unit. Press **Next step** to go through them one at a time.",
            scene: { type: "walk", rows: [
              { m: "3n", say: "means $3 \\times n$. A number written right in front of a letter means **multiply**. (We skip the $\\times$ sign because it looks too much like the letter $x$.)" },
              { m: "\\frac{n}{2}", say: "means $n \\div 2$. A fraction bar means **divide**." },
              { m: "n^2", say: "means $n \\times n$. The small $2$ says “multiply $n$ by itself”. You say it “$n$ squared”." }] },
            gate: true },
          { type: "choice", prompt: "What does $4n$ mean?", skill: "Algebra shorthand",
            options: [{ t: "$4 \\times n$" },
                      { t: "$4 + n$", fb: "A number in front of a letter means multiply, not add." },
                      { t: "A two-digit number, like 45", fb: "$4n$ isn't a two-digit number. The 4 multiplies $n$: $4 \\times n$." },
                      { t: "$n \\times n \\times n \\times n$", fb: "That would be written $n^4$. $4n$ is $4 \\times n$." }],
            answer: 0, why: "$4n = 4 \\times n$." },
          { type: "num", prompt: "If $n = 5$, what is $4n$?", answer: 20, skill: "Algebra shorthand",
            near: [{ v: 45, fb: "$4n$ means $4 \\times 5$, not the digits 4 and 5 side by side." },
                   { v: 9, fb: "$4n$ means multiply: $4 \\times 5$, not $4 + 5$." }],
            hints: ["$4n$ means $4 \\times n$. Put 5 in for $n$."],
            why: "$4n = 4 \\times 5 = 20$." },
          { type: "num", prompt: "If $n = 10$, what is $\\frac{n}{2}$?", answer: 5, skill: "Algebra shorthand",
            near: [{ v: 20, fb: "The fraction bar means divide: $10 \\div 2$." }, { v: 12, fb: "The fraction bar means divide: $10 \\div 2$." }],
            hints: ["The fraction bar means divide: $10 \\div 2$."],
            why: "$\\frac{10}{2} = 10 \\div 2 = 5$." },
          { type: "num", prompt: "If $n = 3$, what is $n^2$?", answer: 9, skill: "Algebra shorthand",
            near: [{ v: 6, fb: "$n^2$ is $n \\times n = 3 \\times 3$, not $3 \\times 2$." }, { v: 5, fb: "$n^2$ is $n \\times n = 3 \\times 3$." }],
            hints: ["$n^2$ means $n \\times n$."],
            why: "$3^2 = 3 \\times 3 = 9$." },
          { type: "learn", kicker: "Why letters are useful",
            prompt: "Here's a number trick. Use the slider to pick a number, and read down the steps. Try **three different numbers** — notice anything? Then press **Show it with a letter**.",
            scene: { type: "trick", v: 7, min: 1, max: 50,
                     steps: [{ t: "Think of a number", e: "n" }, { t: "Double it", e: "2n" }, { t: "Add 6", e: "2n + 6" },
                             { t: "Halve it", e: "n + 3" }, { t: "Take away the number you started with", e: "3" }] },
            gate: true,
            then: "It always ends on $3$. Trying numbers only shows it works for the numbers you tried. The letter shows it works for **every** number: call your number $n$. Doubling gives $2n$. Adding 6 gives $2n + 6$. Halving gives $n + 3$. Taking away $n$ leaves $3$ — whatever $n$ was." },
          { type: "choice", prompt: "Why does the trick always end on 3?", skill: "Explain with a letter",
            options: [{ t: "Doubling and halving cancel out, and the 6 gets halved to 3" },
                      { t: "3 is a magic number", fb: "Change “Add 6” to “Add 10” and it ends on 5. The answer comes from the steps." },
                      { t: "It only works for small numbers", fb: "Try 1,000: double is 2,000, add 6 is 2,006, halve is 1,003, take away 1,000 is 3." }],
            answer: 0, why: "With a letter: $n$, then $2n$, then $2n + 6$, then $n + 3$, then $3$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Working out an expression",
        blurb: "Swap the letter for a number and work it out — in the right order.",
        mins: 10, v: 2,
        steps: [
          { type: "num", kicker: "Warm up",
            prompt: "A taxi costs **\\$3** to get in, plus **\\$2 for every mile**. How much is a 4-mile ride?",
            pre: "$\\$$", answer: 11,
            near: [{ v: 20, fb: "That charges the \\$3 for every mile too. It's paid once, when you get in." },
                   { v: 8, fb: "That's just the miles, $4 \\times \\$2$. Add the \\$3 to get in." },
                   { v: 14, fb: "The \\$2 is for each mile and the \\$3 is paid once." }],
            hints: ["First pay to get in: \\$3.", "Then the miles: 4 miles at \\$2 each is $4 \\times 2 = 8$.", "Add the two amounts."],
            why: "\\$3 to get in, plus $4 \\times \\$2 = \\$8$ for the miles: \\$11." },
          { type: "learn", kicker: "New word",
            prompt: "You can write the taxi rule once, so it works for any ride. Let $m$ stand for the number of miles.",
            scene: { type: "walk", rows: [
              { m: "3 + 2 \\times m", say: "\\$3 to get in, plus \\$2 for each of the $m$ miles." },
              { m: "3 + 2m", say: "Drop the $\\times$ sign: $2m$ means $2 \\times m$." }] },
            gate: true,
            then: "$3 + 2m$ is called an **expression**: numbers and letters joined by $+$, $-$, $\\times$ or $\\div$. It has no equals sign. Think of it as a recipe that turns a number of miles into a price." },
          { type: "learn", kicker: "Try it",
            prompt: "This machine follows the recipe $3 + 2m$. Put in **at least three** different numbers of miles and watch what comes out.",
            scene: { type: "machine", rule: "3 + 2x", show: "3 + 2m", v: "m", name: "cost", inputs: [1, 2, 4, 10, 25] },
            gate: true,
            then: "Each time, the machine swaps $m$ for your number and works it out. Doing that is called **evaluating** the expression." },
          { type: "learn", kicker: "Watch",
            prompt: "Here's how to evaluate an expression yourself. Let's evaluate $5x - 4$ when $x = 6$.",
            scene: { type: "walk", rows: [
              { m: "5x - 4", say: "Start with the expression." },
              { m: "5(6) - 4", say: "Swap $x$ for $6$. Keep it in brackets: $5(6)$ means $5 \\times 6$." },
              { m: "30 - 4", say: "Multiply: $5 \\times 6 = 30$." },
              { m: "26", say: "Subtract: $30 - 4 = 26$. That's the answer." }] },
            gate: true },
          { type: "num", prompt: "Your turn. Evaluate $5x - 4$ when $x = 3$.", answer: 11, skill: "Evaluate with one variable",
            near: [{ v: 49, fb: "$5x$ is $5 \\times 3$, not the digits 5 and 3 side by side." }, { v: 4, fb: "Multiply first: $5 \\times 3 = 15$. Then take away 4." }],
            hints: ["Swap $x$ for $3$: $5(3) - 4$.", "$5 \\times 3 = 15$. Now take away 4."],
            why: lines(["5(3) - 4", "15 - 4", "11"]) },
          { type: "num", prompt: "Evaluate $2x + 7$ when $x = 4$.", answer: 15, skill: "Evaluate with one variable",
            near: [{ v: 31, fb: "$2x$ is $2 \\times 4$, not the digits 2 and 4 side by side." }, { v: 13, fb: "$2x$ means $2 \\times x$, not $2 + x$." }],
            hints: ["Swap $x$ for $4$: $2(4) + 7$.", "$2 \\times 4 = 8$. Now add 7."],
            why: lines(["2(4) + 7", "8 + 7", "15"]) },
          { type: "num", prompt: "Back to the taxi. How much is a 10-mile ride? Evaluate $3 + 2m$ when $m = 10$.", pre: "$\\$$", answer: 23, skill: "Evaluate with one variable",
            near: [{ v: 50, fb: "Multiply first: $2m = 2 \\times 10 = 20$. Then add the 3." }, { v: 20, fb: "Don't forget the \\$3 to get in." }],
            hints: ["$2m$ is $2 \\times 10$.", "Then add the 3."],
            why: lines(["3 + 2(10)", "3 + 20", "23"]) },
          { type: "choice", prompt: "A gym charges **\\$25 to join**, then **\\$15 every month**. Which expression gives the cost for $n$ months?", skill: "Write an expression",
            options: [{ t: "$25 + 15n$" },
                      { t: "$15 + 25n$", fb: "That pays the joining fee every month. The number that gets multiplied by $n$ is the one paid every month: \\$15." },
                      { t: "$40n$", fb: "That pays the joining fee every month. It's only paid once." },
                      { t: "$25n + 15$", fb: "The \\$15 is paid every month, so it's the one multiplied by $n$." }],
            answer: 0, hints: ["Which amount is paid once? Which is paid every month?"],
            why: "The one-off \\$25 stands alone; the \\$15 is paid $n$ times: $25 + 15n$." },
          { type: "learn", kicker: "New rule",
            prompt: "What is $2 + 3 \\times 4$? Going left to right gives $5 \\times 4 = 20$. But mathematicians agreed on an order so that everyone gets the same answer — and **multiplying comes before adding**. So it's $2 + 12 = 14$. Here is the whole order:",
            scene: { type: "walk", rows: [
              { say: "**1. Brackets.** Work out anything inside $(\\;)$ first." },
              { say: "**2. Powers.** Like $4^2$, which means $4 \\times 4 = 16$." },
              { say: "**3. Multiply and divide**, from left to right." },
              { say: "**4. Add and subtract**, from left to right — last." }] },
            gate: true },
          { type: "choice", prompt: "What is $10 - 2 \\times 3$?", skill: "Order of operations",
            options: [{ t: "$4$" }, { t: "$24$", fb: "That subtracts first. Multiply first: $2 \\times 3 = 6$, then $10 - 6$." }, { t: "$6$", fb: "$2 \\times 3 = 6$ is the first step. Now take it away from 10." }],
            answer: 0, hints: ["Multiply before you subtract."],
            why: lines(["10 - 2 \\times 3", "10 - 6", "4"]) },
          { type: "evalsteps", prompt: "Work out $(5 + 1) \\times 2$ one step at a time. Click the operation that comes **first**.", skill: "Order of operations",
            stages: [
              [{ t: "(5" }, { t: "+", go: true }, { t: "1)" }, { t: "\\times", op: true, fb: "Brackets come first: add $5 + 1$ before you multiply." }, { t: "2" }],
              [{ t: "6", now: true }, { t: "\\times", go: true }, { t: "2" }],
              [{ t: "12", now: true }]],
            done: "$(5 + 1) \\times 2 = 6 \\times 2 = 12$",
            why: "Brackets first: $5 + 1 = 6$. Then $6 \\times 2 = 12$." },
          { type: "evalsteps", prompt: "Now with a letter. Evaluate $2 + 3x^2$ when $x = 4$. Swapping $x$ for $4$ gives the line below. Click each step in order.", skill: "Order of operations",
            stages: [
              [{ t: "2" }, { t: "+", op: true, fb: "Adding comes last. There's a power and a multiply still to do." },
               { t: "3" }, { t: "\\times", op: true, fb: "Close — but powers come before multiplying. The square belongs to the 4." },
               { t: "4" }, { t: "^{2}", go: true }],
              [{ t: "2" }, { t: "+", op: true, fb: "Multiplying still comes before adding." }, { t: "3" }, { t: "\\times", go: true }, { t: "16", now: true }],
              [{ t: "2" }, { t: "+", go: true }, { t: "48", now: true }],
              [{ t: "50", now: true }]],
            done: "$2 + 3 \\times 4^2 = 2 + 3 \\times 16 = 2 + 48 = 50$",
            why: "Power first ($4^2 = 16$), then multiply ($3 \\times 16 = 48$), then add ($2 + 48 = 50$)." },
          { type: "num", prompt: "Evaluate $2x^2$ when $x = 3$.", answer: 18, skill: "Order of operations",
            near: [{ v: 36, fb: "The square belongs to $x$ alone. Square first: $3^2 = 9$. Then $2 \\times 9$." },
                   { v: 12, fb: "$3^2$ is $3 \\times 3 = 9$, not $3 \\times 2$." }],
            hints: ["Powers come before multiplying: work out $3^2$ first.", "$3^2 = 9$. Now $2 \\times 9$."],
            why: lines(["2 \\times 3^2", "2 \\times 9", "18"]) }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "More than one letter",
        blurb: "Two letters, two numbers — and a rectangle to size.",
        mins: 9, v: 2,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "An expression can have more than one letter. Each letter gets its own number. Let's evaluate $2a + b$ when $a = 4$ and $b = 1$.",
            scene: { type: "walk", rows: [
              { m: "2a + b", say: "Start with the expression." },
              { m: "2(4) + 1", say: "Swap $a$ for $4$ and $b$ for $1$." },
              { m: "8 + 1", say: "Multiply first: $2 \\times 4 = 8$." },
              { m: "9", say: "Then add. The answer is $9$." }] },
            gate: true },
          { type: "num", prompt: "Your turn. Evaluate $a + 3b$ when $a = 2$ and $b = 5$.", answer: 17, skill: "Evaluate with several variables",
            near: [{ v: 25, fb: "Multiply first: $3b = 3 \\times 5 = 15$. Then add $a$." }, { v: 10, fb: "$3b$ means $3 \\times b = 15$, not $3 + b$." }],
            hints: ["Swap in the numbers: $2 + 3(5)$.", "Multiply first: $3 \\times 5 = 15$. Then add 2."],
            why: lines(["2 + 3(5)", "2 + 15", "17"]) },
          { type: "num", prompt: "Two letters written side by side are multiplied too: $ab$ means $a \\times b$. Evaluate $ab$ when $a = 6$ and $b = 7$.", answer: 42, skill: "Evaluate with several variables",
            near: [{ v: 13, fb: "$ab$ means $a \\times b$, not $a + b$." }, { v: 67, fb: "$ab$ isn't the digits side by side — it's $6 \\times 7$." }],
            hints: ["$ab = 6 \\times 7$."],
            why: "$ab = 6 \\times 7 = 42$." },
          { type: "table", prompt: "Fill in $3a - b$ for each row: triple $a$, then take away $b$.",
            head: ["$a$", "$b$", "$3a - b$"], rows: [[2, 1, null], [4, 5, null], [5, 3, null], [10, 4, null]],
            answers: [[0, 2, 5], [1, 2, 7], [2, 2, 12], [3, 2, 26]], skill: "Evaluate with several variables",
            hints: ["First row: $3 \\times 2 = 6$, then $6 - 1$."],
            why: "$3(2) - 1 = 5$, $3(4) - 5 = 7$, $3(5) - 3 = 12$, $3(10) - 4 = 26$." },
          { type: "learn", kicker: "New words",
            prompt: "An expression for something real is called a **formula**. For a rectangle with length $l$ and width $w$: <br><br>The **perimeter** is the distance all the way round: $$P = l + w + l + w = 2l + 2w$$ The **area** is how many little squares fit inside: $$A = l \\times w = lw$$ Move the sliders and watch both change.",
            scene: { type: "rectangle", l: { v: 5, min: 1, max: 12 }, w: { v: 3, min: 1, max: 8 } },
            gate: true, then: "Both formulas use both letters, so changing either one changes the answer." },
          { type: "num", prompt: "A rectangle has $l = 5$ and $w = 3$. What is its perimeter, $2l + 2w$?", answer: 16, skill: "Evaluate with several variables",
            near: [{ v: 8, fb: "That's $l + w$ — only halfway round. Perimeter goes all the way: $2(5) + 2(3)$." }, { v: 15, fb: "That's the area. Perimeter adds the sides: $2(5) + 2(3)$." }],
            hints: ["$2l = 2 \\times 5 = 10$ and $2w = 2 \\times 3 = 6$.", "Now add them."],
            why: lines(["2(5) + 2(3)", "10 + 6", "16"]) },
          { type: "num", prompt: "Same rectangle, $l = 5$ and $w = 3$. What is its area, $lw$?", answer: 15, skill: "Evaluate with several variables",
            near: [{ v: 16, fb: "That's the perimeter. Area multiplies: $5 \\times 3$." }, { v: 8, fb: "$lw$ means $l \\times w$, not $l + w$." }],
            hints: ["$lw$ means $l \\times w$."],
            why: "$lw = 5 \\times 3 = 15$ squares." },
          { type: "rectangle", prompt: "A puzzle. Use the sliders to find a rectangle with **perimeter 20** and **area 24**.", l: { v: 3, min: 1, max: 12 }, w: { v: 2, min: 1, max: 8 },
            target: { P: 20, A: 24 }, answer: [6, 4], skill: "Evaluate with several variables",
            hints: ["Perimeter 20 means the length and width add up to half of that: $l + w = 10$.", "Which two numbers add to 10 and multiply to 24?"],
            why: "$l = 6$, $w = 4$: $2(6) + 2(4) = 20$ and $6 \\times 4 = 24$." },
          { type: "learn", kicker: "Negative numbers",
            prompt: "Sometimes a letter stands for a negative number. Put it in brackets so the signs don't get mixed up. Let's evaluate $a - b$ when $a = 5$ and $b = -2$.",
            scene: { type: "walk", rows: [
              { m: "a - b", say: "Start with the expression." },
              { m: "5 - (-2)", say: "Swap in the numbers. The brackets keep $-2$ in one piece." },
              { m: "5 + 2", say: "Taking away a negative is the same as adding. Two minus signs side by side make a plus." },
              { m: "7", say: "So $a - b = 7$." }] },
            gate: true },
          { type: "num", prompt: "Evaluate $a - b$ when $a = 1$ and $b = -4$.", answer: 5, skill: "Evaluate with several variables",
            near: [{ v: -3, fb: "$1 - (-4)$ is $1 + 4$: taking away a negative adds." }, { v: -5, fb: "$1 - (-4)$ is $1 + 4$: two minus signs make a plus." }],
            hints: ["Write it with brackets: $1 - (-4)$.", "Taking away $-4$ is the same as adding $4$."],
            why: lines(["1 - (-4)", "1 + 4", "5"]) },
          { type: "num", prompt: "Decimals work the same way. Evaluate $0.5p - 2q$ when $p = 8$ and $q = 1.5$.", answer: 1, skill: "Fractions and decimals",
            hints: ["$0.5p$ means $0.5 \\times 8$, which is half of 8.", "$2q$ means $2 \\times 1.5 = 3$. Now subtract."],
            why: lines(["0.5(8) - 2(1.5)", "4 - 3", "1"]) }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Like terms",
        blurb: "Count x's with x's and numbers with numbers.",
        mins: 9, v: 2,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A bowl has 3 apples and 2 oranges. You add 4 more apples. Now there are **7 apples and 2 oranges** — you'd never say “9 apples”. Algebra counts the same way. Think of $x$ as apples and $y$ as oranges.",
            scene: { type: "walk", rows: [
              { m: "3x + 2y + 4x", say: "3 apples, 2 oranges, 4 more apples." },
              { m: "3x,\\; 2y,\\; 4x", say: "The pieces joined by $+$ or $-$ are called **terms**. This expression has three terms." },
              { m: "3x + 4x = 7x", say: "$3x$ and $4x$ both count $x$'s, so they are **like terms**. 3 of them and 4 more make 7." },
              { m: "7x + 2y", say: "$2y$ counts something different, so it stays as it is. That's the answer." }] },
            gate: true,
            then: "**Like terms** have exactly the same letter part. Only like terms can be added together. Putting them together is called **simplifying**." },
          { type: "choice", prompt: "Which one is a like term with $5x$?", skill: "Identify like terms",
            options: [{ t: "$2x$" },
                      { t: "$5y$", fb: "Same number, different letter. $5y$ counts $y$'s, not $x$'s." },
                      { t: "$5$", fb: "$5$ is just a number. It has no $x$." },
                      { t: "$x^2$", fb: "$x^2$ is $x \\times x$ — a different kind of thing from $x$." }],
            answer: 0, hints: ["Look only at the letter part. Which one has just $x$?"],
            why: "$2x$ and $5x$ both count $x$'s." },
          { type: "sort", prompt: "Sort these terms by what they count. Drag each card into a box, or click a card and then a box.",
            bins: ["Terms with x", "Terms with y", "Just numbers"],
            cards: [{ t: "$3x$", bin: 0 }, { t: "$-2y$", bin: 1 }, { t: "$5$", bin: 2 }, { t: "$x$", bin: 0 },
                    { t: "$4y$", bin: 1 }, { t: "$-1$", bin: 2 }, { t: "$-6x$", bin: 0, fb: "$-6x$ still counts $x$'s — the minus sign stays with it." },
                    { t: "$\\frac{1}{2}y$", bin: 1 }],
            skill: "Identify like terms" },
          { type: "expr", prompt: "Simplify $2x + 5x$.", answer: "7x", form: "simplified", skill: "Combine like terms",
            near: [{ v: "7x^2", fb: "Adding $x$'s gives more $x$'s, not $x^2$: 2 of them and 5 more is $7x$." }, { v: "10x", fb: "Add the numbers in front: $2 + 5$." }],
            placeholder: "e.g. 3x", hints: ["2 $x$'s plus 5 $x$'s is how many $x$'s?"],
            why: "$2x + 5x = 7x$." },
          { type: "expr", prompt: "Simplify $3x + 2y + 4x$.", answer: "7x + 2y", form: "simplified", skill: "Combine like terms",
            near: [{ v: "9xy", fb: "$x$'s and $y$'s don't combine — like apples and oranges." }, { v: "9x", fb: "The $2y$ can't join the $x$'s. Keep it." }],
            hints: ["Add the $x$ terms: $3x + 4x$.", "The $2y$ stays as it is."],
            why: "$3x + 4x = 7x$, and $2y$ stays: $7x + 2y$." },
          { type: "learn", kicker: "Negative terms",
            prompt: "Terms can be negative too. **Algebra tiles** make that easy to see: a blue bar is $x$, a yellow square is $1$, and a **red** tile is a negative one. A tile and its red opposite cancel out, because $1 + (-1) = 0$. That's called a **zero pair**. <br><br>Here is $3x + 2 - x - 5$. Click a tile, then its red opposite, until no pairs are left.",
            scene: { type: "tilemat", terms: [[3, "x"], [2, "1"], [-1, "x"], [-5, "1"]] },
            gate: true,
            then: "Left over: two $x$ tiles and three red units, which is $2x - 3$. You get the same by counting: $3x - x = 2x$ and $2 - 5 = -3$." },
          { type: "tilemat", prompt: "Your turn. Clear every zero pair in $2x - 4 + 3 - 5x$.", terms: [[2, "x"], [-4, "1"], [3, "1"], [-5, "x"]], skill: "Combine like terms",
            hints: ["Pair each blue $x$ with a red $-x$.", "Then pair each yellow unit with a red one."],
            why: "Two $x$ pairs and three unit pairs cancel, leaving three red $x$'s and one red unit: $-3x - 1$." },
          { type: "expr", prompt: "So what does $2x - 4 + 3 - 5x$ simplify to?", answer: "-3x - 1", form: "simplified", skill: "Combine like terms",
            near: [{ v: "3x - 1", fb: "Five negative $x$'s against two positive ones leaves three **negative** $x$'s: $-3x$." }, { v: "-3x - 7", fb: "$-4 + 3 = -1$." }],
            hints: ["Count the $x$'s: $2x - 5x$.", "Then the numbers: $-4 + 3$."],
            why: "$2x - 5x = -3x$ and $-4 + 3 = -1$: $-3x - 1$." },
          { type: "expr", prompt: "Simplify $4a - 7 - 6a + 2$.", answer: "-2a - 5", form: "simplified", skill: "Negative coefficients",
            near: [{ v: "2a - 5", fb: "$4a - 6a$ is $-2a$: more $a$'s taken away than you had." }, { v: "-2a - 9", fb: "$-7 + 2 = -5$." }],
            hints: ["Collect the $a$ terms, keeping each one's sign: $4a - 6a$.", "Then the numbers: $-7 + 2$."],
            why: "$4a - 6a = -2a$ and $-7 + 2 = -5$: $-2a - 5$." },
          { type: "choice", prompt: "Priya writes $3x + 2 = 5x$. Is she right?", skill: "Identify like terms",
            options: [{ t: "No — $3x$ and $2$ aren't like terms, so they can't be added" },
                      { t: "Yes — $3 + 2 = 5$", fb: "Test it with $x = 10$: $3x + 2 = 32$, but $5x = 50$." },
                      { t: "Only when $x = 1$", fb: "They happen to match at $x = 1$ — but simplifying has to be right for *every* $x$." }],
            answer: 0, why: "$3x + 2$ is already as simple as it gets." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "The distributive property",
        blurb: "Multiplying out brackets, seen as area.",
        mins: 10, v: 2,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A mental maths trick: $7 \\times 23$ is hard, but $23 = 20 + 3$, and $7 \\times 20$ and $7 \\times 3$ are easy. Picture a rectangle 7 tall and 23 wide, split into two parts. Work out the area of each part in your head (area = height × width), then press **Fill in the areas** to check.",
            scene: { type: "tiles", mode: "area", rows: ["7"], cols: ["20", "3"], cw: [230, 60], rh: [100], cells: [["140", "21"]], readout: "$7 \\times 23 = 140 + 21 = 161$" },
            gate: true, then: "$7 \\times 23 = 7 \\times 20 + 7 \\times 3 = 140 + 21 = 161$. Splitting 23 split one hard multiplication into two easy ones." },
          { type: "num", prompt: "Use the same trick: $6 \\times 47 = 6 \\times 40 + 6 \\times 7 = \\;?$", answer: 282, skill: "The distributive property",
            near: [{ v: 247, fb: "The 6 multiplies the 7 as well: $6 \\times 7 = 42$." }],
            hints: ["$6 \\times 40 = 240$.", "$6 \\times 7 = 42$. Now add them."],
            why: "$240 + 42 = 282$." },
          { type: "learn", kicker: "New rule",
            prompt: "A number right in front of a bracket means multiply everything inside: $3(x + 2)$ means $3 \\times (x + 2)$. Here it is as a rectangle 3 tall and $x + 2$ wide. What is the area of each part? Think first, then press **Fill in the areas**.",
            scene: { type: "tiles", mode: "area", rows: ["3"], cols: ["x", "2"], cw: [170, 70], rh: [110], cells: [["3x", "6"]], readout: "$3(x + 2) = 3x + 6$" },
            gate: true, then: "The parts are $3x$ and $6$, so $3(x + 2) = 3x + 6$. This is the **distributive property**: the number outside multiplies **every** term inside. Writing it without the brackets is called **expanding**." },
          { type: "learn", kicker: "Watch",
            prompt: "Let's expand $2(x + 5)$.",
            scene: { type: "walk", rows: [
              { m: "2(x + 5)", say: "The 2 multiplies everything in the bracket." },
              { m: "2 \\times x + 2 \\times 5", say: "Multiply the 2 by the first term, then by the second." },
              { m: "2x + 10", say: "So $2(x + 5) = 2x + 10$." }] },
            gate: true },
          { type: "expr", prompt: "Your turn. Expand $4(x + 3)$.", answer: "4x + 12", form: "simplified", skill: "The distributive property",
            near: [{ v: "4x + 3", fb: "The 4 multiplies the 3 as well: $4 \\times 3 = 12$." }, { v: "x + 12", fb: "The 4 multiplies the $x$ too: $4x$." }],
            placeholder: "e.g. 2x + 10", hints: ["$4 \\times x = 4x$.", "$4 \\times 3 = 12$."],
            why: "$4 \\times x + 4 \\times 3 = 4x + 12$." },
          { type: "expr", prompt: "Expand $5(x + 1)$.", answer: "5x + 5", form: "simplified", skill: "The distributive property",
            near: [{ v: "5x + 1", fb: "The 5 multiplies the 1 as well: $5 \\times 1 = 5$." }],
            hints: ["Multiply the 5 by $x$, then by 1."],
            why: "$5 \\times x + 5 \\times 1 = 5x + 5$." },
          { type: "learn", kicker: "With a minus sign",
            prompt: "It works with minus signs too: each term keeps its own sign. Let's expand $2(x - 4)$.",
            scene: { type: "walk", rows: [
              { m: "2(x - 4)", say: "The bracket holds $x$ and $-4$." },
              { m: "2 \\times x + 2 \\times (-4)", say: "Multiply the 2 by each one, sign included." },
              { m: "2x - 8", say: "$2 \\times (-4) = -8$. So $2(x - 4) = 2x - 8$." }] },
            gate: true },
          { type: "expr", prompt: "Expand $3(x - 2)$.", answer: "3x - 6", form: "simplified", skill: "The distributive property",
            near: [{ v: "3x - 2", fb: "The 3 multiplies the 2 as well: $3 \\times (-2) = -6$." }, { v: "3x + 6", fb: "The minus sign stays: $3 \\times (-2) = -6$." }],
            hints: ["$3 \\times x = 3x$.", "$3 \\times (-2) = -6$."],
            why: "$3 \\times x + 3 \\times (-2) = 3x - 6$." },
          { type: "learn", kicker: "Check it",
            prompt: "When the number outside is negative, it flips the signs inside: $$-3(2x - 1) = -6x + 3$$ because $-3 \\times 2x = -6x$ and $-3 \\times (-1) = +3$. Don't just trust it — try **three** values of $x$ and see that both sides agree.",
            scene: { type: "tester", a: "-3*(2x - 1)", aTex: "-3(2x - 1)", b: "-6x + 3", x: { v: 1, min: -5, max: 5, step: 1 }, goal: "agree3" },
            gate: true, then: "They agree every time." },
          { type: "expr", prompt: "Expand and simplify $-3(2x - 1) + 4x$.", answer: "-2x + 3", form: "simplified", skill: "Distribute and combine",
            near: [{ v: "-2x - 3", fb: "$-3 \\times (-1) = +3$. Two negatives make a positive." }, { v: "10x + 3", fb: "$-3 \\times 2x = -6x$, and $-6x + 4x = -2x$." }],
            hints: ["First expand: $-3(2x - 1) = -6x + 3$.", "Then add the $x$ terms: $-6x + 4x$."],
            why: "$-3(2x - 1) = -6x + 3$; then $-6x + 4x = -2x$. Answer: $-2x + 3$." },
          { type: "expr", prompt: "Now backwards. What goes in the bracket? $$6x + 9 = 3(\\;\\square\\;)$$ Ask: 3 times what gives $6x$? And 3 times what gives $9$?", pre: "$3($", post: "$)$", answer: "2x + 3", skill: "Factor out a common number",
            near: [{ v: "6x + 3", fb: "Divide *both* terms by 3: $6x \\div 3 = 2x$." }, { v: "2x + 9", fb: "The 9 has to be divided by 3 too." }],
            hints: ["$3 \\times 2x = 6x$.", "$3 \\times 3 = 9$."],
            why: "$3 \\times 2x = 6x$ and $3 \\times 3 = 9$, so $6x + 9 = 3(2x + 3)$." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Equivalent expressions",
        blurb: "Two expressions that always give the same answer.",
        mins: 7, v: 2,
        steps: [
          { type: "learn", kicker: "New word",
            prompt: "Two expressions are **equivalent** if they give the same answer for **every** number you put in. $2(x + 3)$ and $2x + 6$ should be equivalent — that's the distributive property. Test them: try **three** values of $x$.",
            scene: { type: "tester", a: "2*(x + 3)", aTex: "2(x + 3)", b: "2x + 6", x: { v: 1, min: -5, max: 5, step: 1 }, goal: "agree3" },
            gate: true, then: "The same answer every time. They are two ways of writing the same thing." },
          { type: "learn", kicker: "Watch out",
            prompt: "Maya thinks $(x + 2)^2$ is equivalent to $x^2 + 4$. Move the slider to find a value of $x$ where they give **different** answers.",
            scene: { type: "tester", a: "(x + 2)^2", b: "x^2 + 4", x: { v: 0, min: -5, max: 5, step: 1 }, goal: "differ" },
            gate: true, then: "At $x = 0$ they agree, but at $x = 1$ one gives $9$ and the other $5$. **One** value where they disagree is enough to show they're **not** equivalent." },
          { type: "choice", prompt: "Which expression is equivalent to $3(x - 4)$?", skill: "Equivalent expressions",
            options: [{ t: "$3x - 12$" }, { t: "$3x - 4$", fb: "The 3 multiplies the $-4$ too." }, { t: "$x - 12$", fb: "The 3 multiplies the $x$ too." }, { t: "$3x + 12$", fb: "$3 \\times (-4) = -12$." }],
            answer: 0, hints: ["Expand it: multiply the 3 by each term in the bracket."],
            why: "$3 \\times x + 3 \\times (-4) = 3x - 12$." },
          { type: "choice", prompt: "Are $2(x + 3) - x$ and $x + 6$ equivalent? Try a few values of $x$, then decide.", skill: "Equivalent expressions",
            scene: { type: "tester", a: "2*(x + 3) - x", aTex: "2(x + 3) - x", b: "x + 6", x: { v: 1, min: -5, max: 5, step: 1 } },
            options: [{ t: "Yes" }, { t: "No", fb: "Try several values with the slider — do they ever disagree?" }],
            answer: 0, why: "Simplify: $2x + 6 - x = x + 6$. The same expression." },
          { type: "multi", prompt: "Which of these are equivalent to $6x + 9$? Pick every one.",
            options: [{ t: "$3(2x + 3)$", ok: true }, { t: "$9 + 6x$", ok: true }, { t: "$2x + 3 + 4x + 6$", ok: true },
                      { t: "$3(2x + 9)$", ok: false, fb: "$3(2x + 9) = 6x + 27$." }, { t: "$15x$", ok: false, fb: "$6x$ and $9$ aren't like terms, so they don't make $15x$." }],
            hints: ["Expand or simplify each one, then compare it with $6x + 9$."],
            skill: "Equivalent expressions" },
          { type: "choice", prompt: "Sam checks $x^2$ and $x$ at $x = 0$ and $x = 1$. Both times they're equal. Are they equivalent?", skill: "Test by substituting",
            options: [{ t: "No — try $x = 2$: $4$ and $2$ aren't equal" }, { t: "Yes — two matching values is enough", fb: "Matching a few times can be luck. $x^2$ and $x$ happen to match at 0 and 1 only." }],
            answer: 0, why: "A few matches don't prove it. One mismatch proves they're not equivalent." }
        ]
      },
      /* ============================================================== 7 */
      {
        title: "Why you can't divide by zero",
        blurb: "Dividing by zero has no answer — here's why.",
        mins: 7, v: 2,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Division asks **how many fit**. $12 \\div 3 = 4$ because four 3s fit into 12. Slide the piece size smaller and watch how many pieces fit. Then slide it all the way to $0$.",
            scene: { type: "share", total: 12, d: { v: 3, min: 0, max: 6, step: 0.25 } },
            gate: true,
            then: "Smaller pieces, more of them: $12 \\div 0.5 = 24$, $12 \\div 0.25 = 48$. But pieces of size $0$ never fill 12, however many you use." },
          { type: "learn", kicker: "Watch",
            prompt: "Here's another way to see it. Every division can be checked with a multiplication.",
            scene: { type: "walk", rows: [
              { m: "12 \\div 3 = 4", say: "is right, because $3 \\times 4 = 12$." },
              { m: "12 \\div 0 = \\;?", say: "would need a number that makes $0 \\times ? = 12$." },
              { m: "0 \\times \\text{any number} = 0", say: "But zero times any number is $0$ — never $12$." },
              { say: "So $12 \\div 0$ has no answer at all. We say it is **undefined**." }] },
            gate: true },
          { type: "choice", prompt: "What is $12 \\div 0$?", skill: "Division by zero",
            options: [{ t: "Undefined — there's no answer" }, { t: "$0$", fb: "Check it: $0 \\times 0 = 0$, not 12." }, { t: "$12$", fb: "Check it: $0 \\times 12 = 0$, not 12." },
                      { t: "Infinity", fb: "Infinity isn't a number you can check with a multiplication — and zero times anything is still zero." }],
            answer: 0, why: "Nothing times $0$ makes $12$, so $12 \\div 0$ is **undefined**." },
          { type: "num", prompt: "Zero on **top** is fine. What is $0 \\div 5$?", answer: 0, skill: "Division by zero",
            hints: ["Share nothing between 5 people. How much does each get?"],
            why: "$0 \\div 5 = 0$, because $5 \\times 0 = 0$. Only zero on the **bottom** has no answer." },
          { type: "multi", prompt: "Which of these are undefined? Pick every one.",
            options: [{ t: "$\\frac{5}{0}$", ok: true }, { t: "$\\frac{0}{5}$", ok: false, fb: "$\\frac{0}{5} = 0$. Zero on top is fine." },
                      { t: "$\\frac{7}{3 - 3}$", ok: true }, { t: "$\\frac{x}{4}$ when $x = 0$", ok: false, fb: "That's $\\frac{0}{4} = 0$. Zero on top is fine." }],
            hints: ["Work out the bottom of each one. Is it zero?"],
            skill: "Division by zero" },
          { type: "num", prompt: "For which value of $x$ is $\\frac{5}{x - 3}$ undefined?", pre: "$x =$", answer: 3, skill: "Division by zero",
            near: [{ v: -3, fb: "At $x = -3$ the bottom is $-3 - 3 = -6$, not 0. Which $x$ makes $x - 3 = 0$?" }, { v: 5, fb: "A 5 on top is fine. It's the bottom that can't be zero." }, { v: 0, fb: "At $x = 0$ the bottom is $0 - 3 = -3$, not 0." }],
            hints: ["It's undefined when the bottom, $x - 3$, is zero.", "Which number, take away 3, leaves 0?"],
            why: "The bottom $x - 3$ is zero when $x = 3$." },
          { type: "choice", prompt: "A harder one: what about $0 \\div 0$? It asks what number times $0$ gives $0$.", skill: "Division by zero",
            options: [{ t: "Every number works, so there's no single answer — it's undefined too" }, { t: "$0$", fb: "0 works — but so does 5, and so does 100. A division has to have one answer." },
                      { t: "$1$", fb: "1 works — but so does every other number." }],
            answer: 0, why: "Every number times 0 is 0, so $0 \\div 0$ can't pick one answer. It has no value either." }
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
