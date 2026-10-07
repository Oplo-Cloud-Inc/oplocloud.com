/* ==========================================================================
   Grade 1 Math — Unit 1: Where Is Moti?  See lab/k1kit.js for how it plays.

   This unit follows the first chapter of NCERT's Class 1 mathematics book,
   Joyful Mathematics, "Finding the Furry Cat!" — the words for where things
   are (on, under, inside, outside, above, below, top, middle, bottom), before
   and after, and sorting things into groups. Only the order of ideas is the
   book's. Moti, her room, every picture, every sentence and every question
   is OEdu's own.

   A child of six learns "under" by putting something under something, so
   every lesson opens with something to move, names the word after it has been
   found, and then asks the child to choose it, put it, tap it. Each ends with
   something to do away from the screen (the book's "Let us play"). Nothing is
   typed, and everything is read aloud.

   Seven lessons: On and under · Inside and outside · Above and below ·
   Top, middle and bottom · Before and after · Sorting · Moti's room.
   Six skills, three quizzes, and the unit test. Lessons carry v: 1.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB, K = window.OPLO_K1, S = K.S, G = K.G, still = K.still;
  var W = function (rel, text) { return G.chip(rel, text); };
  var LESSONS = [];

  /* ------------------------------------------------------------ Helpers */
  var YES = ["Yes!", "Yes — you did it!"], NO = "Try again.", SHOWN = "Look — here it is.";
  function step(o) { return Object.assign({ k1: 1, yes: YES, no: NO, shown: SHOWN, shownNote: "" }, o); }
  function learn(o) { return Object.assign({ type: "learn", k1: 1 }, o); }
  function put(o) { return step(Object.assign({ type: "g1put" }, o)); }
  function pick(o) { return step(Object.assign({ type: "g1pick" }, o)); }
  function tapS(o) { return step(Object.assign({ type: "g1tap" }, o)); }
  function count(o) { return step(Object.assign({ type: "g1count" }, o)); }
  function sort(o) { return step(Object.assign({ type: "g1sort" }, o)); }
  function paint(o) { return step(Object.assign({ type: "g1paint" }, o)); }
  function means(rel) { return G.WORDS[rel].means; }
  // A pair of small pictures with a caption each, for the end of a lesson.
  function duo(a, b) {
    function fig(x) { return '<figure class="k1-duo-f">' + still(x.scene) + "<figcaption>" + x.cap + "</figcaption></figure>"; }
    return '<div class="k1-duo">' + fig(a) + fig(b) + "</div>";
  }
  function trio(list) { return '<div class="k1-duo k1-trio">' + list.map(function (x) { return '<figure class="k1-duo-f">' + still(x.scene) + "<figcaption>" + x.cap + "</figcaption></figure>"; }).join("") + "</div>"; }
  var cap = G.cap;

  /* ========================================================== 1 · On and under */
  var T_ON = "On and under";
  LESSONS.push({
    title: "On and under", art: "onunder", mins: 9, v: 1,
    blurb: "Moti the cat likes to hide. Is she on the table? Is she under it? Find her.",
    steps: [
      learn({ kicker: "Meet Moti", prompt: "This is Moti. Moti is a cat. Moti loves to hide!", art: still(S.table({ ball: false })), after: "Can you find her? Let us look." }),
      learn({ kicker: "Watch", prompt: "Press Play. Where does Moti go?",
        scene: { type: "g1story", scene: S.table({ ball: false }), gate: true, frames: [
          { line: "Moti, Moti, where are you?" },
          { line: "Moti is " + W("on") + " the table!", pos: { moti: { rel: "on", ref: "table" } } },
          { line: "Now Moti is " + W("under") + " the table!", pos: { moti: { rel: "under", ref: "table" } } }
        ] },
        gate: true, then: W("on") + " and " + W("under") + " say where Moti is." }),
      learn({ kicker: "Move it", prompt: "Now you move Moti. Where can she go?",
        scene: { type: "g1play", scene: S.table({ ball: false }), words: [{ rel: "on", ref: "table" }, { rel: "under", ref: "table" }] },
        gate: true, then: W("on") + " means on the top, touching it. " + W("under") + " means down below it." }),
      pick({ kicker: "Choose", prompt: "Look at Moti. Where is she?", scene: S.catOnTable(), sentence: "Moti is {} the table.", options: ["on", "under"], answer: "on", skill: T_ON,
        hints: ["Is Moti on the top of the table, or down below it?"], look: "Look at Moti again.", why: G.sentence("Moti", "on", "the table") }),
      pick({ kicker: "Choose", prompt: "And now? Where is Moti?", scene: S.catUnderTable(), sentence: "Moti is {} the table.", options: ["on", "under"], answer: "under", skill: T_ON,
        hints: ["Is Moti on the top of the table, or down below it?"], look: "Look at Moti again.", why: G.sentence("Moti", "under", "the table") }),
      pick({ kicker: "Choose", prompt: "Where is the red ball?", scene: S.ballOnBed(), sentence: "The ball is {} the bed.", options: ["on", "under"], answer: "on", skill: T_ON,
        hints: ["Is the ball on the top of the bed, or down below it?"], look: "Look at the ball again.", why: G.sentence("the ball", "on", "the bed") }),
      pick({ kicker: "Choose", prompt: "Where is the red ball now?", scene: S.ballUnderBed(), sentence: "The ball is {} the bed.", options: ["on", "under"], answer: "under", skill: T_ON,
        hints: ["Is the ball on the top of the bed, or down below it?"], look: "Look at the ball again.", why: G.sentence("the ball", "under", "the bed") }),
      put({ kicker: "Your turn", prompt: "Put Moti " + W("on") + " the table.", scene: S.table({ ball: false }), tasks: [{ item: "moti", rel: "on", ref: "table" }], skill: T_ON,
        hints: ["Moti must sit on the top of the table.", "Pick Moti up, and put her on the top."], why: G.sentence("Moti", "on", "the table") }),
      put({ kicker: "Your turn", prompt: "Put the ball " + W("under") + " the table.", scene: S.table({ moti: 36 }), tasks: [{ item: "ball", rel: "under", ref: "table" }], skill: T_ON,
        hints: ["The ball must go down below the table.", "Put it between the legs."], why: G.sentence("the ball", "under", "the table") }),
      put({ kicker: "Two things", prompt: "Put Moti " + W("on") + " the bed. Put the ball " + W("under") + " the bed.", scene: S.bed(), tasks: [{ item: "moti", rel: "on", ref: "bed" }, { item: "ball", rel: "under", ref: "bed" }], skill: T_ON,
        hints: ["Moti goes on the top of the bed.", "The ball goes down below the bed."], why: G.sentence("Moti", "on", "the bed") + " " + G.sentence("the ball", "under", "the bed") }),
      pick({ kicker: "Look", prompt: "A boy is reading a book. Where is he?", scene: S.boyTree(), sentence: "The boy is {} the tree.", options: ["on", "under"], answer: "under", skill: T_ON,
        hints: ["Is the boy up in the tree, or down below it?"], look: "Look at the boy again.", why: G.sentence("the boy", "under", "the tree") }),
      pick({ kicker: "Look", prompt: "Look at the two birds. Where are they?", scene: S.boyTree(), sentence: "The birds are {} the tree.", options: ["on", "under"], answer: "on", skill: T_ON,
        hints: ["Are the birds sitting in the tree, or down below it?"], look: "Look at the birds again.", why: "The birds are " + W("on") + " the tree." }),
      put({ kicker: "Your turn", prompt: "Put a bird " + W("on") + " the tree. Put Moti " + W("under") + " the tree.", scene: S.tree({ moti: true, motiX: 520 }),
        tasks: [{ item: "bird1", rel: "on", ref: "tree" }, { item: "moti", rel: "under", ref: "tree" }], skill: T_ON,
        hints: ["The bird goes up in the leaves.", "Moti goes down below, in the shade."], why: "The bird is " + W("on") + " the tree. Moti is " + W("under") + " the tree." }),
      learn({ kicker: "Play for real", prompt: "Find a toy. Put it " + W("on") + " your bed. Now put it " + W("under") + " a chair.", art: still(S.catUnderTable()), after: "Say where it is! Then tap Continue." }),
      learn({ kicker: "Remember", prompt: "Moti can be " + W("on") + " things. Moti can be " + W("under") + " things.",
        art: duo({ scene: S.catOnTable(), cap: W("on") }, { scene: S.catUnderTable(), cap: W("under") }) })
    ]
  });

  /* ======================================================= 2 · Inside and outside */
  var T_IN = "Inside and outside";
  LESSONS.push({
    title: "Inside and outside", art: "inout", mins: 9, v: 1,
    blurb: "Throw the ball. In the basket? Or out? Find what is inside and what is outside.",
    steps: [
      learn({ kicker: "Throw it!", prompt: "Pick up the ball. Let go over the basket!",
        scene: { type: "g1play", toss: true, scene: S.basketToss(), words: [{ rel: "inside", ref: "basket", label: "IN" }, { rel: "outside", ref: "basket", label: "OUT" }] },
        gate: true, after: "Get it IN. Then miss on purpose, and get it OUT!", then: W("inside") + " means in the basket, with its sides all round. " + W("outside") + " means not in it." }),
      learn({ kicker: "Move it", prompt: "Put Moti and the ball in the box. Then take them out.",
        scene: { type: "g1play", scene: S.ballBox(), words: [{ rel: "inside", ref: "box" }, { rel: "outside", ref: "box" }] },
        gate: true, then: W("inside") + " means in the box. " + W("outside") + " means out of the box." }),
      tapS({ kicker: "Tap", prompt: "Tap the flowers that are " + W("inside") + " the basket.", scene: S.flowerBasket(), targets: ["f1", "f2", "f3"], what: "inside the basket", skill: T_IN,
        fb: { f4: "That flower is on the grass. It is outside the basket.", f5: "That flower is on the grass. It is outside the basket." },
        hints: ["Look in the basket. Tap the flowers you can see in it."], why: "Three flowers are " + W("inside") + " the basket." }),
      tapS({ kicker: "Tap", prompt: "Now tap the flowers that are " + W("outside") + " the basket.", scene: S.flowerBasket(), targets: ["f4", "f5"], what: "outside the basket", skill: T_IN,
        fb: { f1: "That flower is in the basket. It is inside.", f2: "That flower is in the basket. It is inside.", f3: "That flower is in the basket. It is inside." },
        hints: ["Look on the grass. Tap the flowers that are not in the basket."], why: "Two flowers are " + W("outside") + " the basket." }),
      tapS({ kicker: "Tap", prompt: "Who is " + W("inside") + " the car?", scene: S.carPeople(), targets: ["girl"], skill: T_IN,
        fb: { man: "The man is standing on the grass. He is outside the car." }, hints: ["Look at the window of the car."], why: "The girl is " + W("inside") + " the car." }),
      tapS({ kicker: "Tap", prompt: "Tap the bears that are " + W("outside") + " the cave.", scene: S.caveBears(), targets: ["bearC", "bearD"], what: "outside the cave", skill: T_IN,
        fb: { bearA: "That bear is in the cave. It is inside.", bearB: "That bear is in the cave. It is inside." }, hints: ["The bears in the dark cave are inside. Tap the others."], why: "Two bears are " + W("outside") + " the cave." }),
      pick({ kicker: "Choose", prompt: "Where is the teddy?", scene: S.toyBox(), sentence: "The teddy is {} the box.", options: ["inside", "outside"], answer: "inside", skill: T_IN,
        hints: ["Is the teddy in the box, or out of it?"], look: "Look at the teddy again.", why: G.sentence("the teddy", "inside", "the box") }),
      pick({ kicker: "Choose", prompt: "Where is the yellow duck?", scene: S.toyBox(), sentence: "The duck is {} the box.", options: ["inside", "outside"], answer: "outside", skill: T_IN,
        hints: ["Is the duck in the box, or out of it?"], look: "Look at the duck again.", why: G.sentence("the duck", "outside", "the box") }),
      put({ kicker: "Your turn", prompt: "Put the ball " + W("inside") + " the box.", scene: S.ballBox(), tasks: [{ item: "ball", rel: "inside", ref: "box" }], skill: T_IN,
        hints: ["The ball goes in the box.", "Put it in, with the box all round it."], why: G.sentence("the ball", "inside", "the box") }),
      put({ kicker: "Two things", prompt: "Put Moti " + W("inside") + " the box. Put the ball " + W("outside") + " the box.", scene: S.ballBox({ ballIn: true }),
        tasks: [{ item: "moti", rel: "inside", ref: "box" }, { item: "ball", rel: "outside", ref: "box" }], skill: T_IN,
        hints: ["Moti climbs in the box.", "The ball comes out of the box."], why: G.sentence("Moti", "inside", "the box") + " " + G.sentence("the ball", "outside", "the box") }),
      put({ kicker: "Think", prompt: "Where does garbage go? Put the paper " + W("inside") + " the dustbin.", scene: S.dustbin(), tasks: [{ item: "paper", rel: "inside", ref: "bin" }], skill: T_IN,
        hints: ["Drop the paper in the dustbin."], why: "Garbage goes " + W("inside") + " the dustbin. That keeps our home clean." }),
      learn({ kicker: "Play for real", prompt: "Find a basket or a box. Put a toy " + W("in") + ". Take it " + W("out") + ".", art: still(S.ballInBox()), after: "Say IN! and OUT! each time. Then tap Continue." }),
      learn({ kicker: "Remember", prompt: "The ball can be " + W("inside") + ". The ball can be " + W("outside") + ".",
        art: duo({ scene: S.ballInBox(), cap: W("inside") }, { scene: S.ballOutBox(), cap: W("outside") }) })
    ]
  });

  /* ======================================================== 3 · Above and below */
  var T_AB = "Above and below";
  LESSONS.push({
    title: "Above and below", art: "abovebelow", mins: 9, v: 1,
    blurb: "Up high, down low. Can Moti hop above the hat? Can you give a face its eyebrows?",
    steps: [
      learn({ kicker: "Move it", prompt: "A hat sits on the table. Where can Moti be?",
        scene: { type: "g1play", scene: S.hatTable(), words: [{ rel: "above", ref: "hat" }, { rel: "below", ref: "hat" }] },
        gate: true, after: "Can she hop up high? Can she stay down low?", then: W("above") + " means higher up, with space in between. " + W("below") + " means lower down." }),
      pick({ kicker: "Choose", prompt: "Where is Moti?", scene: S.catAboveHat(), sentence: "Moti is {} the hat.", options: ["above", "below"], answer: "above", skill: T_AB,
        hints: ["Is Moti higher than the hat, or lower?"], look: "Look at Moti again.", why: G.sentence("Moti", "above", "the hat") }),
      pick({ kicker: "Choose", prompt: "And now?", scene: S.catBelowHat(), sentence: "Moti is {} the hat.", options: ["above", "below"], answer: "below", skill: T_AB,
        hints: ["Is Moti higher than the hat, or lower?"], look: "Look at Moti again.", why: G.sentence("Moti", "below", "the hat") }),
      pick({ kicker: "Choose", prompt: "Look at the tree. Where is the bird?", scene: S.birdAbove(), sentence: "The bird is {} the tree.", options: ["above", "below"], answer: "above", skill: T_AB,
        hints: ["Is the bird higher than the tree?"], look: "Look at the bird again.", why: G.sentence("the bird", "above", "the tree") }),
      pick({ kicker: "Compare", prompt: "This bird is touching the tree. Where is it?", scene: S.birdOnTree(), sentence: "The bird is {} the tree.", options: ["on", "above"], answer: "on", skill: T_AB,
        hints: ["Is the bird touching the tree? Or is there space between?"], look: "Is it touching the tree?", why: G.sentence("the bird", "on", "the tree") + " " + means("on") }),
      pick({ kicker: "Compare", prompt: "This bird is up high, with space below it.", scene: S.birdAbove(), sentence: "The bird is {} the tree.", options: ["on", "above"], answer: "above", skill: T_AB,
        hints: ["Is the bird touching the tree? Or is there space between?"], look: "Is there space between?", why: G.sentence("the bird", "above", "the tree") + " " + means("above") }),
      put({ kicker: "Your turn", prompt: "Put Moti " + W("above") + " the hat.", scene: S.hatTable(), tasks: [{ item: "moti", rel: "above", ref: "hat" }], skill: T_AB,
        hints: ["Moti must be higher than the hat.", "Leave some space between Moti and the hat."], why: G.sentence("Moti", "above", "the hat") }),
      put({ kicker: "Your turn", prompt: "Put Moti " + W("below") + " the hat.", scene: S.staged(S.hatTable(), "moti", "hat", "above", null, true), tasks: [{ item: "moti", rel: "below", ref: "hat" }], skill: T_AB,
        hints: ["Moti must be lower than the hat.", "Bring Moti down to the floor."], why: G.sentence("Moti", "below", "the hat") }),
      put({ kicker: "Make a face", prompt: "Put the eyebrows " + W("above") + " the eyes. Put the smile " + W("below") + " the nose.", scene: S.face(),
        tasks: [{ item: "brows", rel: "above", ref: "face", zone: "eyes", within: "upper", refName: "the eyes" }, { item: "smile", rel: "below", ref: "face", zone: "nose", within: "lower", refName: "the nose" }], skill: T_AB,
        hints: ["The eyebrows go up above the eyes.", "The smile goes down below the nose."], why: "The eyebrows are " + W("above") + " the eyes. The smile is " + W("below") + " the nose." }),
      learn({ kicker: "Move it", prompt: "Some things are close. Some are far. Move Moti near the tree. Then far from it.",
        scene: { type: "g1play", scene: S.nearFar(), words: [{ rel: "near", ref: "tree", item: "moti" }, { rel: "far", ref: "tree", item: "moti" }] },
        gate: true, then: W("near") + " means close by. " + W("far") + " means a long way off." }),
      put({ kicker: "Your turn", prompt: "Put the ball " + W("far") + " from the tree.", scene: S.staged(S.nearFar(), "ball", "tree", "near", null, true), tasks: [{ item: "ball", rel: "far", ref: "tree" }], skill: T_AB,
        hints: ["Roll the ball a long way from the tree."], why: "The ball is " + W("far") + " from the tree." }),
      learn({ kicker: "Play for real", prompt: "Look up! Say one thing " + W("above") + " you. Now look down! Say one thing " + W("below") + " you.", art: still(S.catAboveHat()), after: "Then tap Continue." }),
      learn({ kicker: "Remember", prompt: "Up high is " + W("above") + ". Down low is " + W("below") + ".",
        art: duo({ scene: S.catAboveHat(), cap: W("above") }, { scene: S.catBelowHat(), cap: W("below") }) })
    ]
  });

  /* ================================================ 4 · Top, middle and bottom */
  var T_TM = "Top, middle and bottom";
  var TOW = function (c) { return S.tower({ colours: c }); };
  var FLAG_OPTS = [{ id: "saffron", t: "orange", swatch: "#ff9933" }, { id: "white", t: "white", swatch: "#ffffff" }, { id: "green", t: "green", swatch: "#138808" }];
  LESSONS.push({
    title: "Top, middle and bottom", art: "topbottom", mins: 10, v: 1,
    blurb: "Moti climbs a cupboard. A tower of blocks. The flag of India. Which is at the top? Which is in the middle?",
    steps: [
      learn({ kicker: "Move it", prompt: "This cupboard has three racks. Put Moti in each one.",
        scene: { type: "g1play", scene: S.shelfMoti(), words: [{ rel: "top", ref: "shelf" }, { rel: "middle", ref: "shelf" }, { rel: "bottom", ref: "shelf" }] },
        gate: true, then: "The " + W("top") + " is the highest. The " + W("bottom") + " is the lowest. The " + W("middle") + " is in between." }),
      tapS({ kicker: "Tap", prompt: "Tap the " + W("top") + " block.", scene: TOW(["red", "blue", "green"]), targets: ["k1"], skill: T_TM,
        fb: { k2: "That one is in the middle. Look higher.", k3: "That one is at the bottom. Look higher." }, hints: ["The top block is the highest one."], why: "The red block is at the " + W("top") + "." }),
      tapS({ kicker: "Tap", prompt: "Tap the " + W("bottom") + " block.", scene: TOW(["yellow", "purple", "orange"]), targets: ["k3"], skill: T_TM,
        fb: { k1: "That one is at the top. Look lower.", k2: "That one is in the middle. Look lower." }, hints: ["The bottom block is the lowest one."], why: "The orange block is at the " + W("bottom") + "." }),
      tapS({ kicker: "Tap", prompt: "Tap the " + W("middle") + " block.", scene: TOW(["blue", "red", "yellow"]), targets: ["k2"], skill: T_TM,
        fb: { k1: "That one is at the top.", k3: "That one is at the bottom." }, hints: ["The middle block has one above it and one below it."], why: "The red block is in the " + W("middle") + "." }),
      pick({ kicker: "The flag", prompt: "This is the flag of India. Which colour is at the " + W("top") + "?", scene: S.flag(), options: FLAG_OPTS, answer: "saffron", auto: true, skill: T_TM,
        fb: { white: "White is in the middle. Look higher.", green: "Green is at the bottom. Look higher." }, hints: ["The top is the highest part of the flag."], why: "Orange is at the " + W("top") + " of the flag." }),
      pick({ kicker: "The flag", prompt: "Which colour is at the " + W("bottom") + "?", scene: S.flag(), options: FLAG_OPTS, answer: "green", skill: T_TM,
        fb: { saffron: "Orange is at the top. Look lower.", white: "White is in the middle. Look lower." }, hints: ["The bottom is the lowest part of the flag."], why: "Green is at the " + W("bottom") + " of the flag." }),
      pick({ kicker: "The flag", prompt: "Which colour is " + W("below") + " the white?", scene: S.flag(), options: FLAG_OPTS, answer: "green", skill: T_TM,
        fb: { saffron: "Orange is above the white.", white: "That is the white one itself." }, hints: ["Look down from the white."], why: "Green is " + W("below") + " the white." }),
      pick({ kicker: "The flag", prompt: "Which colour is " + W("above") + " the green?", scene: S.flag(), options: FLAG_OPTS, answer: "white", skill: T_TM,
        fb: { saffron: "Orange is at the top. It is above the white too.", green: "That is the green one itself." }, hints: ["Look up from the green."], why: "White is " + W("above") + " the green." }),
      pick({ kicker: "The flag", prompt: "The blue wheel is on the flag. Where is it?", scene: S.flag(), options: [{ id: "corner", w: "corner" }, { id: "centre", w: "centre", t: "middle" }, { id: "side", w: "side" }], answer: "centre", skill: T_TM,
        fb: { corner: "A corner is where two sides meet. Look at the wheel again.", side: "The wheel is not along an edge. Look again." }, hints: ["Is the wheel in the corner, at the edge, or in the middle?"], why: "The wheel is in the " + W("middle") + " of the flag." }),
      put({ kicker: "Your turn", prompt: "Put the ball in the " + W("top") + " rack. Put the duck in the " + W("bottom") + " rack.", scene: S.shelf(),
        tasks: [{ item: "ball", rel: "top", ref: "shelf" }, { item: "duck", rel: "bottom", ref: "shelf" }], skill: T_TM,
        hints: ["The top rack is the highest one.", "The bottom rack is the lowest one."], why: "The ball is at the " + W("top") + ". The duck is at the " + W("bottom") + "." }),
      put({ kicker: "Tidy up", prompt: "Put two toys in the " + W("bottom") + " rack. Put one toy in the " + W("top") + " rack.", scene: S.shelf(),
        tasks: [{ group: ["ball", "duck", "bear"], count: 2, rel: "bottom", ref: "shelf", noun: "toys" }, { group: ["ball", "duck", "bear"], count: 1, rel: "top", ref: "shelf", noun: "toy" }], skill: T_TM,
        hints: ["Two toys go low, in the bottom rack.", "One toy goes high, in the top rack."], why: "Two toys are at the " + W("bottom") + ". One toy is at the " + W("top") + "." }),
      learn({ kicker: "Play for real", prompt: "Tidy a cupboard at home. Put two things at the " + W("bottom") + ". Put one thing at the " + W("top") + ".", art: still(S.shelfMoti()), after: "Then tap Continue." }),
      learn({ kicker: "Remember", prompt: "The " + W("top") + " is highest. The " + W("middle") + " is between. The " + W("bottom") + " is lowest.", art: still(S.tower({ colours: ["red", "blue", "green"] })) })
    ]
  });

  /* ========================================================= 5 · Before and after */
  var T_BA = "Before and after";
  var TR5 = ["blue", "orange", "red", "green", "yellow"];
  LESSONS.push({
    title: "Before and after", art: "train", mins: 10, v: 1,
    blurb: "Chhuk chhuk! A little train with an engine and five bogies. Who comes before? Who comes after?",
    steps: [
      learn({ kicker: "Tap", prompt: "Chhuk chhuk! Tap a bogie. What is before it? What is after it?",
        scene: { type: "g1seq", scene: S.train(TR5), ids: ["b1", "b2", "b3", "b4", "b5"], goal: 3 },
        gate: true, then: W("before") + " is nearer the engine. " + W("after") + " is farther from the engine." }),
      count({ kicker: "Count", prompt: "How many bogies are " + W("after") + " the engine?", scene: S.train(TR5), count: ["b1", "b2", "b3", "b4", "b5"], answer: 5, what: "bogies", skill: T_BA,
        hints: ["Tap each bogie as you count: one, two, three…"], why: "Five bogies are " + W("after") + " the engine." }),
      count({ kicker: "Count", prompt: "How many bogies are " + W("before") + " the red bogie?", scene: S.train(TR5), count: ["b1", "b2"], answer: 2, what: "bogies", skill: T_BA,
        hints: ["Start at the engine. Count the bogies until you reach the red one."], why: "Two bogies are " + W("before") + " the red bogie." }),
      count({ kicker: "Count", prompt: "How many bogies are " + W("after") + " the red bogie?", scene: S.train(TR5), count: ["b4", "b5"], answer: 2, what: "bogies", skill: T_BA,
        hints: ["Start at the red bogie. Count the ones behind it."], why: "Two bogies are " + W("after") + " the red bogie." }),
      paint({ kicker: "Paint", prompt: "Pick orange. Paint the bogies " + W("after") + " the red one.", scene: S.train(["plain", "plain", "red", "plain", "plain"], { fixed: [2] }), crayons: ["orange", "blue"],
        goal: { b4: "orange", b5: "orange" }, what: "bogie", skill: T_BA, hints: ["The red bogie is in the middle. After means behind it, farther from the engine."], why: "The two bogies " + W("after") + " the red one are orange." }),
      paint({ kicker: "Paint", prompt: "Pick blue. Paint the bogies " + W("before") + " the red one.", scene: S.train(["plain", "plain", "red", "plain", "plain"], { fixed: [2] }), crayons: ["orange", "blue"],
        goal: { b1: "blue", b2: "blue" }, what: "bogie", skill: T_BA, hints: ["Before means nearer the engine."], why: "The two bogies " + W("before") + " the red one are blue." }),
      paint({ kicker: "Both", prompt: "Paint the bogies " + W("before") + " the red one blue. Paint the bogies " + W("after") + " it orange.", scene: S.train(["plain", "plain", "red", "plain", "plain"], { fixed: [2] }), crayons: ["orange", "blue"],
        goal: { b1: "blue", b2: "blue", b4: "orange", b5: "orange" }, what: "bogie", skill: T_BA, hints: ["Blue is for before: nearer the engine.", "Orange is for after: farther from the engine."], why: "Blue is " + W("before") + ". Orange is " + W("after") + "." }),
      tapS({ kicker: "Tap", prompt: "Tap the bogie just " + W("after") + " the red one.", scene: S.train(TR5), targets: ["b4"], skill: T_BA,
        fb: { b5: "That one is two after the red one. Look for the very next one.", b2: "That one is before the red one.", b1: "That one is before the red one.", b3: "That is the red one itself." },
        hints: ["Just after means the very next one, behind the red one."], why: "The green bogie is just " + W("after") + " the red one." }),
      tapS({ kicker: "Tap", prompt: "Tap the bogie just " + W("before") + " the red one.", scene: S.train(TR5), targets: ["b2"], skill: T_BA,
        fb: { b1: "That one is two before the red one. Look for the very next one.", b4: "That one is after the red one.", b5: "That one is after the red one.", b3: "That is the red one itself." },
        hints: ["Just before means the one right in front, nearer the engine."], why: "The orange bogie is just " + W("before") + " the red one." }),
      learn({ kicker: "Sing", prompt: "A line of children! Meera is " + W("first") + ". Leela is " + W("last") + ". Tap a child.", scene: { type: "g1seq", scene: S.kidsLine(5), ids: ["k1", "k2", "k3", "k4", "k5"], goal: 2, noun: "Child" },
        gate: true, then: W("first") + " means nothing comes before. " + W("last") + " means nothing comes after." }),
      tapS({ kicker: "Tap", prompt: "Who is " + W("before") + " Rohit?", scene: S.kidsLine(5), targets: ["k1"], skill: T_BA,
        fb: { k3: "Asha is after Rohit.", k2: "That is Rohit himself." }, hints: ["Rohit is second. Who stands in front of him?"], why: "Meera is " + W("before") + " Rohit." }),
      tapS({ kicker: "Tap", prompt: "Who is " + W("after") + " Asha?", scene: S.kidsLine(5), targets: ["k4"], skill: T_BA,
        fb: { k1: "Meera is before Asha.", k2: "Rohit is before Asha.", k3: "That is Asha herself.", k5: "Leela is two after Asha. Look for the very next one." }, hints: ["Asha is third. Who stands right behind her?"], why: "Imran is " + W("after") + " Asha." }),
      tapS({ kicker: "Tap", prompt: "Who is " + W("first") + " in the line?", scene: S.kidsLine(5), targets: ["k1"], skill: T_BA,
        fb: { k5: "Leela is last.", k2: "Rohit has one child before him.", k3: "Asha has two children before her.", k4: "Imran has three children before him." }, hints: ["First means no one is before."], why: "Meera is " + W("first") + ". No one is before her." }),
      learn({ kicker: "Play for real", prompt: "Make a train with your family! Hold each other's shoulders. Say who is " + W("before") + " you and who is " + W("after") + " you.", art: still(S.kidsLine(5)), after: "Then tap Continue." }),
      learn({ kicker: "Remember", prompt: W("before") + " is nearer the engine. " + W("after") + " is farther from it.", art: still(S.train(["blue", "orange", "red", "green", "yellow"])) })
    ]
  });

  /* ================================================================ 6 · Sorting */
  var T_SO = "Sorting";
  var BINS3 = function (y, h, keys, labels, samples) {
    var w = 200, gap = 14, x0 = (640 - (3 * w + 2 * gap)) / 2;
    return keys.map(function (k, i) { return { id: "bin" + (i + 1), x: x0 + i * (w + gap), y: y, w: w, h: h, key: k, label: labels && labels[i], sample: samples && samples[i] }; });
  };
  var BTN_SET = [
    { colour: "red", x: 30, y: 22 }, { colour: "blue", x: 140, y: 64, shape: "square" }, { colour: "green", x: 260, y: 20, size: "small" }, { colour: "red", x: 370, y: 70, shape: "square", size: "small" },
    { colour: "blue", x: 490, y: 22 }, { colour: "green", x: 566, y: 92, shape: "square" }, { colour: "red", x: 60, y: 120, size: "small" }, { colour: "blue", x: 190, y: 128, size: "small" },
    { colour: "green", x: 320, y: 120 }, { colour: "red", x: 440, y: 126, shape: "square" }, { colour: "blue", x: 540, y: 28, shape: "square", size: "small" }, { colour: "green", x: 100, y: 70, shape: "square", size: "small" }
  ];
  var STILL_SORTED = (function () {
    var spots = { red: [[40, 216], [92, 258], [64, 298], [124, 228]], blue: [[250, 216], [312, 258], [278, 298], [342, 228]], green: [[460, 216], [520, 258], [486, 298], [548, 228]] };
    var list = [], shapes = ["round", "square", "round", "square"], sizes = ["big", "small", "small", "big"];
    ["red", "blue", "green"].forEach(function (c) { spots[c].forEach(function (p, i) { list.push({ colour: c, x: p[0], y: p[1], shape: shapes[i], size: sizes[i] }); }); });
    var deco = [0, 1, 2].map(function (i) { return '<rect x="' + (13 + i * 214) + '" y="204" width="200" height="164" rx="22" fill="rgba(255,255,255,.65)" stroke="#a9b8d8" stroke-width="3" stroke-dasharray="9 7"/>'; }).join("");
    return S.buttons(list, { role: "ref", deco: deco });
  })();
  LESSONS.push({
    title: "Sorting into groups", art: "sort", mins: 9, v: 1,
    blurb: "Leaves with leaves, chalk with chalk. Sort the buttons. Then find another way to sort them.",
    steps: [
      learn({ kicker: "Look", prompt: "Suwali has a big pile of things. They are all mixed up. Let us put the same things together.", art: still(S.leaves()), after: "Tap Continue to start." }),
      sort({ kicker: "Sort", prompt: "Put the leaves in one box, the chalk in one box, and the pebbles in one box.", scene: S.leaves(), skill: T_SO,
        bins: BINS3(214, 156, [{ kind: "leaf" }, { kind: "chalk" }, { kind: "pebble" }], null, [{ art: "leaf" }, { art: "chalk" }, { art: "pebble" }]), rule: "key",
        hints: ["Look at the little picture at the top of each box."], why: "Leaves, chalk and pebbles: each in its own box." }),
      sort({ kicker: "Sort", prompt: "Here are buttons. Put the buttons of one colour in one box.", scene: S.buttons(BTN_SET), skill: T_SO,
        bins: BINS3(214, 156, [{ colour: "red" }, { colour: "blue" }, { colour: "green" }], ["red", "blue", "green"]), rule: "key",
        hints: ["Start with the red buttons. Then the blue ones."], why: "Each box has buttons of one colour." }),
      pick({ kicker: "Think", prompt: "Why did Suwali make three groups?", scene: STILL_SORTED, sentence: "They are the same {}.", auto: true,
        options: [{ id: "colour", t: "colour", swatch: "#e8505b" }, { id: "size", t: "size", glyph: "size" }, { id: "shape", t: "shape", glyph: "shape" }], answer: "colour", skill: T_SO,
        fb: { size: "Some buttons in a group are big and some are small. Look again.", shape: "Some buttons in a group are round and some are square. Look again." }, hints: ["Look at one group. What is the same about all of them?"], why: "Each group is one colour." }),
      sort({ kicker: "Another way", prompt: "Sort the same buttons another way! Not by colour. Can you find one?", scene: S.buttons(BTN_SET), skill: T_SO,
        bins: BINS3(214, 156, [null, null, null]), rule: "any", avoid: ["colour"], show: "shape",
        hints: ["Look at the shapes. Are they all round?", "Or look at the size: big and small."], why: "You found a new way to sort." }),
      learn({ kicker: "Play for real", prompt: "Sort things at home: spoons, socks, or toys. Put the same together. Say why they are the same.", art: still(S.leaves()), after: "Then tap Continue." }),
      learn({ kicker: "Remember", prompt: "Same things go together. The same colour. The same shape. The same size.", art: still(STILL_SORTED) })
    ]
  });

  /* ============================================================ 7 · Moti's room */
  var T_RM = "Moti's room";
  LESSONS.push({
    title: "Moti's room", art: "room", mins: 7, v: 1, tag: "Project",
    blurb: "Moti's room is a mess! Put everything where it belongs, using all the words you know.",
    steps: [
      learn({ kicker: "Project", prompt: "Moti's room is a mess! Help her tidy up. Listen to each job, then do it.", art: still(S.motiRoom()), after: "Tap Continue to begin." }),
      put({ kicker: "Job 1", prompt: "Put Moti " + W("on") + " the bed. Put the ball " + W("under") + " the table. Put the duck " + W("inside") + " the box.", scene: S.motiRoom(),
        tasks: [{ item: "moti", rel: "on", ref: "bed" }, { item: "ball", rel: "under", ref: "table" }, { item: "duck", rel: "inside", ref: "box" }], skill: T_RM,
        hints: ["Moti goes on the top of the bed.", "The ball goes down below the table.", "The duck goes in the box."], why: G.sentence("Moti", "on", "the bed") + " " + G.sentence("the ball", "under", "the table") + " " + G.sentence("the duck", "inside", "the box") }),
      put({ kicker: "Job 2", prompt: "Now Moti wants to hide. Put Moti " + W("under") + " the table. Put the ball " + W("inside") + " the box. Put the duck " + W("on") + " the bed.", scene: S.motiRoom(),
        tasks: [{ item: "moti", rel: "under", ref: "table" }, { item: "ball", rel: "inside", ref: "box" }, { item: "duck", rel: "on", ref: "bed" }], skill: T_RM,
        hints: ["Moti hides down below the table.", "The ball goes in the box.", "The duck sits on the top of the bed."], why: G.sentence("Moti", "under", "the table") + " " + G.sentence("the ball", "inside", "the box") + " " + G.sentence("the duck", "on", "the bed") }),
      put({ kicker: "Job 3", prompt: "Put Moti " + W("above") + " the table. Put the ball " + W("outside") + " the box. Put the duck " + W("on") + " the table.", scene: S.staged(S.staged(S.motiRoom(), "ball", "box", "inside", null, true), "duck", "table", "under", null, true),
        tasks: [{ item: "moti", rel: "above", ref: "table" }, { item: "ball", rel: "outside", ref: "box" }, { item: "duck", rel: "on", ref: "table" }], skill: T_RM,
        hints: ["Moti hops up high above the table.", "The ball comes out of the box.", "The duck sits on the top of the table."], why: "Moti is " + W("above") + " the table. The ball is " + W("outside") + " the box. The duck is " + W("on") + " the table." }),
      learn({ kicker: "Well done", prompt: "You know where things are! On, under, inside, outside, above, below, top, middle, bottom, before and after.", art: still(S.catOnBed()),
        after: "Now sort, and practise, and take the quiz. Moti is proud of you." })
    ]
  });

  /* =================================================================== Practice
     Fresh problems every sitting. Each skill makes five: some to choose, some to do. */
  function label(id) { return { moti: "Moti", ball: "The ball", duck: "The duck", paper: "The paper", bird1: "The bird", bird2: "The bird" }[id] || "It"; }
  function nameOf(id) { return { moti: "Moti", ball: "the ball", duck: "the duck", paper: "the paper" }[id] || "it"; }
  function pickWord(R, spec, item, refId, rel, o) {
    o = o || {};
    var opp = S.opposite[rel], opts = R.chance(0.5) ? [rel, opp] : [opp, rel];
    var scene = S.staged(spec, item, refId, rel, o.zone), refLabel = o.refLabel || ("the " + refId);
    return pick({ kicker: "Choose", prompt: "Where is " + nameOf(item) + "?", scene: scene, sentence: label(item) + " is {} " + refLabel + ".", options: opts, answer: rel, skill: o.skill,
      hints: ["Look at " + nameOf(item) + " and " + refLabel + "."], look: "Look at " + nameOf(item) + " again.", why: G.sentence(nameOf(item), rel, refLabel) });
  }
  function putWord(R, spec, item, refId, rel, o) {
    o = o || {};
    var start = S.staged(spec, item, refId, S.opposite[rel], o.zone, true), refLabel = o.refLabel || ("the " + refId);
    return put({ kicker: "Your turn", prompt: "Put " + nameOf(item) + " " + G.phrase(rel, refLabel) + ".", scene: start, tasks: [{ item: item, rel: rel, ref: refId, zone: o.zone }], skill: o.skill,
      hints: [G.WORDS[rel].means], why: G.sentence(nameOf(item), rel, refLabel) });
  }
  var SKILLS = [
    { id: "g1u1-onunder", title: "On and under", lesson: 1,
      gen: function (R) {
        var sc = R.pick([["table", S.table], ["bed", S.bed]]), item = R.pick(["moti", "ball"]), rel = R.pick(["on", "under"]);
        var spec = sc[1](), o = { skill: T_ON };
        return R.chance(0.5) ? pickWord(R, spec, item, sc[0], rel, o) : putWord(R, spec, item, sc[0], rel, o);
      } },
    { id: "g1u1-inout", title: "Inside and outside", lesson: 2,
      gen: function (R) {
        var c = R.pick([["box", function () { return S.ballBox(); }, ["moti", "ball"]], ["bin", S.dustbin, ["paper"]]]), item = R.pick(c[2]), rel = R.pick(["inside", "outside"]);
        var spec = c[1](), o = { skill: T_IN, refLabel: c[0] === "bin" ? "the dustbin" : "the box" };
        if (c[0] === "box" && R.chance(0.4)) {
          var tgt = R.pick(["f1", "f4"]);   // and a tap problem, on the flowers
          var inn = R.chance(0.5);
          return tapS({ kicker: "Tap", prompt: "Tap a flower that is " + W(inn ? "inside" : "outside") + " the basket.", scene: S.flowerBasket(), targets: inn ? ["f1", "f2", "f3"] : ["f4", "f5"], multi: false, any: true, skill: T_IN,
            fb: inn ? { f4: "That flower is on the grass. It is outside.", f5: "That flower is on the grass. It is outside." } : { f1: "That flower is in the basket. It is inside.", f2: "That flower is in the basket. It is inside.", f3: "That flower is in the basket. It is inside." },
            hints: ["Look in the basket first."], why: "That flower is " + W(inn ? "inside" : "outside") + " the basket." , any: true });
        }
        return R.chance(0.5) ? pickWord(R, spec, item, c[0], rel, o) : putWord(R, spec, item, c[0], rel, o);
      } },
    { id: "g1u1-abovebelow", title: "Above and below", lesson: 3,
      gen: function (R) {
        var rel = R.pick(["above", "below"]), o = { skill: T_AB, refLabel: "the hat" };
        return R.chance(0.5) ? pickWord(R, S.hatTable(), "moti", "hat", rel, o) : putWord(R, S.hatTable(), "moti", "hat", rel, o);
      } },
    { id: "g1u1-toprack", title: "Top, middle and bottom", lesson: 4,
      gen: function (R) {
        var rel = R.pick(["top", "middle", "bottom"]);
        if (R.chance(0.5)) {
          var cols = R.shuffle(["red", "blue", "green", "yellow", "purple", "orange"]).slice(0, 3), idx = { top: 1, middle: 2, bottom: 3 }[rel];
          var fb = {}; ["k1", "k2", "k3"].forEach(function (k, i) { if (i + 1 !== idx) fb[k] = "That one is at the " + ["top", "middle", "bottom"][i] + "."; });
          return tapS({ kicker: "Tap", prompt: "Tap the " + W(rel) + " block.", scene: S.tower({ colours: cols }), targets: ["k" + idx], skill: T_TM, fb: fb, hints: [G.WORDS[rel].means], why: "That block is at the " + W(rel) + "." });
        }
        var item = R.pick(["ball", "duck", "bear"]), nm = { ball: "the ball", duck: "the duck", bear: "the bear" }[item];
        var lbl = { ball: "The ball", duck: "The duck", bear: "The bear" }[item];
        if (R.chance(0.5)) {
          var opts = R.shuffle(["top", "middle", "bottom"]);
          return pick({ kicker: "Choose", prompt: "Where is " + nm + " in the cupboard?", scene: S.staged(S.shelf(), item, "shelf", rel), sentence: lbl + " is at the {} of the cupboard.", options: opts, answer: rel, skill: T_TM,
            hints: ["The top is the highest, the bottom is the lowest."], look: "Look at " + nm + " again.", why: G.sentence(nm, rel, "the cupboard") });
        }
        return put({ kicker: "Your turn", prompt: "Put " + nm + " in the " + W(rel) + " rack.", scene: S.shelf(), tasks: [{ item: item, rel: rel, ref: "shelf" }], skill: T_TM, hints: [G.WORDS[rel].means], why: G.sentence(nm, rel, "the cupboard") });
      } },
    { id: "g1u1-beforeafter", title: "Before and after", lesson: 5,
      gen: function (R) {
        var all = ["blue", "orange", "green", "yellow", "pink", "purple", "red"], n = 5, cols = R.shuffle(all).slice(0, n), k = R.int(1, 3), anchor = cols[k];
        var ids = ["b1", "b2", "b3", "b4", "b5"], nm = "the " + anchor + " bogie", kind = R.int(0, 3);
        if (kind === 0) return count({ kicker: "Count", prompt: "How many bogies are " + W("before") + " " + nm + "?", scene: S.train(cols), count: ids.slice(0, k), answer: k, skill: T_BA, what: "bogies", hints: ["Start at the engine. Count until you reach " + nm + "."], why: cap(many(k)) + " " + (k === 1 ? "bogie is " : "bogies are ") + W("before") + " " + nm + "." });
        if (kind === 1) return count({ kicker: "Count", prompt: "How many bogies are " + W("after") + " " + nm + "?", scene: S.train(cols), count: ids.slice(k + 1), answer: n - 1 - k, skill: T_BA, what: "bogies", hints: ["Start at " + nm + ". Count the ones behind it."], why: cap(many(n - 1 - k)) + " " + (n - 1 - k === 1 ? "bogie is " : "bogies are ") + W("after") + " " + nm + "." });
        var rel = kind === 2 ? "before" : "after", tIdx = kind === 2 ? k - 1 : k + 1, fb = {};
        ids.forEach(function (id, i) { if (i !== tIdx) fb[id] = i === k ? "That is " + nm + " itself." : (i < k) === (rel === "before") ? "That one is " + W(rel) + " " + nm + ", but not the very next one." : "That one is " + W(rel === "before" ? "after" : "before") + " " + nm + "."; });
        return tapS({ kicker: "Tap", prompt: "Tap the bogie just " + W(rel) + " " + nm + ".", scene: S.train(cols), targets: [ids[tIdx]], skill: T_BA, fb: fb, hints: [G.WORDS[rel].means], why: "That bogie is just " + W(rel) + " " + nm + "." });
      } },
    { id: "g1u1-sort", title: "Sorting into groups", lesson: 6,
      gen: function (R) {
        var attr = R.pick(["colour", "shape", "size"]), list = [], cols = R.shuffle(["red", "blue", "green"]), n = 8;
        for (var i = 0; i < n; i++) {
          var c = i < 3 ? cols[i] : R.pick(cols);
          list.push({ colour: c, shape: R.chance(0.5) ? "round" : "square", size: R.chance(0.5) ? "big" : "small" });
        }
        // make sure each value shows up at least twice, so every box has something in it
        list[0].shape = "round"; list[1].shape = "square"; list[2].size = "small"; list[3].size = "big";
        var spots = R.shuffle([[24, 18], [124, 64], [236, 16], [344, 68], [452, 18], [550, 76], [60, 120], [190, 128], [320, 122], [440, 128]]);
        list.forEach(function (b, i) { b.x = spots[i][0]; b.y = spots[i][1]; });
        var bins, labels;
        if (attr === "colour") { bins = [{ colour: cols[0] }, { colour: cols[1] }, { colour: cols[2] }]; labels = cols; }
        else if (attr === "shape") { bins = [{ shape: "round" }, { shape: "square" }]; labels = ["round", "square"]; }
        else { bins = [{ size: "big" }, { size: "small" }]; labels = ["big", "small"]; }
        var bx = bins.length === 3 ? BINS3(214, 156, bins, labels) : [0, 1].map(function (i) { return { id: "bin" + (i + 1), x: 60 + i * 280, y: 214, w: 260, h: 156, key: bins[i], label: labels[i] }; });
        return sort({ kicker: "Sort", prompt: "Sort the buttons by " + attr + ".", scene: S.buttons(list), bins: bx, rule: "key", skill: T_SO, hints: ["Look at the " + attr + " of each button."], why: "Each box has buttons with the same " + attr + "." });
      } }
  ];
  function many(n) { return K.many ? K.many(n) : String(n); }

  L.unit("g1", 1, {
    title: "Where Is Moti?", k1: true,
    end: { title: "Well done!", line: function (n, total) { return n === total ? "You got every one the first time!" : "You tried every one. Moti is proud of you!"; },
           labels: { good: "You can show", again: "Let us look again", retry: function () { return "Play those again"; } } },
    lessons: LESSONS,
    quizzes: [
      { title: "Quiz 1", after: 3, blurb: "On, under, inside, outside, above and below.", skills: ["g1u1-onunder", "g1u1-inout", "g1u1-abovebelow"], per: 2 },
      { title: "Quiz 2", after: 5, blurb: "Top, middle, bottom, before and after.", skills: ["g1u1-toprack", "g1u1-beforeafter"], per: 3 },
      { title: "Quiz 3", after: 6, blurb: "Sorting, and all the words so far.", skills: ["g1u1-sort", "g1u1-beforeafter", "g1u1-onunder"], per: 2 }
    ],
    skills: SKILLS
  });
})();
