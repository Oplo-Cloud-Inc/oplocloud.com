/* ==========================================================================
   Algebra Pathway — Equations and inequalities.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, P = LAB && LAB.PATH;
  if (!P || !P.h) return;
  var H = P.h, tex = H.tex, fr = H.fr, poly = LAB.poly;
  var PART = (P.parts = P.parts || {});
  var T = (PART.alg = PART.alg || []);
  function topic(id, cat, name, pre, idea, gen) { T.push({ id: id, cat: cat, name: name, pre: pre, idea: idea, gen: gen }); }
  var UN = { "\\le": "<=", "\\ge": ">=" };
  function frT(n, d) { return LAB.fracText(n, d); }

  /* ================================================== Equations and inequalities */

  topic("q_1step", "eqn", "One-step equations", ["e_eval"],
    "An equation is a balance. Whatever you do to one side you must do to the other. To get x alone, undo the operation attached to it: subtract to undo adding, divide to undo multiplying.",
    function (R, d) {
      var x, a, b, eq, walk, fb = [], v;
      if (d === 1) {
        x = R.nz(-12, 15); a = R.int(2, 15);
        if (R.chance(0.5)) { b = x + a; eq = "x + " + a + " = " + tex(b); walk = [["x = " + tex(b) + " - " + a + " = " + tex(x), "Subtract " + a + " from both sides to undo the adding."]]; fb = [{ v: b + a, say: "That adds " + a + " again. To undo + " + a + " you subtract " + a + " from both sides." }]; }
        else { b = x - a; eq = "x - " + a + " = " + tex(b); walk = [["x = " + tex(b) + " + " + a + " = " + tex(x), "Add " + a + " to both sides to undo the subtracting."]]; fb = [{ v: b - a, say: "That subtracts " + a + " again. To undo − " + a + " you add " + a + " to both sides." }]; }
      } else if (d === 2) {
        x = R.nz(-9, 12); a = R.int(2, 9);
        if (R.chance(0.5)) { b = a * x; eq = a + "x = " + tex(b); walk = [["x = \\frac{" + tex(b) + "}{" + a + "} = " + tex(x), "Divide both sides by " + a + " to undo the multiplying."]]; fb = [{ v: b * a, say: "Multiplying by " + a + " again goes the wrong way. Divide both sides by " + a + "." }]; }
        else { b = x; var xx = a * R.nz(-8, 9); x = xx; b = xx / a; eq = "\\frac{x}{" + a + "} = " + tex(b); walk = [["x = " + tex(b) + " \\times " + a + " = " + tex(x), "Multiply both sides by " + a + " to undo the dividing."]]; }
      } else {
        var kind = R.int(0, 2);
        if (kind === 0) { var p = R.int(2, 5), q = R.int(p + 1, 7); while (H.gcd(p, q) !== 1) q++; var k = R.nz(-6, 7); x = q * k; b = p * k; eq = "\\frac{" + p + "}{" + q + "}x = " + tex(b); walk = [["x = " + tex(b) + " \\cdot \\frac{" + q + "}{" + p + "} = " + tex(x), "Multiply both sides by the reciprocal, $\\frac{" + q + "}{" + p + "}$."]]; }
        else if (kind === 1) { a = R.int(2, 9); x = R.nz(-9, 9); b = -a * x; eq = "-" + a + "x = " + tex(b); walk = [["x = \\frac{" + tex(b) + "}{-" + a + "} = " + tex(x), "Divide both sides by −" + a + " (keep the sign)."]]; }
        else { a = R.int(2, 8); b = R.nz(-9, 9); x = -a * b; eq = "\\frac{x}{-" + a + "} = " + tex(b); walk = [["x = " + tex(b) + " \\cdot (-" + a + ") = " + tex(x), "Multiply both sides by −" + a + "."]]; }
      }
      var eqs = eq.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "(($1)/($2))").replace(/x\b/g, "x");
      return { q: "Solve for $x$.<br>$" + eq + "$", a: { k: "num", v: x }, walk: walk, hint: "What is being done to $x$? Do the opposite to both sides.", fb: fb,
        ver: function () { return H.holds(eqs.replace(/\{|\}/g, ""), { x: x }); } };
    });

  topic("q_2step", "eqn", "Two-step equations", ["q_1step"],
    "Undo in the reverse order of the operations: first the adding or subtracting, then the multiplying or dividing. Check by putting your answer back in.",
    function (R, d) {
      var a, b, c, x, eq, eqs, walk, fb = [], ans, low = false;
      if (d === 1) { a = R.int(2, 9); x = R.int(0, 9); b = R.int(1, 12); c = a * x + b; eq = a + "x + " + b + " = " + c; eqs = a + "x+" + b + "=" + c; walk = [[a + "x = " + (c - b), "Subtract " + b + " from both sides."], ["x = " + x, "Divide both sides by " + a + "."]]; ans = x; fb = [{ v: c / a - b, say: "Divide only after the " + b + " is gone — the " + b + " isn't divided by " + a + " here." }, { v: (c + b) / a, say: "The + " + b + " is undone by subtracting " + b + ", not adding." }]; }
      else if (d === 2) {
        var f = R.int(0, 1);
        if (f === 0) { a = R.nz(-9, 9); if (Math.abs(a) < 2) a = -3; x = R.nz(-9, 9); b = R.nz(-14, 14); c = a * x + b; eq = poly([[a, "x"], [b, ""]]) + " = " + c; eqs = a + "x+" + b + "=" + c; walk = [[poly([[a, "x"]]) + " = " + (c - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."], ["x = " + x, "Divide both sides by " + a + "."]]; ans = x; }
        else { a = R.int(2, 6); x = a * R.nz(-6, 7); b = R.nz(-9, 9); c = x / a + b; eq = "\\frac{x}{" + a + "} " + H.sg(b) + " = " + c; eqs = "x/" + a + "+" + b + "=" + c; walk = [["\\frac{x}{" + a + "} = " + (c - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."], ["x = " + x, "Multiply both sides by " + a + "."]]; ans = x; }
      } else {
        a = R.int(2, 9); b = R.nz(-9, 9); var g = 0;
        do { c = R.nz(-15, 20); g++; } while ((c - b) % a === 0 && g < 30);
        ans = (c - b) / a; low = true;
        eq = poly([[a, "x"], [b, ""]]) + " = " + c; eqs = a + "x+" + b + "=" + c;
        walk = [[poly([[a, "x"]]) + " = " + (c - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."], ["x = " + fr(c - b, a), "Divide both sides by " + a + "; leave it as a fraction in lowest terms."]];
      }
      return { q: "Solve for $x$." + (low ? " Write your answer as a fraction in lowest terms." : "") + "<br>$" + eq + "$", a: { k: "num", v: ans, lowest: low }, walk: walk,
        hint: "Undo the adding or subtracting first, then the multiplying or dividing.", fb: fb, ver: function () { return H.holds(eqs, { x: ans }); } };
    });

  topic("q_multi", "eqn", "Variables on both sides", ["q_2step", "e_like"],
    "Gather the x-terms on one side and the plain numbers on the other, then finish as a two-step equation. Subtract the smaller x-term from both sides to keep the coefficient positive.",
    function (R, d) {
      var a, c, b, e, x, guard = 0;
      do {
        x = d === 1 ? R.int(1, 9) : R.nz(-9, 9);
        a = d === 1 ? R.int(3, 9) : R.nz(-8, 9); c = d === 1 ? R.int(1, a - 1) : R.nz(-8, 9);
        b = d === 1 ? R.int(1, 15) : R.nz(-15, 15);
      } while ((a === c || (d > 1 && Math.abs(a - c) < 2 && guard++ < 50)) && guard < 100);
      e = (a - c) * x + b;
      var left = poly([[a, "x"], [b, ""]]), right = poly([[c, "x"], [e, ""]]);
      if (d === 3 && R.chance(0.5)) { left = poly([[b, ""], [a, "x"]]); right = poly([[e, ""], [c, "x"]]); }
      var walk = [
        [poly([[a - c, "x"], [b, ""]]) + " = " + tex(e), (c < 0 ? "Add " + tex(-c) + "x to" : "Subtract " + tex(c) + "x from") + " both sides to gather the $x$ terms."],
        [poly([[a - c, "x"]]) + " = " + tex(e - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."],
        ["x = " + tex(x), "Divide both sides by " + tex(a - c) + "."]
      ];
      var eqs = poly([[a, "x"], [b, ""]]) + "=" + poly([[c, "x"], [e, ""]]);
      return { q: "Solve for $x$.<br>$" + left + " = " + right + "$", a: { k: "num", v: x }, walk: walk, hint: "Move the $x$ terms to one side and the numbers to the other.",
        ver: function () { return H.holds(eqs, { x: x }); } };
    });

  topic("q_dist", "eqn", "Equations with brackets", ["q_multi", "e_dist"],
    "Expand the brackets first, combine anything that can be combined, then solve as before.",
    function (R, d) {
      var a, b, c, e, f, x, eq, eqs, walk;
      if (d === 1) { a = R.int(2, 7); x = R.nz(-8, 9); b = R.int(1, 8); c = a * (x + b); eq = a + "(x + " + b + ") = " + c; eqs = a + "*(x+" + b + ")=" + c; walk = [[a + "x + " + a * b + " = " + c, "Expand the bracket."], [a + "x = " + (c - a * b), "Subtract " + a * b + " from both sides."], ["x = " + x, "Divide both sides by " + a + "."]]; }
      else if (d === 2) { a = R.nz(-6, 7); if (Math.abs(a) < 2) a = 3; x = R.nz(-8, 9); b = R.nz(-7, 8); e = R.nz(-9, 9); f = a * (x + b) + e; eq = a + "(x " + H.sg(b) + ") " + H.sg(e) + " = " + f; eqs = a + "*(x+" + b + ")+" + e + "=" + f; walk = [[poly([[a, "x"], [a * b + e, ""]]) + " = " + f, "Expand, then combine the numbers: " + a * b + " " + H.sg(e) + " = " + (a * b + e) + "."], [poly([[a, "x"]]) + " = " + (f - a * b - e), "Move the number across."], ["x = " + x, "Divide by " + a + "."]]; }
      else { do { a = R.nz(-6, 7); c = R.nz(-6, 7); } while (a === c || Math.abs(a) < 2); x = R.nz(-7, 8); b = R.nz(-6, 6); e = R.nz(-6, 6); f = a * (x + b) - c * (x + e); eq = a + "(x " + H.sg(b) + ") = " + c + "(x " + H.sg(e) + ") " + H.sg(f); eqs = a + "*(x+" + b + ")=" + c + "*(x+" + e + ")+" + f; walk = [[poly([[a, "x"], [a * b, ""]]) + " = " + poly([[c, "x"], [c * e + f, ""]]), "Expand both brackets and combine numbers on the right."], [poly([[a - c, "x"]]) + " = " + (c * e + f - a * b), "Gather the $x$ terms on the left and the numbers on the right."], ["x = " + x, "Divide by " + tex(a - c) + "."]]; }
      return { q: "Solve for $x$.<br>$" + eq + "$", a: { k: "num", v: x }, walk: walk, hint: "Expand the brackets first.", ver: function () { return H.holds(eqs, { x: x }); } };
    });

  topic("q_frac", "eqn", "Equations with fractions", ["q_2step", "n_frac_addsub"],
    "You can clear fractions by multiplying every term by the common denominator. Then you have an ordinary equation without fractions.",
    function (R, d) {
      var x, a, b, c, eq, eqs, walk;
      if (d === 1) { a = R.int(2, 6); b = R.nz(-8, 9); var k = R.nz(-7, 8); x = a * k; c = k + b; eq = "\\frac{x}{" + a + "} " + H.sg(b) + " = " + c; eqs = "x/" + a + "+" + b + "=" + c; walk = [["\\frac{x}{" + a + "} = " + (c - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."], ["x = " + x, "Multiply both sides by " + a + "."]]; }
      else if (d === 2) { var p = R.int(1, 5), q = R.int(2, 7); while (p >= q || H.gcd(p, q) !== 1) { p = R.int(1, 5); q = R.int(2, 7); } var kk = R.nz(-6, 7); x = q * kk; b = R.nz(-9, 9); c = p * kk + b; eq = "\\frac{" + p + "}{" + q + "}x " + H.sg(b) + " = " + c; eqs = "(" + p + "/" + q + ")*x+" + b + "=" + c; walk = [["\\frac{" + p + "}{" + q + "}x = " + (c - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."], ["x = " + (c - b) + " \\cdot \\frac{" + q + "}{" + p + "} = " + x, "Multiply by the reciprocal."]]; }
      else { var m = R.int(2, 5), n = R.int(m + 1, 7); while (H.gcd(m, n) !== 1) n++; var L = m * n; x = L * R.nz(-3, 4); c = x / m + x / n; eq = "\\frac{x}{" + m + "} + \\frac{x}{" + n + "} = " + c; eqs = "x/" + m + "+x/" + n + "=" + c; walk = [[n + "x + " + m + "x = " + c * L, "Multiply every term by the common denominator " + L + "."], [(m + n) + "x = " + c * L, "Combine the $x$ terms."], ["x = " + x, "Divide both sides by " + (m + n) + "."]]; }
      return { q: "Solve for $x$.<br>$" + eq + "$", a: { k: "num", v: x }, walk: walk, hint: "Multiply every term by the common denominator to clear the fractions.", ver: function () { return H.holds(eqs, { x: x }); } };
    });

  topic("q_literal", "eqn", "Solving for a variable", ["q_2step"],
    "Solving a formula for one letter is the same as solving an equation: the other letters just stay as letters. Undo the operations on the letter you want, in reverse order.",
    function (R, d) {
      var items = {
        1: [
          { q: "d = rt", v: "t", a: "d/r", walk: [["t = \\frac{d}{r}", "Divide both sides by $r$ to undo the multiplying."]], vars: ["d", "r"], eq: "d=r*t" },
          { q: "A = lw", v: "w", a: "A/l", walk: [["w = \\frac{A}{l}", "Divide both sides by $l$."]], eq: "A=l*w" },
          { q: "V = Bh", v: "B", a: "V/h", walk: [["B = \\frac{V}{h}", "Divide both sides by $h$."]], eq: "V=B*h" },
          { q: "y = x + k", v: "x", a: "y-k", walk: [["x = y - k", "Subtract $k$ from both sides."]], eq: "y=x+k" }
        ],
        2: [
          { q: "P = 2l + 2w", v: "l", a: "(P-2w)/2", walk: [["P - 2w = 2l", "Subtract $2w$ from both sides."], ["l = \\frac{P - 2w}{2}", "Divide both sides by 2."]], eq: "P=2l+2w" },
          { q: "y = mx + b", v: "x", a: "(y-b)/m", walk: [["y - b = mx", "Subtract $b$ from both sides."], ["x = \\frac{y - b}{m}", "Divide both sides by $m$."]], eq: "y=m*x+b" },
          { q: "A = \\frac{1}{2}bh", v: "h", a: "2A/b", walk: [["2A = bh", "Multiply both sides by 2."], ["h = \\frac{2A}{b}", "Divide both sides by $b$."]], eq: "A=(1/2)*b*h" },
          { q: "C = 2\\pi r", v: "r", a: "C/(2pi)", walk: [["r = \\frac{C}{2\\pi}", "Divide both sides by $2\\pi$."]], eq: "C=2*pi*r" }
        ],
        3: [
          { q: "ax + by = c", v: "y", a: "(c-ax)/b", walk: [["by = c - ax", "Subtract $ax$ from both sides."], ["y = \\frac{c - ax}{b}", "Divide both sides by $b$."]], eq: "a*x+b*y=c" },
          { q: "C = \\frac{5}{9}(F - 32)", v: "F", a: "9C/5+32", walk: [["\\frac{9}{5}C = F - 32", "Multiply both sides by $\\frac{9}{5}$."], ["F = \\frac{9}{5}C + 32", "Add 32 to both sides."]], eq: "C=(5/9)*(F-32)" },
          { q: "S = 2\\pi r^2 + 2\\pi rh", v: "h", a: "(S-2pi*r^2)/(2pi*r)", walk: [["S - 2\\pi r^2 = 2\\pi rh", "Subtract $2\\pi r^2$ from both sides."], ["h = \\frac{S - 2\\pi r^2}{2\\pi r}", "Divide both sides by $2\\pi r$."]], eq: "S=2*pi*r^2+2*pi*r*h" },
          { q: "\\frac{x}{a} + \\frac{y}{b} = 1", v: "y", a: "b(1-x/a)", walk: [["\\frac{y}{b} = 1 - \\frac{x}{a}", "Subtract $\\frac{x}{a}$ from both sides."], ["y = b\\left(1 - \\frac{x}{a}\\right)", "Multiply both sides by $b$."]], eq: "x/a+y/b=1" }
        ]
      };
      var it = R.pick(items[d]);
      return { q: "Solve for $" + it.v + "$.<br>$" + it.q + "$<br>Write $" + it.v + " =$ and then your expression.", a: { k: "expr", v: it.a }, walk: it.walk, hint: "Treat the other letters like numbers: undo what is attached to $" + it.v + "$, last operation first.",
        ver: function () {
          var vars = Object.keys(LAB.varsOf(LAB.parseRel(it.eq).sides[0])).concat(Object.keys(LAB.varsOf(LAB.parseRel(it.eq).sides[1])));
          for (var t = 0; t < 8; t++) {
            var env = {}; vars.forEach(function (n, i) { env[n] = 1.3 + 0.7 * i + 0.37 * t; });
            env[it.v] = 0; delete env[it.v];
            var val = LAB.evalTree(LAB.parse(it.a), env);
            var env2 = Object.assign({}, env); env2[it.v] = val;
            if (!H.holds(it.eq, env2)) return false;
          }
          return true;
        } };
    });

  topic("q_words", "eqn", "Linear word problems", ["q_2step", "e_words"],
    "Name the unknown, write what the words say as an equation, solve it, and check the answer against the story. 'Per' usually means multiply; a starting amount is added once.",
    function (R, d) {
      var q, x, eq, walk;
      if (d === 1) {
        var per = R.int(3, 12), start = R.int(10, 60); x = R.int(3, 15); var target = start + per * x;
        var nm = R.pick(["Maya", "Jordan", "Sam", "Priya", "Leo"]);
        q = nm + " has $\\$" + start + "$ and saves $\\$" + per + "$ each week. After how many weeks will " + nm + " have $\\$" + target + "$?";
        eq = start + "+" + per + "*x=" + target;
        walk = [[start + " + " + per + "w = " + target, "Let $w$ be the number of weeks. Start plus savings equals the target."], [per + "w = " + (target - start), "Subtract " + start + "."], ["w = " + x, "Divide by " + per + "."]];
      } else if (d === 2) {
        var fee = R.int(20, 60), rate = R.int(15, 45); x = R.int(2, 9); var bill = fee + rate * x;
        q = "A plumber charges a $\\$" + fee + "$ call-out fee plus $\\$" + rate + "$ per hour. The bill was $\\$" + bill + "$. How many hours did the job take?";
        eq = fee + "+" + rate + "*x=" + bill;
        walk = [[fee + " + " + rate + "h = " + bill, "Let $h$ be the hours. Fee plus hourly charge equals the bill."], [rate + "h = " + (bill - fee), "Subtract the fee."], ["h = " + x, "Divide by " + rate + "."]];
      } else {
        var a1, b1, a2, b2;
        do { a1 = R.int(10, 40); b1 = R.int(5, 15); a2 = R.int(0, 20); b2 = R.int(b1 + 2, 30); x = R.int(2, 12); a1 = a2 + (b2 - b1) * x; } while (a1 < 5);
        q = "Gym A charges a $\\$" + a1 + "$ joining fee plus $\\$" + b1 + "$ a month. Gym B charges a $\\$" + a2 + "$ joining fee plus $\\$" + b2 + "$ a month. After how many months do they cost the same?";
        eq = a1 + "+" + b1 + "*x=" + a2 + "+" + b2 + "*x";
        walk = [[a1 + " + " + b1 + "m = " + a2 + " + " + b2 + "m", "Let $m$ be the months. Set the two costs equal."], [(a1 - a2) + " = " + (b2 - b1) + "m", "Gather the $m$ terms on one side and the numbers on the other."], ["m = " + x, "Divide by " + (b2 - b1) + "."]];
      }
      return { q: q, a: { k: "num", v: x }, walk: walk, hint: "Write what the words say as an equation with one unknown.", ver: function () { return H.holds(eq, { x: x }); } };
    });

  topic("q_prop", "eqn", "Solving proportions", ["q_2step", "n_ratio"],
    "A proportion says two ratios are equal. Cross-multiply — the top of each fraction times the bottom of the other — then solve the equation you get.",
    function (R, d) {
      var x, a, b, c, q, walk, eq;
      if (d === 1) { c = R.int(2, 9); a = R.int(2, 9); var k = R.int(2, 8); b = c * k; x = a * k; q = "\\frac{x}{" + a + "} = \\frac{" + b + "}{" + c + "}"; eq = "x/" + a + "=" + b + "/" + c; walk = [[c + "x = " + a * b, "Cross-multiply: $x \\cdot " + c + " = " + a + " \\cdot " + b + "$."], ["x = " + x, "Divide both sides by " + c + "."]]; }
      else if (d === 2) { c = R.int(2, 7); a = R.int(2, 8); var k2 = R.int(2, 6); b = c * k2; var off = R.int(1, 8); x = a * k2 - off; q = "\\frac{x + " + off + "}{" + a + "} = \\frac{" + b + "}{" + c + "}"; eq = "(x+" + off + ")/" + a + "=" + b + "/" + c; walk = [[c + "(x + " + off + ") = " + a * b, "Cross-multiply."], [c + "x + " + c * off + " = " + a * b, "Expand the bracket."], ["x = " + x, "Subtract " + c * off + ", then divide by " + c + "."]]; }
      else {
        var cups = R.int(2, 5), serv = R.int(2, 6), want = serv * R.int(2, 6); x = cups * want / serv;
        while (x !== Math.round(x * 100) / 100) { cups++; x = cups * want / serv; }
        q = "A recipe uses $" + cups + "$ cups of flour to make $" + serv + "$ servings. How many cups of flour are needed for $" + want + "$ servings?";
        eq = "x/" + want + "=" + cups + "/" + serv;
        walk = [["\\frac{x}{" + want + "} = \\frac{" + cups + "}{" + serv + "}", "Set up the proportion: cups over servings on both sides."], [serv + "x = " + cups * want, "Cross-multiply."], ["x = " + x, "Divide by " + serv + "."]];
      }
      return { q: d === 3 ? q : "Solve the proportion.<br>$" + q + "$", a: { k: "num", v: x }, walk: walk, hint: "Cross-multiply, then solve.", ver: function () { return H.holds(eq, { x: x }); } };
    });

  function relTex(op) { return op === "<" ? "<" : op === ">" ? ">" : op === "<=" ? "\\le" : "\\ge"; }
  function flip(op) { return op === "<" ? ">" : op === ">" ? "<" : op === "<=" ? ">=" : "<="; }

  topic("q_ineq1", "eqn", "One-step inequalities", ["q_1step"],
    "An inequality is solved like an equation with one new rule: multiplying or dividing both sides by a negative number reverses the inequality sign.",
    function (R, d) {
      var op = R.pick(["<", ">", "<=", ">="]), t = R.nz(-9, 12), a, b, q, ans, walk, o2 = op;
      if (d === 1) {
        a = R.int(2, 12);
        if (R.chance(0.5)) { b = t + a; q = "x + " + a + " " + relTex(op) + " " + tex(b); walk = [["x " + relTex(op) + " " + tex(t), "Subtract " + a + " from both sides — the sign stays."]]; }
        else { b = t - a; q = "x - " + a + " " + relTex(op) + " " + tex(b); walk = [["x " + relTex(op) + " " + tex(t), "Add " + a + " to both sides — the sign stays."]]; }
        ans = "x" + op + t;
      } else if (d === 2) {
        a = R.int(2, 9);
        if (R.chance(0.5)) { b = a * t; q = a + "x " + relTex(op) + " " + tex(b); walk = [["x " + relTex(op) + " " + tex(t), "Divide both sides by " + a + " (positive), so the sign stays."]]; }
        else { var tt = a * R.nz(-6, 7); t = tt; b = tt / a; q = "\\frac{x}{" + a + "} " + relTex(op) + " " + tex(b); walk = [["x " + relTex(op) + " " + tex(t), "Multiply both sides by " + a + " (positive), so the sign stays."]]; }
        ans = "x" + op + t;
      } else {
        a = R.int(2, 9); b = -a * t;
        o2 = flip(op);
        q = "-" + a + "x " + relTex(op) + " " + tex(b);
        walk = [["x " + relTex(o2) + " " + tex(t), "Divide both sides by −" + a + ". Dividing by a negative reverses the sign: " + relTex(op) + " becomes " + relTex(o2) + "."]];
        ans = "x" + o2 + t;
      }
      return { q: "Solve the inequality. Write your answer as an inequality, like x > 3.<br>$" + q + "$", a: { k: "rel", v: ans, x: "x" }, walk: walk,
        hint: d === 3 ? "Dividing by a negative number reverses the inequality sign." : "Solve it like an equation.",
        ver: function () { var r = LAB.parseRel(q.replace(/\\le/g, "<=").replace(/\\ge/g, ">=").replace(/\\frac\{x\}\{(\d+)\}/, "(x/$1)")); var r2 = LAB.parseRel(ans); return LAB.sameRelation(r, r2, "x"); } };
    });

  topic("q_ineq2", "eqn", "Multi-step inequalities", ["q_ineq1", "q_2step"],
    "Solve step by step exactly as for an equation. Only flip the sign when you multiply or divide by a negative — and only then.",
    function (R, d) {
      var op = R.pick(["<", ">", "<=", ">="]), a, b, c, e, t, q, ans, walk, o2;
      if (d === 1) { a = R.int(2, 8); t = R.nz(-8, 9); b = R.nz(-12, 12); c = a * t + b; q = poly([[a, "x"], [b, ""]]) + " " + relTex(op) + " " + c; ans = "x" + op + t; walk = [[poly([[a, "x"]]) + " " + relTex(op) + " " + (c - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."], ["x " + relTex(op) + " " + t, "Divide both sides by " + a + " — positive, so the sign stays."]]; }
      else if (d === 2) { a = R.int(2, 8); t = R.nz(-8, 9); b = R.nz(-12, 12); c = -a * t + b; o2 = flip(op); q = poly([[-a, "x"], [b, ""]]) + " " + relTex(op) + " " + c; ans = "x" + o2 + t; walk = [[poly([[-a, "x"]]) + " " + relTex(op) + " " + (c - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."], ["x " + relTex(o2) + " " + t, "Divide both sides by −" + a + ", so the sign reverses."]]; }
      else {
        var a1, c1;
        do { a1 = R.nz(-7, 8); c1 = R.nz(-7, 8); } while (a1 === c1);
        t = R.nz(-7, 8); b = R.nz(-9, 9); e = b + (a1 - c1) * t;
        var k = a1 - c1; o2 = k < 0 ? flip(op) : op;
        q = poly([[a1, "x"], [b, ""]]) + " " + relTex(op) + " " + poly([[c1, "x"], [e, ""]]);
        ans = "x" + o2 + t;
        walk = [[poly([[k, "x"], [b, ""]]) + " " + relTex(op) + " " + e, (c1 < 0 ? "Add " + tex(-c1) + "x to" : "Subtract " + tex(c1) + "x from") + " both sides."], [poly([[k, "x"]]) + " " + relTex(op) + " " + (e - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " on both sides."], ["x " + relTex(o2) + " " + t, "Divide both sides by " + k + (k < 0 ? ", so the sign reverses." : " — the sign stays.")]];
      }
      return { q: "Solve the inequality. Write your answer as an inequality.<br>$" + q + "$", a: { k: "rel", v: ans, x: "x" }, walk: walk, hint: "Solve like an equation; flip the sign only when multiplying or dividing by a negative.",
        ver: function () { var r = LAB.parseRel(q.replace(/\\le/g, "<=").replace(/\\ge/g, ">=")); return LAB.sameRelation(r, LAB.parseRel(ans), "x"); } };
    });

  topic("q_compound", "eqn", "Compound inequalities", ["q_ineq2"],
    "In a compound inequality like −3 < 2x + 1 ≤ 9 the same steps are done to all three parts at once. The answer says x lies between two numbers.",
    function (R, d) {
      var lo = R.nz(-8, 5), hi = lo + R.int(3, 9), a = d === 1 ? 1 : R.int(2, 4), b = R.nz(-9, 9);
      var o1 = R.pick(["<", "<="]), o2 = R.pick(["<", "<="]);
      var c = a * lo + b, e = a * hi + b;
      var mid = poly([[a, "x"], [b, ""]]);
      var q = tex(c) + " " + relTex(o1) + " " + mid + " " + relTex(o2) + " " + tex(e);
      var walk = [];
      if (b !== 0) walk.push([tex(c - b) + " " + relTex(o1) + " " + poly([[a, "x"]]) + " " + relTex(o2) + " " + tex(e - b), (b > 0 ? "Subtract " : "Add ") + Math.abs(b) + " from all three parts."]);
      if (a !== 1) walk.push([tex(lo) + " " + relTex(o1) + " x " + relTex(o2) + " " + tex(hi), "Divide all three parts by " + a + "."]);
      else walk.push([tex(lo) + " " + relTex(o1) + " x " + relTex(o2) + " " + tex(hi), "That leaves $x$ alone in the middle."]);
      var ans = lo + o1 + "x" + o2 + hi;
      return { q: "Solve the compound inequality. Write your answer like 1 < x ≤ 5.<br>$" + q + "$", a: { k: "rel", v: ans, x: "x" }, walk: walk, hint: "Do the same thing to all three parts.",
        ver: function () { return LAB.sameRelation(LAB.parseRel(q.replace(/\\le/g, "<=")), LAB.parseRel(ans), "x"); } };
    });

  topic("q_abs", "eqn", "Absolute value equations", ["q_2step", "n_abs"],
    "|expression| = k asks for every number whose distance from zero is k — so the expression can equal k or −k. Solve both cases. If the bars are not alone, isolate them first.",
    function (R, d) {
      var k = R.int(2, 12), a, b, e, f, q, x1, x2, walk;
      if (d === 1) { a = R.nz(-8, 9); k = R.int(2, 9); x1 = a + k; x2 = a - k; q = "|x " + H.sg(-a) + "| = " + k; if (a === 0) q = "|x| = " + k; walk = [["x " + H.sg(-a) + " = " + k + " \\quad\\text{or}\\quad x " + H.sg(-a) + " = -" + k, "The inside is " + k + " or −" + k + "."], ["x = " + tex(x1) + " \\quad\\text{or}\\quad x = " + tex(x2), "Solve each."]]; }
      else if (d === 2) { a = R.int(2, 5); var mid = R.nz(-6, 6), hw = R.int(1, 6); b = -a * mid; k = a * hw; x1 = mid + hw; x2 = mid - hw; q = "|" + poly([[a, "x"], [b, ""]]) + "| = " + k; walk = [[poly([[a, "x"], [b, ""]]) + " = " + k + " \\quad\\text{or}\\quad " + poly([[a, "x"], [b, ""]]) + " = -" + k, "The inside is " + k + " or −" + k + "."], ["x = " + tex(x1) + " \\quad\\text{or}\\quad x = " + tex(x2), "Solve each one: add " + tex(-b) + " to both sides, then divide by " + a + "."]]; }
      else { a = R.int(2, 5); b = R.nz(-7, 8); var inner = R.int(2, 8); e = R.int(1, 9); f = a * inner - e; x1 = -b + inner; x2 = -b - inner; q = a + "|x " + H.sg(b) + "| " + H.sg(-e) + " = " + f; walk = [[a + "|x " + H.sg(b) + "| = " + (f + e), "Add " + e + " to both sides to start isolating the bars."], ["|x " + H.sg(b) + "| = " + inner, "Divide both sides by " + a + "."], ["x = " + tex(x1) + " \\quad\\text{or}\\quad x = " + tex(x2), "Two cases: the inside is " + inner + " or −" + inner + "."]]; }
      return { q: "Solve. Enter both answers, separated by a comma.<br>$" + q + "$", a: { k: "list", v: [x1, x2] }, walk: walk, hint: "Write two equations: the inside equals k, and the inside equals −k." };
    });
})();
