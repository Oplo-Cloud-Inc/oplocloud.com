/* ==========================================================================
   Media Arts — Unit 9 challenges (learn/unit9.js). See learn/challenge.js.

   Each lesson's path is a handful of problems solved by doing something with
   the idea: building Freytag's pyramid from its parts, crewing a production
   from its problems, lining a cut up with its music, packing a DVD case.
   Every wrong answer that a student is likely to give has its own reply,
   aimed at the misunderstanding it shows — most of them the ones the lesson's
   notes warn about (exposition vs. inciting incident, revelation vs.
   recognition, ADR vs. revoicing, "credit isn't permission").

   Ids are permanent: a student's record is kept against them. Change a
   problem's wording freely; give it a new id only if it asks something new.
   ========================================================================== */
(function () {
  "use strict";
  var D = window.OPLO_CHALLENGE_DATA = window.OPLO_CHALLENGE_DATA || {};

  /* ---------------------------------------------------------------- Boards
     The colours written here are the light look's; each shape also carries
     a class (chb-card, chb-line, ...) that challenge.css paints from the
     tokens, so a board follows whichever look the page is in. */
  var INK = "#1d1d1f", INK3 = "#86868b", RULE = "#d2d2d7", BLUE = "#0071e3";

  // Freytag's pyramid with nothing on it — the student names the parts.
  var FREYTAG =
    '<svg viewBox="0 0 720 360" aria-hidden="true">' +
      '<defs><linearGradient id="chfg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop class="chb-stop" offset="0" stop-color="' + BLUE + '" stop-opacity=".13"/>' +
        '<stop class="chb-stop" offset="1" stop-color="' + BLUE + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="M40 290 H180 L360 72 L540 290 H680" fill="url(#chfg)" stroke="none"/>' +
      '<path class="chb-accent" d="M40 290 H180 L360 72 L540 290 H680" fill="none" stroke="' + BLUE + '" stroke-width="3.5" ' +
        'stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle class="chb-dot" cx="180" cy="290" r="6" fill="#fff" stroke="' + BLUE + '" stroke-width="3"/>' +
      '<circle class="chb-dot" cx="360" cy="72" r="6" fill="#fff" stroke="' + BLUE + '" stroke-width="3"/>' +
      '<circle class="chb-dot" cx="540" cy="290" r="6" fill="#fff" stroke="' + BLUE + '" stroke-width="3"/>' +
      '<path class="chb-line" d="M18 300 V70" stroke="' + RULE + '" stroke-width="1.5"/>' +
      '<path class="chb-line" d="m12 80 6-10 6 10" fill="none" stroke="' + RULE + '" stroke-width="1.5"/>' +
      '<text class="chb-faint" x="30" y="68" font-size="11" fill="' + INK3 + '" font-family="-apple-system, sans-serif">tension</text>' +
      '<text class="chb-faint" x="686" y="344" text-anchor="end" font-size="11" fill="' + INK3 + '" font-family="-apple-system, sans-serif">time →</text>' +
    "</svg>";

  // A music bed in four passages over an empty video track.
  function wave() {
    var parts = [
      { from: 20, to: 190, lo: 6, hi: 13, step: 7 },    // soft, slow
      { from: 190, to: 360, lo: 26, hi: 40, step: 4 },  // fast, driving
      { from: 360, to: 530, lo: 9, hi: 19, step: 8 },   // slow, minor key
      { from: 530, to: 700, lo: 36, hi: 44, step: 5 }   // loud, full orchestra
    ];
    var d = "", seed = 7;
    parts.forEach(function (p) {
      for (var x = p.from + 12; x < p.to - 9; x += p.step) {
        seed = (seed * 9301 + 49297) % 233280;
        var h = p.lo + (p.hi - p.lo) * (seed / 233280);
        d += "M" + x + " " + (104 - h).toFixed(1) + "V" + (104 + h).toFixed(1);
      }
    });
    var labels = ["soft, slow", "fast, driving", "slow, minor key", "loud, full orchestra"];
    return '<svg viewBox="0 0 720 300" aria-hidden="true">' +
      '<text class="chb-faint" x="22" y="24" font-size="11" font-weight="600" fill="' + INK3 + '" font-family="-apple-system, sans-serif" letter-spacing=".06em">MUSIC BED</text>' +
      parts.map(function (p, i) {
        return '<rect class="chb-card" x="' + (p.from + 2) + '" y="36" width="' + (p.to - p.from - 4) + '" height="136" rx="10" fill="#fff" stroke="' + RULE + '"/>' +
          '<text class="chb-ink" x="' + (p.from + 12) + '" y="56" font-size="11.5" fill="' + INK + '" font-family="-apple-system, sans-serif">' + labels[i] + "</text>";
      }).join("") +
      '<path class="chb-accent" d="' + d + '" stroke="' + BLUE + '" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' +
      '<text class="chb-faint" x="22" y="198" font-size="11" font-weight="600" fill="' + INK3 + '" font-family="-apple-system, sans-serif" letter-spacing=".06em">VIDEO</text>' +
      '<rect class="chb-line" x="20" y="206" width="680" height="80" rx="12" fill="none" stroke="' + RULE + '" stroke-dasharray="4 5"/>' +
    "</svg>";
  }

  // A disc and an opened-out case: back, spine, front.
  var DVD =
    '<svg viewBox="0 0 720 340" aria-hidden="true">' +
      '<circle class="chb-card" cx="132" cy="185" r="112" fill="#fff" stroke="' + RULE + '" stroke-width="1.5"/>' +
      '<circle class="chb-soft" cx="132" cy="185" r="40" fill="none" stroke="#ececee" stroke-width="1.5"/>' +
      '<circle class="chb-well" cx="132" cy="185" r="15" fill="#f5f5f7" stroke="' + RULE + '" stroke-width="1.5"/>' +
      '<rect class="chb-card" x="282" y="70" width="186" height="236" rx="6" fill="#fff" stroke="' + RULE + '" stroke-width="1.5"/>' +
      '<rect class="chb-well" x="468" y="70" width="34" height="236" fill="#f5f5f7" stroke="' + RULE + '" stroke-width="1.5"/>' +
      '<rect class="chb-card" x="502" y="70" width="186" height="236" rx="6" fill="#fff" stroke="' + RULE + '" stroke-width="1.5"/>' +
      '<path class="chb-line" d="M485 64 V40" stroke="' + RULE + '" stroke-width="1.5" stroke-dasharray="3 4"/>' +
    "</svg>";

  /* ======================================================================
     9.1 — The People Behind the Screen
     ====================================================================== */
  D["media:9"] = {};
  D["media:9"]["9.1"] = {
    title: "The People Behind the Screen",
    blurb: "Four pioneers, and the crew any production runs on.",
    steps: [
      {
        id: "m9-1-pioneers", type: "slots", skill: "Match each pioneer to their work",
        prompt: "Four people who built the industry. Give each the work that is theirs.",
        slots: [
          { id: "g", label: "Matt Groening" },
          { id: "m", label: "Shigeru Miyamoto" },
          { id: "s", label: "Steven Spielberg" },
          { id: "d", label: "Walt Disney" }
        ],
        cards: [
          { t: "The Simpsons", slot: "g", fb: "The Simpsons is Groening's — he started out drawing for his college newspaper." },
          { t: "Mario and The Legend of Zelda", slot: "m", fb: "Mario and Zelda are Miyamoto's, at Nintendo." },
          { t: "Jaws and E.T.", slot: "s", fb: "Jaws and E.T. are Spielberg's — the films that defined the blockbuster." },
          { t: "Snow White and the Seven Dwarfs", slot: "d", fb: "Snow White (1937) is Disney's — the first full-length cel-animated feature from an American studio." },
          { t: "Toy Story", slot: null, fb: "Toy Story is Pixar's (1995). None of these four made it — it stays in the tray." }
        ],
        hints: ["One card belongs to nobody here. Leave it in the tray.",
                "Two of the four worked in games or TV; two in film. Nintendo is a games company."],
        why: "Each of them started as a fan of someone else's work: Groening names <em>Peanuts</em>, and <em>Space Invaders</em> pulled Miyamoto toward games. Knowing what inspired them is a way to find what inspires you."
      },
      {
        id: "m9-1-inspire", type: "choice", skill: "Connect a creator's inspiration to their work",
        prompt: "A student says: <em>“As a kid I spent every afternoon exploring the woods and caves near my house. I want players to feel that.”</em> Whose story does that echo?",
        options: [
          { t: "Shigeru Miyamoto" },
          { t: "Matt Groening", fb: "Groening's roots are cartoons for a college paper and a family sitcom — nothing about exploring a place." },
          { t: "Steven Spielberg", fb: "Spielberg's childhood story is home movies — famously, crashing his toy trains on film." },
          { t: "Walt Disney", fb: "Disney took art classes and worked as a commercial illustrator. The woods and caves are someone else's childhood." }
        ],
        answer: 0,
        hints: ["Which of the four builds places you walk around inside?"],
        why: "Miyamoto grew up in Sonobe, exploring the countryside near his home — and the feeling of discovering a place is built into Zelda."
      },
      {
        id: "m9-1-crew", type: "slots", skill: "Match a production's problems to its crew",
        prompt: "Six problems on one production. Who do you call for each?",
        slots: [
          { id: "prod", label: "Nobody has paid for the film yet, and nobody is hired." },
          { id: "env", label: "The floating castle the story happens in doesn't exist yet." },
          { id: "anim", label: "The hero looks slightly different in every animator's drawings." },
          { id: "dop", label: "Scene 12 has to be lit and framed like a thunderstorm through the lens." },
          { id: "comp", label: "The finale needs music that swells as the ship lifts off." },
          { id: "ed", label: "Four hours of chase footage has to become a three-minute sequence." }
        ],
        cards: [
          { t: "Producer", slot: "prod", fb: "Money and hiring are the producer's job — they find the funding and oversee the whole production." },
          { t: "Layout / environment artist", slot: "env", fb: "Places and backgrounds are the layout or environment artist's." },
          { t: "Head animator", slot: "anim", fb: "The head animator designs the characters and approves everyone else's drawings — so they stay consistent." },
          { t: "Director of photography", slot: "dop", fb: "How a shot is lit and framed through the camera is the director of photography's call." },
          { t: "Composer", slot: "comp", fb: "Music that carries a scene's feeling is the composer's." },
          { t: "Editor", slot: "ed", fb: "Cutting footage into the finished piece is the editor's job." },
          { t: "Technical director", slot: null, fb: "A technical director finds and runs the technology. None of these six is a problem with tools — it stays in the tray." }
        ],
        hints: ["One card is left over. Which job is about technology rather than story, look, sound or money?",
                "Framing and lighting through the camera: the director of photography. Designing and approving characters: the head animator."],
        why: "When a piece of media grabs you, ask which part grabbed you. That part is somebody's job."
      },
      {
        id: "m9-1-timeline", type: "order", skill: "Place the pioneers on a timeline",
        prompt: "Put these moments in the order they happened.",
        items: [
          "Walt and Roy Disney start their Hollywood studio",
          "Mickey Mouse first appears",
          "Snow White and the Seven Dwarfs is released",
          "Disneyland opens",
          "Shigeru Miyamoto joins Nintendo",
          "The Simpsons begins as a half-hour series"
        ],
        nudge: "Disney's milestones run from the 1920s to the 1950s; Nintendo and The Simpsons come decades later.",
        hints: ["The studio: 1923. Mickey: 1928. Snow White: 1937. Disneyland: 1955.",
                "Miyamoto joined Nintendo in 1977; The Simpsons series began in 1989."],
        why: "Sixty-six years separate the first and the last — and each of these people grew up on the work of the one before."
      },
      {
        id: "m9-1-disney", type: "multi", skill: "Recall Walt Disney's firsts",
        prompt: "Which of these are true of Walt Disney? Pick every one.",
        options: [
          { t: "He won more Oscars than any other person — 22 competitive awards.", ok: true },
          { t: "He was the first voice of Mickey Mouse.", ok: true },
          { t: "He opened Disneyland in 1955.", ok: true },
          { t: "He co-founded DreamWorks.", ok: false, fb: "DreamWorks was co-founded by Steven Spielberg, in 1994 — long after Disney's death." },
          { t: "He created Donkey Kong.", ok: false, fb: "Donkey Kong is Shigeru Miyamoto's, at Nintendo." }
        ],
        hints: ["Two of the five belong to other people in this lesson."],
        why: "Disney's 22 competitive Oscars came from 59 nominations — still the record for one person."
      }
    ]
  };

  /* ======================================================================
     9.2 — Pitching a Story
     ====================================================================== */
  D["media:9"]["9.2"] = {
    title: "Pitching a Story",
    blurb: "Build Freytag's pyramid, find the inciting incident, name the conflict.",
    steps: [
      {
        id: "m9-2-pyramid", type: "slots", skill: "Build Freytag's pyramid",
        prompt: "The line is a story's tension over time. Name each part of it.",
        board: { svg: FREYTAG, ratio: "2 / 1" },
        slots: [
          { id: "exp", x: 15, y: 67, w: 20, aria: "the flat start, on the left" },
          { id: "inc", x: 25, y: 92, w: 21, aria: "the point where the line starts to rise" },
          { id: "ris", x: 22, y: 42, w: 20, aria: "the rising slope" },
          { id: "cli", x: 50, y: 9, w: 19, aria: "the peak" },
          { id: "fal", x: 78, y: 42, w: 20, aria: "the falling slope" },
          { id: "res", x: 85, y: 67, w: 20, aria: "the flat end, on the right" }
        ],
        cards: [
          { t: "Exposition", slot: "exp", fb: "Exposition is the flat start: characters and setting, before anything goes wrong." },
          { t: "Inciting incident", slot: "inc", fb: "The inciting incident is the point where the line starts to climb — the event that starts the problem." },
          { t: "Rising action", slot: "ris", fb: "Rising action is the long climb: each event raises the stakes." },
          { t: "Climax", slot: "cli", fb: "The climax is the peak — the moment of greatest tension, where the story turns." },
          { t: "Falling action", slot: "fal", fb: "Falling action is the way down after the climax, as the conflict unwinds." },
          { t: "Resolution", slot: "res", fb: "Resolution — the denouement — is the flat end: a new normal." }
        ],
        hints: ["Height is tension. Where is a story tensest?",
                "The line starts to climb at one exact point — the event the main character can't ignore."],
        why: "Gustav Freytag described this shape in 1863. A pitch walks through it in order so the listener sees the whole story."
      },
      {
        id: "m9-2-maya", type: "slots", skill: "Label the parts of a real plot",
        prompt: "Here is a short film, told out of order. Label each moment with its part of the pyramid.",
        slots: [
          { id: "c", label: "Mid-song at the finals, a guitar string snaps — and Maya holds the whole song together with a drum solo." },
          { id: "a", label: "Maya, a shy drummer, practises alone in her garage every night." },
          { id: "f", label: "Back in the garage, Maya practises — with the door open now." },
          { id: "b", label: "A week before the city finals, the school band loses its drummer." },
          { id: "e", label: "The band walks off stage, arguing and laughing, waiting for the results." },
          { id: "d", label: "She auditions, clashes with the lead guitarist, and rehearses until her hands blister." }
        ],
        cards: [
          { t: "Exposition", slot: "a", fb: "Exposition is normal life before the problem: Maya alone in her garage." },
          { t: "Inciting incident", slot: "b", fb: "The inciting incident is the event that pulls Maya out of her routine: the band losing its drummer." },
          { t: "Rising action", slot: "d", fb: "Rising action raises the stakes: the audition, the clash, the blisters." },
          { t: "Climax", slot: "c", fb: "The climax is the moment of greatest tension — the string snapping on stage." },
          { t: "Falling action", slot: "e", fb: "Falling action is the tension unwinding after the climax: walking off, waiting." },
          { t: "Resolution", slot: "f", fb: "Resolution is the new normal: the same garage, but the door is open." }
        ],
        hints: ["Find the calmest moment that comes before anything happens. Then find the one that changes it.",
                "Two moments are in the garage. One is before the story, one after — which shows Maya has changed?"],
        why: "The resolution often echoes the exposition with one difference. That difference is what the story was about."
      },
      {
        id: "m9-2-nemo", type: "choice", skill: "Tell the inciting incident from the exposition",
        prompt: "In <em>Finding Nemo</em>, which is the inciting incident?",
        options: [
          { t: "Nemo and his careful father, Marlin, living on the reef", fb: "That's the exposition — normal life before the problem. The inciting incident is the event that breaks it." },
          { t: "A diver takes Nemo" },
          { t: "Marlin and Dory inside the whale", fb: "By then the problem is well under way — that's rising action." },
          { t: "Marlin and Nemo together again", fb: "That comes after the climax, as the story resolves." }
        ],
        answer: 1,
        hints: ["The inciting incident isn't the first thing that happens. It's the first thing that goes wrong."],
        why: "Everything before the diver is exposition. The diver is the event Marlin can't ignore — the plot really starts there."
      },
      {
        id: "m9-2-conflict", type: "sort", skill: "Classify types of conflict",
        prompt: "Sort each story by its central conflict.",
        bins: ["Character vs. character", "Character vs. nature", "Character vs. self"],
        cards: [
          { t: "Two chefs compete for the same restaurant", bin: 0, fb: "The chefs want the same thing — that's two characters against each other." },
          { t: "A detective hunts a jewel thief", bin: 0, fb: "Detective against thief: character vs. character." },
          { t: "A climber is trapped by an avalanche", bin: 1, fb: "An avalanche is nature. Character vs. nature." },
          { t: "Castaways ration water after a shipwreck", bin: 1, fb: "Survival after a shipwreck is character vs. nature." },
          { t: "A student can't decide whether to report a friend who cheated", bin: 2, fb: "The friend is there, but the struggle is inside the student — the decision is the conflict. That's character vs. self." },
          { t: "A pianist fights her stage fright before a recital", bin: 2, fb: "Stage fright is inside her. Character vs. self — an internal conflict." }
        ],
        hints: ["Ask: what is the character fighting against — another person, the world, or something inside them?",
                "Another person can be in the story without being the conflict. Where is the struggle actually happening?"],
        why: "The first two are external conflicts; character vs. self is internal. The course calls them man vs. man, man vs. nature and man vs. himself."
      },
      {
        id: "m9-2-pitch", type: "multi", skill: "Know what goes into a pitch",
        prompt: "You have two minutes with a studio editor. What should your pitch include? Pick every one.",
        options: [
          { t: "What happens — the plot, in order", ok: true },
          { t: "The conflict at the centre of the story", ok: true },
          { t: "Why it's worth making", ok: true },
          { t: "The ending — kept secret, to build suspense", ok: false, fb: "A pitch isn't a trailer. The editor needs the whole shape, ending included, to decide." },
          { t: "The complete script, read aloud", ok: false, fb: "A pitch is a description, not the script — the editor needs the shape fast." }
        ],
        hints: ["Editors look for organisation: the story's whole shape, and a reason to care."],
        why: "A pitch walks through the plot in order, and says why it matters. Spoken or written, the structure is the same."
      },
      {
        id: "m9-2-elevator", type: "explain", skill: "Write an elevator pitch",
        prompt: "Give Maya's story as an elevator pitch — thirty seconds, two or three sentences.",
        placeholder: "A shy drummer who…",
        model: "A shy drummer who has only ever played alone in her garage gets one week to join her school band before the city finals. " +
               "Clashing with the band and fighting her nerves, she has to hold the whole song together when it falls apart on stage. " +
               "It's about finding your voice — and anyone who has practised alone will feel it."
      }
    ]
  };

  /* ======================================================================
     9.3 — Developing Character
     ====================================================================== */
  D["media:9"]["9.3"] = {
    title: "Developing Character",
    blurb: "Show a little, hide a lot — and the scene types that reveal the rest.",
    steps: [
      {
        id: "m9-3-iceberg", type: "choice", skill: "Apply the iceberg theory",
        prompt: "Leo's friends have forgotten his birthday. Which line follows the iceberg theory best?",
        options: [
          { t: "“You forgot my birthday,” said Leo, who had felt forgotten ever since his father left.", fb: "It tells us his feeling and his whole backstory. There's nothing left under the water." },
          { t: "Leo looked at the cake, then at the clock. He put one candle back in the box." },
          { t: "Leo was sad. He was sad because nobody remembered.", fb: "This says the feeling outright — twice. The iceberg theory lets the audience work it out." },
          { t: "Leo, a lonely boy with abandonment issues, sat down.", fb: "It labels the character instead of showing him. We're told who he is rather than finding out." }
        ],
        answer: 1,
        hints: ["Which one never names a feeling — but you know exactly how he feels anyway?"],
        why: "Nothing is said about sadness, yet the candle going back in the box says it. That hidden part is the iceberg below the water."
      },
      {
        id: "m9-3-show", type: "spot", many: true, skill: "Spot telling instead of showing",
        prompt: "Tap every sentence that <em>tells</em> the audience what's under the water, rather than letting them work it out.",
        parts: [
          "Mara checked the lock three times before she left.",
          "She was terrified of being robbed again.",
          "At the bus stop she stood with her back to the wall.",
          "Ever since the break-in last winter, she had trusted no one.",
          "When a stranger asked her the time, she answered without looking up."
        ],
        answer: [1, 3],
        fb: {
          0: "Checking the lock is something she does — we guess the fear from it. That's showing.",
          2: "Standing with her back to the wall is an action. The audience works out why — that's the iceberg working.",
          4: "Not looking up is behaviour, not explanation. That one shows."
        },
        hints: ["Look for sentences that name a feeling or explain the past.", "There are two."],
        why: "Cut the two telling sentences and the passage still says everything — more strongly, because the reader works it out."
      },
      {
        id: "m9-3-scenes", type: "slots", skill: "Identify scene types",
        prompt: "What type of scene is each one?",
        slots: [
          { id: "rev", label: "The audience watches the villain swap the medicine bottles. The hero has no idea." },
          { id: "rec", label: "Hours later, the hero reads the label and realises what happened." },
          { id: "aft", label: "The whole town gathers at the ruins the morning after the fire." },
          { id: "gift", label: "The pocket watch her grandmother gave her in scene 2 stops a bullet in the finale." },
          { id: "opp", label: "Two rivals are handcuffed together and have to cross the desert." },
          { id: "vis", label: "A stranger knocks on the door in the middle of the family's dinner." }
        ],
        cards: [
          { t: "Revelation", slot: "rev", fb: "When the audience learns a secret the characters don't know, that's a revelation." },
          { t: "Recognition", slot: "rec", fb: "When a character finally learns what the audience already knew, that's recognition." },
          { t: "Aftermath", slot: "aft", fb: "Characters reacting to an event or tragedy: an aftermath scene." },
          { t: "The gift", slot: "gift", fb: "An object seen early that returns with meaning later is the gift." },
          { t: "Opposites", slot: "opp", fb: "Two characters in conflict forced to work together: opposites." },
          { t: "Unexpected visitor", slot: "vis", fb: "A new character arrives and causes trouble: the unexpected visitor." },
          { t: "Transition", slot: null, fb: "A transition just moves characters from one place to another. None of these is that — it stays in the tray." }
        ],
        hints: ["One card is left over.", "Revelation and recognition: who learns the secret — the audience, or a character?"],
        why: "Every scene should add to character, conflict, plot or exposition. Each of these types is a tested way of doing one of those jobs."
      },
      {
        id: "m9-3-recog", type: "choice", skill: "Tell revelation from recognition",
        prompt: "In a horror film, the audience sees the monster hiding in the closet. Three scenes later, the character opens the closet. Which scene is the <em>recognition</em>?",
        options: [
          { t: "When the audience first sees the monster", fb: "That's the revelation — the audience learns the secret first." },
          { t: "When the character opens the closet" },
          { t: "Both — they're the same kind of scene", fb: "They're a pair, but not the same: in one the audience learns, in the other a character does." },
          { t: "Neither — it's a pursuit scene", fb: "Nobody is chasing anyone yet. This is about who knows what, and when." }
        ],
        answer: 1,
        hints: ["Recognition is when a character finally discovers something."],
        why: "The gap between the revelation and the recognition is where the suspense lives: we know, and they don't yet."
      },
      {
        id: "m9-3-keep", type: "multi", skill: "Judge whether a scene earns its place",
        prompt: "A scene is about to be cut. Which of these are good enough reasons to keep it? Pick every one.",
        options: [
          { t: "It shows us something new about a character", ok: true },
          { t: "It adds to the conflict", ok: true },
          { t: "It moves the plot forward", ok: true },
          { t: "It gives exposition the audience needs", ok: true },
          { t: "It has a beautiful shot that took a week to film", ok: false, fb: "A beautiful shot that does none of the four jobs still gets cut — however long it took." }
        ],
        hints: ["The lesson names four jobs a scene can do."],
        why: "Character, conflict, plot, exposition. A scene that does none of them gets cut."
      }
    ]
  };

  /* ======================================================================
     9.4 — Creating Storyboards
     ====================================================================== */
  D["media:9"]["9.4"] = {
    title: "Creating Storyboards",
    blurb: "From finished story to camera directions, panel by panel.",
    steps: [
      {
        id: "m9-4-process", type: "order", skill: "Sequence the storyboard process",
        prompt: "Put the steps for making a storyboard in order.",
        items: [
          "Finish writing the story",
          "Number every scene in an outline",
          "Picture each event before drawing it",
          "Draw each shot on its own panel",
          "Add the visual treatment — angles, shot types, movement"
        ],
        nudge: "Nothing can be boarded until the story exists — and camera directions go on panels that are already drawn.",
        hints: ["The first step happens before anything is drawn at all.", "Each number in the outline becomes a panel."],
        why: "Each numbered event becomes a panel; the visual treatment adds the cinematography to every one."
      },
      {
        id: "m9-4-treatment", type: "choice", skill: "Know what the visual treatment adds",
        prompt: "The director asks: “In panel 14, does the camera push in on the note, or stay wide?” Which step of the storyboard decides that?",
        options: [
          { t: "The visual treatment" },
          { t: "Numbering the scenes", fb: "Numbering decides what the panels are, not how each one is shot." },
          { t: "Casting", fb: "Casting chooses who is in the scene, not where the camera goes." },
          { t: "Editing", fb: "By editing, it's already been filmed. A storyboard decides this before a single frame is shot." }
        ],
        answer: 0,
        hints: ["Which step adds the camera angle, shot type and camera movement to each panel?"],
        why: "The visual treatment puts the camera directions on every panel, so everyone knows exactly how each moment will be filmed."
      },
      {
        id: "m9-4-why", type: "multi", skill: "Explain what a storyboard is for",
        prompt: "Why storyboard at all? Pick every real reason.",
        options: [
          { t: "So no shot is left out", ok: true },
          { t: "So each shot is framed the way it was planned", ok: true },
          { t: "So the director can estimate the timing", ok: true },
          { t: "So everyone has a reference during the shoot", ok: true },
          { t: "So the script doesn't need to be finished first", ok: false, fb: "It's the other way round: the story must be finished before it can be boarded." },
          { t: "Because only animated films need one", ok: false, fb: "Live-action films, shows and adverts are storyboarded too." }
        ],
        hints: ["Two of these are myths. The other four are all in the lesson."],
        why: "A storyboard is where a director finds out what doesn't work while it's still cheap to fix."
      },
      {
        id: "m9-4-cards", type: "choice", skill: "Know why panels go on separate cards",
        prompt: "Panel 9 of 40 is wrong: the angle makes the hero look small when she should look powerful. Why is it cheap to fix?",
        options: [
          { t: "Each panel is on its own card, so only that one is redrawn" },
          { t: "Storyboards are made in post-production, after filming", fb: "Storyboards are pre-production — and that's exactly why fixes are cheap: nothing has been shot yet." },
          { t: "The editor can fix the angle later", fb: "An editor can cut a shot but can't change the angle it was filmed from. The board is where that's decided." },
          { t: "Storyboards have to be made on a computer", fb: "Paper or computer both work. The separate panel is the trick." }
        ],
        answer: 0,
        hints: ["Think about what happens to the other 39 panels."],
        why: "A panel that doesn't work can be pulled out and redrawn without touching the rest — far cheaper than re-shooting."
      },
      {
        id: "m9-4-pre", type: "sort", skill: "Place work in pre-production",
        prompt: "Which of these happen in pre-production?",
        bins: ["Pre-production (before filming)", "During or after filming"],
        cards: [
          { t: "Writing the script", bin: 0 },
          { t: "Casting", bin: 0 },
          { t: "Storyboarding", bin: 0, fb: "Storyboards come before filming — that's their whole point." },
          { t: "Scheduling the shoot", bin: 0, fb: "A schedule has to exist before the shoot it schedules." },
          { t: "Filming scene 12", bin: 1 },
          { t: "Syncing footage to the music bed", bin: 1, fb: "Syncing needs footage that exists — that's after filming." },
          { t: "Recording foley", bin: 1, fb: "Foley is performed to the finished picture, so it comes after filming." }
        ],
        hints: ["Pre-production is all the planning: writing, planning, storyboarding, casting, scheduling."],
        why: "Pre-production is everything before the cameras roll. The storyboard sits right in the middle of it."
      }
    ]
  };

  /* ======================================================================
     9.5 — The Music Bed
     ====================================================================== */
  D["media:9"]["9.5"] = {
    title: "The Music Bed",
    blurb: "Choose the feeling first, then the music — and get the rights.",
    steps: [
      {
        id: "m9-5-match", type: "slots", skill: "Match music to a scene's mood",
        prompt: "Score each scene. Which music bed fits?",
        slots: [
          { id: "chase", label: "A car chase through the city at night" },
          { id: "funeral", label: "A grandmother's funeral, in the rain" },
          { id: "park", label: "A child's first day at a theme park" },
          { id: "creep", label: "Someone creeping through an abandoned house" }
        ],
        cards: [
          { t: "Fast, driving drums", slot: "chase", fb: "A chase needs intense, driving music — a slow track under a chase feels wrong." },
          { t: "Slow solo piano", slot: "funeral", fb: "Grief wants something slow and bare. Slow solo piano." },
          { t: "Bright, bouncy brass", slot: "park", fb: "Joy and excitement: bright, bouncy brass." },
          { t: "Low strings, and long silences", slot: "creep", fb: "Suspense lives in low sustained notes and silence." },
          { t: "A gentle harp lullaby", slot: null, fb: "Lovely — but no scene here calls for calm and safe. It stays in the tray." }
        ],
        hints: ["Start from the feeling each scene should give, not the instruments.", "One card fits none of them."],
        why: "Music is about emotion. The same shot feels triumphant with one track and tragic with another."
      },
      {
        id: "m9-5-steps", type: "order", skill: "Sequence choosing a music bed",
        prompt: "Put the steps for choosing a music bed in order.",
        items: [
          "Decide how viewers should feel",
          "Set the mood of each scene",
          "Match music to each scene",
          "Get the rights to use it"
        ],
        nudge: "Start from the feeling, not the song — and rights come once you know what you want.",
        hints: ["The lesson's first rule: start from the feeling, not the song."],
        why: "Feeling, then mood, then music, then rights. A whole film usually uses several styles."
      },
      {
        id: "m9-5-rights", type: "multi", skill: "Get the rights to music",
        prompt: "Where can you legally get a music bed for your film? Pick every one.",
        options: [
          { t: "Compose it yourself", ok: true },
          { t: "Buy a licence for a track", ok: true },
          { t: "Use a royalty-free or open-licence library", ok: true },
          { t: "Any song online, as long as you credit the artist", ok: false, fb: "Credit isn't permission. Without a licence you can't use it, however you credit it." },
          { t: "A chart hit, if you use less than 30 seconds", ok: false, fb: "There's no free-seconds rule. A short clip still needs a licence." }
        ],
        hints: ["Two of these are common myths about copyright."],
        why: "Music is rarely free. Compose it, license it, or use a library that grants the rights."
      },
      {
        id: "m9-5-mix", type: "choice", skill: "Balance dialogue and music",
        prompt: "In the final mix, a line of dialogue is buried under the music. What's the fix?",
        options: [
          { t: "Turn the music down under the line" },
          { t: "Turn the dialogue down so the music carries the scene", fb: "Dialogue is usually the most important thing the audience hears. The music is set around it, not over it." },
          { t: "Replace the music with foley", fb: "Foley is everyday sound effects — it wouldn't make the line any clearer." },
          { t: "Cut the line", fb: "The line is there for a reason. Make room for it instead." }
        ],
        answer: 0,
        hints: ["Which matters more to the audience at that moment?"],
        why: "In the mix, dialogue sits on top: the music is turned down under speech so every line is clear."
      },
      {
        id: "m9-5-voices", type: "choice", skill: "Know when dialogue is recorded",
        prompt: "In an animated film, when are the voices usually recorded?",
        options: [
          { t: "Before the animation, so animators can match the mouths to them" },
          { t: "Last of all, after the music is chosen", fb: "That's the course's line, and it's true of the mix — dialogue is balanced last so it sits on top. But the voices themselves are usually recorded first." },
          { t: "On set, during filming", fb: "That's live action. An animated film has no set to record on." },
          { t: "Never — the voices are generated from the script", fb: "Voice actors perform the lines. It's one of the jobs in 9.1." }
        ],
        answer: 0,
        hints: ["Think about the mouths. What do animators need before they can draw them?"],
        why: "Voices first, so the mouths can match. If a test asks when dialogue comes in the course's sense, it means the mix: dialogue is balanced last."
      }
    ]
  };

  /* ======================================================================
     9.6 — Visual Style Planning
     ====================================================================== */
  D["media:9"]["9.6"] = {
    title: "Visual Style Planning",
    blurb: "Name the technique, read a style test, and keep a character consistent.",
    steps: [
      {
        id: "m9-6-tech", type: "slots", skill: "Identify animation techniques",
        prompt: "Name the technique each description is about.",
        slots: [
          { id: "lim", label: "Only the talking character's mouth is redrawn; the rest of the frame stays put." },
          { id: "stop", label: "Clay figures are moved a hair and photographed, frame after frame." },
          { id: "pix", label: "Real actors pose frame by frame, so they move like puppets." },
          { id: "rig", label: "A skeleton of joints is added so a 3D model can be posed." },
          { id: "tex", label: "A photo of bark is wrapped around a 3D tree trunk." },
          { id: "trad", label: "Every frame is drawn by hand on paper." }
        ],
        cards: [
          { t: "Limited animation", slot: "lim", fb: "Redrawing only the part that moves is limited animation — a budget shortcut." },
          { t: "Stop motion", slot: "stop", fb: "Real objects, moved and photographed frame by frame: stop motion." },
          { t: "Pixilation", slot: "pix", fb: "Stop motion with live actors as the subject is pixilation." },
          { t: "Rigging", slot: "rig", fb: "A skeleton of joints for posing is a rig." },
          { t: "Texture mapping", slot: "tex", fb: "Wrapping a surface image onto a 3D model is texture mapping." },
          { t: "Traditional animation", slot: "trad", fb: "Every frame by hand: traditional, or classical, animation." },
          { t: "3D modelling", slot: null, fb: "3D modelling builds the shape itself. None of these rows is about building the shape — it stays in the tray." }
        ],
        hints: ["One card is left over.", "Stop motion and pixilation are the same method. What's different is the subject."],
        why: "Pixilation is stop motion with people. Texture mapping and rigging both come after a 3D model is built."
      },
      {
        id: "m9-6-styletest", type: "choice", skill: "Read a style test",
        prompt: "A studio wants a fast, fight-heavy action film. Their stop-motion style test took three weeks to make ten seconds. What has the test told them?",
        options: [
          { t: "Stop motion probably doesn't suit this story" },
          { t: "Their animators need to work faster", fb: "Speed isn't the animators' fault. In stop motion every movement has to be posed and photographed — that's the technique." },
          { t: "Style tests are always slow, so carry on", fb: "Finding this out before the budget is spent is the whole point of the test." },
          { t: "They should switch to pixilation", fb: "Pixilation is still stop motion, frame by frame — the same problem, with actors." }
        ],
        answer: 0,
        hints: ["What is a style test for?"],
        why: "A style test checks that the technique suits the story before full production. Quick action is slow and costly to pose by hand."
      },
      {
        id: "m9-6-model", type: "choice", skill: "Use a model sheet",
        prompt: "A film follows its hero across a whole year. Which document stops her wearing a summer dress in a snowstorm?",
        options: [
          { t: "The model sheet" },
          { t: "The shot list", fb: "A shot list lists the shots in words. It doesn't show how she looks." },
          { t: "The storyboard", fb: "The storyboard shows each shot, not her outfits and expressions across the year." },
          { t: "The style test", fb: "A style test checks the technique, not one character's wardrobe." }
        ],
        answer: 0,
        hints: ["Which document shows a character from every angle, in every expression and outfit?"],
        why: "A model sheet keeps a character consistent — and right for each scene — across the whole production."
      },
      {
        id: "m9-6-lists", type: "sort", skill: "Compare storyboards and shot lists",
        prompt: "Storyboard, shot list, or both?",
        bins: ["Storyboard", "Both", "Shot list"],
        cards: [
          { t: "Drawn, panel by panel", bin: 0 },
          { t: "Shows the camera angle as a picture", bin: 0 },
          { t: "Every shot, in order", bin: 1, fb: "Both list every shot in order — one in drawings, one in words." },
          { t: "Made before filming starts", bin: 1, fb: "Both are pre-production." },
          { t: "Written in words", bin: 2 },
          { t: "Says who is needed for each shot", bin: 2, fb: "The shot list says who's needed. A storyboard shows what the shot looks like." }
        ],
        hints: ["A shot list is “like a storyboard, but written rather than drawn”."],
        why: "Same job, different form: the storyboard draws each shot, the shot list writes it down — with who is needed."
      },
      {
        id: "m9-6-rig", type: "choice", skill: "Know what rigging does",
        prompt: "A 3D dragon is finished and textured, but it's frozen in the pose it was built in. What's missing?",
        options: [
          { t: "Rigging" },
          { t: "Texture mapping", fb: "It's already textured. Texture gives it scales, not movement." },
          { t: "3D modelling", fb: "It's already modelled — the shape exists." },
          { t: "Limited animation", fb: "Limited animation is a 2D shortcut for redrawing only what moves." }
        ],
        answer: 0,
        hints: ["What gives a model joints?"],
        why: "Without a rig, a model is stuck in the pose it was built in. The rig is its skeleton."
      }
    ]
  };

  /* ======================================================================
     9.7 — Finalizing Footage
     ====================================================================== */
  D["media:9"]["9.7"] = {
    title: "Finalizing Footage",
    blurb: "Cut it, time it, sync it — then frame it with credits.",
    steps: [
      {
        id: "m9-7-steps", type: "order", skill: "Sequence finalizing footage",
        prompt: "Put the three steps for finalizing footage in order.",
        items: [
          "Import the footage and lay it on the timeline",
          "Edit and time it to the planned length",
          "Sync it to the music bed"
        ],
        nudge: "You can't cut what isn't on the timeline, and you can't sync a cut that isn't finished.",
        hints: ["Syncing needs a finished cut."],
        why: "Import, edit, sync — always in that order. And edit from the beginning to the end: an edit set aside for later gets forgotten."
      },
      {
        id: "m9-7-sync", type: "slots", skill: "Sync footage to the music bed",
        prompt: "The music bed is finished. Lay each clip under the passage it belongs with.",
        board: { svg: wave(), ratio: "12 / 5" },
        slots: [
          { id: "1", x: 14.6, y: 82, w: 21.5, aria: "under the soft, slow passage" },
          { id: "2", x: 38.2, y: 82, w: 21.5, aria: "under the fast, driving passage" },
          { id: "3", x: 61.8, y: 82, w: 21.5, aria: "under the slow, minor-key passage" },
          { id: "4", x: 85.4, y: 82, w: 21.5, aria: "under the loud, full-orchestra passage" }
        ],
        cards: [
          { t: "Sunrise over a sleeping town", slot: "1", fb: "A quiet opening image sits under the soft, slow passage." },
          { t: "The downhill bike race", slot: "2", fb: "The race is the action — it goes under the fast, driving music." },
          { t: "She loses, and walks her bike home", slot: "3", fb: "Losing and walking home is the sad, quiet moment — the slow, minor-key passage." },
          { t: "A year later, she crosses the line first", slot: "4", fb: "The triumph goes under the biggest music — the full orchestra." }
        ],
        hints: ["Match the music's fast and slow passages to the action-filled and quieter scenes."],
        why: "Music and footage sit on separate tracks, one above the other — which is what lets you see where they line up."
      },
      {
        id: "m9-7-cards", type: "slots", skill: "Count names on a title card",
        prompt: "What kind of title card is each one?",
        slots: [
          { id: "t", label: '<span class="ch-tc">Ana Ruiz · Leo Park · Sam Okafor</span>', aria: "three names" },
          { id: "s", label: '<span class="ch-tc"><small>starring</small>Ana Ruiz</span>', aria: "one name" },
          { id: "m", label: '<span class="ch-tc"><small>with</small>Jo Kim · Raj Das · Mei Lin · Tom Bell</span>', aria: "four names" },
          { id: "d", label: '<span class="ch-tc">Ana Ruiz · Leo Park</span>', aria: "two names" }
        ],
        cards: [
          { t: "Single card", slot: "s", fb: "One name is a single card." },
          { t: "Double card", slot: "d", fb: "Two names is a double card." },
          { t: "Triple card", slot: "t", fb: "Three names is a triple card." },
          { t: "Multiple card", slot: "m", fb: "More than three names is a multiple card — used for supporting cast, crew and extras." }
        ],
        hints: ["Just count the names."],
        why: "Single, double, triple — then anything more than three is a multiple card, sometimes scrolling."
      },
      {
        id: "m9-7-credits", type: "sort", skill: "Place names in the credits",
        prompt: "Opening or closing? Sort what goes where.",
        bins: ["Title card and opening credits", "Closing credits"],
        cards: [
          { t: "The film's title", bin: 0 },
          { t: "The leading actors", bin: 0 },
          { t: "The composer and casting director", bin: 0, fb: "Key crew — the casting director, composer and production designer — are in the opening credits." },
          { t: "Licensed songs used in the film", bin: 1, fb: "Licensed music is listed at the end, with the legal notices." },
          { t: "Copyright and legal notices", bin: 1 },
          { t: "Sponsors and distributors", bin: 1, fb: "Sponsors and distributors are in the closing credits." },
          { t: "Supporting cast and extras", bin: 1, fb: "The rest of the cast rolls at the end; the opening is for the leads." }
        ],
        hints: ["The opening is for the most important names. Everything and everyone else rolls at the end."],
        why: "The opening sets up the film with its biggest names; the closing credits list everyone else, plus the legal and business notices."
      },
      {
        id: "m9-7-later", type: "choice", skill: "Edit from beginning to end",
        prompt: "Your editor says: “I'll fix the pacing of scene 3 at the end.” Why does the lesson advise against it?",
        options: [
          { t: "Edits set aside for later tend to get forgotten" },
          { t: "Editing software can't go back to an earlier scene", fb: "Software lets you edit anything, any time. The risk is human: set-aside edits get forgotten." },
          { t: "Pacing is set by the music, not the edit", fb: "Syncing to music comes after editing and timing — the pacing of the cut is the editor's job." },
          { t: "Scene 3 will already be synced to the credits", fb: "Credits aren't synced to scenes. The issue is simply that it gets forgotten." }
        ],
        answer: 0,
        hints: ["It's not a software problem."],
        why: "Work from the beginning to the end, finishing each edit as you reach it."
      }
    ]
  };

  /* ======================================================================
     9.8 — Finalizing Production Audio
     ====================================================================== */
  D["media:9"]["9.8"] = {
    title: "Finalizing Production Audio",
    blurb: "Foley from the kitchen drawer, and when to replace a line.",
    steps: [
      {
        id: "m9-8-foley", type: "slots", skill: "Match foley props to sounds",
        prompt: "You're the foley artist. What do you reach for to make each sound?",
        slots: [
          { id: "bone", label: "A bone breaks" },
          { id: "snow", label: "Footsteps in snow" },
          { id: "whoosh", label: "A sword whooshes past" },
          { id: "creak", label: "An old staircase creaks" },
          { id: "gun", label: "A gunshot" }
        ],
        cards: [
          { t: "Snapping celery", slot: "bone", fb: "Celery snaps with a crisp, wet crack — the classic broken bone." },
          { t: "Cornstarch squeezed in a leather pouch", slot: "snow", fb: "Cornstarch squeaks and crunches like packed snow." },
          { t: "A thin dowel swung fast", slot: "whoosh", fb: "A thin stick swung fast through the air gives the whoosh." },
          { t: "An old chair", slot: "creak", fb: "Old wood creaks like old wood — an old chair or stool." },
          { t: "A heavy-duty staple gun", slot: "gun", fb: "The course's gunshot is a heavy-duty staple gun (real films usually layer recorded gunfire)." },
          { t: "Crumpled cellophane", slot: null, fb: "Cellophane is a classic for a crackling fire. No fire here — it stays in the tray." }
        ],
        hints: ["One prop is left over.", "Which one would squeak and crunch?"],
        why: "The foley artist watches the film, lists every sound in order, and performs each one with whatever makes the right noise."
      },
      {
        id: "m9-8-effect", type: "sort", skill: "Define a sound effect",
        prompt: "Which of these count as sound effects?",
        bins: ["Sound effect", "Not a sound effect"],
        cards: [
          { t: "A door slamming", bin: 0 },
          { t: "Thunder", bin: 0 },
          { t: "Footsteps made by a foley artist", bin: 0, fb: "Foley is a kind of sound effect — any added sound that isn't speech or music." },
          { t: "The hero's lines", bin: 1, fb: "Dialogue is never called a sound effect." },
          { t: "The music bed", bin: 1, fb: "Music is never called a sound effect." },
          { t: "A robot voice made by putting an effect on the actor's lines", bin: 1, fb: "It's still dialogue. Effects can be applied to dialogue without making it a sound effect." }
        ],
        hints: ["A sound effect is any added sound other than speech or music.",
                "Putting an effect on something doesn't change what it is."],
        why: "Dialogue and music are never sound effects — even when an effect is applied to them."
      },
      {
        id: "m9-8-order", type: "order", skill: "Sequence making foley",
        prompt: "Put the foley artist's work in order.",
        items: [
          "Watch the film through",
          "List every sound it needs, in the order they appear",
          "Perform and record each sound in sync with the picture",
          "Lay the sounds under the footage"
        ],
        nudge: "You can't perform sounds you haven't listed, and you can't list what you haven't watched.",
        hints: ["The lesson's first two steps are watching and listing."],
        why: "Watch, list, perform, lay in. Without foley a film feels strangely quiet, even if the audience can't say why."
      },
      {
        id: "m9-8-adr", type: "choice", skill: "Know when to use ADR",
        prompt: "A plane flew over during the big speech, and you can barely hear the actor. What do you do?",
        options: [
          { t: "ADR — the actor re-records the lines in a studio, fitted to the picture" },
          { t: "Revoicing", fb: "Revoicing is dubbing into another language. The language is fine here — the recording isn't." },
          { t: "Foley", fb: "Foley re-creates everyday sounds like footsteps — not the lines." },
          { t: "Add a louder music bed to cover the plane", fb: "That buries the speech further. Dialogue needs to be clear." }
        ],
        answer: 0,
        hints: ["The actor's words are right; the recording is the problem."],
        why: "Automated dialogue replacement — also called post-sync or dubbing — replaces a line that was noisy or unclear."
      },
      {
        id: "m9-8-revoice", type: "choice", skill: "Tell ADR from revoicing",
        prompt: "A film is being released in Brazil with Portuguese voices. What is it called, and what makes or breaks it?",
        options: [
          { t: "Revoicing — fitting the new lines to the original mouth movements" },
          { t: "ADR — fitting the new lines to the original mouth movements", fb: "ADR re-records the same lines in the same language. A new language is revoicing." },
          { t: "Revoicing — making the new voices sound like the original actors", fb: "Sounding alike helps, but sync is the whole craft: out-of-sync lips break the illusion straight away." },
          { t: "Subtitling — translating the lines on screen", fb: "Subtitles leave the original voices in. Portuguese voices means new voice actors." }
        ],
        answer: 0,
        hints: ["Two of the options have the right name. Which has the right craft?"],
        why: "Revoicing lives or dies on lip sync. Dubbing that's out of step with the mouths breaks the illusion at once."
      }
    ]
  };

  /* ======================================================================
     9.9 — Covers and Merchandise
     ====================================================================== */
  D["media:9"]["9.9"] = {
    title: "Covers and Merchandise",
    blurb: "Pack a DVD case — and keep one look everywhere.",
    steps: [
      {
        id: "m9-9-dvd", type: "slots", skill: "Place information on DVD packaging",
        prompt: "Pack the DVD. Put each set of information on the surface it belongs on.",
        board: { svg: DVD, ratio: "36 / 17" },
        slots: [
          { id: "disc", label: "Disc label", x: 18.3, y: 54, w: 23 },
          { id: "back", label: "Case back", x: 52, y: 58, w: 23 },
          { id: "spine", label: "Spine", x: 67.4, y: 9, w: 17 },
          { id: "front", label: "Case front", x: 82.6, y: 58, w: 23 }
        ],
        cards: [
          { t: "Title, rating and leads, over a picture of a lead", slot: "disc", fb: "The disc label carries the title, rating and leading actors, mostly covered by an image." },
          { t: "Synopsis, stills and critics' quotes", slot: "back", fb: "The back of the case is for the synopsis, scene stills, the rating and critics' quotes." },
          { t: "Just the title", slot: "spine", fb: "The spine is what shows on a shelf — just the title, so the film can be found." },
          { t: "The label's look, without the technical details", slot: "front", fb: "The case front echoes the label's look, without the technical details." }
        ],
        hints: ["Which surface is all you can see when the case is on a shelf?",
                "The back is where a buyer reads about the film before deciding."],
        why: "Every surface has one job: identify the disc, sell the film, be found on a shelf."
      },
      {
        id: "m9-9-spoil", type: "choice", skill: "Design a label that doesn't spoil",
        prompt: "The designer's disc label for a murder mystery shows the killer's face, caught in the act. What's wrong with it?",
        options: [
          { t: "It gives the story away" },
          { t: "Labels shouldn't have pictures of people", fb: "Labels usually do — an image of a lead or an important scene. Just not one that gives the story away." },
          { t: "The rating has to be bigger than the picture", fb: "The rating belongs on the label, but its size isn't the problem here." },
          { t: "Nothing — it's the most dramatic scene", fb: "Dramatic, yes — but it spoils the ending for anyone who hasn't seen it." }
        ],
        answer: 0,
        hints: ["Who picks up a DVD? Mostly people who haven't seen the film."],
        why: "Pick an image of a lead or an important scene — without giving the story away."
      },
      {
        id: "m9-9-brand", type: "choice", skill: "Keep a brand consistent",
        prompt: "Which set of designs follows the lesson's rule?",
        options: [
          { t: "Label, case and T-shirt share two colours, one font and one image, each laid out to suit its shape" },
          { t: "Label, case and T-shirt are exact copies of the same design", fb: "They don't have to be identical — a T-shirt isn't a disc. They have to clearly belong together." },
          { t: "Each item gets its own colours and font, to keep things fresh", fb: "Different looks confuse people and cost sales. Consistency builds the brand." },
          { t: "Only the disc label matters; merchandise can look like anything", fb: "The merchandise is part of the brand too. It all has to look like it belongs together." }
        ],
        answer: 0,
        hints: ["“Consistent” and “identical” aren't the same word."],
        why: "Designs don't have to be identical, but they must clearly belong together. That's what makes a film recognisable at a glance."
      },
      {
        id: "m9-9-money", type: "multi", skill: "Plan merchandise on a small budget",
        prompt: "A small independent film wants merchandise but has no budget. What could it do? Pick every one.",
        options: [
          { t: "Raise funds for it", ok: true },
          { t: "Find sponsors who want their name alongside the film", ok: true },
          { t: "Skip labels and sell plain discs, to save money", ok: false, fb: "An unlabelled disc looks pirated. Proper packaging tells buyers a copy is genuine." },
          { t: "Use a different logo on every product, whatever is cheapest", ok: false, fb: "Inconsistent designs confuse people and can cost sales." }
        ],
        hints: ["Big studios budget for merchandise. Smaller productions find the money elsewhere."],
        why: "Raise funds, or find a sponsor whose name sits alongside the film — and keep the packaging real."
      },
      {
        id: "m9-9-why", type: "explain", skill: "Explain why a consistent look matters",
        prompt: "In two or three sentences: why can inconsistent designs cost a film sales?",
        placeholder: "When the label, case and merchandise…",
        model: "When the label, case and merchandise don't look like they belong together, people don't recognise them as the same film, " +
               "and they trust the brand less. A consistent look makes the film recognisable at a glance — on a shelf, a shirt or a screen — " +
               "so every piece advertises the others."
      }
    ]
  };
})();
