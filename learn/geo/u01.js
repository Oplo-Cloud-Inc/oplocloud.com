/* ==========================================================================
   Geometry — Unit 1: Performing transformations. See lab/core.js.

   Taught as a concept builder: every idea is shown before it is named, and
   named before it is asked for. A lesson goes

     see it      a picture, or a shape on a grid you move yourself
     watch it    a worked example a line at a time, its picture building up
                 beside the lines the way a teacher draws on the board
     your turn   the same thing with new numbers, with hints that walk the
                 steps — the last hint is the picture of the answer
     a step on   the same idea with a twist, and the slip people make with it

   Pictures keep one colour code the whole unit through, and a lesson says so
   the first time it matters: grey is where a figure starts (the pre-image),
   blue is where it ends up (the image), green is a target to land on, orange
   is a move (an arrow, a turn, a centre), purple is a mirror line.

   Eight lessons, in the order of the unit: the words of geometry (two
   lessons), what a transformation is, then translations, rotations,
   reflections and dilations, then telling them apart and what each keeps.
   Sixteen skills practise it — one for each exercise in the unit — three
   quizzes check it, and the unit test draws from every skill.
   Standards: HSG.CO.A.1–5, HSG.SRT.A.1.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var num = L.num, mc = L.mc, F = L.fig, FS = L.figs;

  /* ------------------------------------------------------------ Helpers */
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  function P(p) { return pt(p[0], p[1]); }
  function shift(sh, dx, dy) { return sh.map(function (p) { return [p[0] + dx, p[1] + dy]; }); }
  // n quarter turns counterclockwise about c (n = −1 is a quarter turn clockwise).
  function turn(sh, n, c) {
    c = c || [0, 0];
    return sh.map(function (p) {
      var x = p[0] - c[0], y = p[1] - c[1], t;
      for (var i = 0; i < ((n % 4) + 4) % 4; i++) { t = x; x = -y; y = t; }
      return [x + c[0], y + c[1]];
    });
  }
  function flip(sh, over) { var f = L.mirrorLine(over).f; return sh.map(function (p) { return f(p[0], p[1]); }); }
  function scale(sh, k, c) {
    c = c || [0, 0];
    return sh.map(function (p) { return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; });
  }
  function same(a, b) { return a.every(function (p, i) { return Math.abs(p[0] - b[i][0]) < 1e-9 && Math.abs(p[1] - b[i][1]) < 1e-9; }); }
  function names(n, primed) { return "ABCDEFGH".split("").slice(0, n).map(function (s) { return primed ? s + "'" : s; }); }
  // A picture on graph paper, and one on plain paper.
  function grid(x, y, items, o) { return F(Object.assign({ x: x, y: y, items: items }, o || {})); }
  function plain(x, y, items, o) { return F(Object.assign({ x: x, y: y, grid: false, items: items }, o || {})); }
  // A figure where it starts (grey, A B C) and where it ends up (blue, A′ B′ C′).
  function pre(sh, named) { return { poly: sh, c: "soft", names: named === false ? null : names(sh.length) }; }
  function img(sh, named) { return { poly: sh, c: "blue", names: named === false ? null : names(sh.length, true) }; }
  function signed(v) { return v < 0 ? "- " + Math.abs(v) : "+ " + v; }
  function across(a) { return Math.abs(a) + (a > 0 ? " right" : " left"); }
  function upDown(b) { return Math.abs(b) + (b > 0 ? " up" : " down"); }
  var LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");

  var TRI = [[1, 1], [4, 1], [1, 3]];
  // A shape with no symmetry at all, so a turn, a flip and a slide all look
  // different: the thing to use when the question is "which move was it?".
  var FLAG = [[0, 0], [0, 3], [2, 3], [2, 2], [1, 2], [1, 0]];
  var FL = shift(FLAG, 1, 1);
  // For a dilation: a half-size flag 1½ right and 2 up from a centre at
  // (−5, −5), and its image at scale factor 2 — far enough out not to overlap.
  var DC = [-5, -5], DPRE = shift(scale(FLAG, 0.5), -3.5, -3), DIMG = scale(DPRE, 2, DC);

  /* The four pieces of Lesson 1, drawn: a point, a segment, a ray (from the
     left point, or back from the right one), a line. a is on the left, b on
     the right. */
  function piece(kind, a, b, o) {
    o = o || {};
    var A = [1.4, 1], B = [4.4, 1], items = [];
    if (kind === "point") items.push({ pt: [3, 1], name: a, at: "n" });
    else {
      if (kind === "seg") items.push({ seg: [A, B] });
      else if (kind === "ray") items.push({ ray: [A, B] });
      else if (kind === "rayL") items.push({ ray: [B, A] });
      else items.push({ line: [A, B] });
      items.push({ pt: A, name: a, at: "n" }, { pt: B, name: b, at: "n" });
    }
    var alt = {
      point: "A single dot, labelled " + a + ".",
      seg: "A straight piece from " + a + " to " + b + ", stopping at both.",
      ray: "Starts at " + a + ", passes through " + b + ", and has an arrow going on past " + b + ".",
      rayL: "Starts at " + b + ", passes through " + a + ", and has an arrow going on past " + a + ".",
      line: "Passes through " + a + " and " + b + ", with an arrow at each end."
    }[kind];
    return plain([0, 6], [0, 2], items, { u: o.u || 38, cap: o.cap, alt: alt, w: o.w });
  }
  var NOTATION = {
    seg: function (a, b) { return "$\\overline{" + a + b + "}$"; },
    ray: function (a, b) { return "$\\overrightarrow{" + a + b + "}$"; },
    rayL: function (a, b) { return "$\\overrightarrow{" + b + a + "}$"; },
    line: function (a, b) { return "$\\overleftrightarrow{" + a + b + "}$"; }
  };

  /* An angle: rays from v through a and through b, with its arc. */
  function angleFig(a, v, b, o) {
    o = o || {};
    var V = [1, 0.8], A = [3.6, 3.4], B = [5.2, 0.8], items = [];
    if (!o.one && o.arc !== false) items.push({ angle: [A, V, B], r: 26 });
    items.push({ ray: [V, A] });
    if (!o.one) items.push({ ray: [V, B] });
    items.push({ pt: V, name: v, at: "sw" }, { pt: A, name: a, at: "nw" });
    if (!o.one) items.push({ pt: B, name: b, at: "s" });
    return plain([0, 6.4], [0, 4.2], items, { u: o.u || 40, cap: o.cap,
      alt: o.one ? "A ray starting at " + v + " through " + a + "." : "Two rays start at " + v + ": one through " + a + ", one through " + b + ". The angle between them is marked." });
  }
  /* Two lines: parallel, perpendicular, or crossing at some other angle. */
  function linesFig(kind, o) {
    o = o || {};
    var items = kind === "par" ? [{ line: [[0.8, 0.8], [5.2, 1.9]] }, { line: [[0.8, 2.3], [5.2, 3.4]] }]
      : kind === "perp" ? [{ line: [[0.6, 1.4], [5.4, 1.4]] }, { line: [[3, 0.4], [3, 3.8]] }, { angle: [[4, 1.4], [3, 1.4], [3, 2.4]], right: true, c: "orange" }]
      : [{ line: [[0.6, 0.7], [5.4, 3.1]] }, { line: [[1, 3.6], [5, 0.6]] }];
    return plain([0, 6], [0, 4.2], items, { u: o.u || 38, cap: o.cap,
      alt: kind === "par" ? "Two lines side by side, the same distance apart all the way along." :
           kind === "perp" ? "Two lines crossing, with a small square in the corner where they meet." : "Two lines crossing at a slant, with no square in the corner." });
  }

  /* Which move a picture shows, and why each wrong answer is wrong. */
  var MOVES = ["A translation", "A rotation", "A reflection", "A dilation"];
  var MOVE_KEY = { "A translation": "t", "A rotation": "r", "A reflection": "f", "A dilation": "d" };
  var WHY_MOVE = {
    t: "Same size, facing the same way — it only slid somewhere else. That's a **translation**.",
    r: "Same size, not a mirror image, but turned. That's a **rotation**.",
    f: "Same size, but a mirror image — it now faces the other way. That's a **reflection**.",
    d: "It changed size. Only a **dilation** does that."
  };
  var NOT_MOVE = {                                   // NOT_MOVE[picked][actual]
    t: { r: "A slide keeps a figure facing exactly the same way. This one has been turned.",
         f: "A slide never flips a figure, and the blue one is a mirror image of the grey one.",
         d: "A slide keeps the size. Compare them: one is bigger than the other." },
    r: { t: "Nothing has turned — the blue figure points exactly the way the grey one does. It has only moved.",
         f: "However you turn the grey figure, it won't match: the blue one is its mirror image, so it was flipped.",
         d: "A rotation keeps the size, and these are different sizes." },
    f: { t: "A mirror image would face the other way. This one faces the same way — it only moved.",
         r: "Cut the grey figure out in your head and turn it: it lands on the blue one without flipping. That's a turn, not a mirror image.",
         d: "A reflection keeps the size, and these are different sizes." },
    d: { t: "Count the squares: both figures are the same size. A dilation always changes the size.",
         r: "Count the squares: both figures are the same size. A dilation always changes the size.",
         f: "Count the squares: both figures are the same size. A dilation always changes the size." }
  };
  function whichMove(actual, art, o) {
    o = o || {};
    return { type: "choice", prompt: o.prompt || "The grey figure was moved onto the blue one. Which transformation was it?", art: art,
      skill: o.skill || "Identifying transformations", keep: true,
      options: MOVES.map(function (t) { var k = MOVE_KEY[t]; return k === actual ? { t: t } : { t: t, fb: NOT_MOVE[k][actual] }; }),
      answer: MOVES.map(function (t) { return MOVE_KEY[t]; }).indexOf(actual),
      hints: o.hints || ["First: are they the same size? If not, it's a dilation.",
        "Same size? Imagine the grey figure cut out of paper. If you have to flip the paper over to make it match, it's a reflection. If you only have to turn it, a rotation. If you only slide it, a translation."],
      why: WHY_MOVE[actual] };
  }
  function flagPic(a, b, extra, o) {
    o = o || {};
    return grid(o.x || [-6, 6], o.y || [-6, 6], (o.under || []).concat([{ poly: a, c: "soft" }, { poly: b, c: "blue" }]).concat(extra || []),
      { u: o.u || 20, cap: o.cap, nums: o.nums === true, alt: o.alt || "A grey flag shape and a blue one on a grid." });
  }

  L.unit("geo", 1, {
    title: "Performing transformations",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Points, lines and planes", v: 2,
        blurb: "The four pieces everything in geometry is built from — what each one looks like, and how to write its name.",
        mins: 9,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Around 300 BC a Greek teacher called Euclid wrote a book, the *Elements*, that built the whole of geometry out of a few simple pieces. <br><br>You'll use four of them all year. Press **Next step** to meet them one at a time.",
            scene: { type: "walk", rows: [
              { m: "A", fig: piece("point", "A"), say: "A **point** marks one exact spot. It has no size — the dot is only there so you can see it. It's named with a capital letter." },
              { m: "\\overline{AB}", fig: piece("seg", "A", "B"), say: "A **segment** is the straight path between two points. It **stops** at both ends, so it has a length you can measure. Write its two endpoints with a bar on top." },
              { m: "\\overrightarrow{AB}", fig: piece("ray", "A", "B"), say: "A **ray** starts at one point and goes on **forever** in one direction. Write the starting point first, with a one-way arrow on top." },
              { m: "\\overleftrightarrow{AB}", fig: piece("line", "A", "B"), say: "A **line** goes on forever in **both** directions. It has no ends, so it has no length. Its arrow points both ways." }] },
            gate: true,
            then: "The mark on top is a tiny picture of the thing: a bar stops at both ends, one arrow goes on one way, two arrows go on both ways." },
          { type: "choice", prompt: "Which picture shows a **ray**?", skill: "Points, lines and planes",
            options: [{ t: piece("ray", "P", "Q", { u: 34 }) },
                      { t: piece("seg", "P", "Q", { u: 34 }), fb: "That one stops at both ends, so it's a segment. A ray goes on forever one way." },
                      { t: piece("line", "P", "Q", { u: 34 }), fb: "Arrows at **both** ends make it a line. A ray starts at a point and goes on only one way." }],
            answer: 0,
            hints: ["Look at the two ends. A ray has one end where it starts, and an arrow at the other."],
            why: "A ray has exactly one endpoint, and an arrow showing it goes on forever the other way." },
          { type: "choice", prompt: "Which of these has a length you could measure with a ruler?", skill: "Points, lines and planes",
            options: [{ t: "The segment $\\overline{PQ}$" },
                      { t: "The ray $\\overrightarrow{PQ}$", fb: "A ray never ends on one side, so there's no length to measure." },
                      { t: "The line $\\overleftrightarrow{PQ}$", fb: "A line never ends on either side." },
                      { t: "The point $P$", fb: "A point has no size at all." }],
            answer: 0,
            why: "Only a segment has two endpoints, so only a segment has a length: the distance from $P$ to $Q$." },
          { type: "learn", kicker: "Watch out",
            prompt: "For a segment or a line, the order of the letters doesn't matter: $\\overline{AB}$ and $\\overline{BA}$ are the same segment. <br><br>For a **ray** it does. The first letter is always where the ray **starts**.",
            art: FS([piece("ray", "A", "B", { cap: "$\\overrightarrow{AB}$ starts at $A$ and heads through $B$" }),
                     piece("rayL", "A", "B", { cap: "$\\overrightarrow{BA}$ starts at $B$ and heads through $A$" })]) },
          { type: "choice", prompt: "What is the name of this ray?", art: piece("rayL", "P", "Q"), skill: "Points, lines and planes",
            options: [{ t: "$\\overrightarrow{QP}$" },
                      { t: "$\\overrightarrow{PQ}$", fb: "$\\overrightarrow{PQ}$ would start at $P$ and head the other way, through $Q$. Where does this one start?" },
                      { t: "$\\overleftrightarrow{QP}$", fb: "Two arrows name a **line**. This one has an end, at $Q$." },
                      { t: "$\\overline{QP}$", fb: "A bar names a **segment**, which stops at both ends. This one goes on past $P$." }],
            answer: 0,
            hints: ["Find the end — the point where it starts. That letter goes first.", "It starts at $Q$ and heads through $P$."],
            why: "It starts at $Q$ and goes on through $P$, so it's $\\overrightarrow{QP}$." },
          { type: "sort", prompt: "Sort each name by what it names. Drag a card into a box, or click a card and then a box.",
            bins: ["A point", "A segment", "A ray", "A line"],
            cards: [{ t: "$P$", bin: 0 }, { t: "$\\overline{PQ}$", bin: 1 }, { t: "$\\overrightarrow{PQ}$", bin: 2 },
                    { t: "$\\overleftrightarrow{PQ}$", bin: 3 }, { t: "$\\overline{XY}$", bin: 1 },
                    { t: "$\\overrightarrow{YX}$", bin: 2, fb: "One arrow on top: a ray, starting at $Y$." },
                    { t: "$M$", bin: 0, fb: "A single capital letter names a point." }],
            skill: "Points, lines and planes",
            why: "One letter is a point. A bar on top is a segment, one arrow is a ray (starting at its first letter), and two arrows are a line." },
          { type: "learn", kicker: "Two more words",
            prompt: "Points that lie on the same straight line are **collinear**. Here $A$, $B$ and $C$ are collinear; $D$ is not. <br><br>A **plane** is a flat surface that goes on forever in every direction. The grid you'll use in this unit is a picture of one — with edges only because a screen has them.",
            art: plain([0, 7], [0, 4], [{ line: [[1, 0.8], [5, 2.8]], c: "soft" }, { pt: [1.4, 1], name: "A", at: "nw" }, { pt: [3, 1.8], name: "B", at: "nw" },
                                        { pt: [5, 2.8], name: "C", at: "nw" }, { pt: [4.4, 1.2], name: "D", at: "se", c: "orange" }],
                       { u: 44, alt: "A line passes through A, B and C. Point D sits below the line, off it." }) },
          { type: "choice", prompt: "Which three points are collinear?", skill: "Points, lines and planes",
            art: plain([0, 6.5], [0, 4], [{ pt: [1, 3.2], name: "P" }, { pt: [3, 2.2], name: "Q" }, { pt: [5, 1.2], name: "R" },
                                          { pt: [4.2, 3.2], name: "S" }, { pt: [2, 1], name: "T", at: "se" }],
                       { u: 44, alt: "Five points. P, Q and R step down evenly from left to right; S is up to the right and T is down to the left." }),
            options: [{ t: "$P$, $Q$ and $R$" },
                      { t: "$P$, $Q$ and $S$", fb: "Lay a ruler through $P$ and $Q$: $S$ is well above it." },
                      { t: "$Q$, $R$ and $T$", fb: "A straight line through $Q$ and $R$ passes above $T$." }],
            answer: 0,
            hints: ["Imagine a ruler laid through two of the points. Which third point does it also touch?"],
            why: "$P$, $Q$ and $R$ lie on one straight line: each is 2 across and 1 down from the one before." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Angles and exact definitions", v: 2,
        blurb: "Angles and how to name them, lines that never meet or meet square, and why a definition has to be exact.",
        mins: 10,
        steps: [
          { type: "learn", kicker: "Picture it",
            prompt: "An **angle** is made of two rays that start at the same point.",
            scene: { type: "walk", rows: [
              { fig: angleFig("A", "B", "C", { one: true }), say: "Start with one ray: it begins at $B$ and passes through $A$." },
              { fig: angleFig("A", "B", "C", { arc: false }), say: "Add a second ray from the **same** point $B$, through $C$." },
              { m: "\\angle ABC", fig: angleFig("A", "B", "C"), say: "The two rays make an angle. The shared point, $B$, is its **vertex** — the corner." },
              { m: "\\angle ABC = \\angle CBA", say: "Name it with three letters and the vertex **in the middle**, either way round. When no other angle shares the corner, $\\angle B$ is fine too." }] },
            gate: true },
          { type: "choice", prompt: "This is $\\angle XYZ$. Which point is its vertex?", art: angleFig("X", "Y", "Z"), skill: "Naming angles",
            options: [{ t: "$Y$" }, { t: "$X$", fb: "$X$ is a point on one of the rays. The vertex is where the two rays **start** — and its letter is always in the middle." },
                      { t: "$Z$", fb: "$Z$ is on the other ray. The vertex is the corner, named in the middle: $Y$." }],
            answer: 0,
            hints: ["The vertex is the corner the two rays share.", "In a three-letter name, it's always the middle letter."],
            why: "The rays start at $Y$, and $Y$ is the middle letter of $\\angle XYZ$." },
          { type: "choice", prompt: "Which of these is **not** a correct name for this angle?", art: angleFig("K", "M", "N"), skill: "Naming angles",
            options: [{ t: "$\\angle KNM$" },
                      { t: "$\\angle KMN$", fb: "That one's fine: $M$, the vertex, is in the middle." },
                      { t: "$\\angle NMK$", fb: "That one's fine too — the order of the outside letters doesn't matter as long as the vertex is in the middle." },
                      { t: "$\\angle M$", fb: "Nothing else meets at $M$, so the single letter is enough." }],
            answer: 0,
            hints: ["Find the vertex. Which name doesn't have it in the middle?"],
            why: "$\\angle KNM$ has $N$ in the middle, which would be an angle with its corner at $N$ — not this one." },
          { type: "learn", kicker: "Two ways lines can sit",
            prompt: "Two lines on a flat surface either cross or they don't.",
            art: FS([linesFig("par", { cap: "**Parallel** ($\\parallel$): they never meet, however far they go" }),
                     linesFig("perp", { cap: "**Perpendicular** ($\\perp$): they meet in a square corner, $90^\\circ$" })]),
            after: "The little square in a corner is how a drawing says “exactly $90^\\circ$”." },
          { type: "choice", prompt: "How are these two lines related?", art: linesFig("perp"), skill: "Parallel and perpendicular",
            options: [{ t: "Perpendicular" }, { t: "Parallel", fb: "These two cross each other, and parallel lines never meet." },
                      { t: "Neither", fb: "Look at the corner where they cross: the small square means they meet at exactly $90^\\circ$." }],
            answer: 0, keep: true,
            why: "They meet, and the square in the corner says the angle is $90^\\circ$: perpendicular." },
          { type: "choice", prompt: "How are these two lines related?", art: linesFig("neither"), skill: "Parallel and perpendicular",
            options: [{ t: "Perpendicular", fb: "They cross, but not in a square corner — there's no right-angle mark, and one angle is clearly wider than the other." },
                      { t: "Parallel", fb: "Parallel lines never meet, and these cross." },
                      { t: "Neither" }],
            answer: 2, keep: true,
            hints: ["Do they meet? If so, is the corner square?"],
            why: "They cross, so they aren't parallel; and not at $90^\\circ$, so they aren't perpendicular." },
          { type: "learn", kicker: "Exactly",
            prompt: "Euclid's habit was to say **exactly** what each thing is. Here's why that matters.",
            scene: { type: "walk", rows: [
              { fig: plain([-3, 3], [-2.6, 2.6], [{ circle: [[0, 0], 2] }], { u: 40, alt: "A circle." }),
                say: "“A circle is a round shape.” True — but an egg is round too, and so is a squashed oval. Those words can't tell them apart." },
              { fig: plain([-3, 3], [-2.6, 2.6], [{ circle: [[0, 0], 2] }, { seg: [[0, 0], [2, 0]], c: "orange", dash: true }, { seg: [[0, 0], [-1, 1.732]], c: "orange", dash: true },
                                                   { seg: [[0, 0], [-1, -1.732]], c: "orange", dash: true }, { pt: [0, 0], name: "O", at: "sw" }], { u: 40, alt: "A circle with centre O and three dashed lines from O to the circle, all the same length." }),
                say: "Try: “A **circle** is all the points in a plane that are the **same distance** from one point.” Now there's only one shape it can be." },
              { fig: plain([-3, 3], [-2.6, 2.6], [{ circle: [[0, 0], 2] }, { seg: [[0, 0], [1.732, 1]], c: "orange" }, { text: "radius", at: [1.3, 0.1], c: "orange" },
                                                   { pt: [0, 0], name: "O", at: "nw" }, { text: "centre", at: [0, -0.55], c: "soft" }], { u: 40, alt: "A circle with its centre O and one radius drawn." }),
                say: "That one point is the **centre**, and the distance is the **radius**. With those two, you could draw it with a compass." }] },
            gate: true,
            then: "A good definition is a test that every example passes and nothing else does." },
          { type: "choice", prompt: "Which is a precise definition of a **circle**?", skill: "Exact definitions",
            options: [{ t: "All the points in a plane that are the same distance from a given point" },
                      { t: "A round shape with no corners", fb: "True of a circle — but also of an oval. A definition has to rule out everything else." },
                      { t: "A curved line that joins up with itself", fb: "So does a figure-of-eight or a bean shape. That doesn't pin down a circle." }],
            answer: 0,
            hints: ["Which one tells you exactly how to draw it?"],
            why: "It gives the centre and the radius, and only a circle fits it." },
          { type: "choice", prompt: "Which is the most precise definition of a **segment**?", skill: "Exact definitions",
            options: [{ t: "The part of a line between two points, including those two endpoints" },
                      { t: "A short line", fb: "A line has no ends, so it can't be short — and “short” isn't exact anyway." },
                      { t: "The distance between two points", fb: "That's the segment's **length**, a number. The segment is the straight piece itself." }],
            answer: 0,
            why: "It says what the segment is (part of a line), where it stops (the two points) and that the ends belong to it." },
          { type: "choice", prompt: "Which is the precise definition of **perpendicular lines**?", skill: "Exact definitions",
            options: [{ t: "Two lines that meet to form a right angle" },
                      { t: "Two lines that cross each other", fb: "Lines can cross at any angle. Perpendicular means the angle is exactly $90^\\circ$." },
                      { t: "One line going across and one going up", fb: "Which way they point on the page doesn't matter — a tilted pair can be perpendicular too." }],
            answer: 0,
            why: "Meeting is not enough: the angle between them has to be a right angle, $90^\\circ$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "What a transformation is", v: 2,
        blurb: "Moving a figure by a rule: the pre-image and the image, the four moves, and how to tell which one happened.",
        mins: 10,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "A **transformation** moves every point of a figure by the same rule. <br><br>The figure you start with is the **pre-image**. Where it ends up is the **image**. Each point of the image gets a prime mark: $A$ goes to $A'$, said “A prime”.",
            art: grid([-1, 8], [-1, 6], TRI.map(function (p) { return { arrow: [p, [p[0] + 3, p[1] + 2]], dash: true }; }).concat([pre(TRI), img(shift(TRI, 3, 2))]),
                      { u: 30, cap: "Grey is where it starts: the pre-image $\\triangle ABC$. Blue is where it ends up: the image $\\triangle A'B'C'$.",
                        alt: "Grey triangle ABC and blue triangle A-prime B-prime C-prime, up and to the right of it, with an arrow from each corner to its image." }),
            after: "That colour code holds for every picture in this unit: grey is the pre-image, blue is the image." },
          { type: "pair", prompt: "Point $C$ is at $(1, 3)$. Where is its image, $C'$? Read it off the grid.", skill: "Pre-image and image",
            art: grid([-1, 8], [-1, 6], [pre(TRI), img(shift(TRI, 3, 2))], { u: 30, alt: "Grey triangle ABC and blue triangle A-prime B-prime C-prime." }),
            answer: [4, 5],
            hints: ["Find the blue corner labelled $C'$.", "Count along the bottom for $x$, then up the side for $y$."],
            why: "$C'$ is 4 across and 5 up: $(4, 5)$." },
          { type: "learn", kicker: "The four moves",
            prompt: "This unit has four transformations. Press **Next step** to see each one move the same flag shape.",
            scene: { type: "walk", rows: [
              { fig: flagPic(FL, shift(FL, -5, 1), [{ arrow: [[1, 1], [-4, 2]] }], { alt: "The grey flag slides to the left, to the blue flag, which points the same way." }),
                say: "**Translation** — a slide. Every point moves the same distance in the same direction." },
              { fig: flagPic(FL, turn(FL, 1), [{ centre: [0, 0] }, { turn: [[0, 0], 5, 15, 105], say: "90°" }], { alt: "The grey flag turns a quarter turn about the origin to the blue flag." }),
                say: "**Rotation** — a turn about a fixed point, the **centre**." },
              { fig: flagPic(FL, flip(FL, "y"), [{ mirror: "y" }], { alt: "The grey flag flips over the y-axis to the blue flag, a mirror image." }),
                say: "**Reflection** — a flip over a line, like a mirror. The image faces the other way." },
              { fig: flagPic(DPRE, DIMG, [DIMG[1], DIMG[2], DIMG[5]].map(function (q) { return { seg: [DC, q], c: "soft", dash: "3 4" }; }).concat([{ centre: DC, at: "se" }]),
                             { alt: "The grey flag is scaled up from a centre in the corner into a blue flag twice as big." }),
                say: "**Dilation** — a resize from a centre: bigger or smaller, the same shape." }] },
            gate: true,
            then: "Translations, rotations and reflections are **rigid** moves: the figure keeps its size and shape, and only its position changes. A dilation is the odd one out — it changes the size." },
          whichMove("r", flagPic(FL, turn(FL, 2), [], { alt: "A grey flag in the top right and a blue flag in the bottom left, upside down." })),
          whichMove("f", flagPic(FL, flip(FL, "x"), [], { alt: "A grey flag above the x-axis and a blue flag below it, pointing the same way across but upside down." })),
          { type: "learn", kicker: "How to tell",
            prompt: "Given a figure and its image, ask three questions in this order.",
            scene: { type: "walk", rows: [
              { say: "**1. Did the size change?** Then it's a dilation — nothing else resizes." },
              { say: "**2. Is it a mirror image?** Imagine the grey figure cut out of paper. If you'd have to flip the paper over to match the blue one, it's a reflection." },
              { say: "**3. Did it turn?** If you only need to turn the paper, it's a rotation. If you only need to slide it, it's a translation." }] },
            gate: true },
          whichMove("d", flagPic(shift(FLAG, 2, 2), scale(shift(FLAG, 2, 2), 0.5, [-4, -4]), [], { alt: "A large grey flag in the top right and a small blue flag, half its size, down to the left." })),
          whichMove("t", flagPic(shift(FLAG, -5, -5), shift(FLAG, 1, 0), [], { alt: "A grey flag in the bottom left and a blue flag, pointing the same way, up to the right." })),
          { type: "multi", prompt: "Which of these are **rigid** transformations — ones that never change a figure's size or shape? Pick every one.", skill: "Identifying transformations",
            options: [{ t: "Translation", ok: true }, { t: "Rotation", ok: true }, { t: "Reflection", ok: true },
                      { t: "Dilation", ok: false, fb: "A dilation resizes the figure — that's the one move that isn't rigid." }],
            why: "Sliding, turning and flipping keep every length and angle. Only a dilation changes the size." },
          { type: "choice", prompt: "A transformation turns a segment 3 cm long into one 6 cm long. Could it be a rotation?", skill: "Identifying transformations",
            options: [{ t: "No — a rotation is rigid, so the image would still be 3 cm. It must be a dilation." },
                      { t: "Yes — a big enough turn stretches it", fb: "Turning never stretches anything. Spin a pencil: it's the same length the whole way round." },
                      { t: "Yes, if the centre is far away", fb: "Wherever the centre is, a rotation keeps every length the same." }],
            answer: 0, keep: true,
            why: "Only a dilation changes lengths. This one doubled them, so its scale factor is 2." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Translations", v: 2,
        blurb: "Slide it: count across, count up — and the rule is just adding.",
        mins: 12,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "A **translation** slides every point the same distance in the same direction. On a grid, that's counting.",
            scene: { type: "walk", rows: [
              { m: "A(-3, -2)", fig: grid([-5, 5], [-4, 4], [{ pt: [-3, -2], name: "A", at: "nw" }], { u: 26, alt: "Point A at (−3, −2)." }),
                say: "Start at $A(-3, -2)$." },
              { m: "-3 + 5 = 2", fig: grid([-5, 5], [-4, 4], [{ steps: [[-3, -2], [2, -2]] }, { pt: [-3, -2], name: "A", at: "nw" }], { u: 26, alt: "An arrow from A going 5 to the right." }),
                say: "Slide it **5 to the right**. Moving right adds to $x$: $-3 + 5 = 2$." },
              { m: "-2 + 3 = 1", fig: grid([-5, 5], [-4, 4], [{ steps: [[-3, -2], [2, 1]] }, { pt: [-3, -2], name: "A", at: "nw" }, { pt: [2, 1], name: "A'", c: "blue", at: "ne" }], { u: 26, alt: "Arrows from A: 5 right, then 3 up, to A-prime at (2, 1)." }),
                say: "Then **3 up**. Moving up adds to $y$: $-2 + 3 = 1$. The image is $A'(2, 1)$." },
              { m: "(x, y) \\to (x + 5, y + 3)", say: "Written as a rule for every point: add 5 to $x$ and 3 to $y$." }] },
            gate: true,
            then: "Right and up **add**. Left and down **subtract**." },
          { type: "pair", prompt: "Your turn. Translate $B(4, 3)$ **6 units left** and **5 units down**. Where does it land?", skill: "Translating points",
            art: grid([-5, 6], [-4, 5], [{ pt: [4, 3], name: "B" }], { u: 24, alt: "Point B at (4, 3)." }),
            answer: [-2, -2],
            near: [{ v: [10, 8], fb: "That went right and up. **Left** and **down** subtract." }, { v: [-1, -3], fb: "Left goes with $x$ (the across number) and down with $y$. Take 6 from the 4 and 5 from the 3." }],
            hints: ["Left means take away from $x$: $4 - 6$.", "Down means take away from $y$: $3 - 5$.",
                    "On the grid: " + grid([-5, 6], [-4, 5], [{ steps: [[4, 3], [-2, -2]] }, { pt: [4, 3], name: "B" }, { pt: [-2, -2], name: "B'", c: "blue", at: "sw" }], { u: 20, w: 240, alt: "Arrows from B: 6 left, then 5 down, to B-prime." })],
            why: "$(4 - 6,\\; 3 - 5) = (-2, -2)$." },
          { type: "pair", prompt: "Now the rule form. Translate $(3, -2)$ by $(x, y) \\to (x + 4, y + 5)$.", skill: "Translating points",
            answer: [7, 3],
            near: [{ v: [-1, -7], fb: "Plus means add: $3 + 4$ and $-2 + 5$." }],
            hints: ["Read the rule: $x + 4$ means 4 to the right; $y + 5$ means 5 up.", "$3 + 4 = 7$, and $-2 + 5 = 3$."],
            why: "$(3 + 4,\\; -2 + 5) = (7, 3)$." },
          { type: "choice", kicker: "Watch out", prompt: "Jay translates $(2, 5)$ by $(x, y) \\to (x - 3, y + 1)$ and gets $(5, 6)$. What went wrong?", skill: "Translating points",
            options: [{ t: "He added 3 to $x$ instead of taking 3 away" },
                      { t: "He should have added to $x$ and taken away from $y$", fb: "The rule says $x - 3$ and $y + 1$: take 3 from $x$, add 1 to $y$. Jay got the $y$ right." },
                      { t: "Nothing — it's right", fb: "Check the $x$: the rule is $x - 3$, and $2 - 3$ isn't 5." }],
            answer: 0,
            why: "$x - 3$ means 3 to the **left**: $2 - 3 = -1$. The right answer is $(-1, 6)$." },
          { type: "learn", kicker: "Backwards",
            prompt: "Given a point and its image, you can work out the translation: count how far it went.",
            scene: { type: "walk", rows: [
              { m: "P(-2, 1) \\to P'(3, -3)", fig: grid([-4, 5], [-5, 3], [{ pt: [-2, 1], name: "P" }, { pt: [3, -3], name: "P'", c: "blue", at: "se" }], { u: 26, alt: "Point P at (−2, 1) and its image P-prime at (3, −3)." }),
                say: "Here is a point and its image." },
              { m: "3 - (-2) = 5", fig: grid([-4, 5], [-5, 3], [{ steps: [[-2, 1], [3, 1]] }, { pt: [-2, 1], name: "P" }, { pt: [3, -3], name: "P'", c: "blue", at: "se" }], { u: 26, alt: "An arrow from P going 5 right." }),
                say: "Across: from $-2$ to $3$ is **5 right**. That's new $x$ minus old $x$." },
              { m: "-3 - 1 = -4", fig: grid([-4, 5], [-5, 3], [{ steps: [[-2, 1], [3, -3]] }, { pt: [-2, 1], name: "P" }, { pt: [3, -3], name: "P'", c: "blue", at: "se" }], { u: 26, alt: "Arrows from P: 5 right, then 4 down, to P-prime." }),
                say: "Up or down: from $1$ to $-3$ is **4 down**, so $-4$." },
              { m: "(x, y) \\to (x + 5, y - 4)", say: "That's the translation." }] },
            gate: true,
            then: "Image minus pre-image: new minus old, for $x$ and for $y$." },
          { type: "pair", prompt: "A translation takes $(4, -3)$ to $(6, 1)$. How far did it move? Give it as $(a, b)$ in the rule $(x, y) \\to (x + a, y + b)$ — a negative number means left or down.",
            skill: "Determining translations", placeholder: "(a, b)",
            art: grid([-1, 8], [-5, 3], [{ pt: [4, -3], name: "P" }, { pt: [6, 1], name: "P'", c: "blue" }], { u: 26, alt: "Point P at (4, −3) and its image P-prime at (6, 1)." }),
            answer: [2, 4],
            near: [{ v: [-2, -4], fb: "That's the way back, from $P'$ to $P$. Subtract new minus old: $6 - 4$ and $1 - (-3)$." }, { v: [6, 1], fb: "That's where $P'$ is. The question asks how far it **moved**." }],
            hints: ["Across: new minus old, $6 - 4$.", "Up: new minus old, $1 - (-3) = 1 + 3$."],
            why: "$6 - 4 = 2$ and $1 - (-3) = 4$: 2 right and 4 up, so $(x, y) \\to (x + 2, y + 4)$." },
          { type: "choice", prompt: "Which rule describes this translation?", skill: "Determining translations",
            art: grid([-6, 6], [-1, 6], [pre(TRI), img(shift(TRI, -5, 2))], { u: 26, alt: "Grey triangle ABC on the right, blue triangle A-prime B-prime C-prime up and to the left." }),
            options: [{ t: "$(x, y) \\to (x - 5, y + 2)$" },
                      { t: "$(x, y) \\to (x + 5, y + 2)$", fb: "The image is to the **left**, so $x$ goes down." },
                      { t: "$(x, y) \\to (x - 2, y + 5)$", fb: "Those are swapped. Follow $A$ to $A'$: how far across, and how far up?" },
                      { t: "$(x, y) \\to (x - 5, y - 2)$", fb: "The image is **higher**, so $y$ goes up." }],
            answer: 0,
            hints: ["Follow one corner: $A$ is at $(1, 1)$ and $A'$ is at $(-4, 3)$.", "That's 5 left and 2 up."],
            why: "$A(1, 1) \\to A'(-4, 3)$: 5 left and 2 up, and every other corner moves the same way." },
          { type: "move", prompt: "Now slide a whole figure. Move the blue triangle onto the green outline.",
            kind: "translate", shape: TRI, target: shift(TRI, -4, 2), x: [-8, 8], y: [-6, 6], skill: "Translating shapes",
            hints: ["Watch one corner. $A$ starts at $(1, 1)$. The matching corner of the green outline — the one with the square corner — is at $(-3, 3)$.",
                    "That's 4 left and 2 up: press ← four times and ↑ twice."],
            why: "Every corner moves 4 left and 2 up: $(x, y) \\to (x - 4, y + 2)$." },
          { type: "learn", kicker: "What stays the same",
            prompt: "Join each corner to its image and look at the arrows.",
            art: grid([0, 9], [0, 6], TRI.map(function (p) { return { arrow: [p, [p[0] + 4, p[1] + 2]] }; }).concat([pre(TRI), img(shift(TRI, 4, 2))]),
                      { u: 30, cap: "Every arrow: 4 right and 2 up.", alt: "Triangle ABC and its image 4 right and 2 up, with three arrows, one from each corner, all parallel and the same length." }),
            after: "Every point moves the same distance in the same direction, so the arrows are all **parallel** and all the **same length**. <br><br>The triangle itself doesn't change: same side lengths, same angles, facing the same way. Only its position does." },
          { type: "choice", prompt: "A translation takes $P$ to $P'$ and $Q$ to $Q'$. What must be true of the segments $\\overline{PP'}$ and $\\overline{QQ'}$?", skill: "Properties of translations",
            options: [{ t: "They are parallel and the same length" },
                      { t: "They meet at a point", fb: "That's a rotation's centre. In a translation everything moves the same way, so those segments never meet." },
                      { t: "They are perpendicular", fb: "Every point slides in the **same** direction, so the segments point the same way." }],
            answer: 0,
            why: "Each segment is the same slide — the same distance in the same direction." },
          { type: "num", prompt: "A translation takes $\\overline{AB}$, which is 5 units long, to $\\overline{A'B'}$. How long is $\\overline{A'B'}$?", skill: "Properties of translations",
            answer: 5, label: "Length",
            hints: ["Does sliding a pencil across a desk change its length?"],
            why: "A translation changes position and nothing else, so $A'B' = AB = 5$." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Rotations", v: 2,
        blurb: "Turn it about a point: which way, how far, and why a quarter turn swaps the coordinates.",
        mins: 13,
        steps: [
          { type: "learn", kicker: "Try it",
            prompt: "A **rotation** turns a figure about a fixed point, the **centre of rotation**. <br><br>Turn this triangle both ways and watch corner $A$.",
            scene: { type: "move", kind: "rotate", shape: [[1, 1], [3, 1], [3, 2]], center: [0, 0], x: [-5, 5], y: [-5, 5], gate: true },
            gate: true,
            then: "Corner $A$ stays the same distance from the centre (the dotted lines) — every point travels round on its own circle. The triangle turns, but its size never changes." },
          { type: "learn", kicker: "Which way?",
            prompt: "A rotation is **counterclockwise** — the opposite way to a clock's hands — unless it says otherwise.",
            art: FS([plain([-2.4, 2.4], [-2.4, 2.4], [{ centre: [0, 0], say: "" }, { turn: [[0, 0], 1.6, 0, 90], say: "90°" }, { pt: [1.6, 0], c: "soft" }, { pt: [0, 1.6], c: "blue" }],
                           { u: 40, cap: "$90^\\circ$ **counterclockwise**, or just $90^\\circ$", alt: "An arrow curving a quarter turn counterclockwise about a centre." }),
                     plain([-2.4, 2.4], [-2.4, 2.4], [{ centre: [0, 0], say: "" }, { turn: [[0, 0], 1.6, 0, -90], cw: true, say: "90°" }, { pt: [1.6, 0], c: "soft" }, { pt: [0, -1.6], c: "blue" }],
                           { u: 40, cap: "$90^\\circ$ **clockwise**, also written $-90^\\circ$", alt: "An arrow curving a quarter turn clockwise about a centre." })]),
            after: "A quarter turn is $90^\\circ$, a half turn $180^\\circ$, a full turn $360^\\circ$ — which brings everything back where it started." },
          { type: "choice", prompt: "A rotation of $-90^\\circ$ is the same as…", skill: "Rotating points",
            options: [{ t: "$90^\\circ$ clockwise" }, { t: "$90^\\circ$ counterclockwise", fb: "The minus sign means the other way from normal — and normal is counterclockwise." },
                      { t: "$180^\\circ$", fb: "$180^\\circ$ is a half turn. $-90^\\circ$ is a quarter turn." }],
            answer: 0, keep: true,
            why: "Positive angles turn counterclockwise, so a negative angle turns clockwise." },
          { type: "learn", kicker: "Watch: a quarter turn about the origin",
            prompt: "Here's why a $90^\\circ$ turn about the origin has a simple rule.",
            scene: { type: "walk", rows: [
              { m: "P(4, 1)", fig: grid([-3, 6], [-1, 6], [{ steps: [[0, 0], [4, 1]] }, { pt: [4, 1], name: "P" }, { centre: [0, 0], say: "" }], { u: 28, alt: "A path from the origin: 4 right, then 1 up, to P." }),
                say: "Get to $P(4, 1)$ from the origin: **4 right**, then **1 up**." },
              { fig: grid([-3, 6], [-1, 6], [{ steps: [[0, 0], [4, 1]], c: "soft" }, { arrow: [[0, 0], [0, 4]], say: "4 up" }, { arrow: [[0, 4], [-1, 4]], say: "1 left" },
                                             { turn: [[0, 0], 2.2, 10, 95], c: "soft", dash: "3 4" }, { pt: [4, 1], name: "P" }, { centre: [0, 0], say: "" }], { u: 28, alt: "The same path turned a quarter turn: 4 up, then 1 left." }),
                say: "Turn the whole path a quarter turn counterclockwise. **Right** turns into **up**, and **up** turns into **left**." },
              { m: "P'(-1, 4)", fig: grid([-3, 6], [-1, 6], [{ steps: [[0, 0], [4, 1]], c: "soft" }, { arrow: [[0, 0], [0, 4]], say: "4 up" }, { arrow: [[0, 4], [-1, 4]], say: "1 left" },
                                                             { pt: [4, 1], name: "P" }, { pt: [-1, 4], name: "P'", c: "blue", at: "nw" }, { centre: [0, 0], say: "" }], { u: 28, alt: "The turned path ends at P-prime, (−1, 4)." }),
                say: "So the turned path ends at $P'(-1, 4)$: 1 left, 4 up." },
              { m: "(x, y) \\to (-y, x)", say: "The two numbers **swap places**, and the new first number **changes sign**. That's $90^\\circ$ counterclockwise about the origin." }] },
            gate: true,
            then: "Check it on $(4, 1)$: swap to $(1, 4)$, then change the sign of the first number: $(-1, 4)$." },
          { type: "pair", prompt: "Your turn. Rotate $(3, 5)$ by $90^\\circ$ counterclockwise about the origin.", skill: "Rotating points",
            art: grid([-6, 6], [-1, 6], [{ pt: [3, 5], name: "P" }, { centre: [0, 0], say: "" }], { u: 24, alt: "Point P at (3, 5), and the origin marked as the centre." }),
            answer: [-5, 3],
            near: [{ v: [5, 3], fb: "You swapped them — now the new first number changes sign." }, { v: [5, -3], fb: "That's a quarter turn **clockwise**. Counterclockwise: swap, then make the **first** number change sign." }],
            hints: ["Path from the origin: 3 right, 5 up. Turned a quarter counterclockwise: 3 up, 5 left.", "Or use the rule $(x, y) \\to (-y, x)$: swap to $(5, 3)$, then change the sign of the first."],
            why: "$(3, 5) \\to (-5, 3)$." },
          { type: "learn", kicker: "Half turns and clockwise turns",
            prompt: "The same trick gives the other two rules.",
            scene: { type: "walk", rows: [
              { m: "(x, y) \\to (-x, -y)", fig: grid([-5, 5], [-5, 5], [{ seg: [[4, 1], [-4, -1]], c: "soft", dash: "3 4" }, { pt: [4, 1], name: "P" }, { pt: [-4, -1], name: "P'", c: "blue", at: "sw" }, { centre: [0, 0], say: "" }],
                                                          { u: 24, alt: "P at (4, 1) and its half-turn image at (−4, −1), straight through the origin." }),
                say: "A **half turn**, $180^\\circ$, sends a point straight through the centre to the other side: **both** signs change. $(4, 1) \\to (-4, -1)$." },
              { m: "(x, y) \\to (y, -x)", fig: grid([-5, 5], [-5, 5], [{ turn: [[0, 0], 2.2, 5, -80], cw: true }, { pt: [4, 1], name: "P" }, { pt: [1, -4], name: "P'", c: "blue", at: "se" }, { centre: [0, 0], say: "" }],
                                                         { u: 24, alt: "P at (4, 1) and its image after a quarter turn clockwise, at (1, −4)." }),
                say: "A **quarter turn clockwise** ($-90^\\circ$): swap them, and the new **second** number changes sign. $(4, 1) \\to (1, -4)$." },
              { fig: grid([-5, 5], [-5, 5], [{ pt: [4, 1], name: "P" }, { pt: [-1, 4], name: "90°", c: "blue", at: "nw" }, { pt: [-4, -1], name: "180°", c: "blue", at: "sw" }, { pt: [1, -4], name: "−90°", c: "blue", at: "se" }, { centre: [0, 0], say: "" }],
                         { u: 24, alt: "P at (4, 1), with its images after 90, 180 and minus 90 degree turns about the origin." }),
                say: "All four together: each quarter turn moves the point round to the next spot, the same distance from the centre." }] },
            gate: true,
            then: "Can't remember a rule? Sketch the point, draw its path from the origin, and turn the path. The picture always tells you." },
          { type: "pair", prompt: "Rotate $(-2, 6)$ by $180^\\circ$ about the origin.", skill: "Rotating points",
            art: grid([-7, 7], [-7, 7], [{ pt: [-2, 6], name: "P" }, { centre: [0, 0], say: "" }], { u: 18, alt: "Point P at (−2, 6) and the origin marked." }),
            answer: [2, -6],
            near: [{ v: [-6, 2], fb: "A half turn doesn't swap the numbers — it just changes both signs." }, { v: [2, 6], fb: "Both signs change in a half turn, not just one." }],
            hints: ["A half turn is $(x, y) \\to (-x, -y)$.", "Change both signs."],
            why: "$(-2, 6) \\to (2, -6)$ — directly opposite, through the origin." },
          { type: "pair", prompt: "Rotate $(5, -3)$ by $90^\\circ$ **clockwise** about the origin.", skill: "Rotating points",
            art: grid([-7, 7], [-7, 7], [{ pt: [5, -3], name: "P" }, { centre: [0, 0], say: "" }], { u: 18, alt: "Point P at (5, −3) and the origin marked." }),
            answer: [-3, -5],
            near: [{ v: [3, 5], fb: "That's a quarter turn **counterclockwise**. Clockwise: swap, then change the sign of the **second** number." }, { v: [-3, 5], fb: "Swapped — good. Now change the sign of the second number." }],
            hints: ["Clockwise quarter turn: $(x, y) \\to (y, -x)$.", "Swap to $(-3, 5)$, then change the sign of the second number."],
            why: "$(5, -3) \\to (-3, -5)$." },
          { type: "choice", prompt: "A rotation about the origin takes $P$ to $P'$. What rotation is it?", skill: "Determining rotations",
            art: grid([-5, 5], [-5, 5], [{ pt: [3, 2], name: "P" }, { pt: [-2, 3], name: "P'", c: "blue", at: "nw" }, { centre: [0, 0], say: "" }], { u: 24, alt: "P at (3, 2) and P-prime at (−2, 3)." }),
            options: [{ t: "$90^\\circ$ counterclockwise" }, { t: "$90^\\circ$ clockwise", fb: "That would take $(3, 2)$ to $(2, -3)$, below the $x$-axis." },
                      { t: "$180^\\circ$", fb: "A half turn would take $(3, 2)$ to $(-3, -2)$, in the opposite corner." }],
            answer: 0, keep: true,
            hints: ["Try each rule on $P(3, 2)$ and see which lands on $P'(-2, 3)$.", "$90^\\circ$ counterclockwise: $(x, y) \\to (-y, x)$."],
            why: "$(3, 2) \\to (-2, 3)$ is $(x, y) \\to (-y, x)$: $90^\\circ$ counterclockwise." },
          { type: "move", prompt: "Turn the blue triangle about the origin onto the green outline.",
            kind: "rotate", shape: TRI, target: turn(TRI, -1), center: [0, 0], x: [-6, 6], y: [-6, 6], skill: "Rotating shapes",
            hints: ["Watch corner $A$ at $(1, 1)$. Where is the square corner of the green outline?", "It's at $(1, -1)$: a quarter turn **clockwise**. Press ↻ once."],
            why: "A $90^\\circ$ clockwise turn: $(x, y) \\to (y, -x)$ sends $(1, 1)$, $(4, 1)$, $(1, 3)$ to $(1, -1)$, $(1, -4)$, $(3, -1)$." },
          { type: "learn", kicker: "A step on",
            prompt: "The centre doesn't have to be the origin. Then measure everything from the centre instead.",
            scene: { type: "walk", rows: [
              { fig: grid([-2, 6], [-1, 6], [{ steps: [[1, 1], [4, 1]] }, { pt: [4, 1], name: "P", at: "ne" }, { centre: [1, 1], at: "sw" }], { u: 28, alt: "Centre at (1, 1) and P at (4, 1), 3 to its right." }),
                m: "C(1, 1),\\; P(4, 1)", say: "Centre $C(1, 1)$. $P$ is **3 right** of the centre." },
              { fig: grid([-2, 6], [-1, 6], [{ steps: [[1, 1], [4, 1]], c: "soft" }, { arrow: [[1, 1], [1, 4]], say: "3 up" }, { turn: [[1, 1], 3, 3, 87], c: "soft", dash: "3 4" },
                                             { pt: [4, 1], name: "P", at: "ne" }, { pt: [1, 4], name: "P'", c: "blue", at: "nw" }, { centre: [1, 1], at: "sw" }], { u: 28, alt: "After a quarter turn counterclockwise about C, P-prime is 3 up from C, at (1, 4)." }),
                m: "P'(1, 1 + 3) = P'(1, 4)", say: "A quarter turn counterclockwise: **3 right** becomes **3 up** — from the centre." }] },
            gate: true },
          { type: "move", prompt: "Turn the triangle $180^\\circ$ about the centre $(1, 1)$ onto the green outline.",
            kind: "rotate", shape: [[2, 1], [4, 1], [2, 2]], target: turn([[2, 1], [4, 1], [2, 2]], 2, [1, 1]), center: [1, 1], x: [-4, 6], y: [-3, 5], skill: "Rotating shapes",
            hints: ["In a half turn each corner ends up on the other side of the centre, the same distance away.", "$A$ is 1 right of the centre, so $A'$ is 1 left of it, at $(0, 1)$. Press ↺ twice."],
            why: "Each corner went straight through the centre $(1, 1)$ to the other side: $A(2, 1) \\to A'(0, 1)$." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Reflections", v: 2,
        blurb: "Flip it over a line: the same distance from the mirror, on the other side.",
        mins: 13,
        steps: [
          { type: "learn", kicker: "Try it",
            prompt: "A **reflection** flips a figure over a line — the **line of reflection** — like a mirror. <br><br>Try each line and watch which way the triangle faces.",
            scene: { type: "move", kind: "reflect", shape: TRI, x: [-6, 6], y: [-6, 6], gate: true },
            gate: true,
            then: "Each corner lands the same distance from the mirror, straight across on the other side. The size stays the same, but the figure now faces the other way: a mirror image." },
          { type: "learn", kicker: "Watch: over an axis",
            prompt: "Over the axes, you can count.",
            scene: { type: "walk", rows: [
              { m: "P(3, 2)", fig: grid([-5, 5], [-4, 4], [{ mirror: "x" }, { seg: [[3, 2], [3, 0]], c: "orange", dash: "4 4" }, { text: "2", at: [3.35, 0.9], c: "orange", anchor: "start" }, { pt: [3, 2], name: "P" }], { u: 26, alt: "P at (3, 2), 2 above the x-axis." }),
                say: "$P(3, 2)$ is **2 above** the $x$-axis." },
              { m: "P'(3, -2)", fig: grid([-5, 5], [-4, 4], [{ mirror: "x" }, { seg: [[3, 2], [3, -2]], c: "orange", dash: "4 4" }, { text: "2", at: [3.35, 0.9], c: "orange", anchor: "start" }, { text: "2", at: [3.35, -1.1], c: "orange", anchor: "start" },
                                                              { pt: [3, 2], name: "P" }, { pt: [3, -2], name: "P'", c: "blue", at: "se" }], { u: 26, alt: "P-prime is 2 below the x-axis, at (3, −2)." }),
                say: "Its image is **2 below**, straight across the mirror: $P'(3, -2)$." },
              { m: "(x, y) \\to (x, -y)", say: "Over the $x$-axis, $x$ stays the same and $y$ changes sign." },
              { m: "(x, y) \\to (-x, y)", fig: grid([-5, 5], [-4, 4], [{ mirror: "y" }, { seg: [[-4, 1], [4, 1]], c: "orange", dash: "4 4" }, { pt: [-4, 1], name: "Q", at: "nw" }, { pt: [4, 1], name: "Q'", c: "blue" }], { u: 26, alt: "Q at (−4, 1) and its image over the y-axis at (4, 1)." }),
                say: "Over the $y$-axis it's the other way round: $y$ stays and $x$ changes sign. $Q(-4, 1) \\to Q'(4, 1)$." }] },
            gate: true,
            then: "The number that changes sign is the one that measures distance **from** the mirror." },
          { type: "pair", prompt: "Reflect $(5, 2)$ over the $x$-axis.", skill: "Reflecting points",
            art: grid([-7, 7], [-4, 4], [{ mirror: "x" }, { pt: [5, 2], name: "P" }], { u: 22, alt: "Point P at (5, 2) and the x-axis as the mirror." }),
            answer: [5, -2],
            near: [{ v: [-5, 2], fb: "That's over the $y$-axis. Over the $x$-axis, the point goes straight **down** across it: $x$ stays." }, { v: [-5, -2], fb: "Only one number changes. Over the $x$-axis, $x$ stays the same." }],
            hints: ["$P$ is 2 above the $x$-axis. Its image is 2 below it.", "$x$ stays 5; $y$ changes sign."],
            why: "$(5, 2) \\to (5, -2)$ — the same distance below the axis as it was above." },
          { type: "pair", prompt: "Reflect $(-3, 7)$ over the $y$-axis.", skill: "Reflecting points",
            art: grid([-8, 8], [-2, 8], [{ mirror: "y" }, { pt: [-3, 7], name: "P", at: "nw" }], { u: 18, alt: "Point P at (−3, 7) and the y-axis as the mirror." }),
            answer: [3, 7],
            near: [{ v: [-3, -7], fb: "That's over the $x$-axis. Over the $y$-axis the point goes straight **across**: $y$ stays." }],
            hints: ["$P$ is 3 to the left of the $y$-axis. Its image is 3 to the right.", "$y$ stays 7; $x$ changes sign."],
            why: "$(-3, 7) \\to (3, 7)$." },
          { type: "learn", kicker: "Watch: over a diagonal",
            prompt: "The line $y = x$ runs diagonally through $(1, 1)$, $(2, 2)$, $(3, 3)$ and so on.",
            scene: { type: "walk", rows: [
              { fig: grid([-5, 5], [-5, 5], [{ mirror: "yx" }, { pt: [4, 1], name: "P", at: "se" }], { u: 24, alt: "P at (4, 1) and the diagonal line y = x." }),
                m: "P(4, 1)", say: "Here's $P(4, 1)$ and the mirror $y = x$." },
              { fig: grid([-5, 5], [-5, 5], [{ mirror: "yx" }, { seg: [[4, 1], [1, 4]], c: "orange", dash: "4 4" }, { angle: [[4, 1], [2.5, 2.5], [4, 4]], right: true, c: "orange" },
                                             { pt: [4, 1], name: "P", at: "se" }, { pt: [1, 4], name: "P'", c: "blue", at: "nw" }], { u: 24, alt: "P at (4, 1) and P-prime at (1, 4), joined by a dashed line that crosses y = x at a right angle." }),
                m: "P'(1, 4)", say: "Go straight across the mirror, at a right angle, the same distance: you land on $(1, 4)$." },
              { m: "(x, y) \\to (y, x)", say: "Over $y = x$, the two numbers simply **swap**." },
              { m: "(x, y) \\to (-y, -x)", fig: grid([-5, 5], [-5, 5], [{ mirror: "y-x" }, { seg: [[4, 1], [-1, -4]], c: "orange", dash: "4 4" }, { pt: [4, 1], name: "P", at: "ne" }, { pt: [-1, -4], name: "P'", c: "blue", at: "sw" }], { u: 24, alt: "P at (4, 1) and its image over y = −x at (−1, −4)." }),
                say: "Over the other diagonal, $y = -x$: swap them **and** change both signs. $(4, 1) \\to (-1, -4)$." }] },
            gate: true },
          { type: "pair", prompt: "Reflect $(2, 6)$ over the line $y = x$.", skill: "Reflecting points",
            art: grid([-1, 7], [-1, 7], [{ mirror: "yx" }, { pt: [2, 6], name: "P", at: "nw" }], { u: 26, alt: "Point P at (2, 6) and the line y = x." }),
            answer: [6, 2],
            near: [{ v: [-6, -2], fb: "That's over $y = -x$. Over $y = x$ the numbers just swap — no sign changes." }],
            hints: ["Over $y = x$, the coordinates swap places."],
            why: "$(2, 6) \\to (6, 2)$." },
          { type: "learn", kicker: "Watch: any flat or upright line",
            prompt: "A mirror can be any horizontal or vertical line, like $x = 2$ (every point with $x$ equal to 2). Count to it, then the same again past it.",
            scene: { type: "walk", rows: [
              { m: "P(5, 3)", fig: grid([-2, 6], [-1, 5], [{ mirror: { x: 2 } }, { seg: [[5, 3], [2, 3]], c: "orange", dash: "4 4" }, { text: "3", at: [3.5, 3.3], c: "orange" }, { pt: [5, 3], name: "P" }], { u: 28, alt: "P at (5, 3), 3 to the right of the line x = 2." }),
                say: "$P(5, 3)$ is **3 to the right** of the line $x = 2$." },
              { m: "x = 2 - 3 = -1", fig: grid([-2, 6], [-1, 5], [{ mirror: { x: 2 } }, { seg: [[5, 3], [-1, 3]], c: "orange", dash: "4 4" }, { text: "3", at: [3.5, 3.3], c: "orange" }, { text: "3", at: [0.5, 3.3], c: "orange" },
                                                                   { pt: [5, 3], name: "P" }, { pt: [-1, 3], name: "P'", c: "blue", at: "nw" }], { u: 28, alt: "P-prime is 3 to the left of the line, at (−1, 3)." }),
                say: "Its image is **3 to the left** of the line." },
              { m: "P'(-1, 3)", say: "The height doesn't change, so $P'$ is $(-1, 3)$." }] },
            gate: true },
          { type: "pair", prompt: "Reflect $(1, 4)$ over the line $y = 2$.", skill: "Reflecting points",
            art: grid([-3, 5], [-2, 6], [{ mirror: { y: 2 } }, { pt: [1, 4], name: "P" }], { u: 26, alt: "Point P at (1, 4) and the horizontal line y = 2." }),
            answer: [1, 0],
            near: [{ v: [1, -4], fb: "That's over the $x$-axis. Here the mirror is $y = 2$: count from **it**." }],
            hints: ["The point is 2 above the line $y = 2$.", "So its image is 2 below the line: $y = 2 - 2 = 0$. The $x$ stays 1."],
            why: "$(1, 4)$ is 2 above $y = 2$, so its image is 2 below: $(1, 0)$." },
          { type: "learn", kicker: "Finding the mirror",
            prompt: "Given a point and its image, where's the mirror?",
            art: grid([-1, 7], [0, 6], [{ mirror: { x: 3 } }, { seg: [[1, 3], [3, 3]], c: "orange", marks: 1 }, { seg: [[3, 3], [5, 3]], c: "orange", marks: 1 },
                                        { angle: [[5, 3], [3, 3], [3, 4]], right: true, c: "orange" }, { pt: [1, 3], name: "A", at: "nw" }, { pt: [5, 3], name: "A'", c: "blue" }],
                       { u: 30, alt: "A at (1, 3) and A-prime at (5, 3). The mirror x = 3 crosses the segment between them at its middle, at a right angle." }),
            after: "The mirror crosses the segment from a point to its image **exactly halfway**, and at a **right angle**. <br><br>So find the point halfway between them, and the mirror goes through it, square to the segment." },
          { type: "choice", prompt: "A reflection takes $A$ to $A'$. What is the line of reflection?", skill: "Determining reflections",
            art: grid([-4, 6], [-2, 4], [{ pt: [-2, 1], name: "A", at: "nw" }, { pt: [4, 1], name: "A'", c: "blue" }], { u: 26, alt: "A at (−2, 1) and A-prime at (4, 1)." }),
            options: [{ t: "The line $x = 1$" }, { t: "The line $x = 2$", fb: "Halfway between $-2$ and $4$ isn't 2. Count: each is 3 away from 1." },
                      { t: "The line $y = 1$", fb: "That line runs flat through both points. A mirror has to cross the segment between them." },
                      { t: "The $y$-axis", fb: "$A$ is 2 left of the $y$-axis, but $A'$ is 4 right of it — not the same distance." }],
            answer: 0,
            hints: ["The mirror is halfway between $A$ and $A'$.", "Halfway between $x = -2$ and $x = 4$: $(-2 + 4) \\div 2 = 1$."],
            why: "Both points are 3 away from $x = 1$, on opposite sides, and $x = 1$ crosses the segment at a right angle." },
          { type: "move", prompt: "Flip the blue triangle onto the green outline. Pick the right mirror.",
            kind: "reflect", shape: TRI, target: flip(TRI, { x: -1 }), lines: ["x", "y", { x: -1 }, "yx"], x: [-7, 6], y: [-4, 5], skill: "Reflecting shapes",
            hints: ["The outline is to the left, at the same height — so the mirror is an upright line, $x = $ something.",
                    "$A(1, 1)$ matches the square corner of the outline at $(-3, 1)$. Halfway between them is $x = -1$."],
            why: "Each corner is the same distance from $x = -1$ as its image, on the other side." },
          { type: "choice", prompt: "A point sits **on** the line of reflection. Where is its image?", skill: "Determining reflections",
            options: [{ t: "Exactly where the point is" }, { t: "Across on the other side", fb: "It's 0 away from the mirror, so it goes 0 across." },
                      { t: "It has no image", fb: "Every point has an image. This one is its own image." }],
            answer: 0, keep: true,
            why: "Its distance from the mirror is 0, so the reflection leaves it where it is." }
        ]
      },
      /* ============================================================== 7 */
      {
        title: "Dilations", v: 2,
        blurb: "Resize it from a centre: the scale factor, a centre that isn't the origin, and finding the centre.",
        mins: 14,
        steps: [
          { type: "learn", kicker: "Try it",
            prompt: "A **dilation** resizes a figure from a fixed point, the **centre of dilation**. The **scale factor** says by how much: 2 means twice as big. <br><br>Double the triangle and halve it, and watch the dotted lines.",
            scene: { type: "move", kind: "dilate", shape: [[1, 1], [3, 1], [1, 2]], center: [0, 0], x: [-2, 8], y: [-2, 6], gate: true },
            gate: true,
            then: "Every corner slides along a line from the centre. A scale factor **more than 1** makes it bigger; **between 0 and 1**, smaller. The angles never change, so the shape stays the same." },
          { type: "learn", kicker: "Watch: about the origin",
            prompt: "When the centre is the origin, dilating is multiplying.",
            scene: { type: "walk", rows: [
              { m: "P(2, 1),\\; k = 3", fig: grid([-1, 7], [-1, 4], [{ ray: [[0, 0], [2, 1]], c: "soft", dash: "3 4" }, { steps: [[0, 0], [2, 1]] }, { pt: [2, 1], name: "P", at: "nw" }, { centre: [0, 0], say: "" }], { u: 30, alt: "P at (2, 1): 2 right and 1 up from the origin." }),
                say: "$P(2, 1)$ is 2 right and 1 up from the centre. The scale factor is $k = 3$." },
              { m: "(2 \\times 3,\\; 1 \\times 3)", fig: grid([-1, 7], [-1, 4], [{ ray: [[0, 0], [2, 1]], c: "soft", dash: "3 4" }, { steps: [[0, 0], [6, 3]] }, { pt: [2, 1], name: "P", at: "nw" }, { pt: [6, 3], name: "P'", c: "blue", at: "nw" }, { centre: [0, 0], say: "" }],
                                                          { u: 30, alt: "P-prime at (6, 3): 6 right and 3 up, on the same line from the origin as P." }),
                say: "Three times as far: **6 right** and **3 up**. $P'(6, 3)$ is on the same line from the centre, 3 times as far out." },
              { m: "(x, y) \\to (kx, ky)", say: "About the origin, multiply **both** coordinates by the scale factor." }] },
            gate: true },
          { type: "pair", prompt: "Dilate $(4, -6)$ about the origin by a scale factor of $\\frac{1}{2}$.", skill: "Dilating points",
            art: grid([-2, 6], [-7, 1], [{ ray: [[0, 0], [4, -6]], c: "soft", dash: "3 4" }, { pt: [4, -6], name: "P", at: "se" }, { centre: [0, 0], say: "" }], { u: 26, alt: "Point P at (4, −6) and the origin as the centre." }),
            answer: [2, -3],
            near: [{ v: [8, -12], fb: "That doubled it. A scale factor of $\\frac{1}{2}$ **halves** each coordinate." }],
            hints: ["Multiply both coordinates by $\\frac{1}{2}$ — that is, halve them.", "$4 \\div 2 = 2$ and $-6 \\div 2 = -3$."],
            why: "$(4 \\times \\tfrac{1}{2},\\; -6 \\times \\tfrac{1}{2}) = (2, -3)$ — halfway to the origin." },
          { type: "pair", prompt: "Dilate $(-2, 1)$ about the origin by a scale factor of 3.", skill: "Dilating points",
            answer: [-6, 3],
            near: [{ v: [1, 4], fb: "A dilation **multiplies** — it doesn't add." }, { v: [-6, 1], fb: "Multiply **both** coordinates." }],
            hints: ["Multiply both coordinates by 3, signs and all."],
            why: "$(-2 \\times 3,\\; 1 \\times 3) = (-6, 3)$." },
          { type: "learn", kicker: "A step on: another centre",
            prompt: "When the centre isn't the origin, measure from the **centre**.",
            scene: { type: "walk", rows: [
              { m: "C(1, 2),\\; P(3, 3)", fig: grid([-1, 6], [0, 5], [{ steps: [[1, 2], [3, 3]] }, { pt: [3, 3], name: "P", at: "nw" }, { centre: [1, 2], at: "sw" }], { u: 32, alt: "Centre C at (1, 2) and P at (3, 3): 2 right and 1 up from C." }),
                say: "Centre $C(1, 2)$, scale factor 2. First, how far is $P$ from the centre? **2 right, 1 up**." },
              { m: "2 \\times 2 = 4,\\; 1 \\times 2 = 2", fig: grid([-1, 6], [0, 5], [{ steps: [[1, 2], [5, 4]] }, { pt: [3, 3], name: "P", at: "nw" }, { centre: [1, 2], at: "sw" }], { u: 32, alt: "From C: 4 right and 2 up." }),
                say: "Multiply those by the scale factor: **4 right, 2 up**." },
              { m: "P'(1 + 4,\\; 2 + 2) = P'(5, 4)", fig: grid([-1, 6], [0, 5], [{ ray: [[1, 2], [3, 3]], c: "soft", dash: "3 4" }, { pt: [3, 3], name: "P", at: "nw" }, { pt: [5, 4], name: "P'", c: "blue", at: "nw" }, { centre: [1, 2], at: "sw" }], { u: 32, alt: "P-prime at (5, 4), on the line from C through P, twice as far out." }),
                say: "Count that out from the centre. $P'$ lands on the line from $C$ through $P$, twice as far out." }] },
            gate: true,
            then: "The slip to watch for: measuring from the origin when the centre is somewhere else." },
          { type: "pair", prompt: "Dilate $(5, 1)$ by a scale factor of 2 about the centre $(3, -1)$.", skill: "Dilating points",
            art: grid([-1, 8], [-2, 4], [{ pt: [5, 1], name: "P" }, { centre: [3, -1], at: "sw" }], { u: 28, alt: "Point P at (5, 1) and the centre at (3, −1)." }),
            answer: [7, 3],
            near: [{ v: [10, 2], fb: "That's twice as far from the **origin**. Measure from the centre $(3, -1)$ instead." }],
            hints: ["From the centre $(3, -1)$ to $P(5, 1)$ is 2 right and 2 up.", "Doubled: 4 right and 4 up, counted from the centre: $(3 + 4,\\; -1 + 4)$."],
            why: "$P$ is 2 right and 2 up from the centre; doubled, 4 right and 4 up: $(7, 3)$." },
          { type: "move", prompt: "Dilate the blue triangle about the centre $(-2, -1)$ onto the green outline.",
            kind: "dilate", shape: [[0, 0], [2, 0], [0, 1]], target: scale([[0, 0], [2, 0], [0, 1]], 2, [-2, -1]), center: [-2, -1], x: [-3, 7], y: [-2, 4], skill: "Dilating shapes",
            hints: ["The outline is bigger, so the scale factor is more than 1.", "Corner $A$ is 2 right and 1 up from the centre; the outline's matching corner is 4 right and 2 up. That's twice as far: press ×2."],
            why: "Every corner ends up twice as far from $(-2, -1)$, along the same line: scale factor 2." },
          { type: "learn", kicker: "Finding the scale factor",
            prompt: "Compare the same length in the image and in the pre-image.",
            scene: { type: "walk", rows: [
              { fig: grid([0, 10], [0, 7], [pre([[1, 1], [3, 1], [1, 2]]), { text: "2", at: [2, 0.35], c: "soft" }], { u: 28, alt: "Triangle ABC with its bottom side 2 long." }),
                say: "In the pre-image, the bottom side $\\overline{AB}$ is **2** long." },
              { fig: grid([0, 10], [0, 7], [pre([[1, 1], [3, 1], [1, 2]]), { text: "2", at: [2, 0.35], c: "soft" }, img([[3, 3], [9, 3], [3, 6]]), { text: "6", at: [6, 2.35], c: "blue" }], { u: 28, alt: "Its image, with the matching side 6 long." }),
                say: "In the image, the same side $\\overline{A'B'}$ is **6** long." },
              { m: "k = \\frac{\\text{image}}{\\text{pre-image}} = \\frac{6}{2} = 3", say: "Scale factor = image length ÷ pre-image length." }] },
            gate: true,
            then: "New over old. If the answer is less than 1, the figure shrank." },
          { type: "num", prompt: "The grey triangle was dilated onto the blue one. What is the scale factor?", skill: "Dilations: scale factor",
            art: grid([0, 7], [0, 5], [pre([[2, 2], [6, 2], [2, 4]]), img([[1, 1], [3, 1], [1, 2]])], { u: 30, alt: "A large grey triangle with a bottom side 4 long, and a small blue triangle with a bottom side 2 long." }),
            answer: 0.5, shown: "1/2", label: "Scale factor (a fraction or a decimal)",
            near: [{ v: 2, fb: "That's pre-image ÷ image. Divide the other way, image ÷ pre-image — the blue one is smaller, so $k$ is less than 1." }],
            hints: ["Count the bottom sides: grey is 4 long, blue is 2 long.", "Image ÷ pre-image $= 2 \\div 4$."],
            why: "$2 \\div 4 = \\frac{1}{2}$: the image is half the size." },
          { type: "num", prompt: "A dilation about the origin takes $(3, 1)$ to $(12, 4)$. What is the scale factor?", skill: "Dilations: scale factor",
            answer: 4, label: "Scale factor",
            near: [{ v: 9, fb: "That's the difference, $12 - 3$. A dilation **multiplies**: what times 3 gives 12?" }],
            hints: ["Divide an image coordinate by the one it came from: $12 \\div 3$.", "Check with the other coordinate: $4 \\div 1$."],
            why: "$12 \\div 3 = 4$ and $4 \\div 1 = 4$, so $k = 4$." },
          { type: "learn", kicker: "Finding the centre",
            prompt: "Given a figure and its dilation, where's the centre?",
            scene: { type: "walk", rows: [
              { fig: grid([-5, 6], [-4, 3], [pre([[-1, -1], [1, -1], [-1, 0]]), img([[1, 0], [5, 0], [1, 2]])], { u: 28, alt: "A small triangle ABC and a larger image." }),
                say: "Here's a triangle and its dilation." },
              { fig: grid([-5, 6], [-4, 3], [{ line: [[-1, -1], [1, 0]], bare: true, c: "orange", dash: "4 4" }, pre([[-1, -1], [1, -1], [-1, 0]]), img([[1, 0], [5, 0], [1, 2]])], { u: 28, alt: "A dashed line through A and A-prime." }),
                say: "Draw a line through $A$ and its image $A'$. The centre is somewhere on it." },
              { fig: grid([-5, 6], [-4, 3], [{ line: [[-1, -1], [1, 0]], bare: true, c: "orange", dash: "4 4" }, { line: [[1, -1], [5, 0]], bare: true, c: "orange", dash: "4 4" },
                                             pre([[-1, -1], [1, -1], [-1, 0]]), img([[1, 0], [5, 0], [1, 2]]), { centre: [-3, -2], at: "sw" }],
                         { u: 28, alt: "A second dashed line, through B and B-prime, crosses the first at (−3, −2)." }),
                m: "(-3, -2)", say: "Do the same for $B$ and $B'$. The lines cross at the **centre**: $(-3, -2)$." }] },
            gate: true },
          { type: "pair", prompt: "The grey triangle was dilated onto the blue one. What is the centre of dilation?", skill: "Dilations: centre",
            art: grid([-2, 8], [-4, 5], [pre([[2, -1], [3, -1], [2, 0]]), img([[4, 1], [7, 1], [4, 4]])], { u: 26, alt: "A small grey triangle and a blue one three times as big, up and to the right." }),
            answer: [1, -2],
            hints: ["Draw a line (in your head, or with a ruler on the screen) through $A$ and $A'$, and another through $B$ and $B'$.",
                    "Follow the line from $A'(4, 1)$ through $A(2, -1)$: each step is 1 left and 1 down.",
                    "Here are the lines: " + grid([-2, 8], [-4, 5], [{ line: [[2, -1], [4, 1]], bare: true, c: "orange", dash: "4 4" }, { line: [[3, -1], [7, 1]], bare: true, c: "orange", dash: "4 4" }, pre([[2, -1], [3, -1], [2, 0]]), img([[4, 1], [7, 1], [4, 4]]), { pt: [1, -2], c: "orange", r: 5 }], { u: 20, w: 260, alt: "Two dashed lines through matching corners cross at (1, −2)." })],
            why: "The lines through matching corners meet at $(1, -2)$, and the image is 3 times as far from there as the pre-image." },
          { type: "choice", kicker: "Find the error", prompt: "Sam dilates $P(4, 3)$ by a scale factor of 2 about the centre $(2, 1)$, and gets $(8, 6)$. What went wrong?", skill: "Dilating points",
            options: [{ t: "He doubled the distance from the origin, not from the centre" },
                      { t: "He should have added 2 instead of multiplying", fb: "A dilation does multiply — but it multiplies the distance from the **centre**." },
                      { t: "Nothing — it's right", fb: "$(8, 6)$ is twice as far from the origin. The centre here is $(2, 1)$." }],
            answer: 0,
            why: "From the centre $(2, 1)$, $P$ is 2 right and 2 up. Doubled: 4 right and 4 up, so $P' = (6, 5)$." }
        ]
      },
      /* ============================================================== 8 */
      {
        title: "Which move was it?", v: 2,
        blurb: "Telling the four apart from a picture, the tricky cases, and what each one keeps the same.",
        mins: 10,
        steps: [
          { type: "learn", kicker: "Putting it together",
            prompt: "Three questions, in order, settle which move it was.",
            scene: { type: "walk", rows: [
              { fig: flagPic(DPRE, DIMG, [], { alt: "A small flag and a flag twice its size." }), say: "**1. Did the size change?** Then it's a **dilation**." },
              { fig: flagPic(FL, flip(FL, "y"), [], { alt: "A flag and its mirror image." }), say: "**2. Same size — is it a mirror image?** Then it's a **reflection**." },
              { fig: flagPic(FL, turn(FL, 1), [], { alt: "A flag and the same flag turned on its side." }), say: "**3. Not a mirror image — is it turned?** Then it's a **rotation**." },
              { fig: flagPic(FL, shift(FL, -5, 1), [], { alt: "A flag and the same flag, facing the same way, further along." }), say: "**Otherwise** it only slid: a **translation**." }] },
            gate: true },
          whichMove("r", flagPic(FL, turn(FL, -1), [], { alt: "A grey flag in the top right and a blue flag below the x-axis, lying on its side." }), { skill: "Identifying transformations" }),
          whichMove("f", flagPic(shift(FLAG, 3, -2), flip(shift(FLAG, 3, -2), "yx"), [], { alt: "A grey flag and a blue flag, each a mirror image of the other across a diagonal." }), { skill: "Identifying transformations" }),
          { type: "choice", prompt: "A triangle with corners $(1, 1)$, $(4, 1)$, $(1, 3)$ has its image at $(2, 2)$, $(8, 2)$, $(2, 6)$. Which transformation?", skill: "Identifying transformations",
            art: grid([0, 9], [0, 7], [pre(TRI), img(scale(TRI, 2))], { u: 26, alt: "Triangle ABC and an image twice as big, further from the origin." }),
            options: [{ t: "A dilation, scale factor 2" },
                      { t: "A translation", fb: "Check a side: the bottom was 3 long and is now 6. A translation never changes a length." },
                      { t: "A rotation", fb: "Turning keeps every length, and these doubled." }],
            answer: 0,
            hints: ["Compare one side's length before and after."],
            why: "Every coordinate doubled: $(x, y) \\to (2x, 2y)$, a dilation about the origin with $k = 2$." },
          { type: "multi", kicker: "A tricky one", prompt: "The grey triangle is the same on its left and right halves. Which transformations could have moved it onto the blue one? Pick every one.", skill: "Identifying transformations",
            art: grid([-5, 5], [-1, 4], [pre([[1, 1], [3, 1], [2, 3]], false), img([[-3, 1], [-1, 1], [-2, 3]], false), { mirror: "y" }], { u: 26, alt: "A grey triangle pointing up on the right of the y-axis, and a matching blue one on the left." }),
            options: [{ t: "A translation 4 left", ok: true }, { t: "A reflection over the $y$-axis", ok: true },
                      { t: "A rotation", ok: false, fb: "Any turn would tip the triangle — its point would no longer face straight up." },
                      { t: "A dilation", ok: false, fb: "They're the same size, so it isn't a dilation." }],
            hints: ["Try each one. Slide it 4 left: does it land? Flip it over the $y$-axis: does it land?"],
            why: "Because this triangle is symmetrical, sliding it and flipping it give the same picture. With a lopsided shape — like the flag — you could tell them apart." },
          { type: "learn", kicker: "What each move keeps",
            prompt: "Every transformation changes where a figure is. Here's what each one leaves alone.",
            scene: { type: "walk", rows: [
              { say: "**Translation:** side lengths, angles, area — and it still faces the same way." },
              { say: "**Rotation:** side lengths, angles, area. It's turned, but not flipped." },
              { say: "**Reflection:** side lengths, angles, area — but it's flipped, so it faces the other way." },
              { say: "**Dilation:** the angles, so the **shape** stays the same. Every length is multiplied by the scale factor." }] },
            gate: true,
            then: "The first three are rigid, so the image is **congruent** to the pre-image: an exact copy. A dilation's image is **similar**: the same shape, a different size." },
          { type: "multi", prompt: "Which of these does **every** rigid transformation keep the same? Pick every one.", skill: "What each move keeps",
            options: [{ t: "Side lengths", ok: true }, { t: "Angle sizes", ok: true }, { t: "Area", ok: true },
                      { t: "Position on the grid", ok: false, fb: "Moving the figure is the whole point — position is what changes." },
                      { t: "Which way it faces", ok: false, fb: "A reflection is rigid, and it does flip a figure to face the other way." }],
            hints: ["Rigid means the figure itself doesn't change — only where it sits."],
            why: "Lengths, angles and area survive any rigid move. Position always changes, and a reflection also reverses which way it faces." },
          { type: "multi", prompt: "Which of these does a **dilation** with scale factor 3 keep the same? Pick every one.", skill: "What each move keeps",
            options: [{ t: "Angle sizes", ok: true }, { t: "The shape of the figure", ok: true },
                      { t: "Side lengths", ok: false, fb: "Every length is multiplied by 3 — that's what a dilation does." },
                      { t: "Area", ok: false, fb: "Triple the lengths and the area goes up 9 times, not 3." }],
            hints: ["A dilation is a resize. What survives a resize?"],
            why: "A dilation keeps the angles, and so the shape. Lengths are multiplied by $k$ and the area by $k^2$." },
          { type: "choice", prompt: "Maya dilates a triangle by a scale factor of 3 and says its angles are now three times as big. What's wrong?", skill: "What each move keeps",
            options: [{ t: "A dilation multiplies the lengths, not the angles — the angles stay the same" },
                      { t: "Nothing, that's right", fb: "Enlarge a photo and nothing tilts: every corner is the same angle as before." },
                      { t: "The angles get three times smaller", fb: "They don't change at all." }],
            answer: 0,
            why: "That's why a dilated figure is the same **shape**: its angles are untouched, and only the lengths scale." },
          { type: "multi", prompt: "Which of these, done one after the other, bring a figure back to exactly where it started? Pick every one.", skill: "What each move keeps",
            options: [{ t: "A translation 3 right, then one 3 left", ok: true },
                      { t: "A reflection over a line, then over the same line again", ok: true },
                      { t: "A rotation of $90^\\circ$, then $270^\\circ$ the same way", ok: true },
                      { t: "A dilation by 2, then another by 2", ok: false, fb: "That makes it 4 times as big. To undo a dilation by 2, dilate by $\\frac{1}{2}$." },
                      { t: "A rotation of $90^\\circ$ counterclockwise, twice", ok: false, fb: "Two quarter turns make a half turn, $180^\\circ$ — not back home." }],
            why: "Each move has an undo: slide back, flip again, keep turning to $360^\\circ$, or scale by $\\frac{1}{k}$." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Points, lines and angles, exact definitions, and naming the four moves.",
        skills: ["geo-terms", "geo-defs", "geo-name"], per: 2 },
      { title: "Quiz 2", after: 5, blurb: "Translations and rotations: points, rules and shapes.",
        skills: ["geo-tpoint", "geo-tdet", "geo-rpoint", "geo-rdet"], per: 2 },
      { title: "Quiz 3", after: 7, blurb: "Reflections and dilations: points, mirror lines, scale factors and centres.",
        skills: ["geo-refpoint", "geo-refdet", "geo-dpoint", "geo-dscale", "geo-dcenter"], per: 2 }
    ],

    /* ================================================================ Skills
       One for each exercise of the unit. Every problem comes with its
       picture, hints that walk the steps (the last one draws the answer), and
       a reply to the slip people usually make. */
    skills: [
      { id: "geo-terms", title: "Points, lines and planes", lesson: 1,
        gen: function (R) {
          var ab = R.shuffle(LETTERS).slice(0, 2), a = ab[0], b = ab[1];
          var form = R.pick(["what", "write", "pick", "collinear"]);
          var KINDS = ["point", "seg", "ray", "line"], WORD = { point: "A point", seg: "A segment", ray: "A ray", rayL: "A ray", line: "A line" };
          if (form === "what") {
            var k = R.pick(["point", "seg", "ray", "rayL", "line"]);
            var FB = { point: "A point is a single dot with no length at all.", seg: "A segment stops at both ends — no arrows.",
                       ray: "A ray has one endpoint and one arrow.", line: "A line has arrows at both ends." };
            return { type: "choice", prompt: "What does this picture show?", art: piece(k, a, b), keep: true,
              options: KINDS.map(function (x) { return WORD[x] === WORD[k] ? { t: WORD[x] } : { t: WORD[x], fb: FB[x] }; }),
              answer: KINDS.indexOf(k === "rayL" ? "ray" : k),
              hints: ["Look at the ends: does it stop, or is there an arrow?"],
              why: { point: "One dot, no size: a point.", seg: "It stops at both ends: a segment.", ray: "One end, and an arrow at the other: a ray.",
                     rayL: "One end, and an arrow at the other: a ray.", line: "Arrows at both ends: a line." }[k] };
          }
          if (form === "write") {
            var kw = R.pick(["seg", "ray", "rayL", "line"]);
            var wrongFb = { seg: "A bar names a segment, which stops at both ends.", ray: "", rayL: "", line: "Two arrows name a line, which goes on both ways." };
            return mc(R, { prompt: "How is this written?", art: piece(kw, a, b), right: NOTATION[kw](a, b),
              wrong: ["seg", "ray", "rayL", "line"].filter(function (x) { return x !== kw; }).map(function (x) {
                return { t: NOTATION[x](a, b), fb: (x === "ray" || x === "rayL") ? (kw === "ray" || kw === "rayL"
                  ? "That ray would start at the other end. The first letter is where a ray **starts**." : "One arrow names a ray, which has a starting point and goes on one way.") : wrongFb[x] };
              }),
              hints: ["A bar stops at both ends, one arrow goes on one way, two arrows go on both ways.", kw === "ray" || kw === "rayL" ? "For a ray, the starting point's letter goes first." : "Match the ends of the picture."],
              why: "It's " + NOTATION[kw](a, b) + "." });
          }
          if (form === "pick") {
            var kp = R.pick(["seg", "ray", "rayL", "line"]);
            var PFB = { seg: "That one stops at both ends — a segment.", line: "Arrows at both ends — a line.",
                        ray: "That ray starts at $" + a + "$.", rayL: "That ray starts at $" + b + "$." };
            return mc(R, { prompt: "Which picture shows " + NOTATION[kp](a, b) + "?", right: piece(kp, a, b, { u: 34 }),
              wrong: ["seg", "ray", "rayL", "line"].filter(function (x) { return x !== kp; }).map(function (x) { return { t: piece(x, a, b, { u: 34 }), fb: PFB[x] }; }),
              hints: ["Read the mark on top: a bar, one arrow or two?", kp === "ray" || kp === "rayL" ? "The first letter is where the ray starts." : "Then find the picture with those ends."],
              why: NOTATION[kp](a, b) + (kp === "seg" ? " stops at both ends." : kp === "line" ? " goes on both ways." : " starts at $" + (kp === "ray" ? a : b) + "$ and goes on through $" + (kp === "ray" ? b : a) + "$.") });
          }
          var T = R.pick([
            { on: [[1, 3.2], [3, 2.2], [5, 1.2]], off: [[4.2, 3.2], [2, 1]] },
            { on: [[1, 1], [3, 2], [5, 3]], off: [[2, 3], [4.5, 1]] },
            { on: [[1, 2], [3, 2], [5, 2]], off: [[2, 3.4], [4, 0.8]] }]);
          var n = R.shuffle(LETTERS).slice(0, 5);
          var items = T.on.concat(T.off).map(function (p, i) { return { pt: p, name: n[i] }; });
          function set(i, j, k) { return "$" + n[i] + "$, $" + n[j] + "$ and $" + n[k] + "$"; }
          return mc(R, { prompt: "Which three points are collinear?", art: plain([0, 6.5], [0, 4], items, { u: 44, alt: "Five labelled points." }),
            right: set(0, 1, 2),
            wrong: [{ t: set(0, 1, 3), fb: "Lay a ruler through $" + n[0] + "$ and $" + n[1] + "$: it misses $" + n[3] + "$." },
                    { t: set(1, 2, 4), fb: "A straight line through $" + n[1] + "$ and $" + n[2] + "$ misses $" + n[4] + "$." }],
            hints: ["Collinear means on one straight line. Imagine a ruler through two points: which third point does it touch?"],
            why: set(0, 1, 2) + " lie on one straight line." });
        } },
      { id: "geo-defs", title: "Angles and exact definitions", lesson: 2,
        gen: function (R) {
          var form = R.pick(["vertex", "notname", "lines", "define", "define"]);
          var n = R.shuffle(LETTERS).slice(0, 3), a = n[0], v = n[1], b = n[2];
          if (form === "vertex") {
            return mc(R, { prompt: "Which point is the vertex of $\\angle " + a + v + b + "$?", art: angleFig(a, v, b), right: "$" + v + "$",
              wrong: [{ t: "$" + a + "$", fb: "$" + a + "$ is on one of the rays. The vertex is the corner, and it's the middle letter." },
                      { t: "$" + b + "$", fb: "$" + b + "$ is on one of the rays. The vertex is the corner, and it's the middle letter." }],
              hints: ["The vertex is the corner where the two rays start — and the middle letter of the name."],
              why: "The rays start at $" + v + "$, the middle letter." });
          }
          if (form === "notname") {
            return mc(R, { prompt: "Which of these is **not** a correct name for this angle?", art: angleFig(a, v, b), right: "$\\angle " + a + b + v + "$",
              wrong: [{ t: "$\\angle " + a + v + b + "$", fb: "That's a correct name: the vertex $" + v + "$ is in the middle." },
                      { t: "$\\angle " + b + v + a + "$", fb: "That's correct too — either order, as long as the vertex is in the middle." },
                      { t: "$\\angle " + v + "$", fb: "Only one angle has its corner at $" + v + "$ here, so the single letter is fine." }],
              hints: ["Find the vertex. Which name doesn't have it in the middle?"],
              why: "$\\angle " + a + b + v + "$ has $" + b + "$ in the middle, so it names an angle with its corner at $" + b + "$." });
          }
          if (form === "lines") {
            var kind = R.pick(["par", "perp", "neither"]);
            var right = { par: "Parallel", perp: "Perpendicular", neither: "Neither" }[kind];
            var FB = { Parallel: "Parallel lines never meet — these cross.", Perpendicular: "Perpendicular lines meet in a square corner, marked with a small square.", Neither: "Look again: " + (kind === "par" ? "they never meet, so they're parallel." : "the square in the corner means $90^\\circ$.") };
            return { type: "choice", prompt: "How are these two lines related?", art: linesFig(kind), keep: true,
              options: ["Parallel", "Perpendicular", "Neither"].map(function (t) { return t === right ? { t: t } : { t: t, fb: FB[t] }; }),
              answer: ["Parallel", "Perpendicular", "Neither"].indexOf(right),
              hints: ["Do they meet? If they do, is there a square in the corner?"],
              why: { par: "They never meet: parallel.", perp: "They meet in a square corner: perpendicular.", neither: "They cross, but not at $90^\\circ$: neither." }[kind] };
          }
          var D = R.pick([
            { w: "a circle", right: "All the points in a plane that are the same distance from one point",
              wrong: [{ t: "A round shape with no corners", fb: "An oval is round with no corners too. A definition has to rule it out." },
                      { t: "A curved line that joins up with itself", fb: "So does a figure-of-eight. That doesn't pin down a circle." }] },
            { w: "a segment", right: "The part of a line between two points, including those two endpoints",
              wrong: [{ t: "A short line", fb: "A line has no ends, so it can't be short — and “short” isn't exact." },
                      { t: "The distance between two points", fb: "That's the segment's **length**, a number. The segment is the straight piece itself." }] },
            { w: "parallel lines", right: "Lines in the same plane that never meet",
              wrong: [{ t: "Lines that are the same length", fb: "Lines go on forever, so they don't have a length." },
                      { t: "Lines that meet at a right angle", fb: "That's perpendicular." }] },
            { w: "perpendicular lines", right: "Lines that meet to form a right angle",
              wrong: [{ t: "Lines that cross each other", fb: "Lines can cross at any angle. Perpendicular means exactly $90^\\circ$." },
                      { t: "Lines that never meet", fb: "That's parallel." }] },
            { w: "a ray", right: "Part of a line that starts at one point and goes on forever in one direction",
              wrong: [{ t: "Part of a line with two endpoints", fb: "That's a segment." },
                      { t: "A line that goes on forever both ways", fb: "That's a whole line." }] },
            { w: "the radius of a circle", right: "The distance from the centre to any point on the circle",
              wrong: [{ t: "The distance all the way across the circle, through the centre", fb: "That's the diameter — twice the radius." },
                      { t: "The distance around the circle", fb: "That's the circumference." }] },
            { w: "an angle", right: "Two rays that start at the same point",
              wrong: [{ t: "The corner of a square", fb: "That's one example. An angle is any two rays from the same point, of any size." },
                      { t: "Two lines that never meet", fb: "Those are parallel lines — they don't make a corner at all." }] }
          ]);
          return mc(R, { prompt: "Which is the precise definition of **" + D.w + "**?", right: D.right, wrong: D.wrong,
            hints: ["A precise definition fits every example and nothing else. Which one could only be " + D.w + "?"],
            why: D.right + "." });
        } },
      { id: "geo-name", title: "Identifying transformations", lesson: 3,
        gen: function (R) {
          var kind = R.pick(["t", "r", "f", "d"]), base = shift(FLAG, R.int(1, 2), R.int(1, 2)), a = base, b;
          if (kind === "t") b = shift(base, R.pick([-6, -5, -4]), R.int(-6, 1));
          else if (kind === "r") b = turn(base, R.pick([1, 2, 3]));
          else if (kind === "f") b = flip(base, R.pick(["x", "y"]));
          else {
            var dc = [R.int(-7, -6), R.int(-7, -6)], dk = R.pick([2, 3]);
            a = shift(scale(FLAG, 0.5), dc[0] + 1.5, dc[1] + 2); b = scale(a, dk, dc);
            if (R.chance(0.5)) { var t = a; a = b; b = t; }
          }
          // Seen from another corner of the grid: the same move, mirrored.
          var sx = R.sign(), sy = R.sign();
          a = a.map(function (p) { return [p[0] * sx, p[1] * sy]; });
          b = b.map(function (p) { return [p[0] * sx, p[1] * sy]; });
          var st = whichMove(kind, grid([-8, 8], [-8, 8], [{ poly: a, c: "soft" }, { poly: b, c: "blue" }], { u: 17, alt: "A grey flag shape and a blue one on a grid." }));
          delete st.skill;
          return st;
        } },
      { id: "geo-tpoint", title: "Translating points", lesson: 4,
        gen: function (R) {
          var x = R.int(-6, 6), y = R.int(-6, 6), a, b;
          do { a = R.nz(-6, 6); } while (Math.abs(x + a) > 8);
          do { b = R.nz(-6, 6); } while (Math.abs(y + b) > 8);
          var words = R.chance(0.5);
          var ask = words ? "Translate $" + pt(x, y) + "$ " + across(a) + " and " + upDown(b) + ". Where does it land?"
            : "Translate $" + pt(x, y) + "$ by $(x, y) \\to (x " + signed(a) + ", y " + signed(b) + ")$.";
          var near = [{ v: [x - a, y - b], fb: "That went the opposite way. Right and up **add**; left and down **subtract**." },
                      { v: [x + b, y + a], fb: "The across move goes with $x$, and the up-and-down move with $y$." }]
            .filter(function (n) { return n.v[0] !== x + a || n.v[1] !== y + b; });
          return { type: "pair", prompt: ask, answer: [x + a, y + b], near: near,
            art: grid([-9, 9], [-9, 9], [{ pt: [x, y], name: "P" }], { u: 16, alt: "Point P at " + pt(x, y) + "." }),
            hints: [words ? "Right and up add; left and down subtract." : "$x " + signed(a) + "$ means " + across(a) + "; $y " + signed(b) + "$ means " + upDown(b) + ".",
                    "$x$: $" + x + " " + signed(a) + " = " + (x + a) + "$. $y$: $" + y + " " + signed(b) + " = " + (y + b) + "$.",
                    "On the grid: " + grid([-9, 9], [-9, 9], [{ steps: [[x, y], [x + a, y + b]] }, { pt: [x, y], name: "P" }, { pt: [x + a, y + b], name: "P'", c: "blue" }], { u: 13, w: 260, alt: "Arrows from P to its image." })],
            why: "$" + pt(x, y) + " \\to " + pt(x + a, y + b) + "$: " + across(a) + ", " + upDown(b) + "." };
        } },
      { id: "geo-tdet", title: "Determining translations", lesson: 4,
        gen: function (R) {
          var x = R.int(-6, 6), y = R.int(-6, 6), a, b;
          do { a = R.nz(-6, 6); } while (Math.abs(x + a) > 8);
          do { b = R.nz(-6, 6); } while (Math.abs(y + b) > 8);
          var near = [{ v: [-a, -b], fb: "That's the way back, from $P'$ to $P$. Subtract new minus old." },
                      { v: [x + a, y + b], fb: "That's where $P'$ is. The question asks how far it **moved**." }]
            .filter(function (n) { return n.v[0] !== a || n.v[1] !== b; });
          return { type: "pair", placeholder: "(a, b)", answer: [a, b], near: near,
            prompt: "A translation takes $P" + pt(x, y) + "$ to $P'" + pt(x + a, y + b) + "$. How far did it move? Give it as $(a, b)$ in the rule $(x, y) \\to (x + a, y + b)$ — negative for left or down.",
            art: grid([-9, 9], [-9, 9], [{ pt: [x, y], name: "P" }, { pt: [x + a, y + b], name: "P'", c: "blue" }], { u: 16, alt: "P at " + pt(x, y) + " and its image at " + pt(x + a, y + b) + "." }),
            hints: ["Across: new $x$ minus old $x$, $" + (x + a) + " - (" + x + ")$.", "Up or down: new $y$ minus old $y$, $" + (y + b) + " - (" + y + ")$.",
                    "On the grid: " + grid([-9, 9], [-9, 9], [{ steps: [[x, y], [x + a, y + b]] }, { pt: [x, y], name: "P" }, { pt: [x + a, y + b], name: "P'", c: "blue" }], { u: 13, w: 260, alt: "Arrows from P to P-prime." })],
            why: across(a) + " and " + upDown(b) + ": $(x, y) \\to (x " + signed(a) + ", y " + signed(b) + ")$, so $(a, b) = " + pt(a, b) + "$." };
        } },
      { id: "geo-tshape", title: "Translating shapes", lesson: 4,
        gen: function (R) {
          var sh = R.pick([[[1, 1], [4, 1], [1, 3]], [[0, 0], [3, 0], [3, 2]], [[-1, 1], [2, 1], [2, 4]], [[1, 0], [4, 0], [3, 3]]]);
          var a = R.nz(-4, 4), b = R.nz(-3, 2), t = shift(sh, a, b);
          return { type: "move", prompt: "Slide the blue triangle onto the green outline.",
            kind: "translate", shape: sh, target: t, x: [-8, 8], y: [-7, 7],
            hints: ["Follow corner $A$, at $" + P(sh[0]) + "$. Its match on the green outline is at $" + P(t[0]) + "$.",
                    "That's " + across(a) + " and " + upDown(b) + "."],
            why: "$(x, y) \\to (x " + signed(a) + ", y " + signed(b) + ")$: every corner moves " + across(a) + " and " + upDown(b) + "." };
        } },
      { id: "geo-rpoint", title: "Rotating points", lesson: 5,
        gen: function (R) {
          var x = R.nz(-7, 7), y = R.nz(-7, 7), n = R.pick([1, 2, 3]);
          var im = turn([[x, y]], n)[0];
          var name = n === 1 ? "90^\\circ \\text{ counterclockwise}" : n === 2 ? "180^\\circ" : "90^\\circ \\text{ clockwise}";
          var rule = n === 1 ? "(x, y) \\to (-y, x)" : n === 2 ? "(x, y) \\to (-x, -y)" : "(x, y) \\to (y, -x)";
          var ccw = turn([[x, y]], 1)[0], cw = turn([[x, y]], 3)[0];
          var near = (n === 1 ? [{ v: cw, fb: "That's a quarter turn **clockwise**. Counterclockwise: swap, then change the sign of the **first** number." }]
            : n === 3 ? [{ v: ccw, fb: "That's a quarter turn **counterclockwise**. Clockwise: swap, then change the sign of the **second** number." }]
            : [{ v: [-x, y], fb: "In a half turn **both** signs change." }, { v: [x, -y], fb: "In a half turn **both** signs change." }])
            .concat(n !== 2 ? [{ v: [y, x], fb: "Swapping is half of it — one of the numbers also changes sign." }] : [])
            .filter(function (k) { return k.v[0] !== im[0] || k.v[1] !== im[1]; });
          return { type: "pair", prompt: "Rotate $" + pt(x, y) + "$ by $" + name + "$ about the origin.", answer: [im[0], im[1]], near: near,
            art: grid([-8, 8], [-8, 8], [{ pt: [x, y], name: "P" }, { centre: [0, 0], say: "" }], { u: 17, alt: "Point P at " + pt(x, y) + ", and the origin as the centre." }),
            hints: [n === 2 ? "A half turn sends the point straight through the origin to the other side." : "Picture the path from the origin to $P$ — " + across(x) + ", " + upDown(y) + " — and turn the whole path a quarter turn " + (n === 1 ? "counterclockwise" : "clockwise") + ".",
                    "The rule is $" + rule + "$" + (n === 2 ? ": both signs change." : n === 1 ? ": swap, then change the sign of the first number." : ": swap, then change the sign of the second number."),
                    "Here it is: " + grid([-8, 8], [-8, 8], [{ turn: [[0, 0], 2.5, Math.atan2(y, x) * 180 / Math.PI, Math.atan2(y, x) * 180 / Math.PI + (n === 3 ? -90 : n * 90)], cw: n === 3, c: "soft", dash: "3 4" },
                                                              { pt: [x, y], name: "P" }, { pt: im, name: "P'", c: "blue" }, { centre: [0, 0], say: "" }], { u: 13, w: 260, alt: "P and its image after the turn." })],
            why: "$" + rule + "$, so $" + pt(x, y) + " \\to " + P(im) + "$." };
        } },
      { id: "geo-rdet", title: "Determining rotations", lesson: 5,
        gen: function (R) {
          var x = R.nz(-6, 6), y = R.nz(-6, 6), n = R.pick([1, 2, 3]);
          var im = turn([[x, y]], n)[0];
          var label = { 1: "$90^\\circ$ counterclockwise", 2: "$180^\\circ$", 3: "$90^\\circ$ clockwise" };
          return mc(R, { prompt: "A rotation about the origin takes $P" + pt(x, y) + "$ to $P'" + P(im) + "$. Which rotation is it?",
            art: grid([-7, 7], [-7, 7], [{ pt: [x, y], name: "P" }, { pt: im, name: "P'", c: "blue" }, { centre: [0, 0], say: "" }], { u: 18, alt: "P at " + pt(x, y) + " and P-prime at " + P(im) + "." }),
            right: label[n],
            wrong: [1, 2, 3].filter(function (k) { return k !== n; }).map(function (k) {
              var w = turn([[x, y]], k)[0];
              return { t: label[k], fb: "That would land it on $" + P(w) + "$." };
            }),
            keep: true,
            hints: ["A half turn puts $P'$ in the opposite corner, straight through the origin. A quarter turn puts it in the next corner round.",
                    "Try the rules: $90^\\circ$ counterclockwise $(-y, x)$; $180^\\circ$ $(-x, -y)$; $90^\\circ$ clockwise $(y, -x)$."],
            why: "$" + pt(x, y) + " \\to " + P(im) + "$ is a " + label[n].replace(/\$/g, "").replace("^\\circ", "°") + " turn about the origin." });
        } },
      { id: "geo-rshape", title: "Rotating shapes", lesson: 5,
        gen: function (R) {
          var sh = R.pick([[[1, 1], [4, 1], [1, 3]], [[1, 0], [3, 0], [3, 3]], [[0, 1], [3, 1], [1, 3]], [[1, 1], [3, 2], [1, 3]]]);
          var c = R.chance(0.7) ? [0, 0] : [1, 1], n = R.pick([1, 2, 3]), t = turn(sh, n, c);
          var how = n === 1 ? "a quarter turn counterclockwise: press ↺ once" : n === 2 ? "a half turn: press ↺ twice" : "a quarter turn clockwise: press ↻ once";
          return { type: "move", prompt: "Turn the blue triangle about the centre $" + P(c) + "$ onto the green outline.",
            kind: "rotate", shape: sh, target: t, center: c, x: [-6, 6], y: [-6, 6],
            hints: ["Follow corner $A$, at $" + P(sh[0]) + "$. Its match on the outline is at $" + P(t[0]) + "$.", "That's " + how + "."],
            why: "It's " + how.split(":")[0] + " about $" + P(c) + "$." };
        } },
      { id: "geo-refpoint", title: "Reflecting points", lesson: 6,
        gen: function (R) {
          var over = R.pick(["x", "y", "yx", "y-x", "v", "h"]);
          if (over === "v") over = { x: R.nz(-3, 3) };
          if (over === "h") over = { y: R.nz(-3, 3) };
          var ml = L.mirrorLine(over), x, y, im;
          do { x = R.nz(-6, 6); y = R.nz(-6, 6); im = ml.f(x, y); } while ((im[0] === x && im[1] === y) || Math.abs(im[0]) > 9 || Math.abs(im[1]) > 9);
          var rule = over === "x" ? "$x$ stays, $y$ changes sign: $(x, y) \\to (x, -y)$" : over === "y" ? "$y$ stays, $x$ changes sign: $(x, y) \\to (-x, y)$"
            : over === "yx" ? "the numbers swap: $(x, y) \\to (y, x)$" : over === "y-x" ? "swap and change both signs: $(x, y) \\to (-y, -x)$"
            : over.x != null ? "$P$ is " + Math.abs(x - over.x) + " " + (x > over.x ? "right" : "left") + " of the line, so $P'$ is " + Math.abs(x - over.x) + " " + (x > over.x ? "left" : "right") + " of it; $y$ stays"
            : "$P$ is " + Math.abs(y - over.y) + " " + (y > over.y ? "above" : "below") + " the line, so $P'$ is " + Math.abs(y - over.y) + " " + (y > over.y ? "below" : "above") + " it; $x$ stays";
          var near = [];
          if (over === "x") near.push({ v: [-x, y], fb: "That's over the $y$-axis. Over the $x$-axis, $x$ stays the same." });
          if (over === "y") near.push({ v: [x, -y], fb: "That's over the $x$-axis. Over the $y$-axis, $y$ stays the same." });
          if (over === "yx") near.push({ v: [-y, -x], fb: "That's over $y = -x$. Over $y = x$ they just swap." });
          if (over === "y-x") near.push({ v: [y, x], fb: "Swapped — now change both signs too, for $y = -x$." });
          if (over.x != null) near.push({ v: [-x, y], fb: "That's over the $y$-axis. Count from the line $x = " + over.x + "$ instead." });
          if (over.y != null) near.push({ v: [x, -y], fb: "That's over the $x$-axis. Count from the line $y = " + over.y + "$ instead." });
          near = near.filter(function (k) { return k.v[0] !== im[0] || k.v[1] !== im[1]; });
          return { type: "pair", prompt: "Reflect $" + pt(x, y) + "$ over " + ml.say + ".", answer: [im[0], im[1]], near: near,
            art: grid([-9, 9], [-9, 9], [{ mirror: over }, { pt: [x, y], name: "P" }], { u: 16, alt: "Point P at " + pt(x, y) + " and the mirror line." }),
            hints: ["The image is the same distance from the mirror as $P$, straight across on the other side.", "Here " + rule + ".",
                    "On the grid: " + grid([-9, 9], [-9, 9], [{ mirror: over }, { seg: [[x, y], im], c: "orange", dash: "4 4" }, { pt: [x, y], name: "P" }, { pt: im, name: "P'", c: "blue" }], { u: 13, w: 260, alt: "P and its image across the mirror." })],
            why: "$" + pt(x, y) + " \\to " + P(im) + "$." };
        } },
      { id: "geo-refdet", title: "Determining reflections", lesson: 6,
        gen: function (R) {
          var pool = ["x", "y", "yx", "y-x", { x: R.nz(-3, 3) }, { y: R.nz(-3, 3) }];
          var over = R.pick(pool), ml = L.mirrorLine(over), x, y, im;
          do { x = R.nz(-6, 6); y = R.nz(-6, 6); im = ml.f(x, y); } while ((im[0] === x && im[1] === y) || Math.abs(im[0]) > 8 || Math.abs(im[1]) > 8);
          var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
          var wrong = R.shuffle(pool.filter(function (k) { return k !== over; })).filter(function (k) {
            var w = L.mirrorLine(k).f(x, y);
            return w[0] !== im[0] || w[1] !== im[1];
          }).slice(0, 3).map(function (k) {
            var w = L.mirrorLine(k).f(x, y);
            return { t: cap(L.mirrorLine(k).say), fb: "That would send $P$ to $" + P(w) + "$." };
          });
          return mc(R, { prompt: "A reflection takes $P" + pt(x, y) + "$ to $P'" + P(im) + "$. What is the line of reflection?",
            art: grid([-9, 9], [-9, 9], [{ pt: [x, y], name: "P" }, { pt: im, name: "P'", c: "blue" }], { u: 16, alt: "P at " + pt(x, y) + " and P-prime at " + P(im) + "." }),
            right: cap(ml.say), wrong: wrong,
            hints: ["The mirror is exactly halfway between $P$ and $P'$, and crosses the segment between them at a right angle.",
                    "Which numbers changed? If only one changed sign, it's an axis. If they swapped, it's a diagonal. If one moved to the other side of a number, it's a line like $x = a$."],
            why: "$" + pt(x, y) + " \\to " + P(im) + "$ is a reflection over " + ml.say + "." });
        } },
      { id: "geo-refshape", title: "Reflecting shapes", lesson: 6,
        gen: function (R) {
          var sh = R.pick([[[1, 1], [4, 1], [1, 3]], [[1, 1], [3, 1], [3, 4]], [[2, 1], [4, 2], [1, 3]]]);
          var sx = R.sign();
          sh = sh.map(function (p) { return [p[0] * sx, p[1]]; });
          var pool = ["x", "y", "yx", "y-x", { x: R.pick([-1, 1, 2]) }, { y: R.pick([-2, -1, 2]) }], over, t;
          do { over = R.pick(pool); t = flip(sh, over); }
          while (same(t, sh) || t.some(function (p) { return Math.abs(p[0]) > 6 || Math.abs(p[1]) > 6; }));
          var lines = R.shuffle([over].concat(R.shuffle(pool.filter(function (k) { return k !== over && !same(flip(sh, k), t); })).slice(0, 3)));
          return { type: "move", prompt: "Flip the blue triangle onto the green outline. Pick the right mirror.",
            kind: "reflect", shape: sh, target: t, lines: lines, x: [-7, 7], y: [-7, 7],
            hints: ["Follow corner $A$, at $" + P(sh[0]) + "$. Its match on the outline is at $" + P(t[0]) + "$.",
                    "The mirror is halfway between them: it's " + L.mirrorLine(over).say + "."],
            why: "Every corner is the same distance from " + L.mirrorLine(over).say + " as its image, on the other side." };
        } },
      { id: "geo-dpoint", title: "Dilating points", lesson: 7,
        gen: function (R) {
          var origin = R.chance(0.6), k = R.pick(origin ? [2, 3, 0.5, 1.5] : [2, 3, 0.5]);
          var c = origin ? [0, 0] : [R.int(-3, 3), R.int(-3, 3)], dx, dy;
          do {
            dx = R.nz(-4, 4); dy = R.nz(-4, 4);
            if (k % 1) { dx *= 2; dy *= 2; }
          } while (Math.abs(c[0] + dx * Math.max(k, 1)) > 9 || Math.abs(c[1] + dy * Math.max(k, 1)) > 9 || Math.abs(c[0] + dx) > 9 || Math.abs(c[1] + dy) > 9);
          var x = c[0] + dx, y = c[1] + dy, im = [c[0] + dx * k, c[1] + dy * k];
          var kt = k === 0.5 ? "\\frac{1}{2}" : k === 1.5 ? "1.5" : String(k);
          var near = origin ? [{ v: [x + k, y + k], fb: "A dilation **multiplies** — it doesn't add." }]
            : [{ v: [x * k, y * k], fb: "That's " + (k < 1 ? "the distance halved" : k + " times as far") + " from the **origin**. Measure from the centre $" + P(c) + "$ instead." }];
          near = near.filter(function (n) { return n.v[0] !== im[0] || n.v[1] !== im[1]; });
          return { type: "pair", prompt: "Dilate $" + pt(x, y) + "$ by a scale factor of $" + kt + "$ about " + (origin ? "the origin" : "the centre $" + P(c) + "$") + ".",
            answer: im, near: near,
            art: grid([-9, 9], [-9, 9], [{ pt: [x, y], name: "P" }, { centre: c, at: "sw" }], { u: 16, alt: "Point P at " + pt(x, y) + " and the centre at " + P(c) + "." }),
            hints: [origin ? "About the origin, multiply both coordinates by $" + kt + "$." : "First: from the centre to $P$ is " + across(dx) + ", " + upDown(dy) + ".",
                    origin ? "$" + x + " \\times " + kt + " = " + num(im[0]) + "$ and $" + y + " \\times " + kt + " = " + num(im[1]) + "$."
                           : "Multiply by $" + kt + "$: " + across(dx * k) + ", " + upDown(dy * k) + " — counted from the centre.",
                    "On the grid: " + grid([-9, 9], [-9, 9], [{ ray: [c, [x, y]], c: "soft", dash: "3 4" }, { pt: [x, y], name: "P" }, { pt: im, name: "P'", c: "blue" }, { centre: c, at: "sw", say: "" }], { u: 13, w: 260, alt: "P and its image on the same line from the centre." })],
            why: "$" + P(im) + "$ is on the line from the centre through $P$, $" + kt + "$ times as far from the centre." };
        } },
      { id: "geo-dscale", title: "Dilations: scale factor", lesson: 7,
        gen: function (R) {
          var up = R.chance(0.6), k = up ? R.pick([2, 3]) : 0.5;
          if (R.chance(0.5)) {
            // Read the lengths off a picture. The centre (not shown) is in the
            // bottom-left corner; the small triangle sits one square out from it.
            var w = R.pick([1, 2]), h = R.pick([1, 2]), c = [-7, -6];
            var small = shift([[0, 0], [w, 0], [0, h]], c[0] + 1, c[1] + 1), big = scale(small, up ? k : 2, c);
            var a = up ? small : big, b = up ? big : small;
            var la = a[1][0] - a[0][0], lb = b[1][0] - b[0][0];
            return { type: "num", prompt: "The grey triangle was dilated onto the blue one. What is the scale factor?", answer: k, shown: k === 0.5 ? "1/2" : String(k),
              label: "Scale factor (a fraction or a decimal)",
              art: grid([-8, 8], [-7, 7], [pre(a, false), img(b, false)], { u: 18, alt: "A grey triangle with its bottom side " + la + " long, and a blue triangle with its bottom side " + lb + " long." }),
              near: [{ v: 1 / k, fb: "That's pre-image ÷ image. Divide the other way: image ÷ pre-image." }],
              hints: ["Count the bottom side of each: grey is " + la + " long, blue is " + lb + " long.", "Scale factor = image ÷ pre-image = $" + lb + " \\div " + la + "$."],
              why: "$" + lb + " \\div " + la + " = " + (k === 0.5 ? "\\frac{1}{2}" : k) + "$." };
          }
          var x = R.nz(-4, 4), y = R.nz(-4, 4);
          if (k < 1) { x *= 2; y *= 2; }
          return { type: "num", prompt: "A dilation about the origin takes $" + pt(x, y) + "$ to $" + pt(x * k, y * k) + "$. What is the scale factor?",
            answer: k, shown: k === 0.5 ? "1/2" : String(k), label: "Scale factor (a fraction or a decimal)",
            near: [{ v: x * k - x, fb: "That's the difference. A dilation multiplies: what times $" + x + "$ gives $" + num(x * k) + "$?" }].filter(function (n) { return Math.abs(n.v - k) > 1e-9; }),
            hints: ["Divide a coordinate of the image by the one it came from: $" + num(x * k) + " \\div " + x + "$.", "Check it with the other pair: $" + num(y * k) + " \\div " + y + "$."],
            why: "$" + num(x * k) + " \\div " + x + " = " + num(k) + "$, and the other pair agrees." };
        } },
      { id: "geo-dcenter", title: "Dilations: centre", lesson: 7,
        gen: function (R) {
          var k = R.pick([2, 3]), c = [R.int(-6, -3), R.int(-6, -3)];
          var sh = R.pick([[[1, 0], [2, 0], [1, 1]], [[1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [1, 2]], [[1, 0], [2, 1], [1, 1]]]);
          var a = shift(sh, c[0], c[1]), b = scale(a, k, c);
          if (R.chance(0.35)) { var t = a; a = b; b = t; }
          // Two corners whose lines to their images cross (not both in line
          // with the centre, which would give the same line twice).
          var i = 0, j = [1, 2].filter(function (q) { return sh[0][0] * sh[q][1] - sh[0][1] * sh[q][0] !== 0; })[0];
          var nm = ["A", "B", "C"];
          return { type: "pair", prompt: "The grey triangle was dilated onto the blue one. What is the centre of dilation?", answer: c,
            art: grid([-8, 4], [-8, 4], [pre(a), img(b)], { u: 22, alt: "A grey triangle and a blue triangle of a different size." }),
            hints: ["The centre is on the line through any corner and its image.", "Draw a line through $" + nm[i] + "$ and $" + nm[i] + "'$, and another through $" + nm[j] + "$ and $" + nm[j] + "'$. Where do they cross?",
                    "Here are the lines: " + grid([-8, 4], [-8, 4], [{ line: [a[i], b[i]], bare: true, c: "orange", dash: "4 4" }, { line: [a[j], b[j]], bare: true, c: "orange", dash: "4 4" }, pre(a), img(b), { pt: c, c: "orange", r: 5 }], { u: 18, w: 260, alt: "Lines through matching corners cross at the centre." })],
            why: "The lines through matching corners meet at $" + P(c) + "$ — the centre." };
        } },
      { id: "geo-props", title: "What each move keeps", lesson: 8,
        gen: function (R) {
          var T = R.pick([
            { q: "Does a translation change a figure's side lengths?", right: "No", fb: "A translation only changes where the figure is." },
            { q: "Does a rotation change a figure's angles?", right: "No", fb: "Turning a figure leaves every angle as it was." },
            { q: "Does a reflection change a figure's area?", right: "No", fb: "A mirror image is the same size, so the area is the same." },
            { q: "Does a dilation with scale factor 3 change a figure's side lengths?", right: "Yes", fb: "Every length is multiplied by 3." },
            { q: "Does a dilation change a figure's angles?", right: "No", fb: "A dilation keeps the shape, and that means keeping the angles." },
            { q: "Does a reflection change which way a figure faces?", right: "Yes", fb: "A reflection flips a figure over — that's what makes it a mirror image." },
            { q: "Does a translation change which way a figure faces?", right: "No", fb: "Sliding never flips or turns a figure." },
            { q: "Does a rotation change where a figure is?", right: "Yes", fb: "Everything except the centre travels round it." },
            { q: "Is the image of a rotation congruent to the pre-image?", right: "Yes", fb: "A rotation is rigid, so the image is an exact copy: same lengths, same angles." },
            { q: "Is the image of a dilation with scale factor 2 congruent to the pre-image?", right: "No", fb: "It's twice the size — similar (the same shape), but not congruent." }
          ]);
          return mc(R, { prompt: T.q, right: T.right, wrong: [{ t: T.right === "Yes" ? "No" : "Yes", fb: T.fb }],
            keep: true,
            hints: ["Rigid moves (slide, turn, flip) keep every length, angle and area. A dilation keeps only the angles."],
            why: T.fb });
        } }
    ]
  });
})();
