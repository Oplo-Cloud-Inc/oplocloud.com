/* ==========================================================================
   Media Arts — Unit 9, Audio/Video Production. Sections 9.1 to 9.9.

   Based on the EHS course text: curated, not copied. Every tested definition
   is kept, in OEdu's words, with a plain-English line under it. The unit is
   the production pipeline end to end — who makes a piece, how it is pitched,
   planned, styled, cut, scored, mixed and sold — so each section says where
   in that pipeline it sits.

   Corrections to the course text are noted inline rather than silently fixed:
   when dialogue is recorded (9.5), "logarithms" in texture mapping (9.6), and
   a few biographical details in 9.1 that the text overstates.

   ------------------------------------------------------------- Challenges

   Every section has a challenge path (learn/challenges-media9.js): problems
   solved by doing — building Freytag's pyramid, crewing a production,
   syncing a cut to its music — with feedback aimed at the specific mistake.
   The reading is where the ideas are met; the challenge is where they are
   used. See learn/challenge.js.

   ---------------------------------------------------------------- Pictures

   Two OEdu diagrams: Freytag's pyramid (9.2) and the finishing pipeline (9.7).
   ========================================================================== */
window.OPLO_UNIT9 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  var D = function (t, d, plain) { return { k: "def", t: t, d: d, p: plain || null }; };
  var N = function (t) { return { k: "note", t: t }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };
  var W = function (items) { return { k: "words", items: items }; };
  var TRY = function (t, d) { return { k: "try", t: t, d: d }; };
  var WORLD = function (t, d) { return { k: "world", t: t, d: d }; };
  var F = function (o) {
    return { k: "fig", imgs: o.imgs, cap: o.cap, credits: o.credits,
             cols: o.cols || null, natural: !!o.natural,
             diagram: !!o.diagram, size: o.size || null };
  };
  var M = "media/unit9/";
  var OEDU = [{ what: "Diagram", by: "OEdu" }];

  return [
    /* ------------------------------------------------------------------ 9.1 */
    {
      n: "9.1", t: "The People Behind the Screen", kicker: "Inspiration from professionals",
      stand: "Every film, show and game you love was made by someone who once loved somebody else's. " +
             "Four of the people who built the industry, and the dozen jobs it still runs on.",
      mins: 11,
      objectives: ["Name some of the most influential people in media arts and summarise their impact",
                   "List some of the careers available in media arts"],
      body: [
        P("Almost nobody arrives in media arts from nowhere. Each of the people below can name the piece of work " +
          "that made them want to do it — and knowing what inspired them is a good way to find out what inspires you."),
        W([["Franchise", "a series of films, games or shows built around the same characters or world"],
           ["Pioneer", "one of the first people to do something, who opens the way for others"],
           ["Credit", "your name listed as having worked on a production"]]),

        H("Matt Groening — the longest-running cartoon family"),
        P("Matt Groening grew up in Portland, Oregon, and drew cartoons for his college newspaper at The Evergreen " +
          "State College in Olympia, Washington. He created <b>The Simpsons</b>, which began as a half-hour series in " +
          "1989 and became the longest-running American animated series and the longest-running American scripted " +
          "primetime show. Groening is a cartoonist, writer, producer and animator at once — which is normal in this " +
          "industry. He has named Disney's <i>One Hundred and One Dalmatians</i> and Charles M. Schulz's <i>Peanuts</i> " +
          "as early inspirations."),

        H("Shigeru Miyamoto — games you walk around inside"),
        P("Shigeru Miyamoto studied industrial design at an art college in Kanazawa, Japan, and joined Nintendo in " +
          "1977, when the company was just moving into video games. He created or led <b>Mario</b>, <b>Donkey Kong</b> " +
          "and <b>The Legend of Zelda</b>, and later the Wii series. As a boy in Sonobe he explored woods and caves near " +
          "his home, and that feeling of discovering a place is built into his games. The arcade game <i>Space " +
          "Invaders</i> (1978) is often named as the spark that pulled him toward games."),

        H("Steven Spielberg — the blockbuster, and then the serious film"),
        P("Steven Spielberg made home movies as a boy — one famously crashes his toy trains. While a student at " +
          "California State University, Long Beach, he got an unpaid internship at Universal Studios, and he left " +
          "college to direct television for them. His <i>Jaws</i>, <i>Raiders of the Lost Ark</i> and <i>E.T. the " +
          "Extra-Terrestrial</i> helped define the modern Hollywood blockbuster, which is why the course calls him " +
          "the father of the New Hollywood era. Later he turned to history and human rights: <i>The Color Purple</i>, " +
          "<i>Schindler's List</i>, <i>Saving Private Ryan</i>, <i>War Horse</i> and <i>Lincoln</i>. He co-founded " +
          "DreamWorks studios."),
        N("\"Father of New Hollywood\" is the course's phrase. Film historians usually treat New Hollywood as a movement " +
          "of many directors in the late 1960s and 1970s — Spielberg is one of its best-known figures rather than its " +
          "single founder. For the course's questions, the answer it wants is Spielberg."),

        H("Walt Disney — the studio that invented the studio"),
        P("Walt Disney was born in Chicago, took art classes as a boy and was working as a commercial illustrator at " +
          "18. In 1923 he moved to Hollywood and started a studio with his brother Roy — today's Walt Disney Company. " +
          "He created Mickey Mouse in 1928 (and first voiced him), then made the first full-length cel-animated feature " +
          "from an American studio, <i>Snow White and the Seven Dwarfs</i> (1937), followed by <i>Pinocchio</i>, " +
          "<i>Fantasia</i>, <i>Dumbo</i> and <i>Bambi</i>. He opened Disneyland in 1955. He holds the record for the " +
          "most Academy Awards won by one person: 22 competitive Oscars from 59 nominations."),

        H("It takes a crew"),
        P("When a piece of media grabs you, ask which part grabbed you — the story, the look, the sound, the " +
          "performances? That part is somebody's job, and it might be yours."),
        L("The jobs a production runs on", [
          ["Writer", "Builds the story and the script, and often leads the project from the start."],
          ["Director", "Runs the production and tells everyone how each scene should be played and shot."],
          ["Producer", "Finds the money, chooses material, hires people and oversees the whole production."],
          ["Head animator", "In animation, draws the key frames and designs the characters, and approves everyone else's work. When working alone, often called the character designer."],
          ["Layout / environment artist", "Designs the backgrounds and places the scenes happen in."],
          ["Voice actor", "Gives characters their voices and performs their lines."],
          ["Set and lighting directors", "Build and light the scenes of a live production from the script and the director's notes."],
          ["Director of photography", "Decides how each shot is lit and framed through the camera."],
          ["Composer", "Writes the music that carries the feeling of every scene."],
          ["Technical director", "Finds and runs the technology that makes the creator's ideas possible."],
          ["Editor", "Cuts the footage together into the finished piece."],
          ["Actor", "Performs on screen — the most common job in filmmaking, and one of the hardest to break into."]
        ]),
        TRY("Trace it back", "Pick one show, game or film you love. Find its credits and write down the one job you think " +
            "made it work for you. Then look up the person who did that job and what inspired them."),
        WORLD("Credits are a map", "End credits list every role, in order of the department. Watching the full credits of " +
              "an animated film is the fastest way to see how many different jobs one production needs.")
      ]
    },

    /* ------------------------------------------------------------------ 9.2 */
    {
      n: "9.2", t: "Pitching a Story", kicker: "The pitch and the plot",
      stand: "A great story nobody pays for never gets made. A pitch is how a writer gets the money — and it only " +
             "works if the story it describes has a shape the listener can follow.",
      mins: 12,
      objectives: ["Define pitch",
                   "Outline what should be included in a pitch",
                   "Identify and describe the main types of conflict in a story"],
      body: [
        P("Once a story exists, someone has to pay to make it. A writer wins that support by pitching: telling an " +
          "editor, studio or investor what the story is and why it matters."),
        D("Pitch", "A clear, organised description of a story, given to an editor or backer to convince them to " +
          "support it — what happens, and why it is worth making. It can be spoken in a meeting or sent in writing.",
          "Telling someone your story idea in a way that makes them want to pay for it."),
        D("Elevator pitch", "A very short pitch that could be delivered in the time an elevator ride takes — often " +
          "thirty seconds to a minute. Salespeople use the same idea to sell a product quickly.",
          "Your whole idea in about thirty seconds."),

        H("The shape a pitch follows"),
        P("Editors look for organisation. A pitch walks through the story's plot in order, so the listener can see the " +
          "whole shape. That shape has a name: <b>Freytag's pyramid</b>, after the German writer Gustav Freytag, who " +
          "described it in 1863."),
        F({ imgs: [{ src: M + "9-2-freytag.svg", w: 720, h: 360,
                     alt: "Freytag's pyramid drawn as a mountain. The line starts low on the left at Exposition, " +
                          "rises at the Inciting incident, climbs through Rising action to the peak labelled Climax, " +
                          "descends through Falling action and ends low on the right at Resolution, also called Denouement." }],
            cap: "Freytag's pyramid. Tension builds from the inciting incident to the climax, then releases to the " +
                 "resolution. A pitch tells the parts in this order.",
            credits: OEDU, diagram: true }),
        D("Exposition", "The opening of a story: it introduces the characters, the setting (time and place) and any " +
          "background the audience needs, and hints at the conflict to come.",
          "The start, where we meet the people and the place."),
        D("Inciting incident", "The event that pushes the main character out of their normal routine and into the " +
          "story's problem. Also called the exciting incident. The plot really begins here.",
          "The moment something happens that the main character can't ignore."),
        D("Rising action", "The series of events after the inciting incident, each raising the stakes and building " +
          "toward the climax. Usually the longest part of a story.",
          "Things keep getting harder and more interesting."),
        D("Climax", "The point of greatest tension, where the story turns and its direction is decided.",
          "The biggest moment — the turning point."),
        D("Falling action", "The events after the climax, as the conflict begins to unwind toward its ending.",
          "Things start to settle down after the big moment."),
        D("Resolution (denouement)", "The ending, where the conflict is resolved and the characters reach a new " +
          "normal. <i>Dénouement</i> is French for \"untying\" — the knot of the plot comes undone.",
          "The ending, where the problem is solved."),
        N("The inciting incident is not the climax, and it is not the first thing that happens. The exposition comes " +
          "first; the inciting incident is the event that starts the problem. In <i>Finding Nemo</i>, the reef scenes " +
          "are exposition; Nemo being taken by a diver is the inciting incident."),

        H("Every plot needs a conflict"),
        P("A story is almost always built round a central conflict that is resolved by the end. Conflicts are either " +
          "<b>external</b> — a character against something outside them — or <b>internal</b> — a character against " +
          "themselves. The course uses the classic names, \"man vs.\"; many writers now say \"character vs.\"."),
        L("Three classic conflicts", [
          ["Character vs. character (man vs. man)", "External. Two characters want opposite things — a fight, a robbery, or a quieter clash of desires, common in romances."],
          ["Character vs. nature (man vs. nature)", "External. A character against an animal, a storm, a disaster, or survival after a plane crash or shipwreck."],
          ["Character vs. self (man vs. himself)", "Internal. A struggle inside one person: a hard decision, an addiction, or something from their past they must overcome."]
        ]),
        TRY("Thirty seconds", "Pitch a film you have seen as if it were new: one sentence of exposition, the inciting " +
            "incident, the climax in a single line, and why an audience would care. Time yourself."),
        WORLD("Where pitches happen", "Studios hear pitches in rooms; animation students pitch storyboards to their class; " +
              "startup founders give elevator pitches to investors. The structure is the same each time.")
      ]
    },

    /* ------------------------------------------------------------------ 9.3 */
    {
      n: "9.3", t: "Developing Character", kicker: "Characters and scenes",
      stand: "The most interesting characters show less than they are. The iceberg theory explains why, and a set " +
             "of classic scene types gives a writer the tools to reveal them a piece at a time.",
      mins: 12,
      objectives: ["Describe the iceberg theory",
                   "Identify the main types of scenes and how each contributes to character, conflict, plot or exposition"],
      body: [
        P("Characters are like onions: layer after layer. A story that peels them too fast has nothing left to show."),
        D("Iceberg theory (theory of omission)", "A way of writing, associated with Ernest Hemingway, that shows only " +
          "the surface of characters and events and leaves their deeper meaning unstated — like an iceberg, most of " +
          "which lies hidden below the water.",
          "Show a little, hide a lot, and let the audience sense what's underneath."),
        P("Hemingway kept his sentences plain and left feelings and themes for the reader to work out. Applied to " +
          "characters, it means the audience learns who someone is from what they do and say, not from being told. " +
          "The introduction of a character is where the theory matters most: reveal too much and there is nothing " +
          "left to discover."),
        N("Some writers say the iceberg theory also helps a writer keep a distance from characters they created."),

        H("Scenes that earn their place"),
        P("Every scene should add to character development, conflict, plot or exposition. A scene that does none of " +
          "those should be cut. Writers lean on a set of scene types that each do a particular job."),
        L("Scenes that set up and connect", [
          ["Exposition", "Introduces the setting, the atmosphere (the mood of the place and people) and the characters."],
          ["Transition", "Moves characters believably from one place to another, so the story doesn't jump."],
          ["Preparation", "Gives a character a reason to do the next thing in the plot."]
        ]),
        L("Scenes of reaction and discovery", [
          ["Aftermath", "Characters — and the audience — react to an event or a tragedy."],
          ["Investigation", "Characters find out what happened and why, often right after an aftermath."],
          ["Revelation", "The audience learns something the characters don't yet know."],
          ["Recognition", "A character finally discovers important information — often what the audience saw in a revelation."],
          ["The gift", "An object seen early returns later carrying meaning — and sometimes a crucial clue."]
        ]),
        L("Scenes of action and turning", [
          ["Escape", "A character gets away from someone or something dangerous."],
          ["Pursuit", "Someone or something chases a character, developing both sides of the conflict."],
          ["Persuasion", "One character convinces another to do something — the course calls this a seduction scene. Often near the climax."],
          ["Opposites", "Two characters in conflict are forced to work together."],
          ["Reversal of expectations", "Something unexpected happens, then a second event flips its meaning — common at the climax."],
          ["Unexpected visitor", "A new character arrives and causes trouble — sometimes the whole conflict."]
        ]),
        N("Revelation and recognition are easy to mix up. In a revelation scene the <i>audience</i> learns a secret; " +
          "in a recognition scene a <i>character</i> finally learns it. The audience often knows first — which is " +
          "what makes the recognition scene tense."),
        TRY("Find the iceberg", "Think of a character from a film you know well. Write one thing the film shows " +
            "about them and one thing it never says out loud but you know anyway. The second is the part under the water.")
      ]
    },

    /* ------------------------------------------------------------------ 9.4 */
    {
      n: "9.4", t: "Creating Storyboards", kicker: "Planning shot by shot",
      stand: "Before a single frame is shot, the whole film exists as drawings. A storyboard is where a director " +
             "finds out what doesn't work while it is still cheap to fix.",
      mins: 9,
      objectives: ["Outline the process of creating a storyboard and a visual treatment"],
      body: [
        D("Storyboard", "A sequence of drawings, panel by panel like a comic strip, showing each shot of a film, show, " +
          "cartoon or advertisement in order, with notes on camera and movement. It is made during pre-production.",
          "A comic-strip plan of the film, one drawing per shot."),
        D("Pre-production", "Everything done before filming or animating starts: writing, planning, storyboarding, " +
          "casting and scheduling.",
          "All the planning before you start making it."),
        P("A storyboard does two jobs. It makes sure <b>no shot is left out</b>, and that each shot is <b>framed and " +
          "filmed the way it was planned</b>. It also lets the director estimate timing — how long each moment gets to " +
          "land — and it becomes the reference everyone uses during the shoot."),
        H("How to make one"),
        L("From story to storyboard", [
          ["1 · Finish the story", "The story must be fully written before it can be boarded."],
          ["2 · Number the scenes", "Make a numbered outline of every event; each number becomes a panel."],
          ["3 · Picture it first", "Visualise each event before drawing it."],
          ["4 · Draw the panels", "Sketch each shot on its own card or sheet — easy to pull out and redo if a frame feels wrong. Black and white or colour, by hand or on a computer."],
          ["5 · Visual treatment", "Add the cinematography: the camera angle, the type of shot, and any camera movement, on every panel."]
        ]),
        D("Visual treatment", "The step where the camera angles, shot types, camera movement and effects are added to " +
          "each storyboard panel, so everyone knows exactly how each moment will be filmed.",
          "Adding the camera directions to the drawings."),
        N("Notecards are the trick. A panel that doesn't work can be pulled out of the line-up and redrawn without " +
          "touching the rest — which is why storyboarding is much cheaper than re-shooting."),
        TRY("Six panels", "Storyboard a 20-second scene — someone finding a note under their door — in six panels. On " +
            "each, write the shot type (wide, medium, close-up) and whether the camera moves."),
        WORLD("Animatics", "Studios film their storyboards with a rough soundtrack to make an animatic: the whole film " +
              "as moving drawings. Pixar makes one for every film before a single shot is animated.")
      ]
    },

    /* ------------------------------------------------------------------ 9.5 */
    {
      n: "9.5", t: "The Music Bed", kicker: "Music for production",
      stand: "The same shot feels triumphant with one track and tragic with another. Choosing the music bed is " +
             "choosing how the audience will feel.",
      mins: 9,
      objectives: ["Define music bed and summarise the steps and considerations in choosing music for media art"],
      body: [
        D("Music bed", "The background music that runs under a production. It sets the mood, carries it across scenes " +
          "and ties the piece together.",
          "The background music of a video."),
        P("Music is one of the strongest tools for making an audience feel something. It gives scenes minutes apart " +
          "a sense of belonging together, helps brands be recognised, and turns a good production into a memorable " +
          "one. The wrong track can break a film just as easily."),
        H("Choosing the music"),
        L("Steps", [
          ["1 · Decide how viewers should feel", "Music is about emotion. Start from the feeling, not the song."],
          ["2 · Set the mood of each scene", "The mood can change from scene to scene — and it isn't the same thing as the piece's overall message."],
          ["3 · Match the music to the scene", "An action scene needs intense, driving music; a slow track under a chase feels wrong. A whole film usually uses several styles."],
          ["4 · Get the rights", "Music is rarely free. Compose your own, buy a licence, or use a library of royalty-free or open-licence tracks."]
        ]),
        P("Blockbusters usually have a composer write original music, which is why one theme can make you think of a " +
          "whole film in two notes."),
        H("Where dialogue fits"),
        P("Dialogue is usually the most important thing an audience hears, so in the final mix the music is set " +
          "<i>around</i> it — turned down under speech so every line is clear."),
        N("The course says dialogue is recorded last, after the music is chosen. That's true of the <i>mix</i>: dialogue " +
          "is balanced last so it sits on top. But in live action most dialogue is recorded during filming (with some " +
          "re-recorded later — see ADR in 9.8), and in animation the voices are usually recorded <i>before</i> the " +
          "animation, so animators can match the mouths to them."),
        TRY("Swap the score", "Mute a movie trailer and play two very different songs under it. Write one sentence " +
            "about how the same pictures felt each time.")
      ]
    },

    /* ------------------------------------------------------------------ 9.6 */
    {
      n: "9.6", t: "Visual Style Planning", kicker: "Techniques, style tests and model sheets",
      stand: "The genre narrows the choice of technique, and a style test proves the choice before the budget is spent.",
      mins: 11,
      objectives: ["Recall different animation techniques",
                   "Explain the nature and purpose of style tests and model sheets"],
      body: [
        P("Finding a visual style starts with the genre. Once you know what kind of story you're telling, the list of " +
          "animation techniques that suit it gets much shorter. (This reviews the styles from 8.1.)"),
        H("The techniques"),
        L("From hand-drawn to computed", [
          ["Traditional (classical, hand-drawn)", "Every frame drawn by hand. Once the dominant form of animation."],
          ["Limited animation", "A budget shortcut using the cel technique: most of the frame stays the same and only the part that moves is redrawn — a talking character's mouth, say."],
          ["2D computer animation", "Still drawn by hand, but on a computer — no scanning paper drawings in."],
          ["Stop motion", "Real objects — jointed puppets or clay — moved a tiny amount and photographed, frame after frame. Slow to make."],
          ["Pixilation", "Stop motion with live actors as the subject, posing frame by frame so they move like puppets."],
          ["3D CGI", "Computer-generated images with depth and realistic motion."],
          ["3D modelling", "Building an object's 3D surface from mathematical descriptions; can be rendered to an image, animated, or even 3D-printed."],
          ["Texture mapping", "Wrapping a surface image — from a photo or designed — onto a 3D model so it looks like the real material."],
          ["Rigging", "Giving a 3D model a skeleton of joints so it can be posed and moved. Without a rig, a model is stuck in the pose it was built in."]
        ]),
        N("The course says \"logarithms\" play an important role in texture mapping; it means <b>algorithms</b> — the " +
          "step-by-step procedures a computer follows to wrap and shade the texture."),
        H("Testing before committing"),
        D("Style test", "A short sample of the film made in the chosen technique, to check that the technique suits " +
          "the story before full production begins.",
          "A small practice piece to see if the style works for your story."),
        P("A fast, action-heavy story might fail a style test in stop motion — every movement has to be posed and " +
          "photographed by hand, so quick action is slow and costly to make."),
        D("Model sheet", "A sheet of drawings of a character from different angles, in different expressions and " +
          "outfits, so they look consistent — and right for each scene — across the whole production.",
          "A reference page showing exactly how a character looks in every situation."),
        P("A character in a film that spans a year can't wear a summer dress in a snowstorm; the model sheet plans her " +
          "outfits and moods in advance."),
        D("Shot list (visual production)", "A list of every shot, in order, with a short description and who is needed " +
          "for it. Like a storyboard, but written rather than drawn.",
          "A written list of all the shots you need to film."),
        TRY("Style test in five frames", "Take one short action — a ball rolling off a table — and plan it twice: once " +
            "as stop motion, once as 2D. Which would you choose for an action film, and why?")
      ]
    },

    /* ------------------------------------------------------------------ 9.7 */
    {
      n: "9.7", t: "Finalizing Footage", kicker: "Editing, timing and credits",
      stand: "All the footage exists. Now it has to become one piece — cut to length, in step with its music, " +
             "and framed by its credits.",
      mins: 10,
      objectives: ["Outline the steps for finalizing footage",
                   "Tell apart the title card, opening credits and ending credits"],
      body: [
        P("Finishing takes longer than people expect. The footage has to be cut, timed to the length planned for the " +
          "piece, and synchronised with the music bed."),
        F({ imgs: [{ src: M + "9-7-pipeline.svg", w: 720, h: 240,
                     alt: "Three steps in a row with arrows between them: 1, Import and place the footage in the " +
                          "timeline. 2, Edit and time it. 3, Sync it to the music bed." }],
            cap: "Finalizing footage in three steps, always in this order.",
            credits: OEDU, diagram: true }),
        L("The three steps", [
          ["1 · Import and place", "Bring the footage into video-editing software and lay it on the timeline."],
          ["2 · Edit and time", "Cut scenes, repeat some, add transitions and effects, and trim anything too long for the planned length. Work from the beginning to the end — an edit set aside for later gets forgotten."],
          ["3 · Sync to the music bed", "Match the music's fast and slow passages to the action-filled and quieter scenes."]
        ]),
        P("The music and the footage sit on <b>separate tracks</b> in the editor, one above the other. That's what makes " +
          "it possible to see exactly where they line up, and to slide either one until they carry the same emotion."),

        H("Opening and closing"),
        D("Title card", "The screen near the start of a film that shows its title and its most important names — " +
          "usually the production company, the title and the leading actors.",
          "The screen that shows the film's name at the start."),
        D("Opening credits", "The credits at the beginning: the studio, the title, the leading cast and key crew such " +
          "as the casting director, composer and production designer. They may be laid over footage.",
          "The important names at the start."),
        D("Closing (end) credits", "The full list at the end — the rest of the cast and crew, plus sponsors, distributors, " +
          "licensed music, copyright and legal notices — usually scrolling up the screen.",
          "Everyone else's names, rolling at the end."),
        L("Counting names on a title card", [
          ["Single card", "One name."],
          ["Double card", "Two names."],
          ["Triple card", "Three names."],
          ["Multiple card", "More than three names — used for supporting cast, crew and extras, and sometimes scrolling."]
        ]),
        P("Both should use a clear font and colour, and often borrow music from the music bed so the credits feel " +
          "part of the piece. Some end credits now include extra scenes, drawings or bloopers to keep people watching."),
        WORLD("The oldest title card", "Georges Méliès's <i>A Trip to the Moon</i> (1902) opens on a painted title card. " +
              "Films have announced themselves that way for over a century.")
      ]
    },

    /* ------------------------------------------------------------------ 9.8 */
    {
      n: "9.8", t: "Finalizing Production Audio", kicker: "Sound effects, foley and dubbing",
      stand: "Beautiful pictures with no sound feel dead. The last layer of a production is the sound that makes " +
             "the world real — much of it made with celery and staplers.",
      mins: 10,
      objectives: ["Outline the steps for finalizing production audio"],
      body: [
        P("With the footage cut and in step with its music, the last job is sound: effects, foley and any dialogue that " +
          "needs replacing. (This reviews sound effects and foley from 5.7.)"),
        D("Sound effect", "Any sound other than speech or music that is added to a production to make a storytelling " +
          "or creative point. Editing software often includes stock sound effects.",
          "Any added sound that isn't talking or music."),
        D("Foley", "Everyday sounds re-created and recorded in sync with the picture — footsteps, cloth, doors, a glass " +
          "breaking — to make the audio more realistic. Named after Jack Foley, who developed the craft.",
          "Sounds made in a studio to match what happens on screen."),
        N("Dialogue and music are never called sound effects — though effects can be applied to them."),
        H("How foley is made"),
        P("First the foley artist watches the film and lists every sound it needs, in the order they appear. Then they " +
          "perform them with whatever makes the right noise:"),
        L("A foley studio's kitchen drawer", [
          ["Snapping celery", "breaking bones"],
          ["Cornstarch squeezed in a leather pouch", "footsteps in snow"],
          ["A thin stick or dowel swung fast", "a whoosh"],
          ["An old chair or stool", "creaks"],
          ["A heavy-duty staple gun", "gunshots (the course's example — real films mostly layer recorded gunfire)"]
        ]),
        P("Without foley, films feel strangely quiet — the audience notices the missing footsteps even if they couldn't " +
          "say what was wrong."),
        H("When the dialogue isn't good enough"),
        D("ADR (automated dialogue replacement)", "Re-recording an actor's lines in a studio after filming, then fitting " +
          "them to the picture — used when the original sound was noisy or unclear. Also called post-sync or dubbing.",
          "Recording the lines again later because the first recording wasn't clear."),
        D("Revoicing", "Dubbing a production into another language, with new voice actors whose lines are fitted as " +
          "closely as possible to the original mouth movements.",
          "Replacing the voices with ones in another language."),
        N("Dubbing that is out of sync with the lips breaks the illusion straight away. Matching the mouth movements is " +
          "the whole craft."),
        TRY("Foley at home", "Film ten seconds of someone walking with no sound. Record footsteps, keys and a door with " +
            "things in your house, and lay them under the video. Which sound was hardest to make believable?")
      ]
    },

    /* ------------------------------------------------------------------ 9.9 */
    {
      n: "9.9", t: "Covers and Merchandise", kicker: "DVDs, merchandise and brand",
      stand: "A production isn't finished when the credits roll; it has to be recognisable on a shelf, a shirt and " +
             "a screen. The rule for all of it is consistency.",
      mins: 9,
      objectives: ["Summarise the steps and considerations in designing merchandise and DVD packaging"],
      body: [
        D("Merchandising", "Offering products for sale to consumers. Promotional merchandise — shirts, hats, cups, " +
          "posters — spreads awareness of a film, event or team.",
          "Selling stuff with the film's design on it."),
        P("Sports teams do it to rally fans; film studios do it to promote a release long before it comes out. The " +
          "biggest obstacle is paying for it: big studios budget for merchandise; smaller productions raise funds or " +
          "find sponsors who want their name alongside the film."),
        H("Designing the DVD"),
        L("Where each piece of information goes", [
          ["Disc label", "One surface. The title, rating, leading actors and key crew (small, at the bottom), mostly covered by an image of a lead or an important scene — without giving the story away."],
          ["Case front", "Echoes the label's look, but without the technical details."],
          ["Case back", "A short synopsis, stills from scenes, the rating and quotes from critics."],
          ["Spine", "The title, so the film can be found on a shelf."]
        ]),
        P("Labels are printed on adhesive sheets cut to the disc's shape; case covers are easier because the case is a " +
          "simple rectangle. Proper packaging also tells buyers a copy is genuine — an unlabelled disc looks pirated."),
        H("One look everywhere"),
        P("The designs for the label, case and merchandise don't have to be identical, but they must clearly belong " +
          "together. Consistent style builds trust in the film's brand and makes its message easy to recognise; " +
          "inconsistent designs confuse people and can cost sales."),
        WORLD("The same idea, streamed", "Discs are rarer now, but the thinking hasn't changed: a streaming service's " +
              "thumbnail, the poster, the trailer's title card and the merchandise all share one look, so you know the " +
              "film at a glance."),
        TRY("Brand kit", "Choose two colours, one font and one image for a film you'd like to make. Sketch the disc " +
            "label, the case front and a T-shirt using only those.")
      ]
    }
  ];
})();
