/* ==========================================================================
   Algebra I — Unit 10: Absolute value & piecewise functions. See lab/core.js.

   Written the way Units 1–9 are. Absolute value is met as distance from
   zero, and its graph as a V built from a table. Every change to it is then
   something a student does with a slider — slide it (h and k), stretch or
   flip it (a) — before being asked to read an equation off a graph or build
   one on the plane. Piecewise functions come last: rules in pieces, step
   functions with their open and closed ends, and reading a definition from
   a graph.

   Four lessons, following Khan Academy's topics for the unit. Six skills
   (Khan's list), two quizzes, the unit test at the end, and notes that put
   the unit on one page.
   Standards: HSF.IF.C.7.b, HSF.BF.B.3, HSF.IF.A.2.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, frac = L.frac;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function paren(v) { return v < 0 ? "(" + num(v) + ")" : num(v); }
  function nears(ans, list) { return list.filter(function (z) { return isFinite(z.v) && Math.abs(z.v - ans) > 1e-9; }); }
  function aTex(a) { return a === 1 ? "" : a === -1 ? "-" : a % 1 ? (a < 0 ? "-" : "") + "\\frac{1}{" + Math.round(1 / Math.abs(a)) + "}" : num(a); }
  function inner(h) { return "|x" + (h === 0 ? "" : h > 0 ? " - " + h : " + " + -h) + "|"; }
  function absTex(a, h, k) { return "y = " + aTex(a) + inner(h) + (k === 0 ? "" : k > 0 ? " + " + k : " - " + -k); }
  function absTyped(a, h, k) { return "y = " + (a === 1 ? "" : a === -1 ? "-" : a % 1 ? "(" + (a < 0 ? "-" : "") + "1/" + Math.round(1 / Math.abs(a)) + ")" : a) + inner(h) + (k === 0 ? "" : k > 0 ? " + " + k : " - " + -k); }
  function absF(a, h, k) { return function (x) { return a * Math.abs(x - h) + k; }; }
  var EQ_KEYS = [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$|\\,|$", "||", -1], ["$-$", "-"], ["$+$", "+"], ["$\\frac{a}{b}$", "/"], ["$($", "("], ["$)$", ")"]];
  function vScene(a, h, k, o) {
    o = o || {};
    return { type: "plane", x: [-8, 8], y: [-8, 8], fns: [{ f: absF(a, h, k), color: "blue" }].concat(o.more || []),
      marks: (o.marks || []).map(function (p) { return { x: p[0], y: p[1], label: p[2] != null ? p[2] : pt(p[0], p[1]), color: p[3] || "ink" }; }) };
  }
  /* Build y = a|x − h| + k on sliders. `which` says which sliders to show. */
  function sliders(a, h, k, which) {
    var P = { a: { v: 1, min: -3, max: 3, step: 0.5, label: "$a$ (stretch)" }, h: { v: 0, min: -6, max: 6, step: 1, label: "$h$ (left–right)" }, k: { v: 0, min: -6, max: 6, step: 1, label: "$k$ (up–down)" } };
    Object.keys(P).forEach(function (n) { if (which.indexOf(n) < 0) P[n].fixed = true; });
    return { type: "plane", x: [-8, 8], y: [-8, 8], params: P,
      fns: [{ f: function (x) { return Math.abs(x); }, color: "ink", dashed: true }, { f: function (x, p) { return p.a * Math.abs(x - p.h) + p.k; }, color: "blue" }],
      marks: [{ x: function (p) { return p.h; }, y: function (p) { return p.k; }, color: "orange", label: function (p) { return "(" + num(p.h) + ", " + num(p.k) + ")"; } }],
      readout: function (st) { var p = st.params; return p.a === 0 ? "With $a = 0$ it's flat: $y = " + num(p.k) + "$." : "$" + absTex(p.a, p.h, p.k) + "$"; },
      answer: { params: { a: a, h: h, k: k } },
      check: function (st) {
        var p = st.params;
        if (p.h !== h || p.k !== k) return { ok: false, say: "The corner (the vertex) should be at $" + pt(h, k) + "$. Yours is at $" + pt(p.h, p.k) + "$." };
        if (p.a !== a) return { ok: false, say: p.a * a < 0 ? "Right place — but it should open " + (a > 0 ? "up" : "down") + "." : "Right place and direction — now the steepness: $a = " + num(a) + "$." };
        return { ok: true };
      } };
  }
  // A piecewise definition, one row per piece.
  function pwBlock(name, pieces) {
    return name + '<div class="lb-pw">' + pieces.map(function (p) { return "<span>$" + p[0] + "$</span><span>if $" + p[1] + "$</span>"; }).join("") + "</div>";
  }

  L.unit("alg", 10, {
    title: "Absolute value & piecewise functions",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "The V of absolute value",
        blurb: "Absolute value as distance, its V-shaped graph, and sliding it around.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "The **absolute value** of a number, written $|x|$, is its distance from $0$ — so it is never negative: $|3| = 3$ and $|-3| = 3$. Here is $y = |x|$ plotted from a table.",
            scene: { type: "walk", rows: [
              { m: "x: \\; -3, -2, -1, 0, 1, 2, 3", say: "Some inputs." },
              { m: "|x|: \\; 3, 2, 1, 0, 1, 2, 3", say: "Their distances from 0." },
              { say: "Plotted, the points make a **V**, with its corner — the **vertex** — at $(0, 0)$." }] },
            gate: true },
          { type: "learn", kicker: "The graph",
            prompt: "The right arm is the line $y = x$; the left arm is $y = -x$. Both climb 1 for every 1 away from the vertex.",
            scene: vScene(1, 0, 0, { marks: [[0, 0, "vertex (0, 0)", "orange"], [-3, 3], [3, 3]] }) },
          { type: "learn", kicker: "Sliding it",
            prompt: "Now $y = |x - h| + k$. Move the sliders and watch the vertex.",
            scene: sliders(1, 3, 2, ["h", "k"]), gate: true,
            then: "The vertex moves to $(h, k)$: $k$ moves it up, and $h$ moves it **right**. So $y = |x - 3|$ is shifted right 3, and $y = |x + 3|$ — which is $|x - (-3)|$ — is shifted **left** 3. The sign inside is the opposite of the direction." },
          { type: "choice", prompt: "How does the graph of $y = |x + 4|$ compare with $y = |x|$?", skill: "Shift absolute value graphs",
            options: [{ t: "Shifted left 4" }, { t: "Shifted right 4", fb: "$x + 4 = x - (-4)$: $h = -4$, so it moves left." }, { t: "Shifted up 4", fb: "The 4 is inside the bars, so it moves sideways." }],
            answer: 0, why: "$|x + 4| = |x - (-4)|$: the vertex is at $(-4, 0)$." },
          { type: "plane", prompt: "Graph $y = |x - 2| - 3$ by moving the vertex.", skill: "Shift absolute value graphs",
            params: sliders(1, 2, -3, ["h", "k"]).params, fns: sliders(1, 2, -3, ["h", "k"]).fns, marks: sliders(1, 2, -3, ["h", "k"]).marks,
            readout: sliders(1, 2, -3, ["h", "k"]).readout, answer: sliders(1, 2, -3, ["h", "k"]).answer, check: sliders(1, 2, -3, ["h", "k"]).check, x: [-8, 8], y: [-8, 8],
            hints: ["The vertex is at $(h, k)$.", "$|x - 2|$: right 2. $- 3$: down 3."], why: "Vertex at $(2, -3)$." },
          { type: "equation", prompt: "Write the equation of this graph. (Type the bars with the $|\\,|$ key.)", answer: "y = |x + 2| - 3", skill: "Shift absolute value graphs",
            scene: vScene(1, -2, -3, { marks: [[-2, -3, "", "orange"]] }), keys: EQ_KEYS,
            near: [{ v: "y = |x - 2| - 3", fb: "The vertex is at $x = -2$: that's $|x - (-2)| = |x + 2|$." }, { v: "y = |x + 2| + 3", fb: "The vertex is below the axis, at $y = -3$." }],
            hints: ["Where is the vertex?", "Vertex $(-2, -3)$: $h = -2$, $k = -3$."], why: "$y = |x + 2| - 3$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Stretching and flipping",
        blurb: "What the number in front does: steeper, wider, upside down.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Put a number in front: $y = a|x|$. Move the slider.",
            scene: sliders(2, 0, 0, ["a"]), gate: true,
            then: "The arms now climb $a$ for every 1 across. $a > 1$ makes the V **steeper**; $0 < a < 1$ makes it **wider**; a **negative** $a$ flips it upside down, so it opens downward." },
          { type: "choice", prompt: "Which graph is wider: $y = 3|x|$ or $y = \\frac{1}{2}|x|$?", skill: "Scale & reflect absolute value graphs",
            options: [{ t: "$y = \\frac{1}{2}|x|$" }, { t: "$y = 3|x|$", fb: "$3|x|$ climbs 3 for each 1 across — steeper, so narrower." }], answer: 0,
            why: "$\\frac{1}{2}|x|$ climbs only a half for each 1 across." },
          { type: "choice", prompt: "Which equation is graphed?", skill: "Scale & reflect absolute value graphs",
            scene: vScene(-2, 0, 0),
            options: [{ t: "$y = -2|x|$" }, { t: "$y = 2|x|$", fb: "It opens **downward**, so $a$ is negative." }, { t: "$y = -\\frac{1}{2}|x|$", fb: "From the vertex, one step across goes 2 down — steeper than a half." }],
            answer: 0, why: "It opens down and falls 2 for each 1 across: $a = -2$." },
          { type: "plane", prompt: "Make the graph of $y = -\\frac{1}{2}|x|$.", skill: "Scale & reflect absolute value graphs",
            params: sliders(-0.5, 0, 0, ["a"]).params, fns: sliders(-0.5, 0, 0, ["a"]).fns, marks: sliders(-0.5, 0, 0, ["a"]).marks,
            readout: sliders(-0.5, 0, 0, ["a"]).readout, answer: sliders(-0.5, 0, 0, ["a"]).answer, check: sliders(-0.5, 0, 0, ["a"]).check, x: [-8, 8], y: [-8, 8],
            hints: ["Negative: opens down. A half: wider than $|x|$."], why: "$a = -\\frac{1}{2}$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "y = a|x − h| + k",
        blurb: "All three at once: graphing any absolute value function, and reading one off a graph.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Read the vertex and the stretch, then draw.",
            scene: { type: "walk", rows: [
              { m: "y = -2|x - 1| + 4", say: "" },
              { m: "\\text{vertex } (1, 4)", say: "$h = 1$, $k = 4$." },
              { m: "a = -2", say: "It opens down, falling 2 for each 1 away from the vertex." },
              { m: "(0, 2), \\; (2, 2)", say: "One step either side of the vertex, 2 lower." }] },
            gate: true },
          { type: "plane", prompt: "Graph $y = 2|x + 1| - 3$.", skill: "Graph absolute value functions",
            params: sliders(2, -1, -3, ["a", "h", "k"]).params, fns: sliders(2, -1, -3, ["a", "h", "k"]).fns, marks: sliders(2, -1, -3, ["a", "h", "k"]).marks,
            readout: sliders(2, -1, -3, ["a", "h", "k"]).readout, answer: sliders(2, -1, -3, ["a", "h", "k"]).answer, check: sliders(2, -1, -3, ["a", "h", "k"]).check, x: [-8, 8], y: [-8, 8],
            hints: ["Vertex $(-1, -3)$.", "$a = 2$: opens up, twice as steep."], why: "$a = 2$, vertex $(-1, -3)$." },
          { type: "pair", prompt: "What is the vertex of $y = 3|x + 5| - 1$?", answer: [-5, -1], skill: "Graph absolute value functions",
            hints: ["It's $(h, k)$, and $x + 5 = x - (-5)$."], why: "$h = -5$, $k = -1$." },
          { type: "equation", prompt: "Write the equation of this graph.", answer: "y = -|x - 2| + 5", skill: "Graph absolute value functions",
            scene: vScene(-1, 2, 5, { marks: [[2, 5, "", "orange"], [3, 4], [1, 4]] }), keys: EQ_KEYS,
            near: [{ v: "y = |x - 2| + 5", fb: "It opens downward, so $a$ is negative." }, { v: "y = -|x + 2| + 5", fb: "The vertex is at $x = 2$: $|x - 2|$." }],
            hints: ["Vertex $(2, 5)$.", "It opens down and drops 1 for each 1 across: $a = -1$."], why: "$y = -|x - 2| + 5$." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Functions in pieces",
        blurb: "Different rules on different stretches: piecewise and step functions.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A **piecewise function** uses different rules for different inputs. " + pwBlock("$f(x) =$", [["x + 3", "x < 0"], ["3 - 2x", "x \\ge 0"]]) + "<br>To evaluate it, first find which condition the input meets, then use that piece's rule.",
            scene: { type: "plane", x: [-8, 8], y: [-8, 8],
              fns: [{ f: function (x) { return x + 3; }, color: "blue", domain: [-8, 0] }, { f: function (x) { return 3 - 2 * x; }, color: "orange", domain: [0, 8] }],
              marks: [{ x: 0, y: 3, label: "(0, 3)", color: "orange" }, { x: -2, y: 1, label: "f(−2) = 1", color: "blue" }, { x: 2, y: -1, label: "f(2) = −1", color: "orange" }] } },
          { type: "num", prompt: "Using $f$ above, what is $f(-5)$?", pre: "$f(-5) =$", answer: -2, skill: "Evaluate piecewise functions",
            near: [{ v: 13, fb: "$-5 < 0$, so use the first piece, $x + 3$." }], hints: ["Is $-5$ less than 0, or at least 0?"], why: "$-5 < 0$: $f(-5) = -5 + 3 = -2$." },
          { type: "num", prompt: "And $f(0)$?", pre: "$f(0) =$", answer: 3, skill: "Evaluate piecewise functions",
            hints: ["$0$ meets $x \\ge 0$, so use the second piece."], why: "$f(0) = 3 - 2(0) = 3$." },
          { type: "learn", kicker: "Step functions",
            prompt: "A **step function** is a piecewise function whose pieces are flat. A car park charges \\$3 for up to 1 hour, \\$5 for up to 2 hours, and \\$6 for up to 3 hours. At the ends, a **filled** dot says that end belongs to the step; an **open** dot says it doesn't.",
            scene: { type: "plane", x: [-0.6, 4], y: [-1, 8], axisLabels: ["hours", "$"],
              segs: [[0, 3, 1, 3, "blue"], [1, 5, 2, 5, "blue"], [2, 6, 3, 6, "blue"]],
              marks: [{ x: 0, y: 3, open: true, color: "blue" }, { x: 1, y: 3, color: "blue" }, { x: 1, y: 5, open: true, color: "blue" }, { x: 2, y: 5, color: "blue" }, { x: 2, y: 6, open: true, color: "blue" }, { x: 3, y: 6, color: "blue" }] },
            after: "Exactly 1 hour costs \\$3 (filled dot); a minute more costs \\$5." },
          { type: "num", prompt: "Using the car-park graph, how much does parking for $1.5$ hours cost, in dollars?", pre: "\\$", answer: 5, skill: "Evaluate step functions",
            near: [{ v: 3, fb: "\\$3 only covers up to 1 hour." }], hints: ["Which step covers 1.5 hours?"], why: "1.5 hours is in the second step, from just over 1 to 2 hours: \\$5." },
          { type: "choice", prompt: "Which function is graphed?", skill: "Piecewise functions graphs",
            scene: { type: "plane", x: [-8, 8], y: [-8, 8], fns: [{ f: function (x) { return -1; }, color: "blue", domain: [-8, 2] }, { f: function (x) { return x - 2; }, color: "blue", domain: [2, 8] }],
              marks: [{ x: 2, y: -1, open: true, color: "blue" }, { x: 2, y: 0, color: "blue" }] },
            options: [{ t: pwBlock("", [["-1", "x < 2"], ["x - 2", "x \\ge 2"]]) }, { t: pwBlock("", [["-1", "x \\le 2"], ["x - 2", "x > 2"]]), fb: "At $x = 2$ the flat piece has an open dot, so $x = 2$ belongs to the other piece." },
                      { t: pwBlock("", [["x - 2", "x < 2"], ["-1", "x \\ge 2"]]), fb: "The flat piece is on the left." }],
            answer: 0, why: "Flat at $-1$ up to (not including) $x = 2$; then the line $y = x - 2$, starting with the filled dot at $(2, 0)$." },
          { type: "learn", kicker: "Domain and range",
            prompt: "A piecewise function's domain is all the inputs its pieces cover together; its range, all the outputs they reach. For the car park, the domain is $0 < t \\le 3$ hours and the range is just three prices: $\\{3, 5, 6\\}$." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Shifting, stretching and graphing absolute value functions.", skills: ["a10-shift", "a10-scale", "a10-graph"], per: 2 },
      { title: "Quiz 2", after: 4, blurb: "Evaluating piecewise and step functions, and reading their graphs.", skills: ["a10-eval-pw", "a10-step", "a10-pw-graph"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Absolute value and its graph",
        say: ["$|x|$ is the distance of $x$ from 0, so it is never negative: $|-3| = 3$.",
              "The graph of $y = |x|$ is a V with its **vertex** at $(0, 0)$; each arm rises 1 for every 1 away from the vertex."] },
      { t: "Transforming $y = |x|$",
        keys: [["$y = |x - h|$", "shift right $h$ (left if $h$ is negative: $|x + 3|$ moves left 3)"], ["$y = |x| + k$", "shift up $k$ (down if negative)"],
               ["$y = a|x|$", "$a > 1$ steeper, $0 < a < 1$ wider, $a < 0$ flipped to open down"]],
        say: ["Together, $y = a|x - h| + k$ has its vertex at $(h, k)$, and its arms rise (or fall) $a$ for every 1 across."],
        eg: { q: "Describe $y = -2|x - 1| + 4$.", rows: [["\\text{vertex } (1, 4)", ""], ["a = -2", "Opens down, falling 2 for each 1 away."], ["(0, 2), \\; (2, 2)", "Two more points."]] },
        watch: "The sign inside the bars is the opposite of the direction: $|x + 5|$ moves **left** 5." },
      { t: "Writing the equation from a graph",
        say: ["Read the vertex to get $h$ and $k$. Then step 1 to the right of the vertex and see how far the graph goes up or down: that's $a$ (negative if it opens down)."] },
      { t: "Piecewise functions",
        say: ["A piecewise function uses different rules on different intervals. To evaluate, find which condition the input meets, then use only that piece.",
              "On a graph, a filled dot at the end of a piece means that end is included; an open dot means it isn't.",
              "A **step function** has flat pieces — like prices that jump at each hour."],
        eg: { q: "$f(x) = x + 3$ if $x < 0$, and $3 - 2x$ if $x \\ge 0$. Find $f(0)$.", rows: [["0 \\ge 0", "Use the second piece."], ["3 - 2(0) = 3", ""]] },
        watch: "At a boundary, check which piece has the “or equal to”: only that one applies." }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a10-shift", title: "Shift absolute value graphs", lesson: 1,
        gen: function (R) {
          var h = R.int(-5, 5), k = R.int(-5, 5);
          while (h === 0 && k === 0) k = R.nz(-5, 5);
          if (R.chance(0.5)) {
            var s = sliders(1, h, k, ["h", "k"]);
            s.prompt = "Graph $" + absTex(1, h, k) + "$ by moving the vertex.";
            s.hints = ["The vertex is at $(h, k)$.", h === 0 ? "No shift sideways." : "$" + inner(h) + "$: " + (h > 0 ? "right " + h : "left " + -h) + "."];
            s.why = "Vertex at $" + pt(h, k) + "$.";
            return s;
          }
          return mc(R, { prompt: "Which equation is graphed?", scene: vScene(1, h, k, { marks: [[h, k, "", "orange"]] }), right: "$" + absTex(1, h, k) + "$",
            wrong: [{ t: "$" + absTex(1, -h, k) + "$", fb: "The vertex is at $x = " + h + "$: that's $" + inner(h) + "$ — the sign inside is the opposite." },
                    { t: "$" + absTex(1, h, -k) + "$", fb: "The vertex is " + (k > 0 ? "above" : "below") + " the $x$-axis." },
                    { t: "$" + absTex(1, k, h) + "$", fb: "$h$ moves it sideways and $k$ up or down — these are swapped." }].filter(function (w) { return w.t !== "$" + absTex(1, h, k) + "$"; }),
            hints: ["Where is the vertex? It's $(h, k)$ in $y = |x - h| + k$."], why: "The vertex is $" + pt(h, k) + "$: $" + absTex(1, h, k) + "$." });
        } },
      { id: "a10-scale", title: "Scale & reflect absolute value graphs", lesson: 2,
        gen: function (R) {
          var a = R.pick([2, 3, -1, -2, -3, 0.5, -0.5]);
          if (R.chance(0.4)) { var s = sliders(a, 0, 0, ["a"]); s.prompt = "Make the graph of $" + absTex(a, 0, 0) + "$.";
            s.hints = [a < 0 ? "Negative: it opens downward." : "Positive: it opens upward.", "Each arm climbs (or falls) " + num(Math.abs(a)) + " for every 1 across."]; s.why = "$a = " + num(a) + "$."; return s; }
          var h = R.int(-3, 3), k = R.int(-3, 3);
          var others = [-a, a % 1 ? (a < 0 ? -2 : 2) : (a < 0 ? -0.5 : 0.5), a * 2 > 3 ? a - 1 : a * 2].filter(function (b, i, arr) { return b !== a && arr.indexOf(b) === i && b !== 0; });
          return mc(R, { prompt: "Which equation is graphed?", scene: vScene(a, h, k, { marks: [[h, k, "", "orange"], [h + 1, k + a, pt(h + 1, k + a)]] }), right: "$" + absTex(a, h, k) + "$",
            wrong: others.slice(0, 3).map(function (b) { return { t: "$" + absTex(b, h, k) + "$", fb: b * a < 0 ? "Check the direction: it opens " + (a > 0 ? "up" : "down") + "." : "Step 1 across from the vertex: the graph moves " + num(Math.abs(a)) + " " + (a > 0 ? "up" : "down") + ", not " + num(Math.abs(b)) + "." }; }),
            hints: ["From the vertex $" + pt(h, k) + "$, step 1 to the right. How far up or down does the graph go?"], why: "One step across, " + num(Math.abs(a)) + " " + (a > 0 ? "up" : "down") + ": $a = " + num(a) + "$." });
        } },
      { id: "a10-graph", title: "Graph absolute value functions", lesson: 3,
        gen: function (R) {
          var a = R.pick([1, 2, 3, -1, -2, 0.5, -0.5]), h = R.int(-4, 4), k = R.int(-4, 4);
          if (R.chance(0.55)) { var s = sliders(a, h, k, ["a", "h", "k"]); s.prompt = "Graph $" + absTex(a, h, k) + "$.";
            s.hints = ["Vertex $" + pt(h, k) + "$.", "$a = " + num(a) + "$: " + (a < 0 ? "opens down" : "opens up") + ", " + num(Math.abs(a)) + " per step across."]; s.why = "$a = " + num(a) + "$, vertex $" + pt(h, k) + "$."; return s; }
          return { type: "equation", prompt: "Write the equation of this graph.", answer: absTyped(a, h, k), shown: absTyped(a, h, k),
            scene: vScene(a, h, k, { marks: [[h, k, "", "orange"], [h + 2, k + 2 * a, pt(h + 2, k + 2 * a)]] }), keys: EQ_KEYS,
            near: [{ v: absTyped(a, -h, k), fb: "The sign inside the bars is the opposite of where the vertex is." }, { v: absTyped(-a, h, k), fb: "It opens " + (a > 0 ? "up" : "down") + "." }].filter(function (z) { return z.v !== absTyped(a, h, k); }),
            hints: ["The vertex gives $h$ and $k$: $" + pt(h, k) + "$.", "From the vertex to $" + pt(h + 2, k + 2 * a) + "$: across 2, " + (a > 0 ? "up " : "down ") + num(Math.abs(2 * a)) + "."],
            why: "$" + absTex(a, h, k) + "$." };
        } },
      { id: "a10-eval-pw", title: "Evaluate piecewise functions", lesson: 4,
        gen: function (R) {
          var c = R.int(-3, 3), m1 = R.nz(-3, 3), b1 = R.int(-5, 5), m2 = R.nz(-3, 3), b2 = R.int(-5, 5), incl = R.chance(0.5);
          var pieces = [[poly([[m1, "x"], [b1, ""]]), "x " + (incl ? "\\le" : "<") + " " + c], [poly([[m2, "x"], [b2, ""]]), "x " + (incl ? ">" : "\\ge") + " " + c]];
          var x = R.chance(0.3) ? c : c + R.nz(-4, 4), first = incl ? x <= c : x < c, v = first ? m1 * x + b1 : m2 * x + b2, other = first ? m2 * x + b2 : m1 * x + b1;
          return { type: "num", prompt: pwBlock("$f(x) =$", pieces) + "<br>What is $f(" + x + ")$?", pre: "$f(" + x + ") =$", answer: v,
            near: nears(v, [{ v: other, fb: "That's the other piece. $" + x + "$ meets the condition $" + pieces[first ? 0 : 1][1] + "$." }]),
            hints: ["Which condition does $x = " + x + "$ meet?" + (x === c ? " Look for the “or equal to”." : "")], why: "$x = " + x + "$ meets $" + pieces[first ? 0 : 1][1] + "$, so $f(" + x + ") = " + L.sub(pieces[first ? 0 : 1][0], { x: x }) + " = " + v + "$." };
        } },
      { id: "a10-step", title: "Evaluate step functions", lesson: 4,
        gen: function (R) {
          var n = R.int(3, 4), start = R.int(-6, -2), w = R.pick([2, 3]), vals = [], leftClosed = R.chance(0.5);
          var v = R.int(-5, 1); for (var i = 0; i < n; i++) { vals.push(v); v += R.pick([-3, -2, 1, 2, 3]); if (v > 6) v -= 5; if (v < -6) v += 5; }
          var segs = [], marks = [];
          for (i = 0; i < n; i++) {
            var a = start + i * w, b = a + w;
            segs.push([a, vals[i], b, vals[i], "blue"]);
            marks.push({ x: a, y: vals[i], open: !leftClosed, color: "blue" }, { x: b, y: vals[i], open: leftClosed, color: "blue" });
          }
          var j = R.int(0, n - 1), atEdge = R.chance(0.4) && j > 0, x = atEdge ? start + j * w : start + j * w + R.pick([0.5, 1, 1.5].filter(function (t) { return t < w; }));
          var val = atEdge ? (leftClosed ? vals[j] : vals[j - 1]) : vals[j];
          return { type: "num", prompt: "Here is the graph of a step function $g$. What is $g(" + num(x) + ")$?", pre: "$g(" + num(x) + ") =$", answer: val,
            scene: { type: "plane", x: [-8, 8], y: [-8, 8], segs: segs, marks: marks },
            near: nears(val, atEdge ? [{ v: leftClosed ? vals[j - 1] : vals[j], fb: "At $x = " + num(x) + "$ two steps meet. The **filled** dot is the one that counts." }] : []),
            hints: [atEdge ? "At $x = " + num(x) + "$ two steps meet: which one has the filled dot?" : "Which step is above or below $x = " + num(x) + "$?"],
            why: "At $x = " + num(x) + "$ the " + (atEdge ? "filled dot is at" : "step is at") + " height $" + val + "$." };
        } },
      { id: "a10-pw-graph", title: "Piecewise functions graphs", lesson: 4,
        gen: function (R) {
          var c = R.int(-2, 2), m1 = R.pick([0, 1, -1, 2]), b1 = R.int(-4, 4), m2 = R.pick([1, -1, 0, -2]), b2 = R.int(-4, 4), leftIn = R.chance(0.5);
          while (m1 * c + b1 === m2 * c + b2 && m1 === m2) b2 += 2;
          var y1 = m1 * c + b1, y2 = m2 * c + b2, joined = y1 === y2;
          var scene = { type: "plane", x: [-8, 8], y: [-8, 8], fns: [{ f: function (x) { return m1 * x + b1; }, color: "blue", domain: [-8, c] }, { f: function (x) { return m2 * x + b2; }, color: "blue", domain: [c, 8] }],
            marks: joined ? [{ x: c, y: y1, color: "blue" }] : [{ x: c, y: y1, open: !leftIn, color: "blue" }, { x: c, y: y2, open: leftIn, color: "blue" }] };
          function def(li, s1, s2) { return pwBlock("", [[s1, "x " + (li ? "\\le" : "<") + " " + c], [s2, "x " + (li ? ">" : "\\ge") + " " + c]]); }
          var p1 = poly([[m1, "x"], [b1, ""]]), p2 = poly([[m2, "x"], [b2, ""]]);
          var right = def(leftIn, p1, p2);
          var wrong = [{ t: def(leftIn, p2, p1), fb: "The pieces are swapped: the left of the graph is $y = " + p1 + "$." },
                       { t: def(leftIn, poly([[-m1, "x"], [b1, ""]]), p2), fb: "Check the slope of the left piece." }];
          if (!joined) wrong.push({ t: def(!leftIn, p1, p2), fb: "Look at the dots at $x = " + c + "$: the filled one shows which piece includes it." });
          return mc(R, { prompt: "Which function is graphed?", scene: scene, right: right, wrong: wrong.filter(function (w) { return w.t !== right; }),
            hints: ["Find the equation of each piece, and where the graph switches.", "At the switch, the filled dot belongs to the piece that includes that $x$."],
            why: "Left: $y = " + p1 + "$; right: $y = " + p2 + "$, switching at $x = " + c + "$." });
        } }
    ]
  });
})();
