/* ==========================================================================
   Algebra II — Unit 4: Systems of Linear Equations. See lab/core.js for the
   format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 4, section for section:
   the readiness check, then 4.1 to 4.7. Each lesson teaches the book's own
   steps: the method, a worked example to watch, one done together, then on
   your own, a harder case, find the error, use it, and the concept built at
   the end.

   Two variables first (4.1), then what systems are for (4.2–4.3), three
   variables (4.4), the two matrix methods (4.5–4.6: the matrix is drawn
   beside the work and changes a row at a time), and systems of inequalities
   (4.7).

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Eight lessons, seven skills, two quizzes, and the unit test.
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
  /* Shared by every Algebra II unit (compiled in after the Algebra I helpers). */
  var GIVEN = "That is the problem as it was given.", LATER = "This line follows correctly from the one above it. Look earlier.";
  var fig = L.fig;
  // A coordinate grid beside a worked example: grid("what it shows", items, { x, y, u }).
  // The scale fits the window: about 240 px across the longer side.
  function grid(alt, items, o) {
    o = Object.assign({ x: [-6, 6], y: [-6, 6], alt: alt, items: items }, o || {});
    if (!o.u) o.u = Math.max(14, Math.min(26, Math.floor(240 / Math.max(o.x[1] - o.x[0], o.y[1] - o.y[0]))));
    return fig(o);
  }
  // A curve for a figure, as short segments: curve(f, from, to, colour, [ylo, yhi]).
  // Pieces that leave the window are dropped, so the curve stops at the edge.
  function curve(f, a, b, c, yr) {
    var out = [], n = 60, px = a, py = f(a);
    for (var i = 1; i <= n; i++) {
      var x = a + (b - a) * i / n, y = f(x);
      if (isFinite(py) && isFinite(y) && (!yr || (py >= yr[0] && py <= yr[1] && y >= yr[0] && y <= yr[1]))) out.push({ seg: [[px, py], [x, y]], c: c || "blue" });
      px = x; py = y;
    }
    return out;
  }
  // The same for a curve given as x = g(y): a parabola on its side.
  function curveY(g, a, b, c) {
    return curve(g, a, b, c).map(function (it) { return { seg: [[it.seg[0][1], it.seg[0][0]], [it.seg[1][1], it.seg[1][0]]], c: it.c }; });
  }
  // A matrix on the board beside a worked example: mat([[1, 2, 7], [3, -1, 7]]) is the augmented
  // matrix of x + 2y = 7, 3x − y = 7. { det: true } draws a determinant (straight bars, no
  // augmenting bar); { hot: i } colours the row that has just changed.
  function mat(rows, o) {
    o = o || {};
    var n = rows.length, k = rows[0].length, R = k + 0.2, items = [];
    rows.forEach(function (r, i) {
      r.forEach(function (v, j) { items.push({ text: String(v).replace(/-/g, "−"), at: [j + 0.6, n - i - 0.64], eq: true, c: o.hot === i ? "blue" : "ink" }); });
    });
    // { plain: true }: no brackets at all, with a rule above the last row (a synthetic division).
    if (o.plain) items.push({ seg: [[0.1, 1], [R - 0.1, 1]], c: "soft" });
    else [[0.06, 1], [R - 0.06, -1]].forEach(function (b) {
      items.push({ seg: [[b[0], 0.08], [b[0], n - 0.08]] });
      if (!o.det) items.push({ seg: [[b[0], 0.08], [b[0] + 0.16 * b[1], 0.08]] }, { seg: [[b[0], n - 0.08], [b[0] + 0.16 * b[1], n - 0.08]] });
    });
    if (!o.det && !o.plain) items.push({ seg: [[k - 0.9, 0.2], [k - 0.9, n - 0.2]], c: "soft" });
    return fig({ grid: false, x: [0, R], y: [0, n], u: 42, pad: 8, alt: o.alt || (o.det ? "The determinant with rows " : "The matrix with rows ") + rows.map(function (r) { return r.join(", "); }).join("; ") + ".", items: items });
  }
  // The rows of an augmented matrix set in a line of maths: [1 2 | 7]  [3 −1 | 7].
  function rowsTex(rows) {
    return rows.map(function (r) { return "[\\," + r.slice(0, -1).join(" \\quad ") + " \\;|\\; " + r[r.length - 1] + "\\,]"; }).join(" \\qquad ");
  }
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Chapter 4 Be Prepared · Solve an equation, rearrange one, and test a point.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Solve", prompt: "Solve $3x - 2(x + 1) = 5$.", pre: "$x =$", answer: 7, skill: "Solve a linear equation",
        near: [{ v: 3, fb: "$-2(x + 1) = -2x - 2$. Then $x - 2 = 5$." }, { v: 6, fb: "The $-2$ multiplies the 1 as well." }],
        hints: ["Distribute the $-2$, then combine."], why: "$3x - 2x - 2 = 5$, so $x = 7$." },
      { type: "num", prompt: "What is $0.15 \\times 200$?", answer: 30, skill: "Decimal arithmetic",
        near: [{ v: 3, fb: "$0.15 \\times 100 = 15$, so twice that." }], hints: ["15% of 200."], why: "$0.15 \\times 200 = 30$." },
      { type: "choice", kicker: "Check 2 · Rearrange", prompt: "Solve $x + 2y = 6$ for $x$.",
        options: [{ t: "$x = 6 - 2y$" }, { t: "$x = 6 + 2y$", fb: "Subtract $2y$ from both sides." }, { t: "$x = 3 - y$", fb: "$x$ has coefficient 1: nothing needs dividing." }],
        answer: 0, skill: "Solve a formula", hints: ["Move the $2y$ to the other side."], why: "$x = 6 - 2y$." },
      { type: "num", prompt: "What is the slope of the line $y = -2x + 4$?", pre: "$m =$", answer: -2, skill: "Slope-intercept form",
        near: [{ v: 4, fb: "4 is the $y$-intercept. The slope multiplies $x$." }], hints: ["Compare with $y = mx + b$."], why: "$m = -2$." },
      { type: "choice", kicker: "Check 3 · Test a point", prompt: "Is $(3, -1)$ a solution of $2x + y = 5$?",
        options: [{ t: "Yes: $6 - 1 = 5$" }, { t: "No", fb: "$2(3) + (-1) = 5$." }],
        answer: 0, skill: "Check a solution", hints: ["$x = 3$ and $y = -1$."], why: "$2(3) + (-1) = 5$ is true." },
      { type: "choice", prompt: "Which inequality has a **dashed** boundary line?",
        options: [{ t: "$y < 2x + 1$" }, { t: "$y \\le 2x + 1$", fb: "$\\le$ includes the line, so it is drawn solid." }],
        answer: 0, skill: "Graph an inequality in two variables", hints: ["Dashed means the line itself is not included."], why: "A strict inequality leaves the boundary out: dashed." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 4.1**. If **check 1** slipped, see lesson 2.1. If **check 2** slipped, lessons 2.3 and 3.2 cover it. If **check 3** slipped, see lessons 3.1 and 3.4.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ============ 4.1 · Solve systems of linear equations with two variables */
  var HOW_4_1 = [["Line up", "Write both equations in standard form, $Ax + By = C$."],
                 ["Opposites", "Multiply one or both equations so that one variable has opposite coefficients."],
                 ["Add", "Add the equations. That variable is eliminated."],
                 ["Solve", "Solve for the variable that is left."],
                 ["Back", "Substitute back to find the other variable, and check the pair in both equations."]];
  var HOW_4_1S = [["Isolate", "Solve one equation for one variable."],
                  ["Substitute", "Put that expression into the other equation."],
                  ["Solve", "Solve the equation in one variable."],
                  ["Back", "Substitute back for the other variable, and check."]];
  LESSONS.push({
    title: "Systems with two variables",
    blurb: "Book 4.1 · Solving a system by graphing, by substitution and by elimination, and choosing between them.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A solution of a **system** makes every equation true. Is $(2, 3)$ a solution of this system?" + sys("x + y = 5", "2x - y = 1"),
        options: [{ t: "Yes: $2 + 3 = 5$ and $4 - 3 = 1$" }, { t: "No: it fails the second equation", fb: "$2(2) - 3 = 1$. It works there too." }, { t: "No: a pair can only fit one equation", fb: "The lines cross at one point, and that point is on both." }],
        answer: 0, skill: "Check a solution", hints: ["Put $x = 2$ and $y = 3$ into both equations."], why: "It makes both equations true, so it is the point where the two lines cross." },
      { type: "learn", kicker: "The idea",
        prompt: "Graphing shows what a solution is: the point where the lines cross. To find it exactly, **eliminate** a variable: make its coefficients opposites and add the equations. One equation in one variable is left.",
        scene: { type: "method", how: HOW_4_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a system solved by elimination." + sys("2x + y = 7", "3x - 2y = 0"),
        scene: { type: "walk", how: HOW_4_1, rows: [
          { step: 1, m: "2x + y = 7 \\quad 3x - 2y = 0", say: "Both equations are already in standard form." },
          { step: 2, m: "4x + 2y = 14 \\quad 3x - 2y = 0", say: "Multiply the first equation by 2. The $y$ terms are now $2y$ and $-2y$: opposites.",
            ask: { prompt: "What should the first equation be multiplied by, so that the $y$ terms become opposites?", answer: 0,
                   options: [{ t: "2" }, { t: "$-2$", fb: "That gives $-2y$ and $-2y$: equal, not opposite." }, { t: "3", fb: "That gives $3y$ and $-2y$. They would not cancel." }] } },
          { step: 3, m: "7x = 14", say: "Add the equations: $2y - 2y = 0$." },
          { step: 4, m: "x = 2", say: "Divide by 7." },
          { step: 5, m: "2(2) + y = 7 \\quad y = 3", say: "Substitute $x = 2$ into the first equation." },
          { step: 5, m: "(2, 3)", say: "Check in the second: $3(2) - 2(3) = 0$. ✓" }] },
        gate: true, then: "Two equations and two unknowns became one equation and one unknown." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step." + sys("x + 3y = 7", "2x - y = 0"),
        how: HOW_4_1, skill: "Elimination",
        steps: [
          { step: 1, ask: "Is each equation in the form $Ax + By = C$?", type: "choice", answer: 0,
            options: [{ t: "Yes: both are" }, { t: "No", fb: "Each has its $x$ term, then its $y$ term, then a constant on the right." }],
            m: "x + 3y = 7 \\quad 2x - y = 0", say: "Variables lined up on the left." },
          { step: 2, ask: "The $y$ coefficients are 3 and $-1$. What makes them opposites?", type: "choice", answer: 0,
            options: [{ t: "Multiply the second equation by 3" }, { t: "Multiply the first equation by 3", fb: "That gives $9y$ and $-y$: not opposites." }, { t: "Multiply the second equation by $-3$", fb: "That gives $+3y$: equal to the first, not opposite." }],
            m: "x + 3y = 7 \\quad 6x - 3y = 0", say: "$3y$ and $-3y$." },
          { step: 3, ask: "Add the two equations.", type: "choice", answer: 0,
            options: [{ t: "$7x = 7$" }, { t: "$7x + 6y = 7$", fb: "$3y - 3y = 0$: the $y$ terms cancel." }, { t: "$5x = 7$", fb: "$x + 6x = 7x$." }],
            m: "7x = 7", say: "$y$ is eliminated." },
          { step: 4, ask: "Solve for $x$.", type: "num", pre: "$x =$", answer: 1, hint: "$7 \\div 7$.",
            m: "x = 1", say: "Divide by 7." },
          { step: 5, ask: "Substitute $x = 1$ into $x + 3y = 7$. What is $y$?", type: "num", pre: "$y =$", answer: 2, near: [{ v: 6, fb: "$3y = 6$. Divide by 3." }], hint: "$1 + 3y = 7$.",
            m: "(1, 2)", say: "Check in the other equation: $2(1) - 2 = 0$. ✓" }],
        why: "Line up, opposites, add, solve, back. Now read a solution from a graph." },
      { type: "pair", kicker: "On your own", prompt: "Solve by graphing: the two lines are drawn. At what point $(x, y)$ do they cross?" + sys("y = x + 1", "y = -2x + 7"),
        answer: [2, 3], skill: "Solve by graphing",
        scene: { type: "plane", x: [-2, 6], y: [-1, 8], fns: [{ f: "x + 1", color: "blue" }, { f: "-2*x + 7", color: "green" }] },
        near: [{ v: [3, 2], fb: "Write $x$ first: the crossing is 2 across and 3 up." }],
        hints: ["Find the point that is on both lines."], why: "$(2, 3)$: $3 = 2 + 1$ and $3 = -2(2) + 7$." },
      { type: "pair", prompt: "Solve by elimination. Type the solution as $(x, y)$." + sys("x + y = 5", "x - y = 1"),
        answer: [3, 2], skill: "Elimination",
        near: [{ v: [2, 3], fb: "Those are the right numbers in the wrong order: $x - y$ must be 1." }],
        hints: ["Add the equations as they are: $2x = 6$."], why: "$2x = 6$, so $x = 3$, and $3 + y = 5$ gives $y = 2$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When one equation already has a variable alone, **substitution** is quicker." + sys("y = 2x - 5", "3x + 2y = 11"),
        scene: { type: "walk", how: HOW_4_1S, rows: [
          { step: 1, m: "y = 2x - 5", say: "The first equation already has $y$ alone." },
          { step: 2, m: "3x + 2(2x - 5) = 11", say: "Put $2x - 5$ in place of $y$ in the other equation." },
          { step: 3, m: "7x - 10 = 11", say: "Distribute and combine." },
          { step: 3, m: "x = 3", say: "Add 10, then divide by 7." },
          { step: 4, m: "y = 2(3) - 5 = 1", say: "Back into $y = 2x - 5$. The solution is $(3, 1)$." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "Not every system has one solution. Compare the slopes and intercepts, then sort.",
        bins: ["One solution", "No solution", "Infinitely many"],
        cards: [{ t: two("y = 2x + 1", "y = 2x - 3"), bin: 1, fb: "Same slope, different intercepts: parallel lines never meet. The system is **inconsistent**." },
                { t: two("y = x + 2", "y = -x + 4"), bin: 0, fb: "Different slopes: the lines cross once." },
                { t: two("x + y = 3", "2x + 2y = 6"), bin: 2, fb: "The second is twice the first: the same line. The equations are **dependent**." }],
        skill: "Number of solutions", hints: ["Parallel, crossing, or the same line?"],
        why: "Crossing lines: one solution. Parallel lines: none. The same line: infinitely many." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Jo multiplies the second equation by 3, then adds. Tap the line where the work **first** goes wrong." + sys("2x + 3y = 12", "x - y = 1"),
        lines: ["x - y = 1", "3x - 3y = 1", "5x = 13", "x = \\frac{13}{5}"], answer: 1, fix: "3x - 3y = 3",
        fb: { 0: "This is the second equation, as given.", 2: LATER, 3: LATER }, skill: "Elimination",
        hints: ["Multiplying an equation multiplies every term on both sides."],
        why: "The 1 is multiplied too: $3x - 3y = 3$. Then $5x = 15$, so $x = 3$ and $y = 2$." },
      { type: "choice", kicker: "Use it", prompt: "Which method is the most convenient for this system?" + sys("y = 3x - 2", "4x + 5y = 9"),
        options: [{ t: "Substitution: one equation already has $y$ alone" }, { t: "Graphing: it is always the most accurate", fb: "A graph is only as exact as the drawing. It is best for seeing, not for exact answers." }, { t: "Elimination: nothing else works here", fb: "Elimination would work, but the first equation must be rearranged first." }],
        answer: 0, skill: "Choose a method", hints: ["Which method can start straight away?"], why: "Put $3x - 2$ in place of $y$: $4x + 5(3x - 2) = 9$." }
    ]
  });

  /* ================== 4.2 · Solve applications with systems of equations */
  var HOW_4_2 = [["Read", "Read the problem. What two things are you looking for?"],
                 ["Name", "Choose a variable for each unknown."],
                 ["Translate", "Write a system: one equation for each fact in the problem."],
                 ["Solve", "Solve the system by substitution or elimination."],
                 ["Answer", "Check both facts, then answer in a sentence."]];
  LESSONS.push({
    title: "Applications with systems",
    blurb: "Book 4.2 · Two unknowns, two equations: number, geometry and motion problems.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "“The sum of two numbers is 20, and their difference is 4.” Which system says this?",
        options: [{ t: two("x + y = 20", "x - y = 4") }, { t: two("x + y = 4", "x - y = 20"), fb: "The **sum** is 20 and the **difference** is 4." }, { t: two("xy = 20", "x - y = 4"), fb: "A sum is an addition. $xy$ is a product." }],
        answer: 0, skill: "Translate to a system", hints: ["Sum means add. Difference means subtract."], why: "Each fact becomes one equation." },
      { type: "learn", kicker: "The idea",
        prompt: "With two unknowns you no longer have to squeeze everything into one variable. Give each unknown its own letter, and write one equation for each fact. Two unknowns need two equations.",
        scene: { type: "method", how: HOW_4_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one: **the sum of two numbers is 51. The larger is 3 more than twice the smaller.**",
        scene: { type: "walk", how: HOW_4_2, rows: [
          { step: 1, m: "\\text{find two numbers}", say: "Two unknowns: a smaller number and a larger one." },
          { step: 2, m: "x \\quad\\text{and}\\quad y", say: "Let $x$ be the smaller number and $y$ the larger." },
          { step: 3, m: "x + y = 51 \\quad y = 2x + 3", say: "Two facts, two equations.",
            ask: { prompt: "“The larger is 3 more than twice the smaller.” Which equation is that?", answer: 0,
                   options: [{ t: "$y = 2x + 3$" }, { t: "$y = 2(x + 3)$", fb: "Only the smaller number is doubled. The 3 is added after." }, { t: "$x = 2y + 3$", fb: "The larger number, $y$, is the one being described." }] } },
          { step: 4, m: "x + (2x + 3) = 51", say: "The second equation has $y$ alone, so substitute." },
          { step: 4, m: "x = 16 \\quad y = 35", say: "$3x + 3 = 51$ gives $x = 16$. Then $y = 2(16) + 3$." },
          { step: 5, m: "16 + 35 = 51", say: "The numbers are 16 and 35. Both facts hold. ✓" }] },
        gate: true, then: "Each sentence of the problem became one equation of the system." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step. **A rectangle has a perimeter of 60 m. Its length is 6 m more than its width.**",
        how: HOW_4_2, skill: "Applications of systems",
        steps: [
          { step: 1, ask: "What are the two unknowns?", type: "choice", answer: 0,
            options: [{ t: "The length and the width" }, { t: "The perimeter and the area", fb: "The perimeter is given, and the area is not asked for." }],
            m: "\\text{find the length and the width}", say: "Two things to find." },
          { step: 2, ask: "Call them $L$ and $W$. How many equations will you need?", type: "choice", answer: 0,
            options: [{ t: "Two" }, { t: "One", fb: "One equation in two unknowns has many solutions. Each unknown needs a fact." }],
            m: "L \\quad\\text{and}\\quad W", say: "Two letters, so two equations." },
          { step: 3, ask: "Translate both facts.", type: "choice", answer: 0,
            options: [{ t: two("2L + 2W = 60", "L = W + 6") }, { t: two("L + W = 60", "L = W + 6"), fb: "A perimeter counts every side: two lengths and two widths." }, { t: two("2L + 2W = 60", "W = L + 6"), fb: "The **length** is the one that is 6 more." }],
            m: "2L + 2W = 60 \\quad L = W + 6", say: "The perimeter, and the comparison." },
          { step: 4, ask: "Substitute: $2(W + 6) + 2W = 60$. What is $W$?", type: "num", pre: "$W =$", answer: 12, near: [{ v: 13.5, tol: 1e-9, fb: "Distribute the 2: $2W + 12 + 2W = 60$." }], hint: "$4W + 12 = 60$.",
            m: "W = 12 \\quad L = 18", say: "$4W = 48$, and the length is 6 more." },
          { step: 5, ask: "Check. What is the perimeter when $L = 18$ and $W = 12$?", type: "num", answer: 60, hint: "$2(18) + 2(12)$.",
            m: "2(18) + 2(12) = 60", say: "The rectangle is 18 m by 12 m. ✓" }],
        why: "Read, name, translate, solve, answer. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Two angles add to **180°**. The larger is **12° less than five times** the smaller. Find the **smaller** angle.",
        post: "°", answer: 32, skill: "Applications of systems",
        near: [{ v: 148, fb: "That is the larger angle. The question asks for the smaller." }, { v: 28, fb: "$x + (5x - 12) = 180$, so $6x = 192$." }],
        hints: ["$x + y = 180$ and $y = 5x - 12$."], why: "$6x - 12 = 180$, so $6x = 192$ and $x = 32$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A current helps one way and hinders the other. **A boat travels 60 miles downstream in 3 hours, and comes back in 5 hours.** Find the boat's speed and the current's.",
        scene: { type: "walk", how: HOW_4_2, rows: [
          { step: 1, m: "\\text{boat speed and current speed}", say: "Two unknown speeds." },
          { step: 2, m: "b \\quad\\text{and}\\quad c", say: "Downstream the speeds add: $b + c$. Upstream the current is taken away: $b - c$." },
          { step: 3, m: "3(b + c) = 60 \\quad 5(b - c) = 60", say: "Rate times time is distance, each way." },
          { step: 4, m: "b + c = 20 \\quad b - c = 12", say: "Divide the first equation by 3 and the second by 5." },
          { step: 4, m: "b = 16 \\quad c = 4", say: "Add: $2b = 32$. Then $c = 20 - 16$." },
          { step: 5, m: "3(16 + 4) = 60 \\quad 5(16 - 4) = 60", say: "The boat does 16 mph and the current 4 mph. ✓" }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A show sold **120 tickets**: adults at **\\$9** and children at **\\$5**, for **\\$840** in all. How many **adult** tickets?",
        answer: 60, skill: "Applications of systems",
        near: [{ v: 93.33, tol: 0.01, fb: "Two prices are involved: $a + c = 120$ and $9a + 5c = 840$." }],
        hints: ["$a + c = 120$ and $9a + 5c = 840$. Substitute $c = 120 - a$."], why: "$9a + 600 - 5a = 840$, so $4a = 240$ and $a = 60$." },
      { type: "choice", kicker: "Find the error",
        prompt: "“The sum of two numbers is 30, and one number is 4 times the other.” Pat writes $x + y = 30$ and $y = x + 4$. What is wrong?",
        options: [{ t: "“4 times” is a multiplication: $y = 4x$." },
                  { t: "The first equation should be $xy = 30$.", fb: "A sum is an addition. $x + y = 30$ is right." },
                  { t: "Nothing. The system is right.", fb: "$x + 4$ is 4 **more than** $x$, not 4 times it." }],
        answer: 0, skill: "Translate to a system", hints: ["Step 3: translate each phrase exactly."], why: "$x + 4x = 30$ gives $x = 6$ and $y = 24$." },
      { type: "num", kicker: "Use it", prompt: "A jar holds **30 coins**, all nickels and dimes, worth **\\$2.10**. How many **dimes** are there?",
        answer: 12, skill: "Applications of systems",
        near: [{ v: 18, fb: "That is the number of nickels." }],
        hints: ["$n + d = 30$ and $5n + 10d = 210$, in cents."], why: "$5(30 - d) + 10d = 210$ gives $5d = 60$, so $d = 12$." }
    ]
  });

  /* ========== 4.3 · Solve mixture applications with systems of equations */
  var HOW_4_3 = [["Table", "Organise the facts in a table: amount, rate or price, and value."],
                 ["System", "Write one equation for the amounts and one for the values."],
                 ["Solve", "Solve the system."],
                 ["Answer", "Check, and answer the question asked."]];
  LESSONS.push({
    title: "Mixtures, interest, cost and revenue",
    blurb: "Book 4.3 · Mixture and interest problems with two variables, and where a business breaks even.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "How many liters of pure acid are in **20 liters** of a **30%** acid solution?",
        post: "liters", answer: 6, skill: "Percent of an amount",
        near: [{ v: 600, fb: "Write 30% as 0.30 before multiplying." }], hints: ["$0.30 \\times 20$."], why: "$0.30 \\times 20 = 6$." },
      { type: "learn", kicker: "The idea",
        prompt: "Mixture problems come back with two variables: one for each amount. The table then gives two equations. The **amounts** add up to the total amount, and the **values** add up to the total value.",
        scene: { type: "method", how: HOW_4_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch one: **peanuts at \\$6 a pound and cashews at \\$10 a pound are mixed to make 20 pounds worth \\$7.50 a pound.**",
        scene: { type: "walk", how: HOW_4_3, rows: [
          { step: 1, m: "6p \\quad 10c \\quad 7.50(20) = 150", say: "Value is price times pounds: for the peanuts, the cashews, and the mix." },
          { step: 2, m: "p + c = 20 \\quad 6p + 10c = 150", say: "The pounds add up, and the values add up.",
            ask: { prompt: "What do the pounds of peanuts and cashews add up to?", answer: 0,
                   options: [{ t: "20" }, { t: "150", fb: "150 is the value of the mix in dollars." }, { t: "7.50", fb: "That is the price of the mix per pound." }] } },
          { step: 3, m: "6p + 10(20 - p) = 150", say: "From the first equation, $c = 20 - p$. Substitute it." },
          { step: 3, m: "p = 12.5 \\quad c = 7.5", say: "$200 - 4p = 150$, so $p = 12.5$." },
          { step: 4, m: "6(12.5) + 10(7.5) = 150", say: "12.5 pounds of peanuts and 7.5 pounds of cashews. ✓" }] },
        gate: true, then: "One equation counts the stuff. The other counts what it is worth." },
      { type: "guided", kicker: "Together",
        prompt: "Now interest. **\\$10,000 is split between an account paying 3% and one paying 5%. The year's interest is \\$420.**",
        how: HOW_4_3, skill: "Mixture and interest problems",
        steps: [
          { step: 1, ask: "Interest is principal times rate. What is a year's interest on $x$ dollars at 3%?", type: "choice", answer: 0,
            options: [{ t: "$0.03x$" }, { t: "$3x$", fb: "3% as a decimal is 0.03." }, { t: "$x + 0.03$", fb: "The rate multiplies the principal." }],
            m: "0.03x \\quad 0.05y", say: "The interest from each account." },
          { step: 2, ask: "Which system fits?", type: "choice", answer: 0,
            options: [{ t: two("x + y = 10000", "0.03x + 0.05y = 420") }, { t: two("x + y = 420", "0.03x + 0.05y = 10000"), fb: "The amounts invested add to 10,000. The interest adds to 420." }],
            m: "x + y = 10000 \\quad 0.03x + 0.05y = 420", say: "Amounts, then values." },
          { step: 3, ask: "Substitute $y = 10000 - x$: $0.03x + 500 - 0.05x = 420$. What is $x$?", type: "num", pre: "$x =$", answer: 4000, near: [big(4000), { v: -4000, fb: "$-0.02x = -80$: a negative divided by a negative." }], hint: "$-0.02x = -80$.",
            m: "x = 4000 \\quad y = 6000", say: "\\$4,000 at 3% and the rest at 5%." },
          { step: 4, ask: "Check. What is $0.03(4000) + 0.05(6000)$?", type: "num", answer: 420, hint: "$120 + 300$.",
            m: "120 + 300 = 420", say: "The interest matches. ✓" }],
        why: "Table, system, solve, answer. Now a solution mixture on your own." },
      { type: "num", kicker: "On your own", prompt: "A **10%** solution and a **40%** solution are mixed to make **30 liters** of a **20%** solution. How many liters of the **10%** solution are needed?",
        post: "liters", answer: 20, skill: "Mixture and interest problems",
        near: [{ v: 10, fb: "That is the 40% solution." }, { v: 15, fb: "Equal amounts would give 25%. The mix is weaker, so it needs more of the 10%." }],
        hints: ["$x + y = 30$ and $0.10x + 0.40y = 0.20(30)$."], why: "$0.10x + 0.40(30 - x) = 6$ gives $-0.30x = -6$, so $x = 20$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A business has a **cost function** and a **revenue function**. It breaks even where they are equal. $$C(x) = 12x + 1500 \\qquad R(x) = 27x$$",
        scene: { type: "walk", how: HOW_4_3, rows: [
          { step: 1, m: "C(x) = 12x + 1500 \\quad R(x) = 27x", say: "Cost: \\$12 for each unit plus \\$1,500 fixed. Revenue: \\$27 for each unit sold." },
          { step: 2, m: "R(x) = C(x)", say: "The break-even point is where revenue equals cost." },
          { step: 3, m: "27x = 12x + 1500", say: "Set the two rules equal." },
          { step: 3, m: "x = 100", say: "$15x = 1500$." },
          { step: 4, m: "27(100) = 2700 \\quad 12(100) + 1500 = 2700", say: "At 100 units both are \\$2,700. Sell more than that and there is a profit." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "A company's cost is $C(x) = 8x + 600$ and its revenue is $R(x) = 20x$. How many units must it sell to break even?",
        post: "units", answer: 50, skill: "Cost and revenue",
        near: [{ v: 30, fb: "Subtract $8x$ from both sides: $12x = 600$." }, { v: 75, fb: "Set revenue equal to cost: $20x = 8x + 600$." }],
        hints: ["$20x = 8x + 600$."], why: "$12x = 600$, so $x = 50$." },
      { type: "spotline", kicker: "Find the error",
        prompt: "A 20% solution and a 50% solution are mixed to make **12 liters** of a **30%** solution. Tap the line where the setup **first** goes wrong.",
        lines: ["x + y = 12", "0.20x + 0.50y = 30", "0.20x + 0.50(12 - x) = 30"], answer: 1, fix: "0.20x + 0.50y = 0.30(12)",
        fb: { 0: "The amounts do add up to 12 liters.", 2: LATER }, skill: "Mixture and interest problems",
        hints: ["How much acid is in 12 liters of a 30% solution?"],
        why: "The right side is the acid in the mixture: $0.30(12) = 3.6$ liters, not 30." },
      { type: "num", kicker: "Use it", prompt: "You invest **\\$5,000**, part at **2%** and the rest at **6%**, and earn **\\$220** in a year. How much did you invest at **6%**?",
        pre: "$\\$$", answer: 3000, skill: "Mixture and interest problems",
        near: [big(3000), { v: 2000, fb: "That is the amount at 2%." }],
        hints: ["$x + y = 5000$ and $0.02x + 0.06y = 220$."], why: "$0.02(5000 - y) + 0.06y = 220$ gives $0.04y = 120$, so $y = 3000$." }
    ]
  });
  // Three equations set one above the other.
  function sys3(a, b, c) { return sys(a, b) + "$$" + c + "$$"; }

  /* ============== 4.4 · Solve systems of equations with three variables */
  var HOW_4_4 = [["Pair 1", "Choose a variable. Eliminate it from one pair of equations."],
                 ["Pair 2", "Eliminate the same variable from a different pair."],
                 ["2 by 2", "Solve the new system of two equations in two variables."],
                 ["Third", "Substitute back to find the third variable."],
                 ["Check", "Write the ordered triple and check it in all three equations."]];
  LESSONS.push({
    title: "Systems with three variables",
    blurb: "Book 4.4 · Ordered triples, and elimination carried out twice.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A solution of a three-variable equation is an **ordered triple** $(x, y, z)$. Is $(2, -1, 3)$ a solution of $x + 2y + z = 3$?",
        options: [{ t: "Yes: $2 - 2 + 3 = 3$" }, { t: "No: $2 + 2 + 3 = 7$", fb: "$2y$ is $2(-1) = -2$." }],
        answer: 0, skill: "Check a solution", hints: ["$x = 2$, $y = -1$, $z = 3$."], why: "$2 + 2(-1) + 3 = 3$ is true." },
      { type: "learn", kicker: "The idea",
        prompt: "Three variables are one too many, so eliminate one of them twice. Two different pairs of equations, with the **same** variable removed from each, leave a system of two equations in two variables. That you can already solve.",
        scene: { type: "method", how: HOW_4_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a system of three solved." + sys3("x + y + z = 6", "2x - y + z = 3", "x + 2y - z = 2"),
        scene: { type: "walk", how: HOW_4_4, rows: [
          { step: 1, m: "x + y + z = 6 \\quad x + 2y - z = 2", say: "Take the first and third equations. Their $z$ terms are already opposites." },
          { step: 1, m: "2x + 3y = 8", say: "Add them: $z$ is eliminated." },
          { step: 2, m: "2x - y + z = 3 \\quad x + 2y - z = 2", say: "Now a different pair: the second and third. Eliminate $z$ again.",
            ask: { prompt: "Which variable must the second pair eliminate?", answer: 0,
                   options: [{ t: "$z$ again" }, { t: "Any variable", fb: "The two new equations must hold the same two variables, or they cannot be solved together." }] } },
          { step: 2, m: "3x + y = 5", say: "Add them." },
          { step: 3, m: "x = 1 \\quad y = 2", say: "From $3x + y = 5$, $y = 5 - 3x$. Then $2x + 3(5 - 3x) = 8$ gives $x = 1$." },
          { step: 4, m: "1 + 2 + z = 6 \\quad z = 3", say: "Substitute into the first equation." },
          { step: 5, m: "(1, 2, 3)", say: "Check the other two: $2 - 2 + 3 = 3$ and $1 + 4 - 3 = 2$. ✓" }] },
        gate: true, then: "Three equations became two, and two became one." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step." + sys3("x + y + z = 4", "x - y + z = 2", "2x + y - z = 1"),
        how: HOW_4_4, skill: "Three-variable systems",
        steps: [
          { step: 1, ask: "Add the first two equations. Which variable is eliminated?", type: "choice", answer: 0,
            options: [{ t: "$y$" }, { t: "$x$", fb: "$x + x = 2x$. It stays." }, { t: "$z$", fb: "$z + z = 2z$. It stays." }],
            m: "2x + 2z = 6", say: "$y - y = 0$." },
          { step: 2, ask: "Eliminate $y$ again: add the second and third equations.", type: "choice", answer: 0,
            options: [{ t: "$3x = 3$" }, { t: "$3x + 2z = 3$", fb: "$z - z = 0$: here $z$ cancels as well." }, { t: "$x = 3$", fb: "$x + 2x = 3x$." }],
            m: "3x = 3", say: "This time both $y$ and $z$ vanish." },
          { step: 3, ask: "So $x = 1$. Put that into $2x + 2z = 6$. What is $z$?", type: "num", pre: "$z =$", answer: 2, near: [{ v: 3, fb: "$2 + 2z = 6$, so $2z = 4$." }], hint: "$2 + 2z = 6$.",
            m: "x = 1 \\quad z = 2", say: "The 2-by-2 system is solved." },
          { step: 4, ask: "Put $x = 1$ and $z = 2$ into $x + y + z = 4$. What is $y$?", type: "num", pre: "$y =$", answer: 1, hint: "$1 + y + 2 = 4$.",
            m: "y = 1", say: "The third variable." },
          { step: 5, ask: "Write the solution as an ordered triple $(x, y, z)$.", type: "choice", answer: 0,
            options: [{ t: "$(1, 1, 2)$" }, { t: "$(1, 2, 1)$", fb: "The order is $x$, $y$, $z$: $y = 1$ and $z = 2$." }],
            m: "(1, 1, 2)", say: "Check the third equation: $2 + 1 - 2 = 1$. ✓" }],
        why: "Pair 1, pair 2, the 2-by-2, the third, check. Now one on your own." },
      { type: "num", kicker: "On your own", prompt: "Solve the system, and give $y$." + sys3("x + y + z = 10", "x - y + z = 4", "x + y - z = 2"),
        pre: "$y =$", answer: 3, skill: "Three-variable systems",
        near: [{ v: 4, fb: "That is $z$. Subtract the second equation from the first to find $y$." }, { v: 6, fb: "$2y = 6$. Divide by 2." }],
        hints: ["Subtract the second equation from the first: $x$ and $z$ both cancel."], why: "First minus second: $2y = 6$, so $y = 3$. (Then $z = 4$ and $x = 3$.)" },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes every variable vanishes at once. $$x + y + z = 2 \\qquad 2x + 2y + 2z = 7$$",
        scene: { type: "walk", how: HOW_4_4, rows: [
          { step: 1, m: "x + y + z = 2 \\quad 2x + 2y + 2z = 7", say: "Eliminate $x$ from this pair: multiply the first equation by $-2$." },
          { step: 1, m: "-2x - 2y - 2z = -4 \\quad 2x + 2y + 2z = 7", say: "Now every pair of terms is opposite." },
          { step: 1, m: "0 = 3", say: "Adding leaves a false statement, with no variables at all." },
          { step: 5, m: "\\text{no solution}", say: "The system is **inconsistent**: no triple fits both equations. A true statement like $0 = 0$ would mean infinitely many solutions." }] },
        gate: true },
      { type: "num", kicker: "Try it", prompt: "Three numbers add to **20**. The second is **twice** the first, and the third is **4 more than** the first. Find the first number.",
        answer: 4, skill: "Three-variable applications",
        near: [{ v: 8, fb: "That is the second number or the third. The question asks for the first." }],
        hints: ["$x + y + z = 20$, $y = 2x$, $z = x + 4$."], why: "$x + 2x + (x + 4) = 20$ gives $4x = 16$, so $x = 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Ana adds equations 1 and 2 to eliminate $y$. Then she subtracts equation 3 from equation 1 to eliminate $x$. What is wrong?",
        options: [{ t: "Both steps must eliminate the **same** variable. Otherwise the new equations still hold three variables between them." },
                  { t: "Equations may be added but never subtracted.", fb: "Subtracting is fine: it is adding the opposite." },
                  { t: "Nothing. Any two eliminations will do.", fb: "One new equation has $x$ and $z$, the other $y$ and $z$: three variables remain." }],
        answer: 0, skill: "Three-variable systems", hints: ["Step 2 of the method."], why: "Eliminate $y$ both times, and the two new equations contain only $x$ and $z$." },
      { type: "num", kicker: "Use it", prompt: "In a triangle the second angle is **20° more than** the first, and the third is **twice** the first. The three add to 180°. Find the **first** angle.",
        post: "°", answer: 40, skill: "Three-variable applications",
        near: [{ v: 80, fb: "That is the third angle." }, { v: 60, fb: "That is the second angle." }],
        hints: ["$x + (x + 20) + 2x = 180$."], why: "$4x + 20 = 180$, so $x = 40$. The angles are 40°, 60° and 80°." }
    ]
  });

  /* =================== 4.5 · Solve systems of equations using matrices */
  var HOW_4_5 = [["Matrix", "Write the augmented matrix: the coefficients, a bar, and the constants."],
                 ["Leading 1", "Use row operations to get a 1 in row 1, column 1."],
                 ["Zero below", "Use row operations to get a 0 below that 1."],
                 ["Next 1", "Get a 1 in row 2, column 2. The matrix is now in row-echelon form."],
                 ["Back", "Write the system the matrix stands for, and substitute back."]];
  LESSONS.push({
    title: "Solve systems using matrices",
    blurb: "Book 4.5 · The augmented matrix, the three row operations, and row-echelon form.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Each row of an **augmented matrix** is one equation: its coefficients, then its constant. Which system is this?" + mat([[2, 3, 7], [1, -1, 1]]),
        options: [{ t: two("2x + 3y = 7", "x - y = 1") }, { t: two("2x + y = 7", "3x - y = 1"), fb: "Read across each **row**, not down each column." }, { t: two("2x + 3y + 7 = 0", "x - y + 1 = 0"), fb: "The numbers after the bar are the constants on the right side." }],
        answer: 0, skill: "Augmented matrix", hints: ["The first row is 2, 3, then 7 after the bar."], why: "Row 1: $2x + 3y = 7$. Row 2: $x - y = 1$." },
      { type: "learn", kicker: "The idea",
        prompt: "A matrix holds a system without the letters. Three **row operations** change the matrix but not the solution: swap two rows, multiply a row by a non-zero number, or add a multiple of one row to another.",
        scene: { type: "method", how: HOW_4_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a system solved with a matrix." + sys("x + 2y = 7", "3x - y = 7"),
        scene: { type: "walk", how: HOW_4_5, rows: [
          { step: 1, m: "x + 2y = 7 \\quad 3x - y = 7", say: "Write the coefficients and the constants as a matrix.", fig: mat([[1, 2, 7], [3, -1, 7]]) },
          { step: 2, m: "\\text{row 1 starts with } 1", say: "The entry in row 1, column 1 is already 1." },
          { step: 3, m: "-3R_1 + R_2 \\to R_2", say: "Add $-3$ times row 1 to row 2: $3 - 3 = 0$, $-1 - 6 = -7$, $7 - 21 = -14$.", fig: mat([[1, 2, 7], [0, -7, -14]], { hot: 1 }),
            ask: { prompt: "To turn the 3 in row 2 into 0, what multiple of row 1 is added to row 2?", answer: 0,
                   options: [{ t: "$-3$ times row 1" }, { t: "$3$ times row 1", fb: "$3 + 3 = 6$, not 0." }, { t: "$-1$ times row 1", fb: "$3 - 1 = 2$, not 0." }] } },
          { step: 4, m: "-\\frac{1}{7}R_2 \\to R_2", say: "Multiply row 2 by $-\\frac{1}{7}$ to put a 1 on the diagonal.", fig: mat([[1, 2, 7], [0, 1, 2]], { hot: 1 }) },
          { step: 5, m: "x + 2y = 7 \\quad y = 2", say: "Read the rows as equations again." },
          { step: 5, m: "x = 3 \\quad y = 2", say: "Substitute $y = 2$: $x + 4 = 7$. The solution is $(3, 2)$." }] },
        gate: true, then: "The row operations are elimination, written without the letters." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step." + sys("2x + 4y = 10", "3x + y = 5"),
        how: HOW_4_5, skill: "Row operations",
        steps: [
          { step: 1, ask: "Write the augmented matrix. What is row 1?", type: "choice", answer: 0,
            options: [{ t: "$" + rowsTex([[2, 4, 10]]) + "$" }, { t: "$" + rowsTex([[2, 3, 10]]) + "$", fb: "A row is one equation: its two coefficients, then its constant." }],
            m: rowsTex([[2, 4, 10], [3, 1, 5]]), say: "Row 1, then row 2." },
          { step: 2, ask: "Row 1 must start with 1. Which row operation does that?", type: "choice", answer: 0,
            options: [{ t: "Multiply row 1 by $\\frac{1}{2}$" }, { t: "Subtract 1 from the first entry", fb: "A row operation acts on a whole row. Changing one entry changes the system." }, { t: "Swap the rows", fb: "Row 2 starts with 3, so that does not help." }],
            m: rowsTex([[1, 2, 5], [3, 1, 5]]), say: "Every entry of row 1 is halved." },
          { step: 3, ask: "Get 0 below the 1: add $-3$ times row 1 to row 2. What is the new row 2?", type: "choice", answer: 0,
            options: [{ t: "$" + rowsTex([[0, -5, -10]]) + "$" }, { t: "$" + rowsTex([[0, 1, 5]]) + "$", fb: "Every entry changes: $1 - 6 = -5$ and $5 - 15 = -10$." }, { t: "$" + rowsTex([[0, 7, 20]]) + "$", fb: "$-3$ times row 1 is added: $1 + (-6)$ and $5 + (-15)$." }],
            m: rowsTex([[1, 2, 5], [0, -5, -10]]), say: "$3 - 3 = 0$, $1 - 6 = -5$, $5 - 15 = -10$." },
          { step: 4, ask: "Get a 1 in row 2, column 2.", type: "choice", answer: 0,
            options: [{ t: "Multiply row 2 by $-\\frac{1}{5}$" }, { t: "Multiply row 2 by 5", fb: "That gives $-25$. Divide by $-5$ instead." }],
            m: rowsTex([[1, 2, 5], [0, 1, 2]]), say: "Row-echelon form: 1s on the diagonal, 0 below." },
          { step: 5, ask: "The rows now say $x + 2y = 5$ and $y = 2$. What is $x$?", type: "num", pre: "$x =$", answer: 1, near: [{ v: 5, fb: "Use $y = 2$: $x + 4 = 5$." }], hint: "$x + 2(2) = 5$.",
            m: "x = 1 \\quad y = 2", say: "The solution is $(1, 2)$." }],
        why: "Matrix, leading 1, zero below, next 1, back. Now read one on your own." },
      { type: "num", kicker: "On your own", prompt: "This matrix is in row-echelon form. Find $x$." + mat([[1, 3, 9], [0, 1, 2]]),
        pre: "$x =$", answer: 3, skill: "Row-echelon form",
        near: [{ v: 9, fb: "Row 1 says $x + 3y = 9$. Use $y = 2$ from row 2." }, { v: 2, fb: "That is $y$." }],
        hints: ["Row 2 gives $y = 2$. Row 1 says $x + 3y = 9$."], why: "$x + 3(2) = 9$, so $x = 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Three equations work the same way: 1s down the diagonal, 0s below them. Then substitute back, from the bottom row up.",
        scene: { type: "walk", how: HOW_4_5, rows: [
          { step: 4, m: "\\text{row-echelon form}", say: "This matrix is already there.", fig: mat([[1, 1, 1, 6], [0, 1, 2, 8], [0, 0, 1, 3]]) },
          { step: 5, m: "z = 3", say: "The bottom row says $z = 3$." },
          { step: 5, m: "y + 2(3) = 8 \\quad y = 2", say: "The middle row says $y + 2z = 8$." },
          { step: 5, m: "x + 2 + 3 = 6 \\quad x = 1", say: "The top row says $x + y + z = 6$. The solution is $(1, 2, 3)$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which of these is **not** a row operation?",
        options: [{ t: "Add 5 to every entry of a row" }, { t: "Swap two rows", fb: "Allowed: it only changes the order of the equations." }, { t: "Multiply a row by $-2$", fb: "Allowed: it multiplies both sides of one equation." }, { t: "Add 3 times row 1 to row 2", fb: "Allowed: it is what elimination does." }],
        answer: 0, skill: "Row operations", hints: ["Which one would change an equation's solutions?"], why: "Adding a number to every entry is not something you may do to an equation." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Leo adds $-2R_1$ to $R_2$, where row 1 is $" + rowsTex([[1, 3, 4]]) + "$ and row 2 is $" + rowsTex([[2, 5, 7]]) + "$. Tap the line where the work **first** goes wrong.",
        lines: ["-2R_1: \\quad " + rowsTex([[-2, -6, -8]]), "R_2: \\quad " + rowsTex([[2, 5, 7]]), "-2R_1 + R_2: \\quad " + rowsTex([[0, -1, 7]])], answer: 2, fix: "-2R_1 + R_2: \\quad " + rowsTex([[0, -1, -1]]),
        fb: { 0: "$-2$ times each entry of row 1: right.", 1: "Row 2 as given." }, skill: "Row operations",
        hints: ["A row operation changes every entry of the row, the constant too."],
        why: "The constant changes as well: $-8 + 7 = -1$." },
      { type: "pair", kicker: "Use it", prompt: "A system's matrix has been reduced as far as it will go. What is the solution $(x, y)$?" + mat([[1, 0, 4], [0, 1, -3]]),
        answer: [4, -3], skill: "Row-echelon form",
        near: [{ v: [-3, 4], fb: "Row 1 is $x = 4$. Row 2 is $y = -3$." }],
        hints: ["Row 1 says $1x + 0y = 4$."], why: "$x = 4$ and $y = -3$." }
    ]
  });

  /* =============== 4.6 · Solve systems of equations using determinants */
  var HOW_4_6 = [["D", "Evaluate the determinant $D$ of the coefficients."],
                 ["Dx", "Replace the $x$ column with the constants and evaluate $D_x$."],
                 ["Dy", "Replace the $y$ column with the constants and evaluate $D_y$."],
                 ["Divide", "$x = \\frac{D_x}{D}$ and $y = \\frac{D_y}{D}$."],
                 ["Check", "Check the pair in both equations."]];
  var HOW_4_6B = [["Minors", "For each entry of the top row, cross out its row and column. The 2 × 2 determinant that is left is its minor."],
                  ["Signs", "Attach the signs $+$, $-$, $+$ across the top row."],
                  ["Combine", "Multiply each entry by its minor, and add."]];
  LESSONS.push({
    title: "Determinants and Cramer's Rule",
    blurb: "Book 4.6 · The determinant of a 2 × 2 and a 3 × 3 matrix, and solving a system with three determinants.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "Simplify $4(3) - 2(-5)$.", answer: 22, skill: "Integer arithmetic",
        near: [{ v: 2, fb: "$2(-5) = -10$, and subtracting $-10$ adds 10." }], hints: ["$12 - (-10)$."], why: "$12 + 10 = 22$." },
      { type: "learn", kicker: "The idea",
        prompt: "The **determinant** of a 2 × 2 matrix is one number: the product down the main diagonal minus the product up the other diagonal, $ad - bc$. **Cramer's Rule** solves a system with three of them." + mat([["a", "b"], ["c", "d"]], { det: true, alt: "The determinant with rows a, b and c, d." }),
        scene: { type: "method", how: HOW_4_6 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch Cramer's Rule." + sys("2x + y = 5", "3x - 2y = 4"),
        scene: { type: "walk", how: HOW_4_6, rows: [
          { step: 1, m: "D = 2(-2) - 1(3) = -7", say: "The coefficients: down-diagonal product minus up-diagonal product.", fig: mat([[2, 1], [3, -2]], { det: true }) },
          { step: 2, m: "D_x = 5(-2) - 1(4) = -14", say: "Replace the $x$ column, 2 and 3, with the constants 5 and 4.", fig: mat([[5, 1], [4, -2]], { det: true }),
            ask: { prompt: "For $D_x$, which column is replaced by the constants?", answer: 0,
                   options: [{ t: "The $x$ column" }, { t: "The $y$ column", fb: "Replacing the $y$ column gives $D_y$." }] } },
          { step: 3, m: "D_y = 2(4) - 5(3) = -7", say: "Replace the $y$ column with the constants.", fig: mat([[2, 5], [3, 4]], { det: true }) },
          { step: 4, m: "x = \\frac{-14}{-7} = 2 \\quad y = \\frac{-7}{-7} = 1", say: "Divide each by $D$." },
          { step: 5, m: "2(2) + 1 = 5 \\quad 3(2) - 2(1) = 4", say: "$(2, 1)$ checks in both equations. ✓" }] },
        gate: true, then: "Three determinants and two divisions: no elimination at all." },
      { type: "guided", kicker: "Together",
        prompt: "Now you do each step." + sys("x + 2y = 4", "3x + y = 7"),
        how: HOW_4_6, skill: "Cramer's Rule",
        steps: [
          { step: 1, ask: "$D$ has rows $1, 2$ and $3, 1$. What is $1(1) - 2(3)$?", type: "num", pre: "$D =$", answer: -5, near: [{ v: 7, fb: "Subtract the second product: $1 - 6$." }, { v: 5, fb: "$1 - 6$ is negative." }], hint: "$1 - 6$.",
            m: "D = 1(1) - 2(3) = -5", say: "The determinant of the coefficients." },
          { step: 2, ask: "For $D_x$ the first column becomes the constants: rows $4, 2$ and $7, 1$. What is $4(1) - 2(7)$?", type: "num", pre: "$D_x =$", answer: -10, near: [{ v: 18, fb: "Subtract: $4 - 14$." }], hint: "$4 - 14$.",
            m: "D_x = 4(1) - 2(7) = -10", say: "Constants in the $x$ column." },
          { step: 3, ask: "For $D_y$ the second column becomes the constants: rows $1, 4$ and $3, 7$. What is $1(7) - 4(3)$?", type: "num", pre: "$D_y =$", answer: -5, near: [{ v: 19, fb: "Subtract: $7 - 12$." }], hint: "$7 - 12$.",
            m: "D_y = 1(7) - 4(3) = -5", say: "Constants in the $y$ column." },
          { step: 4, ask: "$x = \\frac{D_x}{D}$. What is $\\frac{-10}{-5}$?", type: "num", pre: "$x =$", answer: 2, near: [{ v: -2, fb: "A negative divided by a negative is positive." }], hint: "$-10 \\div -5$.",
            m: "x = 2 \\quad y = 1", say: "And $y = \\frac{-5}{-5} = 1$." },
          { step: 5, ask: "Check $(2, 1)$ in $3x + y = 7$.", type: "choice", answer: 0,
            options: [{ t: "$6 + 1 = 7$: true" }, { t: "It is false", fb: "$3(2) + 1 = 7$." }],
            m: "3(2) + 1 = 7", say: "And $2 + 2(1) = 4$. ✓" }],
        why: "$D$, $D_x$, $D_y$, divide, check. Now a determinant on your own." },
      { type: "num", kicker: "On your own", prompt: "Evaluate the determinant." + mat([[4, -2], [3, 5]], { det: true }),
        answer: 26, skill: "Evaluate a determinant",
        near: [{ v: 14, fb: "$(-2)(3) = -6$, and subtracting $-6$ adds 6." }, { v: -26, fb: "Down the main diagonal first: $4 \\cdot 5$." }],
        hints: ["$4(5) - (-2)(3)$."], why: "$20 - (-6) = 26$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A 3 × 3 determinant is built from 2 × 2 ones: **expand by minors** along the top row.",
        scene: { type: "walk", how: HOW_4_6B, rows: [
          { step: 1, m: "\\text{minor of } 1: \\quad 1(1) - 2(4) = -7", say: "Cross out row 1 and column 1. What is left has rows $1, 2$ and $4, 1$.", fig: mat([[1, 2, 0], [3, 1, 2], [0, 4, 1]], { det: true }) },
          { step: 1, m: "\\text{minor of } 2: \\quad 3(1) - 2(0) = 3", say: "Cross out row 1 and column 2. What is left has rows $3, 2$ and $0, 1$." },
          { step: 1, m: "\\text{minor of } 0: \\quad 3(4) - 1(0) = 12", say: "Cross out row 1 and column 3. What is left has rows $3, 1$ and $0, 4$." },
          { step: 2, m: "+1 \\quad -2 \\quad +0", say: "The signs alternate across the row: plus, minus, plus." },
          { step: 3, m: "1(-7) - 2(3) + 0(12) = -13", say: "Each entry times its minor, added up." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "For a system, $D$ comes out as 0. What does that tell you?",
        options: [{ t: "Cramer's Rule cannot be used: the system has no solution or infinitely many" }, { t: "$x = 0$ and $y = 0$", fb: "$x = \\frac{D_x}{D}$ would divide by 0, which is undefined." }, { t: "The system has exactly one solution", fb: "One solution needs $D \\ne 0$." }],
        answer: 0, skill: "Cramer's Rule", hints: ["What happens to $\\frac{D_x}{D}$?"], why: "Division by 0 is undefined. $D = 0$ means the lines are parallel or the same." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kim evaluates the determinant with rows $3, -2$ and $4, 5$. Tap the line where the work **first** goes wrong.",
        lines: ["3(5) - (-2)(4)", "15 - 8", "7"], answer: 1, fix: "15 + 8",
        fb: { 0: "The setup is right: $ad - bc$.", 2: LATER }, skill: "Evaluate a determinant",
        hints: ["What is $(-2)(4)$, and what happens when it is subtracted?"],
        why: "$(-2)(4) = -8$, and subtracting $-8$ adds 8: the determinant is 23." },
      { type: "pair", kicker: "Use it", prompt: "Use Cramer's Rule. Type the solution as $(x, y)$." + sys("x + y = 5", "2x - y = 4"),
        answer: [3, 2], skill: "Cramer's Rule",
        near: [{ v: [2, 3], fb: "$x = \\frac{D_x}{D} = \\frac{-9}{-3}$ and $y = \\frac{D_y}{D} = \\frac{-6}{-3}$." }],
        hints: ["$D = 1(-1) - 1(2) = -3$. $D_x = 5(-1) - 1(4) = -9$. $D_y = 1(4) - 5(2) = -6$."], why: "$x = \\frac{-9}{-3} = 3$ and $y = \\frac{-6}{-3} = 2$." }
    ]
  });

  /* ==================== 4.7 · Graphing systems of linear inequalities */
  var HOW_4_7 = [["First", "Graph the first inequality: boundary, test point, shade."],
                 ["Second", "Graph the second inequality on the same grid."],
                 ["Overlap", "The solution is the region where the two shadings overlap."],
                 ["Check", "Check with a test point from the overlap."]];
  var W47 = { x: [-5, 5], y: [-5, 5] };
  var A47 = { poly: [[-5, -4], [4, 5], [5, 5], [5, -5], [-5, -5]], c: "blue" }, LA47 = { line: [[0, 1], [1, 2]], c: "blue" };
  var B47 = { poly: [[-4, 5], [5, -4], [5, 5]], c: "green" }, LB47 = { line: [[0, 1], [1, 0]], c: "green", dash: true };
  var C47 = { poly: [[-5, -3], [3, 5], [-5, 5]], c: "blue" }, LC47 = { line: [[0, 2], [1, 3]], c: "blue", dash: true };
  var D47 = { poly: [[-4, -5], [5, 4], [5, -5]], c: "green" }, LD47 = { line: [[1, 0], [2, 1]], c: "green", dash: true };
  LESSONS.push({
    title: "Systems of linear inequalities",
    blurb: "Book 4.7 · Two half-planes on one grid, and the region where they overlap.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Is $(2, 1)$ a solution of **both** $y < x + 1$ and $y \\ge -x + 2$?",
        options: [{ t: "Yes: $1 < 3$ and $1 \\ge 0$" }, { t: "No: it fails the first", fb: "$1 < 2 + 1$ is true." }, { t: "No: it fails the second", fb: "$-2 + 2 = 0$, and $1 \\ge 0$ is true." }],
        answer: 0, skill: "Check a solution", hints: ["Substitute $x = 2$ and $y = 1$ into each."], why: "Both inequalities are true at $(2, 1)$." },
      { type: "learn", kicker: "The idea",
        prompt: "A solution of a system of inequalities must make **every** inequality true. Graph each one as a shaded half-plane on the same grid. The solutions are the points shaded by all of them at once.",
        scene: { type: "method", how: HOW_4_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a system graphed." + sys("y \\le x + 1", "y > -x + 1"),
        scene: { type: "walk", how: HOW_4_7, rows: [
          { step: 1, m: "y \\le x + 1", say: "A solid boundary. $(0, 0)$ passes the test, $0 \\le 1$, so its side is shaded: below.", fig: grid("The half-plane below the solid line y = x + 1 is shaded.", [A47, LA47], W47) },
          { step: 2, m: "y > -x + 1", say: "A dashed boundary. $(0, 0)$ fails, since $0 > 1$ is false, so the other side is shaded: above.", fig: grid("Two shaded half-planes: below the solid line y = x + 1, and above the dashed line y = −x + 1.", [A47, B47, LA47, LB47], W47) },
          { step: 3, m: "\\text{the overlap}", say: "Where both shadings cover the grid, both inequalities are true.", fig: grid("Only the overlap is shaded: the wedge to the right of the point (0, 1), between the two lines.", [{ poly: [[0, 1], [4, 5], [5, 5], [5, -4]], c: "purple" }, LA47, LB47, { pt: [3, 1], name: "(3, 1)", at: "e", c: "orange" }], W47),
            ask: { prompt: "Where are the solutions of the system?", answer: 0,
                   options: [{ t: "Where the two shadings overlap" }, { t: "Everywhere that is shaded at all", fb: "A point shaded only once makes just one inequality true." }] } },
          { step: 4, m: "(3, 1): \\quad 1 \\le 4 \\quad 1 > -2", say: "A point in the overlap makes both true. ✓" }] },
        gate: true, then: "The overlap is the solution set: every point in it works." },
      { type: "guided", kicker: "Together",
        prompt: "Now you decide each step." + sys("y \\ge 2x - 3", "y < 2"),
        how: HOW_4_7, skill: "Systems of inequalities",
        steps: [
          { step: 1, ask: "Graph $y \\ge 2x - 3$. How is it drawn?", type: "choice", answer: 0,
            options: [{ t: "A solid line, shaded on the side containing $(0, 0)$" }, { t: "A dashed line, shaded on the side containing $(0, 0)$", fb: "$\\ge$ includes the boundary: solid." }, { t: "A solid line, shaded away from $(0, 0)$", fb: "Test it: $0 \\ge -3$ is true, so the origin's side is shaded." }],
            m: "y \\ge 2x - 3 \\quad\\text{solid}", say: "$0 \\ge -3$ is true." },
          { step: 2, ask: "Graph $y < 2$. How is it drawn?", type: "choice", answer: 0,
            options: [{ t: "A dashed horizontal line at height 2, shaded below" }, { t: "A dashed vertical line at $x = 2$, shaded left", fb: "$y = 2$ is horizontal: every point on it has height 2." }, { t: "A solid horizontal line at height 2, shaded below", fb: "$<$ leaves the boundary out: dashed." }],
            m: "y < 2 \\quad\\text{dashed}", say: "Every point lower than 2." },
          { step: 3, ask: "Which point is in the overlap?", type: "choice", answer: 0,
            options: [{ t: "$(0, 0)$" }, { t: "$(0, 3)$", fb: "$3 < 2$ is false." }, { t: "$(4, 0)$", fb: "$0 \\ge 2(4) - 3$ is false." }],
            m: "(0, 0)", say: "It lies in both shaded regions." },
          { step: 4, ask: "Check $(0, 0)$ in both inequalities.", type: "choice", answer: 0,
            options: [{ t: "$0 \\ge -3$ and $0 < 2$: both true" }, { t: "One of them is false", fb: "$0 \\ge -3$ is true, and so is $0 < 2$." }],
            m: "0 \\ge -3 \\quad 0 < 2", say: "A solution of the system. ✓" }],
        why: "First, second, overlap, check. Now find a solution on the grid yourself." },
      { type: "plane", kicker: "On your own", prompt: "**Click a point** that makes both $y < x + 2$ and $y \\ge -2x + 1$ true.",
        x: [-5, 5], y: [-5, 5], click: "point", answer: { point: [2, 1] }, skill: "Systems of inequalities",
        fns: [{ f: "x + 2", color: "green", shade: "below", strict: true }, { f: "-2*x + 1", color: "blue", shade: "above" }],
        check: function (st) { var c = st.clicked; if (!c) return { ok: false }; var a = c[1] < c[0] + 2, b = c[1] >= -2 * c[0] + 1; return a && b ? { ok: true } : { ok: false, say: !a && !b ? "Neither inequality is true there." : !a ? "That breaks $y < x + 2$." : "That breaks $y \\ge -2x + 1$." }; },
        hints: ["Look for where the two shadings overlap."], why: "Any point in the overlap works, such as $(2, 1)$: $1 < 4$ and $1 \\ge -3$." },
      { type: "sort", prompt: "System: $x + y \\le 6$ and $y \\ge 2$. Sort the points.",
        bins: ["Solution", "Not a solution"],
        cards: [{ t: "$(1, 3)$", bin: 0, fb: "$4 \\le 6$ and $3 \\ge 2$." },
                { t: "$(5, 2)$", bin: 1, fb: "$5 + 2 = 7$, which is more than 6." },
                { t: "$(0, 0)$", bin: 1, fb: "$0 \\ge 2$ is false." },
                { t: "$(2, 4)$", bin: 0, fb: "$6 \\le 6$ and $4 \\ge 2$: on a solid boundary, so included." },
                { t: "$(4, 1)$", bin: 1, fb: "$1 \\ge 2$ is false." }],
        skill: "Systems of inequalities", hints: ["A solution must pass both tests."],
        why: "Only $(1, 3)$ and $(2, 4)$ make both inequalities true." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes the shadings never meet." + sys("y > x + 2", "y < x - 1"),
        scene: { type: "walk", how: HOW_4_7, rows: [
          { step: 1, m: "y > x + 2", say: "Dashed boundary, shaded above.", fig: grid("The half-plane above the dashed line y = x + 2 is shaded.", [C47, LC47], W47) },
          { step: 2, m: "y < x - 1", say: "Dashed boundary, shaded below.", fig: grid("Two shaded half-planes that do not meet: above y = x + 2 and below y = x − 1, with an unshaded band between the parallel lines.", [C47, D47, LC47, LD47], W47) },
          { step: 3, m: "\\text{no overlap}", say: "The boundaries are parallel, and the shadings face away from each other. The system has **no solution**." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "System: $x \\ge 0$, $y \\ge 0$ and $x + y \\le 4$. Which point is a solution?",
        options: [{ t: "$(1, 2)$" }, { t: "$(-1, 3)$", fb: "$x \\ge 0$ fails: $-1$ is negative." }, { t: "$(3, 3)$", fb: "$3 + 3 = 6$, which is more than 4." }],
        answer: 0, skill: "Systems of inequalities", hints: ["All three inequalities must hold."], why: "$1 \\ge 0$, $2 \\ge 0$ and $1 + 2 \\le 4$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For the system $y \\le x$ and $y \\ge -x$, Kim says $(0, 5)$ is a solution because it lies in the shading of $y \\ge -x$. What is wrong?",
        options: [{ t: "It must lie in **both** shadings. $5 \\le 0$ is false." },
                  { t: "$(0, 5)$ is not in the shading of $y \\ge -x$.", fb: "It is: $5 \\ge 0$ is true. The trouble is the other inequality." },
                  { t: "Nothing. One shading is enough.", fb: "A system needs every inequality to be true at once." }],
        answer: 0, skill: "Systems of inequalities", hints: ["Step 3: where are the solutions?"], why: "A solution lies in the overlap. $(0, 5)$ fails $y \\le x$." },
      { type: "choice", kicker: "Use it", prompt: "You can work **at most 10 hours**: $x$ hours tutoring at \\$12 and $y$ hours babysitting at \\$8. You want **at least \\$90**: $x + y \\le 10$ and $12x + 8y \\ge 90$. Which plan works?",
        options: [{ t: "6 hours tutoring, 3 babysitting" }, { t: "4 hours tutoring, 5 babysitting", fb: "$48 + 40 = 88$: just short of \\$90." }, { t: "8 hours tutoring, 4 babysitting", fb: "That is 12 hours: more than the 10 you have." }],
        answer: 0, skill: "Systems of inequalities", hints: ["Test each plan in both inequalities."], why: "$6 + 3 = 9 \\le 10$, and $72 + 24 = 96 \\ge 90$." }
    ]
  });
  /* ================================================================ Skills */
  var SKILLS = [
    { id: "a2u4-system", title: "Solve a system of two equations", lesson: 2,
      gen: function (R) {
        var x0 = R.nz(-5, 5), y0 = R.nz(-5, 5), a = R.int(1, 3), b = R.pick([1, -1, 2]), d = R.pick([1, 2, 3, -1]), e = R.pick([1, -1, -2, 3]);
        if (a * e - b * d === 0) e += 1;
        if (e === 0) e = 4;
        var e1 = poly([[a, "x"], [b, "y"]]) + " = " + (a * x0 + b * y0), e2 = poly([[d, "x"], [e, "y"]]) + " = " + (d * x0 + e * y0);
        return { type: "pair", prompt: "Solve the system. Type the solution as $(x, y)$." + sys(e1, e2), answer: [x0, y0],
          near: x0 !== y0 ? [{ v: [y0, x0], fb: "Those are the right numbers in the wrong order: $x$ comes first." }] : [],
          hints: ["Make one variable's coefficients opposites, add, then substitute back."],
          why: "$x = " + x0 + "$ and $y = " + y0 + "$ make both equations true: $" + (a * x0 + b * y0) + "$ and $" + (d * x0 + e * y0) + "$." };
      } },
    { id: "a2u4-count", title: "How many solutions?", lesson: 2,
      gen: function (R) {
        var m = R.nz(-3, 3), b = R.int(-4, 4), kind = R.int(0, 2), k = R.pick([2, 3]);
        var first = "y = " + poly([[m, "x"], [b, ""]]);
        var second = kind === 0 ? "y = " + poly([[m, "x"], [b + R.nz(-3, 3), ""]]) : kind === 1 ? k + "y = " + poly([[k * m, "x"], [k * b, ""]], { keepZero: false }) : "y = " + poly([[m + R.pick([1, 2, -1]), "x"], [b, ""]]);
        if (kind === 2 && second === first) second = "y = " + poly([[m + 3, "x"], [b, ""]]);
        var right = ["No solution", "Infinitely many solutions", "Exactly one solution"][kind];
        var why = kind === 0 ? "The slopes are equal and the intercepts differ: parallel lines." : kind === 1 ? "Divide the second equation by " + k + ": it is the same line as the first." : "The slopes are different, so the lines cross once.";
        return mc(R, { prompt: "How many solutions does this system have?" + sys(first, second), right: right,
          wrong: ["No solution", "Infinitely many solutions", "Exactly one solution"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: why }; }), keep: true,
          hints: ["Write both in the form $y = mx + b$ and compare slopes and intercepts."], why: why });
      } },
    { id: "a2u4-apps", title: "Solve an application with a system", lesson: 3,
      gen: function (R) {
        var big2 = R.int(12, 40), small = R.int(3, big2 - 2), sum = big2 + small, diff = big2 - small, askBig = R.chance(0.5), ans = askBig ? big2 : small;
        return { type: "num", prompt: "The sum of two numbers is $" + sum + "$ and their difference is $" + diff + "$. Find the **" + (askBig ? "larger" : "smaller") + "** number.", answer: ans,
          near: near(ans, [{ v: askBig ? small : big2, fb: "That is the other number. The question asks for the " + (askBig ? "larger" : "smaller") + " one." }, { v: sum / 2, tol: 1e-9, fb: "Halving the sum gives the number midway between them. Use both facts." }]),
          hints: ["$x + y = " + sum + "$ and $x - y = " + diff + "$. Add the equations."],
          why: "Adding gives $2x = " + (sum + diff) + "$, so $x = " + big2 + "$ and $y = " + small + "$." };
      } },
    { id: "a2u4-mixture", title: "Solve an interest problem with a system", lesson: 4,
      gen: function (R) {
        var x = R.int(2, 9) * 500, y = R.int(2, 9) * 500, P = R.pick([[2, 5], [3, 6], [4, 7], [3, 5], [2, 6]]), I = (P[0] * x + P[1] * y) / 100;
        return { type: "num", prompt: "\\$" + (x + y).toLocaleString("en-US") + " is invested, part at " + P[0] + "% and the rest at " + P[1] + "%. The interest for one year is \\$" + I.toLocaleString("en-US") + ". How much is invested at **" + P[1] + "%**?", pre: "$\\$$", answer: y,
          near: near(y, [big(y), { v: x, fb: "That is the amount at " + P[0] + "%." }]),
          hints: ["$x + y = " + (x + y) + "$ and $" + num(P[0] / 100) + "x + " + num(P[1] / 100) + "y = " + I + "$."],
          why: "$" + num(P[0] / 100) + "(" + x + ") + " + num(P[1] / 100) + "(" + y + ") = " + I + "$." };
      } },
    { id: "a2u4-three", title: "Solve a system of three equations", lesson: 5,
      gen: function (R) {
        var x = R.int(-4, 5), y = R.int(-4, 5), z = R.int(-4, 5), v = R.pick(["x", "y", "z"]), ans = { x: x, y: y, z: z }[v];
        return { type: "num", prompt: "Solve the system, and give $" + v + "$." + sys("x + y + z = " + (x + y + z), "x - y + z = " + (x - y + z)) + "$$x + y - z = " + (x + y - z) + "$$", pre: "$" + v + " =$", answer: ans,
          hints: ["First minus second leaves only $y$. First minus third leaves only $z$."],
          why: "First minus second: $2y = " + 2 * y + "$. First minus third: $2z = " + 2 * z + "$. So $(x, y, z) = (" + x + ", " + y + ", " + z + ")$." };
      } },
    { id: "a2u4-det", title: "Evaluate a determinant", lesson: 7,
      gen: function (R) {
        var a = R.nz(-6, 6), b = R.nz(-6, 6), c = R.nz(-6, 6), d = R.nz(-6, 6), ans = a * d - b * c;
        var P = function (v) { return v < 0 ? "(" + v + ")" : String(v); };
        return { type: "num", prompt: "Evaluate the determinant." + mat([[a, b], [c, d]], { det: true }), answer: ans,
          near: near(ans, [{ v: a * d + b * c, fb: "Subtract the second product: $ad - bc$." }, { v: a * b - c * d, fb: "Multiply along the diagonals: $" + P(a) + " \\cdot " + P(d) + "$ and $" + P(b) + " \\cdot " + P(c) + "$." }]),
          hints: ["$ad - bc$: down the main diagonal, minus up the other."], why: "$" + P(a) + P(d) + " - " + P(b) + P(c) + " = " + a * d + " - " + P(b * c) + " = " + ans + "$." };
      } },
    { id: "a2u4-ineqsys", title: "Test a point in a system of inequalities", lesson: 8,
      gen: function (R) {
        var m = R.pick([1, 2, -1]), b = R.int(-2, 3), k = R.int(-1, 4), p = R.int(-3, 4), q = R.int(-3, 5);
        var a = q <= m * p + b, c = q > k, ok = a && c;
        var why = "$" + q + " \\le " + (m * p + b) + "$ is " + (a ? "true" : "false") + ", and $" + q + " > " + k + "$ is " + (c ? "true" : "false") + ".";
        return mc(R, { prompt: "Is $(" + p + ", " + q + ")$ a solution of this system?" + sys("y \\le " + poly([[m, "x"], [b, ""]]), "y > " + k), right: ok ? "Yes" : "No",
          wrong: [{ t: ok ? "No" : "Yes", fb: why + (ok ? "" : " A solution must make both true.") }], keep: true,
          hints: ["Substitute the point into each inequality."], why: why });
      } }
  ];
  L.unit("alg2", 4, {
    title: "Systems of Linear Equations",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Systems of two equations, how many solutions they have, and applications.",
        skills: ["a2u4-system", "a2u4-count", "a2u4-apps", "a2u4-mixture"], per: 2 },
      { title: "Quiz 2", after: 8, blurb: "Three variables, determinants, and systems of inequalities.",
        skills: ["a2u4-three", "a2u4-det", "a2u4-ineqsys"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:4", {
    2: { name: "Solving a system", frame: "A solution of a system makes [[both]] equations true. In elimination, make one variable's coefficients [[opposites]], then [[add]]. In substitution, [[replace]] a variable with an equal expression.",
         chips: ["one", "multiply"] },
    3: { name: "Applications with systems", frame: "Two unknowns need [[two]] variables and [[two]] equations. Each [[fact]] in the problem gives one equation. Check the answer against both facts.",
         chips: ["one", "guess"] },
    4: { name: "Mixtures with two variables", frame: "One equation adds the [[amounts]]. The other adds the [[values]]: amount times rate. A business breaks even when revenue equals [[cost]].",
         chips: ["profit", "differences"] },
    5: { name: "Three variables", frame: "Eliminate the [[same]] variable from two different [[pairs]] of equations. Solve the 2-by-2 system, then substitute back. The solution is an ordered [[triple]].",
         chips: ["different", "pair"], fb: { "different": "Eliminating different variables leaves all three still in play." } },
    6: { name: "Augmented matrix", frame: "Each [[row]] of an augmented matrix is one equation. Row operations: [[swap]] two rows, [[multiply]] a row by a non-zero number, or add a multiple of one row to another. Aim for 1s on the diagonal and [[zeros]] below.",
         chips: ["column", "ones"] },
    7: { name: "Determinants and Cramer's Rule", frame: "The determinant of the matrix with rows $a, b$ and $c, d$ is [[$ad - bc$]]. Cramer's Rule gives $x = $ [[$\\frac{D_x}{D}$]]. If $D = 0$ the rule [[cannot]] be used.",
         chips: ["$ab - cd$", "$\\frac{D}{D_x}$", "can always"] },
    8: { name: "System of inequalities", frame: "A solution of a system of inequalities makes [[every]] inequality true. On a graph it lies where the shadings [[overlap]]. Parallel boundaries shaded away from each other give [[no solution]].",
         chips: ["one", "touch"] }
  });
})();
