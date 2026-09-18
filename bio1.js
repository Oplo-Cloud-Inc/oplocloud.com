/* ==========================================================================
   Biology — Unit 1, Ecology and natural systems. 1.1 to 1.6.

   Written to the NGSS-aligned unit plan the course supplies (HS-LS2-1,
   HS-LS2-2, HS-LS2-6, HS-ESS2-7), the same way Media Arts Units 5 to 7 were
   written: curated rather than copied, and every idea shown as well as said.

   ------------------------------------------------------------ How it reads

   Ecology is taught badly when it is taught as a vocabulary list. Every term
   in this unit is a claim about a mechanism — a niche is not a synonym for
   a habitat, carrying capacity is not a fence, exponential is not a synonym
   for fast — so each section is built round the mechanism and the word is
   given afterwards, with the sentence a reader can say out loud.

   Every definition carries two lines: the one an exam will ask for, and the
   same idea in plain words. See the `def` branch of the reader in app.js.

   -------------------------------------------------------------- Pictures

   Twenty-one diagrams drawn for OEdu, because most of this unit is about
   shapes: a tolerance curve, a J against an S, a ten-year cycle, a crash.
   Every label is set to render at 12.5px or larger in the reading column,
   and every picture opens full screen.

   Twenty-eight photographs from Wikimedia Commons, each checked at its
   source for licence and author and credited beside the figure.

   ------------------------------------------------- Where the numbers come from

   Nothing here is invented. The St Matthew Island censuses are Klein's; the
   Yasuni hectare is Valencia's; the eagle counts are the US Fish and Wildlife
   Service's; the wolf and elk numbers are the National Park Service's. Where
   a figure is drawn to the SHAPE of a record rather than to its values — the
   lynx and hare cycle, Gause's tubes — the caption says so.

   Two places where the popular version of the story is wrong are corrected
   in notes rather than quietly dropped: the lynx-hare cycle is not simply
   predators eating prey (Krebs's experiment needed both food and predators
   to flatten it), and the Yellowstone cascade is real in places and
   contested as a whole. Both are in the unit on purpose: HS-LS2-6 asks a
   student to evaluate claims and evidence, and a claim nobody disputes is
   no practice at all.

   ------------------------------------------------------------------ Checks

   Each section ends with one question written against its own text, and the
   twenty-eight-term study set carries the same ideas at apply and transfer.
   ========================================================================== */
window.OPLO_BIO1 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  /* A definition, and the same thing said plainly. */
  var D = function (t, d, plain, depth) { return { k: "def", t: t, d: d, p: plain || null, depth: depth || null }; };
  var Q = function (t, s) { return { k: "quote", t: t, s: s }; };
  var N = function (t) { return { k: "note", t: t }; };
  var MCON = function (m, i, d) { return { k: "mcon", t: m, i: i, d: d }; };
  var FBK = function (t, d) { return { k: "fbk", t: t, d: d }; };
  var CER = function (t, items) { return { k: "cer", t: t, items: items }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };
  var R = function (items) { return { k: "refs", items: items }; };
  var F = function (o) {
    return { k: "fig", imgs: o.imgs, cap: o.cap, credits: o.credits,
             cols: o.cols || null, natural: !!o.natural,
             diagram: !!o.diagram, size: o.size || null };
  };

  var M = "media/bio1/";
  var OEDU = [{ what: "Diagram", by: "OEdu" }];
  function commons(file) { return "https://commons.wikimedia.org/wiki/File:" + file; }
  var BY2 = "https://creativecommons.org/licenses/by/2.0/";
  var BY2DE = "https://creativecommons.org/licenses/by/2.0/de/deed.en";
  var BY25 = "https://creativecommons.org/licenses/by/2.5/";
  var BY3 = "https://creativecommons.org/licenses/by/3.0/";
  var BYSA2 = "https://creativecommons.org/licenses/by-sa/2.0/";
  var BYSA25 = "https://creativecommons.org/licenses/by-sa/2.5/";
  var BYSA3 = "https://creativecommons.org/licenses/by-sa/3.0/";
  var BYSA4 = "https://creativecommons.org/licenses/by-sa/4.0/";

  /* One photograph, credited. `f` is the Commons file name. */
  function shot(src, w, h, alt, label) {
    var o = { src: M + src, w: w, h: h, alt: alt };
    if (label) o.label = label;
    return o;
  }
  function credit(by, file, license, licenseUrl, what) {
    var c = { by: by, byUrl: commons(file), site: "Wikimedia Commons",
              siteUrl: commons(file), license: license };
    if (licenseUrl) c.licenseUrl = licenseUrl;
    if (what) c.what = what;
    return c;
  }

  return [{
    n: "1.1", t: "Levels of a Living World", kicker: "How nature is organised",
    stand: "Nothing in nature happens on its own. A fish is part of a population, which is part of " +
           "a community, which sits in an ecosystem made as much of water and rock as of living " +
           "things. Learn the ladder once and the rest of ecology has somewhere to stand.",
    mins: 10,
    objectives: ["Describe Earth's four spheres and how they interact",
                 "Tell biotic factors from abiotic factors",
                 "Explain how life is organised from populations up to the biosphere",
                 "Classify land and water biomes by the abiotic factors that shape them"],
    body: [
      H("Two kinds of thing, everywhere you look"),
      P("Stand anywhere on Earth and everything around you falls into one of two piles. Some of it " +
        "is alive, or was. The rest never was. Ecology is largely the study of how those two piles " +
        "act on each other, so the first job is being able to tell them apart without thinking."),
      D("Biotic factor", "Any living part of an environment, or anything produced by something " +
        "living &mdash; plants, animals, fungi, bacteria, and the leaves, shells and droppings they " +
        "leave behind.",
        "The alive stuff. Plants, animals, mould, germs &mdash; and things they made, like a fallen " +
        "leaf or an empty shell."),
      D("Abiotic factor", "Any non-living part of an environment: temperature, sunlight, water, " +
        "wind, salt, soil chemistry, rock, pH, oxygen.",
        "The not-alive stuff. Heat, light, water, air, salt, rock."),
      N("<b>The one that catches people out.</b> A dead log is <i>biotic</i>. So is a feather, a " +
        "bone and the compost in a garden. “Biotic” does not mean “currently breathing” " +
        "&mdash; it means it came from something that was. Sand is abiotic; a beach made of ground-up " +
        "coral skeletons is biotic in origin, which is exactly the kind of case worth arguing about " +
        "in class."),
      H("Four spheres, and the life running through them"),
      P("Earth is usually described in four parts. Three of them are places; the fourth is not."),
      L("The four spheres", [
        ["Atmosphere", "The envelope of gases around the planet. Supplies the carbon dioxide plants " +
         "build with and the oxygen almost everything else breathes, and moves heat and water around."],
        ["Hydrosphere", "All of Earth's water &mdash; ocean, lakes, rivers, groundwater, ice and the " +
         "vapour in the air. About 97% of it is salt water."],
        ["Geosphere", "The rock, sediment and soil, from the loose crumb under your feet to the core."],
        ["Biosphere", "Every living thing on Earth. Not a layer of its own: it is threaded through " +
         "the other three."]
      ]),
      F({ imgs: [{ src: M + "1-1-spheres.svg", w: 700, h: 482,
                   alt: "One scene showing air above, a hill of rock and soil on the left and the " +
                        "sea filling the basin on the right. Living things are drawn inside all " +
                        "three at once: birds in the air, a tree rooted in the rock, kelp and fish " +
                        "in the sea, an animal burrowing underground. Three cards beneath the scene " +
                        "name interactions between the spheres." }],
          cap: "The biosphere is not a fourth layer stacked on the others &mdash; it runs through " +
               "them. A tree is a geosphere organism (roots in soil), an atmosphere organism " +
               "(leaves trading gases) and a hydrosphere organism (water pulled from ground to sky) " +
               "at the same time.",
          credits: OEDU, diagram: true }),
      P("Because the spheres overlap, a change in one is felt in the others. Plants pull carbon " +
        "dioxide out of the atmosphere and lock it into wood and soil; roots split rock into soil; " +
        "rivers carry the minerals from that rock into the sea, where they feed the plankton that " +
        "half the world's oxygen comes from. This is what the standards mean by the " +
        "<i>co-evolution</i> of Earth and its life: the planet shaped life, and life has been " +
        "reshaping the planet for three billion years."),
      H("Zooming out, one step at a time"),
      P("The levels below are not different subjects. Each is the one before it with something " +
        "added, and knowing which level a question is about is most of knowing how to answer it."),
      F({ imgs: [{ src: M + "1-1-levels.svg", w: 700, h: 594,
                   alt: "Six stacked panels showing the levels of biological organisation. One fish " +
                        "is an organism. Several of the same fish are a population. Fish, crab and " +
                        "seaweed together are a community. The community plus water, light and rock " +
                        "is an ecosystem. The same kind of ecosystem repeated worldwide is a biome. " +
                        "A globe with a band of life is the biosphere." }],
          cap: "Six levels, and each one contains the last. Nothing new is invented as you climb; " +
               "more is included.",
          credits: OEDU, diagram: true }),
      D("Population", "All the individuals of <b>one species</b> living in the same area at the same " +
        "time, able to breed with each other.",
        "One kind of living thing, counted in one place. All the grey squirrels in a park &mdash; " +
        "not the squirrels and the pigeons."),
      D("Community", "All the populations of all the different species living together in one area, " +
        "and the interactions between them.",
        "Every kind of living thing in a place, all together."),
      D("Ecosystem", "A community plus the abiotic environment it depends on, treated as one working " +
        "system through which energy flows and matter cycles.",
        "The living things in a place plus the non-living things &mdash; the water, soil, air and " +
        "sunlight &mdash; treated as one machine."),
      D("Biome", "A large group of ecosystems that share a climate and therefore share a " +
        "characteristic kind of life, wherever on Earth they happen to be.",
        "Every place in the world with the same weather and the same general look. All hot deserts " +
        "are one biome, even though they are on different continents.",
        "MORE"),
      D("Biosphere", "The whole of Earth's living matter, in every place where life is found, " +
        "treated as one system.",
        "All life on Earth, everywhere, counted as one thing."),
      N("<b>A mistake worth naming now.</b> “The population of the pond” is not a phrase " +
        "ecology allows. A population is <i>one species</i>. Every species in the pond, together, is " +
        "the <i>community</i>. Half the confusion in this unit comes from sliding between those two."),
      H("What makes a biome a biome"),
      P("Biomes are not named after continents, and they do not follow national borders. Two numbers " +
        "do almost all the work: how warm the place is over a year, and how much rain falls on it. " +
        "Plot those two and the world's biomes sort themselves out."),
      F({ imgs: [{ src: M + "1-1-whittaker.svg", w: 700, h: 500,
                   alt: "A chart with average yearly temperature from minus 15 to 30 degrees Celsius " +
                        "along the bottom and yearly rainfall from 0 to 450 centimetres up the side. " +
                        "Nine biomes fill a roughly triangular area: tundra and boreal forest in the " +
                        "cold corner, grassland, desert, woodland and temperate forest in the middle, " +
                        "tropical seasonal forest and tropical rainforest in the hot, wet corner. The " +
                        "cold and wet corner is empty." }],
          cap: "Robert Whittaker's biome diagram. The empty top-left corner is not a gap in the data: " +
               "cold air physically cannot hold much water, so nowhere on Earth is both freezing and " +
               "soaking.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-1-amazon.jpg", 1100, 709,
                      "Dense green rainforest running to the edge of a wide brown river under a blue " +
                      "sky with tall clouds.", "27°C · 250 cm of rain"),
                 shot("1-1-namib.jpg", 1100, 823,
                      "Enormous orange sand dunes with sharp knife-edge ridges, under a clear sky, " +
                      "with a few pale dead trees at their foot.", "21°C · 2 cm of rain")],
          cap: "Both are hot. One of them gets rain. That single difference is why one holds more " +
               "tree species in a hectare than Europe holds in total, and the other is bare sand.",
          credits: [credit("Andre Deak", "Amazonia.jpg", "CC BY 2.0", BY2, "Amazon"),
                    credit("Winfried Bruenken (Amrum)", "Sossusvlei_sand_dunes.jpg",
                           "CC BY-SA 2.5", BYSA25, "Namib")] }),
      H("The water is a world too"),
      P("Aquatic systems are sorted by different abiotic factors, because temperature and rainfall " +
        "mean little underwater. What matters there is salt, depth, light and flow."),
      L("How aquatic ecosystems are sorted", [
        ["Salt", "Fresh water (lakes, rivers, ponds), salt water (the ocean), or brackish where the " +
         "two mix &mdash; estuaries and mangroves, which are among the most productive places on Earth."],
        ["Depth and light", "Light runs out fast in water. Almost everything that grows does so in " +
         "the top 200 metres."],
        ["Flow", "Standing water (a lake) and running water (a river) hold different life, because " +
         "current decides what can hold on and what gets carried away."],
        ["Bottom", "Rock, sand, mud or coral. What the floor is made of decides what can attach to it."]
      ]),
      F({ imgs: [shot("1-1-kelp-forest.jpg", 1100, 715,
                      "Looking upward through a giant kelp forest: tall brown stipes rising in " +
                      "columns towards bright sunlight at the surface, with fish among them.")],
          cap: "A kelp forest off the Channel Islands. Everything here is set by abiotic factors: " +
               "cold nutrient-rich water, rock for the kelp to anchor to, and enough light reaching " +
               "down for it to grow. Change any one and the forest is a bare seabed.",
          credits: [credit("NOAA Photo Library", "Kelp_forest,_Channel_Islands_NMS.jpg",
                           "Public domain")] }),
      F({ imgs: [shot("1-1-blue-marble.jpg", 1000, 1001,
                      "The Blue Marble photograph of Earth from space, showing Africa, Antarctica " +
                      "under cloud, and the Indian Ocean.")],
          cap: "The biosphere, photographed by the crew of Apollo 17 in 1972. Everything in this " +
               "unit &mdash; every population, every niche, every carrying capacity &mdash; is " +
               "happening inside a film of life a few kilometres thick on this ball.",
          credits: [credit("NASA / Apollo 17 crew", "The_Earth_seen_from_Apollo_17.jpg",
                           "Public domain")], size: "medium" }),
      R([
        { by: "Robert H. Whittaker", year: "1975", title: "Communities and Ecosystems",
          pub: "2nd ed., Macmillan",
          note: "Where the temperature-and-rainfall biome diagram comes from." },
        { by: "NASA Earth Observatory", title: "The Carbon Cycle",
          url: "https://earthobservatory.nasa.gov/features/CarbonCycle",
          note: "How the four spheres trade carbon, with the numbers." },
        { by: "National Geographic Education", title: "Biome",
          url: "https://education.nationalgeographic.org/resource/biome/" }
      ])
    ],
    check: { q: "A pond holds frogs, dragonflies, reeds, algae and bacteria, in water at 14°C over " +
                "a muddy bottom. Which term names the frogs, dragonflies, reeds, algae and bacteria " +
                "together, but leaves out the water, the temperature and the mud?",
             opts: ["The population", "The community", "The ecosystem", "The biome"], right: 1,
             why: "The community is every population of every species in the place. Add the water, " +
                  "the temperature and the mud &mdash; the abiotic factors &mdash; and you have the " +
                  "ecosystem." }
  }, {
    n: "1.2", t: "Where Life Piles Up", kicker: "The distribution of life",
    stand: "Life is not spread evenly. One hectare of Ecuadorian forest holds more tree species than " +
           "all of North America, and a hectare of Siberian tundra holds none. The pattern is not " +
           "random, and three abiotic factors explain most of it.",
    mins: 11,
    objectives: ["Explain the global pattern in species richness and what drives it",
                 "Describe how abiotic factors change with latitude, elevation and depth",
                 "Analyse richness data and predict what abiotic factors would do to it"],
    body: [
      D("Species richness", "The number of <b>different species</b> found in an area. It counts kinds, " +
        "not individuals.",
        "How many different kinds of living thing are in a place."),
      N("<b>Richness is not abundance.</b> A field with ten thousand sheep and nothing else is rich " +
        "in <i>individuals</i> and poor in <i>species</i> &mdash; richness of one. A patch of rainforest " +
        "with one of each of four hundred kinds of tree is the opposite. When data is described as " +
        "“high biodiversity”, check which one is being counted."),
      H("The oldest pattern in ecology"),
      P("Count the species in a strip of ground and then walk towards the equator counting again, and " +
        "the number rises. Do it with trees, birds, ants, frogs, fish or fungi and the curve looks " +
        "much the same. Naturalists noticed this before anybody could explain it, and it has a name: " +
        "the latitudinal diversity gradient."),
      F({ imgs: [{ src: M + "1-2-latitude.svg", w: 700, h: 440,
                   alt: "A curve of tree species found in one hectare of forest against latitude. It " +
                        "starts at about 655 species at the equator, falls steeply, reaches about 25 " +
                        "in temperate forest at 40 degrees and about 3 in boreal forest at 60 " +
                        "degrees, and reaches zero above about 75 degrees. A band beneath the chart " +
                        "labels the tropics, subtropics, temperate and polar zones." }],
          cap: "One hectare at Yasuní in Ecuador holds 655 tree species &mdash; more than the " +
               "United States and Canada together. The same hectare in boreal Canada holds about three.",
          credits: OEDU, diagram: true }),
      L("Why the tropics are so rich", [
        ["Energy", "The equator receives the most direct sunlight all year. More energy means more " +
         "plant growth, which means more to eat, which means more species can make a living."],
        ["Water", "Warm air holds more water, and the band along the equator is where rising air " +
         "dumps it. Warmth without water gives you the Sahara, not the Amazon &mdash; it takes both."],
        ["Time and stability", "Ice sheets scraped the high latitudes repeatedly over the last two " +
         "million years. The tropics were never cleared, so species there have had far longer to " +
         "diverge and far less often been wiped out."]
      ]),
      N("<b>Careful with the obvious answer.</b> “The tropics are richer because they are warmer” " +
        "is not wrong, it is incomplete &mdash; and incomplete in a way that fails on the first " +
        "counter-example. The Sahara is hot. The Atacama is hot. Neither is rich. Warmth is one of at " +
        "least three causes, and any explanation that uses only one will be broken by a desert."),
      F({ imgs: [shot("1-2-coral-reef.jpg", 1100, 825,
                      "A crowded outcrop of corals in many shapes and colours on the Great Barrier " +
                      "Reef, with small fish above it in clear blue water.", "Coral reef · 16°S"),
                 shot("1-2-tundra.jpg", 911, 600,
                      "Flat, treeless Siberian tundra with low brown and green vegetation, pools of " +
                      "standing water and a wide pale sky.", "Tundra · 69°N")],
          cap: "The two ends of the curve. Coral reefs cover under 1% of the sea floor and hold " +
               "around a quarter of all marine species; tundra covers a tenth of the land and holds a " +
               "few hundred plant species in total.",
          credits: [credit("Toby Hudson", "Coral_Outcrop_Flynn_Reef.jpg", "CC BY-SA 3.0", BYSA3, "Reef"),
                    credit("Dr. Andreas Hugentobler", "Tundra_in_Siberia.jpg", "CC BY 2.0 de",
                           BY2DE, "Tundra")] }),
      H("The same rule, tipped on its side"),
      P("Air cools as it rises &mdash; roughly 6.5°C for every thousand metres. So climbing a " +
        "mountain does to the temperature what walking towards the pole does, only far faster. The " +
        "result is that one mountain can hold, stacked on top of each other, the same sequence of " +
        "life zones that a continent holds spread over five thousand kilometres."),
      F({ imgs: [{ src: M + "1-2-elevation.svg", w: 700, h: 476,
                   alt: "On the left, Kilimanjaro in cross-section with its life zones labelled: " +
                        "farmland and rainforest at the base, montane forest, heath and moorland, " +
                        "alpine desert, and ice at the summit at 5,895 metres. On the right, the " +
                        "same sequence laid out by latitude at sea level: temperate forest at 40 " +
                        "degrees north, boreal forest at 55, tundra at 70, polar desert at 78 and " +
                        "ice at 85." }],
          cap: "Climbing 1,000 m does roughly what travelling 1,000 km towards the pole does. This is " +
               "also why warming is dangerous for mountain species: pushed uphill, they eventually " +
               "run out of mountain.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-2-kilimanjaro.jpg", 1200, 803,
                      "Kilimanjaro seen across the dry savanna of Amboseli, its flat summit capped " +
                      "with snow above a band of cloud, with acacia trees in the foreground.")],
          cap: "Kilimanjaro from Amboseli, three degrees south of the equator. The ground at its foot " +
               "is savanna; the ground at its summit is ice. Nothing has changed but height.",
          credits: [credit("Sergey Pesterev", "Kilimanjaro_from_Amboseli.jpg", "CC BY-SA 4.0",
                           BYSA4)] }),
      H("In water, light is the currency"),
      P("Underwater, the factor that decides everything is how far down the sunlight reaches. Water " +
        "absorbs light fast: red is gone within a few metres, and by 200 metres only about 1% of the " +
        "surface light is left. That 1% is the floor for photosynthesis, which makes 200 metres the " +
        "most important line in the ocean."),
      F({ imgs: [{ src: M + "1-2-ocean-light.svg", w: 700, h: 470,
                   alt: "A column of ocean from the surface to 4,000 metres, shading from pale blue " +
                        "to black. The sunlight zone runs to 200 metres and holds almost all ocean " +
                        "life; the twilight zone from 200 to 1,000 metres has light to see by but " +
                        "not to grow by; below 1,000 metres is the midnight zone with no sunlight at " +
                        "all. Depth marks show about 55% of light left at 1 metre, 20% at 10 metres " +
                        "and 1% at 200 metres." }],
          cap: "Everything below 200 metres is eating something that grew above it &mdash; or, at hot " +
               "vents, living on chemistry instead of sunlight, which is the one exception that makes " +
               "the rule worth stating.",
          credits: OEDU, diagram: true }),
      P("This is why reefs are shallow, why the richest fisheries sit where upwelling currents drag " +
        "nutrients back up into the light, and why the deep sea &mdash; by far the largest habitat on " +
        "the planet &mdash; is so sparsely populated. Depth in the ocean does what latitude does on " +
        "land and elevation does on a mountain: it takes the energy away, and life thins out behind it."),
      Q("Ask where the energy comes from and where the water comes from, and you can predict what " +
        "lives somewhere before you have ever been there.",
        "The whole of this section in one sentence"),
      R([
        { by: "R. Valencia and others", year: "2004",
          title: "Tree species distributions and local habitat variation in the Amazon",
          pub: "Journal of Ecology 92(2)",
          note: "The Yasuní hectare: 655 tree species in 10,000 square metres." },
        { by: "Map of Life", title: "Global species distribution maps",
          url: "https://mol.org/",
          note: "Live richness maps for birds, mammals, amphibians and more. Good for the data task." },
        { by: "IUCN", title: "The IUCN Red List of Threatened Species",
          url: "https://www.iucnredlist.org/" },
        { by: "NOAA Ocean Exploration", title: "How far does light travel in the ocean?",
          url: "https://oceanservice.noaa.gov/facts/light_travel.html" }
      ])
    ],
    check: { q: "Two places sit at the same latitude and the same temperature. One is rainforest, the " +
                "other is desert. What does this tell you about explaining species richness?",
             opts: ["Latitude does not affect richness",
                    "Temperature alone is not enough &mdash; water matters too",
                    "Deserts must be colder than they appear",
                    "Species richness cannot be predicted"],
             right: 1,
             why: "Warmth is one cause of high richness, not the only one. Without water, all that " +
                  "energy produces a desert. Energy, water and time each have to be in place." }
  },
  {
    n: "1.3", t: "An Organism's Niche", kicker: "Where a species can live, and where it does",
    stand: "A polar bear could survive an English winter. It does not live in England. The gap " +
           "between what a species could do and what it actually does is one of the most useful " +
           "ideas in biology, and it has two names.",
    mins: 12,
    objectives: ["Identify the abiotic factors that set a species' geographic range",
                 "Explain tolerance range, and the difference between a fundamental and a realised niche",
                 "Tell specialists from generalists by niche breadth and tolerance"],
    body: [
      H("Nothing has a wall around it"),
      P("Ask what temperature a trout can survive and the honest answer is not a pair of numbers. " +
        "Near the middle of its range a trout thrives and breeds. Further out it survives but grows " +
        "slowly and does not spawn. Further out still it dies. Plot the number of individuals " +
        "against the factor and you get a hump, not a box."),
      D("Tolerance range", "The full span of an abiotic factor &mdash; temperature, salinity, pH, " +
        "oxygen &mdash; within which a species can survive. Inside it sits a narrower " +
        "<b>optimal range</b> where the species does well and reproduces.",
        "How much of something a living thing can put up with. Inside that, a smaller sweet spot " +
        "where it actually does well."),
      F({ imgs: [{ src: M + "1-3-tolerance-curve.svg", w: 700, h: 472,
                   alt: "A hump-shaped curve of surviving individuals against temperature, divided " +
                        "into five bands: a zone of intolerance at each end where none survive, a " +
                        "zone of stress inside each of those where a few survive poorly, and an " +
                        "optimal range in the middle where most individuals live. Dashed lines mark " +
                        "the lower and upper limits, and a bar beneath marks the whole tolerance " +
                        "range." }],
          cap: "Surviving and breeding are different questions. A species can still be present at " +
               "the edge of its tolerance range and be quietly failing there &mdash; which is how a " +
               "two-degree shift empties a place of something that is, on paper, still within limits.",
           credits: OEDU, diagram: true }),
      FBK("What kind of factor is temperature?",
        "Temperature is abiotic. So is sunlight, water, salinity, pH and oxygen. The tolerance range is set by these non-living factors; the realised niche is also shaped by living ones."),
      H("Habitat is an address. A niche is a life."),
      P("These two words are constantly swapped, and they do not mean the same thing."),
      D("Habitat", "The physical place where an organism lives.",
        "Where it lives. Its address."),
      D("Niche", "Everything a species needs and everything it does: the range of every abiotic " +
        "factor it can tolerate, the resources it consumes, when and how it is active, what eats it, " +
        "what it competes with, and how it changes the place it lives in.",
        "Its whole way of making a living — not just where it lives, but what it eats, when it " +
        "is awake, who eats it, and who it fights with.",
        "DEEP DIVE"),
      MCON("A niche is just a habitat",
        "Habitat = where. Niche = how the organism lives and what conditions and interactions shape its role.",
        "Two species can share a habitat and hold completely different niches — a woodpecker and an owl live in the same wood, feed on different things, at different hours, in different parts of the same tree."),
      H("What a species could do, and what it gets to do"),
      P("In 1961 Joseph Connell went to a Scottish shore and did something simple: he scraped one " +
        "species of barnacle off the rock and watched what the other one did. What it did was spread " +
        "downwards into space it had never been seen in."),
      D("Fundamental niche", "The full range of conditions and resources a species could use if " +
        "nothing else were in the way — set by the physical world alone.",
        "Everywhere it <b>could</b> live, if nothing was stopping it.",
        "MORE"),
      D("Realised niche", "The part of the fundamental niche a species actually occupies once " +
        "competitors, predators, parasites and disease have had their effect.",
        "Where it <b>actually</b> lives, after everything else has pushed it around.",
        "MORE"),
      F({ imgs: [{ src: M + "1-3-niche-barnacles.svg", w: 700, h: 470,
                   alt: "The same rocky shore drawn twice. On the left, with the larger barnacle " +
                        "Semibalanus removed, Chthamalus occupies the whole shore from the high tide " +
                        "line to the low tide line: its fundamental niche. On the right, with " +
                        "Semibalanus present, Chthamalus is confined to a narrow band on the high " +
                        "shore while Semibalanus holds everything below: its realised niche." }],
          cap: "Connell's result. Nothing about the rock, the tide or the temperature changed between " +
               "the two pictures &mdash; only whether a competitor was present. A niche can shrink " +
               "without the weather moving at all.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-3-barnacles.jpg", 1100, 733,
                      "A dense crust of small pale grey star-shaped barnacles covering a wet rock " +
                      "surface, packed edge to edge.")],
          cap: "<i>Chthamalus stellatus</i>, the barnacle in Connell's upper band. Each animal is " +
               "cemented head-down to the rock for life, which is what makes barnacles such a clean " +
               "test: they cannot walk away from a competitor.",
          credits: [credit("MichaelMaggs", "Chthamalus_stellatus.jpg", "CC BY-SA 3.0", BYSA3)] }),
      H("Wide and thin, or narrow and deep"),
      P("Two species can both be doing well with completely different bets. One gets extremely good " +
        "at a narrow set of conditions; the other stays mediocre at a very wide set."),
      D("Specialist", "A species with a narrow niche: a narrow tolerance range, a small number of " +
        "food sources, and usually a limited geographic range. Highly efficient inside its range and " +
        "highly vulnerable to change.",
        "Very good at one thing, in one kind of place. If that thing goes, it is in trouble."),
      D("Generalist", "A species with a broad niche: wide tolerance ranges, many food sources, and " +
        "usually a wide geographic range. Rarely the best at anything, and hard to get rid of.",
        "Okay at lots of things, in lots of places. Never the best &mdash; but very hard to wipe out."),
      F({ imgs: [{ src: M + "1-3-specialist-generalist.svg", w: 700, h: 444,
                   alt: "Two tolerance curves on the same axes. The specialist's is narrow and tall; " +
                        "the generalist's is wide and low. Cards beneath give the koala as the " +
                        "specialist and the raccoon as the generalist." }],
          cap: "Same area under each curve, spent differently. The specialist puts everything into " +
               "being excellent in one place; the generalist spreads the same budget thin.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-3-koala.jpg", 900, 885,
                      "A koala gripping the trunk of a eucalyptus tree with both forelimbs, looking " +
                      "towards the camera.", "Specialist"),
                 shot("1-3-raccoon.jpg", 900, 675,
                      "A raccoon standing on grass among fallen leaves, looking towards the camera, " +
                      "with the black mask markings across its eyes.", "Generalist")],
          cap: "A koala eats the leaves of a handful of eucalyptus species and almost nothing else " +
               "&mdash; leaves that are poisonous to nearly everything, which is the point. A raccoon " +
               "eats fruit, eggs, frogs and rubbish, and lives in forests, marshes and storm drains.",
          credits: [credit("Diliff", "Koala_climbing_tree.jpg", "CC BY-SA 3.0", BYSA3, "Koala"),
                    credit("Cary Bass-Deschênes", "Procyon_lotor_(Common_raccoon).jpg",
                           "CC BY 3.0", BY3, "Raccoon")] }),
      H("A niche is not fixed"),
      P("Two things move it. The first is the organism's own life: a caterpillar eats leaves and " +
        "cannot fly; the butterfly it becomes drinks nectar and can. Same animal, two niches, and a " +
        "conservation plan that protects one and not the other protects nothing."),
      P("The second is change in the world around it. If the conditions a species tolerates move " +
        "across the map, the species must move with them, adapt, or go. Polar bears hunt seals from " +
        "sea ice; their tolerance for cold has not changed at all, but the ice they need has been " +
        "retreating, so their realised niche shrinks even though their fundamental niche is where it " +
        "always was."),
      F({ imgs: [shot("1-3-polar-bear.jpg", 1100, 733,
                      "A polar bear in mid-leap between two floating slabs of sea ice, with dark " +
                      "cold water between them.")],
          cap: "A polar bear is not limited by its tolerance for cold. It is limited by sea ice, " +
               "because ice is the platform it hunts seals from &mdash; an abiotic factor standing " +
               "between a predator and its food.",
          credits: [credit("Arturo de Frias Marques", "Polar_Bear_AdF.jpg", "CC BY-SA 4.0", BYSA4)] }),
      H("Chasing a niche across a continent"),
      P("Monarch butterflies make the point at the scale of a map. The eastern population breeds " +
        "across the United States and southern Canada, then flies up to 4,000 kilometres to " +
        "overwinter in a few dozen hectares of oyamel fir forest in the mountains of central Mexico. " +
        "Nothing about a monarch changes en route. What changes is where on Earth the conditions it " +
        "needs are &mdash; cool but not freezing in winter, milkweed in summer &mdash; and it follows " +
        "them."),
      F({ imgs: [shot("1-3-monarch-milkweed.jpg", 800, 1199,
                      "An orange and black monarch butterfly feeding at a cluster of pale pink " +
                      "common milkweed flowers.", "Summer · breeding range"),
                 shot("1-3-monarch-cluster.jpg", 800, 1067,
                      "Thousands of monarch butterflies packed together on fir branches in Mexico, " +
                      "covering the branches so densely the wood is hidden.",
                      "Winter · overwintering site")],
          cap: "Two halves of one niche, 4,000 km apart. Milkweed is the only plant monarch " +
               "caterpillars can eat; the Mexican fir forest is cool enough to keep the adults' " +
               "bodies idling without freezing them. Lose either end and the migration has nowhere " +
               "to go.",
          credits: [credit("Lori Nordstrom / USFWS",
                           "Monarch_butterfly_on_common_milkweed_(48372506736).jpg",
                           "Public domain", null, "Milkweed"),
                    credit("Lori Nordstrom / USFWS",
                           "Monarch_butterflies_clustering_on_trees_in_Mexico_(33809229238).jpg",
                           "Public domain", null, "Cluster")] }),
      R([
        { by: "J. H. Connell", year: "1961",
          title: "The influence of interspecific competition and other factors on the distribution of " +
                 "the barnacle Chthamalus stellatus",
          pub: "Ecology 42(4)",
          note: "The removal experiment that gave ecology the fundamental and realised niche." },
        { by: "G. E. Hutchinson", year: "1957", title: "Concluding remarks",
          pub: "Cold Spring Harbor Symposia on Quantitative Biology 22",
          note: "Where the modern definition of the niche comes from." },
        { by: "US Fish and Wildlife Service", title: "Monarch butterfly",
          url: "https://www.fws.gov/initiative/pollinators/monarchs" },
        { by: "Xerces Society", title: "Western Monarch Count",
          url: "https://westernmonarchcount.org/",
          note: "Real population data, year by year, for the data-analysis task." }
      ])
    ],
    check: { q: "A biologist removes a competing species from part of a shoreline, and a barnacle " +
                "that was only ever found high up spreads down to the low-tide line. Which has changed?",
             opts: ["Its fundamental niche has grown",
                    "Its realised niche has grown, towards its fundamental niche",
                    "Its tolerance range has grown",
                    "Its habitat has become its niche"],
             right: 1,
             why: "The barnacle could always live down there &mdash; that is its fundamental niche, " +
                  "set by the physical conditions. Removing the competitor let it occupy more of it. " +
                  "Nothing about the animal or the rock changed." }
  }, {
    n: "1.4", t: "How Populations Grow", kicker: "Growth, limits and carrying capacity",
    stand: "Every population on Earth could, in principle, bury the planet in its own offspring " +
           "within a few generations. None does. What stops them &mdash; and what happens on the rare " +
           "occasions nothing does &mdash; is the subject of this section.",
    mins: 13,
    objectives: ["Define population density and describe the three dispersion patterns",
                 "Tell exponential from logistic growth, and say what each model assumes",
                 "Explain how limiting factors set carrying capacity",
                 "Explain how a species' life history shapes the way its population changes"],
    body: [
      H("Two questions about any population"),
      P("How many, and how are they spread? They sound like the same question and they are not, and " +
        "the second one is usually the more interesting."),
      D("Population density", "The number of individuals per unit of area or volume &mdash; 50 deer " +
        "per square mile, 3 barnacles per square centimetre.",
        "How crowded it is. How many of them there are in a given amount of space."),
      D("Dispersion", "The pattern in which individuals are spread through that space: clumped, " +
        "uniform or random.",
        "How they are arranged &mdash; in bunches, evenly spread out, or scattered with no pattern."),
      F({ imgs: [{ src: M + "1-4-dispersion.svg", w: 700, h: 424,
                   alt: "Three squares of ground with the same number of dots arranged differently. " +
                        "In the clumped square the dots sit in three tight groups. In the uniform " +
                        "square they are evenly spaced in a grid. In the random square they are " +
                        "scattered with no pattern." }],
          cap: "Dispersion is a clue to how a species lives. Clumped means the resources come in " +
               "patches or there is safety in numbers; uniform almost always means individuals are " +
               "pushing each other apart.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-4-king-penguins.jpg", 1100, 825,
                      "A vast colony of king penguins covering a plain on South Georgia, tens of " +
                      "thousands of birds standing at even spacing, with mountains behind.")],
          cap: "A king penguin colony on South Georgia: about 60,000 breeding pairs. Extremely high " +
               "density, and at close range almost perfectly uniform dispersion &mdash; each nest " +
               "sits just beyond the reach of its neighbour's beak. Both facts together tell you " +
               "something neither tells you alone.",
          credits: [credit("Pismire", "Colony_of_aptenodytes_patagonicus.jpg", "CC BY-SA 3.0",
                           BYSA3)] }),
      H("Counting what will not stand still"),
      P("Before any of this can be modelled, somebody has to know how many there are &mdash; and most " +
        "animals will not line up to be counted. For things that stay put you can count a sample and " +
        "scale it up. For things that move, the standard tool is mark and recapture."),
      F({ imgs: [{ src: M + "1-4-mark-recapture.svg", w: 700, h: 400,
                   alt: "Three steps. Catch 40 animals, mark them and release them. Wait for them to " +
                        "mix back into the population. Catch 50 again and count the marked ones: 10 " +
                        "are marked. A formula below shows that marked-in-second-catch over " +
                        "second-catch equals all-marked over the whole population, giving 10 over 50 " +
                        "equals 40 over N, so N is about 200." }],
          cap: "The maths is one fraction. The science is in the assumptions underneath it &mdash; " +
               "and every one of them is something a biologist has to argue for.",
          credits: OEDU, diagram: true }),
      P("Bald eagles are counted this way, with bands on the legs of nestlings, alongside aerial " +
        "surveys and nest counts. The numbers that came out of it are why the species is famous: 487 " +
        "nesting pairs in the lower 48 states in 1963, after DDT thinned their eggshells past the " +
        "point of hatching; roughly 71,400 nesting pairs by 2019, after the pesticide was banned and " +
        "the birds were protected. A population is not an opinion. Somebody counted."),
      F({ imgs: [shot("1-4-bald-eagle.jpg", 800, 1000,
                      "A close portrait of a bald eagle in profile, its white head and yellow hooked " +
                      "beak sharp against a dark background.")],
          cap: "487 nesting pairs in 1963. About 71,400 in 2019. Removing one limiting factor " +
               "&mdash; a pesticide that stopped eggs hatching &mdash; is what the difference is " +
               "made of.",
          credits: [credit("Saffron Blaze", "Bald_Eagle_Portrait.jpg", "CC BY-SA 3.0", BYSA3)],
          size: "medium" }),
      H("Two shapes"),
      D("Exponential growth", "Growth in which a fixed <b>percentage</b> is added each time period, " +
        "so the increase itself keeps getting bigger. Drawn against time it makes a J.",
        "Growth that speeds up as it goes, because the more there are, the more get born. It starts " +
        "slowly and then runs away."),
      D("Logistic growth", "Growth that starts exponentially, then slows as resources run short, and " +
        "levels off at the carrying capacity. Drawn against time it makes an S.",
        "Growth that starts fast, then flattens out when the place runs out of room or food."),
      F({ imgs: [{ src: M + "1-4-growth.svg", w: 700, h: 470,
                   alt: "Two curves on one set of axes with time along the bottom and population up " +
                        "the side. The exponential curve is a J that keeps getting steeper. The " +
                        "logistic curve is an S that levels off at a dashed horizontal line marked K " +
                        "for carrying capacity. Phases are labelled: slow start, fastest growth, " +
                        "levelling off." }],
          cap: "Both models describe the same population at different moments. Every logistic curve " +
               "begins exponential; the difference is whether anything has begun to push back yet.",
           credits: OEDU, diagram: true }),
      FBK("What sets the limit?",
        "Carrying capacity is shaped by the same abiotic factors that control where species live: temperature, water, light. A change in any of them changes K."),
      N("<b>“Exponential” does not mean “fast”.</b> It means the increase is a " +
        "fixed share of what is already there. Bacteria doubling every twenty minutes and a savings " +
        "account at 2% are both exponential; one is terrifying within a day and the other takes a " +
        "lifetime. What makes exponential growth dangerous is not its speed but its shape: it looks " +
        "harmless right up until it does not."),
      H("What pushes back"),
      D("Limiting factor", "Anything that holds a population below the size it would otherwise reach " +
        "&mdash; food, water, space, nest sites, light, predators, disease.",
        "Whatever runs out first, and stops the population getting any bigger."),
      L("Two kinds of limit", [
        ["Density-dependent", "Bites harder the more crowded the population gets: competition for " +
         "food, disease spreading between neighbours, predators drawn to a rich patch, parasites. " +
         "These are the brakes that produce an S-curve."],
        ["Density-independent", "Hits just as hard whatever the density: a hurricane, a wildfire, a " +
         "hard frost, a volcanic eruption. A storm does not care how many there were."]
      ]),
      D("Carrying capacity", "Written <b>K</b>. The population size an environment can sustain over " +
        "the long run, given its resources.",
        "How many a place can keep going without running itself down. Not a ceiling — a level " +
        "it cannot stay above.",
        "DEEP DIVE"),
      MCON("Carrying capacity is a fixed number",
        "Carrying capacity can change when environmental conditions change.",
        "K is not a wall. It is the level above which a population is spending resources faster than they are replaced. Drought, disease, or losing the lichen on St Matthew Island all change what the environment can support."),
      MCON("More individuals always means a higher population density",
        "Density depends on both the number of individuals AND the area they are in.",
        "Ask what happened to the area. 200 deer in 10 square miles is 20 per square mile. 200 deer in 2 square miles is 100 per square mile. Same animals, very different density."),
      F({ imgs: [{ src: M + "1-4-st-matthew.svg", w: 700, h: 440,
                   alt: "A chart of the reindeer population of St Matthew Island from 1944 to 1968. " +
                        "Twenty-nine animals put ashore in 1944 grow to 1,350 by 1957 and about " +
                        "6,000 by the summer of 1963. A dashed line at about 600 shows what the " +
                        "island's lichen could support. By 1966, 42 animals are left." }],
          cap: "St Matthew Island, Alaska. Twenty-nine reindeer were landed in 1944 with no predators " +
               "and deep lichen; the herd peaked around 6,000 in the summer of 1963 and was 42 " +
               "animals three years later. It never recovered, and by the 1980s there were none.",
          credits: OEDU, diagram: true }),
      P("Read the crash carefully, because it is a good test of whether the idea has landed. The herd " +
        "did not stop at K. It sailed through it, ate the lichen faster than lichen grows &mdash; and " +
        "lichen takes decades &mdash; and then met a hard winter with nothing left to eat. The " +
        "overshoot lowered the carrying capacity as well as emptying the island, which is why " +
        "“it will bounce back” is not a safe assumption."),
      F({ imgs: [shot("1-4-caribou.jpg", 1024, 686,
                      "A caribou standing in low tundra vegetation, using its antlers, with more of " +
                      "the herd behind it.")],
          cap: "Reindeer and caribou are the same species, <i>Rangifer tarandus</i>. On the mainland " +
               "wolves, hunters and migration keep the herds in check. On an island with none of " +
               "those, only the food is left to do it &mdash; and food does it late.",
          credits: [credit("Karen Laubenstein / US Fish and Wildlife Service",
                           "Caribou_using_antlers.jpg", "Public domain")] }),
      H("Two ways to bet"),
      P("Why do some populations boom and crash while others sit steady for centuries? Much of the " +
        "answer is in how the species reproduces &mdash; its <b>life history</b>."),
      D("r-selected species", "A species that reproduces early, produces very many small offspring, " +
        "gives them little or no care, and is usually short-lived. Named for r, the growth rate.",
        "Has thousands of babies, looks after none of them, and hopes a few get lucky. Dandelions, " +
        "frogs, insects."),
      D("K-selected species", "A species that reproduces late, produces few large offspring, invests " +
        "heavily in each, and is usually long-lived. Named for K, the carrying capacity.",
        "Has one or two babies and looks after them for years. Elephants, whales, humans."),
      F({ imgs: [{ src: M + "1-4-r-k.svg", w: 700, h: 396,
                   alt: "A comparison table. An r-selected species such as a dandelion has thousands " +
                        "of tiny offspring, no care, breeds within weeks, lives a short time, grows " +
                        "in a J-shape and wins when conditions keep changing. A K-selected species " +
                        "such as an elephant has one or two large offspring, years of care, breeds " +
                        "after many years, is long-lived, grows in an S-shape and wins when " +
                        "conditions are crowded and stable." }],
          cap: "The two labels are the ends of a line, not two boxes. Almost every real species sits " +
               "somewhere between them, and the useful question is which way it leans.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-4-dandelion.jpg", 900, 874,
                      "A single dandelion seed with its white parachute of fine hairs, caught on a " +
                      "spider's silk thread against a dark background.", "r · thousands, tiny"),
                 shot("1-4-elephant.jpg", 900, 675,
                      "An African elephant cow grazing in long grass with her small calf close " +
                      "beside her.", "K · one, and years of care")],
          cap: "One dandelion plant can release two thousand seeds and never see one of them again. " +
               "An elephant carries a calf for 22 months and stays with it for a decade. Both " +
               "strategies work; they work in different worlds.",
          credits: [credit("Didier Descouens", "Taraxacum_sect._Ruderalia_MHNT.jpg",
                           "CC BY-SA 4.0", BYSA4, "Seed"),
                    credit("PatriBerg", "Elephant_with_calf.jpg", "CC BY-SA 4.0", BYSA4,
                           "Elephants")] }),
      P("This is why r-selected populations are the ones that boom and crash: they can fill a space " +
        "faster than the space can push back, so they routinely overshoot. K-selected populations " +
        "creep towards K and stay near it &mdash; which also means that when something knocks them " +
        "down, they are slow to come back. A population of whales cannot double in a season, whatever " +
        "the conditions."),
      R([
        { by: "David R. Klein", year: "1968",
          title: "The introduction, increase, and crash of reindeer on St. Matthew Island",
          pub: "The Journal of Wildlife Management 32(2)",
          note: "The censuses the chart in this section is drawn from." },
        { by: "US Fish and Wildlife Service", year: "2021",
          title: "Bald Eagle Population Size: 2020 Update",
          url: "https://www.fws.gov/media/bald-eagle-population-size-2020-update",
          note: "Where the 71,400 nesting pairs comes from." },
        { by: "Living Planet Index", title: "Population data for thousands of species",
          url: "https://www.livingplanetindex.org/",
          note: "Downloadable time series &mdash; the place to get your own population to plot." },
        { by: "Khan Academy", title: "Exponential and logarithmic functions",
          url: "https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:logs",
          note: "The maths behind the two curves, if the shapes are not enough." }
      ])
    ],
    check: { q: "A deer population on an island with no predators reaches 4,000 in a year when the " +
                "island's vegetation can sustainably feed about 1,500. What should you expect next, " +
                "and why?",
             opts: ["The population will stay at 4,000, because carrying capacity is not a hard limit",
                    "The population will level off exactly at 1,500",
                    "The population will crash, and carrying capacity may end up lower than 1,500",
                    "The population will keep growing exponentially"],
             right: 2,
             why: "Above K the herd is eating the vegetation faster than it regrows. The crash is the " +
                  "bill for the overshoot &mdash; and because the plants were damaged in the " +
                  "process, the island may support fewer deer afterwards than it did before." }
  },
  {
    n: "1.5", t: "Why Are Shark Encounters Rising off Cape Cod?",
    kicker: "Hands-on · read the data, run the model, design the fix",
    stand: "For most of a century you could swim off Cape Cod without a thought. You cannot any " +
           "more, and the reason has almost nothing to do with sharks. Everything you need to " +
           "explain it is in the four sections you have just read.",
    mins: 14,
    objectives: ["Analyse population data for two species and relate the trends to each other",
                 "Use a simulation to test how a change in one population affects another",
                 "Design and defend a solution that mitigates human-wildlife conflict"],
    body: [
      P("This section is the unit's hands-on activity. It has three parts, and they go in order: " +
        "read the data, run the model, then design something. Do not skip to the third."),
      F({ imgs: [shot("1-5-white-shark.jpg", 1100, 765,
                      "A great white shark swimming just below the surface in clear blue water, seen " +
                      "from the side, with its dorsal fin and dark grey back above a white belly.")],
          cap: "A white shark, <i>Carcharodon carcharias</i>. Adults on the Atlantic coast eat " +
               "mostly seals. Remember that sentence; the whole of this section falls out of it.",
          credits: [credit("Terry Goss", "White_shark.jpg", "CC BY 2.5", BY25)] }),
      H("The phenomenon"),
      P("In the summer of 2018, two people were attacked by white sharks off the outer beaches of " +
        "Cape Cod. One survived; one, a 26-year-old man bodyboarding at Newcomb Hollow Beach in " +
        "Wellfleet, did not. It was the first shark fatality in Massachusetts since 1936."),
      P("The obvious question is “why are there suddenly sharks?”, and it is the wrong " +
        "question. The sharks are a symptom. Ask instead what changed."),
      H("Part 1 · Read the data"),
      L("What is on the record", [
        ["1888 to the 1960s", "Massachusetts pays a bounty for killing seals. The aim is to protect " +
         "fishing catches. It works: grey seals are effectively wiped out of New England waters."],
        ["1972", "The Marine Mammal Protection Act makes it illegal to hunt, harass or kill marine " +
         "mammals in US waters. The bounty is long gone and now the killing is too."],
        ["1980s", "Grey seals begin pupping again on Muskeget Island, off Nantucket. A handful of pups."],
        ["Today", "Aerial and satellite surveys put tens of thousands of grey seals at haul-outs in " +
         "southeastern Massachusetts. One study of the 2015 season estimated somewhere between " +
         "27,000 and 50,000."],
        ["2009 onwards", "Massachusetts Division of Marine Fisheries begins tagging and identifying " +
         "individual white sharks off the Cape. The number of individuals identified rises year on " +
         "year into the hundreds."],
        ["2012, 2018", "The first shark bites on people in Massachusetts in decades, all of them " +
         "within a few hundred metres of a beach."]
      ]),
      F({ imgs: [shot("1-5-grey-seals.jpg", 1100, 793,
                      "A group of grey seals resting on a rocky shoreline at the base of a cliff, " +
                      "with more seals in the water nearby.")],
          cap: "Grey seals, <i>Halichoerus grypus</i>. A bull weighs up to 300 kg. From almost none in " +
               "New England in the 1970s to tens of thousands today &mdash; one of the fastest " +
               "recoveries of a large mammal anywhere.",
          credits: [credit("Danielle Langlois", "Halichoerus_grypus_2.jpg", "CC BY-SA 3.0", BYSA3)] }),
      P("Now put the two trends beside each other and ask the question this unit has been training " +
        "you to ask: which is the cause and which is the consequence? The seal recovery starts " +
        "decades before the shark numbers rise. Sharks eat seals. The order of events is the argument."),
      F({ imgs: [{ src: M + "1-5-chain.svg", w: 700, h: 522,
                   alt: "A chain of five boxes joined by labelled arrows. A law in 1972 stops the " +
                        "killing of seals. Grey seals recover from almost none to tens of thousands. " +
                        "White sharks follow the food. The hunting happens in the shallows where " +
                        "seals haul out. Encounters with people rise. Each arrow is labelled with " +
                        "the ecological idea that explains it: protection removes a limiting factor; " +
                        "prey abundance raises the predators' carrying capacity; predators hunt where " +
                        "the prey is; two species using the same space." }],
          cap: "Every arrow in this chain is an idea from 1.1 to 1.4. A protected prey population " +
               "grew; a predator's carrying capacity rose behind it; and the hunting happens in water " +
               "shallow enough to stand up in, because that is where seals rest.",
          credits: OEDU, diagram: true }),
      L("Questions to answer before you go on", [
        ["1", "Which population is the limiting factor for the other, and how do you know from the " +
         "dates alone?"],
        ["2", "The seal population is not growing as fast as it was. Name two density-dependent " +
         "factors that could be slowing it, and say how you would test for each."],
        ["3", "Sharks off the Cape are still far fewer than seals. Using carrying capacity, explain " +
         "why a predator population is always smaller than its prey population."],
        ["4", "Is the rise in encounters evidence that the shark population is rising, or could the " +
         "same data be produced by more people in the water and more phones filming? What would " +
         "separate the two?"]
      ]),
      H("Part 2 · Run the model"),
      P("A simulation you can run on paper. You need a 6&times;6 grid (the water off one beach; the " +
        "bottom row is the shoreline), counters in three colours, and one die."),
      L("The beach game", [
        ["Set up", "Place 4 seal counters anywhere in the top two rows &mdash; that is the haul-out. " +
         "Place 1 shark counter in the top corner. One player runs the seals, one the shark, one the " +
         "swimmers. A round is one week of summer; play ten."],
        ["Seals", "At the start of each round, roll the die. On a 5 or 6, add one seal next to an " +
         "existing seal, up to a maximum of twelve. This is logistic growth with a hard K."],
        ["Swimmers", "The swimmer player then places 3 swimmer counters anywhere in the bottom two " +
         "rows. They may not see the shark move first."],
        ["Shark", "The shark moves up to two squares, in any direction, towards the nearest seal. If " +
         "it lands on a seal, remove that seal &mdash; that shark has fed this week."],
        ["Encounter", "If the shark finishes its move in a square touching a swimmer, record one " +
         "encounter. Keep a tally."],
        ["Round two", "Play the whole thing again with the seal cap K raised from twelve to twenty, " +
         "and nothing else changed. Compare the two encounter tallies."],
        ["The point", "You did not add a single shark. You raised the prey population, and the " +
         "encounter count moved."]
      ]),
      N("<b>What a model is for.</b> This one is crude on purpose. Real sharks do not move two " +
        "squares a week and real seals do not appear on a roll of five. A model earns its keep by " +
        "isolating <i>one</i> relationship so you can see what it does on its own &mdash; and then by " +
        "being wrong in ways you can name. Write down three things this model leaves out before you " +
        "move on."),
      CER("Why are shark encounters rising off Cape Cod?", [
        { k: "Claim", d: "The increase is driven by the recovery of the seal population following legal protection, not by a rise in shark numbers alone." },
        { k: "Evidence", d: "Seals were effectively wiped out by bounty hunting through the 1960s. After the 1972 Marine Mammal Protection Act, the population recovered to tens of thousands. Shark tagging data shows individuals rising year on year into the hundreds. Encounters began after seals recovered, not before." },
        { k: "Reasoning", d: "Adult white sharks eat mostly seals. If the seal population is the prey base, then more seals means more sharks have a reason to hunt in the same coastal water where people swim. Removing sharks would leave the seals — the actual driver — untouched, so encounters would rebuild." }
      ]),
      H("Part 3 · Design a solution"),
      P("Now the engineering half. The problem is not “too many sharks” &mdash; killing " +
        "them is illegal, ineffective, and would undo a conservation success. The problem is that two " +
        "species are using the same few metres of water at the same time of year. Design a solution " +
        "that reduces encounters without removing either species."),
      F({ imgs: [{ src: M + "1-5-mitigation.svg", w: 700, h: 420,
                   alt: "Four cards, each a family of solution with its cost. Detect: spotter planes, " +
                        "drones and tag receivers, but only finds sharks that are tagged or visible. " +
                        "Avoid: close beaches or change swimming times, but costs a town its season. " +
                        "Separate: barriers, nets and lifeguarded zones, but expensive and nets kill " +
                        "wildlife. Respond: trauma kits, trained lifeguards and phone signal, which " +
                        "saves lives but prevents nothing." }],
          cap: "Four families of solution. None of them is free, and the interesting work is not " +
               "picking the one that works &mdash; it is saying out loud which cost you decided to " +
               "accept.",
          credits: OEDU, diagram: true }),
      L("The brief", [
        ["Criteria", "What must your solution achieve? Write it as something measurable &mdash; " +
         "“fewer encounters” is not a criterion, “no bites at lifeguarded beaches over " +
         "a full season” is."],
        ["Constraints", "What limits you? Money, the Marine Mammal Protection Act, the fact that a " +
         "town's economy is its summer, the fact that people ignore signs."],
        ["Trade-offs", "Name, explicitly, what your solution costs and who pays it. Every real " +
         "solution here trades safety against access, or money against certainty."],
        ["Test", "How would you know within one season whether it worked? What data would you collect, " +
         "and what would make you admit it had failed?"]
      ]),
      N("<b>One framing note, and it matters.</b> This is not a shark problem or a seal problem. It " +
        "is a problem created by a conservation success, which is a very good kind of problem to " +
        "have and a real one all the same. A solution that starts from “get rid of the " +
        "predator” has not understood a single thing in this unit &mdash; and would not work " +
        "anyway, because the food would still be there."),
      R([
        { by: "Atlantic White Shark Conservancy", title: "Sharktivity &mdash; live sightings and tag data",
          url: "https://www.atlanticwhiteshark.org/sharktivity-app",
          note: "The public data set. Real detections, real dates — use it for the data task." },
        { by: "Massachusetts Division of Marine Fisheries", title: "White shark research",
          url: "https://www.mass.gov/info-details/white-shark-research-in-massachusetts" },
        { by: "R. M. Pace and others", year: "2019",
          title: "Rebuilding of a grey seal population in the northwest Atlantic",
          pub: "NOAA / Journal of Wildlife Management",
          note: "The aerial and satellite survey behind the seal estimates." },
        { by: "NOAA Fisheries", title: "Marine Mammal Protection Act",
          url: "https://www.fisheries.noaa.gov/national/marine-mammal-protection/marine-mammal-protection-act" },
        { by: "Khan Academy", title: "Why are human-shark interactions increasing around Cape Cod?",
          url: "https://www.khanacademy.org/science/hs-bio",
          note: "The original activity this section is built from, with its student and teacher guides." }
      ])
    ],
    check: { q: "Somebody argues that the rise in shark encounters off Cape Cod proves the white " +
                "shark population is out of control and should be culled. Using this unit, what is " +
                "the strongest objection?",
             opts: ["Sharks are endangered, so culling would be illegal",
                    "The sharks are following a prey population that people deliberately restored; " +
                    "removing predators leaves the cause untouched",
                    "Encounters are too rare to matter",
                    "Shark numbers are impossible to measure"],
             right: 1,
             why: "The sharks are the last link in a chain that starts with a law protecting seals. " +
                  "Their numbers are tracking prey abundance. Remove sharks and the seals &mdash; the " +
                  "actual driver &mdash; are still there, so the same pressure rebuilds the same " +
                  "predator population." }
  }, {
    n: "1.6", t: "Living with the Neighbours", kicker: "Interactions in communities",
    stand: "A community is not a list of species. It is a web of arrangements &mdash; some deadly, " +
           "some mutual, most somewhere in between &mdash; and those arrangements decide which " +
           "species are present at all.",
    mins: 13,
    objectives: ["Distinguish competition, predation, herbivory and the three symbioses, and say who " +
                 "gains and who pays",
                 "Explain how competition regulates population size and distribution",
                 "Explain competitive exclusion and how resource partitioning gets round it",
                 "Evaluate a claim that species interactions restructured a whole ecosystem"],
    body: [
      H("Six arrangements, and a way to read them"),
      P("Every interaction between two species can be written as two signs: what it does to species " +
        "A, and what it does to species B. Plus for gain, minus for harm, zero for no measurable " +
        "effect. Six combinations cover almost everything."),
      F({ imgs: [{ src: M + "1-6-interactions.svg", w: 700, h: 462,
                   alt: "A table of six species interactions with plus, minus and zero signs for each " +
                        "partner. Competition is minus minus; predation is plus minus; herbivory is " +
                        "plus minus with the plant usually surviving; mutualism is plus plus; " +
                        "commensalism is plus zero; parasitism is plus minus with the host usually " +
                        "surviving. Each row carries an example." }],
          cap: "Two signs and you have the interaction. Predation, herbivory and parasitism are all " +
               "plus-minus; what separates them is how much of the other organism is consumed, and " +
               "whether it survives the encounter.",
           credits: OEDU, diagram: true }),
      FBK("What determines the sign?",
        "Who gains and who loses depends on niche. Two species with overlapping niches compete; two with different niches can partition the resource. The niche came from 1.3."),
      D("Predation", "An interaction in which one organism &mdash; the predator &mdash; hunts, kills " +
        "and eats another, the prey (+/&minus;).",
        "One hunts and eats the other."),
      D("Herbivory", "An interaction in which an animal eats part of a plant. The plant is damaged " +
        "and usually survives, which is what separates herbivory from predation (+/&minus;).",
        "An animal eats part of a plant. The plant is hurt but usually lives."),
      D("Mutualism", "An interaction in which both species gain (+/+).",
        "Both win. Neither one is being kind &mdash; each is getting paid."),
      D("Commensalism", "An interaction in which one species gains and the other is not measurably " +
        "affected (+/0).",
        "One wins, the other does not notice."),
      D("Parasitism", "An interaction in which one species lives on or in another and takes " +
        "resources from it, usually harming it without killing it outright (+/&minus;).",
        "One lives off the other and makes it weaker, but usually does not kill it &mdash; a dead " +
        "host is a lost home."),
      F({ imgs: [shot("1-6-clownfish.jpg", 1100, 750,
                      "An orange and white clownfish nestled among the pale purple-tipped tentacles " +
                      "of a sea anemone.")],
          cap: "Mutualism. The anemone's sting keeps predators off the clownfish; the clownfish " +
               "drives away fish that eat anemones, and its waste fertilises its host. Both are " +
               "better off and neither intends any of it.",
          credits: [credit("Nick Hobgood",
                           "Amphiprion_ocellaris_(Clown_anemonefish)_by_Nick_Hobgood.jpg",
                           "CC BY-SA 3.0", BYSA3)] }),
      F({ imgs: [shot("1-6-oxpecker.jpg", 1100, 733,
                      "A yellow-billed oxpecker perched on the back of an African buffalo, its beak " +
                      "in the buffalo's coat.")],
          cap: "Oxpeckers on a buffalo, the textbook mutualism: the bird gets a meal, the buffalo " +
               "loses its ticks. Except that oxpeckers also drink blood and keep wounds open, so " +
               "researchers now argue about which way the sign points.",
          credits: [credit("Giles Laurent",
                           "057_Yellow-billed_oxpecker_on_a_buffalo_at_Queen_Elizabeth_National_Park_" +
                           "Photo_by_Giles_Laurent.jpg", "CC BY-SA 4.0", BYSA4)] }),
      N("<b>The signs are a tool, not a filing cabinet.</b> The oxpecker is the standard warning: the " +
        "same pair of species can be mutualists in one season and parasite-and-host in another, and " +
        "proving a zero &mdash; that a species genuinely does not care &mdash; is much harder than " +
        "proving a gain or a loss. Use the signs to ask a question, not to close one."),
      H("When two species want the same thing"),
      D("Competition", "An interaction in which two organisms use the same limited resource, so that " +
        "both do worse than either would alone (&minus;/&minus;). <b>Intraspecific</b> competition is " +
        "within one species; <b>interspecific</b> competition is between species.",
        "Both want the same thing and there is not enough. Both end up worse off."),
      MCON("Competition always means fighting",
        "Competition can occur without any physical contact.",
        "Two plants competing for sunlight are competing — one grows taller and the other gets less light. Neither is fighting. Competing for the same limited resource is what matters, not aggression."),
      P("Intraspecific competition is the stronger of the two, and it is the engine under everything " +
        "in 1.4: the individuals most alike are the ones that need exactly the same things, so a " +
        "population's fiercest competition is with itself. That is what makes growth slow as a " +
        "population approaches K."),
      P("Interspecific competition does something different: it decides who is present at all."),
      D("Competitive exclusion principle", "Two species that require exactly the same limiting " +
        "resources cannot coexist indefinitely in the same place. One out-competes the other, which " +
        "is driven out or to extinction locally.",
        "If two kinds of living thing need exactly the same things in exactly the same place, one of " +
        "them has to go.",
        "MORE"),
      F({ imgs: [{ src: M + "1-6-exclusion.svg", w: 700, h: 462,
                   alt: "Two charts. On the left, two species of Paramecium grown separately: both " +
                        "rise and level off. On the right, the same two grown together in one tube: " +
                        "P. aurelia levels off slightly lower while P. caudatum rises, falls and " +
                        "reaches zero by about day sixteen." }],
          cap: "Gause's experiment, drawn to the shape of his result. Apart, both do fine. Together, " +
               "on one food supply, one of them is gone within about two weeks.",
          credits: OEDU, diagram: true }),
      P("So why is the world not a short list of winners? Because exact overlap is rare, and where it " +
        "threatens, species split the resource instead of fighting for all of it."),
      D("Resource partitioning", "The division of a shared resource between species &mdash; by place, " +
        "by time, or by the part of the resource used &mdash; so that their realised niches no longer " +
        "fully overlap and both can persist.",
        "Sharing by splitting it up. You take the top of the tree, I will take the bottom, and we can " +
        "both stay.",
        "MORE"),
      F({ imgs: [{ src: M + "1-6-partitioning.svg", w: 700, h: 462,
                   alt: "One spruce tree with five species of warbler feeding in five different " +
                        "zones: Cape May in the very top outer needles, blackburnian just below, " +
                        "black-throated green in the middle outer branches, bay-breasted in the " +
                        "middle near the trunk, and myrtle in the low branches and on the ground." }],
          cap: "Robert MacArthur's warblers, 1958. Five species, one tree, apparently the same food " +
               "&mdash; and no exclusion, because each one feeds in a different part of it. This is " +
               "the study that turned the niche from an idea into something measurable.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-6-anole.jpg", 1000, 750,
                      "A bright green anole lizard clinging to a thin twig, seen in profile.")],
          cap: "<i>Anolis</i> lizards do the same thing in the Caribbean: on one island, different " +
               "species specialise on tree crowns, trunks, twigs and the ground, and their body " +
               "shapes have evolved to match the perch.",
          credits: [credit("PiccoloNamek", "Anolis_carolinensis.jpg", "CC BY-SA 3.0", BYSA3)] }),
      H("Predator and prey, over a century"),
      P("The Hudson's Bay Company kept fur records for two hundred years, and buried in them is one " +
        "of the most reproduced graphs in biology: snowshoe hare and Canada lynx, rising and falling " +
        "together on a cycle of about ten years, with the lynx peak always a year or two behind the " +
        "hare's."),
      F({ imgs: [{ src: M + "1-6-lynx-hare.svg", w: 700, h: 440,
                   alt: "Two curves rising and falling on a repeating cycle of about ten years. The " +
                        "snowshoe hare curve peaks higher and first; the Canada lynx curve is " +
                        "smaller and peaks one to two years later each cycle." }],
          cap: "Drawn to the shape of the fur records, not to their exact values. The lag is the part " +
               "to notice: predators peak after their prey, because it takes a season of good eating " +
               "to raise more predators.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-6-hare.jpg", 900, 851,
                      "A snowshoe hare in its white winter coat sitting in snow among bare twigs.",
                      "Snowshoe hare"),
                 shot("1-6-lynx.jpg", 800, 1120,
                      "A Canada lynx standing in snow, with thick grey fur, tufted ears and very " +
                      "large paws.", "Canada lynx")],
          cap: "A lynx's feet are the size of a dinner plate for the same reason the hare's are: both " +
               "animals are solving deep snow. When your prey evolves a trick, you evolve it too.",
          credits: [credit("D. Gordon E. Robertson", "Snowshoe_Hare,_Shirleys_Bay.jpg",
                           "CC BY-SA 3.0", BYSA3, "Hare"),
                    credit("Rosendahl", "Lynx_canadensis.jpg", "Public domain", null, "Lynx")] }),
      N("<b>The famous reading of this graph is not the whole story.</b> “Lynx eat the hares " +
        "down, then starve, then the hares recover” is the version in most textbooks, and when " +
        "Charles Krebs and his colleagues tested it in the Yukon &mdash; feeding hares in some plots " +
        "and fencing predators out of others &mdash; neither treatment alone flattened the cycle. It " +
        "took both. The cycle is food <i>and</i> predators, acting together, which is a much better " +
        "picture of how real communities work than a single cause."),
      H("One predator, a whole valley"),
      D("Trophic cascade", "A chain of effects that runs down through the levels of a food web when " +
        "something changes at the top &mdash; a predator changing the numbers or behaviour of its " +
        "prey, which changes the plants, which changes everything using the plants.",
        "Change the top predator and the change ripples all the way down &mdash; even to the plants.",
        "MORE"),
      P("In 1995 and 1996, thirty-one grey wolves were released into Yellowstone National Park, " +
        "seventy years after the last one there was killed. What happened next is the most famous " +
        "story in ecology, and it is a good place to practise telling a claim from its evidence."),
      F({ imgs: [{ src: M + "1-6-yellowstone.svg", w: 700, h: 552,
                   alt: "A chain of five claims, each labelled with how strong its evidence is. " +
                        "Wolves released in 1995 and 1996: documented. Northern-range elk numbers " +
                        "fell steeply: documented. Elk browsed less in some places and moved more: " +
                        "partly measured. Willow and aspen grew taller in some places: patchy. " +
                        "Wolves changed the whole ecosystem: contested, drawn with a dashed border." }],
          cap: "The same story, with the strength of each link marked. The first two are simply " +
               "recorded. The last is an argument &mdash; and hunting, drought, bears and cougars all " +
               "pushed the same way over the same years.",
          credits: OEDU, diagram: true }),
      F({ imgs: [shot("1-6-wolf.jpg", 1100, 735,
                      "A grey wolf lying in long grass, looking directly at the camera.",
                      "The predator"),
                 shot("1-6-willows.jpg", 1100, 825,
                      "Tall willow shrubs growing above head height along a stream in Yellowstone's " +
                      "northern range in winter.", "The plants, in one place")],
          cap: "Willows in parts of Yellowstone's northern range have grown beyond the reach of an " +
               "elk. In other parts of the same range they have not, and where beavers and water " +
               "came back matters at least as much as where the wolves went.",
          credits: [credit("John and Karen Hollingsworth", "Canis_lupus_laying_in_grass.jpg",
                           "Public domain", null, "Wolf"),
                    credit("Oregon State University", "Tall_willows_with_elk-winter_(26445044831).jpg",
                           "CC BY-SA 2.0", BYSA2, "Willows")] }),
      P("This is exactly the work the standards ask for: evaluate the claims, the evidence and the " +
        "reasoning. A trophic cascade is a real mechanism &mdash; that is not in doubt. Whether it " +
        "explains <i>this</i> valley, on its own, is a separate question, and the honest answer is " +
        "partly. Being able to hold those two sentences at once is most of what it means to think " +
        "scientifically about an ecosystem."),
      Q("The complex interactions in an ecosystem keep its numbers and types of organisms relatively " +
        "constant under stable conditions &mdash; and changing conditions may produce a new ecosystem " +
        "altogether.",
        "HS-LS2.C.1, which is this unit in one sentence"),
      F({ imgs: [shot("1-6-elk.jpg", 800, 1067,
                      "An elk standing on a snowy slope in Yellowstone in winter, with steam rising " +
                      "behind it.")],
          cap: "Northern-range elk fell from roughly 19,000 in the mid-1990s to a few thousand two " +
               "decades later. Wolves are one reason. Hunting outside the park, grizzly bears, " +
               "cougars and a long drought are the others, and no honest account leaves them out.",
          credits: [credit("Marey0", "Elk_in_winter.jpg", "CC BY-SA 4.0", BYSA4)], size: "medium" }),
      R([
        { by: "G. F. Gause", year: "1934", title: "The Struggle for Existence",
          pub: "Williams & Wilkins",
          note: "The Paramecium tubes, and the principle that came out of them." },
        { by: "Robert H. MacArthur", year: "1958",
          title: "Population ecology of some warblers of northeastern coniferous forests",
          pub: "Ecology 39(4)",
          note: "Five warblers, one spruce — the study behind the partitioning diagram." },
        { by: "Charles J. Krebs and others", year: "1995",
          title: "Impact of food and predation on the snowshoe hare cycle",
          pub: "Science 269(5227)",
          note: "The Yukon experiment: food alone did not flatten the cycle, and neither did fences." },
        { by: "Matthew J. Kauffman and others", year: "2010",
          title: "Are wolves saving Yellowstone's aspen? A landscape-level test of a behaviorally " +
                 "mediated trophic cascade",
          pub: "Ecology 91(9)",
          note: "The paper that made the Yellowstone story an argument rather than a fact." },
        { by: "US National Park Service", title: "Wolf restoration in Yellowstone",
          url: "https://www.nps.gov/yell/learn/nature/wolf-restoration.htm" }
      ])
    ],
    check: { q: "Five warbler species feed on insects in the same spruce trees, in the same forest, " +
                "at the same time of year, and none of them excludes the others. What is the best " +
                "explanation?",
             opts: ["The competitive exclusion principle is wrong",
                    "Insects are not a limiting resource in that forest",
                    "Each species feeds in a different part of the tree, so their realised niches do " +
                    "not fully overlap",
                    "The five species are actually one species"],
             right: 2,
             why: "Competitive exclusion applies when two species need <i>exactly</i> the same " +
                  "limiting resources. Partitioning the tree by zone means each species is drawing on " +
                    "a slightly different resource, so all five can persist." }
    }, {
      n: "1.7", t: "One Ecosystem, Many Connections", kicker: "Unit synthesis",
      stand: "Everything in an ecosystem is connected. A change in one place ripples outward through levels, from abiotic conditions to populations to entire communities. This section brings the whole unit together.",
      mins: 12,
      objectives: ["Trace a change through an ecosystem from abiotic conditions to community structure",
                   "Use a system model to represent connections between ecological factors",
                   "Construct an evidence-based explanation of ecosystem change",
                   "Predict what could happen if one major factor changes"],
      body: [
        H("The unit promise"),
        P("Everything in an ecosystem is connected."),
        P("A change in temperature can change where a species lives."),
        P("A change in food can change population size."),
        P("A change in one species can affect many others."),
        FBK("Where have you seen this already?",
          "In 1.1, a change in rainfall changed plants, which changed herbivores, which changed predators. In 1.4, the removal of a limiting factor changed a population dramatically. In 1.6, removing wolves changed vegetation, which changed other species."),
        H("Two phenomena, one unit"),
        H("Bald Eagle: How do biologists know whether a population is changing?"),
        P("Bald eagles are hard to count directly. They move, they travel large distances, and some may be missed during surveys. So scientists use mark-recapture: capture, mark, release, then recapture a sample and use the proportion of marked individuals to estimate the total. The numbers are striking — 487 nesting pairs in the lower 48 states in 1963, roughly 71,400 by 2019. The method has limits: it assumes marked individuals mix back evenly, and those assumptions must be argued for, not taken for granted."),
        H("Monarch Butterfly: Why do monarch butterflies migrate so far?"),
        P("Millions of monarchs breed across the United States and southern Canada, then fly up to 4,000 kilometres to overwinter in a few dozen hectares of oyamel fir forest in central Mexico. Nothing about the monarch changes en route. What changes is where the conditions it needs are — cool but not freezing in winter, milkweed in summer — and it follows them. This is the niche at the scale of a map: the monarch's fundamental niche spans two climates, and its realised niche is exactly the places where those conditions exist."),
        H("The system model"),
        P("Every concept in this unit fits into one chain of connections. A change at one level ripples outward."),
        F({ imgs: [{ src: M + "1-6-yellowstone.svg", w: 700, h: 552,
                     alt: "A chain of ecological connections: abiotic conditions shape species distribution, " +
                          "which defines the niche, which sets population limits through limiting factors " +
                          "and carrying capacity, which determines species interactions, which structure " +
                          "the community, which together create ecosystem stability or drive ecosystem change." }],
          cap: "The full chain of connections from this unit, applied to Yellowstone. Wolves are the top of the chain, but the chain runs downhill: through elk, through browsing, through willows, through beavers, through water. Every link is an idea from this unit.",
          credits: OEDU, diagram: true }),
        L("The chain", [
          ["Abiotic conditions", "Temperature, water, light, and geography determine where species can live."],
          ["Species distribution", "Within those conditions, each species occupies a niche."],
          ["Population size", "Limiting factors and carrying capacity set how large each population can get."],
          ["Species interactions", "Competition, predation, mutualism, commensalism and parasitism connect populations."],
          ["Community structure", "The web of interactions determines which species are present and in what numbers."],
          ["Ecosystem stability and change", "When interactions and conditions stay within ranges, the ecosystem is stable. Environmental changes alter those relationships."]
        ]),
        H("The Connection Challenge"),
        P("A region experiences a major reduction in rainfall. Predict what could happen."),
        CER("Trace the chain of effects", [
          { k: "Claim", d: "A sustained reduction in rainfall will cascade through the ecosystem, eventually changing community structure." },
          { k: "Evidence", d: "In 1.1, less rainfall meant less plant growth, which meant less food for herbivores, which changed herbivore populations, which changed predator populations, which changed community structure. In 1.2, water is one of the three main drivers of species richness." },
          { k: "Reasoning", d: "Rainfall is an abiotic factor. It sets the upper limit on plant growth. Plants are the base of every food web in the region. With fewer plants, herbivores decline, with fewer herbivores predators decline, and competition for remaining resources intensifies. Some species may lose their realised niche entirely." }
        ]),
        L("Step by step", [
          ["Step 1", "Abiotic conditions change. Rainfall decreases."],
          ["Step 2", "Plant growth changes. Less vegetation."],
          ["Step 3", "Food availability changes. Herbivores have less to eat."],
          ["Step 4", "Herbivore populations change. They decline or move."],
          ["Step 5", "Predator populations may change. Less prey means fewer predators."],
          ["Step 6", "Competition and species interactions change. More competition for remaining resources."],
          ["Step 7", "Community structure may change. Some species disappear, others fill the gap."]
        ]),
        H("Final performance task: You Are the Ecologist"),
        P("You are given a real ecological dataset. Your task is to determine what is changing in this ecosystem, and why."),
        L("What you must do", [
          ["DATA", "Identify at least two important patterns."],
          ["MODEL", "Create a model showing relationships between factors."],
          ["CLAIM", "Explain what you think is happening."],
          ["EVIDENCE", "Use data to support your claim."],
          ["REASONING", "Explain why the evidence supports your claim."],
          ["PREDICTION", "Predict what could happen if one major factor changes."]
        ]),
        N("<b>Everything this unit has taught you is inside this task.</b> The data is about abiotic conditions and species. The model connects them. The claim, evidence and reasoning are the scientific argument you have been building since 1.1. The prediction is the chain from 1.7, applied somewhere new."),
        FBK("What is this unit about?",
          "Life interacts with the world around it. Biotic and abiotic factors are connected. Levels of organisation matter. Niches, populations, interactions and community structure are all one system. Understanding any part means understanding how it connects to everything else."),
        R([
          { by: "US Fish and Wildlife Service", year: "2021",
            title: "Bald Eagle Population Size: 2020 Update",
            url: "https://www.fws.gov/media/bald-eagle-population-size-2020-update",
            note: "The bald eagle numbers referenced in this unit." },
          { by: "Xerces Society", title: "Western Monarch Count",
            url: "https://westernmonarchcount.org/",
            note: "Real population data for the monarch data task." },
           { by: "Living Planet Index", title: "Population data for thousands of species",
            url: "https://www.livingplanetindex.org/",
            note: "Time series data for the Final Performance Task." }
        ]),
      ],
      check: { q: "A region's rainfall drops by half over five years. Which sequence best traces the ecological effects?",
                 opts: ["Herbivores decline, then plants die, then predators increase",
                        "Rainfall decreases, plant growth decreases, herbivores decline, predators decline, community structure changes",
                        "Community structure changes first, then rainfall, then populations",
                        "Nothing changes, because ecosystems are stable"],
                 right: 1,
                  why: "The chain runs from abiotic conditions down through each level. Less rain means less plant growth, which means less food for herbivores, which means less prey for predators, and eventually a different community. The chain is always from conditions to organisms, never the other way round." }
    }
  ];
})();
