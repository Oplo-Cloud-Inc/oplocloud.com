/* ==========================================================================
   Algebra I — Unit 8: Functions. See lab/core.js.

   Written the way Units 1–7 are. A function is met as a machine — a number
   in, one number out — and its notation, f(x), as a way of saying which
   number went in. Graphs are then read both ways: an input up to the curve
   and across to its output, and an output back to every input that gives
   it. Domain and range, recognising functions, maxima and minima, where a
   function is positive or rising, the average rate of change and inverses
   all come from the same graphs, drawn smooth through whole-number points
   so every value asked for can be read exactly.

   Ten lessons, following Khan Academy's topics for the unit. Twenty-two
   skills (Khan's list), five quizzes, the unit test at the end, and notes
   that put the unit on one page.
   Standards: HSF.IF.A.1, HSF.IF.A.2, HSF.IF.B.4, HSF.IF.B.5, HSF.IF.B.6,
   HSF.BF.B.4, 8.F.A.1.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, frac = L.frac;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function paren(v) { return v < 0 ? "(" + num(v) + ")" : num(v); }
  function nears(ans, list) { return list.filter(function (z) { return isFinite(z.v) && Math.abs(z.v - ans) > 1e-9; }); }
  function tbl(head, rows) { return { type: "table", head: head, rows: rows }; }

  /* A smooth curve through whole-number points (monotone cubic
     interpolation): it never overshoots, so its highest and lowest points,
     and where it crosses zero, are at the points it was drawn through. */
  function curve(xs, ys) {
    var n = xs.length, h = [], d = [], m = [];
    for (var i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else { var w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
    }
    // Ends: keep the first and last pieces from overshooting.
    if (n > 2) { if (m[0] * d[0] <= 0 || d[1] * d[0] <= 0) m[0] = d[0] * 0.5; if (d[n - 3] * d[n - 2] <= 0) m[n - 1] = d[n - 2] * 0.5; }
    return function (x) {
      if (x < xs[0] - 1e-9 || x > xs[n - 1] + 1e-9) return NaN;
      var k = 0; while (k < n - 2 && x > xs[k + 1]) k++;
      var t = (x - xs[k]) / h[k], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h[k] * m[k] + (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h[k] * m[k + 1];
    };
  }
  function graph(xs, ys, o) {
    o = o || {};
    var f = curve(xs, ys);
    var marks = (o.ends === false ? [] : [[xs[0], ys[0]], [xs[xs.length - 1], ys[ys.length - 1]]]).concat(o.marks || []);
    return { type: "plane", x: o.x || [-8, 8], y: o.y || [-8, 8], grid: o.grid, gridY: o.gridY, labelEvery: o.labelEvery, labelEveryY: o.labelEveryY, axisLabels: o.axisLabels,
      fns: [{ f: f, color: "blue", domain: [xs[0], xs[xs.length - 1]] }].concat(o.more || []),
      marks: marks.map(function (p) { return { x: p[0], y: p[1], label: p[2] != null ? p[2] : "", color: p[3] || "blue" }; }),
      hline: o.hline, vline: o.vline };
  }
  function at(xs, ys, x) { var i = xs.indexOf(x); return i < 0 ? NaN : ys[i]; }
  // Whole-number points x = −6…6 (every `step`) rising and falling in turn.
  function wavy(R, step) {
    step = step || 2;
    var xs = [], ys = [], y = R.int(-5, 5), up = R.chance(0.5);
    for (var x = -6; x <= 6; x += step) xs.push(x);
    var turns = 0;
    for (var i = 0; i < xs.length; i++) {
      ys.push(y);
      if (i > 0 && i < xs.length - 1 && R.chance(0.45)) { up = !up; turns++; }
      var dy = R.int(2, 4);
      y = up ? y + dy : y - dy;
      if (y > 7) { y = ys[i] - dy; up = false; } if (y < -7) { y = ys[i] + dy; up = true; }
    }
    // Make sure there is at least one turning point inside.
    if (!turns) { ys[3] = ys[2] + (ys[2] > 0 ? -3 : 3) * (up ? 1 : -1); }
    return { xs: xs, ys: ys };
  }
  // Turning points: indices of relative maxima and minima.
  function turning(ys) {
    var max = [], min = [];
    for (var i = 1; i < ys.length - 1; i++) {
      if (ys[i] > ys[i - 1] && ys[i] > ys[i + 1]) max.push(i);
      if (ys[i] < ys[i - 1] && ys[i] < ys[i + 1]) min.push(i);
    }
    return { max: max, min: min };
  }
  // A curve through zeros at chosen whole numbers: positive and negative in turn.
  function signs(R) {
    var z = R.shuffle([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]).slice(0, R.int(2, 3)).sort(function (a, b) { return a - b; });
    while (z.some(function (v, i) { return i && v - z[i - 1] < 2; })) z = R.shuffle([-5, -3, -1, 1, 3, 5]).slice(0, 2).sort(function (a, b) { return a - b; });
    var first = R.chance(0.5) ? 1 : -1, xs = [], ys = [];
    for (var x = -6; x <= 6; x++) {
      var k = z.filter(function (v) { return v < x; }).length, s = k % 2 ? -first : first;
      var dist = Math.min.apply(null, z.map(function (v) { return Math.abs(x - v); }));
      xs.push(x); ys.push(z.indexOf(x) >= 0 ? 0 : s * Math.min(6, dist * 2));
    }
    return { xs: xs, ys: ys, z: z, first: first };
  }
  function iv(a, b) { return a + " < x < " + b; }

  L.unit("alg", 8, {
    title: "Functions",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "A number in, one number out",
        blurb: "What a function is, function notation, and evaluating from a rule or a graph.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A **function** is a rule that takes a number in and gives exactly **one** number out. Put some numbers into this machine and watch.",
            scene: { type: "machine", rule: "2x + 1", name: "f", inputs: [1, 2, 3, 5, -2], need: 3 }, gate: true,
            then: "This machine doubles and adds 1. Its name is $f$, and we write $f(3) = 7$ — said “$f$ of 3 is 7” — to mean: put $3$ into $f$ and $7$ comes out. The rule itself is written $f(x) = 2x + 1$." },
          { type: "learn", kicker: "Evaluating",
            prompt: "To **evaluate** a function, put the input in place of $x$ everywhere in the rule.",
            scene: { type: "walk", rows: [
              { m: "f(x) = x^2 - 3x", say: "Find $f(-2)$." },
              { m: "f(-2) = (-2)^2 - 3(-2)", say: "Every $x$ becomes $(-2)$, in brackets." },
              { m: "= 4 + 6 = 10", say: "" }] },
            gate: true },
          { type: "num", prompt: "If $g(x) = 5 - 4x$, what is $g(3)$?", pre: "$g(3) =$", answer: -7, skill: "Evaluate functions",
            near: [{ v: 3, fb: "$4x$ with $x = 3$ is $12$: $5 - 12$." }, { v: 17, fb: "It's $5 - 12$, not $5 + 12$." }],
            hints: ["Replace $x$ with 3: $5 - 4(3)$."], why: "$g(3) = 5 - 12 = -7$." },
          { type: "num", prompt: "If $h(t) = 2t^2 + 1$, what is $h(-3)$?", pre: "$h(-3) =$", answer: 19, skill: "Evaluate functions",
            near: [{ v: 37, fb: "Square first: $(-3)^2 = 9$, then double: $18$." }, { v: -17, fb: "$(-3)^2$ is $+9$." }],
            hints: ["$(-3)^2 = 9$."], why: "$h(-3) = 2(9) + 1 = 19$." },
          { type: "learn", kicker: "From a graph",
            prompt: "A graph of a function pairs each input $x$ with its output $f(x)$: the point $(x, f(x))$. To find $f(2)$, go to $x = 2$, then up or down to the curve, and read its height.",
            scene: graph([-6, -4, -2, 0, 2, 4, 6], [-2, 3, 4, 1, -3, -1, 4], { marks: [[2, -3, "(2, −3)", "orange"]], vline: [2] }),
            after: "The curve is at height $-3$ above $x = 2$, so $f(2) = -3$." },
          { type: "num", prompt: "Here is the graph of $f$. What is $f(-4)$?", pre: "$f(-4) =$", answer: 3, skill: "Evaluate functions from their graph",
            scene: graph([-6, -4, -2, 0, 2, 4, 6], [-2, 3, 4, 1, -3, -1, 4]), hints: ["Find $x = -4$ on the horizontal axis, then go up to the curve."], why: "The curve is at $y = 3$ above $x = -4$." },
          { type: "learn", kicker: "Expressions",
            prompt: "Function values are numbers, so they can be added, multiplied and so on.",
            scene: { type: "walk", rows: [
              { m: "f(x) = 3x - 1, \\;\\; g(x) = x^2", say: "Find $2f(4) - g(3)$." },
              { m: "f(4) = 11, \\;\\; g(3) = 9", say: "Evaluate each first." },
              { m: "2(11) - 9 = 13", say: "Then do the arithmetic." }] },
            gate: true },
          { type: "num", prompt: "With $f(x) = 3x - 1$ and $g(x) = x^2$, what is $f(2) + g(-1)$?", answer: 6, skill: "Evaluate function expressions",
            near: [{ v: 4, fb: "$g(-1) = (-1)^2 = +1$." }], hints: ["$f(2) = 5$.", "$g(-1) = 1$."], why: "$5 + 1 = 6$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Working backwards",
        blurb: "Given the output, find the input — from a rule or from a graph.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "The other question",
            prompt: "“What is $f(4)$?” gives the input and asks for the output. The other question gives the output: for which $x$ is $f(x) = 11$? That's an equation to solve.",
            scene: { type: "walk", rows: [
              { m: "f(x) = 3x - 1 = 11", say: "Set the rule equal to the output." },
              { m: "3x = 12", say: "" },
              { m: "x = 4", say: "So $f(4) = 11$." }] },
            gate: true },
          { type: "num", prompt: "$f(x) = 2x + 7$. For what value of $x$ is $f(x) = -3$?", pre: "$x =$", answer: -5, skill: "Function inputs & outputs: equation",
            near: [{ v: 1, fb: "That's $f(-3)$. Here $-3$ is the **output**: solve $2x + 7 = -3$." }],
            hints: ["Solve $2x + 7 = -3$."], why: lines(["2x + 7 = -3", "2x = -10", "x = -5"]) },
          { type: "learn", kicker: "From a graph",
            prompt: "On a graph, go **across** from the output on the $y$-axis to the curve, then down to the $x$-axis. A horizontal line can meet the curve more than once — then several inputs give that same output.",
            scene: graph([-6, -4, -2, 0, 2, 4, 6], [-3, 1, 3, 1, -2, 1, 4], { hline: [1], marks: [[-4, 1, "", "orange"], [0, 1, "", "orange"], [4, 1, "", "orange"]] }),
            after: "The line $y = 1$ meets the curve at $x = -4$, $0$ and $4$. All three inputs give $f(x) = 1$." },
          { type: "numbers", prompt: "For which values of $x$ is $f(x) = 1$? Give every one, separated by commas.", answer: [-4, 0, 4], skill: "Function inputs & outputs: graph",
            scene: graph([-6, -4, -2, 0, 2, 4, 6], [-3, 1, 3, 1, -2, 1, 4]),
            hints: ["Go across from $1$ on the $y$-axis: where does that height meet the curve?"], why: "At $x = -4$, $0$ and $4$ the curve has height 1." },
          { type: "numbers", prompt: "Same graph. For which values of $x$ is $f(x) = 3$?", answer: [-2, 5], skill: "Function inputs & outputs: graph",
            scene: graph([-6, -4, -2, 0, 2, 4, 5, 6], [-3, 1, 3, 1, -2, 1, 3, 4]),
            hints: ["Go across from $3$: the curve reaches that height twice."], why: "$f(-2) = 3$ and $f(5) = 3$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Functions in equations and stories",
        blurb: "Turning an equation into a function, and reading function notation in context.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "Equations and functions",
            prompt: "An equation like $3x + y = 7$ links $x$ and $y$. When each $x$ gives exactly one $y$, the equation defines a function — to write it, solve for $y$.",
            scene: { type: "walk", rows: [
              { m: "3x + y = 7", say: "" },
              { m: "y = 7 - 3x", say: "Solve for $y$." },
              { m: "f(x) = 7 - 3x", say: "Name the rule." }] },
            gate: true },
          { type: "expr", prompt: "Write $4x - 2y = 6$ as a function of $x$.", pre: "$f(x) =$", answer: "2x - 3", skill: "Function rules from equations",
            near: [{ v: "-2x + 3", fb: "Dividing $-2y = -4x + 6$ by $-2$ flips every sign: $y = 2x - 3$." }],
            hints: ["$-2y = -4x + 6$.", "Divide by $-2$."], why: lines(["-2y = -4x + 6", "y = 2x - 3"]) },
          { type: "learn", kicker: "In a story",
            prompt: "In a real situation, function notation packs a whole sentence into a few symbols. If $V(t)$ is a car's value in dollars $t$ years after it was bought, then $V(3) = 12\\,000$ says: **3 years after it was bought, the car was worth \\$12 000.**" },
          { type: "choice", prompt: "$T(h)$ is the temperature, in °C, $h$ hours after midnight. What does $T(6) = 4$ mean?", skill: "Function notation word problems",
            options: [{ t: "At 6 a.m. the temperature was 4 °C" }, { t: "At 4 a.m. the temperature was 6 °C", fb: "The number in brackets is the input — hours. The 4 is the output, the temperature." },
                      { t: "The temperature rose 4 °C in 6 hours", fb: "$T(6)$ is a single reading, not a change." }],
            answer: 0, why: "Input 6 hours after midnight; output 4 °C." },
          { type: "choice", prompt: "$C(n)$ is the cost, in dollars, of $n$ concert tickets. Which says “5 tickets cost \\$120”?", skill: "Function notation word problems",
            options: [{ t: "$C(5) = 120$" }, { t: "$C(120) = 5$", fb: "The input, $n$, is the number of tickets: $C(5)$." }, { t: "$5C = 120$", fb: "$C$ is a function, not a number to multiply." }],
            answer: 0, why: "The input is 5 tickets; the output is \\$120." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Domain and range",
        blurb: "Every input a function accepts, and every output it gives.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "New words",
            prompt: "The **domain** of a function is the set of inputs it accepts. The **range** is the set of outputs it actually gives. On a graph, the domain is how far the curve reaches left and right; the range is how far it reaches down and up.",
            scene: graph([-5, -3, -1, 1, 3, 5], [2, 5, 1, -2, 0, 3]),
            after: "This curve runs from $x = -5$ to $x = 5$ (the dots show it stops there), so its domain is $-5 \\le x \\le 5$. Its lowest point is at height $-2$ and its highest at $5$, so its range is $-2 \\le y \\le 5$." },
          { type: "learn", kicker: "Writing them",
            prompt: "A stretch of numbers can be written as an inequality or in **interval notation**: square brackets include the end, round ones don't, and $\\infty$ always gets a round bracket.",
            scene: { type: "walk", rows: [
              { m: "-5 \\le x \\le 5 \\;\\;\\leftrightarrow\\;\\; [-5, 5]", say: "Both ends included." },
              { m: "0 < x \\le 3 \\;\\;\\leftrightarrow\\;\\; (0, 3]", say: "0 left out, 3 included." },
              { m: "x \\ge 2 \\;\\;\\leftrightarrow\\;\\; [2, \\infty)", say: "It goes on forever." }] },
            gate: true },
          { type: "ineq", prompt: "What is the domain of this function? Write it as an inequality in $x$.", answer: "-4 <= x <= 6", skill: "Domain and range from graph",
            scene: graph([-4, -2, 0, 2, 4, 6], [-1, 3, 4, 2, -3, 1]), keys: [["$x$", "x"], ["$\\le$", "<="], ["$<$", "<"], ["$-$", "-"]], placeholder: "… <= x <= …",
            near: [{ v: "-3 <= x <= 4", fb: "Those are the lowest and highest $y$ values — the range. The domain is read left to right." }],
            hints: ["How far left does the curve go? How far right?"], why: "The curve runs from $x = -4$ to $x = 6$." },
          { type: "ineq", prompt: "And its range? Write it as an inequality in $y$.", answer: "-3 <= y <= 4", variable: "y", skill: "Domain and range from graph",
            scene: graph([-4, -2, 0, 2, 4, 6], [-1, 3, 4, 2, -3, 1]), keys: [["$y$", "y"], ["$\\le$", "<="], ["$<$", "<"], ["$-$", "-"]], placeholder: "… <= y <= …",
            near: [{ v: "-1 <= y <= 1", fb: "Those are the heights at the ends. The range runs from the curve's lowest point to its highest." }],
            hints: ["The lowest point of the curve, and the highest."], why: "Lowest $-3$ (at $x = 4$), highest $4$ (at $x = 0$)." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Which inputs are allowed?",
        blurb: "Values a rule can't take, and domains that come from the situation.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Two things you can't do",
            prompt: "Most rules accept any number. Two things can stop an input: you can't **divide by zero**, and (in this course) you can't take the **square root of a negative number**.",
            scene: { type: "walk", rows: [
              { m: "f(x) = \\frac{5}{x - 3}", say: "The bottom is zero when $x = 3$. Domain: every number except 3, $x \\ne 3$." },
              { m: "g(x) = \\sqrt{x + 2}", say: "Inside the root must be at least 0: $x + 2 \\ge 0$, so $x \\ge -2$." },
              { m: "h(x) = x^2 - 4x", say: "Nothing to stop it: the domain is all real numbers." }] },
            gate: true },
          { type: "choice", prompt: "Which value is **not** in the domain of $f(x) = \\frac{7}{x + 4}$?", skill: "Identifying values in the domain",
            options: [{ t: "$-4$" }, { t: "$4$", fb: "At $x = 4$ the bottom is $8$ — fine. It's zero when $x = -4$." }, { t: "$0$", fb: "At $x = 0$ it's $\\frac{7}{4}$ — fine. A zero on **top** or an input of 0 is allowed." }],
            answer: 0, why: "$-4 + 4 = 0$ on the bottom." },
          { type: "choice", prompt: "What is the domain of $g(x) = \\sqrt{6 - x}$?", skill: "Determine the domain of functions",
            options: [{ t: "$x \\le 6$" }, { t: "$x \\ge 6$", fb: "Try $x = 10$: $\\sqrt{-4}$ isn't allowed. Solve $6 - x \\ge 0$." }, { t: "All real numbers", fb: "Inputs above 6 make the inside negative." }],
            answer: 0, hints: ["The inside must be at least 0: $6 - x \\ge 0$."], why: "$6 - x \\ge 0$ gives $x \\le 6$." },
          { type: "learn", kicker: "From the situation",
            prompt: "In a story, the situation limits the inputs too. If $A(n)$ is the money raised by selling $n$ raffle tickets from a book of 200, then $n$ must be a whole number from $0$ to $200$ — not $-3$, and not $12.5$." },
          { type: "choice", prompt: "A ball is thrown up and lands after $4$ seconds. $h(t)$ is its height $t$ seconds after it's thrown. What is a sensible domain?", skill: "Function domain word problems",
            options: [{ t: "$0 \\le t \\le 4$" }, { t: "All real numbers", fb: "Negative times are before the throw, and after 4 seconds it has landed." },
                      { t: "$t = 0, 1, 2, 3, 4$ only", fb: "Time runs continuously — $2.5$ seconds is a moment too." }],
            answer: 0, why: "The model describes the flight, from the throw ($t = 0$) to landing ($t = 4$), including every moment between." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Is it a function?",
        blurb: "One output for each input — tested on graphs, tables and descriptions.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "The test",
            prompt: "A relationship is a function only if every input has **one** output. On a graph, an input with two outputs would be two points straight above each other — so run a **vertical line** across: if it ever hits the graph twice, it isn't a function.",
            scene: { type: "plane", x: [-6, 6], y: [-6, 6],
              fns: [{ f: function (x) { return Math.sqrt(x + 4); }, color: "blue", domain: [-4, 6] }, { f: function (x) { return -Math.sqrt(x + 4); }, color: "blue", domain: [-4, 6] }],
              params: { a: { v: -5, min: -5, max: 5, step: 0.5, label: "line $x =$" } },
              readout: function (st) { var a = st.params.a; return a < -4 ? "The vertical line misses the graph." : a === -4 ? "It touches the graph at one point." : "It meets the graph **twice**: at $x = " + num(a) + "$ there are two outputs, $" + num(Math.round(Math.sqrt(a + 4) * 100) / 100) + "$ and $" + num(-Math.round(Math.sqrt(a + 4) * 100) / 100) + "$."; },
              // The sweeping vertical line, drawn as a row of dots, and where it meets the curve.
              marks: Array.apply(null, Array(49)).map(function (_, k) { return { x: function (P) { return P.a; }, y: -6 + k * 0.25, r: 1.6, color: "orange" }; })
                .concat([{ x: function (P) { return P.a; }, y: function (P) { return P.a >= -4 ? Math.sqrt(P.a + 4) : NaN; }, r: 6, color: "orange" },
                         { x: function (P) { return P.a; }, y: function (P) { return P.a >= -4 ? -Math.sqrt(P.a + 4) : NaN; }, r: 6, color: "orange" }]) },
            gate: true,
            then: "This sideways curve fails the test: most inputs have two outputs. So it isn't the graph of a function." },
          { type: "choice", prompt: "Is this the graph of a function?", skill: "Recognize functions from graphs",
            scene: graph([-6, -3, 0, 3, 6], [4, -2, 1, -3, 5], { ends: false }),
            options: [{ t: "Yes" }, { t: "No", fb: "Try a vertical line anywhere: it crosses this curve only once." }], answer: 0, why: "Every vertical line meets it once." },
          { type: "choice", prompt: "Is a vertical line, like $x = 3$, the graph of a function?", skill: "Recognize functions from graphs",
            options: [{ t: "No" }, { t: "Yes", fb: "The input 3 would have infinitely many outputs." }], answer: 0, why: "The one input $x = 3$ goes with every $y$." },
          { type: "learn", kicker: "Tables",
            prompt: "In a table, look for the same input listed twice with **different** outputs. The same **output** twice is fine — two inputs can share an output (like $f(-2) = f(2) = 4$ for $f(x) = x^2$)." },
          { type: "choice", prompt: "Does this table describe $y$ as a function of $x$?", skill: "Recognize functions from tables",
            scene: tbl(["$x$", "$y$"], [[1, 4], [2, 7], [1, 9], [3, 7]]),
            options: [{ t: "No — $x = 1$ has two outputs" }, { t: "Yes", fb: "$x = 1$ appears twice, with $y = 4$ and $y = 9$." }, { t: "No — $y = 7$ appears twice", fb: "Repeated outputs are fine. The problem is a repeated **input** with different outputs." }],
            answer: 0, why: "The input 1 gives both 4 and 9." },
          { type: "choice", prompt: "Is “each student's height” a function of the student?", skill: "Recognize functions from tables",
            options: [{ t: "Yes — each student has one height" }, { t: "No — two students can have the same height", fb: "Sharing an output is allowed. What matters is that each student has only one height." }],
            answer: 0, why: "One input (a student), one output (their height)." }
        ]
      },
      /* ============================================================== 7 */
      {
        title: "Highest and lowest points",
        blurb: "Relative and absolute maxima and minima.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "New words",
            prompt: "A **relative maximum** is a peak: a point higher than every point near it. A **relative minimum** is a valley. The **absolute maximum** is the highest point of the whole graph, and the **absolute minimum** the lowest.",
            scene: graph([-6, -4, -2, 0, 2, 4, 6], [-4, 3, 0, 5, -1, 2, -6], { marks: [[-4, 3, "rel. max", "orange"], [0, 5, "abs. max", "orange"], [-2, 0, "rel. min", "purple"], [2, -1, "rel. min", "purple"], [4, 2, "rel. max", "orange"]] }),
            after: "Peaks at $x = -4$, $0$ and $4$ are relative maxima; $(0, 5)$ is the highest of all, the absolute maximum. The lowest point of the whole graph is the end at $(6, -6)$ — the absolute minimum, though it isn't a valley." },
          { type: "choice", prompt: "Which point is a relative minimum of this graph?", skill: "Relative maxima and minima",
            scene: graph([-6, -3, 0, 3, 6], [2, -3, 4, -1, 5], { marks: [[-3, -3, "A"], [0, 4, "B"], [3, -1, "C"], [6, 5, "D"]] }),
            options: [{ t: "C" }, { t: "B", fb: "B is a peak — a relative maximum." }, { t: "D", fb: "D is an end point, not a valley." }], answer: 0,
            why: "C is lower than the points either side of it. (So is A.)" },
          { type: "num", prompt: "What is the absolute maximum **value** of this function?", answer: 5, skill: "Absolute maxima and minima",
            scene: graph([-6, -3, 0, 3, 6], [2, -3, 4, -1, 5]), near: [{ v: 4, fb: "That's the highest peak, but the right-hand end goes higher." }],
            hints: ["Look for the highest point anywhere on the graph, ends included."], why: "The highest point is $(6, 5)$, so the maximum value is 5." }
        ]
      },
      /* ============================================================== 8 */
      {
        title: "Up, down, above, below",
        blurb: "Where a function increases or decreases, where it's positive or negative, and reading graphs of stories.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Increasing and decreasing",
            prompt: "Reading left to right, a function is **increasing** where its graph goes up and **decreasing** where it goes down. It changes between the two at its peaks and valleys.",
            scene: graph([-6, -3, 1, 4, 6], [-4, 3, -2, 5, 1]),
            after: "It increases from $x = -6$ to $-3$, decreases from $-3$ to $1$, increases from $1$ to $4$, and decreases from $4$ to $6$." },
          { type: "choice", prompt: "On which interval is this function decreasing?", skill: "Increasing and decreasing intervals",
            scene: graph([-6, -3, 1, 4, 6], [-4, 3, -2, 5, 1]),
            options: [{ t: "$" + iv(-3, 1) + "$" }, { t: "$" + iv(1, 4) + "$", fb: "From 1 to 4 the graph climbs." }, { t: "$" + iv(-6, -3) + "$", fb: "From $-6$ to $-3$ it climbs." }],
            answer: 0, why: "From the peak at $x = -3$ down to the valley at $x = 1$." },
          { type: "learn", kicker: "Positive and negative",
            prompt: "A function is **positive** where its graph is above the $x$-axis ($f(x) > 0$) and **negative** where it's below. It switches at the $x$-intercepts, its **zeros**.",
            scene: graph([-6, -4, -2, 0, 2, 4, 6], [4, 2, 0, -3, 0, 3, 5]),
            after: "Zeros at $x = -2$ and $x = 2$. Positive for $x < -2$ and $x > 2$; negative for $-2 < x < 2$." },
          { type: "choice", prompt: "Where is this function negative?", skill: "Positive and negative intervals",
            scene: graph([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], [-4, -2, 0, 2, 3, 2, 0, -2, -3, -2, 0, 2, 4]),
            options: [{ t: "$x < -4$ and $0 < x < 4$" }, { t: "$-4 < x < 0$ and $x > 4$", fb: "Those are where it's above the axis — positive." }, { t: "$0 < x < 4$ only", fb: "It's also below the axis on the far left." }],
            answer: 0, why: "Below the axis before $x = -4$, and between $0$ and $4$." },
          { type: "learn", kicker: "Stories",
            prompt: "The same features describe real graphs. This one shows the temperature over a day: it dips before dawn, rises through the morning to a peak in the afternoon, then falls through the evening.",
            scene: graph([0, 4, 8, 12, 15, 20, 24], [2, 1, 6, 12, 14, 8, 4], { x: [-1, 25], y: [-2, 16], labelEvery: 4, labelEveryY: 2, axisLabels: ["hours after midnight", "°C"] }),
            after: "The absolute maximum, $(15, 14)$, is the warmest moment: 14 °C at 3 p.m. The temperature is increasing from about 4 a.m. to 3 p.m., and decreasing after." },
          { type: "choice", prompt: "Using the temperature graph: during which stretch was it getting colder?", skill: "Graph interpretation word problems",
            scene: graph([0, 4, 8, 12, 15, 20, 24], [2, 1, 6, 12, 14, 8, 4], { x: [-1, 25], y: [-2, 16], labelEvery: 4, labelEveryY: 2, axisLabels: ["hours after midnight", "°C"] }),
            options: [{ t: "From 3 p.m. to midnight" }, { t: "From 8 a.m. to noon", fb: "Then the graph climbs — it was getting warmer." }, { t: "All day", fb: "It climbs for most of the morning." }],
            answer: 0, why: "The graph falls from hour 15 to hour 24." }
        ]
      },
      /* ============================================================== 9 */
      {
        title: "Average rate of change",
        blurb: "How fast a function changes over an interval: the slope between two points.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "The idea",
            prompt: "A curve's steepness keeps changing, but over an interval you can still ask how much it changed **on average**: the change in output divided by the change in input — the slope of the straight line joining the two points.",
            scene: { type: "walk", rows: [
              { m: "\\frac{f(b) - f(a)}{b - a}", say: "The average rate of change of $f$ from $x = a$ to $x = b$." },
              { m: "f(x) = x^2, \\; 1 \\le x \\le 4", say: "For example." },
              { m: "\\frac{16 - 1}{4 - 1} = 5", say: "On average, $f$ rises 5 for each 1 across." }] },
            gate: true },
          { type: "num", prompt: "What is the average rate of change of $f$ from $x = -4$ to $x = 2$?", answer: -1, skill: "Average rate of change: graphs & tables",
            scene: graph([-6, -4, -2, 0, 2, 4, 6], [-2, 3, 4, 1, -3, -1, 4], { marks: [[-4, 3, "", "orange"], [2, -3, "", "orange"]], more: [{ f: function (x) { return -x - 1; }, color: "orange", dashed: true, domain: [-4, 2] }] }),
            near: [{ v: 1, fb: "The output goes **down** from 3 to $-3$: the change is negative." }, { v: -6, fb: "That's the change in output. Divide by the change in input, 6." }],
            hints: ["$f(-4) = 3$ and $f(2) = -3$.", "$\\frac{-3 - 3}{2 - (-4)}$."], why: "$\\frac{-3 - 3}{2 - (-4)} = \\frac{-6}{6} = -1$." },
          { type: "num", prompt: "The table shows a function. What is its average rate of change from $x = 1$ to $x = 5$?", answer: 4.5, skill: "Average rate of change: graphs & tables",
            scene: tbl(["$x$", "$g(x)$"], [[1, 2], [3, 5], [5, 20], [7, 44]]), hints: ["$\\frac{g(5) - g(1)}{5 - 1}$."], why: "$\\frac{20 - 2}{4} = 4.5$." },
          { type: "num", prompt: "A car's odometer read $12\\,340$ km at 9 a.m. and $12\\,610$ km at noon. What was its average speed, in km per hour?", answer: 90, skill: "Average rate of change word problems",
            near: [{ v: 270, fb: "That's the distance. It took 3 hours." }], hints: ["Change in distance over change in time."], why: "$\\frac{12\\,610 - 12\\,340}{3} = \\frac{270}{3} = 90$ km/h." }
        ]
      },
      /* ============================================================== 10 */
      {
        title: "Inverse functions",
        blurb: "The function that undoes another: outputs back to inputs.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Undoing",
            prompt: "If $f$ takes $x$ to $y$, its **inverse**, written $f^{-1}$, takes $y$ back to $x$. So $f(3) = 7$ means $f^{-1}(7) = 3$ — the inverse swaps inputs and outputs.",
            scene: tbl(["$x$", "$f(x)$"], [[1, 3], [2, 5], [3, 7], [4, 9]]),
            after: "From this table: $f^{-1}(5) = 2$, because $f(2) = 5$." },
          { type: "num", prompt: "Using the table above ($f(1) = 3$, $f(2) = 5$, $f(3) = 7$, $f(4) = 9$), what is $f^{-1}(9)$?", answer: 4, skill: "Evaluate inverse functions",
            near: [{ v: 19, fb: "That's $f(9)$ worked out from the pattern. $f^{-1}(9)$ asks which input gave 9." }], hints: ["Which $x$ has $f(x) = 9$?"], why: "$f(4) = 9$, so $f^{-1}(9) = 4$." },
          { type: "learn", kicker: "Finding the rule",
            prompt: "To find the inverse of a rule, write $y = f(x)$, swap $x$ and $y$, and solve for $y$.",
            scene: { type: "walk", rows: [
              { m: "f(x) = 3x - 5", say: "" },
              { m: "x = 3y - 5", say: "Swap $x$ and $y$." },
              { m: "x + 5 = 3y", say: "" },
              { m: "f^{-1}(x) = \\frac{x + 5}{3}", say: "Check: $f(4) = 7$ and $f^{-1}(7) = \\frac{12}{3} = 4$ ✓." }] },
            gate: true },
          { type: "expr", prompt: "Find the inverse of $g(x) = 2x + 8$.", pre: "$g^{-1}(x) =$", answer: "(x - 8)/2", skill: "Find inverses of linear functions",
            near: [{ v: "x/2 - 8", fb: "Take 8 away **before** halving: $\\frac{x - 8}{2}$." }, { v: "(x + 8)/2", fb: "Undo $+8$ by taking 8 away." }],
            hints: ["Swap: $x = 2y + 8$.", "Take 8 from both sides, then divide by 2."], why: "$x = 2y + 8 \\Rightarrow y = \\frac{x - 8}{2}$." },
          { type: "learn", kicker: "On a graph",
            prompt: "Swapping $x$ and $y$ reflects a graph in the line $y = x$, so a function and its inverse are mirror images across that diagonal.",
            scene: { type: "plane", x: [-8, 8], y: [-8, 8], fns: [{ f: function (x) { return 2 * x + 1; }, color: "blue", label: "f" }, { f: function (x) { return (x - 1) / 2; }, color: "orange", label: "f⁻¹" }, { f: function (x) { return x; }, color: "ink", dashed: true }],
              marks: [{ x: 1, y: 3, label: "(1, 3)" }, { x: 3, y: 1, label: "(3, 1)" }] } }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Evaluating functions from rules and graphs, and finding inputs from outputs.", skills: ["a8-eval", "a8-eval-graph", "a8-eval-expr", "a8-in-eq", "a8-in-graph"], per: 2 },
      { title: "Quiz 2", after: 4, blurb: "Functions from equations, notation in context, and domain and range from graphs.", skills: ["a8-rule", "a8-notation", "a8-dr-graph"], per: 2 },
      { title: "Quiz 3", after: 6, blurb: "Allowed inputs, domains, and recognising functions.", skills: ["a8-in-domain", "a8-domain", "a8-domain-words", "a8-rec-graph", "a8-rec-table"], per: 2 },
      { title: "Quiz 4", after: 8, blurb: "Maxima and minima, intervals, and graphs of stories.", skills: ["a8-rel", "a8-abs", "a8-pos", "a8-inc", "a8-interp"], per: 2 },
      { title: "Quiz 5", after: 10, blurb: "Average rate of change and inverse functions.", skills: ["a8-arc", "a8-arc-words", "a8-inv-eval", "a8-inv"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Functions and function notation",
        say: ["A **function** is a rule that gives exactly one output for each input. $f(x) = 2x + 1$ names the function $f$ and gives its rule; $f(3)$ means the output when the input is 3.",
              "To **evaluate**, put the input in place of every $x$ — in brackets — and work it out. From a graph, go to the input on the $x$-axis, up or down to the curve, and read its height."],
        eg: { q: "Find $f(-2)$ for $f(x) = x^2 - 3x$.", rows: [["(-2)^2 - 3(-2)", "Replace every $x$."], ["4 + 6 = 10", ""]] },
        watch: "$f(3)$ is not $f \\times 3$. It's the output for input 3." },
      { t: "Finding an input from an output",
        say: ["“For which $x$ is $f(x) = 11$?” is an equation: set the rule equal to 11 and solve.",
              "On a graph, go across from 11 on the $y$-axis to every point where the curve has that height, then down to the $x$-axis. Several inputs can share one output."] },
      { t: "Functions from equations, and notation in stories",
        say: ["An equation defines $y$ as a function of $x$ when each $x$ gives one $y$. Solve for $y$ to get the rule: $3x + y = 7$ gives $f(x) = 7 - 3x$.",
              "In context, the input and output carry units: if $V(t)$ is a car's value $t$ years after purchase, $V(3) = 12\\,000$ means it was worth \\$12 000 after 3 years."] },
      { t: "Domain and range",
        say: ["The **domain** is every input the function accepts; the **range** is every output it gives. On a graph, the domain is its extent left to right, the range its extent bottom to top.",
              "An expression's domain excludes inputs that divide by zero or take the square root of a negative. A story's domain is limited by what makes sense — no negative times, no half tickets."],
        keys: [["$\\frac{5}{x - 3}$", "$x \\ne 3$"], ["$\\sqrt{x + 2}$", "$x \\ge -2$"], ["$[a, b]$", "$a \\le x \\le b$ — square brackets include the end"], ["$(a, b]$", "$a < x \\le b$"], ["$[a, \\infty)$", "$x \\ge a$"]] },
      { t: "Recognising a function",
        say: ["Each input must have **one** output. On a graph: the **vertical line test** — if any vertical line meets the graph twice, it isn't a function. In a table: the same input with different outputs means it isn't.",
              "Two inputs sharing an output is fine."],
        watch: "A repeated **output** doesn't stop something being a function; a repeated **input** with different outputs does." },
      { t: "Maxima and minima",
        keys: [["Relative maximum", "a peak: higher than the points around it"], ["Relative minimum", "a valley: lower than the points around it"], ["Absolute maximum / minimum", "the highest / lowest point of the whole graph — can be at an end"]],
        say: ["The **value** of a maximum or minimum is its $y$-coordinate; where it happens is its $x$-coordinate."] },
      { t: "Increasing, decreasing, positive, negative",
        say: ["Read left to right. A function is **increasing** where the graph rises and **decreasing** where it falls; the switches are at peaks and valleys.",
              "It's **positive** where the graph is above the $x$-axis and **negative** below; the switches are at the zeros ($x$-intercepts).",
              "Intervals are written with the $x$-values, like $-3 < x < 1$."],
        watch: "Intervals are about $x$ — where along the axis — not about the $y$ values." },
      { t: "Average rate of change",
        say: ["The average rate of change from $x = a$ to $x = b$ is $\\frac{f(b) - f(a)}{b - a}$: the slope of the straight line joining those two points of the graph. In a story it's an average speed, or an average change per unit."],
        eg: { q: "Find the average rate of change of $f(x) = x^2$ from $x = 1$ to $x = 4$.", rows: [["\\frac{f(4) - f(1)}{4 - 1} = \\frac{16 - 1}{3}", ""], ["= 5", ""]] } },
      { t: "Inverse functions",
        say: ["The inverse $f^{-1}$ undoes $f$: if $f(a) = b$ then $f^{-1}(b) = a$. Its graph is the reflection of $f$'s in the line $y = x$.",
              "To find it: write $y = f(x)$, swap $x$ and $y$, and solve for $y$."],
        eg: { q: "Find the inverse of $f(x) = 3x - 5$.", rows: [["x = 3y - 5", "Swap."], ["y = \\frac{x + 5}{3}", "Solve for $y$."]] },
        watch: "$f^{-1}(x)$ is not $\\frac{1}{f(x)}$. The $-1$ means “inverse”, not a power." }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a8-eval", title: "Evaluate functions", lesson: 1,
        gen: function (R) {
          var n = R.pick(["f", "g", "h"]), x = R.nz(-5, 5), T = R.int(0, 2), rule, val;
          if (T === 0) { var a = R.nz(-6, 6), b = R.int(-9, 9); rule = poly([[a, "x"], [b, ""]]); val = a * x + b; }
          else if (T === 1) { var p = R.pick([1, 2, -1, 3]), q = R.int(-5, 5), r = R.int(-6, 6); rule = poly([[p, "x^2"], [q, "x"], [r, ""]]); val = p * x * x + q * x + r; }
          else { var c = R.int(2, 12), k = R.nz(-4, 4); rule = poly([[c, ""], [-k, "x"]]); val = c - k * x; }
          return { type: "num", prompt: "If $" + n + "(x) = " + rule + "$, what is $" + n + "(" + x + ")$?", pre: "$" + n + "(" + x + ") =$", answer: val,
            hints: ["Replace every $x$ with $(" + x + ")$."], why: "$" + n + "(" + x + ") = " + L.sub(rule, { x: x }) + " = " + val + "$." };
        } },
      { id: "a8-eval-graph", title: "Evaluate functions from their graph", lesson: 1,
        gen: function (R) {
          var w = wavy(R), i = R.int(0, w.xs.length - 1), x = w.xs[i];
          return { type: "num", prompt: "Here is the graph of $f$. What is $f(" + x + ")$?", pre: "$f(" + x + ") =$", answer: w.ys[i], scene: graph(w.xs, w.ys),
            near: nears(w.ys[i], [{ v: x, fb: "That's the input. Read the height of the curve above it." }]),
            hints: ["Find $x = " + x + "$ on the horizontal axis, then go up or down to the curve."], why: "The curve is at height $" + w.ys[i] + "$ above $x = " + x + "$." };
        } },
      { id: "a8-eval-expr", title: "Evaluate function expressions", lesson: 1,
        gen: function (R) {
          var a = R.nz(-4, 4), b = R.int(-6, 6), c = R.pick([1, -1, 2]), d = R.int(-5, 5);
          var f = function (x) { return a * x + b; }, g = function (x) { return c * x * x + d; };
          var p = R.int(-3, 4), q = R.int(-3, 3), k = R.pick([2, 3, -2]), T = R.int(0, 2), expr, val;
          if (T === 0) { expr = "f(" + p + ") + g(" + q + ")"; val = f(p) + g(q); }
          else if (T === 1) { expr = k + "f(" + p + ") - g(" + q + ")"; val = k * f(p) - g(q); }
          else { expr = "f(" + p + ") \\cdot g(" + q + ")"; val = f(p) * g(q); }
          return { type: "num", prompt: "With $f(x) = " + poly([[a, "x"], [b, ""]]) + "$ and $g(x) = " + poly([[c, "x^2"], [d, ""]]) + "$, what is $" + expr + "$?", answer: val,
            hints: ["$f(" + p + ") = " + f(p) + "$ and $g(" + q + ") = " + g(q) + "$.", "Now do the arithmetic."], why: "$f(" + p + ") = " + f(p) + "$, $g(" + q + ") = " + g(q) + "$, so $" + expr + " = " + val + "$." };
        } },
      { id: "a8-in-eq", title: "Function inputs & outputs: equation", lesson: 2,
        gen: function (R) {
          var a = R.nz(-6, 6), b = R.int(-9, 9), x = R.int(-7, 7), out = a * x + b, n = R.pick(["f", "g", "h"]);
          return { type: "num", prompt: "$" + n + "(x) = " + poly([[a, "x"], [b, ""]]) + "$. For what value of $x$ is $" + n + "(x) = " + out + "$?", pre: "$x =$", answer: x,
            near: nears(x, [{ v: a * out + b, fb: "That's $" + n + "(" + out + ")$. Here " + out + " is the **output**: solve $" + poly([[a, "x"], [b, ""]]) + " = " + out + "$." }]),
            hints: ["Solve $" + poly([[a, "x"], [b, ""]]) + " = " + out + "$."], why: lines([poly([[a, "x"], [b, ""]]) + " = " + out, poly([[a, "x"]]) + " = " + (out - b), "x = " + x]) };
        } },
      { id: "a8-in-graph", title: "Function inputs & outputs: graph", lesson: 2,
        gen: function (R) {
          var w = wavy(R, 1), vals = {};
          w.ys.forEach(function (y, i) { (vals[y] = vals[y] || []).push(w.xs[i]); });
          // An output reached only at grid points (between points the curve moves strictly).
          var cands = Object.keys(vals).map(Number).filter(function (y) {
            for (var i = 0; i < w.ys.length - 1; i++) { var lo = Math.min(w.ys[i], w.ys[i + 1]), hi = Math.max(w.ys[i], w.ys[i + 1]); if (y > lo && y < hi) return false; }
            return true;
          });
          var multi = cands.filter(function (v) { return vals[v].length > 1; });
          var y = multi.length && R.chance(0.7) ? R.pick(multi) : cands.length ? R.pick(cands) : w.ys[0];
          var xs = w.xs.filter(function (x, i) { return w.ys[i] === y; });
          return { type: "numbers", prompt: "For which values of $x$ is $f(x) = " + y + "$? Give every one, separated by commas.", answer: xs, scene: graph(w.xs, w.ys, { hline: [y] }),
            hints: ["Go across from $" + y + "$ on the $y$-axis to every point where the curve has that height."], why: "The curve has height " + y + " at $x = " + xs.join(", ") + "$." };
        } },
      { id: "a8-rule", title: "Function rules from equations", lesson: 3,
        gen: function (R) {
          var A = R.nz(-6, 6), B = R.pick([1, -1, 2, -2, 3]), m = R.nz(-4, 4), b = R.int(-6, 6);
          // B y = −A x + C with the answer y = m x + b: choose A = −B m, C = B b
          A = -B * m; var C = B * b;
          var tex = poly([[A, "x"], [B, "y"]]) + " = " + C;
          return { type: "expr", prompt: "Write $" + tex + "$ as a function of $x$.", pre: "$f(x) =$", answer: poly([[m, "x"], [b, ""]]).replace(/\s/g, ""), shown: poly([[m, "x"], [b, ""]]),
            near: B < 0 ? [{ v: poly([[-m, "x"], [-b, ""]]).replace(/\s/g, ""), fb: "Dividing by $" + B + "$ changes every sign." }] : [],
            hints: ["Get $y$ alone: move the $x$ term across, then divide by " + B + "."], why: "$y = " + poly([[m, "x"], [b, ""]]) + "$, so $f(x) = " + poly([[m, "x"], [b, ""]]) + "$." };
        } },
      { id: "a8-notation", title: "Function notation word problems", lesson: 3,
        gen: function (R) {
          var T = R.pick([
            function () { var a = R.int(2, 10), v = R.int(8, 30) * 500; return { f: "V(t)", def: "$V(t)$ is the value of a car, in dollars, $t$ years after it was bought.", eq: "V(" + a + ") = " + v, right: a + " years after it was bought, the car was worth \\$" + v + ".", swap: v + " years after it was bought, the car was worth \\$" + a + ".", rate: "The car loses \\$" + v + " every " + a + " years." }; },
            function () { var a = R.int(1, 23), v = R.int(-5, 30); return { f: "T(h)", def: "$T(h)$ is the temperature, in °C, $h$ hours after midnight.", eq: "T(" + a + ") = " + v, right: a + " hours after midnight the temperature was " + v + " °C.", swap: v + " hours after midnight the temperature was " + a + " °C.", rate: "The temperature rises " + v + " °C every " + a + " hours." }; },
            function () { var a = R.int(2, 12), v = a * R.pick([15, 18, 25]); return { f: "C(n)", def: "$C(n)$ is the cost, in dollars, of $n$ tickets.", eq: "C(" + a + ") = " + v, right: a + " tickets cost \\$" + v + ".", swap: v + " tickets cost \\$" + a + ".", rate: "Each ticket costs \\$" + v + "." }; },
            function () { var a = R.int(1, 8), v = R.int(10, 60); return { f: "h(t)", def: "$h(t)$ is the height, in metres, of a hot-air balloon $t$ minutes after take-off.", eq: "h(" + a + ") = " + v, right: a + " minutes after take-off the balloon was " + v + " m up.", swap: v + " minutes after take-off the balloon was " + a + " m up.", rate: "The balloon climbs " + v + " m every minute." }; }])();
          return mc(R, { prompt: T.def + " What does $" + T.eq + "$ mean?", right: T.right,
            wrong: [{ t: T.swap, fb: "The number in brackets is the input; the number after the $=$ is the output." }, { t: T.rate, fb: "$" + T.eq.split(" =")[0] + "$ is one reading, not a rate of change." }],
            hints: ["In $" + T.f + "$, the letter in brackets is the input. What does it measure?"], why: T.right });
        } },
      { id: "a8-dr-graph", title: "Domain and range from graph", lesson: 4,
        gen: function (R) {
          var a = R.int(-7, -2), b = a + R.int(5, 11), xs = [], ys = [];
          if (b > 7) b = 7;
          for (var x = a; x <= b; x++) xs.push(x);
          var w = wavy(R, 1);
          ys = xs.map(function (x, i) { return w.ys[Math.min(i, w.ys.length - 1)]; });
          var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), dom = R.chance(0.5);
          if (lo === hi) { ys[1] += 2; hi = Math.max.apply(null, ys); }
          if (dom) return { type: "ineq", prompt: "What is the domain of the function graphed? Write it as an inequality in $x$.", answer: a + " <= x <= " + b, scene: graph(xs, ys),
            keys: [["$x$", "x"], ["$\\le$", "<="], ["$<$", "<"], ["$-$", "-"]], placeholder: "… <= x <= …",
            near: [{ v: lo + " <= x <= " + hi, fb: "Those are the lowest and highest heights — the range. The domain is read left to right." }].filter(function () { return lo !== a || hi !== b; }),
            hints: ["How far left does the graph go, and how far right?"], why: "It runs from $x = " + a + "$ to $x = " + b + "$: $" + a + " \\le x \\le " + b + "$." };
          return { type: "ineq", prompt: "What is the range of the function graphed? Write it as an inequality in $y$.", answer: lo + " <= y <= " + hi, variable: "y", scene: graph(xs, ys),
            keys: [["$y$", "y"], ["$\\le$", "<="], ["$<$", "<"], ["$-$", "-"]], placeholder: "… <= y <= …",
            near: [{ v: a + " <= y <= " + b, fb: "Those are the left and right ends — the domain. The range is read bottom to top." }].filter(function () { return lo !== a || hi !== b; }),
            hints: ["The lowest point of the graph, and the highest."], why: "Lowest $" + lo + "$, highest $" + hi + "$: $" + lo + " \\le y \\le " + hi + "$." };
        } },
      { id: "a8-in-domain", title: "Identifying values in the domain", lesson: 5,
        gen: function (R) {
          var c = R.nz(-6, 6), top = R.int(1, 9), sq = R.chance(0.4);
          if (sq) {
            var k = R.int(-5, 5), tex = "\\sqrt{x " + (k < 0 ? "- " + -k : "+ " + k) + "}", bad = -k - R.int(1, 4), good = [-k, -k + R.int(1, 5)];
            return mc(R, { prompt: "Which value is **not** in the domain of $f(x) = " + tex + "$?", right: "$" + bad + "$",
              wrong: good.map(function (g) { return { t: "$" + g + "$", fb: "At $x = " + g + "$ the inside is $" + (g + k) + "$, which isn't negative — fine." }; }),
              hints: ["The inside of the square root can't be negative."], why: "At $x = " + bad + "$ the inside is $" + (bad + k) + "$: negative." });
          }
          var texf = "\\frac{" + top + "}{x " + (c < 0 ? "+ " + -c : "- " + c) + "}";
          return mc(R, { prompt: "Which value is **not** in the domain of $f(x) = " + texf + "$?", right: "$" + c + "$",
            wrong: [{ t: "$" + -c + "$", fb: "At $x = " + -c + "$ the bottom is $" + (-2 * c) + "$ — fine." }, { t: "$0$", fb: "At $x = 0$ the bottom is $" + -c + "$ — fine." }, { t: "$" + top + "$", fb: "The top can be anything. Look for where the bottom is zero." }].filter(function (w) { return w.t !== "$" + c + "$"; }),
            hints: ["You can't divide by zero. When is the bottom 0?"], why: "At $x = " + c + "$ the bottom is $0$." });
        } },
      { id: "a8-domain", title: "Determine the domain of functions", lesson: 5,
        gen: function (R) {
          var k = R.nz(-6, 6), T = R.int(0, 2);
          if (T === 0) { var tex = "\\frac{3}{x " + (k < 0 ? "+ " + -k : "- " + k) + "}";
            return mc(R, { prompt: "What is the domain of $f(x) = " + tex + "$?", right: "All real numbers except $" + k + "$",
              wrong: [{ t: "All real numbers except $" + -k + "$", fb: "The bottom is zero when $x = " + k + "$." }, { t: "$x > " + k + "$", fb: "Numbers below " + k + " are fine too; only $x = " + k + "$ divides by zero." }, { t: "All real numbers", fb: "At $x = " + k + "$ the bottom is zero." }],
              hints: ["Where is the bottom zero?"], why: "Only $x = " + k + "$ makes the bottom zero." }); }
          var up = T === 1, tex2 = up ? "\\sqrt{x " + (k < 0 ? "+ " + -k : "- " + k) + "}" : "\\sqrt{" + k + " - x}";
          var edge = k, right = up ? "$x \\ge " + edge + "$" : "$x \\le " + edge + "$";
          return mc(R, { prompt: "What is the domain of $g(x) = " + tex2 + "$?", right: right,
            wrong: [{ t: up ? "$x \\le " + edge + "$" : "$x \\ge " + edge + "$", fb: "Try a number on that side: the inside of the root comes out negative." },
                    { t: up ? "$x \\ge " + -edge + "$" : "$x \\le " + -edge + "$", fb: "Solve the inside $\\ge 0$ carefully — watch the sign." },
                    { t: "All real numbers", fb: "Some inputs make the inside negative." }].filter(function (w) { return w.t !== right; }),
            hints: ["The inside must be at least 0: solve $" + (up ? "x " + (k < 0 ? "+ " + -k : "- " + k) : k + " - x") + " \\ge 0$."], why: "Solving gives " + right + "." });
        } },
      { id: "a8-domain-words", title: "Function domain word problems", lesson: 5,
        gen: function (R) {
          var T = R.pick([
            function () { var t = R.int(3, 8); return { p: "A ball is thrown up and lands after $" + t + "$ seconds. $h(t)$ is its height $t$ seconds after it's thrown. What is a sensible domain?", r: "$0 \\le t \\le " + t + "$", w: [["All real numbers", "Negative times are before the throw, and after " + t + " s it has landed."], ["$t = 0, 1, 2, \\ldots, " + t + "$ only", "Time runs continuously — the in-between moments count too."]] }; },
            function () { var n = R.pick([50, 100, 200]); return { p: "A club sells raffle tickets from a book of $" + n + "$. $M(n)$ is the money raised by selling $n$ tickets. What is a sensible domain?", r: "The whole numbers from $0$ to $" + n + "$", w: [["$0 \\le n \\le " + n + "$, including fractions", "You can't sell half a ticket."], ["All whole numbers", "The book only has " + n + " tickets, and you can't sell a negative number."]] }; },
            function () { var L0 = R.pick([20, 30, 40]); return { p: "A pool holding $" + L0 + "$ kL is drained at a steady rate and is empty after 5 hours. $W(t)$ is the water left after $t$ hours. What is a sensible domain?", r: "$0 \\le t \\le 5$", w: [["$0 \\le t \\le " + L0 + "$", L0 + " is the amount of water, not the time."], ["$t \\ge 0$", "After 5 hours there's no water left to describe."]] }; },
            function () { var s = R.pick([24, 30, 32]); return { p: "A class of $" + s + "$ students orders pizza. $P(k)$ is the number of pizzas needed if $k$ students want some. What is a sensible domain?", r: "The whole numbers from $0$ to $" + s + "$", w: [["$0 \\le k \\le " + s + "$, including fractions", "A number of students is a whole number."], ["All real numbers", "There can't be negative students, or more than " + s + "."]] }; }])();
          return mc(R, { prompt: T.p, right: T.r, wrong: T.w.map(function (x) { return { t: x[0], fb: x[1] }; }),
            hints: ["Which inputs make sense in the situation? Can they be negative? Fractions? Is there a largest?"], why: T.r + " — the inputs that make sense here." });
        } },
      { id: "a8-rec-graph", title: "Recognize functions from graphs", lesson: 6,
        gen: function (R) {
          var T = R.int(0, 4), spec, yes;
          if (T === 0) { var w = wavy(R); spec = graph(w.xs, w.ys); yes = true; }
          else if (T === 1) { var r = R.int(3, 6); spec = { type: "plane", x: [-8, 8], y: [-8, 8], fns: [{ f: function (x) { return Math.sqrt(r * r - x * x); }, domain: [-r, r] }, { f: function (x) { return -Math.sqrt(r * r - x * x); }, domain: [-r, r] }] }; yes = false; }
          else if (T === 2) { var s = R.int(-3, 3); spec = { type: "plane", x: [-8, 8], y: [-8, 8], fns: [{ f: function (x) { return Math.sqrt(2 * (x - s)); }, domain: [s, 8] }, { f: function (x) { return -Math.sqrt(2 * (x - s)); }, domain: [s, 8] }] }; yes = false; }
          else if (T === 3) { var a = R.nz(-6, 6); spec = { type: "plane", x: [-8, 8], y: [-8, 8], vline: [a] }; yes = false; }
          else { var p = R.int(-3, 3), q = R.int(-5, 2); spec = { type: "plane", x: [-8, 8], y: [-8, 8], fns: [{ f: function (x) { return 0.5 * (x - p) * (x - p) + q; } }] }; yes = true; }
          return mc(R, { prompt: "Is this the graph of a function?", scene: spec, right: yes ? "Yes" : "No",
            wrong: [{ t: yes ? "No" : "Yes", fb: yes ? "Every vertical line meets it at most once." : "Some vertical line meets it more than once: an input with two or more outputs." }], keep: true,
            hints: ["Imagine a vertical line sweeping across. Does it ever meet the graph twice?"], why: yes ? "It passes the vertical line test." : "It fails the vertical line test." });
        } },
      { id: "a8-rec-table", title: "Recognize functions from tables", lesson: 6,
        gen: function (R) {
          var xs = R.distinct(4, -6, 9), ys = xs.map(function () { return R.int(-9, 9); }), yes = R.chance(0.5);
          if (!yes) { var i = R.int(1, 3); xs[i] = xs[0]; while (ys[i] === ys[0]) ys[i] = R.int(-9, 9); }
          else if (R.chance(0.5)) ys[2] = ys[0];              // a repeated output: still a function
          var rows = xs.map(function (x, k) { return [x, ys[k]]; });
          return mc(R, { prompt: "Does this table describe $y$ as a function of $x$?", scene: tbl(["$x$", "$y$"], rows), right: yes ? "Yes" : "No",
            wrong: [{ t: yes ? "No" : "Yes", fb: yes ? "No input appears twice with different outputs. (A repeated output is fine.)" : "The input " + xs[0] + " appears with two different outputs." }], keep: true,
            hints: ["Look for an input listed twice with different outputs."], why: yes ? "Every input has one output." : "$x = " + xs[0] + "$ has two outputs." });
        } },
      { id: "a8-rel", title: "Relative maxima and minima", lesson: 7,
        gen: function (R) {
          var w = wavy(R), t = turning(w.ys), wantMax = t.max.length && (!t.min.length || R.chance(0.5));
          var list = wantMax ? t.max : t.min, other = wantMax ? t.min : t.max;
          if (!list.length) { wantMax = !wantMax; list = wantMax ? t.max : t.min; other = wantMax ? t.min : t.max; }
          var i = R.pick(list), cand = [i].concat(other.slice(0, 1)).concat([0, w.xs.length - 1].filter(function (k) { return list.indexOf(k) < 0; }).slice(0, 2));
          var names = ["A", "B", "C", "D"], order = R.shuffle(cand.slice(0, 4)), lab = {};
          order.forEach(function (k, j) { lab[k] = names[j]; });
          return mc(R, { prompt: "Which point is a relative " + (wantMax ? "maximum" : "minimum") + " of this function?",
            scene: graph(w.xs, w.ys, { marks: order.map(function (k) { return [w.xs[k], w.ys[k], lab[k]]; }) }),
            right: lab[i], wrong: order.filter(function (k) { return k !== i; }).map(function (k) {
              return { t: lab[k], fb: k === 0 || k === w.xs.length - 1 ? "Point " + lab[k] + " is an end of the graph, not a " + (wantMax ? "peak" : "valley") + "." : "Point " + lab[k] + " is a " + (wantMax ? "valley" : "peak") + "." }; }),
            hints: ["A relative " + (wantMax ? "maximum is a peak: higher" : "minimum is a valley: lower") + " than the points on both sides of it."],
            why: "Point " + lab[i] + " $" + pt(w.xs[i], w.ys[i]) + "$ is " + (wantMax ? "higher" : "lower") + " than the points around it." });
        } },
      { id: "a8-abs", title: "Absolute maxima and minima", lesson: 7,
        gen: function (R) {
          var w = wavy(R), hi = Math.max.apply(null, w.ys), lo = Math.min.apply(null, w.ys), max = R.chance(0.5);
          var v = max ? hi : lo, t = turning(w.ys), rel = (max ? t.max : t.min).map(function (i) { return w.ys[i]; }).filter(function (y) { return y !== v; });
          return { type: "num", prompt: "What is the absolute " + (max ? "maximum" : "minimum") + " **value** of this function?", answer: v, scene: graph(w.xs, w.ys),
            near: nears(v, rel.map(function (y) { return { v: y, fb: "That's a relative " + (max ? "maximum" : "minimum") + ", but another point is " + (max ? "higher" : "lower") + "." }; }).concat([{ v: w.xs[w.ys.indexOf(v)], fb: "That's where it happens ($x$). The **value** is the height." }])),
            hints: ["Look for the " + (max ? "highest" : "lowest") + " point of the whole graph, ends included.", "The value is its $y$-coordinate."],
            why: "The " + (max ? "highest" : "lowest") + " point is $" + pt(w.xs[w.ys.indexOf(v)], v) + "$, so the value is $" + v + "$." };
        } },
      { id: "a8-pos", title: "Positive and negative intervals", lesson: 8,
        gen: function (R) {
          var s = signs(R), z = s.z, pos = R.chance(0.5);
          // Intervals between −6, the zeros, and 6, with their signs.
          var ends = [-6].concat(z).concat([6]), parts = [];
          for (var i = 0; i < ends.length - 1; i++) parts.push({ a: ends[i], b: ends[i + 1], s: i % 2 ? -s.first : s.first });
          function desc(list) { return list.map(function (p) { return "$" + p.a + " < x < " + p.b + "$"; }).join(" and "); }
          var want = parts.filter(function (p) { return p.s === (pos ? 1 : -1); }), not = parts.filter(function (p) { return p.s !== (pos ? 1 : -1); });
          return mc(R, { prompt: "On the part of the graph shown, where is this function " + (pos ? "positive" : "negative") + "?", scene: graph(s.xs, s.ys),
            right: desc(want), wrong: [{ t: desc(not), fb: "Those are where it's " + (pos ? "below" : "above") + " the $x$-axis — " + (pos ? "negative" : "positive") + "." },
              want.length > 1 ? { t: desc(want.slice(0, 1)) + " only", fb: "Check every stretch between the zeros — there's another." }
                              : { t: desc(want.concat(not.slice(0, 1)).sort(function (p, q) { return p.a - q.a; })), fb: "One of those stretches is " + (pos ? "below" : "above") + " the axis." }].filter(function (w) { return w.t !== desc(want); }),
            hints: ["Find the zeros — where the graph crosses the $x$-axis.", pos ? "Positive means above the axis." : "Negative means below the axis."],
            why: "The zeros are at $x = " + z.join(", ") + "$; the graph is " + (pos ? "above" : "below") + " the axis on " + desc(want) + "." });
        } },
      { id: "a8-inc", title: "Increasing and decreasing intervals", lesson: 8,
        gen: function (R) {
          var w = wavy(R), t = turning(w.ys), cuts = [0].concat(t.max).concat(t.min).sort(function (a, b) { return a - b; }).concat([w.xs.length - 1]);
          var parts = [];
          for (var i = 0; i < cuts.length - 1; i++) parts.push({ a: w.xs[cuts[i]], b: w.xs[cuts[i + 1]], up: w.ys[cuts[i + 1]] > w.ys[cuts[i]] });
          var inc = R.chance(0.5), good = parts.filter(function (p) { return p.up === inc; }), bad = parts.filter(function (p) { return p.up !== inc; });
          if (!good.length) { inc = !inc; good = parts.filter(function (p) { return p.up === inc; }); bad = parts.filter(function (p) { return p.up !== inc; }); }
          var g = R.pick(good);
          return mc(R, { prompt: "On which interval is this function " + (inc ? "increasing" : "decreasing") + "?", scene: graph(w.xs, w.ys), right: "$" + iv(g.a, g.b) + "$",
            wrong: bad.slice(0, 2).map(function (p) { return { t: "$" + iv(p.a, p.b) + "$", fb: "From " + p.a + " to " + p.b + " the graph " + (p.up ? "rises" : "falls") + "." }; })
              .concat(w.ys[cuts[0]] !== w.ys[cuts[1]] ? [{ t: "$" + iv(Math.min(w.ys[cuts[0]], w.ys[cuts[1]]), Math.max(w.ys[cuts[0]], w.ys[cuts[1]])) + "$", fb: "Intervals are about $x$ — where along the axis — not the heights." }] : [])
              .filter(function (x, k, arr) { return x.t !== "$" + iv(g.a, g.b) + "$" && arr.map(function (y) { return y.t; }).indexOf(x.t) === k; }),
            hints: ["Read left to right: " + (inc ? "increasing means the graph goes up." : "decreasing means the graph goes down.")],
            why: "From $x = " + g.a + "$ to $x = " + g.b + "$ the graph " + (inc ? "rises" : "falls") + "." });
        } },
      { id: "a8-interp", title: "Graph interpretation word problems", lesson: 8,
        gen: function (R) {
          var S = R.pick([
            { y: "°C", x: "hours after midnight", what: "temperature", up: "getting warmer", down: "getting colder", hi: "warmest", lo: "coldest", xs: [0, 4, 8, 12, 16, 20, 24], base: 8, amp: 1 },
            { y: "m", x: "seconds", what: "height of a drone", up: "climbing", down: "coming down", hi: "highest", lo: "lowest", xs: [0, 2, 4, 6, 8, 10, 12], base: 10, amp: 2 },
            { y: "thousands", x: "months", what: "number of visitors to a park", up: "rising", down: "falling", hi: "busiest", lo: "quietest", xs: [0, 2, 4, 6, 8, 10, 12], base: 8, amp: 1 }]);
          var w = wavy(R), ys = w.ys.map(function (y) { return S.base + S.amp * y; });
          var mn = Math.min.apply(null, ys); if (mn < 0) ys = ys.map(function (y) { return y - mn + 1; });
          var hiV = Math.max.apply(null, ys), loV = Math.min.apply(null, ys), q = R.int(0, 2);
          var gy = hiV > 20 ? 5 : 2, spec = graph(S.xs, ys, { x: [-1, S.xs[6] + 1], y: [-gy, hiV + gy], labelEvery: S.xs[1], labelEveryY: gy * 2, gridY: gy, axisLabels: [S.x, S.y] });
          if (q === 0 || q === 1) {
            var v = q === 0 ? hiV : loV, i = ys.indexOf(v), others = S.xs.filter(function (x, k) { return ys[k] !== v; });
            return mc(R, { prompt: "The graph shows the " + S.what + " (" + S.y + ") against time (" + S.x + "). When was it " + (q === 0 ? S.hi : S.lo) + "?", scene: spec,
              right: "At " + S.xs[i] + " " + S.x, wrong: R.shuffle(others).slice(0, 2).map(function (x) { return { t: "At " + x + " " + S.x, fb: "Look for the " + (q === 0 ? "highest" : "lowest") + " point of the whole graph." }; }),
              hints: ["Find the " + (q === 0 ? "highest" : "lowest") + " point of the graph, then read its time."], why: "The " + (q === 0 ? "highest" : "lowest") + " point is at " + S.xs[i] + " " + S.x + "." });
          }
          var parts = [];
          for (var k = 0; k < S.xs.length - 1; k++) parts.push({ a: S.xs[k], b: S.xs[k + 1], up: ys[k + 1] > ys[k] });
          var dn = parts.filter(function (p) { return !p.up; }), upP = parts.filter(function (p) { return p.up; });
          var pickDown = dn.length && (!upP.length || R.chance(0.5)), g = R.pick(pickDown ? dn : upP), b2 = pickDown ? upP : dn;
          return mc(R, { prompt: "The graph shows the " + S.what + " (" + S.y + ") against time (" + S.x + "). During which stretch was it " + (pickDown ? S.down : S.up) + "?", scene: spec,
            right: "From " + g.a + " to " + g.b + " " + S.x, wrong: b2.slice(0, 2).map(function (p) { return { t: "From " + p.a + " to " + p.b + " " + S.x, fb: "Then the graph " + (p.up ? "rises" : "falls") + "." }; }),
            hints: [pickDown ? "Look for where the graph goes down, reading left to right." : "Look for where the graph goes up, reading left to right."],
            why: "From " + g.a + " to " + g.b + " the graph " + (pickDown ? "falls" : "rises") + "." });
        } },
      { id: "a8-arc", title: "Average rate of change: graphs & tables", lesson: 9,
        gen: function (R) {
          var w = wavy(R), i = R.int(0, 4), j = i + R.int(1, Math.min(3, w.xs.length - 1 - i)), a = w.xs[i], b = w.xs[j], fa = w.ys[i], fb = w.ys[j], v = (fb - fa) / (b - a);
          var useTable = R.chance(0.4);
          var scene = useTable ? tbl(["$x$", "$f(x)$"], w.xs.slice(0, 7).map(function (x, k) { return [x, w.ys[k]]; }))
                               : graph(w.xs, w.ys, { marks: [[a, fa, "", "orange"], [b, fb, "", "orange"]] });
          return { type: "num", prompt: "What is the average rate of change of $f$ from $x = " + a + "$ to $x = " + b + "$? (A fraction is fine.)", answer: v, scene: scene,
            near: nears(v, [{ v: fb - fa, fb: "That's the change in $f$. Divide by the change in $x$, " + (b - a) + "." }, { v: -v, fb: "Subtract in the same order: $f(" + b + ") - f(" + a + ")$ over $" + b + " - " + paren(a) + "$." }]),
            hints: ["$f(" + a + ") = " + fa + "$ and $f(" + b + ") = " + fb + "$.", "$\\frac{f(" + b + ") - f(" + a + ")}{" + b + " - " + paren(a) + "}$."],
            why: "$\\frac{" + fb + " - " + paren(fa) + "}{" + b + " - " + paren(a) + "} = \\frac{" + (fb - fa) + "}{" + (b - a) + "} = " + frac(fb - fa, b - a) + "$." };
        } },
      { id: "a8-arc-words", title: "Average rate of change word problems", lesson: 9,
        gen: function (R) {
          var T = R.pick([
            function () { var t1 = R.int(7, 10), dt = R.int(2, 4), sp = R.pick([60, 70, 80, 90]), d1 = R.int(100, 400) * 10; return { p: "A car's odometer read $" + d1 + "$ km at " + t1 + " o'clock and $" + (d1 + sp * dt) + "$ km at " + (t1 + dt) + " o'clock. What was its average speed, in km per hour?", a: sp, ch: sp * dt, dt: dt }; },
            function () { var h1 = R.int(2, 6), dt = R.int(2, 5), r = R.pick([3, 4, 5, 6]); return { p: "A sunflower was " + h1 * 10 + " cm tall in week " + h1 + " and " + (h1 * 10 + r * dt) + " cm tall in week " + (h1 + dt) + ". How many cm per week did it grow, on average?", a: r, ch: r * dt, dt: dt }; },
            function () { var t = R.pick([1, 2]), f = function (x) { return -5 * x * x + 30 * x; }, t2 = t + 2; return { p: "A ball's height in metres $t$ seconds after it's kicked is $h(t) = -5t^2 + 30t$. What is its average rate of change, in m per second, from $t = " + t + "$ to $t = " + t2 + "$?", a: (f(t2) - f(t)) / 2, ch: f(t2) - f(t), dt: 2 }; },
            function () { var p1 = R.int(20, 40) * 100, dt = R.pick([4, 5, 10]), r = R.pick([-150, -80, 120, 250]); return { p: "A town had " + p1 + " people in 2010 and " + (p1 + r * dt) + " in " + (2010 + dt) + ". What was the average change in population per year? (Negative if it fell.)", a: r, ch: r * dt, dt: dt }; }])();
          return { type: "num", prompt: T.p, answer: T.a, near: nears(T.a, [{ v: T.ch, fb: "That's the total change. Divide by the " + T.dt + " units of time." }]),
            hints: ["Average rate of change $= \\frac{\\text{change in amount}}{\\text{change in time}}$."], why: "$\\frac{" + T.ch + "}{" + T.dt + "} = " + num(T.a) + "$." };
        } },
      { id: "a8-inv-eval", title: "Evaluate inverse functions", lesson: 10,
        gen: function (R) {
          if (R.chance(0.5)) {
            var xs = R.distinct(4, -6, 8).sort(function (a, b) { return a - b; }), ys = R.distinct(4, -9, 12), i = R.int(0, 3);
            return { type: "num", prompt: "The table shows some values of $f$. What is $f^{-1}(" + ys[i] + ")$?", answer: xs[i], scene: tbl(["$x$", "$f(x)$"], xs.map(function (x, k) { return [x, ys[k]]; })),
              near: nears(xs[i], [{ v: ys[xs.indexOf(ys[i])], fb: "That's $f(" + ys[i] + ")$. The inverse asks which input gave " + ys[i] + "." }]),
              hints: ["Which $x$ has $f(x) = " + ys[i] + "$?"], why: "$f(" + xs[i] + ") = " + ys[i] + "$, so $f^{-1}(" + ys[i] + ") = " + xs[i] + "$." };
          }
          var a = R.nz(-5, 5), b = R.int(-9, 9), x = R.int(-6, 6), y = a * x + b;
          return { type: "num", prompt: "$f(x) = " + poly([[a, "x"], [b, ""]]) + "$. What is $f^{-1}(" + y + ")$?", answer: x,
            near: nears(x, [{ v: a * y + b, fb: "That's $f(" + y + ")$. $f^{-1}(" + y + ")$ is the input that gives " + y + "." }]),
            hints: ["$f^{-1}(" + y + ")$ is the $x$ with $f(x) = " + y + "$: solve $" + poly([[a, "x"], [b, ""]]) + " = " + y + "$."], why: "$" + poly([[a, "x"], [b, ""]]) + " = " + y + "$ gives $x = " + x + "$." };
        } },
      { id: "a8-inv", title: "Find inverses of linear functions", lesson: 10,
        gen: function (R) {
          var a = R.pick([2, 3, 4, 5, -2, -3, -1]), b = R.nz(-9, 9), n = R.pick(["f", "g", "h"]);
          var ans = "(x - " + paren(b) + ")/" + paren(a);
          var shown = a === -1 ? poly([[-1, "x"], [b, ""]]) : "(x " + (b < 0 ? "+ " + -b : "- " + b) + ")/" + a;
          return { type: "expr", prompt: "Find the inverse of $" + n + "(x) = " + poly([[a, "x"], [b, ""]]) + "$.", pre: "$" + n + "^{-1}(x) =$", answer: ans, shown: shown,
            near: a !== -1 ? [{ v: "x/" + paren(a) + " - " + paren(b), fb: "Undo in the opposite order: take away " + b + " first, then divide the whole thing by " + a + "." },
                              { v: "(x + " + paren(b) + ")/" + paren(a), fb: "Undo $" + (b < 0 ? "- " + -b : "+ " + b) + "$ with the opposite operation." }] : [],
            hints: ["Swap $x$ and $y$: $x = " + poly([[a, "y"], [b, ""]]) + "$.", "Solve for $y$."], why: "$x = " + poly([[a, "y"], [b, ""]]) + "$ gives $y = \\frac{x " + (b < 0 ? "+ " + -b : "- " + b) + "}{" + a + "}$." };
        } }
    ]
  });
})();
