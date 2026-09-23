/* ==========================================================================
   Introduction to Business — Unit 3, Business Ethics and Social Responsibility.
   Sections 3.1–3.4.

   Written from the Boundless Textbook the same way as Media Arts Units 5 and 6:
   curated rather than copied. Every definition a section tests on is here,
   every idea the checks need is here, and the padding around them is not.

   ----------------------------------------------------------------- Images
   Diagrams are drawn for OEdu as SVG. Photographs, where used, are from Wikimedia
   Commons, each credited beside the figure.
   ========================================================================== */
window.OPLO_BIZ3 = (function () {
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
    n: "3.1", t: "Ethics and Business", kicker: "What is right?",
    stand: "Ethics in business is not about being nice — it is about " +
           "making decisions that hold up when someone checks.",
    mins: 9,
    objectives: ["Define business ethics and ethical reasoning",
                 "Apply ethical frameworks to business decisions",
                 "Identify common ethical issues in business"],
    body: [
      H("What business ethics is"),
      P("Business ethics asks: what is the right thing to do? " +
        "It is not the same as following the law — something legal " +
        "may not be ethical, and something ethical may not be legal. " +
        "Ethics is about the reasons behind decisions, not just their " +
        "outcomes."),
      D("Business ethics", "The principles and standards that guide " +
        "behaviour in the world of business."),
      P("Unethical behaviour in business costs money: loss of customers, " +
        "fines, lawsuits, and demoralised employees. Ethical behaviour " +
        "is not just right — it is good business."),
      H("Three ethical frameworks"),
      F({ imgs: [{ src: M + "3-1-ethics-pyramid.svg", w: 420, h: 340,
                   alt: "A flowchart with six steps from bottom to top: " +
                        "Recognize, See Facts, Know Options, Reflect, " +
                        "Choose, Act. Each step in a different coloured " +
                        "rectangle." }],
         cap: "Ethical decision-making as a process: recognize the issue, " +
              "gather the facts, know your options, reflect on consequences, " +
              "choose, and act. Then reflect again on what happened.",
         credits: OEDU, diagram: true }),
      L("Ethical frameworks", [
        ["Utilitarianism", "The right action produces the greatest good " +
         "for the greatest number. Focus on outcomes."],
        ["Deontology", "Certain actions are right or wrong in themselves, " +
         "regardless of consequences. Focus on duties and rules."],
        ["Virtue ethics", "Focus on the character of the decision-maker: " +
         "what would a good person do?"]
      ]),
      P("Most business decisions do not fit neatly into one framework. " +
        "A utilitarian looks at outcomes; a deontologist checks duties; " +
        "a virtue ethicist asks about character. Using more than one " +
        "lens usually gives a better answer."),
      H("Common ethical issues"),
      L("Frequent ethical challenges in business", [
        ["Conflicts of interest", "When personal interests clash with " +
         "professional duties."],
        ["Honest communication", "Advertising accuracy, avoiding " +
         "misleading claims."],
        ["Fair treatment", "Discrimination, harassment, equal opportunity."],
        ["Confidentiality", "Protecting customer and company data."],
        ["Gift-giving", "When does a gift become a bribe?"]
      ]),
      Q("The section in one line.", "Ethics is doing right when no one " +
         "is watching — and being able to explain why.")
    ],
    check: { q: "The ethical framework that focuses on the greatest good " +
                 "for the greatest number is",
             opts: ["Deontology", "Utilitarianism", "Virtue ethics"],
             right: 1,
             why: "Utilitarianism, associated with Jeremy Bentham and " +
                  "John Stuart Mill, judges actions by their outcomes — " +
                  "maximizing overall happiness or welfare." }
  }, {
    n: "3.2", t: "Corporate Responsibility and Sustainability", kicker: "Beyond profit",
    stand: "A company that only pursues profit misses what else it " +
           "owes — and what actually sustains it long-term.",
    mins: 10,
    objectives: ["Describe corporate social responsibility (CSR)",
                 "Explain the triple bottom line",
                 "Analyze sustainability practices in business"],
    body: [
      H("What CSR means"),
      P("<b>Corporate social responsibility</b> is the idea that " +
        "businesses have obligations beyond making profit — to " +
        "employees, communities, and the environment. It is not charity; " +
        "it is long-term thinking."),
      D("Corporate Social Responsibility (CSR)", "A business model where " +
        "companies consider their impact on all of society, not just " +
        "shareholders."),
      P("The debate is settled: companies that ignore social and " +
        "environmental concerns lose customers, talent, and licences to " +
        "operate. The question is not whether to be responsible but how."),
      H("The triple bottom line"),
      D("Triple Bottom Line", "A framework measuring success by three " +
        "bottom lines: people, planet, and profit."),
      L("Three bottom lines", [
        ["Profit", "The financial performance traditional accounting " +
         "measures. Necessary — without it, the business does not survive."],
        ["People", "Social impact: fair wages, safe working conditions, " +
         "community investment."],
        ["Planet", "Environmental impact: emissions, waste, resource use, " +
         "and what is left for the future."]
      ]),
      F({ imgs: [{ src: M + "3-2-csr-pyramid.svg", w: 420, h: 360,
                   alt: "A four-layer pyramid from bottom to top: " +
                        "Economic (red, base), Legal (yellow), Ethical " +
                        "(green), Philanthropic (purple, top)." }],
         cap: "Carroll's CSR Pyramid (1991). Economic responsibility is " +
              "the base — without profit, nothing else is possible. " +
              "Each layer above builds on the one below.",
         credits: OEDU, diagram: true }),
      H("Sustainability in business"),
      D("Sustainability", "Business practices that meet present needs " +
        "without compromising the ability of future generations to meet " +
        "their own needs."),
      P("Sustainable businesses reduce waste, use resources efficiently, " +
        "and consider long-term impact. The business case is strong: " +
        "energy efficiency cuts costs, waste reduction reduces disposal " +
        "fees, and sustainable brands attract loyal customers."),
      N("<b>A nuance.</b> CSR can be genuine or performative — called " +
        "<i>greenwashing</i> when a company advertises environmental " +
        "concern without meaningful action. The difference matters. " +
        "Customers, regulators, and employees can tell."),
      L("Sustainable practices", [
        ["Circular economy", "Design products for reuse, repair, and " +
         "recycling instead of disposal."],
        ["Carbon neutrality", "Reducing emissions and offsetting the " +
         "remainder."],
        ["Supply chain ethics", "Auditing suppliers for fair labour and " +
         "environmental standards."]
      ]),
      Q("The section in one line.", "Responsibility is not a cost — it " +
         "is the cost of staying in business.")
    ],
    check: { q: "The triple bottom line measures success by",
             opts: ["Revenue, profit, and market share",
                    "People, planet, and profit",
                    "Sales, satisfaction, and sustainability"],
             right: 1,
             why: "The triple bottom line (John Elkington, 1994) measures " +
                  "success across three dimensions: social (people), " +
                  "environmental (planet), and financial (profit)." }
  }, {
    n: "3.3", t: "Diversity, Equity, and Inclusion", kicker: "People at work",
    stand: "Diverse teams make better decisions. " +
           "Inclusion is what turns diversity into results.",
    mins: 8,
    objectives: ["Define diversity, equity, and inclusion (DEI)",
                 "Explain the business case for DEI",
                 "Identify strategies for building inclusive workplaces"],
    body: [
      H("Defining the terms"),
      D("Diversity", "The presence of difference within a group: " +
        "race, ethnicity, gender, age, disability, sexual orientation, " +
        "religion, education, background."),
      D("Equity", "Ensuring fair treatment, access, and opportunity " +
        "for all, recognizing that different people need different " +
        "things to succeed."),
      D("Inclusion", "The practice of ensuring that all people " +
        "feel welcomed, respected, and able to participate fully."),
      P("Diversity is the mix. Inclusion is the culture. Equity " +
        "is the mechanism. A company can be diverse without being " +
        "inclusive — but diverse and excluded people leave."),
      H("The business case"),
      P("Research consistently shows that diverse teams outperform " +
        "homogeneous ones. They consider more alternatives, catch " +
        "more errors, and generate more creative solutions."),
      S("50%", "Higher revenue when teams are diverse and " +
        "inclusive (McKinsey, 2020)"),
      S("2.3x", "More cash flow per employee in companies with " +
        "high diversity (Harvard Business Review)"),
      H("Common barriers"),
      L("Barriers to inclusion", [
        ["Unconscious bias", "Automatic mental shortcuts that " +
         "favour certain groups over others."],
        ["Hiring pipelines", "Recruiting from the same schools " +
         "and networks limits diversity."],
        ["Glass ceiling", "Invisible barriers that prevent " +
         "minority groups from reaching senior roles."],
        ["Microaggressions", "Small, often unintentional " +
         "behaviours that communicate bias."]
      ]),
      H("Strategies"),
      L("Building inclusive workplaces", [
        ["Structured interviews", "Standardised questions and " +
         "scoring reduce bias in hiring."],
        ["Mentorship programmes", "Connecting diverse employees " +
         "with senior leaders."],
        ["Pay audits", "Regular analysis of pay by gender, " +
         "race, and role to find disparities."],
        ["Employee resource groups", "Voluntary groups for " +
         "shared identity, providing support and feedback."]
      ]),
      Q("The section in one line.", "Diversity is being invited " +
         "to the party; inclusion is being asked to dance.")
    ],
    check: { q: "'Equity' in a workplace context means",
             opts: ["Treating everyone exactly the same",
                    "Ensuring fair treatment recognizing different needs",
                    "Hiring only from underrepresented groups"],
             right: 1,
             why: "Equity recognizes that people start from " +
                  "different positions and may need different support " +
                  "to have equal opportunity. Equality (same treatment) " +
                  "is different from equity." }
  }, {
    n: "3.4", t: "Business Law and Compliance", kicker: "The rules",
    stand: "Law sets the floor for ethical behaviour in " +
           "business — the minimum, not the ideal.",
    mins: 9,
    objectives: ["Explain the role of law in business",
                 "Identify key areas of business law",
                 "Distinguish compliance from ethics"],
    body: [
      H("Why business law exists"),
      P("Business law governs how companies operate. It defines " +
        "the rules of the game — contracts, employment, " +
        "consumer protection, competition, and intellectual property. " +
        "The law is the floor: ethics builds on top of it."),
      D("Compliance", "Adhering to laws, regulations, and " +
        "internal policies. It is mandatory and enforceable."),
      D("Contract law", "The body of law governing agreements " +
        "between parties that create enforceable obligations."),
      H("Key areas of business law"),
      L("Major areas", [
        ["Contract law", "Formation, breach, and remedies for " +
         "agreements between parties."],
        ["Employment law", "Wages, discrimination, safety, " +
         "termination."],
        ["Consumer protection", "Truth in advertising, product " +
         "safety, refunds, warranties."],
        ["Intellectual property", "Patents, trademarks, copyright, " +
         "trade secrets."],
        ["Competition law", "Preventing monopolies, cartels, and " +
         "anti-competitive practices."]
      ]),
      H("Contracts"),
      D("Contract", "A legally enforceable agreement with offer, " +
        "acceptance, consideration, and mutual assent."),
      P("A contract does not have to be written to be enforceable, " +
        "though written contracts are easier to prove. Key terms: " +
        "offer (a proposal), acceptance (agreement to terms), " +
        "consideration (something of value exchanged), and capacity " +
        "(legal ability to contract)."),
      H("Compliance programmes"),
      P("Large companies implement compliance programmes to " +
        "prevent violations. An effective programme includes: " +
        "clear policies, training, reporting mechanisms (hotlines), " +
        "and enforcement."),
      N("<b>A distinction.</b> Something can be legal but " +
        "unethical (e.g., aggressively exploiting a legal " +
        "loophole). Compliance prevents legal liability; " +
        "ethics guides better decisions."),
      Q("The section in one line.", "Law tells you what you " +
         "must not do; ethics asks what you should do.")
    ],
    check: { q: "The four elements of a valid contract are",
             opts: ["Offer, acceptance, consideration, capacity",
                    "Price, quantity, delivery, payment",
                    "Written form, witness, notarisation, registration"],
             right: 0,
             why: "A valid contract requires an offer, acceptance " +
                  "of that offer, consideration (something of value " +
                  "exchanged), and capacity (legal ability to enter " +
                  "the agreement). It does not need to be written." }
  }];
})();
