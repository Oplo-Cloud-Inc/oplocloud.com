/* ==========================================================================
   Algebra Pathway — Exponents and polynomials, Factoring and quadratics,
   and Radicals.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, P = LAB && LAB.PATH;
  if (!P || !P.h) return;
  var H = P.h, tex = H.tex, par = H.par, fr = H.fr, poly = LAB.poly;
  var PART = (P.parts = P.parts || {});
  var T = (PART.alg = PART.alg || []);
  function topic(id, cat, name, pre, idea, gen) { T.push({ id: id, cat: cat, name: name, pre: pre, idea: idea, gen: gen }); }
  function typed(terms) { return poly(terms).replace(/\s+/g, "").replace(/\^\{(\d+)\}/g, "^$1"); }
  /* c x^a y^b as [tex, typed] */
  function mono(c, xe, ye) {
    if (!xe && !ye) return [String(c), String(c)];
    var cs = c === 1 ? "" : c === -1 ? "-" : String(c);
    function v(l, e) { return e ? l + (e === 1 ? "" : "^{" + e + "}") : ""; }
    function vt(l, e) { return e ? l + (e === 1 ? "" : "^" + e) : ""; }
    return [cs + v("x", xe) + v("y", ye), cs + vt("x", xe) + vt("y", ye)];
  }
  function sq(v) { return v * v; }
  function ex(t) { return t.replace(/\^\{(\d+)\}/g, "^$1"); }

  /* ================================================= Exponents and polynomials */

  topic("p_exp", "pol", "Product and power rules", ["n_exp"],
    "When you multiply powers with the same base, add the exponents: x³ · x⁵ = x⁸. When you raise a power to a power, multiply the exponents: (x³)² = x⁶. A power outside a bracket goes onto every factor inside.",
    function (R, d) {
      var q, ans, walk;
      if (d === 1) {
        var a = R.int(2, 9), b = R.int(2, 9);
        if (R.chance(0.5)) { q = "x^{" + a + "} \\cdot x^{" + b + "}"; ans = "x^" + (a + b); walk = [["x^{" + (a + b) + "}", "Same base, so add the exponents: " + a + " + " + b + " = " + (a + b) + "."]]; }
        else { q = "\\left(x^{" + a + "}\\right)^{" + b + "}"; ans = "x^" + (a * b); walk = [["x^{" + a * b + "}", "A power of a power: multiply the exponents, " + a + " × " + b + " = " + a * b + "."]]; }
      } else if (d === 2) {
        if (R.chance(0.5)) { var c = R.int(2, 4), e = R.int(2, 4), k = R.int(2, 3); q = "(" + c + "x^{" + e + "})^{" + k + "}"; ans = mono(Math.pow(c, k), e * k, 0)[1]; walk = [[c + "^{" + k + "}\\, x^{" + e + " \\cdot " + k + "} = " + mono(Math.pow(c, k), e * k, 0)[0], "The power goes on every factor: the number " + c + " and the power of $x$."]]; }
        else { var c1 = R.nz(-4, 4), c2 = R.nz(-4, 4), x1 = R.int(1, 3), y1 = R.int(0, 2), x2 = R.int(1, 3), y2 = R.int(1, 3); q = "(" + mono(c1, x1, y1)[0] + ")(" + mono(c2, x2, y2)[0] + ")"; ans = mono(c1 * c2, x1 + x2, y1 + y2)[1]; walk = [[c1 + " \\cdot " + par(c2) + " = " + c1 * c2 + ",\\quad x: " + x1 + " + " + x2 + " = " + (x1 + x2) + (y1 + y2 ? ",\\quad y: " + y1 + " + " + y2 + " = " + (y1 + y2) : ""), "Multiply the numbers, and add the exponents of each letter."], [mono(c1 * c2, x1 + x2, y1 + y2)[0], "Put it together."]]; }
      } else {
        var c3 = R.int(2, 3) * R.sign(), e3 = R.int(2, 3), k3 = R.int(2, 3), f = R.int(1, 4);
        q = "(" + c3 + "x^{" + e3 + "})^{" + k3 + "} \\cdot x" + (f === 1 ? "" : "^{" + f + "}"); var cc = Math.pow(c3, k3);
        ans = mono(cc, e3 * k3 + f, 0)[1]; walk = [["(" + c3 + ")^{" + k3 + "}\\, x^{" + e3 * k3 + "} \\cdot x" + (f === 1 ? "" : "^{" + f + "}"), "Power of a product first: the power goes on the number and on the power of $x$."], [mono(cc, e3 * k3 + f, 0)[0], "Multiply the numbers; same base so add the exponents: " + e3 * k3 + " + " + f + " = " + (e3 * k3 + f) + "."]];
      }
      return { q: "Simplify.<br>$" + q + "$", a: { k: "expr", v: ans, form: "mono" }, walk: walk, hint: "Same base multiplied: add exponents. Power of a power: multiply exponents." };
    });

  topic("p_quot", "pol", "Quotients, zero and negative exponents", ["p_exp"],
    "When you divide powers of the same base, subtract the exponents: x⁷ ÷ x³ = x⁴. Anything (not zero) to the power 0 is 1. A negative exponent means 'one over': x⁻² = 1/x².",
    function (R, d) {
      var q, ans, walk, a, b, form = "mono", v, isNum = false;
      if (d === 1) { a = R.int(5, 12); b = R.int(2, a - 2); q = "\\frac{x^{" + a + "}}{x^{" + b + "}}"; ans = "x^" + (a - b); walk = [["x^{" + (a - b) + "}", "Same base, so subtract the exponents: " + a + " − " + b + " = " + (a - b) + "."]]; }
      else if (d === 2) {
        if (R.chance(0.5)) { var base = R.int(2, 5), e = R.int(2, 4); v = 1 / Math.pow(base, e); q = base + "^{-" + e + "}"; isNum = true; walk = [["\\frac{1}{" + base + "^{" + e + "}} = \\frac{1}{" + Math.pow(base, e) + "}", "A negative exponent means the reciprocal: flip it and make the exponent positive."]]; return { q: "Evaluate. Write your answer as a fraction.<br>$" + q + "$", a: { k: "num", v: v, lowest: true }, walk: walk, hint: "A negative exponent means one over the power." }; }
        else { var n = R.int(2, 9); q = "(" + n + "x)^{0}"; v = 1; walk = [["1", "Any nonzero quantity to the power 0 is 1."]]; return { q: "Evaluate, assuming $x \\ne 0$.<br>$" + q + "$", a: { k: "num", v: 1 }, walk: walk, hint: "What is any nonzero number to the power zero?" }; }
      } else {
        if (R.chance(0.6)) {
          var c = R.int(2, 6), k = R.int(2, 5), x1 = R.int(3, 7), x2 = R.int(1, x1 - 1), y1 = R.int(2, 4), y2 = R.int(1, y1 - 1);
          var top = c * k; q = "\\frac{" + mono(top, x1, y1)[0] + "}{" + mono(k, x2, y2)[0] + "}";
          ans = mono(c, x1 - x2, y1 - y2)[1]; walk = [[mono(c, x1 - x2, y1 - y2)[0], "Divide the numbers (" + top + " ÷ " + k + " = " + c + ") and subtract the exponents of each letter: x: " + x1 + " − " + x2 + " = " + (x1 - x2) + ", y: " + y1 + " − " + y2 + " = " + (y1 - y2) + "."]];
        } else {
          var cc = R.int(2, 7), ee = R.int(2, 5); q = cc + "x^{-" + ee + "}"; ans = cc + "/x^" + ee; form = "posexp";
          walk = [["\\frac{" + cc + "}{x^{" + ee + "}}", "Only $x$ has the negative exponent, so only $x^{" + ee + "}$ moves to the bottom. The " + cc + " stays on top."]];
          return { q: "Rewrite with positive exponents only.<br>$" + q + "$", a: { k: "expr", v: ans, form: form }, walk: walk, hint: "A negative exponent moves that factor across the fraction bar." };
        }
      }
      return { q: "Simplify.<br>$" + q + "$", a: { k: "expr", v: ans, form: form }, walk: walk, hint: "Divide the numbers; subtract the exponents of each letter." };
    });

  topic("p_sci", "pol", "Scientific notation", ["p_exp", "n_dec"],
    "Scientific notation writes a number as a value from 1 up to (but not including) 10, times a power of 10. Each step in the exponent moves the decimal point one place.",
    function (R, d) {
      var q, a, walk, m, e;
      if (d === 1) {
        m = (R.int(11, 99) / 10); e = R.int(3, 7); var big = R.chance(0.7);
        var digits = big ? Math.round(m * Math.pow(10, e)) : m * Math.pow(10, -e);
        var num = big ? String(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : (m / Math.pow(10, e)).toFixed(e + 1).replace(/0+$/, "");
        var sign = big ? e : -e;
        var right = m + " \\times 10^{" + sign + "}";
        a = H.choice(R, "$" + right + "$", [["$" + m + " \\times 10^{" + (big ? e + 1 : -e - 1) + "}$", "The exponent counts how many places the point moved. Count them again."], ["$" + m + " \\times 10^{" + (big ? -e : e) + "}$", big ? "A large number has a positive exponent." : "A number smaller than 1 has a negative exponent."], ["$" + (m * 10) + " \\times 10^{" + (big ? e - 1 : -e + 1) + "}$", "That has the right value, but it isn't scientific notation: the first factor must be between 1 and 10."]]);
        q = "Write $" + num + "$ in scientific notation."; walk = [[right, "Move the decimal point to just after the first digit (that gives " + m + "), and count the places moved: " + e + (big ? " to the left, so a positive exponent." : " to the right, so a negative exponent.")]];
      } else if (d === 2) {
        m = R.int(11, 99) / 10; e = R.int(2, 5); var neg = R.chance(0.5);
        var v = neg ? m * Math.pow(10, -e) : m * Math.pow(10, e); v = Math.round(v * 1e9) / 1e9;
        q = "Write $" + m + " \\times 10^{" + (neg ? -e : e) + "}$ as an ordinary number."; a = { k: "num", v: v };
        walk = [[String(v), "The exponent is " + (neg ? -e : e) + ", so move the decimal point " + e + " places " + (neg ? "left (a small number)." : "right (a large number).")]];
        return { q: q, a: a, walk: walk, hint: "A positive exponent moves the point right; a negative exponent moves it left.", ver: function () { return true; } };
      } else {
        var m1 = R.int(2, 6), m2 = R.int(3, 6), e1 = R.int(2, 6), e2 = R.int(2, 6);
        var prod = m1 * m2, pe = e1 + e2, fin, fe;
        if (prod >= 10) { fin = prod / 10; fe = pe + 1; } else { fin = prod; fe = pe; }
        var rightS = fin + " \\times 10^{" + fe + "}";
        q = "Multiply and write your answer in scientific notation.<br>$(" + m1 + " \\times 10^{" + e1 + "})(" + m2 + " \\times 10^{" + e2 + "})$";
        a = H.choice(R, "$" + rightS + "$", [["$" + prod + " \\times 10^{" + pe + "}$", prod >= 10 ? "That is the right value, but " + prod + " isn't between 1 and 10." : "You need to add the exponents, not multiply the powers of 10 differently."], ["$" + fin + " \\times 10^{" + (e1 * e2) + "}$", "Add the exponents when multiplying powers of 10; don't multiply them."], ["$" + fin + " \\times 10^{" + (fe + 1) + "}$", "Check the count when adjusting."], ["$" + fin + " \\times 10^{" + (fe - 1) + "}$", "Check the exponent: add them, then adjust only if the first number is 10 or more."]], { max: 4 });
        walk = [[m1 + " \\cdot " + m2 + " = " + prod + ",\\quad 10^{" + e1 + "} \\cdot 10^{" + e2 + "} = 10^{" + pe + "}", "Multiply the numbers; add the exponents."], [rightS, prod >= 10 ? prod + " is 10 or more, so write it as " + fin + " × 10 and add 1 to the exponent." : "Already between 1 and 10."]];
      }
      return { q: q, a: a, walk: walk, hint: "The first number must be at least 1 and less than 10." };
    });

  topic("p_deg", "pol", "Degree and types of polynomials", ["e_like"],
    "The degree of a term is the sum of the exponents of its letters. The degree of a polynomial is its highest term degree. One term is a monomial, two a binomial, three a trinomial.",
    function (R, d) {
      var q, a, walk, terms;
      if (d === 1) {
        var n = R.int(2, 4), cs = [R.nz(-6, 7), R.nz(-6, 7), R.nz(-6, 7), R.nz(-6, 7)];
        var exps = R.shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3).sort(function (p, q2) { return q2 - p; });
        var e0 = exps[0]; if (e0 < 2) e0 = 3;
        terms = [[cs[0], e0 === 1 ? "x" : "x^{" + e0 + "}"], [cs[1], exps[1] > e0 - 1 ? "x" : (exps[1] === 1 ? "x" : "x^{" + exps[1] + "}")], [cs[2], ""]];
        if (terms[1][1] === terms[0][1]) terms[1][1] = "x";
        q = "What is the degree of $" + poly(terms) + "$?";
        return { q: q, a: { k: "num", v: e0 }, walk: [["\\text{degree} = " + e0, "The highest power of $x$ is " + e0 + "."]], hint: "Find the largest exponent." };
      } else if (d === 2) {
        var kind = R.pick([1, 2, 3, 4]);
        var lists = { 1: [[R.int(2, 9), "x^{" + R.int(2, 4) + "}"]], 2: [[R.nz(-5, 6), "x^{2}"], [R.nz(-6, 7), ""]], 3: [[R.nz(-4, 5), "x^{2}"], [R.nz(-5, 6), "x"], [R.nz(-6, 7), ""]], 4: [[R.nz(-3, 4), "x^{3}"], [R.nz(-3, 4), "x^{2}"], [R.nz(-4, 5), "x"], [R.nz(-6, 7), ""]] };
        var nm = { 1: "Monomial", 2: "Binomial", 3: "Trinomial", 4: "Polynomial with four terms" };
        q = "What kind of polynomial is $" + poly(lists[kind]) + "$?";
        a = H.choice(R, nm[kind], [1, 2, 3, 4].filter(function (k) { return k !== kind; }).map(function (k) { return [nm[k], "Count the terms: there are " + kind + ", not " + k + "."]; }), { keep: true });
        return { q: q, a: a, walk: [["\\text{" + kind + (kind === 1 ? " term" : " terms") + "}", "Terms are separated by + or −. That makes it a " + nm[kind].toLowerCase() + "."]], hint: "Count the terms." };
      } else {
        var a1 = R.int(1, 3), b1 = R.int(1, 3), a2 = R.int(1, 3), b2 = R.int(1, 3);
        while (a1 + b1 === a2 + b2) b2++;
        var deg = Math.max(a1 + b1, a2 + b2);
        q = "What is the degree of $" + poly([[R.nz(2, 6), "x^{" + a1 + "}y^{" + b1 + "}"], [R.nz(-5, 6), "x^{" + a2 + "}y^{" + b2 + "}"]]) + "$?";
        return { q: q, a: { k: "num", v: deg }, walk: [["\\text{" + (a1 + b1) + "},\\ " + (a2 + b2), "The degree of a term is the sum of its exponents: " + a1 + " + " + b1 + " = " + (a1 + b1) + " and " + a2 + " + " + b2 + " = " + (a2 + b2) + ". The larger is the degree of the polynomial: " + deg + "."]], hint: "Add the exponents within each term, then take the largest." };
      }
    });

  topic("p_add", "pol", "Adding and subtracting polynomials", ["e_like"],
    "Adding polynomials means combining like terms. To subtract, change the sign of every term in the second polynomial, then combine.",
    function (R, d) {
      var A, B, sub, q, ans, walk, degs;
      if (d === 1) { A = [[R.nz(-6, 7), "x^{2}"], [R.nz(-6, 7), "x"], [R.nz(-8, 9), ""]]; B = [[R.nz(-6, 7), "x^{2}"], [R.nz(-6, 7), "x"], [R.nz(-8, 9), ""]]; sub = false; }
      else if (d === 2) { A = [[R.nz(-6, 7), "x^{2}"], [R.nz(-6, 7), "x"], [R.nz(-8, 9), ""]]; B = [[R.nz(-6, 7), "x^{2}"], [R.nz(-6, 7), "x"], [R.nz(-8, 9), ""]]; sub = true; }
      else { A = [[R.nz(-5, 6), "x^{3}"], [R.nz(-6, 7), "x^{2}"], [R.nz(-6, 7), "x"], [R.nz(-8, 9), ""]]; B = [[R.nz(-5, 6), "x^{3}"], [R.nz(-6, 7), "x^{2}"], [R.nz(-6, 7), "x"], [R.nz(-8, 9), ""]]; sub = true; }
      var res = A.map(function (t, i) { return [t[0] + (sub ? -1 : 1) * B[i][0], t[1]]; });
      q = "(" + poly(A) + ") " + (sub ? "-" : "+") + " (" + poly(B) + ")";
      walk = [];
      if (sub) walk.push([poly(A) + " " + poly(B.map(function (t) { return [-t[0], t[1]]; }), { keepZero: false }).replace(/^(-?)/, function (m) { return m ? "- " : "+ "; }).replace(/^([+-]) -/, "$1 -"), "Subtract means change the sign of every term in the second bracket."]);
      walk.push([poly(res), "Combine the like terms."]);
      ans = typed(res);
      return { q: (sub ? "Subtract" : "Add") + " and simplify.<br>$" + q + "$", a: { k: "expr", v: ans, form: "simp" }, walk: walk, hint: sub ? "Change every sign in the second polynomial, then combine like terms." : "Combine like terms." };
    });

  topic("p_mul_mono", "pol", "Multiplying a polynomial by a monomial", ["e_dist", "p_exp"],
    "Multiply the monomial by each term inside the bracket: multiply the numbers and add the exponents of matching letters.",
    function (R, d) {
      var q, ans, walk, c, a, b, e;
      if (d === 1) { c = R.int(2, 6); a = R.int(2, 6); b = R.nz(-8, 9); q = c + "x(" + poly([[a, "x"], [b, ""]]) + ")"; ans = typed([[c * a, "x^{2}"], [c * b, "x"]]); walk = [["(" + c + "x)(" + a + "x) + (" + c + "x)(" + tex(b) + ")", "Multiply each term inside by " + c + "x."], [poly([[c * a, "x^{2}"], [c * b, "x"]]), "Multiply the numbers; $x \\cdot x = x^{2}$."]]; }
      else if (d === 2) { c = R.nz(-5, -2); a = R.nz(-6, 7); b = R.nz(-8, 9); q = c + "x^{2}(" + poly([[a, "x"], [b, ""]]) + ")"; ans = typed([[c * a, "x^{3}"], [c * b, "x^{2}"]]); walk = [["(" + c + "x^{2})(" + tex(a) + "x) + (" + c + "x^{2})(" + tex(b) + ")", "Multiply each term inside by " + c + "x²."], [poly([[c * a, "x^{3}"], [c * b, "x^{2}"]]), "Multiply the numbers; add the exponents of $x$."]]; }
      else { c = R.int(2, 5); a = R.nz(-4, 5); b = R.nz(-4, 5); q = c + "x^{2}y(" + poly([[a, "xy"], [b, "y^{2}"]]) + ")"; ans = typed([[c * a, "x^{3}y^{2}"], [c * b, "x^{2}y^{3}"]]); walk = [["(" + c + "x^{2}y)(" + tex(a) + "xy) + (" + c + "x^{2}y)(" + tex(b) + "y^{2})", "Multiply each term inside by " + c + "x²y."], [poly([[c * a, "x^{3}y^{2}"], [c * b, "x^{2}y^{3}"]]), "Multiply the numbers; add the exponents of each letter."]]; }
      return { q: "Multiply.<br>$" + q + "$", a: { k: "expr", v: ans, form: "simp" }, walk: walk, hint: "Multiply the monomial by every term in the bracket." };
    });

  topic("p_mul_bin", "pol", "Multiplying binomials", ["p_mul_mono"],
    "Multiply every term in the first bracket by every term in the second — first, outer, inner, last — then combine the two middle terms.",
    function (R, d) {
      var a, b, c, e, q, walk, ans;
      if (d === 1) { b = R.int(1, 9); e = R.int(1, 9); a = 1; c = 1; }
      else if (d === 2) { a = R.int(2, 4); c = 1; b = R.nz(-8, 8); e = R.nz(-8, 8); if (R.chance(0.5)) { var t = a; a = c; c = t; var t2 = b; b = e; e = t2; } }
      else { a = R.int(2, 5); c = R.int(2, 5); b = R.nz(-8, 8); e = R.nz(-8, 8); }
      q = "(" + poly([[a, "x"], [b, ""]]) + ")(" + poly([[c, "x"], [e, ""]]) + ")";
      var A = a * c, B = a * e + b * c, C = b * e;
      walk = [[poly([[a * c, "x^{2}"], [a * e, "x"], [b * c, "x"], [b * e, ""]]), "First: " + poly([[a, "x"]]) + " · " + poly([[c, "x"]]) + " = " + poly([[a * c, "x^{2}"]]) + ". Outer: " + tex(a * e) + "x. Inner: " + tex(b * c) + "x. Last: " + tex(b * e) + "."], [poly([[A, "x^{2}"], [B, "x"], [C, ""]]), "Combine the two middle terms."]];
      ans = typed([[A, "x^{2}"], [B, "x"], [C, ""]]);
      return { q: "Multiply and simplify.<br>$" + q + "$", a: { k: "expr", v: ans, form: "simp" }, walk: walk, hint: "First, outer, inner, last — then combine like terms." };
    });

  topic("p_special", "pol", "Special products", ["p_mul_bin"],
    "Two patterns turn up so often that they are worth knowing: (a + b)² = a² + 2ab + b² and (a + b)(a − b) = a² − b². The middle term of a squared binomial is twice the product of the two terms.",
    function (R, d) {
      var p, qq, kind, q, ans, walk, sign;
      if (d === 1) { p = 1; qq = R.int(2, 9); kind = "sq"; }
      else if (d === 2) { p = 1; qq = R.int(2, 10); kind = R.pick(["sq", "dsq"]); }
      else { p = R.int(2, 5); qq = R.int(1, 7); kind = R.pick(["sq", "dsq"]); }
      sign = R.chance(0.5) ? 1 : -1;
      if (kind === "sq") {
        q = "(" + poly([[p, "x"], [sign * qq, ""]]) + ")^{2}";
        ans = typed([[p * p, "x^{2}"], [2 * p * qq * sign, "x"], [qq * qq, ""]]);
        walk = [["(a " + (sign > 0 ? "+" : "-") + " b)^{2} = a^{2} " + (sign > 0 ? "+" : "-") + " 2ab + b^{2}", "The pattern for a squared binomial, with $a$ = " + (p === 1 ? "x" : p + "x") + " and $b$ = " + qq + "."], [poly([[p * p, "x^{2}"], [2 * p * qq * sign, "x"], [qq * qq, ""]]), "Square the first, twice the product, square the last. Note the last term is always positive."]];
      } else {
        q = "(" + poly([[p, "x"], [qq, ""]]) + ")(" + poly([[p, "x"], [-qq, ""]]) + ")";
        ans = typed([[p * p, "x^{2}"], [-qq * qq, ""]]);
        walk = [["(a + b)(a - b) = a^{2} - b^{2}", "The difference-of-squares pattern, with $a$ = " + (p === 1 ? "x" : p + "x") + " and $b$ = " + qq + "."], [poly([[p * p, "x^{2}"], [-qq * qq, ""]]), "The middle terms cancel."]];
      }
      return { q: "Expand.<br>$" + q + "$", a: { k: "expr", v: ans, form: "simp" }, walk: walk, hint: "Look for a pattern: a squared binomial, or a sum times a difference.", fb: [] };
    });

  /* ====================================================== Factoring and quadratics */

  topic("f_gcf", "fac", "Factoring out the GCF", ["e_dist"],
    "Look for the biggest number and the highest power of x that divide every term. Write them outside a bracket, and divide each term by them to fill the bracket.",
    function (R, d) {
      var g, a, b, c, q, ans, walk;
      var tries = 0;
      do { a = R.int(1, 6); b = d === 1 ? R.int(1, 8) : R.nz(-6, 6); c = R.nz(-4, 4); tries++; } while ((H.gcd(a, b) !== 1 || (d === 3 && H.gcd(H.gcd(a, b), c) !== 1)) && tries < 100);
      if (d === 1) { g = R.int(2, 9); q = poly([[g * a, "x"], [g * b, ""]]); ans = g + "(" + typed([[a, "x"], [b, ""]]) + ")"; walk = [[g + "(" + poly([[a, "x"], [b, ""]]) + ")", "The greatest common factor of " + g * a + " and " + g * b + " is " + g + ". Divide each term by " + g + "."]]; }
      else if (d === 2) { g = R.int(2, 6); q = poly([[g * a, "x^{2}"], [g * b, "x"]]); ans = g + "x(" + typed([[a, "x"], [b, ""]]) + ")"; walk = [[g + "x(" + poly([[a, "x"], [b, ""]]) + ")", "The GCF is " + g + "x: the biggest number that divides both coefficients, and the smallest power of $x$."]]; }
      else { g = R.int(2, 6); q = poly([[g * a, "x^{3}"], [g * b, "x^{2}"], [g * c, "x"]]); ans = g + "x(" + typed([[a, "x^{2}"], [b, "x"], [c, ""]]) + ")"; walk = [[g + "x(" + poly([[a, "x^{2}"], [b, "x"], [c, ""]]) + ")", "The GCF is " + g + "x. Divide each term by it."]]; }
      return { q: "Factor out the greatest common factor.<br>$" + q + "$", a: { k: "expr", v: ans, form: "gcf" }, walk: walk, hint: "What is the biggest number and the highest power of $x$ that divide every term?",
        ver: function () { return H.same(q.replace(/\^\{(\d+)\}/g, "^$1").replace(/\s+/g, ""), ans); } };
    });

  function twoFactors(a1, b1, a2, b2) {   // (a1 x + b1)(a2 x + b2)
    return { A: a1 * a2, B: a1 * b2 + a2 * b1, C: b1 * b2 };
  }

  topic("f_trin1", "fac", "Factoring x² + bx + c", ["p_mul_bin", "f_gcf"],
    "To factor x² + bx + c, look for two numbers that multiply to c and add to b. Then x² + bx + c = (x + p)(x + q). Check by multiplying back.",
    function (R, d) {
      var p, q2, q, ans, walk;
      if (d === 1) { p = R.int(1, 8); q2 = R.int(1, 8); }
      else if (d === 2) { p = R.nz(-9, 9); q2 = R.nz(-9, 9); if (p === -q2 && R.chance(0.5)) q2 = -q2 + 1; }
      else { p = R.nz(-12, 12); q2 = R.nz(-12, 12); if (Math.abs(p) < 4 && Math.abs(q2) < 4) { p = 7 * R.sign(); } }
      var B = p + q2, C = p * q2;
      q = poly([[1, "x^{2}"], [B, "x"], [C, ""]]);
      ans = "(x" + (p < 0 ? p : "+" + p) + ")(x" + (q2 < 0 ? q2 : "+" + q2) + ")";
      walk = [["\\text{" + tex(p) + " and " + tex(q2) + "}", "Two numbers that multiply to " + C + " and add to " + B + ": " + tex(p) + " × " + par(q2) + " = " + C + " and " + tex(p) + " + " + par(q2) + " = " + B + "."], ["(x " + H.sg(p) + ")(x " + H.sg(q2) + ")", "Write the factors."]];
      return { q: "Factor completely.<br>$" + q + "$", a: { k: "expr", v: ans, form: "fac", nf: 2 }, walk: walk, hint: "Find two numbers with product " + C + " and sum " + B + ".",
        ver: function () { return H.same(q.replace(/\^\{(\d+)\}/g, "^$1").replace(/\s+/g, ""), ans); } };
    });

  topic("f_trin2", "fac", "Factoring ax² + bx + c", ["f_trin1"],
    "When the x² term has a coefficient, list the pairs of factors of a and c and try combinations until the outer and inner products add up to the middle term. Check by expanding.",
    function (R, d) {
      var a1, a2, b1, b2, tf, guard = 0;
      do {
        a1 = R.int(1, d === 2 ? 3 : 4); a2 = R.int(2, d === 2 ? 3 : 4);
        b1 = R.nz(-7, 7); b2 = R.nz(-7, 7);
        if (d === 2) { b1 = R.int(1, 6); b2 = R.int(1, 6); }
        tf = twoFactors(a1, b1, a2, b2); guard++;
      } while ((H.gcd(H.gcd(tf.A, tf.B), tf.C) !== 1 || tf.B === 0 || H.gcd(a1, b1) !== 1 || H.gcd(a2, b2) !== 1) && guard < 200);
      var q = poly([[tf.A, "x^{2}"], [tf.B, "x"], [tf.C, ""]]);
      var f1 = poly([[a1, "x"], [b1, ""]]), f2 = poly([[a2, "x"], [b2, ""]]);
      var ans = "(" + f1.replace(/\s+/g, "") + ")(" + f2.replace(/\s+/g, "") + ")";
      var walk = [["ac = " + tf.A * tf.C + ",\\quad b = " + tf.B, "Multiply $a$ and $c$, and look for two numbers that multiply to " + tf.A * tf.C + " and add to " + tf.B + "."], ["(" + f1 + ")(" + f2 + ")", "Try the factor pairs of " + tf.A + " and " + tf.C + " until the outer and inner products add to " + tex(tf.B) + "x. (Check: first " + tex(a1 * a2) + "x², outer " + tex(a1 * b2) + "x, inner " + tex(a2 * b1) + "x, last " + tex(b1 * b2) + ".)"]];
      return { q: "Factor completely.<br>$" + q + "$", a: { k: "expr", v: ans, form: "fac", nf: 2 }, walk: walk, hint: "Try factor pairs of the first and last coefficients; check the middle term by expanding.",
        ver: function () { return H.same(q.replace(/\^\{(\d+)\}/g, "^$1").replace(/\s+/g, ""), ans); } };
    });

  topic("f_diffsq", "fac", "Difference of squares", ["p_special", "f_gcf"],
    "a² − b² = (a + b)(a − b). It only works for a difference (a minus) of two perfect squares. If there is a common factor, take that out first.",
    function (R, d) {
      var k, p, q, ans, walk, nf = 2;
      if (d === 1) { k = R.int(2, 12); q = "x^{2} - " + k * k; ans = "(x-" + k + ")(x+" + k + ")"; walk = [["(x - " + k + ")(x + " + k + ")", "$x^{2}$ and " + k * k + " are both perfect squares ($x$ and " + k + "), so use $a^{2} - b^{2} = (a + b)(a - b)$."]]; }
      else if (d === 2) { p = R.int(2, 6); k = R.int(1, 9); q = p * p + "x^{2} - " + k * k; ans = "(" + p + "x-" + k + ")(" + p + "x+" + k + ")"; walk = [["(" + p + "x - " + k + ")(" + p + "x + " + k + ")", p * p + "x² is (" + p + "x)² and " + k * k + " is " + k + "², so it's a difference of squares."]]; }
      else if (R.chance(0.5)) { var g = R.int(2, 5); k = R.int(2, 8); q = g + "x^{2} - " + g * k * k; ans = g + "(x-" + k + ")(x+" + k + ")"; walk = [[g + "(x^{2} - " + k * k + ")", "Take out the common factor " + g + " first."], [g + "(x - " + k + ")(x + " + k + ")", "The bracket is now a difference of squares."]]; }
      else { p = R.int(2, 5); var r = R.int(2, 5); k = R.int(1, 6); q = p * p + "x^{2} - " + r * r * k * k + "y^{2}"; q = p * p + "x^{2} - " + (r * r) + "y^{2}"; ans = "(" + p + "x-" + r + "y)(" + p + "x+" + r + "y)"; walk = [["(" + p + "x - " + r + "y)(" + p + "x + " + r + "y)", "Both terms are perfect squares: (" + p + "x)² and (" + r + "y)²."]]; }
      return { q: "Factor completely.<br>$" + q + "$", a: { k: "expr", v: ans, form: "fac", nf: 2 }, walk: walk, hint: "Is each term a perfect square? Is there a common factor first?",
        ver: function () { return H.same(q.replace(/\^\{(\d+)\}/g, "^$1").replace(/\s+/g, ""), ans); } };
    });

  topic("f_perfect", "fac", "Perfect square trinomials", ["p_special", "f_trin1"],
    "If the first and last terms are perfect squares and the middle term is twice the product of their roots, the trinomial is a perfect square: a² + 2ab + b² = (a + b)².",
    function (R, d) {
      var p, k, sign = R.chance(0.5) ? 1 : -1, q, ans, walk;
      if (d === 1) { p = 1; k = R.int(2, 9); } else if (d === 2) { p = R.int(2, 4); k = R.int(1, 7); while (H.gcd(p, k) !== 1) k++; } else { p = R.int(2, 5); k = R.int(2, 7); while (H.gcd(p, k) !== 1) k++; }
      q = poly([[p * p, "x^{2}"], [2 * p * k * sign, "x"], [k * k, ""]]);
      var f = p === 1 ? "x" : p + "x";
      ans = "(" + f + (sign > 0 ? "+" : "-") + k + ")^2";
      walk = [["(" + f + " " + (sign > 0 ? "+" : "-") + " " + k + ")^{2}", "The first term is (" + f + ")², the last is " + k + "², and the middle is 2 · " + f + " · " + k + " = " + 2 * p * k + "x. So it's a perfect square."]];
      return { q: "Factor completely.<br>$" + q + "$", a: { k: "expr", v: ans, form: "fac", nf: 2 }, walk: walk, hint: "Are the first and last terms perfect squares? Is the middle term twice the product of their roots?",
        ver: function () { return H.same(q.replace(/\^\{(\d+)\}/g, "^$1").replace(/\s+/g, ""), ans); } };
    });

  topic("f_solve", "fac", "Solving quadratics by factoring", ["f_trin1", "q_2step"],
    "If a product is zero, one of the factors must be zero. So move everything to one side, factor, and set each factor equal to zero.",
    function (R, d) {
      var r1, r2, q, walk, roots, a, eq, form;
      if (d < 3) {
        r1 = d === 1 ? R.int(1, 8) * R.sign() : R.nz(-9, 9); r2 = d === 1 ? R.int(1, 8) * R.sign() : R.nz(-9, 9);
        if (r1 === r2) r2 += 1; if (r2 === 0) r2 = 2;
        var B = -(r1 + r2), C = r1 * r2;
        if (d === 2 && R.chance(0.5)) { q = "x^{2} = " + poly([[-B, "x"], [-C, ""]]); form = "eq"; walk = [[poly([[1, "x^{2}"], [B, "x"], [C, ""]]) + " = 0", "Move everything to one side so it equals 0."]]; }
        else { q = poly([[1, "x^{2}"], [B, "x"], [C, ""]]) + " = 0"; walk = []; }
        walk.push(["(x " + H.sg(-r1) + ")(x " + H.sg(-r2) + ") = 0", "Factor."]);
        walk.push(["x = " + tex(r1) + " \\quad\\text{or}\\quad x = " + tex(r2), "Set each factor equal to zero and solve."]);
        roots = [r1, r2]; eq = "x^2+" + B + "*x+" + C + "=0";
      } else {
        // (px + a)(qx + b) with p >= 2, giving rational roots
        var p1 = R.int(2, 4), q1 = R.int(1, 3), aa = R.nz(-6, 6), bb = R.nz(-6, 6);
        while (H.gcd(p1, aa) !== 1 || H.gcd(q1, bb) !== 1) { aa = R.nz(-6, 6); bb = R.nz(-6, 6); }
        var tf = twoFactors(p1, aa, q1, bb);
        r1 = -aa / p1; r2 = -bb / q1; if (Math.abs(r1 - r2) < 1e-9) { bb = bb + 1; if (H.gcd(q1, bb) !== 1 || bb === 0) bb = bb + 1; tf = twoFactors(p1, aa, q1, bb); r2 = -bb / q1; }
        q = poly([[tf.A, "x^{2}"], [tf.B, "x"], [tf.C, ""]]) + " = 0"; roots = [r1, r2];
        eq = tf.A + "*x^2+" + tf.B + "*x+" + tf.C + "=0";
        walk = [["(" + poly([[p1, "x"], [aa, ""]]) + ")(" + poly([[q1, "x"], [bb, ""]]) + ") = 0", "Factor the trinomial."], ["x = " + fr(-aa, p1) + " \\quad\\text{or}\\quad x = " + fr(-bb, q1), "Set each factor equal to zero and solve. (Give fractions as they are.)"]];
      }
      return { q: "Solve. Enter both solutions, separated by a comma.<br>$" + q + "$", a: { k: "list", v: roots }, walk: walk, hint: "Move everything to one side, factor, then set each factor to 0.",
        ver: function () { return roots.every(function (r) { return H.holds(eq, { x: r }); }); } };
    });

  topic("f_sqrt", "fac", "Solving with square roots", ["r_sq", "q_2step"],
    "If a quantity squared equals a number, the quantity is the positive or the negative square root of that number: x² = 49 gives x = 7 or x = −7. Isolate the squared part first.",
    function (R, d) {
      var q, roots, walk, eq, k, a, h, c;
      if (d === 1) { k = R.int(2, 13); q = "x^{2} = " + k * k; roots = [k, -k]; eq = "x^2=" + k * k; walk = [["x = \\pm" + k, "The square root of " + k * k + " is " + k + ", and −" + k + " also works."]]; }
      else if (d === 2) { a = R.int(2, 6); k = R.int(2, 9); q = a + "x^{2} = " + a * k * k; roots = [k, -k]; eq = a + "*x^2=" + a * k * k; walk = [["x^{2} = " + k * k, "Divide both sides by " + a + "."], ["x = \\pm" + k, "Take both square roots."]]; }
      else if (R.chance(0.5)) { h = R.nz(-6, 6); k = R.int(2, 8); q = "(x " + H.sg(-h) + ")^{2} = " + k * k; roots = [h + k, h - k]; eq = "(x-" + h + ")^2=" + k * k; walk = [["x " + H.sg(-h) + " = \\pm" + k, "Take both square roots of each side."], ["x = " + tex(h + k) + " \\quad\\text{or}\\quad x = " + tex(h - k), "Solve each: add " + tex(h) + " to both sides."]]; }
      else { a = R.int(2, 5); h = R.nz(-5, 5); k = R.int(2, 7); q = a + "(x " + H.sg(-h) + ")^{2} = " + a * k * k; roots = [h + k, h - k]; eq = a + "*(x-" + h + ")^2=" + a * k * k; walk = [["(x " + H.sg(-h) + ")^{2} = " + k * k, "Divide both sides by " + a + "."], ["x " + H.sg(-h) + " = \\pm" + k, "Take both square roots."], ["x = " + tex(h + k) + " \\quad\\text{or}\\quad x = " + tex(h - k), "Solve each."]]; }
      return { q: "Solve. Enter both solutions, separated by a comma.<br>$" + q + "$", a: { k: "list", v: roots }, walk: walk, hint: "Isolate the squared part; the square root can be positive or negative.",
        ver: function () { return roots.every(function (r) { return H.holds(eq, { x: r }); }); } };
    });

  topic("f_formula", "fac", "The quadratic formula", ["f_solve", "r_simp"],
    "For ax² + bx + c = 0, the solutions are x = (−b ± √(b² − 4ac)) ÷ 2a. Put in a, b and c carefully — with their signs — and simplify.",
    function (R, d) {
      var a, b, c, r1, r2, q, walk, roots, tol, abs, note = "";
      if (d === 1) { a = 1; r1 = R.nz(-7, 8); r2 = R.nz(-7, 8); if (r1 === r2) r2 += 2; if (r2 === 0) r2 = 3; b = -(r1 + r2); c = r1 * r2; roots = [r1, r2]; }
      else if (d === 2) {
        var p1 = R.int(2, 4), q1 = R.int(1, 3), aa = R.nz(-6, 6), bb = R.nz(-6, 6);
        while (H.gcd(p1, aa) !== 1 || H.gcd(q1, bb) !== 1 || -aa / p1 === -bb / q1) { aa = R.nz(-6, 6); bb = R.nz(-6, 6); }
        var tf = twoFactors(p1, aa, q1, bb); a = tf.A; b = tf.B; c = tf.C; roots = [-aa / p1, -bb / q1];
      } else {
        var disc; do { a = R.int(1, 3); b = R.nz(-9, 9); c = R.nz(-9, 9); disc = b * b - 4 * a * c; } while (disc <= 0 || Math.sqrt(disc) === Math.round(Math.sqrt(disc)));
        roots = [(-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a)]; tol = 0.0051; abs = true; note = " Round to the nearest hundredth.";
      }
      var disc2 = b * b - 4 * a * c;
      q = poly([[a, "x^{2}"], [b, "x"], [c, ""]]) + " = 0";
      walk = [["a = " + a + ",\\ b = " + b + ",\\ c = " + c, "Read off $a$, $b$ and $c$, with their signs."], ["x = \\frac{" + tex(-b) + " \\pm \\sqrt{" + par(b) + "^{2} - 4(" + a + ")(" + tex(c) + ")}}{2(" + a + ")} = \\frac{" + tex(-b) + " \\pm \\sqrt{" + disc2 + "}}{" + 2 * a + "}", "Substitute into the formula. The part under the root is $b^2 - 4ac$ = " + disc2 + "."]];
      if (d < 3) walk.push(["x = " + roots.map(function (r) { return fr(Math.round(r * 2 * a) , 2 * a).replace(/^.*$/, function (s) { return s; }); }).join(" \\quad\\text{or}\\quad x = "), "√" + disc2 + " = " + Math.round(Math.sqrt(disc2)) + ", so both solutions are rational."]);
      else walk.push(["x \\approx " + (Math.round(roots[0] * 100) / 100) + " \\quad\\text{or}\\quad x \\approx " + (Math.round(roots[1] * 100) / 100), "√" + disc2 + " isn't a whole number, so use a calculator and round each solution."]);
      var eqT = a + "*x^2+" + b + "*x+" + c + "=0";
      return { q: "Solve using the quadratic formula. Enter both solutions, separated by a comma." + (d < 3 ? " Give fractions as they are." : note) + "<br>$" + q + "$", a: { k: "list", v: roots, tol: tol, abs: abs }, walk: walk, hint: "Find $a$, $b$ and $c$, then put them into the formula.",
        ver: function () { return roots.every(function (r) { return Math.abs(LAB.evalTree(LAB.parse(a + "*x^2+" + b + "*x+" + c), { x: r })) < 1e-7; }); } };
    });

  topic("f_vertex", "fac", "Vertex of a parabola", ["p_special", "l_func"],
    "A parabola y = a(x − h)² + k has its turning point (its vertex) at (h, k). From y = ax² + bx + c, the vertex is at x = −b ÷ 2a; put that x back in to find y.",
    function (R, d) {
      var h, k, a, b, c, q, walk, pt;
      if (d === 1) { h = R.nz(-7, 7); k = R.nz(-8, 8); q = "y = (x " + H.sg(-h) + ")^{2} " + H.sg(k); walk = [["(h, k) = (" + h + ", " + k + ")", "In $y = a(x - h)^2 + k$, $h$ is the number subtracted inside the bracket (careful: (x + 3) means $h$ = −3) and $k$ is the number added outside."]]; a = 1; }
      else if (d === 2) { h = R.nz(-7, 7); k = R.nz(-8, 8); a = R.nz(-4, 4); if (Math.abs(a) === 1) a = 2; q = "y = " + a + "(x " + H.sg(-h) + ")^{2} " + H.sg(k); walk = [["(h, k) = (" + h + ", " + k + ")", "In $y = a(x - h)^2 + k$ the vertex is (h, k). The $a$ = " + a + " changes the shape, not the vertex."]]; }
      else { h = R.nz(-5, 5); a = R.int(1, 3) * R.sign(); c = R.nz(-8, 8); b = -2 * a * h; k = a * h * h + b * h + c; q = "y = " + poly([[a, "x^{2}"], [b, "x"], [c, ""]]); walk = [["x = \\frac{-b}{2a} = \\frac{" + tex(-b) + "}{" + 2 * a + "} = " + h, "The vertex is at $x = -b \\div 2a$."], ["y = " + LAB.sub(poly([[a, "x^{2}"], [b, "x"], [c, ""]]), { x: h }) + " = " + k, "Put $x$ = " + h + " back into the equation."]]; }
      return { q: "Find the vertex of the parabola. Enter it like (2, -3).<br>$" + q + "$", a: { k: "pt", v: [h, k] }, walk: walk, hint: d === 3 ? "Use $x = -b \\div 2a$, then find $y$." : "Read the vertex from the form $y = a(x - h)^2 + k$.", fb: d < 3 ? [{ v: [-h, k], say: "The sign of $h$ is reversed. In (x − 3)² the vertex $x$-coordinate is +3." }] : [] };
    });

  topic("f_disc", "fac", "The discriminant", ["f_formula"],
    "The part under the root in the quadratic formula, b² − 4ac, is the discriminant. Positive: two real solutions. Zero: exactly one. Negative: no real solutions.",
    function (R, d) {
      var a, b, c, D, q, walk, ans;
      if (d === 1) { a = R.nz(-4, 5); b = R.nz(-8, 8); c = R.nz(-7, 8); D = b * b - 4 * a * c; q = "What is the discriminant of $" + poly([[a, "x^{2}"], [b, "x"], [c, ""]]) + " = 0$?"; walk = [["b^{2} - 4ac = " + par(b) + "^{2} - 4(" + a + ")(" + par(c) + ") = " + D, "Put $a$ = " + a + ", $b$ = " + b + ", $c$ = " + c + " into $b^2 - 4ac$."]]; return { q: q, a: { k: "num", v: D }, walk: walk, hint: "Compute $b^2 - 4ac$ with the signs of $a$, $b$ and $c$." }; }
      if (d === 2) {
        var kind = R.pick(["two", "one", "none"]);
        if (kind === "one") { var r = R.nz(-6, 6), s = R.int(1, 3); a = s * s === 1 ? 1 : s; b = -2 * a * r; c = a * r * r; }
        else if (kind === "two") { do { a = R.nz(-3, 4); b = R.nz(-6, 6); c = R.nz(-6, 6); D = b * b - 4 * a * c; } while (D <= 0); }
        else { do { a = R.nz(-3, 4); b = R.nz(-4, 4); c = R.nz(-6, 6); D = b * b - 4 * a * c; } while (D >= 0); }
        D = b * b - 4 * a * c;
        var right = D > 0 ? "Two real solutions" : D === 0 ? "One real solution" : "No real solutions";
        var all = ["Two real solutions", "One real solution", "No real solutions"];
        var ch = H.choice(R, right, all.filter(function (z) { return z !== right; }).map(function (z) { return [z, "The discriminant is " + D + ", which is " + (D > 0 ? "positive" : D === 0 ? "zero" : "negative") + " — so " + right.toLowerCase() + "."]; }), { keep: true });
        return { q: "How many real solutions does $" + poly([[a, "x^{2}"], [b, "x"], [c, ""]]) + " = 0$ have?", a: ch, walk: [["b^{2} - 4ac = " + D, "Positive: two real solutions. Zero: one. Negative: none. Here it is " + D + "."]], hint: "Find $b^2 - 4ac$ and look at its sign." };
      }
      var m = R.int(2, 8); b = 2 * m; c = m * m;
      return { q: "For what value of $c$ does $x^{2} " + H.sg(b).replace("+ ", "+ ") + "x + c = 0$ have exactly one real solution?", a: { k: "num", v: c }, walk: [["b^{2} - 4ac = 0 \\Rightarrow " + b + "^{2} - 4(1)c = 0", "Exactly one solution means the discriminant is zero."], ["c = \\frac{" + b * b + "}{4} = " + c, "Solve for $c$."]], hint: "Set the discriminant equal to 0." };
    });

  /* ================================================================ Radicals */

  topic("r_sq", "rad", "Square roots", ["n_exp"],
    "The square root of a number is what you multiply by itself to get it. Perfect squares — 1, 4, 9, 16, 25, … — have whole-number roots; other numbers fall between two of them.",
    function (R, d) {
      var q, a, walk, k, low;
      if (d === 1) { k = R.int(2, 15); q = "Evaluate. $\\sqrt{" + k * k + "}$"; return { q: q, a: { k: "num", v: k }, walk: [["\\sqrt{" + k * k + "} = " + k, k + " × " + k + " = " + k * k + "."]], hint: "What number times itself gives this?" }; }
      if (d === 2) { var n = R.int(1, 9), m = R.int(n + 1, 12); while (H.gcd(n, m) !== 1) m++; q = "Evaluate. Write your answer as a fraction.<br>$\\sqrt{\\frac{" + n * n + "}{" + m * m + "}}$"; return { q: q, a: { k: "num", v: n / m, lowest: true }, walk: [["\\frac{\\sqrt{" + n * n + "}}{\\sqrt{" + m * m + "}} = \\frac{" + n + "}{" + m + "}", "Take the root of the top and the root of the bottom."]], hint: "Take the square root of the numerator and of the denominator." }; }
      low = R.int(4, 12); var val = R.int(low * low + 1, (low + 1) * (low + 1) - 1);
      a = H.choice(R, low + " and " + (low + 1), [[(low - 1) + " and " + low, low + "² is " + low * low + ", which is less than " + val + ", so √" + val + " is bigger than " + low + "."], [(low + 1) + " and " + (low + 2), (low + 1) + "² is " + (low + 1) * (low + 1) + ", which is more than " + val + ", so √" + val + " is less than " + (low + 1) + "."], [(low - 2) + " and " + (low - 1), "Check: " + low + "² = " + low * low + ", already less than " + val + "."]], { keep: true });
      return { q: "Between which two consecutive whole numbers is $\\sqrt{" + val + "}$?", a: a, walk: [[low * low + " < " + val + " < " + (low + 1) * (low + 1), low + "² = " + low * low + " and " + (low + 1) + "² = " + (low + 1) * (low + 1) + ", so √" + val + " is between " + low + " and " + (low + 1) + "."]], hint: "Find the perfect squares just below and just above." };
    });

  var SQF = [2, 3, 5, 6, 7, 10, 11];
  function rc(c) { return c === 1 ? "" : c === -1 ? "-" : String(c); }
  topic("r_simp", "rad", "Simplifying square roots", ["r_sq", "n_frac_simp"],
    "Pull out any perfect-square factor: √72 = √(36 · 2) = 6√2. A radical is in simplest form when the number under the root has no perfect-square factor other than 1.",
    function (R, d) {
      var b = R.pick(SQF), k, c, q, ans, walk;
      if (d === 1) { k = R.int(2, 6); q = "\\sqrt{" + k * k * b + "}"; ans = k + "sqrt(" + b + ")"; walk = [["\\sqrt{" + k * k + " \\cdot " + b + "} = " + k + "\\sqrt{" + b + "}", k * k * b + " = " + k * k + " × " + b + ", and " + k * k + " is a perfect square."]]; }
      else if (d === 2) { k = R.int(3, 9); if (k * k * b > 400) k = 4; q = "\\sqrt{" + k * k * b + "}"; ans = k + "sqrt(" + b + ")"; walk = [["\\sqrt{" + k * k + " \\cdot " + b + "} = " + k + "\\sqrt{" + b + "}", "Find the largest perfect square that divides " + k * k * b + ": it is " + k * k + "."]]; }
      else { k = R.int(2, 5); c = R.int(2, 6); q = c + "\\sqrt{" + k * k * b + "}"; ans = c * k + "sqrt(" + b + ")"; walk = [[c + "\\sqrt{" + k * k + " \\cdot " + b + "} = " + c + " \\cdot " + k + "\\sqrt{" + b + "}", "Simplify the root first."], [c * k + "\\sqrt{" + b + "}", "Multiply the numbers in front."]]; }
      return { q: "Simplify. Write your answer in simplest radical form, like 3√2.<br>$" + q + "$", a: { k: "expr", v: ans, form: "rad" }, walk: walk, hint: "Look for the largest perfect square that divides the number under the root." };
    });

  topic("r_addsub", "rad", "Adding and subtracting radicals", ["r_simp", "e_like"],
    "Radicals with the same number under the root are like terms: 3√2 + 5√2 = 8√2. Simplify each radical first — sometimes unlike-looking radicals turn out to be like.",
    function (R, d) {
      var b = R.pick(SQF), c1, c2, k1, k2, q, ans, walk, sub, res;
      if (d === 1) { c1 = R.int(2, 8); c2 = R.int(2, 8); sub = R.chance(0.5); if (sub && c1 === c2) c2++; res = sub ? c1 - c2 : c1 + c2; q = c1 + "\\sqrt{" + b + "} " + (sub ? "-" : "+") + " " + c2 + "\\sqrt{" + b + "}"; walk = [[res + "\\sqrt{" + b + "}", "Same radical, so " + (sub ? "subtract" : "add") + " the numbers in front: " + c1 + (sub ? " − " : " + ") + c2 + " = " + res + "."]]; }
      else if (d === 2) { k1 = R.int(2, 4); k2 = R.int(2, 4); if (k1 === k2) k2++; sub = R.chance(0.4); res = k1 + (sub ? -k2 : k2); if (res === 0) { k2++; res = k1 + (sub ? -k2 : k2); } q = "\\sqrt{" + k1 * k1 * b + "} " + (sub ? "-" : "+") + " \\sqrt{" + k2 * k2 * b + "}"; walk = [[k1 + "\\sqrt{" + b + "} " + (sub ? "-" : "+") + " " + k2 + "\\sqrt{" + b + "}", "Simplify each radical."], [rc(res) + "\\sqrt{" + b + "}", "Now they're like terms: combine the numbers in front (" + k1 + (sub ? " − " : " + ") + k2 + " = " + res + ")."]]; }
      else { c1 = R.int(2, 4); c2 = R.int(2, 4); k1 = R.int(2, 4); k2 = R.int(2, 4); sub = R.chance(0.6); res = c1 * k1 + (sub ? -c2 * k2 : c2 * k2); if (res === 0) { c2++; res = c1 * k1 + (sub ? -c2 * k2 : c2 * k2); } q = c1 + "\\sqrt{" + k1 * k1 * b + "} " + (sub ? "-" : "+") + " " + c2 + "\\sqrt{" + k2 * k2 * b + "}"; walk = [[c1 * k1 + "\\sqrt{" + b + "} " + (sub ? "-" : "+") + " " + c2 * k2 + "\\sqrt{" + b + "}", "Simplify each radical: " + c1 + "·" + k1 + " = " + c1 * k1 + " and " + c2 + "·" + k2 + " = " + c2 * k2 + "."], [rc(res) + "\\sqrt{" + b + "}", "Combine like terms."]]; }
      ans = (res === 1 ? "" : res === -1 ? "-" : res) + "sqrt(" + b + ")";
      return { q: "Simplify. Write your answer in simplest radical form.<br>$" + q + "$", a: { k: "expr", v: ans, form: "rad" }, walk: walk, hint: "Simplify each radical first, then combine the ones that match." };
    });

  topic("r_mul", "rad", "Multiplying radicals", ["r_simp"],
    "√a · √b = √(ab). Multiply the numbers in front, multiply the numbers under the roots, then simplify. For brackets, multiply every term by every term.",
    function (R, d) {
      var q, ans, walk, a, b, k, c1, c2, form = "rad";
      if (d === 1) { b = R.pick([2, 3, 5, 6, 7]); k = R.int(2, 6); a = b * k * k; q = "\\sqrt{" + b + "} \\cdot \\sqrt{" + a + "}"; return { q: "Multiply and simplify.<br>$" + q + "$", a: { k: "num", v: b * k }, walk: [["\\sqrt{" + b * a + "} = " + b * k, "√a · √b = √(ab) = √" + b * a + ", and " + b * a + " = " + b * k + "² is a perfect square."]], hint: "Multiply under the root, then simplify." }; }
      if (d === 2) { c1 = R.int(2, 4); c2 = R.int(2, 4); var x = R.pick([2, 3, 5]), y = R.pick([2, 3, 5, 6, 7, 10]); while (x === y) y = R.pick([2, 3, 5, 6, 7, 10]);
        var prod = x * y, s = 1, rem = prod; for (var f = 2; f * f <= rem; f++) while (rem % (f * f) === 0) { s *= f; rem /= f * f; }
        q = c1 + "\\sqrt{" + x + "} \\cdot " + c2 + "\\sqrt{" + y + "}"; ans = (c1 * c2 * s) + "sqrt(" + rem + ")"; if (rem === 1) ans = String(c1 * c2 * s);
        walk = [[c1 * c2 + "\\sqrt{" + prod + "}", "Multiply the numbers in front (" + c1 + " · " + c2 + ") and the numbers under the roots (" + x + " · " + y + ")."], [rem === 1 ? String(c1 * c2 * s) : (c1 * c2 * s) + "\\sqrt{" + rem + "}", s > 1 ? "Simplify: " + prod + " = " + s * s + " · " + rem + "." : "Already in simplest form."]];
        return { q: "Multiply and simplify.<br>$" + q + "$", a: { k: "expr", v: ans, form: "rad" }, walk: walk, hint: "Multiply the outside numbers, multiply the inside numbers, then simplify." }; }
      if (R.chance(0.5)) { a = R.pick([3, 5, 6, 7, 10, 11]); b = R.int(1, 3); q = "(\\sqrt{" + a + "} + " + b + ")(\\sqrt{" + a + "} - " + b + ")"; ans = String(a - b * b); walk = [["(\\sqrt{" + a + "})^{2} - " + b + "^{2} = " + a + " - " + b * b, "A sum times a difference: the middle terms cancel, leaving the difference of the squares."], [String(a - b * b), "Simplify."]]; return { q: "Multiply and simplify.<br>$" + q + "$", a: { k: "num", v: a - b * b }, walk: walk, hint: "This is (a + b)(a − b): the middle terms cancel." }; }
      a = R.pick([2, 3, 5, 6, 7]); var m = R.int(1, 4), n = R.int(1, 4);
      q = "(\\sqrt{" + a + "} + " + m + ")(\\sqrt{" + a + "} + " + n + ")"; ans = (a + m * n) + "+" + (m + n) + "sqrt(" + a + ")";
      walk = [[a + " + " + n + "\\sqrt{" + a + "} + " + m + "\\sqrt{" + a + "} + " + m * n, "Multiply each term by each term: $\\sqrt{" + a + "}\\cdot\\sqrt{" + a + "} = " + a + "$."], [(a + m * n) + " + " + (m + n) + "\\sqrt{" + a + "}", "Combine the like terms."]];
      return { q: "Multiply and simplify.<br>$" + q + "$", a: { k: "expr", v: ans, form: "rad" }, walk: walk, hint: "Multiply each term by each term; √a · √a = a." };
    });

  topic("r_rat", "rad", "Rationalizing denominators", ["r_mul", "n_frac_simp"],
    "A root in a denominator is usually cleared by multiplying the top and the bottom by it (or, for a sum like √5 − 1, by its partner √5 + 1). The value doesn't change — you multiplied by 1.",
    function (R, d) {
      var q, ans, walk, b, k, t, a;
      if (d === 1) { b = R.pick([2, 3, 5, 6, 7]); t = R.int(2, 6); k = t * b; q = "\\frac{" + k + "}{\\sqrt{" + b + "}}"; ans = t + "sqrt(" + b + ")"; walk = [["\\frac{" + k + "}{\\sqrt{" + b + "}} \\cdot \\frac{\\sqrt{" + b + "}}{\\sqrt{" + b + "}} = \\frac{" + k + "\\sqrt{" + b + "}}{" + b + "}", "Multiply the top and bottom by √" + b + ", so the bottom becomes a whole number."], [t + "\\sqrt{" + b + "}", k + " ÷ " + b + " = " + t + "."]]; }
      else if (d === 2) { b = R.pick([2, 3, 5, 6, 7]); var n = R.int(1, 9); while (n % b === 0) n++; q = "\\frac{" + n + "}{\\sqrt{" + b + "}}"; ans = n + "sqrt(" + b + ")/" + b; walk = [["\\frac{" + n + "\\sqrt{" + b + "}}{" + b + "}", "Multiply the top and bottom by √" + b + ": the bottom becomes √" + b + " · √" + b + " = " + b + "."]]; }
      else { a = R.pick([2, 3, 5, 6, 7]); var bb = R.int(1, 3); while (a === bb * bb) bb++; var den = a - bb * bb; if (den === 0) den = 1; t = R.int(1, 4); k = t * den; var plus = R.chance(0.5);
        q = "\\frac{" + k + "}{\\sqrt{" + a + "} " + (plus ? "+" : "-") + " " + bb + "}";
        // k / (√a + b) = k(√a − b)/(a − b²);  k / (√a − b) = k(√a + b)/(a − b²)
        var sgn = plus ? -1 : 1;
        ans = t + "sqrt(" + a + ")" + (sgn * bb * t < 0 ? "" : "+") + (sgn * bb * t);
        walk = [["\\frac{" + k + "(\\sqrt{" + a + "} " + (plus ? "-" : "+") + " " + bb + ")}{(\\sqrt{" + a + "} " + (plus ? "+" : "-") + " " + bb + ")(\\sqrt{" + a + "} " + (plus ? "-" : "+") + " " + bb + ")}", "Multiply the top and bottom by the partner, √" + a + (plus ? " − " : " + ") + bb + "."], ["\\frac{" + k + "(\\sqrt{" + a + "} " + (plus ? "-" : "+") + " " + bb + ")}{" + a + " - " + bb * bb + "} = " + t + "(\\sqrt{" + a + "} " + (plus ? "-" : "+") + " " + bb + ")", "The bottom is a difference of squares: " + a + " − " + bb * bb + " = " + den + ", which divides " + k + "."]];
        if (a - bb * bb < 0) { ans = null; }
      }
      if (ans == null || (d === 3 && a - bb * bb <= 0)) {
        // choose values with a positive difference so the answer is clean
        a = R.pick([7, 10, 11]); bb = R.int(1, 2); den = a - bb * bb; t = R.int(1, 3); k = t * den; var pl = R.chance(0.5); var sg = pl ? -1 : 1;
        q = "\\frac{" + k + "}{\\sqrt{" + a + "} " + (pl ? "+" : "-") + " " + bb + "}";
        ans = t + "sqrt(" + a + ")" + (sg * bb * t < 0 ? "" : "+") + (sg * bb * t);
        walk = [["\\frac{" + k + "(\\sqrt{" + a + "} " + (pl ? "-" : "+") + " " + bb + ")}{(\\sqrt{" + a + "} " + (pl ? "+" : "-") + " " + bb + ")(\\sqrt{" + a + "} " + (pl ? "-" : "+") + " " + bb + ")}", "Multiply the top and bottom by the partner, √" + a + (pl ? " − " : " + ") + bb + "."], ["\\frac{" + k + "(\\sqrt{" + a + "} " + (pl ? "-" : "+") + " " + bb + ")}{" + den + "} = " + t + "(\\sqrt{" + a + "} " + (pl ? "-" : "+") + " " + bb + ")", "The bottom is a difference of squares: " + a + " − " + bb * bb + " = " + den + ", which divides " + k + "."]];
      }
      return { q: "Rationalize the denominator. Write your answer in simplest form.<br>$" + q + "$", a: { k: "expr", v: ans, form: "rad" }, walk: walk, hint: d === 3 ? "Multiply the top and bottom by the partner of the bottom (change the sign between the terms)." : "Multiply the top and bottom by the root in the denominator.",
        ver: function () { var s = q.replace(/\\sqrt\{(\d+)\}/g, "sqrt($1)").replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/, "(($1)/($2))"); return H.same(s, ans); } };
    });
})();
