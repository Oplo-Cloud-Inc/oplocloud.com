/* ==========================================================================
   Global History I — Unit 1: Understanding the past.
   See lab/core.js for the format and lab/histkit.js for the scenes.

   Follows chapter 1 of OpenStax's World History, Volume 1 (to 1500) — why
   the past is worth knowing and how its dates and maps work, what sources
   are and how to question them, and how historians explain causes and
   argue over what they mean — in fourteen lessons. The chapter's topics are
   followed; every sentence, example and problem here is OEdu's own, and the
   primary sources quoted are in the public domain.

   The unit mixes two kinds of lesson and alternates them. A reading is a
   few short pages — real paragraphs, pictures and sources, with words to
   tap open — and a question after each page to check it landed. An
   interactive lesson meets each idea by doing something first: dragging
   dates onto a line, sliding Greenland to the equator, questioning a
   letter, building a pyramid of causes. Every lesson after the first opens
   with a question from an earlier one; fourteen skills practice it, four
   quizzes check it, and the unit test draws on every skill.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB, H = L.H;
  var mc = L.mc, icon = H.icon, card = H.card, tiles = H.tiles, photo = H.photo, read = H.read, sample = H.sample;
  var year = H.year, span = H.span, century = H.century, nth = H.nth, commas = H.commas;
  var LESSONS = [], SKILLS = [];   // lesson-count: 14

  /* ============================================================ Lesson 1
     Reading. What history is, what it is for, and what studying it trains
     you to do (section 1.1). */
  LESSONS[1] = {
    title: "What history is for",
    blurb: "More than names and dates: the human story, why it never quite repeats, and what studying it trains you to do.",
    mins: 9, kind: "read",
    steps: [
      { type: "multi", kicker: "Guess first",
        prompt: "A historian wants to know what life was like in a city 500 years ago.<br><br>Which of these could count as evidence?",
        options: [{ t: card("crown", "A king's new law"), ok: true },
                  { t: card("music", "A song people sang in the street"), ok: true },
                  { t: card("scroll", "A shopkeeper's list of prices"), ok: true },
                  { t: card("vase", "A broken cooking pot"), ok: true }],
        hints: ["Think beyond official papers.", "Could a pot tell you what people cooked? Could a price list tell you what bread cost?"],
        why: "All four. Historians use anything people left behind — a ruler's orders, a street song, a price list, a pot." },

      read({ title: "History is a story — with evidence", kicker: "Read · 1 of 4", blocks: [
        "Ask people what history is and many will say **names and dates**. Those are the bricks, not the building. History is the story of people — what they did, made, believed and suffered — and it connects you to everyone who came before you.",
        "The story is built from [[evidence|Anything that tells us about the past: documents, objects, buildings, pictures, songs — even rubbish.]]. Historians use every kind: a ruler's laws, a merchant's letters, a street musician's tunes, a broken pot. Because all of it comes from people, it is some of the most complicated information there is.",
        ["fig", "worldmap", "A map of the whole known world, drawn in the 1600s for the astronomer Johannes Kepler. Even a map is someone's picture of the world — and a clue about its maker."],
        "A [[historian|Someone who studies the past and explains it, using evidence.]] tries to paint as true a picture as the evidence allows. That means not hiding the darker parts of the past, not excusing them, and not cheering for one side.",
        ["ask", "Some voices were never written down, so we may never hear them. Can history ever be complete?"]
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "A historian finds letters showing that a famous ruler treated prisoners cruelly.<br><br>What should the historian do with them?",
        options: [{ t: "Include them, as part of the truest picture the evidence allows" },
                  { t: "Leave them out, so the ruler is remembered well", fb: "That hides the darker parts of the past — the opposite of a historian's job." },
                  { t: "Use them to prove that everyone back then was cruel", fb: "One ruler's letters can't speak for a whole society. A historian goes only as far as the evidence goes." }],
        answer: 0,
        hints: ["What is a historian's job — a flattering picture, or a true one?"],
        why: "A historian's job is the truest picture the evidence allows: dark parts included, and no further than the evidence reaches." },

      read({ title: "Does history repeat itself?", kicker: "Read · 2 of 4", blocks: [
        ["quote", "Those who cannot remember the past are condemned to repeat it.", "George Santayana, philosopher, *The Life of Reason*, 1905"],
        "You have probably heard some version of Santayana's line. It is half right. No event ever happens twice — the people, the places and the causes are always different — so history never repeats exactly.",
        "What does come back are [[patterns|Ways things tend to go that show up again and again — like a new invention upsetting old jobs, or an empire stretching itself too thin.]]. Studying the past teaches you to spot them, and to see more of the possibilities in what is happening now.",
        ["note", "Think of it like this", "No two storms are ever the same. Yet a forecaster who has studied thousands of them reads the next one far better than someone who hasn't. Knowing the past works the same way.", "cloud"]
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "Which statement would most historians agree with?",
        options: [{ t: "Events never repeat exactly, but patterns in how people behave do" },
                  { t: "History repeats itself exactly, so the future can be predicted", fb: "Every event has its own people, places and causes, so none happens twice. Patterns recur; events don't." },
                  { t: "The past is too different from today to teach us anything", fb: "Patterns do come back — that's exactly why knowing the past helps you read the present." }],
        answer: 0,
        hints: ["Is it the event that comes back, or the way things tend to go?"],
        why: "History never truly repeats, but patterns in human behavior recur.<br>Knowing them sharpens how we see the present." },

      read({ title: "What studying history trains you to do", kicker: "Read · 3 of 4", blocks: [
        "History is also a workout. The skills historians use every day are the same ones employers keep ranking near the top of their lists.",
        ["list", "", [
          ["Critical thinking", "Weighing evidence before you believe it.", "search"],
          ["Analysis", "Taking a mass of information apart to find what matters and what changed.", "layers"],
          ["Creativity", "Finding new explanations when the evidence is messy or has gaps.", "bulb"],
          ["Communication", "Telling what you found so people listen. A story nobody reads changes nothing.", "megaphone"],
          ["Cultural empathy", "Understanding people whose lives and beliefs are unlike yours.", "people"],
          ["Media literacy", "Telling a reliable source from a slick but empty one.", "web"]]],
        "These skills travel. Checking a viral post before you share it, explaining an idea to a team, working well with people from other cultures — each is history's toolkit at work."
      ] }),
      { type: "slots", kicker: "Check",
        prompt: "Match each skill to what it looks like in real life.",
        slots: [{ id: "ct", label: "Critical thinking" }, { id: "co", label: "Communication" },
                { id: "em", label: "Cultural empathy" }, { id: "an", label: "Analysis" }],
        cards: [{ t: card("phone", "Checking whether a viral post is true before sharing it"), slot: "ct", fb: "Checking before believing is weighing evidence — critical thinking." },
                { t: card("megaphone", "Turning your research into a talk people remember"), slot: "co", fb: "Making people listen to what you found is communication." },
                { t: card("people", "Working out why a custom made sense to people unlike you"), slot: "em", fb: "Understanding people unlike yourself is cultural empathy." },
                { t: card("archive", "Sorting 200 old letters to see what changed over ten years"), slot: "an", fb: "Taking a pile of information apart to find what changed is analysis." }],
        hints: ["Which one is about believing — or not believing — something?", "Which one is about other people's ways of life?"],
        why: "Checking a post: critical thinking.<br>A talk people remember: communication.<br>Understanding a custom: cultural empathy.<br>Sorting letters for change: analysis." },

      read({ title: "How this course works", kicker: "Read · 4 of 4", blocks: [
        "The course moves through time, from the earliest humans toward the year 1500. Readings like this one take turns with hands-on lessons, where you do something first — drag dates, move a map, question a document — and name the idea after.",
        ["list", "Along the way you will meet", [
          ["In their own words", "A source written at the time, with questions to work out what it tells you.", "scroll"],
          ["Two voices", "Two accounts of the same event that disagree — and what a historian does about it.", "quote"],
          ["Beyond words", "Buildings, art, music and objects as evidence.", "painting"],
          ["Past meets present", "How something old still shapes the world today.", "link"]]],
        "People's names are written as close as possible to their own language. Chinese names use [[pinyin|The system China itself uses to write Chinese in the Latin alphabet — *Beijing*, not the older spelling *Peking*.]].",
        ["def", "BCE and CE", "**Before the Common Era** and **Common Era** — the same years older books call BC and AD. BCE years count *down* toward 1 BCE. CE years count *up* from 1 CE."]
      ] }),
      { type: "choice", kicker: "Guess — the next lesson shows why",
        prompt: "Which of these years is the *earliest*?",
        options: [{ t: "300 BCE" },
                  { t: "200 BCE", fb: "BCE years count *down*, so 300 BCE is 100 years further back than 200 BCE." },
                  { t: "1 CE", fb: "1 CE is the first year of the Common Era — it comes after every BCE year." },
                  { t: "100 CE", fb: "Every CE year comes after every BCE year." }],
        answer: 0, keep: true,
        hints: ["BCE years count down, like a countdown."],
        why: "BCE years count down toward 1 BCE, so the bigger BCE number is further back.<br>300 BCE comes first." },

      { type: "explain", kicker: "Put it together",
        prompt: "In your own words: why is history more than a list of names and dates?",
        model: "Names and dates are only the building blocks. History is the story of people, built from evidence, that explains why things happened — and helps us understand ourselves and the present." }
    ]
  };

  /* Practice: why history matters and what it trains. */
  var L1_SKILL = [
    ["Critical thinking", "search", ["Checking three other sources before believing a shocking headline",
      "Asking what proof there is before accepting a rumor about a famous leader",
      "Noticing that a claim in a video comes with no evidence at all"]],
    ["Analysis", "layers", ["Sorting a thousand ship records to find which goods were traded most",
      "Comparing tax lists from two decades to see which villages shrank",
      "Breaking a long treaty into its parts to see who gained what"]],
    ["Creativity", "bulb", ["Suggesting a new explanation when two sources seem to contradict each other",
      "Using old recipe books to work out what ordinary people ate",
      "Thinking of a way to learn about people who left no writing"]],
    ["Communication", "megaphone", ["Turning a year of research into a short podcast people finish",
      "Writing up findings so that a classmate can follow them",
      "Explaining a complicated war to younger students with a clear map"]],
    ["Cultural empathy", "people", ["Working out why a festival mattered so much to people unlike you",
      "Trying to see a treaty through the eyes of the side that lost",
      "Understanding why a custom that seems strange made sense at the time"]],
    ["Media literacy", "web", ["Spotting that a slick website never says who made it",
      "Noticing that a photo online was cropped to change its meaning",
      "Telling a museum's article from an advertisement dressed up as one"]]
  ];
  var L1_TRUE = [
    "History never repeats exactly, but patterns in human behavior do.",
    "A historian tries to give the truest picture the evidence allows.",
    "Names and dates are the building blocks of history, not the whole of it.",
    "Evidence can be a law, a letter, a song, a building or a broken pot.",
    "Knowing the past helps you see more possibilities in the present.",
    "Historians include the darker parts of the past, not just the proud ones.",
    "Some people's voices are missing from history because no one recorded them."
  ];
  var L1_FALSE = [
    ["History repeats itself exactly, so we can predict the future.", "No event happens twice — people, places and causes always differ. Patterns recur; events don't."],
    ["History is mainly a list of names and dates to memorize.", "Names and dates are the bricks. History is the story they build."],
    ["A historian's job is to make their own country look good.", "A historian aims for the truest picture, whoever it flatters."],
    ["Only official government documents count as evidence.", "A song, a pot or a price list can be evidence too."],
    ["The past is so different that it can't teach us anything.", "Patterns in how people behave keep coming back — that's what the past teaches."],
    ["A good history leaves out the painful parts of the past.", "Hiding the dark parts makes the picture less true, not better."],
    ["Once a history book is written, the story is complete.", "New sources and new questions keep changing the picture."],
    ["Historians should judge the past as heroes or villains.", "The job is to explain what happened and why, as clearly as the evidence allows."]
  ];
  SKILLS.push({ id: "hist1-why", title: "Why history matters", lesson: 1,
    gen: function (R, i) {
      var form = i >= 3 ? R.pick([0, 1, 2]) : i % 2;
      if (form === 0) {
        var sk = R.pick(L1_SKILL), ex = R.pick(sk[2]);
        var others = sample(R, L1_SKILL.filter(function (s) { return s !== sk; }), 3);
        return mc(R, {
          prompt: "“" + ex + ".”<br><br>Which skill that history trains does this show best?",
          right: card(sk[1], sk[0]),
          wrong: others.map(function (o) { return { t: card(o[1], o[0]), fb: "**" + o[0] + "** is " + ({ "Critical thinking": "weighing evidence before believing", "Analysis": "taking information apart to find what matters or changed", "Creativity": "finding new explanations and new ways in", "Communication": "telling what you found so people listen", "Cultural empathy": "understanding people unlike yourself", "Media literacy": "telling reliable sources from slick, empty ones" })[o[0]] + ". Is that the heart of this example?" }; }),
          hints: ["What is the person mostly *doing* — checking, sorting, imagining, explaining, understanding or judging a source?"],
          why: "“" + ex + "” is mostly about " + ({ "Critical thinking": "weighing evidence before believing it", "Analysis": "taking information apart to find what matters or changed", "Creativity": "finding a new explanation or a new way in", "Communication": "telling what was found so people follow it", "Cultural empathy": "understanding people unlike yourself", "Media literacy": "judging whether a source is what it seems" })[sk[0]] + " — **" + sk[0].toLowerCase() + "**."
        });
      }
      if (form === 1) {
        var t = R.pick(L1_TRUE), fs = sample(R, L1_FALSE, 3);
        return mc(R, {
          prompt: "Which statement would a historian agree with?",
          right: t,
          wrong: fs.map(function (f) { return { t: f[0], fb: f[1] }; }),
          hints: ["Look for the one that treats history as a story built from evidence, told as truly as possible."],
          why: "“" + t + "”<br>The others treat history as fixed, flattering, or just facts to memorize."
        });
      }
      // Harder: which statement is NOT true.
      var f = R.pick(L1_FALSE), ts = sample(R, L1_TRUE, 3);
      return mc(R, {
        prompt: "Three of these are true about history, and one is a common mistake.<br><br>Which one is the mistake?",
        right: f[0],
        wrong: ts.map(function (x) { return { t: x, fb: "That one is true. Look for the statement that makes history fixed, flattering, or only facts." }; }),
        hints: ["Read each one and ask: would a careful historian say this?"],
        why: f[1]
      });
    } });

  /* ============================================================ Lesson 2
     Interactive. Dates: BCE and CE, counting across the line (no year
     zero), and centuries (section 1.1, "dates are given … with BCE and
     CE"). */
  LESSONS[2] = {
    title: "Time on a line",
    blurb: "BCE and CE, counting years across the line with no year zero, and naming centuries.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "History never repeats exactly.<br><br>So what *does* come back?",
        options: [{ t: "Patterns in how people behave" },
                  { t: "The same events, in the same order", fb: "Every event has its own people, places and causes — so no event happens twice." },
                  { t: "Nothing — the past can't teach us", fb: "Patterns do come back. That's why the past is worth knowing." }],
        answer: 0,
        hints: ["Think of the storm forecaster from Lesson 1."],
        why: "Events never repeat, but patterns in human behavior do." },

      { type: "choice", kicker: "Guess first",
        prompt: "Two dates from ancient history: **500 BCE** and **200 BCE**.<br><br>Which came first?",
        art: tiles([{ i: "hourglass", t: "500 BCE", c: "orange" }, { i: "hourglass", t: "200 BCE", c: "orange" }]),
        options: [{ t: "500 BCE" },
                  { t: "200 BCE", fb: "It's tempting — 200 is the smaller number. But BCE years count *down*, like a countdown, so 500 BCE is further back." },
                  { t: "You can't tell from the dates alone", fb: "You can: BCE years count down toward 1 BCE, so the bigger number is further back in time." }],
        answer: 0, keep: true,
        hints: ["In BCE, which way do the years count — up or down?"],
        why: "BCE years count down toward 1 BCE.<br>500 BCE is 300 years before 200 BCE." },

      { type: "learn", kicker: "Try it",
        prompt: "The Common Era starts at **1 CE**. Before it, years count *down* toward 1 BCE.<br><br>Drag the flag from one side of the line to the other.",
        scene: { type: "yearline", from: -500, to: 500, start: -300 }, gate: true,
        then: "**BCE** means *Before the Common Era*; **CE** means *Common Era*. Older books call the same years BC and AD. And notice: the year after 1 BCE is 1 CE. There is **no year zero**." },

      { type: "timeline", kicker: "Your turn",
        prompt: "Four moments from this unit and the next.<br><br>Drag each flag to its date on the line.",
        from: -3000, to: 2000, tol: 220,
        events: [{ y: -2560, short: "Great Pyramid built", date: "c. 2560 BCE", i: "pyramid" },
                 { y: -430, short: "Herodotus writes", date: "c. 430 BCE", i: "scroll" },
                 { y: 537, short: "Hagia Sophia finished", date: "537 CE", i: "dome" },
                 { y: 1453, short: "Constantinople taken", date: "1453 CE", i: "sword" }],
        hints: ["Start with the CE dates — they read like ordinary numbers.", "2560 BCE is further back than 430 BCE, so it goes further left."],
        why: "CE dates go right of 1 CE, in normal order.<br>BCE dates go left, and the bigger the BCE number, the further left it sits." },

      { type: "choice", kicker: "Careful",
        prompt: "Julius Caesar was killed in **44 BCE**. His heir Augustus died in **14 CE**.<br><br>How many years apart were those two deaths?",
        options: [{ t: "30 years", fb: "That takes 14 from 44 — but the dates are on *opposite* sides of the line, so the gap is bigger than either number." },
                  { t: "57 years" },
                  { t: "58 years", fb: "Almost everyone says 58: 44 + 14. But that counts a year zero — and there isn't one. Watch the next card." }],
        answer: 1, keep: true,
        hints: ["Count up to 1 BCE, step across, then count up to 14 CE."],
        why: "44 BCE to 1 BCE is 43 years, 1 BCE to 1 CE is 1 year, 1 CE to 14 CE is 13 years.<br>43 + 1 + 13 = 57." },

      { type: "learn", kicker: "Watch",
        prompt: "Count it in hops: up to 1 BCE, across the line, then on to 14 CE.",
        scene: { type: "yearline", mode: "count", a: -44, b: 14 }, gate: true,
        then: "Across the line: **add** the two numbers, then **take away 1** — because no year zero sits between 1 BCE and 1 CE. 44 + 14 − 1 = 57." },

      { type: "years", skill: "Years between dates",
        prompt: "The Greek historian Herodotus was born about **484 BCE**. The Chinese historian Sima Qian was born about **145 BCE**.<br><br>About how many years apart were they born?",
        answer: 339, unit: "years",
        near: [{ v: 629, fb: "Both dates are BCE — on the *same* side of the line. On the same side you subtract: 484 − 145." },
               { v: 628, fb: "No need for the year-zero step here: both dates are BCE, so just subtract 484 − 145." }],
        hints: ["Are the dates on the same side of the line, or opposite sides?", "Same side: subtract. 484 − 145 = ?"],
        why: "Both are BCE, so they're on the same side of the line.<br>484 − 145 = 339 years." },

      { type: "years", kicker: "One step harder", skill: "Years between dates",
        prompt: "Julius Caesar was killed in **44 BCE**. Mount Vesuvius buried the Roman town of Pompeii in **79 CE**.<br><br>How many years apart were those events?",
        answer: 122, unit: "years",
        near: [{ v: 123, fb: "That's 44 + 79 — which counts a year zero. Take away 1." },
               { v: 35, fb: "These are on *opposite* sides of the line, so don't subtract. Add them, then take away 1." }],
        hints: ["Opposite sides of the line.", "Add the two numbers, then take away 1."],
        why: "Across the line: 44 + 79 − 1 = 122 years." },

      { type: "learn", kicker: "Try it",
        prompt: "Years are grouped in hundreds called **centuries**. The 1st century CE was the years 1 to 100.<br><br>Drag the flag into the 1400s.",
        scene: { type: "yearline", mode: "century", from: 1001, to: 1999, start: 1250, goal: [1401, 1499] }, gate: true,
        then: "The 1400s are the **15th century** — a century's number is one more than its hundreds. 1453 → 14 + 1 = **15th** century." },

      { type: "choice", skill: "Centuries",
        prompt: "The Ottomans took the city of Constantinople in **1453**.<br><br>In which century was that?",
        options: [{ t: "The 14th century", fb: "14 is the hundreds digit — but the 1st century was the years 1–100, so every century's number is one ahead. 1453 is in the 15th." },
                  { t: "The 15th century" },
                  { t: "The 16th century", fb: "The 16th century is the 1500s. 1453 is in the 1400s." }],
        answer: 1, keep: true,
        hints: ["Take the hundreds (14) and add 1."],
        why: "1453 is in the 1400s.<br>14 + 1 = the 15th century." },

      { type: "choice", skill: "Centuries",
        prompt: "Herodotus wrote his history around **430 BCE**. BCE centuries are counted the same way, just backward.<br><br>In which century was that?",
        options: [{ t: "The 5th century BCE" },
                  { t: "The 4th century BCE", fb: "4 is the hundreds digit, but add 1: the 5th century BCE is 500–401 BCE, and 430 falls inside it." },
                  { t: "The 5th century CE", fb: "Right number, wrong side of the line — 430 BCE is before the Common Era." }],
        answer: 0, keep: true,
        hints: ["Same rule: hundreds + 1. Then keep BCE."],
        why: "430 BCE is in the 400s BCE.<br>4 + 1 = the 5th century BCE (500–401 BCE)." },

      { type: "order", kicker: "Put it together", skill: "Chronological order",
        prompt: "Put these in order, **earliest first**.",
        items: ["The Great Pyramid is built (c. 2560 BCE)", "Herodotus writes his history (c. 430 BCE)", "Julius Caesar is killed (44 BCE)",
                "Hagia Sophia is finished (537 CE)", "The Ottomans take Constantinople (1453 CE)"],
        nudge: "Check the BCE dates: the biggest BCE number comes first.",
        hints: ["All the BCE dates come before all the CE dates.", "Among BCE dates, the biggest number is the earliest."],
        why: "BCE, biggest number first: 2560, 430, 44 BCE.<br>Then CE, smallest first: 537, 1453 CE." }
    ]
  };

  /* Events for the date skills: signed years (−44 is 44 BCE). */
  var L2_EV = [
    [-2560, "the Great Pyramid of Giza was built", "about "], [-1754, "Hammurabi's law code was carved", "about "],
    [-776, "the first recorded Olympic Games were held", ""], [-753, "Rome was founded, according to legend,", ""],
    [-551, "Confucius was born", ""], [-430, "Herodotus wrote his history", "about "], [-323, "Alexander the Great died", ""],
    [-221, "Qin Shi Huang united China", ""], [-145, "Sima Qian was born", "about "], [-44, "Julius Caesar was killed", ""],
    [-30, "Cleopatra died", ""], [79, "Vesuvius buried Pompeii", ""], [537, "Hagia Sophia was finished", ""],
    [622, "Muhammad moved from Mecca to Medina", ""], [1206, "Chinggis Khan united the Mongols", ""],
    [1215, "Magna Carta was sealed", ""], [1324, "Mansa Musa traveled to Mecca", ""], [1347, "the Black Death reached Europe", ""],
    [1453, "the Ottomans took Constantinople", ""], [1521, "Tenochtitlán fell to Cortés", ""], [1840, "Thomas Carlyle lectured on heroes", ""],
    [1941, "Japan attacked Pearl Harbor", ""], [1948, "the UN adopted the Universal Declaration of Human Rights", ""]
  ];
  function l2cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function l2when(e) { return e[2] + year(e[0]); }
  SKILLS.push(
    { id: "hist1-dates", title: "Years between dates", lesson: 2,
      gen: function (R, i) {
        // 0: both CE · 1: both BCE · 2+: across the line (3–4 with real events).
        var kind = i === 0 ? "ce" : i === 1 ? "bce" : i === 2 ? R.pick(["ce", "bce", "x"]) : "x";
        var a, b, ea = null, eb = null;
        if (i >= 3 || R.chance(0.5)) {
          var pool = L2_EV.filter(function (e) { return kind === "ce" ? e[0] > 0 : kind === "bce" ? e[0] < 0 : true; });
          var pair;
          do { pair = sample(R, pool, 2).sort(function (p, q) { return p[0] - q[0]; }); }
          while (kind === "x" && !(pair[0][0] < 0 && pair[1][0] > 0) || pair[0][0] === pair[1][0]);
          ea = pair[0]; eb = pair[1]; a = ea[0]; b = eb[0];
        } else {
          if (kind === "ce") { a = R.int(2, 18) * 50 + R.int(1, 40); b = a + R.int(3, 30) * 10 + R.int(1, 9); }
          else if (kind === "bce") { b = -(R.int(1, 12) * 50 + R.int(1, 40)); a = b - (R.int(3, 30) * 10 + R.int(1, 9)); }
          else { a = -(R.int(1, 9) * 50 + R.int(2, 40)); b = R.int(1, 9) * 50 + R.int(2, 40); }
        }
        var ans = span(a, b), across = a < 0 && b > 0;
        var near = [];
        if (across) { near.push({ v: -a + b, fb: "That's " + commas(-a) + " + " + commas(b) + " — which counts a year zero. There isn't one: take away 1." });
                      near.push({ v: Math.abs(-a - b), fb: "These dates are on *opposite* sides of the line, so don't subtract. Add them, then take away 1." }); }
        else near.push({ v: Math.abs(a) + Math.abs(b), fb: "Both dates are on the same side of the line (" + (a < 0 ? "both BCE" : "both CE") + "), so subtract the smaller number from the bigger." });
        near = near.filter(function (n) { return n.v !== ans && n.v > 0; });
        var ctx = ea ? l2cap(ea[1]) + " in " + l2when(ea) + ". " + l2cap(eb[1]) + " in " + l2when(eb) + "."
                     : "One event happened in " + year(a) + ". Another happened in " + year(b) + ".";
        return { type: "years", unit: "years",
          prompt: ctx + "<br><br>How many years apart are they?" + (ea && (ea[2] || eb[2]) ? " (Use the dates as given.)" : ""),
          answer: ans, near: near,
          hints: ["Same side of 1 CE, or opposite sides?", across ? "Opposite sides: add the two numbers, then take away 1." : "Same side: subtract the smaller number from the bigger."],
          why: across ? "Opposite sides of the line: " + commas(-a) + " + " + commas(b) + " − 1 = " + commas(ans) + " years (there is no year zero)."
                      : "Same side of the line: " + commas(Math.max(Math.abs(a), Math.abs(b))) + " − " + commas(Math.min(Math.abs(a), Math.abs(b))) + " = " + commas(ans) + " years." };
      } },

    { id: "hist1-century", title: "Centuries", lesson: 2,
      gen: function (R, i) {
        var form = i >= 3 ? R.pick([0, 1, 2]) : i;
        if (form === 2) {
          // Which year is in the Nth century?
          var c = R.int(3, 19), inY = (c - 1) * 100 + R.int(11, 89);
          var before = (c - 2) * 100 + R.int(11, 89), after = c * 100 + R.int(11, 89);
          var opts = [{ t: String(inY) }, { t: String(before), fb: before + " is in the " + (Math.floor(before / 100)) + "00s — the " + nth(century(before)) + " century." },
                      { t: String(after), fb: after + " is in the " + Math.floor(after / 100) + "00s — the " + nth(century(after)) + " century." }];
          if (c >= 4) { var way = (c - 3) * 100 + R.int(11, 89); opts.push({ t: String(way), fb: way + " is in the " + nth(century(way)) + " century." }); }
          return mc(R, { prompt: "Which of these years falls in the **" + nth(c) + " century** CE?", right: opts[0].t, wrong: opts.slice(1),
            hints: ["The " + nth(c) + " century is the " + (c - 1) + "00s.", "Look for the year that starts with " + (c - 1) + "."],
            why: "The " + nth(c) + " century is the " + (c - 1) + "00s, so " + inY + " is in it." });
        }
        var bce = form === 1, ev = null, y;
        if (i >= 3) {
          var pool = L2_EV.filter(function (e) { return (e[0] < 0) === bce && Math.abs(e[0]) % 100 !== 0 && Math.abs(e[0]) > 100; });
          ev = R.pick(pool); y = ev[0];
        } else {
          y = (R.int(2, 19) * 100 + R.int(11, 89)) * (bce ? -1 : 1);
          if (bce) y = -(R.int(2, 29) * 100 + R.int(11, 89));
        }
        var c2 = century(y), side = bce ? " BCE" : "";
        return mc(R, {
          prompt: (ev ? l2cap(ev[1]) + " in " + l2when(ev) + "." : "An event happened in **" + year(y, !bce) + "**.") + "<br><br>In which century was that?",
          right: "The " + nth(c2) + " century" + side,
          wrong: [{ t: "The " + nth(c2 - 1) + " century" + side, fb: (c2 - 1) + " is the hundreds — but add 1, because the 1st century was the years " + (bce ? "100–1 BCE" : "1–100") + "." },
                  { t: "The " + nth(c2 + 1) + " century" + side, fb: "The " + nth(c2 + 1) + " century" + side + " is the " + c2 + "00s" + side + ". Look again at the hundreds." },
                  { t: "The " + nth(c2) + " century" + (bce ? " CE" : " BCE"), fb: "Right number, wrong side of the line: " + year(y) + " is " + (bce ? "before" : "in") + " the Common Era." }],
          hints: ["Take the hundreds and add 1.", bce ? "Keep it BCE: BCE centuries count the same way, just backward." : "1453 → 14 + 1 = 15th, for example."],
          why: year(y) + " is in the " + (c2 - 1) + "00s" + side + ".<br>" + (c2 - 1) + " + 1 = the " + nth(c2) + " century" + side + "."
        });
      } },

    { id: "hist1-order", title: "Chronological order", lesson: 2,
      gen: function (R, i) {
        if (i === 1 || (i >= 3 && R.chance(0.3))) {
          // Which came first — two BCE dates, the classic trap.
          var two = sample(R, L2_EV.filter(function (e) { return e[0] < 0; }), 2).sort(function (p, q) { return p[0] - q[0]; });
          return mc(R, {
            prompt: l2cap(two[1][1]) + " in " + l2when(two[1]) + ". " + l2cap(two[0][1]) + " in " + l2when(two[0]) + ".<br><br>Which happened first?",
            right: l2cap(two[0][1]).replace(/,$/, "") + " (" + l2when(two[0]) + ")",
            wrong: [{ t: l2cap(two[1][1]).replace(/,$/, "") + " (" + l2when(two[1]) + ")", fb: "In BCE the smaller number is *later*: years count down toward 1 BCE. " + year(two[0][0]) + " is further back." }],
            hints: ["BCE years count down."],
            why: "BCE years count down toward 1 BCE, so " + year(two[0][0]) + " comes before " + year(two[1][0]) + "."
          });
        }
        var n = i >= 3 ? 5 : 4, pick, guard = 0;
        do { pick = sample(R, L2_EV, n); guard++; }
        while (guard < 50 && pick.filter(function (e) { return e[0] < 0; }).length < (i >= 2 ? 2 : 1));
        pick.sort(function (p, q) { return p[0] - q[0]; });
        return { type: "order",
          prompt: "Put these in order, **earliest first**.",
          items: pick.map(function (e) { return l2cap(e[1]).replace(/,$/, "") + " (" + l2when(e) + ")"; }),
          nudge: "Check the BCE dates: the bigger the BCE number, the earlier.",
          hints: ["Every BCE date comes before every CE date.", "Among BCE dates, the biggest number is the earliest."],
          why: pick.map(function (e) { return year(e[0]); }).join(" → ") + "." };
      } }
  );

  /* ============================================================ Lesson 3
     Reading. Global citizenship: a connected world, the human-rights
     declarations that followed World War II, and a feeling that rises and
     falls with the times (section 1.1). */
  LESSONS[3] = {
    title: "Citizens of the world",
    blurb: "How a world at war gave rise to rights for every person — and what it means to call yourself a global citizen.",
    mins: 9, kind: "read",
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Centuries",
        prompt: "The United Nations adopted a declaration of human rights in **1948**.<br><br>In which century was that?",
        options: [{ t: "The 19th century", fb: "19 is the hundreds digit — add 1. The 1900s are the 20th century." },
                  { t: "The 20th century" },
                  { t: "The 21st century", fb: "The 21st century is the 2000s — the one we live in now." }],
        answer: 1, keep: true,
        hints: ["Hundreds + 1."],
        why: "1948 is in the 1900s.<br>19 + 1 = the 20th century." },

      { type: "choice", kicker: "Guess first",
        prompt: "Think about climate change, pandemics and plastic in the oceans.<br><br>Which of these could one country solve completely on its own?",
        art: tiles([{ i: "sun", t: "Climate change", c: "orange" }, { i: "people", t: "A pandemic", c: "red" }, { i: "ship", t: "Ocean plastic", c: "blue" }]),
        options: [{ t: "Climate change", fb: "The air doesn't stop at borders: gases released anywhere warm the whole planet." },
                  { t: "A pandemic", fb: "A virus travels with people. One country alone can't stop it everywhere." },
                  { t: "Ocean plastic", fb: "The oceans are shared, and currents carry plastic around the world." },
                  { t: "None of them" }],
        answer: 3, keep: true,
        hints: ["Do any of these stop at a border?"],
        why: "Each one crosses borders, so no country can solve it alone.<br>That is why people talk about global citizens." },

      read({ title: "A world tied together", kicker: "Read · 1 of 4", blocks: [
        "Your phone was probably designed in one country, built from parts made in several others, and put together in yet another. The music, food and videos you love cross borders just as easily. This growing web of links is called [[globalization|The growing connections between the world's peoples through trade, travel, communication and ideas.]].",
        "The biggest problems cross borders too. Climate change, pandemics and the safety of refugees can't be solved by any one country working alone.",
        "So some people call themselves [[global citizens|People who live in one country but see themselves as part of — and responsible to — a whole world community.]]. They belong to one nation, but they feel they belong to humankind as well.",
        ["ask", "What is your story — and how is it linked to people who live far away?"]
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "Which person is acting most like a global citizen?",
        options: [{ t: "A student who organizes a drive to send supplies after an earthquake in another country" },
                  { t: "A fan who only follows teams from their own city", fb: "Loving your home team is fine — but it isn't about responsibility to people far away." },
                  { t: "A shopper who buys the cheapest phone, wherever it was made", fb: "Buying something made abroad is globalization, but a global citizen *feels responsible* to the wider world." }],
        answer: 0,
        hints: ["Look for someone acting out of responsibility to people in another country."],
        why: "A global citizen acts as part of a world community — like helping people in another country after a disaster." },

      read({ title: "Rights for every person, written down", kicker: "Read · 2 of 4", blocks: [
        "The idea grew out of the worst war in history. World War II (1939–1945) killed tens of millions of people. In the Holocaust, Nazi Germany murdered six million Jews and millions of others. When the war ended, many people agreed: never again.",
        "In 1945, countries founded the [[United Nations|An organization of the world's countries, set up in 1945 to keep the peace and solve problems together — the UN.]]. In 1948, it adopted the [[Universal Declaration of Human Rights|A list of rights that belong to every person, everywhere, adopted by the United Nations in 1948.]].",
        ["fig", "eleanor", "Eleanor Roosevelt, a former First Lady of the United States, led the committee that wrote the Declaration. Here she holds it up in 1949.", { tall: true }],
        ["quote", "All human beings are born free and equal in dignity and rights.", "Article 1, Universal Declaration of Human Rights, 1948"]
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "Why did so many countries want a declaration of human rights right after 1945?",
        options: [{ t: "The war had shown how horribly people could be treated when nothing protected their rights" },
                  { t: "To divide the world's land among the countries that won the war", fb: "The Declaration is about every *person's* rights — not about who gets which land." },
                  { t: "Because the world had become calm and wealthy, with time to spare", fb: "It came out of horror, not calm: the war and the Holocaust had just shown how badly people could be treated." }],
        answer: 0,
        hints: ["What had the world just lived through?"],
        why: "World War II and the Holocaust showed what happens when people have no protected rights.<br>The Declaration was the world's answer: rights for every person." },

      read({ title: "More declarations, one ethos", kicker: "Read · 3 of 4", blocks: [
        "The 1948 Declaration was a beginning. The UN went on to spell out the rights of groups who had often been left out.",
        ["list", "", [
          ["1948", "Human rights for every person", "globe"],
          ["1959", "The rights of the child", "person"],
          ["1975", "The rights of disabled people", "people"],
          ["1979", "Ending discrimination against women", "scale"]]],
        "Words on paper don't enforce themselves. But they create an [[ethos|A set of guiding beliefs that a group shares.]]: shared principles that countries can be held to. The UN asks its members to report on how they are doing.",
        "So alongside a world economy that ignores borders, many people now accept a set of rights and duties that ignores borders too."
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "A declaration can't force any country to obey it.<br><br>So what can it do?",
        options: [{ t: "Set shared principles that countries can be judged against" },
                  { t: "Nothing at all — it's only words", fb: "Words can create an ethos: a standard the world uses to judge and pressure countries, and to which the UN asks them to report." },
                  { t: "Replace every country's own laws", fb: "Countries keep their own laws. A declaration sets a shared standard beside them." }],
        answer: 0,
        hints: ["Think of the word *ethos*."],
        why: "A declaration creates an ethos — guiding principles countries can be held to and must report on." },

      read({ title: "A feeling that rises and falls", kicker: "Read · 4 of 4", blocks: [
        ["stat", "More than half", "of the people asked in eighteen countries in 2015–2016 said they saw themselves as global citizens, in a survey for the BBC."],
        "The survey found a pattern. When times are good, the sense of belonging to one world grows. In hard times — war, an economic crisis — people tend to pull back toward their own nation, or even their own town.",
        "Whether or not you call yourself a global citizen, you will live in a connected world. Knowing its peoples and their pasts is how you meet it with competence and empathy — which is one reason to study world history at all.",
        ["ask", "Do you see yourself as a global citizen? Is that a good thing? Why or why not?"]
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "Think about the survey's pattern.<br><br>When would you expect *fewer* people to call themselves global citizens?",
        options: [{ t: "During a war or an economic crisis" },
                  { t: "During a long stretch of peace and growth", fb: "Good times are when the feeling of one world tends to grow." },
                  { t: "It never changes", fb: "The survey found it does change — with the times." }],
        answer: 0,
        hints: ["In hard times, do people look outward or inward?"],
        why: "In hard times people tend to fall back on local and national identities." },

      { type: "explain", kicker: "Put it together",
        prompt: "In your own words: how can knowing world history help someone act as a global citizen?",
        model: "It helps you understand people in other places and how their past shapes them — so you can work with them, respect their rights, and tackle shared problems like climate change with empathy instead of ignorance." }
    ]
  };

  /* Practice: global citizenship, globalization, and the declarations. */
  var L3_YES = [
    "A club that writes letters asking a government to free a jailed journalist in another country",
    "A student who learns about refugees' lives before a class debate on how to welcome them",
    "A town that twins with a town abroad and trades visits between their schools",
    "A volunteer who raises money for clean water in a country she has never visited",
    "A teenager who changes how her family recycles after reading about ocean plastic",
    "A class that follows an election in another country to understand its people's choices",
    "Someone who checks how the clothes they buy were made, and by whom",
    "A doctor who spends her vacation treating patients after a disaster overseas"
  ];
  var L3_NO = [
    ["Someone who only cares about news from their own street", "That's a purely local view — a global citizen also feels responsible to people far away."],
    ["A shopper who buys imported fruit because it is cheap", "Buying something from abroad is globalization, not a sense of responsibility to the world."],
    ["A traveler who visits five countries but never talks to anyone there", "Seeing places isn't the same as feeling part of a world community."],
    ["A fan who follows a team from another country", "Enjoying something foreign is globalization. A global citizen acts out of responsibility to others."],
    ["A company that moves its factory abroad to pay lower wages", "That's a business using the global economy — not acting as part of a world community."],
    ["A person who says problems abroad are none of their business", "That's the opposite: a global citizen sees those problems as partly theirs too."]
  ];
  var L3_GLOB = [
    "A song by a band from South Korea tops the charts in Brazil",
    "A pair of sneakers designed in Oregon is sewn in Vietnam from rubber grown in Thailand",
    "Students in Kenya and Canada edit the same online document at once",
    "A virus that appears in one city reaches five continents within weeks",
    "A restaurant chain from the United States opens branches in China",
    "News of an election abroad spreads around the world in minutes"
  ];
  var L3_NOTGLOB = [
    ["A farmer sells vegetables at the market in her own village", "That trade stays in one village — nothing crosses a border."],
    ["Neighbors share a lawnmower on their street", "A local arrangement, with no links across countries."],
    ["A town repaints its old fire station", "A local project — nothing connects it to other countries."],
    ["A family bakes bread from their own garden's wheat", "Everything here is made and used in one place."]
  ];
  var L3_FACT = [
    ["The Universal Declaration of Human Rights was adopted by the UN in 1948.", true],
    ["Eleanor Roosevelt led the committee that wrote the Universal Declaration.", true],
    ["The UN was founded in 1945, as World War II ended.", true],
    ["Later UN declarations covered children, disabled people and women.", true],
    ["A declaration creates an ethos — principles countries can be held to.", true],
    ["The UN asks member countries to report their progress on rights.", true],
    ["The Universal Declaration was written before World War I.", false, "It came after World War II, in 1948."],
    ["A UN declaration automatically overrides every country's laws.", false, "It sets a shared standard; countries keep their own laws."],
    ["The Declaration lists rights for citizens of rich countries only.", false, "It is *universal*: its rights belong to every person, everywhere."],
    ["The survey found that hard times make people feel more like global citizens.", false, "It found the opposite: in hard times, people pull back toward local and national identities."]
  ];
  SKILLS.push({ id: "hist1-global", title: "Global citizens and human rights", lesson: 3,
    gen: function (R, i) {
      var form = i >= 3 ? R.pick([0, 1, 2]) : i;
      if (form === 0) {
        var ok = R.pick(L3_YES), no = sample(R, L3_NO, 3);
        return mc(R, { prompt: "Which of these is the clearest example of acting as a **global citizen**?", right: ok,
          wrong: no.map(function (x) { return { t: x[0], fb: x[1] }; }),
          hints: ["A global citizen feels responsible to a world community, not just to their own place."],
          why: "“" + ok + "” shows responsibility to people beyond one's own country — that's global citizenship." });
      }
      if (form === 1) {
        var g = R.pick(L3_GLOB), ng = sample(R, L3_NOTGLOB, 3);
        return mc(R, { prompt: "Which of these is an example of **globalization**?", right: g,
          wrong: ng.map(function (x) { return { t: x[0], fb: x[1] }; }),
          hints: ["Globalization means links between peoples across borders — trade, travel, communication, ideas."],
          why: "“" + g + "” links people in different countries — that's globalization." });
      }
      var f = R.pick(L3_FACT.filter(function (x) { return !x[1]; })), ts = sample(R, L3_FACT.filter(function (x) { return x[1]; }), 3);
      return mc(R, { prompt: "Three of these are true. Which one is **false**?", right: f[0],
        wrong: ts.map(function (x) { return { t: x[0], fb: "That one is true. Look for the one that gets a date, a group or the survey's pattern wrong." }; }),
        hints: ["Check the dates, and who the rights belong to."],
        why: f[2] });
    } });

  /* ============================================================ Lesson 4
     Interactive. Maps as evidence of their makers: Mercator's stretching,
     who sits in the middle, maps as tools of power, and contested places
     (section 1.1, "the study of world history also requires … geography"). */
  LESSONS[4] = {
    title: "Every map takes a side",
    blurb: "Maps are drawn by someone, from somewhere, for a reason — and the world's most famous one shrinks half the planet.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?",
        prompt: "Your sneakers were designed in one country, sewn in another, from rubber grown in a third.<br><br>What is that an example of?",
        options: [{ t: "Globalization" },
                  { t: "A declaration of rights", fb: "A declaration sets out rights for people. This is about goods and links crossing borders." },
                  { t: "An ethos", fb: "An ethos is a set of shared beliefs. This is about the world's economy tying places together." }],
        answer: 0,
        hints: ["Links between peoples through trade, travel and ideas…"],
        why: "Goods made across several countries are one strand of globalization — the growing links between the world's peoples." },

      { type: "choice", kicker: "Guess first",
        prompt: "On many classroom world maps, Greenland looks about as big as Africa.<br><br>How do their real sizes compare?",
        art: tiles([{ i: "snow", t: "Greenland", c: "blue" }, { i: "sun", t: "Africa", c: "orange" }]),
        options: [{ t: "About the same", fb: "That's what the map shows — but the map is lying about size. Try the next card." },
                  { t: "Greenland is bigger", fb: "Not even close. The map is stretching Greenland. See the next card." },
                  { t: "Africa is about 14 times bigger" }],
        answer: 2, keep: true,
        hints: ["Maps can't always be trusted about size."],
        why: "Greenland is about 2.2 million square kilometers; Africa is about 30 million.<br>Africa is roughly 14 times bigger." },

      { type: "learn", kicker: "Try it",
        prompt: "This is the kind of world map many classrooms hang on the wall.<br><br>Drag Greenland south, toward the equator, and watch its size.",
        scene: { type: "truesize" }, gate: true,
        then: "Greenland didn't change — the map did. This map is a **Mercator projection**, and it stretches places more and more the farther they lie from the equator." },

      { type: "learn", kicker: "Why it works",
        prompt: "Why would anyone draw the world like that? Turn over each card.",
        scene: { type: "turn", cols: 3, cards: [
          { i: "globe", name: "The problem", t: "The Earth is round; paper is flat. Every flat map has to stretch or squash *something*.", c: "blue" },
          { i: "compass", name: "Mercator's choice", t: "In 1569, Gerardus Mercator made a map for sailors: a straight line on it is a steady compass course.", c: "green" },
          { i: "warn", name: "The price", t: "To keep directions true, he stretched sizes — more and more toward the poles.", c: "orange" }] },
        gate: true,
        then: "So Europe and North America look bigger than they are, while Africa, South America and South Asia look small beside them. A map built for sailing became the way millions pictured the world." },

      { type: "choice", skill: "Maps",
        prompt: "Two countries are exactly the same size. One sits on the equator. The other lies far to the north.<br><br>On a Mercator map, which one looks bigger?",
        options: [{ t: "The one far to the north" },
                  { t: "The one on the equator", fb: "Mercator stretches places *more* the farther they are from the equator — so the northern one is inflated." },
                  { t: "They look the same", fb: "They would on a globe. On a Mercator map, the northern one gets stretched." }],
        answer: 0, keep: true,
        hints: ["Where did Greenland look biggest — near the equator, or far from it?"],
        why: "Mercator stretches sizes more and more toward the poles, so the northern country looks bigger." },

      { type: "learn", kicker: "Look",
        prompt: "Mapmakers also choose what goes in the **middle** — and it's usually themselves. Turn over each card.",
        scene: { type: "turn", cols: 3, cards: [
          { i: "crown", name: "China", t: "China's own name for itself, *Zhongguo*, means the “Middle Kingdom.”", c: "red" },
          { i: "church", name: "Medieval Europe", t: "Many Christian world maps of the Middle Ages put the holy city of Jerusalem at the center.", c: "purple" },
          { i: "globe", name: "East Asia today", t: "Many world maps printed in East Asia put the Pacific Ocean — not Europe — in the middle.", c: "blue" }] },
        gate: true,
        then: "None of these is wrong. Each shows how its makers saw the world — which is exactly what makes a map evidence." },

      { type: "learn", kicker: "Watch",
        prompt: "Maps have also been tools of power. Follow what happened to one map of Africa.",
        scene: { type: "unfold", steps: [
          { i: "map", t: "**1884–1885:** diplomats from European countries meet in Berlin to set rules for claiming Africa.", c: "blue" },
          { i: "x", t: "No African ruler or people is invited.", c: "red" },
          { i: "flag", t: "Lines drawn on maps become colonial borders, often cutting through kingdoms and peoples.", c: "orange" },
          { i: "link", t: "Many of those lines are still the borders of African countries today.", c: "purple" }] },
        gate: true,
        then: "Four centuries earlier, in 1493–1494, a line drawn down the Atlantic split newly reached lands between Spain and Portugal. No one asked the people living there, either." },

      { type: "choice", skill: "Maps",
        prompt: "A map made in 1500 shows one kingdom enormous and all its rivals tiny.<br><br>What's the best way for a historian to use it?",
        options: [{ t: "As evidence of how its maker saw the world — then check other sources for real sizes" },
                  { t: "As proof of how big each kingdom really was", fb: "A map shows its maker's point of view. It's evidence of that view, not of true sizes." },
                  { t: "Not at all — a biased map is useless", fb: "Bias makes it useful in its own way: it shows how its maker, and maybe its ruler, saw the world." }],
        answer: 0,
        hints: ["What *can* a biased map tell you about?"],
        why: "A map is evidence of its maker's point of view. Use it for that, and check other sources for the facts." },

      { type: "learn", kicker: "Careful",
        prompt: "Some places are claimed by more than one country. **Crimea** is claimed by Ukraine, and by Russia, which seized it in 2014. **Taiwan** governs itself, but China says it is part of China.<br><br>So every map of these places takes a side — unless it says plainly that it doesn't.",
        art: tiles([{ i: "map", t: "Crimea", c: "orange" }, { i: "flag", t: "Two claims", c: "red" }, { i: "map", t: "Taiwan", c: "orange" }]) },

      { type: "choice", skill: "Maps",
        prompt: "You're making a map for a school atlas, and it includes Crimea.<br><br>Which choice shows the most care?",
        options: [{ t: "Mark it as disputed, and say who claims it" },
                  { t: "Color it as part of whichever country you prefer", fb: "Then your map takes a side without telling the reader — exactly what makes maps misleading." },
                  { t: "Leave Crimea off the map", fb: "Hiding a place doesn't make the dispute go away, and it misleads the reader." }],
        answer: 0,
        hints: ["Which choice tells the reader the truth — that the place is contested?"],
        why: "An honest map shows the dispute: it marks the place as contested and says who claims it." },

      { type: "explain", kicker: "Put it together",
        prompt: "In your own words: why is a map evidence about its *maker*, not just about the land?",
        model: "Every map is made by someone who chooses what to put in the middle, what to stretch or leave out, and whose claims to show. Those choices reveal the maker's point of view and purpose." }
    ]
  };

  /* Practice: reading maps as evidence. */
  var L4_REG = [
    ["Greenland", 72, "far"], ["Canada", 60, "far"], ["Russia", 62, "far"], ["Scandinavia", 64, "far"], ["Alaska", 64, "far"],
    ["Central Africa", 2, "near"], ["Brazil", -10, "near"], ["India", 20, "near"], ["Indonesia", -2, "near"], ["Colombia", 4, "near"]
  ];
  var L4_STRETCH = [[45, "About 2 times"], [60, "About 4 times"], [70, "About 8 times"]];
  var L4_SCEN = [
    ["A map made for a king shows his kingdom in the center, painted gold, with neighbors squeezed to the edges.", "How the king wanted his kingdom to be seen"],
    ["A European map from the 1700s leaves the middle of Africa blank.", "How little its maker knew about that region — not that nobody lived there"],
    ["A sailor's chart shows every bay along a coast but nothing at all inland.", "What sailors needed — the map was made for its purpose"],
    ["A map made by a country at war shows a disputed valley as its own.", "That country's claim to the valley, not an agreed fact"],
    ["Two rival countries publish maps that draw their shared border in different places.", "Each country's claim — a historian compares them"],
    ["A medieval Christian world map puts Jerusalem at its center.", "The religious view of the world held by its makers"],
    ["A modern map shows one border as a dotted line.", "That the border is disputed or not agreed"],
    ["A map printed for tourists shows only hotels, beaches and museums.", "What its makers chose to show for their purpose"],
    ["A colonial map labels a region with a European company's name.", "Who claimed power over the region at the time"],
    ["A city map from 1850 shows factories where there are parks today.", "What the city was like, and what its maker thought worth showing, in 1850"]
  ];
  var L4_WRONG = [
    ["Exactly what the land was really like", "A map shows what its maker saw, knew and wanted — check other sources before trusting it as fact."],
    ["Nothing — a biased map is useless as evidence", "Bias is itself evidence: it shows its maker's view and purpose."],
    ["That the mapmaker was careless", "Mapmakers choose what to show on purpose. The choices tell you about them."],
    ["The true size of every place on it", "Every flat map distorts something, and a map's choices reflect its maker."]
  ];
  SKILLS.push({ id: "hist1-maps", title: "Maps as evidence", lesson: 4,
    gen: function (R, i) {
      var form = i >= 3 ? R.pick([0, 1, 2, 3]) : i;
      if (form === 0) {
        var far = R.pick(L4_REG.filter(function (r) { return r[2] === "far"; })), near = R.pick(L4_REG.filter(function (r) { return r[2] === "near"; }));
        var ask = R.chance(0.5);
        return mc(R, {
          prompt: ask ? "On a Mercator map, which of these is stretched the most — drawn much **bigger** than it really is?"
                      : "On a Mercator map, which of these is drawn **closest to its true size**?",
          right: ask ? far[0] : near[0],
          wrong: [{ t: ask ? near[0] : far[0], fb: (ask ? near[0] + " is near the equator, where Mercator stretches least — it's drawn close to its true size."
                                                     : far[0] + " is far from the equator, where Mercator stretches most — it's drawn much bigger than it is.") }],
          hints: ["Mercator stretches places more the farther they are from the equator."],
          why: (ask ? far[0] + " lies far from the equator, so the map stretches it: it's drawn much bigger than it is."
                    : near[0] + " lies near the equator, where Mercator barely stretches — so it's drawn close to its true size, and looks small beside the inflated north.") });
      }
      if (form === 1) {
        var s = R.pick(L4_STRETCH);
        return mc(R, {
          prompt: "On a Mercator map, a country near the equator is drawn about true to size.<br><br>If the same country were moved to latitude " + s[0] + "° north, how big would it look?",
          right: s[1] + " bigger",
          wrong: L4_STRETCH.filter(function (x) { return x !== s; }).map(function (x) { return { t: x[1] + " bigger", fb: "At " + x[0] + "° the stretch would be " + x[1].toLowerCase() + ". At " + s[0] + "° it's " + s[1].toLowerCase() + "." }; })
            .concat([{ t: "The same size", fb: "That's true on a globe, but Mercator stretches places more and more toward the poles." }]),
          hints: ["The farther from the equator, the bigger the stretch — and it grows fast near the poles."],
          why: "Mercator stretches area more and more away from the equator: about 2 times at 45°, 4 times at 60°, and 8 times at 70°." });
      }
      if (form === 2) {
        var sc = R.pick(L4_SCEN), w = sample(R, L4_WRONG, 3);
        return mc(R, { prompt: sc[0] + "<br><br>What is this map best evidence of?", right: sc[1],
          wrong: w.map(function (x) { return { t: x[0], fb: x[1] }; }),
          hints: ["Ask what the mapmaker knew, wanted, or needed the map for."],
          why: "A map reflects its maker's knowledge, purpose and point of view. Here: " + sc[1].charAt(0).toLowerCase() + sc[1].slice(1) + "." });
      }
      var pairs = [["Crimea", "Ukraine and Russia"], ["Taiwan", "its own government and China"]], p = R.pick(pairs);
      return mc(R, {
        prompt: p[0] + " is claimed by " + p[1] + ".<br><br>Which is the most honest way to show it on a map?",
        right: "Mark it as disputed and name the claims",
        wrong: [{ t: "Show it as belonging to one side, with no note", fb: "That takes a side without telling the reader." },
                { t: "Leave it off the map", fb: "Hiding the place hides the dispute too — the reader is misled." },
                { t: "Split it down the middle", fb: "Neither side agrees to that — inventing a border takes a side of its own." }],
        hints: ["Which choice tells the reader the truth — that the place is contested?"],
        why: "An honest map shows that " + p[0] + " is disputed and says who claims it." });
    } });

  /* ============================================================ Lesson 5
     Interactive. Primary and secondary sources — and why the same source
     can be either, depending on the question (section 1.2). */
  LESSONS[5] = {
    title: "Primary or secondary?",
    blurb: "Sources made at the time versus sources made later — and why the same source can be both.",
    mins: 9,
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Maps",
        prompt: "On a Mercator map, Greenland looks nearly as big as Africa.<br><br>Why?",
        options: [{ t: "Mercator stretches places more the farther they are from the equator" },
                  { t: "Greenland really is about that big", fb: "Africa is about 14 times bigger. The map inflates Greenland because it's so far north." },
                  { t: "The mapmaker made a careless mistake", fb: "It was a deliberate trade-off: true compass directions for sailors, paid for with stretched sizes." }],
        answer: 0,
        hints: ["Remember what happened when you dragged Greenland south."],
        why: "Mercator's map keeps directions true for sailors by stretching sizes toward the poles — so far-north Greenland is inflated." },

      { type: "choice", kicker: "Guess first",
        prompt: "You need to find out exactly what happened at a car crash.<br><br>Whose account would you trust most?",
        art: tiles([{ i: "eye", t: "Saw it", c: "green" }, { i: "clock", t: "Told it when?", c: "orange" }, { i: "ear", t: "Heard about it", c: "purple" }]),
        options: [{ t: "A witness who saw it, interviewed the same day" },
                  { t: "A witness who saw it, interviewed five years later", fb: "They saw it — but over five years memories fade, shift, and get mixed with what others said." },
                  { t: "Someone who heard about it from a friend", fb: "Secondhand: they weren't there, so they can only pass on someone else's story." }],
        answer: 0,
        hints: ["Two things matter: were they there, and how fresh is the memory?"],
        why: "The best witness was there and told it while it was fresh.<br>Memories fade and change over time, and secondhand stories are further from the event." },

      { type: "learn", kicker: "New words",
        prompt: "Historians sort their witnesses the same way. Turn over both cards.",
        scene: { type: "turn", cols: 2, cards: [
          { i: "scroll", name: "Primary source", t: "Made **at the time** you're studying, by people who lived it: a diary, a law, a photo, a pot.", c: "orange" },
          { i: "book", name: "Secondary source", t: "Made **later**, looking back — usually built from primary sources: a textbook, a biography, a documentary.", c: "blue" }] },
        gate: true,
        then: "Primary sources are closest to the events — like the witness interviewed the same day — so historians value them most. Secondary sources help explain them." },

      { type: "sort", skill: "Primary or secondary",
        prompt: "You're studying **ancient Egypt**.<br><br>Sort these sources.",
        bins: ["Primary", "Secondary"],
        cards: [{ t: card("bust", "A statue of a pharaoh, carved in his lifetime"), bin: 0, fb: "It was made in the pharaoh's own time — primary." },
                { t: card("scroll", "Hieroglyphs on a temple wall about the pharaoh's reign"), bin: 0, fb: "Carved during the reign it describes — primary." },
                { t: card("painting", "A tomb painting of farmers harvesting grain"), bin: 0, fb: "Painted by Egyptians at the time — primary." },
                { t: card("book", "A biography of the pharaoh written in 1990"), bin: 1, fb: "Written more than 3,000 years later, looking back — secondary." },
                { t: card("film", "A TV documentary about the pyramids"), bin: 1, fb: "Made recently, about the distant past — secondary." },
                { t: card("web", "A museum curator's blog post about Egyptian art"), bin: 1, fb: "A modern expert writing about old objects — secondary." }],
        hints: ["Ask of each one: was it made in ancient Egypt, or much later?"],
        why: "Statue, hieroglyphs and tomb painting were made at the time: primary.<br>The biography, documentary and blog look back: secondary." },

      { type: "choice", kicker: "Careful", skill: "Primary or secondary",
        prompt: "A map drawn in **1960** shows the battles of World War II (1939–1945).<br><br>For studying the war, is it primary or secondary?",
        options: [{ t: "Secondary — it was made after the war, looking back" },
                  { t: "Primary — it's more than sixty years old", fb: "Old isn't the same as primary. What matters is whether it was made *at the time you're studying* — and the war was over by 1960." }],
        answer: 0, keep: true,
        hints: ["Was the map made during the war, or after it?"],
        why: "It was drawn fifteen years after the war ended, looking back.<br>For the war, it's a secondary source — however old it is." },

      { type: "learn", kicker: "Look",
        prompt: "Now watch the same 1960 map change sides. Turn over both cards.",
        scene: { type: "turn", cols: 2, cards: [
          { i: "sword", name: "Question 1", t: "*What happened in World War II?*<br>The 1960 map is **secondary**: it was made after the war.", c: "blue" },
          { i: "calendar", name: "Question 2", t: "*How did people in 1960 picture the war?*<br>The same map is **primary**: it was made in 1960.", c: "orange" }] },
        gate: true,
        then: "A source isn't primary or secondary on its own. It depends on **the question you're asking**." },

      { type: "choice", skill: "Primary or secondary",
        prompt: "A historian studies how Americans in the 1970s remembered the 1960s.<br><br>For this question, a history of the 1960s written in 1975 is…",
        options: [{ t: "A primary source" },
                  { t: "A secondary source", fb: "For the 1960s themselves it would be secondary. But this historian studies the *1970s* — and the book was written then." }],
        answer: 0, keep: true,
        hints: ["Which time is the historian studying? When was the book written?"],
        why: "The question is about the 1970s, and the book was written in 1975.<br>So for this question, it's a primary source." },

      { type: "learn", kicker: "Why it works",
        prompt: "If primary sources are closest to events, why read secondary ones at all? Turn over each card.",
        scene: { type: "turn", cols: 3, cards: [
          { i: "globe", name: "Context", t: "They place an event among the others of its time.", c: "blue" },
          { i: "link", name: "Connections", t: "They link topics you might never have put together.", c: "green" },
          { i: "search", name: "Access", t: "They bring you research on sources in languages or places you can't reach.", c: "purple" }] },
        gate: true,
        then: "Good research uses both — and reads what other historians have argued. The study of how historians have interpreted the past is called **historiography**." },

      { type: "multi", skill: "Primary or secondary",
        prompt: "You're studying teenagers' lives in **2020**.<br><br>Which of these are primary sources?",
        options: [{ t: card("phone", "A video a 15-year-old posted in 2020"), ok: true, fb: "Made by a teenager in 2020 — primary." },
                  { t: card("diary", "A diary a student kept during 2020"), ok: true, fb: "Written at the time by someone living it — primary." },
                  { t: card("cap", "A school yearbook from 2020"), ok: true, fb: "Made that year by the school's students — primary." },
                  { t: card("book", "A history of the 2020s written in 2045"), ok: false, fb: "Written 25 years later, looking back — secondary." },
                  { t: card("film", "A 2050 documentary about teenage life in the pandemic"), ok: false, fb: "Made decades later — secondary." }],
        hints: ["Which were made *in* 2020?"],
        why: "The video, diary and yearbook were made in 2020: primary.<br>The 2045 history and 2050 documentary look back: secondary." },

      { type: "explain", kicker: "Put it together",
        prompt: "In your own words: why can the same source be primary for one question and secondary for another?",
        model: "Whether a source is primary depends on the time you're studying. A book written in 1975 is secondary for the 1960s, but primary if you're studying the 1970s — because it was made then." }
    ]
  };

  /* Practice: primary or secondary, for a given question. */
  var L5_BANK = [
    { topic: "ancient Egypt", p: ["A statue of a pharaoh carved in his lifetime", "Hieroglyphs on a temple wall about a pharaoh's victories", "A tomb painting of farmers harvesting grain"],
      s: [["A biography of the pharaoh Ramses II written in 1990", 1990], ["A documentary about the pyramids", null], ["A museum blog post about Egyptian jewelry", null]] },
    { topic: "the Roman Empire", p: ["A coin stamped with the emperor Augustus's face", "A letter written by a Roman senator", "Graffiti scratched on a wall in Pompeii"],
      s: [["A novel about a gladiator written in 2005", 2005], ["A film set in ancient Rome, made in 1959", 1959], ["A historian's 2015 book on Roman trade", 2015]] },
    { topic: "the Spanish conquest of Mexico (1519–1521)", p: ["Hernán Cortés's letters to the king of Spain", "An Aztec account of the conquest, written down in the 1500s", "A Spanish soldier's memoir of the march to Tenochtitlán"],
      s: [["A 2019 book by a historian of the Aztec Empire", 2019], ["A museum website about Tenochtitlán", null], ["A 1990s TV documentary on the conquest", null]] },
    { topic: "World War II", p: ["A soldier's letter home from the front in 1944", "Franklin Roosevelt's speech to Congress on December 8, 1941", "A photo of Pearl Harbor taken during the attack"],
      s: [["A map of the war's battles drawn in 1960", 1960], ["A film about Pearl Harbor made in 2001", 2001], ["A textbook chapter on the war", null]] },
    { topic: "the Black Death (1347–1351)", p: ["A doctor's notes on his patients, written in 1348", "A town's list of burials from 1349", "A poem written by a survivor in 1350"],
      s: [["A historian's 2008 book on the plague", 2008], ["A podcast episode about the Black Death", null], ["A scientists' 2011 study of plague DNA from old graves", 2011]] },
    { topic: "China under the Han dynasty", p: ["A Han tax record written on bamboo strips", "A bronze mirror made in a Han workshop", "A letter from a Han official to the emperor"],
      s: [["A documentary about the Silk Road made in 2010", 2010], ["A textbook map of the Han Empire", null], ["A novel set in Han China, written in 1995", 1995]] },
    { topic: "the US civil rights movement of the 1960s", p: ["A newspaper photo of a 1963 march", "A speech recorded at a rally in 1963", "A protester's diary from 1965"],
      s: [["A film about the march at Selma, made in 2014", 2014], ["A historian's 2006 biography of a civil rights leader", 2006], ["A lesson website about the movement", null]] },
    { topic: "Hagia Sophia's first centuries", p: ["A mosaic made inside the church in the 900s", "A description of the church by a writer who watched it being built", "The building's own dome and walls"],
      s: [["A news article about the building, written in 2020", 2020], ["An architect's modern drawing of how the dome was built", null], ["A travel guide to Istanbul", null]] }
  ];
  // A two-way question, always in the order Primary, Secondary.
  function l5two(o, prim, fb) {
    o.type = "choice";
    o.options = [{ t: "Primary", fb: prim ? undefined : fb }, { t: "Secondary", fb: prim ? fb : undefined }];
    o.answer = prim ? 0 : 1;
    o.keep = true;
    return o;
  }
  SKILLS.push({ id: "hist1-primary", title: "Primary or secondary", lesson: 5,
    gen: function (R, i) {
      var b = R.pick(L5_BANK), form = i === 2 ? 1 : i >= 3 ? R.pick([0, 1, 2]) : 0;
      if (form === 1) {
        var ps = sample(R, b.p, 2), ss = sample(R, b.s, 2);
        return { type: "sort",
          prompt: "You're studying **" + b.topic + "**.<br><br>Sort these sources.",
          bins: ["Primary", "Secondary"],
          cards: R.shuffle(ps.map(function (t) { return { t: card("scroll", t), bin: 0, fb: "“" + t + "” was made at the time — primary." }; })
            .concat(ss.map(function (x) { return { t: card("book", x[0]), bin: 1, fb: "“" + x[0] + "” was made later, looking back — secondary." }; }))),
          hints: ["For each one: was it made during " + b.topic + ", or later?"],
          why: "Made at the time: " + ps.join("; ") + " — primary.<br>Made later: " + ss.map(function (x) { return x[0]; }).join("; ") + " — secondary." };
      }
      if (form === 2) {
        var dated = [];
        L5_BANK.forEach(function (bb) { bb.s.forEach(function (x) { if (x[1]) dated.push({ t: x[0], y: x[1], topic: bb.topic }); }); });
        var d = R.pick(dated);
        return l5two({
          prompt: "“" + d.t + ".”<br><br>A historian is studying how people around **" + d.y + "** looked back on " + d.topic + ". For that question, is this source primary or secondary?",
          hints: ["Which time is the historian studying? When was the source made?"],
          why: "The question is about views in " + d.y + ", and the source was made in " + d.y + ".<br>So for this question, it's primary." },
          true, "It would be secondary for " + d.topic + " itself. But the question is about " + d.y + " — and it was made then.");
      }
      var prim = R.chance(0.5), src = prim ? R.pick(b.p) : R.pick(b.s)[0];
      return l5two({
        prompt: "You're studying **" + b.topic + "**.<br><br>“" + src + ".” Is it a primary or a secondary source?",
        hints: ["Was it made during " + b.topic + ", or later?"],
        why: prim ? "It comes from the time being studied, so it's a primary source." : "It was made after the time being studied, looking back, so it's a secondary source." },
        prim, prim ? "It was made at the time, by people living through it — that makes it primary." : "It was made later, looking back — so for this topic it's secondary, however useful it is.");
    } });

  /* ============================================================ Lesson 6
     Reading. Objects as evidence: Hagia Sophia read across its four lives —
     iconography, conquest, museum, mosque again (section 1.2, "an image
     exercise"). */
  LESSONS[6] = {
    title: "A building that tells time",
    blurb: "Read one building across fifteen centuries — church, mosque, museum, mosque — and see what objects can tell us.",
    mins: 10, kind: "read",
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Primary or secondary",
        prompt: "Someone took a photograph of Hagia Sophia last year.<br><br>It's a primary source for…",
        options: [{ t: "What the building looks like today" },
                  { t: "How the building looked when it was finished in 537", fb: "A photo from last year can't show 537. It's primary evidence for the building *now*." },
                  { t: "Nothing — photographs aren't sources", fb: "Photographs are primary sources for the moment they were taken." }],
        answer: 0,
        hints: ["A primary source comes from the time you're studying. When was the photo made?"],
        why: "The photo was made last year, so it's a primary source for how the building looks today." },

      read({ title: "Evidence you can walk into", kicker: "Read · 1 of 4", blocks: [
        "Not every primary source is written. Buildings, statues, pots and paintings are evidence too — but they don't explain themselves. You read them the way you read a poem: the surface first, then what lies underneath.",
        "Hagia Sophia, in the city now called Istanbul, is one of the richest objects there is. Its name is Greek for “Holy Wisdom.” It went up in just five years, from 532 to 537 CE, for the emperor [[Justinian I|Ruler, from 527 to 565 CE, of the Byzantine Empire — the eastern half of the old Roman Empire, which outlived the west by a thousand years.]].",
        ["fig", "hagiaold", "Hagia Sophia as Justinian's builders made it. Domes this size often fell down; this one partly collapsed in an earthquake in 558 and was rebuilt higher."],
        "Its dome, more than 30 meters across, seemed to float above the floor on a ring of forty windows. Nothing like it had been built before."
      ] }),
      { type: "choice", kicker: "Check", skill: "Objects as evidence",
        prompt: "Picture a poor farmer walking into Hagia Sophia in 540 CE.<br><br>What would the building most likely tell them?",
        options: [{ t: "That the emperor and the Church were enormously rich and powerful" },
                  { t: "That the empire was about to fall", fb: "A gleaming new church, the biggest anywhere, says the opposite: power and confidence." },
                  { t: "That farmers were the most honored people in the empire", fb: "The building honors God and the emperor who paid for it — not farmers." }],
        answer: 0,
        hints: ["What does a huge, brand-new, gold-lit building say about whoever built it?"],
        why: "Its size, gold and engineering announced the wealth and power of the emperor and the Church — and the awe of their God." },

      read({ title: "Pictures that teach", kicker: "Read · 2 of 4", blocks: [
        "Inside, the walls shone with [[mosaics|Pictures made from thousands of tiny pieces of colored stone and glass.]] set with gold. Most people of the time could not read, so churches told their stories in pictures.",
        "Those pictures had a language of their own, called [[iconography|The images and symbols used in a work of art, and what they mean.]]. A halo around a head meant holiness. Gold meant heaven — and wealth.",
        ["fig", "mosaic", "A mosaic from the 900s. Mary holds the child Jesus between two emperors: Constantine offers her his city, and Justinian offers her the church."],
        ["ask", "What would this building make you think if you were a poor farmer? A rich merchant? A king from a rival land?"]
      ] }),
      { type: "choice", kicker: "Check", skill: "Objects as evidence",
        prompt: "Why did churches of this time tell their stories mostly in pictures?",
        options: [{ t: "Most people couldn't read" },
                  { t: "Writing hadn't been invented yet", fb: "Writing was thousands of years old by then — but most ordinary people had never learned to read." },
                  { t: "Pictures were cheaper than words", fb: "Gold mosaics were anything but cheap! Pictures reached the many people who couldn't read." }],
        answer: 0,
        hints: ["Think about who came to church, and what they could and couldn't do."],
        why: "Most people couldn't read, so pictures — and their iconography — carried the stories." },

      { type: "learn", kicker: "Look",
        prompt: "The building has lived four lives. Step through them and watch what each one added.",
        scene: { type: "layers" }, gate: true,
        then: "Each age left its mark on the building. That makes it a stack of primary sources — one for each of its lives." },

      read({ title: "1453: a new layer", kicker: "Read · 3 of 4", blocks: [
        "In 1453, the Ottoman sultan [[Mehmed II|Ruler of the Ottoman Empire, who conquered Constantinople in 1453 at the age of 21.]] conquered the city. Accounts from the time say he admired the church and saved it from being destroyed.",
        "He made it a mosque. That followed a long custom in the Middle East of reusing sacred places — and Muslims see their faith as continuing the line of Abraham, Moses and Jesus.",
        "Within about 125 years, four [[minarets|Tall, slender towers of a mosque, from which the call to prayer goes out.]] rose at its corners. In time, Arabic writing appeared beside the old Christian art.",
        ["figs", ["hagianow", "Hagia Sophia today, with its four minarets."], ["hagiain", "Inside: huge round panels of Arabic writing, beside older Christian art."]]
      ] }),
      { type: "choice", kicker: "Check", skill: "Objects as evidence",
        prompt: "Which part of today's Hagia Sophia was *not* there when Justinian's builders finished it?",
        options: [{ t: "The four minarets" },
                  { t: "The great central dome", fb: "The dome is Justinian's — repaired after 558, but part of the church from the start." },
                  { t: "The arched windows", fb: "The windows are part of the original building." }],
        answer: 0,
        hints: ["What did the Ottomans add after 1453?"],
        why: "The minarets were added after the Ottoman conquest of 1453, when the church became a mosque." },

      read({ title: "A building still being argued over", kicker: "Read · 4 of 4", blocks: [
        "In 1934, the new Republic of Turkey turned Hagia Sophia into a museum. Mosaics hidden for centuries under plaster were uncovered and shown beside the Arabic panels.",
        "In 2020, it became a mosque again. Prayers returned, and the mosaics are covered during prayer times.",
        "Each change tells historians something about the people who made it. That is why one building can be a primary source for fifteen centuries — and why, without its context, even a building this grand says far less."
      ] }),
      { type: "order", kicker: "Check",
        prompt: "Put Hagia Sophia's four lives in order, **earliest first**.",
        items: ["A church, built for the emperor Justinian", "A mosque, after the Ottoman conquest", "A museum, under the Republic of Turkey", "A mosque once more"],
        hints: ["Start with the emperor who built it."],
        why: "Church (537) → mosque (1453) → museum (1934) → mosque again (2020)." },

      { type: "explain", kicker: "Put it together",
        prompt: "In your own words: why is Hagia Sophia a primary source for more than one period of history?",
        model: "Each age that used it — Byzantine, Ottoman, modern Turkish — added or changed something. So the building holds evidence from each of those times, not just from when it was built." }
    ]
  };

  /* Practice: what an object can — and can't — tell us. */
  var L6_OBJ = [
    ["A gold crown found in a king's tomb", "The king's family was very wealthy and could pay skilled goldsmiths",
      [["Everyone in the kingdom was rich", "One crown shows the king's wealth — not everyone's."], ["The king was kind to his people", "A crown can't tell you how a king treated anyone."]]],
    ["A clay jar with traces of wine inside, found in a farmhouse", "People in that house stored or drank wine",
      [["The whole region was famous for its wine", "One jar in one house can't tell you what a whole region was known for."], ["The farmer made the jar himself", "Nothing here says who made the jar — it could have been bought."]]],
    ["A statue of a ruler carved twice as tall as the people around him", "The ruler wanted to be seen as greater than ordinary people",
      [["The ruler was a giant", "Size in art signals importance, not real height."], ["Everyone loved the ruler", "A statue shows how the ruler wanted to be seen, not how people felt."]]],
    ["Roman coins found in a market town in southern India", "The town traded, directly or through others, with the Roman world",
      [["The Romans ruled India", "Coins travel with trade. They don't show who governed."], ["Everyone in the town spoke Latin", "Coins show trade, not the language people spoke."]]],
    ["Children's toys dug up in an ancient workers' village", "Workers there lived with their families",
      [["Children did no work at all", "Toys show children played — not that they never worked."], ["The builders were all enslaved", "Toys can't tell you whether the workers were free."]]],
    ["A city wall built in a hurry, with broken statues used as stones", "The city felt threatened and needed a wall fast",
      [["The people hated art", "They reused stone in a crisis — that says more about fear than taste."], ["The city was destroyed soon after", "The wall shows fear of attack, not what happened next."]]],
    ["A shopkeeper's price list scratched on a wall", "What some goods cost in that town at that time",
      [["Prices were the same all over the empire", "One town's list can't speak for a whole empire."], ["The shopkeeper was the richest person in town", "A price list shows prices, not the owner's wealth."]]],
    ["A cemetery where some graves are rich with gold and others hold nothing", "The society had big differences in wealth",
      [["Poor people didn't care about their dead", "Plain graves show little money, not little love."], ["The rich graves belonged to kings", "Rich graves show wealth — not necessarily royalty."]]],
    ["Election slogans painted on walls in Pompeii", "Ordinary townspeople cared about local elections",
      [["Rome was a democracy just like today's", "Local slogans show some voting — not a modern democracy."], ["Every person in Pompeii could vote", "Slogans show there were elections, not who was allowed to vote."]]],
    ["Chinese silk found in the grave of a wealthy Roman woman", "Luxury goods reached Rome through long-distance trade",
      [["All Romans wore silk", "Silk in one wealthy grave shows a luxury, not what everyone wore."], ["Romans traveled to China to buy it", "Goods passed through many traders' hands; this doesn't show who traveled."]]],
    ["A church later turned into a mosque, with minarets added", "A new faith took over the building but chose to keep it",
      [["The two faiths had never met before", "The building shows one took over from the other, not that they'd never met."], ["The new rulers hated the old building", "They kept it and added to it — the opposite of hating it."]]],
    ["A mosaic showing an emperor offering a model of a church to Mary", "The emperor wanted to be seen as devoted to God and generous to the Church",
      [["The emperor built the church with his own hands", "Offering a model means he paid for it — builders did the work."], ["Mary appeared to the emperor", "The mosaic is a symbol, not a record of an event."]]]
  ];
  var L6_ICON = [["A halo around a figure's head", "The figure is holy"], ["A gold background", "Heaven, and great wealth"],
                 ["A figure drawn much larger than the others", "That figure is the most important"], ["A crown on a figure's head", "Royal power"],
                 ["A figure holding a model of a building", "That person paid for, or founded, the building"]];
  SKILLS.push({ id: "hist1-objects", title: "Objects as evidence", lesson: 6,
    gen: function (R, i) {
      if (i === 2 || (i >= 3 && R.chance(0.3))) {
        var ic = R.pick(L6_ICON), rest = sample(R, L6_ICON.filter(function (x) { return x !== ic; }), 3);
        return mc(R, { prompt: "In Christian art of Hagia Sophia's time, what does this most likely signal?<br><br>" + ic[0] + ".",
          right: ic[1], wrong: rest.map(function (x) { return { t: x[1], fb: "That's what " + x[0].charAt(0).toLowerCase() + x[0].slice(1) + " signals." }; }),
          hints: ["Iconography is a language of symbols. What was this symbol used for?"],
          why: ic[0] + " signals: " + ic[1].charAt(0).toLowerCase() + ic[1].slice(1) + "." });
      }
      var o = R.pick(L6_OBJ);
      if (i >= 3 && R.chance(0.5)) {
        // Which conclusion goes too far?
        var bad = R.pick(o[2]);
        return mc(R, { prompt: "Suppose archaeologists find this: **" + o[0].charAt(0).toLowerCase() + o[0].slice(1) + "**.<br><br>Which conclusion goes *too far*?",
          right: bad[0],
          wrong: [{ t: o[1], fb: "That one is safe — it stays within what the object actually shows." }],
          hints: ["An object can only prove what it directly shows. Which claim asks it to prove more?"],
          why: bad[1] });
      }
      return mc(R, { prompt: "Suppose archaeologists find this: **" + o[0].charAt(0).toLowerCase() + o[0].slice(1) + "**.<br><br>What can a historian safely conclude?",
        right: o[1], wrong: o[2].map(function (x) { return { t: x[0], fb: x[1] }; }),
        hints: ["Choose the claim the object directly supports — nothing more."],
        why: "The object supports only this: " + o[1].charAt(0).toLowerCase() + o[1].slice(1) + ". Bigger claims need more evidence." });
    } });

  /* ============================================================ Lesson 7
     Interactive. The four questions — author, audience, intent, context —
     and judging sources online (section 1.2). */
  LESSONS[7] = {
    title: "Four questions for any source",
    blurb: "Author, audience, intent, context: the questions that turn a document into evidence — and a way to judge what you find online.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Objects as evidence",
        prompt: "In Hagia Sophia's mosaics, a halo meant holiness and gold meant heaven.<br><br>What do we call a picture-language like that?",
        options: [{ t: "Iconography" },
                  { t: "Historiography", fb: "Historiography is the study of how historians have interpreted the past. The picture-language of art is iconography." },
                  { t: "Rhetoric", fb: "Rhetoric is about choosing *words*. The language of images and symbols is iconography." }],
        answer: 0,
        hints: ["It starts like *icon*."],
        why: "Iconography is the set of images and symbols in a work of art, and what they mean." },

      { type: "choice", kicker: "Guess first",
        prompt: "You find a text message: *“Great news!! Everything went perfectly — don't worry about a thing.”*<br><br>What would you most want to know before believing it?",
        art: tiles([{ i: "phone", t: "A message", c: "blue" }, { i: "question", t: "True?", c: "orange" }]),
        options: [{ t: "Who sent it, who it was for, and what was going on" },
                  { t: "How many exclamation marks it has", fb: "Punctuation shows excitement, not truth. You'd want to know who sent it, to whom, and why." },
                  { t: "Nothing — it says everything went perfectly", fb: "People sometimes write to calm someone down. Who sent it, to whom and why all matter." }],
        answer: 0,
        hints: ["Would it matter if it was sent to a worried parent?"],
        why: "A message is only as believable as what you know about its sender, its reader, its purpose and its moment." },

      { type: "learn", kicker: "Try it",
        prompt: "Here is part of a letter from 1520. Ask it each of the four questions.",
        scene: { type: "probe",
          source: { title: "Second letter to King Charles V of Spain", who: "Hernán Cortés", when: "1520", i: "letter",
                    text: "They declared their desire to become vassals of your Majesty, and to form an alliance with me. They also begged me to protect them against that mighty Lord, who used violent and tyrannical measures to keep them in subjection." },
          qs: [{ k: "author", a: "**Hernán Cortés**, a Spanish conquistador. He had set out against his own governor's orders, so he badly needed the king on his side." },
               { k: "audience", a: "**King Charles V** — the one man who could reward Cortés with riches and titles, or punish him." },
               { k: "intent", a: "To win the king's favor: to make the conquest sound welcome, and himself loyal and successful." },
               { k: "context", a: "The middle of a war of conquest in Mexico, an ocean away from anyone who could check his story." }] },
        gate: true,
        then: "**Author, audience, intent, context.** These four questions work on any source — a letter, a law, a painting, a text message." },

      { type: "sort", skill: "Four questions",
        prompt: "Sort these questions under the four headings.",
        bins: ["Author", "Audience", "Intent", "Context"],
        cards: [{ t: "Who wrote it, and what was their background?", bin: 0, fb: "That's about the writer — **author**." },
                { t: "Was the writer there, or did they only hear about it?", bin: 0, fb: "Whether the writer witnessed it is about the **author**." },
                { t: "Was it meant to be public or private?", bin: 1, fb: "Public or private is about who it was for — **audience**." },
                { t: "Who was it written for?", bin: 1, fb: "That's the **audience**." },
                { t: "Was it written to persuade, or just to record?", bin: 2, fb: "Why it was written is its **intent**." },
                { t: "Was there a war or a crisis at the time?", bin: 3, fb: "What was going on around it is the **context**." }],
        hints: ["Author = who. Audience = for whom. Intent = why. Context = when and amid what."],
        why: "Author: who wrote it, and were they there.<br>Audience: who it was for, public or private.<br>Intent: why it was written.<br>Context: what was happening at the time." },

      { type: "choice", skill: "Four questions",
        prompt: "In a group chat, a student writes: *“that test was a joke.”* To her teacher she emails: *“The test was fair.”*<br><br>Which of the four questions best explains the difference?",
        options: [{ t: "Audience" },
                  { t: "Context", fb: "Same test, same week — the moment didn't change. Who she was writing *to* did." },
                  { t: "Author", fb: "Same writer both times. What changed was who would read it." }],
        answer: 0,
        hints: ["What changed between the two messages?"],
        why: "Same writer, same test, different reader. The audience shapes what people write." },

      { type: "choice", skill: "Four questions",
        prompt: "A king's official history says his army won every single battle it ever fought.<br><br>Which question should make you most suspicious?",
        options: [{ t: "Intent — it was written to make the king look good" },
                  { t: "Audience — who read it?", fb: "Worth asking, but the biggest warning sign is *why* it was written: to glorify the king." },
                  { t: "Context — was it written in peacetime?", fb: "The time matters less here than the purpose: an official history is written to praise." }],
        answer: 0,
        hints: ["Why do kings pay for official histories?"],
        why: "An official history is written to praise its ruler, so its intent makes “won every battle” hard to trust without other sources." },

      { type: "learn", kicker: "New skill",
        prompt: "The same questions help you judge what you find online. Turn over each card.",
        scene: { type: "turn", cols: 4, cards: [
          { i: "person", name: "Who made it?", t: "A scholar, museum or university is a good sign. No name at all is a warning.", c: "blue" },
          { i: "link", name: "Is it cited?", t: "A strong source tells you where its information came from.", c: "green" },
          { i: "check", name: "Corroborate", t: "Check that other reliable sources say the same thing.", c: "orange" },
          { i: "book", name: "Just a start", t: "Encyclopedias and wikis are springboards: follow their references to better sources.", c: "purple" }] },
        gate: true,
        then: "Your work is only as strong as your sources. Not sure about one? Ask a librarian — they help online too." },

      { type: "choice", skill: "Reliable sources",
        prompt: "You need the year Hagia Sophia was finished.<br><br>Which source should you trust most?",
        options: [{ t: "A museum's website that lists its sources" },
                  { t: "An anonymous post with no sources", fb: "No author and no sources — there's no way to check it." },
                  { t: "A video game set in old Istanbul", fb: "Games can be well researched, but they're built to entertain, not to report facts." },
                  { t: "The first search result, whatever it is", fb: "Coming first in a search doesn't make a page reliable." }],
        answer: 0,
        hints: ["Which one tells you who made it *and* where its facts come from?"],
        why: "A museum is an expert maker, and listing sources lets you check the facts." },

      { type: "multi", skill: "Reliable sources",
        prompt: "Which of these are good signs that a website is a strong source?",
        options: [{ t: card("museum", "It's run by a university or a museum"), ok: true, fb: "Expert makers are a good sign." },
                  { t: card("link", "It says where its information came from"), ok: true, fb: "Citations let you check." },
                  { t: card("check", "Other reliable sources agree with it"), ok: true, fb: "Corroboration is a strong sign." },
                  { t: card("search", "It shows up first in a search"), ok: false, fb: "Search ranking isn't evidence of reliability." },
                  { t: card("heart", "It has lots of likes"), ok: false, fb: "Popularity isn't proof." },
                  { t: card("star", "It looks professional"), ok: false, fb: "Anyone can make a slick page. Check who made it and what it's based on." }],
        hints: ["Think: who made it, is it cited, do others agree?"],
        why: "Expert makers, citations and corroboration are real signs of a strong source.<br>Ranking, likes and polish are not." },

      { type: "choice", kicker: "Put it together",
        prompt: "Cortés told the king that the peoples he met were eager to become the king's subjects.<br><br>Using all four questions, what's the best conclusion?",
        options: [{ t: "It shows what Cortés wanted the king to believe — other sources are needed to know how those peoples felt" },
                  { t: "It proves those peoples welcomed Spanish rule", fb: "Think of his intent and audience: he gained a great deal by telling the king this." },
                  { t: "It's worthless, because Cortés had an agenda", fb: "Biased sources still tell us a lot — here, what Cortés wanted the king to think, and why." }],
        answer: 0,
        hints: ["What did Cortés stand to gain, and who was reading?"],
        why: "Author, audience and intent all point one way: Cortés needed the king's favor.<br>So the letter shows his story — and we need other voices for theirs." },

      { type: "explain", kicker: "In your own words",
        prompt: "Why can't a historian take a source's words at face value?",
        model: "Every source was made by someone, for someone, for a reason, at a particular moment. Asking about its author, audience, intent and context shows what it can really tell us — and what it might be leaving out." }
    ]
  };

  /* Practice: the four questions, and judging sources. */
  var L7_Q = [
    ["Who wrote it?", 0], ["What was the writer's background?", 0], ["Was the writer an eyewitness, or did they hear about it?", 0],
    ["What did the writer care about most?", 0], ["Was the writer a trained record-keeper or a participant?", 0],
    ["Who was it written for?", 1], ["Was it meant to be public or private?", 1], ["Was it a letter to a friend or a speech to a crowd?", 1],
    ["Who was expected to read or hear it?", 1], ["Would the writer have told it differently to someone else?", 1],
    ["Why was it written?", 2], ["Was it meant to persuade?", 2], ["Was it meant to record facts, or to entertain?", 2],
    ["Could it be a complete fake?", 2], ["Is the writer trying to make themselves look good?", 2],
    ["What was happening when it was written?", 3], ["Was it written in wartime or in peacetime?", 3],
    ["Was there a religious conflict or an economic crisis at the time?", 3], ["Was the writer under threat or pressure?", 3],
    ["Whose voices from that time are missing?", 3]
  ];
  var L7_NAMES = ["Author", "Audience", "Intent", "Context"];
  var L7_WHAT = ["who made it", "who it was for", "why it was made", "what was going on at the time"];
  var L7_SCEN = [
    ["A general's diary calls a battle he lost “an orderly retreat.”", 2, "He's describing a defeat in the kindest words for himself — that's about *why* he wrote it that way."],
    ["A soldier writes to his mother that life at the front is “fine, really.”", 1, "He's writing to his mother, and may not want her to worry — the reader shapes the message."],
    ["A newspaper report of a riot was written by a reporter who arrived the next day.", 0, "The writer wasn't an eyewitness — that's a question about the author."],
    ["A town wrote a letter praising its new ruler while his soldiers were camped in its streets.", 3, "Praise written under occupation may be forced — that's the context."],
    ["An advertisement from 1900 claims a tonic cures every illness.", 2, "It was written to sell — the intent explains the wild claim."],
    ["A leader describes the same decision differently in a private diary and in a public speech.", 1, "Private diary, public crowd: different audiences, different stories."],
    ["A monk in a quiet monastery describes a battle hundreds of miles away.", 0, "The author wasn't there — he's passing on what he heard."],
    ["A ruler's life story was written by his own son.", 0, "The writer is the ruler's son — his background shapes what he'd say."],
    ["A letter written during a famine begs the king to lower taxes.", 3, "The famine is what was going on — that context explains the plea."],
    ["A wartime poster shows the enemy as monsters.", 2, "It was made to stir people up against the enemy — that's its intent."],
    ["A message was written in code, for only one trusted reader.", 1, "It was meant for one person's eyes — a question of audience."],
    ["A report on a factory's safety was written by the factory's own owner.", 0, "The writer has an interest in the answer — a question about the author."]
  ];
  var L7_GOOD = ["A museum's website that lists its sources", "A university history department's article, with footnotes",
    "A book by a historian, with notes on every chapter", "A national archive's page, with scans of the original documents",
    "A library database of articles by historians"];
  var L7_WEAK = [
    ["An anonymous post with no sources", "No author and no sources — there's no way to check it."],
    ["A page that shows up first in a search", "Coming first in a search doesn't make a page reliable."],
    ["A video with millions of views but no sources", "Popularity isn't evidence."],
    ["A historical novel", "Novels invent scenes and people — they're written to entertain."],
    ["A slick website that sells souvenirs", "It's built to sell, and it doesn't say where its facts come from."],
    ["A comment from a stranger on a forum", "You can't tell who wrote it or check where it came from."],
    ["A meme", "A meme makes a point in a few words; it isn't built to report facts."],
    ["An online encyclopedia article with no citations", "A fine place to start — but with no citations you can't check it. Use it as a springboard."]
  ];
  var L7_ASK = ["when Hagia Sophia was finished", "what Franklin Roosevelt said to Congress on December 8, 1941", "when the UN adopted its Declaration of Human Rights",
    "how many people lived in Tenochtitlán in 1519", "what Herodotus wrote about the Persian Wars", "when the Ottomans took Constantinople",
    "what Sima Qian's history covers", "how the Berlin Conference of 1884–1885 divided Africa", "who designed Hagia Sophia's dome",
    "what Chinua Achebe's novel *Things Fall Apart* is about", "when Eleanor Roosevelt's committee finished its work", "how the Black Death spread in 1347"];
  SKILLS.push(
    { id: "hist1-aaic", title: "Four questions", lesson: 7,
      gen: function (R, i) {
        var form = i >= 3 ? R.pick([1, 2]) : i === 2 ? 1 : 0;
        if (form === 2) {
          var pick = [0, 1, 2, 3].map(function (k) { return R.pick(L7_Q.filter(function (q) { return q[1] === k; })); });
          return { type: "sort", prompt: "Sort these questions under the four headings.", bins: L7_NAMES.slice(),
            cards: R.shuffle(pick.map(function (q) { return { t: q[0], bin: q[1], fb: "This one asks " + L7_WHAT[q[1]] + " — **" + L7_NAMES[q[1]].toLowerCase() + "**." }; })),
            hints: ["Author = who. Audience = for whom. Intent = why. Context = when and amid what."],
            why: pick.map(function (q) { return L7_NAMES[q[1]] + ": “" + q[0] + "”"; }).join("<br>") };
        }
        var item, ans, why;
        if (form === 0) { item = R.pick(L7_Q); ans = item[1]; why = "“" + item[0] + "” asks " + L7_WHAT[ans] + " — that's **" + L7_NAMES[ans].toLowerCase() + "**."; }
        else { item = R.pick(L7_SCEN); ans = item[1]; why = item[2]; }
        return { type: "choice",
          prompt: form === 0 ? "“" + item[0] + "”<br><br>Which of the four questions is this?" : item[0] + "<br><br>Which of the four questions matters most here?",
          options: L7_NAMES.map(function (n, k) { return k === ans ? { t: n } : { t: n, fb: "**" + n + "** is about " + L7_WHAT[k] + ". " + (form === 0 ? "This question asks " + L7_WHAT[ans] + "." : "Look again at what makes this source tricky.") }; }),
          answer: ans, keep: true,
          hints: ["Author = who. Audience = for whom. Intent = why. Context = when and amid what."],
          why: why };
      } },

    { id: "hist1-reliable", title: "Reliable sources", lesson: 7,
      gen: function (R, i) {
        if (i >= 3 && R.chance(0.4)) {
          return mc(R, { prompt: "Two websites you trust give different dates for the same event.<br><br>What should you do?",
            right: "Check where each got its date, and look for more sources that agree",
            wrong: [{ t: "Pick the one you like better", fb: "Liking a page isn't a reason to trust it. Check each one's sources." },
                    { t: "Use whichever came up first in your search", fb: "Search order isn't evidence. Corroborate." },
                    { t: "Give up — the date can't be known", fb: "Disagreement is a reason to dig, not to quit. Check sources and corroborate." }],
            hints: ["What does *corroborate* mean?"],
            why: "When sources disagree, check where each got its information, and look for other reliable sources — corroboration." });
        }
        var good = R.pick(L7_GOOD), weak = sample(R, L7_WEAK, 3), ask = R.pick(L7_ASK);
        return mc(R, { prompt: "You need to find out " + ask + ".<br><br>Which source should you trust most?",
          right: good, wrong: weak.map(function (w) { return { t: w[0], fb: w[1] }; }),
          hints: ["Look for a source that says who made it and where its facts come from."],
          why: "“" + good + "” comes from experts and shows where its information came from, so you can check it." });
      } }
  );

  /* ============================================================ Lesson 8
     Reading. "Dueling voices": Cortés's letter and an Aztec account of the
     conquest, read side by side with the four questions (section 1.2). The
     Cortés passage is quoted from an early English translation (public
     domain); the Aztec account is retold in OEdu's words, not quoted. */
  LESSONS[8] = {
    title: "Two accounts of one conquest",
    blurb: "Cortés's letter and an Aztec account of the same years, read side by side — and what a historian does when they clash.",
    mins: 10, kind: "read",
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Four questions",
        prompt: "“Was it meant to be public or private?”<br><br>Which of the four questions is that?",
        options: [{ t: "Author", fb: "Author is about who made it. Public or private is about who it was *for*." },
                  { t: "Audience" },
                  { t: "Intent", fb: "Intent is *why* it was made. Public or private is about who it was for." },
                  { t: "Context", fb: "Context is what was going on at the time. Public or private is about who it was for." }],
        answer: 1, keep: true,
        hints: ["Who was meant to read it?"],
        why: "Whether a source was meant to be public or private is a question about its **audience**." },

      read({ title: "Two worlds meet", kicker: "Read · 1 of 3", blocks: [
        "In 1519, the Spanish adventurer Hernán Cortés landed on the coast of Mexico with about 500 soldiers. Inland lay the [[Aztec Empire|A powerful state in central Mexico, ruled from Tenochtitlán. Its people called themselves the Mexica.]], ruled by Moctezuma from his island capital, Tenochtitlán — a city of perhaps 200,000 people, one of the largest on Earth.",
        "Many peoples the Aztecs had conquered resented the heavy [[tribute|Goods and labor that conquered peoples were forced to hand over to their rulers.]] they paid. Some, like the Tlaxcalans, joined Cortés. Moctezuma welcomed the Spaniards into his city; within a week, they had made him their prisoner.",
        "In 1520, while Cortés was away, his captain Pedro de Alvarado attacked Aztec nobles and warriors celebrating a religious festival at the Great Temple. War followed. With tens of thousands of Indigenous allies — and a smallpox epidemic killing the city's defenders — the Spanish took Tenochtitlán in 1521."
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "Why did some peoples of Mexico side with Cortés?",
        options: [{ t: "They resented Aztec rule and the tribute they were forced to pay" },
                  { t: "They had been Spanish subjects for years", fb: "The Spanish had only just arrived in 1519. These peoples had been ruled by the Aztecs." },
                  { t: "Cortés paid them in gold", fb: "The reading points to something else: their anger at Aztec rule and its heavy tribute." }],
        answer: 0,
        hints: ["What did conquered peoples have to hand over to the Aztecs?"],
        why: "Peoples like the Tlaxcalans resented Aztec rule and tribute, so they allied with the newcomers against the Aztecs." },

      read({ title: "In their own words", kicker: "Read · 2 of 3", gate: true, blocks: [
        "Here are two voices. On the left, Cortés writes to his king. On the right, Nahua people who lived through the conquest remember the attack at the Great Temple. Read both, and tap each highlighted phrase for a historian's note.",
        ["pair",
          { title: "Second letter to King Charles V", who: "Hernán Cortés", when: "written 1520", i: "letter",
            text: ["I gave a list of the cities and towns that had to that time [[voluntarily submitted|Did they? Cortés gains a great deal if the king believes the conquest was welcomed.]] to your authority, together with those I had [[reduced by conquest|The same sentence admits that many towns were taken by force.]].",
                   "They also begged me to protect them against that mighty Lord, who used [[violent and tyrannical measures|Painting Moctezuma as a tyrant makes Cortés look like a rescuer, not an invader.]] to keep them in subjection, and took from them their sons to be slain and offered as [[sacrifices to his idols|Human sacrifice was real in Aztec religion — and Cortés knew the detail would help justify his war to a Christian king.]]."],
            cite: "From an early English translation." },
          { kind: "Primary source — retold", title: "The massacre in the Great Temple", who: "Nahua survivors", when: "written down in the 1500s", i: "quote",
            text: ["[[During the festival|Attacking a sacred celebration made the massacre even worse in Aztec eyes.]] for their god, the celebrants sang and danced in the temple courtyard. They were [[unarmed|The account's central charge: the victims could not fight back.]].",
                   "The Spaniards closed the gates and attacked — the drummers first, then the dancers, then even those who had only come to watch. The killing went on for hours. Moctezuma, a prisoner, protested that his people had no weapons. After that, the account says, [[the war began|The account places the start of the war squarely on the Spanish.]]."],
            cite: "Retold in OEdu's words from the Aztec accounts collected by Miguel León-Portilla in *The Broken Spears*." }]
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "Cortés stresses that the local peoples *wanted* to serve the king.<br><br>Why might he stress that?",
        options: [{ t: "It made his conquest look welcome and earned him the king's favor" },
                  { t: "Because every one of them told him so", fb: "Maybe some did — but think about intent and audience: he gained by telling the king this, whatever they felt." },
                  { t: "Because he hoped the king would call him home", fb: "The opposite: he wanted the king to back him and reward him." }],
        answer: 0,
        hints: ["Think about his audience and his intent."],
        why: "Writing to the king who could reward him, Cortés had every reason to make the conquest sound welcome." },

      read({ title: "Winners and losers write differently", kicker: "Read · 3 of 3", blocks: [
        "The Aztec account was written down decades after the conquest, in the Nahuatl language, by Nahua people who remembered it, working with Spanish friars. Its tone is grief and betrayal. Cortés writes as the confident winner.",
        "Both are primary sources. Both authors had a side, an audience and a purpose. Neither is the whole truth on its own.",
        "So historians compare. Where separate sources agree — the Spanish did attack the festival, and war followed — a claim is [[corroborated|Backed up by other, independent sources that say the same thing.]]. Where they clash, historians weigh who was in a position to know, and why each might tell it their way.",
        ["ask", "Whose voices are still missing? Think of the Tlaxcalan allies, the enslaved, and the women of the city."]
      ] }),
      { type: "choice", kicker: "Check", skill: "Two accounts",
        prompt: "What should a historian do with two accounts of the same events that disagree?",
        options: [{ t: "Use both — weigh each writer's position, and look for other sources that agree" },
                  { t: "Trust the winner's account, since the winners were in charge", fb: "Winners have their own reasons to tell it their way — Cortés certainly did." },
                  { t: "Throw both away", fb: "Both are valuable: evidence of what happened, and of how each side saw it." }],
        answer: 0,
        hints: ["Remember the word *corroborate*."],
        why: "Historians use every account, weigh each author's position and purpose, and trust most what independent sources agree on." },

      { type: "sort", kicker: "Put it together", skill: "Two accounts",
        prompt: "Which account would say this?",
        bins: ["Cortés's letter", "The Aztec account"],
        cards: [{ t: "The local peoples begged me to protect them.", bin: 0, fb: "That's Cortés, making himself the protector." },
                { t: "The dancers had no weapons.", bin: 1, fb: "That's the Aztec account's central charge." },
                { t: "Moctezuma ruled by violent and tyrannical measures.", bin: 0, fb: "Cortés paints Moctezuma as a tyrant to justify the war." },
                { t: "Our people were killed while they celebrated their god's festival.", bin: 1, fb: "That's the grief of the Aztec account." },
                { t: "Many towns submitted to your Majesty of their own free will.", bin: 0, fb: "That's Cortés, telling the king what he wants to hear." },
                { t: "After the killing in the temple, the war began.", bin: 1, fb: "The Aztec account blames the Spanish for starting the war." }],
        hints: ["Which writer is trying to please a king? Which is mourning?"],
        why: "Cortés writes to justify his conquest to his king; the Aztec account mourns a betrayal by the Spanish." },

      { type: "explain", kicker: "In your own words",
        prompt: "One writer was among the winners, the other among the defeated. How might that shape what each chose to tell?",
        model: "The winner writes to justify the conquest and win reward, so he stresses welcome and his enemy's cruelty. The defeated remember loss and betrayal, so they stress violence against unarmed people. A historian needs both." }
    ]
  };

  /* Practice: weighing two accounts. */
  var L8_PAIRS = [
    { ev: "a strike at a factory in 1910",
      a: ["The owner's newspaper", "A handful of troublemakers stopped work and bullied loyal workers."],
      b: ["A worker's letter to his sister", "Hundreds of us walked out because our pay was cut again."],
      both: "Workers at the factory stopped work", aWhy: "To make the strike look like a few troublemakers rather than a real protest" },
    { ev: "a king's visit to a market town",
      a: ["The official court record", "Joyful crowds cheered the king's arrival."],
      b: ["A townsman's private diary", "We were ordered to line the streets, and fined if we stayed home."],
      both: "The king visited, and crowds lined the streets", aWhy: "To make the king look loved — court records were written to praise him" },
    { ev: "a flood in a river city",
      a: ["The governor's report to the emperor", "My quick action saved the city, and losses were small."],
      b: ["A merchant's letter to his partner", "The governor fled, and half the market was ruined."],
      both: "A flood hit the city", aWhy: "To look good to the emperor who could promote him — or punish him" },
    { ev: "the peace treaty that ended a war",
      a: ["The winning side's chronicle", "The enemy begged for peace and accepted our generous terms."],
      b: ["The losing side's chronicle", "We were forced to sign after our capital was surrounded."],
      both: "A treaty ending the war was signed", aWhy: "To make the victory look complete and the winners look generous" },
    { ev: "a new tax",
      a: ["The tax collector's report", "The people paid the new tax willingly."],
      b: ["A petition from the villagers", "The new tax has left our families hungry."],
      both: "A new tax was collected", aWhy: "To show his superiors he was doing his job without trouble" },
    { ev: "a protest in a city square in 1968",
      a: ["The police report", "Officers calmly cleared an unlawful crowd."],
      b: ["A student's diary", "Police charged at us with clubs while we sat singing."],
      both: "Police cleared protesters from the square", aWhy: "To make the officers' actions look calm and lawful" },
    { ev: "a ship's arrival at an island",
      a: ["The ship captain's journal", "The islanders welcomed us warmly with gifts."],
      b: ["The islanders' oral tradition", "Strangers came from the sea and took our food and our land."],
      both: "Strangers arrived by sea and met the islanders", aWhy: "To show his voyage as a success, for the rulers who paid for it" },
    { ev: "a royal wedding",
      a: ["A poem by the court poet", "The whole kingdom rejoiced as one."],
      b: ["A foreign ambassador's letter home", "The wedding was grand, but many nobles stayed away in protest."],
      both: "The royal wedding took place, and it was grand", aWhy: "Court poets were paid to praise the royal family" }
  ];
  SKILLS.push({ id: "hist1-accounts", title: "Two accounts", lesson: 8,
    gen: function (R, i) {
      var p = R.pick(L8_PAIRS), form = i >= 3 ? R.pick([0, 1, 2]) : i % 3;
      var ctx = "Two sources describe " + p.ev + ".<br>**" + p.a[0] + ":** “" + p.a[1] + "”<br>**" + p.b[0] + ":** “" + p.b[1] + "”";
      if (form === 0) {
        return mc(R, { prompt: ctx + "<br><br>Which detail can a historian treat as best established?",
          right: p.both,
          wrong: [{ t: p.a[1].replace(/\.$/, ""), fb: "Only one side says that — and it has reasons to. It isn't corroborated." },
                  { t: p.b[1].replace(/\.$/, ""), fb: "That may be true, but only one source says it. Look for what *both* agree on." },
                  { t: "Nothing — the two accounts disagree about everything", fb: "Look again: both accounts agree on the basic event. That part is corroborated." }],
          hints: ["What do *both* sources agree happened?"],
          why: "Both sources, from opposite sides, agree on this: " + p.both.charAt(0).toLowerCase() + p.both.slice(1) + ". Agreement between independent sources is corroboration." });
      }
      if (form === 1) {
        return mc(R, { prompt: ctx + "<br><br>Why might " + p.a[0].charAt(0).toLowerCase() + p.a[0].slice(1) + " describe it this way?",
          right: p.aWhy,
          wrong: [{ t: "Because it's an eyewitness, so it must be right", fb: "Being there helps — but a writer with a purpose can still slant the story." },
                  { t: "Because official sources never make mistakes", fb: "Official sources have their own purposes and audiences, like any others." }],
          hints: ["Think about its author, audience and intent."],
          why: "Ask who wrote it and for whom: " + p.aWhy.charAt(0).toLowerCase() + p.aWhy.slice(1) + "." });
      }
      return mc(R, { prompt: ctx + "<br><br>What should a historian do next?",
        right: "Look for more independent sources, and weigh why each writer told it their way",
        wrong: [{ t: "Believe " + p.a[0].charAt(0).toLowerCase() + p.a[0].slice(1) + ", because it's official", fb: "Official doesn't mean neutral — it has its own reasons." },
                { t: "Believe " + p.b[0].charAt(0).toLowerCase() + p.b[0].slice(1) + ", because ordinary people never slant things", fb: "Everyone writes from somewhere. Ordinary people's accounts need weighing too." },
                { t: "Decide the event can never be known", fb: "Conflicting accounts are a reason to dig deeper, not to give up." }],
        hints: ["Remember *corroborate*."],
        why: "Two clashing accounts call for more sources and a close look at each writer's position and purpose." });
    } });

  /* ============================================================ Lesson 9
     Interactive. Rhetoric: word choices made on purpose, met in Franklin
     Roosevelt's "Day of Infamy" speech of December 8, 1941 (section 1.2).
     The speech is public domain; his draft really read "a date which will
     live in world history … simultaneously and deliberately attacked". */
  LESSONS[9] = {
    title: "Words that do work",
    blurb: "How word choices steer a reader — watched at work in the speech that took the United States into World War II.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Two accounts",
        prompt: "Historians trust a claim more when it's *corroborated*.<br><br>What does that mean?",
        options: [{ t: "Other, independent sources say the same thing" },
                  { t: "The winning side wrote it down", fb: "Winners have their own reasons to tell a story their way. Corroboration means independent sources agree." },
                  { t: "It was written long ago", fb: "Age doesn't make a claim trustworthy. Agreement between independent sources does." }],
        answer: 0,
        hints: ["Think of Cortés's letter and the Aztec account: where did they agree?"],
        why: "A corroborated claim is backed up by separate sources that agree — like both accounts saying the Spanish attacked the festival." },

      { type: "choice", kicker: "Guess first",
        prompt: "Two headlines about the same afternoon: *“Protesters gather downtown”* and *“Mob swarms downtown.”*<br><br>What's the difference?",
        art: tiles([{ i: "news", t: "“Protesters gather”", c: "blue" }, { i: "news", t: "“Mob swarms”", c: "red" }]),
        options: [{ t: "Only the words — chosen to make you feel differently about the same facts" },
                  { t: "They describe different events", fb: "Same afternoon, same place — the facts didn't change. The words did." },
                  { t: "One is true and the other is false", fb: "Both could describe the very same crowd. What differs is how each wants you to feel about it." }],
        answer: 0,
        hints: ["Picture the crowd each headline describes. Is it a different crowd?"],
        why: "“Gather” is calm; “mob swarms” sounds dangerous.<br>Same facts, different feelings — the words were chosen." },

      { type: "learn", kicker: "New word",
        prompt: "Choosing words to get a result is called **rhetoric**. You use it every day — you don't talk to a principal the way you talk to a friend.",
        art: photo("pearl", "Pearl Harbor, Hawaii, photographed from a Japanese plane during the surprise attack of December 7, 1941."),
        after: "The next day, President Franklin Roosevelt went before Congress and asked it to declare war on Japan. Every word of his speech was chosen." },

      { type: "learn", kicker: "Try it",
        prompt: "Roosevelt's typed draft began a little differently. Tap each highlighted word to swap it, until it matches what he actually said.",
        scene: { type: "tone", who: "Franklin D. Roosevelt, to Congress, December 8, 1941", lo: "Flat", hi: "Forceful",
          parts: ["“Yesterday, December 7th, 1941 — a date which will live in ",
                  { opts: [{ w: "world history", tone: 1, note: "*World history*: it says the day mattered — but not how to feel about it." },
                           { w: "infamy", tone: 3, note: "**Infamy** means lasting fame for something evil. Now the date itself is an accusation." }], goal: 1 },
                  " — the United States of America was ",
                  { opts: [{ w: "simultaneously", tone: 1, note: "*Simultaneously* — “at the same time.” Accurate, but flat." },
                           { w: "suddenly", tone: 2, note: "*Suddenly* says: no warning. It paints the attack as a betrayal." }], goal: 1 },
                  " and deliberately attacked by naval and air forces of the Empire of Japan.”"],
          done: "That's the speech as he gave it — and the meter shows why he changed it." },
        gate: true,
        then: "His draft really did say *“a date which will live in world history”* and *“simultaneously.”* Roosevelt crossed them out and wrote **infamy** and **suddenly**. Those are rhetorical choices, made on purpose." },

      { type: "spot", skill: "Rhetoric",
        prompt: "Roosevelt argued that Japan had planned the attack while pretending to talk peace.<br><br>Tap the words that make that charge.",
        parts: ["During the intervening time, the Japanese government has ", "deliberately sought to deceive", " the United States by ", "false statements", " and expressions of hope for continued peace."],
        answer: [1, 3], many: true,
        fb: { 0: "That just sets the time. Look for words that accuse.", 2: "That names who was targeted. Which words say it was a trick?", 4: "That describes what Japan said — the accusing words are before it." },
        hints: ["Look for words about lying and planning.", "There are two."],
        why: "“Deliberately sought to deceive” and “false statements” turn a list of events into a charge of treachery." },

      { type: "learn", kicker: "Watch",
        prompt: "Now listen to the rhythm of this part of the speech.",
        scene: { type: "unfold", next: "Next line", steps: [
          { i: "plane", t: "“Yesterday the Japanese government also launched an attack against Malaya.”", c: "blue" },
          { i: "plane", t: "“Last night Japanese forces attacked Hong Kong.”", c: "blue" },
          { i: "plane", t: "“Last night Japanese forces attacked Guam.”", c: "orange" },
          { i: "plane", t: "“Last night Japanese forces attacked the Philippine Islands.”", c: "orange" },
          { i: "plane", t: "“Last night the Japanese attacked Wake Island.”", c: "red" },
          { i: "plane", t: "“And this morning the Japanese attacked Midway Island.”", c: "red" }] },
        gate: true,
        then: "Starting line after line the same way is a rhetorical choice too. Like a drumbeat, it makes the danger feel huge, fast and close." },

      { type: "choice", skill: "Rhetoric",
        prompt: "Why did Roosevelt list the attacks in short lines that all begin the same way?",
        options: [{ t: "To make the danger feel wide and growing, like a drumbeat" },
                  { t: "Because he ran out of time to write it properly", fb: "The speech was carefully drafted and revised — the repetition was chosen." },
                  { t: "To confuse Congress about where the attacks were", fb: "Each line names a place clearly. The repetition adds force, not confusion." }],
        answer: 0,
        hints: ["How did the lines feel as they piled up?"],
        why: "The repeated opening piles attack on attack, so listeners feel the danger spreading across the Pacific." },

      { type: "choice", skill: "Rhetoric",
        prompt: "Roosevelt ended: *“With confidence in our armed forces — with the unbounding determination of our people — we will gain the inevitable triumph — so help us God.”*<br><br>What does “so help us God” add?",
        options: [{ t: "A sense that the nation's cause is right, with God on its side" },
                  { t: "A hint that he wasn't sure the US would win", fb: "“Inevitable triumph” is anything but unsure. Calling on God adds a sense that the cause is righteous." },
                  { t: "A request to Congress for money", fb: "The speech asks Congress to declare war. These words are about the cause, not money." }],
        answer: 0,
        hints: ["Why would a leader bring God into a call to war?"],
        why: "Invoking God suggests the nation's cause is just — a powerful rhetorical move at the start of a war." },

      { type: "sort", skill: "Rhetoric",
        prompt: "Sort these words and phrases from the speech.",
        bins: ["Charged: pushes feelings", "Plain: just reports"],
        cards: [{ t: "infamy", bin: 0, fb: "“Infamy” brands the day as evil — charged." },
                { t: "treachery", bin: 0, fb: "“Treachery” accuses Japan of betrayal — charged." },
                { t: "dastardly", bin: 0, fb: "“Dastardly” means cowardly and wicked — charged." },
                { t: "righteous might", bin: 0, fb: "“Righteous” says the cause is morally right — charged." },
                { t: "naval and air forces", bin: 1, fb: "That just names who attacked — plain." },
                { t: "Hawaii", bin: 1, fb: "A place name — plain." },
                { t: "the Philippine Islands", bin: 1, fb: "Another place — plain." },
                { t: "this morning", bin: 1, fb: "A time — plain." }],
        hints: ["Does the word tell you what happened, or how to feel about it?"],
        why: "Infamy, treachery, dastardly and righteous might tell you how to feel.<br>Forces, places and times just report." },

      { type: "choice", kicker: "Put it together",
        prompt: "A historian reads Roosevelt's speech as a source.<br><br>What does its rhetoric reveal best?",
        options: [{ t: "How Roosevelt wanted Americans to see the attack, and what he needed from Congress" },
                  { t: "Exactly how many ships were sunk", fb: "The speech gives almost no numbers — historians find those in naval records." },
                  { t: "What Japan's leaders were thinking", fb: "It's Roosevelt's view of Japan's actions, not a window into Japanese leaders' minds." }],
        answer: 0,
        hints: ["Rhetoric tells you about the speaker's aims."],
        why: "Word choices reveal the speaker's purpose: Roosevelt wanted a united, angry nation and a declaration of war." },

      { type: "explain", kicker: "In your own words",
        prompt: "What is rhetoric — and why should a historian notice it?",
        model: "Rhetoric is choosing words to get a result. Noticing it shows what a writer wanted the audience to feel and do — so the historian can separate the facts from the persuasion." }
    ]
  };

  /* Practice: charged and plain words. A charged version marks its loaded
     words with |bars| (odd pieces when split on "|"). */
  var L9_PAIRS = [
    ["The army moved back.", "The army |fled in panic|.", "to make the army look beaten and afraid"],
    ["A crowd gathered in the square.", "A |mob| |swarmed| the square.", "to make the crowd seem dangerous"],
    ["The council raised taxes.", "The council |squeezed| families with new taxes.", "to make the council look cruel"],
    ["The rebels took the fort.", "The |freedom fighters| |liberated| the fort.", "to make the fighters look like heroes"],
    ["The leader spoke for an hour.", "The leader |thundered| for an hour.", "to make the leader seem powerful"],
    ["Settlers moved into the valley.", "Settlers |invaded| the valley.", "to make the settlers look like attackers"],
    ["The ruler changed the law.", "The |tyrant| |twisted| the law.", "to make the ruler look wicked"],
    ["The workers stopped work.", "The workers |downed tools in outrage|.", "to make the workers' anger feel strong and justified"],
    ["The king died.", "Our |beloved| king was |cruelly taken from us|.", "to make readers grieve"],
    ["Prices went up.", "Prices |skyrocketed|.", "to make the rise seem shocking"],
    ["The treaty was signed.", "The |humiliating| treaty was |forced on us|.", "to make readers feel wronged"],
    ["The army entered the city.", "The army |liberated| the city.", "to make the army look like rescuers"],
    ["The protesters were removed.", "The protesters were |dragged away|.", "to make the police look brutal"],
    ["The general made a mistake.", "The general |blundered disastrously|.", "to make the general look foolish"],
    ["The ship reached the port.", "The ship |stormed| into the port.", "to make the arrival seem aggressive"],
    ["The two sides stopped fighting.", "The enemy |begged for mercy|.", "to make one side look weak and the other strong"]
  ];
  function l9plain(s) { return s.replace(/\|/g, ""); }
  SKILLS.push({ id: "hist1-rhetoric", title: "Rhetoric", lesson: 9,
    gen: function (R, i) {
      var p = R.pick(L9_PAIRS), form = i >= 3 ? R.pick([0, 1, 2]) : i === 2 ? 1 : 0;
      if (form === 1) {
        // Each piece becomes its own chip: keep the loaded words, and the
        // plain stretches between them that have words in them.
        var bits = [];
        p[1].split("|").forEach(function (x, k) { if (k % 2 || x.trim()) bits.push({ t: x.trim(), on: !!(k % 2) }); });
        // A lone full stop joins the chip before it.
        if (bits.length > 1 && /^[.,;!?]+$/.test(bits[bits.length - 1].t)) { var end = bits.pop(); bits[bits.length - 1].t += end.t; }
        bits[0].t = "“" + bits[0].t;
        bits[bits.length - 1].t += "”";
        var ans = [], fb = {};
        bits.forEach(function (x, k) { if (x.on) ans.push(k); else fb[k] = "Those words just report. Which words tell you how to feel?"; });
        return { type: "spot", many: ans.length > 1,
          prompt: "Plain version: *“" + p[0] + "”*<br><br>Tap the " + (ans.length > 1 ? "words" : "word") + " in this version that " + (ans.length > 1 ? "push" : "pushes") + " your feelings.",
          parts: bits.map(function (x) { return x.t; }),
          answer: ans, fb: fb,
          hints: ["Compare it with the plain version. What was added or swapped?"],
          why: "“" + l9plain(p[1]) + "” — the charged words are written " + p[2] + "." };
      }
      if (form === 2) {
        return mc(R, { prompt: "One writer says: *“" + p[0] + "”* Another says: *“" + l9plain(p[1]) + "”*<br><br>Why might the second writer choose those words?",
          right: p[2].charAt(0).toUpperCase() + p[2].slice(1),
          wrong: sample(R, L9_PAIRS.filter(function (x) { return x !== p; }), 2).map(function (x) { return { t: x[2].charAt(0).toUpperCase() + x[2].slice(1), fb: "That would fit different words. Look closely at what these ones do." }; })
            .concat([{ t: "To report the facts more accurately", fb: "Both versions report the same facts. The second adds feelings, not accuracy." }]),
          hints: ["What feeling do the swapped words stir up?"],
          why: "Rhetoric is choosing words for an effect — here, " + p[2] + "." });
      }
      var charged = l9plain(p[1]);
      return mc(R, { prompt: "Two ways to report the same fact.<br><br>Which one is written to stir feelings?",
        right: "“" + charged + "”",
        wrong: [{ t: "“" + p[0] + "”", fb: "This one simply reports what happened." }],
        hints: ["Which one tells you how to feel, not just what happened?"],
        why: "“" + charged + "” adds loaded words, " + p[2] + "." });
    } });

  /* =========================================================== Lesson 10
     Reading. "Hidden in history": whose lives the records hold, how social
     historians find the rest, regions with thin records, and Chinua Achebe
     on telling your own story (section 1.2). The Achebe interview is
     paraphrased, not quoted. */
  LESSONS[10] = {
    title: "Voices history left out",
    blurb: "Why kings are easy to find in the records and farmers are not — and how historians find them anyway.",
    mins: 10, kind: "read",
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Rhetoric",
        prompt: "Roosevelt swapped *“world history”* for *“infamy.”*<br><br>What do we call choosing words to get a result like that?",
        options: [{ t: "Rhetoric" },
                  { t: "Iconography", fb: "Iconography is the language of images and symbols. Choosing words for effect is rhetoric." },
                  { t: "Historiography", fb: "Historiography is the study of how historians have interpreted the past. This is rhetoric." }],
        answer: 0,
        hints: ["It's about the way words are chosen and put together."],
        why: "Rhetoric is the way words are chosen and put together to get a result." },

      read({ title: "Who gets written down?", kicker: "Read · 1 of 4", blocks: [
        "Think about who appears in the written record of the past. Kings, queens, emperors and generals are easy to find: scribes recorded their laws, their wars and their marriages.",
        "Now try to find the king's servants. The farmers who grew his food. The women who ran his markets. They are far harder to find, because few people wrote about them — and most of them could not write themselves.",
        "In the 1960s, some historians set out to change that. They studied history “from the bottom up,” and built a field called [[social history|The history of everyday life and of all kinds of people — not just rulers and elites.]].",
        ["ask", "Whose lives in your own town would be hardest to find in the records five hundred years from now?"]
      ] }),
      { type: "choice", kicker: "Check",
        prompt: "Why do rulers fill so much more of the written record than farmers?",
        options: [{ t: "Scribes wrote about rulers, and most ordinary people couldn't write" },
                  { t: "Farmers' lives weren't important", fb: "Their lives mattered just as much — they were simply written down far less often." },
                  { t: "There weren't many farmers", fb: "For most of history, most people *were* farmers!" }],
        answer: 0,
        hints: ["Who did the writing — and about whom?"],
        why: "The people who wrote mostly wrote about the powerful, and most ordinary people couldn't write their own stories." },

      read({ title: "Finding the unseen", kicker: "Read · 2 of 4", blocks: [
        "Social historians go looking in unexpected places.",
        ["list", "", [
          ["Court records", "Witnesses and the accused — rich and poor alike — had their words written down.", "gavel"],
          ["Church records", "Baptisms, marriages and burials record the names and lives of ordinary people.", "church"],
          ["Letters for hire", "Parents who couldn't write paid scribes to write letters begging pardons for their children.", "letter"],
          ["Newspapers", "Advertisements, notices and letters to the editor show everyday life.", "news"]]],
        "Even so, it's still hard to give women, the poor and minority communities the same space as the powerful. The records simply hold less about them."
      ] }),
      { type: "multi", kicker: "Check", skill: "Hidden voices",
        prompt: "You want to learn about the life of an ordinary farmer in the year 1700.<br><br>Which sources could help?",
        options: [{ t: card("church", "A church register of her children's baptisms"), ok: true, fb: "Church records name ordinary people." },
                  { t: card("gavel", "A court record in which she spoke as a witness"), ok: true, fb: "Court records caught ordinary people's own words." },
                  { t: card("coins", "A village tax list with her family's name"), ok: true, fb: "Tax lists record ordinary households." },
                  { t: card("crown", "The king's official portrait"), ok: false, fb: "That shows the king — not a farmer's life." },
                  { t: card("sword", "A general's report of a battle"), ok: false, fb: "That's about the army and its commander, not a farm family." }],
        hints: ["Look for records that name ordinary people."],
        why: "Church registers, court records and tax lists name ordinary people. Portraits and battle reports are about the powerful." },

      read({ title: "Some places left thin records", kicker: "Read · 3 of 4", blocks: [
        "Some regions have long written traditions. The Greek writer Herodotus, in the 400s BCE, is called the father of history in the West. Sima Qian, born around 145 BCE, is called the father of history in China, for his *Records of the Grand Historian* — a vast history of China up to his own day. The Middle East and India have rich written histories too.",
        "Elsewhere the record is thinner. When the Spanish conquered the Americas, priests burned many Indigenous books, believing they held a religion that had to be wiped out.",
        ["stat", "4", "Maya books known to survive today. The Maya once filled libraries with them; at a single burning in 1562, a Spanish bishop destroyed dozens."],
        "Africa's past is harder still to piece together. The continent is vast and varied, its climate destroys paper and even many objects, and much of what was written about it came from colonial observers with a bias. So historians also turn to [[oral traditions|History passed down by word of mouth — in West Africa, often by griots, professional keepers of history and song.]]."
      ] }),
      { type: "choice", kicker: "Check", skill: "Hidden voices",
        prompt: "Why is the written record of the early Americas so thin?",
        options: [{ t: "The conquerors destroyed many Indigenous books" },
                  { t: "No one in the Americas could write", fb: "The Maya and others had writing — their books were burned." },
                  { t: "Nothing important happened there", fb: "Great cities and empires rose there. The problem is what survived, not what happened." }],
        answer: 0,
        hints: ["What happened to the Maya books?"],
        why: "Spanish conquerors burned many Indigenous books, so only a few — like four Maya books — survive." },

      read({ title: "Telling your own story", kicker: "Read · 4 of 4", blocks: [
        ["fig", "achebe", "Chinua Achebe in Lagos, Nigeria, in 1966.", { small: true }],
        "The Nigerian novelist [[Chinua Achebe|A Nigerian writer (1930–2013), author of *Things Fall Apart* (1958), a novel about an Igbo community when British missionaries and colonial rule arrive.]] wrote *Things Fall Apart* to tell the story of his Igbo people from the inside, not as outsiders had described them.",
        "Years later, he said in an interview that the book's reach surprised him. A whole class at a girls' college in South Korea wrote to him. Their country had been ruled by Japan, and they recognized their own history in his story of [[colonialism|When one country takes control of another people or land, usually to profit from it.]].",
        "People in different parts of the world can respond to the same story when it speaks to their own history. But first, each people needs to be able to tell its own."
      ] }),
      { type: "choice", kicker: "Check", skill: "Hidden voices",
        prompt: "What did the letters from students in South Korea show Achebe?",
        options: [{ t: "People with a similar history of colonization could recognize themselves in his story" },
                  { t: "His book only meant something to Nigerians", fb: "The letters showed the opposite: readers far away saw their own history in it." },
                  { t: "Korea and Nigeria had been ruled by the same country", fb: "Korea was ruled by Japan and Nigeria by Britain. What they shared was the experience of colonization." }],
        answer: 0,
        hints: ["What did Korea's history have in common with the story in the novel?"],
        why: "Korea had been colonized by Japan, so its readers recognized their own history in Achebe's story of colonization." },

      { type: "explain", kicker: "Put it together",
        prompt: "In your own words: why might a history built only from rulers' records give a false picture of the past?",
        model: "Rulers' records mostly describe rulers — their wars, laws and marriages. Most people, like farmers, servants, women and the poor, barely appear, so a history built only on those records leaves out how most people actually lived." }
    ]
  };

  /* Practice: finding hidden voices. */
  var L10_FIND = [
    ["an ordinary farming family in the 1600s", "A church register of the family's baptisms, marriages and burials"],
    ["the life of a servant in a noble household", "Court records in which the servant spoke as a witness"],
    ["poor city workers in the 1800s", "A census listing who lived in each home, and their jobs"],
    ["enslaved people on a plantation", "Interviews recorded with formerly enslaved people about their lives"],
    ["women traders in a West African market town", "Oral traditions passed down in the traders' own families"],
    ["a teenager's life in 1920", "The teenager's own diary"],
    ["villagers on a medieval estate", "The lord's book of the rent each villager paid"],
    ["sailors on a merchant ship", "The sailors' letters home"],
    ["children working in factories", "A government inspector's report on factory conditions"],
    ["what poor families ate 300 years ago", "A workhouse's accounts listing the food it bought each week"]
  ];
  var L10_ELITE = [
    ["The king's official portrait", "That shows the king — not the people you're looking for."],
    ["A general's report of a victory", "That's about the battle and the general."],
    ["A poem celebrating a royal wedding", "That's about the royal family."],
    ["A treaty between two emperors", "That records a deal between rulers."],
    ["A statue of the city's founder", "That celebrates one famous man."],
    ["The palace's guest list for a banquet", "That lists only the powerful and well-connected."],
    ["A biography of the queen", "That's about the queen, not ordinary people."]
  ];
  var L10_WHY = [
    ["the early Americas", "Conquerors destroyed many Indigenous books", ["No one there could write", "The Maya and others wrote books — most were burned."]],
    ["much of Africa's past", "Its climate destroys records, and much was written by biased colonial observers", ["Nothing happened there before Europeans arrived", "Africa's kingdoms and cities have long histories; the problem is what survived and who wrote it down."]],
    ["poor people almost everywhere", "They seldom wrote, and the people who did write seldom wrote about them", ["Their lives didn't matter", "Their lives mattered — they were just rarely recorded."]],
    ["women in many societies", "The record-keepers were mostly men, writing about men's affairs", ["Women did nothing worth recording", "Women did much of the world's work; it simply went unrecorded."]]
  ];
  SKILLS.push({ id: "hist1-hidden", title: "Hidden voices", lesson: 10,
    gen: function (R, i) {
      if (i === 2 || (i >= 3 && R.chance(0.35))) {
        var w = R.pick(L10_WHY), other = R.pick(L10_WHY.filter(function (x) { return x !== w; }));
        return mc(R, { prompt: "Historians often know less about **" + w[0] + "** than they would like.<br><br>What is the main reason?",
          right: w[1],
          wrong: [{ t: w[2][0], fb: w[2][1] }, { t: other[1], fb: "That's the reason for " + other[0] + ". Think about " + w[0] + "." }],
          hints: ["Is the problem what happened — or what was recorded and what survived?"],
          why: "For " + w[0] + ": " + w[1].charAt(0).toLowerCase() + w[1].slice(1) + "." });
      }
      var f = R.pick(L10_FIND), el = sample(R, L10_ELITE, 3);
      return mc(R, { prompt: "You're researching **" + f[0] + "**.<br><br>Which source is most likely to help?",
        right: f[1], wrong: el.map(function (x) { return { t: x[0], fb: x[1] }; }),
        hints: ["Look for a record that names or gives a voice to ordinary people."],
        why: "“" + f[1] + "” records the lives of ordinary people directly. The others are about the powerful." });
    } });

  /* =========================================================== Lesson 11
     Interactive. Causation and its levels — primary, secondary, tertiary —
     and why historians disagree about ranking causes (section 1.3). */
  LESSONS[11] = {
    title: "Why did it happen?",
    blurb: "The spark, the fuel and the ground beneath: ranking causes the way historians do — and why they argue about it.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Hidden voices",
        prompt: "Historians in the 1960s began studying history “from the bottom up.”<br><br>What is that field called?",
        options: [{ t: "Social history" },
                  { t: "Great man history", fb: "That's the opposite — history told through powerful leaders." },
                  { t: "Historiography", fb: "Historiography is the study of how historians have interpreted the past. Bottom-up history is social history." }],
        answer: 0,
        hints: ["It studies the everyday lives of all kinds of people."],
        why: "Social history looks at the everyday lives of all kinds of people, not just rulers." },

      { type: "choice", kicker: "Guess first",
        prompt: "Why are you doing this lesson right now?",
        options: [{ t: "My teacher assigned it", fb: "True — but is it the *only* reason? Look for the answer that goes deeper." },
                  { t: "I want to do well in school", fb: "True, and there's more behind it. Look again." },
                  { t: "Society says education leads to a good future", fb: "True — and there are nearer reasons too." },
                  { t: "All of these, at different levels" }],
        answer: 3, keep: true,
        hints: ["Could more than one be true at once?"],
        why: "Every one of them is a reason — some close at hand, some deep in the background. Events have causes at several levels." },

      { type: "learn", kicker: "Try it",
        prompt: "Build the pyramid of reasons. Tap each level to open it.",
        scene: { type: "causes", title: "Why are you doing this lesson?",
          levels: [{ t: "Your teacher assigned it — and it might be on the test." },
                   { t: "You want to do well in school." },
                   { t: "Society tells you that education leads to a good life." }] },
        gate: true,
        then: "**Causation** is the *why* behind an event. The **primary cause** is the most immediate — the spark. The **secondary cause** is one step back. The **tertiary cause** is the broad context underneath." },

      { type: "causes", skill: "Levels of causation",
        prompt: "Now a real event.<br><br>Put each cause on its level.",
        title: "Why did the United States enter World War II in 1941?",
        cards: [{ t: "On December 7, 1941, Japan bombed Pearl Harbor.", level: 0, fb: "The Pearl Harbor attack is the immediate trigger — the spark. It goes at the top." },
                { t: "President Roosevelt had already been helping Britain against Germany.", level: 1, fb: "This came before the attack and was already pulling the US toward war — one step back." },
                { t: "Japan and the United States had long competed for power in the Pacific.", level: 2, fb: "This is the long-running background — the broad context, at the base." }],
        hints: ["Which one happened last, right before the decision? That's the spark.", "Which one had been true for years? That's the base."],
        why: "Primary: the attack on Pearl Harbor.<br>Secondary: Roosevelt was already helping Britain.<br>Tertiary: a long rivalry over the Pacific." },

      { type: "learn", kicker: "Careful",
        prompt: "The spark isn't always the most *important* cause.",
        art: tiles([{ i: "flame", t: "A match: the spark", c: "green" }, { i: "tree", t: "Dry trees: one step back", c: "blue" }, { i: "sun", t: "A long drought: the context", c: "purple" }]),
        after: "A match starts a forest fire — but only because the trees were dry after a long drought. Drop the same match in a wet forest and it fizzles. The more levels of cause historians find, the closer they get to the truth." },

      { type: "choice", skill: "Levels of causation",
        prompt: "A war starts the day after a border guard is shot. The two countries had quarreled over the same land for fifty years.<br><br>Which is the tertiary cause — the broad context?",
        options: [{ t: "The fifty-year quarrel over the land" },
                  { t: "The shooting of the border guard", fb: "That's the spark — the primary cause, right before the war." },
                  { t: "The day the war began", fb: "That's *when* it happened, not why." }],
        answer: 0,
        hints: ["Which cause had been there the longest?"],
        why: "The long quarrel is the background that made war possible; the shooting was only the spark." },

      { type: "causes", kicker: "One step harder", skill: "Levels of causation",
        prompt: "In 1453, the Ottoman sultan Mehmed II besieged Constantinople.<br><br>Rank the causes the way a historian who thinks *leaders* drive events would.",
        title: "Why did Mehmed II besiege Constantinople?",
        cards: [{ t: "Mehmed, a young new sultan, wanted to prove himself.", level: 0, fb: "For a historian who thinks leaders drive events, the leader's own goal is the spark, at the top." },
                { t: "Constantinople was a great prize at the crossroads of trade between East and West.", level: 1, fb: "The city's value made it worth taking — one step back from Mehmed's personal drive." },
                { t: "The Ottoman Empire had grown by conquest since its founding.", level: 2, fb: "Generations of conquest are the broad context — the base of the pyramid." }],
        hints: ["This historian puts the leader's personal goal at the top.", "What had been true since the empire began?"],
        why: "Primary: Mehmed's wish to prove himself.<br>Secondary: the city's great value.<br>Tertiary: an empire built on conquest." },

      { type: "choice", skill: "Levels of causation",
        prompt: "Another historian ranks Mehmed's causes differently, with the empire's long history of conquest at the top.<br><br>Why might two historians disagree like this?",
        options: [{ t: "They weigh forces differently — one thinks leaders drive events, the other thinks long-term conditions do" },
                  { t: "One of them must have the facts wrong", fb: "They can agree on every fact and still disagree about which cause mattered most." },
                  { t: "Causes can't really be ranked at all", fb: "They can — but ranking takes judgment, so historians argue for their rankings with evidence." }],
        answer: 0,
        hints: ["Is the disagreement about facts, or about which forces matter most?"],
        why: "Ranking causes is a judgment. Historians who stress leaders and those who stress long-term conditions can read the same facts differently." },

      { type: "sort", kicker: "Put it together", skill: "Levels of causation",
        prompt: "Sort these causes.",
        bins: ["Spark: right before", "Deep cause: long-term"],
        cards: [{ t: card("crown", "A king is assassinated at a parade"), bin: 0, fb: "A single sudden event is a spark." },
                { t: card("sword", "Decades of rivalry between two empires"), bin: 1, fb: "Decades of rivalry is a long-term cause." },
                { t: card("coins", "A new tax on tea is announced"), bin: 0, fb: "One announcement is a spark." },
                { t: card("people", "Years of anger over taxes nobody voted for"), bin: 1, fb: "Years of anger is a deep, long-term cause." },
                { t: card("flag", "A crowd storms a prison one summer morning"), bin: 0, fb: "A single morning's event is a spark." },
                { t: card("bowl", "A long bread shortage and a government deep in debt"), bin: 1, fb: "A long shortage and debt build up over time — deep causes." }],
        hints: ["Did it happen on one day, or build up over years?"],
        why: "Sparks are sudden events right before: an assassination, a tax announced, a prison stormed.<br>Deep causes build up over years: rivalry, anger, shortage and debt." },

      { type: "explain", kicker: "In your own words",
        prompt: "Pick any event you know — from history or your own life. What was its spark, and what were its deeper causes?",
        model: "Example: our team's big argument. The spark was one unfair call in a game. One step back, players had felt left out for weeks. The broad context: the team had grown fast and nobody had set clear rules." }
    ]
  };

  /* Practice: levels of causation. Causes are listed spark first. */
  var L11_EV = [
    ["Why did the United States enter World War II in 1941?", ["Japan bombed Pearl Harbor on December 7, 1941.", "Roosevelt had already been helping Britain against Germany.", "Japan and the United States had long competed for power in the Pacific."]],
    ["Why did Mehmed II besiege Constantinople in 1453?", ["The young sultan wanted to prove himself.", "The city was a rich prize at the crossroads of trade.", "The Ottoman Empire had grown by conquest since its founding."]],
    ["Why did the Aztec capital fall in 1521?", ["Cortés's forces and their allies besieged Tenochtitlán.", "A smallpox epidemic had already killed many of the city's defenders.", "Many peoples resented Aztec rule and had joined the Spanish."]],
    ["Why did the city build a new wall?", ["Scouts reported an enemy army marching toward it.", "The old wall had been damaged in an earthquake.", "The region had been at war, on and off, for a century."]],
    ["Why did the farmers rebel?", ["The lord doubled the rent after a bad harvest.", "Two years of failed crops had left families hungry.", "For generations, lords had owned the land and farmers had no say."]],
    ["Why did the merchant move her shop?", ["Her landlord raised the rent sharply.", "A new road had drawn most shoppers to the other side of town.", "The town was growing fast, and land prices were rising everywhere."]],
    ["Why did the UN adopt a declaration of human rights in 1948?", ["The drafting committee finished the text and brought it to a vote.", "World War II and the Holocaust had just shown how people could be treated without protected rights.", "Ideas about rights belonging to every person had been growing for centuries."]],
    ["Why did the student stay up late?", ["A history paper was due first thing in the morning.", "She had put off starting it all week.", "Her school treats grades as the key to getting into college."]],
    ["Why did the protest begin?", ["Police arrested a popular local leader.", "The price of bread had doubled that year.", "People had lived for decades under a government they could not vote out."]],
    ["Why did the school start a recycling program?", ["A student petition gathered 500 signatures.", "The town had just raised the cost of trash pickup.", "People everywhere were growing more worried about waste."]],
    ["Why did the village move to higher ground?", ["A flood swept through the village last spring.", "The river had been flooding more often for twenty years.", "The whole region's climate had been growing wetter."]],
    ["Why did the kingdom switch to a new trade route?", ["A war closed the old mountain pass.", "Bandits had made the old route more dangerous for years.", "Sea travel had been getting cheaper and safer for generations."]]
  ];
  var L11_LV = ["primary", "secondary", "tertiary"], L11_SAY = ["the spark — the most immediate cause", "one step back from the spark", "the broad context underneath"];
  SKILLS.push({ id: "hist1-cause", title: "Levels of causation", lesson: 11,
    gen: function (R, i) {
      var e = R.pick(L11_EV), c = e[1];
      if (i === 2 || (i >= 3 && R.chance(0.5))) {
        return { type: "causes", title: e[0],
          prompt: "Put each cause on its level of the pyramid.",
          cards: c.map(function (t, k) { return { t: t, level: k, fb: "This one is " + L11_SAY[k] + " — it belongs on the " + L11_LV[k] + " level." }; }),
          hints: ["The spark happened last, right before the event.", "The base is what had been true for the longest."],
          why: "Primary: " + c[0] + "<br>Secondary: " + c[1] + "<br>Tertiary: " + c[2] };
      }
      var lv = i === 0 ? 0 : i === 1 ? 2 : R.int(0, 2);
      return mc(R, { prompt: "**" + e[0] + "**<br><br>Which is the **" + L11_LV[lv] + " cause** — " + L11_SAY[lv] + "?",
        right: c[lv],
        wrong: [0, 1, 2].filter(function (k) { return k !== lv; }).map(function (k) { return { t: c[k], fb: "That's " + L11_SAY[k] + " — the " + L11_LV[k] + " cause." }; }),
        hints: ["Spark = right before. Base = true for the longest."],
        why: "The " + L11_LV[lv] + " cause is " + L11_SAY[lv] + ":<br>“" + c[lv] + "”" });
    } });

  /* =========================================================== Lesson 12
     Reading. "Dueling voices": the great man theory (Carlyle, 1840) against
     history made by the many (the Romantics, and Tolstoy's War and Peace).
     Both passages are public domain (section 1.3). */
  LESSONS[12] = {
    title: "Great men or everyone?",
    blurb: "Carlyle said heroes make history; Tolstoy said the crowd does. Read them both and decide.",
    mins: 10, kind: "read",
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Levels of causation",
        prompt: "On the pyramid of causes, what is the **primary cause**?",
        options: [{ t: "The most immediate reason — the spark" },
                  { t: "The broad context underneath", fb: "That's the tertiary cause, at the base." },
                  { t: "The most important reason, always", fb: "The spark is the most *immediate* cause — not always the most important one. Remember the match and the drought." }],
        answer: 0,
        hints: ["Think of the match in the dry forest."],
        why: "The primary cause is the most immediate one — the spark that sets the event off." },

      { type: "choice", kicker: "Guess first",
        prompt: "The Great Pyramid of Giza was built for the pharaoh Khufu, around 2560 BCE.<br><br>Who built it?",
        art: tiles([{ i: "crown", t: "The pharaoh", c: "yellow" }, { i: "pyramid", t: "The pyramid", c: "orange" }, { i: "people", t: "The workers", c: "blue" }]),
        options: [{ t: "The pharaoh Khufu", fb: "Khufu ordered it — but he didn't lift a single stone. Thousands of workers did." },
                  { t: "Thousands of workers, farmers and craftsmen", fb: "They did the building — but Khufu's order and wealth set them to work. Is it really just one or the other?" },
                  { t: "Both — the ruler's order and the workers' labor" }],
        answer: 2, keep: true,
        hints: ["Could it have been built without the pharaoh? Without the workers?"],
        why: "Neither could have done it alone. Historians argue about which matters more — the leader or the many." },

      read({ title: "History as the story of heroes", kicker: "Read · 1 of 3", blocks: [
        "For most of the past, history was written about kings, sultans, emperors and generals. That made a kind of sense: when a king decided, everyone lived with his choice, and the records spoke mostly of nobles. And the people writing history usually belonged to the same elite.",
        "In 1840, the Scottish historian Thomas Carlyle gave a series of lectures on heroes. Great leaders, he argued, shape everything that happens — an idea called the [[great man theory|The view that history is shaped mainly by the deeds of heroes and powerful leaders, so studying them is enough to understand the past.]].",
        ["src", { title: "Lecture on heroes", who: "Thomas Carlyle", when: "1840", i: "mic",
          text: "Universal History, the history of what man has accomplished in this world, is at bottom the [[History of the Great Men|Carlyle's whole claim in five words: leaders make history, and everyone else follows.]] who have worked here. They were the leaders of men, these great ones; the [[modellers, patterns, and in a wide sense creators|In Carlyle's view the crowd only carries out what great men first imagine — a big claim to test against evidence.]], of whatsoever the general mass of men contrived to do or to attain." }]
      ] }),
      { type: "choice", kicker: "Check", skill: "Great men or everyone",
        prompt: "According to Carlyle, who really shapes history?",
        options: [{ t: "Great leaders — everyone else carries out their ideas" },
                  { t: "Ordinary people, working together", fb: "That's the opposite view — you'll meet it on the next page." },
                  { t: "Luck and the weather", fb: "Carlyle put people at the center — but only the great ones." }],
        answer: 0,
        hints: ["Look at what he calls “the general mass of men.”"],
        why: "For Carlyle, history is “the History of the Great Men” — everyone else follows their lead." },

      read({ title: "The many, not the one", kicker: "Read · 2 of 3", blocks: [
        "Even before Carlyle spoke, a movement called [[Romanticism|An artistic movement of the late 1700s and 1800s that prized feeling, nature, and the worth of ordinary lives.]] was pulling the other way. Romantic poets found greatness in everyday life: a small flower was worth a poem, and a poor farmer's troubles mattered as much as a lord's.",
        "Romantic art, poetry, music and novels raised a big question: what — and who — is worth studying?",
        "The Russian novelist Leo Tolstoy gave one answer in *War and Peace* (1865–1869), a vast novel about Napoleon's invasion of Russia in 1812.",
        ["src", { title: "War and Peace", who: "Leo Tolstoy", when: "1869", i: "book",
          text: "We need only penetrate to the essence of any historic event — which lies in the activity of the general mass of men who take part in it — to be convinced that [[the will of the historic hero does not control the actions of the mass|Tolstoy turns Carlyle upside down: the crowd leads, and the “hero” follows.]] but is itself continually controlled.",
          cite: "From an early English translation." }]
      ] }),
      { type: "choice", kicker: "Check", skill: "Great men or everyone",
        prompt: "What is Tolstoy's main point?",
        options: [{ t: "Leaders are carried along by the actions of masses of people — not the other way around" },
                  { t: "Napoleon alone decided how the war would go", fb: "That's the great man view that Tolstoy was arguing against." },
                  { t: "History has no causes at all", fb: "Tolstoy believed in causes — he just thought they lay in the actions of the many." }],
        answer: 0,
        hints: ["Who controls whom, in his view?"],
        why: "For Tolstoy, the “hero” doesn't control the mass of people; the hero's will is controlled by them." },

      read({ title: "Napoleon's march", kicker: "Read · 3 of 3", blocks: [
        ["stat", "600,000", "soldiers marched into Russia with Napoleon in 1812. Fewer than one in five came back."],
        "Did one man's wish move all those soldiers? Tolstoy said no: the invasion happened through the choices of hundreds of thousands of people, and forces no single person controlled. Carlyle would answer that the march began in Napoleon's mind.",
        "Most historians today take something from both. Leaders' choices matter — but leaders make them inside conditions they didn't choose, and they need huge numbers of people to carry them out.",
        ["ask", "Think of a leader you know about. What could that leader *not* have done alone?"]
      ] }),
      { type: "choice", kicker: "Check", skill: "Great men or everyone",
        prompt: "Which view is closest to what most historians think today?",
        options: [{ t: "Leaders' choices matter, but so do conditions and the many people who act" },
                  { t: "Only great leaders matter", fb: "That's Carlyle's great man theory. Historians today also look at conditions and ordinary people." },
                  { t: "Leaders never matter at all", fb: "Leaders' choices do matter — just not alone." }],
        answer: 0,
        hints: ["Think of the pyramid: who ordered it, and who built it?"],
        why: "Most historians weigh both: leaders' decisions, and the conditions and people that make those decisions possible." },

      { type: "sort", kicker: "Put it together", skill: "Great men or everyone",
        prompt: "Who would say this — Carlyle or Tolstoy?",
        bins: ["Carlyle: great men", "Tolstoy: the many"],
        cards: [{ t: "Study the heroes, and you understand the age.", bin: 0, fb: "Understanding an age through its heroes is Carlyle's great man view." },
                { t: "The army moved because thousands of soldiers marched, not because one man wished it.", bin: 1, fb: "Crediting the thousands, not the one, is Tolstoy." },
                { t: "Great leaders are the light that shows everyone else the way.", bin: 0, fb: "Carlyle called the great man a light for the world." },
                { t: "A leader is carried along by his people, like a boat on a river.", bin: 1, fb: "The leader controlled by the mass — that's Tolstoy." },
                { t: "Everything achieved in the world began as a thought in a great man's mind.", bin: 0, fb: "That's Carlyle's claim almost word for word." },
                { t: "To find the cause of an event, look at everyone who took part in it.", bin: 1, fb: "Looking to the mass of people is Tolstoy's method." }],
        hints: ["Does the statement credit one person, or many?"],
        why: "Carlyle credits heroes and leaders.<br>Tolstoy credits the actions of the many." },

      { type: "explain", kicker: "In your own words",
        prompt: "Which kind of history do you find more convincing — the great man kind, or the everyone kind? Why?",
        model: "There's no single right answer. A strong one weighs both: leaders like Napoleon made real choices, but those choices only mattered because hundreds of thousands of people acted on them, in conditions no one person controlled." }
    ]
  };

  /* Practice: the great man view, the view from the many, and the balance. */
  var L12_GREAT = [
    "The empire rose because its founder was a genius.",
    "To understand the war, study the generals.",
    "History is the biography of great men.",
    "Without this one king, the kingdom would have collapsed.",
    "The revolution happened because one brilliant leader planned it.",
    "Ordinary people simply followed where their rulers led.",
    "A single speech by a great leader changed everything.",
    "The age is best understood through the lives of its heroes."
  ];
  var L12_MANY = [
    "The army marched because thousands of soldiers chose to march.",
    "To understand the war, read the letters of ordinary soldiers.",
    "The city grew because thousands of families moved there looking for work.",
    "Leaders are carried along by forces bigger than themselves.",
    "The revolution happened because millions of people were hungry and angry.",
    "The pyramid was built by thousands of workers, farmers and craftsmen.",
    "A king's command means nothing if no one obeys it.",
    "Everyday people, making countless small choices, shape their age."
  ];
  SKILLS.push({ id: "hist1-views", title: "Great men or everyone", lesson: 12,
    gen: function (R, i) {
      if (i === 2 || (i >= 3 && R.chance(0.3))) {
        var both = [["A historian argues that a queen's bold decision to go to war mattered — but only because her people were ready to fight and her treasury could pay for it.", "It weighs both the leader and the many"],
                    ["A historian shows that a new law was the king's idea, but that it only worked because thousands of local officials carried it out.", "It weighs both the leader and the many"],
                    ["A historian credits a general's plan for a victory, and also the weather and the soldiers' courage.", "It weighs both the leader and the many"]];
        var b = R.pick(both);
        return mc(R, { prompt: b[0] + "<br><br>Which view is this historian taking?",
          right: b[1],
          wrong: [{ t: "The great man view only", fb: "The historian does credit the leader — but not the leader alone." },
                  { t: "The view from the many only", fb: "The historian does credit the many — but the leader's choice matters too." }],
          hints: ["Does it credit one side, or both?"],
          why: "Crediting the leader's choice *and* the people and conditions that made it work is the balanced view most historians take today." });
      }
      var great = R.chance(0.5), s = R.pick(great ? L12_GREAT : L12_MANY);
      return { type: "choice", prompt: "“" + s + "”<br><br>Which view of history does this statement show?",
        options: [{ t: "Great men: leaders make history", fb: great ? undefined : "This credits many people, not one leader." },
                  { t: "The many: ordinary people make history", fb: great ? "This credits a leader or hero, not the many." : undefined }],
        answer: great ? 0 : 1, keep: true,
        hints: ["Does it credit one person, or many?"],
        why: great ? "It credits a single leader or hero — the great man view, like Carlyle's." : "It credits the actions of many people — the view Tolstoy argued for." };
    } });

  /* =========================================================== Lesson 13
     Interactive. Schools of interpretation — progressive, intellectual,
     social, Marxist, gender, postcolonial — met on one colonial town, and
     revisionism (section 1.3). */
  LESSONS[13] = {
    title: "One past, many lenses",
    blurb: "Progressive, intellectual, social, Marxist, gender, postcolonial: what each kind of historian looks for — in the very same place.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Great men or everyone",
        prompt: "Thomas Carlyle said that history is the story of its heroes and leaders.<br><br>What is that idea called?",
        options: [{ t: "The great man theory" },
                  { t: "Social history", fb: "Social history is the opposite: history from the bottom up." },
                  { t: "Romanticism", fb: "The Romantics found greatness in everyday lives — nearly the opposite of Carlyle." }],
        answer: 0,
        hints: ["It's named after the “great men” Carlyle praised."],
        why: "The great man theory holds that heroes and leaders shape history." },

      { type: "choice", kicker: "Guess first",
        prompt: "Two historians study the same town in the year 1700. One writes about its governor. The other writes about its washerwomen.<br><br>Which one is doing real history?",
        art: tiles([{ i: "crown", t: "The governor", c: "yellow" }, { i: "people", t: "The washerwomen", c: "blue" }]),
        options: [{ t: "Both — they're asking different questions" },
                  { t: "The one studying the governor", fb: "That's the great man instinct. The washerwomen's lives are history too." },
                  { t: "The one studying the washerwomen", fb: "Their lives matter — and so do the governor's decisions. Both are history." }],
        answer: 0,
        hints: ["Is there only one right question to ask about the past?"],
        why: "Both are history. Different questions light up different parts of the same past." },

      { type: "learn", kicker: "Watch",
        prompt: "The questions historians ask have changed over time. Follow how.",
        scene: { type: "unfold", next: "What came next?", steps: [
          { i: "arrow", t: "**1800s — progressive history.** The past is a road heading one way: toward democracy, on the European model.", c: "blue" },
          { i: "warn", t: "**After World War I (1914–1918),** steady progress seems absurd. Historians turn to ideas and the mind: **intellectual history**.", c: "purple" },
          { i: "people", t: "**1960s — social history.** History is made by all people, not just elites.", c: "green" },
          { i: "layers", t: "**New lenses follow:** Marxist history (class struggle), gender history, and postcolonial history.", c: "orange" }] },
        gate: true,
        then: "Each new lens **revised** the old great-man story, adding new people and new questions. That process is called **revisionism** — not erasing the past, but filling it in." },

      { type: "choice", kicker: "Careful", skill: "Lenses",
        prompt: "In **progressive history**, what does *progressive* mean?",
        options: [{ t: "The past moves in a straight line toward one goal — democracy, on a European model" },
                  { t: "Political views that favor change today", fb: "Here it names a school of history from the 1800s, not a modern political label. It saw the past as a road to one destination." },
                  { t: "History written by young historians", fb: "It's about how the past is pictured: a straight road toward democracy." }],
        answer: 0,
        hints: ["Think of the road in the first card."],
        why: "Progressive history pictured the past as a road toward democracy — the Western way. Assuming history heads to a set end is called **teleological** history." },

      { type: "learn", kicker: "Try it",
        prompt: "One place, six lenses: a town in colonial Latin America, from the 1500s to the 1820s.<br><br>Try each lens.",
        scene: { type: "lens" }, gate: true,
        then: "Each lens brings some things into focus and lets others blur. No single one shows everything — together they come closer." },

      { type: "slots", skill: "Lenses",
        prompt: "Match each question to the historian who would ask it.",
        slots: [{ id: "so", label: "Social" }, { id: "ma", label: "Marxist" }, { id: "in", label: "Intellectual" }, { id: "po", label: "Postcolonial" }],
        cards: [{ t: card("bowl", "What did families in the town eat, and whom did they marry?"), slot: "so", fb: "Everyday life — food, work, marriage — is social history." },
                { t: card("mine", "Who profited from the silver mines, and when did the miners rebel?"), slot: "ma", fb: "Profit, labor and revolt are the questions of Marxist history." },
                { t: card("book", "What did Indigenous writers argue about God and nature?"), slot: "in", fb: "Ideas and arguments are intellectual history." },
                { t: card("globe", "Why is the region still so unequal, long after independence?"), slot: "po", fb: "Colonial rule's lasting effects are postcolonial history." }],
        hints: ["Everyday life → social. Work and profit → Marxist. Ideas → intellectual. After empire → postcolonial."],
        why: "Food and marriage: social. Mines and revolts: Marxist. Writers' ideas: intellectual. Inequality after independence: postcolonial." },

      { type: "choice", skill: "Lenses",
        prompt: "A historian studies how ideas about “proper work for a lady” kept women out of skilled trades in a colonial city.<br><br>Which lens is that?",
        options: [{ t: "Gender history" },
                  { t: "Marxist history", fb: "Marxist history focuses on class and labor conflict. This is about ideas of men's and women's roles." },
                  { t: "Progressive history", fb: "Progressive history tracks the road toward democracy. This is about ideas of men's and women's roles." }],
        answer: 0,
        hints: ["What idea is keeping the women out?"],
        why: "Ideas about men's and women's roles — and the power they carry — are the subject of gender history." },

      { type: "choice", skill: "Lenses",
        prompt: "An old history of a colony told only of its governors. A new one adds the stories of women, enslaved workers and Indigenous towns.<br><br>What is this process called?",
        options: [{ t: "Revisionism" },
                  { t: "Rhetoric", fb: "Rhetoric is choosing words for effect. Adding new voices and lenses to revise the story is revisionism." },
                  { t: "Iconography", fb: "Iconography is the language of images. This is revisionism." }],
        answer: 0,
        hints: ["The old story is being *revised*."],
        why: "Revisionism revises our picture of the past by adding new people, new sources and new lenses." },

      { type: "choice", kicker: "Put it together", skill: "Lenses",
        prompt: "Why do historians use many lenses rather than just one?",
        options: [{ t: "Each shows part of the picture; together they come closer to the whole" },
                  { t: "Because one lens is always wrong", fb: "Each lens shows something real — the danger is using *only* one." },
                  { t: "So they never have to reach a conclusion", fb: "Historians do reach conclusions — after looking through as many lenses as they can." }],
        answer: 0,
        hints: ["Think of what faded from view when you picked each lens."],
        why: "Every lens lights up some things and blurs others. Using many gets closer to the whole past." },

      { type: "explain", kicker: "In your own words",
        prompt: "Pick one lens. What question would a historian using it ask about your own school?",
        model: "A social historian might ask what a normal school day was like for students here. A gender historian might ask whether boys and girls are treated differently in sports or classes." }
    ]
  };

  /* Practice: which lens asks this question? */
  var L13_L = ["Progressive", "Intellectual", "Social", "Marxist", "Gender", "Postcolonial"];
  var L13_DO = ["tracks the road toward democracy and self-government", "studies ideas — what people thought, wrote and argued",
    "studies the everyday lives of all kinds of people", "studies class struggle — who works, who profits, and the conflicts between them",
    "studies how ideas about men's and women's roles shaped lives and power", "studies the lasting effects of colonial rule on the colonized"];
  var L13_Q = [
    ["How did town councils give more people a say over time?", 0], ["When did ordinary people win the right to vote?", 0],
    ["How did written constitutions spread from country to country?", 0], ["How did the power of kings shrink as parliaments grew?", 0],
    ["What did philosophers in the city argue about freedom?", 1], ["Which books did people read, and how did their ideas spread?", 1],
    ["How did religious thinkers of the time explain disease?", 1], ["What ideas inspired the rebels' speeches?", 1],
    ["What did ordinary families eat for dinner?", 2], ["At what age did most people marry?", 2],
    ["What games did children play?", 2], ["How did farmers' days change with the seasons?", 2],
    ["Who owned the mines, and who did the dangerous work in them?", 3], ["Why did the factory workers go on strike?", 3],
    ["How did landowners grow rich from their tenants' labor?", 3], ["When did the poor rise up against the rich?", 3],
    ["How was work divided between women and men in the household?", 4], ["Why were women kept out of certain trades?", 4],
    ["How did ideas of manhood shape who became a soldier?", 4], ["What rights did married women have over property?", 4],
    ["Why do former colonies still sell raw materials to the countries that ruled them?", 5], ["How do borders drawn by colonial powers cause conflict today?", 5],
    ["How did colonizers' racism decide who could go to school?", 5], ["Whose version of the past do a former colony's history books tell?", 5]
  ];
  SKILLS.push({ id: "hist1-lens", title: "Lenses", lesson: 13,
    gen: function (R, i) {
      var q = R.pick(L13_Q), k = q[1];
      if (i >= 3 && R.chance(0.5)) {
        var others = sample(R, L13_Q.filter(function (x) { return x[1] !== k; }), 3);
        return mc(R, { prompt: (k === 1 ? "An" : "A") + " **" + L13_L[k].toLowerCase() + "** historian " + L13_DO[k] + ".<br><br>Which question would that historian most likely ask?",
          right: q[0],
          wrong: others.map(function (x) { return { t: x[0], fb: "That's a question for " + (x[1] === 1 ? "an " : "a ") + L13_L[x[1]].toLowerCase() + " historian, who " + L13_DO[x[1]] + "." }; }),
          hints: ["What does " + (k === 1 ? "an " : "a ") + L13_L[k].toLowerCase() + " historian look for?"],
          why: "“" + q[0] + "” fits " + (k === 1 ? "an " : "a ") + L13_L[k].toLowerCase() + " historian, who " + L13_DO[k] + "." });
      }
      var wrong = sample(R, [0, 1, 2, 3, 4, 5].filter(function (x) { return x !== k; }), 3);
      return mc(R, { prompt: "“" + q[0] + "”<br><br>Which kind of historian is most likely to ask this?",
        right: L13_L[k] + " history",
        wrong: wrong.map(function (x) { return { t: L13_L[x] + " history", fb: L13_L[x] + " history " + L13_DO[x] + ". Is that what this question is about?" }; }),
        hints: ["Is it about democracy, ideas, everyday life, class, gender roles, or the effects of empire?"],
        why: "The question is about what " + L13_L[k].toLowerCase() + " history " + L13_DO[k].replace(/^(tracks|studies) /, "looks at: ") + "." });
    } });

  /* =========================================================== Lesson 14
     Reading. Social constructs, bias, and historical empathy — meeting the
     past on its own terms — and the historian's toolkit (section 1.3). */
  LESSONS[14] = {
    title: "Seeing with their eyes",
    blurb: "Social constructs, your own biases, and historical empathy: meeting the past on its own terms.",
    mins: 10, kind: "read",
    steps: [
      { type: "choice", kicker: "Remember?", skill: "Lenses",
        prompt: "“Who owned the mines, and who did the dangerous work in them?”<br><br>Which lens asks that?",
        options: [{ t: "Marxist history" },
                  { t: "Intellectual history", fb: "Intellectual history studies ideas. Owners, workers and profit are Marxist history's questions." },
                  { t: "Progressive history", fb: "Progressive history tracks the road toward democracy. This is about class and labor — Marxist history." }],
        answer: 0,
        hints: ["Who works, and who profits?"],
        why: "Marxist history studies class struggle: who does the work, who keeps the profit, and the conflict between them." },

      { type: "choice", kicker: "Guess first",
        prompt: "Most people dress very differently for a job interview than for a party.<br><br>Why?",
        art: tiles([{ i: "person", t: "Interview", c: "blue" }, { i: "music", t: "Party", c: "purple" }]),
        options: [{ t: "People share unwritten ideas about what is proper for each" },
                  { t: "A law says what to wear to an interview", fb: "No law says so. It's an idea almost everyone around you shares." },
                  { t: "Interview clothes are more comfortable", fb: "Usually the opposite! People dress up because of a shared idea about what's proper." }],
        answer: 0,
        hints: ["Who decided what counts as “proper” interview clothes?"],
        why: "Nothing in nature says a suit means “serious.” It's an idea a society made and agrees on — and it shapes what people do." },

      read({ title: "Ideas everyone agrees to", kicker: "Read · 1 of 4", blocks: [
        "In 1966, two sociologists, Peter Berger and Thomas Luckmann, argued that much of what we take for granted is built by society. They called these ideas [[social constructs|Ideas a society creates and agrees on — like social class, or what counts as proper for boys and girls — that shape how people think and act.]].",
        "Social constructs are everywhere, and they mostly work below the surface. Try these:",
        ["ask", "What would you buy a five-year-old girl for her birthday? A boy the same age? What shaped your answer?"],
        ["ask", "At the front of a classroom stand a woman in a tailored suit and a man in jeans and a T-shirt. Whom would you respect more at first? Why?"],
        "To understand the past, you need to know the constructs people then lived by — and notice the ones you carry into your reading."
      ] }),
      { type: "choice", kicker: "Check", skill: "Seeing with their eyes",
        prompt: "Which of these is a social construct?",
        options: [{ t: "The idea that pink is for girls and blue is for boys" },
                  { t: "The Earth goes around the Sun", fb: "That's a fact of nature — true whatever any society believes." },
                  { t: "Water freezes when it gets cold enough", fb: "That's nature too. A social construct is an idea people made and agree on." }],
        answer: 0,
        hints: ["Which one could be different in a different society?"],
        why: "Colors have no gender in nature. Linking pink to girls is an idea a society made — and some societies have even had it the other way round." },

      read({ title: "Everyone reads through a lens", kicker: "Read · 2 of 4", blocks: [
        "Everyone has [[biases|Leanings and assumptions, shaped by our family, place and experience, that tilt how we see things.]]. Historians work hard to spot theirs, but no one can step completely outside their own time.",
        "Bias isn't always a problem. In the 1960s and 1970s, young historians who sympathized with the protest movements of their day went looking for ordinary people's voices — and found whole new kinds of sources.",
        "The danger is seeing through only one lens, without knowing you're wearing it."
      ] }),
      { type: "choice", kicker: "Check", skill: "Seeing with their eyes",
        prompt: "According to the reading, how can a historian's bias sometimes help?",
        options: [{ t: "It can lead them to ask new questions nobody had asked" },
                  { t: "It lets them skip checking the evidence", fb: "Never. A bias might suggest a question — the evidence still has to answer it." },
                  { t: "It makes their conclusions automatically right", fb: "Bias can open a new question, but it can't make the answer right." }],
        answer: 0,
        hints: ["Think of the historians of the 1960s."],
        why: "Sympathy for ordinary people led 1960s historians to ask new questions — and to find new sources to answer them." },

      read({ title: "Meeting the past on its own terms", kicker: "Read · 3 of 4", blocks: [
        "The last tool in the kit is [[historical empathy|The ability to see the past on its own terms — understanding why people then acted as they did, without judging them by today's attitudes.]].",
        "Empathy is not approval. A historian can explain why people made choices we find terrible today — conquest, slavery, cruelty — without excusing them. The job is to understand, and to explain clearly.",
        "Its opposite is judging people in the past as though they should have known everything we know now.",
        ["note", "Try it", "In the 1300s, many Europeans blamed the plague on “bad air.” They weren't foolish: no one had ever seen a germ, and the microscopes that would reveal them lay centuries in the future. Given what they knew, bad air was a reasonable guess.", "eye"]
      ] }),
      { type: "sort", kicker: "Check", skill: "Seeing with their eyes",
        prompt: "Which statements show historical empathy, and which judge the past by today?",
        bins: ["Historical empathy", "Judging by today"],
        cards: [{ t: "They blamed bad air because no one yet knew about germs.", bin: 0, fb: "That explains their belief from what they knew — empathy." },
                { t: "People in the 1300s were stupid to believe in bad air.", bin: 1, fb: "That judges them by knowledge they couldn't have had." },
                { t: "To see why they built this temple, first learn what they believed about their gods.", bin: 0, fb: "Starting from their beliefs is meeting the past on its own terms." },
                { t: "Medieval farmers should have used tractors.", bin: 1, fb: "Tractors didn't exist for another 600 years — that's judging by today." },
                { t: "The rulers' choice made sense given the threats they faced — even if we reject it now.", bin: 0, fb: "Explaining without excusing is exactly what empathy does." },
                { t: "Ancient people were simply less intelligent than we are.", bin: 1, fb: "They were just as intelligent; they knew different things." }],
        hints: ["Does it explain people from what they knew — or blame them for not knowing what we know?"],
        why: "Empathy explains people from their own world and knowledge.<br>Judging by today blames them for not knowing what we know." },

      read({ title: "A picture still being painted", kicker: "Read · 4 of 4", blocks: [
        "The more lenses and voices historians bring together, the truer the picture gets. And there's more to do: new research in LGBTQ+ history, Indigenous history, and the history of the Global South keeps sharpening it.",
        ["tiles", [{ i: "search", t: "Evidence" }, { i: "map", t: "Dates and maps" }, { i: "scroll", t: "Sources", c: "orange" },
                   { i: "layers", t: "Causes", c: "green" }, { i: "eye", t: "Lenses", c: "purple" }, { i: "heart", t: "Empathy", c: "red" }], "Your historian's toolkit"],
        "You now carry a historian's toolkit: evidence, dates and maps; sources and the four questions; causes; lenses; and empathy. Next, the journey begins — with the very first humans."
      ] }),

      { type: "explain", kicker: "Put it together",
        prompt: "In your own words: what does it mean to meet the past “on its own terms”? Give an example.",
        model: "It means understanding why people acted as they did from what they knew and believed then, without judging them by today's knowledge. For example, people in the 1300s blamed disease on bad air because no one knew about germs." }
    ]
  };

  /* Practice: empathy or judging by today; constructs or nature. */
  var L14_EMP = [
    "They blamed bad air for disease because no one yet knew about germs.",
    "To understand the ritual, first learn what the people believed about their gods.",
    "The king's harsh law made sense to him given the rebellion he feared — even if we reject it.",
    "Sailors trusted the stars because they had no better way to navigate.",
    "Farmers planted by the phases of the moon because that was the knowledge their elders passed on.",
    "People accepted the emperor's rule because they believed heaven had chosen him.",
    "The town hunted 'witches' out of real terror, in a world with no scientific explanation for disaster.",
    "Travelers wrote of monsters in far lands because rumors were all that reached them."
  ];
  var L14_JUDGE = [
    ["People in the 1300s were foolish to believe in bad air.", "They couldn't have known about germs — that's judging by today's knowledge."],
    ["Ancient people were simply less intelligent than we are.", "They were just as intelligent; they knew different things."],
    ["Medieval farmers should have used tractors.", "Tractors lay centuries in the future — that's judging by today."],
    ["The Romans were silly not to use the internet to govern their empire.", "There was no internet for nearly two thousand years."],
    ["Old maps are worthless because their makers got the shapes wrong.", "Mapmakers drew what they knew — and old maps show us how they saw the world."],
    ["Anyone in the past who believed in many gods was ignorant.", "That judges their beliefs by ours instead of understanding them."],
    ["Explorers should have known the Earth's exact size before they sailed.", "They worked with the knowledge of their time."],
    ["People long ago were cruel by nature, unlike us.", "People then weren't born crueler; they lived by different constructs and circumstances."]
  ];
  var L14_EXCUSE = [
    "Conquest was fine back then, because everyone accepted it.",
    "Slavery wasn't wrong in the past, since it was legal.",
    "We shouldn't study cruel rulers, because they were bad people."
  ];
  var L14_CON = ["The idea that pink is for girls and blue is for boys", "Which fork to use first at a formal dinner", "The belief that some jobs are only for men",
    "Which social class a person is said to belong to", "The rule that a suit means you're serious", "The idea that adulthood begins at 18",
    "What counts as a 'proper' way to greet an elder", "Which clothes count as fancy"];
  var L14_NAT = ["Water boils when it gets hot enough", "Plants need light to grow", "The Earth goes around the Sun", "People need food to live",
    "Winter days are shorter than summer days in the north", "Bones can break"];
  SKILLS.push({ id: "hist1-empathy", title: "Seeing with their eyes", lesson: 14,
    gen: function (R, i) {
      var form = i === 2 ? 1 : i >= 3 ? R.pick([0, 1, 2]) : 0;
      if (form === 1) {
        var c = R.pick(L14_CON), n = sample(R, L14_NAT, 2);
        return mc(R, { prompt: "Which of these is a **social construct** — an idea a society made and agrees on?",
          right: c, wrong: n.map(function (x) { return { t: x, fb: "That's a fact of nature, true whatever any society believes." }; }),
          hints: ["Which one could be different in a different society or time?"],
          why: "“" + c + "” is an idea a society created and agrees on — another society could see it differently." });
      }
      if (form === 2) {
        var e = R.pick(L14_EMP), j = R.pick(L14_JUDGE), x = R.pick(L14_EXCUSE);
        return mc(R, { prompt: "Which statement shows **historical empathy**?",
          right: e,
          wrong: [{ t: j[0], fb: j[1] }, { t: x, fb: "That excuses the past instead of understanding it. Empathy explains why people acted — it doesn't approve." }],
          hints: ["Empathy explains people from their own world — without judging them by ours, and without excusing them."],
          why: "“" + e + "” explains people from what they knew and believed then. That's historical empathy." });
      }
      var emp = R.chance(0.5), s = emp ? R.pick(L14_EMP) : R.pick(L14_JUDGE);
      return { type: "choice", prompt: "“" + (emp ? s : s[0]) + "”<br><br>Does this statement show historical empathy, or judge the past by today?",
        options: [{ t: "Historical empathy", fb: emp ? undefined : s[1] },
                  { t: "Judging by today", fb: emp ? "It explains their choice from what they knew and believed — that's empathy." : undefined }],
        answer: emp ? 0 : 1, keep: true,
        hints: ["Does it explain people from what they knew — or blame them for not knowing what we know?"],
        why: emp ? "It explains people from their own knowledge and beliefs — historical empathy." : s[1] };
    } });

L.unit("hist", 1, {
    title: "Understanding the past",
    lessons: LESSONS.slice(1),
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Why history matters, dates and centuries, global citizens, and maps as evidence.", skills: ["hist1-why", "hist1-dates", "hist1-century", "hist1-global", "hist1-maps"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Primary and secondary sources, objects as evidence, the four questions, and judging sources.", skills: ["hist1-primary", "hist1-objects", "hist1-aaic", "hist1-reliable"], per: 2 },
      { title: "Quiz 3", after: 10, blurb: "Two accounts that clash, rhetoric, and the voices history left out.", skills: ["hist1-accounts", "hist1-rhetoric", "hist1-hidden", "hist1-aaic"], per: 2 },
      { title: "Quiz 4", after: 14, blurb: "Causes, great men or everyone, historians' lenses, and historical empathy.", skills: ["hist1-cause", "hist1-views", "hist1-lens", "hist1-empathy"], per: 2 }
    ],
    skills: SKILLS
  });
})();
