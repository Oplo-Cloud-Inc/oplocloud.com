/* ==========================================================================
   Introduction to Business — Unit 2 Economics and Business; Unit 3 Ethics;
   Unit 5 Business Writing. Sections 2.1–2.6, 3.1–3.4, 5.1–5.6.

   Written from the Boundless Textbook the same way as Media Arts Units 5 and 6:
   curated rather than copied. Every definition a section tests on is here,
   every idea the checks need is here, and the padding around them is not.

   ----------------------------------------------------------------- Images
   Diagrams are drawn for OEdu as SVG. Photographs, where used, are from Wikimedia
   Commons, each credited beside the figure.
   ========================================================================== */
window.OPLO_BIZ2 = (function () {
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
    n: "2.1", t: "Economics and Business", kicker: "What economics is",
    stand: "Economics is the study of how people choose to use limited resources. " +
           "Business sits inside those choices — it creates, sells, and organizes.",
    mins: 8,
    objectives: ["Define economics and its central problem",
                 "Distinguish microeconomics from macroeconomics",
                 "Explain the role of business in the economy"],
    body: [
      H("Scarcity and choice"),
      P("Economics begins with a fact: people want more than they can have. " +
        "Resources — time, money, raw materials — are limited. Wants are not. " +
        "Economics is the study of how people and societies decide what to produce, " +
        "how to produce it, and for whom."),
      D("Economics", "The social science that studies how individuals, businesses, " +
        "and governments allocate scarce resources to satisfy unlimited wants."),
      D("Scarcity", "The fundamental economic problem: resources are limited but " +
        "human wants are not."),
      D("Opportunity cost", "The value of the next-best alternative given up when " +
        "a choice is made. Every choice has one."),
      H("Two branches"),
      D("Microeconomics", "The study of individual decision-making: households, " +
        "firms, and how prices are set in specific markets."),
      D("Macroeconomics", "The study of the economy as a whole: inflation, " +
        "unemployment, growth, and the role of government."),
      P("A useful split, but the two overlap. When a firm decides what to produce " +
        "(micro), it responds to consumer demand and national income (macro)."),
      H("The role of business"),
      P("Business is the engine of the economy. Businesses combine resources — " +
        "labour, capital, raw materials — to produce goods and services that " +
        "satisfy needs and wants. In doing so, they create jobs, pay taxes, and " +
        "generate the income that households use to consume."),
      D("Business", "An organized effort by individuals to produce and sell goods " +
        "or services that satisfy society's needs for the purpose of profit."),
      L("Factors of production", [
        ["Land", "All natural resources used in production: soil, water, minerals, forests."],
        ["Labour", "Human effort used in production, from physical work to management."],
        ["Capital", "Tools, machines, buildings, and equipment used to produce goods."],
        ["Enterprise", "The organization, risk-taking, and decision-making that brings " +
         "the other three together."]
      ]),
      F({ imgs: [{ src: M + "2-1-circle-flow.svg", w: 700, h: 400,
                   alt: "A circular diagram showing households and firms interacting " +
                        "through the product market and factor market. Arrows show " +
                        "money flowing one way and goods, services, and resources " +
                        "flowing the other." }],
         cap: "The economy in one loop. Households own the factors of production " +
              "and sell them to firms. Firms use those factors to produce goods and " +
              "services, which households buy. Money flows the opposite direction.",
         credits: OEDU, diagram: true }),
      Q("The section in one line.", "Business organizes scarce resources to satisfy " +
         "human wants in the hope of profit.")
    ],
    check: { q: "The four factors of production are",
             opts: ["Land, labour, capital, enterprise",
                    "Goods, services, income, profit",
                    "Supply, demand, price, quantity"],
             right: 0,
             why: "Land, labour, capital and enterprise are the four inputs used " +
                  "to produce goods and services. Everything else is a result of " +
                  "these working together." }
  }, {
    n: "2.2", t: "Demand, Supply, and Market Equilibrium", kicker: "How prices are set",
    stand: "Price is not random. Demand pulls one way, supply pushes the other, " +
           "and the place they meet is the equilibrium.",
    mins: 10,
    objectives: ["Explain the law of demand and the law of supply",
                 "Identify the determinants of demand and supply",
                 "Find equilibrium price and quantity"],
    body: [
      H("Demand: the buyer's side"),
      P("The <b>law of demand</b> says that, all else being equal, as the price of a " +
        "good falls, the quantity demanded rises — and vice versa. Cheaper means " +
        "more people buy, and they buy more of it."),
      D("Demand", "The quantity of a good or service that consumers are willing and " +
        "able to buy at various prices during a period."),
      D("Law of Demand", "As price decreases, quantity demanded increases, and as " +
        "price increases, quantity demanded decreases — ceteris paribus."),
      P("Why? Two effects work together. The <b>substitution effect</b>: when " +
        "something gets cheaper, people switch to it from alternatives. The " +
        "<b>income effect</b>: when prices fall, purchasing power rises, so people " +
        "can afford more."),
      H("What shifts demand"),
      P("Price moves you along the demand curve. Everything else shifts the whole " +
        "curve. The main shifters:"),
      L("Determinants of demand", [
        ["Income", "Higher income raises demand for normal goods; lowers it for " +
         "inferior goods."],
        ["Tastes and preferences", "What people want shifts with trends, advertising, " +
         "and seasons."],
        ["Prices of related goods", "Substitutes (tea vs. coffee) and complements " +
         "(phones and apps) affect demand."],
        ["Expectations", "If buyers expect higher prices tomorrow, they buy more today."],
        ["Number of buyers", "More buyers in the market means more demand."]
      ]),
      H("Supply: the seller's side"),
      D("Supply", "The quantity of a good or service that producers are willing and " +
        "able to sell at various prices during a period."),
      D("Law of Supply", "As price increases, quantity supplied increases, and as " +
        "price decreases, quantity supplied decreases — ceteris paribus."),
      P("Producers supply more when they can sell more. Higher prices make " +
        "additional production worthwhile. This is why supply curves slope upward."),
      H("What shifts supply"),
      L("Determinants of supply", [
        ["Input costs", "Cheaper raw materials or labour mean more supply at every price."],
        ["Technology", "Better production methods increase supply."],
        ["Government policy", "Taxes reduce supply; subsidies increase it."],
        ["Expectations", "If sellers expect higher prices later, they may withhold " +
         "supply now."],
        ["Number of sellers", "More firms in the market means more supply."]
      ]),
      H("Where demand and supply meet"),
      P("Market <b>equilibrium</b> is the price and quantity where the demand curve " +
        "and supply curve intersect. At this point, the quantity buyers want equals " +
        "the quantity sellers want. There is no shortage and no surplus."),
      D("Equilibrium price", "The price at which quantity demanded equals quantity " +
        "supplied."),
      D("Surplus", "When quantity supplied exceeds quantity demanded — a price above " +
        "equilibrium."),
      D("Shortage", "When quantity demanded exceeds quantity supplied — a price below " +
        "equilibrium."),
      F({ imgs: [{ src: M + "2-2-equilibrium.svg", w: 400, h: 320,
                   alt: "A graph with price on the vertical axis and quantity on the " +
                        "horizontal. A downward-sloping red demand curve and an " +
                        "upward-sloping green supply curve cross at a point marked E. " +
                        "Dashed lines drop to Q* on the horizontal and go across to P* " +
                        "on the vertical." }],
         cap: "Equilibrium is where the two curves cross. At P* the quantity " +
              "buyers want exactly matches the quantity sellers want. Any other " +
              "price creates pressure to move back.",
         credits: OEDU, diagram: true }),
      Q("The section in one line.", "Price is where supply meets demand — the market's " +
         "way of rationing scarce goods.")
    ],
    check: { q: "If the price of a good is below equilibrium, the market will " +
                "experience",
             opts: ["A shortage", "A surplus", "No change"],
             right: 0,
             why: "Below equilibrium, buyers want more than sellers want to sell. " +
                  "Demand exceeds supply, creating a shortage. Prices then rise " +
                  "toward equilibrium." }
  }, {
    n: "2.3", t: "Market Structures and Failures", kicker: "How markets compete",
    stand: "Competition is a spectrum — from many sellers with no power " +
           "to one seller who sets all the prices.",
    mins: 10,
    objectives: ["Compare perfect competition, monopolistic competition, " +
                 "oligopoly, and monopoly",
                 "Identify market failures and their causes",
                 "Explain government responses to market failure"],
    body: [
      H("The competition spectrum"),
      P("Market structure describes how many sellers exist, what they sell, " +
        "and how easy it is to enter. The four main structures form a " +
        "scale from most to least competitive."),
      F({ imgs: [{ src: M + "2-3-market-structures.svg", w: 420, h: 340,
                   alt: "Four horizontal bars showing market structures from " +
                        "left to right: Perfect Competition (green), " +
                        "Monopolistic Competition (yellow), Oligopoly (orange), " +
                        "and Monopoly (red), with examples under each." }],
         cap: "From many competitors to one. As the number of sellers " +
              "falls, each seller's control over price rises.",
         credits: OEDU, diagram: true }),
      L("Four market structures", [
        ["Perfect Competition", "Many sellers, identical product, no one " +
         "controls price. Example: farm products, foreign exchange."],
        ["Monopolistic Competition", "Many sellers, differentiated product, " +
         "some price control. Example: restaurants, clothing brands."],
        ["Oligopoly", "Few large sellers, interdependent pricing. Example: " +
         "airlines, soft drinks, wireless networks."],
        ["Monopoly", "One seller, no close substitutes, price maker. Example: " +
         "utilities, patented drugs."]
      ]),
      H("Market power and concentration"),
      P("In a monopoly, the single firm faces the market demand curve and " +
        "can set a price above marginal cost. In perfect competition, " +
        "individual firms are price takers — they accept the market price."),
      P("Concentration ratios measure market power. The four-firm " +
        "concentration ratio (CR4) adds the market shares of the four " +
        "largest firms. A high CR4 suggests oligopoly or monopoly."),
      H("When markets fail"),
      P("Markets work well when they are competitive and information is " +
        "symmetric. They fail when these conditions break."),
      D("Market failure", "A situation in which the market does not allocate " +
        "resources efficiently on its own."),
      L("Causes of market failure", [
        ["Externalities", "Costs or benefits that fall on third parties not " +
         "involved in the transaction. Pollution is a negative externality."],
        ["Public goods", "Goods that are non-excludable and non-rival " +
         "(national defence, street lights). Markets under-provide them."],
        ["Asymmetric information", "One party knows more than the other " +
         "(used cars, insurance). This can lead to adverse selection."],
        ["Market power", "Monopolies restrict output and raise prices above " +
         "competitive levels."]
      ]),
      H("Government responses"),
      P("Governments intervene to correct market failures: taxes on " +
        "pollution (Pigouvian taxes), provision of public goods, " +
        "antitrust enforcement, and regulation of information."),
      D("Pigouvian tax", "A tax equal to the external cost of a negative " +
        "externality, designed to make the polluter pay the true cost."),
      Q("The section in one line.", "Competition keeps prices fair; when it " +
         "fails, government steps in.")
    ],
    check: { q: "Which market structure has many sellers with differentiated " +
                 "products?",
             opts: ["Perfect competition", "Monopolistic competition",
                    "Oligopoly", "Monopoly"],
             right: 1,
             why: "Monopolistic competition has many sellers, but each sells " +
                  "a slightly different product (branding, quality, features). " +
                  "Perfect competition has identical products." }
  }, {
    n: "2.4", t: "Roles of Government in a Market Economy", kicker: "Why governments intervene",
    stand: "Markets are powerful but imperfect. Governments step in to " +
           "correct failures, redistribute, and stabilize.",
    mins: 9,
    objectives: ["Explain why governments intervene in markets",
                 "Distinguish taxation, regulation, and provision",
                 "Evaluate the pros and cons of government intervention"],
    body: [
      H("The case for intervention"),
      P("The market mechanism is efficient when competition is strong and " +
        "information is available. But markets do not always deliver what " +
        "society wants. Governments intervene for three main reasons: " +
        "to correct market failures, to promote equity, and to stabilize " +
        "the economy."),
      H("Tools of intervention"),
      L("Government tools", [
        ["Taxation", "Taxes change behaviour. A tax on cigarettes discourages " +
         "smoking; a carbon tax reduces emissions."],
        ["Regulation", "Rules that set standards: safety, environment, " +
         "consumer protection. Regulations can be costly to enforce."],
        ["Provision", "The government directly provides goods the market " +
         "under-provides: defence, roads, education."],
        ["Subsidies", "Payments that lower costs for producers or consumers, " +
         "encouraging activities the government wants to promote."]
      ]),
      H("Types of tax"),
      D("Progressive tax", "A tax where the rate rises as income rises. " +
        "Those who earn more pay a higher percentage."),
      D("Regressive tax", "A tax where the rate falls as income rises. " +
        "Sales taxes are often regressive because lower-income households " +
        "spend a larger share of income on taxable goods."),
      D("Proportional tax", "A tax where the rate is the same regardless " +
        "of income."),
      H("Pros and cons"),
      P("Government intervention can correct failures and reduce inequality. " +
        "But it can also create inefficiency: regulations may protect " +
        "incumbent firms, taxes may distort incentives, and bureaucracy " +
        "can be slow and expensive."),
      N("<b>A nuance.</b> The debate is rarely 'intervention vs. no " +
        "intervention'. It is always about <i>how much</i> and " +
        "<i>which kind</i>. Every policy has both winners and losers, and " +
        "the question is who wins and who loses."),
      Q("The section in one line.", "Governments correct market failures, " +
         "redistribute income, and stabilize the economy — each at a cost.")
    ],
    check: { q: "A tax where the rate rises as income rises is called",
             opts: ["Progressive", "Regressive", "Proportional"],
             right: 0,
             why: "A progressive tax takes a larger percentage from higher " +
                  "incomes. Progressive systems aim to reduce inequality " +
                  "by making the wealthy pay a higher rate." }
  }, {
    n: "2.5", t: "Mixed Economies and Globalization", kicker: "The global economy",
    stand: "No economy is purely free or purely planned. And " +
           "no country's economy is isolated from the rest of the world.",
    mins: 9,
    objectives: ["Describe the characteristics of a mixed economy",
                 "Explain the forces of globalization",
                 "Assess the effects of trade on consumers and producers"],
    body: [
      H("Mixed economies"),
      P("In practice, no economy is purely market or purely planned. " +
        "Every modern economy is <b>mixed</b> — combining private " +
        "enterprise with government involvement. The question is " +
        "only where on the spectrum each falls."),
      D("Mixed economy", "An economic system combining private ownership " +
        "and market mechanisms with significant government involvement " +
        "in allocation and distribution."),
      L("Where economies sit on the spectrum", [
        ["Market economy (free market)", "Minimal government. Prices set " +
         "by supply and demand. Example: pre-reform Hong Kong."],
        ["Mixed economy", "Most Western nations: market with social safety " +
         "nets, regulation, and public services."],
        ["Command economy", "Government controls production and pricing. " +
         "Example: former Soviet Union, North Korea."]
      ]),
      H("Globalization"),
      P("<b>Globalization</b> is the increasing interconnection of " +
        "economies through trade, investment, technology, and the movement " +
        "of people. It has accelerated dramatically since the 1990s, " +
        "driven by lower trade barriers, cheaper transport, and the internet."),
      D("Free trade", "Trade without tariffs, quotas, or other " +
        "restrictions between countries."),
      D("Protectionism", "Government policies that restrict trade to " +
        "protect domestic industries — tariffs, quotas, and subsidies."),
      H("Winners and losers from trade"),
      P("Trade is not a zero-sum game. Overall, it makes countries " +
        "better off by allowing specialisation and access to cheaper " +
        "goods. But the gains are unevenly distributed:"),
      L("Effects of trade", [
        ["Consumers", "Gain from lower prices and more variety."],
        ["Exporting industries", "Gain from larger markets."],
        ["Import-competing industries", "Lose from cheaper imports; jobs " +
         "may be lost."],
        ["Workers in declining sectors", "May face unemployment and need " +
         "retraining."]
      ]),
      N("<b>A correction to the course text.</b> The claim that trade " +
        "always benefits everyone is too strong. Trade benefits the " +
        "country overall but creates concentrated losses in specific " +
        "sectors. Compensation and retraining are policy responses."),
      Q("The section in one line.", "Mixed economies blend markets and " +
         "government; globalization connects them across borders.")
    ],
    check: { q: "A tariff is an example of",
             opts: ["Free trade", "Protectionism", "Globalization",
                    "Comparative advantage"],
             right: 1,
             why: "A tariff is a tax on imports, which restricts trade " +
                  "to protect domestic industries. It is the textbook " +
                  "example of protectionism." }
  }, {
    n: "2.6", t: "Personal Financial Decisions", kicker: "Managing your money",
    stand: "Economics is not just for governments and firms. " +
           "Every person makes financial decisions that shape their future.",
    mins: 8,
    objectives: ["Explain budgeting and the role of savings",
                 "Describe the basics of investing and risk",
                 "Identify the costs and responsibilities of using credit"],
    body: [
      H("Budgeting basics"),
      P("A <b>budget</b> is a plan for how income will be divided " +
        "between consumption and saving. Without one, spending tends " +
        "to expand to fill available income, leaving nothing for the future."),
      D("Budget", "A financial plan that allocates income to expenses, " +
        "savings, and debt repayment over a period."),
      L("A simple budget rule", [
        ["Needs", "Essential expenses: housing, food, transport, insurance."],
        ["Wants", "Discretionary spending: entertainment, dining out, " +
         "hobbies."],
        ["Savings", "Money set aside for future goals: emergency fund, " +
         "retirement, education."],
        ["Debt repayment", "Paying down borrowings, starting with the " +
         "highest-interest debt."]
      ]),
      H("Saving and investing"),
      P("Saving is postponing consumption. Investing is putting saved " +
        "money to work to grow it. Both carry trade-offs."),
      D("Saving", "Setting aside income in safe, liquid accounts — " +
        "savings accounts, money market funds."),
      D("Investing", "Buying assets — stocks, bonds, property — expected " +
        "to grow in value or generate income."),
      P("Higher expected returns come with higher risk. A savings account " +
        "is safe but earns little; stocks can multiply but can also fall " +
        "sharply. Diversification — spreading money across different " +
        "assets — reduces risk without giving up all return."),
      H("Credit and its costs"),
      D("Credit", "Borrowing money with a promise to repay, usually " +
        "with interest over time."),
      D("Interest rate", "The cost of borrowing, expressed as a " +
        "percentage of the amount borrowed per year."),
      P("Credit is useful when it finances productive investment — " +
        "education, a home, a business. It becomes costly when used for " +
        "consumption that cannot be repaid. High-interest debt (credit " +
        "cards, payday loans) can trap people in cycles of borrowing."),
      L("Costs of credit", [
        ["Interest", "The price of borrowing over time."],
        ["Fees", "Service charges, late fees, annual fees."],
        ["Opportunity cost", "Money going to debt payments could have " +
         "been saved or invested."]
      ]),
      Q("The section in one line.", "Financial health is about spending " +
         "less than you earn, saving consistently, and using credit wisely.")
    ],
    check: { q: "Diversification in investing means",
             opts: ["Buying only high-risk stocks",
                    "Spreading money across different assets to reduce risk",
                    "Investing all savings in one company"],
             right: 1,
             why: "Diversification reduces risk by not putting all your " +
                  "money in one place. If one investment fails, others " +
                  "may still perform well." }
  }];
})();
