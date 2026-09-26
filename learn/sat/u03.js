/* ==========================================================================
   SAT Math — Domain 3: Problem-Solving and Data Analysis (about 15%).
   See lab/satkit.js for the item format, SAT.domain and the helpers.

   Six skills: ratios, rates and units; percentages; one-variable data;
   two-variable data and lines of best fit; probability from two-way tables;
   and what a sample or a study lets you conclude.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB, S = L && L.SAT;
  if (!S || !S.domain) return;
  var H = S.h, F = S.fig, c = H.c, x = H.x, w = H.w, tex = H.tex, W = H.walk, money = H.money, num = L.num;
  function frac(n, d) { return L.frac(n, d); }
  function fc(n, d, o) { return Object.assign({ t: "$" + frac(n, d) + "$", v: n / d }, o || {}); }

  /* =============================================== 1 · Ratios, rates, units */
  function ratioRecipe(R) {
    var S0 = R.pick([["flour", "sugar", "cups", "A recipe"], ["blue paint", "white paint", "liters", "A paint mix"], ["water", "concentrate", "cups", "A juice mix"]]);
    var a = R.int(2, 5), b = R.int(2, 7);
    while (H.gcd(a, b) !== 1 || a === b) b = R.int(2, 7);
    var k = R.int(2, 6), have = b * k, need = a * k;
    return {
      stem: S0[3] + " uses " + a + " " + S0[2] + " of " + S0[0] + " for every " + b + " " + S0[2] + " of " + S0[1] + ". How many " + S0[2] + " of " + S0[0] + " are needed for " + have + " " + S0[2] + " of " + S0[1] + "?",
      choices: [c(need, { ok: true }),
        fc(have * b, a, { err: "concept", tr: "set up the ratio upside down", why: "Keep the same thing on top on both sides: $\\frac{\\text{" + S0[0] + "}}{\\text{" + S0[1] + "}} = \\frac{" + a + "}{" + b + "} = \\frac{?}{" + have + "}$." }),
        c(have + (a - b) === need ? have + a : have + (a - b), { err: "concept", tr: "added the difference instead of scaling", why: "A ratio scales by multiplying: " + have + " is " + k + " times " + b + ", so multiply " + a + " by " + k + " too." }),
        c(have * a, { err: "calc", tr: "multiplied without dividing", why: "$" + have + " \\times " + a + "$ still has to be divided by " + b + "." })],
      hint: "How many times bigger is " + have + " than " + b + "?",
      strategy: "Write a proportion with the same quantity on top each side: $\\frac{" + a + "}{" + b + "} = \\frac{x}{" + have + "}$. Or scale: " + have + " is " + k + " × " + b + ".",
      walk: W([["\\frac{" + a + "}{" + b + "} = \\frac{x}{" + have + "}", "Same units in the same places."], ["x = \\frac{" + a + " \\times " + have + "}{" + b + "} = " + need, "Cross-multiply and divide."]]),
      concept: "A ratio compares two quantities; keeping it the same while scaling up means multiplying both parts by the same number.",
      rebuild: [{ q: have + " " + S0[2] + " of " + S0[1] + " is how many times " + b + "?", num: k, ok: k + " times the recipe." }, { q: "So the " + S0[0] + " is " + a + " times " + k + ":", num: need, ok: need + " " + S0[2] + "." }],
      autopsy: { trap: "Setting the proportion up upside down.", clue: "\"For every\" — a ratio.", remember: "Same quantity on top, both sides." }
    };
  }
  function ratioParts(R) {
    var a = R.int(2, 7), b = R.int(2, 9);
    while (H.gcd(a, b) !== 1 || a === b) b = R.int(2, 9);
    var k = R.int(3, 9), T = (a + b) * k, ask = R.chance(0.5);
    var right = ask ? b * k : a * k, other = ask ? a * k : b * k;
    var who = R.pick([["boys", "girls", "in a club"], ["fiction books", "nonfiction books", "on a library shelf"], ["red marbles", "blue marbles", "in a bag"]]);
    return {
      stem: "The ratio of " + who[0] + " to " + who[1] + " " + who[2] + " is $" + a + " : " + b + "$. There are " + T + " in total. How many " + (ask ? who[1] : who[0]) + " are there?",
      choices: [c(right, { ok: true }),
        c(other, { err: "misread", tr: "found the other part of the ratio", why: "That's the number of " + (ask ? who[0] : who[1]) + "." }),
        fc(T * (ask ? b : a), ask ? a : b, { err: "concept", tr: "treated the total as one of the parts", why: T + " is the total — both parts together, $" + a + " + " + b + " = " + (a + b) + "$ shares." }),
        c(T / (ask ? b : a) === right ? right + k : T / (ask ? b : a), { err: "concept", tr: "divided the total by one part of the ratio", why: "Divide the total by the number of shares, " + (a + b) + ", to find one share." })],
      hint: "How many equal shares does the ratio $" + a + " : " + b + "$ make altogether?",
      strategy: "A ratio $a : b$ splits the total into $a + b$ equal shares. One share $= \\frac{" + T + "}{" + (a + b) + "} = " + k + "$.",
      walk: W([[a + " + " + b + " = " + (a + b), "Shares in all."], ["\\frac{" + T + "}{" + (a + b) + "} = " + k, "One share."], [(ask ? b : a) + " \\times " + k + " = " + right, (ask ? who[1] : who[0]).charAt(0).toUpperCase() + (ask ? who[1] : who[0]).slice(1) + "."]]),
      concept: "A part-to-part ratio $a : b$ means $a + b$ shares make the whole.",
      rebuild: [{ q: "How many shares are there in total?", num: a + b, ok: (a + b) + " shares." }, { q: "How much is one share?", num: k, ok: "$" + T + " \\div " + (a + b) + " = " + k + "$." }, { q: "So the " + (ask ? who[1] : who[0]) + " are…", num: right, ok: right + "." }],
      autopsy: { trap: "Using the total as one part.", clue: "A ratio of two parts plus a total.", remember: "Total ÷ (sum of the ratio) = one share." }
    };
  }
  function ratioUnits(R, diff) {
    if (diff >= 3) {
      var ml = R.pick([2, 3, 4, 5]), per = R.pick([10, 15, 20, 30]);
      var perDay = ml / per * 86400, L0 = perDay / 1000;
      return {
        stem: "A faucet leaks " + ml + " milliliters of water every " + per + " seconds. At this rate, how many liters of water does the faucet leak in one day? (1 liter = 1,000 milliliters)",
        answer: L0, shown: String(H.round(L0, 2)), secs: 130,
        near: [{ v: perDay, tr: "left the answer in milliliters" }, { v: ml / per * 1440 / 1000, tr: "used minutes in a day instead of seconds" }],
        hint: "How many seconds are in a day? And how many milliliters in a liter?",
        strategy: "Chain conversion factors so the units cancel: $\\frac{" + ml + " \\text{ mL}}{" + per + " \\text{ s}} \\times \\frac{86{,}400 \\text{ s}}{1 \\text{ day}} \\times \\frac{1 \\text{ L}}{1{,}000 \\text{ mL}}$.".replace(/\{,\}/g, "\\text{,}"),
        walk: W([["\\frac{" + ml + "}{" + per + "} \\times 86\\text{,}400 = " + H.bigm(perDay), "Milliliters per day (86,400 seconds in a day)."], [H.bigm(perDay) + " \\div 1\\text{,}000 = " + num(L0), "Milliliters to liters."]]),
        concept: "Multiplying by a conversion factor like $\\frac{60 \\text{ s}}{1 \\text{ min}}$ is multiplying by 1 — the units change, the amount doesn't.",
        rebuild: [{ q: "How many seconds are in one day?", num: 86400, ok: "$24 \\times 60 \\times 60 = 86\\text{,}400$." }, { q: "How many milliliters leak in a day?", num: perDay, ok: H.commas(perDay) + " mL." }, { q: "In liters?", num: L0, tol: 0.01, ok: num(L0) + " L." }],
        autopsy: { hard: "Two conversions: seconds to days, and milliliters to liters.", clue: "Units in the rate differ from units in the question.", remember: "Chain factors until only the units you want are left." }
      };
    }
    var v = R.pick([5, 10, 15, 20, 25]), kmh = v * 3.6;
    return {
      stem: "An object moves at a constant speed of " + v + " meters per second. What is its speed in kilometers per hour? (1 kilometer = 1,000 meters)",
      choices: [c(kmh, { ok: true }),
        c(H.round(v / 3.6, 2), { err: "concept", tr: "used the conversion factors upside down", why: "Hours are longer than seconds, so the number per hour is bigger: multiply by 3,600 s/h, then divide by 1,000 m/km." }),
        c(v * 60 / 1000, { err: "formula", tr: "used 60 seconds in an hour", why: "An hour is $60 \\times 60 = 3\\text{,}600$ seconds." }),
        c(v * 3600, { err: "misread", tr: "left the answer in meters", why: "That's meters per hour. Divide by 1,000 for kilometers." })],
      hint: "How many seconds are in an hour?",
      strategy: "Chain the conversions so units cancel: $\\frac{" + v + " \\text{ m}}{1 \\text{ s}} \\times \\frac{3\\text{,}600 \\text{ s}}{1 \\text{ h}} \\times \\frac{1 \\text{ km}}{1\\text{,}000 \\text{ m}}$.",
      walk: W([[v + " \\times 3\\text{,}600 = " + H.bigm(v * 3600), "Meters per hour."], [H.bigm(v * 3600) + " \\div 1\\text{,}000 = " + num(kmh), "Kilometers per hour."]]),
      concept: "Unit conversion is multiplying by 1 in a clever form; write the units and let them cancel.",
      rebuild: [{ q: "How many seconds in an hour?", num: 3600, ok: "3,600." }, { q: "Meters per hour?", num: v * 3600, ok: H.commas(v * 3600) + " m/h." }, { q: "Kilometers per hour?", num: kmh, ok: num(kmh) + " km/h." }],
      autopsy: { clue: "Two units change: meters→km and seconds→hours.", remember: "Write units on every factor; cancel them." }
    };
  }
  var RATIO = {
    id: "d-ratio", t: "Ratios, rates & units", short: "Ratios & rates", kind: "Ratio, rate or unit conversion",
    blurb: "Scale recipes and mixtures, split totals by a ratio, and convert units by letting them cancel.",
    forms: ["word", "model", "twist"],
    school: { course: "alg", unit: 3, t: "Algebra I, Unit 3: Working with units" },
    autopsy: { testing: "Ratios, rates and unit conversions", clue: "\"For every\", \"per\", a ratio $a : b$, or two different units.", remember: "Same units in the same places; let units cancel.", spotQ: "Is each of these a ratio or rate question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "A car uses 3 gallons every 90 miles. How many gallons for 240 miles?", yes: true, why: "A rate — set up a proportion." },
        { t: "Convert 72 km/h to meters per second.", yes: true, why: "Unit conversion with a chain of factors." },
        { t: "A price rose from \\$40 to \\$50. By what percent?", yes: false, why: "That's a percent change." }]);
    },
    lesson: [
      { type: "learn", kicker: "Same thing on top",
        prompt: "A proportion keeps a ratio the same while scaling. The rule that prevents every mistake: **same quantity in the same place** on both sides.",
        scene: { type: "walk", rows: [
          { m: "\\frac{3 \\text{ flour}}{2 \\text{ sugar}} = \\frac{x \\text{ flour}}{10 \\text{ sugar}}", say: "Flour on top both sides." },
          { m: "10 = 2 \\times 5", say: "The sugar is 5 times as much…" }, { m: "x = 3 \\times 5 = 15", say: "…so the flour is too." }] }, gate: true },
      { type: "learn", kicker: "Let the units cancel",
        prompt: "To convert units, multiply by fractions equal to 1 and cancel units like numbers.",
        scene: { type: "units", start: [20, "m", "s"], target: ["km", "h"], factors: [[1, "km", 1000, "m"], [3600, "s", 1, "h"], [60, "s", 1, "min"]] },
        gate: true, then: "$\\frac{20 \\text{ m}}{1 \\text{ s}} \\times \\frac{3600 \\text{ s}}{1 \\text{ h}} \\times \\frac{1 \\text{ km}}{1000 \\text{ m}} = 72 \\text{ km/h}$. Each factor is worth 1, so the speed never changed — only its units." },
      { type: "num", prompt: "A ratio of red to blue marbles is $2 : 5$, and there are 42 marbles in all. How many are blue?", answer: 30,
        near: [{ v: 12, fb: "That's the red ones." }, { v: 105, fb: "42 is the total, not the red part: $2 + 5 = 7$ shares." }], hints: ["$2 + 5 = 7$ shares.", "One share is $42 \\div 7 = 6$."], why: "$42 \\div 7 = 6$ per share; blue is $5 \\times 6 = 30$." }
    ],
    gen: function (R, o) {
      if (o.form === "model") return ratioUnits(R, o.diff);
      if (o.form === "twist") return ratioParts(R);
      return o.diff >= 3 ? ratioUnits(R, 3) : o.diff === 2 ? ratioParts(R) : ratioRecipe(R);
    }
  };

  /* ====================================================== 2 · Percentages */
  function pctSale(R) {
    var P = R.pick([40, 60, 80, 120, 160, 240]), p = R.pick([10, 15, 20, 25, 30, 40]), off = P * p / 100, sale = P - off;
    return {
      stem: "A jacket normally costs " + money(P) + ". During a sale, its price is reduced by " + p + "%. What is the sale price?",
      choices: [H.c(sale, { ok: true, t: "$\\$" + num(sale) + "$" }),
        H.c(off, { t: "$\\$" + num(off) + "$", err: "misread", tr: "gave the discount, not the new price", why: "That's how much is taken off. The sale price is what's left." }),
        H.c(P - p, { t: "$\\$" + num(P - p) + "$", err: "concept", tr: "subtracted the percent as dollars", why: p + "% of " + money(P) + " is " + money(off) + ", not " + money(p) + "." }),
        H.c(P + off, { t: "$\\$" + num(P + off) + "$", err: "misread", tr: "increased instead of decreasing", why: "A reduction makes the price smaller." })],
      hint: "What percent of the price is left after the sale?",
      strategy: "A " + p + "% decrease leaves " + (100 - p) + "%: multiply by $" + num(1 - p / 100) + "$ in one step.",
      walk: W([[num(P) + " \\times " + num(1 - p / 100) + " = " + num(sale), "Keep " + (100 - p) + "%."]]),
      concept: "Decreasing by $p\\%$ multiplies by $1 - \\frac{p}{100}$; increasing multiplies by $1 + \\frac{p}{100}$.",
      rebuild: [{ q: "What is " + p + "% of " + money(P) + "?", num: off, ok: money(off) + " off." }, { q: "So the sale price is…", num: sale, ok: money(sale) + "." }],
      autopsy: { trap: "Answering with the discount.", clue: "\"Sale price\" — what's left.", remember: "Decrease by $p\\%$ → multiply by $1 - p/100$." }
    };
  }
  function pctChange(R) {
    var old = R.pick([20, 25, 40, 50, 60, 80]), p = R.pick([10, 15, 20, 25, 30, 35, 40, 60]), up = R.chance(0.6);
    var nw = old * (1 + (up ? p : -p) / 100), d = Math.abs(nw - old);
    return {
      stem: "The price of a ticket " + (up ? "rose" : "fell") + " from " + money(old) + " to " + money(nw) + ". By what percent did the price " + (up ? "increase" : "decrease") + "?",
      answer: p, shown: String(p), post: "%",
      near: [{ v: H.round(d / nw * 100, 2), tr: "divided by the new price instead of the original" }, { v: d, tr: "gave the change in dollars" }],
      hint: "Percent change compares the change with the ORIGINAL amount.",
      strategy: "Percent change $= \\frac{\\text{new} - \\text{original}}{\\text{original}} \\times 100$.",
      walk: W([[num(nw) + " - " + num(old) + " = " + num(nw - old), "The change."], ["\\frac{" + num(d) + "}{" + num(old) + "} \\times 100 = " + p, "Divide by the original."]]),
      concept: "A percent change is always measured against where you started.",
      rebuild: [{ q: "How much did the price change, in dollars?", num: d, ok: money(d) + "." }, { q: "What percent of the original " + money(old) + " is that?", num: p, ok: p + "%." }],
      autopsy: { trap: "Dividing by the new amount.", clue: "\"From … to …\": the first number is the original.", remember: "Change ÷ original." }
    };
  }
  function pctReverse(R) {
    var orig = R.pick([40, 50, 60, 75, 80, 120, 150]), p = R.pick([10, 20, 25, 40]), sale = orig * (1 - p / 100);
    return {
      stem: "After a " + p + "% discount, a pair of shoes costs " + money(sale) + ". What was the price before the discount?",
      choices: [H.c(orig, { ok: true, t: "$\\$" + num(orig) + "$" }),
        H.c(H.round(sale * (1 + p / 100), 2), { t: "$\\$" + num(H.round(sale * (1 + p / 100), 2)) + "$", err: "concept", tr: "added the percent back to the sale price", why: p + "% of the sale price isn't " + p + "% of the original. The sale price is " + (100 - p) + "% of the original: divide by " + num(1 - p / 100) + "." }),
        H.c(sale + p, { t: "$\\$" + num(sale + p) + "$", err: "concept", tr: "added the percent as dollars", why: "The discount was " + p + "% of the original price, not " + money(p) + "." }),
        H.c(H.round(sale * (1 - p / 100), 2), { t: "$\\$" + num(H.round(sale * (1 - p / 100), 2)) + "$", err: "misread", tr: "applied the discount again", why: "The discount has already been taken. Work backwards." })],
      hint: "The sale price is what percent of the original?",
      strategy: "Sale price $= " + num(1 - p / 100) + " \\times$ original, so original $= \\frac{\\text{sale price}}{" + num(1 - p / 100) + "}$.",
      walk: W([[num(1 - p / 100) + "x = " + num(sale), "The sale price is " + (100 - p) + "% of the original."], ["x = " + num(orig), "Divide by " + num(1 - p / 100) + "."]]),
      concept: "Undoing a percent change means dividing by the multiplier, not adding the percent back.",
      rebuild: [{ q: "The sale price is what percent of the original?", num: 100 - p, ok: (100 - p) + "%." }, { q: "So $" + num(1 - p / 100) + " \\times \\text{original} = " + num(sale) + "$. The original is…", num: orig, ok: money(orig) + "." }],
      autopsy: { hard: "Working backwards from the result of a percent change.", trap: "Adding " + p + "% of the sale price back.", clue: "\"After a discount … what was the price before?\"", remember: "Divide by the multiplier to undo it." }
    };
  }
  function pctChain(R) {
    var p = R.pick([10, 20, 25, 50]), up = R.chance(0.5), net = (1 + p / 100) * (1 - p / 100);
    if (R.chance(0.5)) {
      var a = R.pick([120, 125, 150, 160, 200]), b = R.pick([20, 25, 40, 50, 60, 80]), ans = a * b / 100;
      return {
        stem: "The number $p$ is " + a + "% of $q$, and $q$ is " + b + "% of $r$. The number $p$ is what percent of $r$?",
        answer: ans, shown: num(ans), post: "%",
        near: [{ v: a + b, tr: "added the percents" }, { v: a - b, tr: "subtracted the percents" }],
        hint: "Write each statement as a multiplication.",
        strategy: "$p = " + num(a / 100) + "q$ and $q = " + num(b / 100) + "r$, so $p = " + num(a / 100) + " \\times " + num(b / 100) + "r$.",
        walk: W([["p = " + num(a / 100) + "q", a + "% of $q$."], ["q = " + num(b / 100) + "r", b + "% of $r$."], ["p = " + num(a / 100) + "(" + num(b / 100) + "r) = " + num(ans / 100) + "r", "Substitute."], [num(ans) + "\\%", "As a percent."]]),
        concept: "\"Percent of\" is multiplication. Chained percents multiply, they don't add.",
        rebuild: [{ q: "As a decimal, " + a + "% is…", num: a / 100, ok: "$p = " + num(a / 100) + "q$." }, { q: "Multiply " + num(a / 100) + " by " + num(b / 100) + ":", num: a * b / 10000, tol: 1e-6, ok: "So $p = " + num(a * b / 10000) + "r$ — " + num(ans) + "%." }],
        autopsy: { trap: "Adding percents.", clue: "Two \"percent of\" statements chained.", remember: "Percents of percents multiply." }
      };
    }
    var lab = up ? "increased by " + p + "% and then decreased by " + p + "%" : "decreased by " + p + "% and then increased by " + p + "%";
    var d = Math.round((1 - net) * 10000) / 100;
    return {
      stem: "The price of an item is " + lab + ". What is the overall effect on the original price?",
      choices: [w("It decreases by " + num(d) + "%.", { ok: true }),
        w("It doesn't change.", { err: "concept", tr: "thought equal percents cancel", why: "The second " + p + "% is taken of a different amount. Try it with \\$100: " + (up ? "\\$" + (100 + p) + " then minus " + num((100 + p) * p / 100) : "\\$" + (100 - p) + " then plus " + num((100 - p) * p / 100)) + " = \\$" + num(net * 100) + "." }),
        w("It increases by " + num(d) + "%.", { err: "calc", tr: "got the direction wrong", why: "The multipliers give $" + num(1 + p / 100) + " \\times " + num(1 - p / 100) + " = " + num(net) + "$ — less than 1." }),
        w("It decreases by " + (2 * p) + "%.", { err: "concept", tr: "added the percents", why: "Percent changes multiply: $" + num(1 + p / 100) + " \\times " + num(1 - p / 100) + " = " + num(net) + "$." })],
      hint: "Try it with a price of \\$100.",
      strategy: "Multiply the multipliers: $" + num(1 + p / 100) + " \\times " + num(1 - p / 100) + " = " + num(net) + "$ → a " + num(d) + "% decrease. Or test \\$100.",
      walk: W([[num(1 + p / 100) + " \\times " + num(1 - p / 100) + " = " + num(net), "Each change is a multiplier."], ["1 - " + num(net) + " = " + num(1 - net), "Less than 1: a decrease of " + num(d) + "%."]]),
      concept: "Successive percent changes multiply. Equal percents up and down never cancel: the second one acts on a different amount.",
      rebuild: [{ q: "Start at \\$100. After the first change, the price is…", num: up ? 100 + p : 100 - p, ok: "Now the second change acts on this." }, { q: "After the second change, the price is…", num: net * 100, ok: "From \\$100 to \\$" + num(net * 100) + ": a " + num(d) + "% decrease." }],
      autopsy: { trap: "Thinking the changes cancel.", clue: "Two percent changes in a row.", remember: "Multiply the multipliers — or test with 100." }
    };
  }
  var PCT = {
    id: "d-pct", t: "Percentages", short: "Percentages", kind: "Percent or percent change",
    blurb: "Discounts, increases, percent change from the original, working backwards, and why +20% then −20% isn't zero.",
    forms: ["word", "model", "twist"],
    school: { course: "alg", unit: 12, t: "Algebra I, Unit 12: Exponential growth & decay" },
    autopsy: { testing: "Percentages and percent change", clue: "A percent, or \"by what percent\".", remember: "Change ÷ original; multiply by $1 \\pm p$.", spotQ: "Is each of these a percent question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "A town grew from 8,000 to 9,200 people. By what percent?", yes: true, why: "Percent change: $1{,}200 \\div 8{,}000$.".replace(/\{,\}/g, "\\text{,}") },
        { t: "After a 30% raise, a salary is \\$52,000. What was it before?", yes: true, why: "Reverse percent: divide by 1.3." },
        { t: "The ratio of cats to dogs is 3 : 4. There are 28 pets.", yes: false, why: "A ratio question." }]);
    },
    lesson: [
      { type: "learn", kicker: "Percent as a multiplier",
        prompt: "The fastest way through every percent question: turn the change into **one multiplication**.",
        scene: { type: "walk", rows: [
          { m: "+15\\% \\to \\times 1.15", say: "Keep 100%, add 15%." }, { m: "-15\\% \\to \\times 0.85", say: "Keep 85%." },
          { m: "80 \\times 0.85 = 68", say: "An \\$80 item at 15% off." }, { m: "68 \\div 0.85 = 80", say: "And back again — divide by the multiplier." }] }, gate: true },
      { type: "learn", kicker: "Change from where you started",
        prompt: "Percent change always divides by the **original**.",
        scene: { type: "walk", rows: [
          { m: "40 \\to 50", say: "A price rises." }, { m: "\\frac{10}{40} = 25\\%", say: "Up 25% — divide by the original, 40." },
          { m: "50 \\to 40: \\frac{10}{50} = 20\\%", say: "Back down is only 20%: a different original." }] }, gate: true },
      { type: "choice", prompt: "A price increases by 10%, then decreases by 10%. The final price is…",
        options: [{ t: "1% less than the original" }, { t: "The same as the original", fb: "Try \\$100: \\$110, then 10% of \\$110 = \\$11 off → \\$99." }, { t: "1% more than the original", fb: "$1.1 \\times 0.9 = 0.99$ — less than 1." }, { t: "20% less than the original", fb: "Percent changes multiply, they don't add." }],
        answer: 0, hints: ["Try it with \\$100."], why: "$1.1 \\times 0.9 = 0.99$: 1% less." }
    ],
    gen: function (R, o) {
      if (o.form === "model") return o.diff >= 2 ? pctReverse(R) : pctSale(R);
      if (o.form === "twist") return pctChain(R);
      return o.diff === 1 ? pctSale(R) : o.diff === 2 ? pctChange(R) : pctReverse(R);
    }
  };

  /* ================================================== 3 · One-variable data */
  function stats(vals) {
    var s = vals.slice().sort(function (a, b) { return a - b; }), n = s.length, sum = s.reduce(function (a, b) { return a + b; }, 0);
    var med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    var cnt = {}, mode = null, best = 0;
    s.forEach(function (v) { cnt[v] = (cnt[v] || 0) + 1; if (cnt[v] > best) { best = cnt[v]; mode = v; } });
    var tie = Object.keys(cnt).filter(function (k) { return cnt[k] === best; }).length > 1;
    return { s: s, n: n, sum: sum, mean: sum / n, med: med, mode: tie ? null : mode, range: s[n - 1] - s[0] };
  }
  function dataDot(R, diff) {
    var lo = R.int(0, 3), hi = lo + R.int(5, 7), n = R.pick([11, 13, 15, 17]), vals = [];
    var peak = R.int(lo + 1, hi - 2);
    for (var i = 0; i < n; i++) { var v = Math.round(peak + (R.next() + R.next() + R.next() - 1.5) * 2.2); vals.push(Math.max(lo, Math.min(hi, v))); }
    var st = stats(vals), askMed = diff === 1 || R.chance(0.5);
    var right = askMed ? st.med : H.round(st.mean, 2);
    var what = R.pick([["books read last month", "Books read"], ["siblings", "Number of siblings"], ["goals scored in a season", "Goals"]]);
    var cands = [c(right, { ok: true }),
      c(askMed ? H.round(st.mean, 2) : st.med, { err: "concept", tr: askMed ? "gave the mean instead of the median" : "gave the median instead of the mean", why: askMed ? "The median is the middle value when the data are in order — not the average." : "The mean is the total divided by the number of values." }),
      st.mode != null ? c(st.mode, { err: "concept", tr: "gave the mode", why: "The mode is the most common value — the tallest stack." }) : null,
      c((lo + hi) / 2, { err: "graph", tr: "took the middle of the axis, not of the data", why: "The middle of the number line isn't the middle of the data. Count the dots." }),
      c(st.range, { err: "concept", tr: "gave the range", why: "The range is the largest minus the smallest value." })];
    var ok = cands[0];
    return {
      stem: "The dot plot shows the number of " + what[0] + (what[0] === "siblings" ? " each of " + n + " students has." : " by each of " + n + " students.") + " What is the " + (askMed ? "median" : "mean") + " of the data?" + (askMed ? "" : " (Round to the nearest hundredth if needed.)"),
      fig: F.dots({ vals: vals, x: [lo, hi], xl: what[1] }),
      choices: [ok].concat(H.distinct(ok, cands.slice(1).filter(Boolean), 3)),
      hint: askMed ? "With " + n + " values in order, which position is the middle?" : "Add up all the values (each dot is one value), then divide by " + n + ".",
      strategy: askMed ? "Count dots from the left until you reach the " + ((n + 1) / 2) + "th one — that value is the median." : "Mean $=$ (sum of all values) $\\div$ (number of values). Multiply each value by its number of dots to add quickly.",
      walk: askMed ? W([["n = " + n, "Values in all."], ["\\frac{" + n + " + 1}{2} = " + ((n + 1) / 2), "The middle position."], ["\\text{median} = " + st.med, "Count along the dots."]])
        : W([["\\text{sum} = " + st.sum, "Each dot's value, added up."], ["\\frac{" + st.sum + "}{" + n + "} = " + num(H.round(st.mean, 2)), "Divide by the number of values."]]),
      concept: "The median is the middle of the ordered data; the mean is the balance point — total shared equally.",
      rebuild: askMed ? [{ q: "How many values are there?", num: n, ok: n + " dots." }, { q: "Which position is the middle one?", num: (n + 1) / 2, ok: "The " + ((n + 1) / 2) + "th value." }, { q: "Counting from the left, what value is it?", num: st.med, ok: "Median $= " + st.med + "$." }]
        : [{ q: "What is the sum of all " + n + " values?", num: st.sum, ok: "Total $= " + st.sum + "$." }, { q: "Divided by " + n + ", the mean is…", num: st.mean, tol: 0.01, ok: "About " + num(H.round(st.mean, 2)) + "." }],
      autopsy: { trap: askMed ? "Mixing up median and mean — or taking the middle of the axis." : "Forgetting that a stack of dots is several values.", clue: askMed ? "\"Median\" → the middle position." : "\"Mean\" → total ÷ count.", remember: "Median: order, find the middle. Mean: total ÷ count." }
    };
  }
  function dataMissing(R) {
    var n = R.int(4, 6), mean = R.int(10, 30), vals = [];
    for (var i = 0; i < n - 1; i++) vals.push(mean + R.int(-8, 8));
    var last = mean * n - vals.reduce(function (a, b) { return a + b; }, 0);
    if (last < 0) return dataMissing(R);
    return {
      stem: "The mean of " + ["", "", "", "", "four", "five", "six"][n] + " numbers is " + mean + ". " + ["", "", "", "Three", "Four", "Five"][n - 1] + " of the numbers are " + vals.slice(0, -1).join(", ") + " and " + vals[vals.length - 1] + ". What is the remaining number?",
      answer: last, shown: String(last),
      near: [{ v: mean, tr: "assumed the missing number equals the mean" }],
      hint: "If the mean of " + n + " numbers is " + mean + ", what is their total?",
      strategy: "Total $=$ mean $\\times$ count $= " + (mean * n) + "$. Subtract the numbers you know.",
      walk: W([[mean + " \\times " + n + " = " + (mean * n), "The total."], [(mean * n) + " - " + vals.reduce(function (a, b) { return a + b; }, 0) + " = " + last, "Take away the known ones."]]),
      concept: "A mean is a total shared equally: total $=$ mean $\\times$ number of values.",
      rebuild: [{ q: "What is the total of all " + n + " numbers?", num: mean * n, ok: "Mean × count." }, { q: "What do the " + (n - 1) + " known numbers add to?", num: vals.reduce(function (a, b) { return a + b; }, 0), ok: "So the missing one is the difference." }, { q: "The remaining number is…", num: last, ok: last + "." }],
      autopsy: { clue: "Mean and count given → the total.", remember: "Total = mean × count." }
    };
  }
  function dataOutlier(R) {
    var n = R.pick([7, 9]), base = R.int(10, 30), vals = [];
    for (var i = 0; i < n; i++) vals.push(base + R.int(-6, 6));
    vals.sort(function (a, b) { return a - b; });
    var big = vals[n - 1] + R.int(30, 60);
    var st = stats(vals);
    return {
      stem: "A data set has " + n + " values: $" + vals.join(",\\ ") + "$. The largest value, " + vals[n - 1] + ", is replaced by " + big + ". Which statement about the new data set is true?",
      choices: [w("The mean increases and the median stays the same.", { ok: true }),
        w("The mean and the median both increase.", { err: "concept", tr: "thought the median moves with an extreme value", why: "The median is the middle value. Changing the largest value doesn't change which value is in the middle — it's still " + st.med + "." }),
        w("The median increases and the mean stays the same.", { err: "concept", tr: "swapped how the mean and median respond", why: "The mean uses every value, so a bigger value raises it. The median only looks at the middle." }),
        w("Neither the mean nor the median changes.", { err: "concept", tr: "thought the mean ignores one value", why: "The total goes up by " + (big - vals[n - 1]) + ", so the mean goes up by $\\frac{" + (big - vals[n - 1]) + "}{" + n + "}$." })],
      order: "keep",
      hint: "Which of the two uses every value? Which only uses the middle?",
      strategy: "The mean is pulled by extreme values; the median resists them.",
      walk: W([["\\text{total rises by } " + (big - vals[n - 1]), "So the mean rises."], ["\\text{middle value still } " + st.med, "The order in the middle is unchanged: same median."]]),
      concept: "Outliers pull the mean toward them; the median is resistant. That's why income is usually reported as a median.",
      rebuild: [{ q: "Does replacing the largest value change the total?", opts: ["Yes — it rises", "No"], a: 0, ok: "So the mean rises." }, { q: "Is the middle value still the same number?", opts: ["Yes", "No"], a: 0, ok: "So the median doesn't change." }],
      autopsy: { clue: "An extreme value changes.", remember: "Mean moves with outliers; median barely does." }
    };
  }
  function dataSpread(R) {
    var m = R.int(8, 14), dA = [-1, -1, 0, 0, 0, 1, 1], dB = [-4, -3, -1, 0, 1, 3, 4];
    var A = dA.map(function (d) { return m + d; }), B = dB.map(function (d) { return m + d; });
    var aFirst = R.chance(0.5), P = aFirst ? A : B, Q = aFirst ? B : A;
    var narrow = aFirst ? "Data set A" : "Data set B";
    return {
      stem: "Data set A: $" + P.join(",\\ ") + "$<br>Data set B: $" + Q.join(",\\ ") + "$<br>Which statement compares the standard deviations of the two data sets?",
      choices: [w("The standard deviation of " + (aFirst ? "A" : "B") + " is less than that of " + (aFirst ? "B" : "A") + ".", { ok: true }),
        w("The standard deviation of " + (aFirst ? "B" : "A") + " is less than that of " + (aFirst ? "A" : "B") + ".", { err: "concept", tr: "read spread backwards", why: "Standard deviation measures spread. The values in " + narrow + " are packed close to " + m + "." }),
        w("The standard deviations are equal, because the means are equal.", { err: "concept", tr: "thought equal means give equal spread", why: "Both means are " + m + ", but one set is much more spread out around it." }),
        w("There isn't enough information to compare them.", { err: "concept", tr: "thought the calculation was needed", why: "You don't need to calculate: look at how far the values sit from the mean." })],
      order: "keep",
      hint: "Which data set's values are closer to their mean?",
      strategy: "Standard deviation is (roughly) the typical distance from the mean. Tightly clustered → small; spread out → large. No calculation needed.",
      walk: W([["\\bar{x}_A = \\bar{x}_B = " + m, "Same mean."], ["\\text{A: within 1 of } " + m, "A is clustered."], ["\\text{B: up to 4 away}", "B is spread out: bigger standard deviation."]]),
      concept: "Standard deviation measures spread around the mean. The SAT almost never asks you to calculate it — only to compare.",
      rebuild: [{ q: "What is the mean of each data set?", num: m, ok: "Both $" + m + "$." }, { q: "Whose values are farther from " + m + "?", opts: ["Data set " + (aFirst ? "B" : "A"), "Data set " + (aFirst ? "A" : "B")], a: 0, ok: "More spread → larger standard deviation." }],
      autopsy: { hard: "It sounds like a big calculation.", clue: "\"Compare the standard deviations\" — compare spread by eye.", remember: "Standard deviation = spread. Compare, don't compute." }
    };
  }
  var ONEVAR = {
    id: "d-onevar", t: "One-variable data", short: "Mean, median, spread", kind: "Center and spread of data",
    blurb: "Mean, median, mode and range from dot plots and lists, missing values, outliers, and comparing spread without calculating.",
    forms: ["graph", "word", "twist"],
    school: { course: "g8", unit: 7, t: "8th Grade Math, Unit 7: Data and modeling" },
    autopsy: { testing: "Measures of center and spread", clue: "Mean, median, range or standard deviation of a data set.", remember: "Median: middle of the ordered data. Mean: total ÷ count. SD: spread.", spotQ: "Is each of these about center or spread?" },
    spot: function (R) {
      return R.shuffle([
        { t: "What is the median of the values in this histogram?", yes: true, why: "Center of a data set." },
        { t: "Which class's test scores have the larger standard deviation?", yes: true, why: "Spread." },
        { t: "According to the line of best fit, predict $y$ at $x = 12$.", yes: false, why: "Two-variable data — a model." }]);
    },
    lesson: [
      { type: "learn", kicker: "Three centers",
        prompt: "Three ways to say \"typical\":",
        scene: { type: "walk", rows: [
          { m: "2,\\ 3,\\ 3,\\ 5,\\ 12", say: "A small data set, in order." },
          { m: "\\text{median} = 3", say: "The **middle** value." }, { m: "\\text{mean} = \\frac{25}{5} = 5", say: "The **total shared equally**." },
          { m: "\\text{mode} = 3", say: "The **most common** value." },
          { m: "12 \\to 52: \\text{mean } 13,\\ \\text{median still } 3", say: "An outlier drags the mean; the median doesn't budge." }] }, gate: true },
      { type: "learn", kicker: "Spread without the formula",
        prompt: "Standard deviation measures how far values typically sit from the mean. On the SAT you **compare** it — you almost never calculate it.",
        scene: { type: "walk", rows: [
          { m: "9,\\ 10,\\ 10,\\ 10,\\ 11", say: "Tightly packed around 10: small standard deviation." },
          { m: "4,\\ 7,\\ 10,\\ 13,\\ 16", say: "Same mean, much more spread: larger standard deviation." }] }, gate: true },
      { type: "num", prompt: "The mean of 5 test scores is 82. Four of them are 78, 85, 90 and 74. What is the fifth score?", answer: 83,
        near: [{ v: 82, fb: "The missing score doesn't have to equal the mean. Find the total first." }], hints: ["Total $= 82 \\times 5 = 410$."], why: "$410 - (78 + 85 + 90 + 74) = 410 - 327 = 83$." }
    ],
    gen: function (R, o) {
      if (o.form === "graph") return dataDot(R, o.diff);
      if (o.form === "twist") return o.diff >= 2 ? dataSpread(R) : dataOutlier(R);
      return o.diff === 1 ? dataMissing(R) : o.diff === 2 ? dataOutlier(R) : dataSpread(R);
    }
  };

  /* ============================================== 4 · Two-variable data */
  function scatterSet(R) {
    var m = R.pick([1.5, 2, 2.5, 3, 4, 5]), b = R.int(5, 30), xs = [], pts = [];
    for (var i = 1; i <= 10; i++) { var xx = i + (R.next() < 0.3 ? 0.5 : 0); var yy = Math.round((m * xx + b + (R.next() - 0.5) * m * 3) * 2) / 2; xs.push(xx); pts.push([xx, yy]); }
    return { m: m, b: b, pts: pts };
  }
  function twoPredict(R) {
    var D = scatterSet(R), k = R.pick([3, 5, 6, 7]), pred = D.m * k + D.b;
    var ctx = R.pick([["Weeks since planting", "Plant height (cm)", "weeks since planting", "plant height, in centimeters,"], ["Age of tree (years)", "Height (feet)", "age of a tree, in years,", "height, in feet,"], ["Hours of practice", "Points scored", "hours of practice", "points scored"]]);
    var near = D.pts.filter(function (p) { return p[0] === k; })[0];
    var yMax = Math.ceil((D.m * 11 + D.b + D.m * 2) / 10) * 10;
    return {
      stem: "The scatterplot shows data for 10 values of " + ctx[2] + " and " + ctx[3] + ", and a line of best fit with equation $y = " + num(D.m) + "x + " + D.b + "$. According to the line of best fit, what is the predicted " + ctx[3] + " when the " + ctx[2] + " is " + k + "?",
      fig: F.scatter({ x: [0, 11], y: [0, yMax], xs: 1, pts: D.pts, line: { m: D.m, b: D.b }, xl: ctx[0], yl: ctx[1] }),
      choices: (function () {
        var ok = c(pred, { ok: true });
        return [ok].concat(H.distinct(ok, [
          near && near[1] !== pred ? c(near[1], { err: "graph", tr: "used a data point instead of the line", why: "The question asks what the **line** predicts, not what the actual data point shows." }) : null,
          c(D.m * k, { err: "calc", tr: "left out the intercept", why: "The prediction is $" + num(D.m) + "(" + k + ") + " + D.b + "$." }),
          c(H.round((k - D.b) / D.m, 2), { err: "misread", tr: "solved for x instead of predicting y", why: "Put " + k + " in for $x$; don't set $y$ equal to it." }),
          c(D.m + D.b * k, { err: "calc", tr: "swapped the slope and intercept", why: "The slope multiplies $x$." }),
          c(pred + D.m, { err: "calc", tr: "an arithmetic slip", why: "Recheck $" + num(D.m) + " \\times " + k + "$." })].filter(Boolean), 3));
      })(),
      hint: "Put " + k + " into the line's equation.",
      strategy: "A line of best fit predicts: substitute the $x$-value into its equation. Don't read a single dot.",
      walk: W([["y = " + num(D.m) + "(" + k + ") + " + D.b, "Substitute."], ["y = " + num(pred), "The predicted value."]]),
      concept: "A line of best fit models the trend; its values are **predictions**, which individual data points can miss.",
      rebuild: [{ q: "What is $" + num(D.m) + " \\times " + k + "$?", num: D.m * k, ok: "Now add the intercept." }, { q: "Predicted " + ctx[3] + ":", num: pred, ok: num(pred) + "." }],
      autopsy: { trap: "Reading a data point instead of the line.", clue: "\"According to the line of best fit\".", remember: "Predictions come from the line." }
    };
  }
  function twoSlope(R) {
    var m = R.pick([0.5, 1.2, 2.5, 3.5, 12, 15]), b = R.int(10, 40), unit = m >= 10 ? ["Months since opening", "Members", "month", "members"] : ["Hours of practice", "Free throws made (of 50)", "hour of practice", "free throws made"];
    return {
      stem: "A line of best fit for a set of data is $y = " + num(m) + "x + " + b + "$, where $x$ is the number of " + unit[0].toLowerCase().replace(/ \(.*\)/, "") + " and $y$ is the number of " + unit[3] + ". Which is the best interpretation of $" + num(m) + "$ in this context?",
      choices: [w("For each additional " + unit[2] + ", the predicted number of " + unit[3] + " increases by " + num(m) + ".", { ok: true }),
        w("For each additional " + unit[2] + ", the number of " + unit[3] + " increases by exactly " + num(m) + ".", { err: "concept", tr: "treated a prediction as exact", why: "A line of best fit gives **predicted** values; the real data scatter around it." }),
        w("The predicted number of " + unit[3] + " at the start is " + num(m) + ".", { err: "concept", tr: "confused the slope with the intercept", why: "The value at $x = 0$ is the intercept, " + b + "." }),
        w("The predicted number of " + unit[3] + " increases by " + b + " for each " + unit[2] + ".", { err: "concept", tr: "used the intercept as the rate", why: b + " is the starting value; " + num(m) + " is the change per " + unit[2] + "." })],
      hint: "What does the slope of a line measure?",
      strategy: "Slope = predicted change in $y$ per 1 unit of $x$. Look for the word \"predicted\" or \"estimated\" — a line of best fit doesn't promise exact values.",
      walk: W([["y = " + num(m) + "x + " + b, "Slope " + num(m) + ", intercept " + b + "."], ["\\Delta y = " + num(m) + " \\text{ per } \\Delta x = 1", "Each extra " + unit[2] + " adds " + num(m) + " to the prediction."]]),
      concept: "In a model of data, the slope is the predicted change per unit — an average trend, not a guarantee for every data point.",
      rebuild: [{ q: "The slope is the change in $y$ for each 1 added to $x$. Here that's…", num: m, ok: num(m) + " " + unit[3] + " per " + unit[2] + "." }, { q: "Is it an exact or a predicted change?", opts: ["Predicted", "Exact"], a: 0, ok: "The line models a trend." }],
      autopsy: { trap: "\"Exactly\" — a line of best fit only predicts.", clue: "\"Best interpretation\" of a coefficient in a line of best fit.", remember: "Slope = predicted change per unit." }
    };
  }
  function twoResidual(R) {
    var D = scatterSet(R), p = D.pts[R.int(2, 8)], pred = D.m * p[0] + D.b, res = H.round(p[1] - pred, 2);
    return {
      stem: "A line of best fit for a data set is $y = " + num(D.m) + "x + " + D.b + "$. One of the data points is $(" + num(p[0]) + ", " + num(p[1]) + ")$. What is the actual $y$-value minus the $y$-value predicted by the line for this point?",
      answer: res, shown: num(res), secs: 110,
      near: [{ v: -res, tr: "subtracted in the wrong order" }, { v: pred, tr: "gave the predicted value" }],
      hint: "What does the line predict at $x = " + num(p[0]) + "$?",
      strategy: "Residual $=$ actual $-$ predicted. A positive residual means the point is above the line.",
      walk: W([["\\hat{y} = " + num(D.m) + "(" + num(p[0]) + ") + " + D.b + " = " + num(pred), "Predicted."], [num(p[1]) + " - " + num(pred) + " = " + num(res), "Actual minus predicted."]]),
      concept: "A residual measures how far a real point is from the model: above the line → positive; below → negative.",
      rebuild: [{ q: "Predicted $y$ at $x = " + num(p[0]) + "$:", num: pred, tol: 0.01, ok: num(pred) + "." }, { q: "Actual minus predicted:", num: res, tol: 0.01, ok: num(res) + "." }],
      autopsy: { clue: "\"Actual minus predicted\".", remember: "Residual = actual − predicted." }
    };
  }
  var TWOVAR = {
    id: "d-twovar", t: "Two-variable data & models", short: "Scatterplots", kind: "Scatterplot & line of best fit",
    blurb: "Predict with a line of best fit, say what its slope means (predicted, not exact), and find how far a point is from the model.",
    forms: ["graph", "model", "twist"],
    school: { course: "g8", unit: 7, t: "8th Grade Math, Unit 7: Data and modeling" },
    autopsy: { testing: "Scatterplots and lines of best fit", clue: "A scatterplot, or a line \"of best fit\".", remember: "The line predicts; data points scatter around it.", spotQ: "Is each of these about a scatterplot model?" },
    spot: function (R) {
      return R.shuffle([
        { t: "Using the line of best fit, estimate the price of a 2,000-square-foot house.", yes: true, why: "Prediction from a model." },
        { t: "What does 3.2 mean in the line of best fit $y = 3.2x + 15$?", yes: true, why: "The predicted change per unit." },
        { t: "What is the median of the $y$-values?", yes: false, why: "One variable — center of data." }]);
    },
    lesson: [
      { type: "learn", kicker: "A line through a cloud",
        prompt: "A line of best fit runs through the middle of the scatter. It **predicts**; the real points miss it a little.",
        scene: { type: "plane", x: [0, 10], y: [0, 30], aspect: 0.6, labelEvery: 2, labelEveryY: 5, grid: 1,
                 fns: [{ f: "2.5*x + 5", color: "red" }],
                 marks: [[1, 8], [2, 9.5], [3, 13], [4, 14], [5, 18.5], [6, 19], [7, 23], [8, 24], [9, 27.5]].map(function (p) { return { x: p[0], y: p[1], color: "blue", r: 4 }; }),
                 points: [{ id: "P", x: 4, y: 15, drag: "x", snap: 1, label: "", color: "orange", coords: false }],
                 readout: function (s) { var xx = s.pt("P").x; return "At $x = " + xx + "$ the line predicts $y = 2.5(" + xx + ") + 5 = " + num(2.5 * xx + 5) + "$."; } },
        after: "The slope, 2.5, is the **predicted** change in $y$ for each 1 added to $x$ — a trend, not a promise for every point." },
      { type: "learn", kicker: "Above or below the line",
        prompt: "A **residual** is actual − predicted.",
        scene: { type: "walk", rows: [
          { m: "(6, 19)", say: "A real data point." }, { m: "\\hat{y} = 2.5(6) + 5 = 20", say: "What the line predicts at $x = 6$." },
          { m: "19 - 20 = -1", say: "Residual $-1$: the point is 1 below the line." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "graph") return twoPredict(R);
      if (o.form === "model") return twoSlope(R);
      return o.diff >= 3 ? twoResidual(R) : twoSlope(R);
    }
  };

  /* ===================================================== 5 · Probability */
  function twoWay(R) {
    var rp = R.pick([[["9th grade", "10th grade"], ["is in 9th grade", "is in 10th grade"], ["the 9th graders", "the 10th graders"]], [["Juniors", "Seniors"], ["is a junior", "is a senior"], ["the juniors", "the seniors"]]]);
    var rows = rp[0], cols = R.pick([["Robotics", "Drama", "Chess"], ["Soccer", "Swimming", "Tennis"], ["Pizza", "Tacos", "Salad"]]);
    var T = rows.map(function () { return cols.map(function () { return R.int(6, 30); }); });
    var rs = T.map(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); }), cs = cols.map(function (_, j) { return T[0][j] + T[1][j]; }), G = rs[0] + rs[1];
    return { rows: rows, is: rp[1], the: rp[2], cols: cols, T: T, rs: rs, cs: cs, G: G,
      fig: F.table({ head: [""].concat(cols).concat(["Total"]), rows: [0, 1].map(function (i) { return [rows[i]].concat(T[i]).concat([rs[i]]); }).concat([["Total"].concat(cs).concat([G])]), left: true }) };
  }
  function probSimple(R) {
    var D = twoWay(R), i = R.int(0, 1), j = R.int(0, 2);
    var ok = fc(D.cs[j], D.G, { ok: true });
    return {
      stem: "The table shows how " + D.G + " students answered a survey about their favorite choice. If one of these students is selected at random, what is the probability that the student chose " + D.cols[j] + "?",
      fig: D.fig,
      choices: [ok].concat(H.distinct(ok, [
        fc(D.T[i][j], D.G, { err: "misread", tr: "used one group's count instead of the whole column", why: "Every student who chose " + D.cols[j] + " counts: the column total, " + D.cs[j] + "." }),
        fc(D.cs[j], D.G - D.cs[j], { err: "formula", tr: "divided by the students who didn't choose it", why: "Probability divides by **everyone** who could be picked: " + D.G + "." }),
        fc(D.T[i][j], D.rs[i], { err: "concept", tr: "answered a conditional question that wasn't asked", why: "No group was given — the student is picked from all " + D.G + "." }),
        fc(1, 3, { err: "concept", tr: "treated every choice as equally likely", why: "The choices weren't picked equally often; use the counts." })], 3)),
      hint: "How many students chose " + D.cols[j] + " altogether? How many could have been picked?",
      strategy: "Probability $= \\frac{\\text{favorable}}{\\text{total possible}}$ — here the column total over the grand total.",
      walk: W([["\\frac{" + D.cs[j] + "}{" + D.G + "}" + (tex(D.cs[j] / D.G) !== "\\frac{" + D.cs[j] + "}{" + D.G + "}" ? " = " + frac(D.cs[j], D.G) : ""), "Chose " + D.cols[j] + ", out of everyone."]]),
      concept: "Probability compares the outcomes you want with all the equally likely outcomes.",
      rebuild: [{ q: "How many students chose " + D.cols[j] + "?", num: D.cs[j], ok: "The column total." }, { q: "Out of how many students?", num: D.G, ok: "Everyone in the table." }],
      autopsy: { clue: "\"Selected at random\" from everyone.", remember: "Favorable over total." }
    };
  }
  function probCond(R) {
    var D = twoWay(R), i = R.int(0, 1), j = R.int(0, 2), rev = R.chance(0.4);
    var ok = rev ? fc(D.T[i][j], D.cs[j], { ok: true }) : fc(D.T[i][j], D.rs[i], { ok: true });
    var given = rev ? "chose " + D.cols[j] : D.is[i], event = rev ? D.is[i] : "chose " + D.cols[j];
    return {
      stem: "The table shows how " + D.G + " students answered a survey. If a student who " + given + " is selected at random, what is the probability that the student " + event + "?",
      fig: D.fig,
      choices: [ok].concat(H.distinct(ok, [
        fc(D.T[i][j], D.G, { err: "concept", tr: "divided by the whole table instead of the given group", why: "The student is chosen from those who " + given + " only: divide by " + (rev ? D.cs[j] : D.rs[i]) + "." }),
        rev ? fc(D.T[i][j], D.rs[i], { err: "concept", tr: "conditioned on the wrong group", why: "The given group is the students who " + given + ": the " + D.cols[j] + " column." })
          : fc(D.T[i][j], D.cs[j], { err: "concept", tr: "conditioned on the wrong group", why: "The given group is " + D.the[i] + " (a row), not everyone who chose " + D.cols[j] + " (a column)." }),
        rev ? fc(D.cs[j], D.G, { err: "misread", tr: "found the chance of the given condition", why: "That's the probability a random student chose " + D.cols[j] + ". The question gives you that and asks about the grade." })
          : fc(D.rs[i], D.G, { err: "misread", tr: "found the chance of the given condition", why: "That's the probability a random student " + D.is[i] + " — the condition, not the event." }),
        fc(D.T[1 - i][j], rev ? D.cs[j] : D.rs[1 - i], { err: "misread", tr: "read the wrong row", why: "Check you're in the row for " + D.the[i] + "." })], 3)),
      hint: "Who is the student chosen from? That group is the denominator.",
      strategy: "Conditional probability: \"given\" / \"if a student who…\" names the group you're choosing from. Denominator = that group's total.",
      walk: W([["\\text{group: } " + (rev ? D.cs[j] : D.rs[i]), "Students who " + given + "."], ["\\frac{" + D.T[i][j] + "}{" + (rev ? D.cs[j] : D.rs[i]) + "}", "Of those, the ones who " + event + "."]]),
      concept: "A condition shrinks the sample: once you know the student " + given + ", only that group can have been chosen.",
      rebuild: [{ q: "The student is chosen only from those who " + given + ". How many is that?", num: rev ? D.cs[j] : D.rs[i], ok: "That's the denominator." }, { q: "How many of them " + (rev ? "are " + D.the[i].replace(/^the /, "") : "chose " + D.cols[j]) + "?", num: D.T[i][j], ok: "That's the numerator: $\\frac{" + D.T[i][j] + "}{" + (rev ? D.cs[j] : D.rs[i]) + "}$." }],
      autopsy: { hard: "Four fractions that each use real numbers from the table.", trap: "Dividing by the grand total.", clue: "\"If a student who … is selected\" — that's the group.", remember: "Given → shrink the denominator to that group." }
    };
  }
  function probBag(R) {
    var r = R.int(3, 9), b = R.int(3, 9), g = R.int(2, 8), T = r + b + g;
    return {
      stem: "A bag contains " + r + " red, " + b + " blue and " + g + " green marbles. One marble is chosen at random. What is the probability that it is <b>not</b> blue?",
      choices: [fc(r + g, T, { ok: true }),
        fc(b, T, { err: "misread", tr: "found the probability of blue", why: "That's the chance it IS blue. \"Not blue\" is everything else." }),
        fc(r + g, b, { err: "formula", tr: "divided by the blue marbles", why: "Divide by all " + T + " marbles." }),
        fc(r, T, { err: "misread", tr: "counted only one of the other colors", why: "Not blue includes red **and** green." })],
      hint: "How many marbles are not blue?",
      strategy: "$P(\\text{not } A) = 1 - P(A)$, or count the other outcomes directly.",
      walk: W([[r + " + " + g + " = " + (r + g), "Not blue: red and green."], ["\\frac{" + (r + g) + "}{" + T + "}", "Out of all " + T + "."]]),
      concept: "The probability of an event and of its complement add to 1.",
      rebuild: [{ q: "How many marbles are there?", num: T, ok: T + " in all." }, { q: "How many are not blue?", num: r + g, ok: "Probability $\\frac{" + (r + g) + "}{" + T + "}$." }],
      autopsy: { trap: "Missing the word \"not\".", clue: "\"Not blue\".", remember: "Complement: $1 - P(A)$." }
    };
  }
  var PROB = {
    id: "d-prob", t: "Probability & conditional probability", short: "Probability", kind: "Probability from a table",
    blurb: "Read probabilities from two-way tables — and when the question says \"given\", shrink the denominator to that group.",
    forms: ["table", "word", "twist"],
    school: { course: "g8", unit: 7, t: "8th Grade Math, Unit 7: Data and modeling" },
    autopsy: { testing: "Probability and conditional probability", clue: "\"Selected at random\" and a table of counts.", remember: "Favorable ÷ the group you choose from.", spotQ: "Is each of these a probability question?" },
    spot: function (R) {
      return R.shuffle([
        { t: "Given that a person owns a dog, what is the probability they also own a cat?", yes: true, why: "Conditional probability." },
        { t: "A card is drawn from these 40. What is the chance it's a heart?", yes: true, why: "Favorable over total." },
        { t: "What percent of the 10th graders chose chess?", yes: false, why: "Close — but it asks for a percent. Same fraction, different wording." }]);
    },
    lesson: [
      { type: "learn", kicker: "Probability is a fraction",
        prompt: "Favorable outcomes over all the outcomes that could happen:",
        scene: { type: "walk", rows: [
          { m: "\\frac{\\text{favorable}}{\\text{total}}", say: "Everything the question could pick goes on the bottom." },
          { m: "P(\\text{not } A) = 1 - P(A)", say: "The complement." }] }, gate: true },
      { type: "learn", kicker: "Given means \"shrink\"",
        prompt: "When the question says **given** or **if a student who…**, only that group can be picked — so it becomes the denominator.",
        scene: { type: "walk", rows: [
          { m: "\\text{120 students: 50 juniors, 70 seniors}", say: "The table's totals." },
          { m: "\\text{15 juniors chose drama}", say: "One cell." },
          { m: "P(\\text{drama}\\mid\\text{junior}) = \\frac{15}{50}", say: "Given a junior: divide by the 50 juniors, not by 120." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "word") return probBag(R);
      if (o.form === "twist") return probCond(R);
      return o.diff === 1 ? probSimple(R) : probCond(R);
    }
  };

  /* ======================================= 6 · Inference and study design */
  function infMOE(R) {
    var n = R.pick([300, 400, 500, 800, 1200]), p = R.int(35, 70), me = R.pick([3, 4, 5, 6]);
    var who = R.pick([["students at a high school", "favor a later start time", "all students at the high school"], ["voters in a city", "support a new park", "all voters in the city"], ["customers of a store", "would use a mobile app", "all customers of the store"]]);
    return {
      stem: "A random sample of " + H.commas(n) + " " + who[0] + " was surveyed. Of those surveyed, " + p + "% said they " + who[1] + ". The margin of error for the estimate is " + me + " percentage points. Which is the most appropriate conclusion?",
      choices: [w("It is plausible that between " + (p - me) + "% and " + (p + me) + "% of " + who[2] + " " + who[1] + ".", { ok: true }),
        w("Exactly " + p + "% of " + who[2] + " " + who[1] + ".", { err: "concept", tr: "treated a sample estimate as exact", why: "A sample gives an estimate. The margin of error says how far off it might plausibly be." }),
        w("Between " + (p - me) + "% and " + (p + me) + "% of the " + H.commas(n) + " people surveyed " + who[1] + ".", { err: "misread", tr: "applied the margin of error to the sample", why: "We know the sample exactly: " + p + "%. The interval is about the whole population." }),
        w("It is plausible that between " + (p - 2 * me) + "% and " + (p + 2 * me) + "% of " + who[2] + " " + who[1] + ".", { err: "calc", tr: "doubled the margin of error", why: "The interval is the estimate plus or minus " + me + ": " + (p - me) + "% to " + (p + me) + "%." })],
      hint: "What does a margin of error of " + me + " points tell you about the whole population?",
      strategy: "Estimate ± margin of error gives a plausible range for the whole population — not a guarantee, and not about the sample.",
      walk: W([[p + " \\pm " + me, "Estimate plus or minus the margin of error."], [(p - me) + "\\% \\text{ to } " + (p + me) + "\\%", "Plausible range for the population."]]),
      concept: "A random sample gives an estimate for the population; the margin of error describes the uncertainty in that estimate.",
      rebuild: [{ q: "What is " + p + " − " + me + "?", num: p - me, ok: "The low end." }, { q: "And " + p + " + " + me + "?", num: p + me, ok: "So " + (p - me) + "%–" + (p + me) + "% of the **population** is plausible." }],
      autopsy: { trap: "Treating the estimate as exact, or as about the sample.", clue: "\"Random sample … margin of error\".", remember: "Estimate ± margin = plausible range for the population." }
    };
  }
  function infGeneral(R) {
    var place = R.pick([["one high school in Ohio", "students at that high school", "all high school students in the United States"], ["one city's public library", "members of that library", "all adults in the state"]]);
    return {
      stem: "A researcher selected a random sample of " + place[1].split(" at ")[0].split(" of ")[0] + " from " + place[0] + " and found that most of them read at least one book a month. To which group can the result most appropriately be generalized?",
      choices: [w("Only to " + place[1] + ".", { ok: true }),
        w("To " + place[2] + ".", { err: "concept", tr: "generalized beyond the population sampled", why: "The sample came from " + place[0] + " only. It can represent that population, not a bigger one." }),
        w("Only to the people in the sample.", { err: "concept", tr: "thought a random sample can't be generalized", why: "Random selection is exactly what lets a sample represent the population it was drawn from." }),
        w("To no one, because the sample was random.", { err: "concept", tr: "thought randomness ruins a sample", why: "Randomness is what makes a sample representative." })],
      order: "keep",
      hint: "Where did the random sample come from?",
      strategy: "A random sample can be generalized to the population it was drawn from — and no further.",
      walk: W([["\\text{random sample from } P", "The sample represents $P$…"], ["\\text{generalize to } P \\text{ only}", "…and nothing larger."]]),
      concept: "Random sampling lets you generalize to the sampled population. Random assignment (in an experiment) lets you conclude cause.",
      rebuild: [{ q: "The sample was drawn randomly from…", opts: [place[0], "the whole country"], a: 0, ok: "So it represents that population." }],
      autopsy: { clue: "Where the sample came from.", remember: "Generalize only to the population sampled." }
    };
  }
  function infCause(R) {
    var exp = R.chance(0.5), S0 = R.pick([["drink water before an exam", "higher scores"], ["use a new study app", "better quiz grades"], ["take a short walk after lunch", "more focus in the afternoon"]]);
    var lead = exp ? "In an experiment, 200 volunteers were randomly assigned either to " + S0[0].replace(/^/, "") + " or not to. The group that did showed significantly " + S0[1] + "." :
      "In a survey of 200 volunteers, those who chose to " + S0[0] + " reported significantly " + S0[1] + " than those who didn't.";
    return {
      stem: lead + " Which conclusion is best supported?",
      choices: exp ? [w("Doing it is likely to cause " + S0[1] + " for people like these volunteers.", { ok: true }),
          w("Doing it causes " + S0[1] + " for everyone.", { err: "concept", tr: "generalized beyond the volunteers", why: "The volunteers weren't a random sample of everyone, so the result applies to people like them." }),
          w("There is an association, but no conclusion about cause is possible.", { err: "concept", tr: "missed that random assignment allows cause", why: "Random assignment balances other differences between the groups — that's what lets an experiment show cause." }),
          w("It shows nothing, because the participants were volunteers.", { err: "concept", tr: "thought volunteers rule out every conclusion", why: "Volunteers limit who it applies to, not whether it shows cause for them." })]
        : [w("There is an association, but it can't be concluded that doing it causes " + S0[1] + ".", { ok: true }),
          w("Doing it causes " + S0[1] + ".", { err: "concept", tr: "concluded cause from an observational study", why: "People chose for themselves, so the groups may differ in other ways. Only random assignment shows cause." }),
          w("Doing it causes " + S0[1] + " for all people.", { err: "concept", tr: "concluded cause and generalized", why: "Neither step is supported: no random assignment, no random sample of all people." }),
          w("There is no relationship between them.", { err: "misread", tr: "ignored the result", why: "The study did find a significant difference — an association." })],
      hint: exp ? "Were people randomly assigned to the groups?" : "Did the researchers assign the groups, or did people choose?",
      strategy: "Random **assignment** → can conclude cause. No random assignment (people chose) → association only. Random **sampling** → can generalize to the population.",
      walk: W([[exp ? "\\text{random assignment} \\checkmark" : "\\text{no random assignment}", exp ? "Groups differ only by chance and the treatment → cause." : "Groups may differ in other ways → association only."], ["\\text{volunteers}", "Not a random sample: applies to people like them."]]),
      concept: "Two different randoms: random sampling lets you generalize; random assignment lets you conclude cause.",
      rebuild: [{ q: "Were the groups randomly assigned?", opts: ["Yes", "No — people chose"], a: exp ? 0 : 1, ok: exp ? "So cause can be concluded." : "So only an association." }],
      autopsy: { trap: exp ? "Refusing to conclude cause when random assignment was used." : "Concluding cause from an observational study.", clue: exp ? "\"Randomly assigned\"." : "\"Those who chose to\".", remember: "Assignment → cause. Sampling → generalize." }
    };
  }
  function infEstimate(R) {
    var N = R.pick([2000, 4000, 5000, 8000, 12000]), n = R.pick([100, 200, 250, 400]), k = R.int(3, 18);
    var est = N * k / n;
    if (Math.abs(est - Math.round(est)) > 1e-9) { n = 200; N = 4000; est = N * k / n; }
    return {
      stem: "A factory made " + H.commas(N) + " light bulbs. In a random sample of " + n + " of them, " + k + " were defective. Based on the sample, about how many of the " + H.commas(N) + " bulbs would you expect to be defective?",
      answer: est, shown: String(est),
      near: [{ v: k, tr: "gave the sample count" }, { v: N - est, tr: "found the ones that work" }],
      hint: "What fraction of the sample was defective?",
      strategy: "Scale the sample's proportion up to the population: $\\frac{" + k + "}{" + n + "} \\times " + H.bigm(N) + "$.",
      walk: W([["\\frac{" + k + "}{" + n + "} = " + num(k / n), "Proportion defective in the sample."], [num(k / n) + " \\times " + H.bigm(N) + " = " + H.bigm(est), "Applied to all the bulbs."]]),
      concept: "A random sample's proportion estimates the population's proportion.",
      rebuild: [{ q: "What fraction of the sample was defective? (as a decimal)", num: k / n, tol: 1e-6, ok: num(k / n) + "." }, { q: "Times " + H.commas(N) + " bulbs:", num: est, ok: est + "." }],
      autopsy: { clue: "A random sample and a population total.", remember: "Sample proportion × population size." }
    };
  }
  var INFER = {
    id: "d-infer", t: "Inference, samples & studies", short: "Samples & studies", kind: "Sampling & study design",
    blurb: "Use a margin of error, scale a sample up, and know what a study can conclude: generalize with random sampling, claim cause with random assignment.",
    forms: ["word", "model", "twist"],
    school: { course: "g8", unit: 7, t: "8th Grade Math, Unit 7: Data and modeling" },
    autopsy: { testing: "What samples and studies can conclude", clue: "A survey, a sample, an experiment or a margin of error.", remember: "Random sampling → generalize. Random assignment → cause.", spotQ: "Is each of these about what a study can conclude?" },
    spot: function (R) {
      return R.shuffle([
        { t: "A survey has a margin of error of 3%. What's a plausible range?", yes: true, why: "Estimate ± margin." },
        { t: "Students who sleep more get better grades. Does sleep cause better grades?", yes: true, why: "Observational — association only." },
        { t: "What is the probability a random student is a senior?", yes: false, why: "Probability, not inference." }]);
    },
    lesson: [
      { type: "learn", kicker: "Two different randoms",
        prompt: "The SAT tests one distinction again and again:",
        scene: { type: "walk", rows: [
          { m: "\\text{random sampling}", say: "Who is **in** the study was chosen at random → you can **generalize** to the population they were drawn from." },
          { m: "\\text{random assignment}", say: "Who gets the treatment was decided at random → you can conclude **cause** (for people like the participants)." },
          { m: "\\text{neither}", say: "People chose for themselves → only an **association**." }] }, gate: true },
      { type: "learn", kicker: "Margin of error",
        prompt: "A sample estimate comes with uncertainty.",
        scene: { type: "walk", rows: [
          { m: "62\\% \\pm 4", say: "Estimate and margin of error." }, { m: "58\\% \\text{ to } 66\\%", say: "Plausible values for the **whole population** — not for the sample, and not guaranteed." },
          { m: "n \\uparrow \\Rightarrow \\text{margin} \\downarrow", say: "A bigger sample gives a smaller margin of error." }] }, gate: true }
    ],
    gen: function (R, o) {
      if (o.form === "model") return o.diff === 1 ? infEstimate(R) : infMOE(R);
      if (o.form === "twist") return infGeneral(R);
      return o.diff === 1 ? infEstimate(R) : o.diff === 2 ? infMOE(R) : infCause(R);
    }
  };

  S.domain(3, {
    skills: [RATIO, PCT, ONEVAR, TWOVAR, PROB, INFER],
    strategies: [
      { id: "proportion", t: "Same thing on top", rule: "In a proportion, put the same quantity in the same place on both sides — then cross-multiply.",
        when: "a ratio or rate is scaled up or down.", skills: ["d-ratio"],
        ex: "3 cups of flour per 2 cups of sugar. Flour for 10 cups of sugar?", walk: W([["\\frac{3}{2} = \\frac{x}{10}", "Flour on top."], ["x = 15", "Cross-multiply."]]) },
      { id: "cancelunits", t: "Let the units cancel", rule: "Write every number with its unit and multiply by conversion factors until only the units you want are left.",
        when: "the question's units differ from the given units.", skills: ["d-ratio"],
        ex: "20 m/s in km/h.", walk: W([["20 \\times 3600 \\div 1000", "m/s × s/h × km/m."], ["72 \\text{ km/h}", "Units check."]]) },
      { id: "shares", t: "Ratios as shares", rule: "A ratio $a : b$ splits a total into $a + b$ equal shares. Find one share first.",
        when: "a part-to-part ratio and a total are given.", skills: ["d-ratio"],
        ex: "Boys to girls 3 : 5, 48 students. Girls?", walk: W([["48 \\div 8 = 6", "One share."], ["5 \\times 6 = 30", "Girls."]]) },
      { id: "multiplier", t: "Percent as one multiplication", rule: "Up $p\\%$ → × $(1 + p)$; down $p\\%$ → × $(1 - p)$. Undo by dividing. Chained changes multiply.",
        when: "a percent increase, decrease, or several in a row.", skills: ["d-pct", "m-exp"],
        ex: "After 20% off, \\$48. Original?", walk: W([["0.8x = 48", "80% left."], ["x = 60", "Divide."]]) },
      { id: "fromoriginal", t: "Percent change from the original", rule: "Percent change $= \\frac{\\text{change}}{\\text{original}} \\times 100$ — always divide by where you started.",
        when: "\"By what percent did it increase/decrease?\"", skills: ["d-pct"],
        ex: "From 40 to 50?", walk: W([["\\frac{10}{40} = 25\\%", "Divide by 40."]]) },
      { id: "medianmean", t: "Median resists, mean moves", rule: "The median is the middle of the ordered data; the mean is total ÷ count. Outliers pull the mean, not the median.",
        when: "a data set changes, or you choose a measure of center.", skills: ["d-onevar"],
        ex: "Replace the largest value with a much larger one.", walk: W([["\\text{mean} \\uparrow", "The total grows."], ["\\text{median same}", "The middle doesn't move."]]) },
      { id: "spreadbyeye", t: "Compare spread by eye", rule: "Standard deviation is spread around the mean: tightly packed → smaller. Compare the pictures; don't compute.",
        when: "two data sets and the words \"standard deviation\".", skills: ["d-onevar"],
        ex: "Which has the larger standard deviation?", walk: W([["\\text{look for spread}", "The more spread-out set."]]) },
      { id: "predicted", t: "The line predicts", rule: "Use the equation of the line of best fit, not a data point. Its slope is a *predicted* change per unit.",
        when: "a scatterplot with a line of best fit.", skills: ["d-twovar"],
        ex: "$y = 2.5x + 5$: predict at $x = 6$.", walk: W([["2.5(6) + 5 = 20", "The line's value."]]) },
      { id: "givengroup", t: "\"Given\" is the denominator", rule: "In conditional probability, the group you're told about is the denominator.",
        when: "\"If a student who … is selected\", \"given that\".", skills: ["d-prob"],
        ex: "15 of 50 juniors chose drama. P(drama | junior)?", walk: W([["\\frac{15}{50}", "Divide by the juniors."]]) },
      { id: "tworandoms", t: "Sampling vs assignment", rule: "Random sampling → generalize to that population. Random assignment → conclude cause. Neither → association.",
        when: "the question asks what a study shows.", skills: ["d-infer"],
        ex: "People chose to take vitamins and were healthier.", walk: W([["\\text{no random assignment}", "Association, not cause."]]) }
    ]
  });
})();
