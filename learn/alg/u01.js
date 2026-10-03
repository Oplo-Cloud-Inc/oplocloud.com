/* ==========================================================================
   Algebra I — Unit 1: Linear equations. See lab/core.js for the format.

   Follows OpenStax Algebra 1 (Texas edition), Unit 1, lesson for lesson —
   the readiness check, lessons 1.1 to 1.15, and Project 1 — so a teacher can
   teach from the book or from this. Every lesson is written to the recipe in
   docs/OEDU_BRILLIANT_CONCEPT.md, which is Brilliant's method held to
   docs/OEDU_LEARN_BY_DOING_BENCHMARK.md:

     TRY    a situation, with no instruction beyond the goal. A wrong first try
            is expected and costs nothing.
     SEE    change something and watch the model answer — a slider, a table,
            a balance, a line you drag.
     NAME   one line, shown after: what just happened, and the new word for it.
     VARY   predict, then test.
     USE    a situation the lesson did not show; the last step of every lesson
            is something the student makes or a problem with no template.

   The book's through-line is a city manager balancing a budget against
   constraints; so is the unit's. Each lesson adds one tool for saying what is
   true about a situation, and what is allowed.

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   questions, figures, feedback and every step here are OEdu's own.

   (v: 3 on each lesson: the unit was rebuilt on the book's Unit 1 on
   2026-09-30, so the record of the earlier "Algebra foundations" lessons does
   not carry over onto these steps.)

   Seventeen lessons, twenty-seven skills, four quizzes, and the unit test.
   Standards: TEKS A.2.A–A.2.I, A.3.A–A.3.H; CCSS HSA.CED.A.1–4, HSA.REI.A.1,
   HSA.REI.B.3, HSF.LE.A.2, 8.EE.B.5–6, 8.F.B.4.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, frac = L.frac, num = L.num, mc = L.mc, signed = L.signed, fig = L.fig;

  // A worked calculation, one line per step.
  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  // Two equations, one under the other, as a display.
  function sys(a, b) { return "$$" + a + "$$$$" + b + "$$"; }
  // "a and b" for an option or a card, where spaces beside maths close up.
  function two(a, b) { return "$" + a + "$\u00a0\u00a0and\u00a0\u00a0$" + b + "$"; }
  // A row of figure items for a line y = mx + b across the window, and its named points.
  function ln(m, b, c, extra) {
    var items = [{ line: [[0, b], [1, m + b]], c: c || "blue" }];
    return items.concat(extra || []);
  }
  function opt(t, fb) { return fb ? { t: t, fb: fb } : { t: t }; }
  // A small table of values, set as maths, for a question to point at.
  function tbl(head, rows, cap) {
    return '<table class="lw-table big">' + (cap ? "<caption>" + L.fmt(cap) + "</caption>" : "") +
      "<thead><tr>" + head.map(function (h) { return "<th>" + L.fmt(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + L.m(String(c)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
  }

  var LESSONS = [];
  /* ============================================================ 0 · Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Unit 1 Readiness · Solve an equation, sort equations by how many solutions they have, and find points on a graph.",
    mins: 9, v: 3,
    steps: [
      { type: "num", kicker: "Check 1 · Solving",
        prompt: "Start with one you can probably do. Solve for $x$. $$2(x + 3) = 14$$",
        pre: "$x =$", answer: 4, skill: "Solve linear equations",
        near: [{ v: 11, fb: "That takes the 3 away but never divides by the 2. The 2 multiplies everything in the bracket." },
               { v: 5.5, fb: "The 2 multiplies the 3 as well: $2(x + 3) = 2x + 6$, not $2x + 3$." }],
        hints: ["Either share the 2 across the bracket first, or divide both sides by 2.", "Divide both sides by 2: $x + 3 = 7$."],
        why: lines(["2(x + 3) = 14", "x + 3 = 7", "x = 4"]) + "<br>Check: $2(4 + 3) = 14$ ✓" },
      { type: "num", prompt: "Now with $x$ on both sides. Solve $$3x - 4 = x + 10$$", pre: "$x =$", answer: 7, skill: "Solve linear equations",
        near: [{ v: 3, fb: "Watch the sign when the $-4$ crosses over: it becomes $+4$. So $2x = 14$, not $2x = 6$." },
               { v: 14, fb: "You have $2x = 14$ — that's $2$ groups of $x$. One $x$ is half of it." }],
        hints: ["Take one $x$ from both sides so the $x$ terms are on one side only.", "$3x - x = 2x$. Then add 4 to both sides."],
        why: lines(["3x - 4 = x + 10", "2x - 4 = 10", "2x = 14", "x = 7"]) + "<br>Check: $3(7) - 4 = 17$ and $7 + 10 = 17$ ✓" },
      { type: "num", prompt: "One with a fraction. Solve $$\\frac{x}{3} - 2 = 4$$", pre: "$x =$", answer: 18, skill: "Solve linear equations",
        near: [{ v: 6, fb: "$6$ is what $\\frac{x}{3}$ equals. But $x$ is three times that." },
               { v: 2, fb: "That's $4 - 2$. The $-2$ moves over as $+2$, and then $x$ is still divided by 3." }],
        hints: ["Get $\\frac{x}{3}$ alone first: add 2 to both sides.", "Then undo the dividing by 3: multiply both sides by 3."],
        why: lines(["\\frac{x}{3} - 2 = 4", "\\frac{x}{3} = 6", "x = 18"]) },
      { type: "learn", kicker: "The strategy",
        prompt: "If any of those were slow, here is the whole method. It works on every linear equation. Press **Next step** to go through it.",
        scene: { type: "walk", rows: [
          { m: "3(x - 1) + 2 = 5x - 9", say: "Here is one to try it on." },
          { m: "3x - 3 + 2 = 5x - 9 \\;\\to\\; 3x - 1 = 5x - 9", say: "**1. Simplify each side.** Remove brackets, then combine like terms." },
          { m: "-1 = 2x - 9", say: "**2. Collect the $x$ terms on one side.** Take $3x$ from both sides." },
          { m: "8 = 2x", say: "**3. Collect the plain numbers on the other.** Add 9 to both sides." },
          { m: "4 = x", say: "**4. Make the $x$ have a coefficient of 1.** Divide both sides by 2." },
          { m: "3(4 - 1) + 2 = 11 \\;\\text{ and }\\; 5(4) - 9 = 11", say: "**5. Check.** Put $4$ back into the *original* equation. Both sides give $11$." }] },
        gate: true,
        then: "A **solution** is a value that makes the equation true. Step 5 is not optional — it is how you know." },

      { type: "sort", kicker: "Check 2 · Solutions",
        prompt: "Some equations have one solution, some none, and some are true for every number. **Without solving completely**, sort these. (Try one on scrap paper if you're unsure.)",
        bins: ["One solution", "No solution", "Every number"],
        cards: [
          { t: "$4x = 20$", bin: 0 },
          { t: "$2x + 3 = 2x + 5$", bin: 1, fb: "Take $2x$ from both sides and you get $3 = 5$. That is never true, whatever $x$ is — so no number works." },
          { t: "$3(x + 1) = 3x + 3$", bin: 2, fb: "Share the 3: the left side becomes $3x + 3$ — the same as the right. Both sides are identical, so every number works." },
          { t: "$x + 5 = 2x - 1$", bin: 0, fb: "Take $x$ from both sides: $5 = x - 1$, so $x = 6$. Exactly one number works." },
          { t: "$5x - 2 = 5x - 2$", bin: 2, fb: "Both sides are the same expression. Every number makes it true." },
          { t: "$x + 4 = x - 4$", bin: 1, fb: "Take $x$ from both sides: $4 = -4$. Never true — no solution." }],
        hints: ["Take the $x$ terms to one side. If the $x$ vanishes, look at what's left: is it true or false?"],
        why: "If the $x$ terms cancel and what's left is **true** (like $3 = 3$), every number works. If it's **false** (like $3 = 5$), none do. If an $x$ is left, there is exactly one." },
      { type: "learn", kicker: "Three kinds of equation",
        prompt: "Each kind has a name.",
        scene: { type: "walk", rows: [
          { m: "7x + 8 = 22 \\;\\Rightarrow\\; x = 2", say: "**Conditional equation.** True for some values of $x$ and false for the rest. Here, only $x = 2$." },
          { m: "3(x + 1) = 3x + 3 \\;\\Rightarrow\\; 3 = 3", say: "**Identity.** True for every value of $x$. The solution is *all real numbers*." },
          { m: "2x + 3 = 2x + 5 \\;\\Rightarrow\\; 3 = 5", say: "**Contradiction.** True for no value of $x$. It has *no solution*." }] },
        gate: true },

      { type: "plane", kicker: "Check 3 · Coordinates",
        prompt: "A point's **coordinates** are written $(x, y)$: how far across, then how far up or down. **Click the point** $(-3, 2)$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [-3, 2] }, skill: "Coordinates",
        clickFb: function (c) {
          return c[0] === 2 && c[1] === -3 ? "That is $(2, -3)$ — the order is switched. $x$ comes first: three left, then two up."
            : c[0] === -3 && c[1] === -2 ? "Right across — but 2 is *up*, and this is down."
            : "Start at the middle. The first number, $-3$, says three steps left. The second, $2$, says two steps up.";
        },
        hints: ["The first number is left or right. $-3$ means left."],
        why: "From the origin, go 3 left, then 2 up: $(-3, 2)$." },
      { type: "plane", prompt: "Once more. Click $(4, -1)$.", x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [4, -1] }, skill: "Coordinates",
        clickFb: function (c) {
          return c[0] === -1 && c[1] === 4 ? "Those are the right numbers in the wrong order. Across first: $x = 4$."
            : "Four steps right (positive $x$), then one step down (negative $y$).";
        },
        why: "4 right, then 1 down." },
      { type: "choice", prompt: "Which point has coordinates $(2, -4)$?" +
          fig({ x: [-6, 6], y: [-6, 6], u: 22, alt: "Four points, A to D, on a grid.",
                items: [{ pt: [2, 4], name: "A" }, { pt: [-4, 2], name: "B" }, { pt: [2, -4], name: "C", at: "se" }, { pt: [-2, -4], name: "D", at: "sw" }] }),
        skill: "Coordinates",
        options: [{ t: "$A$", fb: "$A$ is 2 across and 4 *up*. We need 4 *down*." },
                  { t: "$B$", fb: "$B$ is at $(-4, 2)$ — the numbers are switched." },
                  { t: "$C$" },
                  { t: "$D$", fb: "$D$ is 2 to the *left*. We need 2 to the right." }],
        answer: 2, keep: true,
        hints: ["Positive $x$ is right; negative $y$ is down."], why: "$C$ is 2 right and 4 down." },

      { type: "learn", kicker: "So — where to start?",
        prompt: "If you got the three solving problems and the sort right the first time, you're ready: go straight to **Lesson 1.1**. If a few of them slipped, you're still ready — the unit starts from here, and every lesson tells you what it needs before it uses it. If **the solving** felt shaky, do lessons 1.4, 1.6 and 1.7 slowly; they are about exactly that. For a longer refresher, the **placement check** on the Algebra I page finds what you already know and lets you learn only what you're ready for.",
        after: "Nothing is locked. You can open any lesson from the unit page whenever you like." }
    ]
  });
  /* ============================================ 1.1 · Expressions and equations */
  var HOW_1_1 = [["Changes", "Find the quantity that can change. Give it a letter."], ["Fixed", "Find the numbers that stay the same."], ["Expression", "Write the calculation, with the letter in place of the changing number."], ["Limits", "Write each limit as an inequality. That is a constraint."]];
  LESSONS.push({
    title: "Exploring expressions and equations",
    blurb: "Book 1.1 · Some quantities change and some are fixed. A constraint is a limit on what's possible.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "Your class is ordering pizza for a party. Each pizza costs **\\$10**, and delivery is **\\$5**. How much will **4 pizzas** cost?",
        pre: "$\\$$", answer: 45, skill: "Write an expression",
        near: [{ v: 15, fb: "$10 + 5$ is one pizza plus delivery. You need four pizzas." },
               { v: 40, fb: "That's just the pizzas, $4 \\times 10$. Add the \\$5 delivery." },
               { v: 60, fb: "The delivery fee is paid once, not once per pizza. That gives $4 \\times (10 + 5)$." }],
        hints: ["Pizzas first: how much do 4 cost?", "Then add the delivery."],
        why: "Pizzas: $4 \\times 10 = 40$. Delivery: $5$. Total $40 + 5 = 45$." },
      { type: "learn", kicker: "Explore",
        prompt: "You did the same two steps each time: multiply by 10, then add 5. Put a few different numbers of pizzas into this machine and watch what comes out.",
        scene: { type: "machine", rule: "10x + 5", show: "10p + 5", v: "p", name: "cost", inputs: [1, 3, 6, 10, 20], gate: true },
        gate: true,
        then: "The number of pizzas can be any whole number, so it gets a letter: $p$. A letter that stands for a number that can change is a **variable**. The \\$10 and the \\$5 don't change — they're fixed by the shop. And $10p + 5$, which works out the cost for any $p$, is called an **expression**." },
      { type: "learn", kicker: "The idea",
        prompt: "You did the same two steps each time: multiply by 10, then add 5. A letter lets you write those steps once, for **every** number of pizzas. A letter that stands for a number that can change is a **variable**.",
        scene: { type: "method", how: HOW_1_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Each pizza costs **\\$10** and delivery is **\\$5**. The class has **\\$100**. Watch the plan written in symbols.",
        scene: { type: "walk", how: HOW_1_1, rows: [
          { step: 1, m: "p", say: "The number of pizzas can change. Call it $p$." },
          { step: 2, m: "10, \\; 5", say: "\\$10 a pizza and \\$5 for delivery do not change." },
          { step: 3, m: "10p + 5", say: "Ten for each pizza, plus five once.",
            ask: { prompt: "The cost of 4 pizzas was $10(4) + 5$. What is the cost of $p$ pizzas?", answer: 0,
                   options: [{ t: "$10p + 5$" }, { t: "$15p$", fb: "The \\$5 delivery is paid once, not for every pizza." }] } },
          { step: 4, m: "10p + 5 \\le 100", say: "The cost cannot be more than \\$100. A limit like this is a **constraint**." }] },
        gate: true,
        then: "A **variable** can change. A **constraint** limits what is possible." },
      { type: "guided", kicker: "Together",
        prompt: "A new plan: an ice cream party. Each cone costs **\\$3.50**, and the ice cream truck charges **\\$40** to visit. The class can spend **at most \\$110**.",
        how: HOW_1_1, skill: "Write an expression",
        steps: [
          { step: 1, ask: "What can change?", type: "choice", answer: 0,
            options: [{ t: "The number of cones. Call it $c$" }, { t: "The \\$40", fb: "The truck charges \\$40 whatever happens. It is fixed." }],
            m: "c", say: "The number of cones gets the letter." },
          { step: 2, ask: "Which numbers stay fixed?", type: "choice", answer: 0,
            options: [{ t: "\\$3.50 and \\$40" }, { t: "Only \\$40", fb: "The price of one cone does not change either." }],
            m: "3.5, \\; 40", say: "The price of a cone, and the truck's charge." },
          { step: 3, ask: "Which expression is the cost of $c$ cones?", type: "choice", answer: 0,
            options: [{ t: "$3.5c + 40$" }, { t: "$43.5c$", fb: "The \\$40 is paid once, not for every cone." }, { t: "$40c + 3.5$", fb: "\\$3.50 is the price of each cone, so it multiplies $c$." }],
            m: "3.5c + 40", say: "\\$3.50 for each cone, plus \\$40 once." },
          { step: 4, ask: "Which inequality says “at most \\$110”?", type: "choice", answer: 0,
            options: [{ t: "$3.5c + 40 \\le 110$" }, { t: "$3.5c + 40 \\ge 110$", fb: "That says 110 or more. “At most” means 110 or less." }],
            m: "3.5c + 40 \\le 110", say: "The constraint." }],
        why: "Changes, fixed, expression, limits. Now sort out the pizza plan yourself." },
      { type: "multi", kicker: "On your own", prompt: "In this plan, **which quantities can vary?** Pick every one. (Each pizza costs \\$10; delivery is \\$5.)",
        options: [{ t: "The number of pizzas", ok: true },
                  { t: "The total cost", ok: true },
                  { t: "The price of one pizza", fb: "In this plan the shop has fixed it at \\$10. It stays the same however many pizzas you order." },
                  { t: "The delivery fee", fb: "It's \\$5 whatever the order. Fixed." }],
        skill: "Variables and fixed quantities",
        hints: ["Ask: if we order more pizzas, does it change?"],
        why: "Order more pizzas and the total cost changes — so both of those vary. The \\$10 and the \\$5 are set by the shop." },
      { type: "slots", prompt: "Constraints are often written with an **inequality**. Match each limit to its inequality. (One card doesn't belong.)",
        slots: [{ id: "a", label: "Each guest gets *fewer than* 4 slices ($s$ slices)" },
                { id: "b", label: "Order *at least* 6 pizzas ($p$ pizzas)" },
                { id: "c", label: "*No more than* 20 guests ($g$ guests)" },
                { id: "d", label: "Raise *more than* \\$50 ($d$ dollars)" }],
        cards: [{ t: "$s < 4$", slot: "a", fb: "“Fewer than 4” means below 4, not including 4: $s < 4$." },
                { t: "$p \\ge 6$", slot: "b", fb: "“At least 6” means 6 or more: $p \\ge 6$." },
                { t: "$g \\le 20$", slot: "c", fb: "“No more than 20” means 20 or fewer: $g \\le 20$." },
                { t: "$d > 50$", slot: "d", fb: "“More than 50” means above 50, not including 50: $d > 50$." },
                { t: "$s > 4$" }],
        skill: "Constraints",
        hints: ["Underline the key words: *fewer than*, *at least*, *no more than*, *more than*."],
        why: "$<$ is “less than”, $\\le$ is “less than or equal to”, $>$ is “greater than”, $\\ge$ is “greater than or equal to”. The small end of the symbol points at the smaller number." },
      { type: "numberline", prompt: "Show the constraint “**at least 6 pizzas**” on the number line: drag the end to 6, choose the direction, and decide whether 6 itself counts.",
        min: 0, max: 12, mode: "ray", variable: "p", ray: { at: 3, dir: "left", closed: false },
        answer: { at: 6, dir: "right", closed: true }, skill: "Constraints",
        hints: ["“At least 6” means 6 is allowed. Is the circle filled or open for a number that's allowed?"],
        why: "$p \\ge 6$: 6 counts (a filled circle), and so does everything larger (shade to the right)." },
      { type: "learn", kicker: "A harder case",
        prompt: "One situation usually has several constraints. Look at everything that limits the pizza plan.",
        scene: { type: "walk", how: HOW_1_1, rows: [
          { step: 4, m: "10p + 5 \\le 100", say: "The money." },
          { step: 4, m: "p \\ge 0", say: "Nobody orders a negative number of pizzas." },
          { step: 4, m: "p \\text{ is a whole number}", say: "And pizzas come whole. One situation, three constraints." }] },
        gate: true },
      { type: "num", kicker: "Try it",
        prompt: "The class has only **\\$100**. What is the **most** pizzas it can order?",
        answer: 9, skill: "Constraints",
        near: [{ v: 10, fb: "10 pizzas cost $10(10) + 5 = 105$. That's \\$5 over budget." },
               { v: 9.5, fb: "$95 \\div 10 = 9.5$ — but you can't order half a pizza. Round *down*: 10 would cost \\$105." },
               { v: 95, fb: "\\$95 is what's left after delivery. How many \\$10 pizzas fit inside?" }],
        hints: ["First set aside the \\$5 delivery. How much is left for pizza?", "Now how many \\$10 pizzas fit into that?"],
        why: "After delivery: $100 - 5 = 95$. Then $95 \\div 10 = 9.5$ — 9 whole pizzas fit. Check: $10(9) + 5 = 95$; 10 would cost \\$105." },
      { type: "choice", kicker: "Find the error",
        prompt: "Each pizza costs \\$10 and delivery is \\$5. Kiran writes the cost of $p$ pizzas as $15p$. What is wrong?",
        options: [{ t: "Delivery is paid once, not for each pizza. The cost is $10p + 5$." },
                  { t: "It should be $10 + 5p$.", fb: "The \\$10 is the price of each pizza, so it is the 10 that multiplies $p$." },
                  { t: "Nothing. $10 + 5 = 15$.", fb: "Test it with 4 pizzas: $15(4) = 60$, but 4 pizzas cost \\$45." }],
        answer: 0, skill: "Write an expression", hints: ["Test his expression with 4 pizzas."],
        why: "Only the pizza price repeats. $10p + 5$ gives \\$45 for 4 pizzas ✓." },
      { type: "multi", kicker: "Use it", prompt: "Marcus works $s$ hours a week stocking shelves and $m$ hours mowing lawns. He works **at least 8 hours** stocking, and **at most 20 hours** in total. Which of these are constraints on his week?",
        options: [{ t: "$s \\ge 8$", ok: true },
                  { t: "$s + m \\le 20$", ok: true },
                  { t: "$s + m \\ge 20$", fb: "That says he works *at least* 20 hours in total. The story says *at most* 20." },
                  { t: "$m \\ge 8$", fb: "The 8 hours is for stocking shelves ($s$), not mowing ($m$)." }],
        skill: "Constraints",
        hints: ["Two constraints are stated. Find each key phrase, and which quantity it's about."],
        why: "“At least 8 hours stocking” is $s \\ge 8$. “At most 20 hours in total” is $s + m \\le 20$." }
    ]
  });

  /* ========================= 1.2 · Writing equations to model relationships, 1 */
  var HOW_1_2 = [["Read", "Read the situation."], ["Letters", "Pick letters for the quantities that are not known, or that can change."], ["Sentence", "Say in one sentence how the quantities are related."], ["Equation", "Write that sentence with numbers, letters and an equals sign."]];
  LESSONS.push({
    title: "Writing equations to model relationships (part 1)",
    blurb: "Book 1.2 · An equation says two expressions are worth the same. Say what the story says is true.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A quick one, in your head. What is **25%** of **200**?",
        answer: 50, skill: "Percent as a number",
        near: [{ v: 5000, fb: "That's $25 \\times 200$. “Percent” means *per hundred*, so 25% is $25$ out of every $100$." },
               { v: 25, fb: "$25$ is 25% of $100$. There are two hundreds in $200$." }],
        hints: ["25% is a quarter. What is a quarter of 200?"], why: "25% is one quarter, and $200 \\div 4 = 50$." },
      { type: "learn", kicker: "The idea",
        prompt: "$10p + 5$ is an **expression**: it has a value. Say what it equals and you have an **equation**: a statement that two expressions have the same value. To write one, decide what the story says is true.",
        scene: { type: "method", how: HOW_1_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Blueberries cost **\\$4.99 a pound**. Diego buys some and pays **\\$14.95**. Watch an equation written for that.",
        scene: { type: "walk", how: HOW_1_2, rows: [
          { step: 1, m: "4.99, \\; 14.95", say: "The price of a pound, and what Diego paid." },
          { step: 2, m: "p", say: "The number of pounds is not known. Call it $p$." },
          { step: 3, m: "4.99 \\times \\text{pounds} = \\text{what he pays}", say: "The sentence, in words first." },
          { step: 4, m: "4.99p = 14.95", say: "The same sentence in symbols.",
            ask: { prompt: "The price of a pound, times the pounds, is what he pays. Which equation says that?", answer: 0,
                   options: [{ t: "$4.99p = 14.95$" }, { t: "$4.99 + p = 14.95$", fb: "Each pound costs 4.99, so the price **multiplies** the number of pounds." }] } }] },
        gate: true,
        then: "An **equation** says that two expressions are worth the same." },
      { type: "guided", kicker: "Together",
        prompt: "Noah earned $n$ dollars over the summer. Mai earned **\\$275**, which is **\\$45 more than Noah**. Write an equation.",
        how: HOW_1_2, skill: "Write an equation",
        steps: [
          { step: 2, ask: "Which quantity is unknown?", type: "choice", answer: 0,
            options: [{ t: "What Noah earned, $n$" }, { t: "What Mai earned", fb: "Mai's amount is given: \\$275." }],
            m: "n", say: "Noah's earnings are the unknown." },
          { step: 3, ask: "Say it in one sentence.", type: "choice", answer: 0,
            options: [{ t: "Mai's 275 is Noah's amount plus 45" }, { t: "Noah's amount is Mai's 275 plus 45", fb: "Mai earned **more**. So 45 is added to Noah's amount to reach hers." }],
            m: "275 = \\text{Noah's amount} + 45", say: "Mai has the larger amount." },
          { step: 4, ask: "Write the equation.", type: "choice", answer: 0,
            options: [{ t: "$275 = n + 45$" }, { t: "$n = 275 + 45$", fb: "That would make Noah the one who earned more." }, { t: "$275 = 45n$", fb: "“45 more than” means adding 45, not multiplying by it." }],
            m: "275 = n + 45", say: "The sentence, in symbols." }],
        why: "Read, letters, sentence, equation. Now write two more about blueberries." },
      { type: "equation", kicker: "On your own", prompt: "Jada also buys $p$ pounds, but we don't know what she pays. Call it $c$ dollars. Write an equation.",
        answer: "c=4.99p", shown: "c = 4.99p", skill: "Write an equation",
        keys: [["$p$", "p"], ["$c$", "c"], ["$=$", "="], ["$\\times$", "*"]], placeholder: "c = …",
        hints: ["Same as before, with $c$ instead of 14.95."], why: "$c = 4.99p$: the cost is the price times the pounds." },
      { type: "equation", prompt: "Lin shops at a different store. There, blueberries cost $r$ dollars a pound. She buys $p$ pounds and pays $c$ dollars. Write an equation.",
        answer: "c=rp", shown: "c = rp", skill: "Write an equation",
        near: [{ v: "c=r+p", fb: "The price is per pound: multiply by the pounds, don't add." }],
        keys: [["$p$", "p"], ["$c$", "c"], ["$r$", "r"], ["$=$", "="], ["$\\times$", "*"]], placeholder: "c = …",
        hints: ["Look at what stayed the same in the last two equations. Only the numbers turned into letters."],
        why: "$c = rp$. The numbers became letters; the *shape* of the relationship — price times amount equals total — didn't change." },
      { type: "learn", kicker: "A harder case",
        prompt: "Percents. A car costs $P$ dollars. Tax adds **6 percent**, and the dealer adds **\\$120** in other charges. Write an equation for the total, $T$.",
        scene: { type: "walk", how: HOW_1_2, rows: [
          { step: 2, m: "P, \\; T", say: "The price and the total can both change." },
          { step: 3, m: "\\text{total} = \\text{price} + 0.06 \\times \\text{price} + 120", say: "6 percent of the price is 0.06 times the price." },
          { step: 4, m: "T = P + 0.06P + 120", say: "In symbols." },
          { step: 4, m: "T = 1.06P + 120", say: "The price plus 6 percent of it is 1.06 times the price." }] },
        gate: true },
      { type: "num", kicker: "Try it",
        prompt: "In Michigan the tax on a car is **6%**, and one dealership adds **\\$120** in other charges. The car's price is **\\$9,500**. What's the total?",
        pre: "$\\$$", answer: 10190, skill: "Equations with percents",
        near: [{ v: 570, fb: "That's only the tax. The total includes the car itself and the \\$120." },
               { v: 10070, fb: "That's the price plus tax — add the \\$120 too." },
               { v: 9500.06, tol: 0.001, fb: "6% is $0.06$ *of the price*, not \\$0.06." }],
        hints: ["Tax: $6\\% \\text{ of } 9500 = 0.06 \\times 9500$.", "Total = price + tax + charges."],
        why: "Tax $= 0.06 \\times 9500 = 570$. Total $= 9500 + 570 + 120 = 10190$." },
      { type: "table", kicker: "Explore",
        prompt: "These five solids are called **Platonic solids**. $F$ is the number of faces, $V$ the vertices (corners), $E$ the edges. Fill in the two blanks. *Hint for edges: every edge is shared by two faces.*",
        head: ["$F$", "$V$", "$E$"],
        rows: [[4, 4, 6], [6, 8, null], [12, 20, 30], [20, 12, null]], answers: [[1, 2, 12], [3, 2, 30]],
        skill: "Model with an equation",
        hints: ["A cube has 6 square faces. Each square has 4 edges — but each edge is counted twice, once for each face it touches.", "An icosahedron has 20 triangular faces: $20 \\times 3 \\div 2$ edges."],
        why: "Cube: $6 \\times 4 \\div 2 = 12$. Icosahedron: $20 \\times 3 \\div 2 = 30$." },
      { type: "equation", prompt: "Look down the columns and across the rows. There is one equation using $F$, $V$ and $E$ that is true for **every** row. Write it.",
        answer: "F+V=E+2", shown: "F + V = E + 2", skill: "Model with an equation",
        near: [{ v: "F+V=E", fb: "Try the tetrahedron: $4 + 4 = 8$, but $E = 6$. Close — something is off by a fixed amount." },
               { v: "F+V-E=0", fb: "Try the tetrahedron: $4 + 4 - 6 = 2$, not 0. The left side is *always* the same number — which one?" }],
        keys: [["$F$", "F"], ["$V$", "V"], ["$E$", "E"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "e.g. F + V = …",
        hints: ["Add $F$ and $V$ in each row and compare with $E$. What's the difference every time?", "Tetrahedron: $F + V = 8$ and $E = 6$ — a difference of 2. Cube: $6 + 8 = 14$ and $E = 12$."],
        why: "Every row gives $F + V - E = 2$: $4 + 4 - 6 = 2$, $6 + 8 - 12 = 2$, $12 + 20 - 30 = 2$. So $F + V = E + 2$ — Euler's formula." },
      { type: "choice", kicker: "Find the error",
        prompt: "A shirt costs **\\$12**, and delivery of the whole order is **\\$5**. Kiran writes the total for $s$ shirts as $T = 12 + 5s$. What is wrong?",
        options: [{ t: "The numbers are swapped. \\$12 is paid for each shirt and \\$5 once: $T = 12s + 5$." },
                  { t: "It should be $T = 17s$.", fb: "Delivery is paid once for the whole order, not for each shirt." },
                  { t: "Nothing. Either order is fine.", fb: "Test it with 2 shirts: $12 + 5(2) = 22$, but 2 shirts cost $24 + 5 = 29$." }],
        answer: 0, skill: "Write an equation", hints: ["Step 3: say the sentence aloud. What is paid for each shirt?"],
        why: "The price of each shirt multiplies the number of shirts: $T = 12s + 5$." },
      { type: "equation", kicker: "Use it", prompt: "A choir with **75 members** orders T-shirts: **\\$3 per shirt**, plus **\\$50 for each color** printed. Every member gets a shirt. With $c$ colors and a total cost $C$, write an equation.",
        answer: "C=225+50c", shown: "C = 3(75) + 50c", skill: "Model with an equation",
        near: [{ v: "C=3c+50*75", fb: "The \\$50 is *per color*, so it's the one multiplied by $c$." },
               { v: "C=53*75c", fb: "The \\$3 is paid for each of the 75 shirts; the \\$50 is paid for each *color*." }],
        keys: [["$C$", "C"], ["$c$", "c"], ["$=$", "="], ["$+$", "+"], ["$\\times$", "*"]], placeholder: "C = …",
        hints: ["Shirts: $3 \\times 75$ — that part doesn't depend on the colors.", "Colors: \\$50 each."],
        why: "$C = 3(75) + 50c = 225 + 50c$." }
    ]
  });

  /* ========================= 1.3 · Writing equations to model relationships, 2 */
  var HOW_1_3 = [["Compare", "Look at how the output changes each time the input goes up by 1."], ["Guess", "Turn the pattern into a rule."], ["Test", "Test the rule on **every** row."], ["Write", "Write it as an equation."]];
  LESSONS.push({
    title: "Writing equations to model relationships (part 2)",
    blurb: "Book 1.3 · A table hides a rule. Look for what stays the same, or what happens each time.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A rule **doubles** a number and then **adds 3**. What does 10 become?",
        answer: 23, skill: "Find the rule from a table",
        near: [{ v: 26, fb: "Double first, then add 3: $2(10) + 3$." }, { v: 20, fb: "That is the doubling. Now add 3." }],
        hints: ["$2 \\times 10$, then add 3."], why: "$2(10) + 3 = 23$." },
      { type: "learn", kicker: "Explore",
        prompt: "This machine follows a secret rule. Feed it **at least three** numbers and watch what comes out. Then work out the rule.",
        scene: { type: "machine", rule: "2x + 3", hidden: true, v: "x", name: "y", inputs: [0, 1, 2, 3, 5], gate: true },
        gate: true },
      { type: "learn", kicker: "The idea",
        prompt: "A table hides a rule. To find it, look at the pattern: what happens to the output each time the input goes up by 1? Then test your rule on every row. A rule that fits one row might be luck.",
        scene: { type: "method", how: HOW_1_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "A machine turns 1 into 4, 2 into 7, 3 into 10 and 4 into 13. Watch its rule found.",
        scene: { type: "walk", how: HOW_1_3, rows: [
          { step: 1, m: "4, \\; 7, \\; 10, \\; 13", say: "The outputs go up by 3 each time the input goes up by 1." },
          { step: 2, m: "y = 3x", say: "A first guess: three times the input.",
            ask: { prompt: "The outputs rise by 3 for each 1 of input. What does that suggest?", answer: 0,
                   options: [{ t: "The input is multiplied by 3" }, { t: "3 is added to the input", fb: "Adding 3 would turn 1, 2, 3 into 4, 5, 6. These outputs jump by 3." }] } },
          { step: 3, m: "3(1) = 3", say: "But the table says 4. The guess is 1 too small on every row." },
          { step: 4, m: "y = 3x + 1", say: "Add the 1 and test again: $3(4) + 1 = 13$ ✓. It fits every row." }] },
        gate: true,
        then: "The jump from row to row multiplies $x$. What is left over is added." },
      { type: "guided", kicker: "Together",
        prompt: "Another machine turns 1 into 6, 2 into 11, 3 into 16 and 4 into 21. Find its rule.",
        how: HOW_1_3, skill: "Find the rule from a table",
        steps: [
          { step: 1, ask: "How much does the output rise each time the input goes up by 1?", type: "num", answer: 5, hint: "$11 - 6$.", m: "6, \\; 11, \\; 16, \\; 21", say: "Up 5 each time." },
          { step: 2, ask: "What does that suggest?", type: "choice", answer: 0,
            options: [{ t: "The input is multiplied by 5" }, { t: "5 is added to the input", fb: "Adding 5 would turn 1, 2, 3 into 6, 7, 8. These outputs jump by 5." }],
            m: "y = 5x", say: "A first guess." },
          { step: 3, ask: "Test the first row: $5(1)$ is 5, but the table says 6. How much is missing?", type: "num", answer: 1, hint: "$6 - 5$.", m: "5(1) = 5", say: "1 short, on every row." },
          { step: 4, ask: "Write the rule.", type: "choice", answer: 0,
            options: [{ t: "$y = 5x + 1$" }, { t: "$y = x + 5$", fb: "That gives 6 for an input of 1, but 7 for an input of 2. Test every row." }, { t: "$y = 6x$", fb: "That fits the first row only: $6(2) = 12$, not 11." }],
            m: "y = 5x + 1", say: "Test: $5(4) + 1 = 21$ ✓." }],
        why: "Compare, guess, test, write. Now write the rule of the machine you played with." },
      { type: "equation", kicker: "On your own", prompt: "Write the machine's rule as an equation: $y$ in terms of $x$.", answer: "y=2x+3", shown: "y = 2x + 3", skill: "Find the rule from a table",
        near: [{ v: "y=x+3", fb: "Each step up in $x$ makes $y$ go up by 2, so $x$ is multiplied by 2 first." },
               { v: "y=2x", fb: "That would give 0 for 0. The machine gave 3." },
               { v: "y=3x+2", fb: "Check with 0: $3(0) + 2 = 2$, but the machine gave 3. Which number is multiplied, and which added?" }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"], ["$\\times$", "*"]], placeholder: "y = …",
        hints: ["The multiplier is how much $y$ rises for each step up in $x$. The added number is what $y$ is when $x$ is 0."],
        why: "$y = 2x + 3$. Check: $x = 5 \\to 13$ ✓." },
      { type: "slots",
        prompt: "Tables come from stories. Each table below has a different pattern. **Match each one to the equation that describes it.**",
        slots: [{ id: "A", label: "**A** &nbsp; laps run $n$ → metres $d$: &nbsp; $0 \\to 0,\\; 1 \\to 400,\\; 2.5 \\to 1000,\\; 6 \\to 2400$" },
                { id: "B", label: "**B** &nbsp; metres from home $x$ → from school $y$: &nbsp; $0 \\to 400,\\; 75 \\to 325,\\; 128 \\to 272,\\; 396 \\to 4$" },
                { id: "C", label: "**C** &nbsp; electric bill $b$ → total expenses $e$: &nbsp; $85 \\to 485,\\; 124 \\to 524,\\; 309 \\to 709$" },
                { id: "D", label: "**D** &nbsp; salary $s$ → amount deposited $d$: &nbsp; $872 \\to 472,\\; 998 \\to 598,\\; 2110 \\to 1710$" }],
        cards: [{ t: "$d = 400n$", slot: "A", fb: "A: each lap is 400 m, so metres are 400 times the laps — the output is a *multiple* of the input." },
                { t: "$x + y = 400$", slot: "B", fb: "B: as you move away from home, you get closer to school. The two distances always *add* to the same 400 m." },
                { t: "$e = b + 400$", slot: "C", fb: "C: every total is exactly 400 more than the bill — a fixed amount *added*." },
                { t: "$d = s - 400$", slot: "D", fb: "D: every deposit is exactly 400 less than the salary — a fixed amount *taken away*." },
                { t: "$d = n + 400$" }],
        skill: "Find the rule from a table",
        hints: ["For each table, see what happens from one row to the next. Does the output grow with the input, shrink, or stay a fixed distance from it?", "Test an equation on one row: does it give the second number?"],
        why: "Four patterns you'll see again and again: multiply ($d = 400n$), a sum that never changes ($x + y = 400$), add a constant ($e = b + 400$), subtract a constant ($d = s - 400$)." },
      { type: "learn", kicker: "A harder case",
        prompt: "Not every table climbs by equal steps. A **\\$300** prize is shared equally by the winners.",
        scene: { type: "walk", how: HOW_1_3, rows: [
          { step: 1, m: "300, \\; 150, \\; 100, \\; 75", say: "What each person gets with 1, 2, 3 or 4 winners. The amounts fall, and not by equal steps." },
          { step: 2, m: "w \\times a = 300", say: "A different kind of rule: winners times amount is always 300." },
          { step: 3, m: "4 \\times 75 = 300", say: "It fits every row." },
          { step: 4, m: "a = \\frac{300}{w}", say: "The amount each person gets." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Clare labels **750 books** at a steady speed. At 10 books a minute, how many **minutes** will it take?",
        answer: 75, skill: "Write an equation",
        near: [{ v: 7500, fb: "More books per minute means *fewer* minutes. Divide the books by the speed." }],
        hints: ["Total books divided by books per minute."], why: "$750 \\div 10 = 75$ minutes." },
      { type: "equation", prompt: "If she labels $s$ books per minute, the time is $m$ minutes. Write an equation for $m$.",
        answer: "m=750/s", shown: "m = 750/s", skill: "Write an equation",
        near: [{ v: "m=750s", fb: "Faster labelling means *less* time. The books are divided by the speed." }],
        keys: [["$m$", "m"], ["$s$", "s"], ["$=$", "="], ["$\\frac{a}{b}$", "/"]], placeholder: "m = …",
        hints: ["It's the same move you did for 10 and 15."], why: "$m = \\frac{750}{s}$. (Or $ms = 750$: minutes times speed is always the 750 books.)" },
      { type: "choice", kicker: "Find the error",
        prompt: "A table has the rows $(1, 4)$, $(2, 8)$ and $(3, 12)$. Kiran looks at the first row and writes $y = x + 3$. What is wrong?",
        options: [{ t: "It fits the first row only. Tested on every row, the rule is $y = 4x$." },
                  { t: "The rule is $y = x + 4$.", fb: "That gives 5 for an input of 1. Test it." },
                  { t: "Nothing. $1 + 3 = 4$.", fb: "Now test the second row: $2 + 3 = 5$, but the table says 8." }],
        answer: 0, skill: "Find the rule from a table", hints: ["Step 3: test his rule on the second row."],
        why: "$4(1) = 4$, $4(2) = 8$, $4(3) = 12$: $y = 4x$ fits every row." },
      { type: "equation", kicker: "Use it",
        prompt: "A **bushel** holds 4 **pecks**, and a **peck** holds 8 **quarts**. Write an equation for the number of quarts $q$ in $b$ bushels.",
        answer: "q=32b", shown: "q = 32b", skill: "Write an equation",
        near: [{ v: "q=12b", fb: "The 4 and the 8 are *multiplied* — every bushel has 4 pecks and each peck has 8 quarts." },
               { v: "q=8b", fb: "That's quarts per peck. One bushel is 4 pecks, so it's 4 times as many." }],
        keys: [["$b$", "b"], ["$q$", "q"], ["$=$", "="], ["$\\times$", "*"]], placeholder: "q = …",
        hints: ["Make a mini table: 1 bushel → ? pecks → ? quarts."], why: "1 bushel $= 4 \\times 8 = 32$ quarts, so $q = 32b$." }
    ]
  });

  /* ====================================== 1.4 · Equations and their solutions */
  var HOW_1_4 = [["Substitute", "Put the value in place of the variable."], ["Work out", "Work out each side."], ["Compare", "Equal sides: the value is a solution. Different sides: it is not."], ["Sense", "Ask whether the solution makes sense in the situation."]];
  LESSONS.push({
    title: "Equations and their solutions",
    blurb: "Book 1.4 · A solution is a value that makes an equation true — and it has to make sense in the story.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is $4(3) + 5$?",
        answer: 17, skill: "Solutions",
        near: [{ v: 32, fb: "Multiply first: $4(3) = 12$. Then add 5." }],
        hints: ["$4 \\times 3$, then add 5."], why: "$12 + 5 = 17$." },
      { type: "learn", kicker: "Explore",
        prompt: "A granola bite has **27 calories**. Some come from $x$ grams of carbohydrate, at **4 calories a gram**; **5 calories** come from everything else. That gives the equation $4x + 5 = 27$. **Slide $x$ until both sides are equal.**",
        scene: { type: "tester", a: "4x + 5", b: "27", x: { v: 0, min: 0, max: 10, step: 0.5 }, goal: "equal" },
        gate: true,
        then: "When the two sides match, that value of $x$ is a **solution** of the equation: a value of the variable that makes the equation true. Every other value makes it false." },
      { type: "learn", kicker: "The idea",
        prompt: "A **solution** of an equation is a value of the variable that makes the equation true. Every other value makes it false. To test a value, put it in and see whether the two sides match.",
        scene: { type: "method", how: HOW_1_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Is 7 a solution of this equation? Watch it tested.$$2x + 5 = 19$$",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "2(7) + 5", say: "Put 7 in place of $x$." },
          { step: 2, m: "14 + 5 = 19", say: "Work out the left side." },
          { step: 3, m: "19 = 19", say: "The two sides match, so 7 is a solution.",
            ask: { prompt: "The left side comes to 19, and the right side is 19. What does that tell you?", answer: 0,
                   options: [{ t: "7 is a solution" }, { t: "19 is the solution", fb: "19 is the value of each side. The solution is the value of $x$ that made them match: 7." }] } },
          { step: 3, m: "2(6) + 5 = 17", say: "Try 6 instead: 17, not 19. So 6 is not a solution." }] },
        gate: true,
        then: "A **solution** makes the two sides equal." },
      { type: "guided", kicker: "Together",
        prompt: "Is $h = 7$ a solution of this equation?$$5h - 4 = 31$$",
        how: HOW_1_4, skill: "Solutions",
        steps: [
          { step: 1, ask: "Put 7 in place of $h$.", type: "choice", answer: 0,
            options: [{ t: "$5(7) - 4$" }, { t: "$57 - 4$", fb: "$5h$ means 5 times $h$, not the digits 5 and 7 side by side." }],
            m: "5(7) - 4", say: "Substitute." },
          { step: 2, ask: "Work it out.", type: "num", answer: 31, hint: "$35 - 4$.", m: "35 - 4 = 31", say: "The left side." },
          { step: 3, ask: "Compare it with the right side.", type: "choice", answer: 0,
            options: [{ t: "They match, so 7 is a solution" }, { t: "They differ, so 7 is not a solution", fb: "The left side is 31 and the right side is 31." }],
            m: "31 = 31", say: "Equal sides: a solution." }],
        why: "Substitute, work out, compare. Now write an equation and solve it." },
      { type: "equation", kicker: "On your own",
        prompt: "Jada can earn **\\$12.20 an hour** sorting books. Getting there and back costs **\\$7.15** in bus fare. On one Saturday she takes home **\\$90.45**. With $h$ hours worked, write an equation for that day.",
        answer: "12.2h-7.15=90.45", shown: "12.20h - 7.15 = 90.45", skill: "Write an equation",
        near: [{ v: "12.2h+7.15=90.45", fb: "The bus fare is money she *spends*, so it comes off her earnings." },
               { v: "12.2h=90.45", fb: "\\$90.45 is what she *takes home*, after the fare. Her earnings are a little more." }],
        keys: [["$h$", "h"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"], ["$\\times$", "*"]], placeholder: "e.g. 12.20h - … = …",
        hints: ["Earnings: 12.20 times the hours. Take-home: earnings minus the fare."],
        why: "$12.20h - 7.15 = 90.45$." },
      { type: "num", prompt: "Find the solution: how many **hours** did she work?", answer: 8, skill: "Solutions",
        near: [{ v: 7.4, tol: 0.05, fb: "That's $90.45 \\div 12.2$ — but the \\$7.15 fare has to be added back first, because the fare came out of her earnings." }],
        hints: ["Add the fare back to find her earnings: $90.45 + 7.15$.", "Then divide by \\$12.20 an hour."],
        why: "$90.45 + 7.15 = 97.60$, and $97.60 \\div 12.20 = 8$. Check: $12.20(8) - 7.15 = 97.60 - 7.15 = 90.45$ ✓." },
      { type: "learn", kicker: "A harder case",
        prompt: "With two variables, a solution is a **pair**. Kiran has \\$12 at a fair. Rides cost \\$2 and games \\$3, so $2r + 3g = 12$.",
        scene: { type: "walk", how: HOW_1_4, rows: [
          { step: 1, m: "2(3) + 3(2)", say: "Test the pair $r = 3$, $g = 2$." },
          { step: 2, m: "6 + 6 = 12", say: "Work it out." },
          { step: 3, m: "12 = 12", say: "The pair $(3, 2)$ is a solution. So are $(6, 0)$ and $(0, 4)$. There are many." },
          { step: 4, m: "(4.5, 1)", say: "This pair fits the equation too. But nobody can take half a ride, so it is not an answer to the real problem." }] },
        gate: true },
      { type: "multi", kicker: "Try it",
        prompt: "Kiran has **\\$12** to spend at a fair. Rides cost **\\$2** each and games cost **\\$3** each. With $r$ rides and $g$ games, he spends exactly \\$12: $$2r + 3g = 12$$ A solution now needs **two** numbers, written $(r, g)$. **Which pairs are solutions?**",
        options: [{ t: "$(3, 2)$", ok: true },
                  { t: "$(0, 4)$", ok: true },
                  { t: "$(6, 0)$", ok: true },
                  { t: "$(2, 3)$", fb: "$2(2) + 3(3) = 4 + 9 = 13$, not 12. Careful: the pair is $(r, g)$ — rides first." },
                  { t: "$(5, 1)$", fb: "$2(5) + 3(1) = 13$, not 12." }],
        skill: "Solutions with two variables",
        hints: ["For each pair, put $r$ and $g$ into $2r + 3g$. Is it 12?"],
        why: "$(3,2)$: $6 + 6 = 12$ ✓. $(0,4)$: $0 + 12$ ✓. $(6,0)$: $12 + 0$ ✓. $(2,3)$ gives 13 and $(5,1)$ gives 13." },
      { type: "table", prompt: "There are many solutions. Fill in the rides Kiran can afford for each number of games.",
        head: ["games $g$", "rides $r$"], rows: [[0, null], [1, null], [2, 3], [3, null], [4, 0]],
        answers: [[0, 1, 6], [1, 1, 4.5], [3, 1, 1.5]], skill: "Solutions with two variables",
        hints: ["Put the number of games into $2r + 3g = 12$ and solve for $r$. For $g = 2$: $2r + 6 = 12$, so $r = 3$."],
        why: "$g = 0$: $2r = 12$, $r = 6$. $g = 1$: $2r = 9$, $r = 4.5$. $g = 3$: $2r = 3$, $r = 1.5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran tests $x = 4$ in $3x - 7 = 20$. He writes: “$3(4) - 7 = 5$, so the solution is 5.” What is wrong?",
        options: [{ t: "5 is the value of the left side. It is not 20, so 4 is **not** a solution." },
                  { t: "$3(4) - 7$ is not 5.", fb: "$12 - 7$ is 5. The arithmetic is right." },
                  { t: "Nothing. The solution is 5.", fb: "Test 5: $3(5) - 7 = 8$, which is not 20 either." }],
        answer: 0, skill: "Solutions", hints: ["Step 3: compare the left side with the right side."],
        why: "A solution is a value of $x$ that makes both sides equal. Here $x = 9$ works: $27 - 7 = 20$." },
      { type: "num", kicker: "Use it", prompt: "A pool holds 15,000 gallons and loses **200 gallons a day**. After how many days, $d$, does it hold **9,000** gallons? Solve $15000 - 200d = 9000$.",
        pre: "$d =$", answer: 30, skill: "Solutions in context",
        near: [{ v: 75, fb: "That's $15000 \\div 200$ — the days until the pool is *empty*. We want the days until 9,000 are left." }],
        hints: ["How many gallons must it lose? $15000 - 9000$."], why: "It must lose $15000 - 9000 = 6000$ gallons, at 200 a day: $6000 \\div 200 = 30$ days." }
    ]
  });

  /* ============================================ 1.5 · Equations and their graphs */
  var HOW_1_5 = [["Solutions", "Find a few pairs that make the equation true."], ["Plot", "Plot each pair as a point."], ["Line", "Join them. Every point on the line is a solution."], ["Test", "To test any point, put its coordinates into the equation."]];
  LESSONS.push({
    title: "Equations and their graphs",
    blurb: "Book 1.5 · The graph of an equation is a picture of all its solutions. Every point on it works; every point off it doesn't.",
    mins: 12, v: 4,
    steps: [
      { type: "choice", kicker: "Warm up",
        prompt: "Is the pair $r = 3$, $g = 2$ a solution of $2r + 3g = 12$?",
        options: [{ t: "Yes: $6 + 6 = 12$" }, { t: "No", fb: "$2(3) + 3(2) = 6 + 6$, which is 12." }],
        answer: 0, skill: "Graph solutions", hints: ["Put 3 in for $r$ and 2 in for $g$."],
        why: "$2(3) + 3(2) = 12$. The pair makes the equation true." },
      { type: "plane", kicker: "Explore",
        prompt: "Back at the fair: Kiran has \\$12, rides cost \\$2 ($r$) and games cost \\$3 ($g$), so $2r + 3g = 12$. Each solution is a point $(r, g)$. **Click the solution where he goes on 3 rides.**",
        x: [0, 8], y: [0, 6], axisLabels: ["r", "g"], click: "point", answer: { point: [3, 2] }, skill: "Graph solutions",
        clickFb: function (c) { return "At $(" + c[0] + ", " + c[1] + ")$ he spends $2(" + c[0] + ") + 3(" + c[1] + ") = " + (2 * c[0] + 3 * c[1]) + "$. We need exactly 12 with $r = 3$: $6 + 3g = 12$."; },
        hints: ["Put $r = 3$ into the equation and find $g$."], why: "$2(3) + 3g = 12$, so $3g = 6$ and $g = 2$: the point $(3, 2)$." },
      { type: "learn", kicker: "Explore",
        prompt: "You've plotted three solutions. Slide $r$ and watch the solution move. **What do you notice about where they fall?**",
        scene: { type: "plane", x: [0, 8], y: [0, 6], axisLabels: ["r", "g"], gate: true,
          params: { r: { v: 0, min: 0, max: 6, step: 1.5, label: "rides $r$" } },
          fns: [{ f: "(12 - 2*x)/3", color: "blue" }],
          marks: [{ x: function (P) { return P.r; }, y: function (P) { return (12 - 2 * P.r) / 3; }, color: "orange", r: 7,
                    label: function (P) { return "(" + num(P.r) + ", " + num((12 - 2 * P.r) / 3) + ")"; } }],
          readout: function (st) { var r = st.params.r, g = (12 - 2 * r) / 3; return "$2(" + num(r) + ") + 3(" + num(g) + ") = " + num(2 * r + 3 * g) + "$ ✓"; } },
        gate: true,
        then: "Every solution lands on one straight line. That line is the **graph** of the equation: a picture of *all* its solutions. A point is on the graph exactly when its coordinates make the equation true." },
      { type: "learn", kicker: "The idea",
        prompt: "An equation in two variables has many solutions. Plot them and they fall on a line. That line is the **graph** of the equation: a picture of all its solutions at once. A point is on the graph exactly when it makes the equation true.",
        scene: { type: "method", how: HOW_1_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the graph of $2r + 3g = 12$ built from its solutions.",
        scene: { type: "walk", how: HOW_1_5, rows: [
          { step: 1, m: "(3, 2), \\; (0, 4), \\; (6, 0)", say: "Three solutions." },
          { step: 2, m: "\\text{three points}", say: "Each pair is a point: rides across, games up." },
          { step: 3, m: "\\text{one straight line}", say: "They line up, and every other solution lands on the same line." },
          { step: 4, m: "2(1.5) + 3(3) = 12", say: "Test a point on the line, $(1.5, 3)$: true ✓. A point off the line fails.",
            ask: { prompt: "How can you tell whether a point is on the graph of an equation?", answer: 0,
                   options: [{ t: "Put its coordinates into the equation" }, { t: "See whether its numbers are whole", fb: "Points with fractions can be on the graph too. What matters is whether the equation comes out true." }] } }] },
        gate: true,
        then: "Every point on the graph is a solution. Every point off it is not." },
      { type: "guided", kicker: "Together",
        prompt: "Now build the graph of $y = 2x - 3$.",
        how: HOW_1_5, skill: "Points on a graph",
        steps: [
          { step: 1, ask: "What is $y$ when $x = 0$?", type: "num", pre: "$y =$", answer: -3, near: [{ v: 3, fb: "$2(0) - 3$ is $-3$." }], hint: "$2(0) - 3$.", m: "(0, -3)", say: "One solution." },
          { step: 1, ask: "And when $x = 2$?", type: "num", pre: "$y =$", answer: 1, hint: "$2(2) - 3$.", m: "(2, 1)", say: "A second solution." },
          { step: 3, ask: "Plot those two points and join them. What is every point on that line?", type: "choice", answer: 0,
            options: [{ t: "A solution of $y = 2x - 3$" }, { t: "Only a guess", fb: "The line is the graph: all the solutions, and nothing else." }],
            m: "\\text{the graph of } y = 2x - 3", say: "Two points fix the line." },
          { step: 4, ask: "Is $(4, 6)$ on the graph?", type: "choice", answer: 0,
            options: [{ t: "No: $2(4) - 3 = 5$, not 6" }, { t: "Yes", fb: "Put $x = 4$ in: $2(4) - 3 = 5$. The point on the graph is $(4, 5)$." }],
            m: "2(4) - 3 = 5", say: "$(4, 6)$ is off the line." }],
        why: "Solutions, plot, line, test. Now find more solutions on the fair's graph." },
      { type: "plane", kicker: "On your own", prompt: "Now a solution with **no rides** at all ($r = 0$).", x: [0, 8], y: [0, 6], axisLabels: ["r", "g"], click: "point", answer: { point: [0, 4] }, skill: "Graph solutions",
        clickFb: function (c) { return "$2(" + c[0] + ") + 3(" + c[1] + ") = " + (2 * c[0] + 3 * c[1]) + "$. Try again: with no rides, all \\$12 goes on games at \\$3 each."; },
        hints: ["All the money goes on games."], why: "$3g = 12$, so $g = 4$: the point $(0, 4)$." },
      { type: "plane", prompt: "And one with **no games** ($g = 0$).", x: [0, 8], y: [0, 6], axisLabels: ["r", "g"], click: "point", answer: { point: [6, 0] }, skill: "Graph solutions",
        clickFb: function (c) { return "$2(" + c[0] + ") + 3(" + c[1] + ") = " + (2 * c[0] + 3 * c[1]) + "$. With no games, \\$12 goes on rides at \\$2 each."; },
        hints: ["All the money goes on rides."], why: "$2r = 12$, so $r = 6$: the point $(6, 0)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Two points are enough for a line, and the easiest two are on the axes. Watch $3x + 2y = 12$ graphed that way.",
        scene: { type: "walk", how: HOW_1_5, rows: [
          { step: 1, m: "3x = 12, \\; x = 4", say: "Put $y = 0$. The line crosses the $x$-axis at $(4, 0)$." },
          { step: 1, m: "2y = 12, \\; y = 6", say: "Put $x = 0$. It crosses the $y$-axis at $(0, 6)$." },
          { step: 2, m: "(4, 0), \\; (0, 6)", say: "Plot the two crossings." },
          { step: 3, m: "3x + 2y = 12", say: "Join them. That is the graph." }] },
        gate: true },
      { type: "plane", kicker: "Try it", prompt: "Graph the equation: drag $A$ to the $x$-axis crossing and $B$ to the $y$-axis crossing. The line goes through them.",
        x: [-2, 8], y: [-2, 8], gate: true,
        points: [{ id: "A", x: 1, y: 1, drag: true, label: "A" }, { id: "B", x: 2, y: 3, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        fns: [{ f: "(12 - 3*x)/2", color: "green", dashed: true }],
        goal: function (st) { var a = st.pt("A"), b = st.pt("B"); return (a.x === 4 && a.y === 0 && b.x === 0 && b.y === 6) || (b.x === 4 && b.y === 0 && a.x === 0 && a.y === 6); },
        fb: function (st) { return "The line should match the dashed green graph of $3x + 2y = 12$. $A$ and $B$ need to sit exactly on the two axis crossings."; },
        answer: { points: { A: [4, 0], B: [0, 6] } }, skill: "Graph a line",
        hints: ["The crossings are $(4, 0)$ and $(0, 6)$."],
        why: "Two points determine a line. Plot the intercepts $(4, 0)$ and $(0, 6)$ and join them." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $(2, 3)$ is on the graph of $y = 2x - 3$, “because it has a 2 and a 3 in it”. What is wrong?",
        options: [{ t: "Test it: $2(2) - 3 = 1$, not 3. The point is off the graph." },
                  { t: "It is on the graph, but for another reason.", fb: "Put $x = 2$ into the equation and see what $y$ has to be." },
                  { t: "Nothing. The numbers match the equation.", fb: "Matching digits prove nothing. Put the coordinates in." }],
        answer: 0, skill: "Points on a graph", hints: ["Step 4: put $x = 2$ into $y = 2x - 3$."],
        why: "At $x = 2$ the graph has $y = 1$. The point on the line is $(2, 1)$." },
      { type: "choice", kicker: "Use it",
        prompt: "A tank holds **100 litres** and is filled at **15 litres a minute**. Its graph is below. **What does the point $(4, 160)$ mean?**" +
          fig({ x: [0, 8], y: [0, 240], u: 26, step: 2, alt: "A line rising from 100 at zero minutes, through the point at 4 minutes and 160 litres.",
                items: [{ line: [[0, 100], [8, 220]], c: "blue" }, { pt: [4, 160], name: "(4, 160)", at: "se", c: "orange" }, { pt: [0, 100], name: "(0, 100)", at: "ne", c: "purple" }] }),
        options: [{ t: "After 4 minutes the tank holds 160 litres" },
                  { t: "The tank holds 4 litres after 160 minutes", fb: "The first number is the horizontal one — here, minutes. The second is litres." },
                  { t: "The tank fills at 160 litres a minute", fb: "The rate is how *steeply* the line rises, not a point on it." }],
        answer: 0, skill: "Meaning of a point", hints: ["Which axis is minutes? Which is litres?"],
        why: "$(4, 160)$: after 4 minutes, 160 litres. Check: $100 + 15(4) = 160$ ✓." }
    ]
  });
  /* ================================================ 1.6 · Equivalent equations */
  var HOW_1_6 = [["Same move", "Choose one move: add, subtract, multiply or divide by a number that is not 0."], ["Both sides", "Do it to **both** sides."], ["New equation", "The result is an equivalent equation: it has the same solution."], ["Repeat", "Keep going until the variable is alone."]];
  LESSONS.push({
    title: "Equivalent equations",
    blurb: "Book 1.6 · Different-looking equations can say the same thing: they share every solution.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "If $x = 4$, what is $2x + 3$?",
        answer: 11, skill: "Equivalent equations",
        near: [{ v: 27, fb: "$2x$ means 2 times $x$: $2(4) + 3$." }, { v: 9, fb: "Multiply first: $2(4) = 8$, then add 3." }],
        hints: ["$2 \\times 4$, then add 3."], why: "$2(4) + 3 = 11$. So $x = 4$ makes $2x + 3 = 11$ true." },
      { type: "learn", kicker: "Explore",
        prompt: "Here is $2x + 3 = 11$ on a balance. Take blocks off **both** sides until only $x$ is left, and watch the answer to $x$.",
        scene: { type: "balance", L: { x: 2, c: 3 }, R: { x: 0, c: 11 }, x: 4, gate: "solve" },
        gate: true,
        then: "Every move you made was done to **both** sides, and the solution never moved: $x = 4$ the whole way. **Equivalent equations** are equations with exactly the same solutions. A move that turns an equation into an equivalent one is an **acceptable move**." },
      { type: "learn", kicker: "The idea",
        prompt: "Different-looking equations can say the same thing. $2x + 3 = 11$, $2x = 8$ and $x = 4$ all have the same solution. They are **equivalent equations**. You get from one to the next by doing the same thing to both sides.",
        scene: { type: "method", how: HOW_1_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one equation turned into simpler, equivalent ones.$$3x + 2 = 14$$",
        scene: { type: "walk", how: HOW_1_6, rows: [
          { step: 1, m: "3x + 2 = 14", say: "Choose a move: subtract 2." },
          { step: 2, m: "3x + 2 - 2 = 14 - 2", say: "Do it to both sides." },
          { step: 3, m: "3x = 12", say: "An equivalent equation. $x = 4$ still works: $3(4) = 12$.",
            ask: { prompt: "We subtracted 2 from both sides. Does the new equation have the same solution?", answer: 0,
                   options: [{ t: "Yes. The same thing was done to both sides" }, { t: "No. Changing an equation changes its solution", fb: "The two sides were equal. Taking the same amount from each keeps them equal for the same $x$." }] } },
          { step: 4, m: "x = 4", say: "Divide both sides by 3. The variable is alone." }] },
        gate: true,
        then: "**Equivalent equations** have exactly the same solutions." },
      { type: "guided", kicker: "Together",
        prompt: "Now you make the moves.$$5x - 4 = 16$$",
        how: HOW_1_6, skill: "Equivalent equations",
        steps: [
          { step: 1, ask: "Which move gets rid of the $-4$?", type: "choice", answer: 0,
            options: [{ t: "Add 4" }, { t: "Subtract 4", fb: "Subtracting 4 again would give $-8$. Adding 4 undoes subtracting 4." }],
            m: "5x - 4 + 4 = 16 + 4", say: "Add 4, to both sides." },
          { step: 3, ask: "What is the new equation?", type: "choice", answer: 0,
            options: [{ t: "$5x = 20$" }, { t: "$5x = 12$", fb: "Add 4 to the right side: $16 + 4$." }, { t: "$5x = 16$", fb: "The 4 must be added to the right side as well." }],
            m: "5x = 20", say: "Equivalent to the first: the same solution." },
          { step: 4, ask: "Divide both sides by 5. What is $x$?", type: "num", pre: "$x =$", answer: 4, hint: "$20 \\div 5$.", m: "x = 4", say: "The variable is alone." }],
        why: "Same move, both sides, again and again. Now sort the moves that are allowed." },
      { type: "sort", kicker: "On your own", prompt: "Here's $2x + 3 = 11$ again. **Which moves keep the solution, and which break it?**",
        bins: ["Keeps it (acceptable)", "Breaks it"],
        cards: [{ t: "Subtract 3 from both sides", bin: 0 },
                { t: "Subtract 3 from just the left side", bin: 1, fb: "Now the two sides no longer balance: you changed one and left the other." },
                { t: "Multiply both sides by 5", bin: 0 },
                { t: "Multiply the left side by 5 and the right by 2", bin: 1, fb: "Both sides must get the *same* treatment — the same number, both sides." },
                { t: "Add $x$ to both sides", bin: 0 },
                { t: "Divide both sides by 2", bin: 0 },
                { t: "Swap the two sides", bin: 0, fb: "If $a = b$ then $b = a$: the same statement said the other way round." },
                { t: "Add 3 to the left side and subtract 3 from the right", bin: 1, fb: "That's two *different* things done to two sides." }],
        skill: "Acceptable moves",
        hints: ["Ask: was the *same* thing done to *both* sides?"],
        why: "Do the same thing to both sides (add, subtract, multiply or divide by the same number) and the equation stays balanced — its solutions don't change. Swap the sides and it's the same claim." },
      { type: "num",
        prompt: "Use acceptable moves on $2x + 3 = 11$ until you have an equivalent equation with just $x$ on the left: $x = \\;?$",
        pre: "$x =$", answer: 4, skill: "Equivalent equations",
        near: [{ v: 8, fb: "$2x = 8$ is one move along. Divide both sides by 2 too." }, { v: 7, fb: "$11 - 3 = 8$, not 7. And you still need to divide by 2." }],
        hints: ["Which move undoes the $+3$? Then which undoes the $\\times 2$?"],
        why: "Subtract 3 from both sides: $2x = 8$. Divide both sides by 2: $x = 4$. Solving an equation is a chain of acceptable moves ending in $x = $ a number." },
      { type: "learn", kicker: "A harder case",
        prompt: "Multiplying works too, as long as **every** term is multiplied.$$\\frac{x}{2} + 1 = 5$$",
        scene: { type: "walk", how: HOW_1_6, rows: [
          { step: 1, m: "\\frac{x}{2} + 1 = 5", say: "Choose a move: multiply by 2, to clear the fraction." },
          { step: 2, m: "2 \\cdot \\frac{x}{2} + 2 \\cdot 1 = 2 \\cdot 5", say: "Both sides, and every term. The 1 is multiplied as well." },
          { step: 3, m: "x + 2 = 10", say: "An equivalent equation, without the fraction." },
          { step: 4, m: "x = 8", say: "Subtract 2 from both sides." }] },
        gate: true },
      { type: "multi", kicker: "Try it", prompt: "Which of these equations are equivalent to $3x - 6 = 12$?",
        options: [{ t: "$x - 2 = 4$", ok: true },
                  { t: "$3x = 18$", ok: true },
                  { t: "$6x - 12 = 24$", ok: true },
                  { t: "$x = 6$", ok: true },
                  { t: "$3x - 6 = 13$", fb: "Changing just the right side to 13 gives a different solution." },
                  { t: "$x - 6 = 12$", fb: "$x - 6 = 12$ has $x = 18$. Dividing the left by 3 means dividing the right by 3 too." }],
        skill: "Equivalent equations",
        hints: ["Solve the original first, then test each one at that value.", "The original: $3x - 6 = 12$, so $3x = 18$ and $x = 6$."],
        why: "The solution is $x = 6$. Check each: $6 - 2 = 4$ ✓, $18 = 18$ ✓, $36 - 12 = 24$ ✓, $x = 6$ ✓. The last two fail: $3(6) - 6 = 12 \\ne 13$, and $6 - 6 = 0 \\ne 12$." },
      { type: "sort",
        prompt: "The solution of $4x = 20$ is $x = 5$. **Sort these equations: does each have that same solution?**",
        bins: ["Solution is 5", "Solution isn't 5"],
        cards: [{ t: "$x = 5$", bin: 0 }, { t: "$2x = 10$", bin: 0 }, { t: "$x + 1 = 6$", bin: 0 },
                { t: "$\\frac{x}{5} = 1$", bin: 0 }, { t: "$4x - 20 = 0$", bin: 0 },
                { t: "$4x = 24$", bin: 1, fb: "Divide by 4: $x = 6$. The right side changed from 20 to 24." },
                { t: "$4x + 1 = 20$", bin: 1, fb: "Add 1 to the left only and the solution moves: $4x = 19$." },
                { t: "$x - 5 = 5$", bin: 1, fb: "$x - 5 = 5$ gives $x = 10$." }],
        skill: "Equivalent equations", hints: ["Put $x = 5$ into each. Does the left side equal the right?"],
        why: "Testing $x = 5$ in each equation settles it: the ones that balance share the solution, so they're equivalent to $4x = 20$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran starts from $2x + 3 = 11$ and writes $2x = 11$. “I subtracted 3,” he says. What is wrong?",
        options: [{ t: "He subtracted 3 from the left side only. The right side must become 8." },
                  { t: "He should have added 3.", fb: "Subtracting 3 is the right move. It has to be done to both sides." },
                  { t: "Nothing. $2x = 11$ is equivalent.", fb: "Test $x = 4$: it solves the first equation, but $2(4) = 8$, not 11." }],
        answer: 0, skill: "Acceptable moves", hints: ["Step 2: both sides."],
        why: "$2x + 3 - 3 = 11 - 3$ gives $2x = 8$. A move made on one side only breaks the equation." },
      { type: "choice", kicker: "Use it",
        prompt: "Three friends split a bill evenly and each pays \\$20. Two students describe it: **Ana** writes $3p = 60$ and **Ben** writes $p = 20$, where $p$ is what each pays. **Are their equations equivalent?**",
        options: [{ t: "Yes — they have the same solution, $p = 20$, and describe the same situation" },
                  { t: "No — they look different", fb: "Looking different doesn't matter. What counts is whether they have the same solutions: both are solved by $p = 20$." },
                  { t: "No — Ben's is missing the 3", fb: "Ben divided both sides by 3, an acceptable move. That doesn't change the solution." }],
        answer: 0, skill: "Equivalent equations",
        hints: ["Divide both sides of Ana's equation by 3."], why: "Divide both sides of $3p = 60$ by 3 and you get $p = 20$. Equivalent equations can describe the same situation in different ways — some are just easier to read the answer from." }
    ]
  });

  /* ============================== 1.7 · Explaining steps for rewriting equations */
  var HOW_1_7 = [["Collect", "Take the $x$ terms to one side."], ["Look", "See what is left."], ["Decide", "An $x$ is left: one solution. A false statement like $3 = 5$: none. A true one like $3 = 3$: every number."]];
  LESSONS.push({
    title: "Explaining steps for rewriting equations",
    blurb: "Book 1.7 · Some moves are safe and some quietly lose solutions. Some equations have none at all.",
    mins: 12, v: 4,
    steps: [
      { type: "multi", kicker: "Warm up",
        prompt: "Zero is an easy number to test. **Which of these equations is true when $x = 0$?** Pick every one.",
        options: [{ t: "$x^2 = 5x$", ok: true },
                  { t: "$3x = 2x$", ok: true },
                  { t: "$x + 4 = 4$", ok: true },
                  { t: "$x + 4 = 6$", fb: "Put in 0: the left side is 4, the right side is 6." },
                  { t: "$5x = 2x + 3$", fb: "At $x = 0$: $0 = 3$. False." }],
        skill: "Solutions",
        hints: ["Replace every $x$ with 0 and simplify each side."],
        why: "At $x = 0$: $0 = 0$ ✓, $0 = 0$ ✓, $4 = 4$ ✓. The others give $4 = 6$ and $0 = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "Now an equation that seems to be solvable. **Slide $x$** — can you make the two sides equal?",
        scene: { type: "tester", a: "2x + 3", b: "2x + 5", x: { v: 0, min: -10, max: 10 }, goal: "agree3" },
        gate: true,
        then: "The left side is always exactly 2 smaller than the right, whatever $x$ is. Now solve it by moves: take $2x$ from both sides and you get $3 = 5$. The moves were all acceptable — so a *false* statement means the original has **no solution**." },
      { type: "learn", kicker: "The idea",
        prompt: "Not every equation has exactly one solution. Some have none, and some are true for every number. And one move that looks harmless, dividing by $x$, can quietly throw a solution away.",
        scene: { type: "method", how: HOW_1_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch what the moves reveal about this equation.$$2x + 3 = 2x + 5$$",
        scene: { type: "walk", how: HOW_1_7, rows: [
          { step: 1, m: "2x + 3 - 2x = 2x + 5 - 2x", say: "Subtract $2x$ from both sides." },
          { step: 2, m: "3 = 5", say: "The $x$ terms have gone, and what is left is false.",
            ask: { prompt: "$3 = 5$ is false. What does that say about the equation?", answer: 0,
                   options: [{ t: "No value of $x$ makes it true" }, { t: "The solution is $x = 0$", fb: "There is no $x$ left to solve for. The statement is false whatever $x$ is." }] } },
          { step: 3, m: "\\text{no solution}", say: "The left side is always 2 less than the right, so they can never be equal." }] },
        gate: true,
        then: "The moves were all allowed. A false result means the equation never was true for any $x$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find out what kind of equation this is.$$2(x + 3) = 2x + 6$$",
        how: HOW_1_7, skill: "Number of solutions",
        steps: [
          { step: 1, ask: "Expand the left side, $2(x + 3)$.", type: "choice", answer: 0,
            options: [{ t: "$2x + 6$" }, { t: "$2x + 3$", fb: "The 2 multiplies both terms in the bracket: $2 \\cdot 3 = 6$." }],
            m: "2x + 6 = 2x + 6", say: "Both sides are the same expression." },
          { step: 2, ask: "Subtract $2x$ from both sides. What is left?", type: "choice", answer: 0,
            options: [{ t: "$6 = 6$" }, { t: "$x = 6$", fb: "The $x$ terms cancel on both sides. No $x$ is left." }],
            m: "6 = 6", say: "True, and there is no $x$ in it." },
          { step: 3, ask: "$6 = 6$ is true whatever $x$ is. How many solutions are there?", type: "choice", answer: 0,
            options: [{ t: "Every number is a solution" }, { t: "None", fb: "None happens when what is left is **false**, like $3 = 5$." }, { t: "One: $x = 6$", fb: "There is no $x$ left. The statement is true for every $x$." }],
            m: "\\text{every number}", say: "An equation like this is called an **identity**." }],
        why: "Collect, look, decide. Now predict before you solve." },
      { type: "sort", kicker: "On your own",
        prompt: "**Before solving anything**, sort by what will happen: one solution, none, or every number. (Take the $x$ terms to one side — do they cancel?)",
        bins: ["One solution", "No solution", "Every number"],
        cards: [{ t: "$5x + 2 = 3x + 8$", bin: 0 },
                { t: "$4x - 1 = 4x + 2$", bin: 1, fb: "Take $4x$ from both sides: $-1 = 2$. False for every $x$: no solution." },
                { t: "$2(x - 3) = 2x - 6$", bin: 2, fb: "Share the 2: the left is $2x - 6$, exactly the right. Every number works." },
                { t: "$7 - x = 9 - x$", bin: 1, fb: "Add $x$ to both sides: $7 = 9$. False, always." },
                { t: "$\\dfrac{x}{2} + 1 = \\dfrac{x}{2} + 1$", bin: 2, fb: "Both sides are identical. Every number works." },
                { t: "$6x = 2x + 12$", bin: 0 }],
        skill: "Number of solutions",
        hints: ["If the $x$ terms cancel, look at what's left: true (every number) or false (none)."],
        why: "One solution when an $x$ is left after the moves. When the $x$'s cancel, a true leftover ($3 = 3$) means every number; a false one ($3 = 5$) means none." },
      { type: "num",
        prompt: "Change one number and the answer changes. The equation $2(x + k) = 2x + 10$ is true for **every** number $x$. What is $k$?",
        pre: "$k =$", answer: 5, skill: "Number of solutions",
        near: [{ v: 10, fb: "Share the 2: $2(x + k) = 2x + 2k$. Then $2k$ has to equal 10." }],
        hints: ["Share the 2 across the bracket. For both sides to be identical, what must $2k$ equal?"],
        why: "$2(x + k) = 2x + 2k$. It matches $2x + 10$ when $2k = 10$, so $k = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "One move is **not** safe. Watch what dividing by $x$ does.$$x^2 = 5x$$",
        scene: { type: "walk", how: HOW_1_7, rows: [
          { step: 1, m: "\\frac{x^2}{x} = \\frac{5x}{x}", say: "A tempting move: divide both sides by $x$." },
          { step: 2, m: "x = 5", say: "One solution appears." },
          { step: 2, m: "0^2 = 5(0)", say: "But $x = 0$ makes the original true as well, and it has vanished." },
          { step: 3, m: "x = 0 \\quad\\text{or}\\quad x = 5", say: "Dividing by $x$ is dividing by a number that might be 0. That move can lose a solution." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "**Which moves are always safe, and which can lose (or invent) solutions?**",
        bins: ["Always safe", "Can go wrong"],
        cards: [{ t: "Add 4 to both sides", bin: 0 },
                { t: "Divide both sides by 3", bin: 0 },
                { t: "Subtract $x$ from both sides", bin: 0 },
                { t: "Multiply both sides by $-2$", bin: 0 },
                { t: "Divide both sides by $x$", bin: 1, fb: "$x$ might be 0, and you can't divide by 0. The case $x = 0$ gets lost." },
                { t: "Divide both sides by $(x - 1)$", bin: 1, fb: "If $x = 1$ then $x - 1 = 0$ — the same problem in disguise." },
                { t: "Multiply both sides by 0", bin: 1, fb: "Everything becomes $0 = 0$, which is true for *every* $x$ — you invented solutions that weren't there." }],
        skill: "Acceptable moves",
        hints: ["A move is safe if it can be undone. Can you always undo it? Multiplying by 0 can't be undone."],
        why: "Adding, subtracting, and multiplying or dividing by a **nonzero number** can always be undone, so the solutions don't change. Dividing by something that could be zero, or multiplying by zero, can't be undone." },
      { type: "choice", prompt: "Why can't we divide both sides of an equation by $0$?",
        options: [{ t: "Nothing multiplied by 0 gives a different number, so “dividing by 0” has no answer at all" },
                  { t: "Because the answer is 0", fb: "$6 \\div 0$ isn't 0. There is no number you can multiply by 0 to get 6." },
                  { t: "Because it makes the numbers too large", fb: "It isn't about size. $6 \\div 0$ has no answer, however large you allow." }],
        answer: 0, skill: "Acceptable moves", hints: ["What number, times 0, makes 6?"],
        why: "$6 \\div 0$ would need a number that makes $0 \\times ? = 6$, and nothing does. So dividing by 0 isn't an acceptable move — the result isn't a number." },
      { type: "choice", kicker: "Find the error",
        prompt: "A student solves $3x = 3x + 1$ by subtracting $3x$ from both sides and gets $0 = 1$, then writes “$x = 0$.” What's wrong?",
        options: [{ t: "$0 = 1$ is false, so the equation has no solution — “$x = 0$” isn't an answer to it" },
                  { t: "Nothing is wrong: subtracting $3x$ gives $x = 0$", fb: "After subtracting, the $x$'s are *gone*. There's no $x$ left to equal anything." },
                  { t: "They should have divided by $x$ first", fb: "That would be the unsafe move from earlier." }],
        answer: 0, skill: "Number of solutions",
        hints: ["What does “$0 = 1$” say? Is it ever true?"],
        why: "The moves were acceptable, so $0 = 1$ describes exactly the same solutions as the original. A false statement has none: the equation has **no solution**." },
      { type: "choice", kicker: "Use it", prompt: "Now change $k$ to 3: $2(x + 3) = 2x + 10$. How many solutions does it have?",
        options: [{ t: "None — it works out to $6 = 10$, which is never true" },
                  { t: "Every number", fb: "That was $k = 5$. With $k = 3$ the two sides differ by 4, whatever $x$ is." },
                  { t: "Exactly one", fb: "The $x$ terms cancel, so no value of $x$ can make the two sides differ by a different amount." }],
        answer: 0, skill: "Number of solutions",
        hints: ["Share the 2, then take $2x$ from both sides."],
        why: "$2x + 6 = 2x + 10$ leaves $6 = 10$: false whatever $x$ is. Any $k$ other than 5 gives no solution." }
    ]
  });

  /* ====================== 1.8 · Choosing the correct variable to solve for, part 1 */
  var HOW_1_8 = [["Question", "Decide which quantity you keep being asked for."], ["Target", "That variable must end up alone on one side."], ["Undo", "Undo what is done to it, on both sides."], ["Use", "Put numbers into the new form."]];
  LESSONS.push({
    title: "Choosing the variable to solve for (part 1)",
    blurb: "Book 1.8 · Rearrange an equation so the thing you keep looking for is on its own — then finding it is a single calculation.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A parallelogram has a base of **5 inches** and a height of **3 inches**. Its area is base times height. What is the area?",
        answer: 15, post: "in²", skill: "Solve for a variable",
        near: [{ v: 8, fb: "That is $5 + 3$. Multiply for an area." }],
        hints: ["$5 \\times 3$."], why: "$5 \\times 3 = 15$ square inches." },
      { type: "learn", kicker: "The idea",
        prompt: "The same relationship can answer different questions. $A = 3b$ gives the area from the base. If you keep being asked for the **base**, rearrange it once: $b = \\frac{A}{3}$. That is **solving for a variable**.",
        scene: { type: "method", how: HOW_1_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Tickets cost **\\$5** each, plus a **\\$20** fee: $C = 5n + 20$. You keep being asked how many tickets a sum of money buys. Watch the equation rearranged.",
        scene: { type: "walk", how: HOW_1_8, rows: [
          { step: 1, m: "C = 5n + 20", say: "The question is always about $n$, the number of tickets." },
          { step: 2, m: "n = \\; ?", say: "So $n$ must end up alone." },
          { step: 3, m: "C - 20 = 5n", say: "Subtract 20 from both sides.",
            ask: { prompt: "To get $n$ alone in $C = 5n + 20$, which is undone first?", answer: 0,
                   options: [{ t: "The $+ 20$" }, { t: "The $\\times 5$", fb: "Undo in reverse order: the 20 was added last, so it is removed first." }] } },
          { step: 3, m: "n = \\frac{C - 20}{5}", say: "Divide both sides by 5." },
          { step: 4, m: "n = \\frac{95 - 20}{5} = 15", say: "With \\$95 you get 15 tickets." }] },
        gate: true,
        then: "**Solving for a variable** means rearranging until that variable is alone on one side." },
      { type: "guided", kicker: "Together",
        prompt: "A rectangle's perimeter is 48 cm: $2l + 2w = 48$. You will be given widths and asked for lengths. Solve for $l$.",
        how: HOW_1_8, skill: "Solve for a variable",
        steps: [
          { step: 2, ask: "Which variable must end up alone?", type: "choice", answer: 0,
            options: [{ t: "$l$" }, { t: "$w$", fb: "You are given the width. The length is what you keep being asked for." }],
            m: "l = \\; ?", say: "The target is $l$." },
          { step: 3, ask: "Subtract $2w$ from both sides.", type: "choice", answer: 0,
            options: [{ t: "$2l = 48 - 2w$" }, { t: "$2l = 48 + 2w$", fb: "Subtracting $2w$ from the right side gives $48 - 2w$." }],
            m: "2l = 48 - 2w", say: "The $2w$ moves across." },
          { step: 3, ask: "Divide both sides by 2.", type: "choice", answer: 0,
            options: [{ t: "$l = 24 - w$" }, { t: "$l = 48 - w$", fb: "Divide the 48 by 2 as well." }, { t: "$l = 24 - 2w$", fb: "Divide the $2w$ by 2 as well." }],
            m: "l = 24 - w", say: "Every term divided by 2." },
          { step: 4, ask: "Use it. The width is 10 cm. What is the length?", type: "num", answer: 14, post: "cm", hint: "$24 - 10$.", m: "l = 24 - 10 = 14", say: "One subtraction, for any width." }],
        why: "Question, target, undo, use. Now a table that needs both directions." },
      { type: "table", kicker: "On your own",
        prompt: "Parallelograms with the **same height, 3 inches**. The table links the base $b$ (inches) to the area $A$ (square inches). Some cells are blank — **fill them in**. Some are found from the base, and some from the area.",
        head: ["base $b$", "area $A$"], rows: [[1, 3], [2, 6], [3, 9], [4.5, null], [null, 36], [null, 46.5]],
        answers: [[3, 1, 13.5], [4, 0, 12], [5, 0, 15.5]], skill: "Solve for a variable",
        hints: ["Area is $3 \\times$ base. To go from area back to base, undo it.", "For $A = 36$: what times 3 gives 36?"],
        why: "$4.5 \\times 3 = 13.5$. Going the other way: $36 \\div 3 = 12$ and $46.5 \\div 3 = 15.5$." },
      { type: "num",
        prompt: "After a parade, volunteers clean a **2-mile** stretch of road, each taking an equal share. How long is each volunteer's section if there are **8** volunteers?",
        answer: 0.25, tol: 0.001, skill: "Solve for a variable",
        near: [{ v: 4, fb: "That's $8 \\div 2$. We share 2 miles *among* 8 people, so each gets $2 \\div 8$." }],
        hints: ["Total length divided by the number of volunteers."], why: "$2 \\div 8 = 0.25$ mile." },
      { type: "equation", prompt: "Write an equation that gives the section length $L$ for any number of volunteers $v$.", answer: "L=2/v", shown: "L = 2/v", skill: "Solve for a variable",
        near: [{ v: "L=v/2", fb: "More volunteers means *shorter* sections. So $v$ divides the 2, not the other way around." }],
        keys: [["$L$", "L"], ["$v$", "v"], ["$=$", "="], ["$\\frac{a}{b}$", "/"]], placeholder: "L = …",
        hints: ["It's what you just did twice."], why: "$L = \\dfrac{2}{v}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The target can be **underneath**. Volunteers share a 2-mile road: $L = \\frac{2}{v}$. Now you know each section's length and want the number of volunteers.",
        scene: { type: "walk", how: HOW_1_8, rows: [
          { step: 2, m: "v = \\; ?", say: "The target is $v$, and it is in the denominator." },
          { step: 3, m: "L \\cdot v = 2", say: "Multiply both sides by $v$ to bring it up." },
          { step: 3, m: "v = \\frac{2}{L}", say: "Divide both sides by $L$." },
          { step: 4, m: "v = \\frac{2}{0.4} = 5", say: "Sections of 0.4 mile: 5 volunteers." }] },
        gate: true },
      { type: "equation", kicker: "Try it",
        prompt: "Tank A holds **124 litres** and fills at **9 litres a minute**. With $t$ minutes gone it holds $A$ litres: $A = 124 + 9t$. **Solve for $t$.**",
        answer: "t=(A-124)/9", shown: "t = (A - 124)/9", skill: "Solve for a variable",
        near: [{ v: "t=A-124/9", fb: "The 9 divides the *whole* $A - 124$, so it needs brackets." },
               { v: "t=(A+124)/9", fb: "To undo $+124$, *subtract* 124." }],
        keys: [["$A$", "A"], ["$t$", "t"], ["$=$", "="], ["$($", "("], ["$)$", ")"], ["$\\frac{a}{b}$", "/"], ["$-$", "-"]], placeholder: "t = …",
        hints: ["Undo the operations in reverse: first subtract 124 from both sides, then divide by 9."],
        why: "$A - 124 = 9t$, so $t = \\dfrac{A - 124}{9}$." },
      { type: "num", prompt: "Use it: when does Tank A hold **191.5 litres**? How many minutes?", answer: 7.5, skill: "Solve for a variable",
        near: [{ v: 21.28, tol: 0.05, fb: "That's $191.5 \\div 9$. Subtract the 124 litres it started with first." }],
        hints: ["$t = (A - 124) \\div 9$ with $A = 191.5$."], why: "$(191.5 - 124) \\div 9 = 67.5 \\div 9 = 7.5$ minutes." },
      { type: "choice", kicker: "Find the error",
        prompt: "To solve $A = 124 + 9t$ for $t$, Kiran writes $t = \\frac{A}{9} - 124$. What is wrong?",
        options: [{ t: "Subtract 124 first, then divide everything by 9: $t = \\frac{A - 124}{9}$." },
                  { t: "He should have multiplied by 9.", fb: "The 9 multiplies $t$, so it is undone by dividing." },
                  { t: "Nothing. That is $t$.", fb: "Test it: at $t = 0$, $A = 124$. His formula gives $\\frac{124}{9} - 124$, which is not 0." }],
        answer: 0, skill: "Solve for a variable", hints: ["Undo in reverse order: which was done last to $t$, the $\\times 9$ or the $+ 124$?"],
        why: "$A - 124 = 9t$, then divide the whole left side by 9." },
      { type: "choice", kicker: "Use it", prompt: "You'll be asked “when will it hold …?” for a lot of different amounts. Which form is **most useful**?",
        options: [{ t: "$t = \\dfrac{A - 124}{9}$ — put in the amount, get the time" },
                  { t: "$A = 124 + 9t$ — put in the amount and solve again each time", fb: "You'd have to undo the $+124$ and $\\times 9$ from scratch every time. Rearranging once does it for good." }],
        answer: 0, skill: "Choose a useful form", why: "Both say the same thing, but $t = \\frac{A - 124}{9}$ is already solved for the unknown. Choose the form that makes *your* question a single calculation." }
    ]
  });

  /* ====================== 1.9 · Choosing the correct variable to solve for, part 2 */
  var HOW_1_9 = [["Target", "Name the variable you want alone."], ["Add-subtract", "First undo the adding and subtracting: move the other terms across."], ["Divide", "Then undo the multiplying: divide both sides by the coefficient."], ["Check", "Test the result with numbers."]];
  LESSONS.push({
    title: "Choosing the variable to solve for (part 2)",
    blurb: "Book 1.9 · Rearranging is solving with letters. Undo the operations in reverse order, whatever the variable.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "$l = 24 - w$. If $w = 9$, what is $l$?",
        answer: 15, skill: "Solve for a variable",
        hints: ["$24 - 9$."], why: "$24 - 9 = 15$." },
      { type: "learn", kicker: "The idea",
        prompt: "Rearranging is solving with letters instead of numbers. The recipe never changes: undo things in the **reverse** of the order in which they were done. Adding and subtracting first, then multiplying and dividing.",
        scene: { type: "method", how: HOW_1_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this solved for $y$.$$3x + 4y = 24$$",
        scene: { type: "walk", how: HOW_1_9, rows: [
          { step: 1, m: "y = \\; ?", say: "We want $y$ alone." },
          { step: 2, m: "4y = 24 - 3x", say: "Subtract $3x$ from both sides." },
          { step: 3, m: "y = \\frac{24 - 3x}{4}", say: "Divide both sides by 4. The **whole** right side is divided.",
            ask: { prompt: "$4y = 24 - 3x$. What undoes the 4?", answer: 0,
                   options: [{ t: "Dividing both sides by 4" }, { t: "Subtracting 4 from both sides", fb: "The 4 multiplies $y$. Division undoes multiplication." }] } },
          { step: 3, m: "y = 6 - \\frac{3}{4}x", say: "Each term, divided by 4." },
          { step: 4, m: "3(4) + 4(3) = 24", say: "Test: $x = 4$ gives $y = 3$, and $12 + 12 = 24$ ✓." }] },
        gate: true,
        then: "One equation can be rearranged to solve for any of its variables." },
      { type: "guided", kicker: "Together",
        prompt: "A ship carries $c$ cars of 2 tons and $t$ trucks of 5 tons, loaded to exactly 100 tons: $2c + 5t = 100$. Solve for $c$.",
        how: HOW_1_9, skill: "Solve for a variable",
        steps: [
          { step: 1, ask: "Which variable do we want alone?", type: "choice", answer: 0,
            options: [{ t: "$c$" }, { t: "$t$", fb: "The task says: solve for $c$." }],
            m: "c = \\; ?", say: "The target is $c$." },
          { step: 2, ask: "Undo the adding first. Subtract $5t$ from both sides.", type: "choice", answer: 0,
            options: [{ t: "$2c = 100 - 5t$" }, { t: "$2c = 100 + 5t$", fb: "Subtracting $5t$ from the right side gives $100 - 5t$." }],
            m: "2c = 100 - 5t", say: "The $5t$ moves across." },
          { step: 3, ask: "Now divide both sides by 2.", type: "choice", answer: 0,
            options: [{ t: "$c = \\frac{100 - 5t}{2}$" }, { t: "$c = 100 - \\frac{5t}{2}$", fb: "The 100 is divided by 2 as well: the whole right side." }, { t: "$c = 50 - 5t$", fb: "The $5t$ is divided by 2 as well." }],
            m: "c = \\frac{100 - 5t}{2}", say: "The whole right side, divided by 2." },
          { step: 4, ask: "Test it. With 10 trucks, how many cars?", type: "num", answer: 25, hint: "$\\frac{100 - 50}{2}$.", m: "c = \\frac{100 - 50}{2} = 25", say: "Check: $2(25) + 5(10) = 100$ ✓." }],
        why: "Target, add and subtract, divide, check. Now rearrange a formula you have met before." },
      { type: "equation", kicker: "On your own",
        prompt: "Remember the Platonic solids? $F + V = E + 2$. A design app knows $F$ and $V$ and wants $E$. **Rearrange the equation so $E$ is by itself.**",
        answer: "E=F+V-2", shown: "E = F + V - 2", skill: "Solve for a variable",
        near: [{ v: "E=F+V+2", fb: "The $+2$ is on the *same side* as $E$, so subtract 2 from both sides." },
               { v: "E=F-V-2", fb: "$F$ and $V$ are added on the left: they both stay positive." }],
        keys: [["$E$", "E"], ["$F$", "F"], ["$V$", "V"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "E = …",
        hints: ["Take 2 away from both sides."], why: "Subtract 2 from both sides: $F + V - 2 = E$, or $E = F + V - 2$." },
      { type: "table", prompt: "Use your equation: fill in the number of cars for each number of trucks.",
        head: ["trucks $t$", "cars $c$"], rows: [[0, 50], [4, null], [8, 30], [12, null], [20, null]],
        answers: [[1, 1, 40], [3, 1, 20], [4, 1, 0]], skill: "Solve for a variable",
        hints: ["$c = 50 - 2.5t$. For $t = 4$: $50 - 10$."], why: "$50 - 2.5(4) = 40$, $50 - 2.5(12) = 20$, $50 - 2.5(20) = 0$ — all trucks, no cars." },
      { type: "learn", kicker: "A harder case",
        prompt: "When nothing is added, go straight to dividing. The volume of a box is $V = lwh$. Solve for the height.",
        scene: { type: "walk", how: HOW_1_9, rows: [
          { step: 1, m: "h = \\; ?", say: "We want $h$ alone." },
          { step: 3, m: "h = \\frac{V}{lw}", say: "$h$ is multiplied by $l$ and by $w$. Divide both sides by $lw$." },
          { step: 4, m: "\\frac{60}{5 \\cdot 4} = 3", say: "Test: a box 5 by 4 with volume 60 has height 3 ✓." }] },
        gate: true },
      { type: "order", kicker: "Try it",
        prompt: "Temperature: $C = \\frac{5}{9}(F - 32)$. To solve for $F$, **put the moves in order.**",
        items: ["Multiply both sides by $\\frac{9}{5}$ to clear the fraction: $\\frac{9}{5}C = F - 32$", "Add 32 to both sides", "Read the result: $F = \\frac{9}{5}C + 32$"],
        skill: "Solve for a variable",
        why: "Undo in reverse: $F$ was first *reduced by 32*, then *multiplied by $\\frac{5}{9}$*. So undo the multiplying first (multiply by $\\frac{9}{5}$), then the subtracting (add 32)." },
      { type: "choice", kicker: "Find the error",
        prompt: "Solving $3x + 4y = 24$ for $y$, Kiran writes $y = 24 - \\frac{3x}{4}$. What is wrong?",
        options: [{ t: "The **whole** right side is divided by 4: $y = 6 - \\frac{3}{4}x$." },
                  { t: "He should have added $3x$.", fb: "Subtracting $3x$ is right: $4y = 24 - 3x$. The slip is in the dividing." },
                  { t: "Nothing. That is $y$.", fb: "Test $x = 4$: his formula gives $y = 21$, and $3(4) + 4(21)$ is not 24." }],
        answer: 0, skill: "Solve for a variable", hints: ["Step 3: divide **both** terms on the right by 4."],
        why: "$4y = 24 - 3x$, so $y = \\frac{24}{4} - \\frac{3x}{4} = 6 - \\frac{3}{4}x$." },
      { type: "equation", kicker: "Use it", prompt: "At the carnival, adult tickets cost \\$8 ($a$ sold) and child tickets \\$5 ($c$ sold). The takings were \\$1,000: $8a + 5c = 1000$. Solve for $c$.",
        answer: "c=(1000-8a)/5", shown: "c = (1000 - 8a)/5", skill: "Solve for a variable",
        near: [{ v: "c=1000-8a/5", fb: "The 5 divides the whole of $1000 - 8a$." }],
        keys: [["$a$", "a"], ["$c$", "c"], ["$=$", "="], ["$($", "("], ["$)$", ")"], ["$\\frac{a}{b}$", "/"], ["$-$", "-"]], placeholder: "c = …",
        hints: ["Subtract $8a$, then divide by 5."], why: "$5c = 1000 - 8a$, so $c = \\dfrac{1000 - 8a}{5} = 200 - 1.6a$." },
      { type: "num", prompt: "If **75** adult tickets were sold, how many child tickets were sold?", answer: 80, skill: "Solve for a variable",
        hints: ["$c = (1000 - 8a) \\div 5$ with $a = 75$."], why: "$(1000 - 600) \\div 5 = 80$ child tickets." }
    ]
  });

  /* ========================== 1.10 · Connecting equations to graphs, part 1 */
  // A line's window: the graph paper the SLOPE steps draw on.
  function paper(items, alt, o) {
    return fig(Object.assign({ x: [-2, 6], y: [-4, 8], u: 24, alt: alt, items: items }, o || {}));
  }
  var HOW_1_10 = [["Form", "Write the equation as $y = mx + b$."], ["Start", "$b$ is the $y$-intercept: the value of $y$ when $x = 0$."], ["Rate", "$m$ is the slope: how much $y$ changes when $x$ goes up by 1."], ["Graph", "Plot $(0, b)$. Then step 1 across and $m$ up, again and again."]];
  LESSONS.push({
    title: "Connecting equations to graphs (part 1)",
    blurb: "Book 1.10 · In $y = mx + b$, the slope $m$ is the rate of change and $b$ is where things start.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "For $y = 15x + 40$, what is $y$ when $x = 0$?",
        answer: 40, skill: "Slope and intercept in context",
        near: [{ v: 55, fb: "That is $y$ when $x = 1$. Here $x$ is 0." }],
        hints: ["$15(0) + 40$."], why: "$15(0) + 40 = 40$." },
      { type: "learn", kicker: "The idea",
        prompt: "In $y = mx + b$ each letter has a job. $b$ is where things **start**: the value of $y$ when $x$ is 0. $m$ is the **rate**: how much $y$ changes each time $x$ goes up by 1. On a graph they are the $y$-intercept and the slope.",
        scene: { type: "method", how: HOW_1_10 } },
      { type: "learn", kicker: "Explore",
        prompt: "Every line that isn't vertical can be written $y = mx + b$. Each letter does a job. **Slide them and read the two labels.**",
        scene: { type: "plane", x: [-2, 6], y: [-4, 10], gate: true,
          params: { m: { v: 2, min: -4, max: 4, step: 1, label: "slope $m$" }, b: { v: 3, min: -4, max: 8, step: 1, label: "start $b$" } },
          fns: [{ f: "m*x + b", color: "blue" }],
          points: [{ id: "A", x: 0, y: 3, hidden: true }, { id: "B", x: 1, y: 5, hidden: true }],
          marks: [{ x: 0, y: function (P) { return P.b; }, color: "orange", r: 7, label: function (P) { return "start (0, " + num(P.b) + ")"; } },
                  { x: 1, y: function (P) { return P.m + P.b; }, color: "purple", r: 5, label: function (P) { return "+" + num(P.m) + " per step"; } }],
          readout: function (st) { return "$y = " + poly([[st.params.m, "x"], [st.params.b, ""]]) + "$ — starts at $" + num(st.params.b) + "$, changes by $" + num(st.params.m) + "$ for every 1 across"; } },
        gate: true,
        then: "**$b$ is the $y$-intercept**: where the line crosses the vertical axis — the value of $y$ when $x = 0$: the *starting amount*. **$m$ is the slope**: how much $y$ changes when $x$ goes up by 1 — the *rate of change*. Rise over run." },
      { type: "learn", kicker: "Watch",
        prompt: "Kiran is saving for a bike. After $x$ weeks he has $y$ dollars. Watch the equation read.$$y = 15x + 40$$",
        scene: { type: "walk", how: HOW_1_10, rows: [
          { step: 1, m: "y = 15x + 40", say: "Already in the form $y = mx + b$." },
          { step: 2, m: "b = 40", say: "At week 0 Kiran has \\$40. That is where the line meets the vertical axis." },
          { step: 3, m: "m = 15", say: "Each week adds \\$15. The line rises 15 for every 1 across.",
            ask: { prompt: "Which number tells you how fast Kiran's savings grow?", answer: 0,
                   options: [{ t: "15, the number multiplying $x$" }, { t: "40", fb: "40 is what he starts with. The growth each week is the number multiplying $x$." }] } },
          { step: 4, m: "(0, 40), \\; (1, 55), \\; (2, 70)", say: "Start at 40, then up 15 for each week." }] },
        gate: true,
        then: "$b$ is the **$y$-intercept**: the start. $m$ is the **slope**: the rate of change." },
      { type: "guided", kicker: "Together",
        prompt: "Now you read a line that **falls**.$$y = -2x + 8$$",
        how: HOW_1_10, skill: "Slope and intercept in context",
        steps: [
          { step: 1, ask: "Is this in the form $y = mx + b$?", type: "choice", answer: 0,
            options: [{ t: "Yes: $m = -2$ and $b = 8$" }, { t: "No", fb: "It has $y$ alone, a number times $x$, and a number added." }],
            m: "y = -2x + 8", say: "In the form, with a negative $m$." },
          { step: 2, ask: "Where does the line cross the $y$-axis?", type: "num", pre: "$y =$", answer: 8, near: [{ v: -2, fb: "$-2$ is the slope. The crossing is the value of $y$ when $x = 0$." }], hint: "Put $x = 0$.",
            m: "b = 8", say: "It starts at 8." },
          { step: 3, ask: "What does $m = -2$ tell you?", type: "choice", answer: 0,
            options: [{ t: "The line falls 2 for each 1 across" }, { t: "The line rises 2 for each 1 across", fb: "A negative slope means falling." }, { t: "The line starts at $-2$", fb: "The start is $b$, which is 8." }],
            m: "m = -2", say: "Down 2 for every 1 across." },
          { step: 4, ask: "Start at $(0, 8)$ and step 1 across. What is $y$ there?", type: "num", pre: "$y =$", answer: 6, hint: "$8 - 2$.", m: "(0, 8), \\; (1, 6), \\; (2, 4)", say: "Down 2 each step." }],
        why: "Form, start, rate, graph. Now set a line with the sliders." },
      { type: "plane", kicker: "On your own",
        prompt: "Now draw it. Use the sliders to make the line pass through the **two red points**, $(0, 3)$ and $(2, 7)$. Watch which slider moves which part of the line.",
        x: [-2, 6], y: [-4, 10], gate: true,
        params: { m: { v: 1, min: -5, max: 5, step: 1, label: "slope $m$" }, b: { v: 0, min: -5, max: 8, step: 1, label: "start $b$" } },
        fns: [{ f: "m*x + b", color: "blue" }],
        marks: [{ x: 0, y: 3, color: "red", r: 6, label: "(0, 3)" }, { x: 2, y: 7, color: "red", r: 6, label: "(2, 7)" }],
        readout: function (st) { return "$y = " + poly([[st.params.m, "x"], [st.params.b, ""]]) + "$"; },
        goal: function (st) { return st.params.m === 2 && st.params.b === 3; },
        fb: function (st) { return "Close? Check where the line crosses the vertical axis, and how much it rises for each step to the right."; },
        answer: { params: { m: 2, b: 3 } }, skill: "Graph a line",
        hints: ["$b$ moves the line up and down. First get it through $(0, 3)$.", "Then $m$ tilts it: from $(0, 3)$ to $(2, 7)$ is 4 up over 2 across."],
        why: "$y = 2x + 3$: it starts at 3 and rises 2 for each 1 across." },
      { type: "num",
        prompt: "Read the line below. **What is its slope** — how much $y$ rises for each 1 across?" +
          paper([{ line: [[0, -2], [1, 1]], c: "blue" }, { pt: [0, -2], c: "orange" }, { pt: [1, 1], c: "orange" }, { pt: [2, 4], c: "orange" }], "A line through (0, -2), (1, 1) and (2, 4)."),
        answer: 3, skill: "Slope and intercept from a graph",
        near: [{ v: -2, fb: "$-2$ is where the line crosses the vertical axis. The slope is how much it *rises* per step across." },
               { v: 0.333, tol: 0.01, fb: "That's run over rise. Slope is rise (up) over run (across)." }],
        hints: ["Pick two dots. From $(0, -2)$ to $(1, 1)$: how far up? How far across?"],
        why: "From $(0,-2)$ to $(1,1)$: up 3, across 1: slope $3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Not every equation arrives in the form. At the fair, $2r + 3g = 12$, with rides $r$ across and games $g$ up.",
        scene: { type: "walk", how: HOW_1_10, rows: [
          { step: 1, m: "3g = 12 - 2r", say: "Solve for $g$. First subtract $2r$ from both sides." },
          { step: 1, m: "g = 4 - \\frac{2}{3}r", say: "Then divide by 3. Now it is in the form." },
          { step: 2, m: "b = 4", say: "With no rides, 4 games." },
          { step: 3, m: "m = -\\frac{2}{3}", say: "Each extra ride costs two-thirds of a game." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Kiran has \\$24 instead. Rides cost \\$4 and games \\$3: $4r + 3g = 24$. **Which graph is it?** (Rides $r$ across, games $g$ up.) Try $g = 0$ and $r = 0$.",
        options: [{ t: fig({ x: [0, 9], y: [0, 9], u: 14, w: 150, alt: "A line from 8 on the vertical axis to 6 on the horizontal.", items: [{ seg: [[0, 8], [6, 0]], c: "blue" }, { pt: [0, 8] }, { pt: [6, 0] }] }) },
                  { t: fig({ x: [0, 9], y: [0, 9], u: 14, w: 150, alt: "A line from 6 on the vertical axis to 8 on the horizontal.", items: [{ seg: [[0, 6], [8, 0]], c: "blue" }, { pt: [0, 6] }, { pt: [8, 0] }] }), fb: "Check the axes. With no games ($g = 0$): $4r = 24$, so $r = 6$ on the *horizontal* axis." },
                  { t: fig({ x: [0, 9], y: [0, 9], u: 14, w: 150, alt: "A line from 6 on each axis.", items: [{ seg: [[0, 6], [6, 0]], c: "blue" }, { pt: [0, 6] }, { pt: [6, 0] }] }), fb: "With no rides ($r = 0$): $3g = 24$, so $g = 8$, not 6." }],
        answer: 0, keep: true, skill: "Match equation and graph",
        hints: ["$r = 0$ gives one crossing; $g = 0$ gives the other."],
        why: "$g = 0$: $4r = 24$, $r = 6$ → $(6, 0)$. $r = 0$: $3g = 24$, $g = 8$ → $(0, 8)$. The line joins $(0, 8)$ and $(6, 0)$." },
      { type: "sort",
        prompt: "Sort each description under the part of $y = mx + b$ it describes.",
        bins: ["$m$ — the slope", "$b$ — the $y$-intercept"],
        cards: [{ t: "The rate of change", bin: 0 },
                { t: "The starting amount", bin: 1 },
                { t: "The value of $y$ when $x = 0$", bin: 1 },
                { t: "How much $y$ changes when $x$ goes up by 1", bin: 0 },
                { t: "Where the line crosses the vertical axis", bin: 1 },
                { t: "Rise over run", bin: 0 }],
        skill: "Slope and intercept in context",
        hints: ["One is about *change*, the other about *where you begin*."],
        why: "$m$ is about **change** (rate, rise over run). $b$ is about **where you start** (the value at $x = 0$, on the vertical axis)." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $y = 15x + 40$, Kiran says the line crosses the $y$-axis at 15. What is wrong?",
        options: [{ t: "At $x = 0$, $y = 40$. The 15 is the slope." },
                  { t: "It crosses at 55.", fb: "55 is $y$ when $x = 1$. The $y$-axis is where $x = 0$." },
                  { t: "Nothing. It crosses at 15.", fb: "Put $x = 0$ into the equation." }],
        answer: 0, skill: "Slope and intercept in context", hints: ["Step 2: put $x = 0$ in."],
        why: "$b = 40$ is the $y$-intercept. $m = 15$ is how fast the line climbs." },
      { type: "equation", kicker: "Use it",
        prompt: "A pool holds **15,000 gallons** and drains at **200 gallons a day**. Write an equation $y = mx + b$ for the gallons $y$ after $x$ days.",
        answer: "y=-200x+15000", shown: "y = -200x + 15000", skill: "Slope and intercept in context", form: "slope-intercept",
        near: [{ v: "y=200x+15000", fb: "It's *draining*, so the amount goes down by 200 a day: the slope is negative." },
               { v: "y=15000x-200", fb: "The 15,000 is where it *starts* (the intercept). The 200 a day is the rate (the slope)." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "y = …",
        hints: ["Start: 15,000 at $x = 0$. Change: $-200$ each day."], why: "$y = -200x + 15000$: slope $-200$ (falls 200 a day), intercept 15,000 (full at the start)." }
    ]
  });
  /* ========================== 1.11 · Connecting equations to graphs, part 2 */
  var HOW_1_11 = [["Get y alone", "Rearrange the equation until it reads $y = \\ldots$"], ["Tidy", "Expand any brackets and collect terms, to reach $y = mx + b$."], ["Read", "$m$ is the slope. $b$ is the $y$-intercept."]];
  LESSONS.push({
    title: "Connecting equations to graphs (part 2)",
    blurb: "Book 1.11 · Find the slope and $y$-intercept from any form of a line's equation.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "This line isn't in the form $y = mx + b$: $$y = 3(x - 2) + 5$$ Where does it cross the **vertical axis**? (Put in $x = 0$.)",
        pre: "$y =$", answer: -1, skill: "Slope and intercept from an equation",
        near: [{ v: 5, fb: "The 5 is added *after* the bracket. Work out $3(0 - 2)$ first." },
               { v: -6, fb: "That's the bracket part, $3(-2)$. Now add the 5." }],
        hints: ["Replace $x$ with 0: $3(0 - 2) + 5$."], why: "$3(-2) + 5 = -6 + 5 = -1$. The line crosses at $(0, -1)$." },
      { type: "learn", kicker: "The idea",
        prompt: "Lines are not always handed to you as $y = mx + b$. Whatever the form, you can rearrange it until $y$ is alone. Then the slope and the $y$-intercept can be read at a glance.",
        scene: { type: "method", how: HOW_1_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this line put into the form $y = mx + b$.$$y = 3(x - 2) + 5$$",
        scene: { type: "walk", how: HOW_1_11, rows: [
          { step: 1, m: "y = 3(x - 2) + 5", say: "$y$ is already alone." },
          { step: 2, m: "y = 3x - 6 + 5", say: "Share the 3 across the bracket." },
          { step: 2, m: "y = 3x - 1", say: "Collect the numbers." },
          { step: 3, m: "m = 3, \\; b = -1", say: "Slope 3, and $y$-intercept $-1$.",
            ask: { prompt: "In $y = 3x - 1$, what is the $y$-intercept?", answer: 0,
                   options: [{ t: "$-1$" }, { t: "3", fb: "3 multiplies $x$: it is the slope. The intercept is the number on its own." }] } }] },
        gate: true,
        then: "Rearranged, the equation shows both numbers at once." },
      { type: "guided", kicker: "Together",
        prompt: "Now a line in **standard form**. Find its slope and $y$-intercept.$$5x - 2y = 20$$",
        how: HOW_1_11, skill: "Slope and intercept from an equation",
        steps: [
          { step: 1, ask: "Subtract $5x$ from both sides.", type: "choice", answer: 0,
            options: [{ t: "$-2y = 20 - 5x$" }, { t: "$-2y = 20 + 5x$", fb: "Subtracting $5x$ from the right side gives $20 - 5x$." }],
            m: "-2y = 20 - 5x", say: "The $y$ term is alone on the left." },
          { step: 1, ask: "Divide both sides by $-2$.", type: "choice", answer: 0,
            options: [{ t: "$y = -10 + 2.5x$" }, { t: "$y = 10 - 2.5x$", fb: "Dividing by a negative changes the sign of **both** terms." }, { t: "$y = -10 - 2.5x$", fb: "$-5x \\div (-2)$ is $+2.5x$." }],
            m: "y = -10 + 2.5x", say: "Each term divided by $-2$." },
          { step: 2, ask: "Write it in the usual order.", type: "choice", answer: 0,
            options: [{ t: "$y = 2.5x - 10$" }, { t: "$y = -10x + 2.5$", fb: "The $x$ belongs with the 2.5." }],
            m: "y = 2.5x - 10", say: "The $x$ term first." },
          { step: 3, ask: "What is the slope?", type: "num", answer: 2.5, near: [{ v: -10, fb: "$-10$ is the $y$-intercept. The slope multiplies $x$." }, { v: 5, fb: "5 is the coefficient in standard form. Read the slope once $y$ is alone." }], hint: "The number multiplying $x$.",
            m: "m = 2.5, \\; b = -10", say: "Slope 2.5, $y$-intercept $-10$." }],
        why: "Get $y$ alone, tidy, read. Now look for a pattern in standard form." },
      { type: "table", kicker: "On your own",
        prompt: "Now **standard form**, $Ax + By = C$. Each row is a line, solved for $y$. Look for the pattern from the first three rows — then **finish the last row.**",
        head: ["$A$", "$B$", "$C$", "slope $m$", "$y$-int $b$"],
        rows: [[2, 1, 6, -2, 6], [3, 3, 9, -1, 3], [1, 2, 8, -0.5, 4], [4, 2, 10, null, null]],
        answers: [[3, 3, -2], [3, 4, 5]], skill: "Slope and intercept from an equation",
        hints: ["Row 1: $2x + y = 6$ gives $y = -2x + 6$. How do you get $-2$ from $A = 2$ and $B = 1$?", "The slope is $-A \\div B$ and the intercept is $C \\div B$."],
        why: "Solve $4x + 2y = 10$: $2y = 10 - 4x$, so $y = 5 - 2x$: slope $-2$, intercept 5. In general $By = C - Ax$, so $y = -\\frac{A}{B}x + \\frac{C}{B}$." },
      { type: "expr", prompt: "Write the rule you spotted. For $Ax + By = C$, the **slope** is …", answer: "-A/B", shown: "-A/B", skill: "Slope and intercept from an equation",
        near: [{ v: "A/B", fb: "Check the first row: $A = 2$, $B = 1$, and the slope was $-2$. So there's a minus sign." },
               { v: "-B/A", fb: "Check row 3: $A = 1$, $B = 2$, slope $-0.5 = -\\frac{1}{2}$: that's $-A \\div B$." }],
        keys: [["$A$", "A"], ["$B$", "B"], ["$C$", "C"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"]], placeholder: "e.g. -A/B",
        hints: ["Rows 1–3: compare $m$ with $A$ and $B$."], why: "$By = C - Ax$, so $y = \\frac{C}{B} - \\frac{A}{B}x$: slope $-\\frac{A}{B}$, and the intercept is $\\frac{C}{B}$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A fraction for a slope. Find the slope and $y$-intercept of this line.$$3x + 4y = 12$$",
        scene: { type: "walk", how: HOW_1_11, rows: [
          { step: 1, m: "4y = 12 - 3x", say: "Subtract $3x$ from both sides." },
          { step: 1, m: "y = 3 - \\frac{3}{4}x", say: "Divide both sides by 4." },
          { step: 2, m: "y = -\\frac{3}{4}x + 3", say: "The usual order." },
          { step: 3, m: "m = -\\frac{3}{4}, \\; b = 3", say: "For $Ax + By = C$ the slope always comes out as $-\\frac{A}{B}$." }] },
        gate: true },
      { type: "multi", kicker: "Try it", prompt: "**Which statements are true** about the graph of $3x + 4y = 12$?",
        options: [{ t: "The slope is $-\\frac{3}{4}$", ok: true },
                  { t: "It crosses the $y$-axis at $(0, 3)$", ok: true },
                  { t: "It crosses the $x$-axis at $(4, 0)$", ok: true },
                  { t: "It passes through $(2, 1.5)$", ok: true },
                  { t: "The slope is $\\frac{3}{4}$", fb: "The slope is $-A \\div B = -\\frac{3}{4}$: negative — the line falls." },
                  { t: "It crosses the $y$-axis at $(0, 4)$", fb: "$y$-intercept $= C \\div B = 12 \\div 4 = 3$. (4 is where it crosses the *x*-axis.)" }],
        skill: "Features of a graph",
        hints: ["Slope $-A/B$, $y$-intercept $C/B$; for the $x$-intercept put $y = 0$."],
        why: "$y = -\\frac{3}{4}x + 3$. So $(0, 3)$ and, with $y = 0$, $(4, 0)$. And $3(2) + 4(1.5) = 12$ ✓." },
      { type: "slots",
        prompt: "Match each equation to its slope and $y$-intercept. (One card is extra.)",
        slots: [{ id: "a", label: "$2x + y = 5$" }, { id: "b", label: "$x - 2y = 6$" }, { id: "c", label: "$3x + 3y = 9$" }, { id: "d", label: "$4x - 2y = 8$" }],
        cards: [{ t: "$m = -2,\\; b = 5$", slot: "a", fb: "$2x + y = 5$: $y = -2x + 5$." },
                { t: "$m = \\frac{1}{2},\\; b = -3$", slot: "b", fb: "$x - 2y = 6$: $-2y = -x + 6$, $y = \\frac{1}{2}x - 3$." },
                { t: "$m = -1,\\; b = 3$", slot: "c", fb: "$3x + 3y = 9$: divide by 3: $x + y = 3$, $y = -x + 3$." },
                { t: "$m = 2,\\; b = -4$", slot: "d", fb: "$4x - 2y = 8$: $-2y = -4x + 8$, $y = 2x - 4$." },
                { t: "$m = 2,\\; b = 5$" }],
        skill: "Slope and intercept from an equation",
        hints: ["For each, solve for $y$ — or use $m = -A/B$ and $b = C/B$."], why: "Use $m = -\\frac{A}{B}$ and $b = \\frac{C}{B}$ on each row." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $5x - 2y = 20$, Kiran says the slope is 5, “the number in front of $x$”. What is wrong?",
        options: [{ t: "That only works when $y$ is alone. Rearranged, the line is $y = 2.5x - 10$: slope 2.5." },
                  { t: "The slope is $-2$.", fb: "$-2$ is the coefficient of $y$. Rearrange first." },
                  { t: "Nothing. The slope is the coefficient of $x$.", fb: "Only in the form $y = mx + b$. Here $y$ still has a coefficient." }],
        answer: 0, skill: "Slope and intercept from an equation", hints: ["Step 1: get $y$ alone first."],
        why: "Divide through by $-2$ and the coefficient of $x$ becomes 2.5." },
      { type: "choice",
        prompt: "Multiply every part of $2x + 3y = 12$ by 2 to get $4x + 6y = 24$. What happens to the line?",
        options: [{ t: "Nothing: it's the same line, with the same slope and intercepts" },
                  { t: "It gets twice as steep", fb: "The slope is $-\\frac{A}{B} = -\\frac{4}{6}$ — the same as $-\\frac{2}{3}$. Doubling both $A$ and $B$ cancels out." },
                  { t: "It moves up", fb: "The $y$-intercept $\\frac{C}{B} = \\frac{24}{6} = 4$ — the same as $\\frac{12}{3}$." }],
        answer: 0, skill: "Equivalent equations",
        hints: ["Compute the slope $-A/B$ and intercept $C/B$ for both equations."],
        why: "Multiplying both sides of an equation by the same number is an acceptable move — the equations are equivalent, so they have the same graph." },
      { type: "equation", kicker: "Use it", prompt: "Use it: a line has **slope $-3$** and **$y$-intercept 6**. Write its equation in **any** form.",
        answer: "y=-3x+6", shown: "y = -3x + 6", skill: "Write an equation",
        near: [{ v: "y=3x+6", fb: "The slope is negative: $-3$." }, { v: "y=-3x-6", fb: "The $y$-intercept is $+6$." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "e.g. y = …",
        hints: ["$y = mx + b$."], why: "$y = -3x + 6$ (or, equivalently, $3x + y = 6$)." }
    ]
  });

  /* ================================================ 1.12 · Writing the equation of a line */
  // For a plane's readout: the line through two draggable points, as far as it can be said.
  function lineWords(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    if (dx === 0) return "A vertical line: $x = " + num(a.x) + "$. It has no slope.";
    var m = dy / dx, k = a.y - m * a.x;
    var mt = Math.abs(m - Math.round(m)) < 1e-9 ? num(m) : L.frac(dy, dx);
    return "slope $= \\dfrac{" + num(dy) + "}{" + num(dx) + "} = " + mt + "$ &nbsp;→&nbsp; $y = " + poly([[m, "x"], [k, ""]]) + "$";
  }
  var HOW_1_12 = [["Slope", "Find the slope. From two points: rise over run."], ["Point", "Choose a point on the line."], ["Find b", "Put the slope and the point into $y = mx + b$, and solve for $b$."], ["Write", "Write the equation. Test it on another point."]];
  LESSONS.push({
    title: "Writing the equation of a line",
    blurb: "Book 1.12 · A slope and a point, or two points, are enough. Three forms say the same thing.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is the slope of the line from $(0, 1)$ to $(2, 7)$?",
        answer: 3, skill: "Slope from two points",
        near: [{ v: 6, fb: "6 is the rise. Divide it by the run, 2." }],
        hints: ["Rise $7 - 1$, run $2 - 0$."], why: "$\\frac{7 - 1}{2 - 0} = 3$." },
      { type: "learn", kicker: "Explore",
        prompt: "**Drag $A$ and $B$** anywhere. The line through them is drawn, and below it the slope and the equation. Try to make a line that **rises**, one that **falls**, and one that's **flat**.",
        scene: { type: "plane", x: [-6, 6], y: [-6, 6], gate: true,
          points: [{ id: "A", x: -2, y: -1, drag: true, label: "A" }, { id: "B", x: 2, y: 3, drag: true, label: "B" }],
          lines: [{ through: ["A", "B"], color: "blue", slope: true }],
          readout: function (st) { return lineWords(st.pt("A"), st.pt("B")); } },
        gate: true,
        then: "Two points always give exactly one line. The slope comes from the two points — **rise over run**, $\\frac{y_2 - y_1}{x_2 - x_1}$ — and once you have the slope, one point gives the $y$-intercept." },
      { type: "learn", kicker: "The idea",
        prompt: "Two facts pin down a line: its slope, and one point on it. Two points work as well, because they give you the slope. From those facts you can write the equation.",
        scene: { type: "method", how: HOW_1_12 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the equation written for the line through $(2, 1)$ and $(5, 10)$.",
        scene: { type: "walk", how: HOW_1_12, rows: [
          { step: 1, m: "\\frac{10 - 1}{5 - 2} = 3", say: "Rise 9 over run 3." },
          { step: 2, m: "(2, 1)", say: "Either point will do." },
          { step: 3, m: "1 = 3(2) + b, \\; b = -5", say: "Put the point into $y = 3x + b$: $1 = 6 + b$.",
            ask: { prompt: "We know $m = 3$ and the point $(2, 1)$. How do we find $b$?", answer: 0,
                   options: [{ t: "Put $x = 2$ and $y = 1$ into $y = 3x + b$" }, { t: "$b$ is the $y$ of the point: 1", fb: "That is true only for a point on the $y$-axis. This point has $x = 2$." }] } },
          { step: 4, m: "y = 3x - 5", say: "Test the other point: $3(5) - 5 = 10$ ✓." }] },
        gate: true,
        then: "Slope, a point, then $b$: that is enough for any line." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write the equation of the line through $(1, 3)$ and $(4, 9)$.",
        how: HOW_1_12, skill: "Write the equation of a line",
        steps: [
          { step: 1, ask: "What is the slope?", type: "num", answer: 2, near: [{ v: 6, fb: "6 is the rise. Divide by the run, 3." }], hint: "Rise $9 - 3$, run $4 - 1$.",
            m: "\\frac{9 - 3}{4 - 1} = 2", say: "Rise 6 over run 3." },
          { step: 3, ask: "Put $(1, 3)$ into $y = 2x + b$: $3 = 2 + b$. What is $b$?", type: "num", pre: "$b =$", answer: 1, near: [{ v: 3, fb: "3 is the $y$ of the point. Solve $3 = 2 + b$." }], hint: "Subtract 2 from both sides.",
            m: "3 = 2(1) + b, \\; b = 1", say: "The point fixes $b$." },
          { step: 4, ask: "Write the equation.", type: "choice", answer: 0,
            options: [{ t: "$y = 2x + 1$" }, { t: "$y = x + 2$", fb: "The slope, 2, multiplies $x$. The 1 is added." }, { t: "$y = 2x + 3$", fb: "3 is the $y$ of the point, not the intercept." }],
            m: "y = 2x + 1", say: "Slope 2, intercept 1." },
          { step: 4, ask: "Test the other point: what is $2(4) + 1$?", type: "num", answer: 9, hint: "$8 + 1$.", m: "2(4) + 1 = 9", say: "It passes through $(4, 9)$ ✓." }],
        why: "Slope, point, find $b$, write. Now two with the slope given." },
      { type: "equation", kicker: "On your own",
        prompt: "The easy case: **slope $-\\frac{3}{4}$** and **$y$-intercept 5**. Write the equation.",
        answer: "y=-0.75x+5", shown: "y = -3/4 x + 5", form: "slope-intercept", skill: "Write the equation of a line",
        near: [{ v: "y=0.75x+5", fb: "The slope is negative." }, { v: "y=5x-0.75", fb: "The slope goes with $x$; the $y$-intercept is the number on its own." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"]], placeholder: "y = …",
        hints: ["$y = mx + b$ — just put the two numbers in."], why: "$y = -\\frac{3}{4}x + 5$." },
      { type: "equation", prompt: "Write the line with **slope $-2$** through the point $(4, 1)$ in the form $y = mx + b$.",
        answer: "y=-2x+9", shown: "y = -2x + 9", form: "slope-intercept", skill: "Write the equation of a line",
        near: [{ v: "y=-2x-7", fb: "$y - 1 = -2(x - 4)$: sharing gives $-2x + 8$, and adding 1 gives $+9$." },
               { v: "y=-2x+1", fb: "The 1 is the $y$-coordinate of the point, not the intercept. Use point-slope first." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "y = …",
        hints: ["Point-slope: $y - 1 = -2(x - 4)$. Then share and add."], why: "$y - 1 = -2x + 8$, so $y = -2x + 9$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A shortcut when you know the slope and a point: a line with slope 3 through $(2, 5)$.",
        scene: { type: "walk", how: HOW_1_12, rows: [
          { step: 1, m: "m = 3", say: "The slope is given." },
          { step: 2, m: "(2, 5)", say: "And a point." },
          { step: 3, m: "y - 5 = 3(x - 2)", say: "Write “rise over run is 3” for any point $(x, y)$ on the line. This is **point-slope form**." },
          { step: 4, m: "y = 3x - 1", say: "Multiplied out, the same line." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "In point-slope form, $y - 5 = 3(x - 2)$ goes through which point?",
        options: [{ t: "$(2, 5)$" }, { t: "$(-2, -5)$", fb: "The signs are already in the equation: $x - 2$ means the point has $x = 2$." }, { t: "$(5, 2)$", fb: "$x$ comes first: the $x$-part is $x - 2$, so $x_1 = 2$." }],
        answer: 0, skill: "Write the equation of a line", hints: ["What $x$ makes $x - 2 = 0$? What $y$ makes $y - 5 = 0$?"],
        why: "The point is where both brackets are zero: $x = 2$, $y = 5$." },
      { type: "slots",
        prompt: "One line can be written three ways. **Match each name to its equation.** These three are all the *same line*.",
        slots: [{ id: "si", label: "**Slope-intercept** form" }, { id: "ps", label: "**Point-slope** form" }, { id: "st", label: "**Standard** form" }],
        cards: [{ t: "$y = 2x - 5$", slot: "si", fb: "Slope-intercept: $y = mx + b$ — the slope and $y$-intercept are visible." },
                { t: "$y - 1 = 2(x - 3)$", slot: "ps", fb: "Point-slope: $y - y_1 = m(x - x_1)$ — you can see the point $(3, 1)$ and the slope 2." },
                { t: "$2x - y = 5$", slot: "st", fb: "Standard form: $Ax + By = C$, with whole numbers." },
                { t: "$y = 5 - 2x$" }],
        skill: "Forms of a line", hints: ["Look for a $y$ on its own, brackets with a point, or $x$ and $y$ both on the left."],
        why: "Each form shows something different: slope-intercept shows $m$ and $b$; point-slope shows a point and $m$; standard form makes it easy to find both intercepts. Expand the point-slope one and you get $y = 2x - 5$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran writes the line with slope 2 through $(1, 4)$. Tap the line where his work **first** goes wrong.",
        lines: ["y = 2x + b", "4 = 2(1) + b", "b = 6", "y = 2x + 6"], answer: 2, fix: "b = 2",
        fb: { 0: "With slope 2, the line is $y = 2x + b$. Right.", 1: "Putting the point $(1, 4)$ in is the right move.", 3: "This uses the $b$ from the line above. The slip came earlier." },
        skill: "Write the equation of a line", hints: ["$4 = 2 + b$. What must $b$ be?"],
        why: "$4 = 2 + b$ gives $b = 2$: subtract 2. The line is $y = 2x + 2$, and $2(1) + 2 = 4$ ✓." },
      { type: "plane", kicker: "Use it",
        prompt: "A taxi charges **\\$3 to start** and **\\$2 a mile**. Make the graph: drag $A$ to the taxi fare for a **0-mile** ride and $B$ to the fare for a **4-mile** ride.",
        x: [0, 6], y: [0, 14], axisLabels: ["miles", "\\$"], gate: true,
        points: [{ id: "A", x: 1, y: 1, drag: true, label: "A" }, { id: "B", x: 2, y: 4, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue", slope: true }],
        readout: function (st) { return lineWords(st.pt("A"), st.pt("B")); },
        goal: function (st) { var a = st.pt("A"), b = st.pt("B"); return (a.x === 0 && a.y === 3 && b.x === 4 && b.y === 11) || (b.x === 0 && b.y === 3 && a.x === 4 && a.y === 11); },
        fb: function () { return "A 0-mile ride costs just the starting fee. A 4-mile ride adds \\$2 for each of 4 miles."; },
        answer: { points: { A: [0, 3], B: [4, 11] } }, skill: "Write the equation of a line",
        hints: ["0 miles: \\$3. 4 miles: $3 + 4 \\times 2$."], why: "$(0, 3)$ and $(4, 11)$: slope $\\frac{8}{4} = 2$, $y$-intercept 3: $y = 2x + 3$." }
    ]
  });

  /* ================================================== 1.13 · Lines from tables and graphs */
  var HOW_1_13 = [["Start", "Find $b$: the value of $y$ when $x = 0$."], ["Rate", "Find $m$: the change in $y$ divided by the change in $x$."], ["Equation", "Write $y = mx + b$."], ["Check", "Test it on another row or point."]];
  LESSONS.push({
    title: "Lines from tables and graphs",
    blurb: "Book 1.13 · A story, a table, a graph and an equation can all describe the same line. Move between them.",
    mins: 12, v: 4,
    steps: [
      { type: "table", kicker: "Warm up",
        prompt: "A gym charges **\\$25 to join** and **\\$15 a month**. Fill in the total cost after each number of months.",
        head: ["months $x$", "total cost $y$"], rows: [[0, null], [1, null], [2, 55], [3, null], [4, null]],
        answers: [[0, 1, 25], [1, 1, 40], [3, 1, 70], [4, 1, 85]], skill: "Table from a description",
        hints: ["Month 0: only the joining fee. Then \\$15 more each month."], why: "$25$, then $40$, $55$, $70$, $85$: each month adds 15 to the cost." },
      { type: "learn", kicker: "The idea",
        prompt: "A story, a table, a graph and an equation can all describe the **same line**. From any of them you need two things: where it starts, and how fast it changes.",
        scene: { type: "method", how: HOW_1_13 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the equation read from this table." + tbl(["$x$", "$y$"], [[0, 4], [1, 7], [2, 10], [3, 13]]),
        scene: { type: "walk", how: HOW_1_13, rows: [
          { step: 1, m: "b = 4", say: "The row with $x = 0$ gives the start." },
          { step: 2, m: "m = \\frac{7 - 4}{1 - 0} = 3", say: "From one row to the next, $y$ rises 3 while $x$ rises 1.",
            ask: { prompt: "From the row $(0, 4)$ to the row $(1, 7)$, how much does $y$ change?", answer: 0,
                   options: [{ t: "3" }, { t: "7", fb: "7 is the new value. The change is $7 - 4$." }] } },
          { step: 3, m: "y = 3x + 4", say: "Rate times $x$, plus the start." },
          { step: 4, m: "3(3) + 4 = 13", say: "Check the last row ✓." }] },
        gate: true,
        then: "Read the start and the rate, and the equation follows." },
      { type: "guided", kicker: "Together",
        prompt: "Your gym table shows the totals **25, 40, 55, 70** for months 0, 1, 2 and 3. Write its equation.",
        how: HOW_1_13, skill: "Equation from a table",
        steps: [
          { step: 1, ask: "What is $y$ when $x = 0$?", type: "num", answer: 25, hint: "The first entry.", m: "b = 25", say: "The joining fee." },
          { step: 2, ask: "How much does the total rise each month?", type: "num", answer: 15, near: [{ v: 25, fb: "25 is the start. The rise is the change from one month to the next: $40 - 25$." }], hint: "$40 - 25$.", m: "m = 15", say: "\\$15 a month." },
          { step: 3, ask: "Write the equation.", type: "choice", answer: 0,
            options: [{ t: "$y = 15x + 25$" }, { t: "$y = 25x + 15$", fb: "The rate, 15, multiplies $x$. The start, 25, is added." }],
            m: "y = 15x + 25", say: "Rate times months, plus the start." },
          { step: 4, ask: "Check month 3: what is $15(3) + 25$?", type: "num", answer: 70, hint: "$45 + 25$.", m: "15(3) + 25 = 70", say: "It matches the table ✓." }],
        why: "Start, rate, equation, check. Now go from a table to a graph." },
      { type: "plane", kicker: "On your own",
        prompt: "Graph a table. **Drag $A$ and $B$ onto the points $(0, 2)$ and $(2, 8)$** and read the line the picture makes.",
        x: [-2, 6], y: [-2, 12], gate: true,
        points: [{ id: "A", x: 1, y: 1, drag: true, label: "A" }, { id: "B", x: 3, y: 5, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "blue", slope: true }],
        readout: function (st) { return lineWords(st.pt("A"), st.pt("B")); },
        goal: function (st) { var a = st.pt("A"), b = st.pt("B"); return (a.x === 0 && a.y === 2 && b.x === 2 && b.y === 8) || (b.x === 0 && b.y === 2 && a.x === 2 && a.y === 8); },
        fb: function () { return "Each row of a table is a point $(x, y)$: $x$ across, $y$ up."; },
        answer: { points: { A: [0, 2], B: [2, 8] } }, skill: "Graph a table",
        hints: ["Row $(0, 2)$: across 0, up 2."], why: "The line through $(0, 2)$ and $(2, 8)$ has slope 3 and $y$-intercept 2: $y = 3x + 2$." },
      { type: "equation",
        prompt: "Read this graph and write its equation." +
          fig({ x: [-3, 6], y: [-4, 8], u: 24, alt: "A falling line through (0, 4), (1, 2) and (3, -2).", items: [{ line: [[0, 4], [1, 2]], c: "blue" }, { pt: [0, 4], c: "orange" }, { pt: [1, 2], c: "orange" }, { pt: [3, -2], c: "orange" }] }),
        answer: "y=-2x+4", shown: "y = -2x + 4", form: "slope-intercept", skill: "Equation from a graph",
        near: [{ v: "y=2x+4", fb: "The line falls as it goes right: the slope is negative." },
               { v: "y=-2x", fb: "It crosses the vertical axis at 4, not at 0." },
               { v: "y=-0.5x+4", fb: "From $(0, 4)$ to $(1, 2)$: across 1, *down 2* — slope $-2$, not $-\\frac{1}{2}$." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "y = …",
        hints: ["Where does it cross the vertical axis? How far does it drop for each step right?"],
        why: "Crosses at $(0, 4)$; goes down 2 for each 1 across. $y = -2x + 4$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What if the table has **no row at $x = 0$**? The rows are $(2, 9)$, $(4, 13)$ and $(6, 17)$.",
        scene: { type: "walk", how: HOW_1_13, rows: [
          { step: 2, m: "m = \\frac{13 - 9}{4 - 2} = 2", say: "The start is not shown, so find the rate first." },
          { step: 3, m: "9 = 2(2) + b, \\; b = 5", say: "Put a row into $y = 2x + b$ to find the start." },
          { step: 3, m: "y = 2x + 5", say: "The equation." },
          { step: 4, m: "2(6) + 5 = 17", say: "Check the last row ✓." }] },
        gate: true },
      { type: "equation", kicker: "Try it",
        prompt: "What if the table has **no row at $x = 0$**?" + tbl(["$x$", "$y$"], [[2, 7], [4, 13], [6, 19]]) + "Write the equation of the line.",
        answer: "y=3x+1", shown: "y = 3x + 1", form: "slope-intercept", skill: "Equation from a table",
        near: [{ v: "y=3x", fb: "Test it: $x = 2$ would give 6, but the table says 7. There's a starting amount as well." },
               { v: "y=3x+7", fb: "The 7 is $y$ at $x = 2$, not at $x = 0$. Find $b$ by putting a row into $y = 3x + b$." },
               { v: "y=6x+1", fb: "From $x = 2$ to $x = 4$, $y$ rises by 6 — but $x$ rose by 2. Slope is *per 1* of $x$: $6 \\div 2$." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "y = …",
        hints: ["Slope: $\\frac{13 - 7}{4 - 2}$.", "Then put $x = 2, y = 7$ into $y = 3x + b$."],
        why: "Slope $\\frac{6}{2} = 3$. Put in $(2, 7)$: $7 = 3(2) + b$, so $b = 1$. $y = 3x + 1$." },
      { type: "table",
        prompt: "Now the other direction: **make a table from an equation.** For $y = -2x + 7$, fill in the blanks.",
        head: ["$x$", "$y$"], rows: [[-1, null], [0, null], [1, 5], [2, null], [5, null]],
        answers: [[0, 1, 9], [1, 1, 7], [3, 1, 3], [4, 1, -3]], skill: "Table from an equation",
        hints: ["Put each $x$ in: $-2x + 7$. For $x = -1$: $-2(-1) + 7$."], why: "$-2(-1) + 7 = 9$; $x = 0$: 7; $x = 2$: 3; $x = 5$: $-3$." },
      { type: "sort",
        prompt: "Six descriptions of **two** lines. Sort them by which line they describe.",
        bins: ["$y = 2x + 1$", "$y = 6 - x$"],
        cards: [{ t: "Starts at 1 and grows by 2 each day", bin: 0 },
                { t: "$(0, 1),\\; (1, 3),\\; (2, 5)$", bin: 0 },
                { t: "$2x - y = -1$", bin: 0, fb: "Solve for $y$: $y = 2x + 1$." },
                { t: "Starts at 6 and drops by 1 each day", bin: 1 },
                { t: "$(0, 6),\\; (2, 4),\\; (4, 2)$", bin: 1 },
                { t: "$x + y = 6$", bin: 1, fb: "Solve for $y$: $y = 6 - x$." }],
        skill: "Equation from a table", hints: ["For each, find where it starts and how it changes."], why: "A line can be shown as a story, a table, a graph or an equation. All are the same thing seen from different sides." },
      { type: "choice", kicker: "Find the error",
        prompt: "A table has the rows $(0, 5)$, $(1, 8)$ and $(2, 11)$. Kiran writes $y = 5x + 3$. What is wrong?",
        options: [{ t: "The start and the rate are swapped. It should be $y = 3x + 5$." },
                  { t: "The rate is 8.", fb: "8 is a value of $y$. The rate is the change from row to row: 3." },
                  { t: "Nothing. It fits the first row.", fb: "At $x = 0$ his equation gives 3, but the table says 5." }],
        answer: 0, skill: "Equation from a table", hints: ["Step 4: test his equation on the row $(0, 5)$."],
        why: "The start is 5 and the rate is 3: $y = 3x + 5$." },
      { type: "equation", kicker: "Use it",
        prompt: "A plumber charges a flat call-out fee plus an hourly rate. A **2-hour** job costs **\\$110**; a **5-hour** job costs **\\$230**. Write the equation for the cost $y$ of $x$ hours.",
        answer: "y=40x+30", shown: "y = 40x + 30", form: "slope-intercept", skill: "Equation from a description",
        near: [{ v: "y=55x", fb: "If it were \\$55 an hour, 5 hours would be \\$275, not \\$230. Find the rate from the two jobs: extra cost ÷ extra hours." },
               { v: "y=30x+40", fb: "The hourly rate is the *slope*: extra cost divided by extra hours. The fee is the intercept." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "y = …",
        hints: ["Two rows: $(2, 110)$ and $(5, 230)$. Slope first.", "Then use one row to find the fee."],
        why: "Slope $\\frac{230 - 110}{5 - 2} = 40$ dollars an hour. Then $110 = 40(2) + b$, so $b = 30$." }
    ]
  });

  /* ============================== 1.14 · Parallel and perpendicular lines */
  var HOW_1_14 = [["Slope", "Find the slope of the given line."], ["New slope", "Parallel: use the same slope. Perpendicular: flip it and change its sign."], ["Point", "Put the new slope and the given point into $y = mx + b$, to find $b$."], ["Write", "Write the equation."]];
  LESSONS.push({
    title: "Equations of parallel and perpendicular lines",
    blurb: "Book 1.14 · Parallel lines share a slope; perpendicular lines' slopes multiply to $-1$.",
    mins: 12, v: 4,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is the slope of the line $y = 2x + 1$?",
        answer: 2, skill: "Parallel lines",
        near: [{ v: 1, fb: "1 is the $y$-intercept. The slope multiplies $x$." }],
        hints: ["The number multiplying $x$."], why: "In $y = mx + b$, the slope is $m$: here 2." },
      { type: "plane", kicker: "Explore",
        prompt: "The **grey** line is $y = 2x + 1$. Use the sliders to make the **blue** line **parallel** to it — always the same distance away, never meeting — but not the same line.",
        x: [-6, 6], y: [-6, 6], gate: true,
        params: { m: { v: 0, min: -4, max: 4, step: 0.5, label: "slope $m$" }, b: { v: 0, min: -5, max: 5, step: 1, label: "start $b$" } },
        fns: [{ f: "2*x + 1", color: "green" }, { f: "m*x + b", color: "blue" }],
        readout: function (st) { return "blue: $y = " + poly([[st.params.m, "x"], [st.params.b, ""]]) + "$ &nbsp;·&nbsp; grey: $y = 2x + 1$"; },
        goal: function (st) { return st.params.m === 2 && st.params.b !== 1; },
        fb: function (st) { return st.params.m === 2 ? "Same slope — but it's the *same line* right now. Move it up or down." : "Look at how steeply each line rises. Parallel lines climb at the same rate."; },
        answer: { params: { m: 2, b: -2 } }, skill: "Parallel lines",
        hints: ["Parallel lines lean the same way by the same amount. What does that say about their slopes?"],
        why: "Any line $y = 2x + b$ with $b \\ne 1$: same slope 2, different intercept." },
      { type: "learn", kicker: "The idea",
        prompt: "**Parallel** lines have the same slope: neither climbs faster, so they never meet. **Perpendicular** lines cross at a right angle, and their slopes multiply to $-1$: flip the slope and change its sign.",
        scene: { type: "method", how: HOW_1_14 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the line written that is **parallel** to $y = 3x + 2$ and passes through $(1, 7)$.",
        scene: { type: "walk", how: HOW_1_14, rows: [
          { step: 1, m: "m = 3", say: "The slope of the given line." },
          { step: 2, m: "m = 3", say: "Parallel: the same slope.",
            ask: { prompt: "The new line must be parallel to $y = 3x + 2$. What is its slope?", answer: 0,
                   options: [{ t: "3" }, { t: "$-\\frac{1}{3}$", fb: "That is the slope of a **perpendicular** line. Parallel lines share a slope." }] } },
          { step: 3, m: "7 = 3(1) + b, \\; b = 4", say: "Put the point $(1, 7)$ into $y = 3x + b$." },
          { step: 4, m: "y = 3x + 4", say: "Same slope, different intercept: the two lines never meet." }] },
        gate: true,
        then: "Parallel lines: same slope, different intercepts." },
      { type: "guided", kicker: "Together",
        prompt: "Now you write the line **parallel** to $y = 2x + 1$ that passes through $(3, 1)$.",
        how: HOW_1_14, skill: "Parallel lines",
        steps: [
          { step: 1, ask: "What is the slope of $y = 2x + 1$?", type: "num", answer: 2, hint: "The number multiplying $x$.", m: "m = 2", say: "The given line's slope." },
          { step: 2, ask: "The new line is parallel. What is its slope?", type: "choice", answer: 0,
            options: [{ t: "2" }, { t: "$-\\frac{1}{2}$", fb: "That would make it perpendicular. Parallel keeps the slope." }, { t: "1", fb: "1 is the intercept of the given line." }],
            m: "m = 2", say: "The same slope." },
          { step: 3, ask: "Put $(3, 1)$ into $y = 2x + b$: $1 = 6 + b$. What is $b$?", type: "num", pre: "$b =$", answer: -5, near: [{ v: 5, fb: "$1 - 6$ is negative." }], hint: "Subtract 6 from both sides.",
            m: "1 = 2(3) + b, \\; b = -5", say: "The point fixes $b$." },
          { step: 4, ask: "Write the equation.", type: "choice", answer: 0,
            options: [{ t: "$y = 2x - 5$" }, { t: "$y = 2x + 1$", fb: "That is the original line. It does not pass through $(3, 1)$." }, { t: "$y = -5x + 2$", fb: "The slope is 2 and the intercept is $-5$." }],
            m: "y = 2x - 5", say: "Parallel to $y = 2x + 1$, through $(3, 1)$." }],
        why: "Slope, new slope, point, write. Now one on your own." },
      { type: "equation", kicker: "On your own", prompt: "Write the line **parallel** to $y = 4x - 1$ that passes through $(0, 3)$.", answer: "y=4x+3", shown: "y = 4x + 3", form: "slope-intercept", skill: "Parallel lines",
        near: [{ v: "y=4x-1", fb: "That is the original line. It does not pass through $(0, 3)$." }, { v: "y=-0.25x+3", fb: "That is a perpendicular slope. Parallel keeps the slope." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "y = …",
        hints: ["Step 2: the slope stays 4.", "Step 3: the point $(0, 3)$ is on the $y$-axis, so $b = 3$."], why: "Slope 4, through $(0, 3)$: $y = 4x + 3$." },
      { type: "plane", kicker: "Explore",
        prompt: "Now **perpendicular**: crossing at a right angle. The grey line is $y = 2x$. Use the slider to turn the blue line (through the same point, the origin) until the corner between them is a **right angle**.",
        x: [-6, 6], y: [-6, 6], gate: true,
        params: { m: { v: 1, min: -3, max: 3, step: 0.5, label: "slope $m$" }, b: { v: 0, min: 0, max: 0, fixed: true } },
        fns: [{ f: "2*x", color: "green" }, { f: "m*x", color: "blue" }],
        readout: function (st) { var m = st.params.m; return "blue slope $" + num(m) + "$ · grey slope $2$ · product $" + num(2 * m) + "$"; },
        goal: function (st) { return st.params.m === -0.5; },
        fb: function () { return "Look at the corner. When the angle is exactly square, the blue line has gone from *rising* to *falling* — and much flatter than the grey one."; },
        answer: { params: { m: -0.5 } }, skill: "Perpendicular lines",
        hints: ["A perpendicular line to a rising line has to *fall*. How steeply, if the grey line is steep?"],
        why: "At a right angle the blue slope is $-\\frac{1}{2}$: the product with the grey slope is $2 \\times (-\\frac{1}{2}) = -1$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Now **perpendicular**. Write the line perpendicular to $y = 3x - 2$ that passes through $(3, 2)$.",
        scene: { type: "walk", how: HOW_1_14, rows: [
          { step: 1, m: "m = 3", say: "The slope of the given line." },
          { step: 2, m: "m = -\\frac{1}{3}", say: "Flip 3 to $\\frac{1}{3}$ and change the sign. Check: $3 \\cdot \\left(-\\frac{1}{3}\\right) = -1$." },
          { step: 3, m: "2 = -\\frac{1}{3}(3) + b, \\; b = 3", say: "Put the point in: $2 = -1 + b$." },
          { step: 4, m: "y = -\\frac{1}{3}x + 3", say: "It crosses the given line at a right angle." }] },
        gate: true },
      { type: "equation", kicker: "Try it", prompt: "Write the line **perpendicular** to $y = 2x + 3$ through the point $(4, 1)$.", answer: "y=-0.5x+3", shown: "y = -1/2 x + 3", form: "slope-intercept", skill: "Perpendicular lines",
        near: [{ v: "y=2x-7", fb: "That's the *parallel* line through $(4, 1)$. For perpendicular, flip and negate the slope." },
               { v: "y=-0.5x+1", fb: "The 1 is the point's $y$-coordinate, not the intercept. Put $(4, 1)$ into $y = -\\frac{1}{2}x + b$." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"]], placeholder: "y = …",
        hints: ["Slope: negative reciprocal of 2. Then find $b$."], why: "Slope $-\\frac{1}{2}$. Then $1 = -\\frac{1}{2}(4) + b$, so $b = 3$." },
      { type: "sort",
        prompt: "**Parallel, perpendicular, or neither?** Compare the slopes — you may need to rearrange first.",
        bins: ["Parallel", "Perpendicular", "Neither"],
        cards: [{ t: "$y = 3x + 1$ and $y = 3x - 4$", bin: 0, fb: "Both slopes are 3 (different intercepts)." },
                { t: "$y = 2x$ and $y = -\\frac{1}{2}x + 3$", bin: 1, fb: "$2 \\times (-\\frac{1}{2}) = -1$." },
                { t: "$2x + y = 4$ and $y = -2x + 7$", bin: 0, fb: "Rearrange the first: $y = -2x + 4$. Both slopes are $-2$." },
                { t: "$y = 3x$ and $y = -3x$", bin: 2, fb: "The slopes are opposite, but their product is $-9$, not $-1$." },
                { t: "$y = x + 1$ and $y = -x + 1$", bin: 1, fb: "$1 \\times (-1) = -1$." },
                { t: "$x = 4$ and $y = 2$", bin: 1, fb: "A vertical line and a horizontal line always meet at a right angle." }],
        skill: "Parallel and perpendicular", hints: ["Get each in $y = mx + b$ form, then compare the two slopes: equal? product $-1$?"],
        why: "Equal slopes: parallel. Slopes with product $-1$ (or one vertical, one horizontal): perpendicular. Otherwise: neither." },
      { type: "choice", kicker: "Find the error",
        prompt: "A line has slope 2. Kiran says a line perpendicular to it has slope $-2$. What is wrong?",
        options: [{ t: "Changing the sign is half of it. Flip it too: $-\\frac{1}{2}$." },
                  { t: "The perpendicular slope is 2.", fb: "The same slope gives a parallel line." },
                  { t: "Nothing. Opposite slopes are perpendicular.", fb: "Test it: $2 \\cdot (-2) = -4$. Perpendicular slopes multiply to $-1$." }],
        answer: 0, skill: "Perpendicular lines", hints: ["Step 2: the slopes must multiply to $-1$."],
        why: "$2 \\cdot \\left(-\\frac{1}{2}\\right) = -1$. Flip, and change the sign." },
      { type: "plane", kicker: "Use it",
        prompt: "Build a right angle. $A$ is the origin and $B$ is $(4, 2)$. **Drag $C$ anywhere so that $AC$ is perpendicular to $AB$.** The readout shows both slopes and their product.",
        x: [-6, 6], y: [-6, 6], gate: true,
        points: [{ id: "A", x: 0, y: 0, label: "A" }, { id: "B", x: 4, y: 2, label: "B" }, { id: "C", x: 2, y: 4, drag: true, label: "C" }],
        lines: [{ through: ["A", "B"], color: "green", extend: false }, { through: ["A", "C"], color: "blue", extend: false }],
        readout: function (st) { var c = st.pt("C"); if (c.x === 0) return "$AC$ is vertical; $AB$ has slope $\\frac{1}{2}$."; var m2 = c.y / c.x; return "slope of $AB = 0.5$ · slope of $AC = " + num(Math.round(m2 * 100) / 100) + "$ · product $" + num(Math.round(0.5 * m2 * 100) / 100) + "$"; },
        goal: function (st) { var c = st.pt("C"); return c.x !== 0 && Math.abs(0.5 * (c.y / c.x) + 1) < 1e-9; },
        fb: function () { return "Aim for a product of exactly $-1$. $AB$ has slope $\\frac{1}{2}$, so $AC$ needs slope $-2$: down 2 for every 1 across, or up 2 for every 1 to the left."; },
        answer: { points: { C: [-1, 2] } }, skill: "Perpendicular lines",
        hints: ["$AC$ needs slope $-2$. From the origin, that's one step left and two up."], why: "$C = (-1, 2)$ gives slope $\\frac{2}{-1} = -2$, and $\\frac{1}{2} \\times (-2) = -1$." }
    ]
  });

  /* ====================================================== 1.15 · Direct variation */
  var HOW_1_15 = [["Ratio", "Divide $y$ by $x$ for a pair you know. That is $k$."], ["Check", "Check that every pair gives the same ratio."], ["Equation", "Write $y = kx$."], ["Use", "Put in a new $x$ to find $y$."]];
  LESSONS.push({
    title: "Direct variation",
    blurb: "Book 1.15 · When one quantity is always a fixed multiple of another, $y = kx$: a line through the origin.",
    mins: 12, v: 4,
    steps: [
      { type: "table", kicker: "Warm up",
        prompt: "A car uses **2 gallons** of gas for every **50 miles**. Fill in the distance it can go on each amount of gas.",
        head: ["gallons $g$", "miles $d$"], rows: [[1, null], [2, 50], [4, null], [10, null]],
        answers: [[0, 1, 25], [2, 1, 100], [3, 1, 250]], skill: "Direct variation",
        hints: ["If 2 gallons go 50 miles, how far does 1 gallon go?"], why: "1 gallon goes 25 miles. So 4 gallons: 100; 10 gallons: 250." },
      { type: "learn", kicker: "The idea",
        prompt: "When one quantity is always the same multiple of another, they are in **direct variation**: $y = kx$. The number $k$ is the constant ratio $\\frac{y}{x}$. Its graph is a line through the origin: nothing in, nothing out.",
        scene: { type: "method", how: HOW_1_15 } },
      { type: "learn", kicker: "Watch",
        prompt: "The car goes 50 miles on 2 gallons, 100 on 4 and 150 on 6. Watch its equation written.",
        scene: { type: "walk", how: HOW_1_15, rows: [
          { step: 1, m: "\\frac{50}{2} = 25", say: "Miles divided by gallons." },
          { step: 2, m: "\\frac{100}{4} = 25, \\quad \\frac{150}{6} = 25", say: "The same ratio in every row.",
            ask: { prompt: "Every row gives miles ÷ gallons = 25. What does that tell you?", answer: 0,
                   options: [{ t: "The distance is always 25 times the gas" }, { t: "The car always travels 25 miles", fb: "25 is miles **per gallon**: the multiplier, not the distance." }] } },
          { step: 3, m: "d = 25g", say: "Distance is 25 times the gallons." },
          { step: 4, m: "d = 25(7) = 175", say: "On 7 gallons: 175 miles." }] },
        gate: true,
        then: "**Direct variation**: $y = kx$, a line through $(0, 0)$." },
      { type: "guided", kicker: "Together",
        prompt: "$y$ varies directly with $x$, and $y = 12$ when $x = 3$. Find $y$ when $x = 7$.",
        how: HOW_1_15, skill: "Direct variation",
        steps: [
          { step: 1, ask: "What is $k = \\frac{12}{3}$?", type: "num", pre: "$k =$", answer: 4, hint: "$12 \\div 3$.", m: "k = \\frac{12}{3} = 4", say: "The constant ratio." },
          { step: 3, ask: "Write the equation.", type: "choice", answer: 0,
            options: [{ t: "$y = 4x$" }, { t: "$y = x + 9$", fb: "That gives 12 at $x = 3$ as well, but at $x = 0$ it gives 9. Direct variation passes through the origin." }, { t: "$y = \\frac{x}{4}$", fb: "At $x = 3$ that gives $\\frac{3}{4}$, not 12." }],
            m: "y = 4x", say: "$y$ is always 4 times $x$." },
          { step: 4, ask: "What is $y$ when $x = 7$?", type: "num", pre: "$y =$", answer: 28, hint: "$4 \\times 7$.", m: "y = 4(7) = 28", say: "Multiply by $k$." }],
        why: "Ratio, equation, use. Now decide which tables vary directly." },
      { type: "sort", kicker: "On your own",
        prompt: "Each set of points is from a table. **Does $y$ vary directly with $x$?** Test whether $y \\div x$ is always the same.",
        bins: ["Direct variation", "Not direct variation"],
        cards: [{ t: "$(1, 3),\\; (2, 6),\\; (5, 15)$", bin: 0, fb: "$y \\div x$ is 3 every time." },
                { t: "$(1, 4),\\; (2, 6),\\; (3, 8)$", bin: 1, fb: "$4, 3, 2.67$ — not constant. It's $y = 2x + 2$: there's a starting amount." },
                { t: "$(2, 5),\\; (4, 10),\\; (6, 15)$", bin: 0, fb: "$y \\div x = 2.5$ every time." },
                { t: "$(1, 2),\\; (2, 3),\\; (3, 4)$", bin: 1, fb: "$2, 1.5, 1.33$. Adding 1 each time isn't the same as multiplying." }],
        skill: "Direct variation", hints: ["Divide $y$ by $x$ in every row. All the same?"], why: "Direct variation: $y \\div x$ is constant. If the line doesn't pass through the origin, it isn't." },
      { type: "plane",
        prompt: "Slide $k$ until the line passes through **both** red points, $(2, 5)$ and $(4, 10)$. A line through the origin only needs a slope.",
        x: [-2, 8], y: [-2, 14], gate: true,
        params: { k: { v: 1, min: -1, max: 4, step: 0.5, label: "constant $k$" } },
        fns: [{ f: "k*x", color: "blue" }],
        marks: [{ x: 2, y: 5, color: "red", r: 6, label: "(2, 5)" }, { x: 4, y: 10, color: "red", r: 6, label: "(4, 10)" }],
        readout: function (st) { return "$y = " + num(st.params.k) + "x$"; },
        goal: function (st) { return st.params.k === 2.5; },
        fb: function (st) { return "At $x = 2$ this line is at $y = " + num(2 * st.params.k) + "$; the red point is at 5."; },
        answer: { params: { k: 2.5 } }, skill: "Direct variation",
        hints: ["$k = y \\div x$ at either point: $5 \\div 2$."], why: "$k = \\frac{5}{2} = 2.5$ and $\\frac{10}{4} = 2.5$: $y = 2.5x$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Direct variation works in both directions. A paycheck varies directly with hours worked: **\\$126 for 9 hours**.",
        scene: { type: "walk", how: HOW_1_15, rows: [
          { step: 1, m: "k = \\frac{126}{9} = 14", say: "Pay divided by hours: \\$14 an hour." },
          { step: 3, m: "p = 14h", say: "The equation." },
          { step: 4, m: "p = 14(14) = 196", say: "For 14 hours: \\$196." },
          { step: 4, m: "\\frac{252}{14} = 18", say: "And backwards: to earn \\$252, divide by $k$. That is 18 hours." }] },
        gate: true },
      { type: "num", kicker: "Try it",
        prompt: "An electric bill varies directly with the kilowatt-hours used. **\\$72 for 600 kWh.** How much for **850 kWh**?", pre: "$\\$$", answer: 102, skill: "Direct variation applications",
        near: [{ v: 122, fb: "That's $72 + 50$. First find the rate: $72 \\div 600 = 0.12$ dollars per kWh. Then multiply by 850." }],
        hints: ["$k = 72 \\div 600 = 0.12$."], why: "$k = 0.12$ dollars per kWh: $y = 0.12 \\times 850 = 102$." },
      { type: "multi",
        prompt: "**Which of these show direct variation** ($y = kx$)?",
        options: [{ t: "$y = 5x$", ok: true }, { t: "$y = \\dfrac{x}{3}$", ok: true },
                  { t: "$y = -4x$", ok: true },
                  { t: "$y = 2x + 1$", fb: "The $+1$ means $y = 1$ when $x = 0$: the line doesn't pass through the origin." },
                  { t: "$y = 7$", fb: "This is a flat line at 7, not through the origin (unless $y$ were 0)." },
                  { t: "$xy = 12$", fb: "Here $y$ *falls* as $x$ rises: the product is constant, not the ratio." }],
        skill: "Direct variation", hints: ["Can it be written $y = kx$ — a number times $x$ with nothing added?"], why: "$k$ can be a fraction ($\\frac{1}{3}$) or negative ($-4$). But no added constant, and $x$ stays on top." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran says $y = 3x + 2$ is a direct variation, “because $y$ goes up as $x$ goes up”. What is wrong?",
        options: [{ t: "Direct variation needs $\\frac{y}{x}$ to be constant. Here $x = 0$ gives $y = 2$, not 0." },
                  { t: "The slope should be negative.", fb: "A direct variation can have any $k$ except 0. The trouble is the $+ 2$." },
                  { t: "Nothing. Every rising line is a direct variation.", fb: "Check the ratio: at $x = 1$, $\\frac{y}{x} = 5$. At $x = 2$, it is 4. Not constant." }],
        answer: 0, skill: "Direct variation", hints: ["Step 2: work out $\\frac{y}{x}$ for two different pairs."],
        why: "A direct variation is $y = kx$, through the origin. The $+ 2$ breaks it." },
      { type: "num", kicker: "Use it", prompt: "And the other way round. A car used **3.5 gallons** to go **98 miles**. At that rate, **how many gallons** to go **224 miles**?", answer: 8, skill: "Direct variation applications",
        near: [{ v: 224, fb: "$k = 98 \\div 3.5 = 28$ miles per gallon. Now *divide* the miles by 28 to get gallons." }, { v: 6272, fb: "$224 \\times 28$? That would be miles×miles-per-gallon. Gallons = miles ÷ miles-per-gallon." }],
        hints: ["Find miles per gallon: $98 \\div 3.5 = 28$. Then how many 28s in 224?"], why: "$k = 28$ miles a gallon; $224 \\div 28 = 8$ gallons." }
    ]
  });
  /* ================================================ Project 1 · Slopes and intercepts */
  // Three graphs, side by side, for the project's matching game.
  function threeGraphs() {
    var win = { x: [-2, 6], y: [-4, 8], u: 15, w: 190 };
    return L.figs([
      fig(Object.assign({ alt: "Graph A: a falling line from 6 on the vertical axis to 3 on the horizontal axis.", items: [{ line: [[0, 6], [3, 0]], c: "blue" }, { text: "A", at: [-1.3, 7.2], c: "ink" }] }, win)),
      fig(Object.assign({ alt: "Graph B: a gently rising line from -2 on the vertical axis to 4 on the horizontal axis.", items: [{ line: [[0, -2], [4, 0]], c: "green" }, { text: "B", at: [-1.3, 7.2], c: "ink" }] }, win)),
      fig(Object.assign({ alt: "Graph C: a steep rising line from 3 on the vertical axis to -1 on the horizontal axis.", items: [{ line: [[0, 3], [-1, 0]], c: "orange" }, { text: "C", at: [-1.3, 7.2], c: "ink" }] }, win))
    ]);
  }
  LESSONS.push({
    title: "Project: Slopes and intercepts",
    tag: "Project",
    blurb: "Book Project 1 · Read graphs, match them to equations, and write the story a line tells. You finish with something you made.",
    mins: 20, v: 3,
    steps: [
      { type: "choice", kicker: "Notice and wonder",
        prompt: "A baker's graph shows **sugar** (cups, across) against **flour** (cups, up) for a recipe that scales up: the line passes through $(0, 0)$, $(2, 3)$ and $(4, 6)$. **What do you notice?**" +
          fig({ x: [0, 6], y: [0, 9], u: 26, alt: "A line through the origin, (2, 3) and (4, 6).", items: [{ line: [[0, 0], [2, 3]], c: "blue" }, { pt: [2, 3], name: "(2, 3)", at: "se", c: "orange" }, { pt: [4, 6], name: "(4, 6)", at: "se", c: "orange" }] }),
        options: [{ t: "The line starts at the origin, so with 0 sugar you need 0 flour — and it rises 3 for every 2 across" },
                  { t: "It starts with 3 cups of flour before any sugar", fb: "Look at the point where the line meets the vertical axis: it's at 0, not 3." },
                  { t: "The flour goes down as the sugar goes up", fb: "The line rises: more sugar goes with more flour." }],
        answer: 0, skill: "Read a graph", hints: ["Where does it cross each axis? Which way does it lean?"],
        why: "A line through the origin with slope $\\frac{3}{2}$: $y = 1.5x$ — direct variation. For every 2 cups of sugar, 3 cups of flour." },
      { type: "table", kicker: "Round 1 · Key features",
        prompt: "Here are three graphs, **A**, **B** and **C**. For each, find the **slope**, the **$y$-intercept** and the **$x$-intercept** — the three numbers you read from a graph." + threeGraphs(),
        head: ["", "slope", "$y$-intercept", "$x$-intercept"],
        rows: [["A", null, null, null], ["B", null, null, null], ["C", null, null, null]],
        answers: [[0, 1, -2], [0, 2, 6], [0, 3, 3], [1, 1, 0.5], [1, 2, -2], [1, 3, 4], [2, 1, 3], [2, 2, 3], [2, 3, -1]], skill: "Read a graph",
        hints: ["The $y$-intercept is where the line meets the vertical axis; the $x$-intercept where it meets the horizontal axis.", "Slope: rise ÷ run between two points — for A, from $(0, 6)$ to $(3, 0)$: down 6, across 3."],
        why: "A: through $(0,6)$ and $(3,0)$ — slope $-2$. B: through $(0,-2)$ and $(4,0)$ — slope $\\frac{1}{2}$. C: through $(0,3)$ and $(-1,0)$ — slope 3." },
      { type: "slots", kicker: "Round 2 · Equation matches",
        prompt: "Match each graph to its equation. **Explain to yourself how you know** — check the slope and the intercept.",
        slots: [{ id: "A", label: "**Graph A**" }, { id: "B", label: "**Graph B**" }, { id: "C", label: "**Graph C**" }],
        cards: [{ t: "$y = -2x + 6$", slot: "A", fb: "Graph A crosses at 6 and falls 2 for every 1 across." },
                { t: "$x - 2y = 4$", slot: "B", fb: "Graph B: solve for $y$: $y = \\frac{1}{2}x - 2$. It crosses at $-2$, rising $\\frac{1}{2}$ for each 1 across." },
                { t: "$y = 3x + 3$", slot: "C", fb: "Graph C crosses at 3 and rises 3 for every 1 across." },
                { t: "$y = 2x - 6$" }],
        skill: "Match equation and graph", hints: ["Use the numbers from Round 1. For B, rearrange the equation into $y = mx + b$ first."], why: "Each equation's slope and intercepts match one graph. Standard form ($x - 2y = 4$) needs rearranging to see them." },
      { type: "num", kicker: "Round 2 · Prove it",
        prompt: "Choose the equation for **Graph B**, $x - 2y = 4$. Prove that the point $(6, 1)$ is on it: what is $x - 2y$ when $x = 6$ and $y = 1$?",
        answer: 4, skill: "Points on a graph",
        near: [{ v: -4, fb: "$6 - 2(1) = 4$. Watch the order: it's $x$ minus $2y$." }],
        hints: ["Put $x = 6$ and $y = 1$ into $x - 2y$."], why: "$6 - 2(1) = 4$, which is the right-hand side — so $(6, 1)$ is a solution, and a point on Graph B's line." },
      { type: "equation", kicker: "Round 3 · Scenarios",
        prompt: "Now the other direction: from a **story** to a line. A gym's junior swim club charges a **\\$30 registration fee** plus **\\$12 for each lesson**. Write an equation for the total cost $y$ after $x$ lessons.",
        answer: "y=12x+30", shown: "y = 12x + 30", form: "slope-intercept", skill: "Write an equation",
        near: [{ v: "y=30x+12", fb: "The registration is paid once (intercept); \\$12 is per lesson (slope)." }],
        keys: [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "y = …",
        hints: ["Slope: cost per lesson. Intercept: the cost before any lessons."], why: "$y = 12x + 30$." },
      { type: "multi", prompt: "Which of these does this line **tell you**? Pick every correct reading of $y = 12x + 30$.",
        options: [{ t: "The point $(5, 90)$: five lessons cost \\$90 in all", ok: true },
                  { t: "The $y$-intercept, 30: the fee you pay before any lessons", ok: true },
                  { t: "The slope, 12: each extra lesson adds \\$12", ok: true },
                  { t: "The $x$-intercept is at $x = 30$", fb: "The $x$-intercept is where $y = 0$: $12x + 30 = 0$ gives $x = -2.5$ — not meaningful for lessons. 30 is the *$y$*-intercept." },
                  { t: "The point $(90, 5)$: 90 lessons cost \\$5", fb: "$x$ comes first: 90 would be lessons. Read it as $(x, y)$." }],
        skill: "Meaning of a point", hints: ["Use $x$ = lessons, $y$ = dollars. What do the slope, intercept and a point mean?"],
        why: "$12(5) + 30 = 90$ ✓. The intercept is the starting cost, the slope the cost per lesson. The $x$-intercept, $-2.5$, means nothing in the situation — a good reminder that not every feature of a graph has a meaning in the story." },
      { type: "explain", kicker: "Your project",
        prompt: "**Write a real-world problem that one of your lines could model.** Choose one of the equations from this project (or make your own). Include: what $x$ and $y$ are; one point on the line and what it means; and what the slope and the $y$-intercept mean.",
        placeholder: "Problem: A … charges … Let x be … and y be … The point (…, …) means …",
        model: "A strong answer names x and y with units; gives a point — for example (5, 90): “5 lessons cost \\$90 in total” — and checks that it satisfies the equation; says the slope is the rate of change (dollars per lesson) and the y-intercept is the starting amount (the fee before any lessons); and notices any feature that means nothing in the story (a negative x-intercept)." },
      { type: "learn", kicker: "Unit 1 done",
        prompt: "This unit began with a city manager balancing a budget against constraints. Look at what you can do now:",
        scene: { type: "walk", rows: [
          { say: "**Say what's true.** Write expressions, equations and inequalities that model a situation and its limits." },
          { say: "**Know what a solution is** — a value that makes it true and makes sense — and find it by moves that keep the equation equivalent." },
          { say: "**Pick your variable.** Solve an equation for the thing you keep asking about." },
          { say: "**Draw it.** Read slope and intercepts from an equation, a table, a graph or a story — and write the equation of a line from a slope and a point, two points, or its parallel or perpendicular." },
          { say: "**Model a proportional relationship** with $y = kx$." }] },
        gate: true,
        after: "Next up is **Unit 2 — Systems of Equations and Inequalities**: two constraints at once. Nothing is locked, and the unit test and the skills below are always open." }
    ]
  });

  /* ================================================================ Skills
     Practice that generates a fresh problem every sitting, with hints, a
     worked solution and a reply for each slip this unit is known for. The
     quizzes and the unit test draw from these. */
  var KEYS_XY = [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]];
  // Keep only replies whose wrong answer is different from the right one.
  function near(ans, list) { return list.filter(function (n) { return n.v !== ans && (typeof n.v !== "number" || Math.abs(n.v - ans) > 1e-9); }); }
  function clean(s) { return String(s).replace(/\s/g, ""); }
  function lineEq(m, b) { return "y=" + clean(poly([[m, "x"], [b, ""]])); }
  function shownLine(m, b) { return "y = " + poly([[m, "x"], [b, ""]]); }
  // A slope as text for an answer that may be a fraction: 0.5 or 3/2 are both fine to type.
  var SKILLS = [
    { id: "u1-solve", title: "Solve a linear equation", lesson: 1,
      gen: function (R) {
        var kind = R.int(0, 2), x = R.nz(-9, 9), tex, ns, why;
        if (kind === 0) {
          var a = R.int(3, 8), c = R.int(1, a - 1), b = R.nz(-9, 9), d = b + (a - c) * x;
          tex = poly([[a, "x"], [b, ""]]) + " = " + poly([[c, "x"], [d, ""]]);
          ns = near(x, [{ v: (d + b) / (a - c), fb: "When " + (b < 0 ? "$" + b + "$" : "$+" + b + "$") + " moves across the equals sign it changes sign." }]);
          why = lines([tex, poly([[a - c, "x"], [b, ""]]) + " = " + d, poly([[a - c, "x"]]) + " = " + (d - b), "x = " + x]);
        } else if (kind === 1) {
          var k = R.int(2, 6), p = R.nz(-6, 6), rhs = k * (x + p);
          tex = k + "(x " + signed(p) + ") = " + rhs;
          ns = near(x, [{ v: rhs / k + p, fb: "Divide first, then take the $" + p + "$ *away* — it was added inside the bracket." }, { v: (rhs - p) / k, fb: "The " + k + " multiplies the " + p + " too: $" + k + "(x " + signed(p) + ") = " + k + "x " + signed(k * p) + "$." }]);
          why = lines([tex, "x " + signed(p) + " = " + rhs / k, "x = " + x]);
        } else {
          var dv = R.int(2, 6), q = R.nz(-8, 8), xx = dv * R.nz(-5, 6), rr = xx / dv + q;
          x = xx;
          tex = "\\frac{x}{" + dv + "} " + signed(q) + " = " + rr;
          ns = near(x, [{ v: rr - q, fb: "That's $\\frac{x}{" + dv + "}$. Multiply by " + dv + " to get $x$." }]);
          why = lines([tex, "\\frac{x}{" + dv + "} = " + (rr - q), "x = " + x]);
        }
        return { type: "num", prompt: "Solve for $x$. $$" + tex + "$$", pre: "$x =$", answer: x, near: ns, hints: ["Do the same to both sides. Undo the adding or subtracting, then the multiplying or dividing."], why: why + "<br>Check by putting $x = " + x + "$ back in." };
      } },
    { id: "u1-classify", title: "Number of solutions", lesson: 1,
      gen: function (R) {
        var kind = R.int(0, 2), a = R.int(2, 7), b = R.nz(-8, 8), tex, right, why, wrongs;
        if (kind === 0) { var c = a + R.nz(-1, 1) * R.int(1, 3); if (c === a || c === 0) c = a + 2; var d = R.nz(-8, 8); tex = poly([[a, "x"], [b, ""]]) + " = " + poly([[c, "x"], [d, ""]]); right = "One solution"; why = "The $x$ terms don't cancel ($" + a + "x$ against $" + c + "x$), so one number works."; }
        else if (kind === 1) { var d2 = b + R.pick([-3, -2, 2, 3]); tex = poly([[a, "x"], [b, ""]]) + " = " + poly([[a, "x"], [d2, ""]]); right = "No solution"; why = "Take $" + a + "x$ from both sides: $" + b + " = " + d2 + "$. False — no number works."; }
        else { var p = R.nz(-6, 6); tex = a + "(x " + signed(p) + ") = " + poly([[a, "x"], [a * p, ""]]); right = "Every number"; why = "Share the " + a + ": the left side is $" + poly([[a, "x"], [a * p, ""]]) + "$, the same as the right. True for every $x$."; }
        var all = ["One solution", "No solution", "Every number"];
        return mc(R, { prompt: "How many solutions does $" + tex + "$ have?", right: right,
          wrong: all.filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: right === "One solution" ? "The $x$ terms don't cancel, so exactly one number solves it." : right === "No solution" ? "Take the $x$ terms to one side — what's left is false." : "Share the bracket: both sides turn out identical." }; }),
          keep: true, hints: ["Take the $x$ terms to one side. If they cancel, is what's left true or false?"], why: why });
      } },
    { id: "u1-expr-story", title: "Write an expression from a situation", lesson: 2,
      gen: function (R) {
        var f = R.int(5, 60), r = R.pick([2, 3, 4, 5, 8, 12, 15]), v = R.pick(["n", "m", "t", "p"]);
        if (f === r) f += 1;
        var T = R.pick([{ s: "A gym charges \\$" + f + " to join and \\$" + r + " a month. Cost after $" + v + "$ months?" }, { s: "A taxi charges \\$" + f + " to start and \\$" + r + " per mile. Fare for $" + v + "$ miles?" }, { s: "A party hall costs \\$" + f + " to book, plus \\$" + r + " for each guest. Cost for $" + v + "$ guests?" }]);
        var ans = r + v + "+" + f;
        return { type: "expr", prompt: T.s, answer: ans, shown: r + v + " + " + f,
          near: [{ v: (r + f) + v, fb: "The \\$" + f + " is paid once — only the \\$" + r + " is multiplied by $" + v + "$." }, { v: f + v + "+" + r, fb: "The \\$" + r + " is the amount for *each*, so it multiplies $" + v + "$." }],
          keys: [["$" + v + "$", v], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]], placeholder: "Use " + v,
          hints: ["Which amount is paid once, and which is paid every time?"], why: "$" + r + v + "$ for the " + (T.s.indexOf("month") > -1 ? "months" : T.s.indexOf("mile") > -1 ? "miles" : "guests") + " plus $" + f + "$ paid once: $" + r + v + " + " + f + "$." };
      } },
    { id: "u1-constraint", title: "Write a constraint as an inequality", lesson: 2,
      gen: function (R) {
        var n = R.int(4, 40), v = R.pick(["p", "g", "s", "n"]);
        var C = R.pick([{ w: "at least", s: "\\ge" }, { w: "at most", s: "\\le" }, { w: "fewer than", s: "<" }, { w: "more than", s: ">" }, { w: "no more than", s: "\\le" }, { w: "no fewer than", s: "\\ge" }]);
        var right = "$" + v + " " + C.s + " " + n + "$";
        var pool = [["\\ge", "at least / no fewer than"], ["\\le", "at most / no more than"], ["<", "fewer than"], [">", "more than"]];
        return mc(R, { prompt: "You need " + C.w + " " + n + " ($" + v + "$). Which inequality says that?", right: right,
          wrong: pool.filter(function (p) { return p[0] !== C.s; }).map(function (p) { return { t: "$" + v + " " + p[0] + " " + n + "$", fb: "That means “" + p[1] + " " + n + "”. Read the phrase again: “" + C.w + "”." }; }),
          keep: true, hints: ["Is the number itself allowed? “At least”, “at most”, “no more than” include it; “fewer than”, “more than” don't."],
          why: "“" + C.w + " " + n + "” is $" + v + " " + C.s + " " + n + "$." });
      } },
    { id: "u1-eq-story", title: "Write an equation from a situation", lesson: 3,
      gen: function (R) {
        var kind = R.int(0, 2);
        if (kind === 0) {
          var pr = R.pick([2.5, 3.25, 4.5, 6.75]), w = R.int(2, 8), tot = Math.round(pr * w * 100) / 100, v = R.pick(["w", "p", "n"]);
          return { type: "equation", prompt: "Nuts cost \\$" + num(pr) + " a pound. Sam buys $" + v + "$ pounds and pays \\$" + num(tot) + ". Write an equation.", answer: num(pr) + v + "=" + num(tot), shown: num(pr) + v + " = " + num(tot),
            near: [{ v: num(pr) + "+" + v + "=" + num(tot), fb: "The price is *per pound*: multiply by the pounds, don't add." }], keys: KEYS_XY.slice(0, 5).concat([["$" + v + "$", v]]), hints: ["Price per pound × pounds = total paid."], why: "$" + num(pr) + v + " = " + num(tot) + "$." };
        }
        if (kind === 1) {
          var k = R.int(15, 90), tot2 = R.int(150, 400);
          return { type: "equation", prompt: "Noah earned $n$ dollars. Mai earned \\$" + tot2 + ", which is \\$" + k + " more than Noah. Write an equation.", answer: tot2 + "=n+" + k, shown: tot2 + " = n + " + k,
            near: [{ v: "n=" + tot2 + "+" + k, fb: "Mai's amount is Noah's *plus* " + k + " — not the other way around." }], keys: KEYS_XY.slice(0, 5).concat([["$n$", "n"]]), hints: ["Start from Noah's amount and say what you add to get Mai's."], why: "$" + tot2 + " = n + " + k + "$." };
        }
        var part = R.pick([6, 9, 12, 15, 21]), pc = R.pick([20, 25, 30, 40, 60]);
        return { type: "equation", prompt: "A label says one serving has " + part + " g of fibre, which is " + pc + "% of the daily amount $d$ (in grams). Write an equation.", answer: part + "=" + num(pc / 100) + "d", shown: part + " = " + num(pc / 100) + "d",
          near: [{ v: part + "=" + pc + "d", fb: pc + "% is the decimal " + num(pc / 100) + "." }], keys: KEYS_XY.slice(0, 5).concat([["$d$", "d"]]), hints: ["“" + part + " is " + pc + "% of $d$” — “of” means times."], why: "$" + part + " = " + num(pc / 100) + "d$." };
      } },
    { id: "u1-percent", title: "Total with tax and charges", lesson: 3,
      gen: function (R) {
        var P = R.pick([200, 400, 500, 800, 1200, 2500]), r = R.pick([5, 6, 8, 10]), fee = R.pick([20, 35, 50, 75]);
        var tot = P + P * r / 100 + fee;
        return { type: "num", prompt: "A \\$" + P + " item has " + r + "% sales tax and a \\$" + fee + " delivery charge. What is the total?", pre: "$\\$$", answer: tot,
          near: near(tot, [{ v: P * r / 100, fb: "That's only the tax." }, { v: P + P * r / 100, fb: "Add the \\$" + fee + " delivery too." }, { v: P + fee + r / 100, tol: 0.001, fb: r + "% is $" + num(r / 100) + "$ *of the price*, not \\$" + num(r / 100) + "." }]),
          hints: ["Tax: " + r + "% of " + P + " is $" + num(r / 100) + " \\times " + P + "$."], why: "Tax $= " + num(P * r / 100) + "$. Total $= " + P + " + " + num(P * r / 100) + " + " + fee + " = " + num(tot) + "$." };
      } },
    { id: "u1-table-rule", title: "Find the rule from a table", lesson: 4,
      gen: function (R) {
        var m = R.nz(-5, 6), b = R.nz(-8, 9), xs = R.pick([[0, 1, 2, 3], [1, 2, 3, 4], [0, 2, 4, 6], [2, 4, 6, 8]]);
        if (b === m) b += (b > 0 ? 1 : -1);
        var rows = xs.map(function (x) { return [x, m * x + b]; });
        return { type: "equation", prompt: "Write an equation for the rule. " + tbl(["$x$", "$y$"], rows), answer: lineEq(m, b), shown: shownLine(m, b), form: "slope-intercept",
          near: [{ v: lineEq(b, m), fb: "The number that multiplies $x$ is how much $y$ changes for each 1 step of $x$." }],
          keys: KEYS_XY.slice(0, 5), placeholder: "y = …", hints: ["How much does $y$ change when $x$ goes up by 1? What would $y$ be at $x = 0$?"],
          why: "Slope $" + m + "$ ($y$ changes by $" + m + "$ per 1 step of $x$). At $x = 0$, $y = " + b + "$. So $" + poly([[m, "x"], [b, ""]]) + "$." };
      } },
    { id: "u1-inverse", title: "Sharing and rates", lesson: 4,
      gen: function (R) {
        var T = R.pick([120, 240, 300, 600, 900]), w = R.pick([2, 3, 4, 5, 6, 8, 10]);
        if (T % w) w = 5;
        if (R.chance(0.5)) return { type: "num", prompt: "A \\$" + T + " prize is shared equally among $w$ winners. How much does each get if $w = " + w + "$?", pre: "$\\$$", answer: T / w,
          near: [{ v: T * w, fb: "More winners means each gets *less*. Divide." }], hints: ["Total ÷ number of winners."], why: "$" + T + " \\div " + w + " = " + T / w + "$." };
        var each = T / w;
        return { type: "num", prompt: "A \\$" + T + " prize is shared equally. Each winner gets \\$" + each + ". How many winners were there?", answer: w,
          near: [{ v: T * each, fb: "You're looking for how many shares of \\$" + each + " fit into \\$" + T + "." }], hints: ["How many \\$" + each + " shares fit into \\$" + T + "?"], why: "$" + T + " \\div " + each + " = " + w + "$." };
      } },
    { id: "u1-solution-check", title: "Is it a solution?", lesson: 5,
      gen: function (R) {
        var a = R.int(2, 7), b = R.nz(-9, 9), x = R.nz(-6, 8), c = a * x + b, yes = R.chance(0.5), t = yes ? x : x + R.pick([-2, -1, 1, 2]);
        var val = a * t + b;
        return mc(R, { prompt: "Is $x = " + t + "$ a solution of $" + poly([[a, "x"], [b, ""]]) + " = " + c + "$?",
          right: yes ? "Yes — both sides are " + c : "No — the left side is " + val + ", not " + c,
          wrong: [{ t: yes ? "No" : "Yes", fb: "Put $x = " + t + "$ in: $" + a + "(" + t + ") " + signed(b) + " = " + val + "$." }],
          keep: true, hints: ["Replace $x$ with " + t + " and work out the left side."], why: "$" + a + "(" + t + ") " + signed(b) + " = " + val + "$, and the right side is $" + c + "$." });
      } },
    { id: "u1-two-var", title: "Solve for the other variable", lesson: 5,
      gen: function (R) {
        var A = R.int(2, 6), B = R.int(2, 5), x = R.int(1, 6), y = R.int(1, 6), C = A * x + B * y;
        return { type: "num", prompt: "One solution of $" + A + "x + " + B + "y = " + C + "$ has $x = " + x + "$. What is $y$?", pre: "$y =$", answer: y,
          near: [{ v: C - A * x, fb: "That's $" + B + "y$. Divide by " + B + " to get $y$." }], hints: ["Put $x = " + x + "$ in and solve for $y$."], why: "$" + A + "(" + x + ") + " + B + "y = " + C + "$, so $" + B + "y = " + (C - A * x) + "$ and $y = " + y + "$." };
      } },
    { id: "u1-points-on-graph", title: "Is the point on the graph?", lesson: 6,
      gen: function (R) {
        var m = R.nz(-4, 5), b = R.nz(-6, 7), x = R.nz(-4, 5), on = R.chance(0.5), y = m * x + b + (on ? 0 : R.pick([-2, -1, 1, 2]));
        return mc(R, { prompt: "Is the point $(" + x + ", " + y + ")$ on the graph of $" + shownLine(m, b) + "$?", right: on ? "Yes" : "No — at $x = " + x + "$ the graph is at $y = " + (m * x + b) + "$",
          wrong: [{ t: on ? "No — at $x = " + x + "$ the graph is at $y = " + (m * x + b + 1) + "$" : "Yes", fb: "Put $x = " + x + "$ into the equation: $y = " + m + "(" + x + ") " + signed(b) + " = " + (m * x + b) + "$." }],
          keep: true, hints: ["Does the $y$-value equal what the equation gives at that $x$?"], why: "The graph has $y = " + (m * x + b) + "$ at $x = " + x + "$; the point has $y = " + y + "$." });
      } },
    { id: "u1-intercepts", title: "Intercepts from an equation", lesson: 6,
      gen: function (R) {
        var A = R.int(2, 7), B = R.int(2, 7), k = R.int(1, 3), wantX = R.chance(0.5);
        if (A === B) B = B === 7 ? 6 : B + 1;
        var C = A * B * k;
        return { type: "num", prompt: "Where does the graph of $" + A + "x + " + B + "y = " + C + "$ cross the " + (wantX ? "$x$" : "$y$") + "-axis? Enter the " + (wantX ? "$x$" : "$y$") + "-coordinate.", pre: wantX ? "$x =$" : "$y =$", answer: wantX ? C / A : C / B,
          near: [{ v: wantX ? C / B : C / A, fb: "That's the other axis. On the " + (wantX ? "$x$" : "$y$") + "-axis, " + (wantX ? "$y = 0$" : "$x = 0$") + "." }], hints: ["Put " + (wantX ? "$y = 0$" : "$x = 0$") + " into the equation."],
          why: wantX ? "$" + A + "x = " + C + "$, so $x = " + C / A + "$." : "$" + B + "y = " + C + "$, so $y = " + C / B + "$." };
      } },
    { id: "u1-equivalent", title: "Equivalent equations", lesson: 7,
      gen: function (R) {
        var a = R.int(2, 6), b = R.nz(-8, 8), c = R.int(3, 25), k = R.pick([2, 3, 4, 5]);
        var tex = poly([[a, "x"], [b, ""]]) + " = " + c;
        var move = R.int(0, 2), right, why;
        if (move === 0) { right = poly([[k * a, "x"], [k * b, ""]]) + " = " + k * c; why = "Multiply *both* sides by " + k + ": $" + right + "$."; }
        else if (move === 1) { right = poly([[a, "x"]]) + " = " + (c - b); why = (b > 0 ? "Subtract " + b : "Add " + -b) + " on both sides: $" + right + "$."; }
        else { right = poly([[a, "x"], [b + k, ""]]) + " = " + (c + k); why = "Add " + k + " to both sides: $" + right + "$."; }
        return mc(R, { prompt: "Which equation is **equivalent** to $" + tex + "$?", right: "$" + right + "$",
          wrong: [{ t: "$" + poly([[k * a, "x"], [b, ""]]) + " = " + k * c + "$", fb: "Multiplying the left side, you must multiply the *whole* left side: every term." },
                  { t: "$" + poly([[a, "x"], [b, ""]]) + " = " + (c + k) + "$", fb: "That changes only the right side." },
                  { t: "$" + poly([[a, "x"]]) + " = " + (c + b) + "$", fb: "Moving $" + b + "$ across changes its sign: the right side should be $" + (c - b) + "$." }],
          hints: ["An acceptable move does the same thing to *both* sides."], why: why });
      } },
    { id: "u1-moves", title: "Acceptable moves and solutions", lesson: 8,
      gen: function (R) {
        var kind = R.int(0, 2);
        if (kind === 0) {
          var p = R.int(2, 7), q = R.int(2, 7);
          return mc(R, { prompt: "Solving $x^2 = " + p + "x$, a student divides both sides by $x$ and gets $x = " + p + "$. What was lost?", right: "The solution $x = 0$: dividing by $x$ isn't safe if $x$ could be 0",
            wrong: [{ t: "Nothing — $x = " + p + "$ is the only solution", fb: "Try $x = 0$ in the original: $0 = 0$. It works, too." }, { t: "The solution $x = " + q + "$", fb: "Try it: $" + q + "^2 = " + q * q + "$ but $" + p + "(" + q + ") = " + p * q + "$." }],
            hints: ["Test $x = 0$ in the original equation."], why: "$0^2 = " + p + "(0)$ is true, so $x = 0$ is a solution too. Dividing by a variable can lose it." });
        }
        if (kind === 1) {
          var a = R.int(2, 8), b = R.nz(-9, 9), d = b + R.pick([-4, -3, 3, 4]);
          return mc(R, { prompt: "Solving $" + poly([[a, "x"], [b, ""]]) + " = " + poly([[a, "x"], [d, ""]]) + "$ by moves, you reach $" + b + " = " + d + "$. What does that tell you?", right: "The equation has no solution",
            wrong: [{ t: "$x = 0$", fb: "There's no $x$ left to equal anything." }, { t: "Every number is a solution", fb: "That would need a *true* statement like $3 = 3$." }],
            hints: ["Is $" + b + " = " + d + "$ ever true?"], why: "A false statement after acceptable moves means no value of $x$ works." });
        }
        return mc(R, { prompt: "Which of these is **not** always an acceptable move when solving an equation?", right: "Dividing both sides by a variable like $x$",
          wrong: [{ t: "Adding the same number to both sides", fb: "That is always acceptable." }, { t: "Multiplying both sides by 4", fb: "Multiplying by a nonzero number is acceptable." }, { t: "Subtracting $x$ from both sides", fb: "That is always acceptable." }],
          hints: ["Which move could involve dividing by zero?"], why: "If $x$ could be 0 you can't divide by it — and even when it isn't, you can lose a solution." });
      } },
    { id: "u1-solve-for", title: "Solve for a variable", lesson: 9,
      gen: function (R) {
        var F = R.pick([
          { q: "P = 2l + 2w", v: "l", a: "l=P/2-w", why: "Subtract $2w$: $P - 2w = 2l$. Divide by 2: $l = \\frac{P - 2w}{2}$." },
          { q: "y = mx + b", v: "x", a: "x=(y-b)/m", why: "Subtract $b$: $y - b = mx$. Divide by $m$: $x = \\frac{y - b}{m}$." },
          { q: "A = \\frac{1}{2}bh", v: "h", a: "h=2A/b", why: "Multiply by 2: $2A = bh$. Divide by $b$: $h = \\frac{2A}{b}$." },
          { q: "ax + by = c", v: "y", a: "y=(c-ax)/b", why: "Subtract $ax$: $by = c - ax$. Divide by $b$: $y = \\frac{c - ax}{b}$." },
          { q: "d = rt", v: "t", a: "t=d/r", why: "Divide both sides by $r$: $t = \\frac{d}{r}$." },
          { q: "C = 2\\pi r", v: "r", a: "r=C/(2pi)", why: "Divide both sides by $2\\pi$: $r = \\frac{C}{2\\pi}$." },
          { q: "V = \\frac{1}{3}Bh", v: "B", a: "B=3V/h", why: "Multiply by 3: $3V = Bh$. Divide by $h$: $B = \\frac{3V}{h}$." }
        ]);
        return { type: "equation", prompt: "Solve $" + F.q + "$ for $" + F.v + "$.", answer: F.a, shown: F.a.replace(/pi/g, "π"), keys: KEYS_XY, placeholder: F.v + " = …",
          hints: ["Undo the operations on $" + F.v + "$ in reverse order — to the *whole* other side."], why: F.why };
      } },
    { id: "u1-rearrange-use", title: "Rearrange, then use it", lesson: 10,
      gen: function (R) {
        var k = R.int(2, 6), rate = R.pick([25, 40, 45, 60]);
        if (R.chance(0.5)) return { type: "num", prompt: "Distance $d = rt$. A car goes $d = " + rate * k + "$ km at $r = " + rate + "$ km/h. How many hours $t$?", answer: k, near: [{ v: rate * k * rate, fb: "$t = d \\div r$: divide, don't multiply." }], hints: ["Solve $d = rt$ for $t$ first."], why: "$t = \\frac{d}{r} = \\frac{" + rate * k + "}{" + rate + "} = " + k + "$." };
        var w = R.int(3, 9), P = 2 * (w + R.int(3, 12));
        return { type: "num", prompt: "A rectangle has perimeter $P = " + P + "$ and width $w = " + w + "$. Use $P = 2l + 2w$ to find the length $l$.", answer: P / 2 - w, near: [{ v: P - 2 * w, fb: "That's $2l$. Divide by 2." }], hints: ["Solve for $l$: $l = \\frac{P - 2w}{2}$."], why: "$l = \\frac{" + P + " - " + 2 * w + "}{2} = " + (P / 2 - w) + "$." };
      } },
    { id: "u1-slope-int", title: "Slope and intercept in context", lesson: 11,
      gen: function (R) {
        var m = R.pick([8, 12, 15, 25, 40]), b = R.pick([20, 30, 45, 60, 100]), ask = R.int(0, 2);
        var s = "A repair shop's charge is $y = " + m + "x + " + b + "$ dollars for $x$ hours of work.";
        if (ask === 0) return { type: "num", prompt: s + " What is the charge for **no** hours — the fixed fee?", pre: "$\\$$", answer: b, near: [{ v: m, fb: "That's the charge per hour. The fixed fee is the value at $x = 0$." }], hints: ["Put $x = 0$ in."], why: "$y = " + m + "(0) + " + b + " = " + b + "$: the $y$-intercept." };
        if (ask === 1) return { type: "num", prompt: s + " How much does **each extra hour** add?", pre: "$\\$$", answer: m, near: [{ v: b, fb: "That's the fixed fee, paid once." }], hints: ["How much does $y$ change when $x$ goes up by 1?"], why: "The slope, $" + m + "$." };
        var h = R.int(2, 6);
        return { type: "num", prompt: s + " What does a **" + h + "-hour** job cost?", pre: "$\\$$", answer: m * h + b, near: [{ v: (m + b) * h, fb: "The fixed fee is paid once, not every hour." }], hints: ["Put $x = " + h + "$ in."], why: "$y = " + m + "(" + h + ") + " + b + " = " + (m * h + b) + "$." };
      } },
    { id: "u1-standard", title: "Slope of a line in standard form", lesson: 12,
      gen: function (R) {
        var B = R.pick([-4, -2, 2, 4, 5]), A = R.pick([2, 4, 6, 8, 10, -6, -4, 5]), C = R.nz(-12, 12);
        var m = -A / B;
        return { type: "num", prompt: "What is the **slope** of the line $" + poly([[A, "x"], [B, "y"]]) + " = " + C + "$?", answer: m, tol: 0.001,
          near: near(m, [{ v: -m, tol: 0.001, fb: "Check the sign: the slope is $-A \\div B$, and $B$ may be negative." }, { v: A / 1, fb: "That's just $A$. Solve for $y$, or use $-A \\div B$." }]),
          hints: ["Solve for $y$, or use slope $= -\\frac{A}{B}$."], why: "$" + poly([[B, "y"]]) + " = " + poly([[-A, "x"], [C, ""]]) + "$, so the slope is $-\\frac{A}{B}$ with $A = " + A + "$ and $B = " + B + "$: $" + num(m) + "$." };
      } },
    { id: "u1-slope-formula", title: "Slope from two points", lesson: 13,
      gen: function (R) {
        var x1 = R.int(-5, 4), y1 = R.int(-5, 5), dx = R.pick([1, 2, 3, 4]), m = R.nz(-4, 4) * (R.chance(0.4) ? 0.5 : 1);
        if (dx % 2 === 1 && Math.abs(m % 1) > 0) dx += 1;
        var dy = m * dx, x2 = x1 + dx, y2 = y1 + dy;
        return { type: "num", prompt: "Find the slope of the line through $(" + x1 + ", " + y1 + ")$ and $(" + x2 + ", " + num(y2) + ")$.", answer: m, tol: 0.001,
          near: near(m, [{ v: -m, tol: 0.001, fb: "Subtract in the same order on the top and the bottom." }, { v: 1 / m, tol: 0.001, fb: "That's run over rise. Slope is rise over run." }]),
          hints: ["Rise: $y_2 - y_1$. Run: $x_2 - x_1$."], why: "$\\frac{" + num(y2) + " - " + (y1 < 0 ? "(" + y1 + ")" : y1) + "}{" + x2 + " - " + (x1 < 0 ? "(" + x1 + ")" : x1) + "} = \\frac{" + num(dy) + "}{" + dx + "} = " + num(m) + "$." };
      } },
    { id: "u1-write-line", title: "Write the equation of a line", lesson: 13,
      gen: function (R) {
        var m = R.nz(-4, 5), b = R.nz(-8, 9), x1 = R.nz(-4, 5), y1 = m * x1 + b;
        if (R.chance(0.5)) return { type: "equation", prompt: "Write the equation of the line with slope $" + m + "$ through $(" + x1 + ", " + y1 + ")$ in the form $y = mx + b$.", answer: lineEq(m, b), shown: shownLine(m, b), form: "slope-intercept",
          near: [{ v: lineEq(m, y1), fb: "The " + y1 + " is the point's $y$-value, not the intercept. Put the point into $y = " + m + "x + b$." }], keys: KEYS_XY.slice(0, 5), placeholder: "y = …",
          hints: ["$" + y1 + " = " + m + "(" + x1 + ") + b$."], why: "$b = " + y1 + " - (" + m + ")(" + x1 + ") = " + b + "$, so $" + poly([[m, "x"], [b, ""]]) + "$." };
        var x2 = x1 + R.pick([1, 2, 3]), y2 = m * x2 + b;
        return { type: "equation", prompt: "Write the equation of the line through $(" + x1 + ", " + y1 + ")$ and $(" + x2 + ", " + y2 + ")$ in the form $y = mx + b$.", answer: lineEq(m, b), shown: shownLine(m, b), form: "slope-intercept",
          near: [{ v: lineEq(-m, b), fb: "Recheck the slope's sign: subtract in the same order top and bottom." }], keys: KEYS_XY.slice(0, 5), placeholder: "y = …",
          hints: ["Slope first, then use a point to find $b$."], why: "Slope $" + m + "$; $b = " + y1 + " - " + m + "(" + x1 + ") = " + b + "$." };
      } },
    { id: "u1-forms", title: "Convert to standard form", lesson: 13,
      gen: function (R) {
        var m = R.nz(-5, 6), b = R.nz(-9, 9);
        return { type: "equation", prompt: "Write $" + shownLine(m, b) + "$ in standard form, $Ax + By = C$, with whole numbers.", answer: clean(poly([[-m, "x"], [1, "y"]])) + "=" + b, shown: poly([[-m, "x"], [1, "y"]]) + " = " + b,
          keys: KEYS_XY.slice(0, 5), placeholder: "Ax + By = C", hints: ["Move the $x$ term to the left side."], why: (m < 0 ? "Add $" + -m + "x$ to" : "Subtract $" + m + "x$ from") + " both sides: $" + poly([[-m, "x"], [1, "y"]]) + " = " + b + "$." + (m > 0 ? " (Multiply by $-1$ for a positive $x$ term.)" : "") };
      } },
    { id: "u1-from-table", title: "Equation from two data points", lesson: 14,
      gen: function (R) {
        var m = R.pick([8, 12, 15, 20, 25, 30]), b = R.pick([10, 20, 35, 45, 60]), x1 = R.int(1, 3), x2 = x1 + R.int(2, 4);
        if (m === b) b = 55;
        return { type: "equation", prompt: "A plumber's bill is a flat fee plus an hourly rate. A **" + x1 + "-hour** job costs **\\$" + (m * x1 + b) + "**; a **" + x2 + "-hour** job costs **\\$" + (m * x2 + b) + "**. Write $y = mx + b$ for the cost $y$ of $x$ hours.",
          answer: lineEq(m, b), shown: shownLine(m, b), form: "slope-intercept", near: [{ v: lineEq(b, m), fb: "The hourly rate is the slope: extra cost ÷ extra hours." }], keys: KEYS_XY.slice(0, 5), placeholder: "y = …",
          hints: ["Slope: extra cost ÷ extra hours. Then use one job to find the fee."], why: "Slope $\\frac{" + (m * x2 + b) + " - " + (m * x1 + b) + "}{" + x2 + " - " + x1 + "} = " + m + "$. Fee: $" + (m * x1 + b) + " - " + m * x1 + " = " + b + "$." };
      } },
    { id: "u1-parallel", title: "Parallel line through a point", lesson: 15,
      gen: function (R) {
        var m = R.nz(-4, 5), b = R.nz(-6, 7), p = R.nz(-4, 5), q = R.nz(-6, 8), b2 = q - m * p;
        if (b2 === b) { q += 1; b2 = q - m * p; }
        return { type: "equation", prompt: "Write the line **parallel** to $" + shownLine(m, b) + "$ that passes through $(" + p + ", " + q + ")$.", answer: lineEq(m, b2), shown: shownLine(m, b2), form: "slope-intercept",
          near: [{ v: lineEq(-1 / m, b2), fb: "Parallel lines have the *same* slope — not a flipped one." }, { v: lineEq(m, b), fb: "That's the original line. Use the point to find a new intercept." }], keys: KEYS_XY.slice(0, 5), placeholder: "y = …",
          hints: ["Same slope, $" + m + "$. Put the point in to find $b$."], why: "$" + q + " = " + m + "(" + p + ") + b$, so $b = " + b2 + "$." };
      } },
    { id: "u1-perp", title: "Perpendicular line through a point", lesson: 15,
      gen: function (R) {
        var S = R.pick([[2, 1], [3, 1], [-2, 1], [-3, 1], [1, 2], [-1, 2], [1, 3], [-1, 3], [3, 4], [-3, 4], [2, 3], [-2, 3], [4, 1], [-4, 1]]);
        var a = S[0], d = S[1];                       // the given slope, a/d
        var pn = -d, pd = a;                          // the perpendicular slope, -d/a
        if (pd < 0) { pn = -pn; pd = -pd; }
        var b = R.nz(-6, 7), pxv = pd * R.nz(-3, 3), q = R.nz(-6, 6);
        var b2 = q - (pn / pd) * pxv;
        var given = d === 1 ? shownLine(a, b) : "y = " + L.frac(a, d) + "x " + signed(b);
        var mpTex = L.frac(pn, pd), mpTyped = pd === 1 ? String(pn) : "(" + pn + "/" + pd + ")";
        return { type: "equation", prompt: "Write the line **perpendicular** to $" + given + "$ through $(" + pxv + ", " + q + ")$.", answer: "y=" + mpTyped + "*x+" + b2 + "", shown: "y = " + (pd === 1 ? pn : pn + "/" + pd) + "x" + (b2 === 0 ? "" : b2 < 0 ? " - " + -b2 : " + " + b2), form: "slope-intercept",
          near: [{ v: "y=" + (d === 1 ? a : "(" + a + "/" + d + ")") + "*x+" + (q - (a / d) * pxv), fb: "That's the *parallel* line. For perpendicular, flip the slope and change its sign." }], keys: KEYS_XY, placeholder: "y = …",
          hints: ["Perpendicular slope: flip the fraction and change the sign. Then use the point to find $b$."],
          why: "The perpendicular slope is $" + mpTex + "$. Then $b = " + q + " - (" + mpTex + ")(" + pxv + ") = " + b2 + "$." };
      } },
    { id: "u1-hv", title: "Horizontal and vertical lines", lesson: 15,
      gen: function (R) {
        var p = R.nz(-8, 9), q = R.nz(-8, 9), vertical = R.chance(0.5);
        return { type: "equation", prompt: "Write the equation of the **" + (vertical ? "vertical" : "horizontal") + "** line through $(" + p + ", " + q + ")$.", answer: vertical ? "x=" + p : "y=" + q, shown: vertical ? "x = " + p : "y = " + q,
          near: [{ v: vertical ? "y=" + q : "x=" + p, fb: "That's the " + (vertical ? "horizontal" : "vertical") + " one." }], keys: KEYS_XY.slice(0, 4), placeholder: vertical ? "x = …" : "y = …",
          hints: [vertical ? "Every point on a vertical line has the same $x$." : "Every point on a horizontal line has the same $y$."], why: vertical ? "Every point has $x = " + p + "$." : "Every point has $y = " + q + "$." };
      } },
    { id: "u1-direct", title: "Direct variation", lesson: 16,
      gen: function (R) {
        var k = R.int(2, 9), x0 = R.int(2, 8), x1 = x0 + R.int(1, 8);
        return { type: "num", prompt: "$y$ varies directly with $x$, and $y = " + k * x0 + "$ when $x = " + x0 + "$. What is $y$ when $x = " + x1 + "$?", answer: k * x1,
          near: [{ v: k * x0 + (x1 - x0), fb: "Direct variation *multiplies*: $y = kx$. Find $k$ first." }], hints: ["$k = y \\div x = " + k * x0 + " \\div " + x0 + "$."], why: "$k = " + k + "$, so $y = " + k + " \\times " + x1 + " = " + k * x1 + "$." };
      } },
    { id: "u1-read-graph", title: "Read a graph", lesson: 17,
      gen: function (R) {
        var m = R.nz(-3, 4), b = R.nz(-4, 5), ask = R.chance(0.5);
        if (m === b) b = b > 0 ? b + 1 : b - 1;
        var g = fig({ x: [-4, 6], y: [-8, 10], u: 18, w: 260, alt: "A line through (0, " + b + ") with slope " + m + ".", items: [{ line: [[0, b], [1, b + m]], c: "blue" }, { pt: [0, b], c: "orange" }, { pt: [1, b + m], c: "orange" }] });
        return { type: "num", prompt: "What is the " + (ask ? "**slope**" : "**$y$-intercept**") + " of this line?" + g, answer: ask ? m : b,
          near: [{ v: ask ? b : m, fb: ask ? "That's where the line crosses the vertical axis. The slope is rise over run." : "That's the slope. The intercept is where the line meets the vertical axis." }],
          hints: [ask ? "From one dot to the next: how far up or down, for 1 across?" : "Find the dot on the vertical axis."], why: ask ? "Slope $" + m + "$ (rise $" + m + "$ per 1 across)." : "It crosses the vertical axis at $(0, " + b + ")$." };
      } }
  ];

  L.unit("alg", 1, {
    title: "Linear equations",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 5, blurb: "Solving, expressions and constraints, writing equations from situations, and what a solution is.",
        skills: ["u1-solve", "u1-classify", "u1-expr-story", "u1-constraint", "u1-eq-story", "u1-percent"], per: 2 },
      { title: "Quiz 2", after: 9, blurb: "Rules from tables, solutions and their graphs, intercepts, equivalent equations and the moves that keep them.",
        skills: ["u1-table-rule", "u1-inverse", "u1-solution-check", "u1-two-var", "u1-points-on-graph", "u1-intercepts", "u1-equivalent", "u1-moves"], per: 2 },
      { title: "Quiz 3", after: 13, blurb: "Solving for a variable, slope and intercept in every form, and writing a line's equation.",
        skills: ["u1-solve-for", "u1-rearrange-use", "u1-slope-int", "u1-standard", "u1-slope-formula", "u1-write-line", "u1-forms"], per: 2 },
      { title: "Quiz 4", after: 16, blurb: "Lines from tables, parallel and perpendicular lines, horizontal and vertical lines, and direct variation.",
        skills: ["u1-from-table", "u1-parallel", "u1-perp", "u1-hv", "u1-direct"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders
     Each lesson's big idea, built from pieces (lab/algkit.js). */
  L.addConcepts("alg:1", {
    2: { name: "Variables, expressions, constraints", frame: "A letter for a number that can change is a [[variable]]. An [[expression]] like $10p + 5$ works out a value for any $p$. A [[constraint]] limits what is possible.",
         chips: ["constant", "equation"] },
    3: { name: "Equation", frame: "An [[equation]] says two expressions are worth the [[same]]. To write one from a story, say the relationship in [[words]] first.",
         chips: ["inequality", "different"] },
    4: { name: "Rules in tables", frame: "A table can hide a [[rule]]: the same move turns every input into its [[output]], and an [[equation]] says it in one line.",
         chips: ["slope", "input"] },
    5: { name: "Solution", frame: "A [[solution]] is a value that makes an equation [[true]]. Test a value by [[substituting]] it.",
         chips: ["false", "guessing"] },
    6: { name: "Graph of an equation", frame: "The graph of an equation shows [[all]] its solutions. A point is on the graph exactly when its coordinates make the equation [[true]].",
         chips: ["some", "false"] },
    7: { name: "Equivalent equations", frame: "[[Equivalent]] equations have exactly the same [[solutions]]. Doing the same thing to [[both sides]] keeps an equation equivalent.",
         chips: ["one side", "Different"] },
    8: { name: "Moves that lose solutions", frame: "Dividing both sides by [[$x$]] can lose the solution $x = 0$. If solving leaves something [[false]], like $3 = 5$, there is no solution; if it leaves something always [[true]], every number works.",
         chips: ["$2$", "maybe"] },
    9: { name: "Solving for a variable", frame: "When you keep asking about one quantity, solve the equation [[for]] it: get that variable [[alone]] on one side.",
         chips: ["with", "together"] },
    10: { name: "Rearranging formulas", frame: "Rearranging a formula is [[solving]] with letters: undo the operations in [[reverse]] order.",
          chips: ["guessing", "the same"] },
    11: { name: "Slope and intercept", frame: "In $y = mx + b$, $m$ is the [[slope]], the rate of change, and $b$ is the [[$y$-intercept]], the starting amount.",
          chips: ["$x$-intercept", "area"] },
    12: { name: "Slope and intercept from any form", at: 4, frame: "To read slope and intercept from any form, solve for [[$y$]] first. Then the coefficient of $x$ is the [[slope]] and the constant is the [[$y$-intercept]].",
          chips: ["$x$", "area"] },
    13: { name: "Writing a line", frame: "A line comes from a slope and a point: $y - y_1 = m(x - x_1)$ is [[point-slope]] form. Given two points, find the [[slope]] first.",
          chips: ["standard", "intercept"] },
    14: { name: "One line, four views", at: 3, frame: "A line's table, graph, equation and story all describe the [[same]] relationship. In a table, the change in $y$ for each 1 in $x$ is the [[slope]].",
          chips: ["different", "intercept"] },
    15: { name: "Parallel and perpendicular", keep: true, frame: "[[Parallel]] lines have equal slopes. [[Perpendicular]] lines have slopes that multiply to [[$-1$]].",
          chips: ["$1$", "Equal"] },
    16: { name: "Direct variation", at: 3, frame: "In [[direct variation]], $y = kx$: $y \\div x$ is always the same number, the [[constant of variation]], and the graph passes through the [[origin]].",
          chips: ["slope-intercept", "$y$-intercept"] }
  });
})();
