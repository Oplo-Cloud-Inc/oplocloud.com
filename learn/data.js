/* ==========================================================================
   OEdu — curriculum, study sets, accounts and enrolment records.
   Content only. Nothing here touches the DOM; app.js renders it.
   ========================================================================== */
window.OPLO = (function () {
  "use strict";

  /* ---------------------------------------------------------- Figures
     Drawn rather than illustrated: the picture IS the problem, so it has
     to be exact. One accent, one positive green, nothing decorative. */
  var BLUE = "#0071e3", GREEN = "#12915a", GREY = "#6e6e73";

  function grid(cols, rows) {
    var s = '<svg viewBox="0 0 ' + cols * 40 + ' ' + rows * 40 + '">';
    for (var y = 0; y < rows; y++)
      for (var x = 0; x < cols; x++)
        s += '<circle cx="' + (x * 40 + 20) + '" cy="' + (y * 40 + 20) + '" r="11" fill="' + BLUE + '"/>';
    return s + "</svg>";
  }
  function rects() {
    return '<svg viewBox="0 0 360 150">' +
      '<rect x="8" y="20" width="120" height="110" rx="5" fill="' + BLUE + '" opacity=".9"/>' +
      '<text x="68" y="145" text-anchor="middle" font-size="15" fill="' + GREY + '">A</text>' +
      '<rect x="196" y="45" width="156" height="85" rx="5" fill="' + GREEN + '" opacity=".9"/>' +
      '<text x="274" y="145" text-anchor="middle" font-size="15" fill="' + GREY + '">B</text></svg>';
  }
  function ell() {
    var s = '<svg viewBox="0 0 260 220">';
    for (var y = 0; y < 5; y++) for (var x = 0; x < 5; x++) if (x < 2 || y > 2)
      s += '<rect x="' + (10 + x * 40) + '" y="' + (10 + y * 40) + '" width="40" height="40" ' +
           'fill="#e7f1fd" stroke="' + BLUE + '" stroke-width="1.6"/>';
    return s + "</svg>";
  }
  function tri() {
    var s = '<svg viewBox="0 0 380 120">', xs = [0, 74, 172, 296], counts = [1, 3, 6, 10];
    counts.forEach(function (n, i) {
      var placed = 0, row = 0;
      for (var r = 1; placed < n; r++) {
        for (var k = 0; k < r && placed < n; k++, placed++)
          s += '<circle cx="' + (xs[i] + 44 + k * 17 - (r - 1) * 8.5) + '" cy="' + (16 + row * 18) +
               '" r="6.5" fill="' + BLUE + '"/>';
        row++;
      }
      s += '<text x="' + (xs[i] + 44) + '" y="110" text-anchor="middle" font-size="14" fill="' + GREY + '">' + n + '</text>';
    });
    return s + "</svg>";
  }

  /* ---------------------------------------------------------- Problems */
  var SEEING_P = [
    { ask: "How many dots are here?",
      hint: "Try not to count them one at a time.",
      fig: grid(6, 4), type: "choice", opts: ["20", "22", "24", "26"], right: 2,
      why: "Six across and four down. Rather than counting 24 things, you count 6 and 4 and multiply — " +
           "which is what multiplication is for. An array turns one big count into two small ones." },
    { ask: "Which rectangle covers more?",
      hint: "A is 3 wide and 11 tall. B is 6 wide and 5 tall. Same unit either way.",
      fig: rects(), type: "choice", opts: ["A", "B", "They are equal"], right: 0,
      why: "A is 3 &times; 11 = 33 units. B is 6 &times; 5 = 30. B looks wider and squatter, which reads " +
           "as bigger — but width is only half the story. The taller sliver wins by three." },
    { ask: "How many unit squares make this shape?",
      hint: "There is a faster way than counting each square.",
      fig: ell(), type: "number", right: 16,
      why: "The full 5 &times; 5 square is 25. The missing corner is 3 &times; 3 = 9. So 25 &minus; 9 = 16. " +
           "Subtracting what is absent is often quicker than adding what is present." },
    { ask: "The pattern grows 1, 3, 6, 10. What comes next?",
      hint: "Look at what gets added each time, not the totals.",
      fig: tri(), type: "choice", opts: ["13", "14", "15", "16"], right: 2,
      why: "The gaps are 2, then 3, then 4 — so the next gap is 5, giving 15. Each step adds one more row " +
           "than the last. These are the triangular numbers, and they turn up everywhere once you know the shape." },
    { ask: "A 6 &times; 4 rectangle is cut once, straight through the middle. What is true of the two pieces?",
      hint: "Think about it before picturing a particular cut.",
      type: "choice",
      opts: ["Equal area only if the cut is horizontal",
             "Equal area only if the cut is vertical",
             "Equal area for any straight cut through the centre",
             "It depends where the centre is"], right: 2,
      why: "Any straight line through the centre of a rectangle splits it into two equal halves. The rectangle " +
           "has rotational symmetry about that point, so each piece maps exactly onto the other — the angle " +
           "of the cut never matters." }
  ];

  /* -------------------------------------------------------- Study sets
     Term and definition, written to be studied rather than skimmed. Every
     definition stands on its own, because in Match and Test it appears
     without its term next to it. */
   var SETS = {
     "bio-1": { t: "Ecology and Natural Systems", cards: [
       ["Biotic factor", "Any living part of an environment, or anything produced by something living."],
       ["Abiotic factor", "Any non-living part of an environment: temperature, sunlight, water, wind, salt, soil chemistry, rock, pH, oxygen."],
       ["Population", "All the individuals of one species living in the same area at the same time, able to breed with each other."],
       ["Community", "All the populations of all the different species living together in one area, and the interactions between them."],
       ["Ecosystem", "A community plus the abiotic environment it depends on, treated as one working system through which energy flows and matter cycles."],
       ["Niche", "Everything a species needs and everything it does: the range of every abiotic factor it can tolerate, the resources it consumes, when and how it is active, what eats it, what it competes with, and how it changes the place it lives in."],
       ["Habitat", "The physical place where an organism lives."],
       ["Carrying capacity", "The population size an environment can sustain over the long run, given its resources."],
       ["Limiting factor", "Anything that holds a population below the size it would otherwise reach."],
       ["Competition", "An interaction in which two organisms use the same limited resource, so that both do worse than either would alone."],
       ["Predation", "An interaction in which one organism hunts, kills and eats another."],
       ["Mutualism", "An interaction in which both species gain."],
       ["Commensalism", "An interaction in which one species gains and the other is not measurably affected."],
       ["Parasitism", "An interaction in which one species lives on or in another and takes resources from it, usually harming it without killing it outright."],
       ["Trophic cascade", "A chain of effects that runs down through the levels of a food web when something changes at the top."],
       ["Exponential growth", "Growth in which a fixed percentage is added each time period, so the increase itself keeps getting bigger. Drawn against time it makes a J."],
       ["Logistic growth", "Growth that starts exponentially, then slows as resources run short, and levels off at the carrying capacity. Drawn against time it makes an S."],
       ["Density", "The number of individuals per unit of area or volume."],
       ["Dispersion", "The pattern in which individuals are spread through that space: clumped, uniform or random."],
       ["Species richness", "The number of different species found in an area."]
     ]},
     "seeing-1": { t: "Counting in shapes", cards: [
      ["Array", "A rectangular arrangement in equal rows and columns, which turns a count into a multiplication."],
      ["Factor", "A number being multiplied. In 6 × 4, both 6 and 4 are factors."],
      ["Product", "The result of a multiplication. The product of 6 and 4 is 24."],
      ["Area", "The amount of surface a shape covers, measured in unit squares."],
      ["Unit square", "A square one unit long on every side. Area is counted in these."],
      ["Triangular number", "A count of dots that forms a triangle: 1, 3, 6, 10, 15. Each step adds one more row than the last."],
      ["Common difference", "The fixed amount added between one term of a sequence and the next."],
      ["Decomposition", "Breaking a shape into simpler pieces, or subtracting a missing piece, to make a count easier."],
      ["Rotational symmetry", "A shape maps onto itself when turned about a point. Any straight line through a rectangle's centre halves it."],
      ["Commutative property", "Order does not change the result: 6 × 4 gives the same product as 4 × 6."]
    ]},
    "media-1": { t: "What are Media Arts?", cards: [
      ["Media arts", "Creative work made with technology as its material: design, photography, video, animation and sound."],
      ["Mass media", "Channels built to reach a large audience at once — print, broadcast, and now networks."],
      ["Printing press", "Gutenberg's movable-type press of about 1440, which made identical copies cheap and put reading in ordinary hands."],
      ["Typography", "The craft of arranging type so that it can be read, and so that the reading feels like something."],
      ["Analogue", "A signal stored as a continuous physical trace — a groove, a grain, a magnetic stripe."],
      ["Digital", "A signal stored as discrete numbers, which can therefore be copied without loss."],
      ["Medium", "The material or channel a work is made in. What the medium can carry shapes what the work can say."],
      ["Composition", "How the parts of a work are arranged inside its frame."],
      ["Audience", "The people a work is made for. Every decision in media arts is made against a particular one."],
      ["Convergence", "Separate media collapsing into one device and one file format."]
    ]},
    "media-2": { t: "The Basics of Design", cards: [
      ["Balance", "How visual weight is distributed. Symmetrical balance mirrors; asymmetrical balance is unequal yet still stable."],
      ["Contrast", "Difference between elements — light against dark, large against small — used to separate them and to draw the eye."],
      ["Emphasis", "The part meant to be seen first. Everything else is arranged to give way to it."],
      ["Rhythm", "Repetition with variation, which moves the eye through a piece at a pace the designer chooses."],
      ["Unity", "Every part looking as though it belongs to the same work, achieved through repetition, proximity and alignment."],
      ["Whitespace", "Deliberately empty area. It is not wasted space; it is what makes everything else legible."],
      ["Hierarchy", "The order in which things are meant to be read, built from size, weight and position."],
      ["Alignment", "Edges lining up along a shared line. Invisible when it is right, obvious the moment it is not."],
      ["Proximity", "Related things placed near one another, so that the grouping is understood before it is read."],
      ["Colour theory", "How colours relate on the wheel — complementary, analogous, triadic — and what each relationship does to a design."]
    ]},
    "media-5": { t: "Waves and Sound", cards: [
      ["Pinna", "The auricle — the visible part of the ear on each side of the head. Made of cartilage, it collects sound vibrations and guides them into the ear canal."],
      ["Tympanic membrane", "The eardrum. A thin, cone-shaped membrane separating the outer ear from the middle ear, which converts vibration in air into vibration in fluid."],
      ["Ossicles", "The three tiny bones of the middle ear — malleus, incus and stapes, or hammer, anvil and stirrup."],
      ["Cochlea", "The hearing part of the inner ear: a snail-shaped bony structure filled with two fluids, the endolymph and the perilymph."],
      ["Eustachian tube", "A narrow passage from the pharynx to the middle ear that equalises pressure on each side of the eardrum and drains the middle ear space."],
      ["Longitudinal wave", "A compression wave that alternates pressure around the equilibrium. Sound always travels this way, and it needs a medium."],
      ["Amplitude", "The height of a wave, measured vertically peak-to-peak — from crest to trough."],
      ["Wavelength", "The distance over which a wave's shape repeats, measured horizontally between two corresponding points of the same phase."],
      ["Frequency", "How many complete vibrational cycles happen per unit of time, measured in Hertz. One Hz is one cycle per second."],
      ["Pitch", "The sensation of detecting frequency. Higher frequency is heard as higher pitch."],
      ["Infrasound", "Any sound below 20 Hz — beneath the human hearing floor. Elephants detect it down to about 5 Hz."],
      ["Ultrasound", "Any sound above 20,000 Hz. Dogs reach 45,000 Hz and bats 120,000 Hz."],
      ["Ambient noise", "The background sound of a location, sometimes called atmospheric sound. It is what typically fights the dialogue on a track."],
      ["Foley", "The reproduction of everyday sound effects, performed with objects and added to picture — celery for breaking bone, corn starch for snow."],
      ["Omnidirectional", "A microphone that records from all directions with equal gain, its polar plot a full circle."],
      ["Cardioid", "A microphone with a heart-shaped pickup range: high gain from the front and sides, poor from the rear."],
      ["Bidirectional", "A figure-of-eight microphone, sensitive front and back and poor at the sides. Built for interviews and Q&A."],
      ["XLR", "The professional connector used in audio, video and stage lighting. Circular, three to seven pins, and usually needs an adapter for a laptop."],
      ["Hard sell", "A direct, forceful advertisement with a loud slogan, heavy on product information and rational argument."],
      ["Soft sell", "An indirect advertisement aimed at emotion, creating a mood or image the buyer wants rather than pressing a case."]
    ]},
    "media-6": { t: "Intro to Photography", cards: [
      ["Aperture", "The opening in the lens that light passes through. Its size is set by the diaphragm."],
      ["F-stop", "The number that expresses aperture size, like f/5.6. A smaller f-number means a larger opening."],
      ["Depth of field", "How much of a scene, from near to far, appears sharp. A larger aperture makes it shallower."],
      ["Shutter speed", "How long the shutter stays open. Fast freezes motion; slow lets it blur."],
      ["Negative", "Developed film on which light and dark are reversed. Printing it reverses them again to make a positive."],
      ["Focal length", "How strongly a lens magnifies, measured in millimetres. Shorter is wider; longer is narrower and more magnified."],
      ["Wide-angle lens", "A lens shorter than about 35mm that takes in a broad view. The landscape photographer's lens."],
      ["Telephoto lens", "A long lens with a narrow, magnified view that blurs backgrounds. Used for headshots and candid shots."],
      ["Macro lens", "A lens that focuses very close. A true macro records a small object life-size, at a ratio of one to one."],
      ["Prime lens", "A lens with one fixed focal length. Unlike a zoom lens, the photographer moves to change the framing."],
      ["Image sensor", "The chip that records light in a digital camera in place of film. The two main types are CCD and CMOS."],
      ["Warm colours", "Reds, oranges and yellows — the colours of sunlight and heat. They seem to advance toward the viewer."],
      ["Colour balance", "Adjusting colour intensities so neutrals look neutral. Called grey balance in black and white, or white balance."],
      ["Lossy compression", "Compression that permanently throws data away to make a file smaller. JPEG is lossy; PNG is not."],
      ["Raw", "Unprocessed sensor data with the metadata of the capture. A digital negative: not directly usable, but it holds everything."],
      ["Zone System", "Ansel Adams' technique for choosing exposure and controlling contrast, so each tone lands where he intended in the print."],
      ["Rule of thirds", "Dividing the frame into a three-by-three grid and placing the subject where the lines cross."],
      ["Golden ratio", "A proportion of about 1 to 1.618 found throughout nature. Related to the rule of thirds, but not the same thing."],
      ["Cropping", "Removing the outer parts of an image to improve its framing, emphasise the subject or change its aspect ratio."],
      ["Healing brush", "A retouching tool that blends sampled colour into the surrounding tones, hiding scars and blemishes."]
    ]},
    "biz-1": { t: "Introduction to Business", cards: [
      ["Scarcity", "Wants exceed the resources available to meet them. Every economic choice begins here."],
      ["Opportunity cost", "The value of the next-best thing given up in order to do what you did."],
      ["Factors of production", "Land, labour, capital and entrepreneurship — the four inputs every business draws on."],
      ["Supply", "How much of a good producers will offer at a given price. It rises as the price rises."],
      ["Demand", "How much of a good buyers will take at a given price. It falls as the price rises."],
      ["Equilibrium price", "The price at which the quantity supplied and the quantity demanded are equal."],
      ["Revenue", "Money coming in from sales, before any costs have been taken out."],
      ["Profit", "Revenue minus costs. The reason a private business exists and the test of whether it works."],
      ["Goods and services", "Goods are tangible things; services are work performed. Most businesses sell some of each."],
      ["Market economy", "An economy where prices are set by supply and demand rather than by a central authority."]
    ]},
    "biz-2": { t: "Economics and Business", cards: [
      ["Microeconomics", "The study of individual decision-making: households, firms, and how prices are set in specific markets."],
      ["Macroeconomics", "The study of the economy as a whole: inflation, unemployment, growth, and the role of government."],
      ["Law of Demand", "As price decreases, quantity demanded increases — and vice versa, all else being equal."],
      ["Law of Supply", "As price increases, quantity supplied increases — all else being equal."],
      ["Equilibrium price", "The price at which quantity demanded equals quantity supplied."],
      ["Opportunity cost", "The value of the next-best alternative given up when a choice is made."],
      ["Comparative advantage", "Producing a good at a lower opportunity cost than a rival."],
      ["Absolute advantage", "Being able to produce more of a good than a rival can, using the same resources."],
      ["Market failure", "A situation in which the market does not allocate resources efficiently on its own."],
      ["Progressive tax", "A tax where the rate rises as income rises."]
    ]},
    "biz-3": { t: "Business Ethics and Social Responsibility", cards: [
      ["Business ethics", "The principles and standards that guide behaviour in the world of business."],
      ["Utilitarianism", "The right action produces the greatest good for the greatest number."],
      ["Deontology", "Certain actions are right or wrong in themselves, regardless of consequences."],
      ["Corporate Social Responsibility", "A business model where companies consider their impact on all of society, not just shareholders."],
      ["Triple Bottom Line", "A framework measuring success by people, planet, and profit."],
      ["Sustainability", "Business practices that meet present needs without compromising future generations."],
      ["Diversity", "The presence of difference within a group."],
      ["Equity", "Ensuring fair treatment recognizing different needs."],
      ["Compliance", "Adhering to laws, regulations, and internal policies."],
      ["Pigouvian tax", "A tax equal to the external cost of a negative externality."]
    ]},
    "biz-5": { t: "Business Writing", cards: [
      ["Encoding", "The sender translating ideas into words or symbols."],
      ["Decoding", "The receiver interpreting the message."],
      ["Feedback", "The receiver's response, which lets the sender know the message was understood."],
      ["Noise", "Anything that interferes with understanding."],
      ["Email", "A short written message sent electronically, usually for internal or quick external communication."],
      ["Memo", "A short internal communication, usually on a specific topic with a clear directive."],
      ["Report", "A structured document presenting findings, analysis, and recommendations."],
      ["Proposal", "A document that persuades a client or stakeholder to approve a course of action."],
      ["Netiquette", "Etiquette for electronic communication: the norms of respectful, professional online behaviour."]
    ]},
    "media-7": { t: "Video Basics", cards: [
      ["Camcorder", "A video camera and a video recorder built into one body."],
      ["Image sensor", "The electronic chip behind the lens that turns light into a signal. CCD and CMOS are the two main kinds."],
      ["Nitrate film", "The first flexible motion-picture film, used from 1889 until about 1951. Highly flammable, and it decays."],
      ["Safety film", "Film on a cellulose acetate base, which replaced nitrate. It does not burn like nitrate, but can suffer vinegar syndrome."],
      ["LaserDisc", "The first commercial optical video disc, launched in 1978. It played pre-recorded films, stored as an analog signal."],
      ["Non-linear editing", "Editing clips on a software timeline, where any shot can move to any place without re-recording the rest."],
      ["180-degree rule", "Keep the camera on one side of the line between two characters, so each stays on the same side of the frame."],
      ["Establishing shot", "The first shot of a scene, usually wide, showing where the action takes place."],
      ["Close-up", "A shot that fills the frame with part of the subject — for a person, usually the face."],
      ["Low-angle shot", "A shot from below the subject looking up, which makes the subject seem bigger and more powerful."],
      ["Dutch angle", "A shot with the camera rolled sideways so the horizon tilts, used to suggest unease or disorientation."],
      ["Tracking shot", "A shot in which the camera travels alongside a moving subject, often on a dolly running on track."],
      ["Pan", "Turning the camera left or right from a fixed point."],
      ["Tilt", "Pointing the camera up or down from a fixed point."],
      ["Dolly zoom", "Moving the camera toward or away from the subject while zooming the other way, so the subject stays the same size while the background seems to stretch or swell."],
      ["Rack focus", "Shifting sharp focus within one shot from a subject at one distance to a subject at another."],
      ["Camera stabilizer", "A rig that isolates the camera from the operator's movement, so a moving shot stays smooth. The Steadicam is the best known."],
      ["Lead room", "Space left in the frame ahead of a moving subject, in the direction it is moving."],
      ["Head room", "The space between the top of a subject's head and the top of the frame."],
      ["Leading lines", "Lines in the frame, such as roads, rails or ropes, that guide the viewer's eye toward the subject."],
      ["Teleprompter", "A script reflected onto angled glass in front of the camera lens, so a presenter can read while looking into the lens."],
      ["Foley", "Everyday sound effects performed and recorded in time with the picture, such as footsteps and doors."],
      ["Match cut", "A cut that links two different shots through a matching shape, movement or composition."],
      ["Jump cut", "A cut between two shots of the same subject from almost the same angle, so time seems to jump."],
      ["Cutaway", "A shot that interrupts the main action to show something else, before returning to it."],
      ["Dissolve", "A transition in which one shot gradually fades out as the next fades in, often suggesting that time has passed."],
      ["Frame rate", "How many still frames are shown each second. Film uses 24; US television about 30."]
    ]},
    "media-8": { t: "Intro to Animation", cards: [
      ["Animation", "Still images, each slightly different, shown in quick succession so that they appear to move."],
      ["Thaumatrope", "A 19th-century toy: a disc with a picture on each side, spun on strings until the two pictures look like one."],
      ["Cel", "A clear plastic sheet a character is painted on, laid over a background that is painted only once."],
      ["Limited animation", "Animation that reuses drawings and redraws only the parts that move, such as a mouth."],
      ["Stop motion", "Animation made by photographing real objects one frame at a time, moving them slightly between shots."],
      ["Pixilation", "Stop motion with live actors, who hold a pose for each frame and shift slightly before the next."],
      ["3D modeling", "Building an object's surface in 3D, usually as a mesh of small flat faces, so a computer can show it from any angle."],
      ["Texture mapping", "Wrapping a flat image around a 3D model to give its surface colour, pattern and detail."],
      ["Rigging", "Building a skeleton of joints inside a 3D model, with controls an animator uses to pose it."],
      ["Key frame", "A pose that marks an important moment — where a move starts, ends or changes. Drawn first, and not only at the start."],
      ["In-betweening", "Making the frames between two key frames so one pose flows into the next. Also called tweening."],
      ["On twos", "Each drawing held for two frames: twelve drawings a second. Smoother on ones, but the same speed."],
      ["Moving hold", "A pause in which the character still moves slightly — a breath, a blink — so it doesn't look frozen."],
      ["Boil", "A shimmer made by tracing the same drawing several times and looping the copies."],
      ["Cycle", "A short series of drawings that ends where it begins, so it can repeat, like a walk."],
      ["Pose to pose", "Drawing the key poses first, then the in-betweens. The opposite of straight ahead action."],
      ["Rotoscope", "Max Fleischer's device, patented in 1917, for tracing live-action film frame by frame."],
      ["Motion capture", "Recording a real performer's movement, often with markers and cameras, to drive a digital character."],
      ["Uncanny valley", "The eerie feeling caused by an artificial human that looks almost, but not quite, real. Mori, 1970."],
      ["Storyboard", "A sequence of drawings showing each shot of a film in order, with notes. The plan everyone works from."],
      ["Production storyboard", "A detailed storyboard of every shot, with dialogue, shot size, camera angle and movement, effects and transitions."],
      ["Animatic", "A storyboard timed to sound and played as a video, to judge pacing and length before animating."],
      ["Squash and stretch", "Flattening an object on impact and lengthening it at speed, while keeping its volume the same."],
      ["Anticipation", "A small preparatory move before a main action, such as crouching before a jump."],
      ["Follow-through", "Loose parts that keep moving after the body stops, then settle back."],
      ["Slow in and slow out", "More drawings near the start and end of a move, so it speeds up and slows down gradually."],
      ["Timing", "The number of drawings or frames given to an action, which sets its speed and feel."],
      ["Critique", "A fair response to a work that describes, analyzes and interprets it before judging it."],
      ["Greeking", "Placeholder text, such as “lorem ipsum”, that shows where real text will go."],
      ["Selective omission", "Leaving facts out so a story gives a particular impression."],
      ["Lossy compression", "Making a file smaller by permanently discarding data. Lossless compression loses nothing."],
      ["Niche blog", "A blog about one specific subject for a particular audience."]
    ]},
    "media-9": { t: "Audio/Video Production", cards: [
      ["Pitch", "A short, organised description of a story, given to an editor or backer to convince them to support it: what happens, and why it is worth making."],
      ["Elevator pitch", "A pitch short enough to deliver in the time an elevator ride takes — about thirty seconds to a minute."],
      ["Exposition", "The opening of a story, where the characters, the time and place, and the background the audience needs are introduced."],
      ["Inciting incident", "The event that pushes the main character out of their routine and into the story's problem. The plot really begins here."],
      ["Rising action", "The events after the inciting incident, each raising the stakes toward the climax. Usually the longest part of a story."],
      ["Climax", "The point of greatest tension, where the story turns and its direction is decided."],
      ["Falling action", "The events after the climax, as the conflict unwinds toward the ending."],
      ["Resolution", "The ending, where the conflict is settled and the characters reach a new normal. Also called the denouement, French for “untying”."],
      ["Conflict", "The problem a plot is built on. Three classic kinds: character against character, character against nature, and character against self."],
      ["Iceberg theory", "Hemingway's way of writing: show the surface and leave the meaning beneath it unstated, like an iceberg mostly hidden under water. Also called the theory of omission."],
      ["Revelation", "A scene in which the audience learns something the characters do not know yet."],
      ["Recognition", "A scene in which a character finally discovers important information — often what the audience already saw in a revelation."],
      ["The gift", "A scene device in which an object seen early returns later carrying meaning, and sometimes a crucial clue."],
      ["Reversal of expectations", "Something unexpected happens, and then a second event flips what it meant. Common at the climax."],
      ["Storyboard", "A sequence of drawings, panel by panel like a comic strip, showing each shot of a production in order, with notes on camera and movement."],
      ["Pre-production", "Everything done before filming or animating starts: writing, planning, storyboarding, casting and scheduling."],
      ["Visual treatment", "The step that adds the camera angle, shot type, movement and effects to every storyboard panel."],
      ["Music bed", "The background music that runs under a production, setting the mood and tying the scenes together."],
      ["Royalty-free music", "Music licensed so that it can be used without paying a fee for each use. It is rarely free: compose it, license it, or use a royalty-free library."],
      ["Style test", "A short sample of the film made in the chosen technique, to check that the technique suits the story before full production begins."],
      ["Model sheet", "A page of drawings of one character from several angles, in different expressions and outfits, so they look consistent across the production."],
      ["Shot list", "A written list of every shot in order, with a short description and who is needed for it. A storyboard written rather than drawn."],
      ["Title card", "The screen near the start of a film showing its title and its most important names."],
      ["Opening credits", "The credits at the beginning: studio, title, leading cast and key crew such as the composer and casting director."],
      ["Closing credits", "The full list at the end — the rest of the cast and crew, sponsors, distributors, licensed music and legal notices — usually scrolling."],
      ["Multiple card", "A title card carrying more than three names, used for supporting cast, crew and extras. One name is a single card, two a double, three a triple."],
      ["Sound effect", "Any sound other than speech or music added to a production to make a storytelling or creative point."],
      ["Foley", "Everyday sounds re-created and recorded in sync with the picture — footsteps, cloth, doors — to make the audio more realistic. Named after Jack Foley."],
      ["ADR", "Automated dialogue replacement: re-recording an actor's own lines in a studio after filming and fitting them to the picture. Also called post-sync."],
      ["Revoicing", "Dubbing a production into another language with new voice actors, whose lines are fitted as closely as possible to the original mouth movements."],
      ["Merchandising", "Offering products for sale to consumers. Promotional merchandise — shirts, cups, posters — spreads awareness of a film, event or team."],
      ["Producer", "The person who finds the money, chooses the material, hires the people and oversees the whole production."],
      ["Director", "The person who runs the production and decides how each scene is played and shot."],
      ["Director of photography", "The person who decides how each shot is lit and framed through the camera."],
      ["Credit", "Your name listed as having worked on a production — the record the industry hires from."],
      ["Franchise", "A series of films, games or shows built around the same characters or world."]
    ]},
    "biz-4": { t: "International Business", cards: [
      ["Absolute advantage", "Producing more of a good than a rival can with the same resources."],
      ["Comparative advantage", "Producing a good at a lower opportunity cost than a rival — giving up less of everything else to make it."],
      ["Competitive advantage", "An edge that lets a business or country outperform its rivals, such as skills, technology or a lower cost."],
      ["Balance of trade", "A country's exports minus its imports over a period. Positive is a trade surplus; negative is a trade deficit."],
      ["Trade barrier", "A government restriction that makes trade across borders harder or more expensive."],
      ["Tariff", "A tax on imported goods. It raises their price so goods made at home can compete."],
      ["Import quota", "A limit on how much of a good may be imported in a given period."],
      ["Embargo", "A government ban on trade with a particular country, or in a particular good."],
      ["Cultural dimensions", "Hofstede's six scores for how a culture treats authority, the group, uncertainty, competition, the long term and enjoyment."],
      ["World Trade Organization", "The WTO: sets the rules of trade between its 166 members and settles their disputes. It replaced GATT in 1995."],
      ["European Union", "An economic and political union of 27 European countries with one single market."],
      ["USMCA", "The United States–Mexico–Canada Agreement, which replaced NAFTA as North America's trade deal in 2020."],
      ["World Bank", "Lends to developing countries for projects that reduce poverty."],
      ["International Monetary Fund", "The IMF: works for stable exchange rates, and lends to countries that cannot pay their international bills."],
      ["Exchange rate", "The price of one currency in terms of another."],
      ["Balance of payments", "The record of every payment between a country and the rest of the world. Counted in full, it always balances."],
      ["Licensing", "Letting a foreign company use your brand, technology or recipe in return for a fee or royalty."],
      ["Franchising", "Letting a local owner run a business under your brand and system, in return for fees and a share of the profits."],
      ["Joint venture", "A new business that two or more companies own and control together, sharing its costs and profits."],
      ["Outsourcing", "Paying another company to do work your company could do itself."],
      ["Offshoring", "Moving a business process to another country."],
      ["Foreign direct investment", "Buying or building a business operation in another country."]
    ]}
  };

  /* ------------------------------------------------------------ Courses */
  var MEDIA_UNITS = ["What are Media Arts?", "The Basics of Design", "Digital Media and Web Design",
    "The “Web 2.0”", "Waves and Sound", "Intro to Photography", "Video Basics",
    "Intro to Animation", "Audio/Video Production"];


  var SEEING = {
    id: "seeing", t: "Seeing numbers", hue: BLUE, subject: "Math", level: "Beginner",
    d: "Arithmetic you can look at. Arrays, areas and patterns, done by noticing rather than calculating.",
    lede: "Most arithmetic is taught as a procedure. This course does it as a picture — once you can see why a rule works, you stop needing to remember it.",
    glyph: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    units: [
      { t: "Counting in shapes", play: true, set: "seeing-1",
        desc: "Counting things without counting them one at a time. Arrays that turn one big count into two small ones, shapes read by what is missing rather than what is there, and patterns that tell you the next number before you work it out." },
      { t: "Areas without formulas",
        desc: "Area as covering rather than as a formula to recall — why the rules you were given are the shapes they came from." },
      { t: "Patterns that grow",
        desc: "Sequences read by their differences, and what happens when the differences themselves form a pattern." }
    ]
  };

  /* Algebra I is a lab course: its units are interactive lessons, practice
     that generates its own problems, and tests (learn/lab/, learn/alg/). */
  var ALG = {
    id: "alg", t: "Algebra I", hue: BLUE, subject: "Math", level: "High School", tag: "Interactive",
    lab: true,
    d: "Variables, equations, and the habit of doing the same thing to both sides.",
    lede: "Algebra as something you do before you write it down: a balance you keep level, lines you drag into place, " +
          "tiles you arrange into rectangles. Every idea is met by moving something, practised until it is easy, and " +
          "tested until it sticks.",
    glyph: '<path d="M17 5H7l6 7-6 7h10"/>',
    objectives: [
      "Write, evaluate and simplify expressions, and tell when two expressions are the same.",
      "Solve linear equations and inequalities, and systems of them — and say how many solutions there are.",
      "Move between a line's table, graph and equation, and read slope and intercepts in context.",
      "Use function notation; find domain, range, rate of change and inverses.",
      "Model growth with arithmetic and geometric sequences, and with linear and exponential functions.",
      "Multiply and factor polynomials, and solve and graph quadratics every way there is."
    ],
    units: [
      { t: "Algebra foundations", lab: true,
        desc: "Letters that stand for numbers. Evaluating expressions, combining like terms, telling when two expressions are the same, and why nothing can be divided by zero." },
      { t: "Solving equations & inequalities", lab: true,
        desc: "The balance: do the same to both sides. Equations with variables on both sides, brackets and fractions; how many solutions an equation can have; and inequalities, including why the sign flips." },
      { t: "Working with units", lab: true,
        desc: "Units as part of the arithmetic: converting rates by multiplying by one, choosing sensible quantities, and letting the units check the answer." },
      { t: "Linear equations & graphs", lab: true,
        desc: "An equation in two variables is a line of solutions. Slope as rise over run, intercepts, horizontal and vertical lines, and what each means in a real situation." },
      { t: "Forms of linear equations", lab: true,
        desc: "Slope-intercept, point-slope and standard form: what each shows at a glance, how to write a line from what you know, and how to move between them." },
      { t: "Systems of equations", lab: true,
        desc: "Two conditions at once. Solving by graphing, substitution and elimination, and systems with no solution or infinitely many." },
      { t: "Inequalities (systems & graphs)", lab: true,
        desc: "Inequalities in two variables as shaded half-planes, systems of them as overlaps, and constraints from real situations." },
      { t: "Functions", lab: true,
        desc: "A rule that gives one output for each input. Notation, domain and range, recognising functions, maxima and minima, average rate of change and inverses." },
      { t: "Sequences", lab: true,
        desc: "Patterns that grow by adding (arithmetic) and by multiplying (geometric), written recursively and explicitly." },
      { t: "Absolute value & piecewise functions", lab: true,
        desc: "Absolute value as distance and its V-shaped graph, shifting and stretching it, and functions defined in pieces." },
      { t: "Exponents & radicals", lab: true,
        desc: "Why the exponent rules are true, zero and negative exponents, square and cube roots, and simplifying radicals." },
      { t: "Exponential growth & decay", lab: true,
        desc: "Adding versus multiplying. Exponential expressions and graphs, growth and decay, and telling linear from exponential in data." },
      { t: "Quadratics: multiplying & factoring", lab: true,
        desc: "Polynomials as areas. Multiplying binomials, special products, and factoring by common factors, by grouping, and as differences of squares and perfect squares." },
      { t: "Quadratic functions & equations", lab: true,
        desc: "Parabolas and their features. Solving by factoring, square roots, completing the square and the quadratic formula; vertex form; transformations." },
      { t: "Irrational numbers", lab: true,
        desc: "Numbers that are not fractions: recognising them, sums and products with rationals, and a proof that √2 is irrational." }
    ],
    grading: [["Lessons", 20], ["Practice", 40], ["Unit tests & course challenge", 40]]
  };


  /* 8th Grade Math (New York), a lab course like Algebra I: its units are
     interactive lessons, practice that generates its own problems, and tests
     (learn/lab/, learn/g8/). The unit list follows the NY Next Generation
     standards as Khan Academy arranges them. */
  var G8 = {
    id: "g8", t: "8th Grade Math", hue: BLUE, subject: "Math", level: "Grade 8", tag: "Interactive",
    lab: true,
    d: "The year arithmetic turns into algebra: roots, powers, lines, and the numbers that are not fractions.",
    lede: "Eighth grade, done by seeing why. A square you size until its area is what you want, a decimal that repeats " +
          "until you catch it, powers you can count on your fingers, and lines you drag into place — each idea met by " +
          "moving something, practised until it is easy, and tested until it sticks.",
    glyph: '<path d="M4 19h16"/><path d="M6 19V9l5-4 5 4v10"/><path d="M9 19v-5h5v5"/>',
    objectives: [
      "Write fractions as repeating decimals and repeating decimals as fractions.",
      "Find square roots and cube roots, and solve equations that need them.",
      "Tell rational numbers from irrational ones, and place an irrational number between two rationals.",
      "Use the exponent rules, including zero and negative exponents.",
      "Read, write and calculate with numbers in scientific notation.",
      "Solve linear equations, graph lines and read what their slope and intercepts mean."
    ],
    units: [
      { t: "Numbers and operations", lab: true,
        desc: "Repeating decimals both ways, square and cube roots, rational against irrational, the exponent rules including negative exponents, and scientific notation." },
      { t: "Solving equations with one unknown", lab: true,
        desc: "Equations with variables on both sides and with brackets, and telling whether an equation has one solution, none, or every number." },
      { t: "Linear equations and functions", lab: true,
        desc: "Graphing proportional relationships, slope as a rate, slope-intercept form, and what makes a relation a function." },
      { t: "Systems of equations", lab: true,
        desc: "Two lines at once: solving by graphing and by substitution, and what it means when they never meet or are the same line." },
      { t: "Geometry", lab: true,
        desc: "Angles made by parallel lines, the angles of a triangle, the Pythagorean theorem and its converse, and the volume of cylinders, cones and spheres." },
      { t: "Geometric transformations", lab: true,
        desc: "Translations, rotations, reflections and dilations; congruence and similarity as what survives them." },
      { t: "Data and modeling", lab: true,
        desc: "Scatter plots, lines of fit, two-way tables, and what a model does and does not say." }
    ],
    grading: [["Lessons", 20], ["Practice", 40], ["Unit tests & course challenge", 40]]
  };


  /* Geometry is a lab course like Algebra I: its units are interactive
     lessons, practice that generates its own problems, and tests
     (learn/lab/, learn/geo/). */
  var GEO = {
    id: "geo", t: "Geometry", hue: BLUE, subject: "Math", level: "High School", tag: "Interactive",
    lab: true,
    d: "Proof as an argument you could win, not a form to fill in.",
    lede: "Geometry done with your hands: shapes you slide, turn, flip and scale until the rule is obvious, " +
          "and then written down. Every idea is met by moving something, practised until it is easy, and tested " +
          "until it sticks.",
    glyph: '<path d="M12 4 21 19H3z"/>',
    objectives: [
      "Use the words and notation of geometry precisely: point, line, segment, ray, angle, plane.",
      "Perform translations, rotations, reflections and dilations on the coordinate plane.",
      "Say which transformation takes one figure to another, and what it keeps the same.",
      "Prove figures congruent or similar, and use that to find missing lengths and angles.",
      "Use right-triangle trigonometry and the Pythagorean theorem.",
      "Work with circles, arcs and solids, and find their areas and volumes."
    ],
    units: [
      { t: "Performing transformations", lab: true,
        desc: "The words of geometry, then the four moves: sliding, turning, flipping and scaling a figure on the coordinate plane." },
      { t: "Transformation properties and proofs", lab: true,
        desc: "What each move keeps the same, rigid motions against dilations, and symmetry as a figure mapped onto itself." },
      { t: "Congruence", lab: true,
        desc: "Figures that one rigid motion takes to the other: triangle congruence by SSS, SAS, ASA and AAS, and what that proves." },
      { t: "Similarity", lab: true,
        desc: "Same shape, different size: similar triangles, the angle-angle criterion, and solving with proportions." },
      { t: "Right triangles & trigonometry", lab: true,
        desc: "The Pythagorean theorem and its converse, special right triangles, and sine, cosine and tangent as ratios." },
      { t: "Analytic geometry", lab: true,
        desc: "Distance and midpoint, dividing a segment in a ratio, and proving things about figures with coordinates." },
      { t: "Circles", lab: true,
        desc: "Arcs, sectors, inscribed angles, tangents, and the equation of a circle." },
      { t: "Solid geometry", lab: true,
        desc: "Volume and surface area, cross sections, and what happens to both when a solid is scaled." }
    ],
    grading: [["Lessons", 20], ["Practice", 40], ["Unit tests & course challenge", 40]]
  };

  var MEDIA = {
    id: "media", t: "Media Arts", hue: "#8f5cff", subject: "English", level: "Introductory",
    tag: "Arts and Design",
    d: "Design, photography, video, animation and sound — the media you use every day, taken apart.",
    lede: "Media arts are everywhere, which is exactly why they go unnoticed. This course covers the history and the practice: design principles, digital media and the web, photography, video, animation and audio production.",
    glyph: '<circle cx="12" cy="12" r="3.4"/><path d="M3 8.5h3.5L8.5 6h7l2 2.5H21v10H3z"/>',
    objectives: [
      "Briefly describe the history of print, design and media.",
      "Explain the five key principles of design and how they are used.",
      "Describe the fundamentals and applications of digital media and web design.",
      "List and describe the applications of various web-based tools used in blogs and wikis.",
      "Describe the history and application of photography, video, animation and audio/video production."
    ],
    parts: [{ name: null, units: MEDIA_UNITS }],
    sets: { 1: "media-1", 2: "media-2", 5: "media-5", 6: "media-6", 7: "media-7", 8: "media-8",
            9: "media-9" },
    grading: [["Quizzes", 35], ["Assignments", 35], ["Mid-term and final exams", 30]],
    textbook: "EHS Media Arts — © Excel Education Systems, Inc., 2021."
  };

  /* Introduction to Business is a lab course like Algebra I: its units are
     interactive lessons, practice that makes its own problems, and tests
     (learn/lab/, the business kit in learn/lab/bizkit.js, learn/biz/). The
     units follow the chapters of OpenStax's Introduction to Business 2e; a
     unit without a file yet stays on the syllabus. */
  var BIZ = {
    id: "biz", t: "Introduction to Business", hue: "#e8a317", subject: "Social Studies",
    level: "Introductory", tag: "Interactive", lab: true,
    d: "What a business is, the economy around it, and what it takes to run one — learned by doing.",
    lede: "Business, taught the way you would learn to run one. You run a stand and watch profit appear, " +
          "move a market until its price settles, follow money around the economy and steer it with the " +
          "Fed's levers — every idea met by doing something, practiced until it is easy, and tested until it sticks.",
    glyph: '<path d="M3 20h18M6 20V9l6-4 6 4v11"/><path d="M10 20v-5h4v5"/>',
    objectives: [
      "Explain how businesses and not-for-profits create a standard of living, and what they need to do it.",
      "Use supply and demand, growth, jobs and prices to explain what is happening in an economy.",
      "Make and defend ethical decisions, and weigh a business's duties to everyone it affects.",
      "Compare the forms of business ownership, and plan what it takes to start one.",
      "Describe how businesses are managed, organized, staffed and motivated.",
      "Explain how products are made, priced, distributed and promoted.",
      "Read financial statements, and explain how money, banks and markets finance a business."
    ],
    units: [
      { t: "Economic systems and business", lab: true,
        desc: "What a business is and what it needs, the world around it, how economies are organized and measured, how governments steer them, and how supply and demand set a price." },
      { t: "Ethics and social responsibility", lab: true,
        desc: "Making ethical decisions, how organizations encourage good conduct, and what a business owes its stakeholders and society." },
      { t: "Competing in the global marketplace", lab: true,
        desc: "Why nations trade, the barriers in the way and what lowers them, the ways a business goes global, and what multinationals do." },
      { t: "Forms of business ownership", lab: true,
        desc: "Sole proprietorships, partnerships, corporations, franchises and cooperatives, and why companies merge and buy each other." },
      { t: "Entrepreneurship and small business", lab: true,
        desc: "What entrepreneurs are like, how a small business is started and run, and the help the Small Business Administration offers." },
      { t: "Management and leadership", lab: true,
        desc: "Planning, organizing, leading and controlling: what managers do, the roles they play and the skills they need." },
      { t: "Designing organizational structures", lab: true,
        desc: "Departments, teams and lines of authority, how centralized decisions should be, and the informal organization underneath." },
      { t: "Human resources and labor relations", lab: true,
        desc: "Hiring, training, paying and evaluating people, the laws that protect them, and how unions and managers bargain." },
      { t: "Motivating employees", lab: true,
        desc: "What makes people want to work well — the classic theories of motivation, and how companies put them to use." },
      { t: "Operations management", lab: true,
        desc: "Producing goods and services: where to make them, how to lay out the work, scheduling, quality and technology." },
      { t: "Products and pricing", lab: true,
        desc: "What a product is, how new ones are developed, the product life cycle, and how businesses set prices." },
      { t: "Distribution and promotion", lab: true,
        desc: "Getting products to customers through distribution channels and stores, and telling them about it with the promotional mix." },
      { t: "Technology and information", lab: true,
        desc: "Information systems and networks, and how businesses manage data, security and privacy." },
      { t: "Accounting and financial information", lab: true,
        desc: "The financial statements a business keeps, what they reveal, and the ratios that compare one business with another." },
      { t: "Money and financial institutions", lab: true,
        desc: "What money is and does, how banks and other institutions work, and the role of the Federal Reserve." },
      { t: "Financial management and securities markets", lab: true,
        desc: "Managing a firm's cash, raising money through debt and equity, and how stock and bond markets work." },
      { t: "Your career in business", lab: true,
        desc: "Choosing a path, finding and landing a job, and doing well once you have it." }
    ],
    grading: [["Lessons", 20], ["Practice", 40], ["Unit tests & course challenge", 40]],
    textbook: "Introduction to Business 2e — OpenStax, Rice University (openstax.org), CC BY-NC-SA 4.0. " +
              "The units follow its chapters; the lessons, examples and problems are OEdu's own."
  };

  /* Global History I is a lab course that takes turns between two kinds of
     lesson: readings (short pages with pictures, primary sources and words to
     tap open, and a question after each page) and interactive lessons, where
     each idea is met by doing something first (learn/lab/, the history kit in
     learn/lab/histkit.js, learn/hist/). Its units follow the chapters of
     OpenStax's World History, Volume 1: to 1500; a unit without a file yet
     stays on the syllabus. */
  var HIST = {
    id: "hist", t: "Global History I", hue: "#d4533b", subject: "Humanities",
    level: "High School", tag: "Reading & Interactive", lab: true,
    d: "The human story from the first people to 1500 — read closely, and questioned the way a historian would.",
    lede: "World history the way a historian works: a few short pages to read, then something to do — drag dates onto " +
          "a line, slide Greenland to the equator, question a conqueror's letter, build a pyramid of causes. Readings and " +
          "hands-on lessons take turns, from the first humans to the year 1500.",
    glyph: '<path d="M3 20h18M4 17h16M12 3 3 8h18z"/><path d="M6 10v7M10 10v7M14 10v7M18 10v7"/>',
    objectives: [
      "Explain what history is for, and read dates, centuries and maps the way historians do.",
      "Tell primary from secondary sources, and question any source for its author, audience, intent and context.",
      "Explain events by their causes, and compare how different kinds of historians interpret them.",
      "Trace how the first humans, cities and civilizations arose in Africa, Asia, Europe and the Americas.",
      "Compare the great empires and faiths of the ancient and medieval world, and the trade that linked them.",
      "Explain how climate, disease and conquest reshaped the world in the centuries before 1500."
    ],
    units: [
      { t: "Understanding the past", lab: true,
        desc: "What history is for, dates and maps, primary sources and how to question them, and how historians explain causes and argue over what they mean." },
      { t: "Early humans", lab: true,
        desc: "Human origins and the migrations out of Africa, life in the Paleolithic, and the Neolithic Revolution that brought farming and settled villages." },
      { t: "Early civilizations and urban societies", lab: true,
        desc: "What makes a civilization, and the first cities and states of Mesopotamia, Egypt and the Indus Valley." },
      { t: "The Near East", lab: true,
        desc: "From Old Babylon to the Medes, Egypt's New Kingdom, the Persian Empire, and the Hebrews." },
      { t: "Asia in ancient times", lab: true,
        desc: "Ancient China, the peoples of the steppes, Korea, Japan and Southeast Asia, and India from the Vedic age to the Maurya Empire." },
      { t: "Mediterranean peoples", lab: true,
        desc: "Early Mediterranean peoples, ancient Greece, the Hellenistic world, the Roman Republic, and the age of Augustus." },
      { t: "Experiencing the Roman Empire", lab: true,
        desc: "Daily life in a Roman family, slavery, an economy of trade, taxes and conquest, religion, and the regions of the empire." },
      { t: "The Americas in ancient times", lab: true,
        desc: "How people reached and settled the Americas, its early cultures and civilizations, and the age of empires." },
      { t: "Africa in ancient times", lab: true,
        desc: "Africa's geography and climate, the spread of farming and the Bantu migrations, the kingdom of Kush, and North Africa's links across the Mediterranean and the Sahara." },
      { t: "Empires of faith", lab: true,
        desc: "The eastward shift of the Roman world, Byzantium and Persia, the kingdoms of Aksum and Himyar, and life at the margins of empire." },
      { t: "The rise of Islam and the caliphates", lab: true,
        desc: "The rise and message of Islam, the Arab-Islamic conquests and the first Islamic states, and religious rule under Islam." },
      { t: "India, the Indian Ocean and East Asia", lab: true,
        desc: "The Indian Ocean world, exchange between East and West in the early Middle Ages, and the border states of Sogdiana, Korea and Japan." },
      { t: "The post-Roman West and the Crusades", lab: true,
        desc: "Western Europe after Rome, the Seljuk migration, the papacy's call to crusade, and the crusading movement." },
      { t: "The Mongol Empire", lab: true,
        desc: "Song China and the steppe peoples, Chinggis Khan and the early Mongol Empire, its break-up, and Christianity and Islam beyond Central Asia." },
      { t: "States and societies in sub-Saharan Africa", lab: true,
        desc: "Culture and society in medieval Africa, its kingdoms and states, and the peoples of the Sahel." },
      { t: "Climate change and plague in the 1300s", lab: true,
        desc: "Asia, North Africa and Europe in the early 1300s, famine and a changing climate, the Black Death, and its long-term effects." },
      { t: "The Ottomans, the Mamluks and the Ming", lab: true,
        desc: "The Ottomans and the Mongols, from the Mamluks to Ming China, and gunpowder and nomads in an age of transition." }
    ],
    grading: [["Lessons", 20], ["Practice", 40], ["Unit tests & course challenge", 40]],
    textbook: "World History, Volume 1: to 1500 — OpenStax, Rice University (openstax.org), CC BY-NC-SA 4.0. " +
              "The units follow its chapters and its photographs are credited where they appear; the readings, lessons, examples and problems are OEdu's own."
  };

  var BIO = {
    id: "bio", t: "Biology", hue: GREEN, subject: "Science", level: "High School",
    d: "Cells, inheritance and ecosystems — systems that keep themselves going.",
    lede: "Life interacts with the world around it. Biotic and abiotic factors are connected. Levels of organisation matter. Niches, populations, interactions and community structure are all one system.",
    glyph: FLASK,
    units: [
      { n: 1, t: "Ecology and Natural Systems", play: true, set: "bio-1",
        desc: "How living and nonliving factors interact to shape ecosystems, influence where species live, drive population dynamics, and determine how species shape each other." }
    ],
    sets: { 1: "bio-1" },
    grading: [["Reading", 30], ["Practice", 30], ["Assessments", 40]],
    unitPromise: ["Everything in an ecosystem is connected.",
                  "A change in temperature can change where a species lives.",
                  "A change in food can change population size.",
                  "A change in one species can affect many others."],
    bigQuestion: "How does life interact with the world around it?",
    unitMap: "01 — How Is Life Organized?\n02 — Why Does Life Live Where It Does?\n03 — What Does an Organism Need to Survive?\n04 — How Big Can a Population Get?\n05 — Investigation — Human-Shark Interactions\n06 — How Do Species Shape Each Other?",
    phenomena: ["Bald Eagle: How do biologists know whether a population is changing?",
                "Monarch Butterfly: Why do monarch butterflies migrate so far?"]
  };

  var BOOK  = '<path d="M4 4.5h6.5A2.5 2.5 0 0 1 13 7v12a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6.5A2.5 2.5 0 0 0 11 7v12a2 2 0 0 1 2-2h7z"/>';
  var FLASK = '<path d="M9.5 3v6.2L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3l-4.9-8.8V3"/><path d="M8 3h8M7.4 15h9.2"/>';
  var GLOBE = '<circle cx="12" cy="12" r="9"/><path d="M3.2 9.5h17.6M3.2 14.5h17.6"/><path d="M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>';
  var SIGMA = '<path d="M17 5H7l6 7-6 7h10"/>';

  function stub(id, t, subject, hue, d, glyph) {
    return { id: id, t: t, subject: subject, hue: hue, d: d, glyph: glyph,
             level: "Introductory", stub: true };
  }

  var SUBJECTS = [
    { n: "English", hue: "#8f5cff",
      d: "Reading closely, writing clearly, and the media doing both around you.",
      courses: [MEDIA,
        stub("read",  "Reading Closely", "English", "#8f5cff", "How a text works, and how to say what it is doing without guessing.", BOOK),
        stub("write", "Writing to Be Understood", "English", "#8f5cff", "Sentences that survive being read once. Structure, evidence, revision.", BOOK)] },
    { n: "Math", hue: BLUE,
      d: "Arithmetic, algebra and geometry, done by seeing why rather than remembering how.",
      courses: [SEEING,
        ALG,
        G8,
        GEO] },
    { n: "Science", hue: GREEN,
      d: "Method first: what would have to be true, and how would you find out.",
      courses: [
        BIO,
        stub("chem", "Chemistry", "Science", GREEN, "Why substances behave as they do, from the structure up.", FLASK),
        stub("phys", "Physics",   "Science", GREEN, "Motion, force and energy, with the algebra kept in service of the idea.", FLASK)] },
    { n: "Social Studies", hue: "#e8a317",
      d: "How societies organise themselves — economies, institutions, and the past that shaped them.",
      courses: [BIZ,
        stub("civ",  "Civics",        "Social Studies", "#e8a317", "How power is arranged, checked, and used where you live.", GLOBE)] },
    { n: "Humanities", hue: "#d4533b",
      d: "The human story — how people lived, believed and made sense of their world, read closely and questioned like a historian.",
      courses: [HIST] }
  ];

  /* ------------------------------------------------------- Prerequisites
     Which unit has to be understood before another one makes sense. The
     knowledge map draws this, and "your next step" walks it — a unit whose
     ground has not been laid is not the next thing to do, however far down
     the list you are. */
  var PRE = {
    media: { 1: [], 2: [1], 3: [2], 4: [3], 5: [1], 6: [2], 7: [6], 8: [6, 7], 9: [5, 7] },
    seeing: { 1: [], 2: [1], 3: [2] },
    alg: { 1: [], 2: [1], 3: [1], 4: [2], 5: [4], 6: [5], 7: [6], 8: [4], 9: [8], 10: [8], 11: [1], 12: [9, 11],
           13: [11], 14: [13, 10], 15: [11] },
    g8: { 1: [], 2: [1], 3: [2], 4: [3], 5: [], 6: [5], 7: [3] },
    geo: { 1: [], 2: [1], 3: [2], 4: [3], 5: [3], 6: [1], 7: [3], 8: [4] },
    biz: { 1: [], 2: [1], 3: [1], 4: [1], 5: [4], 6: [1], 7: [6], 8: [7], 9: [8], 10: [6], 11: [1], 12: [11],
           13: [6], 14: [1], 15: [1], 16: [14, 15], 17: [] },
    hist: { 1: [], 2: [1], 3: [2], 4: [3], 5: [3], 6: [3], 7: [6], 8: [2], 9: [2], 10: [7], 11: [10], 12: [5],
            13: [7], 14: [12], 15: [9], 16: [14], 17: [16] }
  };

  /* ------------------------------------------------------------- Accounts
     There are none here any more, and that is the point.

     This file used to carry two accounts, each with a PBKDF2 salt and
     verifier, and a long comment explaining that a static host has no server
     to check a password against so the verifier had to ship to the browser.
     The comment was true and the design was still wrong: a verifier in a
     downloadable file is one an attacker grinds offline at their own pace and
     on their own hardware, and an app that decides for itself who is signed
     in cannot enforce anything against somebody with a console open.

     Identity now belongs to the Oplo platform. Accounts live in the platform
     database, passwords are hashed and checked on the server, and this app
     receives a session it cannot forge and an account it did not choose.
     api.js is the only file that speaks to any of it.

     Nothing in this file is secret, and nothing in it decides anything about
     access. It is curriculum.
  */
  var ITERATIONS = 210000;   // kept only so older references do not throw

  /* ------------------------------------------------------------ OploContacts
     The directory a reading room is invited from. It is deliberately the same
     shape a real contacts service would return — id, name, initials, a hue for
     the avatar, and what they are — so pointing this at an API later is a
     change of source and not a change of screen. */
  /* The directory a reading room is invited from. It used to be built from
     the account list in this file; the roster is the platform's now, so this
     returns nothing and app.js asks the API instead. Kept as a function so
     the shape of the call site does not change. */
  function contacts() { return []; }

  return { SUBJECTS: SUBJECTS, SETS: SETS, PROBLEMS: SEEING_P, PRE: PRE, ITERATIONS: ITERATIONS,
           SEEING: SEEING, MEDIA: MEDIA, BIZ: BIZ, HIST: HIST, BIO: BIO, CONTACTS: contacts };
})();
