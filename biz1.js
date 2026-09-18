/* ==========================================================================
   Introduction to Business — Unit 1, Introduction to Business.
   Sections 1.1–1.2.

   Written from the Boundless Textbook the same way as Media Arts Units 5 and 6:
   curated rather than copied. Every definition a section tests on is here,
   every idea the checks need is here, and the padding around them is not.

   ----------------------------------------------------------------- Images
   Diagrams are drawn for OEdu as SVG. Photographs, where used, are from Wikimedia
   Commons, each credited beside the figure.
   ========================================================================== */
window.OPLO_BIZ1 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  var D = function (t, d) { return { k: "def", t: t, d: d }; };
  var Q = function (t, s) { return { k: "quote", t: t, s: s }; };
  var N = function (t) { return { k: "note", t: t }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };
  var S = function (n, d) { return { k: "stat", n: n, d: d }; };
  var F = function (o) {
    return { k: "fig", imgs: o.imgs, cap: o.cap, credits: o.credits,
             cols: o.cols || null, natural: !!o.natural,
             diagram: !!o.diagram, size: o.size || null };
  };

  var M = "media/biz1/";
  var OEDU = [{ what: "Diagram", by: "OEdu" }];

  return [{
    n: "1.1", t: "What Is Business?", kicker: "Why business exists",
    stand: "Business turns scarce resources into the goods and services " +
           "people need. It is the engine of every economy.",
    mins: 8,
    objectives: ["Define business and its purpose",
                 "Identify the factors of production",
                 "Explain how profit drives business activity"],
    body: [
      H("Scarcity and choice"),
      P("Every society faces the same problem: people want more than they can " +
        "have. Resources — time, money, raw materials, labour — are limited. " +
        "Wants are not. This gap between limited resources and unlimited wants " +
        "is called <b>scarcity</b>, and it forces every person and every " +
        "organization to make choices."),
      D("Scarcity", "The fundamental economic problem: resources are limited " +
        "but human wants are not."),
      D("Opportunity cost", "The value of the next-best alternative given up " +
        "when a choice is made. Every choice has one."),
      N("<b>The catch.</b> Scarcity doesn't mean a shortage. A shortage is " +
        "temporary; scarcity is permanent. There will never be enough of " +
        "everything for everyone, always."),
      H("What business does"),
      P("Business is the organized effort to produce and sell goods and " +
        "services that satisfy society's needs. Businesses combine the four " +
        "factors of production to create something people will pay for."),
      D("Business", "An organized effort by individuals to produce and sell " +
        "goods or services that satisfy society's needs for the purpose of profit."),
      L("Factors of production", [
        ["Land", "All natural resources used in production: soil, water, " +
         "minerals, forests."],
        ["Labour", "Human effort used in production, from physical work to " +
         "management."],
        ["Capital", "Tools, machines, buildings, and equipment used to " +
         "produce goods."],
        ["Enterprise", "The organization, risk-taking, and decision-making " +
         "that brings the other three together."]
      ]),
      F({ imgs: [{ src: M + "2-1-circle-flow.svg", w: 700, h: 400,
                   alt: "A circular diagram showing households and firms " +
                        "interacting through the product market and factor " +
                        "market." }],
         cap: "Households own the factors of production and sell them to " +
              "firms. Firms use those factors to produce goods and services " +
              "which households buy. Money flows in the opposite direction.",
         credits: OEDU, diagram: true }),
      H("Profit and the business test"),
      D("Revenue", "Money coming in from sales, before any costs have been " +
        "taken out."),
      D("Profit", "Revenue minus costs. The reason a private business exists " +
        "and the test of whether it works."),
      P("Profit is the reward for taking risk. A business that consistently " +
        "loses money is not serving a need well enough — or it is managed " +
        "poorly. Either way, the market signals change."),
      Q("The section in one line.", "Business combines scarce resources to " +
         "make things people will pay for, aiming for profit.")
    ],
    check: { q: "The four factors of production are",
             opts: ["Land, labour, capital, enterprise",
                    "Goods, services, income, profit",
                    "Supply, demand, price, quantity"],
             right: 0,
             why: "Land, labour, capital and enterprise are the four inputs " +
                  "used to produce goods and services. Everything else is a " +
                  "result of these working together." }
  }, {
    n: "1.2", t: "Markets and How They Work", kicker: "Supply, demand, price",
    stand: "Prices are not set by decree — they emerge from the " +
           "meeting of buyers and sellers.",
    mins: 10,
    objectives: ["Explain supply and demand",
                 "Define equilibrium price",
                 "Describe the market economy"],
    body: [
      H("Supply: the seller's side"),
      D("Supply", "The quantity of a good or service that producers are willing " +
        "and able to sell at various prices during a period."),
      D("Law of Supply", "As price increases, quantity supplied increases, and " +
        "as price decreases, quantity supplied decreases — all else being " +
        "equal."),
      P("Producers supply more when they can sell more. Higher prices make " +
        "additional production worthwhile. This is why supply curves slope " +
        "upward."),
      H("Demand: the buyer's side"),
      D("Demand", "The quantity of a good or service that consumers are willing " +
        "and able to buy at various prices during a period."),
      D("Law of Demand", "As price decreases, quantity demanded increases, and " +
        "as price increases, quantity demanded decreases — all else being " +
        "equal."),
      P("Two effects work together: the substitution effect (cheaper means " +
        "switching to it) and the income effect (falling prices raise " +
        "purchasing power)."),
      H("Where they meet"),
      P("Market <b>equilibrium</b> is the price and quantity where the demand " +
        "curve and supply curve intersect. At this point, the quantity buyers " +
        "want equals the quantity sellers want."),
      D("Equilibrium price", "The price at which quantity demanded equals " +
        "quantity supplied."),
      D("Surplus", "When quantity supplied exceeds quantity demanded — a price " +
        "above equilibrium."),
      D("Shortage", "When quantity demanded exceeds quantity supplied — a price " +
        "below equilibrium."),
      F({ imgs: [{ src: M + "2-2-equilibrium.svg", w: 400, h: 320,
                   alt: "A graph showing supply and demand curves crossing at " +
                        "equilibrium point E, with P* and Q* marked." }],
         cap: "Equilibrium is where the two curves cross. Any other price " +
              "creates pressure to move back — shortages push prices up, " +
              "surpluses push them down.",
         credits: OEDU, diagram: true }),
      H("The market economy"),
      D("Market economy", "An economy where prices are set by supply and demand " +
        "rather than by a central authority."),
      P("In a market economy, prices coordinate the decisions of millions of " +
        "buyers and sellers without anyone centrally planning it. The price " +
        "system sends signals: high prices encourage production and discourage " +
        "consumption; low prices do the opposite."),
      N("<b>A nuance.</b> Pure market economies don't exist. Every economy " +
        "is mixed — combining market mechanisms with government involvement. " +
        "The question is only how much government."),
      Q("The section in one line.", "Prices emerge from supply and demand — " +
         "the market's way of rationing scarce goods.")
    ],
    check: { q: "When the price of a good is below equilibrium, the market " +
                "experiences",
             opts: ["A surplus", "A shortage", "No change"],
             right: 1,
             why: "Below equilibrium, buyers want more than sellers want to " +
                  "sell. Demand exceeds supply, creating a shortage. Prices " +
                  "then rise toward equilibrium." }
  }];
})();
