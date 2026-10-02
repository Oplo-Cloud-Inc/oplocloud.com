/* ==========================================================================
   Algebra I — Unit 8: Quadratic equations. See lab/core.js for the format.

   Follows OpenStax Algebra 1, Unit 8, lesson for lesson — the readiness check, 8.1 to 8.12 and
   Project 8. Written to the recipe in docs/OEDU_BRILLIANT_CONCEPT.md and the
   five rules at the top of alg/u02.js: teach, learn by doing, super
   interactive, nothing clumsy, never too much.

   Unit 7 asked "what is the output?". This unit asks the reverse: which
   input gives this output? First by trying and by reasoning (8.1–8.3), then
   by the zero product property (8.4–8.5), which needs factored form — so
   factoring is rebuilt from the tiles up (8.6–8.10) — and last, from the
   solutions back to the equation, and from data to a model (8.11–8.12).

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   questions, figures, feedback and every step here are OEdu's own.

   Fourteen lessons, eleven skills, three quizzes, and the unit test.
   Standards: CCSS HSA.REI.B.4, HSA.SSE.A.2, HSA.SSE.B.3a, HSA.CED.A.1, HSA.APR.B.3, HSF.IF.C.8a.
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
  /* ============================================================ Ready? */
  LESSONS.push({
    title: "Are you ready? Three quick checks",
    tag: "Ready?",
    blurb: "Book: Unit 8 Readiness · Expand with the distributive property, find intercepts from factored form, and match graphs to equations.",
    mins: 6, v: 2,
    steps: [
      { type: "expr", kicker: "Check 1 · Equivalent expressions", prompt: "Write $x(x + 7)$ without brackets.", answer: "x^2+7x", shown: "x^2 + 7x", form: "simplified", skill: "Distributive property",
        keys: [["$x$", "x"], ["$x^2$", "x^2"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "x^2+7", fb: "The $x$ multiplies the 7 too." }], hints: ["$x \\cdot x$ and $x \\cdot 7$."], why: "$x^2 + 7x$." },
      { type: "expr", prompt: "Write $(x + 2)(x - 6)$ in standard form.", answer: "x^2-4x-12", shown: "x^2 - 4x - 12", form: "simplified", skill: "Distributive property",
        keys: [["$x$", "x"], ["$x^2$", "x^2"], ["$+$", "+"], ["$-$", "-"]], near: [{ v: "x^2-12", fb: "Add the middle products: $-6x$ and $2x$." }, { v: "x^2+4x-12", fb: "$-6x + 2x = -4x$." }], hints: ["Four products."], why: "$x^2 - 6x + 2x - 12$." },
      { type: "numbers", kicker: "Check 2 · Intercepts", prompt: "Where does $y = (x - 3)(x + 1)$ cross the $x$-axis? Give both $x$-values.", answer: [3, -1], skill: "Intercepts from factored form", placeholder: "e.g. 2, -5",
        hints: ["Which $x$ makes each bracket zero?"], why: "$x - 3 = 0$ at 3, and $x + 1 = 0$ at $-1$." },
      { type: "plane", prompt: "This is $y = (x + 2)(x - 4)$. **Click** one of its $x$-intercepts.", x: [-5, 7], y: [-10, 8], click: "point", answer: { point: [-2, 0] }, skill: "Intercepts from factored form",
        fns: [{ f: function (x) { return (x + 2) * (x - 4); }, color: "blue" }],
        check: function (st) { var c = st.clicked; return c && c[1] === 0 && (c[0] === -2 || c[0] === 4) ? { ok: true } : { ok: false, say: "An $x$-intercept is where the curve meets the horizontal axis." }; },
        hints: ["Where is each bracket zero?"], why: "$(-2, 0)$ and $(4, 0)$." },
      { type: "choice", kicker: "Check 3 · Graphs and equations", prompt: "Which equation matches this graph?",
        scene: { type: "plane", x: [-2, 7], y: [-5, 8], fns: [{ f: function (x) { return (x - 1) * (x - 5); }, color: "green" }] },
        options: [{ t: "$y = (x - 1)(x - 5)$" }, { t: "$y = (x + 1)(x + 5)$", fb: "Those factors are zero at $-1$ and $-5$. The graph crosses at 1 and 5." }, { t: "$y = -(x - 1)(x - 5)$", fb: "The minus sign would flip it to open downward." }],
        answer: 0, skill: "Match graphs and equations", hints: ["Read the $x$-intercepts. Which way does it open?"], why: "Zeros 1 and 5, opening upward." },
      { type: "choice", prompt: "Which parabola opens **downward**?",
        options: [{ t: "$y = -x^2 + 4$" }, { t: "$y = x^2 - 4$", fb: "The $x^2$ term is positive: it opens upward." }, { t: "$y = (x - 4)^2$", fb: "Squared, with a positive coefficient: upward." }],
        answer: 0, skill: "Match graphs and equations", hints: ["Look at the sign of the $x^2$ term."], why: "A negative $x^2$ coefficient makes an arch." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 8.1**. If any check slipped, Unit 7 has it: lessons 7.8 and 7.9 for **check 1**, 7.10 and 7.11 for **check 2**, and 7.12 for **check 3**.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  var KEYS_Q = [["$x$", "x"], ["$x^2$", "x^2"], ["$+$", "+"], ["$-$", "-"], ["$($", "("], ["$)$", ")"]];
  function toss(t) { return t >= 0 && t <= 5 ? 80 * t - 16 * t * t : NaN; }

  /* ============================================ 8.1 · Finding unknown inputs */
  LESSONS.push({
    title: "Finding unknown inputs",
    blurb: "Book 8.1 · You know the output you want. Which input gives it?",
    mins: 7, v: 2,
    steps: [
      { type: "table", kicker: "Try it", prompt: "A photo is **6 in by 4 in**. A border of width $x$ goes all the way round, so the framed picture is $(6 + 2x)$ by $(4 + 2x)$. Fill in the total area.",
        head: ["border $x$", "width", "height", "total area"], rows: [[0.5, 7, 5, 35], [1, 8, 6, null], [2, 10, 8, null]], answers: [[1, 3, 48], [2, 3, 80]], skill: "Quadratic equations",
        hints: ["Width × height."], why: "$8 \\times 6 = 48$ and $10 \\times 8 = 80$." },
      { type: "learn", kicker: "See it", prompt: "The frame shop has a sheet of **63 in²**. Slide $x$ until the framed area is exactly 63.",
        scene: { type: "tester", a: "(6 + 2x)(4 + 2x)", b: "63", x: { v: 0, min: 0, max: 3, step: 0.5 }, goal: "equal" }, gate: true,
        then: "$x = 1.5$: a border of an inch and a half. You have just solved$$(6 + 2x)(4 + 2x) = 63$$by trying values. That works, but it's slow, and it only finds answers you happen to try." },
      { type: "learn", kicker: "Name it",
        prompt: "An equation like that is a **quadratic equation**: multiplied out and rearranged, it has the form$$ax^2 + bx + c = 0$$Solving it means finding the **input** that produces a given output. This unit builds faster ways than guessing." },
      { type: "choice", prompt: "Which equation asks: “what border makes the framed area 80 in²?”",
        options: [{ t: "$(6 + 2x)(4 + 2x) = 80$" }, { t: "$(6 + 2 \\cdot 80)(4 + 2 \\cdot 80) = x$", fb: "80 is the area you want (the output). $x$ is the unknown border." }, { t: "$(6 + x)(4 + x) = 80$", fb: "The border is on both sides of the photo, so each dimension grows by $2x$." }],
        answer: 0, skill: "Quadratic equations", hints: ["Set the area expression equal to the area you want."], why: "Expression for the area, set equal to the target." },
      { type: "num", prompt: "Solve $(6 + 2x)(4 + 2x) = 80$. (Your table already has it.)", pre: "$x =$", answer: 2, skill: "Quadratic equations",
        hints: ["Look back at the table: which border gave 80?"], why: "$(10)(8) = 80$ when $x = 2$." },
      { type: "choice", kicker: "Use it", prompt: "Algebra gives **two** solutions of $(6 + 2x)(4 + 2x) = 80$: $x = 2$ and $x = -7$. What do you make of $-7$?",
        options: [{ t: "It solves the equation, but a border can't have a negative width. Only $x = 2$ answers the question." }, { t: "It's a mistake: equations have one solution.", fb: "Check it: $(6 - 14)(4 - 14) = (-8)(-10) = 80$ ✓. Quadratic equations often have two solutions." }, { t: "Both borders work.", fb: "A border $-7$ inches wide isn't a border." }],
        answer: 0, skill: "Quadratic equations", hints: ["Does it make the equation true? Does it make sense as a width?"], why: "A solution of the equation is not always a solution of the problem. The situation decides." }
    ]
  });

  /* ============================================ 8.2 · When and why */
  LESSONS.push({
    title: "When and why do we write quadratic equations?",
    blurb: "Book 8.2 · To find when a quadratic quantity reaches a value, set it equal to that value.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A ball is kicked from the ground: $h(t) = 80t - 16t^2$ feet after $t$ seconds. It is on the ground at $t = 0$. When is it on the ground **again**?",
        scene: graph([0, 6], [0, 110], [{ f: toss, color: "blue" }], { gridY: 10, labelEveryY: 20, aspect: 0.85, axisLabels: ["t", "h"] }),
        pre: "$t =$", post: "s", answer: 5, skill: "Write a quadratic equation", hints: ["Where does the graph come back to height 0?"], why: "$h(5) = 400 - 400 = 0$. You solved $80t - 16t^2 = 0$." },
      { type: "numbers", prompt: "When is the ball **64 ft** high? Give both times.",
        scene: graph([0, 6], [0, 110], [{ f: toss, color: "blue" }], { gridY: 10, labelEveryY: 20, aspect: 0.85, axisLabels: ["t", "h"], hline: [64] }),
        answer: [1, 4], skill: "Write a quadratic equation", placeholder: "e.g. 2, 3", hints: ["Where does the curve cross the red line?"], why: "$h(1) = 80 - 16 = 64$ and $h(4) = 320 - 256 = 64$: once on the way up, once on the way down." },
      { type: "learn", kicker: "Name it",
        prompt: "To ask **when** a quantity reaches a value, write an equation: the expression, set equal to that value.$$80t - 16t^2 = 64$$Move everything to one side and it is in standard form, equal to zero:$$-16t^2 + 80t - 64 = 0$$That form is the starting point for every method in this unit." },
      { type: "choice", prompt: "Why did the question “when is it 64 ft high?” have two answers?",
        options: [{ t: "The ball passes 64 ft on the way up and again on the way down." }, { t: "One of them is a mistake.", fb: "Both check: $h(1) = 64$ and $h(4) = 64$." }, { t: "Quadratic equations always have two answers.", fb: "Not always. Ask when it's 100 ft high (the very top) and there's only one. Ask for 200 ft and there are none." }],
        answer: 0, skill: "Write a quadratic equation", hints: ["Picture the flight."], why: "A parabola reaches most heights twice. That is why quadratic equations usually have two solutions." },
      { type: "choice", kicker: "Vary it", prompt: "A band sells tickets at $p$ dollars each and expects to sell $100 - 10p$ of them. Its revenue is $p(100 - 10p)$. Which equation finds the price that brings in **\\$240**?",
        options: [{ t: "$p(100 - 10p) = 240$" }, { t: "$100 - 10p = 240$", fb: "That's the number of tickets, not the money. Revenue is price × tickets." }, { t: "$p(100 - 10p) = 0$", fb: "That finds the prices that bring in nothing." }],
        answer: 0, skill: "Write a quadratic equation", hints: ["Revenue expression, set equal to the target."], why: "Revenue $= 240$. (It has two solutions, \\$4 and \\$6: check them.)" },
      { type: "numbers", kicker: "Use it", prompt: "At which prices does the band take **no money at all**? Solve $p(100 - 10p) = 0$.", answer: [0, 10], skill: "Write a quadratic equation", placeholder: "e.g. 1, 8",
        hints: ["A product is zero when one of its factors is zero.", "Either $p = 0$, or $100 - 10p = 0$."], why: "At \\$0 the tickets are free. At \\$10, $100 - 100 = 0$ tickets sell. Either way, revenue is zero." }
    ]
  });

  /* ============================================ 8.3 · Solving by reasoning */
  LESSONS.push({
    title: "Solving quadratic equations by reasoning",
    blurb: "Book 8.3 · If something squared is 25, that something is 5 or −5.",
    mins: 7, v: 2,
    steps: [
      { type: "numbers", kicker: "Try it", prompt: "Find **every** number whose square is 25: solve $x^2 = 25$.", answer: [5, -5], skill: "Solve by square roots", placeholder: "e.g. 3, -3",
        hints: ["5 works. Is there another number that gives 25 when squared?"], why: "$5^2 = 25$ and $(-5)^2 = 25$. A positive number has two square roots." },
      { type: "learn", kicker: "Name it",
        prompt: "If $x^2 = k$ and $k$ is positive, there are **two** solutions: $x = \\sqrt{k}$ and $x = -\\sqrt{k}$. Together they are written$$x = \\pm\\sqrt{k}$$Forgetting the negative one is the most common slip in this unit." },
      { type: "learn", kicker: "See it", prompt: "The curve is $y = x^2$. Slide the red line to height $k$ and watch the solutions of $x^2 = k$.",
        scene: { type: "plane", x: [-4, 4], y: [-3, 10], gate: true, params: { k: { v: 4, min: -2, max: 9, step: 1, label: "$k$" } },
          fns: [{ f: "x^2", color: "blue" }],
          segs: function (st) { var k = st.params.k; return [[-4, k, 4, k, "red"]]; },
          marks: function (st) { var k = st.params.k; return k < 0 ? [] : k === 0 ? [{ x: 0, y: 0, color: "orange", r: 6 }] : [{ x: Math.sqrt(k), y: k, color: "orange", r: 6 }, { x: -Math.sqrt(k), y: k, color: "orange", r: 6 }]; },
          readout: function (st) { var k = st.params.k, r = Math.sqrt(k), whole = r === Math.round(r);
            return k < 0 ? "$x^2 = " + k + "$ has **no real solutions**: the line misses the curve." : k === 0 ? "$x^2 = 0$ has **one solution**: $x = 0$." : "$x^2 = " + k + "$ has **two solutions**: $x = \\pm" + (whole ? r : "\\sqrt{" + k + "}") + "$" + (whole ? "" : ", about $\\pm" + r2(r) + "$"); } },
        gate: true,
        then: "A positive $k$ gives two solutions, mirror images of each other. Zero gives one. A negative $k$ gives none: a square is never negative." },
      { type: "numbers", prompt: "Solve $x^2 - 1 = 48$.", answer: [7, -7], skill: "Solve by square roots", placeholder: "e.g. 3, -3",
        hints: ["Add 1 to both sides first."], why: "$x^2 = 49$, so $x = \\pm 7$." },
      { type: "numbers", kicker: "Vary it", prompt: "Here the thing being squared is a bracket. Solve $(x - 1)^2 = 16$.", answer: [5, -3], skill: "Solve by square roots", placeholder: "e.g. 3, -3",
        hints: ["The bracket must be 4 or $-4$.", "$x - 1 = 4$, or $x - 1 = -4$."], why: "$x - 1 = 4$ gives $x = 5$. $x - 1 = -4$ gives $x = -3$." },
      { type: "sort", prompt: "How many real solutions does each equation have?",
        bins: ["Two", "One", "None"],
        cards: [{ t: "$x^2 = 7$", bin: 0, fb: "$\\pm\\sqrt{7}$: two solutions, even though they aren't whole numbers." }, { t: "$x^2 = 0$", bin: 1, fb: "Only 0 squares to 0." }, { t: "$x^2 = -4$", bin: 2, fb: "No real number squared is negative." },
                { t: "$(x + 2)^2 = 0$", bin: 1, fb: "The bracket must be 0: only $x = -2$." }, { t: "$x^2 + 9 = 0$", bin: 2, fb: "That's $x^2 = -9$." }],
        skill: "Number of solutions", hints: ["Get the squared part alone. Is the other side positive, zero or negative?"], why: "Positive: two. Zero: one. Negative: none." },
      { type: "numbers", kicker: "Use it", prompt: "Solve $2x^2 = 50$.", answer: [5, -5], skill: "Solve by square roots", placeholder: "e.g. 3, -3",
        hints: ["Divide by 2 first."], why: "$x^2 = 25$, so $x = \\pm 5$." }
    ]
  });

  /* ============================================ 8.4 · Zero product property */
  LESSONS.push({
    title: "Solving quadratic equations with the zero product property",
    blurb: "Book 8.4 · If a product is zero, one of its factors is zero.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "Two numbers multiply to give 0. What can you say about them?",
        options: [{ t: "At least one of them is 0." }, { t: "Both of them are 0.", fb: "$0 \\times 7 = 0$: only one needs to be." }, { t: "Nothing: any two numbers could do it.", fb: "Try: can two non-zero numbers multiply to 0?" }],
        answer: 0, skill: "Zero product property", hints: ["Try some pairs."], why: "Zero is the only number with this property. No two non-zero numbers multiply to zero." },
      { type: "learn", kicker: "Name it",
        prompt: "The **zero product property**: if $a \\cdot b = 0$, then $a = 0$ or $b = 0$.<br><br>So an equation like $(x - 4)(x + 7) = 0$ splits into two easy ones:$$x - 4 = 0 \\quad \\text{or} \\quad x + 7 = 0$$" },
      { type: "numbers", prompt: "Solve $(x - 4)(x + 7) = 0$.", answer: [4, -7], skill: "Zero product property", placeholder: "e.g. 2, -5",
        near: [], hints: ["What makes $x - 4$ zero? What makes $x + 7$ zero?"], why: "$x = 4$ or $x = -7$. The signs are the opposite of those in the brackets." },
      { type: "numbers", prompt: "Solve $x(x - 9) = 0$.", answer: [0, 9], skill: "Zero product property", placeholder: "e.g. 2, -5",
        hints: ["The first factor is just $x$."], why: "$x = 0$ or $x - 9 = 0$: the solutions are 0 and 9. Don't forget the 0." },
      { type: "choice", kicker: "Vary it", prompt: "Han solves $(x - 2)(x + 3) = 6$ by writing $x - 2 = 6$ or $x + 3 = 6$. What's wrong?",
        options: [{ t: "The property only works when the product equals **zero**." }, { t: "Nothing: $x = 8$ and $x = 3$.", fb: "Check $x = 8$: $(6)(11) = 66$, not 6." }, { t: "He should have written $x - 2 = 3$ and $x + 3 = 2$.", fb: "Lots of pairs multiply to 6: 1 and 6, 2 and 3, $-1$ and $-6$, … Only zero forces a factor's value." }],
        answer: 0, skill: "Zero product property", hints: ["If a product is 6, must one factor be 6?"], why: "A product of 6 tells you nothing definite about the factors. Rearrange to make one side zero first." },
      { type: "numbers", prompt: "Solve $(2x - 1)(x + 5) = 0$.", answer: [0.5, -5], skill: "Zero product property", placeholder: "e.g. 1/2, -3",
        hints: ["$2x - 1 = 0$ means $2x = 1$."], why: "$2x - 1 = 0$ gives $x = \\frac{1}{2}$. $x + 5 = 0$ gives $x = -5$." },
      { type: "num", kicker: "Use it", prompt: "A diver's height above the water is $h(t) = -16t(t - 3)$ feet. Apart from $t = 0$, when is the height zero?", pre: "$t =$", post: "s", answer: 3, skill: "Zero product property",
        hints: ["$-16t = 0$ or $t - 3 = 0$."], why: "$t - 3 = 0$ at $t = 3$: back at water level after 3 seconds." }
    ]
  });

  /* ============================================ 8.5 · How many solutions */
  LESSONS.push({
    title: "How many solutions?",
    blurb: "Book 8.5 · The graph shows it: two crossings, one touch, or none.",
    mins: 7, v: 2,
    steps: [
      { type: "plane", kicker: "Try it", prompt: "The graph is $y = x^2 + c$. The solutions of $x^2 + c = 0$ are its $x$-intercepts. Slide $c$ so the equation has **exactly one** solution.",
        x: [-5, 5], y: [-6, 8], params: { c: { v: -4, min: -5, max: 5, step: 1, label: "$c$" } }, fns: [{ f: function (x, p) { return x * x + p.c; }, color: "blue" }],
        marks: function (st) { var c = st.params.c; return c > 0 ? [] : c === 0 ? [{ x: 0, y: 0, color: "orange", r: 6 }] : [{ x: Math.sqrt(-c), y: 0, color: "orange", r: 6 }, { x: -Math.sqrt(-c), y: 0, color: "orange", r: 6 }]; },
        readout: function (st) { var c = st.params.c; return "$x^2 " + (c < 0 ? "- " + -c + " = 0" : c > 0 ? "+ " + c + " = 0" : "= 0") + "$ has **" + (c < 0 ? "two solutions" : c === 0 ? "one solution" : "no real solutions") + "**"; },
        check: function (st) { var c = st.params.c; return c === 0 ? { ok: true } : { ok: false, say: c < 0 ? "The curve crosses the axis twice. Raise it until it only touches." : "Now it misses the axis altogether. Lower it until it just touches." }; },
        answer: { params: { c: 0 } }, skill: "Number of solutions", hints: ["One solution means the curve just touches the axis."],
        why: "With $c = 0$ the vertex sits on the axis: one solution, $x = 0$. Below that there are two; above, none." },
      { type: "learn", kicker: "Name it",
        prompt: "A quadratic equation has **two, one or no** real solutions. On the graph of the related function, they are the $x$-intercepts:<br><br>crosses the axis twice: **two**;<br>touches it at the vertex: **one**;<br>never reaches it: **none**." },
      { type: "sort", prompt: "How many solutions?",
        bins: ["Two", "One", "None"],
        cards: [{ t: "$(x - 3)^2 = 0$", bin: 1, fb: "Both factors are zero at $x = 3$." }, { t: "$x^2 + 5 = 0$", bin: 2, fb: "$x^2 = -5$ is impossible." }, { t: "$x(x - 5) = 0$", bin: 0, fb: "$x = 0$ or $x = 5$." }, { t: "$(x + 1)(x - 1) = 0$", bin: 0, fb: "$x = -1$ or $x = 1$." }],
        skill: "Number of solutions", hints: ["Use the zero product property, or think about the graph."], why: "Two different factors: two solutions. A repeated factor: one. A square equal to a negative: none." },
      { type: "choice", kicker: "Vary it", prompt: "Mia solves $x^2 = 5x$ by dividing both sides by $x$, and gets $x = 5$. What went wrong?",
        options: [{ t: "Dividing by $x$ lost the solution $x = 0$." }, { t: "Nothing: 5 is the only solution.", fb: "Try $x = 0$: $0^2 = 5(0)$ ✓." }, { t: "She should have got $x = \\pm 5$.", fb: "$(-5)^2 = 25$, but $5(-5) = -25$. That's not a solution." }],
        answer: 0, skill: "Number of solutions", hints: ["Is $x = 0$ a solution? Can you divide by $x$ if $x$ might be 0?"], why: "You can't divide by something that might be zero. That move threw a solution away." },
      { type: "numbers", prompt: "Solve $x^2 = 5x$ properly.", answer: [0, 5], skill: "Zero product property", placeholder: "e.g. 2, -5",
        hints: ["Bring everything to one side: $x^2 - 5x = 0$.", "Factor: $x(x - 5) = 0$."], why: "$x(x - 5) = 0$, so $x = 0$ or $x = 5$." },
      { type: "choice", kicker: "Use it", prompt: "Which method suits $(x - 7)^2 = 36$ best?",
        options: [{ t: "Square roots: the bracket is 6 or $-6$." }, { t: "Zero product property, as it stands.", fb: "The right side is 36, not 0." }, { t: "Divide both sides by $(x - 7)$.", fb: "That leaves $x - 7 = \\frac{36}{x - 7}$, which is no simpler." }],
        answer: 0, skill: "Number of solutions", hints: ["It's already “something squared equals a number”."], why: "$x - 7 = \\pm 6$, so $x = 13$ or $x = 1$. Match the method to the form." }
    ]
  });

  /* ============================================ 8.6 · Factored form, part 1 */
  LESSONS.push({
    title: "Rewriting quadratic expressions in factored form, part 1",
    blurb: "Book 8.6 · To use the zero product property you need factors. Here is how to find them.",
    mins: 7, v: 2,
    steps: [
      { type: "tiles", kicker: "Try it", prompt: "Arrange $x^2 + 9x + 20$ into a rectangle. Choose $p$ and $q$ so the tiles match.",
        mode: "factor", target: { b: 9, c: 20 }, p: 1, q: 1, min: 0, answer: [4, 5], skill: "Factor a quadratic",
        hints: ["9 $x$-tiles in all, 20 units in the corner."], why: "$(x + 4)(x + 5)$: $4 + 5 = 9$ and $4 \\times 5 = 20$." },
      { type: "learn", kicker: "Name it",
        prompt: "Multiply out $(x + p)(x + q)$ and you get $x^2 + (p + q)x + pq$. So to factor $x^2 + bx + c$, look for two numbers whose<br><br>**sum** is $b$ &nbsp; and &nbsp; **product** is $c$." },
      { type: "table", prompt: "Fill in the missing numbers.", head: ["factored form", "sum $b$", "product $c$"], rows: [["(x + 3)(x + 6)", null, null], ["(x + 2)(x + 10)", null, null], ["(x + 1)(x + 7)", null, null]],
        answers: [[0, 1, 9], [0, 2, 18], [1, 1, 12], [1, 2, 20], [2, 1, 8], [2, 2, 7]], skill: "Factor a quadratic", hints: ["Add the two numbers for $b$. Multiply them for $c$."],
        why: "$x^2 + 9x + 18$, $x^2 + 12x + 20$ and $x^2 + 8x + 7$." },
      { type: "expr", prompt: "Factor $x^2 + 11x + 24$.", answer: "(x+3)(x+8)", shown: "(x + 3)(x + 8)", form: "factored", skill: "Factor a quadratic", keys: KEYS_Q,
        hints: ["Pairs that multiply to 24: 1 and 24, 2 and 12, 3 and 8, 4 and 6. Which pair adds to 11?"], why: "$3 + 8 = 11$ and $3 \\times 8 = 24$." },
      { type: "numbers", kicker: "Vary it", prompt: "Now a **negative** middle term: $x^2 - 9x + 20$. Which two numbers multiply to $+20$ and add to $-9$?", answer: [-4, -5], skill: "Factor a quadratic", placeholder: "e.g. -2, -7",
        hints: ["A positive product and a negative sum: both numbers are negative."], why: "$(-4)(-5) = 20$ and $-4 + (-5) = -9$." },
      { type: "expr", kicker: "Use it", prompt: "Factor $x^2 - 9x + 20$.", answer: "(x-4)(x-5)", shown: "(x - 4)(x - 5)", form: "factored", skill: "Factor a quadratic", keys: KEYS_Q,
        hints: ["Use $-4$ and $-5$."], why: "$(x - 4)(x - 5) = x^2 - 9x + 20$." }
    ]
  });
  var THROW = [[0, 0.2], [1, 4.8], [2, 8.1], [3, 9.2], [4, 7.9], [5, 5.1], [6, 0.1]];
  function rocket(t) { return t >= 0 && t <= 6 ? 96 * t - 16 * t * t : NaN; }

  /* ============================================ 8.7 · Factored form, part 2 */
  LESSONS.push({
    title: "Rewriting quadratic expressions in factored form, part 2",
    blurb: "Book 8.7 · A negative constant term means one factor adds and the other subtracts.",
    mins: 7, v: 2,
    steps: [
      { type: "numbers", kicker: "Try it", prompt: "Which two numbers multiply to $-12$ and add to $1$?", answer: [4, -3], skill: "Factor with a negative constant", placeholder: "e.g. 5, -2",
        hints: ["A negative product: one number is positive and one is negative.", "Pairs for 12: 1 and 12, 2 and 6, 3 and 4."], why: "$4 \\times (-3) = -12$ and $4 + (-3) = 1$." },
      { type: "expr", prompt: "So factor $x^2 + x - 12$.", answer: "(x+4)(x-3)", shown: "(x + 4)(x - 3)", form: "factored", skill: "Factor with a negative constant", keys: KEYS_Q,
        near: [{ v: "(x-4)(x+3)", fb: "That gives $-x$ in the middle. The larger number must be the positive one." }], hints: ["Use 4 and $-3$."], why: "$(x + 4)(x - 3) = x^2 - 3x + 4x - 12 = x^2 + x - 12$." },
      { type: "sort", kicker: "Name it", prompt: "In $x^2 + bx + c = (x + p)(x + q)$, what are the signs of $p$ and $q$?",
        bins: ["Both positive", "Both negative", "One of each"],
        cards: [{ t: "$x^2 + 7x + 10$", bin: 0, fb: "Positive product, positive sum." }, { t: "$x^2 - 7x + 10$", bin: 1, fb: "Positive product, negative sum." }, { t: "$x^2 + 3x - 10$", bin: 2, fb: "A negative product needs opposite signs." }, { t: "$x^2 - 3x - 10$", bin: 2, fb: "A negative product needs opposite signs." }],
        skill: "Factor with a negative constant", hints: ["The sign of $c$ tells you if the signs match. The sign of $b$ tells you which is bigger."],
        why: "$c > 0$: same signs, both matching the sign of $b$. $c < 0$: opposite signs, and the larger one has the sign of $b$." },
      { type: "numbers", prompt: "Which two numbers multiply to $-100$ and add to $0$?", answer: [10, -10], skill: "Factor with a negative constant", placeholder: "e.g. 5, -2",
        hints: ["To add to 0 they must be opposites."], why: "$10 \\times (-10) = -100$ and $10 + (-10) = 0$. So $x^2 - 100 = (x + 10)(x - 10)$: no middle term at all." },
      { type: "expr", kicker: "Vary it", prompt: "Factor $x^2 - 3x - 10$.", answer: "(x-5)(x+2)", shown: "(x - 5)(x + 2)", form: "factored", skill: "Factor with a negative constant", keys: KEYS_Q,
        near: [{ v: "(x+5)(x-2)", fb: "That gives $+3x$. The sum must be $-3$, so the larger number is the negative one." }], hints: ["Multiply to $-10$, add to $-3$."], why: "$-5 \\times 2 = -10$ and $-5 + 2 = -3$." },
      { type: "expr", kicker: "Use it", prompt: "Factor $x^2 + 5x - 14$.", answer: "(x+7)(x-2)", shown: "(x + 7)(x - 2)", form: "factored", skill: "Factor with a negative constant", keys: KEYS_Q,
        hints: ["Multiply to $-14$, add to 5."], why: "$7 \\times (-2) = -14$ and $7 + (-2) = 5$." }
    ]
  });

  /* ============================================ 8.8 · Factored form, part 3 */
  LESSONS.push({
    title: "Rewriting quadratic expressions in factored form, part 3",
    blurb: "Book 8.8 · No middle term: the difference of two squares.",
    mins: 7, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "Do this one in your head: $103 \\times 97$. (Think of it as $(100 + 3)(100 - 3)$.)", answer: 9991, skill: "Difference of squares",
        near: [big(9991), { v: 10009, fb: "The last product is $3 \\times -3 = -9$: subtract it." }, { v: 10000, fb: "That's $100 \\times 100$. Take off $3 \\times 3$." }],
        hints: ["The two middle products, $-300$ and $+300$, cancel."], why: "$100^2 - 3^2 = 10000 - 9 = 9991$." },
      { type: "learn", kicker: "Name it",
        prompt: "The middle terms always cancel when a sum is multiplied by the matching difference:$$(a + b)(a - b) = a^2 - b^2$$Read backwards, it factors any **difference of two squares**." },
      { type: "expr", prompt: "Factor $x^2 - 49$.", answer: "(x+7)(x-7)", shown: "(x + 7)(x - 7)", form: "factored", skill: "Difference of squares", keys: KEYS_Q,
        near: [{ v: "(x-7)^2", fb: "$(x - 7)^2 = x^2 - 14x + 49$: it has a middle term, and $+49$." }], hints: ["$49 = 7^2$."], why: "$x^2 - 7^2 = (x + 7)(x - 7)$." },
      { type: "expr", prompt: "Factor $9x^2 - 16$.", answer: "(3x+4)(3x-4)", shown: "(3x + 4)(3x - 4)", form: "factored", skill: "Difference of squares", keys: KEYS_Q,
        hints: ["$9x^2 = (3x)^2$ and $16 = 4^2$."], why: "$(3x)^2 - 4^2 = (3x + 4)(3x - 4)$." },
      { type: "sort", kicker: "Vary it", prompt: "Can it be factored using whole numbers?",
        bins: ["Yes", "No"],
        cards: [{ t: "$x^2 - 36$", bin: 0, fb: "$(x + 6)(x - 6)$." }, { t: "$x^2 + 36$", bin: 1, fb: "A *sum* of squares doesn't factor." }, { t: "$4x^2 - 1$", bin: 0, fb: "$(2x + 1)(2x - 1)$." },
                { t: "$x^2 - 7$", bin: 1, fb: "7 isn't the square of a whole number." }, { t: "$x^2 - 6x + 9$", bin: 0, fb: "$(x - 3)^2$." }],
        skill: "Difference of squares", hints: ["Two squares, subtracted? Or is it a perfect square trinomial?"], why: "Differences of squares and perfect squares factor. Sums of squares don't." },
      { type: "numbers", kicker: "Use it", prompt: "Use factoring to solve $x^2 - 81 = 0$.", answer: [9, -9], skill: "Difference of squares", placeholder: "e.g. 3, -3",
        hints: ["$(x + 9)(x - 9) = 0$."], why: "$x + 9 = 0$ or $x - 9 = 0$: $x = \\pm 9$. The same answer as taking square roots." }
    ]
  });

  /* ============================================ 8.9 · Solving by factored form */
  LESSONS.push({
    title: "Solving quadratic equations by using factored form",
    blurb: "Book 8.9 · Get zero on one side, factor, and let the zero product property finish.",
    mins: 7, v: 2,
    steps: [
      { type: "numbers", kicker: "Try it", prompt: "Solve $x^2 + 7x + 12 = 0$. (Factor the left side first.)", answer: [-3, -4], skill: "Solve by factoring", placeholder: "e.g. -1, -6",
        near: [], hints: ["$x^2 + 7x + 12 = (x + 3)(x + 4)$.", "Now each factor can be zero."], why: "$(x + 3)(x + 4) = 0$ gives $x = -3$ or $x = -4$." },
      { type: "order", kicker: "Name it", prompt: "Put the method in order.",
        items: ["Rearrange so that one side is 0.", "Factor the other side.", "Set each factor equal to 0.", "Solve each small equation.", "Check the solutions in the original equation."],
        skill: "Solve by factoring", why: "Zero on one side, factor, split, solve, check." },
      { type: "numbers", prompt: "Solve $x^2 - 2x - 15 = 0$.", answer: [5, -3], skill: "Solve by factoring", placeholder: "e.g. 2, -5",
        hints: ["Multiply to $-15$, add to $-2$.", "$(x - 5)(x + 3) = 0$."], why: "$x = 5$ or $x = -3$. Check: $25 - 10 - 15 = 0$ ✓." },
      { type: "numbers", kicker: "Vary it", prompt: "This one isn't equal to zero yet. Solve $x^2 + 3x = 10$.", answer: [-5, 2], skill: "Solve by factoring", placeholder: "e.g. 2, -5",
        near: [], hints: ["Subtract 10 first: $x^2 + 3x - 10 = 0$.", "$(x + 5)(x - 2) = 0$."], why: "$x = -5$ or $x = 2$. Check: $4 + 6 = 10$ ✓ and $25 - 15 = 10$ ✓." },
      { type: "numbers", prompt: "Solve $x^2 = 6x - 9$.", answer: [3], skill: "Solve by factoring", placeholder: "e.g. 4",
        hints: ["$x^2 - 6x + 9 = 0$.", "That's a perfect square: $(x - 3)^2 = 0$."], why: "$(x - 3)(x - 3) = 0$: both factors give $x = 3$. One solution." },
      { type: "num", kicker: "Use it", prompt: "A rectangle is $x$ wide and $x + 3$ long, with area 40. So $x(x + 3) = 40$. Find the width.", answer: 5, skill: "Solve by factoring",
        near: [{ v: -8, fb: "$-8$ solves the equation, but a width can't be negative." }, { v: 8, fb: "8 is the length, $x + 3$." }],
        hints: ["$x^2 + 3x - 40 = 0$.", "$(x + 8)(x - 5) = 0$."], why: "$x = -8$ or $x = 5$. Only 5 makes sense: a $5 \\times 8$ rectangle." }
    ]
  });

  /* ============================================ 8.10 · Factored form, part 4 */
  LESSONS.push({
    title: "Rewriting quadratic expressions in factored form, part 4",
    blurb: "Book 8.10 · When the x² term has a coefficient, the area model still finds the factors.",
    mins: 7, v: 2,
    steps: [
      { type: "expr", kicker: "Try it", prompt: "Multiply out $(3x + 2)(x + 4)$.", answer: "3x^2+14x+8", shown: "3x^2 + 14x + 8", form: "simplified", skill: "Factor ax² + bx + c", keys: KEYS_Q,
        near: [{ v: "3x^2+8", fb: "Add the middle products: $12x$ and $2x$." }, { v: "3x^2+6x+8", fb: "The middle products are $3x \\cdot 4 = 12x$ and $2 \\cdot x = 2x$." }], hints: ["$3x \\cdot x$, $3x \\cdot 4$, $2 \\cdot x$, $2 \\cdot 4$."], why: "$3x^2 + 12x + 2x + 8$." },
      { type: "learn", kicker: "See it", prompt: "Going backwards, the area model shows what to look for. Fill in the areas.",
        scene: { type: "tiles", mode: "area", rows: ["2x", "1"], cols: ["x", "3"], cells: [["2x^2", "6x"], ["x", "3"]], readout: "$2x^2 + 6x + x + 3 = 2x^2 + 7x + 3 = (2x + 1)(x + 3)$", gate: true }, gate: true,
        then: "The middle term, $7x$, was split into $6x + x$. Those two numbers, 6 and 1, **multiply** to $a \\cdot c = 6$ and **add** to $b = 7$. That's the *ac* method." },
      { type: "expr", prompt: "Factor $2x^2 + 7x + 3$.", answer: "(2x+1)(x+3)", shown: "(2x + 1)(x + 3)", form: "factored", skill: "Factor ax² + bx + c", keys: KEYS_Q,
        near: [{ v: "(2x+3)(x+1)", fb: "That gives $2x^2 + 5x + 3$. Check the middle term." }], hints: ["The area model above has the answer along its sides."], why: "$(2x + 1)(x + 3) = 2x^2 + 6x + x + 3$." },
      { type: "numbers", prompt: "Now solve $2x^2 + 7x + 3 = 0$.", answer: [-0.5, -3], skill: "Factor ax² + bx + c", placeholder: "e.g. -1/3, -2",
        hints: ["$(2x + 1)(x + 3) = 0$.", "$2x + 1 = 0$ means $x = -\\frac{1}{2}$."], why: "$x = -\\frac{1}{2}$ or $x = -3$." },
      { type: "expr", kicker: "Vary it", prompt: "Factor $5x^2 + 11x + 2$.", answer: "(5x+1)(x+2)", shown: "(5x + 1)(x + 2)", form: "factored", skill: "Factor ax² + bx + c", keys: KEYS_Q,
        hints: ["$a \\cdot c = 10$. Two numbers that multiply to 10 and add to 11: 10 and 1.", "$5x^2 + 10x + x + 2$, then group."], why: "$5x(x + 2) + 1(x + 2) = (5x + 1)(x + 2)$." },
      { type: "numbers", kicker: "Use it", prompt: "Any method: solve $3x^2 - 12 = 0$.", answer: [2, -2], skill: "Factor ax² + bx + c", placeholder: "e.g. 3, -3",
        hints: ["Divide by 3 first: $x^2 - 4 = 0$."], why: "$x^2 = 4$, so $x = \\pm 2$. A common factor first makes everything easier." }
    ]
  });

  /* ============================================ 8.11 · From solutions to equations */
  LESSONS.push({
    title: "Writing quadratic equations given real solutions",
    blurb: "Book 8.11 · Run the zero product property backwards: from the zeros to the function.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "A quadratic function has zeros at 2 and 5. Which could it be?",
        options: [{ t: "$f(x) = (x - 2)(x - 5)$" }, { t: "$f(x) = (x + 2)(x + 5)$", fb: "Those factors are zero at $-2$ and $-5$." }, { t: "$f(x) = x^2 + 2x + 5$", fb: "2 and 5 as coefficients don't make 2 and 5 the zeros. Check: $f(2) = 13$." }],
        answer: 0, skill: "Write a quadratic from its zeros", hints: ["Which factor is zero when $x = 2$?"], why: "A zero at $m$ comes from a factor $(x - m)$." },
      { type: "expr", prompt: "Write $(x - 2)(x - 5)$ in standard form.", answer: "x^2-7x+10", shown: "x^2 - 7x + 10", form: "simplified", skill: "Write a quadratic from its zeros", keys: KEYS_Q,
        near: [{ v: "x^2-7x-10", fb: "$(-2)(-5) = +10$." }], hints: ["Four products."], why: "$x^2 - 5x - 2x + 10$." },
      { type: "plane", kicker: "See it", prompt: "Many parabolas share the zeros 1 and 3: every $y = a(x - 1)(x - 3)$ does. Slide $a$ to find the one through the orange point.",
        x: [-2, 6], y: [-4, 9], params: { a: { v: 1, min: -2, max: 3, step: 0.5, label: "$a$" } }, fns: [{ f: function (x, p) { return p.a * (x - 1) * (x - 3); }, color: "blue" }],
        marks: [{ x: 1, y: 0, color: "ink" }, { x: 3, y: 0, color: "ink" }, { x: 0, y: 6, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + nm(st.params.a) + "(x - 1)(x - 3)$ &nbsp; at $x = 0$: $y = " + nm(3 * st.params.a) + "$"; },
        check: function (st) { return st.params.a === 2 ? { ok: true } : { ok: false, say: "At $x = 0$ the curve is at $a(-1)(-3) = 3a$. The orange point is at height 6." }; },
        answer: { params: { a: 2 } }, skill: "Write a quadratic from its zeros", hints: ["$3a = 6$."], why: "$a = 2$: $y = 2(x - 1)(x - 3)$. The zeros fix where it crosses. One more point fixes $a$." },
      { type: "learn", kicker: "Name it",
        prompt: "A quadratic with zeros $m$ and $n$ has the form$$f(x) = a(x - m)(x - n)$$The zeros don't settle $a$. To find it, substitute one more point on the graph." },
      { type: "num", kicker: "Vary it", prompt: "A parabola has zeros $-1$ and 3 and passes through $(1, -8)$. So $-8 = a(1 + 1)(1 - 3)$. What is $a$?", pre: "$a =$", answer: 2, skill: "Write a quadratic from its zeros",
        near: [{ v: -2, fb: "$(2)(-2) = -4$, so $-4a = -8$." }], hints: ["$(1 + 1)(1 - 3) = -4$."], why: "$-4a = -8$, so $a = 2$: $f(x) = 2(x + 1)(x - 3)$." },
      { type: "choice", kicker: "Use it", prompt: "Which equation has **exactly one** solution, $x = 4$?",
        options: [{ t: "$(x - 4)^2 = 0$" }, { t: "$(x - 4)(x + 4) = 0$", fb: "That has two solutions: 4 and $-4$." }, { t: "$x^2 - 4 = 0$", fb: "That has solutions 2 and $-2$." }],
        answer: 0, skill: "Write a quadratic from its zeros", hints: ["Use the factor $(x - 4)$ twice."], why: "$(x - 4)(x - 4) = 0$: both factors give 4. In standard form: $x^2 - 8x + 16 = 0$." }
    ]
  });

  /* ============================================ 8.12 · Quadratic regression */
  LESSONS.push({
    title: "Using technology to find the quadratic regression",
    blurb: "Book 8.12 · When data rises and falls, fit a parabola to it and use it to predict.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "A ball is thrown, and its height is measured every second. Which kind of model suits this data?",
        scene: { type: "plane", x: [-1, 7], y: [-1, 11], axisLabels: ["s", "m"], marks: THROW.map(function (p) { return { x: p[0], y: p[1], color: "orange", r: 6 }; }) },
        options: [{ t: "Quadratic: it rises, peaks and falls." }, { t: "Linear", fb: "A line can only go one way. This data turns round." }, { t: "Exponential", fb: "Exponential data keeps rising or keeps falling." }],
        answer: 0, skill: "Quadratic models", hints: ["What shape do the dots make?"], why: "An arch: the shape of a parabola." },
      { type: "learn", kicker: "See it", prompt: "Fit a parabola to the dots. Its vertex is set at $(3, 9)$. Slide $a$ until the curve runs through the data.",
        scene: { type: "plane", x: [-1, 7], y: [-1, 11], axisLabels: ["s", "m"], gate: true, params: { a: { v: -0.25, min: -2, max: -0.25, step: 0.25, label: "$a$" } },
          fns: [{ f: function (x, p) { return p.a * (x - 3) * (x - 3) + 9; }, color: "blue" }], marks: THROW.map(function (p) { return { x: p[0], y: p[1], color: "orange", r: 6 }; }),
          readout: function (st) { return "$y = " + (st.params.a === -1 ? "-" : nm(st.params.a)) + "(x - 3)^2 + 9$" + (st.params.a === -1 ? " ✓ a good fit" : ""); }, goal: function (st) { return st.params.a === -1; } },
        gate: true,
        then: "$y = -(x - 3)^2 + 9$ fits well. A calculator or spreadsheet does this automatically: **quadratic regression** finds the parabola of best fit, just as linear regression finds the line of best fit." },
      { type: "num", prompt: "In standard form the model is $y = -x^2 + 6x$. Use it to predict the height at **2.5** seconds.", post: "m", answer: 8.75, skill: "Quadratic models",
        near: [{ v: 21.25, fb: "$-x^2$ means $-(2.5)^2 = -6.25$. Subtract it." }, { v: 10, fb: "$2.5^2 = 6.25$, not 5." }], hints: ["$-(2.5)^2 + 6(2.5)$."], why: "$-6.25 + 15 = 8.75$ m." },
      { type: "num", kicker: "Vary it", prompt: "A reading is missing from another data set that follows $y = -x^2 + 6x$. What should $y$ be at $x = 4$?", answer: 8, skill: "Quadratic models",
        near: [{ v: 40, fb: "$-x^2 = -16$: it's subtracted." }], hints: ["$-16 + 24$."], why: "$-16 + 24 = 8$." },
      { type: "choice", prompt: "The model predicts $y = -7$ at $x = 7$ seconds. What should you conclude?",
        options: [{ t: "The ball has already landed. The model only applies while it is in the air." }, { t: "The ball is 7 m underground.", fb: "The ground stops it. The model describes the flight, not what happens after." }, { t: "The model is useless.", fb: "It fits well between 0 and 6 seconds, where the data is." }],
        answer: 0, skill: "Quadratic models", hints: ["When does the model reach height 0?"], why: "The model's zeros are 0 and 6: the flight lasts 6 seconds. Outside that, it means nothing." },
      { type: "choice", kicker: "Use it", prompt: "A shop records its profit at five different prices. The profit rises with price at first, then falls. How could it estimate the best price?",
        options: [{ t: "Fit a quadratic model and find its vertex." }, { t: "Fit a line and find its slope.", fb: "A line has no peak. This data turns round." }, { t: "Pick the highest price.", fb: "The data says profit falls again at high prices." }],
        answer: 0, skill: "Quadratic models", hints: ["Where is a parabola's maximum?"], why: "The vertex of the best-fit parabola estimates the price with the greatest profit." }
    ]
  });

  /* ============================================ Project 8 */
  LESSONS.push({
    title: "Project: Modelling rocket flight",
    tag: "Project",
    blurb: "Book Project 8 · One model rocket, three questions: how long, how high, and when.",
    mins: 9, v: 2,
    steps: [
      { type: "learn", kicker: "The brief",
        prompt: "A model rocket leaves the ground at 96 feet per second. Its height after $t$ seconds is$$h(t) = 96t - 16t^2$$Mission control needs three things: when it lands, how high it goes, and when it passes 80 ft." },
      { type: "numbers", prompt: "When is the rocket on the ground? Solve $96t - 16t^2 = 0$.", answer: [0, 6], skill: "Solve by factoring", placeholder: "e.g. 1, 4",
        hints: ["Take out the common factor: $16t(6 - t) = 0$."], why: "$t = 0$ (launch) or $t = 6$ (landing)." },
      { type: "pair", prompt: "The vertex is halfway between the zeros. Give its coordinates $(t, h)$.",
        scene: graph([0, 7], [0, 160], [{ f: rocket, color: "orange" }], { gridY: 20, labelEveryY: 40, aspect: 0.85, axisLabels: ["t", "h"] }),
        answer: [3, 144], skill: "Vertex from factored form", near: [{ v: [3, 240], fb: "$h(3) = 96(3) - 16(9)$." }], hints: ["$t = 3$. Then $h(3) = 288 - 144$."], why: "$h(3) = 288 - 144 = 144$: the peak is 144 ft, after 3 seconds." },
      { type: "numbers", prompt: "When is it exactly **80 ft** up? Solve $96t - 16t^2 = 80$.", answer: [1, 5], skill: "Solve by factoring", placeholder: "e.g. 2, 4",
        hints: ["Rearrange: $16t^2 - 96t + 80 = 0$. Divide by 16.", "$t^2 - 6t + 5 = 0$ factors as $(t - 1)(t - 5)$."], why: "$t = 1$ on the way up and $t = 5$ on the way down." },
      { type: "explain", kicker: "Make it yours",
        prompt: "A second rocket follows $h(t) = 64t - 16t^2$. Find when it lands and how high it goes, and explain which method you used for each.",
        placeholder: "e.g. It lands when 64t − 16t² = 0. Factoring gives…",
        model: "Landing: 16t(4 − t) = 0, so t = 0 or t = 4 (zero product property). Peak: halfway, at t = 2, where h = 128 − 64 = 64 ft. A good answer names the method: factoring for the zeros, and symmetry (or −b/2a) for the vertex." }
    ]
  });
  /* ================================================================ Skills */
  function quad(a, b, c) { return poly([[a, "x^2"], [b, "x"], [c, ""]]); }
  function bin(p) { return "(x " + signed(p) + ")"; }

  var SKILLS = [
    { id: "u8-sqrt", title: "Solve x² = k", lesson: 4,
      gen: function (R) {
        var r = R.int(2, 12), k = R.pick([0, 0, 1])* R.int(1, 30), a = R.pick([1, 1, 2, 3]);
        var tex = a === 1 ? (k ? "x^2 " + (R.chance(0.5) ? "- " + k + " = " + (r * r - k) : "+ " + k + " = " + (r * r + k)) : "x^2 = " + r * r) : a + "x^2 = " + a * r * r;
        return { type: "numbers", prompt: "Solve. $$" + tex + "$$", answer: [r, -r], placeholder: "e.g. 3, -3",
          hints: ["Get $x^2$ alone.", "$x^2 = " + r * r + "$. Remember both square roots."], why: "$x^2 = " + r * r + "$, so $x = \\pm " + r + "$." };
      } },
    { id: "u8-square-shift", title: "Solve (x − a)² = k", lesson: 4,
      gen: function (R) {
        var a = R.nz(-7, 7), r = R.int(1, 8);
        return { type: "numbers", prompt: "Solve. $$" + bin(-a) + "^2 = " + r * r + "$$", answer: [a + r, a - r], placeholder: "e.g. 5, -1",
          hints: ["The bracket is $" + r + "$ or $-" + r + "$.", "$x " + signed(-a) + " = " + r + "$, or $x " + signed(-a) + " = -" + r + "$."], why: "$x = " + a + " + " + r + " = " + (a + r) + "$ or $x = " + a + " - " + r + " = " + (a - r) + "$." };
      } },
    { id: "u8-count", title: "How many solutions?", lesson: 6,
      gen: function (R) {
        var kind = R.int(0, 2), k = R.int(1, 20), a = R.nz(-6, 6), names = ["Two", "One", "None"], form = R.int(0, 1);
        var tex = kind === 0 ? (form ? "x^2 = " + k : bin(a) + "^2 = " + k) : kind === 1 ? (form ? "x^2 = 0" : bin(a) + "^2 = 0") : (form ? "x^2 = -" + k : "x^2 + " + k + " = 0");
        var why = kind === 0 ? "A square equal to a positive number: two solutions, one for each square root." : kind === 1 ? "A square is 0 only when the thing being squared is 0: one solution." : "A square can't be negative: no real solutions.";
        return mc(R, { prompt: "How many real solutions does $" + tex + "$ have?", right: names[kind], wrong: names.filter(function (n, i) { return i !== kind; }).map(function (n) { return { t: n, fb: why }; }), keep: true,
          hints: ["Get the squared part alone. Is the other side positive, zero or negative?"], why: why });
      } },
    { id: "u8-zpp", title: "Use the zero product property", lesson: 5,
      gen: function (R) {
        var m = R.int(-8, 8), n = R.int(-8, 8);
        if (m === n) n = m + 3;
        return { type: "numbers", prompt: "Solve. $$" + (m === 0 ? "x" : bin(-m)) + (n === 0 ? " \\cdot x" : bin(-n)) + " = 0$$", answer: [m, n], placeholder: "e.g. 2, -5",
          hints: ["A product is zero when one of its factors is zero."], why: "The factors are zero at $x = " + m + "$ and $x = " + n + "$." };
      } },
    { id: "u8-factor", title: "Factor a quadratic", lesson: 8,
      gen: function (R) {
        var p = R.nz(-9, 9), q = R.nz(-9, 9);
        if (p + q === 0) q += 1;
        return { type: "expr", prompt: "Factor. $$" + quad(1, p + q, p * q) + "$$", answer: "(x+(" + p + "))*(x+(" + q + "))", shown: bin(p) + bin(q), form: "factored", keys: KEYS_Q,
          hints: ["Two numbers that multiply to $" + p * q + "$ and add to $" + (p + q) + "$.", p * q > 0 ? "A positive product: the numbers have the same sign." : "A negative product: one number is positive and one negative."],
          why: "$" + p + " \\times " + L.sub("a", { a: q }) + " = " + p * q + "$ and $" + p + " + " + L.sub("a", { a: q }) + " = " + (p + q) + "$." };
      } },
    { id: "u8-dos", title: "Factor a difference of squares", lesson: 9,
      gen: function (R) {
        var a = R.int(2, 12), k = R.pick([1, 1, 1, 2, 3]);
        return { type: "expr", prompt: "Factor. $$" + (k === 1 ? "" : k * k) + "x^2 - " + a * a + "$$", answer: "(" + k + "x+" + a + ")*(" + k + "x-" + a + ")", shown: "(" + (k === 1 ? "" : k) + "x + " + a + ")(" + (k === 1 ? "" : k) + "x - " + a + ")", form: "factored", keys: KEYS_Q,
          hints: ["$" + a * a + " = " + a + "^2$" + (k > 1 ? " and $" + k * k + "x^2 = (" + k + "x)^2$." : ".")], why: "$a^2 - b^2 = (a + b)(a - b)$." };
      } },
    { id: "u8-solve", title: "Solve by factoring", lesson: 10,
      gen: function (R) {
        var m = R.int(-8, 8), n = R.int(-8, 8);
        if (m === n) n = m + 2;
        return { type: "numbers", prompt: "Solve. $$" + quad(1, -(m + n), m * n) + " = 0$$", answer: [m, n], placeholder: "e.g. 2, -5",
          hints: ["Factor the left side.", "$" + (m === 0 ? "x" : bin(-m)) + (n === 0 ? " \\cdot x" : bin(-n)) + " = 0$."], why: "$" + (m === 0 ? "x" : bin(-m)) + (n === 0 ? " \\cdot x" : bin(-n)) + " = 0$, so $x = " + m + "$ or $x = " + n + "$." };
      } },
    { id: "u8-rearrange", title: "Rearrange, then solve", lesson: 10,
      gen: function (R) {
        var m = R.nz(-8, 8), n = R.nz(-8, 8);
        if (m === n) n = -m;
        var b = -(m + n), c = m * n;
        return { type: "numbers", prompt: "Solve. $$" + poly([[1, "x^2"], [b, "x"]]) + " = " + -c + "$$", answer: [m, n], placeholder: "e.g. 2, -5",
          hints: ["Move everything to one side: $" + quad(1, b, c) + " = 0$.", "Now factor."], why: "$" + quad(1, b, c) + " = " + bin(-m) + bin(-n) + " = 0$, so $x = " + m + "$ or $x = " + n + "$." };
      } },
    { id: "u8-lead", title: "Solve ax² + bx + c = 0 by factoring", lesson: 11,
      gen: function (R) {
        var a = R.pick([2, 3, 5]), p = R.pick([1, -1, 2, -2, 3, -3, 4].filter(function (v) { return v % a !== 0; })), q = R.nz(-6, 6);
        return { type: "numbers", prompt: "Solve. $$" + quad(a, a * q + p, p * q) + " = 0$$", answer: [-p / a, -q], shown: L.fracText(-p, a) + ", " + -q, placeholder: "e.g. 1/2, -3",
          hints: ["It factors as $(" + a + "x " + signed(p) + ")" + bin(q) + "$.", "$" + a + "x " + signed(p) + " = 0$ gives a fraction."], why: "$(" + a + "x " + signed(p) + ")" + bin(q) + " = 0$: $x = " + frac(-p, a) + "$ or $x = " + -q + "$." };
      } },
    { id: "u8-write", title: "Write a quadratic from its zeros", lesson: 12,
      gen: function (R) {
        var m = R.nz(-7, 7), n = R.nz(-7, 7);
        if (m === n || m === -n) n = m + 1 || 2;
        var right = "$f(x) = " + bin(-m) + bin(-n) + "$";
        return mc(R, { prompt: "Which function has zeros at $" + m + "$ and $" + n + "$?", right: right,
          wrong: [{ t: "$f(x) = " + bin(m) + bin(n) + "$", fb: "Those factors are zero at $" + -m + "$ and $" + -n + "$. A zero at $m$ needs the factor $(x - m)$." }, { t: "$f(x) = " + bin(-m) + bin(n) + "$", fb: "The second factor is zero at $" + -n + "$, not $" + n + "$." },
                  { t: "$f(x) = " + quad(1, m, n) + "$", fb: "Putting the zeros in as coefficients doesn't make them zeros. Check by substituting." }],
          hints: ["Which bracket is zero when $x = " + m + "$?"], why: "A zero at $m$ comes from the factor $(x - m)$: " + right + "." });
      } },
    { id: "u8-find-a", title: "Find a from a point", lesson: 12,
      gen: function (R) {
        var m = R.int(-4, 2), n = m + R.int(2, 5), a = R.pick([-3, -2, 2, 3, 4]), x0 = R.pick([m - 1, n + 1, m + 1].filter(function (v) { return v !== m && v !== n; })), y0 = a * (x0 - m) * (x0 - n), k = (x0 - m) * (x0 - n);
        return { type: "num", prompt: "$f(x) = a" + bin(-m) + bin(-n) + "$ passes through $(" + x0 + ", " + y0 + ")$. What is $a$?", pre: "$a =$", answer: a,
          near: near(a, [{ v: -a, fb: "Check the sign of the product $(" + (x0 - m) + ")(" + (x0 - n) + ") = " + k + "$." }]),
          hints: ["Put $x = " + x0 + "$: $" + y0 + " = a(" + (x0 - m) + ")(" + (x0 - n) + ")$."], why: "$" + y0 + " = " + k + "a$, so $a = " + a + "$." };
      } }
  ];
  L.unit("alg", 8, {
    title: "Quadratic equations",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 6, blurb: "Square roots, the zero product property, and how many solutions there are.",
        skills: ["u8-sqrt", "u8-square-shift", "u8-count", "u8-zpp"], per: 2 },
      { title: "Quiz 2", after: 10, blurb: "Factoring, and solving by factoring.",
        skills: ["u8-factor", "u8-dos", "u8-solve", "u8-rearrange"], per: 2 },
      { title: "Quiz 3", after: 13, blurb: "Leading coefficients, and going from the solutions back to the equation.",
        skills: ["u8-lead", "u8-write", "u8-find-a"], per: 2 }
    ],
    skills: SKILLS
  });
})();
