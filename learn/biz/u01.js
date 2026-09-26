/* ==========================================================================
   Introduction to Business — Unit 1: Economic systems and business.
   See lab/core.js for the format and lab/bizkit.js for the scenes.

   Follows chapter 1 of OpenStax's Introduction to Business 2e — what a
   business is, the world around it, the economy it lives in, and how a
   market sets a price — in fourteen short lessons, written for someone
   meeting business for the first time. The chapter's topics are followed;
   every sentence, example and problem here is OEdu's own.

   Every lesson builds one idea at a time, in the same order:
     1. something real to look at, or a question to guess at
     2. the idea met by doing something — a stand you run, a market you
        move, a flow you follow — and named only after
     3. the same idea asked again with a new case, then a step harder
     4. the usual mistake met head on, and why the idea is true
   Every lesson after the first opens with a question from an earlier one.
   Twenty-one skills practice it with problems made fresh every sitting,
   four quizzes check it along the way, and the unit test draws on every
   skill.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var B = L.B, mc = L.mc, num = L.num, usd = L.usd, icon = L.icon, card = L.card, tiles = L.tiles, photo = L.photo;
  var money = B.money, pct = B.pct, count = B.count, sample = B.sample, round = B.round;
  var LESSONS = [], SKILLS = [];

  /* ============================================================== Lesson 1
     What a business does (1.1): goods and services, revenue, costs, profit
     and loss, risk. */
  LESSONS[1] = {
    title: "What a business does",
    blurb: "Goods and services, money in and money out, and what's left — profit.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Guess first",
        prompt: "Rosa runs a taco truck. On Saturday, customers paid her **\\$600** in total.<br><br>Did Rosa make \\$600 for herself?",
        art: tiles([{ i: "truck", t: "Rosa's taco truck", c: "orange" }, { i: "people", t: "200 tacos sold" }, { i: "cash", t: "$600 came in", c: "green" }]),
        options: [{ t: "No — she had to pay for things first" },
                  { t: "Yes, all \\$600", fb: "\\$600 came in. But the tortillas, the meat and the truck's parking spot weren't free — part of that money pays for them." },
                  { t: "It depends on how many tacos she sold", fb: "The number sold only changes how much came in. The real question is what she had to pay out." }],
        answer: 0, keep: true,
        why: "\\$600 came in, but Rosa still has to pay for ingredients and parking. What she keeps is what's left after that." },
      { type: "learn", kicker: "New word",
        prompt: "Rosa's truck is a **business**.<br><br>A business is an organization that tries to earn a profit by selling things customers want.",
        art: tiles([{ i: "truck", t: "A taco truck" }, { i: "scissors", t: "A hair salon" }, { i: "phone", t: "A phone maker" }, { i: "bus", t: "A bus company" }], "All of these are businesses.") },
      { type: "learn", kicker: "Two kinds of things to sell",
        prompt: "Businesses sell **goods** and **services**. Turn over both cards.",
        scene: { type: "flip", cols: 2, cards: [
          { i: "box", name: "Goods", c: "blue", t: "Things you can **hold, touch and keep** — a taco, a laptop, a pair of sneakers." },
          { i: "hand", name: "Services", c: "purple", t: "Work done **for** you. You can't hold it or store it — a haircut, a bus ride, a doctor's checkup." }] },
        gate: true, then: "A quick test: could you put it in a bag and take it home? Then it's a good." },
      { type: "sort", skill: "Goods and services",
        prompt: "Sort each one into goods or services.",
        bins: ["Good", "Service"],
        cards: [{ t: card("laptop", "A laptop"), bin: 0, fb: "You can hold a laptop and keep it — it's a good." },
                { t: card("scissors", "A haircut"), bin: 1, fb: "You can't take a haircut home in a bag — someone does work for you. That's a service." },
                { t: card("shoe", "Sneakers"), bin: 0, fb: "Sneakers are a thing you can hold and keep — a good." },
                { t: card("bus", "A bus ride"), bin: 1, fb: "You may hold a ticket, but what you pay for is the ride — work done for you." },
                { t: card("doctor", "A doctor's checkup"), bin: 1, fb: "A checkup is work a doctor does for you — a service." },
                { t: card("apple", "A bag of apples"), bin: 0, fb: "Apples are things you can hold and store — goods." }],
        hints: ["Ask: could I put it in a bag and take it home?"],
        why: "Goods are things you can hold, touch and keep. Services are work done for you." },
      { type: "learn", kicker: "Try it",
        prompt: "Here is Rosa's truck for one day. Each taco costs her \\$1 in ingredients. The parking spot costs \\$150.<br><br>Move the sliders until Rosa **loses** money.",
        scene: { type: "profit", item: "taco", icon: "truck", title: "Rosa's taco truck, for one day",
                 price: { v: 3, min: 1, max: 6, step: 0.5 }, sold: { v: 200, min: 0, max: 300, step: 10 },
                 unitCost: 1, fixed: 150, fixedName: "parking spot", goal: "loss" },
        gate: true,
        then: "That's a **loss**: more money went out than came in. Money coming in is **revenue**. Money going out is **costs**. What's left over is **profit**." },
      { type: "learn", kicker: "Watch",
        prompt: "Here is Rosa's Saturday, worked out one line at a time.",
        scene: { type: "walk", rows: [
          { m: "200 \\times 3 = 600", say: "**Revenue:** 200 tacos at \\$3 each brought in \\$600." },
          { m: "150 + 200 \\times 1 = 350", say: "**Costs:** \\$150 for parking, plus \\$1 of ingredients for each of the 200 tacos." },
          { m: "600 - 350 = 250", say: "**Profit:** revenue minus costs. Rosa keeps \\$250." }] },
        gate: true, then: "Profit = revenue − costs. When costs are bigger, the answer is below zero: a loss." },
      { type: "amount", kicker: "Your turn", skill: "Profit",
        prompt: "A car wash washes 40 cars at \\$12 each. Its costs for the day are \\$300.<br><br>What is its profit?",
        pre: "\\$", answer: 180,
        near: [{ v: 480, fb: "\\$480 is the revenue — everything that came in. Now take away the \\$300 of costs." },
               { v: 780, fb: "Costs are taken away from revenue, not added to it." },
               { v: 52, fb: "Revenue isn't 40 + 12. Each of the 40 cars paid \\$12: that's 40 × 12." }],
        hints: ["First the revenue: 40 cars at \\$12 each.", "Then profit = revenue − costs."],
        why: "Revenue: 40 × \\$12 = \\$480.<br>Profit: \\$480 − \\$300 = \\$180." },
      { type: "choice", kicker: "Careful",
        prompt: "Company A took in **\\$2 million** last year. Company B took in **\\$200,000**.<br><br>Which company made more profit?",
        options: [{ t: "You can't tell without knowing their costs" },
                  { t: "Company A", fb: "Company A took in more — but if its costs were \\$2.5 million, it lost money. Revenue isn't profit." },
                  { t: "Company B", fb: "Nothing here says B's costs were lower. You need both companies' costs to compare profit." }],
        answer: 0, keep: true,
        why: "Revenue is only money coming in. Profit depends on costs too — a company can take in millions and still have a loss." },
      { type: "learn", kicker: "Real world",
        prompt: "Every business takes a **risk**: the chance of losing time and money, or missing its goals.",
        art: photo("note7", "Samsung's Galaxy Note 7 had batteries that could catch fire. Recalling it cost the company more than $5 billion."),
        after: "The more risk a business takes, the bigger its possible profit — and its possible loss." },
      { type: "learn", kicker: "Watch",
        prompt: "Taking no risk can be risky too. Follow what happened to Sony.",
        scene: { type: "chain", steps: [
          { i: "music", t: "Sony led the music player market with the Walkman.", c: "blue" },
          { i: "cloud", t: "Music moved to digital files — but Sony stuck with its own older formats.", c: "orange" },
          { i: "bulb", t: "Apple took the risk of the iPod and iTunes, and won most of digital music.", c: "green" },
          { i: "down", t: "Sony lost ground — and profits — until it found success in gaming.", c: "red" }] },
        gate: true },
      { type: "explain", kicker: "In your own words",
        prompt: "Why isn't the money a business takes in the same as its profit?",
        model: "What a business takes in is its revenue. Profit is only what's left after paying all its costs — so a business with big revenue can still have a loss." },
      { type: "amount", kicker: "Put it together", skill: "Profit",
        prompt: "A pop-up shop sells 30 hoodies at \\$25 each. It paid \\$20 for each hoodie, and \\$250 to rent the space.<br><br>What is its profit? (Type a loss as a negative number.)",
        pre: "\\$", answer: -100,
        near: [{ v: 750, fb: "\\$750 is the revenue. Now add up all the costs and take them away." },
               { v: 150, fb: "That forgets the \\$250 rent. Costs are the hoodies (30 × \\$20) **and** the rent." },
               { v: 100, fb: "Right size — but costs were bigger than revenue. That's a loss: type it as −100." },
               { v: 500, fb: "That only takes away the rent. The 30 hoodies cost \\$20 each, too." }],
        hints: ["Revenue: 30 × \\$25.", "Costs: 30 × \\$20 for the hoodies, plus \\$250 rent.", "Profit = revenue − costs. Is it above or below zero?"],
        why: "Revenue: 30 × \\$25 = \\$750.<br>Costs: 30 × \\$20 + \\$250 = \\$850.<br>Profit: \\$750 − \\$850 = −\\$100, a loss of \\$100." }
    ]
  };

  var L1_GOODS = [
    ["laptop", "A laptop"], ["shoe", "A pair of sneakers"], ["pizza", "A frozen pizza"], ["shirt", "A T-shirt"], ["bike", "A bicycle"],
    ["phone", "A new phone"], ["apple", "A bag of apples"], ["car", "A car"], ["coffee", "A bag of coffee beans"], ["music", "A guitar"],
    ["box", "A pack of batteries"], ["cap", "A graduation cap"], ["basket", "A picnic basket"], ["box", "A backpack"],
    ["jar", "A jar of honey"], ["box", "A box of cereal"]
  ];
  var L1_SERVICES = [
    ["scissors", "A haircut"], ["bus", "A bus ride"], ["doctor", "A doctor's checkup"], ["car", "A car wash"], ["cap", "An hour of tutoring"],
    ["wrench", "A phone screen repair"], ["person", "Dog walking"], ["plane", "A flight to Chicago"], ["house", "House cleaning"],
    ["scale", "Advice from a lawyer"], ["music", "A guitar lesson"], ["shirt", "Dry cleaning a jacket"], ["house", "A night in a hotel"],
    ["tree", "Mowing a lawn"], ["hospital", "An X-ray at a clinic"], ["film", "A movie at the theater"]
  ];
  var L1_BOTH = [
    { biz: "a pizza place that delivers", good: "The pizza", svc: "Bringing it to your door" },
    { biz: "a phone store", good: "The phone", svc: "Setting it up and moving your contacts" },
    { biz: "a car dealer", good: "The car", svc: "The oil changes it does later" },
    { biz: "a hair salon", good: "The shampoo it sells", svc: "Cutting your hair" },
    { biz: "a bike shop", good: "A new bike helmet", svc: "Fixing a flat tire" },
    { biz: "a furniture store", good: "The sofa", svc: "Putting it together in your home" },
    { biz: "a computer shop", good: "A keyboard", svc: "Removing a virus" },
    { biz: "a florist", good: "A bunch of roses", svc: "Arranging flowers at a wedding" }
  ];
  var L1_SHOPS = [
    { who: "A lemonade stand", item: "cups", p: [1, 2, 3], uc: [0, 1], fx: [10, 20, 30] },
    { who: "A food truck", item: "burritos", p: [6, 8, 9], uc: [2, 3], fx: [100, 150, 200] },
    { who: "A school bake sale", item: "cookies", p: [1, 2], uc: [0, 1], fx: [0, 10, 20] },
    { who: "A car wash", item: "cars", p: [10, 12, 15], uc: [1, 2], fx: [60, 90, 120] },
    { who: "A T-shirt printer", item: "shirts", p: [15, 18, 20], uc: [6, 8], fx: [200, 300] },
    { who: "A bike repair shop", item: "repairs", p: [25, 30, 40], uc: [5, 10], fx: [150, 250] },
    { who: "A snow-cone cart", item: "snow cones", p: [2, 3, 4], uc: [1], fx: [40, 60] },
    { who: "A tutoring service", item: "hour-long sessions", p: [30, 40, 50], uc: [0, 5], fx: [100, 200] }
  ];

  SKILLS.push(
    { id: "biz1-goods", title: "Goods and services", lesson: 1,
      gen: function (R, i) {
        var t = i % 5;
        if (t === 0 || t === 2) {
          var isG = R.chance(0.5), x = R.pick(isG ? L1_GOODS : L1_SERVICES);
          return mc(R, { prompt: "Is this a good or a service?<br><br>" + card(x[0], x[1]), keep: true,
            right: isG ? "A good" : "A service",
            wrong: [{ t: isG ? "A service" : "A good", fb: isG ? "You can hold it, touch it and keep it — that makes it a good." :
              "You can't put it in a bag and take it home. It's work someone does for you — a service." }],
            hints: ["Could you hold it and take it home in a bag?"],
            why: x[1] + (isG ? " is a thing you can hold and keep: a good." : " is work done for you, not a thing you keep: a service.") });
        }
        if (t === 1) {
          var g = sample(R, L1_GOODS, 2), s = sample(R, L1_SERVICES, 2);
          var cards = g.map(function (x) { return { t: card(x[0], x[1]), bin: 0, fb: x[1] + " can be held and kept — a good." }; })
            .concat(s.map(function (x) { return { t: card(x[0], x[1]), bin: 1, fb: x[1] + " is work done for you — a service." }; }));
          return { type: "sort", prompt: "Sort these into goods and services.", bins: ["Good", "Service"], cards: R.shuffle(cards),
                   hints: ["Goods: things you can hold and keep. Services: work done for you."],
                   why: "Goods: " + g.map(function (x) { return x[1].toLowerCase(); }).join(", ") + ". Services: " + s.map(function (x) { return x[1].toLowerCase(); }).join(", ") + "." };
        }
        if (t === 3) {
          var b = R.pick(L1_BOTH), askSvc = R.chance(0.5);
          return mc(R, { prompt: "Many businesses sell goods **and** services. Think about " + b.biz + ".<br><br>Which part is the " + (askSvc ? "service" : "good") + "?",
            right: askSvc ? b.svc : b.good,
            wrong: [{ t: askSvc ? b.good : b.svc, fb: askSvc ? "That's a thing you can hold and keep — a good." : "That's work done for you — a service." }],
            hints: ["Which one could you carry home? That's the good."],
            why: b.good + " is a good you can keep; " + b.svc.charAt(0).toLowerCase() + b.svc.slice(1) + " is a service — work done for you." });
        }
        var findSvc = R.chance(0.5), odd = R.pick(findSvc ? L1_SERVICES : L1_GOODS), rest = sample(R, findSvc ? L1_GOODS : L1_SERVICES, 3);
        return mc(R, { prompt: "Which one is a **" + (findSvc ? "service" : "good") + "**?",
          right: card(odd[0], odd[1]),
          wrong: rest.map(function (x) { return { t: card(x[0], x[1]), fb: findSvc ? x[1] + " is a thing you can hold and keep — a good." : x[1] + " is work done for you — a service." }; }),
          hints: ["Three of these are the same kind. Find the one that's different."],
          why: odd[1] + (findSvc ? " is work done for you — a service. The others are goods." : " is a thing you can hold and keep — a good. The others are services.") });
      } },
    { id: "biz1-profit", title: "Revenue, costs and profit", lesson: 1,
      gen: function (R, i) {
        var s = R.pick(L1_SHOPS), p = R.pick(s.p), q = R.int(3, 12) * 10, uc = R.pick(s.uc), fx = R.pick(s.fx);
        var rev = p * q, cost = fx + uc * q, pr = rev - cost;
        var t = i % 5;
        if (t === 0) {
          return { type: "amount", prompt: s.who + " sells " + q + " " + s.item + " at " + usd(p) + " each.<br><br>What is its revenue?", pre: "\\$", answer: rev,
            near: [{ v: p + q, fb: "Revenue isn't the price plus the number sold. Each of the " + q + " paid " + usd(p) + ": multiply." }],
            hints: ["Revenue is all the money that comes in from selling.", q + " × " + usd(p) + " = ?"],
            why: "Revenue = " + q + " × " + usd(p) + " = " + usd(rev) + "." };
        }
        if (t === 1) {
          var r2 = R.int(4, 20) * 50, c2 = R.int(2, r2 / 50 - 1) * 50;
          return { type: "amount", prompt: s.who + " has revenue of " + usd(r2) + " this week and costs of " + usd(c2) + ".<br><br>What is its profit?", pre: "\\$", answer: r2 - c2,
            near: [{ v: r2 + c2, fb: "Costs are taken away from revenue, not added." }, { v: c2, fb: "That's the costs. Profit is what's left of the revenue after paying them." }],
            hints: ["Profit = revenue − costs."], why: "Profit = " + usd(r2) + " − " + usd(c2) + " = " + usd(r2 - c2) + "." };
        }
        if (t === 2) {
          var w = [{ t: "A business with bigger revenue always makes more profit", fb: "Not if its costs are bigger too. Profit is revenue minus costs." },
                   { t: "Profit is all the money a business takes in", fb: "That's revenue. Profit is what's left after costs are paid." },
                   { t: "A loss means the business took in no money", fb: "A business with a loss usually took in plenty — it just paid out more." }];
          var qs = [{ q: "Which of these is a **cost** for " + s.who.toLowerCase() + "?", r: R.pick(["Rent for its space", "Wages for its workers", "The supplies it uses", "Advertising"]),
                      ws: [{ t: "Money paid by its customers", fb: "Money from customers comes in — that's revenue, not a cost." }, { t: "What's left after paying its bills", fb: "What's left is profit." }] },
                    { q: "Which statement is true?", r: "A business can take in a lot of money and still have a loss", ws: w }];
          var Q = R.pick(qs);
          return mc(R, { prompt: Q.q, right: Q.r, wrong: Q.ws, hints: ["Revenue comes in. Costs go out. Profit is what's left."],
            why: "Revenue is money in, costs are money out, and profit = revenue − costs — which can be below zero." });
        }
        // i ≥ 3: from price, quantity, cost per item and a fixed cost — sometimes a loss.
        if (t === 4 && pr > 0) { q = Math.max(10, Math.floor((fx / Math.max(1, p - uc)) / 10) * 10 - 10); rev = p * q; cost = fx + uc * q; pr = rev - cost; }
        return { type: "amount",
          prompt: s.who + " sells " + q + " " + s.item + " at " + usd(p) + " each. " + (uc ? "Supplies cost " + usd(uc) + " for each one, and " : "") +
                  "it pays " + usd(fx) + " for the day's space.<br><br>What is its profit? (Type a loss as a negative number.)",
          pre: "\\$", answer: pr,
          near: [{ v: rev, fb: "That's the revenue. Now take away all the costs." }, { v: -pr, fb: pr < 0 ? "Right size — but costs were bigger than revenue, so it's a loss: type it negative." : "Check the sign: revenue was bigger than costs, so it's a profit." },
                 { v: rev - fx, fb: uc ? "That forgets the supplies: " + usd(uc) + " for each of the " + q + "." : "Check your subtraction." }].filter(function (n) { return n.v !== pr; }),
          hints: ["Revenue: " + q + " × " + usd(p) + ".", "Costs: " + usd(fx) + (uc ? " + " + q + " × " + usd(uc) : "") + ".", "Profit = revenue − costs."],
          why: "Revenue: " + q + " × " + usd(p) + " = " + usd(rev) + ".<br>Costs: " + usd(fx) + (uc ? " + " + q + " × " + usd(uc) : "") + " = " + usd(cost) + ".<br>Profit: " + usd(rev) + " − " + usd(cost) + " = " + usd(pr) + (pr < 0 ? " — a loss." : ".") };
      } }
  );

  /* ============================================================== Lesson 2
     Not all about profit (1.1): not-for-profit organizations, standard of
     living, quality of life. */
  LESSONS[2] = {
    title: "Not all about profit",
    blurb: "Organizations with a mission instead of a profit — and what makes life good.",
    mins: 9,
    steps: [
      { type: "amount", kicker: "Remember?",
        prompt: "A bakery took in \\$900 this week. Its costs were \\$650.<br><br>What was its profit?",
        pre: "\\$", answer: 250,
        near: [{ v: 1550, fb: "Costs are taken away from revenue, not added." }, { v: 900, fb: "\\$900 is the revenue. Take away the costs." }],
        hints: ["Profit = revenue − costs."], why: "\\$900 − \\$650 = \\$250." },
      { type: "choice", kicker: "Look",
        prompt: "These volunteers are training with **Team Rubicon**, a group started by two Marine veterans after the 2010 Haiti earthquake.<br><br>What do you think Team Rubicon is trying to do?",
        art: photo("rubicon", "Team Rubicon volunteers train for disaster relief."),
        options: [{ t: "Help people before, during and after disasters" },
                  { t: "Make as much profit as it can", fb: "Team Rubicon doesn't exist to make money for owners — it exists to help communities hit by disasters." },
                  { t: "Sell safety gear to volunteers", fb: "The gear is just a tool. The group's goal is helping people after disasters." }],
        answer: 0, keep: true,
        why: "Team Rubicon's goal is disaster relief, not profit." },
      { type: "learn", kicker: "New word",
        prompt: "Team Rubicon is a **not-for-profit organization**: it exists to reach a goal other than profit.<br><br>The biggest one of all is **government**.",
        art: tiles([{ i: "basket", t: "Food banks", c: "green" }, { i: "capitol", t: "Museums", c: "purple" }, { i: "heart", t: "Animal shelters", c: "red" },
                    { i: "hospital", t: "Most hospitals", c: "blue" }, { i: "flag", t: "Government", c: "orange" }]) },
      { type: "choice", kicker: "Careful",
        prompt: "A museum sells **\\$2 million** of tickets a year.<br><br>Can it still be a not-for-profit?",
        options: [{ t: "Yes — what matters is what the money is for" },
                  { t: "No — it makes money, so it's a business", fb: "Not-for-profits bring in money too. The difference is their goal, and where extra money goes." },
                  { t: "Only if the tickets are free", fb: "A not-for-profit can charge for tickets. It just uses the money for its mission." }],
        answer: 0, keep: true,
        why: "Not-for-profits take in money and must manage it well. What makes them different is their goal." },
      { type: "learn", kicker: "Try it",
        prompt: "So how is a not-for-profit different from a business? Turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "target", name: "The goal", c: "blue", t: "A business aims for **profit**. A not-for-profit aims for a **mission** — feeding people, saving animals, running a museum." },
          { i: "jar", name: "Money left over", c: "green", t: "A business can pay it to its **owners**. A not-for-profit puts it back into its **mission**." },
          { i: "people", name: "What they compete for", c: "purple", t: "Not-for-profits compete for **donations**, **volunteers' time** and **good workers** — not for customers the way Target and Walmart do." }] },
        gate: true },
      { type: "sort", skill: "For-profit or not",
        prompt: "Sort each organization.",
        bins: ["Business (for profit)", "Not-for-profit"],
        cards: [{ t: card("shoe", "Nike"), bin: 0, fb: "Nike sells shoes to earn a profit for its owners — a business." },
                { t: card("basket", "Feeding America, a food bank network"), bin: 1, fb: "Its goal is fighting hunger, not profit." },
                { t: card("film", "Netflix"), bin: 0, fb: "Netflix sells subscriptions to make a profit — a business." },
                { t: card("heart", "A city animal shelter"), bin: 1, fb: "Its mission is caring for animals — not profit." },
                { t: card("capitol", "The Smithsonian museums"), bin: 1, fb: "The Smithsonian's goal is education and preserving history." },
                { t: card("cart", "Target"), bin: 0, fb: "Target sells goods to make a profit — a business." }],
        hints: ["Ask: is the main goal profit, or a mission?"],
        why: "Businesses aim for profit; not-for-profits aim for a mission." },
      { type: "learn", kicker: "New word",
        prompt: "Businesses and not-for-profits both shape our **standard of living**: the goods and services people can buy with the money they have.<br><br>Watch two towns.",
        scene: { type: "walk", rows: [
          { m: "20 \\div 10 = 2", say: "In **Maple**, people earn \\$20 an hour and a meal costs \\$10. An hour of work buys **2** meals." },
          { m: "25 \\div 20 = 1.25", say: "In **Pine**, people earn \\$25 an hour — more! But a meal costs \\$20. An hour buys only **1¼** meals." }] },
        gate: true,
        then: "Pine has higher pay, but Maple has the higher standard of living. **Prices matter, not just pay.**" },
      { type: "choice", kicker: "Your turn", skill: "Standard of living",
        prompt: "In Cedar, pay is \\$30 an hour and a movie ticket costs \\$15. In Birch, pay is \\$18 an hour and a ticket costs \\$6.<br><br>Where does an hour of work buy more tickets?",
        options: [{ t: "Birch — 3 tickets an hour" },
                  { t: "Cedar — because the pay is higher", fb: "Higher pay, but higher prices too: \\$30 ÷ \\$15 is only 2 tickets." },
                  { t: "They're the same", fb: "Work it out: Cedar \\$30 ÷ \\$15 = 2, Birch \\$18 ÷ \\$6 = 3." }],
        answer: 0, keep: true,
        hints: ["Divide the hourly pay by the ticket price in each town."],
        why: "Cedar: 30 ÷ 15 = 2 tickets. Birch: 18 ÷ 6 = 3 tickets. Birch's hour buys more." },
      { type: "learn", kicker: "New word",
        prompt: "**Quality of life** is how good life is overall — not just what you can buy.",
        art: tiles([{ i: "heart", t: "Health and long lives", c: "red" }, { i: "cap", t: "Education", c: "blue" }, { i: "drop", t: "Clean water and sanitation", c: "blue" },
                    { i: "clock", t: "Free time", c: "green" }], "Businesses, government and not-for-profits build it together."),
        after: "In 2024, Luxembourg, Denmark and the Netherlands ranked highest. The United States ranked 14th." },
      { type: "sort", skill: "Standard of living",
        prompt: "Which idea does each one belong to?",
        bins: ["Standard of living", "Quality of life"],
        cards: [{ t: "How many sneakers a month's pay buys", bin: 0, fb: "That's about what your money can buy — standard of living." },
                { t: "How long people live", bin: 1, fb: "Life expectancy is part of quality of life." },
                { t: "Clean water in every home", bin: 1, fb: "Sanitation and clean water are part of quality of life." },
                { t: "The price of groceries compared with wages", bin: 0, fb: "Prices against pay decide what people can buy — standard of living." },
                { t: "Free time after work", bin: 1, fb: "Leisure time is part of quality of life." }],
        hints: ["Is it about what money buys, or about how good life is overall?"],
        why: "Standard of living: what your money can buy. Quality of life: health, education, clean water, free time — how good life is overall." },
      { type: "explain", kicker: "In your own words",
        prompt: "How can someone with higher pay have a lower standard of living?",
        model: "If prices where they live are much higher, their bigger paycheck buys fewer goods and services — and that's what standard of living measures." },
      { type: "choice", kicker: "Put it together",
        prompt: "A not-for-profit hospital finishes the year with \\$3 million left over after all its costs.<br><br>What happens to that money?",
        options: [{ t: "It goes back into the hospital — new equipment, more nurses" },
                  { t: "It's paid out to the hospital's owners", fb: "That's what a business can do. A not-for-profit puts extra money back into its mission." },
                  { t: "Nothing — a not-for-profit can't have money left over", fb: "It can! Not-for-profits can end with money to spare. They just use it for their mission." }],
        answer: 0, keep: true,
        why: "A not-for-profit can bring in more than it spends, but the extra goes back into its mission, not to owners." }
    ]
  };

  var L2_ORGS = [
    ["Nike", "shoe", 1], ["Amazon", "box", 1], ["A family-owned pizza shop", "pizza", 1], ["Netflix", "film", 1], ["Target", "cart", 1],
    ["Walmart", "cart", 1], ["A local hair salon", "scissors", 1], ["Toyota", "car", 1], ["Southwest Airlines", "plane", 1], ["A neighborhood coffee shop", "coffee", 1],
    ["Feeding America, a food bank network", "basket", 0], ["The American Red Cross", "hospital", 0], ["A city animal shelter", "heart", 0],
    ["The Smithsonian museums", "capitol", 0], ["Amnesty International", "flag", 0], ["A public library", "cap", 0], ["Team Rubicon, a disaster relief group", "people", 0],
    ["A community youth soccer league", "trophy", 0], ["The city's fire department", "flame", 0], ["A local church", "heart", 0]
  ];
  var L2_GOALS = [
    ["to end hunger in our city", 0], ["to protect ocean wildlife", 0], ["to earn the highest return for our shareholders", 1], ["to give every child a place to play", 0],
    ["to grow sales 10% a year and raise our profit", 1], ["to keep our town's history alive", 0], ["to beat our rivals and increase our earnings", 1], ["to help veterans after they leave the military", 0]
  ];
  var L2_TOWNS = ["Maple", "Pine", "Cedar", "Birch", "Oakdale", "Riverton", "Lakeside", "Hillview", "Brookfield", "Summit"];
  var L2_THINGS = [["a meal", "meals", "burger"], ["a movie ticket", "tickets", "ticket"], ["a bus pass", "bus passes", "bus"], ["a T-shirt", "T-shirts", "shirt"], ["a pizza", "pizzas", "pizza"]];
  var L2_SOLQOL = [
    ["How many sneakers a month's pay buys", 0], ["How long people live", 1], ["Clean water in every home", 1], ["The price of groceries compared with wages", 0],
    ["Free time after work", 1], ["Whether a family can afford a car", 0], ["How good the schools are", 1], ["How many phones a year's pay could buy", 0],
    ["Good hospitals nearby", 1], ["How far a paycheck goes at the store", 0], ["Safe streets and clean parks", 1], ["Rent compared with pay", 0]
  ];

  SKILLS.push(
    { id: "biz1-nfp", title: "For-profit or not-for-profit", lesson: 2,
      gen: function (R, i) {
        var t = i % 4;
        if (t === 0) {
          var o = R.pick(L2_ORGS);
          return mc(R, { prompt: "Is this a business or a not-for-profit organization?<br><br>" + card(o[1], o[0]), keep: true,
            right: o[2] ? "A business (for profit)" : "A not-for-profit",
            wrong: [{ t: o[2] ? "A not-for-profit" : "A business (for profit)", fb: o[2] ? o[0] + " sells goods or services to earn a profit for its owners." : o[0] + " exists for a mission, not to make a profit." }],
            hints: ["Is its main goal profit, or a mission?"],
            why: o[0] + (o[2] ? " aims to earn a profit — a business." : " aims at a mission — a not-for-profit.") });
        }
        if (t === 1) {
          var g = R.pick(L2_GOALS);
          return mc(R, { prompt: "An organization says its goal is “" + g[0] + ".”<br><br>What kind of organization is it most likely to be?", keep: true,
            right: g[1] ? "A business" : "A not-for-profit",
            wrong: [{ t: g[1] ? "A not-for-profit" : "A business", fb: g[1] ? "Returns, earnings and profit are the goals of a business." : "That goal is a mission, not profit — the mark of a not-for-profit." }],
            hints: ["Does the goal talk about profit, or about a mission?"],
            why: g[1] ? "A goal about profit or earnings belongs to a business." : "A goal other than profit belongs to a not-for-profit." });
        }
        if (t === 2) {
          var nf = R.chance(0.5), odd = R.pick(L2_ORGS.filter(function (x) { return x[2] === (nf ? 0 : 1); })),
              rest = sample(R, L2_ORGS.filter(function (x) { return x[2] === (nf ? 1 : 0); }), 3);
          return mc(R, { prompt: "Which one is a **" + (nf ? "not-for-profit" : "business") + "**?", right: card(odd[1], odd[0]),
            wrong: rest.map(function (x) { return { t: card(x[1], x[0]), fb: x[0] + (x[2] ? " is a business: it aims for profit." : " is a not-for-profit: it aims at a mission.") }; }),
            hints: ["Three of these have the same kind of goal."],
            why: odd[0] + (nf ? " exists for a mission, not profit." : " exists to earn a profit.") });
        }
        var qs = [
          { p: "A not-for-profit ends the year with money left over. Where does it go?", r: "Back into its mission",
            w: [{ t: "To its owners", fb: "Paying owners is what a business can do." }, { t: "It has to be given away to a business", fb: "No — it's used for the not-for-profit's own mission." }] },
          { p: "Not-for-profits don't compete for customers the way Walmart and Target do. What **do** they compete for?", r: "Donations, volunteers' time and talented workers",
            w: [{ t: "Nothing — they never compete", fb: "They do compete — for donations, volunteers and good employees." }, { t: "Profit", fb: "Profit isn't their goal." }] },
          { p: "Which is true of not-for-profit organizations?", r: "They set goals, plan budgets and manage money, like businesses do",
            w: [{ t: "They never bring in any money", fb: "They bring in money from donations, tickets, fees and more." }, { t: "They are all run by the government", fb: "Government is the biggest one, but most not-for-profits are not government." }] }];
        var Q = R.pick(qs);
        return mc(R, { prompt: Q.p, right: Q.r, wrong: Q.w, hints: ["A not-for-profit is organized like a business — only its goal is different."], why: "The goal is a mission, not profit; everything else — budgets, planning, competing for resources — looks a lot like a business." });
      } },
    { id: "biz1-living", title: "Standard of living and quality of life", lesson: 2,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 2) {
          var x = R.pick(L2_SOLQOL);
          return mc(R, { prompt: "“" + x[0] + ".”<br><br>Is this about standard of living or quality of life?", keep: true,
            right: x[1] ? "Quality of life" : "Standard of living",
            wrong: [{ t: x[1] ? "Standard of living" : "Quality of life", fb: x[1] ? "It isn't about what money buys — it's about how good life is overall." : "It's about what people's money can buy — that's standard of living." }],
            hints: ["Standard of living: what your money buys. Quality of life: how good life is overall."],
            why: x[1] ? "Health, education, clean water, safety and free time are quality of life." : "What your money can buy is standard of living." });
        }
        var towns = sample(R, L2_TOWNS, 2), th = R.pick(L2_THINGS);
        // Town A buys more for an hour's work even though town B pays more.
        var kA = R.pick([2, 3, 4]), kB = kA - 1, pA = R.pick([4, 5, 6, 8, 10]), wA = pA * kA;
        var pB = Math.ceil((wA + R.pick([1, 3, 5])) / kB), wB = pB * kB;
        var first = R.pick([0, 1]);                       // which town is written first
        var w1 = first ? wB : wA, p1 = first ? pB : pA, k1 = first ? kB : kA;
        var w2 = first ? wA : wB, p2 = first ? pA : pB, k2 = first ? kA : kB;
        var more = k1 > k2 ? 0 : 1, hiPay = w2 > w1 ? 1 : 0;
        if (t === 0) {
          var n = R.pick([0, 1]), w = n ? w2 : w1, p = n ? p2 : p1;
          return { type: "amount", prompt: "In " + towns[n] + ", people earn " + usd(w) + " an hour, and " + th[0] + " costs " + usd(p) + ".<br><br>How many " + th[1] + " does one hour of work buy?",
            answer: w / p, near: [{ v: w - p, fb: "Don't subtract — divide the pay by the price: how many times does " + usd(p) + " fit into " + usd(w) + "?" }],
            hints: ["Divide the hourly pay by the price."], why: usd(w) + " ÷ " + usd(p) + " = " + num(w / p) + " " + th[1] + "." };
        }
        return mc(R, { prompt: "In " + towns[0] + ", pay is " + usd(w1) + " an hour and " + th[0] + " costs " + usd(p1) + ". In " + towns[1] + ", pay is " + usd(w2) + " an hour and " + th[0] + " costs " + usd(p2) + ".<br><br>Which town has the higher standard of living (for " + th[1] + ")?",
          right: towns[more] + " — an hour buys " + (more ? k2 : k1) + " " + th[1],
          wrong: [{ t: towns[1 - more] + " — its pay is " + (hiPay === 1 - more ? "higher" : "lower"), fb: "Pay alone doesn't decide it. " + towns[1 - more] + ": " + usd(more ? w1 : w2) + " ÷ " + usd(more ? p1 : p2) + " = " + (more ? k1 : k2) + " " + th[1] + " an hour." },
                  { t: "They're the same", fb: "Divide each town's pay by its price: " + k1 + " against " + k2 + "." }],
          hints: ["For each town, divide the hourly pay by the price."],
          why: towns[0] + ": " + usd(w1) + " ÷ " + usd(p1) + " = " + k1 + ". " + towns[1] + ": " + usd(w2) + " ÷ " + usd(p2) + " = " + k2 + ". More goods for an hour's work means a higher standard of living." });
      } }
  );

  /* ============================================================== Lesson 3
     The building blocks (1.1): the factors of production — natural
     resources, labor, capital, entrepreneurship, and knowledge. Money is
     not capital. */
  var L3_F = { nr: "Natural resources", lab: "Labor", cap: "Capital", ent: "Entrepreneurship", know: "Knowledge" };
  LESSONS[3] = {
    title: "The building blocks",
    blurb: "The five kinds of resources every business needs — and why money isn't one of them.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "A bike shop sells a helmet and fixes a flat tire.<br><br>Which one is the service?",
        options: [{ t: card("wrench", "Fixing the flat tire") },
                  { t: card("bike", "The helmet"), fb: "You can hold a helmet and take it home — it's a good." }],
        answer: 0, keep: true, hints: ["Which one is work done for you?"], why: "Fixing a tire is work done for you — a service. The helmet is a good." },
      { type: "learn", kicker: "Look",
        prompt: "Luca is opening a pizza shop. Here's what he needs to make his first pizza.",
        art: tiles([{ i: "wheat", t: "Flour, tomatoes, water", c: "green" }, { i: "worker", t: "Cooks and servers", c: "blue" },
                    { i: "flame", t: "An oven and a building", c: "orange" }, { i: "bulb", t: "Luca, who puts it all together", c: "yellow" }]),
        after: "Every business needs the same kinds of things. They're called the **factors of production**: the resources used to make goods and services." },
      { type: "learn", kicker: "Try it",
        prompt: "There are five factors of production. Turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "tree", name: "Natural resources", c: "green", t: "What nature gives: farmland, forests, water, oil, minerals. Economists often call this **land** — but it means much more than land." },
          { i: "worker", name: "Labor", c: "blue", t: "People's work, with their **minds and muscles** — from a cook to a scientist." },
          { i: "gear", name: "Capital", c: "orange", t: "The **tools, machines, equipment and buildings** used to make things and get them to customers." },
          { i: "bulb", name: "Entrepreneurship", c: "yellow", t: "The **entrepreneur** combines the others, makes the big decisions — and takes the **risk**, with no promise of profit." },
          { i: "cap", name: "Knowledge", c: "purple", t: "The combined **skills and know-how** of the workers. Today it drives much of a country's growth." }] },
        gate: true },
      { type: "sort", skill: "Factors of production",
        prompt: "Sort what Luca's pizza shop uses.",
        bins: ["Natural resources", "Labor", "Capital", "Entrepreneurship"],
        cards: [{ t: card("apple", "Fresh tomatoes"), bin: 0, fb: "Tomatoes grow on farms — a natural resource." },
                { t: card("person", "A delivery driver"), bin: 1, fb: "The driver's work is labor." },
                { t: card("flame", "The pizza oven"), bin: 2, fb: "An oven is equipment used to make pizza — capital." },
                { t: card("bulb", "Luca risking his savings to open the shop"), bin: 3, fb: "Combining everything and taking the risk is entrepreneurship." },
                { t: card("car", "The delivery van"), bin: 2, fb: "A van is equipment used to get pizzas to customers — capital." },
                { t: card("drop", "Water for the dough"), bin: 0, fb: "Water is a natural resource." }],
        hints: ["Grown or dug from nature? People's work? A tool or machine? The person taking the risk?"],
        why: "Tomatoes and water: natural resources. The driver: labor. The oven and van: capital. Luca's risk-taking: entrepreneurship." },
      { type: "choice", kicker: "Careful",
        prompt: "Luca has **\\$50,000** saved in the bank for his shop.<br><br>Which factor of production is that money?",
        art: tiles([{ i: "cash", t: "$50,000 in the bank", c: "green" }]),
        options: [{ t: "None of them — money isn't a factor of production" },
                  { t: "Capital", fb: "Careful! In economics, capital means tools, machines and buildings. Money can't make a pizza by itself." },
                  { t: "Natural resources", fb: "Natural resources come from nature — farmland, water, oil. Money doesn't." },
                  { t: "Entrepreneurship", fb: "Entrepreneurship is Luca's decision-making and risk-taking — not the money itself." }],
        answer: 0, keep: true,
        why: "Money produces nothing on its own. It's used to **buy** the factors of production." },
      { type: "learn", kicker: "Why it works",
        prompt: "Why isn't money counted? Follow Luca's \\$50,000.",
        scene: { type: "chain", steps: [
          { i: "cash", t: "Luca's money sits in the bank. It can't bake anything.", c: "green" },
          { i: "cart", t: "He spends part of it on an oven, a van and chairs.", c: "blue" },
          { i: "flame", t: "The **oven** bakes pizzas — that's capital doing the work.", c: "orange" },
          { i: "pizza", t: "So money is how you **get** the factors. The factors are what make things.", c: "yellow" }] },
        gate: true },
      { type: "choice", kicker: "Your turn", skill: "Factors of production",
        prompt: "A farmer grows corn. Which factor of production is the farmer's **tractor**?",
        options: [{ t: card("gear", "Capital") },
                  { t: card("tree", "Natural resources"), fb: "The farmland and the rain are natural resources. The tractor is a machine — capital." },
                  { t: card("worker", "Labor"), fb: "Labor is the work people do. The tractor is equipment they use." }],
        answer: 0, keep: true, hints: ["Is it from nature, a person's work, or a machine?"],
        why: "A tractor is equipment used to produce — capital." },
      { type: "learn", kicker: "Real world",
        prompt: "John Fischer started **StickerGiant** in his basement, printing bumper stickers.<br><br>He took risks: he closed his online store to focus on custom orders, and bought rare laser-cutting machines.",
        art: tiles([{ i: "house", t: "Started in a basement" }, { i: "gear", t: "Bought rare machines", c: "orange" }, { i: "trophy", t: "Forbes top-25 small business, 2017", c: "yellow" }]),
        after: "Combining resources in a new way and taking the risk — that's entrepreneurship." },
      { type: "choice", skill: "Factors of production",
        prompt: "A company trains its workers to use new AI design tools. It has the same number of workers — but each one now knows much more.<br><br>Which factor of production grew?",
        options: [{ t: card("cap", "Knowledge") },
                  { t: card("worker", "Labor"), fb: "The number of workers didn't change. What grew is what they know — knowledge." },
                  { t: card("gear", "Capital"), fb: "The tools are capital, but the question is about the workers knowing more." }],
        answer: 0, keep: true, hints: ["What changed: how many workers, or what they know?"],
        why: "Knowledge is the combined skills of the workforce. Training grew it." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why does an entrepreneur have to be a risk-taker?",
        model: "An entrepreneur puts in time and money with no promise of profit. If the business fails, that's lost; if it succeeds, the reward can be big." },
      { type: "sort", kicker: "Put it together", skill: "Factors of production",
        prompt: "Maya opens a coffee shop. Sort what she uses into all five factors.",
        bins: ["Natural resources", "Labor", "Capital", "Entrepreneurship", "Knowledge"],
        cards: [{ t: "Coffee beans", bin: 0, fb: "Beans grow on farms — a natural resource." },
                { t: "A barista's work", bin: 1, fb: "The barista's work is labor." },
                { t: "Espresso machine", bin: 2, fb: "A machine used to make coffee — capital." },
                { t: "Maya taking the risk", bin: 3, fb: "Deciding and taking the risk is entrepreneurship." },
                { t: "Staff's latte-art skills", bin: 4, fb: "Skills and know-how are knowledge." }],
        hints: ["One card goes in each box."],
        why: "Beans: natural resources. The barista's work: labor. The espresso machine: capital. Maya's risk-taking: entrepreneurship. The staff's skills: knowledge." }
    ]
  };

  var L3_BANK = [
    ["a bakery", "Flour", "wheat", "nr"], ["a bakery", "The ovens", "flame", "cap"], ["a bakery", "The bakers' work", "worker", "lab"],
    ["a furniture maker", "Wood from a forest", "tree", "nr"], ["a furniture maker", "Its saws and drills", "hammer", "cap"], ["a furniture maker", "The carpenters' work", "worker", "lab"],
    ["an oil company", "Oil deep underground", "barrel", "nr"], ["an oil company", "Its drilling rigs", "gear", "cap"],
    ["a farm", "The farmland", "tree", "nr"], ["a farm", "Its tractor", "gear", "cap"], ["a farm", "Rainwater for the crops", "drop", "nr"], ["a farm", "The farmhands picking fruit", "worker", "lab"],
    ["a delivery company", "Its trucks", "truck", "cap"], ["a delivery company", "The drivers' work", "person", "lab"], ["a delivery company", "Its warehouse", "factory", "cap"],
    ["a clothing maker", "Cotton", "shirt", "nr"], ["a clothing maker", "Its sewing machines", "gear", "cap"],
    ["a jewelry maker", "Gold dug from a mine", "mountain", "nr"], ["a hospital", "Its X-ray machines", "hospital", "cap"], ["a hospital", "The nurses' work", "worker", "lab"],
    ["a software company", "Its programmers' work", "laptop", "lab"], ["a software company", "Its office computers", "laptop", "cap"],
    ["a new app company", "The founder quitting her job to start it", "bulb", "ent"], ["a food truck", "The owner risking his savings on the truck", "bulb", "ent"],
    ["a bike shop", "The owner deciding what to sell and taking the risk", "bulb", "ent"],
    ["an engineering firm", "Its engineers' training and expertise", "cap", "know"], ["a hospital", "The doctors' years of medical training", "cap", "know"],
    ["a tech company", "What its workers know about AI", "robot", "know"]
  ];
  var L3_WHY = { nr: "It comes from nature — a natural resource.", lab: "It's people's work — labor.", cap: "It's a tool, machine, piece of equipment or building used to produce — capital.",
                 ent: "Combining resources and taking the risk is entrepreneurship.", know: "Skills and know-how are knowledge." };

  SKILLS.push(
    { id: "biz1-factors", title: "Factors of production", lesson: 3,
      gen: function (R, i) {
        var t = i % 5;
        if (t === 0 || t === 3) {
          var x = R.pick(L3_BANK), others = ["nr", "lab", "cap", "ent", "know"].filter(function (f) { return f !== x[3]; });
          return mc(R, { prompt: "For " + x[0] + ": which factor of production is this?<br><br>" + card(x[2], x[1]),
            right: L3_F[x[3]],
            wrong: sample(R, others, 3).map(function (f) { return { t: L3_F[f], fb: "Not quite. " + L3_WHY[x[3]] }; }),
            hints: ["From nature? People's work? A tool or building? The risk-taker? Skills?"],
            why: x[1] + ": " + L3_WHY[x[3]].toLowerCase() });
        }
        if (t === 1) {
          var biz = R.pick(["a bakery", "a bike shop", "a car wash", "a clothing maker", "a food truck", "a hair salon"]);
          var caps = R.pick([["Its delivery van", "car"], ["Its computers", "laptop"], ["Its building", "store"], ["Its machines", "gear"]]);
          return mc(R, { prompt: "Which of these is **not** a factor of production for " + biz + "?",
            right: card("cash", "The money in its bank account"),
            wrong: [{ t: card(caps[1], caps[0]), fb: "That's capital — equipment used to produce." },
                    { t: card("worker", "Its workers' time"), fb: "That's labor." },
                    { t: card("bulb", "The owner's decision to take the risk"), fb: "That's entrepreneurship." }],
            hints: ["One of these can't make anything by itself — it only buys things."],
            why: "Money isn't a factor of production: it produces nothing. It buys the factors." });
        }
        if (t === 2) {
          var plans = [
            { p: "Sam has a food truck, a grill and a great recipe, and he's ready to take the risk. But nobody is there to cook or serve.", miss: "lab" },
            { p: "Ana has hired bakers and rented a building, and she's ready to take the risk. But there's no oven, mixer or cash register.", miss: "cap" },
            { p: "A furniture company has carpenters, saws and a workshop. It has run out of wood.", miss: "nr" },
            { p: "A lab has scientists, equipment and materials — but no one to decide what to make and to risk starting the company.", miss: "ent" }];
          var pl = R.pick(plans);
          return mc(R, { prompt: pl.p + "<br><br>Which factor of production is missing?", right: L3_F[pl.miss],
            wrong: ["nr", "lab", "cap", "ent"].filter(function (f) { return f !== pl.miss; }).map(function (f) { return { t: L3_F[f], fb: "That one is there already. Read again: what's missing?" }; }),
            hints: ["Go through the list: nature's resources, workers, tools, the risk-taker."],
            why: "What's missing is " + L3_F[pl.miss].toLowerCase() + ". " + L3_WHY[pl.miss] });
        }
        var cards = sample(R, ["nr", "lab", "cap", "ent"], 4).map(function (f) {
          var x = R.pick(L3_BANK.filter(function (b) { return b[3] === f; }));
          return { t: x[1] + " (" + x[0] + ")", bin: ["nr", "lab", "cap", "ent"].indexOf(f), fb: L3_WHY[f] };
        });
        return { type: "sort", prompt: "Sort each into its factor of production.", bins: ["Natural resources", "Labor", "Capital", "Entrepreneurship"], cards: cards,
                 hints: ["From nature? Work? A tool or building? The risk-taker?"],
                 why: "Natural resources come from nature; labor is people's work; capital is tools, machines and buildings; entrepreneurship is combining them and taking the risk." };
      } }
  );

  /* ============================================================== Lesson 4
     The world around a business (1.2): internal and external environment,
     the seven external sectors, demography, technology and productivity. */
  var L4_SEC = { eco: "Economic", pol: "Political and legal", dem: "Demographic", soc: "Social", tech: "Technological", comp: "Competitive", glob: "Global" };
  var L4_ICON = { eco: "chart", pol: "scale", dem: "people", soc: "heart", tech: "chip", comp: "trophy", glob: "globe" };
  LESSONS[4] = {
    title: "The world around a business",
    blurb: "What a business controls, what it can't — and the seven forces it has to adapt to.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "The sewing machines in a clothing factory are which factor of production?",
        options: [{ t: card("gear", "Capital") }, { t: card("tree", "Natural resources"), fb: "The cotton is a natural resource. The machines are equipment — capital." },
                  { t: card("cash", "Money"), fb: "Money isn't a factor of production at all — and machines aren't money." }],
        answer: 0, keep: true, hints: ["Is it from nature, or a machine?"], why: "Machines used to produce are capital." },
      { type: "choice", kicker: "Guess first",
        prompt: "In 2010 an oil rig exploded in the Gulf of Mexico. Oil spilled for 87 days. Hotels and restaurants along the coast lost customers for years.<br><br>Did those hotels and restaurants do something wrong?",
        art: tiles([{ i: "barrel", t: "Oil spill, 2010", c: "red" }, { i: "house", t: "Coast hotels", c: "blue" }, { i: "burger", t: "Coast restaurants", c: "orange" }]),
        options: [{ t: "No — something outside their control hit them" },
                  { t: "Yes — they should have stopped the spill", fb: "They had nothing to do with the oil rig. It was a force from outside their businesses." },
                  { t: "Yes — they chose bad locations", fb: "The coast was a fine place for them until something outside their control changed." }],
        answer: 0, keep: true, why: "Businesses don't work in a bubble: outside events can help or hurt them, whatever they do." },
      { type: "learn", kicker: "Two environments",
        prompt: "Every business works in two environments. Turn over both cards.",
        scene: { type: "flip", cols: 2, cards: [
          { i: "store", name: "Internal environment", c: "blue", t: "What owners and managers **control** day to day: what to sell, who to hire, which supplies to buy, where to sell." },
          { i: "globe", name: "External environment", c: "orange", t: "Forces **outside** the business that it can't control, and that keep changing. The business has to **adapt** to them." }] },
        gate: true },
      { type: "sort", skill: "Business environment",
        prompt: "A café's owner makes a list. Sort it.",
        bins: ["Internal (the café controls it)", "External (outside its control)"],
        cards: [{ t: "Adding a new breakfast menu", bin: 0, fb: "The owner decides the menu — internal." },
                { t: "A new law raises the minimum wage", bin: 1, fb: "The café can't change the law — external." },
                { t: "Hiring two more cooks", bin: 0, fb: "Hiring is the owner's choice — internal." },
                { t: "A recession cuts people's spending", bin: 1, fb: "The economy is outside the café's control — external." },
                { t: "Choosing a coffee bean supplier", bin: 0, fb: "Picking suppliers is a day-to-day decision — internal." },
                { t: "A rival café opens next door", bin: 1, fb: "The café can't stop a rival from opening — external." }],
        hints: ["Could the owner decide it at a meeting tomorrow? Then it's internal."],
        why: "Internal: decisions the business makes. External: forces it has to live with." },
      { type: "learn", kicker: "Try it",
        prompt: "The external environment has seven parts. Turn over each card.",
        scene: { type: "flip", cols: 4, cards: [
          { i: "chart", name: "Economic", c: "blue", t: "The economy's ups and downs: jobs, incomes, prices, interest rates, taxes." },
          { i: "scale", name: "Political and legal", c: "purple", t: "Laws, regulations and agencies — and how stable a government is. Tariffs too." },
          { i: "people", name: "Demographic", c: "green", t: "Facts about people: their age, gender, race and ethnicity, and where they live." },
          { i: "heart", name: "Social", c: "red", t: "People's attitudes, values and lifestyles — what they care about and want." },
          { i: "chip", name: "Technological", c: "orange", t: "New science and tools: AI, cloud computing, robots." },
          { i: "trophy", name: "Competitive", c: "yellow", t: "What rival businesses do: new products, prices, stores." },
          { i: "globe", name: "Global", c: "blue", t: "What happens in other countries: overseas customers, rivals and events." }] },
        gate: true, then: "No business is big enough to control these. Managers mostly **adapt** to them." },
      { type: "choice", kicker: "Your turn", skill: "Business environment",
        prompt: "A drug company must get the FDA's approval before it can sell a new medicine.<br><br>Which part of the external environment is this?",
        options: [{ t: card("scale", "Political and legal") }, { t: card("chip", "Technological"), fb: "The medicine may be new technology, but the approval rule is a law and a government agency." },
                  { t: card("trophy", "Competitive"), fb: "The FDA isn't a rival — it's a government agency enforcing the law." }],
        answer: 0, keep: true, hints: ["Who sets the rule — a rival, or the government?"], why: "Government agencies and the laws they enforce are the political and legal environment." },
      { type: "choice", kicker: "Careful", skill: "Business environment",
        prompt: "More Americans are over 65 than ever before.<br><br>Which part of the environment is this?",
        options: [{ t: card("people", "Demographic") }, { t: card("heart", "Social"), fb: "Social is about attitudes and values. People's **ages** are a fact about the population — demographic." },
                  { t: card("chart", "Economic"), fb: "It will affect spending, but age itself is a fact about people — demographic." }],
        answer: 0, keep: true, hints: ["Demography is the study of facts about people — age, gender, where they live."],
        why: "**Demography** is the study of people's vital statistics, such as age. An older population is a demographic change." },
      { type: "learn", kicker: "New word",
        prompt: "Technology changes how much each worker can make. That's called **productivity**: the amount one worker can produce.",
        scene: { type: "walk", rows: [
          { m: "40", say: "A baker makes **40 loaves** a day by hand." },
          { m: "50 - 40 = 10", say: "With a new mixer, she makes 50 — that's **10 more**." },
          { m: "10 \\div 40 = 0.25", say: "10 more out of the 40 she used to make is 0.25: productivity rose **25%**." }] },
        gate: true },
      { type: "amount", skill: "Productivity",
        prompt: "A factory worker sewed 20 shirts a day. With new machines, she sews 25.<br><br>By what percent did her productivity rise?",
        post: "%", answer: 25,
        near: [{ v: 5, fb: "5 is how many more shirts. As a percent of the 20 she started with, it's 5 ÷ 20." }, { v: 20, fb: "Divide the 5 extra shirts by the 20 she used to make." }],
        hints: ["How many more shirts? 25 − 20.", "Divide that by the old amount, 20, and make it a percent."],
        why: "25 − 20 = 5 more. 5 ÷ 20 = 0.25, which is 25%." },
      { type: "explain", kicker: "In your own words",
        prompt: "An aging population is a demographic change. Why could it be both a challenge and an opportunity for a business?",
        model: "Customers and workers change: a business may lose sales of products older people don't want, but it can sell new goods and services they do want, such as health care." },
      { type: "sort", kicker: "Put it together", skill: "Business environment",
        prompt: "Sort these headlines for a car maker.",
        bins: ["Economic", "Political and legal", "Technological", "Competitive"],
        cards: [{ t: "Interest rates on car loans jump", bin: 0, fb: "Interest rates are part of the economy." },
                { t: "Congress passes stricter pollution rules", bin: 1, fb: "A new law — political and legal." },
                { t: "A new battery doubles an electric car's range", bin: 2, fb: "A new invention — technological." },
                { t: "A rival cuts its prices by 10%", bin: 3, fb: "What a rival does is the competitive environment." }],
        hints: ["Ask what caused each change: the economy, the law, an invention, or a rival?"],
        why: "Rates: economic. Rules: political and legal. Batteries: technological. A rival's prices: competitive." }
    ]
  };

  var L4_HEAD = {
    eco: ["The unemployment rate rises to 7%", "Interest rates on business loans go up", "Prices across the economy rise 6% this year", "A recession cuts consumer spending", "Incomes in the region grow fast"],
    pol: ["A new law raises the minimum wage", "The government puts a tariff on imported steel", "A city bans plastic shopping bags", "The FDA approves a new medicine", "A new president promises fewer business rules"],
    dem: ["The number of people over 65 keeps growing", "Millennials are now the largest group of workers", "More families move from cities to the suburbs", "The population of the Southwest grows quickly", "Births fall for the fifth year in a row"],
    soc: ["More shoppers want food with no animal products", "People care more about companies' ethics", "More families have two working parents and less free time", "Shoppers switch from stores to buying online", "Young people value experiences over things"],
    tech: ["A new AI tool writes computer code in seconds", "Robots take over repetitive warehouse work", "Cloud computing lets small firms rent huge computers", "A new battery charges in five minutes", "3D printers can now print car parts"],
    comp: ["A rival opens a store across the street", "A competitor launches a cheaper version of your product", "Two of your rivals merge into one bigger company", "A rival starts free delivery", "A new company copies your best-selling item"],
    glob: ["A factory in Vietnam can make your product for less", "Customers in Europe start buying your app", "A war overseas cuts off a supplier", "A Japanese rival enters the US market", "Demand for your product booms in India"]
  };
  var L4_INTERNAL = ["Choosing which products to sell", "Hiring a new manager", "Picking a supplier for materials", "Deciding where to open a store", "Setting the store's opening hours", "Training staff on a new register"];

  SKILLS.push(
    { id: "biz1-env", title: "The business environment", lesson: 4,
      gen: function (R, i) {
        var keys = Object.keys(L4_SEC), t = i % 4;
        if (t === 0 || t === 3) {
          var k = R.pick(keys), h = R.pick(L4_HEAD[k]);
          var wrongKeys = sample(R, keys.filter(function (x) { return x !== k; }), 3);
          return mc(R, { prompt: "“" + h + ".”<br><br>Which part of the external environment is this?",
            right: card(L4_ICON[k], L4_SEC[k]),
            wrong: wrongKeys.map(function (x) { return { t: card(L4_ICON[x], L4_SEC[x]), fb: "Look at what caused the change. This one is " + L4_SEC[k].toLowerCase() + "." }; }),
            hints: ["The economy, the law, facts about people, attitudes, inventions, rivals, or other countries?"],
            why: "This is the " + L4_SEC[k].toLowerCase() + " environment." });
        }
        if (t === 1) {
          var ext = R.chance(0.5), txt = ext ? R.pick(L4_HEAD[R.pick(keys)]) : R.pick(L4_INTERNAL);
          return mc(R, { prompt: "For a business: “" + txt + ".”<br><br>Is this part of its internal or external environment?", keep: true,
            right: ext ? "External — it's outside the business's control" : "Internal — the business controls it",
            wrong: [{ t: ext ? "Internal — the business controls it" : "External — it's outside the business's control",
                      fb: ext ? "The business can't decide this — it can only adapt to it." : "This is a decision the owners and managers make themselves." }],
            hints: ["Could the managers decide it at a meeting?"],
            why: ext ? "It happens outside the business: external." : "Managers decide it: internal." });
        }
        var a = R.pick([20, 40, 50, 80, 100]), up = R.pick([10, 25, 50]), b = a * (1 + up / 100);
        var unit = R.pick([["loaves of bread", "a baker"], ["shirts", "a sewer"], ["boxes packed", "a warehouse worker"], ["phones assembled", "a factory worker"]]);
        return { type: "amount", prompt: unit[1].charAt(0).toUpperCase() + unit[1].slice(1) + " made " + a + " " + unit[0] + " a day. New technology raises it to " + b + ".<br><br>By what percent did productivity rise?",
          post: "%", answer: up, near: [{ v: b - a, fb: "That's how many more. Divide it by the old amount, " + a + ", for the percent." }],
          hints: ["How many more? " + b + " − " + a + ".", "Divide by the old amount and turn it into a percent."],
          why: b + " − " + a + " = " + (b - a) + ". " + (b - a) + " ÷ " + a + " = " + num(up / 100) + ", which is " + up + "%." };
      } }
  );

  /* ============================================================== Lesson 5
     Who decides? (1.3): economics and scarcity, the questions every economy
     answers, capitalism, communism, socialism, mixed economies. */
  var L5_STOPS = [
    { key: "com", name: "Communism", c: "red", icon: "capitol",
      rows: [{ k: "Who owns businesses", t: "The **government** owns almost everything.", lvl: 0 },
             { k: "Who decides what to make and prices", t: "Planners in the central government." },
             { k: "Why people work", t: "As a duty to society. People have little choice of job." },
             { k: "How fast it changes", t: "Slowly. Shortages are common." }],
      say: "Today: North Korea and Cuba. The Soviet Union's system collapsed in 1991." },
    { key: "soc", name: "Socialism", c: "orange", icon: "bus",
      rows: [{ k: "Who owns businesses", t: "The government runs the **basic industries** — transport, power, phones. Smaller businesses are private.", lvl: 2 },
             { k: "Who decides what to make and prices", t: "A lot of government planning; some markets are free." },
             { k: "Why people work", t: "Private workers keep what they earn; many services come from taxes." },
             { k: "How fast it changes", t: "Slow and steady." }],
      say: "People get more services, such as health care — so taxes are higher." },
    { key: "mix", name: "Mixed economy", c: "purple", icon: "scale",
      rows: [{ k: "Who owns businesses", t: "Mostly **private owners**, with a few government-run parts.", lvl: 3 },
             { k: "Who decides what to make and prices", t: "Mostly the market, with government rules and safety nets." },
             { k: "Why people work", t: "Mostly the same as capitalism." },
             { k: "How fast it changes", t: "Fairly fast, with some government control." }],
      say: "Almost every real economy — including the United States, Canada, Sweden and the UK." },
    { key: "cap", name: "Capitalism", c: "green", icon: "store", crowd: 14,
      rows: [{ k: "Who owns businesses", t: "**Private** people and companies.", lvl: 4 },
             { k: "Who decides what to make and prices", t: "Buyers and sellers in the market — supply and demand." },
             { k: "Why people work", t: "**Profit**: people keep what they earn." },
             { k: "How fast it changes", t: "Fast — new products spread quickly." }],
      say: "Also called the **private enterprise system**. Pure capitalism is an extreme; the United States leans this way." }
  ];
  LESSONS[5] = {
    title: "Who decides?",
    blurb: "Scarce resources, hard choices — and the four ways the world's economies make them.",
    mins: 11,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“A rival starts offering free delivery.”<br><br>Which part of the business environment is this?",
        options: [{ t: card("trophy", "Competitive") }, { t: card("chip", "Technological"), fb: "Delivery isn't a new invention here — it's what a rival is doing." },
                  { t: card("chart", "Economic"), fb: "The economy didn't change — a competitor did." }],
        answer: 0, keep: true, hints: ["Who made the change?"], why: "What rival businesses do is the competitive environment." },
      { type: "choice", kicker: "Guess first",
        prompt: "Your class has \\$1,000 for the year. Students want a trip (\\$800), new laptops (\\$900) and a garden (\\$400).<br><br>What does the class have to do?",
        art: tiles([{ i: "bus", t: "Trip: $800", c: "blue" }, { i: "laptop", t: "Laptops: $900", c: "purple" }, { i: "leaf", t: "Garden: $400", c: "green" }, { i: "cash", t: "Money: $1,000", c: "yellow" }]),
        options: [{ t: "Choose — it can't have all three" },
                  { t: "Buy all three", fb: "All three cost \\$2,100. The class only has \\$1,000." },
                  { t: "Buy the cheapest thing only", fb: "That's one possible choice — but the point is that the class must **choose**. It could also pick the trip, or the laptops." }],
        answer: 0, keep: true, why: "There isn't enough money for everything, so the class has to choose. Every country faces the same problem." },
      { type: "learn", kicker: "New word",
        prompt: "Resources are **scarce** — limited — but wants aren't. **Economics** is the study of how a society uses scarce resources to make goods and services and share them out.<br><br>It's the study of **choices**.",
        art: tiles([{ i: "tree", t: "Limited resources", c: "green" }, { i: "arrow", t: "must be chosen between", c: "muted" }, { i: "people", t: "Unlimited wants", c: "blue" }]) },
      { type: "learn", kicker: "Try it",
        prompt: "Every economy has to answer the same four questions. Turn over each card.",
        scene: { type: "flip", cols: 4, cards: [
          { i: "box", name: "What?", c: "blue", t: "Which goods and services to make, and how many." },
          { i: "gear", name: "How?", c: "orange", t: "How they're made, and by whom." },
          { i: "people", name: "For whom?", c: "green", t: "How they're shared out to people." },
          { i: "tree", name: "With what?", c: "purple", t: "Who gets the scarce land, labor and capital." }] },
        gate: true, then: "The big difference between economies is **who decides**: the government, or buyers and sellers in the market." },
      { type: "learn", kicker: "Explore",
        prompt: "Slide from one extreme to the other. Visit all four systems.",
        scene: { type: "stops", left: "The government decides", right: "The market decides", stops: L5_STOPS, start: 3 },
        gate: true },
      { type: "learn", kicker: "Capitalism's rights",
        prompt: "Capitalism promises four economic rights. Turn over each card.",
        scene: { type: "flip", cols: 4, cards: [
          { i: "house", name: "Own property", c: "blue", t: "You can own land, buildings and businesses. This right is at the heart of capitalism." },
          { i: "coins", name: "Make a profit", c: "green", t: "You keep what your business earns — the reason to start one." },
          { i: "target", name: "Make free choices", c: "purple", t: "You choose your job or start a business. No one assigns it." },
          { i: "trophy", name: "Compete", c: "yellow", t: "Anyone can try to sell a better or cheaper product." }] },
        gate: true },
      { type: "learn", kicker: "Why it works",
        prompt: "Why is competition good for buyers? Follow the phone cases.",
        scene: { type: "chain", steps: [
          { i: "phone", t: "A new kind of phone case sells at a big profit.", c: "green" },
          { i: "store", t: "Other businesses see the profit and start making it too.", c: "blue" },
          { i: "tag", t: "To win buyers, sellers cut prices and improve their cases.", c: "orange" },
          { i: "people", t: "Buyers get better cases for less — and sellers must work more efficiently.", c: "purple" }] },
        gate: true },
      { type: "choice", kicker: "Careful",
        prompt: "Is the United States an example of **pure** capitalism?",
        options: [{ t: "No — it's a mixed economy that leans toward capitalism" },
                  { t: "Yes — the government stays out of business completely", fb: "The US government sets rules for fair competition, taxes, and helps people who are out of work. That's a mix." },
                  { t: "No — it's socialism", fb: "Most US businesses are privately owned and markets set most prices. It leans toward capitalism." }],
        answer: 0, keep: true,
        why: "Pure capitalism and pure communism are extremes. Real economies — the US included — mix them." },
      { type: "learn", kicker: "Real world",
        prompt: "China's government is communist. But since joining the World Trade Organization in 2001, China has welcomed private businesses, profit and competition.",
        art: photo("mccafe", "A McCafé in China, fitted into a traditional building."),
        after: "China is now the world's largest maker of phones, PCs and tablets. Real economies mix systems." },
      { type: "stops", kicker: "Your turn", skill: "Economic systems",
        prompt: "In Nordland, the government owns the railways, the power company and the phone network. Taxes are high and health care is free. Shops and restaurants are privately owned.<br><br>Move to the system that fits Nordland.",
        left: "The government decides", right: "The market decides", stops: L5_STOPS, start: 3, answer: "soc",
        fb: { com: "In communism the government owns almost everything — but Nordland's shops and restaurants are private.", mix: "Close! But government ownership of the basic industries, with high taxes for free services, is the mark of socialism.", cap: "Under capitalism the railways and power company would be private." },
        hints: ["Who owns the big, basic industries?", "Government owns basic industries, small businesses are private, taxes pay for services: that's…"],
        why: "The government runs the basic industries, smaller businesses are private, and high taxes pay for services: socialism." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why do planned economies like communism often run short of things people want?",
        model: "Planners, not buyers and sellers, decide what to make and how much. They can't react quickly to what people actually want, so some goods run short." },
      { type: "multi", kicker: "Put it together", skill: "Economic systems",
        prompt: "Which of these are true of **capitalism**? Pick all that apply.",
        options: [{ t: "Businesses are privately owned", ok: true, fb: "Yes — private ownership is central." },
                  { t: "The chance of profit drives people to start businesses", ok: true, fb: "Yes — profit is the main incentive." },
                  { t: "The government sets the price of most goods", ok: false, fb: "No — in capitalism, supply and demand set prices." },
                  { t: "Competition pushes prices down", ok: true, fb: "Yes — high profits attract rivals, and prices fall." },
                  { t: "The government assigns people their jobs", ok: false, fb: "No — people are free to choose their work." }],
        hints: ["Think of the four rights: property, profit, free choice, competition."],
        why: "Capitalism: private ownership, the profit motive, free choice and competition. Prices come from the market, not the government." }
    ]
  };

  var L5_DESC = [
    ["The government owns almost every business and decides what each factory makes and what it charges.", "com"],
    ["Central planners decide how many shoes the country makes this year, and who gets them.", "com"],
    ["People can't choose their careers; the state assigns jobs as a duty to society.", "com"],
    ["The government runs the railways, electricity and phone networks, but shops and cafés are private.", "soc"],
    ["High taxes pay for free health care and generous unemployment benefits; basic industries are state-run.", "soc"],
    ["Most businesses are privately owned, but the government runs the post office and sets rules for fair competition.", "mix"],
    ["Markets set most prices, while the government provides a safety net for people out of work.", "mix"],
    ["Private owners run nearly every business, and supply and demand set prices with almost no government role.", "cap"],
    ["Anyone may start a business, keep the profit, and compete with anyone else — the government stays out.", "cap"]
  ];
  var L5_NAME = { com: "Communism", soc: "Socialism", mix: "A mixed economy", cap: "Capitalism" };
  var L5_WHY = { com: "Government owns nearly everything and plans centrally — communism.", soc: "Government runs the basic industries, the rest is private, taxes fund services — socialism.",
                 mix: "Mostly private and market-driven, with some government role — a mixed economy.", cap: "Private ownership and markets with little government role — capitalism." };

  SKILLS.push(
    { id: "biz1-systems", title: "Economic systems", lesson: 5,
      gen: function (R, i) {
        var t = i % 4;
        if (t === 0 || t === 3) {
          var d = R.pick(L5_DESC);
          if (t === 3) {
            return { type: "stops", prompt: "“" + d[0] + "”<br><br>Move to the system this describes.", left: "The government decides", right: "The market decides",
              stops: L5_STOPS, start: d[1] === "cap" ? 0 : 3, answer: d[1], hints: ["Who owns the businesses, and who sets prices?"], why: L5_WHY[d[1]] };
          }
          return mc(R, { prompt: "“" + d[0] + "”<br><br>Which economic system is this?", keep: true, right: L5_NAME[d[1]],
            wrong: ["com", "soc", "mix", "cap"].filter(function (k) { return k !== d[1]; }).map(function (k) { return { t: L5_NAME[k], fb: L5_WHY[d[1]] }; }),
            hints: ["Who owns businesses — and who decides prices?"], why: L5_WHY[d[1]] });
        }
        if (t === 1) {
          var rights = ["The right to own property", "The right to make a profit", "The right to make free choices", "The right to compete"];
          var notR = R.pick(["The right to a job chosen by the government", "The right to have prices set by the state", "The right to be protected from all competition", "The right to a guaranteed profit"]);
          return mc(R, { prompt: "Which of these is **not** one of the rights capitalism promises?", right: notR,
            wrong: sample(R, rights, 3).map(function (x) { return { t: x, fb: "That is one of capitalism's four rights: property, profit, free choice, competition." }; }),
            hints: ["The four rights: own property, make a profit, make free choices, compete."], why: "Capitalism's rights are to own property, make a profit, make free choices and compete. “" + notR + "” isn't one." });
        }
        var qs = [
          { p: "What is economics the study of?", r: "How a society uses scarce resources to make and share out goods and services",
            w: [{ t: "How to get rich in business", fb: "Economics is broader: it's about choices with limited resources, for everyone." }, { t: "How banks print money", fb: "That's one small part at most. Economics is about choices with scarce resources." }] },
          { p: "Why does every economy have to make choices?", r: "Resources are limited, but people's wants are not",
            w: [{ t: "Because governments like to decide", fb: "Even with no government, scarcity would force choices." }, { t: "Because money runs out only in poor countries", fb: "Every country, rich or poor, has limited resources." }] },
          { p: "What is the biggest difference between economic systems?", r: "Whether the government or the market decides what's made, how, and for whom",
            w: [{ t: "How much money each country has", fb: "Rich and poor countries use every kind of system. The difference is who decides." }, { t: "What language business is done in", fb: "No — the difference is who makes the economic decisions." }] },
          { p: "When profits in an industry are high, what tends to happen under capitalism?", r: "New businesses join in, and competition pushes prices down",
            w: [{ t: "The government raises prices further", fb: "In capitalism the government doesn't set prices." }, { t: "Existing businesses keep the profits forever", fb: "High profits attract rivals, who compete them down." }] }];
        var Q = R.pick(qs);
        return mc(R, { prompt: Q.p, right: Q.r, wrong: Q.w, hints: ["Think: scarcity, choices, and who decides."], why: Q.r + "." });
      } }
  );

  /* ============================================================== Lesson 6
     The big picture and the small (1.3): macroeconomics and
     microeconomics, the circular flow, and how one flow moves the others. */
  LESSONS[6] = {
    title: "The big picture and the small",
    blurb: "The whole economy and its parts — and the loop that ties households, businesses and government together.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "In which system do planners in the central government decide what factories make and what things cost?",
        options: [{ t: "Communism" }, { t: "Capitalism", fb: "In capitalism, buyers and sellers in the market decide." },
                  { t: "A mixed economy", fb: "In a mixed economy, the market decides most things." }],
        answer: 0, keep: true, hints: ["Which system puts nearly everything in the government's hands?"], why: "Central planning of what to make and at what price is communism." },
      { type: "choice", kicker: "Guess first",
        prompt: "Two headlines:<br>**A.** “Unemployment falls across the country.”<br>**B.** “Toyota raises the price of one of its SUVs.”<br><br>Which one is about the **whole** economy?",
        art: tiles([{ i: "globe", t: "A: the whole country", c: "blue" }, { i: "car", t: "B: one company", c: "orange" }]),
        options: [{ t: "A" }, { t: "B", fb: "Toyota is big, but it's one company and one product. A is about every worker in the country." },
                  { t: "Both", fb: "B is about one company's price — just one part of the economy." }],
        answer: 0, keep: true, why: "A is about the whole economy; B is about one business." },
      { type: "learn", kicker: "Two ways to look",
        prompt: "Economics looks at the economy two ways. Turn over both cards.",
        scene: { type: "flip", cols: 2, cards: [
          { i: "globe", name: "Macroeconomics", c: "blue", t: "The economy **as a whole**: total output, unemployment, prices overall, interest rates." },
          { i: "store", name: "Microeconomics", c: "orange", t: "The **parts**: one household, one company, one product's price and sales." }] },
        gate: true, then: "Macro looks at the whole forest. Micro looks at the trees." },
      { type: "sort", skill: "Macro or micro",
        prompt: "Toyota is deciding whether to launch a new line of cars. Sort what it looks at.",
        bins: ["Macro (whole economy)", "Micro (one market or firm)"],
        cards: [{ t: "The national unemployment rate", bin: 0, fb: "A number for the whole country — macro." },
                { t: "How many people want a new hybrid SUV", bin: 1, fb: "Demand for one product — micro." },
                { t: "Interest rates across the economy", bin: 0, fb: "Rates across the whole economy — macro." },
                { t: "The price of a rival's SUV", bin: 1, fb: "One competitor's price — micro." },
                { t: "Total new-car sales nationwide", bin: 0, fb: "A total for the whole nation — macro." },
                { t: "What steel costs Toyota", bin: 1, fb: "One company's costs — micro." }],
        hints: ["Is it a total for the whole country, or about one product or company?"],
        why: "National totals and rates are macro. One product, one company's costs, one rival's price are micro." },
      { type: "choice", kicker: "Careful", skill: "Macro or micro",
        prompt: "Amazon changes the price of its Prime membership.<br><br>Is that macroeconomics or microeconomics?",
        options: [{ t: "Microeconomics" }, { t: "Macroeconomics — Amazon is huge", fb: "Size doesn't decide it. It's still one company's price — micro." }],
        answer: 0, keep: true, why: "However big the company, one firm's price is microeconomics. Macro is about the whole economy." },
      { type: "learn", kicker: "Try it",
        prompt: "Every economy runs in a loop. Tap each of the four lanes to see what moves along it.",
        scene: { type: "flow", only: ["inputs", "income", "goods", "spending"] },
        gate: true, then: "This loop is the **circular flow**. Money goes one way; inputs, goods and services go the other." },
      { type: "flow", kicker: "Your turn", skill: "Circular flow",
        prompt: "You buy a pizza.<br><br>Tap the lane that shows your money going to the pizza shop.",
        only: ["inputs", "income", "goods", "spending"], answer: "spending",
        hints: ["It's money, so it's a yellow lane.", "It goes from a household to a business."],
        why: "Paying for a pizza is household spending: money from households to businesses. For the shop, it's revenue." },
      { type: "learn", kicker: "Add the government",
        prompt: "Now add the government. Tap every lane — especially the four new ones.",
        scene: { type: "flow" },
        gate: true, then: "The government collects **taxes**, provides **public goods and services** like roads and schools, and **buys** from businesses." },
      { type: "flow", skill: "Circular flow",
        prompt: "The state pays a construction company to repair a highway.<br><br>Tap that lane.",
        answer: "purchases",
        hints: ["Money is moving from the government to a business."],
        why: "That's a government purchase: money from the government to a business — more revenue for the builder." },
      { type: "learn", kicker: "Watch",
        prompt: "Change one flow and the others move. Suppose the government **raises taxes**.",
        scene: { type: "chain", steps: [
          { i: "capitol", t: "Taxes go up.", c: "purple" },
          { i: "house", t: "Households have less left to spend.", c: "green" },
          { i: "factory", t: "Businesses sell less, so they make less.", c: "orange" },
          { i: "worker", t: "Some workers lose their jobs — and their incomes.", c: "red" },
          { i: "down", t: "Less income means even less spending. The economy slows.", c: "red" }] },
        gate: true, then: "Cutting taxes pushes the other way: more spending, more production, more jobs." },
      { type: "explain", kicker: "In your own words",
        prompt: "A tax rise can cost jobs at a business that pays no extra tax itself. How?",
        model: "Households pay more tax, so they spend less. Businesses sell less, so they produce less and need fewer workers — even businesses whose own taxes didn't change." },
      { type: "choice", kicker: "Put it together", skill: "Circular flow",
        prompt: "The government **cuts** taxes on households.<br><br>What is most likely to happen next?",
        options: [{ t: "Households spend more, so businesses sell and produce more" },
                  { t: "Businesses produce less, because the government has less money", fb: "Follow the loop: households keep more of their income, so they spend more at businesses." },
                  { t: "Nothing — taxes only affect the government", fb: "Every flow is linked. Lower taxes leave households more to spend." }],
        answer: 0, keep: true, hints: ["Start in the household box: what do they have more of?"],
        why: "Lower taxes leave households more income to spend. Businesses sell more, produce more, and may hire more." }
    ]
  };

  var L6_MACRO = ["The country's unemployment rate", "Prices rising across the whole economy", "The nation's total output of goods and services", "Interest rates set for the whole banking system",
                  "Total spending by all US households", "The size of the national debt", "Whether the whole economy is in a recession", "Average income in the United States"];
  var L6_MICRO = ["The price of a movie ticket at one theater", "How many sneakers one shoe company sells", "A family deciding whether to buy a car", "What steel costs a car maker",
                  "Demand for electric scooters in one city", "A coffee shop setting the price of a latte", "Why one restaurant's sales fell", "A company deciding how many workers to hire"];
  var L6_FLOWQ = [
    ["You're paid wages for your weekend job", "income"], ["A family buys groceries", "spending"], ["A factory turns steel into cars that people buy", "goods"],
    ["People supply their work and skills to companies", "inputs"], ["A worker pays income tax", "taxH"], ["A company pays tax on its profits", "taxB"],
    ["The city builds a park and runs the public schools", "services"], ["The army buys trucks from a truck maker", "purchases"], ["A landlord receives rent from a business", "income"]
  ];
  var L6_LANE = { inputs: "Inputs: households → businesses", income: "Income: businesses → households", goods: "Goods and services: businesses → households", spending: "Spending: households → businesses",
                  taxH: "Taxes: households → government", services: "Public services: government → households", taxB: "Taxes: businesses → government", purchases: "Government purchases: government → businesses" };

  SKILLS.push(
    { id: "biz1-macro", title: "Macroeconomics or microeconomics", lesson: 6,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 2) {
          var a = sample(R, L6_MACRO, 2), b = sample(R, L6_MICRO, 2);
          var cards = a.map(function (x) { return { t: x, bin: 0, fb: "That's about the whole economy — macro." }; })
            .concat(b.map(function (x) { return { t: x, bin: 1, fb: "That's about one household, firm or market — micro." }; }));
          return { type: "sort", prompt: "Sort each into macroeconomics or microeconomics.", bins: ["Macroeconomics", "Microeconomics"], cards: R.shuffle(cards),
                   hints: ["Whole economy, or one part of it?"], why: "Macro: totals and rates for the whole economy. Micro: one household, company or market." };
        }
        var mac = R.chance(0.5), x = R.pick(mac ? L6_MACRO : L6_MICRO);
        return mc(R, { prompt: "“" + x + ".”<br><br>Is this macroeconomics or microeconomics?", keep: true,
          right: mac ? "Macroeconomics" : "Microeconomics",
          wrong: [{ t: mac ? "Microeconomics" : "Macroeconomics", fb: mac ? "This is about the economy as a whole, not one part." : "This is about one household, company or market — a part, not the whole." }],
          hints: ["Is it about the whole economy, or one part?"], why: mac ? "The economy as a whole: macroeconomics." : "One part of the economy: microeconomics." });
      } },
    { id: "biz1-flow", title: "The circular flow", lesson: 6,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 0) {
          var q = R.pick(L6_FLOWQ);
          return { type: "flow", prompt: "“" + q[0] + ".”<br><br>Tap the lane in the circular flow that shows this.", answer: q[1],
                   hints: ["Is money moving (yellow), or real things (blue)?", "Who gives, and who receives?"], why: "This is " + L6_LANE[q[1]].toLowerCase() + "." };
        }
        if (t === 1) {
          var q2 = R.pick(L6_FLOWQ), ks = Object.keys(L6_LANE).filter(function (k) { return k !== q2[1]; });
          return mc(R, { prompt: "“" + q2[0] + ".”<br><br>Which flow is this?", right: L6_LANE[q2[1]],
            wrong: sample(R, ks, 3).map(function (k) { return { t: L6_LANE[k], fb: "Ask what is moving (money or real things) and from whom to whom." }; }),
            hints: ["Who pays or supplies, and who receives?"], why: "This is " + L6_LANE[q2[1]].toLowerCase() + "." });
        }
        var sh = R.pick([
          { p: "The government raises taxes on households.", r: "Households spend less, so businesses produce less", w: "Households spend more, so businesses produce more" },
          { p: "The government cuts taxes on households.", r: "Households spend more, so businesses produce more", w: "Households spend less, so businesses produce less" },
          { p: "The government spends more on building roads.", r: "Construction companies take in more revenue and hire more", w: "Businesses take in less, because the government is spending" },
          { p: "Households decide to save much more and spend less.", r: "Businesses sell less, so they produce less", w: "Businesses sell more, so they produce more" }]);
        return mc(R, { prompt: sh.p + "<br><br>What is most likely to happen next?", right: sh.r,
          wrong: [{ t: sh.w, fb: "Follow the loop from where the change starts." }, { t: "Nothing else changes", fb: "Every flow is linked: change one and the others move." }],
          hints: ["Start where the change happens and follow the money."], why: "The flows are linked: " + sh.r.charAt(0).toLowerCase() + sh.r.slice(1) + "." });
      } }
  );

  /* ============================================================== Lesson 7
     Is the economy growing? (1.4): the three macroeconomic goals, economic
     growth, GDP and real GDP, business cycles, recessions, capacity. */
  LESSONS[7] = {
    title: "Is the economy growing?",
    blurb: "GDP, the ups and downs of the business cycle, and what makes a recession.",
    mins: 11,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“The country's unemployment rate rose last month.”<br><br>Is that macroeconomics or microeconomics?",
        options: [{ t: "Macroeconomics" }, { t: "Microeconomics", fb: "It's a number for the whole country, not one firm or household." }],
        answer: 0, keep: true, why: "A rate for the whole economy is macroeconomics." },
      { type: "learn", kicker: "Look",
        prompt: "How do you check whether a whole country's economy is healthy? Most countries aim for three goals.",
        art: tiles([{ i: "up", t: "Economic growth", c: "green" }, { i: "worker", t: "Full employment", c: "blue" }, { i: "tag", t: "Price stability", c: "orange" }], "This lesson: growth. Next: jobs, then prices."),
        after: "**Economic growth** means the country makes more goods and services than before. The more it makes, the higher its standard of living." },
      { type: "learn", kicker: "New word",
        prompt: "Growth is measured with **GDP** (gross domestic product): the total market value of all final goods and services produced within a nation's borders in a year.<br><br>That's a mouthful. Turn over each part.",
        scene: { type: "flip", cols: 4, cards: [
          { i: "tag", name: "Market value", c: "blue", t: "Each thing counts at its **price** — so a car counts for more than a candy bar." },
          { i: "box", name: "Final goods", c: "green", t: "Only things sold to their **final user**. The tires sold to a car maker are already inside the car's price." },
          { i: "flag", name: "Within the borders", c: "purple", t: "**Where** it's made, not who owns the company. A Japanese company's Ohio factory counts in US GDP." },
          { i: "calendar", name: "In a year", c: "orange", t: "Only what's **made this year**. A used bike was counted the year it was new." }] },
        gate: true, then: "One more thing: if every price doubled, GDP would double with nothing more made. So growth is measured with **real GDP** — GDP adjusted for rising prices." },
      { type: "sort", skill: "GDP",
        prompt: "Which of these count in this year's US GDP?",
        bins: ["Counts", "Doesn't count"],
        cards: [{ t: card("car", "A new car built in Ohio by a Japanese company"), bin: 0, fb: "It was made inside US borders this year. Who owns the company doesn't matter." },
                { t: card("gear", "Tires sold to a car maker for its new cars"), bin: 1, fb: "The tires are part of the car. Counting them too would count them twice." },
                { t: card("bike", "A used bike sold online"), bin: 1, fb: "It was counted in the year it was made. Selling it again makes nothing new." },
                { t: card("scissors", "A haircut in Denver"), bin: 0, fb: "Services count too — and this one was produced in the US this year." },
                { t: card("shoe", "Sneakers a US company makes in Vietnam"), bin: 1, fb: "They're made outside US borders, so they count in Vietnam's GDP." },
                { t: card("house", "A new house built this year"), bin: 0, fb: "A final good, made in the US, this year." }],
        hints: ["Check each: final? made inside the borders? made this year?"],
        why: "GDP counts final goods and services made inside the country this year — not parts, not used goods, not things made abroad." },
      { type: "amount", kicker: "Your turn", skill: "GDP",
        prompt: "A tiny island makes only three final goods this year: 100 coconuts at \\$2, 20 fishing nets at \\$15, and 4 boats at \\$500.<br><br>What is the island's GDP?",
        pre: "\\$", answer: 2500,
        near: [{ v: 124, fb: "That adds up how many things were made. GDP adds up their market **value**: quantity × price for each." },
               { v: 517, fb: "That adds the prices. Multiply each price by how many were made first." }],
        hints: ["Find the value of each good: quantity × price.", "Coconuts \\$200, nets \\$300, boats \\$2,000. Now add."],
        why: "100 × \\$2 = \\$200.<br>20 × \\$15 = \\$300.<br>4 × \\$500 = \\$2,000.<br>GDP = \\$2,500." },
      { type: "learn", kicker: "Explore",
        prompt: "Real GDP doesn't rise smoothly. Drag through three years of an economy, quarter by quarter. Go all the way to the end.",
        scene: { type: "cycle" },
        gate: true, then: "These ups and downs are **business cycles**: expansion, peak, contraction, trough, then recovery." },
      { type: "learn", kicker: "New word",
        prompt: "A **recession** is a decline in GDP that lasts at least **two quarters in a row**. A quarter is three months.",
        art: tiles([{ i: "down", t: "The Great Recession: Dec 2007 – June 2009", c: "red" }, { i: "hospital", t: "The COVID-19 recession: 2020", c: "red" }]) },
      { type: "cycle", kicker: "Your turn", skill: "Business cycle",
        prompt: "Here is real GDP for ten quarters.<br><br>Tap every quarter that is part of a recession.",
        ask: "recession", data: [20.0, 20.2, 20.5, 20.4, 20.6, 20.8, 20.7, 20.5, 20.3, 20.6],
        hints: ["Find the quarters where GDP fell compared with the quarter before.", "Only runs of two or more falls in a row count."],
        why: "GDP fell in Q4 — but only once, so that's no recession. It then fell in Q7, Q8 and Q9: three quarters in a row, a recession." },
      { type: "choice", kicker: "Careful", skill: "Business cycle",
        prompt: "GDP fell for one quarter, then grew again.<br><br>Was that a recession?",
        options: [{ t: "No — it takes at least two quarters of decline in a row" },
                  { t: "Yes — any fall in GDP is a recession", fb: "A single bad quarter isn't enough. The rule is two quarters in a row." }],
        answer: 0, keep: true, why: "A recession is a decline lasting at least two consecutive quarters." },
      { type: "learn", kicker: "Why it matters",
        prompt: "In a recession, businesses sell less. Watch what that does to a cookie factory's costs.",
        scene: { type: "walk", rows: [
          { m: "\\text{10,000} \\div \\text{1,000,000} = 0.01", say: "Its big machines cost \\$10,000 a day to run. At full speed it makes 1,000,000 boxes: **1 cent** of machine cost per box." },
          { m: "\\text{10,000} \\div \\text{500,000} = 0.02", say: "In a recession it can sell only half as many. The machines still cost \\$10,000: now **2 cents** per box." }] },
        gate: true, then: "Running below **capacity** makes every item cost more. In a boom, the opposite problem: it's hard to find workers and supplies." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why should GDP not count the tires a car maker buys for its new cars?",
        model: "The tires' value is already inside the price of the finished car. Counting both would count the tires twice." },
      { type: "choice", kicker: "Put it together", skill: "Business cycle",
        prompt: "Real GDP for four quarters: \\$21.0 trillion, \\$21.3 trillion, \\$21.2 trillion, \\$21.1 trillion.<br><br>What is happening?",
        options: [{ t: "A peak, then two quarters of decline — a recession" },
                  { t: "An expansion — GDP is above \\$21 trillion", fb: "The level doesn't matter; the direction does. GDP fell twice in a row." },
                  { t: "Just one bad quarter — no recession", fb: "Count again: \\$21.3 → \\$21.2 → \\$21.1 is two falls in a row." }],
        answer: 0, keep: true, hints: ["Look at the direction from each quarter to the next."],
        why: "Up to \\$21.3 trillion (the peak), then down twice in a row: a recession." }
    ]
  };

  var L7_GDP = [
    ["A new laptop assembled in Texas this year", 1, "A final good made inside the US this year."],
    ["A haircut in Chicago", 1, "Services count, and this one was produced in the US this year."],
    ["A Honda built at its factory in Ohio", 1, "Made inside US borders — who owns the company doesn't matter."],
    ["A new house built in Florida this year", 1, "A final good made in the US this year."],
    ["A concert ticket for a show in Nashville", 1, "A service produced in the US this year."],
    ["A doctor's visit in Boston", 1, "Services count."],
    ["Flour sold to a bakery to make bread", 0, "The flour is part of the bread. Counting both would count it twice."],
    ["Steel sold to a car maker", 0, "The steel ends up inside the cars. Only the final cars count."],
    ["A used car sold by its owner", 0, "It was counted the year it was new; nothing new was made."],
    ["A 1990s video game console resold online", 0, "Made years ago — resale adds nothing new this year."],
    ["Phones an American company makes in China", 0, "Made outside US borders — they count in China's GDP."],
    ["Chips sold to a phone maker to put in its phones", 0, "The chips are inside the finished phones. Only the phones count."]
  ];
  var L7_ISLE = [["coconuts", 2, [50, 100, 200]], ["fish", 3, [100, 200, 300]], ["fishing nets", 15, [10, 20, 40]], ["boats", 500, [2, 3, 4]], ["huts", 800, [1, 2, 5]], ["surf lessons", 20, [10, 30, 50]]];

  SKILLS.push(
    { id: "biz1-gdp", title: "GDP", lesson: 7,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 0) {
          var x = R.pick(L7_GDP);
          return mc(R, { prompt: "Does this count in this year's US GDP?<br><br>“" + x[0] + ".”", keep: true,
            right: x[1] ? "Yes, it counts" : "No, it doesn't",
            wrong: [{ t: x[1] ? "No, it doesn't" : "Yes, it counts", fb: x[2] }],
            hints: ["Check: final? made inside the US? made this year?"], why: x[2] });
        }
        if (t === 1) {
          var inn = R.pick(L7_GDP.filter(function (x) { return x[1]; })), outs = sample(R, L7_GDP.filter(function (x) { return !x[1]; }), 3);
          return mc(R, { prompt: "Which one counts in this year's US GDP?", right: inn[0],
            wrong: outs.map(function (x) { return { t: x[0], fb: x[2] }; }),
            hints: ["GDP: final goods and services, made in the country, this year."], why: inn[0] + ": " + inn[2].charAt(0).toLowerCase() + inn[2].slice(1) });
        }
        var goods = sample(R, L7_ISLE, 3).map(function (g) { return { n: g[0], p: g[1], q: R.pick(g[2]) }; });
        var tot = goods.reduce(function (a, g) { return a + g.p * g.q; }, 0);
        return { type: "amount", prompt: "An island makes only these final goods and services this year: " +
            goods.map(function (g) { return g.q + " " + g.n + " at " + usd(g.p); }).join(", ") + ".<br><br>What is its GDP?", pre: "\\$", answer: tot,
          near: [{ v: goods.reduce(function (a, g) { return a + g.q; }, 0), fb: "That counts the items. GDP adds up their market value: quantity × price." },
                 { v: goods.reduce(function (a, g) { return a + g.p; }, 0), fb: "That adds the prices. Multiply each price by the quantity first." }].filter(function (n) { return n.v !== tot; }),
          hints: ["For each good: quantity × price.", "Then add the three values."],
          why: goods.map(function (g) { return g.q + " × " + usd(g.p) + " = " + usd(g.p * g.q); }).join("<br>") + "<br>GDP = " + usd(tot) + "." };
      } },
    { id: "biz1-cycle", title: "The business cycle", lesson: 7,
      gen: function (R, i) {
        var t = i % 4;
        // A quarterly series: rises, maybe a single dip, maybe a recession.
        function series(withRec, withDip) {
          var d = [R.int(180, 220) / 10], n = 9;
          var recAt = withRec ? R.int(3, 5) : -1, recLen = R.pick([2, 3]), dipAt = withDip ? (withRec ? recAt + recLen + 1 : R.int(2, 6)) : -1;
          for (var k = 1; k < n; k++) {
            var ch = R.pick([1, 2, 3]) / 10;
            if (withRec && k >= recAt && k < recAt + recLen) ch = -ch;
            if (k === dipAt) ch = -0.1;
            d.push(round(d[k - 1] + ch, 1));
          }
          return d;
        }
        if (t === 0 || t === 2) {
          var d = series(true, R.chance(0.6));
          if (t === 2) return { type: "cycle", prompt: "Real GDP by quarter, in trillions of dollars.<br><br>Tap every quarter that is part of a recession.", ask: "recession", data: d,
            hints: ["Which quarters are lower than the quarter before?", "Keep only runs of two or more in a row."],
            why: "A recession is two or more quarters of falling GDP in a row: Q" + B.cycleRecession(d).map(function (k) { return k + 1; }).join(", Q") + "." };
          var rq = B.cycleRecession(d);
          return mc(R, { prompt: "Real GDP by quarter (trillions of dollars):<br>" + d.map(function (v, k) { return "Q" + (k + 1) + ": " + usd(v, { dp: 1 }); }).join(" · ") +
              "<br><br>When was the economy in a recession?",
            right: "Q" + (rq[0] + 1) + " to Q" + (rq[rq.length - 1] + 1),
            wrong: [{ t: "Never — GDP ended higher than it started", fb: "Where it ends doesn't matter. Look for two or more falls in a row." },
                    { t: "Q" + rq[0] + " to Q" + (rq[rq.length - 1] + 1), fb: "Q" + rq[0] + " is the peak — GDP hadn't fallen yet. Start from the first quarter that is lower than the one before." }],
            hints: ["Compare each quarter with the one before it.", "A recession is at least two falls in a row."],
            why: "GDP fell from Q" + (rq[0] + 1) + " through Q" + (rq[rq.length - 1] + 1) + " — " + rq.length + " quarters in a row: a recession." });
        }
        if (t === 1) {
          var ph = R.pick([
            ["Output, jobs and incomes are rising, and factories struggle to find enough workers.", "Expansion"],
            ["Activity has hit its highest point and is about to turn down.", "Peak"],
            ["Output is falling, sales drop and some businesses lay workers off.", "Contraction"],
            ["Output has stopped falling and is at its lowest point.", "Trough"],
            ["Output is growing again but hasn't reached the old high yet.", "Recovery"]]);
          var others = ["Expansion", "Peak", "Contraction", "Trough", "Recovery"].filter(function (x) { return x !== ph[1]; });
          return mc(R, { prompt: "“" + ph[0] + "”<br><br>Which phase of the business cycle is this?", right: ph[1],
            wrong: sample(R, others, 3).map(function (x) { return { t: x, fb: "Read it again: is output rising, at the top, falling, at the bottom, or climbing back?" }; }),
            hints: ["Up, top, down, bottom, back up: expansion, peak, contraction, trough, recovery."], why: "That describes the " + ph[1].toLowerCase() + "." });
        }
        return mc(R, { prompt: "A factory's machines cost the same to run whether it's busy or not. In a recession it sells half as much.<br><br>What happens to its cost for each item it makes?",
          right: "It goes up", wrong: [{ t: "It goes down", fb: "The same machine cost is now spread over half as many items — each one carries more of it." },
                                       { t: "It stays the same", fb: "Fewer items share the same machine cost, so each item's share grows." }],
          hints: ["Divide the same cost by fewer items."], why: "The same cost spread over fewer items makes each item cost more — that's why running below capacity is inefficient." });
      } }
  );

  /* ============================================================== Lesson 8
     Jobs for everyone? (1.4): full employment, the labor force and the
     unemployment rate, discouraged workers, the four types of unemployment. */
  LESSONS[8] = {
    title: "Jobs for everyone?",
    blurb: "Who counts as unemployed, how the rate is worked out, and the four kinds of unemployment.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "GDP falls in one quarter, then falls again the next quarter.<br><br>What is that?",
        options: [{ t: "A recession" }, { t: "A peak", fb: "The peak is the high point before the fall. Two falls in a row is a recession." },
                  { t: "An expansion", fb: "An expansion is when GDP grows. Here it shrank twice." }],
        answer: 0, keep: true, why: "Two quarters of falling GDP in a row is a recession." },
      { type: "choice", kicker: "Guess first",
        prompt: "The economy is said to be at **full employment**.<br><br>About what share of the people available to work have jobs?",
        options: [{ t: "About 95%" }, { t: "100% — everyone", fb: "Even in great times, some people are between jobs or just starting to look. So 100% never happens." },
                  { t: "About 50%", fb: "That would be a deep crisis, not full employment." }],
        answer: 0, keep: true,
        why: "Full employment is counted as about 94–96% of those available to work having jobs." },
      { type: "learn", kicker: "New word",
        prompt: "**Full employment** means jobs for all who want to work and can. But some people are always between jobs, or just finishing school.<br><br>So about **4–6%** unemployment is normal, even in good times.",
        art: tiles([{ i: "person", t: "Between jobs", c: "orange" }, { i: "cap", t: "Just graduated, looking", c: "blue" }, { i: "worker", t: "About 95% working", c: "green" }]) },
      { type: "learn", kicker: "Try it",
        prompt: "Here's a small town. Tap a person, then the box they belong in.",
        scene: { type: "labor" },
        gate: true,
        then: "The **labor force** is everyone working plus everyone looking for work. The **unemployment rate** is the share of the labor force that has no job and is looking." },
      { type: "choice", kicker: "Careful",
        prompt: "Hugo has stopped looking for work because he thinks nobody will hire him.<br><br>Is Hugo counted as unemployed?",
        options: [{ t: "No — he isn't looking, so he isn't in the labor force" },
                  { t: "Yes — he doesn't have a job", fb: "No job isn't enough. To count as unemployed you must be actively looking. Hugo is a **discouraged worker** — left out of the rate." }],
        answer: 0, keep: true,
        why: "Discouraged workers aren't counted. So the rate can fall when people give up looking — even though no one found a job." },
      { type: "amount", kicker: "Your turn", skill: "Unemployment rate",
        prompt: "A town has **180** people with jobs and **20** people without jobs who are looking. Another 50 are retired or in school.<br><br>What is the unemployment rate?",
        post: "%", answer: 10,
        near: [{ v: 8, fb: "Leave out the 50 retired people and students — they aren't in the labor force." },
               { v: 11.1, tol: 0.1, fb: "Divide by the whole labor force (180 + 20), not just those with jobs." }],
        hints: ["Labor force = employed + unemployed = 180 + 20.", "Rate = unemployed ÷ labor force."],
        why: "Labor force: 180 + 20 = 200.<br>Rate: 20 ÷ 200 = 0.10 = 10%." },
      { type: "learn", kicker: "Four kinds",
        prompt: "Not all unemployment is the same. Economists name four kinds. Turn over each card.",
        scene: { type: "flip", cols: 4, cards: [
          { i: "arrow", name: "Frictional", c: "blue", t: "Short gaps between jobs — quitting for a better one, or looking for a first job. Always there; mostly harmless." },
          { i: "gear", name: "Structural", c: "purple", t: "Workers' skills or location don't match the jobs. Retraining helps." },
          { i: "down", name: "Cyclical", c: "red", t: "A downturn in the business cycle cuts jobs everywhere — even skilled people can't find work." },
          { i: "snow", name: "Seasonal", c: "orange", t: "Jobs that end with a season: holiday shops, harvests, ski resorts." }] },
        gate: true },
      { type: "sort", skill: "Types of unemployment",
        prompt: "Which kind of unemployment is each person facing?",
        bins: ["Frictional", "Structural", "Cyclical", "Seasonal"],
        cards: [{ t: "Jess quit to look for a better-paying job", bin: 0, fb: "A short, chosen gap between jobs — frictional." },
                { t: "A coal miner whose mine closed; local jobs need computer skills", bin: 1, fb: "His skills don't match the jobs around him — structural." },
                { t: "A factory worker laid off because nobody is buying during a recession", bin: 2, fb: "The downturn cut demand for workers — cyclical." },
                { t: "A lifeguard with no work after the summer", bin: 3, fb: "The job ends with the season — seasonal." }],
        hints: ["Ask why the job ended: a choice, a skills mismatch, a recession, or the season?"],
        why: "Frictional: between jobs. Structural: skills mismatch. Cyclical: recession. Seasonal: the season ended." },
      { type: "choice", kicker: "Real world", skill: "Types of unemployment",
        prompt: "In spring 2020, COVID-19 closed businesses everywhere, and US unemployment jumped to nearly 15%. It's since fallen back to about 4%.<br><br>What kind was most of that jump?",
        options: [{ t: "Cyclical — the whole economy suddenly shrank" },
                  { t: "Seasonal — it happened in spring", fb: "Seasonal jobs end every year with the season. This was a sudden, economy-wide collapse in demand." },
                  { t: "Frictional — people were between jobs by choice", fb: "Most didn't choose to leave. Demand for workers fell across the economy." }],
        answer: 0, keep: true, why: "A downturn that cuts demand for labor across the whole economy causes cyclical unemployment." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why isn't 0% unemployment a sensible goal?",
        model: "People are always changing jobs, finishing school or moving, and some jobs are seasonal. A little unemployment while people look for the right job is normal and even healthy." },
      { type: "amount", kicker: "Put it together", skill: "Unemployment rate",
        prompt: "Of 1,000 adults in a city: **900** work, **50** are looking for work, and **50** have given up looking.<br><br>What is the unemployment rate, to the nearest tenth of a percent?",
        post: "%", answer: 50 / 950 * 100, tol: 0.06, shown: "5.3",
        near: [{ v: 5, tol: 0.01, fb: "Don't divide by all 1,000 adults — only the labor force counts." },
               { v: 10, tol: 0.01, fb: "The 50 who gave up aren't unemployed in the numbers — they're discouraged workers, outside the labor force." },
               { v: 10.5, tol: 0.1, fb: "The 50 who gave up aren't in the labor force at all." }],
        hints: ["Who is in the labor force? The 900 working and the 50 looking.", "Rate = 50 ÷ 950."],
        why: "Labor force: 900 + 50 = 950 (the 50 who gave up are left out).<br>Rate: 50 ÷ 950 ≈ 0.0526 ≈ 5.3%." }
    ]
  };

  var L8_TYPE = { f: "Frictional", s: "Structural", c: "Cyclical", z: "Seasonal" };
  var L8_STORIES = [
    ["Ana just graduated from college and is interviewing for her first job.", "f"], ["Ben quit his job to look for one closer to home.", "f"], ["Cara moved to a new city and is looking for work there.", "f"],
    ["Dan left a job he disliked and is searching for a better one.", "f"],
    ["Eli's typing job was replaced by software, and he lacks the skills local employers want.", "s"], ["Fay's town lost its steel mill; the new jobs need nursing training.", "s"],
    ["Gus is a film-camera repairer, and almost no one uses film cameras anymore.", "s"], ["Hana's factory moved overseas, and the jobs nearby need coding skills.", "s"],
    ["Ian was laid off from a car plant when a recession cut car sales.", "c"], ["Jo lost her restaurant job when spending fell across the economy.", "c"],
    ["Kim's construction company laid off workers as the economy shrank.", "c"], ["Leo, a skilled engineer, can't find work during a deep recession.", "c"],
    ["Mia works at a ski resort that closes every spring.", "z"], ["Noah was hired for the holiday rush at a store and let go in January.", "z"],
    ["Omar picks strawberries only during harvest.", "z"], ["Pia is a beach lifeguard with no work in winter.", "z"]
  ];

  SKILLS.push(
    { id: "biz1-unrate", title: "The unemployment rate", lesson: 8,
      gen: function (R, i) {
        var t = i % 4;
        if (t === 3) {
          var who = R.pick([["A retired teacher", "out"], ["A high school student who isn't job-hunting", "out"], ["A person working 10 hours a week", "emp"],
                            ["A laid-off worker sending out applications", "unemp"], ["A person who stopped looking because they think no one will hire them", "out"],
                            ["A parent staying home by choice, not looking for work", "out"], ["A self-employed plumber", "emp"], ["A graduate interviewing for jobs", "unemp"]]);
          var L = { emp: "Employed — in the labor force", unemp: "Unemployed — in the labor force", out: "Not in the labor force" };
          return mc(R, { prompt: "“" + who[0] + ".”<br><br>How is this person counted?", keep: true, right: L[who[1]],
            wrong: Object.keys(L).filter(function (k) { return k !== who[1]; }).map(function (k) { return { t: L[k], fb: who[1] === "out" ? "Not working and not looking for work means outside the labor force — not counted as unemployed." :
              who[1] === "emp" ? "Any paid work, part-time or self-employed, counts as employed." : "No job but actively looking: unemployed." }; }),
            hints: ["Do they have a job? If not, are they looking?"], why: L[who[1]] + "." });
        }
        // Clean rates: pick the rate first.
        var rate = R.pick([4, 5, 6, 8, 10, 12, 15, 20, 25]), lf = R.pick([100, 200, 400, 500, 1000, 2000]);
        var un = lf * rate / 100, em = lf - un, out = R.int(1, 8) * lf / 10;
        if (t === 2) {
          var gave = R.pick([10, 20, 25, 50]) * lf / 1000 * 2;
          return mc(R, { prompt: "A town has " + count(em) + " employed and " + count(un) + " unemployed people looking for work. Then " + count(gave) + " of the unemployed give up looking.<br><br>What happens to the unemployment rate?",
            right: "It falls — even though no one found a job", wrong: [{ t: "It rises", fb: "The people who stop looking leave the labor force, so they're no longer counted as unemployed." },
              { t: "It stays the same", fb: "Fewer people count as unemployed now, so the rate changes." }],
            hints: ["Discouraged workers aren't counted as unemployed."], why: "Before: " + count(un) + " ÷ " + count(lf) + ". After: " + count(un - gave) + " ÷ " + count(lf - gave) + " — lower. The rate falls without anyone getting work." });
        }
        return { type: "amount", prompt: "A town has " + count(em) + " people with jobs and " + count(un) + " without jobs who are looking. " + count(out) + " more are retired, in school, or not looking.<br><br>What is the unemployment rate?",
          post: "%", answer: rate,
          near: [{ v: B.round(un / (lf + out) * 100, 1), tol: 0.1, fb: "Leave out the " + count(out) + " who aren't looking — they aren't in the labor force." },
                 { v: B.round(un / em * 100, 1), tol: 0.1, fb: "Divide by the whole labor force (employed + unemployed), not just the employed." }].filter(function (n) { return Math.abs(n.v - rate) > 0.2; }),
          hints: ["Labor force = employed + unemployed.", "Rate = unemployed ÷ labor force."],
          why: "Labor force: " + count(em) + " + " + count(un) + " = " + count(lf) + ".<br>Rate: " + count(un) + " ÷ " + count(lf) + " = " + num(rate / 100) + " = " + rate + "%." };
      } },
    { id: "biz1-untype", title: "Types of unemployment", lesson: 8,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 2) {
          var q = R.pick([
            { p: "Which kind of unemployment could a retraining program fix?", r: "Structural", why: "Structural unemployment is a skills mismatch — new skills fix it." },
            { p: "Which kind of unemployment shrinks when the economy recovers from a recession?", r: "Cyclical", why: "Cyclical unemployment comes from downturns and fades in recovery." },
            { p: "Which kind of unemployment is always present and has little effect on the economy?", r: "Frictional", why: "People are always moving between jobs — frictional unemployment." },
            { p: "Which kind of unemployment comes back at the same time every year?", r: "Seasonal", why: "Seasonal unemployment follows the calendar." }]);
          return mc(R, { prompt: q.p, right: q.r, wrong: ["Frictional", "Structural", "Cyclical", "Seasonal"].filter(function (x) { return x !== q.r; }).map(function (x) { return { t: x, fb: q.why }; }),
            hints: ["Frictional: between jobs. Structural: skills. Cyclical: recessions. Seasonal: the calendar."], why: q.why });
        }
        if (t === 1) {
          var st = [];
          ["f", "s", "c", "z"].forEach(function (k) { st.push(R.pick(L8_STORIES.filter(function (x) { return x[1] === k; }))); });
          return { type: "sort", prompt: "Sort each story by its kind of unemployment.", bins: ["Frictional", "Structural", "Cyclical", "Seasonal"],
            cards: R.shuffle(st.map(function (x) { return { t: x[0], bin: ["f", "s", "c", "z"].indexOf(x[1]), fb: "This is " + L8_TYPE[x[1]].toLowerCase() + " unemployment." }; })),
            hints: ["Why did the job end — a choice, a skills mismatch, a recession, or the season?"], why: "Frictional: between jobs. Structural: skills mismatch. Cyclical: a downturn. Seasonal: the season." };
        }
        var x = R.pick(L8_STORIES);
        return mc(R, { prompt: "“" + x[0] + "”<br><br>Which kind of unemployment is this?", keep: true, right: L8_TYPE[x[1]],
          wrong: ["f", "s", "c", "z"].filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: L8_TYPE[k], fb: "Look at why the job ended. This is " + L8_TYPE[x[1]].toLowerCase() + "." }; }),
          hints: ["A choice, a skills mismatch, a recession, or the season?"], why: "This is " + L8_TYPE[x[1]].toLowerCase() + " unemployment." });
      } }
  );

  /* ============================================================== Lesson 9
     When prices rise (1.4): price stability, inflation, purchasing power,
     demand-pull and cost-push inflation, the CPI and the PPI, who inflation
     hurts. */
  LESSONS[9] = {
    title: "When prices rise",
    blurb: "Inflation, what it does to your money, where it comes from, and how it's measured.",
    mins: 11,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "Mia works at a ski resort that closes every spring. From April to November she has no job.<br><br>What kind of unemployment is that?",
        options: [{ t: "Seasonal" }, { t: "Cyclical", fb: "Cyclical comes from recessions. Mia's job ends every year with the season." },
                  { t: "Structural", fb: "Her skills fit the job fine — the job simply ends with winter." }],
        answer: 0, keep: true, why: "A job that ends with the season: seasonal unemployment." },
      { type: "choice", kicker: "Guess first",
        prompt: "Last year a basket of groceries cost **\\$40**. This year the same basket costs **\\$50**. Your pay hasn't changed.<br><br>What happened to your money?",
        art: tiles([{ i: "basket", t: "Last year: $40", c: "green" }, { i: "arrow", t: "", c: "muted" }, { i: "basket", t: "This year: $50", c: "red" }]),
        options: [{ t: "It buys less than before" }, { t: "Nothing — I have the same amount", fb: "Same number of dollars — but each one buys less. That's the point." },
                  { t: "It's worth more, because prices are higher", fb: "Higher prices mean each dollar buys **less**, not more." }],
        answer: 0, keep: true, why: "The same pay buys fewer groceries when prices rise." },
      { type: "learn", kicker: "New words",
        prompt: "When the average of all prices rises, that's **inflation**. Inflation shrinks your **purchasing power** — the value of what your money can buy.<br><br>A country's third goal is **price stability**: prices that don't jump around.",
        art: tiles([{ i: "tag", t: "Prices go up", c: "red" }, { i: "cash", t: "Same money", c: "yellow" }, { i: "basket", t: "Buys less", c: "orange" }]) },
      { type: "learn", kicker: "Try it",
        prompt: "Push prices up 20%. Then find how much your pay has to rise so you can still buy **exactly as much** as before.",
        scene: { type: "basket", goal: "same", pay: 500 },
        gate: true,
        then: "Purchasing power depends on **two** things: prices **and** income. If pay rises as fast as prices, nothing changes. Slower, you're worse off; faster, better off." },
      { type: "amount", kicker: "Your turn", skill: "Purchasing power",
        prompt: "A basket went from \\$40 to \\$50, and your pay stayed the same.<br><br>What percent of the old basket can your money buy now?",
        post: "%", answer: 80,
        near: [{ v: 20, fb: "20% is how much you've **lost**. The question asks what you can still buy." },
               { v: 125, fb: "That divides the wrong way round. Divide the old price by the new: 40 ÷ 50." }, { v: 75, fb: "Divide 40 by 50, not 30 by 40." }],
        hints: ["Your money covers \\$40 of a \\$50 basket.", "40 ÷ 50 = ?"],
        why: "40 ÷ 50 = 0.8. You can buy 80% of what you could before — your purchasing power fell 20%." },
      { type: "choice", kicker: "Careful", skill: "Purchasing power",
        prompt: "This year your pay rose **3%**. Prices rose **6%**.<br><br>Are you better off?",
        options: [{ t: "No — prices grew faster than my pay, so I can buy less" },
                  { t: "Yes — I got a raise", fb: "A raise only helps if it beats inflation. Prices rose 6%, faster than your 3%." }],
        answer: 0, keep: true, why: "When prices rise faster than income, purchasing power falls — even with a raise." },
      { type: "learn", kicker: "Where it comes from",
        prompt: "Inflation has two main causes. Turn over both cards.",
        scene: { type: "flip", cols: 2, cards: [
          { i: "people", name: "Demand-pull", c: "blue", t: "Buyers want more than businesses can supply — “too much money chasing too few goods.” Demand **pulls** prices up." },
          { i: "factory", name: "Cost-push", c: "orange", t: "Making things costs more — materials, energy, wages — so businesses **push** their prices up. Higher wages can feed a wage-price spiral." }] },
        gate: true },
      { type: "choice", kicker: "Real world", skill: "Inflation",
        prompt: "Nestlé raised the price of its Nespresso coffee after the cost of coffee beans, packaging and shipping went up.<br><br>Which kind of inflation is that?",
        art: photo("nespresso", "Nespresso capsules on display."),
        options: [{ t: "Cost-push" }, { t: "Demand-pull", fb: "Nobody rushed to buy more coffee here. The costs of making it rose, and pushed the price up." }],
        answer: 0, keep: true, why: "Higher production costs pushing up the final price: cost-push inflation." },
      { type: "learn", kicker: "How it's measured",
        prompt: "The **consumer price index (CPI)** tracks the prices of a “market basket” that typical city households buy: food, clothing, transport, housing, medical care, recreation and education.",
        scene: { type: "walk", rows: [
          { m: "100", say: "The CPI is set to **100** in its base period, 1982–1984." },
          { m: "324.8 \\div 100 \\approx 3.2", say: "In September 2025 it was 324.8: prices were more than **three times** the base." },
          { m: "(309 - 300) \\div 300 = 0.03", say: "If the CPI goes from 300 to 309 in a year, prices rose **3%** — that's the inflation rate." }] },
        gate: true,
        then: "The **producer price index (PPI)** tracks what producers pay for materials and goods. It can warn that store prices will rise next." },
      { type: "amount", skill: "Inflation",
        prompt: "The CPI rose from **250** to **260** in a year.<br><br>What was the inflation rate?",
        post: "%", answer: 4,
        near: [{ v: 10, fb: "10 is how many points it rose. As a percent of 250, that's 10 ÷ 250." }, { v: 3.8, tol: 0.1, fb: "Divide by the starting CPI, 250 — not the new one." }],
        hints: ["How many points did it rise? 260 − 250.", "Divide by the starting value, 250."],
        why: "260 − 250 = 10. 10 ÷ 250 = 0.04 = 4%." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why does inflation hurt people living on a fixed income, and people with savings?",
        model: "Their dollars stay the same while prices rise, so a fixed income or a pile of savings buys less and less." },
      { type: "choice", kicker: "Put it together", skill: "Purchasing power",
        prompt: "A retired couple gets a fixed \\$2,000 a month. Next year prices rise 10%, and their income doesn't change.<br><br>About how much of this year's shopping can they afford next year?",
        options: [{ t: "About 91% — 100 ÷ 110" }, { t: "90%", fb: "Close! But it's 100 ÷ 110, which is about 90.9% — just over 90%." },
                  { t: "110%", fb: "Prices went up, so they can buy **less**, not more." }, { t: "All of it — they still get \\$2,000", fb: "Same dollars, higher prices: the \\$2,000 buys less." }],
        answer: 0, keep: true, hints: ["What used to cost \\$100 now costs \\$110."],
        why: "Something that cost \\$100 now costs \\$110, so their money stretches to 100 ÷ 110 ≈ 91% as much." }
    ]
  };

  var L9_CAUSE = [
    ["A shortage of computer chips makes every car cost more to build, so car prices rise.", "c"], ["Oil prices double, so trucking companies raise delivery charges.", "c"],
    ["A new union contract raises factory wages 8%, and the factory raises its prices.", "c"], ["Coffee bean harvests fail, so cafés raise the price of a latte.", "c"],
    ["After a big tax refund, shoppers rush to buy TVs faster than stores can restock.", "d"], ["Everyone wants a new game console, but only a few are made, so prices climb.", "d"],
    ["Cheap loans lead so many families to buy homes that house prices soar.", "d"], ["Tourism booms and hotels can't keep up, so room prices jump.", "d"]
  ];

  SKILLS.push(
    { id: "biz1-power", title: "Purchasing power", lesson: 9,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 0) {
          var pair = R.pick([[40, 50, 80], [20, 25, 80], [60, 75, 80], [30, 40, 75], [45, 50, 90], [80, 100, 80], [50, 80, 62.5], [25, 50, 50]]);
          return { type: "amount", prompt: "A basket of groceries went from " + usd(pair[0]) + " to " + usd(pair[1]) + ". Your pay didn't change.<br><br>What percent of the old basket can your money buy now?",
            post: "%", answer: pair[2],
            near: [{ v: 100 - pair[2], fb: "That's how much you lost. The question asks what you can still buy." }, { v: B.round(pair[1] / pair[0] * 100, 1), tol: 0.1, fb: "Divide the old price by the new one." }].filter(function (n) { return n.v !== pair[2]; }),
            hints: ["Divide the old price by the new price.", pair[0] + " ÷ " + pair[1] + " = ?"],
            why: pair[0] + " ÷ " + pair[1] + " = " + num(pair[2] / 100) + ": you can buy " + pair[2] + "% as much." };
        }
        var w = R.pick([0, 2, 3, 4, 5, 6, 8, 10]), p = R.pick([2, 3, 4, 5, 6, 8, 10].filter(function (x) { return x !== w; }));
        if (t === 2 && R.chance(0.4)) p = w;
        var res = w > p ? "It rose" : w < p ? "It fell" : "It stayed the same";
        return mc(R, { prompt: "This year your pay rose " + w + "% and prices rose " + p + "%.<br><br>What happened to your purchasing power?", keep: true,
          right: res, wrong: ["It rose", "It fell", "It stayed the same"].filter(function (x) { return x !== res; }).map(function (x) {
            return { t: x, fb: "Compare the two: pay grew " + w + "%, prices grew " + p + "%. " + (w > p ? "Pay won, so you can buy more." : w < p ? "Prices won, so you can buy less." : "They grew at the same rate, so you can buy the same.") }; }),
          hints: ["Which grew faster — your pay, or prices?"], why: "Pay " + w + "%, prices " + p + "%: " + res.toLowerCase() + "." });
      } },
    { id: "biz1-cpi", title: "Inflation and the CPI", lesson: 9,
      gen: function (R, i) {
        var t = i % 4;
        if (t === 0 || t === 3) {
          var x = R.pick(L9_CAUSE);
          return mc(R, { prompt: "“" + x[0] + "”<br><br>Which kind of inflation is this?", keep: true,
            right: x[1] === "c" ? "Cost-push" : "Demand-pull",
            wrong: [{ t: x[1] === "c" ? "Demand-pull" : "Cost-push", fb: x[1] === "c" ? "Buyers didn't suddenly want more — the cost of making it rose." : "Costs didn't change — buyers want more than there is." }],
            hints: ["Did costs go up, or did buyers want more than there was?"], why: x[1] === "c" ? "Higher costs pushed prices up: cost-push." : "Demand greater than supply pulled prices up: demand-pull." });
        }
        if (t === 1) {
          var a = R.pick([200, 250, 300, 400, 500]), r = R.pick([2, 3, 4, 5, 6]), b = a * (1 + r / 100);
          return { type: "amount", prompt: "The CPI rose from " + a + " to " + num(b) + " in a year.<br><br>What was the inflation rate?", post: "%", answer: r,
            near: [{ v: b - a, fb: "That's the rise in points. Divide it by the starting CPI, " + a + "." }].filter(function (n) { return n.v !== r; }),
            hints: ["Rise in points: " + num(b) + " − " + a + ".", "Divide by the starting value."],
            why: num(b) + " − " + a + " = " + num(b - a) + ". " + num(b - a) + " ÷ " + a + " = " + num(r / 100) + " = " + r + "%." };
        }
        var q = R.pick([
          { p: "The CPI is 300. Compared with the base period (1982–1984), prices are…", r: "three times as high", w: [{ t: "300% lower", fb: "The base is 100. 300 means prices are 3 times the base." }, { t: "3% higher", fb: "The base is 100, so 300 means three times as high." }] },
          { p: "What does the CPI measure?", r: "The prices of a market basket of goods and services typical city households buy", w: [{ t: "The prices producers pay for raw materials", fb: "That's the PPI, the producer price index." }, { t: "How many people have jobs", fb: "That's the unemployment rate." }] },
          { p: "What does the PPI measure?", r: "The prices producers and wholesalers pay for materials and goods", w: [{ t: "What typical households pay at the store", fb: "That's the CPI." }, { t: "The total value of everything a country makes", fb: "That's GDP." }] },
          { p: "Why do people watch the PPI?", r: "Rising costs for producers can mean higher store prices soon", w: [{ t: "It shows how many people are unemployed", fb: "No — the PPI tracks producers' prices." }, { t: "It sets the price of every product", fb: "It only measures prices; it doesn't set them." }] }]);
        return mc(R, { prompt: q.p, right: q.r, wrong: q.w, hints: ["CPI: what households pay. PPI: what producers pay."], why: q.r.charAt(0).toUpperCase() + q.r.slice(1) + "." });
      } }
  );

  /* ============================================================= Lesson 10
     Steering the economy (1.5): monetary policy and the Fed, interest
     rates, contractionary and expansionary policy, fiscal policy, deficits,
     the national debt, crowding out. */
  LESSONS[10] = {
    title: "Steering the economy",
    blurb: "The Fed's interest rates, the government's taxes and spending — and deficits and debt.",
    mins: 12,
    steps: [
      { type: "amount", kicker: "Remember?",
        prompt: "The CPI rose from 200 to 210 this year.<br><br>What was the inflation rate?",
        post: "%", answer: 5, near: [{ v: 10, fb: "10 is the rise in points. Divide by the starting 200." }],
        hints: ["(210 − 200) ÷ 200"], why: "10 ÷ 200 = 0.05 = 5%." },
      { type: "choice", kicker: "Guess first",
        prompt: "Prices are rising 8% a year, stores are packed, and businesses can't hire fast enough.<br><br>If you ran the economy, what would you do?",
        options: [{ t: "Slow spending down a little, so prices calm down" },
                  { t: "Get people to spend even more", fb: "Spending is already racing ahead of what businesses can make — more would push prices up faster." },
                  { t: "Nothing — a booming economy fixes itself", fb: "Sometimes. But 8% inflation eats everyone's purchasing power, so governments usually act." }],
        answer: 0, keep: true, why: "When the economy runs too hot, the aim is to cool spending so prices stop racing up." },
      { type: "learn", kicker: "Two tools",
        prompt: "Governments have two tools to steer the economy. Turn over both cards.",
        art: photo("fed", "The chair of the Federal Reserve is the face of US monetary policy."),
        scene: { type: "flip", cols: 2, cards: [
          { i: "bank", name: "Monetary policy", c: "blue", t: "Controlling the **money supply** and **interest rates**. In the US it's done by the **Federal Reserve** (the Fed), the central bank." },
          { i: "capitol", name: "Fiscal policy", c: "purple", t: "The government's **taxes** and **spending**, decided by Congress and the president." }] },
        gate: true },
      { type: "learn", kicker: "Watch",
        prompt: "An **interest rate** is the cost of borrowing money — and the reward for lending it. Watch what happens when the Fed **raises** it.",
        scene: { type: "chain", steps: [
          { i: "bank", t: "The Fed raises interest rates.", c: "blue" },
          { i: "card", t: "Banks charge more for loans and credit cards.", c: "purple" },
          { i: "house", t: "People and businesses borrow and spend less — on homes, cars, new factories.", c: "orange" },
          { i: "down", t: "The economy slows. Prices rise more slowly — but some jobs are lost.", c: "red" }] },
        gate: true },
      { type: "learn", kicker: "New words",
        prompt: "Tightening like that is called **contractionary** policy. Loosening is **expansionary**. Turn over both.",
        scene: { type: "flip", cols: 2, cards: [
          { i: "down", name: "Contractionary", c: "red", t: "Less money, **higher** interest rates (or higher taxes, less government spending). Slows growth and cools inflation — but unemployment may rise." },
          { i: "up", name: "Expansionary", c: "green", t: "More money, **lower** interest rates (or tax cuts, more government spending). Speeds growth and creates jobs — but prices may rise faster." }] },
        gate: true },
      { type: "learn", kicker: "Try it",
        prompt: "The economy is overheating. Use the levers to bring **all three** gauges into the green.",
        scene: { type: "levers", scenario: "overheating" },
        gate: true, then: "Raising rates or taxes, or cutting spending, cools the economy. Push too hard, though, and you cause a slowdown." },
      { type: "levers", kicker: "Your turn", skill: "Monetary and fiscal policy",
        prompt: "Now the economy is in a recession: output is shrinking and many people are out of work.<br><br>Bring all three gauges into the green.",
        scenario: "recession",
        hints: ["A recession needs a push: which way should interest rates go?", "Lower rates and more government spending (or lower taxes) push the economy up — but not all three at once."],
        why: "Expansionary policy — lower interest rates plus more spending or lower taxes — lifts growth and jobs. Using every lever at once overshoots into high inflation." },
      { type: "learn", kicker: "Deficits and debt",
        prompt: "When the government spends more than it collects in taxes in a year, that's a **budget deficit**. It borrows the difference by selling Treasury bills, notes and bonds.",
        scene: { type: "walk", rows: [
          { m: "7.0 - 5.2 = 1.8", say: "Year 1: spends \\$7.0 trillion, collects \\$5.2 trillion. **Deficit: \\$1.8 trillion.**" },
          { m: "6.8 - 5.3 = 1.5", say: "Year 2: another deficit, \\$1.5 trillion." },
          { m: "1.8 + 1.5 = 3.3", say: "The debt grows by the total: \\$3.3 trillion more owed." }] },
        gate: true,
        then: "The **national debt** is the total of all past deficits — about \\$40 trillion today, more than \\$100,000 per person." },
      { type: "choice", kicker: "Careful", skill: "Deficits and debt",
        prompt: "This year the government collects \\$100 billion **more** than it spends — a surplus.<br><br>Does the national debt disappear?",
        options: [{ t: "No — a surplus only pays off a small part of the debt" },
                  { t: "Yes — no deficit means no debt", fb: "The deficit is one year. The debt is the total of every past year's deficits. One surplus barely dents trillions." }],
        answer: 0, keep: true, why: "Deficit and surplus describe one year. The debt is the running total — a \\$100 billion surplus hardly touches \\$40 trillion." },
      { type: "amount", skill: "Deficits and debt",
        prompt: "This year the government collects \\$4.8 trillion in taxes and spends \\$6.3 trillion.<br><br>What is this year's deficit, in trillions of dollars?",
        pre: "\\$", post: "trillion", answer: 1.5,
        near: [{ v: 11.1, fb: "Don't add them. The deficit is the gap: spending − taxes." }, { v: -1.5, fb: "Right size — give it as a positive deficit of 1.5." }],
        hints: ["Deficit = spending − tax revenue."], why: "\\$6.3 − \\$4.8 = \\$1.5 trillion." },
      { type: "choice", kicker: "New word", skill: "Deficits and debt",
        prompt: "The city opens a free public pool. Fewer families pay to join private swim clubs.<br><br>Government spending here replaced private spending. What is that called?",
        options: [{ t: "Crowding out" }, { t: "A budget surplus", fb: "A surplus is when revenue is bigger than spending. This is about public spending replacing private spending." },
                  { t: "Cost-push inflation", fb: "Nothing here raised costs or prices. Public spending took the place of private spending." }],
        answer: 0, keep: true, why: "When government spending replaces spending by people and businesses, it's called **crowding out**." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why might the Fed raise interest rates even though it knows some people will lose their jobs?",
        model: "To stop high inflation. Higher rates cool borrowing and spending so prices stop racing up; a short rise in unemployment is the cost of protecting everyone's purchasing power." }
    ]
  };

  var L10_ACTS = [
    ["The Fed lowers interest rates.", "m", "e"], ["The Fed raises interest rates.", "m", "c"], ["The Fed sells government securities to pull money out of the economy.", "m", "c"],
    ["The Fed increases the money supply.", "m", "e"], ["Congress cuts income taxes.", "f", "e"], ["Congress raises taxes.", "f", "c"],
    ["The government spends billions more on highways and schools.", "f", "e"], ["The government cuts its spending on programs.", "f", "c"]
  ];

  SKILLS.push(
    { id: "biz1-policy", title: "Monetary and fiscal policy", lesson: 10,
      gen: function (R, i) {
        var t = i % 4;
        var a = R.pick(L10_ACTS);
        if (t === 0) {
          return mc(R, { prompt: "“" + a[0] + "”<br><br>Is this monetary policy or fiscal policy?", keep: true,
            right: a[1] === "m" ? "Monetary policy" : "Fiscal policy",
            wrong: [{ t: a[1] === "m" ? "Fiscal policy" : "Monetary policy", fb: a[1] === "m" ? "The Fed working with money and interest rates is monetary policy." : "Taxes and government spending are fiscal policy." }],
            hints: ["The Fed and interest rates, or taxes and spending?"], why: a[1] === "m" ? "Money supply and interest rates: monetary policy." : "Taxes and government spending: fiscal policy." });
        }
        if (t === 1) {
          return mc(R, { prompt: "“" + a[0] + "”<br><br>Is this expansionary or contractionary?", keep: true,
            right: a[2] === "e" ? "Expansionary — it speeds the economy up" : "Contractionary — it slows the economy down",
            wrong: [{ t: a[2] === "e" ? "Contractionary — it slows the economy down" : "Expansionary — it speeds the economy up",
                      fb: a[2] === "e" ? "Lower rates, more money, lower taxes or more spending all encourage spending — expansionary." : "Higher rates, less money, higher taxes or less spending all hold spending back — contractionary." }],
            hints: ["Does it make people and businesses more likely to spend, or less?"], why: a[2] === "e" ? "It encourages spending: expansionary." : "It holds spending back: contractionary." });
        }
        if (t === 2) {
          var hot = R.chance(0.5);
          return { type: "levers", prompt: (hot ? "The economy is overheating: prices are racing up." : "The economy is in a recession: many people are out of work.") + "<br><br>Bring all three gauges into the green.",
            scenario: hot ? "overheating" : "recession",
            hints: [hot ? "Cool it: raise something." : "Push it: lower rates, and lower taxes or spend more.", "Two moves in the same direction do it."],
            why: hot ? "Contractionary policy — higher rates, higher taxes or less spending — cools an overheating economy." : "Expansionary policy — lower rates, lower taxes or more spending — lifts an economy in recession." };
        }
        var sc = R.pick([
          { p: "Inflation is 9% and rising.", r: "Raise interest rates", w: [{ t: "Lower interest rates", fb: "Lower rates encourage more borrowing and spending — that would push prices up faster." }, { t: "Cut taxes", fb: "Tax cuts leave people more to spend, adding to inflation." }] },
          { p: "Unemployment is 9% and GDP has fallen for three quarters.", r: "Lower interest rates", w: [{ t: "Raise interest rates", fb: "Higher rates would slow the economy further." }, { t: "Raise taxes", fb: "Higher taxes leave people less to spend — the wrong direction in a recession." }] },
          { p: "The economy is shrinking, and the government wants to use fiscal policy.", r: "Spend more on public projects", w: [{ t: "Cut government spending", fb: "Less spending slows the economy more." }, { t: "Raise interest rates", fb: "That's monetary policy — and the wrong direction." }] }]);
        return mc(R, { prompt: sc.p + "<br><br>Which move fits best?", right: sc.r, wrong: sc.w, hints: ["Does the economy need cooling or a push?"], why: sc.r + " is the move in the right direction." });
      } },
    { id: "biz1-deficit", title: "Deficits and debt", lesson: 10,
      gen: function (R, i) {
        var t = i % 4;
        if (t === 0) {
          var tax = R.int(40, 55) / 10, gap = R.pick([-0.3, 0.8, 1.2, 1.5, 1.8, 2.1]), sp = round(tax + gap, 1);
          var def = round(sp - tax, 1);
          return { type: "amount", prompt: "The government collects " + usd(tax, { dp: 1 }) + " trillion in taxes and spends " + usd(sp, { dp: 1 }) + " trillion.<br><br>What is the deficit, in trillions of dollars? (A surplus is a negative deficit.)",
            pre: "\\$", post: "trillion", answer: def, tol: 0.001,
            near: [{ v: round(sp + tax, 1), fb: "Don't add — the deficit is spending minus taxes." }, { v: -def, fb: def > 0 ? "Spending is bigger, so it's a deficit — positive." : "Taxes are bigger here: that's a surplus, a negative deficit." }].filter(function (n) { return Math.abs(n.v - def) > 1e-9; }),
            hints: ["Deficit = spending − taxes."], why: usd(sp, { dp: 1 }) + " − " + usd(tax, { dp: 1 }) + " = " + usd(def, { dp: 1 }) + " trillion" + (def < 0 ? " — a surplus." : ".") };
        }
        if (t === 1) {
          var ds = [R.pick([1.2, 1.4, 1.6]), R.pick([1.0, 1.5, 1.8]), R.pick([0.8, 1.1, 1.3])], start = R.pick([30, 32, 35]);
          var end = round(start + ds[0] + ds[1] + ds[2], 1);
          return { type: "amount", prompt: "The national debt is " + usd(start) + " trillion. The next three years have deficits of " + ds.map(function (d) { return usd(d, { dp: 1 }); }).join(", ") + " trillion.<br><br>What is the debt after the three years, in trillions?",
            pre: "\\$", post: "trillion", answer: end, tol: 0.001,
            near: [{ v: round(ds[0] + ds[1] + ds[2], 1), fb: "That's how much it grew. Add it to the starting debt." }],
            hints: ["Each year's deficit adds to the debt.", "Add the three deficits, then add them to " + usd(start) + " trillion."],
            why: usd(start) + " + " + ds.map(function (d) { return usd(d, { dp: 1 }); }).join(" + ") + " = " + usd(end, { dp: 1 }) + " trillion." };
        }
        var q = R.pick([
          { p: "What is the difference between the deficit and the national debt?", r: "The deficit is one year's shortfall; the debt is the total of all past deficits",
            w: [{ t: "They're two names for the same thing", fb: "The deficit is one year. The debt keeps adding up the years." }, { t: "The debt is one year; the deficit is the total", fb: "It's the other way round." }] },
          { p: "How does the US government cover a deficit?", r: "It borrows, by selling Treasury bills, notes and bonds",
            w: [{ t: "It asks the Fed to print whatever it needs", fb: "The Treasury borrows; the Fed manages the money supply separately." }, { t: "It simply doesn't pay its bills", fb: "It borrows to pay them." }] },
          { p: "The government spends more on public transportation, and people spend less on private cars and taxis. What is this?", r: "Crowding out",
            w: [{ t: "A budget surplus", fb: "A surplus is revenue greater than spending." }, { t: "Demand-pull inflation", fb: "This is public spending replacing private spending." }] },
          { p: "Which is a worry about a very large national debt?", r: "Government borrowing can crowd out private investment by pushing up interest rates",
            w: [{ t: "It makes taxes disappear", fb: "Interest on the debt must be paid from taxes — it doesn't remove them." }, { t: "It lowers every interest rate", fb: "Heavy government borrowing tends to push interest rates up." }] }]);
        return mc(R, { prompt: q.p, right: q.r, wrong: q.w, hints: ["Deficit: one year. Debt: the running total."], why: q.r + "." });
      } }
  );

  /* ============================================================= Lesson 11
     Demand, supply and a price (1.6): demand and the demand curve, supply
     and the supply curve, equilibrium, surplus and shortage, schedules. */
  // A demand and supply schedule as a table, for `art`.
  function l11table(rows, unit) {
    return '<table class="bz-mk-tab" style="margin:4px auto 0"><tr><th class="row">Price</th>' + rows.map(function (r) { return "<td><b>" + money(r[0]) + "</b></td>"; }).join("") + "</tr>" +
      '<tr><th class="row d">Buyers want</th>' + rows.map(function (r) { return "<td>" + count(r[1]) + "</td>"; }).join("") + "</tr>" +
      '<tr><th class="row s">Sellers offer</th>' + rows.map(function (r) { return "<td>" + count(r[2]) + "</td>"; }).join("") + "</tr></table>" +
      (unit ? '<p style="text-align:center;font-size:13px;color:var(--ink-2);margin:6px 0 0">Quantities in ' + unit + "</p>" : "");
  }
  var L11_BIKES = [[5, 900, 100], [10, 700, 300], [15, 500, 500], [20, 300, 700], [25, 100, 900]];
  LESSONS[11] = {
    title: "Demand, supply and a price",
    blurb: "Why buyers want less when prices rise, sellers offer more — and where the price settles.",
    mins: 12,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“The Fed lowers interest rates.”<br><br>What kind of policy is that?",
        options: [{ t: "Expansionary monetary policy" }, { t: "Contractionary monetary policy", fb: "Lower rates encourage borrowing and spending — that speeds the economy up." },
                  { t: "Expansionary fiscal policy", fb: "Fiscal policy is taxes and spending. Interest rates are the Fed's tool: monetary." }],
        answer: 0, keep: true, why: "The Fed (monetary policy) lowering rates to encourage spending (expansionary)." },
      { type: "choice", kicker: "Guess first",
        prompt: "A band sells tour T-shirts for **\\$40**. At the end of the night, half the shirts are still in their boxes.<br><br>What should the band do at the next show?",
        art: tiles([{ i: "music", t: "Tour T-shirts", c: "purple" }, { i: "tag", t: "$40 each", c: "orange" }, { i: "box", t: "Half unsold", c: "red" }]),
        options: [{ t: "Lower the price" }, { t: "Raise the price, to make up for it", fb: "If half didn't sell at \\$40, even fewer people will pay more." },
                  { t: "Keep everything the same", fb: "Then they'll be stuck with boxes of shirts again." }],
        answer: 0, keep: true, why: "Unsold shirts are a sign the price is too high for the number offered. A lower price means more people buy." },
      { type: "learn", kicker: "Two sides",
        prompt: "Every market has two sides. Turn over both cards.",
        scene: { type: "flip", cols: 2, cards: [
          { i: "people", name: "Demand", c: "blue", t: "How much buyers are **willing to buy** at each price. Higher price → they buy less. Lower price → more can afford it, and some buy two." },
          { i: "factory", name: "Supply", c: "orange", t: "How much sellers will **offer** at each price. Higher price → they make more, because each one earns more profit — and new sellers join." }] },
        gate: true, then: "On a graph, the **demand curve** slopes down and the **supply curve** slopes up." },
      { type: "learn", kicker: "Try it",
        prompt: "Here's the market for the band's T-shirts. Drag the price and watch buyers (blue) and sellers (orange).",
        scene: { type: "market", good: "tour T-shirts", unit: "shirts", schedule: [10, 15, 20, 25, 30], price: { v: 30, min: 5, max: 40, step: 1 } },
        gate: true,
        then: "At a high price, sellers offer more than buyers want: a **surplus**. At a low price, buyers want more than sellers offer: a **shortage**." },
      { type: "learn", kicker: "Your turn",
        prompt: "Now find the price where buyers want **exactly** what sellers offer.",
        scene: { type: "market", good: "tour T-shirts", unit: "shirts", schedule: [10, 15, 20, 25, 30], price: { v: 32, min: 5, max: 40, step: 1 }, ask: "equilibrium" },
        gate: true,
        then: "That's the **equilibrium**: where quantity demanded equals quantity supplied. The **equilibrium price** is \\$20, and the **equilibrium quantity** is 600 shirts." },
      { type: "choice", kicker: "Why it works", skill: "Supply and demand",
        prompt: "At \\$30 there's a surplus of 450 shirts.<br><br>What will sellers do?",
        options: [{ t: "Cut the price to sell the extra shirts" }, { t: "Raise the price", fb: "They can't sell the shirts they have at \\$30. A higher price would leave even more unsold." },
                  { t: "Nothing — a surplus is good for sellers", fb: "Unsold shirts are money spent with nothing back. Sellers want them gone." }],
        answer: 0, keep: true, why: "A surplus pushes the price **down** — toward the equilibrium." },
      { type: "choice", kicker: "Careful", skill: "Supply and demand",
        prompt: "At \\$10 there's a **shortage** of shirts.<br><br>What does that mean?",
        options: [{ t: "At \\$10, people want more shirts than sellers offer" }, { t: "There are no shirts at all", fb: "Shirts are for sale — just not enough for everyone who wants one at \\$10." },
                  { t: "Sellers are running out of cotton", fb: "A shortage is about price: at \\$10, the quantity wanted is bigger than the quantity offered." }],
        answer: 0, keep: true, why: "A shortage is at a particular price: buyers want more than is offered. Lines form and the price gets pushed **up**." },
      { type: "amount", kicker: "Read a schedule", skill: "Supply and demand",
        prompt: "Here is the market for bike rentals in a city park, per day.<br><br>What is the equilibrium price?",
        art: l11table(L11_BIKES, "rentals per day"),
        pre: "\\$", answer: 15,
        near: [{ v: 500, fb: "500 is the equilibrium **quantity**. The question asks for the price." }, { v: 25, fb: "At \\$25 sellers offer 900 but buyers want only 100 — a big surplus." }],
        hints: ["Find the column where \"buyers want\" and \"sellers offer\" are the same."],
        why: "At \\$15, buyers want 500 and sellers offer 500. That's the equilibrium price." },
      { type: "amount", skill: "Supply and demand",
        prompt: "Same bike-rental market. At **\\$20**, how big is the surplus?",
        art: l11table(L11_BIKES, "rentals per day"),
        answer: 400, post: "rentals",
        near: [{ v: 1000, fb: "Don't add them. The surplus is the gap: offered − wanted." }, { v: 300, fb: "300 is what buyers want. Take it away from what sellers offer." }],
        hints: ["At \\$20: sellers offer 700, buyers want 300.", "Surplus = offered − wanted."],
        why: "700 offered − 300 wanted = a surplus of 400 rentals." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why does a shortage push a price up?",
        model: "Buyers who can't get one will pay more, and sellers see they can charge more. The price rises until the quantity wanted equals the quantity offered." },
      { type: "market", kicker: "Put it together", skill: "Supply and demand",
        prompt: "This is the market for school-dance tickets.<br><br>Move the price to the equilibrium.",
        good: "dance tickets", unit: "tickets", demand: { a: 900, b: 30 }, supply: { c: 0, d: 20 }, qmax: 900, pmax: 30, price: { v: 26, min: 1, max: 29, step: 1 },
        ask: "equilibrium",
        hints: ["Is there a surplus or a shortage at the price you're at? Move the opposite way.", "Look for where the two curves cross."],
        why: "At \\$18, buyers want 900 − 30 × 18 = 360 and sellers offer 20 × 18 = 360. Equilibrium: \\$18 and 360 tickets." }
    ]
  };

  var L11_GOODS = ["phone cases", "concert tickets", "pizza slices", "hoodies", "bike rentals", "movie tickets", "sneakers", "car washes"];

  SKILLS.push(
    { id: "biz1-equil", title: "Supply, demand and equilibrium", lesson: 11,
      gen: function (R, i) {
        var t = i % 5, good = R.pick(L11_GOODS);
        // A clean schedule: equilibrium at the middle price.
        var step = R.pick([2, 5, 10]), pe = step * R.int(3, 6), qe = R.pick([100, 200, 300, 400, 500, 600]);
        var sd = R.pick([10, 20, 25, 50]), ss = R.pick([10, 20, 25, 50]);
        var rows = [-2, -1, 0, 1, 2].map(function (k) { var p = pe + k * step; return [p, qe - k * sd * step / 5 * 2, qe + k * ss * step / 5 * 2]; });
        if (rows.some(function (r) { return r[1] < 0 || r[2] < 0; })) rows = rows.map(function (r) { return [r[0], r[1] + 400, r[2] + 400]; });
        var qeq = rows[2][1];
        if (t === 0) {
          return { type: "amount", prompt: "Here is the market for " + good + ".<br><br>What is the equilibrium price?", art: l11table(rows), pre: "\\$", answer: pe,
            near: [{ v: qeq, fb: "That's the equilibrium quantity. The question asks for the price." }],
            hints: ["Find the price where buyers want the same amount sellers offer."], why: "At " + usd(pe) + ", buyers want " + count(qeq) + " and sellers offer " + count(qeq) + "." };
        }
        if (t === 1 || t === 3) {
          var k = R.pick([0, 1, 3, 4]), r = rows[k], gap = r[2] - r[1];
          return mc(R, { prompt: "Here is the market for " + good + ".<br><br>At " + usd(r[0]) + ", is there a surplus or a shortage, and how big?", art: l11table(rows),
            right: (gap > 0 ? "A surplus of " : "A shortage of ") + count(Math.abs(gap)),
            wrong: [{ t: (gap > 0 ? "A shortage of " : "A surplus of ") + count(Math.abs(gap)), fb: gap > 0 ? "Sellers offer more than buyers want — that's a surplus." : "Buyers want more than sellers offer — that's a shortage." },
                    { t: (gap > 0 ? "A surplus of " : "A shortage of ") + count(r[1] + r[2]), fb: "Don't add them: the size is the gap between the two." },
                    { t: "Neither — it's the equilibrium", fb: "At " + usd(r[0]) + " the two numbers are different." }],
            hints: ["Compare \"buyers want\" and \"sellers offer\" at that price.", "Bigger offer: surplus. Bigger want: shortage."],
            why: "At " + usd(r[0]) + ": buyers want " + count(r[1]) + ", sellers offer " + count(r[2]) + ". " + (gap > 0 ? "Surplus of " : "Shortage of ") + count(Math.abs(gap)) + "." });
        }
        if (t === 2) {
          var hi = R.chance(0.5);
          return mc(R, { prompt: "The market price of " + good + " is " + (hi ? "above" : "below") + " the equilibrium.<br><br>What happens next?",
            right: hi ? "A surplus builds up, and sellers cut the price" : "A shortage appears, and the price gets pushed up",
            wrong: [{ t: hi ? "A shortage appears, and the price rises" : "A surplus builds up, and sellers cut the price", fb: hi ? "Above equilibrium, sellers offer more than buyers want — a surplus." : "Below equilibrium, buyers want more than sellers offer — a shortage." },
                    { t: "Nothing — the price stays where it is", fb: "Away from equilibrium, the price keeps moving until the two sides match." }],
            hints: ["Above the equilibrium, who has too much — buyers or sellers?"], why: hi ? "Too high: surplus, so the price falls toward equilibrium." : "Too low: shortage, so the price rises toward equilibrium." });
        }
        var a = R.pick([600, 800, 900, 1000, 1200]), b = R.pick([10, 20, 25]), d = R.pick([10, 15, 20, 30]);
        var pe2 = a / (b + d); if (Math.abs(pe2 - Math.round(pe2)) > 1e-9) { a = Math.round(pe2) * (b + d); pe2 = Math.round(pe2); }
        var pmax = Math.ceil((pe2 * 1.7) / 5) * 5, qmax = Math.ceil((a) / 100) * 100;
        return { type: "market", prompt: "This is the market for " + good + ".<br><br>Move the price to the equilibrium.", good: good, unit: good,
          demand: { a: a, b: b }, supply: { c: 0, d: d }, qmax: qmax, pmax: pmax, price: { v: Math.min(pmax - 1, pe2 + R.pick([4, 5, 6])), min: 1, max: pmax - 1, step: 1 }, ask: "equilibrium",
          hints: ["Surplus at your price? Move the price down. Shortage? Move it up.", "Look for where the curves cross."],
          why: "At " + usd(pe2) + ", buyers want " + count(a - b * pe2) + " and sellers offer " + count(d * pe2) + ": equilibrium." };
      } }
  );

  /* ============================================================= Lesson 12
     When the curves move (1.6): a price change moves along a curve;
     anything else shifts it. Demand shifters, supply shifters, and what a
     shift does to the equilibrium. */
  var L12_EVENTS = [{ name: "A star wears the shirt", curve: "demand", dir: 1, size: 225 },
                    { name: "The band breaks up", curve: "demand", dir: -1, size: 225 },
                    { name: "Cotton gets cheaper", curve: "supply", dir: 1, size: 225 },
                    { name: "A printing plant burns down", curve: "supply", dir: -1, size: 225 }];
  LESSONS[12] = {
    title: "When the curves move",
    blurb: "Moving along a curve versus shifting it — and what shifts do to the price.",
    mins: 12,
    steps: [
      { type: "amount", kicker: "Remember?",
        prompt: "At \\$12 buyers want 400 phone cases and sellers offer 400. At \\$14 buyers want 350 and sellers offer 460.<br><br>What is the equilibrium price?",
        pre: "\\$", answer: 12, near: [{ v: 14, fb: "At \\$14 the numbers differ — a surplus of 110." }, { v: 400, fb: "400 is the quantity. The question asks for the price." }],
        hints: ["Where are the two quantities equal?"], why: "At \\$12 quantity demanded equals quantity supplied: 400." },
      { type: "choice", kicker: "Guess first",
        prompt: "A famous singer wears the band's T-shirt in a video that goes viral. Now, at every price, more people want one.<br><br>What happens to the price of the shirts?",
        art: tiles([{ i: "music", t: "Viral video", c: "purple" }, { i: "people", t: "More fans want the shirt", c: "blue" }, { i: "question", t: "The price?", c: "muted" }]),
        options: [{ t: "It goes up" }, { t: "It goes down", fb: "More people want the same shirts. That creates a shortage at the old price, which pushes the price up." },
                  { t: "It stays the same", fb: "Nothing about sellers changed, but buyers want more at every price — the old price no longer balances the market." }],
        answer: 0, keep: true, why: "More demand at every price means a shortage at the old price, so the price rises." },
      { type: "learn", kicker: "Try it",
        prompt: "Tap each event and watch the curves move. The dashed line is where the curve started.",
        scene: { type: "market", unit: "shirts", events: L12_EVENTS },
        gate: true,
        then: "When demand rises, the whole demand curve **shifts right**; when it falls, **left**. Supply shifts the same way. Each shift gives a new equilibrium." },
      { type: "choice", kicker: "Careful",
        prompt: "The shirts' price rises from \\$20 to \\$25, so people buy fewer.<br><br>Did the demand curve shift?",
        options: [{ t: "No — that's a move along the same curve" },
                  { t: "Yes — demand went down, so the curve shifted left", fb: "This is the most common mix-up! A change in the shirt's **own price** moves you along the curve. The curve only shifts when something **else** changes." }],
        answer: 0, keep: true,
        why: "The demand curve already shows how much people buy at every price. A new price just picks a different point on it." },
      { type: "learn", kicker: "What shifts demand",
        prompt: "Five things shift the demand curve. Turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "cash", name: "Buyers' incomes", c: "green", t: "Incomes rise → buyers want more (**right**). Incomes fall → **left**." },
          { i: "heart", name: "Tastes", c: "red", t: "It becomes popular → **right**. It goes out of fashion → **left**." },
          { i: "tag", name: "Related products' prices", c: "orange", t: "A substitute gets dearer → **right**. Something used with it gets dearer (snowboards, for snowboard jackets) → **left**." },
          { i: "calendar", name: "Expectations", c: "purple", t: "People expect the price to rise soon → they buy now: **right**. Expect it to fall → they wait: **left**." },
          { i: "people", name: "Number of buyers", c: "blue", t: "More buyers → **right**. Fewer → **left**." }] },
        gate: true },
      { type: "sort", skill: "Shifts in demand and supply",
        prompt: "Which way does each event shift the **demand** curve for snowboard jackets?",
        bins: ["Right (more demand)", "Left (less demand)"],
        cards: [{ t: "Snowboarders' incomes rise", bin: 0, fb: "More income, more jackets wanted at every price: right." },
                { t: "Snowboarding goes out of fashion", bin: 1, fb: "Tastes moved away: left." },
                { t: "People expect jacket prices to jump next month", bin: 0, fb: "They buy now, before it rises: right." },
                { t: "Snowboards now cost \\$1,000", bin: 1, fb: "Fewer people snowboard, so fewer need the jackets: left." },
                { t: "Thousands of new fans take up the sport", bin: 0, fb: "More buyers: right." }],
        hints: ["Would people want more jackets at every price, or fewer?"],
        why: "Higher income, expected price rises and more buyers shift demand right. Out of fashion, and a dearer product used with it, shift it left." },
      { type: "learn", kicker: "What shifts supply",
        prompt: "Five things shift the supply curve. Turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "chip", name: "Technology", c: "blue", t: "Better technology makes each item cheaper to make → more supplied: **right**." },
          { i: "wheat", name: "Resource prices", c: "green", t: "Materials or wages get cheaper → **right**. Dearer → **left**." },
          { i: "shirt", name: "Other products' profits", c: "orange", t: "If the same machines could make something **more** profitable, sellers switch → **left**." },
          { i: "store", name: "Number of sellers", c: "purple", t: "More sellers → **right**. Some stop selling → **left**." },
          { i: "capitol", name: "Taxes", c: "red", t: "A new tax on each item cuts profit → **left**. A tax cut → **right**." }] },
        gate: true },
      { type: "sort", skill: "Shifts in demand and supply",
        prompt: "Which way does each event shift the **supply** curve for T-shirts?",
        bins: ["Right (more supply)", "Left (less supply)"],
        cards: [{ t: "A new machine prints shirts twice as fast", bin: 0, fb: "Cheaper to make: right." },
                { t: "Cotton prices double", bin: 1, fb: "Dearer materials: left." },
                { t: "Three new print shops open", bin: 0, fb: "More sellers: right." },
                { t: "A \\$2 tax on every shirt made", bin: 1, fb: "Less profit per shirt: left." },
                { t: "Hoodies become far more profitable to make", bin: 1, fb: "Sellers switch their machines to hoodies: fewer shirts, left." }],
        hints: ["Would sellers offer more shirts at every price, or fewer?"],
        why: "Better technology and more sellers shift supply right. Dearer inputs, a tax, and a more profitable alternative shift it left." },
      { type: "choice", kicker: "Real world", skill: "Shifts in demand and supply",
        prompt: "In 2005, Hurricane Katrina shut oil rigs and refineries on the Gulf Coast. The supply of gasoline fell, while demand stayed the same.<br><br>What happened to gas prices?",
        art: tiles([{ i: "barrel", t: "Refineries shut", c: "red" }, { i: "down", t: "Supply shifts left", c: "orange" }, { i: "car", t: "Drivers still need gas", c: "blue" }]),
        options: [{ t: "They rose, and less gasoline was sold" }, { t: "They fell, because less gas was sold", fb: "Less supply with the same demand creates a shortage at the old price — prices rise." },
                  { t: "They stayed the same", fb: "The supply curve shifted left, so the equilibrium moved: higher price, lower quantity." }],
        answer: 0, keep: true, why: "Supply shifted left: at the old price there was a shortage, so the price rose and the quantity sold fell." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why doesn't a change in a product's own price shift its demand curve?",
        model: "The demand curve already shows how much people want at every price. A new price just means reading a different point on the same curve; only other changes — income, tastes, and so on — move the whole curve." },
      { type: "choice", kicker: "Put it together", skill: "Shifts in demand and supply",
        prompt: "In the same month, cotton gets cheaper (supply shifts right) **and** a star wears the shirt (demand shifts right).<br><br>What must happen to the number of shirts sold?",
        options: [{ t: "It rises — and the price could go either way" },
                  { t: "It falls", fb: "Both shifts push the equilibrium quantity to the right — more shirts sold." },
                  { t: "It rises, and the price must rise too", fb: "More demand pushes the price up, but more supply pushes it down. Which wins depends on the sizes." }],
        answer: 0, keep: true, hints: ["Take one shift at a time. What does each do to the quantity? To the price?"],
        why: "Both shifts raise the quantity. On price they pull opposite ways, so without knowing the sizes the price could rise, fall or stay the same." }
    ]
  };

  var L12_BANK = [
    ["Buyers' incomes rise", "d", 1], ["The product goes out of fashion", "d", -1], ["People expect its price to jump next month", "d", 1], ["People expect its price to fall soon", "d", -1],
    ["Many new buyers move into the area", "d", 1], ["A cheaper substitute becomes even cheaper", "d", -1], ["A substitute's price doubles", "d", 1], ["A celebrity is seen using it", "d", 1],
    ["A new machine makes it cheaper to produce", "s", 1], ["The price of its main material rises", "s", -1], ["Several new companies start making it", "s", 1], ["A new tax is charged on every unit made", "s", -1],
    ["Workers' wages in the industry fall", "s", 1], ["Makers find another product far more profitable to make", "s", -1], ["A storm destroys several factories", "s", -1], ["The government cuts the tax on each unit", "s", 1]
  ];
  var L12_FX = { "d1": ["rises", "rises"], "d-1": ["falls", "falls"], "s1": ["falls", "rises"], "s-1": ["rises", "falls"] };

  SKILLS.push(
    { id: "biz1-shift", title: "Shifts in demand and supply", lesson: 12,
      gen: function (R, i) {
        var t = i % 4, e = R.pick(L12_BANK);
        var curve = e[1] === "d" ? "demand" : "supply", way = e[2] > 0 ? "right" : "left";
        if (t === 0 || t === 3) {
          var right = "The " + curve + " curve shifts " + way;
          var opts = ["The demand curve shifts right", "The demand curve shifts left", "The supply curve shifts right", "The supply curve shifts left"].filter(function (x) { return x !== right; });
          return mc(R, { prompt: "“" + e[0] + ".”<br><br>What happens in this product's market?", right: right,
            wrong: opts.map(function (x) { return { t: x, fb: /demand/.test(x) !== (curve === "demand") ? "Ask who is affected: buyers (demand) or sellers (supply)? This event changes " + (curve === "demand" ? "what buyers want." : "what sellers can offer.") : "Right curve, wrong way. Does it mean more or less at every price?" }; }),
            hints: ["Does it change what buyers want, or what sellers can offer?", "More at every price is a shift right."], why: e[0] + ": the " + curve + " curve shifts " + way + "." });
        }
        if (t === 1) {
          var fx = L12_FX[e[1] + e[2]];
          return mc(R, { prompt: "“" + e[0] + ".”<br><br>What happens to the equilibrium price and quantity?", right: "Price " + fx[0] + ", quantity " + fx[1],
            wrong: ["Price rises, quantity rises", "Price falls, quantity falls", "Price rises, quantity falls", "Price falls, quantity rises"].filter(function (x) { return x !== "Price " + fx[0] + ", quantity " + fx[1]; })
              .map(function (x) { return { t: x, fb: "First decide which curve shifts, and which way: the " + curve + " curve shifts " + way + ". Then picture the new crossing point." }; }),
            hints: ["Which curve shifts, and which way?", curve === "demand" ? "Demand shifts move price and quantity the same way." : "Supply shifts move price and quantity opposite ways."],
            why: "The " + curve + " curve shifts " + way + ": the price " + fx[0] + " and the quantity " + fx[1] + "." });
        }
        var mv = R.pick([
          { p: "The price of pizza rises, and people buy fewer pizzas.", r: "A movement along the demand curve", w: "A shift of the demand curve to the left",
            fb: "A change in pizza's own price moves you along the curve — the curve itself doesn't shift." },
          { p: "People's incomes fall, and at every price they buy fewer pizzas.", r: "A shift of the demand curve to the left", w: "A movement along the demand curve",
            fb: "Something other than pizza's price changed (income), so the whole curve shifts." },
          { p: "The price of phone cases falls, and sellers offer fewer of them.", r: "A movement along the supply curve", w: "A shift of the supply curve to the left",
            fb: "The good's own price changed — that's a move along the supply curve." },
          { p: "A new machine makes phone cases cheaper to make, and sellers offer more at every price.", r: "A shift of the supply curve to the right", w: "A movement along the supply curve",
            fb: "Technology isn't the good's own price — it shifts the whole curve." }]);
        return mc(R, { prompt: mv.p + "<br><br>Is this a movement along a curve, or a shift of the curve?", right: mv.r, wrong: [{ t: mv.w, fb: mv.fb }],
          hints: ["Did the good's own price change? Then it's a movement along the curve."], why: mv.fb });
      } }
  );

  /* ============================================================= Lesson 13
     How many sellers? (1.7): market structure — perfect competition,
     monopolistic competition, oligopoly, pure monopoly — and barriers to
     entry. */
  var L13_STOPS = [
    { key: "pc", name: "Perfect competition", c: "green", icon: "wheat", crowd: 16,
      rows: [{ k: "Number of sellers", t: "Very many, all small", lvl: 4 }, { k: "Control over price", t: "None — the market sets it", lvl: 0 },
             { k: "Barriers to entry", t: "None: easy to start or quit", lvl: 0 }, { k: "How different products are", t: "Almost identical", lvl: 0 }],
      say: "Examples: wheat and corn farming; the stock market comes close. It's an ideal — no real market fits it perfectly." },
    { key: "mc", name: "Monopolistic competition", c: "blue", icon: "store", crowd: 9,
      rows: [{ k: "Number of sellers", t: "Many — fewer than perfect competition", lvl: 3 }, { k: "Control over price", t: "Some", lvl: 2 },
             { k: "Barriers to entry", t: "Few: fairly easy to start", lvl: 1 }, { k: "How different products are", t: "Similar, but each shows off its differences", lvl: 3 }],
      say: "Examples: fast-food chains, clothing brands, beauty salons. Advertising stresses the differences — Nike's “Just Do It.”" },
    { key: "ol", name: "Oligopoly", c: "orange", icon: "plane", crowd: 3,
      rows: [{ k: "Number of sellers", t: "A few make most of the output", lvl: 1 }, { k: "Control over price", t: "Some — and each watches the others", lvl: 2 },
             { k: "Barriers to entry", t: "Many: it takes huge sums to start", lvl: 3 }, { k: "How different products are", t: "Some differences", lvl: 2 }],
      say: "Examples: Boeing and Airbus in big jets; Apple and Google in phone software. Agreeing on prices together is illegal." },
    { key: "mo", name: "Pure monopoly", c: "red", icon: "bolt", crowd: 1,
      rows: [{ k: "Number of sellers", t: "One — the firm is the industry", lvl: 0 }, { k: "Control over price", t: "High (often limited by government rules)", lvl: 4 },
             { k: "Barriers to entry", t: "Very high", lvl: 4 }, { k: "How different products are", t: "No close substitutes to compare", lvl: 0 }],
      say: "Examples: local electricity, gas and water companies; the Postal Service for ordinary letters." }
  ];
  LESSONS[13] = {
    title: "How many sellers?",
    blurb: "From thousands of wheat farms to a single power company — the four market structures.",
    mins: 11,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“A new machine makes sneakers much cheaper to produce.”<br><br>What happens in the sneaker market?",
        options: [{ t: "Supply shifts right" }, { t: "Demand shifts right", fb: "Buyers didn't change — sellers can now make more at every price." },
                  { t: "Supply shifts left", fb: "Cheaper to make means **more** offered at every price: right." }],
        answer: 0, keep: true, why: "Better technology lowers costs, so supply shifts right." },
      { type: "choice", kicker: "Guess first",
        prompt: "A wheat farmer tries to charge 10% more than every other farm.<br><br>What happens?",
        art: tiles([{ i: "wheat", t: "Thousands of farms", c: "green" }, { i: "tag", t: "Same wheat, same price", c: "orange" }, { i: "up", t: "One farm charges 10% more", c: "red" }]),
        options: [{ t: "Buyers go to other farms selling the same wheat" }, { t: "She earns 10% more", fb: "Her wheat is just like everyone else's. Why would anyone pay her more?" },
                  { t: "All the other farms raise their prices too", fb: "There are thousands of them, each happy to sell at the going price." }],
        answer: 0, keep: true, why: "With many sellers of an identical product, no single seller can raise its price." },
      { type: "learn", kicker: "Explore",
        prompt: "How much power a seller has depends on how many rivals it has — the **market structure**. Slide from many sellers to one, and visit all four.",
        scene: { type: "stops", left: "Many sellers", right: "One seller", stops: L13_STOPS, start: 0 },
        gate: true },
      { type: "choice", kicker: "Your turn", skill: "Market structures",
        prompt: "Your town has one water company, and no one is allowed to set up another.<br><br>Which market structure is this?",
        options: [{ t: "Pure monopoly" }, { t: "Oligopoly", fb: "An oligopoly has a few firms. Here there's exactly one." },
                  { t: "Monopolistic competition", fb: "That has many firms. Here there's only one." }],
        answer: 0, keep: true, why: "A single firm that is the whole industry, protected by a barrier: pure monopoly." },
      { type: "choice", kicker: "Careful", skill: "Market structures",
        prompt: "Is **monopolistic competition** a kind of monopoly?",
        options: [{ t: "No — it has many firms; each brand is just a little bit unique" },
                  { t: "Yes — it has “monopoly” in its name", fb: "The name is misleading! There are many competing firms. The “monopoly” part is only that each brand is its own." }],
        answer: 0, keep: true, why: "Many firms selling close substitutes that still differ: that's competition — each only “owns” its own brand." },
      { type: "learn", kicker: "Barriers to entry",
        prompt: "A monopoly lasts only if rivals can't get in. What keeps them out? Turn over each card.",
        scene: { type: "flip", cols: 4, cards: [
          { i: "bulb", name: "Patents", c: "yellow", t: "Polaroid held patents on instant photos. When Kodak made an instant camera, Polaroid sued and won millions." },
          { i: "mountain", name: "Owning a resource", c: "green", t: "De Beers once controlled 80–85% of the world's uncut diamonds." },
          { i: "capitol", name: "Government order", c: "purple", t: "The law lets only the US Postal Service deliver ordinary letters." },
          { i: "factory", name: "Huge start-up costs", c: "orange", t: "Building big jets or car plants takes billions — few can even try." }] },
        gate: true },
      { type: "sort", skill: "Market structures",
        prompt: "Sort each market into its structure.",
        bins: ["Perfect competition", "Monopolistic competition", "Oligopoly", "Pure monopoly"],
        cards: [{ t: card("wheat", "Corn farming"), bin: 0, fb: "Many farms, identical corn: close to perfect competition." },
                { t: card("burger", "Fast-food chains"), bin: 1, fb: "Many chains, each different: monopolistic competition." },
                { t: card("plane", "Big passenger jets"), bin: 2, fb: "Two or three makers dominate: an oligopoly." },
                { t: card("bolt", "The local power company"), bin: 3, fb: "One company serves the area: a pure monopoly." },
                { t: card("shirt", "Clothing brands"), bin: 1, fb: "Many brands stressing their differences: monopolistic competition." }],
        hints: ["Count the sellers first: very many, many, few, or one?"],
        why: "Corn: perfect competition. Fast food and clothing: monopolistic competition. Jets: oligopoly. Local power: pure monopoly." },
      { type: "learn", kicker: "Real world",
        prompt: "Market structures can change. Follow the US phone business.",
        scene: { type: "chain", steps: [
          { i: "phone", t: "In the 1970s and 80s, AT&T was the only long-distance phone company — a monopoly.", c: "red" },
          { i: "capitol", t: "In 1984, the government split it into seven regional companies.", c: "purple" },
          { i: "store", t: "New rivals like Sprint built fiber-optic networks to compete.", c: "blue" },
          { i: "scale", t: "In 1996 a new law opened local phone markets to competition too.", c: "green" }] },
        gate: true },
      { type: "choice", skill: "Market structures",
        prompt: "Why do firms in monopolistic competition spend so much on advertising?",
        options: [{ t: "To show buyers how their product is different" }, { t: "Because the law requires it", fb: "No law requires it. Their products are similar, so they must convince buyers theirs is special." },
                  { t: "Because they have no competitors", fb: "They have many competitors — that's exactly why they advertise." }],
        answer: 0, keep: true, why: "Their products are close substitutes, so ads stress the differences to justify their prices." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why do the few firms in an oligopoly watch each other so closely?",
        model: "With so few firms, whatever one does — a price cut, a new product, an ad campaign — directly hits the others' sales, so each has to watch and respond." },
      { type: "stops", kicker: "Put it together", skill: "Market structures",
        prompt: "Four companies make nearly all of the country's breakfast cereal. Starting a rival would take huge factories and millions in advertising.<br><br>Move to the structure that fits.",
        left: "Many sellers", right: "One seller", stops: L13_STOPS, start: 0, answer: "ol",
        fb: { pc: "Perfect competition needs very many small sellers. Here there are four.", mc: "Monopolistic competition has many firms and easy entry — not four firms with huge barriers.", mo: "A monopoly has one firm. Here there are four." },
        hints: ["How many sellers? How hard is it to get in?"],
        why: "A few firms making most of the output, protected by huge start-up costs: an oligopoly." }
    ]
  };

  var L13_EX = [
    ["Wheat farming", "pc"], ["Corn farming", "pc"], ["Soybean growers selling at the market price", "pc"],
    ["Fast-food chains", "mc"], ["Clothing brands", "mc"], ["Beauty salons in a big city", "mc"], ["Coffee shops in a downtown area", "mc"], ["Shampoo brands", "mc"],
    ["Big passenger jets (Boeing and Airbus)", "ol"], ["Phone operating systems (Apple and Google)", "ol"], ["Car makers", "ol"], ["Large drug companies", "ol"],
    ["A town's only water company", "mo"], ["The local electric utility", "mo"], ["Ordinary letter delivery by the Postal Service", "mo"], ["A company holding the only patent on a new medicine", "mo"]
  ];
  var L13_NAME = { pc: "Perfect competition", mc: "Monopolistic competition", ol: "Oligopoly", mo: "Pure monopoly" };
  var L13_WHY = { pc: "Very many sellers of nearly identical products: perfect competition.", mc: "Many sellers of similar but different products: monopolistic competition.",
                  ol: "A few big firms, hard to enter: oligopoly.", mo: "One seller, with barriers keeping rivals out: pure monopoly." };

  SKILLS.push(
    { id: "biz1-struct", title: "Market structures", lesson: 13,
      gen: function (R, i) {
        var t = i % 4;
        if (t === 0) {
          var x = R.pick(L13_EX);
          return mc(R, { prompt: "“" + x[0] + ".”<br><br>Which market structure is this?", keep: true, right: L13_NAME[x[1]],
            wrong: ["pc", "mc", "ol", "mo"].filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: L13_NAME[k], fb: L13_WHY[x[1]] }; }),
            hints: ["Count the sellers: very many, many, a few, or one?"], why: L13_WHY[x[1]] });
        }
        if (t === 1) {
          var c = R.pick([
            ["Each firm has no control over its price at all.", "pc"], ["Firms advertise heavily to show how their product differs.", "mc"],
            ["What one firm does directly affects the few others, so they watch each other closely.", "ol"], ["A single firm is the whole industry.", "mo"],
            ["It's very easy to start a business or close one, and buyers know all the prices.", "pc"], ["Large capital requirements keep all but a few firms out.", "ol"]]);
          return mc(R, { prompt: "“" + c[0] + "”<br><br>Which market structure does this describe?", keep: true, right: L13_NAME[c[1]],
            wrong: ["pc", "mc", "ol", "mo"].filter(function (k) { return k !== c[1]; }).map(function (k) { return { t: L13_NAME[k], fb: L13_WHY[c[1]] }; }),
            hints: ["Think about number of sellers, control over price and barriers."], why: L13_WHY[c[1]] });
        }
        if (t === 2) {
          var b = R.pick([
            ["A company holds the patent on a new kind of camera.", "A patent"], ["One company owns nearly every diamond mine.", "Control of a natural resource"],
            ["The law says only one company may deliver ordinary mail.", "A government order"], ["Starting a rival airline-jet maker would cost billions.", "Huge start-up costs"]]);
          var names = ["A patent", "Control of a natural resource", "A government order", "Huge start-up costs"];
          return mc(R, { prompt: "“" + b[0] + "”<br><br>What barrier to entry is this?", keep: true, right: b[1],
            wrong: names.filter(function (n) { return n !== b[1]; }).map(function (n) { return { t: n, fb: "Look at what keeps rivals out here: " + b[1].toLowerCase() + "." }; }),
            hints: ["What exactly stops a new firm from joining?"], why: "The barrier is " + b[1].toLowerCase() + "." });
        }
        var y = R.pick(L13_EX);
        return { type: "stops", prompt: "“" + y[0] + ".”<br><br>Move to the market structure that fits.", left: "Many sellers", right: "One seller", stops: L13_STOPS,
          start: y[1] === "pc" ? 3 : 0, answer: y[1], hints: ["Count the sellers."], why: L13_WHY[y[1]] };
      } }
  );

  /* ============================================================= Lesson 14
     What's changing (1.8): a five-generation workforce, diversity and
     inclusion, AI, global energy demand, relationship management, strategic
     alliances — and a capstone that pulls the unit together. */
  LESSONS[14] = {
    title: "What's changing",
    blurb: "The trends reshaping business — and how companies keep customers and team up to compete.",
    mins: 11,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“A city's only electric company.”<br><br>Which market structure is that?",
        options: [{ t: "Pure monopoly" }, { t: "Oligopoly", fb: "An oligopoly has a few firms; this city has one." }, { t: "Perfect competition", fb: "Perfect competition has very many sellers." }],
        answer: 0, keep: true, why: "One firm is the whole industry: a pure monopoly." },
      { type: "learn", kicker: "Look",
        prompt: "Today's workplaces can have **five generations** side by side. A 60-year-old may work for a 28-year-old manager.",
        art: tiles([{ i: "person", t: "Baby boomers (60s and up)", c: "purple" }, { i: "person", t: "Gen X", c: "blue" }, { i: "person", t: "Millennials — about 40% of US workers", c: "green" },
                    { i: "person", t: "Gen Z", c: "orange" }, { i: "person", t: "Gen Alpha, coming next", c: "yellow" }]),
        after: "Many boomers keep working past 65 — for the money, or because they like feeling useful. Older workers bring experience; younger ones try new things." },
      { type: "multi", kicker: "Your turn", skill: "Trends",
        prompt: "A company doesn't want to lose what its experienced older workers know. Which moves help? Pick all that apply.",
        options: [{ t: "Offer flexible hours or working from home", ok: true, fb: "Yes — flexibility keeps many older workers on." },
                  { t: "Let people retire in stages, working part-time first", ok: true, fb: "Yes — phased retirement keeps their know-how longer." },
                  { t: "Plan who will take over each person's knowledge", ok: true, fb: "Yes — tracking who is near retirement lets them pass on what they know." },
                  { t: "Only promote people under 30", ok: false, fb: "That would push experienced workers out — the opposite of the goal." }],
        hints: ["What would make an experienced worker stay longer, or share what they know?"],
        why: "Flexible hours, phased retirement and planning for handover all keep older workers' knowledge in the company." },
      { type: "learn", kicker: "Three big trends",
        prompt: "Turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "people", name: "Diversity and inclusion", c: "purple", t: "Diverse, inclusive teams are linked to stronger results and success in new markets. Companies like EY build it into their strategy." },
          { i: "robot", name: "AI", c: "blue", t: "AI and machine learning speed work up **and** make it more precise — in product design, quality control and spotting new markets." },
          { i: "bolt", name: "Energy", c: "orange", t: "As living standards rise around the world, countries need more and more energy." }] },
        gate: true },
      { type: "learn", kicker: "Watch",
        prompt: "What does rising energy demand do? You already know from supply and demand.",
        art: photo("solar", "Solar panels on rooftops — one way countries add new energy supply."),
        scene: { type: "chain", steps: [
          { i: "up", t: "Living standards rise in China and India.", c: "green" },
          { i: "bolt", t: "They use far more oil and power — together, over half the world's recent growth in oil use.", c: "orange" },
          { i: "tag", t: "Demand shifts right, so energy prices rise.", c: "red" }] },
        gate: true,
        then: "Relying on one supplier is risky: the EU cut its reliance on Russian gas from about 45% in 2021 to under 20% by 2023. New sources help — shale oil (“fracking”) now gives the US more than half its oil." },
      { type: "learn", kicker: "New words",
        prompt: "How do companies compete in all this change? One key idea is **relationship management**: building long-lasting, win-win relationships.",
        art: tiles([{ i: "heart", t: "With customers: relationship marketing", c: "red" }, { i: "truck", t: "With suppliers: supply chain management", c: "blue" }]),
        after: "Long-time customers buy more, need less help, care less about price, and bring their friends — and they cost nothing to win." },
      { type: "learn", kicker: "Try it",
        prompt: "A shop starts with 1,000 customers and loses 15% of them every year. Slide the yearly loss down to **10%** and watch what happens.",
        scene: { type: "retain", compare: 15, lose: 15, goal: { lose: 10 } },
        gate: true, then: "Keeping customers adds up year after year. In some industries, cutting customer losses from 15% to 10% a year can **double** profits." },
      { type: "choice", kicker: "Real world", skill: "Trends",
        prompt: "Harry's razors started out selling only online. Then Harry's teamed up with Target, which became the only big chain to carry it.<br><br>What kind of move is that?",
        options: [{ t: "A strategic alliance" }, { t: "Relationship marketing", fb: "Relationship marketing is about keeping customers. This is two companies teaming up." },
                  { t: "A monopoly", fb: "Nobody took over a whole market — two firms agreed to work together." }],
        answer: 0, keep: true, why: "A cooperative agreement between businesses is a **strategic alliance** (or strategic partnership)." },
      { type: "sort", skill: "Trends",
        prompt: "Sort each move.",
        bins: ["Relationship marketing", "Supply chain management", "Strategic alliance"],
        cards: [{ t: "A café's app rewards its regulars with free drinks", bin: 0, fb: "Building loyalty with customers: relationship marketing." },
                { t: "A car maker works for years with the same parts suppliers", bin: 1, fb: "Strong bonds with suppliers: supply chain management." },
                { t: "Nike has independent factories make its shoes", bin: 2, fb: "A cooperative deal between firms: a strategic alliance." },
                { t: "Two tech companies team up to build a product together", bin: 2, fb: "Firms with different strengths working together: a strategic alliance." }],
        hints: ["Customers, suppliers, or another company as a partner?"],
        why: "Customers: relationship marketing. Suppliers: supply chain management. Partner companies: strategic alliances." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why is a customer who has stayed for years worth more than a brand-new one?",
        model: "Long-time customers buy more, take less time to serve, worry less about price and bring in new customers — and the business doesn't have to pay to win them." },
      { type: "multi", kicker: "Put it all together",
        prompt: "Rosa's taco truck (from lesson 1) has a hard year: a **recession** cuts people's spending, and a **rival** truck starts parking nearby.<br><br>Which moves make sense? Pick all that apply.",
        art: tiles([{ i: "truck", t: "Rosa's truck", c: "orange" }, { i: "down", t: "Recession", c: "red" }, { i: "trophy", t: "A new rival", c: "yellow" }]),
        options: [{ t: "Reward regulars with a loyalty card", ok: true, fb: "Yes — keeping her customers is cheaper than winning new ones." },
                  { t: "Team up with a local brewery to serve at its events", ok: true, fb: "Yes — a strategic alliance brings in customers she wouldn't reach alone." },
                  { t: "Watch her costs closely, since sales will be lower", ok: true, fb: "Yes — with less revenue coming in, costs decide whether she keeps a profit." },
                  { t: "Raise prices sharply while people are spending less", ok: false, fb: "With lower demand and a rival nearby, a big price rise would send customers to the other truck." },
                  { t: "Complain that the rival is unfair and change nothing", ok: false, fb: "Competition is part of the external environment. Businesses adapt to it." }],
        hints: ["Think back: profit, the environment, demand in a recession, and keeping customers."],
        why: "Keep customers, find partners, and control costs; don't raise prices into falling demand and a new rival. Businesses adapt to their environment." }
    ]
  };

  var L14_BANK = [
    ["A clothing shop sends birthday discounts to its loyal customers.", "rm"], ["An airline gives frequent flyers free upgrades.", "rm"], ["A gym calls members who haven't come in a while to check on them.", "rm"],
    ["A bakery signs a five-year deal with the same flour mill and plans deliveries together.", "scm"], ["A phone maker works closely with its chip suppliers on new designs.", "scm"],
    ["A burger chain helps its farmers improve quality, and buys from them for years.", "scm"],
    ["Nike partners with independent factories to make its shoes.", "sa"], ["A razor brand teams up with a big retailer that becomes its only mass-market store.", "sa"],
    ["An automaker and a battery maker team up to build electric cars.", "sa"], ["Two airlines share routes and let each other's passengers connect.", "sa"]
  ];
  var L14_NAME = { rm: "Relationship marketing", scm: "Supply chain management", sa: "A strategic alliance" };
  var L14_WHY = { rm: "Building long-term loyalty with customers is relationship marketing.", scm: "Building strong bonds with suppliers is supply chain management.",
                  sa: "A cooperative agreement between businesses is a strategic alliance." };

  SKILLS.push(
    { id: "biz1-trends", title: "Trends and competitive strategies", lesson: 14,
      gen: function (R, i) {
        var t = i % 4;
        if (t === 0 || t === 3) {
          var x = R.pick(L14_BANK);
          return mc(R, { prompt: "“" + x[0] + "”<br><br>What kind of move is this?", keep: true, right: L14_NAME[x[1]],
            wrong: ["rm", "scm", "sa"].filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: L14_NAME[k], fb: L14_WHY[x[1]] }; }),
            hints: ["Is it about customers, suppliers, or a partner company?"], why: L14_WHY[x[1]] });
        }
        if (t === 1) {
          var n0 = R.pick([1000, 2000, 500]), lose = R.pick([10, 20, 25, 50]), yrs = R.pick([1, 2]);
          var left = n0 * Math.pow(1 - lose / 100, yrs);
          return { type: "amount", prompt: "A business has " + count(n0) + " customers and loses " + lose + "% of them each year (winning no new ones).<br><br>How many are left after " + yrs + " year" + (yrs > 1 ? "s" : "") + "?",
            answer: left, post: "customers",
            near: [{ v: n0 - n0 * lose / 100 * yrs, fb: "Each year it loses " + lose + "% of the customers it has **left**, not of the starting number." }, { v: n0 * lose / 100, fb: "That's how many it loses in the first year. How many stay?" }].filter(function (nn) { return Math.abs(nn.v - left) > 1e-9; }),
            hints: ["Losing " + lose + "% leaves " + (100 - lose) + "% each year.", yrs > 1 ? "Do it one year at a time." : "Multiply by " + num((100 - lose) / 100) + "."],
            why: yrs > 1 ? count(n0) + " × " + num((100 - lose) / 100) + " = " + count(n0 * (1 - lose / 100)) + " after one year; × " + num((100 - lose) / 100) + " again = " + count(left) + "." :
                           count(n0) + " × " + num((100 - lose) / 100) + " = " + count(left) + "." };
        }
        var q = R.pick([
          { p: "World demand for energy rises while supply stays the same. What happens to energy prices?", r: "They rise",
            w: [{ t: "They fall", fb: "More demand with the same supply: the demand curve shifts right, and the price rises." }, { t: "They stay the same", fb: "A shift in demand moves the equilibrium price." }] },
          { p: "Why do countries try to buy energy from many suppliers instead of one?", r: "Depending on one supplier is risky if it cuts supply or raises prices",
            w: [{ t: "Because one supplier is always more expensive", fb: "Not always — the real worry is being held captive if that one supplier stops." }, { t: "Because the law forbids using one supplier", fb: "It's about risk, not law." }] },
          { p: "Why are long-time customers so valuable?", r: "They buy more, cost less to serve, and bring in new customers",
            w: [{ t: "They always pay higher prices by law", fb: "No law — they are just less sensitive to price, and cheaper to keep." }, { t: "They never need any service", fb: "They need less of a company's time, not none." }] },
          { p: "How can a company benefit from a workforce spanning five generations?", r: "By combining older workers' experience with younger workers' fresh ideas",
            w: [{ t: "By keeping the generations apart", fb: "The strength is in combining them." }, { t: "By replacing older workers as fast as possible", fb: "That throws away valuable experience." }] }]);
        return mc(R, { prompt: q.p, right: q.r, wrong: q.w, hints: ["Think about what the trend changes for the business."], why: q.r + "." });
      } }
  );

L.unit("biz", 1, {
    title: "Economic systems and business",
    lessons: LESSONS.slice(1),
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "Goods and services, profit and loss, not-for-profits, living standards and the factors of production.", skills: ["biz1-goods", "biz1-profit", "biz1-nfp", "biz1-living", "biz1-factors"], per: 2 },
      { title: "Quiz 2", after: 6, blurb: "The business environment, economic systems, macro and micro, and the circular flow.", skills: ["biz1-env", "biz1-systems", "biz1-macro", "biz1-flow"], per: 2 },
      { title: "Quiz 3", after: 10, blurb: "Growth, jobs, prices, and the two ways a government steers the economy.", skills: ["biz1-gdp", "biz1-cycle", "biz1-unrate", "biz1-untype", "biz1-power", "biz1-cpi", "biz1-policy", "biz1-deficit"], per: 1 },
      { title: "Quiz 4", after: 14, blurb: "Supply and demand, shifts, market structures and the trends reshaping business.", skills: ["biz1-equil", "biz1-shift", "biz1-struct", "biz1-trends"], per: 2 }
    ],
    skills: SKILLS
  });
})();
