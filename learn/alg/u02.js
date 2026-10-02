/* ==========================================================================
   Algebra I — Unit 2: Linear inequalities and systems. See lab/core.js for
   the format.

   Follows OpenStax Algebra 1, Unit 2, lesson for lesson — 2.1 to 2.15 and
   Project 2 — so a teacher can teach from the book or from this. Written to
   the recipe in docs/OEDU_BRILLIANT_CONCEPT.md, and to five rules:

     1 Teach             every lesson names one idea, in one card, after it has been seen
     2 Learn by doing    a problem comes first; the explanation answers it
     3 Super interactive lines to drag, regions to probe, equations to combine
     4 Nothing clumsy    one thing per screen, and every wrong answer has its own reply
     5 Never too much    seven to nine short steps, about eight minutes

   The book's through-line is a business meeting its goals inside its
   constraints; so is the unit's. Systems first (two constraints that must
   both hold exactly), then inequalities (constraints with room in them),
   then systems of inequalities (the region where every constraint holds).

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   questions, figures, feedback and every step here are OEdu's own.

   (v: 20 on each lesson: the unit replaced the earlier "Solving equations &
   inequalities" on 2026-10-02, so that record does not carry over.)

   Sixteen lessons, thirteen skills, four quizzes, and the unit test.
   Standards: CCSS HSA.REI.C.5–6, HSA.REI.D.11–12, HSA.CED.A.1–3, HSA.REI.B.3.
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
  /* ============================================ 2.1 · Systems of equations */
  LESSONS.push({
    title: "Writing and graphing systems of equations",
    blurb: "Book 2.1 · Two constraints at once. The solution is the one pair that satisfies both.",
    mins: 8, v: 20,
    steps: [
      { type: "multi", kicker: "Try it",
        prompt: "A stall sells **apples** ($a$) and **bananas** ($b$). You take exactly **10 pieces** of fruit. Which baskets are possible?",
        options: [{ t: "4 apples, 6 bananas", ok: true },
                  { t: "7 apples, 3 bananas", ok: true },
                  { t: "5 apples, 4 bananas", fb: "$5 + 4 = 9$. One piece short." },
                  { t: "8 apples, 3 bananas", fb: "$8 + 3 = 11$. One too many." }],
        skill: "Systems of equations", hints: ["Add the two numbers. Do they make 10?"],
        why: "Any pair with $a + b = 10$ works. There are many." },
      { type: "multi",
        prompt: "Apples cost **\\$2** and bananas **\\$1**. You spend exactly **\\$14**. Which baskets cost \\$14?",
        options: [{ t: "4 apples, 6 bananas", ok: true },
                  { t: "5 apples, 4 bananas", ok: true },
                  { t: "7 apples, 3 bananas", fb: "$2(7) + 3 = 17$. Too much." },
                  { t: "2 apples, 8 bananas", fb: "$2(2) + 8 = 12$. Not enough." }],
        skill: "Systems of equations", hints: ["Cost is $2 \\times$ apples, plus bananas."],
        why: "Any pair with $2a + b = 14$ works. Only one basket was on *both* lists: 4 apples and 6 bananas." },
      { type: "plane", kicker: "See it",
        prompt: "Each constraint is a line of baskets $(a, b)$. Drag $P$ to the basket that **satisfies both**.",
        x: [0, 12], y: [0, 14], axisLabels: ["a", "b"],
        fns: [{ f: "10 - x", color: "blue", label: "a + b = 10", labelAt: 1.6 }, { f: "14 - 2*x", color: "green", label: "2a + b = 14", labelAt: 2.4 }],
        points: [{ id: "P", x: 8, y: 8, drag: true, label: "P" }],
        readout: function (st) { var p = st.pt("P"); return "Pieces: $" + num(p.x) + " + " + num(p.y) + " = " + num(p.x + p.y) + "$ &nbsp;·&nbsp; Cost: $2(" + num(p.x) + ") + " + num(p.y) + " = " + num(2 * p.x + p.y) + "$"; },
        check: function (st) { var p = st.pt("P"); return p.x === 4 && p.y === 6 ? { ok: true } : { ok: false, say: p.x + p.y === 10 ? "That's 10 pieces, but it costs \\$" + (2 * p.x + p.y) + ". Slide along the blue line." : 2 * p.x + p.y === 14 ? "That costs \\$14, but it's " + (p.x + p.y) + " pieces. Slide along the green line." : "That point is on neither line. Find where the two lines cross." }; },
        answer: { points: { P: [4, 6] } }, skill: "Systems of equations",
        hints: ["A basket that satisfies both constraints is on both lines."],
        why: "The lines cross at $(4, 6)$: $4 + 6 = 10$ and $2(4) + 6 = 14$." },
      { type: "learn", kicker: "Name it",
        prompt: "Two equations that must both be true at once are a **system of equations**:" + sys("a + b = 10", "2a + b = 14") + "A **solution of a system** is a pair of values that makes *every* equation true. On a graph, it is the point where the lines **cross**." },
      { type: "table", kicker: "Vary it",
        prompt: "A new system:" + sys("y = x + 1", "y = 7 - x") + "Fill in both rows of $y$ values. Watch for the $x$ where they agree.",
        head: ["$x$", "$y = x + 1$", "$y = 7 - x$"], rows: [[1, 2, 6], [2, null, null], [3, null, null], [4, null, null]],
        answers: [[1, 1, 3], [1, 2, 5], [2, 1, 4], [2, 2, 4], [3, 1, 5], [3, 2, 3]], skill: "Systems of equations",
        hints: ["Put each $x$ into both rules."], why: "At $x = 3$ both rules give $y = 4$. The solution is $(3, 4)$." },
      { type: "plane", prompt: "Here are those two lines. **Click the solution of the system.**",
        x: [-1, 8], y: [-1, 8], click: "point", answer: { point: [3, 4] }, skill: "Systems of equations",
        fns: [{ f: "x + 1", color: "blue" }, { f: "7 - x", color: "green" }],
        clickFb: function (c) { return "At $x = " + nm(c[0]) + "$ the blue line has $y = " + nm(c[0] + 1) + "$ and the green line has $y = " + nm(7 - c[0]) + "$. The solution is where they are equal."; },
        hints: ["The solution is on both lines at once."], why: "The lines cross at $(3, 4)$, the pair the table found." },
      { type: "choice", prompt: "Is $(2, 5)$ a solution of this system?" + sys("x + y = 7", "3x - y = 4"),
        options: [{ t: "No. It works in the first equation only." },
                  { t: "Yes. It works in both.", fb: "Try the second: $3(2) - 5 = 1$, not 4." },
                  { t: "No. It works in neither.", fb: "The first one is fine: $2 + 5 = 7$." }],
        answer: 0, skill: "Check a solution", hints: ["Put $x = 2$ and $y = 5$ into each equation."],
        why: "$2 + 5 = 7$ ✓ but $3(2) - 5 = 1 \\ne 4$. A solution of a system must work in *every* equation." },
      { type: "equation", kicker: "Use it",
        prompt: "A cinema sells **12 tickets** to a family: $x$ adult tickets and $y$ child tickets. Write the equation for the number of tickets.",
        answer: "x+y=12", shown: "x + y = 12", skill: "Write a system",
        near: [{ v: "xy=12", fb: "The tickets are counted together, so add them." }],
        hints: ["Adult tickets and child tickets together make 12."], why: "$x + y = 12$." },
      { type: "equation", prompt: "Adult tickets cost **\\$9** and child tickets **\\$6**. The family pays **\\$84**. Write the equation for the cost.",
        answer: "9x+6y=84", shown: "9x + 6y = 84", skill: "Write a system",
        near: [{ v: "6x+9y=84", fb: "Adults ($x$) pay \\$9 each; children ($y$) pay \\$6." }, { v: "x+y=84", fb: "Each ticket has a price. Multiply the tickets by their prices." }],
        hints: ["Price × tickets, for each kind, then add."],
        why: "$9x + 6y = 84$. Together with $x + y = 12$, that's a system. Its solution is 4 adults and 8 children: $4 + 8 = 12$ and $36 + 48 = 84$." }
    ]
  });

  /* ============================================ 2.2 · Writing systems */
  LESSONS.push({
    title: "Writing systems of equations",
    blurb: "Book 2.2 · From a table or a graph to a system, and what the crossing point means.",
    mins: 8, v: 20,
    steps: [
      { type: "table", kicker: "Try it",
        prompt: "Two seedlings. **Fern** is 1 cm tall and grows 2 cm a week. **Ivy** is 4 cm tall and grows 1 cm a week. Fill in their heights.",
        head: ["week $x$", "Fern (cm)", "Ivy (cm)"], rows: [[0, 1, 4], [1, null, null], [2, null, null], [4, null, null]],
        answers: [[1, 1, 3], [1, 2, 5], [2, 1, 5], [2, 2, 6], [3, 1, 9], [3, 2, 8]], skill: "Write a system",
        hints: ["Fern adds 2 every week. Ivy adds 1."], why: "Fern: 1, 3, 5, …, 9. Ivy: 4, 5, 6, …, 8. Fern starts behind and ends ahead." },
      { type: "equation", prompt: "Write an equation for **Fern's** height $y$ after $x$ weeks.",
        answer: "y=2x+1", shown: "y = 2x + 1", skill: "Write a system",
        near: [{ v: "y=x+2", fb: "The 2 is the growth *each week*, so it multiplies $x$. The 1 is the starting height." }, { v: "y=2x", fb: "Fern starts at 1 cm, not 0." }],
        hints: ["Start height, plus growth per week times weeks."], why: "$y = 2x + 1$: starts at 1, grows 2 a week." },
      { type: "equation", prompt: "And for **Ivy**?",
        answer: "y=x+4", shown: "y = x + 4", skill: "Write a system",
        near: [{ v: "y=4x+1", fb: "Ivy *starts* at 4 and grows 1 a week." }],
        hints: ["Ivy starts at 4 and adds 1 a week."], why: "$y = x + 4$." },
      { type: "plane", kicker: "See it",
        prompt: "Fern's line is drawn. **Graph Ivy's line**, $y = x + 4$. Drag $A$ and $B$ onto two of its points.",
        x: [0, 8], y: [0, 12], axisLabels: ["weeks", "cm"],
        fns: [{ f: "2*x + 1", color: "blue", label: "Fern", labelAt: 4.6 }],
        points: [{ id: "A", x: 1, y: 2, drag: true, label: "A" }, { id: "B", x: 5, y: 3, drag: true, label: "B" }],
        lines: [{ through: ["A", "B"], color: "green" }],
        check: function (st) { return onLine(st, "A", "B", 1, 4) ? { ok: true } : { ok: false, say: "Ivy is 4 cm at week 0, so the line starts at $(0, 4)$. Each week it goes up 1." }; },
        answer: { points: { A: [0, 4], B: [4, 8] } }, skill: "Graph a system",
        hints: ["Week 0: 4 cm. Week 1: 5 cm."], why: "$(0, 4)$ and $(4, 8)$ are both on $y = x + 4$." },
      { type: "plane", prompt: "**Click the point where the two plants are the same height.**",
        x: [0, 8], y: [0, 12], axisLabels: ["weeks", "cm"], click: "point", answer: { point: [3, 7] }, skill: "Graph a system",
        fns: [{ f: "2*x + 1", color: "blue", label: "Fern", labelAt: 4.6 }, { f: "x + 4", color: "green", label: "Ivy", labelAt: 6.5 }],
        clickFb: function (c) { return "At week " + nm(c[0]) + ", Fern is " + nm(2 * c[0] + 1) + " cm and Ivy is " + nm(c[0] + 4) + " cm."; },
        hints: ["Same height means the same point on both lines."], why: "The lines cross at $(3, 7)$." },
      { type: "choice", kicker: "Name it", prompt: "What does the solution $(3, 7)$ mean here?",
        options: [{ t: "After 3 weeks, both plants are 7 cm tall." },
                  { t: "Fern grows 3 cm a week and Ivy grows 7.", fb: "Growth per week is the slope of each line: 2 and 1." },
                  { t: "After 7 weeks, both plants are 3 cm tall.", fb: "$x$ is weeks and comes first: $(3, 7)$ is week 3, 7 cm." }],
        answer: 0, skill: "Interpret a solution", hints: ["$x$ is weeks, $y$ is centimetres."],
        why: "A solution of a system built from a situation is the moment when both descriptions agree. Before week 3 Ivy is taller; after it, Fern is." },
      { type: "pair", kicker: "Use it",
        prompt: "Two taxis. **Zip** charges \\$3 plus \\$2 a mile: $y = 2x + 3$. **Metro** charges \\$6 plus \\$1 a mile: $y = x + 6$. At what point $(x, y)$ do they cost the same?",
        answer: [3, 9], skill: "Graph a system",
        scene: { type: "plane", x: [0, 8], y: [0, 16], axisLabels: ["miles", "$"], fns: [{ f: "2*x + 3", color: "blue", label: "Zip", labelAt: 5 }, { f: "x + 6", color: "green", label: "Metro", labelAt: 6.6 }] },
        near: [{ v: [3, 3], fb: "The $x$ is right: 3 miles. Now the cost at 3 miles: $2(3) + 3$." }],
        hints: ["Read the crossing point off the graph, or try $x = 1, 2, 3$ in both rules."],
        why: "At 3 miles both cost \\$9: $2(3) + 3 = 9$ and $3 + 6 = 9$." },
      { type: "choice", prompt: "You're going **5 miles**. Which taxi is cheaper?",
        options: [{ t: "Metro" }, { t: "Zip", fb: "Zip: $2(5) + 3 = 13$. Metro: $5 + 6 = 11$." }, { t: "They cost the same", fb: "They only match at 3 miles." }],
        answer: 0, skill: "Interpret a solution", hints: ["Work out each cost at $x = 5$."],
        why: "Zip is \\$13, Metro \\$11. Past the crossing point, the line with the smaller slope is lower." }
    ]
  });

  /* ============================================ 2.3 · Substitution */
  LESSONS.push({
    title: "Solving systems by substitution",
    blurb: "Book 2.3 · If you know what y equals, put that in its place.",
    mins: 9, v: 20,
    steps: [
      { type: "pair", kicker: "Try it",
        prompt: "No graph this time. One number is **double** the other, and together they make **12**:" + sys("y = 2x", "x + y = 12") + "Find $(x, y)$.",
        answer: [4, 8], skill: "Substitution",
        near: [{ v: [6, 6], fb: "They add to 12, but $y$ must be double $x$." }],
        hints: ["Try small numbers: $x = 3$ gives $y = 6$. Too small?", "$x$ and its double make 12, so three lots of $x$ make 12."],
        why: "$x = 4$ and $y = 8$: 8 is double 4, and $4 + 8 = 12$." },
      { type: "learn", kicker: "See it",
        prompt: "Here is the thinking written down. The first equation says $y$ *is* $2x$, so $2x$ can take $y$'s place.",
        scene: { type: "walk", rows: [
          { m: "x + y = 12", say: "Start with the second equation." },
          { m: "x + (2x) = 12", say: "Swap $y$ for $2x$. Now there is only one letter." },
          { m: "3x = 12", say: "Combine." },
          { m: "x = 4", say: "Divide by 3." },
          { m: "y = 2(4) = 8", say: "Put $x = 4$ back to find $y$." }] },
        gate: true,
        then: "That's **substitution**: replace a variable with an expression equal to it. Two equations with two unknowns become one equation with one unknown." },
      { type: "num", prompt: "Your turn." + sys("y = x + 3", "2x + y = 18") + "Substitute, then solve. What is $x$?",
        pre: "$x =$", answer: 5, skill: "Substitution",
        near: [{ v: 7.5, fb: "$y$ isn't 3. It's $x + 3$: the whole expression goes in." }, { v: 15, fb: "$2x + x + 3 = 18$ gives $3x = 15$. One more step." }],
        hints: ["Replace $y$ with $(x + 3)$: $2x + (x + 3) = 18$."], why: lines(["2x + (x + 3) = 18", "3x + 3 = 18", "3x = 15", "x = 5"]) },
      { type: "num", prompt: "Finish it: with $x = 5$ and $y = x + 3$, what is $y$?", pre: "$y =$", answer: 8, skill: "Substitution",
        hints: ["Put 5 in for $x$."], why: "$y = 5 + 3 = 8$. Check in the other equation: $2(5) + 8 = 18$ ✓." },
      { type: "order", kicker: "Name it", prompt: "Put the steps of substitution in order.",
        items: ["Get one variable alone in one equation.", "Substitute its expression into the other equation.", "Solve the one-variable equation.", "Put that value back to find the other variable.", "Check the pair in both equations."],
        skill: "Substitution", why: "Isolate → substitute → solve → back-substitute → check." },
      { type: "choice", kicker: "Vary it",
        prompt: "Watch the brackets." + sys("y = 4 - x", "3x - y = 8") + "Which line is the correct substitution?",
        options: [{ t: "$3x - (4 - x) = 8$" },
                  { t: "$3x - 4 - x = 8$", fb: "The minus sign applies to *all* of $4 - x$. Keep the brackets: $-(4 - x) = -4 + x$." },
                  { t: "$3(4 - x) - y = 8$", fb: "$4 - x$ is equal to $y$, not $x$. It replaces the $y$." }],
        answer: 0, skill: "Substitution", hints: ["The whole expression replaces $y$. Wrap it in brackets."],
        why: "$3x - (4 - x) = 8$ becomes $4x - 4 = 8$, so $x = 3$ and $y = 1$." },
      { type: "pair", prompt: "Here $x$ is the one that's alone." + sys("x = 3y - 1", "2x + 5y = 20") + "Solve the system.",
        answer: [5, 2], skill: "Substitution",
        near: [{ v: [2, 5], fb: "Right numbers, wrong order. $x$ comes first." }],
        hints: ["Replace $x$: $2(3y - 1) + 5y = 20$.", "$6y - 2 + 5y = 20$, so $11y = 22$."],
        why: lines(["2(3y - 1) + 5y = 20", "11y - 2 = 20", "y = 2", "x = 3(2) - 1 = 5"]) },
      { type: "num", kicker: "Use it",
        prompt: "A pen costs **\\$3 more** than a pencil: $p = c + 3$. Two pens and four pencils cost **\\$18**: $2p + 4c = 18$. What does a **pencil** cost?",
        pre: "$\\$$", answer: 2, skill: "Substitution",
        near: [{ v: 5, fb: "That's the pen. The question asks for the pencil, $c$." }, { v: 3, fb: "$2(c + 3) + 4c = 18$ gives $6c + 6 = 18$." }],
        hints: ["Substitute $c + 3$ for $p$."], why: lines(["2(c + 3) + 4c = 18", "6c + 6 = 18", "c = 2"]) + "<br>A pencil is \\$2 and a pen is \\$5." }
    ]
  });

  /* ============================================ 2.4 · Elimination, part 1 */
  LESSONS.push({
    title: "Solving systems by elimination, part 1",
    blurb: "Book 2.4 · Add or subtract two equations, and one variable disappears.",
    mins: 8, v: 20,
    steps: [
      { type: "num", kicker: "Try it",
        prompt: "Two numbers **add** to 10 and **differ** by 4:" + sys("x + y = 10", "x - y = 4") + "What is $x$?",
        pre: "$x =$", answer: 7, skill: "Elimination",
        near: [{ v: 3, fb: "That's $y$. The bigger number is $x$." }, { v: 14, fb: "That's $2x$. Halve it." }],
        hints: ["Stack the equations and add them, left side to left side, right to right.", "$+y$ and $-y$ cancel: $2x = 14$."],
        why: "Adding the equations: $2x = 14$, so $x = 7$. Then $7 + y = 10$ gives $y = 3$." },
      { type: "learn", kicker: "See it", prompt: "Here is what adding two equations looks like.",
        scene: { type: "walk", rows: [
          { m: "x + y = 10", say: "The first equation." },
          { m: "x - y = 4", say: "The second. Both are true for the same $x$ and $y$." },
          { m: "2x + 0y = 14", say: "Add left sides, add right sides. Equal amounts were added to equal amounts, so this is true too." },
          { m: "x = 7", say: "$y$ has been eliminated. Solve for $x$." },
          { m: "7 + y = 10, \\; y = 3", say: "Put $x = 7$ into either equation." }] },
        gate: true,
        then: "That's **elimination**: add or subtract the equations so that one variable cancels. It works when a variable has **the same or opposite coefficients** in the two equations." },
      { type: "sort", prompt: "To make a variable vanish, would you **add** or **subtract** the two equations?",
        bins: ["Add", "Subtract"],
        cards: [{ t: two("2x + y = 9", "x - y = 3"), bin: 0, fb: "$+y$ and $-y$ are opposites. Adding cancels them." },
                { t: two("3x + 2y = 16", "x + 2y = 8"), bin: 1, fb: "Both have $+2y$. Subtracting gives $2y - 2y = 0$." },
                { t: two("-x + 4y = 7", "x + y = 3"), bin: 0, fb: "$-x$ and $x$ are opposites. Add." },
                { t: two("5x + y = 11", "5x - 3y = 3"), bin: 1, fb: "Both have $5x$. Subtract to cancel them." }],
        skill: "Elimination", hints: ["Opposite coefficients: add. Same coefficients: subtract."],
        why: "Opposites cancel when added ($y + -y$). Twins cancel when subtracted ($2y - 2y$)." },
      { type: "pair", prompt: "Subtract to solve." + sys("3x + 2y = 16", "x + 2y = 8"),
        answer: [4, 2], skill: "Elimination",
        near: [{ v: [6, -1], fb: "That comes from adding. Here the $2y$ terms match, so *subtract*: $2x = 8$." }],
        hints: ["$(3x + 2y) - (x + 2y) = 16 - 8$.", "$2x = 8$, so $x = 4$. Now find $y$."],
        why: lines(["2x = 8", "x = 4", "4 + 2y = 8", "y = 2"]) },
      { type: "learn", kicker: "See it",
        prompt: "Lines $A$ and $B$ cross at one point. Slide $k$ to build a new equation, $A + kB$. **Where does the new line always go?**",
        scene: { type: "plane", x: [-1, 9], y: [-2, 7], gate: true,
          params: { k: { v: 0, min: -3, max: 1, step: 1, label: "$k$" } },
          fns: [{ f: "(8 - x)/2", color: "blue", label: "A", labelAt: 0.5 }, { f: "x - 2", color: "green", label: "B", labelAt: 7.5 },
                { f: function (x, p) { return (8 + 2 * p.k - (1 + p.k) * x) / (2 - p.k); }, color: "orange" }],
          marks: [{ x: 4, y: 2, color: "ink", label: "(4, 2)" }],
          readout: function (st) { var k = st.params.k; return "$A$: $x + 2y = 8$ &nbsp; $B$: $x - y = 2$<br>$A " + (k < 0 ? "- " + (k === -1 ? "" : -k) : "+ " + (k === 1 ? "" : k)) + "B$: $" + (poly([[1 + k, "x"], [2 - k, "y"]]) || "0") + " = " + (8 + 2 * k) + "$" + (k === -1 ? " &nbsp;← no $x$ left" : ""); } },
        gate: true,
        then: "Every combination passes through $(4, 2)$, because that pair makes both $A$ and $B$ true. At $k = -1$ the $x$ is eliminated and the new line is flat: $y = 2$. Elimination doesn't change the solution. It finds a simpler line through it." },
      { type: "choice", kicker: "Vary it", prompt: "What happens if you add these two equations?" + sys("x + 2y = 7", "3x + y = 11"),
        options: [{ t: "You get $4x + 3y = 18$: true, but still two variables." },
                  { t: "The $x$ is eliminated.", fb: "$x + 3x = 4x$. Nothing cancels." },
                  { t: "You get a false equation.", fb: "Adding two true equations always gives a true one. It just may not help." }],
        answer: 0, skill: "Elimination", hints: ["Add the $x$ terms. Add the $y$ terms. Does either give zero?"],
        why: "Neither variable has matching or opposite coefficients, so nothing cancels. (Lesson 2.6 fixes this by multiplying first.)" },
      { type: "pair", kicker: "Use it",
        prompt: "At a café, **2 muffins and 1 tea** cost \\$11. **2 muffins and 3 teas** cost \\$15." + sys("2m + t = 11", "2m + 3t = 15") + "Find $(m, t)$.",
        answer: [4.5, 2], skill: "Elimination",
        near: [{ v: [2, 4.5], fb: "Those are the right prices in the wrong order: $m$ first." }],
        hints: ["Both orders have 2 muffins. Subtract the first from the second.", "$2t = 4$."],
        why: "Subtracting: $2t = 4$, so tea is \\$2. Then $2m + 2 = 11$ gives a muffin at \\$4.50." }
    ]
  });

  /* ============================================ 2.5 · Elimination, part 2 */
  LESSONS.push({
    title: "Solving systems by elimination, part 2",
    blurb: "Book 2.5 · Why adding equations is allowed, and when to choose elimination.",
    mins: 8, v: 20,
    steps: [
      { type: "choice", kicker: "Try it",
        prompt: "Two true statements: $4 + 3 = 7$ and $10 - 2 = 8$. Add the left sides, and add the right sides. Is the result true?$$4 + 3 + 10 - 2 = 7 + 8$$",
        options: [{ t: "Yes: both sides are 15." }, { t: "No.", fb: "Left: $4 + 3 + 10 - 2 = 15$. Right: $7 + 8 = 15$." }, { t: "Only sometimes.", fb: "Equal amounts added to equal amounts are always equal." }],
        answer: 0, skill: "Why elimination works", hints: ["Work out each side."],
        why: "If $a = b$ and $c = d$, then $a + c = b + d$. It's the same as adding the same amount to both sides." },
      { type: "learn", kicker: "Name it", prompt: "Now the same idea with letters.",
        scene: { type: "walk", rows: [
          { m: "3x + y = 11", say: "True at the solution. So its two sides are *the same number*." },
          { m: "2x - y = 4", say: "True at the solution too." },
          { m: "5x = 15", say: "Adding the second equation adds the same number to both sides of the first. So the solution still fits." },
          { m: "x = 3, \\; y = 2", say: "And the new equation is easy to solve." }] },
        gate: true,
        then: "Adding or subtracting two equations in a system makes a new equation with the **same solution**. That is why elimination is allowed." },
      { type: "multi", prompt: "Which systems are **ready** to eliminate a variable by adding or subtracting, with no other work?",
        options: [{ t: two("4x + 3y = 18", "2x - 3y = 0"), ok: true },
                  { t: two("x + 5y = 9", "x + 2y = 3"), ok: true },
                  { t: two("2x + 3y = 7", "3x + 2y = 8"), fb: "The 2 and 3 swap places, but no variable has the same coefficient in both equations." },
                  { t: two("x + y = 6", "2x + 3y = 14"), fb: "$x$ has coefficients 1 and 2; $y$ has 1 and 3. Nothing matches yet." }],
        skill: "Elimination", hints: ["Look down each column. Same number, or opposite numbers?"],
        why: "$3y$ and $-3y$ are opposites (add). $x$ and $x$ match (subtract)." },
      { type: "pair", prompt: "Solve by elimination." + sys("4x + 3y = 18", "2x - 3y = 0"),
        answer: [3, 2], skill: "Elimination",
        hints: ["Add: the $y$ terms cancel.", "$6x = 18$."], why: lines(["6x = 18", "x = 3", "2(3) - 3y = 0", "y = 2"]) },
      { type: "sort", kicker: "Vary it", prompt: "Which method looks **quicker** for each system?",
        bins: ["Substitution", "Elimination"],
        cards: [{ t: two("y = 3x - 1", "2x + y = 9"), bin: 0, fb: "$y$ is already alone. Substitute it." },
                { t: two("5x + 2y = 9", "3x - 2y = 7"), bin: 1, fb: "$2y$ and $-2y$ cancel as soon as you add." },
                { t: two("x = 2y", "3x - y = 10"), bin: 0, fb: "$x$ is already alone." },
                { t: two("7x + 4y = 15", "7x - y = 5"), bin: 1, fb: "Both have $7x$. Subtract." }],
        skill: "Choose a method", hints: ["Is a variable already alone? Or do two coefficients match?"],
        why: "A variable already isolated invites substitution. Matching or opposite coefficients invite elimination. Either method gives the same answer." },
      { type: "choice", prompt: "Diego subtracts these and gets $2y = 4$. What went wrong?" + sys("3x + 4y = 10", "3x - 2y = 4"),
        options: [{ t: "$4y - (-2y)$ is $6y$, and $10 - 4$ is 6." },
                  { t: "He should have added.", fb: "Adding gives $6x + 2y = 14$: nothing cancels. Subtracting is right, but the signs need care." },
                  { t: "Nothing. $2y = 4$ is correct.", fb: "Subtracting $-2y$ is adding $2y$: $4y + 2y = 6y$." }],
        answer: 0, skill: "Elimination", hints: ["Subtracting a negative term adds it."],
        why: "$(3x + 4y) - (3x - 2y) = 6y$ and $10 - 4 = 6$, so $6y = 6$ and $y = 1$." },
      { type: "pair", kicker: "Use it",
        prompt: "A school play sold $a$ **adult** tickets and $s$ **student** tickets. Friday: $a + s = 150$. The difference was $a - s = 30$. Find $(a, s)$.",
        answer: [90, 60], skill: "Elimination",
        near: [{ v: [60, 90], fb: "Check the difference: adults minus students should be $+30$." }],
        hints: ["Add the two equations."], why: "Adding: $2a = 180$, so $a = 90$ and $s = 60$." }
    ]
  });
  /* ============================================ 2.6 · Elimination, part 3 */
  LESSONS.push({
    title: "Solving systems by elimination, part 3",
    blurb: "Book 2.6 · When nothing cancels, multiply an equation first.",
    mins: 9, v: 20,
    steps: [
      { type: "choice", kicker: "Try it",
        prompt: "$(3, 2)$ is a solution of $x + 2y = 7$. Is it also a solution of $2x + 4y = 14$?",
        options: [{ t: "Yes. Every term was doubled, so it is the same line." },
                  { t: "No. The numbers are different.", fb: "Try it: $2(3) + 4(2) = 14$ ✓." },
                  { t: "Only by coincidence.", fb: "Doubling both sides keeps *every* solution, not just this one." }],
        answer: 0, skill: "Equivalent systems", hints: ["Put $x = 3$, $y = 2$ into the second equation."],
        why: "Multiplying both sides of an equation by the same non-zero number gives an equivalent equation." },
      { type: "learn", kicker: "See it",
        prompt: "Slide $k$ to multiply equation $A$ by $k$. **Watch the equation change. Watch the line.**",
        scene: { type: "plane", x: [-1, 9], y: [-2, 7], gate: true,
          params: { k: { v: 1, min: 1, max: 5, step: 1, label: "multiply $A$ by" } },
          fns: [{ f: "11 - 3*x", color: "green", label: "B", labelAt: 2.2 }, { f: function (x, p) { return (7 * p.k - p.k * x) / (2 * p.k); }, color: "blue", label: "A", labelAt: 0.4 }],
          marks: [{ x: 3, y: 2, color: "ink", label: "(3, 2)" }],
          readout: function (st) { var k = st.params.k; return "$A$: $" + poly([[k, "x"], [2 * k, "y"]]) + " = " + 7 * k + "$ &nbsp; $B$: $3x + y = 11$" + (k === 3 ? " &nbsp;← the $x$ terms match" : ""); } },
        gate: true,
        then: "The line never moves. But at $k = 3$, equation $A$ reads $3x + 6y = 21$, and its $3x$ now matches the $3x$ in $B$. **Multiply first, then eliminate.**" },
      { type: "learn", prompt: "Here is the whole method on that system.",
        scene: { type: "walk", rows: [
          { m: "x + 2y = 7 \\qquad 3x + y = 11", say: "Nothing cancels yet." },
          { m: "3x + 6y = 21", say: "Multiply the first equation by 3." },
          { m: "5y = 10", say: "Subtract $3x + y = 11$. The $3x$ terms cancel." },
          { m: "y = 2", say: "Divide by 5." },
          { m: "x + 2(2) = 7, \\; x = 3", say: "Put $y = 2$ back." }] },
        gate: true },
      { type: "num", prompt: "To eliminate $y$ from this system by adding, multiply the **first** equation by what number?" + sys("2x + y = 8", "5x - 3y = 9"),
        answer: 3, skill: "Elimination with multiplying",
        near: [{ v: -3, fb: "That gives $-3y$ and $-3y$: the same, so you'd subtract. For *adding*, you want opposites: $+3y$ and $-3y$." }, { v: 5, fb: "That would line up the $x$ terms, as $10x$ and $5x$. Not a match." }],
        hints: ["You want $+3y$ in the first equation, to cancel the $-3y$."], why: "Times 3: $6x + 3y = 24$. Adding $5x - 3y = 9$ gives $11x = 33$." },
      { type: "order", kicker: "Vary it", prompt: "Sometimes **both** equations need multiplying. Put this solution in order." + sys("2x + 3y = 12", "3x - 2y = 5"),
        items: ["Multiply the first by 2: $4x + 6y = 24$", "Multiply the second by 3: $9x - 6y = 15$", "Add: $13x = 39$", "Divide: $x = 3$", "Substitute back: $y = 2$"],
        skill: "Elimination with multiplying", why: "The aim is $6y$ and $-6y$. Then adding eliminates $y$." },
      { type: "multi", prompt: "Which first moves set up an elimination here?" + sys("4x + y = 9", "3x + 2y = 13"),
        options: [{ t: "Multiply the first equation by 2", ok: true },
                  { t: "Multiply the first by 3 and the second by 4", ok: true },
                  { t: "Multiply the second equation by 2", fb: "That gives $6x + 4y = 26$. Neither term matches $4x + y = 9$." },
                  { t: "Multiply only the left side of the first by 2", fb: "Both sides must be multiplied, or the equation stops being true." }],
        skill: "Elimination with multiplying", hints: ["After the move, does some variable have the same coefficient in both equations?"],
        why: "Times 2 gives $8x + 2y = 18$ (the $2y$ match). Times 3 and times 4 give $12x$ in both. There is more than one good route." },
      { type: "pair", prompt: "Solve it." + sys("4x + y = 9", "3x + 2y = 13"),
        answer: [1, 5], skill: "Elimination with multiplying",
        near: [{ v: [5, 1], fb: "Right numbers, wrong order." }],
        hints: ["Double the first: $8x + 2y = 18$.", "Subtract the second: $5x = 5$."], why: lines(["8x + 2y = 18", "5x = 5", "x = 1", "4(1) + y = 9", "y = 5"]) },
      { type: "num", kicker: "Use it",
        prompt: "A fair sold **20 tickets**: $a + c = 20$. Adult tickets were \\$7 and child tickets \\$4, for **\\$104** in all: $7a + 4c = 104$. How many **adult** tickets?",
        answer: 8, skill: "Elimination with multiplying",
        near: [{ v: 12, fb: "That's the child tickets." }],
        hints: ["Multiply the first equation by 4, then subtract it from the second."],
        why: lines(["4a + 4c = 80", "3a = 24", "a = 8"]) + "<br>8 adults and 12 children: $56 + 48 = 104$ ✓." }
    ]
  });

  /* ============================================ 2.7 · How many solutions */
  LESSONS.push({
    title: "Systems of linear equations and their solutions",
    blurb: "Book 2.7 · One crossing, none, or the same line twice.",
    mins: 8, v: 20,
    steps: [
      { type: "plane", kicker: "Try it",
        prompt: "The blue line is fixed: $y = 2x + 1$. Use the sliders to make the orange line **never meet it**.",
        x: [-6, 6], y: [-6, 8],
        params: { m: { v: -1, min: -2, max: 3, step: 1, label: "slope $m$" }, b: { v: 3, min: -4, max: 6, step: 1, label: "intercept $b$" } },
        fns: [{ f: "2*x + 1", color: "blue" }, { f: "m*x + b", color: "orange" }],
        readout: function (st) { return "Orange: $y = " + poly([[st.params.m, "x"], [st.params.b, ""]]) + "$"; },
        check: function (st) { var p = st.params; return p.m === 2 && p.b !== 1 ? { ok: true } : { ok: false, say: p.m !== 2 ? "With a different slope the lines must cross somewhere, even if it is off the screen." : "Now they are the same line. They meet everywhere." }; },
        answer: { params: { m: 2, b: 4 } }, skill: "Number of solutions",
        hints: ["Lines that never meet are parallel. What do parallel lines share?"],
        why: "Same slope, different intercept: parallel lines. No point is on both, so the system has **no solution**." },
      { type: "plane", prompt: "Now make the orange line meet the blue line at **every** point.",
        x: [-6, 6], y: [-6, 8],
        params: { m: { v: 2, min: -2, max: 3, step: 1, label: "slope $m$" }, b: { v: 4, min: -4, max: 6, step: 1, label: "intercept $b$" } },
        fns: [{ f: "2*x + 1", color: "blue" }, { f: "m*x + b", color: "orange" }],
        readout: function (st) { return "Orange: $y = " + poly([[st.params.m, "x"], [st.params.b, ""]]) + "$"; },
        check: function (st) { var p = st.params; return p.m === 2 && p.b === 1 ? { ok: true } : { ok: false, say: "They need to be the very same line: same slope *and* same intercept." }; },
        answer: { params: { m: 2, b: 1 } }, skill: "Number of solutions",
        hints: ["Put it right on top of the blue line."],
        why: "Same slope and same intercept: one line, drawn twice. Every point on it solves both equations: **infinitely many solutions**." },
      { type: "learn", kicker: "Name it",
        prompt: "A system of two linear equations has exactly one of three outcomes." +
          tbl(["Slopes", "Intercepts", "Lines", "Solutions"], [["\\text{different}", "\\text{any}", "\\text{cross once}", "\\text{one}"], ["\\text{same}", "\\text{different}", "\\text{parallel}", "\\text{none}"], ["\\text{same}", "\\text{same}", "\\text{same line}", "\\text{infinitely many}"]]) },
      { type: "choice", kicker: "Vary it", prompt: "You solve a system by elimination and everything cancels, leaving $$0 = 5$$ What does that tell you?",
        options: [{ t: "No solution: the lines are parallel." },
                  { t: "The solution is $x = 0$, $y = 5$.", fb: "There is no $x$ or $y$ left in $0 = 5$. It is simply false." },
                  { t: "Infinitely many solutions.", fb: "That happens when what's left is *true*, like $0 = 0$." }],
        answer: 0, skill: "Number of solutions", hints: ["Is $0 = 5$ ever true?"],
        why: "A false statement means no pair $(x, y)$ can make both equations true." },
      { type: "choice", prompt: "Another system collapses to $$6 = 6$$ What does that tell you?",
        options: [{ t: "Infinitely many solutions: both equations describe the same line." },
                  { t: "No solution.", fb: "$6 = 6$ is true, not false." },
                  { t: "The solution is $(6, 6)$.", fb: "The variables have gone. $6 = 6$ says nothing about one particular point." }],
        answer: 0, skill: "Number of solutions", hints: ["$6 = 6$ is always true."],
        why: "A statement that is always true means the equations were equivalent all along." },
      { type: "sort", prompt: "How many solutions? Compare slopes and intercepts. You don't need to solve.",
        bins: ["One", "None", "Infinitely many"],
        cards: [{ t: two("y = 3x + 2", "y = 3x - 4"), bin: 1, fb: "Same slope, different intercepts: parallel." },
                { t: two("y = 2x + 1", "y = -x + 7"), bin: 0, fb: "Different slopes: they cross once." },
                { t: two("x + y = 3", "2x + 2y = 6"), bin: 2, fb: "The second is the first doubled: the same line." },
                { t: two("x + y = 3", "x + y = 8"), bin: 1, fb: "A sum can't be 3 and 8 at once." },
                { t: two("y = 4x", "y = x + 6"), bin: 0, fb: "Slopes 4 and 1: one crossing." }],
        skill: "Number of solutions", hints: ["Different slopes: one. Same slope: check the intercepts."],
        why: "Different slopes always cross once. Same slope means parallel (none) or identical (infinitely many)." },
      { type: "choice", kicker: "Use it",
        prompt: "A pool sells passes ($p$) and gym memberships ($g$). One family pays \\$96 for 4 passes and 2 memberships. Later, someone pays \\$72 for 2 passes and 1 membership." + sys("4p + 2g = 96", "2p + g = 72") + "What can you conclude?",
        options: [{ t: "The prices can't have been the same both times." },
                  { t: "A pass costs \\$12 and a membership \\$24.", fb: "Then the second order would be $24 + 24 = 48$, not 72." },
                  { t: "There are many possible prices.", fb: "Double the second equation: $4p + 2g = 144$. The same order can't cost \\$96 and \\$144." }],
        answer: 0, skill: "Number of solutions", hints: ["Double the second equation and compare it with the first."],
        why: "Doubling the second gives $4p + 2g = 144$, but the first says $4p + 2g = 96$. No solution: the prices must have changed." },
      { type: "slots", prompt: "Pair each equation with $y = 3x + 2$ to make the system described.",
        slots: [{ id: "a", label: "No solution" }, { id: "b", label: "Infinitely many solutions" }, { id: "c", label: "Exactly one solution" }],
        cards: [{ t: "$y = 3x - 5$", slot: "a", fb: "Same slope 3, different intercept: parallel to $y = 3x + 2$." },
                { t: "$2y = 6x + 4$", slot: "b", fb: "Halve it: $y = 3x + 2$. The same line." },
                { t: "$y = -3x + 2$", slot: "c", fb: "Slope $-3$ is different from 3, so they cross once." }],
        skill: "Number of solutions", hints: ["Write each in the form $y = mx + b$ and compare with $y = 3x + 2$."],
        why: "You can build any of the three outcomes by choosing the slope and intercept." }
    ]
  });

  /* ============================================ 2.8 · Inequalities for situations */
  LESSONS.push({
    title: "Representing situations with inequalities",
    blurb: "Book 2.8 · A constraint with room in it: at least, at most, more than, fewer than.",
    mins: 8, v: 20,
    steps: [
      { type: "sort", kicker: "Try it", prompt: "A sign gives a limit of 40. **Is 40 itself allowed?**",
        bins: ["40 is allowed", "40 is not allowed"],
        cards: [{ t: "at least 40", bin: 0, fb: "“At least 40” means 40 or more." },
                { t: "more than 40", bin: 1, fb: "“More than 40” starts just above 40." },
                { t: "no more than 40", bin: 0, fb: "“No more than 40” means 40 or less." },
                { t: "under 40", bin: 1, fb: "“Under 40” stops just below 40." },
                { t: "a maximum of 40", bin: 0, fb: "The maximum is the largest allowed value: 40 counts." },
                { t: "fewer than 40", bin: 1, fb: "“Fewer than 40” does not include 40." }],
        skill: "Write an inequality", hints: ["Read each phrase and ask: could it be exactly 40?"],
        why: "When the boundary is allowed, use $\\le$ or $\\ge$. When it isn't, use $<$ or $>$." },
      { type: "ineq", prompt: "A ride requires riders to be **at least 48 inches** tall. Write that as an inequality in $h$.",
        answer: "h>=48", variable: "h", skill: "Write an inequality",
        near: [{ v: "h>48", fb: "Someone exactly 48 inches tall may ride. Use $\\ge$." }, { v: "h<=48", fb: "That says 48 inches *or shorter*." }],
        keys: [["$h$", "h"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="]], placeholder: "h …",
        hints: ["“At least” means that number or more."], why: "$h \\ge 48$." },
      { type: "ineq", prompt: "A club orders $n$ T-shirts at **\\$8** each, plus a **\\$25** set-up fee. It can spend **at most \\$185**. Write the constraint.",
        answer: "8n+25<=185", variable: "n", skill: "Write an inequality",
        near: [{ v: "8n+25<185", fb: "Spending exactly \\$185 is allowed: “at most” includes it." }, { v: "8n+25>=185", fb: "That says the club spends *at least* \\$185." }, { v: "33n<=185", fb: "The \\$25 is paid once, not for every shirt." }],
        keys: [["$n$", "n"], ["$+$", "+"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="]], placeholder: "Use n",
        hints: ["Cost: $8n + 25$. “At most” means less than or equal to."], why: "$8n + 25 \\le 185$." },
      { type: "num", prompt: "So what is the **most** shirts the club can order?", answer: 20, skill: "Write an inequality",
        near: [{ v: 23, fb: "Take off the \\$25 fee before dividing by 8." }, { v: 21, fb: "$8(21) + 25 = 193$: over budget." }],
        hints: ["$185 - 25 = 160$ is left for shirts."], why: "$160 \\div 8 = 20$. Any whole number from 0 to 20 satisfies the constraint: an inequality has many solutions." },
      { type: "learn", kicker: "Name it", prompt: "One situation usually has several constraints. A school dance, with $t$ tickets sold at \\$12:",
        scene: { type: "walk", rows: [
          { m: "t \\le 300", say: "The hall holds 300 people." },
          { m: "12t \\ge 1800", say: "Ticket money must cover the \\$1,800 cost." },
          { m: "t \\ge 0", say: "You can't sell a negative number of tickets." }] },
        gate: true,
        then: "An **inequality** describes a constraint that leaves room: a whole range of values is acceptable. Reading one means asking what each letter, number and symbol stands for." },
      { type: "choice", kicker: "Vary it", prompt: "Kai earns \\$9.50 an hour. What does $9.5h \\ge 190$ say?",
        options: [{ t: "Kai wants to earn at least \\$190." },
                  { t: "Kai works at least 190 hours.", fb: "$h$ is the hours. 190 is being compared with the *pay*, $9.5h$." },
                  { t: "Kai earns less than \\$190.", fb: "$\\ge$ means greater than or equal to." }],
        answer: 0, skill: "Interpret an inequality", hints: ["$9.5h$ is the pay for $h$ hours."],
        why: "Pay is $9.5h$, and it must be \\$190 or more. That needs $h \\ge 20$ hours." },
      { type: "choice", kicker: "Use it",
        prompt: "Mina tutors for $x$ hours at \\$15 and babysits for $y$ hours at \\$10. She wants **at least \\$120**. Which inequality fits?",
        options: [{ t: "$15x + 10y \\ge 120$" },
                  { t: "$15x + 10y \\le 120$", fb: "That caps her earnings at \\$120. She wants \\$120 *or more*." },
                  { t: "$x + y \\ge 120$", fb: "That counts hours, not dollars." },
                  { t: "$25xy \\ge 120$", fb: "Each job is paid separately: $15x$ and $10y$, added." }],
        answer: 0, skill: "Write an inequality", hints: ["Total earned: tutoring money plus babysitting money."],
        why: "$15x + 10y$ is her total. “At least 120” is $\\ge 120$. With two variables, there are many pairs that work." },
      { type: "explain", kicker: "Make it yours",
        prompt: "Think of a limit in your own week: money, time, screen hours, laps. Write it as an inequality, and say what the letter stands for.",
        placeholder: "e.g. s = hours of sleep on a school night; s ≥ 8",
        model: "A good answer names the quantity, picks a letter, and uses the right symbol: “m = minutes of practice a day; m ≥ 30” (at least 30) or “c = cost of lunch; c ≤ 6” (at most \\$6)." }
    ]
  });

  /* ============================================ 2.9 · Solutions to inequalities */
  LESSONS.push({
    title: "Solutions to inequalities",
    blurb: "Book 2.9 · Find the boundary, then test which side works.",
    mins: 8, v: 20,
    steps: [
      { type: "multi", kicker: "Try it", prompt: "Which values of $x$ make $2x + 3 < 11$ true?",
        options: [{ t: "$x = 0$", ok: true }, { t: "$x = 3$", ok: true }, { t: "$x = 3.9$", ok: true },
                  { t: "$x = 4$", fb: "$2(4) + 3 = 11$, and 11 is not *less than* 11." },
                  { t: "$x = 6$", fb: "$2(6) + 3 = 15$, which is more than 11." }],
        skill: "Solutions of an inequality", hints: ["Work out $2x + 3$ for each value. Is it below 11?"],
        why: "0, 3 and 3.9 give 3, 9 and 10.8: all below 11. Something changes at $x = 4$." },
      { type: "learn", kicker: "See it", prompt: "Slide $x$ until the two sides are **equal**. That value is the edge of the solutions.",
        scene: { type: "tester", a: "2x + 3", b: "11", x: { v: 0, min: -2, max: 8 }, goal: "equal" },
        gate: true,
        then: "The sides match at $x = 4$: the **boundary**. Below 4 the left side is smaller, so the inequality is true. Above 4 it is false. The solutions are $x < 4$." },
      { type: "numberline", prompt: "Show $x < 4$ on the number line.",
        min: -2, max: 10, mode: "ray", variable: "x", ray: { at: 1, dir: "right", closed: true },
        answer: { at: 4, dir: "left", closed: false }, skill: "Graph an inequality",
        hints: ["4 itself is not a solution. Is its circle open or filled?"],
        why: "An open circle at 4 (not included), shaded to the left (everything smaller)." },
      { type: "learn", kicker: "Name it",
        prompt: "The **solution set** of an inequality is every value that makes it true. Two steps find it:<br><br>**1.** Solve the matching *equation* to get the boundary.<br>**2.** Test one value on either side to see which side works." },
      { type: "choice", kicker: "Vary it",
        prompt: "Now $-2x < 6$. The boundary is $x = -3$. Test $x = 0$: is $-2(0) < 6$? Which side is the solution set?",
        options: [{ t: "$x > -3$" },
                  { t: "$x < -3$", fb: "Test $x = -5$: $-2(-5) = 10$, and $10 < 6$ is false. Zero worked, and zero is to the *right* of $-3$." },
                  { t: "$x < 3$", fb: "The boundary is $-3$: $-2(-3) = 6$." }],
        answer: 0, skill: "Solutions of an inequality", hints: ["$0 < 6$ is true. Which side of $-3$ is zero on?"],
        why: "Zero works and lies to the right of $-3$, so the solutions are $x > -3$. Notice the symbol turned round: dividing by a negative number **reverses** an inequality." },
      { type: "numberline", prompt: "Graph the solutions of $-2x \\le 6$.",
        min: -8, max: 4, mode: "ray", variable: "x", ray: { at: 0, dir: "left", closed: false },
        answer: { at: -3, dir: "right", closed: true }, skill: "Graph an inequality",
        hints: ["Boundary: $-2x = 6$. Then test $x = 0$.", "$\\le$ includes the boundary."],
        why: "Boundary $x = -3$, included (filled). Zero works, so shade right: $x \\ge -3$." },
      { type: "choice", prompt: "A number line shows an **open** circle at 5, shaded to the **left**. Which inequality is it?",
        options: [{ t: "$x < 5$" }, { t: "$x \\le 5$", fb: "A filled circle would include 5. This one is open." }, { t: "$x > 5$", fb: "Shading to the left means smaller numbers." }],
        answer: 0, skill: "Graph an inequality", hints: ["Open circle: 5 is not included. Left: smaller."], why: "Open at 5, smaller values shaded: $x < 5$." },
      { type: "ineq", kicker: "Use it",
        prompt: "A lift can carry **at most 1,200 lb**. A 300-lb cart is loaded with $x$ boxes of 150 lb each: $150x + 300 \\le 1200$. Solve for $x$.",
        answer: "x<=6", variable: "x", skill: "Solutions of an inequality",
        near: [{ v: "x<6", fb: "Exactly 6 boxes makes 1,200 lb, which is allowed." }, { v: "x<=8", fb: "Take off the 300-lb cart before dividing." }, { v: "x>=6", fb: "Test $x = 0$: an empty cart is fine, so small values work." }],
        hints: ["Boundary: $150x + 300 = 1200$.", "$150x = 900$."], why: "$150x \\le 900$, so $x \\le 6$: up to 6 boxes." }
    ]
  });

  /* ============================================ 2.10 · Solving inequalities */
  LESSONS.push({
    title: "Writing and solving inequalities in one variable",
    blurb: "Book 2.10 · Solve it like an equation, and flip the sign when you multiply or divide by a negative.",
    mins: 8, v: 20,
    steps: [
      { type: "ineq", kicker: "Try it",
        prompt: "Headphones cost **\\$250**. Jo has **\\$70** and saves **\\$15 a week**. Write an inequality for the weeks $w$ until Jo has enough.",
        answer: "15w+70>=250", variable: "w", skill: "Solve an inequality",
        near: [{ v: "15w+70>250", fb: "Having exactly \\$250 is enough. Use $\\ge$." }, { v: "15w+70<=250", fb: "Jo needs \\$250 *or more*, not at most." }, { v: "85w>=250", fb: "The \\$70 is there from the start. Only the \\$15 is per week." }],
        keys: [["$w$", "w"], ["$+$", "+"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="]], placeholder: "Use w",
        hints: ["Savings after $w$ weeks: $15w + 70$."], why: "$15w + 70 \\ge 250$." },
      { type: "ineq", prompt: "Solve $15w + 70 \\ge 250$.", answer: "w>=12", variable: "w", skill: "Solve an inequality",
        near: [{ v: "w>12", fb: "At exactly 12 weeks Jo has \\$250. Keep the $\\ge$." }, { v: "w<=12", fb: "More weeks means more money. The symbol doesn't flip here: you divided by a positive number." }],
        keys: [["$w$", "w"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="]], placeholder: "w …",
        hints: ["Subtract 70 from both sides, then divide by 15."], why: lines(["15w \\ge 180", "w \\ge 12"]) + "<br>Jo needs at least 12 weeks." },
      { type: "learn", kicker: "See it", prompt: "The same moves work as for equations, with **one** extra rule.",
        scene: { type: "walk", rows: [
          { m: "5 - 3x > 20", say: "Solve this one." },
          { m: "-3x > 15", say: "Subtract 5 from both sides. Nothing unusual." },
          { m: "x < -5", say: "Divide by $-3$. **The sign flips.**" },
          { m: "5 - 3(-6) = 23 > 20 \\; ✓", say: "Check with a value below $-5$, such as $-6$." }] },
        gate: true,
        then: "Multiplying or dividing both sides by a **negative** number reverses the inequality. Adding and subtracting never do. When in doubt, test a value." },
      { type: "sort", prompt: "Does the move **flip** the inequality sign?",
        bins: ["Flips it", "Leaves it"],
        cards: [{ t: "Divide both sides by $-4$", bin: 0, fb: "Dividing by a negative reverses the order." },
                { t: "Subtract 9 from both sides", bin: 1, fb: "Subtracting slides both sides the same way. The order stays." },
                { t: "Multiply both sides by $-1$", bin: 0, fb: "$2 < 5$, but $-2 > -5$." },
                { t: "Add $-3$ to both sides", bin: 1, fb: "Adding a negative is just subtracting. No flip." },
                { t: "Divide both sides by 5", bin: 1, fb: "Dividing by a positive keeps the order." }],
        skill: "Solve an inequality", hints: ["Only multiplying or dividing by a negative flips."],
        why: "$2 < 5$ becomes $-2 > -5$ when both are multiplied by $-1$: on the number line, the order reverses." },
      { type: "ineq", kicker: "Vary it", prompt: "Solve $4 - 2x \\le 10$.", answer: "x>=-3", variable: "x", skill: "Solve an inequality",
        near: [{ v: "x<=-3", fb: "You divided by $-2$, so the sign must flip. Test $x = 0$: $4 \\le 10$ is true, and 0 is above $-3$." }, { v: "x>=3", fb: "$6 \\div -2$ is $-3$." }],
        hints: ["Subtract 4: $-2x \\le 6$.", "Divide by $-2$ and flip."], why: lines(["-2x \\le 6", "x \\ge -3"]) },
      { type: "ineq", prompt: "Variables on both sides: solve $3x + 5 < x - 7$.", answer: "x<-6", variable: "x", skill: "Solve an inequality",
        near: [{ v: "x>-6", fb: "You divided by $+2$, so no flip." }, { v: "x<-1", fb: "$-7 - 5$ is $-12$." }],
        hints: ["Subtract $x$ from both sides: $2x + 5 < -7$."], why: lines(["2x + 5 < -7", "2x < -12", "x < -6"]) },
      { type: "ineq", kicker: "Use it",
        prompt: "A phone is at **80%** and loses **6% an hour**. Low-power mode starts **below 20%**: $80 - 6h < 20$. Solve for $h$.",
        answer: "h>10", variable: "h", skill: "Solve an inequality",
        near: [{ v: "h<10", fb: "You divided by $-6$: flip the sign. And it makes sense: the battery is low *after* 10 hours." }, { v: "h>=10", fb: "At exactly 10 hours it is 20%, which is not below 20%." }],
        keys: [["$h$", "h"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="]], placeholder: "h …",
        hints: ["Subtract 80: $-6h < -60$."], why: lines(["-6h < -60", "h > 10"]) + "<br>Low-power mode starts after more than 10 hours." }
    ]
  });
  // A point's verdict against an inequality, for readouts: "2 + 3 = 5 ≤ 6 ✓".
  function verdict(lhs, val, rel, rhs, ok) { return ok ? "$" + lhs + " = " + nm(val) + " " + rel + " " + rhs + "$ ✓" : "$" + lhs + " = " + nm(val) + "$, which is not $" + rel + " " + rhs + "$ ✗"; }

  /* ============================================ 2.11 · Graphing inequalities */
  LESSONS.push({
    title: "Graphing linear inequalities in two variables",
    blurb: "Book 2.11 · The solutions fill half the plane. The line is the edge.",
    mins: 8, v: 20,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "**Click any point** $(x, y)$ that makes $x + y \\le 6$ true.",
        x: [-2, 8], y: [-2, 8], click: "point", answer: { point: [1, 1] }, skill: "Solutions in two variables",
        check: function (st) { var c = st.clicked; return c && c[0] + c[1] <= 6 ? { ok: true } : { ok: false, say: c ? "$" + nm(c[0]) + " + " + nm(c[1]) + " = " + nm(c[0] + c[1]) + "$, which is more than 6." : null }; },
        hints: ["Any point whose coordinates add to 6 or less."], why: "Many points work: $(1, 1)$, $(0, 0)$, $(5, -3)$, $(2, 4)$ and infinitely more." },
      { type: "learn", kicker: "See it", prompt: "Drag $P$ all around. **Where are the points that work?**",
        scene: { type: "plane", x: [-2, 8], y: [-2, 8], gate: true,
          fns: [{ f: "6 - x", color: "blue", shade: "below" }],
          points: [{ id: "P", x: 6, y: 5, drag: true, label: "P" }],
          readout: function (st) { var p = st.pt("P"), s = p.x + p.y; return verdict(nm(p.x) + " + " + nm(p.y), s, "\\le", 6, s <= 6); } },
        gate: true,
        then: "Every solution lies on one side of the line $x + y = 6$. The solutions of a linear inequality in two variables fill a **half-plane**, and the line is its **boundary**." },
      { type: "choice", prompt: "$(2, 4)$ sits exactly on the line $x + y = 6$. Is it a solution of $x + y < 6$?",
        options: [{ t: "No. $2 + 4 = 6$, which is not less than 6. The line is drawn dashed." },
                  { t: "Yes. It's on the line.", fb: "For $<$, equal is not good enough: $6 < 6$ is false." },
                  { t: "Yes, but only for $x$.", fb: "A point is a solution or it isn't. Test the whole point: $2 + 4 < 6$?" }],
        answer: 0, skill: "Graph an inequality in two variables", hints: ["Is $6 < 6$ true?"],
        why: "With $<$ or $>$, points on the boundary are not solutions, so it is drawn **dashed**. With $\\le$ or $\\ge$ they are, so it is **solid**." },
      { type: "sort", kicker: "Name it", prompt: "Solid boundary or dashed?",
        bins: ["Solid", "Dashed"],
        cards: [{ t: "$y \\le 2x + 1$", bin: 0, fb: "$\\le$ includes the line." },
                { t: "$y < -x$", bin: 1, fb: "$<$ leaves the line out." },
                { t: "$3x + y \\ge 9$", bin: 0, fb: "$\\ge$ includes the line." },
                { t: "$x - y > 4$", bin: 1, fb: "$>$ leaves the line out." }],
        skill: "Graph an inequality in two variables", hints: ["Does the symbol include “or equal to”?"],
        why: "“Or equal to” puts the line in the solution: solid. Strict symbols leave it out: dashed." },
      { type: "choice", prompt: "To graph $y > 2x - 1$, test the point $(0, 0)$. Is $0 > 2(0) - 1$? Which side gets shaded?",
        options: [{ t: "The side containing $(0, 0)$: above the line." },
                  { t: "The side away from $(0, 0)$.", fb: "$0 > -1$ is *true*, so $(0, 0)$ is a solution. Shade its side." },
                  { t: "Neither: the line is the answer.", fb: "The line is only the boundary, and here it isn't even included." }],
        answer: 0, skill: "Graph an inequality in two variables", hints: ["$0 > -1$: true or false?"],
        why: "A test point that works tells you its whole side works. If the line passes through $(0, 0)$, test another point." },
      { type: "plane", kicker: "Vary it", prompt: "Build the graph of $y \\le -x + 4$: set the boundary with the sliders. The shading follows.",
        x: [-4, 8], y: [-4, 8],
        params: { m: { v: 1, min: -3, max: 3, step: 1, label: "slope $m$" }, b: { v: 0, min: -3, max: 6, step: 1, label: "intercept $b$" } },
        fns: [{ f: "m*x + b", color: "blue", shade: "below" }],
        readout: function (st) { return "$y \\le " + poly([[st.params.m, "x"], [st.params.b, ""]]) + "$"; },
        check: function (st) { var p = st.params; return p.m === -1 && p.b === 4 ? { ok: true } : { ok: false, say: "The boundary is $y = -x + 4$: slope $-1$, crossing the $y$-axis at 4." }; },
        answer: { params: { m: -1, b: 4 } }, skill: "Graph an inequality in two variables",
        hints: ["Read the slope and intercept from $y = -x + 4$."], why: "Boundary $y = -x + 4$ (solid, because of $\\le$), shaded below." },
      { type: "choice", prompt: "Which inequality is graphed here?",
        scene: { type: "plane", x: [-5, 5], y: [-5, 5], fns: [{ f: "x + 1", color: "green", shade: "above", strict: true }] },
        options: [{ t: "$y > x + 1$" },
                  { t: "$y \\ge x + 1$", fb: "The line is dashed, so it isn't included." },
                  { t: "$y < x + 1$", fb: "The shading is above the line: bigger $y$ values." }],
        answer: 0, skill: "Graph an inequality in two variables", hints: ["Dashed or solid? Shaded above or below?"],
        why: "Dashed means strict ($>$ or $<$). Shaded above means $y$ is greater than the line." },
      { type: "plane", kicker: "Use it",
        prompt: "Rosa buys $x$ bags of chips at \\$2 and $y$ drinks at \\$1, spending at most \\$10: $2x + y \\le 10$. **Click a whole-number combination she can afford.**",
        x: [0, 7], y: [0, 12], axisLabels: ["chips", "drinks"], click: "point", answer: { point: [2, 3] }, skill: "Solutions in two variables",
        fns: [{ f: "10 - 2*x", color: "blue", shade: "below" }],
        check: function (st) { var c = st.clicked; return c && 2 * c[0] + c[1] <= 10 ? { ok: true } : { ok: false, say: c ? "That costs $2(" + nm(c[0]) + ") + " + nm(c[1]) + " = " + nm(2 * c[0] + c[1]) + "$ dollars." : null }; },
        hints: ["Any point in the shaded region, or on the line."], why: "Points in the shaded region (or on the solid line) are combinations she can afford, such as 2 chips and 3 drinks for \\$7." }
    ]
  });

  /* ============================================ 2.12 · Inequalities as constraints */
  LESSONS.push({
    title: "Using linear inequalities as constraints",
    blurb: "Book 2.12 · Read the region as a set of possible plans, and ask which ones make sense.",
    mins: 8, v: 20,
    steps: [
      { type: "choice", kicker: "Try it",
        prompt: "A bakery has **30 hours** of oven time. Bread takes 2 hours a batch ($x$) and cake 3 hours a batch ($y$): $2x + 3y \\le 30$. Can it bake 6 batches of each?",
        options: [{ t: "Yes, using all 30 hours exactly." },
                  { t: "No: that's 12 batches, more than 30 hours.", fb: "Count hours, not batches: $2(6) + 3(6) = 30$." },
                  { t: "Yes, with 6 hours to spare.", fb: "$12 + 18 = 30$. No hours are left." }],
        answer: 0, skill: "Constraints in context", hints: ["Work out $2(6) + 3(6)$."], why: "$12 + 18 = 30 \\le 30$ ✓. The plan $(6, 6)$ is on the boundary." },
      { type: "learn", kicker: "See it", prompt: "Each point is a plan. Drag $P$ and watch the oven hours.",
        scene: { type: "plane", x: [0, 16], y: [0, 12], axisLabels: ["bread", "cake"], gate: true,
          fns: [{ f: "(30 - 2*x)/3", color: "blue", shade: "below", domain: [0, 15] }],
          points: [{ id: "P", x: 3, y: 2, drag: true, label: "P" }],
          readout: function (st) { var p = st.pt("P"), h = 2 * p.x + 3 * p.y; return "Oven hours: $2(" + nm(p.x) + ") + 3(" + nm(p.y) + ") = " + nm(h) + "$ " + (h <= 30 ? "✓ fits" : "✗ too many"); } },
        gate: true,
        then: "Every point in the shaded region is a plan the oven can handle. Points on the line use all 30 hours. Points above it need more time than there is." },
      { type: "multi", prompt: "Which plans $(x, y)$ meet the oven constraint **and make sense**?",
        options: [{ t: "$(0, 10)$", ok: true }, { t: "$(15, 0)$", ok: true }, { t: "$(9, 4)$", ok: true },
                  { t: "$(5, 7)$", fb: "$10 + 21 = 31$ hours: one too many." },
                  { t: "$(-3, 12)$", fb: "$-6 + 36 = 30$ fits the inequality, but a negative number of batches is impossible." }],
        skill: "Constraints in context", hints: ["Check the hours, then check that the numbers are possible."],
        why: "$(0, 10)$: 30 h. $(15, 0)$: 30 h. $(9, 4)$: 30 h. A plan can satisfy the inequality and still be impossible." },
      { type: "learn", kicker: "Name it",
        prompt: "A situation brings **hidden constraints** the inequality doesn't show. Here, batches can't be negative ($x \\ge 0$, $y \\ge 0$), and may need to be whole numbers. The sensible plans are only part of the half-plane." },
      { type: "choice", kicker: "Vary it", prompt: "The plan $(4.5, 7)$ satisfies $2x + 3y \\le 30$. Is it a good plan?",
        options: [{ t: "Only if half a batch of bread makes sense." },
                  { t: "No, it breaks the inequality.", fb: "$9 + 21 = 30$. It's on the boundary, so it satisfies it." },
                  { t: "Yes, always.", fb: "The maths allows it. Whether a half batch is possible is a question about the bakery." }],
        answer: 0, skill: "Constraints in context", hints: ["Does the inequality hold? Then: does 4.5 batches make sense?"],
        why: "Mathematically it's a solution. In context, you decide whether fractions of a batch are allowed." },
      { type: "num", prompt: "If the bakery makes **no cake**, what is the most bread it can bake?", answer: 15, skill: "Constraints in context",
        near: [{ v: 10, fb: "That's the most *cake* with no bread." }],
        hints: ["Put $y = 0$: $2x \\le 30$."], why: "$2x \\le 30$, so $x \\le 15$. That's where the boundary meets the bread axis." },
      { type: "choice", kicker: "Use it", prompt: "What does the point $(0, 10)$ on the boundary mean?",
        options: [{ t: "10 batches of cake and no bread use all 30 hours." },
                  { t: "10 batches of bread use 30 hours.", fb: "The first coordinate is bread: 0. The second is cake: 10." },
                  { t: "The oven is free for 10 hours.", fb: "On the boundary, every hour is used." }],
        answer: 0, skill: "Constraints in context", hints: ["$(x, y)$ = (bread, cake)."], why: "$2(0) + 3(10) = 30$: all cake, no bread, oven full." }
    ]
  });

  /* ============================================ 2.13 · Problems in two variables */
  LESSONS.push({
    title: "Solving problems with inequalities in two variables",
    blurb: "Book 2.13 · Write the inequality, graph it with its intercepts, and read off what's possible.",
    mins: 8, v: 20,
    steps: [
      { type: "choice", kicker: "Try it",
        prompt: "A play must take **at least \\$2,400**. Adult tickets are \\$12 ($a$) and student tickets \\$8 ($s$). Which inequality fits?",
        options: [{ t: "$12a + 8s \\ge 2400$" },
                  { t: "$12a + 8s \\le 2400$", fb: "That says *at most* \\$2,400." },
                  { t: "$20(a + s) \\ge 2400$", fb: "Each kind of ticket has its own price: $12a$ and $8s$." }],
        answer: 0, skill: "Inequalities in two variables", hints: ["Money from adults plus money from students."],
        why: "$12a + 8s$ is the takings, and it must be \\$2,400 or more." },
      { type: "num", prompt: "If **100 adult** tickets are sold, what is the **fewest** student tickets needed?", answer: 150, skill: "Inequalities in two variables",
        near: [{ v: 300, fb: "That's with no adult tickets. 100 adults already bring in \\$1,200." }, { v: 1200, fb: "That's the money still needed. Each student ticket brings \\$8." }],
        hints: ["$12(100) + 8s \\ge 2400$."], why: lines(["1200 + 8s \\ge 2400", "8s \\ge 1200", "s \\ge 150"]) },
      { type: "learn", kicker: "See it", prompt: "Drag $P$. The boundary is where takings are exactly \\$2,400.",
        scene: { type: "plane", x: [0, 260], y: [0, 360], grid: 20, labelEvery: 50, labelEveryY: 50, axisLabels: ["adults", "students"], gate: true,
          fns: [{ f: "(2400 - 12*x)/8", color: "green", shade: "above" }],
          points: [{ id: "P", x: 60, y: 100, drag: true, snap: 10, label: "P" }],
          readout: function (st) { var p = st.pt("P"), t = 12 * p.x + 8 * p.y; return "Takings: \\$" + t.toLocaleString("en-US") + " " + (t >= 2400 ? "✓" : "✗ short"); } },
        gate: true,
        then: "The boundary crosses the axes at $(200, 0)$ and $(0, 300)$: all adults, or all students. Two **intercepts** are the quickest way to draw it. Every point on or above it reaches the target." },
      { type: "num", kicker: "Name it", prompt: "Check the first intercept: with **no student** tickets, how many adult tickets reach \\$2,400 exactly?", answer: 200, skill: "Inequalities in two variables",
        hints: ["Put $s = 0$: $12a = 2400$."], why: "$a = 2400 \\div 12 = 200$. The intercept $(200, 0)$." },
      { type: "choice", prompt: "Is selling 150 adult and 100 student tickets enough?",
        options: [{ t: "Yes: \\$2,600." }, { t: "No: \\$2,250.", fb: "$12(150) = 1800$ and $8(100) = 800$. Add them." }, { t: "Exactly \\$2,400.", fb: "$1800 + 800 = 2600$." }],
        answer: 0, skill: "Inequalities in two variables", hints: ["$12(150) + 8(100)$."], why: "$1800 + 800 = 2600 \\ge 2400$ ✓. The point $(150, 100)$ is in the shaded region." },
      { type: "choice", kicker: "Vary it", prompt: "Solving $12a + 8s \\ge 2400$ for $s$ gives which inequality?",
        options: [{ t: "$s \\ge 300 - 1.5a$" },
                  { t: "$s \\le 300 - 1.5a$", fb: "You divided by $+8$, so the sign stays as it was." },
                  { t: "$s \\ge 2400 - 12a$", fb: "Divide every term by 8 as well." }],
        answer: 0, skill: "Inequalities in two variables", hints: ["Subtract $12a$, then divide by 8."],
        why: "$8s \\ge 2400 - 12a$, so $s \\ge 300 - 1.5a$. Now it's in $y \\ge mx + b$ form: shade above." },
      { type: "num", kicker: "Use it",
        prompt: "Leo runs at 10 minutes a mile ($r$) and walks at 20 minutes a mile ($w$). He has **at most 60 minutes**: $10r + 20w \\le 60$. If he walks **1 mile**, what is the most he can run?",
        answer: 4, skill: "Inequalities in two variables",
        near: [{ v: 6, fb: "That's with no walking. The 1-mile walk takes 20 minutes." }],
        hints: ["$10r + 20(1) \\le 60$."], why: lines(["10r + 20 \\le 60", "10r \\le 40", "r \\le 4"]) }
    ]
  });

  /* ============================================ 2.14 · Systems of inequalities */
  LESSONS.push({
    title: "Solutions to systems of linear inequalities",
    blurb: "Book 2.14 · Where two shaded regions overlap, both constraints hold.",
    mins: 8, v: 20,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "**Click a point** that makes both $y > x - 2$ and $y \\le -x + 4$ true.",
        x: [-4, 8], y: [-4, 8], click: "point", answer: { point: [0, 0] }, skill: "Systems of inequalities",
        fns: [{ f: "x - 2", color: "green", shade: "above", strict: true }, { f: "-x + 4", color: "blue", shade: "below" }],
        check: function (st) { var c = st.clicked; if (!c) return { ok: false }; var a = c[1] > c[0] - 2, b = c[1] <= -c[0] + 4; return a && b ? { ok: true } : { ok: false, say: !a && !b ? "Neither inequality is true there." : !a ? "That breaks $y > x - 2$." : "That breaks $y \\le -x + 4$." }; },
        hints: ["Look for where the two shadings overlap."], why: "Any point in the overlap works, such as $(0, 0)$: $0 > -2$ and $0 \\le 4$." },
      { type: "learn", kicker: "See it", prompt: "Drag $P$ through each region. Watch both checks.",
        scene: { type: "plane", x: [-4, 8], y: [-4, 8], gate: true,
          fns: [{ f: "x - 2", color: "green", shade: "above", strict: true }, { f: "-x + 4", color: "blue", shade: "below" }],
          points: [{ id: "P", x: 5, y: 5, drag: true, label: "P" }],
          readout: function (st) { var p = st.pt("P"); return "$y > x - 2$: " + (p.y > p.x - 2 ? "✓" : "✗") + " &nbsp; $y \\le -x + 4$: " + (p.y <= -p.x + 4 ? "✓" : "✗"); } },
        gate: true,
        then: "The **solution of a system of inequalities** is the region where every inequality is true: the **overlap** of the shaded half-planes." },
      { type: "choice", prompt: "Is $(3, 0)$ a solution of the system $y > x - 2$ and $y \\le -x + 4$?",
        options: [{ t: "No: $0 > 3 - 2$ is false." },
                  { t: "Yes: it works in the second inequality.", fb: "One is not enough. $0 > 1$ is false, so it fails the first." },
                  { t: "Yes: it works in both.", fb: "Check the first: is $0 > 1$?" }],
        answer: 0, skill: "Systems of inequalities", hints: ["Test the point in both inequalities."],
        why: "$0 \\le 1$ ✓ but $0 > 1$ ✗. It must pass every test." },
      { type: "sort", kicker: "Vary it", prompt: "System: $x + y \\le 5$ and $y \\ge 1$. Sort the points.",
        bins: ["Solution", "Not a solution"],
        cards: [{ t: "$(1, 1)$", bin: 0, fb: "$2 \\le 5$ and $1 \\ge 1$: on a solid boundary counts." },
                { t: "$(2, 2)$", bin: 0, fb: "$4 \\le 5$ and $2 \\ge 1$." },
                { t: "$(4, 2)$", bin: 1, fb: "$4 + 2 = 6$, which is more than 5." },
                { t: "$(0, 0)$", bin: 1, fb: "$y = 0$ fails $y \\ge 1$." },
                { t: "$(0, 5)$", bin: 0, fb: "$5 \\le 5$ and $5 \\ge 1$." }],
        skill: "Systems of inequalities", hints: ["Test each point in both."], why: "Only points passing both tests are in the overlap." },
      { type: "choice", prompt: "Which system is graphed?",
        scene: { type: "plane", x: [-5, 5], y: [-5, 5], fns: [{ f: "2*x", color: "blue", shade: "below" }, { f: "-1", color: "green", shade: "above", strict: true }] },
        options: [{ t: "$y \\le 2x$ and $y > -1$" },
                  { t: "$y \\ge 2x$ and $y > -1$", fb: "The blue shading is *below* $y = 2x$." },
                  { t: "$y \\le 2x$ and $y \\ge -1$", fb: "The line $y = -1$ is dashed: strict." }],
        answer: 0, skill: "Systems of inequalities", hints: ["Read each line: solid or dashed, above or below."],
        why: "Solid $y = 2x$ shaded below: $y \\le 2x$. Dashed $y = -1$ shaded above: $y > -1$." },
      { type: "plane", kicker: "Use it", prompt: "Three constraints: $x \\ge 1$, $y \\ge 2$ and $x + y \\le 7$. They fence in a triangle. **Click a point inside it.**",
        x: [-1, 8], y: [-1, 8], click: "point", answer: { point: [2, 3] }, skill: "Systems of inequalities",
        fns: [{ f: "2", color: "green", shade: "above" }, { f: "7 - x", color: "blue", shade: "below" }], vline: [1],
        check: function (st) { var c = st.clicked; return c && c[0] >= 1 && c[1] >= 2 && c[0] + c[1] <= 7 ? { ok: true } : { ok: false, say: c ? "Check each: $x \\ge 1$? $y \\ge 2$? $x + y \\le 7$?" : null }; },
        hints: ["Right of the red line, above the green one, below the blue one."], why: "Points like $(2, 3)$: $2 \\ge 1$, $3 \\ge 2$, $5 \\le 7$." }
    ]
  });

  /* ============================================ 2.15 · Problems with systems of inequalities */
  LESSONS.push({
    title: "Solving problems with systems of linear inequalities",
    blurb: "Book 2.15 · Every constraint at once: the feasible region, and the best plan in it.",
    mins: 9, v: 20,
    steps: [
      { type: "multi", kicker: "Try it",
        prompt: "Ava makes bracelets ($b$) and necklaces ($n$). She has **14 hours**: $b + 2n \\le 14$. She has **\\$30** of beads: $3b + 2n \\le 30$. Which plans $(b, n)$ fit both?",
        options: [{ t: "$(4, 4)$", ok: true }, { t: "$(8, 3)$", ok: true }, { t: "$(10, 0)$", ok: true },
                  { t: "$(6, 5)$", fb: "Hours: $6 + 10 = 16$. Too many." },
                  { t: "$(9, 3)$", fb: "Hours: $9 + 6 = 15$. One too many." }],
        skill: "Systems of inequalities in context", hints: ["Test each plan for hours and for beads."],
        why: "$(4, 4)$: 12 h, \\$20. $(8, 3)$: 14 h, \\$30. $(10, 0)$: 10 h, \\$30. All fit." },
      { type: "learn", kicker: "See it", prompt: "Drag $P$ around the region where both constraints hold.",
        scene: { type: "plane", x: [0, 12], y: [0, 9], axisLabels: ["b", "n"], gate: true,
          fns: [{ f: "(14 - x)/2", color: "blue", shade: "below", domain: [0, 14] }, { f: "(30 - 3*x)/2", color: "green", shade: "below", domain: [0, 10] }],
          points: [{ id: "P", x: 2, y: 2, drag: true, label: "P" }],
          readout: function (st) { var p = st.pt("P"), h = p.x + 2 * p.y, c = 3 * p.x + 2 * p.y; return "Hours $" + nm(h) + "$ " + (h <= 14 ? "✓" : "✗") + " &nbsp; Beads \\$" + nm(c) + " " + (c <= 30 ? "✓" : "✗"); } },
        gate: true,
        then: "The darker overlap, where both checks pass and $b \\ge 0$, $n \\ge 0$, is the **feasible region**: every plan that meets all the constraints. Its corners are where the boundaries meet." },
      { type: "pair", prompt: "Find the corner where both boundaries meet." + sys("b + 2n = 14", "3b + 2n = 30"),
        answer: [8, 3], skill: "Systems of inequalities in context",
        hints: ["Subtract the first equation from the second: $2b = 16$."], why: lines(["2b = 16", "b = 8", "8 + 2n = 14", "n = 3"]) },
      { type: "num", kicker: "Vary it",
        prompt: "Ava earns \\$5 a bracelet and \\$8 a necklace. The region's corners are $(0, 0)$, $(10, 0)$, $(8, 3)$ and $(0, 7)$. What is the **most** she can earn?",
        pre: "$\\$$", answer: 64, skill: "Systems of inequalities in context",
        near: [{ v: 56, fb: "That's $(0, 7)$. Try the corner $(8, 3)$ too." }, { v: 50, fb: "That's $(10, 0)$. Check every corner." }],
        hints: ["Work out $5b + 8n$ at each corner."], why: "$(10, 0)$: \\$50. $(8, 3)$: \\$64. $(0, 7)$: \\$56. The best plan is 8 bracelets and 3 necklaces." },
      { type: "choice", prompt: "A shop asks Ava for **at least 2 necklaces**. Which constraint joins the system?",
        options: [{ t: "$n \\ge 2$" }, { t: "$n \\le 2$", fb: "“At least 2” means 2 or more." }, { t: "$b \\ge 2$", fb: "Necklaces are $n$." }],
        answer: 0, skill: "Systems of inequalities in context", hints: ["Which letter is necklaces? “At least” is $\\ge$."],
        why: "$n \\ge 2$ slices off the bottom of the region. $(8, 3)$ still fits." },
      { type: "explain", kicker: "Use it",
        prompt: "Pick a point **inside** Ava's feasible region and one **outside** it. In a sentence each, say what the plan is and why it does or doesn't work.",
        placeholder: "e.g. (5, 2): 5 bracelets, 2 necklaces — 9 hours and 19 dollars of beads, both within the limits…",
        model: "Inside: (5, 2) is 5 bracelets and 2 necklaces. It takes 9 hours (≤ 14) and \\$19 of beads (≤ 30), so it works. Outside: (10, 3) takes 16 hours, more than she has, even though it would earn more." }
    ]
  });

  /* ============================================ Project 2 */
  LESSONS.push({
    title: "Project: Modelling with systems of inequalities",
    blurb: "Book Project 2 · Plan a bake sale: write the constraints, find the corner, and choose the best plan.",
    mins: 10, v: 20,
    steps: [
      { type: "learn", kicker: "The brief",
        prompt: "Your class runs a bake sale. A dozen cookies ($c$) takes **1 hour** and costs **\\$3** to make. A tray of brownies ($b$) takes **2 hours** and costs **\\$2**. You have **10 hours** and **\\$18**." },
      { type: "multi", prompt: "Which inequalities belong in the system?",
        options: [{ t: "$c + 2b \\le 10$", ok: true }, { t: "$3c + 2b \\le 18$", ok: true }, { t: two("c \\ge 0", "b \\ge 0"), ok: true },
                  { t: "$2c + b \\le 10$", fb: "Cookies take 1 hour and brownies 2: $c + 2b$." },
                  { t: "$3c + 2b \\ge 18$", fb: "The money is a limit: at most \\$18." }],
        skill: "Systems of inequalities in context", hints: ["One inequality for time, one for money, and no negative amounts."],
        why: "Time $c + 2b \\le 10$, money $3c + 2b \\le 18$, and neither amount can be negative." },
      { type: "pair", prompt: "Where do the time and money boundaries cross? Give $(c, b)$." + sys("c + 2b = 10", "3c + 2b = 18"),
        answer: [4, 3], skill: "Systems of inequalities in context",
        near: [{ v: [3, 4], fb: "Cookies first: $(c, b)$." }],
        hints: ["Subtract the first equation from the second: $2c = 8$."],
        why: lines(["2c = 8", "c = 4", "4 + 2b = 10", "b = 3"]) },
      { type: "explain", kicker: "Make it yours",
        prompt: "Cookies sell for \\$10 a dozen and brownies for \\$12 a tray. Choose a whole-number plan inside the region. Explain why it meets every constraint, and why you think it's a good plan.",
        placeholder: "e.g. 4 dozen cookies and 3 trays: 10 hours, 18 dollars — right on both limits, and it sells for…",
        model: "4 dozen cookies and 3 trays of brownies: time $4 + 6 = 10 \\le 10$, cost $12 + 6 = 18 \\le 18$, both non-negative. It sells for $40 + 36 = 76$ dollars. Comparing the corners of the region, $(0, 5)$ makes 60 and $(6, 0)$ makes 60, so the crossing point is the best plan." }
    ]
  });
  /* ================================================================ Skills
     Practice that generates a fresh problem every sitting, with hints, a
     worked solution and a reply for each slip this unit is known for. The
     quizzes and the unit test draw from these. */
  function std(a, b, c) { return poly([[a, "x"], [b, "y"]]) + " = " + c; }
  var REL = { "<": "<", "<=": "\\le", ">": ">", ">=": "\\ge" }, FLIP = { "<": ">", "<=": ">=", ">": "<", ">=": "<=" };
  function holds(l, rel, r) { return rel === "<" ? l < r : rel === "<=" ? l <= r : rel === ">" ? l > r : l >= r; }
  var KEYS_INEQ = [["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="], ["$-$", "-"], ["$+$", "+"]];

  var SKILLS = [
    { id: "u2-check", title: "Check a solution of a system", lesson: 1,
      gen: function (R) {
        var x0 = R.int(-4, 5), y0 = R.int(-4, 5), a1 = R.int(1, 4), b1 = R.nz(-3, 3), a2 = R.int(1, 4), b2 = R.nz(-3, 3);
        if (a1 * b2 === a2 * b1) { a2 = a1 + 1; b2 = -b1; }
        var c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0, kind = R.int(0, 2);
        var p = kind === 0 ? [x0, y0] : kind === 1 ? [x0 + b1, y0 - a1] : [x0 + b2, y0 - a2];
        var v1 = a1 * p[0] + b1 * p[1], v2 = a2 * p[0] + b2 * p[1];
        var names = ["Yes, it works in both equations.", "No, it only works in the first.", "No, it only works in the second."];
        var say = "The first left side comes to $" + v1 + "$ (it should be $" + c1 + "$). The second comes to $" + v2 + "$ (it should be $" + c2 + "$).";
        return mc(R, { prompt: "Is $(" + p[0] + ", " + p[1] + ")$ a solution of this system?" + sys(std(a1, b1, c1), std(a2, b2, c2)),
          right: names[kind], wrong: names.filter(function (t, i) { return i !== kind; }).map(function (t) { return { t: t, fb: say }; }),
          keep: true, hints: ["Put the $x$ and $y$ values into each equation, one at a time."], why: say + " A solution must make *both* true." });
      } },
    { id: "u2-graph", title: "Solve a system from its graph", lesson: 2,
      gen: function (R) {
        var x0 = R.int(-3, 3), y0 = R.int(-3, 3), ms = R.shuffle([-2, -1, 1, 2, 3]), m1 = ms[0], m2 = ms[1], b1 = y0 - m1 * x0, b2 = y0 - m2 * x0;
        return { type: "plane", prompt: "Click the solution of the system." + sys("y = " + poly([[m1, "x"], [b1, ""]]), "y = " + poly([[m2, "x"], [b2, ""]])),
          x: [-8, 8], y: [-8, 8], click: "point", answer: { point: [x0, y0] },
          fns: [{ f: function (x) { return m1 * x + b1; }, color: "blue" }, { f: function (x) { return m2 * x + b2; }, color: "green" }],
          clickFb: function (c) { return "At $x = " + nm(c[0]) + "$ the lines are at $y = " + nm(m1 * c[0] + b1) + "$ and $y = " + nm(m2 * c[0] + b2) + "$. Find where they agree."; },
          hints: ["The solution is the point on both lines."], why: "The lines cross at $(" + x0 + ", " + y0 + ")$. Check: it makes both equations true." };
      } },
    { id: "u2-subst", title: "Solve by substitution", lesson: 3,
      gen: function (R) {
        var x0 = R.int(-4, 5), y0, m = R.nz(-3, 3), b = R.int(-5, 5), a = R.int(1, 4), c = R.nz(-3, 3);
        if (a + c * m === 0) a += 1;
        y0 = m * x0 + b;
        var d = a * x0 + c * y0, inner = poly([[m, "x"], [b, ""]]);
        var subbed = poly([[a, "x"]]) + (c < 0 ? " - " : " + ") + (Math.abs(c) === 1 ? "" : Math.abs(c)) + "(" + inner + ") = " + d;
        return { type: "pair", prompt: "Solve by substitution." + sys("y = " + inner, std(a, c, d)), answer: [x0, y0],
          hints: ["Replace $y$ in the second equation with $(" + inner + ")$.", "$" + subbed + "$"],
          why: lines([subbed, poly([[a + c * m, "x"]]) + " = " + (d - c * b), "x = " + x0, "y = " + L.sub(inner, { x: x0 }) + " = " + y0]) };
      } },
    { id: "u2-elim", title: "Solve by adding or subtracting", lesson: 4,
      gen: function (R) {
        var x0 = R.int(-4, 5), y0 = R.int(-4, 5), a1 = R.int(1, 5), a2 = R.int(1, 5), b = R.int(1, 4), add = R.chance(0.5);
        if (!add && a1 === a2) a1 += 1;
        var b2 = add ? -b : b, c1 = a1 * x0 + b * y0, c2 = a2 * x0 + b2 * y0, k = add ? a1 + a2 : a1 - a2, r = add ? c1 + c2 : c1 - c2;
        return { type: "pair", prompt: "Solve by elimination." + sys(std(a1, b, c1), std(a2, b2, c2)), answer: [x0, y0],
          hints: [add ? "The $y$ terms are opposites. Add the equations." : "The $y$ terms match. Subtract the second equation from the first."],
          why: (add ? "Add: " : "Subtract: ") + lines([poly([[k, "x"]]) + " = " + r, "x = " + x0, L.sub(poly([[a1, "x"]]), { x: x0 }) + " " + signed(b) + "y = " + c1, "y = " + y0]) };
      } },
    { id: "u2-elim-mult", title: "Solve by multiplying, then eliminating", lesson: 6,
      gen: function (R) {
        var x0 = R.int(-3, 4), y0 = R.int(-3, 4), a1 = R.int(1, 4), a2 = R.int(1, 4), b1 = R.pick([1, -1, 2]), k = R.int(2, 4), b2 = -k * b1;
        var c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
        return { type: "pair", prompt: "Solve by elimination." + sys(std(a1, b1, c1), std(a2, b2, c2)), answer: [x0, y0],
          hints: ["Multiply the first equation by " + k + " so the $y$ terms are opposites.", "$" + std(k * a1, k * b1, k * c1) + "$. Now add."],
          why: "Multiply the first by " + k + ", then add:<br>" + lines([std(k * a1, k * b1, k * c1), poly([[k * a1 + a2, "x"]]) + " = " + (k * c1 + c2), "x = " + x0, "y = " + y0]) };
      } },
    { id: "u2-story", title: "Solve a problem with a system", lesson: 6,
      gen: function (R) {
        var pr = R.pick([[7, 4], [9, 5], [12, 8], [10, 6], [6, 3]]), n = R.int(12, 40), a = R.int(3, n - 3), tot = pr[0] * a + pr[1] * (n - a);
        var T = R.pick([{ s: "A show sold " + n + " tickets. Adult tickets cost \\$" + pr[0] + " and child tickets \\$" + pr[1] + ". The total was \\$" + tot + ". How many **adult** tickets were sold?", o: "child tickets" },
                        { s: "A shop packed " + n + " boxes. Large boxes hold " + pr[0] + " mugs and small boxes hold " + pr[1] + ". Altogether they hold " + tot + " mugs. How many **large** boxes?", o: "small boxes" }]);
        return { type: "num", prompt: T.s, answer: a, near: near(a, [{ v: n - a, fb: "That's the number of " + T.o + "." }]),
          hints: ["Two equations: $x + y = " + n + "$ and $" + pr[0] + "x + " + pr[1] + "y = " + tot + "$.", "Multiply the first by " + pr[1] + " and subtract."],
          why: lines([pr[1] + "x + " + pr[1] + "y = " + pr[1] * n, (pr[0] - pr[1]) + "x = " + (tot - pr[1] * n), "x = " + a]) };
      } },
    { id: "u2-count", title: "Number of solutions of a system", lesson: 7,
      gen: function (R) {
        var kind = R.int(0, 2), e1, e2, why, names = ["Exactly one", "None", "Infinitely many"];
        if (R.chance(0.5)) {
          var m = R.nz(-4, 4), b = R.int(-6, 6), m2 = kind === 0 ? m + R.pick([-2, -1, 1, 2]) : m, b2 = kind === 2 ? b : b + R.nz(-4, 4);
          e1 = "y = " + poly([[m, "x"], [b, ""]]);
          e2 = kind === 2 ? "2y = " + poly([[2 * m, "x"], [2 * b, ""]]) : "y = " + poly([[m2, "x"], [b2, ""]]);
          why = kind === 0 ? "The slopes are different, so the lines cross once." : kind === 1 ? "Same slope, different intercepts: parallel lines never meet." : "Halve the second equation and it is the first: one line, written twice.";
        } else {
          var p = R.int(1, 4), q = R.nz(-3, 3), c = R.int(-6, 9), k = R.int(2, 3);
          e1 = std(p, q, c);
          e2 = kind === 0 ? std(p + 1, -q, c + R.int(0, 3)) : kind === 1 ? std(k * p, k * q, k * c + R.nz(-3, 3)) : std(k * p, k * q, k * c);
          why = kind === 0 ? "The coefficients are not in the same ratio, so the lines have different slopes and cross once." : kind === 1 ? "The left side is " + k + " times the first, but the right side isn't. The lines are parallel." : "The second equation is the first multiplied by " + k + ": the same line.";
        }
        return mc(R, { prompt: "How many solutions does the system have?" + sys(e1, e2), right: names[kind],
          wrong: names.filter(function (t, i) { return i !== kind; }).map(function (t) { return { t: t, fb: why }; }),
          keep: true, hints: ["Compare the slopes. If they match, compare the intercepts."], why: why });
      } },
    { id: "u2-ineq-write", title: "Write an inequality for a situation", lesson: 8,
      gen: function (R) {
        var r = R.pick([4, 5, 8, 12, 15]), f = R.pick([10, 20, 25, 30, 40]), T = r * R.int(8, 20) + f, v = R.pick(["n", "w", "c"]);
        var S = R.pick([{ s: "A club buys $" + v + "$ shirts at \\$" + r + " each, plus a \\$" + f + " set-up fee. It can spend **at most** \\$" + T + ".", rel: "<=" },
                        { s: "Sam has \\$" + f + " and saves \\$" + r + " a week for $" + v + "$ weeks. Sam needs **at least** \\$" + T + ".", rel: ">=" },
                        { s: "A van already carries " + f + " kg. Each of $" + v + "$ crates adds " + r + " kg. The load must stay **under** " + T + " kg.", rel: "<" }]);
        var lhs = r + v + "+" + f, soft = { "<=": "<", ">=": ">", "<": "<=" }[S.rel];
        return { type: "ineq", prompt: S.s + " Write the inequality.", answer: lhs + S.rel + T, variable: v, shown: r + v + " + " + f + " " + S.rel.replace("<=", "≤").replace(">=", "≥") + " " + T,
          near: [{ v: lhs + soft + T, fb: "Check the boundary: is exactly " + T + " allowed?" }, { v: lhs + FLIP[S.rel] + T, fb: "That points the wrong way. Read the phrase in bold again." }],
          keys: [["$" + v + "$", v]].concat(KEYS_INEQ), placeholder: "Use " + v,
          hints: ["The amount is $" + r + v + " + " + f + "$. Now choose the symbol."], why: "$" + r + v + " + " + f + " " + REL[S.rel] + " " + T + "$." };
      } },
    { id: "u2-ineq-line", title: "Graph an inequality on a number line", lesson: 9,
      gen: function (R) {
        var c = R.int(-5, 5), rel = R.pick(["<", "<=", ">", ">="]), right = rel.charAt(0) === ">", closed = rel.length === 2;
        return { type: "numberline", prompt: "Graph $x " + REL[rel] + " " + c + "$.", min: c - 6, max: c + 6, mode: "ray", variable: "x",
          ray: { at: c + R.pick([-3, 2, 4]), dir: right ? "left" : "right", closed: !closed }, answer: { at: c, dir: right ? "right" : "left", closed: closed },
          hints: ["Is $" + c + "$ itself included? Filled if yes, open if no.", "Greater: shade right. Less: shade left."],
          why: (closed ? "A filled circle" : "An open circle") + " at $" + c + "$, shaded to the " + (right ? "right" : "left") + "." };
      } },
    { id: "u2-ineq-solve", title: "Solve an inequality", lesson: 10,
      gen: function (R) {
        var a = R.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]), b = R.nz(-9, 9), x0 = R.int(-6, 6), rel = R.pick(["<", "<=", ">", ">="]), c = a * x0 + b;
        var out = a < 0 ? FLIP[rel] : rel;
        return { type: "ineq", prompt: "Solve for $x$. $$" + poly([[a, "x"], [b, ""]]) + " " + REL[rel] + " " + c + "$$", answer: "x" + out + x0, variable: "x",
          shown: "x " + out.replace("<=", "≤").replace(">=", "≥") + " " + x0,
          near: a < 0 ? [{ v: "x" + rel + x0, fb: "You divided by $" + a + "$, a negative number. That reverses the inequality." }] : [{ v: "x" + FLIP[rel] + x0, fb: "You divided by a positive number, so the sign stays as it was." }],
          hints: [(b < 0 ? "Add " + -b : "Subtract " + b) + " on both sides.", "Divide by $" + a + "$." + (a < 0 ? " Dividing by a negative flips the sign." : "")],
          why: lines([poly([[a, "x"]]) + " " + REL[rel] + " " + (c - b), "x " + REL[out] + " " + x0]) + (a < 0 ? "<br>The sign flipped because you divided by a negative." : "") };
      } },
    { id: "u2-ineq2-test", title: "Test a point in an inequality", lesson: 11,
      gen: function (R) {
        var a = R.int(1, 4), b = R.nz(-3, 3), p = R.int(-4, 5), q = R.int(-4, 5), rel = R.pick(["<", "<=", ">", ">="]), v = a * p + b * q, c = v + R.pick([-2, -1, 0, 0, 1, 2]);
        var ok = holds(v, rel, c), say = "$" + L.sub(poly([[a, "x"], [b, "y"]]), { x: p, y: q }) + " = " + v + "$, and $" + v + " " + REL[rel] + " " + c + "$ is " + (ok ? "true" : "false") + ".";
        return mc(R, { prompt: "Is $(" + p + ", " + q + ")$ a solution of $" + poly([[a, "x"], [b, "y"]]) + " " + REL[rel] + " " + c + "$?",
          right: ok ? "Yes" : "No", wrong: [{ t: ok ? "No" : "Yes", fb: say }], keep: true,
          hints: ["Put $x = " + p + "$ and $y = " + q + "$ into the left side, then compare with " + c + "."], why: say });
      } },
    { id: "u2-ineq2-read", title: "Read an inequality from its graph", lesson: 11,
      gen: function (R) {
        var m = R.pick([-2, -1, 1, 2]), b = R.int(-2, 2), rel = R.pick(["<", "<=", ">", ">="]), rhs = poly([[m, "x"], [b, ""]]);
        var above = rel.charAt(0) === ">", strict = rel.length === 1;
        return mc(R, { prompt: "Which inequality is graphed?",
          scene: { type: "plane", x: [-6, 6], y: [-6, 6], fns: [{ f: function (x) { return m * x + b; }, color: "blue", shade: above ? "above" : "below", strict: strict }] },
          right: "$y " + REL[rel] + " " + rhs + "$",
          wrong: ["<", "<=", ">", ">="].filter(function (r) { return r !== rel; }).map(function (r) {
            return { t: "$y " + REL[r] + " " + rhs + "$", fb: (r.charAt(0) === ">") !== above ? "Look at which side is shaded: " + (above ? "above" : "below") + " the line." : "Look at the line: it is " + (strict ? "dashed, so it is not included." : "solid, so it is included.") }; }),
          hints: ["Dashed or solid? Shaded above or below?"],
          why: "The line is " + (strict ? "dashed (strict)" : "solid (or equal to)") + " and the shading is " + (above ? "above" : "below") + ": $y " + REL[rel] + " " + rhs + "$." });
      } },
    { id: "u2-sysineq", title: "Solve a system of inequalities", lesson: 14,
      gen: function (R) {
        var m1 = R.pick([1, 2]), b1 = R.int(-2, 0), m2 = R.pick([-1, -2]), b2 = R.int(2, 4), pick = null;
        function ok(c) { return c[1] >= m1 * c[0] + b1 && c[1] < m2 * c[0] + b2; }
        for (var x = -3; x <= 3 && !pick; x++) for (var y = -5; y <= 5 && !pick; y++) if (y > m1 * x + b1 && y < m2 * x + b2 - 1) pick = [x, y];
        var i1 = "y \\ge " + poly([[m1, "x"], [b1, ""]]), i2 = "y < " + poly([[m2, "x"], [b2, ""]]);
        return { type: "plane", prompt: "Click a point that satisfies both inequalities." + sys(i1, i2), x: [-6, 6], y: [-6, 6], click: "point", answer: { point: pick },
          fns: [{ f: function (x2) { return m1 * x2 + b1; }, color: "green", shade: "above" }, { f: function (x2) { return m2 * x2 + b2; }, color: "blue", shade: "below", strict: true }],
          check: function (st) { var c = st.clicked; return c && ok(c) ? { ok: true } : { ok: false, say: c ? (c[1] >= m1 * c[0] + b1 ? "That point breaks $" + i2 + "$." : "That point breaks $" + i1 + "$.") : null }; },
          hints: ["Look for where the two shaded regions overlap."], why: "Any point in the overlap works, such as $(" + pick[0] + ", " + pick[1] + ")$." };
      } }
  ];
  L.unit("alg", 2, {
    title: "Linear inequalities and systems",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "What a solution of a system is, reading it from a graph, and substitution.",
        skills: ["u2-check", "u2-graph", "u2-subst"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Elimination, with and without multiplying, word problems, and how many solutions a system has.",
        skills: ["u2-elim", "u2-elim-mult", "u2-story", "u2-count"], per: 2 },
      { title: "Quiz 3", after: 10, blurb: "Writing, graphing and solving inequalities in one variable.",
        skills: ["u2-ineq-write", "u2-ineq-line", "u2-ineq-solve"], per: 2 },
      { title: "Quiz 4", after: 15, blurb: "Inequalities in two variables, their graphs, and systems of them.",
        skills: ["u2-ineq2-test", "u2-ineq2-read", "u2-sysineq"], per: 2 }
    ],
    skills: SKILLS
  });
})();
