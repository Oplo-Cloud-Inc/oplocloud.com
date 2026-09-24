/* ==========================================================================
   Algebra I — Unit 6: Systems of equations. See lab/core.js.

   Written the way Units 1–5 are. A system is met as two conditions that
   have to hold at once: a pair is tested in both, then found where two
   lines cross on the plane. Substitution and elimination come next, each
   worked a line at a time with its reason; then why adding two equations
   is allowed at all (equivalent systems), and what parallel lines and a
   line drawn twice mean for the number of solutions. The last lesson sets
   systems up from words, including the ones that have no answer or no
   single answer.

   Six lessons, following Khan Academy's topics for the unit. Fifteen skills
   (Khan's list), three quizzes, the unit test at the end, and notes that put
   the unit on one page.
   Standards: 8.EE.C.8, HSA.CED.A.3, HSA.REI.C.5, HSA.REI.C.6, HSA.REI.D.11.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, frac = L.frac, gcd = L.gcd;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function paren(v) { return v < 0 ? "(" + num(v) + ")" : num(v); }
  function eqTex(e) { return poly([[e[0], "x"], [e[1], "y"]]) + " = " + num(e[2]); }
  function sysTex(a, b) { return "$$" + a + "$$$$" + b + "$$"; }
  function money(v) { return v % 1 ? v.toFixed(2) : String(v); }
  function nears(ans, list) { return list.filter(function (z) { return Math.abs(z.v - ans) > 1e-9; }); }
  function slopeTerm(n, d) {
    if (n === 0) return "";
    var g = gcd(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; }
    if (d === 1) return poly([[n, "x"]]);
    return (n < 0 ? "-" : "") + "\\frac{" + Math.abs(n) + "}{" + d + "}x";
  }
  function siTex(n, d, b) { var t = slopeTerm(n, d); return "y = " + (t ? t + (b === 0 ? "" : b < 0 ? " - " + num(-b) : " + " + num(b)) : num(b)); }
  // Two lines on a plane, in two colours, with optional marks.
  function twoLines(f1, f2, o) {
    o = o || {};
    return { type: "plane", x: o.x || [-10, 10], y: o.y || [-10, 10],
      fns: [{ f: f1, color: "blue", label: o.l1 }, { f: f2, color: "orange", label: o.l2, dashed: o.dash2 }],
      marks: (o.marks || []).map(function (p) { return { x: p[0], y: p[1], label: p[2] != null ? p[2] : pt(p[0], p[1]), color: p[3] || "ink" }; }) };
  }
  // A system with a whole-number solution: two equations ax + by = c.
  function system(R, kind) {
    var x = R.int(-6, 6), y = R.int(-6, 6), e1, e2;
    function mk(a, b) { return [a, b, a * x + b * y]; }
    if (kind === "add") { var a1 = R.nz(-5, 5), b = R.int(1, 5) * R.sign(), a2 = R.nz(-5, 5); while (a2 === -a1) a2 = R.nz(-5, 5); e1 = mk(a1, b); e2 = mk(a2, -b); }
    else if (kind === "sub") { var a = R.nz(-5, 5), b1 = R.nz(-5, 5), b2 = R.nz(-5, 5); while (b2 === b1) b2 = R.nz(-5, 5); e1 = mk(a, b1); e2 = mk(a, b2); }
    else if (kind === "one") { var k = R.pick([2, 3, -2, -3]), p = R.nz(-4, 4), q = R.nz(-4, 4), r = R.nz(-5, 5); while (r === k * p) r = R.nz(-5, 5); e1 = mk(p, q); e2 = mk(r, k * q); }
    else { // both need multiplying: coprime coefficients
      var A = R.pick([2, 3, 4, 5]), B = R.pick([2, 3, 5, 7]), C = R.pick([3, 4, 5, 7]), D = R.pick([2, 3, 4, 5]) * R.sign();
      while (gcd(A, C) !== 1 || gcd(B, Math.abs(D)) !== 1 || A * D === B * C || A === C) { A = R.pick([2, 3, 4, 5]); C = R.pick([3, 4, 5, 7]); B = R.pick([2, 3, 5, 7]); }
      e1 = mk(A, B); e2 = mk(C, D);
    }
    return { e1: e1, e2: e2, x: x, y: y };
  }

  L.unit("alg", 6, {
    title: "Systems of equations",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Two conditions at once",
        blurb: "A pair that works in both equations — and where two lines cross.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "A riddle",
            prompt: "I'm thinking of two numbers. They add up to $10$, and one is $4$ more than the other. <br><br>Lots of pairs add to $10$ — $(5, 5)$, $(8, 2)$, $(6, 4)$ — and lots of pairs differ by $4$. Only one pair does **both**.",
            scene: { type: "walk", rows: [
              { m: "x + y = 10", say: "The first condition." },
              { m: "x - y = 4", say: "The second." },
              { m: "(7, 3)", say: "$7 + 3 = 10$ ✓ and $7 - 3 = 4$ ✓. It satisfies both." }] },
            gate: true,
            then: "Two equations that must be true at the same time make a **system of equations**. Its **solution** is a pair that works in **every** equation." },
          { type: "choice", prompt: "Is $(2, 5)$ a solution of this system? " + sysTex("y = 2x + 1", "x + y = 7"), skill: "Solutions of systems",
            options: [{ t: "Yes — it works in both" }, { t: "No", fb: "Check both: $2(2) + 1 = 5$ ✓ and $2 + 5 = 7$ ✓." }],
            answer: 0, why: "$5 = 2(2) + 1$ ✓ and $2 + 5 = 7$ ✓." },
          { type: "choice", prompt: "Is $(1, 4)$ a solution of this system? " + sysTex("2x + y = 6", "x - y = 3"), skill: "Solutions of systems",
            options: [{ t: "No — it only works in the first" }, { t: "Yes", fb: "It works in the first ($2 + 4 = 6$), but $1 - 4 = -3$, not 3." }],
            answer: 0, hints: ["A solution of a system has to work in **every** equation."], why: "$2(1) + 4 = 6$ ✓, but $1 - 4 = -3 \\ne 3$ ✗." },
          { type: "learn", kicker: "On a graph",
            prompt: "Each equation's solutions make a line. A solution of **both** is on **both** lines — where they cross. Drag the point there.",
            scene: { type: "plane", x: [-6, 8], y: [-4, 10],
              fns: [{ f: function (x) { return x + 1; }, color: "blue", label: "y = x + 1" }, { f: function (x) { return -x + 5; }, color: "orange", label: "y = −x + 5", labelAt: -3 }],
              points: [{ id: "P", x: 5, y: 7, drag: true, color: "purple" }],
              readout: function (st) { var p = st.pt("P"), a = p.y === p.x + 1, b = p.y === -p.x + 5;
                return "$" + pt(p.x, p.y) + "$ " + (a && b ? "is on **both** lines — it solves the system ✓" : a ? "is on the blue line only." : b ? "is on the orange line only." : "is on neither line."); },
              goal: function (st) { var p = st.pt("P"); return p.x === 2 && p.y === 3; } },
            gate: true,
            then: "$(2, 3)$ is on both lines, so it satisfies both equations: $3 = 2 + 1$ and $3 = -2 + 5$. Solving a system by graphing means finding where the lines cross." },
          { type: "pair", prompt: "Where do these lines cross? That point solves the system $y = \\frac{1}{2}x + 1$ and $y = -x + 4$.", answer: [2, 2], skill: "Systems with graphing",
            scene: twoLines(function (x) { return 0.5 * x + 1; }, function (x) { return -x + 4; }),
            hints: ["Find the point that is on the blue line and the orange line."], why: "They cross at $(2, 2)$: $\\frac{1}{2}(2) + 1 = 2$ and $-2 + 4 = 2$." },
          { type: "learn", kicker: "Graphs are rough",
            prompt: "A graph shows roughly where two lines cross, but not always exactly: if the crossing isn't on a grid corner, you can only read it approximately. That is why the next lessons solve systems with algebra — then check the answer in both equations." },
          { type: "learn", kicker: "From words",
            prompt: "In a word problem, each fact becomes one equation.",
            scene: { type: "walk", rows: [
              { say: "A cinema sold $40$ tickets for \\$280. Adults pay \\$9 and children \\$5. Let $a$ be adult tickets and $c$ children's." },
              { m: "a + c = 40", say: "The number of tickets." },
              { m: "9a + 5c = 280", say: "The money: \\$9 for each adult, \\$5 for each child." }] },
            gate: true },
          { type: "choice", prompt: "Pens cost \\$2 and notebooks \\$3. Lin bought $10$ things for \\$24. With $p$ pens and $n$ notebooks, which system fits?", skill: "Creating systems in context",
            options: [{ t: "$p + n = 10$ and $2p + 3n = 24$" },
                      { t: "$p + n = 24$ and $2p + 3n = 10$", fb: "$p + n$ counts things — there were 10. The money, 24, comes from the prices." },
                      { t: "$2p + 3n = 10$ and $p + n = 2 + 3$", fb: "The prices multiply the numbers bought, and the bill was \\$24." },
                      { t: "$p + n = 10$ and $3p + 2n = 24$", fb: "Pens are \\$2, so it's $2p$; notebooks \\$3, so $3n$." }],
            answer: 0, why: "One equation counts the items, the other adds up the cost." },
          { type: "learn", kicker: "Points and lines",
            prompt: "A point **on** a line satisfies that line's equation; a point off it doesn't. So a point can satisfy both equations (where the lines cross), just one (on one line only), or neither." },
          { type: "choice", prompt: "The blue line is $y = x + 2$ and the orange line is $y = -2x + 8$. Which is true about the point $(4, 0)$?", skill: "Interpret points relative to a system",
            scene: twoLines(function (x) { return x + 2; }, function (x) { return -2 * x + 8; }, { marks: [[4, 0, "(4, 0)", "purple"]] }),
            options: [{ t: "It satisfies $y = -2x + 8$ only" }, { t: "It satisfies both", fb: "Only the crossing point, $(2, 4)$, satisfies both. $4 + 2 = 6$, not 0." },
                      { t: "It satisfies $y = x + 2$ only", fb: "$4 + 2 = 6 \\ne 0$, so it's not on the blue line." }, { t: "It satisfies neither", fb: "$-2(4) + 8 = 0$ ✓ — it's on the orange line." }],
            answer: 0, why: "$-2(4) + 8 = 0$ ✓, but $4 + 2 = 6 \\ne 0$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Substitution",
        blurb: "Swap one letter for what it equals, and two equations become one.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "If one equation says what $y$ is, put that into the other equation in place of $y$. What is left has one letter.",
            scene: { type: "walk", rows: [
              { m: "y = 2x - 1 \\;\\text{ and }\\; 3x + y = 9", say: "The first says $y$ is $2x - 1$." },
              { m: "3x + (2x - 1) = 9", say: "Substitute: replace $y$ in the second with $2x - 1$, in brackets." },
              { m: "5x - 1 = 9 \\;\\Rightarrow\\; x = 2", say: "Solve the one-letter equation." },
              { m: "y = 2(2) - 1 = 3", say: "Put $x$ back into either equation to find $y$." },
              { m: "(2, 3)", say: "Check in the other: $3(2) + 3 = 9$ ✓." }] },
            gate: true },
          { type: "pair", prompt: "Solve by substitution: " + sysTex("y = x + 3", "2x + y = 12"), answer: [3, 6], skill: "Systems with substitution",
            hints: ["Replace $y$ in the second: $2x + (x + 3) = 12$.", "$3x + 3 = 12$, so $x = 3$."], why: lines(["2x + (x + 3) = 12", "3x = 9, \\; x = 3", "y = 3 + 3 = 6"]) },
          { type: "learn", kicker: "Get a letter alone first",
            prompt: "If neither equation has a letter alone, make one: choose a letter with nothing (or $1$) in front of it.",
            scene: { type: "walk", rows: [
              { m: "x + 2y = 7 \\;\\text{ and }\\; 3x - y = 7", say: "" },
              { m: "x = 7 - 2y", say: "The first has a plain $x$: get it alone." },
              { m: "3(7 - 2y) - y = 7", say: "Substitute into the second." },
              { m: "21 - 7y = 7 \\;\\Rightarrow\\; y = 2", say: "" },
              { m: "x = 7 - 2(2) = 3", say: "So $(3, 2)$." }] },
            gate: true },
          { type: "pair", prompt: "Solve: " + sysTex("x - y = 1", "2x + 3y = 17"), answer: [4, 3], skill: "Systems with substitution",
            hints: ["From the first, $x = y + 1$.", "$2(y + 1) + 3y = 17$."], why: lines(["x = y + 1", "2(y + 1) + 3y = 17", "5y = 15, \\; y = 3", "x = 4"]) },
          { type: "pair", prompt: "Solve: " + sysTex("y = -2x + 4", "y = x - 5"), answer: [3, -2], skill: "Systems with substitution",
            near: [], hints: ["Both say what $y$ is, so set them equal: $-2x + 4 = x - 5$."], why: lines(["-2x + 4 = x - 5", "9 = 3x, \\; x = 3", "y = 3 - 5 = -2"]) },
          { type: "choice", prompt: "Kim substitutes $y = 3x + 2$ into $2x - y = 1$. Which equation should she get?", skill: "Systems with substitution",
            options: [{ t: "$2x - (3x + 2) = 1$" }, { t: "$2x - 3x + 2 = 1$", fb: "The minus applies to all of $3x + 2$, so it needs brackets: $-3x - 2$." },
                      { t: "$2(3x + 2) - y = 1$", fb: "It's $y$ that is replaced, not $x$." }],
            answer: 0, why: "Replacing $y$ with the whole of $3x + 2$ — in brackets — keeps the minus sign on both terms." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Elimination",
        blurb: "Add or subtract the equations so one letter disappears.",
        mins: 13, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Adding two true equations gives another true equation — the left sides add, the right sides add. Choose it so a letter cancels.",
            scene: { type: "walk", rows: [
              { m: "x + y = 12 \\;\\text{ and }\\; x - y = 4", say: "The $y$'s are $+y$ and $-y$." },
              { m: "2x = 16", say: "Add the equations: the $y$'s cancel." },
              { m: "x = 8", say: "" },
              { m: "8 + y = 12 \\;\\Rightarrow\\; y = 4", say: "Put it back into either equation." }] },
            gate: true },
          { type: "pair", prompt: "Solve by elimination: " + sysTex("3x + 2y = 16", "5x - 2y = 0"), answer: [2, 5], skill: "Systems with elimination",
            hints: ["The $y$'s are $+2y$ and $-2y$: add the equations.", "$8x = 16$."], why: lines(["8x = 16, \\; x = 2", "3(2) + 2y = 16, \\; y = 5"]) },
          { type: "learn", kicker: "Subtract",
            prompt: "When a letter has the **same** coefficient in both, subtract instead.",
            scene: { type: "walk", rows: [
              { m: "4x + 3y = 25 \\;\\text{ and }\\; 4x - y = 13", say: "Both have $4x$." },
              { m: "4y = 12", say: "Subtract the second from the first: $3y - (-y) = 4y$, $25 - 13 = 12$." },
              { m: "y = 3, \\;\\; 4x - 3 = 13, \\;\\; x = 4", say: "" }] },
            gate: true },
          { type: "pair", prompt: "Solve: " + sysTex("2x + 5y = 9", "2x + y = 5"), answer: [2, 1], skill: "Systems with elimination",
            hints: ["Both have $2x$: subtract.", "$4y = 4$."], why: lines(["4y = 4, \\; y = 1", "2x + 1 = 5, \\; x = 2"]) },
          { type: "learn", kicker: "Multiply first",
            prompt: "If nothing cancels yet, multiply one equation (all of it) so that something will.",
            scene: { type: "walk", rows: [
              { m: "2x + 3y = 12 \\;\\text{ and }\\; x + y = 5", say: "" },
              { m: "2x + 2y = 10", say: "Multiply the second by 2 — every term." },
              { m: "y = 2", say: "Subtract it from the first: $3y - 2y = y$, $12 - 10 = 2$." },
              { m: "x = 3", say: "From $x + y = 5$." }] },
            gate: true },
          { type: "choice", prompt: "Which step eliminates $y$ from " + sysTex("3x + 2y = 7", "5x - 4y = 19"), skill: "Elimination strategies",
            options: [{ t: "Multiply the first by 2, then add" }, { t: "Multiply the first by 2, then subtract", fb: "$4y - (-4y) = 8y$: subtracting doubles the $y$'s instead of cancelling them." },
                      { t: "Multiply the second by 2, then add", fb: "That makes $-8y$ against $2y$, which doesn't cancel." }],
            answer: 0, why: "$6x + 4y = 14$ plus $5x - 4y = 19$ gives $11x = 33$." },
          { type: "pair", prompt: "Now solve it: " + sysTex("3x + 2y = 7", "5x - 4y = 19"), answer: [3, -1], skill: "Systems with elimination",
            hints: ["$6x + 4y = 14$, then add: $11x = 33$."], why: lines(["11x = 33, \\; x = 3", "9 + 2y = 7, \\; y = -1"]) },
          { type: "learn", kicker: "Multiply both",
            prompt: "Sometimes both equations need multiplying, to reach a common coefficient.",
            scene: { type: "walk", rows: [
              { m: "2x + 3y = 1 \\;\\text{ and }\\; 3x + 4y = 2", say: "Make the $x$'s both 6." },
              { m: "6x + 9y = 3 \\;\\text{ and }\\; 6x + 8y = 4", say: "The first times 3, the second times 2." },
              { m: "y = -1", say: "Subtract." },
              { m: "2x - 3 = 1 \\;\\Rightarrow\\; x = 2", say: "" }] },
            gate: true },
          { type: "pair", prompt: "Solve: " + sysTex("3x + 2y = 4", "2x - 3y = 7"), answer: [2, -1], skill: "Elimination challenge",
            hints: ["Make the $y$'s cancel: first times 3, second times 2.", "$9x + 6y = 12$ and $4x - 6y = 14$. Add."], why: lines(["13x = 26, \\; x = 2", "6 + 2y = 4, \\; y = -1"]) }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Why elimination works",
        blurb: "Equivalent systems: the moves that change the equations but not the solution.",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "The reason",
            prompt: "Suppose $(x, y)$ solves both equations. Then each left side **is** its right side — two equal amounts. Add equal amounts to equal amounts and they are still equal. So the sum of the equations is true for the same $(x, y)$.",
            scene: { type: "walk", rows: [
              { m: "A = B \\;\\text{ and }\\; C = D", say: "Two true equations." },
              { m: "A + C = B + D", say: "Adding equals to equals keeps them equal." },
              { m: "kA = kB", say: "So does multiplying both sides of one equation by the same number (not 0)." }] },
            gate: true,
            then: "Replacing an equation by a multiple of itself, or by its sum with the other, gives an **equivalent system**: different equations, exactly the same solutions. Every step of elimination is one of those moves." },
          { type: "choice", prompt: "Which system has the same solution as " + sysTex("x + y = 5", "x - y = 1"), skill: "Reasoning with systems",
            options: [{ t: "$2x = 6$ and $x + y = 5$" }, { t: "$x + y = 5$ and $2x - 2y = 1$", fb: "Multiplying $x - y = 1$ by 2 means both sides: $2x - 2y = 2$." },
                      { t: "$x + y = 5$ and $x - y = 5$", fb: "That changes the second condition — its solution is different." }],
            answer: 0, why: "$2x = 6$ is the sum of the two equations, so the system is equivalent. Both give $(3, 2)$." },
          { type: "multi", prompt: "Which of these moves always keep a system's solutions the same? Pick every one.", skill: "Reasoning with systems",
            options: [{ t: "Multiply both sides of one equation by 4", ok: true }, { t: "Replace one equation by the sum of the two", ok: true }, { t: "Swap the order of the equations", ok: true },
                      { t: "Add 3 to one side of an equation only", ok: false, fb: "That makes a different, unbalanced equation." },
                      { t: "Multiply one equation by 0", ok: false, fb: "That turns it into $0 = 0$ and throws its information away." }],
            why: "Doing the same thing to both sides of an equation, or adding equations, never changes what solves them." },
          { type: "choice", prompt: "Ana replaces the second equation of " + sysTex("x + 2y = 3", "3x - y = 4") + " with (the second) $+ \\,2 \\times$ (the second). Which is her new second equation?", skill: "Reasoning with systems",
            options: [{ t: "$9x - 3y = 12$" }, { t: "$5x - y = 4$", fb: "Three times the second equation multiplies **every** term: $9x - 3y = 12$." },
                      { t: "$3x - y = 12$", fb: "The left side has to be tripled too." }],
            answer: 0, why: "The second plus twice itself is three times it: $9x - 3y = 12$. The system stays equivalent." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "None, one or infinitely many",
        blurb: "Lines that cross, lines that never meet, and one line written twice.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "The blue line is $y = 2x + 1$. The orange one is $y = mx + b$. Move its sliders: make the lines cross, make them never meet, and make them the same line.",
            scene: { type: "plane", x: [-8, 8], y: [-8, 8], params: { m: { v: 1, min: -3, max: 3, step: 0.5, label: "$m$" }, b: { v: -2, min: -6, max: 6, step: 1, label: "$b$" } },
              fns: [{ f: function (x) { return 2 * x + 1; }, color: "blue" }, { f: "m*x + b", color: "orange", dashed: true }],
              readout: function (st) { var P = st.params; return P.m !== 2 ? "Different slopes: the lines cross once — **one** solution." : P.b !== 1 ? "Same slope, different intercept: **parallel** — **no** solution." : "The same line twice: every point on it — **infinitely many** solutions."; } },
            gate: true,
            then: "Two lines either cross once (one solution), are parallel (no solution), or are the same line (infinitely many). A system with at least one solution is called **consistent**; one with none is **inconsistent**." },
          { type: "choice", prompt: "How many solutions does the system shown have?", skill: "Number of solutions graphically",
            scene: twoLines(function (x) { return -0.5 * x + 3; }, function (x) { return -0.5 * x - 2; }),
            options: [{ t: "None" }, { t: "One", fb: "The lines have the same slope and never meet." }, { t: "Infinitely many", fb: "They're two different lines, side by side." }],
            answer: 0, why: "Parallel lines never cross, so no pair satisfies both." },
          { type: "learn", kicker: "With algebra",
            prompt: "You can tell without a graph: write both as $y = mx + b$, or try to eliminate.",
            scene: { type: "walk", rows: [
              { m: "y = 3x + 2 \\;\\text{ and }\\; 6x - 2y = 4", say: "" },
              { m: "6x - 2y = 4 \\;\\Rightarrow\\; y = 3x - 2", say: "Same slope 3, different intercept: parallel, **no** solution." },
              { m: "6x - 2(3x + 2) = 4 \\;\\Rightarrow\\; -4 = 4", say: "Substitution says the same thing: both letters vanish and what's left is **false**." },
              { say: "If both letters vanish and what's left is **true** (like $0 = 0$), there are infinitely many." }] },
            gate: true },
          { type: "choice", prompt: "How many solutions does this system have? " + sysTex("2x + y = 5", "4x + 2y = 10"), skill: "Number of solutions algebraically",
            options: [{ t: "Infinitely many" }, { t: "None", fb: "The second is the first times 2, right side included. They're the same line." }, { t: "One", fb: "Both are $y = -2x + 5$ — the same line." }],
            answer: 0, why: "The second equation is exactly twice the first: the same line, so every point on it works." },
          { type: "choice", prompt: "And this one? " + sysTex("x - 3y = 4", "-2x + 6y = 5"), skill: "Number of solutions algebraically",
            options: [{ t: "None" }, { t: "Infinitely many", fb: "Times $-2$, the first is $-2x + 6y = -8$. The left sides match but $-8 \\ne 5$." }, { t: "One", fb: "Both have slope $\\frac{1}{3}$." }],
            answer: 0, why: "Doubling and negating the first gives $-2x + 6y = -8$, but the second says it's 5: impossible." },
          { type: "choice", prompt: "What value of $k$ makes $y = 4x - 3$ and $y = kx + 1$ have **no** solution?", skill: "Number of solutions algebraically",
            options: [{ t: "$4$" }, { t: "$-4$", fb: "Slope $-4$ and slope $4$ are different, so the lines cross." }, { t: "$1$", fb: "That's an intercept. Parallel lines need the same slope." }],
            answer: 0, why: "With $k = 4$ both slopes are 4 and the intercepts differ: parallel lines." },
          { type: "choice", prompt: "A system of two linear equations has at least two solutions. How many does it have?", skill: "Number of solutions graphically",
            options: [{ t: "Infinitely many" }, { t: "Exactly two", fb: "Two different straight lines can cross at most once. Sharing two points means they're the same line." }],
            answer: 0, why: "Two points fix a line, so both equations must be that same line." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Systems from words",
        blurb: "Ages, tickets and prices — and the problems with no answer, or too many.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "Ages",
            prompt: "Age problems describe the same two people now and later. Let the letters be their ages **now**.",
            scene: { type: "walk", rows: [
              { say: "Imran is 4 times as old as his sister Mia. In 10 years he'll be twice her age." },
              { m: "i = 4m", say: "Now." },
              { m: "i + 10 = 2(m + 10)", say: "In 10 years **both** are 10 older." },
              { m: "4m + 10 = 2m + 20 \\;\\Rightarrow\\; m = 5", say: "Substitute $i = 4m$." },
              { m: "i = 20", say: "Imran is 20, Mia 5. Check: in 10 years, 30 is twice 15 ✓." }] },
            gate: true },
          { type: "num", prompt: "Ben is 3 years older than William, and their ages add up to 31. How old is William?", answer: 14, skill: "Age word problems",
            near: [{ v: 17, fb: "That's Ben: 3 years older than William." }],
            hints: ["$b = w + 3$ and $b + w = 31$.", "$(w + 3) + w = 31$."], why: lines(["2w + 3 = 31", "w = 14"]) },
          { type: "learn", kicker: "Tickets",
            prompt: "Back to the cinema: $40$ tickets for \\$280, adults \\$9 and children \\$5.",
            scene: { type: "walk", rows: [
              { m: "a + c = 40 \\;\\text{ and }\\; 9a + 5c = 280", say: "" },
              { m: "a = 40 - c", say: "Get $a$ alone from the first." },
              { m: "9(40 - c) + 5c = 280", say: "Substitute." },
              { m: "360 - 4c = 280 \\;\\Rightarrow\\; c = 20", say: "20 children's tickets, so 20 adults'." }] },
            gate: true },
          { type: "num", prompt: "Two coffees and three croissants cost \\$14. Three coffees and one croissant cost \\$10.50. How much is one croissant, in dollars?", answer: 3, pre: "\\$", skill: "Systems word problems",
            near: [{ v: 2.5, fb: "That's the coffee." }],
            hints: ["$2c + 3k = 14$ and $3c + k = 10.5$.", "From the second, $k = 10.5 - 3c$. Substitute."], why: lines(["2c + 3(10.5 - 3c) = 14", "-7c = -17.5, \\; c = 2.5", "k = 10.5 - 7.5 = 3"]) },
          { type: "learn", kicker: "No answer, or too many",
            prompt: "Sometimes the facts can't all be true (no solution), or say the same thing twice (infinitely many solutions — not enough information to pin the answer down).",
            scene: { type: "walk", rows: [
              { say: "Two apples and three pears cost \\$5. Four apples and six pears cost \\$12." },
              { m: "2a + 3p = 5 \\;\\text{ and }\\; 4a + 6p = 12", say: "Twice the first basket should cost \\$10, not \\$12." },
              { say: "The facts contradict each other: **no** solution — the shop can't have had fixed prices." }] },
            gate: true },
          { type: "choice", prompt: "Two apples and three pears cost \\$5, and four apples and six pears cost \\$10. What can you say about the prices?", skill: "Word problems with 0 or infinitely many solutions",
            options: [{ t: "There isn't enough information — infinitely many pairs of prices fit" }, { t: "There's no solution — the facts contradict", fb: "Twice \\$5 is \\$10: the second fact agrees with the first. It just doesn't add anything new." },
                      { t: "Apples cost \\$1 and pears \\$1", fb: "That works, but so do many other prices — like \\$2.50 apples and free pears." }],
            answer: 0, why: "The second equation is twice the first: the same line, so infinitely many solutions." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 1, blurb: "Testing solutions, solving by graphing, setting up systems and reading points.",
        skills: ["a6-verify", "a6-graph", "a6-create", "a6-interpret"], per: 2 },
      { title: "Quiz 2", after: 4, blurb: "Substitution, elimination and equivalent systems.",
        skills: ["a6-sub", "a6-combine", "a6-strategy", "a6-elim", "a6-elim2", "a6-equiv"], per: 1 },
      { title: "Quiz 3", after: 6, blurb: "How many solutions, and systems from words.",
        skills: ["a6-nsol-graph", "a6-nsol-alg", "a6-age", "a6-words", "a6-words01"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Systems and their solutions",
        say: ["A **system of equations** is two (or more) equations that must be true at the same time. Its **solution** is a pair $(x, y)$ that makes **every** equation true.",
              "To test a pair, put it into each equation. Failing any one of them means it isn't a solution."],
        eg: { q: "Is $(1, 4)$ a solution of $2x + y = 6$ and $x - y = 3$?", rows: [["2(1) + 4 = 6", "✓"], ["1 - 4 = -3 \\ne 3", "✗"]], a: "No — it fails the second equation." } },
      { t: "Solving by graphing",
        say: ["Each equation's solutions form a line; the solution of the system is where the lines cross.",
              "A point on one line only satisfies that equation only; a point on neither satisfies neither.",
              "Graphs are only as exact as you can read them — check the crossing point in both equations."],
        watch: "A crossing between grid lines can only be read roughly. Use algebra for the exact answer." },
      { t: "Substitution",
        say: ["Get one letter alone in one equation, then put that expression — in brackets — in place of the letter in the other equation. Solve for the remaining letter, then substitute back."],
        eg: { q: "Solve $y = 2x - 1$ and $3x + y = 9$.",
              rows: [["3x + (2x - 1) = 9", "Replace $y$."], ["5x = 10, \\; x = 2", ""], ["y = 2(2) - 1 = 3", "Answer $(2, 3)$."]] },
        watch: "Keep the brackets: $2x - y$ with $y = 3x + 2$ is $2x - (3x + 2) = -x - 2$." },
      { t: "Elimination",
        say: ["Add or subtract the equations so that one letter cancels. If no letter cancels yet, first multiply one equation (or both) — every term, both sides — so the coefficients of one letter match or are opposites.",
              "Opposites ($+3y$ and $-3y$): add. The same ($4x$ and $4x$): subtract."],
        eg: { q: "Solve $3x + 2y = 7$ and $5x - 4y = 19$.",
              rows: [["6x + 4y = 14", "Double the first."], ["11x = 33, \\; x = 3", "Add it to the second."], ["9 + 2y = 7, \\; y = -1", "Answer $(3, -1)$."]] },
        watch: "When you multiply an equation, multiply the right side as well." },
      { t: "Equivalent systems",
        say: ["Multiplying an equation by a non-zero number, or replacing an equation by its sum with the other, gives an **equivalent system** — different equations with exactly the same solutions. That is why elimination is allowed: adding equal amounts to equal amounts keeps them equal."] },
      { t: "How many solutions",
        keys: [["Different slopes", "the lines cross once — **one** solution"], ["Same slope, different intercepts", "parallel — **no** solution (inconsistent)"], ["Same slope and intercept", "the same line — **infinitely many** solutions"]],
        say: ["With algebra: if both letters vanish and what's left is false ($-4 = 4$), there's no solution; if it's true ($0 = 0$), infinitely many."],
        eg: { q: "How many solutions: $2x + y = 5$ and $4x + 2y = 10$?", rows: [["4x + 2y = 10 \\;\\Rightarrow\\; 2x + y = 5", "Halve the second: it's the first."]], a: "Infinitely many." } },
      { t: "Systems from words",
        say: ["Name the two unknowns, then write one equation for each fact — typically one that counts things and one that adds up their cost or value.",
              "In age problems, let the letters be the ages **now**, and add the same number of years to both people for the future.",
              "If the equations contradict, the situation has no solution; if one is a multiple of the other, there isn't enough information."],
        eg: { q: "Ben is 3 years older than William; their ages add to 31.", rows: [["b = w + 3, \\; b + w = 31", ""], ["2w + 3 = 31, \\; w = 14", "William is 14, Ben 17."]] } }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a6-verify", title: "Solutions of systems of equations", lesson: 1,
        gen: function (R) {
          var S = system(R, R.pick(["add", "sub", "one"])), k = R.int(0, 2), p;
          // 0: the solution; 1: fits the first only; 2: fits neither
          if (k === 0) p = [S.x, S.y];
          else if (k === 1) { // move along the first line
            var a = S.e1[0], b = S.e1[1], g = gcd(a, b);
            p = [S.x + b / g, S.y - a / g];
          } else p = [S.x + 1, S.y + 1];
          var f1 = S.e1[0] * p[0] + S.e1[1] * p[1] === S.e1[2], f2 = S.e2[0] * p[0] + S.e2[1] * p[1] === S.e2[2];
          var both = f1 && f2;
          return mc(R, { prompt: "Is $" + pt(p[0], p[1]) + "$ a solution of this system? " + sysTex(eqTex(S.e1), eqTex(S.e2)),
            right: both ? "Yes — it works in both" : "No", wrong: [{ t: both ? "No" : "Yes — it works in both", fb: "Check each equation: the first gives $" + (S.e1[0] * p[0] + S.e1[1] * p[1]) + "$ (" + (f1 ? "✓" : "✗") + "), the second $" + (S.e2[0] * p[0] + S.e2[1] * p[1]) + "$ (" + (f2 ? "✓" : "✗") + ")." }],
            keep: true, hints: ["Put $x = " + p[0] + "$ and $y = " + p[1] + "$ into each equation.", "A solution has to work in **both**."],
            why: "First: $" + (S.e1[0] * p[0] + S.e1[1] * p[1]) + (f1 ? " = " : " \\ne ") + S.e1[2] + "$. Second: $" + (S.e2[0] * p[0] + S.e2[1] * p[1]) + (f2 ? " = " : " \\ne ") + S.e2[2] + "$." });
        } },
      { id: "a6-graph", title: "Systems of equations with graphing", lesson: 1,
        gen: function (R) {
          var x = R.int(-5, 5), y = R.int(-5, 5);
          var s1 = R.pick([[1, 1], [2, 1], [-1, 1], [1, 2], [-3, 1], [3, 2]]), s2 = R.pick([[-1, 1], [-2, 1], [1, 3], [-1, 2], [3, 1], [-3, 2]]);
          while (s1[0] * s2[1] === s2[0] * s1[1]) s2 = R.pick([[-1, 1], [-2, 1], [1, 3], [-1, 2], [3, 1], [-3, 2]]);
          var m1 = s1[0] / s1[1], m2 = s2[0] / s2[1], b1 = y - m1 * x, b2 = y - m2 * x;
          return { type: "pair", prompt: "Where do these two lines cross? That point is the solution of their system.", answer: [x, y],
            scene: twoLines(function (t) { return m1 * t + b1; }, function (t) { return m2 * t + b2; }),
            hints: ["Find the grid point that is on the blue line **and** the orange one."],
            why: "They cross at $" + pt(x, y) + "$." };
        } },
      { id: "a6-create", title: "Creating systems in context", lesson: 1,
        gen: function (R) {
          var T = R.pick([
            function () { var pa = R.pick([8, 9, 10, 12]), pc = R.pick([4, 5, 6]), a = R.int(8, 30), c = R.int(8, 30);
              return { p: "A museum sold $" + (a + c) + "$ tickets for \\$" + (pa * a + pc * c) + ". Adult tickets cost \\$" + pa + " and child tickets \\$" + pc + ". Let $a$ be adult tickets and $c$ child tickets.", v: ["a", "c"], n: a + c, pr: [pa, pc], tot: pa * a + pc * c }; },
            function () { var pa = R.pick([2, 3]), pc = R.pick([4, 5]), a = R.int(3, 12), c = R.int(3, 12);
              return { p: "Omar bought $" + (a + c) + "$ plants for \\$" + (pa * a + pc * c) + ". Herbs cost \\$" + pa + " each and flowers \\$" + pc + ". Let $h$ be herbs and $f$ flowers.", v: ["h", "f"], n: a + c, pr: [pa, pc], tot: pa * a + pc * c }; },
            function () { var a = R.int(4, 15), c = R.int(4, 15);
              return { p: "A jar holds $" + (a + c) + "$ coins, all 10-cent and 25-cent coins, worth " + (10 * a + 25 * c) + " cents altogether. Let $d$ be 10-cent coins and $q$ 25-cent coins.", v: ["d", "q"], n: a + c, pr: [10, 25], tot: 10 * a + 25 * c }; }])();
          var u = T.v[0], w = T.v[1];
          var right = "$" + u + " + " + w + " = " + T.n + "$ and $" + T.pr[0] + u + " + " + T.pr[1] + w + " = " + T.tot + "$";
          return mc(R, { prompt: T.p + " Which system fits?", right: right,
            wrong: [{ t: "$" + u + " + " + w + " = " + T.tot + "$ and $" + T.pr[0] + u + " + " + T.pr[1] + w + " = " + T.n + "$", fb: "The count and the total are swapped: $" + u + " + " + w + "$ counts things, so it equals " + T.n + "." },
                    { t: "$" + u + " + " + w + " = " + T.n + "$ and $" + T.pr[1] + u + " + " + T.pr[0] + w + " = " + T.tot + "$", fb: "Each price multiplies its own letter: $" + T.pr[0] + u + "$ and $" + T.pr[1] + w + "$." },
                    { t: "$" + T.pr[0] + u + " + " + T.pr[1] + w + " = " + T.n + "$ and $" + u + " + " + w + " = " + (T.pr[0] + T.pr[1]) + "$", fb: "Adding the prices doesn't describe anything here." }],
            hints: ["One equation counts the items. The other adds up their value."], why: "Count: $" + u + " + " + w + " = " + T.n + "$. Value: $" + T.pr[0] + u + " + " + T.pr[1] + w + " = " + T.tot + "$." });
        } },
      { id: "a6-interpret", title: "Interpret points relative to a system", lesson: 1,
        gen: function (R) {
          var x = R.int(-3, 3), y = R.int(-3, 3), m1 = R.pick([1, 2, -1, 0.5]), m2 = R.pick([-2, -1, 3, -0.5]);
          while (m1 === m2) m2 = R.pick([-2, -1, 3, -0.5]);
          var b1 = y - m1 * x, b2 = y - m2 * x, k = R.int(0, 3), p;
          if (k === 0) p = [x, y];
          else if (k === 1) { var dx = R.pick([2, -2, 4]); p = [x + dx, y + m1 * dx]; }
          else if (k === 2) { var dx2 = R.pick([2, -2, 4]); p = [x + dx2, y + m2 * dx2]; }
          else p = [x + 1, y + 3];
          var on1 = p[1] === m1 * p[0] + b1, on2 = p[1] === m2 * p[0] + b2;
          var e1 = siTex(m1 * 2, 2, b1), e2 = siTex(m2 * 2, 2, b2);
          var opts = { both: "It satisfies both equations", one: "It satisfies $" + e1 + "$ only", two: "It satisfies $" + e2 + "$ only", none: "It satisfies neither" };
          var right = on1 && on2 ? "both" : on1 ? "one" : on2 ? "two" : "none";
          var fbs = { both: "Only the crossing point satisfies both.", one: "Is it on the blue line? Put $x = " + num(p[0]) + "$ into $" + e1 + "$.", two: "Is it on the orange line? Put $x = " + num(p[0]) + "$ into $" + e2 + "$.", none: "It is on at least one line." };
          return mc(R, { prompt: "The blue line is $" + e1 + "$ and the orange line is $" + e2 + "$. Which is true about the point $" + pt(p[0], p[1]) + "$?",
            scene: twoLines(function (t) { return m1 * t + b1; }, function (t) { return m2 * t + b2; }, { marks: [[p[0], p[1], pt(p[0], p[1]), "purple"]] }),
            right: opts[right], wrong: Object.keys(opts).filter(function (k2) { return k2 !== right; }).map(function (k2) { return { t: opts[k2], fb: fbs[k2] }; }),
            hints: ["A point on a line satisfies that line's equation. Is the point on the blue line? The orange?"],
            why: "Blue: $" + num(m1 * p[0] + b1) + (on1 ? " = " : " \\ne ") + num(p[1]) + "$. Orange: $" + num(m2 * p[0] + b2) + (on2 ? " = " : " \\ne ") + num(p[1]) + "$." });
        } },
      { id: "a6-sub", title: "Systems of equations with substitution", lesson: 2,
        gen: function (R) {
          var x = R.int(-6, 6), y = R.int(-6, 6), m = R.nz(-4, 4), c = y - m * x, a = R.nz(-5, 5), b = R.nz(-5, 5);
          while (a + b * m === 0) a = R.nz(-5, 5);
          var first = "y = " + poly([[m, "x"], [c, ""]]), second = eqTex([a, b, a * x + b * y]);
          return { type: "pair", prompt: "Solve by substitution: " + sysTex(first, second), answer: [x, y],
            hints: ["Replace $y$ in the second equation with $" + poly([[m, "x"], [c, ""]]) + "$, in brackets.", "That gives $" + poly([[a, "x"]]) + " " + (b < 0 ? "-" : "+") + " " + (Math.abs(b) === 1 ? "" : Math.abs(b)) + "(" + poly([[m, "x"], [c, ""]]) + ") = " + (a * x + b * y) + "$."],
            why: lines([poly([[a + b * m, "x"]]) + " " + (b * c < 0 ? "- " + Math.abs(b * c) : "+ " + b * c) + " = " + (a * x + b * y), "x = " + x, "y = " + m + paren(x).replace(/^(?!\()/, "\\cdot ") + (c < 0 ? " - " + -c : " + " + c) + " = " + y]) };
        } },
      { id: "a6-combine", title: "Combining equations", lesson: 3,
        gen: function (R) {
          var S = system(R, "one"), e1 = S.e1, e2 = S.e2, k = R.pick([2, 3, -2]), add = R.chance(0.5);
          var sign = add ? 1 : -1;
          var res = [k * e1[0] + sign * e2[0], k * e1[1] + sign * e2[1], k * e1[2] + sign * e2[2]];
          var desc = "$" + k + "$ times the first equation" + (add ? " plus" : " minus") + " the second";
          function tex(e) { var l = poly([[e[0], "x"], [e[1], "y"]]); return "$" + (l === "0" ? "0" : l) + " = " + e[2] + "$"; }
          return mc(R, { prompt: "Which equation is " + desc + "? " + sysTex(eqTex(e1), eqTex(e2)), right: tex(res),
            wrong: [{ t: tex([k * e1[0] + sign * e2[0], k * e1[1] + sign * e2[1], e1[2] + sign * e2[2]]), fb: "Multiplying an equation multiplies its right side too." },
                    { t: tex([k * e1[0] - sign * e2[0], k * e1[1] - sign * e2[1], k * e1[2] - sign * e2[2]]), fb: add ? "That subtracts the second. The question adds it." : "That adds the second. The question subtracts it." },
                    { t: tex([e1[0] + sign * e2[0], e1[1] + sign * e2[1], e1[2] + sign * e2[2]]), fb: "The first equation has to be multiplied by " + k + " first." }],
            hints: ["Multiply every term of the first by " + k + ": $" + eqTex([k * e1[0], k * e1[1], k * e1[2]]) + "$.", "Then " + (add ? "add" : "subtract") + " the second, term by term."],
            why: "$" + eqTex([k * e1[0], k * e1[1], k * e1[2]]) + "$ " + (add ? "plus" : "minus") + " $" + eqTex(e2) + "$ is " + tex(res) + "." });
        } },
      { id: "a6-strategy", title: "Elimination strategies", lesson: 3,
        gen: function (R) {
          var S = system(R, "one"), e1 = S.e1, e2 = S.e2;           // e2's y coefficient is k times e1's
          var k = e2[1] / e1[1];
          var right = "Multiply the first by $" + k + "$ and subtract";
          var alt = "Multiply the first by $" + -k + "$ and add";
          return mc(R, { prompt: "Which of these eliminates $y$ from this system? " + sysTex(eqTex(e1), eqTex(e2)), right: R.chance(0.5) ? right : alt,
            wrong: [{ t: "Multiply the first by $" + k + "$ and add", fb: "Then the $y$'s are $" + poly([[k * e1[1], "y"]]) + "$ and $" + poly([[e2[1], "y"]]) + "$: adding doubles them." },
                    { t: "Add the equations as they are", fb: "$" + poly([[e1[1], "y"]]) + "$ and $" + poly([[e2[1], "y"]]) + "$ don't cancel." },
                    { t: "Multiply the second by $" + k + "$ and add", fb: "That makes the second's $y$ term bigger still." }],
            hints: ["The $y$ coefficients are " + e1[1] + " and " + e2[1] + ". What would you multiply " + e1[1] + " by to match " + e2[1] + "?"],
            why: "Times $" + k + "$, the first has $" + poly([[e2[1], "y"]]) + "$, the same as the second — subtracting removes it (or, times $" + -k + "$, add)." });
        } },
      { id: "a6-elim", title: "Systems of equations with elimination", lesson: 3,
        gen: function (R) {
          var kind = R.pick(["add", "sub", "one"]), S = system(R, kind);
          var h = kind === "add" ? ["The $y$ terms are opposites: add the equations."] : kind === "sub" ? ["The $x$ terms are the same: subtract the equations."]
            : ["Multiply the first equation by " + (S.e2[1] / S.e1[1]) + " so the $y$ terms match, then subtract."];
          return { type: "pair", prompt: "Solve by elimination: " + sysTex(eqTex(S.e1), eqTex(S.e2)), answer: [S.x, S.y],
            hints: h.concat(["Solve for the letter that's left, then put it back into either equation."]),
            why: "The solution is $" + pt(S.x, S.y) + "$: check $" + eqTex(S.e1).replace(/=.*/, "") + "= " + S.e1[2] + "$ and $" + eqTex(S.e2).replace(/=.*/, "") + "= " + S.e2[2] + "$ with those values." };
        } },
      { id: "a6-elim2", title: "Systems of equations with elimination challenge", lesson: 3,
        gen: function (R) {
          var S = system(R, "both"), a = S.e1, b = S.e2;
          var l = Math.abs(a[1] * b[1]) / gcd(a[1], b[1]);
          return { type: "pair", prompt: "Solve: " + sysTex(eqTex(a), eqTex(b)), answer: [S.x, S.y],
            hints: ["No letter cancels yet. Multiply both equations so the $y$ coefficients become $\\pm " + l + "$.", "Multiply the first by " + (l / Math.abs(a[1])) + " and the second by " + (l / Math.abs(b[1])) + ", then add or subtract."],
            why: "Eliminating $y$ gives $x = " + S.x + "$, and then $y = " + S.y + "$: the solution is $" + pt(S.x, S.y) + "$." };
        } },
      { id: "a6-equiv", title: "Reasoning with systems of equations", lesson: 4,
        gen: function (R) {
          var S = system(R, "one"), e1 = S.e1, e2 = S.e2, k = R.pick([2, 3, -2]);
          var sum = [e1[0] + e2[0], e1[1] + e2[1], e1[2] + e2[2]], mult = [k * e2[0], k * e2[1], k * e2[2]];
          var good = R.chance(0.5) ? [eqTex(e1), eqTex(sum)] : [eqTex(e1), eqTex(mult)];
          function sys(a, b) { return "$" + a + "$ and $" + b + "$"; }
          return mc(R, { prompt: "Which system has the same solution as this one? " + sysTex(eqTex(e1), eqTex(e2)), right: sys(good[0], good[1]),
            wrong: [{ t: sys(eqTex(e1), eqTex([k * e2[0], k * e2[1], e2[2]])), fb: "Multiplying an equation means both sides — the right side wasn't multiplied." },
                    { t: sys(eqTex(e1), eqTex([e1[0] + e2[0], e1[1] + e2[1], e2[2]])), fb: "Adding the equations adds the right sides too: $" + e1[2] + " + " + paren(e2[2]) + "$." },
                    { t: sys(eqTex([e1[0], e1[1], e1[2] + 1]), eqTex(e2)), fb: "Changing one side of an equation alone changes its solutions." }],
            hints: ["Multiplying an equation (both sides) by a number, or adding the two equations, keeps the solutions."],
            why: "Each equation in " + sys(good[0], good[1]) + " is either an original or made from them by adding or multiplying both sides, so the solution $" + pt(S.x, S.y) + "$ is the same." });
        } },
      { id: "a6-nsol-graph", title: "Number of solutions to a system graphically", lesson: 5,
        gen: function (R) {
          var kind = R.int(0, 2), m1 = R.pick([1, 2, -1, 0.5, -0.5, 3]), b1 = R.int(-4, 4), m2, b2;
          if (kind === 0) { m2 = R.pick([-2, 1.5, -3, 0, 1]); while (m2 === m1) m2 = R.pick([-2, 1.5, -3, 0, 1]); b2 = R.int(-4, 4); }
          else if (kind === 1) { m2 = m1; b2 = b1 + R.nz(-4, 4); }
          else { m2 = m1; b2 = b1; }
          var right = ["Exactly one", "None", "Infinitely many"][kind];
          var scene = twoLines(function (x) { return m1 * x + b1; }, function (x) { return m2 * x + b2; }, { dash2: kind === 2 });
          return mc(R, { prompt: "How many solutions does the system of these two lines have?" + (kind === 2 ? " (The orange line is drawn dashed, over the blue.)" : ""), scene: scene, right: right,
            wrong: [{ t: "Exactly one", fb: kind === 1 ? "The lines are parallel — they never cross." : "The lines lie on top of each other, so they meet everywhere." },
                    { t: "None", fb: kind === 0 ? "The lines cross once." : "They're the same line, so every point on it works." },
                    { t: "Infinitely many", fb: kind === 0 ? "Two different lines cross at most once." : "Parallel lines never meet." }], keep: true,
            hints: ["Do the lines cross once, never, or everywhere?"], why: right + ": " + (kind === 0 ? "the lines cross at one point." : kind === 1 ? "the lines are parallel." : "they are the same line.") });
        } },
      { id: "a6-nsol-alg", title: "Number of solutions to a system algebraically", lesson: 5,
        gen: function (R) {
          var a = R.nz(-5, 5), b = R.nz(-5, 5), c = R.int(-9, 9), k = R.pick([2, 3, -2, -1]), kind = R.int(0, 3);
          if (kind === 3) {                 // make it have no solution
            var m = R.nz(-4, 4), c1 = R.int(-6, 6), c2 = R.int(-6, 6);
            while (c2 === c1) c2 = R.int(-6, 6);
            return mc(R, { prompt: "What value of $k$ makes $y = " + poly([[m, "x"], [c1, ""]]) + "$ and $y = kx " + (c2 < 0 ? "- " + -c2 : "+ " + c2) + "$ have **no** solution?", right: "$" + m + "$",
              wrong: [{ t: "$" + -m + "$", fb: "Opposite slopes still cross. Parallel lines need the **same** slope." }, { t: "$" + c1 + "$", fb: "That's an intercept. No solution needs equal slopes and different intercepts." }].filter(function (w) { return w.t !== "$" + m + "$"; }),
              hints: ["No solution means parallel lines: same slope, different intercept."], why: "With $k = " + m + "$ the slopes match and the intercepts ($" + c1 + "$ and $" + c2 + "$) differ." });
          }
          var e1 = [a, b, c], e2;
          if (kind === 0) { e2 = [k * a, k * b, k * c]; }
          else if (kind === 1) { e2 = [k * a, k * b, k * c + R.nz(-5, 5)]; }
          else { e2 = [R.nz(-5, 5), R.nz(-5, 5), R.int(-9, 9)]; while (e2[0] * b === e2[1] * a) e2[0] = R.nz(-5, 5); }
          var right = kind === 0 ? "Infinitely many" : kind === 1 ? "None" : "Exactly one";
          return mc(R, { prompt: "How many solutions does this system have? " + sysTex(eqTex(e1), eqTex(e2)), right: right,
            wrong: [{ t: "Infinitely many", fb: kind === 1 ? "The left sides match (after multiplying) but the right sides don't." : "The second isn't a multiple of the first." },
                    { t: "None", fb: kind === 0 ? "The second is just the first times " + k + " — the same line." : "The slopes are different, so the lines cross." },
                    { t: "Exactly one", fb: "The $x$ and $y$ parts are in the same ratio, so the lines are parallel or the same." }].filter(function (w) { return w.t !== right; }),
            keep: false, hints: ["Is the second equation's left side a multiple of the first's? If so, compare the right sides."],
            why: kind === 0 ? "The second equation is " + k + " times the first: the same line." : kind === 1 ? k + " times the first gives the same left side as the second, but a different right side: parallel lines." : "The slopes differ, so the lines cross exactly once." });
        } },
      { id: "a6-age", title: "Age word problems", lesson: 6,
        gen: function (R) {
          var N = R.pick([["Ava", "Leo"], ["Sam", "Kai"], ["Maya", "Omar"], ["Noor", "Eli"]]), T = R.int(0, 2);
          if (T === 0) { var y = R.int(5, 20), d = R.int(2, 9); var o = y + d;
            return { type: "num", prompt: N[0] + " is " + d + " years older than " + N[1] + ". Their ages add up to " + (o + y) + ". How old is " + N[1] + "?", answer: y,
              near: [{ v: o, fb: "That's " + N[0] + "'s age." }], hints: ["Let " + N[1] + " be $y$: then " + N[0] + " is $y + " + d + "$.", "$y + (y + " + d + ") = " + (o + y) + "$."],
              why: lines(["2y + " + d + " = " + (o + y), "y = " + y]) }; }
          if (T === 1) { var s = R.int(3, 9), k = R.pick([2, 3, 4]), yrs; var o2 = k * s;
            // in yrs years, o2 + yrs = j (s + yrs) with j = k − 1 when it works out
            var j = k - 1; yrs = (o2 - j * s) / (j - 1 || 1);
            if (j < 2 || yrs % 1 || yrs <= 0) { return { type: "num", prompt: N[0] + " is " + k + " times as old as " + N[1] + ". The sum of their ages is " + (o2 + s) + ". How old is " + N[1] + "?", answer: s,
              near: [{ v: o2, fb: "That's " + N[0] + "." }], hints: ["$o = " + k + "y$ and $o + y = " + (o2 + s) + "$.", "$" + (k + 1) + "y = " + (o2 + s) + "$."], why: lines([(k + 1) + "y = " + (o2 + s), "y = " + s]) }; }
            return { type: "num", prompt: N[0] + " is " + k + " times as old as " + N[1] + ". In " + yrs + " years " + N[0] + " will be " + j + " times as old as " + N[1] + ". How old is " + N[1] + " now?", answer: s,
              near: [{ v: o2, fb: "That's " + N[0] + "'s age now." }, { v: s + yrs, fb: "That's " + N[1] + "'s age in " + yrs + " years." }],
              hints: ["Let " + N[1] + " be $y$ now: " + N[0] + " is $" + k + "y$.", "In " + yrs + " years: $" + k + "y + " + yrs + " = " + j + "(y + " + yrs + ")$."],
              why: lines([k + "y + " + yrs + " = " + j + "y + " + j * yrs, "y = " + s]) }; }
          var yy = R.int(4, 12), dd = R.int(2, 6), ago = R.int(1, Math.min(3, yy - 1)), oo = yy + dd;
          var ratio = (oo - ago) / (yy - ago);
          if (ratio % 1) { return { type: "num", prompt: N[0] + " is " + dd + " years older than " + N[1] + ". In " + ago + " years their ages will add up to " + (oo + yy + 2 * ago) + ". How old is " + N[1] + " now?", answer: yy,
            hints: ["Now: " + N[1] + " is $y$, " + N[0] + " is $y + " + dd + "$.", "In " + ago + " years: $(y + " + ago + ") + (y + " + dd + " + " + ago + ") = " + (oo + yy + 2 * ago) + "$."],
            why: lines(["2y + " + (dd + 2 * ago) + " = " + (oo + yy + 2 * ago), "y = " + yy]) }; }
          return { type: "num", prompt: N[0] + " is " + dd + " years older than " + N[1] + ". " + ago + " year" + (ago > 1 ? "s" : "") + " ago, " + N[0] + " was " + ratio + " times as old as " + N[1] + ". How old is " + N[1] + " now?", answer: yy,
            hints: ["Now: " + N[1] + " is $y$ and " + N[0] + " is $y + " + dd + "$.", ago + " years ago: $y + " + dd + " - " + ago + " = " + ratio + "(y - " + ago + ")$."],
            why: lines([poly([[1, "y"], [dd - ago, ""]]) + " = " + ratio + "y - " + ratio * ago, "y = " + yy]) };
        } },
      { id: "a6-words", title: "Systems of equations word problems", lesson: 6,
        gen: function (R) {
          var T = R.pick([
            function () { var pa = R.pick([8, 9, 10, 12]), pc = R.pick([4, 5, 6]), a = R.int(8, 30), c = R.int(8, 30), ask = R.chance(0.5);
              return { p: "A museum sold $" + (a + c) + "$ tickets for \\$" + (pa * a + pc * c) + ". Adult tickets cost \\$" + pa + " and child tickets \\$" + pc + ". How many **" + (ask ? "adult" : "child") + "** tickets were sold?",
                a: ask ? a : c, other: ask ? c : a, sys: "a + c = " + (a + c) + ", \\; " + pa + "a + " + pc + "c = " + (pa * a + pc * c) }; },
            function () { var x = R.pick([1.5, 2, 2.5, 3]), y = R.pick([1, 1.5, 3.5, 4]), p = R.int(1, 3), q = R.int(2, 4), r = R.int(2, 4), s = R.int(1, 3);
              while (p * s === q * r) s = R.int(1, 3);
              var ask = R.chance(0.5);
              return { p: p + " coffee" + (p > 1 ? "s" : "") + " and " + q + " muffins cost \\$" + money(p * x + q * y) + ". " + r + " coffees and " + s + " muffin" + (s > 1 ? "s" : "") + " cost \\$" + money(r * x + s * y) + ". How much is one **" + (ask ? "coffee" : "muffin") + "**, in dollars?",
                a: ask ? x : y, other: ask ? y : x, sys: poly([[p, "c"], [q, "m"]]) + " = " + money(p * x + q * y) + ", \\; " + poly([[r, "c"], [s, "m"]]) + " = " + money(r * x + s * y), pre: "\\$" }; },
            function () { var d = R.int(4, 15), q = R.int(4, 15), ask = R.chance(0.5);
              return { p: "A jar has $" + (d + q) + "$ coins, all 10-cent and 25-cent coins, worth " + (10 * d + 25 * q) + " cents. How many **" + (ask ? "10-cent" : "25-cent") + "** coins are there?",
                a: ask ? d : q, other: ask ? q : d, sys: "d + q = " + (d + q) + ", \\; 10d + 25q = " + (10 * d + 25 * q) }; },
            function () { var w = R.int(2, 5), b = R.int(8, 16), tw = R.int(1, 3), tb = R.int(1, 3); var ask = R.chance(0.5);
              return { p: "Jo walks at " + w + " km/h and cycles at " + b + " km/h. One day she walks for " + tw + " h and cycles for " + tb + " h, covering " + (w * tw + b * tb) + " km. The next day she walks " + (tw + 1) + " h and cycles " + tb + " h, covering " + (w * (tw + 1) + b * tb) + " km. What is her **" + (ask ? "walking" : "cycling") + "** speed, in km/h?",
                a: ask ? w : b, other: ask ? b : w, sys: poly([[tw, "w"], [tb, "b"]]) + " = " + (w * tw + b * tb) + ", \\; " + poly([[tw + 1, "w"], [tb, "b"]]) + " = " + (w * (tw + 1) + b * tb) }; }])();
          return { type: "num", prompt: T.p, answer: T.a, pre: T.pre, near: nears(T.a, [{ v: T.other, fb: "That's the other unknown." }]),
            hints: ["Write one equation for each fact: $" + T.sys + "$.", "Solve by substitution or elimination."], why: "$" + T.sys + "$ gives " + num(T.a) + " for the one asked (and " + num(T.other) + " for the other)." };
        } },
      { id: "a6-words01", title: "Systems word problems with zero or infinite solutions", lesson: 6,
        gen: function (R) {
          var a = R.int(2, 4), b = R.int(2, 5), pa = R.pick([1, 1.5, 2]), pb = R.pick([0.5, 1, 2.5]), k = R.pick([2, 3]), kind = R.int(0, 2);
          var t1 = a * pa + b * pb, t2 = kind === 0 ? k * t1 : kind === 1 ? k * t1 + R.pick([-2, 2, 3]) : 0;
          var I = R.pick([["apples", "pears"], ["pencils", "rubbers"], ["cans of soup", "loaves"]]);
          if (kind === 2) {
            var c = R.int(1, 3), d = R.int(1, 4);
            while (a * d === b * c) d = R.int(1, 4);
            t2 = c * pa + d * pb;
            return mc(R, { prompt: a + " " + I[0] + " and " + b + " " + I[1] + " cost \\$" + money(t1) + ". At the same prices, " + c + " " + I[0] + " and " + d + " " + I[1] + " cost \\$" + money(t2) + ". What can you say?",
              right: "There is exactly one pair of prices that fits", wrong: [{ t: "There is no solution — the facts contradict", fb: "The two baskets aren't in the same ratio, so the lines cross once." }, { t: "There isn't enough information", fb: "Two different, unrelated baskets pin both prices down." }],
              keep: true, hints: ["Is one basket just a multiple of the other?"], why: "The baskets aren't multiples of each other, so the system has one solution." });
          }
          return mc(R, { prompt: a + " " + I[0] + " and " + b + " " + I[1] + " cost \\$" + money(t1) + ". At the same prices, " + k * a + " " + I[0] + " and " + k * b + " " + I[1] + " cost \\$" + money(t2) + ". What can you say about the prices?",
            right: kind === 0 ? "There isn't enough information — infinitely many pairs of prices fit" : "There's no solution — the facts contradict",
            wrong: [{ t: kind === 0 ? "There's no solution — the facts contradict" : "There isn't enough information — infinitely many pairs of prices fit",
                      fb: kind === 0 ? k + " times \\$" + money(t1) + " is \\$" + money(k * t1) + ": the second fact agrees with the first, it just adds nothing." : k + " times the first basket should cost \\$" + money(k * t1) + ", not \\$" + money(t2) + "." },
                    { t: "There is exactly one pair of prices that fits", fb: "The second basket is exactly " + k + " times the first, so the two equations can't cross at a single point." }],
            keep: true, hints: ["The second basket is " + k + " times the first. What should it cost?"],
            why: kind === 0 ? "The second equation is " + k + " times the first — the same line: infinitely many solutions." : "The left sides are in ratio " + k + " but the prices aren't: parallel lines, no solution." });
        } }
    ]
  });
})();
