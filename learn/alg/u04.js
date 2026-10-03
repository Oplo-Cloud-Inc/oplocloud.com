/* ==========================================================================
   Algebra I — Unit 4: Functions. See lab/core.js for the format.

   Follows OpenStax Algebra 1, Unit 4, lesson for lesson — the readiness check, 4.1 to 4.18 and
   Project 4. Written to the recipe in docs/OEDU_BRILLIANT_CONCEPT.md and the
   five rules at the top of alg/u02.js: teach, learn by doing, super
   interactive, nothing clumsy, never too much.

   Three movements: what a function is and how its notation reads (4.1–4.5);
   what its graph shows — features, rate of change, shifts and stretches,
   domain and range (4.6–4.13); and sequences as functions of position
   (4.14–4.18).

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   questions, figures, feedback and every step here are OEdu's own.

   Twenty lessons, sixteen skills, four quizzes, and the unit test.
   Standards: CCSS HSF.IF.A.1–3, HSF.IF.B.4–6, HSF.IF.C.7, HSF.BF.A.1–2, HSF.BF.B.3.
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
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Unit 4 Readiness · Find a slope, read a story from a graph, and continue a pattern.",
    mins: 6, v: 2,
    steps: [
      { type: "num", kicker: "Check 1 · Slope", prompt: "What is the slope of this line?",
        scene: { type: "plane", x: [-1, 6], y: [-1, 10], fns: [{ f: "3*x - 1", color: "blue" }], marks: [{ x: 1, y: 2, color: "orange", label: "(1, 2)" }, { x: 3, y: 8, color: "orange", label: "(3, 8)" }] },
        answer: 3, skill: "Slope", near: [{ v: 6, fb: "That's the rise. Divide by the run, 2." }, { v: 0.333, tol: 0.01, fb: "That's run over rise. Slope is rise over run." }],
        hints: ["From $(1, 2)$ to $(3, 8)$: rise 6, run 2."], why: "$\\frac{8 - 2}{3 - 1} = 3$." },
      { type: "num", prompt: "And the slope of the line through $(-2, 5)$ and $(2, -3)$?", answer: -2, skill: "Slope",
        near: [{ v: 2, fb: "The line falls from 5 to $-3$: the slope is negative." }, { v: -0.5, fb: "Rise over run: $\\frac{-8}{4}$." }], hints: ["Rise: $-3 - 5$. Run: $2 - (-2)$."], why: "$\\frac{-8}{4} = -2$." },
      { type: "choice", kicker: "Check 2 · Graphs", prompt: "The graph shows a bike ride: distance from home over time. What happens in the middle section?",
        scene: { type: "plane", x: [0, 10], y: [0, 8], axisLabels: ["min", "km"], fns: [{ f: pw([[0, 0], [3, 5], [6, 5], [9, 0]]), color: "blue" }] },
        options: [{ t: "The rider stops for 3 minutes, 5 km from home." }, { t: "The rider rides at 5 km per minute.", fb: "A flat line means the distance isn't changing." }, { t: "The rider climbs a hill.", fb: "The graph shows distance from home, not height." }],
        answer: 0, skill: "Read a graph", hints: ["A flat line: is the distance changing?"], why: "From 3 to 6 minutes the distance stays at 5 km: a stop." },
      { type: "choice", prompt: "And the last section, from 6 to 9 minutes?",
        scene: { type: "plane", x: [0, 10], y: [0, 8], axisLabels: ["min", "km"], fns: [{ f: pw([[0, 0], [3, 5], [6, 5], [9, 0]]), color: "blue" }] },
        options: [{ t: "The rider goes back home." }, { t: "The rider keeps going away from home.", fb: "The distance from home is falling, to 0." }, { t: "The rider slows down.", fb: "The line is as steep as the first section: same speed, opposite direction." }],
        answer: 0, skill: "Read a graph", hints: ["What happens to the distance from home?"], why: "The distance falls back to 0: home again." },
      { type: "num", kicker: "Check 3 · Patterns", prompt: "What comes next? $$4, \; 9, \; 14, \; 19, \; \\ldots$$", answer: 24, skill: "Patterns",
        hints: ["What is added each time?"], why: "Add 5 each time: $19 + 5 = 24$." },
      { type: "num", prompt: "And here? $$3, \; 6, \; 12, \; 24, \; \\ldots$$", answer: 48, skill: "Patterns",
        near: [{ v: 36, fb: "The gaps are 3, 6, 12: they double too. Each term is *twice* the last." }, { v: 27, fb: "It isn't adding 3. Each term doubles." }], hints: ["Compare each number with the one before."], why: "Each term doubles: $24 \\times 2 = 48$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 4.1**. If **check 1** slipped, Unit 1's lesson 1.12 covers the slope formula. **Check 2** returns in 4.6 and 4.9, and **check 3** in 4.14, so this unit will rebuild them as it goes.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  var WALK = pw([[0, 0], [2, 4], [3, 4], [6, 6], [9, 0]]);
  var DRONE = pw([[0, 0], [2, 6], [5, 6], [8, 0]]);
  var TEMP = pw([[0, 4], [2, 8], [4, 12], [6, 14], [8, 12], [10, 8], [12, 4]]);
  var HIKE = pw([[0, 1], [2, 5], [4, 5], [6, 8], [10, 0]]);

  /* ============================================ 4.1 · Describing and graphing situations */
  LESSONS.push({
    title: "Describing and graphing situations",
    blurb: "Book 4.1 · A function gives exactly one output for each input.",
    mins: 8, v: 2,
    steps: [
      { type: "sort", kicker: "Try it", prompt: "For each rule, does every input have **exactly one** output?",
        bins: ["Exactly one output", "Could be more than one"],
        cards: [{ t: "a person → their birthday", bin: 0, fb: "Everyone has one birthday." },
                { t: "a birthday → a person born that day", bin: 1, fb: "Many people share a birthday." },
                { t: "a time of day → the temperature outside", bin: 0, fb: "At one moment there is one temperature." },
                { t: "a temperature → the time it happened", bin: 1, fb: "It can be 15° at many different times." },
                { t: "a number → its double", bin: 0, fb: "Doubling a number gives one answer." }],
        skill: "Is it a function?", hints: ["Pick an input. Could there be two different answers?"],
        why: "Left column: the input settles the output. Right column: one input, several possible outputs." },
      { type: "learn", kicker: "Name it",
        prompt: "A **function** is a rule that assigns **exactly one output** to each input.<br><br>The input is the **independent variable**. The output is the **dependent variable**, because it depends on the input." },
      { type: "choice", prompt: "Is $y$ a function of $x$ in this table?" + tbl(["$x$", "$y$"], [[1, 5], [2, 7], [2, 9], [3, 11]]),
        options: [{ t: "No. The input 2 has two different outputs." },
                  { t: "Yes. Every $y$ is different.", fb: "The test is about the inputs: $x = 2$ gives both 7 and 9." },
                  { t: "Yes. $y$ goes up by 2.", fb: "A pattern in $y$ doesn't matter here. Look for a repeated input with different outputs." }],
        answer: 0, skill: "Is it a function?", hints: ["Is any $x$ listed twice with different $y$ values?"],
        why: "$x = 2$ gives 7 and also 9. One input, two outputs: not a function." },
      { type: "choice", prompt: "And this one?" + tbl(["$x$", "$y$"], [[1, 5], [2, 5], [3, 5], [4, 5]]),
        options: [{ t: "Yes. Each input has one output, even though the outputs repeat." },
                  { t: "No. The output 5 is used four times.", fb: "Outputs may repeat. What matters is that no *input* has two outputs." },
                  { t: "No. $y$ doesn't change.", fb: "A constant function is still a function." }],
        answer: 0, skill: "Is it a function?", hints: ["Does any single input lead to two different outputs?"],
        why: "Different inputs may share an output. Each input still has exactly one." },
      { type: "learn", kicker: "See it", prompt: "This machine is a function. Feed it the **same input twice** and see what it does.",
        scene: { type: "machine", rule: "2x + 1", hidden: true, inputs: [3, 5, 3, 0, 5], gate: true },
        gate: true,
        then: "The same input always gives the same output. That is what makes a function predictable, and useful." },
      { type: "choice", kicker: "Vary it", prompt: "The cost of filling a tank depends on the litres pumped. Which is the **independent** variable?",
        options: [{ t: "Litres pumped" }, { t: "Cost", fb: "The cost is the result: it *depends* on the litres." }, { t: "Neither", fb: "One is chosen (the input) and the other follows (the output)." }],
        answer: 0, skill: "Inputs and outputs", hints: ["Which one do you choose, and which one follows from it?"],
        why: "You choose the litres (input). The cost follows (output). On a graph, the independent variable goes on the horizontal axis." },
      { type: "plane", kicker: "Use it", prompt: "The graph shows Maya's **distance from home** (blocks) as a function of **time** (minutes). Click the point where she is farthest from home.",
        x: [0, 10], y: [0, 8], axisLabels: ["min", "blocks"], click: "point", answer: { point: [6, 6] }, skill: "Read a graph",
        fns: [{ f: WALK, color: "blue" }],
        clickFb: function (c) { var v = WALK(c[0]); return c[1] === v ? "At " + nm(c[0]) + " minutes she is " + nm(v) + " blocks away. She gets farther than that." : "That point isn't on the graph."; },
        hints: ["Farthest means the highest point of the graph."], why: "The highest point is $(6, 6)$: after 6 minutes she is 6 blocks from home." }
    ]
  });

  /* ============================================ 4.2 · Function notation */
  LESSONS.push({
    title: "Function notation",
    blurb: "Book 4.2 · f(3) = 7 says: put in 3, get out 7.",
    mins: 8, v: 2,
    steps: [
      { type: "learn", kicker: "Try it", prompt: "This function has a name: $f$. Put some inputs through it.",
        scene: { type: "machine", rule: "3x - 2", name: "f", inputs: [1, 2, 5], gate: true },
        gate: true,
        then: "Input 5 gives output 13. In **function notation** that is written $f(5) = 13$ and read “$f$ of 5 equals 13”. The number in the brackets is the input. The whole thing, $f(5)$, is the output." },
      { type: "num", prompt: "For $f(x) = 3x - 2$, what is $f(4)$?", pre: "$f(4) =$", answer: 10, skill: "Evaluate a function",
        near: [{ v: 12, fb: "That's $3 \\times 4$. Now subtract 2." }, { v: 2, fb: "$f(4)$ means *put 4 in for* $x$. Work out $3(4) - 2$." }],
        hints: ["Replace $x$ with 4."], why: "$f(4) = 3(4) - 2 = 10$." },
      { type: "choice", prompt: "What does $f(2) = 4$ mean?",
        options: [{ t: "When the input is 2, the output is 4." },
                  { t: "$f$ times 2 equals 4.", fb: "The brackets don't mean multiply here. $f(2)$ is “$f$ of 2”: the output for input 2." },
                  { t: "When the input is 4, the output is 2.", fb: "The input is the number inside the brackets." }],
        answer: 0, skill: "Read function notation", hints: ["Inside the brackets: input. The other side: output."],
        why: "$f(\\text{input}) = \\text{output}$." },
      { type: "num", kicker: "See it", prompt: "$h(t)$ is a drone's height in metres after $t$ seconds. Use the graph: what is $h(7)$?",
        scene: graph([0, 9], [0, 8], [{ f: DRONE, color: "blue" }], { axisLabels: ["t", "h"] }),
        pre: "$h(7) =$", answer: 2, skill: "Evaluate from a graph",
        near: [{ v: 6, fb: "That's the height between 2 and 5 seconds. Go to $t = 7$ on the horizontal axis." }],
        hints: ["Find 7 on the $t$-axis, go up to the graph, then read the height."], why: "At $t = 7$ the graph is at height 2: $h(7) = 2$." },
      { type: "numbers", prompt: "Now the other way round. For which values of $t$ is $h(t) = 3$? Give both.",
        scene: graph([0, 9], [0, 8], [{ f: DRONE, color: "blue" }], { axisLabels: ["t", "h"], hline: [3] }),
        answer: [1, 6.5], skill: "Evaluate from a graph", placeholder: "e.g. 2, 5",
        hints: ["Where does the graph cross the red line at height 3?"], why: "The drone is at 3 m on the way up ($t = 1$) and on the way down ($t = 6.5$). An output can come from more than one input." },
      { type: "slots", kicker: "Vary it", prompt: "$d(t)$ is a dog's distance from its kennel, in metres, $t$ seconds after a ball is thrown. Match each statement to its meaning.",
        slots: [{ id: "a", label: "At the start, the dog is 2 m from the kennel." }, { id: "b", label: "After 10 s, the dog is back at the kennel." }, { id: "c", label: "The dog is equally far away at 4 s and at 6 s." }],
        cards: [{ t: "$d(0) = 2$", slot: "a", fb: "Input 0 is the start. Output 2 is the distance." }, { t: "$d(10) = 0$", slot: "b", fb: "Input 10 s, output 0 m." },
                { t: "$d(4) = d(6)$", slot: "c", fb: "Two inputs with the same output." }, { t: "$d(2) = 0$" }],
        skill: "Read function notation", hints: ["Inside the brackets is the time. The value is the distance."],
        why: "Read each as: at time (input), the distance is (output)." },
      { type: "choice", kicker: "Use it", prompt: "$P(y)$ is a town's population in year $y$. Which statement says “in 2020 the town had 8,500 people”?",
        options: [{ t: "$P(2020) = 8500$" }, { t: "$P(8500) = 2020$", fb: "The year is the input, so it goes inside the brackets." }, { t: "$2020P = 8500$", fb: "$P$ is a function's name, not a number to multiply." }],
        answer: 0, skill: "Read function notation", hints: ["Which is the input: the year or the population?"], why: "Input: the year 2020. Output: 8,500 people." }
    ]
  });

  /* ============================================ 4.3 · Interpreting function notation */
  LESSONS.push({
    title: "Interpreting using function notation",
    blurb: "Book 4.3 · Compare outputs, and turn sentences into statements about f.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "$T(h)$ is the temperature in °C, $h$ hours after 6 a.m. Which is greater?",
        scene: graph([0, 13], [0, 16], [{ f: TEMP, color: "orange" }], { axisLabels: ["h", "T"] }),
        options: [{ t: "$T(8)$" }, { t: "$T(2)$", fb: "$T(2) = 8$ and $T(8) = 12$." }, { t: "They are equal.", fb: "Read both heights: 8 and 12." }],
        answer: 0, keep: true, skill: "Compare function values", hints: ["Find each input on the horizontal axis and compare the heights."],
        why: "$T(2) = 8$ and $T(8) = 12$, so $T(8) > T(2)$: it is warmer 8 hours in." },
      { type: "sort", prompt: "Use the same graph. True or false?",
        scene: graph([0, 13], [0, 16], [{ f: TEMP, color: "orange" }], { axisLabels: ["h", "T"] }),
        bins: ["True", "False"],
        cards: [{ t: "$T(0) = 4$", bin: 0, fb: "The graph starts at height 4." },
                { t: "$T(4) = T(8)$", bin: 0, fb: "Both are 12." },
                { t: "$T(6) < T(10)$", bin: 1, fb: "$T(6) = 14$ and $T(10) = 8$." },
                { t: "$T(12) > T(0)$", bin: 1, fb: "Both are 4: they are equal." }],
        skill: "Compare function values", hints: ["Read each output from the graph, then compare."],
        why: "$T(0) = 4$, $T(4) = T(8) = 12$, $T(6) = 14$, $T(10) = 8$, $T(12) = 4$." },
      { type: "choice", kicker: "Name it", prompt: "Write this in function notation: “Five hours after 6 a.m., it was 13 degrees.”",
        options: [{ t: "$T(5) = 13$" }, { t: "$T(13) = 5$", fb: "The hours are the input and go in the brackets." }, { t: "$T = 5 + 13$", fb: "Nothing is being added. The statement links an input to its output." }],
        answer: 0, skill: "Write function notation", hints: ["$T(\\text{hours}) = \\text{degrees}$."],
        why: "A sentence about a function names an input and its output: $T(5) = 13$." },
      { type: "numbers", prompt: "Solve $T(h) = 8$ from the graph. Give every solution.",
        scene: graph([0, 13], [0, 16], [{ f: TEMP, color: "orange" }], { axisLabels: ["h", "T"], hline: [8] }),
        answer: [2, 10], skill: "Compare function values", placeholder: "e.g. 3, 7",
        hints: ["Where is the graph at height 8?"], why: "It is 8° at $h = 2$ (warming up) and again at $h = 10$ (cooling down)." },
      { type: "choice", kicker: "Vary it", prompt: "$A(t)$ and $B(t)$ are the charge, in percent, of two phones after $t$ hours. What does $B(3) > A(3)$ mean?",
        options: [{ t: "After 3 hours, phone B has more charge than phone A." },
                  { t: "Phone B lasts 3 hours longer.", fb: "The 3 is the input for both: the same moment, 3 hours in." },
                  { t: "Phone B always has more charge.", fb: "The statement is only about $t = 3$." }],
        answer: 0, skill: "Compare function values", hints: ["Both functions have the same input, 3."],
        why: "Same input, two outputs compared: at 3 hours, B's charge is higher." },
      { type: "explain", kicker: "Use it",
        prompt: "$S(d)$ is the number of steps you have walked by the end of day $d$ of this week. Write one statement in function notation, and say in words what it means.",
        placeholder: "e.g. S(3) = 21000 means…",
        model: "A good answer has an input (a day) and an output (steps) in the right places, and a sentence: “S(3) = 21000 means that by the end of day 3 I had walked 21,000 steps.” A comparison works too: “S(5) > S(4)”." }
    ]
  });

  /* ============================================ 4.4 · Rules, part 1 */
  LESSONS.push({
    title: "Using function notation to describe rules, part 1",
    blurb: "Book 4.4 · A rule tells you what to do with the input. A table can give the rule away.",
    mins: 8, v: 2,
    steps: [
      { type: "table", kicker: "Try it", prompt: "The rule is $f(x) = 2x + 3$. Fill in the outputs.",
        head: ["$x$", "$f(x)$"], rows: [[0, null], [1, null], [5, null], [10, 23]], answers: [[0, 1, 3], [1, 1, 5], [2, 1, 13]], skill: "Evaluate a function",
        hints: ["Double the input, then add 3."], why: "$f(0) = 3$, $f(1) = 5$, $f(5) = 13$." },
      { type: "num", prompt: "Rules don't have to be linear. For $g(x) = x^2 + 1$, what is $g(4)$?", pre: "$g(4) =$", answer: 17, skill: "Evaluate a function",
        near: [{ v: 9, fb: "$4^2$ is $4 \\times 4 = 16$, not $4 \\times 2$." }, { v: 25, fb: "Square first, then add 1: $16 + 1$." }],
        hints: ["Square 4, then add 1."], why: "$g(4) = 16 + 1 = 17$." },
      { type: "num", prompt: "Careful with negatives. For $f(x) = 5 - 2x$, what is $f(-3)$?", pre: "$f(-3) =$", answer: 11, skill: "Evaluate a function",
        near: [{ v: -1, fb: "$-2 \\times -3 = +6$. Subtracting a negative adds." }],
        hints: ["$5 - 2(-3)$. What is $-2 \\times -3$?"], why: "$f(-3) = 5 - 2(-3) = 5 + 6 = 11$." },
      { type: "learn", kicker: "See it", prompt: "This machine hides its rule. Feed it inputs and work out what it does.",
        scene: { type: "machine", rule: "4x - 1", hidden: true, name: "k", inputs: [0, 1, 2, 3, 10], gate: true }, gate: true,
        then: "Going from input 0 to 1 to 2, the output climbs by 4 each time. And input 0 gives $-1$." },
      { type: "expr", prompt: "Write the machine's rule: $k(x) = \\;?$", answer: "4x-1", shown: "4x - 1", skill: "Write a rule",
        near: [{ v: "4x", fb: "Check input 0: the machine gave $-1$, not 0." }, { v: "x+4", fb: "The output grows by 4 for each 1 added to the input, so 4 *multiplies* $x$." }],
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"], ["$x^2$", "^2"]], placeholder: "Use x",
        hints: ["The jump per step is the number multiplying $x$.", "The output at input 0 is what's added."], why: "$k(x) = 4x - 1$: $k(0) = -1$, $k(1) = 3$, $k(2) = 7$." },
      { type: "expr", kicker: "Vary it", prompt: "Write a rule for $g$." + tbl(["$x$", "$g(x)$"], [[0, 5], [1, 8], [2, 11], [3, 14]]),
        answer: "3x+5", shown: "3x + 5", skill: "Write a rule",
        near: [{ v: "5x+3", fb: "The output starts at 5 (when $x = 0$) and rises by 3 each step." }],
        keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"]], placeholder: "Use x",
        hints: ["What is $g(0)$? How much does $g$ go up each step?"], why: "Start 5, rise 3 per step: $g(x) = 3x + 5$." },
      { type: "expr", kicker: "Use it", prompt: "A print shop charges **\\$4** per order plus **\\$0.25** a page. Write a rule for the cost $C(p)$ of an order of $p$ pages.",
        answer: "0.25p+4", shown: "0.25p + 4", skill: "Write a rule",
        near: [{ v: "4p+0.25", fb: "The \\$0.25 is per page, so it multiplies $p$." }, { v: "4.25p", fb: "The \\$4 is charged once, not for every page." }],
        keys: [["$p$", "p"], ["$+$", "+"], ["$.$", "."]], placeholder: "Use p",
        hints: ["Which amount is per page? Which is paid once?"], why: "$C(p) = 0.25p + 4$. For 20 pages, $C(20) = 5 + 4 = 9$ dollars." }
    ]
  });

  /* ============================================ 4.5 · Rules, part 2 */
  LESSONS.push({
    title: "Using function notation to describe rules, part 2",
    blurb: "Book 4.5 · Evaluating finds the output. Solving finds the input. And a test for which graphs are functions.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "For $f(x) = 2x + 3$, find the input that gives an output of 11: solve $f(x) = 11$.", pre: "$x =$", answer: 4, skill: "Solve f(x) = c",
        near: [{ v: 25, fb: "That's $f(11)$: you put 11 *in*. Here 11 is what comes *out*." }, { v: 7, fb: "Subtract 3 before halving: $2x = 8$." }],
        hints: ["$2x + 3 = 11$."], why: "$2x + 3 = 11$, so $2x = 8$ and $x = 4$. Check: $f(4) = 11$ ✓." },
      { type: "learn", kicker: "See it", prompt: "The same question on a graph. Slide $x$ until $f(x)$ reaches the red line at 11.",
        scene: { type: "plane", x: [-1, 8], y: [0, 16], gate: true, hline: [11],
          params: { x: { v: 0, min: 0, max: 6, step: 0.5, label: "input $x$" } },
          fns: [{ f: "2*x + 3", color: "blue" }],
          marks: [{ x: function (P) { return P.x; }, y: function (P) { return 2 * P.x + 3; }, color: "orange", r: 7 }],
          readout: function (st) { var x = st.params.x; return "$f(" + nm(x) + ") = " + nm(2 * x + 3) + "$" + (x === 4 ? " ✓" : ""); },
          goal: function (st) { return st.params.x === 4; } },
        gate: true,
        then: "**Evaluating** $f(4)$ starts from an input and reads up to the graph. **Solving** $f(x) = 11$ starts from an output and reads across to it. Same graph, opposite directions." },
      { type: "sort", kicker: "Name it", prompt: "Is the task to find an **output** or an **input**?",
        bins: ["Find the output (evaluate)", "Find the input (solve)"],
        cards: [{ t: "Find $f(7)$", bin: 0, fb: "7 is given as the input." }, { t: "Solve $f(x) = 7$", bin: 1, fb: "7 is the output. The input is unknown." },
                { t: "Find $g(0)$", bin: 0, fb: "0 is the input." }, { t: "Find $t$ when $g(t) = 0$", bin: 1, fb: "The output is 0. Which input gives it?" }],
        skill: "Solve f(x) = c", hints: ["Is the given number inside the brackets, or on the other side of the equals sign?"],
        why: "A number inside the brackets is an input. A number the function is set equal to is an output." },
      { type: "learn", kicker: "See it", prompt: "Is every graph a function? Slide the red vertical line across this one and count where it meets the graph.",
        scene: { type: "plane", x: [-1, 10], y: [-4, 4], gate: true,
          params: { c: { v: 0, min: 0, max: 9, step: 1, label: "line at $x =$" } },
          fns: [{ f: function (x) { return x >= 0 ? Math.sqrt(x) : NaN; }, color: "blue" }, { f: function (x) { return x >= 0 ? -Math.sqrt(x) : NaN; }, color: "blue" }],
          segs: function (st) { var c = st.params.c; return [[c, -4, c, 4, "red"]]; },
          marks: function (st) { var c = st.params.c, r = Math.sqrt(c); return c === 0 ? [{ x: 0, y: 0, color: "orange" }] : [{ x: c, y: r, color: "orange" }, { x: c, y: -r, color: "orange" }]; },
          readout: function (st) { var c = st.params.c; return c === 0 ? "At $x = 0$: one point." : "At $x = " + c + "$: **two** points, $y = " + nm(r2(Math.sqrt(c))) + "$ and $y = " + nm(-r2(Math.sqrt(c))) + "$."; } },
        gate: true,
        then: "One input, two outputs: this graph is **not** a function. That is the **vertical line test**: if any vertical line meets a graph more than once, the graph is not a function." },
      { type: "choice", prompt: "Does this graph pass the vertical line test?",
        scene: graph([-5, 5], [-3, 7], [{ f: "0.5*x^2 - 1", color: "green" }]),
        options: [{ t: "Yes. Every vertical line meets it once: it is a function." },
                  { t: "No. A horizontal line meets it twice.", fb: "Two inputs sharing an output is fine. The test uses *vertical* lines." },
                  { t: "No. It isn't a straight line.", fb: "Functions don't have to be linear." }],
        answer: 0, skill: "Vertical line test", hints: ["Imagine a vertical line sweeping across. Does it ever touch the curve twice?"],
        why: "Each $x$ has exactly one $y$ on this curve, so it is a function." },
      { type: "num", kicker: "Use it", prompt: "Two functions: $f(x) = 3x - 4$ and $g(x) = x + 2$. For what input are their outputs equal? Solve $f(x) = g(x)$.", pre: "$x =$", answer: 3, skill: "Solve f(x) = c",
        near: [{ v: 5, fb: "That's the shared output. The question asks for the input." }],
        hints: ["$3x - 4 = x + 2$."], why: "$2x = 6$, so $x = 3$. Both give 5: on a graph, that is where the two lines cross." }
    ]
  });

  /* ============================================ 4.6 · Features of graphs */
  LESSONS.push({
    title: "Features of graphs",
    blurb: "Book 4.6 · Intercepts, highs and lows, and where a graph rises or falls.",
    mins: 7, v: 2,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "$E(t)$ is a hiker's height above the car park, in hundreds of metres, $t$ hours into a walk. Click the **highest point** of the walk.",
        x: [0, 11], y: [0, 9], axisLabels: ["t", "E"], click: "point", answer: { point: [6, 8] }, skill: "Features of a graph",
        fns: [{ f: HIKE, color: "green" }],
        clickFb: function (c) { return HIKE(c[0]) === c[1] ? "That point is on the graph, at height " + nm(c[1]) + ". There is a higher one." : "Click a point on the graph."; },
        hints: ["Which point of the graph is highest?"], why: "$(6, 8)$: after 6 hours the hiker is 800 m up. That is the **maximum** of the function." },
      { type: "learn", kicker: "Name it",
        prompt: "The points worth naming on a graph:<br><br>**Maximum / minimum:** the highest and lowest points.<br>**Vertical intercept:** where the graph meets the vertical axis (input 0).<br>**Horizontal intercept:** where it meets the horizontal axis (output 0).<br>**Increasing / decreasing:** where it rises or falls as you read left to right." },
      { type: "sort", prompt: "On each interval, what is the hiker's height doing?",
        scene: graph([0, 11], [0, 9], [{ f: HIKE, color: "green" }], { axisLabels: ["t", "E"] }),
        bins: ["Increasing", "Constant", "Decreasing"],
        cards: [{ t: "from $t = 0$ to $t = 2$", bin: 0, fb: "The graph climbs from 1 to 5." }, { t: "from $t = 2$ to $t = 4$", bin: 1, fb: "Flat at 5: a rest." },
                { t: "from $t = 4$ to $t = 6$", bin: 0, fb: "It climbs again, from 5 to 8." }, { t: "from $t = 6$ to $t = 10$", bin: 2, fb: "Downhill all the way to 0." }],
        skill: "Features of a graph", hints: ["Read left to right. Uphill, flat or downhill?"],
        why: "Up, flat, up, then down. Intervals are always described using the *input* values." },
      { type: "pair", prompt: "What are the coordinates of the **horizontal intercept**?",
        scene: graph([0, 11], [0, 9], [{ f: HIKE, color: "green" }], { axisLabels: ["t", "E"] }),
        answer: [10, 0], skill: "Features of a graph",
        near: [{ v: [0, 1], fb: "That's the vertical intercept: where $t = 0$." }, { v: [0, 10], fb: "Right numbers, wrong order: $t$ first." }],
        hints: ["Where does the graph touch the horizontal axis?"], why: "$(10, 0)$: after 10 hours the height is 0. The hiker is back at the car park." },
      { type: "choice", kicker: "Vary it", prompt: "The vertical intercept is $(0, 1)$. What does it mean?",
        options: [{ t: "The walk starts 100 m above the car park." }, { t: "The walk takes 1 hour.", fb: "The 1 is a height (the output), not a time." }, { t: "After 1 hour the hiker is at the car park.", fb: "$(0, 1)$ is time 0, height 1." }],
        answer: 0, skill: "Features of a graph", hints: ["$t = 0$ is the start. $E = 1$ is in hundreds of metres."], why: "$E(0) = 1$: at the start, the height is 100 m." },
      { type: "choice", prompt: "Which statement in function notation says where the maximum is?",
        options: [{ t: "$E(6) = 8$" }, { t: "$E(8) = 6$", fb: "The time is the input: 6 hours." }, { t: "$E(10) = 0$", fb: "That's the horizontal intercept: the end of the walk." }],
        answer: 0, skill: "Features of a graph", hints: ["Maximum at the point $(6, 8)$."], why: "$E(6) = 8$: input 6 hours, output 8 hundred metres, the greatest output." },
      { type: "choice", kicker: "Use it", prompt: "A **linear** function has the same slope everywhere. Which feature can a non-constant linear function never have?",
        options: [{ t: "A maximum point in the middle of its graph" }, { t: "A vertical intercept", fb: "Every non-vertical line crosses the vertical axis." }, { t: "A horizontal intercept", fb: "A sloping line always crosses the horizontal axis somewhere." }],
        answer: 0, skill: "Features of a graph", hints: ["A line keeps going the same way for ever."], why: "A line that rises keeps rising. It has no turning point, so no maximum or minimum in the middle." }
    ]
  });
  var TANKA = pw([[0, 8], [4, 4], [8, 4]]), TANKB = pw([[0, 2], [8, 6]]);
  var BEND = pw([[-2, 1], [1, 5], [4, 2], [6, 3]]);
  function quarter(x) { return 0.25 * x * x; }

  /* ============================================ 4.7 · Finding slope */
  LESSONS.push({
    title: "Finding slope",
    blurb: "Book 4.7 · Slope from a table, a graph or two points: change in output over change in input.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "This table is from a linear function. What is its slope?" + tbl(["$x$", "$y$"], [[1, 4], [3, 10], [5, 16]]),
        answer: 3, skill: "Slope",
        near: [{ v: 6, fb: "$y$ rises by 6, but $x$ rises by 2 each time. Slope is the rise for *one* step of $x$." }, { v: 2, fb: "That's the change in $x$. Slope is change in $y$ divided by change in $x$." }],
        hints: ["How much does $y$ change? How much does $x$ change?"], why: "$y$ rises 6 while $x$ rises 2: slope $= \\frac{6}{2} = 3$." },
      { type: "learn", kicker: "See it", prompt: "Drag $A$ and $B$ anywhere. The triangle shows the **rise** and the **run** between them.",
        scene: { type: "plane", x: [-6, 6], y: [-6, 6], gate: true,
          points: [{ id: "A", x: -2, y: -1, drag: true, label: "A" }, { id: "B", x: 2, y: 5, drag: true, label: "B" }],
          lines: [{ through: ["A", "B"], slope: true, color: "blue" }],
          readout: function (st) { var a = st.pt("A"), b = st.pt("B"); return a.x === b.x ? "Run is 0: the slope is **undefined**." : "slope $= \\frac{\\text{rise}}{\\text{run}} = \\frac{" + nm(b.y - a.y) + "}{" + nm(b.x - a.x) + "} = " + nm(r2((b.y - a.y) / (b.x - a.x))) + "$"; } },
        gate: true,
        then: "For any two points $(x_1, y_1)$ and $(x_2, y_2)$ on a line:$$m = \\frac{y_2 - y_1}{x_2 - x_1}$$Rising lines have positive slope, falling lines negative, flat lines zero. A vertical line has no slope at all." },
      { type: "num", prompt: "Find the slope of the line through $(2, 5)$ and $(6, -3)$.", answer: -2, skill: "Slope",
        near: [{ v: 2, fb: "From 5 down to $-3$ is a *fall* of 8: the rise is $-8$." }, { v: -0.5, fb: "That's run over rise. Slope is rise over run: $\\frac{-8}{4}$." }],
        hints: ["Rise: $-3 - 5$. Run: $6 - 2$."], why: "$m = \\frac{-3 - 5}{6 - 2} = \\frac{-8}{4} = -2$." },
      { type: "num", prompt: "And through $(-1, 4)$ and $(3, 4)$?", answer: 0, skill: "Slope",
        hints: ["How much does $y$ change?"], why: "$m = \\frac{4 - 4}{3 - (-1)} = \\frac{0}{4} = 0$. A horizontal line." },
      { type: "choice", kicker: "Vary it", prompt: "What is the slope of the line through $(2, 1)$ and $(2, 7)$?",
        options: [{ t: "Undefined: the run is 0, and you can't divide by 0." }, { t: "0", fb: "Slope 0 is a *horizontal* line. Here $x$ doesn't change, so the line is vertical." }, { t: "6", fb: "6 is the rise. The run is $2 - 2 = 0$." }],
        answer: 0, skill: "Slope", hints: ["Work out the run."], why: "$\\frac{7 - 1}{2 - 2} = \\frac{6}{0}$: undefined. Vertical lines have no slope." },
      { type: "equation", prompt: "A line passes through $(1, 3)$ and $(3, 7)$. Write its equation.", answer: "y=2x+1", shown: "y = 2x + 1", skill: "Equation from two points",
        near: [{ v: "y=2x", fb: "Slope 2 is right. Now check a point: at $x = 1$, $y$ must be 3." }, { v: "y=2x+3", fb: "At $x = 1$ that gives 5, not 3. Solve $3 = 2(1) + b$." }],
        hints: ["Slope: $\\frac{7 - 3}{3 - 1}$.", "Then put $(1, 3)$ into $y = 2x + b$."], why: "Slope 2. Then $3 = 2 + b$, so $b = 1$: $y = 2x + 1$." },
      { type: "equation", kicker: "Use it", prompt: "A linear function has $f(2) = 9$ and $f(5) = 3$. Write its equation as $y = \\ldots$", answer: "y=-2x+13", shown: "y = -2x + 13", skill: "Equation from two points",
        near: [{ v: "y=2x+5", fb: "The output falls from 9 to 3 as the input rises: the slope is negative." }],
        hints: ["The two points are $(2, 9)$ and $(5, 3)$.", "Slope: $\\frac{3 - 9}{5 - 2} = -2$."], why: "Slope $-2$. Then $9 = -2(2) + b$ gives $b = 13$: $f(x) = -2x + 13$." }
    ]
  });

  /* ============================================ 4.8 · Average rate of change */
  LESSONS.push({
    title: "Using graphs to find average rate of change",
    blurb: "Book 4.8 · On a curve the steepness keeps changing. Between two points, you can still average it.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "$d(t)$ is how far a cyclist has gone, in km, after $t$ hours. $d(1) = 12$ and $d(4) = 54$. What was her **average speed** between those times?",
        post: "km per hour", answer: 14, skill: "Average rate of change",
        near: [{ v: 42, fb: "That's the distance covered. Divide by the 3 hours it took." }, { v: 13.5, fb: "That's $54 \\div 4$. Use only the stretch from hour 1 to hour 4." }],
        hints: ["Distance covered: $54 - 12$. Time taken: $4 - 1$."], why: "$\\frac{54 - 12}{4 - 1} = \\frac{42}{3} = 14$ km per hour." },
      { type: "learn", kicker: "Name it",
        prompt: "That is an **average rate of change**: the change in output divided by the change in input.$$\\frac{f(b) - f(a)}{b - a}$$It is the slope of the straight line joining two points of the graph." },
      { type: "learn", kicker: "See it", prompt: "Slide $a$ and $b$ along this curve. The orange line joins the two points. Watch its slope.",
        scene: { type: "plane", x: [0, 9], y: [0, 17], gate: true,
          params: { a: { v: 2, min: 0, max: 7, step: 1, label: "$a$" }, b: { v: 4, min: 1, max: 8, step: 1, label: "$b$" } },
          fns: [{ f: quarter, color: "blue" }],
          marks: function (st) { var p = st.params; return [{ x: p.a, y: quarter(p.a), color: "orange", r: 6 }, { x: p.b, y: quarter(p.b), color: "orange", r: 6 }]; },
          segs: function (st) { var p = st.params; return [[p.a, quarter(p.a), p.b, quarter(p.b), "orange"]]; },
          readout: function (st) { var p = st.params; return p.a === p.b ? "Choose two different inputs." : "From $x = " + p.a + "$ to $x = " + p.b + "$: $\\frac{" + nm(quarter(p.b)) + " - " + nm(quarter(p.a)) + "}{" + p.b + " - " + p.a + "} = " + nm(r2((quarter(p.b) - quarter(p.a)) / (p.b - p.a))) + "$"; } },
        gate: true,
        then: "On a curve, the average rate of change depends on the interval: this graph gets steeper as it goes. On a straight line it would be the same everywhere." },
      { type: "num", prompt: "For $f(x) = x^2$, find the average rate of change from $x = 1$ to $x = 3$.", answer: 4, skill: "Average rate of change",
        near: [{ v: 8, fb: "That's $f(3) - f(1)$. Divide by $3 - 1$." }, { v: 2, fb: "Use the outputs: $f(3) = 9$ and $f(1) = 1$." }],
        hints: ["$f(1) = 1$ and $f(3) = 9$."], why: "$\\frac{9 - 1}{3 - 1} = \\frac{8}{2} = 4$." },
      { type: "choice", kicker: "Vary it", prompt: "For the **linear** function $g(x) = 3x + 1$, what is the average rate of change between any two inputs?",
        options: [{ t: "Always 3" }, { t: "It depends on the inputs.", fb: "Try two pairs: from 0 to 2, $\\frac{7 - 1}{2} = 3$. From 1 to 5, $\\frac{16 - 4}{4} = 3$." }, { t: "Always 1", fb: "1 is the intercept. The rate of change is the slope." }],
        answer: 0, skill: "Average rate of change", hints: ["Try it between two inputs of your choice."], why: "A linear function changes at a constant rate: its slope." },
      { type: "num", prompt: "At 8 a.m. it is 10°C. At 1 p.m. it is 25°C. What is the average rate of change of the temperature?", post: "°C per hour", answer: 3, skill: "Average rate of change",
        near: [{ v: 15, fb: "That's the total change. Divide by the number of hours." }],
        hints: ["From 8 a.m. to 1 p.m. is 5 hours."], why: "$\\frac{25 - 10}{5} = 3$ degrees per hour." },
      { type: "choice", kicker: "Use it", prompt: "A battery is at 90% at $t = 0$ hours and 30% at $t = 5$. Its average rate of change is $-12$. What does that mean?",
        options: [{ t: "On average, it lost 12 percentage points each hour." }, { t: "It gained 12% an hour.", fb: "The rate is negative: the charge went down." }, { t: "It lost exactly 12% every single hour.", fb: "An average says nothing about each hour on its own. It might have dropped fast, then slowly." }],
        answer: 0, skill: "Average rate of change", hints: ["Negative means decreasing. “Average” means overall."], why: "$\\frac{30 - 90}{5} = -12$: down 12 points an hour on average." }
    ]
  });

  /* ============================================ 4.9 · Interpreting and creating graphs */
  LESSONS.push({
    title: "Interpreting and creating graphs",
    blurb: "Book 4.9 · A graph tells a story. Read one, then draw one.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "This graph shows Maya's **distance from home** over time. Which story fits?",
        scene: graph([0, 10], [0, 8], [{ f: pw([[0, 0], [2, 4], [3, 4], [6, 6], [9, 0]]), color: "blue" }], { axisLabels: ["min", "blocks"] }),
        options: [{ t: "She walks away, pauses, walks further, then comes back home." },
                  { t: "She walks at one steady speed the whole time.", fb: "A steady speed would be one straight line. This graph has four different pieces." },
                  { t: "She climbs a hill, rests, climbs again, and goes down the other side.", fb: "The vertical axis is distance from home, not height. Falling to 0 means she is back home." }],
        answer: 0, skill: "Interpret a graph", hints: ["Rising: getting farther. Flat: staying put. Falling: coming back."],
        why: "Up (away), flat (pause), up (further), down to 0 (home again)." },
      { type: "slots", kicker: "Name it", prompt: "On a distance-from-home graph, what does each piece mean?",
        slots: [{ id: "a", label: "A steep rising line" }, { id: "b", label: "A gentle rising line" }, { id: "c", label: "A flat line" }, { id: "d", label: "A falling line" }],
        cards: [{ t: "Moving away quickly", slot: "a", fb: "Steep means a lot of distance in little time." }, { t: "Moving away slowly", slot: "b", fb: "Gentle slope, slow change." },
                { t: "Standing still", slot: "c", fb: "No change in distance." }, { t: "Coming back", slot: "d", fb: "The distance from home is shrinking." }],
        skill: "Interpret a graph", hints: ["The slope is the speed. Its sign is the direction."], why: "Slope tells you how fast the output changes, and which way." },
      { type: "plane", kicker: "See it", prompt: "Draw this story: a lift starts at floor 0, rises to **floor 6 by 3 seconds**, waits **until 5 seconds**, then goes down to **floor 2 by 7 seconds**. Drag $A$, $B$ and $C$.",
        x: [0, 9], y: [0, 8], axisLabels: ["s", "floor"],
        points: [{ id: "A", x: 2, y: 2, drag: true, label: "A" }, { id: "B", x: 4, y: 2, drag: true, label: "B" }, { id: "C", x: 6, y: 5, drag: true, label: "C" }],
        segs: function (st) { var a = st.pt("A"), b = st.pt("B"), c = st.pt("C"); return [[0, 0, a.x, a.y, "blue"], [a.x, a.y, b.x, b.y, "blue"], [b.x, b.y, c.x, c.y, "blue"]]; },
        check: function (st) { var a = st.pt("A"), b = st.pt("B"), c = st.pt("C");
          if (a.x !== 3 || a.y !== 6) return { ok: false, say: "$A$ is the end of the first climb: floor 6 at 3 seconds." };
          if (b.x !== 5 || b.y !== 6) return { ok: false, say: "The lift waits at floor 6 until 5 seconds, so $B$ is at the same height as $A$." };
          return c.x === 7 && c.y === 2 ? { ok: true } : { ok: false, say: "$C$ is where the ride ends: floor 2 at 7 seconds." }; },
        answer: { points: { A: [3, 6], B: [5, 6], C: [7, 2] } }, skill: "Create a graph",
        hints: ["Each point is (seconds, floor)."], why: "$(3, 6)$, then flat to $(5, 6)$, then down to $(7, 2)$." },
      { type: "choice", prompt: "Why does **time** go on the horizontal axis?",
        options: [{ t: "Time is the independent variable: the floor depends on it." }, { t: "Time is always the bigger number.", fb: "Size doesn't decide the axis. What depends on what does." }, { t: "It makes no difference.", fb: "By convention the input goes across and the output goes up, so a graph can be read as a function." }],
        answer: 0, skill: "Create a graph", hints: ["Which quantity depends on the other?"], why: "The input goes on the horizontal axis and the output on the vertical." },
      { type: "choice", kicker: "Vary it", prompt: "No numbers this time. What is this quantity doing?",
        scene: graph([0, 8], [0, 10], [{ f: "0.15*x^2", color: "purple" }]),
        options: [{ t: "Increasing, faster and faster." }, { t: "Increasing at a steady rate.", fb: "A steady rate is a straight line. This curve bends upward." }, { t: "Increasing, then levelling off.", fb: "Levelling off would flatten out. This one gets steeper." }],
        answer: 0, skill: "Interpret a graph", hints: ["Is the graph getting steeper or flatter?"], why: "It rises, and it gets steeper: the rate of change is itself growing." },
      { type: "explain", kicker: "Use it", prompt: "Describe a graph of **your energy level** across a school day. What goes on each axis, and where does the graph rise, fall or stay flat?",
        placeholder: "e.g. Time across, energy up. It starts low, rises after breakfast…",
        model: "A good answer names the axes (time across, energy up) and ties each piece of the graph to something that happened: “Low at 7 a.m., rising after breakfast, flat through the morning, a dip before lunch, a peak at afternoon sport, then falling in the evening.”" }
    ]
  });

  /* ============================================ 4.10 · Comparing graphs */
  LESSONS.push({
    title: "Comparing graphs",
    blurb: "Book 4.10 · Two functions on one set of axes: where they are equal, and which is greater.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "Two water tanks. $A(t)$ and $B(t)$ are their depths in cm after $t$ minutes. At what time is $A(t) = B(t)$?",
        scene: graph([0, 9], [0, 9], [{ f: TANKA, color: "blue", label: "A", labelAt: 1 }, { f: TANKB, color: "green", label: "B", labelAt: 7 }], { axisLabels: ["t", "cm"] }),
        pre: "$t =$", answer: 4, skill: "Compare two functions",
        hints: ["Equal outputs means the graphs meet."], why: "The graphs cross at $t = 4$, where both tanks are 4 cm deep." },
      { type: "choice", prompt: "At $t = 2$, which tank is deeper?",
        scene: graph([0, 9], [0, 9], [{ f: TANKA, color: "blue", label: "A", labelAt: 1 }, { f: TANKB, color: "green", label: "B", labelAt: 7 }], { axisLabels: ["t", "cm"] }),
        options: [{ t: "Tank A" }, { t: "Tank B", fb: "At $t = 2$, the blue graph is at 6 and the green one at 3." }, { t: "They are equal.", fb: "They are equal only where the graphs cross, at $t = 4$." }],
        answer: 0, keep: true, skill: "Compare two functions", hints: ["Which graph is higher above $t = 2$?"], why: "$A(2) = 6$ and $B(2) = 3$, so $A(2) > B(2)$." },
      { type: "sort", prompt: "True or false?",
        scene: graph([0, 9], [0, 9], [{ f: TANKA, color: "blue", label: "A", labelAt: 1 }, { f: TANKB, color: "green", label: "B", labelAt: 7 }], { axisLabels: ["t", "cm"] }),
        bins: ["True", "False"],
        cards: [{ t: "$A(0) > B(0)$", bin: 0, fb: "8 is greater than 2." }, { t: "$A(6) = B(6)$", bin: 1, fb: "$A(6) = 4$ but $B(6) = 5$." },
                { t: "$B(8) > A(8)$", bin: 0, fb: "6 is greater than 4." }, { t: "$A(4) = B(4)$", bin: 0, fb: "Both are 4: the crossing point." }],
        skill: "Compare two functions", hints: ["Read both graphs at the same input."], why: "Compare heights above the same $t$." },
      { type: "learn", kicker: "Name it",
        prompt: "To compare two functions on one graph:<br><br>**Where the graphs cross**, the outputs are equal: $A(t) = B(t)$.<br>**Where one graph is higher**, its output is greater.<br>**The steeper graph** is changing faster." },
      { type: "choice", kicker: "Vary it", prompt: "For which values of $t$ is $B(t) > A(t)$?",
        scene: graph([0, 9], [0, 9], [{ f: TANKA, color: "blue", label: "A", labelAt: 1 }, { f: TANKB, color: "green", label: "B", labelAt: 7 }], { axisLabels: ["t", "cm"] }),
        options: [{ t: "After $t = 4$" }, { t: "Before $t = 4$", fb: "Before 4, the blue graph (A) is on top." }, { t: "Always", fb: "A starts much deeper: 8 cm against 2." }],
        answer: 0, skill: "Compare two functions", hints: ["Where is the green graph above the blue one?"], why: "Green is above blue to the right of the crossing: $t > 4$." },
      { type: "choice", kicker: "Use it", prompt: "In the first 4 minutes, which tank's depth is changing **faster**?",
        scene: graph([0, 9], [0, 9], [{ f: TANKA, color: "blue", label: "A", labelAt: 1 }, { f: TANKB, color: "green", label: "B", labelAt: 7 }], { axisLabels: ["t", "cm"] }),
        options: [{ t: "Tank A: it drops 1 cm a minute." }, { t: "Tank B: it is rising.", fb: "B rises only half a cm a minute. Faster means the steeper graph, up or down." }, { t: "Neither: they meet at $t = 4$.", fb: "Meeting says the depths are equal, not the rates." }],
        answer: 0, skill: "Compare two functions", hints: ["Compare the steepness, ignoring direction."], why: "A falls 4 cm in 4 minutes (1 cm/min). B rises 2 cm in 4 minutes (0.5 cm/min)." }
    ]
  });

  /* ============================================ 4.11 · Transformations */
  LESSONS.push({
    title: "Graphing a function using transformations",
    blurb: "Book 4.11 · Shift a graph up, down or sideways. Stretch it or squash it.",
    mins: 9, v: 2,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "The dashed line is $f(x) = x$. Slide $k$ to make $g(x) = f(x) + k$ pass through the orange point.",
        x: [-6, 6], y: [-6, 6], params: { k: { v: 0, min: -5, max: 5, step: 1, label: "$k$" } },
        fns: [{ f: "x", color: "ink", dashed: true }, { f: "x + k", color: "blue" }], marks: [{ x: 0, y: -3, color: "orange", r: 6 }],
        readout: function (st) { var k = st.params.k; return "$g(x) = x " + (k < 0 ? "- " + -k : "+ " + k) + "$"; },
        check: function (st) { return st.params.k === -3 ? { ok: true } : { ok: false, say: "The orange point is $(0, -3)$. How far is that below $(0, 0)$?" }; },
        answer: { params: { k: -3 } }, skill: "Vertical shift", hints: ["Every point of $f$ moves up by $k$. Which $k$ moves $(0, 0)$ to $(0, -3)$?"],
        why: "$g(x) = f(x) - 3$ moves the whole graph **down 3**. Adding a number to the *output* is a **vertical shift**." },
      { type: "plane", prompt: "Now slide $a$ to make $g(x) = a \\cdot f(x)$ pass through the orange point.",
        x: [-6, 6], y: [-6, 6], params: { a: { v: 1, min: 0.5, max: 4, step: 0.5, label: "$a$" } },
        fns: [{ f: "x", color: "ink", dashed: true }, { f: "a*x", color: "blue" }], marks: [{ x: 2, y: 6, color: "orange", r: 6 }],
        readout: function (st) { return "$g(x) = " + nm(st.params.a) + "x$"; },
        check: function (st) { return st.params.a === 3 ? { ok: true } : { ok: false, say: "At $x = 2$, $f$ gives 2. You need 6 there." }; },
        answer: { params: { a: 3 } }, skill: "Vertical stretch", hints: ["What must 2 be multiplied by to make 6?"],
        why: "$g(x) = 3f(x)$ makes every output 3 times as big: a **vertical stretch**. With $a$ between 0 and 1 the graph is squashed flatter." },
      { type: "plane", kicker: "See it", prompt: "A shape that shows sideways moves clearly: $f(x) = |x|$. Slide $h$ so the corner of $g(x) = f(x - h)$ lands on the orange point.",
        x: [-6, 8], y: [-2, 8], params: { h: { v: 0, min: -5, max: 5, step: 1, label: "$h$" } },
        fns: [{ f: "abs(x)", color: "ink", dashed: true }, { f: "abs(x - h)", color: "blue" }], marks: [{ x: 4, y: 0, color: "orange", r: 6 }],
        readout: function (st) { var h = st.params.h; return "$g(x) = |x " + (h < 0 ? "+ " + -h : "- " + h) + "|$"; },
        check: function (st) { return st.params.h === 4 ? { ok: true } : { ok: false, say: "The corner needs to be at $x = 4$." }; },
        answer: { params: { h: 4 } }, skill: "Horizontal shift", hints: ["Try a positive $h$ and see which way the graph moves."],
        why: "$g(x) = f(x - 4)$ moves the graph **right 4**. Subtracting from the *input* shifts right, and adding shifts left: the opposite of what the sign suggests." },
      { type: "choice", prompt: "Why does $f(x - 4)$ move the graph to the **right**?",
        options: [{ t: "To get the same output as before, the input now has to be 4 bigger." },
                  { t: "Because subtracting always moves right.", fb: "$f(x) - 4$ also subtracts, and it moves the graph *down*. The question is what the 4 is subtracted from." },
                  { t: "It doesn't: it moves left.", fb: "Check with $|x - 4|$: its corner is where $x - 4 = 0$, at $x = 4$." }],
        answer: 0, skill: "Horizontal shift", hints: ["Where is $x - 4$ equal to 0?"], why: "The corner of $|x|$ is at input 0. For $|x - 4|$, the inside is 0 when $x = 4$: everything happens 4 later." },
      { type: "slots", kicker: "Name it", prompt: "Match each change to what it does to the graph of $f$.",
        slots: [{ id: "a", label: "Up 2" }, { id: "b", label: "Down 2" }, { id: "c", label: "Left 2" }, { id: "d", label: "Twice as tall" }, { id: "e", label: "Half as tall" }],
        cards: [{ t: "$f(x) + 2$", slot: "a", fb: "Adding to the output moves up." }, { t: "$f(x) - 2$", slot: "b", fb: "Subtracting from the output moves down." },
                { t: "$f(x + 2)$", slot: "c", fb: "Adding to the input moves left." }, { t: "$2f(x)$", slot: "d", fb: "Multiplying the output by 2 stretches it vertically." },
                { t: "$\\frac{1}{2}f(x)$", slot: "e", fb: "Multiplying the output by a half squashes it." }],
        skill: "Transformations", hints: ["Outside the brackets changes the output (vertical). Inside changes the input (horizontal)."],
        why: "Outside $f$: vertical, and it does what it says. Inside $f$: horizontal, and it does the opposite." },
      { type: "plane", kicker: "Use it", prompt: "Build $g(x) = 2x + 3$ from the dashed line $f(x) = x$: first stretch, then shift.",
        x: [-6, 6], y: [-6, 8], params: { a: { v: 1, min: 0.5, max: 4, step: 0.5, label: "stretch $a$" }, k: { v: 0, min: -5, max: 5, step: 1, label: "shift $k$" } },
        fns: [{ f: "x", color: "ink", dashed: true }, { f: "a*x + k", color: "blue" }],
        readout: function (st) { return "$g(x) = " + poly([[st.params.a, "x"], [st.params.k, ""]]) + "$"; },
        check: function (st) { var p = st.params; return p.a === 2 && p.k === 3 ? { ok: true } : { ok: false, say: p.a !== 2 ? "The slope of $2x + 3$ is 2: that's the stretch." : "The stretch is right. Now shift it up to cross the $y$-axis at 3." }; },
        answer: { params: { a: 2, k: 3 } }, skill: "Transformations", hints: ["$2x + 3 = 2 \\cdot f(x) + 3$."],
        why: "Every line $y = mx + b$ is the line $y = x$ stretched by $m$ and shifted by $b$." }
    ]
  });

  /* ============================================ 4.12 · Domain and range, part 1 */
  LESSONS.push({
    title: "Domain and range, part 1",
    blurb: "Book 4.12 · The inputs that make sense, and the outputs they produce.",
    mins: 7, v: 2,
    steps: [
      { type: "sort", kicker: "Try it", prompt: "$C(n) = 9n$ is the cost of $n$ cinema tickets. Which inputs make sense?",
        bins: ["Makes sense", "Doesn't make sense"],
        cards: [{ t: "$n = 3$", bin: 0, fb: "Three tickets: fine." }, { t: "$n = 0$", bin: 0, fb: "No tickets costs nothing. It's allowed." },
                { t: "$n = -2$", bin: 1, fb: "You can't buy a negative number of tickets." }, { t: "$n = 2.5$", bin: 1, fb: "Tickets come whole." }, { t: "$n = 40$", bin: 0, fb: "A big group, but possible." }],
        skill: "Domain", hints: ["Could you really buy that many tickets?"], why: "The sensible inputs are the whole numbers 0, 1, 2, 3, …" },
      { type: "learn", kicker: "Name it",
        prompt: "The **domain** of a function is the set of all its possible inputs.<br><br>The **range** is the set of all the outputs those inputs produce.<br><br>For $C(n) = 9n$: the domain is $0, 1, 2, 3, \\ldots$ and the range is $0, 9, 18, 27, \\ldots$" },
      { type: "multi", prompt: "Which numbers are in the **range** of $C(n) = 9n$, where $n$ is a whole number of tickets?",
        options: [{ t: "0", ok: true }, { t: "27", ok: true }, { t: "90", ok: true }, { t: "12", fb: "No whole number of \\$9 tickets costs \\$12." }, { t: "$-9$", fb: "That would need $n = -1$, which is not in the domain." }],
        skill: "Range", hints: ["Is it 9 times a whole number?"], why: "$0 = 9(0)$, $27 = 9(3)$, $90 = 9(10)$. The range is the multiples of 9." },
      { type: "choice", kicker: "Vary it", prompt: "$h(t)$ is the height of a ball $t$ seconds after it is thrown. It lands after 3 seconds. What is a sensible domain?",
        options: [{ t: "$0 \\le t \\le 3$" }, { t: "All numbers", fb: "Before the throw ($t < 0$) and after landing ($t > 3$) the function describes nothing." }, { t: "$t = 0, 1, 2, 3$ only", fb: "The ball is in the air at $t = 1.5$ too. Time isn't limited to whole numbers." }],
        answer: 0, skill: "Domain", hints: ["When is the ball in the air?"], why: "From the throw ($t = 0$) to the landing ($t = 3$), and every moment in between." },
      { type: "num", prompt: "A function is given by this table. How many numbers are in its **range**?" + tbl(["$x$", "$f(x)$"], [[1, 7], [2, 9], [3, 7], [4, 3]]),
        answer: 3, skill: "Range",
        near: [{ v: 4, fb: "There are four inputs, but the output 7 appears twice. A set lists each value once." }],
        hints: ["List the different outputs."], why: "The outputs are 7, 9, 7, 3. The range is $\\{3, 7, 9\\}$: three numbers." },
      { type: "choice", kicker: "Use it", prompt: "A taxi costs $C(m) = 0.5m + 2$ dollars for $m$ miles, and trips run from 0 to 40 miles. What is the range?",
        options: [{ t: "$2 \\le C \\le 22$" }, { t: "$0 \\le C \\le 40$", fb: "That's the domain: the miles. The range is the costs." }, { t: "$0 \\le C \\le 22$", fb: "Even a 0-mile trip costs the \\$2 fee." }],
        answer: 0, skill: "Range", hints: ["Work out the cost at each end of the domain."], why: "$C(0) = 2$ and $C(40) = 22$. The cost takes every value in between." }
    ]
  });

  /* ============================================ 4.13 · Domain and range, part 2 */
  LESSONS.push({
    title: "Domain and range, part 2",
    blurb: "Book 4.13 · Read the domain along the horizontal axis and the range along the vertical one.",
    mins: 7, v: 2,
    steps: [
      { type: "numberline", kicker: "Try it", prompt: "Here is the whole graph of a function. Show its **domain**: every $x$ the graph uses.",
        scene: graph([-4, 8], [-1, 7], [{ f: BEND, color: "blue" }], { marks: [{ x: -2, y: 1, color: "blue" }, { x: 6, y: 3, color: "blue" }] }),
        min: -4, max: 8, mode: "seg", variable: "x", seg: { a: 0, b: 3, ca: true, cb: true }, answer: { a: -2, b: 6, ca: true, cb: true }, skill: "Domain from a graph",
        hints: ["How far left does the graph go? How far right?"], why: "The graph runs from $x = -2$ to $x = 6$, ends included: $-2 \\le x \\le 6$." },
      { type: "numberline", prompt: "Now its **range**: every $y$ the graph reaches.",
        scene: graph([-4, 8], [-1, 7], [{ f: BEND, color: "blue" }], { marks: [{ x: -2, y: 1, color: "blue" }, { x: 6, y: 3, color: "blue" }] }),
        min: -1, max: 7, mode: "seg", variable: "y", seg: { a: 2, b: 3, ca: true, cb: true }, answer: { a: 1, b: 5, ca: true, cb: true }, skill: "Range from a graph",
        hints: ["What is the lowest point of the graph? The highest?"], why: "The lowest point has $y = 1$ and the highest has $y = 5$: $1 \\le y \\le 5$." },
      { type: "learn", kicker: "Name it",
        prompt: "Imagine a light shining on the graph.<br><br>Its shadow on the **horizontal** axis is the **domain**: read it left to right.<br>Its shadow on the **vertical** axis is the **range**: read it bottom to top.<br><br>A filled end point is included. An open one is not. An arrow means the graph keeps going." },
      { type: "choice", kicker: "Vary it", prompt: "This parabola continues downward for ever on both sides. What is its **range**?",
        scene: graph([-5, 5], [-6, 6], [{ f: "4 - x^2", color: "green" }]),
        options: [{ t: "$y \\le 4$" }, { t: "$y \\ge 4$", fb: "The graph never goes above 4. It lies at 4 and below." }, { t: "All real numbers", fb: "No point of the graph is higher than 4." }],
        answer: 0, skill: "Range from a graph", hints: ["What is the highest the graph gets? Does it have a lowest point?"], why: "The top is at $y = 4$, and the graph falls without end: $y \\le 4$." },
      { type: "choice", prompt: "And its **domain**?",
        scene: graph([-5, 5], [-6, 6], [{ f: "4 - x^2", color: "green" }]),
        options: [{ t: "All real numbers" }, { t: "$-2 \\le x \\le 2$", fb: "That's only where the graph is above the axis. It carries on outward past $x = \\pm 2$." }, { t: "$x \\le 4$", fb: "4 is a $y$ value. The domain is about $x$." }],
        answer: 0, skill: "Domain from a graph", hints: ["Does the graph stop anywhere to the left or right?"], why: "The curve spreads left and right without end, so every $x$ is an input." },
      { type: "choice", kicker: "Use it", prompt: "A ball is thrown and lands 4 seconds later. $h(t)$ is its height in metres. Which is right?",
        scene: graph([0, 5], [0, 22], [{ f: function (x) { return x >= 0 && x <= 4 ? 5 * x * (4 - x) : NaN; }, color: "orange" }], { axisLabels: ["t", "h"], labelEveryY: 5, grid: 1 }),
        options: [{ t: "Domain $0 \\le t \\le 4$, range $0 \\le h \\le 20$" }, { t: "Domain $0 \\le t \\le 20$, range $0 \\le h \\le 4$", fb: "Time is the input: it runs from 0 to 4 seconds." }, { t: "Domain $0 \\le t \\le 4$, range $0 \\le h \\le 4$", fb: "Look at the highest point: the ball reaches 20 m." }],
        answer: 0, skill: "Domain from a graph", hints: ["Domain: across. Range: up."], why: "In the air from 0 to 4 seconds, at heights from 0 to 20 metres." }
    ]
  });
  // The terms of a sequence as dots: [[1, f(1)], [2, f(2)], …].
  function seqDots(terms, color) { return terms.map(function (v, i) { return { x: i + 1, y: v, color: color || "blue", r: 6 }; }); }

  /* ============================================ 4.14 · Sequences */
  LESSONS.push({
    title: "Sequences",
    blurb: "Book 4.14 · A list of numbers in order, and the rule that makes the next one.",
    mins: 6, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "What comes next?$$3, \\; 7, \\; 11, \\; 15, \\; \\ldots$$", answer: 19, skill: "Sequences",
        hints: ["How do you get from each number to the next?"], why: "Each number is 4 more than the one before: $15 + 4 = 19$." },
      { type: "num", prompt: "And here?$$2, \\; 6, \\; 18, \\; 54, \\; \\ldots$$", answer: 162, skill: "Sequences",
        near: [{ v: 90, fb: "The gaps are 4, 12, 36: they aren't equal. Try multiplying instead." }, { v: 108, fb: "That's $54 \\times 2$. Check the earlier steps: $2 \\to 6 \\to 18$." }],
        hints: ["Adding doesn't work: the gaps keep growing. What does each number get multiplied by?"], why: "Each number is 3 times the one before: $54 \\times 3 = 162$." },
      { type: "learn", kicker: "Name it",
        prompt: "A list of numbers in a set order is a **sequence**. Each number in it is a **term**.<br><br>The first sequence grows by **adding** the same amount each time. The second grows by **multiplying** by the same amount. Those are the two kinds this unit is about." },
      { type: "learn", kicker: "See it", prompt: "A sequence can be a growing pattern. Slide to build figures 1 to 5 and count the blocks.",
        scene: { type: "pattern", a: 2, d: 3, n: 1, max: 6, gate: true, gateN: 5 }, gate: true,
        then: "The block counts are 2, 5, 8, 11, 14: every figure adds 3 new blocks. The number of blocks is a sequence." },
      { type: "sort", kicker: "Vary it", prompt: "What is each sequence's rule?",
        bins: ["Adds the same amount", "Multiplies by the same amount", "Neither"],
        cards: [{ t: "5, 10, 15, 20", bin: 0, fb: "Add 5 each time." }, { t: "1, 2, 4, 8", bin: 1, fb: "Multiply by 2 each time." },
                { t: "1, 4, 9, 16", bin: 2, fb: "The gaps are 3, 5, 7 and the ratios change too. These are the square numbers." },
                { t: "100, 90, 80, 70", bin: 0, fb: "Add $-10$ each time." }, { t: "81, 27, 9, 3", bin: 1, fb: "Multiply by $\\frac{1}{3}$ each time." }],
        skill: "Sequences", hints: ["Check the gaps between terms first. If they aren't equal, check the ratios."],
        why: "Equal gaps: adding. Equal ratios: multiplying. Some sequences do neither." },
      { type: "num", prompt: "A sequence starts at 40, and the rule is “subtract 6”. What is the **4th** term?", answer: 22, skill: "Sequences",
        near: [{ v: 16, fb: "That's the 5th term. The 1st term is 40 itself." }, { v: 28, fb: "That's the 3rd term: 40, 34, 28, …" }],
        hints: ["Write them out: 40, 34, …"], why: "40, 34, 28, 22. The 1st term is the starting number." },
      { type: "num", kicker: "Use it", prompt: "A famous one with a different kind of rule. What comes next?$$1, \\; 1, \\; 2, \\; 3, \\; 5, \\; 8, \\; \\ldots$$", answer: 13, skill: "Sequences",
        hints: ["Look at two terms in a row, and the one after them."], why: "Each term is the sum of the two before it: $5 + 8 = 13$. A rule can use more than one earlier term." }
    ]
  });

  /* ============================================ 4.15 · Geometric sequences */
  LESSONS.push({
    title: "Introducing geometric sequences",
    blurb: "Book 4.15 · Multiply by the same number every time: the common ratio.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "Fold a sheet of paper in half and it is 2 layers thick. Fold again: 4. Again: 8. How many layers after **6 folds**?", answer: 64, skill: "Geometric sequences",
        near: [{ v: 12, fb: "The layers don't go up by 2. They *double*: 2, 4, 8, 16, …" }, { v: 32, fb: "That's 5 folds." }],
        hints: ["Keep doubling: 2, 4, 8, …"], why: "2, 4, 8, 16, 32, 64. Each fold doubles the layers." },
      { type: "learn", kicker: "See it", prompt: "Slide through the figures. How does each one grow from the last?",
        scene: { type: "pattern", a: 1, r: 2, n: 1, max: 6, gate: true, gateN: 5 }, gate: true,
        then: "1, 2, 4, 8, 16: every figure has twice as many blocks as the one before. A sequence where each term is the previous term **times the same number** is a **geometric sequence**. That number is the **common ratio**." },
      { type: "num", prompt: "What is the common ratio of $3, 12, 48, 192$?", answer: 4, skill: "Common ratio",
        near: [{ v: 9, fb: "That's the first gap, $12 - 3$. A ratio is found by dividing: $12 \\div 3$." }],
        hints: ["Divide any term by the one before it."], why: "$12 \\div 3 = 4$, $48 \\div 12 = 4$, $192 \\div 48 = 4$." },
      { type: "num", prompt: "A ratio can be a fraction. What is the common ratio of $80, 40, 20, 10$?", answer: 0.5, skill: "Common ratio",
        near: [{ v: 2, fb: "Divide a term by the one *before* it: $40 \\div 80$." }, { v: -40, fb: "That's a difference. Geometric sequences multiply: $80 \\times \\,? = 40$." }],
        hints: ["$40 \\div 80$."], why: "$40 \\div 80 = \\frac{1}{2}$. Multiplying by a half makes the terms shrink." },
      { type: "table", kicker: "Vary it", prompt: "This sequence is geometric. Fill in the missing terms.",
        head: ["term 1", "term 2", "term 3", "term 4", "term 5"], rows: [[2, null, 18, 54, null]], answers: [[0, 1, 6], [0, 4, 162]], skill: "Geometric sequences",
        hints: ["Find the ratio from two neighbours: $54 \\div 18$."], why: "The ratio is 3: $2, 6, 18, 54, 162$." },
      { type: "choice", prompt: "Two sequences are graphed as dots. Which is geometric?",
        scene: { type: "plane", x: [0, 6], y: [0, 18], marks: seqDots([1, 2, 4, 8, 16], "blue").concat(seqDots([2, 5, 8, 11, 14], "green")) },
        options: [{ t: "Blue: its dots curve upward, faster and faster." }, { t: "Green: its dots are in a straight line.", fb: "A straight line means the same amount is *added* each step: 2, 5, 8, 11, 14." }, { t: "Both", fb: "Check the green one: $5 \\div 2$ and $8 \\div 5$ aren't equal." }],
        answer: 0, skill: "Geometric sequences", hints: ["Read off the terms. Is it adding or multiplying?"],
        why: "Blue is 1, 2, 4, 8, 16 (times 2). Its graph bends upward. Adding the same amount gives a straight row of dots instead." },
      { type: "num", kicker: "Use it", prompt: "A video gets **5 views** on day 1, and its views **triple** every day. How many views on day 5?", answer: 405, skill: "Geometric sequences",
        near: [{ v: 1215, fb: "That's day 6. Day 1 is 5 itself, so you triple only 4 times." }, { v: 75, fb: "Tripling isn't adding 15 each day. Multiply by 3 each time." }],
        hints: ["5, 15, 45, …"], why: "5, 15, 45, 135, 405." }
    ]
  });

  /* ============================================ 4.16 · Arithmetic sequences */
  LESSONS.push({
    title: "Introducing arithmetic sequences",
    blurb: "Book 4.16 · Add the same number every time: the common difference. And a sequence is a function.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A theatre has 12 seats in row 1. Each row has **3 more** seats than the row in front. How many seats in row 5?", answer: 24, skill: "Arithmetic sequences",
        near: [{ v: 27, fb: "That's row 6. Row 1 has 12, so you add 3 only four times." }, { v: 60, fb: "The rows grow by adding 3, not by multiplying." }],
        hints: ["12, 15, 18, …"], why: "12, 15, 18, 21, 24." },
      { type: "learn", kicker: "Name it",
        prompt: "A sequence where each term is the previous term **plus the same number** is an **arithmetic sequence**. That number is the **common difference**.<br><br>The seats: 12, 15, 18, 21, 24. Common difference 3." },
      { type: "num", prompt: "What is the common difference of $20, 13, 6, -1$?", answer: -7, skill: "Common difference",
        near: [{ v: 7, fb: "The terms are going down, so the amount added is negative." }],
        hints: ["Subtract a term from the one after it: $13 - 20$."], why: "$13 - 20 = -7$. Adding $-7$ each time." },
      { type: "sort", kicker: "Vary it", prompt: "Arithmetic, geometric, or neither?",
        bins: ["Arithmetic", "Geometric", "Neither"],
        cards: [{ t: "4, 9, 14, 19", bin: 0, fb: "Add 5 each time." }, { t: "4, 12, 36, 108", bin: 1, fb: "Multiply by 3 each time." },
                { t: "10, 7, 4, 1", bin: 0, fb: "Add $-3$ each time." }, { t: "2, 3, 5, 8", bin: 2, fb: "Gaps 1, 2, 3 and changing ratios: neither." }, { t: "64, 32, 16, 8", bin: 1, fb: "Multiply by a half each time." }],
        skill: "Arithmetic sequences", hints: ["Equal differences: arithmetic. Equal ratios: geometric."], why: "Test differences, then ratios." },
      { type: "learn", kicker: "See it",
        prompt: "A sequence is a **function**. The input is the term's position, $n$. The output is the term, $f(n)$." +
          tbl(["$n$", "1", "2", "3", "4"], [["f(n)", 5, 9, 13, 17]]) + "Its graph is a row of separate dots, because there is no term number 1.5." },
      { type: "num", prompt: "For that sequence, $5, 9, 13, 17, \\ldots$, what is $f(3)$?", pre: "$f(3) =$", answer: 13, skill: "Arithmetic sequences",
        near: [{ v: 3, fb: "3 is the input: the position. $f(3)$ is the term in that position." }],
        hints: ["$f(3)$ is the 3rd term."], why: "The 3rd term is 13." },
      { type: "choice", kicker: "Use it", prompt: "What is the **domain** of a sequence, thought of as a function?",
        options: [{ t: "The positive whole numbers: 1, 2, 3, …" }, { t: "All real numbers", fb: "There is no 2.5th term. Positions are whole numbers." }, { t: "The terms of the sequence", fb: "The terms are the outputs: the range." }],
        answer: 0, skill: "Arithmetic sequences", hints: ["The inputs are positions: 1st, 2nd, 3rd, …"], why: "Inputs are positions, which are counted: 1, 2, 3, and so on." }
    ]
  });

  /* ============================================ 4.17 · Representing sequences */
  LESSONS.push({
    title: "Representing sequences",
    blurb: "Book 4.17 · A recursive definition: where to start, and how to get the next term from the last.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A sequence is defined like this:$$f(1) = 4, \\qquad f(n) = f(n - 1) + 5$$The second line says: each term is the previous term plus 5. What is $f(2)$?", pre: "$f(2) =$", answer: 9, skill: "Recursive definitions",
        near: [{ v: 10, fb: "$f(2)$ isn't $2 \\times 5$. It is the term before it, $f(1) = 4$, plus 5." }, { v: 6, fb: "Take the previous term, 4, and add 5." }],
        hints: ["$f(2) = f(1) + 5$."], why: "$f(2) = f(1) + 5 = 4 + 5 = 9$." },
      { type: "table", prompt: "Keep going.", head: ["$n$", "$f(n)$"], rows: [[1, 4], [2, 9], [3, null], [4, null], [5, null]], answers: [[2, 1, 14], [3, 1, 19], [4, 1, 24]], skill: "Recursive definitions",
        hints: ["Each term is the one above it plus 5."], why: "9, 14, 19, 24: add 5 each time." },
      { type: "learn", kicker: "Name it",
        prompt: "That is a **recursive definition**. It has two parts:<br><br>**1.** The first term: $f(1) = 4$.<br>**2.** A rule that builds each term from the one before: $f(n) = f(n - 1) + 5$.<br><br>$f(n - 1)$ simply means “the term just before $f(n)$”." },
      { type: "choice", prompt: "Which recursive definition gives $10, 7, 4, 1, \\ldots$?",
        options: [{ t: "$f(1) = 10$, $f(n) = f(n - 1) - 3$" }, { t: "$f(1) = 10$, $f(n) = f(n - 1) + 3$", fb: "That climbs: 10, 13, 16, …" }, { t: "$f(1) = 3$, $f(n) = f(n - 1) - 10$", fb: "The first term is 10, and the step is $-3$." }],
        answer: 0, skill: "Recursive definitions", hints: ["What is the first term? What happens at each step?"], why: "Start at 10, subtract 3 each time." },
      { type: "num", kicker: "Vary it", prompt: "Geometric sequences work the same way:$$g(1) = 3, \\qquad g(n) = 2 \\cdot g(n - 1)$$What is $g(4)$?", pre: "$g(4) =$", answer: 24, skill: "Recursive definitions",
        near: [{ v: 12, fb: "That's $g(3)$." }, { v: 8, fb: "Start from $g(1) = 3$ and double each time." }],
        hints: ["3, 6, …"], why: "3, 6, 12, 24." },
      { type: "slots", prompt: "Match each sequence to its rule. (Each starts from its first term.)",
        slots: [{ id: "a", label: "2, 6, 18, 54" }, { id: "b", label: "2, 6, 10, 14" }, { id: "c", label: "54, 18, 6, 2" }],
        cards: [{ t: "$f(n) = 3 \\cdot f(n - 1)$", slot: "a", fb: "Each term is 3 times the last." }, { t: "$f(n) = f(n - 1) + 4$", slot: "b", fb: "Each term is 4 more than the last." },
                { t: "$f(n) = \\frac{1}{3} \\cdot f(n - 1)$", slot: "c", fb: "Each term is a third of the last." }, { t: "$f(n) = f(n - 1) + 3$" }],
        skill: "Recursive definitions", hints: ["Is each sequence adding or multiplying, and by what?"], why: "Find the common difference or ratio, and that is the recursive rule." },
      { type: "choice", kicker: "Use it", prompt: "A dish has **100 bacteria**, and the number **doubles every hour**. Which definition gives the count $b(n)$ at the start of hour $n$?",
        options: [{ t: "$b(1) = 100$, $b(n) = 2 \\cdot b(n - 1)$" }, { t: "$b(1) = 100$, $b(n) = b(n - 1) + 2$", fb: "That adds 2 bacteria an hour. Doubling multiplies by 2." }, { t: "$b(1) = 2$, $b(n) = 100 \\cdot b(n - 1)$", fb: "The starting count is 100. The multiplier is 2." }],
        answer: 0, skill: "Recursive definitions", hints: ["Start value first. Then: add, or multiply?"], why: "Start at 100. Each hour, multiply the previous count by 2." }
    ]
  });

  /* ============================================ 4.18 · The nth term */
  LESSONS.push({
    title: "The nth term of a sequence",
    blurb: "Book 4.18 · A formula that jumps straight to any term, without listing the ones before.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "The sequence $5, 8, 11, 14, \\ldots$ adds 3 each time. What is the **50th** term? (Don't write out 50 terms.)", answer: 152, skill: "nth term",
        near: [{ v: 155, fb: "To reach the 50th term from the 1st you take 49 steps, not 50." }, { v: 150, fb: "$3 \\times 50$ forgets where the sequence starts. Begin at 5 and take 49 steps of 3." }],
        hints: ["How many steps of 3 does it take to get from term 1 to term 50?", "$5 + 49 \\times 3$."], why: "49 steps of 3 from the first term: $5 + 49(3) = 152$." },
      { type: "learn", kicker: "See it", prompt: "Look at how each term is built from the first.",
        scene: { type: "walk", rows: [
          { m: "f(1) = 5", say: "The first term: no steps yet." },
          { m: "f(2) = 5 + 3(1)", say: "One step of 3." },
          { m: "f(3) = 5 + 3(2)", say: "Two steps." },
          { m: "f(4) = 5 + 3(3)", say: "Three steps. The number of steps is always one less than the position." },
          { m: "f(n) = 5 + 3(n - 1)", say: "So the $n$th term takes $n - 1$ steps." }] },
        gate: true,
        then: "That is an **explicit formula**, also called an $n$th-term formula. For an arithmetic sequence with first term $f(1)$ and common difference $d$:$$f(n) = f(1) + d(n - 1)$$" },
      { type: "expr", prompt: "Write the $n$th term of $7, 11, 15, 19, \\ldots$", answer: "7+4(n-1)", shown: "7 + 4(n - 1)", skill: "nth term",
        near: [{ v: "7+4n", fb: "Check $n = 1$: that gives 11, but the first term is 7. Take $n - 1$ steps." }, { v: "4+7(n-1)", fb: "The first term is 7 and the step is 4." }],
        keys: [["$n$", "n"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]], placeholder: "Use n",
        hints: ["First term 7, common difference 4."], why: "$f(n) = 7 + 4(n - 1)$, which simplifies to $4n + 3$. Either form is right." },
      { type: "num", kicker: "Vary it", prompt: "Geometric sequences multiply instead. $2, 6, 18, \\ldots$ has ratio 3. What is the **6th** term?", answer: 486, skill: "nth term",
        near: [{ v: 1458, fb: "From the 1st term to the 6th is 5 multiplications, not 6." }, { v: 162, fb: "That's the 5th term." }],
        hints: ["Multiply by 3 five times: $2 \\times 3^5$."], why: "$2 \\times 3^5 = 2 \\times 243 = 486$." },
      { type: "choice", prompt: "So what is the $n$th term of $2, 6, 18, \\ldots$?",
        options: [{ t: "$f(n) = 2 \\cdot 3^{n - 1}$" }, { t: "$f(n) = 2 \\cdot 3^{n}$", fb: "Check $n = 1$: $2 \\cdot 3 = 6$, but the first term is 2." }, { t: "$f(n) = 2 + 3(n - 1)$", fb: "That adds 3 each time: 2, 5, 8. This sequence multiplies." }],
        answer: 0, skill: "nth term", hints: ["Start at 2, then multiply by 3 a total of $n - 1$ times."],
        why: "For a geometric sequence with first term $f(1)$ and common ratio $r$: $f(n) = f(1) \\cdot r^{\\,n - 1}$." },
      { type: "sort", kicker: "Name it", prompt: "Recursive or explicit?",
        bins: ["Recursive", "Explicit"],
        cards: [{ t: "$f(1) = 9$, $f(n) = f(n - 1) + 2$", bin: 0, fb: "It needs the previous term." }, { t: "$f(n) = 9 + 2(n - 1)$", bin: 1, fb: "It needs only $n$." },
                { t: "$g(n) = 5 \\cdot 2^{n - 1}$", bin: 1, fb: "Put in $n$ and you have the term." }, { t: "$g(1) = 5$, $g(n) = 2 \\cdot g(n - 1)$", bin: 0, fb: "Each term is built from the one before." }],
        skill: "nth term", hints: ["Does the rule mention $f(n - 1)$?"], why: "Recursive: from the previous term. Explicit: straight from the position $n$." },
      { type: "choice", kicker: "Use it", prompt: "You need the **100th** term of a sequence. Which kind of formula is quicker?",
        options: [{ t: "Explicit: substitute $n = 100$." }, { t: "Recursive: it's simpler to write.", fb: "A recursive rule would need all 99 terms before it." }, { t: "Neither can do it.", fb: "The explicit formula does it in one step." }],
        answer: 0, skill: "nth term", hints: ["Which one needs the terms before?"], why: "An explicit formula goes straight to any term. A recursive one must climb there step by step." }
    ]
  });

  /* ============================================ Project 4 */
  LESSONS.push({
    title: "Project: Using functions to model battery power",
    tag: "Project",
    blurb: "Book Project 4 · Model a phone's charge as a function of time, and use everything in the unit to read it.",
    mins: 9, v: 2,
    steps: [
      { type: "learn", kicker: "The brief",
        prompt: "A phone starts the day at **100%**. For the first 6 hours it loses 10% an hour. Then it is plugged in for 2 hours and gains 15% an hour. $B(t)$ is the charge, in percent, $t$ hours into the day." },
      { type: "num", prompt: "What is $B(6)$?", pre: "$B(6) =$", post: "%", answer: 40, skill: "Evaluate a function",
        near: [{ v: 60, fb: "That's how much it lost. Subtract it from 100." }], hints: ["$100 - 10 \\times 6$."], why: "$100 - 60 = 40$." },
      { type: "plane", prompt: "Draw the graph of $B$: drag $A$ to the charge at 6 hours and $C$ to the charge at 8 hours. (The vertical axis is in tens of percent.)",
        x: [0, 10], y: [0, 11], axisLabels: ["hours", "×10%"],
        points: [{ id: "A", x: 3, y: 3, drag: true, label: "A" }, { id: "C", x: 7, y: 2, drag: true, label: "C" }],
        segs: function (st) { var a = st.pt("A"), c = st.pt("C"); return [[0, 10, a.x, a.y, "green"], [a.x, a.y, c.x, c.y, "green"]]; },
        check: function (st) { var a = st.pt("A"), c = st.pt("C"); return a.x !== 6 || a.y !== 4 ? { ok: false, say: "At 6 hours the charge is 40%: the point $(6, 4)$." } : c.x === 8 && c.y === 7 ? { ok: true } : { ok: false, say: "Two hours of charging at 15% an hour adds 30%: from 40% to 70%." }; },
        answer: { points: { A: [6, 4], C: [8, 7] } }, skill: "Create a graph", hints: ["$B(6) = 40$ and $B(8) = 40 + 30$."], why: "Down to $(6, 4)$, then up to $(8, 7)$." },
      { type: "num", prompt: "What is the **average rate of change** of $B$ over the whole 8 hours, in percent per hour?", answer: -3.75, skill: "Average rate of change",
        near: [{ v: 3.75, fb: "The charge ends lower than it started, so the rate is negative." }, { v: -30, fb: "That's the total change. Divide by 8 hours." }],
        hints: ["$B(0) = 100$ and $B(8) = 70$."], why: "$\\frac{70 - 100}{8 - 0} = -3.75$ percent per hour." },
      { type: "explain", kicker: "Make it yours",
        prompt: "State the domain and range of $B$ for this day. Then describe your own phone's day: when does its graph fall, rise or stay flat?",
        placeholder: "e.g. Domain 0 ≤ t ≤ 8, range 40 ≤ B ≤ 100. My phone…",
        model: "Domain: 0 ≤ t ≤ 8 (the hours modelled). Range: 40 ≤ B ≤ 100 (the lowest and highest charge). A good description ties each piece of the graph to an event: “falls fast while I'm gaming, flat overnight in aeroplane mode, rises steeply on the charger.”" }
    ]
  });
  /* ================================================================ Skills */
  var FN = ["f", "g", "h", "k"];
  function seq(a, step, n, geo) { var out = [a]; for (var i = 1; i < n; i++) out.push(geo ? out[i - 1] * step : out[i - 1] + step); return out; }
  function list(arr) { return "$" + arr.join(", \\; ") + ", \\; \\ldots$"; }

  var SKILLS = [
    { id: "u4-isfn", title: "Is the table a function?", lesson: 2,
      gen: function (R) {
        var xs = R.distinct(4, 1, 9).sort(function (a, b) { return a - b; }), ys = xs.map(function () { return R.int(1, 12); }), kind = R.int(0, 2), why;
        if (kind === 0) { xs[2] = xs[1]; if (ys[2] === ys[1]) ys[2] += 2; why = "The input " + xs[1] + " has two different outputs, " + ys[1] + " and " + ys[2] + "."; }
        else if (kind === 1) { ys[3] = ys[0]; why = "Two inputs share the output " + ys[0] + ", which is allowed. No input has two outputs."; }
        else why = "Each input appears once, with one output.";
        var ok = kind !== 0;
        return mc(R, { prompt: "Is $y$ a function of $x$?" + tbl(["$x$", "$y$"], xs.map(function (x, i) { return [x, ys[i]]; })),
          right: ok ? "Yes" : "No", wrong: [{ t: ok ? "No" : "Yes", fb: why }], keep: true,
          hints: ["Look for an input that appears twice with different outputs."], why: why });
      } },
    { id: "u4-eval", title: "Evaluate a function", lesson: 3,
      gen: function (R) {
        var f = R.pick(FN), a = R.nz(-5, 6), b = R.int(-9, 9), k = R.int(-4, 6), sq = R.chance(0.35), body = sq ? poly([[1, "x^2"], [b, ""]]) : poly([[a, "x"], [b, ""]]), ans = sq ? k * k + b : a * k + b;
        return { type: "num", prompt: "For $" + f + "(x) = " + body + "$, find $" + f + "(" + k + ")$.", pre: "$" + f + "(" + k + ") =$", answer: ans,
          near: near(ans, sq ? [{ v: 2 * k + b, fb: "$x^2$ means $x$ times $x$, not $x$ times 2." }, { v: -k * k + b, fb: "A negative number squared is positive." }] : [{ v: a + k + b, fb: "$" + a + "x$ means " + a + " *times* $x$." }, { v: a * k, fb: "Don't forget the $" + signed(b) + "$." }]),
          hints: ["Replace every $x$ with $" + k + "$."], why: "$" + f + "(" + k + ") = " + L.sub(body, { x: k }) + " = " + ans + "$." };
      } },
    { id: "u4-notation", title: "Read function notation", lesson: 4,
      gen: function (R) {
        var S = R.pick([{ f: "h", i: "t", iw: "seconds", o: "the height of a ball, in metres", ov: "m high" }, { f: "C", i: "n", iw: "tickets", o: "the cost in dollars", ov: "dollars" },
                        { f: "T", i: "h", iw: "hours", o: "the temperature in °C", ov: "°C" }, { f: "P", i: "d", iw: "days", o: "the number of plants sold", ov: "plants" }]);
        var a = R.int(2, 9), b = R.int(10, 40);
        return mc(R, { prompt: "$" + S.f + "(" + S.i + ")$ is " + S.o + " for an input of $" + S.i + "$ " + S.iw + ". What does $" + S.f + "(" + a + ") = " + b + "$ mean?",
          right: "For " + a + " " + S.iw + ", the output is " + b + " " + S.ov + ".",
          wrong: [{ t: "For " + b + " " + S.iw + ", the output is " + a + " " + S.ov + ".", fb: "The input is the number inside the brackets: " + a + "." },
                  { t: "$" + S.f + "$ multiplied by " + a + " is " + b + ".", fb: "$" + S.f + "(" + a + ")$ means “$" + S.f + "$ of " + a + "”: the output for input " + a + "." }],
          hints: ["Inside the brackets is the input."], why: "$" + S.f + "(\\text{input}) = \\text{output}$: input " + a + " " + S.iw + ", output " + b + "." });
      } },
    { id: "u4-rule", title: "Write a rule from a table", lesson: 5,
      gen: function (R) {
        var f = R.pick(FN), m = R.nz(-4, 6), b = R.int(-6, 9), ans = clean(poly([[m, "x"], [b, ""]]));
        return { type: "expr", prompt: "Write a rule for $" + f + "(x)$." + tbl(["$x$", "$" + f + "(x)$"], [0, 1, 2, 3].map(function (x) { return [x, m * x + b]; })),
          answer: ans, shown: poly([[m, "x"], [b, ""]]), near: [{ v: clean(poly([[b, "x"], [m, ""]])), fb: "The output at $x = 0$ is what's added. The change per step is what multiplies $x$." }],
          keys: [["$x$", "x"], ["$+$", "+"], ["$-$", "-"]], placeholder: "Use x",
          hints: ["What is the output when $x = 0$?", "How much does the output change each time $x$ goes up by 1?"],
          why: "It starts at $" + b + "$ and changes by $" + m + "$ per step: $" + f + "(x) = " + poly([[m, "x"], [b, ""]]) + "$." };
      } },
    { id: "u4-solve", title: "Solve f(x) = c", lesson: 6,
      gen: function (R) {
        var f = R.pick(FN), a = R.nz(-5, 6), b = R.int(-9, 9), x0 = R.int(-5, 7), c = a * x0 + b, body = poly([[a, "x"], [b, ""]]);
        return { type: "num", prompt: "For $" + f + "(x) = " + body + "$, solve $" + f + "(x) = " + c + "$.", pre: "$x =$", answer: x0,
          near: near(x0, [{ v: a * c + b, fb: "That's $" + f + "(" + c + ")$. Here " + c + " is the *output*: find the input." }]),
          hints: ["Set $" + body + " = " + c + "$ and solve."], why: lines([body + " = " + c, poly([[a, "x"]]) + " = " + (c - b), "x = " + x0]) };
      } },
    { id: "u4-features", title: "Find a feature of a graph", lesson: 7,
      gen: function (R) {
        var px = R.int(2, 5), py = R.int(5, 8), y0 = R.int(1, py - 2), end = px + R.int(2, 4), f = pw([[0, y0], [px, py], [end, 0]]), ask = R.int(0, 2);
        var Q = [["the **maximum**", [px, py], "The highest point of the graph."], ["the **horizontal intercept**", [end, 0], "Where the graph meets the horizontal axis."], ["the **vertical intercept**", [0, y0], "Where the graph meets the vertical axis."]][ask];
        return { type: "pair", prompt: "Give the coordinates of " + Q[0] + " of this graph.", scene: graph([0, 10], [0, 9], [{ f: f, color: "blue" }]), answer: Q[1],
          hints: [Q[2]], why: Q[2] + " It is at $(" + Q[1][0] + ", " + Q[1][1] + ")$." };
      } },
    { id: "u4-slope", title: "Slope from two points", lesson: 8,
      gen: function (R) {
        var m = R.pick([-3, -2, -1, -0.5, 0.5, 1, 2, 3, 4]), x1 = R.int(-4, 3), run = R.pick([2, 4]), y1 = R.int(-5, 5), x2 = x1 + run, y2 = y1 + m * run;
        return { type: "num", prompt: "Find the slope of the line through $(" + x1 + ", " + y1 + ")$ and $(" + x2 + ", " + y2 + ")$.", answer: m,
          near: near(m, [{ v: -m, fb: "Check the sign: does $y$ go up or down as $x$ increases?" }, { v: 1 / m, tol: 1e-9, fb: "That's run over rise. Slope is rise over run." }]),
          hints: ["Rise: $" + y2 + " - " + L.sub("a", { a: y1 }) + "$. Run: $" + x2 + " - " + L.sub("a", { a: x1 }) + "$."],
          why: "$m = \\frac{" + (y2 - y1) + "}{" + run + "} = " + nm(m) + "$." };
      } },
    { id: "u4-aroc", title: "Average rate of change", lesson: 9,
      gen: function (R) {
        var a = R.int(0, 3), b = a + R.int(2, 4);
        if (R.chance(0.5)) {
          var c = R.int(0, 5), fa = a * a + c, fb = b * b + c;
          return { type: "num", prompt: "For $f(x) = " + poly([[1, "x^2"], [c, ""]]) + "$, find the average rate of change from $x = " + a + "$ to $x = " + b + "$.", answer: a + b,
            near: near(a + b, [{ v: fb - fa, fb: "That's the change in output. Divide by the change in input, " + (b - a) + "." }]),
            hints: ["$f(" + a + ") = " + fa + "$ and $f(" + b + ") = " + fb + "$."], why: "$\\frac{" + fb + " - " + fa + "}{" + b + " - " + a + "} = " + (a + b) + "$." };
        }
        var rate = R.pick([-6, -4, 3, 5, 8, 12]), va = R.int(20, 60), vb = va + rate * (b - a);
        return { type: "num", prompt: "A tank holds " + va + " litres at " + a + " minutes and " + vb + " litres at " + b + " minutes. What is the average rate of change, in litres per minute?", answer: rate,
          near: near(rate, [{ v: vb - va, fb: "That's the total change. Divide by the " + (b - a) + " minutes." }, { v: -rate, fb: "Is the amount going up or down?" }]),
          hints: ["Change in litres ÷ change in minutes."], why: "$\\frac{" + vb + " - " + va + "}{" + b + " - " + a + "} = " + rate + "$ litres per minute." };
      } },
    { id: "u4-shift", title: "Describe a transformation", lesson: 12,
      gen: function (R) {
        var k = R.int(2, 6), T = R.pick([
          ["f(x) + " + k, "up " + k], ["f(x) - " + k, "down " + k], ["f(x - " + k + ")", "right " + k], ["f(x + " + k + ")", "left " + k]]);
        var all = ["up " + k, "down " + k, "right " + k, "left " + k], inside = T[0].indexOf("(x ") > -1;
        return mc(R, { prompt: "How is the graph of $g(x) = " + T[0] + "$ related to the graph of $f$?", right: "It is shifted " + T[1] + ".",
          wrong: all.filter(function (t) { return t !== T[1]; }).map(function (t) { return { t: "It is shifted " + t + ".", fb: inside ? "The change is inside the brackets, so it's horizontal, and it goes the opposite way to the sign." : "The change is outside the brackets, so it's vertical, and it goes the way the sign says." }; }),
          keep: true, hints: ["Is the number added to the input (inside) or the output (outside)?"],
          why: inside ? "Inside the brackets: a horizontal shift, opposite to the sign. $" + T[0] + "$ moves " + T[1] + "." : "Outside the brackets: a vertical shift. $" + T[0] + "$ moves " + T[1] + "." });
      } },
    { id: "u4-domain", title: "Domain and range from a graph", lesson: 14,
      gen: function (R) {
        var x1 = R.int(-4, -1), x2 = R.int(3, 6), lo = R.int(-2, 1), hi = R.int(4, 7), mid = R.int(x1 + 1, x2 - 1), up = R.chance(0.5);
        var f = pw([[x1, up ? lo : hi], [mid, up ? hi : lo], [x2, up ? lo + 1 : hi - 1]]), dom = R.chance(0.5);
        var D = "$" + x1 + " \\le x \\le " + x2 + "$", Rg = "$" + lo + " \\le y \\le " + hi + "$";
        return mc(R, { prompt: "This is the whole graph of a function. What is its **" + (dom ? "domain" : "range") + "**?",
          scene: graph([-6, 8], [-4, 9], [{ f: f, color: "blue" }], { marks: [{ x: x1, y: f(x1), color: "blue" }, { x: x2, y: f(x2), color: "blue" }] }),
          right: dom ? D : Rg,
          wrong: [{ t: dom ? Rg.replace(/y/g, "x") : D.replace(/x/g, "y"), fb: dom ? "Those are the heights the graph reaches. The domain is read along the horizontal axis." : "Those are the inputs. The range is read along the vertical axis." },
                  { t: dom ? "$" + (x1 + 1) + " \\le x \\le " + (x2 + 1) + "$" : "$" + (lo + 1) + " \\le y \\le " + (hi + 1) + "$", fb: "Check the ends of the graph against the grid." }],
          hints: [dom ? "How far left and right does the graph go?" : "How low and how high does the graph go?"],
          why: dom ? "The graph runs from $x = " + x1 + "$ to $x = " + x2 + "$." : "The lowest point is at $y = " + lo + "$ and the highest at $y = " + hi + "$." });
      } },
    { id: "u4-seq-next", title: "Continue a sequence", lesson: 15,
      gen: function (R) {
        var geo = R.chance(0.45), a = geo ? R.int(1, 5) : R.int(-10, 20), s = geo ? R.pick([2, 3, 4]) : R.nz(-7, 9), t = seq(a, s, 5, geo);
        return { type: "num", prompt: "What is the next term? " + list(t.slice(0, 4)), answer: t[4],
          near: near(t[4], geo ? [{ v: t[3] + (t[3] - t[2]), fb: "The gaps aren't equal. Each term is the last one multiplied by something." }] : []),
          hints: [geo ? "Divide a term by the one before it." : "Subtract a term from the one after it."], why: (geo ? "Multiply by " + s : "Add $" + s + "$") + " each time: the next term is $" + t[4] + "$." };
      } },
    { id: "u4-ratio", title: "Common ratio and common difference", lesson: 16,
      gen: function (R) {
        var geo = R.chance(0.5), a, s, t;
        if (geo) { s = R.pick([2, 3, 5, 0.5]); a = s === 0.5 ? R.pick([48, 64, 80, 96]) : R.int(1, 6); t = seq(a, s, 4, true); }
        else { s = R.nz(-9, 9); a = R.int(-10, 25); t = seq(a, s, 4, false); }
        return { type: "num", prompt: "This sequence is " + (geo ? "geometric. What is its **common ratio**?" : "arithmetic. What is its **common difference**?") + " " + list(t), answer: s,
          near: near(s, geo ? [{ v: t[1] - t[0], fb: "That's a difference. A ratio is found by dividing: $" + t[1] + " \\div " + t[0] + "$." }, { v: 1 / s, tol: 1e-9, fb: "Divide a term by the one *before* it." }] : [{ v: -s, fb: "Subtract in the right order: a term minus the one before it." }]),
          hints: [geo ? "Divide any term by the term before it." : "Subtract any term from the one after it."],
          why: geo ? "$" + t[1] + " \\div " + t[0] + " = " + nm(s) + "$." : "$" + t[1] + " - " + L.sub("a", { a: t[0] }) + " = " + s + "$." };
      } },
    { id: "u4-classify", title: "Arithmetic, geometric or neither", lesson: 17,
      gen: function (R) {
        var kind = R.int(0, 2), t, why, names = ["Arithmetic", "Geometric", "Neither"];
        if (kind === 0) { var d = R.nz(-8, 9); t = seq(R.int(-5, 20), d, 4, false); why = "The same amount, $" + d + "$, is added each time."; }
        else if (kind === 1) { var r = R.pick([2, 3, 4]); t = seq(R.int(1, 5), r, 4, true); why = "Each term is " + r + " times the one before."; }
        else { var s = R.int(1, 5); t = R.pick([[s, s + 1, s + 3, s + 6], [1, 4, 9, 16], [s, s + 2, s + 6, s + 12], [2, 3, 5, 8]]); why = "The gaps change and so do the ratios."; }
        return mc(R, { prompt: "What kind of sequence is this? " + list(t), right: names[kind],
          wrong: names.filter(function (n, i) { return i !== kind; }).map(function (n) { return { t: n, fb: why }; }), keep: true,
          hints: ["Check the differences. Then check the ratios."], why: why });
      } },
    { id: "u4-recursive", title: "Use a recursive definition", lesson: 18,
      gen: function (R) {
        var geo = R.chance(0.4), a = geo ? R.int(1, 5) : R.int(-6, 15), s = geo ? R.pick([2, 3]) : R.nz(-6, 8), k = geo ? R.int(3, 5) : R.int(3, 6), t = seq(a, s, k, geo);
        var rule = geo ? "f(n) = " + s + " \\cdot f(n - 1)" : "f(n) = f(n - 1) " + signed(s);
        return { type: "num", prompt: "A sequence is defined by $f(1) = " + a + "$ and $" + rule + "$. Find $f(" + k + ")$.", pre: "$f(" + k + ") =$", answer: t[k - 1],
          near: near(t[k - 1], [{ v: geo ? t[k - 1] * s : t[k - 1] + s, fb: "That's one step too far: $f(1)$ is already the first term." }]),
          hints: ["Build the terms one at a time, starting from $f(1) = " + a + "$."], why: "The terms are " + list(t).replace(", \\; \\ldots", "") + ", so $f(" + k + ") = " + t[k - 1] + "$." };
      } },
    { id: "u4-nth", title: "Find a far-off term", lesson: 19,
      gen: function (R) {
        if (R.chance(0.6)) {
          var a = R.int(-8, 20), d = R.nz(-6, 9), n = R.pick([20, 25, 30, 40, 50, 100]), ans = a + d * (n - 1);
          return { type: "num", prompt: "An arithmetic sequence begins " + list(seq(a, d, 4, false)) + " What is term number " + n + "?", answer: ans,
            near: near(ans, [{ v: a + d * n, fb: "From term 1 to term " + n + " is " + (n - 1) + " steps, not " + n + "." }]),
            hints: ["$f(n) = f(1) + d(n - 1)$."], why: "$" + a + " + " + L.sub("d", { d: d }) + "(" + (n - 1) + ") = " + ans + "$." };
        }
        var a2 = R.int(1, 5), r = R.pick([2, 3]), n2 = R.int(6, 8), ans2 = a2 * Math.pow(r, n2 - 1);
        return { type: "num", prompt: "A geometric sequence begins " + list(seq(a2, r, 3, true)) + " What is term number " + n2 + "?", answer: ans2,
          near: [{ v: ans2 * r, fb: "From term 1 to term " + n2 + " is " + (n2 - 1) + " multiplications." }],
          hints: ["$f(n) = f(1) \\cdot r^{\\,n - 1}$."], why: "$" + a2 + " \\cdot " + r + "^{" + (n2 - 1) + "} = " + ans2 + "$." };
      } },
    { id: "u4-nth-formula", title: "Write the nth term", lesson: 19,
      gen: function (R) {
        var a = R.int(-6, 15), d = R.nz(-6, 9), shown = a + " " + signed(d) + "(n - 1)";
        return { type: "expr", prompt: "Write a formula for the $n$th term of " + list(seq(a, d, 4, false)), answer: a + "+(" + d + ")*(n-1)", shown: shown,
          near: [{ v: a + "+(" + d + ")*n", fb: "Check $n = 1$: the formula must give " + a + ". Use $n - 1$ steps." }],
          keys: [["$n$", "n"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]], placeholder: "Use n",
          hints: ["First term " + a + ", common difference $" + d + "$.", "$f(n) = f(1) + d(n - 1)$."], why: "$f(n) = " + shown + "$, which is $" + poly([[d, "n"], [a - d, ""]]) + "$." };
      } }
  ];
  L.unit("alg", 4, {
    title: "Functions",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 6, blurb: "What a function is, its notation, rules, and solving for an input.",
        skills: ["u4-isfn", "u4-eval", "u4-notation", "u4-rule", "u4-solve"], per: 2 },
      { title: "Quiz 2", after: 11, blurb: "Features of graphs, slope, and average rate of change.",
        skills: ["u4-features", "u4-slope", "u4-aroc"], per: 2 },
      { title: "Quiz 3", after: 14, blurb: "Shifting graphs, and domain and range.",
        skills: ["u4-shift", "u4-domain"], per: 3 },
      { title: "Quiz 4", after: 19, blurb: "Sequences: arithmetic and geometric, recursive and explicit.",
        skills: ["u4-seq-next", "u4-ratio", "u4-classify", "u4-recursive", "u4-nth", "u4-nth-formula"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg:4", {
    2: { name: "Function", frame: "A [[function]] assigns exactly [[one]] output to each input. The input is the [[independent]] variable; the output depends on it.",
         chips: ["relation", "two", "dependent"], fb: { "two": "Exactly one output for each input: that's what makes it predictable.", "dependent": "The output depends on the input, so the input is the independent one." } },
    3: { name: "Function notation", frame: "$f(5) = 13$ means: input [[5]], output [[13]]. It is read “$f$ [[of]] 5”.",
         chips: ["times", "f"], fb: { "times": "The brackets don't mean multiply: $f(5)$ is “$f$ of 5”." } },
    4: { name: "Reading statements", at: 3, frame: "A statement like $T(5) = 13$ pairs an [[input]] with its [[output]]. Comparing $T(2)$ with $T(8)$ compares two [[outputs]].",
         chips: ["inputs", "slopes"], fb: { "inputs": "$T(2)$ and $T(8)$ are outputs: two heights of the graph." } },
    5: { name: "Rules and tables", frame: "To evaluate a rule, [[substitute]] the input. In a linear table, the change per step is what [[multiplies]] $x$, and the output at $x = 0$ is what's [[added]].",
         chips: ["divides", "ignore"] },
    6: { name: "Evaluate or solve", frame: "[[Evaluating]] starts from an input and finds the output. [[Solving]] starts from an output and finds the input. A graph is a function if every [[vertical]] line meets it at most once.",
         chips: ["Graphing", "horizontal"], fb: { "horizontal": "Two inputs may share an output. The test uses vertical lines." } },
    7: { name: "Features of a graph", keep: true, frame: "The highest point is the [[maximum]]. Where the graph meets the vertical axis is the [[vertical intercept]]. Where it rises left to right, it is [[increasing]].",
         chips: ["minimum", "decreasing"] },
    8: { name: "Slope", frame: "Slope is [[rise]] over [[run]]: the change in [[$y$]] divided by the change in $x$. A vertical line's slope is [[undefined]].",
         chips: ["$x$", "zero"], fb: { "zero": "Zero is a horizontal line's slope. A vertical line has a run of 0, and you can't divide by 0." } },
    9: { name: "Average rate of change", frame: "The [[average rate of change]] from $a$ to $b$ is $\\frac{f(b) - f(a)}{b - a}$: the [[slope]] of the line joining two points of the graph.",
         chips: ["maximum", "area"] },
    10: { name: "Graphs tell stories", at: 2, frame: "On a distance–time graph, a steep piece means moving [[fast]], a flat piece means [[standing still]], and a falling piece means [[coming back]].",
          chips: ["slowly", "speeding up"] },
    11: { name: "Comparing graphs", frame: "Where two graphs [[cross]], the outputs are equal. Where one graph is [[higher]], its output is greater. The [[steeper]] graph changes faster.",
          chips: ["lower", "flatter"] },
    12: { name: "Transformations", at: 5, frame: "A change outside the brackets moves a graph [[vertically]], the way the sign says. A change inside the brackets moves it [[horizontally]], the [[opposite]] way.",
          chips: ["the same"], fb: { "the same": "Inside changes run backwards: $f(x - 4)$ moves right." } },
    13: { name: "Domain and range", frame: "The [[domain]] is every possible input. The [[range]] is every output those inputs produce.",
          chips: ["slope", "intercept"] },
    14: { name: "Domain and range from a graph", frame: "Read the domain along the [[horizontal]] axis and the range along the [[vertical]] axis. A [[filled]] end point is included; an open one is not.",
          chips: ["empty"] },
    15: { name: "Sequence", frame: "A [[sequence]] is a list of numbers in order, and each number is a [[term]]. Some add the same amount each time; others [[multiply]] by the same amount.",
          chips: ["set", "divide"] },
    16: { name: "Geometric sequence", frame: "In a [[geometric]] sequence, each term is the last one [[multiplied]] by the same number: the [[common ratio]].",
          chips: ["arithmetic", "added"] },
    17: { name: "Arithmetic sequence", frame: "In an [[arithmetic]] sequence, each term is the last one [[plus]] the same number: the [[common difference]].",
          chips: ["geometric", "times"] },
    18: { name: "Recursive definition", frame: "A [[recursive]] definition gives the [[first term]] and a rule that builds each term from the [[one before]].",
          chips: ["explicit", "last term"] },
    19: { name: "The nth term", frame: "The $n$th term of an arithmetic sequence is the first term plus [[$n - 1$]] steps of the common [[difference]]. An explicit formula goes straight to any [[term]].",
          chips: ["$n$", "ratio"], fb: { "$n$": "From term 1 to term $n$ there are $n - 1$ steps." } }
  });
})();
