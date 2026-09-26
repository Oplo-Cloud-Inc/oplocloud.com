/* ==========================================================================
   SAT Math — Domain 4: Geometry and Trigonometry (about 15%).
   See lab/satkit.js for the item format, SAT.domain and the helpers.

   Four skills: area and volume; lines, angles and triangles (with similar
   triangles); right triangles and trigonometry; circles.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB, S = L && L.SAT;
  if (!S || !S.domain) return;
  var H = S.h, F = S.fig, c = H.c, x = H.x, w = H.w, tex = H.tex, W = H.walk, num = L.num;
  var lin = H.lin;
  function sgn(v) { return v < 0 ? "- " + Math.abs(v) : "+ " + v; }
  function plural(n, w1) { return n + " " + w1 + (n === 1 ? "" : "s"); }
  function pi(k) { return k === 1 ? "\\pi" : tex(k) + "\\pi"; }            // kπ as TeX
  function cpi(k, o) { return Object.assign({ t: "$" + pi(k) + "$", v: k }, o || {}); }   // a choice worth kπ
  function deg(v) { return num(v) + "°"; }

  /* ===================================================== 1 · Area & volume */
  function areaRect(R) {
    var wv = R.int(2, 9), k = R.int(2, 4), lv = k * wv, A = wv * lv, P = 2 * (wv + lv);
    return {
      stem: "The length of a rectangle is " + k + " times its width. The area of the rectangle is " + A + " square inches. What is the perimeter of the rectangle, in inches?",
      choices: [c(P, { ok: true }),
        c(wv + lv, { err: "formula", tr: "added one length and one width", why: "A perimeter goes all the way round: two lengths and two widths." }),
        c(A === 4 * wv ? A + 2 : 4 * wv, { err: "misread", tr: "treated the rectangle as a square", why: "The length is " + k + " times the width, so it isn't a square." }),
        c(P + lv, { err: "calc", tr: "counted a side three times", why: "Perimeter $= 2ℓ+ 2w$." })],
      hint: "Let the width be $w$. What is the area in terms of $w$?",
      strategy: "Name the width $w$; the length is $" + k + "w$. Area gives $" + k + "w^2 = " + A + "$. Then perimeter $= 2(ℓ+ w)$.",
      walk: W([[k + "w \\cdot w = " + A, "Area = length × width."], ["w^2 = " + (A / k) + " \\Rightarrow w = " + wv, "Solve (a length is positive)."], ["ℓ= " + lv, "The length."], ["P = 2(" + lv + " + " + wv + ") = " + P, "All the way round."]]),
      concept: "Area measures the inside (square units); perimeter measures the way round (units).",
      rebuild: [{ q: "If the width is $w$, the area is $" + k + "w^2 = " + A + "$. What is $w$?", num: wv, ok: "$w = " + wv + "$." }, { q: "The length is…", num: lv, ok: lv + " inches." }, { q: "The perimeter, $2(ℓ+ w)$, is…", num: P, ok: P + " inches." }],
      autopsy: { hard: "Area is given; perimeter is asked — two formulas.", clue: "\"Times its width\" — one unknown.", remember: "Area inside, perimeter around." }
    };
  }
  function areaCyl(R) {
    var r = R.int(2, 6), h = R.int(3, 12), V = r * r * h;
    return {
      stem: "The right circular cylinder shown has a radius of " + r + " centimeters and a height of " + h + " centimeters. What is the volume of the cylinder, in cubic centimeters?",
      fig: F.solid({ kind: "cyl", labels: { r: String(r), h: String(h) } }),
      choices: [cpi(V, { ok: true }),
        cpi(2 * r * h, { err: "formula", tr: "used the circumference instead of the base area", why: "Volume uses the area of the base, $\\pi r^2$, not the circumference $2\\pi r$." }),
        cpi(4 * r * r * h, { err: "formula", tr: "used the diameter as the radius", why: "The radius is " + r + ": $\\pi(" + r + ")^2(" + h + ")$." }),
        cpi(r * h === V ? r * h + 1 : r * h, { err: "formula", tr: "forgot to square the radius", why: "The base area is $\\pi r^2 = " + pi(r * r) + "$." })],
      hint: "Volume of a cylinder = area of the base × height. What is the base's area?",
      strategy: "$V = \\pi r^2 h$ (it's on the reference sheet).",
      walk: W([["V = \\pi r^2 h", "Base area times height."], ["= \\pi(" + r + ")^2(" + h + ")", "Substitute."], ["= " + pi(V), "Simplify."]]),
      concept: "Any prism or cylinder: volume = base area × height. A cylinder's base is a circle.",
      rebuild: [{ q: "What is the area of the circular base, in terms of $\\pi$?", opts: ["$" + pi(r * r) + "$", "$" + pi(2 * r) + "$"], a: 0, ok: "$\\pi r^2 = " + pi(r * r) + "$." }, { q: "Times the height " + h + ":", opts: ["$" + pi(V) + "$", "$" + pi(r * r + h) + "$"], a: 0, ok: "$" + pi(V) + "$ cm³." }],
      autopsy: { clue: "Radius and height of a cylinder.", remember: "$V = \\pi r^2 h$ — base area × height." }
    };
  }
  function areaScale(R) {
    var k = R.pick([2, 3, 4]), kind = R.pick(["cube", "sphere", "square"]);
    var right = kind === "square" ? k * k : k * k * k;
    var noun = kind === "square" ? "area" : "volume", part = kind === "cube" ? "edge length" : kind === "sphere" ? "radius" : "side length";
    return {
      stem: "The " + part + " of a " + kind + " is multiplied by " + k + ". By what factor is the " + noun + " of the " + kind + " multiplied?",
      choices: [c(right, { ok: true }),
        c(k, { err: "concept", tr: "scaled " + noun + " like a length", why: (noun === "area" ? "Area has two dimensions: $" + k + " \\times " + k + "$." : "Volume has three dimensions: $" + k + " \\times " + k + " \\times " + k + "$.") }),
        c(noun === "area" ? k * k * k : k * k, { err: "concept", tr: noun === "area" ? "cubed for an area" : "squared for a volume", why: noun === "area" ? "Area is two-dimensional: square the factor." : "Volume is three-dimensional: cube the factor." }),
        c(2 * k === right ? 3 * k : 2 * k, { err: "calc", tr: "doubled the factor", why: "Scaling multiplies, it doesn't add." })],
      hint: "How many dimensions does " + noun + " have?",
      strategy: "Scale lengths by $k$ → areas by $k^2$ → volumes by $k^3$. Try it with a 1-unit " + kind + ".",
      walk: W([[noun === "area" ? "A \\propto s^2" : kind === "sphere" ? "V = \\tfrac{4}{3}\\pi r^3" : "V = s^3", noun === "area" ? "Area uses the length twice." : "Volume uses the length three times."], [(noun === "area" ? k + "^2" : k + "^3") + " = " + right, "So it's multiplied by " + right + "."]]),
      concept: "Lengths scale by $k$, areas by $k^2$, volumes by $k^3$ — because each dimension is stretched.",
      rebuild: [{ q: "How many lengths multiply together in a " + noun + " formula?", num: noun === "area" ? 2 : 3, ok: "So the factor is used that many times." }, { q: "$" + k + "^" + (noun === "area" ? 2 : 3) + " =$", num: right, ok: "Multiplied by " + right + "." }],
      autopsy: { trap: "Scaling " + noun + " by " + k + ".", clue: "A length is scaled; a " + noun + " is asked.", remember: "$k$, $k^2$, $k^3$ for length, area, volume." }
    };
  }
  function areaComposite(R) {
    var a = R.int(6, 12), b = R.int(4, 9), cw = R.int(2, a - 3), ch = R.int(1, b - 2);
    var A = a * b - cw * ch;
    return {
      stem: "The figure shows a " + a + "-by-" + b + " rectangle with a " + cw + "-by-" + ch + " rectangle cut from one corner. What is the area of the shaded figure?",
      fig: F.shape({ pts: { A: [0, 0], B: [a, 0], C: [a, b - ch], D: [a - cw, b - ch], E: [a - cw, b], G: [0, b] },
                    fill: [{ pts: ["A", "B", "C", "D", "E", "G"], cls: "b" }], polys: [["A", "B", "C", "D", "E", "G"]],
                    sides: [["A", "B", String(a)], ["G", "A", String(b)], ["D", "C", String(cw)], ["E", "D", String(ch)]], w: 320, h: 230 }),
      answer: A, shown: String(A),
      near: [{ v: a * b, tr: "forgot to subtract the cut-out" }, { v: 2 * (a + b), tr: "found the perimeter" }],
      hint: "What's the area of the whole rectangle? What was taken away?",
      strategy: "Whole minus the missing piece: $" + a + " \\times " + b + " - " + cw + " \\times " + ch + "$.",
      walk: W([[a + " \\times " + b + " = " + (a * b), "The whole rectangle."], [cw + " \\times " + ch + " = " + (cw * ch), "The corner that's missing."], [(a * b) + " - " + (cw * ch) + " = " + A, "Shaded area."]]),
      concept: "Composite areas: add the pieces, or take the whole and subtract what's missing.",
      rebuild: [{ q: "Area of the full " + a + "-by-" + b + " rectangle?", num: a * b, ok: "Now subtract the corner." }, { q: "Area of the " + cw + "-by-" + ch + " corner?", num: cw * ch, ok: "So the shaded area is " + A + "." }],
      autopsy: { clue: "A shape with a piece missing.", remember: "Whole − missing." }
    };
  }
  function areaSurface(R) {
    var l = R.int(3, 10), wv = R.int(2, 8), h = R.int(2, 9);
    while (wv === l) wv = R.int(2, 8);
    while (h === l || h === wv) h = R.int(2, 9);
    var SA = 2 * (l * wv + l * h + wv * h), V = l * wv * h;
    return {
      stem: "A closed rectangular box is " + l + " inches long, " + wv + " inches wide and " + h + " inches tall. What is the total surface area of the box, in square inches?",
      fig: F.solid({ kind: "box", labels: { l: String(l), w: String(wv), h: String(h) } }),
      choices: [c(SA, { ok: true }),
        c(V, { err: "formula", tr: "found the volume instead", why: "Volume fills the box ($ℓwh$); surface area covers its six faces." }),
        c(SA / 2, { err: "formula", tr: "counted each pair of faces once", why: "A box has six faces in three matching pairs: double each area." }),
        c(4 * (l + wv + h) === SA ? SA + 4 : 4 * (l + wv + h), { err: "formula", tr: "added the edges instead of face areas", why: "Surface area adds the areas of the faces, not lengths." })],
      hint: "How many faces does a box have, and which of them match?",
      strategy: "Surface area $= 2(ℓw + ℓh + wh)$: three different faces, each appearing twice. (This one is NOT on the reference sheet.)",
      walk: W([[l + " \\times " + wv + " = " + (l * wv) + ",\\ " + l + " \\times " + h + " = " + (l * h) + ",\\ " + wv + " \\times " + h + " = " + (wv * h), "The three different faces."], ["2(" + (l * wv) + " + " + (l * h) + " + " + (wv * h) + ") = " + SA, "Each appears twice."]]),
      concept: "Surface area is the total area of every face — imagine unfolding the box flat and measuring the paper.",
      rebuild: [{ q: "What is the area of the top (" + l + " by " + wv + ")?", num: l * wv, ok: "The bottom matches it." }, { q: "Add the three different faces: " + (l * wv) + " + " + (l * h) + " + " + (wv * h) + " =", num: l * wv + l * h + wv * h, ok: "Now double it." }, { q: "Total surface area:", num: SA, ok: SA + " square inches." }],
      autopsy: { trap: "Giving the volume.", clue: "\"Surface area\" — the outside.", remember: "$2(ℓw + ℓh + wh)$." }
    };
  }
  var AREA = {
    id: "g-area", t: "Area & volume", short: "Area & volume", kind: "Area or volume",
    blurb: "Areas of composite figures, volumes of cylinders, prisms, cones and spheres, and what scaling does to them.",
    forms: ["figure", "word", "twist"],
    school: { course: "geo", unit: 8, t: "Geometry, Unit 8: Solid geometry" },
    autopsy: { testing: "Area and volume", clue: "A figure with dimensions, and \"area\" or \"volume\".", remember: "The formulas are on the reference sheet — open it.", spotQ: "Is each of these an area or volume question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "A box is 4 by 5 by 6. How much does it hold?", yes: true, why: "Volume $= 4 \\times 5 \\times 6$." },
        { t: "A circle's radius triples. What happens to its area?", yes: true, why: "Area scales by $3^2$." },
        { t: "What is $\\sin 30°$?", yes: false, why: "Trigonometry." }]);
    },
    lesson: [
      { type: "learn", kicker: "Everything is base × height",
        prompt: "Prisms and cylinders all work the same way: the area of the base, stacked up to the height.",
        scene: { type: "walk", rows: [
          { m: "V = ℓw h", say: "A box: base $ℓw$, times height." }, { m: "V = \\pi r^2 h", say: "A cylinder: base $\\pi r^2$, times height." },
          { m: "V = \\tfrac{1}{3}\\pi r^2 h", say: "A cone is a third of the cylinder around it." }, { m: "\\text{Reference sheet}", say: "All of these are given on the SAT — open the Reference tool any time." }] }, gate: true },
      { type: "learn", kicker: "Scaling",
        prompt: "Double every length of a cube, and look what happens:",
        scene: { type: "walk", rows: [
          { m: "\\text{edge } 1 \\to 2", say: "Lengths ×2." }, { m: "\\text{face } 1 \\to 4", say: "Areas ×$2^2 = 4$." }, { m: "\\text{volume } 1 \\to 8", say: "Volumes ×$2^3 = 8$." }] }, gate: true },
      { type: "learn", kicker: "Surface area",
        prompt: "Surface area covers the outside — and its formula is **not** on the reference sheet, so build it:",
        scene: { type: "walk", rows: [
          { m: "\\text{box } 5 \\times 3 \\times 2", say: "Six faces, in three matching pairs." }, { m: "15,\\ 10,\\ 6", say: "The three different faces." },
          { m: "2(15 + 10 + 6) = 62", say: "Each pair counted twice." }, { m: "\\text{cylinder: } 2\\pi r^2 + 2\\pi r h", say: "Two circles plus the label, unrolled into a rectangle." }] }, gate: true },
      { type: "choice", prompt: "The radius of a sphere is tripled. Its volume is multiplied by…",
        options: [{ t: "$27$" }, { t: "$3$", fb: "Volume is three-dimensional: $3^3$." }, { t: "$9$", fb: "That's for area: $3^2$." }, { t: "$\\frac{4}{3} \\cdot 3$", fb: "The $\\frac{4}{3}\\pi$ doesn't change; only $r^3$ does." }],
        answer: 0, hints: ["$V = \\frac{4}{3}\\pi r^3$ — what happens to $r^3$?"], why: "$(3r)^3 = 27r^3$." }
    ],
    gen: function (R, o) {
      if (o.form === "word") return o.diff === 1 ? areaRect(R) : o.diff === 2 ? areaComposite(R) : areaSurface(R);
      if (o.form === "twist") return o.diff >= 3 ? areaSurface(R) : areaScale(R);
      return o.diff === 1 ? areaRect(R) : o.diff === 2 ? areaCyl(R) : areaComposite(R);
    }
  };

  /* ======================================== 2 · Lines, angles, triangles */
  function angParallel(R) {
    var a = R.int(35, 80), kind = R.pick(["corr", "alt", "same"]);
    // two horizontal lines y = 0 and y = 4; a transversal through (x1, -1) and (x2, 5)
    var x1 = 2, x2 = x1 + 6 / Math.tan(a * Math.PI / 180);
    var t0 = 1 / 6, t4 = 5 / 6, P = [x1 + (x2 - x1) * t0, 0], Q = [x1 + (x2 - x1) * t4, 4];
    var pts = { A: [-1, 0], B: [12, 0], C: [-1, 4], D: [12, 4], E: [x1, -1], G: [x2, 5], P: P, Q: Q };
    var ask = kind === "same" ? 180 - a : a;
    // The given angle at P: between the ray to the right (B) and the ray up the transversal (G).
    var angles = [["B", "P", "G", String(a) + "°"]];
    if (kind === "corr") angles.push(["D", "Q", "G", "x°", 18]);
    else if (kind === "alt") angles.push(["C", "Q", "E", "x°", 18]);
    else angles.push(["D", "Q", "E", "x°", 18]);
    return {
      stem: "In the figure, lines $ℓ$ and $m$ are parallel. What is the value of $x$?",
      fig: F.shape({ pts: pts, lines: [["A", "B", 10], ["C", "D", 10], ["E", "G", 18]], angles: angles, labels: { A: { t: "m", dx: -14, dy: 0 }, C: { t: "ℓ", dx: -14, dy: 0 } }, w: 380, h: 240, noScale: true }),
      choices: [c(ask, { ok: true }),
        c(180 - ask, { err: "concept", tr: kind === "same" ? "treated supplementary angles as equal" : "took supplementary for equal", why: kind === "same" ? "These are interior angles on the same side of the transversal: they add to 180°." : "These angles are in matching positions, so they're equal — not supplementary." }),
        c(90 - a, { err: "concept", tr: "used complementary angles", why: "Nothing here makes a right angle. With parallel lines, angles are equal or add to 180°." }),
        c(a / 2 === ask ? a / 2 + 10 : a / 2, { err: "misread", tr: "halved the angle", why: "Parallel lines don't halve angles." })],
      hint: "Are the two angles in matching positions, or on the same side between the lines?",
      strategy: "Parallel lines cut by a transversal: every acute angle is equal, every obtuse angle is equal, and an acute plus an obtuse is 180°.",
      walk: W([[kind === "corr" ? "\\text{corresponding}" : kind === "alt" ? "\\text{alternate interior}" : "\\text{same-side interior}", "How the two angles sit."], [kind === "same" ? "x = 180 - " + a + " = " + ask : "x = " + a, kind === "same" ? "Supplementary." : "Equal."]]),
      concept: "A transversal crosses two parallel lines at the same tilt, so it makes the same angles at both crossings.",
      rebuild: [{ q: "Is the angle marked $x°$ acute or obtuse in the picture?", opts: ["Acute", "Obtuse"], a: ask < 90 ? 0 : 1, ok: ask < 90 ? "Acute — like the " + a + "° angle." : "Obtuse — so it pairs with the " + a + "° angle to make 180°." }, { q: "So $x =$", num: ask, ok: "$x = " + ask + "$." }],
      autopsy: { trap: "Mixing up \"equal\" and \"add to 180\".", clue: "Parallel lines and a transversal.", remember: "Acute = acute, obtuse = obtuse, acute + obtuse = 180°." }
    };
  }
  function angTriangle(R) {
    if (R.chance(0.5)) {
      var A = R.int(30, 70), B = R.int(30, 70), C = 180 - A - B;
      return {
        stem: "In triangle $ABC$, the measure of angle $A$ is $" + A + "°$ and the measure of angle $B$ is $" + B + "°$. What is the measure, in degrees, of the exterior angle at $C$?",
        choices: [c(A + B, { ok: true }),
          c(C, { err: "misread", tr: "gave the interior angle", why: "The interior angle at $C$ is " + C + "°. The exterior angle is its supplement." }),
          c(360 - A - B, { err: "formula", tr: "used 360° for a triangle", why: "A triangle's angles add to 180°." }),
          c(Math.abs(A - B) === A + B ? A + B + 10 : Math.abs(A - B), { err: "concept", tr: "subtracted the two angles", why: "The exterior angle equals the **sum** of the two remote interior angles." })],
        hint: "What do the three angles of a triangle add to? And an angle plus its exterior angle?",
        strategy: "An exterior angle equals the sum of the two interior angles not next to it: $" + A + " + " + B + "$.",
        walk: W([["C = 180 - " + A + " - " + B + " = " + C, "Interior angle."], ["180 - " + C + " = " + (A + B), "The exterior angle is its supplement — the sum of the other two."]]),
        concept: "A triangle's angles add to 180°, so an exterior angle equals the two remote interior angles added.",
        rebuild: [{ q: "What is the interior angle at $C$?", num: C, ok: C + "°." }, { q: "The exterior angle is 180° minus that:", num: A + B, ok: (A + B) + "° — the sum of the other two." }],
        autopsy: { trap: "Giving the interior angle.", clue: "\"Exterior angle\".", remember: "Exterior = sum of the two remote interiors." }
      };
    }
    var top = R.pick([20, 30, 40, 50, 70, 80, 100]), base = (180 - top) / 2;
    return {
      stem: "In isosceles triangle $PQR$, $PQ = PR$ and the measure of angle $P$ is $" + top + "°$. What is the measure, in degrees, of angle $Q$?",
      choices: [c(base, { ok: true }),
        c(top, { err: "concept", tr: "made the equal angles the wrong pair", why: "Equal sides are opposite equal angles. $PQ = PR$, so the angles at $Q$ and $R$ are equal." }),
        c(180 - top, { err: "calc", tr: "forgot to split between two angles", why: "$180 - " + top + " = " + (180 - top) + "$ is shared by angles $Q$ and $R$." }),
        c((180 - top) / 3, { err: "calc", tr: "split the remainder three ways", why: "Only $Q$ and $R$ share it." })],
      hint: "Which two angles are equal?",
      strategy: "Equal sides → equal opposite angles. $Q$ and $R$ share $180 - " + top + "$.",
      walk: W([["Q = R", "Opposite the equal sides."], ["2Q = 180 - " + top + " = " + (180 - top), "Angles add to 180°."], ["Q = " + base, "Halve."]]),
      concept: "In an isosceles triangle, the angles opposite the equal sides are equal.",
      rebuild: [{ q: "Which angles are equal?", opts: ["$Q$ and $R$", "$P$ and $Q$"], a: 0, ok: "Opposite the equal sides." }, { q: "They share $180 - " + top + "$. Each is…", num: base, ok: base + "°." }],
      autopsy: { clue: "Two equal sides.", remember: "Equal sides ↔ equal opposite angles." }
    };
  }
  function angSimilar(R) {
    var k = R.pick([1.5, 2, 2.5, 3]), ad = R.int(2, 6) * 2, de = R.int(3, 9);
    var ab = ad * k, bc = de * k, db = ab - ad;
    return {
      stem: "In the figure, $\\overline{DE}$ is parallel to $\\overline{BC}$, $AD = " + ad + "$, $DB = " + num(db) + "$ and $DE = " + de + "$. What is the length of $\\overline{BC}$?",
      fig: F.shape({ pts: { A: [3, 7], B: [0, 0], C: [9, 0], D: [3 - 3 / k, 7 - 7 / k], E: [3 + 6 / k, 7 - 7 / k] }, polys: [["A", "B", "C"]], segs: [["D", "E"]],
                    labels: { A: "A", B: "B", C: "C", D: { t: "D", dx: -14, dy: 0 }, E: { t: "E", dx: 14, dy: 0 } }, w: 320, h: 250, noScale: true }),
      answer: bc, shown: num(bc), secs: 115,
      near: [{ v: de * db / ad, tr: "matched the wrong sides" }, { v: de + db, tr: "added instead of scaling" }],
      hint: "Triangles $ADE$ and $ABC$ are similar. Which side of the big triangle matches $AD$?",
      strategy: "Similar triangles: $\\frac{BC}{DE} = \\frac{AB}{AD}$, and $AB = AD + DB = " + num(ab) + "$ — the whole side, not just $DB$.",
      walk: W([["AB = " + ad + " + " + num(db) + " = " + num(ab), "The whole side of the big triangle."], ["\\frac{BC}{" + de + "} = \\frac{" + num(ab) + "}{" + ad + "}", "Matching sides, same ratio."], ["BC = " + num(bc), "Solve."]]),
      concept: "A line parallel to one side of a triangle cuts off a smaller, similar triangle: all its sides are scaled by the same factor.",
      rebuild: [{ q: "What is $AB$, the whole left side?", num: ab, ok: num(ab) + "." }, { q: "The big triangle is $\\frac{AB}{AD}$ times the small one. That factor is…", num: k, ok: "Scale factor " + num(k) + "." }, { q: "So $BC = " + de + " \\times " + num(k) + " =$", num: bc, ok: num(bc) + "." }],
      autopsy: { hard: "The ratio must use the whole side $AB$, not the piece $DB$.", trap: "Using $DB$ as the matching side.", clue: "Parallel segment inside a triangle → similar triangles.", remember: "Match whole side to whole side." }
    };
  }
  function angAlgebra(R) {
    var k = R.pick([2, 3]), b = R.int(Math.ceil(120 / (k + 2)), Math.floor(175 / (k + 2))), d = 180 - (k + 2) * b;
    return {
      stem: "In triangle $ABC$, the measure of angle $A$ is " + (k === 2 ? "twice" : "three times") + " the measure of angle $B$, and the measure of angle $C$ is $" + d + "°$ more than the measure of angle $B$. What is the measure, in degrees, of angle $B$?",
      answer: b, shown: String(b),
      near: [{ v: k * b, tr: "gave angle A" }, { v: b + d, tr: "gave angle C" }],
      hint: "Write all three angles in terms of $B$. What do they add to?",
      strategy: "$A = " + k + "B$, $C = B + " + d + "$, and $A + B + C = 180$.",
      walk: W([[k + "B + B + (B + " + d + ") = 180", "Angles add to 180°."], [(k + 2) + "B = " + (180 - d), "Collect."], ["B = " + b, "Divide."]]),
      concept: "Angle facts become equations: name one angle, write the others from it, use the 180° total.",
      rebuild: [{ q: "In terms of $B$, the three angles add to…", opts: ["$" + (k + 2) + "B + " + d + "$", "$" + (k + 1) + "B + " + d + "$"], a: 0, ok: "Set that equal to 180." }, { q: "$" + (k + 2) + "B + " + d + " = 180$, so $B =$", num: b, ok: b + "°." }],
      autopsy: { clue: "Every angle is described using $B$.", remember: "Triangle: $A + B + C = 180°$." }
    };
  }
  /* Two crossing lines with two of their angles marked: vertical (opposite)
     or a linear pair (side by side). Drawn with the marked angle kept
     between 60° and 120° so the labels have room. */
  function crossFig(t1, t2, supp, ang) {
    var th = Math.max(60, Math.min(120, ang)), r = th * Math.PI / 180, q = [2.6 * Math.cos(r), 2.6 * Math.sin(r)];
    function at(dg, k) { var t = dg * Math.PI / 180; return [k * Math.cos(t), k * Math.sin(t)]; }
    var m2 = supp ? (th + 180) / 2 : 180 + th / 2;
    // Far enough out that a label clears both lines: the narrower the
    // angle, the further (about 64·cos(half-angle) px, at ~31 px a unit).
    function far(half) { return (64 * Math.cos(half * Math.PI / 180) + 16) / 31; }
    var k1 = far(th / 2), k2 = supp ? far((180 - th) / 2) : k1;
    return F.shape({ pts: { P1: [-3, 0], P2: [3, 0], Q1: q, Q2: [-q[0], -q[1]], O: [0, 0], L1: at(th / 2, k1), L2: at(m2, k2) },
      lines: [["P1", "P2", 14], ["Q1", "Q2", 14]],
      angles: [["P2", "O", "Q1", null, 20], supp ? ["Q1", "O", "P1", null, 26] : ["P1", "O", "Q2", null, 20]],
      labels: { L1: { t: t1, dx: 0, dy: 0 }, L2: { t: t2, dx: 0, dy: 0 } },
      w: 360, h: 230, noScale: true, alt: "Two intersecting lines with two angles marked" });
  }
  function angVertical(R) {
    var xv = R.int(8, 30), a = R.int(2, 5), b = R.int(1, 3), p = R.int(-10, 25);
    while (a === b) b = R.int(1, 4);
    var q = a * xv + p - b * xv, ang = a * xv + p;
    if (ang <= 10 || ang >= 170) return angTriangle(R);
    var supp = R.chance(0.4);
    if (supp) q = 180 - ang - b * xv;
    return {
      stem: "In the figure, two lines intersect. " + (supp ? "Two angles next to each other on a straight line" : "Two vertical angles (opposite each other)") + " measure $(" + lin(a, p) + ")°$ and $(" + lin(b, q) + ")°$. What is the value of $x$?",
      fig: crossFig(S.plain("$(" + lin(a, p) + ")°$"), S.plain("$(" + lin(b, q) + ")°$"), supp, ang),
      answer: xv, shown: String(xv),
      near: [{ v: ang, tr: "gave the angle instead of x" }],
      hint: supp ? "Angles that make a straight line add to what?" : "What is true about vertical angles?",
      strategy: supp ? "Adjacent angles on a line are supplementary: set their sum equal to 180 and solve." : "Vertical angles are equal: set the two expressions equal and solve.",
      walk: supp ? W([[lin(a, p) + " + " + lin(b, q) + " = 180", "A straight line is 180°."], [(a + b) + "x " + sgn(p + q) + " = 180", "Combine."], ["x = " + xv, "Solve."]])
        : W([[lin(a, p) + " = " + lin(b, q), "Vertical angles are equal."], [(a - b) + "x = " + (q - p), "Collect."], ["x = " + xv, "Solve."]]),
      concept: "Two crossing lines make two pairs of equal (vertical) angles, and any two neighbouring angles add to 180°.",
      rebuild: [{ q: supp ? "The two angles add to…" : "The two angles are…", opts: supp ? ["180°", "90°", "equal"] : ["equal", "supplementary", "complementary"], a: 0, ok: "So write the equation." }, { q: "Solve for $x$:", num: xv, ok: "$x = " + xv + "$ (the angle is " + ang + "°)." }],
      autopsy: { trap: "Answering with the angle instead of $x$.", clue: supp ? "Angles side by side on a line." : "Angles opposite each other.", remember: "Vertical angles equal; linear pairs add to 180°." }
    };
  }
  function angCongruence(R) {
    var k = R.pick([2, 3, 1.5, 0.5]), B = R.int(35, 80), ab = R.int(3, 9) * 2;
    var name1 = "ABC", name2 = R.pick(["DEF", "PQR", "XYZ"]);
    var askAngle = R.chance(0.5);
    // Keep the four angle choices apart (B = 36 or 60 would collide).
    while (new Set([B, B * k, 180 - B, 90 - B]).size < 4) B = R.int(35, 80);
    return {
      stem: "Triangles $" + name1 + "$ and $" + name2 + "$ are similar, $\\triangle " + name1 + " \\sim \\triangle " + name2 + "$, with the vertices corresponding in the order written. Each side of $\\triangle " + name2 + "$ is " + num(k) + " times as long as the corresponding side of $\\triangle " + name1 + "$. " +
        (askAngle ? "If the measure of angle $B$ is $" + B + "°$, what is the measure, in degrees, of angle $" + name2[1] + "$?" : "If $AB = " + ab + "$, what is the length of $\\overline{" + name2.slice(0, 2) + "}$?"),
      choices: askAngle ? [c(B, { ok: true }),
          c(B * k === B ? B + 10 : B * k, { err: "concept", tr: "scaled the angle by the scale factor", why: "Similar figures have the same shape: angles stay the same, only lengths scale." }),
          c(180 - B, { err: "concept", tr: "took the supplement", why: "Corresponding angles of similar triangles are equal, not supplementary." }),
          c(90 - B > 0 ? 90 - B : B / 2, { err: "concept", tr: "took the complement", why: "Nothing here is a right angle; corresponding angles are equal." })]
        : [c(ab * k, { ok: true }),
          c(ab / k === ab * k ? ab + 3 : ab / k, { err: "calc", tr: "divided by the scale factor", why: "$\\triangle " + name2 + "$'s sides are " + num(k) + " times as long: multiply." }),
          c(ab, { err: "concept", tr: "treated similar as congruent", why: "Congruent triangles match exactly; similar ones are scaled by " + num(k) + "." }),
          c(ab + k === ab * k ? ab + 2 * k : ab + k, { err: "concept", tr: "added the scale factor", why: "Scaling multiplies lengths." })],
      hint: askAngle ? "Does scaling a triangle change its angles?" : "Which side of $\\triangle " + name2 + "$ matches $AB$? The order of the letters tells you.",
      strategy: "The order of letters in $\\triangle " + name1 + " \\sim \\triangle " + name2 + "$ pairs the parts: $A \\leftrightarrow " + name2[0] + "$, $B \\leftrightarrow " + name2[1] + "$, $C \\leftrightarrow " + name2[2] + "$. Angles match exactly; lengths scale.",
      walk: askAngle ? W([["B \\leftrightarrow " + name2[1], "Second letter to second letter."], ["\\angle " + name2[1] + " = " + B + "°", "Similar: angles are unchanged."]])
        : W([["AB \\leftrightarrow " + name2.slice(0, 2), "First two letters to first two letters."], [name2.slice(0, 2) + " = " + num(k) + " \\times " + ab + " = " + num(ab * k), "Lengths scale."]]),
      concept: "Similarity keeps angles and multiplies every length by the same factor; congruence keeps both. The letter order says which parts correspond.",
      rebuild: [{ q: askAngle ? "Which angle of $\\triangle " + name2 + "$ corresponds to $B$?" : "Which side of $\\triangle " + name2 + "$ corresponds to $AB$?", opts: askAngle ? ["$" + name2[1] + "$", "$" + name2[0] + "$", "$" + name2[2] + "$"] : ["$" + name2.slice(0, 2) + "$", "$" + name2.slice(1) + "$"], a: 0, ok: "By the letter order." }, { q: askAngle ? "Its measure is…" : "Its length is…", num: askAngle ? B : ab * k, ok: askAngle ? "Angles don't scale." : "Lengths do." }],
      autopsy: { trap: askAngle ? "Scaling an angle." : "Matching the wrong side.", clue: "$\\sim$ and the letter order.", remember: "Similar: same angles, proportional sides." }
    };
  }
  function angTriIneq(R) {
    var a = R.int(3, 9), b = a + R.int(2, 8), lo = b - a, hi = a + b;
    var ok = R.int(lo + 1, hi - 1);
    return {
      stem: "Two sides of a triangle have lengths " + a + " and " + b + ". Which of the following could be the length of the third side?",
      choices: [c(ok, { ok: true }),
        c(lo, { err: "concept", tr: "allowed the difference of the sides", why: "With a third side of " + lo + ", the two shorter sides only just reach: $" + a + " + " + lo + " = " + b + "$ — the triangle would be flat." }),
        c(hi, { err: "concept", tr: "allowed the sum of the sides", why: "The third side must be LESS than " + a + " + " + b + " = " + hi + ", or the other two can't meet." }),
        c(hi + R.int(1, 4), { err: "concept", tr: "ignored the triangle inequality", why: "No side can be as long as the other two combined." })],
      hint: "Could the third side be longer than the other two put together?",
      strategy: "Triangle inequality: the third side is between the difference and the sum of the other two — $" + lo + " < c < " + hi + "$.",
      walk: W([[b + " - " + a + " < c < " + b + " + " + a, "Between the difference and the sum."], [lo + " < c < " + hi, "Only a choice strictly inside works."]]),
      concept: "Any two sides of a triangle together must be longer than the third, or they can't close up.",
      rebuild: [{ q: "The third side must be less than…", num: hi, ok: "The sum." }, { q: "…and greater than…", num: lo, ok: "The difference. So it's strictly between " + lo + " and " + hi + "." }],
      autopsy: { clue: "Two sides known, the third unknown.", remember: "Difference < third side < sum." }
    };
  }
  var ANG = {
    id: "g-angles", t: "Lines, angles & triangles", short: "Angles & triangles", kind: "Angles, triangles or similarity",
    blurb: "Angles from parallel lines, triangle angle sums and exterior angles, isosceles triangles, and similar triangles.",
    forms: ["figure", "word", "twist"],
    school: { course: "g8", unit: 5, t: "8th Grade Math, Unit 5: Geometry" },
    autopsy: { testing: "Angle relationships and similar triangles", clue: "Parallel lines, a triangle, or a segment parallel to a side.", remember: "Triangles total 180°; parallel lines make equal or supplementary angles.", spotQ: "Is each of these about angles or similar triangles?" },
    spot: function (R) {
      return R.shuffle([
        { t: "Two parallel lines are cut by a transversal. One angle is 65°. Find its alternate interior angle.", yes: true, why: "Equal angles." },
        { t: "Triangles $ABC$ and $DEF$ are similar with $AB = 4$, $DE = 10$. Find $EF$ if $BC = 6$.", yes: true, why: "Scale factor 2.5." },
        { t: "A right triangle has legs 5 and 12. Find the hypotenuse.", yes: false, why: "Pythagorean theorem — right-triangle trigonometry." }]);
    },
    lesson: [
      { type: "learn", kicker: "Parallel lines",
        prompt: "When a line crosses two parallel lines, it makes the **same** angles at both crossings.",
        scene: { type: "walk", rows: [
          { m: "\\text{acute} = \\text{acute}", say: "Every small angle in the picture is equal." },
          { m: "\\text{obtuse} = \\text{obtuse}", say: "Every large angle is equal." },
          { m: "\\text{acute} + \\text{obtuse} = 180°", say: "A small and a large angle always make a straight line." }] }, gate: true },
      { type: "learn", kicker: "Triangles",
        prompt: "Two facts do most of the work:",
        scene: { type: "walk", rows: [
          { m: "A + B + C = 180°", say: "Every triangle." }, { m: "\\text{exterior } C = A + B", say: "An exterior angle equals the two far interior angles." },
          { m: "PQ = PR \\Rightarrow \\angle Q = \\angle R", say: "Isosceles: equal sides face equal angles." }] }, gate: true },
      { type: "learn", kicker: "Similar triangles",
        prompt: "Same shape, different size: every side is scaled by the same factor.",
        scene: { type: "walk", rows: [
          { m: "DE \\parallel BC", say: "A parallel segment cuts off a smaller copy." },
          { m: "\\frac{AD}{AB} = \\frac{AE}{AC} = \\frac{DE}{BC}", say: "Match **whole** sides: $AB$, not just the piece $DB$." }] }, gate: true },
      { type: "learn", kicker: "Three quick facts",
        prompt: "They show up as easy points:",
        scene: { type: "walk", rows: [
          { m: "\\text{vertical angles are equal}", say: "Two crossing lines: opposite angles match; neighbours add to 180°." },
          { m: "\\triangle ABC \\sim \\triangle DEF", say: "Letter order pairs the parts: $B \\leftrightarrow E$, $AB \\leftrightarrow DE$. Angles stay the same; lengths scale." },
          { m: "b - a < c < a + b", say: "The triangle inequality: sides 4 and 9 allow a third side between 5 and 13." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "word") return o.diff === 2 ? angTriIneq(R) : angAlgebra(R);
      if (o.form === "twist") return o.diff === 1 ? angCongruence(R) : o.diff === 2 ? angVertical(R) : angSimilar(R);
      return o.diff === 1 ? angParallel(R) : o.diff === 2 ? (R.chance(0.5) ? angTriangle(R) : angVertical(R)) : angSimilar(R);
    }
  };

  /* ====================================== 3 · Right triangles & trigonometry */
  var TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29]];
  function trigPyth(R) {
    var t = R.pick(TRIPLES), askHyp = R.chance(0.5), a = t[0], b = t[1], cc = t[2];
    return {
      stem: askHyp ? "A right triangle has legs of length " + a + " and " + b + ". What is the length of the hypotenuse?" : "A right triangle has a hypotenuse of length " + cc + " and one leg of length " + a + ". What is the length of the other leg?",
      fig: F.shape({ pts: { A: [0, 0], B: [b, 0], C: [0, a] }, polys: [["A", "B", "C"]], right: [["B", "A", "C"]],
                    sides: askHyp ? [["A", "B", String(b)], ["A", "C", String(a)], ["B", "C", "?"]] : [["A", "C", String(a)], ["B", "C", String(cc)], ["A", "B", "?"]], w: 300, h: 220 }),
      choices: [c(askHyp ? cc : b, { ok: true }),
        c(askHyp ? a + b : cc - a, { err: "concept", tr: askHyp ? "added the legs" : "subtracted the sides", why: "The sides aren't added or subtracted — their **squares** are: $a^2 + b^2 = c^2$." }),
        askHyp ? H.x("\\sqrt{" + (Math.abs(b * b - a * a)) + "}", { v: Math.sqrt(Math.abs(b * b - a * a)), err: "formula", tr: "subtracted the squares for the hypotenuse", why: "For the hypotenuse, add the squares: $" + a + "^2 + " + b + "^2$." })
          : H.x("\\sqrt{" + (cc * cc + a * a) + "}", { v: Math.sqrt(cc * cc + a * a), err: "formula", tr: "added the squares when finding a leg", why: "The hypotenuse is the longest side: $b^2 = " + cc + "^2 - " + a + "^2$." }),
        c(askHyp ? a * a + b * b : cc * cc - a * a, { err: "calc", tr: "forgot the square root", why: "That's $c^2$ (or $b^2$). Take the square root." })],
      hint: "Which side is the hypotenuse? It's opposite the right angle, and it's the longest.",
      strategy: "$a^2 + b^2 = c^2$ with $c$ the hypotenuse. Spot a Pythagorean triple (3-4-5, 5-12-13, 8-15-17, 7-24-25 and their multiples) to skip the arithmetic.",
      walk: askHyp ? W([[a + "^2 + " + b + "^2 = c^2", "Pythagorean theorem."], [(a * a) + " + " + (b * b) + " = " + (cc * cc), "Square."], ["c = " + cc, "Square root."]])
        : W([[a + "^2 + b^2 = " + cc + "^2", "Pythagorean theorem."], ["b^2 = " + (cc * cc) + " - " + (a * a) + " = " + (b * b), "Subtract."], ["b = " + b, "Square root."]]),
      concept: "In a right triangle the squares on the two legs add up to the square on the hypotenuse.",
      rebuild: [{ q: askHyp ? "What is $" + a + "^2 + " + b + "^2$?" : "What is $" + cc + "^2 - " + a + "^2$?", num: askHyp ? cc * cc : b * b, ok: "That's the square of the missing side." }, { q: "So the missing side is…", num: askHyp ? cc : b, ok: "Its square root." }],
      autopsy: { clue: "A right angle and two sides.", remember: "Legs squared add to hypotenuse squared — and look for triples." }
    };
  }
  function trigRatio(R) {
    var t = R.pick(TRIPLES), fn = R.pick(["sin", "cos", "tan"]);
    var opp = t[0], adj = t[1], hyp = t[2];
    var val = { sin: [opp, hyp], cos: [adj, hyp], tan: [opp, adj] }[fn];
    function f(n, d, o) { return Object.assign({ t: "$\\frac{" + n + "}{" + d + "}$", v: n / d }, o || {}); }
    var ok = f(val[0], val[1], { ok: true });
    return {
      stem: "In right triangle $ABC$, angle $C$ is the right angle, $BC = " + opp + "$, $AC = " + adj + "$ and $AB = " + hyp + "$. What is the value of $\\" + fn + "\\, A$?",
      fig: F.shape({ pts: { C: [0, 0], A: [adj, 0], B: [0, opp] }, polys: [["A", "B", "C"]], right: [["A", "C", "B"]], sides: [["C", "B", String(opp)], ["C", "A", String(adj)], ["A", "B", String(hyp)]], labels: { A: "A", B: "B", C: "C" }, w: 300, h: 220, noScale: true }),
      choices: [ok].concat(H.distinct(ok, [
        f(adj, hyp, { err: "formula", tr: "used cosine instead of sine", why: "$\\cos\\, A = \\frac{\\text{adjacent}}{\\text{hypotenuse}}$." }),
        f(opp, hyp, { err: "formula", tr: "used sine instead", why: "$\\sin\\, A = \\frac{\\text{opposite}}{\\text{hypotenuse}}$." }),
        f(opp, adj, { err: "formula", tr: "used tangent instead", why: "$\\tan\\, A = \\frac{\\text{opposite}}{\\text{adjacent}}$." }),
        f(val[1], val[0], { err: "formula", tr: "flipped the ratio", why: "The trig ratios of an acute angle " + (fn === "tan" ? "" : "(sine and cosine) are less than 1 — ") + "check which side goes on top." }),
        f(adj, opp, { err: "misread", tr: "measured from the wrong angle", why: "Opposite and adjacent are relative to angle $A$, not $B$." })], 3)),
      hint: "From angle $A$: which side is opposite, which is adjacent, which is the hypotenuse?",
      strategy: "SOH-CAH-TOA: $\\sin = \\frac{O}{H}$, $\\cos = \\frac{A}{H}$, $\\tan = \\frac{O}{A}$ — measured from the angle named.",
      walk: W([["\\text{from } A: \\text{opp} = BC = " + opp + ",\\ \\text{adj} = AC = " + adj + ",\\ \\text{hyp} = " + hyp, "Label the sides from $A$."], ["\\" + fn + "\\, A = \\frac{" + val[0] + "}{" + val[1] + "}", fn === "sin" ? "Opposite over hypotenuse." : fn === "cos" ? "Adjacent over hypotenuse." : "Opposite over adjacent."]]),
      concept: "Sine, cosine and tangent are ratios of side lengths, fixed by the angle — the same for every similar right triangle.",
      rebuild: [{ q: "From angle $A$, which side is opposite?", opts: ["$BC$", "$AC$", "$AB$"], a: 0, ok: "$BC = " + opp + "$." }, { q: "$\\" + fn + "\\, A$ is…", opts: [fn === "sin" ? "opposite ÷ hypotenuse" : fn === "cos" ? "adjacent ÷ hypotenuse" : "opposite ÷ adjacent", "hypotenuse ÷ opposite"], a: 0, ok: "$\\frac{" + val[0] + "}{" + val[1] + "}$." }],
      autopsy: { trap: "Labelling sides from the wrong angle.", clue: "\"$\\" + fn + "\\, A$\" — stand at $A$.", remember: "SOH-CAH-TOA from the named angle." }
    };
  }
  function trigCofunction(R) {
    var v = R.pick(["0.6", "0.8", "0.28", "0.96", "\\frac{5}{13}", "\\frac{12}{13}"]), a = R.int(15, 70);
    return {
      stem: "In a right triangle, one acute angle measures $x°$, and $\\sin(x°) = " + v + "$. What is the value of $\\cos((90 - x)°)$?",
      choices: [x(v, { ok: true, v: 0 }),
        x("1 - " + v, { err: "concept", tr: "subtracted from 1", why: "Sine and cosine of complementary angles are equal; nothing is subtracted." }),
        x("90 - " + v, { err: "concept", tr: "subtracted from 90", why: "90 is an angle, not a ratio. $\\cos(90° - x°) = \\sin\\, x°$." }),
        x("\\frac{1}{" + v + "}", { err: "formula", tr: "took the reciprocal", why: "The two acute angles share sides: the side opposite one is adjacent to the other." })].map(function (ch) { delete ch.v; return ch; }),
      order: "shuffle",
      hint: "The two acute angles of a right triangle add to 90°. How are their sides related?",
      strategy: "Co-function identity: $\\sin\\, x° = \\cos(90 - x)°$. The side opposite $x$ is adjacent to the other acute angle.",
      walk: W([["\\cos(90 - x)° = \\sin\\, x°", "Complementary angles swap sine and cosine."], ["= " + v, "So it's the same number."]]),
      concept: "In a right triangle the two acute angles are complementary, and the side opposite one is adjacent to the other.",
      rebuild: [{ q: "The other acute angle of the triangle measures…", opts: ["$(90 - x)°$", "$(180 - x)°$"], a: 0, ok: "They add to 90°." }, { q: "The side opposite $x$ is ___ to the other angle.", opts: ["adjacent", "opposite"], a: 0, ok: "So $\\cos(90 - x)° = \\sin\\, x° = " + v + "$." }],
      autopsy: { hard: "It looks like it needs a calculator.", clue: "$x$ and $90 - x$ together.", remember: "$\\sin\\, x = \\cos(90 - x)$." }
    };
  }
  function trigSpecial(R) {
    var kind = R.pick(["30", "45"]), k = R.int(2, 9);
    if (kind === "45") {
      return {
        stem: "An isosceles right triangle has legs of length " + k + ". What is the length of its hypotenuse?",
        choices: [x(k + "\\sqrt{2}", { ok: true }), x(String(2 * k), { err: "concept", tr: "added the legs", why: "Legs add their squares: $\\sqrt{" + k + "^2 + " + k + "^2} = " + k + "\\sqrt{2}$." }),
          x(k + "\\sqrt{3}", { err: "formula", tr: "used the 30-60-90 ratio", why: "An isosceles right triangle is 45-45-90: sides $s, s, s\\sqrt{2}$." }), x(String(k * k * 2), { err: "calc", tr: "forgot the square root", why: "That's the hypotenuse squared." })],
        hint: "What are the angles of an isosceles right triangle?",
        strategy: "45-45-90 triangle: $s,\\ s,\\ s\\sqrt{2}$ (reference sheet).",
        walk: W([["c^2 = " + k + "^2 + " + k + "^2 = " + (2 * k * k), "Pythagoras."], ["c = " + k + "\\sqrt{2}", "Or straight from the 45-45-90 pattern."]]),
        concept: "The special right triangles have fixed side patterns: 45-45-90 is $s : s : s\\sqrt{2}$; 30-60-90 is $x : x\\sqrt{3} : 2x$.",
        rebuild: [{ q: "In a 45-45-90 triangle, the hypotenuse is the leg times…", opts: ["$\\sqrt{2}$", "$\\sqrt{3}$", "2"], a: 0, ok: "So $" + k + "\\sqrt{2}$." }],
        autopsy: { clue: "\"Isosceles right triangle\" = 45-45-90.", remember: "$s, s, s\\sqrt{2}$." }
      };
    }
    var hyp = 2 * k;
    return {
      stem: "In a right triangle, one angle measures $30°$ and the hypotenuse has length " + hyp + ". What is the length of the side opposite the $60°$ angle?",
      choices: [x(k + "\\sqrt{3}", { ok: true }),
        x(String(k), { err: "misread", tr: "gave the side opposite 30°", why: "The side opposite 30° is half the hypotenuse, " + k + ". The side opposite 60° is $\\sqrt{3}$ times that." }),
        x(hyp + "\\sqrt{3}", { err: "formula", tr: "multiplied the hypotenuse by √3", why: "Start from the short leg, $" + k + "$: the long leg is $" + k + "\\sqrt{3}$." }),
        x(k + "\\sqrt{2}", { err: "formula", tr: "used the 45-45-90 ratio", why: "This is a 30-60-90 triangle: $x, x\\sqrt{3}, 2x$." })],
      hint: "Which side is half the hypotenuse?",
      strategy: "30-60-90: short leg $x$ (opposite 30°), long leg $x\\sqrt{3}$ (opposite 60°), hypotenuse $2x$.",
      walk: W([["2x = " + hyp + " \\Rightarrow x = " + k, "Short leg: half the hypotenuse."], ["x\\sqrt{3} = " + k + "\\sqrt{3}", "Opposite the 60° angle."]]),
      concept: "A 30-60-90 triangle is half of an equilateral triangle — that's why the short leg is half the hypotenuse.",
      rebuild: [{ q: "The side opposite 30° is half the hypotenuse:", num: k, ok: "$x = " + k + "$." }, { q: "The side opposite 60° is…", opts: ["$" + k + "\\sqrt{3}$", "$" + k + "\\sqrt{2}$"], a: 0, ok: "$x\\sqrt{3}$." }],
      autopsy: { clue: "A 30° angle in a right triangle.", remember: "$x, x\\sqrt{3}, 2x$." }
    };
  }
  function trigWord(R) {
    var t = R.pick(TRIPLES.slice(0, 4)), m = R.pick([1, 2]), a = t[0] * m, b = t[1] * m, cc = t[2] * m;
    return {
      stem: "A " + cc + "-foot ladder leans against a vertical wall. The bottom of the ladder is " + a + " feet from the base of the wall. How high up the wall does the top of the ladder reach, in feet?",
      answer: b, shown: String(b),
      near: [{ v: cc - a, tr: "subtracted the lengths" }, { v: Math.round(Math.sqrt(cc * cc + a * a) * 100) / 100, tr: "added the squares" }],
      hint: "Draw it: the wall, the ground and the ladder make a right triangle. Which side is the ladder?",
      strategy: "The ladder is the hypotenuse: height $= \\sqrt{" + cc + "^2 - " + a + "^2}$.",
      walk: W([[a + "^2 + h^2 = " + cc + "^2", "Wall ⟂ ground: a right triangle."], ["h^2 = " + (cc * cc - a * a), "Subtract."], ["h = " + b, "Square root."]]),
      concept: "Real situations with a vertical and a horizontal hide right triangles: draw them.",
      rebuild: [{ q: "In this right triangle, the hypotenuse is…", opts: ["the ladder", "the wall", "the ground"], a: 0, ok: "Opposite the right angle at the wall's base." }, { q: "Height $= \\sqrt{" + cc + "^2 - " + a + "^2} =$", num: b, ok: b + " feet." }],
      autopsy: { clue: "Wall and ground meet at a right angle.", remember: "Draw it; find the hypotenuse." }
    };
  }
  function trigUnit(R) {
    var A = R.pick([[30, "\\frac{\\pi}{6}"], [45, "\\frac{\\pi}{4}"], [60, "\\frac{\\pi}{3}"], [120, "\\frac{2\\pi}{3}"], [135, "\\frac{3\\pi}{4}"], [150, "\\frac{5\\pi}{6}"], [210, "\\frac{7\\pi}{6}"], [240, "\\frac{4\\pi}{3}"], [300, "\\frac{5\\pi}{3}"], [330, "\\frac{11\\pi}{6}"]]);
    var d = A[0], fn = R.pick(["sin", "cos"]), rad = R.chance(0.5);
    var ref = d % 180 > 90 ? 180 - d % 180 : d % 180;
    var sv = { 30: "\\frac{1}{2}", 45: "\\frac{\\sqrt{2}}{2}", 60: "\\frac{\\sqrt{3}}{2}" }, cv = { 30: "\\frac{\\sqrt{3}}{2}", 45: "\\frac{\\sqrt{2}}{2}", 60: "\\frac{1}{2}" };
    var val = fn === "sin" ? Math.sin(d * Math.PI / 180) : Math.cos(d * Math.PI / 180), neg = val < 0;
    var mag = fn === "sin" ? sv[ref] : cv[ref], other = fn === "sin" ? cv[ref] : sv[ref];
    var right = (neg ? "-" : "") + mag;
    var ok = x(right, { ok: true });
    return {
      stem: "What is the value of $\\" + fn + "\\left(" + (rad ? A[1] : d + "°") + "\\right)$?",
      choices: [ok].concat(H.distinct(ok, [
        x((neg ? "" : "-") + mag, { err: "concept", tr: "got the sign from the wrong quadrant", why: "On the unit circle, " + fn + " is the " + (fn === "sin" ? "$y$" : "$x$") + "-coordinate. At " + d + "° the point is in a quadrant where that coordinate is " + (neg ? "negative." : "positive.") }),
        x((neg ? "-" : "") + other, { err: "formula", tr: "swapped sine and cosine", why: "Sine is the $y$-coordinate, cosine the $x$-coordinate of the point on the unit circle." }),
        x((neg ? "" : "-") + other, { err: "formula", tr: "swapped sine and cosine and the sign", why: "Find the reference angle (" + ref + "°), use the special-triangle value, then set the sign by the quadrant." }),
        x((neg ? "-" : "") + (ref === 45 ? "\\frac{1}{2}" : "\\frac{\\sqrt{2}}{2}"), { err: "formula", tr: "used the value for a different special angle", why: "The reference angle is " + ref + "°: use the " + (ref === 45 ? "45-45-90" : "30-60-90") + " triangle." }),
        x((neg ? "" : "-") + (ref === 45 ? "\\frac{\\sqrt{3}}{2}" : "\\frac{\\sqrt{2}}{2}"), { err: "formula", tr: "used the value for a different special angle", why: "The reference angle is " + ref + "°, and the sign comes from the quadrant." })], 3)),
      hint: rad ? "Convert to degrees first, then find the reference angle." : "What is the reference angle, and which quadrant is " + d + "° in?",
      strategy: "Unit circle: the point at angle $\\theta$ is $(\\cos\\theta, \\sin\\theta)$. Find the reference angle (30°, 45° or 60°), use the special right triangle, then pick the sign from the quadrant.",
      walk: W([[rad ? A[1] + " = " + d + "°" : d + "°", rad ? "Radians to degrees." : "The angle."], ["\\text{reference angle } " + ref + "°", "Its distance from the $x$-axis."], ["\\" + fn + "\\, " + d + "° = " + right, (neg ? "Negative" : "Positive") + " in that quadrant."]]),
      concept: "On a circle of radius 1, the point at angle $\\theta$ from the positive $x$-axis is $(\\cos\\theta, \\sin\\theta)$ — the special right triangles give the lengths, the quadrant gives the signs.",
      rebuild: [{ q: "What is the reference angle for " + d + "°?", num: ref, ok: ref + "°." }, { q: "In that quadrant, is " + fn + " positive or negative?", opts: ["Positive", "Negative"], a: neg ? 1 : 0, ok: "So $\\" + fn + "\\, " + d + "° = " + right + "$." }],
      autopsy: { hard: "Radians, a reference angle and a sign — three steps.", clue: "A trig function of a special angle.", remember: "(cos, sin) is (x, y); the quadrant sets the sign." }
    };
  }
  var TRIG = {
    id: "g-trig", t: "Right triangles & trigonometry", short: "Right-triangle trig", kind: "Right triangle or trig ratio",
    blurb: "The Pythagorean theorem and its triples, sine, cosine and tangent, special right triangles, and $\\sin\\, x = \\cos(90 - x)$.",
    forms: ["figure", "word", "twist"],
    school: { course: "geo", unit: 5, t: "Geometry, Unit 5: Right triangles & trigonometry" },
    autopsy: { testing: "Right triangles and trigonometric ratios", clue: "A right angle, and a side or a sine/cosine/tangent.", remember: "$a^2 + b^2 = c^2$; SOH-CAH-TOA.", spotQ: "Is each of these a right-triangle question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "A 10-foot ramp rises 6 feet. How long is its base?", yes: true, why: "A right triangle: $\\sqrt{100 - 36}$." },
        { t: "If $\\cos\\, x° = 0.4$, what is $\\sin(90 - x)°$?", yes: true, why: "Co-function identity." },
        { t: "A circle has radius 4. What is its area?", yes: false, why: "Circles." }]);
    },
    lesson: [
      { type: "learn", kicker: "Pythagoras, and the shortcut",
        prompt: "In a right triangle, $a^2 + b^2 = c^2$, with $c$ the hypotenuse — the side opposite the right angle.",
        scene: { type: "walk", rows: [
          { m: "6^2 + 8^2 = 36 + 64 = 100", say: "Legs 6 and 8." }, { m: "c = 10", say: "Hypotenuse 10." },
          { m: "3\\text{-}4\\text{-}5,\\ 5\\text{-}12\\text{-}13,\\ 8\\text{-}15\\text{-}17", say: "Triples show up again and again — 6-8-10 is just 3-4-5 doubled." }] }, gate: true },
      { type: "learn", kicker: "SOH-CAH-TOA",
        prompt: "Stand at the angle. Name the sides from there.",
        scene: { type: "walk", rows: [
          { m: "\\sin = \\frac{\\text{opposite}}{\\text{hypotenuse}}", say: "**SOH**" }, { m: "\\cos = \\frac{\\text{adjacent}}{\\text{hypotenuse}}", say: "**CAH**" },
          { m: "\\tan = \\frac{\\text{opposite}}{\\text{adjacent}}", say: "**TOA**" }, { m: "\\sin\\, x° = \\cos(90 - x)°", say: "The other acute angle sees the same sides swapped." }] }, gate: true },
      { type: "choice", prompt: "In right triangle $ABC$ with the right angle at $C$, $BC = 5$, $AC = 12$, $AB = 13$. What is $\\tan\\, A$?",
        options: [{ t: "$\\frac{5}{12}$" }, { t: "$\\frac{12}{5}$", fb: "From $A$, the opposite side is $BC = 5$ and the adjacent is $AC = 12$." }, { t: "$\\frac{5}{13}$", fb: "That's $\\sin\\, A$." }, { t: "$\\frac{12}{13}$", fb: "That's $\\cos\\, A$." }],
        answer: 0, hints: ["Tangent is opposite over adjacent, from $A$."], why: "$\\tan\\, A = \\frac{BC}{AC} = \\frac{5}{12}$." },
      { type: "learn", kicker: "The unit circle",
        prompt: "On a circle of radius 1, the point at angle $\\theta$ is $(\\cos\\theta, \\sin\\theta)$.",
        scene: { type: "walk", rows: [
          { m: "60°: \\left(\\tfrac{1}{2}, \\tfrac{\\sqrt{3}}{2}\\right)", say: "From the 30-60-90 triangle with hypotenuse 1." },
          { m: "120°: \\left(-\\tfrac{1}{2}, \\tfrac{\\sqrt{3}}{2}\\right)", say: "Same reference angle (60°), but left of the $y$-axis: cosine is negative." },
          { m: "\\tfrac{\\pi}{3} = 60°", say: "Radians first become degrees: $\\pi = 180°$." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "word") return trigWord(R);
      if (o.form === "twist") return o.diff === 1 ? trigSpecial(R) : o.diff === 2 ? trigCofunction(R) : trigUnit(R);
      return o.diff === 1 ? trigPyth(R) : o.diff === 2 ? trigRatio(R) : trigSpecial(R);
    }
  };

  /* ========================================================= 4 · Circles */
  function circArc(R, sector) {
    var r = R.int(3, 12), th = R.pick([30, 40, 45, 60, 72, 90, 120, 135, 150]);
    var arc = th / 360 * 2 * r, area = th / 360 * r * r;
    var right = sector ? area : arc;
    return {
      stem: "In the circle shown, $O$ is the center, the radius is " + r + ", and the measure of central angle $AOB$ is $" + th + "°$. What is the " + (sector ? "area of sector $AOB$" : "length of arc $AB$") + "?",
      fig: F.circle({ c: "O", pts: { A: 20, B: 20 + th }, radii: ["A", "B"], sector: sector ? ["A", "B"] : null, label: { r: String(r) }, angle: ["A", "B", th + "°"], noScale: true }),
      choices: [cpi(right, { ok: true }),
        cpi(sector ? arc : area, { err: "formula", tr: sector ? "found the arc length instead of the area" : "found the sector area instead of the arc length", why: sector ? "Area uses $\\pi r^2$; arc length uses $2\\pi r$." : "Arc length is a fraction of the circumference $2\\pi r$, not of the area $\\pi r^2$." }),
        cpi(sector ? r * r : 2 * r, { err: "concept", tr: "used the whole circle", why: "The " + th + "° angle is only $\\frac{" + th + "}{360}$ of the circle." }),
        cpi(th / 180 * (sector ? r * r : 2 * r) === right ? right * 3 : th / 180 * (sector ? r * r : 2 * r), { err: "formula", tr: "divided by 180 instead of 360", why: "A full circle is 360°." })],
      hint: "What fraction of the whole circle is the " + th + "° angle?",
      strategy: "Fraction of the circle: $\\frac{" + th + "}{360}$. Multiply it by the " + (sector ? "whole area $\\pi r^2$" : "whole circumference $2\\pi r$") + ".",
      walk: W([["\\frac{" + th + "}{360} = " + tex(th / 360), "Fraction of the circle."], [sector ? "\\pi(" + r + ")^2 = " + pi(r * r) : "2\\pi(" + r + ") = " + pi(2 * r), "Whole " + (sector ? "area" : "circumference") + "."], [tex(th / 360) + " \\times " + pi(sector ? r * r : 2 * r) + " = " + pi(right), "The part."]]),
      concept: "A central angle takes the same fraction of the circumference and of the area as it takes of 360°.",
      rebuild: [{ q: "What fraction of 360° is " + th + "°?", opts: ["$" + tex(th / 360) + "$", "$" + tex(th / 180) + "$"], a: 0, ok: "That fraction of the circle." }, { q: "The whole " + (sector ? "area" : "circumference") + " is…", opts: ["$" + pi(sector ? r * r : 2 * r) + "$", "$" + pi(sector ? 2 * r : r * r) + "$"], a: 0, ok: "So the " + (sector ? "sector's area" : "arc's length") + " is $" + pi(right) + "$." }],
      autopsy: { trap: "Using area for an arc (or circumference for a sector).", clue: "A central angle in degrees.", remember: "Part of the circle $= \\frac{\\theta}{360} \\times$ the whole." }
    };
  }
  function circEq(R, diff) {
    var h = R.nz(-6, 6), k = R.nz(-6, 6), r = R.int(2, 9);
    function sq(v, n) { return "(" + n + " " + (v < 0 ? "+ " + (-v) : "- " + v) + ")^2"; }
    if (diff >= 3) {
      var D = -2 * h, E = -2 * k, Fc = h * h + k * k - r * r;
      var e = L.poly([[1, "x^2"], [1, "y^2"], [D, "x"], [E, "y"]]) + " = " + (-Fc);
      return {
        stem: "The equation of a circle in the $xy$-plane is $" + e + "$. What is the radius of the circle?",
        answer: r, shown: String(r), secs: 125,
        near: [{ v: r * r, tr: "gave r squared" }, { v: -Fc, tr: "used the constant as the radius" }],
        hint: "Complete the square for $x$ and for $y$.",
        strategy: "Group $x$ terms and $y$ terms, complete each square (add $(\\frac{b}{2})^2$ to both sides), then read $r^2$.",
        walk: W([[e, "Start."], [sq(h, "x") + " + " + sq(k, "y") + " = " + (-Fc) + " + " + (h * h) + " + " + (k * k), "Complete both squares — add the same to the right."], [sq(h, "x") + " + " + sq(k, "y") + " = " + (r * r), "Standard form."], ["r = " + r, "The radius is the square root."]]),
        concept: "Every circle can be written $(x - h)^2 + (y - k)^2 = r^2$; completing the square recovers that form.",
        rebuild: [{ q: "To complete $x^2 " + (D < 0 ? "- " + (-D) : "+ " + D) + "x$, add…", num: h * h, ok: "$(" + (D / 2) + ")^2 = " + (h * h) + "$." }, { q: "And for $y^2 " + (E < 0 ? "- " + (-E) : "+ " + E) + "y$, add…", num: k * k, ok: "$(" + (E / 2) + ")^2 = " + (k * k) + "$." }, { q: "The right side becomes $r^2$. What is $r$?", num: r, ok: "$r = " + r + "$." }],
        autopsy: { hard: "The circle isn't in standard form.", clue: "$x^2$ and $y^2$ with the same coefficient.", remember: "Complete the square twice; the radius is $\\sqrt{\\text{right side}}$." }
      };
    }
    var e2 = sq(h, "x") + " + " + sq(k, "y") + " = " + (r * r);
    return {
      stem: "A circle in the $xy$-plane has equation $" + e2 + "$. What are the coordinates of its center and its radius?",
      choices: [w("Center $(" + h + ", " + k + ")$, radius " + r, { ok: true }),
        w("Center $(" + (-h) + ", " + (-k) + ")$, radius " + r, { err: "formula", tr: "took the signs in the brackets as the center", why: "$(x - h)^2$ has center $x = h$: $(x " + (h < 0 ? "+ " + (-h) : "- " + h) + ")$ means $h = " + h + "$." }),
        w("Center $(" + h + ", " + k + ")$, radius " + (r * r), { err: "formula", tr: "read r squared as the radius", why: "The right side is $r^2 = " + (r * r) + "$, so $r = " + r + "$." }),
        w("Center $(" + (-h) + ", " + (-k) + ")$, radius " + (r * r), { err: "formula", tr: "flipped the signs and used r squared", why: "Center $(" + h + ", " + k + ")$ and radius $\\sqrt{" + (r * r) + "} = " + r + "$." })],
      order: "shuffle",
      hint: "Compare with $(x - h)^2 + (y - k)^2 = r^2$.",
      strategy: "Center $(h, k)$ — signs flip from what's in the brackets. The right side is $r^2$, not $r$.",
      walk: W([[e2, "Standard form."], ["h = " + h + ",\\ k = " + k, "Flip the signs in the brackets."], ["r = \\sqrt{" + (r * r) + "} = " + r, "Square root of the right side."]]),
      concept: "A circle is every point at distance $r$ from the center: the distance formula squared gives $(x - h)^2 + (y - k)^2 = r^2$.",
      rebuild: [{ q: "$(x " + (h < 0 ? "+ " + (-h) : "- " + h) + ")^2$ is zero when $x =$", num: h, ok: "Center's $x$ is " + h + "." }, { q: "The radius is the square root of " + (r * r) + ":", num: r, ok: "$r = " + r + "$." }],
      autopsy: { trap: "The signs of the center, and $r^2$ vs $r$.", clue: "$(x - h)^2 + (y - k)^2 = r^2$.", remember: "Flip the signs; square-root the right side." }
    };
  }
  function circRad(R) {
    var num2 = R.pick([[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [5, 4], [7, 6], [3, 2]]), d = 180 * num2[0] / num2[1];
    var t = "\\frac{" + (num2[0] === 1 ? "" : num2[0]) + "\\pi}{" + num2[1] + "}";
    return {
      stem: "An angle measures $" + t + "$ radians. What is its measure in degrees?",
      answer: d, shown: String(d),
      near: [{ v: 360 * num2[0] / num2[1], tr: "used 360° for π radians" }],
      hint: "How many degrees is $\\pi$ radians?",
      strategy: "$\\pi$ radians $= 180°$, so multiply by $\\frac{180°}{\\pi}$.",
      walk: W([[t + " \\times \\frac{180°}{\\pi}", "Convert."], ["= " + d + "°", "The $\\pi$ cancels."]]),
      concept: "A full circle is $2\\pi$ radians, which is 360° — so $\\pi$ radians is 180°.",
      rebuild: [{ q: "$\\pi$ radians is how many degrees?", num: 180, ok: "180°." }, { q: "So $" + t + "$ is…", num: d, ok: d + "°." }],
      autopsy: { clue: "Radians to degrees.", remember: "$\\pi = 180°$." }
    };
  }
  function circTangent(R) {
    var t = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [7, 24, 25]]), r = t[0], tl = t[1], dist = t[2];
    var askTan = R.chance(0.5);
    return {
      stem: "In the figure, $\\overline{PA}$ is tangent to the circle with center $O$ at point $A$. The radius is " + r + (askTan ? " and $OP = " + dist + "$. What is the length of $\\overline{PA}$?" : " and $PA = " + tl + "$. What is the length of $\\overline{OP}$?"),
      fig: F.circle({ c: "O", pts: { A: 90 }, radii: ["A"], label: { r: String(r) }, tangent: { at: "A", P: "P", len: 110, seg: true, cw: true, label: askTan ? null : String(tl), dlabel: askTan ? String(dist) : null }, w: 300, h: 250, noScale: true }),
      choices: askTan ? [c(tl, { ok: true }),
          c(dist - r, { err: "concept", tr: "subtracted the lengths", why: "$\\triangle OAP$ is a right triangle (tangent ⟂ radius): use $a^2 + b^2 = c^2$." }),
          H.x("\\sqrt{" + (dist * dist + r * r) + "}", { v: Math.sqrt(dist * dist + r * r), err: "formula", tr: "added the squares when finding a leg", why: "$OP$ is the hypotenuse (it's opposite the right angle at $A$): $PA^2 = OP^2 - OA^2$." }),
          c(dist + r, { err: "concept", tr: "added the lengths", why: "Lengths in a right triangle combine through their squares." })]
        : [c(dist, { ok: true }),
          c(r + tl, { err: "concept", tr: "added the lengths", why: "$OP$ is the hypotenuse of the right triangle $OAP$: $OP^2 = OA^2 + PA^2$." }),
          H.x("\\sqrt{" + (tl * tl - r * r) + "}", { v: Math.sqrt(tl * tl - r * r), err: "formula", tr: "subtracted the squares for the hypotenuse", why: "The hypotenuse is found by adding the squares of the legs." }),
          c(tl - r, { err: "concept", tr: "subtracted the lengths", why: "Use the Pythagorean theorem: the angle at $A$ is 90°." })],
      hint: "What angle does a tangent make with the radius at the point where it touches?",
      strategy: "A tangent is perpendicular to the radius at the point of tangency — so there's a right triangle hiding in the figure. Then Pythagoras (look for a triple).",
      walk: W([["\\angle OAP = 90°", "Tangent ⟂ radius."], [askTan ? "PA^2 = " + dist + "^2 - " + r + "^2 = " + (tl * tl) : "OP^2 = " + r + "^2 + " + tl + "^2 = " + (dist * dist), "Pythagorean theorem."], [askTan ? "PA = " + tl : "OP = " + dist, "Square root (a " + t.join("-") + " triple)."]]),
      concept: "The radius to a point of tangency is perpendicular to the tangent line — the one fact that turns tangent questions into right-triangle questions.",
      rebuild: [{ q: "What is the measure of $\\angle OAP$?", num: 90, ok: "Tangent meets the radius at a right angle." }, { q: askTan ? "So $PA = \\sqrt{" + dist + "^2 - " + r + "^2} =$" : "So $OP = \\sqrt{" + r + "^2 + " + tl + "^2} =$", num: askTan ? tl : dist, ok: "Done." }],
      autopsy: { hard: "The right angle isn't marked.", clue: "The word \"tangent\".", remember: "Tangent ⟂ radius → right triangle." }
    };
  }
  function circInscribed(R) {
    var cen = R.pick([40, 60, 70, 80, 100, 110, 120, 140]), askIns = R.chance(0.6);
    var ins = cen / 2;
    return {
      stem: "Points $A$, $B$ and $C$ lie on a circle with center $O$. Central angle $AOB$ and inscribed angle $ACB$ intercept the same arc $AB$. " + (askIns ? "If the measure of angle $AOB$ is $" + cen + "°$, what is the measure of angle $ACB$?" : "If the measure of angle $ACB$ is $" + ins + "°$, what is the measure of angle $AOB$?"),
      fig: F.circle({ c: "O", pts: { A: 200, B: 200 + cen, C: 200 + cen + (360 - cen) / 2 }, radii: ["A", "B"], chords: [["C", "A"], ["C", "B"]], w: 280, h: 260, noScale: true }),
      choices: askIns ? [c(ins, { ok: true }),
          c(cen, { err: "concept", tr: "treated the inscribed angle as equal to the central angle", why: "An inscribed angle is half the central angle on the same arc." }),
          c(2 * cen === 360 ? cen + 20 : 2 * cen, { err: "concept", tr: "doubled instead of halving", why: "The central angle is the bigger one: the inscribed angle is half of it." }),
          c(180 - cen > 0 ? 180 - cen : ins + 15, { err: "concept", tr: "took the supplement", why: "Inscribed and central angles on the same arc aren't supplementary." })]
        : [c(cen, { ok: true }),
          c(ins, { err: "concept", tr: "treated the angles as equal", why: "The central angle is twice the inscribed angle on the same arc." }),
          c(ins / 2, { err: "concept", tr: "halved instead of doubling", why: "Going from inscribed to central, double." }),
          c(180 - ins, { err: "concept", tr: "took the supplement", why: "Double the inscribed angle." })],
      hint: "How does an inscribed angle compare with the central angle on the same arc?",
      strategy: "Inscribed angle = half the central angle (= half the arc) that it intercepts.",
      walk: W([[askIns ? "\\angle ACB = \\tfrac{1}{2}(" + cen + "°)" : "\\angle AOB = 2(" + ins + "°)", "Same arc."], [askIns ? "= " + ins + "°" : "= " + cen + "°", "Done."]]),
      concept: "An angle with its vertex on the circle sees an arc at half the angle the center sees it.",
      rebuild: [{ q: "The inscribed angle is what fraction of the central angle on the same arc?", opts: ["One half", "The same", "Twice"], a: 0, ok: "Half." }, { q: askIns ? "So $\\angle ACB =$" : "So $\\angle AOB =$", num: askIns ? ins : cen, ok: "Done." }],
      autopsy: { clue: "A vertex on the circle and a vertex at the center, same arc.", remember: "Inscribed = ½ central." }
    };
  }
  function circShift(R) {
    var h = R.nz(-5, 5), k = R.nz(-5, 5), r = R.int(2, 8), dx = R.nz(-4, 4), dy = R.nz(-4, 4);
    function sq(v, n) { return "(" + n + " " + (v < 0 ? "+ " + (-v) : v === 0 ? "" : "- " + v) + ")^2"; }
    function eqn(hh, kk) { return (hh === 0 ? "x^2" : sq(hh, "x")) + " + " + (kk === 0 ? "y^2" : sq(kk, "y")) + " = " + (r * r); }
    var ok = x(eqn(h + dx, k + dy), { ok: true });
    return {
      stem: "The circle $" + eqn(h, k) + "$ is moved " + plural(Math.abs(dx), "unit") + " " + (dx > 0 ? "right" : "left") + " and " + plural(Math.abs(dy), "unit") + " " + (dy > 0 ? "up" : "down") + ". Which is an equation of the new circle?",
      choices: [ok].concat(H.distinct(ok, [
        x(eqn(h - dx, k - dy), { err: "concept", tr: "moved the center the wrong way", why: "The center moves from $(" + h + ", " + k + ")$ to $(" + (h + dx) + ", " + (k + dy) + ")$; then write $(x - h)^2 + (y - k)^2$ with the new center." }),
        x(eqn(h + dy, k + dx), { err: "misread", tr: "swapped the horizontal and vertical moves", why: "Left/right changes $h$ (with $x$); up/down changes $k$ (with $y$)." }),
        x(eqn(h + dx, k + dy).replace("= " + (r * r), "= " + (r * r + dx * dx + dy * dy)), { err: "concept", tr: "changed the radius", why: "Moving a circle doesn't change its size: the right side stays $" + (r * r) + "$." }),
        x(eqn(h - dx, k + dy), { err: "calc", tr: "moved one direction the wrong way", why: "New center: $(" + (h + dx) + ", " + (k + dy) + ")$." })], 3)),
      hint: "Where is the center now? Does the radius change?",
      strategy: "Move the center from $(" + h + ", " + k + ")$ to $(" + (h + dx) + ", " + (k + dy) + ")$, keep $r^2$, and write $(x - h)^2 + (y - k)^2 = r^2$ — signs flip inside the brackets.",
      walk: W([["(" + h + ", " + k + ") \\to (" + (h + dx) + ", " + (k + dy) + ")", "Move the center."], [eqn(h + dx, k + dy), "Same radius; new center in the brackets (signs flipped)."]]),
      concept: "Translating a circle moves its center and nothing else.",
      rebuild: [{ q: "What is the new center's $x$-coordinate?", num: h + dx, ok: "And its $y$-coordinate is " + (k + dy) + "." }, { q: "Does the radius change?", opts: ["No", "Yes"], a: 0, ok: "So the right side stays " + (r * r) + "." }],
      autopsy: { clue: "A circle moved left/right/up/down.", remember: "Move the center; keep $r$." }
    };
  }
  var CIRC = {
    id: "g-circle", t: "Circles", short: "Circles", kind: "Circle: arcs, sectors or equations",
    blurb: "Arc length and sector area as a fraction of the circle, radians, and circle equations — including completing the square.",
    forms: ["figure", "equation", "twist"], pace: 1.05,
    school: { course: "geo", unit: 7, t: "Geometry, Unit 7: Circles" },
    autopsy: { testing: "Circles", clue: "A center, a radius, an arc or a circle's equation.", remember: "Part of the circle $= \\frac{\\theta}{360}$ of the whole; $(x - h)^2 + (y - k)^2 = r^2$.", spotQ: "Is each of these a circle question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "A pizza of radius 8 is cut into 8 equal slices. What is the area of one slice?", yes: true, why: "A sector: $\\frac{1}{8}$ of $\\pi r^2$." },
        { t: "What is the center of $x^2 + y^2 + 4x = 5$?", yes: true, why: "Complete the square: a circle." },
        { t: "What is the vertex of $y = (x + 2)^2 - 9$?", yes: false, why: "That's a parabola." }]);
    },
    lesson: [
      { type: "learn", kicker: "A fraction of the circle",
        prompt: "An arc or a sector is a **fraction** of the whole circle — the same fraction its angle is of 360°.",
        scene: { type: "walk", rows: [
          { m: "\\frac{\\theta}{360}", say: "The fraction." }, { m: "\\text{arc} = \\frac{\\theta}{360} \\cdot 2\\pi r", say: "Part of the way round." },
          { m: "\\text{sector} = \\frac{\\theta}{360} \\cdot \\pi r^2", say: "Part of the inside." }, { m: "\\theta = 90°,\\ r = 6: \\ \\text{arc} = 3\\pi", say: "A quarter of $12\\pi$." }] }, gate: true },
      { type: "learn", kicker: "The circle's equation",
        prompt: "Every point on a circle is $r$ away from the center $(h, k)$:",
        scene: { type: "walk", rows: [
          { m: "(x - h)^2 + (y - k)^2 = r^2", say: "Standard form." }, { m: "(x + 3)^2 + (y - 1)^2 = 25", say: "Center $(-3, 1)$ — signs flip — radius $\\sqrt{25} = 5$." },
          { m: "x^2 + 6x + y^2 - 2y = 15", say: "Not in standard form? Complete the square: $+9$ and $+1$ on both sides." }] }, gate: true },
      { type: "num", prompt: "A circle has radius 10 and a central angle of 72°. What is the arc length, as a multiple of $\\pi$?", answer: 4, pre: "", post: "$\\pi$",
        near: [{ v: 20, fb: "That's the whole circumference. Take $\\frac{72}{360}$ of it." }, { v: 8, fb: "Divide by 360, not 180." }], hints: ["$\\frac{72}{360} = \\frac{1}{5}$."], why: "$\\frac{1}{5} \\times 20\\pi = 4\\pi$." },
      { type: "learn", kicker: "Two circle theorems",
        prompt: "Both turn up in figures:",
        scene: { type: "walk", rows: [
          { m: "\\text{tangent} \\perp \\text{radius}", say: "Where a tangent line touches the circle, it makes a right angle with the radius — a hidden right triangle." },
          { m: "\\angle \\text{inscribed} = \\tfrac{1}{2}\\,\\angle \\text{central}", say: "An angle with its vertex on the circle is half the central angle on the same arc: 100° central → 50° inscribed." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "equation") return circEq(R, o.diff);
      if (o.form === "twist") return o.diff === 1 ? circRad(R) : o.diff === 2 ? circShift(R) : circEq(R, 3);
      return o.diff === 1 ? circArc(R, false) : o.diff === 2 ? (R.chance(0.5) ? circArc(R, R.chance(0.5)) : circInscribed(R)) : circTangent(R);
    }
  };

  S.domain(4, {
    skills: [AREA, ANG, TRIG, CIRC],
    strategies: [
      { id: "refsheet", t: "Open the reference sheet", rule: "Area and volume formulas, the special right triangles and circle facts are all given. Don't spend memory on them — spend it on choosing the right one.",
        when: "any area, volume or special triangle question.", skills: ["g-area", "g-trig", "g-circle"],
        ex: "Volume of a cone, radius 3, height 4?", walk: W([["V = \\tfrac{1}{3}\\pi r^2 h", "From the sheet."], ["= 12\\pi", "Substitute."]]) },
      { id: "scaling", t: "Length k, area k², volume k³", rule: "When lengths are multiplied by $k$, areas multiply by $k^2$ and volumes by $k^3$.",
        when: "a figure is enlarged or shrunk.", skills: ["g-area"],
        ex: "A cube's edges double. Its volume?", walk: W([["2^3 = 8", "8 times as big."]]) },
      { id: "wholeminus", t: "Whole minus the missing piece", rule: "For an odd shape, find the area of a simple shape around it and subtract what isn't shaded.",
        when: "a composite or cut-out figure.", skills: ["g-area"],
        ex: "A 10-by-6 rectangle with a 2-by-3 corner removed.", walk: W([["60 - 6 = 54", "Whole − corner."]]) },
      { id: "transversal", t: "Acute = acute, obtuse = obtuse", rule: "With parallel lines and a transversal, all the acute angles are equal, all the obtuse are equal, and one of each adds to 180°.",
        when: "parallel lines are cut by another line.", skills: ["g-angles"],
        ex: "One angle is 70°. An obtuse angle elsewhere?", walk: W([["180 - 70 = 110", "Every obtuse angle is 110°."]]) },
      { id: "similar", t: "Match whole sides", rule: "For similar triangles, write a proportion of corresponding sides — whole side to whole side.",
        when: "a segment parallel to a side, or triangles called similar.", skills: ["g-angles"],
        ex: "$AD = 4$, $DB = 6$, $DE = 5$; find $BC$.", walk: W([["\\frac{BC}{5} = \\frac{10}{4}", "$AB = 4 + 6 = 10$."], ["BC = 12.5", "Solve."]]) },
      { id: "triples", t: "Spot the Pythagorean triple", rule: "3-4-5, 5-12-13, 8-15-17, 7-24-25 — and their multiples — skip the arithmetic.",
        when: "a right triangle with whole-number sides.", skills: ["g-trig"],
        ex: "Legs 9 and 12?", walk: W([["9\\text{-}12\\text{-}15", "3-4-5 times 3."]]) },
      { id: "sohcahtoa", t: "Stand at the angle", rule: "Name opposite, adjacent and hypotenuse from the angle in the question, then SOH-CAH-TOA. $\\sin\\, x = \\cos(90 - x)$.",
        when: "sine, cosine or tangent appears.", skills: ["g-trig"],
        ex: "$\\sin\\, A$ with opposite 7, hypotenuse 25.", walk: W([["\\frac{7}{25}", "Opposite over hypotenuse."]]) },
      { id: "fractioncircle", t: "A fraction of the circle", rule: "Arcs and sectors are $\\frac{\\theta}{360}$ of the circumference and area. In radians: arc $= r\\theta$.",
        when: "a central angle and a radius.", skills: ["g-circle"],
        ex: "Radius 9, angle 40°: arc?", walk: W([["\\frac{40}{360} \\cdot 18\\pi = 2\\pi", "One ninth of the circumference."]]) },
      { id: "tangentright", t: "Tangent means right angle", rule: "A tangent line is perpendicular to the radius at the point of tangency. Draw the radius and you have a right triangle for Pythagoras.",
        when: "the word \"tangent\" appears in a circle question.", skills: ["g-circle"],
        ex: "Radius 5, tangent segment 12. Distance from the center to the outside point?", walk: W([["5^2 + 12^2 = 13^2", "A 5-12-13 triangle."], ["13", "The hypotenuse."]]) },
      { id: "inscribed", t: "Inscribed is half", rule: "An inscribed angle is half the central angle (and half the arc) it intercepts.",
        when: "an angle has its vertex on the circle.", skills: ["g-circle"],
        ex: "Central angle 130°.", walk: W([["65°", "The inscribed angle on the same arc."]]) },
      { id: "unitcircle", t: "(cos, sin) on the unit circle", rule: "The point at angle $\\theta$ on a circle of radius 1 is $(\\cos\\theta, \\sin\\theta)$. Reference angle → special triangle value; quadrant → sign.",
        when: "a trig value of a special angle, especially past 90° or in radians.", skills: ["g-trig", "g-circle"],
        ex: "$\\cos 150°$", walk: W([["\\text{ref } 30°", "Reference angle."], ["-\\tfrac{\\sqrt{3}}{2}", "Left of the $y$-axis: negative."]]) },
      { id: "surface", t: "Unfold it", rule: "Surface area isn't on the reference sheet: add the areas of every face. A box is $2(ℓw + ℓh + wh)$; a cylinder is $2\\pi r^2 + 2\\pi rh$.",
        when: "\"surface area\", paint, wrapping, or covering a solid.", skills: ["g-area"],
        ex: "A 4-by-3-by-2 box.", walk: W([["2(12 + 8 + 6) = 52", "Three faces, twice each."]]) },
      { id: "completesquare", t: "Complete the square (twice)", rule: "For $x^2 + y^2 + Dx + Ey = F$, add $(\\frac{D}{2})^2$ and $(\\frac{E}{2})^2$ to both sides to get the center and radius.",
        when: "a circle's equation isn't in standard form.", skills: ["g-circle"],
        ex: "$x^2 + y^2 - 4x + 6y = 12$", walk: W([["(x - 2)^2 + (y + 3)^2 = 25", "Add 4 and 9."], ["r = 5", "Center $(2, -3)$."]]) }
    ]
  });
})();
