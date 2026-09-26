/* ==========================================================================
   SAT Math — Domain 1: Algebra (about 35% of the Math section).
   See lab/satkit.js for the item format, SAT.domain and the helpers.

   Five skills, each with a generator that makes a question at three
   difficulties and in several disguises (direct, word problem, graph, table,
   real-world model, SAT twist). Every wrong choice is a real trap with its
   own reply; every question has a hint, a strategy, a worked walkthrough,
   the concept, and the small guiding questions the coach asks after a miss.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB, S = L && L.SAT;
  if (!S || !S.domain) return;
  var H = S.h, F = S.fig, c = H.c, x = H.x, w = H.w, tex = H.tex, W = H.walk, money = H.money, lin = H.lin;
  function sgn(v) { return v < 0 ? "- " + Math.abs(v) : "+ " + v; }
  /* mx + b with a fractional slope written as a fraction: \frac{1}{2}x. */
  function linq(m, b) {
    if (Math.abs(m - Math.round(m)) < 1e-9) return lin(m, b);
    var t = tex(Math.abs(m)) + "x";
    return (m < 0 ? "-" : "") + t + (b ? " " + sgn(b) : "");
  }
  function eq(a, b) { return lin(a, b); }

  /* ================================================ 1 · Linear equations */
  function lin1Rebuild(a, b, cc, xv) {
    return [
      { q: "In $" + eq(a, b) + " = " + cc + "$, what happens to $x$ — in order?",
        opts: ["It's multiplied by " + a + ", then " + (b < 0 ? Math.abs(b) + " is subtracted" : b + " is added"), (b < 0 ? Math.abs(b) + " is subtracted" : b + " is added") + ", then it's multiplied by " + a, "It's divided by " + a],
        a: 0, ok: "So undo them in reverse: the " + (b < 0 ? "subtracting" : "adding") + " first, then the multiplying." },
      { q: "Undo the " + (b < 0 ? "subtracting" : "adding") + ": " + (b < 0 ? "add " + Math.abs(b) + " to" : "subtract " + b + " from") + " both sides. What is $" + a + "x$?", num: cc - b,
        ok: "$" + a + "x = " + (cc - b) + "$. The equation is still balanced." },
      { q: "Now undo the multiplying. What is $x$?", num: xv, shown: tex(xv), ok: "$x = " + tex(xv) + "$ — check: $" + a + "(" + tex(xv) + ") " + sgn(b) + " = " + cc + "$." }
    ];
  }
  function lin1OneStep(R) {
    var xv = R.nz(-9, 9), a = R.int(2, 9), b = R.nz(-15, 15), cc = a * xv + b;
    return {
      stem: "If $" + eq(a, b) + " = " + cc + "$, what is the value of $x$?",
      choices: [c(xv, { ok: true }),
        c((cc + b) / a, { err: "calc", tr: "moved the constant with the wrong sign", why: "That " + (b > 0 ? "adds" : "subtracts") + " the " + Math.abs(b) + " instead of undoing it. To undo $" + sgn(b) + "$, " + (b > 0 ? "subtract" : "add") + " " + Math.abs(b) + " on both sides." }),
        c(cc - b, { err: "misread", tr: "found the value of the x-term, not x", why: "That's the value of $" + a + "x$, not $x$. One more step: divide by " + a + "." }),
        c(cc / a - b, { err: "concept", tr: "divided before undoing the constant", why: "Dividing only the right side by " + a + " leaves $" + b + "$ undivided. Undo the " + (b > 0 ? "adding" : "subtracting") + " first." })],
      hint: "What is being done to $x$, and in what order?",
      strategy: "Undo the operations in reverse order: first the " + (b > 0 ? "adding" : "subtracting") + ", then the multiplying. Or test the choices — the right one makes both sides equal.",
      walk: W([[eq(a, b) + " = " + cc, "Start."], [a + "x = " + (cc - b), (b > 0 ? "Subtract " + b : "Add " + (-b)) + " on both sides."], ["x = " + tex(xv), "Divide both sides by " + a + "."]]),
      concept: "An equation is a balance: do the same thing to both sides and it stays true. Solving means undoing what was done to $x$, last thing first.",
      rebuild: lin1Rebuild(a, b, cc, xv)
    };
  }
  function lin1Both(R) {
    var xv = R.nz(-8, 8), a = R.int(2, 9), cx = R.nz(-6, 9), b = R.nz(-12, 12);
    while (cx === a) cx = R.nz(-6, 9);
    var d = (a - cx) * xv + b;
    return {
      stem: "$" + eq(a, b) + " = " + eq(cx, d) + "$<br>What value of $x$ is the solution to the equation above?",
      choices: [c(xv, { ok: true }),
        c(a + cx === 0 ? xv + 1 : (d - b) / (a + cx), { err: "calc", tr: "added the x-terms instead of subtracting", why: "Moving $" + tex(cx) + "x$ to the left means subtracting it: $" + a + "x - " + (cx < 0 ? "(" + cx + ")" : cx) + "x$." }),
        c((d + b) / (a - cx), { err: "calc", tr: "moved the constant with the wrong sign", why: "To move $" + sgn(b) + "$ to the right, " + (b > 0 ? "subtract" : "add") + " it — the right side becomes $" + d + " " + sgn(-b) + "$." }),
        c(-xv, { err: "calc", tr: "got the sign of the answer backwards", why: "Check it: put $" + (-xv) + "$ back into both sides — they don't match. A sign flipped when the terms crossed over." })],
      hint: "Get every $x$ term on one side and every number on the other.",
      strategy: "Collect the $x$ terms on the side with the bigger coefficient, so fewer negatives appear. Then solve the one-step equation that's left.",
      walk: W([[eq(a, b) + " = " + eq(cx, d), "Start."], [LAB_poly([[a - cx, "x"], [b, ""]]) + " = " + d, "Subtract $" + tex(cx) + "x$ from both sides."], [(a - cx) + "x = " + (d - b), (b > 0 ? "Subtract " + b : "Add " + (-b)) + " on both sides."], ["x = " + tex(xv), "Divide by " + (a - cx) + "."]]),
      concept: "Terms with $x$ can be moved like numbers — subtract the same $x$ term from both sides. What matters is doing the same thing to both sides.",
      rebuild: [
        { q: "Which move gets all the $x$ terms on the left?", opts: ["Subtract $" + tex(cx) + "x$ from both sides", "Add $" + tex(cx) + "x$ to both sides", "Divide both sides by $x$"], a: 0, ok: "Now the left side has $" + (a - cx) + "x$." },
        { q: "After that, the equation is $" + LAB_poly([[a - cx, "x"], [b, ""]]) + " = " + d + "$. What is $" + (a - cx) + "x$?", num: d - b, ok: "$" + (a - cx) + "x = " + (d - b) + "$." },
        { q: "So what is $x$?", num: xv, ok: "$x = " + xv + "$." }],
      autopsy: { hard: "The unknown is on both sides, so there's an extra step before it's a one-step equation." }
    };
  }
  function LAB_poly(t) { return L.poly(t); }
  function lin1Brackets(R) {
    if (R.chance(0.45)) {
      // Fractions: clear them, or combine the x-terms.
      var dens = R.pick([[2, 3], [3, 6], [4, 2], [3, 4], [2, 5]]), p1 = R.int(1, dens[0] - 1) || 1, q1 = dens[0], p2 = 1, q2 = dens[1];
      if (p1 / q1 === p2 / q2) p1 = q1 - 1 || 1;
      var lcm = q1 * q2 / H.gcd(q1, q2), k = R.int(1, 4) * lcm * (R.chance(0.5) ? 1 : 2), b = R.nz(-9, 9);
      var d = (p1 / q1 - p2 / q2) * k + b;
      if (Math.abs(d - Math.round(d)) > 1e-9 || p1 / q1 === p2 / q2) return lin1Both(R);
      var A = "\\frac{" + p1 + "}{" + q1 + "}x", B = "\\frac{" + p2 + "}{" + q2 + "}x";
      return {
        stem: "$" + A + " " + sgn(b) + " = " + B + " " + sgn(d) + "$<br>What is the solution to the equation above?",
        answer: k, shown: String(k),
        hint: "Fractions make it look harder than it is. What could you multiply both sides by to clear them?",
        strategy: "Multiply every term by " + lcm + " (the smallest number both denominators divide) — the fractions vanish and it's an ordinary equation.",
        walk: W([[A + " " + sgn(b) + " = " + B + " " + sgn(d), "Start."],
          [tex(p1 * lcm / q1) + "x " + sgn(b * lcm) + " = " + tex(p2 * lcm / q2) + "x " + sgn(d * lcm), "Multiply every term by " + lcm + "."],
          [tex((p1 / q1 - p2 / q2) * lcm) + "x = " + tex((d - b) * lcm), "Collect $x$ terms left, numbers right."],
          ["x = " + k, "Divide."]]),
        concept: "Multiplying both sides by the same number keeps an equation balanced — so you can always clear fractions first.",
        rebuild: [
          { q: "What number clears both fractions if every term is multiplied by it?", opts: [String(lcm), String(q1 + q2), "2"], a: 0, ok: "Both " + q1 + " and " + q2 + " divide " + lcm + "." },
          { q: "After multiplying by " + lcm + " and collecting terms: $" + tex((p1 / q1 - p2 / q2) * lcm) + "x = " + tex((d - b) * lcm) + "$. What is $x$?", num: k, ok: "$x = " + k + "$." }],
        autopsy: { hard: "The fractions. They hide an ordinary one-variable equation.", clue: "Both sides are linear in $x$ — clear the fractions and it's routine." }
      };
    }
    var xv = R.nz(-6, 7), a = R.int(2, 6), bb = R.int(2, 5), p = R.nz(-5, 6), q = R.nz(-5, 6);
    while (bb === a) bb = R.int(2, 7);
    var r = a * (xv + p) - bb * (xv - q);
    var right = (r - bb * q - a * p) / (a - bb);
    var d1 = (r - q - p) / (a - bb), d2 = (r + bb * q - a * p) / (a - bb);
    return {
      stem: "$" + a + "(x " + sgn(p) + ") = " + bb + "(x " + sgn(-q) + ") " + sgn(r) + "$<br>What is the value of $x$?",
      choices: [c(right, { ok: true }),
        c(d1, { err: "concept", tr: "multiplied only the first term inside the brackets", why: "The " + a + " multiplies everything in its brackets: $" + a + "(x " + sgn(p) + ") = " + a + "x " + sgn(a * p) + "$, not $" + a + "x " + sgn(p) + "$." }),
        c(d2, { err: "calc", tr: "lost a minus sign when distributing", why: "$" + bb + "(x " + sgn(-q) + ") = " + bb + "x " + sgn(-bb * q) + "$ — the sign inside the brackets comes along." }),
        c(-right, { err: "calc", tr: "got the sign of the answer backwards", why: "Substitute it back: the two sides don't match. Recheck the sign when you moved terms across." })],
      hint: "Clear the brackets first.",
      strategy: "Distribute — multiply the number outside by every term inside, signs included — then collect $x$ terms on one side.",
      walk: W([[a + "(x " + sgn(p) + ") = " + bb + "(x " + sgn(-q) + ") " + sgn(r), "Start."],
        [a + "x " + sgn(a * p) + " = " + bb + "x " + sgn(-bb * q + r), "Distribute on both sides, and combine the numbers on the right."],
        [(a - bb) + "x = " + (r - bb * q - a * p), "Subtract $" + bb + "x$ and " + (a * p >= 0 ? "subtract " + a * p : "add " + (-a * p)) + " on both sides."],
        ["x = " + tex(right), "Divide by " + (a - bb) + "."]]),
      concept: "The distributive property: $a(b + c) = ab + ac$. The multiplier reaches every term inside the brackets — including their signs.",
      rebuild: [
        { q: "What is $" + a + "(x " + sgn(p) + ")$ without brackets?", opts: [lin(a, a * p), lin(a, p), lin(1, a * p)], a: 0, ok: "The " + a + " multiplies both terms." },
        { q: "And $" + bb + "(x " + sgn(-q) + ")$?", opts: [lin(bb, -bb * q), lin(bb, -q), lin(bb, bb * q)], a: 0, ok: "The minus sign comes along." },
        { q: "Now $" + lin(a, a * p) + " = " + lin(bb, -bb * q + r) + "$. What is $x$?", num: right, shown: tex(right), ok: "$x = " + tex(right) + "$." }],
      autopsy: { hard: "Brackets on both sides — two chances to drop a term or a sign.", clue: "Distribute first, then it's an equation you've solved a hundred times." }
    };
  }
  function lin1Structure(R, diff) {
    var a = R.int(2, 7), b = R.nz(-9, 12), cc = R.int(5, 40), k = R.pick([2, 3, 4]);
    var xv = (cc - b) / a;
    return {
      stem: "If $" + eq(a, b) + " = " + cc + "$, what is the value of $" + eq(k * a, k * b) + "$?",
      choices: [c(k * cc, { ok: true }),
        c(xv, { err: "misread", tr: "found x and stopped", why: "That's $x$. The question asks for $" + eq(k * a, k * b) + "$ — a different expression." }),
        c(k * (cc - b), { err: "misread", tr: "found the x-term but forgot the constant", why: "That's $" + (k * a) + "x$ alone. The expression also has $" + sgn(k * b) + "$." }),
        c(k * (cc - b) + b, { err: "concept", tr: "scaled the x-term but not the constant", why: "Multiplying an equation by " + k + " multiplies every term — the " + b + " becomes " + (k * b) + " too." })],
      hint: "Look at $" + eq(k * a, k * b) + "$ next to $" + eq(a, b) + "$. How are they related?",
      strategy: "Don't solve for $x$ at all: $" + eq(k * a, k * b) + " = " + k + "(" + eq(a, b) + ")$, so it's " + k + " times " + cc + ".",
      walk: W([[eq(k * a, k * b) + " = " + k + "(" + eq(a, b) + ")", "Factor out " + k + " — the bracket is exactly the left side of the given equation."], [k + "(" + cc + ")", "Swap in its value."], [String(k * cc), "Done — $x$ was never needed."]]),
      concept: "The SAT often asks for an expression, not $x$. If the expression is a multiple of one you already know, use the structure — it's faster and avoids fractions.",
      rebuild: [
        { q: "What do you multiply $" + eq(a, b) + "$ by to get $" + eq(k * a, k * b) + "$?", num: k, ok: "Every term is " + k + " times bigger." },
        { q: "So if $" + eq(a, b) + " = " + cc + "$, then $" + eq(k * a, k * b) + "$ is…", num: k * cc, ok: "$" + k + " \\times " + cc + " = " + (k * cc) + "$." }],
      autopsy: { hard: diff >= 2 ? "Solving for $x$ gives " + (Math.abs(xv - Math.round(xv)) > 1e-9 ? "a fraction" : "a number") + " you then have to plug back in — slow, and easy to slip." : "It asks for an expression, not for $x$.",
                 clue: "The expression asked for is a multiple of the one given.", remember: "When the question asks for an expression, look for structure before you solve." }
    };
  }
  function lin1Solutions(R, diff) {
    if (diff >= 3) {
      var bb = R.int(2, 9), d = R.nz(-6, 8), cc = bb * d + R.nz(-5, 5);
      return {
        stem: "In the equation $ax " + sgn(cc) + " = " + bb + "(x " + sgn(d) + ")$, $a$ is a constant. If the equation has no solution, what is the value of $a$?",
        choices: [c(bb, { ok: true }),
          c(bb * d, { err: "concept", tr: "matched the constants instead of the x-coefficients", why: "Matching constants would make the equation true for every $x$ (if the coefficients matched too). No solution means the $x$ terms cancel but the numbers don't." }),
          c(-bb, { err: "calc", tr: "got the sign of the coefficient wrong", why: "With $a = " + (-bb) + "$ the $x$ terms don't cancel — you'd get exactly one solution." }),
          c(cc, { err: "misread", tr: "picked a number from the equation", why: "That's the constant on the left. The question is about $a$, the coefficient of $x$." })],
        hint: "What has to happen to the $x$ terms for an equation to have no solution?",
        strategy: "Expand the right side. No solution happens when the $x$ coefficients are equal (so $x$ cancels) and the constants are different.",
        walk: W([["ax " + sgn(cc) + " = " + bb + "x " + sgn(bb * d), "Distribute on the right."], ["a = " + bb, "For $x$ to cancel, the coefficients must match."], [cc + " \\ne " + (bb * d), "…and the constants differ, so the result is false for every $x$: no solution."]]),
        concept: "A linear equation has one solution when the $x$ coefficients differ, none when they're equal but the constants differ, and infinitely many when both match.",
        rebuild: [
          { q: "Expand $" + bb + "(x " + sgn(d) + ")$.", opts: [lin(bb, bb * d), lin(bb, d), lin(1, bb * d)], a: 0, ok: "So the equation is $ax " + sgn(cc) + " = " + lin(bb, bb * d) + "$." },
          { q: "For NO solution, the $x$ terms must cancel. What must $a$ be?", num: bb, ok: "Then you're left with $" + cc + " = " + (bb * d) + "$, which is never true." }],
        autopsy: { hard: "It asks for a constant that makes the equation fail — you reason about the structure, not solve.", clue: "\"No solution\" means the $x$ terms cancel and a false statement is left.", remember: "Same coefficients + different constants → no solution. Same both → infinitely many." }
      };
    }
    var a = R.int(2, 7), b = R.nz(-6, 9), kind = R.pick(["none", "inf", "one"]);
    var cc = kind === "inf" ? a * b : a * b + R.nz(-5, 5), ax = kind === "one" ? a + R.pick([1, -1, 2]) : a;
    if (ax === 0) ax = a + 3;
    var opts = ["Zero", "Exactly one", "Exactly two", "Infinitely many"], right = kind === "none" ? 0 : kind === "one" ? 1 : 3;
    var why = {
      0: "Zero would need the $x$ terms to cancel and leave a false statement like $" + (a * b) + " = " + (a * b + 1) + "$.",
      1: "Exactly one happens when the $x$ coefficients are different. Here " + (kind === "one" ? "" : "they're both $" + a + "$."),
      2: "A linear equation can't have exactly two solutions — its graph is a straight line; two lines meet once, never, or everywhere.",
      3: "Infinitely many would need both sides to be identical after expanding."
    };
    return {
      stem: "How many solutions does the equation $" + a + "(x " + sgn(b) + ") = " + lin(ax, cc) + "$ have?",
      choices: opts.map(function (t, i) { return i === right ? w(t, { ok: true }) : w(t, { err: i === 2 ? "concept" : "misread", tr: i === 2 ? "thought a linear equation could have two solutions" : "judged the number of solutions without expanding", why: why[i] }); }),
      order: "keep",
      hint: "Expand the left side and compare it with the right.",
      strategy: "Compare the $x$ coefficients: different → one solution. Equal → look at the constants: different → none, equal → infinitely many.",
      walk: W([[a + "(x " + sgn(b) + ") = " + lin(ax, cc), "Start."], [lin(a, a * b) + " = " + lin(ax, cc), "Distribute."],
        [kind === "one" ? "x = " + tex((cc - a * b) / (a - ax)) : (a * b) + (kind === "inf" ? " = " : " \\ne ") + cc, kind === "one" ? "The coefficients differ, so there's exactly one solution." : kind === "inf" ? "The $x$ terms cancel and a true statement is left — true for every $x$." : "The $x$ terms cancel and a false statement is left — true for no $x$."]]),
      concept: "A linear equation has one solution, none, or infinitely many — never two. Compare coefficients, then constants.",
      rebuild: [
        { q: "What is $" + a + "(x " + sgn(b) + ")$ expanded?", opts: [lin(a, a * b), lin(a, b), lin(1, a * b)], a: 0, ok: "So the equation reads $" + lin(a, a * b) + " = " + lin(ax, cc) + "$." },
        { q: "Are the $x$ coefficients the same on both sides?", opts: ["Yes", "No"], a: kind === "one" ? 1 : 0, ok: kind === "one" ? "Different coefficients: the lines cross once." : "Same coefficients: $x$ will cancel." },
        { q: kind === "one" ? "So how many solutions?" : "After $x$ cancels, is $" + (a * b) + " = " + cc + "$ true?", opts: kind === "one" ? ["Exactly one", "Zero"] : ["True", "False"], a: kind === "one" ? 0 : kind === "inf" ? 0 : 1,
          ok: kind === "one" ? "One solution." : kind === "inf" ? "Always true — infinitely many solutions." : "Never true — no solution." }],
      autopsy: { hard: "You're asked how many solutions, not what they are.", clue: "Expand and compare the $x$ coefficients.", remember: "One, none, or infinitely many — never two." }
    };
  }
  function lin1Word(R, diff) {
    if (diff === 1) {
      var fee = R.pick([35, 40, 45, 50, 60, 75]), rate = R.pick([25, 30, 45, 55, 65, 80]), hrs = R.int(2, 7), cost = fee + rate * hrs;
      return {
        stem: "A plumber charges a " + money(fee) + " fee for each visit plus " + money(rate) + " per hour of work. A visit cost " + money(cost) + ". How many hours did the plumber work?",
        choices: [c(hrs, { ok: true }),
          c(cost / rate, { err: "misread", tr: "ignored the fixed fee", why: "The " + money(fee) + " is paid once, whatever the hours. Take it off before dividing." }),
          c((cost + fee) / rate, { err: "calc", tr: "added the fee instead of subtracting it", why: "The fee is already inside the " + money(cost) + ". Remove it: $" + cost + " - " + fee + "$." }),
          c(cost - fee, { err: "misread", tr: "found the cost of the hours, not the number of hours", why: "That's the dollars spent on hours. Divide by " + money(rate) + " per hour." })],
        hint: "Which part of the cost depends on the hours, and which doesn't?",
        strategy: "Write it as an equation: $" + fee + " + " + rate + "h = " + cost + "$. Then undo the fee, then the rate.",
        walk: W([[fee + " + " + rate + "h = " + cost, "Fee plus rate times hours."], [rate + "h = " + (cost - fee), "Take off the fee."], ["h = " + hrs, "Divide by the hourly rate."]]),
        concept: "A fixed amount plus a rate times a quantity is a linear equation: the fixed part is the constant, the rate is the coefficient.",
        rebuild: [
          { q: "How much of the " + money(cost) + " was for the hours of work?", num: cost - fee, ok: money(cost - fee) + " — the fee is paid once." },
          { q: "At " + money(rate) + " an hour, how many hours is that?", num: hrs, ok: hrs + " hours." }],
        autopsy: { clue: "\"Plus " + money(rate) + " per hour\" — that's the part to divide.", remember: "Fixed amount = constant; per-unit amount = coefficient." }
      };
    }
    if (diff === 2) {
      var a1 = R.pick([20, 25, 30, 35]), r1 = R.pick([4, 5, 6]), a2 = a1 + R.pick([15, 20, 25, 30]), r2 = r1 - R.pick([1, 2, 3]);
      if (r2 <= 0) r2 = 1;
      var g = (a2 - a1) / (r1 - r2);
      if (Math.abs(g - Math.round(g)) > 1e-9) { a2 = a1 + (r1 - r2) * R.int(4, 12); g = (a2 - a1) / (r1 - r2); }
      return {
        stem: "Phone plan A costs " + money(a1) + " a month plus " + money(r1) + " for each gigabyte of data. Plan B costs " + money(a2) + " a month plus " + money(r2) + " for each gigabyte. For how many gigabytes of data in a month do the two plans cost the same?",
        answer: g, shown: String(g), secs: 110,
        near: [{ v: (a2 + a1) / (r1 + r2), tr: "added the costs instead of setting them equal" }],
        hint: "Write each plan's cost for $g$ gigabytes. What does \"cost the same\" let you write?",
        strategy: "Set the two expressions equal: $" + a1 + " + " + r1 + "g = " + a2 + " + " + r2 + "g$, then solve.",
        walk: W([[a1 + " + " + r1 + "g = " + a2 + " + " + r2 + "g", "Cost the same: set them equal."], [(r1 - r2) + "g = " + (a2 - a1), "Subtract $" + r2 + "g$ and " + a1 + "."], ["g = " + g, "Divide."]]),
        concept: "\"When are they equal?\" is always an equation with one expression on each side.",
        rebuild: [
          { q: "Which expression is Plan A's cost for $g$ gigabytes?", opts: [a1 + " + " + r1 + "g", r1 + " + " + a1 + "g", "(" + a1 + " + " + r1 + ")g"], a: 0, ok: "The monthly fee plus the per-gigabyte cost." },
          { q: "Setting $" + a1 + " + " + r1 + "g = " + a2 + " + " + r2 + "g$ — what is $g$?", num: g, ok: g + " gigabytes." }],
        autopsy: { hard: "Two plans to model before any solving happens.", clue: "\"Cost the same\" — set the two costs equal.", remember: "Translate each quantity into an expression, then write the equation the question describes." }
      };
    }
    var wv = R.int(3, 14), extra = R.int(1, 6), mult = R.pick([2, 3]), len = mult * wv + extra, P = 2 * (wv + len);
    return {
      stem: "The length of a rectangle is " + extra + " inches more than " + (mult === 2 ? "twice" : "three times") + " its width. The perimeter of the rectangle is " + P + " inches. What is the width of the rectangle, in inches?",
      choices: [c(wv, { ok: true }),
        c(len, { err: "misread", tr: "answered with the length", why: "That's the length. The question asks for the width." }),
        c((P - extra) / (mult + 1), { err: "formula", tr: "used half the perimeter as the whole", why: "The perimeter counts each side twice: $2(\\text{length} + \\text{width}) = " + P + "$." }),
        c(P / (2 * (mult + 1)), { err: "misread", tr: "left out the extra inches", why: "The length is " + extra + " more than " + mult + " times the width — that " + extra + " has to be in the equation." })],
      hint: "Let $w$ be the width. Write the length in terms of $w$, then the perimeter.",
      strategy: "Name the unknown, build the equation from the sentence, and check your answer is the quantity asked for (width, not length).",
      walk: W([["ℓ= " + mult + "w + " + extra, "Length in terms of width."], ["2(w + " + mult + "w + " + extra + ") = " + P, "Perimeter: twice (width + length)."], [(2 * (mult + 1)) + "w + " + (2 * extra) + " = " + P, "Distribute."], ["w = " + wv, "Subtract " + (2 * extra) + ", divide by " + (2 * (mult + 1)) + "."]]),
      concept: "Word problems are translation: one unknown, every other quantity written in terms of it, then one equation.",
      rebuild: [
        { q: "If the width is $w$, what is the length?", opts: [mult + "w + " + extra, extra + "w + " + mult, mult + "(w + " + extra + ")"], a: 0, ok: "\"" + extra + " more than " + (mult === 2 ? "twice" : "three times") + " the width.\"" },
        { q: "The perimeter is $2(w + ℓ)$. So $2(w + " + mult + "w + " + extra + ") = " + P + "$. What is $w$?", num: wv, ok: "$w = " + wv + "$ inches." }],
      autopsy: { hard: "Two unknowns in the sentence, and the answer asked for is the one you define first.", trap: "Answering with the length.", clue: "\"What is the width\" — circle what's asked before you solve.", remember: "Check the answer is the quantity the question asked for." }
    };
  }
  var LIN1 = {
    id: "a-lin1", t: "Linear equations in one variable", short: "Linear equations", kind: "Solve a linear equation",
    blurb: "Solve for the unknown — with brackets, fractions and $x$ on both sides — and tell when an equation has one solution, none, or infinitely many.",
    forms: ["equation", "word", "twist"],
    school: { course: "alg", unit: 2, t: "Algebra I, Unit 2: Solving equations & inequalities" },
    autopsy: { testing: "Solving a linear equation in one variable", clue: "$x$ appears only to the first power — it's linear.", remember: "Do the same thing to both sides; undo the last operation first.", spotQ: "Is each of these a linear equation in one variable?" },
    spot: function (R) {
      var a = R.int(2, 6), b = R.int(1, 9);
      return R.shuffle([
        { t: "If $" + a + "(n - " + b + ") = " + (a * 7) + "$, what is $n$?", yes: true, why: "One unknown, first power only — solve it by undoing." },
        { t: "What is the slope of $y = " + a + "x - " + b + "$?", yes: false, why: "That's a linear function of two variables — a slope question." },
        { t: "How many solutions does $" + a + "x + " + b + " = " + a + "x - 1$ have?", yes: true, why: "Still a linear equation in $x$ — it just has no solution." }]);
    },
    lesson: [
      { type: "learn", kicker: "The idea",
        prompt: "A linear equation is a balance: both sides are equal. Solve it by **undoing** what was done to $x$ — last thing first — and doing the same to both sides so it stays balanced.",
        scene: { type: "walk", rows: [
          { m: "3x + 5 = 20", say: "$x$ was multiplied by 3, **then** 5 was added." },
          { m: "3x = 15", say: "Undo the last thing first: subtract 5 from **both** sides." },
          { m: "x = 5", say: "Undo the multiplying: divide both sides by 3." },
          { m: "3(5) + 5 = 20 \\; \\checkmark", say: "Check by putting it back." }] }, gate: true },
      { type: "num", prompt: "Solve $4x - 7 = 21$. What is $x$?", answer: 7, pre: "$x =$",
        near: [{ v: 3.5, fb: "That subtracted the 7. To undo $-7$, add 7 to both sides." }, { v: 28, fb: "That's $4x$. Divide by 4." }],
        hints: ["Undo the $-7$ first: add 7 to both sides."], why: "$4x = 28$, so $x = 7$." },
      { type: "learn", kicker: "SAT move: use the structure",
        prompt: "The SAT loves asking for an **expression** instead of $x$. Look before you solve:",
        scene: { type: "walk", rows: [
          { m: "3x + 5 = 20", say: "Given." },
          { m: "6x + 10 = ?", say: "Asked. Notice: $6x + 10 = 2(3x + 5)$." },
          { m: "2(20) = 40", say: "So it's just twice 20. No $x$ needed — no fractions, no slips." }] }, gate: true },
      { type: "num", prompt: "If $2x - 3 = 11$, what is $4x - 6$?", answer: 22,
        near: [{ v: 7, fb: "That's $x$. The question wants $4x - 6$, which is $2(2x - 3)$." }],
        hints: ["$4x - 6$ is 2 times $2x - 3$."], why: "$4x - 6 = 2(2x - 3) = 2(11) = 22$." },
      { type: "learn", kicker: "One, none, or infinitely many",
        prompt: "Sometimes $x$ **disappears**. Then what's left decides everything.",
        scene: { type: "walk", rows: [
          { m: "2(x + 3) = 2x + 6", say: "Expand: $2x + 6 = 2x + 6$." },
          { m: "6 = 6", say: "Always true → **infinitely many** solutions." },
          { m: "2(x + 3) = 2x + 5", say: "Expand: $2x + 6 = 2x + 5$." },
          { m: "6 = 5", say: "Never true → **no solution**. Different $x$ coefficients would give exactly one." }] }, gate: true },
      { type: "choice", prompt: "How many solutions does $3(x - 1) = 3x + 4$ have?", keep: true,
        options: [{ t: "Zero" }, { t: "Exactly one", fb: "Exactly one needs different $x$ coefficients. Here both are 3." }, { t: "Exactly two", fb: "A linear equation never has exactly two solutions." }, { t: "Infinitely many", fb: "Expand: $3x - 3 = 3x + 4$ — the numbers don't match." }],
        answer: 0, hints: ["Expand the left side and compare."], why: "$3x - 3 = 3x + 4$ leaves $-3 = 4$: false, so no solution." }
    ],
    gen: function (R, o) {
      if (o.form === "word") return lin1Word(R, o.diff);
      if (o.form === "twist") return o.diff === 1 ? lin1Structure(R, 1) : R.chance(0.55) ? lin1Solutions(R, o.diff) : lin1Structure(R, o.diff);
      return o.diff === 1 ? lin1OneStep(R) : o.diff === 2 ? lin1Both(R) : lin1Brackets(R);
    }
  };

  /* ================================================== 2 · Linear functions */
  function lineFig(m, b, pts, o) {
    o = o || {};
    var xr = o.x || [-2, 10], yr = o.y || [-4, 14];
    return F.graph({ x: xr, y: yr, fns: [{ f: function (xx) { return m * xx + b; } }], pts: pts || [], w: 360, every: o.every || 2, everyY: o.everyY || 2, names: o.names });
  }
  function linfTable(R, diff) {
    var m = R.nz(-4, 5), b = R.int(-6, 9), step = diff >= 2 ? R.pick([2, 3]) : 1, x0 = diff >= 3 ? R.int(1, 3) : 0;
    while (b === m || b === 0) b = R.int(-6, 9);
    var xs = [0, 1, 2, 3].map(function (i) { return x0 + i * step; }), ys = xs.map(function (xx) { return m * xx + b; });
    var yname = diff >= 3 ? "f(x)" : "y";
    var ok = (yname === "y" ? "y = " : "f(x) = ") + lin(m, b);
    function f2(mm, bb) { return (yname === "y" ? "y = " : "f(x) = ") + lin(mm, bb); }
    return {
      stem: "The table shows some values of $x$ and " + (yname === "y" ? "$y$" : "$f(x)$") + " for a linear " + (yname === "y" ? "relationship" : "function $f$") + ". Which equation " + (yname === "y" ? "represents the relationship" : "defines $f$") + "?",
      fig: F.table({ head: ["$x$", "$" + yname + "$"], rows: xs.map(function (xx, i) { return ["$" + xx + "$", "$" + ys[i] + "$"]; }) }),
      choices: [x(ok, { ok: true }),
        step > 1 ? x(f2(m * step, b), { err: "concept", tr: "used the change in y per row as the slope", why: "Each row $x$ goes up by " + step + ", not 1. Slope is change in $y$ divided by change in $x$." })
          : x((yname === "y" ? "y = " : "f(x) = ") + linq(1 / m === m ? m + 2 : 1 / m, b), { err: "concept", tr: "divided run by rise", why: "Slope is change in $y$ over change in $x$: $\\frac{" + m + "}{1}$." }),
        x(f2(b, m), { err: "concept", tr: "swapped the slope and the intercept", why: "The slope multiplies $x$; the intercept is the value when $x = 0$." }),
        x(f2(m, -b), { err: "calc", tr: "got the sign of the intercept wrong", why: "Check a row: $x = " + xs[0] + "$ should give $" + ys[0] + "$." })],
      hint: "How much does $" + yname + "$ change when $x$ goes up by " + step + "?",
      strategy: "Slope = (change in $" + yname + "$) ÷ (change in $x$) from any two rows. Then the intercept is $" + yname + "$ at $x = 0$" + (x0 ? " — work back to it, or test a row." : ", right in the table."),
      walk: W([["m = \\frac{" + (ys[1] - ys[0]) + "}{" + step + "} = " + m, "Change in $" + yname + "$ over change in $x$, rows 1 and 2."],
        [x0 ? ys[0] + " = " + m + "(" + x0 + ") + b" : "b = " + b, x0 ? "Put a row into $" + yname + " = mx + b$." : "At $x = 0$, the value is the intercept."],
        [x0 ? "b = " + b : ok, x0 ? "Solve for $b$." : "Put them together."]].concat(x0 ? [[ok, "Put them together."]] : [])),
      concept: "A linear function changes by the same amount for every equal step in $x$. That constant rate is the slope; the value at $x = 0$ is the intercept.",
      rebuild: [
        { q: "From one row to the next, $x$ goes up by " + step + ". How much does $" + yname + "$ change?", num: ys[1] - ys[0], ok: "$" + yname + "$ changes by " + (ys[1] - ys[0]) + "." },
        { q: "So what is the slope — the change for each 1 that $x$ goes up?", num: m, ok: "Slope $= " + m + "$." },
        { q: "What is $" + yname + "$ when $x = 0$?", num: b, ok: "The intercept is $" + b + "$." }],
      autopsy: { hard: step > 1 ? "The $x$ values go up by " + step + ", not by 1." : "Choosing between four very similar equations.", clue: step > 1 ? "Divide the change in $" + yname + "$ by the change in $x$." : "Read the value at $x = 0$ straight off the table.", remember: "Slope is a rate: change in output per 1 of input." }
    };
  }
  function linfGraph(R, diff) {
    var m = R.pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5, 1.5]), b = R.int(-2, 6);
    var x1 = m % 1 ? 2 : 1, xA = 0, xB = x1 * R.int(1, 3);
    var A = [xA, b], B = [xB, b + m * xB];
    var slopeQ = diff <= 2;
    var mt = tex(m), inv = tex(1 / m);
    return {
      stem: slopeQ ? "The graph of the linear function $f$ is shown. What is the slope of the graph of $y = f(x)$?" : "The graph of the linear function $f$ is shown. Which equation defines $f$?",
      fig: lineFig(m, b, [{ x: A[0], y: A[1] }, { x: B[0], y: B[1] }], { x: [-4, 8], y: [-6, 10] }),
      choices: slopeQ ? [c(m, { ok: true }),
          c(1 / m, { err: "concept", tr: "found run over rise instead of rise over run", why: "Slope is rise ÷ run: the vertical change over the horizontal change." }),
          c(-m, { err: "graph", tr: "read the direction of the line backwards", why: "The line goes " + (m > 0 ? "up" : "down") + " from left to right, so the slope is " + (m > 0 ? "positive" : "negative") + "." }),
          c(b === 0 || b === m ? m + 2 : b, { err: "misread", tr: "gave the y-intercept, not the slope", why: "That's where the line crosses the $y$-axis. Slope is how steep it is." })]
        : [x("f(x) = " + linq(m, b), { ok: true }),
          Math.abs(m) === 1 ? x("f(x) = " + linq(2 * m, b), { err: "graph", tr: "miscounted the rise", why: "Count again from one grid corner on the line to the next: up " + Math.abs(B[1] - A[1]) + ", across " + (B[0] - A[0]) + "." })
            : x("f(x) = " + linq(1 / m, b), { err: "concept", tr: "found run over rise", why: "Slope is rise over run." }),
          x("f(x) = " + linq(m, b === 0 ? 2 : -b), { err: "graph", tr: "read the y-intercept with the wrong sign", why: "The line crosses the $y$-axis at $(0, " + b + ")$." }),
          x("f(x) = " + linq(-m, b), { err: "graph", tr: "read the direction of the line backwards", why: "Left to right, the line goes " + (m > 0 ? "up" : "down") + ": the slope is " + (m > 0 ? "positive" : "negative") + "." })],
      hint: "Find two points the line passes through exactly, where it crosses grid corners.",
      strategy: "Slope = rise ÷ run between two clear points. The $y$-intercept is where the line crosses the $y$-axis.",
      walk: W([["(" + A[0] + ", " + A[1] + "),\\ (" + B[0] + ", " + tex(B[1]) + ")", "Two points on the line, where it meets grid corners."],
        ["m = \\frac{" + tex(B[1]) + " - " + (A[1] < 0 ? "(" + A[1] + ")" : A[1]) + "}{" + B[0] + " - " + A[0] + "} = " + mt, "Rise over run."]].concat(slopeQ ? [] : [["f(x) = " + linq(m, b), "It crosses the $y$-axis at " + b + "."]])),
      concept: "Slope measures steepness: how far the line rises for each 1 it runs to the right. Negative slope: it falls.",
      rebuild: [
        { q: "Going from $(" + A[0] + ", " + A[1] + ")$ to $(" + B[0] + ", " + tex(B[1]) + ")$, what is the rise (change in $y$)?", num: B[1] - A[1], shown: tex(B[1] - A[1]), ok: "Rise $= " + tex(B[1] - A[1]) + "$." },
        { q: "And the run (change in $x$)?", num: B[0] - A[0], ok: "Run $= " + (B[0] - A[0]) + "$." },
        { q: "So the slope, rise ÷ run, is…", num: m, shown: mt, ok: "Slope $= " + mt + "$." }],
      autopsy: { hard: "Reading exact values from a graph.", clue: "Use points where the line crosses grid corners exactly.", remember: "Rise over run — vertical first." }
    };
  }
  function linfModel(R, diff) {
    var S0 = R.pick([[30, 1.5, "h(t)", "centimeters", "hours", "A candle's height as it burns", false], [480, 12, "V(t)", "gallons", "minutes", "The water left in a draining tank", false],
                     [350, 45, "B(w)", "dollars", "weeks", "The balance of Maya's savings account", true], [14, 2.5, "p(d)", "centimeters", "days", "The height of a bean plant", true]]);
    var start = S0[0], rate = S0[1], fn = S0[2], unit = S0[3], per = S0[4], what = S0[5];
    var up = S0[6];
    var rateTxt = String(rate).replace(".", "."), sign = up ? "+" : "-";
    var eqs = fn + " = " + start + " " + sign + " " + rate + fn.charAt(2);
    var v = fn.charAt(2);
    if (diff >= 3) {
      var t0 = R.int(2, 8);
      return {
        stem: what + " is modeled by $" + eqs + "$, where $" + fn + "$ is measured in " + unit + " and $" + v + "$ is the number of " + per + " since the start. What is the meaning of " + (up ? "the increase" : "the decrease") + " in $" + fn + "$ from $" + v + " = " + t0 + "$ to $" + v + " = " + (t0 + 1) + "$?",
        choices: [w("It " + (up ? "increases" : "decreases") + " by " + rate + " " + unit + ", the change for each additional " + per.replace(/s$/, "") + ".", { ok: true }),
          w("It is " + (start + (up ? 1 : -1) * rate * (t0 + 1)) + " " + unit + ", the amount after " + (t0 + 1) + " " + per + ".", { err: "misread", tr: "gave a value of the function, not the change", why: "That's the amount at $" + v + " = " + (t0 + 1) + "$. The question asks how much it changes over one " + per.replace(/s$/, "") + "." }),
          w("It " + (up ? "increases" : "decreases") + " by " + start + " " + unit + ", the starting amount.", { err: "concept", tr: "confused the rate with the starting value", why: "The starting amount is the constant term. The change per " + per.replace(/s$/, "") + " is the coefficient of $" + v + "$." }),
          w("It " + (up ? "increases" : "decreases") + " by " + H.round(rate * t0, 2) + " " + unit + ".", { err: "calc", tr: "multiplied the rate by the time", why: "That's the total change over " + t0 + " " + per + ". From $" + v + " = " + t0 + "$ to " + (t0 + 1) + " is one step." })],
        hint: "How much does $" + fn + "$ change when $" + v + "$ goes up by exactly 1?",
        strategy: "In $y = b + mx$, $m$ is the change in $y$ for each 1 added to $x$ — whatever $x$ is.",
        walk: W([[fn.replace(v, String(t0 + 1)) + " - " + fn.replace(v, String(t0)) + " = " + (up ? "" : "-") + rate, "The difference of two consecutive values is the coefficient."], ["", "Every step of 1 in $" + v + "$ changes $" + fn + "$ by " + rate + " " + unit + "."]]),
        concept: "In a linear model the coefficient is a constant rate: the same change for every step of 1, wherever you start.",
        rebuild: [
          { q: "What is $" + fn.replace(v, String(t0)) + "$?", num: start + (up ? 1 : -1) * rate * t0, ok: "Now one step later." },
          { q: "What is $" + fn.replace(v, String(t0 + 1)) + "$?", num: start + (up ? 1 : -1) * rate * (t0 + 1), ok: "The difference is " + rate + " — the coefficient." }],
        autopsy: { hard: "Four sentences that all sound reasonable.", clue: "\"From $" + v + " = " + t0 + "$ to " + (t0 + 1) + "\" is one unit — that's the rate.", remember: "Coefficient = change per unit. Constant = starting value." }
      };
    }
    var askRate = diff === 1 ? R.chance(0.5) : true;
    return {
      stem: what + " is modeled by $" + eqs + "$, where $" + fn + "$ is in " + unit + " and $" + v + "$ is the number of " + per + " since the start. What is the best interpretation of " + (askRate ? "$" + rate + "$" : "$" + start + "$") + " in this context?",
      choices: askRate ? [w("The number of " + unit + " it " + (up ? "increases" : "decreases") + " by each " + per.replace(/s$/, ""), { ok: true }),
          w("The number of " + unit + " at the start", { err: "concept", tr: "confused the rate with the starting value", why: "The starting value is the constant, $" + start + "$ — it's there when $" + v + " = 0$." }),
          w("The number of " + per + " until it " + (up ? "doubles" : "runs out"), { err: "misread", tr: "read the rate as a time", why: "$" + rate + "$ multiplies $" + v + "$ — it's " + unit + " per " + per.replace(/s$/, "") + ", not a number of " + per + "." }),
          w("The number of " + unit + " after 1 " + per.replace(/s$/, ""), { err: "calc", tr: "confused the rate with a value of the function", why: "After 1 " + per.replace(/s$/, "") + " it's $" + start + " " + sign + " " + rate + "$. The " + rate + " is the change, not the amount." })]
        : [w("The number of " + unit + " at the start", { ok: true }),
          w("The number of " + unit + " it " + (up ? "increases" : "decreases") + " by each " + per.replace(/s$/, ""), { err: "concept", tr: "confused the starting value with the rate", why: "That's the coefficient of $" + v + "$, $" + rate + "$." }),
          w("The number of " + per + " it lasts", { err: "misread", tr: "read the constant as a time", why: "$" + start + "$ is in " + unit + " — it's the value when $" + v + " = 0$." }),
          w("The greatest number of " + per + " possible", { err: "concept", tr: "read the constant as a limit", why: "Put $" + v + " = 0$ in: $" + fn.replace(v, "0") + " = " + start + "$. It's where it starts." })],
      hint: "What is $" + fn + "$ when $" + v + " = 0$? What changes when $" + v + "$ goes up by 1?",
      strategy: "Constant term = value at the start ($" + v + " = 0$). Coefficient = change per 1 unit of $" + v + "$.",
      walk: W([[fn.replace(v, "0") + " = " + start, "At the start, only the constant is left."], [fn.replace(v, "1") + " = " + (start + (up ? rate : -rate)), "One " + per.replace(/s$/, "") + " later it has changed by " + rate + "."]]),
      concept: "Every linear model reads the same way: start + rate × time. The SAT asks what each number means.",
      rebuild: [
        { q: "What is $" + fn + "$ when $" + v + " = 0$?", num: start, ok: "So $" + start + "$ is the starting amount." },
        { q: "How much does $" + fn + "$ change when $" + v + "$ goes from 0 to 1?", num: rate, ok: "So $" + rate + "$ is the change per " + per.replace(/s$/, "") + "." }],
      autopsy: { clue: "Units: $" + rate + "$ multiplies " + per + ", so it's " + unit + " per " + per.replace(/s$/, "") + ".", remember: "Constant = start; coefficient = rate." }
    };
  }
  function linfEval(R, diff) {
    var m = R.nz(-5, 6), b = R.int(-9, 9), k = R.int(-4, 6);
    if (diff >= 2) {
      var a1 = R.int(1, 5), v1 = m * a1 + b, a2 = a1 + R.int(2, 4), v2 = m * a2 + b, k2 = R.int(-3, 9);
      while (k2 === a1 || k2 === a2) k2 = R.int(-3, 9);
      return {
        stem: "For the linear function $f$, $f(" + a1 + ") = " + v1 + "$ and $f(" + a2 + ") = " + v2 + "$. What is the value of $f(" + k2 + ")$?",
        answer: m * k2 + b, shown: String(m * k2 + b), secs: 110,
        near: [{ v: (v2 - v1) / (a2 - a1) * k2, tr: "forgot the intercept" }],
        hint: "Two points on a line give its slope. Then find the intercept.",
        strategy: "Slope $= \\frac{" + v2 + " - " + (v1 < 0 ? "(" + v1 + ")" : v1) + "}{" + a2 + " - " + a1 + "}$. Then $f(x) = mx + b$ with one of the points gives $b$.",
        walk: W([["m = \\frac{" + v2 + " - " + (v1 < 0 ? "(" + v1 + ")" : v1) + "}{" + a2 + " - " + a1 + "} = " + m, "Slope from the two values."], [v1 + " = " + m + "(" + a1 + ") + b \\Rightarrow b = " + b, "Intercept from one of them."], ["f(" + k2 + ") = " + m + "(" + k2 + ") " + sgn(b) + " = " + (m * k2 + b), "Evaluate."]]),
        concept: "Two points determine a line. Slope first, then the intercept, then anything else.",
        rebuild: [
          { q: "What is the slope of $f$?", num: m, ok: "Change in output ÷ change in input." },
          { q: "What is $f(0)$, the intercept?", num: b, ok: "$b = " + b + "$." },
          { q: "So $f(" + k2 + ") =$", num: m * k2 + b, ok: "Done." }],
        autopsy: { hard: "No equation is given — you build it from two values.", clue: "$f(" + a1 + ")$ and $f(" + a2 + ")$ are two points on a line.", remember: "Two points → slope → intercept → equation." }
      };
    }
    return {
      stem: "The function $f$ is defined by $f(x) = " + lin(m, b) + "$. What is the value of $f(" + k + ")$?",
      choices: [c(m * k + b, { ok: true }),
        c(m * k - b, { err: "calc", tr: "subtracted the constant instead of adding", why: "$f(" + k + ") = " + m + "(" + k + ") " + sgn(b) + "$." }),
        c(m + k + b, { err: "concept", tr: "added the input instead of multiplying", why: "$" + m + "x$ means $" + m + "$ times $x$." }),
        c((k - b) / m, { err: "misread", tr: "solved f(x) = k instead of evaluating f(k)", why: "$f(" + k + ")$ means put " + k + " in for $x$ — not find the $x$ that gives " + k + "." })],
      hint: "$f(" + k + ")$ means: replace every $x$ with " + k + ".",
      strategy: "Substitute, keeping the input in brackets: $" + m + "(" + k + ") " + sgn(b) + "$.",
      walk: W([["f(" + k + ") = " + m + "(" + k + ") " + sgn(b), "Substitute."], [String(m * k + b), "Multiply, then add."]]),
      concept: "Function notation: $f(3)$ is the output when the input is 3.",
      rebuild: [{ q: "What is $" + m + " \\times " + (k < 0 ? "(" + k + ")" : k) + "$?", num: m * k, ok: "Now add $" + b + "$." }, { q: "So $f(" + k + ") =$", num: m * k + b, ok: "Done." }],
      autopsy: { clue: "Input in the brackets, output out." }
    };
  }
  var LINF = {
    id: "a-linf", t: "Linear functions", short: "Linear functions", kind: "Linear function: slope & intercept",
    blurb: "Read slope and intercept from an equation, a table, a graph or a real situation — and say what they mean.",
    forms: ["equation", "table", "graph", "model"],
    school: { course: "alg", unit: 4, t: "Algebra I, Unit 4: Linear equations & graphs" },
    autopsy: { testing: "Slope and intercept of a linear function", clue: "A constant rate of change — that's a line.", remember: "Slope = change in $y$ ÷ change in $x$; intercept = value at $x = 0$.", spotQ: "Is each of these about a linear function's slope or intercept?" },
    spot: function (R) {
      var m = R.int(2, 9);
      return R.shuffle([
        { t: "A gym charges \\$" + (m * 5) + " to join and \\$" + (m + 20) + " a month. What does " + (m + 20) + " represent?", yes: true, why: "A rate per month — the slope of the cost line." },
        { t: "The table shows $x$ = 0, 1, 2 and $y$ = 5, 8, 11. What is $y$ when $x = 10$?", yes: true, why: "Constant change of 3 — a linear function." },
        { t: "A population doubles every 5 years. What is it after 20 years?", yes: false, why: "Doubling is multiplying — exponential, not linear." }]);
    },
    lesson: [
      { type: "learn", kicker: "Play with it",
        prompt: "Every line is $y = mx + b$. Drag the sliders. Watch what $m$ does, and what $b$ does — then press Continue.",
        scene: { type: "plane", x: [-6, 6], y: [-6, 6], params: { m: { v: 1, min: -3, max: 3, step: 0.5, label: "$m$ (slope)" }, b: { v: 1, min: -4, max: 4, step: 1, label: "$b$ (intercept)" } },
                 fns: [{ f: "m*x + b", color: "blue" }], marks: [{ x: 0, y: function (p) { return p.b; }, label: function (p) { return "(0, " + p.b + ")"; }, color: "orange" }],
                 readout: function (s) { return "$y = " + L.poly([[s.params.m, "x"], [s.params.b, ""]]) + "$ — for every 1 step right, the line goes " + (s.params.m >= 0 ? "up " : "down ") + Math.abs(s.params.m) + "."; } },
        gate: true, then: "$m$ is the **slope**: how much $y$ changes for each 1 that $x$ goes up. $b$ is the **$y$-intercept**: where the line crosses the $y$-axis — the value of $y$ when $x = 0$." },
      { type: "learn", kicker: "Slope from a table",
        prompt: "In a table, slope is the change in $y$ divided by the change in $x$. Watch the $x$ steps — they aren't always 1.",
        scene: { type: "walk", rows: [
          { m: "x: 0,\\ 2,\\ 4 \\quad y: 7,\\ 13,\\ 19", say: "Each row, $x$ goes up by 2 and $y$ goes up by 6." },
          { m: "m = \\frac{6}{2} = 3", say: "Change in $y$ over change in $x$ — not just 6." },
          { m: "y = 3x + 7", say: "At $x = 0$, $y = 7$: the intercept." }] }, gate: true },
      { type: "num", prompt: "A linear function has $f(1) = 4$ and $f(3) = 10$. What is its slope?", answer: 3,
        near: [{ v: 6, fb: "That's the change in $f$. Divide by the change in $x$, which is 2." }], hints: ["Change in $f$ ÷ change in $x$."], why: "$\\frac{10 - 4}{3 - 1} = 3$." },
      { type: "learn", kicker: "What the numbers mean",
        prompt: "The SAT's favourite question: what does each number in a model **mean**?",
        scene: { type: "walk", rows: [
          { m: "h(t) = 30 - 1.5t", say: "A candle's height (cm) after $t$ hours." },
          { m: "h(0) = 30", say: "**Constant** = the value at the start: 30 cm tall." },
          { m: "-1.5", say: "**Coefficient** = the change per hour: it burns 1.5 cm every hour." }] }, gate: true },
      { type: "choice", prompt: "A taxi fare is $C = 3.50 + 2.25m$ dollars for $m$ miles. What does $2.25$ mean?",
        options: [{ t: "The cost for each mile" }, { t: "The cost to get in", fb: "That's the constant, 3.50 — paid when $m = 0$." }, { t: "The number of miles", fb: "$m$ is the miles. $2.25$ multiplies it — dollars per mile." }, { t: "The total fare", fb: "The total is $C$." }],
        answer: 0, hints: ["What does 2.25 multiply?"], why: "It multiplies the miles: dollars per mile." }
    ],
    gen: function (R, o) {
      if (o.form === "table") return linfTable(R, o.diff);
      if (o.form === "graph") return linfGraph(R, o.diff);
      if (o.form === "model") return linfModel(R, o.diff);
      return linfEval(R, o.diff);
    }
  };

  /* ====================================== 3 · Linear equations in two vars */
  function lin2Model(R, diff) {
    var S0 = R.pick([["adult", "student", "tickets", "a school play", 12, 7], ["large", "small", "pizzas", "a fundraiser", 15, 9], ["hardcover", "paperback", "books", "a book sale", 18, 6]]);
    var p1 = S0[4], p2 = S0[5], n1 = R.int(20, 60), n2 = R.int(20, 80), T = p1 * n1 + p2 * n2;
    if (diff === 1) {
      return {
        stem: "At " + S0[3] + ", " + S0[0] + " " + S0[2] + " sold for " + money(p1) + " each and " + S0[1] + " " + S0[2] + " for " + money(p2) + " each. The total collected was " + money(T) + ". If $a$ is the number of " + S0[0] + " " + S0[2] + " and $b$ the number of " + S0[1] + " " + S0[2] + ", which equation represents this?",
        choices: [x(p1 + "a + " + p2 + "b = " + T, { ok: true }),
          x(p2 + "a + " + p1 + "b = " + T, { err: "misread", tr: "attached each price to the wrong item", why: "$a$ counts the " + S0[0] + " " + S0[2] + ", which cost " + money(p1) + " each: $" + p1 + "a$." }),
          x("a + b = " + T, { err: "concept", tr: "added the numbers of items instead of their costs", why: "$a + b$ is how many were sold, not the money. Each count has to be multiplied by its price." }),
          x((p1 + p2) + "(a + b) = " + T, { err: "concept", tr: "charged every item both prices", why: "That makes every item cost $" + money(p1 + p2) + "$. Each type has its own price." })],
        hint: "How much money came from the " + S0[0] + " " + S0[2] + " alone?",
        strategy: "Money = price × number, for each type. Add the two amounts: that's the total.",
        walk: W([[p1 + "a", "Money from " + S0[0] + " " + S0[2] + "."], [p2 + "b", "Money from " + S0[1] + " " + S0[2] + "."], [p1 + "a + " + p2 + "b = " + T, "Together, the total."]]),
        concept: "An equation in two variables describes every combination that works: here, every mix of " + S0[2] + " that makes " + money(T) + ".",
        rebuild: [{ q: "If $a$ " + S0[0] + " " + S0[2] + " are sold at " + money(p1) + " each, how much money is that?", opts: [p1 + "a", "a + " + p1, "\\frac{a}{" + p1 + "}"].map(function (t) { return "$" + t + "$"; }), a: 0, ok: "Price times number." },
          { q: "And the total from both kinds equals…", opts: ["$" + p1 + "a + " + p2 + "b = " + T + "$", "$a + b = " + T + "$"], a: 0, ok: "Right." }],
        autopsy: { clue: "Each count is multiplied by its own price.", remember: "Total = (price × number) + (price × number)." }
      };
    }
    return {
      stem: "At " + S0[3] + ", " + S0[0] + " " + S0[2] + " sold for " + money(p1) + " each and " + S0[1] + " " + S0[2] + " for " + money(p2) + " each, for a total of " + money(T) + ". If " + n1 + " " + S0[0] + " " + S0[2] + " were sold, how many " + S0[1] + " " + S0[2] + " were sold?",
      answer: n2, shown: String(n2),
      near: [{ v: (T - n1) / p2, tr: "subtracted the number of items, not their cost" }, { v: T / p2 - n1, tr: "mixed items and dollars" }],
      hint: "How much of the " + money(T) + " came from the " + n1 + " " + S0[0] + " " + S0[2] + "?",
      strategy: "Put $a = " + n1 + "$ into $" + p1 + "a + " + p2 + "b = " + T + "$ and solve for $b$.",
      walk: W([[p1 + "(" + n1 + ") + " + p2 + "b = " + T, "Substitute the known count."], [p2 + "b = " + (T - p1 * n1), "Subtract " + (p1 * n1) + "."], ["b = " + n2, "Divide by " + p2 + "."]]),
      concept: "With one variable known, a two-variable equation becomes a one-variable equation.",
      rebuild: [{ q: "How much money came from the " + S0[0] + " " + S0[2] + "?", num: p1 * n1, ok: money(p1 * n1) + "." }, { q: "So how much from the " + S0[1] + " " + S0[2] + "?", num: T - p1 * n1, ok: money(T - p1 * n1) + "." }, { q: "At " + money(p2) + " each, how many is that?", num: n2, ok: n2 + "." }],
      autopsy: { clue: "Knowing one count turns it into a one-variable equation." }
    };
  }
  function lin2Eq(R, diff) {
    var A = R.int(2, 6), B = R.int(2, 6);
    while (B === A) B = R.int(2, 7);
    var C = A * B * R.int(1, 3);
    if (diff <= 2) {
      var isX = R.chance(0.5), right = isX ? C / A : C / B, other = isX ? C / B : C / A;
      return {
        stem: "The graph of $" + A + "x + " + B + "y = " + C + "$ in the $xy$-plane has " + (isX ? "an $x$-intercept at $(a, 0)$. What is the value of $a$?" : "a $y$-intercept at $(0, b)$. What is the value of $b$?"),
        choices: [c(right, { ok: true }),
          c(other, { err: "concept", tr: "found the other intercept", why: isX ? "On the $x$-axis, $y = 0$ — not $x = 0$." : "On the $y$-axis, $x = 0$ — not $y = 0$." }),
          c(C, { err: "misread", tr: "took the constant as the intercept", why: "The constant is " + C + ", but the intercept comes from dividing it by the coefficient that's left." }),
          c(C / (A + B), { err: "concept", tr: "divided by the sum of the coefficients", why: "At an intercept one variable is 0, so only one coefficient is left to divide by." })],
        hint: "At an intercept, one of the coordinates is 0. Which one?",
        strategy: "$x$-intercept: set $y = 0$. $y$-intercept: set $x = 0$.",
        walk: W([[isX ? A + "x + " + B + "(0) = " + C : A + "(0) + " + B + "y = " + C, isX ? "On the $x$-axis, $y = 0$." : "On the $y$-axis, $x = 0$."], [(isX ? "x" : "y") + " = " + tex(right), "Divide."]]),
        concept: "Intercepts are where the line meets the axes, so one coordinate there is always 0.",
        rebuild: [{ q: "On the " + (isX ? "$x$" : "$y$") + "-axis, which coordinate is 0?", opts: ["$y$", "$x$"], a: isX ? 0 : 1, ok: "So set it to 0." },
          { q: "Then " + (isX ? "$" + A + "x = " + C + "$" : "$" + B + "y = " + C + "$") + ". So it's…", num: right, shown: tex(right), ok: "Done." }],
        autopsy: { clue: isX ? "$x$-intercept: $y = 0$." : "$y$-intercept: $x = 0$.", remember: "At an intercept the other coordinate is zero." }
      };
    }
    // Which point lies on the line?
    var px = R.nz(-3, 6), py = (C - A * px) / B;
    while (Math.abs(py - Math.round(py)) > 1e-9 || py === px) { px++; py = (C - A * px) / B; }
    function pt(xx, yy, o) { return x("(" + xx + ", " + yy + ")", Object.assign({ xx: xx, yy: yy }, o)); }
    function off(cand) { return A * cand.xx + B * cand.yy !== C; }
    var ok = pt(px, py, { ok: true });
    return {
      stem: "Which point $(x, y)$ lies on the graph of $" + A + "x + " + B + "y = " + C + "$ in the $xy$-plane?",
      choices: [ok].concat(H.distinct(ok, [
        pt(py, px, { err: "misread", tr: "swapped the x- and y-coordinates", why: "Check it: $" + A + "(" + py + ") + " + B + "(" + px + ") = " + (A * py + B * px) + "$, not " + C + ". The first coordinate is $x$." }),
        pt(px + 1, py, { err: "calc", tr: "an arithmetic slip checking the point", why: "$" + A + "(" + (px + 1) + ") + " + B + "(" + py + ") = " + (A * (px + 1) + B * py) + "$ — not " + C + "." }),
        pt(px, -py, { err: "calc", tr: "lost a minus sign", why: "Substitute it: $" + A + "(" + px + ") + " + B + "(" + (-py) + ") = " + (A * px - B * py) + "$, not " + C + "." }),
        pt(px, py + 1, { err: "calc", tr: "an arithmetic slip checking the point", why: "$" + A + "(" + px + ") + " + B + "(" + (py + 1) + ") = " + (A * px + B * (py + 1)) + "$ — not " + C + "." }),
        pt(px - 1, py + 1, { err: "calc", tr: "an arithmetic slip checking the point", why: "$" + A + "(" + (px - 1) + ") + " + B + "(" + (py + 1) + ") = " + (A * (px - 1) + B * (py + 1)) + "$ — not " + C + "." })], 3, off)),
      hint: "A point is on the line exactly when its coordinates make the equation true.",
      strategy: "Test each choice: substitute $x$ and $y$ and see which one gives " + C + ".",
      walk: W([[A + "(" + px + ") + " + B + "(" + py + ")", "Substitute the point."], [(A * px) + " + " + (B * py) + " = " + C + "\\; \\checkmark", "It works, so the point is on the line."]]),
      concept: "The graph of an equation is the set of every point that makes it true.",
      rebuild: [{ q: "For the point $(" + px + ", " + py + ")$, what is $" + A + "x + " + B + "y$?", num: C, ok: "It equals " + C + ", so the point is on the line." }],
      autopsy: { clue: "\"Lies on the graph\" means \"makes the equation true\".", remember: "Test points by substituting." }
    };
  }
  var LIN2 = {
    id: "a-lin2", t: "Linear equations in two variables", short: "Two-variable equations", kind: "Two-variable linear equation",
    blurb: "Build an equation like $12a + 7b = 530$ from a situation, find intercepts, and test which points are solutions.",
    forms: ["model", "equation", "twist"],
    school: { course: "alg", unit: 5, t: "Algebra I, Unit 5: Forms of linear equations" },
    autopsy: { testing: "Linear equations in two variables", clue: "Two unknowns, one equation — many solutions, all on one line.", remember: "Each count times its rate, added up, equals the total.", spotQ: "Is each of these a two-variable linear equation question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "Pens cost \\$2 and notebooks \\$5. Which equation shows spending exactly \\$40?", yes: true, why: "$2p + 5n = 40$ — two unknowns, one linear equation." },
        { t: "What is the $y$-intercept of $3x + 5y = 30$?", yes: true, why: "Set $x = 0$: $y = 6$." },
        { t: "Solve $x^2 = 49$.", yes: false, why: "One variable, squared — a quadratic." }]);
    },
    lesson: [
      { type: "learn", kicker: "Many answers, one line",
        prompt: "$3x + 4y = 24$ has two unknowns, so it has **many** solutions — every point on a line. Drag the point. When the readout says 24, you're on the line.",
        scene: { type: "plane", x: [-2, 10], y: [-2, 8], fns: [{ f: "(24 - 3*x)/4", color: "blue" }], points: [{ id: "P", x: 2, y: 1, drag: true, label: "P" }],
                 readout: function (s) { var p = s.pt("P"), v = 3 * p.x + 4 * p.y; return "$3(" + p.x + ") + 4(" + p.y + ") = " + v + "$" + (v === 24 ? " — **on the line**." : v < 24 ? " — below it." : " — above it."); },
                 goal: function (s) { var p = s.pt("P"); return 3 * p.x + 4 * p.y === 24; } },
        gate: true, then: "Every point that makes the equation true is on the line — $(0, 6)$, $(4, 3)$, $(8, 0)$… and no point off it works." },
      { type: "learn", kicker: "The intercepts",
        prompt: "Where does the line cross the axes? Make one variable zero.",
        scene: { type: "walk", rows: [
          { m: "x = 0: \\; 4y = 24 \\Rightarrow y = 6", say: "The $y$-intercept is $(0, 6)$." },
          { m: "y = 0: \\; 3x = 24 \\Rightarrow x = 8", say: "The $x$-intercept is $(8, 0)$." }] }, gate: true },
      { type: "num", prompt: "What is the $x$-coordinate of the $x$-intercept of $5x + 2y = 30$?", answer: 6,
        near: [{ v: 15, fb: "That's the $y$-intercept (set $x = 0$). For the $x$-intercept, set $y = 0$." }], hints: ["On the $x$-axis, $y = 0$."], why: "$5x = 30$, so $x = 6$." },
      { type: "learn", kicker: "From a story",
        prompt: "Situations with two kinds of things become two-variable equations.",
        scene: { type: "walk", rows: [
          { m: "12a + 7b = 530", say: "Adult tickets \\$12, student tickets \\$7, \\$530 collected." },
          { m: "12a", say: "The money from $a$ adult tickets." },
          { m: "a = 30 \\Rightarrow 7b = 170", say: "Know one count, and it's a one-variable equation." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "model") return lin2Model(R, o.diff);
      return lin2Eq(R, o.form === "twist" ? 3 : o.diff);
    }
  };

  /* ========================================================= 4 · Systems */
  function sysSolve(R, diff) {
    var xv = R.int(-5, 9), yv = R.int(-5, 9), askY = R.chance(0.5);
    var a1 = 1, b1 = 1, a2 = 1, b2 = -1;
    if (diff >= 2) { a1 = R.int(2, 5); b1 = R.nz(-4, 5); a2 = R.int(1, 4); b2 = R.nz(-4, 5); while (a1 * b2 === a2 * b1) b2 = R.nz(-4, 5); }
    var c1 = a1 * xv + b1 * yv, c2 = a2 * xv + b2 * yv, ask = askY ? "y" : "x", right = askY ? yv : xv, other = askY ? xv : yv;
    var e1 = L.poly([[a1, "x"], [b1, "y"]]) + " = " + c1, e2 = L.poly([[a2, "x"], [b2, "y"]]) + " = " + c2;
    var sum = diff === 1 ? (c1 + c2) / 2 : null;
    return {
      stem: "$$" + e1 + "$$$$" + e2 + "$$The solution to the system of equations above is $(x, y)$. What is the value of $" + ask + "$?",
      choices: [c(right, { ok: true }),
        c(other === right ? other + 3 : other, { err: "misread", tr: "found the other variable", why: "That's $" + (askY ? "x" : "y") + "$. The question asks for $" + ask + "$." }),
        c(-right === right ? right + 2 : -right, { err: "calc", tr: "lost a sign during elimination", why: "Check it in both equations — a sign flipped along the way." }),
        diff === 1 ? c(askY ? (c1 - c2) : (c1 + c2), { err: "calc", tr: "stopped before dividing", why: "Adding or subtracting the equations gives $2" + ask + "$, not $" + ask + "$. Divide by 2." })
          : c(right + (right > 0 ? 2 : -2), { err: "calc", tr: "an arithmetic slip while eliminating", why: "Substitute your pair into both equations — one of them won't balance." })],
      hint: diff === 1 ? "What happens if you add the two equations?" : "Can you scale one equation so a variable cancels when you add or subtract?",
      strategy: diff === 1 ? "Add the equations: the $y$ terms cancel. Subtract them: the $x$ terms cancel." : "Multiply one or both equations so the coefficients of one variable are opposites, then add.",
      walk: diff === 1 ? W([["2x = " + (c1 + c2), "Add the equations: $y - y$ cancels."], ["x = " + xv, "Divide by 2."], ["y = " + c1 + " - " + (xv < 0 ? "(" + xv + ")" : xv) + " = " + yv, "Put $x$ back in the first equation."]])
        : W([[e1, "First equation."], [e2, "Second."], ["x = " + xv + ",\\; y = " + yv, "Eliminate one variable, solve, then substitute back."], ["(" + xv + ", " + yv + ")", "Check it in both equations."]]),
      concept: "A system's solution is the point both equations share. Eliminating a variable turns two equations into one.",
      rebuild: diff === 1 ? [
        { q: "Add the two equations. What is $2x$?", num: c1 + c2, ok: "The $y$ terms cancel." },
        { q: "So $x =$", num: xv, ok: "$x = " + xv + "$." },
        { q: "Then from $x + y = " + c1 + "$, $y =$", num: yv, ok: "$y = " + yv + "$." }]
        : [{ q: "Which is the solution? (Check it in both equations.)", opts: ["$(" + xv + ", " + yv + ")$", "$(" + yv + ", " + xv + ")$", "$(" + (-xv) + ", " + yv + ")$"], a: 0, ok: "It satisfies both." },
           { q: "So $" + ask + " =$", num: right, ok: "Done." }],
      autopsy: { hard: diff >= 2 ? "Neither variable cancels straight away — one equation needs scaling first." : null, trap: "Answering with the other variable.", clue: "Look at which variable is asked for before you start.", remember: "Solve, then check your answer is the variable they asked for." }
    };
  }
  function sysWord(R, diff) {
    var p1 = R.pick([2, 3, 4]), p2 = p1 + R.pick([2, 3, 5]), n1 = R.int(4, 14), n2 = R.int(3, 12), N = n1 + n2, T = p1 * n1 + p2 * n2;
    return {
      stem: "A school store sold " + N + " items — pencils at " + money(p1) + " each and notebooks at " + money(p2) + " each — for a total of " + money(T) + ". How many notebooks were sold?",
      choices: [c(n2, { ok: true }),
        c(n1, { err: "misread", tr: "found the other quantity", why: "That's the number of pencils." }),
        c(T / p2, { err: "concept", tr: "used only the money equation", why: "The money alone can't tell pencils from notebooks — you need the count equation too." }),
        c((T - N) / p2, { err: "calc", tr: "subtracted the count from the money", why: "Items and dollars can't be subtracted directly. Use $p + n = " + N + "$ and $" + p1 + "p + " + p2 + "n = " + T + "$." })],
      hint: "Two unknowns — how many facts does the problem give you?",
      strategy: "Write both equations: count and money. Multiply the count equation by " + p1 + " and subtract to eliminate pencils.",
      walk: W([["p + n = " + N, "The count."], [p1 + "p + " + p2 + "n = " + T, "The money."], [(p2 - p1) + "n = " + (T - p1 * N), "Subtract " + p1 + " times the first from the second."], ["n = " + n2, "Divide."]]),
      concept: "Two unknowns need two independent facts. Each fact is an equation; together they pin down one answer.",
      rebuild: [
        { q: "If every one of the " + N + " items were a pencil, what would they cost?", num: p1 * N, ok: money(p1 * N) + "." },
        { q: "The real total is " + money(T) + ". Each notebook adds how much more than a pencil?", num: p2 - p1, ok: money(p2 - p1) + " extra each." },
        { q: "So how many notebooks make up the difference of " + money(T - p1 * N) + "?", num: n2, ok: n2 + " notebooks." }],
      autopsy: { clue: "Two facts (count and money) → two equations.", remember: "Name both unknowns, write both equations, eliminate one." }
    };
  }
  function sysGraph(R, diff) {
    var xv = R.nz(-3, 4), yv = R.nz(-3, 5), m1 = R.pick([1, 2, -1, 0.5]), m2 = R.pick([-2, -1, 3, -0.5]);
    while (yv === xv) yv = R.nz(-3, 5);
    if (m1 === m2) m2 = -m1 - 1;
    var b1 = yv - m1 * xv, b2 = yv - m2 * xv;
    return {
      stem: "The graphs of two linear equations are shown in the $xy$-plane. What is the solution $(x, y)$ to the system of the two equations?",
      fig: F.graph({ x: [-6, 6], y: [-6, 8], fns: [{ f: function (t) { return m1 * t + b1; }, cls: "b" }, { f: function (t) { return m2 * t + b2; }, cls: "r" }], w: 340 }),
      choices: (function () {
        var ok = x("(" + xv + ", " + yv + ")", { ok: true });
        return [ok].concat(H.distinct(ok, [
          x("(" + yv + ", " + xv + ")", { err: "graph", tr: "swapped the coordinates", why: "The first coordinate is across ($x$), the second is up ($y$)." }),
          x("(0, " + tex(b1) + ")", { err: "misread", tr: "picked a y-intercept instead of the crossing point", why: "That's where one line crosses the $y$-axis. The solution is where the two lines cross each other." }),
          x("(" + tex(-b1 / m1) + ", 0)", { err: "misread", tr: "picked an x-intercept", why: "That's where one line meets the $x$-axis — only one equation is true there." }),
          x("(0, " + tex(b2) + ")", { err: "misread", tr: "picked a y-intercept instead of the crossing point", why: "That's where one line crosses the $y$-axis. The solution is where the two lines cross each other." }),
          x("(" + xv + ", " + (-yv) + ")", { err: "graph", tr: "misread the grid", why: "Count the grid again from the origin: up is positive $y$." })], 3));
      })(),
      hint: "Which point is on both lines?",
      strategy: "The solution of a system is where the graphs intersect: read that point's coordinates, $x$ first.",
      walk: W([["(" + xv + ", " + yv + ")", "The lines cross here — the only point on both."]]),
      concept: "Each line is every solution of one equation. The intersection is the only point that solves both.",
      rebuild: [{ q: "The solution must satisfy both equations. Where is a point on both lines?", opts: ["Where they cross", "Where one crosses the $y$-axis", "Where one crosses the $x$-axis"], a: 0, ok: "The intersection." }, { q: "Read its $x$-coordinate.", num: xv, ok: "Now its $y$: " + yv + "." }],
      autopsy: { clue: "\"Solution to the system\" = intersection of the graphs.", remember: "Intersection → both equations true." }
    };
  }
  function sysTwist(R, diff) {
    var a = R.int(2, 6), b = R.int(2, 7), cc = R.int(5, 20), k = R.int(2, 4), inf = R.chance(0.5);
    var d = inf ? k * cc : k * cc + R.nz(-6, 6);
    if (diff <= 2) {
      return {
        stem: "$$" + a + "x + " + b + "y = " + cc + "$$$$" + (k * a) + "x + " + (k * b) + "y = " + d + "$$How many solutions does the system of equations above have?",
        choices: ["Zero", "Exactly one", "Exactly two", "Infinitely many"].map(function (t, i) {
          var right = inf ? 3 : 0;
          return i === right ? w(t, { ok: true }) : w(t, { err: i === 2 ? "concept" : "misread", tr: i === 2 ? "thought two lines could meet twice" : "judged it without comparing the equations",
            why: i === 1 ? "Exactly one needs different slopes. The second equation is " + k + " times the first on the left — same slope." : i === 2 ? "Two different straight lines meet at most once." : i === 3 ? "Infinitely many needs the right sides to match too: " + k + " × " + cc + " = " + (k * cc) + ", not " + d + "." : "Zero needs the right sides NOT to match — here " + k + " × " + cc + " = " + d + ", so they're the same line." });
        }), order: "keep",
        hint: "Compare the second equation with the first. Is it a multiple?",
        strategy: "Scale the first equation by " + k + ". Same left side, same right side → same line (infinitely many). Same left, different right → parallel (none).",
        walk: W([[(k * a) + "x + " + (k * b) + "y = " + (k * cc), k + " times the first equation."], [(k * cc) + (inf ? " = " : " \\ne ") + d, inf ? "The second equation is the same line." : "Same slope, different line: parallel, never meet."]]),
        concept: "Two lines meet once (different slopes), never (same slope, different intercepts) or everywhere (the same line).",
        rebuild: [{ q: "What is " + k + " times the first equation's left side?", opts: ["$" + (k * a) + "x + " + (k * b) + "y$", "$" + (k + a) + "x + " + (k + b) + "y$"], a: 0, ok: "It matches the second equation's left side — same slope." },
          { q: "Is " + k + " × " + cc + " equal to " + d + "?", opts: ["Yes", "No"], a: inf ? 0 : 1, ok: inf ? "Same line: infinitely many." : "Parallel lines: no solution." }],
        autopsy: { clue: "The left sides are multiples of each other.", remember: "Same slope: compare the constants." }
      };
    }
    var k2 = R.int(2, 4);
    return {
      stem: "$$" + a + "x + " + b + "y = " + cc + "$$$$" + (k2 * a) + "x + ky = " + (k2 * cc + R.int(1, 9)) + "$$In the system of equations above, $k$ is a constant. For what value of $k$ does the system have no solution?",
      answer: k2 * b, shown: String(k2 * b), secs: 120,
      near: [{ v: b, tr: "matched the coefficient without scaling" }],
      hint: "No solution means parallel lines: same slope, different intercepts.",
      strategy: "The $x$-coefficient went from " + a + " to " + (k2 * a) + " — times " + k2 + ". For the same slope, the $y$-coefficient must scale the same way.",
      walk: W([[(k2 * a) + " = " + k2 + " \\times " + a, "The second equation's $x$ term is " + k2 + " times the first's."], ["k = " + k2 + " \\times " + b + " = " + (k2 * b), "Same ratio for $y$ gives the same slope."], ["", "The constants aren't in that ratio, so the lines are parallel: no solution."]]),
      concept: "Lines $ax + by = c$ are parallel when their coefficients are in the same ratio but the constants aren't.",
      rebuild: [{ q: "By what factor did the $x$-coefficient grow?", num: k2, ok: "Times " + k2 + "." }, { q: "So for parallel lines, $k$ must be " + k2 + " times " + b + ":", num: k2 * b, ok: "$k = " + (k2 * b) + "$." }],
      autopsy: { hard: "A constant to find, not a solution — you reason about slopes.", clue: "No solution = parallel = proportional coefficients.", remember: "Proportional left sides: same slope." }
    };
  }
  var SYS = {
    id: "a-sys", t: "Systems of two linear equations", short: "Systems", kind: "System of linear equations",
    blurb: "Find where two lines meet — by adding, substituting or reading a graph — and tell when they never meet or are the same line.",
    forms: ["equation", "word", "graph", "twist"],
    school: { course: "alg", unit: 6, t: "Algebra I, Unit 6: Systems of equations" },
    autopsy: { testing: "Solving a system of two linear equations", clue: "Two equations, two unknowns.", remember: "Eliminate one variable; check which variable is asked for.", spotQ: "Is each of these a system of linear equations?" },
    spot: function (R) {
      return R.shuffle([
        { t: "Tickets were \\$5 and \\$8. 40 were sold for \\$245. How many \\$8 tickets?", yes: true, why: "Count and money: two equations, two unknowns." },
        { t: "Where do $y = 2x + 1$ and $y = -x + 7$ intersect?", yes: true, why: "An intersection is a system's solution." },
        { t: "Where does $y = x^2$ cross $y = 4$?", yes: false, why: "One equation is quadratic — a nonlinear system." }]);
    },
    lesson: [
      { type: "learn", kicker: "Where two lines meet",
        prompt: "Each equation is a line of solutions. The **system's** solution is the point on both — where they cross. Drag the point onto the crossing.",
        scene: { type: "plane", x: [-2, 7], y: [-3, 8], fns: [{ f: "2*x - 1", color: "blue", label: "y = 2x − 1" }, { f: "-x + 5", color: "red", label: "y = −x + 5" }],
                 points: [{ id: "P", x: 5, y: 1, drag: true, label: "P" }],
                 readout: function (s) { var p = s.pt("P"), a = p.y === 2 * p.x - 1, b = p.y === -p.x + 5; return a && b ? "On **both** lines: $(2, 3)$ solves both equations." : a ? "On the blue line only." : b ? "On the red line only." : "On neither line."; },
                 goal: function (s) { var p = s.pt("P"); return p.x === 2 && p.y === 3; } },
        gate: true, then: "$(2, 3)$ is the only point on both lines: $3 = 2(2) - 1$ and $3 = -2 + 5$." },
      { type: "learn", kicker: "Eliminate",
        prompt: "Faster than graphing: add or subtract the equations so one variable disappears.",
        scene: { type: "walk", rows: [
          { m: "x + y = 10", say: "First equation." }, { m: "x - y = 4", say: "Second." },
          { m: "2x = 14", say: "Add them: $+y$ and $-y$ cancel." }, { m: "x = 7,\\; y = 3", say: "Then back into $x + y = 10$." }] }, gate: true },
      { type: "num", prompt: "Solve: $2x + y = 11$ and $x - y = 1$. What is $x$?", answer: 4, hints: ["Add the equations — $y$ cancels."], why: "$3x = 12$, so $x = 4$ (and $y = 3$).",
        near: [{ v: 3, fb: "That's $y$. The question asks for $x$." }] },
      { type: "learn", kicker: "None, or infinitely many",
        prompt: "Parallel lines never meet; identical lines meet everywhere.",
        scene: { type: "walk", rows: [
          { m: "2x + 3y = 6 \\;\\text{and}\\; 4x + 6y = 12", say: "The second is 2 × the first: the **same line** → infinitely many." },
          { m: "2x + 3y = 6 \\;\\text{and}\\; 4x + 6y = 10", say: "Same left side ×2, but $10 \\ne 12$: **parallel** → no solution." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "word") return sysWord(R, o.diff);
      if (o.form === "graph") return sysGraph(R, o.diff);
      if (o.form === "twist") return sysTwist(R, o.diff);
      return sysSolve(R, o.diff);
    }
  };

  /* ===================================================== 5 · Inequalities */
  function ineqSolve(R, diff) {
    var a = -R.int(2, 6), b = R.nz(-9, 12), xb = R.nz(-6, 7), cc = a * xb + b, rel = R.pick([">", "<", "\\ge", "\\le"]);
    var flip = { ">": "<", "<": ">", "\\ge": "\\le", "\\le": "\\ge" };
    return {
      stem: "Which of the following is equivalent to $" + lin(a, b) + " " + rel + " " + cc + "$?",
      choices: [x("x " + flip[rel] + " " + xb, { ok: true }),
        x("x " + rel + " " + xb, { err: "concept", tr: "forgot to flip the sign when dividing by a negative", why: "Dividing by $" + a + "$, a negative, reverses the inequality. Test a value on each side of " + xb + " in the original to see which side works." }),
        x("x " + flip[rel] + " " + (-xb === xb ? xb + 2 : -xb), { err: "calc", tr: "got the sign of the boundary wrong", why: "Solve $" + lin(a, b) + " = " + cc + "$: the boundary is $x = " + xb + "$." }),
        x("x " + rel + " " + (-xb === xb ? xb - 2 : -xb), { err: "calc", tr: "lost two signs at once", why: "Both the direction and the boundary are off. Undo $" + sgn(b) + "$, then divide by $" + a + "$ and flip." })],
      hint: "Solve it like an equation. What's special about dividing by $" + a + "$?",
      strategy: "Isolate $x$ as usual, and reverse the inequality when you multiply or divide by a negative. Check with a test value.",
      walk: W([[lin(a, b) + " " + rel + " " + cc, "Start."], [a + "x " + rel + " " + (cc - b), (b > 0 ? "Subtract " + b : "Add " + (-b)) + "."], ["x " + flip[rel] + " " + xb, "Divide by $" + a + "$ — negative, so the sign flips."]]),
      concept: "Multiplying or dividing both sides by a negative number reverses their order: $2 < 3$ but $-2 > -3$.",
      rebuild: [
        { q: "After undoing the $" + sgn(b) + "$, what is on the right?", num: cc - b, ok: "$" + a + "x " + rel + " " + (cc - b) + "$." },
        { q: "You divide by $" + a + "$. What happens to the inequality sign?", opts: ["It flips", "It stays", "It becomes ="], a: 0, ok: "Dividing by a negative flips it." },
        { q: "So the answer is:", opts: ["$x " + flip[rel] + " " + xb + "$", "$x " + rel + " " + xb + "$"], a: 0, ok: "Right." }],
      autopsy: { trap: "Forgetting to flip the sign.", clue: "The coefficient of $x$ is negative.", remember: "Multiply or divide by a negative → flip." }
    };
  }
  function ineqModel(R, diff) {
    var cap = R.pick([1200, 1500, 2000, 2500]), driver = R.pick([75, 80, 90]), box = R.pick([25, 30, 35, 40]);
    var maxB = Math.floor((cap - driver) / box);
    if ((cap - driver) % box === 0) cap += Math.floor(box / 2);
    maxB = Math.floor((cap - driver) / box);
    if (diff === 1) {
      return {
        stem: "A delivery van can carry at most " + H.commas(cap) + " pounds. The driver weighs " + driver + " pounds, and each box weighs " + box + " pounds. Which inequality represents the number of boxes, $b$, the van can carry with the driver?",
        choices: [x(driver + " + " + box + "b \\le " + cap, { ok: true }),
          x(driver + " + " + box + "b \\ge " + cap, { err: "concept", tr: "translated \"at most\" as \"at least\"", why: "\"At most\" means the weight can't go over " + cap + ": $\\le$." }),
          x(box + " + " + driver + "b \\le " + cap, { err: "misread", tr: "multiplied the wrong weight by b", why: "Each **box** is " + box + " pounds, so the box weight is $" + box + "b$." }),
          x(driver + " + " + box + "b < " + cap, { err: "misread", tr: "wrote a strict inequality", why: "\"At most\" allows exactly " + cap + " — use $\\le$, not $<$." })],
        hint: "What's the total weight with $b$ boxes? And does \"at most\" mean $\\le$ or $\\ge$?",
        strategy: "Total weight = driver + " + box + " × boxes. \"At most\" → $\\le$; \"at least\" → $\\ge$.",
        walk: W([[driver + " + " + box + "b", "Total weight."], [driver + " + " + box + "b \\le " + cap, "At most " + cap + "."]]),
        concept: "Inequality words: at most / no more than → $\\le$; at least / no fewer than → $\\ge$; more than → $>$; less than → $<$.",
        rebuild: [{ q: "What is the weight of $b$ boxes?", opts: ["$" + box + "b$", "$" + driver + "b$", "$b + " + box + "$"], a: 0, ok: "Now add the driver." }, { q: "\"At most " + cap + "\" means the total is…", opts: ["$\\le " + cap + "$", "$\\ge " + cap + "$", "$= " + cap + "$"], a: 0, ok: "Can't go over." }],
        autopsy: { clue: "\"At most\" → $\\le$.", remember: "Translate the words carefully: most → $\\le$, least → $\\ge$." }
      };
    }
    return {
      stem: "A delivery van can carry at most " + H.commas(cap) + " pounds. The driver weighs " + driver + " pounds, and each box weighs " + box + " pounds. What is the greatest number of boxes the van can carry with the driver?",
      answer: maxB, shown: String(maxB),
      near: [{ v: maxB + 1, tr: "rounded up past the limit" }, { v: Math.floor(cap / box), tr: "forgot the driver's weight" }],
      hint: "Solve $" + driver + " + " + box + "b \\le " + cap + "$ — and think about whether you can carry part of a box.",
      strategy: "Solve the inequality, then round **down**: the answer must still fit under the limit.",
      walk: W([[driver + " + " + box + "b \\le " + cap, "The weight limit."], [box + "b \\le " + (cap - driver), "Subtract the driver."], ["b \\le " + H.round((cap - driver) / box, 2), "Divide."], ["b = " + maxB, "Round down to a whole box that still fits."]]),
      concept: "In context, the answer must make sense: whole boxes, and still inside the limit — so round down here.",
      rebuild: [{ q: "How many pounds are left for boxes after the driver?", num: cap - driver, ok: (cap - driver) + " pounds." }, { q: "Divide by " + box + ": about " + H.round((cap - driver) / box, 2) + ". Whole boxes that still fit?", num: maxB, ok: maxB + " boxes." }],
      autopsy: { hard: "Rounding: " + H.round((cap - driver) / box, 2) + " rounds to " + Math.round((cap - driver) / box) + ", but that many boxes would break the limit.", trap: "Rounding up past the limit.", clue: "\"Greatest number\" + \"at most\" → round down.", remember: "Check the rounded answer still satisfies the inequality." }
    };
  }
  function ineqPoint(R, diff) {
    var m = R.pick([1, 2, -1]), b = R.int(-3, 3), m2 = -1, b2 = R.int(4, 8);
    var pts = [[0, 0], [1, 5], [2, 2], [-1, 6], [3, 1], [0, 4], [1, 1], [2, 5], [-2, 3], [4, 3]];
    var good = pts.filter(function (p) { return p[1] > m * p[0] + b && p[1] < m2 * p[0] + b2; });
    var bad = pts.filter(function (p) { return !(p[1] > m * p[0] + b && p[1] < m2 * p[0] + b2); });
    if (!good.length || bad.length < 3) return ineqSolve(R, diff);
    var g = R.pick(good), bs = R.shuffle(bad).slice(0, 3);
    function why(p) {
      var a1 = p[1] > m * p[0] + b, a2 = p[1] < m2 * p[0] + b2;
      return !a1 ? "It fails the first: $" + p[1] + " > " + (m * p[0] + b) + "$ is false." : "It fails the second: $" + p[1] + " < " + (m2 * p[0] + b2) + "$ is false.";
    }
    return {
      stem: "$$y > " + lin(m, b) + "$$$$y < " + lin(m2, b2) + "$$Which point $(x, y)$ is a solution to the system of inequalities above?",
      choices: [x("(" + g[0] + ", " + g[1] + ")", { ok: true })].concat(bs.map(function (p) { return x("(" + p[0] + ", " + p[1] + ")", { err: "calc", tr: "checked only one of the two inequalities", why: why(p) }); })),
      hint: "A solution has to make both inequalities true.",
      strategy: "Test each point in both inequalities; cross out a choice as soon as one fails.",
      walk: W([["" + g[1] + " > " + (m * g[0] + b) + "\\; \\checkmark", "First inequality."], ["" + g[1] + " < " + (m2 * g[0] + b2) + "\\; \\checkmark", "Second inequality."]]),
      concept: "The solutions of a system of inequalities are the points in both shaded regions — every inequality true at once.",
      rebuild: [{ q: "Test $(" + g[0] + ", " + g[1] + ")$ in the first. Is $" + g[1] + " > " + (m * g[0] + b) + "$?", opts: ["Yes", "No"], a: 0, ok: "True." }, { q: "And is $" + g[1] + " < " + (m2 * g[0] + b2) + "$?", opts: ["Yes", "No"], a: 0, ok: "Both true — it's a solution." }],
      autopsy: { clue: "Both inequalities must be true.", remember: "Use the answer eliminator: cross out a point as soon as one inequality fails." }
    };
  }
  var INEQ = {
    id: "a-ineq", t: "Linear inequalities", short: "Inequalities", kind: "Linear inequality",
    blurb: "Solve inequalities (and flip the sign when it matters), translate \"at most\" and \"at least\", and test points in a system.",
    forms: ["equation", "model", "twist"],
    school: { course: "alg", unit: 7, t: "Algebra I, Unit 7: Inequalities (systems & graphs)" },
    autopsy: { testing: "Linear inequalities", clue: "An inequality sign, or words like at most / at least.", remember: "Flip the sign when multiplying or dividing by a negative.", spotQ: "Is each of these an inequality question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "A club needs at least 20 members. It has 7 and adds 3 a week. When can it start?", yes: true, why: "\"At least\" → $7 + 3w \\ge 20$." },
        { t: "Solve $-4x + 1 \\le 9$.", yes: true, why: "An inequality — watch the flip when dividing by $-4$." },
        { t: "Solve $-4x + 1 = 9$.", yes: false, why: "That's an equation: one exact value." }]);
    },
    lesson: [
      { type: "learn", kicker: "Why the sign flips",
        prompt: "Solve inequalities like equations — with one rule. Multiplying or dividing by a **negative** reverses the order.",
        scene: { type: "walk", rows: [
          { m: "2 < 5", say: "True." }, { m: "-2 > -5", say: "Multiply both by $-1$: the order reverses — $-2$ is to the right of $-5$." },
          { m: "-3x + 4 \\ge 19", say: "An example." }, { m: "-3x \\ge 15", say: "Subtract 4." }, { m: "x \\le -5", say: "Divide by $-3$ — flip." }] }, gate: true },
      { type: "choice", prompt: "Which is equivalent to $-2x + 3 < 11$?", options: [{ t: "$x > -4$" }, { t: "$x < -4$", fb: "Dividing by $-2$ flips the sign." }, { t: "$x > 4$", fb: "Check the boundary: $-2x = 8$ gives $x = -4$." }, { t: "$x < 4$", fb: "Both the boundary and the direction are off." }],
        answer: 0, hints: ["Subtract 3, then divide by $-2$ — and flip."], why: "$-2x < 8$ → $x > -4$." },
      { type: "learn", kicker: "Words into symbols",
        prompt: "The SAT writes inequalities in words. Four translations cover almost everything:",
        scene: { type: "walk", rows: [
          { m: "\\le", say: "**at most**, no more than, maximum" }, { m: "\\ge", say: "**at least**, no fewer than, minimum" },
          { m: "<", say: "**less than**, fewer than" }, { m: ">", say: "**more than**, greater than" }] }, gate: true },
      { type: "learn", kicker: "Round with care",
        prompt: "In context, the answer is often a whole number — and it must still fit.",
        scene: { type: "walk", rows: [
          { m: "80 + 25b \\le 1200", say: "A van holds at most 1,200 lb; driver 80 lb; boxes 25 lb each." },
          { m: "b \\le 44.8", say: "Solve." }, { m: "b = 44", say: "Round **down**: 45 boxes would weigh 1,205 lb — over the limit." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "model") return ineqModel(R, o.diff);
      if (o.form === "twist") return ineqPoint(R, o.diff);
      return ineqSolve(R, o.diff);
    }
  };

  S.domain(1, {
    skills: [LIN1, LINF, LIN2, SYS, INEQ],
    strategies: [
      { id: "undo", t: "Undo in reverse", rule: "To solve for $x$, undo what was done to it — the last operation first — doing the same to both sides.",
        when: "$x$ is buried inside a few operations.", skills: ["a-lin1"],
        ex: "Solve $5x - 8 = 27$.", walk: W([["5x - 8 = 27", "$x$ was multiplied by 5, then 8 was subtracted."], ["5x = 35", "Undo the last thing first: add 8."], ["x = 7", "Then undo ×5."]]) },
      { id: "structure", t: "Use the structure", rule: "When the question asks for an expression, look for a way to get it straight from the equation — often by multiplying both sides.",
        when: "the question asks for something like $6x + 10$, not $x$.", skills: ["a-lin1"],
        ex: "If $3x + 5 = 20$, what is $6x + 10$?", walk: W([["6x + 10 = 2(3x + 5)", "Spot the multiple."], ["= 2(20) = 40", "No need to find $x$."]]) },
      { id: "backsolve", t: "Test the choices", rule: "Plug the answer choices into the question; the one that works is the answer. Start with a middle value — it tells you whether to go bigger or smaller.",
        when: "the choices are numbers and the algebra looks long or error-prone.", skills: ["a-lin1", "a-sys", "a-ineq", "a-lin2"],
        ex: "Which value of $x$ solves $2(x - 3) = x + 1$? A) 5 B) 7 C) 9 D) 11", walk: W([["2(7 - 3) = 8,\\; 7 + 1 = 8", "Try B: both sides match."], ["x = 7", "Done — no algebra needed."]]) },
      { id: "slope2pts", t: "Slope from any two points", rule: "Slope = (change in $y$) ÷ (change in $x$) between any two points of a table or graph. Watch for $x$ steps bigger than 1.",
        when: "you're given a table, a graph, or two values of a function.", skills: ["a-linf"],
        ex: "A line passes through $(2, 5)$ and $(6, 17)$. Find its slope.", walk: W([["\\frac{17 - 5}{6 - 2} = \\frac{12}{4}", "Rise over run."], ["m = 3", "Divide."]]) },
      { id: "startrate", t: "Start + rate × time", rule: "In a linear model the constant is the starting value (input = 0) and the coefficient is the change per 1 unit of the input.",
        when: "the SAT asks \"what does this number represent?\"", skills: ["a-linf", "a-lin2"],
        ex: "$P = 250 + 40w$ is the money saved after $w$ weeks. What is 40?", walk: W([["P(0) = 250", "250 is what there is at the start."], ["P(1) - P(0) = 40", "40 is the amount saved each week."]]) },
      { id: "eliminate", t: "Eliminate a variable", rule: "Add or subtract the equations — after scaling one if needed — so one variable cancels. Then substitute back.",
        when: "you have two linear equations in $x$ and $y$.", skills: ["a-sys"],
        ex: "Solve $3x + 2y = 16$ and $x - 2y = 0$.", walk: W([["4x = 16", "Add: $2y - 2y$ cancels."], ["x = 4,\\; y = 2", "Substitute back."]]) },
      { id: "parallel", t: "Compare slopes for \"how many solutions\"", rule: "Different slopes → one solution. Same slope, different intercept → none. Same line → infinitely many.",
        when: "the question asks how many solutions, or for a constant that makes it have none.", skills: ["a-sys", "a-lin1"],
        ex: "For what $k$ do $2x + 3y = 5$ and $4x + ky = 7$ have no solution?", walk: W([["4 = 2 \\times 2", "The $x$ coefficient doubled."], ["k = 2 \\times 3 = 6", "Double the $y$ coefficient too — same slope; $7 \\ne 10$, so parallel."]]) },
      { id: "flip", t: "Flip on negatives, round for the context", rule: "Solve inequalities like equations, but reverse the sign when multiplying or dividing by a negative. In context, round to the answer that still fits.",
        when: "an inequality has a negative coefficient, or the answer must be a whole number.", skills: ["a-ineq"],
        ex: "Solve $-5x + 2 > 17$.", walk: W([["-5x > 15", "Subtract 2."], ["x < -3", "Divide by $-5$ — flip."]]) }
    ]
  });
})();
