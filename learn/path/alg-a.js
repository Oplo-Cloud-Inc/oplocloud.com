/* ==========================================================================
   Algebra Pathway — Numbers and Expressions. See lab/pathhelp.js for the
   shape of a question, and path/alg.js for the course itself.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, P = LAB && LAB.PATH;
  if (!P || !P.h) return;
  var H = P.h, tex = H.tex, par = H.par, fr = H.fr, frT = H.frT;
  var PART = (P.parts = P.parts || {});
  var T = (PART.alg = PART.alg || []);
  function topic(id, cat, name, pre, idea, gen) { T.push({ id: id, cat: cat, name: name, pre: pre, idea: idea, gen: gen }); }
  function fmtDec(i, places) { return (i / Math.pow(10, places)).toFixed(places); }
  function divisors(n) { var o = []; for (var k = 2; k <= Math.abs(n); k++) if (n % k === 0) o.push(k); return o; }

  /* ================================================================ Numbers */

  topic("n_int_add", "num", "Adding and subtracting integers", [],
    "Adding a positive number moves right on the number line; adding a negative moves left. Subtracting a number is the same as adding its opposite, so subtracting a negative moves right.",
    function (R, d) {
      var n = d === 1 ? 2 : d === 2 ? 3 : 4, lim = d === 1 ? 9 : d === 2 ? 12 : 15;
      var vals = [R.nz(-lim, lim)], ops = [], i;
      for (i = 1; i < n; i++) { vals.push(R.nz(-lim, lim)); ops.push(R.chance(0.5) ? "+" : "-"); }
      if (d === 1 && vals[0] > 0 && vals[1] > 0 && ops[0] === "+") vals[1] = -vals[1];
      var s = tex(vals[0]), s2 = tex(vals[0]), total = vals[0], alt = vals[0], steps = [], run = vals[0];
      for (i = 1; i < n; i++) {
        var v = vals[i], op = ops[i - 1], eff = op === "+" ? v : -v;
        s += " " + op + " " + par(v);
        s2 += " " + (eff < 0 ? "-" : "+") + " " + tex(Math.abs(eff));
        steps.push([tex(run) + " " + (eff < 0 ? "-" : "+") + " " + tex(Math.abs(eff)) + " = " + tex(run + eff), "Move " + Math.abs(eff) + (eff < 0 ? " to the left." : " to the right.")]);
        run += eff; total += eff; alt += v;
      }
      var walk = [];
      if (/\(/.test(s)) walk.push([s2, "Subtracting is adding the opposite, so $- (-5)$ becomes $+ 5$ and $+ (-5)$ becomes $- 5$."]);
      walk = walk.concat(steps);
      return { q: "Evaluate.<br>$" + s + "$", a: { k: "num", v: total }, walk: walk,
        hint: "Rewrite each subtraction as adding the opposite, then work left to right.",
        fb: alt !== total ? [{ v: alt, say: "It looks like a subtraction was treated as an addition. Subtracting a number means adding its opposite." }] : [],
        ver: function () { return LAB.evalTree(LAB.parse(s.replace(/−/g, "-")), {}) === total; } };
    });

  topic("n_abs", "num", "Absolute value", ["n_int_add"],
    "Absolute value is distance from zero, so it is never negative. Work out what is inside the bars first, then take its distance from zero.",
    function (R, d) {
      var a, b, q, v, walk;
      if (d === 1) { a = R.nz(-15, 15); q = "|" + tex(a) + "|"; v = Math.abs(a); walk = [[q + " = " + v, tex(a) + " is " + v + " away from 0."]]; }
      else if (d === 2) {
        a = R.int(2, 9); b = R.int(2, 15); if (a === b) b++;
        q = "|" + a + " - " + b + "|"; v = Math.abs(a - b);
        walk = [["|" + tex(a - b) + "|", "Inside first: " + a + " − " + b + " = " + tex(a - b) + "."], ["= " + v, "Distance from zero."]];
      } else {
        a = R.int(2, 6); b = R.int(2, 9); var c = R.int(3, 8), e = R.int(c + 1, 15);
        q = a + "|-" + b + "| - |" + c + " - " + e + "|"; v = a * b - Math.abs(c - e);
        walk = [[a + "(" + b + ") - |" + tex(c - e) + "|", "Inside each bar first."], [a * b + " - " + Math.abs(c - e) + " = " + v, "Bars leave a positive value; then multiply and subtract."]];
      }
      return { q: "Evaluate.<br>$" + q + "$", a: { k: "num", v: v }, walk: walk, hint: "Do the arithmetic inside the bars first." };
    });

  topic("n_int_mul", "num", "Multiplying and dividing integers", ["n_int_add"],
    "Multiply or divide the sizes, then set the sign: the same signs give a positive, different signs give a negative. Dividing by a number is undoing multiplying by it.",
    function (R, d) {
      var a, b, c, q, v, walk;
      if (d === 1) {
        a = R.nz(-9, 9); b = R.nz(-9, 9); if (a > 0 && b > 0) b = -b;
        v = a * b; q = par(a) + " \\times " + par(b);
        walk = [[Math.abs(a) + " \\times " + Math.abs(b) + " = " + Math.abs(v), "Multiply the sizes."], [tex(v), (a < 0) !== (b < 0) ? "Different signs give a negative." : "The same signs give a positive."]];
      } else if (d === 2) {
        b = R.nz(-9, 9); var k = R.nz(-9, 9); a = b * k; v = k;
        if (Math.abs(a) < 10) { b = R.pick([2, 3, 4, 5, 6, 7]) * R.sign(); k = R.nz(3, 9) * R.sign(); a = b * k; v = k; }
        q = tex(a) + " \\div " + par(b);
        walk = [[Math.abs(a) + " \\div " + Math.abs(b) + " = " + Math.abs(v), "Divide the sizes."], [tex(v), (a < 0) !== (b < 0) ? "Different signs give a negative." : "The same signs give a positive."]];
      } else {
        a = R.nz(-9, 9); b = R.nz(-9, 9); var prod = a * b;
        var ds = divisors(Math.abs(prod)).filter(function (x) { return x <= 12; });
        if (!ds.length) { a = 6; b = -4; prod = -24; ds = [2, 3, 4, 6, 8, 12]; }
        c = R.pick(ds) * R.sign(); v = prod / c;
        q = par(a) + " \\times " + par(b) + " \\div " + par(c);
        walk = [[tex(prod) + " \\div " + par(c), par(a) + " \\times " + par(b) + " = " + tex(prod) + " first — left to right."], [tex(v), "Different signs give a negative, the same signs positive."]];
      }
      return { q: "Evaluate.<br>$" + q + "$", a: { k: "num", v: v }, walk: walk, hint: "Multiply or divide the sizes first; the signs decide the sign of the answer." };
    });

  topic("n_exp", "num", "Evaluating powers", ["n_int_mul"],
    "An exponent counts how many copies of the base to multiply. A negative sign belongs to the base only when it is inside the brackets: (−3)² is 9, but −3² is −9.",
    function (R, d) {
      var a, b, q, v, walk, fb = [];
      if (d === 1) {
        a = R.int(2, 6); b = R.int(2, a > 4 ? 3 : 4); v = Math.pow(a, b);
        q = a + "^{" + b + "}"; var cs = []; for (var i = 0; i < b; i++) cs.push(a);
        walk = [[cs.join(" \\times ") + " = " + v, a + " is multiplied by itself " + b + " times."]];
        fb = a * b !== v ? [{ v: a * b, say: "That's " + a + " × " + b + ". The exponent says how many copies of " + a + " to multiply." }] : [];
      } else if (d === 2) {
        a = R.int(2, 5); b = R.pick([2, 3, 4]);
        var inside = R.chance(0.5);
        v = inside ? Math.pow(-a, b) : -Math.pow(a, b);
        q = inside ? "(-" + a + ")^{" + b + "}" : "-" + a + "^{" + b + "}";
        walk = inside
          ? [["(-" + a + ")^{" + b + "} = " + Array(b).fill("(-" + a + ")").join(" \\cdot "), "The bracket puts the negative sign inside the base."], ["= " + v, b % 2 ? "An odd number of negatives gives a negative." : "An even number of negatives gives a positive."]]
          : [["-" + a + "^{" + b + "} = -(" + a + "^{" + b + "})", "With no bracket, only " + a + " is raised to the power; the minus is applied afterwards."], ["= -" + Math.pow(a, b), "Power first, then the sign."]];
        var alt = inside ? -Math.pow(a, b) : Math.pow(-a, b);
        fb = alt !== v ? [{ v: alt, say: inside ? "The bracket means the whole (−" + a + ") is the base." : "Without brackets the minus isn't part of the base — the power acts on " + a + " alone." }] : [];
      } else {
        var kind = R.int(0, 1);
        if (kind === 0) {
          var p = R.int(2, 3), q1 = R.int(2, 3), r = R.int(2, 4);
          v = Math.pow(2, p) * Math.pow(3, q1) - Math.pow(r, 2);
          q = "2^{" + p + "} \\cdot 3^{" + q1 + "} - " + r + "^{2}";
          walk = [[Math.pow(2, p) + " \\cdot " + Math.pow(3, q1) + " - " + r * r, "Powers first."], [Math.pow(2, p) * Math.pow(3, q1) + " - " + r * r + " = " + v, "Then multiply, then subtract."]];
        } else {
          var nn = R.int(1, 3), dd = R.int(nn + 1, 5); while (H.gcd(nn, dd) !== 1) dd++;
          var e = R.int(2, 3);
          v = Math.pow(nn, e) / Math.pow(dd, e);
          q = "\\left(\\frac{" + nn + "}{" + dd + "}\\right)^{" + e + "}";
          walk = [["\\frac{" + nn + "^{" + e + "}}{" + dd + "^{" + e + "}}", "Both the top and the bottom are raised to the power."], [fr(Math.pow(nn, e), Math.pow(dd, e)), "Already in lowest terms because " + nn + " and " + dd + " share no factor."]];
          return { q: "Evaluate. Write your answer as a fraction.<br>$" + q + "$", a: { k: "num", v: v, lowest: true }, walk: walk, hint: "A fraction to a power: raise the numerator and the denominator." };
        }
      }
      return { q: "Evaluate.<br>$" + q + "$", a: { k: "num", v: v }, walk: walk, hint: "Decide what the base is, then multiply it by itself that many times.", fb: fb };
    });

  topic("n_ord", "num", "Order of operations", ["n_exp"],
    "Brackets first, then exponents, then multiplication and division left to right, then addition and subtraction left to right. The order isn't a convention to memorise — it's what makes every expression mean exactly one thing.",
    function (R, d) {
      var a, b, c, e, q, v, walk;
      if (d === 1) {
        a = R.int(2, 9); b = R.int(2, 6); c = R.int(2, 7);
        var plus = R.chance(0.5);
        q = a + (plus ? " + " : " - ") + b + " \\times " + c;
        v = plus ? a + b * c : a - b * c;
        walk = [[a + (plus ? " + " : " - ") + b * c, b + " × " + c + " = " + b * c + " comes first."], [tex(v), "Then add or subtract."]];
      } else if (d === 2) {
        var f = R.int(0, 2);
        if (f === 0) { a = R.int(2, 8); b = R.int(2, 8); c = R.int(2, 6); e = R.int(1, 9); q = "(" + a + " + " + b + ") \\times " + c + " - " + e; v = (a + b) * c - e; walk = [[(a + b) + " \\times " + c + " - " + e, "Brackets first."], [(a + b) * c + " - " + e + " = " + v, "Multiply, then subtract."]]; }
        else if (f === 1) { a = R.int(10, 30); b = R.int(2, 6); c = R.int(2, 6); e = R.int(2, 9); q = a + " - " + b + " \\times " + c + " + " + e; v = a - b * c + e; walk = [[a + " - " + b * c + " + " + e, "Multiply first."], [(a - b * c) + " + " + e + " = " + v, "Then add and subtract left to right."]]; }
        else { b = R.int(2, 6); c = R.int(2, 9); a = b * c; e = R.int(2, 9); var g = R.int(1, 8); q = a + " \\div " + b + " + " + e + " \\times " + g; v = c + e * g; walk = [[c + " + " + e * g, a + " ÷ " + b + " = " + c + " and " + e + " × " + g + " = " + e * g + " (left to right)."], [tex(v), "Then add."]]; }
      } else {
        var h = R.int(0, 2);
        if (h === 0) { var s = R.int(2, 6), t = R.int(1, 7); var sum = s + t; var ds = divisors(sum * sum).filter(function (x) { return x <= 9; }); var dv = ds.length ? R.pick(ds) : 1; a = R.int(20, 40); q = a + " - (" + s + " + " + t + ")^{2} \\div " + dv; v = a - (sum * sum) / dv; walk = [[a + " - " + sum + "^{2} \\div " + dv, "Brackets first: " + s + " + " + t + " = " + sum + "."], [a + " - " + sum * sum + " \\div " + dv, "Then the exponent."], [a + " - " + (sum * sum) / dv + " = " + v, "Divide, then subtract."]]; }
        else if (h === 1) { a = R.int(2, 5); b = R.int(4, 9); c = R.int(1, b - 1); e = R.int(1, 9); q = a + "(" + b + " - " + c + ")^{2} - " + e; v = a * (b - c) * (b - c) - e; walk = [[a + "(" + (b - c) + ")^{2} - " + e, "Brackets first."], [a + " \\times " + (b - c) * (b - c) + " - " + e, "Exponent before multiplying."], [a * (b - c) * (b - c) + " - " + e + " = " + v, "Multiply, then subtract."]]; }
        else { a = R.int(2, 5); b = R.int(2, 4); c = R.int(2, 4); e = R.int(6, 20); q = e + " - " + a + " \\cdot " + b + "^{" + c + "} \\div " + (a); v = e - Math.pow(b, c); walk = [[e + " - " + a + " \\cdot " + Math.pow(b, c) + " \\div " + a, b + "^{" + c + "} = " + Math.pow(b, c) + " first."], [e + " - " + a * Math.pow(b, c) + " \\div " + a, "Then multiplication and division left to right: " + a + " × " + Math.pow(b, c) + " = " + a * Math.pow(b, c) + "."], [e + " - " + Math.pow(b, c) + " = " + v, "Divide, then subtract."]]; }
      }
      return { q: "Evaluate.<br>$" + q + "$", a: { k: "num", v: v }, walk: walk, hint: "Brackets, exponents, then multiply and divide left to right, then add and subtract left to right." };
    });

  topic("n_frac_simp", "num", "Simplifying fractions", ["n_int_mul"],
    "Divide the top and the bottom by the same number and the fraction keeps its value. A fraction is in lowest terms when the top and the bottom share no factor except 1.",
    function (R, d) {
      var n0, d0, g, n, dd;
      do {
        g = R.int(2, d === 1 ? 6 : 7);
        n0 = R.int(1, d === 1 ? 6 : 11); d0 = R.int(2, d === 1 ? 9 : 12);
        if (d === 1 && n0 >= d0) n0 = d0 - 1;
        if (d >= 2 && R.chance(0.35)) n0 = d0 + R.int(1, 8);
      } while (H.gcd(n0, d0) !== 1 || n0 === d0 || d0 === 1 || (H.gcd(n0, d0) === 1 && n0 % d0 === 0));
      n = n0 * g; dd = d0 * g;
      var neg = d === 3 && R.chance(0.5);
      var vv = (neg ? -1 : 1) * n0 / d0;
      var top = neg ? -n : n;
      return { q: "Write in lowest terms.<br>$" + H.frac(top, dd) + "$", a: { k: "num", v: vv, lowest: true },
        walk: [[H.frac(top, dd) + " = " + H.frac(top / g, dd / g), "Divide the top and the bottom by their greatest common factor, " + g + "."]],
        hint: "What is the largest number that divides both the top and the bottom?" };
    });

  topic("n_frac_addsub", "num", "Adding and subtracting fractions", ["n_frac_simp"],
    "Fractions can only be added when they are cut into the same size pieces. Rewrite them over a common denominator, add the tops, keep the bottom, then simplify.",
    function (R, d) {
      var a, b, c, e, L, n1, n2, sub, q, v, dn;
      var guard = 0;
      do {
        guard++;
        if (d === 1) { dn = R.int(3, 9); a = R.int(1, dn - 1); b = R.int(1, dn - 1); c = dn; e = dn; }
        else if (d === 2) { c = R.int(2, 6); e = c * R.int(2, 3); a = R.int(1, c - 1); b = R.int(1, e - 1); }
        else { c = R.int(2, 9); e = R.int(2, 9); while (e === c || H.gcd(c, e) !== 1) e = R.int(2, 9); a = R.int(1, c + 2); b = R.int(1, e + 2); }
        sub = d >= 2 ? R.chance(0.5) : false;
        L = H.lcm(c, e); n1 = a * (L / c); n2 = b * (L / e);
        v = (n1 + (sub ? -n2 : n2)) / L;
        var num = n1 + (sub ? -n2 : n2), red = L / H.gcd(num, L);
      } while ((Math.abs(num) % L === 0 || H.gcd(a, c) !== 1 || H.gcd(b, e) !== 1 || num === 0 || red === 1) && guard < 60);
      q = "\\frac{" + a + "}{" + c + "} " + (sub ? "-" : "+") + " \\frac{" + b + "}{" + e + "}";
      var walk = [];
      if (c !== e) walk.push(["\\frac{" + n1 + "}{" + L + "} " + (sub ? "-" : "+") + " \\frac{" + n2 + "}{" + L + "}", "Rewrite both over the common denominator " + L + "."]);
      walk.push([H.frac(n1 + (sub ? -n2 : n2), L), (sub ? "Subtract" : "Add") + " the tops and keep the bottom."]);
      if (H.gcd(num, L) > 1) walk.push([fr(num, L), "Simplify by dividing top and bottom by " + H.gcd(num, L) + "."]);
      return { q: "Add or subtract. Write your answer as a fraction in lowest terms.<br>$" + q + "$", a: { k: "num", v: v, lowest: true }, walk: walk,
        hint: "Find a common denominator first.",
        fb: c !== e ? [{ v: (a + (sub ? -b : b)) / (c + e), say: "You can't add the tops and add the bottoms. Fractions need a common denominator first." }] : [] };
    });

  topic("n_frac_muldiv", "num", "Multiplying and dividing fractions", ["n_frac_simp"],
    "To multiply fractions, multiply the tops and multiply the bottoms. To divide by a fraction, multiply by its reciprocal — flip it. Cancel common factors early to keep the numbers small.",
    function (R, d) {
      var a, b, c, e, div = d >= 2, neg = d === 3 && R.chance(0.6), v, q, walk;
      var guard = 0;
      do {
        a = R.int(1, 8); b = R.int(2, 9); c = R.int(1, 8); e = R.int(2, 9);
        var num = div ? a * e : a * c, den = div ? b * c : b * e;
        v = num / den;
      } while ((v === Math.round(v) || H.gcd(a, b) !== 1 || H.gcd(c, e) !== 1) && ++guard < 80);
      var sign = neg ? -1 : 1;
      var num2 = (div ? a * e : a * c), den2 = (div ? b * c : b * e);
      q = (neg ? "-" : "") + "\\frac{" + a + "}{" + b + "} " + (div ? "\\div" : "\\times") + " \\frac{" + c + "}{" + e + "}";
      walk = [];
      if (div) walk.push(["\\frac{" + a + "}{" + b + "} \\times \\frac{" + e + "}{" + c + "}", "Dividing by a fraction is multiplying by its reciprocal."]);
      walk.push([(neg ? "-" : "") + "\\frac{" + num2 + "}{" + den2 + "}", "Multiply the tops and multiply the bottoms."]);
      if (H.gcd(num2, den2) > 1) walk.push([fr(sign * num2, den2), "Simplify by " + H.gcd(num2, den2) + "."]);
      return { q: "Multiply or divide. Write your answer as a fraction in lowest terms.<br>$" + q + "$", a: { k: "num", v: sign * v, lowest: true }, walk: walk,
        hint: div ? "Flip the second fraction and multiply." : "Multiply straight across, then simplify." };
    });

  topic("n_dec", "num", "Decimal arithmetic", ["n_int_mul"],
    "Line up the decimal points to add or subtract. To multiply, ignore the points, multiply, then put back as many decimal places as the two numbers had together. To divide, shift both points until the divisor is a whole number.",
    function (R, d) {
      var q, v, walk, a, b, p;
      if (d === 1) {
        a = R.int(11, 999); b = R.int(11, 999); var sub = R.chance(0.5); if (sub && b > a) { var t = a; a = b; b = t; }
        p = 2; v = (sub ? a - b : a + b) / 100;
        q = fmtDec(a, 2) + (sub ? " - " : " + ") + fmtDec(b, 2);
        walk = [[q + " = " + fmtDec(sub ? a - b : a + b, 2), "Line up the decimal points, then " + (sub ? "subtract" : "add") + " as with whole numbers."]];
      } else if (d === 2) {
        a = R.int(2, 99); b = R.int(2, 99); var pa = R.pick([1, 2]), pb = R.pick([1, 2]);
        v = (a * b) / Math.pow(10, pa + pb);
        q = fmtDec(a, pa) + " \\times " + fmtDec(b, pb);
        walk = [[a + " \\times " + b + " = " + a * b, "Multiply as whole numbers, ignoring the points."], [fmtDec(a * b, pa + pb).replace(/0+$/, "").replace(/\.$/, ""), "Put back " + (pa + pb) + " decimal places — one for each in the original numbers."]];
      } else {
        var quot = R.pick([2, 3, 4, 5, 6, 8, 12, 15, 25, 40, 50]), dv = R.int(2, 19), pd = R.pick([1, 2]);
        var dividend = quot * dv;   // dv/10^pd is the divisor → dividend/10^pd
        v = quot;
        q = fmtDec(dividend, pd) + " \\div " + fmtDec(dv, pd);
        walk = [[dividend + " \\div " + dv, "Move both points " + pd + " place" + (pd > 1 ? "s" : "") + " right so the divisor is a whole number."], ["= " + quot, "Divide."]];
      }
      return { q: "Evaluate.<br>$" + q + "$", a: { k: "num", v: v }, walk: walk, hint: "Watch the decimal points." };
    });

  topic("n_pct", "num", "Percent of a number", ["n_dec"],
    "Percent means per hundred. To find a percent of a number, turn the percent into a decimal and multiply. To go the other way, divide the part by the whole.",
    function (R, d) {
      var q, v, walk, p, n, part, whole, unit;
      if (d === 1) { p = R.pick([10, 20, 25, 50, 75]); n = R.pick([20, 40, 60, 80, 120, 200, 360]); v = p * n / 100; q = "What is $" + p + "\\%$ of $" + n + "$?"; walk = [[p + "\\% = " + p / 100, "Write the percent as a decimal."], [p / 100 + " \\times " + n + " = " + v, "Multiply."]]; }
      else if (d === 2) { p = R.pick([5, 12, 15, 35, 45, 65, 8, 30]); n = R.pick([40, 80, 120, 160, 240, 300, 500]); v = p * n / 100; q = "What is $" + p + "\\%$ of $" + n + "$?"; walk = [[p + "\\% = " + p / 100, "Write the percent as a decimal."], [p / 100 + " \\times " + n + " = " + v, "Multiply."]]; }
      else {
        if (R.chance(0.5)) { whole = R.pick([40, 50, 60, 72, 80, 120, 150, 200]); p = R.pick([10, 15, 20, 25, 30, 40, 45, 60, 75]); part = p * whole / 100; if (part !== Math.round(part * 100) / 100) { whole = 80; p = 25; part = 20; } v = p; q = "$" + part + "$ is what percent of $" + whole + "$?"; unit = "%"; walk = [["\\frac{" + part + "}{" + whole + "} = " + p / 100, "Part ÷ whole."], [p / 100 + " = " + p + "\\%", "Multiply by 100 to make it a percent."]]; }
        else { p = R.pick([20, 25, 30, 40, 60, 75]); whole = R.pick([20, 40, 50, 80, 120, 200]); part = p * whole / 100; v = whole; q = "$" + part + "$ is $" + p + "\\%$ of what number?"; walk = [[p / 100 + " \\times n = " + part, "Write the sentence as an equation."], ["n = \\frac{" + part + "}{" + p / 100 + "} = " + whole, "Divide both sides by " + p / 100 + "."]]; }
      }
      return { q: q, a: { k: "num", v: v }, unit: unit, walk: walk, hint: "Percent means out of 100: change it to a decimal first." };
    });

  topic("n_pct_chg", "num", "Percent increase and decrease", ["n_pct"],
    "A percent change is measured against where you started. A 20% increase multiplies by 1.20; a 20% decrease multiplies by 0.80. To find the percent change, divide the change by the original amount.",
    function (R, d) {
      var q, v, walk, p, n, unit, a, b;
      if (d === 1) { p = R.pick([10, 20, 25, 30, 40]); n = R.pick([20, 40, 50, 60, 80, 100, 120]); v = n - n * p / 100; q = "A jacket costs $\\$" + n + "$. It is on sale for $" + p + "\\%$ off. What is the sale price, in dollars?"; walk = [[n + " \\times " + p / 100 + " = " + n * p / 100, "The discount."], [n + " - " + n * p / 100 + " = " + v, "Subtract the discount from the price."]]; }
      else if (d === 2) {
        p = R.pick([5, 10, 15, 20, 25, 30]); n = R.pick([40, 60, 80, 120, 200, 250]); var up = R.chance(0.5);
        v = up ? n + n * p / 100 : n - n * p / 100;
        q = "A " + (up ? "price rises" : "quantity falls") + " by $" + p + "\\%$ from $" + n + "$. What is the new " + (up ? "price" : "amount") + "?";
        walk = [[(up ? "1 + " : "1 - ") + p / 100 + " = " + (up ? 1 + p / 100 : 1 - p / 100), "A " + p + "% " + (up ? "increase" : "decrease") + " multiplies by this."], [n + " \\times " + (up ? 1 + p / 100 : 1 - p / 100) + " = " + v, "Multiply."]];
      } else {
        var pp = R.pick([10, 20, 25, 30, 40, 50, 60, 75]); a = R.pick([40, 50, 80, 120, 200, 240]); var inc = R.chance(0.5);
        b = inc ? a + a * pp / 100 : a - a * pp / 100; v = pp; unit = "%";
        q = "A value changes from $" + a + "$ to $" + b + "$. What is the percent " + (inc ? "increase" : "decrease") + "?";
        walk = [[Math.abs(b - a) + " \\div " + a + " = " + pp / 100, "Change ÷ the original amount (the one you started from)."], [pp / 100 + " = " + pp + "\\%", "Write it as a percent."]];
      }
      return { q: q, a: { k: "num", v: v }, unit: unit, walk: walk, hint: "Percent change is measured against the starting amount." };
    });

  topic("n_ratio", "num", "Ratios and unit rates", ["n_frac_muldiv"],
    "A ratio compares two amounts. A unit rate compares to one of something — miles per hour, dollars per pound. Divide to get the amount for one, and it is easy to find the amount for any number.",
    function (R, d) {
      var q, v, walk, a, b, unit;
      if (d === 1) { b = R.int(2, 9); v = R.int(3, 15); a = b * v; var sc = R.pick([["miles", "hours", "miles per hour"], ["pages", "minutes", "pages per minute"], ["dollars", "hours", "dollars per hour"]]); q = "A person covers $" + a + "$ " + sc[0] + " in $" + b + "$ " + sc[1] + ". What is the rate in " + sc[2] + "?"; unit = sc[2]; walk = [["\\frac{" + a + "}{" + b + "} = " + v, "Divide the total by how many there are — the amount for one."]]; }
      else if (d === 2) { b = R.int(3, 12); var unitCents = R.int(20, 95); a = b * unitCents; v = unitCents / 100; q = "$" + b + "$ notebooks cost $\\$" + (a / 100).toFixed(2) + "$. What is the cost of one notebook, in dollars?"; unit = "dollars"; walk = [["\\frac{" + (a / 100).toFixed(2) + "}{" + b + "} = " + v.toFixed(2), "Divide the total cost by the number of notebooks."]]; }
      else {
        var x = R.int(2, 7), y = R.int(x + 1, 9); while (H.gcd(x, y) !== 1) y++;
        var k = R.int(4, 12); var total = (x + y) * k;
        v = y * k;
        q = "The ratio of boys to girls in a club is $" + x + " : " + y + "$. There are $" + total + "$ students in all. How many are girls?";
        walk = [[x + " + " + y + " = " + (x + y) + "\\text{ parts}", "Add the parts of the ratio."], [total + " \\div " + (x + y) + " = " + k, "Each part is " + k + " students."], [y + " \\times " + k + " = " + v, "Girls are " + y + " parts."]];
      }
      return { q: q, a: { k: "num", v: v }, unit: unit, walk: walk, hint: d === 3 ? "Add the parts to find how many students one part stands for." : "Divide to get the amount for one." };
    });

  /* ============================================================ Expressions */

  topic("e_eval", "exp", "Evaluating expressions", ["n_ord"],
    "To evaluate an expression, replace each letter with its value — in brackets, so a negative stays whole — and then follow the order of operations.",
    function (R, d) {
      var q, v, walk, vals, expr;
      if (d === 1) {
        var a = R.int(2, 7), b = R.int(1, 9), x = R.int(2, 9);
        expr = H.lin(a, b); vals = { x: x }; v = a * x + b;
        walk = [[LAB.sub(expr, vals), "Replace $x$ with " + x + "."], [a * x + " + " + b + " = " + v, "Multiply first, then add."]];
        q = "Evaluate $" + expr + "$ when $x = " + x + "$.";
      } else if (d === 2) {
        var a2 = R.nz(-4, 4), b2 = R.nz(-6, 6), c2 = R.nz(-9, 9), x2 = R.int(-4, -1);
        expr = H.poly([[a2, "x^2"], [b2, "x"], [c2, ""]]); vals = { x: x2 };
        v = a2 * x2 * x2 + b2 * x2 + c2;
        walk = [[LAB.sub(expr, vals), "Replace $x$ with " + x2 + ", in brackets."], [(a2 * x2 * x2) + " " + H.sg(b2 * x2) + " " + H.sg(c2).replace(/^([+-]) /, "$1 ") + " = " + v, "Do the power first, then multiply, then add."]];
        q = "Evaluate $" + expr + "$ when $x = " + x2 + "$.";
      } else {
        var p = R.nz(-4, 5), r = R.nz(-4, 6), s = R.int(2, 4);
        var A = R.nz(-3, 5), B = R.nz(-3, 5);
        expr = "2a - 3b + ab"; vals = { a: A, b: B };
        v = 2 * A - 3 * B + A * B;
        walk = [[LAB.sub(expr, vals), "Replace $a$ with " + A + " and $b$ with " + B + ", in brackets."], [(2 * A) + " " + H.sg(-3 * B) + " " + H.sg(A * B) + " = " + v, "Multiply, then add and subtract left to right."]];
        q = "Evaluate $" + expr + "$ when $a = " + A + "$ and $b = " + B + "$.";
      }
      return { q: q, a: { k: "num", v: v }, walk: walk, hint: "Put each value in brackets where the letter was, then follow the order of operations." };
    });

  topic("e_words", "exp", "Writing expressions from words", ["e_eval"],
    "Words like 'less than', 'more than', 'times', 'twice' and 'the sum of' each say what to do. Watch the order: '5 less than a number' is n − 5, not 5 − n.",
    function (R, d) {
      var v = R.pick(["x", "n", "t", "w"]), a = R.int(2, 9), b = R.int(2, 9);
      while (b === a) b = R.int(2, 9);
      var sets = {
        1: [
          { t: "a number increased by " + a, r: v + " + " + a, e: "“Increased by” means add: the number, plus " + a + ".", w: [[a + " - " + v, "That subtracts the number from " + a + "."], [a + v, "That multiplies."], [v + " - " + a, "That subtracts — 'increased' means add."]] },
          { t: a + " more than a number", r: v + " + " + a, e: "“More than” means add " + a + " to the number.", w: [[a + v, "'More than' means add, not multiply."], [v + " - " + a, "'More than' adds."], [a + " - " + v, "'More than' adds."]] },
          { t: "the product of " + a + " and a number", r: a + v, e: "“Product” means multiply: " + a + " times the number, written " + a + v + ".", w: [[a + " + " + v, "'Product' means multiply."], [v + " - " + a, "'Product' means multiply."], [v + "^{" + a + "}", "That's a power, not a product."]] }
        ],
        2: [
          { t: a + " less than " + b + " times a number", r: b + v + " - " + a, e: "“" + b + " times a number” is " + b + v + ". “" + a + " less than” that takes " + a + " away from it — so the " + a + " goes last, after the minus.", w: [[a + " - " + b + v, "'Less than' reverses the order: subtract " + a + " from the rest."], [b + "(" + v + " - " + a + ")", "Only " + v + " was reduced here, not " + b + " times it."], [b + v + " + " + a, "'Less than' subtracts."]] },
          { t: "twice a number, decreased by " + a, r: "2" + v + " - " + a, e: "“Twice a number” is 2" + v + ". Then “decreased by " + a + "” subtracts " + a + " from that.", w: [["2(" + v + " - " + a + ")", "The decrease is applied after doubling, not before."], [a + " - 2" + v, "'Decreased by' subtracts " + a + " from the doubled number."], [v + "^{2} - " + a, "'Twice' means times 2, not squared."]] },
          { t: "the sum of a number and " + a + ", divided by " + b, r: "\\frac{" + v + " + " + a + "}{" + b + "}", e: "The sum is " + v + " + " + a + ", and the whole sum is divided by " + b + " — so the sum sits on top of the fraction.", w: [[v + " + \\frac{" + a + "}{" + b + "}", "The whole sum is divided by " + b + "."], ["\\frac{" + b + "}{" + v + " + " + a + "}", "That divides " + b + " by the sum."], [v + " + " + a + " - " + b, "'Divided by' isn't subtraction."]] }
        ],
        3: [
          { t: "the product of " + a + " and the sum of a number and " + b, r: a + "(" + v + " + " + b + ")", e: "The sum is " + v + " + " + b + ". The product multiplies that whole sum by " + a + ", so the sum needs brackets.", w: [[a + v + " + " + b, "Only " + v + " is multiplied here — the sum needs brackets."], [a + " + " + v + " + " + b, "'Product' means multiply."], [a + "(" + v + " - " + b + ")", "'Sum' means add."]] },
          { t: a + " less than the product of " + b + " and a number", r: b + v + " - " + a, e: "The product is " + b + v + ". “" + a + " less than” it takes " + a + " away, so it is " + b + v + " − " + a + ".", w: [[a + " - " + b + v, "'Less than' reverses the order."], [b + "(" + v + " - " + a + ")", "The " + a + " comes off the product."], [a + "(" + b + " - " + v + ")", "This mixes up the pieces."]] },
          { t: "twice the difference of a number and " + a, r: "2(" + v + " - " + a + ")", e: "The difference of a number and " + a + " is " + v + " − " + a + " (in that order). Twice that whole difference needs brackets.", w: [["2" + v + " - " + a, "The difference is doubled, so it needs brackets."], ["2(" + a + " - " + v + ")", "'Difference of a number and " + a + "' starts with the number."], ["2" + v + " - " + 2 * a, "That doubles only the number, not the " + a + " being taken away."]] }
        ]
      }[d];
      var it = R.pick(sets);
      var ch = H.choice(R, "$" + it.r + "$", it.w.map(function (w) { return ["$" + w[0] + "$", w[1]]; }));
      return { q: "Which expression means “" + it.t + "”?<br>(Let $" + v + "$ be the number.)", a: ch,
        walk: [[it.r, it.e]],
        hint: "Underline the operation word in each phrase, and watch phrases like 'less than' that reverse the order." };
    });

  topic("e_like", "exp", "Combining like terms", ["e_eval"],
    "Like terms have the same letters with the same powers. You can add or subtract their coefficients, but never terms with different letters: 3x + 2y stays as it is.",
    function (R, d) {
      var terms, ans, q, walk, c;
      if (d === 1) {
        var a = R.int(2, 9), b = R.int(2, 9), k = R.nz(-9, 9);
        var s = R.chance(0.5) ? 1 : -1;
        c = a + s * b;
        q = a + "x " + (s < 0 ? "-" : "+") + " " + b + "x " + H.sg(k);
        ans = H.typed([[c, "x"], [k, ""]]);
        walk = [[LAB.poly([[c, "x"], [k, ""]]), a + " " + (s < 0 ? "−" : "+") + " " + b + " = " + c + ", so the $x$ terms combine; the constant stays."]];
      } else if (d === 2) {
        var a2 = R.nz(-8, 9), b2 = R.nz(-9, 9), c2 = R.nz(-8, 9), e2 = R.nz(-9, 12);
        q = H.poly([[a2, "x"], [b2, ""], [c2, "x"], [e2, ""]]);
        ans = H.typed([[a2 + c2, "x"], [b2 + e2, ""]]);
        walk = [[H.poly([[a2, "x"], [c2, "x"]]) + " " + H.sg(b2) + " " + H.sg(e2).replace(/^([+-]) /, "$1 "), "Group the $x$ terms and the numbers."], [H.poly([[a2 + c2, "x"], [b2 + e2, ""]]), "Combine each group."]];
      } else {
        var a3 = R.nz(-6, 7), b3 = R.nz(-6, 7), c3 = R.nz(-6, 7), d3 = R.nz(-6, 7), e3 = R.nz(-6, 8);
        q = H.poly([[a3, "x^2"], [b3, "x"], [c3, "x^2"], [d3, "x"], [e3, ""]]);
        ans = H.typed([[a3 + c3, "x^2"], [b3 + d3, "x"], [e3, ""]]);
        walk = [[H.poly([[a3, "x^2"], [c3, "x^2"], [b3, "x"], [d3, "x"], [e3, ""]]), "Group terms with the same power of $x$."], [H.poly([[a3 + c3, "x^2"], [b3 + d3, "x"], [e3, ""]]), "Combine each group. $x^2$ and $x$ are not like terms."]];
      }
      return { q: "Simplify by combining like terms.<br>$" + q + "$", a: { k: "expr", v: ans, form: "simp" }, walk: walk, hint: "Only terms with the same letters and powers combine." };
    });

  topic("e_dist", "exp", "The distributive property", ["e_like"],
    "A number outside a bracket multiplies every term inside it: a(b + c) = ab + ac. Take care with negatives — a minus in front changes the sign of every term.",
    function (R, d) {
      var m, b, c, q, ans, walk, e;
      if (d === 1) { m = R.int(2, 9); b = R.int(2, 7); c = R.int(1, 9); q = m + "(" + b + "x + " + c + ")"; ans = H.typed([[m * b, "x"], [m * c, ""]]); walk = [[m + " \\cdot " + b + "x + " + m + " \\cdot " + c, "Multiply each term inside by " + m + "."], [LAB.poly([[m * b, "x"], [m * c, ""]]), "Multiply."]]; }
      else if (d === 2) { m = R.nz(-9, -2); b = R.nz(-7, 7); c = R.nz(-9, 9); q = m + "(" + LAB.poly([[b, "x"], [c, ""]]) + ")"; ans = H.typed([[m * b, "x"], [m * c, ""]]); walk = [["(" + m + ")(" + tex(b) + "x) + (" + m + ")(" + tex(c) + ")", "Multiply each term inside by " + m + "."], [LAB.poly([[m * b, "x"], [m * c, ""]]), "Watch the signs: negative × positive is negative, negative × negative is positive."]]; }
      else { m = R.nz(-6, 6); b = R.nz(-6, 6); c = R.nz(-6, 6); e = R.nz(-9, 9); q = m + "(" + LAB.poly([[b, "x"], [c, "y"], [e, ""]]) + ")"; ans = H.typed([[m * b, "x"], [m * c, "y"], [m * e, ""]]); walk = [["(" + m + ")(" + H.term(b, "x") + ") + (" + m + ")(" + H.term(c, "y") + ") + (" + m + ")(" + tex(e) + ")", "Multiply every term inside by " + m + "."], [LAB.poly([[m * b, "x"], [m * c, "y"], [m * e, ""]]), "Multiply each."]]; }
      return { q: "Expand.<br>$" + q + "$", a: { k: "expr", v: ans, form: "simp" }, walk: walk, hint: "Multiply the number outside by every term inside the brackets." };
    });

  topic("e_dist_comb", "exp", "Expanding and simplifying", ["e_dist"],
    "Expand each bracket first, then combine like terms. A minus sign in front of a bracket is a −1 multiplying everything inside.",
    function (R, d) {
      var a, b, c, e, f, g, q, ans, walk;
      if (d === 1) { a = R.int(2, 6); b = R.int(1, 9); c = R.int(1, 9); q = a + "(x + " + b + ") + " + c; ans = H.typed([[a, "x"], [a * b + c, ""]]); walk = [[a + "x + " + a * b + " + " + c, "Expand the bracket."], [LAB.poly([[a, "x"], [a * b + c, ""]]), "Combine the numbers."]]; }
      else if (d === 2) { a = R.int(2, 6); b = R.nz(-8, 8); c = R.int(2, 6); e = R.nz(-8, 8); q = a + "(x " + H.sg(b) + ") - " + c + "(x " + H.sg(e) + ")"; ans = H.typed([[a - c, "x"], [a * b - c * e, ""]]); walk = [[LAB.poly([[a, "x"], [a * b, ""]]) + " " + LAB.poly([[-c, "x"], [-c * e, ""]]).replace(/^(-?)/, function (m) { return m ? "- " : "+ "; }).replace(/^([+-]) -/, "$1 -"), "Expand both brackets — the minus multiplies the second bracket."], [LAB.poly([[a - c, "x"], [a * b - c * e, ""]]), "Combine like terms."]]; }
      else { a = R.int(2, 5); b = R.nz(-6, 6); c = R.nz(-4, 4); e = R.int(2, 5); f = R.nz(-7, 7); g = R.nz(-9, 9); q = a + "(x " + H.sg(b) + ") " + (c < 0 ? "-" : "+") + " " + Math.abs(c) + "x - " + e + "(x " + H.sg(f) + ") + " + (g < 0 ? "(" + g + ")" : g); var xc = a + c - e, kc = a * b - e * f + g; ans = H.typed([[xc, "x"], [kc, ""]]); walk = [[LAB.poly([[a, "x"], [a * b, ""], [c, "x"], [-e, "x"], [-e * f, ""], [g, ""]]), "Expand both brackets."], [LAB.poly([[xc, "x"], [kc, ""]]), "Combine the $x$ terms and the numbers."]]; }
      return { q: "Expand and simplify.<br>$" + q + "$", a: { k: "expr", v: ans, form: "simp" }, walk: walk, hint: "Expand each bracket (watch the signs), then combine like terms." };
    });
})();
