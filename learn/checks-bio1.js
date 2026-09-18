/* ==========================================================================
   Checks beside the reading — Biology, Unit 1 (learn/bio1.js).

   Written against the unit's own text: every question here is answered by
   the passage it sits beside, and most are aimed at the exact place the
   text itself warns a reader will slip — a dead log is biotic, richness is
   not abundance, a habitat is not a niche, K is not a wall.

   Shape of one check:

     id      stable forever; a student's result is kept against it
     at      a phrase from the passage it belongs beside (not a paragraph
             number — the text can be rewritten round it)
     type    choice | sort | order | explain
     q       the question
     why     said once the answer is right: the reason, in the lesson's terms
     nudge   said when it is not: where to look, never the answer

     choice   options, answer (index)
     sort     bins, items: [label, bin index]
     order    items, in the right order (shown shuffled)
     explain  model: the lesson's own version, to compare with
   ========================================================================== */
(window.OPLO_CHECKS_DATA = window.OPLO_CHECKS_DATA || {})["bio:1"] = {

  "1.1": [
    { id: "bio1-1.1-biotic", at: "A dead log is biotic", type: "sort",
      q: "Biotic or abiotic?",
      bins: ["Biotic", "Abiotic"],
      items: [["A fallen feather", 0], ["Sea water", 1], ["A dead log", 0],
              ["Sunlight", 1], ["Garden compost", 0], ["Sand", 1]],
      why: "Biotic means it is alive or came from something that was — so a feather, a log and compost all count, even though none of them is breathing.",
      nudge: "“Biotic” is not the same as “alive now”." },

    { id: "bio1-1.1-ladder", at: "Each is the one before it with something added", type: "order",
      q: "Put the levels in order, smallest to largest.",
      items: ["Population", "Community", "Ecosystem", "Biome", "Biosphere"],
      why: "Each level contains the last: populations make a community, a community plus its non-living world is an ecosystem, ecosystems sharing a climate are a biome.",
      nudge: "Ask what each one adds to the level below it." },

    { id: "bio1-1.1-pond", at: "A population is one species", type: "choice",
      q: "Every species living in a pond, taken together, is the pond's…",
      options: ["population", "community", "ecosystem", "biome"], answer: 1,
      why: "A population is one species. All of them together are the community — add the water and the mud and it becomes an ecosystem.",
      nudge: "How many species does a population hold?" },

    { id: "bio1-1.1-biome", at: "Two numbers do almost all the work", type: "choice",
      q: "Which two numbers do most of the work in sorting the world's land biomes?",
      options: ["Latitude and longitude", "Yearly temperature and rainfall",
                "Altitude and soil depth", "Number of species and number of individuals"], answer: 1,
      why: "How warm a place is over a year and how much rain falls on it — which is why every hot desert is one biome, on whatever continent.",
      nudge: "Biomes do not follow borders or continents. What does the passage plot?" }
  ],

  "1.2": [
    { id: "bio1-1.2-richness", at: "Richness is not abundance", type: "choice",
      q: "A field holds 10,000 sheep and nothing else. Its species richness is…",
      options: ["10,000", "1", "Very high — there are so many animals", "Impossible to say without a map"], answer: 1,
      why: "Richness counts kinds, not individuals. One kind of animal is a richness of one, however many of them there are.",
      nudge: "Is richness counting animals or kinds of animal?" },

    { id: "bio1-1.2-warm", at: "Careful with the obvious answer", type: "choice",
      q: "Which fact breaks the explanation “the tropics are rich because they are warm”?",
      options: ["Coral reefs sit in warm water", "The Sahara and the Atacama are hot and poor in species",
                "The tundra is cold", "Ecuador is on the equator"], answer: 1,
      why: "Warmth is one cause of at least three. A hot desert has the warmth and not the water — so warmth alone cannot be the explanation.",
      nudge: "Look for a place that is warm and yet not rich." },

    { id: "bio1-1.2-mountain", at: "Air cools as it rises", type: "choice",
      q: "Climbing 1,000 metres up a mountain does roughly the same as…",
      options: ["Nothing measurable", "Travelling about 1,000 km towards the pole",
                "Travelling about 1,000 km towards the equator", "Warming the air by 6.5°C"], answer: 1,
      why: "Air cools about 6.5°C for every 1,000 m, so one mountain stacks the life zones a continent spreads over thousands of kilometres.",
      nudge: "Which way does the temperature go as you climb?" },

    { id: "bio1-1.2-200m", at: "the most important line in the ocean", type: "explain",
      q: "Why is 200 metres the most important line in the ocean?",
      model: "By 200 m only about 1% of the surface light is left — the floor for photosynthesis. Almost everything that grows is above it, and life below depends on food that grew above (apart from hot vents, which run on chemistry).",
      why: "Depth does in the sea what latitude does on land and height does on a mountain: it takes the energy away." }
  ],

  "1.3": [
    { id: "bio1-1.3-hump", at: "you get a hump, not a box", type: "choice",
      q: "Near the edge of its tolerance range for temperature, a trout most likely…",
      options: ["thrives and breeds", "survives but grows slowly and does not spawn",
                "dies at once", "moves to a new habitat"], answer: 1,
      why: "Tolerance is a hump, not a box: thriving in the middle, surviving without breeding further out, and dying beyond that.",
      nudge: "The passage describes three zones, not two." },

    { id: "bio1-1.3-niche", at: "Everything a species needs and everything it does", type: "sort",
      q: "Part of its habitat, or part of its niche?",
      bins: ["Habitat", "Niche"],
      items: [["Lives in an oak wood", 0], ["Hunts mice at night", 1], ["Eaten by foxes", 1],
              ["A rocky shore", 0], ["Competes with owls for voles", 1]],
      why: "The habitat is the address. The niche is the whole way of making a living — what it eats, when it is active, what eats it, what it competes with.",
      nudge: "Is it a place, or something the animal does or has done to it?" },

    { id: "bio1-1.3-connell", at: "he scraped one species of barnacle off the rock", type: "choice",
      q: "When Connell removed one barnacle, the other spread into rock it had never used. What does that show?",
      options: ["Its fundamental niche had grown", "Its realised niche had been held down by a competitor",
                "The tide had changed", "Barnacles can move to new rock"], answer: 1,
      why: "Nothing physical changed — only the competitor went. The fundamental niche was always bigger; the realised niche was what the competitor allowed.",
      nudge: "Did the rock, the tide or the temperature change?" },

    { id: "bio1-1.3-ice", at: "Polar bears hunt seals from sea ice", type: "choice",
      q: "As sea ice retreats, what happens to the polar bear's niches?",
      options: ["Both shrink", "The fundamental niche shrinks; the realised niche stays",
                "The realised niche shrinks; the fundamental niche stays where it was",
                "Neither changes — bears tolerate cold"], answer: 2,
      why: "Its tolerance for cold is unchanged, so the fundamental niche is where it always was. The ice it hunts from is going, so the realised niche shrinks.",
      nudge: "Has the bear's tolerance changed, or the world around it?" }
  ],

  "1.4": [
    { id: "bio1-1.4-density", at: "The number of individuals per unit of area", type: "choice",
      q: "200 deer live in 2 square miles. Later the same 200 live in 10 square miles. Their density…",
      options: ["stays the same — there are still 200", "falls from 100 to 20 per square mile",
                "rises from 20 to 100 per square mile", "can't be known without a birth rate"], answer: 1,
      why: "Density is individuals per area: 200 ÷ 2 = 100, then 200 ÷ 10 = 20. Same deer, very different density.",
      nudge: "Divide the deer by the area, both times." },

    { id: "bio1-1.4-exp", at: "What makes exponential growth dangerous", type: "choice",
      q: "Which of these is exponential growth?",
      options: ["Adding 10 bacteria every hour", "A savings account growing 2% a year",
                "A tree adding 30 cm every summer", "A population holding at 500"], answer: 1,
      why: "Exponential means a fixed share of what is already there is added each period. 2% a year is exponential, however slowly it starts.",
      nudge: "Exponential is about a share of what is there, not about speed." },

    { id: "bio1-1.4-limits", at: "Bites harder the more crowded", type: "sort",
      q: "Does it bite harder when the population is crowded?",
      bins: ["Density-dependent", "Independent"],
      items: [["Disease spreading", 0], ["A hurricane", 1], ["Competition for food", 0],
              ["A hard frost", 1], ["Predators drawn to a crowd", 0], ["A wildfire", 1]],
      why: "Density-dependent limits get stronger as the population gets crowded — they are the brakes behind the S-curve. Weather and fire hit just as hard either way.",
      nudge: "Would it matter whether there were ten of them or ten thousand?" },

    { id: "bio1-1.4-crash", at: "The herd did not stop at K", type: "explain",
      q: "Why didn't the St Matthew Island reindeer simply bounce back after the crash?",
      model: "They overshot K and ate the lichen faster than it grows — lichen takes decades — so the crash lowered the island's carrying capacity itself. There was no longer food for a large herd.",
      why: "K is not a wall. Overshooting it can damage the very resources that set it." }
  ],

  "1.5": [
    { id: "bio1-1.5-order", at: "The order of events is the argument", type: "choice",
      q: "Seals recovered decades before shark numbers rose. What does that order suggest?",
      options: ["The sharks caused the seal recovery", "The seal recovery is driving the rise in sharks",
                "The two trends are unrelated", "Warmer water caused both at the same moment"], answer: 1,
      why: "A cause comes before its effect. Seals are the sharks' prey: more prey close to the beaches brought the predator in.",
      nudge: "Which one came first, and which one eats the other?" },

    { id: "bio1-1.5-design", at: "Design a solution that reduces encounters without removing either species", type: "choice",
      q: "Why is “get rid of the sharks” not a solution?",
      options: ["Sharks are not dangerous", "It is illegal, would undo a conservation success, and the seals — the food — would still be there",
                "The sharks will leave on their own", "It would only work in winter"], answer: 1,
      why: "The problem is two species using the same water at the same time. Remove the predator and the food is still there; another would come.",
      nudge: "What brought the sharks in the first place?" }
  ],

  "1.6": [
    { id: "bio1-1.6-signs", at: "Six combinations cover almost everything", type: "sort",
      q: "Give each interaction its signs.",
      bins: ["+/−", "+/+", "+/0", "−/−"],
      items: [["Predation", 0], ["Mutualism", 1], ["Commensalism", 2], ["Competition", 3], ["Parasitism", 0]],
      why: "Predation and parasitism help one and harm the other (+/−); mutualism helps both; commensalism helps one and leaves the other untouched; competition harms both.",
      nudge: "For each, ask what it does to each of the two species." },

    { id: "bio1-1.6-exclusion", at: "Two species that require exactly the same limiting resources", type: "choice",
      q: "Two species need exactly the same limiting resource in the same place. Over time…",
      options: ["they share it evenly for ever", "one is driven out", "both grow faster", "they become one species"], answer: 1,
      why: "Competitive exclusion: exact overlap cannot last. One out-competes the other — unless they split the resource between them.",
      nudge: "What does the principle say cannot happen indefinitely?" },

    { id: "bio1-1.6-intra", at: "Intraspecific competition is the stronger of the two", type: "choice",
      q: "Why is competition within one species usually the strongest?",
      options: ["Members of one species are the most alike, so they need exactly the same things",
                "Animals of the same species fight more", "There are always more of them",
                "It isn't — competition between species is stronger"], answer: 0,
      why: "The individuals most alike need exactly the same resources. That is what slows a population as it nears K.",
      nudge: "Who needs exactly what you need?" },

    { id: "bio1-1.6-wolves", at: "thirty-one grey wolves were released", type: "explain",
      q: "Wolves return to Yellowstone. Trace one chain of effects down to the plants.",
      model: "Wolves hunt elk → fewer elk, and elk avoid some places → less browsing on willow and aspen → those plants recover, changing things for the species that use them. A trophic cascade — real as a mechanism, only a partial explanation for this valley.",
      why: "Change at the top of a food web can ripple all the way down." }
  ],

  "1.7": [
    { id: "bio1-1.7-chain", at: "A region experiences a major reduction in rainfall", type: "order",
      q: "Rainfall drops sharply. Put the chain of effects in order.",
      items: ["Rainfall decreases", "Plant growth falls", "Herbivores have less to eat and decline",
              "Predators decline", "Community structure changes"],
      why: "The change starts in the abiotic conditions and ripples up through each level — the unit's whole system model in one chain.",
      nudge: "Start with the non-living change and follow the food." },

    { id: "bio1-1.7-recapture", at: "use the proportion of marked individuals", type: "choice",
      q: "50 animals are marked and released. Later, a sample of 40 contains 10 marked ones. Estimate the population.",
      options: ["90", "200", "400", "2,000"], answer: 1,
      why: "A quarter of the sample was marked (10 of 40), so the 50 marked animals are about a quarter of the whole: about 200.",
      nudge: "What fraction of the sample was marked? The marked 50 are that fraction of everyone." },

    { id: "bio1-1.7-monarch", at: "Nothing about the monarch changes en route", type: "choice",
      q: "Monarchs fly up to 4,000 km each year. What is actually moving?",
      options: ["The monarch's tolerance range", "Where on Earth the conditions it needs are found",
                "The milkweed plants", "Its fundamental niche, each season"], answer: 1,
      why: "Nothing about the butterfly changes on the way. The places that meet its needs move with the seasons, and it follows them.",
      nudge: "The passage says what does not change. What does?" }
  ]
};
