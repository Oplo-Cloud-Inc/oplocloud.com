/* ==========================================================================
   Media Arts — Unit 5, Waves and Sound. Sections 5.1 to 5.9.

   Written from the EHS course text and the unit deck. Curated rather than
   copied: every definition a section tests on is here, every number is here,
   and the padding around them is not. Each block is typed so the reader can
   set it properly — a definition is not a paragraph, and a figure is not a
   sentence in bold.
   ========================================================================== */
window.OPLO_UNIT5 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  var D = function (t, d) { return { k: "def", t: t, d: d }; };
  var Q = function (t, s) { return { k: "quote", t: t, s: s }; };
  var N = function (t) { return { k: "note", t: t }; };
  var S = function (n, d) { return { k: "stat", n: n, d: d }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };

  return [{
    n: "5.1", t: "Parts of the Ear", kicker: "How you hear",
    stand: "Air, bone, fluid, brain — in that order. Every system in the body keeps a balance, " +
           "and hearing depends on a chain of events that has to work in sequence.",
    mins: 7,
    video: "media/mediaart5_1.mp4",
    objectives: ["Identify the major parts of the human ear and their functions"],
    body: [
      H("What sound is"),
      P("Sound has more than one definition, depending on who is asked. In physics it is a vibration " +
        "that propagates as an audible — yet mechanical — wave of pressure through air or " +
        "water. In psychology it is the reception of those waves, perceived by the brain. Both " +
        "definitions agree on one thing: sound relies on vibration through a medium."),
      N("Watch a firework display and you see the light first. The bang arrives a second or two " +
        "later, because sound travels far slower than light. Everything in this unit lives inside " +
        "that gap."),
      H("The outer ear"),
      P("The outer ear is the part you can see, and it has three sections: the pinna, the ear canal " +
        "and the tympanic membrane."),
      D("Pinna", "Also called the auricle — the part of the ear seen on each side of the head. " +
        "Made of cartilage. It collects sound vibrations and guides them into the ear canal, and that " +
        "process is how we judge the direction a sound came from."),
      D("Cartilage", "Firm, flexible tissue found in various forms. It gives the pinna its shape, " +
        "and is also found in the respiratory tract and around the surfaces where joints meet."),
      S("2.5 cm", "The length of the adult ear canal — the external acoustic meatus, or EAM — " +
        "running from the pinna to the eardrum."),
      P("The canal divides in two. The outer third is elastic cartilage, the same framework as the " +
        "pinna itself. The inner two-thirds is bone."),
      D("Tympanic membrane", "The eardrum. A thin, cone-shaped membrane separating the outer ear " +
        "from the middle ear, transmitting sound from the air to the ossicles inside."),
      Q("Air becomes fluid.", "The eardrum converts and amplifies vibration in the air into " +
        "vibration in fluid — which is the whole trick of hearing."),
      H("The middle ear"),
      P("The middle ear begins at the eardrum and ends at the inner ear. It contains three tiny " +
        "bones, together called the ossicles, which were given their Latin names for their shapes."),
      L("The ossicles", [
        ["Malleus", "The hammer."],
        ["Incus", "The anvil."],
        ["Stapes", "The stirrup."]
      ]),
      P("As sound hits the eardrum it is forced back and forth with the vibrations, and that moves " +
        "the ossicles. The soundwave becomes a mechanical vibration played through three tiny bones. " +
        "They carry that energy to the oval window of the cochlea, converting the eardrum's " +
        "vibrations into amplified pressure waves in the fluid of the inner ear."),
      H("The inner ear"),
      P("The inner ear is the most complicated of the three, and it holds the sensory organs " +
        "necessary for both hearing and balance — one organ doing two entirely different jobs."),
      D("Cochlea", "The hearing part of the inner ear. A bony structure shaped like a snail, filled " +
        "with two fluids: the endolymph and the perilymph."),
      D("Eustachian tube", "A narrow passage leading from the pharynx to the cavity of the middle " +
        "ear. It equalises pressure on each side of the eardrum, and drains any accumulated " +
        "secretions, infection or debris from the middle ear space."),
      P("Without that tube the middle ear would be a sealed pocket of air inside your head — " +
        "very vulnerable to changing air pressure, and prone to unhealthy function. Muscles at the " +
        "back of the throat open and close it. It sits closed most of the time, which prevents the " +
        "normal secretions at the back of the nose from contaminating the middle ear. Someone whose " +
        "tube is consistently open often suffers chronic ear infections."),
      D("Pharynx", "Immediately behind the nasal cavity. It filters, warms and moistens air on its " +
        "way to the lungs.")
    ],
    check: { q: "The inner ear is the least complicated of the three parts of the ear.",
             opts: ["True", "False"], right: 1,
             why: "The inner ear is the <em>most</em> complicated of the three — it holds the " +
                  "sensory organs for hearing and for balance." }
  }, {
    n: "5.2", t: "How Sound Waves Work", kicker: "The wave itself",
    stand: "Three kinds of wave, and six ways to measure one. Understanding how waves relate is what " +
           "lets you understand how the ear and brain interpret them all at once.",
    mins: 6,
    objectives: ["Differentiate between types of sound waves",
                 "Identify key characteristics of sound waves"],
    body: [
      D("Acoustics", "The science dedicated to understanding sound waves."),
      H("Longitudinal, transverse, surface"),
      Q("Sound is always longitudinal.", "These waves permeate gases, plasma, air and liquids in " +
        "order to carry sound over a distance."),
      P("Longitudinal waves alternate pressure deviations from the equilibrium pressure, causing " +
        "local regions of compression — which is why they are also called compression waves. " +
        "They need a medium to propagate."),
      P("The confusion comes with solids. Through a solid, sound can travel as a longitudinal wave " +
        "<em>and</em> as a transverse wave. Transverse waves alternate the stress of the wave using " +
        "right angles pointed in the direction of propagation. Because sound waves oscillate, they " +
        "are converting energy back and forth between potential and kinetic the whole time."),
      D("Surface wave", "A mechanical wave that propagates along the interface between differing " +
        "media. The most common example is the gravitational waves travelling between two fluids of " +
        "different densities."),
      H("Measuring a wave"),
      L("Four points on any wave", [
        ["Crest", "The maximum value, or upward displacement, of the cycle."],
        ["Trough", "The opposite of a crest — the lowest point in the cycle."],
        ["Wavelength", "The spatial period: the distance over which the shape repeats, measured " +
                       "between two consecutive corresponding points of the same phase."],
        ["Amplitude", "The height of the wave, most often measured peak-to-peak — the change " +
                      "between crest and trough."]
      ]),
      Q("Wavelength is horizontal. Amplitude is vertical.",
        "That is the whole difference, and it is the one students reverse."),
      D("Frequency", "How often the particles of a medium vibrate as a wave passes through — " +
        "the number of complete vibrational cycles in a given time. Measured in Hertz; one Hz is one " +
        "cycle per second."),
      D("Period", "The time it takes a particle of sound to make one complete vibrational cycle. " +
        "Measured in units of time, from seconds to years — Earth's period of orbit is 365 days."),
      N("Frequency counts the cycles. Period times a single one. They are two sides of the same coin.")
    ],
    check: { q: "Amplitudes are measured vertically using a peak-to-peak method.",
             opts: ["True", "False"], right: 0,
             why: "Amplitude is the height of the wave, measured vertically from crest to trough. " +
                  "Wavelength is the horizontal measurement." }
  }, {
    n: "5.3", t: "Sound Frequencies", kicker: "Frequency and pitch",
    stand: "What you can hear, and what you cannot. Frequency has a direct effect on pitch — and " +
           "on which animals are listening to a sound you will never notice.",
    mins: 6,
    objectives: ["Describe the nature of high and low sound frequencies",
                 "Explain how frequency and pitch are related"],
    body: [
      P("Sound waves are introduced into a medium by a vibrating object — vocal cords, a guitar " +
        "string, anything. Whatever the object, the particles of the medium move at a given " +
        "frequency, measured as the number of complete back-and-forth vibrations per unit of time."),
      N("As a sound wave moves through a medium, every particle of that medium vibrates at the same " +
        "frequency."),
      H("Compressions and rarefactions"),
      P("A sound wave is also a pressure wave, so a detector can register the change and produce a " +
        "visual oscillation from high to low pressure and back. The high pressure points are " +
        "compressions; the low pressure points are rarefactions. Together they produce a frequency."),
      S("20 – 20,000 Hz", "The range of frequencies a human ear can detect."),
      L("Outside the human range", [
        ["Infrasound", "Any sound wave below 20 Hz — inaudible to us."],
        ["Ultrasound", "Anything above 20,000 Hz."]
      ]),
      L("Animals hear differently", [
        ["Dogs — 45,000 Hz", "Which is why they hear pitches we cannot."],
        ["Bats — 120,000 Hz", "The most remarkable of all, used for navigation and hunting."],
        ["Elephants — 5 Hz", "The unusual ability to detect infrasound, far below our floor."]
      ]),
      D("Pitch", "The sensation of detecting frequency. A high-pitched sound has a much higher " +
        "frequency; a low-pitched sound, a much lower one."),
      H("Frequency and music"),
      S("2 : 1", "The ratio between two notes an octave apart. An octave is a series of eight notes " +
        "occupying the interval between two — and those two have twice, or half, the frequency " +
        "of the other."),
      D("Harmonic", "A wave whose frequency is a positive integer multiple of the original wave's. " +
        "The original is called the first harmonic. Two frequencies used together tend to sound " +
        "right when their harmonics are multiples of the original.")
    ],
    check: { q: "Which animal in this section detects the lowest frequencies?",
             opts: ["Dogs", "Bats", "Elephants", "Humans"], right: 2,
             why: "Elephants detect infrasound down to about 5 Hz — well below the human floor " +
                  "of 20 Hz. Bats go highest, at 120,000 Hz." }
  }, {
    n: "5.4", t: "Sound in the Real World", kicker: "Four kinds of sound",
    stand: "Everything you hear in a film is one of four things. Balancing them is what decides " +
           "whether the message actually arrives.",
    mins: 5,
    objectives: ["Identify and describe the different types of sound used in entertainment"],
    body: [
      L("The four layers", [
        ["Dialogue", "The conversation between two or more people."],
        ["Ambient", "The background noise of a given location."],
        ["Sound effects", "Any sound other than speech or music, made artificially for a production."],
        ["Foley", "A type of sound effect: everyday sounds reproduced and added in."]
      ]),
      Q("Dialogue usually wins.", "When there is dialogue in a play, film or broadcast it is often " +
        "relaying important information — which decides how loud and clear everything else is " +
        "allowed to be."),
      D("Ambient noise", "The background noise of a given location, sometimes called atmospheric " +
        "sound or noise pollution. It places the narrator in their surroundings — an editor may " +
        "add crashing waves under a beach scene for exactly that reason. Roadway noise counts too."),
      P("Ambient is also the sound that typically combats with dialogue. When it overpowers the " +
        "voice, a crew has two options: introduce a physical noise barrier to stop or inhibit some " +
        "of the sound waves, or mute the clip and overlay the dialogue separately."),
      H("Effects and Foley"),
      P("Sound effects are used to emphasise artistic or other content in films, television, live " +
        "performance, animation and video games. Dialogue and music recordings are never called " +
        "sound effects — though sound effects can be applied to them."),
      N("In motion picture and television production, sound effects are often taken from recorded " +
        "sounds, then presented to make a specific storytelling or creative point without using " +
        "dialogue or music."),
      D("Foley", "The reproduction of everyday sound effects, added to films, videos and other media " +
        "to enhance audio quality. If a bottle falls from a table and the recording is poor, an " +
        "editor adds breaking-glass Foley to make the scene read as real."),
      Q("Without them, movies would feel unnaturally quiet.",
        "Footsteps, cloth, doors, cutlery — almost none of it survives the original recording.")
    ],
    check: { q: "What type of sound typically combats with dialogue?",
             opts: ["Sound effects", "Foley", "Ambient noise", "Music"], right: 2,
             why: "Ambient noise is the background sound of a location, and it is what most often " +
                  "fights the dialogue for room on the track." }
  }, {
    n: "5.5", t: "The Right Microphone Matters", kicker: "Which microphone",
    stand: "Every microphone answers one question: where should I listen? Six pickup patterns, and " +
           "the situation each one is built for.",
    mins: 8,
    objectives: ["Differentiate between types of microphones and describe their different uses"],
    body: [
      D("Omnidirectional", "Picks up sound with equal gain from all sides and directions. Its polar " +
        "plot is circular, recording from zero to 360 degrees — so a speaker is captured at the " +
        "same quality from the front, back, left or right."),
      Q("A stage full of instruments, and a choir behind.",
        "Omnidirectional microphones are most useful where sound has to be recorded from several " +
        "directions at once."),
      D("Unidirectional", "Picks up sound with high sensitivity from one specific side. Recording " +
        "from every direction is often exactly what you do not want — a keynote speech or a " +
        "lecture needs the speaker and not the audience."),
      D("Shotgun", "Records from one direction like a unidirectional mic, but focuses tightly on " +
        "sound coming from directly in front and ignores the sides and rear. The result is a cleaner " +
        "recording."),
      N("With either a shotgun or a unidirectional microphone, the source has to stay stationary in " +
        "front of it."),
      D("Bidirectional", "Picks up the front and back with high sensitivity and the sides poorly. " +
        "Often called a figure-of-eight microphone for the shape of the area it records well from. " +
        "Built for a Q&amp;A or an interview — the speaker on one side, the audience on the other."),
      D("Cardioid", "Named for the heart shape of its pickup range. High gain from the front and " +
        "sides, poor quality from the rear. A concert is the classic case: the singer in front, the " +
        "instruments at the sides, the cheering behind ignored."),
      D("Hypercardioid", "An exaggerated cardioid. It records the speaker plus the small amount of " +
        "ambient noise that makes a recording feel natural rather than sealed."),
      H("Two you have held"),
      L("Handheld and lavalier", [
        ["Handheld", "The most common form, used for human speech everywhere from musical " +
                     "performance to news interviews. Outdoors, wind will overpower the speaker."],
        ["Lavalier", "The lav or lap mic, clipped to a collar or clothing for hands-free operation " +
                     "in television, theatre and public speaking."]
      ])
    ],
    check: { q: "Omnidirectional microphones are used to record sounds from multiple directions.",
             opts: ["True", "False"], right: 0,
             why: "An omnidirectional microphone records from zero to 360 degrees with equal gain, " +
                  "which is exactly what a stage with instruments on several sides needs." }
  }, {
    n: "5.6", t: "Audio Editing Software", kicker: "Connect, then edit",
    stand: "Two connectors and four steps. Editing too much becomes obvious and leaves choppy audio, " +
           "which is why knowing the process matters as much as owning the tools.",
    mins: 5,
    objectives: ["Differentiate between types of microphone connectors",
                 "Summarize the process of editing audio"],
    body: [
      H("Two connectors"),
      L("USB and XLR", [
        ["USB", "Connects easily to most computers and laptops, and comes in every pattern — " +
                "unidirectional, bidirectional, omnidirectional, cardioid. Which one you buy depends " +
                "entirely on what you intend to record."],
        ["XLR", "The professional standard, used in audio, video and stage lighting. Circular, with " +
                "three to seven pins. It usually will not connect to a laptop directly, so a special " +
                "adapter is required."]
      ]),
      P("Many computers now have a built-in microphone, but they rarely record at the quality a " +
        "designer wants. That is where an external microphone earns its place."),
      H("Editing, in four steps"),
      L("The process", [
        ["Find the spot", "Audio files always appear as sound waves. Listen, pause, and identify " +
                          "which part of the wave is the part you want to change."],
        ["Zoom in", "Zooming lets you separate each wave and edit them individually, which is how " +
                    "detailed corrections get made."],
        ["Smooth it out", "The goal is a track that plays without hiccups. Most designers remove " +
                          "awkward pauses and filler — the ums and the uhs."],
        ["Add the effects", "Only once it runs smoothly. Waves crashing, seagulls in the background " +
                            "— whatever drives the message home."]
      ]),
      Q("Edit too much and it shows.", "Over-editing becomes obvious and leaves choppy audio.")
    ],
    check: { q: "At which point in the process should sound effects be added?",
             opts: ["Before finding the spot to edit", "While zooming into the waves",
                    "Once the audio already runs smoothly", "Effects are added first, then trimmed"],
             right: 2,
             why: "Effects go on last. Smooth the track first — layering effects over choppy " +
                  "audio only hides the problem." }
  }, {
    n: "5.7", t: "A Story With Sound", kicker: "Foley",
    stand: "Making sounds out of whatever is lying around. Stock effects save time, but the " +
           "convincing ones are usually made by hand.",
    mins: 5,
    objectives: ["Summarize the process of recording sound effects"],
    body: [
      D("Foley work", "Using various objects to make certain sounds — sounds that may not even " +
        "be associated with the object making them. Foley must match the actions on screen, and " +
        "often takes the place of words entirely."),
      Q("First, make the list.", "Before employing any objects, review the film and compile a list " +
        "of the sound effects the piece needs, in the exact order they appear."),
      H("What Hollywood actually uses"),
      L("Tried and tested", [
        ["Thin sticks and dowel rods", "Whooshing effects."],
        ["Old chairs and stools", "Controlled creaking."],
        ["Heavy-duty staple guns", "The gunshots you hear in films."],
        ["Celery, twisted and snapped", "Bones breaking."],
        ["Corn starch in a leather pouch", "Walking through snow."]
      ]),
      Q("It is the marriage between picture and sound that creates realistic effects.",
        "Neither one convinces on its own. The options are endless — experiment with whatever " +
        "is around you and readily available."),
      H("Telling a story through sound"),
      P("A story told in sound alone can carry real meaning, and it demands resourcefulness. If the " +
        "story wants to embody clumsiness, the viewer might hear sporadic crashing in the " +
        "background — said without a single word."),
      N("Do not explain it. Let people watch and perceive the story, then ask them what they thought " +
        "the message was. That is how you find out whether it landed.")
    ],
    check: { q: "Foley work uses various objects to make certain sounds that may not even be " +
                "associated with that object.",
             opts: ["True", "False"], right: 0,
             why: "Celery for breaking bones, corn starch for footsteps in snow — the object " +
                  "making the sound rarely resembles the thing on screen." }
  }, {
    n: "5.8", t: "Radio Advertising", kicker: "Thirty seconds",
    stand: "Hard sell, soft sell, and five kinds of campaign. In half a minute a business has to " +
           "advertise a product in a way that actually moves someone to buy it.",
    mins: 6,
    objectives: ["Differentiate between hard sell and soft sell approaches in radio advertising",
                 "List the types of advertisements and campaigns in radio advertising"],
    body: [
      S("30", "Seconds — typically all the time there is."),
      H("Hard sell and soft sell"),
      L("Three things separate them", [
        ["Directness", "How direct the advertiser is with the buyer."],
        ["Rational appeal", "Whether the argument is made to the head or to the feelings."],
        ["Amount of information", "How much the buyer is told about the product."]
      ]),
      D("Hard sell", "Extremely direct and forceful, with a loud slogan to grab attention. It " +
        "corners the buyer, focuses heavily on product quality, and argues that buying is the " +
        "rational decision that will improve their life. A great deal of information, fast."),
      D("Soft sell", "Focused on emotion rather than argument. Less direct, aimed at triggering " +
        "feelings that make the buyer want the product. The goal is a mood or an image that " +
        "appeals — persistence is not part of it."),
      H("Five kinds of campaign"),
      L("Beyond selling directly", [
        ["Negative", "Usually seen in political elections but used for products too, pointing out " +
                     "what might go wrong if the consumer does not buy."],
        ["Conversational", "Agreed-upon message-based communication between consumer and brand. " +
                           "Possibly the most common of all, and it keeps the brand in mind."],
        ["Aspirational", "The brand suggests the product will immediately enhance the consumer's " +
                         "life. Wheaties telling customers to “Awaken the Champion Within.”"],
        ["Testimonial", "Real people recounting positive experiences, used to prove to new " +
                        "consumers why they should buy."],
        ["Instructional", "A longer pitch on solving a problem more efficiently with a new product."]
      ]),
      N("Aspirational is not inspirational. Inspirational is someone you admire; aspirational is " +
        "someone you wish to be.")
    ],
    check: { q: "Which technique focuses on emotion and is less direct?",
             opts: ["Hard sell", "Soft sell", "Negative campaigning", "Instructional advertising"],
             right: 1,
             why: "A soft sell aims at feeling rather than argument, and works by creating a mood " +
                  "or image the buyer wants to be part of." }
  }, {
    n: "5.9", t: "Recording Audio and Creating Ads", kicker: "Dialogue and music",
    stand: "The two things that do the work in an advertisement. One carries the information; the " +
           "other is the part anybody remembers.",
    mins: 5,
    objectives: ["Explain the importance of dialogue and music in an advertisement"],
    body: [
      L("A division of labour", [
        ["Dialogue", "What they need to know — the information required to make an informed " +
                     "purchasing decision."],
        ["Music", "What they remember, long after the advertisement ends."]
      ]),
      H("The importance of dialogue"),
      P("Many believe dialogue is the key to trust between advertiser and consumer. Used well, it " +
        "builds long-lasting relationships: companies present data, engage more directly, and " +
        "personalise the experience using what they know."),
      L("Recording it cleanly", [
        ["Lavalier", "Clipped to a tie or shirt, wired or wireless. Records personal dialogue at " +
                     "high quality because it sits close to the source."],
        ["Shotgun", "Grabs audio from a production set while staying outside the frame, suspended " +
                    "above the sound source."]
      ]),
      H("The importance of music"),
      P("Music does more than set a feeling. It brands the product, and can build value by adding " +
        "an aura of sophistication."),
      D("Jingle", "A short song describing a product. The brain is more likely to remember one, and " +
        "that repeated exposure raises the chance a consumer will buy."),
      Q("The music is what brings home the message.",
        "When an advertisement aims at a particular emotion, the music is what delivers it.")
    ],
    check: { q: "The brain is more likely to remember a short song that describes a product.",
             opts: ["True", "False"], right: 0,
             why: "That is exactly why jingles exist — repetition and recall are the point." }
  }];
})();
