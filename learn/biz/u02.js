/* ==========================================================================
   Introduction to Business — Unit 2: Ethics and social responsibility.
   See lab/core.js for the format and lab/bizkit.js for the scenes.

   Follows chapter 2 of OpenStax's Introduction to Business 2e — how people
   tell right from wrong, how companies shape the way their people act, a
   business's responsibilities to society and to each of its stakeholders,
   and where all of it is heading — in eight short lessons. The chapter's
   topics are followed; every sentence, example and problem here is
   OEdu's own.

   Built the way Unit 1 is: something real to look at or a guess first; the
   idea met by doing something — a choice whose consequences you watch
   land, a pyramid you build from the bottom, a company whose stakeholders
   you visit — and named only after; the usual mistake met head on; one
   explanation in the student's own words; a question from an earlier
   lesson to open every lesson after the first. Nine skills practice it,
   four quizzes check it, and the unit test draws on every skill.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var B = L.B, mc = L.mc, num = L.num, usd = L.usd, icon = L.icon, card = L.card, tiles = L.tiles, photo = L.photo;
  var money = B.money, pct = B.pct, count = B.count, sample = B.sample, round = B.round;
  var LESSONS = [], SKILLS = [];   // lesson-count: 8

  /* ============================================================== Lesson 1
     Right, wrong and hard to tell (2.1): ethics, ethical issues, and the
     eleven kinds of unethical business behavior, in four groups. */
  var U2_GROUPS = [
    { k: "take", name: "Taking and lying", i: "hand", c: "red",
      kinds: ["Taking things that don't belong to you", "Saying things you know are not true", "Giving or allowing false impressions"] },
    { k: "conf", name: "Conflicts and secrets", i: "eye", c: "purple",
      kinds: ["Buying influence, or a conflict of interest", "Hiding or leaking information"] },
    { k: "fair", name: "Unfair treatment", i: "scale", c: "orange",
      kinds: ["Taking unfair advantage", "Abusing power and mistreating people", "Permitting organizational abuse"] },
    { k: "rule", name: "Rules and conduct", i: "book", c: "blue",
      kinds: ["Improper personal behavior", "Violating rules", "Condoning unethical actions"] }
  ];
  LESSONS[1] = {
    title: "Right, wrong and hard to tell",
    blurb: "What ethics is, why some choices are hard — and the eleven kinds of unethical behavior.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "A business took in **\\$5 million** this year, but its costs were **\\$6 million**.<br><br>What does it have?",
        options: [{ t: "A loss of \\$1 million" }, { t: "A profit of \\$5 million", fb: "\\$5 million is its revenue. Take away the costs: 5 − 6 is below zero." },
                  { t: "A profit of \\$1 million", fb: "Costs were bigger than revenue — that's a loss, not a profit." }],
        answer: 0, keep: true, why: "Profit = revenue − costs = \\$5 million − \\$6 million = −\\$1 million: a loss. (Unit 1)" },
      { type: "choice", kicker: "Guess first",
        prompt: "A drug company bought an old, life-saving medicine and raised its price by **4,000%** overnight. Its CEO called it “a great business decision.”<br><br>What do you think?",
        art: tiles([{ i: "hospital", t: "A life-saving drug", c: "blue" }, { i: "up", t: "Price up 4,000%", c: "red" }, { i: "people", t: "Patients who need it", c: "orange" }]),
        options: [{ t: "It may have made money, but most people saw it as wrong" },
                  { t: "It was fine — a business should always charge the most it can", fb: "Profit matters, but patients who couldn't afford the drug were put at risk. Few people would call that right. The CEO was later banned from the drug industry for life." },
                  { t: "Right and wrong don't apply to business", fb: "Every business decision affects real people — that's exactly where right and wrong come in." }],
        answer: 0, keep: true, why: "Making money and doing right can pull apart. The CEO was later banned from the drug industry for life." },
      { type: "learn", kicker: "New words",
        prompt: "**Ethics** is a set of moral standards for judging whether something is right or wrong.<br><br>An **ethical issue** is a situation where someone must choose between actions that may be ethical or unethical.",
        art: tiles([{ i: "scale", t: "Ethics: judging right from wrong", c: "purple" }, { i: "question", t: "An ethical issue: a choice to make", c: "orange" }]) },
      { type: "learn", kicker: "Try it",
        prompt: "Carmen runs a factory with 100 workers. Its buyers overseas expect bribes. She refuses, and keeps losing contracts — by December the factory may close.<br><br>Try each choice and see who it helps and who it hurts.",
        scene: { type: "dilemma", options: [
          { key: "pay", t: "Start paying the bribes",
            effects: [{ who: "Workers", i: "worker", d: 1, t: "Keep their jobs — for now." },
                      { who: "Carmen", i: "person", d: -1, t: "Breaks the law in most countries, and her own values." },
                      { who: "The market", i: "globe", d: -1, t: "Bribes keep rewarding the dishonest, not the best product." }],
            say: "The jobs are saved — but the business now depends on something wrong, and could collapse if it's caught." },
          { key: "refuse", t: "Keep refusing and hunt for honest buyers",
            effects: [{ who: "Workers", i: "worker", d: -1, t: "Their jobs are at risk." },
                      { who: "Carmen", i: "person", d: 1, t: "Keeps her integrity and stays within the law." },
                      { who: "The market", i: "globe", d: 1, t: "One fewer company feeding the bribes." }],
            say: "The right thing can cost something real — here, possibly people's jobs." }] },
        gate: true, then: "That's what makes an ethical issue hard: every choice costs **someone** something." },
      { type: "learn", kicker: "Eleven kinds, four groups",
        prompt: "Researchers found that every unethical business act fits one of **eleven** kinds. They fall into four groups — turn over each card.",
        scene: { type: "flip", cols: 2, cards: U2_GROUPS.map(function (g) {
          return { i: g.i, name: g.name, c: g.c, t: g.kinds.join(" · ") };
        }) },
        gate: true },
      { type: "sort", skill: "Unethical behavior",
        prompt: "Which group does each act belong to?",
        bins: ["Taking and lying", "Conflicts and secrets", "Unfair treatment", "Rules and conduct"],
        cards: [{ t: "Printing your band's flyers on the office printer", bin: 0, fb: "Using company property for yourself is taking something that isn't yours." },
                { t: "Giving a contract you control to your cousin's firm", bin: 1, fb: "Your personal gain is mixed into an official decision — a conflict of interest." },
                { t: "Letting an overseas supplier use child labor", bin: 2, fb: "Allowing workers to be mistreated through your operations is organizational abuse." },
                { t: "Seeing a coworker steal cash and saying nothing", bin: 3, fb: "Overlooking someone else's wrongdoing is condoning it — itself unethical." }],
        hints: ["Taking or lying? A conflict or a secret? Treating people unfairly? Breaking rules or looking away?"],
        why: "Printer: taking. Cousin's firm: a conflict of interest. Child labor: organizational abuse. Staying silent: condoning." },
      { type: "choice", kicker: "Careful", skill: "Unethical behavior",
        prompt: "A car dealer knows a used car was in a bad crash. The buyer never asks, and the dealer never mentions it.<br><br>Is that unethical?",
        options: [{ t: "Yes — letting someone believe something false is unethical" },
                  { t: "No — the dealer never told a lie", fb: "You don't need to lie out loud. Staying silent so a buyer believes something false is **giving a false impression**." }],
        answer: 0, keep: true, why: "Giving or allowing a false impression is unethical, even without a spoken lie." },
      { type: "choice", kicker: "New word", skill: "Unethical behavior",
        prompt: "A state official is investigating a company. Meanwhile, the company gives a big contract to a firm owned by the official's parent.<br><br>What is this?",
        options: [{ t: "A conflict of interest" }, { t: "Fair competition", fb: "The contract could sway the investigation. That's personal gain mixed into official duties." },
                  { t: "Violating a company rule", fb: "It may break rules too, but the heart of it is personal gain colliding with an official role." }],
        answer: 0, keep: true, why: "A **conflict of interest** is when someone's official duties could be swayed by a chance of personal gain." },
      { type: "explain", kicker: "In your own words",
        prompt: "After Hurricane Katrina, stranded, hungry people took food and water from flooded stores without paying. Was that unethical? Explain your thinking.",
        model: "Taking what isn't yours is normally wrong. But when people's lives are at risk, it becomes a real ethical issue: you weigh the harm to the store against survival — and many people would say need made it right." },
      { type: "multi", kicker: "Put it together", skill: "Unethical behavior",
        prompt: "Which of these are unethical? Pick all that apply.",
        options: [{ t: "Adding a made-up dinner to your travel expenses", ok: true, fb: "Yes — that's taking money that isn't yours." },
                  { t: "Blaming a coworker for your own mistake", ok: true, fb: "Yes — saying something you know isn't true." },
                  { t: "Refusing a bribe from a supplier", ok: false, fb: "Refusing a bribe is the ethical choice." },
                  { t: "Taking your old company's secret recipes to a new job", ok: true, fb: "Yes — leaking information that isn't yours to share." },
                  { t: "Reporting a safety problem to your manager", ok: false, fb: "Reporting a problem is doing the right thing." }],
        hints: ["For each one: is someone taking, lying, leaking, or treating others unfairly?"],
        why: "Padding expenses (taking), blaming others (lying) and taking trade secrets (leaking) are unethical. Refusing bribes and reporting problems are ethical." }
    ]
  };

  var U2_ACTS = [
    ["An employee uses the company credit card for a family dinner.", "take", 0], ["A manager takes credit for a report her assistant wrote.", "take", 1],
    ["A salesperson says cardboard boxes will survive a long trip, knowing they won't.", "take", 2], ["A worker adds a made-up taxi ride to her expense report.", "take", 0],
    ["A worker spreads a false rumor about a rival for a promotion.", "take", 1], ["A store advertises a “sale” price that was never higher.", "take", 2],
    ["A buyer accepts expensive gifts from a supplier hoping for a big order.", "conf", 0], ["A judge rules on a case involving her brother's company.", "conf", 0],
    ["A drug maker hides a study showing serious side effects.", "conf", 1], ["An engineer takes his old employer's secret designs to a rival.", "conf", 1],
    ["A lender buries sky-high fees in a contract most people can't follow.", "fair", 0], ["A manager humiliates an employee in front of customers.", "fair", 1],
    ["A company lets its overseas factories pay unfairly low wages for 80-hour weeks.", "fair", 2], ["A landlord charges a tenant who can't read English for services never given.", "fair", 0],
    ["A delivery driver drives after drinking at lunch.", "rule", 0], ["A clerk skips the required double-check on refunds to save time.", "rule", 1],
    ["An accountant notices a coworker faking checks and ignores it.", "rule", 2], ["A supervisor ignores the company's safety rules to finish faster.", "rule", 1]
  ];
  var U2_KIND = function (a) { var g = U2_GROUPS.filter(function (x) { return x.k === a[1]; })[0]; return g.kinds[a[2]]; };
  var U2_OK = ["Refusing a supplier's cash gift", "Telling a customer about a product's known flaw", "Reporting a coworker's theft", "Paying overseas workers a fair wage",
               "Returning extra change a customer gave by mistake", "Keeping a customer's personal data private", "Following the safety rules even when rushed"];

  SKILLS.push(
    { id: "biz2-unethical", title: "Recognizing unethical behavior", lesson: 1,
      gen: function (R, i) {
        var t = i % 4, a = R.pick(U2_ACTS), g = U2_GROUPS.filter(function (x) { return x.k === a[1]; })[0];
        if (t === 0) {
          return mc(R, { prompt: "“" + a[0] + "”<br><br>Which group of unethical behavior is this?", keep: true, right: g.name,
            wrong: U2_GROUPS.filter(function (x) { return x !== g; }).map(function (x) { return { t: x.name, fb: "Look at what's actually wrong here: " + U2_KIND(a).toLowerCase() + " — that's in “" + g.name + ".”" }; }),
            hints: ["Taking or lying? A conflict or a secret? Unfair treatment? Rules and conduct?"], why: "This is " + U2_KIND(a).toLowerCase() + ", in the group “" + g.name + ".”" });
        }
        if (t === 1) {
          var all = []; U2_GROUPS.forEach(function (x) { all = all.concat(x.kinds); });
          var right = U2_KIND(a);
          return mc(R, { prompt: "“" + a[0] + "”<br><br>Which kind of unethical behavior is this?", right: right,
            wrong: sample(R, all.filter(function (x) { return x !== right; }), 3).map(function (x) { return { t: x, fb: "That's a different kind. This one is: " + right.toLowerCase() + "." }; }),
            hints: ["What exactly is wrong: taking, lying, a secret, a conflict, unfairness, abuse, or rules?"], why: "It's " + right.toLowerCase() + "." });
        }
        if (t === 2) {
          var bad = R.chance(0.6), txt = bad ? a[0] : R.pick(U2_OK) + ".";
          return mc(R, { prompt: "“" + txt + "”<br><br>Is this ethical or unethical?", keep: true, right: bad ? "Unethical" : "Ethical",
            wrong: [{ t: bad ? "Ethical" : "Unethical", fb: bad ? "This is " + U2_KIND(a).toLowerCase() + "." : "This is the honest, fair choice." }],
            hints: ["Is anyone deceived, harmed or treated unfairly?"], why: bad ? "Unethical: " + U2_KIND(a).toLowerCase() + "." : "Ethical: it's honest and fair to everyone involved." });
        }
        var cards = U2_GROUPS.map(function (x, k) { var s = R.pick(U2_ACTS.filter(function (y) { return y[1] === x.k; })); return { t: s[0], bin: k, fb: "This is " + U2_KIND(s).toLowerCase() + " — “" + x.name + ".”" }; });
        return { type: "sort", prompt: "Sort each act into its group.", bins: U2_GROUPS.map(function (x) { return x.name; }), cards: R.shuffle(cards),
                 hints: ["Taking or lying? A conflict or a secret? Unfair treatment? Rules and conduct?"], why: "Each act matches one group: taking and lying, conflicts and secrets, unfair treatment, rules and conduct." };
      } }
  );

  /* ============================================================== Lesson 2
     How people decide what's right (2.1): justice, utilitarianism,
     deontology (duties) and individual rights — and each one's weak spot. */
  var U2P = { jus: "Justice (fairness)", uti: "Utilitarianism (the most good)", deo: "Duties (deontology)", rig: "Individual rights" };
  LESSONS[2] = {
    title: "How people decide what's right",
    blurb: "Four ways of reasoning about right and wrong — and where each one gets stuck.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“A manager hires her cousin's company for a job she's in charge of.”<br><br>What kind of unethical behavior is that?",
        options: [{ t: "A conflict of interest" }, { t: "Taking unfair advantage", fb: "The problem is her personal ties swaying an official decision — a conflict of interest." },
                  { t: "Violating rules", fb: "It may break rules, but the core problem is personal gain mixed into her duties." }],
        answer: 0, keep: true, why: "Personal gain colliding with official duties is a conflict of interest." },
      { type: "learn", kicker: "Try it",
        prompt: "Sales are down at a 50-person company. The owner must cut costs. Try both choices.",
        scene: { type: "dilemma", options: [
          { key: "fire", t: "Lay off 5 people; everyone else keeps full-time hours",
            effects: [{ who: "The 5 laid off", i: "person", d: -1, t: "Lose their jobs completely." },
                      { who: "The other 45", i: "people", d: 1, t: "Keep their full pay." },
                      { who: "The company", i: "store", d: 1, t: "Saves the money it needs." }],
            say: "Most people are better off — but five people carry all the cost." },
          { key: "share", t: "Keep everyone, but cut all 50 to 30 hours a week",
            effects: [{ who: "The 5", i: "person", d: 1, t: "Keep a job." },
                      { who: "The other 45", i: "people", d: -1, t: "Every one of them takes a pay cut." },
                      { who: "The company", i: "store", d: 1, t: "Saves about the same money." }],
            say: "No one loses everything — but everyone gives something up." }] },
        gate: true, then: "Thoughtful people disagree here, because they **reason** differently. Let's name the four main ways." },
      { type: "learn", kicker: "Four ways of reasoning",
        prompt: "Turn over each card.",
        scene: { type: "flip", cols: 2, cards: [
          { i: "scale", name: "Justice", c: "purple", t: "What's **fair** by society's standards — sharing burdens and rewards fairly. Think “equal pay for equal work.”" },
          { i: "people", name: "Utilitarianism", c: "green", t: "Judge an action by its **consequences**: choose the greatest good for the greatest number." },
          { i: "book", name: "Duties (deontology)", c: "blue", t: "Keep your **obligations** — promises, the law — because doing your duty is what's right." },
          { i: "shield", name: "Individual rights", c: "orange", t: "People have **rights** that can't be taken away: human rights like life and freedom, and legal rights like free speech and privacy." }] },
        gate: true },
      { type: "choice", kicker: "Your turn", skill: "Ways of reasoning",
        prompt: "The owner says: “Laying off five people protects the other 45 jobs. That's the most good for the most people.”<br><br>Which way of reasoning is that?",
        options: [{ t: U2P.uti }, { t: U2P.jus, fb: "Justice asks whether burdens are shared **fairly**. Here the argument counts how many people come out ahead." },
                  { t: U2P.deo, fb: "Duty reasoning talks about promises and obligations, not totals of good." }],
        answer: 0, keep: true, why: "Counting consequences to get the most good for the most people is utilitarianism." },
      { type: "choice", kicker: "Careful", skill: "Ways of reasoning",
        prompt: "What is a real weakness of utilitarianism?",
        options: [{ t: "It's hard to predict how a decision will affect many people — and there are always losers" },
                  { t: "It ignores consequences completely", fb: "The opposite — consequences are all it looks at." },
                  { t: "It only works for small businesses", fb: "Size isn't the issue. Predicting effects on many people is hard, and someone always loses." }],
        answer: 0, keep: true, why: "Utilitarianism needs accurate predictions about many people, always creates winners and losers, and can accept costs some find unacceptable." },
      { type: "learn", kicker: "When duties clash",
        prompt: "An internet technician believes it's their duty to be on time, and to obey the law. Today they're running late.",
        scene: { type: "dilemma", options: [
          { key: "speed", t: "Speed to arrive on time",
            effects: [{ who: "Duty: be on time", i: "clock", d: 1, t: "Kept." }, { who: "Duty: obey the law", i: "scale", d: -1, t: "Broken — and other drivers are put at risk." }],
            say: "One duty kept, one broken." },
          { key: "late", t: "Drive safely and arrive late",
            effects: [{ who: "Duty: be on time", i: "clock", d: -1, t: "Broken — the customer waits." }, { who: "Duty: obey the law", i: "scale", d: 1, t: "Kept." }],
            say: "Still one duty kept and one broken." }] },
        gate: true, then: "Duty reasoning gives **consistent** decisions — until two duties clash. Then it offers no clear answer." },
      { type: "choice", kicker: "Justice", skill: "Ways of reasoning",
        prompt: "Should a supermarket cashier be paid the same as a surgeon?<br><br>Most people in a market economy say…",
        options: [{ t: "No — the jobs are valued differently, so different pay can still be fair" },
                  { t: "Yes — fairness means everyone gets exactly the same", fb: "Justice means a **fair** share, not an identical one. Most people accept that jobs the market values differently are paid differently." }],
        answer: 0, keep: true, why: "Justice is what's fair by society's standards. In a democracy, “equal pay for equal work” — not equal pay for all work — is widely seen as fair." },
      { type: "choice", skill: "Ways of reasoning",
        prompt: "A company wants to read the private messages on employees' personal phones.<br><br>Which way of reasoning most clearly objects?",
        options: [{ t: U2P.rig }, { t: U2P.uti, fb: "It might, if the harm outweighs the good. But the clearest objection is that it breaks a right — privacy." },
                  { t: U2P.jus, fb: "The core objection is about a right — the right to privacy." }],
        answer: 0, keep: true, why: "Privacy is a right. Reading personal messages takes it away — the individual-rights view objects directly." },
      { type: "sort", kicker: "Put it together", skill: "Ways of reasoning",
        prompt: "Match each argument to its way of reasoning.",
        bins: ["Justice", "Utilitarianism", "Duties", "Rights"],
        cards: [{ t: "“Everyone doing this job should be paid the same.”", bin: 0, fb: "Equal pay for equal work: justice." },
                { t: "“Choose the plan that helps the most people.”", bin: 1, fb: "The most good for the most people: utilitarianism." },
                { t: "“I promised the customer, so I'll deliver — whatever it costs me.”", bin: 2, fb: "Keeping an obligation because it's your duty: deontology." },
                { t: "“No one should be fired for their religion.”", bin: 3, fb: "Freedom of religion is a right: individual rights." }],
        hints: ["Fairness? Consequences? Obligations? Rights?"],
        why: "Fair shares: justice. Most good: utilitarianism. Promises: duties. Freedoms: rights." },
      { type: "explain", kicker: "In your own words",
        prompt: "Pick one of the four ways of reasoning. What's one strength of it, and one weakness?",
        model: "For example, utilitarianism is practical because it looks at real results for everyone, but it's hard to predict those results and it can sacrifice a few people for the many." }
    ]
  };

  var U2P_BANK = [
    ["“We should close the plant if it saves more jobs overall than it costs.”", "uti"], ["“This drug helps millions, so a small risk to a few is acceptable.”", "uti"],
    ["“Pick the option with the best total outcome for everyone involved.”", "uti"], ["“Moving the factory creates more jobs than it destroys, so it's right.”", "uti"],
    ["“Two people doing the same work should get the same pay.”", "jus"], ["“The burden of cuts should be shared fairly by everyone, bosses included.”", "jus"],
    ["“Promotions should go to whoever earned them, not to friends.”", "jus"], ["“It's only fair that those who contributed most receive the most.”", "jus"],
    ["“I signed the contract, so I'll honor it even though it now loses money.”", "deo"], ["“The law says to report it, so I'll report it.”", "deo"],
    ["“I always tell the truth to customers — it's my duty.”", "deo"], ["“A promise is a promise, whatever the result.”", "deo"],
    ["“Workers have a right to speak freely without being fired.”", "rig"], ["“Customers' private data belongs to them — we can't sell it.”", "rig"],
    ["“No one can be denied a job because of their race.”", "rig"], ["“Employees have a right to privacy in their personal lives.”", "rig"]
  ];
  var U2P_WEAK = { uti: "It's hard to predict the effects on many people, and there are always losers.", deo: "When two duties clash, it gives no clear answer.",
                   jus: "Societies disagree about what a fair share is.", rig: "One person's rights can conflict with another's." };

  SKILLS.push(
    { id: "biz2-philo", title: "Ways of reasoning about ethics", lesson: 2,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 0 || t === 2 && R.chance(0.5)) {
          var x = R.pick(U2P_BANK);
          return mc(R, { prompt: x[0] + "<br><br>Which way of reasoning is this?", keep: true, right: U2P[x[1]],
            wrong: Object.keys(U2P).filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: U2P[k], fb: "Listen for the key idea: " + { uti: "the most good overall", jus: "fairness", deo: "duty and promises", rig: "a right that can't be taken away" }[x[1]] + "." }; }),
            hints: ["Fairness? Consequences? Duties? Rights?"], why: "The argument rests on " + { uti: "consequences — the most good for the most people", jus: "fairness", deo: "an obligation or duty", rig: "a right" }[x[1]] + ": " + U2P[x[1]].toLowerCase() + "." });
        }
        if (t === 1) {
          var k = R.pick(Object.keys(U2P_WEAK));
          return mc(R, { prompt: "Which is a weakness of **" + U2P[k].replace(/ \(.*\)/, "") + "**?", right: U2P_WEAK[k],
            wrong: Object.keys(U2P_WEAK).filter(function (x) { return x !== k; }).map(function (x) { return { t: U2P_WEAK[x], fb: "That's the weak spot of " + U2P[x].replace(/ \(.*\)/, "").toLowerCase() + "." }; }).slice(0, 3),
            hints: ["Where would this way of reasoning get stuck?"], why: U2P[k].replace(/ \(.*\)/, "") + ": " + U2P_WEAK[k].charAt(0).toLowerCase() + U2P_WEAK[k].slice(1) });
        }
        var cards = ["jus", "uti", "deo", "rig"].map(function (k, b) { var s = R.pick(U2P_BANK.filter(function (y) { return y[1] === k; })); return { t: s[0], bin: b, fb: "This rests on " + U2P[k].toLowerCase() + "." }; });
        return { type: "sort", prompt: "Match each argument to its way of reasoning.", bins: ["Justice", "Utilitarianism", "Duties", "Rights"], cards: R.shuffle(cards),
                 hints: ["Fairness? Consequences? Obligations? Rights?"], why: "Fairness: justice. Most good: utilitarianism. Obligations: duties. Freedoms: rights." };
      } }
  );

  /* ============================================================== Lesson 3
     How companies shape conduct (2.2): the cost of scandals, leading by
     example, ethics training, codes of ethics. */
  LESSONS[3] = {
    title: "How companies shape conduct",
    blurb: "Scandals and what they cost — and the three ways an organization builds an honest culture.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“I signed the contract, so I'll honor it — even though it now loses us money.”<br><br>Which way of reasoning is that?",
        options: [{ t: "Duties (deontology)" }, { t: "Utilitarianism", fb: "Utilitarianism would weigh the losses. This speaker keeps a promise because it's their duty." },
                  { t: "Justice", fb: "This isn't about fair shares — it's about keeping an obligation." }],
        answer: 0, keep: true, why: "Keeping an obligation because it's your duty is deontology." },
      { type: "choice", kicker: "Look",
        prompt: "Three real stories:<br>• Bank employees opened more than **2 million** fake accounts to hit sales targets.<br>• An investment adviser swindled clients out of more than **\\$65 billion** and got **150 years** in prison.<br>• A car maker paid over **\\$30 billion** for software that cheated emissions tests.<br><br>What did these ethics failures cost?",
        art: tiles([{ i: "news", t: "2 million fake accounts", c: "red" }, { i: "news", t: "$65 billion fraud", c: "red" }, { i: "news", t: "$30 billion for cheating", c: "red" }]),
        options: [{ t: "Money, reputations, jobs — and even prison" }, { t: "Nothing much — big companies just pay a fine", fb: "The fines were huge, CEOs lost their jobs, and one leader went to prison. Trust is expensive to lose." },
                  { t: "Only the employees who did it were affected", fb: "Customers, investors and every honest worker at those companies paid too." }],
        answer: 0, keep: true, why: "Poor ethics can cost fortunes, destroy a company's image, and bring bankruptcy and prison." },
      { type: "learn", kicker: "Three tools",
        prompt: "So how does an organization help its people act ethically? Turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "star", name: "Lead by example", c: "yellow", t: "Employees copy their bosses. Ben & Jerry's co-founder capped the top salary at **7 times** the lowest-paid worker's." },
          { i: "cap", name: "Ethics training", c: "blue", t: "People practice spotting problems and choosing good responses. Most US companies train; nearly 80% train new managers." },
          { i: "book", name: "Code of ethics", c: "purple", t: "A written guide to what the company expects in how employees treat coworkers, customers and suppliers." }] },
        gate: true },
      { type: "amount", kicker: "Your turn", skill: "Organizations and ethics",
        prompt: "A company copies Ben & Jerry's rule: nobody may earn more than **7 times** the lowest-paid worker. The lowest-paid worker earns **\\$32,000**.<br><br>What is the most the CEO can earn?",
        pre: "\\$", answer: 224000,
        near: [{ v: 39000, fb: "The rule multiplies: 7 **times** the lowest pay, not 7 thousand more." }, { v: 32007, fb: "Multiply by 7 — don't add it." }],
        hints: ["7 × the lowest pay."], why: "7 × \\$32,000 = \\$224,000. To earn more, the CEO has to raise the lowest pay too." },
      { type: "choice", kicker: "Careful", skill: "Organizations and ethics",
        prompt: "A company hangs its code of ethics on every wall. But its top managers ignore it whenever it's inconvenient.<br><br>Will the code change how employees act?",
        options: [{ t: "Probably not — codes work when leaders live by them and keep bringing them up" },
                  { t: "Yes — once it's written down, people follow it", fb: "A code no one at the top follows is just decoration. People watch what leaders do." }],
        answer: 0, keep: true, why: "A code of ethics shapes behavior when senior managers follow it and keep stressing it. Otherwise it's a public-relations poster." },
      { type: "learn", kicker: "Practice a case",
        prompt: "Training uses cases like this. Dana manages Eli, whose work has been poor — a big client just complained he was rude. Dana's boss insists Eli's review be positive. The last manager who wrote a bad one no longer works there.",
        scene: { type: "dilemma", options: [
          { key: "fake", t: "Write the glowing review the boss wants",
            effects: [{ who: "Dana", i: "person", d: 1, t: "Stays on the boss's good side — for now." },
                      { who: "Eli", i: "person", d: -1, t: "Never hears what he needs to fix." },
                      { who: "The client", i: "people", d: -1, t: "Keeps getting poor service." },
                      { who: "The company", i: "store", d: -1, t: "Its records now say something false." }],
            say: "Easy today — but it's giving a false impression, and the real problem grows." },
          { key: "honest", t: "Write an honest review, with a plan to improve",
            effects: [{ who: "Dana", i: "person", d: -1, t: "Risks the boss's anger." },
                      { who: "Eli", i: "person", d: 1, t: "Gets clear feedback and a fair chance." },
                      { who: "The client", i: "people", d: 1, t: "Service can get better." },
                      { who: "The company", i: "store", d: 1, t: "Honest records; problems get fixed." }],
            say: "Harder — but truthful and fair to everyone." },
          { key: "escalate", t: "Talk to the boss's own manager first",
            effects: [{ who: "Dana", i: "person", d: 0, t: "Takes a risk, but not alone." },
                      { who: "Eli", i: "person", d: 1, t: "The pressure behind his reviews comes to light." },
                      { who: "The company", i: "store", d: 1, t: "Learns that a manager is pushing people to lie." }],
            say: "Raising pressure to be dishonest is often the bravest — and most useful — move." }] },
        gate: true, then: "There's rarely a free choice. Training lets people practice these calls before they're real." },
      { type: "sort", skill: "Organizations and ethics",
        prompt: "Which tool is each company using?",
        bins: ["Leading by example", "Ethics training", "Code of ethics"],
        cards: [{ t: "The CEO turns down her bonus while workers' pay is frozen", bin: 0, fb: "Leaders showing the behavior they expect: leading by example." },
                { t: "New managers role-play turning down a bribe", bin: 1, fb: "Practicing responses to ethical problems: training." },
                { t: "A handbook section on accepting gifts from suppliers", bin: 2, fb: "Written expectations for how to behave: a code of ethics." },
                { t: "Teams discuss a tricky case every month and pick the best response", bin: 1, fb: "Practicing with cases: ethics training." }],
        hints: ["Is it a leader's own behavior, practice, or a written guide?"],
        why: "The CEO's choice: leading by example. Role-play and case discussions: training. The handbook: a code of ethics." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why do employees follow what leaders do more than what the code of ethics says?",
        model: "People learn what's really accepted by watching what their bosses do and what gets rewarded. If leaders break the code, everyone learns the code doesn't matter." },
      { type: "choice", kicker: "Put it together", skill: "Organizations and ethics",
        prompt: "A bank set sales targets so high that employees opened fake accounts to hit them.<br><br>Which fix goes to the root of the problem?",
        options: [{ t: "Set realistic targets, and have leaders reward honesty over numbers" },
                  { t: "Print a longer code of ethics", fb: "A code alone won't help while the pay system rewards cheating." },
                  { t: "Fire a few employees and change nothing else", fb: "The next employees would face the same pressure. The cause was the targets and what leaders rewarded." }],
        answer: 0, keep: true, why: "People did what the system rewarded. Fixing the targets and what leaders reward changes the culture itself." }
    ]
  };

  var U2O_BANK = [
    ["The founder answers every customer complaint herself and admits mistakes publicly.", 0], ["Executives take the same pay cut they ask of their workers.", 0],
    ["The CEO refuses gifts from suppliers, and everyone notices.", 0], ["A manager owns up to her own error in front of her team.", 0],
    ["All employees complete an online course with real bribery scenarios every year.", 1], ["New hires practice handling a customer who asks them to break the rules.", 1],
    ["Teams work through an ethical dilemma each quarter and debate the best answer.", 1], ["Managers attend a workshop on handling pressure to fudge numbers.", 1],
    ["A printed guide explains how employees must treat suppliers and customers.", 2], ["The company's website posts the rules its staff must follow on gifts and conflicts.", 2],
    ["The employee handbook lists what counts as a conflict of interest.", 2], ["A one-page statement of the firm's values and what it expects from staff.", 2]
  ];
  var U2O_NAME = ["Leading by example", "Ethics training", "A code of ethics"];

  SKILLS.push(
    { id: "biz2-org", title: "How organizations encourage ethics", lesson: 3,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 0) {
          var x = R.pick(U2O_BANK);
          return mc(R, { prompt: "“" + x[0] + "”<br><br>Which tool for encouraging ethics is this?", keep: true, right: U2O_NAME[x[1]],
            wrong: [0, 1, 2].filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: U2O_NAME[k], fb: ["It's a leader's own behavior that others copy.", "People are practicing responses to ethical problems.", "It's a written statement of what's expected."][x[1]] }; }),
            hints: ["A leader's own behavior, practice, or a written guide?"], why: U2O_NAME[x[1]] + "." });
        }
        if (t === 1) {
          var low = R.pick([25000, 30000, 32000, 35000, 40000]), k = R.pick([5, 7, 8, 10]);
          return { type: "amount", prompt: "A company caps top pay at **" + k + " times** the lowest-paid worker's pay. The lowest-paid worker earns " + usd(low) + ".<br><br>What is the most anyone at the company can earn?",
            pre: "\\$", answer: low * k, near: [{ v: low + k * 1000, fb: "Multiply: " + k + " times the lowest pay." }],
            hints: [k + " × " + usd(low)], why: k + " × " + usd(low) + " = " + usd(low * k) + "." };
        }
        var q = R.pick([
          { p: "When does a code of ethics actually change how people behave?", r: "When senior managers follow it and keep emphasizing it",
            w: [{ t: "As soon as it's printed and handed out", fb: "Without leaders living by it, a code is just paper." }, { t: "Only if it's very long and detailed", fb: "Length doesn't matter — leaders' example does." }] },
          { p: "What does a code of ethics give employees?", r: "Knowledge of what the firm expects in how they treat coworkers, customers and suppliers",
            w: [{ t: "A list of the company's products and prices", fb: "That's a catalog. A code sets out expected behavior." }, { t: "Legal protection for anything they do", fb: "A code guides behavior; it isn't a legal shield." }] },
          { p: "Why do employees watch what their leaders do?", r: "Leaders set the pattern for what's really acceptable",
            w: [{ t: "Because the law requires it", fb: "No law — people simply copy what gets done and rewarded." }, { t: "They don't — only written rules matter", fb: "Behavior at the top teaches more than any written rule." }] },
          { p: "What do the most effective ethics training programs do?", r: "Teach ways to solve dilemmas, then have people practice on realistic cases",
            w: [{ t: "Just list the punishments for breaking rules", fb: "Good training builds skill at reasoning through real situations." }, { t: "Run once when someone is hired, then never again", fb: "The best programs practice regularly with cases." }] }]);
        return mc(R, { prompt: q.p, right: q.r, wrong: q.w, hints: ["Think about what really shapes behavior."], why: q.r + "." });
      } }
  );

  /* ============================================================== Lesson 4
     Making the right decision (2.2): three questions — legal? the company
     code? my own ethics? — then the feelings test and the headline / social
     media test. */
  var U2D_STEPS = ["Is it legal?", "Does it follow the company's code of ethics?", "Does it fit my own ethical standards?", "The feelings test: how does it make me feel?", "The headline test: how would it look in the news or on social media?"];
  LESSONS[4] = {
    title: "Making the right decision",
    blurb: "Three questions and two tests to run any tough call through.",
    mins: 9,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "A company's handbook has a section on accepting gifts from suppliers.<br><br>Which tool for encouraging ethics is that?",
        options: [{ t: "A code of ethics" }, { t: "Leading by example", fb: "That's about leaders' own behavior. A handbook section is a written guide." },
                  { t: "Ethics training", fb: "Training means practicing. This is a written statement of expectations." }],
        answer: 0, keep: true, why: "Written expectations for behavior are a code of ethics." },
      { type: "choice", kicker: "Guess first",
        prompt: "Next week you choose the company's supplier for next year. Today, one of the suppliers sends you two concert tickets “just to say thanks.”<br><br>What do you do?",
        art: tiles([{ i: "ticket", t: "Free concert tickets", c: "purple" }, { i: "box", t: "A supplier you're about to judge", c: "orange" }]),
        options: [{ t: "Politely return them — they could sway my choice" },
                  { t: "Keep them — it's just a thank-you", fb: "The timing tells you it's more than thanks: you're about to decide on their contract. That's buying influence." },
                  { t: "Keep them, but don't tell anyone", fb: "If you'd want to hide it, that's a strong sign it's wrong." }],
        answer: 0, keep: true, why: "A gift from someone whose contract you're about to decide is an attempt to buy influence — a conflict of interest." },
      { type: "learn", kicker: "A path to follow",
        prompt: "There's often no simple right answer. But you can run any decision through these checks, in order. Stop at the first **no**.",
        scene: { type: "chain", next: "Next check", steps: [
          { i: "scale", t: "**1. Is it legal?** If it breaks a law, choose a different path.", c: "purple" },
          { i: "book", t: "**2. Does it follow my company's code of ethics?** If not, find another way.", c: "blue" },
          { i: "heart", t: "**3. Does it fit my own ethical standards?** If yes, it still has two tests to pass…", c: "red" },
          { i: "person", t: "**The feelings test:** how does it make me feel? A decision that keeps you up at night is a warning.", c: "orange" },
          { i: "news", t: "**The headline test:** how would a fair reporter — or a viral post — describe it?", c: "green" }] },
        gate: true },
      { type: "order", kicker: "Your turn", skill: "Making ethical decisions",
        prompt: "Put the checks in the order you'd run them.",
        items: U2D_STEPS,
        nudge: "Start with the law, then the company, then yourself — and finish with the two tests.",
        hints: ["The law comes first.", "Then the company's code, then your own ethics, then how you feel, then how it would look."],
        why: "Legal? Company code? My own ethics? Then the feelings test and the headline test." },
      { type: "learn", kicker: "The headline test",
        prompt: "Imagine a fair reporter — or a post that goes viral — describing your decision to thousands of people.<br><br>Would you be comfortable reading it?",
        art: photo("social", "Today, a decision can be shared with the world in minutes."),
        after: "This test is especially good at catching conflicts of interest: things that feel fine from the inside can look very different from the outside." },
      { type: "choice", skill: "Making ethical decisions",
        prompt: "Nothing about your plan is illegal, and your company's code allows it. But since you decided, you can't sleep well.<br><br>Which check is warning you?",
        options: [{ t: "The feelings test" }, { t: "The headline test", fb: "The headline test imagines how others would describe it. This is about how **you** feel." },
                  { t: "The legal check", fb: "The plan is legal. The warning is coming from your conscience." }],
        answer: 0, keep: true, why: "Discomfort after a decision is your conscience — the feelings test." },
      { type: "choice", kicker: "Careful", skill: "Making ethical decisions",
        prompt: "A plan is completely legal. Does that mean it's ethical?",
        options: [{ t: "Not necessarily — it still has to pass the code, your own ethics and the two tests" },
                  { t: "Yes — if it's legal, it's ethical", fb: "The law is only the first check. Plenty of legal things are unfair, dishonest or harmful." }],
        answer: 0, keep: true, why: "Legal is the floor, not the ceiling. The other checks still apply." },
      { type: "choice", skill: "Making ethical decisions",
        prompt: "Ali's boss asks him to change the date on a contract so the company gets a tax break it doesn't qualify for.<br><br>Which check stops this first?",
        options: [{ t: "1. Is it legal?" }, { t: "The feelings test", fb: "It would fail that too — but it's stopped earlier: faking documents to cut taxes is illegal." },
                  { t: "2. The company's code of ethics", fb: "It fails there too, but the very first check — the law — already stops it." }],
        answer: 0, keep: true, why: "Faking a contract date to avoid taxes breaks the law, so it fails the very first check." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why run the legal check first, and the headline test last?",
        model: "If something is illegal, there's no need to go further — it's out. The headline test comes last to catch what's legal and allowed but would still look wrong to others." },
      { type: "choice", kicker: "Put it together", skill: "Making ethical decisions",
        prompt: "Maya posts a joke online mocking a rival company's workers. It's legal, and her company has no rule about it. Her friends laugh, but she pictures the post shared by the rival's staff.<br><br>What should she do?",
        options: [{ t: "Take it down — it fails the headline test" },
                  { t: "Leave it up — it's legal and not against the rules", fb: "Legal and allowed isn't the end. Imagine the headline: “Employee mocks rival's workers.” It fails that test." },
                  { t: "Leave it up — her friends liked it", fb: "Friends aren't a fair reporter. The headline test asks how it looks to everyone." }],
        answer: 0, keep: true, why: "It passes the legal and code checks but fails the headline test — how it would look to everyone." }
    ]
  };

  var U2D_CASES = [
    ["A manager wants to hide a product defect from a safety regulator, which the law requires reporting.", 0, "Hiding a defect the law requires reporting is illegal."],
    ["An employee wants to backdate an invoice to dodge taxes.", 0, "Falsifying records to dodge taxes is illegal."],
    ["A salesperson wants to accept a supplier's weekend trip, which the company's code forbids.", 1, "It's legal, but the company's code forbids it."],
    ["A worker wants to use company software for a side business, against company policy.", 1, "It's legal, but it breaks the company's code."],
    ["It's legal and allowed, but you'd feel sick about it for weeks.", 3, "The discomfort is the feelings test."],
    ["It's legal and allowed, but you'd hate to see it described in a news story.", 4, "Imagining how it would be reported is the headline test."],
    ["It's legal and allowed, but it goes against your own belief that customers deserve the full truth.", 2, "It clashes with your own ethical standards."]
  ];

  SKILLS.push(
    { id: "biz2-decide", title: "Making ethical decisions", lesson: 4,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 0) {
          var c = R.pick(U2D_CASES);
          return mc(R, { prompt: "“" + c[0] + "”<br><br>Which check stops this decision first?", keep: true, right: U2D_STEPS[c[1]],
            wrong: U2D_STEPS.filter(function (s, k) { return k !== c[1]; }).map(function (s) { return { t: s, fb: c[2] }; }).slice(0, 3),
            hints: ["Run the checks in order: law, company code, your ethics, feelings, headline."], why: c[2] });
        }
        if (t === 1) {
          var k = R.int(0, 3);
          return mc(R, { prompt: "In the order of checks, what comes right **after** “" + U2D_STEPS[k] + "”?", right: U2D_STEPS[k + 1],
            wrong: U2D_STEPS.filter(function (s, j) { return j !== k + 1 && j !== k; }).slice(0, 3).map(function (s) { return { t: s, fb: "The order is: legal, company code, own ethics, feelings test, headline test." }; }),
            hints: ["Law → company → you → feelings → headline."], why: "After “" + U2D_STEPS[k] + "” comes “" + U2D_STEPS[k + 1] + "”" });
        }
        return { type: "order", prompt: "Put the checks for an ethical decision in order.", items: U2D_STEPS,
                 nudge: "Law first, then the company, then yourself, then the two tests.", hints: ["Start with the law."],
                 why: "Legal? Company code? Own ethics? Feelings test. Headline test." };
      } }
  );

  /* ============================================================== Lesson 5
     Doing good on purpose (2.3): corporate social responsibility, the CSR
     pyramid, CSR as voluntary and broad; illegal and irresponsible,
     irresponsible but legal, legal and responsible. */
  var U2C_LV = { eco: "Economic", leg: "Legal", eth: "Ethical", phi: "Philanthropic" };
  LESSONS[5] = {
    title: "Doing good on purpose",
    blurb: "Corporate social responsibility, the pyramid it's built on, and three kinds of company behavior.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "An employee is told to fake a contract's date to dodge taxes.<br><br>Which check stops this first?",
        options: [{ t: "Is it legal?" }, { t: "The headline test", fb: "It would fail that too, but the very first check — the law — already rules it out." },
                  { t: "The feelings test", fb: "It would fail that too, but it's stopped earlier: it's illegal." }],
        answer: 0, keep: true, why: "Faking documents to dodge taxes is illegal — it fails the first check." },
      { type: "choice", kicker: "Look",
        prompt: "Hasbro, the company behind Monopoly, Nerf and Play-Doh, tests its toys for safety at every stage, cuts its energy and water use, checks that factory workers are treated fairly, and gave \\$15 million in 2023 to help nearly 4 million children.<br><br>Does the law require all of that?",
        art: photo("monopoly", "Hasbro's Monopoly — one of its best-known games."),
        options: [{ t: "No — much of it goes beyond what the law requires" },
                  { t: "Yes — every toy company must do all of it", fb: "Some safety rules are law, but giving millions to children's causes and cutting energy use are choices." }],
        answer: 0, keep: true, why: "Much of what Hasbro does is voluntary — a choice to be good for society." },
      { type: "learn", kicker: "New word",
        prompt: "That is **corporate social responsibility (CSR)**: a business's concern for the welfare of society as a whole — obligations beyond what the law or contracts require.",
        art: tiles([{ i: "heart", t: "It's voluntary: beyond what's required", c: "red" }, { i: "people", t: "It's broad: workers, suppliers, customers, communities, society", c: "blue" }]) },
      { type: "learn", kicker: "Try it",
        prompt: "CSR is often drawn as a pyramid of four responsibilities. Build it — from the bottom.",
        scene: { type: "pyramid" },
        gate: true, then: "Profit is the foundation. If a company doesn't make money, it can't survive — and the other three won't matter." },
      { type: "pyramid", kicker: "Your turn", skill: "Corporate social responsibility",
        prompt: "Starbucks gives unsold food from its stores to people in need — more than 100 million meals so far.<br><br>Tap the level of the pyramid this belongs to.",
        answer: "phi", fb: { eth: "Close — it's generous and right, but giving to the community is the very top: philanthropy.", eco: "It doesn't earn money; it gives. Look higher.", leg: "No law requires it." },
        hints: ["Is it required, fair dealing, or giving back to the community?"],
        why: "Giving to the community is philanthropic responsibility — the top of the pyramid." },
      { type: "sort", skill: "Corporate social responsibility",
        prompt: "Sort each action into its level of the pyramid.",
        bins: ["Economic", "Legal", "Ethical", "Philanthropic"],
        cards: [{ t: "Setting prices high enough to stay in business", bin: 0, fb: "Staying profitable is the economic responsibility." },
                { t: "Following food-safety laws", bin: 1, fb: "Obeying the law is the legal responsibility." },
                { t: "Refusing to sell a product it knows is unsafe, though no law bans it yet", bin: 2, fb: "Doing what's right beyond the law is the ethical responsibility." },
                { t: "Paying employees for up to 56 hours of volunteering a year", bin: 3, fb: "Giving time to the community is philanthropy (Salesforce does this)." }],
        hints: ["Profit? The law? Right beyond the law? Giving back?"],
        why: "Profit: economic. The law: legal. Right beyond the law: ethical. Giving back: philanthropic." },
      { type: "choice", kicker: "Careful", skill: "Corporate social responsibility",
        prompt: "A new law says factories must clean up their pollution. A company cleans up because of the law.<br><br>Is that corporate social responsibility?",
        options: [{ t: "No — CSR is voluntary; this is just obeying the law" },
                  { t: "Yes — cleaning up pollution is always CSR", fb: "It's good for society, but it's required. CSR means going beyond what the law demands." }],
        answer: 0, keep: true, why: "Actions required by law are the legal responsibility. CSR is what a company chooses to do beyond that." },
      { type: "learn", kicker: "Three kinds of behavior",
        prompt: "Management expert Peter Drucker said: look first at what a company does **to** society, then at what it can do **for** society. That gives three kinds of behavior — turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "x", name: "Illegal and irresponsible", c: "red", t: "Breaking the law and harming people — fraud, cheating customers. It ends in fines, ruin and sometimes prison." },
          { i: "question", name: "Irresponsible but legal", c: "orange", t: "Not against the law — but not right either. Raising a life-saving drug's price 4,000% was legal, and widely seen as wrong." },
          { i: "check", name: "Legal and responsible", c: "green", t: "Most businesses: they obey the law and try to do right. REI gave nearly \\$9 million to 300 nonprofit partners in 2024." }] },
        gate: true },
      { type: "sort", skill: "Legal and responsible",
        prompt: "Sort each company's behavior.",
        bins: ["Illegal and irresponsible", "Irresponsible but legal", "Legal and responsible"],
        cards: [{ t: "A bank opens fake accounts in customers' names", bin: 0, fb: "That's fraud — illegal, and it harms customers." },
                { t: "A company raises a life-saving drug's price 4,000% overnight", bin: 1, fb: "Allowed by law, but it put patients at risk — irresponsible." },
                { t: "A clothing store pays fair wages and recycles its packaging", bin: 2, fb: "Legal, and it goes beyond — legal and responsible." },
                { t: "A car maker installs software to cheat emissions tests", bin: 0, fb: "Cheating required tests is illegal and harms everyone's air." }],
        hints: ["Does it break a law? If not, is it still harmful?"],
        why: "Fake accounts and cheating tests: illegal and irresponsible. The price hike: legal but irresponsible. Fair wages and recycling: legal and responsible." },
      { type: "explain", kicker: "In your own words",
        prompt: "Why is making a profit at the **bottom** of the CSR pyramid, not the top?",
        model: "It's the foundation: a company that loses money can't survive, so it couldn't obey laws, act ethically or give anything back. Everything else rests on staying in business." },
      { type: "pyramid", kicker: "Put it together", skill: "Corporate social responsibility",
        prompt: "A toy maker safety-tests every toy far more than the law requires, because it believes children deserve it.<br><br>Tap the level of the pyramid this belongs to.",
        answer: "eth", fb: { leg: "It goes beyond what the law requires.", phi: "It's not a gift to the community — it's doing right by its customers beyond the law.", eco: "It doesn't earn more — it costs more." },
        hints: ["Is it required by law? If not, is it fair dealing or giving back?"],
        why: "Doing what's right and fair beyond the law is the ethical responsibility." }
    ]
  };

  var U2C_BANK = [
    ["Keeping costs under control so the business stays profitable", "eco"], ["Earning enough profit to pay workers and suppliers", "eco"], ["Making a product people want to buy at a price that covers costs", "eco"],
    ["Paying at least the minimum wage", "leg"], ["Following workplace safety laws", "leg"], ["Paying the taxes it owes", "leg"], ["Getting government approval before selling a new medicine", "leg"],
    ["Telling customers about a flaw no law requires it to disclose", "eth"], ["Treating suppliers fairly even when it could squeeze them", "eth"], ["Refusing to use misleading ads, even where they're allowed", "eth"],
    ["Paying fair wages above the legal minimum", "eth"], ["Donating products after a hurricane", "phi"], ["Matching employees' gifts to charities", "phi"],
    ["Paying staff to volunteer in their communities", "phi"], ["Funding a community garden near its headquarters", "phi"]
  ];
  var U2C_WHY = { eco: "Staying profitable is the economic responsibility — the base.", leg: "Obeying the law is the legal responsibility.",
                  eth: "Doing what's right and fair beyond the law is the ethical responsibility.", phi: "Giving back to the community is the philanthropic responsibility — the top." };
  var U2L_BANK = [
    ["A company cooks its books to hide losses from investors.", 0], ["A factory secretly dumps toxic waste into a river.", 0], ["A firm pays bribes to win government contracts.", 0], ["A lender forges customers' signatures on loans.", 0],
    ["A company legally buries steep fees in fine print few customers read.", 1], ["A firm legally moves every job overseas the week after taking a local tax break.", 1],
    ["A drug maker legally raises the price of an old life-saving drug 4,000%.", 1], ["A company legally lays off its staff by text message on a holiday.", 1],
    ["An outdoor retailer gives millions to nonprofit partners each year.", 2], ["A company follows every law and pays a living wage.", 2], ["A grocery chain donates unsold food to food banks.", 2], ["A firm powers its factories with renewable energy.", 2]
  ];
  var U2L_NAME = ["Illegal and irresponsible", "Irresponsible but legal", "Legal and responsible"];

  SKILLS.push(
    { id: "biz2-csr", title: "Corporate social responsibility", lesson: 5,
      gen: function (R, i) {
        var t = i % 3, x = R.pick(U2C_BANK);
        if (t === 0) {
          return mc(R, { prompt: "“" + x[0] + ".”<br><br>Which level of the CSR pyramid is this?", keep: true, right: U2C_LV[x[1]],
            wrong: ["eco", "leg", "eth", "phi"].filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: U2C_LV[k], fb: U2C_WHY[x[1]] }; }),
            hints: ["Profit? The law? Right beyond the law? Giving back?"], why: U2C_WHY[x[1]] });
        }
        if (t === 1) {
          return { type: "pyramid", prompt: "“" + x[0] + ".”<br><br>Tap the level of the CSR pyramid this belongs to.", answer: x[1],
                   hints: ["Profit? The law? Right beyond the law? Giving back?"], why: U2C_WHY[x[1]] };
        }
        var q = R.pick([
          { p: "Which level of the CSR pyramid is the foundation for all the others?", r: "Economic — being profitable", w: [{ t: "Philanthropic — giving back", fb: "Giving is the top level; it only works if the company survives." }, { t: "Legal — obeying the law", fb: "The law is the second level. Without profit, the company won't be around to obey anything." }] },
          { p: "What does it mean that CSR is voluntary?", r: "It goes beyond what the law or contracts require", w: [{ t: "Companies can choose to ignore the law", fb: "No — obeying the law is required. CSR is extra, beyond it." }, { t: "Only volunteers can do it", fb: "It means the company chooses it; it isn't required." }] },
          { p: "Who does corporate social responsibility reach?", r: "Workers, suppliers, customers, communities and society at large", w: [{ t: "Only the company's investors", fb: "CSR is broad — it reaches well beyond investors." }, { t: "Only people in the company's own city", fb: "It reaches society as a whole." }] }]);
        return mc(R, { prompt: q.p, right: q.r, wrong: q.w, hints: ["Think of the pyramid: profit, law, ethics, giving."], why: q.r + "." });
      } },
    { id: "biz2-legal", title: "Legal and responsible behavior", lesson: 5,
      gen: function (R, i) {
        var x = R.pick(U2L_BANK);
        if (i % 2 === 1) {
          var cards = [0, 1, 2].map(function (k) { var s = R.pick(U2L_BANK.filter(function (y) { return y[1] === k; })); return { t: s[0], bin: k, fb: U2L_NAME[k] + "." }; });
          return { type: "sort", prompt: "Sort each company's behavior.", bins: U2L_NAME, cards: R.shuffle(cards),
                   hints: ["Is it against the law? If not, does it still harm people?"], why: "Each behavior fits one box: illegal and irresponsible, irresponsible but legal, or legal and responsible." };
        }
        return mc(R, { prompt: "“" + x[0] + "”<br><br>Which kind of behavior is this?", keep: true, right: U2L_NAME[x[1]],
          wrong: [0, 1, 2].filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: U2L_NAME[k], fb: ["It breaks the law and harms people.", "It's allowed by law, but it isn't right.", "It's legal and goes beyond to do good."][x[1]] }; }),
          hints: ["First: is it legal? Then: is it responsible?"], why: U2L_NAME[x[1]] + "." });
      } }
  );

  /* ============================================================== Lesson 6
     Who a business answers to (2.4): stakeholders — employees, customers,
     society, investors — empowerment, social investing, and weighing
     stakeholders who want different things. */
  var U2S_NODES = [
    { key: "emp", i: "worker", name: "Employees", c: "blue", t: "First, a **job**. Then a clean, safe workplace free of discrimination, job security where possible, and a real voice in decisions." },
    { key: "cus", i: "cart", name: "Customers", c: "green", t: "Deliver what you **promise**, and be honest in every dealing. Many shoppers — millennials especially — prefer responsible brands." },
    { key: "soc", i: "people", name: "Society", c: "purple", t: "Jobs, goods and services, and **taxes** that pay for schools, hospitals and roads — plus caring for the environment and giving back." },
    { key: "inv", i: "coins", name: "Investors", c: "orange", t: "A reasonable **profit** on their money — and, for more and more investors, ethical and responsible behavior too." }
  ];
  var U2S_NAME = { emp: "Employees", cus: "Customers", soc: "Society", inv: "Investors" };
  LESSONS[6] = {
    title: "Who a business answers to",
    blurb: "Stakeholders — employees, customers, society and investors — and what each one is owed.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“A company obeys every food-safety law.”<br><br>Which level of the CSR pyramid is that?",
        options: [{ t: "Legal" }, { t: "Ethical", fb: "Ethical means doing right **beyond** the law. Following the law itself is the legal level." },
                  { t: "Philanthropic", fb: "Philanthropy is giving back. This is simply obeying the law." }],
        answer: 0, keep: true, why: "Obeying the law is the legal responsibility — the second level." },
      { type: "multi", kicker: "Guess first",
        prompt: "Who does a business have responsibilities to? Pick all that apply.",
        options: [{ t: card("worker", "Its employees"), ok: true, fb: "Yes." }, { t: card("cart", "Its customers"), ok: true, fb: "Yes." },
                  { t: card("people", "The public and its community"), ok: true, fb: "Yes." }, { t: card("coins", "Its investors"), ok: true, fb: "Yes." },
                  { t: card("x", "Nobody but its owners"), ok: false, fb: "A business touches many more people than its owners — and owes them something." }],
        hints: ["Think of everyone a company's decisions affect."],
        why: "Employees, customers, society and investors all have a stake in what a business does." },
      { type: "learn", kicker: "Try it",
        prompt: "Tap each group around the company to see what it's owed.",
        scene: { type: "hub", center: { i: "store", name: "The company" }, nodes: U2S_NODES },
        gate: true, then: "These are the company's **stakeholders**: the individuals or groups a business has a responsibility to." },
      { type: "choice", kicker: "Your turn", skill: "Stakeholders",
        prompt: "What is an employer's **first** responsibility to its employees?",
        options: [{ t: "To provide them with a job" }, { t: "To give them free lunches", fb: "Nice, but not the first thing. The most basic responsibility is providing work." },
                  { t: "To make them shareholders", fb: "Some do, but the first responsibility is simply providing a job." }],
        answer: 0, keep: true, why: "Keeping people employed is the finest thing a business does for society — then comes a safe, fair workplace." },
      { type: "learn", kicker: "Real world",
        prompt: "Good employers also **empower** people: letting them make decisions and suggest fixes. That builds self-worth, raises productivity and cuts absences.",
        art: tiles([{ i: "calendar", t: "Cisco: four company-wide paid “Day for Me” wellbeing days", c: "blue" }, { i: "bulb", t: "Empowered workers suggest improvements", c: "yellow" }]) },
      { type: "hub", skill: "Stakeholders",
        prompt: "A company recalls a product the moment it learns the product might be unsafe.<br><br>Tap the stakeholder it's protecting most directly.",
        center: { i: "store", name: "The company" }, nodes: U2S_NODES, answer: "cus",
        fb: { inv: "A recall actually costs investors money in the short run. It protects the people using the product.", emp: "Employees aren't the ones at risk from the product.", soc: "Society benefits too, but the people directly protected are those who bought it." },
        hints: ["Who could be hurt by an unsafe product?"], why: "Recalling an unsafe product protects customers — delivering what was promised, safely." },
      { type: "learn", kicker: "New word",
        prompt: "Some investors only buy stocks and bonds of companies that match their values — skipping tobacco, weapons, or companies with a record of harming the environment. That's **social investing**.",
        art: tiles([{ i: "coins", t: "More than $8 trillion invested this way in 2022", c: "green" }, { i: "x", t: "Skips companies that clash with investors' values", c: "red" }]) },
      { type: "choice", kicker: "Careful", skill: "Stakeholders",
        prompt: "Is a company's only responsibility to its investors to make a profit?",
        options: [{ t: "No — many investors expect ethical, responsible behavior too" },
                  { t: "Yes — profit is all investors care about", fb: "Not any more. Boards, investors and the public now push CEOs out for ethical lapses, not just bad results." }],
        answer: 0, keep: true, why: "Profit still matters, but investors increasingly hold leaders to ethical standards — and social investors choose companies by their values." },
      { type: "sort", skill: "Stakeholders",
        prompt: "Which stakeholder is each responsibility mainly owed to?",
        bins: ["Employees", "Customers", "Society", "Investors"],
        cards: [{ t: "A safe workplace free of discrimination", bin: 0, fb: "That's owed to employees." },
                { t: "Honest advertising", bin: 1, fb: "That's owed to customers." },
                { t: "Paying taxes that fund schools and roads", bin: 2, fb: "That's owed to society." },
                { t: "A reasonable return on their money", bin: 3, fb: "That's owed to investors." }],
        hints: ["Who benefits most directly?"], why: "Workplace: employees. Honest ads: customers. Taxes: society. Returns: investors." },
      { type: "learn", kicker: "Weighing stakeholders",
        prompt: "A company could save money by closing its US plant and making its products overseas. Try both choices.",
        scene: { type: "dilemma", options: [
          { key: "move", t: "Close the plant and move production overseas",
            effects: [{ who: "Investors", i: "coins", d: 1, t: "Profits rise." },
                      { who: "Employees", i: "worker", d: -1, t: "Hundreds lose their jobs." },
                      { who: "Society", i: "people", d: -1, t: "The town loses jobs, spending and taxes." },
                      { who: "Customers", i: "cart", d: 1, t: "Prices may fall a little." }],
            say: "Good for some stakeholders, hard on others." },
          { key: "stay", t: "Keep the plant and invest in new machines and training",
            effects: [{ who: "Investors", i: "coins", d: 0, t: "Smaller gains now; maybe more later." },
                      { who: "Employees", i: "worker", d: 1, t: "Keep jobs and learn new skills." },
                      { who: "Society", i: "people", d: 1, t: "The town keeps its jobs and taxes." },
                      { who: "Customers", i: "cart", d: 0, t: "Little change." }],
            say: "Slower profit growth, but stronger ties with the community." }] },
        gate: true, then: "Stakeholders often want different things. Responsible managers weigh **all** of them, not just one." },
      { type: "explain", kicker: "In your own words",
        prompt: "How can treating employees well also help a company's customers and investors?",
        model: "Employees who are treated fairly work better and stay longer, so customers get better service — and better service and lower turnover help profits." }
    ]
  };

  var U2S_BANK = [
    ["A clean, safe place to work", "emp"], ["Freedom from discrimination at work", "emp"], ["A say in how their work is done", "emp"], ["Job security when possible", "emp"],
    ["Products that are safe to use", "cus"], ["Delivering what was promised", "cus"], ["Honest prices with no hidden fees", "cus"], ["Truthful advertising", "cus"],
    ["Taxes that support schools and hospitals", "soc"], ["Protecting the local environment", "soc"], ["Jobs in the community", "soc"], ["Donations after a local disaster", "soc"],
    ["A reasonable profit on their money", "inv"], ["Honest financial reports", "inv"], ["Leaders held to ethical standards", "inv"], ["Growing the value of their shares", "inv"]
  ];

  SKILLS.push(
    { id: "biz2-stake", title: "Stakeholders", lesson: 6,
      gen: function (R, i) {
        var t = i % 4, x = R.pick(U2S_BANK);
        if (t === 0) {
          return mc(R, { prompt: "“" + x[0] + ".”<br><br>Which stakeholder is this responsibility mainly owed to?", keep: true, right: U2S_NAME[x[1]],
            wrong: Object.keys(U2S_NAME).filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: U2S_NAME[k], fb: "Ask who benefits most directly: " + U2S_NAME[x[1]].toLowerCase() + "." }; }),
            hints: ["Who benefits most directly?"], why: "This is owed mainly to " + U2S_NAME[x[1]].toLowerCase() + "." });
        }
        if (t === 1) {
          return { type: "hub", prompt: "“" + x[0] + ".”<br><br>Tap the stakeholder this is mainly owed to.", center: { i: "store", name: "The company" }, nodes: U2S_NODES, answer: x[1],
                   hints: ["Who benefits most directly?"], why: "This is owed mainly to " + U2S_NAME[x[1]].toLowerCase() + "." };
        }
        if (t === 2) {
          var s = R.pick([
            ["A fund won't buy shares in any company that makes tobacco products.", 1], ["A retirement plan invests only in companies with clean environmental records.", 1],
            ["An investor buys whatever stock is rising fastest.", 0], ["A fund avoids weapons makers because of its members' beliefs.", 1], ["A trader buys shares of any company with cheap stock.", 0]]);
          return mc(R, { prompt: "“" + s[0] + "”<br><br>Is this social investing?", keep: true, right: s[1] ? "Yes" : "No",
            wrong: [{ t: s[1] ? "No" : "Yes", fb: s[1] ? "Limiting investments to companies that match your values is exactly social investing." : "Social investing chooses companies by their ethics and responsibility — not just by price." }],
            hints: ["Is the choice based on the investor's values about ethics and responsibility?"], why: s[1] ? "Yes — choosing investments by values is social investing." : "No — it's about price, not values." });
        }
        var cards = ["emp", "cus", "soc", "inv"].map(function (k, b) { var y = R.pick(U2S_BANK.filter(function (z) { return z[1] === k; })); return { t: y[0], bin: b, fb: "Owed mainly to " + U2S_NAME[k].toLowerCase() + "." }; });
        return { type: "sort", prompt: "Which stakeholder is each responsibility mainly owed to?", bins: ["Employees", "Customers", "Society", "Investors"], cards: R.shuffle(cards),
                 hints: ["Who benefits most directly?"], why: "Each responsibility matches the stakeholder who benefits most directly." };
      } }
  );

  /* ============================================================== Lesson 7
     Giving back (2.4): responsibility to society — the environment, B Corps,
     and corporate philanthropy in its three forms. */
  LESSONS[7] = {
    title: "Giving back",
    blurb: "A business's duty to society: the environment, B Corps, and the three ways companies give.",
    mins: 9,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“Honest financial reports.”<br><br>Which stakeholder is this mainly owed to?",
        options: [{ t: "Investors" }, { t: "Customers", fb: "Customers care about products and prices. Financial reports tell owners how their money is doing." },
                  { t: "Employees", fb: "Financial reports are mainly for the people who own the company: investors." }],
        answer: 0, keep: true, why: "Investors rely on honest financial reports to judge their investment." },
      { type: "choice", kicker: "Guess first",
        prompt: "Each year about 10 million hectares of forest are cut down, and each American throws away close to 3,000 pounds of trash. Nearly 10,000 species are critically endangered.<br><br>Whose job is it to help fix this?",
        art: tiles([{ i: "tree", t: "Forests cut down", c: "green" }, { i: "box", t: "Mountains of trash", c: "orange" }, { i: "leaf", t: "Species at risk", c: "red" }]),
        options: [{ t: "Governments, people — and businesses too" }, { t: "Only governments", fb: "Businesses use huge amounts of resources — they share the responsibility." },
                  { t: "Nobody — it isn't a business matter", fb: "Protecting the environment is part of a business's responsibility to society." }],
        answer: 0, keep: true, why: "Business is also responsible for protecting and improving the environment." },
      { type: "learn", kicker: "Real world",
        prompt: "Many companies now cut their harm on purpose. Toyota's vehicle center at the Port of Long Beach runs entirely on renewable energy made on site, with almost no pollution.",
        art: photo("ev", "Electric vehicles cost more up front, but can save their owners money over time."),
        after: "Protecting the environment is part of a business's responsibility to **society** — one of its stakeholders." },
      { type: "learn", kicker: "New word",
        prompt: "Some companies prove their commitment by becoming a **Certified B Corporation** — a **B Corp**. Turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "shield", name: "What it is", c: "green", t: "A company verified by the nonprofit B Lab for its social and environmental performance, openness and accountability." },
          { i: "star", name: "The score", c: "yellow", t: "An impact assessment scored out of **200** points. A company needs at least **80** — and must be re-certified every two years." },
          { i: "people", name: "Who", c: "blue", t: "More than 9,000 companies worldwide — including Patagonia, Ben & Jerry's, Warby Parker and Kickstarter." }] },
        gate: true },
      { type: "amount", kicker: "Your turn", skill: "Giving back",
        prompt: "A company scores **72** out of 200 on the B Corp impact assessment.<br><br>How many more points does it need to be certified?",
        answer: 8, post: "points",
        near: [{ v: 128, fb: "It doesn't need all 200 — just 80." }, { v: 72, fb: "72 is what it has. How far is that from 80?" }],
        hints: ["The minimum is 80 points."], why: "80 − 72 = 8 more points." },
      { type: "learn", kicker: "New word",
        prompt: "**Corporate philanthropy** is companies giving to good causes. It comes in three forms — turn over each card.",
        scene: { type: "flip", cols: 3, cards: [
          { i: "cash", name: "Cash", c: "green", t: "Money for causes. American Express is a major supporter of the American Red Cross's disaster relief." },
          { i: "box", name: "Products and equipment", c: "orange", t: "Giving what the company makes. After Hurricane Katrina, Bayer sent 45,000 blood glucose monitors." },
          { i: "hand", name: "Employees' volunteering", c: "purple", t: "Supporting staff who volunteer. Deloitte pays employees for up to 5 volunteer hours a week." }] },
        gate: true, then: "US companies give more than \\$44 billion a year this way." },
      { type: "sort", skill: "Giving back",
        prompt: "Which form of philanthropy is each?",
        bins: ["Cash", "Products and equipment", "Volunteering"],
        cards: [{ t: "A bank donates \\$1 million to a children's hospital", bin: 0, fb: "Money given to a cause: cash." },
                { t: "A bakery gives its day-old bread to a shelter", bin: 1, fb: "Giving what it makes: products." },
                { t: "A software company gives staff paid days to coach youth sports", bin: 2, fb: "Supporting employees' volunteer work." },
                { t: "A computer maker donates laptops to a school", bin: 1, fb: "Giving equipment it makes: products and equipment." }],
        hints: ["Money, things, or people's time?"], why: "Money: cash. Bread and laptops: products and equipment. Paid time to coach: volunteering." },
      { type: "choice", kicker: "Careful", skill: "Giving back",
        prompt: "A company pays all its taxes and meets every pollution limit.<br><br>Is that corporate philanthropy?",
        options: [{ t: "No — that's required by law; philanthropy is voluntary giving" },
                  { t: "Yes — it helps society", fb: "It does help, but it's required. Philanthropy is giving beyond what's required." }],
        answer: 0, keep: true, why: "Paying taxes and obeying pollution laws are legal responsibilities. Philanthropy is voluntary giving of money, products or time." },
      { type: "explain", kicker: "In your own words",
        prompt: "Becoming a B Corp costs time and money. Why might a company do it anyway?",
        model: "It proves to customers, workers and investors that the company really is responsible — which can win loyal customers, attract good employees and set it apart from rivals." },
      { type: "multi", kicker: "Put it together", skill: "Giving back",
        prompt: "Which of these are corporate philanthropy? Pick all that apply.",
        options: [{ t: "Donating laptops to a school", ok: true, fb: "Yes — giving products." },
                  { t: "Paying employees to volunteer at a food bank", ok: true, fb: "Yes — supporting volunteering." },
                  { t: "Paying the company's taxes", ok: false, fb: "Taxes are required by law, not voluntary giving." },
                  { t: "Giving cash to disaster relief", ok: true, fb: "Yes — a cash gift." },
                  { t: "Obeying safety laws", ok: false, fb: "That's the legal responsibility, not giving." }],
        hints: ["Is it voluntary giving of money, products or time?"],
        why: "Laptops, paid volunteering and cash for relief are philanthropy. Taxes and safety laws are legal duties." }
    ]
  };

  var U2G_BANK = [
    ["A grocery chain writes a check to a local food bank.", 0], ["A bank gives \\$500,000 to a scholarship fund.", 0], ["A company matches every dollar employees give to charity.", 0],
    ["A clothing brand donates winter coats to a shelter.", 1], ["A drug maker sends medicine to a disaster zone.", 1], ["A tech firm donates used computers to schools.", 1],
    ["A law firm lets lawyers spend work hours helping people who can't afford lawyers.", 2], ["A company gives staff paid days to build homes with a charity.", 2], ["An accounting firm pays employees for weekly volunteer hours.", 2]
  ];
  var U2G_NAME = ["Cash", "Products and equipment", "Volunteering"];

  SKILLS.push(
    { id: "biz2-giving", title: "Giving back to society", lesson: 7,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 0) {
          var x = R.pick(U2G_BANK);
          return mc(R, { prompt: "“" + x[0] + "”<br><br>Which form of corporate philanthropy is this?", keep: true, right: U2G_NAME[x[1]],
            wrong: [0, 1, 2].filter(function (k) { return k !== x[1]; }).map(function (k) { return { t: U2G_NAME[k], fb: "Is it money, things the company makes, or people's time? Here it's " + U2G_NAME[x[1]].toLowerCase() + "." }; }),
            hints: ["Money, things, or time?"], why: U2G_NAME[x[1]] + "." });
        }
        if (t === 1) {
          var s = R.int(40, 79);
          return { type: "amount", prompt: "A company scores " + s + " out of 200 on the B Corp impact assessment.<br><br>How many more points does it need to be certified?", answer: 80 - s, post: "points",
            near: [{ v: 200 - s, fb: "The target is 80, not 200." }], hints: ["The minimum score is 80."], why: "80 − " + s + " = " + (80 - s) + "." };
        }
        var q = R.pick([
          { p: "What must a company score to become a Certified B Corp?", r: "At least 80 out of 200 points", w: [{ t: "A perfect 200", fb: "No one needs perfection — the bar is 80." }, { t: "At least 50 out of 100", fb: "The assessment is out of 200, with 80 needed." }] },
          { p: "Which of these is corporate philanthropy?", r: "Supporting employees who volunteer in the community", w: [{ t: "Paying the company's taxes", fb: "Taxes are required by law." }, { t: "Obeying environmental laws", fb: "That's a legal duty, not giving." }] },
          { p: "Which stakeholder benefits most directly when a factory cuts its pollution?", r: "Society — the community and the environment", w: [{ t: "Investors", fb: "It may cost investors money. The main benefit goes to the community." }, { t: "Only the company's managers", fb: "Cleaner air and water help everyone around the factory." }] },
          { p: "How often must a B Corp be re-certified?", r: "Every two years", w: [{ t: "Never — once certified, always certified", fb: "B Corps are re-checked every two years." }, { t: "Every month", fb: "It's every two years." }] }]);
        return mc(R, { prompt: q.p, right: q.r, wrong: q.w, hints: ["Voluntary giving goes beyond what the law requires."], why: q.r + "." });
      } }
  );

  /* ============================================================== Lesson 8
     What's changing (2.5): strategic giving, a new social contract between
     employer and employee, and global ethics for multinationals — then the
     whole unit put together. */
  LESSONS[8] = {
    title: "What's changing",
    blurb: "Giving with a purpose, a two-way deal with employees, and ethics across borders.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "“Deloitte pays employees for up to 5 volunteer hours a week.”<br><br>Which form of corporate philanthropy is that?",
        options: [{ t: "Volunteering" }, { t: "Cash", fb: "No money goes to a charity directly — the company pays for its people's time." },
                  { t: "Products and equipment", fb: "Nothing the company makes is given. It supports staff volunteering." }],
        answer: 0, keep: true, why: "Supporting employees' volunteer work is one of philanthropy's three forms." },
      { type: "choice", kicker: "Guess first",
        prompt: "A toothpaste company wants to give back. Which plan makes more sense for it?",
        art: tiles([{ i: "trophy", t: "A: sponsor a golf trophy abroad", c: "yellow" }, { i: "hospital", t: "B: free dental checkups where it sells", c: "blue" }]),
        options: [{ t: "B — it ties giving to what the company does, where it does business" },
                  { t: "A — it's more famous", fb: "Fame isn't the point. Plan B links the giving to the company's mission and its own communities." }],
        answer: 0, keep: true, why: "Giving linked to the company's mission, in its own communities, is strategic giving." },
      { type: "learn", kicker: "Trend 1",
        prompt: "Companies used to give money or products to whichever charity asked. Today many practice **strategic giving**: tying their giving to the company's mission and goals, and to the communities where they do business.",
        art: tiles([{ i: "gift", t: "Then: give to whoever asks", c: "muted" }, { i: "arrow", t: "", c: "muted" }, { i: "target", t: "Now: give with a purpose, where you work", c: "green" }]) },
      { type: "sort", kicker: "Your turn", skill: "Trends in ethics",
        prompt: "Traditional giving, or strategic giving?",
        bins: ["Traditional giving", "Strategic giving"],
        cards: [{ t: "A software company teaches coding in schools in its home city", bin: 1, fb: "Linked to what it does, in its community: strategic." },
                { t: "A bank gives to whichever charity asks first each year", bin: 0, fb: "No link to its mission or communities: traditional." },
                { t: "A food company fights hunger in towns where it has stores", bin: 1, fb: "Linked to its mission and its communities: strategic." },
                { t: "A car maker funds an unrelated art prize overseas", bin: 0, fb: "Unrelated to its mission or communities: traditional." }],
        hints: ["Is the giving linked to the company's mission and communities?"],
        why: "Strategic giving connects to the company's mission and the places it does business." },
      { type: "learn", kicker: "Trend 2",
        prompt: "The deal between employer and employee is changing. Both sides now owe each other something. The new **social contract** has four parts — turn over each card.",
        scene: { type: "flip", cols: 4, cards: [
          { i: "cash", name: "Pay", c: "green", t: "Few people stay for decades, so pay rewards short-term performance — with perks like paid leave and remote work." },
          { i: "person", name: "Managing", c: "blue", t: "People change jobs about every three years. Managers must engage them, set realistic goals and show a path to grow." },
          { i: "heart", name: "Culture", c: "red", t: "Employees ask for flexibility, openness and fairness — and stay when they get them." },
          { i: "cap", name: "Learning", c: "purple", t: "The skills needed keep changing. Companies must train, and workers must keep learning and adding value." }] },
        gate: true },
      { type: "choice", skill: "Trends in ethics",
        prompt: "Why do companies need to rethink pay and perks today?",
        options: [{ t: "Most people no longer stay with one employer for decades" },
                  { t: "The law requires a pay change every three years", fb: "No such law. The reason is that people change jobs often — about every three years." },
                  { t: "Employees no longer care about pay", fb: "Pay still matters — but people move on often, so rewards must fit shorter stays." }],
        answer: 0, keep: true, why: "With people changing jobs about every three years, pay and perks have to reward what they do now." },
      { type: "learn", kicker: "Trend 3",
        prompt: "When a company works in many countries, it must take its ethics with it. A responsible multinational respects local customs, builds good local managers, commits for the long term, involves local stakeholders — and keeps its ethical rules everywhere.",
        art: tiles([{ i: "globe", t: "Respect local customs", c: "blue" }, { i: "people", t: "Involve local stakeholders", c: "purple" }, { i: "shield", t: "Keep its ethics everywhere", c: "green" }]),
        after: "Gap, for example, publishes the list of its factories worldwide every six months, so anyone can check working conditions." },
      { type: "choice", kicker: "Careful", skill: "Trends in ethics",
        prompt: "A US company opens a factory in a country where child labor is common and not strictly enforced against.<br><br>What should it do?",
        options: [{ t: "Refuse child labor — keep its own ethical rules, while respecting local customs in other ways" },
                  { t: "Use child labor, since it's the local custom", fb: "Respecting customs doesn't mean dropping basic ethics. Human rights come with the company everywhere." },
                  { t: "Stay out of every country with different customs", fb: "Global business can do good. The answer is to bring your ethics, not to avoid the world." }],
        answer: 0, keep: true, why: "A responsible multinational respects local ways but applies its ethical guidelines — including human rights — everywhere." },
      { type: "learn", kicker: "Put it together",
        prompt: "Your company's cheapest overseas supplier makes its workers put in 80-hour weeks. Try each choice.",
        scene: { type: "dilemma", options: [
          { key: "keep", t: "Keep buying — the price is too good",
            effects: [{ who: "Investors", i: "coins", d: 1, t: "Lower costs, higher profit — until it becomes news." },
                      { who: "Factory workers", i: "worker", d: -1, t: "Keep working exhausting hours." },
                      { who: "Customers", i: "cart", d: -1, t: "May feel misled if they learn the truth." }],
            say: "It would fail the headline test the day it comes out." },
          { key: "fix", t: "Stay, but require fair hours and check them regularly",
            effects: [{ who: "Investors", i: "coins", d: 0, t: "Costs rise a little." },
                      { who: "Factory workers", i: "worker", d: 1, t: "Keep their jobs, with better conditions." },
                      { who: "Customers", i: "cart", d: 1, t: "Can trust the company's word." }],
            say: "Using the company's buying power to improve conditions — what Gap aims to do." },
          { key: "leave", t: "Drop the supplier immediately",
            effects: [{ who: "Investors", i: "coins", d: -1, t: "Must find a new, dearer supplier." },
                      { who: "Factory workers", i: "worker", d: -1, t: "May lose their jobs altogether." },
                      { who: "Customers", i: "cart", d: 1, t: "Hear that the company acted." }],
            say: "Walking away looks clean — but can hurt the very workers it meant to protect." }] },
        gate: true, then: "Ethics in business is rarely one easy answer. It's weighing every stakeholder — honestly." },
      { type: "explain", kicker: "In your own words",
        prompt: "Some people say a business's only responsibility is to make a profit. Using this unit, do you agree? Why or why not?",
        model: "Profit is the foundation — without it a business can't survive. But a business also owes employees, customers and society honesty, safety and fairness, and responsible companies often do better because people trust them." },
      { type: "multi", kicker: "Put it all together", skill: "Trends in ethics",
        prompt: "Which of these show a company taking ethics and social responsibility seriously? Pick all that apply.",
        options: [{ t: "Linking its giving to its mission, in the towns where it works", ok: true, fb: "Yes — strategic giving." },
                  { t: "Publishing a list of all its factories so anyone can check them", ok: true, fb: "Yes — openness about its suppliers." },
                  { t: "A code of ethics that its leaders actually follow", ok: true, fb: "Yes — codes work when leaders live by them." },
                  { t: "Paying a bribe to win a contract abroad", ok: false, fb: "Bribery is unethical — and illegal in most countries." },
                  { t: "Keeping quiet about a product's known safety flaw", ok: false, fb: "Hiding information that could harm customers is unethical." }],
        hints: ["Which ones are honest and fair to every stakeholder?"],
        why: "Strategic giving, openness about factories and a lived code of ethics are responsible. Bribes and hidden flaws are not." }
    ]
  };

  var U2T_BANK = [
    ["A sportswear company funds free youth sports leagues near its stores.", "strat"], ["A bank donates to a different random charity every year.", "trad"],
    ["A tech company trains teachers to use computers in its home city.", "strat"], ["A cereal maker fights child hunger in communities where it sells.", "strat"],
    ["A company gives whatever charity calls first a small check.", "trad"], ["An oil firm sponsors an unrelated sailing race abroad.", "trad"]
  ];
  var U2T_CONTRACT = [
    ["Offering paid leave and remote work as part of rewards", "Pay"], ["Rewarding what employees achieve this year, not only long service", "Pay"],
    ["Managers setting realistic goals and showing each person a path to grow", "Managing"], ["Checking in with employees often, knowing they may move on in a few years", "Managing"],
    ["Giving workers more flexibility, openness and fairness", "Culture"], ["Training workers in new skills as technology changes", "Learning"],
    ["Workers keeping their skills up to date so they add value", "Learning"]
  ];
  var U2T_MULTI = [
    ["Hiring and developing local managers", 1], ["Committing to the country for the long term", 1], ["Involving local stakeholders in decisions", 1],
    ["Respecting local customs and practices", 1], ["Applying its ethical guidelines in every country", 1],
    ["Ignoring local laws when they're inconvenient", 0], ["Leaving at the first sign of lower costs elsewhere", 0], ["Allowing child labor where it's common", 0]
  ];

  SKILLS.push(
    { id: "biz2-trends", title: "Trends in ethics and social responsibility", lesson: 8,
      gen: function (R, i) {
        var t = i % 3;
        if (t === 0) {
          var x = R.pick(U2T_BANK);
          return mc(R, { prompt: "“" + x[0] + "”<br><br>Is this strategic giving or traditional giving?", keep: true,
            right: x[1] === "strat" ? "Strategic giving" : "Traditional giving",
            wrong: [{ t: x[1] === "strat" ? "Traditional giving" : "Strategic giving", fb: x[1] === "strat" ? "It's tied to the company's business and its communities — strategic." : "There's no link to the company's mission or communities — traditional." }],
            hints: ["Is it linked to the company's mission and communities?"], why: x[1] === "strat" ? "Linked to mission and community: strategic giving." : "Not linked: traditional giving." });
        }
        if (t === 1) {
          var c = R.pick(U2T_CONTRACT), parts = ["Pay", "Managing", "Culture", "Learning"];
          return mc(R, { prompt: "“" + c[0] + ".”<br><br>Which part of the new social contract between employer and employee is this?", keep: true, right: c[1],
            wrong: parts.filter(function (p) { return p !== c[1]; }).map(function (p) { return { t: p, fb: "This one is about " + c[1].toLowerCase() + "." }; }),
            hints: ["Pay, managing, culture or learning?"], why: "It's part of " + c[1].toLowerCase() + "." });
        }
        var good = R.chance(0.6), m = R.pick(U2T_MULTI.filter(function (x) { return x[1] === (good ? 1 : 0); }));
        return mc(R, { prompt: "A multinational opens a factory abroad. “" + m[0] + ".”<br><br>Is that what a responsible multinational does?", keep: true,
          right: good ? "Yes" : "No",
          wrong: [{ t: good ? "No" : "Yes", fb: good ? "It is — respecting and investing in the host country is part of the job." : "A responsible multinational keeps its ethics and its commitments everywhere." }],
          hints: ["Does it respect the host country and keep the company's ethics?"], why: good ? "Yes — that's a responsibility of a good multinational." : "No — responsible multinationals keep their ethics and commit for the long term." });
      } }
  );

L.unit("biz", 2, {
    title: "Ethics and social responsibility",
    lessons: LESSONS.slice(1),
    quizzes: [
      { title: "Quiz 1", after: 2, blurb: "Spotting unethical behavior, and the ways people reason about right and wrong.", skills: ["biz2-unethical", "biz2-philo"], per: 3 },
      { title: "Quiz 2", after: 4, blurb: "How organizations shape conduct, and the checks for making an ethical decision.", skills: ["biz2-org", "biz2-decide"], per: 3 },
      { title: "Quiz 3", after: 7, blurb: "Corporate social responsibility, legal and responsible behavior, stakeholders and giving.", skills: ["biz2-csr", "biz2-legal", "biz2-stake", "biz2-giving"], per: 2 },
      { title: "Quiz 4", after: 8, blurb: "The whole unit, with the trends reshaping ethics and responsibility.", skills: ["biz2-trends", "biz2-unethical", "biz2-decide", "biz2-stake"], per: 2 }
    ],
    skills: SKILLS
  });
})();
