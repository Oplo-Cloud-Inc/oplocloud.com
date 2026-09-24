/* ==========================================================================
   Algebra I — Unit 12: Exponential growth & decay. See lab/core.js.

   Written the way Units 1–11 are. The unit turns on one contrast: adding
   the same amount each step (linear) against multiplying by the same
   amount (exponential). It is met first as two sets of bars growing side
   by side — the multiplying one slow at first, then overwhelming — and
   then read in tables, words, expressions and graphs. Decay is the same
   idea with a factor below 1, and the last lessons find a·bˣ from a table
   or a graph and decide from data which kind of growth is going on.

   Six lessons, following Khan Academy's topics for the unit. Thirteen skills
   (Khan's list), three quizzes, the unit test at the end, and notes that
   put the unit on one page.
   Standards: HSF.LE.A.1, HSF.LE.A.2, HSF.LE.A.3, HSF.LE.B.5, HSF.IF.C.7.e,
   HSA.SSE.A.1.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var num = L.num, mc = L.mc, frac = L.frac;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function nears(ans, list) { return list.filter(function (z) { return isFinite(z.v) && Math.abs(z.v - ans) > 1e-9; }); }
  function tbl(head, rows) { return { type: "table", head: head, rows: rows }; }
  function money(v) { return (Math.round(v * 100) / 100).toFixed(2).replace(/\.00$/, ""); }
  function bTex(b) { return b % 1 === 0 ? num(b) : b < 1 && [0.5, 0.25, 0.2].indexOf(b) >= 0 ? "\\left(" + frac(Math.round(b * 20), 20) + "\\right)" : num(b); }
  function expTex(a, b, v) { return (a === 1 ? "" : num(a) + " \\cdot ") + bTex(b) + "^{" + (v || "x") + "}"; }
  function expTyped(a, b, v) { return num(a) + "*" + (b % 1 && [0.5, 0.25, 0.2].indexOf(b) >= 0 ? "(" + L.fracText(Math.round(b * 20), 20) + ")" : num(b)) + "^" + (v || "x"); }
  // y = a·bˣ on sliders.
  function expSliders(a, b, o) {
    o = o || {};
    return { type: "plane", x: [-4, 6], y: o.y || [-2, 20], labelEveryY: 2, aspect: 1,
      params: { a: { v: 1, min: o.amin != null ? o.amin : 1, max: o.amax || 8, step: o.astep || 1, label: "start $a$" }, b: { v: 1, min: o.bmin != null ? o.bmin : 0.25, max: o.bmax || 4, step: 0.25, label: "factor $b$" } },
      fns: [{ f: function (x, P) { return P.a * Math.pow(P.b, x); }, color: "blue" }],
      marks: (o.marks || []).map(function (p) { return { x: p[0], y: p[1], label: pt(p[0], p[1]), color: "orange" }; }),
      readout: function (st) { var P = st.params; return "$y = " + expTex(P.a, P.b) + "$" + (P.b > 1 ? " — growth" : P.b < 1 ? " — decay" : " — flat"); },
      answer: { params: { a: a, b: b } },
      check: function (st) { var P = st.params;
        if (P.a !== a) return { ok: false, say: "The curve should cross the $y$-axis at $" + num(a) + "$: that's $a$, the value at $x = 0$." };
        if (P.b !== b) return { ok: false, say: "Right start. Now the factor: each step of 1 across multiplies $y$ by $" + num(b) + "$." };
        return { ok: true }; } };
  }

  L.unit("alg", 12, {
    title: "Exponential growth & decay",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Adding or multiplying?",
        blurb: "Linear growth adds the same amount each step; exponential growth multiplies.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Two savings plans. Plan A starts at \\$10 and adds \\$10 a week. Plan B starts at \\$1 and **doubles** every week. Move the slider through the weeks.",
            scene: { type: "bars", series: [{ name: "Plan A: add 10", f: "10 + 10n", color: "blue" }, { name: "Plan B: double", f: "2^n", color: "orange" }], n: 10, start: 1, gate: true }, gate: true,
            then: "Plan A grows by the same **amount** each week: it's **linear**. Plan B grows by the same **factor**: it's **exponential**. B looks hopeless for weeks — then passes A at week 7 and runs away with it." },
          { type: "learn", kicker: "In a table",
            prompt: "In a table with evenly spaced inputs, check the **differences** and the **ratios** of the outputs.",
            scene: { type: "walk", rows: [
              { m: "3, 7, 11, 15", say: "Differences $4, 4, 4$: the same each time — linear." },
              { m: "3, 6, 12, 24", say: "Differences $3, 6, 12$ grow, but ratios are $2, 2, 2$ — exponential." },
              { m: "3, 5, 9, 17", say: "Differences $2, 4, 8$ and ratios $\\frac{5}{3}, \\frac{9}{5}, \\ldots$ — neither is constant: neither." }] },
            gate: true },
          { type: "choice", prompt: "Is this relationship linear, exponential or neither?", skill: "Exponential vs. linear growth",
            scene: tbl(["$x$", "$y$"], [[0, 5], [1, 15], [2, 45], [3, 135]]),
            options: [{ t: "Exponential" }, { t: "Linear", fb: "The differences are 10, 30, 90 — not the same. Try ratios." }, { t: "Neither", fb: "$15 \\div 5 = 3$, $45 \\div 15 = 3$: a constant ratio." }],
            answer: 0, why: "Each $y$ is 3 times the last: exponential." },
          { type: "learn", kicker: "In words",
            prompt: "Words tell you too. “Increases by 50 each year” adds — linear. “Increases by 5% each year” multiplies by $1.05$ — exponential. “Halves every hour” multiplies by $\\frac{1}{2}$ — exponential." },
          { type: "choice", prompt: "A town's population increases by $3\\%$ each year. What kind of model fits?", skill: "Exponential vs. linear models",
            options: [{ t: "Exponential" }, { t: "Linear", fb: "3% of a bigger population is a bigger number of people, so the yearly increase grows. That's multiplying by $1.03$." }],
            answer: 0, why: "A fixed percentage means a fixed factor, $1.03$, each year." },
          { type: "choice", prompt: "A plant grows $2$ cm every week. What kind of model fits?", skill: "Exponential vs. linear models",
            options: [{ t: "Linear" }, { t: "Exponential", fb: "It adds the same 2 cm each week — a constant amount, not a constant factor." }],
            answer: 0, why: "The same amount added each step: linear." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Exponential expressions",
        blurb: "Writing and reading expressions like 500 · 1.03ᵗ.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Start with an amount and multiply by the same factor once per time step.",
            scene: { type: "walk", rows: [
              { say: "A colony of 200 bacteria triples every hour. How many after 4 hours?" },
              { m: "200 \\cdot 3 \\cdot 3 \\cdot 3 \\cdot 3", say: "Four triplings." },
              { m: "= 200 \\cdot 3^4 = 16\\,200", say: "" }] },
            gate: true },
          { type: "num", prompt: "A \\$500 investment grows by 10% a year, so it's multiplied by $1.1$ each year. What is it worth after 3 years, in dollars?", pre: "\\$", answer: 665.5, skill: "Exponential expressions word problems (numerical)",
            near: [{ v: 650, fb: "That's adding \\$50 each year. 10% of a growing amount is more each year: $500 \\cdot 1.1^3$." }, { v: 550, fb: "That's one year." }],
            hints: ["$500 \\cdot 1.1 \\cdot 1.1 \\cdot 1.1$."], why: "$500 \\cdot 1.1^3 = 665.50$." },
          { type: "learn", kicker: "With a letter",
            prompt: "For any number of steps, the number of steps becomes the exponent.",
            scene: { type: "walk", rows: [
              { m: "200 \\cdot 3^t", say: "200 bacteria tripling every hour, after $t$ hours." },
              { m: "200 \\cdot 3^{t/2}", say: "If it tripled every **2** hours instead, after $t$ hours there'd be $\\frac{t}{2}$ triplings." }] },
            gate: true },
          { type: "expr", prompt: "A photo's file size doubles each time it's upscaled, starting at $3$ MB. Write an expression for its size after $n$ upscales.", answer: "3*2^n", skill: "Exponential expressions word problems (algebraic)",
            keys: [["$n$", "n"], ["$\\cdot$", "*"], ["$x^{\\square}$", "^()", -1], ["$($", "("], ["$)$", ")"]], placeholder: "e.g. 3*2^n",
            near: [{ v: "3 + 2n", fb: "That adds 2 MB each time. Doubling multiplies by 2." }, { v: "(3*2)^n", fb: "Only the 2 is raised to the power: $3 \\cdot 2^n$." }],
            hints: ["Start at 3 and multiply by 2 once per upscale."], why: "$3 \\cdot 2^n$." },
          { type: "learn", kicker: "Reading one",
            prompt: "Each part of an exponential expression means something. In $1200 \\cdot (0.85)^t$ for a car's value after $t$ years: **1200** is the value at the start ($t = 0$); **0.85** is the factor per year — each year it keeps 85% of its value, so it loses 15%." },
          { type: "choice", prompt: "A lake's fish are modelled by $F = 4000 \\cdot (1.12)^t$ after $t$ years. What does $1.12$ tell you?", skill: "Interpret exponential expressions",
            options: [{ t: "The number of fish grows by 12% each year" }, { t: "The lake gains 1.12 fish a year", fb: "It multiplies, it doesn't add: each year there are 1.12 times as many." },
                      { t: "The number of fish grows by 112% each year", fb: "Multiplying by 1.12 is keeping 100% and adding 12%." }],
            answer: 0, why: "Multiplying by $1.12$ means the old amount plus 12% more." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Graphs of exponential growth",
        blurb: "y = a·bˣ on sliders — and why exponential always wins in the end.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Here is $y = a \\cdot b^x$. Move the sliders: $a$ is the starting value, and $b$ is the factor for each step of 1 across.",
            scene: expSliders(2, 3, { marks: [[0, 2], [1, 6]] }), gate: true,
            then: "The curve crosses the $y$-axis at $(0, a)$, because $b^0 = 1$. With $b > 1$ it rises — slowly on the left, where it hugs the $x$-axis without ever touching it, then faster and faster." },
          { type: "plane", prompt: "Make the graph of $y = 3 \\cdot 2^x$.", skill: "Graphs of exponential growth",
            params: expSliders(3, 2).params, fns: expSliders(3, 2).fns, readout: expSliders(3, 2).readout, answer: expSliders(3, 2).answer, check: expSliders(3, 2).check,
            x: [-4, 6], y: [-2, 20], labelEveryY: 2, aspect: 1,
            hints: ["It starts at 3 when $x = 0$.", "Each step across doubles it."], why: "$a = 3$, $b = 2$." },
          { type: "learn", kicker: "Over time",
            prompt: "An exponential function with $b > 1$ eventually outgrows **any** linear function, however steep. $f(x) = 100x$ starts far ahead of $g(x) = 2^x$, but at $x = 10$: $f = 1000$, $g = 1024$. After that, $g$ doubles each step while $f$ only adds 100." },
          { type: "choice", prompt: "Which is bigger when $x = 20$: $f(x) = 50x + 200$ or $g(x) = 1.5^x$?", skill: "Exponential vs. linear growth over time",
            options: [{ t: "$g(x)$" }, { t: "$f(x)$", fb: "$f(20) = 1200$, but $1.5^{20} \\approx 3325$. The exponential has overtaken it." }],
            answer: 0, why: "$f(20) = 1200$ and $g(20) \\approx 3325$." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Growth and decay",
        blurb: "A factor above 1 grows; below 1, it shrinks.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Decay",
            prompt: "If the factor is between 0 and 1, each step makes the amount **smaller**: that's **exponential decay**. A medicine's amount halving every hour from 80 mg: $80, 40, 20, 10, \\ldots$ — $80 \\cdot \\left(\\frac{1}{2}\\right)^t$.",
            scene: expSliders(8, 0.5, { marks: [[0, 8], [1, 4], [2, 2]], y: [-1, 12] }) },
          { type: "choice", prompt: "Is $f(x) = 6 \\cdot 0.9^x$ growth or decay?", skill: "Exponential growth vs. decay",
            options: [{ t: "Decay" }, { t: "Growth", fb: "The factor 0.9 is less than 1: each step keeps only 90%." }], answer: 0, why: "$0 < 0.9 < 1$: decay." },
          { type: "plane", prompt: "Make the graph of $y = 8 \\cdot \\left(\\frac{1}{4}\\right)^x$.", skill: "Graphing exponential growth & decay",
            params: expSliders(8, 0.25, { y: [-1, 12] }).params, fns: expSliders(8, 0.25).fns, readout: expSliders(8, 0.25).readout, answer: expSliders(8, 0.25).answer, check: expSliders(8, 0.25).check,
            x: [-4, 6], y: [-1, 12], labelEveryY: 2, aspect: 1,
            hints: ["Start at 8.", "Each step multiplies by $\\frac{1}{4} = 0.25$."], why: "$a = 8$, $b = 0.25$." },
          { type: "learn", kicker: "Writing decay",
            prompt: "“Loses 15% each year” means it **keeps** 85%: the factor is $1 - 0.15 = 0.85$.",
            scene: { type: "walk", rows: [
              { say: "A \\$20 000 car loses 15% of its value each year." },
              { m: "V(t) = 20\\,000 \\cdot 0.85^t", say: "Start 20 000; keep 85% each year." }] },
            gate: true },
          { type: "expr", prompt: "A phone's battery loses 20% of its charge every hour, starting at 100%. Write the charge after $h$ hours.", answer: "100*0.8^h", skill: "Writing functions with exponential decay",
            keys: [["$h$", "h"], ["$\\cdot$", "*"], ["$x^{\\square}$", "^()", -1], ["$($", "("], ["$)$", ")"]], placeholder: "e.g. 100*0.8^h",
            near: [{ v: "100*0.2^h", fb: "It loses 20%, so it **keeps** 80%: the factor is 0.8." }, { v: "100 - 20h", fb: "That loses 20 points every hour — linear. Losing 20% of what's left multiplies by 0.8." }],
            hints: ["Losing 20% keeps 80%."], why: "$100 \\cdot 0.8^h$." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Finding a·bˣ",
        blurb: "Reading the starting value and the factor from a table or a graph.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "From a table",
            prompt: "The starting value $a$ is the output at $x = 0$. The factor $b$ is the ratio from one output to the next (for inputs 1 apart).",
            scene: { type: "walk", rows: [
              { m: "x: 0, 1, 2, 3; \\;\\; y: 5, 15, 45, 135", say: "" },
              { m: "a = 5", say: "At $x = 0$." },
              { m: "b = 15 \\div 5 = 3", say: "" },
              { m: "y = 5 \\cdot 3^x", say: "" }] },
            gate: true },
          { type: "expr", prompt: "Write the exponential function shown in the table.", pre: "$f(x) =$", answer: "4*2^x", skill: "Exponential functions from tables & graphs",
            scene: tbl(["$x$", "$f(x)$"], [[0, 4], [1, 8], [2, 16], [3, 32]]),
            keys: [["$x$", "x"], ["$\\cdot$", "*"], ["$x^{\\square}$", "^()", -1], ["$($", "("], ["$)$", ")"]], placeholder: "e.g. 4*2^x",
            near: [{ v: "4 + 4x", fb: "The outputs don't go up by the same amount. They double." }, { v: "2*4^x", fb: "The starting value is 4 and the factor is 2 — swapped." }],
            hints: ["$f(0) = 4$.", "Each output is twice the last."], why: "$4 \\cdot 2^x$." },
          { type: "learn", kicker: "From a graph",
            prompt: "On a graph, read where the curve crosses the $y$-axis ($a$), then how the height changes over one step across ($b$). In a story, $a$ is the amount at the start.",
            scene: { type: "plane", x: [-1, 7], y: [-5, 70], gridY: 5, labelEveryY: 10, aspect: 1, axisLabels: ["years", "rabbits"],
              fns: [{ f: function (x) { return 4 * Math.pow(2, x); }, color: "blue", domain: [0, 7] }],
              marks: [{ x: 0, y: 4, label: "(0, 4)", color: "orange" }, { x: 1, y: 8, label: "(1, 8)", color: "orange" }, { x: 4, y: 64, label: "(4, 64)" }] },
            after: "4 rabbits at the start, doubling every year: $R = 4 \\cdot 2^t$." },
          { type: "choice", prompt: "For the rabbit graph above, what does the point $(0, 4)$ mean?", skill: "Connecting exponential graphs with contexts",
            options: [{ t: "There were 4 rabbits at the start" }, { t: "The rabbits grow by 4 each year", fb: "It's a point on the graph at $t = 0$ — the starting population." }, { t: "After 4 years there are 0 rabbits", fb: "The first coordinate is the time, 0." }],
            answer: 0, why: "At $t = 0$ years, the population is 4." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Linear or exponential? From data",
        blurb: "Deciding from real data which kind of growth fits.",
        mins: 7, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Real data are rarely perfect, but one test is usually clear: are the **differences** roughly constant, or the **ratios**?",
            scene: { type: "walk", rows: [
              { say: "Year: 0, 1, 2, 3, 4. Users (thousands): 2.0, 3.1, 4.4, 6.9, 10.1." },
              { m: "\\text{differences } 1.1, 1.3, 2.5, 3.2", say: "Growing fast — not linear." },
              { m: "\\text{ratios } \\approx 1.55, 1.42, 1.57, 1.46", say: "Roughly steady, near 1.5 — exponential." }] },
            gate: true },
          { type: "choice", prompt: "Which model fits these data better?", skill: "Linear vs. exponential growth: from data",
            scene: tbl(["Day", "Cells"], [[0, 50], [1, 102], [2, 196], [3, 405], [4, 810]]),
            options: [{ t: "Exponential" }, { t: "Linear", fb: "The increases are about 50, 95, 210, 405 — growing, not steady." }], answer: 0, why: "Each day's count is about double the day before: a steady ratio." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Linear against exponential, and exponential expressions in words.", skills: ["a12-vs", "a12-models", "a12-num", "a12-alg", "a12-interp"], per: 2 },
      { title: "Quiz 2", after: 4, blurb: "Graphs of growth and decay, and writing decay functions.", skills: ["a12-graph-growth", "a12-over-time", "a12-gvd", "a12-graph-gd", "a12-write-decay"], per: 2 },
      { title: "Quiz 3", after: 6, blurb: "Exponential functions from tables and graphs, and from data.", skills: ["a12-from-table", "a12-context", "a12-data"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Linear or exponential?",
        say: ["**Linear** growth adds the same amount each step; **exponential** growth multiplies by the same factor each step.",
              "In a table with evenly spaced inputs: constant differences → linear; constant ratios → exponential; neither → neither.",
              "In words: “by 50 each year” is linear; “by 5% each year” or “doubles” is exponential."],
        watch: "Exponential growth looks slow at first, but with a factor above 1 it eventually overtakes any linear growth." },
      { t: "Exponential expressions",
        say: ["$a \\cdot b^t$: $a$ is the starting amount (at $t = 0$) and $b$ is the factor per step. A growth of $r\\%$ per step is a factor of $1 + \\frac{r}{100}$; a loss of $r\\%$ is $1 - \\frac{r}{100}$.",
              "If the factor applies every $k$ time units, the exponent is $\\frac{t}{k}$: tripling every 2 hours is $a \\cdot 3^{t/2}$."],
        eg: { q: "\\$500 grows 10% a year. What's it worth after 3 years?", rows: [["500 \\cdot 1.1^3", ""], ["= 665.50", "In dollars."]] },
        watch: "In $3 \\cdot 2^n$ only the 2 is raised to the power — not $(3 \\cdot 2)^n$." },
      { t: "Graphs of $y = a \\cdot b^x$",
        say: ["The graph crosses the $y$-axis at $(0, a)$. With $b > 1$ it rises ever faster (growth); with $0 < b < 1$ it falls towards 0 (decay). Either way it gets closer and closer to the $x$-axis on one side without touching it."],
        keys: [["$b > 1$", "growth"], ["$0 < b < 1$", "decay"], ["$(0, a)$", "the starting value"]] },
      { t: "Finding $a$ and $b$",
        say: ["From a table: $a$ is the output at $x = 0$, and $b$ is the ratio of consecutive outputs (inputs 1 apart). From a graph: read the $y$-intercept, then how much the height is multiplied over one step across."],
        eg: { q: "Find the function: $x = 0, 1, 2$ gives $y = 5, 15, 45$.", rows: [["a = 5", ""], ["b = 15 \\div 5 = 3", ""], ["y = 5 \\cdot 3^x", ""]] } },
      { t: "From data",
        say: ["With real data, compute the differences and the ratios. Whichever is closer to constant tells you the better model."] }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a12-vs", title: "Exponential vs. linear growth", lesson: 1,
        gen: function (R) {
          var k = R.int(0, 2), x0 = R.int(0, 2), a = R.int(2, 9), rows;
          if (k === 0) { var d = R.nz(-6, 9); rows = [0, 1, 2, 3].map(function (i) { return [x0 + i, a * 3 + d * i]; }); }
          else if (k === 1) { var b = R.pick([2, 3, 0.5, 4]); if (b === 0.5) a = a * 8; rows = [0, 1, 2, 3].map(function (i) { return [x0 + i, a * Math.pow(b, i)]; }); }
          else { rows = [0, 1, 2, 3].map(function (i) { return [x0 + i, a + i * i + i]; }); }
          var right = ["Linear", "Exponential", "Neither"][k];
          var ys = rows.map(function (r) { return r[1]; }), diffs = [ys[1] - ys[0], ys[2] - ys[1], ys[3] - ys[2]];
          return mc(R, { prompt: "Is this relationship linear, exponential or neither?", scene: tbl(["$x$", "$y$"], rows), right: right, keep: true,
            wrong: ["Linear", "Exponential", "Neither"].filter(function (w) { return w !== right; }).map(function (w) {
              return { t: w, fb: w === "Linear" ? "The differences are $" + diffs.map(num).join(", ") + "$ — not all the same." : w === "Exponential" ? "Check the ratios: $" + num(ys[1]) + " \\div " + num(ys[0]) + "$ and $" + num(ys[2]) + " \\div " + num(ys[1]) + "$ aren't equal." : "One of the two tests works — look again." }; }),
            hints: ["Work out the differences between outputs, then the ratios."], why: k === 0 ? "Differences all $" + diffs[0] + "$: linear." : k === 1 ? "Ratios all the same: exponential." : "Neither the differences nor the ratios are constant." });
        } },
      { id: "a12-models", title: "Exponential vs. linear models", lesson: 1,
        gen: function (R) {
          var S = R.pick([
            ["A town's population grows by " + R.int(2, 8) + "% each year.", 1], ["A town's population grows by " + R.int(2, 8) * 50 + " people each year.", 0],
            ["A car loses " + R.int(10, 25) + "% of its value each year.", 1], ["A car loses \\$" + R.int(10, 25) * 100 + " of value each year.", 0],
            ["A rumour: each person who hears it tells two more the next day.", 1], ["A pool drains " + R.int(20, 60) + " litres a minute.", 0],
            ["A mould's area doubles every week.", 1], ["A candle burns " + R.int(2, 5) + " mm an hour.", 0],
            ["A savings account earns " + R.int(2, 6) + "% interest on its balance each year.", 1], ["Jo saves \\$" + R.int(10, 40) + " every week.", 0]]);
          var right = S[1] ? "Exponential" : "Linear";
          return mc(R, { prompt: S[0] + " What kind of model fits?", right: right, keep: true,
            wrong: [{ t: S[1] ? "Linear" : "Exponential", fb: S[1] ? "A fixed percentage (or factor) changes by more each step as the amount grows — that's multiplying." : "The same **amount** changes each step — that's adding." }],
            hints: ["Same amount each step → linear. Same percentage or factor each step → exponential."], why: S[1] ? "A constant factor each step: exponential." : "A constant amount each step: linear." });
        } },
      { id: "a12-num", title: "Exponential expressions word problems (numerical)", lesson: 2,
        gen: function (R) {
          var T = R.pick([
            function () { var a = R.pick([100, 200, 250, 500]), b = R.pick([2, 3]), n = R.int(2, 5), per = R.pick([1, 2, 3]); var steps = n; return { p: "A colony of " + a + " bacteria " + (b === 2 ? "doubles" : "triples") + " every " + (per === 1 ? "hour" : per + " hours") + ". How many bacteria are there after " + n * per + " hours?", v: a * Math.pow(b, steps), ex: a + " \\cdot " + b + "^{" + steps + "}", lin: a + a * (b - 1) * steps }; },
            function () { var a = R.pick([1000, 2000, 5000]), r = R.pick([10, 20, 50]), n = R.int(2, 3); return { p: "An investment of \\$" + a + " grows by " + r + "% a year. What is it worth after " + n + " years, in dollars?", v: Math.round(a * Math.pow(1 + r / 100, n) * 100) / 100, ex: a + " \\cdot " + num(1 + r / 100) + "^{" + n + "}", lin: a * (1 + r / 100 * n), money: true }; },
            function () { var a = R.pick([64, 128, 256, 80]), n = R.int(2, 4); return { p: "A medicine's amount in the blood halves every hour, starting at " + a + " mg. How many mg are left after " + n + " hours?", v: a * Math.pow(0.5, n), ex: a + " \\cdot \\left(\\frac{1}{2}\\right)^{" + n + "}", lin: a - a / 2 * n }; },
            function () { var a = R.pick([20000, 16000, 25000]), n = R.int(2, 3); return { p: "A car worth \\$" + a + " loses 10% of its value every year. What is it worth after " + n + " years, in dollars?", v: Math.round(a * Math.pow(0.9, n) * 100) / 100, ex: a + " \\cdot 0.9^{" + n + "}", lin: a * (1 - 0.1 * n), money: true }; }])();
          return { type: "num", prompt: T.p, answer: T.v, pre: T.money ? "\\$" : null, tol: T.money ? 0.011 : null,
            near: nears(T.v, [{ v: T.lin, fb: "That treats the change as the same **amount** each step. It's the same **factor** each step." }]),
            hints: ["Start with the first amount and multiply by the factor once for each step.", "$" + T.ex + "$."], why: "$" + T.ex + " = " + (T.money ? money(T.v) : num(T.v)) + "$." };
        } },
      { id: "a12-alg", title: "Exponential expressions word problems (algebraic)", lesson: 2,
        gen: function (R) {
          var T = R.pick([
            function () { var a = R.pick([50, 100, 300]), b = R.pick([2, 3]), per = R.pick([1, 2, 4]); return { p: "A colony starts with " + a + " cells and " + (b === 2 ? "doubles" : "triples") + " every " + (per === 1 ? "hour" : per + " hours") + ". Write an expression for the number of cells after $t$ hours.", v: "t", ans: a + "*" + b + "^(t/" + per + ")", shown: per === 1 ? a + "*" + b + "^t" : a + "*" + b + "^(t/" + per + ")", w: per === 1 ? a + " + " + a * (b - 1) + "t" : a + "*" + b + "^(" + per + "t)" }; },
            function () { var a = R.pick([800, 1200, 2000]), r = R.pick([3, 5, 8]); return { p: "A savings account holds \\$" + a + " and earns " + r + "% interest each year. Write an expression for its value after $y$ years.", v: "y", ans: a + "*" + num(1 + r / 100) + "^y", shown: a + "*" + num(1 + r / 100) + "^y", w: a + "*" + num(r / 100) + "^y" }; },
            function () { var a = R.pick([90, 120, 200]), r = R.pick([10, 20, 25]); return { p: "A coffee cools so that its temperature above the room's drops by " + r + "% every minute, starting " + a + "° above. Write an expression for how far above the room it is after $m$ minutes.", v: "m", ans: a + "*" + num(1 - r / 100) + "^m", shown: a + "*" + num(1 - r / 100) + "^m", w: a + "*" + num(r / 100) + "^m" }; }])();
          return { type: "expr", prompt: T.p, answer: T.ans, shown: T.shown, keys: [["$" + T.v + "$", T.v], ["$\\cdot$", "*"], ["$x^{\\square}$", "^()", -1], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]],
            placeholder: "e.g. 100*2^" + T.v, near: [{ v: T.w, fb: "Check the factor — and how many times it applies in $" + T.v + "$." }],
            hints: ["Start amount × factor to the power of the number of steps.", "How many steps happen in $" + T.v + "$?"], why: "$" + T.shown.replace(/\*/g, " \\cdot ").replace(/\^\(([^)]+)\)/, "^{$1}").replace(/\^(\w)/, "^{$1}") + "$." };
        } },
      { id: "a12-interp", title: "Interpret exponential expressions word problems", lesson: 2,
        gen: function (R) {
          var a = R.pick([1500, 4000, 800, 12000]), grow = R.chance(0.5), r = R.pick([4, 6, 12, 15, 20]), b = grow ? 1 + r / 100 : 1 - r / 100;
          var S = R.pick([["the number of fish in a lake", "fish", "years"], ["the value of a painting (in dollars)", "dollars", "years"], ["the number of users of an app", "users", "months"]]);
          var askB = R.chance(0.6), tex = a + " \\cdot (" + num(b) + ")^t";
          var lead = S[0].charAt(0).toUpperCase() + S[0].slice(1);
          if (askB) return mc(R, { prompt: lead + " after $t$ " + S[2] + " is modelled by $" + tex + "$. What does $" + num(b) + "$ tell you?",
            right: "It " + (grow ? "grows" : "shrinks") + " by " + r + "% each " + S[2].slice(0, -1),
            wrong: [{ t: "It " + (grow ? "grows" : "shrinks") + " by " + num(b) + " " + S[1] + " each " + S[2].slice(0, -1), fb: "It's a factor that multiplies, not an amount added." },
                    { t: "It " + (grow ? "shrinks" : "grows") + " by " + r + "% each " + S[2].slice(0, -1), fb: "A factor " + (grow ? "above" : "below") + " 1 makes it " + (grow ? "grow" : "shrink") + "." },
                    { t: "It " + (grow ? "grows" : "shrinks") + " by " + Math.round(b * 100) + "% each " + S[2].slice(0, -1), fb: "Multiplying by " + num(b) + " keeps 100% and " + (grow ? "adds" : "removes") + " " + r + "%." }],
            hints: ["Compare the factor with 1: how much above or below is it?"], why: "$" + num(b) + " = 1 " + (grow ? "+" : "-") + " " + num(r / 100) + "$: " + (grow ? "up" : "down") + " " + r + "% each " + S[2].slice(0, -1) + "." });
          return mc(R, { prompt: lead + " after $t$ " + S[2] + " is modelled by $" + tex + "$. What does $" + a + "$ tell you?",
            right: "There were " + a + " " + S[1] + " at the start", wrong: [{ t: "It changes by " + a + " " + S[1] + " each " + S[2].slice(0, -1), fb: "The number in front is the value at $t = 0$." }, { t: "After " + a + " " + S[2] + " the model stops", fb: a + " is an amount of " + S[1] + ", not a time." }],
            hints: ["What is the expression when $t = 0$?"], why: "At $t = 0$, $(" + num(b) + ")^0 = 1$, so the value is " + a + "." });
        } },
      { id: "a12-graph-growth", title: "Graphs of exponential growth", lesson: 3,
        gen: function (R) {
          var a = R.int(1, 4), b = R.pick([1.5, 2, 3]);
          var s = expSliders(a, b, { marks: [] });
          s.prompt = "Make the graph of $y = " + expTex(a, b) + "$.";
          s.hints = ["It crosses the $y$-axis at $" + a + "$.", "Each step of 1 across multiplies the height by $" + num(b) + "$."]; s.why = "$a = " + a + "$, $b = " + num(b) + "$: through $" + pt(0, a) + "$ and $" + pt(1, a * b) + "$.";
          return s;
        } },
      { id: "a12-over-time", title: "Exponential vs. linear growth over time", lesson: 3,
        gen: function (R) {
          var m = R.pick([20, 50, 100]), c = R.pick([0, 100, 500]), b = R.pick([1.5, 2, 3]), x = R.pick([2, 3, 5, 15, 20, 25]);
          var f = m * x + c, g = Math.pow(b, x), bigger = g > f ? "g" : "f";
          return mc(R, { prompt: "Which is bigger when $x = " + x + "$: $f(x) = " + m + "x" + (c ? " + " + c : "") + "$ or $g(x) = " + num(b) + "^x$?", right: "$" + bigger + "(x)$",
            wrong: [{ t: bigger === "g" ? "$f(x)$" : "$g(x)$", fb: "Work both out: $f(" + x + ") = " + num(f) + "$ and $g(" + x + ") \\approx " + num(Math.round(g)) + "$." }], keep: true,
            hints: ["Work out both at $x = " + x + "$.", "Exponential growth starts slow but eventually wins."], why: "$f(" + x + ") = " + num(f) + "$, $g(" + x + ") \\approx " + num(Math.round(g)) + "$." });
        } },
      { id: "a12-gvd", title: "Exponential growth vs. decay", lesson: 4,
        gen: function (R) {
          var F = R.pick([["5 \\cdot 2^x", 1], ["3 \\cdot 0.6^x", 0], ["100 \\cdot 1.04^x", 1], ["40 \\cdot \\left(\\frac{1}{3}\\right)^x", 0], ["2 \\cdot 1.5^x", 1], ["900 \\cdot 0.97^x", 0],
                          ["7 \\cdot \\left(\\frac{5}{4}\\right)^x", 1], ["12 \\cdot \\left(\\frac{3}{4}\\right)^x", 0], ["0.5 \\cdot 3^x", 1], ["8 \\cdot 0.5^x", 0]]);
          return mc(R, { prompt: "Is $f(x) = " + F[0] + "$ exponential growth or decay?", right: F[1] ? "Growth" : "Decay", keep: true,
            wrong: [{ t: F[1] ? "Decay" : "Growth", fb: F[1] ? "The factor is greater than 1, so each step makes it bigger. (The number in front doesn't decide it.)" : "The factor is between 0 and 1, so each step makes it smaller." }],
            hints: ["Look at the base — the number being raised to the power $x$. Is it more or less than 1?"], why: F[1] ? "Factor above 1: growth." : "Factor between 0 and 1: decay." });
        } },
      { id: "a12-graph-gd", title: "Graphing exponential growth & decay", lesson: 4,
        gen: function (R) {
          var decay = R.chance(0.5), a = decay ? R.pick([4, 6, 8]) : R.int(1, 4), b = decay ? R.pick([0.25, 0.5, 0.75]) : R.pick([1.5, 2, 2.5]);
          var s = expSliders(a, b, { y: decay ? [-1, 12] : [-2, 20] });
          s.prompt = "Make the graph of $y = " + expTex(a, b) + "$.";
          s.hints = ["It crosses the $y$-axis at $" + a + "$.", (decay ? "A factor below 1: each step shrinks it to " : "A factor above 1: each step multiplies it by ") + "$" + num(b) + "$" + (decay ? " of itself." : ".")];
          s.why = "$a = " + a + "$, $b = " + num(b) + "$.";
          return s;
        } },
      { id: "a12-write-decay", title: "Writing functions with exponential decay", lesson: 4,
        gen: function (R) {
          var T = R.pick([
            function () { var a = R.pick([15000, 20000, 30000]), r = R.pick([10, 15, 20, 25]); return { p: "A car worth \\$" + a + " loses " + r + "% of its value every year. Write its value after $t$ years.", v: "t", a: a, b: 1 - r / 100, r: r }; },
            function () { var a = R.pick([200, 500, 800]), r = R.pick([5, 10, 30]); return { p: "A lake has " + a + " fish, and pollution kills " + r + "% of them each year. Write the number of fish after $t$ years.", v: "t", a: a, b: 1 - r / 100, r: r }; },
            function () { var a = R.pick([60, 80, 120]), r = R.pick([20, 25, 50]); return { p: "A patient is given " + a + " mg of a medicine, and " + r + "% of it leaves the body every hour. Write the amount left after $h$ hours.", v: "h", a: a, b: 1 - r / 100, r: r }; }])();
          var ans = T.a + "*" + num(T.b) + "^" + T.v;
          return { type: "expr", prompt: T.p, answer: ans, shown: ans, keys: [["$" + T.v + "$", T.v], ["$\\cdot$", "*"], ["$x^{\\square}$", "^()", -1], ["$($", "("], ["$)$", ")"]], placeholder: "e.g. 100*0.9^" + T.v,
            near: [{ v: T.a + "*" + num(T.r / 100) + "^" + T.v, fb: "Losing " + T.r + "% means keeping " + (100 - T.r) + "%: the factor is " + num(T.b) + "." },
                   { v: T.a + " - " + num(T.r / 100 * T.a) + "*" + T.v, fb: "That loses the same amount each time. Losing a percentage of what's **left** multiplies by " + num(T.b) + "." }].filter(function (z) { return T.r !== 50 || z.v.indexOf("-") >= 0; }),
            hints: ["Losing " + T.r + "% keeps " + (100 - T.r) + "%.", "Start value × factor$^{" + T.v + "}$."], why: "$" + T.a + " \\cdot " + num(T.b) + "^{" + T.v + "}$." };
        } },
      { id: "a12-from-table", title: "Exponential functions from tables & graphs", lesson: 5,
        gen: function (R) {
          var a = R.int(1, 6), b = R.pick([2, 3, 4, 0.5]); if (b === 0.5) a *= 8;
          var rows = [0, 1, 2, 3].map(function (x) { return [x, a * Math.pow(b, x)]; }), useGraph = R.chance(0.4) && b !== 4;
          var scene = useGraph ? { type: "plane", x: [-1, 4], y: [-2, Math.max(a, a * b * b) + 3], aspect: 1, labelEveryY: a * b * b > 24 ? 5 : 2,
              fns: [{ f: function (x) { return a * Math.pow(b, x); }, color: "blue" }], marks: rows.slice(0, 3).map(function (r) { return { x: r[0], y: r[1], label: pt(r[0], r[1]), color: "orange" }; }) }
            : tbl(["$x$", "$f(x)$"], rows);
          return { type: "expr", prompt: "Write the exponential function shown.", pre: "$f(x) =$", answer: expTyped(a, b), shown: expTyped(a, b), scene: scene,
            keys: [["$x$", "x"], ["$\\cdot$", "*"], ["$x^{\\square}$", "^()", -1], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]], placeholder: "e.g. 3*2^x",
            near: a !== b ? [{ v: expTyped(b, a), fb: "The starting value and the factor are swapped." }] : [],
            hints: ["$a$ is the value at $x = 0$: " + num(a) + ".", "$b$ is the ratio of one value to the one before."], why: "$f(x) = " + expTex(a, b) + "$." };
        } },
      { id: "a12-context", title: "Connecting exponential graphs with contexts", lesson: 5,
        gen: function (R) {
          var S = R.pick([["rabbits on an island", "years", "rabbits"], ["followers of a new account", "weeks", "followers"], ["bacteria in a dish", "hours", "bacteria"]]);
          var a = R.pick([2, 3, 4, 5]), b = R.pick([2, 3]), q = R.int(0, 2);
          var scene = { type: "plane", x: [-1, 4], y: [-3, a * b * b * b + 5], aspect: 1, gridY: a * b * b > 30 ? 5 : 2, labelEveryY: a * b * b > 30 ? 10 : 4, axisLabels: [S[1], S[2]],
            fns: [{ f: function (x) { return a * Math.pow(b, x); }, color: "blue", domain: [0, 4] }],
            marks: [0, 1, 2].map(function (x) { return { x: x, y: a * Math.pow(b, x), label: pt(x, a * Math.pow(b, x)), color: "orange" }; }) };
          var lead = "The graph shows the number of " + S[0] + " over time. ";
          if (q === 0) return mc(R, { prompt: lead + "What does the point $" + pt(0, a) + "$ mean?", scene: scene, right: "There were " + a + " " + S[2] + " at the start",
            wrong: [{ t: "The number grows by " + a + " each " + S[1].slice(0, -1), fb: "The point is at time 0: it's the starting amount." }, { t: "After " + a + " " + S[1] + " there were none", fb: "The first coordinate is the time, 0." }],
            hints: ["The first coordinate is the time; the second is the number."], why: "At time 0 there were " + a + "." });
          if (q === 1) return { type: "num", prompt: lead + "By what factor does the number grow each " + S[1].slice(0, -1) + "?", scene: scene, answer: b,
            near: nears(b, [{ v: a * b - a, fb: "That's how much it went up in the first " + S[1].slice(0, -1) + ". The factor is the ratio: $" + (a * b) + " \\div " + a + "$." }]),
            hints: ["Divide one value by the one before: $" + a * b + " \\div " + a + "$."], why: "$" + a * b + " \\div " + a + " = " + b + "$." };
          return { type: "num", prompt: lead + "If it keeps growing the same way, how many " + S[2] + " will there be at " + S[1].slice(0, -1) + " 4?", scene: scene, answer: a * Math.pow(b, 4),
            near: nears(a * Math.pow(b, 4), [{ v: a * b * b + 2 * (a * b * b - a * b), fb: "It doesn't add the same amount each step — it multiplies by " + b + "." }]),
            hints: ["Multiply by " + b + " for each step from the last value shown."], why: "$" + a + " \\cdot " + b + "^4 = " + a * Math.pow(b, 4) + "$." };
        } },
      { id: "a12-data", title: "Linear vs. exponential growth: from data", lesson: 6,
        gen: function (R) {
          var exp = R.chance(0.5), a = R.int(20, 80), rows = [];
          for (var i = 0; i < 5; i++) {
            var ideal = exp ? a * Math.pow(1.5, i) : a + 15 * i, noise = 1 + (R.next() - 0.5) * 0.06;
            rows.push([i, Math.round(ideal * noise)]);
          }
          var ys = rows.map(function (r) { return r[1]; });
          var diffs = ys.slice(1).map(function (y, i) { return y - ys[i]; });
          return mc(R, { prompt: "Which model fits these measurements better?", scene: tbl(["Time", "Amount"], rows), right: exp ? "Exponential" : "Linear", keep: true,
            wrong: [{ t: exp ? "Linear" : "Exponential", fb: exp ? "The increases — $" + diffs.join(", ") + "$ — keep growing. The ratios are close to steady." : "The increases — $" + diffs.join(", ") + "$ — stay roughly the same." }],
            hints: ["Work out the increase from one row to the next. Roughly steady, or growing?"], why: exp ? "The ratios are all close to 1.5: exponential." : "The increases are all close to 15: linear." });
        } }
    ]
  });
})();
