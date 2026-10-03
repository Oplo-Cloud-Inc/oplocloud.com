/* ==========================================================================
   Algebra II — Unit 11: Conics. See lab/core.js for the format.

   Follows OpenStax Intermediate Algebra 2e, Chapter 11, section for section:
   the readiness check, then 11.1 to 11.5. Each lesson teaches the book's own
   steps: the method, a worked example to watch (the curve is drawn beside it,
   a piece at a time), one done together, then on your own, a harder case,
   find the error, use it, and the concept built at the end.

   Distance and the circle (11.1), parabolas that open sideways (11.2),
   ellipses (11.3), hyperbolas (11.4), and systems in which the graphs are
   curves (11.5).

   Adapted from OpenStax, Intermediate Algebra 2e (Rice University), CC BY-NC-SA 4.0.
   The questions, figures, feedback and every step here are OEdu's own.

   Six lessons, six skills, two quizzes, and the unit test.
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
    blurb: "Book: Chapter 11 Be Prepared · The Pythagorean Theorem, completing the square, and the vertex of a parabola.",
    mins: 6, v: 1,
    steps: [
      { type: "num", kicker: "Check 1 · Right triangles", prompt: "A right triangle has legs of 3 and 4. How long is its hypotenuse?", answer: 5, skill: "Pythagorean Theorem",
        near: [{ v: 7, fb: "The sides are squared before they are added." }, { v: 25, fb: "That is $c^2$. Take the square root." }], hints: ["$3^2 + 4^2 = c^2$."], why: "$9 + 16 = 25$, so $c = 5$." },
      { type: "numbers", prompt: "Solve $x^2 = 16$. Give both solutions.", answer: [-4, 4], skill: "Square Root Property", placeholder: "e.g. −3, 3",
        hints: ["Two numbers square to 16."], why: "$x = \\pm 4$." },
      { type: "num", kicker: "Check 2 · Completing the square", prompt: "Which number completes the square? $$x^2 + 10x + \\square$$", answer: 25, skill: "Completing the square",
        near: [{ v: 5, fb: "Half of 10 is 5. Now square it." }, { v: 100, fb: "Halve the 10 first, then square." }], hints: ["Half of 10, squared."], why: "$5^2 = 25$." },
      { type: "choice", prompt: "Factor $x^2 - 6x + 9$.",
        options: [{ t: "$(x - 3)^2$" }, { t: "$(x + 3)^2$", fb: "The middle term is negative: $-6x$." }, { t: "$(x - 9)(x + 1)$", fb: "That gives a middle term of $-8x$." }],
        answer: 0, skill: "Factor special products", hints: ["A perfect square trinomial."], why: "$(x - 3)(x - 3) = x^2 - 6x + 9$." },
      { type: "choice", kicker: "Check 3 · Parabolas", prompt: "What is the vertex of $y = (x - 2)^2 + 3$?",
        options: [{ t: "$(2, 3)$" }, { t: "$(-2, 3)$", fb: "$(x - 2)^2$ is 0 at $x = 2$." }, { t: "$(3, 2)$", fb: "$h$ comes from inside the parentheses, and it is the $x$-coordinate." }],
        answer: 0, skill: "Vertex form", hints: ["Vertex form is $a(x - h)^2 + k$."], why: "$h = 2$ and $k = 3$." },
      { type: "pair", prompt: "Solve the system. Type the solution as $(x, y)$." + sys("y = x", "x + y = 6"), answer: [3, 3], skill: "Substitution",
        hints: ["Put $x$ in place of $y$: $x + x = 6$."], why: "$2x = 6$, so $x = 3$ and $y = 3$." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 11.1**. If **check 2** slipped, see lesson 9.2: completing the square turns up in every conic. If **check 3** slipped, see lesson 9.7.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  /* ========================== 11.1 · Distance and midpoint formulas; circles */
  var HOW_11_1 = [["Label", "Label the points $(x_1, y_1)$ and $(x_2, y_2)$."],
                  ["Differences", "Subtract the $x$-coordinates, and subtract the $y$-coordinates."],
                  ["Square", "Square both differences, and add them."],
                  ["Root", "Take the square root."]];
  var HOW_11_1C = [["Group", "Group the $x$ terms and the $y$ terms, and move the constant to the right."],
                   ["Complete", "Complete the square for $x$ and for $y$, adding the same numbers to the right side."],
                   ["Factor", "Write each group as a binomial squared: $(x - h)^2 + (y - k)^2 = r^2$."],
                   ["Read", "Read the center $(h, k)$ and the radius $r$."]];
  var W111 = { x: [-3, 5], y: [-1, 7] }, A111 = { pt: [-1, 2], name: "(−1, 2)", at: "sw" }, B111 = { pt: [3, 5], name: "(3, 5)", at: "ne" };
  LESSONS.push({
    title: "Distance, midpoint and circles",
    blurb: "Book 11.1 · The Distance and Midpoint Formulas, and the circle they define.",
    mins: 12, v: 1,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A right triangle has legs of 3 and 4. How long is its hypotenuse?", answer: 5, skill: "Pythagorean Theorem",
        near: [{ v: 7, fb: "Square the legs before adding." }, { v: 25, fb: "That is $c^2$. Take the square root." }], hints: ["$3^2 + 4^2 = c^2$."], why: "$\\sqrt{9 + 16} = 5$." },
      { type: "learn", kicker: "The idea",
        prompt: "The distance between two points is the hypotenuse of a right triangle whose legs are the change in $x$ and the change in $y$. The Pythagorean Theorem gives the **Distance Formula**: $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.",
        scene: { type: "method", how: HOW_11_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the distance between $(-1, 2)$ and $(3, 5)$ found.",
        scene: { type: "walk", how: HOW_11_1, rows: [
          { step: 1, m: "(-1, 2) \\quad (3, 5)", say: "First point, second point.", fig: grid("Two points, (−1, 2) and (3, 5).", [A111, B111], W111) },
          { step: 2, m: "3 - (-1) = 4 \\quad 5 - 2 = 3", say: "The legs of the triangle: 4 across and 3 up.", fig: grid("The two points with the legs of a right triangle between them: 4 right and 3 up.", [{ steps: [[-1, 2], [3, 5]], c: "orange" }, A111, B111], W111),
            ask: { prompt: "What is the change in $x$ from $-1$ to 3?", answer: 0,
                   options: [{ t: "4" }, { t: "2", fb: "Subtracting $-1$ adds 1: $3 - (-1) = 4$." }] } },
          { step: 3, m: "4^2 + 3^2 = 25", say: "Square both legs and add." },
          { step: 4, m: "d = \\sqrt{25} = 5", say: "The hypotenuse is the distance.", fig: grid("The triangle with its hypotenuse drawn: the distance between the points is 5.", [{ steps: [[-1, 2], [3, 5]], c: "orange" }, { seg: [[-1, 2], [3, 5]], c: "blue" }, A111, B111], W111) }] },
        gate: true, then: "A **circle** is every point at one fixed distance, the radius, from a center. That is why its equation looks like the Distance Formula squared." },
      { type: "guided", kicker: "Together",
        prompt: "Now you find the distance between $(2, -3)$ and $(-4, 5)$.",
        how: HOW_11_1, skill: "Distance Formula",
        steps: [
          { step: 1, ask: "Take $(2, -3)$ as the first point. What is $x_2 - x_1$?", type: "num", answer: -6, near: [{ v: 6, fb: "Second minus first: $-4 - 2$." }, { v: -2, fb: "$-4 - 2 = -6$." }], hint: "$-4 - 2$.",
            m: "-4 - 2 = -6", say: "The change in $x$." },
          { step: 2, ask: "What is $y_2 - y_1$, which is $5 - (-3)$?", type: "num", answer: 8, near: [{ v: 2, fb: "Subtracting $-3$ adds 3." }], hint: "$5 + 3$.",
            m: "5 - (-3) = 8", say: "The change in $y$." },
          { step: 3, ask: "Square both and add: $(-6)^2 + 8^2$.", type: "num", answer: 100, near: [{ v: 28, fb: "$(-6)^2 = +36$. A square is positive." }], hint: "$36 + 64$.",
            m: "(-6)^2 + 8^2 = 100", say: "The sign of a difference disappears when it is squared." },
          { step: 4, ask: "Take the square root.", type: "num", pre: "$d =$", answer: 10, hint: "$\\sqrt{100}$.",
            m: "d = \\sqrt{100} = 10", say: "The points are 10 units apart." }],
        why: "Label, differences, square, root. Now a midpoint on your own." },
      { type: "pair", kicker: "On your own", prompt: "The **midpoint** averages the coordinates: $\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)$. Find the midpoint of $(-2, 4)$ and $(6, 10)$.",
        answer: [2, 7], skill: "Midpoint Formula",
        near: [{ v: [4, 3], fb: "That halves the differences. A midpoint is the **average**: add, then halve." }, { v: [4, 14], fb: "Those are the sums. Halve them." }],
        hints: ["$\\frac{-2 + 6}{2}$ and $\\frac{4 + 10}{2}$."], why: "$\\frac{4}{2} = 2$ and $\\frac{14}{2} = 7$." },
      { type: "plane", prompt: "In standard form, $(x - h)^2 + (y - k)^2 = r^2$, a circle has center $(h, k)$. **Click the center** of $(x - 2)^2 + (y + 3)^2 = 9$.",
        x: [-6, 6], y: [-7, 5], click: "point", answer: { point: [2, -3] }, skill: "Equation of a circle",
        clickFb: function (c) { return c && c[0] === 2 && c[1] === 3 ? "$y + 3$ is $y - (-3)$, so $k = -3$." : c && c[0] === -2 ? "$x - 2$ is 0 when $x = 2$, so $h = 2$." : "The center makes both squares 0: $x - 2 = 0$ and $y + 3 = 0$."; },
        hints: ["Where is $x - 2 = 0$? Where is $y + 3 = 0$?"], why: "$h = 2$ and $k = -3$. The radius is $\\sqrt{9} = 3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "In general form the center is hidden. Complete the square twice to find it. $$x^2 + y^2 - 6x + 4y - 3 = 0$$",
        scene: { type: "walk", how: HOW_11_1C, rows: [
          { step: 1, m: "(x^2 - 6x) + (y^2 + 4y) = 3", say: "The $x$ terms together, the $y$ terms together, the constant on the right." },
          { step: 2, m: "(x^2 - 6x + 9) + (y^2 + 4y + 4) = 3 + 9 + 4", say: "Half of $-6$ squared is 9. Half of 4 squared is 4. Both go on the right as well." },
          { step: 3, m: "(x - 3)^2 + (y + 2)^2 = 16", say: "Two perfect squares." },
          { step: 4, m: "(3, -2) \\quad r = 4", say: "The center is $(3, -2)$ and the radius is $\\sqrt{16} = 4$.", fig: grid("A circle of radius 4 centered at (3, −2).", [{ circle: [[3, -2], 4], c: "blue" }, { pt: [3, -2], name: "(3, −2)", at: "ne", c: "orange" }], { x: [-3, 9], y: [-8, 4] }) }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which is the equation of the circle with center $(0, 0)$ and radius 5?",
        options: [{ t: "$x^2 + y^2 = 25$" }, { t: "$x^2 + y^2 = 5$", fb: "The right side is the radius **squared**." }, { t: "$(x - 5)^2 + (y - 5)^2 = 1$", fb: "That circle has center $(5, 5)$ and radius 1." }],
        answer: 0, skill: "Equation of a circle", hints: ["$h = 0$, $k = 0$, $r = 5$."], why: "$(x - 0)^2 + (y - 0)^2 = 5^2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $(x + 4)^2 + (y - 1)^2 = 36$, Ali says: “center $(4, -1)$, radius 36”. What is wrong?",
        options: [{ t: "The center is $(-4, 1)$, and the radius is $\\sqrt{36} = 6$." },
                  { t: "Only the radius: it should be 6.", fb: "The center is wrong too: $x + 4 = 0$ at $x = -4$." },
                  { t: "Nothing. It is right.", fb: "Test the center: at $(4, -1)$ the left side is $64 + 4$, not 0." }],
        answer: 0, skill: "Equation of a circle", hints: ["Where are both squares 0? And what is $r$ if $r^2 = 36$?"], why: "Signs flip for the center, and the right side is $r^2$." },
      { type: "choice", kicker: "Use it", prompt: "A cell tower at $(2, 1)$ has a range of **5 km**. Is a house at $(5, 5)$ in range?",
        options: [{ t: "Yes: it is exactly 5 km away" }, { t: "No: it is 7 km away", fb: "That adds the legs, $3 + 4$. The distance is the hypotenuse." }, { t: "No: it is 25 km away", fb: "25 is the distance squared." }],
        answer: 0, skill: "Distance Formula", hints: ["$\\sqrt{(5 - 2)^2 + (5 - 1)^2}$."], why: "$\\sqrt{9 + 16} = 5$: the house is on the edge of the circle." }
    ]
  });

  /* ========================================================= 11.2 · Parabolas */
  var HOW_11_2 = [["Opens", "$x = a(y - k)^2 + h$ opens to the right when $a > 0$ and to the left when $a < 0$."],
                  ["Vertex", "The vertex is $(h, k)$: $k$ comes from inside the parentheses."],
                  ["Axis", "The axis of symmetry is the horizontal line $y = k$."],
                  ["Points", "Find the intercepts, and mirror points across the axis."]];
  var HOW_11_2C = [["Complete", "Complete the square in $y$ to reach $x = a(y - k)^2 + h$."],
                   ["Vertex", "Read the vertex $(h, k)$."],
                   ["Opens", "The sign of $a$ gives the direction."]];
  var W112 = { x: [-6, 6], y: [-4, 6] }, G112 = function (y) { return (y - 1) * (y - 1) - 4; };
  var V112 = { pt: [-4, 1], name: "(−4, 1)", at: "w", c: "orange" }, AX112 = { seg: [[-6, 1], [6, 1]], c: "soft", dash: true };
  LESSONS.push({
    title: "Parabolas",
    blurb: "Book 11.2 · Parabolas that open up or down, and parabolas that open sideways.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "What is the vertex of $y = (x - 2)^2 + 3$?",
        options: [{ t: "$(2, 3)$" }, { t: "$(-2, 3)$", fb: "$(x - 2)^2$ is 0 at $x = 2$." }, { t: "$(3, 2)$", fb: "$h$ is inside the parentheses, and it is the $x$-coordinate." }],
        answer: 0, skill: "Vertex form", hints: ["$y = a(x - h)^2 + k$."], why: "$h = 2$, $k = 3$." },
      { type: "learn", kicker: "The idea",
        prompt: "Swap the roles of $x$ and $y$, and a parabola turns on its side: $x = a(y - k)^2 + h$ opens to the right or to the left. It is not a function of $x$, but it is still a parabola, with its vertex at $(h, k)$.",
        scene: { type: "method", how: HOW_11_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch $x = (y - 1)^2 - 4$ graphed.",
        scene: { type: "walk", how: HOW_11_2, rows: [
          { step: 1, m: "x = (y - 1)^2 - 4", say: "$y$ is the squared variable, so it opens sideways. $a = 1$ is positive: to the right.", fig: grid("An empty coordinate grid.", [], W112) },
          { step: 2, m: "(-4, 1)", say: "$h = -4$ is outside the parentheses, and $k = 1$ is inside.", fig: grid("The vertex (−4, 1).", [V112], W112),
            ask: { prompt: "In $x = (y - 1)^2 - 4$, what is the vertex?", answer: 0,
                   options: [{ t: "$(-4, 1)$" }, { t: "$(1, -4)$", fb: "$x$ comes first: $h = -4$. The 1 inside the parentheses is $k$, the $y$-coordinate." }, { t: "$(4, -1)$", fb: "$h = -4$ as written, and $k = 1$ with the opposite sign of the $-1$." }] } },
          { step: 3, m: "y = 1", say: "The axis of symmetry is horizontal.", fig: grid("The vertex with the dashed horizontal axis y = 1 through it.", [AX112, V112], W112) },
          { step: 4, m: "(-3, 0) \\quad (0, 3) \\quad (0, -1)", say: "$y = 0$ gives $x = -3$. And $x = 0$ gives $(y - 1)^2 = 4$, so $y = 3$ or $y = -1$.", fig: grid("A parabola opening to the right from its vertex (−4, 1), through (−3, 0), (0, 3) and (0, −1).", curveY(G112, -2, 4, "blue").concat([AX112, V112, { pt: [-3, 0] }, { pt: [0, 3] }, { pt: [0, -1] }]), W112) }] },
        gate: true, then: "Everything from Unit 9 carries over, with $x$ and $y$ trading places." },
      { type: "guided", kicker: "Together",
        prompt: "Now you read $x = -2(y + 1)^2 + 8$.",
        how: HOW_11_2, skill: "Horizontal parabolas",
        steps: [
          { step: 1, ask: "Which way does it open?", type: "choice", answer: 0,
            options: [{ t: "To the left: $a = -2$" }, { t: "To the right", fb: "$a$ is negative." }, { t: "Downward", fb: "$y$ is the squared variable, so it opens sideways." }],
            m: "a = -2", say: "Negative, and sideways: to the left." },
          { step: 2, ask: "What is the vertex?", type: "choice", answer: 0,
            options: [{ t: "$(8, -1)$" }, { t: "$(-1, 8)$", fb: "$h = 8$ is the $x$-coordinate, and it comes first." }, { t: "$(8, 1)$", fb: "$y + 1 = y - (-1)$, so $k = -1$." }],
            m: "(8, -1)", say: "$h = 8$ and $k = -1$." },
          { step: 3, ask: "What is the axis of symmetry?", type: "choice", answer: 0,
            options: [{ t: "$y = -1$" }, { t: "$x = 8$", fb: "A sideways parabola has a **horizontal** axis: $y = k$." }],
            m: "y = -1", say: "A horizontal line through the vertex." },
          { step: 4, ask: "Find the $x$-intercept: let $y = 0$. What is $-2(0 + 1)^2 + 8$?", type: "num", pre: "$x =$", answer: 6, near: [{ v: 10, fb: "$-2(1) = -2$, then add 8." }], hint: "$-2 + 8$.",
            m: "(6, 0)", say: "And $x = 0$ gives $(y + 1)^2 = 4$: the $y$-intercepts are $(0, 1)$ and $(0, -3)$." }],
        why: "Opens, vertex, axis, points. Now sort four parabolas." },
      { type: "sort", kicker: "On your own", prompt: "Which way does each parabola open?",
        bins: ["Up", "Down", "Left", "Right"],
        cards: [{ t: "$y = 2(x - 1)^2$", bin: 0, fb: "$x$ is squared and $a$ is positive." },
                { t: "$y = -x^2 + 4$", bin: 1, fb: "$x$ is squared and $a$ is negative." },
                { t: "$x = -3(y + 2)^2$", bin: 2, fb: "$y$ is squared and $a$ is negative." },
                { t: "$x = y^2 - 1$", bin: 3, fb: "$y$ is squared and $a$ is positive." }],
        skill: "Horizontal parabolas", hints: ["Which variable is squared? Then look at the sign of $a$."],
        why: "$x$ squared: up or down. $y$ squared: left or right. The sign of $a$ picks which." },
      { type: "learn", kicker: "A harder case",
        prompt: "Not in the right form yet? Complete the square, this time in $y$. $$x = y^2 + 6y + 5$$",
        scene: { type: "walk", how: HOW_11_2C, rows: [
          { step: 1, m: "x = (y^2 + 6y + 9) + 5 - 9", say: "Half of 6 is 3, squared is 9. Add it inside, subtract it outside." },
          { step: 1, m: "x = (y + 3)^2 - 4", say: "Factor and simplify." },
          { step: 2, m: "(-4, -3)", say: "$h = -4$ and $k = -3$." },
          { step: 3, m: "a = 1", say: "Positive: it opens to the right." }] },
        gate: true },
      { type: "plane", kicker: "Try it", prompt: "**Click the vertex** of $x = (y - 2)^2 + 1$.",
        x: [-4, 8], y: [-4, 6], click: "point", answer: { point: [1, 2] }, skill: "Horizontal parabolas",
        clickFb: function (c) { return c && c[0] === 2 && c[1] === 1 ? "That is $(k, h)$. The number outside the parentheses, 1, is the $x$-coordinate." : "$h$ is the number added outside, and $k$ makes the parentheses 0."; },
        hints: ["$h = 1$ (outside) and $k = 2$ (inside)."], why: "The vertex is $(h, k) = (1, 2)$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $x = (y - 3)^2 + 2$, Ben says the vertex is $(3, 2)$. What is wrong?",
        options: [{ t: "The coordinates are swapped: the vertex is $(2, 3)$." },
                  { t: "The vertex is $(-3, 2)$.", fb: "$k = 3$ is right. It is the order that is wrong." },
                  { t: "Nothing. It is right.", fb: "Test it: at $y = 3$, $x = 0 + 2 = 2$. The point is $(2, 3)$." }],
        answer: 0, skill: "Horizontal parabolas", hints: ["Put $y = 3$ into the equation. What is $x$?"], why: "For a sideways parabola the number outside is $h$, the $x$-coordinate." },
      { type: "num", kicker: "Use it", prompt: "An arch follows $y = -\\frac{1}{20}(x - 20)^2 + 20$, in feet. How wide is it at ground level?",
        post: "feet", answer: 40, skill: "Parabola applications",
        near: [{ v: 20, fb: "That is the height of the arch, and also where its middle is. Solve $y = 0$ for both ends." }],
        hints: ["$y = 0$ gives $(x - 20)^2 = 400$."], why: "$x - 20 = \\pm 20$, so the arch stands on $x = 0$ and $x = 40$: 40 feet apart." }
    ]
  });

  /* ========================================================== 11.3 · Ellipses */
  var HOW_11_3 = [["Standard", "Write the equation as $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$."],
                  ["Major axis", "The larger denominator is under the variable of the major (longer) axis."],
                  ["x-ends", "The ellipse crosses the $x$-axis at $(\\pm a, 0)$, where $a^2$ is under $x^2$."],
                  ["y-ends", "It crosses the $y$-axis at $(0, \\pm b)$, where $b^2$ is under $y^2$."],
                  ["Sketch", "Draw a smooth oval through the four points."]];
  var W113 = { x: [-5, 5], y: [-4, 4] }, EU = function (x) { return 2 * Math.sqrt(Math.max(0, 1 - x * x / 9)); }, EL = function (x) { return -EU(x); };
  var X113 = [{ pt: [3, 0], name: "(3, 0)", at: "ne" }, { pt: [-3, 0], name: "(−3, 0)", at: "nw" }], Y113 = [{ pt: [0, 2], name: "(0, 2)", at: "ne" }, { pt: [0, -2], name: "(0, −2)", at: "se" }];
  var EU2 = function (x) { return -1 + 2 * Math.sqrt(Math.max(0, 1 - (x - 2) * (x - 2) / 9)); }, EL2 = function (x) { return -1 - 2 * Math.sqrt(Math.max(0, 1 - (x - 2) * (x - 2) / 9)); };
  LESSONS.push({
    title: "Ellipses",
    blurb: "Book 11.3 · The standard form of an ellipse, its four ends, and a center off the origin.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Divide both sides of $4x^2 + 9y^2 = 36$ by 36. What does it become?",
        options: [{ t: "$\\frac{x^2}{9} + \\frac{y^2}{4} = 1$" }, { t: "$\\frac{x^2}{4} + \\frac{y^2}{9} = 1$", fb: "$\\frac{4}{36} = \\frac{1}{9}$, so 9 goes under $x^2$." }, { t: "$x^2 + y^2 = 1$", fb: "$\\frac{4x^2}{36} = \\frac{x^2}{9}$, not $x^2$." }],
        answer: 0, skill: "Standard form of an ellipse", hints: ["$\\frac{4x^2}{36}$ and $\\frac{9y^2}{36}$."], why: "$\\frac{4}{36} = \\frac{1}{9}$ and $\\frac{9}{36} = \\frac{1}{4}$." },
      { type: "learn", kicker: "The idea",
        prompt: "Stretch a circle in one direction and you get an **ellipse**. In standard form, $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$, the two denominators tell you how far it reaches along each axis.",
        scene: { type: "method", how: HOW_11_3 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch an ellipse graphed. $$\\frac{x^2}{9} + \\frac{y^2}{4} = 1$$",
        scene: { type: "walk", how: HOW_11_3, rows: [
          { step: 1, m: "\\frac{x^2}{9} + \\frac{y^2}{4} = 1", say: "Standard form: a sum of two fractions equal to 1.", fig: grid("An empty coordinate grid.", [], W113) },
          { step: 2, m: "9 > 4", say: "The larger denominator is under $x^2$, so the major axis is horizontal." },
          { step: 3, m: "(3, 0) \\quad (-3, 0)", say: "$a^2 = 9$, so $a = 3$.", fig: grid("The points (3, 0) and (−3, 0).", X113, W113),
            ask: { prompt: "9 is under $x^2$. Where does the ellipse cross the $x$-axis?", answer: 0,
                   options: [{ t: "At $(\\pm 3, 0)$" }, { t: "At $(\\pm 9, 0)$", fb: "The denominator is $a^2$. Take its square root." }] } },
          { step: 4, m: "(0, 2) \\quad (0, -2)", say: "$b^2 = 4$, so $b = 2$.", fig: grid("Four points: (±3, 0) and (0, ±2).", X113.concat(Y113), W113) },
          { step: 5, m: "\\frac{x^2}{9} + \\frac{y^2}{4} = 1", say: "A smooth oval through the four points: 6 wide and 4 tall.", fig: grid("An ellipse centered at the origin, 6 units wide and 4 units tall.", curve(EU, -3, 3, "blue").concat(curve(EL, -3, 3, "blue")).concat(X113).concat(Y113), W113) }] },
        gate: true, then: "If the two denominators were equal, the oval would be a circle." },
      { type: "guided", kicker: "Together",
        prompt: "Now you read $4x^2 + 25y^2 = 100$.",
        how: HOW_11_3, skill: "Graph an ellipse",
        steps: [
          { step: 1, ask: "Divide both sides by 100 to reach standard form.", type: "choice", answer: 0,
            options: [{ t: "$\\frac{x^2}{25} + \\frac{y^2}{4} = 1$" }, { t: "$\\frac{x^2}{4} + \\frac{y^2}{25} = 1$", fb: "$\\frac{4x^2}{100} = \\frac{x^2}{25}$." }],
            m: "\\frac{x^2}{25} + \\frac{y^2}{4} = 1", say: "The right side must be 1." },
          { step: 2, ask: "Is the major axis horizontal or vertical?", type: "choice", answer: 0,
            options: [{ t: "Horizontal: the larger denominator is under $x^2$" }, { t: "Vertical", fb: "25 is larger than 4, and it sits under $x^2$." }],
            m: "25 > 4", say: "Longer along the $x$-axis." },
          { step: 3, ask: "Where does it cross the $x$-axis?", type: "choice", answer: 0,
            options: [{ t: "$(\\pm 5, 0)$" }, { t: "$(\\pm 25, 0)$", fb: "Take the square root of 25." }],
            m: "(5, 0) \\quad (-5, 0)", say: "$a = 5$." },
          { step: 4, ask: "Where does it cross the $y$-axis?", type: "choice", answer: 0,
            options: [{ t: "$(0, \\pm 2)$" }, { t: "$(0, \\pm 4)$", fb: "Take the square root of 4." }],
            m: "(0, 2) \\quad (0, -2)", say: "$b = 2$." },
          { step: 5, ask: "How wide and how tall is the ellipse?", type: "choice", answer: 0,
            options: [{ t: "10 wide and 4 tall" }, { t: "5 wide and 2 tall", fb: "It reaches 5 on each side of the center: 10 across in all." }],
            m: "10 \\text{ wide} \\quad 4 \\text{ tall}", say: "Twice $a$ and twice $b$." }],
        why: "Standard form, major axis, the two pairs of ends, sketch. Now find an end on the grid." },
      { type: "plane", kicker: "On your own", prompt: "**Click an endpoint of the major axis** of $\\frac{x^2}{4} + \\frac{y^2}{16} = 1$.",
        x: [-6, 6], y: [-6, 6], click: "point", answer: { point: [0, 4] }, skill: "Graph an ellipse",
        check: function (st) { var c = st.clicked; if (!c) return { ok: false }; return c[0] === 0 && Math.abs(c[1]) === 4 ? { ok: true } : { ok: false, say: Math.abs(c[0]) === 2 && c[1] === 0 ? "That is an end of the **minor** axis. The larger denominator, 16, is under $y^2$." : Math.abs(c[1]) === 16 ? "Take the square root: $\\sqrt{16} = 4$." : "The larger denominator is under $y^2$, so the major axis is vertical: $(0, \\pm 4)$." }; },
        hints: ["16 is under $y^2$, and $\\sqrt{16} = 4$."], why: "The major axis is vertical, with ends at $(0, 4)$ and $(0, -4)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Replace $x$ with $x - h$ and $y$ with $y - k$, and the center moves to $(h, k)$. $$\\frac{(x - 2)^2}{9} + \\frac{(y + 1)^2}{4} = 1$$",
        scene: { type: "walk", how: HOW_11_3, rows: [
          { step: 1, m: "(2, -1)", say: "Standard form, with the center at $(2, -1)$.", fig: grid("The center (2, −1).", [{ pt: [2, -1], name: "(2, −1)", at: "ne", c: "orange" }], { x: [-3, 7], y: [-5, 3] }) },
          { step: 3, m: "(5, -1) \\quad (-1, -1)", say: "$a = 3$: move 3 to the right and 3 to the left of the center." },
          { step: 4, m: "(2, 1) \\quad (2, -3)", say: "$b = 2$: move 2 up and 2 down." },
          { step: 5, m: "\\frac{(x - 2)^2}{9} + \\frac{(y + 1)^2}{4} = 1", say: "The same oval as before, shifted 2 right and 1 down.", fig: grid("An ellipse centered at (2, −1), reaching from x = −1 to 5 and from y = −3 to 1.", curve(EU2, -1, 5, "blue").concat(curve(EL2, -1, 5, "blue")).concat([{ pt: [2, -1], name: "(2, −1)", at: "ne", c: "orange" }, { pt: [5, -1] }, { pt: [-1, -1] }, { pt: [2, 1] }, { pt: [2, -3] }]), { x: [-3, 7], y: [-5, 3] }) }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "An ellipse centered at the origin crosses the axes at $(\\pm 4, 0)$ and $(0, \\pm 3)$. What is its equation?",
        options: [{ t: "$\\frac{x^2}{16} + \\frac{y^2}{9} = 1$" }, { t: "$\\frac{x^2}{4} + \\frac{y^2}{3} = 1$", fb: "The denominators are the **squares**: $4^2$ and $3^2$." }, { t: "$\\frac{x^2}{9} + \\frac{y^2}{16} = 1$", fb: "The 4 is along the $x$-axis, so $4^2$ goes under $x^2$." }],
        answer: 0, skill: "Standard form of an ellipse", hints: ["$a = 4$ and $b = 3$."], why: "$a^2 = 16$ under $x^2$ and $b^2 = 9$ under $y^2$." },
      { type: "choice", kicker: "Find the error",
        prompt: "For $\\frac{x^2}{9} + \\frac{y^2}{25} = 1$, Cy says the $x$-intercepts are $(\\pm 9, 0)$. What is wrong?",
        options: [{ t: "The denominator is $a^2$. The intercepts are $(\\pm 3, 0)$." },
                  { t: "They are $(\\pm 5, 0)$.", fb: "25 is under $y^2$: that gives the $y$-intercepts, $(0, \\pm 5)$." },
                  { t: "Nothing. It is right.", fb: "Test $(9, 0)$: $\\frac{81}{9} = 9$, not 1." }],
        answer: 0, skill: "Graph an ellipse", hints: ["Put $y = 0$: $\\frac{x^2}{9} = 1$."], why: "$x^2 = 9$, so $x = \\pm 3$." },
      { type: "num", kicker: "Use it", prompt: "An oval garden is modeled by $\\frac{x^2}{400} + \\frac{y^2}{100} = 1$, in metres. How long is it from end to end, along its longer axis?",
        post: "m", answer: 40, skill: "Graph an ellipse",
        near: [{ v: 20, fb: "That is the distance from the center to one end. End to end is twice that." }, { v: 400, fb: "400 is $a^2$. Take its square root, then double it." }],
        hints: ["$a = \\sqrt{400}$, and the garden reaches $a$ on each side."], why: "$a = 20$, so it is $2 \\cdot 20 = 40$ m long." }
    ]
  });
  /* ======================================================== 11.4 · Hyperbolas */
  var HOW_11_4 = [["Standard", "Write the equation as $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$ or $\\frac{y^2}{a^2} - \\frac{x^2}{b^2} = 1$."],
                  ["Opens", "The positive term names the direction: $x^2$ first opens left and right, $y^2$ first opens up and down."],
                  ["Vertices", "The vertices are $a$ units from the center, along that direction."],
                  ["Rectangle", "Sketch the rectangle through $\\pm a$ and $\\pm b$. Its diagonals, extended, are the asymptotes."],
                  ["Branches", "Draw each branch from a vertex, bending toward the asymptotes."]];
  var W114 = { x: [-7, 7], y: [-7, 7] }, HU = function (x) { return 3 * Math.sqrt(Math.max(0, x * x / 4 - 1)); }, HL = function (x) { return -HU(x); };
  var V114 = [{ pt: [2, 0], name: "(2, 0)", at: "ne", c: "orange" }, { pt: [-2, 0], name: "(−2, 0)", at: "nw", c: "orange" }];
  var R114 = [{ poly: [[-2, -3], [2, -3], [2, 3], [-2, 3]], c: "soft", fill: false, dash: true }, { line: [[0, 0], [2, 3]], c: "soft", dash: true }, { line: [[0, 0], [2, -3]], c: "soft", dash: true }];
  LESSONS.push({
    title: "Hyperbolas",
    blurb: "Book 11.4 · Two branches, two asymptotes, and telling the four conics apart by their equations.",
    mins: 12, v: 1,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Which of these is an **ellipse**?",
        options: [{ t: "$\\frac{x^2}{9} + \\frac{y^2}{4} = 1$" }, { t: "$\\frac{x^2}{9} - \\frac{y^2}{4} = 1$", fb: "An ellipse adds its two fractions. This one subtracts: it is today's new curve." }],
        answer: 0, skill: "Identify a conic", hints: ["An ellipse has a plus between the squared terms."], why: "A sum of two squared terms equal to 1 is an ellipse." },
      { type: "learn", kicker: "The idea",
        prompt: "Change the plus in an ellipse's equation to a **minus**, and the curve breaks into two branches: a **hyperbola**. Each branch starts at a vertex and bends toward two straight lines, the **asymptotes**, without ever touching them.",
        scene: { type: "method", how: HOW_11_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a hyperbola graphed. $$\\frac{x^2}{4} - \\frac{y^2}{9} = 1$$",
        scene: { type: "walk", how: HOW_11_4, rows: [
          { step: 1, m: "\\frac{x^2}{4} - \\frac{y^2}{9} = 1", say: "Standard form: a difference of two fractions equal to 1.", fig: grid("An empty coordinate grid.", [], W114) },
          { step: 2, m: "x^2 \\text{ is the positive term}", say: "So it opens left and right." },
          { step: 3, m: "(2, 0) \\quad (-2, 0)", say: "$a^2 = 4$, so the vertices are 2 units either side of the center.", fig: grid("The vertices (2, 0) and (−2, 0).", V114, W114),
            ask: { prompt: "$a^2 = 4$ is under $x^2$. Where are the vertices?", answer: 0,
                   options: [{ t: "$(\\pm 2, 0)$" }, { t: "$(0, \\pm 2)$", fb: "The positive term is $x^2$, so the vertices are on the $x$-axis." }, { t: "$(\\pm 4, 0)$", fb: "Take the square root of 4." }] } },
          { step: 4, m: "y = \\pm\\frac{3}{2}x", say: "$b^2 = 9$, so $b = 3$. The rectangle runs through $\\pm 2$ and $\\pm 3$. Its diagonals are the asymptotes.", fig: grid("A dashed rectangle through x = ±2 and y = ±3, with its diagonals extended as dashed lines.", R114.concat(V114), W114) },
          { step: 5, m: "\\frac{x^2}{4} - \\frac{y^2}{9} = 1", say: "Each branch leaves its vertex and bends toward the asymptotes.", fig: grid("A hyperbola with branches opening left and right from (±2, 0), approaching the dashed asymptotes.", R114.concat(curve(HU, 2, 4.6, "blue")).concat(curve(HL, 2, 4.6, "blue")).concat(curve(HU, -4.6, -2, "blue")).concat(curve(HL, -4.6, -2, "blue")).concat(V114), W114) }] },
        gate: true, then: "The rectangle and the asymptotes are scaffolding: they guide the drawing but are not part of the curve." },
      { type: "guided", kicker: "Together",
        prompt: "Now you read $\\frac{y^2}{16} - \\frac{x^2}{9} = 1$.",
        how: HOW_11_4, skill: "Graph a hyperbola",
        steps: [
          { step: 1, ask: "Is it in standard form?", type: "choice", answer: 0,
            options: [{ t: "Yes: a difference of two fractions equal to 1" }, { t: "No", fb: "It is a difference, and the right side is 1." }],
            m: "\\frac{y^2}{16} - \\frac{x^2}{9} = 1", say: "Standard form." },
          { step: 2, ask: "Which way does it open?", type: "choice", answer: 0,
            options: [{ t: "Up and down: $y^2$ is the positive term" }, { t: "Left and right", fb: "The positive term decides. Here that is $y^2$." }],
            m: "y^2 \\text{ is the positive term}", say: "Up and down." },
          { step: 3, ask: "Where are the vertices?", type: "choice", answer: 0,
            options: [{ t: "$(0, \\pm 4)$" }, { t: "$(\\pm 4, 0)$", fb: "It opens up and down, so the vertices are on the $y$-axis." }, { t: "$(0, \\pm 16)$", fb: "Take the square root of 16." }],
            m: "(0, 4) \\quad (0, -4)", say: "$a^2 = 16$ is under the positive term." },
          { step: 4, ask: "The rectangle runs through $y = \\pm 4$ and $x = \\pm 3$. What are the asymptotes?", type: "choice", answer: 0,
            options: [{ t: "$y = \\pm\\frac{4}{3}x$" }, { t: "$y = \\pm\\frac{3}{4}x$", fb: "The diagonals rise 4 for every 3 across." }],
            m: "y = \\pm\\frac{4}{3}x", say: "The diagonals of the rectangle." },
          { step: 5, ask: "Does this hyperbola ever cross the $x$-axis?", type: "choice", answer: 0,
            options: [{ t: "No: its branches go up from $(0, 4)$ and down from $(0, -4)$" }, { t: "Yes, at $(\\pm 3, 0)$", fb: "Put $y = 0$: $-\\frac{x^2}{9} = 1$ has no real solution." }],
            m: "\\frac{y^2}{16} - \\frac{x^2}{9} = 1", say: "Two branches, one above and one below." }],
        why: "Standard form, direction, vertices, rectangle, branches. Now tell the conics apart." },
      { type: "sort", kicker: "On your own", prompt: "Which conic is each equation?",
        bins: ["Circle", "Ellipse", "Hyperbola", "Parabola"],
        cards: [{ t: "$x^2 + y^2 = 16$", bin: 0, fb: "Both squared, added, with equal coefficients." },
                { t: "$\\frac{x^2}{4} + \\frac{y^2}{9} = 1$", bin: 1, fb: "Both squared, added, with different denominators." },
                { t: "$\\frac{x^2}{4} - \\frac{y^2}{9} = 1$", bin: 2, fb: "Both squared, with a minus between them." },
                { t: "$y = x^2 - 3$", bin: 3, fb: "Only one variable is squared." },
                { t: "$4x^2 + 4y^2 = 36$", bin: 0, fb: "Divide by 4: $x^2 + y^2 = 9$. Equal coefficients make a circle." }],
        skill: "Identify a conic", hints: ["How many variables are squared? Plus or minus? Equal coefficients?"],
        why: "One square: parabola. Two squares added: circle if the coefficients match, ellipse if not. Two squares subtracted: hyperbola." },
      { type: "learn", kicker: "A harder case",
        prompt: "As with ellipses, $x - h$ and $y - k$ move the center to $(h, k)$. $$\\frac{(x - 1)^2}{9} - \\frac{(y + 2)^2}{16} = 1$$",
        scene: { type: "walk", how: HOW_11_4, rows: [
          { step: 1, m: "(1, -2)", say: "Standard form, with the center at $(1, -2)$." },
          { step: 2, m: "(x - 1)^2 \\text{ is the positive term}", say: "It opens left and right." },
          { step: 3, m: "(4, -2) \\quad (-2, -2)", say: "$a = 3$: move 3 to the right and 3 to the left of the center." },
          { step: 4, m: "y + 2 = \\pm\\frac{4}{3}(x - 1)", say: "$b = 4$. The asymptotes pass through the center, with slopes $\\pm\\frac{4}{3}$." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "What are the vertices of $\\frac{x^2}{25} - \\frac{y^2}{4} = 1$?",
        options: [{ t: "$(\\pm 5, 0)$" }, { t: "$(0, \\pm 2)$", fb: "The positive term is $x^2$, so the vertices are on the $x$-axis." }, { t: "$(\\pm 25, 0)$", fb: "Take the square root of 25." }],
        answer: 0, skill: "Graph a hyperbola", hints: ["The positive term is $x^2$, and $a^2 = 25$."], why: "$a = 5$, along the $x$-axis." },
      { type: "choice", kicker: "Find the error",
        prompt: "Di says $\\frac{y^2}{9} - \\frac{x^2}{4} = 1$ opens left and right, “because it has an $x^2$ in it”. What is wrong?",
        options: [{ t: "The **positive** term decides. It is $y^2$, so the hyperbola opens up and down." },
                  { t: "It is not a hyperbola at all.", fb: "Two squared terms with a minus between them: it is a hyperbola." },
                  { t: "Nothing. It is right.", fb: "Put $y = 0$: $-\\frac{x^2}{4} = 1$ has no solution, so it never meets the $x$-axis." }],
        answer: 0, skill: "Graph a hyperbola", hints: ["Step 2 of the method."], why: "Its vertices are $(0, \\pm 3)$." },
      { type: "choice", kicker: "Use it", prompt: "A comet's path is modeled by $9x^2 - 4y^2 = 36$. Which conic is it?",
        options: [{ t: "A hyperbola" }, { t: "An ellipse", fb: "An ellipse adds its squared terms. Here they are subtracted." }, { t: "A parabola", fb: "A parabola has only one squared variable." }],
        answer: 0, skill: "Identify a conic", hints: ["Two squared terms. Plus or minus?"], why: "Dividing by 36 gives $\\frac{x^2}{4} - \\frac{y^2}{9} = 1$. A comet on such a path passes once and never returns." }
    ]
  });

  /* ====================================== 11.5 · Solve systems of nonlinear equations */
  var HOW_11_5 = [["Picture", "Identify each graph, and think how many times they could cross."],
                  ["Isolate", "Solve one equation for one variable."],
                  ["Substitute", "Substitute into the other equation, and solve."],
                  ["Back", "Find the other variable for each solution."],
                  ["Check", "Write the ordered pairs, and check them in both equations."]];
  var HOW_11_5E = [["Line up", "Write both equations with like terms lined up."],
                   ["Add", "Add or subtract the equations to eliminate one squared term."],
                   ["Solve", "Solve for the variable that is left."],
                   ["Back", "Substitute each value back to find the other variable."]];
  var W115 = { x: [-7, 7], y: [-7, 7] }, C115 = [{ circle: [[0, 0], 5], c: "blue" }, { line: [[0, 1], [1, 2]], c: "green" }];
  var PAR115 = function (x) { return x * x - 1; }, HY = function (x) { return Math.sqrt(Math.max(0, x * x - 5)); }, HYL = function (x) { return -HY(x); };
  LESSONS.push({
    title: "Systems of nonlinear equations",
    blurb: "Book 11.5 · Where a line meets a curve, and where two curves meet.",
    mins: 12, v: 1,
    steps: [
      { type: "pair", kicker: "Warm up", prompt: "Solve the system. Type the solution as $(x, y)$." + sys("y = 2x", "x + y = 9"), answer: [3, 6], skill: "Substitution",
        near: [{ v: [6, 3], fb: "$y$ is the one that is twice $x$." }], hints: ["Put $2x$ in place of $y$: $x + 2x = 9$."], why: "$3x = 9$, so $x = 3$ and $y = 6$." },
      { type: "learn", kicker: "The idea",
        prompt: "A system is **nonlinear** when at least one graph is a curve. A solution is still a point on both graphs, but now there can be several. Substitution and elimination work exactly as before.",
        scene: { type: "method", how: HOW_11_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a circle and a line." + sys("x^2 + y^2 = 25", "y = x + 1"),
        scene: { type: "walk", how: HOW_11_5, rows: [
          { step: 1, m: "\\text{a circle and a line}", say: "A line can miss a circle, touch it once, or cut it twice.", fig: grid("A circle of radius 5 about the origin, and the line y = x + 1 cutting through it.", C115, W115) },
          { step: 2, m: "y = x + 1", say: "The second equation already has $y$ alone." },
          { step: 3, m: "x^2 + (x + 1)^2 = 25", say: "Substitute it into the circle." },
          { step: 3, m: "x^2 + x - 12 = 0", say: "Expand: $2x^2 + 2x + 1 = 25$. Then subtract 25 and divide by 2." },
          { step: 3, m: "x = 3 \\quad\\text{or}\\quad x = -4", say: "$(x - 3)(x + 4) = 0$." },
          { step: 4, m: "(3, 4) \\quad (-4, -3)", say: "Use $y = x + 1$ for each $x$.",
            ask: { prompt: "When $x = -4$, what is $y = x + 1$?", answer: 0,
                   options: [{ t: "$-3$" }, { t: "$5$", fb: "$-4 + 1 = -3$." }, { t: "$-5$", fb: "Add 1: $-4 + 1 = -3$." }] },
            fig: grid("The circle and the line, with their two crossing points (3, 4) and (−4, −3) marked.", C115.concat([{ pt: [3, 4], name: "(3, 4)", at: "ne", c: "orange" }, { pt: [-4, -3], name: "(−4, −3)", at: "sw", c: "orange" }]), W115) },
          { step: 5, m: "3^2 + 4^2 = 25 \\quad (-4)^2 + (-3)^2 = 25", say: "Both points are on the circle. ✓" }] },
        gate: true, then: "Two solutions, because the line cuts the circle twice." },
      { type: "guided", kicker: "Together",
        prompt: "Now a parabola and a line." + sys("y = x^2", "y = x + 2"),
        how: HOW_11_5, skill: "Nonlinear systems",
        steps: [
          { step: 1, ask: "How many times can a line cross a parabola?", type: "choice", answer: 0,
            options: [{ t: "0, 1 or 2 times" }, { t: "Exactly once", fb: "A line can cut through both arms of a parabola." }],
            m: "\\text{a parabola and a line}", say: "Expect up to two solutions." },
          { step: 2, ask: "Both equations are already solved for $y$. What follows?", type: "choice", answer: 0,
            options: [{ t: "$x^2 = x + 2$" }, { t: "$x^2 + x + 2 = 0$", fb: "The two expressions for $y$ are **equal** to each other." }],
            m: "x^2 = x + 2", say: "Two expressions for the same $y$." },
          { step: 3, ask: "Solve $x^2 - x - 2 = 0$.", type: "choice", answer: 0,
            options: [{ t: "$x = 2$ or $x = -1$" }, { t: "$x = -2$ or $x = 1$", fb: "$(x - 2)(x + 1) = 0$." }],
            m: "x = 2 \\quad\\text{or}\\quad x = -1", say: "$(x - 2)(x + 1) = 0$." },
          { step: 4, ask: "Find $y$ for each, using $y = x^2$.", type: "choice", answer: 0,
            options: [{ t: "$(2, 4)$ and $(-1, 1)$" }, { t: "$(2, 2)$ and $(-1, -1)$", fb: "$y$ is $x^2$: $2^2 = 4$ and $(-1)^2 = 1$." }],
            m: "(2, 4) \\quad (-1, 1)", say: "Each $x$ has its own $y$." },
          { step: 5, ask: "Check $(2, 4)$ in $y = x + 2$: what is $2 + 2$?", type: "num", answer: 4, hint: "$2 + 2$.",
            m: "2 + 2 = 4 \\quad -1 + 2 = 1", say: "Both points are on the line as well. ✓" }],
        why: "Picture, isolate, substitute, back, check. Now read a system from its graph." },
      { type: "numbers", kicker: "On your own", prompt: "The parabola $y = x^2 - 1$ and the line $y = 3$ are drawn. Give the $x$-coordinates of the points where they cross.",
        scene: graph([-4, 4], [-2, 6], [{ f: PAR115, color: "blue" }, { f: function () { return 3; }, color: "green" }]),
        answer: [-2, 2], skill: "Nonlinear systems", placeholder: "e.g. −3, 3",
        hints: ["$x^2 - 1 = 3$."], why: "$x^2 = 4$, so $x = \\pm 2$: the points $(-2, 3)$ and $(2, 3)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "When both equations have $x^2$ and $y^2$, elimination is quicker." + sys("x^2 + y^2 = 13", "x^2 - y^2 = 5"),
        scene: { type: "walk", how: HOW_11_5E, rows: [
          { step: 1, m: "x^2 + y^2 = 13 \\quad x^2 - y^2 = 5", say: "A circle and a hyperbola. The $y^2$ terms are opposites." },
          { step: 2, m: "2x^2 = 18", say: "Add the equations." },
          { step: 3, m: "x = \\pm 3", say: "$x^2 = 9$." },
          { step: 4, m: "9 + y^2 = 13 \\quad y = \\pm 2", say: "Either way $x^2 = 9$, so $y^2 = 4$." },
          { step: 4, m: "(3, 2) \\quad (3, -2) \\quad (-3, 2) \\quad (-3, -2)", say: "Every combination of signs: four solutions.", fig: grid("A circle and a hyperbola crossing at four points: (±3, ±2).", [{ circle: [[0, 0], Math.sqrt(13)], c: "blue" }].concat(curve(HY, Math.sqrt(5), 4.6, "green")).concat(curve(HYL, Math.sqrt(5), 4.6, "green")).concat(curve(HY, -4.6, -Math.sqrt(5), "green")).concat(curve(HYL, -4.6, -Math.sqrt(5), "green")).concat([{ pt: [3, 2], c: "orange" }, { pt: [3, -2], c: "orange" }, { pt: [-3, 2], c: "orange" }, { pt: [-3, -2], c: "orange" }]), { x: [-6, 6], y: [-6, 6] }) }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "How many solutions can a system of a **circle** and a **line** have?",
        options: [{ t: "0, 1 or 2" }, { t: "Always 2", fb: "A line can miss the circle, or just touch it." }, { t: "Up to 4", fb: "A straight line meets a circle at most twice." }],
        answer: 0, skill: "Nonlinear systems", hints: ["Picture a line far from the circle, touching it, and cutting through it."], why: "Miss: none. Tangent: one. Cutting through: two." },
      { type: "choice", kicker: "Find the error",
        prompt: "Solving $x^2 + y^2 = 25$ with $y = x + 1$, Kim finds $x = 3$ and $x = -4$ and writes: “the solutions are 3 and $-4$”. What is wrong?",
        options: [{ t: "A solution is an ordered pair. She still has to find each $y$: $(3, 4)$ and $(-4, -3)$." },
                  { t: "The values of $x$ are wrong.", fb: "They are right. But they are only half of each solution." },
                  { t: "Nothing. Those are the solutions.", fb: "A point on a graph needs both coordinates." }],
        answer: 0, skill: "Nonlinear systems", hints: ["Step 4 of the method."], why: "Each $x$ must be paired with its $y$." },
      { type: "num", kicker: "Use it", prompt: "The **sum** of the squares of two positive numbers is 17, and the **difference** of their squares is 15. Find the larger number.",
        answer: 4, skill: "Nonlinear systems",
        near: [{ v: 1, fb: "That is the smaller number." }, { v: 16, fb: "That is its square. Take the square root." }],
        hints: ["$x^2 + y^2 = 17$ and $x^2 - y^2 = 15$. Add them."], why: "$2x^2 = 32$, so $x^2 = 16$ and $x = 4$. Then $y = 1$." }
    ]
  });
  /* ================================================================ Skills */
  function sq(v, t) { return t === 0 ? v + "^2" : "(" + poly([[1, v], [-t, ""]]) + ")^2"; }
  var SKILLS = [
    { id: "a2u11-distance", title: "Use the Distance Formula", lesson: 2,
      gen: function (R) {
        var T = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]), x1 = R.int(-6, 4), y1 = R.int(-6, 4);
        var dx = T[0] * R.pick([-1, 1]), dy = T[1] * R.pick([-1, 1]);
        if (R.chance(0.5)) { var t = dx; dx = dy; dy = t; }
        return { type: "num", prompt: "Find the distance between $(" + x1 + ", " + y1 + ")$ and $(" + (x1 + dx) + ", " + (y1 + dy) + ")$.", answer: T[2],
          near: near(T[2], [{ v: T[0] + T[1], fb: "That adds the two legs. The distance is the hypotenuse: square them, add, and take the root." }, { v: T[2] * T[2], fb: "That is the distance squared. Take the square root." }]),
          hints: ["The differences are $" + dx + "$ and $" + dy + "$."], why: "$\\sqrt{" + dx * dx + " + " + dy * dy + "} = \\sqrt{" + T[2] * T[2] + "} = " + T[2] + "$." };
      } },
    { id: "a2u11-circle", title: "Read the equation of a circle", lesson: 2,
      gen: function (R) {
        var h = R.int(-6, 6), k = R.int(-6, 6), r = R.int(2, 9), eq = sq("x", h) + " + " + sq("y", k) + " = " + r * r;
        if (R.chance(0.5)) return { type: "pair", prompt: "What is the center of the circle $" + eq + "$? Type it as $(x, y)$.", answer: [h, k],
          near: h || k ? [{ v: [-h, -k], fb: "The signs flip: the center makes each squared part equal to 0." }] : [],
          hints: ["Which $x$ makes the first square 0? Which $y$ makes the second square 0?"], why: "The center is $(" + h + ", " + k + ")$." };
        return { type: "num", prompt: "What is the radius of the circle $" + eq + "$?", answer: r,
          near: near(r, [{ v: r * r, fb: "The right side is the radius **squared**." }]),
          hints: ["$r^2 = " + r * r + "$."], why: "$r = \\sqrt{" + r * r + "} = " + r + "$." };
      } },
    { id: "a2u11-parabola", title: "Read a parabola's equation", lesson: 3,
      gen: function (R) {
        var a = R.pick([1, 2, -1, -2, 3, -3]), side = R.chance(0.5), right = side ? (a > 0 ? "Right" : "Left") : (a > 0 ? "Up" : "Down");
        var h = R.nz(-5, 5), k = R.nz(-5, 5), A = a === 1 ? "" : a === -1 ? "-" : a;
        var eq = side ? "x = " + A + sq("y", k) + " " + signed(h) : "y = " + A + sq("x", h) + " " + signed(k);
        return mc(R, { prompt: "Which way does this parabola open? $$" + eq + "$$", right: right,
          wrong: ["Up", "Down", "Left", "Right"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: (side ? "$y$ is the squared variable, so it opens sideways." : "$x$ is the squared variable, so it opens up or down.") + " $a = " + a + "$ is " + (a > 0 ? "positive." : "negative.") }; }), keep: true,
          hints: ["Which variable is squared? Then look at the sign of $a$."], why: (side ? "$y$ is squared: sideways. " : "$x$ is squared: up or down. ") + "$a = " + a + "$ is " + (a > 0 ? "positive." : "negative.") });
      } },
    { id: "a2u11-ellipse", title: "Find the ends of an ellipse", lesson: 4,
      gen: function (R) {
        var a = R.int(2, 9), b = R.int(2, 9), askX = R.chance(0.5);
        if (a === b) b = a === 9 ? 8 : a + 1;
        var ans = askX ? a : b;
        return { type: "num", prompt: "The ellipse $\\frac{x^2}{" + a * a + "} + \\frac{y^2}{" + b * b + "} = 1$ crosses the " + (askX ? "$x$" : "$y$") + "-axis at two points. Give the **positive** " + (askX ? "$x$" : "$y$") + "-value.", answer: ans,
          near: near(ans, [{ v: ans * ans, fb: "The denominator is a square. Take its square root." }, { v: askX ? b : a, fb: "That is where it crosses the other axis." }]),
          hints: ["Let " + (askX ? "$y = 0$" : "$x = 0$") + "."], why: (askX ? "$x^2 = " + a * a : "$y^2 = " + b * b) + "$, so the value is $" + ans + "$." };
      } },
    { id: "a2u11-conic", title: "Identify a conic", lesson: 5,
      gen: function (R) {
        var p = R.int(2, 9), q = R.int(2, 9), kind = R.int(0, 3), c = p * q * R.pick([1, 2]);
        if (p === q) q = p === 9 ? 8 : p + 1;
        var eq = kind === 0 ? p + "x^2 + " + p + "y^2 = " + c : kind === 1 ? p + "x^2 + " + q + "y^2 = " + c : kind === 2 ? p + "x^2 - " + q + "y^2 = " + c : "y = " + p + "x^2 - " + q;
        var right = ["Circle", "Ellipse", "Hyperbola", "Parabola"][kind];
        var why = ["Both variables are squared and added, with equal coefficients.", "Both variables are squared and added, with different coefficients.", "Both variables are squared, with a minus between them.", "Only one variable is squared."][kind];
        return mc(R, { prompt: "Which conic is this? $$" + eq + "$$", right: right,
          wrong: ["Circle", "Ellipse", "Hyperbola", "Parabola"].filter(function (t) { return t !== right; }).map(function (t) { return { t: t, fb: why }; }), keep: true,
          hints: ["How many variables are squared? Added or subtracted? Equal coefficients?"], why: why });
      } },
    { id: "a2u11-system", title: "Solve a nonlinear system", lesson: 6,
      gen: function (R) {
        var r1 = R.int(-4, 3), r2 = r1 + R.int(1, 5), m = r1 + r2, c = -r1 * r2;
        return { type: "numbers", prompt: "The parabola and the line cross at two points. Give their $x$-coordinates." + sys("y = x^2", "y = " + (poly([[m, "x"], [c, ""]]) || "0")), answer: [r1, r2], placeholder: "e.g. −1, 3",
          hints: ["Set them equal: $x^2 = " + (poly([[m, "x"], [c, ""]]) || "0") + "$, and get 0 on one side."],
          why: "$" + poly([[1, "x^2"], [-m, "x"], [-c, ""]]) + " = 0$ has solutions $x = " + r1 + "$ and $x = " + r2 + "$." };
      } }
  ];
  L.unit("alg2", 11, {
    title: "Conics",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "The Distance Formula, circles and parabolas.",
        skills: ["a2u11-distance", "a2u11-circle", "a2u11-parabola"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "Ellipses, telling the conics apart, and nonlinear systems.",
        skills: ["a2u11-ellipse", "a2u11-conic", "a2u11-system"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg2:11", {
    2: { name: "Distance and circles", frame: "The distance between two points comes from the [[Pythagorean Theorem]]. A circle is every point at the same [[distance]] from its center. In $(x - h)^2 + (y - k)^2 = r^2$ the center is [[$(h, k)$]] and the radius is [[$r$]].",
         chips: ["$r^2$", "$(-h, -k)$"], fb: { "$r^2$": "The right side is $r^2$. The radius itself is its square root." } },
    3: { name: "Horizontal parabolas", frame: "$x = a(y - k)^2 + h$ is a parabola that opens to the [[right]] when $a > 0$. Its vertex is [[$(h, k)$]], and its axis of symmetry is the line [[$y = k$]].",
         chips: ["top", "$(k, h)$", "$x = h$"] },
    4: { name: "Ellipses", frame: "In $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ the ellipse crosses the $x$-axis at [[$(\\pm a, 0)$]] and the $y$-axis at [[$(0, \\pm b)$]]. The [[larger]] denominator marks the major axis.",
         chips: ["smaller", "$(\\pm a^2, 0)$"] },
    5: { name: "Hyperbolas", frame: "A hyperbola's equation has a [[minus]] between the squared terms. The [[positive]] term names the direction it opens. Its branches approach two lines called [[asymptotes]].",
         chips: ["plus", "vertices"] },
    6: { name: "Nonlinear systems", frame: "A solution of a nonlinear system is an ordered [[pair]] that lies on [[both]] graphs. Substitute or eliminate to get one equation in one variable. There can be [[several]] solutions.",
         chips: ["one", "number"] }
  });
})();
