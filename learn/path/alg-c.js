/* ==========================================================================
   Algebra Pathway — Lines and functions, and Systems.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, P = LAB && LAB.PATH;
  if (!P || !P.h) return;
  var H = P.h, tex = H.tex, par = H.par, fr = H.fr, poly = LAB.poly;
  var PART = (P.parts = P.parts || {});
  var T = (PART.alg = PART.alg || []);
  function topic(id, cat, name, pre, idea, gen) { T.push({ id: id, cat: cat, name: name, pre: pre, idea: idea, gen: gen }); }
  function pt(x, y) { return "(" + tex(x) + ", " + tex(y) + ")"; }
  function ptn(x, y) { return "(" + tex(x) + "," + tex(y) + ")"; }
  var QN = { 1: "Quadrant I", 2: "Quadrant II", 3: "Quadrant III", 4: "Quadrant IV" };
  function quad(x, y) { return x > 0 && y > 0 ? 1 : x < 0 && y > 0 ? 2 : x < 0 && y < 0 ? 3 : 4; }
  /* y = mx + b as "y = 2x - 3" typed and shown */
  function slopeForm(m, b) {
    var mt = Math.abs(m - Math.round(m)) < 1e-9 ? H.term(Math.round(m), "x") : (m < 0 ? "-" : "") + "\\frac{" + fracNum(Math.abs(m)) + "}{" + fracDen(Math.abs(m)) + "}x";
    return mt + (b ? " " + H.sg(b) : "");
  }
  function fracNum(v) { for (var q = 1; q <= 12; q++) if (Math.abs(v * q - Math.round(v * q)) < 1e-9) return Math.round(v * q); return v; }
  function fracDen(v) { for (var q = 1; q <= 12; q++) if (Math.abs(v * q - Math.round(v * q)) < 1e-9) return q; return 1; }
  function mTyped(p, q) { return q === 1 ? "" + p : "(" + p + "/" + q + ")"; }
  function eqTyped(p, q, b) { return "y=" + (p < 0 ? "-" : "") + (q === 1 ? Math.abs(p) === 1 ? "" : Math.abs(p) : "(" + Math.abs(p) + "/" + q + ")") + "x" + (b === 0 ? "" : (b < 0 ? "-" : "+") + Math.abs(b)); }
  function slopeTex(p, q, b) { return "y = " + (p < 0 ? "-" : "") + (q === 1 ? (Math.abs(p) === 1 ? "" : Math.abs(p)) : "\\frac{" + Math.abs(p) + "}{" + q + "}") + "x" + (b === 0 ? "" : " " + H.sg(b)); }
  function std(a, b, c) { return poly([[a, "x"], [b, "y"]]) + " = " + c; }
  function stdTyped(a, b, c) { return poly([[a, "x"], [b, "y"]]).replace(/\s+/g, "") + "=" + c; }
  function randSlope(R, hard) {
    // returns [p, q] reduced, nonzero
    var p, q;
    do { p = R.nz(-6, 6); q = hard ? R.int(2, 5) : 1; } while (H.gcd(p, q) !== 1 || (hard && q === 1));
    return [p, q];
  }

  /* ====================================================== Lines and functions */

  topic("l_plot", "lin", "Coordinates and quadrants", ["n_int_add"],
    "An ordered pair (x, y) says how far to go across, then how far up or down. The axes cut the plane into four quadrants, and the signs of x and y tell you which one a point is in.",
    function (R, d) {
      var x, y, q, a, walk, hint;
      if (d === 1) {
        x = R.nz(-9, 9); y = R.nz(-9, 9); var qq = quad(x, y);
        q = "In which quadrant is the point $" + pt(x, y) + "$?";
        a = H.choice(R, QN[qq], [1, 2, 3, 4].filter(function (k) { return k !== qq; }).map(function (k) { return [QN[k], "For " + QN[k] + ", x would be " + (k === 1 || k === 4 ? "positive" : "negative") + " and y " + (k === 1 || k === 2 ? "positive" : "negative") + ". Here x is " + (x > 0 ? "positive" : "negative") + " and y is " + (y > 0 ? "positive" : "negative") + "."]; }), { keep: true });
        walk = [[pt(x, y), "x is " + (x > 0 ? "positive (right)" : "negative (left)") + ", and y is " + (y > 0 ? "positive (up)" : "negative (down)") + ", so it is in " + QN[qq] + "."]];
      } else if (d === 2) {
        var onx = R.chance(0.5), k = R.nz(-8, 8);
        x = onx ? k : 0; y = onx ? 0 : k;
        q = "Where is the point $" + pt(x, y) + "$?";
        var right = onx ? "On the x-axis" : "On the y-axis";
        a = H.choice(R, right, [[onx ? "On the y-axis" : "On the x-axis", "Points on the " + (onx ? "y" : "x") + "-axis have " + (onx ? "x" : "y") + " = 0. Here " + (onx ? "y" : "x") + " = 0, so the point is on the other axis."], ["At the origin", "The origin is (0, 0). Only one coordinate is 0 here."], [QN[quad(k, k)], "A point on an axis isn't inside any quadrant."]]);
        walk = [[pt(x, y), "The " + (onx ? "y" : "x") + "-coordinate is 0, so the point doesn't leave the " + (onx ? "x" : "y") + "-axis: " + right.toLowerCase() + "."]];
      } else {
        var pts = [], names = ["A", "B", "C"], used = {};
        while (pts.length < 3) { var px = R.int(-6, 6), py = R.int(-6, 6); var key = px + "," + py; if (used[key] || (!px && !py)) continue; used[key] = 1; pts.push({ x: px, y: py, l: names[pts.length] }); }
        var tgt = R.pick(pts);
        q = "What are the coordinates of point $" + tgt.l + "$?<br>Enter them like (2, -3).";
        return { q: q, fig: H.plane({ x: [-7, 7], y: [-7, 7], pts: pts, size: 280 }), a: { k: "pt", v: [tgt.x, tgt.y] }, walk: [[tgt.l + " = " + pt(tgt.x, tgt.y), "Read across the $x$-axis first (" + tex(tgt.x) + "), then up or down (" + tex(tgt.y) + ")."]], hint: "Go across first (x), then up or down (y).",
          fb: [{ v: [tgt.y, tgt.x], say: "It looks like x and y are swapped. The pair is (across, up/down)." }] };
      }
      return { q: q, a: a, walk: walk, hint: "Look at the sign of each coordinate." };
    });

  topic("l_table", "lin", "Points on a line", ["e_eval", "l_plot"],
    "A point is on the line exactly when its coordinates make the equation true. To find y, put the x-value in and simplify.",
    function (R, d) {
      var m, b, x, y, q, walk, a;
      if (d === 1) { m = R.int(2, 6); b = R.nz(-9, 9); x = R.int(1, 8); y = m * x + b; q = "If $y = " + poly([[m, "x"], [b, ""]]) + "$, what is $y$ when $x = " + x + "$?"; a = { k: "num", v: y }; walk = [["y = " + m + "(" + x + ") " + H.sg(b), "Replace $x$ with " + x + "."], ["y = " + y, "Multiply, then add."]]; }
      else if (d === 2) { m = R.nz(-7, 7); b = R.nz(-9, 9); x = R.nz(-8, -1); y = m * x + b; q = "If $y = " + poly([[m, "x"], [b, ""]]) + "$, what is $y$ when $x = " + x + "$?"; a = { k: "num", v: y }; walk = [["y = " + m + "(" + x + ") " + H.sg(b), "Replace $x$ with " + x + ", in brackets."], ["y = " + tex(m * x) + " " + H.sg(b) + " = " + y, "Multiply, then add."]]; }
      else {
        m = R.nz(-5, 5); b = R.nz(-8, 8); x = R.nz(-5, 6); y = m * x + b;
        var line = poly([[m, "x"], [b, ""]]);
        var wrongs = [[pt(y, x), "The coordinates are swapped — x comes first."], [pt(x, y + R.pick([1, -1, 2])), "Put $x$ = " + x + " into the equation: $y$ = " + y + ", not this."], [pt(x + 1, y), "For $x$ = " + (x + 1) + " the equation gives $y$ = " + (m * (x + 1) + b) + "."]];
        a = H.choice(R, "$" + pt(x, y) + "$", wrongs.map(function (w) { return ["$" + w[0] + "$", w[1]]; }));
        q = "Which point lies on the line $y = " + line + "$?"; walk = [["y = " + m + "(" + x + ") " + H.sg(b) + " = " + y, "Try $x$ = " + x + ": it gives $y$ = " + y + ", so " + pt(x, y) + " is on the line."]];
      }
      return { q: q, a: a, walk: walk, hint: "Replace $x$ in the equation with the given value." };
    });

  topic("l_func", "lin", "Function notation", ["l_table"],
    "f(x) is just a name for the output. f(4) means: put 4 wherever you see x, then work it out.",
    function (R, d) {
      var q, v, walk, a, b, c, x;
      if (d === 1) { a = R.int(2, 7); b = R.nz(-9, 9); x = R.int(2, 8); v = a * x + b; q = "If $f(x) = " + poly([[a, "x"], [b, ""]]) + "$, find $f(" + x + ")$."; walk = [["f(" + x + ") = " + a + "(" + x + ") " + H.sg(b), "Replace every $x$ with " + x + "."], ["= " + v, "Multiply, then add."]]; }
      else if (d === 2) { a = R.nz(-3, 3); b = R.nz(-6, 6); c = R.nz(-8, 8); x = R.nz(-4, 4); v = a * x * x + b * x + c; var e = poly([[a, "x^2"], [b, "x"], [c, ""]]); q = "If $f(x) = " + e + "$, find $f(" + x + ")$."; walk = [["f(" + x + ") = " + LAB.sub(e, { x: x }), "Replace every $x$ with " + x + ", in brackets."], ["= " + tex(a * x * x) + " " + H.sg(b * x) + " " + H.sg(c) + " = " + v, "Power first, then multiply, then add."]]; }
      else { a = R.nz(-3, 3); b = R.nz(-6, 6); c = R.nz(-6, 6); var x1 = R.int(1, 4), x2 = R.nz(-4, -1); v = (a * x1 * x1 + b * x1 + c) - (a * x2 * x2 + b * x2 + c); var e2 = poly([[a, "x^2"], [b, "x"], [c, ""]]); q = "If $f(x) = " + e2 + "$, find $f(" + x1 + ") - f(" + x2 + ")$."; var f1 = a * x1 * x1 + b * x1 + c, f2 = a * x2 * x2 + b * x2 + c; walk = [["f(" + x1 + ") = " + f1, "Replace $x$ with " + x1 + "."], ["f(" + x2 + ") = " + f2, "Replace $x$ with " + x2 + ", in brackets."], [f1 + " - " + par(f2) + " = " + v, "Subtract."]]; }
      return { q: q, a: { k: "num", v: v }, walk: walk, hint: "Replace every $x$ with the number in the brackets." };
    });

  topic("l_isfunc", "lin", "Is it a function?", ["l_plot"],
    "A relation is a function if every input has exactly one output. Look for an x-value that appears with two different y-values — one repeat with different outputs is enough to fail.",
    function (R, d) {
      var q, isF, why, a;
      if (d === 1) {
        var xs = R.shuffle([-3, -2, -1, 0, 1, 2, 3, 4]).slice(0, 4), ys = [R.int(-5, 5), R.int(-5, 5), R.int(-5, 5), R.int(-5, 5)];
        isF = R.chance(0.5);
        var ps = xs.map(function (x, i) { return [x, ys[i]]; });
        if (!isF) { var i0 = R.int(0, 3); var newY = ps[i0][1] + R.pick([1, 2, -1, -2]); ps[3 === i0 ? 2 : 3] = [ps[i0][0], newY]; }
        q = "Is this relation a function?<br>$\\{" + ps.map(function (p) { return pt(p[0], p[1]); }).join(", ") + "\\}$";
        var rep;
        (function () { var seen = {}; ps.forEach(function (p) { if (seen[p[0]] != null && seen[p[0]] !== p[1]) rep = p[0]; seen[p[0]] = p[1]; }); })();
        why = isF ? "Every x-value appears once, so each input has exactly one output." : "The input " + tex(rep) + " has two different outputs, so it is not a function.";
      } else if (d === 2) {
        var xv = R.shuffle([-2, -1, 0, 1, 2, 3, 5]).slice(0, 4), yv = xv.map(function () { return R.int(-6, 6); });
        isF = R.chance(0.5);
        if (!isF) { xv[3] = xv[1]; if (yv[3] === yv[1]) yv[3] = yv[1] + 3; } else { if (R.chance(0.5)) yv[2] = yv[0]; }
        q = "Is $y$ a function of $x$ in this table?<br>x: " + xv.map(function (v) { return "$" + tex(v) + "$"; }).join(" · ") + "<br>y: " + yv.map(function (v) { return "$" + tex(v) + "$"; }).join(" · ");
        why = isF ? "No x-value is repeated with a different y-value. (Different inputs may share an output.)" : "The input " + tex(xv[1]) + " appears twice with different outputs.";
      } else {
        var rel = R.pick([["y = x^2 + 1", true, "For each x there is only one y."], ["x = y^2", false, "For x = 4, y could be 2 or −2 — one input, two outputs."], ["y = 2x - 5", true, "Every x gives just one y."], ["x^2 + y^2 = 25", false, "For x = 0, y could be 5 or −5."], ["y = |x - 3|", true, "Absolute value gives exactly one output for every input."], ["|y| = x", false, "For x = 3, y could be 3 or −3."]]);
        q = "Is $y$ a function of $x$ in the relation $" + rel[0] + "$?"; isF = rel[1]; why = rel[2];
      }
      a = H.choice(R, isF ? "Yes, it is a function" : "No, it is not a function", [[isF ? "No, it is not a function" : "Yes, it is a function", isF ? "Each input here has only one output, so it is a function. (Two inputs sharing an output is fine.)" : why]], { keep: true });
      return { q: q, a: a, walk: [[isF ? "\\text{function}" : "\\text{not a function}", why]], hint: "Does any input give two different outputs?" };
    });

  topic("l_slope", "lin", "Slope from two points", ["n_frac_simp", "l_plot"],
    "Slope is rise over run: how far the line goes up or down for each step across. From two points, m = (y₂ − y₁) ÷ (x₂ − x₁) — subtract in the same order on the top and the bottom.",
    function (R, d) {
      var x1, y1, x2, y2, m, q, walk, fig, guard = 0, pp, qq;
      if (d < 3) {
        do {
          x1 = R.int(-6, 6); y1 = R.int(-6, 6);
          var s = d === 1 ? [R.nz(1, 5) * R.sign(), 1] : randSlope(R, true);
          pp = s[0]; qq = s[1]; var k = R.int(1, 3);
          x2 = x1 + qq * k; y2 = y1 + pp * k;
        } while (Math.abs(x2) > 9 || Math.abs(y2) > 9);
        m = pp / qq;
        q = "Find the slope of the line through $" + pt(x1, y1) + "$ and $" + pt(x2, y2) + "$.";
        walk = [["m = \\frac{" + tex(y2) + " - " + par(y1) + "}{" + tex(x2) + " - " + par(x1) + "}", "Slope is rise over run: (y₂ − y₁) ÷ (x₂ − x₁)."], ["m = " + H.frac(y2 - y1, x2 - x1) + (H.frac(y2 - y1, x2 - x1) !== fr(y2 - y1, x2 - x1) ? " = " + fr(y2 - y1, x2 - x1) : ""), "Subtract, then simplify."]];
        var fbs = [{ v: -m, say: "The sign is reversed — check the order of subtraction: use the same point first on the top and the bottom." }];
        if (y2 - y1 !== 0) fbs.push({ v: (x2 - x1) / (y2 - y1), say: "That's run over rise. Slope is rise (up/down) over run (across)." });
        return { q: q + (qq !== 1 ? " Write your answer as a fraction in lowest terms." : ""), a: { k: "num", v: m, lowest: true }, walk: walk, hint: "Rise over run: subtract the y's, subtract the x's, in the same order.", fb: fbs.filter(function (f) { return Math.abs(f.v - m) > 1e-9; }) };
      }
      do {
        x1 = R.int(-5, 5); y1 = R.int(-5, 5); var s2 = randSlope(R, R.chance(0.6)); pp = s2[0]; qq = s2[1]; var k2 = R.int(1, 2);
        x2 = x1 + qq * k2; y2 = y1 + pp * k2;
      } while (Math.abs(x2) > 6 || Math.abs(y2) > 6 || Math.abs(pp) > 4);
      m = pp / qq;
      return { q: "What is the slope of the line shown? Write your answer as a fraction in lowest terms.", fig: H.plane({ x: [-7, 7], y: [-7, 7], size: 280, lines: [{ x1: x1, y1: y1, x2: x2, y2: y2 }], pts: [{ x: x1, y: y1 }, { x: x2, y: y2 }] }),
        a: { k: "num", v: m, lowest: true }, walk: [["m = \\frac{" + tex(y2) + " - " + par(y1) + "}{" + tex(x2) + " - " + par(x1) + "} = " + fr(pp, qq), "Pick two points that sit exactly on grid crossings, " + pt(x1, y1) + " and " + pt(x2, y2) + ", and find rise over run."]],
        hint: "Pick two points on the grid crossings and count rise over run.", fb: [{ v: -m, say: "The sign is reversed. Going right and up is positive; right and down is negative." }] };
    });

  topic("l_intercepts", "lin", "Intercepts", ["l_table", "q_2step"],
    "An intercept is where the line crosses an axis. On the x-axis y = 0, so put 0 in for y and solve for x. On the y-axis x = 0.",
    function (R, d) {
      var q, v, walk, m, b, a, c, x0, y0, low = false;
      if (d === 1) { m = R.nz(-5, 5); x0 = R.nz(-7, 7); b = -m * x0; q = "Find the $x$-intercept of the line $y = " + poly([[m, "x"], [b, ""]]) + "$. Enter the $x$-coordinate."; v = x0; walk = [["0 = " + poly([[m, "x"], [b, ""]]), "On the $x$-axis $y$ is 0."], [poly([[m, "x"]]) + " = " + tex(-b), "Move the constant across."], ["x = " + tex(x0), "Divide by " + m + "."]]; }
      else if (d === 2) {
        a = R.int(2, 6); var bb = R.int(2, 7); var k = R.int(1, 3); c = a * bb * k; var wantX = R.chance(0.5);
        x0 = bb * k; y0 = a * k;
        q = "Find the " + (wantX ? "$x$" : "$y$") + "-intercept of $" + std(a, bb, c) + "$. Enter the " + (wantX ? "$x$" : "$y$") + "-coordinate.";
        v = wantX ? x0 : y0;
        walk = [[wantX ? std(a, bb, c).replace(poly([[bb, "y"]]), "") + "" : "", ""]].slice(1);
        walk = wantX ? [[a + "x + " + bb + "(0) = " + c, "On the $x$-axis $y$ = 0."], [a + "x = " + c + " \\Rightarrow x = " + x0, "Divide by " + a + "."]] : [[a + "(0) + " + bb + "y = " + c, "On the $y$-axis $x$ = 0."], [bb + "y = " + c + " \\Rightarrow y = " + y0, "Divide by " + bb + "."]];
      } else {
        a = R.int(2, 7); var b2 = R.nz(-6, 7); c = R.nz(-13, 13); var wantXX = R.chance(0.5);
        if (Math.abs(b2) < 2) b2 = 3;
        var den = wantXX ? a : b2, g = H.gcd(c, den);
        while (Math.abs(den) === g || c % den === 0) { c = R.nz(-13, 13); g = H.gcd(c, den); }
        q = "Find the " + (wantXX ? "$x$" : "$y$") + "-intercept of $" + std(a, b2, c) + "$. Enter the " + (wantXX ? "$x$" : "$y$") + "-coordinate as a fraction in lowest terms.";
        v = c / den; low = true;
        walk = wantXX ? [[a + "x = " + c, "Let $y$ = 0."], ["x = " + fr(c, a), "Divide by " + a + " and simplify."]] : [[tex(b2) + "y = " + c, "Let $x$ = 0."], ["y = " + fr(c, b2), "Divide by " + tex(b2) + " and simplify."]];
      }
      return { q: q, a: { k: "num", v: v, lowest: low }, walk: walk, hint: "For the $x$-intercept let $y = 0$; for the $y$-intercept let $x = 0$." };
    });

  topic("l_slope_int", "lin", "Slope-intercept form", ["l_slope"],
    "In y = mx + b the number multiplying x is the slope and the constant b is where the line crosses the y-axis. If the equation isn't in that form, solve for y first.",
    function (R, d) {
      var q, v, walk, m, b, low = false, askSlope = R.chance(0.6);
      if (d === 1) {
        m = R.nz(-9, 9); b = R.nz(-9, 9);
        q = "What is the " + (askSlope ? "slope" : "$y$-intercept") + " of the line $y = " + poly([[m, "x"], [b, ""]]) + "$?"; v = askSlope ? m : b;
        walk = [["y = " + poly([[m, "x"], [b, ""]]), "This is already y = mx + b, with m = " + m + " and b = " + b + "."]];
      } else if (d === 2) {
        var k = R.int(2, 5); m = R.nz(-5, 5); b = R.nz(-5, 5);
        q = "What is the " + (askSlope ? "slope" : "$y$-intercept") + " of the line $" + k + "y = " + poly([[k * m, "x"], [k * b, ""]]) + "$?"; v = askSlope ? m : b;
        walk = [["y = " + poly([[m, "x"], [b, ""]]), "Divide every term by " + k + " to get $y$ alone."], [askSlope ? "m = " + m : "b = " + b, askSlope ? "The slope is the coefficient of $x$." : "The $y$-intercept is the constant."]];
      } else {
        var A, B, C, g = 0;
        do { A = R.nz(-8, 9); B = R.nz(-8, 9); C = R.nz(-12, 12); g++; } while ((Math.abs(B) < 2 || A % B === 0 || Math.abs(A) === 1) && g < 100);
        q = "What is the " + (askSlope ? "slope" : "$y$-intercept") + " of the line $" + std(A, B, C) + "$? Write your answer as a fraction in lowest terms.";
        v = askSlope ? -A / B : C / B; low = true;
        walk = [[poly([[B, "y"]]) + " = " + poly([[-A, "x"], [C, ""]]), (A < 0 ? "Add " + poly([[-A, "x"]]) + " to" : "Subtract " + poly([[A, "x"]]) + " from") + " both sides (move the $x$ term)."], ["y = " + (function () { var ms = fr(-A, B), bs = fr(C, B); return (ms === "0" ? "" : ms + "x") + (C !== 0 ? (bs.charAt(0) === "-" ? " - " + bs.slice(1) : " + " + bs) : ""); })(), "Divide every term by " + B + "."], [askSlope ? "m = " + fr(-A, B) : "b = " + fr(C, B), askSlope ? "The slope is the coefficient of $x$." : "The $y$-intercept is the constant."]];
      }
      return { q: q, a: { k: "num", v: v, lowest: low }, walk: walk, hint: "Get the equation into the form $y = mx + b$." };
    });

  topic("l_write_si", "lin", "Writing an equation of a line", ["l_slope_int", "q_2step"],
    "With the slope m and the y-intercept b you can write y = mx + b straight away. With the slope and any one point, put the point into y = mx + b to find b.",
    function (R, d) {
      var m, b, x1, y1, q, walk, ans, pq;
      if (d === 1) { pq = randSlope(R, false); m = pq[0]; b = R.nz(-9, 9); q = "Write the equation of the line with slope $" + m + "$ and $y$-intercept $" + b + "$."; ans = eqTyped(m, 1, b); walk = [["y = " + slopeTex(m, 1, b).slice(4), "Put $m$ = " + m + " and $b$ = " + b + " into $y = mx + b$."]]; }
      else if (d === 2) { m = R.nz(-6, 6); x1 = R.nz(-5, 6); y1 = R.nz(-8, 9); b = y1 - m * x1; q = "Write the equation of the line with slope $" + m + "$ that passes through $" + pt(x1, y1) + "$. Write it as $y = mx + b$."; ans = eqTyped(m, 1, b); walk = [[tex(y1) + " = " + m + "(" + tex(x1) + ") + b", "Put the point and the slope into $y = mx + b$."], ["b = " + tex(y1) + " - " + par(m * x1) + " = " + tex(b), "Solve for $b$."], [slopeTex(m, 1, b), "Write the equation."]]; }
      else { pq = randSlope(R, true); var p = pq[0], qq = pq[1]; x1 = qq * R.nz(-3, 3); y1 = R.nz(-8, 8); b = y1 - p * x1 / qq; q = "Write the equation of the line with slope $" + fr(p, qq) + "$ that passes through $" + pt(x1, y1) + "$. Write it as $y = mx + b$."; ans = eqTyped(p, qq, b); walk = [[tex(y1) + " = " + fr(p, qq) + "(" + tex(x1) + ") + b", "Put the point and the slope into $y = mx + b$."], ["b = " + tex(y1) + " - " + par(p * x1 / qq) + " = " + tex(b), "Solve for $b$."], [slopeTex(p, qq, b), "Write the equation."]]; m = p / qq; }
      return { q: q, a: { k: "eq", v: ans, form: "slope" }, walk: walk, hint: "Find $b$ by putting the point into $y = mx + b$.",
        ver: function () { if (d === 1) return true; return H.holds(ans, { x: x1, y: y1 }); } };
    });

  topic("l_write_pts", "lin", "Line through two points", ["l_write_si"],
    "First find the slope from the two points. Then put one of the points into y = mx + b to find b.",
    function (R, d) {
      var pq, p, qq, b, x1, y1, x2, y2, k, ans, q, walk;
      pq = d === 1 ? [R.nz(-4, 4), 1] : randSlope(R, true); p = pq[0]; qq = pq[1];
      if (d === 1 && Math.abs(p) === 1) p = 2 * p;
      b = R.nz(-7, 7);
      x1 = qq * R.nz(-3, 3); k = qq * R.int(1, 3); x2 = x1 + k; if (x2 === x1) x2 = x1 + qq;
      y1 = p * x1 / qq + b; y2 = p * x2 / qq + b;
      if (d === 3 && Math.abs(y1) > 9) { x1 = 0; y1 = b; x2 = qq * 2; y2 = p * 2 + b; }
      ans = eqTyped(p, qq, b);
      q = "Write the equation of the line through $" + pt(x1, y1) + "$ and $" + pt(x2, y2) + "$. Write it as $y = mx + b$.";
      walk = [["m = \\frac{" + tex(y2) + " - " + par(y1) + "}{" + tex(x2) + " - " + par(x1) + "} = " + fr(p, qq), "Find the slope first."], [tex(y1) + " = " + fr(p, qq) + "(" + tex(x1) + ") + b \\Rightarrow b = " + tex(b), "Put the first point in to find $b$."], [slopeTex(p, qq, b), "Write the equation."]];
      return { q: q, a: { k: "eq", v: ans, form: "slope" }, walk: walk, hint: "Slope first, then $b$.", ver: function () { return H.holds(ans, { x: x1, y: y1 }) && H.holds(ans, { x: x2, y: y2 }); } };
    });

  topic("l_par_perp", "lin", "Parallel and perpendicular lines", ["l_slope_int", "n_frac_muldiv"],
    "Parallel lines have equal slopes. Perpendicular lines have slopes that are negative reciprocals: flip the fraction and change the sign, so their product is −1.",
    function (R, d) {
      var pq, p, qq, b, q, v, walk, ans, x1, y1;
      if (d === 1) { p = R.nz(-8, 8); b = R.nz(-9, 9); q = "What is the slope of any line parallel to $y = " + poly([[p, "x"], [b, ""]]) + "$?"; v = p; walk = [["m = " + p, "Parallel lines have the same slope."]]; return { q: q, a: { k: "num", v: v }, walk: walk, hint: "Parallel lines never meet, because they lean the same way." }; }
      if (d === 2) { pq = randSlope(R, R.chance(0.7)); p = pq[0]; qq = pq[1]; b = R.nz(-8, 8); q = "What is the slope of any line perpendicular to $" + slopeTex(p, qq, b) + "$? Write your answer as a fraction in lowest terms."; v = -qq / p; walk = [["m = " + fr(-qq, p), "Flip the slope " + fr(p, qq) + " and change its sign."]]; return { q: q, a: { k: "num", v: v, lowest: true }, walk: walk, hint: "Flip the fraction and change the sign.", fb: [{ v: -p / qq, say: "That's the opposite sign only. For perpendicular, also flip the fraction (take the reciprocal)." }, { v: qq / p, say: "That's the reciprocal only. Also change the sign." }].filter(function (f) { return Math.abs(f.v - v) > 1e-9; }) }; }
      pq = randSlope(R, R.chance(0.6)); p = pq[0]; qq = pq[1]; b = R.nz(-8, 8);
      var np = -qq, nq = p; if (nq < 0) { np = -np; nq = -nq; }
      x1 = nq * R.nz(-3, 3); y1 = R.nz(-7, 7); var nb = y1 - np * x1 / nq;
      q = "Write the equation of the line through $" + pt(x1, y1) + "$ that is perpendicular to $" + slopeTex(p, qq, b) + "$. Write it as $y = mx + b$.";
      ans = eqTyped(np, nq, nb);
      walk = [["m = " + fr(np, nq), "The perpendicular slope is the negative reciprocal of " + fr(p, qq) + "."], [tex(y1) + " = " + fr(np, nq) + "(" + tex(x1) + ") + b \\Rightarrow b = " + tex(nb), "Put the point in to find $b$."], [slopeTex(np, nq, nb), "Write the equation."]];
      return { q: q, a: { k: "eq", v: ans, form: "slope" }, walk: walk, hint: "First find the perpendicular slope, then use the point to find $b$.", ver: function () { return H.holds(ans, { x: x1, y: y1 }); } };
    });

  topic("l_std", "lin", "Standard form", ["l_slope_int", "q_literal"],
    "Standard form is Ax + By = C with whole numbers. To get there from y = mx + b, move the x-term to the left, and clear any fractions by multiplying every term by the denominator.",
    function (R, d) {
      var m, b, ans, q, walk, p, qq, den;
      if (d === 1) { m = R.nz(-7, 7); b = R.nz(-9, 9); q = "y = " + poly([[m, "x"], [b, ""]]); ans = stdTyped(-m, 1, b); walk = [[poly([[-m, "x"], [1, "y"]]) + " = " + tex(b), (m < 0 ? "Add " + poly([[-m, "x"]]) + " to" : "Subtract " + poly([[m, "x"]]) + " from") + " both sides."]]; }
      else if (d === 2) { var pq = randSlope(R, true); p = pq[0]; qq = pq[1]; b = R.nz(-6, 6); q = slopeTex(p, qq, b); ans = stdTyped(-p, qq, qq * b); walk = [[poly([[qq, "y"]]) + " = " + poly([[p, "x"], [qq * b, ""]]), "Multiply every term by " + qq + " to clear the fraction."], [poly([[-p, "x"], [qq, "y"]]) + " = " + tex(qq * b), "Move the $x$ term to the left."]]; }
      else { var n1 = R.int(1, 3) * R.sign(), n2 = R.int(1, 3), d2 = R.pick([2, 3, 4, 5]), d3 = R.pick([2, 3, 4, 5]); while (d3 === d2) d3 = R.pick([2, 3, 4, 5]); var n3 = R.nz(-4, 4); q = "y = " + fr(n1, d2) + "x " + (n3 < 0 ? "-" : "+") + " \\frac{" + Math.abs(n3) + "}{" + d3 + "}"; den = H.lcm(d2, d3); ans = stdTyped(-n1 * (den / d2), den, n3 * (den / d3)); walk = [[poly([[den, "y"]]) + " = " + poly([[n1 * (den / d2), "x"], [n3 * (den / d3), ""]]), "Multiply every term by the common denominator " + den + "."], [poly([[-n1 * (den / d2), "x"], [den, "y"]]) + " = " + tex(n3 * (den / d3)), "Move the $x$ term to the left."]]; }
      return { q: "Write the equation in standard form, $Ax + By = C$, with whole numbers.<br>$" + q + "$", a: { k: "eq", v: ans, form: "std" }, walk: walk, hint: "Move the $x$ term to the left and clear any fractions." };
    });

  topic("l_ineq_pt", "lin", "Points and linear inequalities", ["l_table", "q_ineq1"],
    "A point is a solution of an inequality when its coordinates make it true. Put x and y in and see whether the statement holds.",
    function (R, d) {
      var op, m, b, A, B, C, test, q, pts, correct, tries = 0, str, walk;
      do {
        op = R.pick(["<", ">", "<=", ">="]);
        pts = [];
        if (d < 3) { m = R.nz(-4, 4); b = R.nz(-6, 6); test = function (x, y) { var l = y, r = m * x + b; return op === "<" ? l < r : op === ">" ? l > r : op === "<=" ? l <= r : l >= r; }; str = "y " + (op === "<" ? "<" : op === ">" ? ">" : op === "<=" ? "\\le" : "\\ge") + " " + poly([[m, "x"], [b, ""]]); }
        else { A = R.int(1, 4); B = R.int(2, 4); C = R.nz(-12, 12); test = function (x, y) { var l = A * x + B * y; return op === "<" ? l < C : op === ">" ? l > C : op === "<=" ? l <= C : l >= C; }; str = poly([[A, "x"], [B, "y"]]) + " " + (op === "<" ? "<" : op === ">" ? ">" : op === "<=" ? "\\le" : "\\ge") + " " + C; }
        var pool = [];
        for (var x = -5; x <= 5; x += 1) for (var y = -6; y <= 6; y += 1) pool.push([x, y]);
        pool = R.shuffle(pool);
        var yes = pool.filter(function (p) { return test(p[0], p[1]); }), no = pool.filter(function (p) { return !test(p[0], p[1]); });
        // include one boundary point when the sign is ≤/≥ (the tricky case) — at d=2
        if (yes.length && no.length >= 3) { correct = yes[0]; pts = [correct].concat(no.slice(0, 3)); }
        tries++;
      } while (!correct && tries < 20);
      var ch = H.choice(R, "$" + pt(correct[0], correct[1]) + "$", pts.slice(1).map(function (p) { return ["$" + pt(p[0], p[1]) + "$", "Put $x$ = " + p[0] + " and $y$ = " + p[1] + " in: the statement is false."]; }));
      var val = d < 3 ? "y = " + correct[1] + ", " + poly([[m, "x"], [b, ""]]).replace(/x/g, "(" + correct[0] + ")") : A + "(" + correct[0] + ") + " + B + "(" + correct[1] + ") = " + (A * correct[0] + B * correct[1]);
      var sym = op === "<" ? "<" : op === ">" ? ">" : op === "<=" ? "\\le" : "\\ge", cx = correct[0], cy = correct[1];
      var wl = d < 3 ? [tex(cy) + " " + sym + " " + m + "(" + tex(cx) + ") " + H.sg(b) + " = " + tex(m * cx + b) + " \\ \\checkmark", "Put $x$ = " + cx + " and $y$ = " + cy + " into the inequality: " + cy + " " + (sym === "<" ? "<" : sym === ">" ? ">" : sym === "\\le" ? "≤" : "≥") + " " + (m * cx + b) + " is true."]
        : [A + "(" + tex(cx) + ") + " + B + "(" + tex(cy) + ") = " + tex(A * cx + B * cy) + "\\quad " + tex(A * cx + B * cy) + " " + sym + " " + C + " \\ \\checkmark", "Put $x$ = " + cx + " and $y$ = " + cy + " in: the statement is true."];
      return { q: "Which point is a solution of $" + str + "$?", a: ch, walk: [wl], hint: "Substitute each point's $x$ and $y$ and check whether the statement is true." };
    });

  /* ================================================================= Systems */

  function sysTex(e1, e2) { return "\\begin{cases}" + e1 + "\\\\" + e2 + "\\end{cases}"; }
  function sysQ(e1, e2) { return "<div class=\"pw-sys\"><span>$" + e1 + "$</span><span>$" + e2 + "$</span></div>"; }
  function holdsBoth(e1, e2, x, y) { return H.holds(e1, { x: x, y: y }) && H.holds(e2, { x: x, y: y }); }

  topic("s_check", "sys", "Checking a solution of a system", ["l_table"],
    "A solution of a system has to make both equations true at once. Substitute the pair into each equation; if either fails, it is not a solution.",
    function (R, d) {
      var x, y, a1, b1, a2, b2, c1, c2, yes = R.chance(0.5), walk, w2;
      x = R.nz(-6, 6); y = R.nz(-6, 6);
      do { a1 = R.nz(-4, 5); b1 = R.nz(-4, 5); a2 = R.nz(-4, 5); b2 = R.nz(-4, 5); } while (a1 * b2 - a2 * b1 === 0);
      c1 = a1 * x + b1 * y; c2 = a2 * x + b2 * y;
      var e1, e2, e1t, e2t;
      if (d === 1) { var bb = y - a1 * x; e1 = "y = " + poly([[a1, "x"], [bb, ""]]); e1t = "y=" + a1 + "*x+" + bb; e2 = std(1, 1, x + y); e2t = "x+y=" + (x + y); }
      else { e1 = std(a1, b1, c1); e1t = a1 + "*x+" + b1 + "*y=" + c1; e2 = std(a2, b2, c2); e2t = a2 + "*x+" + b2 + "*y=" + c2; }
      var tx = x, ty = y;
      if (!yes) {
        // make the pair satisfy exactly one equation (d ≥ 2) or neither
        if (d >= 2 && R.chance(0.6)) { if (R.chance(0.5)) { tx = x + R.pick([1, -1, 2]); ty = y + 0; var k = (c1 - a1 * tx); if (b1 !== 0 && k % b1 === 0) { ty = k / b1; } else { tx = x + 1; ty = y; } } else { tx = x + 1; } }
        else { tx = x + R.pick([1, -1, 2]); ty = y + R.pick([1, -1, 2]); }
      }
      var ok = holdsBoth(e1t, e2t, tx, ty);
      var c1ok = H.holds(e1t, { x: tx, y: ty }), c2ok = H.holds(e2t, { x: tx, y: ty });
      var why = ok ? "Both equations are true at " + pt(tx, ty) + "." : (!c1ok && !c2ok ? "Neither equation is true at " + pt(tx, ty) + "." : "The " + (c1ok ? "second" : "first") + " equation is false at " + pt(tx, ty) + ", so it isn't a solution of the system.");
      var a = H.choice(R, ok ? "Yes, it is a solution" : "No, it is not a solution", [[ok ? "No, it is not a solution" : "Yes, it is a solution", ok ? "Check again: both equations are true when you substitute." : why]], { keep: true });
      return { q: "Is $" + pt(tx, ty) + "$ a solution of the system?" + sysQ(e1, e2), a: a, walk: [[LAB.sub(e1.replace("y = ", "y = "), { x: tx, y: ty }).replace(/^y =/, ty + " ="), "Test the first equation."], [LAB.sub(e2, { x: tx, y: ty }), "Test the second equation."], [ok ? "\\text{both true}" : "\\text{not both true}", why]],
        hint: "A solution must make both equations true.", ver: function () { return true; } };
    });

  topic("s_types", "sys", "How many solutions?", ["l_slope_int", "s_check"],
    "Two lines can cross once (one solution), run parallel (no solution), or lie on top of each other (infinitely many). Comparing slopes and intercepts tells you which, without solving.",
    function (R, d) {
      var kind = R.pick(["one", "none", "inf"]), m, b, m2, b2, q, fig, why, A1, B1, C1, A2, B2, C2;
      m = R.nz(-4, 4); b = R.nz(-6, 6);
      if (kind === "one") { do { m2 = R.nz(-4, 4); } while (m2 === m); b2 = R.nz(-6, 6); }
      else if (kind === "none") { m2 = m; do { b2 = R.nz(-6, 6); } while (b2 === b); }
      else { m2 = m; b2 = b; }
      why = kind === "one" ? "The slopes are different (" + m + " and " + m2 + "), so the lines cross exactly once." : kind === "none" ? "The slopes are equal (" + m + ") but the intercepts differ (" + b + " and " + b2 + "): parallel lines never meet." : "Same slope and same intercept — it's the same line, so every point on it is a solution.";
      if (d === 1) {
        q = sysQ("y = " + poly([[m, "x"], [b, ""]]), "y = " + poly([[m2, "x"], [b2, ""]]));
        fig = H.plane({ x: [-7, 7], y: [-9, 9], size: 240, lines: [{ m: m, b: b }, { m: m2, b: b2, c: "b" }] });
      } else if (d === 2) {
        var k = R.int(2, 4);
        q = sysQ("y = " + poly([[m, "x"], [b, ""]]), poly([[-k * m2, "x"], [k, "y"]]) + " = " + k * b2);
        why += " (Rewrite the second equation as y = " + slopeForm(m2, b2).replace(/^\+\s*/, "") + " to compare.)";
      } else {
        var k1 = R.int(2, 4), k2 = R.int(2, 4);
        // Both in standard form: A x + B y = C  →  y = (-A/B) x + C/B
        B1 = k1; A1 = -m * k1; C1 = b * k1; B2 = k2; A2 = -m2 * k2; C2 = b2 * k2;
        q = sysQ(poly([[A1, "x"], [B1, "y"]]) + " = " + C1, poly([[A2, "x"], [B2, "y"]]) + " = " + C2);
        why += " (Solving each for y shows the slopes and intercepts.)";
      }
      var opts = { one: "One solution", none: "No solution", inf: "Infinitely many solutions" };
      var a = H.choice(R, opts[kind], ["one", "none", "inf"].filter(function (z) { return z !== kind; }).map(function (z) { return [opts[z], why]; }), { keep: true });
      return { q: "How many solutions does the system have?" + q, fig: fig, a: a, walk: [["\\text{" + opts[kind].toLowerCase() + "}", why]], hint: "Compare the slopes, then the intercepts." };
    });

  topic("s_sub", "sys", "Solving by substitution", ["q_2step", "l_write_si"],
    "When one equation already gives a letter in terms of the other, replace that letter in the second equation. That leaves one equation in one unknown; solve it, then find the other letter.",
    function (R, d) {
      var x, y, e1, e2, e1t, e2t, walk, a, b, c, m, bb, p, q2, guard = 0;
      x = R.nz(-6, 7); y = R.nz(-6, 7);
      if (d === 1) {
        a = R.int(1, 4); b = R.int(1, 4);
        var c2 = a * x + b * y; e1 = "y = " + y; e1t = "y=" + y; e2 = std(a, b, c2); e2t = a + "*x+" + b + "*y=" + c2;
        walk = [[poly([[a, "x"]]) + " + " + b + "(" + y + ") = " + c2, "Substitute $y$ = " + y + " into the second equation."], [poly([[a, "x"]]) + " = " + (c2 - b * y), "Simplify and move the number across."], ["x = " + x, "Divide by " + a + "."]];
      } else if (d === 2) {
        do { m = R.nz(-4, 4); a = R.nz(-4, 5); b = R.nz(-4, 5); bb = y - m * x; guard++; } while ((a + b * m === 0) && guard < 50);
        var c3 = a * x + b * y; e1 = "y = " + poly([[m, "x"], [bb, ""]]); e1t = "y=" + m + "*x+" + bb; e2 = std(a, b, c3); e2t = a + "*x+" + b + "*y=" + c3;
        walk = [[a + "x + " + par(b) + "(" + poly([[m, "x"], [bb, ""]]) + ") = " + c3, "Substitute the expression for $y$ into the second equation."], [poly([[a + b * m, "x"]]) + " = " + (c3 - b * bb), "Expand, combine like terms, and move the number across."], ["x = " + x + ",\\ \\ y = " + y, "Divide to get $x$, then put $x$ = " + x + " back into $" + e1 + "$ to find $y$."]];
      } else {
        do { p = R.nz(-3, 3); q2 = y * p * 0 + (x - p * y); a = R.nz(-4, 5); b = R.nz(-4, 5); guard++; } while ((a * p + b === 0) && guard < 50);
        var c4 = a * x + b * y; e1 = "x = " + poly([[p, "y"], [q2, ""]]); e1t = "x=" + p + "*y+" + q2; e2 = std(a, b, c4); e2t = a + "*x+" + b + "*y=" + c4;
        walk = [[a + "(" + poly([[p, "y"], [q2, ""]]) + ") + " + par(b) + "y = " + c4, "Substitute the expression for $x$ into the second equation."], [poly([[a * p + b, "y"]]) + " = " + (c4 - a * q2), "Expand, combine like terms, and move the number across."], ["y = " + y + ",\\ \\ x = " + x, "Divide to get $y$, then put $y$ = " + y + " back into $" + e1 + "$ to find $x$."]];
      }
      return { q: "Solve the system. Enter your answer as an ordered pair, like (2, -1)." + sysQ(e1, e2), a: { k: "pt", v: [x, y] }, walk: walk, hint: "Replace the letter that is already isolated in the other equation.", ver: function () { return holdsBoth(e1t, e2t, x, y); } };
    });

  topic("s_elim", "sys", "Solving by elimination", ["q_2step", "l_std"],
    "If a letter has opposite (or equal) coefficients in the two equations, adding (or subtracting) the equations makes it disappear. Solve the one that's left, then substitute back.",
    function (R, d) {
      var x = R.nz(-7, 8), y = R.nz(-7, 8), a1, b, a2, e1, e2, e1t, e2t, walk, guard = 0;
      if (d === 1) { e1 = std(1, 1, x + y); e2 = std(1, -1, x - y); e1t = "x+y=" + (x + y); e2t = "x-y=" + (x - y); walk = [["2x = " + 2 * x, "Add the equations: the $y$ terms cancel."], ["x = " + x + ",\\ \\ y = " + y, "Solve for $x$, then find $y$ from $x + y = " + (x + y) + "$."]]; }
      else if (d === 2) { do { a1 = R.int(2, 5); a2 = R.int(2, 5); b = R.int(1, 4); guard++; } while (a1 === a2 && guard < 30); a2 = a1; var b2 = -R.int(1, 4); while (b2 === -b) b2 = -R.int(1, 4); var c1 = a1 * x + b * y, c2 = a2 * x + b2 * y; e1 = std(a1, b, c1); e2 = std(a2, b2, c2); e1t = a1 + "*x+" + b + "*y=" + c1; e2t = a2 + "*x+" + b2 + "*y=" + c2; walk = [[poly([[b - b2, "y"]]) + " = " + (c1 - c2), "Subtract the second equation from the first: the $x$ terms cancel."], ["y = " + y, "Solve for $y$."], ["x = " + x, "Put $y$ back into either equation to find $x$."]]; }
      else { a1 = R.int(2, 6); b = R.int(2, 6); var a2b = R.int(2, 6); var cc1 = a1 * x + b * y, cc2 = a2b * x - b * y; e1 = std(a1, b, cc1); e2 = std(a2b, -b, cc2); e1t = a1 + "*x+" + b + "*y=" + cc1; e2t = a2b + "*x-" + b + "*y=" + cc2; walk = [[poly([[a1 + a2b, "x"]]) + " = " + (cc1 + cc2), "Add the equations: the $y$ terms are opposites and cancel."], ["x = " + x + ",\\ \\ y = " + y, "Solve for $x$, then put it back to find $y$."]]; }
      return { q: "Solve the system. Enter your answer as an ordered pair, like (2, -1)." + sysQ(e1, e2), a: { k: "pt", v: [x, y] }, walk: walk, hint: "Add or subtract the equations to eliminate one letter.", ver: function () { return holdsBoth(e1t, e2t, x, y); } };
    });

  topic("s_elim_mul", "sys", "Elimination with multiplying", ["s_elim"],
    "If no letter cancels yet, multiply one or both equations by numbers that make the coefficients of one letter opposites. Then add.",
    function (R, d) {
      var x = R.nz(-6, 7), y = R.nz(-6, 7), a1, b1, a2, b2, det, guard = 0;
      do {
        if (d === 1) { b1 = R.int(1, 4); var kk = R.int(2, 3); b2 = -kk * b1 * R.sign(); a1 = R.nz(-4, 5); a2 = R.nz(-4, 5); }
        else if (d === 2) { a1 = R.nz(-4, 5); a2 = R.nz(-4, 5); b1 = R.nz(-4, 5); b2 = R.nz(-4, 5); }
        else { a1 = R.nz(-6, 7); a2 = R.nz(-6, 7); b1 = R.nz(2, 6) * R.sign(); b2 = R.nz(2, 6) * R.sign(); }
        det = a1 * b2 - a2 * b1; guard++;
      } while ((det === 0 || (d > 1 && (Math.abs(b1) === Math.abs(b2) || Math.abs(b1) === 1 && Math.abs(b2) === 1)) || (d === 3 && (Math.abs(b2) % Math.abs(b1) === 0 || Math.abs(b1) % Math.abs(b2) === 0))) && guard < 200);
      var c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      var L = H.lcm(Math.abs(b1), Math.abs(b2)), m1 = L / Math.abs(b1), m2 = L / Math.abs(b2);
      if (b1 * m1 === b2 * m2) m2 = -m2;   // make the y terms opposite
      var sx = m1 * a1 + m2 * a2, sc = m1 * c1 + m2 * c2;
      var e1 = std(a1, b1, c1), e2 = std(a2, b2, c2);
      var walk = [];
      if (m1 !== 1) walk.push([std(m1 * a1, m1 * b1, m1 * c1), "Multiply the first equation by " + m1 + "."]);
      if (m2 !== 1) walk.push([std(m2 * a2, m2 * b2, m2 * c2), "Multiply the second equation by " + tex(m2) + "."]);
      walk.push([poly([[sx, "x"]]) + " = " + sc, "Now the $y$ coefficients (" + tex(m1 * b1) + " and " + tex(m2 * b2) + ") are opposites. Add the two equations: the $y$ terms cancel."]);
      walk.push(["x = " + x + ",\\ \\ y = " + y, "Solve for $x$, then put it back into an original equation to find $y$."]);
      return { q: "Solve the system. Enter your answer as an ordered pair, like (2, -1)." + sysQ(e1, e2), a: { k: "pt", v: [x, y] }, walk: walk, hint: "Multiply an equation (or both) so one letter has opposite coefficients.",
        ver: function () { return holdsBoth(a1 + "*x+" + b1 + "*y=" + c1, a2 + "*x+" + b2 + "*y=" + c2, x, y) && Math.abs(b1 * m1 + b2 * m2) < 1e-9; } };
    });

  topic("s_words", "sys", "Systems in word problems", ["s_sub", "e_words"],
    "Two unknowns need two equations. Name each unknown, write one equation for the total count and another for the total value, then solve by substitution or elimination.",
    function (R, d) {
      var q, ans, walk, x, y, eq1, eq2;
      if (d === 1) {
        var big = R.int(8, 30), small = R.int(2, big - 3), s = big + small, df = big - small;
        q = "Two numbers add up to $" + s + "$ and differ by $" + df + "$. What is the larger number?"; ans = big;
        walk = [["x + y = " + s + ",\\quad x - y = " + df, "Let $x$ be the larger number and $y$ the smaller."], ["2x = " + (s + df), "Add the equations."], ["x = " + big, "Divide by 2."]];
        eq1 = "x+y=" + s; eq2 = "x-y=" + df; x = big; y = small;
      } else if (d === 2) {
        var pa = R.int(8, 15), pc = R.int(4, pa - 2), A = R.int(12, 45), C = R.int(12, 45);
        var tot = A + C, rev = pa * A + pc * C;
        q = "Tickets to a school play cost $\\$" + pa + "$ for adults and $\\$" + pc + "$ for children. In all, $" + tot + "$ tickets were sold for $\\$" + rev + "$. How many adult tickets were sold?"; ans = A;
        walk = [["a + c = " + tot + ",\\quad " + pa + "a + " + pc + "c = " + rev, "Let $a$ be adult tickets and $c$ child tickets: one equation for the count, one for the money."], ["a + c = " + tot + " \\Rightarrow c = " + tot + " - a", "Solve the first equation for $c$."], [pa + "a + " + pc + "(" + tot + " - a) = " + rev + " \\Rightarrow a = " + A, "Substitute into the second and solve."]];
        eq1 = "x+y=" + tot; eq2 = pa + "*x+" + pc + "*y=" + rev; x = A; y = C;
      } else {
        var pen = R.pick([0.5, 0.75, 1, 1.25, 1.5]), nb = R.pick([1, 1.5, 2, 2.5, 3]), a1 = R.int(2, 4), b1 = R.int(1, 3), a2 = R.int(1, 3), b2 = R.int(2, 5);
        while (a1 * b2 - a2 * b1 === 0) b2++;
        var t1 = a1 * pen + b1 * nb, t2 = a2 * pen + b2 * nb;
        q = "$" + a1 + "$ pens and $" + b1 + "$ notebook" + (b1 > 1 ? "s" : "") + " cost $\\$" + t1.toFixed(2) + "$. $" + a2 + "$ pen" + (a2 > 1 ? "s" : "") + " and $" + b2 + "$ notebooks cost $\\$" + t2.toFixed(2) + "$. How much does one notebook cost, in dollars?"; ans = nb;
        walk = [[a1 + "p + " + b1 + "n = " + t1.toFixed(2) + ",\\quad " + a2 + "p + " + b2 + "n = " + t2.toFixed(2), "Let $p$ be the price of a pen and $n$ of a notebook."], ["\\text{eliminate } p", "Multiply so the $p$ terms match, then subtract."], ["n = " + nb, "Solve for $n$."]];
        eq1 = a1 + "*x+" + b1 + "*y=" + t1; eq2 = a2 + "*x+" + b2 + "*y=" + t2; x = pen; y = nb;
      }
      return { q: q, a: { k: "num", v: ans }, walk: walk, hint: "Write one equation for the count and one for the value.", ver: function () { return holdsBoth(eq1, eq2, x, y); } };
    });
})();
