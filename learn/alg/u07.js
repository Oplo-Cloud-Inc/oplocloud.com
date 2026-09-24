/* ==========================================================================
   Algebra I — Unit 7: Inequalities (systems & graphs). See lab/core.js.

   Written the way Units 1–6 are. An inequality in two letters is met by
   dragging a point around the plane and watching the readout say whether
   it works — until it is plain that the solutions fill one side of a line.
   Graphing one is then four choices a student makes on sliders: the line's
   slope and intercept, which side to shade, and whether the line itself
   counts (solid) or not (dashed). A system is where two shadings overlap,
   and the last lesson writes the constraints of real budgets and limits.

   Four lessons, following Khan Academy's topics for the unit. Eight skills
   (Khan's list), three quizzes, the unit test at the end, and notes that put
   the unit on one page.
   Standards: HSA.CED.A.3, HSA.REI.D.12.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, gcd = L.gcd;

  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function money(v) { return v % 1 ? v.toFixed(2) : String(v); }
  function relTex(r) { return r === "<=" ? "\\le" : r === ">=" ? "\\ge" : r; }
  function holds(r, a, b) { return r === "<" ? a < b - 1e-9 : r === ">" ? a > b + 1e-9 : r === "<=" ? a <= b + 1e-9 : a >= b - 1e-9; }
  function flip(r) { return { "<": ">", ">": "<", "<=": ">=", ">=": "<=" }[r]; }
  function slopeTerm(m) {
    if (m === 0) return "";
    if (m % 1 === 0) return poly([[m, "x"]]);
    var n = m * 2; return (n < 0 ? "-" : "") + "\\frac{" + Math.abs(n) + "}{2}x";
  }
  function rhs(m, b) { var t = slopeTerm(m); return t ? t + (b === 0 ? "" : b < 0 ? " - " + num(-b) : " + " + num(b)) : num(b); }
  function ineqTex(m, b, r) { return "y " + relTex(r) + " " + rhs(m, b); }
  // One shaded half-plane, y r mx + b.
  function half(m, b, r, color) { return { f: function (x) { return m * x + b; }, shade: r[0] === ">" ? "above" : "below", strict: r.length === 1, color: color || "blue" }; }
  function region(fs, o) {
    o = o || {};
    return { type: "plane", x: [-8, 8], y: [-8, 8], fns: fs,
      marks: (o.marks || []).map(function (p) { return { x: p[0], y: p[1], label: p[2] != null ? p[2] : pt(p[0], p[1]), color: p[3] || "ink" }; }) };
  }
  // Graph y r mx + b with four sliders: the boundary's slope and intercept,
  // the side to shade, and a dashed or solid line.
  function grapher(m, b, r) {
    function f(x, P) { return P.m * x + P.b; }
    var want = { m: m, b: b, s: r[0] === ">" ? 1 : 0, e: r.length === 2 ? 1 : 0 };
    return { type: "plane", x: [-8, 8], y: [-8, 8],
      params: { m: { v: 0, min: -4, max: 4, step: 0.5, label: "slope $m$" }, b: { v: 0, min: -7, max: 7, step: 1, label: "intercept $b$" },
                s: { v: 0, min: 0, max: 1, step: 1, label: "shade", show: function (v) { return v ? "above" : "below"; } },
                e: { v: 0, min: 0, max: 1, step: 1, label: "line", show: function (v) { return v ? "solid" : "dashed"; } } },
      fns: [{ f: f, shade: "above", strict: true, hidden: function (P) { return !(P.s === 1 && P.e === 0); } },
            { f: f, shade: "above", hidden: function (P) { return !(P.s === 1 && P.e === 1); } },
            { f: f, shade: "below", strict: true, hidden: function (P) { return !(P.s === 0 && P.e === 0); } },
            { f: f, shade: "below", hidden: function (P) { return !(P.s === 0 && P.e === 1); } }],
      readout: function (st) { var P = st.params; return "Your graph shows $" + ineqTex(P.m, P.b, (P.s ? ">" : "<") + (P.e ? "=" : "")) + "$"; },
      answer: { params: want },
      check: function (st) {
        var P = st.params;
        if (P.m !== m || P.b !== b) return { ok: false, say: "The boundary line isn't right yet. It should be $y = " + rhs(m, b) + "$: slope $" + num(m) + "$, crossing the $y$-axis at $" + b + "$." };
        if (P.s !== want.s) return { ok: false, say: "Right line — now the side. Test a point: is $(0, " + (b > 0 ? -8 : 8) + ")$ a solution? Shade the side where the points work." };
        if (P.e !== want.e) return { ok: false, say: r.length === 2 ? "“Or equal to” includes the line itself, so it should be solid." : "Strict $" + relTex(r) + "$ leaves the line out, so it should be dashed." };
        return { ok: true };
      } };
  }
  // Four points, one in each region between two crossing lines.
  function quadrantPoints(m1, b1, m2, b2) {
    var best = {};
    // Well clear of both lines if possible; closer in only for a narrow wedge.
    [1.4, 0.8, 0.3].forEach(function (gap) {
      var found = {};
      for (var x = -7; x <= 7; x++) for (var y = -7; y <= 7; y++) {
        var d1 = (y - (m1 * x + b1)) / Math.sqrt(1 + m1 * m1), d2 = (y - (m2 * x + b2)) / Math.sqrt(1 + m2 * m2);
        if (Math.abs(d1) < gap || Math.abs(d2) < gap) continue;
        var k = (d1 > 0 ? "a" : "b") + (d2 > 0 ? "a" : "b"), score = Math.abs(Math.abs(d1) - Math.abs(d2)) + (Math.abs(d1) + Math.abs(d2)) * 0.4;
        if (best[k]) continue;
        if (!found[k] || score < found[k].s) found[k] = { x: x, y: y, s: score };
      }
      Object.keys(found).forEach(function (k) { best[k] = found[k]; });
    });
    return best;
  }

  L.unit("alg", 7, {
    title: "Inequalities (systems & graphs)",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Solutions fill a side",
        blurb: "Testing points in an inequality with two letters, and seeing where they all lie.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "An inequality with two letters, like $y > x + 1$, has pairs $(x, y)$ as its solutions: a pair is a solution if it makes the inequality true.",
            scene: { type: "walk", rows: [
              { m: "(2, 5): \\; 5 > 2 + 1", say: "True — a solution." },
              { m: "(2, 3): \\; 3 > 2 + 1", say: "False: $3$ isn't **more** than 3. Not a solution." },
              { m: "(0, 0): \\; 0 > 0 + 1", say: "False. Not a solution." }] },
            gate: true },
          { type: "choice", prompt: "Is $(3, 1)$ a solution of $2x - y \\ge 5$?", skill: "Solutions of inequalities: algebraic",
            options: [{ t: "Yes" }, { t: "No", fb: "$2(3) - 1 = 5$, and $5 \\ge 5$ is true: “or equal to” allows it." }],
            answer: 0, why: "$2(3) - 1 = 5 \\ge 5$ ✓" },
          { type: "learn", kicker: "Where are they?",
            prompt: "Drag the point around. The readout tests it in $y > x + 1$. Find where the solutions are.",
            scene: { type: "plane", x: [-8, 8], y: [-8, 8], fns: [{ f: function (x) { return x + 1; }, color: "blue", dashed: true, label: "y = x + 1" }],
              points: [{ id: "P", x: 3, y: -2, drag: true, color: "orange" }],
              readout: function (st) { var p = st.pt("P"), ok = p.y > p.x + 1; return "$" + pt(p.x, p.y) + "$: $" + num(p.y) + " > " + num(p.x + 1) + "$ is **" + (ok ? "true" : "false") + "** — " + (ok ? "a solution." : "not a solution."); },
              goal: function (st) { var p = st.pt("P"); return p.y > p.x + 2; } },
            gate: true,
            then: "Every solution is on one side of the line $y = x + 1$ — above it. The solutions of a two-letter inequality fill a **half-plane**. Points **on** the line give $y = x + 1$, not $y > x + 1$, so for $>$ the line itself is left out and drawn dashed." },
          { type: "choice", prompt: "The shaded region is $y \\le -x + 2$. Which point is a solution?", skill: "Solutions of inequalities: graphical",
            scene: region([half(-1, 2, "<=")], { marks: [[-2, -3, "A"], [3, 4, "B"], [1, 5, "C"]] }),
            options: [{ t: "A" }, { t: "B", fb: "B is above the line, outside the shading." }, { t: "C", fb: "C is outside the shaded region." }],
            answer: 0, hints: ["A solution is in the shaded region (or on a solid boundary)."], why: "A $(-2, -3)$ is in the shading: $-3 \\le 2 + 2$ ✓" },
          { type: "learn", kicker: "More than one",
            prompt: "A **system** of inequalities asks for points that satisfy all of them at once. A point that fails even one isn't a solution of the system." },
          { type: "choice", prompt: "Is $(1, 2)$ a solution of the system $y < 2x + 3$ and $y > -x + 4$?", skill: "Solutions of systems of inequalities",
            options: [{ t: "No" }, { t: "Yes", fb: "It satisfies the first ($2 < 5$), but $2 > -1 + 4 = 3$ is false." }],
            answer: 0, hints: ["Test the point in **both** inequalities."], why: "$2 < 5$ ✓ but $2 > 3$ ✗." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Graphing an inequality",
        blurb: "The boundary line, dashed or solid, and the side to shade.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Graphing $y \\le -2x + 3$ takes three decisions.",
            scene: { type: "walk", rows: [
              { m: "y = -2x + 3", say: "**The boundary**: graph the line you get by making it an equation." },
              { m: "\\le \\;\\Rightarrow\\; \\text{solid}", say: "**The line**: “or equal to” includes it, so draw it solid. For $<$ or $>$ it would be dashed." },
              { m: "(0, 0): \\; 0 \\le 3 \\; ✓", say: "**The side**: test a point off the line. $(0, 0)$ works, so shade the side it's on — below." }] },
            gate: true,
            then: "With $y$ alone, it's quicker still: $y >$ or $y \\ge$ shades **above** the line; $y <$ or $y \\le$ shades **below**." },
          { type: "plane", prompt: "Graph $y > 2x - 3$. Set the slope and intercept of the boundary, the side to shade, and the kind of line.", skill: "Graphs of inequalities",
            params: grapher(2, -3, ">").params, fns: grapher(2, -3, ">").fns, readout: grapher(2, -3, ">").readout,
            x: [-8, 8], y: [-8, 8], answer: grapher(2, -3, ">").answer, check: grapher(2, -3, ">").check,
            hints: ["The boundary is $y = 2x - 3$: slope 2, intercept $-3$.", "$y >$ shades above, and a strict $>$ leaves the line dashed."],
            why: "Boundary $y = 2x - 3$, dashed, shaded above." },
          { type: "plane", prompt: "Graph $y \\le -x + 4$.", skill: "Graphs of inequalities",
            params: grapher(-1, 4, "<=").params, fns: grapher(-1, 4, "<=").fns, readout: grapher(-1, 4, "<=").readout,
            x: [-8, 8], y: [-8, 8], answer: grapher(-1, 4, "<=").answer, check: grapher(-1, 4, "<=").check,
            hints: ["Boundary $y = -x + 4$.", "$\\le$: solid line, shaded below."], why: "Boundary $y = -x + 4$, solid, shaded below." },
          { type: "learn", kicker: "Not in y = form",
            prompt: "If $y$ isn't alone, get it alone first — and remember the one rule from Unit 2.",
            scene: { type: "walk", rows: [
              { m: "2x - 3y < 6", say: "" },
              { m: "-3y < -2x + 6", say: "Take $2x$ from both sides." },
              { m: "y > \\frac{2}{3}x - 2", say: "Divide by $-3$ — a negative, so the sign **flips**." },
              { say: "So it's dashed, shaded **above**. Check with $(0, 0)$: $0 < 6$ ✓, and $(0, 0)$ is above the line ✓." }] },
            gate: true },
          { type: "choice", prompt: "Which inequality does this graph show?", skill: "Inequalities from their graphs",
            scene: region([half(0.5, -1, ">=")]),
            options: [{ t: "$y \\ge \\frac{1}{2}x - 1$" }, { t: "$y > \\frac{1}{2}x - 1$", fb: "The line is solid, so it's included: $\\ge$." },
                      { t: "$y \\le \\frac{1}{2}x - 1$", fb: "The shading is above the line: $y$ is **greater**." }, { t: "$y \\ge 2x - 1$", fb: "Check the slope: up 1 for every 2 across." }],
            answer: 0, why: "Solid line $y = \\frac{1}{2}x - 1$, shaded above: $y \\ge \\frac{1}{2}x - 1$." },
          { type: "choice", prompt: "And this one?", skill: "Inequalities from their graphs",
            scene: region([half(-3, 2, "<")]),
            options: [{ t: "$y < -3x + 2$" }, { t: "$y \\le -3x + 2$", fb: "The line is dashed, so it's left out: strict $<$." },
                      { t: "$y > -3x + 2$", fb: "The shading is below the line." }, { t: "$y < 3x + 2$", fb: "The line falls to the right: its slope is negative." }],
            answer: 0, why: "Dashed $y = -3x + 2$, shaded below: $y < -3x + 2$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Systems of inequalities",
        blurb: "Where two shadings overlap.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Here are $y \\ge x - 2$ (blue) and $y < -x + 3$ (orange). The solutions of the **system** are the points in **both** shadings, where they overlap. Drag the point into that region.",
            scene: { type: "plane", x: [-8, 8], y: [-8, 8], fns: [half(1, -2, ">=", "blue"), half(-1, 3, "<", "orange")],
              points: [{ id: "P", x: 5, y: 6, drag: true, color: "purple" }],
              readout: function (st) { var p = st.pt("P"), a = p.y >= p.x - 2, b = p.y < -p.x + 3;
                return "$" + pt(p.x, p.y) + "$: " + (a ? "✓" : "✗") + " $y \\ge x - 2$, " + (b ? "✓" : "✗") + " $y < -x + 3$" + (a && b ? " — a solution of the system." : "."); },
              goal: function (st) { var p = st.pt("P"); return p.y >= p.x - 2 && p.y < -p.x + 3; } },
            gate: true,
            then: "Points on the solid blue edge count (that one is $\\ge$); points on the dashed orange edge don't." },
          { type: "choice", prompt: "Blue is $y > \\frac{1}{2}x + 1$ and orange is $y \\le -2x - 1$. Which region is the solution of the system?", skill: "Systems of inequalities graphs",
            scene: region([{ f: function (x) { return 0.5 * x + 1; }, color: "blue", strict: true }, { f: function (x) { return -2 * x - 1; }, color: "orange" }],
              { marks: [[-5, 3, "A"], [2, 6, "B"], [4, -2, "C"], [-3, -4, "D"]] }),
            options: [{ t: "A" }, { t: "B", fb: "B is above the blue line but also above the orange one: $y \\le -2x - 1$ fails." },
                      { t: "C", fb: "C is below both lines." }, { t: "D", fb: "D is below the orange line but also below the blue: $y > \\frac{1}{2}x + 1$ fails." }],
            answer: 0, hints: ["You need **above** blue and **below** orange."], why: "A $(-5, 3)$: $3 > -1.5$ ✓ and $3 \\le 9$ ✓." },
          { type: "plane", prompt: "Click a point with whole-number coordinates that solves both $y \\ge x - 2$ and $y < -x + 3$.", skill: "Systems of inequalities graphs",
            x: [-8, 8], y: [-8, 8], fns: [half(1, -2, ">=", "blue"), half(-1, 3, "<", "orange")], click: "point", answer: { point: [0, 0] },
            check: function (st) { var c = st.clicked; if (!c) return { ok: false }; var a = c[1] >= c[0] - 2, b = c[1] < -c[0] + 3;
              return { ok: a && b, say: a && b ? null : !a ? "That point is below $y = x - 2$." : "That point isn't below the dashed line $y = -x + 3$." }; },
            hints: ["Look for where both shadings overlap, to the left of where the lines cross."], why: "Any point in the overlap works — $(0, 0)$, for one: $0 \\ge -2$ and $0 < 3$." },
          { type: "choice", prompt: "For $y \\ge x - 2$ and $y < -x + 3$, is the point where the two lines cross a solution?", skill: "Solutions of systems of inequalities",
            options: [{ t: "No — it's on the dashed line, which isn't included" }, { t: "Yes — it's on both lines", fb: "Being on the lines isn't enough: the orange one is $<$, which leaves its own line out." }],
            answer: 0, why: "The crossing point is on $y = -x + 3$, and $y < -x + 3$ doesn't include that line." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Inequalities from words",
        blurb: "Budgets and limits as inequalities — and what the shaded points mean.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "A budget",
            prompt: "Words like **at most**, **no more than** and **up to** mean $\\le$; **at least** and **no fewer than** mean $\\ge$.",
            scene: { type: "walk", rows: [
              { say: "Hana has \\$40 for a party. Cupcakes are \\$4 and cookies \\$2. She buys $c$ cupcakes and $k$ cookies." },
              { m: "4c + 2k", say: "What she spends." },
              { m: "4c + 2k \\le 40", say: "She can spend **at most** \\$40." }] },
            gate: true },
          { type: "choice", prompt: "Hana spends at most \\$40, with cupcakes at \\$4 and cookies at \\$2. Can she buy $6$ cupcakes and $9$ cookies?", skill: "Two-variable inequalities word problems",
            options: [{ t: "No — that costs \\$42" }, { t: "Yes", fb: "$4(6) + 2(9) = 24 + 18 = 42$, which is more than \\$40." }],
            answer: 0, why: "$4(6) + 2(9) = 42 > 40$." },
          { type: "learn", kicker: "Two limits",
            prompt: "Add a second condition and it's a system: she also wants **at least** 12 things in total.",
            scene: { type: "walk", rows: [
              { m: "4c + 2k \\le 40", say: "The budget." },
              { m: "c + k \\ge 12", say: "At least 12 items." },
              { m: "c \\ge 0, \\; k \\ge 0", say: "And you can't buy a negative number of anything." },
              { say: "Only whole numbers make sense here, so the solutions are the whole-number points in the overlap." }] },
            gate: true },
          { type: "choice", prompt: "With $4c + 2k \\le 40$ and $c + k \\ge 12$, which choice works?", skill: "Systems of inequalities word problems",
            options: [{ t: "4 cupcakes and 10 cookies" }, { t: "8 cupcakes and 6 cookies", fb: "$4(8) + 2(6) = 44$: over budget." },
                      { t: "3 cupcakes and 7 cookies", fb: "That's only 10 items." }],
            answer: 0, why: "$16 + 20 = 36 \\le 40$ ✓ and $4 + 10 = 14 \\ge 12$ ✓." },
          { type: "choice", prompt: "A lift carries at most $900$ kg. Adults count as $75$ kg and children as $40$ kg. Which inequality says a group of $a$ adults and $c$ children is safe?", skill: "Two-variable inequalities word problems",
            options: [{ t: "$75a + 40c \\le 900$" }, { t: "$75a + 40c \\ge 900$", fb: "“At most” means the total can't go over 900: $\\le$." },
                      { t: "$a + c \\le 900$", fb: "That counts people, not kilograms." }, { t: "$40a + 75c \\le 900$", fb: "Adults are the 75 kg ones." }],
            answer: 0, why: "Total weight $75a + 40c$ must be at most 900." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 1, blurb: "Testing points in inequalities and systems of inequalities.", skills: ["a7-sol-alg", "a7-sol-graph", "a7-sol-sys"], per: 2 },
      { title: "Quiz 2", after: 3, blurb: "Graphing inequalities, reading them from graphs, and systems.", skills: ["a7-graph", "a7-from-graph", "a7-sys-graph"], per: 2 },
      { title: "Quiz 3", after: 4, blurb: "Inequalities and systems from real limits.", skills: ["a7-words", "a7-sys-words"], per: 3 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Solutions of an inequality in two letters",
        say: ["A pair $(x, y)$ is a solution if it makes the inequality true. Put the numbers in and check.",
              "All the solutions fill a **half-plane**: one side of the boundary line you get by replacing the sign with $=$."],
        eg: { q: "Is $(3, 1)$ a solution of $2x - y \\ge 5$?", rows: [["2(3) - 1 = 5", ""], ["5 \\ge 5", "True — “or equal to” allows it."]] },
        watch: "With a strict $>$ or $<$, a point exactly on the boundary is **not** a solution." },
      { t: "Graphing an inequality",
        keys: [["Boundary", "the line $y = mx + b$, from the inequality with $=$"], ["$<$ or $>$", "dashed — the line isn't included"], ["$\\le$ or $\\ge$", "solid — the line is included"],
               ["$y >$ or $y \\ge$", "shade above"], ["$y <$ or $y \\le$", "shade below"]],
        say: ["If you're unsure of the side, test a point off the line — $(0, 0)$ if the line doesn't go through it — and shade the side where it works."],
        eg: { q: "Graph $2x - 3y < 6$.", rows: [["-3y < -2x + 6", "Take $2x$ from both sides."], ["y > \\frac{2}{3}x - 2", "Divide by $-3$ and flip the sign."]], a: "Dashed line, shaded above." },
        watch: "Dividing by a negative flips the sign — and so flips which side is shaded." },
      { t: "Reading an inequality from its graph",
        say: ["Write the boundary's equation from its slope and intercept. Then the sign: shaded above means $y >$, below means $y <$; add “or equal to” if the line is solid."] },
      { t: "Systems of inequalities",
        say: ["The solutions of a system are the points in **every** shading at once — the overlap.",
              "A point on a solid edge counts; a point on a dashed edge doesn't. The corner where the lines cross counts only if both lines are solid."] },
      { t: "Inequalities from words",
        keys: [["at most, no more than, up to", "$\\le$"], ["at least, no fewer than", "$\\ge$"], ["more than, less than", "$>$, $<$"]],
        say: ["Write what's being limited — money spent, weight carried — as an expression, and compare it with the limit. Several limits make a system.",
              "Quantities like people or cupcakes can't be negative or fractions, so only whole-number points in the region make sense."],
        eg: { q: "Cupcakes \\$4, cookies \\$2, at most \\$40.", rows: [["4c + 2k \\le 40", "Spending, compared with the budget."]] } }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a7-sol-alg", title: "Solutions of inequalities: algebraic", lesson: 1,
        gen: function (R) {
          var A = R.nz(-5, 5), B = R.nz(-5, 5), x = R.int(-5, 5), y = R.int(-5, 5), r = R.pick(["<", ">", "<=", ">="]);
          var v = A * x + B * y, k = R.int(0, 2), C = k === 0 ? v : k === 1 ? v + R.int(1, 5) : v - R.int(1, 5);
          var tex = poly([[A, "x"], [B, "y"]]) + " " + relTex(r) + " " + C, ok = holds(r, v, C);
          return mc(R, { prompt: "Is $" + pt(x, y) + "$ a solution of $" + tex + "$?", right: ok ? "Yes" : "No",
            wrong: [{ t: ok ? "No" : "Yes", fb: "Put the point in: $" + poly([[A, "x"], [B, "y"]]).replace(/x/, "(" + x + ")").replace(/y/, "(" + y + ")") + " = " + v + "$, and $" + v + " " + relTex(r) + " " + C + "$ is " + (ok ? "true" : "false") + "." }],
            keep: true, hints: ["Put $x = " + x + "$ and $y = " + y + "$ in and see whether the inequality is true."],
            why: "$" + v + " " + relTex(r) + " " + C + "$ is " + (ok ? "true" : "false") + (k === 0 ? (r.length === 2 ? " — “or equal to” allows it." : " — equal isn't enough for a strict sign.") : ".") });
        } },
      { id: "a7-sol-graph", title: "Solutions of inequalities: graphical", lesson: 1,
        gen: function (R) {
          var m = R.pick([1, -1, 2, -2, 0.5, -0.5]), b = R.int(-3, 3), r = R.pick(["<", ">", "<=", ">="]);
          var up = r[0] === ">", pts = [], x;
          // one inside, one outside, and a third: on the line if strict, else outside
          function at(xv, off) { return [xv, m * xv + b + off]; }
          var xs = R.shuffle([-5, -3, -1, 1, 3, 5]).filter(function (z) { return (m * z) % 1 === 0; });
          var inP = at(xs[0], up ? R.int(2, 4) : -R.int(2, 4)), outP = at(xs[1], up ? -R.int(2, 4) : R.int(2, 4));
          var third = r.length === 1 ? at(xs[2], 0) : at(xs[2], up ? -R.int(2, 3) : R.int(2, 3));
          pts = [inP, outP, third].filter(function (p) { return Math.abs(p[1]) <= 7.5; });
          if (pts.length < 3) { inP = [0, b + (up ? 2 : -2)]; outP = [0, b + (up ? -3 : 3)]; third = r.length === 1 ? [2, m * 2 + b] : [2, m * 2 + b + (up ? -2 : 2)]; pts = [inP, outP, third]; }
          var order = R.shuffle([0, 1, 2]), names = ["A", "B", "C"], lab = {};
          order.forEach(function (k, i) { lab[k] = names[i]; });
          return mc(R, { prompt: "The shaded region shows $" + ineqTex(m, b, r) + "$. Which point is a solution?",
            scene: region([half(m, b, r)], { marks: pts.map(function (p, i) { return [p[0], p[1], lab[i]]; }) }),
            right: lab[0], wrong: [{ t: lab[1], fb: "Point " + lab[1] + " is outside the shading." },
                                   { t: lab[2], fb: r.length === 1 ? "Point " + lab[2] + " is on the dashed line — the boundary isn't included." : "Point " + lab[2] + " is outside the shading." }],
            hints: ["Solutions are in the shaded region, or on the line if it's solid."], why: "Point " + lab[0] + " $" + pt(inP[0], inP[1]) + "$ is in the shaded region." });
        } },
      { id: "a7-sol-sys", title: "Solutions of systems of inequalities", lesson: 1,
        gen: function (R) {
          var m1 = R.nz(-3, 3), b1 = R.int(-4, 4), m2 = R.nz(-3, 3), b2 = R.int(-4, 4), r1 = R.pick(["<", ">", "<=", ">="]), r2 = R.pick(["<", ">", "<=", ">="]);
          while (m2 === m1) m2 = R.nz(-3, 3);
          var x = R.int(-4, 4), y = R.int(-6, 6), a = holds(r1, y, m1 * x + b1), c = holds(r2, y, m2 * x + b2), ok = a && c;
          return mc(R, { prompt: "Is $" + pt(x, y) + "$ a solution of the system $" + ineqTex(m1, b1, r1) + "$ and $" + ineqTex(m2, b2, r2) + "$?",
            right: ok ? "Yes" : "No", wrong: [{ t: ok ? "No" : "Yes", fb: "First: $" + y + " " + relTex(r1) + " " + num(m1 * x + b1) + "$ is " + (a ? "true" : "false") + ". Second: $" + y + " " + relTex(r2) + " " + num(m2 * x + b2) + "$ is " + (c ? "true" : "false") + ". A solution needs both." }],
            keep: true, hints: ["Test the point in each inequality. It has to pass both."],
            why: "First: $" + y + " " + relTex(r1) + " " + num(m1 * x + b1) + "$ " + (a ? "✓" : "✗") + ". Second: $" + y + " " + relTex(r2) + " " + num(m2 * x + b2) + "$ " + (c ? "✓" : "✗") + "." });
        } },
      { id: "a7-graph", title: "Graphs of inequalities", lesson: 2,
        gen: function (R) {
          var m = R.pick([1, -1, 2, -2, 0.5, -0.5, 1.5, 3, -3]), b = R.int(-5, 5), r = R.pick(["<", ">", "<=", ">="]);
          var tex, how;
          if (R.chance(0.35) && m % 1 === 0) {        // written with the x on the left, sometimes needing a flip
            var neg = R.chance(0.5), k = neg ? -1 : 1;
            // k·y r' k·(mx + b) rearranged as  (−k·m)x + k·y r' k·b
            var rr = neg ? flip(r) : r;
            tex = poly([[-k * m, "x"], [k, "y"]]) + " " + relTex(rr) + " " + (k * b);
            how = "Get $y$ alone: $" + ineqTex(m, b, r) + "$" + (neg ? " (dividing by $-1$ flips the sign)" : "") + ".";
          } else { tex = ineqTex(m, b, r); how = "The boundary is $y = " + rhs(m, b) + "$."; }
          var g = grapher(m, b, r);
          g.prompt = "Graph $" + tex + "$. Set the boundary's slope and intercept, the side to shade, and the kind of line.";
          g.hints = [how, (r[0] === ">" ? "$y >$ or $y \\ge$: shade above." : "$y <$ or $y \\le$: shade below.") + " " + (r.length === 2 ? "“Or equal to”: solid line." : "Strict: dashed line.")];
          g.why = "$" + ineqTex(m, b, r) + "$: " + (r.length === 2 ? "solid" : "dashed") + " line $y = " + rhs(m, b) + "$, shaded " + (r[0] === ">" ? "above" : "below") + ".";
          return g;
        } },
      { id: "a7-from-graph", title: "Two-variable inequalities from their graphs", lesson: 2,
        gen: function (R) {
          var m = R.pick([1, -1, 2, -2, 0.5, -0.5, 3, -3]), b = R.int(-4, 4), r = R.pick(["<", ">", "<=", ">="]);
          var strictSwap = r.length === 2 ? r[0] : r + "=";
          return mc(R, { prompt: "Which inequality does this graph show?", scene: region([half(m, b, r)]), right: "$" + ineqTex(m, b, r) + "$",
            wrong: [{ t: "$" + ineqTex(m, b, strictSwap) + "$", fb: r.length === 2 ? "The line is solid, so it's included: “or equal to”." : "The line is dashed, so it's left out: a strict sign." },
                    { t: "$" + ineqTex(m, b, flip(r)) + "$", fb: "The shading is " + (r[0] === ">" ? "above" : "below") + " the line." },
                    { t: "$" + ineqTex(-m, b, r) + "$", fb: "The line " + (m > 0 ? "rises" : "falls") + " to the right, so its slope is " + (m > 0 ? "positive" : "negative") + "." }],
            hints: ["Find the boundary line's slope and intercept.", "Shaded above means $y >$; solid means “or equal to”."],
            why: (r.length === 2 ? "Solid" : "Dashed") + " line $y = " + rhs(m, b) + "$, shaded " + (r[0] === ">" ? "above" : "below") + ": $" + ineqTex(m, b, r) + "$." });
        } },
      { id: "a7-sys-graph", title: "Systems of inequalities graphs", lesson: 3,
        gen: function (R) {
          var m1 = R.pick([1, 2, 0.5, -0.5]), m2 = m1 > 0 ? R.pick([-1, -2, -3]) : R.pick([1, 2, 3]), x0 = R.pick([-2, 0, 2]), y0 = R.int(-2, 2);
          var b1 = y0 - m1 * x0, b2 = y0 - m2 * x0, r1 = R.pick(["<", ">", "<=", ">="]), r2 = R.pick(["<", ">", "<=", ">="]);
          var fs = [half(m1, b1, r1, "blue"), half(m2, b2, r2, "orange")];
          function inside(x, y) { return holds(r1, y, m1 * x + b1) && holds(r2, y, m2 * x + b2); }
          var q = quadrantPoints(m1, b1, m2, b2), want = (r1[0] === ">" ? "a" : "b") + (r2[0] === ">" ? "a" : "b");
          var ans = q[want] ? [q[want].x, q[want].y] : [x0, y0];
          if (R.chance(0.5) && q.aa && q.ab && q.ba && q.bb) {
            var keys = R.shuffle(["aa", "ab", "ba", "bb"]), names = ["A", "B", "C", "D"], lab = {};
            keys.forEach(function (k, i) { lab[k] = names[i]; });
            return mc(R, { prompt: "Blue is $" + ineqTex(m1, b1, r1) + "$ and orange is $" + ineqTex(m2, b2, r2) + "$. Which labelled point is in the solution of the system?",
              scene: region([{ f: fs[0].f, color: "blue", strict: fs[0].strict }, { f: fs[1].f, color: "orange", strict: fs[1].strict }], { marks: keys.map(function (k) { return [q[k].x, q[k].y, lab[k]]; }) }),
              right: lab[want], wrong: keys.filter(function (k) { return k !== want; }).map(function (k) {
                return { t: lab[k], fb: "Point " + lab[k] + " is " + (k[0] === "a" ? "above" : "below") + " the blue line and " + (k[1] === "a" ? "above" : "below") + " the orange one." }; }),
              hints: ["You need " + (r1[0] === ">" ? "above" : "below") + " blue and " + (r2[0] === ">" ? "above" : "below") + " orange."],
              why: "Point " + lab[want] + " $" + pt(ans[0], ans[1]) + "$ satisfies both." });
          }
          return { type: "plane", prompt: "Click a point with whole-number coordinates that solves both $" + ineqTex(m1, b1, r1) + "$ (blue) and $" + ineqTex(m2, b2, r2) + "$ (orange).",
            x: [-8, 8], y: [-8, 8], fns: fs, click: "point", answer: { point: ans },
            check: function (st) { var c = st.clicked; if (!c) return { ok: false };
              var a = holds(r1, c[1], m1 * c[0] + b1), b = holds(r2, c[1], m2 * c[0] + b2);
              return { ok: a && b, say: a && b ? null : !a && !b ? "That point fails both." : !a ? "That point fails the blue inequality." : "That point fails the orange inequality." }; },
            hints: ["The solution is the overlap of the two shadings."], why: "$" + pt(ans[0], ans[1]) + "$ is in the overlap, for one." };
        } },
      { id: "a7-words", title: "Two-variable inequalities word problems", lesson: 4,
        gen: function (R) {
          var T = R.pick([
            function () { var p = R.pick([3, 4, 5]), q = R.pick([1.5, 2, 2.5]), B = R.pick([30, 40, 50, 60]); return { set: "Sofia has at most \\$" + B + " to spend on notebooks at \\$" + p + " and pens at \\$" + money(q) + ". She buys $n$ notebooks and $p$ pens.", a: p, b: q, u: "n", v: "p", r: "<=", B: B, unit: "dollars" }; },
            function () { var p = R.pick([75, 80]), q = R.pick([30, 40]), B = R.pick([600, 800, 900]); return { set: "A lift carries at most $" + B + "$ kg. Adults count as $" + p + "$ kg and children as $" + q + "$ kg. The group has $a$ adults and $c$ children.", a: p, b: q, u: "a", v: "c", r: "<=", B: B, unit: "kg" }; },
            function () { var p = R.pick([12, 15]), q = R.pick([8, 10]), B = R.pick([300, 360, 420]); return { set: "A club needs to raise at least \\$" + B + ". It earns \\$" + p + " per T-shirt and \\$" + q + " per cap sold: $t$ T-shirts and $c$ caps.", a: p, b: q, u: "t", v: "c", r: ">=", B: B, unit: "dollars" }; },
            function () { var p = R.pick([2, 3]), q = R.pick([1, 1.5]), B = R.pick([20, 24, 30]); return { set: "Jay trains for at least $" + B + "$ hours a week, in runs of $" + p + "$ hours and swims of $" + num(q) + "$ hours: $r$ runs and $s$ swims.", a: p, b: q, u: "r", v: "s", r: ">=", B: B, unit: "hours" }; }])();
          var lhs = poly([[T.a, T.u], [T.b, T.v]]);
          if (R.chance(0.5)) return mc(R, { prompt: T.set + " Which inequality describes the situation?", right: "$" + lhs + " " + relTex(T.r) + " " + T.B + "$",
            wrong: [{ t: "$" + lhs + " " + relTex(flip(T.r)) + " " + T.B + "$", fb: T.r === "<=" ? "“At most” means it can't go over: $\\le$." : "“At least” means it can't fall short: $\\ge$." },
                    { t: "$" + T.u + " + " + T.v + " " + relTex(T.r) + " " + T.B + "$", fb: "That counts items, but the limit is in " + T.unit + "." },
                    { t: "$" + poly([[T.b, T.u], [T.a, T.v]]) + " " + relTex(T.r) + " " + T.B + "$", fb: "Each amount multiplies its own letter." }],
            hints: ["Write the total " + T.unit + " as an expression, then compare it with " + T.B + "."], why: "$" + lhs + "$ is the total, and it must be " + (T.r === "<=" ? "at most" : "at least") + " " + T.B + "." });
          var u = R.int(1, Math.floor(T.B / T.a)), v = Math.max(0, Math.round((T.B - T.a * u) / T.b) + R.pick([-2, -1, 1, 2]));
          var tot = T.a * u + T.b * v, ok = holds(T.r, tot, T.B);
          return mc(R, { prompt: T.set + " Does $" + T.u + " = " + u + "$ and $" + T.v + " = " + v + "$ fit the limit?", right: ok ? "Yes" : "No",
            wrong: [{ t: ok ? "No" : "Yes", fb: "The total is $" + T.a + "(" + u + ") + " + num(T.b) + "(" + v + ") = " + num(tot) + "$, which is " + (ok ? "" : "not ") + (T.r === "<=" ? "at most " : "at least ") + T.B + "." }],
            keep: true, hints: ["Work out $" + lhs + "$ with those numbers."], why: "$" + num(tot) + " " + relTex(T.r) + " " + T.B + "$ is " + (ok ? "true" : "false") + "." });
        } },
      { id: "a7-sys-words", title: "Systems of inequalities word problems", lesson: 4,
        gen: function (R) {
          var p = R.pick([3, 4, 5]), q = R.pick([1, 2]), B = R.pick([40, 50, 60]), N = R.pick([10, 12, 15]);
          var set = "A school fair stall sells juice at \\$" + p + " and fruit at \\$" + q + ". The stall must take at least \\$" + B + " but has only $" + (N + 8) + "$ items to sell. It sells $j$ juices and $f$ fruits.";
          var sys = "$" + poly([[p, "j"], [q, "f"]]) + " \\ge " + B + "$ and $j + f \\le " + (N + 8) + "$";
          if (R.chance(0.4)) return mc(R, { prompt: set + " Which system describes it?", right: sys,
            wrong: [{ t: "$" + poly([[p, "j"], [q, "f"]]) + " \\le " + B + "$ and $j + f \\le " + (N + 8) + "$", fb: "“At least” \\$" + B + " means the takings are $\\ge$ " + B + "." },
                    { t: "$" + poly([[p, "j"], [q, "f"]]) + " \\ge " + B + "$ and $j + f \\ge " + (N + 8) + "$", fb: "It has **only** " + (N + 8) + " items, so it can sell at most that many." },
                    { t: "$j + f \\ge " + B + "$ and $" + poly([[p, "j"], [q, "f"]]) + " \\le " + (N + 8) + "$", fb: "The money and the count are mixed up." }],
            hints: ["One inequality for the money, one for the number of items."], why: "Takings $" + poly([[p, "j"], [q, "f"]]) + "$ must be at least " + B + "; items $j + f$ at most " + (N + 8) + "." });
          function fits(j, f) { return p * j + q * f >= B && j + f <= N + 8; }
          var good = null, bad = [];
          for (var t = 0; t < 200 && (good === null || bad.length < 2); t++) {
            var j = R.int(0, N + 8), f = R.int(0, N + 8 - j + 3);
            if (fits(j, f)) { if (!good) good = [j, f]; }
            else if (bad.length < 2 && !bad.some(function (b) { return b[0] === j && b[1] === f; })) bad.push([j, f]);
          }
          if (!good) good = [N + 8, 0];
          function why(j, f) { var m = p * j + q * f; return m < B ? "It takes only \\$" + m + ", short of \\$" + B + "." : "That's " + (j + f) + " items — more than the " + (N + 8) + " it has."; }
          return mc(R, { prompt: set + " Which of these is possible?", right: good[0] + " juices and " + good[1] + " fruits",
            wrong: bad.map(function (b) { return { t: b[0] + " juices and " + b[1] + " fruits", fb: why(b[0], b[1]) }; }),
            hints: ["Test each choice in both conditions: the takings and the number of items."],
            why: "$" + p + "(" + good[0] + ") + " + q + "(" + good[1] + ") = " + (p * good[0] + q * good[1]) + " \\ge " + B + "$ and $" + (good[0] + good[1]) + " \\le " + (N + 8) + "$." });
        } }
    ]
  });
})();
