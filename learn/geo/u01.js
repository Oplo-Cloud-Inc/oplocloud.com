/* ==========================================================================
   Geometry — Unit 1: Performing transformations. See lab/core.js.

   Built the way the other lab units are, one idea at a time: say it in plain
   words, show it worked through a line at a time, ask for the same thing with
   new numbers, then a step harder. Here the moving is literal — a shape on a
   grid that you slide, turn, flip and scale (the "move" scene) — so each
   transformation is something done before it is a rule written down.

   Seven lessons, one for each part of the unit and one to put them together:
   the words of geometry, what a transformation is, then translations,
   rotations, reflections and dilations, then telling them apart and saying
   what each keeps the same.

   Twelve skills practise it, three quizzes check it, and the unit test at the
   end draws from every skill. Standards: HSG.CO.A.1–5, HSG.SRT.A.1.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var num = L.num, mc = L.mc;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function pt(x, y) { return "(" + num(x) + ", " + num(y) + ")"; }
  // A triangle, moved: used to build both the shape and where it should land.
  function shift(sh, dx, dy) { return sh.map(function (p) { return [p[0] + dx, p[1] + dy]; }); }
  function turn(sh, n, c) {
    c = c || [0, 0];
    return sh.map(function (p) {
      var x = p[0] - c[0], y = p[1] - c[1], t;
      for (var i = 0; i < ((n % 4) + 4) % 4; i++) { t = x; x = -y; y = t; }
      return [x + c[0], y + c[1]];
    });
  }
  function flip(sh, over) {
    return sh.map(function (p) {
      return over === "x" ? [p[0], -p[1]] : over === "y" ? [-p[0], p[1]] : [p[1], p[0]];
    });
  }
  function scale(sh, k, c) {
    c = c || [0, 0];
    return sh.map(function (p) { return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; });
  }

  var TRI = [[1, 1], [4, 1], [1, 3]];

  L.unit("geo", 1, {
    title: "Performing transformations",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "The words of geometry",
        blurb: "Point, line, segment, ray, angle — said precisely, because everything after this rests on them.",
        mins: 8,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Geometry is the oldest part of school mathematics. <br><br>Around 300 BC, Euclid wrote it all down in a book called the *Elements*, starting from a handful of words and building everything else out of them. <br><br>Those words have to be exact, so here they are.",
            scene: { type: "walk", rows: [
              { m: "A", say: "A **point** is a position, with no size at all. It is named with a capital letter." },
              { m: "\\overline{AB}", say: "A **segment** is the straight piece between two points, ends included. It has a length." },
              { m: "\\overrightarrow{AB}", say: "A **ray** starts at one point and goes on forever through another." },
              { m: "\\overleftrightarrow{AB}", say: "A **line** goes on forever both ways. It has no ends and no length." },
              { m: "\\angle ABC", say: "An **angle** is two rays from the same point. That shared point, $B$, is its vertex, and is always named in the middle." }] },
            gate: true,
            then: "A **plane** is the flat surface all of this lives on: it goes on forever in every direction, like the grid you are about to use." },
          { type: "choice", prompt: "Which one has a length you could measure?", skill: "The words of geometry",
            options: [{ t: "A segment" }, { t: "A line", fb: "A line goes on forever both ways, so it has no length to measure." },
                      { t: "A ray", fb: "A ray has a start but no end, so it has no length either." },
                      { t: "A point", fb: "A point has no size at all." }],
            answer: 0, why: "Only a segment has two ends, so only a segment has a length." },
          { type: "sort", prompt: "Sort each piece of notation by what it names. Drag a card into a box, or click a card and then a box.",
            bins: ["A point", "A segment", "A ray", "A line"],
            cards: [{ t: "$P$", bin: 0 }, { t: "$\\overline{PQ}$", bin: 1 }, { t: "$\\overrightarrow{PQ}$", bin: 2 },
                    { t: "$\\overleftrightarrow{PQ}$", bin: 3 }, { t: "$\\overline{XY}$", bin: 1 },
                    { t: "$M$", bin: 0, fb: "A single capital letter names a point." }],
            skill: "The words of geometry" },
          { type: "choice", prompt: "In $\\angle XYZ$, which point is the vertex — the corner where the two rays meet?", skill: "The words of geometry",
            options: [{ t: "$Y$" }, { t: "$X$", fb: "The vertex is named in the **middle**. $X$ is a point on one of the rays." },
                      { t: "$Z$", fb: "The vertex is named in the middle, so it is $Y$." }],
            answer: 0,
            hints: ["The middle letter is always the corner."],
            why: "$\\angle XYZ$ is the angle at $Y$, between $\\overrightarrow{YX}$ and $\\overrightarrow{YZ}$." },
          { type: "learn", kicker: "Precisely",
            prompt: "Euclid's habit — say exactly what a thing is, with nothing left to guess — is why a definition in geometry sounds so fussy.",
            scene: { type: "walk", rows: [
              { say: "“A circle is round” names something you already know, but you could not draw it from that." },
              { say: "“A circle is all the points a fixed distance from one point” tells you exactly what to draw: put your compass point there, open it that far, turn." },
              { say: "The fixed point is the **centre**, and the fixed distance is the **radius**." }] },
            gate: true },
          { type: "choice", prompt: "Which is a precise definition of a **circle**?", skill: "The words of geometry",
            options: [{ t: "All the points in a plane the same distance from a given point" },
                      { t: "A round shape with no corners", fb: "True of a circle, but also of an oval. A definition has to rule out everything else." },
                      { t: "A shape whose width is the same all the way round", fb: "Also true of some other shapes, so it doesn't pin down a circle." }],
            answer: 0,
            hints: ["Which one tells you exactly how to draw it?"],
            why: "That one gives you the centre and the radius, which is all you need to draw it." },
          { type: "choice", prompt: "Two lines in the same plane that never meet are called…", skill: "The words of geometry",
            options: [{ t: "Parallel" }, { t: "Perpendicular", fb: "Perpendicular lines do meet — at a right angle." },
                      { t: "Congruent", fb: "Congruent means same size and shape, which is about figures, not about meeting." }],
            answer: 0, why: "Parallel lines stay the same distance apart forever." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "What a transformation is",
        blurb: "Four ways to move a figure — three that keep it the same size, one that doesn't.",
        mins: 8,
        steps: [
          { type: "learn", kicker: "Try it",
            prompt: "A **transformation** takes every point of a figure and sends it somewhere else, by one rule. <br><br>Here is the simplest one: a **translation**, which slides the figure without turning it. <br><br>The dashed shape is where it started. Move the blue one around with the arrows.",
            scene: { type: "move", kind: "translate", shape: TRI, x: [-8, 8], y: [-6, 6], gate: true },
            gate: true,
            then: "The figure you start with is the **pre-image**; the one you end with is the **image**. Sliding changed where it is, and nothing else: same side lengths, same angles, same way round." },
          { type: "learn", kicker: "The four moves",
            prompt: "There are four transformations in this unit.",
            scene: { type: "walk", rows: [
              { say: "**Translation** — slide it. Every point moves the same distance in the same direction." },
              { say: "**Rotation** — turn it about a point, by some angle." },
              { say: "**Reflection** — flip it over a line, like a mirror." },
              { say: "**Dilation** — scale it about a point: bigger or smaller, same shape." }] },
            gate: true,
            then: "The first three are called **rigid** transformations: they move a figure without changing its size or shape. A dilation is the odd one out — it changes the size." },
          { type: "choice", prompt: "Which of the four is **not** rigid?", skill: "Naming transformations",
            options: [{ t: "A dilation" }, { t: "A rotation", fb: "Turning a figure doesn't change any of its lengths." },
                      { t: "A reflection", fb: "A mirror image is the same size as what it reflects." }],
            answer: 0, why: "A dilation scales the figure, so its lengths change. The other three keep them." },
          { type: "learn", kicker: "Watch",
            prompt: "Here is a rotation. Each press turns the shape a quarter turn about the marked centre.",
            scene: { type: "move", kind: "rotate", shape: TRI, center: [0, 0], x: [-6, 6], y: [-6, 6], gate: true },
            gate: true,
            then: "Notice the shape never gets bigger or smaller, and the centre never moves. Four quarter turns bring it home." },
          { type: "choice", prompt: "A figure is moved so that it is the same size, the same shape, and facing the **opposite** way, like a mirror image. Which was it?", skill: "Naming transformations",
            options: [{ t: "A reflection" }, { t: "A translation", fb: "Sliding never flips a figure — it still faces the same way." },
                      { t: "A dilation", fb: "A dilation changes the size, and this one kept it." }],
            answer: 0, why: "Only a reflection turns a figure over, and it keeps every length." },
          { type: "choice", prompt: "A photo is made twice as wide and twice as tall. Which transformation is that?", skill: "Naming transformations",
            options: [{ t: "A dilation, with scale factor 2" }, { t: "A translation", fb: "The photo changed size, and a translation never does." },
                      { t: "A rotation", fb: "Nothing was turned — it was scaled." }],
            answer: 0, why: "Scaling a figure about a point is a dilation; the “twice” is its scale factor." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Translations",
        blurb: "Slide it: every point moves the same way, so the rule is just add.",
        mins: 10,
        steps: [
          { type: "learn", kicker: "Watch",
            prompt: "On a grid, sliding has a rule you can write down.",
            scene: { type: "walk", rows: [
              { m: "A(2, 1)", say: "Start with a point." },
              { m: "\\text{5 right, 3 up}", say: "Slide it: 5 to the right and 3 up." },
              { m: "A'(7, 4)", say: "Add 5 to the $x$ and 3 to the $y$. The image is written $A'$ — “A prime”." },
              { m: "(x, y) \\to (x + 5, y + 3)", say: "That is the whole translation, as a rule that works for every point." }] },
            gate: true },
          { type: "pair", prompt: "Translate the point $(3, -2)$ by $(x, y) \\to (x + 4, y + 5)$. Where does it land?", answer: [7, 3], skill: "Translating points",
            near: [],
            hints: ["Add 4 to the $x$: $3 + 4$.", "Add 5 to the $y$: $-2 + 5$."],
            why: "$(3 + 4,\\; -2 + 5) = (7, 3)$." },
          { type: "pair", prompt: "Translate $(-1, 4)$ by $(x, y) \\to (x - 3, y - 6)$.", answer: [-4, -2], skill: "Translating points",
            hints: ["Take 3 from the $x$ and 6 from the $y$.", "$-1 - 3 = -4$, and $4 - 6 = -2$."],
            why: "$(-1 - 3,\\; 4 - 6) = (-4, -2)$." },
          { type: "move", prompt: "Now a whole figure. Slide the blue triangle onto the dashed outline.",
            kind: "translate", shape: TRI, target: shift(TRI, -4, 2), x: [-8, 8], y: [-6, 6], skill: "Translating figures",
            hints: ["Follow one corner: the bottom-left starts at $(1, 1)$ and has to reach $(-3, 3)$.", "That is 4 to the left and 2 up."],
            why: "Every corner moves the same way: $(x, y) \\to (x - 4, y + 2)$." },
          { type: "learn", kicker: "Backwards",
            prompt: "Given a figure and its image, you can read off the translation: pick one point and see how far it went.",
            scene: { type: "walk", rows: [
              { m: "B(2, 5) \\to B'(-1, 7)", say: "Compare a point with its image." },
              { m: "-1 - 2 = -3", say: "The $x$ went down by 3, so 3 to the left." },
              { m: "7 - 5 = 2", say: "The $y$ went up by 2." },
              { m: "(x, y) \\to (x - 3, y + 2)", say: "Check it on a second point before trusting it." }] },
            gate: true },
          { type: "pair", prompt: "A translation takes $(4, -3)$ to $(6, 1)$. Write the translation as the pair $(a, b)$ in $(x, y) \\to (x + a, y + b)$.",
            answer: [2, 4], skill: "Determining translations", placeholder: "(a, b)",
            hints: ["Subtract to see how far it went: $6 - 4$ and $1 - (-3)$."],
            why: "$6 - 4 = 2$ and $1 - (-3) = 4$, so $(x, y) \\to (x + 2, y + 4)$." },
          { type: "choice", prompt: "A translation takes $P$ to $P'$. What is true of the segment $\\overline{PP'}$ and the segment joining any other point to its image?", skill: "Properties of translations",
            options: [{ t: "They are the same length and parallel" },
                      { t: "They meet at the centre", fb: "That is a rotation. A translation has no centre — everything moves the same way." },
                      { t: "They are perpendicular", fb: "Every point slides in the **same** direction, so those segments point the same way." }],
            answer: 0,
            why: "Every point moves the same distance in the same direction, so all those segments are parallel and equal." },
          { type: "choice", prompt: "Which of these does a translation change?", skill: "Properties of translations",
            options: [{ t: "Where the figure is" }, { t: "Its side lengths", fb: "Sliding keeps every length." },
                      { t: "Its angles", fb: "Sliding keeps every angle too." },
                      { t: "Which way round it faces", fb: "A translation never flips a figure." }],
            answer: 0, why: "A translation changes position and nothing else." }
        ]
      },
      /* ============================================================== 4 */
      {
        title: "Rotations",
        blurb: "Turn it about a point — and about the origin, the rule is a swap.",
        mins: 10,
        steps: [
          { type: "learn", kicker: "Try it",
            prompt: "A **rotation** turns a figure about a fixed point, called the **centre**. <br><br>Angles are measured counterclockwise unless it says otherwise. <br><br>Turn this triangle and watch the corner nearest the centre.",
            scene: { type: "move", kind: "rotate", shape: [[1, 1], [3, 1], [3, 2]], center: [0, 0], x: [-5, 5], y: [-5, 5], gate: true },
            gate: true,
            then: "Every point travels round the centre on its own circle, and keeps its distance from the centre. Nothing changes size." },
          { type: "learn", kicker: "Watch",
            prompt: "About the origin, a quarter turn has a rule worth knowing by heart.",
            scene: { type: "walk", rows: [
              { m: "(4, 1)", say: "Take a point 4 right and 1 up." },
              { m: "90^\\circ \\text{ counterclockwise}", say: "Turn it a quarter turn about the origin." },
              { m: "(-1, 4)", say: "It lands 1 left and 4 up: the numbers swap, and the new $x$ takes a minus." },
              { m: "(x, y) \\to (-y, x)", say: "That is the rule for $90^\\circ$ counterclockwise about the origin." }] },
            gate: true,
            then: "Two of those is a half turn: $(x, y) \\to (-x, -y)$. Three is $270^\\circ$, which is the same as $90^\\circ$ clockwise: $(x, y) \\to (y, -x)$." },
          { type: "pair", prompt: "Rotate $(3, 5)$ by $90^\\circ$ counterclockwise about the origin.", answer: [-5, 3], skill: "Rotating points",
            hints: ["The rule is $(x, y) \\to (-y, x)$.", "Swap them, then put a minus on the new first number."],
            why: "$(3, 5) \\to (-5, 3)$." },
          { type: "pair", prompt: "Rotate $(-2, 6)$ by $180^\\circ$ about the origin.", answer: [2, -6], skill: "Rotating points",
            near: [],
            hints: ["A half turn is $(x, y) \\to (-x, -y)$.", "Both signs flip."],
            why: "$(-2, 6) \\to (2, -6)$." },
          { type: "move", prompt: "Turn the blue triangle onto the outline.",
            kind: "rotate", shape: [[1, 1], [4, 1], [1, 3]], target: turn([[1, 1], [4, 1], [1, 3]], 1), center: [0, 0], x: [-6, 6], y: [-6, 6],
            skill: "Rotating figures",
            hints: ["Each press is a quarter turn counterclockwise about the centre.", "One press is enough here."],
            why: "A single $90^\\circ$ counterclockwise turn about the origin lands it on the outline." },
          { type: "choice", prompt: "A rotation about the origin takes $(2, 0)$ to $(-2, 0)$. What was the angle?", skill: "Determining rotations",
            options: [{ t: "$180^\\circ$" }, { t: "$90^\\circ$", fb: "A quarter turn would take $(2, 0)$ to $(0, 2)$ — onto the $y$-axis." },
                      { t: "$270^\\circ$", fb: "Three quarter turns would take it to $(0, -2)$." }],
            answer: 0,
            hints: ["Picture the point on the positive $x$-axis. How far round is the negative $x$-axis?"],
            why: "The point ends directly opposite the centre, which is a half turn: $180^\\circ$." },
          { type: "choice", prompt: "Which point stays exactly where it is during a rotation?", skill: "Determining rotations",
            options: [{ t: "The centre" }, { t: "Every point on the figure", fb: "Only one point stays put; the rest travel round it." },
                      { t: "None of them", fb: "The centre does not move — that is what makes it the centre." }],
            answer: 0, why: "A rotation fixes its centre and moves everything else around it." }
        ]
      },
      /* ============================================================== 5 */
      {
        title: "Reflections",
        blurb: "Flip it over a line: same distance from the mirror, other side.",
        mins: 10,
        steps: [
          { type: "learn", kicker: "Try it",
            prompt: "A **reflection** flips a figure over a line, called the **line of reflection**. <br><br>Every point ends up the same distance from that line, on the other side. <br><br>Try all three lines and watch which way the triangle faces.",
            scene: { type: "move", kind: "reflect", shape: [[1, 1], [4, 1], [1, 3]], x: [-6, 6], y: [-6, 6], gate: true },
            gate: true,
            then: "A reflection is rigid — every length and angle survives — but the figure is turned over, so it now faces the other way." },
          { type: "learn", kicker: "The rules",
            prompt: "Over the axes and over the line $y = x$, reflecting has rules as short as rotation's.",
            scene: { type: "walk", rows: [
              { m: "(x, y) \\to (x, -y)", say: "Over the **$x$-axis**: the height flips sign, the across stays." },
              { m: "(x, y) \\to (-x, y)", say: "Over the **$y$-axis**: the across flips sign, the height stays." },
              { m: "(x, y) \\to (y, x)", say: "Over the line **$y = x$**: the two swap places." }] },
            gate: true },
          { type: "pair", prompt: "Reflect $(5, 2)$ over the $x$-axis.", answer: [5, -2], skill: "Reflecting points",
            hints: ["Over the $x$-axis, the $y$ changes sign and the $x$ stays."],
            why: "$(5, 2) \\to (5, -2)$ — the same distance below the axis as it was above." },
          { type: "pair", prompt: "Reflect $(-3, 7)$ over the $y$-axis.", answer: [3, 7], skill: "Reflecting points",
            hints: ["Over the $y$-axis, the $x$ changes sign and the $y$ stays."],
            why: "$(-3, 7) \\to (3, 7)$." },
          { type: "pair", prompt: "Reflect $(2, 6)$ over the line $y = x$.", answer: [6, 2], skill: "Reflecting points",
            hints: ["Over $y = x$, the two coordinates swap."],
            why: "$(2, 6) \\to (6, 2)$." },
          { type: "move", prompt: "Flip the blue triangle onto the outline.",
            kind: "reflect", shape: [[1, 1], [4, 1], [1, 3]], target: flip([[1, 1], [4, 1], [1, 3]], "y"), x: [-6, 6], y: [-6, 6],
            skill: "Reflecting figures",
            hints: ["The outline is on the other side of the $y$-axis, at the same height.", "So the mirror is the $y$-axis."],
            why: "Flipping over the $y$-axis sends $(x, y)$ to $(-x, y)$, which is exactly the outline." },
          { type: "choice", prompt: "A reflection takes $(4, 3)$ to $(4, -3)$. What is the line of reflection?", skill: "Determining reflections",
            options: [{ t: "The $x$-axis" }, { t: "The $y$-axis", fb: "Over the $y$-axis the **$x$** would change sign: $(4,3) \\to (-4,3)$." },
                      { t: "The line $y = x$", fb: "Over $y = x$ the coordinates swap: $(4,3) \\to (3,4)$." }],
            answer: 0,
            hints: ["Which coordinate changed? The one that changes tells you the mirror."],
            why: "Only the $y$ changed sign, which is the $x$-axis." },
          { type: "choice", prompt: "A point sits **on** the line of reflection. Where does it go?", skill: "Determining reflections",
            options: [{ t: "It stays where it is" }, { t: "It moves to the other side", fb: "It is already on the mirror, so there is no distance to cross." },
                      { t: "It disappears", fb: "Every point has an image; this one is itself." }],
            answer: 0, why: "Its distance from the line is zero, so the reflection leaves it alone." }
        ]
      },
      /* ============================================================== 6 */
      {
        title: "Dilations",
        blurb: "Scale it about a point: same shape, different size.",
        mins: 10,
        steps: [
          { type: "learn", kicker: "Try it",
            prompt: "A **dilation** scales a figure about a fixed point, the **centre**. <br><br>How much it scales by is the **scale factor**. <br><br>Double the triangle and halve it, and watch the corner nearest the centre.",
            scene: { type: "move", kind: "dilate", shape: [[1, 1], [3, 1], [1, 2]], center: [0, 0], x: [-2, 8], y: [-2, 6], gate: true },
            gate: true,
            then: "Scale factor greater than 1 makes it bigger; between 0 and 1 makes it smaller. The angles never change — only the lengths, all by the same factor." },
          { type: "learn", kicker: "Watch",
            prompt: "About the origin, dilating is multiplying.",
            scene: { type: "walk", rows: [
              { m: "P(3, 2),\\; k = 2", say: "Take a point and a scale factor of 2." },
              { m: "(3 \\times 2,\\; 2 \\times 2)", say: "Multiply both coordinates by the scale factor." },
              { m: "P'(6, 4)", say: "The image is twice as far from the origin, in the same direction." },
              { m: "(x, y) \\to (kx, ky)", say: "That is the rule for a dilation about the origin." }] },
            gate: true },
          { type: "pair", prompt: "Dilate $(4, -6)$ about the origin by a scale factor of $\\frac{1}{2}$.", answer: [2, -3], skill: "Dilating points",
            hints: ["Multiply both coordinates by $\\frac{1}{2}$ — that is, halve them."],
            why: "$(4 \\times \\tfrac{1}{2},\\; -6 \\times \\tfrac{1}{2}) = (2, -3)$." },
          { type: "pair", prompt: "Dilate $(-2, 5)$ about the origin by a scale factor of 3.", answer: [-6, 15], skill: "Dilating points",
            hints: ["Multiply both coordinates by 3, signs and all."],
            why: "$(-2 \\times 3,\\; 5 \\times 3) = (-6, 15)$." },
          { type: "move", prompt: "Scale the blue triangle onto the outline.",
            kind: "dilate", shape: [[1, 1], [3, 1], [1, 2]], target: scale([[1, 1], [3, 1], [1, 2]], 2), center: [0, 0], x: [-2, 8], y: [-2, 6],
            skill: "Dilating figures",
            hints: ["The outline is twice as far from the centre in every direction.", "So the scale factor is 2."],
            why: "Scale factor 2 about the origin: every coordinate doubles." },
          { type: "num", prompt: "A dilation about the origin takes $(3, 1)$ to $(12, 4)$. What is the scale factor?", answer: 4, skill: "Finding the scale factor",
            near: [{ v: 9, fb: "That is the difference, $12 - 3$. A dilation **multiplies**: what times 3 gives 12?" }],
            hints: ["Divide an image coordinate by the one it came from: $12 \\div 3$.", "Check it on the other coordinate: $4 \\div 1$."],
            why: "$12 \\div 3 = 4$ and $4 \\div 1 = 4$, so $k = 4$." },
          { type: "num", prompt: "A dilation about the origin takes $(10, -4)$ to $(5, -2)$. What is the scale factor?", answer: 0.5, shown: "1/2",
            skill: "Finding the scale factor", label: "Your answer (a fraction or a decimal)",
            near: [{ v: 2, fb: "The image is **smaller**, so the factor is under 1: $5 \\div 10$." }],
            hints: ["Divide: $5 \\div 10$.", "A figure that shrinks has a scale factor between 0 and 1."],
            why: "$5 \\div 10 = \\frac{1}{2}$, and $-2 \\div -4 = \\frac{1}{2}$ agrees." },
          { type: "choice", prompt: "Maya dilates a triangle by 3 and says its angles are now three times as big. What is wrong?", skill: "Finding the scale factor",
            options: [{ t: "A dilation scales lengths, not angles — the angles stay the same" },
                      { t: "Nothing, that is right", fb: "Scale a photo and nothing tilts: the corners meet at exactly the same angles." },
                      { t: "The angles get three times smaller", fb: "They don't change at all." }],
            answer: 0,
            why: "That is why a dilated figure is the **same shape**: the angles are untouched, only the lengths scale." }
        ]
      },
      /* ============================================================== 7 */
      {
        title: "Which move was it?",
        blurb: "Telling the four apart, and saying what each one leaves alone.",
        mins: 9,
        steps: [
          { type: "learn", kicker: "Putting it together",
            prompt: "Given a figure and its image, two questions settle which transformation it was.",
            scene: { type: "walk", rows: [
              { say: "**Did the size change?** If yes, it is a dilation. If no, it is one of the three rigid moves." },
              { say: "**Is it facing the other way, like a mirror image?** If yes, a reflection." },
              { say: "Otherwise: did it turn? A rotation. Did it only slide? A translation." }] },
            gate: true },
          { type: "choice", prompt: "A triangle with corners at $(1,1)$, $(4,1)$, $(1,3)$ has an image at $(2,2)$, $(8,2)$, $(2,6)$. Which transformation?", skill: "Naming transformations",
            options: [{ t: "A dilation with scale factor 2" },
                      { t: "A translation", fb: "Check a side: the bottom was 3 long and is now 6. A translation never changes a length." },
                      { t: "A rotation", fb: "Turning keeps lengths the same, and these doubled." }],
            answer: 0,
            hints: ["Compare one side's length before and after."],
            why: "Every coordinate doubled: $(x, y) \\to (2x, 2y)$, a dilation about the origin with $k = 2$." },
          { type: "choice", prompt: "A figure's image is the same size and shape but faces the other way, and one line's worth of points did not move at all. Which was it?", skill: "Naming transformations",
            options: [{ t: "A reflection" }, { t: "A rotation", fb: "A rotation fixes one **point**, not a whole line, and does not produce a mirror image." },
                      { t: "A translation", fb: "A translation moves every point, and never flips the figure." }],
            answer: 0, why: "The points that stay put in a reflection are exactly the ones on the mirror line." },
          { type: "multi", prompt: "Which of these are kept the same by **every** rigid transformation? Pick every one.", skill: "What is preserved",
            options: [{ t: "Side lengths", ok: true }, { t: "Angle sizes", ok: true }, { t: "Area", ok: true },
                      { t: "Position on the grid", ok: false, fb: "Moving a figure is the whole point — position is what changes." },
                      { t: "Which way round it faces", ok: false, fb: "A reflection is rigid and does turn a figure over." }],
            hints: ["Rigid means the figure itself is unchanged — only where it sits."],
            why: "Lengths, angles and area survive any rigid motion. Position always changes, and a reflection also reverses the figure." },
          { type: "multi", prompt: "Which are kept the same by a **dilation** (with scale factor not 1)? Pick every one.", skill: "What is preserved",
            options: [{ t: "Angle sizes", ok: true }, { t: "The shape of the figure", ok: true },
                      { t: "Side lengths", ok: false, fb: "Every length is multiplied by the scale factor — that is what a dilation does." },
                      { t: "Area", ok: false, fb: "Double the lengths and the area goes up four times, not two." }],
            hints: ["A dilation is a resize: what survives a resize?"],
            why: "A dilation keeps the angles and therefore the shape; the lengths all scale by $k$, and the area by $k^2$." },
          { type: "choice", prompt: "Which pair of transformations, done one after the other, could leave a figure exactly where it started?", skill: "Naming transformations",
            options: [{ t: "A translation and then the opposite translation" },
                      { t: "A dilation by 2 and then a dilation by 2", fb: "That leaves it four times as big." },
                      { t: "Two different reflections over the same line", fb: "There is only one reflection over a given line — and doing it twice does bring the figure back." }],
            answer: 0,
            why: "Every transformation can be undone: slide it back, turn it back, flip it again, or scale by $\\frac{1}{k}$." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "The words of geometry, naming the four moves, and translations.",
        skills: ["geo-terms", "geo-name", "geo-tpoint", "geo-tdet"], per: 2 },
      { title: "Quiz 2", after: 5, blurb: "Rotations and reflections, on points and on figures.",
        skills: ["geo-rpoint", "geo-rdet", "geo-refpoint", "geo-refdet"], per: 2 },
      { title: "Quiz 3", after: 6, blurb: "Dilations: points, scale factors and centres.",
        skills: ["geo-dpoint", "geo-dscale"], per: 2 }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "geo-terms", title: "The words of geometry", lesson: 1,
        gen: function (R) {
          var T = R.pick([
            { q: "Which has two endpoints?", right: "A segment", wrong: [{ t: "A ray", fb: "A ray has one endpoint and goes on forever the other way." }, { t: "A line", fb: "A line has no endpoints at all." }] },
            { q: "Which goes on forever in both directions?", right: "A line", wrong: [{ t: "A segment", fb: "A segment stops at both ends." }, { t: "A ray", fb: "A ray only goes on forever one way." }] },
            { q: "Which has exactly one endpoint?", right: "A ray", wrong: [{ t: "A segment", fb: "A segment has two." }, { t: "A line", fb: "A line has none." }] },
            { q: "What does $\\overline{AB}$ name?", right: "The segment from $A$ to $B$", wrong: [{ t: "The line through $A$ and $B$", fb: "That is written $\\overleftrightarrow{AB}$, with arrows both ways." }, { t: "The ray from $A$ through $B$", fb: "That is written $\\overrightarrow{AB}$, with one arrow." }] },
            { q: "In $\\angle RST$, which point is the vertex?", right: "$S$", wrong: [{ t: "$R$", fb: "The vertex is the middle letter." }, { t: "$T$", fb: "The vertex is the middle letter." }] },
            { q: "Two lines that meet at a right angle are…", right: "Perpendicular", wrong: [{ t: "Parallel", fb: "Parallel lines never meet." }, { t: "Congruent", fb: "Congruent is about size and shape, not about meeting." }] },
            { q: "Two lines in a plane that never meet are…", right: "Parallel", wrong: [{ t: "Perpendicular", fb: "Perpendicular lines meet, at a right angle." }, { t: "Skew", fb: "Skew lines are not in the same plane; these are." }] },
            { q: "A circle is all the points a fixed distance from one point. That distance is the…", right: "Radius", wrong: [{ t: "Diameter", fb: "The diameter goes all the way across — twice the radius." }, { t: "Centre", fb: "The centre is the point, not the distance." }] }
          ]);
          return mc(R, { prompt: T.q, right: T.right, wrong: T.wrong, skill: "The words of geometry",
            hints: ["Say the definition to yourself before you look at the options."],
            why: T.right + "." });
        } },
      { id: "geo-name", title: "Naming transformations", lesson: 2,
        gen: function (R) {
          var T = R.pick([
            { q: "A figure is slid 4 units left. Which transformation?", right: "A translation" },
            { q: "A figure is turned $90^\\circ$ about the origin. Which transformation?", right: "A rotation" },
            { q: "A figure is flipped over the $y$-axis. Which transformation?", right: "A reflection" },
            { q: "A figure's lengths are all tripled. Which transformation?", right: "A dilation" },
            { q: "Which transformation changes a figure's size?", right: "A dilation" },
            { q: "Which transformation produces a mirror image?", right: "A reflection" },
            { q: "Which transformation has a centre and an angle?", right: "A rotation" },
            { q: "Which transformation moves every point the same distance in the same direction?", right: "A translation" }
          ]);
          var all = ["A translation", "A rotation", "A reflection", "A dilation"];
          var fb = { "A translation": "A translation slides a figure without turning, flipping or resizing it.",
                     "A rotation": "A rotation turns a figure about a centre.",
                     "A reflection": "A reflection flips a figure over a line.",
                     "A dilation": "A dilation scales a figure about a centre." };
          return mc(R, { prompt: T.q, right: T.right,
            wrong: all.filter(function (t) { return t !== T.right; }).map(function (t) { return { t: t, fb: fb[t] }; }),
            skill: "Naming transformations",
            hints: ["Did the size change? Is it a mirror image? Did it turn, or only slide?"],
            why: fb[T.right] });
        } },
      { id: "geo-tpoint", title: "Translating points", lesson: 3,
        gen: function (R) {
          var x = R.int(-8, 8), y = R.int(-8, 8), a = R.nz(-6, 6), b = R.nz(-6, 6);
          return { type: "pair", prompt: "Translate $" + pt(x, y) + "$ by $(x, y) \\to (x " + L.signed(a) + ", y " + L.signed(b) + ")$.",
            answer: [x + a, y + b],
            hints: ["Add " + a + " to the $x$: $" + x + " " + L.signed(a) + "$.", "Add " + b + " to the $y$: $" + y + " " + L.signed(b) + "$."],
            why: "$" + pt(x, y) + " \\to " + pt(x + a, y + b) + "$." };
        } },
      { id: "geo-tdet", title: "Determining translations", lesson: 3,
        gen: function (R) {
          var x = R.int(-7, 7), y = R.int(-7, 7), a = R.nz(-6, 6), b = R.nz(-6, 6);
          return { type: "pair", prompt: "A translation takes $" + pt(x, y) + "$ to $" + pt(x + a, y + b) + "$. Give the translation as the pair $(a, b)$ in $(x, y) \\to (x + a, y + b)$.",
            answer: [a, b], placeholder: "(a, b)",
            hints: ["Subtract to see how far it went: $" + (x + a) + " - (" + x + ")$ across.", "And $" + (y + b) + " - (" + y + ")$ up."],
            why: "$" + (x + a) + " - (" + x + ") = " + a + "$ and $" + (y + b) + " - (" + y + ") = " + b + "$." };
        } },
      { id: "geo-tshape", title: "Translating figures", lesson: 3,
        gen: function (R) {
          var sh = R.pick([[[1, 1], [4, 1], [1, 3]], [[0, 0], [3, 0], [3, 2]], [[-1, 1], [2, 1], [2, 4]], [[1, 0], [4, 0], [3, 3]]]);
          var a = R.nz(-4, 4), b = R.nz(-3, 3);
          return { type: "move", prompt: "Slide the blue figure onto the outline.",
            kind: "translate", shape: sh, target: shift(sh, a, b), x: [-8, 8], y: [-6, 6],
            hints: ["Follow one corner and count: how far across, how far up or down?",
                    "It is " + Math.abs(a) + " to the " + (a < 0 ? "left" : "right") + " and " + Math.abs(b) + " " + (b < 0 ? "down" : "up") + "."],
            why: "$(x, y) \\to (x " + L.signed(a) + ", y " + L.signed(b) + ")$." };
        } },
      { id: "geo-rpoint", title: "Rotating points about the origin", lesson: 4,
        gen: function (R) {
          var x = R.nz(-7, 7), y = R.nz(-7, 7), n = R.pick([1, 2, 3]);
          var img = turn([[x, y]], n)[0];
          var name = n === 1 ? "90^\\circ \\text{ counterclockwise}" : n === 2 ? "180^\\circ" : "270^\\circ \\text{ counterclockwise } (90^\\circ \\text{ clockwise})";
          var rule = n === 1 ? "(x, y) \\to (-y, x)" : n === 2 ? "(x, y) \\to (-x, -y)" : "(x, y) \\to (y, -x)";
          return { type: "pair", prompt: "Rotate $" + pt(x, y) + "$ by $" + name + "$ about the origin.", answer: [img[0], img[1]],
            hints: ["The rule is $" + rule + "$.", n === 2 ? "Both signs flip." : "The two coordinates swap, and one of them takes a minus."],
            why: "$" + rule + "$, so $" + pt(x, y) + " \\to " + pt(img[0], img[1]) + "$." };
        } },
      { id: "geo-rdet", title: "Determining rotations", lesson: 4,
        gen: function (R) {
          var x = R.nz(-6, 6), y = R.nz(-6, 6), n = R.pick([1, 2, 3]);
          var img = turn([[x, y]], n)[0];
          var label = { 1: "$90^\\circ$ counterclockwise", 2: "$180^\\circ$", 3: "$90^\\circ$ clockwise" };
          return mc(R, { prompt: "A rotation about the origin takes $" + pt(x, y) + "$ to $" + pt(img[0], img[1]) + "$. Which rotation was it?",
            right: label[n],
            wrong: [1, 2, 3].filter(function (k) { return k !== n; }).map(function (k) {
              var w = turn([[x, y]], k)[0];
              return { t: label[k], fb: "That would land it on $" + pt(w[0], w[1]) + "$." };
            }),
            keep: true, skill: "Determining rotations",
            hints: ["Try each rule on the starting point and see which one lands on the image.",
                    "$90^\\circ$ counterclockwise is $(x, y) \\to (-y, x)$; $180^\\circ$ is $(-x, -y)$; $90^\\circ$ clockwise is $(y, -x)$."],
            why: "$" + pt(x, y) + " \\to " + pt(img[0], img[1]) + "$ is " + label[n].replace(/\$/g, "") + " about the origin." });
        } },
      { id: "geo-refpoint", title: "Reflecting points", lesson: 5,
        gen: function (R) {
          var x = R.nz(-8, 8), y = R.nz(-8, 8), over = R.pick(["x", "y", "yx"]);
          var img = flip([[x, y]], over)[0];
          var name = over === "x" ? "the $x$-axis" : over === "y" ? "the $y$-axis" : "the line $y = x$";
          var rule = over === "x" ? "(x, y) \\to (x, -y)" : over === "y" ? "(x, y) \\to (-x, y)" : "(x, y) \\to (y, x)";
          return { type: "pair", prompt: "Reflect $" + pt(x, y) + "$ over " + name + ".", answer: [img[0], img[1]],
            hints: ["The rule is $" + rule + "$."],
            why: "$" + rule + "$, so $" + pt(x, y) + " \\to " + pt(img[0], img[1]) + "$." };
        } },
      { id: "geo-refdet", title: "Determining reflections", lesson: 5,
        gen: function (R) {
          var x = R.nz(-7, 7), y = R.nz(-7, 7);
          while (Math.abs(x) === Math.abs(y)) y = R.nz(-7, 7);
          var over = R.pick(["x", "y", "yx"]);
          var img = flip([[x, y]], over)[0];
          var label = { x: "The $x$-axis", y: "The $y$-axis", yx: "The line $y = x$" };
          return mc(R, { prompt: "A reflection takes $" + pt(x, y) + "$ to $" + pt(img[0], img[1]) + "$. What is the line of reflection?",
            right: label[over],
            wrong: ["x", "y", "yx"].filter(function (k) { return k !== over; }).map(function (k) {
              var w = flip([[x, y]], k)[0];
              return { t: label[k], fb: "That would send it to $" + pt(w[0], w[1]) + "$." };
            }),
            keep: true, skill: "Determining reflections",
            hints: ["Which coordinate changed sign — or did they swap?",
                    "$x$-axis: the $y$ flips. $y$-axis: the $x$ flips. $y = x$: they swap."],
            why: "$" + pt(x, y) + " \\to " + pt(img[0], img[1]) + "$ is a reflection over " + label[over].toLowerCase().replace("the ", "the ") + "." });
        } },
      { id: "geo-dpoint", title: "Dilating points", lesson: 6,
        gen: function (R) {
          var k = R.pick([2, 3, 4, 0.5, 1.5]);
          var x = R.nz(-8, 8), y = R.nz(-8, 8);
          if (k % 1) { x = 2 * R.nz(-4, 4); y = 2 * R.nz(-4, 4); }
          return { type: "pair", prompt: "Dilate $" + pt(x, y) + "$ about the origin by a scale factor of $" + (k === 0.5 ? "\\frac{1}{2}" : num(k)) + "$.",
            answer: [x * k, y * k],
            hints: ["Multiply **both** coordinates by " + (k === 0.5 ? "a half" : num(k)) + ".",
                    "$" + x + " \\times " + num(k) + " = " + num(x * k) + "$."],
            why: "$(kx, ky) = " + pt(x * k, y * k) + "$." };
        } },
      { id: "geo-dscale", title: "Finding the scale factor", lesson: 6,
        gen: function (R) {
          var k = R.pick([2, 3, 4, 5, 0.5, 0.25]);
          var x = R.nz(-6, 8), y = R.nz(-6, 8);
          if (k < 1) { x = 4 * R.nz(-2, 2); y = 4 * R.nz(-2, 2); }
          return { type: "num", prompt: "A dilation about the origin takes $" + pt(x, y) + "$ to $" + pt(x * k, y * k) + "$. What is the scale factor?",
            answer: k, shown: k === 0.5 ? "1/2" : k === 0.25 ? "1/4" : String(k),
            label: "Your answer (a fraction or a decimal)",
            near: [{ v: x * k - x, fb: "That is the difference. A dilation multiplies: what times $" + x + "$ gives $" + num(x * k) + "$?" }],
            hints: ["Divide an image coordinate by the one it came from: $" + num(x * k) + " \\div " + x + "$.",
                    "Check it on the other pair too."],
            why: "$" + num(x * k) + " \\div " + x + " = " + num(k) + "$." };
        } },
      { id: "geo-props", title: "What a transformation keeps", lesson: 7,
        gen: function (R) {
          var T = R.pick([
            { q: "Does a translation change a figure's side lengths?", right: "No", fb: "A translation only changes position." },
            { q: "Does a rotation change a figure's angles?", right: "No", fb: "Turning a figure leaves every angle as it was." },
            { q: "Does a reflection change a figure's area?", right: "No", fb: "A mirror image is the same size, so the area is the same." },
            { q: "Does a dilation with $k = 3$ change a figure's side lengths?", right: "Yes", fb: "Every length is multiplied by 3." },
            { q: "Does a dilation change a figure's angles?", right: "No", fb: "A dilation keeps the shape, which means the angles." },
            { q: "Does a reflection change which way round a figure faces?", right: "Yes", fb: "A reflection turns a figure over — that is what makes it a mirror image." },
            { q: "Does a translation change which way round a figure faces?", right: "No", fb: "Sliding never flips a figure." },
            { q: "Does a rotation change where a figure is?", right: "Yes", fb: "Everything but the centre travels round it." }
          ]);
          return mc(R, { prompt: T.q, right: T.right, wrong: [{ t: T.right === "Yes" ? "No" : "Yes", fb: T.fb }],
            keep: true, skill: "What a transformation keeps",
            hints: ["Rigid moves (slide, turn, flip) keep every length, angle and area. A dilation keeps only the angles."],
            why: T.fb });
        } }
    ]
  });
})();
