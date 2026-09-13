/* ==========================================================================
   Introduction to Business — Unit 4, International Business. Sections 4.1
   to 4.5.

   Written from the EHS course text the same way as Media Arts Units 5 and 6:
   curated rather than copied. Every definition a section tests on is here,
   every idea the checks need is here, and the padding around them is not.
   The source runs long — 4.3 and 4.5 are each longer than a whole Media Arts
   unit — so each section is cut to one idea per heading, with a picture or a
   list wherever the text was a wall of prose.

   ------------------------------------------------------------ Corrections

   The source is wrong, or out of date, in several places. Each correction is
   marked in the reader with a note rather than silently rewritten, so a
   teacher comparing against the textbook can see what changed and why.

     4.1  "If a party has no absolute advantage in anything, no trade will
          occur." That is only what absolute advantage predicts. Comparative
          advantage shows trade still pays, and the reader teaches it that way.
     4.2  Hofstede's indulgence is described as "frugal (or spendthrift)
          habits" and uncertainty avoidance as how common risk-taking is. The
          first is about freely enjoying life, the second about comfort with
          the unknown. The chart's numbers are invented examples.
     4.3  WTO membership is given as 157 (2012). It is 166; Comoros and
          Timor-Leste joined in 2024.
     4.3  The euro area is given as seventeen countries. Latvia, Lithuania,
          Croatia and Bulgaria have joined since: 21, as of 1 January 2026.
     4.3  Jim Yong Kim is named as World Bank president. He left in 2019;
          Ajay Banga has led the Bank since June 2023.
     4.3  IMF membership is given as 188. Liechtenstein became the 191st
          member in October 2024. "Each member's basic votes equal 5.502% of
          the total" is garbled: basic votes together make up 5.502%, shared
          equally.
     4.3  The Ex-Im Bank is said to have been last chartered in 2006. Congress
          renewed it in 2019, through 31 December 2026.
     4.4  Forex turnover is given as $5.3 trillion a day (2013). The BIS
          measured $9.6 trillion in April 2025.
     4.4  Fixed rates under Bretton Woods are said to have lasted "until
          1967". The system held until the early 1970s.
     4.5  Offshoring is "also known as outsourcing". They are separate: who
          does the work, and where. A diagram shows all four combinations.
     4.5  Joint-venture partners are "equally invested". Ownership is shared
          but seldom equal, and several of the named examples have ended.

   Not carried over: a 4.1 caption calling EFTA the "European Free Trade
   Agreement" (it is an Association, and the image is not used), and dated
   figures such as APEC's count of free trade agreements under negotiation.

   ------------------------------------------------------------------ Checks

   One per section, from the course's own Check Your Understanding. Where the
   course asks two, the one that tests an idea is kept. Dropped: "Trade
   barriers protect domestic industry and jobs" (4.2, true but a half-truth
   the section spends a page qualifying), "The International Development
   Association has ___ members" (4.3, a number that changes as countries
   join, and not worth a student's memory), and "Export is derived from the
   concept of shipping goods out of the port" (4.5, a word origin).

   ------------------------------------------------------------------ Video

   The course has a video for each section. None is wired up, for the reason
   given in unit6.js: the files are not here, and a player that promises a
   lesson and plays nothing is not shipped. Add a file to learn/media/ and a
   `video:` line to the section, and the reader probes for it.

   ----------------------------------------------------------------- Images

   Photographs and maps are from Wikimedia Commons, each checked at its source
   for licence and author, and credited beside the figure. The Seattle march
   is cropped: the full frame includes a protest sign with a profanity on it.
   Diagrams are drawn for OEdu as SVG, so every number in them is one the
   text states.
   ========================================================================== */
window.OPLO_BIZ4 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  var D = function (t, d) { return { k: "def", t: t, d: d }; };
  var Q = function (t, s) { return { k: "quote", t: t, s: s }; };
  var N = function (t) { return { k: "note", t: t }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };
  var S = function (n, d) { return { k: "stat", n: n, d: d }; };
  // A figure: images with real dimensions and alt text, a caption, and the
  // credit its licence asks for. See figureBlock in app.js.
  var F = function (o) {
    return { k: "fig", imgs: o.imgs, cap: o.cap, credits: o.credits,
             cols: o.cols || null, natural: !!o.natural,
             diagram: !!o.diagram, size: o.size || null };
  };

  var M = "media/biz4/";
  var OEDU = [{ what: "Diagram", by: "OEdu" }];
  function commons(file) {
    return "https://commons.wikimedia.org/wiki/File:" + file;
  }
  var BYSA2 = "https://creativecommons.org/licenses/by-sa/2.0/";
  var BYSA3 = "https://creativecommons.org/licenses/by-sa/3.0/";
  var BYSA4 = "https://creativecommons.org/licenses/by-sa/4.0/";
  var BY2 = "https://creativecommons.org/licenses/by/2.0/";

  return [{
    n: "4.1", t: "The Drive for International Trade", kicker: "Why countries trade",
    stand: "No country makes everything its people want, and none should try. Trade lets each " +
           "one make what costs it least to make — and buy the rest.",
    mins: 6,
    objectives: ["Differentiate between the theories of competitive advantage and comparative " +
                 "advantage",
                 "Explain the principles of absolute advantage and balance of trade",
                 "Explain the difference between imports and exports"],
    body: [
      H("Exports and imports"),
      P("Two words carry this whole unit. When a business sells something it made at home to a " +
        "buyer in another country, that is an export. When a buyer at home purchases something " +
        "made abroad, that is an import."),
      D("Exports", "Goods and services made in one country and sold to buyers in another. The " +
        "seller is the exporter."),
      D("Imports", "Goods and services bought from another country. The buyer is the importer."),
      P("Every trade is both at once. A car shipped from Japan to Canada is a Japanese export and " +
        "a Canadian import."),
      P("South Africa shows why countries bother. It exports what it has plenty of — gold, " +
        "platinum, diamonds and coal, and farm goods such as wool, sugar and fruit. The money it " +
        "earns pays for things it cannot make as cheaply, such as machinery, computers and " +
        "electronics."),
      F({ imgs: [{ src: M + "4-1-kaohsiung-container-ship.jpg", w: 1400, h: 897,
                   alt: "A blue container ship stacked high with red and white shipping containers, " +
                        "moored beneath tall red-and-white cranes at a port, with more containers " +
                        "piled along the quay and a Maersk Line office on the right." }],
          cap: "The container ship Hyundai Freedom at the Port of Kaohsiung, Taiwan, in 2008. Most " +
               "goods that cross an ocean travel in boxes like these.",
          credits: [{ by: "tommy.lan", byUrl: "https://www.flickr.com/photos/pocketpcian/2892171488/",
                      site: "Wikimedia Commons", siteUrl: commons("Shipping-container_Kaohsiung_Harbour.jpg"),
                      license: "CC BY-SA 2.0", licenseUrl: BYSA2 }] }),
      H("Absolute advantage"),
      D("Absolute advantage", "Being able to produce more of a good than a rival can, using the " +
        "same resources. Adam Smith described it in 1776."),
      P("If a worker in Brazil can grow more coffee in a day than a worker in Canada, Brazil has " +
        "the absolute advantage in coffee. That much is common sense. The interesting question is " +
        "what happens when one country is better at <i>everything</i>."),
      H("Comparative advantage"),
      P("Every choice has an <b>opportunity cost</b>: what you give up to make it. An hour spent " +
        "weaving cloth is an hour not spent making wine."),
      D("Comparative advantage", "Being able to produce a good at a lower opportunity cost than a " +
        "rival — giving up less of everything else to make it."),
      P("The classic example compares England and Portugal, each making cloth and wine."),
      F({ imgs: [{ src: M + "4-1-comparative-advantage.svg", w: 1100, h: 420,
                   alt: "Bars showing the hours of work each country needs for one unit. England: " +
                        "cloth 100 hours, wine 120 hours. Portugal: cloth 90 hours, wine 80 hours. " +
                        "Beside them, what one cloth costs in wine not made: England 100 divided by " +
                        "120 is 0.83 wine, marked cheaper; Portugal 90 divided by 80 is 1.13 wine." }],
          cap: "Portugal is faster at both, yet England should still make the cloth: each cloth costs " +
               "England less wine. When each country makes what costs it least and trades for the " +
               "rest, both end up with more.",
          credits: OEDU, diagram: true }),
      N("<b>A correction to the course text.</b> It says that a country with no absolute advantage " +
        "in anything will not trade. That is only what the older theory predicts. Comparative " +
        "advantage — the idea economists actually use — shows that trade still pays for both sides."),
      H("Competitive advantage"),
      D("Competitive advantage", "An edge that lets a business or a country outperform its " +
        "rivals — skilled people, better technology, cheap energy, a strong brand or a better " +
        "website."),
      P("Michael Porter set out the theory of competitive advantage in 1985. His worry was that " +
        "comparative advantage can leave poorer countries exporting cheap raw materials forever, " +
        "stuck on low wages. Porter argued that countries and companies should instead build " +
        "high-quality goods that sell at high prices, and grow by becoming more productive."),
      L("Where an edge can come from", [
        ["Resources", "High-grade ores, cheap power, good land."],
        ["People", "Highly trained, highly skilled workers."],
        ["Technology", "Robotics and information technology, in the product or in making it."],
        ["The internet", "A strong website reaches customers directly, without a middleman."]
      ]),
      H("Balance of trade"),
      D("Balance of trade", "A country's exports minus its imports over a period, such as a year. " +
        "Also called net exports."),
      F({ imgs: [{ src: M + "4-1-balance-of-trade.svg", w: 1100, h: 330,
                   alt: "Two examples side by side. Trade surplus: exports 120 billion dollars, " +
                        "imports 90 billion, so 120 minus 90 is plus 30 billion. Trade deficit: " +
                        "exports 80 billion, imports 110 billion, so 80 minus 110 is minus 30 " +
                        "billion." }],
          cap: "Sell more abroad than you buy and the balance is positive, a trade surplus. Buy more " +
               "than you sell and it is negative, a trade deficit.",
          credits: OEDU, diagram: true }),
      Q("The whole section in one line.", "Make what costs you least to make, and trade for the rest.")
    ],
    check: { q: "Michael Porter proposed the theory of competitive advantage in ___.",
             opts: ["1982", "1990", "1985"], right: 2,
             why: "1985, in his book Competitive Advantage. His Competitive Advantage of Nations " +
                  "followed in 1990, which is why 1990 is the tempting wrong answer." }
  }, {
    n: "4.2", t: "International Trade Barriers", kicker: "What gets in the way",
    stand: "A government that wants less of something traded makes it harder or dearer to trade. " +
           "Whether that protects a country or costs it is one of the oldest arguments in economics.",
    mins: 9,
    objectives: ["Explain the different types of trade barriers and their economic effect",
                 "Explain how ethical, cultural and technical differences act as barriers",
                 "Argue for and against trade barriers"],
    body: [
      P("Most trade barriers work the same way. They add a cost to trade, and the cost raises the " +
        "price of whatever is traded."),
      D("Trade barrier", "A government restriction that makes trade across borders harder or more " +
        "expensive."),
      H("The main kinds"),
      D("Tariff", "A tax on imported goods. It raises their price, so goods made at home can " +
        "compete."),
      F({ imgs: [{ src: M + "4-2-tariff-price.svg", w: 1100, h: 320,
                   alt: "Three price bars for one shirt. Imported with no tariff: 10 dollars. " +
                        "Imported with a 30 percent tariff: 13 dollars, the extra 3 dollars shaded " +
                        "as tariff. Made at home: 12 dollars." }],
          cap: "Before the tariff, the import is the cheapest shirt in the shop. After it, the " +
               "home-made one is.",
          credits: OEDU, diagram: true }),
      D("Import quota", "A limit on how much of a good may be imported in a given period."),
      D("Embargo", "A ban on trade with a particular country, or in a particular good."),
      L("Other barriers", [
        ["Import and export licences", "Government permission is needed before goods can cross."],
        ["Subsidies", "Government money that helps home producers undercut foreign ones."],
        ["Voluntary export restraints", "An exporting country agrees to send less of a good."],
        ["Local content rules", "A set share of a product has to be made in the country."],
        ["Currency devaluation", "A cheaper home currency makes exports cheaper and imports dearer."]
      ]),
      P("When two or more countries keep raising barriers against each other, the result is a " +
        "<b>trade war</b>."),
      F({ imgs: [{ src: M + "4-2-singapore-container-terminal.jpg", w: 1400, h: 933,
                   alt: "View from a skyscraper over green parkland and roads toward a harbour, " +
                        "where rows of tall container cranes line the water and a car-carrier ship " +
                        "is docked. Glass office towers frame the left and right edges." }],
          cap: "Singapore has almost no farmland and imports most of its food, so its port is how " +
               "the country eats. Container cranes at Tanjong Pagar Terminal, seen past the " +
               "financial district in 2019.",
          credits: [{ by: "Dietmar Rabich", byUrl: commons("Singapore_(SG),_Tanjong_Pagar_Terminal_--_2019_--_4728.jpg"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Singapore_(SG),_Tanjong_Pagar_Terminal_--_2019_--_4728.jpg"),
                      license: "CC BY-SA 4.0", licenseUrl: BYSA4 }] }),
      H("Ethical barriers"),
      P("Trade raises hard questions about who gains and who loses. Agreements such as the UN " +
        "Global Compact ask businesses and governments to trade responsibly, but inequality and " +
        "human-rights abuses remain real problems."),
      P("Critics argue that open markets reward the people who own capital most, while workers in " +
        "particular industries carry the cost of adjusting. The <b>anti-globalization " +
        "movement</b> protests against the IMF, the World Bank, the WTO and free-trade deals for " +
        "exactly that reason."),
      F({ imgs: [{ src: M + "4-2-seattle-wto-march-1999.jpg", w: 1200, h: 874,
                   alt: "A dense crowd of marchers fills a city street between shops. Protesters " +
                        "hold signs reading \"WTO: fix it or nix it\" and \"WTO hurts forests\", " +
                        "and a giant red puppet figure rises above the crowd." }],
          cap: "Marchers in Seattle on 29 November 1999, the day before the WTO's meeting opened. " +
               "Close to fifty thousand people protested that week and disrupted the talks.",
          credits: [{ what: "Photo, cropped", by: "Carwil", byUrl: commons("WTO_Protests-Seattle-Marchers-29Nov1999.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("WTO_Protests-Seattle-Marchers-29Nov1999.jpg"),
                      license: "CC BY-SA 4.0", licenseUrl: BYSA4 }] }),
      H("Cultural barriers"),
      P("Doing business abroad is harder than doing it at home, especially at the start. A company " +
        "has to learn new customers, new suppliers and new rules — often in a new language."),
      L("The hardest part of exporting, according to Texas farm exporters", [
        ["Knowing the market", "Too little information about which foreign markets would pay."],
        ["Getting in", "Entering a market, and promoting and distributing the product there."],
        ["Red tape", "The paperwork and complexity of an export deal."]
      ]),
      D("Cultural dimensions", "Geert Hofstede's six scores for comparing cultures: how each treats " +
        "authority, the individual and the group, uncertainty, competition, the long term, and " +
        "enjoyment."),
      F({ imgs: [{ src: M + "4-2-hofstede-bars.svg", w: 1100, h: 520,
                   alt: "Paired bars from 0 to 100 for Country A and Country B on six dimensions. " +
                        "Power distance: A 20, B 60. Individualism: A 70, B 25. Uncertainty " +
                        "avoidance: A 30, B 50. Masculinity: A 40, B 75. Long-term orientation: A 35, " +
                        "B 65. Indulgence: A 25, B 55." }],
          cap: "The course's example scores for two made-up countries. Where the bars are far apart, " +
               "expect business to be done differently.",
          credits: OEDU, diagram: true }),
      L("What each dimension measures", [
        ["Power distance", "How much people accept that power is unequal. High means rigid lines of " +
         "authority."],
        ["Individualism", "Whether people look after themselves first, or the group first."],
        ["Uncertainty avoidance", "How uneasy people are with the unknown. High means a liking for " +
         "rules, and less appetite for risk."],
        ["Masculinity", "Whether a culture prizes competition and winning, or cooperation and " +
         "quality of life."],
        ["Long-term orientation", "Whether people plan for the distant future or the near one."],
        ["Indulgence", "How freely people act on the wish to enjoy life, rather than holding back."]
      ]),
      P("Reading the chart: Country A scores 20 on power distance and Country B scores 60. So a " +
        "manager from Country A working in Country B should expect stricter lines of authority, " +
        "and act accordingly."),
      N("<b>A correction to the course text.</b> It calls indulgence the “frugal (or spendthrift) " +
        "habits” of a culture, and uncertainty avoidance how common risk-taking is. Indulgence is " +
        "about how freely people enjoy life, not about spending; uncertainty avoidance is about " +
        "comfort with the unknown, which only partly overlaps with risk."),
      H("Technical barriers"),
      P("As tariffs have fallen, product standards have become a bigger barrier. Testing, " +
        "certification and technical rules protect health, safety and the environment. But when " +
        "they are outdated, unfair or needlessly complicated, they shut foreign sellers out — and " +
        "small businesses, with no staff to work through them, are hit hardest. The WTO calls " +
        "these <b>technical barriers to trade</b>."),
      F({ imgs: [{ src: M + "4-2-wto-members-map.png", w: 1400, h: 711,
                   alt: "World map. Almost every country is green, meaning a WTO member. European " +
                        "Union countries are blue. Observers in yellow include Algeria, Libya, " +
                        "Sudan, Ethiopia, Iran, Iraq and Belarus. Non-members in red include North " +
                        "Korea and Eritrea." }],
          cap: "WTO members in green, and in blue where the EU also represents them; observers in " +
               "yellow; non-members in red. The map shows 2020 — Comoros and Timor-Leste have joined " +
               "since.",
          credits: [{ by: "Danlaycock, from a map by Happenstance and others",
                      byUrl: commons("WTO_members_and_observers.svg"),
                      site: "Wikimedia Commons", siteUrl: commons("WTO_members_and_observers.svg"),
                      license: "Public domain" }], diagram: true }),
      H("The argument for barriers"),
      L("Why a government might want them", [
        ["Jobs and wages", "Cheap imports can cost jobs and hold down pay in the industries they " +
         "compete with."],
        ["National security", "Some industries may be too important to leave to foreign suppliers."],
        ["Dangerous exports", "“Dual-use” goods could help another country's military, so selling " +
         "them abroad is controlled."]
      ]),
      H("The argument against"),
      P("Most economists think barriers do more harm than good. Trade destroys some jobs and " +
        "creates others, and over time it does not cut the total. Barriers push a country's " +
        "workers and money into protected industries that are less efficient, so shoppers pay " +
        "more and choose from less."),
      P("Barriers fall hardest on poorer countries. Rich countries tax the farm and factory goods " +
        "developing countries are best at making, and subsidise their own farmers — who " +
        "overproduce and dump the surplus on world markets, pushing down the prices poor farmers " +
        "get."),
      Q("The economists' answer, in short.", "Help the people trade hurts to adjust, rather than " +
        "block the trade that makes the whole country better off.")
    ],
    check: { q: "True or false: Economists generally disagree that trade barriers are harmful and " +
                "reduce overall economic efficiency.",
             opts: ["True", "False"], right: 1,
             why: "False. Most economists agree that barriers are harmful: they raise prices, cut " +
                  "choice and push resources into less efficient industries." }
  }, {
    n: "4.3", t: "International Trade Agreements and Organizations", kicker: "The rule-makers",
    stand: "Since the Second World War, countries have built organisations to write the rules of " +
           "trade and to lend money when things go wrong. Nine names, and a timeline to hang them on.",
    mins: 11,
    objectives: ["Outline the history of GATT and the World Trade Organization",
                 "Discuss the establishment of the European Union and the euro",
                 "Outline NAFTA, the agreement that replaced it, and APEC",
                 "Explain the roles of the World Bank, the IMF and the Export-Import Bank"],
    body: [
      F({ imgs: [{ src: M + "4-3-timeline.svg", w: 1100, h: 400,
                   alt: "A timeline from 1940 to 2030. 1944: IMF and World Bank. 1947: GATT. 1957: " +
                        "EEC. 1989: APEC. 1993: EEC becomes EU. 1994: NAFTA. 1995: WTO replaces GATT. " +
                        "1999: the euro. 2020: USMCA replaces NAFTA. Colours group them as world " +
                        "trade rules, regional trade blocs, and money and lending." }],
          cap: "Everything in this section, in order. Two of them replaced older ones: the WTO took " +
               "over from GATT, and USMCA from NAFTA.",
          credits: OEDU, diagram: true }),
      H("GATT, and the WTO that replaced it"),
      P("The <b>General Agreement on Tariffs and Trade</b>, or GATT, was signed in 1947 to cut " +
        "tariffs and other barriers. Over eight rounds of talks, its members traded tariff cuts " +
        "with one another."),
      P("The last round, finished in 1994, went further and created a permanent organisation to " +
        "run the rules. On 1 January 1995, GATT was replaced by the World Trade Organization. " +
        "GATT's rules still live on inside it."),
      D("World Trade Organization", "The WTO: sets the rules of trade between its members and " +
        "settles their disputes. It replaced GATT in 1995."),
      S("166", "Members of the WTO. The newest, Comoros and Timor-Leste, joined in 2024."),
      N("<b>An update to the course text.</b> It gives 157 members, a figure from 2012."),
      H("The European Union"),
      D("European Union", "An economic and political union of 27 European countries. Laws that " +
        "apply in every member make one single market, where people, goods, services and money " +
        "move freely."),
      F({ imgs: [{ src: M + "4-3-eu-member-states.png", w: 960, h: 889,
                   alt: "Map of Europe with the 27 EU member states shaded green and labelled, from " +
                        "Portugal, Spain and Ireland in the west to Finland, Romania, Bulgaria and " +
                        "Cyprus in the east. The United Kingdom, Norway and Switzerland are left " +
                        "white." }],
          cap: "The 27 members of the European Union since the United Kingdom left in 2020.",
          credits: [{ by: "Ssolbergj and Hogweard", byUrl: commons("Member_States_of_the_European_Union_2020_(polar_stereographic_projection)_EN.svg"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Member_States_of_the_European_Union_2020_(polar_stereographic_projection)_EN.svg"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 }], diagram: true, size: "medium" }),
      P("The EU runs through shared institutions — among them the European Commission, the " +
        "Council, the Court of Justice and the European Central Bank — and a European Parliament " +
        "its citizens elect every five years. Inside the Schengen Area, which also includes a few " +
        "non-EU countries, there are no passport checks at the borders."),
      P("The United Kingdom left the EU in 2020, after years of argument over immigration, " +
        "national independence and the economy."),
      H("The euro"),
      P("A single European currency became an official goal in 1969. The euro launched in 1999 in " +
        "eleven countries, at first only for banks and accounts; notes and coins followed on " +
        "1 January 2002."),
      P("One currency makes trade easier: no changing money, no exchange-rate risk between " +
        "members, and prices anyone can compare. The <b>European Central Bank</b> sets interest " +
        "rates for the whole euro area, with the aim of keeping prices stable."),
      F({ imgs: [{ src: M + "4-3-euro-notes-coins.jpg", w: 1000, h: 667,
                   alt: "Euro banknotes of 5, 10, 20, 50, 100 and 200 euros spread out, with " +
                        "euro coins from 10 cents to 2 euros scattered on top." }],
          cap: "Euro notes look the same everywhere. Coins share one side, and each country designs " +
               "the other.",
          credits: [{ by: "Avij", byUrl: commons("Euro_coins_and_banknotes_(cropped).jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Euro_coins_and_banknotes_(cropped).jpg"),
                      license: "Public domain" }] }),
      N("<b>A correction to the course text.</b> It says seventeen countries use the euro, the " +
        "newest being Estonia in 2011. Latvia, Lithuania, Croatia and Bulgaria have joined since, " +
        "so 21 do — Bulgaria most recently, on 1 January 2026. Six EU members still keep their " +
        "own currencies."),
      H("NAFTA, and USMCA"),
      P("The <b>North American Free Trade Agreement</b> between the United States, Canada and " +
        "Mexico came into force on 1 January 1994. It removed tariffs on more than half of " +
        "Mexico's exports to the US straight away and phased out most of the rest, let farm goods " +
        "such as eggs, corn and meat cross borders tariff-free, and protected intellectual " +
        "property."),
      D("USMCA", "The United States–Mexico–Canada Agreement, which replaced NAFTA in 2020 and keeps " +
        "most trade between the three countries tariff-free."),
      F({ imgs: [{ src: M + "4-3-usmca-globe.png", w: 800, h: 800,
                   alt: "A globe centred on North America with Canada, the United States and Mexico " +
                        "shaded red." }],
          cap: "The three USMCA countries.",
          credits: [{ by: "Addicted04", byUrl: commons("USMCA_on_the_globe_(North_America_centered).svg"),
                      site: "Wikimedia Commons", siteUrl: commons("USMCA_on_the_globe_(North_America_centered).svg"),
                      license: "CC0" }], diagram: true, size: "small" }),
      H("APEC"),
      P("<b>Asia-Pacific Economic Cooperation</b> is a forum set up in 1989 by economies on both " +
        "sides of the Pacific. Its 21 members — from Australia, China and Japan to Russia, Canada, " +
        "Mexico, Peru and Chile — work toward free trade and investment across the region. In 1994 " +
        "its leaders set the <b>Bogor Goals</b>: free and open trade by 2010 for the richer members " +
        "and by 2020 for developing ones."),
      F({ imgs: [{ src: M + "4-3-apec-members.png", w: 1400, h: 711,
                   alt: "World map centred on the Pacific Ocean. The APEC members are green: " +
                        "Russia, China, Japan, South Korea, Southeast Asia, Australia, New Zealand " +
                        "and Papua New Guinea on one side; Canada, the United States, Mexico, Peru " +
                        "and Chile on the other." }],
          cap: "APEC's members ring the Pacific Ocean.",
          credits: [{ by: "Cflm001", byUrl: commons("Asia-Pacific_Economic_Cooperation_nations.svg"),
                      site: "Wikimedia Commons", siteUrl: commons("Asia-Pacific_Economic_Cooperation_nations.svg"),
                      license: "Public domain" }], diagram: true }),
      L("APEC's three areas of work", [
        ["Trade and investment", "Opening markets across the region."],
        ["Business facilitation", "Making it simpler to do business across borders."],
        ["Economic and technical cooperation", "Sharing skills and know-how."]
      ]),
      H("The World Bank"),
      D("World Bank", "An international lender that funds projects in developing countries, with " +
        "the goal of reducing poverty."),
      P("The World Bank is two institutions: the International Bank for Reconstruction and " +
        "Development, and the International Development Association, which lends to the poorest " +
        "countries on much easier terms. For each of those countries, the government and the Bank " +
        "agree a plan built around reducing poverty, and the Bank's lending follows the plan."),
      P("Its president has traditionally been an American, nominated by the United States, its " +
        "largest shareholder. Since June 2023 that has been Ajay Banga."),
      N("<b>A correction to the course text.</b> It names Jim Yong Kim as president. He stepped " +
        "down in 2019."),
      H("The International Monetary Fund"),
      D("International Monetary Fund", "The IMF: works for stable exchange rates and a steady " +
        "world financial system, and lends to member countries that cannot pay their " +
        "international bills."),
      P("The IMF was agreed at the Bretton Woods conference in 1944 and began work at the end of " +
        "1945. Members pay into a shared pool according to a <b>quota</b>, set roughly by the size " +
        "of their economy, and a member that runs short can borrow from it for a while. The IMF " +
        "also keeps watch on every member's economy — it calls this <b>surveillance</b> — and " +
        "offers advice and technical help."),
      S("191", "Members of the IMF, since Liechtenstein joined in October 2024."),
      P("IMF loans need no collateral. Instead they come with <b>conditions</b>: the borrowing " +
        "government must change the policies behind its problems, or the money stops. This is the " +
        "most controversial thing the IMF does, because the changes can be painful."),
      P("Voting follows the quotas, so the biggest economies have the most say. A block of basic " +
        "votes — 5.502% of the total, shared equally by every member — gives small countries a " +
        "little more weight."),
      N("<b>A correction to the course text.</b> It gives 188 members, and says <i>each</i> " +
        "member's basic votes equal 5.502% of the total. It is all the basic votes together."),
      F({ imgs: [{ src: M + "4-3-world-bank-hq.jpg", w: 1000, h: 809,
                   alt: "A tall white office building and a glass-fronted block beside it on a " +
                        "sunny Washington street corner, with people crossing the road." },
                 { src: M + "4-3-imf-hq.jpg", w: 1000, h: 790,
                   alt: "A large, square, pale stone office building with deep-set rows of " +
                        "windows, on a street corner under a blue sky." }],
          cap: "Neighbours in Washington, DC: the World Bank (left) and the IMF (right). Both were " +
               "agreed at Bretton Woods in 1944.",
          credits: [{ what: "World Bank", by: "Shiny Things", byUrl: "https://www.flickr.com/photos/shinythings/153758214/",
                      site: "Wikimedia Commons", siteUrl: commons("World_Bank_building_at_Washington.jpg"),
                      license: "CC BY 2.0", licenseUrl: BY2 },
                    { what: "IMF", by: "International Monetary Fund", byUrl: commons("IMF_building_HR.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("IMF_building_HR.jpg"),
                      license: "Public domain" }] }),
      H("Common markets"),
      P("A <b>common market</b> is a step toward a single market. Goods trade freely between its " +
        "members, and money and services move fairly freely, though other barriers remain."),
      P("The <b>European Economic Community</b>, or EEC, was one. The Treaty of Rome created it in " +
        "1957 with six members: Belgium, France, West Germany, Italy, Luxembourg and the " +
        "Netherlands. It built a customs union with one shared tariff on goods from outside, and " +
        "common policies for farming, transport and trade."),
      P("Denmark, Ireland and the United Kingdom joined in 1973, then Greece, Spain and Portugal in " +
        "the 1980s. In 1993 the EEC was renamed the European Community and became part of the new " +
        "European Union, which absorbed it completely in 2009."),
      H("The Export-Import Bank of the United States"),
      P("The <b>Ex-Im Bank</b> is the US government's export credit agency, set up in 1934. It helps " +
        "foreign customers buy American goods when private banks will not take the risk — so sales " +
        "happen that otherwise would not, and American jobs are kept. It gives particular help to " +
        "small businesses, and it does not compete with private lenders."),
      L("What it offers", [
        ["Export credit insurance", "Protects US exporters and banks if a foreign buyer does not pay."],
        ["Working capital guarantees", "Backs banks that lend to exporting companies."],
        ["Loans", "Direct loans to foreign buyers of US goods, and loans through lenders abroad."]
      ]),
      N("<b>An update to the course text.</b> It says the bank was last chartered in 2006. Congress " +
        "renewed the charter in 2019, through the end of 2026, and has to renew it again for the " +
        "bank to keep making new deals.")
    ],
    check: { q: "The General Agreement on Tariffs and Trade was replaced by the World Trade " +
                "Organization in ___.",
             opts: ["1990", "1995", "1993"], right: 1,
             why: "1995. The WTO began on 1 January 1995. The talks that created it finished in 1994." }
  }, {
    n: "4.4", t: "The Money of International Business", kicker: "Currencies",
    stand: "Before two countries can trade, one currency has to be turned into another. The rate " +
           "moves every day — and moves every price with it.",
    mins: 7,
    objectives: ["Summarize how exchange rates operate",
                 "Define the balance of trade",
                 "Define the balance of payments"],
    body: [
      H("Exchange rates"),
      D("Exchange rate", "The price of one currency in terms of another — the rate at which one is " +
        "swapped for the other."),
      P("Currencies are bought and sold on the foreign exchange market, or <b>forex</b>. It is the " +
        "biggest market in the world."),
      S("$9.6 trillion", "Traded on the forex market on an average day in April 2025."),
      N("<b>An update to the course text.</b> It gives $5.3 trillion a day, a figure from 2013. The " +
        "$9.6 trillion is from the Bank for International Settlements' 2025 survey."),
      P("The same rate can be written two ways, depending on which currency you count in."),
      F({ imgs: [{ src: M + "4-4-direct-indirect-quote.svg", w: 1100, h: 300,
                   alt: "Two cards for someone in the United States. Direct quote, how many of your " +
                        "dollars one foreign unit costs: 1 euro equals 1.25 dollars, so a 20 euro " +
                        "T-shirt costs 25 dollars. Indirect quote, how much foreign money one dollar " +
                        "buys: 1 dollar equals 0.80 euros." }],
          cap: "A direct quote counts in your own money; an indirect quote counts in the foreign " +
               "money. Each is the other turned upside down.",
          credits: OEDU, diagram: true }),
      H("Changing money when you travel"),
      P("A traveller can buy foreign cash before leaving, at a bank, or on arrival — at the airport, " +
        "a hotel, a money changer or an ATM. Paying by card converts the price automatically. The " +
        "rate and the fees can differ a lot from one place to the next, and from one day to the " +
        "next."),
      F({ imgs: [{ src: M + "4-4-exchange-rates-sign.jpg", w: 800, h: 1241,
                   alt: "An electronic exchange-rate board listing eleven currencies with their " +
                        "flags, including the Australian dollar, Canadian dollar, euro, Japanese yen, " +
                        "Mexican peso and British pound, with red digital figures in two columns, " +
                        "\"We buy at\" and \"We sell at\"." }],
          cap: "A money changer's board in San Francisco, 2022, priced in US dollars. It buys a euro " +
               "for about $0.94 and sells one for about $1.09 — and the gap between the two columns " +
               "is how it makes a living.",
          credits: [{ by: "Dvortygirl", byUrl: commons("Exchange_rates_sign.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Exchange_rates_sign.jpg"),
                      license: "CC BY-SA 4.0", licenseUrl: BYSA4 }], natural: true, size: "medium" }),
      H("Why rates move"),
      P("A <b>currency pair</b> quotes one currency against another. EUR/USD 1.25 means one euro " +
        "buys 1.25 US dollars."),
      L("How a country can run its currency", [
        ["Floating", "Supply and demand in the market set the rate, so it changes all the time."],
        ["Fixed, or pegged", "The government holds the rate at a set level. From 1994 to 2005, " +
         "China held its yuan at about 8.28 to the US dollar."],
        ["Hybrid", "The rate floats, but only within limits the government manages."]
      ]),
      N("<b>A correction to the course text.</b> It says Western Europe kept fixed rates against " +
        "the dollar under the Bretton Woods system until 1967. The system actually held until the " +
        "early 1970s, when it broke down and the major currencies began to float."),
      P("Like anything for sale, a currency gains value when more people want it than there is to " +
        "go round, and loses value when fewer do."),
      L("Two reasons people want a currency", [
        ["To do business", "Transaction demand rises and falls with a country's business activity, " +
         "output and jobs."],
        ["To invest", "Speculative demand follows interest rates. The higher a country's rates, the " +
         "more investors want its currency."]
      ]),
      H("Balance of trade, again"),
      P("You met the <b>balance of trade</b> in 4.1: exports minus imports. Many things push it up " +
        "or down."),
      L("What moves the balance of trade", [
        ["Costs", "Wages, land, taxes and raw materials at home, compared with abroad."],
        ["Exchange rates", "A cheaper currency makes exports cheaper abroad and imports dearer at " +
         "home."],
        ["Barriers", "Tariffs, quotas and product standards, on either side."],
        ["The business cycle", "Countries that grow by exporting see the balance improve in good " +
         "times; countries that grow by spending at home, such as the US, see it worsen."]
      ]),
      P("It is harder to measure than it sounds. Add up every country's official figures and the " +
        "world seems to export about 1% more than it imports — which cannot be true. Smuggling, tax " +
        "evasion and gaps in the data are thought to explain the difference."),
      H("Balance of payments"),
      D("Balance of payments", "The record of every payment between a country and the rest of the " +
        "world over a period — for goods, services, investments and transfers. Money coming in " +
        "counts as a plus, money going out as a minus."),
      F({ imgs: [{ src: M + "4-4-balance-of-payments.svg", w: 1100, h: 420,
                   alt: "Two bars of equal length. Money coming in: exports sold 300 billion dollars " +
                        "plus investment from abroad 150 billion, 450 billion in all. Money going " +
                        "out: imports bought 380 billion plus 70 billion invested abroad, 450 " +
                        "billion in all. A bracket marks the 80 billion trade deficit." }],
          cap: "This country buys $80bn more from the world than it sells. A net $80bn of investment " +
               "flowing in pays for it, and the two totals come out equal.",
          credits: OEDU, diagram: true }),
      P("Once everything is counted, the balance of payments always adds up to zero. A country " +
        "with a trade deficit pays for it some other way: with money its investments abroad earn, " +
        "by selling assets, by borrowing, or from its central bank's reserves."),
      P("The separate parts can still stay out of balance for years. Countries with surpluses " +
        "build up wealth; countries with deficits build up debt.")
    ],
    check: { q: "True or false: A currency may be free-floating, pegged or fixed, or a hybrid.",
             opts: ["True", "False"], right: 0,
             why: "True. Each country chooses how its currency is managed, and all three kinds exist " +
                  "today." }
  }, {
    n: "4.5", t: "Types of International Business", kicker: "Ways in",
    stand: "A business that wants to sell abroad has a ladder of choices, from shipping boxes out " +
           "of its own warehouse to building a factory overseas. Every step up buys more control, " +
           "and costs more.",
    mins: 11,
    objectives: ["Identify the benefits and risks of licensing and franchising",
                 "Explain exporting, importing and contract manufacturing",
                 "Outline joint ventures, and explain why companies outsource and offshore",
                 "Explain multinational firms, foreign direct investment and countertrade"],
    body: [
      P("Every way into a foreign market trades off the same four things: cost, speed, risk, and " +
        "how much control the company keeps."),
      F({ imgs: [{ src: M + "4-5-entry-modes.svg", w: 1100, h: 440,
                   alt: "A staircase of six steps rising left to right: exporting, ship it from " +
                        "home; licensing, rent out your brand or know-how; franchising, a local " +
                        "owner runs your whole system; contract manufacturing, a factory there makes " +
                        "it for you; joint venture, a new company owned together; direct investment, " +
                        "build or buy your own operation. An arrow beneath runs from cheaper, faster " +
                        "and less risky with less control, to more control with more cost and risk." }],
          cap: "The ways in, roughly in order of how deeply a company commits. Treat it as a guide: " +
               "real deals vary.",
          credits: OEDU, diagram: true }),
      H("Exporting and importing"),
      P("<b>Exporting</b> is the simplest way in: make the goods at home and sell them abroad. Large " +
        "shipments pass through customs in both countries. Services count too — when a tourist " +
        "spends money in a country, that country is exporting a service."),
      P("<b>Importing</b> is the other side. A country gains when it can buy a wider range of " +
        "better, cheaper goods than it could make itself. That is comparative advantage at work."),
      H("Licensing"),
      D("Licensing", "Letting a foreign company use your brand, technology or recipe, in return for " +
        "a fee or a share of sales, called a royalty."),
      P("Picture an energy-drink company that cannot sell in Japan because of food import rules. " +
        "It licenses its recipe to a Japanese drinks maker, which sells the drink under a local " +
        "brand and pays back 15% of the revenue."),
      F({ imgs: [{ src: M + "4-5-polski-fiat-508.jpg", w: 622, h: 332,
                   alt: "Black-and-white photograph of a small, boxy 1930s truck with a canvas-covered " +
                        "cab, towing a two-wheeled trailer across bare ground." }],
          cap: "Fiat's 508 was built in Poland in the 1930s by Polski Fiat, under licence. This one " +
               "was fitted out for the Polish army before 1939.",
          credits: [{ by: "Unknown photographer", byUrl: commons("Polski_Fiat_508_518.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Polski_Fiat_508_518.jpg"),
                      license: "Public domain" }], size: "medium" }),
      L("What licensing gives you", [
        ["Speed", "With the right partner, almost instant access to a market."],
        ["Low risk", "The licensee provides the factories and most of the money."],
        ["Local knowledge", "The licensee already knows the language, the laws and the customers."]
      ]),
      L("What it costs you", [
        ["Control", "If the licensee cuts corners, it is your brand that suffers."],
        ["Dependence", "Your success rests on a partner, so choose one with care."],
        ["Returns", "You get a share, not the whole — lower risk, lower reward."]
      ]),
      H("Franchising"),
      D("Franchising", "Letting a local owner run a business under your brand, products and methods, " +
        "in return for fees and a share of the profits."),
      P("The franchisee puts up most of the money and takes most of the risk. In return they get a " +
        "proven brand and a way of running it, often with training and advertising from the " +
        "franchiser. That makes franchising a cheap, quick and naturally local way to expand — " +
        "local owners know local tastes."),
      P("Its weaknesses mirror licensing's: less control over quality, and a share of the profit " +
        "rather than all of it."),
      F({ imgs: [{ src: M + "4-5-starbucks-taipei-airport.jpg", w: 1000, h: 666,
                   alt: "A Starbucks Coffee shop inside an airport terminal, with its green sign and " +
                        "round logo above the counter and customers seated inside." }],
          cap: "Global brands often grow abroad through local partners. Starbucks shops in Taiwan, " +
               "like this one at Taipei's Songshan Airport in 2015, are run by a Taiwanese company " +
               "under an agreement with Starbucks.",
          credits: [{ by: "玄史生", byUrl: commons("Starbucks_Coffee_Taipei_International_Airport_Store_20151107.jpg"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Starbucks_Coffee_Taipei_International_Airport_Store_20151107.jpg"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 }] }),
      H("Contract manufacturing"),
      P("In <b>contract manufacturing</b>, a company hands its design to another company's factory, " +
        "which makes and ships the product for an agreed price. The hiring company usually " +
        "collects quotes from several manufacturers first. It is a form of outsourcing."),
      L("Why companies do it", [
        ["Lower costs", "No factory or equipment to pay for, and lower labour costs."],
        ["Skills", "The manufacturer may have expertise, supplier contacts and quality checks."],
        ["Focus", "The company can concentrate on what it does best, such as design or marketing."],
        ["Scale", "A manufacturer serving many customers buys materials more cheaply."]
      ]),
      L("What can go wrong", [
        ["Control", "The company can suggest how the product is made, but cannot order it."],
        ["Quality", "The manufacturer's standards, and its suppliers', must match the company's."],
        ["Secrets", "Sharing designs and formulas risks intellectual property being stolen."],
        ["Priority", "A small customer can be pushed down the queue when the factory is busy."],
        ["Distance", "Language, culture and long shipping times make problems slower to fix."]
      ]),
      H("Joint ventures"),
      D("Joint venture", "A new business that two or more companies create and own together, sharing " +
        "its control, costs and profits."),
      P("Starting something new is expensive, so a joint venture lets partners share the cost and " +
        "the risk. It works only with a clear plan, and with honesty and good communication between " +
        "the partners. Some are formed for a single project and closed once it is done."),
      P("Sony Ericsson, which made mobile phones from 2001 to 2012, joined a Japanese electronics " +
        "company with a Swedish telecoms company. Penske Truck Leasing is a joint venture still " +
        "running today."),
      N("<b>A correction to the course text.</b> It says both partners are “equally invested.” They " +
        "share ownership, but the shares are often unequal. Several of its examples have also " +
        "ended: Sony bought out Ericsson in 2012, and Dow Corning and MillerCoors were each taken " +
        "over by one partner in 2016."),
      H("Outsourcing and offshoring"),
      D("Outsourcing", "Paying another company to do work your company could do itself, and buying " +
        "it back as a service."),
      D("Offshoring", "Moving a business process — making something, or a service such as " +
        "accounting — to another country."),
      F({ imgs: [{ src: M + "4-5-outsourcing-offshoring.svg", w: 1100, h: 470,
                   alt: "A two-by-two grid. Columns ask who does the work: your own company, or " +
                        "another company, which is outsourcing. Rows ask where: your home country, or " +
                        "another country, which is offshoring. In-house at home: a US bank answers its " +
                        "own calls in Ohio. Outsourcing at home: it pays a call-centre company in " +
                        "Texas. Offshoring, still in-house: it opens its own call centre in the " +
                        "Philippines. Both at once: it pays a company in India to answer its calls." }],
          cap: "Two separate questions. Outsourcing asks who does the work; offshoring asks where.",
          credits: OEDU, diagram: true }),
      N("<b>A correction to the course text.</b> It says offshoring is “also known as outsourcing.” " +
        "People often use the words that way, but they mean different things, and a company can " +
        "do either one without the other."),
      P("Companies outsource and offshore mostly to cut costs: lower wages, lower taxes, cheaper " +
        "energy, fewer regulations. China became a leading place to offshore manufacturing after " +
        "it joined the WTO in 2001, and India a leader in services such as software and customer " +
        "support."),
      F({ imgs: [{ src: M + "4-5-call-centre-pune.jpg", w: 1000, h: 750,
                   alt: "Two modern office buildings with long rows of blue-tinted windows, behind " +
                        "a fenced garden with palm trees and a striped umbrella over a security post." }],
          cap: "Offices of WNS in Pune, India, in 2012. Companies around the world pay firms like it " +
               "to run their customer service, finance and other back-office work.",
          credits: [{ by: "Afrinshaikh", byUrl: commons("WNS_call_center-_vimaannagar.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("WNS_call_center-_vimaannagar.jpg"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 }] }),
      L("Words you will meet alongside them", [
        ["Nearshoring", "Moving work to a cheaper country close by, such as from the US to Mexico."],
        ["Business process outsourcing", "Outsourcing a whole function, such as customer service " +
         "or accounting."],
        ["Insourcing", "The opposite of outsourcing: bringing work back inside the company."]
      ]),
      P("There are costs as well. Jobs can leave the home country, confidential information can " +
        "leak, and training staff far away can cost more than expected."),
      H("Multinational corporations"),
      P("A <b>multinational corporation</b> makes and sells goods or services in more than one " +
        "country. The Dutch East India Company, founded in 1602, is often called the first. Ford, " +
        "with factories and customers around the world, is a modern one."),
      P("Governments compete to attract multinationals, hoping for jobs and tax revenue. Critics " +
        "say multinationals chase the lowest wages and weakest rules. Others answer that they often " +
        "bring in higher standards, and tend to pay local workers 10% to 100% more than local " +
        "employers do."),
      H("Foreign direct investment"),
      D("Foreign direct investment", "Buying or building a business operation in another country — " +
        "a factory, a chain of shops, or a whole company."),
      P("Companies invest abroad for cheaper labour, tax breaks and access to new markets. That is " +
        "different from <b>portfolio investment</b>, which only buys shares or bonds in foreign " +
        "companies without running anything."),
      P("A study of 122 developing countries from 1970 to 2000 found that the ones attracting the " +
        "most foreign investment were those that opened up to trade and signed the most trade " +
        "agreements."),
      H("Countertrade"),
      P("<b>Countertrade</b> means paying for goods with other goods or services instead of money. " +
        "Countries turn to it when they are short of hard currency, or when ordinary trade is not " +
        "possible."),
      L("Five kinds of countertrade", [
        ["Barter", "A straight swap of goods or services, with no money at all."],
        ["Switch trading", "A company sells its obligation to buy goods in a country to another " +
         "company."],
        ["Counter purchase", "A seller promises to buy a product from its customer's country later."],
        ["Buyback", "A company builds a plant abroad and takes part of its output as payment."],
        ["Offset", "A buyer agrees to purchase only if some of the parts are made, or the product " +
         "is assembled, in its own country."]
      ])
    ],
    check: { q: "True or false: A joint venture is a business agreement in which parties agree to " +
                "develop a new entity and new assets by contributing equity.",
             opts: ["True", "False"], right: 0,
             why: "True. Each partner puts in equity — ownership money — and together they control " +
                  "the new business and share what it earns." }
  }];
})();
