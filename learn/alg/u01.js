/* ==========================================================================
   Algebra I — Unit 1: Algebra foundations. See lab/core.js for the format.

   Lessons are Brilliant-style paths: a problem first, the idea named after
   it has been used, a scene to move where moving it shows something. Skills
   are Khan-style: each generates fresh problems with hints and a worked
   solution, and levels up with practice and tests.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var poly = L.poly, frac = L.frac, num = L.num, mc = L.mc;

  L.unit("alg", 1, {
    title: "Algebra foundations",
    lessons: [
      /* ------------------------------------------------------------ 1 */
      {
        title: "A letter for a number",
        blurb: "Variables are placeholders: put a number in, get a number out.",
        steps: [
          { type: "num", kicker: "Warm up",
            prompt: "A taxi charges $\\$3$ to get in, then $\\$2$ for every mile. What does a 4-mile ride cost?",
            pre: "$\\$$", answer: 11,
            near: [{ v: 20, fb: "That charges the $\\$3$ for every mile too. It's paid once, when you get in." },
                   { v: 8, fb: "That's the miles — $4 \\times \\$2$ — but you haven't paid to get in yet." },
                   { v: 14, fb: "Close: that's $\\$3$ a mile plus $\\$2$. The $\\$2$ is per mile; the $\\$3$ is once." }],
            hints: ["Pay to get in first. Then add the cost of the miles.", "$3 + 2 \\times 4$"],
            why: "$\\$3$ to get in, plus $4 \\times \\$2 = \\$8$ for the miles: $\\$11$." },
          { type: "num", prompt: "Same taxi. A 10-mile ride?", pre: "$\\$$", answer: 23,
            near: [{ v: 50, fb: "The $\\$3$ is only paid once." }, { v: 20, fb: "Add the $\\$3$ to get in." }],
            why: "$3 + 2 \\times 10 = 23$. You did exactly the same thing as before, with a different number." },
          { type: "learn",
            prompt: "You did the same calculation twice, with different numbers. Algebra gives “whatever the number is” a name. If a ride is $m$ miles, it costs $$3 + 2m$$ Put numbers into the machine below and watch the rule work.",
            scene: { type: "machine", rule: "3 + 2x", show: "3 + 2m", v: "m", name: "cost", inputs: [1, 2, 4, 10, 25] },
            gate: true, then: "The letter doesn't have one value — it's a slot for any value. $2m$ means $2 \\times m$: a number written next to a letter is multiplied by it." },
          { type: "choice", prompt: "A gym charges a $\\$25$ joining fee and $\\$15$ a month. Which expression gives the cost for $n$ months?",
            options: [{ t: "$25 + 15n$" },
                      { t: "$15 + 25n$", fb: "That pays the joining fee every month and the monthly price once — backwards." },
                      { t: "$40n$", fb: "That adds the fee to every month. The joining fee is paid once." },
                      { t: "$25n + 15$", fb: "The number that gets multiplied by $n$ is the one paid every month." }],
            answer: 0, skill: "Write an expression",
            why: "The one-off cost stands alone; the monthly cost is multiplied by the number of months." },
          { type: "learn",
            prompt: "**Evaluating** an expression means putting in a value and working it out. Replace the letter, then follow the order of operations: powers, then multiplication and division, then addition and subtraction.",
            after: "$$5x - 4 \\text{ when } x = 3:\\quad 5(3) - 4 = 15 - 4 = 11$$" },
          { type: "num", prompt: "Evaluate $5x - 4$ when $x = 6$.", answer: 26, skill: "Evaluate with one variable",
            near: [{ v: 60, fb: "$5x$ is $5 \\times 6$ — not the digits 5 and 6 side by side." }, { v: 5, fb: "Multiply first: $5 \\times 6 = 30$, then subtract 4." }],
            why: "$5(6) - 4 = 30 - 4 = 26$." },
          { type: "num", prompt: "Evaluate $\\frac{12}{n} + 1$ when $n = 4$.", answer: 4, skill: "Evaluate with one variable",
            near: [{ v: 2.4, fb: "Divide 12 by $n$ first, then add 1." }],
            why: "$\\frac{12}{4} + 1 = 3 + 1 = 4$." },
          { type: "num", prompt: "Evaluate $2x^2$ when $x = 3$.", answer: 18, skill: "Powers before multiplication",
            near: [{ v: 36, fb: "That squares $2x$. The exponent belongs to $x$ alone: $2 \\cdot 3^2 = 2 \\cdot 9$." },
                   { v: 12, fb: "$3^2$ is $3 \\times 3 = 9$, not $3 \\times 2$." }],
            hints: ["Which comes first: the square or the multiplication by 2?"],
            why: "Powers come before multiplication: $3^2 = 9$, then $2 \\times 9 = 18$." },
          { type: "choice", prompt: "What is $-x^2$ when $x = 4$?",
            options: [{ t: "$-16$" }, { t: "$16$", fb: "The square is done before the minus sign: $-(4^2) = -16$. To square $-4$ you'd write $(-x)^2$." },
                      { t: "$-8$", fb: "$x^2$ is $4 \\times 4$, not $4 \\times 2$." }, { t: "$8$", fb: "Square first, then apply the minus: $-(4 \\times 4)$." }],
            answer: 0, skill: "Powers before multiplication",
            why: "$-x^2$ means “the negative of $x^2$”: $-(4^2) = -16$." }
        ]
      },
      /* ------------------------------------------------------------ 2 */
      {
        title: "More than one letter",
        blurb: "Two variables, fractions and decimals — the same substitution, done carefully.",
        steps: [
          { type: "num", prompt: "A rectangle's perimeter is $2l + 2w$. What is it when $l = 7$ and $w = 3$?", answer: 20,
            near: [{ v: 21, fb: "That's the area, $l \\times w$. The perimeter goes round the outside: two lengths and two widths." },
                   { v: 10, fb: "That's one length and one width — the perimeter has two of each." }],
            why: "$2(7) + 2(3) = 14 + 6 = 20$." },
          { type: "table", prompt: "Fill in the value of $3a - b$ for each pair.",
            head: ["$a$", "$b$", "$3a - b$"], rows: [[2, 1, null], [4, 5, null], [0, 3, null], [-1, 2, null]],
            answers: [[0, 2, 5], [1, 2, 7], [2, 2, -3], [3, 2, -5]],
            hints: ["Row by row: triple $a$, then take away $b$."],
            why: "$3(2) - 1 = 5$, $3(4) - 5 = 7$, $3(0) - 3 = -3$, $3(-1) - 2 = -5$." },
          { type: "learn", prompt: "With negative numbers, brackets keep the signs honest. When $b = -2$, write $a - b$ as $a - (-2)$, which is $a + 2$. Taking away a negative is adding." },
          { type: "choice", prompt: "What is $ab - b$ when $a = 3$ and $b = -2$?",
            options: [{ t: "$-4$" }, { t: "$-8$", fb: "$-b$ with $b = -2$ is $-(-2) = +2$, not $-2$." }, { t: "$4$", fb: "$ab = 3 \\times (-2) = -6$ — it's negative." }, { t: "$8$", fb: "Start with $ab$: $3 \\times (-2) = -6$." }],
            answer: 0, skill: "Evaluate with several variables",
            why: "$3(-2) - (-2) = -6 + 2 = -4$." },
          { type: "num", prompt: "Evaluate $\\frac{1}{2}x + y$ when $x = 6$ and $y = \\frac{3}{4}$.", answer: 3.75, shown: "15/4",
            label: "Your answer (a fraction or a decimal)", skill: "Fractions and decimals",
            why: "$\\frac{1}{2}(6) + \\frac{3}{4} = 3 + \\frac{3}{4} = 3\\frac{3}{4}$, or $3.75$." },
          { type: "num", prompt: "Evaluate $0.5p - 2q$ when $p = 8$ and $q = 1.5$.", answer: 1, skill: "Fractions and decimals",
            why: "$0.5(8) - 2(1.5) = 4 - 3 = 1$." }
        ]
      },
      /* ------------------------------------------------------------ 3 */
      {
        title: "Like terms",
        blurb: "You can add apples to apples. Combining terms, and multiplying out brackets.",
        steps: [
          { type: "learn", prompt: "A fruit bowl has 3 apples and 2 oranges. You add 4 more apples. You can say “7 apples and 2 oranges” — but not “9 apples”. Algebra works the same way: $$3x + 2y + 4x = 7x + 2y$$ Terms with the same letter (to the same power) are **like terms**, and only like terms combine." },
          { type: "sort", prompt: "Sort these terms by what they're counting.",
            bins: ["$x$ terms", "$y$ terms", "just numbers"],
            cards: [{ t: "$3x$", bin: 0 }, { t: "$-2y$", bin: 1 }, { t: "$5$", bin: 2 }, { t: "$x$", bin: 0 },
                    { t: "$4y$", bin: 1 }, { t: "$-1$", bin: 2 }, { t: "$-6x$", bin: 0, fb: "$-6x$ counts $x$'s — six of them owed. The sign stays with the term." },
                    { t: "$\\frac{1}{2}y$", bin: 1 }],
            skill: "Identify like terms" },
          { type: "expr", prompt: "Simplify $3x + 2y + 4x$.", answer: "7x + 2y", form: "simplified", skill: "Combine like terms",
            near: [{ v: "9xy", fb: "$x$'s and $y$'s don't combine — like apples and oranges." }, { v: "9x", fb: "The $2y$ can't join the $x$'s." }],
            why: "$3x + 4x = 7x$, and $2y$ stays as it is: $7x + 2y$." },
          { type: "expr", prompt: "Simplify $4a - 7 - 6a + 2$.", answer: "-2a - 5", form: "simplified", skill: "Negative coefficients",
            near: [{ v: "2a - 5", fb: "$4a - 6a$ is $-2a$: you owe more $a$'s than you have." }, { v: "-2a - 9", fb: "$-7 + 2 = -5$, not $-9$." }],
            hints: ["Collect the $a$ terms, keeping each one's sign: $4a - 6a$.", "Then the numbers: $-7 + 2$."],
            why: "$4a - 6a = -2a$ and $-7 + 2 = -5$, so $-2a - 5$." },
          { type: "learn", prompt: "Why is $3(x + 2) = 3x + 6$? Think of it as area: a rectangle 3 tall and $x + 2$ wide splits into two pieces.",
            scene: { type: "tiles", mode: "area", rows: ["3"], cols: ["x", "2"], cw: [170, 70], rh: [110], cells: [["3x", "6"]],
                     readout: "$3(x + 2) = 3x + 6$" },
            gate: true, then: "Multiplying out a bracket — the **distributive property** — multiplies *every* term inside by the number outside." },
          { type: "expr", prompt: "Expand and simplify $2(x + 5) + 3x$.", answer: "5x + 10", form: "simplified", skill: "Distribute and combine",
            near: [{ v: "5x + 5", fb: "The 2 multiplies the 5 as well: $2(x + 5) = 2x + 10$." }],
            why: "$2(x + 5) = 2x + 10$, then $2x + 3x = 5x$: $5x + 10$." },
          { type: "expr", prompt: "Expand and simplify $-3(2x - 1) + 4x$.", answer: "-2x + 3", form: "simplified", skill: "Distribute and combine",
            near: [{ v: "-2x - 3", fb: "$-3 \\times -1 = +3$. Two negatives make a positive." }, { v: "10x + 3", fb: "$-3 \\times 2x = -6x$, and $-6x + 4x = -2x$." }],
            hints: ["The $-3$ multiplies both $2x$ and $-1$.", "$-3 \\cdot 2x = -6x$ and $-3 \\cdot (-1) = +3$."],
            why: "$-3(2x - 1) = -6x + 3$; $-6x + 4x = -2x$. So $-2x + 3$." },
          { type: "expr", prompt: "Simplify $\\frac{1}{2}x + \\frac{1}{3}x$.", answer: "5/6 x", form: "simplified", skill: "Rational coefficients",
            near: [{ v: "2/5 x", fb: "Fractions don't add top-and-bottom. Use a common denominator: $\\frac{3}{6} + \\frac{2}{6}$." }],
            placeholder: "e.g. 5/6x",
            why: "$\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$, so $\\frac{5}{6}x$." }
        ]
      },
      /* ------------------------------------------------------------ 4 */
      {
        title: "Equivalent expressions",
        blurb: "Two expressions are the same when they agree for every value of the letter.",
        steps: [
          { type: "learn", prompt: "The blue line shows $2(x + 3)$ for every $x$. The orange line shows $ax + b$. Move the sliders until the two expressions agree everywhere.",
            scene: { type: "plane", x: [-6, 6], y: [-8, 16], grid: 1, labelEveryY: 4,
                     params: { a: { v: 1, min: -3, max: 4, step: 1, label: "$a$" }, b: { v: 0, min: -6, max: 10, step: 1, label: "$b$" } },
                     fns: [{ f: "2*(x+3)", color: "blue", label: "2(x + 3)", labelAt: -4.2 }, { f: "a*x + b", color: "orange", dashed: true }],
                     readout: function (s) { return "$2(x + 3)$ vs. $" + L.poly([[s.params.a, "x"], [s.params.b, ""]]) + "$" + (s.params.a === 2 && s.params.b === 6 ? " — the same everywhere" : ""); },
                     goal: function (s) { return s.params.a === 2 && s.params.b === 6; } },
            gate: true, then: "When $a = 2$ and $b = 6$ the lines are one line: $2(x + 3)$ and $2x + 6$ are **equivalent** — equal for every value of $x$, not just some." },
          { type: "choice", prompt: "Which expression is equivalent to $3(x - 4)$?",
            options: [{ t: "$3x - 12$" }, { t: "$3x - 4$", fb: "The 3 multiplies the $-4$ too." }, { t: "$x - 12$", fb: "The 3 multiplies the $x$ too." }, { t: "$3x + 12$", fb: "$3 \\times (-4) = -12$." }],
            answer: 0, skill: "Equivalent expressions" },
          { type: "multi", prompt: "Which of these are equivalent to $6x + 9$? Pick every one.",
            options: [{ t: "$3(2x + 3)$", ok: true }, { t: "$9 + 6x$", ok: true }, { t: "$2x + 3 + 4x + 6$", ok: true },
                      { t: "$3(2x + 9)$", ok: false, fb: "$3(2x + 9) = 6x + 27$." }, { t: "$15x$", ok: false, fb: "$6x$ and $9$ aren't like terms — they don't make $15x$." }],
            skill: "Equivalent expressions" },
          { type: "num", prompt: "Maya thinks $(x + 2)^2$ is the same as $x^2 + 4$. Test it at $x = 1$. What is $(x + 2)^2$ when $x = 1$?", answer: 9,
            why: "$(1 + 2)^2 = 3^2 = 9$." },
          { type: "choice", prompt: "And $x^2 + 4$ at $x = 1$ is $5$. So are they equivalent?",
            options: [{ t: "No — one value where they differ is enough to show it" }, { t: "Maybe — you'd need to try more values", fb: "To show two expressions are *not* equivalent, one counterexample settles it. (To show they *are*, you'd need algebra — or every value.)" },
                      { t: "Yes — they both have a square and a 4", fb: "Looking similar isn't being equal. They gave 9 and 5 for the same $x$." }],
            answer: 0, skill: "Test by substituting",
            why: "$(x + 2)^2 = x^2 + 4x + 4$ — Maya forgot the middle term, $4x$." }
        ]
      },
      /* ------------------------------------------------------------ 5 */
      {
        title: "Why you can't divide by zero",
        blurb: "Division undoes multiplication — and multiplying by zero can't be undone.",
        steps: [
          { type: "learn", prompt: "$12 \\div 3 = 4$ because $3 \\times 4 = 12$. Dividing asks: *what do I multiply by 3 to get 12?*" },
          { type: "choice", prompt: "So $12 \\div 0$ asks: what number, multiplied by $0$, gives $12$?",
            options: [{ t: "There's no such number" }, { t: "$0$", fb: "$0 \\times 0 = 0$, not 12." }, { t: "$12$", fb: "$0 \\times 12 = 0$, not 12." },
                      { t: "Infinity", fb: "Infinity isn't a number you can multiply by. And zero times anything is still zero." }],
            answer: 0, skill: "Division by zero",
            why: "Anything times 0 is 0 — never 12. So $12 \\div 0$ has no answer: it's **undefined**." },
          { type: "learn", prompt: "Here is $y = \\frac{12}{x}$. Slide $x$ towards $0$ from either side and watch $y$.",
            scene: { type: "plane", x: [-6, 6], y: [-30, 30], grid: 1, labelEveryY: 10, aspect: 0.8,
                     params: { t: { v: 3, min: -3, max: 3, step: 0.25, label: "$x$" } },
                     fns: [{ f: "12/x", color: "blue" }],
                     marks: [{ x: function (p) { return p.t; }, y: function (p) { return p.t === 0 ? NaN : 12 / p.t; }, color: "orange", label: function (p) { return p.t === 0 ? "" : "y = " + L.num(Math.round(1200 / p.t) / 100); } }],
                     readout: function (s) { var t = s.params.t; return t === 0 ? "$x = 0$: $\\frac{12}{0}$ is undefined — there's no point" : "$x = " + L.num(t) + "$, $y = " + L.num(Math.round(1200 / t) / 100) + "$"; },
                     goal: function (s) { return s.params.t === 0; } },
            gate: true, then: "From the right, $y$ shoots up; from the left, it plunges down. There's no single value it could be — at $x = 0$ the graph simply has a gap." },
          { type: "choice", prompt: "What about $0 \\div 0$? It asks what number times $0$ gives $0$.",
            options: [{ t: "Every number works, so no single answer — it's undefined too" }, { t: "$0$", fb: "0 works — but so does 5, and so does $-17$. A division has to have one answer." },
                      { t: "$1$", fb: "1 works — but so does every other number." }],
            answer: 0, skill: "Division by zero",
            why: "Every number times 0 is 0, so $0 \\div 0$ can't pick one. Mathematicians call it *indeterminate*; either way, it has no value." },
          { type: "multi", prompt: "Which of these are undefined? Pick every one.",
            options: [{ t: "$\\frac{5}{0}$", ok: true }, { t: "$\\frac{0}{5}$", ok: false, fb: "$\\frac{0}{5} = 0$: five equal shares of nothing are nothing. Zero on top is fine." },
                      { t: "$\\frac{7}{3 - 3}$", ok: true }, { t: "$\\frac{x - 2}{x - 2}$ when $x = 2$", ok: true },
                      { t: "$\\frac{x}{4}$ when $x = 0$", ok: false, fb: "That's $\\frac{0}{4} = 0$." }],
            skill: "Division by zero" }
        ]
      }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a1-eval1", title: "Evaluating expressions with one variable", lesson: 1,
        gen: function (R) {
          var x = R.int(-5, 9), a = R.nz(-6, 9), b = R.int(1, 12), kind = R.int(0, 4), tex, val;
          if (kind === 0) { tex = poly([[a, "x"], [b * R.sign(), ""]]); val = null; }
          if (kind === 1) { tex = a + "(x " + L.signed(b) + ")"; val = a * (x + b); }
          if (kind === 2) { x = R.nz(-4, 5); tex = poly([[a, "x^2"], [b, ""]]); val = a * x * x + b; }
          if (kind === 3) { var d = R.pick([1, 2, 3, 4, 6]); x = d * R.sign(); var top = d * R.int(2, 9); tex = "\\frac{" + top + "}{x} " + L.signed(b); val = top / x + b; }
          if (kind === 4) { tex = b + " - " + (Math.abs(a) === 1 ? "" : Math.abs(a)) + "x"; val = b - Math.abs(a) * x; }
          if (val === null) val = L.evalTree(L.parse(tex.replace(/\\frac\{(\d+)\}\{x\}/, "$1/x")), { x: x });
          return { type: "num", prompt: "Evaluate $" + tex + "$ when $x = " + x + "$.", answer: val,
            hints: ["Replace $x$ with $(" + x + ")$ — keep the brackets, they keep the sign.", "Powers first, then multiply and divide, then add and subtract."],
            why: "Substitute $x = " + x + "$: $" + L.sub(tex, { x: x }) + " = " + num(val) + "$." };
        } },
      { id: "a1-eval2", title: "Evaluating expressions with multiple variables", lesson: 2,
        gen: function (R) {
          var a = R.nz(-5, 7), b = R.nz(-5, 7), p = R.nz(-4, 5), q = R.nz(-4, 5), kind = R.int(0, 3), tex, val;
          if (kind === 0) { tex = poly([[p, "a"], [q, "b"]]); val = p * a + q * b; }
          if (kind === 1) { tex = "ab " + L.signed(q); val = a * b + q; }
          if (kind === 2) { tex = "a^2 - " + (Math.abs(q) === 1 ? "" : Math.abs(q)) + "b"; val = a * a - Math.abs(q) * b; }
          if (kind === 3) { tex = p + "(a - b)"; val = p * (a - b); }
          return { type: "num", prompt: "Evaluate $" + tex + "$ when $a = " + a + "$ and $b = " + b + "$.", answer: val,
            hints: ["Put each value in its place, in brackets."],
            why: "With $a = " + a + "$ and $b = " + b + "$: $" + L.sub(tex, { a: a, b: b }).replace(/\)\(/g, ")\\cdot(") + " = " + num(val) + "$." };
        } },
      { id: "a1-eval3", title: "Evaluating with fractions & decimals", lesson: 2,
        gen: function (R) {
          if (R.chance(0.5)) {
            var d = R.pick([2, 3, 4, 5]), n = R.int(1, d - 1), x = d * R.int(1, 6), y = R.pick([0.5, 1.5, 2.5, 0.25, 0.75]);
            var val = n / d * x + y;
            return { type: "num", prompt: "Evaluate $\\frac{" + n + "}{" + d + "}x + y$ when $x = " + x + "$ and $y = " + y + "$.", answer: val,
              hints: ["$\\frac{" + n + "}{" + d + "}$ of " + x + " is " + x + " ÷ " + d + " × " + n + "."],
              why: "$\\frac{" + n + "}{" + d + "}(" + x + ") + " + y + " = " + num(n / d * x) + " + " + y + " = " + num(val) + "$." };
          }
          var p = R.pick([0.2, 0.5, 1.5, 2.5]), q = R.int(2, 6), a = R.int(2, 12), b = R.pick([0.5, 1.5, 2, 0.25]);
          var v = p * a - q * b;
          return { type: "num", prompt: "Evaluate $" + p + "m - " + q + "n$ when $m = " + a + "$ and $n = " + b + "$.", answer: Math.round(v * 1e6) / 1e6,
            why: "$" + p + "(" + a + ") - " + q + "(" + b + ") = " + num(p * a) + " - " + num(q * b) + " = " + num(v) + "$." };
        } },
      { id: "a1-like1", title: "Combining like terms with negative coefficients", lesson: 3,
        gen: function (R) {
          var a = R.nz(-9, 9), b = R.nz(-9, 9), c = R.nz(-9, 9), d = R.nz(-9, 9), v = R.pick(["x", "y", "a", "k"]);
          var tex = poly([[a, v], [c, ""], [b, v], [d, ""]]);
          var ans = poly([[a + b, v], [c + d, ""]]);
          return { type: "expr", prompt: "Simplify $" + tex + "$.", answer: ans.replace(/\s/g, ""), shown: ans, form: "simplified",
            hints: ["Collect the $" + v + "$ terms with their signs: $" + poly([[a, v], [b, v]]) + "$.", "Then the numbers: $" + poly([[c, ""], [d, ""]], { keepZero: true }) + "$."],
            why: "$" + poly([[a, v], [b, v]]) + " = " + poly([[a + b, v]]) + "$ and $" + poly([[c, ""], [d, ""]], { keepZero: true }) + " = " + (c + d) + "$: $" + ans + "$." };
        } },
      { id: "a1-like2", title: "Combining like terms with distribution", lesson: 3,
        gen: function (R) {
          var k = R.int(2, 6) * R.sign(), a = R.nz(-4, 5), b = R.nz(-7, 7), c = R.nz(-6, 6), v = R.pick(["x", "p", "t"]);
          var tex = k + "(" + poly([[a, v], [b, ""]]) + ") " + (c < 0 ? "- " : "+ ") + (Math.abs(c) === 1 ? "" : Math.abs(c)) + v;
          var ans = poly([[k * a + c, v], [k * b, ""]]);
          return { type: "expr", prompt: "Expand and simplify $" + tex + "$.", answer: ans.replace(/\s/g, ""), shown: ans, form: "simplified",
            hints: ["Multiply every term in the bracket by $" + k + "$.", "$" + k + " \\cdot " + poly([[a, v]]) + " = " + poly([[k * a, v]]) + "$ and $" + k + " \\cdot " + b + " = " + k * b + "$."],
            near: [{ v: poly([[k * a + c, v], [b, ""]]).replace(/\s/g, ""), fb: "The number outside multiplies *every* term inside — the " + b + " too." }],
            why: "$" + k + "(" + poly([[a, v], [b, ""]]) + ") = " + poly([[k * a, v], [k * b, ""]]) + "$; then $" + poly([[k * a, v], [c, v]]) + " = " + poly([[k * a + c, v]]) + "$. Answer: $" + ans + "$." };
        } },
      { id: "a1-like3", title: "Combining like terms with rational coefficients", lesson: 3,
        gen: function (R) {
          var d1 = R.pick([2, 3, 4, 5, 6]), d2 = R.pick([2, 3, 4, 5]), n1, n2;
          do { n1 = R.int(1, d1 - 1); } while (L.gcd(n1, d1) !== 1);
          do { n2 = R.int(1, d2 - 1); } while (L.gcd(n2, d2) !== 1 || d2 === d1 && n2 === n1);
          n2 *= R.sign();
          var top = n1 * d2 + n2 * d1, bot = d1 * d2;
          if (top === 0) top = bot;
          var c = R.nz(-5, 5);
          var tex = "\\frac{" + n1 + "}{" + d1 + "}x " + (n2 < 0 ? "- " : "+ ") + "\\frac{" + Math.abs(n2) + "}{" + d2 + "}x " + L.signed(c);
          var ansT = L.fracText(top, bot) + "x " + (c < 0 ? "- " + -c : "+ " + c);
          return { type: "expr", prompt: "Simplify $" + tex + "$.", answer: "(" + top + "/" + bot + ")x + " + c, shown: ansT, form: "simplified",
            placeholder: "e.g. 5/6x + 2",
            hints: ["Give the fractions a common denominator: " + bot + "."],
            why: "$\\frac{" + n1 + "}{" + d1 + "} " + (n2 < 0 ? "-" : "+") + " \\frac{" + Math.abs(n2) + "}{" + d2 + "} = \\frac{" + n1 * d2 + "}{" + bot + "} " + (n2 < 0 ? "-" : "+") + " \\frac{" + Math.abs(n2) * d1 + "}{" + bot + "} = " + frac(top, bot) + "$, so $" + (top === bot ? "" : top === -bot ? "-" : frac(top, bot)) + "x " + L.signed(c) + "$." };
        } },
      { id: "a1-equiv", title: "Equivalent expressions", lesson: 4,
        gen: function (R) {
          var k = R.pick([2, 3, 4, 5, -2, -3]), a = R.nz(-5, 6), b = R.nz(-8, 8);
          var tex = k + "(" + poly([[a, "x"], [b, ""]]) + ")";
          var right = poly([[k * a, "x"], [k * b, ""]]);
          return mc(R, { prompt: "Which expression is equivalent to $" + tex + "$?", right: "$" + right + "$",
            wrong: [{ t: "$" + poly([[k * a, "x"], [b, ""]]) + "$", fb: "The " + k + " multiplies the " + b + " too." },
                    { t: "$" + poly([[a, "x"], [k * b, ""]]) + "$", fb: "The " + k + " multiplies the $" + poly([[a, "x"]]) + "$ too." },
                    { t: "$" + poly([[k * a, "x"], [-k * b, ""]]) + "$", fb: "Check the sign: $" + k + " \\times " + b + " = " + k * b + "$." }],
            hints: ["Multiply each term in the bracket by " + k + "."],
            why: "$" + tex + " = " + right + "$." });
        } },
      { id: "a1-undef", title: "Undefined expressions", lesson: 5,
        gen: function (R) {
          var c = R.int(1, 9), top = R.int(1, 20), x = R.int(-6, 6);
          var zeroAt = R.chance(0.5);
          var val = zeroAt ? c : c + R.nz(-3, 3);
          var tex = "\\frac{" + top + "}{x - " + c + "}";
          return mc(R, { prompt: "Is $" + tex + "$ defined when $x = " + val + "$?",
            right: zeroAt ? "No — the bottom would be $0$" : "Yes — it's $" + frac(top, val - c) + "$",
            wrong: zeroAt ? [{ t: "Yes — it's $0$", fb: "A zero on the *bottom* isn't a value of 0 — there's no number at all." }, { t: "Yes — it's $" + top + "$", fb: "The bottom is $" + val + " - " + c + " = 0$. Nothing can be divided by 0." }]
                          : [{ t: "No — the bottom would be $0$", fb: "The bottom is $" + val + " - " + c + " = " + (val - c) + "$, which isn't zero." }, { t: "Yes — it's $0$", fb: "Only a zero on *top* makes the value 0." }],
            why: zeroAt ? "At $x = " + val + "$ the bottom is $" + val + " - " + c + " = 0$: undefined." : "The bottom is $" + (val - c) + "$, so the value is $" + frac(top, val - c) + "$." });
        } }
    ]
  });
})();
