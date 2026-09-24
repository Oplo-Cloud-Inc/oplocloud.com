/* ==========================================================================
   Algebra I — Unit 11: Exponents & radicals. See lab/core.js.

   Written the way Units 1–10 are. Each exponent rule is met by writing the
   powers out in full and counting — 2³ · 2⁴ is seven 2s multiplied — before
   it is written as a rule, so zero and negative exponents arrive as the only
   values that keep the pattern going rather than as definitions. Roots are
   met as the side of a square with a given area (and the edge of a cube
   with a given volume), and simplifying a square root is taking out the
   biggest square that fits.

   Three lessons, following Khan Academy's topics for the unit. Nine skills
   (Khan's list), three quizzes, the unit test at the end, and notes that put
   the unit on one page.
   Standards: 8.EE.A.1, 8.EE.A.2, HSN.RN.A.2.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var num = L.num, mc = L.mc, frac = L.frac;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function nears(ans, list) { return list.filter(function (z) { return isFinite(z.v) && Math.abs(z.v - ans) > 1e-9; }); }
  function pw(b, e) { return (String(b).length > 1 && /[^a-z0-9]/i.test(String(b)) ? "(" + b + ")" : b) + (e === 1 ? "" : "^{" + e + "}"); }
  function paren(v) { return v < 0 ? "(" + v + ")" : String(v); }
  function blanks(h, vals) { return { type: "table", head: h, rows: [vals.map(function () { return null; })], answers: vals.map(function (v, i) { return [0, i, v]; }) }; }
  // The largest square that divides n, and what's left.
  function split(n) { var a = 1; for (var k = 2; k * k <= n; k++) while (n % (k * k) === 0) { n /= k * k; a *= k; } return [a, n]; }
  function rad(a, b) { return (a === 1 ? "" : a) + "\\sqrt{" + b + "}"; }

  L.unit("alg", 11, {
    title: "Exponents & radicals",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "The exponent rules",
        blurb: "Multiplying and dividing powers, powers of powers, and what zero and negative exponents mean.",
        mins: 14, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "An **exponent** counts how many times a number — the **base** — is multiplied by itself: $2^5 = 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2$. Write powers out like that and the rules show themselves.",
            scene: { type: "walk", rows: [
              { m: "2^3 \\cdot 2^4 = (2 \\cdot 2 \\cdot 2)(2 \\cdot 2 \\cdot 2 \\cdot 2)", say: "Three 2s times four 2s…" },
              { m: "= 2^7", say: "…is seven 2s. **Multiplying**, same base: add the exponents." },
              { m: "\\frac{5^6}{5^2} = \\frac{5 \\cdot 5 \\cdot 5 \\cdot 5 \\cdot \\cancel{5} \\cdot \\cancel{5}}{\\cancel{5} \\cdot \\cancel{5}} = 5^4", say: "**Dividing**: two 5s cancel. Subtract the exponents." }] },
            gate: true },
          { type: "num", prompt: "Write $7^5 \\cdot 7^3$ as a single power $7^n$. What is $n$?", pre: "$n =$", answer: 8, skill: "Multiply & divide powers",
            near: [{ v: 15, fb: "Multiplying powers of the same base **adds** the exponents: five 7s and three 7s." }], hints: ["Five 7s times three 7s."], why: "$7^{5 + 3} = 7^8$." },
          { type: "learn", kicker: "Zero and negative",
            prompt: "Keep dividing by 2 and watch the exponents.",
            scene: { type: "walk", rows: [
              { m: "2^3 = 8, \\; 2^2 = 4, \\; 2^1 = 2", say: "Each step down divides by 2." },
              { m: "2^0 = 1", say: "One more step: $2 \\div 2 = 1$. Any non-zero number to the power 0 is 1." },
              { m: "2^{-1} = \\frac{1}{2}, \\; 2^{-2} = \\frac{1}{4}", say: "Keep going: a **negative** exponent means one over the positive power." },
              { m: "a^{-n} = \\frac{1}{a^n}", say: "" }] },
            gate: true },
          { type: "num", prompt: "What is $4^{-2}$? (A fraction is fine.)", answer: 1 / 16, skill: "Multiply & divide powers",
            near: [{ v: -16, fb: "A negative exponent doesn't make the answer negative: it means $\\frac{1}{4^2}$." }, { v: -8, fb: "It's $\\frac{1}{4^2} = \\frac{1}{16}$." }],
            hints: ["$4^{-2} = \\frac{1}{4^2}$."], why: "$\\frac{1}{16}$." },
          { type: "num", prompt: "Write $\\frac{3^{2}}{3^{6}}$ as $3^n$. What is $n$?", pre: "$n =$", answer: -4, skill: "Multiply & divide powers",
            near: [{ v: 4, fb: "Top exponent minus bottom: $2 - 6$." }], hints: ["Subtract: $2 - 6$."], why: "$3^{2 - 6} = 3^{-4}$." },
          { type: "learn", kicker: "Powers of powers and products",
            prompt: "The last three rules come from writing things out the same way.",
            scene: { type: "walk", rows: [
              { m: "(x^3)^2 = x^3 \\cdot x^3 = x^6", say: "A power of a power: **multiply** the exponents." },
              { m: "(2x)^3 = 2x \\cdot 2x \\cdot 2x = 2^3 x^3", say: "A power of a product: each factor gets the power." },
              { m: "\\left(\\frac{a}{b}\\right)^2 = \\frac{a^2}{b^2}", say: "A power of a quotient: top and bottom both." }] },
            gate: true },
          { type: "table", prompt: "Simplify $(2^3 \\cdot 5^{-2})^4$ to $2^a \\cdot 5^b$.", skill: "Powers of products & quotients",
            head: ["$a$", "$b$"], rows: [[null, null]], answers: [[0, 0, 12], [0, 1, -8]],
            hints: ["Each factor gets the power 4.", "Power of a power: multiply. $3 \\times 4$ and $-2 \\times 4$."], why: "$2^{12} \\cdot 5^{-8}$." },
          { type: "table", prompt: "Simplify $\\frac{x^5 y^{-2}}{x^{2} y^{3}}$ to $x^a y^b$.", skill: "Properties of exponents challenge",
            head: ["$a$", "$b$"], rows: [[null, null]], answers: [[0, 0, 3], [0, 1, -5]],
            hints: ["Each letter on its own: subtract bottom from top.", "For $y$: $-2 - 3$."], why: "$x^{5 - 2} y^{-2 - 3} = x^3 y^{-5}$." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Roots",
        blurb: "Square roots and cube roots — of whole numbers, decimals and fractions.",
        mins: 11, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "Make a square with an area of $36$. How long is its side?",
            scene: { type: "square", side: 1, max: 9, target: 36 }, gate: true,
            then: "A $6$ by $6$ square has area 36. So $6$ is the **square root** of 36, written $\\sqrt{36} = 6$: the number that, multiplied by itself, gives 36. ($(-6)^2$ is 36 too, but $\\sqrt{\\;}$ means the positive one.)" },
          { type: "num", prompt: "What is $\\sqrt{81}$?", answer: 9, skill: "Square roots",
            near: [{ v: 40.5, fb: "A square root isn't half: which number times itself is 81?" }], hints: ["Which number times itself gives 81?"], why: "$9 \\times 9 = 81$." },
          { type: "learn", kicker: "Decimals and fractions",
            prompt: "The same idea works for decimals and fractions.",
            scene: { type: "walk", rows: [
              { m: "\\sqrt{0.49} = 0.7", say: "$0.7 \\times 0.7 = 0.49$." },
              { m: "\\sqrt{\\frac{9}{16}} = \\frac{3}{4}", say: "Root of the top over root of the bottom." }] },
            gate: true },
          { type: "num", prompt: "What is $\\sqrt{0.64}$?", answer: 0.8, skill: "Roots of decimals & fractions",
            near: [{ v: 0.08, fb: "$0.08 \\times 0.08 = 0.0064$. Try $0.8$." }, { v: 8, fb: "$8 \\times 8 = 64$, not 0.64." }], hints: ["Which decimal times itself is $0.64$?"], why: "$0.8 \\times 0.8 = 0.64$." },
          { type: "learn", kicker: "Cube roots",
            prompt: "Now a cube with a volume of $27$. How long is each edge?",
            scene: { type: "cube", side: 1, max: 5, target: 27 }, gate: true,
            then: "A $3 \\times 3 \\times 3$ cube has volume 27, so the **cube root** of 27 is 3: $\\sqrt[3]{27} = 3$. A cube root can be negative: $\\sqrt[3]{-8} = -2$, because $(-2)^3 = -8$." },
          { type: "num", prompt: "What is $\\sqrt[3]{-125}$?", answer: -5, skill: "Cube roots",
            near: [{ v: 5, fb: "$5^3 = +125$. For $-125$ you need a negative number." }], hints: ["Which number cubed is $-125$?"], why: "$(-5)^3 = -125$." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Simplifying square roots",
        blurb: "Taking out the biggest square that fits — with numbers, letters, and sums of roots.",
        mins: 13, v: 1,
        steps: [
          { type: "learn", kicker: "The idea",
            prompt: "$\\sqrt{a \\cdot b} = \\sqrt{a} \\cdot \\sqrt{b}$. So split the number under the root into a perfect square times what's left, and the square comes out.",
            scene: { type: "walk", rows: [
              { m: "\\sqrt{72}", say: "The biggest square that divides 72 is 36." },
              { m: "= \\sqrt{36 \\cdot 2}", say: "" },
              { m: "= \\sqrt{36} \\cdot \\sqrt{2} = 6\\sqrt{2}", say: "Nothing square is left inside, so it's simplified." }] },
            gate: true },
          { type: "table", prompt: "Simplify $\\sqrt{50}$ to $a\\sqrt{b}$.", skill: "Simplify square roots",
            head: ["$a$", "$b$"], rows: [[null, null]], answers: [[0, 0, 5], [0, 1, 2]],
            hints: ["The biggest square that divides 50 is 25."], why: "$\\sqrt{25 \\cdot 2} = 5\\sqrt{2}$." },
          { type: "learn", kicker: "With letters",
            prompt: "Letters work the same way: $\\sqrt{x^2} = x$ (for $x \\ge 0$), so pairs of a letter come out.",
            scene: { type: "walk", rows: [
              { m: "\\sqrt{18x^3}", say: "" },
              { m: "= \\sqrt{9 \\cdot 2 \\cdot x^2 \\cdot x}", say: "Squares: 9 and $x^2$." },
              { m: "= 3x\\sqrt{2x}", say: "They come out; $2x$ stays in." }] },
            gate: true },
          { type: "choice", prompt: "Simplify $\\sqrt{25y^5}$ (with $y \\ge 0$).", skill: "Simplify square roots (variables)",
            options: [{ t: "$5y^2\\sqrt{y}$" }, { t: "$5y\\sqrt{y^3}$", fb: "$y^3$ still has a pair inside: $y^3 = y^2 \\cdot y$." }, { t: "$25y^2\\sqrt{y}$", fb: "$\\sqrt{25} = 5$ when it comes out." }],
            answer: 0, why: "$\\sqrt{25 \\cdot y^4 \\cdot y} = 5y^2\\sqrt{y}$." },
          { type: "learn", kicker: "Adding roots",
            prompt: "Roots with the same number inside are like terms: $3\\sqrt{2} + 5\\sqrt{2} = 8\\sqrt{2}$, the way $3x + 5x = 8x$. Different ones can't be combined — until you simplify them, when they sometimes turn out to match.",
            scene: { type: "walk", rows: [
              { m: "\\sqrt{12} + \\sqrt{27}", say: "Different inside — for now." },
              { m: "= 2\\sqrt{3} + 3\\sqrt{3}", say: "Simplify each." },
              { m: "= 5\\sqrt{3}", say: "Now they're like terms." }] },
            gate: true },
          { type: "table", prompt: "Simplify $\\sqrt{8} + \\sqrt{18}$ to $a\\sqrt{b}$.", skill: "Simplify square-root expressions",
            head: ["$a$", "$b$"], rows: [[null, null]], answers: [[0, 0, 5], [0, 1, 2]],
            hints: ["$\\sqrt{8} = 2\\sqrt{2}$ and $\\sqrt{18} = 3\\sqrt{2}$."], why: "$2\\sqrt{2} + 3\\sqrt{2} = 5\\sqrt{2}$." },
          { type: "choice", prompt: "Kai writes $\\sqrt{9} + \\sqrt{16} = \\sqrt{25} = 5$. What went wrong?", skill: "Simplify square-root expressions",
            options: [{ t: "Roots don't add like that: $\\sqrt{9} + \\sqrt{16} = 3 + 4 = 7$" }, { t: "Nothing — $9 + 16 = 25$", fb: "$\\sqrt{a} + \\sqrt{b}$ isn't $\\sqrt{a + b}$. Work each root out: $3 + 4$." }],
            answer: 0, why: "$\\sqrt{ab} = \\sqrt{a}\\sqrt{b}$ is true, but there's no such rule for adding." }
        ]
      }
    ],

    quizzes: [
      { title: "Quiz 1", after: 1, blurb: "The exponent rules with whole-number and negative exponents.", skills: ["a11-muldiv", "a11-prod", "a11-challenge"], per: 2 },
      { title: "Quiz 2", after: 2, blurb: "Square roots and cube roots.", skills: ["a11-sqrt", "a11-sqrt-frac", "a11-cbrt"], per: 2 },
      { title: "Quiz 3", after: 3, blurb: "Simplifying square roots and square-root expressions.", skills: ["a11-simp", "a11-simp-var", "a11-simp-expr"], per: 2 }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "The exponent rules",
        keys: [["$a^m \\cdot a^n = a^{m + n}$", "multiplying, same base: add"], ["$\\frac{a^m}{a^n} = a^{m - n}$", "dividing, same base: subtract"], ["$(a^m)^n = a^{mn}$", "a power of a power: multiply"],
               ["$(ab)^n = a^n b^n$", "a power of a product: each factor"], ["$\\left(\\frac{a}{b}\\right)^n = \\frac{a^n}{b^n}$", "a power of a quotient: top and bottom"]],
        say: ["Every rule comes from writing the powers out: $2^3 \\cdot 2^4$ is three 2s times four 2s — seven 2s."],
        watch: "The rules are for the **same base**. $2^3 \\cdot 5^4$ can't be combined into one power." },
      { t: "Zero and negative exponents",
        say: ["$a^0 = 1$ for any $a \\ne 0$, and $a^{-n} = \\frac{1}{a^n}$. They're the values that keep the pattern going: each step down divides by $a$."],
        eg: { q: "Simplify $\\frac{x^5 y^{-2}}{x^2 y^3}$.", rows: [["x^{5 - 2} y^{-2 - 3}", "Subtract, letter by letter."], ["x^3 y^{-5} = \\frac{x^3}{y^5}", ""]] },
        watch: "A negative exponent doesn't make the number negative: $4^{-2} = \\frac{1}{16}$." },
      { t: "Square roots and cube roots",
        say: ["$\\sqrt{a}$ is the non-negative number that, squared, gives $a$ — the side of a square with area $a$. $\\sqrt[3]{a}$ is the number that, cubed, gives $a$ — the edge of a cube with volume $a$; it can be negative.",
              "For fractions, root the top and bottom: $\\sqrt{\\frac{9}{16}} = \\frac{3}{4}$. For decimals, think of the digits: $\\sqrt{0.49} = 0.7$."],
        keys: [["$1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144$", "the squares, worth knowing by heart"], ["$1, 8, 27, 64, 125$", "the first cubes"]] },
      { t: "Simplifying square roots",
        say: ["$\\sqrt{ab} = \\sqrt{a}\\sqrt{b}$. Split the number under the root into the **largest** perfect square that divides it times what's left; the square comes out as its root. It's simplified when nothing square is left inside.",
              "Letters: each pair comes out, $\\sqrt{x^2} = x$ (for $x \\ge 0$)."],
        eg: { q: "Simplify $\\sqrt{18x^3}$.", rows: [["\\sqrt{9 \\cdot 2 \\cdot x^2 \\cdot x}", "Find the squares."], ["3x\\sqrt{2x}", "They come out."]] } },
      { t: "Adding and subtracting roots",
        say: ["Roots with the same number inside are like terms and combine like $3x + 5x$. Simplify each root first — different-looking roots often match afterwards."],
        eg: { q: "Simplify $\\sqrt{12} + \\sqrt{27}$.", rows: [["2\\sqrt{3} + 3\\sqrt{3}", "Simplify each."], ["5\\sqrt{3}", "Combine."]] },
        watch: "$\\sqrt{9} + \\sqrt{16}$ is $3 + 4 = 7$, not $\\sqrt{25}$. Roots multiply nicely; they don't add." }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a11-muldiv", title: "Multiply & divide powers (integer exponents)", lesson: 1,
        gen: function (R) {
          var b = R.pick([2, 3, 5, 7, 10, "x", "a"]), m = R.int(-6, 9), n = R.int(-6, 9), T = R.int(0, 2);
          if (T === 2) { var base = R.pick([2, 3, 4, 5, 10]), e = R.pick([-1, -2, -3, 0]); if (base === 10 || base === 5) e = R.pick([-1, -2, 0]);
            var v = Math.pow(base, e);
            return { type: "num", prompt: "What is $" + pw(base, e) + "$? (A fraction is fine.)", answer: v,
              near: nears(v, [{ v: -Math.pow(base, -e), fb: "A negative exponent means one over the power, not a negative number." }, { v: 0, fb: "Any non-zero number to the power 0 is 1." }]),
              hints: [e === 0 ? "Anything (but 0) to the power 0 is 1." : "$" + pw(base, e) + " = \\frac{1}{" + pw(base, -e) + "}$."], why: "$" + pw(base, e) + " = " + frac(1, Math.pow(base, -e)) + "$." }; }
          var mul = T === 0, tex = mul ? pw(b, m) + " \\cdot " + pw(b, n) : "\\frac{" + pw(b, m) + "}{" + pw(b, n) + "}", ans = mul ? m + n : m - n;
          return { type: "num", prompt: "Write $" + tex + "$ as a single power $" + pw(b, "n") + "$. What is $n$?", pre: "$n =$", answer: ans,
            near: nears(ans, [{ v: mul ? m * n : m + n, fb: mul ? "Multiplying powers of the same base **adds** the exponents." : "Dividing **subtracts** the exponents: top minus bottom." }, { v: mul ? m - n : n - m, fb: mul ? "Add, don't subtract." : "Top minus bottom, in that order." }]),
            hints: [mul ? "Same base, multiplying: add the exponents." : "Same base, dividing: subtract the bottom exponent from the top."],
            why: "$" + pw(b, (mul ? m + " + " + paren(n) : m + " - " + paren(n))) + " = " + b + "^{" + ans + "}$, so $n = " + ans + "$." };
        } },
      { id: "a11-prod", title: "Powers of products & quotients (integer exponents)", lesson: 1,
        gen: function (R) {
          var p = R.pick([2, 3, "x"]), q = R.pick([5, 7, "y"]), a = R.nz(-4, 5), b = R.nz(-4, 5), k = R.pick([2, 3, -2, -1, 4]), quot = R.chance(0.35);
          var tex = quot ? "\\left(\\frac{" + pw(p, a) + "}{" + pw(q, b) + "}\\right)^{" + k + "}" : "(" + pw(p, a) + " \\cdot " + pw(q, b) + ")^{" + k + "}";
          var s = blanks(["exponent of $" + p + "$", "exponent of $" + q + "$"], [a * k, quot ? -b * k : b * k]);
          s.prompt = "Simplify $" + tex + "$ to $" + pw(p, "a") + " \\cdot " + pw(q, "b") + "$.";
          s.hints = ["Each factor gets the power " + k + ": multiply its exponent by " + k + "."].concat(quot ? ["Anything on the bottom, $" + pw(q, "m") + "$, is $" + pw(q, "-m") + "$ on top."] : []);
          s.why = "$" + pw(p, a * k) + " \\cdot " + pw(q, quot ? -b * k : b * k) + "$.";
          return s;
        } },
      { id: "a11-challenge", title: "Properties of exponents challenge (integer exponents)", lesson: 1,
        gen: function (R) {
          var a1 = R.int(-4, 5), b1 = R.int(-4, 5), a2 = R.int(-4, 5), b2 = R.int(-4, 5), k = R.pick([2, 3, -1, -2]);
          var T = R.int(0, 1), tex, A, B;
          if (T === 0) { tex = "\\frac{" + pw("x", a1) + pw("y", b1) + "}{" + pw("x", a2) + pw("y", b2) + "}"; A = a1 - a2; B = b1 - b2; }
          else { tex = "(" + pw("x", a1) + pw("y", b1) + ")^{" + k + "} \\cdot " + pw("x", a2) + pw("y", b2); A = a1 * k + a2; B = b1 * k + b2; }
          var s = blanks(["$a$", "$b$"], [A, B]);
          s.prompt = "Simplify $" + tex + "$ to $x^a y^b$.";
          s.hints = [T === 0 ? "Letter by letter: top exponent minus bottom exponent." : "First the power of a product: multiply each exponent in the bracket by " + k + ".", T === 0 ? "Watch negative exponents: $a - (-b) = a + b$." : "Then multiply by the rest: add the exponents."];
          s.why = "$x^{" + A + "} y^{" + B + "}$.";
          return s;
        } },
      { id: "a11-sqrt", title: "Square roots", lesson: 2,
        gen: function (R) {
          var n = R.int(1, 15), sq = n * n;
          if (R.chance(0.25)) { var m = R.int(2, 12); return mc(R, { prompt: "Between which two whole numbers is $\\sqrt{" + (m * m + R.int(1, 2 * m)) + "}$?", right: m + " and " + (m + 1),
            wrong: [{ t: (m - 1) + " and " + m, fb: m * m + " is below it, so its root is more than " + m + "." }, { t: (m + 1) + " and " + (m + 2), fb: (m + 1) * (m + 1) + " is above it." }],
            hints: ["Which perfect squares is it between?"], why: m + "² = " + m * m + " and " + (m + 1) + "² = " + (m + 1) * (m + 1) + "." }); }
          return { type: "num", prompt: "What is $\\sqrt{" + sq + "}$?", answer: n, near: nears(n, [{ v: sq / 2, fb: "A square root isn't half. Which number times itself is " + sq + "?" }]),
            hints: ["Which number times itself gives " + sq + "?"], why: "$" + n + " \\times " + n + " = " + sq + "$." };
        } },
      { id: "a11-sqrt-frac", title: "Roots of decimals & fractions", lesson: 2,
        gen: function (R) {
          if (R.chance(0.5)) { var a = R.int(1, 9), d = R.pick([10, 100]), v = a / d;
            return { type: "num", prompt: "What is $\\sqrt{" + num(v * v) + "}$?", answer: v,
              near: nears(v, [{ v: v / 10, fb: "Check: $" + num(v / 10) + " \\times " + num(v / 10) + "$ is too small." }, { v: v * 10, fb: "Check: $" + num(v * 10) + " \\times " + num(v * 10) + "$ is too big." }]),
              hints: ["Think of the digits: $\\sqrt{" + a * a + "} = " + a + "$. Where does the point go?"], why: "$" + num(v) + " \\times " + num(v) + " = " + num(v * v) + "$." }; }
          var p = R.int(1, 9), q = R.int(2, 12); while (L.gcd(p, q) !== 1) q++;
          var cube = R.chance(0.3);
          if (cube) { p = R.int(1, 4); q = R.int(2, 5); while (L.gcd(p, q) !== 1) q++;
            return { type: "num", prompt: "What is $\\sqrt[3]{\\frac{" + p * p * p + "}{" + q * q * q + "}}$? (A fraction is fine.)", answer: p / q, hints: ["Cube-root the top and the bottom."], why: "$\\frac{" + p + "}{" + q + "}$, because $\\left(\\frac{" + p + "}{" + q + "}\\right)^3 = \\frac{" + p * p * p + "}{" + q * q * q + "}$." }; }
          return { type: "num", prompt: "What is $\\sqrt{\\frac{" + p * p + "}{" + q * q + "}}$? (A fraction is fine.)", answer: p / q,
            near: nears(p / q, [{ v: p * p / (q * q) / 2, fb: "Root the top and the bottom separately." }]), hints: ["$\\sqrt{" + p * p + "} = " + p + "$ and $\\sqrt{" + q * q + "} = " + q + "$."], why: "$\\frac{" + p + "}{" + q + "}$." };
        } },
      { id: "a11-cbrt", title: "Cube roots", lesson: 2,
        gen: function (R) {
          var n = R.nz(-6, 10), c = n * n * n;
          return { type: "num", prompt: "What is $\\sqrt[3]{" + c + "}$?", answer: n, near: nears(n, [{ v: -n, fb: n < 0 ? "A negative number cubed is negative, so the cube root of a negative is negative." : "$" + n + "^3$ is positive." }, { v: c / 3, fb: "A cube root isn't a third. Which number cubed is " + c + "?" }]),
            hints: ["Which number, times itself three times, gives " + c + "?"], why: "$" + paren(n) + "^3 = " + c + "$." };
        } },
      { id: "a11-simp", title: "Simplify square roots", lesson: 3,
        gen: function (R) {
          var a = R.int(2, 10), b = R.pick([2, 3, 5, 6, 7, 10, 11]), n = a * a * b;
          var s = blanks(["$a$", "$b$"], [a, b]);
          s.prompt = "Simplify $\\sqrt{" + n + "}$ to $a\\sqrt{b}$, with nothing square left under the root.";
          s.hints = ["Find the biggest perfect square that divides " + n + ".", "It's " + a * a + ": $" + n + " = " + a * a + " \\cdot " + b + "$."];
          s.why = "$\\sqrt{" + a * a + " \\cdot " + b + "} = " + a + "\\sqrt{" + b + "}$.";
          return s;
        } },
      { id: "a11-simp-var", title: "Simplify square roots (variables)", lesson: 3,
        gen: function (R) {
          var a = R.int(2, 6), b = R.pick([1, 2, 3, 5]), e = R.int(2, 7), v = R.pick(["x", "y", "n"]);
          var out = e >> 1, left = e % 2, coef = a * a * b;
          var inside = (b === 1 ? "" : b) + (left ? v : ""), right = "$" + a + (out ? (out === 1 ? v : v + "^{" + out + "}") : "") + (inside ? "\\sqrt{" + inside + "}" : "") + "$";
          var w1 = "$" + a + v + "\\sqrt{" + (b === 1 ? "" : b) + v + "^{" + (e - 2) + "}}$", w2 = "$" + a * a + (out ? (out === 1 ? v : v + "^{" + out + "}") : "") + (inside ? "\\sqrt{" + inside + "}" : "") + "$",
              w3 = "$" + a + (e > 1 ? v + "^{" + e + "}" : "") + (b === 1 ? "" : "\\sqrt{" + b + "}") + "$";
          return mc(R, { prompt: "Simplify $\\sqrt{" + coef + v + "^{" + e + "}}$ (with $" + v + " \\ge 0$).", right: right,
            wrong: (e >= 4 ? [{ t: w1, fb: "There are still pairs of $" + v + "$ inside the root." }] : []).concat([{ t: w2, fb: "$\\sqrt{" + a * a + "} = " + a + "$ when it comes out." }, { t: w3, fb: "Only pairs of $" + v + "$ come out: $\\sqrt{" + v + "^{" + e + "}} = " + v + (out > 1 ? "^{" + out + "}" : "") + (left ? "\\sqrt{" + v + "}" : "") + "$." }]).filter(function (w) { return w.t !== right; }),
            hints: ["Split into squares: $" + a * a + "$, and $" + v + "^{" + 2 * out + "}$.", "Each pair of $" + v + "$ comes out as one $" + v + "$."], why: "$\\sqrt{" + a * a + " \\cdot " + v + "^{" + 2 * out + "}" + (inside ? " \\cdot " + inside : "") + "} = " + right.slice(1, -1) + "$." });
        } },
      { id: "a11-simp-expr", title: "Simplify square-root expressions", lesson: 3,
        gen: function (R) {
          var b = R.pick([2, 3, 5, 6]), p = R.int(1, 5), q = R.int(1, 5), T = R.int(0, 2);
          if (T === 2) { // a product that comes out whole or as a·√b
            var x = R.pick([2, 3, 5]), m = R.int(2, 6), n2 = R.pick([2, 3, 5, 7]) * m * m;
            var sp = split(x * n2);
            var s1 = blanks(["$a$", "$b$ (1 if no root is left)"], [sp[0], sp[1]]);
            s1.prompt = "Simplify $\\sqrt{" + x + "} \\cdot \\sqrt{" + n2 + "}$ to $a\\sqrt{b}$.";
            s1.hints = ["$\\sqrt{" + x + "} \\cdot \\sqrt{" + n2 + "} = \\sqrt{" + x * n2 + "}$.", "Then simplify."]; s1.why = "$\\sqrt{" + x * n2 + "} = " + (sp[1] === 1 ? sp[0] : rad(sp[0], sp[1])) + "$."; return s1; }
          var sub = T === 1 && p !== q, A = p * p * b, B = q * q * b, res = sub ? p - q : p + q;
          var s = blanks(["$a$", "$b$"], [res, b]);
          s.prompt = "Simplify $\\sqrt{" + A + "} " + (sub ? "-" : "+") + " \\sqrt{" + B + "}$ to $a\\sqrt{b}$.";
          s.hints = ["Simplify each root: $\\sqrt{" + A + "} = " + rad(p, b) + "$ and $\\sqrt{" + B + "} = " + rad(q, b) + "$.", "Then combine the like terms."];
          s.why = "$" + rad(p, b) + " " + (sub ? "-" : "+") + " " + rad(q, b) + " = " + rad(res, b) + "$.";
          return s;
        } }
    ]
  });
})();
