/* ==========================================================================
   Algebra I — Unit 3: Two-variable statistics. See lab/core.js for the format.

   Follows OpenStax Algebra 1, Unit 3, lesson for lesson — the readiness check, 3.1 to 3.6 and
   Project 3. Written to the recipe in docs/OEDU_BRILLIANT_CONCEPT.md and the
   five rules at the top of alg/u02.js: teach, learn by doing, super
   interactive, nothing clumsy, never too much.

   The unit's manipulatives are all one plane: a cloud of dots, a line you
   drag through it while its misses are drawn and summed, and six dots you
   push around until r says what you want it to.

   Adapted from OpenStax, Algebra 1 (Rice University), CC BY-NC-SA 4.0. The
   data, questions, figures and feedback here are OEdu's own.

   Eight lessons, eight skills, two quizzes, and the unit test.
   Standards: CCSS HSS.ID.B.6, HSS.ID.C.7–9.
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
    blurb: "Book: Unit 3 Readiness · Spot a linear pattern, read a trend, and say what a slope and an intercept mean.",
    mins: 6, v: 2,
    steps: [
      { type: "choice", kicker: "Check 1 · Patterns", prompt: "Do these points follow a straight-line pattern?",
        scene: { type: "plane", x: [0, 8], y: [0, 10], marks: [[1, 9], [2, 4.5], [3, 2.3], [4, 1.3], [5, 0.8], [6, 0.5], [7, 0.4]].map(function (p) { return { x: p[0], y: p[1], color: "ink", r: 5 }; }) },
        options: [{ t: "No: they curve, falling fast and then levelling off." }, { t: "Yes: they all go down.", fb: "Going down isn't enough. A linear pattern goes down by about the same amount each step; these drops shrink." }],
        answer: 0, keep: true, skill: "Linear or nonlinear", hints: ["Would a ruler lie along them?"], why: "The drops get smaller and smaller, so the points bend. That's a nonlinear pattern." },
      { type: "sort", kicker: "Check 2 · Trends", prompt: "Positive trend, negative trend, or no trend?",
        bins: ["Positive", "Negative", "No trend"],
        cards: [{ t: "Hours of practice, and goals scored", bin: 0, fb: "More practice tends to go with more goals." }, { t: "Age of a phone, and its battery life", bin: 1, fb: "Older phones tend to last less long." },
                { t: "Birthday month, and height", bin: 2, fb: "There's no reason for these to be linked." }, { t: "Temperature, and coats sold", bin: 1, fb: "Warmer days, fewer coats." }],
        skill: "Positive and negative trends", hints: ["As the first goes up, what does the second tend to do?"], why: "Both rise together: positive. One rises as the other falls: negative. No pattern: no trend." },
      { type: "choice", prompt: "Which way does this scatter plot trend?",
        scene: { type: "plane", x: [0, 10], y: [0, 10], marks: [[1, 8.5], [2, 8], [3, 7.2], [4, 6], [5, 5.5], [6, 4.1], [7, 3.8], [8, 2.6], [9, 2]].map(function (p) { return { x: p[0], y: p[1], color: "ink", r: 5 }; }) },
        options: [{ t: "Negative" }, { t: "Positive", fb: "Read left to right: the dots get lower." }, { t: "No trend", fb: "The dots line up clearly along a falling path." }],
        answer: 0, keep: true, skill: "Positive and negative trends", hints: ["Left to right: up or down?"], why: "As $x$ grows, $y$ falls: a negative trend." },
      { type: "choice", kicker: "Check 3 · Slope and intercept", prompt: "A plumber charges $C = 45h + 60$ dollars for $h$ hours. What does the **45** mean?",
        options: [{ t: "Each hour of work costs \\$45." }, { t: "The call-out fee is \\$45.", fb: "The fee is charged once, even at $h = 0$: that's the 60." }, { t: "A job takes 45 hours.", fb: "45 multiplies the hours: it is a rate, dollars per hour." }],
        answer: 0, skill: "Interpret slope and intercept", hints: ["The slope is what's added for each extra hour."], why: "45 is the slope: \\$45 for each extra hour." },
      { type: "choice", prompt: "And the **60**?",
        options: [{ t: "The cost before any work is done: a \\$60 call-out fee." }, { t: "The cost per hour.", fb: "That's the 45." }, { t: "The most the plumber charges.", fb: "The bill grows with every hour. 60 is where it starts." }],
        answer: 0, skill: "Interpret slope and intercept", hints: ["Put $h = 0$."], why: "At $h = 0$, $C = 60$: the intercept is the starting value." },
      { type: "learn", kicker: "So, where to start?",
        prompt: "All right first time? Go straight to **Lesson 3.1**. If **check 3** slipped, Unit 1's lessons 1.10 and 1.11 are about exactly that: what slope and intercept mean in a situation. Checks 1 and 2 come up again in 3.1 and 3.4, so you'll meet them with support.",
        after: "Nothing is locked. Open any lesson whenever you like." }
    ]
  });
  // Pearson's r for a list of [x, y] pairs.
  function corr(pts) {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; syy += p[1] * p[1]; sxy += p[0] * p[1]; });
    var d = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
    return d ? (n * sxy - sx * sy) / d : 0;
  }
  // Data as fixed dots on a plane.
  function dots(data, color) { return data.map(function (p) { return { x: p[0], y: p[1], color: color || "ink", r: 5 }; }); }
  // The line through two dragged points, as { m, b } (null when vertical).
  function lineOf(st) { var a = st.pt("A"), b = st.pt("B"); if (a.x === b.x) return null; var m = (b.y - a.y) / (b.x - a.x); return { m: m, b: a.y - m * a.x }; }
  var CARS = [[1, 18.4], [2, 17.3], [3, 15.2], [4, 14.5], [5, 12], [6, 11.4], [8, 7.6], [9, 6.8]];
  var FIT = [[1, 3], [2, 6], [3, 6], [4, 9], [5, 10], [6, 13], [7, 13], [8, 17]];
  var RES = [[1, 4], [2, 4], [3, 8], [4, 9], [5, 10], [6, 15]];
  function ssr(st, data) { var l = lineOf(st); if (!l) return Infinity; return data.reduce(function (s, p) { var e = p[1] - (l.m * p[0] + l.b); return s + e * e; }, 0); }
  var SIX = ["A", "B", "C", "D", "E", "F"];
  function rOf(st) { return corr(SIX.map(function (id) { var p = st.pt(id); return [p.x, p.y]; })); }
  function sixPts(list) { return list.map(function (p, i) { return { id: SIX[i], x: p[0], y: p[1], drag: true, coords: false, color: "blue" }; }); }
  function sixAns(list) { var o = {}; list.forEach(function (p, i) { o[SIX[i]] = p; }); return { points: o }; }

  /* ============================================ 3.1 · Linear models */
  LESSONS.push({
    title: "Linear models",
    blurb: "Book 3.1 · A scatter plot shows a trend. A line can describe it, and its slope and intercept mean something.",
    mins: 8, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "Each dot is one used car: its **age** in years and its **price** in thousands of dollars. What is the trend?",
        scene: { type: "plane", x: [0, 12], y: [0, 22], axisLabels: ["age", "price"], marks: dots(CARS) },
        options: [{ t: "Older cars tend to cost less." },
                  { t: "Older cars tend to cost more.", fb: "Follow the dots from left to right: they fall." },
                  { t: "Age and price are unrelated.", fb: "The dots aren't scattered everywhere. They follow a clear downward path." }],
        answer: 0, skill: "Scatter plots", hints: ["Read left to right: what happens to the height of the dots?"],
        why: "This is a **scatter plot**: one dot for each pair of measurements. Here the dots fall as age rises." },
      { type: "plane", kicker: "See it", prompt: "Drag $A$ and $B$ so the line **follows the dots** as closely as you can.",
        x: [0, 12], y: [0, 22], axisLabels: ["age", "price"], marks: dots(CARS),
        points: [{ id: "A", x: 1, y: 6, drag: true, snap: 0.5, label: "A", coords: false }, { id: "B", x: 9, y: 12, drag: true, snap: 0.5, label: "B", coords: false }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        readout: function (st) { var l = lineOf(st); return l ? "Your line: $y = " + poly([[r2(l.m), "x"], [r2(l.b), ""]]) + "$" : ""; },
        check: function (st) { var l = lineOf(st); return l && l.m <= -1.1 && l.m >= -2.1 && l.b >= 18 && l.b <= 22.5 ? { ok: true } : { ok: false, say: !l || l.m >= 0 ? "The dots go downhill, so the line should too." : "Closer. Aim for about as many dots above the line as below it." }; },
        answer: { points: { A: [0, 20], B: [10, 5] } }, skill: "Linear models",
        hints: ["Start near $(0, 20)$ and pass through the middle of the dots."],
        why: "A line such as $y = -1.5x + 20$ runs through the middle of the cloud. Few dots sit exactly on it, and that's fine." },
      { type: "learn", kicker: "Name it",
        prompt: "A line that describes the trend in data is a **linear model**. It doesn't pass through every point. It summarises them, so you can **predict**.<br><br>For the cars: $y = -1.5x + 20$, where $x$ is age in years and $y$ is price in thousands of dollars." },
      { type: "num", prompt: "Use the model $y = -1.5x + 20$ to predict the price of a **6-year-old** car, in thousands of dollars.",
        answer: 11, skill: "Use a model", post: "thousand",
        near: [{ v: 29, fb: "The slope is negative: $-1.5(6) = -9$." }, { v: 9, fb: "That's the drop. Subtract it from 20." }],
        hints: ["Put $x = 6$ into the model."], why: "$-1.5(6) + 20 = 11$: about \\$11,000. (The real 6-year-old car in the data cost \\$11,400.)" },
      { type: "choice", kicker: "Vary it", prompt: "In $y = -1.5x + 20$, what does the **slope**, $-1.5$, mean?",
        options: [{ t: "Each extra year of age lowers the price by about \\$1,500." },
                  { t: "A new car costs \\$1,500.", fb: "The price at age 0 is the intercept, 20, not the slope." },
                  { t: "The car loses 1.5% of its value a year.", fb: "The units are thousands of dollars per year, not percent." }],
        answer: 0, skill: "Interpret slope and intercept", hints: ["Slope is the change in $y$ for each 1 added to $x$."],
        why: "Slope $= -1.5$ thousand dollars per year: the model's rate of change." },
      { type: "choice", prompt: "And the **vertical intercept**, 20?",
        options: [{ t: "The model's price for a brand-new car: about \\$20,000." },
                  { t: "The age at which the car is worth nothing.", fb: "That would be where $y = 0$. The intercept is where $x = 0$." },
                  { t: "The number of cars in the data.", fb: "It's a price: the value of $y$ when $x = 0$." }],
        answer: 0, skill: "Interpret slope and intercept", hints: ["The intercept is the value of $y$ when $x = 0$."],
        why: "At age 0, $y = 20$: about \\$20,000." },
      { type: "choice", kicker: "Use it", prompt: "The model predicts $y = -1$ for a 14-year-old car: a price of **minus** \\$1,000. What should you conclude?",
        options: [{ t: "The model only works near the ages in the data." },
                  { t: "Old cars are given away with \\$1,000.", fb: "A negative price makes no sense. The model has been pushed too far." },
                  { t: "The model is wrong for every car.", fb: "It fits well for ages 1 to 9, where the data is." }],
        answer: 0, skill: "Use a model", hints: ["The data covered cars from 1 to 9 years old."],
        why: "A model is trustworthy inside the range of its data. Far outside it, the trend may not continue." }
    ]
  });

  /* ============================================ 3.2 · Fitting lines */
  LESSONS.push({
    title: "Fitting lines",
    blurb: "Book 3.2 · The best line is the one whose misses are smallest.",
    mins: 8, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "Three lines, one set of data. Which line fits best?",
        scene: { type: "plane", x: [0, 10], y: [0, 20], marks: dots(FIT),
          fns: [{ f: "3*x - 4", color: "green", label: "A", labelAt: 7.4 }, { f: "1.85*x + 1.3", color: "blue", label: "B", labelAt: 9.2 }, { f: "0.5*x + 7", color: "orange", label: "C", labelAt: 9.2 }] },
        options: [{ t: "Line B" }, { t: "Line A", fb: "A is too steep: it runs below the early dots and above the late ones." }, { t: "Line C", fb: "C is too flat: the dots climb much faster than it does." }],
        answer: 0, keep: true, skill: "Fit a line", hints: ["Which line stays close to all the dots?"],
        why: "B goes through the middle of the dots along their whole length." },
      { type: "learn", kicker: "See it", prompt: "Each orange bar is a **miss**: how far a dot is from your line. Drag $A$ and $B$ to make the total as small as you can.",
        scene: { type: "plane", x: [0, 10], y: [0, 20], gate: true, marks: dots(FIT),
          points: [{ id: "A", x: 0, y: 6, drag: true, snap: 0.5, label: "A", coords: false }, { id: "B", x: 8, y: 8, drag: true, snap: 0.5, label: "B", coords: false }],
          lines: [{ through: ["A", "B"], color: "blue" }],
          segs: function (st) { var l = lineOf(st); return l ? FIT.map(function (p) { return [p[0], p[1], p[0], l.m * p[0] + l.b, "orange"]; }) : []; },
          readout: function (st) { var s = ssr(st, FIT); return "Sum of squared misses: **" + (isFinite(s) ? r2(s) : "—") + "**" + (s <= 7 ? " ✓ excellent" : s <= 15 ? " — close" : ""); },
          goal: function (st) { return ssr(st, FIT) <= 7; } },
        gate: true,
        then: "You just did by hand what a calculator does exactly. The **line of best fit** is the line that makes the sum of the squared misses as small as possible. Technology finds it for you: here, about $y = 1.85x + 1.3$." },
      { type: "sort", kicker: "Name it", prompt: "Is the line a good fit?",
        bins: ["Good fit", "Poor fit"],
        cards: [{ t: "Dots sit close to the line, some above and some below", bin: 0, fb: "Small misses, balanced on both sides: a good fit." },
                { t: "Every dot is above the line", bin: 1, fb: "The line is too low. A good line has dots on both sides." },
                { t: "The dots curve away from the line at both ends", bin: 1, fb: "The data bends. A straight line is the wrong shape for it." },
                { t: "The line follows the dots along their whole length", bin: 0, fb: "That's what a model should do." }],
        skill: "Fit a line", hints: ["A good line is close to the dots, with dots on both sides."],
        why: "Good fit: small misses, balanced above and below, the same shape as the data." },
      { type: "equation", kicker: "Vary it", prompt: "No technology? Draw a line by eye and use two points on it. A fitted line passes through $(2, 7)$ and $(6, 15)$. Write its equation.",
        answer: "y=2x+3", shown: "y = 2x + 3", skill: "Write a linear model",
        near: [{ v: "y=2x", fb: "The slope is right. Now find the intercept: at $x = 2$, $y$ must be 7." }, { v: "y=0.5x+6", fb: "Slope is rise over run: $8 \\div 4$, not $4 \\div 8$." }],
        hints: ["Slope: $\\frac{15 - 7}{6 - 2}$.", "Then $7 = 2(2) + b$."], why: "Slope $\\frac{8}{4} = 2$. Then $7 = 4 + b$ gives $b = 3$: $y = 2x + 3$." },
      { type: "num", prompt: "Use $y = 2x + 3$ to predict $y$ when $x = 10$.", answer: 23, skill: "Use a model",
        hints: ["$2(10) + 3$."], why: "$2(10) + 3 = 23$." },
      { type: "choice", kicker: "Use it", prompt: "Two best-fit lines. For data set P, the dots hug the line. For data set Q, they are spread widely around it. Whose predictions would you trust more?",
        options: [{ t: "P: the data follows its line closely." }, { t: "Q: it has more variety.", fb: "Wide scatter means large misses, so predictions from the line are rough." }, { t: "Both equally.", fb: "A best-fit line always exists. How well it fits is a separate question." }],
        answer: 0, skill: "Fit a line", hints: ["Small misses mean accurate predictions."],
        why: "Every data set has a best-fit line, but the line is only useful when the data is close to it. The next lessons measure that." }
    ]
  });

  /* ============================================ 3.3 · Residuals */
  LESSONS.push({
    title: "Residuals",
    blurb: "Book 3.3 · A residual is how far the real value is from the prediction. Their pattern tells you if a line is the right model.",
    mins: 8, v: 2,
    steps: [
      { type: "num", kicker: "Try it", prompt: "A model predicts a 6-year-old car costs **\\$11,000**. A real one sold for **\\$11,400**. How far off was the prediction? (actual − predicted)",
        pre: "$\\$$", answer: 400, skill: "Residuals",
        near: [{ v: -400, fb: "Take actual minus predicted: $11400 - 11000$." }],
        hints: ["Subtract the prediction from the real price."], why: "$11400 - 11000 = 400$. The real car cost \\$400 more than predicted." },
      { type: "learn", kicker: "Name it",
        prompt: "That difference is a **residual**:$$\\text{residual} = \\text{actual} - \\text{predicted}$$A point **above** the line has a positive residual. A point **below** it has a negative one. A point on the line has residual 0." },
      { type: "table", prompt: "The model is $y = 2x + 1$. Fill in each prediction and residual.",
        head: ["$x$", "actual $y$", "predicted", "residual"], rows: [[1, 4, 3, 1], [2, 4, null, null], [3, 8, null, null], [6, 15, null, null]],
        answers: [[1, 2, 5], [1, 3, -1], [2, 2, 7], [2, 3, 1], [3, 2, 13], [3, 3, 2]], skill: "Residuals",
        hints: ["Predicted: put $x$ into $2x + 1$.", "Residual: actual minus predicted."], why: "$x = 2$: predicted 5, residual $4 - 5 = -1$. $x = 3$: 7, $+1$. $x = 6$: 13, $+2$." },
      { type: "plane", kicker: "See it", prompt: "Here is that data with the line $y = 2x + 1$. The orange bars are the residuals. **Click the point with the largest residual.**",
        x: [0, 8], y: [0, 16], click: "point", answer: { point: [6, 15] }, skill: "Residuals",
        fns: [{ f: "2*x + 1", color: "blue" }], marks: dots(RES),
        segs: RES.map(function (p) { return [p[0], p[1], p[0], 2 * p[0] + 1, "orange"]; }),
        clickFb: function (c) { var hit = RES.filter(function (p) { return p[0] === c[0] && p[1] === c[1]; })[0]; return hit ? "That point's residual is $" + nm(hit[1] - (2 * hit[0] + 1)) + "$. One of the others is further from the line." : "Click one of the data points."; },
        hints: ["Look for the longest orange bar."], why: "$(6, 15)$: predicted 13, residual $+2$, the longest bar." },
      { type: "choice", kicker: "Vary it", prompt: "A **residual plot** graphs each residual against $x$. This one is from a different model. What does it tell you?",
        scene: { type: "plane", x: [0, 8], y: [-3, 3], axisLabels: ["x", "residual"], marks: dots([[1, 0.6], [2, -0.9], [3, 0.4], [4, -0.2], [5, 0.8], [6, -0.7], [7, 0.3]], "orange") },
        options: [{ t: "A line is a reasonable model: the residuals are small and show no pattern." },
                  { t: "The model is wrong: the residuals aren't all zero.", fb: "Real data never sits exactly on a line. Small, patternless residuals are what a good fit looks like." },
                  { t: "The data is decreasing.", fb: "This plot shows the *misses*, not the data. They hover around 0." }],
        answer: 0, skill: "Residual plots", hints: ["Are the dots randomly above and below 0?"],
        why: "Residuals scattered randomly around 0 mean the line has captured the trend." },
      { type: "choice", prompt: "And this residual plot?",
        scene: { type: "plane", x: [0, 8], y: [-3, 3], axisLabels: ["x", "residual"], marks: dots([[1, 2], [2, 0.5], [3, -1], [4, -1.5], [5, -1], [6, 0.5], [7, 2]], "orange") },
        options: [{ t: "A line is the wrong model: the residuals form a curve." },
                  { t: "A line fits well.", fb: "Positive, then negative, then positive again: that's a pattern. The data is bending away from the line." },
                  { t: "There is no relationship.", fb: "There's a clear relationship. It just isn't a straight one." }],
        answer: 0, skill: "Residual plots", hints: ["Do the residuals look random, or do they make a shape?"],
        why: "A U-shape in the residuals means the data curves. A straight line is not appropriate." },
      { type: "num", kicker: "Use it", prompt: "A model predicts a test score of **72**. The residual is **−5**. What was the actual score?", answer: 67, skill: "Residuals",
        near: [{ v: 77, fb: "A negative residual means the actual value is *below* the prediction." }],
        hints: ["actual − 72 = −5."], why: "Actual $= 72 + (-5) = 67$." }
    ]
  });

  /* ============================================ 3.4 · The correlation coefficient */
  LESSONS.push({
    title: "The correlation coefficient",
    blurb: "Book 3.4 · One number, r, for how closely data follows a line, and which way.",
    mins: 9, v: 2,
    steps: [
      { type: "learn", kicker: "Try it", prompt: "The number $r$ measures something about these six dots. Drag them and work out what. Can you push $r$ **above 0.95**?",
        scene: { type: "plane", x: [0, 8], y: [0, 8], gate: true, points: sixPts([[1, 5], [2, 2], [3, 6], [5, 3], [6, 7], [7, 2]]),
          readout: function (st) { return "$r = " + rOf(st).toFixed(2) + "$"; }, goal: function (st) { return rOf(st) > 0.95; } },
        gate: true,
        then: "$r$ climbs toward 1 as the dots line up along a **rising** line. $r$ is the **correlation coefficient**." },
      { type: "plane", prompt: "Now arrange the dots so that $r$ is **below −0.95**.",
        x: [0, 8], y: [0, 8], points: sixPts([[1, 2], [2, 3], [3, 3], [5, 5], [6, 6], [7, 6]]),
        readout: function (st) { return "$r = " + rOf(st).toFixed(2) + "$"; },
        check: function (st) { var r = rOf(st); return r < -0.95 ? { ok: true } : { ok: false, say: r > 0 ? "$r$ is positive when the dots rise. What kind of line gives a negative $r$?" : "The direction is right. Now bring the dots closer to one straight line." }; },
        answer: sixAns([[1, 7], [2, 6], [3, 5], [5, 3], [6, 2], [7, 1]]), skill: "Correlation coefficient",
        hints: ["Line the dots up along a falling line."], why: "Dots close to a **falling** line give $r$ near $-1$." },
      { type: "plane", prompt: "Last one: make $r$ **close to 0** (between −0.1 and 0.1).",
        x: [0, 8], y: [0, 8], points: sixPts([[1, 1], [2, 2], [3, 3], [5, 5], [6, 6], [7, 7]]),
        readout: function (st) { return "$r = " + rOf(st).toFixed(2) + "$"; },
        check: function (st) { var r = rOf(st); return Math.abs(r) <= 0.1 ? { ok: true } : { ok: false, say: "$r = " + r.toFixed(2) + "$. Break the trend: make the dots neither rise nor fall overall." }; },
        answer: sixAns([[1, 2], [2, 6], [3, 2], [5, 2], [6, 6], [7, 2]]), skill: "Correlation coefficient",
        hints: ["Scatter them so there's no overall up or down."], why: "With no overall rise or fall, $r$ is near 0: no linear relationship." },
      { type: "learn", kicker: "Name it",
        prompt: "The **correlation coefficient** $r$ is always between $-1$ and $1$.<br><br>**Sign:** positive when $y$ tends to rise with $x$, negative when it tends to fall.<br>**Size:** close to 1 or $-1$ means a strong linear relationship. Close to 0 means a weak one, or none." },
      { type: "slots", kicker: "Vary it", prompt: "Match each value of $r$ to its description.",
        slots: [{ id: "a", label: "Strong, positive" }, { id: "b", label: "Strong, negative" }, { id: "c", label: "Weak, positive" }, { id: "d", label: "Almost no linear relationship" }],
        cards: [{ t: "$r = 0.97$", slot: "a", fb: "Close to 1: strong and rising." }, { t: "$r = -0.94$", slot: "b", fb: "Close to $-1$: strong and falling." },
                { t: "$r = 0.35$", slot: "c", fb: "Positive, but far from 1: weak." }, { t: "$r = -0.08$", slot: "d", fb: "Very close to 0." }],
        skill: "Correlation coefficient", hints: ["Sign gives direction. Distance from 0 gives strength."],
        why: "Read the sign first, then how close the number is to 1 or $-1$." },
      { type: "choice", prompt: "For this data, $r = 0$. Does that mean $x$ and $y$ are unrelated?",
        scene: { type: "plane", x: [0, 8], y: [0, 8], marks: dots([[1, 7], [2, 4], [3, 2.5], [4, 2], [5, 2.5], [6, 4], [7, 7]]) },
        options: [{ t: "No. They are clearly related, just not by a line." },
                  { t: "Yes. $r = 0$ means no relationship.", fb: "Look at the dots: they follow a perfect curve. $r$ only measures *linear* relationships." },
                  { t: "The calculation must be wrong.", fb: "It's right. The falling half and the rising half cancel out." }],
        answer: 0, skill: "Correlation coefficient", hints: ["Do the dots follow a pattern?"],
        why: "$r$ measures how well a **line** fits. A strong curved relationship can still have $r$ near 0. Always look at the scatter plot." },
      { type: "choice", kicker: "Use it", prompt: "Which of these cannot be a correlation coefficient?",
        options: [{ t: "$r = 1.3$" }, { t: "$r = -1$", fb: "$-1$ is possible: every point exactly on a falling line." }, { t: "$r = 0$", fb: "0 is possible: no linear relationship." }, { t: "$r = 0.5$", fb: "A moderate positive relationship." }],
        answer: 0, skill: "Correlation coefficient", hints: ["What is the range of $r$?"], why: "$r$ is always between $-1$ and $1$." }
    ]
  });

  /* ============================================ 3.5 · Using the correlation coefficient */
  LESSONS.push({
    title: "Using the correlation coefficient",
    blurb: "Book 3.5 · Say what r means in a situation: direction, strength, and what it's about.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "For a basketball team, **hours of practice** and **free throws made** have $r = 0.89$. What does that say?",
        options: [{ t: "Players who practise more tend to make more free throws, and the link is strong." },
                  { t: "89% of free throws go in.", fb: "$r$ isn't a percentage of shots. It measures how closely two variables follow a line." },
                  { t: "Practice has little to do with free throws.", fb: "0.89 is close to 1: a strong relationship." }],
        answer: 0, skill: "Interpret r", hints: ["Positive: they rise together. Near 1: strongly."],
        why: "Positive and close to 1: a strong positive linear relationship." },
      { type: "choice", prompt: "**Outdoor temperature** and **hot chocolate sales** have $r = -0.92$. What does that say?",
        options: [{ t: "As the temperature rises, sales tend to fall, and the link is strong." },
                  { t: "The relationship is weak, because $r$ is negative.", fb: "The sign gives the direction, not the strength. $-0.92$ is strong." },
                  { t: "As the temperature rises, sales rise.", fb: "A negative $r$ means one goes up as the other goes down." }],
        answer: 0, skill: "Interpret r", hints: ["Negative: opposite directions. Near $-1$: strongly."],
        why: "Negative and close to $-1$: a strong negative linear relationship." },
      { type: "sort", kicker: "Vary it", prompt: "What sign would you expect $r$ to have?",
        bins: ["Positive", "Negative", "Near zero"],
        cards: [{ t: "A person's height and shoe size", bin: 0, fb: "Taller people tend to have bigger feet." },
                { t: "A car's age and its price", bin: 1, fb: "Older cars tend to cost less." },
                { t: "Shoe size and maths score (adults)", bin: 2, fb: "There's no reason for either to follow the other." },
                { t: "Weekly exercise and resting heart rate", bin: 1, fb: "More exercise tends to go with a lower resting heart rate." },
                { t: "Distance driven and fuel used", bin: 0, fb: "More distance, more fuel." }],
        skill: "Interpret r", hints: ["Do they tend to rise together, move oppositely, or neither?"],
        why: "Think about the situation first. The data should then confirm it." },
      { type: "order", prompt: "Order these from the **weakest** linear relationship to the **strongest**.",
        items: ["$r = 0.12$", "$r = -0.45$", "$r = 0.71$", "$r = -0.93$"], skill: "Interpret r",
        why: "Strength is the distance from 0, whatever the sign: 0.12, 0.45, 0.71, 0.93." },
      { type: "learn", kicker: "Name it",
        prompt: "To describe a relationship using $r$, say three things:<br><br>**1. Direction:** positive or negative.<br>**2. Strength:** strong, moderate or weak.<br>**3. Context:** what the two variables are, in words." },
      { type: "choice", kicker: "Use it", prompt: "Two linear models predict exam scores. Model A is built on data with $r = 0.98$. Model B is built on data with $r = 0.41$. Which gives more reliable predictions?",
        options: [{ t: "Model A" }, { t: "Model B", fb: "0.41 is a weak relationship: the points are widely scattered around the line." }, { t: "They are equally reliable.", fb: "The closer $r$ is to 1 or $-1$, the closer the data is to its line." }],
        answer: 0, keep: true, skill: "Interpret r", hints: ["Which data sits closer to its line?"],
        why: "With $r = 0.98$ the data hugs the line, so the line's predictions miss by little." },
      { type: "explain", kicker: "Make it yours",
        prompt: "Name two things you could measure about your own week that you think are **negatively** correlated. Say why, and whether you'd expect the relationship to be strong or weak.",
        placeholder: "e.g. hours of gaming and hours of sleep on a school night…",
        model: "A good answer names two measurable quantities, explains why one tends to go down as the other goes up, and makes a judgement about strength: “Hours of screen time and hours of sleep: more of one leaves less time for the other. Probably moderate, since other things affect sleep too.”" }
    ]
  });

  /* ============================================ 3.6 · Causal relationships */
  LESSONS.push({
    title: "Causal relationships",
    blurb: "Book 3.6 · Two things can move together without one causing the other.",
    mins: 7, v: 2,
    steps: [
      { type: "choice", kicker: "Try it", prompt: "In one beach town, **ice cream sales** and **sunburn cases** rise and fall together ($r = 0.8$). Does eating ice cream cause sunburn?",
        options: [{ t: "No. Sunny days cause both." },
                  { t: "Yes. $r = 0.8$ is strong.", fb: "A strong correlation shows they move together. It doesn't say why." },
                  { t: "Yes, but only a little.", fb: "Banning ice cream would not prevent a single sunburn." }],
        answer: 0, skill: "Correlation and causation", hints: ["What else changes on days when ice cream sells well?"],
        why: "Sunshine drives both. The two are correlated, but neither causes the other." },
      { type: "learn", kicker: "Name it",
        prompt: "In a **causal relationship**, a change in one variable *brings about* a change in the other.<br><br>Correlation alone never proves it. A third, hidden variable may be moving both. **Correlation is not causation.**" },
      { type: "sort", prompt: "Is the relationship causal?",
        bins: ["Causal", "Correlated, not causal"],
        cards: [{ t: "Minutes a kettle is on, and the water's temperature", bin: 0, fb: "Heating the water is what raises its temperature." },
                { t: "Firefighters at a fire, and the damage done", bin: 1, fb: "Bigger fires bring more firefighters *and* more damage." },
                { t: "Hours worked at an hourly wage, and pay", bin: 0, fb: "Working more hours directly produces more pay." },
                { t: "Children's shoe size, and reading level", bin: 1, fb: "Older children have bigger feet and read better. Age drives both." },
                { t: "Umbrella sales, and traffic accidents", bin: 1, fb: "Rain raises both." }],
        skill: "Correlation and causation", hints: ["Ask: does changing one actually change the other? Or is something else behind both?"],
        why: "Look for a mechanism. If a third variable explains both, the link isn't causal." },
      { type: "choice", kicker: "Vary it", prompt: "Children with bigger shoes read better. What is the hidden variable?",
        options: [{ t: "Age" }, { t: "Shoe price", fb: "The price of shoes doesn't change how well a child reads." }, { t: "Height of the bookshelf", fb: "Think about what makes feet grow *and* reading improve." }],
        answer: 0, skill: "Correlation and causation", hints: ["What makes feet bigger?"], why: "As children get older, their feet grow and their reading improves." },
      { type: "choice", prompt: "A company notices that people who use its app more also sleep better. How could it find out whether the app **causes** better sleep?",
        options: [{ t: "Run an experiment: have one random group use the app and another not, and compare." },
                  { t: "Collect more of the same data.", fb: "More data would confirm the correlation, not explain it." },
                  { t: "Calculate $r$ more precisely.", fb: "Even $r = 1$ wouldn't show which variable is causing which." }],
        answer: 0, skill: "Correlation and causation", hints: ["To show cause, change one thing and hold the rest equal."],
        why: "An experiment that changes only one variable is how causation is tested." },
      { type: "multi", kicker: "Use it", prompt: "In a class, **study time** and **test score** have $r = 0.9$. Which statements does that justify?",
        options: [{ t: "Students who studied longer tended to score higher.", ok: true },
                  { t: "The relationship is strong and positive.", ok: true },
                  { t: "Studying longer is guaranteed to raise any student's score.", fb: "A trend across a class is not a guarantee for each person." },
                  { t: "High scores cause students to study more.", fb: "The data can't tell you the direction of cause." }],
        skill: "Correlation and causation", hints: ["Which statements only describe the pattern in the data?"],
        why: "$r$ supports statements about the pattern: direction and strength. Claims about cause need more evidence." },
      { type: "explain", kicker: "Make it yours",
        prompt: "Give your own example of two things that are correlated but where neither causes the other. Name the hidden variable.",
        placeholder: "e.g. sales of sunglasses and sales of sunscreen — both go up when…",
        model: "A good answer names two quantities that move together and the third variable behind both: “Sunglasses sales and sunscreen sales rise together, but neither causes the other. Sunny weather causes both.”" }
    ]
  });

  /* ============================================ Project 3 */
  LESSONS.push({
    title: "Project: Two-variable statistics",
    tag: "Project",
    blurb: "Book Project 3 · Fit a model to real measurements, test it, and say what it means.",
    mins: 10, v: 2,
    steps: [
      { type: "learn", kicker: "The brief",
        prompt: "Eight students measured their **arm span** and their **height**, in centimetres. Your job: fit a model, use it, and judge it." +
          tbl(["arm span", "height"], [[150, 152], [156, 155], [160, 162], [164, 163], [168, 170], [172, 171], [176, 178], [182, 181]]) },
      { type: "plane", prompt: "Drag $A$ and $B$ to fit a line to the data.",
        x: [145, 185], y: [145, 185], grid: 5, labelEvery: 10, labelEveryY: 10, axisLabels: ["arm span", "height"],
        marks: dots([[150, 152], [156, 155], [160, 162], [164, 163], [168, 170], [172, 171], [176, 178], [182, 181]]),
        points: [{ id: "A", x: 150, y: 170, drag: true, snap: 1, label: "A", coords: false }, { id: "B", x: 180, y: 160, drag: true, snap: 1, label: "B", coords: false }],
        lines: [{ through: ["A", "B"], color: "blue" }],
        readout: function (st) { var l = lineOf(st); return l ? "Slope of your line: $" + r2(l.m) + "$" : ""; },
        check: function (st) { var l = lineOf(st); if (!l) return { ok: false, say: "The line can't be vertical." }; var mid = l.m * 166 + l.b; return l.m > 0.75 && l.m < 1.25 && Math.abs(mid - 166.5) < 3 ? { ok: true } : { ok: false, say: l.m <= 0 ? "Longer arms go with taller people: the line should rise." : "Closer. Run the line through the middle of the dots." }; },
        answer: { points: { A: [150, 151], B: [182, 182] } }, skill: "Fit a line",
        hints: ["The dots rise about 1 cm for every 1 cm across."], why: "A line close to $y = x$ fits: height is roughly equal to arm span." },
      { type: "num", prompt: "A model for this data is $y = 0.97x + 5$. Predict the height of someone with an arm span of **170 cm**.",
        answer: 169.9, tol: 0.11, post: "cm", skill: "Use a model",
        hints: ["$0.97 \\times 170 + 5$."], why: "$0.97(170) + 5 = 169.9$ cm." },
      { type: "choice", prompt: "For this data $r = 0.99$. Does a longer arm span **cause** a person to be taller?",
        options: [{ t: "No. Both come from overall body size and growth." },
                  { t: "Yes. $r$ is nearly 1.", fb: "A near-perfect correlation still isn't proof of cause." },
                  { t: "No, because $r$ should be negative.", fb: "They rise together, so $r$ is positive." }],
        answer: 0, skill: "Correlation and causation", hints: ["Would stretching your arms make you taller?"],
        why: "A strong positive correlation, but not a causal one: growth drives both measurements." },
      { type: "explain", kicker: "Make it yours",
        prompt: "Measure your own arm span and height (or estimate them). What does the model $y = 0.97x + 5$ predict for you, and what is your residual?",
        placeholder: "e.g. arm span 162 cm → predicted 162.1 cm; my height is 160 cm, so my residual is −2.1…",
        model: "A good answer substitutes the arm span into the model, then takes actual minus predicted: “Arm span 162 → 0.97(162) + 5 = 162.1. I am 160 cm, so my residual is 160 − 162.1 = −2.1: I'm a little shorter than the model predicts.”" }
    ]
  });
  /* ================================================================ Skills */
  var MODELS = [
    { what: "a seedling's height", y: "cm", x: "week", m: [2, 3, 4], b: [3, 5, 8], up: true },
    { what: "a taxi fare", y: "dollars", x: "mile", m: [2, 3], b: [4, 5, 6], up: true },
    { what: "the water left in a tank", y: "litres", x: "minute", m: [-4, -5, -8], b: [120, 160, 200], up: false },
    { what: "a candle's height", y: "cm", x: "hour", m: [-2, -3], b: [24, 30, 36], up: false },
    { what: "a streaming bill", y: "dollars", x: "film rented", m: [3, 4, 5], b: [8, 10, 12], up: true }
  ];
  function model(R) { var M = R.pick(MODELS), m = R.pick(M.m), b = R.pick(M.b); return { M: M, m: m, b: b, tex: "y = " + poly([[m, "x"], [b, ""]]) }; }

  var SKILLS = [
    { id: "u3-predict", title: "Predict with a linear model", lesson: 2,
      gen: function (R) {
        var o = model(R), x = R.int(2, 9), ans = o.m * x + o.b;
        return { type: "num", prompt: "A model for " + o.M.what + " is $" + o.tex + "$, where $x$ counts each " + o.M.x + " and $y$ is in " + o.M.y + ". Predict $y$ when $x = " + x + "$.",
          answer: ans, near: near(ans, [{ v: o.m * x, fb: "Add the " + o.b + " as well: it's the starting value." }, { v: (o.m + o.b) * x, fb: "Only the " + nm(o.m) + " multiplies $x$." }]),
          hints: ["Put $x = " + x + "$ into the model."], why: "$" + L.sub(poly([[o.m, "x"], [o.b, ""]]), { x: x }) + " = " + ans + "$ " + o.M.y + "." };
      } },
    { id: "u3-slope", title: "Interpret the slope of a model", lesson: 2,
      gen: function (R) {
        var o = model(R), k = Math.abs(o.m), right = "Each extra " + o.M.x + ", " + o.M.what + " " + (o.M.up ? "rises" : "falls") + " by about " + k + " " + o.M.y + ".";
        return mc(R, { prompt: "A model for " + o.M.what + " is $" + o.tex + "$ ($x$: each " + o.M.x + ", $y$: " + o.M.y + "). What does the slope tell you?", right: right,
          wrong: [{ t: "At the start, " + o.M.what + " is " + k + " " + o.M.y + ".", fb: "The starting value is the intercept, " + o.b + "." },
                  { t: "Each extra " + o.M.x + ", " + o.M.what + " " + (o.M.up ? "falls" : "rises") + " by about " + k + " " + o.M.y + ".", fb: "The slope is " + (o.M.up ? "positive: $y$ rises." : "negative: $y$ falls.") },
                  { t: "After " + k + " of them, " + o.M.what + " is zero.", fb: "The slope is a rate of change, not a time." }],
          hints: ["Slope is the change in $y$ when $x$ goes up by 1."], why: "The slope is $" + o.m + "$ " + o.M.y + " per " + o.M.x + "." });
      } },
    { id: "u3-intercept", title: "Interpret the intercept of a model", lesson: 2,
      gen: function (R) {
        var o = model(R);
        return mc(R, { prompt: "A model for " + o.M.what + " is $" + o.tex + "$ ($x$: each " + o.M.x + ", $y$: " + o.M.y + "). What does the number " + o.b + " tell you?",
          right: "When $x = 0$, the model gives " + o.b + " " + o.M.y + ": the starting value.",
          wrong: [{ t: "It is the change for each extra " + o.M.x + ".", fb: "That's the slope, $" + o.m + "$." },
                  { t: "It is the value of $x$ when $y = 0$.", fb: "The intercept is $y$ when $x$ is 0, not the other way round." },
                  { t: "It is the largest value $y$ can take.", fb: (o.M.up ? "$y$ keeps rising past it." : "It is the starting value. It happens to be the largest here only because $y$ falls.") }],
          hints: ["Put $x = 0$ into the model."], why: "$y = " + nm(o.m) + "(0) + " + o.b + " = " + o.b + "$." });
      } },
    { id: "u3-model", title: "Write a linear model from two points", lesson: 3,
      gen: function (R) {
        var m = R.nz(-4, 5), b = R.int(-6, 9), x1 = R.int(1, 4), x2 = x1 + R.int(2, 5), y1 = m * x1 + b, y2 = m * x2 + b;
        return { type: "equation", prompt: "A fitted line passes through $(" + x1 + ", " + y1 + ")$ and $(" + x2 + ", " + y2 + ")$. Write its equation.",
          answer: "y=" + clean(poly([[m, "x"], [b, ""]])), shown: "y = " + poly([[m, "x"], [b, ""]]),
          near: [{ v: "y=" + clean(poly([[m, "x"]])), fb: "The slope is right. Now use one of the points to find the intercept." }],
          hints: ["Slope: $\\frac{" + y2 + " - " + L.sub("a", { a: y1 }) + "}{" + x2 + " - " + x1 + "}$.", "Then put one point into $y = " + nm(m) + "x + b$."],
          why: "Slope $= \\frac{" + (y2 - y1) + "}{" + (x2 - x1) + "} = " + m + "$. Then $" + y1 + " = " + L.sub(poly([[m, "x"]]), { x: x1 }) + " + b$ gives $b = " + b + "$." };
      } },
    { id: "u3-residual", title: "Find a residual", lesson: 4,
      gen: function (R) {
        var m = R.int(2, 5), b = R.int(1, 9), x = R.int(2, 8), pred = m * x + b, res = R.nz(-4, 4), act = pred + res;
        return { type: "num", prompt: "The model is $y = " + m + "x + " + b + "$. A data point is $(" + x + ", " + act + ")$. What is its residual?", answer: res,
          near: [{ v: -res, fb: "Residual is actual minus predicted, in that order." }, { v: pred, fb: "That's the prediction. Now subtract it from the actual value, " + act + "." }],
          hints: ["Predicted: $" + m + "(" + x + ") + " + b + "$.", "Residual = actual − predicted."],
          why: "Predicted $= " + pred + "$. Residual $= " + act + " - " + pred + " = " + res + "$: the point is " + (res > 0 ? "above" : "below") + " the line." };
      } },
    { id: "u3-r-strength", title: "Compare correlation coefficients", lesson: 5,
      gen: function (R) {
        var mags = R.shuffle([R.int(88, 98), R.int(60, 78), R.int(30, 50), R.int(5, 22)]), vals = mags.map(function (v) { return (R.chance(0.5) ? -1 : 1) * v / 100; });
        var best = vals.reduce(function (a, v) { return Math.abs(v) > Math.abs(a) ? v : a; }, 0);
        function t(v) { return "$r = " + v.toFixed(2) + "$"; }
        return mc(R, { prompt: "Which value shows the **strongest** linear relationship?", right: t(best),
          wrong: vals.filter(function (v) { return v !== best; }).map(function (v) { return { t: t(v), fb: "Strength is the distance from 0. $" + Math.abs(v).toFixed(2) + "$ is less than $" + Math.abs(best).toFixed(2) + "$." }; }),
          hints: ["Ignore the sign. Which is furthest from 0?"], why: t(best) + " is closest to " + (best < 0 ? "$-1$" : "1") + ". The sign only gives the direction." });
      } },
    { id: "u3-r-describe", title: "Describe a correlation", lesson: 6,
      gen: function (R) {
        var strong = R.chance(0.5), pos = R.chance(0.5), r = (pos ? 1 : -1) * (strong ? R.int(85, 98) : R.int(15, 38)) / 100;
        var names = ["Strong and positive", "Weak and positive", "Strong and negative", "Weak and negative"], right = names[(pos ? 0 : 2) + (strong ? 0 : 1)];
        return mc(R, { prompt: "Two variables have $r = " + r.toFixed(2) + "$. How would you describe the linear relationship?", right: right,
          wrong: names.filter(function (n) { return n !== right; }).map(function (n) { return { t: n, fb: "The sign is " + (pos ? "positive" : "negative") + ", and $" + Math.abs(r).toFixed(2) + "$ is " + (strong ? "close to 1." : "far from 1.") }; }),
          keep: true, hints: ["Sign: direction. Distance from 0: strength."], why: "The sign is " + (pos ? "positive" : "negative") + " and the size, " + Math.abs(r).toFixed(2) + ", is " + (strong ? "close to 1: strong." : "close to 0: weak.") });
      } },
    { id: "u3-causal", title: "Correlation or causation", lesson: 7,
      gen: function (R) {
        var S = R.pick([
          ["Minutes a pan is on the stove, and the temperature of the water in it", true, "Heating is what raises the temperature."],
          ["Number of hours worked at an hourly rate, and pay", true, "More hours directly produce more pay."],
          ["How far a car's accelerator is pressed, and the car's speed", true, "Pressing the pedal is what speeds the car up."],
          ["Amount of water given to a plant in dry soil, and its growth", true, "Water is something the plant needs in order to grow."],
          ["Number of people in a queue, and the wait at the back", true, "Each person ahead adds to the wait."],
          ["Ice cream sales, and sunburn cases", false, "Sunny weather raises both."],
          ["Children's shoe size, and reading level", false, "Age raises both."],
          ["Number of firefighters at a fire, and the damage done", false, "The size of the fire raises both."],
          ["Umbrella sales, and traffic accidents", false, "Rain raises both."],
          ["Number of cinemas in a town, and number of schools", false, "The town's population raises both."],
          ["Sales of winter coats, and cases of flu", false, "Cold weather raises both."]]);
        return mc(R, { prompt: "These two quantities are strongly correlated. Is the relationship causal? <br><br>**" + S[0] + "**",
          right: S[1] ? "Causal" : "Correlated, but not causal", wrong: [{ t: S[1] ? "Correlated, but not causal" : "Causal", fb: S[2] }], keep: true,
          hints: ["Does changing one bring about the change in the other? Or is something else behind both?"], why: S[2] });
      } }
  ];
  L.unit("alg", 3, {
    title: "Two-variable statistics",
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Linear models: predicting, what slope and intercept mean, writing a model, and residuals.",
        skills: ["u3-predict", "u3-slope", "u3-intercept", "u3-model", "u3-residual"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "The correlation coefficient, what it says in a situation, and why it isn't proof of cause.",
        skills: ["u3-r-strength", "u3-r-describe", "u3-causal"], per: 2 }
    ],
    skills: SKILLS
  });
  /* ===================================================== Concept builders */
  L.addConcepts("alg:3", {
    2: { name: "Linear model", keep: true, frame: "A [[linear model]] is a line that describes the [[trend]] in data. It doesn't pass through every point, but it lets you [[predict]].",
         chips: ["scatter plot", "prove"], fb: { "prove": "A model summarises the data so you can estimate new values. It doesn't prove anything." } },
    3: { name: "Line of best fit", frame: "The line of best fit makes the sum of the squared [[misses]] as [[small]] as possible. A good fit leaves points on [[both sides]].",
         chips: ["large", "one side"], fb: { "one side": "If every point were on one side, the line could move closer to them all." } },
    4: { name: "Residual", frame: "A [[residual]] is actual minus [[predicted]]. A point above the line has a [[positive]] residual.",
         chips: ["negative", "average"], fb: { "negative": "Above the line, the actual value is bigger than the prediction: the residual is positive." } },
    5: { name: "Correlation coefficient", frame: "The correlation coefficient $r$ is always between [[$-1$]] and [[$1$]]. Its sign gives the [[direction]], and its size the strength.",
         chips: ["$0$", "$100$", "speed"], fb: { "$100$": "$r$ is never bigger than 1.", "$0$": "$r$ can be 0, but it goes all the way down to $-1$." } },
    6: { name: "Describing a correlation", frame: "To describe a relationship using $r$, say its [[direction]], its [[strength]], and the [[context]].",
         chips: ["slope", "units"], fb: { "slope": "$r$ isn't a slope. It describes direction and strength." } },
    7: { name: "Correlation and causation", frame: "In a [[causal]] relationship, one variable brings about the change in the other. [[Correlation]] alone never proves it: a [[hidden]] variable may drive both.",
          chips: ["linear", "Causation"], fb: { "Causation": "It's correlation that can't prove cause." } }
  });
})();
