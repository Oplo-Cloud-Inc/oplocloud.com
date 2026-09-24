/* ==========================================================================
   Algebra I — Unit 4: Linear equations & graphs. See lab/core.js.

   Written the way Units 1–3 are. An equation in two letters is met as a
   rule that many pairs of numbers obey, and those pairs are plotted until
   they are seen to make a line. Slope is then something you drag — two
   points and the rise-and-run triangle between them — before it is a
   formula, and intercepts are where the line you have been dragging crosses
   the axes. The last two lessons read all of it in real situations: a
   candle burning down, a taxi meter, two savers racing to the same total.

   Six lessons, following Khan Academy's topics for the unit. Sixteen skills
   (Khan's list), three quizzes, the unit test at the end, and notes that put
   the unit on one page.
   Standards: 8.EE.B.5, 8.EE.B.6, 8.F.B.4, HSA.REI.D.10, HSF.IF.B.4,
   HSF.IF.B.6, HSF.LE.A.1.b.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, frac = L.frac, gcd = L.gcd;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function r6(v) { return Math.round(v * 1e6) / 1e6; }
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function paren(v) { return v < 0 ? "(" + num(v) + ")" : num(v); }
  // y = (n/d)x + b, written the way a person writes it.
  function slopeTerm(n, d, v) {
    v = v || "x";
    if (n === 0) return "";
    var g = gcd(n, d); n /= g; d /= g;
    if (d < 0) { n = -n; d = -d; }
    if (d === 1) return poly([[n, v]]);
    return (n < 0 ? "-" : "") + "\\frac{" + Math.abs(n) + "}{" + d + "}" + v;
  }
  function lineTex(n, d, b, yv, xv) {
    var t = slopeTerm(n, d, xv), out = (yv || "y") + " = ";
    if (!t) return out + num(b);
    return out + t + (b === 0 ? "" : b < 0 ? " - " + num(-b) : " + " + num(b));
  }
  function slopeOf(a, b) { return r6((b[1] - a[1]) / (b[0] - a[0])); }
  // A line to look at: fixed, with optional marked points.
  function showLine(m, b, o) {
    o = o || {};
    return { type: "plane", x: o.x || [-10, 10], y: o.y || [-10, 10], grid: o.grid, gridY: o.gridY, labelEvery: o.labelEvery, labelEveryY: o.labelEveryY,
      axisLabels: o.axisLabels, fns: [{ f: function (x) { return m * x + b; }, color: "blue" }].concat(o.more || []),
      marks: (o.marks || []).map(function (p) { return { x: p[0], y: p[1], label: p[2] != null ? p[2] : pt(p[0], p[1]), color: p[3] || "ink" }; }),
      vline: o.vline, hline: o.hline };
  }
  function nears(ans, list) { return list.filter(function (z) { return Math.abs(z.v - ans) > 1e-9; }); }
  function tbl(head, rows) { return { type: "table", head: head, rows: rows }; }
  // Where two draggable points start: somewhere not already on the answer.
  function starts(isOn) {
    var cands = [[[-7, 7], [-3, 7]], [[6, -7], [2, -7]], [[-6, -2], [-6, 5]], [[5, 5], [8, 2]]];
    for (var i = 0; i < cands.length; i++) if (!(isOn(cands[i][0]) && isOn(cands[i][1]))) return cands[i];
    return cands[0];
  }
  /* Drag two points onto a line. `on(x, y)` says whether a point is on it;
     `ans` is two points on it, for Show me. */
  function dragLine(o) {
    var s = starts(function (p) { return o.on(p[0], p[1]); });
    return { type: "plane", x: o.x || [-10, 10], y: o.y || [-10, 10], grid: o.grid, gridY: o.gridY, labelEvery: o.labelEvery, labelEveryY: o.labelEveryY,
      axisLabels: o.axisLabels, snapY: o.snapY,
      points: [{ id: "A", x: o.start ? o.start[0][0] : s[0][0], y: o.start ? o.start[0][1] : s[0][1], drag: true, color: "orange" },
               { id: "B", x: o.start ? o.start[1][0] : s[1][0], y: o.start ? o.start[1][1] : s[1][1], drag: true, color: "orange" }],
      lines: [{ through: ["A", "B"], color: "orange" }],
      answer: { points: { A: o.ans[0], B: o.ans[1] } },
      check: function (st) {
        var A = st.pt("A"), B = st.pt("B");
        if (A.x === B.x && A.y === B.y) return { ok: false, say: "Both points are in the same place. A line needs two different points." };
        var a = o.on(A.x, A.y), b = o.on(B.x, B.y);
        if (a && b) return { ok: true };
        if (a || b) return { ok: false, say: "One point is on the line and one isn't. Check point " + (a ? "B" : "A") + " " + pt(a ? B.x : A.x, a ? B.y : A.y) + "." };
        return { ok: false, say: o.fb || "Neither point is on the line yet. Put in a value of $x$ and work out $y$ for each point." };
      } };
  }
  // A nice step for the grid of a word problem's axis.
  function nice(v) { var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000]; for (var i = 0; i < steps.length; i++) if (v <= steps[i]) return steps[i]; return 5000; }

  /* ---------------------------------------------------------------- Stories
     A straight-line situation, with what each feature of its graph means.
     y = m x + b; decreasing stories have an x-intercept that means
     something. */
  function story(R, only) {
    var S = {
      candle: function () { var r = R.pick([2, 3, 4]), T = R.pick([5, 6, 8]);
        return { key: "candle", xv: "t", xu: "hours", xn: "time", yv: "h", yu: "cm", yn: "height", m: -r, b: r * T, xint: T, per: "cm per hour",
          set: "A candle burns down at a steady rate. Its height $h$, in cm, after $t$ hours is $h = " + r * T + " - " + r + "t$.",
          say: { m: "The candle gets " + r + " cm shorter every hour.", b: "The candle was " + r * T + " cm tall before it was lit.", x: "The candle burns out after " + T + " hours." },
          wrong: "The candle burns for " + r + " hours." }; },
      tank: function () { var r = R.pick([5, 10, 20]), T = R.pick([4, 5, 6, 8]);
        return { key: "tank", xv: "t", xu: "minutes", xn: "time", yv: "W", yu: "litres", yn: "water", m: -r, b: r * T, xint: T, per: "litres per minute",
          set: "A tank is drained at a steady rate. The water left, $W$ litres, after $t$ minutes is $W = " + r * T + " - " + r + "t$.",
          say: { m: "The tank loses " + r + " litres of water every minute.", b: "The tank held " + r * T + " litres before it started draining.", x: "The tank is empty after " + T + " minutes." },
          wrong: "It takes " + r + " minutes to drain a litre." }; },
      battery: function () { var r = R.pick([10, 20, 25]), T = 100 / r;
        return { key: "battery", xv: "h", xu: "hours", xn: "time", yv: "B", yu: "percent", yn: "charge", m: -r, b: 100, xint: T, per: "percent per hour",
          set: "A phone starts fully charged. Its battery, $B$ percent, after $h$ hours of use is $B = 100 - " + r + "h$.",
          say: { m: "The phone uses " + r + "% of its battery every hour.", b: "The battery starts at 100% — fully charged.", x: "The battery runs out after " + num(T) + " hours." },
          wrong: "The phone charges " + r + "% every hour." }; },
      savings: function () { var s0 = R.pick([20, 40, 60, 80]), r = R.pick([10, 15, 20, 25]);
        return { key: "savings", xv: "w", xu: "weeks", xn: "time", yv: "S", yu: "dollars", yn: "savings", m: r, b: s0, per: "dollars per week",
          set: "Maya puts the same amount into savings every week. Her savings $S$, in dollars, after $w$ weeks are $S = " + s0 + " + " + r + "w$.",
          say: { m: "Maya saves \\$" + r + " every week.", b: "Maya had \\$" + s0 + " saved at the start.", x: null },
          wrong: "Maya saves \\$" + s0 + " every week." }; },
      taxi: function () { var f = R.pick([2, 3, 4, 5]), r = R.pick([2, 3]);
        return { key: "taxi", xv: "m", xu: "miles", xn: "distance", yv: "C", yu: "dollars", yn: "cost", m: r, b: f, per: "dollars per mile",
          set: "A taxi's fare $C$, in dollars, for a trip of $m$ miles is $C = " + f + " + " + r + "m$.",
          say: { m: "Each mile adds \\$" + r + " to the fare.", b: "It costs \\$" + f + " just to get in, before driving any miles.", x: null },
          wrong: "Each mile costs \\$" + f + "." }; },
      plant: function () { var h0 = R.pick([2, 4, 5, 6]), r = R.pick([1, 2, 3]);
        return { key: "plant", xv: "w", xu: "weeks", xn: "time", yv: "h", yu: "cm", yn: "height", m: r, b: h0, per: "cm per week",
          set: "A seedling grows at a steady rate. Its height $h$, in cm, after $w$ weeks is $h = " + h0 + " + " + (r === 1 ? "" : r) + "w$.",
          say: { m: "The plant grows " + r + " cm every week.", b: "The plant was " + h0 + " cm tall when the measuring started.", x: null },
          wrong: "The plant grows " + h0 + " cm every week." }; },
      gym: function () { var f = R.pick([10, 15, 20, 25]), r = R.pick([5, 10]);
        return { key: "gym", xv: "v", xu: "visits", xn: "visits", yv: "C", yu: "dollars", yn: "cost", m: r, b: f, per: "dollars per visit",
          set: "A pool charges a joining fee plus a price per visit. The cost $C$, in dollars, of $v$ visits is $C = " + f + " + " + r + "v$.",
          say: { m: "Each visit costs \\$" + r + ".", b: "The joining fee is \\$" + f + ".", x: null },
          wrong: "Each visit costs \\$" + f + "." }; },
      descent: function () { var r = R.pick([300, 500]), T = R.pick([8, 10, 12]);
        return { key: "descent", xv: "t", xu: "minutes", xn: "time", yv: "A", yu: "metres", yn: "altitude", m: -r, b: r * T, xint: T, per: "metres per minute",
          set: "A plane comes down to land at a steady rate. Its altitude $A$, in metres, $t$ minutes after it starts descending is $A = " + r * T + " - " + r + "t$.",
          say: { m: "The plane drops " + r + " metres every minute.", b: "The plane was at " + r * T + " metres when it started to descend.", x: "The plane lands after " + T + " minutes." },
          wrong: "The plane takes " + r + " minutes to land." }; }
    };
    var keys = only || Object.keys(S);
    return S[R.pick(keys)]();
  }
  // Axes for a story's graph.
  function storyAxes(s) {
    var xmax = s.xint ? s.xint : 8, ymax = Math.max(s.b, s.m * xmax + s.b);
    var gy = nice(ymax / 8), ey = ymax / gy > 6 ? gy * 2 : gy;
    return { x: [-0.6, xmax + 1], y: [-gy * 0.7, ymax + gy], grid: 1, gridY: gy, labelEvery: xmax > 12 ? 2 : 1, labelEveryY: ey,
             axisLabels: [s.xv + " (" + s.xu + ")", s.yv + " (" + s.yu + ")"], xmax: xmax, ymax: ymax };
  }

  L.unit("alg", 4, {
    title: "Linear equations & graphs",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "A line of solutions",
        blurb: "An equation in two letters has a solution for every x — and they all lie on a line.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Until now an equation had one letter and, usually, one answer. An equation with **two** letters, like $y = 2x + 1$, is a rule that links them: choose any $x$ and it tells you $y$. <br><br>So a solution is a **pair** of numbers, written $(x, y)$ — $x$ first.",
            scene: { type: "walk", rows: [
              { m: "x = 0: \\; y = 2(0) + 1 = 1", say: "So $(0, 1)$ is a solution." },
              { m: "x = 1: \\; y = 2(1) + 1 = 3", say: "So is $(1, 3)$." },
              { m: "x = 2: \\; y = 2(2) + 1 = 5", say: "And $(2, 5)$. Every $x$ you pick gives another one." }] },
            gate: true },
          { type: "choice", prompt: "Is $(3, 7)$ a solution of $y = 2x + 1$?", skill: "Solutions to 2-variable equations",
            options: [{ t: "Yes" }, { t: "No", fb: "Put $x = 3$ in: $2(3) + 1 = 7$. That's the $y$ in the pair, so it works." }],
            answer: 0, hints: ["Put $x = 3$ into the rule and see whether you get $y = 7$."], why: "$2(3) + 1 = 7$ ✓" },
          { type: "choice", prompt: "Is $(4, 2)$ a solution of $y = 2x + 1$?", skill: "Solutions to 2-variable equations",
            options: [{ t: "No" }, { t: "Yes", fb: "With $x = 4$ the rule gives $y = 9$, not $2$." }],
            answer: 0, hints: ["The first number is $x$. Put $x = 4$ in."], why: "$2(4) + 1 = 9 \\ne 2$, so it isn't." },
          { type: "learn", kicker: "Plot them",
            prompt: "Here are those solutions plotted. Now drag the orange point until it sits on another solution of $y = 2x + 1$ — the readout checks it for you.",
            scene: { type: "plane", x: [-6, 6], y: [-8, 10],
              marks: [{ x: 0, y: 1, label: "(0, 1)" }, { x: 1, y: 3, label: "(1, 3)" }, { x: 2, y: 5, label: "(2, 5)" }, { x: -1, y: -1, label: "(−1, −1)" }],
              points: [{ id: "P", x: 4, y: 2, drag: true, color: "orange" }],
              readout: function (st) { var p = st.pt("P"), y = 2 * p.x + 1; return "At $x = " + num(p.x) + "$ the rule gives $y = " + num(y) + "$ — " + (Math.abs(y - p.y) < 1e-9 ? "so this point **is** a solution ✓" : "this point has $y = " + num(p.y) + "$, so it isn't a solution."); },
              goal: function (st) { var p = st.pt("P"); return Math.abs(p.y - (2 * p.x + 1)) < 1e-9 && [0, 1, 2, -1].indexOf(p.x) < 0; } },
            gate: true,
            then: "Every solution lies on one straight line, and every point on that line is a solution. That is why an equation like this is called a **linear** equation, and the line is its **graph**." },
          { type: "multi", prompt: "Which of these are solutions of $x + y = 6$? Pick every one.", skill: "Solutions to 2-variable equations",
            options: [{ t: "$(2, 4)$", ok: true }, { t: "$(6, 0)$", ok: true }, { t: "$(-1, 7)$", ok: true },
                      { t: "$(3, 4)$", ok: false, fb: "$3 + 4 = 7$, not 6." }, { t: "$(5, 2)$", ok: false, fb: "$5 + 2 = 7$, not 6." }],
            hints: ["For each pair, add the two numbers. You need 6."], why: "$2 + 4$, $6 + 0$ and $-1 + 7$ all make 6." },
          { type: "learn", kicker: "Completing a solution",
            prompt: "If you know one number of a solution, put it in and solve for the other — it's a one-letter equation again.",
            scene: { type: "walk", rows: [
              { m: "3x + 2y = 12, \\;\\; x = 2", say: "Find the $y$ that goes with $x = 2$." },
              { m: "3(2) + 2y = 12", say: "Put $2$ in for $x$." },
              { m: "6 + 2y = 12", say: "" },
              { m: "2y = 6 \\;\\Rightarrow\\; y = 3", say: "So $(2, 3)$ is a solution." }] },
            gate: true },
          { type: "num", prompt: "In $2x + y = 10$, what is $y$ when $x = 3$?", pre: "$y =$", answer: 4, skill: "Complete solutions",
            near: [{ v: 7, fb: "$2x$ means $2 \\times 3 = 6$, so $6 + y = 10$." }],
            hints: ["Put $x = 3$ in: $2(3) + y = 10$."], why: lines(["2(3) + y = 10", "6 + y = 10", "y = 4"]) },
          { type: "num", prompt: "In $4x - 3y = 6$, what is $x$ when $y = 2$?", pre: "$x =$", answer: 3, skill: "Complete solutions",
            near: [{ v: 0, fb: "$-3y$ with $y = 2$ is $-6$: $4x - 6 = 6$." }],
            hints: ["Put $y = 2$ in: $4x - 3(2) = 6$.", "That's $4x - 6 = 6$, so $4x = 12$."], why: lines(["4x - 3(2) = 6", "4x - 6 = 6", "4x = 12", "x = 3"]) },
          { type: "table", prompt: "Fill in the table for $y = 3x - 1$.", skill: "Complete solutions",
            head: ["$x$", "$y$"], rows: [[-1, null], [0, null], [1, null], [2, null]], answers: [[0, 1, -4], [1, 1, -1], [2, 1, 2], [3, 1, 5]],
            hints: ["For each $x$, work out $3x - 1$. With $x = -1$: $3(-1) - 1$."], why: "$-4, -1, 2, 5$: each step of 1 in $x$ adds 3 to $y$." },
          { type: "num", prompt: "The point $(4, k)$ is on the line $y = -x + 7$. What is $k$?", pre: "$k =$", answer: 3, skill: "Complete solutions",
            near: [{ v: 11, fb: "$-x$ with $x = 4$ is $-4$: $-4 + 7$." }],
            hints: ["On the line means it's a solution. Put $x = 4$ in."], why: "$y = -4 + 7 = 3$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Slope",
        blurb: "How steep a line is: the rise for every step of run — from a graph, a table or two points.",
        mins: 13, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "The **slope** of a line says how steep it is: how far it goes **up** (the rise) for each step to the **right** (the run). Drag the two points and watch the triangle between them.",
            scene: { type: "plane", x: [-8, 8], y: [-8, 8],
              points: [{ id: "A", x: -3, y: -2, drag: true }, { id: "B", x: 3, y: 1, drag: true }],
              lines: [{ through: ["A", "B"], slope: true }],
              readout: function (st) {
                var a = st.pt("A"), b = st.pt("B");
                if (a.x === b.x) return a.y === b.y ? "Pull the points apart." : "The run is $0$ — the line is upright, and its slope is **undefined** (you can't divide by zero).";
                var r = b.y - a.y, u = b.x - a.x;
                return "slope $= \\frac{\\text{rise}}{\\text{run}} = \\frac{" + num(r) + "}{" + num(u) + "} = " + frac(r, u) + "$" + (r * u > 0 ? " — it goes **up** to the right." : r === 0 ? " — it's flat." : " — it goes **down** to the right.");
              } },
            gate: true,
            then: "Slope is $\\frac{\\text{rise}}{\\text{run}}$. A line going up to the right has a **positive** slope; one going down has a **negative** slope; a flat line has slope $0$. And it doesn't matter which two points you use — the triangle changes size but not its ratio." },
          { type: "learn", kicker: "Watch",
            prompt: "Reading a slope off a graph: pick two points where the line crosses the grid exactly, and count.",
            scene: { type: "walk", rows: [
              { say: "The line passes through $(0, 1)$ and $(2, 5)$." },
              { m: "\\text{run} = 2 - 0 = 2", say: "From the first point, go right 2." },
              { m: "\\text{rise} = 5 - 1 = 4", say: "Then up 4 to reach the second." },
              { m: "\\text{slope} = \\frac{4}{2} = 2", say: "It climbs 2 for every 1 across." }] },
            gate: true },
          { type: "num", prompt: "What is the slope of this line? (A fraction is fine, like 3/4.)", answer: 0.5, skill: "Slope from graph",
            scene: showLine(0.5, 0, { marks: [[-2, -1], [2, 1]] }),
            near: [{ v: 2, fb: "That's run over rise. Slope is **rise** over run: up 2 for across 4." }, { v: -0.5, fb: "The line goes **up** to the right, so the slope is positive." }],
            hints: ["From $(-2, -1)$ to $(2, 1)$: how far right? How far up?", "Right 4, up 2."], why: "$\\frac{\\text{rise}}{\\text{run}} = \\frac{2}{4} = \\frac{1}{2}$." },
          { type: "num", prompt: "And this one?", answer: -1.5, skill: "Slope from graph",
            scene: showLine(-1.5, -0.5, { marks: [[-3, 4], [1, -2]] }),
            near: [{ v: 1.5, fb: "The line goes **down** to the right, so the slope is negative." }, { v: -2 / 3, fb: "That's run over rise. Slope is rise over run: down 6 for across 4." }],
            hints: ["From $(-3, 4)$ to $(1, -2)$: right 4, and down how far?", "Down 6 is a rise of $-6$."], why: "$\\frac{-6}{4} = -\\frac{3}{2}$." },
          { type: "learn", kicker: "Drawing from a slope",
            prompt: "Given a point and a slope, you can draw the line: start at the point, then use the slope as directions — the top says how far up (or down), the bottom how far right.",
            scene: { type: "walk", rows: [
              { say: "Draw the line through $(1, -2)$ with slope $\\frac{2}{3}$." },
              { m: "(1, -2)", say: "Start here." },
              { m: "\\text{up } 2, \\text{ right } 3", say: "The slope says rise 2 for run 3." },
              { m: "(4, 0)", say: "That's a second point. Join the two." }] },
            gate: true },
          { type: "plane", prompt: "Draw the line through $(-2, 1)$ with slope $\\frac{3}{4}$: drag the orange point to a second point on it.", skill: "Graphing from slope",
            points: [{ id: "P", x: -2, y: 1, color: "blue" }, { id: "B", x: 3, y: -4, drag: true, color: "orange" }],
            lines: [{ through: ["P", "B"], slope: true, color: "orange" }],
            answer: { points: { B: [2, 4] } },
            check: function (st) { var b = st.pt("B"); if (b.x === -2) return { ok: false, say: "Straight up or down from the point is a run of 0. Move right." };
              var ok = Math.abs((b.y - 1) / (b.x + 2) - 0.75) < 1e-9; return { ok: ok, say: ok ? null : "The triangle shows your rise and run. You need up 3 for every 4 to the right." }; },
            hints: ["Start at $(-2, 1)$. Go right 4.", "Then up 3: that's $(2, 4)$."], why: "Up 3, right 4 from $(-2, 1)$ lands on $(2, 4)$." },
          { type: "learn", kicker: "From a table",
            prompt: "A table of points on a line shows the slope too: compare how much $y$ changes with how much $x$ changes.",
            scene: { type: "walk", rows: [
              { say: "$x$: 1, 3, 5, 7 and $y$: 2, 8, 14, 20." },
              { m: "x \\text{ goes up by } 2 \\text{ each row}", say: "That's the run." },
              { m: "y \\text{ goes up by } 6 \\text{ each row}", say: "That's the rise." },
              { m: "\\text{slope} = \\frac{6}{2} = 3", say: "" }] },
            gate: true },
          { type: "num", prompt: "These points lie on a line. What is its slope?", answer: -2.5, skill: "Slope in a table",
            scene: tbl(["$x$", "$y$"], [[-2, 9], [0, 4], [2, -1], [4, -6]]),
            near: [{ v: -5, fb: "$y$ drops 5 each row, but $x$ goes up by **2**, not 1. Divide." }, { v: 2.5, fb: "$y$ is going **down** as $x$ goes up, so the slope is negative." }],
            hints: ["How much does $x$ change from one row to the next? And $y$?"], why: "$\\frac{-5}{2} = -\\frac{5}{2}$." },
          { type: "learn", kicker: "The formula",
            prompt: "With two points and no grid, subtract. For points $(x_1, y_1)$ and $(x_2, y_2)$: $$m = \\frac{y_2 - y_1}{x_2 - x_1}$$ The letter $m$ is the usual name for slope.",
            scene: { type: "walk", rows: [
              { say: "Find the slope through $(-1, 4)$ and $(3, -4)$." },
              { m: "m = \\frac{-4 - 4}{3 - (-1)}", say: "The $y$'s on top, the $x$'s on the bottom — both in the same order." },
              { m: "m = \\frac{-8}{4} = -2", say: "" }] },
            gate: true },
          { type: "num", prompt: "What is the slope of the line through $(2, 3)$ and $(6, 11)$?", pre: "$m =$", answer: 2, skill: "Slope from two points",
            near: [{ v: 0.5, fb: "That's the $x$'s over the $y$'s. The $y$'s go on top." }],
            hints: ["$m = \\frac{11 - 3}{6 - 2}$."], why: "$\\frac{8}{4} = 2$." },
          { type: "num", prompt: "And through $(-4, 5)$ and $(2, 2)$?", pre: "$m =$", answer: -0.5, skill: "Slope from two points",
            near: [{ v: 0.5, fb: "$2 - 5 = -3$: the line goes down, so the slope is negative." }, { v: -2, fb: "The $y$'s go on top: $\\frac{-3}{6}$." }, { v: -1.5, fb: "$2 - (-4) = 6$, not 2." }],
            hints: ["$m = \\frac{2 - 5}{2 - (-4)}$.", "$2 - (-4) = 6$."], why: "$\\frac{-3}{6} = -\\frac{1}{2}$." },
          { type: "choice", prompt: "Kai finds the slope through $(1, 2)$ and $(5, 4)$ as $\\frac{5 - 1}{4 - 2} = 2$. What went wrong?", skill: "Slope from two points",
            options: [{ t: "He put the $x$'s on top — slope is the change in $y$ over the change in $x$" },
                      { t: "Nothing — the slope is 2", fb: "Check with a sketch: from $(1, 2)$ to $(5, 4)$ is right 4, up 2. That's not steep enough for 2." },
                      { t: "He should have added, not subtracted", fb: "Subtracting is right — it measures the change. The problem is which numbers went on top." }],
            answer: 0, why: "$m = \\frac{4 - 2}{5 - 1} = \\frac{2}{4} = \\frac{1}{2}$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Flat lines and upright lines",
        blurb: "Horizontal lines have slope 0; vertical lines have no slope at all.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "Flat",
            prompt: "A horizontal line doesn't rise at all.",
            scene: { type: "walk", rows: [
              { say: "Take the line through $(-3, 2)$ and $(4, 2)$." },
              { m: "m = \\frac{2 - 2}{4 - (-3)} = \\frac{0}{7} = 0", say: "Rise $0$: the slope is $0$." },
              { m: "y = 2", say: "Every point on it has $y = 2$, whatever $x$ is. That is its equation." }] },
            gate: true },
          { type: "learn", kicker: "Upright",
            prompt: "A vertical line doesn't run at all.",
            scene: { type: "walk", rows: [
              { say: "Take the line through $(3, -1)$ and $(3, 4)$." },
              { m: "m = \\frac{4 - (-1)}{3 - 3} = \\frac{5}{0}", say: "Run $0$ — and nothing can be divided by zero. The slope is **undefined**." },
              { m: "x = 3", say: "Every point on it has $x = 3$, whatever $y$ is. That is its equation." }] },
            gate: true,
            then: "So: **horizontal** lines are $y = \\text{a number}$ and have slope $0$. **Vertical** lines are $x = \\text{a number}$ and have no slope." },
          { type: "choice", prompt: "What is the slope of the line $y = -4$?", skill: "Horizontal & vertical lines",
            options: [{ t: "$0$" }, { t: "$-4$", fb: "$y = -4$ is flat: every point is at height $-4$. Flat lines have slope 0." }, { t: "Undefined", fb: "Undefined slope belongs to vertical lines, $x = \\ldots$. This one is horizontal." }],
            answer: 0, why: "$y = -4$ is horizontal, so its slope is $0$." },
          { type: "choice", prompt: "What is the slope of the line $x = 5$?", skill: "Horizontal & vertical lines",
            options: [{ t: "Undefined" }, { t: "$0$", fb: "Slope 0 is flat. $x = 5$ is upright: every point has $x = 5$." }, { t: "$5$", fb: "$x = 5$ is a vertical line. Its run is 0, so its slope is undefined." }],
            answer: 0, why: "$x = 5$ is vertical: the run is $0$, and dividing by $0$ is undefined." },
          { type: "equation", prompt: "Write the equation of the **horizontal** line through $(2, -5)$.", answer: "y = -5", skill: "Horizontal & vertical lines",
            near: [{ v: "x = 2", fb: "$x = 2$ is the **vertical** line through that point. The horizontal one keeps the same $y$." }],
            placeholder: "y = …", hints: ["A horizontal line keeps the same $y$ all the way along."], why: "Every point has $y = -5$." },
          { type: "equation", prompt: "Write the equation of the **vertical** line through $(-3, 6)$.", answer: "x = -3", skill: "Horizontal & vertical lines",
            near: [{ v: "y = 6", fb: "That's the horizontal line. The vertical one keeps the same $x$." }],
            placeholder: "x = …", hints: ["A vertical line keeps the same $x$ all the way along."], why: "Every point has $x = -3$." },
          { type: "plane", prompt: "Drag the two points to draw the line $x = -2$.", skill: "Horizontal & vertical lines",
            points: [{ id: "A", x: 3, y: 3, drag: true, color: "orange" }, { id: "B", x: 5, y: -2, drag: true, color: "orange" }],
            lines: [{ through: ["A", "B"], color: "orange" }], answer: { points: { A: [-2, 3], B: [-2, -4] } },
            check: function (st) { var A = st.pt("A"), B = st.pt("B");
              if (A.x === B.x && A.y === B.y) return { ok: false, say: "The points are on top of each other. Spread them out." };
              var ok = A.x === -2 && B.x === -2; return { ok: ok, say: ok ? null : A.y === B.y ? "That's a horizontal line. $x = -2$ is upright: every point has $x = -2$." : "Every point on $x = -2$ has an $x$-coordinate of $-2$." }; },
            hints: ["Every point on the line has $x = -2$, whatever its $y$."], why: "Any two points with $x = -2$ — the line is vertical." },
          { type: "choice", prompt: "Which is the equation of the line through $(4, 1)$ and $(4, -6)$?", skill: "Horizontal & vertical lines",
            options: [{ t: "$x = 4$" }, { t: "$y = 4$", fb: "The two points share $x = 4$, not $y = 4$. The line is vertical." },
                      { t: "$y = 1$", fb: "The $y$'s are different (1 and $-6$), so it isn't horizontal." }],
            answer: 0, why: "Both points have $x = 4$, so the line is vertical: $x = 4$." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Where a line crosses the axes",
        blurb: "The x-intercept and y-intercept — from a graph, an equation or a table.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "New words",
            prompt: "Where a line crosses the $x$-axis is its **$x$-intercept**; where it crosses the $y$-axis is its **$y$-intercept**.",
            scene: showLine(0.75, 3, { marks: [[-4, 0, "x-intercept (−4, 0)", "orange"], [0, 3, "y-intercept (0, 3)", "orange"]] }),
            after: "Every point on the $x$-axis has $y = 0$, so the $x$-intercept is where $y = 0$. Every point on the $y$-axis has $x = 0$, so the $y$-intercept is where $x = 0$." },
          { type: "pair", prompt: "What is the $x$-intercept of this line? Give it as a point.", answer: [3, 0], skill: "Intercepts from a graph",
            scene: showLine(2, -6), hints: ["Where does the line cross the horizontal axis?", "On the $x$-axis, $y$ is always $0$."], why: "The line crosses the $x$-axis at $(3, 0)$." },
          { type: "pair", prompt: "And its $y$-intercept?", answer: [0, -6], skill: "Intercepts from a graph",
            scene: showLine(2, -6), hints: ["Where does the line cross the vertical axis?", "On the $y$-axis, $x$ is always $0$."], why: "It crosses the $y$-axis at $(0, -6)$." },
          { type: "learn", kicker: "From an equation",
            prompt: "To find an intercept from an equation, set the other letter to $0$.",
            scene: { type: "walk", rows: [
              { m: "2x + 3y = 12", say: "Find both intercepts." },
              { m: "y = 0: \\; 2x = 12, \\; x = 6", say: "The $x$-intercept is $(6, 0)$." },
              { m: "x = 0: \\; 3y = 12, \\; y = 4", say: "The $y$-intercept is $(0, 4)$." }] },
            gate: true },
          { type: "pair", prompt: "What is the $x$-intercept of $5x - 2y = 20$?", answer: [4, 0], skill: "Intercepts from an equation",
            hints: ["The $x$-intercept is where $y = 0$.", "$5x - 2(0) = 20$."], why: "$5x = 20$, so $x = 4$: the point $(4, 0)$." },
          { type: "pair", prompt: "What is the $y$-intercept of $y = -3x + 7$?", answer: [0, 7], skill: "Intercepts from an equation",
            hints: ["The $y$-intercept is where $x = 0$."], why: "$y = -3(0) + 7 = 7$: the point $(0, 7)$." },
          { type: "learn", kicker: "From a table",
            prompt: "In a table, look for the row where $x = 0$ (the $y$-intercept) and the row where $y = 0$ (the $x$-intercept). If the table stops short, carry on its pattern.",
            scene: { type: "walk", rows: [
              { say: "$x$: $-2, 0, 2, 4$ and $y$: $9, 6, 3, 0$." },
              { m: "x = 0 \\text{ row: } y = 6", say: "The $y$-intercept is $(0, 6)$." },
              { m: "y = 0 \\text{ row: } x = 4", say: "The $x$-intercept is $(4, 0)$." }] },
            gate: true },
          { type: "pair", prompt: "These points are on a line. What is its $x$-intercept?", answer: [3, 0], skill: "Intercepts from a table",
            scene: tbl(["$x$", "$y$"], [[1, -6], [2, -3], [3, 0], [4, 3]]), hints: ["Which row has $y = 0$?"], why: "The row $(3, 0)$ has $y = 0$." },
          { type: "pair", prompt: "What is the $y$-intercept of the line through these points? The table stops before it — carry on the pattern.", answer: [0, 2], skill: "Intercepts from a table",
            scene: tbl(["$x$", "$y$"], [[2, 5], [4, 8], [6, 11], [8, 14]]),
            near: [], hints: ["Each row, $x$ goes up 2 and $y$ goes up 3.", "Go back one row from $x = 2$: $x = 0$ and $y = 5 - 3$."], why: "One row back from $(2, 5)$ is $(0, 2)$." },
          { type: "choice", prompt: "What is the $x$-intercept of $y = 2x - 8$?", skill: "Intercepts from an equation",
            options: [{ t: "$(4, 0)$" }, { t: "$(0, -8)$", fb: "That's the $y$-intercept. For the $x$-intercept, set $y = 0$: $0 = 2x - 8$." },
                      { t: "$(-4, 0)$", fb: "$0 = 2x - 8$ gives $2x = 8$, so $x = +4$." }],
            answer: 0, why: "$0 = 2x - 8$, so $x = 4$: the point $(4, 0)$." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Slope and intercepts tell a story",
        blurb: "In a real situation the slope is a rate, and the intercepts are where it starts and ends.",
        mins: 13, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A candle $24$ cm tall burns down $3$ cm every hour, so its height after $t$ hours is $h = 24 - 3t$. Here is its graph — time across, height up.",
            scene: showLine(-3, 24, { x: [-0.6, 9], y: [-2, 27], gridY: 3, labelEveryY: 6, axisLabels: ["t (hours)", "h (cm)"], marks: [[0, 24, "(0, 24)", "orange"], [8, 0, "(8, 0)", "orange"]] }),
            after: "Each feature of the graph says something about the candle. The **$y$-intercept** $(0, 24)$: before it is lit ($t = 0$) it is $24$ cm tall. The **slope** $-3$: it loses $3$ cm every hour. The **$x$-intercept** $(8, 0)$: after $8$ hours its height is $0$ — it has burnt out." },
          { type: "choice", prompt: "For the candle, $h = 24 - 3t$, what does the slope $-3$ tell you?", skill: "Linear contexts & graph features",
            options: [{ t: "The candle gets 3 cm shorter every hour" }, { t: "The candle burns for 3 hours", fb: "It burns for 8 hours — that's the $x$-intercept. The slope is how fast the height changes." },
                      { t: "The candle is 3 cm tall at the start", fb: "The starting height is the $y$-intercept, 24 cm." }],
            answer: 0, why: "Slope is a rate: $-3$ cm of height for every hour." },
          { type: "choice", prompt: "Same candle. What does the $x$-intercept $(8, 0)$ tell you?", skill: "Linear contexts & graph features",
            options: [{ t: "After 8 hours the candle is gone" }, { t: "The candle is 8 cm tall", fb: "At the $x$-intercept the height is 0, not 8. The 8 is the time." },
                      { t: "The candle burns 8 cm an hour", fb: "The burning rate is the slope, 3 cm an hour." }],
            answer: 0, why: "At $t = 8$, $h = 0$: the candle has burnt down completely." },
          { type: "learn", kicker: "From a table",
            prompt: "A table of a straight-line situation shows its rate and starting value too.",
            scene: { type: "walk", rows: [
              { say: "A taxi's fare: $0$ miles costs \\$3, $2$ miles \\$7, $4$ miles \\$11, $6$ miles \\$15." },
              { m: "\\frac{7 - 3}{2 - 0} = 2", say: "Every mile adds \\$2: that's the slope, the rate." },
              { m: "(0, 3)", say: "Zero miles still costs \\$3: that's the $y$-intercept, the fee just to get in." },
              { m: "C = 2m + 3", say: "The equation puts both together." }] },
            gate: true },
          { type: "num", prompt: "A plumber's bill depends on how long the job takes. How much does each extra hour cost, in dollars?", answer: 45, pre: "\\$", skill: "Word problems: tables",
            scene: tbl(["Hours", "Bill (\\$)"], [[1, 105], [2, 150], [3, 195], [4, 240]]),
            near: [{ v: 105, fb: "That's the bill for one hour. The cost of each **extra** hour is how much the bill goes up per row." }],
            hints: ["How much does the bill go up from one row to the next?"], why: "$150 - 105 = 45$ each hour." },
          { type: "num", prompt: "Same plumber. What is the call-out fee — the bill for $0$ hours?", answer: 60, pre: "\\$", skill: "Word problems: tables",
            near: [{ v: 105, fb: "That's one hour's bill. Go back one row: take away one hour's cost." }],
            hints: ["Carry the table back one row, to 0 hours.", "$105 - 45$."], why: "$105 - 45 = 60$: the fee before any hours are worked." },
          { type: "num", prompt: "This graph shows Leo's savings. How many dollars does he save each week?", answer: 20, pre: "\\$", skill: "Word problems: graphs",
            scene: showLine(20, 40, { x: [-0.6, 8.5], y: [-12, 210], gridY: 20, labelEveryY: 40, axisLabels: ["weeks", "savings ($)"], marks: [[0, 40, "(0, 40)"], [5, 140, "(5, 140)"]] }),
            near: [{ v: 28, fb: "$\\frac{140}{5}$ ignores the \\$40 he started with. Use the change: $140 - 40$." }, { v: 40, fb: "\\$40 is where he started, the $y$-intercept." }],
            hints: ["From week 0 to week 5 his savings go from \\$40 to \\$140."], why: "$\\frac{140 - 40}{5 - 0} = 20$ dollars a week." },
          { type: "learn", kicker: "Graphing a story",
            prompt: "To graph a situation, start at the $y$-intercept and use the rate to climb.",
            scene: { type: "walk", rows: [
              { say: "A pool charges \\$10 to join and \\$5 a visit: $C = 5v + 10$." },
              { m: "(0, 10)", say: "No visits: it costs the \\$10 fee." },
              { m: "(1, 15), (2, 20), \\ldots", say: "Each visit adds \\$5: across 1, up 5." }] },
            gate: true },
          { type: "plane", prompt: "Graph $C = 5v + 10$: drag both points onto the line. (Cost goes up in steps of \\$5.)", skill: "Graphing word problems",
            x: [-0.6, 10.5], y: [-5, 70], gridY: 5, labelEveryY: 10, snapY: 5, axisLabels: ["v (visits)", "C ($)"],
            points: [{ id: "A", x: 2, y: 50, drag: true, color: "orange" }, { id: "B", x: 7, y: 20, drag: true, color: "orange" }],
            lines: [{ through: ["A", "B"], color: "orange" }], answer: { points: { A: [0, 10], B: [6, 40] } },
            check: function (st) { var A = st.pt("A"), B = st.pt("B"); if (A.x === B.x && A.y === B.y) return { ok: false, say: "Spread the points out." };
              var on = function (p) { return Math.abs(p.y - (5 * p.x + 10)) < 1e-9; };
              return { ok: on(A) && on(B), say: on(A) || on(B) ? "One point is right. For the other, work out $5v + 10$ at its $v$." : "Start with $(0, 10)$, then use \\$5 per visit." }; },
            hints: ["One point is $(0, 10)$.", "Another: 6 visits cost $5(6) + 10 = 40$."], why: "The line starts at $(0, 10)$ and rises 5 for each visit." },
          { type: "num", prompt: "Same pool. What do $7$ visits cost?", answer: 45, pre: "\\$", skill: "Slope & intercepts in context",
            near: [{ v: 35, fb: "Don't forget the \\$10 joining fee." }], hints: ["$C = 5(7) + 10$."], why: "$5(7) + 10 = 45$." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Comparing rates",
        blurb: "Two situations told in different ways: which grows faster, and when do they meet?",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Two rates can be compared however they're given — an equation, a table or a graph — once you find the slope of each.",
            scene: { type: "walk", rows: [
              { say: "Ana starts with \\$50 and saves \\$15 a week. Ben's savings: week 0 \\$20, week 1 \\$40, week 2 \\$60." },
              { m: "\\text{Ana: } 15 \\text{ per week}", say: "Her rate is in the words." },
              { m: "\\text{Ben: } \\frac{40 - 20}{1} = 20 \\text{ per week}", say: "His is the change per row." },
              { say: "Ben saves faster, though Ana started ahead." }] },
            gate: true },
          { type: "learn", kicker: "Watch them go",
            prompt: "Here they are as a race: Ana's head start against Ben's faster rate. Press play.",
            scene: { type: "race", runners: [{ name: "Ana", rate: 15, start: 50, color: "blue" }, { name: "Ben", rate: 20, start: 20, color: "orange" }], t: 10, unit: "dollars", timeUnit: "weeks", len: 230 },
            gate: true, then: "Ben catches up at week 6, when they both have \\$140, and pulls ahead after that." },
          { type: "num", prompt: "After how many weeks do Ana ($S = 50 + 15w$) and Ben ($S = 20 + 20w$) have the same amount?", answer: 6, post: "weeks", skill: "Comparing linear rates",
            hints: ["Set them equal: $50 + 15w = 20 + 20w$.", "Take $15w$ and $20$ from both sides: $30 = 5w$."], why: lines(["50 + 15w = 20 + 20w", "30 = 5w", "w = 6"]) },
          { type: "choice", prompt: "Phone plan A costs \\$30 a month plus \\$2 per GB. Plan B's cost is $C = 4g + 10$. Which is cheaper for $5$ GB?", skill: "Comparing linear rates",
            options: [{ t: "Plan B" }, { t: "Plan A", fb: "A: $30 + 2(5) = 40$. B: $4(5) + 10 = 30$. B is cheaper at 5 GB." }, { t: "They cost the same", fb: "They cost the same at 10 GB, not 5." }],
            answer: 0, why: "A costs $30 + 10 = \\$40$; B costs $20 + 10 = \\$30$." },
          { type: "num", prompt: "For how many GB do plans A and B cost the same?", answer: 10, post: "GB", skill: "Comparing linear rates",
            hints: ["$30 + 2g = 4g + 10$."], why: lines(["30 + 2g = 4g + 10", "20 = 2g", "g = 10"]) },
          { type: "choice", prompt: "Which plan's cost grows faster as you use more data?", skill: "Comparing linear rates",
            options: [{ t: "Plan B — \\$4 per GB" }, { t: "Plan A — it starts higher", fb: "Starting higher is the $y$-intercept. Growing faster is about the slope: \\$2 against \\$4 per GB." }],
            answer: 0, why: "The rate is the slope: B adds \\$4 per GB, A only \\$2." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Solutions to two-variable equations, and slope from a graph, a table and two points.",
        skills: ["a4-sol", "a4-complete", "a4-slope-graph", "a4-graph-slope", "a4-slope-table", "a4-slope-pts"], per: 2 },
      { title: "Quiz 2", after: 4, blurb: "Horizontal and vertical lines, and intercepts from graphs, equations and tables.",
        skills: ["a4-hv", "a4-int-graph", "a4-int-eq", "a4-int-table"], per: 2 },
      { title: "Quiz 3", after: 6, blurb: "Slope and intercepts in real situations, graphing them, and comparing rates.",
        skills: ["a4-context", "a4-use", "a4-tables", "a4-graphs", "a4-graph-words", "a4-compare"], per: 1 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Solutions of an equation in two letters",
        say: ["An equation with two letters, like $y = 2x + 1$, links them. A **solution** is a pair of numbers, written $(x, y)$ with $x$ first, that makes it true.",
              "To test a pair, put both numbers in. To complete a pair, put in the number you know and solve for the other.",
              "All the solutions lie on a straight line — the equation's **graph** — which is why these are called **linear** equations."],
        eg: { q: "Complete the solution $(2, \\;?)$ of $3x + 2y = 12$.",
              rows: [["3(2) + 2y = 12", "Put $x = 2$ in."], ["2y = 6", "Take 6 from both sides."], ["y = 3", "The pair is $(2, 3)$."]] },
        watch: "In $(4, 2)$ the $4$ is $x$ and the $2$ is $y$. Swapping them tests a different point." },
      { t: "Slope",
        say: ["The **slope** of a line is how much it rises for each step to the right: $\\frac{\\text{rise}}{\\text{run}}$. It is usually called $m$.",
              "Up to the right is a positive slope; down to the right is negative. The bigger the number (ignoring its sign), the steeper the line."],
        keys: [["From a graph", "pick two points on grid corners and count the rise and run"], ["From a table", "change in $y$ ÷ change in $x$, row to row"],
               ["From two points", "$m = \\frac{y_2 - y_1}{x_2 - x_1}$"]],
        eg: { q: "Find the slope through $(-4, 5)$ and $(2, 2)$.",
              rows: [["m = \\frac{2 - 5}{2 - (-4)}", "$y$'s on top, $x$'s on the bottom, same order."], ["m = \\frac{-3}{6} = -\\frac{1}{2}", ""]] },
        watch: "Slope is rise over run — the $y$'s go on top. $\\frac{\\text{run}}{\\text{rise}}$ gives the upside-down answer." },
      { t: "Drawing a line from a point and a slope",
        say: ["Start at the point. The slope's top says how far to go up (down, if it's negative); its bottom says how far to go right. That lands on a second point — join them.",
              "A whole-number slope like $3$ is $\\frac{3}{1}$: up 3, right 1."],
        eg: { q: "Draw the line through $(1, -2)$ with slope $\\frac{2}{3}$.",
              rows: [["(1, -2)", "Start here."], ["(1 + 3, -2 + 2) = (4, 0)", "Right 3, up 2."]] } },
      { t: "Horizontal and vertical lines",
        keys: [["Horizontal", "$y = c$: slope $0$ — it never rises"], ["Vertical", "$x = c$: slope **undefined** — the run is $0$, and nothing divides by $0$"]],
        say: ["Every point on a horizontal line has the same $y$; every point on a vertical line has the same $x$. That shared number is the equation."],
        watch: "$x = 3$ is the **vertical** line, even though it has an $x$ in it: it's all the points whose $x$ is 3." },
      { t: "Intercepts",
        say: ["The **$x$-intercept** is where a line crosses the $x$-axis, so its $y$ is $0$. The **$y$-intercept** is where it crosses the $y$-axis, so its $x$ is $0$.",
              "From an equation: set the other letter to $0$ and solve. From a table: find the row with a $0$ in it, or carry the pattern on until there is one."],
        eg: { q: "Find both intercepts of $2x + 3y = 12$.",
              rows: [["y = 0: \\; 2x = 12, \\; x = 6", "$x$-intercept $(6, 0)$."], ["x = 0: \\; 3y = 12, \\; y = 4", "$y$-intercept $(0, 4)$."]] },
        watch: "Give an intercept as a point: the $x$-intercept $6$ is the point $(6, 0)$, not $(0, 6)$." },
      { t: "Slope and intercepts in a real situation",
        say: ["When a quantity changes at a steady rate, its graph is a line. The **slope** is the rate — how much the quantity changes for each unit of the other. The **$y$-intercept** is the starting value, when the other quantity is $0$. The **$x$-intercept**, if it means anything, is when the quantity reaches $0$.",
              "From a table: the rate is the change per row divided by the step; the start is the row for $0$ (carry the table back if it isn't there)."],
        eg: { q: "A candle is $h = 24 - 3t$ cm tall after $t$ hours. What do the features mean?",
              rows: [["(0, 24)", "It starts 24 cm tall."], ["m = -3", "It loses 3 cm every hour."], ["(8, 0)", "It burns out after 8 hours."]] },
        watch: "The rate comes from the **change** between two points, not from dividing one reading by its time: \\$140 after 5 weeks from a \\$40 start is \\$20 a week, not \\$28." },
      { t: "Comparing linear situations",
        say: ["To compare two steady situations given in different forms, find the rate (slope) and starting value of each.",
              "The greater slope grows faster. A higher starting value only gives a head start. To find when they are equal, set the two expressions equal and solve."],
        eg: { q: "When does $50 + 15w$ catch up with, or get caught by, $20 + 20w$?",
              rows: [["50 + 15w = 20 + 20w", "Set them equal."], ["30 = 5w", ""], ["w = 6", "Equal after 6 weeks."]] } }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a4-sol", title: "Solutions to 2-variable equations", lesson: 1,
        gen: function (R) {
          var y0, tex, f;
          if (R.chance(0.5)) {
            var m = R.nz(-4, 5), b = R.int(-8, 8);
            tex = "y = " + poly([[m, "x"], [b, ""]]); f = function (x) { return m * x + b; };
          } else {
            var A = R.nz(-5, 6), B = R.nz(-5, 6), x1 = R.int(-5, 5), y1 = R.int(-5, 5), C = A * x1 + B * y1;
            tex = poly([[A, "x"], [B, "y"]]) + " = " + C;
            f = function (x) { return (C - A * x) / B; };
          }
          // A right pair with whole numbers, and wrong ones that look likely.
          var x = null;
          for (var t = 0; t < 40; t++) { var c = R.int(-6, 6); if (Math.abs(f(c) % 1) < 1e-9 && Math.abs(f(c)) <= 20) { x = c; break; } }
          if (x === null) { x = 0; }
          y0 = r6(f(x));
          if (y0 % 1) { tex = "y = " + poly([[2, "x"], [1, ""]]); f = function (z) { return 2 * z + 1; }; x = 2; y0 = 5; }
          var wrong = [
            { t: "$" + pt(y0, x) + "$", fb: "The first number is $x$. With $x = " + num(y0) + "$ the equation doesn't give $y = " + num(x) + "$." },
            { t: "$" + pt(x, y0 + 1) + "$", fb: "Put $x = " + num(x) + "$ in: the equation needs $y = " + num(y0) + "$, not $" + num(y0 + 1) + "$." },
            { t: "$" + pt(x, -y0) + "$", fb: "Check the sign: with $x = " + num(x) + "$, $y$ is $" + num(y0) + "$." }];
          return mc(R, { prompt: "Which ordered pair is a solution of $" + tex + "$?", right: "$" + pt(x, y0) + "$",
            wrong: wrong.filter(function (w) { return w.t !== "$" + pt(x, y0) + "$"; }),
            hints: ["Put each pair's numbers in — $x$ first, then $y$ — and see which one makes the equation true."],
            why: "With $x = " + num(x) + "$ and $y = " + num(y0) + "$, both sides of $" + tex + "$ agree." });
        } },
      { id: "a4-complete", title: "Complete solutions to 2-variable equations", lesson: 1,
        gen: function (R) {
          var A = R.nz(-6, 7), B = R.nz(-6, 7), x = R.int(-6, 6), y = R.int(-6, 6), C = A * x + B * y;
          var tex = poly([[A, "x"], [B, "y"]]) + " = " + C;
          if (R.chance(0.5)) {
            return { type: "num", prompt: "In $" + tex + "$, what is $y$ when $x = " + x + "$?", pre: "$y =$", answer: y,
              hints: ["Put $x = " + x + "$ in: $" + A + "(" + x + ") " + (B < 0 ? "- " + (B === -1 ? "" : -B) : "+ " + (B === 1 ? "" : B)) + "y = " + C + "$."],
              why: lines([A + paren(x).replace(/^(?!\()/, "\\cdot ") + " " + (B < 0 ? "-" : "+") + " " + (Math.abs(B) === 1 ? "" : Math.abs(B)) + "y = " + C,
                          poly([[B, "y"]]) + " = " + (C - A * x), "y = " + y]) };
          }
          return { type: "num", prompt: "In $" + tex + "$, what is $x$ when $y = " + y + "$?", pre: "$x =$", answer: x,
            hints: ["Put $y = " + y + "$ in and solve for $x$."],
            why: lines([poly([[A, "x"]]) + " " + (B * y < 0 ? "- " + Math.abs(B * y) : "+ " + B * y) + " = " + C, poly([[A, "x"]]) + " = " + (C - B * y), "x = " + x]) };
        } },
      { id: "a4-slope-graph", title: "Slope from graph", lesson: 2,
        gen: function (R) {
          var x1 = R.int(-6, 2), y1 = R.int(-5, 5), run = R.int(1, 5), rise = R.nz(-6, 6);
          while (Math.abs(y1 + rise) > 8) rise = R.nz(-6, 6);
          var a = [x1, y1], b = [x1 + run, y1 + rise], m = rise / run, c = y1 - m * x1;
          var near = [{ v: -m, fb: "The line goes " + (m > 0 ? "up" : "down") + " to the right, so the slope is " + (m > 0 ? "positive" : "negative") + "." }];
          if (Math.abs(rise) !== Math.abs(run)) near.push({ v: run / rise, fb: "That's run over rise. Slope is **rise** over run." });
          return { type: "num", prompt: "What is the slope of this line? (A fraction is fine, like 3/4.)", answer: m,
            scene: showLine(m, c, { marks: [a, b] }), near: near,
            hints: ["From $" + pt(a[0], a[1]) + "$ to $" + pt(b[0], b[1]) + "$: how far right, and how far up or down?",
                    "Right " + run + ", " + (rise > 0 ? "up " + rise : "down " + -rise) + "."],
            why: "$\\frac{\\text{rise}}{\\text{run}} = \\frac{" + rise + "}{" + run + "} = " + frac(rise, run) + "$." };
        } },
      { id: "a4-graph-slope", title: "Graphing from slope", lesson: 2,
        gen: function (R) {
          var d = R.int(1, 4), n = R.nz(-4, 4);
          if (gcd(n, d) !== 1) n = n > 0 ? 1 : -1;
          var p = R.int(-5, 1), q = R.int(-4, 4);
          var bx = p + d, by = q + n;
          if (Math.abs(by) > 9) { n = -n; by = q + n; }
          var start = [p + 2 === bx ? p + 3 : p + 2, q + (n > 0 ? -3 : 3)];
          if ((start[1] - q) * d === n * (start[0] - p)) start[1] += 1;
          return { type: "plane", prompt: "Draw the line through $" + pt(p, q) + "$ with slope $" + frac(n, d) + "$: drag the orange point to a second point on it.",
            points: [{ id: "P", x: p, y: q, color: "blue" }, { id: "B", x: start[0], y: start[1], drag: true, color: "orange" }],
            lines: [{ through: ["P", "B"], slope: true, color: "orange" }], answer: { points: { B: [bx, by] } },
            check: function (st) { var b = st.pt("B"); if (b.x === p) return { ok: false, say: "Straight up or down from the point is a run of 0. Move sideways too." };
              var ok = (b.y - q) * d === n * (b.x - p); return { ok: ok, say: ok ? null : "Read your triangle: you need " + (n > 0 ? "up " + n : "down " + -n) + " for every " + d + " to the right." }; },
            hints: ["The slope $" + frac(n, d) + "$ means " + (n > 0 ? "up " + n : "down " + -n) + " for every " + d + " to the right.", "From $" + pt(p, q) + "$ that's $" + pt(bx, by) + "$."],
            why: "From $" + pt(p, q) + "$, right " + d + " and " + (n > 0 ? "up " + n : "down " + -n) + " lands on $" + pt(bx, by) + "$." };
        } },
      { id: "a4-slope-table", title: "Slope in a table", lesson: 2,
        gen: function (R) {
          var d = R.pick([1, 2, 3, 5]), n = R.nz(-5, 6), step = d * R.pick([1, 2]), x0 = R.int(-4, 2), y0 = R.int(-10, 10);
          var m = n / d, rows = [0, 1, 2, 3].map(function (k) { return [x0 + k * step, y0 + m * k * step]; });
          var dy = m * step;
          var near = [{ v: dy, fb: "$y$ changes by " + num(dy) + " each row, but $x$ changes by " + step + ". Divide." }].filter(function (z) { return step !== 1; });
          return { type: "num", prompt: "These points lie on a line. What is its slope?", answer: m, scene: tbl(["$x$", "$y$"], rows), near: near,
            hints: ["How much does $x$ change from row to row? How much does $y$?", "Slope $= \\frac{\\text{change in } y}{\\text{change in } x}$."],
            why: "$\\frac{" + num(dy) + "}{" + step + "} = " + frac(n * step, d * step) + "$." };
        } },
      { id: "a4-slope-pts", title: "Slope from two points", lesson: 2,
        gen: function (R) {
          var x1 = R.int(-9, 9), y1 = R.int(-9, 9), x2 = R.int(-9, 9), y2 = R.int(-9, 9);
          while (x2 === x1) x2 = R.int(-9, 9);
          var rise = y2 - y1, run = x2 - x1, m = rise / run;
          var near = [];
          if (rise !== 0 && Math.abs(rise) !== Math.abs(run)) near.push({ v: run / rise, fb: "That's the $x$'s over the $y$'s. The change in $y$ goes on top." });
          if (rise !== 0) near.push({ v: -m, fb: "Check the signs: subtract in the same order top and bottom." });
          return { type: "num", prompt: "What is the slope of the line through $" + pt(x1, y1) + "$ and $" + pt(x2, y2) + "$?", pre: "$m =$", answer: m, near: near,
            hints: ["$m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{" + y2 + " - " + paren(y1) + "}{" + x2 + " - " + paren(x1) + "}$."],
            why: "$\\frac{" + y2 + " - " + paren(y1) + "}{" + x2 + " - " + paren(x1) + "} = \\frac{" + rise + "}{" + run + "} = " + frac(rise, run) + "$." };
        } },
      { id: "a4-hv", title: "Horizontal & vertical lines", lesson: 3,
        gen: function (R) {
          var a = R.nz(-8, 8), b = R.nz(-8, 8), k = R.int(0, 3);
          while (a === b) b = R.nz(-8, 8);
          if (k === 0) return { type: "equation", prompt: "Write the equation of the **horizontal** line through $" + pt(a, b) + "$.", answer: "y = " + b,
            near: [{ v: "x = " + a, fb: "$x = " + a + "$ is the vertical line through that point. A horizontal line keeps the same $y$." }],
            placeholder: "y = …", hints: ["Every point on a horizontal line has the same $y$."], why: "Every point on it has $y = " + b + "$: the line is $y = " + b + "$." };
          if (k === 1) return { type: "equation", prompt: "Write the equation of the **vertical** line through $" + pt(a, b) + "$.", answer: "x = " + a,
            near: [{ v: "y = " + b, fb: "That's the horizontal line. A vertical line keeps the same $x$." }],
            placeholder: "x = …", hints: ["Every point on a vertical line has the same $x$."], why: "Every point on it has $x = " + a + "$: the line is $x = " + a + "$." };
          if (k === 2) {
            var hor = R.chance(0.5), c = R.nz(-9, 9);
            return mc(R, { prompt: "What is the slope of the line $" + (hor ? "y" : "x") + " = " + c + "$?", right: hor ? "$0$" : "Undefined",
              wrong: [{ t: hor ? "Undefined" : "$0$", fb: hor ? "$y = " + c + "$ is horizontal — flat — so its slope is 0." : "$x = " + c + "$ is vertical. Its run is 0, so its slope is undefined." },
                      { t: "$" + c + "$", fb: "The number tells you where the line is, not how steep it is." }],
              hints: ["Is the line horizontal ($y = \\ldots$) or vertical ($x = \\ldots$)?"],
              why: hor ? "$y = " + c + "$ is horizontal, so its slope is $0$." : "$x = " + c + "$ is vertical, so its slope is undefined." });
          }
          var vert = R.chance(0.5), b2 = R.nz(-8, 8);
          while (b2 === b) b2 = R.nz(-8, 8);
          var P = vert ? [[a, b], [a, b2]] : [[b, a], [b2, a]];
          return mc(R, { prompt: "Which is the equation of the line through $" + pt(P[0][0], P[0][1]) + "$ and $" + pt(P[1][0], P[1][1]) + "$?",
            right: "$" + (vert ? "x" : "y") + " = " + a + "$",
            wrong: [{ t: "$" + (vert ? "y" : "x") + " = " + a + "$", fb: "Both points share " + (vert ? "$x = " : "$y = ") + a + "$, so the line is " + (vert ? "vertical: $x = " : "horizontal: $y = ") + a + "$." },
                    { t: "$" + (vert ? "y = " + b : "x = " + b) + "$", fb: "That goes through only one of the points." }],
            hints: ["Which coordinate do the two points share?"],
            why: "Both points have " + (vert ? "$x" : "$y") + " = " + a + "$, so the line is $" + (vert ? "x" : "y") + " = " + a + "$." });
        } },
      { id: "a4-int-graph", title: "Intercepts from a graph", lesson: 4,
        gen: function (R) {
          var a = R.nz(-7, 7), b = R.nz(-7, 7), m = -b / a, xi = R.chance(0.5);
          return { type: "pair", prompt: "What is the " + (xi ? "$x$" : "$y$") + "-intercept of this line? Give it as a point.", answer: xi ? [a, 0] : [0, b],
            scene: showLine(m, b),
            hints: [xi ? "Where does the line cross the horizontal ($x$) axis?" : "Where does the line cross the vertical ($y$) axis?", xi ? "On the $x$-axis, $y = 0$." : "On the $y$-axis, $x = 0$."],
            why: "The line crosses the " + (xi ? "$x$" : "$y$") + "-axis at $" + (xi ? pt(a, 0) : pt(0, b)) + "$." };
        } },
      { id: "a4-int-eq", title: "Intercepts from an equation", lesson: 4,
        gen: function (R) {
          var xi = R.chance(0.5), tex, ans, why;
          if (R.chance(0.55)) {
            var A = R.nz(-6, 6), B = R.nz(-6, 6), k = R.nz(-3, 3), C = A * B * k;
            if (Math.abs(C) > 60) k = k > 0 ? 1 : -1, C = A * B * k;
            tex = poly([[A, "x"], [B, "y"]]) + " = " + C;
            ans = xi ? [C / A, 0] : [0, C / B];
            why = xi ? lines([poly([[A, "x"]]) + " = " + C + " \\;\\text{(with } y = 0)", "x = " + num(C / A)]) : lines([poly([[B, "y"]]) + " = " + C + " \\;\\text{(with } x = 0)", "y = " + num(C / B)]);
          } else {
            var m = R.nz(-5, 5), r = R.nz(-6, 6), b = -m * r;
            tex = "y = " + poly([[m, "x"], [b, ""]]);
            ans = xi ? [r, 0] : [0, b];
            why = xi ? lines(["0 = " + poly([[m, "x"], [b, ""]]), poly([[m, "x"]]) + " = " + (-b), "x = " + r]) : lines(["y = " + m + "(0) " + (b < 0 ? "- " + (-b) : "+ " + b), "y = " + b]);
          }
          return { type: "pair", prompt: "What is the " + (xi ? "$x$" : "$y$") + "-intercept of $" + tex + "$?", answer: ans,
            hints: [xi ? "The $x$-intercept is where $y = 0$. Put $y = 0$ in and solve for $x$." : "The $y$-intercept is where $x = 0$. Put $x = 0$ in and solve for $y$."],
            why: why + "<br>So the " + (xi ? "$x$" : "$y$") + "-intercept is $" + pt(ans[0], ans[1]) + "$." };
        } },
      { id: "a4-int-table", title: "Intercepts from a table", lesson: 4,
        gen: function (R) {
          var step = R.pick([1, 2, 3]), dy = R.nz(-4, 4) * (R.chance(0.5) ? 1 : 2), xi = R.chance(0.5);
          // The intercept sits on the table's grid of x values.
          var xint = step * R.int(-3, 3), yint = -dy / step * xint;
          while (xint === 0 || Math.abs(yint % 1) > 1e-9) { xint = step * R.nz(-3, 3); yint = -dy / step * xint; }
          var target = xi ? xint : 0;
          var first = target - step * R.int(-1, 4);         // the wanted row may be off the table
          var rows = [0, 1, 2, 3].map(function (k) { var x = first + k * step; return [x, r6(yint + dy / step * x)]; });
          var shown = rows.some(function (r) { return r[0] === target; });
          return { type: "pair", prompt: "These points lie on a line. What is its " + (xi ? "$x$" : "$y$") + "-intercept?" + (shown ? "" : " The table stops before it — carry on the pattern."),
            answer: xi ? [xint, 0] : [0, yint], scene: tbl(["$x$", "$y$"], rows),
            hints: [xi ? "The $x$-intercept is the point with $y = 0$." : "The $y$-intercept is the point with $x = 0$.",
                    "Each row, $x$ changes by " + step + " and $y$ by " + num(dy) + ". Follow that until you reach " + (xi ? "$y = 0$" : "$x = 0$") + "."],
            why: "Following the pattern, the line passes through $" + (xi ? pt(xint, 0) : pt(0, yint)) + "$." };
        } },
      { id: "a4-context", title: "Relating linear contexts to graph features", lesson: 5,
        gen: function (R) {
          var s = story(R), feats = ["m", "b"].concat(s.xint ? ["x"] : []), f = R.pick(feats);
          var name = { m: "slope", b: "$y$-intercept", x: "$x$-intercept" }[f];
          var val = { m: "$" + s.m + "$", b: "$" + pt(0, s.b) + "$", x: s.xint ? "$" + pt(s.xint, 0) + "$" : "" }[f];
          var wrong = feats.filter(function (g) { return g !== f; }).map(function (g) { return { t: s.say[g], fb: "That's what the " + { m: "slope", b: "$y$-intercept", x: "$x$-intercept" }[g] + " says." }; });
          wrong.push({ t: s.wrong, fb: "Look at the units: the slope is in " + s.per + "." });
          return mc(R, { prompt: s.set + " What does the " + name + " " + val + " of its graph tell you?", right: s.say[f], wrong: wrong,
            hints: ["The slope is a rate; the $y$-intercept is the value when $" + s.xv + " = 0$; the $x$-intercept is when $" + s.yv + " = 0$."],
            why: s.say[f] });
        } },
      { id: "a4-use", title: "Using slope and intercepts in context", lesson: 5,
        gen: function (R) {
          var s = story(R), k = R.int(0, s.xint ? 3 : 2), t = R.int(1, s.xint ? s.xint - 1 : 9);
          if (k === 0) return { type: "num", prompt: s.set + " At what rate does the " + s.yn + " change, in " + s.per + "? (Use a negative number if it goes down.)", answer: s.m,
            near: nears(s.m, [{ v: -s.m, fb: "The " + s.yn + " is going " + (s.m < 0 ? "down" : "up") + ", so the rate is " + (s.m < 0 ? "negative" : "positive") + "." }, { v: s.b, fb: "That's the starting value, not the rate." }]),
            hints: ["The rate is the slope: the number multiplying $" + s.xv + "$."], why: "The slope is $" + s.m + "$ " + s.per + "." };
          if (k === 1) return { type: "num", prompt: s.set + " What is the " + s.yn + " when $" + s.xv + " = 0$, in " + s.yu + "?", answer: s.b,
            near: nears(s.b, [{ v: s.m, fb: "That's the rate. At $" + s.xv + " = 0$ the rate hasn't had any time to act." }]),
            hints: ["Put $" + s.xv + " = 0$ in, or read the $y$-intercept."], why: "At $" + s.xv + " = 0$, $" + s.yv + " = " + s.b + "$ " + s.yu + "." };
          if (k === 2) return { type: "num", prompt: s.set + " What is the " + s.yn + " when $" + s.xv + " = " + t + "$, in " + s.yu + "?", answer: s.b + s.m * t,
            near: nears(s.b + s.m * t, [{ v: s.m * t, fb: "Don't forget the starting value, " + s.b + "." }]),
            hints: ["Put $" + s.xv + " = " + t + "$ into the equation."], why: "$" + s.yv + " = " + s.b + (s.m < 0 ? " - " + (-s.m) : " + " + s.m) + "(" + t + ") = " + (s.b + s.m * t) + "$ " + s.yu + "." };
          return { type: "num", prompt: s.set + " At what value of $" + s.xv + "$ is the " + s.yn + " zero, in " + s.xu + "?", answer: s.xint,
            hints: ["Set $" + s.yv + " = 0$ and solve: $0 = " + s.b + " - " + (-s.m) + s.xv + "$."], why: "$" + (-s.m) + s.xv + " = " + s.b + "$, so $" + s.xv + " = " + s.xint + "$ " + s.xu + "." };
        } },
      { id: "a4-tables", title: "Linear equations word problems: tables", lesson: 5,
        gen: function (R) {
          var s = story(R), step = R.pick([1, 2]), x0 = R.int(1, 2), k = R.int(0, 2);
          var rows = [0, 1, 2, 3].map(function (i) { var x = x0 + i * step; return [x, s.b + s.m * x]; }).filter(function (r) { return r[1] >= 0; });
          if (rows.length < 3) { step = 1; x0 = 1; rows = [0, 1, 2].map(function (i) { var x = x0 + i; return [x, s.b + s.m * x]; }); }
          var head = ["$" + s.xv + "$ (" + s.xu + ")", "$" + s.yv + "$ (" + s.yu + ")"];
          var ctx = s.set.replace(/ Its .*$| The .*$| Her .*$/, "");
          var lead = "The table shows the " + s.yn + " $" + s.yv + "$ against $" + s.xv + "$. ";
          if (k === 0) return { type: "num", prompt: lead + "What is the rate of change, in " + s.per + "?", answer: s.m, scene: tbl(head, rows),
            near: [{ v: s.m * step, fb: "That's the change per row, but each row is " + step + " " + s.xu + ". Divide." }].filter(function () { return step > 1; }),
            hints: ["Rate $= \\frac{\\text{change in } " + s.yv + "}{\\text{change in } " + s.xv + "}$ between two rows."], why: "$\\frac{" + num(s.m * step) + "}{" + step + "} = " + s.m + "$ " + s.per + "." };
          if (k === 1) return { type: "num", prompt: lead + "What was the " + s.yn + " at $" + s.xv + " = 0$, in " + s.yu + "?", answer: s.b, scene: tbl(head, rows),
            near: [{ v: rows[0][1], fb: "That's at $" + s.xv + " = " + rows[0][0] + "$. Carry the table back to 0." }],
            hints: ["Find the rate first: " + s.m + " " + s.per + ".", "Go back from the first row to $" + s.xv + " = 0$."], why: "$" + rows[0][1] + (s.m < 0 ? " + " + (-s.m * rows[0][0]) : " - " + s.m * rows[0][0]) + " = " + s.b + "$ " + s.yu + "." };
          var t = rows[rows.length - 1][0] + step;
          return { type: "num", prompt: lead + "What will it be at $" + s.xv + " = " + t + "$, in " + s.yu + "?", answer: s.b + s.m * t, scene: tbl(head, rows),
            hints: ["Each row adds " + num(s.m * step) + "."], why: "$" + rows[rows.length - 1][1] + (s.m < 0 ? " - " + (-s.m * step) : " + " + s.m * step) + " = " + (s.b + s.m * t) + "$ " + s.yu + "." };
        } },
      { id: "a4-graphs", title: "Linear equations word problems: graphs", lesson: 5,
        gen: function (R) {
          var s = story(R), ax = storyAxes(s), k = R.int(0, s.xint ? 2 : 1);
          var t1 = s.xint ? Math.max(1, Math.round(s.xint / 2)) : R.int(3, 6);
          var o = { x: ax.x, y: ax.y, gridY: ax.gridY, labelEvery: ax.labelEvery, labelEveryY: ax.labelEveryY, axisLabels: ax.axisLabels,
                    marks: [[0, s.b], [t1, s.b + s.m * t1]] };
          var lead = "The graph shows the " + s.yn + " ($" + s.yv + "$, in " + s.yu + ") against " + s.xn + " ($" + s.xv + "$, in " + s.xu + "). ";
          if (k === 0) return { type: "num", prompt: lead + "What is the rate of change, in " + s.per + "? (Negative if it goes down.)", answer: s.m, scene: showLine(s.m, s.b, o),
            near: [{ v: -s.m, fb: "The line goes " + (s.m < 0 ? "down" : "up") + " to the right." }],
            hints: ["Use the two marked points: change in $" + s.yv + "$ over change in $" + s.xv + "$."], why: "$\\frac{" + (s.m * t1) + "}{" + t1 + "} = " + s.m + "$ " + s.per + "." };
          if (k === 1) return { type: "num", prompt: lead + "What is the " + s.yn + " at the start, in " + s.yu + "?", answer: s.b, scene: showLine(s.m, s.b, o),
            hints: ["The start is where $" + s.xv + " = 0$: the $y$-intercept."], why: "The line meets the vertical axis at $" + s.b + "$." };
          return { type: "num", prompt: lead + "When does the " + s.yn + " reach zero, in " + s.xu + "?", answer: s.xint, scene: showLine(s.m, s.b, o),
            hints: ["That's the $x$-intercept."], why: "The line meets the horizontal axis at $" + s.xv + " = " + s.xint + "$." };
        } },
      { id: "a4-graph-words", title: "Graphing linear relationships word problems", lesson: 5,
        gen: function (R) {
          var s = story(R, ["candle", "savings", "taxi", "plant", "gym", "tank"]), ax = storyAxes(s);
          var snapY = gcd(Math.abs(s.m), s.b);
          var x2 = s.xint ? s.xint : 6;
          var on = function (x, y) { return Math.abs(y - (s.m * x + s.b)) < 1e-9; };
          var st = [[1, s.m > 0 ? s.b : Math.round(ax.ymax / 4 / snapY) * snapY + snapY], [ax.xmax - 1, s.m > 0 ? s.b + snapY : ax.ymax]];
          if (on(st[0][0], st[0][1]) && on(st[1][0], st[1][1])) st[1][1] += snapY;
          var spec = dragLine({ x: ax.x, y: ax.y, gridY: ax.gridY, labelEveryY: ax.labelEveryY, labelEvery: ax.labelEvery, axisLabels: ax.axisLabels, snapY: snapY,
            on: on, ans: [[0, s.b], [x2, s.m * x2 + s.b]], start: st, fb: "Start at the $y$-intercept $" + pt(0, s.b) + "$, then use the rate." });
          spec.prompt = s.set + " Graph it: drag both points onto the line." + (snapY > 1 ? " (The points move up and down in steps of " + snapY + ".)" : "");
          spec.hints = ["At $" + s.xv + " = 0$, $" + s.yv + " = " + s.b + "$: one point is $" + pt(0, s.b) + "$.", "At $" + s.xv + " = " + x2 + "$, $" + s.yv + " = " + (s.m * x2 + s.b) + "$."];
          spec.why = "The line goes through $" + pt(0, s.b) + "$ and $" + pt(x2, s.m * x2 + s.b) + "$.";
          return spec;
        } },
      { id: "a4-compare", title: "Comparing linear rates word problems", lesson: 6,
        gen: function (R) {
          var T = R.pick([
            { a: "Priya", b: "Tom", what: "saves", yu: "dollars", xu: "week", yv: "S", xv: "w" },
            { a: "Tank A", b: "Tank B", what: "fills", yu: "litres", xu: "minute", yv: "V", xv: "t" },
            { a: "Mo", b: "Jess", what: "cycles", yu: "km", xu: "hour", yv: "d", xv: "t" }]);
          var ra = R.int(3, 12) * (T.yu === "km" ? 2 : 5), rb = ra + R.nz(-3, 3) * (T.yu === "km" ? 2 : 5);
          if (rb <= 0) rb = ra + (T.yu === "km" ? 4 : 10);
          var sa = R.int(0, 6) * 10, sb = R.int(0, 6) * 10;
          var rows = [0, 1, 2, 3].map(function (k) { return [k, sb + rb * k]; });
          var desc = T.a + "'s total is $" + T.yv + " = " + (sa ? sa + " + " : "") + ra + T.xv + "$. " + T.b + "'s is in the table.";
          var faster = ra > rb ? T.a : T.b;
          if (R.chance(0.5)) return mc(R, { prompt: desc + " Whose total grows faster?", right: faster,
            wrong: [{ t: faster === T.a ? T.b : T.a, fb: "Compare the rates: " + T.a + " adds " + ra + " each " + T.xu + ", " + T.b + " adds " + rb + "." }],
            scene: tbl(["$" + T.xv + "$ (" + T.xu + "s)", "$" + T.yv + "$ (" + T.yu + ")"], rows), keep: false,
            hints: ["Find each rate: the number multiplying $" + T.xv + "$, and the change per row of the table."],
            why: T.a + ": " + ra + " " + T.yu + " per " + T.xu + ". " + T.b + ": " + rb + ". " + faster + " is faster." });
          return { type: "num", prompt: desc + " How many more " + T.yu + " per " + T.xu + " does the faster one add?", answer: Math.abs(ra - rb),
            scene: tbl(["$" + T.xv + "$ (" + T.xu + "s)", "$" + T.yv + "$ (" + T.yu + ")"], rows),
            hints: ["Rate of " + T.a + ": " + ra + ". Rate of " + T.b + ": the change per row."], why: "$|" + ra + " - " + rb + "| = " + Math.abs(ra - rb) + "$ " + T.yu + " per " + T.xu + "." };
        } }
    ]
  });
})();
