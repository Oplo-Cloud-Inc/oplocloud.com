/* ==========================================================================
   Algebra I — Unit 14: Quadratic functions & equations. See lab/core.js.

   Written the way Units 1–13 are. A parabola is met as the path of a
   thrown ball and read for its vertex, axis and zeros; each form of a
   quadratic is then a way of seeing one of those features at a glance —
   factored form its zeros, vertex form its vertex, standard form its
   y-intercept — and each way of solving follows from a form: the zero
   product property, square roots, completing the square (on tiles), and the
   quadratic formula that completing the square proves. The unit ends with
   strategy, comparing quadratics, and sliding and stretching parabolas.

   Thirteen lessons, following Khan Academy's topics for the unit.
   Thirty-one skills (Khan's list), six quizzes, the unit test at the end,
   and notes that put the unit on one page.
   Standards: HSA.SSE.B.3, HSA.REI.B.4, HSF.IF.B.4, HSF.IF.C.7.a,
   HSF.IF.C.8.a, HSF.IF.C.9, HSF.BF.B.3.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, num = L.num, mc = L.mc, frac = L.frac, gcd = L.gcd;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function paren(v) { return v < 0 ? "(" + num(v) + ")" : num(v); }
  function nears(ans, list) { return list.filter(function (z) { return isFinite(z.v) && Math.abs(z.v - ans) > 1e-9; }); }
  function aT(a) { return a === 1 ? "" : a === -1 ? "-" : a % 1 ? (a < 0 ? "-" : "") + "\\frac{1}{" + Math.round(1 / Math.abs(a)) + "}" : num(a); }
  function sh(h) { return "x" + (h === 0 ? "" : h > 0 ? " - " + num(h) : " + " + num(-h)); }
  function kT(k) { return k === 0 ? "" : k > 0 ? " + " + num(k) : " - " + num(-k); }
  function vTex(a, h, k) { return "y = " + aT(a) + (h === 0 ? "x^2" : "(" + sh(h) + ")^2") + kT(k); }
  function fTex(a, r, s) { return "y = " + aT(a) + (r === 0 ? "x" : "(" + sh(r) + ")") + (s === 0 ? "x" : "(" + sh(s) + ")"); }
  function sTex(a, b, c) { return "y = " + poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function fac(a, b) { return "(" + poly([[a, "x"], [b, ""]]) + ")"; }
  function vf(a, h, k) { return function (x) { return a * (x - h) * (x - h) + k; }; }
  function sols(list) { return list.slice().sort(function (p, q) { return p - q; }); }
  function tbl(head, rows) { return { type: "table", head: head, rows: rows }; }
  function blanks(h, vals) { return { type: "table", head: h, rows: [vals.map(function () { return null; })], answers: vals.map(function (v, i) { return [0, i, v]; }) }; }
  var RKEYS = [["$\\sqrt{\\,}$", "sqrt()", -1], ["$($", "("], ["$)$", ")"], ["$+$", "+"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"], ["$,$", ", "]];
  function nums(prompt, ans, o) {
    o = o || {};
    return { type: "numbers", prompt: prompt, answer: ans, shown: o.shown || null, hints: o.hints, why: o.why, scene: o.scene,
      placeholder: o.ph || (o.shown ? "e.g. 1 + sqrt(2), 1 - sqrt(2)" : "e.g. −3, 5"), keys: o.shown ? RKEYS : false };
  }
  function withText(scene, o) { return Object.assign(scene, o); }
  function para(f, o) {
    o = o || {};
    return { type: "plane", x: o.x || [-8, 8], y: o.y || [-8, 8], gridY: o.gridY, labelEvery: o.labelEvery, labelEveryY: o.labelEveryY, axisLabels: o.axisLabels, aspect: o.aspect,
      fns: [{ f: f, color: "blue", domain: o.domain }].concat(o.more || []), vline: o.vline,
      marks: (o.marks || []).map(function (p) { return { x: p[0], y: p[1], label: p[2] != null ? p[2] : pt(p[0], p[1]), color: p[3] || "orange" }; }) };
  }
  // Parabola on sliders: vertex form, or factored form.
  function vSliders(a, h, k, which) {
    var P = { a: { v: 1, min: -3, max: 3, step: 0.5, label: "$a$" }, h: { v: 0, min: -6, max: 6, step: 1, label: "$h$" }, k: { v: 0, min: -7, max: 7, step: 1, label: "$k$" } };
    Object.keys(P).forEach(function (n) { if (which && which.indexOf(n) < 0) P[n].fixed = true; });
    return { type: "plane", x: [-8, 8], y: [-8, 8], params: P,
      fns: [{ f: function (x, p) { return p.a * (x - p.h) * (x - p.h) + p.k; }, color: "blue" }].concat(which && which.length < 3 ? [{ f: function (x) { return x * x; }, color: "ink", dashed: true }] : []),
      marks: [{ x: function (p) { return p.h; }, y: function (p) { return p.k; }, color: "orange", label: function (p) { return "vertex (" + num(p.h) + ", " + num(p.k) + ")"; } }],
      readout: function (st) { var p = st.params; return p.a === 0 ? "With $a = 0$ it's a line, not a parabola." : "$" + vTex(p.a, p.h, p.k) + "$"; },
      answer: { params: { a: a, h: h, k: k } },
      check: function (st) { var p = st.params;
        if (p.h !== h || p.k !== k) return { ok: false, say: "The vertex should be at $" + pt(h, k) + "$; yours is at $" + pt(p.h, p.k) + "$." };
        if (p.a !== a) return { ok: false, say: p.a * a < 0 ? "Right vertex — but it should open " + (a > 0 ? "up" : "down") + "." : "Right vertex and direction. Now the stretch: one step from the vertex, the graph should move " + num(Math.abs(a)) + "." };
        return { ok: true }; } };
  }
  function fSliders(a, r, s) {
    return { type: "plane", x: [-8, 8], y: [-8, 8],
      params: { a: { v: 1, min: -2, max: 2, step: 0.5, label: "$a$" }, r: { v: 0, min: -7, max: 7, step: 1, label: "zero $r$" }, s: { v: 1, min: -7, max: 7, step: 1, label: "zero $s$" } },
      fns: [{ f: function (x, p) { return p.a * (x - p.r) * (x - p.s); }, color: "blue" }],
      marks: [{ x: function (p) { return p.r; }, y: 0, color: "orange" }, { x: function (p) { return p.s; }, y: 0, color: "orange" }],
      readout: function (st) { var p = st.params; return "$" + fTex(p.a, p.r, p.s) + "$"; },
      answer: { params: { a: a, r: Math.min(r, s), s: Math.max(r, s) } },
      check: function (st) { var p = st.params, z1 = sols([p.r, p.s]), z2 = sols([r, s]);
        if (z1[0] !== z2[0] || z1[1] !== z2[1]) return { ok: false, say: "The graph should cross the $x$-axis at $x = " + z2[0] + "$ and $x = " + z2[1] + "$ — the zeros." };
        if (p.a !== a) return { ok: false, say: "Right zeros. Now $a$: " + (a > 0 ? "it opens up" : "it opens down") + ", and $a = " + num(a) + "$." };
        return { ok: true }; } };
  }
  // A quadratic with whole-number roots, for solving.
  function rootsQuad(R) {
    var r = R.int(-8, 8), s = R.int(-8, 8);
    return { a: 1, b: -(r + s), c: r * s, roots: r === s ? [r] : [r, s] };
  }


  L.unit("alg", 14, {
    title: "Quadratic functions & equations",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Parabolas",
        blurb: "The shape of a quadratic: vertex, axis of symmetry, zeros — and what they mean.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A thrown ball rises, slows, and falls: its height against time is a curve called a **parabola** — the graph of a **quadratic** function, one with an $x^2$ term.",
            scene: para(vf(-1, 1, 4), { marks: [[1, 4, "vertex (1, 4)"], [-1, 0, "(−1, 0)"], [3, 0, "(3, 0)"], [0, 3, "(0, 3)", "purple"]], vline: [1] }),
            after: "Its turning point is the **vertex**, $(1, 4)$ — here a maximum, because it opens downward. The **axis of symmetry** is the vertical line through the vertex, $x = 1$: the two sides mirror each other. It crosses the $x$-axis at the **zeros**, $x = -1$ and $x = 3$, and the $y$-axis at $(0, 3)$." },
          { type: "pair", prompt: "What is the vertex of this parabola?", answer: [-2, -3], skill: "Parabolas intro",
            scene: para(vf(1, -2, -3)), hints: ["The vertex is the lowest point here."], why: "The lowest point is $(-2, -3)$." },
          { type: "num", prompt: "Same parabola: what is its axis of symmetry?", pre: "$x =$", answer: -2, skill: "Parabolas intro",
            scene: para(vf(1, -2, -3)), near: [{ v: -3, fb: "The axis of symmetry is the **vertical** line through the vertex: $x = \\ldots$" }],
            hints: ["It's the vertical line through the vertex."], why: "$x = -2$." },
          { type: "num", prompt: "A ball's height (in metres) is graphed against time (in seconds). What was its greatest height?", answer: 20, skill: "Interpret parabolas in context",
            scene: para(vf(-5, 2, 20), { x: [-0.5, 5], y: [-2, 24], gridY: 2, labelEveryY: 4, aspect: 1, domain: [0, 4], axisLabels: ["seconds", "metres"], marks: [[2, 20, "(2, 20)"]] }),
            hints: ["The greatest height is the vertex."], why: "The vertex is $(2, 20)$: 20 m, 2 seconds after it was thrown." },
          { type: "num", prompt: "Same ball: after how many seconds did it land?", answer: 4, skill: "Interpret parabolas in context",
            scene: para(vf(-5, 2, 20), { x: [-0.5, 5], y: [-2, 24], gridY: 2, labelEveryY: 4, aspect: 1, domain: [0, 4], axisLabels: ["seconds", "metres"] }),
            hints: ["Landing is when the height is 0."], why: "The graph meets the time axis at $t = 4$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Factored form and zeros",
        blurb: "If a product is zero, one of its factors is: solving and graphing from factored form.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "The key fact",
            prompt: "If two numbers multiply to $0$, at least one of them is $0$. That's the **zero product property**, and it solves any equation in factored form.",
            scene: { type: "walk", rows: [
              { m: "(x - 3)(x + 5) = 0", say: "A product equal to zero." },
              { m: "x - 3 = 0 \\;\\text{ or }\\; x + 5 = 0", say: "One factor must be zero." },
              { m: "x = 3 \\;\\text{ or }\\; x = -5", say: "Two solutions." }] },
            gate: true },
          nums("Solve $(2x - 1)(x + 4) = 0$. Give both solutions.", [0.5, -4], { hints: ["Set each factor to zero: $2x - 1 = 0$ or $x + 4 = 0$."], why: "$x = \\frac{1}{2}$ or $x = -4$." }),
          { type: "learn", kicker: "Graphing",
            prompt: "In $y = a(x - r)(x - s)$, the zeros are $r$ and $s$, the vertex is halfway between them, and $a$ says which way it opens. Move the sliders.",
            scene: fSliders(1, -3, 1), gate: true,
            then: "The zeros are where the graph meets the $x$-axis. The axis of symmetry is halfway between them, $x = \\frac{r + s}{2}$ — and the vertex is on it." },
          withText(fSliders(-1, -2, 4), { prompt: "Graph $y = -(x + 2)(x - 4)$.", skill: "Graph quadratics in factored form",
            hints: ["The zeros are $-2$ and $4$.", "The minus in front makes it open down: $a = -1$."], why: "Zeros $-2$ and $4$, $a = -1$." }),
          { type: "pair", prompt: "What is the vertex of $y = (x - 1)(x - 5)$?", answer: [3, -4], skill: "Graph quadratics in factored form",
            hints: ["The vertex is halfway between the zeros, 1 and 5: at $x = 3$.", "$y = (3 - 1)(3 - 5)$."], why: "$x = 3$ and $y = 2 \\cdot (-2) = -4$." },
          { type: "num", prompt: "A ball's height is $h(t) = -5(t + 1)(t - 3)$ metres after $t$ seconds. When does it land?", answer: 3, post: "seconds", skill: "Quadratic word problems (factored form)",
            near: [{ v: -1, fb: "$t = -1$ is a zero too, but it's before the ball was thrown." }], hints: ["It lands when $h(t) = 0$."], why: "The zeros are $-1$ and $3$; only $t = 3$ makes sense." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Solving by square roots",
        blurb: "When the equation is a square equal to a number, undo the square — both ways.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "If $x^2 = 25$, then $x$ is a number whose square is 25: $5$ **or** $-5$. Taking the square root of both sides needs a $\\pm$.",
            scene: { type: "walk", rows: [
              { m: "2(x - 3)^2 = 32", say: "Get the square on its own first." },
              { m: "(x - 3)^2 = 16", say: "Divide by 2." },
              { m: "x - 3 = \\pm 4", say: "Square root of both sides, with $\\pm$." },
              { m: "x = 7 \\;\\text{ or }\\; x = -1", say: "" }] },
            gate: true },
          nums("Solve $x^2 = 49$.", [7, -7], { hints: ["Which numbers square to 49? There are two."], why: "$x = \\pm 7$." }),
          nums("Solve $(x + 2)^2 = 9$.", [1, -5], { hints: ["$x + 2 = \\pm 3$."], why: "$x + 2 = 3$ gives $x = 1$; $x + 2 = -3$ gives $x = -5$." }),
          nums("Solve $3x^2 - 5 = 16$. (Roots are fine, like sqrt(7).)", [Math.sqrt(7), -Math.sqrt(7)], { shown: "sqrt(7), -sqrt(7)", ph: "e.g. sqrt(3), -sqrt(3)", hints: ["$3x^2 = 21$, so $x^2 = 7$."], why: "$x = \\pm\\sqrt{7}$." }),
          { type: "choice", prompt: "Ada solves $x^2 + 9 = 0$ and gets $x = \\pm 3$. What's wrong?", skill: "Square roots: strategy",
            options: [{ t: "$x^2 = -9$, and no real number squares to a negative — there's no solution" }, { t: "Nothing", fb: "Check: $3^2 + 9 = 18$, not 0." }, { t: "It should be $x = 3$ only", fb: "Neither works: $x^2 = -9$ has no real solution." }],
            answer: 0, why: "Squares are never negative, so $x^2 = -9$ has no real solutions." },
          { type: "order", prompt: "Put the steps for solving $4(x - 1)^2 - 3 = 33$ in order.", skill: "Square roots: with steps",
            items: ["$4(x - 1)^2 = 36$", "$(x - 1)^2 = 9$", "$x - 1 = \\pm 3$", "$x = 4$ or $x = -2$"], why: "Add 3, divide by 4, take square roots, then add 1." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Vertex form",
        blurb: "y = a(x − h)² + k shows the vertex at a glance.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "In **vertex form**, $y = a(x - h)^2 + k$, the vertex is $(h, k)$. Move the sliders.",
            scene: vSliders(1, 2, -3), gate: true,
            then: "$h$ slides it left and right (the opposite of the sign you see), $k$ up and down, and $a$ stretches or flips it — just like the absolute value graphs of Unit 10." },
          withText(vSliders(2, -1, -4), { prompt: "Graph $y = 2(x + 1)^2 - 4$.", skill: "Graph quadratics in vertex form",
            hints: ["The vertex is $(-1, -4)$.", "$a = 2$: opens up, twice as steep."], why: "$a = 2$, vertex $(-1, -4)$." }),
          { type: "num", prompt: "A rocket's height in metres is $h(t) = -5(t - 4)^2 + 80$ after $t$ seconds. What is its greatest height?", answer: 80, post: "m", skill: "Quadratic word problems (vertex form)",
            near: [{ v: 4, fb: "That's when it reaches the top. The height there is $k$." }], hints: ["The vertex is $(4, 80)$."], why: "The maximum is at the vertex: 80 m, after 4 seconds." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Solving by factoring",
        blurb: "Get zero on one side, factor, and use the zero product property.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "Factoring turns a quadratic equation into a product equal to zero — but only if one side is zero first.",
            scene: { type: "walk", rows: [
              { m: "x^2 = 5x + 14", say: "Not zero on one side yet." },
              { m: "x^2 - 5x - 14 = 0", say: "Move everything to one side." },
              { m: "(x - 7)(x + 2) = 0", say: "Factor." },
              { m: "x = 7 \\;\\text{ or }\\; x = -2", say: "" }] },
            gate: true },
          nums("Solve $x^2 + 3x - 10 = 0$.", [2, -5], { hints: ["Multiply to $-10$, add to 3."], why: "$(x + 5)(x - 2) = 0$: $x = -5$ or $x = 2$." }),
          nums("Solve $2x^2 + 5x - 3 = 0$.", [0.5, -3], { hints: ["$a \\times c = -6$: 6 and $-1$.", "$(2x - 1)(x + 3) = 0$."], why: "$x = \\frac{1}{2}$ or $x = -3$." }),
          { type: "learn", kicker: "Using structure",
            prompt: "Sometimes the equation already has a helpful shape: $(x - 2)^2 = 5(x - 2)$ can be solved by treating $(x - 2)$ as one thing. Move it all to one side and factor out $(x - 2)$: $(x - 2)(x - 2 - 5) = 0$, so $x = 2$ or $x = 7$." },
          nums("Solve $x^2 = 6x$.", [0, 6], { hints: ["Don't divide by $x$ — you'd lose a solution. Write $x^2 - 6x = 0$.", "$x(x - 6) = 0$."], why: "$x = 0$ or $x = 6$." })
        ]
      },
      /* ============================================================== 6 */
      {
        title: "The quadratic formula",
        blurb: "One formula that solves every quadratic — and the discriminant that counts its solutions.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "The formula",
            prompt: "Any equation $ax^2 + bx + c = 0$ has solutions $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ (Lesson 8 shows where it comes from.)",
            scene: { type: "walk", rows: [
              { m: "2x^2 + 3x - 1 = 0", say: "$a = 2$, $b = 3$, $c = -1$." },
              { m: "x = \\frac{-3 \\pm \\sqrt{9 + 8}}{4}", say: "$b^2 - 4ac = 9 - 4(2)(-1) = 17$." },
              { m: "x = \\frac{-3 \\pm \\sqrt{17}}{4}", say: "Two solutions, about $0.28$ and $-1.78$." }] },
            gate: true },
          nums("Solve $x^2 - 4x + 1 = 0$ with the quadratic formula. (Roots are fine, like 2 + sqrt(3).)", [2 + Math.sqrt(3), 2 - Math.sqrt(3)], { shown: "2 + sqrt(3), 2 - sqrt(3)", ph: "e.g. 1 + sqrt(2), 1 - sqrt(2)",
            hints: ["$a = 1$, $b = -4$, $c = 1$: $x = \\frac{4 \\pm \\sqrt{16 - 4}}{2}$.", "$\\sqrt{12} = 2\\sqrt{3}$."], why: "$x = \\frac{4 \\pm 2\\sqrt{3}}{2} = 2 \\pm \\sqrt{3}$." }),
          { type: "learn", kicker: "The discriminant",
            prompt: "The part under the root, $b^2 - 4ac$, is the **discriminant**. It says how many solutions there are before you work them out.",
            scene: { type: "walk", rows: [
              { m: "b^2 - 4ac > 0", say: "Two solutions (the $\\pm$ gives two different numbers)." },
              { m: "b^2 - 4ac = 0", say: "One solution (plus or minus zero is the same)." },
              { m: "b^2 - 4ac < 0", say: "No real solutions (no square root of a negative)." }] },
            gate: true },
          { type: "choice", prompt: "How many real solutions does $3x^2 - 2x + 5 = 0$ have?", skill: "Number of solutions of quadratic equations",
            options: [{ t: "None" }, { t: "Two", fb: "$b^2 - 4ac = 4 - 60 = -56$: negative." }, { t: "One", fb: "The discriminant is $-56$, not 0." }], answer: 0, why: "$(-2)^2 - 4(3)(5) = -56 < 0$." }
        ]
      },
      /* ============================================================== 7 */
      {
        title: "Completing the square",
        blurb: "Make a perfect square by filling in the corner.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Here is $x^2 + 6x$ in tiles: the $x^2$ square, with the six $x$ strips split between two sides and an empty corner. Fill the corner in.",
            scene: { type: "tiles", mode: "square", b: 6, gate: true }, gate: true,
            then: "It took $9$ unit squares — half of 6, squared. $x^2 + 6x + 9 = (x + 3)^2$. Adding $\\left(\\frac{b}{2}\\right)^2$ to $x^2 + bx$ always **completes the square**." },
          { type: "num", prompt: "What number makes $x^2 + 10x + \\square$ a perfect square?", answer: 25, skill: "Completing the square (intro)",
            near: [{ v: 5, fb: "Half of 10 is 5 — then square it." }, { v: 100, fb: "Square half of 10, not 10 itself." }], hints: ["$\\left(\\frac{10}{2}\\right)^2$."], why: "$5^2 = 25$: $x^2 + 10x + 25 = (x + 5)^2$." },
          { type: "learn", kicker: "Rewriting",
            prompt: "To rewrite $x^2 + bx + c$ as $(x + p)^2 + q$, add and take away $\\left(\\frac{b}{2}\\right)^2$.",
            scene: { type: "walk", rows: [
              { m: "x^2 + 6x + 2", say: "" },
              { m: "= (x^2 + 6x + 9) - 9 + 2", say: "Add 9 to make the square — and take it away again." },
              { m: "= (x + 3)^2 - 7", say: "" }] },
            gate: true },
          { type: "table", prompt: "Rewrite $x^2 - 8x + 5$ as $(x + p)^2 + q$.", skill: "Completing the square (intermediate)",
            head: ["$p$", "$q$"], rows: [[null, null]], answers: [[0, 0, -4], [0, 1, -11]],
            hints: ["Half of $-8$ is $-4$: $(x - 4)^2 = x^2 - 8x + 16$.", "Then $5 - 16$."], why: "$(x - 4)^2 - 11$." }
        ]
      },
      /* ============================================================== 8 */
      {
        title: "More on completing the square",
        blurb: "Solving with it, handling a leading coefficient, and where the quadratic formula comes from.",
        mins: 12, v: 1,
        steps: [
          { type: "learn", kicker: "Solving",
            prompt: "Completing the square turns any quadratic equation into a square equal to a number — which square roots can finish.",
            scene: { type: "walk", rows: [
              { m: "x^2 + 4x - 7 = 0", say: "" },
              { m: "x^2 + 4x = 7", say: "Move the number across." },
              { m: "x^2 + 4x + 4 = 11", say: "Add $\\left(\\frac{4}{2}\\right)^2 = 4$ to **both** sides." },
              { m: "(x + 2)^2 = 11", say: "" },
              { m: "x = -2 \\pm \\sqrt{11}", say: "" }] },
            gate: true },
          nums("Solve $x^2 - 6x + 4 = 0$ by completing the square. (Roots are fine.)", [3 + Math.sqrt(5), 3 - Math.sqrt(5)], { shown: "3 + sqrt(5), 3 - sqrt(5)", ph: "e.g. 2 + sqrt(3), 2 - sqrt(3)",
            hints: ["$x^2 - 6x = -4$, then add 9 to both sides.", "$(x - 3)^2 = 5$."], why: "$x = 3 \\pm \\sqrt{5}$." }),
          { type: "learn", kicker: "With a leading coefficient",
            prompt: "If $x^2$ has a number in front, factor it out of the $x$ terms first.",
            scene: { type: "walk", rows: [
              { m: "2x^2 + 12x + 7", say: "" },
              { m: "= 2(x^2 + 6x) + 7", say: "" },
              { m: "= 2(x^2 + 6x + 9) - 18 + 7", say: "Adding 9 inside the bracket adds $2 \\times 9 = 18$, so take 18 away." },
              { m: "= 2(x + 3)^2 - 11", say: "" }] },
            gate: true },
          { type: "table", prompt: "Rewrite $3x^2 - 12x + 5$ as $3(x + p)^2 + q$.", skill: "Complete the square (leading coefficient)",
            head: ["$p$", "$q$"], rows: [[null, null]], answers: [[0, 0, -2], [0, 1, -7]],
            hints: ["$3(x^2 - 4x) + 5$.", "Add 4 inside: that adds 12, so take 12 away."], why: "$3(x - 2)^2 - 7$." },
          { type: "learn", kicker: "The proof",
            prompt: "Complete the square on $ax^2 + bx + c = 0$ with letters and the quadratic formula falls out.",
            scene: { type: "walk", rows: [
              { m: "x^2 + \\frac{b}{a}x = -\\frac{c}{a}", say: "Divide by $a$; move $c$ across." },
              { m: "\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2}{4a^2} - \\frac{c}{a} = \\frac{b^2 - 4ac}{4a^2}", say: "Add $\\left(\\frac{b}{2a}\\right)^2$ to both sides." },
              { m: "x + \\frac{b}{2a} = \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a}", say: "Square roots." },
              { m: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", say: "The quadratic formula." }] },
            gate: true }
        ]
      },
      /* ============================================================== 9 */
      {
        title: "Which method?",
        blurb: "Choosing the quickest way to solve a quadratic.",
        mins: 7, v: 1,
        steps: [
          { type: "learn", kicker: "A strategy",
            prompt: "**No $x$ term** ($ax^2 + c = 0$, or a square equal to a number)? Square roots. <br>**Factors easily**? Factor and use the zero product property. <br>**$a = 1$ and $b$ even**? Completing the square is neat. <br>**Anything else**? The quadratic formula always works." },
          { type: "choice", prompt: "Which method is quickest for $(x - 5)^2 = 12$?", skill: "Strategy in solving quadratics",
            options: [{ t: "Take square roots" }, { t: "Expand and use the quadratic formula", fb: "That works, but it undoes a square that's already there." }, { t: "Factoring", fb: "$x^2 - 10x + 13$ doesn't factor with whole numbers." }],
            answer: 0, why: "$x - 5 = \\pm\\sqrt{12}$: done in one step." },
          { type: "choice", prompt: "And for $x^2 + x - 12 = 0$?", skill: "Strategy in solving quadratics",
            options: [{ t: "Factoring" }, { t: "Square roots", fb: "There's an $x$ term, so it isn't a square equal to a number." }, { t: "It has no solutions", fb: "$b^2 - 4ac = 1 + 48 = 49 > 0$: two." }],
            answer: 0, why: "$(x + 4)(x - 3) = 0$." }
        ]
      },
      /* ============================================================== 10 */
      {
        title: "Standard form",
        blurb: "y = ax² + bx + c: the vertex from x = −b/2a.",
        mins: 9, v: 1,
        steps: [
          { type: "learn", kicker: "The vertex",
            prompt: "Standard form, $y = ax^2 + bx + c$, shows the $y$-intercept $(0, c)$ directly. The vertex is on the axis of symmetry $x = -\\frac{b}{2a}$ (halfway between the zeros, from the formula).",
            scene: { type: "walk", rows: [
              { m: "y = x^2 - 6x + 5", say: "" },
              { m: "x = -\\frac{-6}{2(1)} = 3", say: "The axis of symmetry." },
              { m: "y = 9 - 18 + 5 = -4", say: "Put $x = 3$ back in." },
              { m: "\\text{vertex } (3, -4)", say: "" }] },
            gate: true },
          { type: "pair", prompt: "What is the vertex of $y = 2x^2 + 8x + 3$?", answer: [-2, -5], skill: "Graph quadratics in standard form",
            hints: ["$x = -\\frac{8}{2 \\cdot 2} = -2$.", "$y = 2(4) - 16 + 3$."], why: "$(-2, -5)$." },
          { type: "num", prompt: "A ball's height in metres is $h(t) = -5t^2 + 20t + 2$. How high does it get?", answer: 22, post: "m", skill: "Quadratic word problems (standard form)",
            near: [{ v: 2, fb: "That's the height it was thrown from, at $t = 0$." }], hints: ["The top is at $t = -\\frac{20}{2(-5)} = 2$.", "$h(2) = -20 + 40 + 2$."], why: "$h(2) = 22$ m." }
        ]
      },
      /* ============================================================== 11 */
      {
        title: "Features and forms",
        blurb: "Each form shows a different feature; rewriting reveals the rest.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Which form shows what",
            prompt: "**Factored**, $a(x - r)(x - s)$: the zeros $r$ and $s$. <br>**Vertex**, $a(x - h)^2 + k$: the vertex $(h, k)$ and the maximum or minimum value $k$. <br>**Standard**, $ax^2 + bx + c$: the $y$-intercept $c$. <br>Every form shows $a$: up if positive, down if negative." },
          { type: "choice", prompt: "Which form of $f$ shows its minimum value directly?", skill: "Features of quadratics: strategy",
            options: [{ t: "$f(x) = (x - 1)^2 - 9$" }, { t: "$f(x) = (x + 2)(x - 4)$", fb: "Factored form shows the zeros, $-2$ and $4$." }, { t: "$f(x) = x^2 - 2x - 8$", fb: "Standard form shows the $y$-intercept, $-8$." }],
            answer: 0, why: "Vertex form: the minimum value is $-9$, at $x = 1$." },
          nums("What are the zeros of $f(x) = x^2 + 2x - 15$?", [3, -5], { hints: ["Factor: $(x + 5)(x - 3)$."], why: "$x = -5$ and $x = 3$." }),
          { type: "choice", prompt: "A ball's height is $h(t) = -16(t - 2)^2 + 70$ feet. What does the 70 tell you?", skill: "Interpret quadratic models",
            options: [{ t: "Its greatest height is 70 feet" }, { t: "It lands after 70 seconds", fb: "70 is a height — the vertex's $y$-coordinate." }, { t: "It was thrown from 70 feet", fb: "At $t = 0$ it's $-64 + 70 = 6$ feet." }],
            answer: 0, why: "Vertex $(2, 70)$: highest point, 70 feet." }
        ]
      },
      /* ============================================================== 12 */
      {
        title: "Comparing quadratics",
        blurb: "Two quadratics told differently — compare their features.",
        mins: 6, v: 1,
        steps: [
          { type: "choice", prompt: "$f(x) = -(x - 1)^2 + 6$. The graph shows $g$. Which has the greater maximum value?", skill: "Compare quadratic functions",
            scene: para(vf(-2, -1, 4)),
            options: [{ t: "$f$" }, { t: "$g$", fb: "$g$'s highest point is at height 4; $f$'s vertex is at height 6." }, { t: "They're equal", fb: "$f$ reaches 6; $g$ only 4." }],
            answer: 0, why: "$f$'s maximum is 6, $g$'s is 4." }
        ]
      },
      /* ============================================================== 13 */
      {
        title: "Transforming parabolas",
        blurb: "Shifting, stretching and flipping y = x².",
        mins: 8, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Starting from $y = x^2$ (dashed), move the vertex with $h$ and $k$.",
            scene: vSliders(1, -3, 2, ["h", "k"]), gate: true,
            then: "$y = (x - h)^2 + k$ is $y = x^2$ moved right $h$ and up $k$." },
          { type: "choice", prompt: "How does $y = (x + 4)^2 - 1$ compare with $y = x^2$?", skill: "Shift parabolas",
            options: [{ t: "Left 4, down 1" }, { t: "Right 4, down 1", fb: "$x + 4 = x - (-4)$: it moves left." }, { t: "Left 1, down 4", fb: "The number inside the bracket moves it sideways." }],
            answer: 0, why: "Vertex $(-4, -1)$." },
          withText(vSliders(-0.5, 0, 0, ["a"]), { prompt: "Make $y = -\\frac{1}{2}x^2$ from $y = x^2$.", skill: "Scale & reflect parabolas",
            hints: ["Negative: flipped. A half: wider."], why: "$a = -\\frac{1}{2}$." })
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Parabolas, and solving and graphing with factored form.", skills: ["a14-intro", "a14-context", "a14-graph-read", "a14-zpp", "a14-graph-fact", "a14-words-fact"], per: 1 },
      { title: "Quiz 2", after: 4, blurb: "Solving by square roots, and vertex form.", skills: ["a14-sqrt-intro", "a14-sqrt", "a14-sqrt-strat", "a14-sqrt-steps", "a14-graph-vertex", "a14-words-vertex"], per: 1 },
      { title: "Quiz 3", after: 6, blurb: "Solving by factoring and with the quadratic formula.", skills: ["a14-fact-intro", "a14-fact", "a14-structure", "a14-formula", "a14-nsol"], per: 2 },
      { title: "Quiz 4", after: 9, blurb: "Completing the square, and choosing a method.", skills: ["a14-cts-intro", "a14-cts-mid", "a14-cts-solve", "a14-cts-a", "a14-strategy"], per: 2 },
      { title: "Quiz 5", after: 11, blurb: "Standard form, and the features and forms of quadratics.", skills: ["a14-graph-std", "a14-words-std", "a14-feat-strat", "a14-features", "a14-graph-any", "a14-models"], per: 1 },
      { title: "Quiz 6", after: 13, blurb: "Comparing and transforming quadratics.", skills: ["a14-compare", "a14-shift", "a14-scale"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Parabolas",
        keys: [["vertex", "the turning point — a maximum if it opens down, a minimum if up"], ["axis of symmetry", "the vertical line through the vertex, $x = h$"], ["zeros", "where it crosses the $x$-axis"], ["$y$-intercept", "where it crosses the $y$-axis"]],
        say: ["In a story — a thrown ball — the vertex is the highest point and when it happens, and the positive zero is when it lands."] },
      { t: "Factored form and the zero product property",
        say: ["If $AB = 0$ then $A = 0$ or $B = 0$. So $(x - r)(x - s) = 0$ has solutions $r$ and $s$ — and the graph of $y = a(x - r)(x - s)$ crosses the $x$-axis there, with its vertex halfway between."],
        eg: { q: "Solve $x^2 = 5x + 14$.", rows: [["x^2 - 5x - 14 = 0", "Zero on one side first."], ["(x - 7)(x + 2) = 0", ""], ["x = 7 \\text{ or } x = -2", ""]] },
        watch: "Don't divide both sides by $x$: $x^2 = 6x$ has two solutions, 0 and 6." },
      { t: "Square roots",
        say: ["When the equation is a square equal to a number, get the square alone and take square roots of both sides — with $\\pm$."],
        eg: { q: "Solve $2(x - 3)^2 = 32$.", rows: [["(x - 3)^2 = 16", ""], ["x - 3 = \\pm 4", ""], ["x = 7 \\text{ or } x = -1", ""]] },
        watch: "$x^2 = -9$ has no real solutions: no real number squares to a negative." },
      { t: "Vertex form and standard form",
        keys: [["$y = a(x - h)^2 + k$", "vertex $(h, k)$"], ["$y = ax^2 + bx + c$", "$y$-intercept $(0, c)$; vertex at $x = -\\frac{b}{2a}$"]],
        say: ["$a > 0$ opens up, $a < 0$ opens down; the bigger $|a|$, the narrower."] },
      { t: "The quadratic formula and the discriminant",
        say: ["For $ax^2 + bx + c = 0$: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. It always works."],
        keys: [["$b^2 - 4ac > 0$", "two real solutions"], ["$b^2 - 4ac = 0$", "one"], ["$b^2 - 4ac < 0$", "none"]],
        eg: { q: "Solve $x^2 - 4x + 1 = 0$.", rows: [["x = \\frac{4 \\pm \\sqrt{12}}{2}", ""], ["x = 2 \\pm \\sqrt{3}", ""]] },
        watch: "Take care with $-b$ and with $b^2$ when $b$ is negative: $b = -4$ gives $-b = 4$ and $b^2 = 16$." },
      { t: "Completing the square",
        say: ["$x^2 + bx$ becomes a perfect square when you add $\\left(\\frac{b}{2}\\right)^2$: $x^2 + 6x + 9 = (x + 3)^2$. To rewrite, add it and take it away; to solve, add it to both sides.",
              "With a leading coefficient, factor it out of the $x$ terms first — and remember that whatever you add inside the bracket is multiplied by it."],
        eg: { q: "Rewrite $2x^2 + 12x + 7$.", rows: [["2(x^2 + 6x + 9) - 18 + 7", ""], ["2(x + 3)^2 - 11", ""]] } },
      { t: "Choosing a method",
        say: ["A square equal to a number → square roots. Factors nicely → factoring. $a = 1$ and $b$ even → completing the square. Otherwise → the quadratic formula."] },
      { t: "Transformations",
        say: ["$y = a(x - h)^2 + k$ is $y = x^2$ moved right $h$ and up $k$, stretched by $a$ (and flipped if $a < 0$)."],
        watch: "$(x + 4)^2$ moves **left** 4." }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a14-intro", title: "Parabolas intro", lesson: 1,
        gen: function (R) {
          var a = R.pick([1, -1, 0.5, -0.5, 2]), h = R.int(-4, 4), k = R.int(-5, 5), q = R.int(0, 3), sc = para(vf(a, h, k));
          if (q === 0) return { type: "pair", prompt: "What is the vertex of this parabola?", answer: [h, k], scene: sc, hints: ["The vertex is the turning point — the " + (a > 0 ? "lowest" : "highest") + " point."], why: "$" + pt(h, k) + "$." };
          if (q === 1) return { type: "num", prompt: "What is the axis of symmetry of this parabola?", pre: "$x =$", answer: h, scene: sc,
            near: nears(h, [{ v: k, fb: "The axis of symmetry is the **vertical** line through the vertex: $x = \\ldots$" }]), hints: ["The vertical line through the vertex."], why: "$x = " + h + "$." };
          if (q === 2) return mc(R, { prompt: "Does this parabola have a maximum or a minimum, and what is its value?", scene: sc, right: (a > 0 ? "A minimum" : "A maximum") + " of $" + k + "$",
            wrong: [{ t: (a > 0 ? "A maximum" : "A minimum") + " of $" + k + "$", fb: "It opens " + (a > 0 ? "up, so its vertex is the lowest point" : "down, so its vertex is the highest point") + "." },
                    { t: (a > 0 ? "A minimum" : "A maximum") + " of $" + (h !== k ? h : k + 2) + "$", fb: "The value is the height of the vertex — its $y$-coordinate." }],
            hints: ["Up-opening parabolas have a lowest point; down-opening ones a highest."], why: "Vertex $" + pt(h, k) + "$, opening " + (a > 0 ? "up" : "down") + "." });
          var c = a * h * h + k;
          return { type: "pair", prompt: "Where does this parabola cross the $y$-axis? Give the point.", answer: [0, c], scene: para(vf(a, h, k), { y: [Math.min(-8, c - 2), Math.max(8, c + 2)] }), hints: ["On the $y$-axis, $x = 0$."], why: "$(0, " + num(c) + ")$." };
        } },
      { id: "a14-context", title: "Interpret parabolas in context", lesson: 1,
        gen: function (R) {
          var T = R.int(2, 4), H = R.pick([20, 30, 40, 60, 80, 100]), a = -H / (T * T), q = R.int(0, 2), g = H <= 40 ? 5 : 10;
          var sc = para(vf(a, T, H), { x: [-0.5, 2 * T + 1], y: [-g, H + 2 * g], gridY: g, labelEveryY: 2 * g, aspect: 1, domain: [0, 2 * T], axisLabels: ["seconds", "metres"] });
          var lead = "A ball is thrown up from the ground. The graph shows its height against time. ";
          if (q === 0) return { type: "num", prompt: lead + "How high does it go, in metres?", answer: H, scene: sc, near: nears(H, [{ v: T, fb: "That's when it's highest. The question asks how high." }]), hints: ["The highest point is the vertex."], why: "The vertex is $" + pt(T, H) + "$." };
          if (q === 1) return { type: "num", prompt: lead + "After how many seconds is it highest?", answer: T, scene: sc, near: nears(T, [{ v: H, fb: "That's the height. The question asks when." }]), hints: ["Read the time of the vertex."], why: "At $t = " + T + "$." };
          return { type: "num", prompt: lead + "After how many seconds does it land?", answer: 2 * T, scene: sc, hints: ["Landing is when the height is 0 again."], why: "The graph returns to 0 at $t = " + 2 * T + "$." };
        } },
      { id: "a14-graph-read", title: "Interpret a quadratic graph", lesson: 1,
        gen: function (R) {
          var a = R.pick([1, -1, 0.5, -0.5]), h = R.int(-3, 3), k = R.int(-4, 4), up = a > 0;
          if (R.chance(0.5)) {
            var inc = R.chance(0.5), side = inc === up ? ">" : "<";
            return mc(R, { prompt: "For which values of $x$ is this function " + (inc ? "increasing" : "decreasing") + "?", scene: para(vf(a, h, k)), right: "$x " + side + " " + h + "$",
              wrong: [{ t: "$x " + (side === ">" ? "<" : ">") + " " + h + "$", fb: "Read the graph from left to right: on that side it goes " + (inc ? "down" : "up") + "." },
                      { t: "$x " + side + " " + (k !== h ? k : h + 2) + "$", fb: "The graph turns at the vertex, $x = " + h + "$ — the $x$-coordinate." }],
              hints: ["The graph turns at the vertex. Which side goes " + (inc ? "up" : "down") + " as you move right?"], why: "It turns at $x = " + h + "$; it " + (inc ? "rises" : "falls") + " for $x " + side + " " + h + "$." });
          }
          var right = "The function is " + (up ? "decreasing" : "increasing") + " for $x < " + h + "$";
          return mc(R, { prompt: "Which statement about this parabola is true?", scene: para(vf(a, h, k)), right: right,
            wrong: [{ t: "The function is " + (up ? "increasing" : "decreasing") + " for $x < " + h + "$", fb: "Read left to right up to the vertex: the graph goes " + (up ? "down" : "up") + "." },
                    { t: "The axis of symmetry is $y = " + k + "$", fb: "The axis of symmetry is vertical: $x = " + h + "$." },
                    { t: "The " + (up ? "maximum" : "minimum") + " value is $" + k + "$", fb: "It opens " + (up ? "up, so " + k + " is its minimum" : "down, so " + k + " is its maximum") + "." }],
            hints: ["Find the vertex, then read the graph left to right."], why: right + ": up to the vertex at $x = " + h + "$ the graph " + (up ? "falls" : "rises") + "." });
        } },
      { id: "a14-zpp", title: "Zero product property", lesson: 2,
        gen: function (R) {
          var a = R.pick([1, 1, 2, 3]), b = R.nz(-9, 9), c = R.pick([1, 1, 2]), d = R.nz(-9, 9), k = R.chance(0.2) ? R.pick([2, -3, 4]) : 1;
          var tex = (k === 1 ? "" : k) + fac(a, b) + fac(c, d) + " = 0";
          return nums("Solve $" + tex + "$. Give every solution.", [-b / a, -d / c].filter(function (v, i, arr) { return arr.indexOf(v) === i; }), { hints: ["Set each bracket equal to 0."], why: "$" + poly([[a, "x"], [b, ""]]) + " = 0$ gives $x = " + frac(-b, a) + "$; $" + poly([[c, "x"], [d, ""]]) + " = 0$ gives $x = " + frac(-d, c) + "$." });
        } },
      { id: "a14-graph-fact", title: "Graph quadratics in factored form", lesson: 2,
        gen: function (R) {
          var r = R.int(-6, 2), s = r + R.int(2, 6), a = R.pick([1, -1, 0.5, -0.5]);
          if (Math.abs(a * ((s - r) / 2) * ((s - r) / 2)) > 8) a = a > 0 ? 0.5 : -0.5;
          var S = fSliders(a, r, s);
          S.prompt = "Graph $" + fTex(a, r, s) + "$.";
          S.hints = ["The zeros are $" + r + "$ and $" + s + "$.", a > 0 ? "$a$ is positive: it opens up." : "$a$ is negative: it opens down."]; S.why = "Zeros $" + r + "$ and $" + s + "$, $a = " + num(a) + "$.";
          return S;
        } },
      { id: "a14-words-fact", title: "Quadratic word problems (factored form)", lesson: 2,
        gen: function (R) {
          var T = R.pick([
            function () { var p = R.int(1, 3), q = R.int(3, 6); return { p: "A ball's height is $h(t) = -5(t + " + p + ")(t - " + q + ")$ metres after $t$ seconds. When does it hit the ground, in seconds?", a: q, wrong: -p, why: "The zeros are $-" + p + "$ and $" + q + "$; only $t = " + q + "$ is after the throw." }; },
            function () { var p = R.pick([5, 10]), q = p + R.pick([20, 30, 40]); return { p: "A shop's profit is $P(x) = -2(x - " + p + ")(x - " + q + ")$ dollars when it charges $x$ dollars. At what price is the profit greatest?", a: (p + q) / 2, wrong: q, why: "The greatest profit is at the vertex, halfway between the zeros: $\\frac{" + p + " + " + q + "}{2} = " + (p + q) / 2 + "$." }; },
            function () { var q = 2 * R.int(3, 12); return { p: "A frog jumps from the ground. Its height is $h(x) = -\\frac{1}{4}x(x - " + q + ")$ centimetres when it has moved $x$ centimetres forward. How far forward does it land?", a: q, wrong: 0, why: "The zeros are $0$ (where it takes off) and $" + q + "$ (where it lands)." }; }])();
          return { type: "num", prompt: T.p, answer: T.a, near: nears(T.a, [{ v: T.wrong, fb: "That's a zero, but it doesn't answer the question in this situation." }]), hints: ["Use the zeros: where each factor is 0."], why: T.why };
        } },
      { id: "a14-sqrt-intro", title: "Quadratics by taking square roots (intro)", lesson: 3,
        gen: function (R) {
          var n = R.int(1, 12), k = R.pick([1, 1, 2, 3, 4]), c = R.int(0, 20);
          var tex = (k === 1 ? "" : k) + "x^2" + (c ? " - " + c : "") + " = " + (k * n * n - c);
          return nums("Solve $" + tex + "$.", [n, -n], { hints: [(c ? "Add " + c + " to both sides" : "") + (k > 1 ? (c ? ", then divide" : "Divide") + " by " + k : "") + (c || k > 1 ? ": " : "") + "$x^2 = " + n * n + "$.", "There are two square roots: positive and negative."], why: "$x = \\pm " + n + "$." });
        } },
      { id: "a14-sqrt", title: "Quadratics by taking square roots", lesson: 3,
        gen: function (R) {
          var h = R.nz(-6, 6), k = R.pick([1, 2, 3]), n = R.int(1, 7), c = R.int(-9, 9), irr = R.chance(0.4);
          var sq = irr ? R.pick([2, 3, 5, 6, 7]) : n * n, rhs = k * sq + c;
          var tex = (k === 1 ? "" : k) + "(" + sh(h) + ")^2" + kT(c) + " = " + rhs;
          if (irr) return nums("Solve $" + tex + "$. (Roots are fine, like 2 + sqrt(3).)", [h + Math.sqrt(sq), h - Math.sqrt(sq)], { shown: h + " + sqrt(" + sq + "), " + h + " - sqrt(" + sq + ")", ph: "e.g. 1 + sqrt(2), 1 - sqrt(2)",
            hints: ["Get the square alone: $(" + sh(h) + ")^2 = " + sq + "$.", "$" + sh(h) + " = \\pm\\sqrt{" + sq + "}$."], why: "$x = " + h + " \\pm \\sqrt{" + sq + "}$." });
          return nums("Solve $" + tex + "$.", h + n === h - n ? [h] : [h + n, h - n], { hints: ["Get the square alone: $(" + sh(h) + ")^2 = " + sq + "$.", "$" + sh(h) + " = \\pm " + n + "$."], why: "$x = " + h + " \\pm " + n + "$: $" + (h + n) + "$ or $" + (h - n) + "$." });
        } },
      { id: "a14-sqrt-strat", title: "Quadratics by taking square roots: strategy", lesson: 3,
        gen: function (R) {
          var n = R.int(2, 9), h = R.nz(-5, 5), k = R.pick([2, 3]);
          var T = R.pick([
            { steps: ["(x " + (h > 0 ? "- " + h : "+ " + -h) + ")^2 = " + n * n, "x " + (h > 0 ? "- " + h : "+ " + -h) + " = " + n, "x = " + (h + n)], err: "They forgot the negative square root: $x " + (h > 0 ? "- " + h : "+ " + -h) + " = -" + n + "$ as well." },
            { steps: [k + "x^2 = " + k * n * n, "x^2 = " + k * n * n, "x = \\pm\\sqrt{" + k * n * n + "}"], err: "They didn't divide by " + k + " before taking the root: $x^2 = " + n * n + "$, so $x = \\pm " + n + "$." },
            { steps: ["x^2 + " + n * n + " = 0", "x^2 = " + n * n, "x = \\pm " + n], err: "Taking " + n * n + " from both sides gives $x^2 = -" + n * n + "$ — which has no real solutions." }]);
          return mc(R, { prompt: "Here is someone's working:<br>" + lines(T.steps) + "<br>What went wrong?", right: T.err,
            wrong: [{ t: "Nothing — it's correct", fb: "Check the answer by putting it back into the first line." }, { t: "A square root is never negative, so the answer should be positive only", fb: "The equation asks which numbers square to it — and a negative number squares to the same thing as a positive one." }],
            hints: ["Check each step: was the same done to both sides, and were both square roots kept?"], why: T.err });
        } },
      { id: "a14-sqrt-steps", title: "Quadratics by taking square roots: with steps", lesson: 3,
        gen: function (R) {
          var k = R.pick([2, 3, 4]), h = R.nz(-5, 5), n = R.int(1, 6), c = R.nz(-9, 9), rhs = k * n * n + c;
          return { type: "order", prompt: "Put the steps for solving $" + k + "(" + sh(h) + ")^2" + kT(c) + " = " + rhs + "$ in order.",
            items: ["$" + k + "(" + sh(h) + ")^2 = " + k * n * n + "$", "$(" + sh(h) + ")^2 = " + n * n + "$", "$" + sh(h) + " = \\pm " + n + "$", "$x = " + (h + n) + "$ or $x = " + (h - n) + "$"],
            hints: ["Undo in reverse: first the number added, then the multiplier, then the square."], why: (c > 0 ? "Take " + c : "Add " + -c) + ", divide by " + k + ", take square roots, then " + (h > 0 ? "add " + h : "take " + -h) + "." };
        } },
      { id: "a14-graph-vertex", title: "Graph quadratics in vertex form", lesson: 4,
        gen: function (R) {
          var a = R.pick([1, -1, 2, -2, 0.5, -0.5]), h = R.int(-4, 4), k = R.int(-5, 5);
          var S = vSliders(a, h, k); S.prompt = "Graph $" + vTex(a, h, k) + "$.";
          S.hints = ["The vertex is $" + pt(h, k) + "$.", "$a = " + num(a) + "$: " + (a > 0 ? "opens up" : "opens down") + "."]; S.why = "Vertex $" + pt(h, k) + "$, $a = " + num(a) + "$."; return S;
        } },
      { id: "a14-words-vertex", title: "Quadratic word problems (vertex form)", lesson: 4,
        gen: function (R) {
          var t = R.int(1, 6), H = R.pick([45, 60, 80, 125]), a = R.pick([-5, -2, -1]), when = R.chance(0.5);
          var S = R.pick([["A firework's height", "metres", "seconds"], ["A drone's height", "metres", "seconds"]]);
          var tex = "h(t) = " + aT(a) + "(t - " + t + ")^2 + " + H;
          return { type: "num", prompt: S[0] + " is $" + tex + "$ " + S[1] + " after $t$ " + S[2] + ". " + (when ? "After how many seconds is it highest?" : "What is its greatest height, in " + S[1] + "?"),
            answer: when ? t : H, near: nears(when ? t : H, [{ v: when ? H : t, fb: when ? "That's the height. The time is $h$ in the vertex." : "That's the time. The height is $k$ in the vertex." }]),
            hints: ["The vertex of $a(t - h)^2 + k$ is $(h, k)$."], why: "Vertex $" + pt(t, H) + "$." };
        } },
      { id: "a14-fact-intro", title: "Quadratics by factoring (intro)", lesson: 5,
        gen: function (R) {
          var Q = rootsQuad(R);
          return nums("Solve $" + quad(Q.a, Q.b, Q.c) + " = 0$.", Q.roots, { hints: ["Factor: two numbers that multiply to " + Q.c + " and add to " + Q.b + "."], why: "The solutions are $" + Q.roots.join("$ and $") + "$." });
        } },
      { id: "a14-fact", title: "Quadratics by factoring", lesson: 5,
        gen: function (R) {
          if (R.chance(0.5)) { // leading coefficient
            var a = R.pick([2, 3]), b = R.nz(-5, 5), c = R.nz(-6, 6); while (gcd(a, Math.abs(b)) !== 1) b = R.nz(-5, 5);
            var A = a, B = a * c + b, C = b * c;   // (a x + b)(x + c)
            return nums("Solve $" + quad(A, B, C) + " = 0$.", sols([-b / a, -c].filter(function (v, i, arr) { return arr.indexOf(v) === i; })), { hints: ["$a \\times c = " + A * C + "$: find two numbers that multiply to " + A * C + " and add to " + B + ".", "It factors as $" + fac(a, b) + fac(1, c) + "$."], why: "$x = " + frac(-b, a) + "$ or $x = " + -c + "$." });
          }
          var r = R.int(-7, 7), s = R.int(-7, 7), k = R.nz(-6, 6);
          // x² = (r + s)x − rs, with k added to both sides
          var left = poly([[1, "x^2"], [k, ""]]), right = poly([[r + s, "x"], [k - r * s, ""]], { keepZero: false });
          return nums("Solve $" + left + " = " + right + "$.", r === s ? [r] : [r, s], { hints: ["Move everything to one side first: $" + quad(1, -(r + s), r * s) + " = 0$.", "Then factor."], why: "$" + fac(1, -r) + fac(1, -s) + " = 0$: $x = " + (r === s ? r : r + "$ or $x = " + s) + "$." });
        } },
      { id: "a14-structure", title: "Solve equations using structure", lesson: 5,
        gen: function (R) {
          var T = R.int(0, 2), h = R.nz(-5, 5), n = R.int(1, 6);
          if (T === 0) { var m = R.pick([2, 3]); return nums("Solve $(" + m + "x " + (h > 0 ? "- " + h : "+ " + -h) + ")^2 = " + n * n + "$.", sols([(h + n) / m, (h - n) / m]), { hints: ["Treat $" + m + "x " + (h > 0 ? "- " + h : "+ " + -h) + "$ as one thing: it equals $\\pm " + n + "$."], why: "$" + m + "x = " + h + " \\pm " + n + "$, so $x = " + frac(h + n, m) + "$ or $" + frac(h - n, m) + "$." }); }
          if (T === 1) { var k = R.int(2, 6); return nums("Solve $(" + sh(h) + ")^2 = " + k + "(" + sh(h) + ")$.", sols([h, h + k]), { hints: ["Don't divide by $(" + sh(h) + ")$ — you'd lose a solution. Move it all to one side and factor out $(" + sh(h) + ")$."], why: "$(" + sh(h) + ")(" + sh(h) + " - " + k + ") = 0$: $x = " + h + "$ or $x = " + (h + k) + "$." }); }
          var p = R.int(1, 3), q = p + R.int(1, 3); // x⁴ − (p²+q²)x² + p²q² = 0 → x² = p², q²
          return nums("Solve $x^4 - " + (p * p + q * q) + "x^2 + " + p * p * q * q + " = 0$. (Think of it as a quadratic in $x^2$.)", sols([p, -p, q, -q]), { hints: ["Let $u = x^2$: $u^2 - " + (p * p + q * q) + "u + " + p * p * q * q + " = 0$.", "$u = " + p * p + "$ or $u = " + q * q + "$."], why: "$x^2 = " + p * p + "$ or $x^2 = " + q * q + "$: $x = \\pm " + p + ", \\pm " + q + "$." });
        } },
      { id: "a14-formula", title: "Quadratic formula", lesson: 6,
        gen: function (R) {
          var a = R.pick([1, 1, 2, 3, -1]), b = R.int(-7, 7), c = R.int(-6, 6), D = b * b - 4 * a * c, tries = 0;
          while ((D <= 0 || Math.sqrt(D) % 1 === 0) && tries++ < 40) { b = R.int(-7, 7); c = R.int(-6, 6); D = b * b - 4 * a * c; }
          if (D <= 0) { a = 1; b = 2; c = -1; D = 8; }
          // simplify √D = k√m
          var k = 1, m = D; for (var f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
          var g = gcd(gcd(Math.abs(b), k), Math.abs(2 * a)), top = -b / g, kk = k / g, den = 2 * a / g;
          if (den < 0) { top = -top; kk = kk; den = -den; }
          var texRoot = (kk === 1 ? "" : kk) + "\\sqrt{" + m + "}";
          var ansTex = den === 1 ? (top === 0 ? "\\pm " + texRoot : top + " \\pm " + texRoot) : "\\frac{" + (top === 0 ? "" : top) + " \\pm " + texRoot + "}{" + den + "}";
          var v1 = (-b + Math.sqrt(D)) / (2 * a), v2 = (-b - Math.sqrt(D)) / (2 * a);
          return nums("Solve $" + quad(a, b, c) + " = 0$ with the quadratic formula. (Roots are fine, like (1 + sqrt(5))/2.)", [v1, v2],
            { shown: "(" + -b + " + sqrt(" + D + "))/" + 2 * a + ", (" + -b + " - sqrt(" + D + "))/" + 2 * a, ph: "e.g. (1 + sqrt(5))/2, (1 - sqrt(5))/2",
              hints: ["$a = " + a + "$, $b = " + b + "$, $c = " + c + "$.", "$b^2 - 4ac = " + D + "$."], why: "$x = \\frac{" + -b + " \\pm \\sqrt{" + D + "}}{" + 2 * a + "} = " + ansTex + "$." });
        } },
      { id: "a14-nsol", title: "Number of solutions of quadratic equations", lesson: 6,
        gen: function (R) {
          var kind = R.int(0, 2), a = R.nz(-4, 4), b, c;
          if (kind === 1) { var r = R.int(-5, 5); b = -2 * a * r; c = a * r * r; }
          else { b = R.int(-8, 8); c = R.int(-8, 8); var D0 = b * b - 4 * a * c, guard = 0; while ((kind === 0 ? D0 <= 0 : D0 >= 0) && guard++ < 50) { b = R.int(-8, 8); c = R.int(-8, 8); D0 = b * b - 4 * a * c; } }
          var D = b * b - 4 * a * c, right = D > 0 ? "Two" : D === 0 ? "One" : "None";
          return mc(R, { prompt: "How many real solutions does $" + quad(a, b, c) + " = 0$ have?", right: right, keep: true,
            wrong: ["Two", "One", "None"].filter(function (w) { return w !== right; }).map(function (w) { return { t: w, fb: "The discriminant is $" + b + "^2 - 4(" + a + ")(" + c + ") = " + D + "$." }; }),
            hints: ["Work out $b^2 - 4ac$ and look at its sign."], why: "$b^2 - 4ac = " + D + "$: " + (D > 0 ? "positive, two solutions." : D === 0 ? "zero, one solution." : "negative, no real solutions.") });
        } },
      { id: "a14-cts-intro", title: "Completing the square (intro)", lesson: 7,
        gen: function (R) {
          var h = R.nz(-9, 9), b = 2 * h;
          return { type: "num", prompt: "What number makes $" + poly([[1, "x^2"], [b, "x"]]) + " + \\square$ a perfect square?", answer: h * h,
            near: nears(h * h, [{ v: Math.abs(h), fb: "Half of " + b + " is " + h + " — now square it." }, { v: b * b, fb: "Square **half** of " + b + "." }]),
            hints: ["$\\left(\\frac{" + b + "}{2}\\right)^2$."], why: "$" + paren(h) + "^2 = " + h * h + "$: it's $(" + sh(-h) + ")^2$." };
        } },
      { id: "a14-cts-mid", title: "Completing the square (intermediate)", lesson: 7,
        gen: function (R) {
          var p = R.nz(-7, 7), q = R.int(-12, 12), s = blanks(["$p$", "$q$"], [p, q]);
          s.prompt = "Rewrite $" + quad(1, 2 * p, p * p + q) + "$ as $(x + p)^2 + q$.";
          s.hints = ["Half of " + 2 * p + " is " + p + ": $(x " + (p < 0 ? "- " + -p : "+ " + p) + ")^2 = " + quad(1, 2 * p, p * p) + "$.", "Then $q = " + (p * p + q) + " - " + p * p + "$."];
          s.why = "$(x " + (p < 0 ? "- " + -p : "+ " + p) + ")^2 " + (q < 0 ? "- " + -q : "+ " + q) + "$."; return s;
        } },
      { id: "a14-cts-solve", title: "Solve equations by completing the square", lesson: 8,
        gen: function (R) {
          var p = R.nz(-6, 6), irr = R.chance(0.5), m = irr ? R.pick([2, 3, 5, 6, 7, 10]) : Math.pow(R.int(1, 6), 2);
          var c = p * p - m;   // x² + 2px + c = 0 → (x + p)² = m
          var r = Math.sqrt(m);
          return nums("Solve $" + quad(1, 2 * p, c) + " = 0$ by completing the square." + (irr ? " (Roots are fine.)" : ""), irr ? [-p + r, -p - r] : sols([-p + r, -p - r]),
            { shown: irr ? (-p) + " + sqrt(" + m + "), " + (-p) + " - sqrt(" + m + ")" : null, ph: irr ? "e.g. 2 + sqrt(3), 2 - sqrt(3)" : null,
              hints: ["Move " + c + " across, then add $" + p * p + "$ to both sides.", "$(x " + (p < 0 ? "- " + -p : "+ " + p) + ")^2 = " + m + "$."], why: "$x = " + -p + " \\pm " + (irr ? "\\sqrt{" + m + "}" : r) + "$." });
        } },
      { id: "a14-cts-a", title: "Complete the square (leading coefficient ≠ 1)", lesson: 8,
        gen: function (R) {
          var a = R.pick([2, 3, -2, -1, 4]), p = R.nz(-5, 5), q = R.int(-9, 9), s = blanks(["$p$", "$q$"], [p, q]);
          s.prompt = "Rewrite $" + quad(a, 2 * a * p, a * p * p + q) + "$ as $" + (a === -1 ? "-" : a) + "(x + p)^2 + q$.";
          s.hints = ["Factor $" + a + "$ out of the $x$ terms: $" + (a === -1 ? "-" : a) + "(" + poly([[1, "x^2"], [2 * p, "x"]]) + ")$.", "Adding $" + p * p + "$ inside adds $" + a * p * p + "$ overall — so take it away."];
          s.why = "$" + (a === -1 ? "-" : a) + "(x " + (p < 0 ? "- " + -p : "+ " + p) + ")^2 " + (q < 0 ? "- " + -q : "+ " + q) + "$."; return s;
        } },
      { id: "a14-strategy", title: "Strategy in solving quadratics", lesson: 9,
        gen: function (R) {
          var T = R.pick([
            function () { var h = R.nz(-5, 5), k = R.pick([3, 5, 7, 12]); return { p: "$(" + sh(h) + ")^2 = " + k + "$", r: "Take square roots", w: [["Factor", "It's already a square equal to a number."], ["Use the quadratic formula", "That works, but only after expanding a square that's already there."]] }; },
            function () { var r = R.int(-6, 6), s = R.int(-6, 6); return { p: "$" + quad(1, -(r + s), r * s) + " = 0$", r: "Factor", w: [["Take square roots", "There's an $x$ term, so it isn't a square equal to a number."], ["There is no method that works", "It factors: $" + fac(1, -r) + fac(1, -s) + "$."]] }; },
            function () { var b = R.pick([3, 5, 7]), c = R.pick([-1, 1, -3]); return { p: "$2x^2 + " + b + "x " + (c < 0 ? "- " + -c : "+ " + c) + " = 0$", r: "Use the quadratic formula", w: [["Take square roots", "There's an $x$ term."], ["Factor", "It doesn't factor with whole numbers: $b^2 - 4ac = " + (b * b - 8 * c) + "$ isn't a perfect square."]] }; }])();
          return mc(R, { prompt: "Which is the most efficient way to solve " + T.p + "?", right: T.r, wrong: T.w.map(function (x) { return { t: x[0], fb: x[1] }; }),
            hints: ["A square equal to a number → square roots. Factors → factor. Otherwise → the formula."], why: T.r + "." });
        } },
      { id: "a14-graph-std", title: "Graph quadratics in standard form", lesson: 10,
        gen: function (R) {
          var a = R.pick([1, -1, 2, -2]), h = R.int(-3, 3), k = R.int(-5, 5);
          var b = -2 * a * h, c = a * h * h + k, S = vSliders(a, h, k);
          S.prompt = "Graph $" + sTex(a, b, c) + "$. (The sliders set it in vertex form.)";
          S.hints = ["The vertex is at $x = -\\frac{b}{2a} = " + h + "$.", "$y$ there is $" + k + "$."]; S.why = "Vertex $" + pt(h, k) + "$, $a = " + a + "$."; return S;
        } },
      { id: "a14-words-std", title: "Quadratic word problems (standard form)", lesson: 10,
        gen: function (R) {
          var t = R.int(1, 4), h0 = R.int(0, 10), a = -5, b = 10 * t, top = h0 + 5 * t * t, when = R.chance(0.5);
          return { type: "num", prompt: "A ball's height in metres is $h(t) = -5t^2 + " + b + "t" + (h0 ? " + " + h0 : "") + "$ after $t$ seconds. " + (when ? "After how many seconds is it highest?" : "What is its greatest height, in metres?"),
            answer: when ? t : top, near: nears(when ? t : top, [{ v: when ? top : t, fb: when ? "That's the height; the question asks when." : "That's the time; the question asks how high." }, { v: h0, fb: "That's the height at $t = 0$." }]),
            hints: ["The top is at $t = -\\frac{b}{2a} = -\\frac{" + b + "}{2(-5)} = " + t + "$."].concat(when ? [] : ["$h(" + t + ") = -5(" + t * t + ") + " + b * t + (h0 ? " + " + h0 : "") + "$."]),
            why: "At $t = " + t + "$, $h = " + top + "$ m." };
        } },
      { id: "a14-feat-strat", title: "Features of quadratic functions: strategy", lesson: 11,
        gen: function (R) {
          var r = R.nz(-5, 3), s = r + 2 * R.int(1, 3); while (s === 0) s = r + 2 * R.int(1, 3);
          var h = (r + s) / 2, k = -(h - r) * (h - r);
          var forms = { fac: "$f(x) = " + fTex(1, r, s).slice(4) + "$", ver: "$f(x) = " + vTex(1, h, k).slice(4) + "$", std: "$f(x) = " + quad(1, -(r + s), r * s) + "$" };
          var feat = R.pick([["its zeros", "fac"], ["its vertex", "ver"], ["its $y$-intercept", "std"]]);
          var fb = { fac: "Factored form shows the zeros.", ver: "Vertex form shows the vertex.", std: "Standard form shows the $y$-intercept." };
          return mc(R, { prompt: "Which form of $f$ shows " + feat[0] + " directly?", right: forms[feat[1]],
            wrong: ["fac", "ver", "std"].filter(function (k2) { return k2 !== feat[1]; }).map(function (k2) { return { t: forms[k2], fb: fb[k2] }; }),
            hints: ["Factored → zeros; vertex → vertex; standard → $y$-intercept."], why: fb[feat[1]] });
        } },
      { id: "a14-features", title: "Features of quadratic functions", lesson: 11,
        gen: function (R) {
          var r = R.int(-6, 4), s = r + R.int(1, 6), q = R.int(0, 2);
          if (q === 0) return nums("What are the zeros of $f(x) = " + quad(1, -(r + s), r * s) + "$?", r === s ? [r] : [r, s], { hints: ["Factor it."], why: "$f(x) = " + fac(1, -r) + fac(1, -s) + "$: zeros $" + r + "$ and $" + s + "$." });
          var p = R.nz(-5, 5), k = R.int(-9, 9);
          if (q === 1) return { type: "pair", prompt: "What is the vertex of $f(x) = " + quad(1, 2 * p, p * p + k) + "$?", answer: [-p, k], hints: ["Complete the square, or use $x = -\\frac{b}{2a}$."], why: "$f(x) = " + vTex(1, -p, k).slice(4) + "$: vertex $" + pt(-p, k) + "$." };
          var a = R.pick([1, -1, 2]), h = R.int(-4, 4), kk = R.int(-6, 6), c = a * h * h + kk;
          return { type: "pair", prompt: "Where does $f(x) = " + vTex(a, h, kk).slice(4) + "$ cross the $y$-axis?", answer: [0, c], hints: ["Put $x = 0$ in."], why: "$f(0) = " + aT(a) + paren(-h) + "^2" + kT(kk) + " = " + c + "$." };
        } },
      { id: "a14-graph-any", title: "Graph parabolas in all forms", lesson: 11,
        gen: function (R) {
          var form = R.int(0, 2), a = form === 1 ? R.pick([1, -1, 2]) : R.pick([1, -1, 0.5]), h = R.int(-4, 4), k = R.int(-4, 4), tex;
          if (form === 0) tex = vTex(a, h, k);
          else if (form === 1) tex = sTex(a, -2 * a * h, a * h * h + k);
          else { var d = a === 0.5 ? 2 : R.int(1, 2); k = -a * d * d; tex = fTex(a, h - d, h + d); }
          var S = vSliders(a, h, k); S.prompt = "Graph $" + tex + "$. (The sliders set its vertex and stretch.)";
          S.hints = [form === 0 ? "Vertex form: read the vertex." : form === 1 ? "Standard form: the vertex is at $x = -\\frac{b}{2a}$." : "Factored form: the vertex is halfway between the zeros.", "The vertex is $" + pt(h, k) + "$."];
          S.why = "Vertex $" + pt(h, k) + "$, $a = " + num(a) + "$."; return S;
        } },
      { id: "a14-models", title: "Interpret quadratic models", lesson: 11,
        gen: function (R) {
          if (R.chance(0.5)) { var t = R.int(1, 2), H = R.pick([70, 100, 120]), sec = t === 1 ? " second" : " seconds", ft = t === 1 ? " foot" : " feet";
            var askH = R.chance(0.5);
            return mc(R, { prompt: "A ball's height is $h(t) = -16(t - " + t + ")^2 + " + H + "$ feet after $t$ seconds. What does the " + (askH ? H : t) + " tell you?",
              right: askH ? "Its greatest height is " + H + " feet" : "It reaches its greatest height after " + t + sec,
              wrong: [{ t: askH ? "It lands after " + H + " seconds" : "It lands after " + t + sec, fb: "In vertex form the numbers describe the vertex — the highest point." }, { t: askH ? "It was thrown from " + H + " feet" : "Its greatest height is " + t + ft, fb: askH ? "At $t = 0$ it's $" + (H - 16 * t * t) + "$ feet." : t + " is a time, not a height." }],
              hints: ["In $a(t - h)^2 + k$ the vertex is $(h, k)$: time $h$, height $k$."], why: askH ? "The vertex's height: " + H + " feet." : "The vertex is at $t = " + t + "$." }); }
          var p = R.pick([2, 3, 4]), w = R.pick([20, 30, 40]);
          return mc(R, { prompt: "A company's profit is $P(x) = -3(x - " + p + ")(x - " + w + ")$ thousand dollars when it makes $x$ thousand items. What does $x = " + p + "$ tell you?",
            right: "Making " + p + " thousand items, the company breaks even (zero profit)", wrong: [{ t: "The greatest profit is " + p + " thousand dollars", fb: "$x = " + p + "$ is a zero of $P$: profit is 0 there." }, { t: "The company makes " + p + " thousand dollars per item", fb: "A zero of the model is where profit is 0." }],
            hints: ["In factored form, the numbers are the zeros — where $P(x) = 0$."], why: "$P(" + p + ") = 0$: zero profit." });
        } },
      { id: "a14-compare", title: "Compare quadratic functions", lesson: 12,
        gen: function (R) {
          var a1 = R.pick([-1, -2, -0.5]), h1 = R.int(-3, 3), k1 = R.int(-2, 6), a2 = R.pick([-1, -2, -0.5]), h2 = R.int(-3, 3), k2 = R.int(-2, 6);
          while (k2 === k1) k2 = R.int(-2, 6);
          var byMax = R.chance(0.6) || h1 === h2;
          if (byMax) { var big = k1 > k2 ? "$f$" : "$g$";
            return mc(R, { prompt: "$f(x) = " + vTex(a1, h1, k1).slice(4) + "$. The graph shows $g$. Which has the greater maximum value?", scene: para(vf(a2, h2, k2)), right: big, keep: true,
              wrong: [{ t: big === "$f$" ? "$g$" : "$f$", fb: "$f$'s maximum is $" + k1 + "$ (its vertex); $g$'s is $" + k2 + "$." }, { t: "They're equal", fb: "$" + k1 + "$ and $" + k2 + "$ aren't equal." }],
              hints: ["Find each vertex's height."], why: "$f$: " + k1 + "; $g$: " + k2 + "." }); }
          var left = h1 < h2 ? "$f$" : "$g$";
          return mc(R, { prompt: "$f(x) = " + vTex(a1, h1, k1).slice(4) + "$. The graph shows $g$. Whose axis of symmetry is further left?", scene: para(vf(a2, h2, k2)), right: left, keep: true,
            wrong: [{ t: left === "$f$" ? "$g$" : "$f$", fb: "$f$'s axis is $x = " + h1 + "$; $g$'s is $x = " + h2 + "$." }],
            hints: ["The axis of symmetry is $x = h$, through the vertex."], why: "$x = " + h1 + "$ against $x = " + h2 + "$." });
        } },
      { id: "a14-shift", title: "Shift parabolas", lesson: 13,
        gen: function (R) {
          var h = R.int(-5, 5), k = R.int(-5, 5); while (h === 0 && k === 0) h = R.nz(-5, 5);
          if (R.chance(0.5)) { var S = vSliders(1, h, k, ["h", "k"]); S.prompt = "Shift $y = x^2$ to make $" + vTex(1, h, k) + "$.";
            S.hints = ["The vertex moves to $" + pt(h, k) + "$."]; S.why = "Vertex $" + pt(h, k) + "$."; return S; }
          return mc(R, { prompt: "The graph is $y = x^2$ shifted. Which equation is it?", scene: para(vf(1, h, k), { more: [{ f: function (x) { return x * x; }, color: "ink", dashed: true }] }), right: "$" + vTex(1, h, k) + "$",
            wrong: [{ t: "$" + vTex(1, -h, k) + "$", fb: "The sign inside the bracket is the opposite of the direction." }, { t: "$" + vTex(1, h, -k) + "$", fb: "The vertex is " + (k > 0 ? "above" : "below") + " the $x$-axis." }, { t: "$" + vTex(1, k, h) + "$", fb: "Sideways and up-down are swapped." }].filter(function (w) { return w.t !== "$" + vTex(1, h, k) + "$"; }),
            hints: ["Find the vertex: it's $(h, k)$ in $y = (x - h)^2 + k$."], why: "Vertex $" + pt(h, k) + "$." });
        } },
      { id: "a14-scale", title: "Scale & reflect parabolas", lesson: 13,
        gen: function (R) {
          var a = R.pick([2, 3, -1, -2, 0.5, -0.5]);
          if (R.chance(0.5)) { var S = vSliders(a, 0, 0, ["a"]); S.prompt = "Make $" + vTex(a, 0, 0) + "$ from $y = x^2$.";
            S.hints = [a < 0 ? "Negative: flipped upside down." : "Positive: still opens up.", Math.abs(a) > 1 ? "Narrower than $x^2$." : "Wider than $x^2$."]; S.why = "$a = " + num(a) + "$."; return S; }
          var others = [-a, a > 0 ? a + 1 : a - 1, 1 / a].filter(function (b, i, arr) { return b !== a && arr.indexOf(b) === i && [2, 3, -1, -2, 0.5, -0.5, 1, 4, -3].indexOf(b) >= 0; });
          return mc(R, { prompt: "Which equation is graphed? (The dashed curve is $y = x^2$.)", scene: para(vf(a, 0, 0), { more: [{ f: function (x) { return x * x; }, color: "ink", dashed: true }], marks: [[1, a, ""]] }), right: "$" + vTex(a, 0, 0) + "$",
            wrong: others.map(function (b) { return { t: "$" + vTex(b, 0, 0) + "$", fb: b * a < 0 ? "Check which way it opens." : "At $x = 1$ it's at height $" + num(a) + "$." }; }),
            hints: ["Read the height at $x = 1$: that's $a$."], why: "At $x = 1$ it's $" + num(a) + "$: $a = " + num(a) + "$." });
        } }
    ]
  });
})();
