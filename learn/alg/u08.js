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
  var HOW_8_1 = [["Want", "Decide which output you want."], ["Equation", "Set the expression equal to that output."], ["Try", "Try inputs, moving toward the target."], ["Sense", "Keep only the solutions that make sense in the situation."]];
  LESSONS.push({
    title: "Finding unknown inputs",
    blurb: "Book 8.1 · You know the output you want. Which input gives it?",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "A photo is **6 in by 4 in**. What is its area?",
        answer: 24, post: "in²", skill: "Quadratic equations",
        near: [{ v: 20, fb: "That is the perimeter. The area is length times width." }],
        hints: ["$6 \\times 4$."], why: "$6 \\times 4 = 24$ square inches." },
      { type: "learn", kicker: "The idea",
        prompt: "So far you have put in an input and got an output. Now you know the **output** you want, and must find the **input**. With a quadratic expression, that question is a **quadratic equation**.",
        scene: { type: "method", how: HOW_8_1 } },
      { type: "learn", kicker: "Watch",
        prompt: "A border of width $x$ goes all the way round the 6 by 4 photo. Watch the border found that gives a framed area of **48 in²**.",
        scene: { type: "walk", how: HOW_8_1, rows: [
          { step: 1, m: "48", say: "The output we want: a framed area of 48." },
          { step: 2, m: "(6 + 2x)(4 + 2x) = 48", say: "Each side grows by $2x$: one border width at each end.",
            ask: { prompt: "There is a border of width $x$ at **both** ends of the 6 in side. How long is the framed side?", answer: 0,
                   options: [{ t: "$6 + 2x$" }, { t: "$6 + x$", fb: "There is a border at each end, so the side grows by $x$ twice." }] } },
          { step: 3, m: "7 \\times 5 = 35", say: "Try $x = 0.5$. Too small." },
          { step: 3, m: "8 \\times 6 = 48", say: "Try $x = 1$. Exactly 48." },
          { step: 4, m: "x = 1", say: "A border one inch wide." }] },
        gate: true,
        then: "Solving a quadratic equation means finding the **inputs** that give a chosen output." },
      { type: "learn", kicker: "Explore", prompt: "The frame shop has a sheet of **63 in²**. Slide $x$ until the framed area is exactly 63.",
        scene: { type: "tester", a: "(6 + 2x)(4 + 2x)", b: "63", x: { v: 0, min: 0, max: 3, step: 0.5 }, goal: "equal" }, gate: true,
        then: "$x = 1.5$: a border of an inch and a half. You have just solved$$(6 + 2x)(4 + 2x) = 63$$by trying values. That works, but it's slow, and it only finds answers you happen to try." },
      { type: "guided", kicker: "Together",
        prompt: "Same photo. Now find the border that gives a framed area of **80 in²**.",
        how: HOW_8_1, skill: "Quadratic equations",
        steps: [
          { step: 2, ask: "Which equation asks that question?", type: "choice", answer: 0,
            options: [{ t: "$(6 + 2x)(4 + 2x) = 80$" }, { t: "$(6 + x)(4 + x) = 80$", fb: "The border is on both ends of each side: $2x$, not $x$." }, { t: "$6x \\cdot 4x = 80$", fb: "The border is added to each side, not multiplied." }],
            m: "(6 + 2x)(4 + 2x) = 80", say: "Framed area, set equal to 80." },
          { step: 3, ask: "Try $x = 1$: what is $8 \\times 6$?", type: "num", answer: 48, hint: "$8 \\times 6$.", m: "8 \\times 6 = 48", say: "Too small. Try a wider border." },
          { step: 3, ask: "Try $x = 2$: what is $10 \\times 8$?", type: "num", answer: 80, hint: "$10 \\times 8$.", m: "10 \\times 8 = 80", say: "Exactly 80." },
          { step: 4, ask: "Algebra also gives $x = -7$ for this equation. Which answer makes sense?", type: "choice", answer: 0,
            options: [{ t: "$x = 2$: a border cannot have a negative width" }, { t: "Both", fb: "$-7$ does solve the equation, but nobody can cut a border $-7$ inches wide." }, { t: "$x = -7$", fb: "A width cannot be negative." }],
            m: "x = 2", say: "A 2 inch border." }],
        why: "Want, equation, try, sense. Now fill in the table of framed areas." },
      { type: "table", kicker: "On your own", prompt: "A photo is **6 in by 4 in**. A border of width $x$ goes all the way round, so the framed picture is $(6 + 2x)$ by $(4 + 2x)$. Fill in the total area.",
        head: ["border $x$", "width", "height", "total area"], rows: [[0.5, 7, 5, 35], [1, 8, 6, null], [2, 10, 8, null]], answers: [[1, 3, 48], [2, 3, 80]], skill: "Quadratic equations",
        hints: ["Width × height."], why: "$8 \\times 6 = 48$ and $10 \\times 8 = 80$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The answer is not always a whole number. Find the border for a framed area of **99 in²**.",
        scene: { type: "walk", how: HOW_8_1, rows: [
          { step: 2, m: "(6 + 2x)(4 + 2x) = 99", say: "The equation." },
          { step: 3, m: "80 \\quad\\text{and}\\quad 120", say: "$x = 2$ gives 80 and $x = 3$ gives 120. So 99 lies between them." },
          { step: 3, m: "11 \\times 9 = 99", say: "Try the middle, $x = 2.5$. Exactly 99." },
          { step: 4, m: "x = 2.5", say: "Guessing works, but it is slow. This unit builds faster methods." }] },
        gate: true },
      { type: "num", kicker: "Try it",
        prompt: "Same photo. Solve $(6 + 2x)(4 + 2x) = 120$ for a positive border width.",
        pre: "$x =$", answer: 3, skill: "Quadratic equations",
        near: [{ v: 2, fb: "$x = 2$ gives $10 \\times 8 = 80$. Try a wider border." }],
        hints: ["Step 3: try $x = 3$: the sides are 12 and 10."], why: "$x = 3$ gives $12 \\times 10 = 120$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran writes the framed area as $(6 + x)(4 + x)$. What is wrong?",
        options: [{ t: "The border is on both ends of each side, so each side grows by $2x$." },
                  { t: "It should be $6x \\cdot 4x$.", fb: "The border adds to each side. It does not multiply it." },
                  { t: "Nothing. That is the framed area.", fb: "Picture the 6 in side: there is a strip of width $x$ at its left end and another at its right." }],
        answer: 0, skill: "Quadratic equations", hints: ["How many strips of border does each side pass through?"],
        why: "Each side has a border at both ends: $(6 + 2x)(4 + 2x)$." },
      { type: "num", kicker: "Use it",
        prompt: "A square garden has side $x$ metres. A path makes the side of the whole plot $x + 2$ metres, and its area **49 m²**. What is $x$?",
        answer: 5, post: "m", skill: "Quadratic equations",
        near: [{ v: 7, fb: "7 is the side of the whole plot, $x + 2$. Take away the 2." }],
        hints: ["$(x + 2)^2 = 49$. Which positive number squared is 49?"], why: "$(x + 2)^2 = 49$ gives $x + 2 = 7$, so $x = 5$." }
    ]
  });

  /* ============================================ 8.2 · When and why */
  var HOW_8_2 = [["Question", "Find the value that the quantity must reach."], ["Equation", "Write: the expression = that value."], ["Zero", "Move everything to one side, so that the other side is 0."], ["Solve", "Solve, and say what each solution means."]];
  LESSONS.push({
    title: "When and why do we write quadratic equations?",
    blurb: "Book 8.2 · To find when a quadratic quantity reaches a value, set it equal to that value.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up", prompt: "A ball is kicked from the ground: $h(t) = 80t - 16t^2$ feet after $t$ seconds. It is on the ground at $t = 0$. When is it on the ground **again**?",
        scene: graph([0, 6], [0, 110], [{ f: toss, color: "blue" }], { gridY: 10, labelEveryY: 20, aspect: 0.85, axisLabels: ["t", "h"] }),
        pre: "$t =$", post: "s", answer: 5, skill: "Write a quadratic equation", hints: ["Where does the graph come back to height 0?"], why: "$h(5) = 400 - 400 = 0$. You solved $80t - 16t^2 = 0$." },
      { type: "learn", kicker: "The idea",
        prompt: "To ask **when** a quantity reaches a value, write an equation: the expression, set equal to that value. Then move everything to one side. An equation that equals 0 is what the methods in this unit need.",
        scene: { type: "method", how: HOW_8_2 } },
      { type: "learn", kicker: "Watch",
        prompt: "The ball's height is $h(t) = 80t - 16t^2$ feet. Watch the question “when is it **96 ft** high?” turned into an equation and solved.",
        scene: { type: "walk", how: HOW_8_2, rows: [
          { step: 1, m: "96", say: "The value the height must reach." },
          { step: 2, m: "80t - 16t^2 = 96", say: "The height, set equal to that value." },
          { step: 3, m: "16t^2 - 80t + 96 = 0", say: "Move every term to one side.",
            ask: { prompt: "Why move everything to one side?", answer: 0,
                   options: [{ t: "So that the other side is 0" }, { t: "To make the numbers smaller", fb: "The numbers stay the same size. The aim is an equation that equals 0." }] } },
          { step: 3, m: "t^2 - 5t + 6 = 0", say: "Divide every term by 16." },
          { step: 4, m: "t = 2 \\quad\\text{or}\\quad t = 3", say: "The ball is 96 ft high twice: on the way up at 2 seconds, and on the way down at 3." }] },
        gate: true,
        then: "Expression = value, then everything to one side: $ax^2 + bx + c = 0$." },
      { type: "guided", kicker: "Together",
        prompt: "A band sells tickets at $p$ dollars each and expects to sell $100 - 10p$ of them. Its revenue is $p(100 - 10p)$. Find the price that brings in **\\$240**.",
        how: HOW_8_2, skill: "Write a quadratic equation",
        steps: [
          { step: 2, ask: "Which equation finds that price?", type: "choice", answer: 0,
            options: [{ t: "$p(100 - 10p) = 240$" }, { t: "$p(100 - 10p) = 0$", fb: "That finds the prices that bring in nothing." }, { t: "$100 - 10p = 240$", fb: "That is about the number of tickets. The revenue is price times tickets." }],
            m: "p(100 - 10p) = 240", say: "Revenue, set equal to 240." },
          { step: 3, ask: "Multiply out and move everything to one side. Which equation do you get?", type: "choice", answer: 0,
            options: [{ t: "$10p^2 - 100p + 240 = 0$" }, { t: "$10p^2 - 100p - 240 = 0$", fb: "$100p - 10p^2 = 240$. Moving the left side over gives $0 = 10p^2 - 100p + 240$." }],
            m: "10p^2 - 100p + 240 = 0", say: "Everything on one side." },
          { step: 3, ask: "Divide every term by 10.", type: "choice", answer: 0,
            options: [{ t: "$p^2 - 10p + 24 = 0$" }, { t: "$p^2 - 10p + 240 = 0$", fb: "Divide the 240 by 10 as well." }],
            m: "p^2 - 10p + 24 = 0", say: "A simpler equation with the same solutions." },
          { step: 4, ask: "It factors as $(p - 4)(p - 6) = 0$. What do the solutions mean?", type: "choice", answer: 0,
            options: [{ t: "A price of \\$4 or \\$6 brings in \\$240" }, { t: "The band sells 4 or 6 tickets", fb: "$p$ is the price of a ticket, in dollars." }],
            m: "p = 4 \\quad\\text{or}\\quad p = 6", say: "Two prices give the same revenue." }],
        why: "Question, equation, zero, solve. Now ask the ball a question." },
      { type: "numbers", kicker: "On your own", prompt: "When is the ball **64 ft** high? Give both times.",
        scene: graph([0, 6], [0, 110], [{ f: toss, color: "blue" }], { gridY: 10, labelEveryY: 20, aspect: 0.85, axisLabels: ["t", "h"], hline: [64] }),
        answer: [1, 4], skill: "Write a quadratic equation", placeholder: "e.g. 2, 3", hints: ["Where does the curve cross the red line?"], why: "$h(1) = 80 - 16 = 64$ and $h(4) = 320 - 256 = 64$: once on the way up, once on the way down." },
      { type: "choice", prompt: "Why did the question “when is it 64 ft high?” have two answers?",
        options: [{ t: "The ball passes 64 ft on the way up and again on the way down." }, { t: "One of them is a mistake.", fb: "Both check: $h(1) = 64$ and $h(4) = 64$." }, { t: "Quadratic equations always have two answers.", fb: "Not always. Ask when it's 100 ft high (the very top) and there's only one. Ask for 200 ft and there are none." }],
        answer: 0, skill: "Write a quadratic equation", hints: ["Picture the flight."], why: "A parabola reaches most heights twice. That is why quadratic equations usually have two solutions." },
      { type: "learn", kicker: "A harder case",
        prompt: "Not every question has an answer. When is the ball **120 ft** high?",
        scene: { type: "walk", how: HOW_8_2, rows: [
          { step: 1, m: "120", say: "The value we ask for." },
          { step: 2, m: "80t - 16t^2 = 120", say: "The equation." },
          { step: 4, m: "h(2.5) = 200 - 100 = 100", say: "The ball's greatest height, at its vertex, is 100 ft." },
          { step: 4, m: "\\text{no solution}", say: "It never reaches 120 ft, so the equation has no solution." }] },
        gate: true },
      { type: "choice", kicker: "Try it",
        prompt: "The same ball peaks at 100 ft. How many times is it exactly **100 ft** high?",
        options: [{ t: "Once, at the very top" },
                  { t: "Twice", fb: "It passes lower heights twice, on the way up and on the way down. The top is reached only once." },
                  { t: "Never", fb: "100 ft is its greatest height: it does get there." }],
        answer: 0, skill: "Write a quadratic equation", hints: ["Where on the parabola is the height 100?"],
        why: "The vertex is a single point, so $80t - 16t^2 = 100$ has one solution: $t = 2.5$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To find when the ball is 64 ft high, Kiran solves $80t - 16t^2 = 0$. What is wrong?",
        options: [{ t: "That finds when it is on the ground. The height must be set equal to 64." },
                  { t: "He should solve $80t - 16t^2 = t$.", fb: "The right side is the value the height must reach: 64." },
                  { t: "Nothing. Every equation must equal 0.", fb: "It does end up equal to 0, but only after the 64 has been moved across: $80t - 16t^2 - 64 = 0$." }],
        answer: 0, skill: "Write a quadratic equation", hints: ["Step 2: expression = value. What is the value here?"],
        why: "Write $80t - 16t^2 = 64$ first. Then move the 64 across." },
      { type: "numbers", kicker: "Use it", prompt: "At which prices does the band take **no money at all**? Solve $p(100 - 10p) = 0$.", answer: [0, 10], skill: "Write a quadratic equation", placeholder: "e.g. 1, 8",
        hints: ["A product is zero when one of its factors is zero.", "Either $p = 0$, or $100 - 10p = 0$."], why: "At \\$0 the tickets are free. At \\$10, $100 - 100 = 0$ tickets sell. Either way, revenue is zero." }
    ]
  });

  /* ============================================ 8.3 · Solving by reasoning */
  var HOW_8_3 = [["Isolate", "Get the squared part alone on one side."], ["Root", "Take the square root of the other side."], ["Two", "Write **both** roots: the positive one and the negative one."], ["Finish", "If the squared part is a bracket, solve each case."]];
  LESSONS.push({
    title: "Solving quadratic equations by reasoning",
    blurb: "Book 8.3 · If something squared is 25, that something is 5 or −5.",
    mins: 12, v: 3,
    steps: [
      { type: "num", kicker: "Warm up",
        prompt: "What is $(-5)^2$?",
        answer: 25, skill: "Solve by square roots",
        near: [{ v: -25, fb: "A negative times a negative is positive." }, { v: -10, fb: "$(-5)^2$ is $(-5) \\times (-5)$." }],
        hints: ["$(-5) \\times (-5)$."], why: "$(-5)(-5) = 25$: the same as $5^2$." },
      { type: "learn", kicker: "The idea",
        prompt: "$5^2$ and $(-5)^2$ are both 25. So the equation $x^2 = 25$ has **two** solutions: 5 and $-5$. Written together: $x = \\pm 5$. Forgetting the negative one is the most common slip.",
        scene: { type: "method", how: HOW_8_3 } },
      { type: "learn", kicker: "Explore", prompt: "The curve is $y = x^2$. Slide the red line to height $k$ and watch the solutions of $x^2 = k$.",
        scene: { type: "plane", x: [-4, 4], y: [-3, 10], gate: true, params: { k: { v: 4, min: -2, max: 9, step: 1, label: "$k$" } },
          fns: [{ f: "x^2", color: "blue" }],
          segs: function (st) { var k = st.params.k; return [[-4, k, 4, k, "red"]]; },
          marks: function (st) { var k = st.params.k; return k < 0 ? [] : k === 0 ? [{ x: 0, y: 0, color: "orange", r: 6 }] : [{ x: Math.sqrt(k), y: k, color: "orange", r: 6 }, { x: -Math.sqrt(k), y: k, color: "orange", r: 6 }]; },
          readout: function (st) { var k = st.params.k, r = Math.sqrt(k), whole = r === Math.round(r);
            return k < 0 ? "$x^2 = " + k + "$ has **no real solutions**: the line misses the curve." : k === 0 ? "$x^2 = 0$ has **one solution**: $x = 0$." : "$x^2 = " + k + "$ has **two solutions**: $x = \\pm" + (whole ? r : "\\sqrt{" + k + "}") + "$" + (whole ? "" : ", about $\\pm" + r2(r) + "$"); } },
        gate: true,
        then: "A positive $k$ gives two solutions, mirror images of each other. Zero gives one. A negative $k$ gives none: a square is never negative." },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this solved by taking square roots.$$x^2 + 3 = 39$$",
        scene: { type: "walk", how: HOW_8_3, rows: [
          { step: 1, m: "x^2 = 36", say: "Subtract 3 from both sides. Now the square is alone." },
          { step: 2, m: "\\sqrt{36} = 6", say: "The square root of 36." },
          { step: 3, m: "x = 6 \\quad\\text{or}\\quad x = -6", say: "Both square to 36.",
            ask: { prompt: "6 is one solution of $x^2 = 36$. Is there another?", answer: 0,
                   options: [{ t: "Yes: $-6$" }, { t: "No", fb: "$(-6)^2$ is 36 as well." }] } },
          { step: 3, m: "x = \\pm 6", say: "Written together." }] },
        gate: true,
        then: "If $x^2 = k$ and $k$ is positive, then $x = \\pm\\sqrt{k}$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve one.$$3x^2 = 48$$",
        how: HOW_8_3, skill: "Solve by square roots",
        steps: [
          { step: 1, ask: "Get $x^2$ alone. What do you get?", type: "choice", answer: 0,
            options: [{ t: "$x^2 = 16$" }, { t: "$x^2 = 144$", fb: "Divide by 3. Do not multiply." }, { t: "$x = 16$", fb: "Dividing by 3 leaves $x^2$, not $x$." }],
            m: "x^2 = 16", say: "Divide both sides by 3." },
          { step: 2, ask: "What is $\\sqrt{16}$?", type: "num", answer: 4, near: [{ v: 8, fb: "That is half of 16. Which number times itself is 16?" }], hint: "Which number times itself is 16?", m: "\\sqrt{16} = 4", say: "The square root." },
          { step: 3, ask: "Write every solution.", type: "choice", answer: 0,
            options: [{ t: "$x = 4$ or $x = -4$" }, { t: "$x = 4$ only", fb: "$(-4)^2$ is 16 as well." }],
            m: "x = \\pm 4", say: "Both roots." }],
        why: "Isolate, root, two. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $x^2 - 1 = 48$.", answer: [7, -7], skill: "Solve by square roots", placeholder: "e.g. 3, -3",
        hints: ["Add 1 to both sides first."], why: "$x^2 = 49$, so $x = \\pm 7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "The squared part can be a whole bracket.$$(x - 2)^2 = 9$$",
        scene: { type: "walk", how: HOW_8_3, rows: [
          { step: 1, m: "(x - 2)^2 = 9", say: "The squared part is already alone. It is a bracket." },
          { step: 3, m: "x - 2 = 3 \\quad\\text{or}\\quad x - 2 = -3", say: "The bracket is 3, or it is $-3$." },
          { step: 4, m: "x = 5 \\quad\\text{or}\\quad x = -1", say: "Add 2 in each case." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Here the thing being squared is a bracket. Solve $(x - 1)^2 = 16$.", answer: [5, -3], skill: "Solve by square roots", placeholder: "e.g. 3, -3",
        hints: ["The bracket must be 4 or $-4$.", "$x - 1 = 4$, or $x - 1 = -4$."], why: "$x - 1 = 4$ gives $x = 5$. $x - 1 = -4$ gives $x = -3$." },
      { type: "sort", prompt: "How many real solutions does each equation have?",
        bins: ["Two", "One", "None"],
        cards: [{ t: "$x^2 = 7$", bin: 0, fb: "$\\pm\\sqrt{7}$: two solutions, even though they aren't whole numbers." }, { t: "$x^2 = 0$", bin: 1, fb: "Only 0 squares to 0." }, { t: "$x^2 = -4$", bin: 2, fb: "No real number squared is negative." },
                { t: "$(x + 2)^2 = 0$", bin: 1, fb: "The bracket must be 0: only $x = -2$." }, { t: "$x^2 + 9 = 0$", bin: 2, fb: "That's $x^2 = -9$." }],
        skill: "Number of solutions", hints: ["Get the squared part alone. Is the other side positive, zero or negative?"], why: "Positive: two. Zero: one. Negative: none." },
      { type: "spotline", kicker: "Find the error",
        prompt: "Kiran solves $x^2 - 5 = 44$. Tap the line where his work **first** goes wrong.",
        lines: ["x^2 = 49", "\\sqrt{49} = 7", "x = 7"], answer: 2, fix: "x = \\pm 7",
        fb: { 0: "Adding 5 to both sides gives 49. Right.", 1: "The square root of 49 is 7. Right." },
        skill: "Solve by square roots", hints: ["Is 7 the only number whose square is 49?"],
        why: "$(-7)^2$ is 49 too. The equation has two solutions: $x = \\pm 7$." },
      { type: "numbers", kicker: "Use it", prompt: "Solve $2x^2 = 50$.", answer: [5, -5], skill: "Solve by square roots", placeholder: "e.g. 3, -3",
        hints: ["Divide by 2 first."], why: "$x^2 = 25$, so $x = \\pm 5$." }
    ]
  });

  /* ============================================ 8.4 · Zero product property */
  var HOW_8_4 = [["Zero?", "Check that one side is 0 and the other side is a product."], ["Split", "Set each factor equal to 0."], ["Solve", "Solve each small equation."], ["Check", "Put each solution back into the original equation."]];
  LESSONS.push({
    title: "Solving quadratic equations with the zero product property",
    blurb: "Book 8.4 · If a product is zero, one of its factors is zero.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "Two numbers multiply to give 0. What can you say about them?",
        options: [{ t: "At least one of them is 0." }, { t: "Both of them are 0.", fb: "$0 \\times 7 = 0$: only one needs to be." }, { t: "Nothing: any two numbers could do it.", fb: "Try: can two non-zero numbers multiply to 0?" }],
        answer: 0, skill: "Zero product property", hints: ["Try some pairs."], why: "Zero is the only number with this property. No two non-zero numbers multiply to zero." },
      { type: "learn", kicker: "The idea",
        prompt: "If a product is 0, one of its factors must be 0. Nothing else can make 0 by multiplying. This is the **zero product property**, and it turns one hard equation into two easy ones.",
        scene: { type: "method", how: HOW_8_4 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the property used.$$(x - 3)(x + 5) = 0$$",
        scene: { type: "walk", how: HOW_8_4, rows: [
          { step: 1, m: "(x - 3)(x + 5) = 0", say: "A product, equal to 0." },
          { step: 2, m: "x - 3 = 0 \\quad\\text{or}\\quad x + 5 = 0", say: "One of the factors must be 0.",
            ask: { prompt: "The product is 0. What must be true?", answer: 0,
                   options: [{ t: "One of the brackets is 0" }, { t: "Both brackets are 0", fb: "One is enough. And $x$ cannot be 3 and $-5$ at the same time." }] } },
          { step: 3, m: "x = 3 \\quad\\text{or}\\quad x = -5", say: "Solve each small equation." },
          { step: 4, m: "(3 - 3)(3 + 5) = 0 \\cdot 8 = 0", say: "Check $x = 3$ ✓. And $x = -5$ gives $(-8)(0) = 0$ ✓." }] },
        gate: true,
        then: "**Zero product property:** if $a \\cdot b = 0$, then $a = 0$ or $b = 0$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you use it.$$x(x - 9) = 0$$",
        how: HOW_8_4, skill: "Zero product property",
        steps: [
          { step: 1, ask: "Is this ready for the zero product property?", type: "choice", answer: 0,
            options: [{ t: "Yes: a product, equal to 0" }, { t: "No", fb: "$x$ times $(x - 9)$ is a product, and the other side is 0." }],
            m: "x(x - 9) = 0", say: "Ready." },
          { step: 2, ask: "What are the two factors?", type: "choice", answer: 0,
            options: [{ t: "$x$ and $(x - 9)$" }, { t: "$x$ and 9", fb: "The second factor is the whole bracket, $(x - 9)$." }],
            m: "x = 0 \\quad\\text{or}\\quad x - 9 = 0", say: "Each factor, set equal to 0." },
          { step: 3, ask: "Solve each one.", type: "choice", answer: 0,
            options: [{ t: "$x = 0$ or $x = 9$" }, { t: "$x = 9$ only", fb: "The factor $x$ gives a solution too: $x = 0$." }, { t: "$x = 0$ or $x = -9$", fb: "$x - 9 = 0$ gives $x = 9$." }],
            m: "x = 0 \\quad\\text{or}\\quad x = 9", say: "Two solutions." },
          { step: 4, ask: "Check $x = 9$: what is $9(9 - 9)$?", type: "num", answer: 0, hint: "$9 \\times 0$.", m: "9(9 - 9) = 0", say: "It checks ✓." }],
        why: "Zero, split, solve, check. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $(x - 4)(x + 7) = 0$.", answer: [4, -7], skill: "Zero product property", placeholder: "e.g. 2, -5",
        near: [], hints: ["What makes $x - 4$ zero? What makes $x + 7$ zero?"], why: "$x = 4$ or $x = -7$. The signs are the opposite of those in the brackets." },
      { type: "learn", kicker: "A harder case",
        prompt: "A factor may need more than one move.$$(3x - 6)(x + 1) = 0$$",
        scene: { type: "walk", how: HOW_8_4, rows: [
          { step: 1, m: "(3x - 6)(x + 1) = 0", say: "A product, equal to 0." },
          { step: 2, m: "3x - 6 = 0 \\quad\\text{or}\\quad x + 1 = 0", say: "Each factor, set equal to 0." },
          { step: 3, m: "3x = 6, \\; x = 2", say: "This one takes two moves: add 6, then divide by 3." },
          { step: 3, m: "x = -1", say: "The other factor." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Solve $(2x - 1)(x + 5) = 0$.", answer: [0.5, -5], skill: "Zero product property", placeholder: "e.g. 1/2, -3",
        hints: ["$2x - 1 = 0$ means $2x = 1$."], why: "$2x - 1 = 0$ gives $x = \\frac{1}{2}$. $x + 5 = 0$ gives $x = -5$." },
      { type: "choice", kicker: "Find the error", prompt: "Han solves $(x - 2)(x + 3) = 6$ by writing $x - 2 = 6$ or $x + 3 = 6$. What's wrong?",
        options: [{ t: "The property only works when the product equals **zero**." }, { t: "Nothing: $x = 8$ and $x = 3$.", fb: "Check $x = 8$: $(6)(11) = 66$, not 6." }, { t: "He should have written $x - 2 = 3$ and $x + 3 = 2$.", fb: "Lots of pairs multiply to 6: 1 and 6, 2 and 3, $-1$ and $-6$, … Only zero forces a factor's value." }],
        answer: 0, skill: "Zero product property", hints: ["If a product is 6, must one factor be 6?"], why: "A product of 6 tells you nothing definite about the factors. Rearrange to make one side zero first." },
      { type: "num", kicker: "Use it", prompt: "A diver's height above the water is $h(t) = -16t(t - 3)$ feet. Apart from $t = 0$, when is the height zero?", pre: "$t =$", post: "s", answer: 3, skill: "Zero product property",
        hints: ["$-16t = 0$ or $t - 3 = 0$."], why: "$t - 3 = 0$ at $t = 3$: back at water level after 3 seconds." }
    ]
  });

  /* ============================================ 8.5 · How many solutions */
  var HOW_8_5 = [["Zero", "Move everything to one side."], ["Factor", "Factor that side, if you can."], ["Solve", "Use the zero product property."], ["Count", "Two different solutions, one repeated solution, or none."]];
  LESSONS.push({
    title: "How many solutions?",
    blurb: "Book 8.5 · The graph shows it: two crossings, one touch, or none.",
    mins: 12, v: 3,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "Solve $x(x - 3) = 0$.", answer: [0, 3], skill: "Zero product property", placeholder: "e.g. 4, -1",
        hints: ["Set each factor equal to 0."], why: "$x = 0$, or $x - 3 = 0$, which gives $x = 3$." },
      { type: "plane", kicker: "Explore", prompt: "The graph is $y = x^2 + c$. The solutions of $x^2 + c = 0$ are its $x$-intercepts. Slide $c$ so the equation has **exactly one** solution.",
        x: [-5, 5], y: [-6, 8], params: { c: { v: -4, min: -5, max: 5, step: 1, label: "$c$" } }, fns: [{ f: function (x, p) { return x * x + p.c; }, color: "blue" }],
        marks: function (st) { var c = st.params.c; return c > 0 ? [] : c === 0 ? [{ x: 0, y: 0, color: "orange", r: 6 }] : [{ x: Math.sqrt(-c), y: 0, color: "orange", r: 6 }, { x: -Math.sqrt(-c), y: 0, color: "orange", r: 6 }]; },
        readout: function (st) { var c = st.params.c; return "$x^2 " + (c < 0 ? "- " + -c + " = 0" : c > 0 ? "+ " + c + " = 0" : "= 0") + "$ has **" + (c < 0 ? "two solutions" : c === 0 ? "one solution" : "no real solutions") + "**"; },
        check: function (st) { var c = st.params.c; return c === 0 ? { ok: true } : { ok: false, say: c < 0 ? "The curve crosses the axis twice. Raise it until it only touches." : "Now it misses the axis altogether. Lower it until it just touches." }; },
        answer: { params: { c: 0 } }, skill: "Number of solutions", hints: ["One solution means the curve just touches the axis."],
        why: "With $c = 0$ the vertex sits on the axis: one solution, $x = 0$. Below that there are two; above, none." },
      { type: "learn", kicker: "The idea",
        prompt: "A quadratic equation has **two**, **one** or **no** real solutions. On the graph of the related function they are the $x$-intercepts: the parabola crosses the axis twice, touches it once, or misses it.",
        scene: { type: "method", how: HOW_8_5 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch this solved, and its solutions counted.$$x^2 = 4x$$",
        scene: { type: "walk", how: HOW_8_5, rows: [
          { step: 1, m: "x^2 - 4x = 0", say: "Subtract $4x$ from both sides." },
          { step: 2, m: "x(x - 4) = 0", say: "Both terms share an $x$.",
            ask: { prompt: "To solve $x^2 = 4x$, could we have divided both sides by $x$ instead?", answer: 0,
                   options: [{ t: "No. If $x$ is 0 that divides by 0, and a solution is lost" }, { t: "Yes. That gives $x = 4$", fb: "It gives only one of the solutions. $x = 0$ works as well: $0 = 0$." }] } },
          { step: 3, m: "x = 0 \\quad\\text{or}\\quad x = 4", say: "The zero product property." },
          { step: 4, m: "2 \\text{ solutions}", say: "Dividing by $x$ would have kept $x = 4$ and thrown away $x = 0$." }] },
        gate: true,
        then: "Move everything to one side and factor. Never divide by the variable." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve one, and count.$$x^2 = 7x$$",
        how: HOW_8_5, skill: "Number of solutions",
        steps: [
          { step: 1, ask: "Move everything to one side.", type: "choice", answer: 0,
            options: [{ t: "$x^2 - 7x = 0$" }, { t: "$x = 7$", fb: "That divides by $x$, which loses a solution." }],
            m: "x^2 - 7x = 0", say: "Subtract $7x$ from both sides." },
          { step: 2, ask: "Factor the left side.", type: "choice", answer: 0,
            options: [{ t: "$x(x - 7) = 0$" }, { t: "$(x - 7)(x + 7) = 0$", fb: "That is $x^2 - 49$. Here both terms share an $x$." }],
            m: "x(x - 7) = 0", say: "Take out the common $x$." },
          { step: 3, ask: "Solve.", type: "choice", answer: 0,
            options: [{ t: "$x = 0$ or $x = 7$" }, { t: "$x = 7$", fb: "The factor $x$ gives $x = 0$ as well." }],
            m: "x = 0 \\quad\\text{or}\\quad x = 7", say: "Each factor, set equal to 0." },
          { step: 4, ask: "How many solutions?", type: "num", answer: 2, hint: "Count them.", m: "2 \\text{ solutions}", say: "Two different solutions." }],
        why: "Zero, factor, solve, count. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $x^2 = 5x$ properly.", answer: [0, 5], skill: "Zero product property", placeholder: "e.g. 2, -5",
        hints: ["Bring everything to one side: $x^2 - 5x = 0$.", "Factor: $x(x - 5) = 0$."], why: "$x(x - 5) = 0$, so $x = 0$ or $x = 5$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Sometimes the two factors are the same.$$x^2 - 6x + 9 = 0$$",
        scene: { type: "walk", how: HOW_8_5, rows: [
          { step: 1, m: "x^2 - 6x + 9 = 0", say: "Already equal to 0." },
          { step: 2, m: "(x - 3)(x - 3) = 0", say: "Both factors are the same." },
          { step: 3, m: "x = 3", say: "Both give the same solution." },
          { step: 4, m: "1 \\text{ solution}", say: "The parabola only touches the axis. And an equation like $x^2 + 4 = 0$ has none, because a square is never $-4$." }] },
        gate: true },
      { type: "sort", kicker: "Try it", prompt: "How many solutions?",
        bins: ["Two", "One", "None"],
        cards: [{ t: "$(x - 3)^2 = 0$", bin: 1, fb: "Both factors are zero at $x = 3$." }, { t: "$x^2 + 5 = 0$", bin: 2, fb: "$x^2 = -5$ is impossible." }, { t: "$x(x - 5) = 0$", bin: 0, fb: "$x = 0$ or $x = 5$." }, { t: "$(x + 1)(x - 1) = 0$", bin: 0, fb: "$x = -1$ or $x = 1$." }],
        skill: "Number of solutions", hints: ["Use the zero product property, or think about the graph."], why: "Two different factors: two solutions. A repeated factor: one. A square equal to a negative: none." },
      { type: "choice", kicker: "Find the error", prompt: "Mia solves $x^2 = 5x$ by dividing both sides by $x$, and gets $x = 5$. What went wrong?",
        options: [{ t: "Dividing by $x$ lost the solution $x = 0$." }, { t: "Nothing: 5 is the only solution.", fb: "Try $x = 0$: $0^2 = 5(0)$ ✓." }, { t: "She should have got $x = \\pm 5$.", fb: "$(-5)^2 = 25$, but $5(-5) = -25$. That's not a solution." }],
        answer: 0, skill: "Number of solutions", hints: ["Is $x = 0$ a solution? Can you divide by $x$ if $x$ might be 0?"], why: "You can't divide by something that might be zero. That move threw a solution away." },
      { type: "choice", kicker: "Use it", prompt: "Which method suits $(x - 7)^2 = 36$ best?",
        options: [{ t: "Square roots: the bracket is 6 or $-6$." }, { t: "Zero product property, as it stands.", fb: "The right side is 36, not 0." }, { t: "Divide both sides by $(x - 7)$.", fb: "That leaves $x - 7 = \\frac{36}{x - 7}$, which is no simpler." }],
        answer: 0, skill: "Number of solutions", hints: ["It's already “something squared equals a number”."], why: "$x - 7 = \\pm 6$, so $x = 13$ or $x = 1$. Match the method to the form." }
    ]
  });

  /* ============================================ 8.6 · Factored form, part 1 */
  var HOW_8_6 = [["Read", "In $x^2 + bx + c$, note $b$ and $c$."], ["Pairs", "List the pairs of numbers that multiply to $c$."], ["Pick", "Pick the pair that adds to $b$."], ["Write", "Write $(x + p)(x + q)$. Multiply to check."]];
  LESSONS.push({
    title: "Rewriting quadratic expressions in factored form, part 1",
    blurb: "Book 8.6 · To use the zero product property you need factors. Here is how to find them.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up",
        prompt: "Multiply.$$(x + 2)(x + 7)$$",
        options: [{ t: "$x^2 + 9x + 14$" }, { t: "$x^2 + 14x + 9$", fb: "The $x$ terms are $7x$ and $2x$: together $9x$. The number is $2 \\cdot 7 = 14$." }, { t: "$x^2 + 14$", fb: "The two middle products are missing." }],
        answer: 0, skill: "Factor a quadratic", hints: ["Four products: $x^2$, $7x$, $2x$ and 14."],
        why: "$x^2 + 7x + 2x + 14 = x^2 + 9x + 14$." },
      { type: "learn", kicker: "The idea",
        prompt: "To use the zero product property you need **factors**. Multiply out $(x + p)(x + q)$ and you get $x^2 + (p + q)x + pq$. So to factor $x^2 + bx + c$, find two numbers whose **sum** is $b$ and whose **product** is $c$.",
        scene: { type: "method", how: HOW_8_6 } },
      { type: "tiles", kicker: "Explore", prompt: "Arrange $x^2 + 9x + 20$ into a rectangle. Choose $p$ and $q$ so the tiles match.",
        mode: "factor", target: { b: 9, c: 20 }, p: 1, q: 1, min: 0, answer: [4, 5], skill: "Factor a quadratic",
        hints: ["9 $x$-tiles in all, 20 units in the corner."], why: "$(x + 4)(x + 5)$: $4 + 5 = 9$ and $4 \\times 5 = 20$." },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a quadratic factored.$$x^2 + 7x + 10$$",
        scene: { type: "walk", how: HOW_8_6, rows: [
          { step: 1, m: "b = 7, \\; c = 10", say: "Sum 7, product 10." },
          { step: 2, m: "1 \\cdot 10, \\quad 2 \\cdot 5", say: "The pairs that multiply to 10." },
          { step: 3, m: "2 + 5 = 7", say: "This pair adds to 7.",
            ask: { prompt: "Which pair adds to 7?", answer: 0,
                   options: [{ t: "2 and 5" }, { t: "1 and 10", fb: "$1 + 10 = 11$." }] } },
          { step: 4, m: "(x + 2)(x + 5)", say: "Check: $x^2 + 5x + 2x + 10 = x^2 + 7x + 10$ ✓." }] },
        gate: true,
        then: "$x^2 + bx + c = (x + p)(x + q)$, with $p + q = b$ and $p \\cdot q = c$." },
      { type: "guided", kicker: "Together",
        prompt: "Now you factor one.$$x^2 + 11x + 24$$",
        how: HOW_8_6, skill: "Factor a quadratic",
        steps: [
          { step: 1, ask: "What must the two numbers do?", type: "choice", answer: 0,
            options: [{ t: "Multiply to 24 and add to 11" }, { t: "Multiply to 11 and add to 24", fb: "The last term is the product. The middle coefficient is the sum." }],
            m: "b = 11, \\; c = 24", say: "Product 24, sum 11." },
          { step: 2, ask: "Which list has every pair that multiplies to 24?", type: "choice", answer: 0,
            options: [{ t: "1 and 24, 2 and 12, 3 and 8, 4 and 6" }, { t: "2 and 12, 4 and 6", fb: "$1 \\cdot 24$ and $3 \\cdot 8$ are pairs as well." }],
            m: "1 \\cdot 24, \\quad 2 \\cdot 12, \\quad 3 \\cdot 8, \\quad 4 \\cdot 6", say: "Every pair." },
          { step: 3, ask: "Which pair adds to 11?", type: "choice", answer: 0,
            options: [{ t: "3 and 8" }, { t: "4 and 6", fb: "$4 + 6 = 10$." }, { t: "2 and 12", fb: "$2 + 12 = 14$." }],
            m: "3 + 8 = 11", say: "The pair we need." },
          { step: 4, ask: "Write the factors.", type: "choice", answer: 0,
            options: [{ t: "$(x + 3)(x + 8)$" }, { t: "$(x + 11)(x + 24)$", fb: "11 and 24 are the sum and the product. The brackets hold the pair itself." }],
            m: "(x + 3)(x + 8)", say: "Check: $x^2 + 11x + 24$ ✓." }],
        why: "Read, pairs, pick, write. Now fill in some missing numbers." },
      { type: "table", kicker: "On your own", prompt: "Fill in the missing numbers.", head: ["factored form", "sum $b$", "product $c$"], rows: [["(x + 3)(x + 6)", null, null], ["(x + 2)(x + 10)", null, null], ["(x + 1)(x + 7)", null, null]],
        answers: [[0, 1, 9], [0, 2, 18], [1, 1, 12], [1, 2, 20], [2, 1, 8], [2, 2, 7]], skill: "Factor a quadratic", hints: ["Add the two numbers for $b$. Multiply them for $c$."],
        why: "$x^2 + 9x + 18$, $x^2 + 12x + 20$ and $x^2 + 8x + 7$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A **negative** middle term with a positive last term.$$x^2 - 8x + 15$$",
        scene: { type: "walk", how: HOW_8_6, rows: [
          { step: 1, m: "b = -8, \\; c = 15", say: "Sum $-8$, product 15." },
          { step: 2, m: "(-1)(-15), \\quad (-3)(-5)", say: "A positive product with a negative sum: **both** numbers are negative." },
          { step: 3, m: "-3 + (-5) = -8", say: "This pair adds to $-8$." },
          { step: 4, m: "(x - 3)(x - 5)", say: "Check the middle term: $-5x - 3x = -8x$ ✓." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Now a **negative** middle term: $x^2 - 9x + 20$. Which two numbers multiply to $+20$ and add to $-9$?", answer: [-4, -5], skill: "Factor a quadratic", placeholder: "e.g. -2, -7",
        hints: ["A positive product and a negative sum: both numbers are negative."], why: "$(-4)(-5) = 20$ and $-4 + (-5) = -9$." },
      { type: "expr", prompt: "Factor $x^2 - 9x + 20$.", answer: "(x-4)(x-5)", shown: "(x - 4)(x - 5)", form: "factored", skill: "Factor a quadratic", keys: KEYS_Q,
        hints: ["Use $-4$ and $-5$."], why: "$(x - 4)(x - 5) = x^2 - 9x + 20$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran factors $x^2 - 7x + 12$ as $(x + 3)(x + 4)$. What is wrong?",
        options: [{ t: "That gives $+7x$ in the middle. Both numbers must be negative: $(x - 3)(x - 4)$." },
                  { t: "The numbers should be 2 and 6.", fb: "$2 + 6 = 8$. The pair 3 and 4 is right, apart from its signs." },
                  { t: "Nothing. $3 \\cdot 4 = 12$.", fb: "The product is right. Now check the sum against the middle term, $-7$." }],
        answer: 0, skill: "Factor a quadratic", hints: ["Multiply his answer out. What is the middle term?"],
        why: "$(-3)(-4) = 12$ and $-3 + (-4) = -7$: $(x - 3)(x - 4)$." },
      { type: "numbers", kicker: "Use it", prompt: "Now put the two ideas together. Solve $x^2 + 9x + 20 = 0$ by factoring.", answer: [-4, -5], skill: "Factor a quadratic", placeholder: "e.g. 4, -1",
        hints: ["Which two numbers multiply to 20 and add to 9?", "$(x + 4)(x + 5) = 0$. Now set each factor equal to 0."], why: "$(x + 4)(x + 5) = 0$, so $x = -4$ or $x = -5$." }
    ]
  });
  var THROW = [[0, 0.2], [1, 4.8], [2, 8.1], [3, 9.2], [4, 7.9], [5, 5.1], [6, 0.1]];
  function rocket(t) { return t >= 0 && t <= 6 ? 96 * t - 16 * t * t : NaN; }

  /* ============================================ 8.7 · Factored form, part 2 */
  var HOW_8_7 = [["Read", "Note $b$ and $c$. A negative $c$ means one number is positive and the other negative."], ["Pairs", "List pairs that multiply to $c$: one positive, one negative."], ["Pick", "Pick the pair that adds to $b$."], ["Write", "Write the factors, and check the middle term."]];
  LESSONS.push({
    title: "Rewriting quadratic expressions in factored form, part 2",
    blurb: "Book 8.7 · A negative constant term means one factor adds and the other subtracts.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up",
        prompt: "Two numbers multiply to give a **negative** number. What can you say about their signs?",
        options: [{ t: "One is positive and one is negative" }, { t: "Both are negative", fb: "Two negatives multiply to a positive." }, { t: "Both are positive", fb: "Two positives multiply to a positive." }],
        answer: 0, skill: "Factor with a negative constant", hints: ["Try $(-3) \\times 4$, and $(-3) \\times (-4)$."],
        why: "Only one positive with one negative gives a negative product." },
      { type: "learn", kicker: "The idea",
        prompt: "When the last term is **negative**, the two numbers have opposite signs: one bracket adds and the other subtracts. The middle term tells you which of the two is larger.",
        scene: { type: "method", how: HOW_8_7 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a quadratic with a negative last term factored.$$x^2 + 2x - 15$$",
        scene: { type: "walk", how: HOW_8_7, rows: [
          { step: 1, m: "b = 2, \\; c = -15", say: "The product is negative: one number is positive, one negative." },
          { step: 2, m: "(-1)(15), \\quad (1)(-15), \\quad (-3)(5), \\quad (3)(-5)", say: "The pairs that multiply to $-15$." },
          { step: 3, m: "-3 + 5 = 2", say: "This pair adds to 2.",
            ask: { prompt: "The sum must be $+2$. Which pair works?", answer: 0,
                   options: [{ t: "$-3$ and 5" }, { t: "3 and $-5$", fb: "$3 + (-5) = -2$. The larger number must be the positive one." }] } },
          { step: 4, m: "(x - 3)(x + 5)", say: "Check the middle term: $5x - 3x = 2x$ ✓." }] },
        gate: true,
        then: "A negative constant term: one factor adds, the other subtracts." },
      { type: "guided", kicker: "Together",
        prompt: "Now you factor one.$$x^2 + x - 12$$",
        how: HOW_8_7, skill: "Factor with a negative constant",
        steps: [
          { step: 1, ask: "The last term is $-12$. What does that tell you about the two numbers?", type: "choice", answer: 0,
            options: [{ t: "One is positive and one is negative" }, { t: "Both are negative", fb: "Two negatives would multiply to $+12$." }],
            m: "b = 1, \\; c = -12", say: "Opposite signs." },
          { step: 2, ask: "Which pairs multiply to $-12$?", type: "choice", answer: 0,
            options: [{ t: "1 and 12, 2 and 6, 3 and 4, each with one sign made negative" }, { t: "1 and 12, 2 and 6, 3 and 4, all positive", fb: "Those multiply to $+12$. One number in each pair must be negative." }],
            m: "(-3)(4), \\quad (3)(-4), \\quad (-2)(6), \\quad \\ldots", say: "One positive and one negative in each pair." },
          { step: 3, ask: "Which pair adds to 1?", type: "choice", answer: 0,
            options: [{ t: "$-3$ and 4" }, { t: "3 and $-4$", fb: "$3 + (-4) = -1$." }, { t: "$-2$ and 6", fb: "$-2 + 6 = 4$." }],
            m: "-3 + 4 = 1", say: "The pair we need." },
          { step: 4, ask: "Write the factors.", type: "choice", answer: 0,
            options: [{ t: "$(x - 3)(x + 4)$" }, { t: "$(x + 3)(x - 4)$", fb: "That gives $-x$ in the middle. The signs are swapped." }],
            m: "(x - 3)(x + 4)", say: "Check: $4x - 3x = x$ ✓." }],
        why: "Read, pairs, pick, write. Now think about the signs in general." },
      { type: "sort", kicker: "On your own", prompt: "In $x^2 + bx + c = (x + p)(x + q)$, what are the signs of $p$ and $q$?",
        bins: ["Both positive", "Both negative", "One of each"],
        cards: [{ t: "$x^2 + 7x + 10$", bin: 0, fb: "Positive product, positive sum." }, { t: "$x^2 - 7x + 10$", bin: 1, fb: "Positive product, negative sum." }, { t: "$x^2 + 3x - 10$", bin: 2, fb: "A negative product needs opposite signs." }, { t: "$x^2 - 3x - 10$", bin: 2, fb: "A negative product needs opposite signs." }],
        skill: "Factor with a negative constant", hints: ["The sign of $c$ tells you if the signs match. The sign of $b$ tells you which is bigger."],
        why: "$c > 0$: same signs, both matching the sign of $b$. $c < 0$: opposite signs, and the larger one has the sign of $b$." },
      { type: "expr", prompt: "Factor $x^2 - 3x - 10$.", answer: "(x-5)(x+2)", shown: "(x - 5)(x + 2)", form: "factored", skill: "Factor with a negative constant", keys: KEYS_Q,
        near: [{ v: "(x+5)(x-2)", fb: "That gives $+3x$. The sum must be $-3$, so the larger number is the negative one." }], hints: ["Multiply to $-10$, add to $-3$."], why: "$-5 \\times 2 = -10$ and $-5 + 2 = -3$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What if there is **no** middle term?$$x^2 - 36$$",
        scene: { type: "walk", how: HOW_8_7, rows: [
          { step: 1, m: "b = 0, \\; c = -36", say: "No $x$ term at all, so $b = 0$." },
          { step: 2, m: "(-6)(6)", say: "The two numbers must multiply to $-36$." },
          { step: 3, m: "-6 + 6 = 0", say: "And they must cancel when added: a number and its opposite." },
          { step: 4, m: "(x - 6)(x + 6)", say: "Check: $6x - 6x = 0$, so there is no middle term ✓." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Which two numbers multiply to $-100$ and add to $0$?", answer: [10, -10], skill: "Factor with a negative constant", placeholder: "e.g. 5, -2",
        hints: ["To add to 0 they must be opposites."], why: "$10 \\times (-10) = -100$ and $10 + (-10) = 0$. So $x^2 - 100 = (x + 10)(x - 10)$: no middle term at all." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran factors $x^2 - 2x - 8$ as $(x - 2)(x + 4)$. What is wrong?",
        options: [{ t: "That gives $+2x$ in the middle. The signs are swapped: $(x + 2)(x - 4)$." },
                  { t: "The numbers should be 1 and 8.", fb: "$-1 + 8 = 7$ and $1 - 8 = -7$. The pair 2 and 4 is right, apart from its signs." },
                  { t: "Nothing. $-2 \\cdot 4 = -8$.", fb: "The product is right. Now check the sum against the middle term, $-2$." }],
        answer: 0, skill: "Factor with a negative constant", hints: ["Multiply his answer out. What is the middle term?"],
        why: "$2 + (-4) = -2$: the larger number is the negative one. $(x + 2)(x - 4)$." },
      { type: "expr", kicker: "Use it", prompt: "Factor $x^2 + 5x - 14$.", answer: "(x+7)(x-2)", shown: "(x + 7)(x - 2)", form: "factored", skill: "Factor with a negative constant", keys: KEYS_Q,
        hints: ["Multiply to $-14$, add to 5."], why: "$7 \\times (-2) = -14$ and $7 + (-2) = 5$." }
    ]
  });

  /* ============================================ 8.8 · Factored form, part 3 */
  var HOW_8_8 = [["Two squares", "Check: two terms, both perfect squares, with a minus sign between them."], ["Roots", "Take the square root of each term."], ["Write", "Write (sum of the roots) times (difference of the roots)."], ["Check", "Multiply back. The middle terms cancel."]];
  LESSONS.push({
    title: "Rewriting quadratic expressions in factored form, part 3",
    blurb: "Book 8.8 · No middle term: the difference of two squares.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up",
        prompt: "Multiply.$$(x + 4)(x - 4)$$",
        options: [{ t: "$x^2 - 16$" }, { t: "$x^2 + 16$", fb: "$4 \\cdot (-4) = -16$." }, { t: "$x^2 - 8x - 16$", fb: "The middle products are $-4x$ and $+4x$. They cancel." }],
        answer: 0, skill: "Difference of squares", hints: ["Four products: $x^2$, $-4x$, $4x$ and $-16$."],
        why: "$x^2 - 4x + 4x - 16 = x^2 - 16$." },
      { type: "learn", kicker: "The idea",
        prompt: "The middle terms cancelled: $-4x + 4x = 0$. That always happens when a sum is multiplied by the matching difference. Read it backwards, and you can factor any **difference of two squares**.$$a^2 - b^2 = (a + b)(a - b)$$",
        scene: { type: "method", how: HOW_8_8 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a difference of squares factored.$$x^2 - 25$$",
        scene: { type: "walk", how: HOW_8_8, rows: [
          { step: 1, m: "x^2 - 25", say: "Two terms, both perfect squares, subtracted." },
          { step: 2, m: "\\sqrt{x^2} = x, \\quad \\sqrt{25} = 5", say: "Their square roots." },
          { step: 3, m: "(x + 5)(x - 5)", say: "The sum of the roots, times their difference.",
            ask: { prompt: "The roots are $x$ and 5. What are the two factors?", answer: 0,
                   options: [{ t: "$(x + 5)$ and $(x - 5)$" }, { t: "$(x - 5)$ and $(x - 5)$", fb: "That is $(x - 5)^2 = x^2 - 10x + 25$. It has a middle term." }] } },
          { step: 4, m: "x^2 - 5x + 5x - 25 = x^2 - 25", say: "The middle terms cancel ✓." }] },
        gate: true,
        then: "No middle term, two squares, a minus sign: a difference of squares." },
      { type: "guided", kicker: "Together",
        prompt: "Now you factor one.$$x^2 - 49$$",
        how: HOW_8_8, skill: "Difference of squares",
        steps: [
          { step: 1, ask: "Is $x^2 - 49$ a difference of two squares?", type: "choice", answer: 0,
            options: [{ t: "Yes: $x^2$ and $7^2$, subtracted" }, { t: "No", fb: "$49 = 7 \\cdot 7$, and the two terms are subtracted." }],
            m: "x^2 - 49", say: "Two squares, subtracted." },
          { step: 2, ask: "What is $\\sqrt{49}$?", type: "num", answer: 7, hint: "Which number times itself is 49?", m: "\\sqrt{x^2} = x, \\quad \\sqrt{49} = 7", say: "The roots." },
          { step: 3, ask: "Write the factors.", type: "choice", answer: 0,
            options: [{ t: "$(x + 7)(x - 7)$" }, { t: "$(x - 7)^2$", fb: "That is $x^2 - 14x + 49$: it has a middle term, and $+49$." }, { t: "$(x + 49)(x - 1)$", fb: "Use the square roots, $x$ and 7." }],
            m: "(x + 7)(x - 7)", say: "Sum times difference." },
          { step: 4, ask: "Multiply back. What happens to the middle terms?", type: "choice", answer: 0,
            options: [{ t: "They cancel: $-7x + 7x = 0$" }, { t: "They add to $14x$", fb: "One is $-7x$ and the other is $+7x$." }],
            m: "x^2 - 7x + 7x - 49 = x^2 - 49", say: "It checks ✓." }],
        why: "Two squares, roots, write, check. Now use the pattern for mental arithmetic." },
      { type: "num", kicker: "On your own", prompt: "Do this one in your head: $103 \\times 97$. (Think of it as $(100 + 3)(100 - 3)$.)", answer: 9991, skill: "Difference of squares",
        near: [big(9991), { v: 10009, fb: "The last product is $3 \\times -3 = -9$: subtract it." }, { v: 10000, fb: "That's $100 \\times 100$. Take off $3 \\times 3$." }],
        hints: ["The two middle products, $-300$ and $+300$, cancel."], why: "$100^2 - 3^2 = 10000 - 9 = 9991$." },
      { type: "learn", kicker: "A harder case",
        prompt: "A coefficient can be part of the square.$$4x^2 - 25$$",
        scene: { type: "walk", how: HOW_8_8, rows: [
          { step: 1, m: "4x^2 - 25", say: "$4x^2$ is a perfect square as well: it is $(2x)^2$." },
          { step: 2, m: "\\sqrt{4x^2} = 2x, \\quad \\sqrt{25} = 5", say: "The roots." },
          { step: 3, m: "(2x + 5)(2x - 5)", say: "Sum times difference." },
          { step: 4, m: "4x^2 - 10x + 10x - 25", say: "The middle terms cancel ✓." }] },
        gate: true },
      { type: "expr", kicker: "Try it", prompt: "Factor $9x^2 - 16$.", answer: "(3x+4)(3x-4)", shown: "(3x + 4)(3x - 4)", form: "factored", skill: "Difference of squares", keys: KEYS_Q,
        hints: ["$9x^2 = (3x)^2$ and $16 = 4^2$."], why: "$(3x)^2 - 4^2 = (3x + 4)(3x - 4)$." },
      { type: "sort", prompt: "Can it be factored using whole numbers?",
        bins: ["Yes", "No"],
        cards: [{ t: "$x^2 - 36$", bin: 0, fb: "$(x + 6)(x - 6)$." }, { t: "$x^2 + 36$", bin: 1, fb: "A *sum* of squares doesn't factor." }, { t: "$4x^2 - 1$", bin: 0, fb: "$(2x + 1)(2x - 1)$." },
                { t: "$x^2 - 7$", bin: 1, fb: "7 isn't the square of a whole number." }, { t: "$x^2 - 6x + 9$", bin: 0, fb: "$(x - 3)^2$." }],
        skill: "Difference of squares", hints: ["Two squares, subtracted? Or is it a perfect square trinomial?"], why: "Differences of squares and perfect squares factor. Sums of squares don't." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran factors $x^2 + 9$ as $(x + 3)(x - 3)$. What is wrong?",
        options: [{ t: "$(x + 3)(x - 3)$ is $x^2 - 9$. A **sum** of squares cannot be factored this way." },
                  { t: "It should be $(x + 3)^2$.", fb: "That is $x^2 + 6x + 9$, with a middle term." },
                  { t: "Nothing. That is right.", fb: "Multiply it back: $3 \\cdot (-3)$ is $-9$." }],
        answer: 0, skill: "Difference of squares", hints: ["Step 1: is there a minus sign between the squares?"],
        why: "The pattern needs a minus sign. $x^2 + 9$ has no factors with real numbers." },
      { type: "numbers", kicker: "Use it", prompt: "Use factoring to solve $x^2 - 81 = 0$.", answer: [9, -9], skill: "Difference of squares", placeholder: "e.g. 3, -3",
        hints: ["$(x + 9)(x - 9) = 0$."], why: "$x + 9 = 0$ or $x - 9 = 0$: $x = \\pm 9$. The same answer as taking square roots." }
    ]
  });

  /* ============================================ 8.9 · Solving by factored form */
  var HOW_8_9 = [["Zero", "Rearrange so that one side is 0."], ["Factor", "Factor the other side."], ["Split", "Set each factor equal to 0, and solve."], ["Check", "Check the solutions in the original equation."]];
  LESSONS.push({
    title: "Solving quadratic equations by using factored form",
    blurb: "Book 8.9 · Get zero on one side, factor, and let the zero product property finish.",
    mins: 12, v: 3,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "Solve $(x + 2)(x + 5) = 0$.", answer: [-2, -5], skill: "Solve by factoring", placeholder: "e.g. 4, -1",
        hints: ["Set each factor equal to 0."], why: "$x + 2 = 0$ gives $-2$, and $x + 5 = 0$ gives $-5$." },
      { type: "learn", kicker: "The idea",
        prompt: "You can factor, and you can use the zero product property. Put the two together and you can solve a quadratic equation exactly: get 0 on one side, factor the other side, and let each factor give a solution.",
        scene: { type: "method", how: HOW_8_9 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch a quadratic equation solved by factoring.$$x^2 + 6x + 8 = 0$$",
        scene: { type: "walk", how: HOW_8_9, rows: [
          { step: 1, m: "x^2 + 6x + 8 = 0", say: "One side is already 0." },
          { step: 2, m: "(x + 2)(x + 4) = 0", say: "2 and 4 multiply to 8 and add to 6." },
          { step: 3, m: "x + 2 = 0 \\quad\\text{or}\\quad x + 4 = 0", say: "The zero product property." },
          { step: 3, m: "x = -2 \\quad\\text{or}\\quad x = -4", say: "Two solutions.",
            ask: { prompt: "$x + 2 = 0$. What is $x$?", answer: 0,
                   options: [{ t: "$-2$" }, { t: "2", fb: "$2 + 2 = 4$, not 0." }] } },
          { step: 4, m: "(-2)^2 + 6(-2) + 8 = 4 - 12 + 8 = 0", say: "Check $x = -2$ in the original ✓." }] },
        gate: true,
        then: "Zero on one side, factor, split, check." },
      { type: "guided", kicker: "Together",
        prompt: "Now you solve one.$$x^2 + 7x + 12 = 0$$",
        how: HOW_8_9, skill: "Solve by factoring",
        steps: [
          { step: 1, ask: "Is one side already 0?", type: "choice", answer: 0,
            options: [{ t: "Yes" }, { t: "No", fb: "The right side is 0." }],
            m: "x^2 + 7x + 12 = 0", say: "Ready to factor." },
          { step: 2, ask: "Factor $x^2 + 7x + 12$.", type: "choice", answer: 0,
            options: [{ t: "$(x + 3)(x + 4)$" }, { t: "$(x + 2)(x + 6)$", fb: "$2 + 6 = 8$, but the middle term is $7x$." }, { t: "$(x + 1)(x + 12)$", fb: "$1 + 12 = 13$." }],
            m: "(x + 3)(x + 4) = 0", say: "3 and 4 multiply to 12 and add to 7." },
          { step: 3, ask: "Set each factor equal to 0 and solve.", type: "choice", answer: 0,
            options: [{ t: "$x = -3$ or $x = -4$" }, { t: "$x = 3$ or $x = 4$", fb: "$x + 3 = 0$ gives $x = -3$. The sign flips." }],
            m: "x = -3 \\quad\\text{or}\\quad x = -4", say: "Two solutions." },
          { step: 4, ask: "Check $x = -3$: what is $(-3)^2 + 7(-3) + 12$?", type: "num", answer: 0, hint: "$9 - 21 + 12$.", m: "9 - 21 + 12 = 0", say: "It checks ✓." }],
        why: "Zero, factor, split, check. Now one on your own." },
      { type: "numbers", kicker: "On your own", prompt: "Solve $x^2 - 2x - 15 = 0$.", answer: [5, -3], skill: "Solve by factoring", placeholder: "e.g. 2, -5",
        hints: ["Multiply to $-15$, add to $-2$.", "$(x - 5)(x + 3) = 0$."], why: "$x = 5$ or $x = -3$. Check: $25 - 10 - 15 = 0$ ✓." },
      { type: "learn", kicker: "A harder case",
        prompt: "This equation is **not** equal to 0 yet.$$x^2 + 2x = 8$$",
        scene: { type: "walk", how: HOW_8_9, rows: [
          { step: 1, m: "x^2 + 2x - 8 = 0", say: "Subtract 8 from both sides **first**. The property needs a 0." },
          { step: 2, m: "(x + 4)(x - 2) = 0", say: "4 and $-2$ multiply to $-8$ and add to 2." },
          { step: 3, m: "x = -4 \\quad\\text{or}\\quad x = 2", say: "Each factor, set equal to 0." },
          { step: 4, m: "2^2 + 2(2) = 8", say: "Check $x = 2$ in the original ✓." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "This one isn't equal to zero yet. Solve $x^2 + 3x = 10$.", answer: [-5, 2], skill: "Solve by factoring", placeholder: "e.g. 2, -5",
        near: [], hints: ["Subtract 10 first: $x^2 + 3x - 10 = 0$.", "$(x + 5)(x - 2) = 0$."], why: "$x = -5$ or $x = 2$. Check: $4 + 6 = 10$ ✓ and $25 - 15 = 10$ ✓." },
      { type: "numbers", prompt: "Solve $x^2 = 6x - 9$.", answer: [3], skill: "Solve by factoring", placeholder: "e.g. 4",
        hints: ["$x^2 - 6x + 9 = 0$.", "That's a perfect square: $(x - 3)^2 = 0$."], why: "$(x - 3)(x - 3) = 0$: both factors give $x = 3$. One solution." },
      { type: "choice", kicker: "Find the error",
        prompt: "To solve $x^2 + 5x = 6$, Kiran writes $x(x + 5) = 6$, and then “$x = 6$ or $x + 5 = 6$”. What is wrong?",
        options: [{ t: "The zero product property needs 0 on one side. First write $x^2 + 5x - 6 = 0$." },
                  { t: "He factored wrongly: $x(x + 5)$ is not $x^2 + 5x$.", fb: "That factoring is correct. The trouble is the 6 on the other side." },
                  { t: "Nothing. Each factor equals 6.", fb: "Two numbers can multiply to 6 in many ways: 1 and 6, 2 and 3. Only a product of 0 forces a factor to be 0." }],
        answer: 0, skill: "Solve by factoring", hints: ["Step 1: is one side 0?"],
        why: "$x^2 + 5x - 6 = 0$ factors as $(x + 6)(x - 1) = 0$, so $x = -6$ or $x = 1$." },
      { type: "num", kicker: "Use it", prompt: "A rectangle is $x$ wide and $x + 3$ long, with area 40. So $x(x + 3) = 40$. Find the width.", answer: 5, skill: "Solve by factoring",
        near: [{ v: -8, fb: "$-8$ solves the equation, but a width can't be negative." }, { v: 8, fb: "8 is the length, $x + 3$." }],
        hints: ["$x^2 + 3x - 40 = 0$.", "$(x + 8)(x - 5) = 0$."], why: "$x = -8$ or $x = 5$. Only 5 makes sense: a $5 \\times 8$ rectangle." }
    ]
  });

  /* ============================================ 8.10 · Factored form, part 4 */
  var HOW_8_10 = [["Multiply", "Multiply $a$ and $c$."], ["Pair", "Find two numbers that multiply to $ac$ and add to $b$."], ["Split", "Split the middle term into those two parts."], ["Group", "Factor in pairs, then take out the common bracket."]];
  LESSONS.push({
    title: "Rewriting quadratic expressions in factored form, part 4",
    blurb: "Book 8.10 · When the x² term has a coefficient, the area model still finds the factors.",
    mins: 12, v: 3,
    steps: [
      { type: "expr", kicker: "Warm up", prompt: "Multiply out $(3x + 2)(x + 4)$.", answer: "3x^2+14x+8", shown: "3x^2 + 14x + 8", form: "simplified", skill: "Factor ax² + bx + c", keys: KEYS_Q,
        near: [{ v: "3x^2+8", fb: "Add the middle products: $12x$ and $2x$." }, { v: "3x^2+6x+8", fb: "The middle products are $3x \\cdot 4 = 12x$ and $2 \\cdot x = 2x$." }], hints: ["$3x \\cdot x$, $3x \\cdot 4$, $2 \\cdot x$, $2 \\cdot 4$."], why: "$3x^2 + 12x + 2x + 8$." },
      { type: "learn", kicker: "Explore", prompt: "Going backwards, the area model shows what to look for. Fill in the areas.",
        scene: { type: "tiles", mode: "area", rows: ["2x", "1"], cols: ["x", "3"], cells: [["2x^2", "6x"], ["x", "3"]], readout: "$2x^2 + 6x + x + 3 = 2x^2 + 7x + 3 = (2x + 1)(x + 3)$", gate: true }, gate: true,
        then: "The middle term, $7x$, was split into $6x + x$. Those two numbers, 6 and 1, **multiply** to $a \\cdot c = 6$ and **add** to $b = 7$. That's the *ac* method." },
      { type: "learn", kicker: "The idea",
        prompt: "When $x^2$ has a coefficient, the two numbers no longer multiply to $c$. They multiply to $a \\cdot c$, and they still add to $b$. Use them to split the middle term, then factor by grouping.",
        scene: { type: "method", how: HOW_8_10 } },
      { type: "learn", kicker: "Watch",
        prompt: "Watch the method used.$$2x^2 + 9x + 4$$",
        scene: { type: "walk", how: HOW_8_10, rows: [
          { step: 1, m: "2 \\cdot 4 = 8", say: "$a$ times $c$." },
          { step: 2, m: "1 \\cdot 8 = 8, \\quad 1 + 8 = 9", say: "1 and 8 multiply to 8 and add to 9.",
            ask: { prompt: "Which pair multiplies to 8 and adds to 9?", answer: 0,
                   options: [{ t: "1 and 8" }, { t: "2 and 4", fb: "$2 + 4 = 6$." }] } },
          { step: 3, m: "2x^2 + 8x + x + 4", say: "The middle term $9x$, split as $8x + x$." },
          { step: 4, m: "2x(x + 4) + 1(x + 4)", say: "Factor each pair. Both leave the bracket $(x + 4)$." },
          { step: 4, m: "(2x + 1)(x + 4)", say: "Take out the common bracket." }] },
        gate: true,
        then: "Multiply $a$ and $c$, find the pair, split the middle, group." },
      { type: "guided", kicker: "Together",
        prompt: "Now you factor one.$$2x^2 + 7x + 3$$",
        how: HOW_8_10, skill: "Factor ax² + bx + c",
        steps: [
          { step: 1, ask: "What is $a \\cdot c$?", type: "num", answer: 6, hint: "$2 \\times 3$.", m: "2 \\cdot 3 = 6", say: "$a$ times $c$." },
          { step: 2, ask: "Which pair multiplies to 6 and adds to 7?", type: "choice", answer: 0,
            options: [{ t: "1 and 6" }, { t: "2 and 3", fb: "$2 + 3 = 5$." }],
            m: "1 \\cdot 6 = 6, \\quad 1 + 6 = 7", say: "The pair." },
          { step: 3, ask: "Split the middle term.", type: "choice", answer: 0,
            options: [{ t: "$2x^2 + 6x + x + 3$" }, { t: "$2x^2 + 2x + 3x + 3$", fb: "That splits $7x$ as $2x + 3x$, which is only $5x$." }],
            m: "2x^2 + 6x + x + 3", say: "$7x = 6x + x$." },
          { step: 4, ask: "The pairs factor as $2x(x + 3) + 1(x + 3)$. Take out the common bracket.", type: "choice", answer: 0,
            options: [{ t: "$(2x + 1)(x + 3)$" }, { t: "$(2x + 3)(x + 1)$", fb: "That gives $5x$ in the middle, not $7x$." }],
            m: "(2x + 1)(x + 3)", say: "Check: $6x + x = 7x$ ✓." }],
        why: "Multiply, pair, split, group. Now one on your own." },
      { type: "expr", kicker: "On your own", prompt: "Factor $5x^2 + 11x + 2$.", answer: "(5x+1)(x+2)", shown: "(5x + 1)(x + 2)", form: "factored", skill: "Factor ax² + bx + c", keys: KEYS_Q,
        hints: ["$a \\cdot c = 10$. Two numbers that multiply to 10 and add to 11: 10 and 1.", "$5x^2 + 10x + x + 2$, then group."], why: "$5x(x + 2) + 1(x + 2) = (5x + 1)(x + 2)$." },
      { type: "learn", kicker: "A harder case",
        prompt: "Now use it to solve an equation. The solutions may be fractions.$$2x^2 + 9x + 4 = 0$$",
        scene: { type: "walk", how: HOW_8_10, rows: [
          { step: 4, m: "(2x + 1)(x + 4) = 0", say: "Factored, as before." },
          { step: 4, m: "2x + 1 = 0 \\quad\\text{or}\\quad x + 4 = 0", say: "The zero product property." },
          { step: 4, m: "x = -\\frac{1}{2} \\quad\\text{or}\\quad x = -4", say: "$2x = -1$ gives $x = -\\frac{1}{2}$." }] },
        gate: true },
      { type: "numbers", kicker: "Try it", prompt: "Now solve $2x^2 + 7x + 3 = 0$.", answer: [-0.5, -3], skill: "Factor ax² + bx + c", placeholder: "e.g. -1/3, -2",
        hints: ["$(2x + 1)(x + 3) = 0$.", "$2x + 1 = 0$ means $x = -\\frac{1}{2}$."], why: "$x = -\\frac{1}{2}$ or $x = -3$." },
      { type: "choice", kicker: "Find the error",
        prompt: "To factor $2x^2 + 7x + 3$, Kiran looks for two numbers that multiply to 3 and add to 7. What is wrong?",
        options: [{ t: "With a coefficient on $x^2$, the two numbers must multiply to $a \\cdot c = 6$." },
                  { t: "They should multiply to 7 and add to 3.", fb: "The sum always matches the middle coefficient, 7." },
                  { t: "Nothing. They multiply to $c$.", fb: "That works only when the coefficient of $x^2$ is 1." }],
        answer: 0, skill: "Factor ax² + bx + c", hints: ["Step 1: what is $a \\cdot c$?"],
        why: "$a \\cdot c = 6$. The pair is 1 and 6: $(2x + 1)(x + 3)$." },
      { type: "numbers", kicker: "Use it", prompt: "Any method: solve $3x^2 - 12 = 0$.", answer: [2, -2], skill: "Factor ax² + bx + c", placeholder: "e.g. 3, -3",
        hints: ["Divide by 3 first: $x^2 - 4 = 0$."], why: "$x^2 = 4$, so $x = \\pm 2$. A common factor first makes everything easier." }
    ]
  });

  /* ============================================ 8.11 · From solutions to equations */
  var HOW_8_11 = [["Zeros", "Each zero $m$ gives a factor $(x - m)$."], ["Product", "Write $f(x) = a(x - m)(x - n)$."], ["Point", "Put one more point of the graph in, to find $a$."], ["Write", "Write the function."]];
  LESSONS.push({
    title: "Writing quadratic equations given real solutions",
    blurb: "Book 8.11 · Run the zero product property backwards: from the zeros to the function.",
    mins: 12, v: 3,
    steps: [
      { type: "numbers", kicker: "Warm up", prompt: "What are the zeros of $f(x) = (x - 2)(x - 5)$?", answer: [2, 5], skill: "Write a quadratic from its zeros", placeholder: "e.g. 4, -1",
        hints: ["Set each bracket equal to 0."], why: "$x - 2 = 0$ gives 2, and $x - 5 = 0$ gives 5." },
      { type: "learn", kicker: "The idea",
        prompt: "Run the zero product property **backwards**. If a function must be 0 at $x = 2$ and at $x = 5$, give it the factors $(x - 2)$ and $(x - 5)$. A number in front, $a$, does not change the zeros.",
        scene: { type: "method", how: HOW_8_11 } },
      { type: "learn", kicker: "Watch",
        prompt: "A parabola has zeros at 2 and 6, and passes through $(4, -12)$. Watch its function written.",
        scene: { type: "walk", how: HOW_8_11, rows: [
          { step: 1, m: "(x - 2), \\; (x - 6)", say: "A factor for each zero." },
          { step: 2, m: "f(x) = a(x - 2)(x - 6)", say: "Every such function has those zeros, whatever $a$ is." },
          { step: 3, m: "-12 = a(4 - 2)(4 - 6)", say: "Put the point $(4, -12)$ in.",
            ask: { prompt: "The zeros alone give $a(x - 2)(x - 6)$. What fixes $a$?", answer: 0,
                   options: [{ t: "One more point on the graph" }, { t: "Nothing. $a$ is always 1", fb: "Every value of $a$ gives a parabola with the same zeros. Another point picks out one of them." }] } },
          { step: 3, m: "-12 = -4a, \\; a = 3", say: "$(2)(-2) = -4$." },
          { step: 4, m: "f(x) = 3(x - 2)(x - 6)", say: "The function." }] },
        gate: true,
        then: "Zeros give the factors. One more point gives $a$." },
      { type: "guided", kicker: "Together",
        prompt: "A parabola has zeros at $-1$ and 3, and passes through $(1, -8)$. Write its function.",
        how: HOW_8_11, skill: "Write a quadratic from its zeros",
        steps: [
          { step: 1, ask: "Which factors give zeros at $-1$ and 3?", type: "choice", answer: 0,
            options: [{ t: "$(x + 1)$ and $(x - 3)$" }, { t: "$(x - 1)$ and $(x + 3)$", fb: "$(x - 1)$ is 0 at $x = 1$. A zero at $-1$ needs $(x + 1)$." }],
            m: "(x + 1), \\; (x - 3)", say: "The sign flips: a zero at $-1$ gives $(x + 1)$." },
          { step: 2, ask: "Write the function with an unknown $a$.", type: "choice", answer: 0,
            options: [{ t: "$f(x) = a(x + 1)(x - 3)$" }, { t: "$f(x) = (x + 1)(x - 3) + a$", fb: "Adding $a$ would move the zeros. Multiplying by $a$ keeps them." }],
            m: "f(x) = a(x + 1)(x - 3)", say: "A number in front keeps the zeros." },
          { step: 3, ask: "Put in $(1, -8)$: $-8 = a(2)(-2)$, so $-8 = -4a$. What is $a$?", type: "num", pre: "$a =$", answer: 2, near: [{ v: -2, fb: "$-8 \\div (-4)$ is positive." }], hint: "$-8 \\div (-4)$.",
            m: "-8 = a(1 + 1)(1 - 3), \\; a = 2", say: "The extra point fixes $a$." },
          { step: 4, ask: "Write the function.", type: "choice", answer: 0,
            options: [{ t: "$f(x) = 2(x + 1)(x - 3)$" }, { t: "$f(x) = (x + 1)(x - 3)$", fb: "That one passes through $(1, -4)$, not $(1, -8)$." }],
            m: "f(x) = 2(x + 1)(x - 3)", say: "The function." }],
        why: "Zeros, product, point, write. Now pick a function from its zeros." },
      { type: "choice", kicker: "On your own", prompt: "A quadratic function has zeros at 2 and 5. Which could it be?",
        options: [{ t: "$f(x) = (x - 2)(x - 5)$" }, { t: "$f(x) = (x + 2)(x + 5)$", fb: "Those factors are zero at $-2$ and $-5$." }, { t: "$f(x) = x^2 + 2x + 5$", fb: "2 and 5 as coefficients don't make 2 and 5 the zeros. Check: $f(2) = 13$." }],
        answer: 0, skill: "Write a quadratic from its zeros", hints: ["Which factor is zero when $x = 2$?"], why: "A zero at $m$ comes from a factor $(x - m)$." },
      { type: "expr", prompt: "Write $(x - 2)(x - 5)$ in standard form.", answer: "x^2-7x+10", shown: "x^2 - 7x + 10", form: "simplified", skill: "Write a quadratic from its zeros", keys: KEYS_Q,
        near: [{ v: "x^2-7x-10", fb: "$(-2)(-5) = +10$." }], hints: ["Four products."], why: "$x^2 - 5x - 2x + 10$." },
      { type: "plane", prompt: "Many parabolas share the zeros 1 and 3: every $y = a(x - 1)(x - 3)$ does. Slide $a$ to find the one through the orange point.",
        x: [-2, 6], y: [-4, 9], params: { a: { v: 1, min: -2, max: 3, step: 0.5, label: "$a$" } }, fns: [{ f: function (x, p) { return p.a * (x - 1) * (x - 3); }, color: "blue" }],
        marks: [{ x: 1, y: 0, color: "ink" }, { x: 3, y: 0, color: "ink" }, { x: 0, y: 6, color: "orange", r: 6 }],
        readout: function (st) { return "$y = " + nm(st.params.a) + "(x - 1)(x - 3)$ &nbsp; at $x = 0$: $y = " + nm(3 * st.params.a) + "$"; },
        check: function (st) { return st.params.a === 2 ? { ok: true } : { ok: false, say: "At $x = 0$ the curve is at $a(-1)(-3) = 3a$. The orange point is at height 6." }; },
        answer: { params: { a: 2 } }, skill: "Write a quadratic from its zeros", hints: ["$3a = 6$."], why: "$a = 2$: $y = 2(x - 1)(x - 3)$. The zeros fix where it crosses. One more point fixes $a$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What if you want **exactly one** solution, $x = 4$?",
        scene: { type: "walk", how: HOW_8_11, rows: [
          { step: 1, m: "(x - 4), \\; (x - 4)", say: "Only one zero, so use its factor twice." },
          { step: 2, m: "f(x) = a(x - 4)^2", say: "A repeated factor." },
          { step: 4, m: "(x - 4)^2 = 0", say: "With $a = 1$: an equation whose only solution is 4. Its parabola touches the axis there and turns back." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "Which equation has **exactly one** solution, $x = 4$?",
        options: [{ t: "$(x - 4)^2 = 0$" }, { t: "$(x - 4)(x + 4) = 0$", fb: "That has two solutions: 4 and $-4$." }, { t: "$x^2 - 4 = 0$", fb: "That has solutions 2 and $-2$." }],
        answer: 0, skill: "Write a quadratic from its zeros", hints: ["Use the factor $(x - 4)$ twice."], why: "$(x - 4)(x - 4) = 0$: both factors give 4. In standard form: $x^2 - 8x + 16 = 0$." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran wants a function with zeros at 3 and $-2$. He writes $f(x) = (x + 3)(x - 2)$. What is wrong?",
        options: [{ t: "The signs are flipped. A zero at 3 needs $(x - 3)$, and a zero at $-2$ needs $(x + 2)$." },
                  { t: "He needs a number in front.", fb: "A number in front is allowed, but it would not fix the zeros." },
                  { t: "Nothing. That has zeros at 3 and $-2$.", fb: "Test it: $f(3) = (6)(1) = 6$, not 0." }],
        answer: 0, skill: "Write a quadratic from its zeros", hints: ["Put $x = 3$ into his function."],
        why: "His function has zeros at $-3$ and 2. The right one is $f(x) = (x - 3)(x + 2)$." },
      { type: "num", kicker: "Use it",
        prompt: "A bridge arch meets the ground at $x = 0$ and $x = 10$ metres, and is **5 m** high in the middle, at $x = 5$. Its height is $h(x) = a \\cdot x(x - 10)$. Find $a$. (A fraction or a decimal is fine.)",
        pre: "$a =$", answer: -0.2, skill: "Write a quadratic from its zeros",
        near: [{ v: 0.2, fb: "$5(5 - 10)$ is $-25$, so $a$ must be negative for the height to be positive." }, { v: -5, fb: "$5 = a(-25)$. Divide 5 by $-25$." }],
        hints: ["Step 3: put in $(5, 5)$: $5 = a(5)(5 - 10)$.", "$5 = -25a$."], why: "$5 = -25a$, so $a = -\\frac{1}{5}$. The negative sign makes the arch open downward." }
    ]
  });

  /* ============================================ 8.12 · Quadratic regression */
  var HOW_8_12 = [["Shape", "Look at the data. Rising and then falling, or the reverse, suggests a quadratic."], ["Fit", "Use technology to fit a parabola: quadratic regression."], ["Predict", "Put an input into the model."], ["Trust", "Trust predictions only inside the range of the data."]];
  LESSONS.push({
    title: "Using technology to find the quadratic regression",
    blurb: "Book 8.12 · When data rises and falls, fit a parabola to it and use it to predict.",
    mins: 12, v: 3,
    steps: [
      { type: "choice", kicker: "Warm up", prompt: "A ball is thrown, and its height is measured every second. Which kind of model suits this data?",
        scene: { type: "plane", x: [-1, 7], y: [-1, 11], axisLabels: ["s", "m"], marks: THROW.map(function (p) { return { x: p[0], y: p[1], color: "orange", r: 6 }; }) },
        options: [{ t: "Quadratic: it rises, peaks and falls." }, { t: "Linear", fb: "A line can only go one way. This data turns round." }, { t: "Exponential", fb: "Exponential data keeps rising or keeps falling." }],
        answer: 0, skill: "Quadratic models", hints: ["What shape do the dots make?"], why: "An arch: the shape of a parabola." },
      { type: "learn", kicker: "The idea",
        prompt: "When data rises and then falls, no line can follow it. Technology can fit a **parabola** instead, just as it fits a line. That is **quadratic regression**, and the model it gives can be used to predict.",
        scene: { type: "method", how: HOW_8_12 } },
      { type: "learn", kicker: "Explore", prompt: "Fit a parabola to the dots. Its vertex is set at $(3, 9)$. Slide $a$ until the curve runs through the data.",
        scene: { type: "plane", x: [-1, 7], y: [-1, 11], axisLabels: ["s", "m"], gate: true, params: { a: { v: -0.25, min: -2, max: -0.25, step: 0.25, label: "$a$" } },
          fns: [{ f: function (x, p) { return p.a * (x - 3) * (x - 3) + 9; }, color: "blue" }], marks: THROW.map(function (p) { return { x: p[0], y: p[1], color: "orange", r: 6 }; }),
          readout: function (st) { return "$y = " + (st.params.a === -1 ? "-" : nm(st.params.a)) + "(x - 3)^2 + 9$" + (st.params.a === -1 ? " ✓ a good fit" : ""); }, goal: function (st) { return st.params.a === -1; } },
        gate: true,
        then: "$y = -(x - 3)^2 + 9$ fits well. A calculator or spreadsheet does this automatically: **quadratic regression** finds the parabola of best fit, just as linear regression finds the line of best fit." },
      { type: "learn", kicker: "Watch",
        prompt: "A ball's height is measured each second: 0, 5, 8, 9, 8, 5 and 0 metres. Watch a model fitted and used.",
        scene: { type: "walk", how: HOW_8_12, rows: [
          { step: 1, m: "0, \\; 5, \\; 8, \\; 9, \\; 8, \\; 5, \\; 0", say: "The heights rise, peak and fall: a quadratic shape." },
          { step: 2, m: "y = -x^2 + 6x", say: "The parabola that technology fits to them." },
          { step: 3, m: "-(1.5)^2 + 6(1.5) = 6.75", say: "Predict the height at 1.5 seconds: 6.75 m.",
            ask: { prompt: "To predict the height at 1.5 seconds, what do we do?", answer: 0,
                   options: [{ t: "Put $x = 1.5$ into the model" }, { t: "Average the heights at 1 and 2 seconds", fb: "That average is 6.5, but the curve bends. The model gives 6.75." }] } },
          { step: 4, m: "0 \\le x \\le 6", say: "The data covers the whole flight. Inside it, the model can be trusted." }] },
        gate: true,
        then: "**Quadratic regression** finds the parabola of best fit." },
      { type: "guided", kicker: "Together",
        prompt: "A shop's profit at different prices rises, then falls. Technology fits the model $P = -x^2 + 10x$, from prices between \\$1 and \\$9.",
        how: HOW_8_12, skill: "Quadratic models",
        steps: [
          { step: 1, ask: "Why is a quadratic model a good choice?", type: "choice", answer: 0,
            options: [{ t: "The data rises, then falls" }, { t: "The data rises steadily", fb: "Steady rising would suit a line. This data turns round." }],
            m: "\\text{rises, then falls}", say: "A shape that turns." },
          { step: 3, ask: "Predict the profit at a price of \\$4: what is $-(4)^2 + 10(4)$?", type: "num", answer: 24, near: [{ v: 56, fb: "$-(4)^2$ is $-16$, not $+16$." }], hint: "$-16 + 40$.",
            m: "-(4)^2 + 10(4) = 24", say: "About \\$24." },
          { step: 3, ask: "The best price is at the vertex, $x = \\frac{-10}{2(-1)}$. What is it?", type: "num", pre: "$x =$", answer: 5, hint: "$\\frac{-10}{-2}$.", m: "x = 5", say: "A price of \\$5 gives the greatest profit." },
          { step: 4, ask: "Should you trust the model's prediction for a price of \\$20?", type: "choice", answer: 0,
            options: [{ t: "No. \\$20 is far outside the prices in the data" }, { t: "Yes", fb: "No price near \\$20 was ever measured. The model gives $-200$ there." }],
            m: "1 \\le x \\le 9", say: "The model was built from prices of \\$1 to \\$9." }],
        why: "Shape, fit, predict, trust. Now use the ball's model." },
      { type: "num", kicker: "On your own", prompt: "In standard form the model is $y = -x^2 + 6x$. Use it to predict the height at **2.5** seconds.", post: "m", answer: 8.75, skill: "Quadratic models",
        near: [{ v: 21.25, fb: "$-x^2$ means $-(2.5)^2 = -6.25$. Subtract it." }, { v: 10, fb: "$2.5^2 = 6.25$, not 5." }], hints: ["$-(2.5)^2 + 6(2.5)$."], why: "$-6.25 + 15 = 8.75$ m." },
      { type: "num", prompt: "A reading is missing from another data set that follows $y = -x^2 + 6x$. What should $y$ be at $x = 4$?", answer: 8, skill: "Quadratic models",
        near: [{ v: 40, fb: "$-x^2 = -16$: it's subtracted." }], hints: ["$-16 + 24$."], why: "$-16 + 24 = 8$." },
      { type: "learn", kicker: "A harder case",
        prompt: "What does the ball's model say about a time **after** it has landed?",
        scene: { type: "walk", how: HOW_8_12, rows: [
          { step: 2, m: "y = -x^2 + 6x", say: "The model." },
          { step: 3, m: "-(8)^2 + 6(8) = -16", say: "Predict the height at 8 seconds: minus 16 metres." },
          { step: 4, m: "x > 6", say: "The ball landed at 6 seconds. Past the data, the model describes nothing real." }] },
        gate: true },
      { type: "choice", kicker: "Try it", prompt: "The model predicts $y = -7$ at $x = 7$ seconds. What should you conclude?",
        options: [{ t: "The ball has already landed. The model only applies while it is in the air." }, { t: "The ball is 7 m underground.", fb: "The ground stops it. The model describes the flight, not what happens after." }, { t: "The model is useless.", fb: "It fits well between 0 and 6 seconds, where the data is." }],
        answer: 0, skill: "Quadratic models", hints: ["When does the model reach height 0?"], why: "The model's zeros are 0 and 6: the flight lasts 6 seconds. Outside that, it means nothing." },
      { type: "choice", kicker: "Find the error",
        prompt: "Kiran's data rises and then falls. He fits a **line** to it and uses the line to predict. What is wrong?",
        options: [{ t: "A line cannot turn round. Data that rises and falls needs a quadratic model." },
                  { t: "He should use an exponential model.", fb: "An exponential keeps rising, or keeps falling. It does not turn either." },
                  { t: "Nothing. A line fits any data.", fb: "A line fits data with a steady trend. This data changes direction." }],
        answer: 0, skill: "Quadratic models", hints: ["Step 1: what is the shape of the data?"],
        why: "A line goes one way only. A parabola rises and falls, like the data." },
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
  /* ===================================================== Concept builders */
  L.addConcepts("alg:8", {
    2: { name: "Quadratic equation", frame: "An equation that can be written $ax^2 + bx + c = 0$ is a [[quadratic equation]]. Solving it finds the [[input]] that gives an output, and a solution must also make [[sense]] in the situation.",
         chips: ["output", "linear equation"] },
    3: { name: "Writing the equation", frame: "To find when a quantity reaches a value, set its expression [[equal]] to that value, then move everything to one side so that it equals [[zero]].",
         chips: ["one", "greater"] },
    4: { name: "Square roots", frame: "If $x^2 = k$ with $k$ positive, then $x$ is [[$\\pm\\sqrt{k}$]]: two solutions. If $k = 0$ there is one; if $k$ is [[negative]], there are none.",
         chips: ["$\\sqrt{k}$", "positive"], fb: { "$\\sqrt{k}$": "That's only one of them. $(-3)^2$ is 9 as well." } },
    5: { name: "Zero product property", frame: "If $a \\cdot b = 0$, then $a = 0$ [[or]] $b = 0$. It only works when the product equals [[zero]].",
         chips: ["and", "six"], fb: { "and": "Only one of them needs to be zero." } },
    6: { name: "How many solutions", frame: "A quadratic equation has [[two]], one or no real solutions: the graph [[crosses]] the axis twice, touches it, or misses it. Never [[divide]] by a variable that might be zero.",
          chips: ["three", "multiply"] },
    7: { name: "Sum and product", frame: "$(x + p)(x + q) = x^2 + (p + q)x + pq$: the two numbers' [[sum]] is $b$ and their [[product]] is $c$.",
         chips: ["difference", "quotient"] },
    8: { name: "Negative constants", at: 3, frame: "If $c$ is negative, the two numbers have [[opposite]] signs, and the [[larger]] one has the sign of $b$.",
         chips: ["the same", "smaller"] },
    9: { name: "Difference of squares", frame: "A sum times its matching difference: $(a + b)(a - b) =$ [[$a^2 - b^2$]]. Read backwards, it factors a [[difference of two squares]].",
         chips: ["$a^2 + b^2$", "sum of two squares"] },
    10: { name: "Solve by factoring", at: 2, frame: "Get [[zero]] on one side, [[factor]], set each factor equal to zero, and [[check]] the solutions.",
          chips: ["one", "divide"] },
    11: { name: "The ac method", frame: "To factor $ax^2 + bx + c$, find two numbers that multiply to [[$a \\cdot c$]] and add to [[$b$]], split the middle term, then [[group]].",
          chips: ["$c$", "$a$"] },
    12: { name: "From zeros to equation", frame: "A quadratic with zeros $m$ and $n$ is $f(x) = a(x - m)(x - n)$. The zeros don't fix [[$a$]]; one more [[point]] does.",
          chips: ["$m$", "zero"] },
    13: { name: "Quadratic regression", frame: "Quadratic [[regression]] finds the parabola of best fit, as linear regression finds the best [[line]]. Its predictions only hold [[inside]] the data's range.",
          chips: ["outside", "curve"] }
  });
})();
