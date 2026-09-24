/* ==========================================================================
   Algebra I — Unit 5: Forms of linear equations. See lab/core.js.

   Written the way Units 1–4 are. Slope-intercept form is met on a graph
   with two sliders — one tilts the line, one slides it — before it is
   named. Every form is then a way of writing down what you already know
   about a line: its slope and where it crosses the y-axis (slope-intercept),
   a point and a slope (point-slope), or two whole-number intercepts
   (standard). Answers are checked by meaning and by shape: any equation of
   the right line counts, and when a form is asked for, it has to be in it.

   Six lessons, following Khan Academy's topics for the unit. Eleven skills
   (Khan's list), three quizzes, the unit test at the end, and notes that put
   the unit on one page.
   Standards: 8.EE.B.6, 8.F.A.3, 8.F.B.4, HSA.CED.A.2, HSF.IF.C.7.a,
   HSF.LE.A.2.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, frac = L.frac, gcd = L.gcd;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function paren(v) { return v < 0 ? "(" + num(v) + ")" : num(v); }
  function nears(ans, list) { return list.filter(function (z) { return Math.abs(z.v - ans) > 1e-9; }); }
  // (n/d)x as a person writes it.
  function slopeTerm(n, d, v) {
    v = v || "x";
    if (n === 0) return "";
    var g = gcd(n, d); n /= g; d /= g;
    if (d < 0) { n = -n; d = -d; }
    if (d === 1) return poly([[n, v]]);
    return (n < 0 ? "-" : "") + "\\frac{" + Math.abs(n) + "}{" + d + "}" + v;
  }
  function plus(b) { return b === 0 ? "" : b < 0 ? " - " + num(-b) : " + " + num(b); }
  function siTex(n, d, b, yv, xv) { var t = slopeTerm(n, d, xv); return (yv || "y") + " = " + (t ? t + plus(b) : num(b)); }
  // The same, typed: for an answer box.
  function siTyped(n, d, b) {
    var g = gcd(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; }
    var m = d === 1 ? (n === 1 ? "" : n === -1 ? "-" : String(n)) : "(" + n + "/" + d + ")";
    return "y = " + (n === 0 ? "" : m + "x") + (b === 0 ? (n === 0 ? "0" : "") : (b < 0 ? " - " + -b : (n === 0 ? "" : " + ") + b));
  }
  function psTex(x1, y1, n, d) {
    var left = "y" + (y1 === 0 ? "" : y1 < 0 ? " + " + -y1 : " - " + y1);
    var inside = "x" + (x1 === 0 ? "" : x1 < 0 ? " + " + -x1 : " - " + x1);
    var m = frac(n, d);
    return left + " = " + (m === "1" ? "" : m === "-1" ? "-" : m) + (x1 === 0 ? "x" : "(" + inside + ")");
  }
  function stdTex(A, B, C) { return poly([[A, "x"], [B, "y"]]) + " = " + C; }
  function showLine(f, o) {
    o = o || {};
    return { type: "plane", x: o.x || [-10, 10], y: o.y || [-10, 10], gridY: o.gridY, labelEveryY: o.labelEveryY, axisLabels: o.axisLabels,
      fns: [{ f: f, color: "blue" }],
      marks: (o.marks || []).map(function (p) { return { x: p[0], y: p[1], label: p[2] != null ? p[2] : pt(p[0], p[1]), color: p[3] || "ink" }; }) };
  }
  function starts(isOn) {
    var cands = [[[-7, 7], [-3, 7]], [[6, -7], [2, -7]], [[-6, -2], [-6, 5]], [[5, 5], [8, 2]]];
    for (var i = 0; i < cands.length; i++) if (!(isOn(cands[i][0]) && isOn(cands[i][1]))) return cands[i];
    return cands[0];
  }
  // Drag two points onto the line on(x, y).
  function dragLine(on, ans, fb) {
    var s = starts(function (p) { return on(p[0], p[1]); });
    return { type: "plane", x: [-10, 10], y: [-10, 10],
      points: [{ id: "A", x: s[0][0], y: s[0][1], drag: true, color: "orange" }, { id: "B", x: s[1][0], y: s[1][1], drag: true, color: "orange" }],
      lines: [{ through: ["A", "B"], color: "orange" }], answer: { points: { A: ans[0], B: ans[1] } },
      check: function (st) {
        var A = st.pt("A"), B = st.pt("B");
        if (A.x === B.x && A.y === B.y) return { ok: false, say: "Both points are in the same place. A line needs two different points." };
        var a = on(A.x, A.y), b = on(B.x, B.y);
        if (a && b) return { ok: true };
        if (a || b) return { ok: false, say: "One point is on the line and one isn't. Check point " + (a ? "B" : "A") + "." };
        return { ok: false, say: fb };
      } };
  }
  var EQ_KEYS = [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$-$", "-"], ["$+$", "+"], ["$($", "("], ["$)$", ")"], ["$\\frac{a}{b}$", "/"]];
  // A slope n/d with a small denominator, in lowest terms.
  function slope(R, whole) {
    var d = whole ? 1 : R.pick([1, 1, 2, 3, 4]), n = R.nz(-5, 5);
    var g = gcd(n, d); return [n / g, d / g];
  }

  L.unit("alg", 5, {
    title: "Forms of linear equations",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "y = mx + b",
        blurb: "The slope and the y-intercept, read straight off the equation.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Every line that isn't vertical can be written $y = mx + b$. Move the sliders and watch what each number does to the line.",
            scene: { type: "plane", x: [-8, 8], y: [-8, 8], params: { m: { v: 1, min: -4, max: 4, step: 0.5, label: "$m$" }, b: { v: 2, min: -6, max: 6, step: 1, label: "$b$" } },
              fns: [{ f: "m*x + b", color: "blue" }],
              marks: [{ x: 0, y: function (P) { return P.b; }, label: function (P) { return "(0, " + num(P.b) + ")"; }, color: "orange" }],
              readout: function (st) { var P = st.params; return "$" + siTex(P.m * 2, 2, P.b) + "$"; } },
            gate: true,
            then: "$m$ tilts the line — it is the **slope**. $b$ slides it up and down — it is where the line crosses the $y$-axis, the **$y$-intercept** $(0, b)$. This way of writing a line is called **slope-intercept form**." },
          { type: "learn", kicker: "Reading it",
            prompt: "So an equation in this form tells you the slope and $y$-intercept at a glance.",
            scene: { type: "walk", rows: [
              { m: "y = 3x - 5", say: "It's $y = mx + b$ with $m = 3$ and $b = -5$." },
              { m: "m = 3", say: "The slope: up 3 for every 1 across." },
              { m: "(0, -5)", say: "The $y$-intercept. Mind the sign: $- 5$ means $b = -5$." }] },
            gate: true },
          { type: "num", prompt: "What is the slope of $y = -2x + 7$?", pre: "$m =$", answer: -2, skill: "Slope-intercept intro",
            near: [{ v: 7, fb: "$7$ is $b$, the $y$-intercept. The slope is the number multiplying $x$." }, { v: 2, fb: "Keep the sign: the $x$ term is $-2x$." }],
            hints: ["The slope is the number in front of $x$."], why: "$m = -2$." },
          { type: "pair", prompt: "What is the $y$-intercept of $y = 4x - 1$? Give it as a point.", answer: [0, -1], skill: "Slope-intercept intro",
            hints: ["It's $(0, b)$."], why: "$b = -1$, so the line crosses the $y$-axis at $(0, -1)$." },
          { type: "learn", kicker: "Less obvious",
            prompt: "Sometimes the equation needs a moment's tidying before $m$ and $b$ show.",
            scene: { type: "walk", rows: [
              { m: "y = 6 - x", say: "Written the usual way round it's $y = -x + 6$: $m = -1$, $b = 6$." },
              { m: "y = \\frac{x}{2}", say: "$\\frac{x}{2}$ is $\\frac{1}{2}x$, and there is no number added: $m = \\frac{1}{2}$, $b = 0$." },
              { m: "2y = 4x + 6", say: "Get $y$ on its own first — divide everything by 2: $y = 2x + 3$." }] },
            gate: true },
          { type: "num", prompt: "What is the slope of $y = 5 - 3x$?", pre: "$m =$", answer: -3, skill: "Slope-intercept intro",
            near: [{ v: 5, fb: "5 is the $y$-intercept here — it just came first." }, { v: 3, fb: "It's $-3x$: the slope is negative." }],
            hints: ["Rewrite it as $y = -3x + 5$."], why: "$y = -3x + 5$, so $m = -3$." },
          { type: "num", prompt: "What is the slope of $3y = 6x - 9$?", pre: "$m =$", answer: 2, skill: "Slope-intercept intro",
            near: [{ v: 6, fb: "Get $y$ on its own first: divide everything by 3." }],
            hints: ["Divide every term by 3: $y = 2x - 3$."], why: "$y = 2x - 3$, so $m = 2$." },
          { type: "learn", kicker: "In a story",
            prompt: "A bucket holds $4$ litres and a tap fills it at $2$ litres a minute. After $t$ minutes it holds $W = 2t + 4$ litres. <br><br>The $2$ is the slope — the **rate**, litres per minute. The $4$ is the $y$-intercept — the **starting** amount, at $t = 0$." },
          { type: "choice", prompt: "A plant's height in cm after $w$ weeks is $h = 1.5w + 8$. What does the $1.5$ mean?", skill: "Linear equations word problems",
            options: [{ t: "It grows 1.5 cm every week" }, { t: "It was 1.5 cm tall at the start", fb: "The starting height is $b = 8$ cm. $1.5$ multiplies the weeks, so it's a rate." },
                      { t: "It grows for 1.5 weeks", fb: "$1.5$ is in cm per week — how fast, not how long." }],
            answer: 0, why: "$1.5$ is the slope: cm of height per week." },
          { type: "num", prompt: "Same plant, $h = 1.5w + 8$. How tall is it after $6$ weeks, in cm?", answer: 17, skill: "Linear equations word problems",
            near: [{ v: 9, fb: "Multiply first: $1.5 \\times 6 = 9$, then add the 8." }], hints: ["Put $w = 6$ in."], why: "$1.5(6) + 8 = 9 + 8 = 17$ cm." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Graphing from y = mx + b",
        blurb: "Start at b on the y-axis, then climb by the slope.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Slope-intercept form is a set of directions for drawing the line.",
            scene: { type: "walk", rows: [
              { m: "y = \\frac{2}{3}x - 1", say: "Graph this line." },
              { m: "(0, -1)", say: "Start at the $y$-intercept, $b = -1$." },
              { m: "\\text{up } 2, \\text{ right } 3", say: "The slope $\\frac{2}{3}$: rise 2 for run 3." },
              { m: "(3, 1)", say: "A second point. Join them, and carry on in both directions." }] },
            gate: true },
          { type: "plane", prompt: "Graph $y = 2x - 3$: drag both points onto the line.", skill: "Graph from slope-intercept form",
            points: [{ id: "A", x: -6, y: 6, drag: true, color: "orange" }, { id: "B", x: -2, y: 6, drag: true, color: "orange" }],
            lines: [{ through: ["A", "B"], color: "orange" }], answer: { points: { A: [0, -3], B: [2, 1] } },
            check: function (st) { var on = function (p) { return p.y === 2 * p.x - 3; }, A = st.pt("A"), B = st.pt("B");
              if (A.x === B.x && A.y === B.y) return { ok: false, say: "Spread the points out." };
              return { ok: on(A) && on(B), say: on(A) || on(B) ? "One is right. Check the other: at its $x$, $2x - 3$ should be its $y$." : "Start with the $y$-intercept, $(0, -3)$." }; },
            hints: ["One point is $(0, -3)$.", "From there, up 2 and right 1: $(1, -1)$."], why: "Through $(0, -3)$, rising 2 for each 1 across." },
          { type: "plane", prompt: "Graph $y = -\\frac{3}{4}x + 2$.", skill: "Graph from slope-intercept form",
            points: [{ id: "A", x: -6, y: -6, drag: true, color: "orange" }, { id: "B", x: -2, y: -6, drag: true, color: "orange" }],
            lines: [{ through: ["A", "B"], color: "orange" }], answer: { points: { A: [0, 2], B: [4, -1] } },
            check: function (st) { var on = function (p) { return Math.abs(p.y - (-0.75 * p.x + 2)) < 1e-9; }, A = st.pt("A"), B = st.pt("B");
              if (A.x === B.x && A.y === B.y) return { ok: false, say: "Spread the points out." };
              return { ok: on(A) && on(B), say: on(A) || on(B) ? "One is right. For the other, count down 3 and right 4 from the first." : "Start at $(0, 2)$. The slope $-\\frac{3}{4}$ means down 3, right 4." }; },
            hints: ["Start at $(0, 2)$.", "Down 3, right 4: $(4, -1)$."], why: "Through $(0, 2)$ and $(4, -1)$." },
          { type: "plane", prompt: "Graph $y = -x$.", skill: "Graph from slope-intercept form",
            points: [{ id: "A", x: 3, y: 3, drag: true, color: "orange" }, { id: "B", x: 6, y: 1, drag: true, color: "orange" }],
            lines: [{ through: ["A", "B"], color: "orange" }], answer: { points: { A: [0, 0], B: [3, -3] } },
            check: function (st) { var on = function (p) { return p.y === -p.x; }, A = st.pt("A"), B = st.pt("B");
              if (A.x === B.x && A.y === B.y) return { ok: false, say: "Spread the points out." };
              return { ok: on(A) && on(B), say: "$y = -x$ is $y = -1x + 0$: through the origin, down 1 for every 1 across." }; },
            hints: ["$b = 0$: it goes through $(0, 0)$.", "$m = -1$: down 1, right 1."], why: "Through $(0, 0)$, falling 1 for each 1 across." },
          { type: "choice", prompt: "Which line is steeper: $y = 3x + 1$ or $y = -4x + 1$?", skill: "Graph from slope-intercept form",
            options: [{ t: "$y = -4x + 1$" }, { t: "$y = 3x + 1$", fb: "Steepness ignores the sign: 4 is more than 3, so $-4x$ is steeper — it just goes down." },
                      { t: "They're equally steep", fb: "They share the $y$-intercept, not the steepness." }],
            answer: 0, why: "Steepness is the size of the slope: $|-4| = 4 > 3$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Writing y = mx + b",
        blurb: "From a graph, a slope and a point, two points, or a story.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "From a graph",
            prompt: "To write the equation of a line you need two things: $m$ and $b$.",
            scene: { type: "walk", rows: [
              { say: "A line crosses the $y$-axis at $(0, 2)$ and passes through $(3, -4)$." },
              { m: "b = 2", say: "Where it crosses the $y$-axis." },
              { m: "m = \\frac{-4 - 2}{3 - 0} = -2", say: "The slope from the two points." },
              { m: "y = -2x + 2", say: "Put them into $y = mx + b$." }] },
            gate: true },
          { type: "equation", prompt: "Write the equation of this line in slope-intercept form.", answer: "y = (1/2)x - 3", form: "slope-intercept", skill: "Slope-intercept equation from graph",
            scene: showLine(function (x) { return 0.5 * x - 3; }, { marks: [[0, -3], [4, -1]] }), keys: EQ_KEYS,
            near: [{ v: "y = 2x - 3", fb: "That's run over rise. From $(0, -3)$ to $(4, -1)$ is up 2, across 4." }],
            hints: ["It crosses the $y$-axis at $-3$.", "From $(0, -3)$ to $(4, -1)$: up 2, right 4."], why: "$b = -3$ and $m = \\frac{2}{4} = \\frac{1}{2}$: $y = \\frac{1}{2}x - 3$." },
          { type: "learn", kicker: "From a slope and a point",
            prompt: "If the point isn't the $y$-intercept, put it into $y = mx + b$ and solve for $b$.",
            scene: { type: "walk", rows: [
              { say: "Slope $3$, through $(2, 1)$." },
              { m: "y = 3x + b", say: "The slope is known; $b$ isn't." },
              { m: "1 = 3(2) + b", say: "The point is on the line, so its $x$ and $y$ fit." },
              { m: "b = -5", say: "$1 = 6 + b$." },
              { m: "y = 3x - 5", say: "" }] },
            gate: true },
          { type: "equation", prompt: "Write the equation of the line with slope $-2$ through $(3, 4)$, in slope-intercept form.", answer: "y = -2x + 10", form: "slope-intercept", skill: "Slope-intercept from two points",
            keys: EQ_KEYS, near: [{ v: "y = -2x + 4", fb: "$4$ is the point's $y$, not the $y$-intercept. Put the point in: $4 = -2(3) + b$." }],
            hints: ["$4 = -2(3) + b$.", "$4 = -6 + b$, so $b = 10$."], why: "$b = 10$: $y = -2x + 10$." },
          { type: "learn", kicker: "From two points",
            prompt: "With two points, find the slope first, then use either point to find $b$.",
            scene: { type: "walk", rows: [
              { say: "Through $(1, 5)$ and $(3, 9)$." },
              { m: "m = \\frac{9 - 5}{3 - 1} = 2", say: "" },
              { m: "5 = 2(1) + b \\;\\Rightarrow\\; b = 3", say: "Use either point — they give the same $b$." },
              { m: "y = 2x + 3", say: "" }] },
            gate: true },
          { type: "equation", prompt: "Write the equation of the line through $(-2, 7)$ and $(2, -1)$, in slope-intercept form.", answer: "y = -2x + 3", form: "slope-intercept", skill: "Slope-intercept from two points",
            keys: EQ_KEYS, hints: ["$m = \\frac{-1 - 7}{2 - (-2)} = -2$.", "$-1 = -2(2) + b$, so $b = 3$."], why: "$m = -2$, $b = 3$: $y = -2x + 3$." },
          { type: "learn", kicker: "From a story",
            prompt: "In a story, the rate is $m$ and the starting amount is $b$. If you're given two readings instead, find the rate from them first.",
            scene: { type: "walk", rows: [
              { say: "A 3-mile taxi ride costs \\$10.50 and a 7-mile ride costs \\$20.50. Write the cost $C$ of $d$ miles." },
              { m: "m = \\frac{20.50 - 10.50}{7 - 3} = 2.5", say: "Each mile costs \\$2.50." },
              { m: "10.50 = 2.5(3) + b \\;\\Rightarrow\\; b = 3", say: "The fee to get in is \\$3." },
              { m: "C = 2.5d + 3", say: "" }] },
            gate: true },
          { type: "equation", prompt: "A dance class charges \\$25 to sign up and \\$8 per lesson. Write an equation for the cost $C$ of $n$ lessons.", answer: "C = 8n + 25", skill: "Writing linear equations word problems",
            keys: [["$C$", "C"], ["$n$", "n"], ["$=$", "="], ["$+$", "+"], ["$-$", "-"]], placeholder: "C = …",
            near: [{ v: "C = 25n + 8", fb: "The \\$8 is what each lesson adds, so it multiplies $n$. The \\$25 is paid once." }],
            hints: ["What does each lesson add? That multiplies $n$.", "What is paid once, whatever $n$ is?"], why: "$C = 8n + 25$." },
          { type: "num", prompt: "With $C = 8n + 25$, how many lessons can you take for \\$105?", answer: 10, post: "lessons", skill: "Writing linear equations word problems",
            hints: ["$8n + 25 = 105$."], why: lines(["8n + 25 = 105", "8n = 80", "n = 10"]) }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Point-slope form",
        blurb: "When you know a point and the slope, the equation writes itself.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "The idea",
            prompt: "Take a line through $(x_1, y_1)$ with slope $m$. Any other point $(x, y)$ on it makes the same slope with $(x_1, y_1)$.",
            scene: { type: "walk", rows: [
              { m: "\\frac{y - y_1}{x - x_1} = m", say: "The slope between $(x_1, y_1)$ and any point $(x, y)$ on the line." },
              { m: "y - y_1 = m(x - x_1)", say: "Multiply both sides by $x - x_1$." }] },
            gate: true,
            then: "This is **point-slope form**. Put in the point and the slope, and you have the line: through $(2, -3)$ with slope 4 it's $y - (-3) = 4(x - 2)$, tidied to $y + 3 = 4(x - 2)$." },
          { type: "equation", prompt: "Write the line through $(5, 1)$ with slope $-2$ in point-slope form.", answer: "y - 1 = -2(x - 5)", form: "point-slope", skill: "Point-slope form",
            keys: EQ_KEYS, placeholder: "y - … = …(x - …)",
            near: [{ v: "y - 1 = -2(x + 5)", fb: "It's $x - x_1$ with $x_1 = 5$: $(x - 5)$." }],
            hints: ["$y - y_1 = m(x - x_1)$ with $x_1 = 5$, $y_1 = 1$, $m = -2$."], why: "$y - 1 = -2(x - 5)$." },
          { type: "equation", prompt: "And the line through $(-3, 4)$ with slope $\\frac{1}{2}$.", answer: "y - 4 = (1/2)(x + 3)", form: "point-slope", skill: "Point-slope form",
            keys: EQ_KEYS, placeholder: "y - … = …(x - …)",
            near: [{ v: "y - 4 = (1/2)(x - 3)", fb: "$x - (-3)$ is $x + 3$." }],
            hints: ["$x - (-3)$ becomes $x + 3$."], why: "$y - 4 = \\frac{1}{2}(x + 3)$." },
          { type: "learn", kicker: "Converting",
            prompt: "To turn point-slope form into slope-intercept form, multiply out the bracket and get $y$ alone.",
            scene: { type: "walk", rows: [
              { m: "y - 5 = 2(x + 1)", say: "" },
              { m: "y - 5 = 2x + 2", say: "Multiply out." },
              { m: "y = 2x + 7", say: "Add 5 to both sides." }] },
            gate: true },
          { type: "equation", prompt: "Write $y + 1 = -3(x - 2)$ in slope-intercept form.", answer: "y = -3x + 5", form: "slope-intercept", skill: "Point-slope form",
            keys: EQ_KEYS, near: [{ v: "y = -3x + 7", fb: "Take 1 from both sides, not add: $-3x + 6 - 1$." }, { v: "y = -3x - 5", fb: "$-3 \\times (-2) = +6$." }],
            hints: ["$-3(x - 2) = -3x + 6$.", "Then take 1 from both sides."], why: lines(["y + 1 = -3x + 6", "y = -3x + 5"]) },
          { type: "equation", prompt: "Write the line through $(1, 4)$ and $(3, 10)$ in point-slope form.", answer: "y - 4 = 3(x - 1)", form: "point-slope", skill: "Point-slope form",
            keys: EQ_KEYS, placeholder: "y - … = …(x - …)",
            hints: ["Find the slope: $\\frac{10 - 4}{3 - 1} = 3$.", "Then use either point."], why: "$y - 4 = 3(x - 1)$ — or, with the other point, $y - 10 = 3(x - 3)$. Both are right." },
          { type: "choice", prompt: "Which point and slope does $y - 2 = -5(x + 3)$ show?", skill: "Point-slope form",
            options: [{ t: "The point $(-3, 2)$ and slope $-5$" }, { t: "The point $(3, 2)$ and slope $-5$", fb: "$x + 3$ is $x - (-3)$, so $x_1 = -3$." },
                      { t: "The point $(-3, -2)$ and slope $-5$", fb: "$y - 2$ is $y - y_1$ with $y_1 = +2$." }],
            answer: 0, why: "$y - 2 = -5(x - (-3))$: the point is $(-3, 2)$." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Standard form",
        blurb: "Ax + By = C: good for intercepts, and for writing any line with whole numbers.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "New form",
            prompt: "**Standard form** puts both letters on one side and a number on the other: $Ax + By = C$, usually with whole numbers. It is the quickest form to graph by intercepts.",
            scene: { type: "walk", rows: [
              { m: "5x + 2y = 20", say: "Graph it by its intercepts." },
              { m: "y = 0: \\; 5x = 20, \\; x = 4", say: "$x$-intercept $(4, 0)$." },
              { m: "x = 0: \\; 2y = 20, \\; y = 10", say: "$y$-intercept $(0, 10)$." },
              { say: "Join $(4, 0)$ and $(0, 10)$." }] },
            gate: true },
          { type: "plane", prompt: "Graph $3x + 4y = 12$: drag both points onto the line.", skill: "Graph from linear standard form",
            points: [{ id: "A", x: -6, y: -6, drag: true, color: "orange" }, { id: "B", x: -2, y: -6, drag: true, color: "orange" }],
            lines: [{ through: ["A", "B"], color: "orange" }], answer: { points: { A: [4, 0], B: [0, 3] } },
            check: function (st) { var on = function (p) { return 3 * p.x + 4 * p.y === 12; }, A = st.pt("A"), B = st.pt("B");
              if (A.x === B.x && A.y === B.y) return { ok: false, say: "Spread the points out." };
              return { ok: on(A) && on(B), say: on(A) || on(B) ? "One is right. The intercepts are the easiest second point." : "Find the intercepts: set $y = 0$, then $x = 0$." }; },
            hints: ["With $y = 0$: $3x = 12$.", "With $x = 0$: $4y = 12$."], why: "The intercepts are $(4, 0)$ and $(0, 3)$." },
          { type: "learn", kicker: "Converting",
            prompt: "To write a slope-intercept equation in standard form, clear any fractions and move the $x$ term across.",
            scene: { type: "walk", rows: [
              { m: "y = \\frac{2}{3}x + 4", say: "" },
              { m: "3y = 2x + 12", say: "Multiply every term by 3." },
              { m: "-2x + 3y = 12", say: "Take $2x$ from both sides." },
              { m: "2x - 3y = -12", say: "Multiplying by $-1$ is allowed too — many people like $A$ positive." }] },
            gate: true },
          { type: "equation", prompt: "Write $y = -\\frac{1}{2}x + 3$ in standard form, with whole numbers.", answer: "x + 2y = 6", form: "standard", skill: "Convert to standard form",
            keys: EQ_KEYS, placeholder: "…x + …y = …",
            near: [{ v: "x + 2y = 3", fb: "Multiply **every** term by 2, the 3 as well." }],
            hints: ["Multiply every term by 2: $2y = -x + 6$.", "Add $x$ to both sides."], why: lines(["2y = -x + 6", "x + 2y = 6"]) },
          { type: "learn", kicker: "Slope from standard form",
            prompt: "Standard form hides the slope. Get $y$ alone to see it.",
            scene: { type: "walk", rows: [
              { m: "2x + 3y = 6", say: "" },
              { m: "3y = -2x + 6", say: "Take $2x$ from both sides." },
              { m: "y = -\\frac{2}{3}x + 2", say: "Divide by 3." },
              { say: "The slope is $-\\frac{2}{3}$. In general, $Ax + By = C$ has slope $-\\frac{A}{B}$." }] },
            gate: true },
          { type: "num", prompt: "What is the slope of $4x - 2y = 8$?", pre: "$m =$", answer: 2, skill: "Slope from equation",
            near: [{ v: 4, fb: "Get $y$ alone first: $-2y = -4x + 8$, so $y = 2x - 4$." }, { v: -2, fb: "$-\\frac{A}{B} = -\\frac{4}{-2} = +2$." }],
            hints: ["Take $4x$ from both sides, then divide by $-2$."], why: "$y = 2x - 4$, so $m = 2$." },
          { type: "num", prompt: "What is the slope of $3x + 5y = 15$? (A fraction is fine.)", pre: "$m =$", answer: -0.6, skill: "Slope from equation",
            near: [{ v: 3, fb: "Get $y$ alone: $5y = -3x + 15$." }, { v: 0.6, fb: "Moving $3x$ across makes it $-3x$: the slope is negative." }],
            hints: ["$5y = -3x + 15$.", "Divide by 5."], why: "$y = -\\frac{3}{5}x + 3$, so $m = -\\frac{3}{5}$." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Any form",
        blurb: "Three ways to write the same line, and when each one is handiest.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "The three forms",
            prompt: "Every non-vertical line can be written in all three forms. Pick the one that matches what you know: <br><br>**Slope-intercept**, $y = mx + b$ — you know the slope and the $y$-intercept, or want to graph fast. <br>**Point-slope**, $y - y_1 = m(x - x_1)$ — you know a point and the slope (or two points). <br>**Standard**, $Ax + By = C$ — you want the intercepts, or whole numbers only." },
          { type: "choice", prompt: "You know a line has slope $2$ and passes through $(4, -1)$. Which form can you write down straight away, without working anything out?", skill: "Linear equations in any form",
            options: [{ t: "Point-slope form" }, { t: "Slope-intercept form", fb: "You'd need $b$ first, which takes a step of working. Point-slope uses the point and slope exactly as given." },
                      { t: "Standard form", fb: "Standard form needs rearranging from one of the others." }],
            answer: 0, why: "$y + 1 = 2(x - 4)$ comes straight from the point and the slope." },
          { type: "equation", prompt: "Write an equation of the line through $(-1, 3)$ and $(2, -3)$ — in any form you like.", answer: "y = -2x + 1", skill: "Linear equations in any form",
            keys: EQ_KEYS, hints: ["$m = \\frac{-3 - 3}{2 - (-1)} = -2$.", "Point-slope with $(-1, 3)$: $y - 3 = -2(x + 1)$."],
            why: "$y - 3 = -2(x + 1)$, which is $y = -2x + 1$, or $2x + y = 1$ — all the same line." },
          { type: "equation", prompt: "Write $2x - y = 5$ in slope-intercept form.", answer: "y = 2x - 5", form: "slope-intercept", skill: "Linear equations in any form",
            keys: EQ_KEYS, near: [{ v: "y = -2x + 5", fb: "Dividing $-y = -2x + 5$ by $-1$ changes **every** sign: $y = 2x - 5$." }],
            hints: ["Take $2x$ from both sides: $-y = -2x + 5$.", "Multiply both sides by $-1$."], why: lines(["-y = -2x + 5", "y = 2x - 5"]) },
          { type: "equation", prompt: "Write the line through $(0, 4)$ and $(6, 0)$ in standard form.", answer: "2x + 3y = 12", form: "standard", skill: "Linear equations in any form",
            keys: EQ_KEYS, placeholder: "…x + …y = …",
            hints: ["$m = -\\frac{4}{6} = -\\frac{2}{3}$ and $b = 4$: $y = -\\frac{2}{3}x + 4$.", "Multiply by 3 and move the $x$ term: $2x + 3y = 12$."], why: "$2x + 3y = 12$: check $(0, 4)$ gives $12$ ✓ and $(6, 0)$ gives $12$ ✓." },
          { type: "multi", prompt: "Which of these are the same line as $y = 2x - 4$? Pick every one.", skill: "Linear equations in any form",
            options: [{ t: "$2x - y = 4$", ok: true }, { t: "$y + 2 = 2(x - 1)$", ok: true }, { t: "$4x - 2y = 8$", ok: true },
                      { t: "$y = 4 - 2x$", ok: false, fb: "That has slope $-2$, not $2$." }, { t: "$y - 4 = 2x$", ok: false, fb: "That's $y = 2x + 4$: the intercept has the wrong sign." }],
            hints: ["Rewrite each one as $y = \\ldots$ and compare."], why: "$2x - y = 4$, $y + 2 = 2(x - 1)$ and $4x - 2y = 8$ all rearrange to $y = 2x - 4$." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Reading slope and intercept from $y = mx + b$, using it in stories, and graphing it.",
        skills: ["a5-si-read", "a5-si-words", "a5-graph-si"], per: 2 },
      { title: "Quiz 2", after: 3, blurb: "Writing slope-intercept equations from graphs, points and stories.",
        skills: ["a5-eq-graph", "a5-eq-2pts", "a5-eq-words"], per: 2 },
      { title: "Quiz 3", after: 6, blurb: "Point-slope and standard form, slope from any equation, and moving between the forms.",
        skills: ["a5-ps", "a5-graph-std", "a5-to-std", "a5-slope-std", "a5-any"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Slope-intercept form, $y = mx + b$",
        say: ["$m$ is the **slope** and $b$ is the **$y$-intercept**: the line crosses the $y$-axis at $(0, b)$.",
              "If the equation isn't already in this form, get $y$ on its own first: $y = 5 - 3x$ is $y = -3x + 5$, and $2y = 4x + 6$ is $y = 2x + 3$.",
              "In a story, $m$ is the rate and $b$ is the starting amount."],
        eg: { q: "Read the slope and $y$-intercept of $3y = 6x - 9$.", rows: [["y = 2x - 3", "Divide every term by 3."], ["m = 2, \\; (0, -3)", ""]] },
        watch: "The sign belongs to the number: in $y = 4x - 1$, $b = -1$." },
      { t: "Graphing $y = mx + b$",
        say: ["Plot the $y$-intercept $(0, b)$. From there, use the slope as directions — the top of the fraction up (down if negative), the bottom to the right — to get a second point. Join them."],
        eg: { q: "Graph $y = -\\frac{3}{4}x + 2$.", rows: [["(0, 2)", "Start at the $y$-intercept."], ["(4, -1)", "Down 3, right 4."]] } },
      { t: "Writing $y = mx + b$",
        keys: [["From a graph", "read $b$ where the line crosses the $y$-axis; count the slope between two grid points"],
               ["From a slope and a point", "put the point into $y = mx + b$ and solve for $b$"],
               ["From two points", "find $m$ first, then use either point for $b$"],
               ["From a story", "the rate is $m$; the amount at the start is $b$"]],
        say: ["You need exactly two things: $m$ and $b$."],
        eg: { q: "Write the line through $(1, 5)$ and $(3, 9)$.", rows: [["m = \\frac{9 - 5}{3 - 1} = 2", ""], ["5 = 2(1) + b, \\; b = 3", ""], ["y = 2x + 3", ""]] },
        watch: "A point's $y$ isn't the $y$-intercept unless its $x$ is $0$." },
      { t: "Point-slope form, $y - y_1 = m(x - x_1)$",
        say: ["Use it when you know a point $(x_1, y_1)$ on the line and its slope $m$. It comes from the slope formula: $\\frac{y - y_1}{x - x_1} = m$.",
              "Watch the signs: the point $(-3, 4)$ gives $y - 4 = m(x + 3)$. To convert to slope-intercept form, multiply out and get $y$ alone."],
        eg: { q: "Write $y + 1 = -3(x - 2)$ in slope-intercept form.", rows: [["y + 1 = -3x + 6", "Multiply out."], ["y = -3x + 5", "Take 1 from both sides."]] },
        watch: "$y - 2 = -5(x + 3)$ passes through $(-3, 2)$, not $(3, 2)$ — the signs in the form are the opposite of the point's." },
      { t: "Standard form, $Ax + By = C$",
        say: ["Both letters on one side, a number on the other, with whole numbers. Graph it by its intercepts: set $y = 0$ to find the $x$-intercept, and $x = 0$ for the $y$-intercept.",
              "Its slope is $-\\frac{A}{B}$ — or just get $y$ alone and read it.",
              "To convert from $y = mx + b$: multiply through to clear fractions, then move the $x$ term across."],
        eg: { q: "Write $y = \\frac{2}{3}x + 4$ in standard form.", rows: [["3y = 2x + 12", "Multiply every term by 3."], ["-2x + 3y = 12", "Take $2x$ from both sides."]] },
        watch: "Multiply **every** term when you clear a fraction — the plain number too." },
      { t: "Choosing a form",
        keys: [["Slope and $y$-intercept known", "$y = mx + b$"], ["A point and the slope, or two points", "$y - y_1 = m(x - x_1)$"], ["Intercepts wanted, or whole numbers only", "$Ax + By = C$"]],
        say: ["They are the same line written three ways, and any one can be rearranged into the others. To test whether two equations are the same line, rewrite both as $y = mx + b$ and compare."] }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a5-si-read", title: "Slope-intercept intro", lesson: 1,
        gen: function (R) {
          var s = slope(R), n = s[0], d = s[1], b = R.int(-8, 8), m = n / d, form = R.int(0, 3), tex;
          if (form === 0) tex = siTex(n, d, b);
          else if (form === 1 && b !== 0) tex = "y = " + num(b) + (n < 0 ? " - " + slopeTerm(-n, d) : " + " + slopeTerm(n, d));
          else if (form === 2 && d === 1) { var k = R.pick([2, 3, 4]); tex = k + "y = " + poly([[k * n, "x"], [k * b, ""]]); }
          else tex = siTex(n, d, b);
          if (R.chance(0.55)) return { type: "num", prompt: "What is the slope of $" + tex + "$? (A fraction is fine.)", pre: "$m =$", answer: m,
            near: nears(m, [{ v: b, fb: "That's $b$, the $y$-intercept. The slope multiplies $x$." }, { v: -m, fb: "Keep the sign of the $x$ term." }]),
            hints: [form === 2 ? "Get $y$ alone first: divide every term." : "Write it as $y = mx + b$; the slope is the number multiplying $x$."],
            why: "$" + siTex(n, d, b) + "$, so $m = " + frac(n, d) + "$." };
          return { type: "pair", prompt: "What is the $y$-intercept of $" + tex + "$? Give it as a point.", answer: [0, b],
            hints: [form === 2 ? "Get $y$ alone first." : "In $y = mx + b$ the $y$-intercept is $(0, b)$."],
            why: "$" + siTex(n, d, b) + "$, so the $y$-intercept is $(0, " + b + ")$." };
        } },
      { id: "a5-si-words", title: "Linear equations word problems", lesson: 1,
        gen: function (R) {
          var S = R.pick([
            function () { var r = R.pick([1.5, 2, 2.5, 3]), f = R.pick([3, 4, 5]); return { eq: "C = " + num(r) + "d + " + f, set: "A taxi ride of $d$ miles costs $C = " + num(r) + "d + " + f + "$ dollars.", m: r, b: f, x: "d", y: "C", yn: "fare", mSay: "Each mile adds \\$" + (r % 1 ? r.toFixed(2) : r) + " to the fare", bSay: "It costs \\$" + f + " before any miles", xu: "miles", yu: "dollars" }; },
            function () { var r = R.pick([12, 15, 20]), s = R.pick([100, 150, 200]); return { set: "Jo's savings after $w$ weeks are $S = " + s + " + " + r + "w$ dollars.", m: r, b: s, x: "w", y: "S", yn: "savings", mSay: "Jo saves \\$" + r + " every week", bSay: "Jo had \\$" + s + " at the start", xu: "weeks", yu: "dollars" }; },
            function () { var r = R.pick([2, 3, 4]), h = R.pick([30, 36, 40]); return { set: "A candle's height after $t$ hours is $h = " + h + " - " + r + "t$ cm.", m: -r, b: h, x: "t", y: "h", yn: "height", mSay: "The candle gets " + r + " cm shorter every hour", bSay: "The candle was " + h + " cm tall to begin with", xu: "hours", yu: "cm" }; },
            function () { var r = R.pick([0.5, 1.5, 2]), h = R.pick([5, 8, 10]); return { set: "A sunflower's height after $w$ weeks is $h = " + num(r) + "w + " + h + "$ cm.", m: r, b: h, x: "w", y: "h", yn: "height", mSay: "It grows " + num(r) + " cm every week", bSay: "It was " + h + " cm tall when measuring began", xu: "weeks", yu: "cm" }; },
            function () { var r = R.pick([40, 50, 60]), d = R.pick([300, 400, 500]); return { set: "A car's distance from home after $t$ hours is $d = " + d + " - " + r + "t$ km.", m: -r, b: d, x: "t", y: "d", yn: "distance from home", mSay: "It gets " + r + " km closer to home every hour", bSay: "It started " + d + " km from home", xu: "hours", yu: "km" }; }])();
          var k = R.int(0, 2);
          if (k === 0 || k === 1) {
            var slopeQ = k === 0, n = slopeQ ? Math.abs(S.m) : S.b;
            return mc(R, { prompt: S.set + " What does the " + num(n) + " tell you?", right: slopeQ ? S.mSay + "." : S.bSay + ".",
              wrong: [{ t: slopeQ ? S.bSay.replace(String(S.b), num(Math.abs(S.m))) + "." : S.mSay.replace(num(Math.abs(S.m)), String(S.b)) + ".", fb: slopeQ ? "The starting amount is the number on its own. " + num(Math.abs(S.m)) + " multiplies $" + S.x + "$, so it's a rate." : "The rate is the number multiplying $" + S.x + "$. " + S.b + " stands alone: it's the value at the start." },
                      { t: "The " + S.yn + " after " + num(n) + " " + S.xu + ".", fb: "That would need you to put a value of $" + S.x + "$ in. On its own the number is " + (slopeQ ? "a rate." : "the starting value.") }],
              hints: ["The number multiplying $" + S.x + "$ is the rate; the number on its own is the value when $" + S.x + " = 0$."],
              why: (slopeQ ? S.mSay : S.bSay) + "." });
          }
          var t = R.int(2, 6), v = S.b + S.m * t;
          return { type: "num", prompt: S.set + " What is $" + S.y + "$ when $" + S.x + " = " + t + "$, in " + S.yu + "?", answer: v,
            near: nears(v, [{ v: S.m * t, fb: "Add the starting amount, " + S.b + "." }]), hints: ["Put $" + S.x + " = " + t + "$ in."],
            why: "$" + num(S.b) + (S.m < 0 ? " - " + num(-S.m) : " + " + num(S.m)) + "(" + t + ") = " + num(v) + "$." };
        } },
      { id: "a5-graph-si", title: "Graph from slope-intercept form", lesson: 2,
        gen: function (R) {
          var s = slope(R), n = s[0], d = s[1], b = R.int(-5, 5);
          if (Math.abs(b + 2 * n) > 9) n = n > 0 ? 1 : -1;
          var on = function (x, y) { return Math.abs(y - (n / d * x + b)) < 1e-9; };
          var spec = dragLine(on, [[0, b], [d, b + n]], "Start at the $y$-intercept, $(0, " + b + ")$, then use the slope.");
          spec.prompt = "Graph $" + siTex(n, d, b) + "$: drag both points onto the line.";
          spec.hints = ["Start at $(0, " + b + ")$.", "Then " + (n > 0 ? "up " + n : "down " + -n) + " and right " + d + ": $" + pt(d, b + n) + "$."];
          spec.why = "Through $(0, " + b + ")$ and $" + pt(d, b + n) + "$.";
          return spec;
        } },
      { id: "a5-eq-graph", title: "Slope-intercept equation from graph", lesson: 3,
        gen: function (R) {
          var s = slope(R), n = s[0], d = s[1], b = R.int(-5, 5);
          if (Math.abs(b + n) > 9) n = -n;
          return { type: "equation", prompt: "Write the equation of this line in slope-intercept form.", answer: siTyped(n, d, b), shown: siTyped(n, d, b), form: "slope-intercept",
            scene: showLine(function (x) { return n / d * x + b; }, { marks: [[0, b], [d, b + n]] }), keys: EQ_KEYS,
            near: Math.abs(n) !== Math.abs(d) ? [{ v: siTyped(d, n, b), fb: "That slope is run over rise. Slope is rise over run." }] : [],
            hints: ["It crosses the $y$-axis at $" + b + "$: that's $b$.", "From $(0, " + b + ")$ to $" + pt(d, b + n) + "$: " + (n > 0 ? "up " + n : "down " + -n) + ", right " + d + "."],
            why: "$b = " + b + "$ and $m = " + frac(n, d) + "$: $" + siTex(n, d, b) + "$." };
        } },
      { id: "a5-eq-2pts", title: "Slope-intercept from two points", lesson: 3,
        gen: function (R) {
          var s = slope(R), n = s[0], d = s[1], b = R.int(-6, 6);
          var k1 = R.int(-2, 2), k2 = k1 + R.pick([1, 2]);
          var p = [d * k1, b + n * k1], q = [d * k2, b + n * k2];
          if (p[0] === 0 && R.chance(0.7)) { p = [d * (k1 - 1), b - n]; }
          var pointFirst = R.chance(0.4);
          if (pointFirst) return { type: "equation", prompt: "Write the equation of the line with slope $" + frac(n, d) + "$ through $" + pt(q[0], q[1]) + "$, in slope-intercept form.",
            answer: siTyped(n, d, b), shown: siTyped(n, d, b), form: "slope-intercept", keys: EQ_KEYS,
            near: q[0] !== 0 ? [{ v: siTyped(n, d, q[1]), fb: "$" + q[1] + "$ is the point's $y$, not the $y$-intercept. Put the point into $y = mx + b$ and solve for $b$." }] : [],
            hints: ["$" + q[1] + " = " + frac(n, d) + " \\cdot " + paren(q[0]) + " + b$.", "Solve for $b$."],
            why: "$" + q[1] + " = " + num(n / d * q[0]) + " + b$, so $b = " + b + "$: $" + siTex(n, d, b) + "$." };
          return { type: "equation", prompt: "Write the equation of the line through $" + pt(p[0], p[1]) + "$ and $" + pt(q[0], q[1]) + "$, in slope-intercept form.",
            answer: siTyped(n, d, b), shown: siTyped(n, d, b), form: "slope-intercept", keys: EQ_KEYS,
            hints: ["$m = \\frac{" + q[1] + " - " + paren(p[1]) + "}{" + q[0] + " - " + paren(p[0]) + "} = " + frac(n, d) + "$.", "Put one point into $y = " + slopeTerm(n, d) + " + b$ and solve for $b$."],
            why: "$m = " + frac(n, d) + "$ and $b = " + b + "$: $" + siTex(n, d, b) + "$." };
        } },
      { id: "a5-eq-words", title: "Writing linear equations word problems", lesson: 3,
        gen: function (R) {
          var T = R.pick([
            function () { var f = R.pick([15, 20, 25, 30]), r = R.pick([6, 8, 10, 12]); return { p: "A climbing wall charges \\$" + f + " for gear hire and \\$" + r + " an hour. Write the cost $C$ of $h$ hours.", v: ["C", "h"], m: r, b: f }; },
            function () { var s = R.pick([500, 750, 1000]), r = R.pick([25, 40, 50]); return { p: "A water tank holds " + s + " litres and leaks " + r + " litres a day. Write the water $W$ left after $d$ days.", v: ["W", "d"], m: -r, b: s }; },
            function () { var s = R.pick([12, 15, 20]), r = R.pick([2, 3, 4]); return { p: "A seedling is " + s + " mm tall and grows " + r + " mm a day. Write its height $H$ after $t$ days.", v: ["H", "t"], m: r, b: s }; },
            function () { var r = R.pick([2, 3, 4]), f = R.pick([3, 4, 5]), a = R.int(2, 4), c = a + R.int(2, 4);
              return { p: "A " + a + "-mile taxi ride costs \\$" + (f + r * a) + ", and a " + c + "-mile ride costs \\$" + (f + r * c) + ". The cost rises steadily with distance. Write the cost $C$ of $m$ miles.", v: ["C", "m"], m: r, b: f, two: [a, c] }; },
            function () { var r = R.pick([5, 10, 15]), b = R.pick([40, 60, 80]), a = R.int(1, 3), c = a + R.int(2, 4);
              return { p: "A phone has " + (b - r * a) + "% battery after " + a + " hours of use and " + (b - r * c) + "% after " + c + " hours, falling steadily. Write its battery $B$ after $h$ hours.", v: ["B", "h"], m: -r, b: b, two: [a, c] }; }])();
          var y = T.v[0], x = T.v[1];
          var ans = y + " = " + T.m + x + " + " + T.b;
          return { type: "equation", prompt: T.p, answer: ans, shown: y + " = " + poly([[T.m, x], [T.b, ""]]),
            keys: [["$" + y + "$", y], ["$" + x + "$", x], ["$=$", "="], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]], placeholder: y + " = …",
            near: (T.m === T.b ? [] : [{ v: y + " = " + T.b + x + " + " + T.m, fb: "The rate multiplies $" + x + "$; the starting amount stands alone." }]).concat(T.m < 0 ? [{ v: y + " = " + -T.m + x + " + " + T.b, fb: "The amount goes **down**, so the rate is negative." }] : []),
            hints: T.two ? ["Find the rate from the two readings: change in $" + y + "$ over change in $" + x + "$.", "Then work back to $" + x + " = 0$ for the starting value."]
                         : ["What changes each unit of $" + x + "$? That multiplies $" + x + "$.", "What is the value at the start?"],
            why: "$" + y + " = " + poly([[T.m, x], [T.b, ""]]) + "$: the rate is $" + T.m + "$ and the starting value $" + T.b + "$." };
        } },
      { id: "a5-ps", title: "Point-slope form", lesson: 4,
        gen: function (R) {
          var s = slope(R), n = s[0], d = s[1], x1 = R.nz(-6, 6), y1 = R.nz(-6, 6), k = R.int(0, 2);
          var b = y1 - n / d * x1;
          if (k === 0) return { type: "equation", prompt: "Write the line through $" + pt(x1, y1) + "$ with slope $" + frac(n, d) + "$ in point-slope form.",
            answer: "y - " + paren(y1) + " = " + (d === 1 ? n : "(" + n + "/" + d + ")") + "(x - " + paren(x1) + ")", shown: psTex(x1, y1, n, d).replace(/\\frac\{(\d+)\}\{(\d+)\}/, "($1/$2)"),
            form: "point-slope", keys: EQ_KEYS, placeholder: "y - … = …(x - …)",
            near: [{ v: "y - " + paren(y1) + " = " + (d === 1 ? n : "(" + n + "/" + d + ")") + "(x + " + paren(x1) + ")", fb: "It's $x - x_1$: with $x_1 = " + x1 + "$ that's $(" + (x1 < 0 ? "x + " + -x1 : "x - " + x1) + ")$." }],
            hints: ["$y - y_1 = m(x - x_1)$ with $x_1 = " + x1 + "$, $y_1 = " + y1 + "$, $m = " + frac(n, d) + "$."], why: "$" + psTex(x1, y1, n, d) + "$." };
          if (k === 1 && d === 1) return { type: "equation", prompt: "Write $" + psTex(x1, y1, n, d) + "$ in slope-intercept form.", answer: siTyped(n, 1, b), shown: siTyped(n, 1, b),
            form: "slope-intercept", keys: EQ_KEYS,
            hints: ["Multiply out the right side.", "Then move the number on the left across."],
            why: lines([psTex(x1, y1, n, d), "y " + (y1 < 0 ? "+ " + -y1 : "- " + y1) + " = " + poly([[n, "x"], [-n * x1, ""]]), siTex(n, 1, b)]) };
          return mc(R, { prompt: "Which point and slope does $" + psTex(x1, y1, n, d) + "$ show?", right: "The point $" + pt(x1, y1) + "$ and slope $" + frac(n, d) + "$",
            wrong: [{ t: "The point $" + pt(-x1, y1) + "$ and slope $" + frac(n, d) + "$", fb: "The bracket is $x - x_1$, so $x_1$ has the opposite sign to what you see: $x_1 = " + x1 + "$." },
                    { t: "The point $" + pt(x1, -y1) + "$ and slope $" + frac(n, d) + "$", fb: "The left side is $y - y_1$, so $y_1 = " + y1 + "$." },
                    { t: "The point $" + pt(-x1, -y1) + "$ and slope $" + frac(n, d) + "$", fb: "Both signs in the form are the opposite of the point's." }],
            hints: ["Match it to $y - y_1 = m(x - x_1)$. The signs in the form are the opposite of the point's."],
            why: "$y - " + paren(y1) + " = " + frac(n, d) + "(x - " + paren(x1) + ")$: the point is $" + pt(x1, y1) + "$." });
        } },
      { id: "a5-graph-std", title: "Graph from linear standard form", lesson: 5,
        gen: function (R) {
          var a = R.nz(-6, 6), b = R.nz(-6, 6);         // intercepts (a, 0) and (0, b)
          var g = gcd(a, b), A = b / g, B = a / g, C = a * b / g;
          if (A < 0) { A = -A; B = -B; C = -C; }
          var on = function (x, y) { return A * x + B * y === C; };
          var spec = dragLine(on, [[a, 0], [0, b]], "The intercepts are the easiest points: set $y = 0$, then $x = 0$.");
          spec.prompt = "Graph $" + stdTex(A, B, C) + "$: drag both points onto the line.";
          spec.hints = ["$y = 0$: $" + poly([[A, "x"]]) + " = " + C + "$, so $x = " + a + "$.", "$x = 0$: $" + poly([[B, "y"]]) + " = " + C + "$, so $y = " + b + "$."];
          spec.why = "The intercepts are $" + pt(a, 0) + "$ and $" + pt(0, b) + "$.";
          return spec;
        } },
      { id: "a5-to-std", title: "Convert linear equations to standard form", lesson: 5,
        gen: function (R) {
          var s = slope(R), n = s[0], d = s[1], b = R.int(-8, 8);
          // d·y = n·x + d·b  →  −n·x + d·y = d·b
          var A = -n, B = d, C = d * b;
          if (A < 0) { A = -A; B = -B; C = -C; }
          return { type: "equation", prompt: "Write $" + siTex(n, d, b) + "$ in standard form, $Ax + By = C$, with whole numbers.", answer: stdTex(A, B, C).replace(/\s/g, ""), shown: stdTex(A, B, C),
            form: "standard", keys: EQ_KEYS, placeholder: "…x + …y = …",
            near: d > 1 && C !== 0 ? [{ v: poly([[A, "x"], [B, "y"]]) + " = " + (C / d), fb: "Multiply **every** term by " + d + ", the plain number too." }] : [],
            hints: d > 1 ? ["Multiply every term by " + d + ": $" + d + "y = " + poly([[n, "x"], [d * b, ""]]) + "$.", "Move the $x$ term to the left."] : ["Move the $x$ term to the left side."],
            why: "$" + stdTex(A, B, C) + "$ — or any whole-number multiple of it." };
        } },
      { id: "a5-slope-std", title: "Slope from equation", lesson: 5,
        gen: function (R) {
          var A = R.nz(-8, 8), B = R.nz(-8, 8), C = R.int(-12, 12);
          var m = -A / B;
          return { type: "num", prompt: "What is the slope of $" + stdTex(A, B, C) + "$? (A fraction is fine.)", pre: "$m =$", answer: m,
            near: nears(m, [{ v: A / B, fb: "Moving $" + poly([[A, "x"]]) + "$ across the $=$ changes its sign." }, { v: A, fb: "Get $y$ alone first — then read the number multiplying $x$." }, { v: -B / A, fb: "That's upside down. Divide by the $y$ coefficient." }]),
            hints: ["Get $y$ alone: $" + poly([[B, "y"]]) + " = " + poly([[-A, "x"], [C, ""]]) + "$.", "Divide by $" + B + "$."],
            why: "$y = " + slopeTerm(-A, B) + (C === 0 ? "" : " " + (C / B < 0 ? "-" : "+") + " " + frac(Math.abs(C), Math.abs(B))) + "$, so $m = " + frac(-A, B) + "$." };
        } },
      { id: "a5-any", title: "Linear equations in any form", lesson: 6,
        gen: function (R) {
          var s = slope(R), n = s[0], d = s[1], b = R.int(-6, 6), k1 = R.int(-2, 1), k2 = k1 + R.pick([1, 2]);
          var p = [d * k1, b + n * k1], q = [d * k2, b + n * k2];
          var A = -n, B = d, C = d * b;
          if (R.chance(0.5)) return { type: "equation", prompt: "Write an equation of the line through $" + pt(p[0], p[1]) + "$ and $" + pt(q[0], q[1]) + "$ — any form is fine.",
            answer: siTyped(n, d, b), shown: psTex(p[0], p[1], n, d).replace(/\\frac\{(\d+)\}\{(\d+)\}/, "($1/$2)"), keys: EQ_KEYS,
            hints: ["Find the slope: $" + frac(n, d) + "$.", "Point-slope form with either point is quickest."],
            why: "$" + psTex(p[0], p[1], n, d) + "$, which is the same line as $" + siTex(n, d, b) + "$." };
          if (A < 0) { A = -A; B = -B; C = -C; }
          return { type: "equation", prompt: "Write $" + stdTex(A, B, C) + "$ in slope-intercept form.", answer: siTyped(n, d, b), shown: siTyped(n, d, b), form: "slope-intercept", keys: EQ_KEYS,
            hints: ["Move the $x$ term to the right.", "Divide every term by the number in front of $y$."], why: "$" + siTex(n, d, b) + "$." };
        } }
    ]
  });
})();
