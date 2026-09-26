/* ==========================================================================
   SAT Math — Domain 2: Advanced Math (about 35% of the Math section).
   See lab/satkit.js for the item format, SAT.domain and the helpers.

   Six skills: equivalent expressions; quadratics — their solutions, and
   their graphs; exponential functions; nonlinear equations and systems; and
   function notation with transformations.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB, S = L && L.SAT;
  if (!S || !S.domain) return;
  var H = S.h, F = S.fig, c = H.c, x = H.x, w = H.w, tex = H.tex, W = H.walk, money = H.money, poly = L.poly, num = L.num;
  function sgn(v) { return v < 0 ? "- " + Math.abs(v) : "+ " + v; }
  function quad(a, b, cc) { return poly([[a, "x^2"], [b, "x"], [cc, ""]]); }
  function fac(p) { return p === 0 ? "x" : "(x " + sgn(-p) + ")"; }      // the factor with root p
  function pair(a, b) { return a === b ? "$x = " + tex(a) + "$ only" : "$x = " + tex(Math.min(a, b)) + "$ and $x = " + tex(Math.max(a, b)) + "$"; }

  /* ============================================== 1 · Equivalent expressions */
  function eqvExpand(R) {
    var a = R.nz(-7, 8), b = R.nz(-7, 8);
    while (a === b || a === -b) b = R.nz(-7, 8);
    var ok = quad(1, a + b, a * b);
    return {
      stem: "Which expression is equivalent to $(x " + sgn(a) + ")(x " + sgn(b) + ")$?",
      choices: [x(ok, { ok: true }),
        x(quad(1, 0, a * b), { err: "concept", tr: "multiplied only first by first and last by last", why: "That skips the middle terms: $x \\cdot " + tex(b) + "$ and $" + tex(a) + " \\cdot x$. Every term in one bracket multiplies every term in the other." }),
        x(quad(1, a + b, a + b), { err: "calc", tr: "added the constants instead of multiplying", why: "The constant term is $" + tex(a) + " \\times " + tex(b) + " = " + (a * b) + "$." }),
        x(quad(1, a * b, a + b), { err: "concept", tr: "swapped the sum and the product", why: "The middle coefficient is the sum, $" + (a + b) + "$; the constant is the product, $" + (a * b) + "$." })],
      hint: "Each term in the first bracket multiplies each term in the second — how many products is that?",
      strategy: "Four products (first, outer, inner, last), then combine the two $x$ terms. The middle coefficient is $a + b$ and the constant is $ab$.",
      walk: W([["(x " + sgn(a) + ")(x " + sgn(b) + ")", "Start."], ["x^2 " + sgn(b) + "x " + sgn(a) + "x " + sgn(a * b), "Every term times every term."], [ok, "Combine like terms."]]),
      concept: "Multiplying brackets is the area of a rectangle cut into pieces: each piece is one term times one term.",
      rebuild: [
        { q: "What is $x \\cdot x$?", opts: ["$x^2$", "$2x$", "$x$"], a: 0, ok: "The first piece." },
        { q: "The two middle pieces are $" + tex(b) + "x$ and $" + tex(a) + "x$. Together?", opts: ["$" + poly([[a + b, "x"]]) + "$", "$" + poly([[a * b, "x"]]) + "$"], a: 0, ok: "Add them." },
        { q: "And the last piece, $" + tex(a) + " \\times " + tex(b) + "$?", num: a * b, ok: "So $" + ok + "$." }],
      autopsy: { trap: "Dropping the middle terms.", clue: "Two binomials: four products.", remember: "$(x + a)(x + b) = x^2 + (a + b)x + ab$." }
    };
  }
  function eqvFactor(R) {
    var p = R.nz(-8, 8), q = R.nz(-8, 8);
    while (p === q || p === -q) q = R.nz(-8, 8);
    var e = quad(1, -(p + q), p * q);
    function f2(u, v) { return fac(u) + fac(v); }
    return {
      stem: "Which of the following is a factored form of $" + e + "$?",
      choices: [x(f2(p, q), { ok: true }),
        x(f2(-p, -q), { err: "calc", tr: "used the solutions' signs inside the brackets", why: "Expand it: the middle term comes out $" + poly([[p + q, "x"]]) + "$, the opposite sign." }),
        x(f2(p, -q), { err: "calc", tr: "got one sign wrong", why: "The constant would be $" + (-p * q) + "$, not $" + (p * q) + "$." }),
        x(f2(-p, q), { err: "calc", tr: "got one sign wrong", why: "Expand it: the constant comes out $" + (-p * q) + "$." })],
      hint: "Which two numbers multiply to $" + (p * q) + "$ and add to $" + (-(p + q)) + "$?",
      strategy: "Find two numbers with product $c$ and sum $b$. Or expand each choice — the one that gives back the expression is right.",
      walk: W([[e, "Start."], [tex(-p) + " \\times " + tex(-q) + " = " + (p * q) + ",\\; " + tex(-p) + " + " + tex(-q) + " = " + (-(p + q)), "The two numbers."], [f2(p, q), "Factored."]]),
      concept: "Factoring undoes expanding. For $x^2 + bx + c$, look for two numbers whose product is $c$ and sum is $b$.",
      rebuild: [
        { q: "Two numbers multiply to $" + (p * q) + "$ and add to $" + (-(p + q)) + "$. Which pair?", opts: ["$" + (-p) + "$ and $" + (-q) + "$", "$" + p + "$ and $" + q + "$", "$" + p + "$ and $" + (-q) + "$"], a: 0, ok: "Product and sum both check." },
        { q: "So the factored form is…", opts: ["$" + f2(p, q) + "$", "$" + f2(-p, -q) + "$"], a: 0, ok: "Right." }],
      autopsy: { clue: "Product $c$, sum $b$.", remember: "Check a factoring by expanding it." }
    };
  }
  function eqvExp(R) {
    var a = R.int(3, 7), b = R.int(2, 6), cc = R.int(2, 4);
    var okT = "x^{" + (a + b - cc) + "}", ok = x(okT, { ok: true });
    return {
      stem: "For $x \\ne 0$, which expression is equivalent to $\\frac{x^{" + a + "} \\cdot x^{" + b + "}}{x^{" + cc + "}}$?",
      choices: [ok].concat(H.distinct(ok, [
        x("x^{" + (a * b - cc) + "}", { err: "formula", tr: "multiplied exponents instead of adding", why: "When powers of $x$ multiply, their exponents add: $x^{" + a + "} \\cdot x^{" + b + "} = x^{" + (a + b) + "}$." }),
        x("x^{" + (a + b + cc) + "}", { err: "formula", tr: "added the exponent when dividing", why: "Dividing subtracts the exponent: $\\frac{x^m}{x^n} = x^{m - n}$." }),
        x("x^{" + tex((a + b) / cc) + "}", { err: "formula", tr: "divided exponents instead of subtracting", why: "Dividing powers subtracts exponents; it doesn't divide them." }),
        x("x^{" + tex(a * b / cc) + "}", { err: "formula", tr: "multiplied, then divided the exponents", why: "Multiply → add exponents; divide → subtract them." }),
        x("x^{" + (a + b) + "}", { err: "misread", tr: "ignored the denominator", why: "The $x^{" + cc + "}$ below still divides: subtract " + cc + "." })], 3)),
      hint: "What happens to exponents when powers of the same base multiply? When they divide?",
      strategy: "Multiply → add exponents. Divide → subtract. Power of a power → multiply.",
      walk: W([["x^{" + a + "} \\cdot x^{" + b + "} = x^{" + (a + b) + "}", "Multiplying: add the exponents."], ["\\frac{x^{" + (a + b) + "}}{x^{" + cc + "}} = " + okT, "Dividing: subtract."]]),
      concept: "$x^3 \\cdot x^2$ is $(x \\cdot x \\cdot x)(x \\cdot x)$: five $x$'s. That's why multiplying adds exponents.",
      rebuild: [
        { q: "$x^{" + a + "} \\cdot x^{" + b + "}$ is how many $x$'s multiplied together?", num: a + b, ok: "$x^{" + (a + b) + "}$." },
        { q: "Dividing by $x^{" + cc + "}$ cancels how many of them?", num: cc, ok: "So $" + okT + "$." }],
      autopsy: { clue: "Same base, multiplying and dividing.", remember: "Add when multiplying, subtract when dividing, multiply for a power of a power." }
    };
  }
  function eqvSquares(R) {
    var k = R.int(2, 5), m = R.int(2, 9), A = k * k, B = m * m;
    while (H.gcd(k, m) !== 1) { m = R.int(2, 9); B = m * m; }
    var e = A + "x^2 - " + B;
    return {
      stem: "Which expression is equivalent to $" + e + "$?",
      choices: [x("(" + k + "x - " + m + ")(" + k + "x + " + m + ")", { ok: true }),
        x("(" + k + "x - " + m + ")^2", { err: "concept", tr: "wrote a perfect square instead of a difference of squares", why: "$(" + k + "x - " + m + ")^2$ has a middle term, $-" + (2 * k * m) + "x$. A difference of squares has none." }),
        x("(" + A + "x - " + m + ")(x + " + m + ")", { err: "calc", tr: "split the coefficient wrongly", why: "Expand it: you get a middle term. Both brackets need the square root of " + A + "." }),
        x("(" + k + "x - " + B + ")(" + k + "x + 1)", { err: "concept", tr: "put the whole constant in one bracket", why: "The constant's square root, " + m + ", goes in both brackets." })],
      hint: "Is each term a perfect square?",
      strategy: "$a^2 - b^2 = (a - b)(a + b)$. Here $a = " + k + "x$ and $b = " + m + "$.",
      walk: W([[e + " = (" + k + "x)^2 - " + m + "^2", "Both terms are squares."], ["(" + k + "x - " + m + ")(" + k + "x + " + m + ")", "Difference of squares."]]),
      concept: "$(a - b)(a + b) = a^2 - ab + ab - b^2 = a^2 - b^2$: the middle terms cancel.",
      rebuild: [{ q: "$" + A + "x^2$ is the square of what?", opts: ["$" + k + "x$", "$" + A + "x$", "$" + (A / 2) + "x$"], a: 0, ok: "And " + B + " is " + m + " squared." }, { q: "So $a^2 - b^2$ with $a = " + k + "x$, $b = " + m + "$ factors as…", opts: ["$(" + k + "x - " + m + ")(" + k + "x + " + m + ")$", "$(" + k + "x - " + m + ")^2$"], a: 0, ok: "Difference of squares." }],
      autopsy: { clue: "Two perfect squares with a minus between them.", remember: "$a^2 - b^2 = (a - b)(a + b)$." }
    };
  }
  function eqvTwist(R, diff) {
    if (diff >= 3) {
      var k = R.int(2, 9), sq = 2 * k;
      return {
        stem: "The expression $x^2 + bx + " + (k * k) + "$, where $b$ is a positive constant, is equivalent to $(x + k)^2$ for some constant $k$. What is the value of $b$?",
        answer: sq, shown: String(sq), secs: 110,
        near: [{ v: k, tr: "gave k instead of b" }, { v: k * k, tr: "confused b with the constant" }],
        hint: "Expand $(x + k)^2$. What is its middle term?",
        strategy: "$(x + k)^2 = x^2 + 2kx + k^2$. Match the constants to find $k$, then $b = 2k$.",
        walk: W([["(x + k)^2 = x^2 + 2kx + k^2", "Expand."], ["k^2 = " + (k * k) + " \\Rightarrow k = " + k, "Match the constants ($k > 0$ since $b > 0$)."], ["b = 2k = " + sq, "Match the middle terms."]]),
        concept: "A perfect square trinomial: $(x + k)^2 = x^2 + 2kx + k^2$. The middle term is twice the product.",
        rebuild: [{ q: "What is $k$, if $k^2 = " + (k * k) + "$ and $k > 0$?", num: k, ok: "$k = " + k + "$." }, { q: "The middle term of $(x + k)^2$ is $2kx$. So $b =$", num: sq, ok: "$b = " + sq + "$." }],
        autopsy: { hard: "Matching two expressions that are equal for every $x$.", clue: "\"Equivalent\" — the coefficients must match term by term.", remember: "$(x + k)^2 = x^2 + 2kx + k^2$." }
      };
    }
    var a = R.int(2, 5), b2 = R.nz(-6, 6), c2 = R.int(1, 4), d2 = R.nz(-5, 5);
    // a x (x + b2) + c2 (x + d2) → a x² + (a b2 + c2) x + c2 d2 ; a + b + c = value at x = 1
    var A = a, B = a * b2 + c2, C = c2 * d2, sum = A + B + C;
    return {
      stem: "The expression $" + a + "x(x " + sgn(b2) + ") + " + c2 + "(x " + sgn(d2) + ")$ is equivalent to $ax^2 + bx + c$, where $a$, $b$ and $c$ are constants. What is the value of $a + b + c$?",
      answer: sum, shown: String(sum),
      near: [{ v: A + B, tr: "left out the constant term" }],
      hint: "You could expand it all — or is there a shortcut for $a + b + c$?",
      strategy: "$a + b + c$ is the value of $ax^2 + bx + c$ at $x = 1$. So put $x = 1$ into the original expression.",
      walk: W([[a + "(1)(1 " + sgn(b2) + ") + " + c2 + "(1 " + sgn(d2) + ")", "Put $x = 1$ in: that's $a + b + c$."], [(a * (1 + b2)) + " " + sgn(c2 * (1 + d2)) + " = " + sum, "Work it out."]]),
      concept: "Two equivalent expressions agree for every $x$ — so you can test them at a convenient value like $x = 1$.",
      rebuild: [{ q: "At $x = 1$, $ax^2 + bx + c$ equals…", opts: ["$a + b + c$", "$abc$", "$c$"], a: 0, ok: "So put $x = 1$ into the original." }, { q: "What is $" + a + "(1)(1 " + sgn(b2) + ") + " + c2 + "(1 " + sgn(d2) + ")$?", num: sum, ok: "$a + b + c = " + sum + "$." }],
      autopsy: { hard: "It looks like it needs a full expansion.", clue: "\"$a + b + c$\" — that's the expression at $x = 1$.", remember: "Equivalent expressions agree at every $x$; pick a helpful one." }
    };
  }
  function rootTex(m2, n2) { return n2 === 2 ? "\\sqrt{x" + (m2 === 1 ? "" : "^{" + m2 + "}") + "}" : "\\sqrt[" + n2 + "]{x" + (m2 === 1 ? "" : "^{" + m2 + "}") + "}"; }
  function eqvRatExp(R) {
    var pr = R.pick([[1, 2], [1, 3], [2, 3], [3, 2], [3, 4], [5, 2], [2, 5], [4, 3]]), mm = pr[0], nn = pr[1], neg = R.chance(0.3);
    var e = "x^{" + (neg ? "-" : "") + "\\frac{" + mm + "}{" + nn + "}}", right = neg ? "\\frac{1}{" + rootTex(mm, nn) + "}" : rootTex(mm, nn);
    var ok = x(right, { ok: true });
    return {
      stem: "For $x > 0$, which expression is equivalent to $" + e + "$?",
      choices: [ok].concat(H.distinct(ok, [
        mm > 1 ? x(neg ? "\\frac{1}{" + rootTex(nn, mm) + "}" : rootTex(nn, mm), { err: "formula", tr: "swapped the root and the power", why: "In $x^{\\frac{m}{n}}$ the bottom number is the root and the top is the power: $\\sqrt[n]{x^m}$." }) : null,
        neg ? x("-" + rootTex(mm, nn), { err: "concept", tr: "read a negative exponent as a negative number", why: "A negative exponent means a reciprocal, not a negative: $x^{-a} = \\frac{1}{x^a}$." }) : null,
        x((neg ? "-" : "") + "\\frac{x^{" + mm + "}}{" + nn + "}", { err: "concept", tr: "divided by the denominator instead of taking a root", why: "The " + nn + " in the exponent means a " + (nn === 2 ? "square" : nn === 3 ? "cube" : nn + "th") + " root, not division by " + nn + "." }),
        x((neg ? "-" : "") + "\\frac{" + mm + "}{" + nn + "}x", { err: "concept", tr: "multiplied by the exponent", why: "An exponent isn't a coefficient: $x^{\\frac{" + mm + "}{" + nn + "}}$ is a root of a power, not $\\frac{" + mm + "}{" + nn + "}$ times $x$." }),
        x("x^{" + (mm * nn) + "}", { err: "formula", tr: "multiplied the parts of the exponent", why: "The fraction stays a fraction: top number = power, bottom number = root." })].filter(Boolean), 3)),
      hint: "In a fractional exponent, which number is the root and which is the power?",
      strategy: "$x^{\\frac{m}{n}} = \\sqrt[n]{x^m}$ — \"power over root\". A negative exponent puts it in the denominator.",
      walk: W([[e, "Start."], ["x^{\\frac{" + mm + "}{" + nn + "}} = " + rootTex(mm, nn), "Bottom " + nn + " → the root; top " + mm + " → the power."]].concat(neg ? [[e + " = \\frac{1}{" + rootTex(mm, nn) + "}", "Negative exponent → reciprocal."]] : [])),
      concept: "$x^{\\frac{1}{n}}$ is the number whose $n$th power is $x$ — the $n$th root — because $(x^{\\frac{1}{n}})^n = x^1$. Then $x^{\\frac{m}{n}} = (x^{\\frac{1}{n}})^m$.",
      rebuild: [{ q: "In $x^{\\frac{" + mm + "}{" + nn + "}}$, which number tells you the root?", opts: [String(nn), String(mm)], a: 0, ok: "The denominator, " + nn + "." }, { q: "So $x^{\\frac{" + mm + "}{" + nn + "}}$ is…", opts: ["$" + rootTex(mm, nn) + "$", "$\\frac{x^{" + mm + "}}{" + nn + "}$"], a: 0, ok: neg ? "And the negative exponent puts it under 1." : "Power over root." }],
      autopsy: { clue: "A fraction in the exponent.", remember: "$x^{m/n} = \\sqrt[n]{x^m}$; $x^{-a} = \\frac{1}{x^a}$." }
    };
  }
  function eqvRatExpr(R) {
    var pp = R.nz(-8, 8), qq = R.nz(-8, 8);
    while (pp === qq || pp === -qq) qq = R.nz(-8, 8);
    var num2 = quad(1, pp + qq, pp * qq), ok = x("x " + sgn(qq), { ok: true });
    return {
      stem: "For $x \\ne " + (-pp) + "$, which expression is equivalent to $\\frac{" + num2 + "}{x " + sgn(pp) + "}$?",
      choices: [ok].concat(H.distinct(ok, [
        x("x " + sgn(pp), { err: "calc", tr: "kept the factor that cancels", why: "Factor the top: $(x " + sgn(pp) + ")(x " + sgn(qq) + ")$. The $(x " + sgn(pp) + ")$ cancels with the bottom; $(x " + sgn(qq) + ")$ is left." }),
        x(quad(1, pp + qq, qq), { err: "concept", tr: "cancelled a number inside the terms", why: "Only whole factors cancel. Factor first, then cancel $(x " + sgn(pp) + ")$." }),
        x("x " + sgn(-qq), { err: "calc", tr: "got a sign wrong factoring", why: "$(x " + sgn(pp) + ")(x " + sgn(-qq) + ")$ expands to a different middle term. Check by expanding." }),
        x("x " + sgn(pp + qq), { err: "concept", tr: "divided term by term", why: "You can't divide the pieces of a sum separately by $(x " + sgn(pp) + ")$. Factor the top instead." })], 3)),
      hint: "Can the top be factored — and does one factor match the bottom?",
      strategy: "Factor the numerator, then cancel the factor it shares with the denominator (that's why $x \\ne " + (-pp) + "$).",
      walk: W([["\\frac{" + num2 + "}{x " + sgn(pp) + "}", "Start."], ["\\frac{(x " + sgn(pp) + ")(x " + sgn(qq) + ")}{x " + sgn(pp) + "}", "Factor the top."], ["x " + sgn(qq), "Cancel the common factor."]]),
      concept: "A rational expression simplifies by cancelling common **factors** — never pieces of a sum.",
      rebuild: [{ q: "Factor $" + num2 + "$.", opts: ["$(x " + sgn(pp) + ")(x " + sgn(qq) + ")$", "$(x " + sgn(-pp) + ")(x " + sgn(-qq) + ")$"], a: 0, ok: "One factor matches the bottom." }, { q: "After cancelling, what's left?", opts: ["$x " + sgn(qq) + "$", "$x " + sgn(pp) + "$"], a: 0, ok: "Right." }],
      autopsy: { clue: "A quadratic over a binomial.", remember: "Factor, then cancel factors." }
    };
  }
  var EQV = {
    id: "m-equiv", t: "Equivalent expressions", short: "Equivalent expressions", kind: "Rewrite an expression",
    blurb: "Expand, factor and simplify — brackets, exponents, differences of squares — and spot when two expressions are the same.",
    forms: ["equation", "twist"],
    school: { course: "alg", unit: 13, t: "Algebra I, Unit 13: Quadratics — multiplying & factoring" },
    autopsy: { testing: "Rewriting an expression in an equivalent form", clue: "\"Which expression is equivalent to…\"", remember: "Check an answer by expanding it, or by testing a value of $x$.", spotQ: "Is each of these an equivalent-expressions question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "Which is equivalent to $(2x - 3)^2$?", yes: true, why: "Expand and compare." },
        { t: "What are the solutions of $x^2 - 9 = 0$?", yes: false, why: "That asks for values of $x$ — solving, not rewriting." },
        { t: "$9x^2 - 16$ is equivalent to $(ax - b)(ax + b)$. What is $a$?", yes: true, why: "Rewriting in factored form." }]);
    },
    lesson: [
      { type: "learn", kicker: "Brackets are rectangles",
        prompt: "$(x + 3)(x + 5)$ is the area of a rectangle $x + 3$ tall and $x + 5$ wide. Cut it into pieces:",
        scene: { type: "tiles", mode: "area", rows: ["x", "3"], cols: ["x", "5"], cw: [170, 90], rh: [120, 70], cells: [["x^2", "5x"], ["3x", "15"]], readout: "$(x + 3)(x + 5) = x^2 + 5x + 3x + 15 = x^2 + 8x + 15$" },
        after: "Four pieces: every term times every term. The two middle pieces combine: $5x + 3x = 8x$." },
      { type: "choice", prompt: "Which is equivalent to $(x - 4)(x + 6)$?",
        options: [{ t: "$x^2 + 2x - 24$" }, { t: "$x^2 - 24$", fb: "That skips the middle pieces: $6x$ and $-4x$." }, { t: "$x^2 + 2x + 24$", fb: "$-4 \\times 6 = -24$." }, { t: "$x^2 - 2x - 24$", fb: "$6x - 4x = +2x$." }],
        answer: 0, hints: ["Four products, then combine the $x$ terms."], why: "$x^2 + 6x - 4x - 24 = x^2 + 2x - 24$." },
      { type: "learn", kicker: "Exponent rules, from what they mean",
        prompt: "Don't memorise — count.",
        scene: { type: "walk", rows: [
          { m: "x^3 \\cdot x^2 = x^5", say: "Three $x$'s times two $x$'s is five: **add** the exponents." },
          { m: "\\frac{x^5}{x^2} = x^3", say: "Two of the five cancel: **subtract**." },
          { m: "(x^3)^2 = x^6", say: "Two groups of three: **multiply**." }] }, gate: true },
      { type: "learn", kicker: "Roots are exponents",
        prompt: "A fraction in the exponent is a root: the bottom number is the root, the top is the power.",
        scene: { type: "walk", rows: [
          { m: "x^{\\frac{1}{2}} = \\sqrt{x}", say: "Because $(x^{\\frac{1}{2}})^2 = x$." }, { m: "x^{\\frac{2}{3}} = \\sqrt[3]{x^2}", say: "Power over root." },
          { m: "x^{-2} = \\frac{1}{x^2}", say: "A negative exponent is a reciprocal — not a negative number." }, { m: "\\frac{x^2 + 7x + 12}{x + 3} = x + 4", say: "And fractions of polynomials: factor the top, cancel the shared factor." }] }, gate: true },
      { type: "learn", kicker: "The SAT shortcut",
        prompt: "Two expressions are equivalent if they agree for **every** $x$. So you can test with a number:",
        scene: { type: "walk", rows: [
          { m: "(x + 3)(x + 5) \\overset{?}{=} x^2 + 8x + 15", say: "Try $x = 1$." },
          { m: "4 \\times 6 = 24,\\quad 1 + 8 + 15 = 24", say: "They match. (A wrong choice almost never matches by luck.)" },
          { m: "a + b + c", say: "And $x = 1$ turns $ax^2 + bx + c$ into $a + b + c$ — a favourite SAT question." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "twist") return eqvTwist(R, o.diff);
      var k = R.int(0, 2);
      return o.diff === 1 ? eqvExpand(R) : o.diff === 2 ? [eqvFactor, eqvExp, eqvRatExp][k](R) : (k === 0 ? eqvRatExpr(R) : k === 1 ? eqvRatExp(R) : eqvSquares(R));
    }
  };

  /* ================================================ 2 · Quadratic solutions */
  function quadCommon(R) {
    var k = R.int(2, 6), r = R.nz(-8, 9);
    var e = poly([[k, "x^2"], [-k * r, "x"]]) + " = 0";
    return {
      stem: "What are the solutions to $" + e + "$?",
      choices: [w(pair(0, r), { ok: true }),
        w("$x = " + tex(r) + "$ only", { err: "concept", tr: "divided by x and lost the zero solution", why: "Dividing both sides by $x$ throws away $x = 0$ — and $" + k + "(0)^2 " + sgn(-k * r) + "(0) = 0$ works. Factor instead of dividing." }),
        w(pair(0, -r), { err: "calc", tr: "got the sign of a solution wrong", why: "Check $x = " + (-r) + "$: $" + k + "(" + (-r) + ")^2 " + sgn(-k * r) + "(" + (-r) + ")$ isn't 0." }),
        w(pair(k, k * r === k ? k + 1 : k * r), { err: "misread", tr: "read the coefficients as solutions", why: "The coefficients aren't the solutions. Factor: $" + k + "x(x " + sgn(-r) + ") = 0$." })],
      order: "keep",
      hint: "What do both terms have in common?",
      strategy: "Factor out the common factor, $" + k + "x$. Then a product is 0 when either factor is 0.",
      walk: W([[e, "Start."], [k + "x(x " + sgn(-r) + ") = 0", "Factor out $" + k + "x$."], [k + "x = 0 \\;\\text{or}\\; x " + sgn(-r) + " = 0", "A product is zero when a factor is zero."], ["x = 0 \\;\\text{or}\\; x = " + r, "Both are solutions."]]),
      concept: "The zero product property: if $AB = 0$, then $A = 0$ or $B = 0$. Factoring a quadratic turns one hard equation into two easy ones.",
      rebuild: [
        { q: "Find the idea: what could you factor out of both terms?", opts: ["$" + k + "$", "$" + k + "x$", "$x^2$", "$" + k + "x^2$"], a: 1, ok: "Exactly — both terms have $" + k + "$ and $x$ in them.", no: { 0: "That works, but there's more in common — both terms also have an $x$.", 2: "The second term has only one $x$.", 3: "The second term has only one $x$." } },
        { q: "Now factor the expression: $" + e + "$ becomes…", opts: ["$" + k + "x(x " + sgn(-r) + ") = 0$", "$" + k + "x(x " + sgn(r) + ") = 0$", "$x(" + k + "x " + sgn(r) + ") = 0$"], a: 0, ok: "Check by expanding: it gives back the original." },
        { q: "What does $" + k + "x(x " + sgn(-r) + ") = 0$ tell us?", opts: ["$" + k + "x = 0$ or $x " + sgn(-r) + " = 0$", "Both factors are zero", "Only $x " + sgn(-r) + " = 0$ matters"], a: 0, ok: "So $x = 0$ or $x = " + r + "$." }],
      autopsy: { trap: "Dividing both sides by $x$ and losing $x = 0$.", clue: "No constant term — $x$ is a common factor.", remember: "Never divide by a variable that could be zero. Factor it out." }
    };
  }
  function quadMonic(R, diff) {
    var p = R.nz(-9, 9), q = R.nz(-9, 9);
    while (p === q || p === -q || p * q > 0) { p = R.nz(-9, 9); q = R.nz(-9, 9); }
    var e = quad(1, -(p + q), p * q) + " = 0", big = Math.max(p, q);
    return {
      stem: "What is the positive solution to $" + e + "$?",
      choices: [c(big, { ok: true }),
        c(-big, { err: "calc", tr: "took the number in the factor instead of the solution", why: "The factor $(x " + sgn(-big) + ")$ gives $x = " + big + "$ — the sign flips." }),
        c(Math.min(p, q) > 0 ? Math.min(p, q) : -Math.min(p, q) === big ? big + 1 : -Math.min(p, q), { err: "misread", tr: "gave the other solution with its sign flipped", why: "Solve each factor: $x = " + p + "$ or $x = " + q + "$." }),
        c(p * q > 0 ? p * q : -(p * q), { err: "misread", tr: "read the constant as a solution", why: "The constant is the product of the solutions, not a solution." })],
      hint: "Factor: which two numbers multiply to $" + (p * q) + "$ and add to $" + (-(p + q)) + "$?",
      strategy: "Factor into $(x - r)(x - s)$; the solutions are $r$ and $s$. Or graph it and read the $x$-intercepts.",
      walk: W([[e, "Start."], [fac(p) + fac(q) + " = 0", "Factor: product " + (p * q) + ", sum " + (-(p + q)) + "."], ["x = " + p + " \\;\\text{or}\\; x = " + q, "Each factor zero."], ["x = " + big, "The positive one."]]),
      concept: "Roots, factors, and $x$-intercepts are the same fact three ways: $x = r$ is a root ⇔ $(x - r)$ is a factor ⇔ the graph crosses the $x$-axis at $r$.",
      rebuild: [
        { q: "Which two numbers multiply to $" + (p * q) + "$ and add to $" + (-(p + q)) + "$?", opts: ["$" + (-p) + "$ and $" + (-q) + "$", "$" + p + "$ and $" + q + "$"], a: 0, ok: "So it factors as $" + fac(p) + fac(q) + "$." },
        { q: "When is $" + fac(p) + fac(q) + " = 0$?", opts: ["$x = " + p + "$ or $x = " + q + "$", "$x = " + (-p) + "$ or $x = " + (-q) + "$"], a: 0, ok: "Each factor gives a solution — with the sign flipped from the factor." },
        { q: "The positive solution is…", num: big, ok: "$x = " + big + "$." }],
      autopsy: { trap: "Taking the number inside the factor as the solution.", clue: "\"Positive solution\" — solve fully, then choose.", remember: "$(x - r) = 0$ means $x = r$: the sign flips." }
    };
  }
  function quadDisc(R) {
    var a = R.int(1, 5), b = R.nz(-9, 9), kind = R.pick([0, 1, 2]), cc;
    if (kind === 1) { var r = R.nz(-4, 4); a = 1; b = -2 * r; cc = r * r; }
    else if (kind === 2) cc = R.int(-9, Math.floor(b * b / (4 * a)) - 1);
    else cc = Math.floor(b * b / (4 * a)) + R.int(1, 8);
    var D = b * b - 4 * a * cc, n = D > 0 ? 2 : D === 0 ? 1 : 0;
    var labels = ["Zero", "Exactly one", "Exactly two", "Infinitely many"];
    return {
      stem: "How many distinct real solutions does the equation $" + quad(a, b, cc) + " = 0$ have?",
      choices: labels.map(function (t, i) {
        return i === n ? w(t, { ok: true }) : w(t, { err: i === 3 ? "concept" : "calc", tr: i === 3 ? "thought a quadratic could have infinitely many solutions" : "misjudged the discriminant",
          why: i === 3 ? "A quadratic equation has at most two solutions." : "The discriminant is $b^2 - 4ac = " + (b * b) + " - " + (4 * a * cc < 0 ? "(" + 4 * a * cc + ")" : 4 * a * cc) + " = " + D + "$, which is " + (D > 0 ? "positive: two solutions." : D === 0 ? "zero: one solution." : "negative: no real solutions.") });
      }), order: "keep",
      hint: "You don't have to solve it. What does $b^2 - 4ac$ tell you?",
      strategy: "The discriminant $b^2 - 4ac$: positive → two real solutions, zero → one, negative → none. (Or graph it and count the $x$-intercepts.)",
      walk: W([["b^2 - 4ac = (" + b + ")^2 - 4(" + a + ")(" + cc + ")", "The discriminant."], ["= " + D, D > 0 ? "Positive: two real solutions." : D === 0 ? "Zero: exactly one." : "Negative: none — the square root of a negative isn't real."]]),
      concept: "In the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$, the part under the root decides how many real solutions there are.",
      rebuild: [
        { q: "What is $b^2 - 4ac$ here?", num: D, ok: "The discriminant is " + D + "." },
        { q: "A discriminant of " + D + " means…", opts: ["Two real solutions", "Exactly one", "No real solutions"], a: D > 0 ? 0 : D === 0 ? 1 : 2, ok: "Right." }],
      autopsy: { hard: "Solving would take a while — the question only asks how many.", clue: "\"How many solutions\" for a quadratic → the discriminant.", remember: "$b^2 - 4ac$: + two, 0 one, − none." }
    };
  }
  function quadSum(R) {
    var a = R.int(2, 6), b = R.nz(-20, 20), cc = R.nz(-9, 9);
    while (b * b - 4 * a * cc < 0 || b % a === 0) { b = R.nz(-20, 20); cc = R.nz(-9, 9); }
    var s = -b / a;
    return {
      stem: "What is the sum of the solutions to $" + quad(a, b, cc) + " = 0$?",
      choices: [c(s, { ok: true }),
        c(-s, { err: "formula", tr: "forgot the minus sign in −b/a", why: "The sum of the solutions is $-\\frac{b}{a}$, not $\\frac{b}{a}$." }),
        c(-b, { err: "formula", tr: "forgot to divide by a", why: "With a leading coefficient of " + a + ", divide: $-\\frac{b}{a}$." }),
        c(cc / a, { err: "formula", tr: "used the product of the solutions", why: "$\\frac{c}{a}$ is the product of the solutions. The sum is $-\\frac{b}{a}$." })],
      hint: "Is there a way to get the sum without finding each solution?",
      strategy: "For $ax^2 + bx + c = 0$, the solutions add to $-\\frac{b}{a}$ and multiply to $\\frac{c}{a}$ — no solving needed.",
      walk: W([["x_1 + x_2 = -\\frac{b}{a}", "The two $\\pm$ parts of the quadratic formula cancel when you add."],
        [(b < 0 ? "\\frac{" + (-b) + "}{" + a + "}" : "-\\frac{" + b + "}{" + a + "}") === tex(s) ? "= " + tex(s) : "= " + (b < 0 ? "\\frac{" + (-b) + "}{" + a + "}" : "-\\frac{" + b + "}{" + a + "}") + " = " + tex(s), "Substitute and simplify."]]),
      concept: "In the quadratic formula the $\\pm\\sqrt{\\;}$ parts cancel when the two solutions are added, leaving $\\frac{-2b}{2a} = -\\frac{b}{a}$.",
      rebuild: [{ q: "For $ax^2 + bx + c = 0$, the solutions add to…", opts: ["$-\\frac{b}{a}$", "$\\frac{b}{a}$", "$\\frac{c}{a}$"], a: 0, ok: "No need to solve." }, { q: "Here $a = " + a + "$ and $b = " + b + "$. So the sum is…", opts: ["$" + tex(s) + "$", "$" + tex(-s) + "$"], a: 0, ok: "Done." }],
      autopsy: { hard: "The solutions themselves are messy — the question is built so you don't need them.", clue: "\"Sum of the solutions\".", remember: "Sum $= -\\frac{b}{a}$, product $= \\frac{c}{a}$." }
    };
  }
  function quadGraph(R) {
    var p = R.nz(-5, 3), q = R.nz(-2, 6), a = R.pick([1, -1]);
    while (p === q || p === -q) q = R.nz(-2, 6);
    var cc = a * p * q;
    var lo = Math.min(p, q) - 2, hi = Math.max(p, q) + 2, vx = (p + q) / 2, vy = a * (vx - p) * (vx - q);
    var ylo = Math.min(-2, vy - 1, cc - 1), yhi = Math.max(2, vy + 1, cc + 1);
    return {
      stem: "The graph of $y = f(x)$ is shown, where $f$ is a quadratic function. Which of the following could define $f$?",
      fig: F.graph({ x: [Math.min(lo, -1), Math.max(hi, 1)], y: [Math.floor(ylo), Math.ceil(yhi)], fns: [{ f: function (t) { return a * (t - p) * (t - q); } }],
                     pts: [{ x: p, y: 0 }, { x: q, y: 0 }, { x: 0, y: cc, cls: "r" }], w: 360, every: 1, everyY: Math.ceil(yhi - ylo) > 16 ? 2 : 1 }),
      choices: [x("f(x) = " + (a < 0 ? "-" : "") + fac(p) + fac(q), { ok: true }),
        x("f(x) = " + (a < 0 ? "-" : "") + fac(-p) + fac(-q), { err: "graph", tr: "put the intercepts into the factors with their own signs", why: "An $x$-intercept at $" + p + "$ comes from the factor $(x " + sgn(-p) + ")$ — it's zero when $x = " + p + "$." }),
        x("f(x) = " + (a < 0 ? "" : "-") + fac(p) + fac(q), { err: "graph", tr: "missed which way the parabola opens", why: "The parabola opens " + (a > 0 ? "up" : "down") + ", so the leading coefficient is " + (a > 0 ? "positive." : "negative.") }),
        x("f(x) = " + (a < 0 ? "-" : "") + (cc === q || cc === p ? fac(cc + 2) + fac(p === cc ? q : p) : fac(cc) + fac(p)), { err: "misread", tr: "treated the y-intercept as a root", why: "$(0, " + cc + ")$ is where the graph crosses the $y$-axis — that's $f(0)$, not a solution of $f(x) = 0$." })],
      hint: "Where does the graph cross the $x$-axis? And does it open up or down?",
      strategy: "$x$-intercepts $r$ and $s$ → factors $(x - r)(x - s)$. Opens down → a negative sign in front. Check the $y$-intercept: $f(0)$ should be $" + cc + "$.",
      walk: W([["x = " + p + ",\\; x = " + q, "The $x$-intercepts."], [fac(p) + fac(q), "Each intercept gives a factor — with the sign flipped."], ["f(x) = " + (a < 0 ? "-" : "") + fac(p) + fac(q), "Opens " + (a > 0 ? "up: positive." : "down: negative in front.")], ["f(0) = " + cc + "\\; \\checkmark", "The $y$-intercept checks."]]),
      concept: "The $x$-intercepts of a parabola are the zeros of its function: each zero $r$ means $(x - r)$ is a factor.",
      rebuild: [
        { q: "The graph crosses the $x$-axis at $x = " + p + "$ and $x = " + q + "$. Which factor makes $f(" + p + ") = 0$?", opts: ["$" + fac(p) + "$", "$" + fac(-p) + "$"], a: 0, ok: "Put $x = " + p + "$ in: the factor is 0." },
        { q: "Does the parabola open up or down?", opts: ["Up", "Down"], a: a > 0 ? 0 : 1, ok: a > 0 ? "Positive leading coefficient." : "So there's a minus sign in front." },
        { q: "Which could define $f$?", opts: ["$" + (a < 0 ? "-" : "") + fac(p) + fac(q) + "$", "$" + (a < 0 ? "-" : "") + fac(-p) + fac(-q) + "$"], a: 0, ok: "Right." }],
      autopsy: { hard: "The quadratic isn't presented as an equation — it's a picture.", trap: "Using the $y$-intercept as a root.", clue: "The question is about where the graph crosses the $x$-axis.", remember: "$x$-intercepts → $y = 0$. $y$-intercept → $x = 0$." }
    };
  }
  function quadWord(R) {
    // h(t) = -k(t - r1)(t - r2) = -k t² + k(r1 + r2) t - k r1 r2
    var r1 = R.int(3, 8), r2 = -R.int(1, 2), k = R.pick([16, 5]);
    var B = k * (r1 + r2), C = -k * r1 * r2, unit = k === 16 ? "feet" : "meters";
    return {
      stem: "A ball is thrown upward from a platform. Its height above the ground, in " + unit + ", $t$ seconds after it is thrown is $h(t) = " + poly([[-k, "t^2"], [B, "t"], [C, ""]]) + "$. How many seconds after it is thrown does the ball hit the ground?",
      answer: r1, shown: String(r1), secs: 120,
      near: [{ v: r2, tr: "gave the negative solution" }, { v: (r1 + r2) / 2, tr: "gave the time of the highest point" }, { v: C, tr: "gave the starting height" }],
      hint: "On the ground, the height is 0. So solve $h(t) = 0$.",
      strategy: "Set $h(t) = 0$, factor out $-" + k + "$, and factor what's left. Time can't be negative.",
      walk: W([[poly([[-k, "t^2"], [B, "t"], [C, ""]]) + " = 0", "Ground: height 0."], ["-" + k + "(" + poly([[1, "t^2"], [-(r1 + r2), "t"], [r1 * r2, ""]]) + ") = 0", "Factor out $-" + k + "$."], ["-" + k + "(t - " + r1 + ")(t + " + (-r2) + ") = 0", "Factor."], ["t = " + r1, "$t = " + r2 + "$ is before the throw — it doesn't count."]]),
      concept: "\"When does it hit the ground\" means the height is zero: a zero of the function. Context rules out the negative time.",
      rebuild: [
        { q: "What is the height when the ball hits the ground?", num: 0, ok: "So solve $h(t) = 0$." },
        { q: "$h(t) = -" + k + "(t - " + r1 + ")(t + " + (-r2) + ")$. When is that 0?", opts: ["$t = " + r1 + "$ or $t = " + r2 + "$", "$t = " + (-r1) + "$ or $t = " + (-r2) + "$"], a: 0, ok: "Two solutions of the equation…" },
        { q: "…but which makes sense for time after the throw?", num: r1, ok: "$t = " + r1 + "$ seconds." }],
      autopsy: { trap: "Keeping the negative time.", clue: "\"Hit the ground\" → height 0.", remember: "In context, check each solution makes sense." }
    };
  }
  function quadSqrt(R) {
    var pp = R.nz(-7, 7), qq = R.int(2, 9), a1 = -pp - qq, a2 = -pp + qq;
    return {
      stem: "What are the solutions to $(x " + sgn(pp) + ")^2 = " + (qq * qq) + "$?",
      choices: [w(pair(a1, a2), { ok: true }),
        w("$x = " + a2 + "$ only", { err: "concept", tr: "forgot the negative square root", why: "Both " + qq + " and $-" + qq + "$ square to " + (qq * qq) + ", so $x " + sgn(pp) + " = \\pm " + qq + "$ — two solutions." }),
        w(pair(pp - qq, pp + qq), { err: "calc", tr: "moved the constant with the wrong sign", why: "From $x " + sgn(pp) + " = \\pm " + qq + "$, " + (pp > 0 ? "subtract " + pp : "add " + (-pp)) + ": $x = " + (-pp) + " \\pm " + qq + "$." }),
        w(pair(-pp - qq * qq, -pp + qq * qq), { err: "concept", tr: "didn't take the square root of the right side", why: "Undo the square on the left with a square root on the right: $\\sqrt{" + (qq * qq) + "} = " + qq + "$." })],
      order: "keep",
      hint: "What undoes a square? How many numbers square to " + (qq * qq) + "?",
      strategy: "Take the square root of both sides — and remember $\\pm$: $x " + sgn(pp) + " = \\pm " + qq + "$.",
      walk: W([["(x " + sgn(pp) + ")^2 = " + (qq * qq), "Start."], ["x " + sgn(pp) + " = \\pm " + qq, "Square root of both sides: two options."], ["x = " + a1 + " \\;\\text{or}\\; x = " + a2, (pp > 0 ? "Subtract " + pp : "Add " + (-pp)) + "."]]),
      concept: "Squaring loses the sign, so undoing it gives two answers: if $u^2 = 49$, then $u = 7$ or $u = -7$. (But $\\sqrt{49}$ alone means just 7.)",
      rebuild: [{ q: "Which numbers square to " + (qq * qq) + "?", opts: ["$" + qq + "$ and $-" + qq + "$", "Only $" + qq + "$", "$" + (qq * qq / 2) + "$"], a: 0, ok: "So $x " + sgn(pp) + " = \\pm " + qq + "$." }, { q: "So the solutions are…", opts: [pair(a1, a2), pair(pp - qq, pp + qq)], a: 0, ok: "Two solutions." }],
      autopsy: { trap: "Forgetting the negative root.", clue: "A squared bracket equal to a number.", remember: "$u^2 = k \\Rightarrow u = \\pm\\sqrt{k}$." }
    };
  }
  function quadFormula(R) {
    var h = R.nz(-6, 6), k = R.pick([2, 3, 5, 6, 7, 10, 11, 13]);
    var e = quad(1, -2 * h, h * h - k) + " = 0";
    function sol(a, b, c2) { return "$x = " + a + " \\pm " + (b === 1 ? "" : b) + "\\sqrt{" + c2 + "}$"; }
    return {
      stem: "What are the solutions to $" + e + "$?",
      choices: [w(sol(h, 1, k), { ok: true }),
        w(sol(-h, 1, k), { err: "formula", tr: "dropped the minus in −b", why: "The formula starts with $-b$: here $b = " + (-2 * h) + "$, so $-b = " + (2 * h) + "$." }),
        w(sol(h, 2, k), { err: "calc", tr: "didn't divide the square root by 2a", why: "$\\sqrt{b^2 - 4ac} = \\sqrt{" + (4 * k) + "} = 2\\sqrt{" + k + "}$ — and it's divided by $2a = 2$ too." }),
        w(sol(2 * h, 2, k), { err: "formula", tr: "forgot to divide by 2a", why: "Everything on top is divided by $2a = 2$." })],
      order: "shuffle",
      hint: "It doesn't factor nicely. Which tool always works?",
      strategy: "$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. Radicals in the answer choices are the SAT's hint to use it (or to complete the square).",
      walk: W([["x = \\frac{" + (2 * h) + " \\pm \\sqrt{" + (4 * h * h) + " - 4(" + (h * h - k) + ")}}{2}", "Substitute $a = 1$, $b = " + (-2 * h) + "$, $c = " + (h * h - k) + "$."], ["= \\frac{" + (2 * h) + " \\pm \\sqrt{" + (4 * k) + "}}{2} = \\frac{" + (2 * h) + " \\pm 2\\sqrt{" + k + "}}{2}", "Simplify the root."], ["x = " + h + " \\pm \\sqrt{" + k + "}", "Divide by 2."]]),
      concept: "The quadratic formula is completing the square done once in general — it solves every quadratic, factorable or not.",
      rebuild: [{ q: "What are $a$, $b$ and $c$? What is $-b$?", num: 2 * h, ok: "$-b = " + (2 * h) + "$." }, { q: "What is the discriminant $b^2 - 4ac$?", num: 4 * k, ok: "$\\sqrt{" + (4 * k) + "} = 2\\sqrt{" + k + "}$." }, { q: "Divide everything by $2a = 2$. The solutions are…", opts: [sol(h, 1, k), sol(h, 2, k)], a: 0, ok: "Right." }],
      autopsy: { hard: "It doesn't factor over the integers.", clue: "Square roots in the answer choices.", remember: "$-b$, and divide ALL of the top by $2a$." }
    };
  }
  var QUAD = {
    id: "m-quad", t: "Quadratics: solutions & factors", short: "Quadratic solutions", kind: "Quadratic: solutions & roots",
    blurb: "Solve quadratics by factoring, read roots from a graph, count solutions with the discriminant, and use $-\\frac{b}{a}$ when only the sum is asked.",
    forms: ["equation", "graph", "word", "twist"], pace: 1.1,
    school: { course: "alg", unit: 14, t: "Algebra I, Unit 14: Quadratic functions & equations" },
    autopsy: { testing: "Quadratic equations: roots, factors and zeros", clue: "An $x^2$ term, and a question about solutions or $x$-intercepts.", remember: "Root ⇔ factor ⇔ $x$-intercept.", spotQ: "Is each of these about a quadratic's solutions?" },
    spot: function (R) {
      var r = R.int(2, 7);
      return R.shuffle([
        { t: "Where does the graph of $y = x^2 - " + (r * r) + "$ cross the $x$-axis?", yes: true, why: "$x$-intercepts are solutions of $x^2 - " + (r * r) + " = 0$." },
        { t: "A ball's height is $h = -16t^2 + 48t$. When is it back on the ground?", yes: true, why: "Height 0: a quadratic's solutions." },
        { t: "What is the $y$-intercept of $y = x^2 - " + r + "x + 6$?", yes: false, why: "That's $f(0) = 6$ — a value of the function, not a solution." }]);
    },
    lesson: [
      { type: "learn", kicker: "Zero is special",
        prompt: "If two numbers multiply to **zero**, one of them must be zero. That one fact solves quadratics.",
        scene: { type: "walk", rows: [
          { m: "2x^2 - 8x = 0", say: "Hard to solve as it is." },
          { m: "2x(x - 4) = 0", say: "Factor out what both terms share: $2x$." },
          { m: "2x = 0 \\;\\text{or}\\; x - 4 = 0", say: "A product is 0 only if a factor is 0." },
          { m: "x = 0 \\;\\text{or}\\; x = 4", say: "Two solutions. Dividing by $x$ at the start would have lost $x = 0$." }] }, gate: true },
      { type: "learn", kicker: "See it",
        prompt: "The solutions are where the parabola crosses the $x$-axis. Slide $r$ and $s$ — the factors in the equation move with the crossings.",
        scene: { type: "plane", x: [-6, 6], y: [-8, 8], params: { r: { v: -2, min: -5, max: 5, step: 1, label: "$r$" }, s: { v: 3, min: -5, max: 5, step: 1, label: "$s$" } },
                 fns: [{ f: "(x - r)*(x - s)", color: "blue" }], marks: [{ x: function (p) { return p.r; }, y: 0, label: function (p) { return "x = " + p.r; }, color: "orange" }, { x: function (p) { return p.s; }, y: 0, label: function (p) { return "x = " + p.s; }, color: "orange" }],
                 readout: function (s) { function f(v) { return v === 0 ? "x" : "(x " + (v < 0 ? "+ " + (-v) : "- " + v) + ")"; } return "$y = " + f(s.params.r) + f(s.params.s) + "$ crosses the $x$-axis at $x = " + s.params.r + "$ and $x = " + s.params.s + "$."; } },
        gate: true, then: "A root $r$ ⇔ a factor $(x - r)$ ⇔ an $x$-intercept at $r$. The sign flips between the factor and the root." },
      { type: "choice", prompt: "What are the solutions to $x^2 - 3x - 10 = 0$?",
        options: [{ t: "$x = -2$ and $x = 5$" }, { t: "$x = 2$ and $x = -5$", fb: "Those are the numbers inside the factors $(x + 2)(x - 5)$. The solutions flip their signs." }, { t: "$x = -10$ only", fb: "$-10$ is the product of the solutions, not a solution." }, { t: "$x = 3$ and $x = -10$", fb: "The coefficients aren't solutions. Factor first." }],
        answer: 0, hints: ["Which two numbers multiply to $-10$ and add to $-3$?"], why: "$(x + 2)(x - 5) = 0$, so $x = -2$ or $x = 5$." },
      { type: "learn", kicker: "Two shortcuts",
        prompt: "Sometimes the SAT asks about solutions without wanting them:",
        scene: { type: "walk", rows: [
          { m: "b^2 - 4ac", say: "**How many** real solutions? Positive → 2, zero → 1, negative → 0." },
          { m: "-\\frac{b}{a}", say: "**Sum** of the solutions — no solving needed." },
          { m: "\\frac{c}{a}", say: "**Product** of the solutions." }] }, gate: true },
      { type: "learn", kicker: "When it won't factor",
        prompt: "Two more ways in:",
        scene: { type: "walk", rows: [
          { m: "(x + 3)^2 = 49 \\Rightarrow x + 3 = \\pm 7", say: "Square-root both sides — **two** answers: $x = 4$ or $x = -10$." },
          { m: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", say: "The quadratic formula always works." },
          { m: "x^2 - 6x + 4 = 0 \\Rightarrow x = 3 \\pm \\sqrt{5}", say: "Radicals in the choices are a hint to use it." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "graph") return quadGraph(R);
      if (o.form === "word") return quadWord(R);
      if (o.form === "twist") return o.diff >= 3 ? quadSum(R) : quadDisc(R);
      var k = R.int(0, 2);
      return o.diff === 1 ? quadCommon(R) : o.diff === 2 ? (k === 2 ? quadSqrt(R) : quadMonic(R, 2)) : [quadDisc, quadSum, quadFormula][k](R);
    }
  };

  /* ========================================== 3 · Parabolas and the vertex */
  function vtxForm(R, diff) {
    var a = R.pick([1, 2, 3, -1, -2, 0.5]), h = R.nz(-6, 6), k = R.nz(-9, 9);
    while (h === k || h === -k) k = R.nz(-9, 9);
    var e = (a === 1 ? "" : a === -1 ? "-" : tex(a)) + "(x " + sgn(-h) + ")^2 " + sgn(k);
    return {
      stem: "The function $f$ is defined by $f(x) = " + e + "$. What are the coordinates of the vertex of the graph of $y = f(x)$ in the $xy$-plane?",
      choices: [x("(" + h + ", " + k + ")", { ok: true }),
        x("(" + (-h) + ", " + k + ")", { err: "formula", tr: "took the sign inside the brackets as the vertex's x", why: "$(x " + sgn(-h) + ")^2$ is smallest when $x = " + h + "$ — the sign flips." }),
        x("(" + k + ", " + h + ")", { err: "misread", tr: "swapped the coordinates", why: "The $x$-coordinate comes from inside the brackets; the $y$-coordinate is the number added outside." }),
        x("(" + h + ", " + (-k) + ")", { err: "calc", tr: "flipped the sign of k", why: "At $x = " + h + "$, $f(" + h + ") = " + k + "$." })],
      hint: "When is $(x " + sgn(-h) + ")^2$ as small as it can be?",
      strategy: "In vertex form $a(x - h)^2 + k$ the vertex is $(h, k)$. Watch the sign: $(x + 3)^2$ means $h = -3$.",
      walk: W([["(x " + sgn(-h) + ")^2 = 0 \\;\\text{when}\\; x = " + h, "The squared part is never negative, and it's 0 here."], ["f(" + h + ") = " + k, "What's left is $k$."], ["(" + h + ", " + k + ")", "The vertex."]]),
      concept: "A square is never negative, so $a(x - h)^2$ is 0 at $x = h$ and grows on both sides: that turning point is the vertex, $(h, k)$.",
      rebuild: [{ q: "For what $x$ is $(x " + sgn(-h) + ")^2 = 0$?", num: h, ok: "The vertex's $x$-coordinate is $" + h + "$." }, { q: "What is $f(" + h + ")$?", num: k, ok: "So the vertex is $(" + h + ", " + k + ")$." }],
      autopsy: { trap: "The sign of $h$.", clue: "Vertex form: $(x - h)^2$.", remember: "$(x + 3)^2$ → $h = -3$." }
    };
  }
  function vtxStd(R, diff) {
    var a = R.pick([1, 1, 2, -1]), h = R.nz(-5, 5), k = R.nz(-12, 12);
    var b = -2 * a * h, cc = a * h * h + k, max = a < 0;
    return {
      stem: "The function $f$ is defined by $f(x) = " + quad(a, b, cc) + "$. What is the " + (max ? "maximum" : "minimum") + " value of $f(x)$?",
      choices: [c(k, { ok: true }),
        c(h === k ? h + 1 : h, { err: "misread", tr: "gave the x-coordinate of the vertex", why: "$x = " + h + "$ is where the " + (max ? "maximum" : "minimum") + " happens. The value is $f(" + h + ")$." }),
        c(cc === k ? cc + 2 : cc, { err: "misread", tr: "gave the y-intercept", why: "$" + cc + "$ is $f(0)$, where the graph crosses the $y$-axis — not the " + (max ? "top" : "bottom") + " of the parabola." }),
        c(a * h * h - b * h + cc === k ? k - 3 : a * h * h - b * h + cc, { err: "formula", tr: "used x = b/2a instead of −b/2a", why: "The vertex is at $x = -\\frac{b}{2a} = " + h + "$." })],
      hint: "Where is the vertex? Its $x$-coordinate is $-\\frac{b}{2a}$.",
      strategy: "Find $x = -\\frac{b}{2a}$, then put it into $f$ to get the " + (max ? "maximum" : "minimum") + " value. (Or graph it and tap the vertex.)",
      walk: W([["x = -\\frac{" + b + "}{2(" + a + ")} = " + h, "The vertex's $x$."], ["f(" + h + ") = " + k, "The " + (max ? "maximum" : "minimum") + " value is the vertex's $y$."]]),
      concept: "A parabola's lowest (or highest) point is its vertex. The value asked for is the $y$-coordinate there.",
      rebuild: [{ q: "What is $-\\frac{b}{2a}$ for this function?", num: h, ok: "The vertex is at $x = " + h + "$." }, { q: "What is $f(" + h + ")$?", num: k, ok: "The " + (max ? "maximum" : "minimum") + " value is $" + k + "$." }],
      autopsy: { hard: "Standard form hides the vertex.", trap: "Giving the $x$-coordinate, or the $y$-intercept.", clue: "\"Minimum value of $f(x)$\" is a $y$-value.", remember: "Vertex at $x = -\\frac{b}{2a}$; the value is $f$ there." }
    };
  }
  function vtxK(R) {
    var a = R.pick([2, 3, -2]), h = R.nz(-4, 4), k = R.nz(-15, 15);
    var b = -2 * a * h, cc = a * h * h + k;
    return {
      stem: "The function $f(x) = " + quad(a, b, cc) + "$ can be written as $f(x) = " + a + "(x - h)^2 + k$, where $h$ and $k$ are constants. What is the value of $k$?",
      answer: k, shown: String(k), secs: 125,
      near: [{ v: h, tr: "gave h instead of k" }, { v: cc, tr: "gave the constant of the standard form" }],
      hint: "$k$ is the value of $f$ at the vertex.",
      strategy: "Find the vertex: $h = -\\frac{b}{2a} = " + h + "$, then $k = f(h)$. Completing the square works too, but this is faster.",
      walk: W([["h = -\\frac{" + b + "}{2(" + a + ")} = " + h, "The vertex's $x$."], ["k = f(" + h + ") = " + a + "(" + h + ")^2 " + sgn(b) + "(" + h + ") " + sgn(cc) + " = " + k, "Its $y$."]]),
      concept: "Vertex form and standard form describe the same parabola; the vertex is $(h, k)$ either way.",
      rebuild: [{ q: "What is $h = -\\frac{b}{2a}$?", num: h, ok: "$h = " + h + "$." }, { q: "Then $k = f(" + h + ") =$", num: k, ok: "$k = " + k + "$." }],
      autopsy: { hard: "Converting forms looks like a lot of algebra.", clue: "$k$ is just $f(h)$.", remember: "Find $h$ with $-\\frac{b}{2a}$; then $k = f(h)$." }
    };
  }
  function vtxGraph(R) {
    var a = R.pick([1, -1, 2, -2, 0.5]), h = R.nz(-4, 4), k = R.nz(-5, 5);
    while (Math.abs(h) === Math.abs(k)) k = R.nz(-5, 5);
    var e = function (hh, kk, aa) { return "f(x) = " + (aa === 1 ? "" : aa === -1 ? "-" : tex(aa)) + "(x " + sgn(-hh) + ")^2 " + sgn(kk); };
    var ylo = Math.min(k - 6, -2), yhi = Math.max(k + 6, 2);
    return {
      stem: "The graph of the quadratic function $f$ is shown. Which equation could define $f$?",
      fig: F.graph({ x: [h - 5, h + 5].map(function (v, i) { return i ? Math.max(v, 1) : Math.min(v, -1); }), y: [Math.floor(ylo), Math.ceil(yhi)], fns: [{ f: function (t) { return a * (t - h) * (t - h) + k; } }], pts: [{ x: h, y: k, label: "(" + h + ", " + k + ")" }], w: 360, everyY: yhi - ylo > 14 ? 2 : 1 }),
      choices: [x(e(h, k, a), { ok: true }),
        x(e(-h, k, a), { err: "graph", tr: "flipped the sign of h", why: "The vertex is at $x = " + h + "$, which needs $(x " + sgn(-h) + ")^2$." }),
        x(e(h, k, -a), { err: "graph", tr: "missed which way it opens", why: "It opens " + (a > 0 ? "up" : "down") + ", so $a$ is " + (a > 0 ? "positive" : "negative") + "." }),
        x(e(k, h, a), { err: "misread", tr: "swapped h and k", why: "$h$ is the vertex's $x$-coordinate (inside the brackets); $k$ is its $y$-coordinate." })],
      hint: "Read the vertex, and see which way the parabola opens.",
      strategy: "Vertex $(h, k)$ → $a(x - h)^2 + k$. Opens down → $a < 0$.",
      walk: W([["(" + h + ", " + k + ")", "The vertex from the graph."], [e(h, k, a), "Vertex form, opening " + (a > 0 ? "up" : "down") + "."]]),
      concept: "Vertex form puts the graph's most important point right in the equation.",
      rebuild: [{ q: "The vertex is $(" + h + ", " + k + ")$. Which bracket has its zero at $x = " + h + "$?", opts: ["$(x " + sgn(-h) + ")^2$", "$(x " + sgn(h) + ")^2$"], a: 0, ok: "The sign flips." }, { q: "It opens…", opts: ["up: $a > 0$", "down: $a < 0$"], a: a > 0 ? 0 : 1, ok: "So the equation is $" + e(h, k, a) + "$." }],
      autopsy: { clue: "The vertex is marked.", remember: "Vertex $(h, k)$ → $(x - h)^2 + k$." }
    };
  }
  function vtxModel(R) {
    var t0 = R.int(1, 3), k = 16, h0 = R.int(3, 40), top = k * t0 * t0 + h0;
    var B = 2 * k * t0;
    return {
      stem: "A ball is kicked into the air. Its height, in feet, $t$ seconds after it is kicked is modeled by $h(t) = -16t^2 + " + B + "t + " + h0 + "$. What is the maximum height of the ball, in feet?",
      choices: [c(top, { ok: true }),
        c(t0, { err: "misread", tr: "gave the time of the maximum, not the height", why: "The maximum happens at $t = " + t0 + "$ s; the height then is $h(" + t0 + ")$." }),
        c(h0, { err: "misread", tr: "gave the starting height", why: "$" + h0 + "$ ft is the height when $t = 0$." }),
        c(B + h0, { err: "calc", tr: "evaluated at t = 1 instead of at the vertex", why: "That's $h(1)$. The maximum is at $t = -\\frac{b}{2a} = " + t0 + "$." })],
      hint: "When is the ball highest? Use the vertex.",
      strategy: "The vertex is at $t = -\\frac{b}{2a} = -\\frac{" + B + "}{2(-16)} = " + t0 + "$. The maximum height is $h(" + t0 + ")$.",
      walk: W([["t = -\\frac{" + B + "}{2(-16)} = " + t0, "Time of the highest point."], ["h(" + t0 + ") = -16(" + (t0 * t0) + ") + " + (B * t0) + " + " + h0 + " = " + top, "Height then."]]),
      concept: "For a quadratic model, the vertex gives the maximum (or minimum): its first coordinate is when, its second is how much.",
      rebuild: [{ q: "At what time $t$ is the ball highest?", num: t0, ok: "$t = " + t0 + "$ s." }, { q: "What is $h(" + t0 + ")$?", num: top, ok: top + " feet." }],
      autopsy: { trap: "Answering with the time instead of the height.", clue: "\"Maximum height\" is a value of $h$.", remember: "Vertex: $t$ tells when, $h(t)$ tells how high." }
    };
  }
  function vtxAxis(R) {
    var pp = R.nz(-8, 6), qq = R.nz(-4, 10);
    while (pp === qq || pp === -qq || (pp + qq) % 2) qq = R.nz(-4, 10);
    var mid = (pp + qq) / 2, a = R.pick([1, 2, -1, -3]);
    return {
      stem: "The function $f$ is defined by $f(x) = " + (a === 1 ? "" : a === -1 ? "-" : a) + fac(pp) + fac(qq) + "$. What is the $x$-coordinate of the vertex of the graph of $y = f(x)$?",
      choices: [c(mid, { ok: true }),
        c(-mid, { err: "calc", tr: "used the signs inside the factors", why: "The zeros are $x = " + pp + "$ and $x = " + qq + "$ — the signs flip from the factors." }),
        c(pp + qq, { err: "calc", tr: "forgot to halve", why: "The vertex is halfway between the zeros: their average." }),
        c((pp - qq) / 2 === mid ? mid + 3 : (qq - pp) / 2, { err: "concept", tr: "took half the distance between the zeros", why: "That's how far each zero is from the vertex, not where the vertex is." })],
      hint: "Where are the zeros? Where is the vertex relative to them?",
      strategy: "A parabola is symmetric: its vertex is exactly halfway between its two $x$-intercepts, $x = \\frac{r + s}{2}$.",
      walk: W([["x = " + pp + ",\\; x = " + qq, "The zeros (flip the signs)."], ["\\frac{" + pp + " + " + (qq < 0 ? "(" + qq + ")" : qq) + "}{2} = " + tex(mid), "Halfway between them."]]),
      concept: "The axis of symmetry passes through the vertex, halfway between the zeros — so factored form shows the vertex's $x$ at a glance.",
      rebuild: [{ q: "What are the zeros of $f$?", opts: ["$" + pp + "$ and $" + qq + "$", "$" + (-pp) + "$ and $" + (-qq) + "$"], a: 0, ok: "Sign flipped from the factors." }, { q: "The vertex is halfway between them, at $x =$", num: mid, ok: "$x = " + tex(mid) + "$." }],
      autopsy: { clue: "Factored form and a question about the vertex.", remember: "Vertex $x$ = average of the zeros." }
    };
  }
  var VTX = {
    id: "m-vertex", t: "Quadratics: graphs & the vertex", short: "Parabolas", kind: "Parabola: vertex & graph",
    blurb: "Read the vertex from vertex form, find it with $-\\frac{b}{2a}$, match a parabola to its equation, and find maximums in real models.",
    forms: ["equation", "graph", "model", "twist"], pace: 1.1,
    school: { course: "alg", unit: 14, t: "Algebra I, Unit 14: Quadratic functions & equations" },
    autopsy: { testing: "The vertex and shape of a parabola", clue: "A quadratic, and a question about its highest or lowest point, or its graph.", remember: "Vertex form $a(x - h)^2 + k$; vertex at $x = -\\frac{b}{2a}$.", spotQ: "Is each of these about a parabola's vertex or shape?" },
    spot: function (R) {
      return R.shuffle([
        { t: "What is the minimum value of $f(x) = x^2 - 6x + 11$?", yes: true, why: "The vertex's $y$-value." },
        { t: "A rocket's height is $h(t) = -5t^2 + 40t$. What is its greatest height?", yes: true, why: "Maximum → vertex." },
        { t: "What are the solutions of $x^2 - 6x + 8 = 0$?", yes: false, why: "That's about the roots, not the vertex." }]);
    },
    lesson: [
      { type: "learn", kicker: "Play with it",
        prompt: "Vertex form: $y = a(x - h)^2 + k$. Slide $h$, $k$ and $a$ and watch the vertex.",
        scene: { type: "plane", x: [-7, 7], y: [-7, 7], params: { a: { v: 1, min: -2, max: 2, step: 0.5, label: "$a$" }, h: { v: 2, min: -4, max: 4, step: 1, label: "$h$" }, k: { v: -3, min: -5, max: 5, step: 1, label: "$k$" } },
                 fns: [{ f: "a*(x - h)^2 + k", color: "blue" }], marks: [{ x: function (p) { return p.h; }, y: function (p) { return p.k; }, label: function (p) { return "vertex (" + p.h + ", " + p.k + ")"; }, color: "orange" }],
                 readout: function (s) { var p = s.params; return p.a === 0 ? "With $a = 0$ it isn't a parabola any more." : "$y = " + (p.a === 1 ? "" : p.a === -1 ? "-" : p.a) + "(x " + (p.h < 0 ? "+ " + (-p.h) : "- " + p.h) + ")^2 " + (p.k < 0 ? "- " + (-p.k) : "+ " + p.k) + "$: vertex $(" + p.h + ", " + p.k + ")$, opens " + (p.a > 0 ? "up." : "down."); } },
        gate: true, then: "$h$ moves it left and right — and $(x - 2)$ means $h = +2$. $k$ moves it up and down. $a$'s sign says which way it opens." },
      { type: "learn", kicker: "When the vertex is hidden",
        prompt: "In standard form $ax^2 + bx + c$ the vertex isn't visible. One formula finds it:",
        scene: { type: "walk", rows: [
          { m: "f(x) = x^2 - 6x + 5", say: "Standard form." }, { m: "x = -\\frac{b}{2a} = -\\frac{-6}{2} = 3", say: "The vertex's $x$." },
          { m: "f(3) = 9 - 18 + 5 = -4", say: "Its $y$: the minimum value." }] }, gate: true },
      { type: "num", prompt: "What is the minimum value of $f(x) = x^2 + 4x + 10$?", answer: 6,
        near: [{ v: -2, fb: "That's where the minimum happens. The value is $f(-2)$." }, { v: 10, fb: "That's $f(0)$, the $y$-intercept." }],
        hints: ["$x = -\\frac{4}{2} = -2$.", "Now find $f(-2)$."], why: "$f(-2) = 4 - 8 + 10 = 6$." },
      { type: "learn", kicker: "Halfway between the zeros",
        prompt: "A parabola is symmetric, so its vertex sits exactly halfway between its $x$-intercepts.",
        scene: { type: "walk", rows: [
          { m: "f(x) = (x - 2)(x - 8)", say: "Zeros at 2 and 8." }, { m: "x = \\frac{2 + 8}{2} = 5", say: "The vertex's $x$ — the axis of symmetry." }, { m: "f(5) = (3)(-3) = -9", say: "And its $y$: the minimum." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "graph") return vtxGraph(R);
      if (o.form === "model") return vtxModel(R);
      if (o.form === "twist") return o.diff >= 3 ? vtxK(R) : vtxAxis(R);
      return o.diff === 1 ? vtxForm(R) : o.diff === 2 ? vtxStd(R) : vtxK(R);
    }
  };

  /* ============================================= 4 · Exponential functions */
  function expMeaning(R, diff) {
    var P0 = R.pick([1200, 2500, 8000, 15000, 40000]), pc = R.pick([2, 3, 4, 5, 6, 8, 12, 15]), up = R.chance(0.6);
    var f = up ? 1 + pc / 100 : 1 - pc / 100, fs = num(f);
    var what = up ? R.pick([["The population of a town", "people", "years", "t"], ["The number of followers of an account", "followers", "months", "m"]]) : R.pick([["The value of a car", "dollars", "years", "t"], ["The amount of a medicine in the blood", "milligrams", "hours", "h"]]);
    var v = what[3], L0 = /car/.test(what[0]) ? "V" : /medicine/.test(what[0]) ? "A" : /followers/.test(what[0]) ? "F" : "P", fn = L0 + "(" + v + ") = " + H.bigm(P0) + "(" + fs + ")^{" + v + "}";
    return {
      stem: what[0] + " is modeled by $" + fn + "$, where $" + v + "$ is the number of " + what[2] + " since the start. Which statement is the best interpretation of $" + fs + "$ in this context?",
      choices: [w("Each " + what[2].replace(/s$/, "") + ", the amount " + (up ? "increases" : "decreases") + " by " + pc + "%.", { ok: true }),
        w("Each " + what[2].replace(/s$/, "") + ", the amount " + (up ? "increases" : "decreases") + " by " + fs + "%.", { err: "misread", tr: "read the growth factor as the percent", why: "A factor of " + fs + " keeps " + num(f * 100) + "% each time — a change of " + pc + "%." }),
        w("Each " + what[2].replace(/s$/, "") + ", the amount " + (up ? "increases" : "decreases") + " by " + H.commas(Math.round(P0 * pc / 100)) + " " + what[1] + ".", { err: "concept", tr: "treated exponential change as a constant amount", why: "That's the first " + what[2].replace(/s$/, "") + "'s change only. Exponential change is the same **percent** each time, so the amount changes." }),
        w("The starting amount is " + fs + " " + what[1] + ".", { err: "concept", tr: "confused the growth factor with the starting value", why: "The starting value is " + H.commas(P0) + " (the value at $" + v + " = 0$)." })],
      hint: "What does multiplying by " + fs + " do to an amount?",
      strategy: "In $a(b)^t$: $a$ is the start, $b$ is the growth factor. $b = 1 + r$ for growth, $1 - r$ for decay, with $r$ the percent as a decimal.",
      walk: W([[fs + " = 1 " + (up ? "+" : "-") + " " + num(pc / 100), "Growth factor = 1 ± rate."], [num(pc / 100) + " = " + pc + "\\%", "The rate as a percent."], [up ? "\\text{up } " + pc + "\\% \\text{ each " + what[2].replace(/s$/, "") + "}" : "\\text{down } " + pc + "\\% \\text{ each " + what[2].replace(/s$/, "") + "}", "Every " + what[2].replace(/s$/, "") + " it's multiplied by " + fs + " again."]]),
      concept: "Exponential functions change by the same **percent** each step (multiplying); linear functions change by the same **amount** (adding).",
      rebuild: [{ q: "Multiplying by " + fs + " is the same as keeping what percent?", num: f * 100, ok: num(f * 100) + "% of the amount." }, { q: "So each " + what[2].replace(/s$/, "") + " it changes by what percent?", num: pc, ok: pc + "% " + (up ? "up" : "down") + "." }],
      autopsy: { trap: "Reading " + fs + " as " + fs + "%.", clue: "The base of the exponent is the growth factor.", remember: "Factor $1 + r$: up $r$; factor $1 - r$: down $r$." }
    };
  }
  function expBuild(R, diff) {
    var V0 = R.pick([18000, 24000, 30000, 42000]), pc = R.pick([10, 12, 15, 20, 25]), f = 1 - pc / 100;
    return {
      stem: "A new car is worth " + money(V0) + ". Its value decreases by " + pc + "% each year. Which function gives the car's value, in dollars, $t$ years after it is new?",
      choices: [x("V(t) = " + H.bigm(V0) + "(" + num(f) + ")^t", { ok: true }),
        x("V(t) = " + H.bigm(V0) + "(" + num(pc / 100) + ")^t", { err: "concept", tr: "used the percent lost instead of the percent kept", why: "Losing " + pc + "% leaves " + (100 - pc) + "%, so each year multiply by " + num(f) + "." }),
        x("V(t) = " + H.bigm(V0) + "(" + num(1 + pc / 100) + ")^t", { err: "misread", tr: "modeled growth instead of decay", why: "The value decreases, so the factor is less than 1." }),
        x("V(t) = " + H.bigm(V0) + " - " + num(pc / 100) + "t", { err: "concept", tr: "used a linear model for a percent change", why: "A constant percent change is exponential: multiply each year, don't subtract a fixed amount." })],
      hint: "After one year, what fraction of its value does the car keep?",
      strategy: "Decay by $r$ → multiply by $1 - r$ each period: $V_0(1 - r)^t$.",
      walk: W([["1 - " + num(pc / 100) + " = " + num(f), "Kept each year."], ["V(t) = " + H.bigm(V0) + "(" + num(f) + ")^t", "Start value times the factor, $t$ times."]]),
      concept: "\"Decreases by the same percent each year\" is exponential decay: $V_0(1 - r)^t$.",
      rebuild: [{ q: "If the car loses " + pc + "% in a year, what percent of its value is left?", num: 100 - pc, ok: (100 - pc) + "%, a factor of " + num(f) + "." }, { q: "So the function is…", opts: ["$" + H.bigm(V0) + "(" + num(f) + ")^t$", "$" + H.bigm(V0) + "(" + num(pc / 100) + ")^t$"], a: 0, ok: "Right." }],
      autopsy: { trap: "Using " + num(pc / 100) + " (what's lost) as the factor.", clue: "\"Decreases by " + pc + "% each year\".", remember: "Factor = what's kept: $1 - r$." }
    };
  }
  function expTable(R, diff) {
    var a = R.int(2, 6), b = R.pick([2, 3, 4]);
    while (a === b) a = R.int(2, 6);
    var xs = [0, 1, 2, 3], ys = xs.map(function (t) { return a * Math.pow(b, t); });
    return {
      stem: "The table shows values of $x$ and $f(x)$ for the function $f$. Which equation could define $f$?",
      fig: F.table({ head: ["$x$", "$f(x)$"], rows: xs.map(function (t, i) { return ["$" + t + "$", "$" + ys[i] + "$"]; }) }),
      choices: [x("f(x) = " + a + "(" + b + ")^x", { ok: true }),
        x("f(x) = " + b + "(" + a + ")^x", { err: "concept", tr: "swapped the starting value and the factor", why: "At $x = 0$ the value is " + a + ", so the starting value is " + a + ". Each step multiplies by " + b + "." }),
        x("f(x) = " + (ys[1] - ys[0]) + "x + " + a, { err: "concept", tr: "treated the table as linear", why: "The differences aren't constant: " + (ys[1] - ys[0]) + ", " + (ys[2] - ys[1]) + ", " + (ys[3] - ys[2]) + ". The **ratios** are: each value is " + b + " times the last." }),
        x("f(x) = " + a + "x^" + b, { err: "concept", tr: "put the variable in the base instead of the exponent", why: "At $x = 0$ that gives 0, not " + a + "." })],
      hint: "Compare each $f(x)$ with the one before it — by subtracting, then by dividing.",
      strategy: "Constant differences → linear. Constant ratios → exponential $a \\cdot b^x$ with $a = f(0)$ and $b$ = the ratio.",
      walk: W([[ys[1] + " \\div " + ys[0] + " = " + b + ",\\; " + ys[2] + " \\div " + ys[1] + " = " + b, "Constant ratio: exponential."], ["f(0) = " + a, "Starting value."], ["f(x) = " + a + "(" + b + ")^x", "Put together."]]),
      concept: "A linear pattern adds the same amount each step; an exponential pattern multiplies by the same factor.",
      rebuild: [{ q: "What do you multiply each value by to get the next?", num: b, ok: "A constant ratio — exponential." }, { q: "What is $f(0)$?", num: a, ok: "So $f(x) = " + a + "(" + b + ")^x$." }],
      autopsy: { clue: "Differences grow; ratios stay the same.", remember: "Adding → linear. Multiplying → exponential." }
    };
  }
  function expPeriod(R) {
    var T = R.pick([3, 4, 5, 6, 8, 10]), A0 = R.pick([200, 500, 800, 1000, 1200]), half = R.chance(0.5);
    var base = half ? "\\frac{1}{2}" : "2";
    return {
      stem: "The amount of a substance is modeled by $A(t) = " + H.bigm(A0) + "\\left(" + base + "\\right)^{\\frac{t}{" + T + "}}$, where $t$ is in days. Every how many days does the amount " + (half ? "halve" : "double") + "?",
      answer: T, shown: String(T), secs: 100,
      near: [{ v: 1 / T, tr: "inverted the period" }, { v: 2, tr: "read the base as the period" }],
      hint: "How much must $t$ grow for the exponent to go up by 1?",
      strategy: "The exponent is $\\frac{t}{" + T + "}$: it goes up by 1 each time $t$ goes up by " + T + " — one more factor of " + (half ? "½" : "2") + ".",
      walk: W([["\\frac{t}{" + T + "} = 1 \\;\\text{when}\\; t = " + T, "One full factor."], ["A(" + T + ") = " + H.bigm(A0) + "(" + base + ")^1", "It has " + (half ? "halved" : "doubled") + "."]]),
      concept: "In $a \\cdot b^{t/T}$, the amount is multiplied by $b$ once every $T$ units of time.",
      rebuild: [{ q: "For what $t$ does $\\frac{t}{" + T + "}$ equal 1?", num: T, ok: "So every " + T + " days, one factor of " + (half ? "½" : "2") + "." }],
      autopsy: { clue: "The fraction in the exponent sets the period.", remember: "$b^{t/T}$: multiplied by $b$ every $T$." }
    };
  }
  var EXP = {
    id: "m-exp", t: "Exponential functions", short: "Exponentials", kind: "Exponential growth or decay",
    blurb: "Tell exponential from linear, build $a(1 \\pm r)^t$ from a percent change, read the growth factor, and find a doubling or half-life.",
    forms: ["model", "table", "equation", "twist"],
    school: { course: "alg", unit: 12, t: "Algebra I, Unit 12: Exponential growth & decay" },
    autopsy: { testing: "Exponential growth and decay", clue: "A variable in the exponent, or a percent change each period.", remember: "Same percent each step → exponential: $a(1 \\pm r)^t$.", spotQ: "Is each of these exponential?" },
    spot: function (R) {
      return R.shuffle([
        { t: "A bank account earns 4% interest each year. What is it worth after 10 years?", yes: true, why: "Same percent each year → exponential." },
        { t: "A plant grows 2 cm every week.", yes: false, why: "Same **amount** each week → linear." },
        { t: "Bacteria double every 3 hours.", yes: true, why: "Doubling is multiplying by 2 each period." }]);
    },
    lesson: [
      { type: "learn", kicker: "Adding vs multiplying",
        prompt: "Two ways to grow. Drag the slider to $n = 8$ and watch who wins.",
        scene: { type: "bars", n: 8, start: 1, label: "step $n$", series: [{ f: "10 + 10*n", label: "add 10 each step" }, { f: "2^n", label: "double each step" }] },
        gate: true, then: "Adding the same amount is **linear**. Multiplying by the same factor is **exponential** — slow at first, then enormous." },
      { type: "learn", kicker: "Reading $a(b)^t$",
        prompt: "Every exponential model has a start and a factor.",
        scene: { type: "walk", rows: [
          { m: "P(t) = 5\\text{,}000(1.04)^t", say: "A town of 5,000 growing 4% a year." },
          { m: "5\\text{,}000", say: "The starting value: $P(0)$." },
          { m: "1.04 = 1 + 0.04", say: "The **growth factor**: keep 100%, add 4%." },
          { m: "V(t) = 20\\text{,}000(0.85)^t", say: "Decay: losing 15% leaves 85% → factor 0.85." }] }, gate: true },
      { type: "choice", prompt: "A town's population is $P(t) = 8\\text{,}000(0.97)^t$. What happens each year?",
        options: [{ t: "It decreases by 3%" }, { t: "It decreases by 97%", fb: "It **keeps** 97%, so it loses 3%." }, { t: "It increases by 0.97%", fb: "A factor below 1 means decrease." }, { t: "It decreases by 240 people every year", fb: "That's only the first year. The amount lost shrinks as the town shrinks — 3% each time." }],
        answer: 0, hints: ["$0.97 = 1 - 0.03$."], why: "Factor $0.97$: 97% kept, 3% lost each year." }
    ],
    gen: function (R, o) {
      if (o.form === "model") return o.diff >= 2 ? expBuild(R, o.diff) : expMeaning(R, o.diff);
      if (o.form === "table") return expTable(R, o.diff);
      if (o.form === "twist") return expPeriod(R);
      return o.diff >= 3 ? expPeriod(R) : expMeaning(R, o.diff);
    }
  };

  /* ============================== 5 · Nonlinear equations and systems */
  function nlRadical(R, diff) {
    if (diff === 1) {
      var a = R.int(-9, 12), b = R.int(2, 9), xv = b * b - a;
      return {
        stem: "What is the solution to the equation $\\sqrt{x " + sgn(a) + "} = " + b + "$?",
        choices: [c(xv, { ok: true }),
          c(b - a, { err: "concept", tr: "forgot to square both sides", why: "To undo a square root, square both sides: $x " + sgn(a) + " = " + (b * b) + "$." }),
          c(b * b + a, { err: "calc", tr: "moved the constant with the wrong sign", why: "From $x " + sgn(a) + " = " + (b * b) + "$, " + (a > 0 ? "subtract " + a : "add " + (-a)) + "." }),
          c(2 * b - a, { err: "formula", tr: "doubled instead of squaring", why: "Squaring " + b + " gives " + (b * b) + ", not " + (2 * b) + "." })],
        hint: "What undoes a square root?",
        strategy: "Square both sides, then solve the linear equation. Check the answer in the original.",
        walk: W([["\\sqrt{x " + sgn(a) + "} = " + b, "Start."], ["x " + sgn(a) + " = " + (b * b), "Square both sides."], ["x = " + xv, "Solve."]]),
        concept: "Squaring undoes a square root. Because squaring can create answers that don't work, always check.",
        rebuild: [{ q: "Square both sides. What is $x " + sgn(a) + "$?", num: b * b, ok: "$" + b + "^2 = " + (b * b) + "$." }, { q: "So $x =$", num: xv, ok: "Check: $\\sqrt{" + (xv + a) + "} = " + b + "$ ✓." }],
        autopsy: { clue: "A square root equal to a number.", remember: "Square both sides, then check." }
      };
    }
    var d = R.int(1, 5), r = d + R.int(1, 5), r2 = 2 * d + 1 - r;
    while (r2 - d >= 0 || d * d - r * r2 === 0) { r++; r2 = 2 * d + 1 - r; }
    var cc = d * d - r * r2;
    return {
      stem: "What are all the solutions to the equation $\\sqrt{x " + sgn(cc) + "} = x - " + d + "$?",
      choices: [w("$x = " + r + "$ only", { ok: true }),
        w(pair(r2, r), { err: "concept", tr: "kept an extraneous solution", why: "Check $x = " + r2 + "$: the left side is $\\sqrt{" + (r2 + cc) + "} = " + Math.sqrt(r2 + cc) + "$ but the right side is $" + (r2 - d) + "$. A square root is never negative, so $x = " + r2 + "$ fails." }),
        w("$x = " + r2 + "$ only", { err: "calc", tr: "kept the wrong solution", why: "$x = " + r2 + "$ makes the right side negative, which a square root can't equal." }),
        w("There are no solutions.", { err: "concept", tr: "threw out a solution that works", why: "Check $x = " + r + "$: $\\sqrt{" + (r + cc) + "} = " + (r - d) + "$ ✓." })],
      order: "keep",
      hint: "Square both sides — but a square root can't equal a negative number. Check every answer you get.",
      strategy: "Square both sides, solve the quadratic, then check each solution in the ORIGINAL equation. Or graph both sides and see where they meet.",
      walk: W([["x " + sgn(cc) + " = (x - " + d + ")^2", "Square both sides."], [quad(1, -(2 * d + 1), d * d - cc) + " = 0", "Expand and collect."], [(r2 === 0 ? "x" + fac(r) : fac(r) + fac(r2)) + " = 0", "Factor."], ["x = " + r + " \\;\\checkmark,\\quad x = " + r2 + " \\;\\times", "Check both: $x = " + r2 + "$ gives $" + Math.sqrt(r2 + cc) + " = " + (r2 - d) + "$, false."]]),
      concept: "Squaring both sides can create an extraneous solution — one that solves the squared equation but not the original. A square root is never negative.",
      rebuild: [
        { q: "After squaring and solving, you get $x = " + r + "$ and $x = " + r2 + "$. Check $x = " + r2 + "$: is $\\sqrt{" + (r2 + cc) + "} = " + (r2 - d) + "$?", opts: ["Yes", "No"], a: 1, ok: "A square root can't equal " + (r2 - d) + "." },
        { q: "Check $x = " + r + "$: is $\\sqrt{" + (r + cc) + "} = " + (r - d) + "$?", opts: ["Yes", "No"], a: 0, ok: "So only $x = " + r + "$ works." }],
      autopsy: { hard: "Squaring made a second solution appear that doesn't work.", trap: "Keeping the extraneous solution.", clue: "\"All the solutions\" + a square root → check each one.", remember: "After squaring, always substitute back into the original." }
    };
  }
  function nlSystem(R, diff) {
    var p = R.nz(-4, 4), q = R.nz(-3, 5), m = R.nz(-3, 3), n = R.int(-5, 5);
    while (p === q) q = R.nz(-3, 5);
    // parabola y = x^2 + bx + c, line y = mx + n, intersect at x = p, q: x^2 + (b - m)x + (c - n) = (x - p)(x - q)
    var b = m - (p + q), cc = n + p * q;
    var yp = m * p + n, yq = m * q + n;
    return {
      stem: "$$y = " + quad(1, b, cc) + "$$$$y = " + H.lin(m, n) + "$$Which of the following is a solution $(x, y)$ to the system of equations above?",
      choices: (function () {
        var ok = x("(" + p + ", " + yp + ")", { ok: true });
        var roots = [], D = b * b - 4 * cc;
        if (D >= 0) roots = [(-b + Math.sqrt(D)) / 2, (-b - Math.sqrt(D)) / 2].filter(function (t) { return Math.abs(t - Math.round(t)) < 1e-9; });
        return [ok].concat(H.distinct(ok, [
          x("(" + yp + ", " + p + ")", { err: "misread", tr: "swapped the coordinates", why: "The first coordinate is $x$. Check: at $x = " + yp + "$ the two equations give different $y$-values." }),
          roots.length ? x("(" + roots[0] + ", 0)", { err: "concept", tr: "set the parabola equal to zero instead of to the line", why: "That's where the parabola meets the $x$-axis. A solution of the system is where it meets the **line**." }) : null,
          x("(" + p + ", " + (p * p + b * p + cc + 1) + ")", { err: "calc", tr: "an arithmetic slip finding y", why: "At $x = " + p + "$ both equations give $y = " + yp + "$." }),
          x("(" + (-p) + ", " + (m * -p + n) + ")", { err: "calc", tr: "a sign slip solving the quadratic", why: "At $x = " + (-p) + "$ the parabola and the line give different $y$-values." }),
          x("(0, " + n + ")", { err: "misread", tr: "used the line's y-intercept", why: "$(0, " + n + ")$ is on the line, but not on the parabola unless it's also $(0, " + cc + ")$." }),
          x("(" + p + ", " + (yp + 2) + ")", { err: "calc", tr: "an arithmetic slip finding y", why: "At $x = " + p + "$ the line gives $y = " + yp + "$." }),
          x("(" + (p + 1) + ", " + (m * (p + 1) + n) + ")", { err: "calc", tr: "checked only the line", why: "That point is on the line, but not on the parabola — a solution has to be on both." }),
          x("(0, " + cc + ")", { err: "misread", tr: "used the parabola's y-intercept", why: "$(0, " + cc + ")$ is on the parabola, but not on the line." })],
          3, function (ch) { var mm = /\((-?[\d.\/]+), (-?[\d.\/]+)\)/.exec(ch.t); if (!mm) return true; var X = +mm[1], Y = +mm[2]; return !(Math.abs(Y - (X * X + b * X + cc)) < 1e-9 && Math.abs(Y - (m * X + n)) < 1e-9); }));
      })(),
      hint: "At a solution, both equations give the same $y$. Set them equal.",
      strategy: "Substitute: $" + quad(1, b, cc) + " = " + H.lin(m, n) + "$, solve for $x$, then find $y$. Or test each choice in both equations — or graph both.",
      walk: W([[quad(1, b, cc) + " = " + H.lin(m, n), "Same $y$: set them equal."], [quad(1, b - m, cc - n) + " = 0", "Collect."], [fac(p) + fac(q) + " = 0", "Factor."], ["x = " + p + " \\Rightarrow y = " + yp, "One solution: $(" + p + ", " + yp + ")$ (the other is $(" + q + ", " + yq + ")$)."]]),
      concept: "A solution of a system is a point on both graphs. For a line and a parabola there can be 0, 1 or 2.",
      rebuild: [{ q: "Setting the two expressions for $y$ equal gives $" + quad(1, b - m, cc - n) + " = 0$. What are its solutions?", opts: ["$x = " + p + "$ or $x = " + q + "$", "$x = " + (-p) + "$ or $x = " + (-q) + "$"], a: 0, ok: "Two $x$-values where the graphs meet." }, { q: "At $x = " + p + "$, what is $y$ (use the line)?", num: yp, ok: "So $(" + p + ", " + yp + ")$ is a solution." }],
      autopsy: { hard: "One equation is quadratic, so substitution gives a quadratic to solve.", clue: "Both equations are solved for $y$.", remember: "Set equal, solve, then find $y$ — or test the choices." }
    };
  }
  function nlRational(R) {
    var X = R.int(3, 12), D2 = R.int(1, Math.max(1, X - 1)), num1 = R.int(2, 9), mult = R.int(2, 4), q = num1 * mult, rr = (X - D2) * mult;
    var g = H.gcd(q, rr);
    return {
      stem: "What value of $x$ satisfies the equation $\\frac{" + num1 + "}{x - " + D2 + "} = \\frac{" + (q / g) + "}{" + (rr / g) + "}$?",
      answer: X, shown: String(X),
      near: [{ v: X - 2 * D2, tr: "moved the constant with the wrong sign" }],
      hint: "Cross-multiply.",
      strategy: "Cross-multiply: $" + num1 + " \\cdot " + (rr / g) + " = " + (q / g) + "(x - " + D2 + ")$, then solve. (Check $x \\ne " + D2 + "$.)",
      walk: W([[(num1 * rr / g) + " = " + (q / g) + "(x - " + D2 + ")", "Cross-multiply."], ["x - " + D2 + " = " + tex(num1 * rr / q), "Divide by " + (q / g) + "."], ["x = " + X, "Add " + D2 + "."]]),
      concept: "Two equal fractions: cross-multiplying clears both denominators at once. A value that makes a denominator zero can't be a solution.",
      rebuild: [{ q: "Cross-multiply: $" + num1 + " \\cdot " + (rr / g) + " =$", num: num1 * rr / g, ok: "$= " + (q / g) + "(x - " + D2 + ")$." }, { q: "So $x - " + D2 + " =$", num: X - D2, ok: "$x = " + X + "$." }],
      autopsy: { clue: "Fraction = fraction.", remember: "Cross-multiply, then solve; exclude values that make a denominator 0." }
    };
  }
  function nlAbs(R, diff) {
    var k = diff >= 3 ? 2 : 1, a = R.nz(-6, 8), b = R.int(1, 9), none = diff >= 3 && R.chance(0.35);
    if (k === 2 && (a + b) % 2) b++;
    if (none) {
      var cst = R.int(3, 9), rhs = cst - R.int(1, 5);
      return {
        stem: "How many solutions does the equation $|x " + sgn(-a) + "| + " + cst + " = " + rhs + "$ have?",
        choices: ["Zero", "Exactly one", "Exactly two", "Infinitely many"].map(function (t, i) { return i === 0 ? w(t, { ok: true }) : w(t, { err: "concept", tr: "missed that an absolute value can't be negative", why: "Subtract " + cst + ": $|x " + sgn(-a) + "| = " + (rhs - cst) + "$. An absolute value is a distance — never negative — so nothing works." }); }),
        order: "keep",
        hint: "Isolate the absolute value first. What can an absolute value never be?",
        strategy: "Get $|\\ldots|$ alone. If it equals a negative number, there's no solution; if 0, one; if positive, two.",
        walk: W([["|x " + sgn(-a) + "| = " + (rhs - cst), "Subtract " + cst + "."], ["|u| \\ge 0", "An absolute value is never negative: no solution."]]),
        concept: "$|u|$ is the distance from $u$ to 0, so it can't be negative.",
        rebuild: [{ q: "After subtracting " + cst + ", $|x " + sgn(-a) + "|$ equals…", num: rhs - cst, ok: "A negative number." }, { q: "Can a distance be negative?", opts: ["No", "Yes"], a: 0, ok: "So there are no solutions." }],
        autopsy: { clue: "An absolute value equal to a negative.", remember: "$|u| = $ negative → no solution." }
      };
    }
    var s1 = (a * k - b) / k, s2 = (a * k + b) / k, inner = k === 1 ? "x " + sgn(-a) : "2x " + sgn(-a * 2);
    return {
      stem: "What are all the solutions to $|" + inner + "| = " + b + "$?",
      choices: [w(pair(s1, s2), { ok: true }),
        w("$x = " + tex(s2) + "$ only", { err: "concept", tr: "forgot the negative case", why: "Two numbers have absolute value " + b + ": " + b + " and $-" + b + "$. Solve both $" + inner + " = " + b + "$ and $" + inner + " = -" + b + "$." }),
        w(pair(-s1, -s2), { err: "calc", tr: "solved with the sign inside flipped", why: "Check one: put it into $|" + inner + "|$ — it doesn't give " + b + "." }),
        w(pair((-b - a * k) / k, s2), { err: "calc", tr: "a sign slip in the negative case", why: "From $" + inner + " = -" + b + "$: " + (k === 1 ? "$x = " + a + " - " + b + " = " + tex(s1) + "$." : "$2x = " + (2 * a) + " - " + b + "$, so $x = " + tex(s1) + "$.") })],
      order: "keep",
      hint: "Which two numbers have an absolute value of " + b + "?",
      strategy: "Split into two equations: $" + inner + " = " + b + "$ or $" + inner + " = -" + b + "$. (Or think distance: $x$ is " + tex(b / k) + " away from " + a + ".)",
      walk: W([[inner + " = " + b + " \\;\\text{or}\\; " + inner + " = -" + b, "Two cases."], ["x = " + tex(s2) + " \\;\\text{or}\\; x = " + tex(s1), "Solve each."]]),
      concept: "$|u| = b$ (with $b > 0$) means $u$ is $b$ away from zero — on either side — so there are two solutions.",
      rebuild: [{ q: "Which values can $" + inner + "$ equal?", opts: ["$" + b + "$ or $-" + b + "$", "Only $" + b + "$"], a: 0, ok: "Two cases." }, { q: "Solving the negative case gives $x =$", num: s1, shown: tex(s1), ok: "And the positive case gives " + tex(s2) + "." }],
      autopsy: { trap: "Losing the negative case.", clue: "Absolute value bars equal to a positive number.", remember: "$|u| = b$: $u = b$ or $u = -b$." }
    };
  }
  function nlPoly(R, graph) {
    var pp = R.nz(-3, 3), qq = R.nz(-3, 3);
    while (qq === pp || qq === -pp) qq = R.nz(-3, 3);
    if (!graph) {
      return {
        stem: "The function $f$ is defined by $f(x) = " + fac(pp) + fac(qq) + "^2$. At which value of $x$ does the graph of $y = f(x)$ touch the $x$-axis without crossing it?",
        choices: [c(qq, { ok: true }),
          c(pp, { err: "concept", tr: "picked a zero that crosses", why: "$x = " + pp + "$ comes from a factor used once: the graph passes through the axis there." }),
          c(-qq, { err: "calc", tr: "flipped the sign of the zero", why: "$" + fac(qq) + " = 0$ when $x = " + qq + "$." }),
          c(-pp, { err: "calc", tr: "flipped the sign of the zero", why: "The zeros are the values that make a factor 0 — signs flip from the factors." })],
        hint: "Which factor appears twice?",
        strategy: "A zero from a squared factor (even multiplicity) touches and turns; a zero from a factor used once crosses.",
        walk: W([[fac(pp) + " \\Rightarrow x = " + pp, "Used once: crosses."], [fac(qq) + "^2 \\Rightarrow x = " + qq, "Used twice: touches and turns back."]]),
        concept: "Near a double zero, the squared factor is never negative, so the graph stays on one side — it touches the axis and turns.",
        rebuild: [{ q: "Which factor is squared?", opts: ["$" + fac(qq) + "$", "$" + fac(pp) + "$"], a: 0, ok: "Its zero repeats." }, { q: "That factor is zero when $x =$", num: qq, ok: "The graph touches there." }],
        autopsy: { clue: "A squared factor.", remember: "Even multiplicity touches; odd crosses." }
      };
    }
    var fn = function (t) { return 0.35 * (t - pp) * (t - qq) * (t - qq); };
    function e(u, v) { return "f(x) = k" + fac(u) + fac(v) + "^2"; }
    var ok = x(e(pp, qq), { ok: true });
    return {
      stem: "The graph of the polynomial function $f$ is shown. Which of the following could define $f$, where $k$ is a positive constant?",
      fig: F.graph({ x: [-5, 5], y: [-6, 6], fns: [{ f: fn }], pts: [{ x: pp, y: 0 }, { x: qq, y: 0 }], w: 340 }),
      choices: [ok].concat(H.distinct(ok, [
        x(e(qq, pp), { err: "graph", tr: "swapped which zero repeats", why: "The graph touches the axis at $x = " + qq + "$ and crosses at $x = " + pp + "$: the squared factor goes with the touch." }),
        x("f(x) = k" + fac(-pp) + fac(-qq) + "^2", { err: "graph", tr: "put the zeros into the factors with their own signs", why: "A zero at $x = " + pp + "$ comes from $" + fac(pp) + "$." }),
        x("f(x) = k" + fac(pp) + fac(qq), { err: "concept", tr: "missed the touch at the repeated zero", why: "With each factor used once, the graph would cross at both zeros. It only touches at $x = " + qq + "$." })], 3)),
      hint: "Where does the graph cross the axis, and where does it only touch?",
      strategy: "Crossing zero → factor to the first power. Touching zero → squared factor. Then flip signs to write the factors.",
      walk: W([["x = " + pp + "\\ (\\text{crosses}),\\ x = " + qq + "\\ (\\text{touches})", "Read the zeros and how the graph meets the axis."], [e(pp, qq), "Squared factor at the touch."]]),
      concept: "The zeros of a polynomial and how the graph meets the axis there tell you its factors and their multiplicities.",
      rebuild: [{ q: "At which zero does the graph only touch the axis?", num: qq, ok: "That factor is squared." }, { q: "So the factors are…", opts: ["$" + fac(pp) + fac(qq) + "^2$", "$" + fac(qq) + fac(pp) + "^2$"], a: 0, ok: "Right." }],
      autopsy: { hard: "Matching a polynomial's graph to its factors.", clue: "Touch versus cross at the zeros.", remember: "Touch = even power; cross = odd." }
    };
  }
  var NL = {
    id: "m-nonlin", t: "Nonlinear equations & systems", short: "Nonlinear equations", kind: "Nonlinear equation or system",
    blurb: "Radical and rational equations (and the extraneous solutions they can hide), and systems where a line meets a parabola.",
    forms: ["equation", "twist", "graph"], pace: 1.15,
    school: { course: "alg", unit: 14, t: "Algebra I, Unit 14: Quadratic functions & equations" },
    autopsy: { testing: "Nonlinear equations and systems", clue: "A square root, a variable in a denominator, or an $x^2$ in a system.", remember: "Square or cross-multiply to simplify — then check every solution.", spotQ: "Is each of these a nonlinear equation or system?" },
    spot: function (R) {
      return R.shuffle([
        { t: "Solve $\\sqrt{2x + 3} = x$.", yes: true, why: "A radical equation — check for extraneous solutions." },
        { t: "Where do $y = x^2$ and $y = x + 6$ meet?", yes: true, why: "A line and a parabola: a nonlinear system." },
        { t: "Solve $3x + 2y = 7$ and $x - y = 4$.", yes: false, why: "Both linear — a linear system." }]);
    },
    lesson: [
      { type: "learn", kicker: "Undo the root — then check",
        prompt: "Square both sides to undo a square root. But squaring can invent answers.",
        scene: { type: "walk", rows: [
          { m: "\\sqrt{x + 2} = x", say: "Start." }, { m: "x + 2 = x^2", say: "Square both sides." },
          { m: "(x - 2)(x + 1) = 0", say: "Solve: $x = 2$ or $x = -1$." },
          { m: "\\sqrt{4} = 2 \\;\\checkmark \\quad \\sqrt{1} \\ne -1", say: "Check both. $x = -1$ is **extraneous**: a square root is never negative." }] }, gate: true },
      { type: "learn", kicker: "A line meets a parabola",
        prompt: "Solutions of a system are where the graphs meet. Drag the line's intercept $n$ and watch how many meeting points there are.",
        scene: { type: "plane", x: [-5, 5], y: [-3, 9], params: { n: { v: 2, min: -3, max: 6, step: 0.5, label: "$n$" } },
                 fns: [{ f: "x^2", color: "blue", label: "y = x²" }, { f: "x + n", color: "red" }],
                 readout: function (s) { var D = 1 + 4 * s.params.n; return "$x^2 = x + " + s.params.n + "$ has " + (D > 0 ? "**two** solutions" : D === 0 ? "**one** solution" : "**no** real solutions") + " — the graphs meet " + (D > 0 ? "twice." : D === 0 ? "once (the line just touches)." : "nowhere."); } },
        gate: true, then: "Set the two expressions equal and you get a quadratic. Its number of solutions is the number of meeting points." },
      { type: "learn", kicker: "Two more kinds",
        prompt: "Absolute value and factored polynomials:",
        scene: { type: "walk", rows: [
          { m: "|x - 3| = 5", say: "$x$ is 5 away from 3 — on either side." }, { m: "x = 8 \\;\\text{or}\\; x = -2", say: "Always two cases (none if it equals a negative)." },
          { m: "f(x) = (x + 1)(x - 2)^2", say: "Zeros at $-1$ and 2." }, { m: "\\text{crosses at } -1,\\ \\text{touches at } 2", say: "A squared factor touches the axis and turns back." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "twist") return o.diff === 1 ? nlRational(R) : o.diff === 2 ? nlPoly(R, false) : nlRadical(R, 3);
      if (o.form === "graph") return o.diff >= 3 ? nlPoly(R, true) : nlSystem(R, o.diff);
      return o.diff === 1 ? (R.chance(0.5) ? nlRadical(R, 1) : nlAbs(R, 1)) : o.diff === 2 ? (R.chance(0.5) ? nlSystem(R, 2) : nlAbs(R, 2)) : (R.chance(0.5) ? nlRadical(R, 3) : nlAbs(R, 3));
    }
  };

  /* ================================= 6 · Functions and transformations */
  function fnEval(R) {
    var a = R.pick([1, 2, 3]), b = R.nz(-6, 6), cc = R.int(-9, 9), k = -R.int(1, 5);
    var val = a * k * k + b * k + cc;
    return {
      stem: "The function $f$ is defined by $f(x) = " + quad(a, b, cc) + "$. What is the value of $f(" + k + ")$?",
      choices: [c(val, { ok: true }),
        c(-a * k * k + b * k + cc, { err: "calc", tr: "squared the negative number wrong", why: "$(" + k + ")^2 = " + (k * k) + "$ — squaring a negative gives a positive." }),
        c(a * k * k - b * k + cc, { err: "calc", tr: "lost a sign multiplying by a negative", why: "$" + b + " \\times (" + k + ") = " + (b * k) + "$." }),
        c(a * 2 * k + b * k + cc, { err: "formula", tr: "doubled instead of squaring", why: "$x^2$ means $x \\cdot x$, not $2x$." })],
      hint: "Replace every $x$ with $(" + k + ")$ — brackets included.",
      strategy: "Substitute with brackets: $" + a + "(" + k + ")^2 " + sgn(b) + "(" + k + ") " + sgn(cc) + "$. Squares first.",
      walk: W([["f(" + k + ") = " + (a === 1 ? "" : a) + "(" + k + ")^2 " + sgn(b) + "(" + k + ") " + sgn(cc), "Substitute."], [(a * k * k) + " " + sgn(b * k) + " " + sgn(cc), "Square, multiply."], [String(val), "Add."]]),
      concept: "$f(" + k + ")$ is the output when the input is $" + k + "$. Brackets keep the negative sign where it belongs.",
      rebuild: [{ q: "What is $(" + k + ")^2$?", num: k * k, ok: "Positive." }, { q: "What is $" + b + " \\times (" + k + ")$?", num: b * k, ok: "Now add everything." }, { q: "$f(" + k + ") =$", num: val, ok: "Done." }],
      autopsy: { trap: "Squaring a negative input.", clue: "A negative input into a square.", remember: "Substitute with brackets." }
    };
  }
  function fnCompose(R) {
    var a = R.int(2, 5), b = R.nz(-5, 5), cc = R.int(1, 4), k = R.int(1, 4);
    var f = function (t) { return a * t + b; }, g = function (t) { return t * t - cc; };
    var val = f(g(k));
    return {
      stem: "The functions $f$ and $g$ are defined by $f(x) = " + H.lin(a, b) + "$ and $g(x) = x^2 - " + cc + "$. What is the value of $f(g(" + k + "))$?",
      choices: [c(val, { ok: true }),
        c(g(f(k)), { err: "concept", tr: "composed the functions in the wrong order", why: "Work from the inside out: first $g(" + k + ")$, then put that into $f$." }),
        c(f(k) * g(k), { err: "concept", tr: "multiplied the functions instead of composing", why: "$f(g(" + k + "))$ puts $g(" + k + ")$ into $f$ — it isn't $f(" + k + ") \\times g(" + k + ")$." }),
        c(f(k) + g(k), { err: "concept", tr: "added the functions instead of composing", why: "Composition feeds one output into the other function." })],
      hint: "Start inside: what is $g(" + k + ")$?",
      strategy: "Inside out: $g(" + k + ") = " + g(k) + "$, then $f(" + g(k) + ")$.",
      walk: W([["g(" + k + ") = " + (k * k) + " - " + cc + " = " + g(k), "Inside first."], ["f(" + g(k) + ") = " + a + "(" + g(k) + ") " + sgn(b) + " = " + val, "Then outside."]]),
      concept: "$f(g(x))$ is a machine chain: $x$ goes into $g$, and $g$'s output goes into $f$.",
      rebuild: [{ q: "What is $g(" + k + ")$?", num: g(k), ok: "That's the input for $f$." }, { q: "What is $f(" + g(k) + ")$?", num: val, ok: "Done." }],
      autopsy: { trap: "Working outside-in.", clue: "Nested brackets: $f(g(\\cdot))$.", remember: "Inside out." }
    };
  }
  function fnShift(R) {
    var h = R.nz(-5, 5), k = R.nz(-6, 6);
    while (Math.abs(h) === Math.abs(k)) k = R.nz(-6, 6);
    function e(hh, kk) { return "y = f(x " + sgn(-hh) + ") " + sgn(kk); }
    var lr = h > 0 ? "right" : "left", ud = k > 0 ? "up" : "down";
    return {
      stem: "The graph of $y = f(x)$ is shifted " + Math.abs(h) + " units to the " + lr + " and " + Math.abs(k) + " units " + ud + ". Which equation represents the new graph?",
      choices: [x(e(h, k), { ok: true }),
        x(e(-h, k), { err: "concept", tr: "shifted the wrong way horizontally", why: "Inside the brackets works backwards: moving " + lr + " by " + Math.abs(h) + " means $f(x " + sgn(-h) + ")$ — at $x = " + h + "$ the new graph shows what $f$ had at 0." }),
        x(e(k, h), { err: "misread", tr: "swapped the horizontal and vertical shifts", why: "The horizontal shift goes inside the brackets; the vertical one outside." }),
        x(e(h, -k), { err: "calc", tr: "shifted the wrong way vertically", why: "Outside the brackets works as it looks: " + ud + " " + Math.abs(k) + " is $" + sgn(k) + "$." })],
      hint: "A shift inside the brackets works the opposite way to how it looks. Outside, it works as it looks.",
      strategy: "Right $h$ → $f(x - h)$; left $h$ → $f(x + h)$; up $k$ → $+k$; down $k$ → $-k$.",
      walk: W([["f(x " + sgn(-h) + ")", lr.charAt(0).toUpperCase() + lr.slice(1) + " " + Math.abs(h) + ": inside, opposite sign."], ["f(x " + sgn(-h) + ") " + sgn(k), ud.charAt(0).toUpperCase() + ud.slice(1) + " " + Math.abs(k) + ": outside, same sign."]]),
      concept: "$f(x - h)$ reaches the same outputs $h$ units later, so the graph moves right by $h$.",
      rebuild: [{ q: "To move the graph " + lr + " " + Math.abs(h) + ", the inside becomes…", opts: ["$x " + sgn(-h) + "$", "$x " + sgn(h) + "$"], a: 0, ok: "Opposite to how it looks." }, { q: "To move it " + ud + " " + Math.abs(k) + ", add…", opts: ["$" + sgn(k).replace("+ ", "+") + "$ outside", "$" + sgn(-k).replace("+ ", "+") + "$ outside"], a: 0, ok: "So $" + e(h, k) + "$." }],
      autopsy: { trap: "Moving the wrong way horizontally.", clue: "Shifts: inside = horizontal (backwards), outside = vertical.", remember: "$f(x - 3)$ moves right 3." }
    };
  }
  function fnTable(R) {
    var xs = [-1, 0, 1, 2, 3, 4, 5, 6], vals = xs.map(function () { return R.int(-6, 12); });
    var h = R.int(1, 3), k = R.nz(-4, 4), t = R.int(h, Math.min(6, h + 4));
    var idx = xs.indexOf(t - h), right = vals[idx] + k;
    var wrongIdx = xs.indexOf(t + h);
    var show = [];
    xs.forEach(function (xx, i) { if (xx >= 0 && xx <= 6) show.push(i); });
    return {
      stem: "The table shows some values of the function $f$. If $g(x) = f(x - " + h + ") " + sgn(k) + "$, what is the value of $g(" + t + ")$?",
      fig: F.table({ head: ["$x$"].concat(show.map(function (i) { return "$" + xs[i] + "$"; })), rows: [["$f(x)$"].concat(show.map(function (i) { return "$" + vals[i] + "$"; }))], left: true }),
      choices: [c(right, { ok: true }),
        c(wrongIdx > -1 && vals[wrongIdx] + k !== right ? vals[wrongIdx] + k : right + 5, { err: "concept", tr: "shifted the input the wrong way", why: "$g(" + t + ") = f(" + t + " - " + h + ") = f(" + (t - h) + ")$, not $f(" + (t + h) + ")$." }),
        c(vals[idx] === right ? right - 3 : vals[idx], { err: "misread", tr: "forgot the added constant", why: "After $f(" + (t - h) + ") = " + vals[idx] + "$, still " + (k > 0 ? "add " + k : "subtract " + (-k)) + "." }),
        c(vals[xs.indexOf(t)] + k === right ? right + 2 : vals[xs.indexOf(t)] + k, { err: "misread", tr: "used f(t) instead of f(t − h)", why: "The input to $f$ is $" + t + " - " + h + " = " + (t - h) + "$." })],
      hint: "What input does $f$ get when $x = " + t + "$?",
      strategy: "Compute the inside first: $" + t + " - " + h + " = " + (t - h) + "$. Read $f(" + (t - h) + ")$ from the table, then " + (k > 0 ? "add " + k : "subtract " + (-k)) + ".",
      walk: W([["g(" + t + ") = f(" + t + " - " + h + ") " + sgn(k), "Substitute."], ["= f(" + (t - h) + ") " + sgn(k), "Inside first."], ["= " + vals[idx] + " " + sgn(k) + " = " + right, "From the table."]]),
      concept: "In $g(x) = f(x - h) + k$, the input is changed before $f$ acts and the output after.",
      rebuild: [{ q: "What is $" + t + " - " + h + "$?", num: t - h, ok: "So you need $f(" + (t - h) + ")$." }, { q: "From the table, $f(" + (t - h) + ") =$", num: vals[idx], ok: "Now " + (k > 0 ? "add " + k : "subtract " + (-k)) + "." }, { q: "$g(" + t + ") =$", num: right, ok: "Done." }],
      autopsy: { clue: "$f(x - " + h + ")$: the input is shifted.", remember: "Inside the brackets first, then the outside." }
    };
  }
  function fnGraph(R, diff) {
    var xs = [-4, -3, -2, -1, 0, 1, 2, 3, 4], ys = [], y0 = R.int(-3, 3);
    xs.forEach(function (xx, i) { y0 = i ? Math.max(-4, Math.min(4, y0 + R.pick([-2, -1, 0, 1, 1, 2]))) : y0; ys.push(y0); });
    var f = function (t) { if (t <= xs[0]) return ys[0]; for (var i = 0; i < xs.length - 1; i++) if (t <= xs[i + 1]) return ys[i] + (ys[i + 1] - ys[i]) * (t - xs[i]); return ys[ys.length - 1]; };
    var fig = F.graph({ x: [-5, 5], y: [-5, 5], fns: [{ f: f, domain: [-4, 4] }], pts: [{ x: -4, y: ys[0] }, { x: 4, y: ys[8] }], w: 340 });
    if (diff >= 3) {
      var vals = {}; ys.forEach(function (v) { vals[v] = 1; });
      var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), cand = [];
      for (var v = lo + 1; v < hi; v++) if (!vals[v]) cand.push(v);
      if (cand.length) {
        var vv = R.pick(cand), count = 0;
        for (var i = 0; i < 8; i++) if ((ys[i] - vv) * (ys[i + 1] - vv) < 0) count++;
        return {
          stem: "The graph of $y = f(x)$ is shown for $-4 \\le x \\le 4$. For how many values of $x$ does $f(x) = " + vv + "$?",
          fig: fig, answer: count, shown: String(count),
          near: [{ v: 1, tr: "counted only one crossing" }],
          hint: "$f(x) = " + vv + "$ means the height of the graph is " + vv + ". Draw the horizontal line $y = " + vv + "$.",
          strategy: "Count where the horizontal line $y = " + vv + "$ meets the graph: each meeting point is one value of $x$.",
          walk: W([["y = " + vv, "A horizontal line at height " + vv + "."], [String(count), "It meets the graph " + count + " time" + (count === 1 ? "" : "s") + "."]]),
          concept: "An equation $f(x) = k$ asks which inputs give output $k$ — on a graph, where the curve is at height $k$.",
          rebuild: [{ q: "On the graph, $f(x) = " + vv + "$ means…", opts: ["the curve is at height " + vv, "the curve is at $x = " + vv + "$"], a: 0, ok: "A horizontal line." }, { q: "How many times does $y = " + vv + "$ meet the graph?", num: count, ok: count + "." }],
          autopsy: { clue: "\"How many values of $x$\" — count intersections.", remember: "Output on the $y$-axis; input on the $x$-axis." }
        };
      }
    }
    var k = R.int(-3, 3), val = ys[xs.indexOf(k)];
    var cands = [c(val, { ok: true }), c(ys[xs.indexOf(k) + 1], { err: "graph", tr: "read the wrong gridline", why: "Find $x = " + k + "$ on the horizontal axis first, then go straight up or down to the graph." }),
      c(-val, { err: "graph", tr: "read the sign wrong", why: "The graph at $x = " + k + "$ is " + (val > 0 ? "above" : val < 0 ? "below" : "on") + " the $x$-axis." }),
      c(k, { err: "misread", tr: "gave the input instead of the output", why: "$f(" + k + ")$ is the height of the graph at $x = " + k + "$, not " + k + " itself." }),
      c(ys[xs.indexOf(k) - 1] != null ? ys[xs.indexOf(k) - 1] : val + 3, { err: "graph", tr: "read the wrong gridline", why: "Go straight up or down from $x = " + k + "$." })];
    var ok = cands[0];
    return {
      stem: "The graph of $y = f(x)$ is shown. What is the value of $f(" + k + ")$?",
      fig: fig,
      choices: [ok].concat(H.distinct(ok, cands.slice(1), 3)),
      hint: "Find " + k + " on the $x$-axis. How high is the graph there?",
      strategy: "$f(a)$ is the $y$-value of the graph above (or below) $x = a$.",
      walk: W([["x = " + k, "Start on the $x$-axis."], ["f(" + k + ") = " + val, "Go vertically to the graph and read across."]]),
      concept: "A function's graph is all the points $(x, f(x))$: the input is across, the output is up.",
      rebuild: [{ q: "Which axis do you find the input " + k + " on?", opts: ["The $x$-axis", "The $y$-axis"], a: 0, ok: "Then go vertically." }, { q: "The graph's height at $x = " + k + "$ is…", num: val, ok: "$f(" + k + ") = " + val + "$." }],
      autopsy: { clue: "$f$ of a number, and a graph.", remember: "Input across, output up." }
    };
  }
  function fnReflect(R) {
    var axis = R.pick(["x", "y"]), stretch = R.chance(0.35), k = R.pick([2, 3]);
    if (stretch) {
      var vert = R.chance(0.5);
      return {
        stem: "The graph of $y = g(x)$ is the graph of $y = f(x)$ stretched " + (vert ? "vertically" : "horizontally") + " by a factor of " + k + ". Which equation could define $g$?",
        choices: [x(vert ? "g(x) = " + k + "f(x)" : "g(x) = f\\left(\\frac{x}{" + k + "}\\right)", { ok: true }),
          x(vert ? "g(x) = f(" + k + "x)" : "g(x) = f(" + k + "x)", { err: "concept", tr: vert ? "put the stretch inside the function" : "used the factor instead of its reciprocal inside", why: vert ? "Inside the brackets changes $x$ — a horizontal change. A vertical stretch multiplies the output: $" + k + "f(x)$." : "Inside works backwards: $f(" + k + "x)$ squeezes the graph. Stretching by " + k + " needs $f(\\frac{x}{" + k + "})$." }),
          x(vert ? "g(x) = f(x) + " + k : "g(x) = " + k + "f(x)", { err: "concept", tr: vert ? "shifted instead of stretching" : "stretched vertically instead", why: vert ? "Adding " + k + " moves the graph up; multiplying by " + k + " stretches it." : "Multiplying the output stretches up and down, not left and right." }),
          x(vert ? "g(x) = \\frac{1}{" + k + "}f(x)" : "g(x) = f(x + " + k + ")", { err: "concept", tr: vert ? "shrank instead of stretching" : "shifted instead of stretching", why: vert ? "A factor less than 1 compresses the graph." : "Adding inside shifts the graph left." })],
        order: "shuffle",
        hint: "Is the change inside the function (to $x$) or outside (to the output)?",
        strategy: "Outside the function: vertical changes, as they look. Inside: horizontal changes, backwards.",
        walk: W([[vert ? k + "f(x)" : "f\\left(\\frac{x}{" + k + "}\\right)", vert ? "Every output multiplied by " + k + ": taller." : "Each output now happens at " + k + " times the input: wider."]]),
        concept: "Multiplying outside scales outputs (vertical); multiplying inside scales inputs (horizontal, by the reciprocal).",
        rebuild: [{ q: "A " + (vert ? "vertical" : "horizontal") + " change goes…", opts: [vert ? "outside the function" : "inside the function", vert ? "inside the function" : "outside the function"], a: 0, ok: "Right." }],
        autopsy: { clue: "\"Stretched by a factor of " + k + "\".", remember: "Outside = vertical; inside = horizontal and backwards." }
      };
    }
    var ok = x("g(x) = " + (axis === "x" ? "-f(x)" : "f(-x)"), { ok: true });
    return {
      stem: "The graph of $y = g(x)$ is the reflection of the graph of $y = f(x)$ across the $" + axis + "$-axis. Which equation defines $g$?",
      choices: [ok, x("g(x) = " + (axis === "x" ? "f(-x)" : "-f(x)"), { err: "concept", tr: "reflected across the wrong axis", why: axis === "x" ? "Flipping over the $x$-axis turns each output upside down: $-f(x)$. $f(-x)$ flips left and right." : "Flipping over the $y$-axis swaps left and right, which changes the input: $f(-x)$." }),
        x("g(x) = -f(-x)", { err: "concept", tr: "reflected across both axes", why: "That flips the graph both ways — a half-turn about the origin." }),
        x("g(x) = \\frac{1}{f(x)}", { err: "concept", tr: "took the reciprocal", why: "A reciprocal isn't a reflection; it changes the shape of the graph." })],
      order: "shuffle",
      hint: "Across the $" + axis + "$-axis: does the input change, or the output?",
      strategy: "Across the $x$-axis: outputs change sign, $-f(x)$. Across the $y$-axis: inputs change sign, $f(-x)$.",
      walk: W([[axis === "x" ? "(a, b) \\to (a, -b)" : "(a, b) \\to (-a, b)", "What a reflection does to a point."], [axis === "x" ? "g(x) = -f(x)" : "g(x) = f(-x)", axis === "x" ? "Every output negated." : "Every input negated."]]),
      concept: "Reflecting over the $x$-axis negates $y$; over the $y$-axis negates $x$.",
      rebuild: [{ q: "Reflecting $(3, 5)$ across the $" + axis + "$-axis gives…", opts: axis === "x" ? ["$(3, -5)$", "$(-3, 5)$"] : ["$(-3, 5)$", "$(3, -5)$"], a: 0, ok: axis === "x" ? "The output changes sign." : "The input changes sign." }, { q: "So $g(x) =$", opts: ["$" + (axis === "x" ? "-f(x)" : "f(-x)") + "$", "$" + (axis === "x" ? "f(-x)" : "-f(x)") + "$"], a: 0, ok: "Right." }],
      autopsy: { trap: "Using the other axis's rule.", clue: "\"Reflection across the $" + axis + "$-axis\".", remember: "$x$-axis → $-f(x)$; $y$-axis → $f(-x)$." }
    };
  }
  var FN = {
    id: "m-func", t: "Function notation & transformations", short: "Functions", kind: "Function notation",
    blurb: "Evaluate $f(-3)$ without slipping, compose $f(g(x))$ inside out, read functions from tables, and shift graphs the right way.",
    forms: ["equation", "table", "graph", "twist"],
    school: { course: "alg", unit: 8, t: "Algebra I, Unit 8: Functions" },
    autopsy: { testing: "Function notation and transformations", clue: "$f(\\cdot)$ notation — inputs and outputs.", remember: "Substitute with brackets; inside first.", spotQ: "Is each of these about function notation?" },
    spot: function (R) {
      return R.shuffle([
        { t: "If $f(x) = 3x - 1$, what is $f(f(2))$?", yes: true, why: "Composition — inside out." },
        { t: "$g(x) = f(x + 2)$. How does the graph of $g$ compare with $f$'s?", yes: true, why: "A transformation: left 2." },
        { t: "Solve $3x - 1 = 11$.", yes: false, why: "A plain linear equation." }]);
    },
    lesson: [
      { type: "learn", kicker: "Inside out",
        prompt: "$f(g(3))$ is two machines in a row. Always start with the one inside.",
        scene: { type: "walk", rows: [
          { m: "f(x) = 2x + 1,\\quad g(x) = x^2", say: "Two functions." }, { m: "g(3) = 9", say: "Inside first." },
          { m: "f(9) = 19", say: "Then feed it to $f$: $f(g(3)) = 19$." }, { m: "g(f(3)) = g(7) = 49", say: "The other order gives something else — order matters." }] }, gate: true },
      { type: "learn", kicker: "Moving a graph",
        prompt: "$y = f(x - h) + k$ moves the graph of $f$. Slide $h$ and $k$.",
        scene: { type: "plane", x: [-7, 7], y: [-5, 9], params: { h: { v: 0, min: -4, max: 4, step: 1, label: "$h$" }, k: { v: 0, min: -3, max: 5, step: 1, label: "$k$" } },
                 fns: [{ f: "abs(x)", color: "blue", dashed: true }, { f: "abs(x - h) + k", color: "red" }],
                 readout: function (s) { var p = s.params; return "$y = f(x " + (p.h < 0 ? "+ " + (-p.h) : "- " + p.h) + ") " + (p.k < 0 ? "- " + (-p.k) : "+ " + p.k) + "$: " + (p.h ? Math.abs(p.h) + (p.h > 0 ? " right" : " left") : "no horizontal shift") + ", " + (p.k ? Math.abs(p.k) + (p.k > 0 ? " up" : " down") : "no vertical shift") + "."; } },
        gate: true, then: "Outside the brackets does what it says: $+k$ is up. **Inside** works backwards: $x - h$ moves it **right** by $h$." },
      { type: "choice", prompt: "Which equation shifts the graph of $y = f(x)$ 4 units to the left?",
        options: [{ t: "$y = f(x + 4)$" }, { t: "$y = f(x - 4)$", fb: "$x - 4$ moves it right. Inside works backwards." }, { t: "$y = f(x) - 4$", fb: "That moves it down 4." }, { t: "$y = f(x) + 4$", fb: "That moves it up 4." }],
        answer: 0, hints: ["Inside the brackets works the opposite way."], why: "$f(x + 4)$ reaches each output 4 units sooner: left 4." },
      { type: "learn", kicker: "Reading and flipping",
        prompt: "Two more things the SAT does with functions:",
        scene: { type: "walk", rows: [
          { m: "f(3) \\text{ from a graph}", say: "Find 3 on the $x$-axis, go straight up or down to the curve, read the height." },
          { m: "f(x) = 2 \\text{ from a graph}", say: "Draw the horizontal line $y = 2$: every meeting point is a solution." },
          { m: "-f(x)", say: "Reflect across the $x$-axis (outputs flip)." }, { m: "f(-x)", say: "Reflect across the $y$-axis (inputs flip)." },
          { m: "2f(x) \\ \\text{vs}\\ f(2x)", say: "Outside: twice as tall. Inside: squeezed to half the width." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "table") return fnTable(R);
      if (o.form === "graph") return fnGraph(R, o.diff);
      if (o.form === "twist") return o.diff >= 3 ? fnReflect(R) : fnShift(R);
      return o.diff === 1 ? fnEval(R) : o.diff === 2 ? fnCompose(R) : (R.chance(0.5) ? fnTable(R) : fnCompose(R));
    }
  };

  S.domain(2, {
    skills: [EQV, QUAD, VTX, EXP, NL, FN],
    strategies: [
      { id: "factorcommon", t: "Factor out what's common", rule: "Before anything else, pull out the greatest common factor — including any $x$. Never divide by $x$: you'd lose $x = 0$.",
        when: "every term shares a number or a variable.", skills: ["m-quad", "m-equiv"],
        ex: "Solve $3x^2 - 12x = 0$.", walk: W([["3x(x - 4) = 0", "Factor out $3x$."], ["x = 0 \\;\\text{or}\\; x = 4", "Zero product."]]) },
      { id: "zeroproduct", t: "Roots, factors, intercepts", rule: "$x = r$ is a solution ⇔ $(x - r)$ is a factor ⇔ the graph crosses the $x$-axis at $r$. The sign flips between factor and root.",
        when: "a question moves between a graph, factors and solutions.", skills: ["m-quad", "m-vertex"],
        ex: "A parabola crosses the $x$-axis at $-2$ and $5$. Which could be its equation?", walk: W([["(x + 2)(x - 5)", "Roots $-2$ and $5$ → factors with flipped signs."]]) },
      { id: "sumroots", t: "Sum and product without solving", rule: "For $ax^2 + bx + c = 0$: the solutions add to $-\\frac{b}{a}$ and multiply to $\\frac{c}{a}$. The discriminant $b^2 - 4ac$ counts them.",
        when: "the question asks about the solutions but not for them.", skills: ["m-quad"],
        ex: "What is the sum of the solutions of $2x^2 - 7x + 3 = 0$?", walk: W([["-\\frac{-7}{2} = \\frac{7}{2}", "No solving."]]) },
      { id: "vertex", t: "Find the vertex fast", rule: "Vertex form $a(x - h)^2 + k$ shows it: $(h, k)$. Standard form: $x = -\\frac{b}{2a}$, then $y = f(x)$.",
        when: "the question asks for a maximum, minimum, or turning point.", skills: ["m-vertex"],
        ex: "Maximum of $h(t) = -16t^2 + 96t$?", walk: W([["t = -\\frac{96}{-32} = 3", "Vertex time."], ["h(3) = 144", "Maximum height."]]) },
      { id: "graphit", t: "Graph both sides", rule: "Type each side of the equation into the graphing calculator as its own curve. The solutions are the $x$-values where they meet; the calculator marks them.",
        when: "an equation or system looks messy, especially nonlinear ones.", skills: ["m-nonlin", "m-quad", "a-sys"],
        ex: "Solve $\\sqrt{x + 6} = x$.", walk: W([["y = \\sqrt{x + 6},\\; y = x", "Two curves."], ["x = 3", "They meet once — at $x = 3$. ($x = -2$ from the algebra is extraneous.)"]]) },
      { id: "extraneous", t: "Check after squaring", rule: "Squaring both sides can create solutions that don't work. Substitute every answer into the original equation.",
        when: "you squared both sides, or there's a variable in a denominator.", skills: ["m-nonlin"],
        ex: "Solve $\\sqrt{x + 2} = x$.", walk: W([["x = 2 \\;\\text{or}\\; x = -1", "After squaring."], ["\\sqrt{1} \\ne -1", "Reject $-1$."]]) },
      { id: "growth", t: "Growth factor = 1 ± rate", rule: "A change of $r$% each period multiplies by $1 + r$ (growth) or $1 - r$ (decay). The start value is the coefficient.",
        when: "a quantity changes by the same percent each period.", skills: ["m-exp"],
        ex: "Lose 20% a year, starting at 500.", walk: W([["500(0.8)^t", "Keep 80% each year."]]) },
      { id: "plugone", t: "Test with a number", rule: "Equivalent expressions agree for every $x$. Plug in an easy value (like $x = 1$ or $x = 2$) into the question and the choices; the one that matches is right.",
        when: "you're asked which expression is equivalent, or for $a + b + c$.", skills: ["m-equiv"],
        ex: "Which is equivalent to $(x + 2)^2 - 4$? A) $x^2$ B) $x^2 + 4x$", walk: W([["x = 1: 9 - 4 = 5", "The question at $x = 1$."], ["1^2 + 4(1) = 5", "Choice B matches."]]) },
      { id: "plusminus", t: "Two square roots", rule: "Undoing a square gives two answers: $u^2 = 49 \\Rightarrow u = \\pm 7$. And $|u| = 5 \\Rightarrow u = \\pm 5$.",
        when: "a squared expression or an absolute value equals a positive number.", skills: ["m-quad", "m-nonlin"],
        ex: "$(x - 1)^2 = 16$", walk: W([["x - 1 = \\pm 4", "Both roots."], ["x = 5 \\;\\text{or}\\; -3", "Two solutions."]]) },
      { id: "formula", t: "Formula when it won't factor", rule: "$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. Square roots in the choices are the signal. Watch $-b$, and divide the whole top by $2a$.",
        when: "a quadratic doesn't factor over the integers.", skills: ["m-quad"],
        ex: "$x^2 - 4x + 1 = 0$", walk: W([["\\frac{4 \\pm \\sqrt{12}}{2}", "Substitute."], ["2 \\pm \\sqrt{3}", "Simplify."]]) },
      { id: "multiplicity", t: "Touch or cross", rule: "A zero from a squared (even-power) factor touches the $x$-axis and turns; from a single (odd-power) factor it crosses.",
        when: "matching a polynomial to its graph, or counting how its graph meets the axis.", skills: ["m-nonlin"],
        ex: "$f(x) = x(x - 3)^2$", walk: W([["x = 0 \\ \\text{crosses},\\ x = 3 \\ \\text{touches}", "Read the powers."]]) },
      { id: "ratexp", t: "Power over root", rule: "$x^{\\frac{m}{n}} = \\sqrt[n]{x^m}$: the bottom is the root, the top the power. $x^{-a} = \\frac{1}{x^a}$.",
        when: "a fractional or negative exponent appears.", skills: ["m-equiv"],
        ex: "$x^{\\frac{3}{2}}$", walk: W([["\\sqrt{x^3}", "Square root of $x$ cubed."]]) },
      { id: "readgraph", t: "Input across, output up", rule: "$f(a)$: find $a$ on the $x$-axis and read the graph's height. $f(x) = k$: draw $y = k$ and read the $x$-values where it meets the graph.",
        when: "a function is given only as a graph.", skills: ["m-func"],
        ex: "How many solutions does $f(x) = 1$ have?", walk: W([["y = 1", "Draw the line."], ["\\text{count the meetings}", "Each one is a solution."]]) },
      { id: "shifts", t: "Inside works backwards", rule: "$f(x - h) + k$: the graph moves right $h$ and up $k$. Inside the brackets the sign is opposite to the direction.",
        when: "a function is shifted, or $g(x)$ is written in terms of $f$.", skills: ["m-func"],
        ex: "Shift $y = f(x)$ left 2 and down 5.", walk: W([["y = f(x + 2) - 5", "Left 2 → $+2$ inside; down 5 → $-5$ outside."]]) }
    ]
  });
})();
