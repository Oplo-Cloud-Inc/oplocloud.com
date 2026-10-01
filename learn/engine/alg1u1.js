/* ==========================================================================
   Algebra I — Unit 1, as a knowledge graph.

   This is the first unit written for the learning engine rather than for a
   page. It is not seven lessons. It is twenty-two concepts in a dependency
   graph, each with the representations it can be shown in, the beliefs a
   student can hold about it that are wrong, and content objects the engine
   may choose from at its own discretion.

   What changed from the lesson-path version, and why:

   **Prerequisites are real, and they are not the lesson order.** Unit 1 of
   any Algebra I syllabus walks: variables, expressions, order of operations,
   like terms, the distributive property, equations, word problems. That is
   the *presentation* order and it is recorded as `unit: 1`. The dependency
   order is different and it is recorded as `prereq`, because order of
   operations is needed *before* negative distribution is asked, and nothing
   in the syllabus order says so. When the two disagree the engine repairs
   the gap inside the unit the school assigned rather than sending the
   student forward to a unit they have not been taught.

   **Concepts, not chapters.** "Order of operations" and "brackets before
   powers" are separate concepts with separate states, because a student can
   hold one and not the other, and a single rung for "order of operations"
   would hide exactly the gap the engine exists to find.

   **Every likely wrong answer is a belief, not an error.** The signatures
   below match on the value the student actually produced — `4 + 5` where
   `4n` was meant, `2x` where `8x` should be, an answer that is right for
   the number of times the coefficient appears. Each one is repaired with
   something to *do*, then discriminated with a probe the belief gets wrong
   and the understanding gets right.

   **Every concept has more than one representation.** A concept with one
   representation can only be retaught harder; the engine's first move when
   evidence says a student is stuck is to change how it is shown, and that
   is only possible if the alternatives were written.
   ========================================================================== */
(function (root) {
  "use strict";

  var E = root.OPLO_ENGINE;
  if (!E) throw new Error("alg1u1: load the engine first");

  /* ====================================================================
     1. THE GRAPH
     tier 0 = arithmetic the student arrived with, held only so the engine
              can be honest about what it is assuming
     tier 1 = core ideas of the unit
     tier 2 = built from core ideas
     tier 3 = synthesis
     ==================================================================== */
  E.KG.define([
    /* --- Tier 0: arrived with. Not taught, but modelled, because "do they
       actually have this" is the first thing that goes wrong and the
       engine has to be able to check it rather than assume it. --- */
    { id: "add-sub-neg", name: "Adding and subtracting with negative numbers", tier: 0, unit: 0,
      blurb: "Signed arithmetic, including the two sign rules that go wrong.",
      reps: ["quantitative", "verbal", "symbolic"],
      needs: ["procedural"] },
    { id: "mul-neg", name: "Multiplying negatives", tier: 0, unit: 0,
      blurb: "Why a product of two negatives is positive.",
      prereq: ["add-sub-neg"], reps: ["visual", "quantitative", "verbal", "symbolic"],
      needs: ["conceptual", "procedural"] },
    { id: "int-arith", name: "Arithmetic with fractions and decimals", tier: 0, unit: 0,
      blurb: "Common denominators, and doing arithmetic without a calculator.",
      reps: ["quantitative", "procedural"], needs: ["procedural"] },

    /* --- Tier 1: the core ideas. --- */
    { id: "var", name: "A letter stands for a number", tier: 1, unit: 1,
      blurb: "A variable is a name for an unknown, not a mystery.",
      prereq: ["int-arith"],
      reps: ["concrete", "manipulative", "verbal", "quantitative", "symbolic", "realworld"],
      needs: ["conceptual", "procedural"] },

    { id: "shorthand", name: "Algebra's shorthand", tier: 1, unit: 1,
      blurb: "4n, n/2 and n² all mean something specific.",
      prereq: ["var"],
      reps: ["visual", "verbal", "quantitative", "symbolic", "realworld"],
      needs: ["conceptual", "procedural"] },

    { id: "expression", name: "What an expression is", tier: 1, unit: 1,
      blurb: "A recipe with no equals sign: it turns input into output.",
      prereq: ["shorthand"],
      reps: ["concrete", "manipulative", "verbal", "quantitative", "symbolic", "realworld"],
      needs: ["conceptual"] },

    { id: "evaluate", name: "Substituting and evaluating", tier: 1, unit: 1,
      blurb: "Put the number in and work it out.",
      prereq: ["expression", "int-arith"],
      reps: ["manipulative", "procedural", "quantitative", "symbolic"],
      needs: ["procedural"] },

    { id: "multi-var", name: "More than one letter at once", tier: 1, unit: 1,
      blurb: "Two variables are two unknowns, each with its own value.",
      prereq: ["evaluate"],
      reps: ["manipulative", "quantitative", "symbolic", "verbal"],
      needs: ["procedural", "conceptual"] },

    { id: "fraction-var", name: "Fractions and decimals with a variable", tier: 1, unit: 1,
      blurb: "A fraction bar over a letter is the same operation as over numbers.",
      prereq: ["evaluate", "int-arith"],
      reps: ["visual", "procedural", "quantitative", "symbolic"],
      needs: ["procedural"] },

    /* --- Order of operations, split so a gap in one part is visible. --- */
    { id: "oop-brackets", name: "Brackets before anything else", tier: 1, unit: 1,
      blurb: "Whatever is in the bracket is done first, whole.",
      prereq: ["int-arith"],
      reps: ["procedural", "visual", "symbolic"],
      needs: ["procedural", "conceptual"] },
    { id: "oop-powers", name: "Powers before multiplication", tier: 1, unit: 1,
      blurb: "The small number on a term applies to that term alone.",
      prereq: ["oop-brackets", "shorthand"],
      reps: ["procedural", "visual", "symbolic"],
      needs: ["procedural", "conceptual"] },
    { id: "oop-md", name: "Multiplying and dividing left to right", tier: 1, unit: 1,
      blurb: "Same precedence, so they are done in written order.",
      prereq: ["oop-powers", "mul-neg"],
      reps: ["procedural", "visual", "symbolic"],
      needs: ["procedural"] },
    { id: "oop-as", name: "Adding and subtracting last", tier: 1, unit: 1,
      blurb: "Everything else is done before a sum is totalled.",
      prereq: ["oop-md"],
      reps: ["procedural", "visual", "symbolic"],
      needs: ["procedural"] },
    { id: "oop", name: "Order of operations as a whole", tier: 2, unit: 1,
      blurb: "Brackets, powers, times and divide, then sums.",
      prereq: ["oop-brackets", "oop-powers", "oop-md", "oop-as"],
      reps: ["procedural", "quantitative", "symbolic", "realworld"],
      needs: ["procedural", "reasoning"] },

    /* --- Terms and combination. --- */
    { id: "term", name: "What a term is", tier: 1, unit: 1,
      blurb: "Terms are the pieces joined by + and −, signs included.",
      prereq: ["expression"],
      reps: ["visual", "verbal", "symbolic"],
      needs: ["conceptual"] },
    { id: "like", name: "Like terms", tier: 1, unit: 1,
      blurb: "Same letters to the same powers — coefficient aside.",
      prereq: ["term", "add-sub-neg"],
      reps: ["visual", "manipulative", "verbal", "symbolic"],
      needs: ["conceptual", "procedural"] },
    { id: "combine", name: "Combining like terms", tier: 2, unit: 1,
      blurb: "Add the coefficients, keep the letters.",
      prereq: ["like", "add-sub-neg"],
      reps: ["procedural", "quantitative", "symbolic"],
      needs: ["procedural"] },

    { id: "distribute", name: "Distributing over addition", tier: 1, unit: 1,
      blurb: "Multiplying by a bracket multiplies every term inside it.",
      prereq: ["oop-md", "term"],
      reps: ["manipulative", "visual", "procedural", "symbolic", "verbal"],
      needs: ["procedural", "conceptual"] },
    { id: "distribute-neg", name: "Distributing a negative", tier: 2, unit: 1,
      blurb: "The sign goes on every term, and subtraction is not distributive.",
      prereq: ["distribute", "mul-neg", "add-sub-neg"],
      reps: ["manipulative", "visual", "procedural", "symbolic"],
      needs: ["procedural", "conceptual"] },
    { id: "factor-out", name: "Factoring out a common factor", tier: 2, unit: 1,
      blurb: "The same operation, run backwards.",
      prereq: ["distribute"],
      reps: ["procedural", "visual", "symbolic"],
      needs: ["procedural", "reasoning"] },

    { id: "equiv", name: "Equivalent expressions", tier: 2, unit: 1,
      blurb: "Different writing, same value — for every input.",
      prereq: ["combine", "distribute"],
      reps: ["manipulative", "quantitative", "symbolic", "visual"],
      needs: ["reasoning", "conceptual"] },

    { id: "undefined", name: "When an expression has no value", tier: 2, unit: 1,
      blurb: "Division by zero is not 0; it is nothing at all.",
      prereq: ["fraction-var", "oop-md"],
      reps: ["visual", "manipulative", "verbal", "symbolic"],
      needs: ["conceptual", "reasoning"] },

    { id: "from-words", name: "Writing an expression from words", tier: 2, unit: 1,
      blurb: "Words become symbols, and the order matters.",
      prereq: ["expression", "shorthand", "oop-powers"],
      reps: ["verbal", "realworld", "quantitative", "symbolic"],
      needs: ["reasoning", "conceptual"] },

    { id: "equation", name: "Solving a one-step equation", tier: 2, unit: 1,
      blurb: "Undo the operation, keeping both sides equal.",
      prereq: ["distribute", "like", "add-sub-neg"],
      reps: ["manipulative", "procedural", "visual", "symbolic", "realworld"],
      needs: ["procedural", "reasoning"] },
    { id: "equation-2step", name: "Solving a two-step equation", tier: 3, unit: 1,
      blurb: "Two things done to the variable, so two things to undo.",
      prereq: ["equation", "oop-as"],
      reps: ["procedural", "quantitative", "symbolic", "realworld"],
      needs: ["procedural", "reasoning"] },
    { id: "model", name: "Solving a real problem with algebra", tier: 3, unit: 1,
      blurb: "Unknown to variable, words to expression, solve, check it is sensible.",
      prereq: ["equation-2step", "from-words"],
      reps: ["realworld", "verbal", "quantitative", "symbolic"],
      needs: ["reasoning", "transfer"] }
  ]);

  /* ====================================================================
     2. MISCONCEPTIONS
     Each signature matches on what the student actually produced. A belief
     that fires on every wrong answer is not a signature, so the `low`
     branch keeps the noise down: an unmatched wrong answer leaves the
     distribution diffuse and the engine probes instead of asserting.
     ==================================================================== */
  E.Misconception.defineMisconceptions([
    {
      concept: "shorthand", name: "A coefficient is a digit beside the letter",
      prior: 0.28,
      belief: "that 4n is the two-digit number 45, because the digits sit side by side",
      tell: function (ev) {
        var v = ev.value, n = ev.given, c = ev.coefficient;
        if (typeof v !== "number" || typeof n !== "number") return 0;
        // Writing the coefficient and the value as one number: 4 and 5 → 45.
        if (c != null && n < 10 && Math.abs(v - (10 * n + c)) < 1e-9) return 0.95;
        if (c != null && n < 10 && Math.abs(v - (10 * c + n)) < 1e-9) return 0.95;
        if (n > 0 && Math.abs(v - n) < 1e-9) return 0.6;              // read as c + n
        if (typeof c === "number" && c > 0 && Math.abs(v - (c + n)) < 1e-9) return 0.6;
        return 0.1;
      },
      repair: {
        say: "You read the 4 and the 5 as the digits of one number. In algebra a number written next to a letter is a multiplier: 4n means 4 lots of n, so at n = 5 it is 4 × 5 = 20.",
        do: "Pick a value for n and drag out 4 copies of it — count the groups, not the digits.",
        probe: "coef-digits"
      }
    },
    {
      concept: "shorthand", name: "A fraction bar with a letter divides the other way",
      prior: 0.24,
      belief: "that a/b is b ÷ a, because the bottom number feels like the one doing the dividing",
      tell: function (ev) {
        var a = ev.givenA, b = ev.givenB;
        if (a == null || b == null || typeof ev.value !== "number") return 0;
        var right = a / b, flipped = b / a;
        if (Math.abs(ev.value - flipped) < 1e-9 && Math.abs(flipped - right) > 1e-9) return 0.95;
        return 0.08;
      },
      repair: {
        say: "The bar means the whole thing is divided by what is underneath. 2/7 is two sevenths: you have 2 and you split it into 7 parts. Reading it the other way round turns 2/7 into 7/2, which is a different number.",
        do: "Take 2 counters, share them between 7 people — that is 2/7.",
        probe: "frac-flip"
      }
    },
    {
      concept: "oop-powers", name: "A power applies to everything to its left",
      prior: 0.26,
      belief: "that in a + b·c² the square belongs to the whole expression, or that it belongs to b as well",
      tell: function (ev) {
        var v = ev.value, w = ev.wrongSpread;
        if (typeof v !== "number" || !w) return 0;
        if (w.indexOf(v) !== -1 && ev.dimension === "compute") return 0.8;
        return 0.1;
      },
      repair: {
        say: "A small number up top belongs to the term directly under it and nothing else. In a + b·c² only the c is squared. Brackets are how you make a power reach further — (a + b)² squares the whole bracket.",
        do: "Highlight the term the power sits on. Rewrite the expression so each powered part has its own bracket.",
        probe: "power-scope"
      }
    },
    {
      concept: "oop-md", name: "Multiplication and division can be done in any order",
      prior: 0.3,
      belief: "that × and ÷ are interchangeable, so 12 ÷ 3 × 4 can be done as 4 × 12 ÷ 3",
      tell: function (ev) { return ev.metaconcept === "oop-md" && ev.kind === "wrong" ? 0.55 : 0.08; },
      repair: {
        say: "× and ÷ sit at the same level, so when they are both there you work from left to right. Order matters even at the same level: 12 ÷ 3 × 4 is 4 × 4 = 16, and doing the division last gives 12 ÷ 12 = 1. The written order is the rule.",
        do: "Cover up everything to the right of the leftmost × or ÷ and do that pair first.",
        probe: "md-order"
      }
    },
    {
      concept: "like", name: "Terms with different variables are not like terms",
      prior: 0.2,
      belief: "that 3x and 3y can be collected into 6x because the 3s match",
      tell: function (ev) {
        if (typeof ev.value !== "string" && typeof ev.value !== "number") return 0;
        return /(\d)\s*x\s*y|\by\s*\+\s*.*x/i.test(String(ev.value)) ? 0.8 : 0.08;
      },
      repair: {
        say: "Like terms need the same letters with the same powers. 3x and 3y are different terms — a number is not a variable. You can only collect 3x and 5x, or 3x and 5x² is not allowed either because the powers differ.",
        do: "Underline the letters and their powers in each term. Collect only terms whose underlining matches exactly.",
        probe: "like-match"
      }
    },
    {
      concept: "distribute", name: "The multiplier reaches only the first term",
      prior: 0.32,
      belief: "that in 3(x + 5) only the x gets multiplied and the 5 is left alone",
      tell: function (ev) {
        var v = ev.value, coef = ev.coefficient;
        if (typeof v !== "string" || coef == null) return 0;
        // the classic: 3(x+5) -> 3x + 5 instead of 3x + 15
        var t = String(v).replace(/\s/g, "");
        var m = t.match(/^([+-]?)(\d*)x([+-])(\d+)$/);
        if (m && Math.abs(Number(m[2] || 1)) === Math.abs(coef)) return 0.95;
        if (m && Number(m[4]) === coef) return 0.9;
        return 0.1;
      },
      repair: {
        say: "The number outside a bracket multiplies everything inside it. 3(x + 5) means 3·x + 3·5, so the 5 becomes 15. A shortcut that always works: put a 1 in front of the bare number, so it reads 3(x + 5 + 0·1) — the 1 forces you to look at it.",
        do: "Write the 1 in: 3(x + 5) → 3(x + 1·5), then multiply each piece and drop the 1.",
        probe: "dist-all"
      }
    },
    {
      concept: "distribute-neg", name: "A minus in front of a bracket flips only the first term",
      prior: 0.34,
      belief: "that -(x + 5) is -x + 5",
      tell: function (ev) {
        var t = String(ev.value == null ? "" : ev.value).replace(/\s/g, "");
        if (/^[+-]x?[+-]\d+$/.test(t) && /^[+-]?x/.test(t) === false) return 0.6;
        if (/^-[a-z]\+\d+$/.test(t) || /^\d+-[a-z]$/.test(t)) return 0.85;
        return 0.1;
      },
      repair: {
        say: "A negative in front of a bracket goes through to every term: -(x + 5) = -x - 5. The reliable way is to write the subtraction as an addition of a negative first: (x + 5) - (x + 5) = 0 + 0x, which shows you that both signs must match.",
        do: "Rewrite a - (b + c) as a + (-b) + (-c), then combine.",
        probe: "neg-through"
      }
    },
    {
      concept: "distribute-neg", name: "Subtracting a bracket means subtracting only its first term",
      prior: 0.3,
      belief: "that (2x + 3) - (x + 1) is 2x + 3 - x, with the last +1 left positive",
      tell: function (ev) {
        var t = String(ev.value == null ? "" : ev.value).replace(/\s/g, "");
        if (/^[+-]\d*[a-z]?[+-]\d*[a-z]?[+]\d+$/.test(t) && t.indexOf("--") === -1) return 0.6;
        return 0.12;
      },
      repair: {
        say: "To subtract a bracket you subtract every term in it. (2x + 3) - (x + 1) = 2x + 3 - x - 1 = x + 2. The 1 comes out of the bracket as -1, not +1.",
        do: "Change every + inside the bracket you are subtracting into a minus before you distribute anything.",
        probe: "sub-bracket"
      }
    },
    {
      concept: "equiv", name: "Equivalent means looks the same",
      prior: 0.28,
      belief: "that 2(x + 3) and 6 + 2x are only equal for one particular value of x",
      tell: function (ev) {
        if (ev.kind !== "wrong") return 0.06;
        if (ev.sawSingleValue) return 0.9;                     // tested one x and called it equivalent
        return 0.2;
      },
      repair: {
        say: "Equivalent expressions give the same value for every input, not just one. Check 2(x + 3) against 6 + 2x with x = 0, x = 1 and x = −2. Three different values all agreeing is not a coincidence.",
        do: "Test the pair at three inputs, one of them 0, and record all three.",
        probe: "equiv-three"
      }
    },
    {
      concept: "undefined", name: "Dividing by zero gives zero",
      prior: 0.26,
      belief: "that something divided by 0 comes out as 0",
      tell: function (ev) {
        if (ev.kind !== "wrong") return 0.08;
        return ev.value === 0 ? 0.9 : 0.3;
      },
      repair: {
        say: "Asking how many zeros fit into something is not a question with an answer of zero — it is not a question at all. 0 is the empty count, and you cannot split an empty count into pieces. That is why a zero on the bottom makes the expression undefined, while a zero on top makes it 0.",
        do: "Compare 0/5 and 5/0 on a number line and say what each one is asking.",
        probe: "div-zero"
      }
    },
    {
      concept: "from-words", name: "Reversed word order",
      prior: 0.3,
      belief: "that '5 less than a number' means 5 − n",
      tell: function (ev) {
        var t = String(ev.value == null ? "" : ev.value).replace(/\s/g, "").replace(/\\frac\{(\d+)\}\{(\w+)\}/g, "$2/$1");
        var m = t.match(/^(-?\d+)\/(\w+)$/);
        if (m) return m[1].startsWith("-") ? 0.9 : 0.5;
        if (/^\d+-\w+$/.test(t)) return 0.9;
        return 0.1;
      },
      repair: {
        say: "In '5 less than a number' the number comes first in the sentence but second in the calculation. Take the number first, then take 5 away: n - 5. Reading it as 5 - n swaps the two, which is a different problem.",
        do: "Underline the thing being adjusted. Say it as 'start with ___, then ___', and fill the blanks in that order.",
        probe: "word-order"
      }
    },
    {
      concept: "from-words", name: "A sum inside a phrase is not bracketed",
      prior: 0.26,
      belief: "that 'twice a number plus 3' means 2n + 3 rather than 2(n + 3)",
      tell: function (ev) {
        var t = String(ev.value == null ? "" : ev.value).replace(/\s/g, "");
        if (/^\d+n[+-]\d+$/.test(t) && ev.saidSum) return 0.85;
        return 0.1;
      },
      repair: {
        say: "When the words say a number is multiplied by something that is itself a sum, the sum is one thing and needs its bracket: 'twice the sum of n and 3' is 2(n + 3). Without the bracket, 2n + 3 doubles only the n.",
        do: "Bracket any phrase the multiplier acts on before you translate anything.",
        probe: "sum-bracket"
      }
    },
    {
      concept: "equation", name: "The equals sign means 'the answer follows'",
      prior: 0.24,
      belief: "that in x + 5 = 12 you should write 7 as the answer rather than solving for x",
      tell: function (ev) { return ev.metaconcept === "equation" && ev.kind === "wrong" && ev.solvedThenGaveLhs ? 0.9 : 0.1; },
      repair: {
        say: "The equals sign says two things are the same number, not that the right side is the answer. x + 5 = 12 means the left side is worth 12. To find x you undo the +5 from both sides.",
        do: "Cover the right side and ask what is being added to x to get 12.",
        probe: "equals-sense"
      }
    }
  ]);

  /* ====================================================================
     3. CONTENT

     Written so the engine has something real to choose between in every
     representation a concept declares. Each `gen` returns a fresh instance;
     `tell` exposes the numbers a misconception signature needs; `discriminates`
     marks the items built to separate two beliefs.

     Local helpers: the same tiny typesetting and polynomial writer lab/core.js
     uses, kept local so this file has no dependency on the Lab being loaded.
     ==================================================================== */
  var C = E.Content;

  function signed(c) { return c < 0 ? "- " + Math.abs(c) : "+ " + c; }
  function poly(terms, opts) {
    opts = opts || {};
    var out = "", started = false;
    terms.forEach(function (t) {
      var c = t[0], v = t[1];
      if (!c && !opts.keepZero) return;
      if (!v) {
        var n = String(c);
        if (!started) { out += (c < 0 ? n : n); }
        else out += (c < 0 ? " - " + Math.abs(c) : " + " + c);
        started = true; return;
      }
      var a = Math.abs(c) === 1 && !opts.keepOne ? "" : String(Math.abs(c));
      var body = a + v;
      if (!started) out += (c < 0 ? "-" + body : body);
      else out += (c < 0 ? " - " + body : " + " + body);
      started = true;
    });
    return out || "0";
  }
  /* ------------------------------------------------- var, and shorthand */
  C.define([
    {
      id: "var-count", kind: "interact", concept: "var", dimension: "conceptual",
      reps: ["concrete", "manipulative", "verbal", "quantitative", "symbolic", "realworld"],
      cue: "Whatever you build must end up equal on both sides — change one side and watch which side moves.",
      explain: "A variable is a name for a number you have not pinned down yet. Calling it $n$ lets you do arithmetic to it before you know what it is.",
      variants: [
        function (R) {
          var n = R.int(2, 9), a = R.int(2, 9);
          return {
            prompt: "You have " + n + " boxes of " + a + " pencils. If $b$ stands for the number of boxes, how many pencils do you have?",
            pre: "$", post: "$",
            answer: a + "b",
            tell: { givenA: a, givenB: n },
            near: [{ v: String(a + n), fb: "That adds the number of boxes to the pencils in one box. The boxes repeat, so multiply: " + a + "b." }],
            hints: ["Each box holds " + a + " pencils and there are $b$ boxes.", "Repeating the same amount a number of times is multiplication."],
            why: "$b$ boxes of " + a + " is $" + a + " \\times b = " + a + "b$."
          };
        }
      ]
    },
    {
      id: "var-trick", kind: "interact", concept: "var", dimension: "transfer",
      reps: ["manipulative", "quantitative", "realworld"],
      variants: [
        function (R) {
          var add = R.pick([6, 8, 10, 14]);
          return {
            prompt: "A number trick. Use the slider to pick any number and read down the steps. Try at least three different numbers before you press **Show it with a letter**.",
            interactive: "trick",
            scene: { type: "trick", v: 7, min: 1, max: 60,
              steps: [{ t: "Think of a number", e: "n" }, { t: "Double it", e: "2n" },
                      { t: "Add " + add, e: "2n + " + add }, { t: "Halve it", e: "n + " + (add / 2) },
                      { t: "Take away the number you began with", e: String(add / 2) }] },
            gate: true,
            then: "It always ends on " + (add / 2) + ". Trying numbers shows it works for the numbers you tried. The letter shows why it works for *every* number: whatever n was, doubling and halving cancel, leaving only " + (add / 2) + ".",
            hints: ["Try a big number, like 40, as well as a small one."],
            why: "$n \\rightarrow 2n \\rightarrow 2n + " + add + " \\rightarrow n + " + (add / 2) + " \\rightarrow " + (add / 2) + "$."
          };
        }
      ]
    },
    {
      id: "shorthand-coef", kind: "task", concept: "shorthand", dimension: "produce",
      reps: ["visual", "verbal", "quantitative", "symbolic", "realworld"],
      discriminates: ["coef-digits"],
      variants: [
        function (R) {
          var c = R.int(2, 9), n = R.int(2, 12);
          return {
            prompt: "If $n = " + n + "$, what is $" + c + "n$?",
            answer: c * n, tell: { given: n, coefficient: c },
            near: [
              { v: c * 10 + n, fb: "That reads the " + c + " and the " + n + " as the digits of one number. In algebra a number next to a letter multiplies it: " + c + " × " + n + " = " + (c * n) + "." },
              { v: c + n, fb: "Close shape, wrong operation. The " + c + " beside the letter is a multiplier, not an addend: " + c + " × " + n + " = " + (c * n) + "." }
            ],
            hints: ["$" + c + "n$ means $" + c + " \\times n$.", "Put the value in: " + c + " × " + n + "."],
            why: "$" + c + "n = " + c + " \\times " + n + " = " + (c * n) + "$."
          };
        }
      ]
    },
    {
      id: "shorthand-coef-probe", kind: "probe", concept: "shorthand", dimension: "identify",
      reps: ["visual", "symbolic", "verbal"], discriminates: ["coef-digits"],
      variants: [
        function (R) {
          var c = R.int(2, 9), n = R.pick([2, 3, 4, 5, 11, 12, 13]);
          return {
            prompt: "Here are two ways of writing the same thing. Which line is right?",
            options: [
              { t: "$" + c + "n$ means " + c + " lots of $n$, so at $n = " + n + "$ it is " + (c * n) + "." },
              { t: "$" + c + "n$ is the number " + (c * 10 + n) + ", made by writing " + c + " then " + n + "." },
              { t: "$" + c + "n$ means " + c + " + $n$, so at $n = " + n + "$ it is " + (c + n) + "." },
              { t: "$" + c + "n$ means $n$ raised to the power " + c + "." }
            ],
            answer: 0,
            why: "A number written next to a letter multiplies it. $" + c + " \\times " + n + " = " + (c * n) + "$."
          };
        }
      ]
    },
    {
      id: "shorthand-frac", kind: "task", concept: "shorthand", dimension: "produce",
      reps: ["visual", "quantitative", "symbolic", "realworld"],
      discriminates: ["frac-flip"],
      variants: [
        function (R) {
          var top = R.int(1, 9), bot = R.pick([2, 3, 4, 5, 6, 7]), x = bot * R.int(1, 8);
          return {
            prompt: "If $n = " + x + "$, what is $\\frac{" + top + "}{" + bot + "}n$?",
            answer: top * x / bot,
            tell: { givenA: top, givenB: bot },
            near: [{ v: bot * x / top, fb: "The bar divides the top by the bottom, so it is " + top + " ÷ " + bot + " × " + x + ". Reading it the other way round is a different fraction." }],
            hints: ["The bar means divide by what is underneath.", top + " ÷ " + bot + " × " + x + "."],
            why: "$\\frac{" + top + "}{" + bot + "} (" + x + ") = " + top + " \\div " + bot + " \\times " + x + " = " + (top * x / bot) + "$."
          };
        }
      ]
    },
    {
      id: "shorthand-square", kind: "task", concept: "shorthand", dimension: "produce",
      reps: ["visual", "quantitative", "symbolic"],
      variants: [
        function (R) {
          var n = R.int(2, 9);
          return {
            prompt: "If $n = " + n + "$, what is $n^2$?",
            answer: n * n,
            near: [{ v: n * 2, fb: "$n^2$ is $n$ multiplied by *itself*, not by 2: " + n + " × " + n + " = " + (n * n) + "." }],
            hints: ["The 2 says multiply n by itself.", n + " × " + n + "."],
            why: "$" + n + "^2 = " + n + " \\times " + n + " = " + (n * n) + "$."
          };
        }
      ]
    },

    /* --------------------------------------------- expression, evaluate */
    {
      id: "expr-machine", kind: "interact", concept: "expression", dimension: "conceptual",
      reps: ["concrete", "manipulative", "realworld", "verbal", "symbolic"],
      variants: [
        function (R) {
          var a = R.int(2, 6), b = R.int(2, 12), v = R.pick(["m", "n", "x"]);
          return {
            prompt: "A taxi charges **\\$" + a + "** to get in, then **\\$" + b + " a mile**. Type different mile counts into the machine and see the price.",
            interactive: "machine",
            scene: { type: "machine", rule: a + " + " + b + v, show: a + " + " + b + v, v: v, name: "cost", inputs: [1, 2, 5, 10, 25] },
            gate: true,
            then: "$" + a + " + " + b + v + "$ is an **expression**: numbers and letters joined by $+$, $-$, $\\times$ or $\\div$, with no equals sign. Feed it a number and it hands back a number — that is all it is for.",
            hints: ["Try a mile count of 0 first. What does the machine charge with no miles?"],
            why: "$\\$" + a + " + \\$" + b + "$ a mile means $" + a + " + " + b + v + "$."
          };
        }
      ]
    },
    {
      id: "eval-sub", kind: "task", concept: "evaluate", dimension: "compute",
      reps: ["procedural", "quantitative", "symbolic"],
      variants: [
        function (R) {
          var x = R.int(-6, 9), a = R.nz(-6, 9), b = R.int(1, 12), kind = R.int(0, 3), tex, val;
          if (kind === 0) { tex = poly([[a, "x"], [b * R.sign(), ""]]); val = a * x + b; }
          if (kind === 1) { tex = a + "(x " + signed(b) + ")"; val = a * (x + b); }
          if (kind === 2) { tex = poly([[a, "x^2"], [b, ""]]); val = a * x * x + b; }
          if (kind === 3) { var d = R.pick([2, 3, 4, 6]); x = d * R.sign(); var top = d * R.int(2, 9); tex = "\\frac{" + top + "}{x} " + signed(b); val = top / x + b; }
          return {
            prompt: "Evaluate $" + tex + "$ when $x = " + x + "$.",
            answer: Math.round(val * 1e6) / 1e6,
            hints: ["Put the value in with brackets so the sign travels: $" + x + "$ in brackets.", "Powers first, then × and ÷ left to right, then sums."],
            why: "$" + tex + " = " + tex.replace(/x/g, "(" + x + ")").replace(/\)/g, ")").replace(/\(([0-9-]+)\)/g, "$1") + " = " + val + "$."
          };
        }
      ]
    },
    {
      id: "eval-multivar", kind: "task", concept: "multi-var", dimension: "compute",
      reps: ["manipulative", "quantitative", "symbolic", "verbal"],
      variants: [
        function (R) {
          var a = R.nz(-5, 7), b = R.nz(-5, 7), p = R.nz(-4, 5), q = R.nz(-4, 5), kind = R.int(0, 2), tex, val;
          if (kind === 0) { tex = poly([[p, "a"], [q, "b"]]); val = p * a + q * b; }
          if (kind === 1) { tex = "ab " + signed(q); val = a * b + q; }
          if (kind === 2) { tex = p + "(a - b)"; val = p * (a - b); }
          return {
            prompt: "Evaluate $" + tex + "$ when $a = " + a + "$ and $b = " + b + "$.",
            answer: val,
            hints: ["Each variable takes its own value: $a$ is " + a + ", $b$ is " + b + "."],
            why: "$" + tex + "$ at $a = " + a + "$, $b = " + b + "$ is " + val + "$."
          };
        }
      ]
    },
    {
      id: "frac-var-eval", kind: "task", concept: "fraction-var", dimension: "compute",
      reps: ["visual", "procedural", "quantitative", "symbolic"],
      variants: [
        function (R) {
          var d = R.pick([2, 3, 4, 5]), n = R.int(1, d - 1), x = d * R.int(1, 6), y = R.pick([0.5, 1.5, 0.25]);
          return {
            prompt: "Evaluate $\\frac{" + n + "}{" + d + "}x + y$ when $x = " + x + "$ and $y = " + y + "$.",
            answer: Math.round((n / d * x + y) * 1e6) / 1e6,
            near: [{ v: Math.round((x / d * n + y) * 1e6) / 1e6, fb: "The bar divides " + n + " by " + d + ", not the other way round." }],
            hints: ["$\\frac{" + n + "}{" + d + "}$ of " + x + " is " + x + " ÷ " + d + " × " + n + "."],
            why: "$\\frac{" + n + "}{" + d + "}(" + x + ") + " + y + " = " + (n / d * x) + " + " + y + "$."
          };
        }
      ]
    },

    /* ------------------------------------------- order of operations, split */
    {
      id: "oop-brackets-task", kind: "task", concept: "oop-brackets", dimension: "compute",
      reps: ["procedural", "visual", "symbolic"],
      variants: [
        function (R) {
          var a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 9), d = R.int(1, 9);
          return {
            prompt: "Evaluate $" + a + "(" + b + " + " + c + ") - " + d + "$.",
            answer: a * (b + c) - d,
            near: [{ v: a * b + c - d, fb: "The " + a + " multiplies the whole bracket, including the " + c + ". Brackets first: " + b + " + " + c + " = " + (b + c) + "." }],
            hints: ["Do the bracket first: " + b + " + " + c + "."],
            why: "$" + a + " \\times " + (b + c) + " - " + d + " = " + (a * (b + c)) + " - " + d + " = " + (a * (b + c) - d) + "$."
          };
        }
      ]
    },
    {
      id: "oop-powers-task", kind: "task", concept: "oop-powers", dimension: "compute",
      reps: ["procedural", "visual", "symbolic"],
      discriminates: ["power-scope"],
      variants: [
        function (R) {
          var a = R.int(2, 9), b = R.int(2, 6), c = R.int(2, 5);
          return {
            prompt: "Evaluate $" + a + " + " + b + " \\cdot " + c + "^2$.",
            answer: a + b * c * c,
            tell: { wrongSpread: [a + Math.pow(b * c, 2), (a + b) * c * c] },
            near: [
              { v: a + Math.pow(b * c, 2), fb: "The square belongs to the " + c + " alone — nothing is in brackets, so it reaches no further." },
              { v: (a + b) * c * c, fb: "Multiplication comes before addition, so the " + a + " is added last." }
            ],
            hints: ["A power belongs to the term under it and nothing else.", c + "² = " + c * c + ", then multiply left to right."],
            why: "$" + c + "^2 = " + c * c + "$; then $" + a + " + " + b + " \\times " + (c * c) + " = " + a + " + " + (b * c * c) + " = " + (a + b * c * c) + "$."
          };
        }
      ]
    },
    {
      id: "oop-powers-probe", kind: "probe", concept: "oop-powers", dimension: "identify",
      reps: ["visual", "symbolic", "verbal"], discriminates: ["power-scope"],
      variants: [
        function (R) {
          var a = R.int(2, 5), b = R.int(2, 4);
          return {
            prompt: "Which of these is equal to $" + a + " + " + b + "x^2$?",
            options: [
              { t: "$" + a + " + " + b + " \\times " + b + "$" },
              { t: "$" + (a + b) + "x^2$" },
              { t: "$" + a + " + " + b + "x$" },
              { t: "$" + b + "x^2 + " + a + "$ (the same, written back to front)" }
            ],
            answer: 0,
            near: [
              { v: 1, fb: "That would only be true if the " + a + " were also squared, which it is not. Put brackets on: $(" + a + " + " + b + "x^2)$." },
              { v: 2, fb: "$x^2$ is a square; $x$ is not. The power is part of the term." }
            ],
            why: "The square applies to $x$ only, giving $" + b + "x^2 = " + b + " \\times x^2$, so the whole thing is $" + a + " + " + b + " \\times x^2$."
          };
        }
      ]
    },
    {
      id: "oop-md-task", kind: "task", concept: "oop-md", dimension: "compute",
      reps: ["procedural", "visual", "symbolic"],
      discriminates: ["md-order"],
      variants: [
        function (R) {
          var a = R.pick([12, 24, 36, 48]), b = R.pick([2, 3, 4, 6]), c = R.pick([2, 3, 4, 5]);
          return {
            prompt: "Evaluate $" + a + " \\div " + b + " \\cdot " + c + "$.",
            answer: a / b * c,
            metaconcept: "oop-md",
            near: [{ v: a / (b * c), fb: "Work left to right: " + a + " ÷ " + b + " first, then × " + c + ". You have divided by the product instead." }],
            hints: ["× and ÷ are the same level, so go in written order.", "Left to right: " + a + " ÷ " + b + " = " + (a / b) + ", then × " + c + "."],
            why: "$" + a + " \\div " + b + " \\times " + c + " = " + (a / b) + " \\times " + c + " = " + (a / b * c) + "$."
          };
        }
      ]
    },
    {
      id: "oop-as-task", kind: "task", concept: "oop-as", dimension: "compute",
      reps: ["procedural", "visual", "symbolic"],
      variants: [
        function (R) {
          var a = R.int(2, 9), b = R.int(2, 6), c = R.int(2, 5), d = R.int(1, 9);
          return {
            prompt: "Evaluate $" + a + "^2 - " + b + " \\cdot " + c + "$.",
            answer: a * a - b * c,
            near: [{ v: (a * a - b) * c, fb: "Multiply before you subtract: $" + b + " \\times " + c + "$ is done first." }],
            hints: ["Square first, then multiply, then subtract."],
            why: "$" + a + "^2 = " + (a * a) + "$, $" + b + " \\times " + c + " = " + (b * c) + "$, so " + (a * a) + " - " + (b * c) + " = " + (a * a - b * c) + "$."
          };
        }
      ]
    },
    {
      id: "oop-whole", kind: "task", concept: "oop", dimension: "produce",
      reps: ["procedural", "quantitative", "symbolic", "realworld"],
      variants: [
        function (R) {
          var a = R.int(2, 6), b = R.int(2, 5), c = R.int(2, 4), s = c * R.int(1, 3), big = s + R.int(1, 8);
          return {
            prompt: "Evaluate $" + a + " + " + b + " \\cdot (" + big + " - " + (big - s) + ") \\div " + c + "$.",
            answer: a + b * s / c,
            scaffold: "1. the bracket  2. the product and quotient, left to right  3. add",
            hints: ["Brackets, then × and ÷ left to right, then sums."],
            why: "Bracket: " + big + " - " + (big - s) + " = " + s + ". Then " + b + " \\times " + s + " \\div " + c + " = " + (b * s / c) + ", giving " + a + " + " + (b * s / c) + " = " + (a + b * s / c) + "$."
          };
        }
      ]
    },

    /* ------------------------------------------------ terms and combining */
    {
      id: "term-identify", kind: "task", concept: "term", dimension: "identify",
      reps: ["visual", "verbal", "symbolic"],
      variants: [
        function (R) {
          var a = R.nz(-6, 6), b = R.nz(-7, 7);
          return {
            prompt: "In $" + poly([[a, "x"], [b, ""]]) + "$, how many terms are there?",
            answer: 2,
            hints: ["Terms are separated by + or −. How many of those are there?"],
            why: "There is one + , so two terms."
          };
        }
      ]
    },
    {
      id: "like-match-probe", kind: "probe", concept: "like", dimension: "identify",
      reps: ["visual", "symbolic", "verbal"], discriminates: ["like-match"],
      variants: [
        function (R) {
          var a = R.nz(-6, 6), b = R.nz(-6, 6), v = R.pick(["x", "y", "a", "k"]), w = R.pick(["x", "y", "p", "m"].filter(function (z) { return z !== v; }));
          return {
            prompt: "Which of $" + a + v + "$ and $" + b + w + "$ are like terms?",
            options: [
              { t: "Neither — the letters are different" },
              { t: "Both — the numbers " + a + " and " + b + " match" },
              { t: "Both — any two terms with a letter are like terms" },
              { t: "Like terms only when the coefficients are equal" }
            ],
            answer: 0,
            why: "Like terms need the same letters to the same powers. $" + a + v + "$ and $" + b + w + "$ use different letters, so they are not like terms."
          };
        }
      ]
    },
    {
      id: "combine-int", kind: "task", concept: "combine", dimension: "compute",
      reps: ["procedural", "quantitative", "symbolic"],
      variants: [
        function (R) {
          var a = R.nz(-9, 9), b = R.nz(-9, 9), c = R.nz(-9, 9), d = R.nz(-9, 9), v = R.pick(["x", "y", "a", "k"]);
          return {
            prompt: "Simplify $" + poly([[a, v], [c, ""], [b, v], [d, ""]]) + "$.",
            answer: poly([[a + b, v], [c + d, ""]]).replace(/\s/g, ""),
            shown: poly([[a + b, v], [c + d, ""]]),
            form: "simplified",
            hints: ["Collect the $" + v + "$ terms with their signs: $" + poly([[a, v], [b, v]]) + "$.", "Then the numbers: $" + poly([[c, ""], [d, ""]], { keepZero: true }) + "$."],
            why: "$" + poly([[a, v], [b, v]]) + " = " + poly([[a + b, v]]) + "$ and the constants give " + (c + d) + "$."
          };
        }
      ]
    },
    {
      id: "combine-frac", kind: "task", concept: "combine", dimension: "compute",
      reps: ["procedural", "quantitative", "symbolic", "visual"],
      variants: [
        function (R) {
          var d1 = R.pick([2, 3, 4, 5]), d2 = R.pick([2, 3, 4, 5]).filter(function (x) { return x !== d1; });
          var n1 = R.int(1, d1 - 1), n2 = R.int(1, d2 - 1) * R.sign();
          var top = n1 * d2 + n2 * d1, bot = d1 * d2;
          return {
            prompt: "Simplify $\\frac{" + n1 + "}{" + d1 + "}x - \\frac{" + Math.abs(n2) + "}{" + d2 + "}x$.",
            answer: "(" + top + "/" + bot + ")x",
            shown: "(" + top + "/" + bot + ")x",
            form: "simplified",
            hints: ["Give the fractions a common denominator of " + bot + "."],
            why: "$\\frac{" + n1 + "}{" + d1 + "} - \\frac{" + Math.abs(n2) + "}{" + d2 + "} = \\frac{" + top + "}{" + bot + "}$."
          };
        }
      ]
    },

    /* ---------------------------------------------- distribute, factor out */
    {
      id: "distribute-task", kind: "task", concept: "distribute", dimension: "compute",
      reps: ["manipulative", "visual", "procedural", "symbolic"],
      discriminates: ["dist-all"],
      variants: [
        function (R) {
          var k = R.nz(-5, 5), a = R.nz(-6, 7), b = R.nz(-9, 9);
          return {
            prompt: "Expand $" + k + "(" + poly([[a, "x"], [b, ""]]) + ")$.",
            answer: poly([[k * a, "x"], [k * b, ""]]).replace(/\s/g, ""),
            shown: poly([[k * a, "x"], [k * b, ""]]),
            form: "simplified",
            tell: { coefficient: k },
            near: [{ v: poly([[k * a, "x"], [b, ""]]).replace(/\s/g, ""), fb: "The " + k + " multiplies *every* term inside, including the " + b + "." }],
            hints: ["Multiply each term inside the bracket by " + k + ".", "Write the " + k + " in front of the bracket: $(" + k + " \\times " + poly([[a, "x"]]) + ") + (" + k + " \\times " + b + ")$."],
            why: "$" + k + " \\times " + poly([[a, "x"]]) + " = " + poly([[k * a, "x"]]) + "$ and $" + k + " \\times " + b + " = " + (k * b) + "$."
          };
        }
      ]
    },
    {
      id: "distribute-tiles", kind: "interact", concept: "distribute", dimension: "conceptual",
      reps: ["manipulative", "visual", "concrete"],
      variants: [
        function (R) {
          var k = R.pick([2, 3, 4]), a = R.pick([-3, -2, 2, 3]), b = R.pick([-4, -2, 2, 4]);
          return {
            prompt: "Build $" + k + "(" + poly([[a, "x"], [b, ""]]) + ")$ out of tiles, then take the tiles apart. What do you get?",
            interactive: "tiles",
            scene: { type: "tiles", coef: k, a: a, b: b },
            gate: true,
            then: "Every tile in the bracket is multiplied by " + k + ", which is why the result is $" + poly([[k * a, "x"], [k * b, ""]]) + "$. Tiles make the thing the belief gets wrong impossible to hold: the constant tiles multiply too.",
            hints: ["Count the number of x-tiles and the number of number-tiles separately, then multiply each count by " + k + "."],
            why: "$" + k + "(" + poly([[a, "x"], [b, ""]]) + ") = " + poly([[k * a, "x"], [k * b, ""]]) + "$."
          };
        }
      ]
    },
    {
      id: "dist-neg-task", kind: "task", concept: "distribute-neg", dimension: "compute",
      reps: ["manipulative", "visual", "procedural", "symbolic"],
      discriminates: ["neg-through", "sub-bracket"],
      variants: [
        function (R) {
          var k = R.nz(-6, 6) * R.sign(), a = R.nz(-5, 6), b = R.nz(-8, 8), c = R.nz(-6, 6), sub = R.chance(0.4);
          var inner = poly([[a, "x"], [b, ""]]);
          var lhs = sub ? poly([[k, "x"], [c, ""]]) + " - (" + inner + ")" : "-" + "(" + inner + ")";
          var ans = sub
            ? poly([[k * a - a, "x"], [c - b, ""]])
            : poly([[-a, "x"], [-b, ""]]);
          return {
            prompt: "Simplify $" + lhs + "$.",
            answer: ans.replace(/\s/g, ""), shown: ans, form: "simplified",
            tell: { coefficient: k },
            hints: sub
              ? ["Change every + inside the bracket you are subtracting into a − first."]
              : ["The sign in front of the bracket goes on every term inside it."],
            why: sub
              ? "$" + lhs + " = " + poly([[k, "x"], [c, ""]]) + " - " + poly([[a, "x"], [b, ""]]) + " = " + ans + "$."
              : "$-(" + inner + ") = " + ans + "$ — every term takes the minus."
          };
        }
      ]
    },
    {
      id: "dist-neg-probe", kind: "probe", concept: "distribute-neg", dimension: "identify",
      reps: ["visual", "symbolic", "verbal"], discriminates: ["neg-through"],
      variants: [
        function (R) {
          var a = R.int(2, 6), b = R.int(2, 8);
          return {
            prompt: "Which is equal to $-(" + a + "x + " + b + ")$?",
            options: [
              { t: "$-" + a + "x + " + b + "$" },
              { t: "$-" + a + "x - " + b + "$" },
              { t: "$" + a + "x - " + b + "$" },
              { t: "$-(" + a + "x - " + b + ")$" }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "The minus goes through to every term: both " + a + "x and the " + b + " come out negative." },
              { v: 2, fb: "The sign of the first term is right but the constant flipped. A negative in front multiplies everything inside by -1, so " + b + " becomes -" + b + "." },
              { v: 3, fb: "That is double negation — it undoes the outer minus and leaves you with the bracket as it was." }
            ],
            why: "$-(" + a + "x + " + b + ") = -" + a + "x - " + b + "$."
          };
        }
      ]
    },
    {
      id: "factor-out-task", kind: "task", concept: "factor-out", dimension: "compute",
      reps: ["procedural", "visual", "symbolic"],
      variants: [
        function (R) {
          var g = R.int(2, 9), p = R.nz(-6, 7), q = R.nz(-8, 9);
          return {
            prompt: "Factor: $" + poly([[g * p, "x"], [g * q, ""]]) + "$.",
            answer: g + "(" + poly([[p, "x"], [q, ""]]) + ")",
            shown: g + "(" + poly([[p, "x"], [q, ""]]) + ")",
            form: "factored",
            near: [{ v: poly([[p, "x"], [q, ""]]).replace(/\s/g, ""), fb: "Divide *both* terms by " + g + ", not just the first." }],
            hints: ["Divide each term by " + g + "."],
            why: "$" + (g * p) + "x \\div " + g + " = " + poly([[p, "x"]]) + "$ and $" + (g * q) + " \\div " + g + " = " + q + "$."
          };
        }
      ]
    },

    /* ------------------------------------------ equivalent, undefined */
    {
      id: "equiv-choose", kind: "task", concept: "equiv", dimension: "justify",
      reps: ["manipulative", "quantitative", "symbolic", "visual"],
      discriminates: ["equiv-three"],
      variants: [
        function (R) {
          var k = R.pick([2, 3, 4, 5, -2, -3]), a = R.nz(-5, 6), b = R.nz(-8, 8);
          var tex = k + "(" + poly([[a, "x"], [b, ""]]) + ")";
          var right = poly([[k * a, "x"], [k * b, ""]]);
          return {
            prompt: "Which expression is equivalent to $" + tex + "$?",
            options: [
              { t: "$" + right + "$" },
              { t: "$" + poly([[k * a, "x"], [b, ""]]) + "$" },
              { t: "$" + poly([[a, "x"], [k * b, ""]]) + "$" },
              { t: "$" + poly([[k * a, "x"], [-k * b, ""]]) + "$" }
            ],
            answer: 0,
            near: [
              { v: 1, fb: "The " + k + " multiplies the " + b + " too." },
              { v: 2, fb: "The " + k + " multiplies the " + poly([[a, "x"]]) + " as well, not just the constant." },
              { v: 3, fb: "Check the sign: " + k + " × " + b + " = " + (k * b) + "." }
            ],
            hints: ["Multiply each term in the bracket by " + k + "."],
            why: "$" + tex + " = " + right + "$.",
            check: function (given) {
              /* An equivalence claim proved with a single value is not a
                 proof. Say so rather than accepting it. */
              if (given != null && typeof given === "number") return "One value only agrees once — test it at three, including x = 0.";
              return null;
            }
          };
        }
      ]
    },
    {
      id: "undefined-task", kind: "task", concept: "undefined", dimension: "diagnose",
      reps: ["visual", "manipulative", "verbal", "symbolic"],
      discriminates: ["div-zero"],
      variants: [
        function (R) {
          var c = R.int(1, 9), top = R.int(1, 20), zeroAt = R.chance(0.5);
          var val = zeroAt ? c : c + R.nz(-3, 3);
          var tex = "\\frac{" + top + "}{x - " + c + "}";
          return {
            prompt: "Is $" + tex + "$ defined when $x = " + val + "$?",
            options: zeroAt
              ? [{ t: "No — the bottom would be $0$" },
                 { t: "Yes — it works out as $0$" },
                 { t: "Yes — it works out as $" + top + "$" },
                 { t: "No — because the letter is in the bottom" }]
              : [{ t: "Yes — the bottom is $" + (val - c) + "$" },
                 { t: "No — the bottom would be $0$" },
                 { t: "Yes — it works out as $0$" },
                 { t: "No — fractions are never defined" }],
            answer: zeroAt ? 0 : 0,
            tell: { value: 0 },
            why: zeroAt
              ? "At $x = " + val + "$ the bottom is " + val + " - " + c + " = 0$, and nothing can be divided by 0: undefined."
              : "The bottom is " + (val - c) + "$ rather than 0$, so the value is " + (top / (val - c)) + "$."
          };
        }
      ]
    },
    {
      id: "undefined-probe", kind: "probe", concept: "undefined", dimension: "identify",
      reps: ["visual", "verbal", "symbolic"], discriminates: ["div-zero"],
      variants: [
        function (R) {
          var n = R.int(2, 9);
          return {
            prompt: "What is $" + n + " \\div 0$?",
            options: [
              { t: "It has no value — you cannot divide by zero" },
              { t: "$0$" },
              { t: "$" + n + "$" },
              { t: "It is infinite, so it is very large" }
            ],
            answer: 0,
            near: [
              { v: 1, fb: "$0$ is what you get when the *top* is 0, like $0 \\div " + n + "$. A zero underneath is not a value of 0 — it is not a value at all." },
              { v: 3, fb: "Very large is a real number, and " + n + " ÷ 0 is not a real number. There is no number you could multiply by 0 to get " + n + ", because the only number that times 0 is 0." }
            ],
            why: "The question \"how many zeros fit into " + n + "?\" has no answer, so the expression has no value."
          };
        }
      ]
    },

    /* -------------------------------------------- words, equations, model */
    {
      id: "from-words-task", kind: "task", concept: "from-words", dimension: "produce",
      reps: ["verbal", "realworld", "quantitative", "symbolic"],
      discriminates: ["word-order", "sum-bracket"],
      variants: [
        function (R) {
          var a = R.int(2, 9), b = R.int(2, 12);
          var T = R.pick([
            { p: b + " less than a number", a: "n - " + b, saidSum: false },
            { p: a + " times a number, increased by " + b, a: a + "n + " + b, saidSum: false },
            { p: "a number divided by " + a, a: "n/" + a, saidSum: false },
            { p: a + " times the sum of a number and " + b, a: a + "(n + " + b + ")", saidSum: true },
            { p: "the difference of a number and " + b + ", squared", a: "(n - " + b + ")^2", saidSum: true }
          ]);
          return {
            prompt: "Write an expression for **“" + T.p + "”**, using $n$ for the number.",
            answer: T.a, tell: { saidSum: T.saidSum },
            near: [
              { v: b + " - n", fb: "“Less than” starts with the number and takes " + b + " away, so it is $n - " + b + "$." },
              { v: a + "/n", fb: "A number divided *by* " + a + " is $\\frac{n}{" + a + "}$ — the number goes on top." },
              { v: a + "n + " + b, fb: "“The sum” is one thing, so it needs its bracket: $" + a + "(n + " + b + ")$." },
              { v: "n - " + b + " * " + b, fb: "Square the whole difference: $(n - " + b + ")^2$." }
            ],
            hints: ["Read it piece by piece: what happens to the number first?"],
            why: "“" + T.p + "” is $" + T.a.replace(/(\w)\/(\d)/, "\\frac{$1}{$2}").replace(/(\d)\/n/, "\\frac{$1}{n}") + "$."
          };
        }
      ]
    },
    {
      id: "from-words-probe", kind: "probe", concept: "from-words", dimension: "identify",
      reps: ["verbal", "realworld", "symbolic"], discriminates: ["word-order"],
      variants: [
        function (R) {
          var b = R.int(3, 12);
          return {
            prompt: "A shop gives you a number of stickers, then takes **" + b + "** off. Which expression is that?",
            options: [
              { t: "$n - " + b + "$" },
              { t: "$" + b + " - n$" },
              { t: "$n + " + b + "$" },
              { t: "$n \\div " + b + "$" }
            ],
            answer: 0,
            near: [
              { v: 1, fb: "That starts with " + b + " and takes n away — the opposite of the sentence. Start with the stickers, then take " + b + " off." },
              { v: 2, fb: "“Off” means taking away, so it is a minus." },
              { v: 3, fb: "There is no sharing in the sentence — it is a subtraction." }
            ],
            why: "Take the number first, then take " + b + " away: $n - " + b + "$."
          };
        }
      ]
    },
    {
      id: "equation-1step", kind: "interact", concept: "equation", dimension: "compute",
      reps: ["manipulative", "procedural", "visual", "symbolic", "realworld"],
      discriminates: ["equals-sense"],
      variants: [
        function (R) {
          var a = R.nz(-6, 8), b = R.nz(-9, 9), x = R.nz(-8, 9), c = a * x + b;
          return {
            prompt: "Solve $" + a + "x " + signed(b) + " = " + c + "$ for $x$.",
            answer: x, tell: { solvedThenGaveLhs: a * x + b === c && x !== c },
            hints: ["Undo the " + (b < 0 ? "− " + Math.abs(b) : "+ " + b) + " from both sides.", "What must you subtract from both sides to leave just $" + a + "x$?"],
            why: "$" + a + "x " + signed(b) + " = " + c + " \\Rightarrow " + a + "x = " + (c - b) + " \\Rightarrow x = " + x + "$."
          };
        }
      ]
    },
    {
      id: "equation-2step", kind: "task", concept: "equation-2step", dimension: "produce",
      reps: ["procedural", "quantitative", "symbolic", "realworld"],
      variants: [
        function (R) {
          var a = R.nz(-5, 7), b = R.nz(-9, 9), x = R.nz(-7, 8), c = a * x + b;
          return {
            prompt: "Solve $" + a + "x " + signed(b) + " = " + c + "$.",
            answer: x,
            hints: ["First get the $" + a + "x$ alone on the left.", "Then divide by " + a + "."],
            why: "$" + a + "x " + signed(b) + " = " + c + " \\Rightarrow " + a + "x = " + (c - b) + " \\Rightarrow x = " + x + "$."
          };
        }
      ]
    },
    {
      id: "model-task", kind: "task", concept: "model", dimension: "transfer",
      reps: ["realworld", "verbal", "quantitative", "symbolic"],
      variants: [
        function (R) {
          var fare = R.pick([2, 3, 4]), per = R.pick([1, 2, 3]), miles = R.nz(-7, 14);
          return {
            prompt: "A ride costs **\\$" + fare + "** plus **\\$" + per + " a mile**. A ride came to **\\$" + (fare + per * miles) + "**. How far was it?",
            answer: miles,
            hints: ["Write the cost rule first, using $m$ for miles.", "Then solve it and check the miles come out sensible."],
            why: "Cost is $" + fare + " + " + per + "m$, so $" + fare + " + " + per + "m = " + (fare + per * miles) + " \\Rightarrow m = " + miles + "$. A negative answer here would mean the model is wrong, not the arithmetic."
          };
        }
      ]
    },

    /* ------------------------------------------------- reasoning evidence
       These exist because of the rung rules rather than for variety.

       A rung that requires `reasoning` cannot be reached by items that only
       exercise `compute` or `produce`, however many of them a student gets
       right. A concept with no reasoning-bearing item therefore caps at
       Functional forever, and the engine reports a permanent ceiling that no
       amount of practice removes — which is the correct behaviour, and is
       also a content bug the author has to be told about.

       So every concept whose `needs` include reasoning has at least one item
       here. The student is not asked to recite a rule: they are given work
       with a specific step missing and asked to choose the step, or given two
       equal-looking expressions and asked why they agree. Both are things the
       student must *do* to answer, and both fail informatively. */
    {
      id: "why-shorthand", kind: "task", concept: "shorthand", dimension: "justify",
      reps: ["verbal", "symbolic", "visual", "realworld"],
      variants: [
        function (R) {
          var c = R.int(2, 9), n = R.int(2, 9);
          return {
            prompt: "Someone writes: “$" + c + "n$ means add " + c + " to $n$.” What is wrong with that, and what should it say?",
            options: [
              { t: "Nothing is wrong — that is what the " + c + " is for." },
              { t: "It should say the " + c + " is a multiplier, so it means " + c + " lots of $n$." },
              { t: "It should say the " + c + " and the $n$ are two separate terms." },
              { t: "It should say $n$ raised to the power " + c + "." }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "A number written next to a letter multiplies it rather than adding to it. Try the simplest case: how many pencils if there are " + c + " groups of " + n + "?" },
              { v: 2, fb: "They are not separate terms — a term is separated by + or −, and this has neither. The " + c + " is joined to the letter." },
              { v: 3, fb: "A power is written with a small raised number, like $n^2$. The " + c + " here is on the line, so it multiplies." }
            ],
            hints: ["Try it with a number you can picture: " + c + " groups of " + n + "."],
            why: "$" + c + "n$ means " + c + " \\times n$, so at $n = " + n + "$ it is " + (c * n) + ", not " + (c + n) + ".",
            transferNote: "The rule is defended, not recalled."
          };
        }
      ]
    },
    {
      id: "why-var", kind: "task", concept: "var", dimension: "justify",
      reps: ["verbal", "realworld", "symbolic"],
      variants: [
        function (R) {
          var a = R.int(2, 9);
          return {
            prompt: "A shop has $s$ shirts at **\\$" + a + "** each. Which expression gives the total, and why?",
            options: [
              { t: "$" + a + "s$ — the " + a + " applies to every shirt." },
              { t: "$s + " + a + "$ — add the price to the count." },
              { t: "$s - " + a + "$" },
              { t: "There is not enough information without knowing $s$." }
            ],
            answer: 0,
            near: [
              { v: 3, fb: "The expression does not need a number. Its job is to give the total *for whatever $s$ turns out to be* — that is the whole point of a variable." },
              { v: 1, fb: "Adding the price to the count gives a number with no units: shirts plus dollars. The price has to multiply the count." }
            ],
            hints: ["Ask what happens if the shop had twice as many shirts."],
            why: "Each shirt costs $" + a + "$, and there are $s$ of them, so the total is $" + a + " \\times s = " + a + "s$."
          };
        }
      ]
    },
    {
      id: "why-like", kind: "task", concept: "like", dimension: "justify",
      reps: ["verbal", "visual", "symbolic"],
      discriminates: ["like-match"],
      variants: [
        function (R) {
          var a = R.nz(-6, 6), b = R.nz(-6, 6);
          return {
            prompt: "Someone says $3x + 3y$ can be collected into $6(x + y)$. What is the right answer, and what has gone wrong?",
            options: [
              { t: "$6(x+y)$ is right — collect the 3s and take the variables along." },
              { t: "It stays $3x + 3y$ — the variables are different, so they are not like terms." },
              { t: "It simplifies to $6x + y$." },
              { t: "It simplifies to $6xy$." }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "You can only collect terms with the *same* letters. $x$ and $y$ are different letters, so $3x$ and $3y$ are not like terms and cannot be collected." },
              { v: 2, fb: "The 3 in front of the $y$ cannot be added to the $x$ — they multiply different variables." },
              { v: 3, fb: "Multiplying $x$ and $y$ would only be right if the expression contained $xy$ to begin with." }
            ],
            hints: ["Underline the letters in each term. Do the underlinings match?"],
            why: "Like terms need the same letters to the same powers. $3x$ and $3y$ have different letters, so nothing can be collected: $6(x+y)$ would be $6x + 6y$, which is a different expression."
          };
        }
      ]
    },
    {
      id: "why-oop-powers", kind: "task", concept: "oop-powers", dimension: "diagnose",
      reps: ["procedural", "symbolic", "visual", "verbal"],
      discriminates: ["power-scope"],
      variants: [
        function (R) {
          var a = R.int(2, 9), b = R.int(2, 6), c = R.int(2, 5);
          return {
            prompt: "A student writes that $" + a + " + " + b + " \\cdot " + c + "^2 = " + (a + b * c * c) + "$. They are right. Now say what the " + b + " was doing.",
            options: [
              { t: "It was being squared as well, because it multiplies the squared term." },
              { t: "Nothing — the square made it zero." },
              { t: "It multiplied only the " + c + "^2$, which is why " + b + " \\times " + c + "^2 = " + (b * c * c) + "." },
              { t: "It was added before the squaring, because addition comes first." }
            ],
            answer: 2,
            near: [
              { v: 0, fb: "If the " + b + " were squared too the answer would be " + (a + Math.pow(b * c, 2)) + ", which is not the answer given. Powers apply to the term they sit on." },
              { v: 1, fb: "Squaring never makes a number zero. Try " + c + "^2$ on its own." },
              { v: 3, fb: "Addition is the *last* thing done, not the first. The " + a + " is added after the product." }
            ],
            hints: ["Write the power term on its own line first."],
            why: "The power belongs to the " + c + " alone. The " + b + " is an ordinary multiplier of that term, so it multiplies the result of the square: " + b + " \\times " + c + "^2 = " + b + " \\times " + (c * c) + " = " + (b * c * c) + "."
          };
        }
      ]
    },
    {
      id: "why-oop-md", kind: "task", concept: "oop-md", dimension: "justify",
      reps: ["procedural", "verbal", "symbolic"],
      discriminates: ["md-order"],
      variants: [
        function (R) {
          var a = R.pick([12, 24, 36, 48]), b = R.pick([2, 3, 4, 6]), c = R.pick([2, 3, 4, 5]);
          return {
            prompt: "Two students both say $" + a + " \\div " + b + " \\times " + c + "$ is done “multiply and divide”. One gets " + (a / b * c) + ", the other gets " + (a / (b * c)) + ". Who is right, and on what grounds?",
            options: [
              { t: "The first, because × and ÷ are the same level and are worked left to right." },
              { t: "The second, because a chain of × and ÷ divides by everything at once." },
              { t: "The first, because ÷ is done before × always." },
              { t: "Both are acceptable — they are two ways of writing the same thing." }
            ],
            answer: 0,
            near: [
              { v: 1, fb: "That would give " + (a / (b * c)) + ", which is a different number. A chain is worked in the order it is written." },
              { v: 2, fb: "There is no rule that ÷ comes before ×. They share a level, which is exactly why the written order is the rule." },
              { v: 3, fb: "Check them: they give " + (a / b * c) + " and " + (a / (b * c)) + ". Two answers are not the same answer." }
            ],
            hints: ["Cover up everything to the right of the first ÷ or × and do that pair."],
            why: "× and ÷ sit at the same level, so neither outranks the other and the written order decides. Start from the left: " + a + " \\div " + b + " = " + (a / b) + ", then × " + c + " = " + (a / b * c) + ".",
            transferNote: "Defending the rule, not reciting it."
          };
        }
      ]
    },
    {
      id: "why-distribute", kind: "task", concept: "distribute", dimension: "diagnose",
      reps: ["verbal", "visual", "manipulative", "symbolic"],
      discriminates: ["dist-all"],
      variants: [
        function (R) {
          var k = R.nz(-5, 5), b = R.nz(-9, 9);
          return {
            prompt: "A student expands $" + k + "(" + poly([[3, "x"], [b, ""]]) + ")$ as $" + poly([[k * 3, "x"], [b, ""]]) + "$. Where did it go wrong?",
            options: [
              { t: "Nowhere — only the letter term needs multiplying." },
              { t: "The constant term was left out: the " + k + " should multiply the " + b + " as well, giving " + poly([[k * 3, "x"], [k * b, ""]]) + "." },
              { t: "The " + k + " should be subtracted, not multiplied." },
              { t: "The bracket should be removed before anything is multiplied." }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "Every term inside the bracket is multiplied — including the one that is just a number. The bracket is a sum, and a multiplier of a sum multiplies all of it." },
              { v: 2, fb: "A positive coefficient multiplies. The sign of " + k + " carries through to each term as multiplication, not subtraction." },
              { v: 3, fb: "Removing the bracket without multiplying is what loses the " + b + ". The bracket must go *because* of the " + k + ", not first." }
            ],
            hints: ["Write " + k + " in front of every term inside, including one in front of the " + b + "."],
            why: "$" + k + "(" + poly([[3, "x"], [b, ""]]) + ")$ distributes to $" + (k * 3) + "x " + (k * b < 0 ? "- " + Math.abs(k * b) : "+ " + k * b) + "$.",
            transferNote: "Diagnosing someone else's error is harder than making it, and is the evidence the rung wants."
          };
        }
      ]
    },
    {
      id: "why-distribute-neg", kind: "task", concept: "distribute-neg", dimension: "diagnose",
      reps: ["verbal", "visual", "symbolic", "procedural"],
      discriminates: ["neg-through", "sub-bracket"],
      variants: [
        function (R) {
          var a = R.int(2, 6), b = R.int(2, 8);
          return {
            prompt: "A student writes $(" + a + "x + " + b + ") - (x + 1) = " + a + "x + " + b + " - x$, and stops. What is missing?",
            options: [
              { t: "Nothing — every term has been dealt with." },
              { t: "The bracket you are subtracting still has a term inside it: it should become $-x - 1$, giving $" + (a - 1) + "x + " + (b - 1) + "$." },
              { t: "The whole expression should be negated." },
              { t: "The $x$ terms should be combined before the constants." }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "Look inside the bracket you subtracted. The $+1$ has not come out yet." },
              { v: 2, fb: "Negating the whole expression would change the answer completely — only the bracket being subtracted is negated." },
              { v: 3, fb: "Order is not the problem. A term has been dropped." }
            ],
            hints: ["Change every $+$ inside the second bracket into a $-$ before you go any further."],
            why: "Subtracting a bracket negates every term in it: $(x + 1)$ becomes $-x - 1$. So the answer is " + (a - 1) + "x + " + (b - 1) + "$, not " + (a - 1) + "x + " + b + "$."
          };
        }
      ]
    },
    {
      id: "why-factor-out", kind: "task", concept: "factor-out", dimension: "justify",
      reps: ["procedural", "verbal", "symbolic", "visual"],
      variants: [
        function (R) {
          var g = R.int(2, 9), p = R.nz(-6, 7), q = R.nz(-8, 9);
          return {
            prompt: "Why is $" + poly([[g * p, "x"], [g * q, ""]]) + "$ already factorable, and what comes out?",
            options: [
              { t: "Every term is divisible by " + g + ", so the " + g + " can come out: $" + g + "(" + poly([[p, "x"], [q, ""]]) + ")$." },
              { t: "It factors as $" + poly([[p, "x"], [q, ""]]) + "$ with no common factor." },
              { t: "It factors as $" + g + " \\times " + poly([[g * p, "x"], [g * q, ""]]) + "$." },
              { t: "It cannot be factored, because " + g + " does not divide " + (g * q) + "." }
            ],
            answer: 0,
            near: [
              { v: 1, fb: "Look at the second term: it is " + (g * q) + ", which does divide by " + g + ". Both terms share it." },
              { v: 2, fb: "That leaves the " + g + " in twice. Factoring takes it *out*, not multiplies it in again." },
              { v: 3, fb: (g * q) + " ÷ " + g + " = " + q + ", which is a whole number. It does divide." }
            ],
            hints: ["Divide each term by " + g + " and see whether both come out whole."],
            why: "Both " + (g * p) + "x and " + (g * q) + " contain a factor of " + g + ", so it can be taken out once: $" + g + "(" + poly([[p, "x"], [q, ""]]) + ")$."
          };
        }
      ]
    },
    {
      id: "why-equiv", kind: "task", concept: "equiv", dimension: "diagnose",
      reps: ["quantitative", "symbolic", "realworld", "visual"],
      discriminates: ["equiv-three"],
      variants: [
        function (R) {
          var k = R.pick([2, 3, 4, 5]), a = R.nz(-5, 6), b = R.nz(-8, 8);
          var x0 = R.nz(-4, 5);
          return {
            prompt: "A student tested $x = " + x0 + "$ in both $" + k + "(" + poly([[a, "x"], [b, ""]]) + ")$ and $" + poly([[k * a, "x"], [k * b, ""]]) + "$$, got the same answer, and declared them equivalent. Is that a proof?",
            options: [
              { t: "Yes — matching once is enough." },
              { t: "No — one value agreeing could be a coincidence. They must agree at every input; test three, including $x = 0$." },
              { t: "Yes, as long as the value tested was positive." },
              { t: "No — you can only ever test them numerically, never symbolically." }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "Two different expressions can agree at one value by accident and differ everywhere else. Agreement at every input is what equivalent means." },
              { v: 2, fb: "The sign of the value makes no difference to the argument — one match is one match." },
              { v: 3, fb: "They can be compared symbolically too: expand the first and the two forms match term for term." }
            ],
            hints: ["Try $x = 0$, and two values you have not used."],
            why: "Equivalent means equal for *every* input. At $x = " + x0 + "$ they agree, which is one data point, not a proof. Try $x = 0$: both give " + (k * b) + "$. Try another two values and the agreement holds each time — which is what expanding the bracket also shows directly."
          };
        }
      ]
    },
    {
      id: "why-undefined", kind: "task", concept: "undefined", dimension: "justify",
      reps: ["verbal", "visual", "symbolic", "manipulative"],
      discriminates: ["div-zero"],
      variants: [
        function (R) {
          var n = R.int(2, 9);
          return {
            prompt: "Why can $0 \\div " + n + "$ be worked out but $" + n + " \\div 0$ cannot?",
            options: [
              { t: "Because $0 \\div " + n + "$ is smaller than " + n + " ÷ 0." },
              { t: "$0 \\div " + n + "$ asks how many times " + n + " fits into nothing, which is $0$. $" + n + " \\div 0$ asks how many times $0$ fits into $" + n + "$, and no number does." },
              { t: "Because division by zero is written differently." },
              { t: "Both are fine; $0$ divided by anything is $0$." }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "Size is not the issue. One of these is not a number at all." },
              { v: 2, fb: "They are written identically. The difference is what they ask." },
              { v: 3, fb: "Try it the other way round: " + n + " \\div " + n + "$ is $1$, so $0$ on top is not automatically $0$ either — it depends on the bottom." }
            ],
            hints: ["Read each one as a question about how many times something fits into something else."],
            why: "A fraction asks how many times the *bottom* fits into the *top*. $0 \\div " + n + "$ is $0$ because nothing fits into nothing. $" + n + " \\div 0$ asks how many times nothing fits into $" + n + "$ — and no number does, which is what *undefined* means.",
            transferNote: "The reason, not the rule."
          };
        }
      ]
    },
    {
      id: "why-equation", kind: "task", concept: "equation", dimension: "diagnose",
      reps: ["verbal", "symbolic", "manipulative", "realworld"],
      discriminates: ["equals-sense"],
      variants: [
        function (R) {
          var a = R.nz(-6, 8), b = R.nz(-9, 9), x = R.nz(-8, 9);
          return {
            prompt: "In $" + a + "x " + signed(b) + " = " + (a * x + b) + "$, a student writes “the answer is " + (a * x + b) + "”. What has they mixed up?",
            options: [
              { t: "Nothing — that is the number on the right." },
              { t: "The equals sign says two expressions are the same number; the thing being asked for is $x$, which here is " + x + "." },
              { t: "The answer should be the left-hand side." },
              { t: "The equation has no solution." }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "The right side is a value, not the answer to “what is x?”. To find $x$ you have to work backwards through what has been done to it." },
              { v: 2, fb: "The left side is an expression in $x$, so it cannot be a number until $x$ is known." },
              { v: 3, fb: "An equation of this shape always has a solution. Undo the " + b + " from both sides to see it." }
            ],
            hints: ["Ask what operation has been performed on $x$."],
            why: "The equals sign is a statement of equality, not a “the answer follows” arrow. It says $" + a + "x " + signed(b) + "$ is worth " + (a * x + b) + "$; undoing the " + b + " and dividing by " + a + " gives $x = " + x + "$."
          };
        }
      ]
    },
    {
      id: "why-oop", kind: "task", concept: "oop", dimension: "justify",
      reps: ["procedural", "verbal", "symbolic", "realworld"],
      variants: [
        function (R) {
          var a = R.int(2, 9), b = R.int(2, 5), c = R.int(2, 4), s = c * R.int(1, 3), big = s + R.int(1, 8);
          return {
            prompt: "Say, in order, what has to happen first in $" + a + " + " + b + " \\cdot (" + big + " - " + (big - s) + ") \\div " + c + "$.",
            options: [
              { t: "Multiply " + b + " by " + c + ", then the bracket, then the division." },
              { t: "The bracket, then × and ÷ left to right, then the addition." },
              { t: "The addition first, since + binds most tightly." },
              { t: "Everything at once, since it is all one expression." }
            ],
            answer: 1,
            near: [
              { v: 0, fb: "The bracket has to be settled before anything outside it can use it. Work it out first: " + big + " - " + (big - s) + " = " + s + "." },
              { v: 2, fb: "Addition is the last thing done, not the first. Everything inside is settled before a sum is totalled." },
              { v: 3, fb: "One expression still has an order to it. The order is what makes the answer." }
            ],
            hints: ["Start with whatever is most enclosed."],
            why: "Brackets first: " + big + " - " + (big - s) + " = " + s + ". Then × and ÷ at the same level, left to right: " + b + " \\times " + s + " \\div " + c + " = " + (b * s / c) + ". Then the sum: " + a + " + " + (b * s / c) + " = " + (a + b * s / c) + "."
          };
        }
      ]
    },
    {
      id: "why-from-words", kind: "task", concept: "from-words", dimension: "justify",
      reps: ["verbal", "realworld", "quantitative", "symbolic"],
      discriminates: ["word-order", "sum-bracket"],
      variants: [
        function (R) {
          var b = R.int(3, 12);
          return {
            prompt: "“Three less than twice a number.” A student writes $2n - 3$. Is that right, and what is the test you would use to be sure?",
            options: [
              { t: "Yes — “twice” gives $2n$ and “three less” subtracts 3." },
              { t: "Yes, and the test is that it works for $n = 5$." },
              { t: "Yes — but only if the number is bigger than 3." },
              { t: "There is nothing to test: the words fix the expression." }
            ],
            answer: 0,
            near: [
              { v: 1, fb: "A single value proves nothing about a rule — the same argument that would excuse $b - n$. Check several values, or better, check $n = 0$: the phrase says the result is 3 *less than* twice $n$, so it must be negative there, and $2(0) - 3 = -3$ is, while $3 - 2(0) = 3$ is not." },
              { v: 2, fb: "The expression works for any number, above or below 3. A rule that only held above a threshold would not be the rule." },
              { v: 3, fb: "That is exactly what makes it worth testing — words get misread, and a test catches it." }
            ],
            hints: ["Try $n = 0$. Which expression can come out negative?"],
            why: "$2n - 3$ is right: start with twice the number, then take 3 away. The test that would catch the reversed reading is $n = 0$, where $2(0) - 3 = -3$ and $3 - 2(0) = 3$ — and “three less than nothing” has to be negative."
          };
        }
      ]
    },

    /* ------------------------------------------------- transfer evidence */
    /* These exist so that "proficient" cannot be reached on repetition alone.
       Each is a different *form* — a different structure, a different
       representation, an unrelated context — which is what the transfer rung
       is supposed to demand. */
    {
      id: "transfer-var", kind: "task", concept: "var", dimension: "transfer",
      reps: ["realworld", "verbal", "quantitative"],
      variants: [
        function (R) {
          var n = R.int(3, 12);
          return {
            prompt: "The number of seats in a row is three times the number of tables, plus " + n + ". Write the number of seats in terms of $t$, the number of tables.",
            answer: "3t + " + n, transfer: true,
            hints: ["Three times each table is $3t$. The extra " + n + " is added."],
            why: "$3t + " + n + "$.",
            transferNote: "A seating problem rather than a counting one — the form is different, the idea is not."
          };
        }
      ]
    },
    {
      id: "transfer-distribute", kind: "task", concept: "distribute", dimension: "transfer",
      reps: ["realworld", "verbal", "quantitative", "symbolic"],
      variants: [
        function (R) {
          var k = R.int(2, 6), a = R.nz(-5, 6), b = R.nz(-7, 7);
          return {
            prompt: "A rectangle has a width of " + poly([[a, "x"], [b, ""]]) + " and a side of " + k + ". Write an expression for its area.",
            answer: poly([[k * a, "x"], [k * b, ""]]).replace(/\s/g, ""),
            shown: poly([[k * a, "x"], [k * b, ""]]),
            transfer: true,
            near: [{ v: poly([[k * a, "x"], [b, ""]]).replace(/\s/g, ""), fb: "The area multiplies both dimensions — including the constant." }],
            hints: ["Area is length × width, so multiply " + k + " by the whole width."],
            why: "$" + k + " \\times (" + poly([[a, "x"], [b, ""]]) + ") = " + poly([[k * a, "x"], [k * b, ""]]) + "$.",
            transferNote: "Geometry rather than algebra: the same operation arrived at from a picture."
          };
        }
      ]
    },
    {
      id: "transfer-equiv", kind: "task", concept: "equiv", dimension: "transfer",
      reps: ["quantitative", "realworld", "symbolic"],
      variants: [
        function (R) {
          var a = R.nz(-6, 7), b = R.nz(-8, 8);
          return {
            prompt: "Two taxis charge differently: one is $" + Math.abs(a) + "$ per mile with no starting fee, the other charges a flat $" + b + "$ no matter how far you go. Past how many miles is the first cheaper than the second?",
            answer: b === 0 ? "never" : null, transfer: true,
            variantNote: "open-ended; judged on the reasoning, not a single number",
            hints: ["Set the two prices equal and see which side grows faster."],
            why: "The flat fee is fixed while the per-mile cost keeps climbing, so past a certain distance the per-mile taxi wins. The breakpoint is where " + Math.abs(a) + "m = " + b + ".",
            transferNote: "No template: the student has to choose what to equate."
          };
        }
      ]
    },
    {
      id: "retrieve-distribute", kind: "retrieve", concept: "distribute", dimension: "retrieve",
      reps: ["symbolic", "quantitative", "procedural"],
      variants: [
        function (R) {
          var k = R.nz(-5, 5), a = R.nz(-6, 7), b = R.nz(-9, 9);
          return {
            prompt: "Expand $" + k + "(" + poly([[a, "x"], [b, ""]]) + ")$.",
            answer: poly([[k * a, "x"], [k * b, ""]]).replace(/\s/g, ""),
            shown: poly([[k * a, "x"], [k * b, ""]]),
            retrieval: true,
            hints: ["Multiply each term inside by " + k + "."],
            why: "$" + k + "(" + poly([[a, "x"], [b, ""]]) + ") = " + poly([[k * a, "x"], [k * b, ""]]) + "$."
          };
        }
      ]
    },
    {
      id: "retrieve-oop", kind: "retrieve", concept: "oop", dimension: "retrieve",
      reps: ["procedural", "quantitative", "symbolic"],
      variants: [
        function (R) {
          var a = R.int(2, 6), b = R.int(2, 5), c = R.int(2, 4), s = c * R.int(1, 3), big = s + R.int(1, 7);
          return {
            prompt: "Evaluate $" + a + " + " + b + " \\cdot (" + big + " - " + (big - s) + ") \\div " + c + "$.",
            answer: a + b * s / c, retrieval: true,
            hints: ["Brackets, then × and ÷ left to right, then sums."],
            why: "Bracket gives " + s + ", then " + b + " \\times " + s + " \\div " + c + " = " + (b * s / c) + "$."
          };
        }
      ]
    },
    {
      id: "retrieve-evaluate", kind: "retrieve", concept: "evaluate", dimension: "retrieve",
      reps: ["quantitative", "symbolic", "procedural"],
      variants: [
        function (R) {
          var x = R.int(-5, 8), a = R.nz(-5, 7), b = R.int(1, 11);
          return {
            prompt: "Evaluate $" + poly([[a, "x"], [b * R.sign(), ""]]) + "$ when $x = " + x + "$.",
            answer: a * x + b * Math.sign(b) === a * x + b ? a * x + b : a * x + b,
            retrieval: true,
            answerExact: a * x + (b * Math.sign(b)),
            hints: ["Put the value in with brackets."],
            why: "$" + a + " \\times " + x + " " + signed(b) + " = " + (a * x + b) + "$."
          };
        }
      ]
    }
  ]);

  /* ====================================================================
     4. TEACHER AUTHORING CHECKS
     A teacher should be able to state an outcome and have the engine resolve
     what that requires. That resolution is derived from the graph and the
     rung requirements, never authored separately — so it cannot drift out of
     step with what is actually taught.
     ==================================================================== */
  E.Teacher = E.Teacher || {};
  E.Teacher.plan = function (conceptId, opts) {
    opts = opts || {};
    var now = opts.now || Date.now();
    var c = E.KG.get(conceptId);
    if (!c) return null;
    var needed = E.KG.ancestors(conceptId);
    var targets = Object.keys(needed).concat([conceptId]).map(function (id) { return E.KG.get(id); });
    /* Ordered by depth, so the plan is a sequence, and each entry states what
       would count as evidence for it rather than assuming a fixed order. */
    targets.sort(function (a, b) { return E.KG.depth(a.id) - E.KG.depth(b.id); });
    return {
      outcome: c.name, outcomeBlurb: c.blurb,
      sequence: targets.filter(Boolean).map(function (t) {
        return {
          concept: t.id, name: t.name, tier: t.tier, unit: t.unit,
          representations: t.reps,
          evidenceNeeded: t.needs,
          beliefsToWatch: E.Misconception.forConcept(t.id).map(function (m) { return { id: m.id, belief: m.belief, prior: m.prior }; }),
          contentAvailable: E.Content.forConcept(t.id).map(function (it) { return it.kind + ":" + it.id; })
        };
      }),
      /* What a teacher would otherwise have to work out by hand, and what the
         engine now answers: which content does not exist yet. */
      gaps: targets.filter(Boolean).filter(function (t) { return !E.Content.forConcept(t.id).length; })
                   .map(function (t) { return { concept: t.id, name: t.name, missing: "no content object" }; }),
      missingRepresentations: targets.filter(Boolean).reduce(function (acc, t) {
        var have = {};
        E.Content.forConcept(t.id).forEach(function (it) { it.reps.forEach(function (r) { have[r] = 1; }); });
        var miss = t.reps.filter(function (r) { return !have[r]; });
        if (miss.length) acc.push({ concept: t.id, name: t.name, missing: miss });
        return acc;
      }, []),
      misconceptionCoverage: targets.filter(Boolean).map(function (t) {
        return { concept: t.id, has: E.Misconception.forConcept(t.id).length };
      }).filter(function (r) { return r.has === 0 && r.concept !== "oop"; })
    };
  };

  /* Where the assigned order and the dependency order disagree — the case
     curriculum independence exists for.

     Two kinds, and the second is the one that bites in practice:
       conflicts  the graph needs something the school has not reached yet
       assumed    the graph needs something the school never assigns at all,
                 so the engine is relying on it without checking — which is
                 exactly what it should go and check

     Unit 1 has no *conflicts*: every concept it needs is also assigned in
     Unit 1, so the syllabus order and the dependency order happen to agree.
     Reporting an empty set here is the honest answer and worth stating,
     because a graph that fabricates conflicts to look thorough is worse
     than one that admits this unit is internally consistent. */
  E.Teacher.conflicts = function () {
    var out = [];
    E.KG.all().forEach(function (c) {
      c.prereq.forEach(function (p) {
        var gp = E.KG.get(p);
        if (gp && gp.unit > c.unit) {
          out.push({ concept: c.id, name: c.name, needs: p, needsName: gp.name, unit: c.unit, needsUnit: gp.unit });
        }
      });
    });
    return out;
  };
  E.Teacher.assumed = E.KG.assumed;

  root.OPLO_ENGINE.alg1u1 = { loaded: true };
})(typeof window !== "undefined" ? window : globalThis);
