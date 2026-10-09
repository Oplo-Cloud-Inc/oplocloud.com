/* ==========================================================================
   Introduction to Philosophy — Unit 1: Introduction to philosophy.
   See lab/core.js for the format and lab/philkit.js for the scenes.

   Follows chapter 1 of OpenStax's Introduction to Philosophy — what
   philosophy is and where it began, how philosophers weigh evidence and test
   an idea, Socrates as the model of a philosophical life, and what
   philosophers do today — in twenty lessons. The chapter's topics are
   followed; every sentence, example and problem here is OEdu's own, and the
   primary sources quoted are in the public domain.

   Each lesson teaches one idea the way a good teacher does. The method
   lessons run one arc: a warm-up on what is already known, the idea in plain
   words, one example worked in front of the student (Watch), the same
   example done with the student (Together), then alone, a harder case, a
   find-the-flaw, and a use in real life; every lesson ends by building its
   own big idea out of pieces. Reasons are always blue and claims always
   orange. Nothing is locked: any step, lesson or unit can be opened first.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB, H = L.H, P = L.P;
  var mc = L.mc, icon = H.icon, card = H.card, tiles = H.tiles, read = H.read, sample = H.sample;
  var pic = P.pic, chip = P.chip, say = P.say, board = P.board, quote = P.q;
  var LESSONS = [], SKILLS = [];   // lesson-count: 20

  /* ------------------------------------------------------------ Practice helpers
     Every practice skill draws five fresh problems from a bank of items. These keep the
     generators short: a choice with its right answer and a few wrong ones that each carry
     their reply, a sort made from a bank, and a two-way question. */
  function opt(t, fb) { return fb == null ? { t: t } : { t: t, fb: fb }; }
  // mcq(R, { prompt, right, wrong: [[text, reply], …], n: how many wrong ones, hints, why }) → a choice step
  function mcq(R, o) {
    var wrong = (o.n ? sample(R, o.wrong, o.n) : o.wrong).map(function (w) { return Array.isArray(w) ? opt(w[0], w[1]) : w; });
    return mc(R, { prompt: o.prompt, right: typeof o.right === "string" ? o.right : o.right.t, wrong: wrong, hints: o.hints, why: o.why });
  }
  // sorter(R, bins, bank, per, o): a sort step with `per` cards from each bin; bank[bin] = [[text, reply], …]
  function sorter(R, bins, bank, per, o) {
    var cards = [];
    bins.forEach(function (b, k) { sample(R, bank[k], per).forEach(function (x) { cards.push({ t: x[0], bin: k, fb: x[1] }); }); });
    return Object.assign({ type: "sort", bins: bins, cards: R.shuffle(cards) }, o);
  }
  // One item from a bank, drawn from a different slice of it for each problem of a sitting (i), so five problems rarely repeat.
  function pickBy(R, arr, i) { var k = Math.min(5, arr.length), sub = arr.filter(function (_, j) { return j % k === i % k; }); return R.pick(sub.length ? sub : arr); }
  // Stand-ins for a made-up person, so practice problems don't always use the same names.
  var NAMES = ["Ana", "Ben", "Chen", "Dev", "Eli", "Farah", "Gus", "Hana", "Ivo", "Jun", "Kai", "Lena", "Mo", "Nia", "Omar", "Priya"];

  /* The step that ends every lesson: its big idea, built from pieces
     (lab/algkit.js). It is also what "Concepts you've built" on the unit page
     lists. k is the lesson number; frame has [[gaps]]. */
  function concept(k, name, frame, o) {
    return Object.assign({
      type: "build", kicker: "Sum it up", id: "phil:1:" + k + ":concept", skill: "Concepts", name: name, frame: frame,
      prompt: "Put the pieces where they belong to build this lesson's big idea.",
      hints: ["Say the sentence out loud with a piece in place. Does it match what you did in this lesson?"],
      why: "That's this lesson's big idea, built. It is saved under **Concepts you've built** on the unit page."
    }, o || {});
  }

  /* ============================================================ Lesson 1
     What is philosophy? Taught the watch · read · write way (lab/edpkit.js):
     a short film that stops to ask, a reading with questions inside it, and a
     response in the learner's own words, checked against a model. The film is
     the course's own, on its YouTube channel, and is played exactly as it was made (section 1.1). */
  LESSONS[1] = {
    v: 2,
    title: "What is philosophy?",
    blurb: "A short film that stops to ask you things, a reading with questions inside it, then your own words.",
    mins: 14,
    steps: [
      { type: "learn", kicker: "Watch", prompt: "",
        scene: { type: "watch", id: "phil1-film", youtube: "anoAsItMmm8", duration: 474.1, title: "What is philosophy?",
          chapters: [{ t: 0, n: "Welcome" }, { t: 25.8, n: "Sages" }, { t: 223.7, n: "Roots of science" }, { t: 321.2, n: "How it hangs together" }, { t: 431.5, n: "Recap" }],
          stops: [
            { id: "p1-guess", at: 12.8, kind: "reflect", q: "Before we begin: in a sentence, what do you think philosophy is?", placeholder: "Philosophy is…" },
            { id: "p1-oruka", at: 165.9, from: 137.7, kind: "mc",
              q: "Oruka interviewed sages and kept only some of their sayings. Which ones?",
              options: [{ t: "The ones that showed a reasoned way of inquiring into how things really are", ok: true },
                        { t: "The oldest ones", fb: "Age wasn't his test. He kept the sayings that showed *reasoned* inquiry, whatever their age." },
                        { t: "The ones everyone already agreed with", fb: "Agreement wasn't the test either. These sages kept a critical distance from their own culture's wisdom." },
                        { t: "The ones about the gods", fb: "The subject wasn't the test. The question was whether the saying gave good reasons." }],
              why: "That is what makes folk wisdom into **philosophy**: asking for good reasons." },
            { id: "p1-traits", at: 206.6, from: 33.4, kind: "multi",
              q: "Which **three** traits did the sages share?",
              options: [{ t: "Willingness to question tradition", ok: true }, { t: "Curiosity about nature and our place in it", ok: true }, { t: "Applying reason", ok: true },
                        { t: "Winning every argument", fb: "Nobody was judged on winning. The three traits were about questioning, curiosity and reason." },
                        { t: "Repeating the old stories exactly", fb: "It's the opposite: they were willing to *question* tradition." }],
              why: "Question tradition, be curious about nature, apply reason. Keep those three: the next part shows them at work." },
            { id: "p1-sci", at: 306.4, from: 223.7, kind: "mc",
              q: "What made the work of Xenophanes, Democritus and Pythagoras **scientific**?",
              options: [{ t: "They used reason to look for hidden causes and patterns", ok: true },
                        { t: "They ran careful experiments in a laboratory", fb: "There were no labs. What mattered was the *kind of explanation*: reasoned, and looking beneath what we see. Labs came much later." },
                        { t: "They agreed with the sages' old stories", fb: "They explained nature through reason instead of leaning on the old stories." },
                        { t: "They were the first people ever to ask questions", fb: "People asked questions long before. What was new was *how* they answered." }],
              why: "A rainbow from clouds, a world of atoms, a nature that follows number: each looks for a **hidden cause or pattern** behind what we see." },
            { id: "p1-sand", at: 380.2, from: 363.2, kind: "mc",
              q: "A beach's sand grain count changes every day. True, but is it worth a philosopher's time?",
              options: [{ t: "Not much. The number teaches nothing about how things hang together", ok: true },
                        { t: "Yes. Every fact is equally worth studying", fb: "No topic is ruled out in principle, but not all deserve equal attention." },
                        { t: "No, because nobody could count them", fb: "Whether you *can* count them isn't the point. A perfect count still wouldn't help us understand how things fit together." }],
              why: "Philosophers choose the questions that help us understand the world and our place in it." }
          ] } },

      { type: "learn", kicker: "Read", prompt: "A lover, not an owner",
        scene: { type: "doc", meta: "2 min", blocks: [
          ["fig", "friends", "Philosophy often starts like this: friends talking late, and someone asking *but why?*"],
          "Ask ten people what philosophy is and you will get ten answers. That is not a failure. It is a clue. Philosophy is hard to define because it asks about the **widest** things there are: nature, the mind, right and wrong, beauty, and how people live together.",
          ["q", { id: "p1-wide", kind: "mc", q: "Why is philosophy so hard to define?",
            options: [{ t: "It asks about the widest things there are", ok: true },
                      { t: "Nobody has ever asked it a real question", fb: "People have asked big questions for thousands of years. The trouble is that there are so many kinds." },
                      { t: "It was only invented recently", fb: "It is among the oldest kinds of thinking. The film went back to ancient India, China, Africa and Greece." }],
            why: "A subject that has to be able to ask about *everything* can't be pinned down in one line." }],
          "The first Greek thinkers we now call philosophers were not called that. They were called [[sages|Wise people. Many early cultures honoured a few of them: the ones you asked when a question was too big for everyone else.]]. One old story says a thinker named Pythagoras was the first to use the new word about himself. Asked what he was, he said he was no wise man, because only a god is truly wise. He was a **lover** of wisdom.",
          ["note", "A story told long after", "We only know this story from writers who lived centuries later, so historians hold it loosely. Even if it is only a story, it makes a real point: it is a humbler job to *love* wisdom than to *claim* it.", "scroll"],
          ["q", { id: "p1-humble", kind: "mc", q: "Why is “lover of wisdom” a humbler name than “wise man”?",
            options: [{ t: "A lover is still searching; a wise man says he has already arrived", ok: true },
                      { t: "A lover knows less than a wise man ever did", fb: "It isn't about how much anyone knows. It's about whether you claim to have finished looking." },
                      { t: "“Lover” is just a fancier word for a student", fb: "A philosopher isn't a student of one fixed subject. The name is about going after wisdom, not about school." }],
            why: "A lover of wisdom keeps going after it. Calling yourself *wise* says the search is over." }],
          ["ask", "Which would you rather be called: wise, or a lover of wisdom? Why?"]
        ] } },

      { type: "learn", kicker: "Write", prompt: "Now say it in your own words: what is philosophy? Use one person or example from the film.",
        scene: { type: "write", id: "phil1-write", recall: "p1-guess", placeholder: "Philosophy is…", min: 12,
          frames: ["Philosophy is…", "In the film,", "That counts as philosophy because"],
          model: "Philosophy is the love of wisdom: asking the widest, most basic questions, such as how everything fits together, and answering them with reasons. In the film, Thales didn't stop at predicting an eclipse. He asked what all matter is made of, and that isn't something you can settle by looking it up. You have to reason about it.",
          rubric: ["Says philosophy asks the widest, most basic questions, or how everything fits together", "Uses a person or an example from the film", "Gives a reason, not only a claim"] } }
    ]
  };

  /* ============================================================ Lesson 2
     Sages around the world: India, China, Africa and Greece, and what the
     sages had in common (section 1.1: Historical Origins of Philosophy). */
  LESSONS[2] = {
    title: "Sages around the world",
    blurb: "Wise people in India, China, Africa and Greece, and what they all had in common.",
    mins: 12, kind: "read",
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Sages",
        prompt: "Someone tells you: \"We do it this way because we've always done it this way.\"<br><br>What would a **lover of wisdom** most likely say?",
        options: [{ t: "\"But *why* do we do it this way? Is it a good way?\"" },
                  { t: "\"Great. Then there's nothing more to ask.\"", fb: "A lover of wisdom keeps asking. \"We've always done it\" is where the questions start." },
                  { t: "\"Then it must be wrong, because it's old.\"", fb: "Old doesn't make something wrong, either. The point is to ask for reasons." }],
        answer: 0,
        hints: ["Remember L1: a philosopher takes nothing for granted."],
        why: "Asking *why* about what everyone takes for granted is the heart of philosophy.<br>The oldest thinkers did it long before anyone used the word." },

      read({ title: "Seven rishis and a flood", kicker: "Read · India", blocks: [
        ["fig", "manu", "Manu, the first man, and seven sages ride out a great flood in a boat. Painted in India in the late 1700s.", { tall: true }],
        "In India the oldest teachers were the **Seven Sages**, the *Saptarishi*: seven *rishis*. Tradition says they received the **Vedas**, the oldest sacred texts. The Vedas are called *shruti*, which means [[\"what was heard\"|Not made up by a person but received, the way you hear something said to you. The tradition says the sages heard the Vedas, and only later were they written down.]].",
        "The rishis lived simply. They trained body and mind through *tapas*, meditation and discipline. They are part history and part myth: the stories say they came from the gods, and that new ones appear in each new age.",
        "Women appear in these early texts too. In the Upanishads, a woman named **Gargi** challenges the great sage Yajnavalkya in public, question after question, about what holds the whole world together. She finally agrees he knows more. **Maitreyi**, his wife, turns down her share of his wealth. It would not make her immortal, she says, so she asks him to teach her instead. India later gave women far fewer chances to study, but these two are in the oldest books.",
        ["ask", "Why might a tradition say its oldest wisdom was *heard*, not invented?"]
      ] }),
      { type: "choice", kicker: "Check", skill: "Sages",
        prompt: "In the story of the Seven Sages, where does the wisdom come from?",
        options: [{ t: "Received by the sages, and trained through meditation and discipline" },
                  { t: "Written by one famous king and handed down", fb: "The tradition says it came *to* the sages. No king wrote the Vedas." },
                  { t: "Worked out in a laboratory", fb: "That's a modern kind of inquiry. These sages gained wisdom through *tapas*: meditation and discipline." }],
        answer: 0,
        hints: ["Think of the word *shruti* and of *tapas*."],
        why: "Wisdom that was *heard*, and a way of life (*tapas*) that trained mind and body to hear it." },

      read({ title: "The sage with an ear", kicker: "Read · China", blocks: [
        ["fig", "hanfei", "Han Feizi, a Chinese thinker who lived more than 2,200 years ago, wrote about sages as the people who invented the basics of civilised life.", { tall: true }],
        "In China the word is *sheng*. The old tales of sages are tales of **inventors and rescuers**. One taught people to build nests in the trees, away from beasts: the Nest Builder. One taught them to make fire by drilling wood: the Fire Maker. Another, Yu, saved the land from a great flood by digging canals instead of only building walls.",
        "Confucius praised these old sages again and again, for their skill, for ruling well, and for their wisdom. Were they real people, or myths about early human progress? Scholars still argue. Either way, the tradition is clear about the *kind* of person a sage is.",
        "The Chinese character for *sheng* contains the picture of an **ear**. Scholars read this as a clue: a sage is one who **listens** for insight, and then shares it or acts on it to help everyone.",
        ["ask", "Is a sage an inventor, a teacher, or a ruler? Can one person be all three?"]
      ] }),
      { type: "choice", kicker: "Check", skill: "Sages",
        prompt: "In the old Chinese tales, what do the Nest Builder, the Fire Maker and Yu have in common?",
        options: [{ t: "Each found something that made human life safer or better" },
                  { t: "Each was a king who won great wars", fb: "None of them is praised for war. They are praised for what they *made* or *discovered*." },
                  { t: "Each wrote a book of philosophy", fb: "They belong to the old stories. The tales praise what they did, not books." }],
        answer: 0,
        hints: ["Nests, fire, canals. What are those for?"],
        why: "Nests, fire and canals each make life safer. The sage is the one who finds the way and shares it." },

      read({ title: "Sages who were never written down", kicker: "Read · Africa", blocks: [
        "In the 1970s a Kenyan philosopher, **Henry Odera Oruka**, went looking for sages. He travelled through rural Kenya and interviewed people whom their own communities called wise. He wrote down what they said and published it as *Sage Philosophy* (1990).",
        "His big question: is this *philosophy*, or just tradition repeated? So he kept only the sayings that showed careful, reasoned thinking about what things really are.",
        "What he found was a tension. The sages passed on the wisdom of their people, **and** they kept a critical distance from it. They asked whether the beliefs of their culture were actually justified. Respecting a tradition while still asking *why* is exactly what the first philosophers did.",
        ["note", "Philosophy without books", "Most of these sages never wrote anything down. Philosophy is a way of thinking, not a shelf of books.", "ear"]
      ] }),

      read({ title: "Thales and the Seven", kicker: "Read · Greece", blocks: [
        ["fig", "diogenes", "Diogenes Laërtius, who wrote the best-known ancient book about the Greek sages, probably in the 200s CE. His book is our main source.", { tall: true }],
        "Greek tradition counts **seven sages**. The lists differ a little, but one name is always first: **Thales of Miletus**. He studied astronomy in Egypt and is said to have predicted the solar eclipse of **585 BCE**. Another story says he measured the height of a pyramid from its shadow.",
        "A third story shows he could have been rich. Expecting a huge olive harvest, he rented every olive press early, then rented them out at a high price. Aristotle told the tale to show that philosophers *could* get rich, if they wished.",
        "But Thales also asked huge questions. He said everything is made of **water**, and that things which move on their own, like a magnet, have a \"soul\".",
        "**Solon**, another of the seven, was a lawmaker. He cancelled people's debts, freed those who had been made slaves because of what they owed, and gave Athens a constitution. Then he stepped down, so that he would not become a tyrant.",
        ["note", "Women in the schools", "Not many women appear in the sources. But ancient writers report that the school of Pythagoras welcomed them, and they name Theano and Myia among its thinkers.", "people"]
      ] }),

      { type: "slots", kicker: "Together", skill: "Sages",
        prompt: "Match each sage to the thing they are known for.",
        slots: [{ id: "gar", label: "Gargi" }, { id: "han", label: "The old Chinese tales" }, { id: "oru", label: "Henry Odera Oruka" },
                { id: "tha", label: "Thales" }, { id: "sol", label: "Solon" }],
        cards: [{ t: "Questioned a great sage in public about what holds the world together", slot: "gar", fb: "That's Gargi's debate with Yajnavalkya in the Upanishads." },
                { t: "Praise sages who invented the basics of life: nests, fire, canals", slot: "han", fb: "The Nest Builder, the Fire Maker and Yu are the old Chinese tales' sages." },
                { t: "Interviewed Kenyan sages and kept the ones who showed reasoned thinking", slot: "oru", fb: "That's Oruka's *Sage Philosophy* project." },
                { t: "Is said to have predicted a solar eclipse, and claimed everything is water", slot: "tha", fb: "Eclipse and water: Thales of Miletus." },
                { t: "Cancelled debts and gave Athens a constitution, then stepped down", slot: "sol", fb: "That's Solon, the lawmaker." }],
        hints: ["Which sage is a *question-asker*? Which is a *lawmaker*? Which is a *scientist*?"],
        why: "Gargi asked, the Chinese tales praise inventors, Oruka collected, Thales studied nature, Solon made laws." },

      { type: "multi", kicker: "Try it", skill: "Sages",
        prompt: "The book says early sages from different places share certain things. Pick the ones they **really** share.",
        options: [{ t: "A willingness to question tradition", ok: true, fb: "Yes: Gargi's questions, Oruka's sages and Thales's \"water\" all push past \"that's how it is\"." },
                  { t: "Curiosity about nature and about people", ok: true, fb: "Yes: from floods and eclipses to what makes a good ruler." },
                  { t: "A commitment to using reason", ok: true, fb: "Yes: they look for explanations and reasons, not only rules." },
                  { t: "They were all men", ok: false, fb: "No: Gargi, Maitreyi and the Pythagorean women show women among the thinkers. Societies gave them fewer chances, but they were there." },
                  { t: "They all wrote books", ok: false, fb: "No: many, like Oruka's Kenyan sages, never wrote anything down." },
                  { t: "They all lived in Greece", ok: false, fb: "No: India, China and Africa each have their own sages." }],
        hints: ["Three things are about *how* they thought. Three are about who they were, and those are all wrong."],
        why: "What unites sages is **how they think**: they question tradition, they are curious, and they use reason.<br>It isn't where they lived, whether they wrote, or whether they were men." },

      { type: "choice", kicker: "A harder case", skill: "Sages",
        prompt: "Oruka kept only sayings that showed reasoned thinking. Which of these would he **keep**?",
        options: [{ t: "\"My people say the elders know best. But what does *knowing* rest on: experience, memory, something else?\"" },
                  { t: "\"The rains come when the gods are pleased, so we must thank them.\"", fb: "That passes on a tradition. It doesn't question it or give reasons for it." },
                  { t: "\"Do as you are told.\"", fb: "That's an order, not a piece of thinking." }],
        answer: 0,
        hints: ["Which saying both *respects* the tradition and *asks* about it?"],
        why: "The first saying keeps the community's wisdom (\"the elders know best\") and still asks what that wisdom rests on.<br>That critical distance is what makes it philosophy." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what do the sages of India, China, Africa and Greece have in common?",
        model: "They were respected as wise, and they shared a way of thinking: they were willing to question tradition, curious about nature and about people, and they tried to use reason to understand them. They weren't all in one place or all men, and not all of them wrote." },

      concept(2, "Sage", "A **sage** is a wise person who is [[skeptical]] of tradition, [[curious]] about the world, and relies on [[reason]].",
        { chips: ["famous", "obedient"],
          fb: { "famous": "A sage can be unknown. Oruka's sages were known only in their own villages.", "obedient": "The opposite: a sage questions what everyone else accepts." } })
    ]
  };

  /* ============================================================ Lesson 3
     From stories to reasons: natural philosophy and the roots of science
     (section 1.1: Beginnings of Natural Philosophy). */
  LESSONS[3] = {
    title: "From stories to reasons",
    blurb: "How the first Greek thinkers tried to explain nature with reasons instead of stories, and why that was the start of science.",
    mins: 11,
    steps: [
      { type: "sort", kicker: "Warm up", skill: "Natural philosophy",
        prompt: "There are two kinds of answer to \"why does that happen?\"<br><br>A **story** says who wanted it. A **mechanism** says what is going on underneath.<br><br>Sort these.",
        bins: ["A story about who wants what", "A mechanism: what is going on underneath"],
        cards: [{ t: "Thunder is Zeus, throwing lightning because he is angry.", bin: 0, fb: "That explains it by someone's feelings." },
                { t: "A rainbow is a kind of cloud, lit up by the sun.", bin: 1, fb: "That puts the cause in the weather itself. (Xenophanes said this about 2,500 years ago.)" },
                { t: "An eclipse happens when a dragon eats the sun.", bin: 0, fb: "A creature wants to eat the sun. A story." },
                { t: "The seasons change because Earth is tilted as it travels around the sun.", bin: 1, fb: "That says how things in the sky are arranged and move. A mechanism." },
                { t: "The goddess Iris stretches a rainbow across the sky to carry a message.", bin: 0, fb: "Someone is sending a message. A story." },
                { t: "A solar eclipse happens when the moon passes between us and the sun.", bin: 1, fb: "That's a mechanism: where things are, and how they move." }],
        hints: ["Ask of each one: is the cause a *person's wish*, or something that happens in nature?"],
        why: "Stories explain by someone's wishes and moods.<br>A mechanism explains by what things are and how they move, which means you can question it, test it and improve it." },

      { type: "learn", kicker: "The idea",
        prompt: "The first Greek **natural philosophers** went looking for mechanisms. Each tried a different big idea. Turn over all four.",
        scene: { type: "turn", cols: 4, cards: [
          { i: "water", name: "One stuff", t: "Everything is really **one thing** in different forms. Thales said: water.", c: "blue" },
          { i: "rainbow", name: "Hidden cause", t: "What we see has a **hidden cause**. Xenophanes said a rainbow is a kind of cloud.", c: "orange" },
          { i: "atom", name: "Tiny parts", t: "Everything is made of **tiny unchanging bits** moving in empty space. Democritus called them atoms.", c: "green" },
          { i: "numbers", name: "Number", t: "Nature follows **patterns we can count**. The Pythagoreans found them in music and in the sky.", c: "purple" }] },
        gate: true,
        then: "Four moves, and each one is a way of looking for what is **underneath** what we see." },

      read({ title: "Water, clouds, and a soul in a magnet", kicker: "Read · 1 of 2", blocks: [
        "Thales and his followers, the [[Milesians|The thinkers of Miletus, a Greek city on the coast of what is now Turkey. They asked what causes change in nature: why water freezes, why winter becomes spring, why the stars move in a pattern.]], asked what causes changes in nature. Why does water freeze? Why does winter turn into spring? Why do the stars move in patterns?",
        "Thales said everything is, at bottom, **water**. He also noticed that some things move *on their own*: a magnet pulls iron, and amber, rubbed, pulls feathers. He said they have a **soul**. By \"soul\" he meant [[a source of motion inside the thing|Not a ghost. For Thales a soul is whatever makes something move itself. The Latin word is *anima*, which is why we say *animal* and *animation*.]].",
        "**Xenophanes** pushed further. He explained rainbows, the sun, the moon, and the glowing lights that sometimes crawl up a ship's mast in a storm, as different kinds of *clouds*. He was wrong about the sun. But look at his method: **an appearance is explained by something underneath it.** That is still how scientists explain.",
        ["note", "Wrong, and still a step", "An explanation can be mistaken and still be a step forward. Once the cause is in nature, anyone can argue with it, test it, and do better.", "bulb"]
      ] }),
      { type: "choice", kicker: "Check", skill: "Natural philosophy",
        prompt: "Why did Thales say a magnet has a \"soul\"?",
        options: [{ t: "Because it moves something by itself. \"Soul\" meant a source of motion" },
                  { t: "Because he believed a ghost lived inside it", fb: "For Thales a soul wasn't a ghost. It was whatever makes a thing move on its own." },
                  { t: "Because magnets could think", fb: "He didn't say they thought. He said they move other things by themselves, and that is what \"soul\" meant." }],
        answer: 0,
        hints: ["Remember the word *animation*, from the Latin for *soul*."],
        why: "A soul was a **source of motion**. A magnet pulls iron without being pushed, so Thales said it has one." },

      read({ title: "Can anything really change?", kicker: "Read · 2 of 2", blocks: [
        "**Parmenides** used pure logic and landed somewhere shocking. He reasoned: whatever really exists can't change. If it changed, some part of it would stop existing, and what exists can't stop existing. So the changes we see, he said, must be a kind of **illusion**.",
        "**Democritus** wanted to keep that rule *and* explain the world we see. His answer: everything is made of **atoms**, tiny bits of matter that never change, moving through empty space. The atoms don't change. Only how they are **arranged** changes. That arrangement is what we see as rain, rust, a rising loaf of bread.",
        "His atoms were not like modern atoms. But the idea is a big one: *everything we can observe has an underlying basis in pieces of matter in different arrangements.* That idea connects modern science straight back to the earliest Greek thinkers.",
        "The **Pythagoreans** went another way. Their founder, Pythagoras, found numbers behind the sounds of music, the shapes of triangles, and the movements of the sky. He decided nature runs on **mathematical patterns**. His followers also lived by strict rules for diet and behaviour. For them, understanding the world and living well were one project."
      ] }),

      { type: "slots", kicker: "Together", skill: "Natural philosophy",
        prompt: "Match each thinker to his big idea.",
        slots: [{ id: "tha", label: "Thales" }, { id: "xen", label: "Xenophanes" }, { id: "par", label: "Parmenides" },
                { id: "dem", label: "Democritus" }, { id: "pyt", label: "Pythagoras" }],
        cards: [{ t: "Everything is really water, in different forms", slot: "tha", fb: "That's Thales." },
                { t: "A rainbow is a kind of cloud", slot: "xen", fb: "Xenophanes explained appearances by clouds." },
                { t: "Whatever really exists can't change; change is an illusion", slot: "par", fb: "Parmenides reasoned his way there with logic." },
                { t: "Everything is unchanging atoms moving in empty space", slot: "dem", fb: "That's Democritus." },
                { t: "Nature follows patterns we can count, like those in music", slot: "pyt", fb: "That's Pythagoras and his school." }],
        hints: ["Which one is about a *rainbow*? Which about *numbers*? Which one says change is not real?"],
        why: "Water, clouds, logic, atoms, numbers: five different ways to look beneath what we see." },

      { type: "choice", kicker: "Try it", skill: "Natural philosophy",
        prompt: "Parmenides said what exists can't change. Democritus agreed, but still wanted to explain the **changes we see**. How?",
        options: [{ t: "The atoms never change. Only how they are arranged changes" },
                  { t: "He said the changes we see are an illusion too", fb: "That was Parmenides's answer. Democritus wanted to *explain* change, not call it an illusion." },
                  { t: "He said atoms change into other atoms", fb: "Then the atoms would change, and the rule that what exists can't change would be broken." }],
        answer: 0,
        hints: ["What can stay the same while the arrangement of things changes?"],
        why: "Think of letters: the letters stay the same, but different arrangements make different words.<br>Atoms stay the same, but different arrangements make different things." },

      { type: "multi", kicker: "A harder case", skill: "Natural philosophy",
        prompt: "Which habits of **modern science** have roots in these early Greek thinkers?",
        options: [{ t: "Explaining what we see by something hidden underneath", ok: true, fb: "Yes: rainbows and clouds, and later atoms." },
                  { t: "Looking for patterns we can count", ok: true, fb: "Yes: the Pythagoreans found them in music and in the sky." },
                  { t: "Asking what everything is made of", ok: true, fb: "Yes: Thales and Democritus." },
                  { t: "Using a particle accelerator", ok: false, fb: "That's a modern instrument. The Greeks had nothing like it." },
                  { t: "Publishing in a scientific journal", ok: false, fb: "That is a much later invention." }],
        hints: ["Look for *ways of thinking*, not machines or institutions."],
        why: "The Greeks had no labs or journals. They left us **ways of thinking**: look beneath appearances, count the patterns, ask what things are made of." },

      { type: "choice", kicker: "Use it", skill: "Natural philosophy",
        prompt: "Xenophanes was wrong about the sun being a cloud. Why is his **method** still a step forward?",
        options: [{ t: "It puts the cause in nature, where anyone can argue with it, test it and improve it" },
                  { t: "It proved that all clouds are alike", fb: "It proved nothing like that. The step forward was in the *kind* of explanation." },
                  { t: "It showed that the old stories were all true", fb: "The opposite: it set the stories aside and looked for a cause in nature." }],
        answer: 0,
        hints: ["What can you do with a cloud explanation that you can't do with a story about someone's mood?"],
        why: "A wrong answer that can be **questioned** beats one that can't. Once causes are in nature, errors can be found and fixed." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: how did the first Greek natural philosophers change the way people explained nature?",
        model: "They stopped explaining nature by what gods or creatures wanted, and started looking for causes in nature itself, something underneath what we see (water, clouds, atoms, number). Those causes can be argued about, tested and improved, which is why this is where science began." },

      concept(3, "Natural philosophy", "**Natural philosophy** explains what we see by something [[underneath]] it, using [[reason]], not [[stories]] about what someone wants.",
        { chips: ["magic", "instruments"],
          fb: { "magic": "The opposite of magic: natural philosophy looks for causes *in nature*.", "instruments": "The Greeks had few instruments. They had reasons." } })
    ]
  };

  /* ============================================================ Lesson 4
     How things hang together: Sellars's aim for philosophy, the two images of
     the world, and philosophical know-how (section 1.1: How It All Hangs Together). */
  var HOW_4 = [["Looks", "Say how the thing looks and feels to us."],
               ["Science", "Say what science says is really there."],
               ["Link", "Ask what, in the science, makes it look and feel that way."],
               ["Keep both", "Check you haven't thrown either picture away."]];

  LESSONS[4] = {
    title: "How things hang together",
    blurb: "Philosophy tries to see the whole picture. Try it on a table that is solid, and also mostly empty space.",
    mins: 12,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "The whole picture",
        prompt: "Democritus said a table is atoms moving in empty space. But your table holds up a mug.<br><br>Which statement is true?",
        options: [{ t: "Both can be true: the table is atoms, **and** it's solid enough to hold a mug" },
                  { t: "It's atoms, so it isn't really solid", fb: "Then the mug would fall through. \"Solid\" is real. It still needs explaining, not throwing away." },
                  { t: "It's solid, so atoms must be made up", fb: "Atoms are real in science. The question is how the two fit." }],
        answer: 0,
        hints: ["Can one thing be described in two different ways, and both be right?"],
        why: "The same table is described two ways. The puzzle is how the descriptions fit together, and that is a **philosophy** question." },

      { type: "learn", kicker: "The idea",
        prompt: "In 1962 the philosopher **Wilfrid Sellars** said that philosophy aims to understand how things, in the broadest sense, **hang together**.",
        art: tiles([{ i: "flask", t: "A scientist studies one part", c: "green" }, { i: "puzzle", t: "A philosopher asks how the parts fit", c: "orange" }]),
        then: "Not just *what is in the world*, but how **everything fits together**: that's the job." },

      { type: "learn", kicker: "Explore",
        prompt: "Here is one table. Slide to zoom in, and watch what you can say about it change.",
        scene: { type: "zoom", gate: true },
        gate: true,
        then: "Two true descriptions of one table. Sellars called them **the manifest image** (how things look and feel) and **the scientific image** (what science says is there)." },

      { type: "learn", kicker: "The idea",
        prompt: "Sellars said philosophy shows its skill when it **brings these two pictures into one**. Four moves do it.",
        scene: { type: "method", how: HOW_4 } },

      { type: "learn", kicker: "Watch",
        prompt: "Watch the four moves on the table.",
        scene: { type: "pwalk", how: HOW_4, rows: [
          { step: 1, t: "The table is solid, brown and warm. It holds a mug.", role: "look", tag: "Looks",
            say: "This is how it looks and feels, just as everyone sees it." },
          { step: 2, t: "It is made of atoms, with mostly empty space between and inside them.", role: "sci", tag: "Science",
            say: "This is what science says is there.",
            ask: { prompt: "Which line is the **scientific** picture?", answer: 0,
                   options: [{ t: "It's made of atoms, with mostly empty space" }, { t: "It holds a mug", fb: "That's how it feels and behaves: the look-and-feel picture." }] } },
          { step: 3, t: "Atoms are held together so strongly that a mug can't pass through. The surface reflects the light we call brown.", role: "aside", tag: "Link",
            say: "The link: *what in the science makes it look and feel this way?* \"Solid\" is how those forces feel to us. \"Brown\" is how that surface treats light." },
          { step: 4, t: "So there aren't two tables. There is one table, seen two ways.", role: "answer", tag: "Both",
            say: "We kept the table we can touch **and** the atoms. Neither picture was thrown away." }
        ] },
        gate: true,
        then: "That's what it means for things to **hang together**: two true pictures, joined by a link." },

      { type: "pguided", kicker: "Together", skill: "The whole picture",
        prompt: "Now you do the four moves on an **ice cube**.",
        how: HOW_4,
        steps: [
          { step: 1, ask: "Which line says how the ice cube **looks and feels**?", type: "choice", answer: 0,
            options: [{ t: "It's cold, clear and hard." }, { t: "Its water molecules are locked in a rigid pattern.", fb: "That's what science says is there, not how it looks and feels." }],
            t: "It's cold, clear and hard.", role: "look", tag: "Looks", say: "How it looks and feels in your hand.", hint: "Which line could you tell just by holding it?" },
          { step: 2, ask: "Which line is **what science says**?", type: "choice", answer: 0,
            options: [{ t: "Its water molecules are locked in a rigid pattern, and they move slowly." }, { t: "It's cold, clear and hard.", fb: "That's the look-and-feel picture." }],
            t: "Its water molecules are locked in a rigid pattern, and they move slowly.", role: "sci", tag: "Science", say: "What science says is there.", hint: "Which line mentions molecules?" },
          { step: 3, ask: "Which sentence **links** the two?", type: "choice", answer: 0,
            options: [{ t: "The rigid pattern is what makes it hard, and heat flowing from your hand into the slow molecules is the cold you feel." },
                      { t: "The molecules are really there, so the cold isn't.", fb: "That throws one picture away. The link should explain the feeling, not delete it." },
                      { t: "Ice is cold because it is made of ice.", fb: "That just repeats the question. The link has to say what in the science causes the feeling." }],
            t: "The rigid pattern makes it hard. Heat flowing into the slow molecules is the cold you feel.", role: "aside", tag: "Link", say: "The science explains the look and feel.", hint: "Pick the one that explains the feeling using the science." },
          { step: 4, ask: "Is there one ice cube or two?", type: "choice", answer: 0,
            options: [{ t: "One ice cube, described two ways" }, { t: "Two: the one you feel and the one in the science", fb: "There's only one ice cube. We described it two ways." }],
            t: "One ice cube, described two ways.", role: "answer", tag: "Both", say: "Keep both pictures, joined by the link.", hint: "Think about the table." }
        ],
        why: "Same four moves: how it looks, what science says, the link, and keep both." },

      { type: "slots", kicker: "On your own", skill: "The whole picture",
        prompt: "Each everyday experience has a **link** to what science says. Match them.",
        slots: [{ id: "sun", label: "The sunset is red" }, { id: "hot", label: "The spoon feels hot" }, { id: "sweet", label: "Sugar tastes sweet" }],
        cards: [{ t: "Air scatters the blue light away, so the red is what reaches your eyes", slot: "sun", fb: "That's the link for the sunset." },
                { t: "Fast-moving particles pass their energy to your skin", slot: "hot", fb: "That's the link for heat." },
                { t: "Sugar molecules fit receptors on your tongue and send a signal to your brain", slot: "sweet", fb: "That's the link for taste." }],
        hints: ["Match each feeling with the part of science that explains it."],
        why: "In each case science doesn't delete the experience. It explains **what makes it appear that way**." },

      { type: "choice", kicker: "A harder case", skill: "The whole picture",
        prompt: "A friend says: \"Science shows the table is *really* just atoms. So the solid, brown table is fake.\"<br><br>What is the better reply?",
        options: [{ t: "\"Neither picture is fake. The job is to see how the two fit together.\"" },
                  { t: "\"You're right. The table we touch is an illusion.\"", fb: "Then you'd have to explain why the illusion holds a mug. Throwing one picture away leaves the puzzle unsolved." },
                  { t: "\"Science is wrong. Atoms don't exist.\"", fb: "Science has a lot of evidence for atoms. Denying them throws the other picture away." }],
        answer: 0,
        hints: ["Remember the fourth move: *keep both*."],
        why: "When two pictures both seem true, the philosopher's job is to **connect** them, not to pick a winner." },

      { type: "sort", kicker: "Use it", skill: "The whole picture",
        prompt: "Sellars said philosophical skill is **know-how**, like riding a bike: knowing your way around ideas and seeing how they connect.<br><br>Sort these.",
        bins: ["Know-how: a skill", "Know-that: a fact"],
        cards: [{ t: "Riding a bike", bin: 0, fb: "You can't get it just by reading. It's a skill." },
                { t: "Paris is the capital of France", bin: 1, fb: "A fact you can state." },
                { t: "Telling when two ideas don't fit together", bin: 0, fb: "That's the philosopher's skill: knowing your way around ideas." },
                { t: "Water boils at 100 degrees Celsius at sea level", bin: 1, fb: "A fact." },
                { t: "Swimming", bin: 0, fb: "A skill: you learn it by doing." }],
        hints: ["Know-how is something you can *do*. Know-that is something you can *say is true*."],
        why: "Philosophy is more like a skill you practise than a list of facts you memorise: **finding your way around the world of ideas**." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what does it mean for philosophy to try to see **how things hang together**?",
        model: "Other subjects study one part of the world. Philosophy asks how all the parts fit, such as how the world as it looks and feels to us fits with the world as science describes it. The goal is to keep both pictures and find the link, not throw one away." },

      concept(4, "Hanging together", "Philosophy tries to see how things [[hang together]]: for example, how the world as it [[looks]] fits with the world as [[science]] explains it.",
        { chips: ["split", "stories"],
          fb: { "split": "Philosophy joins pictures, it doesn't split them.", "stories": "The two pictures here are how things look and what science says, not stories." } })
    ]
  };

  /* ============================================================ Lesson 5
     Where philosophers find evidence: history, intuition, common sense,
     experimental philosophy and the results of other fields (section 1.2:
     Sources of Evidence, Table 1.1). */
  LESSONS[5] = {
    title: "Where philosophers find evidence",
    blurb: "Philosophy isn't a laboratory science, but its claims still need evidence. Five places to look for it.",
    mins: 11,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Evidence",
        prompt: "A friend says: \"It's wrong to break a promise.\" You ask, \"Why should I believe that?\"<br><br>Which answer is the **best start**?",
        options: [{ t: "\"Here is a reason, and here is what careful thinkers have said about it.\"" },
                  { t: "\"I just feel really strongly about it.\"", fb: "A strong feeling isn't evidence. Plenty of people feel strongly about things that turn out wrong." },
                  { t: "\"Because I said so.\"", fb: "That's an order, not a reason." }],
        answer: 0,
        hints: ["What could you point to that someone else could check?"],
        why: "Philosophy isn't an experiment, but a claim still needs **reasons** someone else can look at and judge." },

      { type: "learn", kicker: "The idea",
        prompt: "Philosophers have five main places to look for evidence. Turn over all five.",
        scene: { type: "turn", cols: 3, cards: [
          { i: "scroll", name: "History", t: "What earlier thinkers argued, and why. Big questions like *what is a good life?* never expire.", c: "orange" },
          { i: "lamp", name: "Intuition", t: "A **clear, certain** insight, like seeing that 2 + 2 = 4. Not a hunch.", c: "blue" },
          { i: "hand", name: "Common sense", t: "Basic claims from **plain perception**, like \"this is my hand\".", c: "green" },
          { i: "flask", name: "Experiments", t: "**Experimental philosophy**: test what people actually think, like a psychologist would.", c: "purple" },
          { i: "layers", name: "Other fields", t: "What biology, psychology, history and the other sciences have found.", c: "red" }] },
        gate: true,
        then: "Five sources. Two of them involve testing the world; the rest are about **reading and thinking**. You'll sort them in a moment." },

      read({ title: "Why read philosophers who died long ago?", kicker: "Read", blocks: [
        ["fig", "rousseau", "Jean-Jacques Rousseau (1712–1778), whose ideas about how people should be governed are still argued over. (This old engraving gets his birth year wrong: it was 1712.)", { tall: true }],
        "Because the big questions don't expire. Our answers about *nature* change as science improves. But *What is a good life?* and *How should a community be run so that everyone gains?* stay with us.",
        "Leaders know it. Many of the people who shaped the United States Constitution had read European philosophers such as **John Locke** and **Jean-Jacques Rousseau**. China's leader, Xi Jinping, often quotes **Confucius** in his speeches.",
        "That is **history as evidence**: the arguments of thinkers from the past are a place to look when we face the same question today."
      ] }),

      { type: "slots", kicker: "Together", skill: "Evidence",
        prompt: "Which source of evidence is each example using?",
        slots: [{ id: "his", label: "History" }, { id: "int", label: "Intuition" }, { id: "com", label: "Common sense" },
                { id: "exp", label: "Experiments" }, { id: "oth", label: "Other fields" }],
        cards: [{ t: "Drawing on Locke's argument about how a government gets its authority", slot: "his", fb: "An earlier thinker's argument is history as evidence." },
                { t: "Seeing at once that 2 + 2 = 4, and that it couldn't be false", slot: "int", fb: "A clear, certain insight: intuition." },
                { t: "Holding up a hand and saying \"Here is a hand\", with no further proof", slot: "com", fb: "A plain perception we can't sensibly doubt: common sense." },
                { t: "Asking hundreds of people if someone with no free choice is still to blame", slot: "exp", fb: "Testing what people actually think: experimental philosophy." },
                { t: "Using a psychologist's findings about how memory works in an argument about the self", slot: "oth", fb: "Results from another field." }],
        hints: ["Which one is something you *see at once*? Which one is *testing people*?"],
        why: "History is an earlier thinker's argument, intuition a clear insight, common sense a plain perception, an experiment a test, and another field's results." },

      { type: "sort", kicker: "On your own", skill: "Evidence",
        prompt: "How do you find each kind of evidence?",
        bins: ["Test or measure", "Read or think", "Just look"],
        cards: [{ t: "Experimental philosophy", bin: 0, fb: "You run a study and see what people say." },
                { t: "Results from the sciences", bin: 0, fb: "Someone measured and tested to get them." },
                { t: "Intuition", bin: 1, fb: "You think about it and *see* that it's true." },
                { t: "History of philosophy", bin: 1, fb: "You read what thinkers wrote." },
                { t: "Logic", bin: 1, fb: "You reason with it. You don't need to look at anything." },
                { t: "Common sense", bin: 2, fb: "It rests on plain perception, like looking at your own hand." }],
        hints: ["Which ones need a study or an instrument? Which ones need only a book or your own mind?"],
        why: "**Test or measure:** experiments and other fields.<br>**Read or think:** history, intuition, logic.<br>**Just look:** common sense." },

      { type: "sort", kicker: "A harder case", skill: "Intuition",
        prompt: "To a philosopher, an **intuition** is not a hunch. It is something so clear that it seems impossible to be false.<br><br>Which are intuitions, and which are just hunches?",
        bins: ["Clear and certain: an intuition", "A feeling or a hunch"],
        cards: [{ t: "2 + 2 = 4", bin: 0, fb: "You can check it in your head, and it couldn't be false. A model intuition." },
                { t: "A three-legged stool has three legs", bin: 0, fb: "True in the very meaning of the words." },
                { t: "Whatever is good is better than whatever is bad", bin: 0, fb: "People argue over *what* is good. Still, almost everyone sees that good beats bad." },
                { t: "My lucky number will win this week", bin: 1, fb: "A hope, not an insight. It could easily be false." },
                { t: "That new teacher seems untrustworthy", bin: 1, fb: "A first impression. Often wrong, and not at all certain." },
                { t: "Our team will win on Saturday", bin: 1, fb: "A guess about the future." }],
        hints: ["Ask: *could it possibly be false?* If it seems impossible, it's an intuition."],
        why: "An intuition is **clear and certain**. A hunch is a feeling you could easily be wrong about.<br>Where people disagree, be careful: the word \"intuition\" may just mean \"what I happen to believe\"." },

      { type: "choice", kicker: "Try it", skill: "Evidence",
        prompt: "In 1939 the philosopher George Edward Moore held up his hand and said, \"Here is one hand.\" He said that proves there's a world outside our minds.<br><br>What kind of evidence is he using?",
        options: [{ t: "Common sense: a plain perception he thinks no one can sensibly doubt" },
                  { t: "History: what earlier thinkers said about hands", fb: "He is pointing at his hand, not at a book." },
                  { t: "Experimental philosophy: a study of what people believe", fb: "No survey here, just one man and one hand." }],
        answer: 0,
        hints: ["What does he do to prove it? He *looks* and points."],
        why: "Moore appeals to **common sense**. Some claims from plain perception are more certain than any argument against them." },

      { type: "choice", kicker: "Use it", skill: "Evidence",
        prompt: "A philosopher claims: \"Free will is needed for anyone to be morally responsible.\"<br><br>Which fits **experimental philosophy**?",
        options: [{ t: "Ask many people in made-up cases whether someone with no free choice is still to blame" },
                  { t: "Look up what Aristotle said about blame", fb: "That is history as evidence, not an experiment." },
                  { t: "Decide it's true because it seems obvious to you", fb: "That's relying on your own intuition. An experiment checks whether *other people* agree." }],
        answer: 0,
        hints: ["An experiment needs *data* from people."],
        why: "Experimental philosophy uses methods like a psychologist's: pose a case, ask many people, and see if what philosophers *say* people think is what people really think." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: philosophy isn't a lab science, so what counts as **evidence** in philosophy?",
        model: "Philosophical claims still need evidence. It can come from the history of what earlier thinkers argued, from clear intuitions, from common sense, from experiments that test what people think, and from the findings of other fields like science. Some of it is tested, and some of it is read or thought through." },

      concept(5, "Evidence", "Philosophical claims need [[evidence]]: from [[history]], from clear [[intuition]], from common sense, and from [[experiments]] and other fields.",
        { chips: ["hunches", "luck"],
          fb: { "hunches": "A hunch isn't evidence. A clear *intuition* is a different thing.", "luck": "Luck isn't a source of evidence." } })
    ]
  };

  /* ============================================================ Lesson 6
     Reasons for a claim. An argument is a claim with its reasons; an
     explanation runs the other way (section 1.2: Logic, Argument, Explanation). */
  var HOW_6 = [["Find claim", "What is the writer trying to get you to accept? That is the **conclusion**."],
               ["Find reasons", "What is offered in support? Those are the **premises**."],
               ["Line up", "Reasons first, then a line, then the claim."],
               ["Check link", "If the reasons were true, would they really support the claim?"]];

  LESSONS[6] = {
    title: "Reasons for a claim",
    blurb: "Every argument is a claim and its reasons. Take one apart, line it up, and test the link.",
    mins: 12,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Arguments",
        prompt: "A friend says: \"We should start school later, because teenagers need more sleep.\"<br><br>Which part is what your friend wants you to **accept**?",
        options: [{ t: "We should start school later" },
                  { t: "Teenagers need more sleep", fb: "That's the *why*: the support. Your friend wants you to accept something *because of* it." },
                  { t: "Your friend says", fb: "That just tells you who is talking. It isn't part of what's being argued." }],
        answer: 0,
        hints: ["Which part is the point? Which part is the support for it?"],
        why: "The point is that school should start later. \"Teenagers need more sleep\" is offered as the reason." },

      { type: "learn", kicker: "The idea",
        prompt: "Philosophers argue with **reasons**. A claim with its reasons is an **argument**: the claim is its **conclusion**, and each reason is a **premise**. Four moves take any argument apart.",
        scene: { type: "method", how: HOW_6 } },

      { type: "learn", kicker: "Watch",
        prompt: "<p>Watch one argument taken apart, move by move.</p>" + quote("I'm sure Sam is home, because the lights are on, and Sam is the only one who ever turns them on."),
        scene: { type: "pwalk", how: HOW_6, rows: [
          { step: 1, t: "\"I'm sure Sam is home, because the lights are on, and Sam is the only one who ever turns them on.\"",
            say: "Here is the passage. First: what does the speaker want us to accept?" },
          { step: 1, t: "Sam is home.", role: "claim", tag: "Claim",
            say: "That's the point of the passage. \"I'm sure\" is a clue that it's the claim.",
            ask: { prompt: "Which part is the claim?", answer: 0,
                   options: [{ t: "Sam is home" },
                             { t: "The lights are on", fb: "That's something the speaker *uses*. It's there to support a point." }] } },
          { step: 2, t: "The lights are on.", role: "reason", tag: "Reason 1",
            say: "Offered in support. The word \"because\" points to it." },
          { step: 2, t: "Sam is the only one who ever turns them on.", role: "reason", tag: "Reason 2",
            say: "A second reason. Together, the two reasons are the **premises**." },
          { step: 3, t: "So: Sam is home.", role: "claim", tag: "Claim",
            say: "Now set it out in order: reasons first, claim last.",
            fig: board(["The lights are on.", "Sam is the only one who ever turns them on."], "Sam is home.") },
          { step: 4, t: "If both reasons are true, Sam is very probably home.", role: "aside", tag: "Link",
            say: "Strong, but not airtight. Sam might have left the lights on this morning. Testing the link means asking how well the reasons support the claim." }
        ] },
        gate: true,
        then: "That is an **argument**: reasons that are meant to support a claim. Claim, reasons, line up, check the link." },

      { type: "pguided", kicker: "Together", skill: "Arguments",
        prompt: "<p>Now you take this one apart.</p>" + quote("The cafeteria should add more vegetarian meals. Lots of students don't eat meat, and right now they have almost nothing to choose from."),
        how: HOW_6,
        steps: [
          { step: 1, ask: "Which sentence is the **claim**?", type: "choice", answer: 0,
            options: [{ t: "The cafeteria should add more vegetarian meals." },
                      { t: "Lots of students don't eat meat.", fb: "That's a reason. It's *why* the cafeteria should change." },
                      { t: "They have almost nothing to choose from.", fb: "That's a reason too. It describes the problem. The claim says what to do about it." }],
            t: "The cafeteria should add more vegetarian meals.", role: "claim", tag: "Claim",
            say: "It says what we should do. Everything else supports it.", hint: "Which sentence says what *should* happen?" },
          { step: 2, ask: "Which sentences give **reasons**? Pick both.", type: "multi",
            options: [{ t: "Lots of students don't eat meat.", ok: true, fb: "Yes: it says many students are affected." },
                      { t: "The cafeteria should add more vegetarian meals.", ok: false, fb: "That's the claim. You've already found it." },
                      { t: "Right now they have almost nothing to choose from.", ok: true, fb: "Yes: it says the need isn't met." }],
            lead: [{ t: "Lots of students don't eat meat.", role: "reason", tag: "Reason 1", say: "A reason: many students are affected." }],
            t: "Right now they have almost nothing to choose from.", role: "reason", tag: "Reason 2",
            say: "A second reason: the need isn't met.", hint: "Pick the two sentences that explain *why* the cafeteria should change." },
          { step: 3, ask: "In the lined-up version, what goes **last**, under the line?", type: "choice", answer: 0,
            options: [{ t: "The claim" },
                      { t: "The reasons", fb: "Reasons come first. They build up to the point." },
                      { t: "Whichever sentence came last in the passage", fb: "The order in the passage doesn't matter. The argument always runs: reasons first, then the claim." }],
            t: "So: the cafeteria should add more vegetarian meals.", role: "claim", tag: "So",
            say: "Reasons first, then the claim.", hint: "Think: reasons build up to what?" },
          { step: 4, ask: "If both reasons are true, would they **support** the claim?", type: "choice", answer: 0,
            options: [{ t: "Yes, well: many students are left without a choice" },
                      { t: "No: facts about students can't say anything about a cafeteria", fb: "They can. The cafeteria is there to feed those students, so facts about them matter." },
                      { t: "They would prove it beyond any doubt", fb: "They'd support it strongly, but not beyond doubt. The cafeteria might have a reason not to. Good support isn't proof." }],
            t: "Good support: many students would benefit.", role: "aside", tag: "Link",
            say: "Strong support, though not a proof.", hint: "Do the reasons give the cafeteria a good reason to act?" }
        ],
        why: "You found the claim, the two reasons, the order, and tested the link. Same four moves every time." },

      { type: "argue", kicker: "On your own", skill: "Arguments",
        prompt: "<p>Take this apart.</p>" + quote("The school should keep the library open on Saturdays. Many students have no quiet place to study at home. Most big projects are due on Mondays. The reading corner has a blue sofa."),
        items: [{ t: "The school should keep the library open on Saturdays.", role: "claim", fb: "This one says what the school *should* do. It's the claim." },
                { t: "Many students have no quiet place to study at home.", role: "reason", fb: "This is a reason: it says why Saturday opening would help." },
                { t: "Most big projects are due on Mondays.", role: "reason", fb: "This is a reason too: it says when students need the library." },
                { t: "The reading corner has a blue sofa.", role: "aside", fb: "True, maybe, but it doesn't support the claim. It's not part of the argument." }],
        hints: ["Start with the claim: which sentence says what to *do*?", "Then ask of each other sentence: does it help support the claim?"],
        why: "One claim, two reasons, and one sentence that has nothing to do with the argument." },

      read({ title: "The claim doesn't always come first", kicker: "A harder case", blocks: [
        "In real speech the claim can come first, last, or in the middle. Little **clue words** point the way:",
        ["list", "", [
          ["because, since, for", "Right before a **reason**: \"Take an umbrella, *because* it's going to rain.\"", "question"],
          ["so, therefore, thus", "Right before a **claim**: \"It's going to rain, *so* take an umbrella.\"", "arrow"]]],
        "Both sentences hold the same argument. The reason is *it's going to rain*; the claim is *take an umbrella*. Only the order is different.",
        ["note", "Careful", "Clue words help, but they aren't a rule. Always ask the real question: **what is this passage trying to get me to accept?**", "bulb"]
      ] }),

      { type: "argue", kicker: "Try it", skill: "Arguments",
        prompt: "<p>The claim comes at the end this time.</p>" + quote("The UV index will be very high tomorrow, and half of us got burned last year. The bus leaves at eight. So everyone should wear sunscreen on the trip."),
        items: [{ t: "The UV index will be very high tomorrow.", role: "reason", fb: "It says why sunscreen matters. A reason." },
                { t: "Half of us got burned last year.", role: "reason", fb: "It also says why sunscreen matters. A reason." },
                { t: "The bus leaves at eight.", role: "aside", fb: "That's just information about the trip. It doesn't support the claim." },
                { t: "Everyone should wear sunscreen on the trip.", role: "claim", fb: "The word \"so\" points to it. It's what the reasons are for." }],
        hints: ["Look for the clue word \"so\". What comes right after it?"],
        why: "\"So\" points to the claim. The two reasons about the UV index and last year come before it, and the bus time isn't part of the argument." },

      { type: "pspot", kicker: "Find the flaw", skill: "Arguments",
        prompt: "<p>Dee took this apart:</p>" + quote("Our town should build a skate park. Lots of teenagers skate in the street. The town hall has a green roof.") + "<p>One line of Dee's argument doesn't really belong. Tap it.</p>",
        lines: [chip("reason", "Reason 1") + " Lots of teenagers skate in the street.",
                chip("reason", "Reason 2") + " The town hall has a green roof.",
                chip("claim", "So") + " Our town should build a skate park."],
        answer: 1, fix: "Cut it. A green roof gives no reason to build a skate park, so the argument has one reason.",
        fb: { 0: "That's a real reason: skating in the street is a problem a skate park could solve.", 2: "That's the claim, and it belongs at the bottom." },
        hints: ["Check each reason against the claim. Does it help support it?"],
        why: "A reason has to be **relevant**: it has to help support the claim. A green roof on the town hall has nothing to do with a skate park." },

      { type: "learn", kicker: "Use it",
        prompt: "Arguments run **forward**: from reasons to a claim. An **explanation** runs **backward**. You start with something you've seen and ask what would explain it, the way a detective works from clues to the crime.",
        art: tiles([{ i: "arrow", t: "Argument: reasons → claim", c: "blue" }, { i: "search", t: "Explanation: what I saw ← what caused it", c: "orange" }]) },

      { type: "sort", kicker: "Use it", skill: "Arguments",
        prompt: "Which way is each piece of reasoning running?",
        bins: ["Forward: from reasons to a claim", "Backward: from what I saw to its cause"],
        cards: [{ t: "All metals expand when heated. This rod is metal. So this rod will expand if heated.", bin: 0, fb: "It starts from general reasons and ends with a new claim. Forward." },
                { t: "I hear thunder, so lightning must have struck somewhere.", bin: 1, fb: "You started with something you noticed and reasoned back to what caused it. Backward." },
                { t: "The street is wet. It must have rained.", bin: 1, fb: "A wet street is the clue; rain is the explanation. Backward." },
                { t: "Everyone who signs up gets a free shirt. I signed up. So I'll get a shirt.", bin: 0, fb: "Two reasons lead forward to a claim." }],
        hints: ["Ask: does it start from something I observed and look for its cause?"],
        why: "Thunder and a wet street are **observations** that you explain by working back to a cause.<br>The metal rod and the free shirt run forward from reasons." },

      concept(6, "Argument", "An **argument** gives [[reasons]], called premises, for a [[claim]], called the conclusion. To test it, ask whether the reasons really [[support]] the claim.",
        { chips: ["proof", "questions"],
          fb: { "proof": "Reasons don't have to *prove* the claim. They have to support it, to some degree.", "questions": "Careful: an argument gives reasons, not questions." } })
    ]
  };

  /* ============================================================ Lesson 7
     Can all of it be true? Coherence and contradiction (section 1.2: Coherence). */
  var HOW_7 = [["List them", "Put each belief on its own line."],
               ["Try together", "Ask: could all of these be true at the same time?"],
               ["Find the clash", "If not, which beliefs can't live together?"],
               ["Give one up", "Revise or drop one, then test again."]];

  LESSONS[7] = {
    title: "Can all of it be true?",
    blurb: "A set of beliefs is coherent if all of them could be true at once. Learn to test a set, find the clash, and fix it.",
    mins: 12,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Coherence",
        prompt: "Maya says: \"Maya is taller than Sam.\" Then she says: \"Sam is taller than Maya.\"<br><br>Could **both** be true?",
        options: [{ t: "No. If one is true, the other has to be false" },
                  { t: "Yes, if they are standing on different floors", fb: "Even on different floors, one of them is taller. They can't both be taller than the other." },
                  { t: "Yes, because people can disagree", fb: "This is about what *can* be true, not about who agrees. Two taller-than claims like these can't both hold." }],
        answer: 0,
        hints: ["Try to picture a world where both are true. Can you?"],
        why: "No world makes both true. When two claims **can't** be true together, they **contradict** each other." },

      { type: "learn", kicker: "The idea",
        prompt: "A set of beliefs is **coherent** if they could all be true **at the same time**. If they can't, they **contradict**, and at least one of them is false. Four moves test any set.",
        scene: { type: "method", how: HOW_7 } },

      { type: "learn", kicker: "Watch",
        prompt: "Watch the four moves on Mia's three beliefs.",
        scene: { type: "pwalk", how: HOW_7, rows: [
          { step: 1, t: "Every student in Mia's class passed the test.", role: "reason", tag: "Belief 1", say: "Mia believes this about her class." },
          { step: 1, t: "Ben is in Mia's class.", role: "reason", tag: "Belief 2", say: "She also believes this." },
          { step: 1, t: "Ben failed the test.", role: "reason", tag: "Belief 3", say: "And this." },
          { step: 2, t: "Suppose all three are true. Ben is in her class, so Belief 1 says he passed.", role: "aside", tag: "Try", say: "Take the beliefs together, and follow what each one says about Ben.",
            ask: { prompt: "Before we go on: do **Belief 1** and **Belief 3** clash **on their own**?", answer: 0,
                   options: [{ t: "No: Ben might not be in her class" }, { t: "Yes: someone failed, so not everyone passed", fb: "Not quite. Ben only counts against Belief 1 if he is in her class, and that's Belief 2." }] } },
          { step: 3, t: "But Belief 3 says Ben failed. Ben passed and failed: that can't be.", role: "objection", tag: "Clash", say: "No two of the beliefs clash alone. It takes **all three** together." },
          { step: 4, t: "Mia can drop Belief 1, 2 or 3. Which one she gives up depends on what she has the best evidence for.", role: "answer", tag: "Fix", say: "Maybe Ben is in another class. Maybe one student did fail. Either way the set is coherent again." }
        ] },
        gate: true,
        then: "A contradiction can hide in a **group** of beliefs, even when every pair looks fine. To fix it, something has to give." },

      { type: "coherence", kicker: "Together", skill: "Coherence",
        prompt: "Now try it yourself. Put **as many beliefs as you can** in the jar with no clash.",
        who: "Mia's beliefs",
        beliefs: ["Every student in Mia's class passed the test.", "Ben is in Mia's class.", "Ben failed the test.", "The test was hard."],
        clashes: [[0, 1, 2]], goal: 3,
        hints: ["Put them all in the jar and see which ones are marked.", "Take out one of the marked ones. Is it enough?"],
        why: "Only the three beliefs about Ben clash. \"The test was hard\" fits with anything. Giving up any one of the three fixes it." },

      { type: "coherence", kicker: "On your own", skill: "Coherence",
        prompt: "Sofia runs a club with these rules and facts. Fit as many as you can in the jar with no clash.",
        who: "Sofia's club",
        beliefs: ["No one under 13 may join.", "Anyone with a sibling already in the club may join.", "Leo is 11, and his sister is in the club.", "Leo may join."],
        clashes: [[0, 2, 3], [0, 1, 2]], goal: 3,
        hints: ["Watch which beliefs turn red when you add them. There are two different clashes this time."],
        why: "Rule 1 and the fact that Leo is 11 say he may **not** join. Rule 2 and his sister say he **may**. Either rule 1 or the fact about Leo has to go." },

      { type: "choice", kicker: "A harder case", skill: "Coherence",
        prompt: "A set of beliefs is perfectly coherent, with no clash at all. Does that mean the beliefs are **true**?",
        options: [{ t: "No. Coherent only means they *could* all be true. A made-up story can be coherent too" },
                  { t: "Yes. If nothing clashes, they must be true", fb: "A fairy tale can be fully coherent and still be fiction. No clash isn't the same as true." },
                  { t: "Yes, but only if most people believe them", fb: "How many people believe something doesn't make it true." }],
        answer: 0,
        hints: ["Think of a story that never contradicts itself, but isn't real."],
        why: "Coherence can show that a set is **not** wholly true (if it clashes). It cannot show that it **is** true." },

      { type: "multi", kicker: "Try it", skill: "Coherence",
        prompt: "Which of these pairs **can't** both be true?",
        options: [{ t: "\"All swans are white.\" and \"I saw a black swan.\"", ok: true, fb: "Yes: if a black swan exists, not all swans are white." },
                  { t: "\"Maya is older than Leo.\" and \"Leo is older than Maya.\"", ok: true, fb: "Yes: no one is older than someone who is older than them." },
                  { t: "\"The store opens at nine.\" and \"The store closes at five.\"", ok: false, fb: "They fit together: it opens at nine and closes at five." },
                  { t: "\"It's raining here now.\" and \"It's sunny somewhere else now.\"", ok: false, fb: "Different places. Both can be true." },
                  { t: "\"Everyone in the room is under 10.\" and \"Someone in the room is 40.\"", ok: true, fb: "Yes: a 40-year-old is not under 10." }],
        hints: ["For each pair, try to picture a world where both are true."],
        why: "Three pairs can't both be true: the black swan, the age claims, and the room. The other two pairs fit together." },

      { type: "pspot", kicker: "Find the flaw", skill: "Coherence",
        prompt: "<p>Ana tests three beliefs:</p>" + quote("All birds fly. Penguins are birds. Penguins can't fly.") + "<p>Here is her work. Tap the line where it **first goes wrong**.</p>",
        lines: ["\"All birds fly\" and \"Penguins are birds\" can both be true.",
                "\"Penguins are birds\" and \"Penguins can't fly\" can both be true.",
                "\"All birds fly\" and \"Penguins can't fly\" can both be true.",
                "So all three can be true together."],
        answer: 3, fix: "All three at once can't be true: if all birds fly and penguins are birds, then penguins fly, so they can't be unable to fly.",
        fb: { 0: "That pair really can both be true.", 1: "That pair really can both be true.", 2: "That pair can both be true too, since nothing there says penguins are birds." },
        hints: ["Each pair seems fine. What about all three together?"],
        why: "Every **pair** passes, but the **group** doesn't. Always test the whole set together, not only the pairs." },

      { type: "choice", kicker: "Use it", skill: "Coherence",
        prompt: "Dana believes \"Lying is always wrong,\" and also \"It was right to tell the teacher my friend was sick when he wasn't.\"<br><br>What should Dana do?",
        options: [{ t: "Ask which belief she has the weakest reasons for, and revise or drop that one" },
                  { t: "Keep both. Contradictions don't matter", fb: "A contradiction means at least one belief is false. Ignoring it means holding something false." },
                  { t: "Drop whichever one she likes less", fb: "Liking isn't a reason. The belief to give up is the one with the **weakest evidence**." }],
        answer: 0,
        hints: ["Remember move 4: give one up, and choose it for a reason."],
        why: "When beliefs clash, don't just pick one. Look at the **reasons** for each, and give up the one with the weakest case." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what does it mean for a set of beliefs to be **coherent**, and what should you do when it isn't?",
        model: "A set of beliefs is coherent if they could all be true at the same time. If they can't, they contradict, so at least one is false. Then you test the whole set together, find the clash, and give up or revise the belief with the weakest reasons. Coherent doesn't mean true, only that nothing clashes." },

      concept(7, "Coherence", "Beliefs are **coherent** if they could all be [[true]] at the same time. If they [[contradict]], at least one is false, so you must give one [[up]].",
        { chips: ["pairs", "loud"],
          fb: { "pairs": "Careful: a clash can hide in a group, even if every pair is fine.", "loud": "How loudly a belief is held doesn't change whether it clashes." } })
    ]
  };

  /* ============================================================ Lesson 8
     Taking an idea apart: conceptual analysis, and enumeration (section 1.2:
     Conceptual Analysis, Enumeration). */
  var HOW_8 = [["Name it", "Say which idea you are taking apart."],
               ["List parts", "What parts must something have to count?"],
               ["Test cases", "Try the list on clear cases and on tricky ones."],
               ["Fix it", "Change the list where a case pushes back."]];

  LESSONS[8] = {
    title: "Taking an idea apart",
    blurb: "A dictionary tells you how a word is used. Analysis asks what an idea really needs: list its parts, test them, fix them.",
    mins: 12,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Analysis",
        prompt: "Two friends argue: \"Is a hot dog a sandwich?\"<br><br>What is the most **philosophical** thing to say?",
        options: [{ t: "\"It depends on what we mean by *sandwich*. What parts does something need to count as one?\"" },
                  { t: "\"Yes, obviously.\"", fb: "That ends the conversation without asking what *sandwich* means. A philosopher goes after the meaning." },
                  { t: "\"Let's ask more people and go with the majority.\"", fb: "Counting votes tells you how people use the word. It doesn't tell you what the idea needs to be clear." }],
        answer: 0,
        hints: ["What would you have to know about the *idea* before you could answer?"],
        why: "Many arguments are really about what an idea means. Taking the idea apart is often the first job of philosophy." },

      { type: "learn", kicker: "The idea",
        prompt: "This is **conceptual analysis**: breaking a complex idea into simpler parts, to get a clearer, more useful meaning. A dictionary can't do it. A dictionary only tells you how people already use a word, not whether that use is clear.",
        scene: { type: "method", how: HOW_8 } },

      { type: "learn", kicker: "Watch",
        prompt: "Watch the four moves on the idea of a **sandwich**.",
        scene: { type: "pwalk", how: HOW_8, rows: [
          { step: 1, t: "What is a sandwich?", role: "question", tag: "Idea", say: "That's the idea to take apart." },
          { step: 2, t: "A sandwich has bread, and something to eat with the bread.", role: "reason", tag: "Parts", say: "A first list of parts: bread, and a filling." },
          { step: 3, t: "Test: a burger in a bun fits. A pizza fits too, since it has bread and toppings.", role: "objection", tag: "Case",
            say: "Most people say a pizza *isn't* a sandwich. So the list lets in something it shouldn't.",
            ask: { prompt: "What does the pizza case show about the list?", answer: 0,
                   options: [{ t: "The list is too loose. It lets in something it shouldn't" }, { t: "Pizza is a sandwich after all", fb: "That's one way out, but most people would say no, which means the list needs work." }] } },
          { step: 4, t: "A sandwich is food between two pieces of bread.", role: "claim", tag: "Fix", say: "Adding \"between two pieces\" keeps the burger and leaves out the pizza. An open-faced sandwich still pushes back, so the analysis isn't over. It's just **clearer**." }
        ] },
        gate: true,
        then: "Analysis rarely ends. Each tricky case makes the idea **clearer**." },

      { type: "pguided", kicker: "Together", skill: "Analysis",
        prompt: "Now you take apart the idea of a **library**.",
        how: HOW_8,
        steps: [
          { step: 1, ask: "Which question names the idea?", type: "choice", answer: 0,
            options: [{ t: "What is a library?" }, { t: "Where is the nearest library?", fb: "That asks for a place, not the meaning of the idea." }],
            t: "What is a library?", role: "question", tag: "Idea", say: "That's the idea to take apart.", hint: "Which question asks what the thing *is*?" },
          { step: 2, ask: "Which are **parts** a library needs? Pick all of them.", type: "multi",
            options: [{ t: "A collection of things to borrow", ok: true, fb: "Yes: without a collection there's nothing to lend." },
                      { t: "A place where they are kept", ok: true, fb: "Yes: it has to be somewhere." },
                      { t: "A way to borrow and return them", ok: true, fb: "Yes: a library lends." },
                      { t: "A coffee shop", ok: false, fb: "Nice to have, but a library without one is still a library." }],
            t: "A library has a collection of things to borrow, a place to keep them, and a way to borrow and return them.", role: "reason", tag: "Parts", say: "Three parts a library needs.", hint: "What would be missing if you took each one away?" },
          { step: 3, ask: "Test it. A free box of books on a street corner: take one, leave one. **Is it a library by this list?**", type: "choice", answer: 0,
            options: [{ t: "Yes. It has a collection, a place and a way to borrow and return. It's a tiny one" },
                      { t: "No, because it has no librarian", fb: "A librarian isn't on our list. If you think one should be, say why, but that's changing the list." }],
            t: "The street-corner book box fits all three parts, so it counts as a (very small) library.", role: "objection", tag: "Case", say: "A tricky case the list handled.", hint: "Check each part on the list against the book box." },
          { step: 4, ask: "Which sentence says the idea best now?", type: "choice", answer: 0,
            options: [{ t: "A library is a collection of things to borrow, kept in one place, with a way to borrow and return them." },
                      { t: "A library is a building with a librarian.", fb: "That fails the street-corner box, and a library with no staff is still one." }],
            t: "A library is a collection of things to borrow, kept in one place, with a way to borrow and return them.", role: "claim", tag: "Fix", say: "The list, tested and fixed.", hint: "Which one keeps the book box?" }
        ],
        why: "Same four moves: name the idea, list parts, test on cases, fix the list." },

      { type: "multi", kicker: "On your own", skill: "Analysis",
        prompt: "Now take apart a **government**. Which are **parts** a government needs?",
        options: [{ t: "A body that makes the laws", ok: true, fb: "Yes: something has to decide the rules. In many countries this is called the legislature." },
                  { t: "A body that carries out the laws", ok: true, fb: "Yes: laws that nobody carries out do nothing. This is the executive." },
                  { t: "A way to settle disputes about the laws", ok: true, fb: "Yes: when people disagree about what a law means, something has to decide. This is the judiciary." },
                  { t: "A national anthem", ok: false, fb: "Many countries have one, but a government without an anthem is still a government." }],
        hints: ["What would be missing if you took each one away?"],
        why: "A government can be taken apart into **making laws**, **carrying them out** and **settling disputes**. Claims about the whole can then be checked against claims about its parts." },

      { type: "learn", kicker: "Another example",
        prompt: "Analysis works on big, abstract ideas too. The philosopher **Aristotle** took apart **wisdom** into two parts: scientific knowledge (seeing what follows by reasoning from first principles) and understanding (grasping those first principles themselves).",
        then: "You don't have to agree with Aristotle. A list of parts gives you something definite to **question**, such as: is that really everything wisdom needs?" },

      { type: "choice", kicker: "A harder case", skill: "Analysis",
        prompt: "A dictionary says *courage* is \"being able to do something that frightens you.\"<br><br>A philosopher asks: \"Does someone who feels **no fear at all**, and leaps off a cliff for fun, have courage?\"<br><br>What does the question do?",
        options: [{ t: "It tests the definition against a case, and shows the dictionary may not be clear enough" },
                  { t: "It proves courage doesn't exist", fb: "It doesn't prove anything of the kind. It tests a definition." },
                  { t: "It shows the dictionary is always wrong", fb: "The dictionary is fine for everyday use. A philosopher asks for something more careful." }],
        answer: 0,
        hints: ["Which move in the four did you just see? *Test cases*."],
        why: "A dictionary records everyday use and stops. Analysis keeps going: **does this fit the hard cases?**" },

      { type: "multi", kicker: "Try it", skill: "Analysis",
        prompt: "Which of these are **conceptual analysis**?",
        options: [{ t: "Listing the parts something needs to count as a \"team\"", ok: true, fb: "Yes: breaking an idea into parts." },
                  { t: "Testing a definition against tricky cases", ok: true, fb: "Yes: that's the \"test cases\" move." },
                  { t: "Looking up \"team\" in a dictionary and stopping there", ok: false, fb: "That only reports how people use the word." },
                  { t: "Taking a vote on what \"team\" means", ok: false, fb: "A vote shows opinions, not whether the idea is clear." }],
        hints: ["Which ones *break the idea down* or *test it*?"],
        why: "Analysis lists parts and tests them. Looking up a word, or voting, doesn't ask whether the idea is clear." },

      { type: "pspot", kicker: "Find the flaw", skill: "Analysis",
        prompt: "<p>Mo says: \"A chair is something with four legs that you sit on.\" Here is his testing.</p><p>Tap the line where Mo's reasoning **first goes wrong**.</p>",
        lines: ["A kitchen chair has four legs and you sit on it, so the definition says chair.",
                "A table has four legs but you don't sit on it, so the definition says not a chair.",
                "An office chair has five legs and you sit on it, so the definition says not a chair.",
                "So my definition works perfectly."],
        answer: 3, fix: "It doesn't work perfectly. The office chair is a chair, and the definition wrongly leaves it out. Mo needs to fix the list (for example, \"a seat with a back, for one person\").",
        fb: { 0: "That test is fine. It's a case the definition handles.", 1: "That test is fine, too.", 2: "That test is right, and it exposes a problem. Mo should have *noticed* what it shows." },
        hints: ["Which test is a case the definition gets *wrong*? Then what should Mo do?"],
        why: "A case that pushes back is the most useful kind. It shows the list needs fixing. Don't declare the definition perfect while a clear counterexample is sitting there." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what is **conceptual analysis**, and why isn't a dictionary enough?",
        model: "Conceptual analysis breaks a complex idea into simpler parts and tests the list on clear and tricky cases to get a clearer definition. A dictionary only reports how a word is already used; it doesn't ask whether that use is clear, accurate or fits the hard cases." },

      concept(8, "Conceptual analysis", "**Conceptual analysis** takes an idea apart into [[parts]] and tests the list on [[cases]]. A dictionary only says how a word is [[used]].",
        { chips: ["votes", "feelings"],
          fb: { "votes": "A vote shows opinion, not whether an idea is clear.", "feelings": "Feelings aren't what analysis tests. It tests the list against cases." } })
    ]
  };

  /* ============================================================ Lesson 9
     Names, predicates and descriptions: two more ways to take a sentence
     apart (section 1.2: Predicates, Descriptions; Frege and Russell). */
  var HOW_9 = [["Find thing", "What is the sentence about?"],
               ["Find said", "What is being said about it?"],
               ["Make unique", "If the thing is unclear, swap in a description that fits only one."],
               ["Check", "Does the new sentence still say the same thing?"]];

  LESSONS[9] = {
    title: "Names and descriptions",
    blurb: "Split a sentence into the thing it's about and what's said about it. Then make the thing unmistakable.",
    mins: 11,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Names and predicates",
        prompt: "<p>Here is a sentence:</p>" + quote("The flower is yellow.") + "<p>What is it **about**, and what does it **say about it**?</p>",
        options: [{ t: "About the flower. It says the flower is yellow" },
                  { t: "About yellow. It says the flower is a flower", fb: "Flip them: the sentence is about the flower, and what it says is that it's yellow." },
                  { t: "It isn't about anything", fb: "Every sentence like this is about *something*, here a flower." }],
        answer: 0,
        hints: ["What would you point at? What would you say about it?"],
        why: "A simple sentence has a **thing** it is about and something it **says** about that thing." },

      { type: "learn", kicker: "The idea",
        prompt: "The German philosopher **Gottlob Frege** showed that most sentences can be split in two: the **name** of what the sentence is about, and the **predicate**, what it says about it. Splitting them shows exactly what a sentence claims.",
        art: pic("frege", "Gottlob Frege (1848–1925), whose way of splitting sentences became the base of modern logic.", { tall: true }),
        then: "A philosopher's \"predicate\" means **what is said about a thing**. It's close to, but not the same as, the grammar word." },

      { type: "learn", kicker: "The idea",
        prompt: "Four moves take a sentence apart, and make it clear.",
        scene: { type: "method", how: HOW_9 } },

      { type: "learn", kicker: "Watch",
        prompt: "<p>A coworker says:</p>" + quote("Kevin used up all the paper in the printer.") + "<p>Watch the four moves.</p>",
        scene: { type: "pwalk", how: HOW_9, rows: [
          { step: 1, t: "Kevin", role: "name", tag: "Name", say: "The thing the sentence is about." },
          { step: 2, t: "used up all the paper in the printer", role: "pred", tag: "Predicate", say: "What is said about him.",
            ask: { prompt: "Which part is the **predicate**?", answer: 0,
                   options: [{ t: "used up all the paper in the printer" }, { t: "Kevin", fb: "That's the name, the thing the sentence is about." }] } },
          { step: 3, t: "There are two Kevins here. \"Which Kevin?\"", role: "question", tag: "Problem", say: "The name isn't enough. We can't tell who is meant." },
          { step: 3, t: "The Kevin with brown hair, whose desk is by the door", role: "name", tag: "Description", say: "A **definite description** fits only one person: that Kevin, and no one else." },
          { step: 4, t: "The Kevin with brown hair, whose desk is by the door, used up all the paper.", role: "answer", tag: "Check", say: "Same claim as before, but now no one has to guess who." }
        ] },
        gate: true,
        then: "The philosopher Bertrand Russell went further: even a name like \"Max\" can be swapped for a description that fits **only one** thing." },

      { type: "pguided", kicker: "Together", skill: "Names and predicates",
        prompt: "<p>Now you do the four moves on:</p>" + quote("My dog likes naps."),
        how: HOW_9,
        steps: [
          { step: 1, ask: "What is the sentence **about**?", type: "choice", answer: 0,
            options: [{ t: "My dog" }, { t: "naps", fb: "Naps are what's said about the dog, not the thing the sentence is about." }],
            t: "My dog", role: "name", tag: "Name", say: "The thing the sentence is about.", hint: "Who or what is being talked about?" },
          { step: 2, ask: "What is **said about** it?", type: "choice", answer: 0,
            options: [{ t: "likes naps" }, { t: "my", fb: "\"My\" only helps say *which* dog. The sentence says the dog *likes naps*." }],
            t: "likes naps", role: "pred", tag: "Predicate", say: "What is said about the dog.", hint: "What does the sentence tell you about the dog?" },
          { step: 3, ask: "Which description picks out **only one** dog?", type: "choice", answer: 0,
            options: [{ t: "The brown dog that lives at 12 Elm Street and belongs to me" },
                      { t: "A dog", fb: "\"A dog\" fits millions. It doesn't pick out one." },
                      { t: "My favourite animal", fb: "That might be a cat. And it doesn't say which dog." }],
            t: "The brown dog that lives at 12 Elm Street and belongs to me", role: "name", tag: "Description", say: "It fits one dog and no other.", hint: "Which one could not possibly describe a second dog?" },
          { step: 4, ask: "Does the new sentence still say the same thing?", type: "choice", answer: 0,
            options: [{ t: "Yes: \"The brown dog at 12 Elm Street, which is mine, likes naps.\"" },
                      { t: "No: now it's about cats", fb: "It still says that the dog likes naps. We only made *which dog* clearer." }],
            t: "The brown dog at 12 Elm Street, which is mine, likes naps.", role: "answer", tag: "Check", say: "Same claim, clearer subject.", hint: "What has changed, and what hasn't?" }
        ],
        why: "Same four moves: the thing, what's said about it, a description that fits only one, then check." },

      { type: "sort", kicker: "On your own", skill: "Names and predicates",
        prompt: "Sort these pieces of sentences.",
        bins: ["The thing talked about (a name)", "What's said about it (a predicate)"],
        cards: [{ t: "The flower", bin: 0, fb: "That's what the sentence is about." },
                { t: "is yellow", bin: 1, fb: "That's what's said about the flower." },
                { t: "Superman", bin: 0, fb: "A name: the thing the sentence is about." },
                { t: "is faster than a speeding bullet", bin: 1, fb: "A predicate, what's said about Superman." },
                { t: "Max", bin: 0, fb: "A name." },
                { t: "has a loud bark", bin: 1, fb: "A predicate." },
                { t: "my sister", bin: 0, fb: "The thing being talked about." },
                { t: "plays the violin", bin: 1, fb: "What's said about her." }],
        hints: ["Ask: is this the *who or what*, or what we say *about* them?"],
        why: "Names are things we talk about. Predicates are what we say about them: *is yellow*, *has a loud bark*, *plays the violin*." },

      { type: "choice", kicker: "A harder case", skill: "Names and predicates",
        prompt: "Which of these is a **definite description**: one that fits exactly one thing?",
        options: [{ t: "The only student who won the 2024 science fair" },
                  { t: "A student who won a prize", fb: "Many students win prizes." },
                  { t: "The kid in the blue shirt", fb: "Probably several kids wear a blue shirt. It might not pick out one." }],
        answer: 0,
        hints: ["Could a second thing also fit the description?"],
        why: "\"The *only* student who won the 2024 science fair\" can fit one person. The others could fit many." },

      { type: "multi", kicker: "Try it", skill: "Names and predicates",
        prompt: "Pick the ones that are **definite descriptions** (they fit one thing).",
        options: [{ t: "The author of *Frankenstein*", ok: true, fb: "Yes: one author wrote it." },
                  { t: "A famous author", ok: false, fb: "Many authors are famous." },
                  { t: "The tallest mountain on Earth", ok: true, fb: "Yes: only one is tallest." },
                  { t: "A mountain in Asia", ok: false, fb: "There are many." },
                  { t: "The first person to walk on the Moon", ok: true, fb: "Yes: only one person was first." }],
        hints: ["Words like *the*, *only*, *first* and *tallest* often pick out one thing."],
        why: "A definite description fits **one** thing: the author of *Frankenstein*, the tallest mountain, the first person on the Moon." },

      { type: "pspot", kicker: "Find the flaw", skill: "Names and predicates",
        prompt: "<p>Lia takes apart:</p>" + quote("Sam passed the test.") + "<p>Tap the line where her work **first goes wrong**.</p>",
        lines: ["The name is \"Sam\".",
                "The predicate is \"passed the test\".",
                "To make it clear who passed, I'll replace \"Sam\" with \"the student\".",
                "Now it's perfectly clear who passed."],
        answer: 2, fix: "\"The student\" fits many students. A definite description must fit only one, such as \"the student who sits at the back of row three\".",
        fb: { 0: "That's right. Sam is who the sentence is about.", 1: "That's right. It's what is said about Sam.", 3: "That follows from line 3, but line 3 is where it went wrong." },
        hints: ["Check line 3: could a second person fit \"the student\"?"],
        why: "A description only makes things clear if it fits **one** thing. \"The student\" fits everyone in the class." },

      { type: "choice", kicker: "Use it", skill: "Names and predicates",
        prompt: "Why do philosophers bother splitting sentences like this?",
        options: [{ t: "It shows exactly what a claim says, and removes vagueness, without pointing or guessing" },
                  { t: "It makes sentences longer and more impressive", fb: "The aim is clarity, not length." },
                  { t: "It proves every sentence is true", fb: "Splitting a sentence doesn't test whether it's true, only what it *says*." }],
        answer: 0,
        hints: ["Think of the printer paper, and the two Kevins."],
        why: "Names and descriptions help us say **exactly** what we mean, so people can argue about the claim and not about who or what it's about." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what are a **name** and a **predicate**, and what is a **definite description** for?",
        model: "A name is the thing a sentence is about, and the predicate is what's said about it. A definite description replaces a name with words that fit only one thing, such as the Kevin with brown hair whose desk is by the door, so we know exactly what or who is meant." },

      concept(9, "Description", "A sentence has a [[name]] (what it's about) and a [[predicate]] (what's said). A [[description]] swaps the name for words that fit only [[one]] thing.",
        { chips: ["many", "verb"],
          fb: { "many": "The opposite: a definite description fits just one thing.", "verb": "A predicate isn't just a verb. It's everything said about the thing." } })
    ]
  };

  /* ============================================================ Lesson 10
     Thought experiments: testing an idea on an imagined case, changing one
     detail at a time (section 1.2: Thought Experiments; Plato's Republic,
     Aristotle on the void). */
  var HOW_10 = [["Pick idea", "Which idea or rule are you testing?"],
                ["Imagine", "Invent a case that puts the idea under pressure."],
                ["Change one", "Change a single detail, and see if your answer changes."],
                ["Learn", "What does the case show about the idea?"]];

  LESSONS[10] = {
    title: "Thought experiments",
    blurb: "You can test an idea without a lab: imagine a case, change one detail at a time, and watch what your answer depends on.",
    mins: 13,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Thought experiments",
        prompt: "A rule says: \"You must always give back what you've borrowed.\"<br><br>How could you **test** whether it's a good rule?",
        options: [{ t: "Imagine a case where following it would be a terrible idea" },
                  { t: "Ask a hundred people whether they like it", fb: "Liking it isn't testing it. A good test tries to *break* the rule." },
                  { t: "Check how old the rule is", fb: "Old rules can be bad rules. Age doesn't test anything." }],
        answer: 0,
        hints: ["How would you try to break a rule? With a case that puts it under pressure."],
        why: "To test a rule, look for the hardest case you can imagine. If the rule fails there, it needs work." },

      { type: "learn", kicker: "The idea",
        prompt: "A **thought experiment** is an imagined case that tests an idea. Philosophers have run them for as long as we have written philosophy. Four moves run one.",
        scene: { type: "method", how: HOW_10 } },

      { type: "learn", kicker: "Explore",
        prompt: "Try one. Set the two details, give your **verdict** on each case, and fill all four boxes.",
        scene: { type: "thought", gate: true,
                 tpl: "A friend lent you her baseball bat {1} ago. Now she asks for it back. She says she needs it for {0}.",
                 switches: [{ name: "She needs it for", a: "her team's practice", b: "hitting a classmate she's angry at" },
                            { name: "You've had it for", a: "a week", b: "a year" }],
                 ask: "Should you give it back?", verdicts: ["Give it back", "Don't give it back", "Not sure"] },
        gate: true,
        then: "Look at your table. Most people change their answer only when **her plan** changes. It doesn't matter whether you've had it for a week or a year. So the plan is the detail that does the work." },

      { type: "choice", kicker: "Check", skill: "Thought experiments",
        prompt: "In the bat case, which detail did most people's verdict depend on?",
        options: [{ t: "What the friend plans to do with the bat" },
                  { t: "How long you've had the bat", fb: "Time changes nothing here. A week or a year, you'd answer the same." },
                  { t: "What colour the bat is", fb: "The case never mentions it. It's a detail that wouldn't change anyone's answer." }],
        answer: 0,
        hints: ["Which switch changed the answer?"],
        why: "Changing **one thing at a time** shows which detail matters: here, the plan. That's how a thought experiment isolates the part of an idea that does the work." },

      { type: "learn", kicker: "Watch",
        prompt: "This case is a famous one. In Plato's *Republic*, an old man says justice means telling the truth and giving back what you owe. Socrates tests it.",
        scene: { type: "pwalk", how: HOW_10, rows: [
          { step: 1, t: "Justice is telling the truth and giving back what you owe.", role: "claim", tag: "Idea", say: "The idea on the table, offered in the *Republic*." },
          { step: 2, t: "A friend leaves you a weapon while he is in his right mind. Later he is out of his mind, and he asks for it back.", role: "objection", tag: "Case", say: "Socrates imagines a case that puts the idea under pressure." },
          { step: 3, t: "Same case, but now the friend is calm and sensible when he asks.", role: "aside", tag: "Change", say: "One detail changed: his state of mind. Nothing else did.",
            ask: { prompt: "Which detail did Socrates change?", answer: 0,
                   options: [{ t: "Whether the friend is in his right mind" }, { t: "What was lent", fb: "The weapon is the same in both versions." }] } },
          { step: 4, t: "Everyone agrees: hand it back in the second case, but not in the first.", role: "answer", tag: "Learn", say: "So \"always give back what you owe\" isn't the whole of justice. What the person will **do** with it matters too." }
        ] },
        gate: true,
        then: "Socrates never took a step outside the room, and he had a tool for finding a hole in an idea." },

      { type: "pguided", kicker: "Together", skill: "Thought experiments",
        prompt: "Now you run one. The idea to test: **\"Always keep your promises.\"**",
        how: HOW_10,
        steps: [
          { step: 1, ask: "Which idea is being tested?", type: "choice", answer: 0,
            options: [{ t: "Always keep your promises." }, { t: "Friends are important.", fb: "That's true, but it's not the idea we're testing." }],
            t: "Always keep your promises.", role: "claim", tag: "Idea", say: "The idea on the table.", hint: "Look at the prompt." },
          { step: 2, ask: "Which case puts the idea under **real pressure**?", type: "choice", answer: 0,
            options: [{ t: "You promised to meet a friend at five, but on the way someone collapses and needs help." },
                      { t: "You promised to meet a friend and nothing at all stops you.", fb: "That's an easy case. Any rule passes an easy case." },
                      { t: "You promised to meet a friend, and it's raining a little.", fb: "A bit of rain is an inconvenience, not real pressure." }],
            t: "You promised to meet a friend at five. On the way, someone collapses and needs help.", role: "objection", tag: "Case", say: "A hard case: keeping the promise means leaving someone in trouble.", hint: "Which one makes keeping the promise cost something serious?" },
          { step: 3, ask: "Which **single change** would show what matters?", type: "choice", answer: 0,
            options: [{ t: "Make the stranger's need small: they only dropped a hat" },
                      { t: "Change the stranger, the weather, the friend and the time all at once", fb: "Then you couldn't tell which change made the difference. Change **one** thing." }],
            t: "Same case, but the stranger only dropped a hat.", role: "aside", tag: "Change", say: "One detail changed: how serious the stranger's need is.", hint: "Remember: one detail at a time." },
          { step: 4, ask: "What does the pair of cases show?", type: "choice", answer: 0,
            options: [{ t: "Promises matter a lot, but not more than someone in serious need" },
                      { t: "Promises never matter", fb: "In the hat case we'd still keep the promise. Promises do matter." }],
            t: "Promises matter a lot, but a serious need can outweigh them.", role: "answer", tag: "Learn", say: "The rule \"always\" is too strong. The seriousness of the need matters.", hint: "Compare your answers to the two cases." }
        ],
        why: "Same four moves: pick the idea, imagine a hard case, change one thing, and learn what the idea needs." },

      { type: "choice", kicker: "A harder case", skill: "Thought experiments",
        prompt: "Aristotle imagined a perfect void and asked how you could measure a distance in it. Distance seems to belong to something, and a void is nothing. So, he said, there can't be a void.<br><br>How does this thought experiment work?",
        options: [{ t: "It assumes the idea is true, then shows something absurd follows" },
                  { t: "It measures a void with a very long ruler", fb: "It's all in the imagination. Nobody can measure a void." },
                  { t: "It surveys what most people think about voids", fb: "That would be an experiment on opinions. This is a piece of reasoning about the idea itself." }],
        answer: 0,
        hints: ["First he *supposes* there is a void. Then what happens?"],
        why: "Suppose the idea is true. If something absurd follows, the idea can't be true. (This is the textbook's version of Aristotle's argument; the physics has been debated ever since.)" },

      { type: "learn", kicker: "Try it",
        prompt: "One more. This time the idea is **being a friend**. Fill all four boxes.",
        scene: { type: "thought", gate: true,
                 tpl: "Sam is in your class. Sam {0}. When you are in trouble, Sam {1}.",
                 switches: [{ name: "How often Sam texts", a: "texts you every day", b: "almost never texts you" },
                            { name: "Sam when you're in trouble", a: "helps you right away", b: "doesn't help at all" }],
                 ask: "Is Sam your friend?", verdicts: ["A friend", "Not a friend", "Not sure"] },
        gate: true,
        then: "Many people say they would call Sam a friend based on **how Sam acts in trouble**, not on how often Sam texts. The experiment suggests helping matters more to the idea of friendship than texting does." },

      { type: "pspot", kicker: "Find the flaw", skill: "Thought experiments",
        prompt: "<p>Ravi tests \"Stealing is always wrong.\" Tap the line where his test **first goes wrong**.</p>",
        lines: ["Case: Ana takes bread from a shop.",
                "Change: now Ana is starving, the shop is huge, she is a doctor, it's night, and she leaves money.",
                "Verdict: that seems fine.",
                "So being hungry is what makes stealing okay."],
        answer: 1, fix: "Change just **one** thing: make Ana starving, and keep everything else the same. Then you can tell what made the difference.",
        fb: { 0: "That's a fine starting case.", 2: "That's just his verdict. The problem is how he got to the case he judged.", 3: "That conclusion follows from line 2, but the mistake is earlier." },
        hints: ["Count how many details changed. Can Ravi say which one mattered?"],
        why: "Ravi changed **five things at once**, so any of them could have made the difference. A thought experiment only shows which detail matters if you change **one at a time**." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what is a **thought experiment**, and why change only one detail at a time?",
        model: "A thought experiment is an imagined case that tests an idea. You pick the idea, imagine a hard case, change one detail, and see whether your verdict changes. Changing one thing at a time shows which detail actually matters; changing many at once hides it." },

      concept(10, "Thought experiment", "A **thought experiment** is an imagined [[case]] that tests an [[idea]]. Change just [[one]] detail at a time to see which one matters.",
        { chips: ["lab", "all"],
          fb: { "lab": "A thought experiment needs no lab. It all happens in the imagination.", "all": "The opposite: change **one** detail, or you can't tell which mattered." } })
    ]
  };

  /* ============================================================ Lesson 11
     The price of a view: trade-offs and biting the bullet (section 1.2:
     Trade-offs, "Biting the Bullet"). */
  var HOW_11 = [["State it", "Say the view clearly."],
                ["Find price", "What follows from it that sounds bad?"],
                ["Weigh it", "Is what you gain worth what you pay?"],
                ["Decide", "Accept the price, revise the view, or drop it."]];

  LESSONS[11] = {
    title: "The price of a view",
    blurb: "Every philosophical view costs something. Find the price, weigh it, and decide what to do about it honestly.",
    mins: 12,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Trade-offs",
        prompt: "A view says: \"The right thing is whatever makes the most people happy overall.\"<br><br>A town could make 1,000 people a little happier by making one person do hated, unpaid work every day. What does the view say?",
        options: [{ t: "It says the town should do it, because the total happiness goes up" },
                  { t: "It says the town must never do it", fb: "The view only counts the total. By that count, 1,000 small gains beat one big loss." },
                  { t: "It says nothing about cases like this", fb: "It says a lot: it gives a verdict on every case by adding up happiness." }],
        answer: 0,
        hints: ["Apply the view exactly as it is written, and add it up."],
        why: "Applied exactly, the view gives an answer many people find troubling. That is the **price** of the view." },

      { type: "learn", kicker: "The idea",
        prompt: "No single view fits every belief we have. Every view buys something and costs something. Turn over all three.",
        scene: { type: "turn", cols: 3, cards: [
          { i: "gears", name: "Determinism", t: "**Gain:** the world runs on law. **Price:** if earlier events fix everything, free will looks like an illusion.", c: "blue" },
          { i: "balance", name: "Most good", t: "**Gain:** it's simple and counts everyone equally. **Price:** it might allow harming one person to help many.", c: "orange" },
          { i: "quote", name: "Never lie", t: "**Gain:** it's simple and trustworthy. **Price:** it forbids lying even to protect a friend from harm.", c: "red" }] },
        gate: true,
        then: "Philosophers don't hide a view's price. They **find it, weigh it, and decide**. Four moves." },

      { type: "learn", kicker: "The idea",
        prompt: "Four moves weigh a view honestly.",
        scene: { type: "method", how: HOW_11 } },

      { type: "learn", kicker: "Watch",
        prompt: "Watch the four moves on **determinism**.",
        scene: { type: "pwalk", how: HOW_11, rows: [
          { step: 1, t: "Everything that happens is fixed by earlier events.", role: "claim", tag: "View", say: "That's the view: today was settled by yesterday, and so on back." },
          { step: 2, t: "Then my choices were fixed too, so free will would be an illusion.", role: "objection", tag: "Price", say: "That follows from the view.",
            ask: { prompt: "What is the **price** of the view?", answer: 0,
                   options: [{ t: "Free will would be an illusion" }, { t: "The world runs on law", fb: "That's what the view *gains*. The price is what it costs." }] } },
          { step: 3, t: "Is a world that runs on law worth giving up free will?", role: "aside", tag: "Weigh", say: "A fair weighing asks both: what do we gain, and what do we pay?" },
          { step: 4, t: "A determinist might say: \"Yes. Free will is an illusion, and I accept that.\"", role: "answer", tag: "Decide", say: "That's called **biting the bullet**: accepting the price, because the view is attractive for other reasons." }
        ] },
        gate: true,
        then: "To **bite the bullet** is to accept the costly result of your view. It's honest, but only if the other reasons for the view are strong." },

      { type: "pguided", kicker: "Together", skill: "Trade-offs",
        prompt: "Now you weigh the **\"most good\"** view: the right thing is whatever makes the most people happy overall.",
        how: HOW_11,
        steps: [
          { step: 1, ask: "Which sentence states the view?", type: "choice", answer: 0,
            options: [{ t: "The right thing is whatever makes the most people happy overall." }, { t: "It is always wrong to hurt anyone.", fb: "That's a different view." }],
            t: "The right thing is whatever makes the most people happy overall.", role: "claim", tag: "View", say: "The view, stated.", hint: "Look at the prompt." },
          { step: 2, ask: "What is the **price** of the view?", type: "choice", answer: 0,
            options: [{ t: "It might say harming one person is right if it helps many" },
                      { t: "It cares about happiness", fb: "That's what the view is *about*, not what it costs." }],
            t: "It might say harming one person is right if it helps enough other people.", role: "objection", tag: "Price", say: "The troubling result that follows.", hint: "What troubling answer did the warm-up case produce?" },
          { step: 3, ask: "Which sentence **weighs** it fairly?", type: "choice", answer: 0,
            options: [{ t: "It counts everyone equally, but the price is serious: someone could be treated badly" },
                      { t: "It has no price at all", fb: "We just found one." },
                      { t: "The price is so bad that nothing could outweigh it, whatever else is said", fb: "That decides before weighing. A fair weighing looks at both sides." }],
            t: "It counts everyone equally. The price: someone could be treated badly.", role: "aside", tag: "Weigh", say: "Both sides.", hint: "Which one names a gain and a price?" },
          { step: 4, ask: "Which of these is a way to **bite the bullet**?", type: "choice", answer: 0,
            options: [{ t: "\"Yes, harming one can be right when it helps enough people, and I accept that.\"" },
                      { t: "\"My view doesn't say that.\"", fb: "That denies the result. It doesn't accept it." },
                      { t: "\"Let's talk about something else.\"", fb: "That dodges. Biting the bullet means facing it." }],
            t: "\"Yes, harming one can be right if it helps enough people, and I accept that.\"", role: "answer", tag: "Decide", say: "Accept the price and keep the view.", hint: "Biting the bullet means *accepting* it." }
        ],
        why: "Same four moves: state the view, find the price, weigh it, decide." },

      { type: "sort", kicker: "On your own", skill: "Trade-offs",
        prompt: "A view has a costly result. Sort what people might **say next**.",
        bins: ["Bite the bullet", "Revise or drop the view", "Dodge (not honest)"],
        cards: [{ t: "\"Yes, that follows, and I accept it.\"", bin: 0, fb: "That accepts the price." },
                { t: "\"That's too awful. I'll change the view so it doesn't say that.\"", bin: 1, fb: "That revises the view." },
                { t: "\"That's not what my view says.\" (with no reason)", bin: 2, fb: "The result does follow. Denying it with no reason is a dodge." },
                { t: "\"I'll give up the view. The price is too high.\"", bin: 1, fb: "Dropping the view is an honest answer to the price." },
                { t: "\"Let's change the subject.\"", bin: 2, fb: "That avoids the price instead of facing it." },
                { t: "\"It follows, but the view is right for other reasons, so I accept the cost.\"", bin: 0, fb: "That's biting the bullet with a reason." }],
        hints: ["Ask: does the person *face* the result, and what do they do about it?"],
        why: "Honest answers: **accept** the price, or **revise or drop** the view. A dodge pretends the price isn't there." },

      { type: "choice", kicker: "A harder case", skill: "Trade-offs",
        prompt: "A friend bites the bullet on a view with a result almost everyone finds terrible. When is that reasonable?",
        options: [{ t: "Only if the view's other reasons are strong enough to outweigh that cost" },
                  { t: "Always. Biting the bullet is brave, so it is always right", fb: "Brave isn't the same as right. A view with a terrible price and weak reasons should be revised." },
                  { t: "Never. A view with any cost must be dropped", fb: "Every view has a cost. The question is whether the gains outweigh it." }],
        answer: 0,
        hints: ["Think about move 3: *weigh it*."],
        why: "Biting the bullet is not a prize for toughness. It's only reasonable when the view's **reasons outweigh the price**." },

      { type: "multi", kicker: "Try it", skill: "Trade-offs",
        prompt: "Your view has a costly result. Pick the **honest** responses.",
        options: [{ t: "Accept the result, and say why the view is still worth holding", ok: true, fb: "Yes: that's biting the bullet, with reasons." },
                  { t: "Revise the view so it no longer gives that result", ok: true, fb: "Yes: change the view for a reason." },
                  { t: "Drop the view", ok: true, fb: "Yes: if the price is too high." },
                  { t: "Say the result doesn't follow, when it does", ok: false, fb: "That's a denial. The result follows." },
                  { t: "Stop answering questions", ok: false, fb: "Stonewalling isn't a response to the price." }],
        hints: ["Honest responses *face* the result."],
        why: "Facing the price means accepting it, revising the view, or dropping it. Denying and dodging don't." },

      { type: "pspot", kicker: "Find the flaw", skill: "Trade-offs",
        prompt: "<p>Tomas holds a view. Tap the line where his reasoning **first goes wrong**.</p>",
        lines: ["My view: only the results of an act matter.",
                "A result of my view: it could be right to harm one person if that helps many.",
                "But that's obviously wrong, so my view doesn't really say that.",
                "So my view has no price."],
        answer: 2, fix: "He can't just say the view doesn't say it, because it follows from the view as stated. He can accept it, revise the view, or drop the view.",
        fb: { 0: "That's just stating the view.", 1: "That's right: that result does follow from the view.", 3: "That conclusion follows from line 3, but line 3 is the mistake." },
        hints: ["Which line refuses a result that follows?"],
        why: "A result that follows from a view can't be wished away. Say it follows, then **accept, revise or drop**." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what does it mean that every view has a **price**, and what does \"biting the bullet\" mean?",
        model: "Every view has results that can sound bad, and that's its price. To be honest, you find the price, weigh it against what the view gains, and then accept it (bite the bullet), revise the view, or drop it. Biting the bullet means accepting the costly result because the view is right for other reasons." },

      concept(11, "Trade-offs", "Every view has a [[price]]. To face it honestly: accept it (\"bite the [[bullet]]\"), [[revise]] the view, or drop it.",
        { chips: ["hide", "ignore"],
          fb: { "hide": "Hiding the price isn't honest. It's the one thing to avoid.", "ignore": "Ignoring the price is a dodge, not a response." } })
    ]
  };

  /* ============================================================ Lesson 12
     Back and forth: reflective equilibrium (section 1.2: Reflective Equilibrium;
     Goodman 1955, named by Rawls 1971). */
  var HOW_12 = [["Start", "Pick a rule and a few cases you feel sure about."],
                ["Compare", "Where does the rule disagree with a case?"],
                ["Adjust", "Change the rule, or your judgment, for a reason."],
                ["Repeat", "Test again against every case, until they agree."]];

  LESSONS[12] = {
    title: "Back and forth",
    blurb: "A rule and your judgments about cases have to fit. Go back and forth, adjusting each, until they do.",
    mins: 12,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Equilibrium",
        prompt: "Your rule says \"Always keep your promises.\" But in one very clear case, keeping a promise would be wrong.<br><br>What is the **better** move?",
        options: [{ t: "Adjust the rule to fit the case, then test the new rule on your other cases" },
                  { t: "Ignore the case. The rule is the rule", fb: "Then the rule hasn't been tested at all. A clear case that disagrees is information." },
                  { t: "Throw out the rule and all your other judgments", fb: "That's too much. Usually one adjustment fixes it, and the other cases tell you if it's the right one." }],
        answer: 0,
        hints: ["A rule that fails a clear case has a problem. But will a new rule hold up on the other cases too?"],
        why: "A clear case that disagrees with a rule tells you something. Adjust, then **check the other cases again**." },

      { type: "learn", kicker: "The idea",
        prompt: "This going back and forth is called **reflective equilibrium**. You adjust your rules to fit your judgments about cases, and sometimes your judgments to fit your rules, until they **agree**. Four moves do it.",
        scene: { type: "method", how: HOW_12 } },

      { type: "learn", kicker: "Explore",
        prompt: "Try it. Reach a point where the rule and all four cases **agree**. You can change the rule, or your judgment about a case.",
        scene: { type: "equilibrium", gate: true, who: "Promises", words: ["Keep it", "Break it"],
                 principles: [{ t: "Always keep your promises." },
                              { t: "Keep your promises, unless breaking one would prevent serious harm." },
                              { t: "Break a promise whenever something better comes up." }],
                 cases: [{ t: "You promised to meet a friend for lunch, but you'd rather go to a concert.", judge: 0, says: [0, 0, 1] },
                         { t: "You promised to meet a friend, but on the way someone collapses and needs help.", judge: 1, says: [0, 1, 1] },
                         { t: "You promised to return a library book today. It's raining lightly.", judge: 0, says: [0, 0, 1] },
                         { t: "You promised to keep a secret, then learn a friend is about to go on a dangerous hike alone in a storm.", judge: 1, says: [0, 1, 1] }] },
        gate: true,
        then: "There were **two ways** to get there: change the rule, or change your mind about some cases. The first keeps your judgments and finds a better rule. The second is biting the bullet. Either way, you went back and forth." },

      { type: "learn", kicker: "Watch",
        prompt: "Watch the four moves on a new rule: **\"Always tell the truth.\"**",
        scene: { type: "pwalk", how: HOW_12, rows: [
          { step: 1, t: "Rule: always tell the truth.", role: "claim", tag: "Rule", say: "Our starting rule." },
          { step: 1, t: "Case A: a friend asks if you like her new haircut, and you don't. You feel she deserves honesty, kindly said.", role: "reason", tag: "Case A", say: "A case we feel fairly sure about." },
          { step: 1, t: "Case B: a dangerous person asks where your friend is hiding. You feel you must not tell.", role: "reason", tag: "Case B", say: "Another case we feel sure about." },
          { step: 2, t: "The rule says tell the truth in Case B. Our judgment says don't.", role: "objection", tag: "Clash", say: "Case A agrees with the rule. Case B does not.",
            ask: { prompt: "Which case **disagrees** with the rule?", answer: 0,
                   options: [{ t: "Case B" }, { t: "Case A", fb: "In Case A, the rule says tell the truth, and we feel she deserves honesty. That one agrees." }] } },
          { step: 3, t: "New rule: tell the truth, unless it would help someone seriously harm another person.", role: "claim", tag: "Adjust", say: "We changed the **rule** for a reason: the harm." },
          { step: 4, t: "Test again: Case A still says tell the truth. Case B now says don't. Both agree.", role: "answer", tag: "Repeat", say: "Rule and cases fit. That's equilibrium, until a new case pushes back." }
        ] },
        gate: true,
        then: "Notice that we did **not** have to solve the theory first and then apply it. The cases changed the rule, and the rule helped us see the cases. (The method was described by the philosopher Nelson Goodman in 1955. John Rawls gave it its name in 1971.)" },

      { type: "equilibrium", kicker: "Together", skill: "Equilibrium",
        prompt: "Now you do it. A school needs a **phone rule**. Reach agreement between the rule and the four cases.",
        who: "Phones at school", words: ["Allowed", "Not allowed"],
        principles: [{ t: "No phones at school, ever." },
                     { t: "Phones are fine, except in class, unless it's for learning or an emergency." },
                     { t: "Phones are allowed anywhere, any time." }],
        cases: [{ t: "Texting friends in the middle of a math lesson.", judge: 1, says: [1, 1, 0] },
                { t: "Calling a parent because you feel very sick.", judge: 0, says: [1, 0, 0] },
                { t: "Using a dictionary app in English, with the teacher's OK.", judge: 0, says: [1, 0, 0] },
                { t: "Playing a game in the hallway between classes.", judge: 0, says: [1, 0, 0] }],
        hints: ["Try each rule and count how many cases disagree.", "One rule leaves no disagreements. Another leaves only one: could you change your mind about that case?"],
        why: "The middle rule fits all four cases. The third rule disagrees on just one (texting in math), and you could keep it only by saying that texting in the middle of a lesson is fine. That's biting the bullet." },

      { type: "choice", kicker: "A harder case", skill: "Equilibrium",
        prompt: "A classmate says: \"First we must settle the theory. Only then can we apply it to cases.\"<br><br>What would reflective equilibrium say?",
        options: [{ t: "It goes both ways: cases can change the theory, and the theory can change how we see cases" },
                  { t: "The classmate is right. Theory must always come first", fb: "That would make cases useless for testing the theory. In reflective equilibrium they push back." },
                  { t: "Cases decide everything. Theory doesn't matter", fb: "Judgments about cases can be mistaken too, and a well-supported theory can correct them." }],
        answer: 0,
        hints: ["Think: what did you do in the phone-rule activity?"],
        why: "Many students think theory comes first. Reflective equilibrium says **neither comes first**: they are adjusted against each other." },

      { type: "sort", kicker: "Try it", skill: "Equilibrium",
        prompt: "Which **move** was made?",
        bins: ["Changed the rule", "Changed a judgment", "Didn't really adjust"],
        cards: [{ t: "\"The rule failed in a clear case, so I added an exception.\"", bin: 0, fb: "That changes the rule." },
                { t: "\"The rule is strongly supported, so I'll rethink my first reaction to this one case.\"", bin: 1, fb: "That changes a judgment, for a reason." },
                { t: "\"The rule disagrees with this case. Oh well.\"", bin: 2, fb: "Leaving a disagreement alone isn't adjusting." },
                { t: "\"I replaced the rule with a different one that fits all my cases.\"", bin: 0, fb: "A new rule is a change to the rule." }],
        hints: ["Ask: what was changed, the rule or a judgment? Or was nothing changed?"],
        why: "Equilibrium needs an actual **change**, to the rule or to a judgment, and a reason for it." },

      { type: "pspot", kicker: "Find the flaw", skill: "Equilibrium",
        prompt: "<p>Jo tries to reach equilibrium. Tap the line where Jo's reasoning **first goes wrong**.</p>",
        lines: ["Rule: share the credit for a group project equally.",
                "Case: Ana worked all week; Sam did nothing. I feel it's unfair to give them equal credit.",
                "The rule disagrees with my feeling, so I'll ignore the case. A rule is a rule.",
                "Now my rule and my judgments agree."],
        answer: 2, fix: "Ignoring the case doesn't make them agree. Jo should adjust the rule (\"share credit according to effort\") or change the judgment for a reason, then test again.",
        fb: { 0: "That's just stating the rule.", 1: "That's a fair judgment, and a useful one.", 3: "That doesn't follow: nothing was adjusted." },
        hints: ["Which line leaves the disagreement as it was?"],
        why: "You can't reach equilibrium by ignoring a case. Something has to be **adjusted**, with a reason, and tested again." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what is **reflective equilibrium**, and why is it called going back and forth?",
        model: "Reflective equilibrium means adjusting your general rules and your judgments about particular cases against each other until they agree. You test a rule on cases, find where they clash, change the rule or a judgment for a reason, and test again. Neither theory nor cases come first." },

      concept(12, "Reflective equilibrium", "**Reflective equilibrium** is going [[back and forth]] between a rule and [[cases]], adjusting each for a [[reason]], until they agree.",
        { chips: ["once", "ignoring"],
          fb: { "once": "It's not a one-time step. You repeat until they fit.", "ignoring": "Ignoring a case is the one thing you can't do." } })
    ]
  };

  /* ============================================================ Lesson 13
     Meet Socrates: who he was, how we know, and his trial (section 1.3:
     the opening; sources: Aristophanes, Xenophon, Plato). */
  LESSONS[13] = {
    title: "Meet Socrates",
    blurb: "He never wrote a word, and he was put to death for his questions. How we know him, and what happened at his trial.",
    mins: 12, kind: "read",
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Socrates",
        prompt: "Socrates never wrote a single book.<br><br>How can we know what he thought?",
        options: [{ t: "Through what other people who knew him wrote about him" },
                  { t: "We can't know anything about him", fb: "We can know quite a lot, because several people who met him wrote about him." },
                  { t: "Through his diary, found in Athens", fb: "He left no diary. Everything we know comes from other people's writing." }],
        answer: 0,
        hints: ["If he wrote nothing, who else could have?"],
        why: "We know Socrates only through **other writers**: people who watched, listened and wrote it down." },

      read({ title: "The man who wrote nothing", kicker: "Read · 1 of 2", blocks: [
        ["fig", "socrates", "A Roman marble head of Socrates from the 1st century CE, probably a copy of an older Greek statue.", { tall: true }],
        "**Socrates** was born in Athens about 470 BCE. He spent his days in the marketplace and the streets, talking with anyone who would talk, and asking questions. He had no school and no fee, and no book. Yet he became the best-known thinker of the ancient world.",
        "We know him through three writers who lived in his time, and whose work survives:",
        ["list", "", [
          ["Aristophanes", "A comic playwright who put Socrates in his play *The Clouds*, as a ridiculous man hanging in a basket, studying the sky. Plato seems to have thought that comic picture helped turn Athens against him.", "mask"],
          ["Xenophon", "A soldier and historian who wrote his own account of Socrates and of his trial, in his *Memorabilia*.", "scroll"],
          ["Plato", "Socrates's student and friend, and by far the most important. Plato wrote only **dialogues**, conversations in which Socrates is nearly always the main speaker.", "quill"]]],
        ["note", "Handle with care", "Plato admired Socrates, and he chose what to put in each conversation. Some of the ideas may be Plato's own. Historians read all three sources side by side.", "search"]
      ] }),

      { type: "slots", kicker: "Check", skill: "Socrates",
        prompt: "Match each writer to what he gave us.",
        slots: [{ id: "ari", label: "Aristophanes" }, { id: "xen", label: "Xenophon" }, { id: "pla", label: "Plato" }],
        cards: [{ t: "A comedy that makes Socrates ridiculous", slot: "ari", fb: "*The Clouds*, a play." },
                { t: "A soldier-historian's account of his trial", slot: "xen", fb: "The *Memorabilia*." },
                { t: "Conversations with Socrates as the main speaker", slot: "pla", fb: "Plato's dialogues." }],
        hints: ["Which one wrote plays? Which was a soldier? Which was Socrates's student?"],
        why: "A playwright, a soldier-historian, and a student: three different views of one man." },

      read({ title: "The trial", kicker: "Read · 2 of 2", blocks: [
        ["fig", "giani", "An artist of the 1700s imagines Socrates in conversation, with Pericles, Alcibiades and Aspasia.", { tall: true }],
        "In 399 BCE, when Socrates was about seventy, a young man named **Meletus** accused him of two crimes: not honouring the gods of Athens (and bringing in new ones), and **corrupting the young**. In Athens those charges counted as a kind of treason, since the city's gods and its youth were its future.",
        "The case was heard by a **jury of about 500 Athenian citizens**. Socrates defended himself in front of them. The jury found him guilty by a narrow vote, and then sentenced him to death.",
        "Plato wrote down three conversations about these days: the **Apology**, Socrates's speech in his own defence; the **Crito**, where his friend Crito urges him to escape from prison and he refuses; and the **Phaedo**, his last conversation, in which he argues that the soul is immortal.",
        ["ask", "Socrates could have escaped, or stopped asking his questions. What does it say about him that he did neither?"]
      ] }),

      { type: "choice", kicker: "Check", skill: "Socrates",
        prompt: "In which of Plato's works does Socrates explain why he **won't escape** from prison?",
        options: [{ t: "The Crito" },
                  { t: "The Apology", fb: "The Apology is his defence speech at the trial, before the verdict." },
                  { t: "The Phaedo", fb: "The Phaedo is his last conversation, about the soul. By then he had already refused to escape." }],
        answer: 0,
        hints: ["Think of the friend who urges him to run."],
        why: "In the **Crito**, Socrates argues with his friend that it would be wrong to escape." },

      { type: "slots", kicker: "Together", skill: "Socrates",
        prompt: "Plato's three works about the trial. Match each one to what's in it.",
        slots: [{ id: "apo", label: "Apology" }, { id: "cri", label: "Crito" }, { id: "pha", label: "Phaedo" }],
        cards: [{ t: "Socrates's speech defending himself in court", slot: "apo", fb: "That's the Apology: he defends the way he lives." },
                { t: "A friend begs him to escape, and he refuses", slot: "cri", fb: "That's the Crito." },
                { t: "His last conversation, on the day he dies, about the soul", slot: "pha", fb: "That's the Phaedo." }],
        hints: ["In what order did it happen: trial, prison, last day?"],
        why: "Trial (**Apology**), prison (**Crito**), last day (**Phaedo**)." },

      { type: "multi", kicker: "A harder case", skill: "Socrates",
        prompt: "Which of these were the **charges** against Socrates?",
        options: [{ t: "Not honouring the gods of the city", ok: true, fb: "Yes: that was one of the two main charges." },
                  { t: "Bringing in new gods of his own", ok: true, fb: "Yes: part of the same charge." },
                  { t: "Corrupting the young", ok: true, fb: "Yes: the other main charge." },
                  { t: "Stealing from the city's treasury", ok: false, fb: "No: nothing like that." },
                  { t: "Plotting to start a war", ok: false, fb: "No: he wasn't accused of that." }],
        hints: ["The charges were about the gods and about the young."],
        why: "Socrates was charged with **impiety** (not honouring the city's gods and bringing in new ones) and with **corrupting the young**." },

      { type: "choice", kicker: "Try it", skill: "Socrates",
        prompt: "Plato was Socrates's friend and student. What should we keep in mind when we use him as a source?",
        options: [{ t: "He admired Socrates and chose what to include, so some ideas may be his own. Compare with other sources" },
                  { t: "Nothing. A friend always tells the whole truth", fb: "Even a loyal friend chooses what to say, and Plato was a philosopher with ideas of his own." },
                  { t: "He must be wrong, because he was a friend", fb: "A friend can be a good source. It just means we should compare with other evidence." }],
        answer: 0,
        hints: ["Remember how historians treat any source: who wrote it, and why?"],
        why: "A good source is not a perfect source. Ask who made it and why, and check it against others." },

      { type: "learn", kicker: "Use it",
        prompt: "Follow the trial, one step at a time.",
        scene: { type: "unfold", start: 1, next: "What happens next?", steps: [
          { i: "gavel", t: "Meletus accuses Socrates of not honouring the city's gods and of corrupting the young.", c: "red" },
          { i: "people", t: "A jury of about 500 Athenians hears the case. Socrates defends himself.", c: "blue" },
          { i: "scale", t: "The jury votes, and finds him guilty by a narrow margin.", c: "orange" },
          { i: "scroll", t: "He is sentenced to death. He refuses his friend's offer to escape.", c: "purple" },
          { i: "bubble", t: "In 399 BCE he dies, after a last conversation with his friends.", c: "green" }] },
        gate: true,
        then: "A man put to death for asking questions: you will see why he thought it was worth it." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: how do we know about Socrates, and why should we be careful with each source?",
        model: "Socrates wrote nothing, so we know him from three writers: Aristophanes, who made him a comic figure; Xenophon, a historian; and Plato, his student, whose dialogues are the main source. Each had their own purposes, and Plato admired him and may have added ideas of his own, so we compare them." },

      concept(13, "Socrates", "**Socrates** wrote [[nothing]], so we know him through three writers: [[Plato]], Xenophon and [[Aristophanes]].",
        { chips: ["Aristotle", "Homer"],
          fb: { "Aristotle": "Aristotle was Plato's student and came later. He didn't know Socrates.", "Homer": "Homer lived long before Socrates." } })
    ]
  };

  /* ============================================================ Lesson 14
     The wisest man in Athens: the oracle, Socrates's search, and the limits of
     knowledge (section 1.3: Plato's Apology; Understanding the Limits of
     Knowledge). The Apology is quoted in Benjamin Jowett's translation, in the public domain. */
  LESSONS[14] = {
    title: "The wisest man in Athens",
    blurb: "An oracle said no one was wiser than Socrates. Socrates went to test it, and found out what wisdom really is.",
    mins: 13, kind: "read",
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Limits of knowledge",
        prompt: "A very confident classmate says they know exactly how to fix your science project, though they haven't read the instructions.<br><br>What would a **lover of wisdom** do?",
        options: [{ t: "Ask: \"How do you know? What is that based on?\"" },
                  { t: "Believe them, since they sound sure", fb: "Sounding sure and knowing are different things." },
                  { t: "Tell them they're stupid", fb: "That insults them without helping either of you find out." }],
        answer: 0,
        hints: ["Remember the sage who respects a tradition but keeps asking *why*."],
        why: "Asking **how do you know?** is the first move of a lover of wisdom. Socrates made it his life." },

      read({ title: "What the oracle said", kicker: "Read · 1 of 2", blocks: [
        "At Delphi, in Greece, a priestess called the **Pythia** spoke for the god Apollo. People came from all over to ask her questions, and her answers were called **oracles**. A friend of Socrates named Chaerephon asked her one day whether anyone was wiser than Socrates. She said no one was.",
        "Here is how Socrates tells it to the jury, in Plato's *Apology*. The words are old, but they are Socrates's own story. Tap the highlighted phrases for help.",
        ["src", { title: "Apology", who: "Plato (translated by Benjamin Jowett)", when: "written soon after Socrates's trial in 399 BCE", i: "scroll", text: [
          "You must have known Chaerephon; he was early a friend of mine… he went to Delphi and boldly asked the oracle to tell him whether—as I was saying, I must beg you not to interrupt—he asked the oracle to tell him whether there was anyone wiser than I was, and the [[Pythian prophetess|The priestess at Delphi, who spoke for the god Apollo.]] answered that there was no man wiser.",
          "When I heard the answer, I said to myself, “What can the god mean? and what is the interpretation of this riddle? for I know that I have no wisdom, small or great. What can he mean when he says that I am the wisest of men?”"] }],
        "Socrates was stuck. He didn't think he was wise. But a god **cannot lie**, he said. So he made a plan: find someone wiser than himself, and bring that person to the god as a [[refutation|A proof that something is wrong. Socrates wanted to show the oracle wrong by finding a wiser person.]]."
      ] }),

      { type: "learn", kicker: "Watch",
        prompt: "So Socrates went looking. Follow his search, one stop at a time.",
        scene: { type: "unfold", start: 1, next: "Where does he go next?", steps: [
          { i: "capitol", t: "**The politicians.** Socrates talks with a man famous for his wisdom. He finds that the man is not really wise, though he thinks he is. And the man grows to hate Socrates for saying so.", c: "red" },
          { i: "quill", t: "**The poets.** They write beautiful poems. But when Socrates asks what the poems *mean*, the audience could explain them better than the poets. Poets write from inspiration, not wisdom.", c: "purple" },
          { i: "hammer", t: "**The craftspeople.** They really do know many fine things Socrates doesn't. But because they are good at their craft, they think they are also wise about the biggest questions. They are not.", c: "orange" },
          { i: "lamp", t: "**The result.** Everyone he tested thought they knew more than they did. Socrates, at least, did **not** think he knew what he didn't.", c: "green" }] },
        gate: true,
        then: "That's his discovery. Now read how he put it to the jury." },

      read({ title: "What the oracle meant", kicker: "Read · 2 of 2", blocks: [
        ["src", { title: "Apology", who: "Plato (translated by Benjamin Jowett)", when: "written soon after 399 BCE", i: "scroll", text: [
          "I went to one who had the reputation of wisdom… I could not help thinking that he was not really wise, although he was thought wise by many, and wiser still by himself… “Well, although I do not suppose that either of us knows anything really beautiful and good, I am better off than he is—for he knows nothing, and thinks that he knows. I neither know nor think that I know. In this latter particular, then, I seem to have slightly the [[advantage|Socrates means the one small thing he has over the politician: he doesn't pretend to know what he doesn't.]] of him.”",
          "…the truth is, O men of Athens, that God only is wise; and in this oracle he means to say that the wisdom of men is little or nothing; he is not speaking of Socrates, he is only using my name as an illustration, as if he said, “He, O men, is the wisest, who, like Socrates, knows that his wisdom is in truth worth nothing.”"] }],
        "So the riddle's answer is not that Socrates knew a lot. It is that he knew **how little he knew**. Human wisdom, he said, is worth \"little or nothing\" next to the real thing. The wisest person is the one who does not **claim** knowledge they lack.",
        ["note", "A famous sentence you may have heard", "\"I know that I know nothing\" is a short version of this idea. It isn't Socrates's exact words in the *Apology*, but it sums up what he found: he wasn't sure of the big things, and he knew he wasn't.", "bulb"]
      ] }),

      { type: "slots", kicker: "Together", skill: "Limits of knowledge",
        prompt: "What did Socrates find in each group he tested?",
        slots: [{ id: "pol", label: "The politicians" }, { id: "poe", label: "The poets" }, { id: "cra", label: "The craftspeople" }],
        cards: [{ t: "Thought they were wise, but weren't", slot: "pol", fb: "That's the first man Socrates tested, and he grew angry." },
                { t: "Wrote beautiful things they couldn't explain", slot: "poe", fb: "Poets write by inspiration, Socrates said, not by wisdom." },
                { t: "Really knew their crafts, but thought that made them wise about everything", slot: "cra", fb: "Their real skill made them overconfident about much bigger questions." }],
        hints: ["Which group really *did* know something? Which group couldn't explain their own work?"],
        why: "Three groups, three kinds of false confidence: **pretending**, **inspiration without understanding**, and **skill mistaken for wisdom**." },

      { type: "choice", kicker: "On your own", skill: "Limits of knowledge",
        prompt: "What did Socrates think made him the \"wisest\"?",
        options: [{ t: "He knew he did not know the most important things, and he did not pretend to" },
                  { t: "He knew more facts than anyone in Athens", fb: "He said the opposite: he claimed to know very little." },
                  { t: "He was cleverer than the politicians at winning arguments", fb: "Winning arguments wasn't the point. It was about not claiming knowledge he lacked." }],
        answer: 0,
        hints: ["Look for the answer that mentions *not pretending*."],
        why: "Socrates's wisdom was **knowing the limits of his knowledge**." },

      { type: "multi", kicker: "A harder case", skill: "Limits of knowledge",
        prompt: "Why can it be dangerous to claim knowledge you **don't** have? Pick all that apply.",
        options: [{ t: "Machines and bridges built on false confidence can fail and hurt people", ok: true, fb: "Yes: in technical work, refusing to admit ignorance can cost lives." },
                  { t: "It can cause needless arguments, and harm to others, over things we don't actually know", ok: true, fb: "Yes: in morals and politics it leads to polarisation and mistakes." },
                  { t: "If you think you already know, you stop looking and don't listen to evidence against you", ok: true, fb: "Yes: this may be the biggest danger of all." },
                  { t: "It makes people like you more", ok: false, fb: "It might for a while. That's one reason it tempts people, but it isn't a danger." }],
        hints: ["Think about engineering, about politics, and about learning."],
        why: "False confidence is dangerous in **technical** work, in **morals and politics**, and above all for **learning**: if you think you already know, you won't look for the truth." },

      { type: "choice", kicker: "Try it", skill: "Limits of knowledge",
        prompt: "A friend says they are 100% sure a rope bridge will hold, but they've never studied how bridges work.<br><br>What would Socrates probably do?",
        options: [{ t: "Ask: \"How do you know? What would you need to know to be sure?\"" },
                  { t: "Say, \"Then it must hold\", out of politeness", fb: "Socrates would not claim what he didn't know, or let someone else's confidence stand in for knowledge." },
                  { t: "Walk across it first, to prove them right", fb: "That puts someone at risk to avoid a simple question. Socrates asks first." }],
        answer: 0,
        hints: ["What was Socrates's first move with everyone he met?"],
        why: "Socrates asked **how do you know?** before trusting a confident claim." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: what did Socrates mean when he said that human wisdom is worth \"little or nothing\", and why was that wise?",
        model: "Socrates found that people who seemed wise only thought they were. He knew he didn't know the biggest things, and he didn't claim to. Compared with divine wisdom, human wisdom is small; the wisest person is the one who knows its limits. That matters because if you think you already know, you stop learning." },

      concept(14, "Limits of knowledge", "Socrates was wise because he knew that human [[wisdom]] is worth [[little]], and did not claim to [[know]] what he did not.",
        { chips: ["much", "everything"],
          fb: { "much": "He said human wisdom is worth *little*, not much.", "everything": "He didn't claim to know everything. He knew the limits of what he knew." } })
    ]
  };

  /* ============================================================ Lesson 15
     The Socratic method: asking instead of telling, and the midwife
     (section 1.3: The Socratic Method). The Watch example is adapted from
     Plato's Laches. */
  var HOW_15 = [["Ask", "Ask what they mean. Don't tell."],
                ["Test", "Try their idea on a case."],
                ["Show", "Let them see the clash for themselves."],
                ["Revise", "Help them fix their idea."]];

  LESSONS[15] = {
    title: "The Socratic method",
    blurb: "Socrates mostly asked questions. Learn why, what makes a question Socratic, and try being the questioner.",
    mins: 13,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Socratic method",
        prompt: "Two teachers. One says: \"The answer is twelve. Write it down.\" The other says: \"What do you think? What makes you say that?\"<br><br>Which is more like **Socrates**?",
        options: [{ t: "The one who asks what you think, and why" },
                  { t: "The one who gives the answer", fb: "Socrates almost never handed over answers. He asked questions." }],
        answer: 0,
        hints: ["Think of the oracle story: what did Socrates do when someone claimed to know?"],
        why: "Socrates asked. He wanted people to look at their own ideas, not to take his." },

      { type: "learn", kicker: "The idea",
        prompt: "Plato says Socrates's mother was a **midwife**, and that Socrates saw his own work the same way. A midwife doesn't make the baby. She helps it be born.",
        art: tiles([{ i: "person", t: "A midwife helps a baby be born", c: "orange" }, { i: "bubble", t: "Socrates helps an idea be born", c: "purple" }]),
        then: "Socrates doesn't put ideas in your head. He asks questions so you can bring **your own** thinking to light and test it. That's the **Socratic method**." },

      { type: "learn", kicker: "The idea",
        prompt: "Four moves make a Socratic conversation.",
        scene: { type: "method", how: HOW_15 } },

      { type: "learn", kicker: "Watch",
        prompt: "Watch the four moves. This one is adapted from a conversation in Plato's *Laches* about **courage**.",
        scene: { type: "pwalk", how: HOW_15, rows: [
          { step: 1, t: "Socrates: What is courage?", role: "question", tag: "Ask", say: "He asks, and doesn't tell." },
          { step: 1, t: "Laches: A man who stays at his post and fights, and doesn't run away, is courageous.", role: "claim", tag: "Idea", say: "Laches gives his idea." },
          { step: 2, t: "Socrates: What about a soldier who retreats on purpose, to draw the enemy into a trap?", role: "question", tag: "Test", say: "A case that may not fit the idea.",
            ask: { prompt: "What is Socrates doing here?", answer: 0,
                   options: [{ t: "Testing Laches's idea on a case" }, { t: "Telling Laches he's wrong", fb: "He asks a question about a case. He doesn't say Laches is wrong." }] } },
          { step: 3, t: "Laches: He is brave too. So courage can't just be staying at your post.", role: "objection", tag: "Show", say: "**Laches** sees the clash himself." },
          { step: 4, t: "Laches: Perhaps courage is a kind of endurance of the soul.", role: "answer", tag: "Revise", say: "Laches offers a better idea, and Socrates goes on to test that one, too." }
        ] },
        gate: true,
        then: "Socrates never told Laches he was wrong. Laches found it himself." },

      { type: "dialogue", kicker: "Together", skill: "Socratic method",
        prompt: "Now **you** are Socrates. Nico believes something. Ask the questions that help him look at it.",
        partner: "Nico", how: HOW_15,
        open: "I'm sure a good friend always takes your side. Always.",
        rounds: [
          { step: 1, q: [{ t: "What do you mean by “takes your side”?", ok: true, say: "Backs me up, no matter what. If I'm in an argument, they're on my team." },
                         { t: "That's wrong. Real friends are honest.", ok: false, fb: "That tells Nico what to think. Socrates asks, so that Nico looks at his own idea." },
                         { t: "Who taught you that?", ok: false, fb: "That asks where the idea came from. What matters is whether it's *true*, so ask about the idea." }] },
          { step: 2, q: [{ t: "Suppose you cheated on a test and a friend knew. Would a good friend still back you up?", ok: true, say: "Hmm… no. I'd want a good friend to tell me it was wrong. A friend who just says “you're right” isn't much of a friend." },
                         { t: "Admit it: you're already contradicting yourself!", ok: false, fb: "That's a trap, not a question. Socrates wants Nico to *see* the problem, not feel caught." },
                         { t: "What's your favourite subject at school?", ok: false, fb: "That wanders off. The next question should try his idea on a case." }] },
          { step: 3, q: [{ t: "You said a good friend always backs you up, and also that a good friend tells you when you're wrong. Can both be true?", ok: true, say: "Not really… if they tell me I'm wrong, they're not backing me up." },
                         { t: "So you were wrong from the start.", ok: false, fb: "That's a verdict. Let Nico see for himself how the two things he said fit together." },
                         { t: "I think friends should do both.", ok: false, fb: "That puts *your* idea on the table, but Nico hasn't yet seen the problem in his." }] },
          { step: 4, q: [{ t: "What would you change in what you first said?", ok: true, say: "Maybe a good friend wants what's best for me, even when that means telling me I'm wrong." },
                         { t: "Here's the right answer: a friend is someone who is honest.", ok: false, fb: "Socrates doesn't hand over the answer. He helps the person find their own." },
                         { t: "OK, we're done.", ok: false, fb: "One more step: help Nico fix his idea." }] }
        ],
        close: "Nico worked it out himself. You never told him what to think. You only asked.",
        hints: ["Which question asks Nico to look at *his own idea*, not to take yours?"],
        why: "Same four moves: ask what they mean, test on a case, let them see the clash, and help them revise." },

      { type: "dialogue", kicker: "On your own", skill: "Socratic method",
        prompt: "Again, but without the rail. **Priya** has an idea.",
        partner: "Priya",
        open: "Cheating on a quiz is fine if nobody gets hurt.",
        rounds: [
          { step: 1, q: [{ t: "Who could be affected if you cheat?", ok: true, say: "Um… the teacher, I guess. And the students who studied." },
                         { t: "That's cheating, and it's wrong.", ok: false, fb: "That tells Priya what to think. Ask, so she looks at her own idea." },
                         { t: "Do you like quizzes?", ok: false, fb: "That wanders off. Ask about her idea." }] },
          { step: 2, q: [{ t: "If you end up ranked above a student who studied hard, is that student hurt?", ok: true, say: "OK… maybe a little. But they'd never know." },
                         { t: "Have you ever been caught cheating?", ok: false, fb: "That's about Priya, not her idea. It also feels like an accusation." },
                         { t: "You're clearly hurting them.", ok: false, fb: "That's a verdict. Let her see it." }] },
          { step: 3, q: [{ t: "You said it's fine if nobody gets hurt. Does \"they'd never know\" mean they aren't hurt?", ok: true, say: "Hmm. No. Being treated unfairly is a harm, even if you never find out." },
                         { t: "So you admit it's wrong!", ok: false, fb: "That's a gotcha, not a question." },
                         { t: "Maybe they'd forgive you anyway.", ok: false, fb: "That changes the subject. Stay with her idea." }] },
          { step: 4, q: [{ t: "So what would you say now?", ok: true, say: "Cheating isn't fine just because nobody gets caught. It can hurt people who never find out." },
                         { t: "I'll tell you the rule: never cheat.", ok: false, fb: "Socrates doesn't hand over the rule. He helps Priya find hers." },
                         { t: "Let's move on.", ok: false, fb: "One more step: help her say it better." }] }
        ],
        close: "Priya changed her own idea. She had help, and the help was questions.",
        hints: ["Ask what they mean, test on a case, let them see it, then ask what they'd change."],
        why: "Priya found it herself: not knowing about a harm doesn't mean there isn't one." },

      { type: "multi", kicker: "A harder case", skill: "Socratic method",
        prompt: "Why did Socrates ask questions instead of explaining his own views? The textbook lists possible reasons. Which could be **true**?",
        options: [{ t: "He believed the god had told him to question people", ok: true, fb: "Yes: that's what he says in the Apology." },
                  { t: "He really didn't know, and wanted to learn from others", ok: true, fb: "Yes: he claimed to know very little." },
                  { t: "He only pretended not to know, so he could trap people", ok: true, fb: "That's what his critics said. We can't rule it out, though the Apology gives a different story." },
                  { t: "He wanted to help people discover the truth themselves, like a midwife", ok: true, fb: "Yes: he compares himself to a midwife. This is the one we've followed." },
                  { t: "He could not speak well enough to give a lecture", ok: false, fb: "No source says that. He argued brilliantly." }],
        hints: ["Four are reasons that have actually been suggested."],
        why: "We can't be certain why he did it. The reason this course follows is the **teaching** one: real learning comes from discovering things yourself." },

      { type: "sort", kicker: "Try it", skill: "Socratic method",
        prompt: "Which of these is a **Socratic** thing to say?",
        bins: ["Socratic: it asks", "Not Socratic: it tells or traps"],
        cards: [{ t: "\"What do you mean by that?\"", bin: 0, fb: "It asks what the person means." },
                { t: "\"Can you think of a case where that wouldn't be true?\"", bin: 0, fb: "It tests the idea on a case." },
                { t: "\"How do you know that?\"", bin: 0, fb: "It asks for reasons." },
                { t: "\"You're wrong.\"", bin: 1, fb: "A verdict, not a question." },
                { t: "\"Everyone knows that.\"", bin: 1, fb: "It ends the conversation instead of examining it." },
                { t: "\"Here is the right answer, so write it down.\"", bin: 1, fb: "That hands over the answer." }],
        hints: ["Socratic things *ask*. Others tell or trap."],
        why: "A Socratic question asks what you mean, tests an idea on a case, or asks for reasons. It doesn't hand over a verdict." },

      { type: "pspot", kicker: "Find the flaw", skill: "Socratic method",
        prompt: "<p>Here is a conversation that started well. Tap the line where it **stops being Socratic**.</p>",
        lines: ["Q: What do you mean by \"fair\"?",
                "Q: Can you think of a case where that wouldn't be fair?",
                "Well, you're obviously wrong: fair means everyone gets exactly the same.",
                "Q: Now do you agree?"],
        answer: 2, fix: "Ask instead: \"What should happen if one person needs more than another? Would the same for everyone still be fair?\" The other person should find the problem, not be told.",
        fb: { 0: "That's a good Socratic question: it asks what they mean.", 1: "That's a good Socratic question: it tests their idea on a case.", 3: "That's a question, but it only follows a lecture." },
        hints: ["Which line tells instead of asking?"],
        why: "The moment you say \"you're obviously wrong, and here's the answer\", you've stopped helping the person find it themselves." },

      { type: "choice", kicker: "Use it", skill: "Socratic method",
        prompt: "A friend says: \"Everyone cheats, so it's fine.\"<br><br>Which reply is the most **Socratic**?",
        options: [{ t: "\"What do you mean by everyone? And would it still be fine if you were the one who lost out?\"" },
                  { t: "\"No, it isn't. You should be ashamed.\"", fb: "That's a verdict, not a question. It also makes your friend defensive." },
                  { t: "\"You're right, then.\"", fb: "That ends the conversation without anyone examining anything." }],
        answer: 0,
        hints: ["Which one asks what the friend means *and* tests the idea on a case?"],
        why: "It asks what \"everyone\" means and tries the idea on a case, which is what a questioner does." },

      concept(15, "Socratic method", "The **Socratic method** helps others [[discover]] the truth for themselves by asking [[questions]] instead of giving [[answers]].",
        { chips: ["orders", "winning"],
          fb: { "orders": "Orders are the opposite of questions.", "winning": "It isn't about winning an argument. It's about helping the other person see." } })
    ]
  };

  /* ============================================================ Lesson 16
     The examined life: self-examination and the examination of nature
     (section 1.3: "The Life Which Is Unexamined Is Not Worth Living"). Quotes the
     Apology in Benjamin Jowett's translation (public domain). */
  var HOW_16 = [["State it", "What do I believe?"],
                ["Ask why", "What are my reasons?"],
                ["Check fit", "Does it fit my other beliefs?"],
                ["Revise", "Keep it, change it, or drop it."]];

  LESSONS[16] = {
    title: "The examined life",
    blurb: "Socrates said an unexamined life is not worth living. What does it mean to examine a life, and how do you start?",
    mins: 13, kind: "read",
    steps: [
      { type: "choice", kicker: "Warm up", skill: "The examined life",
        prompt: "Maria has always believed \"success means being rich.\" She has never asked herself why. She just always has.<br><br>What would Socrates say about the belief?",
        options: [{ t: "It has never been examined, so she doesn't yet know whether it's justified. Test it" },
                  { t: "It must be false, since so many people hold it", fb: "How many people believe something doesn't make it false, or true." },
                  { t: "It must be true, since she has always believed it", fb: "Believing something for a long time isn't a reason that it's true." }],
        answer: 0,
        hints: ["Socrates's job was to ask about beliefs that nobody had tested."],
        why: "A belief held without testing might be right or wrong. We don't know until we **examine** it." },

      read({ title: "Not worth living?", kicker: "Read", blocks: [
        "After the jury found him guilty, Socrates was allowed to suggest a punishment. He rejected the idea of **exile**. In a foreign city, he said, he would just keep asking questions, and strangers would welcome that even less than Athens did. Here is what he said.",
        ["src", { title: "Apology", who: "Plato (translated by Benjamin Jowett)", when: "written soon after 399 BCE", i: "scroll", text: [
          "Someone will say: “Yes, Socrates, but cannot you hold your tongue, and then you may go into a foreign city, and no one will interfere with you?” Now I have great difficulty in making you understand my answer to this. For if I tell you that this would be a disobedience to a divine command, and therefore that I cannot hold my tongue, you will not believe that I am serious; and if I say again that the greatest good of man is daily to converse about virtue, and all that concerning which you hear me examining myself and others, and that the life which is [[unexamined|Never tested or questioned. Socrates means a life lived by beliefs and habits you have never stopped to check.]] is not worth living—that you are still less likely to believe."] }],
        "It's a shocking sentence. To have lived a life that was not worth living: what could be worse? So it's worth asking what he meant by an **unexamined** life, and what an **examined** one would look like.",
        ["note", "Know thyself", "At the temple of the oracle at Delphi, three sayings were carved in stone. The best known is “Know thyself”. Socrates took it to mean: investigate your own beliefs and what you really know, and root out the ones that don't fit together.", "delphi"]
      ] }),

      { type: "learn", kicker: "The idea",
        prompt: "Socrates names two ways to examine a life. Turn over both.",
        scene: { type: "turn", cols: 2, cards: [
          { i: "thinker", name: "Examine yourself", t: "Ask what you **believe**, whether you have **reasons**, and whether your beliefs **fit together**. This is the \"know thyself\" part.", c: "purple" },
          { i: "globe", name: "Examine the world", t: "Stay **curious** about how nature and people work, and use reason to find out. Neglecting that is like neglecting a natural skill.", c: "green" }] },
        gate: true,
        then: "An examined life tests its beliefs and stays curious. That's the minimum, Socrates thought, for creatures who can reason." },

      { type: "learn", kicker: "The idea",
        prompt: "To examine a belief, use four moves. You already have the tools: reasons (Lesson 6) and fit (Lesson 7).",
        scene: { type: "method", how: HOW_16 } },

      { type: "learn", kicker: "Watch",
        prompt: "Watch the four moves on Maria's belief.",
        scene: { type: "pwalk", how: HOW_16, rows: [
          { step: 1, t: "Success means being rich.", role: "claim", tag: "Belief", say: "What Maria has always believed." },
          { step: 2, t: "Why do I believe it? Because everyone around me seems to want money.", role: "reason", tag: "Reason", say: "That's a reason, but a thin one: what many people want isn't the same as what success *is*.",
            ask: { prompt: "How good is Maria's reason?", answer: 0,
                   options: [{ t: "Thin: what many people want isn't a proof of what success is" }, { t: "Excellent: everyone can't be wrong", fb: "A crowd can be wrong. Many people have wanted things that turned out empty." }] } },
          { step: 3, t: "But I also believe that a kind and honest person has succeeded, even if they're not rich.", role: "objection", tag: "Clash", say: "That belief doesn't fit with the first one. Not everyone who is rich is kind and honest, and not everyone kind and honest is rich." },
          { step: 4, t: "Revised: success is a life I'd be proud of, with enough money to live well.", role: "answer", tag: "Revise", say: "The new belief has reasons, and it fits with her other beliefs." }
        ] },
        gate: true,
        then: "Maria isn't wrong to want money. She has just **looked** at her belief now, instead of living by it." },

      { type: "pguided", kicker: "Together", skill: "The examined life",
        prompt: "Now you examine another belief: **\"Everyone should always work as hard as possible.\"**",
        how: HOW_16,
        steps: [
          { step: 1, ask: "Which sentence states the belief?", type: "choice", answer: 0,
            options: [{ t: "Everyone should always work as hard as possible." }, { t: "Working is hard.", fb: "That says something different. The belief is about what everyone *should* do." }],
            t: "Everyone should always work as hard as possible.", role: "claim", tag: "Belief", say: "The belief, stated.", hint: "Look at the prompt." },
          { step: 2, ask: "Which one is a **reason** for the belief, and not just a feeling?", type: "choice", answer: 0,
            options: [{ t: "Working hard gets important things done" }, { t: "Everyone says so", fb: "What everyone says isn't a reason that it's true." }, { t: "It makes me feel busy", fb: "A feeling isn't a reason that it's right." }],
            t: "A reason: working hard gets important things done.", role: "reason", tag: "Reason", say: "A real reason, something we can weigh.", hint: "Which one gives a reason someone else could check?" },
          { step: 3, ask: "Which other belief of mine **doesn't fit** with it?", type: "choice", answer: 0,
            options: [{ t: "Rest and sleep matter for health" }, { t: "Homework is a part of school", fb: "That fits fine with working hard." }],
            t: "But I also believe that rest and sleep matter for health.", role: "objection", tag: "Clash", say: "\"Always as hard as possible\" leaves no room for rest.", hint: "Which belief pushes the other way?" },
          { step: 4, ask: "Which revision fixes the clash?", type: "choice", answer: 0,
            options: [{ t: "Work hard at what matters, and rest so you can keep going" }, { t: "Never work hard", fb: "That throws out the reason (hard work gets important things done) along with the problem." }],
            t: "Revised: work hard at what matters, and rest so you can keep going.", role: "answer", tag: "Revise", say: "The new belief keeps the reason and fits with the other.", hint: "Keep what has a good reason and fix what clashes." }
        ],
        why: "Same four moves: state the belief, ask why, check the fit, and revise." },

      { type: "sort", kicker: "On your own", skill: "The examined life",
        prompt: "Which sound **examined**, and which **unexamined**?",
        bins: ["Examined", "Unexamined"],
        cards: [{ t: "\"I've always believed it, so I never think about it.\"", bin: 1, fb: "Never looked at it." },
                { t: "\"I believe it, I know my reasons, and I've checked that it fits with my other beliefs.\"", bin: 0, fb: "That's all four moves." },
                { t: "\"Everyone around me believes it, so I do.\"", bin: 1, fb: "Borrowed from others without a test." },
                { t: "\"I used to think so, but when I tried it on a case I changed my mind.\"", bin: 0, fb: "It was tested, and revised." },
                { t: "\"I don't know why I believe it, but I do.\"", bin: 1, fb: "No reasons, so nothing to examine." }],
        hints: ["Ask: has the belief been *tested* by reasons and by fit?"],
        why: "An examined belief has **reasons** and **fits** with the rest. An unexamined one has just been picked up." },

      { type: "choice", kicker: "A harder case", skill: "The examined life",
        prompt: "A classmate says: \"Ignorance is bliss. Why bother examining anything?\"<br><br>What would be a Socratic reply?",
        options: [{ t: "Beliefs you never test may crumble when something challenges them. And examining is part of living well for creatures who can reason" },
                  { t: "You're wrong, and you're stupid", fb: "That insults. It doesn't examine." },
                  { t: "You're right. Don't bother", fb: "Socrates would never agree that thinking creatures should live on untested beliefs." }],
        answer: 0,
        hints: ["Think about what happens to an untested belief when life challenges it."],
        why: "The book's reply: a life run by **ideas that were never tested** is a poor fit for creatures who can think." },

      { type: "choice", kicker: "Try it", skill: "The examined life",
        prompt: "What is the **most sensible** reading of \"the unexamined life is not worth living\"?",
        options: [{ t: "A thinking person should believe things worth believing, hold views they can defend, and know why they do what they do" },
                  { t: "People who don't study philosophy deserve pity", fb: "That's a harsh reading. Socrates is talking about how *anyone* can live well, not about who is smarter." },
                  { t: "You must never rest or enjoy anything", fb: "Nothing about that is in the passage." }],
        answer: 0,
        hints: ["Look for the reading that sets a *minimum* for a thinking person."],
        why: "The minimum for creatures who can reason: **hold beliefs worth believing, defend them, and understand why you act as you do.** Self-examination is how." },

      { type: "explain", kicker: "Say it",
        prompt: "Pick **one belief of your own**. Say what it is, why you hold it, and whether it fits with your other beliefs.",
        model: "For example: \"I believe it's wrong to cheat. I hold it because cheating treats other people unfairly and I wouldn't want it done to me. It fits with my belief that people should be treated fairly. But I also believe in helping my friends, and that sometimes pulls the other way, so I need to think about it.\"" },

      concept(16, "The examined life", "An **examined** life tests its [[beliefs]], asks [[why]], and checks that they [[fit]] together.",
        { chips: ["follows", "avoids"],
          fb: { "follows": "An examined life doesn't just follow beliefs. It tests them.", "avoids": "Examining means facing a belief, not avoiding it." } })
    ]
  };

  /* ============================================================ Lesson 17
     Socrates's harm principle: two surprising claims, taken apart with the tools
     of Lesson 6 (section 1.3: The Importance of Doing No Harm). */
  LESSONS[17] = {
    title: "Socrates's harm principle",
    blurb: "Socrates made two claims about harm that sound false at first. Take his reasons apart and test them fairly.",
    mins: 13,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Harm principle",
        prompt: "In an argument, the reasons are called **premises**. What is the claim they support called?",
        options: [{ t: "The conclusion" }, { t: "The premise", fb: "Premises are the reasons. The claim they support is the conclusion." }, { t: "The aside", fb: "An aside isn't part of the argument at all." }],
        answer: 0,
        hints: ["Remember Lesson 6: blue for reasons, orange for the claim."],
        why: "Reasons are the premises. The claim they support is the **conclusion**. We'll use that to take Socrates apart." },

      { type: "learn", kicker: "The idea",
        prompt: "Socrates cared most about how to live well, and made two claims about harm. Turn over both.",
        scene: { type: "turn", cols: 2, cards: [
          { i: "bubble", name: "Claim 1", t: "No one **willingly** chooses what is harmful to themselves.", c: "blue" },
          { i: "balance", name: "Claim 2", t: "When a person does harm to others, they actually **harm themselves**.", c: "orange" }] },
        gate: true,
        then: "Both sound false at first. The book asks you to **give Socrates the benefit of the doubt**: understand his reasons before you decide." },

      { type: "learn", kicker: "Watch",
        prompt: "Take apart his reasons for **Claim 1**, with the four moves from Lesson 6.",
        scene: { type: "pwalk", how: HOW_6, rows: [
          { step: 1, t: "People who do harmful things are mistaken. They don't want what is bad for its own sake.", role: "claim", tag: "Claim", say: "The point of the passage, in plain words." },
          { step: 2, t: "Everyone wants what is good.", role: "reason", tag: "Reason 1", say: "Socrates thinks this is obvious: nobody wants what is bad *for its own sake*." },
          { step: 2, t: "When someone chooses something, it seems good to them.", role: "reason", tag: "Reason 2", say: "A desire is always aimed at something that *appears* good." },
          { step: 3, t: "So no one chooses harm for its own sake. Those who do harm believe it will bring them some good, and are wrong.", role: "claim", tag: "So", say: "Reasons first, claim last.",
            fig: board(["Everyone wants what is good.", "When someone chooses something, it seems good to them."], "No one chooses harm for its own sake. Those who do harm believe it will bring some good, and they are mistaken.") },
          { step: 4, t: "If both reasons are true, the claim follows. The doubtful part: is it *always* true that what someone chooses seems good to them?", role: "aside", tag: "Link", say: "That's where to push. A fair test starts by seeing how the argument is built." }
        ] },
        gate: true,
        then: "Socrates concludes that when people do harm, the cause is **ignorance**: they were wrong about what is good for them." },

      { type: "pguided", kicker: "Together", skill: "Harm principle",
        prompt: "Now you take apart his reasons for **Claim 2**: <b>\"When a person does harm to others, they harm themselves.\"</b>",
        how: HOW_6,
        steps: [
          { step: 1, ask: "Which sentence is the **claim**?", type: "choice", answer: 0,
            options: [{ t: "Doing harm to others harms yourself." },
                      { t: "The worst harm anyone can suffer is a corrupted character.", fb: "That's a reason, an assumption Socrates uses." }],
            t: "Doing harm to others harms yourself.", role: "claim", tag: "Claim", say: "What he wants us to accept.", hint: "Which sentence says what is true of someone who harms others?" },
          { step: 2, ask: "Which are his **reasons**? Pick both.", type: "multi",
            options: [{ t: "The worst harm anyone can suffer is a corrupted character.", ok: true, fb: "Yes: this is the first reason." },
                      { t: "Doing harm to others corrupts your own character.", ok: true, fb: "Yes: this is the second reason." },
                      { t: "Socrates was put to death in 399 BCE.", ok: false, fb: "True, but not a reason for this claim." }],
            lead: [{ t: "The worst harm anyone can suffer is a corrupted character.", role: "reason", tag: "Reason 1", say: "For Socrates, character is what matters most." }],
            t: "Doing harm to others corrupts your own character.", role: "reason", tag: "Reason 2", say: "Making bad choices makes you a worse person.", hint: "Which sentences *support* the claim?" },
          { step: 3, ask: "Which goes under the line?", type: "choice", answer: 0,
            options: [{ t: "The claim" }, { t: "The reasons", fb: "Reasons first, claim last." }],
            t: "So: doing harm to others harms yourself.", role: "claim", tag: "So", say: "Reasons first, claim last.", hint: "Reasons build up to what?" },
          { step: 4, ask: "Which part of the argument would you **question** first?", type: "choice", answer: 0,
            options: [{ t: "Whether a corrupted character really is the worst harm" },
                      { t: "Whether Socrates lived in Athens", fb: "That's not a part of the argument." }],
            t: "The doubtful part: is a corrupted character really worse than any other harm?", role: "aside", tag: "Link", say: "A fair test finds the premise the argument rests on.", hint: "Which one is a *premise* in the argument?" }
        ],
        why: "Same four moves as in Lesson 6. Taking an argument apart is how you test it fairly." },

      { type: "argue", kicker: "On your own", skill: "Harm principle",
        prompt: "At the end of Plato's Apology, Socrates tells the jury they cannot really harm a good man.<br><br>Take his reasoning apart.",
        items: [{ t: "A good person cannot really be harmed.", role: "claim", fb: "That's his point." },
                { t: "A good person cannot be made to do wrong.", role: "reason", fb: "That's one reason: you can't force goodness out of someone." },
                { t: "Doing wrong is the only harm that truly matters.", role: "reason", fb: "That's the other reason: harm to character is the real harm." },
                { t: "Socrates was about seventy when he spoke.", role: "aside", fb: "True, but not part of the argument." }],
        hints: ["Which sentence says what the jury cannot do?"],
        why: "Even death, for Socrates, is a minor and temporary harm. What would really harm a person is being **made to do wrong**." },

      { type: "choice", kicker: "A harder case", skill: "Harm principle",
        prompt: "An objection: \"A bully hurts people **just for fun**, and he knows it's wrong. So Claim 1 is false.\"<br><br>How might Socrates reply?",
        options: [{ t: "Even the bully is after something that seems good to him, such as fun or power. His mistake is about what is *really* good" },
                  { t: "He'd agree some people want evil for its own sake", fb: "That would give up his claim. His answer is that the bully believes it brings him something good." },
                  { t: "He'd say the bully doesn't exist", fb: "Socrates wasn't naive. He'd say the bully is real, and mistaken about what is good." }],
        answer: 0,
        hints: ["Remember Reason 2: whatever we choose *seems good to us*."],
        why: "Socrates's reply: what the bully wants (fun, power, being feared) *seems good to him*. His mistake is **ignorance** about what really is good." },

      { type: "choice", kicker: "Try it", skill: "Harm principle",
        prompt: "Why might Socrates think harm to your **character** is worse than death?",
        options: [{ t: "He thinks what makes a life good is the state of your character, while death only ends the body" },
                  { t: "He didn't fear anything", fb: "He wasn't fearless. He gave a *reason*: character is what matters most." },
                  { t: "He thought death was funny", fb: "Nothing like that. He argued that harm to character is the greatest harm." }],
        answer: 0,
        hints: ["What does Socrates think matters most in a life?"],
        why: "For Socrates, physical suffering and even death are **minor, temporary** harms. A corrupted character is a lasting one." },

      { type: "pspot", kicker: "Find the flaw", skill: "Harm principle",
        prompt: "<p>Sam sets out Socrates's second claim as an argument. Tap the line that **doesn't belong**.</p>",
        lines: [chip("reason", "Reason 1") + " Doing harm to others corrupts your own character.",
                chip("reason", "Reason 2") + " Socrates was put to death in 399 BCE.",
                chip("reason", "Reason 3") + " A corrupted character is the worst harm anyone can suffer.",
                chip("claim", "So") + " Doing harm to others harms yourself."],
        answer: 1, fix: "Cut it. His death is true but not a reason for the claim, so the argument has two reasons.",
        fb: { 0: "That's a real reason for the claim.", 2: "That's a real reason for the claim.", 3: "That's the claim, and it belongs at the bottom." },
        hints: ["Check each reason against the claim. Does it help support it?"],
        why: "A reason has to be **relevant**. Socrates's death doesn't support a claim about what harm does to a person." },

      { type: "choice", kicker: "Use it", skill: "Harm principle",
        prompt: "The book asks you to \"give Socrates the benefit of the doubt\" before you judge his claims. What does that mean?",
        options: [{ t: "Read his claim in its strongest, most sensible form, and understand his reasons, before you decide" },
                  { t: "Agree with him whatever he says", fb: "It isn't agreeing. You can still find a flaw after you've understood." },
                  { t: "Assume he is wrong, and look for the mistake", fb: "That's the opposite: it's unfair to judge before you've understood." }],
        answer: 0,
        hints: ["It's about *how* you read, not what you conclude."],
        why: "Understand a claim at its **best** before you test it. Then, if you still find an error, it's a real one." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: do you agree with Socrates's **first claim** (no one willingly chooses what is harmful to themselves)? Give a reason, and say how Socrates might answer your best objection.",
        model: "A possible answer: \"I partly agree. People usually act for something that seems good to them. But someone might knowingly do something harmful to themselves, like staying up all night. Socrates might say they still think it will bring them something good, such as finishing a game, and they're ignorant about what's best for them.\"" },

      concept(17, "Harm principle", "Socrates held that no one [[willingly]] chooses what harms them, and that doing harm to others harms your own [[character]].",
        { chips: ["wealth", "luck"],
          fb: { "wealth": "Socrates thought character mattered more than wealth.", "luck": "Luck isn't what he means. He means what harm does to your character." } })
    ]
  };

  /* ============================================================ Lesson 18
     Ahimsa and Socrates: comparing two traditions on harm (section 1.3:
     Comparison of Socrates's Harm Principle with Ahimsa in the Indian Tradition). */
  var HOW_18 = [["Say each", "State each view in one sentence."],
                ["Find match", "What do the two views share?"],
                ["Find gap", "Where do they differ?"],
                ["Ask why", "Which has the better reasons, or is there a third idea?"]];

  LESSONS[18] = {
    title: "Ahimsa and Socrates",
    blurb: "A thought from classical India sounds a lot like Socrates's second claim. Compare them: what matches, and what doesn't.",
    mins: 12, kind: "read",
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Ahimsa",
        prompt: "Which of Socrates's two claims says that harming others harms **yourself**?",
        options: [{ t: "Claim 2" }, { t: "Claim 1", fb: "Claim 1 is that no one willingly chooses what is harmful to *themselves*." }],
        answer: 0,
        hints: ["Remember: Claim 1 is about what people choose. Claim 2 is about what harm does."],
        why: "**Claim 2**: doing harm to others harms the one who does it." },

      read({ title: "Ahimsa: the absence of harm", kicker: "Read", blocks: [
        "In classical India there is an idea very close to Socrates's second claim. It is called **ahimsa**, Sanskrit for [[“the absence of doing injury”|*Himsa* is injury or harm; *a-* means “not”. So *ahimsa* is not harming, in action, in word and in thought.]]. It appears in Hindu, Jain and Buddhist writings, and it is counted among the highest virtues.",
        "**Jain** monks and nuns take it further than most of us could. They try never to harm any living creature, even insects. Many sweep the ground gently before they step, so as not to crush anything small.",
        "In the twentieth century, **Mahatma Gandhi** built a movement of **nonviolent civil disobedience** on ahimsa. Many historians say it helped speed the end of British rule in India.",
        "Why does ahimsa matter so much? Indian traditions teach **karma**: an action has effects that come back to the person who did it, even across lifetimes (*samsara*, the cycle of rebirth). Harming others binds you to suffering. Beings are also all linked, so harming one is like harming a member of your own family, or a part of yourself.",
        "Indian philosophers also link harm to **ignorance**, but a different kind. Suffering, they say, comes from **attachment** to things that don't last: feelings, goals, possessions. The cure is to see that everything comes from earlier causes and passes away, so there is nothing to cling to, and nothing to harm others for.",
        "And ahimsa isn't only about holding back. It also calls for **love and compassion**. Martin Luther King Jr., who learned from Gandhi, wrote that we are all “tied in a single garment of destiny”."
      ] }),

      { type: "choice", kicker: "Check", skill: "Ahimsa",
        prompt: "What does **ahimsa** mean?",
        options: [{ t: "Not doing harm or injury (and practising compassion)" },
                  { t: "Winning arguments", fb: "That isn't it. Ahimsa is about harm." },
                  { t: "Following the oldest teacher", fb: "It isn't about teachers. It's about not harming." }],
        answer: 0,
        hints: ["The *a-* at the front means “not”."],
        why: "Ahimsa means **the absence of doing harm**, and in practice includes love and compassion for all beings." },

      { type: "learn", kicker: "The idea",
        prompt: "To compare two views fairly, use four moves.",
        scene: { type: "method", how: HOW_18 } },

      { type: "learn", kicker: "Watch",
        prompt: "Watch the four moves on Socrates and ahimsa.",
        scene: { type: "pwalk", how: HOW_18, rows: [
          { step: 1, t: "Socrates: doing harm to others corrupts your own character.", role: "claim", tag: "Socrates", say: "His view in one sentence." },
          { step: 1, t: "Ahimsa: harming others binds you to suffering, through karma.", role: "claim", tag: "Ahimsa", say: "The Indian view in one sentence." },
          { step: 2, t: "Both say that harming others harms **you**.", role: "answer", tag: "Match", say: "That's the big overlap.",
            ask: { prompt: "What do the two views **share**?", answer: 0,
                   options: [{ t: "Harming others harms the one who does it" }, { t: "Both are about rebirth", fb: "Only the Indian view uses rebirth. What they share is the idea about harm coming back to you." }] } },
          { step: 3, t: "But they say **how**: damage to character now, or karma carried across lives.", role: "objection", tag: "Gap", say: "Different mechanisms for the same conclusion." },
          { step: 4, t: "We can ask which explanation is more convincing, or whether there's a third idea.", role: "aside", tag: "Why", say: "One needs rebirth; the other doesn't. You may find one more convincing than the other, or neither." }
        ] },
        gate: true,
        then: "Two traditions, far apart in place and time, arrived at the same surprising claim, by different roads." },

      { type: "sort", kicker: "Together", skill: "Ahimsa",
        prompt: "Which view says each of these?",
        bins: ["Socrates", "Both", "Ahimsa"],
        cards: [{ t: "Harming others harms you", bin: 1, fb: "Both say this." },
                { t: "The worst harm is to your character", bin: 0, fb: "That's Socrates." },
                { t: "Harm leads to karma carried across lifetimes", bin: 2, fb: "That's the Indian view." },
                { t: "People do harm because of ignorance", bin: 1, fb: "Both link harm and ignorance, in different ways." },
                { t: "All beings are connected, like one family", bin: 2, fb: "That's part of the Indian view." },
                { t: "No one chooses what they think is bad for themselves", bin: 0, fb: "That's Socrates's first claim." },
                { t: "Also calls for love and compassion for all beings", bin: 2, fb: "That's ahimsa." }],
        hints: ["Which ideas use *karma* or *rebirth*? Which use *character*?"],
        why: "They agree that harm comes back to you, and both connect harm with ignorance. They differ on **why** it comes back." },

      { type: "slots", kicker: "On your own", skill: "Ahimsa",
        prompt: "Both views say harm and ignorance are linked, but the ignorance is about **different things**. Match.",
        slots: [{ id: "soc", label: "Socrates" }, { id: "ind", label: "Indian philosophers" }],
        cards: [{ t: "Not knowing what is truly good for you", slot: "soc", fb: "Socrates: harm comes from being wrong about what is good." },
                { t: "Clinging to things that don't last: feelings, goals, possessions", slot: "ind", fb: "In Indian thought, suffering comes from attachment to temporary things." }],
        hints: ["One is about *what is good*. The other is about *holding on*."],
        why: "Socrates: harm comes from **not knowing what is good**. Indian philosophers: suffering comes from **attachment to what is temporary**, cured by seeing that everything is part of an endless chain of causes." },

      { type: "choice", kicker: "A harder case", skill: "Ahimsa",
        prompt: "Both traditions link harm to ignorance. What is the main **difference**?",
        options: [{ t: "What the ignorance is about: what is good (Socrates), or the temporary nature of things (Indian view)" },
                  { t: "Only one of them says harm comes back to you", fb: "Both say that. The difference is in why." },
                  { t: "Only one of them thinks harm is bad", fb: "Both think harm is bad." }],
        answer: 0,
        hints: ["Look at the previous step: what was each one ignorant *of*?"],
        why: "Same warning, different diagnosis: **not knowing what's good**, versus **clinging to what is temporary**." },

      { type: "choice", kicker: "Try it", skill: "Ahimsa",
        prompt: "How did **Gandhi** use ahimsa?",
        options: [{ t: "He built a movement of nonviolent civil disobedience on it" },
                  { t: "He used it to justify a war", fb: "The opposite. Ahimsa means not harming." },
                  { t: "He taught it only to monks", fb: "He took it into public life and politics." }],
        answer: 0,
        hints: ["Think of the word *nonviolent*."],
        why: "Gandhi turned ahimsa into **nonviolent civil disobedience**." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: compare Socrates's harm principle with ahimsa. What do they share, and where do they differ?",
        model: "Both say that harming others harms you, and both link harm to some kind of ignorance. They differ in how and why: Socrates says harm corrupts your character, and comes from not knowing what is good; ahimsa says harm creates karma and ties you to suffering across lifetimes, and attachment to temporary things is the root of suffering." },

      concept(18, "Ahimsa and Socrates", "Both Socrates and [[ahimsa]] teach that harming others [[harms]] you, but they explain it differently: [[character]] versus karma.",
        { chips: ["profit", "speed"],
          fb: { "profit": "Neither view is about profit.", "speed": "Speed isn't part of either view." } })
    ]
  };

  /* ============================================================ Lesson 19
     What philosophers do today: the fields of philosophy, the textbook's map,
     and what people trained in philosophy go on to do (section 1.4: An Overview
     of Contemporary Philosophy). */
  LESSONS[19] = {
    title: "What philosophers do today",
    blurb: "The main fields of philosophy, the map of this course, and the surprising places philosophy takes people.",
    mins: 10,
    steps: [
      { type: "choice", kicker: "Warm up", skill: "Fields",
        prompt: "A friend says: \"Philosophy is just people's opinions.\"<br><br>What have you seen in this unit that shows otherwise?",
        options: [{ t: "Philosophers use evidence, build and test arguments, check for contradiction, and revise their views for reasons" },
                  { t: "Philosophers all agree with each other", fb: "They don't. The disagreements are part of the subject. What matters is how they argue." },
                  { t: "Philosophers only repeat what the oldest books said", fb: "They also test ideas on new cases, and change their minds." }],
        answer: 0,
        hints: ["Remember the toolkit: evidence, arguments, coherence, thought experiments."],
        why: "Philosophy has **methods**. Opinions are where it starts. Reasons, evidence and tests are what it does with them." },

      { type: "learn", kicker: "The idea",
        prompt: "Today, academic philosophers specialise. The textbook groups the subject into **four fields**. Turn over each.",
        scene: { type: "turn", cols: 2, cards: [
          { i: "globe", name: "Historical traditions", t: "How philosophy grew in Indigenous, Indian, Chinese, Greek, Jewish, Christian and Islamic thought, and in Africa, Japan and Latin America.", c: "orange" },
          { i: "bubble", name: "Metaphysics and epistemology", t: "What is real? What is a self? What can we **know**, and how?", c: "purple" },
          { i: "triangle", name: "Science, logic and mathematics", t: "What makes reasoning good? What is a scientific explanation? What are numbers?", c: "blue" },
          { i: "scale", name: "Value theory", t: "What is **good**, **right**, **beautiful** and **just**? Includes ethics, aesthetics and political philosophy.", c: "green" }] },
        gate: true,
        then: "The rest of the course follows these four fields. The goal is the same as ever: how things **hang together**." },

      read({ title: "What do philosophers do?", kicker: "Read", blocks: [
        "A person who wants to be a **professor of philosophy** needs a PhD. The jobs are few and very competitive, and most are teaching jobs. Researchers in philosophy pick a narrow area and become expert in it.",
        "But most people trained in philosophy don't become professors. The skills travel: asking good questions, reasoning carefully, spotting weak arguments, writing clearly. Here are a few people who studied philosophy, and where they went:",
        ["list", "", [
          ["Reid Hoffman", "Co-founded LinkedIn. He earned a master's degree in philosophy at Oxford.", "laptop"],
          ["Carly Fiorina", "Became the chief executive of Hewlett-Packard. She studied medieval history and philosophy.", "cap"],
          ["David Barnett", "A philosophy professor who invented the PopSocket phone grip, and then founded the company in 2012.", "hammer"],
          ["Nigel Warburton", "A philosophy teacher who started the podcast *Philosophy Bites*, and became an editor of the magazine *Aeon*.", "mic"]]],
        "Today, technology, neuroscience and medical companies also hire philosophers, to help with research and ethics reviews.",
        ["note", "A broad kind of education", "The idea of a liberal arts education is to learn the main ideas and methods that shaped our world, from science to literature to philosophy. That's worth more than preparing for one job.", "bulb"]
      ] }),

      { type: "choice", kicker: "Check", skill: "Fields",
        prompt: "What kind of preparation is studying philosophy?",
        options: [{ t: "A broad one: it trains thinking skills that people use in many careers" },
                  { t: "It prepares you for exactly one job, teaching philosophy", fb: "Teaching is one option, but people go into law, business, technology, writing and more." },
                  { t: "It prepares you for nothing", fb: "It trains questioning, reasoning and writing, which many careers use." }],
        answer: 0,
        hints: ["Think of the four people in the reading."],
        why: "Philosophy is **broad training**. It doesn't point to one career, and it opens many." },

      { type: "sort", kicker: "Together", skill: "Fields",
        prompt: "Which **field** does each question belong to?",
        bins: ["Historical traditions", "Metaphysics and epistemology", "Science, logic and mathematics", "Value theory"],
        cards: [{ t: "Did thinkers in India and China ask the same questions as the Greeks?", bin: 0, fb: "That's about how philosophy grew in different traditions." },
                { t: "Is a person the same person over time?", bin: 1, fb: "Self and identity are questions about what is real: metaphysics." },
                { t: "How could you know you're not dreaming right now?", bin: 1, fb: "That's about what we can know: epistemology." },
                { t: "What makes an argument good?", bin: 2, fb: "That's logic." },
                { t: "What counts as a scientific explanation?", bin: 2, fb: "That's the philosophy of science." },
                { t: "Is it wrong to lie?", bin: 3, fb: "Right and wrong: value theory (ethics)." },
                { t: "Is beauty only in the eye of the beholder?", bin: 3, fb: "Beauty: value theory (aesthetics)." },
                { t: "What gives a government the right to rule?", bin: 3, fb: "Justice and authority: value theory (political philosophy)." }],
        hints: ["*Real* or *know* → metaphysics and epistemology. *Right*, *good*, *beautiful* → value theory."],
        why: "Real and known: **metaphysics and epistemology**. Good, right, beautiful, just: **value theory**. Reasoning and explanation: **science and logic**. How it all grew: **historical traditions**." },

      { type: "sort", kicker: "On your own", skill: "Fields",
        prompt: "This course has twelve units. Which field is each of these in?",
        bins: ["Historical traditions", "Metaphysics and epistemology", "Science, logic and mathematics", "Value theory"],
        cards: [{ t: "The early history of philosophy around the world", bin: 0, fb: "That's historical traditions." },
                { t: "Logic and reasoning", bin: 2, fb: "That's logic." },
                { t: "Metaphysics", bin: 1, fb: "Metaphysics: what is real." },
                { t: "Epistemology", bin: 1, fb: "Epistemology: what we can know." },
                { t: "Normative moral theory", bin: 3, fb: "Moral theory: value theory." },
                { t: "Political philosophy", bin: 3, fb: "Political philosophy: value theory." }],
        hints: ["Use the four fields from the cards."],
        why: "Units 3 and 4 are **historical traditions**; Unit 5 is **logic**; Units 6 and 7 are **metaphysics and epistemology**; Units 8 to 12 are **value theory** and what follows from it." },

      { type: "choice", kicker: "A harder case", skill: "Fields",
        prompt: "A student says: \"I want to be a doctor, so philosophy would be a waste of my time.\"<br><br>What's a fair reply?",
        options: [{ t: "A college major isn't always a job-specific program. Philosophy trains reasoning, questioning and writing, which a doctor needs too" },
                  { t: "She's right. Philosophy is useless", fb: "Reasoning, questioning and careful writing are useful in medicine, too." },
                  { t: "Doctors must major in philosophy", fb: "That goes too far. The point is that skills travel." }],
        answer: 0,
        hints: ["What do the four people in the reading show?"],
        why: "Many careers use **careful thinking**. Philosophy trains it directly." },

      { type: "explain", kicker: "Say it",
        prompt: "In your own words: which **field** of philosophy would you most like to explore, and what **question** would you ask in it?",
        model: "For example: \"Value theory, because I'm curious about fairness. My question: is it ever fair for some people to have more than others?\" Any field is fine, as long as the question is one that can't be settled just by looking something up." },

      concept(19, "Fields of philosophy", "Philosophy today has four fields: historical [[traditions]]; metaphysics and [[epistemology]]; science, [[logic]] and mathematics; and [[value]] theory.",
        { chips: ["cooking", "sport"],
          fb: { "cooking": "Cooking isn't one of the four fields.", "sport": "Sport isn't one of the four fields." } })
    ]
  };

  /* ============================================================ Lesson 20 · Project
     Do some philosophy: the whole toolkit on one question. A tagged "Project" lesson,
     like the last lesson of an Algebra unit, so it isn't counted in the book's numbering. */
  LESSONS[20] = {
    title: "Do some philosophy",
    tag: "Project",
    blurb: "You have a toolkit. Use all of it on one real question: is it ever right to break a promise?",
    mins: 16,
    steps: [
      { type: "slots", kicker: "The toolkit", skill: "Toolkit",
        prompt: "Before you start, match each **question** to the **tool** from this unit that answers it.",
        slots: [{ id: "ana", label: "Take the idea apart" }, { id: "arg", label: "Build an argument" }, { id: "coh", label: "Check coherence" },
                { id: "tho", label: "Run a thought experiment" }, { id: "pri", label: "Weigh the price" }, { id: "equ", label: "Reach equilibrium" }],
        cards: [{ t: "What does this idea really need to count?", slot: "ana", fb: "Conceptual analysis: parts and cases." },
                { t: "What are the reasons for my claim?", slot: "arg", fb: "An argument: premises and a conclusion." },
                { t: "Could all my beliefs be true together?", slot: "coh", fb: "Coherence." },
                { t: "Which detail of this case makes the difference?", slot: "tho", fb: "A thought experiment: change one detail." },
                { t: "What does this view cost me?", slot: "pri", fb: "Find the price, and decide: bite the bullet or revise." },
                { t: "Do my rule and my cases agree?", slot: "equ", fb: "Reflective equilibrium: back and forth." }],
        hints: ["Think back to which lesson each question came from."],
        why: "Six tools: **analysis**, **arguments**, **coherence**, **thought experiments**, **the price of a view**, and **equilibrium**. Now use them." },

      { type: "multi", kicker: "Take it apart", skill: "Toolkit",
        prompt: "Our question: **\"Is it ever right to break a promise?\"**<br><br>First, what is a **promise**? Pick the parts it needs.",
        options: [{ t: "Someone says they will do something", ok: true, fb: "Yes: a promise is a commitment in words." },
                  { t: "Someone else is relying on it", ok: true, fb: "Yes: a promise matters because others count on it." },
                  { t: "The person means to keep it when they say it", ok: true, fb: "Yes: a promise made with no intention to keep it is something else, a lie." },
                  { t: "It's made out loud with a handshake", ok: false, fb: "A promise can be written or texted. The handshake isn't what makes it a promise." }],
        hints: ["Think of what you lose if you remove each part."],
        why: "A promise: **words of commitment**, someone **relying** on them, and an **intention** to keep them." },

      { type: "argue", kicker: "Build an argument", skill: "Toolkit",
        prompt: "<p>Here is one answer. Take it apart.</p>" + quote("Sometimes it is right to break a promise. Some promises cannot be kept without causing serious harm. Preventing serious harm matters more than keeping a promise. Promises are often made over coffee."),
        items: [{ t: "Sometimes it is right to break a promise.", role: "claim", fb: "That's the claim." },
                { t: "Some promises cannot be kept without causing serious harm.", role: "reason", fb: "A reason." },
                { t: "Preventing serious harm matters more than keeping a promise.", role: "reason", fb: "The second reason." },
                { t: "Promises are often made over coffee.", role: "aside", fb: "That's a detail, not a reason." }],
        hints: ["Which sentence says what to accept? Which two give reasons?"],
        why: "Two reasons and a claim. The coffee isn't part of the argument." },

      { type: "coherence", kicker: "Check coherence", skill: "Toolkit",
        prompt: "Now check whether **someone's beliefs** fit. Fit as many as you can in the jar with no clash.",
        who: "Jay's beliefs",
        beliefs: ["Always keep your promises.", "It is right to help someone in serious danger.", "Sometimes helping someone in serious danger means breaking a promise.", "Promises are worth keeping."],
        clashes: [[0, 1, 2]], goal: 3,
        hints: ["Put all four in. Which three are marked?"],
        why: "Jay can't hold the first three together. To fix it, he has to change \"always\" (revise the rule) or give up that helping matters." },

      { type: "thought", kicker: "Run a thought experiment", skill: "Toolkit",
        prompt: "Test the rule on a case. Fill in all four boxes, and see **what** your verdict depends on.",
        tpl: "You promised to help a friend move on Saturday. That morning, {0}. The promise is {1}.",
        switches: [{ name: "That morning", a: "a neighbour is hurt and needs a lift to the hospital", b: "a film you've been wanting to see is on" },
                   { name: "The promise is", a: "a small favour", b: "a big one: your friend has no one else" }],
        ask: "Should you break the promise?", verdicts: ["Break it", "Keep it", "Not sure"],
        hints: ["Fill every box. Your own verdict is what counts."],
        why: "Many people's verdict depends on **what the other thing is**, not on how big the promise is." },

      { type: "choice", kicker: "Weigh the price", skill: "Toolkit",
        prompt: "A new rule: **\"Keep your promises, unless breaking one prevents serious harm.\"**<br><br>What is its **price**?",
        options: [{ t: "It needs a judgment about what counts as \"serious harm\", and people may disagree" },
                  { t: "It means promises never matter", fb: "It says the opposite: keep them, except in one kind of case." },
                  { t: "It has no price", fb: "Every view has one. This one needs a judgment call about \"serious\"." }],
        answer: 0,
        hints: ["What word in the rule is hard to pin down?"],
        why: "The price is **vagueness**: where does \"serious\" start? That's a real cost, and a reason to keep testing the rule on cases." },

      { type: "explain", kicker: "Take a position",
        prompt: "Write **your** answer to the question: \"Is it ever right to break a promise?\" Give a claim, **two reasons**, and one case that tested it.",
        model: "For example: \"Yes, sometimes. Keeping a promise matters because others rely on it, and a promise to meet someone shouldn't be broken for a film. But if keeping it meant leaving someone seriously hurt, I think helping matters more. The injured-neighbour case tested my rule and made me add the exception for serious harm.\"" },

      concept(20, "Doing philosophy", "To do philosophy, take the idea [[apart]], build an [[argument]], check [[coherence]], test it on [[cases]], and weigh the price.",
        { chips: ["win", "guess"],
          fb: { "win": "The aim isn't to win. It's to understand.", "guess": "Philosophers give reasons. They don't just guess." } })
    ]
  };

  /* ----------------------------------------------------- Practice · Lesson 1
     Kinds of question: settled by measuring, or by thinking. */
  var Q_LOOK = [
    "How far away is the Moon?", "How many bones does an adult human have?", "What is the capital of Kenya?",
    "How fast does light travel?", "In what year did the Berlin Wall fall?", "How tall is the Eiffel Tower?",
    "How many moons does Mars have?", "What is the boiling point of water at sea level?",
    "How many people live in Tokyo?", "How many days are in a leap year?"].map(function (q) { return [q, "Someone can look this up or measure it. Once they do, the question is closed."]; });
  var Q_THINK = [
    "Is it ever right to break a promise?", "What makes something fair?", "Could a machine ever really think?",
    "If every plank of a ship is replaced, is it still the same ship?", "What is the difference between knowing something and just believing it?",
    "Is beauty only in the eye of the beholder?", "Do we have free will?", "What makes a life go well?",
    "What does it mean to be the same person over time?", "Is it wrong to lie to protect someone?"].map(function (q) { return [q, "No ruler or lookup settles this. You have to reason about what the words mean and what matters."]; });

  SKILLS.push({ id: "phil1-questions", title: "Kinds of question", lesson: 1,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 2 || f === 4) {
        return sorter(R, ["Look it up or measure", "Think it through"], [Q_LOOK, Q_THINK], f === 2 ? 3 : 2,
          { prompt: "Some questions are settled by **measuring** or looking up. Others have to be **thought through**.<br><br>Sort these.",
            hints: ["Ask: could a ruler, a clock or a lab settle it?"],
            why: "Questions about numbers and facts can be looked up or measured. Questions about what something *is*, or what is *right*, have to be reasoned about." });
      }
      if (f === 1) {
        var look = R.pick(Q_LOOK), others = sample(R, Q_THINK, 2);
        return mcq(R, { prompt: "Which of these can be settled by **looking it up or measuring**?", right: look[0],
          wrong: others, hints: ["Look for the one with a number or a fact as its answer."],
          why: "“" + look[0] + "” has an answer someone can look up or measure." });
      }
      var think = R.pick(Q_THINK), looks = sample(R, Q_LOOK, 2);
      return mcq(R, { prompt: f === 3 ? "Which of these is a question a **philosopher** would be interested in?" : "Which of these has to be **thought through**, because measuring won't settle it?",
        right: think[0], wrong: looks,
        hints: ["Which one asks what something *is*, or what is *right*?"],
        why: "“" + think[0] + "” can't be settled with a ruler or a lookup. It asks about meaning or about what matters, which takes reasoning." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 2
     Sages: who is who, and what sages share. */
  var SAGES = [
    ["Gargi", "questioning the great sage Yajnavalkya about what holds the world together"],
    ["Maitreyi", "turning down her share of her husband's wealth and asking him to teach her about immortality instead"],
    ["Henry Odera Oruka", "interviewing sages in rural Kenya and publishing what they said"],
    ["Thales", "saying everything is made of water, and being said to have predicted an eclipse"],
    ["Solon", "cancelling debts and giving Athens a constitution, then stepping down"],
    ["Han Feizi", "writing that the sages were those who invented the basics of life, like nests and fire-making"],
    ["Yu", "saving the land from a great flood by digging canals"],
    ["The Seven Rishis", "being the seven sages said to have received the Vedas"]];
  var SAGE_TRAITS = ["They question tradition, are curious about the world, and use reason",
                     "They were all men who lived in Greece", "They all wrote books that survive", "They obeyed every tradition they were given"];

  SKILLS.push({ id: "phil1-sages", title: "Sages", lesson: 2,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 4) {
        return mcq(R, { prompt: "What do the early sages of India, China, Africa and Greece have in common?", right: SAGE_TRAITS[0],
          wrong: [[SAGE_TRAITS[1], "Sages came from India, China, Africa and Greece, and women like Gargi were among them."],
                  [SAGE_TRAITS[2], "Many sages never wrote anything down, like the Kenyan sages Oruka interviewed."],
                  [SAGE_TRAITS[3], "The opposite: sages asked *why* about tradition."]], n: 2,
          hints: ["What do they share in *how they thought*?"],
          why: "What unites sages is how they think: they question tradition, they are curious about nature and people, and they use reason." });
      }
      var s = pickBy(R, SAGES, i), rest = SAGES.filter(function (x) { return x !== s; });
      if (f % 2 === 0) {
        var ws = sample(R, rest, 2);
        return mcq(R, { prompt: "What is **" + s[0] + "** known for?", right: s[1],
          wrong: ws.map(function (w) { return [w[1], "That is what " + w[0] + " is known for."]; }),
          hints: ["Which sage asked questions? Which one made laws? Which one gathered sayings?"],
          why: s[0] + " is known for " + s[1] + "." });
      }
      var ns = sample(R, rest, 2);
      return mcq(R, { prompt: "Who is known for " + s[1] + "?", right: s[0],
        wrong: ns.map(function (w) { return [w[0], w[0] + " is known for " + w[1] + "."]; }),
        hints: ["Think back to the reading for each tradition."],
        why: s[0] + " is known for " + s[1] + "." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 3
     Natural philosophy: who thought what, and story versus mechanism. */
  var NAT = [
    ["Thales", "that everything is really water"],
    ["Xenophanes", "that a rainbow is a kind of cloud"],
    ["Parmenides", "that whatever really exists cannot change"],
    ["Democritus", "that everything is unchanging atoms moving in empty space"],
    ["Pythagoras", "that nature follows patterns we can count"]];
  var NAT_STORY = [
    ["Thunder is Zeus, throwing lightning because he is angry.", "That explains thunder by someone's feelings."],
    ["An eclipse happens when a dragon eats the sun.", "A creature wants to eat the sun: a story."],
    ["The goddess Iris stretches a rainbow across the sky to carry a message.", "Someone is sending a message: a story."],
    ["The wind blows because a god is sighing.", "A god's mood is the cause: a story."],
    ["Winter comes because a goddess is sad.", "Someone's sadness is the cause: a story."]];
  var NAT_MECH = [
    ["A rainbow is a kind of cloud, lit up by the sun.", "That puts the cause in the weather itself: a mechanism."],
    ["An eclipse happens when the moon passes between us and the sun.", "That says how things move: a mechanism."],
    ["The seasons change because Earth is tilted as it travels around the sun.", "That says how things are arranged and move: a mechanism."],
    ["Water freezes because the cold slows it until it locks into a solid.", "That says what is going on in the water: a mechanism."],
    ["Everything we see is tiny bits of matter in different arrangements.", "That says what lies underneath what we see: a mechanism."]];

  SKILLS.push({ id: "phil1-natural", title: "Natural philosophy", lesson: 3,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 3) {
        return sorter(R, ["A story about who wants what", "A mechanism: what is going on underneath"], [NAT_STORY, NAT_MECH], 2,
          { prompt: "A **story** explains by what someone wants. A **mechanism** explains by what is going on underneath.<br><br>Sort these.",
            hints: ["Ask: is the cause a *person's wish*, or something that happens in nature?"],
            why: "Stories explain by someone's wishes or moods. A mechanism puts the cause in nature, so it can be questioned, tested and improved." });
      }
      if (f === 4) {
        var m = R.pick(NAT_MECH), ss = sample(R, NAT_STORY, 2);
        return mcq(R, { prompt: "Which of these is a **mechanism** (a cause found in nature), not a story?", right: m[0], wrong: ss,
          hints: ["Which one doesn't depend on anyone's wishes or moods?"], why: m[1] });
      }
      var t = pickBy(R, NAT, i), rest = NAT.filter(function (x) { return x !== t; });
      if (f % 2 === 0) {
        return mcq(R, { prompt: "Who said " + t[1] + "?", right: t[0],
          wrong: sample(R, rest, 2).map(function (w) { return [w[0], w[0] + " said " + w[1] + "."]; }),
          hints: ["Water, clouds, logic, atoms, numbers: which thinker goes with each?"], why: t[0] + " said " + t[1] + "." });
      }
      return mcq(R, { prompt: "What is **" + t[0] + "** known for?", right: "…" + t[1],
        wrong: sample(R, rest, 2).map(function (w) { return ["…" + w[1], "That is " + w[0] + "'s idea."]; }),
        hints: ["Think about each thinker's big idea."], why: t[0] + " is known for the idea " + t[1] + "." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 4
     The whole picture: how it looks and feels, what science says, and the link. */
  var WHOLE = [
    ["The table is solid and brown.", "The table is made of atoms, with mostly empty space between and inside them.", "The atoms are held together so strongly that nothing passes through, and the surface reflects the light we call brown."],
    ["The sunset is red.", "The low sun's light passes through air, which scatters the blue light away.", "What reaches your eyes is the light that wasn't scattered: the red."],
    ["The spoon feels hot.", "The spoon's particles are moving fast.", "Fast particles pass their energy to your skin, which you feel as heat."],
    ["Sugar tastes sweet.", "Sugar molecules fit receptors on your tongue.", "The receptors send a signal to your brain, and that signal is the sweetness you taste."],
    ["The ice cube is cold.", "The ice cube's molecules are locked in a pattern and move slowly.", "Heat flows from your finger into the slow molecules, and that loss is the cold you feel."],
    ["The sky is blue.", "Air scatters short blue light more than red light, in every direction.", "The blue light scattered to your eyes from every direction is the colour you see."]];
  var KNOW_HOW = [["Riding a bike", "A skill you learn by doing."], ["Swimming", "A skill you learn by doing."], ["Telling when two ideas don't fit together", "The philosopher's skill: finding your way around ideas."],
                  ["Cooking an egg properly", "A skill you learn by doing."], ["Playing a melody by ear", "A skill, not a list of facts."]];
  var KNOW_THAT = [["Paris is the capital of France", "A fact you can state."], ["Water boils at 100 degrees Celsius at sea level", "A fact."], ["Whales are mammals", "A fact."],
                   ["Seven times eight is fifty-six", "A fact."], ["The Moon orbits the Earth", "A fact."]];

  SKILLS.push({ id: "phil1-whole", title: "The whole picture", lesson: 4,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 4) {
        return sorter(R, ["Know-how: a skill", "Know-that: a fact"], [KNOW_HOW, KNOW_THAT], 2,
          { prompt: "Sellars said philosophical skill is **know-how**, like riding a bike, not a pile of facts.<br><br>Sort these.",
            hints: ["Know-how is something you can *do*. Know-that is something you can *say is true*."],
            why: "Know-how is a skill you build by doing. Know-that is a fact you can state. Philosophy is mostly **know-how**." });
      }
      var w = pickBy(R, WHOLE, i), others = WHOLE.filter(function (x) { return x !== w; });
      if (f === 0) {
        return mcq(R, { prompt: "Here is one thing, described two ways. Which line is **how it looks and feels**?", right: w[0],
          wrong: [[w[1], "That is what science says is there, not how it looks and feels."]],
          hints: ["Which line could you tell just by looking, touching or tasting?"],
          why: "“" + w[0] + "” is how it looks and feels. “" + w[1] + "” is what science says." });
      }
      if (f === 1) {
        return mcq(R, { prompt: "“" + w[0] + "” How would **science** describe what's behind it?", right: w[1],
          wrong: sample(R, others, 2).map(function (o) { return [o[1], "That explains a different experience: “" + o[0] + "”"]; }),
          hints: ["Match the experience with the part of science that explains it."],
          why: w[1] });
      }
      if (f === 2) {
        return mcq(R, { prompt: "<p>How it looks and feels: “" + w[0].replace(/\.$/, "") + "”.</p><p>What science says: “" + w[1].replace(/\.$/, "") + "”.</p><p>Which sentence **links** the two?</p>", right: w[2],
          wrong: sample(R, others, 2).map(function (o) { return [o[2], "That links a different pair."]; }),
          hints: ["A link says *what in the science makes it look and feel that way*."],
          why: "A good link explains the experience using the science, and keeps both pictures." });
      }
      return mcq(R, { prompt: "<p>A friend says:</p>" + quote("Science tells us the truth: " + w[1] + " So \"" + w[0].replace(/\.$/, "") + "\" is just an illusion.") + "<p>What is the better reply?</p>",
        right: "Both pictures are true. The job is to see how they fit together",
        wrong: [["Yes, the experience is an illusion", "Then you'd have to explain why the experience is so reliable. Throwing one picture away leaves the puzzle unsolved."],
                ["No, science is wrong", "Science has strong evidence. Denying it throws the other picture away."]],
        hints: ["Remember the fourth move: *keep both*."],
        why: "When two pictures both seem true, philosophers look for the **link**, not for a winner." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 5
     Evidence (five sources) and intuition (clear and certain, or a hunch). */
  var SRC = ["History", "Intuition", "Common sense", "Experiments", "Other fields"];
  var SRC_DESC = ["what earlier thinkers argued", "a clear, certain insight", "a plain perception that no one sensibly doubts", "testing what people actually think", "what another field of study has found"];
  var EV = [
    ["Drawing on Locke's argument about how a government gets its authority", 0],
    ["Quoting Confucius to settle a question about duty", 0],
    ["Seeing at once that 2 + 2 = 4, and that it couldn't be false", 1],
    ["Seeing that whatever is good is better than whatever is bad", 1],
    ["Holding up a hand and saying \"Here is a hand\", with no further proof", 2],
    ["Pointing at the table in front of you as evidence that tables exist", 2],
    ["Asking hundreds of people whether someone with no choice is still to blame", 3],
    ["Running a survey to see what ordinary people think about a hard moral case", 3],
    ["Using what psychologists have found about memory in an argument about the self", 4],
    ["Using what biology says about evolution in an argument about human nature", 4]];

  SKILLS.push({ id: "phil1-evidence", title: "Evidence", lesson: 5,
    gen: function (R, i) {
      var f = i % 5, e = pickBy(R, EV, i), k = e[1];
      var others = [0, 1, 2, 3, 4].filter(function (x) { return x !== k; });
      if (f === 4) {
        return mcq(R, { prompt: "Which of these is found by **testing or measuring**, not by reading or thinking?", right: SRC[R.pick([3, 4])],
          wrong: sample(R, [0, 1, 2], 2).map(function (x) { return [SRC[x], SRC[x] + ": found by " + (x === 0 ? "reading what earlier thinkers wrote" : x === 1 ? "thinking, and seeing that it must be true" : "plain perception, like looking at your own hand") + "."]; }),
          hints: ["Two sources involve studies or instruments."],
          why: "**Experiments** and **other fields** involve testing and measuring. History, intuition and common sense don't." });
      }
      return mcq(R, { prompt: "Which source of evidence is this?<br><br>" + quote(e[0]), right: SRC[k],
        wrong: sample(R, others, 3).map(function (x) { return [SRC[x], "That would be " + SRC[x].toLowerCase() + ": " + SRC_DESC[x] + "."]; }),
        hints: ["Ask: is it an earlier thinker's argument, a clear insight, a plain perception, a test, or another field's results?"],
        why: "This is " + SRC[k].toLowerCase() + ": " + SRC_DESC[k] + "." });
    } });

  var INT_YES = [
    ["2 + 2 = 4", "You can check it in your head, and it couldn't be false."], ["A three-legged stool has three legs", "True in the very meaning of the words."],
    ["A triangle has three sides", "True in the very meaning of the word."], ["Whatever is good is better than whatever is bad", "People argue about *what* is good, but almost everyone sees that good beats bad."],
    ["Nothing can be both completely red and completely green all over at the same time", "It seems impossible for it to be false."]];
  var INT_NO = [
    ["My lucky number will win this week", "A hope. It could easily be false."], ["That new teacher seems untrustworthy", "A first impression. Often wrong."],
    ["Our team will win on Saturday", "A guess about the future."], ["It will rain tomorrow because my knee aches", "A hunch."],
    ["This line at the store will move faster", "A guess."]];

  SKILLS.push({ id: "phil1-intuition", title: "Intuition", lesson: 5,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 3 || f === 1) {
        return sorter(R, ["Clear and certain: an intuition", "A feeling or a hunch"], [INT_YES, INT_NO], f === 3 ? 3 : 2,
          { prompt: "To a philosopher, an **intuition** is clear and certain, not a hunch.<br><br>Sort these.",
            hints: ["Ask: could it possibly be false? If it seems impossible, it's an intuition."],
            why: "An intuition is **clear and certain**. A hunch is a feeling you could easily be wrong about." });
      }
      if (f === 0) {
        var y = R.pick(INT_YES), n = sample(R, INT_NO, 2);
        return mcq(R, { prompt: "Which of these is a philosopher's **intuition**?", right: y[0], wrong: n,
          hints: ["Which one could not possibly be false?"], why: y[1] });
      }
      var n1 = R.pick(INT_NO), ys = sample(R, INT_YES, 2);
      return mcq(R, { prompt: "Which of these is just a **hunch**?", right: n1[0], wrong: ys,
        hints: ["Which one could easily turn out false?"], why: n1[1] });
    } });

  /* ----------------------------------------------------- Practice · Lesson 6
     Arguments: claim, reasons, and what isn't part of an argument. */
  var ARGS = [
    { c: "The school should start later.", r: ["Teenagers need more sleep.", "Tired students learn less."], x: "The gym has a green floor." },
    { c: "Our town should plant more trees.", r: ["Trees clean the air.", "Shade keeps the streets cooler in summer."], x: "My cousin lives next to a park." },
    { c: "Everyone should learn first aid.", r: ["Accidents can happen anywhere.", "Quick help can save a life."], x: "The class meets on Tuesdays." },
    { c: "The library should buy more e-books.", r: ["Many students read on tablets.", "E-books never get lost or damaged."], x: "The library has a red door." },
    { c: "The club should meet outside when it's warm.", r: ["Fresh air helps people focus.", "The meeting room is crowded at lunch."], x: "The sun sets late in June." },
    { c: "We should carry a reusable water bottle.", r: ["It saves money over time.", "It cuts down on plastic waste."], x: "Mine is blue." },
    { c: "The city should add more bike lanes.", r: ["Cyclists are safer in their own lane.", "More people would ride instead of drive."], x: "There is a bakery on Main Street." },
    { c: "Students should read for fun every day.", r: ["Reading builds vocabulary.", "It helps you relax."], x: "The book fair is in March." }];
  var FWD = [
    ["All birds have feathers. A robin is a bird. So a robin has feathers.", "Two reasons lead forward to a new claim."],
    ["Every ticket gets you in. I have a ticket. So I can go in.", "Two reasons lead forward to a claim."],
    ["Anyone who practises improves. Dev practised. So Dev will improve.", "Reasons lead forward to a claim."],
    ["All metals expand when heated. This rod is metal. So this rod will expand if heated.", "Reasons lead forward to a claim."]];
  var BWD = [
    ["The grass is wet, so it must have rained.", "You start from something you saw and work back to its cause."],
    ["There's smoke over the hill, so something is burning.", "You start from the clue and reason back to what explains it."],
    ["I hear thunder, so lightning must have struck somewhere.", "A clue, then the cause that explains it."],
    ["The kitchen smells of toast, so someone has been making breakfast.", "You work back from what you noticed to what explains it."]];

  SKILLS.push({ id: "phil1-argument", title: "Arguments", lesson: 6,
    gen: function (R, i) {
      var f = i % 5, a = pickBy(R, ARGS, i);
      if (f === 4) {
        return sorter(R, ["Forward: from reasons to a claim", "Backward: from what I saw to its cause"], [FWD, BWD], 2,
          { prompt: "An **argument** runs forward from reasons to a claim. An **explanation** runs backward from what you saw to its cause.<br><br>Sort these.",
            hints: ["Does it start from something noticed and look for its cause?"],
            why: "Starting from an observation and looking for its cause runs **backward** (an explanation). Starting from reasons and reaching a claim runs **forward** (an argument)." });
      }
      if (f === 2) {
        var items = R.shuffle([{ t: a.c, role: "claim", fb: "This one says what to do or believe. It's the claim." },
                               { t: a.r[0], role: "reason", fb: "This supports the claim: a reason." },
                               { t: a.r[1], role: "reason", fb: "This also supports the claim: a reason." },
                               { t: a.x, role: "aside", fb: "That doesn't help support the claim. It isn't part of the argument." }]);
        return { type: "argue", prompt: "<p>Take this apart.</p>" + quote(items.map(function (x) { return x.t; }).join(" ")), items: items,
          hints: ["Find the claim first: the sentence that says what to do or believe."],
          why: "One claim (“" + a.c + "”), two reasons, and one sentence that isn't part of the argument." };
      }
      var withX = f === 1 || f === 3;
      var parts = R.shuffle([a.c, a.r[0], a.r[1]].concat(withX ? [a.x] : []));
      var passage = "<p>Read this:</p>" + quote(parts.join(" "));
      if (f === 0) {
        return mcq(R, { prompt: passage + "<p>Which sentence is the **claim**?</p>", right: a.c,
          wrong: [[a.r[0], "That's a reason. It supports the claim."], [a.r[1], "That's a reason. It supports the claim."]],
          hints: ["Which sentence says what we should do or believe?"], why: "The claim is what the reasons are for: “" + a.c + "”" });
      }
      if (f === 1) {
        var rr = R.pick(a.r);
        return mcq(R, { prompt: passage + "<p>Which sentence is a **reason** for the claim?</p>", right: rr,
          wrong: [[a.c, "That's the claim, not a reason for it."], [a.x, "That doesn't support the claim. It isn't part of the argument."]],
          hints: ["Which sentence helps explain *why* the claim should be accepted?"], why: "“" + rr + "” is a reason. It helps support the claim." });
      }
      return mcq(R, { prompt: passage + "<p>Which sentence is **not part** of the argument?</p>", right: a.x,
        wrong: [[a.c, "That's the claim. It's the point of the argument."], [R.pick(a.r), "That's a reason. It's part of the argument."]],
        hints: ["Which sentence doesn't help support the claim?"], why: "“" + a.x + "” has nothing to do with the claim, so it isn't part of the argument." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 7
     Coherence: can all of it be true at the same time? */
  var CLASH2 = [
    ["All swans are white.", "I saw a black swan."], ["Maya is older than Leo.", "Leo is older than Maya."],
    ["Everyone in the room is under 10.", "Someone in the room is 40."], ["The box is empty.", "There are three apples in the box."],
    ["The number is even.", "The number is 7."], ["The shop is closed all day Sunday.", "I bought bread there at noon last Sunday."],
    ["No one in the class is taller than Mia.", "Leo is in the class and taller than Mia."], ["Every student passed the test.", "One student failed the test."]];
  var FIT2 = [
    ["The store opens at nine.", "The store closes at five."], ["It's raining here now.", "It's sunny somewhere else now."],
    ["Maya is taller than Sam.", "Sam is taller than Leo."], ["The box has three apples.", "Two of the apples are green."],
    ["I like tea.", "My sister likes coffee."], ["Every student passed the test.", "The test was hard."],
    ["The number is 7.", "The number is odd."], ["All cats purr.", "Milo is a dog."]];
  var CLASH3 = [
    ["Every student in the class passed.", "Mia is in the class.", "Mia failed."],
    ["All the cats on the farm purr.", "Milo is a cat on the farm.", "Milo doesn't purr."],
    ["No one under 13 may join the club.", "Leo is 11.", "Leo may join the club."],
    ["Every ticket costs five dollars.", "This is a ticket.", "This ticket costs ten dollars."],
    ["Everyone who trains gets faster.", "Sam trained.", "Sam did not get faster."]];

  SKILLS.push({ id: "phil1-coherence", title: "Coherence", lesson: 7,
    gen: function (R, i) {
      var f = i % 5;
      function pairText(p) { return p[0] + " / " + p[1]; }
      if (f === 0) {
        var clash = R.chance(0.5), p = clash ? R.pick(CLASH2) : R.pick(FIT2);
        return { type: "choice", prompt: "<p>Could these both be true at the same time?</p>" + quote(p[0] + "<br>" + p[1]),
          options: clash ? [{ t: "No. They can't both be true" }, { t: "Yes, they could both be true", fb: "Try to picture a world where both hold. There isn't one." }]
                         : [{ t: "No. They can't both be true", fb: "Try picturing a world where both are true. There is one." }, { t: "Yes, they could both be true" }],
          answer: clash ? 0 : 1, keep: true, hints: ["Try to picture a world where both are true."],
          why: clash ? "No world makes both true, so they **contradict** each other." : "They fit together: nothing in one rules out the other." };
      }
      if (f === 1 || f === 3) {
        return sorter(R, ["Can't both be true", "Can both be true"], [CLASH2.map(function (x) { return [pairText(x), "They contradict: no world makes both true."]; }), FIT2.map(function (x) { return [pairText(x), "They fit together: both could be true."]; })], f === 1 ? 3 : 2,
          { prompt: "Sort these pairs of claims.", hints: ["For each pair, try to picture a world where both are true."],
            why: "If you can picture a world where both are true, they fit. If you can't, they contradict." });
      }
      var t = R.pick(CLASH3);
      if (f === 2) {
        return mcq(R, { prompt: "<p>Dev believes all three of these:</p>" + quote(t.join("<br>")) + "<p>What is true of them?</p>",
          right: "They can't all be true together, though any two of them could be",
          wrong: [["They are coherent, because no two of them clash", "A clash can hide in a group. Each pair fits, but all three together can't be true."],
                  ["All three are false", "Not necessarily. At least one is false, but we can't tell which from the clash alone."]],
          hints: ["Check each pair, then all three together."],
          why: "Any two of the beliefs fit, but all three can't be true at once. At least one must go." });
      }
      return mcq(R, { prompt: "<p>These three beliefs can't all be true together:</p>" + quote(t.join("<br>")) + "<p>Which could Dev give up to fix it?</p>",
        right: "Any one of them. Which one depends on which has the weakest reasons",
        wrong: [["Only the first one", "Giving up any one of the three would remove the clash. There's no rule that the first must go."],
                ["None of them. He must keep all three", "Then the clash stays, and at least one belief is false."]],
        hints: ["Take out one belief. Is the clash gone? Does it matter which?"],
        why: "Removing **any one** of the three ends the clash. Choose the one with the weakest reasons." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 8
     Analysis: testing a definition on a case, and listing parts. */
  var DEFS = [
    ["a bird", "an animal that can fly", "A penguin", 0, "A penguin is a bird that can't fly, so the definition leaves out something it should include."],
    ["a bird", "an animal with wings", "A bat", 1, "A bat has wings but isn't a bird, so the definition lets in something it shouldn't."],
    ["a chair", "something with four legs that you sit on", "An office chair with five legs", 0, "An office chair is a chair, but the definition rules it out."],
    ["a sandwich", "any food that has bread in it", "A slice of banana bread", 1, "Banana bread isn't a sandwich, but the definition lets it in."],
    ["a teacher", "someone who works at a school", "The school's cook", 1, "The cook works at a school but isn't a teacher, so the definition lets in too much."],
    ["a game", "something you play to win or lose", "Playing catch in the park", 0, "Catch has no winner, but it's still a game, so the definition leaves it out."],
    ["a fruit", "anything sweet and juicy", "A lemon", 0, "A lemon is a fruit, but it isn't sweet, so the definition leaves it out."],
    ["a month", "a period of exactly 30 days", "January, which has 31 days", 0, "January is a month, but the definition leaves it out."]];
  var PARTS = [
    ["a library", ["A collection of things to borrow", "A place to keep them", "A way to borrow and return them"], "A coffee shop"],
    ["a team", ["Players who work together", "A shared goal", "Rules they play by"], "A trophy"],
    ["a government", ["A body that makes laws", "A body that carries them out", "A way to settle disputes"], "A national flag"],
    ["a school", ["Students", "Teachers", "A way to learn together"], "A mascot"],
    ["a promise", ["Words that commit you", "Someone relying on them", "An intention to keep them"], "A handshake"]];

  SKILLS.push({ id: "phil1-analysis", title: "Analysis", lesson: 8,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 4) {
        return mcq(R, { prompt: "Why isn't a **dictionary** enough to analyse an idea?", right: "It only reports how a word is already used. It doesn't ask whether that use is clear and fits the hard cases",
          wrong: [["It is often wrong about the spelling", "Dictionaries are usually right about spelling. The problem is about *meaning* and *clarity*."],
                  ["It contains too many words", "The number of words isn't the issue. A dictionary stops at everyday use."]],
          hints: ["Think of the hot dog and the sandwich."],
          why: "Analysis tests whether a use of a word is clear and survives tricky cases. A dictionary only records the use." });
      }
      if (f === 3) {
        var pt = pickBy(R, PARTS, i);
        return mcq(R, { prompt: "Which of these is **not** one of the parts " + pt[0] + " needs?", right: pt[2],
          wrong: sample(R, pt[1], 2).map(function (x) { return [x, "That is one of the parts: " + pt[0] + " needs it."]; }),
          hints: ["Which one could be missing, and it would still be " + pt[0] + "?"],
          why: pt[2] + " is a nice extra, but " + pt[0] + " doesn't need it." });
      }
      var d = pickBy(R, DEFS, i);
      var mess = d[3] === 0 ? "Too narrow: it leaves out something it should include" : "Too broad: it lets in something it shouldn't";
      var other = d[3] === 0 ? "Too broad: it lets in something it shouldn't" : "Too narrow: it leaves out something it should include";
      return mcq(R, { prompt: "<p>Someone defines " + d[0] + " as:</p>" + quote(d[1].charAt(0).toUpperCase() + d[1].slice(1) + ".") + "<p>Test it on this case: **" + d[2].toLowerCase() + "**. What does the case show?</p>",
        right: mess,
        wrong: [[other, d[3] === 0 ? "The case is something the idea *should* include, so the definition is too narrow, not too broad." : "The case is something the idea *shouldn't* include, so the definition is too broad, not too narrow."],
                ["Nothing. The definition is perfect", "A good test case that disagrees with the definition shows it needs fixing."]],
        hints: ["Ask: is the case really " + d[0] + "? Does the definition say it is?"], why: d[4] });
    } });

  /* ----------------------------------------------------- Practice · Lesson 9
     Names, predicates and definite descriptions. */
  var SENT = [
    ["Maya plays the cello.", "Maya", "plays the cello"], ["The old oak tree shades the whole yard.", "The old oak tree", "shades the whole yard"],
    ["My brother forgot his keys.", "My brother", "forgot his keys"], ["Mount Everest is the tallest mountain on Earth.", "Mount Everest", "is the tallest mountain on Earth"],
    ["Our neighbour grows tomatoes.", "Our neighbour", "grows tomatoes"], ["The red kite is flying high above the beach.", "The red kite", "is flying high above the beach"],
    ["Priya won the science fair.", "Priya", "won the science fair"], ["The library closes at six.", "The library", "closes at six"]];
  var DESC_ONE = [
    ["The author of *Frankenstein*", "One person wrote it."], ["The tallest mountain on Earth", "Only one is tallest."],
    ["The first person to walk on the Moon", "Only one person was first."], ["The capital of France", "A country has one capital."],
    ["The only student who won the 2024 science fair", "It says *only*, so it fits one."], ["The planet closest to the Sun", "Only one planet is closest."]];
  var DESC_MANY = [
    ["A famous author", "Many authors are famous."], ["A tall mountain", "There are many tall mountains."],
    ["A person who has been to the beach", "That fits millions of people."], ["A big city in France", "France has several big cities."],
    ["A student who won a prize", "Many students win prizes."], ["A planet in our solar system", "There are eight."]];

  SKILLS.push({ id: "phil1-names", title: "Names and predicates", lesson: 9,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 3 || f === 4) {
        return sorter(R, ["Fits only one thing", "Fits many things"], [DESC_ONE, DESC_MANY], f === 3 ? 3 : 2,
          { prompt: "A **definite description** fits exactly one thing.<br><br>Which fit one thing, and which fit many?",
            hints: ["Could a second thing also fit the description?"],
            why: "Words like *the only*, *the first*, *the tallest* point to one thing. Words like *a*, or *many*, don't." });
      }
      var s = pickBy(R, SENT, i);
      if (f === 0) {
        var o = R.pick(SENT.filter(function (x) { return x !== s; }));
        return mcq(R, { prompt: "<p>Here is a sentence:</p>" + quote(s[0]) + "<p>What is it **about** (the name)?</p>", right: s[1],
          wrong: [[s[2], "That's what the sentence **says** about it: the predicate."], [o[1], "That's a different sentence's subject."]],
          hints: ["Who or what is being talked about?"], why: "The sentence is about " + s[1] + "; it says that " + s[1] + " " + s[2] + "." });
      }
      if (f === 1) {
        var o2 = R.pick(SENT.filter(function (x) { return x !== s; }));
        return mcq(R, { prompt: "<p>Here is a sentence:</p>" + quote(s[0]) + "<p>What is **said about** it (the predicate)?</p>", right: s[2],
          wrong: [[s[1], "That's the thing the sentence is *about*: the name."], [o2[2], "That's said about something else."]],
          hints: ["What does the sentence tell you?"], why: "It says of " + s[1] + " that " + s[2] + "." });
      }
      var one = R.pick(DESC_ONE), many = sample(R, DESC_MANY, 2);
      return mcq(R, { prompt: "Which is a **definite description** (it fits exactly one thing)?", right: one[0],
        wrong: many.map(function (m) { return [m[0], m[1]]; }),
        hints: ["Could a second thing also fit the description?"], why: "“" + one[0] + "”: " + one[1] });
    } });

  /* ----------------------------------------------------- Practice · Lesson 10
     Thought experiments: imagine a case, change one detail at a time. */
  var TE = [
    ["Always give back what you've borrowed.", "A friend lent you a bat and now asks for it back", "she says she'll use it to hurt someone"],
    ["Lying is always wrong.", "A friend asks if you like their gift, and you don't", "the friend is very ill and would be badly hurt by the truth"],
    ["Everyone should always obey the law.", "A sign says the park is closed after dark", "someone inside the park is calling for help"],
    ["Never break a promise.", "You promised to meet a friend at five", "on the way someone collapses and needs help"],
    ["Being fair means treating everyone exactly the same.", "A teacher gives every student the same homework", "one student has been in the hospital for a week"],
    ["It's always wrong to take what isn't yours.", "A hungry person takes bread from a shop", "the bread was about to be thrown away"]];
  var REDUCTIO = [
    ["Suppose there is a largest whole number. Add 1 to it and you get a bigger one, which is absurd. So there is no largest whole number."],
    ["Suppose a barber shaves everyone who does not shave himself. Does he shave himself? Either answer leads to a contradiction. So there can be no such barber."]];

  SKILLS.push({ id: "phil1-thought", title: "Thought experiments", lesson: 10,
    gen: function (R, i) {
      var f = i % 5, t = pickBy(R, TE, i);
      if (f === 0 || f === 1) {
        return mcq(R, { prompt: "<p>You want to test this idea with a thought experiment:</p>" + quote(t[0]) + "<p>Which is the **better** test?</p>",
          right: "Imagine this: " + t[1] + ". Then change **one** detail: " + t[2] + ".",
          wrong: [["Imagine this: " + t[1] + ". Then change the people, the place, the time and the rules all at once", "Then you couldn't tell which change made the difference. Change one detail."],
                  ["Ask ten people whether they like the idea", "That tests how popular the idea is, not whether it holds up in a hard case."]],
          hints: ["A good test makes one change at a time."],
          why: "Change **one** detail, so you can tell which detail does the work." });
      }
      if (f === 2) {
        var n = R.int(3, 6);
        return mcq(R, { prompt: "<p>Sam tested a rule by changing " + ["three", "three", "three", "three", "four", "five", "six"][n] + " details of a case at once, and the verdict changed.</p><p>What can Sam conclude?</p>",
          right: "Nothing yet about which detail mattered. Any of them might have",
          wrong: [["That the first detail mattered", "Any of the changed details could have done it. Sam can't tell which."],
                  ["That the rule is perfect", "A changed verdict doesn't make a rule perfect. It might mean the rule needs work."]],
          hints: ["Could a different detail have changed the verdict?"],
          why: "When several details change together, you can't tell which one did the work. Change one at a time." });
      }
      if (f === 3) {
        var r = pickBy(R, REDUCTIO, i);
        return mcq(R, { prompt: "<p>Read this reasoning:</p>" + quote(r[0]) + "<p>How does it work?</p>",
          right: "It supposes the idea is true, then shows that something absurd follows, so the idea can't be true",
          wrong: [["It measures the idea with an instrument", "Nothing is measured. It's all reasoning."],
                  ["It surveys what most people think", "That would be an experiment on opinions. This is reasoning about the idea itself."]],
          hints: ["What happens right after *Suppose*?"],
          why: "Suppose the idea is true. If something absurd follows, the idea can't be true." });
      }
      return mcq(R, { prompt: "What is a **thought experiment**?", right: "An imagined case that tests an idea by isolating one detail at a time",
        wrong: [["A laboratory test done with very small objects", "Thought experiments need no lab. They happen in the imagination."],
                ["A guess about what will happen tomorrow", "It isn't a guess about the future. It tests an idea on a made-up case."]],
        hints: ["It happens in the mind, with a made-up case."],
        why: "A thought experiment is an imagined case that isolates features of an idea to test it." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 11
     Trade-offs: every view has a price. Bite the bullet, revise, or dodge. */
  var VIEWS = [
    ["Everything that happens is fixed by earlier events.", "free will would look like an illusion"],
    ["The right thing is whatever makes the most people happy.", "it might allow harming one person to help many"],
    ["Lying is always wrong.", "you could never lie, even to protect a friend from harm"],
    ["Right and wrong are whatever the law says.", "even a cruel law would count as right"],
    ["Everyone must always be treated exactly alike.", "you couldn't give extra help to someone who needs more"]];
  var BITE = [["\"Yes, that follows, and I accept it.\"", "That accepts the price."],
              ["\"It follows, but the view is right for other reasons, so I accept the cost.\"", "That accepts the price, with a reason."],
              ["\"That's the cost of my view, and I'm willing to pay it.\"", "That accepts the price."],
              ["\"Yes, I do think that, even though it sounds hard.\"", "That accepts the result."]];
  var REVISE = [["\"That's too awful. I'll change the view so it doesn't say that.\"", "That revises the view."],
                ["\"I'll give up the view. The price is too high.\"", "That drops the view, which is an honest answer."],
                ["\"I'll add a limit, so the view doesn't give that result.\"", "That revises the view."],
                ["\"You've convinced me. I'll look for a better view.\"", "That drops the view."]];
  var DODGE = [["\"That's not what my view says.\" (with no reason)", "The result does follow. Denying it with no reason is a dodge."],
               ["\"Let's change the subject.\"", "That avoids the price instead of facing it."],
               ["\"Nobody would ever really think of that.\"", "A rare case is still a case. That's a dodge."],
               ["\"I don't want to talk about it.\"", "That avoids the price."]];

  SKILLS.push({ id: "phil1-price", title: "Trade-offs", lesson: 11,
    gen: function (R, i) {
      var f = i % 5, v = pickBy(R, VIEWS, i), others = VIEWS.filter(function (x) { return x !== v; });
      if (f === 0 || f === 1) {
        return mcq(R, { prompt: "<p>Here is a view:</p>" + quote(v[0]) + "<p>What is its **price**?</p>", right: v[1].charAt(0).toUpperCase() + v[1].slice(1),
          wrong: sample(R, others, 2).map(function (o) { return [o[1].charAt(0).toUpperCase() + o[1].slice(1), "That is the price of a different view: “" + o[0].replace(/\.$/, "") + "”."]; }),
          hints: ["What follows from the view that sounds bad?"], why: "If you accept the view, then " + v[1] + ". That's what it costs." });
      }
      if (f === 2 || f === 4) {
        return sorter(R, ["Bite the bullet", "Revise or drop the view", "Dodge (not honest)"], [BITE, REVISE, DODGE], f === 2 ? 2 : 1,
          { prompt: "A view has a costly result. Sort what people might **say next**.", hints: ["Does the person face the result, and what do they do about it?"],
            why: "Honest answers: **accept** the price, or **revise or drop** the view. A dodge pretends the price isn't there." });
      }
      return mcq(R, { prompt: "<p>Someone says:</p>" + quote("Yes, that follows: " + v[1] + ". I accept that, because the view is right for other reasons.") + "<p>What is this called?</p>",
        right: "Biting the bullet: accepting the price",
        wrong: [["Dodging: avoiding the price", "They are facing the price, not avoiding it."], ["Revising the view: changing it", "They aren't changing the view. They accept it as it is."]],
        hints: ["Do they accept the result, change the view, or avoid it?"],
        why: "Accepting a view's costly result, for good reasons, is **biting the bullet**." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 12
     Reflective equilibrium: adjusting rules and judgments against each other. */
  var EQ_MOVES = [
    [["\"The rule failed in a clear case, so I added an exception.\"", "That changes the rule."],
     ["\"I replaced the rule with a different one that fits all my cases.\"", "A new rule is a change to the rule."],
     ["\"The rule gave the wrong answer here, so I narrowed it.\"", "That changes the rule."],
     ["\"I rewrote the rule to cover the hard case.\"", "That changes the rule."]],
    [["\"The rule is strongly supported, so I'll rethink my first reaction to this one case.\"", "That changes a judgment, for a reason."],
     ["\"On reflection, I was wrong about that case. The rule is right.\"", "That changes a judgment."],
     ["\"I changed my mind about the case once I saw the reasons behind the rule.\"", "That changes a judgment, for a reason."]],
    [["\"The rule disagrees with this case. Oh well.\"", "Leaving a disagreement alone isn't adjusting."],
     ["\"I'll just ignore the case.\"", "Ignoring a case isn't adjusting."],
     ["\"A rule is a rule, whatever the cases say.\"", "That refuses to adjust."]]];
  var EQ_SCEN = [
    ["Always keep your promises.", "keeping a promise would mean leaving someone who is badly hurt"],
    ["Always tell the truth.", "telling the truth would help a dangerous person find someone who is hiding"],
    ["Share the credit for a group project equally.", "one student did nearly all the work"],
    ["Everyone gets the same punishment for the same rule.", "one student broke the rule by accident, and one did it on purpose"],
    ["Never take anything that isn't yours.", "a starving person takes bread that was about to be thrown away"]];

  SKILLS.push({ id: "phil1-equilibrium", title: "Equilibrium", lesson: 12,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 1 || f === 3) {
        return sorter(R, ["Changed the rule", "Changed a judgment", "Didn't really adjust"], EQ_MOVES, f === 1 ? 2 : 1,
          { prompt: "Which **move** was made?", hints: ["What was changed: the rule or a judgment? Or was nothing changed?"],
            why: "Equilibrium needs a real **change**, to the rule or to a judgment, with a reason." });
      }
      if (f === 2) {
        return mcq(R, { prompt: "A student says: \"First settle the theory, and only then apply it to cases.\" What does reflective equilibrium say?",
          right: "It goes both ways: cases can change the theory, and the theory can change how we see cases",
          wrong: [["Theory always comes first", "That would make cases useless for testing the theory."], ["Cases decide everything", "A well-supported theory can also correct a first reaction to a case."]],
          hints: ["Think about the phone-rule activity."],
          why: "Reflective equilibrium adjusts theory and cases **against each other**." });
      }
      var s = pickBy(R, EQ_SCEN, i);
      return mcq(R, { prompt: "<p>Your rule:</p>" + quote(s[0]) + "<p>But in one very clear case, " + s[1] + ". What is the best move?</p>",
        right: "Adjust the rule to fit the case, then test the new rule on your other cases",
        wrong: [["Ignore the case. The rule is the rule", "A clear case that disagrees tells you something about the rule."],
                ["Throw out the rule and all your other judgments", "That's far too much. Usually one change fixes it, and your other cases tell you if it's the right one."]],
        hints: ["Fix the rule, then check it against everything else."],
        why: "Adjust, then **test again**. The other cases tell you whether the adjustment was right." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 13
     Socrates: how we know him, and his trial. */
  var SOC = [
    ["Which writer made Socrates a comic character in a play?", "Aristophanes", [["Xenophon", "Xenophon was a soldier and historian who wrote an account of him."], ["Plato", "Plato was his student, and he wrote dialogues, not comedies."]]],
    ["Which writer was Socrates's student and friend, and wrote dialogues with Socrates as the main speaker?", "Plato", [["Aristophanes", "Aristophanes was a comic playwright."], ["Xenophon", "Xenophon was a soldier and historian."]]],
    ["Which writer was a soldier and historian who wrote the *Memorabilia* about Socrates?", "Xenophon", [["Plato", "Plato wrote dialogues."], ["Aristophanes", "Aristophanes wrote comedies."]]],
    ["In which of Plato's works does Socrates refuse a friend's offer to escape from prison?", "The Crito", [["The Apology", "The Apology is his defence speech at the trial."], ["The Phaedo", "The Phaedo is his last conversation, about the soul."]]],
    ["Which of Plato's works records Socrates's speech in his own defence?", "The Apology", [["The Crito", "The Crito is about his refusing to escape."], ["The Phaedo", "The Phaedo is his last conversation."]]],
    ["Which of Plato's works records Socrates's last conversation, about the soul?", "The Phaedo", [["The Apology", "The Apology is his trial speech."], ["The Crito", "The Crito is about escaping from prison."]]],
    ["In what year was Socrates put to death?", "399 BCE", [["469 BCE", "That's about when he was *born*."], ["323 BCE", "That's the year Alexander the Great died."]]],
    ["About how many Athenian citizens judged Socrates?", "About 500", [["12", "That's the size of a modern jury, not the Athenian one."], ["About 5,000", "Far too many. It was about 500."]]],
    ["What was one of the charges against Socrates?", "Corrupting the young", [["Stealing from the city's treasury", "He wasn't accused of stealing."], ["Plotting a war", "He wasn't accused of that."]]],
    ["Why must we be careful using Plato as a source on Socrates?", "He admired Socrates and chose what to include, so some ideas may be his own", [["Because he never met Socrates", "He knew Socrates well."], ["Because he wrote in a language no one reads", "Greek is read by many people."]]],
    ["How do we know what Socrates thought?", "From other people who knew him and wrote about him", [["From books Socrates wrote", "Socrates wrote nothing."], ["From his diary", "He kept no diary."]]]];

  SKILLS.push({ id: "phil1-socrates", title: "Socrates", lesson: 13,
    gen: function (R, i) {
      var q = pickBy(R, SOC, i);
      return mcq(R, { prompt: q[0], right: q[1], wrong: q[2], hints: ["Think back to the readings about Socrates."], why: q[1] + "." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 14
     Limits of knowledge: what Socrates found, and why it was wise. */
  var LIM = [
    ["What did Socrates find when he tested the **politicians**?", "They thought they were wise, but weren't", [["They really were wise", "He found the opposite."], ["They refused to talk to him", "They talked, and grew angry at what he showed."]]],
    ["What did Socrates find when he tested the **poets**?", "They wrote beautiful things but could not explain them", [["They knew more than he did about everything", "They couldn't even explain their own poems."], ["They wrote nothing at all", "They did write, and beautifully."]]],
    ["What did Socrates find when he tested the **craftspeople**?", "They really knew their crafts, but thought that made them wise about everything", [["They knew nothing about their crafts", "They knew their crafts very well."], ["They were wiser than the oracle", "They overrated what their skill showed."]]],
    ["What made Socrates \"the wisest\"?", "He knew he did not know the most important things, and did not pretend to", [["He knew more facts than anyone", "He claimed to know very little."], ["He could win any argument", "That wasn't the point."]]],
    ["What did the oracle at Delphi say about Socrates?", "That no one was wiser", [["That he was the most powerful man in Athens", "It said nothing about power."], ["That he should leave Athens", "It said nothing like that."]]],
    ["Why is it dangerous to claim knowledge you **don't** have?", "You stop looking, and you won't listen to evidence against you", [["It makes you tired", "That isn't the danger."], ["It makes other people dislike facts", "The danger is to your own learning, and to others who trust you."]]],
    ["A friend says they're 100% sure a rope bridge is safe, but they've never studied bridges. What would Socrates ask?", "\"How do you know? What would you need to know to be sure?\"", [["\"Can I go first?\"", "That puts someone at risk to avoid a simple question."], ["\"Who built it?\" and nothing else", "He'd ask the friend about their *own* knowledge."]]]];

  SKILLS.push({ id: "phil1-limits", title: "Limits of knowledge", lesson: 14,
    gen: function (R, i) {
      var q = pickBy(R, LIM, i);
      return mcq(R, { prompt: q[0], right: q[1], wrong: q[2], hints: ["Think of the oracle story and Socrates's search."], why: q[1] + "." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 15
     The Socratic method: asking, testing, showing, revising. */
  var SOC_YES = [["\"What do you mean by that?\"", "It asks what the person means."], ["\"Can you think of a case where that wouldn't be true?\"", "It tests the idea on a case."],
                 ["\"How do you know that?\"", "It asks for reasons."], ["\"What follows if that is true?\"", "It helps the person follow their own idea."],
                 ["\"Does that fit with what you said earlier?\"", "It helps the person check their own beliefs against each other."]];
  var SOC_NO = [["\"You're wrong.\"", "A verdict, not a question."], ["\"Everyone knows that.\"", "It closes the conversation instead of examining it."],
                ["\"Here is the right answer: write it down.\"", "That hands over the answer."], ["\"Gotcha! You contradicted yourself!\"", "A trap. Socrates wants the other person to *see* the problem."],
                ["\"That's a silly thing to say.\"", "An insult, not a question."]];
  var MOVES = [["Ask", "Ask what they mean. Don't tell."], ["Test", "Try their idea on a case."], ["Show", "Let them see the clash for themselves."], ["Revise", "Help them fix their idea."]];

  SKILLS.push({ id: "phil1-method", title: "Socratic method", lesson: 15,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 1 || f === 3) {
        return sorter(R, ["Socratic: it asks", "Not Socratic: it tells or traps"], [SOC_YES, SOC_NO], f === 1 ? 3 : 2,
          { prompt: "Which of these is a **Socratic** thing to say?", hints: ["Socratic things *ask*. Others tell or trap."],
            why: "A Socratic question asks what you mean, tests an idea on a case, or asks for reasons. It doesn't hand over a verdict." });
      }
      if (f === 2) {
        return mcq(R, { prompt: "Socrates compared himself to a **midwife**. What does that mean?", right: "He helps others bring their own ideas to light; he doesn't give them ideas",
          wrong: [["He thought ideas came from the gods only", "The point is that people bring forth their own ideas."], ["He cared for sick people", "It's a comparison with how a midwife *helps*, not an actual job."]],
          hints: ["A midwife helps a baby be born. She doesn't make the baby."],
          why: "A midwife helps; she doesn't make the baby. Socrates helps people give birth to **their own** ideas." });
      }
      var m = R.pick(MOVES), others = MOVES.filter(function (x) { return x !== m; });
      if (f === 0) {
        return mcq(R, { prompt: "In a Socratic conversation, which move is this?<br><br>" + quote(m[1]), right: m[0],
          wrong: sample(R, others, 2).map(function (o) { return [o[0], "That move is: " + o[1]]; }),
          hints: ["Ask, test, show, revise."], why: "“" + m[1] + "” is the **" + m[0] + "** move." });
      }
      var y = R.pick(SOC_YES), n = sample(R, SOC_NO, 2);
      return mcq(R, { prompt: "Which reply is the most **Socratic**?", right: y[0], wrong: n,
        hints: ["Which one asks, and doesn't tell?"], why: y[1] });
    } });

  /* ----------------------------------------------------- Practice · Lesson 16
     The examined life: testing a belief with reasons and fit. */
  var EXA_YES = [["\"I believe it, I know my reasons, and I've checked that it fits with my other beliefs.\"", "That's all four moves."],
                 ["\"I used to think so, but when I tried it on a case I changed my mind.\"", "It was tested, and revised."],
                 ["\"I asked myself why I believe it, and I found a good reason.\"", "It has a reason that was tested."],
                 ["\"I found that it clashed with another belief, so I fixed one of them.\"", "That's checking the fit, and revising."]];
  var EXA_NO = [["\"I've always believed it, so I never think about it.\"", "Never looked at it."], ["\"Everyone around me believes it, so I do.\"", "Borrowed from others without a test."],
                ["\"I don't know why I believe it, but I do.\"", "No reasons, so there is nothing to examine."], ["\"It feels right, and that's enough for me.\"", "A feeling isn't a reason that has been tested."]];
  var EXA_REASON = [["Working hard gets important things done", "Everyone says so"], ["Exercise keeps you healthy", "It makes me feel busy"],
                    ["Being honest lets people trust you", "My friends do it"], ["Sleep helps you think clearly", "It's what we've always done"]];

  SKILLS.push({ id: "phil1-examined", title: "The examined life", lesson: 16,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 1 || f === 3) {
        return sorter(R, ["Examined", "Unexamined"], [EXA_YES, EXA_NO], f === 1 ? 3 : 2,
          { prompt: "Which sound **examined**, and which **unexamined**?", hints: ["Has the belief been tested by reasons and by fit?"],
            why: "An examined belief has **reasons** and **fits** with the rest. An unexamined one was just picked up." });
      }
      if (f === 2) {
        var r = R.pick(EXA_REASON);
        return mcq(R, { prompt: "Examining a belief means asking for **reasons**. Which of these is a real reason, and not just a feeling or what others do?", right: r[0],
          wrong: [[r[1], "That's what people say or feel, not a reason that the belief is *right*."]],
          hints: ["A reason is something you could check."], why: "“" + r[0] + "” is a reason you could check. The other isn't." });
      }
      if (f === 4) {
        return mcq(R, { prompt: "You find that one of your beliefs clashes with another. What does an examined life do?", right: "Looks at the reasons for each, and revises or drops the weaker one",
          wrong: [["Keeps both and stops thinking about it", "That leaves a clash in place, so at least one belief is false."], ["Drops whichever one is newer", "Newer isn't weaker. Compare the *reasons*."]],
          hints: ["Remember the four moves: the last one is *revise*."], why: "A clash is a sign that something needs to change. Look at the reasons and give up the weaker one." });
      }
      return mcq(R, { prompt: "The four moves of examining a belief are: state it, ask why, check the fit, and ___.", right: "Revise: keep it, change it, or drop it",
        wrong: [["Repeat it louder", "Examining isn't repeating."], ["Hide it", "Examining means facing it."]],
        hints: ["What do you do if the belief clashes or has no reason?"], why: "After checking, **revise**: keep it, change it, or drop it." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 17
     Socrates's harm principle: his two claims, and his replies. */
  var HARM = [
    ["No one willingly chooses what is harmful to themselves.", 0],
    ["People who do harm do it because they are mistaken about what is good.", 0],
    ["Everyone wants what is good, or what seems good to them.", 0],
    ["When a person does harm to others, they actually harm themselves.", 1],
    ["Doing harm to others corrupts your own character.", 1],
    ["The worst harm anyone can suffer is a corrupted character.", 1]];

  SKILLS.push({ id: "phil1-harm", title: "Harm principle", lesson: 17,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 3) {
        return sorter(R, ["About what people choose (Claim 1)", "About what harm does to the harmer (Claim 2)"],
          [HARM.filter(function (h) { return h[1] === 0; }).map(function (h) { return [h[0], "That's about choosing, so it belongs to Claim 1."]; }),
           HARM.filter(function (h) { return h[1] === 1; }).map(function (h) { return [h[0], "That's about what harm does to the harmer, so it belongs to Claim 2."]; })], 2,
          { prompt: "Socrates made two claims about harm. Which does each sentence belong with?", hints: ["Claim 1 is about *choosing* harm. Claim 2 is about what harm *does to you*."],
            why: "**Claim 1**: no one willingly chooses what harms them (people are mistaken about what is good). **Claim 2**: doing harm to others harms the doer's character." });
      }
      if (f === 2) {
        return mcq(R, { prompt: "<p>An objection:</p>" + quote("A bully hurts people just for fun, and he knows it's wrong.") + "<p>How might Socrates reply?</p>",
          right: "Even the bully is after something that seems good to him, like fun or power. His mistake is about what is really good",
          wrong: [["He'd agree that some people want evil for its own sake", "That would give up his claim."], ["He'd say bullies don't exist", "Socrates wasn't naive. He'd say the bully is real and mistaken."]],
          hints: ["Remember: whatever we choose seems good to us."],
          why: "For Socrates, what the bully wants *seems good to him*. The mistake is **ignorance** of what is really good." });
      }
      var h = pickBy(R, HARM, i), a = h[1] === 0 ? ["Claim 1", "Claim 2"] : ["Claim 2", "Claim 1"];
      return mcq(R, { prompt: "<p>Which of Socrates's claims is this?</p>" + quote(h[0]), right: a[0] + (h[1] === 0 ? ": about what people choose" : ": about what harm does to the harmer"),
        wrong: [[a[1] + (h[1] === 0 ? ": about what harm does to the harmer" : ": about what people choose"), "That claim is about something else."]],
        hints: ["Claim 1: choosing. Claim 2: what harm does to you."],
        why: "That sentence belongs with " + a[0] + "." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 18
     Ahimsa and Socrates. */
  var AH_SOC = [["The worst harm is to your character", "That's Socrates."], ["No one chooses what they think is bad for themselves", "That's Socrates's first claim."], ["Doing harm corrupts your own character", "That's Socrates."]];
  var AH_BOTH = [["Harming others harms you", "Both say this."], ["Harm and ignorance are linked", "Both link them, in different ways."], ["Doing harm is bad for the one who does it, not only for the victim", "Both say this."]];
  var AH_IND = [["Harm leads to karma carried across lifetimes", "That's the Indian view."], ["All beings are connected, like one family", "That's part of the Indian view."],
                ["Also calls for love and compassion for all beings", "That's ahimsa."], ["Jain monks and nuns take great care not to harm any living creature", "That's ahimsa in practice."]];

  SKILLS.push({ id: "phil1-ahimsa", title: "Ahimsa", lesson: 18,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 0 || f === 2 || f === 4) {
        return sorter(R, ["Socrates", "Both", "Ahimsa"], [AH_SOC, AH_BOTH, AH_IND], f === 0 ? 2 : 1,
          { prompt: "Which view says each of these?", hints: ["*Karma* and *rebirth* point to ahimsa. *Character* points to Socrates."],
            why: "They agree that harm comes back to the doer, and both link harm with ignorance. They differ on **why** it comes back." });
      }
      if (f === 1) {
        return mcq(R, { prompt: "What does **ahimsa** mean?", right: "Not doing harm or injury, and practising compassion",
          wrong: [["Winning arguments", "That isn't it. Ahimsa is about harm."], ["Obeying the oldest teacher", "It isn't about teachers. It's about not harming."]],
          hints: ["The *a-* at the front means “not”."], why: "Ahimsa means **the absence of doing harm**, and in practice includes love and compassion for all beings." });
      }
      return mcq(R, { prompt: "Socrates and ahimsa both say harming others harms you. How do they **explain** it?", right: "Socrates says it corrupts your character. Ahimsa says it creates karma that binds you to suffering",
        wrong: [["Socrates says it brings bad luck. Ahimsa says it corrupts your character", "That swaps them. Socrates is the one who says character."], ["They don't explain it at all", "Both give a reason, and the reasons differ."]],
        hints: ["Which one talks about karma?"], why: "Same conclusion, different mechanism: **character** (Socrates) versus **karma** (ahimsa)." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 19
     Fields of philosophy. */
  var FIELDS = ["Historical traditions", "Metaphysics and epistemology", "Science, logic and mathematics", "Value theory"];
  var FQ = [
    ["Did thinkers in India and China ask the same questions as the Greeks?", 0], ["How did philosophy grow in Africa and in Latin America?", 0],
    ["Is a person the same person over time?", 1], ["How could you know you're not dreaming right now?", 1], ["What is knowledge, and how is it different from belief?", 1],
    ["What makes an argument good?", 2], ["What counts as a scientific explanation?", 2], ["What are numbers?", 2],
    ["Is it wrong to lie?", 3], ["Is beauty only in the eye of the beholder?", 3], ["What gives a government the right to rule?", 3], ["What makes a life go well?", 3]];

  SKILLS.push({ id: "phil1-fields", title: "Fields", lesson: 19,
    gen: function (R, i) {
      var f = i % 5;
      if (f === 4) {
        return sorter(R, FIELDS, FIELDS.map(function (_, k) { return FQ.filter(function (q) { return q[1] === k; }).map(function (q) { return [q[0], "That belongs to " + FIELDS[k] + "."]; }); }), 1,
          { prompt: "Which **field** does each question belong to?", hints: ["*Real* or *know*: metaphysics and epistemology. *Right*, *good*, *beautiful*: value theory."],
            why: "Real and known: **metaphysics and epistemology**. Good, right, beautiful, just: **value theory**. Reasoning and explanation: **science and logic**. How it all grew: **historical traditions**." });
      }
      var q = pickBy(R, FQ, i);
      return mcq(R, { prompt: "<p>Which field of philosophy does this question belong to?</p>" + quote(q[0]), right: FIELDS[q[1]],
        wrong: sample(R, [0, 1, 2, 3].filter(function (k) { return k !== q[1]; }), 2).map(function (k) { return [FIELDS[k], "That field is about something else."]; }),
        hints: ["Is the question about what's real, what we know, how to reason, how philosophy grew, or what's good and right?"],
        why: "That question belongs to **" + FIELDS[q[1]] + "**." });
    } });

  /* ----------------------------------------------------- Practice · Lesson 20
     The toolkit: which tool answers which question. */
  var TOOLS = ["Take the idea apart", "Build an argument", "Check coherence", "Run a thought experiment", "Weigh the price", "Reach equilibrium"];
  var TQ = [
    ["What does this idea really need in order to count as itself?", 0], ["Is a hot dog a sandwich?", 0],
    ["What are my reasons for this claim?", 1], ["Which sentence is the claim, and which are the reasons?", 1],
    ["Could all these beliefs be true together?", 2], ["Do two of my beliefs contradict each other?", 2],
    ["Which detail of this case makes the difference to my verdict?", 3], ["What happens if I change just one thing in this case?", 3],
    ["What does this view cost me if I accept it?", 4], ["Should I bite the bullet, or revise the view?", 4],
    ["Do my rule and my judgments about cases agree?", 5], ["The rule disagrees with a clear case. What do I adjust?", 5]];

  SKILLS.push({ id: "phil1-toolkit", title: "Toolkit", lesson: 20,
    gen: function (R, i) {
      var q = pickBy(R, TQ, i);
      return mcq(R, { prompt: "<p>Which tool from this unit answers this question?</p>" + quote(q[0]), right: TOOLS[q[1]],
        wrong: sample(R, [0, 1, 2, 3, 4, 5].filter(function (k) { return k !== q[1]; }), 3).map(function (k) { return [TOOLS[k], "That tool is for a different question."]; }),
        hints: ["Is it about meaning, reasons, clashes, a case, a cost, or a back-and-forth?"],
        why: "The tool for that question: **" + TOOLS[q[1]] + "**." });
    } });

L.unit("phil", 1, {
    title: "Introduction to philosophy",
    lessons: LESSONS.slice(1),
    quizzes: [
      { title: "Quiz 1", after: 4, blurb: "Kinds of question, the world's early sages, natural philosophy, and how things hang together.", skills: ["phil1-questions", "phil1-sages", "phil1-natural", "phil1-whole"], per: 2 },
      { title: "Quiz 2", after: 7, blurb: "Sources of evidence, intuition, arguments, and whether a set of beliefs can all be true.", skills: ["phil1-evidence", "phil1-intuition", "phil1-argument", "phil1-coherence"], per: 2 },
      { title: "Quiz 3", after: 12, blurb: "Analysis, names and descriptions, thought experiments, the price of a view, and equilibrium.", skills: ["phil1-analysis", "phil1-names", "phil1-thought", "phil1-price", "phil1-equilibrium"], per: 2 },
      { title: "Quiz 4", after: 16, blurb: "Socrates: his sources and trial, the limits of knowledge, his method, and the examined life.", skills: ["phil1-socrates", "phil1-limits", "phil1-method", "phil1-examined"], per: 2 },
      { title: "Quiz 5", after: 19, blurb: "The harm principle, ahimsa, the fields of philosophy, and the toolkit.", skills: ["phil1-harm", "phil1-ahimsa", "phil1-fields", "phil1-toolkit"], per: 2 }
    ],
    skills: SKILLS,
    // A lesson of watching, reading and writing has no graded problems to count.
    end: { line: function (clean, total) { return total ? clean + " of " + total + " solved first try, without a hint." : "You watched it, read it, and said it in your own words."; } }
  });
  L.addConcepts("phil:1", {});
})();
