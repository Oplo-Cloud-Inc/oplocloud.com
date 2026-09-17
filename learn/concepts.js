/* ==========================================================================
   Concepts.

   A flashcard is a term and a definition, and a term and a definition can
   only ever ask one question: do you remember this? That is the ceiling on
   every study app built out of pairs, and it is why a student can finish a
   set at 100% and still not be able to use any of it.

   So OEdu does not run on pairs. It runs on concepts, and a concept carries
   the things you would need in order to ask a harder question:

     why    why this is worth knowing at all
     eg     one concrete instance
     miss   the mistake students actually make, and what to think instead
     pre    what has to be understood first
     rel    what it sits next to
     apply  a question that needs the idea used, not recalled
     xfer   a question about a situation the text never mentioned
     say    what a good explanation in their own words would contain

   The five cognitive levels come out of that directly:

     RECOGNISE  pick it out of four            <- from the pair
     RECALL     produce it from nothing        <- from the pair
     EXPLAIN    say it in your own words       <- needs `say`
     APPLY      use it on a new case           <- needs `apply`
     TRANSFER   predict something unseen       <- needs `xfer`

   Media Arts 5 to 8 and Business 4 are authored in full below.
   Every other set is derived: a concept with the pair and nothing else, which
   honestly caps that set at the first two levels rather than pretending to
   depth it does not have.
   ========================================================================== */
window.OPLO_CONCEPTS = (function () {
  "use strict";

  /* Compact by design. Authoring twenty of these is only sustainable if the
     shape stays small enough to hold in your head while you write. */
  function C(k, o) { o.k = k; return o; }

  var MEDIA5 = [
    C("Pinna", {
      why: "It is the only part of the hearing chain you can see, and the reason you can tell " +
           "whether a sound came from behind you without turning round.",
      eg: "Cupping a hand behind your ear makes a quiet sound louder — you have just made your " +
          "pinna bigger.",
      miss: [["It is where hearing happens.",
              "Nothing is heard in the pinna. It collects and steers; the hearing happens four " +
              "stages later, in the cochlea."]],
      pre: [], rel: ["Tympanic membrane"],
      say: ["cartilage", "collect", "direction", "canal", "visible", "outer"],
      apply: { ask: "Someone is born with a much flatter pinna than usual. Their cochlea and " +
                    "ossicles are normal. What would you expect them to find hardest?",
               opts: ["Hearing high frequencies",
                      "Telling which direction a sound came from",
                      "Equalising pressure on a plane",
                      "Hearing at all in a quiet room"],
               right: 1,
               why: "Direction is judged from how the pinna's folds shape sound before it enters " +
                    "the canal. Flatten the folds and you lose the cue, not the loudness." },
      xfer: { ask: "Owls hunt in darkness and can strike a mouse they never see. Their facial " +
                   "disc of stiff feathers works like a pair of enormous pinnae. What is it buying them?",
              opts: ["Protection from cold",
                     "A wider frequency range",
                     "Much sharper location of a sound in space",
                     "Louder hearing at every frequency"],
              right: 2,
              why: "Bigger collectors, set asymmetrically, sharpen the direction cue. The owl is " +
                   "solving the same problem your pinna solves, with far more hardware." }
    }),

    C("Tympanic membrane", {
      why: "It is the conversion point of the whole system: everything before it is air, " +
           "everything after it is solid and then fluid.",
      eg: "A drum skin does the same job in reverse — the air moves the skin, the skin moves the shell.",
      miss: [["It sends the sound straight to the brain.",
              "It moves three bones, which move a fluid. The signal does not become nerve traffic " +
              "until the cochlea."]],
      pre: ["Pinna"], rel: ["Ossicles", "Eustachian tube"],
      say: ["eardrum", "membrane", "air", "fluid", "vibration", "middle ear"],
      apply: { ask: "A perforated eardrum still lets some sound through to the ossicles. Why is " +
                    "hearing still noticeably worse?",
               opts: ["The ossicles stop moving entirely",
                      "A hole cannot build the pressure difference that drives the movement",
                      "The cochlea fills with air",
                      "The pinna no longer collects sound"],
               right: 1,
               why: "The membrane works because pressure differs across it. A hole equalises the " +
                    "two sides, so much less of the wave is converted into movement." },
      xfer: { ask: "Engineers building an underwater microphone cannot use an air-backed " +
                   "membrane. What is the problem they are solving?",
              opts: ["Water carries no sound",
                     "Water is far denser than air, so a membrane tuned for air barely moves",
                     "Water has no frequency",
                     "Membranes dissolve"],
              right: 1,
              why: "Matching a light medium to a heavy one is exactly what the eardrum and " +
                   "ossicles evolved to do. Change the medium and the match has to change." }
    }),

    C("Ossicles", {
      why: "Three bones the size of grains of rice are what make it possible to hear anything " +
           "quiet at all.",
      eg: "Malleus, incus, stapes — hammer, anvil, stirrup, named for what they look like.",
      miss: [["They amplify by adding energy.",
              "They add nothing. They concentrate the same energy onto a much smaller area, which " +
              "is what raises the pressure."]],
      pre: ["Tympanic membrane"], rel: ["Cochlea"],
      say: ["three", "bones", "middle ear", "malleus", "incus", "stapes", "lever"],
      apply: { ask: "The eardrum is roughly seventeen times the area of the stapes footplate. " +
                    "What does that ratio buy?",
               opts: ["A longer delay before the sound arrives",
                      "A large pressure gain, so faint airborne sound can move fluid",
                      "A wider range of audible frequencies",
                      "Protection from infection"],
               right: 1,
               why: "Same force over a much smaller area is much greater pressure. That is the " +
                    "whole trick of getting air to move fluid." },
      xfer: { ask: "A muscle in the middle ear stiffens the ossicles when a very loud sound " +
                   "arrives. What is that for?",
              opts: ["To hear the sound more clearly",
                     "To damp the transfer and protect the cochlea",
                     "To equalise pressure",
                     "To raise the pitch"],
              right: 1,
              why: "If the chain's job is efficient transfer, the way to protect what is " +
                   "downstream is to make the transfer temporarily worse." }
    }),

    C("Cochlea", {
      why: "This is where sound stops being physics and starts being information.",
      eg: "A snail shell filled with fluid, lined with hair cells that fire when they bend.",
      miss: [["It amplifies sound.",
              "It sorts it. Different places along the coil respond to different frequencies — " +
              "it is a mechanical spectrum analyser."]],
      pre: ["Ossicles"], rel: ["Frequency", "Pitch"],
      say: ["inner ear", "fluid", "snail", "hair cells", "nerve", "frequency"],
      apply: { ask: "Long exposure to loud noise damages hair cells at the base of the cochlea " +
                    "first. What does a person notice going first?",
               opts: ["Low bass notes", "High frequencies", "Speech volume overall", "Direction"],
               right: 1,
               why: "The base responds to high frequencies. Position along the coil is frequency, " +
                    "so where the damage is tells you what is lost." },
      xfer: { ask: "A cochlear implant does not repair hair cells. It puts an electrode array " +
                   "along the coil. What must the array get right to work at all?",
              opts: ["The total loudness",
                     "Stimulating the right position for the right frequency",
                     "The direction the sound came from",
                     "The speed of the wave"],
              right: 1,
              why: "The implant borrows the cochlea's map. Stimulate the wrong place and the " +
                   "brain hears the wrong pitch." }
    }),

    C("Eustachian tube", {
      why: "It is the reason your ears pop, and the reason they hurt when they cannot.",
      eg: "Swallowing on a descending plane opens it and lets the pressure equalise.",
      miss: [["It drains sound.",
              "It carries air and fluid, not signal. Its job is pressure and drainage."]],
      pre: ["Tympanic membrane"], rel: [],
      say: ["pressure", "equalise", "pharynx", "throat", "drain", "middle ear"],
      apply: { ask: "A child with a blocked tube hears as though underwater. Why?",
               opts: ["The cochlea has filled with air",
                      "Unequal pressure stiffens the eardrum, so it moves less",
                      "The pinna is obstructed",
                      "The ossicles have fused"],
               right: 1,
               why: "A membrane pushed out of balance is a membrane under tension, and a tense " +
                    "membrane converts far less of the wave." },
      xfer: { ask: "Divers are taught to equalise every metre or two on the way down rather " +
                   "than waiting. What is the risk they are avoiding?",
              opts: ["Running out of air",
                     "Pressure building faster than the tube can be opened against it",
                     "Losing direction underwater",
                     "Cold water in the canal"],
              right: 1,
              why: "Past a certain difference the tube collapses shut. The fix is to never let " +
                   "the difference get that big." }
    }),

    C("Longitudinal wave", {
      why: "It is why sound cannot cross space, and why it travels faster through steel than air.",
      eg: "A slinky pushed along its length: bunched coils and stretched coils travelling down it.",
      miss: [["Sound waves look like the curve drawn on the board.",
              "The curve is a graph of pressure, not a picture of the motion. The air moves back " +
              "and forth along the direction of travel, not up and down."]],
      pre: [], rel: ["Amplitude", "Wavelength"],
      say: ["compression", "pressure", "medium", "direction of travel", "rarefaction"],
      apply: { ask: "An alarm clock ringing inside a jar goes silent as the air is pumped out, " +
                    "though you can still see the hammer moving. What does that show?",
               opts: ["Sound needs a medium to travel through",
                      "Glass blocks sound",
                      "Vacuum lowers the frequency",
                      "The hammer stops vibrating"],
               right: 0,
               why: "No particles, nothing to compress, no wave. Light crosses the same vacuum " +
                    "because it does not need one." },
      xfer: { ask: "Sound travels roughly fifteen times faster in steel than in air. What " +
                   "property of steel explains it?",
              opts: ["It is heavier",
                     "Its particles are tightly bound, so a compression passes on almost immediately",
                     "It is colder",
                     "It has a higher frequency"],
              right: 1,
              why: "A longitudinal wave is a relay of pushes. Tightly coupled particles hand the " +
                   "push on faster." }
    }),

    C("Amplitude", {
      why: "It is the physical quantity behind loudness, and the one that damages hearing.",
      eg: "Turning up a speaker makes the peaks taller. It does not make them closer together.",
      miss: [["Amplitude is pitch.",
              "Amplitude is height, and height is loudness. Pitch comes from how often the wave " +
              "repeats, which is a different measurement entirely."]],
      pre: ["Longitudinal wave"], rel: ["Wavelength", "Frequency"],
      say: ["height", "crest", "trough", "loudness", "energy", "vertical"],
      apply: { ask: "Two notes are recorded. They sound identically pitched, but one is much " +
                    "louder. What differs?",
               opts: ["Wavelength", "Frequency", "Amplitude", "Speed"],
               right: 2,
               why: "Same pitch means same frequency and therefore same wavelength. Only the " +
                    "height is left." },
      xfer: { ask: "Hearing protection at a concert reduces amplitude across the board. Why does " +
                   "the music still sound like the same music?",
              opts: ["It removes the bass",
                     "Frequency is untouched, and frequency is what carries pitch and timbre",
                     "It slows the wave down",
                     "It shortens the wavelength"],
              right: 1,
              why: "Loudness and pitch are independent. Lowering one leaves the other intact — " +
                   "which is exactly why the protection is usable." }
    }),

    C("Wavelength", {
      why: "It sets what a sound can bend around, which is why you hear the bass through a wall " +
           "and not the singer.",
      eg: "A 20 Hz wave is about seventeen metres long. A 20,000 Hz wave is under two centimetres.",
      miss: [["Longer wavelength means louder.",
              "Wavelength is horizontal distance; loudness is vertical height. Long waves are low, " +
              "not loud."]],
      pre: ["Longitudinal wave"], rel: ["Frequency", "Amplitude"],
      say: ["distance", "repeats", "horizontal", "phase", "cycle"],
      apply: { ask: "Through a closed door you hear the bass line of a song but barely the vocals. " +
                    "What explains it?",
               opts: ["Bass is always louder",
                      "Long wavelengths diffract around obstacles more readily than short ones",
                      "Vocals are recorded more quietly",
                      "Doors absorb only low frequencies"],
               right: 1,
               why: "A wave bends around something comparable to or smaller than its own length. " +
                    "Metres-long bass goes round a door; centimetre-long treble does not." },
      xfer: { ask: "A studio treats a room for bass with panels far thicker than the ones used " +
                   "for treble. Why must they be thick?",
              opts: ["Bass carries more energy per second",
                      "The material has to be a real fraction of a very long wavelength to absorb it",
                      "Thin panels reflect all sound",
                      "Bass travels faster"],
              right: 1,
              why: "Absorption scales against wavelength. A 3 cm panel is nothing to a 17 m wave." }
    }),

    C("Frequency", {
      why: "It is the number every other idea in this unit is measured against — pitch, hearing " +
           "range, infrasound, ultrasound.",
      eg: "440 Hz is the A an orchestra tunes to: four hundred and forty cycles every second.",
      miss: [["Frequency and pitch are the same thing.",
              "Frequency is a count in the air. Pitch is what your brain does with it. One is " +
              "physics, one is perception."]],
      pre: ["Longitudinal wave"], rel: ["Pitch", "Wavelength", "Infrasound", "Ultrasound"],
      say: ["cycles", "per second", "hertz", "hz", "rate", "vibration"],
      apply: { ask: "A guitar string is shortened by pressing a fret. It vibrates faster. What " +
                    "happens to wavelength and pitch?",
               opts: ["Wavelength shortens, pitch rises",
                      "Wavelength lengthens, pitch rises",
                      "Wavelength shortens, pitch falls",
                      "Neither changes"],
               right: 0,
               why: "Speed in air is fixed, so more cycles per second means each cycle is shorter. " +
                    "Higher frequency is heard as higher pitch." },
      xfer: { ask: "An ambulance siren drops in pitch as it passes you, though the siren itself " +
                   "never changes. What has changed?",
              opts: ["The amplitude",
                     "The rate at which wavefronts reach you",
                     "The speed of sound",
                     "The wavelength the siren emits"],
              right: 1,
              why: "Approaching, the fronts are crowded and arrive more often; receding, they are " +
                   "stretched. The source is constant — your rate of receipt is not." }
    }),

    C("Pitch", {
      why: "It is where the physics of this unit turns into something a person experiences.",
      eg: "The same 440 Hz played on a violin and a flute is the same pitch and a different sound.",
      miss: [["Pitch is a property of the air.",
              "It is a property of the listener. The air has frequency; pitch is the sensation of " +
              "detecting it."]],
      pre: ["Frequency"], rel: ["Cochlea", "Infrasound", "Ultrasound"],
      say: ["sensation", "perceive", "high", "low", "frequency", "brain"],
      apply: { ask: "Why is it more accurate to say a dog whistle is 'above human hearing' than " +
                    "'too high-pitched to hear'?",
               opts: ["Because it has no frequency",
                      "Because with no sensation there is no pitch — the frequency exists, the pitch does not",
                      "Because dogs hear amplitude instead",
                      "Because pitch only applies to music"],
               right: 1,
               why: "Pitch is the perception. Where there is no perceiver for that frequency, " +
                    "there is nothing to call a pitch." },
      xfer: { ask: "Two people hear the same note and one insists it is slightly sharp. If the " +
                   "frequency is identical, what could explain it?",
              opts: ["The air differs between them",
                     "Pitch is a perception, and perception varies with the listener",
                     "One is hearing a longitudinal wave and one is not",
                     "The amplitude differs"],
              right: 1,
              why: "Anything on the perception side of the line — cochlear response, fatigue, " +
                   "context — can move the pitch without moving the frequency." }
    }),

    C("Infrasound", {
      why: "It is what travels furthest, which is why animals use it to communicate across " +
           "distances you cannot shout over.",
      eg: "Elephants hear down to about 5 Hz and call to each other across kilometres.",
      miss: [["Infrasound is silence.",
              "It is sound you cannot hear. The wave is there, and instruments and elephants " +
              "detect it."]],
      pre: ["Frequency"], rel: ["Ultrasound", "Wavelength"],
      say: ["below", "20", "hz", "low", "hearing floor", "elephants"],
      apply: { ask: "Why does infrasound carry so much further than a shout?",
               opts: ["It is louder at the source",
                      "Very long waves lose less energy to obstacles and absorption",
                      "It travels faster",
                      "It has more amplitude"],
               right: 1,
               why: "Long wavelengths bend around obstacles instead of being absorbed by them, so " +
                    "far less is lost on the way." },
      xfer: { ask: "Animals have been reported leaving a coast before a tsunami arrives. What " +
                   "reading of this fits the unit?",
              opts: ["They see the wave first",
                     "They may detect low-frequency ground and air waves that travel ahead of it",
                     "They hear ultrasound from the water",
                     "They feel the amplitude of visible waves"],
              right: 1,
              why: "The energy arrives before the water does, in a band beneath human hearing." }
    }),

    C("Ultrasound", {
      why: "Short wavelengths resolve small things, which is what makes it a tool rather than " +
           "just a fact.",
      eg: "Bats reach 120,000 Hz and use the echoes to catch a moth in the dark.",
      miss: [["Ultrasound is very loud sound.",
              "It is very high-frequency sound. Loudness is unrelated."]],
      pre: ["Frequency"], rel: ["Infrasound", "Wavelength"],
      say: ["above", "20,000", "hz", "high", "bats", "dogs"],
      apply: { ask: "Medical imaging uses ultrasound rather than audible frequencies. Why?",
               opts: ["It is safer to hear",
                      "Its short wavelength can resolve small structures",
                      "It travels further",
                      "It bends around bone more easily"],
               right: 1,
               why: "You cannot resolve detail smaller than roughly your wavelength. Millimetre " +
                    "detail needs millimetre waves." },
      xfer: { ask: "A bat hunting in open air uses very high frequencies; one hunting in dense " +
                   "clutter drops lower. What trade is it making?",
              opts: ["Loudness for pitch",
                     "Fine detail for range and penetration",
                     "Speed for accuracy",
                     "Amplitude for wavelength"],
              right: 1,
              why: "High frequency resolves detail but is absorbed quickly. Lower frequency sees " +
                   "less finely and reaches further." }
    }),

    C("Ambient noise", {
      why: "It is the thing that ruins more student recordings than any other single factor.",
      eg: "A fridge hum, distant traffic, air conditioning — inaudible while you record, " +
          "unmistakable on playback.",
      miss: [["You can remove it afterwards.",
              "Noise reduction takes the voice with it. The fix is at the recording, not in the edit."]],
      pre: [], rel: ["Cardioid", "Foley"],
      say: ["background", "location", "atmospheric", "dialogue", "hum"],
      apply: { ask: "You are recording an interview in a room with an air conditioner you cannot " +
                    "switch off. What is the best move?",
               opts: ["Record louder",
                      "Get the microphone much closer to the speaker",
                      "Fix it in editing",
                      "Use an omnidirectional microphone"],
               right: 1,
               why: "Halving the distance to the source raises the wanted signal far more than the " +
                    "noise. Distance is the cheapest noise reduction there is." },
      xfer: { ask: "Sound recordists often capture a minute of a room with nobody speaking. What " +
                   "is that minute for?",
              opts: ["Testing the batteries",
                      "A bed of matching ambience to patch edits so cuts do not sound abrupt",
                      "Measuring frequency",
                      "Calibrating the pinna"],
              right: 1,
              why: "Silence between two takes is louder than you expect. Room tone makes a cut " +
                   "disappear." }
    }),

    C("Foley", {
      why: "It is the clearest case in the course of an audience believing a constructed thing " +
           "over a real one.",
      eg: "Celery snapped near a microphone reads as a breaking bone; corn starch in a pouch reads " +
          "as snow.",
      miss: [["Foley is the same as a sound effect from a library.",
              "Foley is performed to picture, in sync, by a person watching it. That performance " +
              "is the point."]],
      pre: ["Ambient noise"], rel: [],
      say: ["performed", "everyday", "sync", "picture", "props", "effects"],
      apply: { ask: "Why is real footage of real footsteps usually replaced with Foley?",
               opts: ["Real footsteps are inaudible",
                      "Recorded on location they arrive buried in ambience and out of balance with dialogue",
                      "Foley is cheaper than a microphone",
                      "Audiences prefer silence"],
               right: 1,
               why: "Control. A performed footstep can be placed, balanced and shaped; a location " +
                    "one arrives welded to everything else in the room." },
      xfer: { ask: "A film sets a scene in a spacecraft, where there is no air. It still has " +
                   "sound. What is the Foley artist serving?",
              opts: ["Physical accuracy",
                      "What the audience needs to feel and follow, which is not the same thing",
                      "The frequency range of the cochlea",
                      "Ambient noise reduction"],
              right: 1,
              why: "Sound design answers to the story. A silent vacuum is accurate and unwatchable." }
    }),

    C("Omnidirectional", {
      why: "Choosing a pattern is choosing what you are willing to hear, and this one says yes " +
           "to everything.",
      eg: "Its polar plot is a full circle: equal gain from every direction.",
      miss: [["It is the most sensitive microphone.",
              "It is the least selective. Sensitivity and directionality are different properties."]],
      pre: [], rel: ["Cardioid", "Bidirectional", "Ambient noise"],
      say: ["all directions", "equal", "circle", "polar", "pattern"],
      apply: { ask: "Which job suits an omnidirectional microphone best?",
               opts: ["A piece to camera beside a busy road",
                      "Capturing the sound of a whole room, ambience included",
                      "An interview between two people facing each other",
                      "Isolating one singer in a group"],
               right: 1,
               why: "If you want the room, take the pattern that hears the room. Every other job " +
                    "here is a job of exclusion." },
      xfer: { ask: "Lavalier microphones clipped to a shirt are usually omnidirectional. Given " +
                   "what you know, why is that acceptable?",
              opts: ["Because clothing blocks noise",
                      "Because it sits so close to the mouth that the wanted sound dominates anyway",
                      "Because omnidirectional microphones reject noise",
                      "Because the pattern rotates with the speaker"],
              right: 1,
              why: "Proximity does the rejecting that the pattern will not. It also means the mic " +
                   "keeps working when the head turns." }
    }),

    C("Cardioid", {
      why: "It is the default working microphone, because most recording is an act of excluding " +
           "things.",
      eg: "A heart-shaped plot: good from the front and sides, poor from behind.",
      miss: [["Cardioid hears only what it points at.",
              "It hears the sides well too. What it rejects is the rear."]],
      pre: ["Omnidirectional"], rel: ["Bidirectional", "Ambient noise"],
      say: ["heart", "front", "rear", "reject", "pattern", "directional"],
      apply: { ask: "You are filming a piece to camera with traffic behind the presenter. Where " +
                    "should the cardioid's null point?",
               opts: ["At the presenter", "At the traffic", "At the sky", "At the camera"],
               right: 1,
               why: "You aim the rejection, not just the pickup. Pointing the dead side at the " +
                    "problem is the whole reason to own a pattern." },
      xfer: { ask: "A singer on stage uses a cardioid, and the monitor speaker is placed directly " +
                   "in front of them at floor level. Why is that placement chosen?",
              opts: ["It sounds louder there",
                      "It sits in the microphone's rear null, so it is least likely to feed back",
                      "Cardioids cannot hear low frequencies",
                      "It keeps the cable short"],
              right: 1,
              why: "Feedback is the mic hearing its own output. Put the speaker where the mic is " +
                   "deaf and the loop never closes." }
    }),

    C("Bidirectional", {
      why: "It is the pattern that solves one specific problem exactly, which is a good lesson " +
           "about tools.",
      eg: "A figure of eight: front and back live, sides dead.",
      miss: [["It is for stereo.",
              "It is for two sources facing each other. Its dead sides are the feature."]],
      pre: ["Cardioid"], rel: ["Omnidirectional"],
      say: ["figure of eight", "front", "back", "sides", "interview"],
      apply: { ask: "Two people sit opposite each other for an interview in a noisy room. Why is " +
                    "bidirectional the right choice?",
               opts: ["It is more sensitive than the others",
                      "Both voices land on live faces while the room arrives at the dead sides",
                      "It rejects low frequencies",
                      "It can be pointed at only one person"],
               right: 1,
               why: "The geometry of the problem matches the geometry of the pattern. That is what " +
                    "choosing a pattern means." },
      xfer: { ask: "A classic stereo technique crosses two bidirectional microphones at ninety " +
                   "degrees. What is that arrangement exploiting?",
              opts: ["Their loudness",
                      "Four sharply defined lobes, so direction is encoded as a difference between them",
                      "Their rejection of ambience",
                      "Their long wavelength response"],
              right: 1,
              why: "Well-defined dead zones make direction measurable. The pattern is the " +
                   "instrument." }
    }),

    C("XLR", {
      why: "It is the connector that separates a professional signal path from a consumer one, " +
           "and the reason is electrical rather than snobbery.",
      eg: "Circular, three pins, and it locks so it cannot be pulled out mid-take.",
      miss: [["It is just a bigger jack plug.",
              "Three pins carry the signal twice, out of phase. Noise picked up on the cable " +
              "cancels at the other end. A jack cannot do that."]],
      pre: [], rel: ["Ambient noise"],
      say: ["connector", "three pins", "balanced", "locking", "professional"],
      apply: { ask: "Why can an XLR cable run fifty metres to a stage while a headphone cable " +
                    "hums after five?",
               opts: ["It is thicker",
                      "Balanced wiring cancels interference picked up along the run",
                      "It carries less current",
                      "It is shielded by the connector shell"],
               right: 1,
               why: "Noise hits both signal wires equally and is subtracted away at the input. " +
                    "Length stops being the enemy." },
      xfer: { ask: "You need to plug an XLR microphone into a laptop. What is actually required?",
               opts: ["A longer cable",
                      "An interface that converts and often powers the microphone, not just a shaped plug",
                      "Nothing — laptops take XLR",
                      "A cardioid adapter"],
               right: 1,
               why: "The connector is the visible part of a different electrical standard. An " +
                    "adapter that only changes the shape solves nothing." }
    }),

    C("Hard sell", {
      why: "Half of advertising is a choice between two strategies, and this is the one that " +
           "argues.",
      eg: "A loud slogan, a price, a deadline, and a reason to act now.",
      miss: [["Hard sell means aggressive or shouty.",
              "It means direct and rational — information and argument. It can be perfectly calm."]],
      pre: [], rel: ["Soft sell"],
      say: ["direct", "information", "rational", "slogan", "urgency", "product"],
      apply: { ask: "A thirty-second radio ad lists three features, the price and a closing date. " +
                    "Which is it, and why?",
               opts: ["Soft sell — it builds a mood",
                      "Hard sell — it argues the case on information",
                      "Neither — it is Foley",
                      "Both equally"],
               right: 1,
               why: "The persuasion is carried by claims you could check, not by a feeling." },
      xfer: { ask: "Pharmaceutical advertising is legally required to state side effects. What " +
                   "does that push it towards?",
              opts: ["Soft sell, because facts are unpleasant",
                     "Hard sell, because the format is now information-led whatever the tone",
                     "Neither strategy applies",
                     "Ambient advertising"],
              right: 1,
              why: "Regulation that mandates information moves the strategy, even when the " +
                   "pictures are gentle." }
    }),

    C("Soft sell", {
      why: "It is the strategy most brands you can name actually use, and it works without " +
           "mentioning the product much at all.",
      eg: "A minute of a family arriving home, and a logo at the end.",
      miss: [["Soft sell is weaker.",
              "It is indirect. Indirect is not the same as ineffective — it is a different route " +
              "to the same decision."]],
      pre: ["Hard sell"], rel: [],
      say: ["indirect", "emotion", "mood", "image", "feeling", "brand"],
      apply: { ask: "An ad shows thirty seconds of a road at sunrise, no price, no features, and " +
                    "a badge at the end. What is it doing?",
               opts: ["Hard sell through repetition",
                      "Soft sell — building an association the buyer wants to belong to",
                      "Foley",
                      "Nothing measurable"],
               right: 1,
               why: "There is no argument to evaluate. The persuasion is the feeling and what it " +
                    "gets attached to." },
      xfer: { ask: "Why do brands that are already well known lean harder on soft sell than new " +
                   "entrants do?",
              opts: ["Their ads cost less",
                     "The information case is already made, so what is left to build is preference",
                     "Soft sell is required by law",
                     "New brands cannot afford emotion"],
              right: 1,
              why: "You argue when you need to be understood, and you build feeling when you need " +
                   "to be chosen." }
    })
  ];

  /* ------------------------------------------------ Unit 6: photography
     Twenty concepts, one per term in the set, spread across the nine sections
     so every section is drilled. The misconceptions are the ones the unit
     itself invites: f-numbers running backwards, a telephoto "bringing things
     closer", and — because the course text makes it — the rule of thirds and
     the golden ratio being treated as one idea. */
  var MEDIA6 = [
    C("Aperture", {
      why: "It is one of the two controls on how much light reaches the film or sensor — and " +
           "the one that also decides what is sharp.",
      eg: "Squinting narrows your own aperture: the world gets dimmer, and if you are " +
          "short-sighted, a little sharper.",
      miss: [["The aperture is the lens.",
              "It is the opening inside the lens. The lens is the glass; the aperture is the gap " +
              "the diaphragm leaves for light to pass through."]],
      pre: [], rel: ["F-stop", "Depth of field"],
      say: ["opening", "lens", "light", "diaphragm", "size", "f-stop"],
      apply: { ask: "Indoors, a photo comes out too dark. The photographer does not want to change " +
                    "how long the shutter stays open. What should they do to the aperture?",
               opts: ["Make it smaller", "Make it larger",
                      "Leave it — aperture does not affect brightness", "Remove the lens"],
               right: 1,
               why: "A larger opening admits more light in the same time. Aperture is a brightness " +
                    "control before it is anything else." },
      xfer: { ask: "A cat's pupils become thin slits in bright sun and wide circles at night. " +
                   "Which part of a camera is the pupil doing the job of?",
              opts: ["The shutter", "The aperture", "The image sensor", "The zoom ring"],
              right: 1,
              why: "The pupil changes size to let in more or less light — exactly what the " +
                   "diaphragm does to the aperture." }
    }),

    C("F-stop", {
      why: "It is how every photographer talks about aperture, and it runs backwards, which is " +
           "where most mistakes about aperture start.",
      eg: "f/2 is a wide-open lens for a dark room; f/16 is a small opening for a bright beach.",
      miss: [["A bigger f-number means a bigger opening.",
              "The opposite. The f-number is a fraction — f/16 is a smaller opening than f/2, the " +
              "same way one-sixteenth is smaller than one-half."]],
      pre: ["Aperture"], rel: ["Depth of field"],
      say: ["number", "aperture", "size", "smaller", "larger", "opening"],
      apply: { ask: "Which setting lets the most light through the lens?",
               opts: ["f/22", "f/11", "f/5.6", "f/1.8"],
               right: 3,
               why: "The smallest f-number is the largest opening. f/1.8 is the widest aperture " +
                    "on the list." },
      xfer: { ask: "Aperture is written f/2, f/4, f/8 — with a slash, like a fraction. Why does " +
                   "that make a bigger number mean a smaller opening?",
              opts: ["It does not; the slash is decoration",
                     "The number divides the focal length, so dividing by more gives a smaller " +
                     "opening",
                     "Bigger numbers always mean more light",
                     "Because f stands for fast"],
              right: 1,
              why: "The opening's diameter is the focal length divided by the f-number. Divide by " +
                   "more and the opening shrinks — the notation is telling you the rule." }
    }),

    C("Depth of field", {
      why: "It decides where the viewer looks. A blurred background is not a mistake; it is a " +
           "decision about attention.",
      eg: "A portrait with a crisp face and a soft, unrecognisable background has a shallow depth " +
          "of field.",
      miss: [["Depth of field is how far away the subject is.",
              "It is how much is sharp from front to back. Distance affects it, but the idea is " +
              "the zone of sharpness, not the distance."]],
      pre: ["Aperture", "F-stop"], rel: ["Focal length"],
      say: ["sharp", "focus", "near", "far", "aperture", "background"],
      apply: { ask: "A landscape photographer wants the flowers at their feet and the mountains " +
                    "behind both sharp. Which setting helps?",
               opts: ["A small f-number like f/2", "A large f-number like f/16",
                      "A faster shutter speed", "A zoom lens"],
               right: 1,
               why: "A large f-number is a small aperture, which gives a deep depth of field — " +
                    "near and far both in focus." },
      xfer: { ask: "Phone cameras naturally keep backgrounds sharp, so many offer a portrait mode " +
                   "that blurs the background in software. What is portrait mode imitating?",
              opts: ["A slow shutter speed",
                     "The shallow depth of field of a large aperture",
                     "A sepia filter", "A wide-angle lens"],
              right: 1,
              why: "It fakes in software what a large aperture does optically: the subject sharp " +
                   "and the background soft." }
    }),

    C("Shutter speed", {
      why: "It is the camera's control over time. It decides whether motion is frozen or shown.",
      eg: "Car advertisements show sharp bodywork over blurred, spinning wheels — a slow shutter " +
          "makes the speed visible.",
      miss: [["A faster shutter speed makes a brighter photo.",
              "Faster means less time for light to arrive, so the photo is darker unless " +
              "something else makes up for it."]],
      pre: ["Aperture"], rel: ["Aperture"],
      say: ["time", "open", "shutter", "motion", "freeze", "blur"],
      apply: { ask: "A photographer wants a waterfall to look like smooth, silky mist. What should " +
                    "they choose?",
               opts: ["A very fast shutter speed", "A slow shutter speed",
                      "A larger f-stop and nothing else", "A macro lens"],
               right: 1,
               why: "A slow shutter lets the moving water blur across the frame. A fast one would " +
                    "freeze every droplet." },
      xfer: { ask: "A night photo of a busy road shows long streaks of red and white light but no " +
                   "cars. What happened?",
              opts: ["The shutter stayed open a long time, so moving lights drew lines",
                     "The aperture was too small", "The file was saved as a negative",
                     "A telephoto lens was used"],
              right: 0,
              why: "A long exposure records everything that moved while the shutter was open. The " +
                   "lights left trails; the cars moved too much to register." }
    }),

    C("Negative", {
      why: "It explains why film needs a second step before it is a photograph at all — and why " +
           "the darkroom existed.",
      eg: "Hold an old strip of negatives to the light: teeth look dark and white shirts look " +
          "almost black.",
      miss: [["The negative is the finished photograph.",
              "It is a halfway stage. The print, made by shining light through the negative, " +
              "reverses the tones back to the scene you saw."]],
      pre: [], rel: ["Raw"],
      say: ["film", "reversed", "light", "dark", "print", "positive"],
      apply: { ask: "On a negative, a white wedding dress will appear as…",
               opts: ["White", "Dark", "Clear and colourless", "Red"],
               right: 1,
               why: "Light and dark are reversed on a negative, so the brightest thing in the " +
                    "scene is the darkest on the film." },
      xfer: { ask: "Raw files are often called digital negatives. What do they share with a film " +
                   "negative?",
              opts: ["Both show colours reversed",
                     "Both hold everything needed to make the final image, without being it",
                     "Both need a darkroom", "Both are lossy"],
              right: 1,
              why: "Neither is the finished picture. Each is the full record a finished image is " +
                   "made from." }
    }),

    C("Focal length", {
      why: "It decides how much of the world the lens takes in, which is the first choice any " +
           "lens makes.",
      eg: "At 18mm a whole room fits in the frame; at 200mm the same camera shows a single face " +
          "across it.",
      miss: [["Focal length is how far away the lens can focus.",
              "It is how strongly the lens magnifies. The longer the focal length, the narrower " +
              "and more magnified the view."]],
      pre: [], rel: ["Wide-angle lens", "Telephoto lens", "Prime lens"],
      say: ["millimetres", "magnify", "wide", "narrow", "lens", "view"],
      apply: { ask: "A photographer at the back of a stadium wants one player to fill the frame. " +
                    "What focal length suits?",
               opts: ["Short, like 18mm", "Long, like 300mm",
                      "Every focal length gives the same view", "Only the shutter matters"],
               right: 1,
               why: "A long focal length gives a narrow, magnified view, so the distant player " +
                    "fills the frame." },
      xfer: { ask: "Binoculars and telescopes make distant things look large. Which lens property " +
                   "are they pushing to the extreme?",
              opts: ["A very long focal length", "A very wide aperture only",
                     "A fast shutter", "Colour balance"],
              right: 0,
              why: "Long focal lengths give high magnification over a narrow view — the same " +
                   "principle, taken further." }
    }),

    C("Wide-angle lens", {
      why: "It is the lens for when the scene is bigger than the subject.",
      eg: "Photographing a whole mountain range, or a small room, without stepping back.",
      miss: [["A wide-angle lens zooms in.",
              "It does the opposite. Its short focal length takes in more of the scene, so " +
              "everything looks smaller and farther away."]],
      pre: ["Focal length"], rel: ["Telephoto lens"],
      say: ["short", "focal length", "broad", "landscape", "wide", "view"],
      apply: { ask: "A photographer at a lookout needs an entire valley in one frame. Which lens?",
               opts: ["Telephoto", "Macro", "Wide-angle", "A 200mm prime"],
               right: 2,
               why: "A wide-angle lens takes in a broader view than the eye does — what a " +
                    "landscape needs." },
      xfer: { ask: "Estate agents photograph small rooms so they look bigger. Which lens are they " +
                   "most likely using?",
              opts: ["Telephoto", "Wide-angle", "Macro", "A pinhole"],
              right: 1,
              why: "A wide angle takes in more of the room and stretches the sense of depth, so " +
                   "the space looks larger than it is." }
    }),

    C("Telephoto lens", {
      why: "It lets a photographer work without the subject noticing — and it controls the " +
           "background.",
      eg: "A headshot where the background dissolves into soft colour.",
      miss: [["A telephoto lens brings the subject closer.",
              "Nothing moves. It magnifies a narrow part of the scene and changes the " +
              "perspective; the subject is exactly as far away as before."]],
      pre: ["Focal length"], rel: ["Wide-angle lens", "Depth of field"],
      say: ["long", "focal length", "magnified", "narrow", "background", "blur"],
      apply: { ask: "A photographer wants candid shots at a street festival without anyone noticing " +
                    "the camera. Which lens helps most?",
               opts: ["Wide-angle", "Telephoto", "Macro", "A pinhole"],
               right: 1,
               why: "A telephoto lets the photographer stay at a distance and isolate a person " +
                    "against a blurred background." },
      xfer: { ask: "Wildlife photographers use very long lenses. Apart from staying safely far " +
                   "away, what does the lens do for the picture?",
              opts: ["Makes the background sharper",
                     "Isolates the animal against a soft, out-of-focus background",
                     "Turns the image monochrome", "Removes the need for a shutter"],
              right: 1,
              why: "A long lens throws the background out of focus, so the animal stands out — " +
                   "the same effect as in a headshot." }
    }),

    C("Macro lens", {
      why: "It makes the invisible visible — the texture of an insect's eye, the structure of a " +
           "snowflake.",
      eg: "A photo in which a single ladybird fills the whole frame.",
      miss: [["Any zoom lens is a macro lens.",
              "A zoom can get close enough for a similar look, but a true macro focuses near " +
              "enough to record an object life-size, at one to one."]],
      pre: ["Focal length"], rel: ["Prime lens"],
      say: ["close", "small", "magnification", "life-size", "focus", "detail"],
      apply: { ask: "A jeweller wants product photos showing the tiny engraving inside a ring. " +
                    "Which lens?",
               opts: ["Wide-angle", "Macro", "Telephoto, for distance", "A fisheye"],
               right: 1,
               why: "A macro lens focuses very close and magnifies, so the engraving fills the " +
                    "frame." },
      xfer: { ask: "A true one-to-one macro shot is taken of a seed 5mm across. Roughly how wide " +
                   "is the seed's image on the sensor?",
              opts: ["About 5mm", "About 36mm", "About 1mm", "About 180mm"],
              right: 0,
              why: "One to one means life-size on the sensor: a 5mm seed makes a 5mm image." }
    }),

    C("Prime lens", {
      why: "It trades flexibility for simplicity: one focal length, and the photographer's feet " +
           "do the zooming.",
      eg: "A 50mm lens that never changes. To frame tighter, you step closer.",
      miss: [["A prime lens is a better kind of zoom lens.",
              "It is a different design: one fixed focal length, where a zoom lens covers a " +
              "range."]],
      pre: ["Focal length"], rel: ["Macro lens"],
      say: ["fixed", "focal length", "one", "zoom", "range", "move"],
      apply: { ask: "A photographer with only a prime lens finds the subject too small in the " +
                    "frame. What must they do?",
               opts: ["Turn the zoom ring", "Move closer", "Raise the f-stop", "Add a filter"],
               right: 1,
               why: "A prime lens cannot zoom. The only way to change the framing is to change " +
                    "where the photographer stands." },
      xfer: { ask: "A film crew uses one lens that moves smoothly from a wide shot of a stage to a " +
                   "close-up of one actor, in a single take. Prime or zoom?",
              opts: ["Prime", "Zoom", "Macro", "It must be two lenses"],
              right: 1,
              why: "Moving continuously between focal lengths is what a zoom lens does and a " +
                   "prime cannot." }
    }),

    C("Image sensor", {
      why: "It is what replaced film. Everything digital photography does starts with how this " +
           "chip records light.",
      eg: "The small rectangle visible behind the mirror of a DSLR with its lens taken off.",
      miss: [["CCD sensors are still better than CMOS.",
              "CCD was long considered better for image quality, but CMOS is now in almost every " +
              "digital camera and has overtaken it for most purposes."]],
      pre: [], rel: ["Raw"],
      say: ["chip", "light", "digital", "film", "CCD", "CMOS"],
      apply: { ask: "In a digital camera, what does the image sensor do that film did in a film " +
                    "camera?",
               opts: ["Controls the aperture", "Records the light that forms the image",
                      "Flips the mirror", "Develops the negative"],
               right: 1,
               why: "Film recorded light chemically; the sensor records it electronically. It is " +
                    "the same job." },
      xfer: { ask: "One camera has a CCD sensor and another a CMOS sensor. Which description is " +
                   "fair today?",
              opts: ["CCD is newer and always better",
                     "CMOS is the modern standard and generally performs as well or better",
                     "They cannot both be digital", "CMOS still needs film"],
              right: 1,
              why: "CCD is the older technology. CMOS dominates modern cameras and has largely " +
                   "overtaken it." }
    }),

    C("Warm colours", {
      why: "Colour temperature is one of the fastest ways a photograph sets a mood — before " +
           "anyone notices it happening.",
      eg: "A sunset portrait bathed in orange feels intimate and close.",
      miss: [["Warm and cool colours are about how bright they are.",
              "They are about hue and feeling. Warm colours suggest heat and seem to advance; " +
              "cool colours suggest water and sky and seem to recede."]],
      pre: [], rel: ["Colour balance"],
      say: ["red", "orange", "yellow", "advance", "heat", "sunlight"],
      apply: { ask: "An interior designer wants a very large, empty room to feel cosier. Which " +
                    "colours help?",
               opts: ["Cool blues", "Warm oranges and reds", "Plain grey", "Light purples"],
               right: 1,
               why: "Warm colours seem to advance, bringing the walls in and making the space feel " +
                    "smaller and cosier." },
      xfer: { ask: "A film wants a scene in an empty office at night to feel lonely and detached. " +
                   "How would a colourist most likely grade it?",
              opts: ["Push it warmer", "Push it cooler, toward blue",
                     "Make it sepia", "Remove all contrast"],
              right: 1,
              why: "Cool colours recede and feel distant — the opposite of the closeness warm " +
                   "tones create." }
    }),

    C("Colour balance", {
      why: "Cameras do not see colour the way eyes do. Colour balance is how a photograph is made " +
           "to look the way the scene felt.",
      eg: "Under household bulbs, white walls often photograph orange until the colour balance is " +
          "corrected.",
      miss: [["Colour balance is only for fixing mistakes.",
              "It is also used for mood: an editor may push an image warmer or cooler on " +
              "purpose."]],
      pre: ["Warm colours"], rel: ["Warm colours"],
      say: ["adjust", "neutral", "red", "blue", "white balance", "grey balance"],
      apply: { ask: "A photo of white paper under a lamp comes out yellowish. Which adjustment " +
                    "fixes it?",
               opts: ["Crop it", "Adjust the colour balance so the white looks white",
                      "Save it as a GIF", "Raise the f-stop"],
               right: 1,
               why: "Colour balance shifts the colours so neutrals look neutral — here, taking " +
                    "out the yellow cast." },
      xfer: { ask: "A black-and-white image has no colour. What is the equivalent adjustment " +
                   "called there?",
              opts: ["Grey balance", "Lossy balance", "Sepia", "The Zone System"],
              right: 0,
              why: "In black and white the adjustment is about neutral greys, so it is called " +
                   "grey balance." }
    }),

    C("Lossy compression", {
      why: "Nearly every shared image is compressed. Knowing what is lost, and when, decides " +
           "which format to use.",
      eg: "A photo saved as JPEG again and again slowly grows blocky smudges around sharp edges.",
      miss: [["Any compressed file can be restored exactly.",
              "Only losslessly compressed ones can. Lossy compression throws data away for " +
              "good."]],
      pre: [], rel: ["Raw"],
      say: ["discard", "data", "smaller", "quality", "JPEG", "permanent"],
      apply: { ask: "Which of these must never be stored with lossy compression?",
               opts: ["A holiday snapshot for social media", "A bank's transaction records",
                      "A thumbnail preview", "A background texture for a website"],
               right: 1,
               why: "Records where every bit matters need lossless storage. A snapshot can afford " +
                    "to lose detail nobody will miss." },
      xfer: { ask: "A music app offers High Quality and Data Saver modes, and Data Saver sounds " +
                   "slightly worse. What is the likely difference?",
              opts: ["Data Saver uses stronger lossy compression", "Data Saver is lossless",
                     "High Quality makes smaller files", "Neither is compressed"],
              right: 0,
              why: "Stronger lossy compression makes smaller files at the cost of quality — the " +
                   "same trade JPEG makes with images." }
    }),

    C("Raw", {
      why: "It is the file that keeps every option open. Edits that would ruin a JPEG can be " +
           "recovered from raw.",
      eg: "A dark raw photo can usually be brightened in editing without falling apart; the " +
          "same JPEG turns grainy and banded.",
      miss: [["Every camera saves raw files by default.",
              "Most cameras default to JPEG. Raw is a setting a photographer chooses."]],
      pre: ["Image sensor"], rel: ["Negative", "Lossy compression"],
      say: ["unprocessed", "sensor", "data", "metadata", "digital negative", "editing"],
      apply: { ask: "A photographer expects to make heavy exposure and colour corrections later. " +
                    "How should they shoot?",
               opts: ["Low-quality JPEG", "Raw", "GIF", "It makes no difference"],
               right: 1,
               why: "Raw keeps all the sensor data, so big corrections have far more information " +
                    "to work from." },
      xfer: { ask: "Why is it risky to delete the raw files once the finished JPEGs are exported?",
              opts: ["JPEGs cannot be opened without them",
                     "The raw files are the only copies with all the original data, so any later " +
                     "re-edit starts from less",
                     "Raw files are smaller", "Deleting raw files corrupts the JPEGs"],
              right: 1,
              why: "The JPEG has already thrown data away. Without the raw, every future edit " +
                   "starts from the reduced version." }
    }),

    C("Zone System", {
      why: "It turned exposure from a guess into a decision made before the shutter is pressed.",
      eg: "Adams would decide that a shadowed cliff should print as a deep grey that still shows " +
          "the rock, then expose and develop to put it there.",
      miss: [["The Zone System is a way to arrange subjects in the frame.",
              "That is composition. The Zone System is about exposure and contrast — where each " +
              "tone lands in the final print."]],
      pre: [], rel: ["Colour balance"],
      say: ["Ansel Adams", "exposure", "contrast", "tone", "print", "black and white"],
      apply: { ask: "A photographer wants snow to keep its texture instead of printing as blank " +
                    "white. Which Zone System idea applies?",
               opts: ["Put the subject on a third",
                      "Decide how that tone should print, and set the exposure to place it there",
                      "Use a telephoto lens", "Save as PNG"],
               right: 1,
               why: "The Zone System plans where each tone falls — here, keeping the snow just " +
                    "below pure white so its texture survives." },
      xfer: { ask: "Digital cameras show a histogram, a graph of how many pixels sit at each " +
                   "brightness. Which Zone System idea does it help with?",
              opts: ["Placing tones deliberately between black and white", "Choosing a lens",
                     "Removing red eye", "Cropping to an aspect ratio"],
              right: 0,
              why: "Both are about controlling where the tones fall between black and white, so " +
                   "the final image keeps the detail you want." }
    }),

    C("Rule of thirds", {
      why: "It is the quickest way to make a composition look considered rather than accidental.",
      eg: "A horizon set on the lower third line, with sky filling the top two-thirds of the " +
          "frame.",
      miss: [["The rule of thirds and the golden ratio are the same thing.",
              "They are related but different. The rule of thirds uses equal thirds; the golden " +
              "ratio divides the frame at about 62 percent. Some texts, including this course's, " +
              "treat them as one idea."]],
      pre: [], rel: ["Golden ratio", "Cropping"],
      say: ["thirds", "grid", "lines", "cross", "subject", "focal point"],
      apply: { ask: "Using the rule of thirds, where is the strongest place to put a single person " +
                    "in a landscape frame?",
               opts: ["Dead centre", "On one of the points where the grid lines cross",
                      "Right at the edge", "It makes no difference"],
               right: 1,
               why: "The four crossing points are where the eye tends to go, so they are the " +
                    "strongest positions." },
      xfer: { ask: "A photographer centres a perfectly symmetrical cathedral front in the frame. " +
                   "Have they made a mistake?",
              opts: ["Yes — the rule of thirds must always be followed",
                     "No — strong symmetry holds its own balance, so centring can be right",
                     "Yes — centring makes the file lossy", "Only if it is in colour"],
              right: 1,
              why: "The rule can be broken on purpose. Symmetry gives equal weight across the " +
                   "frame instead of one focal point." }
    }),

    C("Golden ratio", {
      why: "It shows that mathematics and art share a vocabulary — and helps explain why some " +
           "proportions simply feel right.",
      eg: "The spiral of a nautilus shell and the pattern of seeds in a sunflower both follow " +
          "the golden ratio.",
      miss: [["The golden ratio divides a frame into equal thirds.",
              "Equal thirds is the rule of thirds. The golden ratio is about 1 to 1.618, which " +
              "puts its lines near 38 and 62 percent rather than 33 and 67."]],
      pre: ["Rule of thirds"], rel: ["Rule of thirds"],
      say: ["1.618", "proportion", "ratio", "nature", "harmony", "mathematics"],
      apply: { ask: "Two lengths are in the golden ratio. The shorter is 10cm. About how long is " +
                    "the longer?",
               opts: ["About 10cm", "About 16cm", "About 30cm", "About 5cm"],
               right: 1,
               why: "The ratio is about 1 to 1.618, so 10cm times 1.618 is about 16cm." },
      xfer: { ask: "A designer says: I used the golden ratio, so I split the poster into three " +
                   "equal columns. What is wrong with that?",
              opts: ["Nothing",
                     "Equal thirds is the rule of thirds; the golden ratio would split it at " +
                     "about 62 percent",
                     "The golden ratio only applies to photographs",
                     "Posters cannot use ratios"],
              right: 1,
              why: "The two are related but not the same. Equal thirds is the simpler rule; the " +
                   "golden ratio is about 1 to 1.618." }
    }),

    C("Cropping", {
      why: "It is the simplest edit there is, and it changes a composition more than almost any " +
           "other.",
      eg: "Trimming a crowded edge from a photo so only the subject and a little space are left.",
      miss: [["Cropping makes the image higher quality.",
              "It removes pixels. The framing improves, but what is left has less resolution, " +
              "not more."]],
      pre: [], rel: ["Rule of thirds"],
      say: ["remove", "edges", "framing", "subject", "aspect ratio", "composition"],
      apply: { ask: "A photo has to fit a frame of a fixed shape. What is the most direct way to " +
                    "make it fit?",
               opts: ["Crop it to that aspect ratio", "Apply a sepia filter",
                      "Save it as a GIF", "Use a faster shutter speed"],
               right: 0,
               why: "Cropping to a preset aspect ratio matches the frame's shape and lets you " +
                    "choose which part to keep." },
      xfer: { ask: "A photographer crops a tiny area out of a large photo and prints it very big. " +
                   "What should they expect?",
              opts: ["The colours turn sepia",
                     "Visible pixelation, because the cropped area has few pixels",
                     "The file becomes lossless", "Red eye"],
              right: 1,
              why: "A small crop keeps few pixels. Enlarged a lot, the missing detail shows as " +
                   "pixelation." }
    }),

    C("Healing brush", {
      why: "It is how a portrait is retouched without looking retouched — the difference between " +
           "fixed and fake.",
      eg: "A small scar on a cheek disappears, and the skin's texture and shading still look " +
          "natural.",
      miss: [["The healing brush and the clone stamp do the same thing.",
              "The clone stamp copies the sample exactly, edges and all. The healing brush takes " +
              "only its colour and blends it into the light and shadow around it."]],
      pre: [], rel: ["Colour balance"],
      say: ["sample", "blend", "colour", "blemish", "scar", "retouch"],
      apply: { ask: "A lamp post crosses the clean, straight edge of a building and must be " +
                    "removed. Which tool keeps the edge crisp?",
               opts: ["Healing brush", "Clone stamp", "Sepia filter", "Spot healing brush"],
               right: 1,
               why: "The clone stamp copies an exact area, keeping defined lines. The healing " +
                    "brush would soften the edge." },
      xfer: { ask: "Why can too much healing-brush work make a face look like plastic?",
              opts: ["It adds grain",
                     "It blends away the natural texture and variation of skin",
                     "It makes the file lossy", "It changes the aspect ratio"],
              right: 1,
              why: "Each stroke smooths colour into its surroundings. Overdone, the skin loses the " +
                   "texture that makes it look real." }
    })
  ];

  /* Introduction to Business, Unit 4. Every concept in the set is authored,
     because a unit on trade is mostly ideas that sound obvious as a
     definition and go wrong the moment they are used — a trade deficit as
     "losing money", offshoring as another word for outsourcing. */
  var BIZ4 = [
    C("Absolute advantage", {
      why: "It is the common-sense idea of being better at something — and seeing why it is not " +
           "enough is the key to understanding trade.",
      eg: "If a worker in Brazil grows more coffee in a day than a worker in Canada, Brazil has the " +
          "absolute advantage in coffee.",
      miss: [["A country with no absolute advantage has nothing to gain from trade.",
              "It can still have a comparative advantage — something it gives up less to make — " +
              "and trade on that."]],
      pre: [], rel: ["Comparative advantage"],
      say: ["more", "same", "resources", "produce", "rival", "output"],
      apply: { ask: "In one day, a worker in Country X makes 10 shirts and a worker in Country Y " +
                    "makes 6. Who has the absolute advantage in shirts?",
               opts: ["Country X", "Country Y", "Neither — you need prices to tell", "Both equally"],
               right: 0,
               why: "X makes more with the same labour, which is exactly what absolute advantage " +
                    "means." },
      xfer: { ask: "A hospital's best surgeon also types faster than its secretary. Should the " +
                   "surgeon type the reports?",
              opts: ["Yes — the surgeon is faster, so the surgeon should type",
                     "No — every hour typing is an hour not operating, so the secretary should type",
                     "Yes — whoever is fastest always does the work",
                     "It makes no difference who types"],
              right: 1,
              why: "Typing faster is an absolute advantage. What decides it is what the surgeon " +
                   "gives up — and that is surgery." }
    }),

    C("Comparative advantage", {
      why: "It explains why trade leaves both sides better off, even when one side is better at " +
           "everything.",
      eg: "England needed more hours than Portugal for both cloth and wine, yet one cloth cost " +
          "England less wine — so England should make the cloth.",
      miss: [["Comparative advantage means being the best at making something.",
              "That is absolute advantage. Comparative advantage is about giving up the least — the " +
              "lower opportunity cost."]],
      pre: ["Absolute advantage"], rel: ["Competitive advantage"],
      say: ["opportunity cost", "give up", "lower", "specialise", "trade", "both"],
      apply: { ask: "Making one table costs Country A the 2 chairs it could have made instead, and " +
                    "costs Country B 4 chairs. Who has the comparative advantage in tables?",
               opts: ["Country A", "Country B", "Whichever makes more tables per worker", "Neither"],
               right: 0,
               why: "A gives up fewer chairs for each table. The lower opportunity cost is the " +
                    "comparative advantage." },
      xfer: { ask: "Two students share a project. One is better at both research and design, but " +
                   "far better at research. How should they split the work?",
              opts: ["The stronger student does everything",
                     "The stronger student researches; the other designs",
                     "Each does half of both",
                     "The weaker student researches"],
              right: 1,
              why: "Each gives up least by doing their own task, so together they finish more than " +
                   "if the stronger student did it all." }
    }),

    C("Competitive advantage", {
      why: "It is what lets a business win customers from its rivals — and what a strategy is " +
           "trying to build.",
      eg: "A shop whose website sells straight to customers, without a middleman, can charge less " +
          "and deliver faster than its rivals.",
      miss: [["Competitive advantage and comparative advantage mean the same thing.",
              "Comparative advantage is about opportunity cost. Competitive advantage is any edge — " +
              "skills, technology, brand — that beats rivals."]],
      pre: ["Comparative advantage"], rel: [],
      say: ["edge", "outperform", "rivals", "technology", "skills", "Porter"],
      apply: { ask: "Which of these is a competitive advantage for a bakery?",
               opts: ["It is in the same town as its rivals",
                      "Its recipe is so good that customers queue for it",
                      "It pays the same rent as everyone else",
                      "It opens at the usual time"],
               right: 1,
               why: "Only the recipe sets it apart. The others are true of every bakery, so they are " +
                    "no advantage at all." },
      xfer: { ask: "Porter warned against countries relying only on exporting cheap raw materials. " +
                   "What was he afraid would happen?",
              opts: ["They would run out of workers",
                     "They would stay stuck selling low-priced goods on low wages",
                     "They would run too many trade surpluses",
                     "Their currencies would be fixed"],
              right: 1,
              why: "Cheap raw materials can trap a country in low prices and low pay. Building " +
                   "high-quality, high-price goods was his way out." }
    }),

    C("Balance of trade", {
      why: "It is the headline number for a country's trade, and one of the most argued about.",
      eg: "A country that exports $80bn and imports $110bn in a year has a trade deficit of $30bn.",
      miss: [["A trade deficit means a country loses money on its trades.",
              "Each trade is still a fair exchange. A deficit only says the country bought more " +
              "from abroad than it sold."]],
      pre: [], rel: ["Balance of payments"],
      say: ["exports", "imports", "minus", "surplus", "deficit", "period"],
      apply: { ask: "In a year, a country exports $250bn and imports $200bn. What is its balance of " +
                    "trade?",
               opts: ["A $50bn deficit", "A $50bn surplus", "$450bn", "It balances exactly"],
               right: 1,
               why: "250 − 200 = +50. Selling more than it buys is a surplus." },
      xfer: { ask: "A country's currency becomes much cheaper. What would you expect to happen to " +
                   "its balance of trade over time?",
              opts: ["It worsens, because imports get cheaper",
                     "It improves, because its exports get cheaper for foreign buyers",
                     "Nothing — currencies do not affect trade",
                     "It becomes exactly zero"],
              right: 1,
              why: "A cheaper currency makes its goods cheaper abroad and foreign goods dearer at " +
                   "home, so exports tend to rise and imports to fall." }
    }),

    C("Trade barrier", {
      why: "Barriers decide what a product costs once it crosses a border — and which businesses " +
           "can compete at all.",
      eg: "A rule that every imported toy must pass a new safety test that is only run inside the " +
          "importing country.",
      miss: [["Only tariffs count as trade barriers.",
              "Quotas, embargoes, subsidies, licences and even product standards can all keep " +
              "foreign goods out."]],
      pre: [], rel: ["Tariff", "Import quota", "Embargo"],
      say: ["government", "restriction", "cost", "price", "imports", "protect"],
      apply: { ask: "Two countries keep raising barriers against each other's goods, each in answer " +
                    "to the other. What is this called?",
               opts: ["A trade surplus", "A trade war", "A free trade area", "Countertrade"],
               right: 1,
               why: "Barriers raised again and again in retaliation are a trade war." },
      xfer: { ask: "A government pays its steel makers so they can sell below foreign prices. Why " +
                   "do other countries call this a trade barrier?",
              opts: ["It taxes their steel at the border",
                     "It tilts prices so their steel struggles to compete",
                     "It bans their steel outright",
                     "It fixes the exchange rate"],
              right: 1,
              why: "A subsidy charges nothing at the border, but it works against foreign sellers " +
                   "just as surely as a tariff." }
    }),

    C("Tariff", {
      why: "It is the oldest and most common trade barrier — and it is paid, in the end, mostly by " +
           "shoppers.",
      eg: "A 30% tariff turns a $10 imported shirt into a $13 one.",
      miss: [["The foreign country pays the tariff.",
              "It is collected from the importer at the border, and usually passed on to buyers as " +
              "a higher price."]],
      pre: ["Trade barrier"], rel: ["Import quota"],
      say: ["tax", "imports", "price", "protect", "home", "border"],
      apply: { ask: "An imported bike costs $200 and a home-made one $230. The government adds a 20% " +
                    "tariff to the import. Which is cheaper now?",
               opts: ["The import, still $200", "The import, now $220",
                      "The home-made bike, because the import now costs $240", "They cost the same"],
               right: 2,
               why: "20% of $200 is $40, so the import rises to $240 — more than the $230 home-made " +
                    "bike." },
      xfer: { ask: "A country puts a large tariff on imported steel. Who at home is most likely to " +
                   "be hurt?",
              opts: ["Home steel makers",
                     "Home companies that use steel to make cars and machines",
                     "Nobody at home",
                     "Only foreign governments"],
              right: 1,
              why: "Home steel makers gain, but every home business that buys steel now pays more " +
                   "for it." }
    }),

    C("Import quota", {
      why: "A quota caps the amount of a good, which can hurt more than a tariff: extra demand " +
           "cannot be met at any price.",
      eg: "A country lets only one million tonnes of foreign sugar in each year.",
      miss: [["A quota is a kind of tax.",
              "A quota limits the quantity. A tariff is the tax."]],
      pre: ["Trade barrier"], rel: ["Tariff", "Embargo"],
      say: ["limit", "amount", "quantity", "imports", "period"],
      apply: { ask: "A country allows 50,000 foreign cars in a year, and in October the limit is " +
                    "reached. What happens to the next foreign car?",
               opts: ["It pays a higher tax", "It cannot come in until next year",
                      "It is sold at a discount", "It counts as home-made"],
               right: 1,
               why: "A quota is a hard limit on quantity. Once it is reached, nothing more comes in " +
                    "that period." },
      xfer: { ask: "Why can a quota push prices up more than a tariff that gives the same protection?",
              opts: ["Quotas are against WTO rules",
                     "With a quota, no more can come in however much buyers will pay",
                     "Tariffs lower prices",
                     "Quotas apply only to services"],
              right: 1,
              why: "Anyone can still import under a tariff by paying it. A quota shuts the door, so " +
                   "shortages can drive prices higher." }
    }),

    C("Embargo", {
      why: "It is the strongest barrier of all — not a cost on trade but a ban — and is usually " +
           "used for political reasons.",
      eg: "A government forbids all trade with a country whose leaders it wants to put pressure on.",
      miss: [["An embargo limits trade to a set amount.",
              "That is a quota. An embargo stops the trade altogether."]],
      pre: ["Trade barrier"], rel: ["Import quota"],
      say: ["ban", "trade", "country", "government", "political"],
      apply: { ask: "Which of these is an embargo?",
               opts: ["A 10% tax on imported cheese", "A limit of 1,000 tonnes of imported cheese a year",
                      "A ban on buying any goods from one particular country", "A subsidy for cheese makers"],
               right: 2,
               why: "The ban is an embargo. The tax is a tariff, the limit a quota, and the payment a " +
                    "subsidy." },
      xfer: { ask: "Why do governments often use embargoes for political rather than economic " +
                   "reasons?",
              opts: ["Because embargoes raise tax money",
                     "Because cutting off trade puts pressure on another government",
                     "Because they lower prices at home",
                     "Because the WTO requires them"],
              right: 1,
              why: "An embargo costs both sides trade. It is used when the goal is pressure, not " +
                   "profit." }
    }),

    C("Cultural dimensions", {
      why: "Culture changes how people give orders, take risks and make deals. Misread it, and a " +
           "good business plan can still fail abroad.",
      eg: "A manager from a low power-distance culture may expect to question the boss; in a high " +
          "power-distance culture that can cause offence.",
      miss: [["The scores describe every person in a country.",
              "They describe tendencies across a whole culture. Individuals vary widely."]],
      pre: [], rel: [],
      say: ["Hofstede", "culture", "power distance", "individualism", "compare", "business"],
      apply: { ask: "Country B scores much higher than Country A on power distance. A manager from A " +
                    "moves to B. What should they expect?",
               opts: ["Staff will question every decision",
                      "Lines of authority will be more formal and rigid",
                      "Nobody will care about job titles",
                      "Decisions will be made by a vote"],
               right: 1,
               why: "High power distance means people accept unequal power, so authority is more " +
                    "formal." },
      xfer: { ask: "A manager from a very individualist culture praises one star salesperson in " +
                   "front of the whole team. In a strongly collectivist office, the salesperson looks " +
                   "embarrassed. Why?",
              opts: ["They wanted a pay rise instead",
                     "Being singled out above the group feels uncomfortable where the group comes first",
                     "They dislike selling",
                     "Praise at work is not allowed there"],
              right: 1,
              why: "Where the group comes first, success is shared. Lifting one person above the team " +
                   "can feel like breaking that." }
    }),

    C("World Trade Organization", {
      why: "It writes and referees the rules that most of the world's trade runs on.",
      eg: "When one member says another's tariffs break the rules, the case goes through the WTO.",
      miss: [["The WTO is a trade deal between a few neighbouring countries.",
              "It is worldwide, with 166 members. Regional deals like the EU and USMCA are " +
              "separate."]],
      pre: [], rel: ["European Union", "USMCA"],
      say: ["rules", "trade", "members", "disputes", "GATT", "1995"],
      apply: { ask: "Which organisation took over from GATT in 1995?",
               opts: ["The IMF", "The World Trade Organization", "The European Union", "APEC"],
               right: 1,
               why: "The WTO replaced GATT on 1 January 1995." },
      xfer: { ask: "A small country believes a much bigger country's barriers against its fruit " +
                   "break world trade rules. How does WTO membership help it?",
              opts: ["The WTO lends it money",
                     "It can bring a case under shared rules, instead of simply giving in",
                     "The WTO sets its exchange rate",
                     "It lets it join the EU"],
              right: 1,
              why: "Shared rules and a way to settle disputes give even small members a way to " +
                   "challenge bigger ones." }
    }),

    C("European Union", {
      why: "It is one of the world's largest single markets, and the clearest example of how far " +
           "countries can go in trading as one.",
      eg: "A company in Spain sells to customers in Germany with no tariffs, under the same " +
          "product rules.",
      miss: [["Every EU country uses the euro.",
              "21 of the 27 do. Denmark, Sweden and Poland are among those that keep their own " +
              "currencies."]],
      pre: [], rel: ["World Trade Organization"],
      say: ["27", "single market", "Europe", "free movement", "union"],
      apply: { ask: "Why can Italian cheese be sold in France without a tariff?",
               opts: ["France has no tariffs on anything", "Both are in the EU's single market",
                      "The WTO bans tariffs on cheese", "Using the euro removes tariffs"],
               right: 1,
               why: "The single market removes tariffs between EU members." },
      xfer: { ask: "After the United Kingdom left the EU in 2020, what did British businesses " +
                   "selling to Europe start to face?",
              opts: ["Nothing different", "Customs paperwork and checks at the border",
                      "A switch to the euro", "Membership of the Schengen Area"],
              right: 1,
              why: "Outside the single market and customs union, goods need paperwork and checks " +
                   "they did not need before." }
    }),

    C("USMCA", {
      why: "It sets the rules of trade between the United States and its two largest neighbours.",
      eg: "Farm goods, cars and car parts cross between the US, Mexico and Canada largely " +
          "tariff-free.",
      miss: [["NAFTA is still the agreement in force.",
              "USMCA replaced NAFTA in 2020."]],
      pre: [], rel: ["World Trade Organization"],
      say: ["United States", "Mexico", "Canada", "NAFTA", "replaced", "2020"],
      apply: { ask: "Which three countries are in USMCA?",
               opts: ["The US, Canada and Mexico", "The US, Mexico and Cuba",
                      "Canada, Mexico and Brazil", "The US, Canada and the UK"],
               right: 0,
               why: "The name gives it away: United States, Mexico, Canada." },
      xfer: { ask: "A car is built from parts made in all three USMCA countries. Why does the deal " +
                   "matter so much to carmakers?",
              opts: ["It sets their exchange rates",
                     "Parts can cross borders several times without a tariff at each crossing",
                     "It bans cars from Asia",
                     "It pays their workers"],
              right: 1,
              why: "A car's parts may cross a border again and again. A tariff at every crossing " +
                   "would add up fast." }
    }),

    C("World Bank", {
      why: "It is one of the main ways money from richer countries reaches development projects in " +
           "poorer ones.",
      eg: "A loan to build roads and schools, agreed as part of a country's plan to reduce poverty.",
      miss: [["The World Bank and the IMF do the same job.",
              "The World Bank funds long-term development. The IMF deals with exchange rates and " +
              "short-term payment crises."]],
      pre: [], rel: ["International Monetary Fund"],
      say: ["loans", "developing", "poverty", "projects", "countries"],
      apply: { ask: "A poor country wants money to build clean-water systems over ten years. Which " +
                    "organisation is designed for that?",
               opts: ["The World Bank", "The IMF", "The WTO", "The European Central Bank"],
               right: 0,
               why: "Long-term projects aimed at reducing poverty are the World Bank's work." },
      xfer: { ask: "Why does the World Bank build its lending around each poor country's own plan " +
                   "for reducing poverty?",
              opts: ["To cut down on paperwork",
                     "So the money backs what the country itself has made a priority",
                     "Because it may not lend any other way",
                     "To set the country's exchange rate"],
              right: 1,
              why: "Money that follows a country's own priorities is more likely to be used well " +
                   "and to last." }
    }),

    C("International Monetary Fund", {
      why: "It is the lender countries turn to in a crisis, and its conditions can reshape a whole " +
           "economy.",
      eg: "A country that cannot pay for its imports borrows from the IMF and agrees to cut its " +
          "budget deficit.",
      miss: [["The IMF asks for collateral, like a bank.",
              "It asks for policy changes instead, which is called conditionality."]],
      pre: ["World Bank"], rel: ["Exchange rate", "Balance of payments"],
      say: ["exchange rates", "stability", "lends", "conditions", "quota", "members"],
      apply: { ask: "A country's currency is collapsing and it cannot pay its foreign bills. Which " +
                    "organisation is set up to help?",
               opts: ["The World Bank", "The IMF", "APEC", "The Ex-Im Bank"],
               right: 1,
               why: "Short-term payment crises and exchange-rate stability are the IMF's job." },
      xfer: { ask: "Why are the IMF's loan conditions controversial?",
              opts: ["Because the IMF charges no interest",
                     "Because the policy changes it requires can be painful for ordinary people",
                     "Because it only lends to rich countries",
                     "Because it sets tariffs"],
              right: 1,
              why: "Spending cuts and reforms can cost jobs and services, even when they help a " +
                   "country repay." }
    }),

    C("Exchange rate", {
      why: "It decides what every foreign purchase really costs, and it changes every day.",
      eg: "At €1 = $1.25, a €20 T-shirt costs an American $25.",
      miss: [["A bigger number always means a stronger home currency.",
              "It depends which way round the rate is written. €1 = $1.25 and $1 = €0.80 are the " +
              "same rate."]],
      pre: [], rel: ["Balance of payments"],
      say: ["price", "currency", "another", "direct", "indirect", "forex"],
      apply: { ask: "The rate is £1 = $1.30. A British book costs £10. What does it cost in dollars?",
               opts: ["$10", "$7.69", "$13", "$1.30"],
               right: 2,
               why: "Each pound costs $1.30, so £10 costs 10 × 1.30 = $13." },
      xfer: { ask: "The euro gets stronger against the dollar. What happens to an American's holiday " +
                   "in Paris?",
              opts: ["It gets cheaper", "It gets more expensive", "It costs the same",
                     "The hotel has to accept dollars"],
              right: 1,
              why: "Each euro now costs more dollars, so everything priced in euros costs an " +
                   "American more." }
    }),

    C("Balance of payments", {
      why: "It is the full picture behind the trade figures: it shows how a deficit actually gets " +
           "paid for.",
      eg: "A country buys $80bn more than it sells, and a net $80bn of foreign investment coming in " +
          "covers it.",
      miss: [["A trade deficit means the balance of payments is out of balance.",
              "The whole balance of payments always adds to zero. The deficit is matched by money " +
              "flowing in some other way."]],
      pre: ["Balance of trade"], rel: ["Exchange rate"],
      say: ["record", "payments", "in", "out", "zero", "investment"],
      apply: { ask: "A country's imports are $40bn more than its exports. What must be true of the " +
                    "rest of its payments?",
               opts: ["$40bn more must come in than goes out",
                      "$40bn more must go out than comes in",
                      "They must add up to exactly zero on their own",
                      "The IMF must lend it $40bn"],
               right: 0,
               why: "The accounts must balance, so $40bn has to arrive some other way — investment, " +
                    "borrowing or reserves." },
      xfer: { ask: "Why do countries that run trade deficits for many years tend to build up debt?",
              opts: ["Because deficits are illegal",
                     "Because the gap is often covered by borrowing from abroad, year after year",
                     "Because surpluses cancel them out automatically",
                     "Because the WTO fines them"],
              right: 1,
              why: "If each year's deficit is paid for by borrowing, each year adds to what is owed." }
    }),

    C("Licensing", {
      why: "It is the quickest, lowest-risk way into a foreign market — paid for with control.",
      eg: "Polski Fiat built Fiat's 508 car in Poland under licence in the 1930s.",
      miss: [["Licensing and franchising are the same thing.",
              "A licence lets another firm use one thing, such as a brand or a recipe. A franchise " +
              "hands over a whole way of running the business."]],
      pre: [], rel: ["Franchising", "Joint venture"],
      say: ["licensor", "licensee", "fee", "royalty", "brand", "technology"],
      apply: { ask: "A drinks company cannot sell in a country because of food rules. It lets a local " +
                    "drinks maker produce its recipe in return for 15% of sales. What is this?",
               opts: ["Exporting", "Licensing", "Direct investment", "Countertrade"],
               right: 1,
               why: "Letting a local firm use your recipe for a royalty is licensing." },
      xfer: { ask: "A famous brand licenses its name to a foreign clothing maker, which then sells " +
                   "badly made clothes. What is the brand's biggest risk?",
              opts: ["Losing its factory", "Damage to its own reputation",
                     "Paying tariffs", "A trade surplus"],
              right: 1,
              why: "Losing quality control is licensing's main weakness: the licensee's mistakes " +
                   "carry the licensor's name." }
    }),

    C("Franchising", {
      why: "It lets a brand spread fast with other people's money — and lets local owners run a " +
           "proven business.",
      eg: "A local owner opens a restaurant under a global brand, pays fees, and follows its recipes " +
          "and methods.",
      miss: [["The franchiser pays to open each new location.",
              "The franchisee puts up most of the money and takes most of the risk."]],
      pre: ["Licensing"], rel: ["Joint venture"],
      say: ["franchiser", "franchisee", "brand", "system", "fees", "local"],
      apply: { ask: "In a franchise, who usually pays to build and open a new restaurant?",
               opts: ["The franchiser", "The franchisee", "The government", "The customers"],
               right: 1,
               why: "The franchisee invests the money, and gets the brand and the system in return." },
      xfer: { ask: "Why can a franchise adapt its menu to local tastes more easily than a shop run " +
                   "from head office abroad?",
              opts: ["Franchises have no rules",
                     "Local owners know local customers and can pass that on",
                     "Menus are set by the WTO",
                     "Franchises pay no tariffs"],
              right: 1,
              why: "Local ownership brings local knowledge — one of franchising's biggest " +
                   "advantages." }
    }),

    C("Joint venture", {
      why: "It lets companies take on projects too costly or risky to try alone, and share the " +
           "reward.",
      eg: "Sony Ericsson combined a Japanese electronics company and a Swedish telecoms company to " +
          "make phones.",
      miss: [["Partners in a joint venture always own equal shares.",
              "They share ownership and control, but the split is often unequal."]],
      pre: [], rel: ["Licensing", "Foreign direct investment"],
      say: ["new", "company", "together", "share", "equity", "profits"],
      apply: { ask: "Two companies each put money into a brand-new company that both own and run, " +
                    "and split its profits. What is it?",
               opts: ["A licence", "A franchise", "A joint venture", "Outsourcing"],
               right: 2,
               why: "A new, jointly owned business with shared control and profit is a joint " +
                    "venture." },
      xfer: { ask: "A company wants to enter a country whose laws and customers it does not know. " +
                   "Why might a joint venture with a local firm help?",
              opts: ["It avoids all taxes",
                     "The local partner brings market knowledge and contacts",
                     "It guarantees a profit",
                     "It removes all competition"],
              right: 1,
              why: "The local partner supplies what the newcomer lacks, and both share the risk." }
    }),

    C("Outsourcing", {
      why: "It is one of the main ways companies cut costs and focus — and one of the most " +
           "politically argued over.",
      eg: "A bank pays a call-centre company to answer its customers' calls.",
      miss: [["Outsourcing always means sending work abroad.",
              "It means another company does the work. That company can be in the same country."]],
      pre: [], rel: ["Offshoring"],
      say: ["another company", "contract", "service", "cost", "work"],
      apply: { ask: "A school hires a separate company to run its cafeteria. Is this outsourcing?",
               opts: ["Yes — another company does work the school could do itself",
                      "No — the company is not in another country",
                      "No — schools cannot outsource",
                      "Only if the company is foreign"],
               right: 0,
               why: "Outsourcing is about who does the work, not where." },
      xfer: { ask: "A company outsources the processing of its customers' personal data. What new " +
                   "risk should it plan for?",
              opts: ["Higher tariffs", "Leaks of confidential information",
                     "A stronger currency", "Too many employees"],
              right: 1,
              why: "Handing data to another firm adds privacy and security risks the company no " +
                   "longer fully controls." }
    }),

    C("Offshoring", {
      why: "It explains why so much manufacturing now happens in China and so many services are " +
           "run from India.",
      eg: "A US company moves its own accounting department to an office it opens in India.",
      miss: [["Offshoring means hiring another company.",
              "It means moving the work to another country. The company can keep doing it itself."]],
      pre: ["Outsourcing"], rel: [],
      say: ["another country", "move", "process", "cost", "location"],
      apply: { ask: "A carmaker closes its own US factory and opens its own new factory in Mexico. " +
                    "What is this?",
               opts: ["Outsourcing only", "Offshoring", "Licensing", "Countertrade"],
               right: 1,
               why: "The work moved country, but the company still does it itself: offshoring, not " +
                    "outsourcing." },
      xfer: { ask: "A US company moves work to Canada rather than to Asia, partly so time zones " +
                   "match. What is this sometimes called?",
              opts: ["Insourcing", "Nearshoring", "Bartering", "Licensing"],
              right: 1,
              why: "Moving work to a cheaper country close by is nearshoring." }
    }),

    C("Foreign direct investment", {
      why: "It is how a company puts down real roots abroad — and what many developing countries " +
           "work hardest to attract.",
      eg: "A Japanese carmaker builds a factory in the United States.",
      miss: [["Buying a few shares in a foreign company is direct investment.",
              "That is portfolio investment. Direct investment means owning and running an " +
              "operation."]],
      pre: [], rel: ["Joint venture"],
      say: ["buy", "build", "operation", "another country", "control", "factory"],
      apply: { ask: "Which of these is foreign direct investment?",
               opts: ["A US family buys shares in a German company",
                      "A German company builds a factory in Texas",
                      "A shop imports German cheese",
                      "A student changes dollars into euros"],
               right: 1,
               why: "Building and running an operation abroad is direct investment. Buying shares " +
                    "alone is portfolio investment." },
      xfer: { ask: "Developing countries that signed more trade agreements attracted more foreign " +
                   "direct investment. Why might that be?",
              opts: ["Agreements ban foreign companies",
                     "Firmer rules make a long-term investment like a factory look safer",
                     "Agreements raise tariffs",
                     "Agreements fix exchange rates"],
              right: 1,
              why: "A factory takes years to pay for itself. Predictable trade rules lower the risk " +
                   "of that bet." }
    })
  ];

  /* Media Arts, Unit 7. Every concept authored: video vocabulary is full of
     words that sound alike and mean opposite things on set — a pan is not a
     tilt, a tilt is not a pedestal, a jump cut is not any cut — and the
     questions are written to make a student tell them apart, not recite them. */
  var MEDIA7 = [
    C("Camcorder", {
      why: "It is the tool the whole unit is about, and knowing it is two machines in one explains what " +
           "each part does.",
      eg: "A news crew's shoulder camcorder records straight to a memory card, with no separate recorder.",
      miss: [["A camcorder is just a digital camera.",
              "It is a video camera and a video recorder in one body. Early video cameras had to be cabled " +
              "to a separate recorder."]],
      pre: [], rel: ["Image sensor"],
      say: ["camera", "recorder", "one", "body", "video", "record"],
      apply: { ask: "In 1980 a TV crew used a camera cabled to a separate recorder carried on a strap. What " +
                    "did the camcorder change?",
               opts: ["It recorded in colour for the first time", "It put the camera and the recorder in one body",
                      "It removed the need for a lens", "It made video digital"],
               right: 1,
               why: "Camera plus recorder is both the name and the idea. Colour and digital video came " +
                    "separately." },
      xfer: { ask: "A smartphone records video. By the definition of a camcorder, is it one?",
              opts: ["Yes — it captures and records video in one device", "No — only devices sold as camcorders count",
                     "No — phones have no image sensor", "Only when it zooms"],
              right: 0,
              why: "It combines a camera and a recorder in one body, which is all the word means. A phone is " +
                   "simply a camcorder that does other things too." }
    }),

    C("Image sensor", {
      why: "It is where the picture is actually made. Everything before it only steers light onto it.",
      eg: "Behind every camcorder lens sits a small rectangular chip covered in millions of light-sensitive sites.",
      miss: [["The image sensor is a mechanical part.",
              "It is an electronic chip with no moving parts. It turns light into an electrical signal."]],
      pre: [], rel: ["Camcorder"],
      say: ["chip", "light", "signal", "electronic", "CMOS", "CCD"],
      apply: { ask: "Light passes through a camcorder's lens. What turns it into something that can be stored " +
                    "on a memory card?",
               opts: ["The viewfinder", "The image sensor", "The zoom control", "The AC adapter"],
               right: 1,
               why: "The lens focuses light onto the sensor, and the sensor converts it into a signal the " +
                    "camcorder records." },
      xfer: { ask: "In a film camera, what does the job that the image sensor does in a camcorder?",
              opts: ["The shutter", "The film itself", "The lens cap", "The viewfinder"],
              right: 1,
              why: "Film is where the light is recorded in a film camera. The sensor took over exactly that job." }
    }),

    C("Nitrate film", {
      why: "Much of early film history was shot on it, and much of that history has been lost to fire and " +
           "decay.",
      eg: "Archives keep surviving nitrate reels in fire-resistant vaults, away from other collections.",
      miss: [["Nitrate was an early video format.",
              "It was motion-picture film. Video — a picture stored as an electronic signal — came decades " +
              "later."]],
      pre: [], rel: ["Safety film"],
      say: ["flammable", "decay", "celluloid", "1889", "film", "archive"],
      apply: { ask: "An archive finds a feature film from 1935 in a rusted can. The film has turned sticky, and " +
                    "in places to brown powder. What is the base most likely to be?",
               opts: ["Nitrate", "Polyester", "Magnetic tape", "A DVD"],
               right: 0,
               why: "Professional film before about 1951 was nitrate, which turns sticky and then to powder as " +
                    "it decays." },
      xfer: { ask: "Why did cinemas in the nitrate era enclose their projectors in fireproof booths?",
              opts: ["Projectors were loud", "Nitrate film could ignite in the heat of the projector",
                     "To keep the film cold", "Sound equipment needed shielding"],
              right: 1,
              why: "A reel stuck in front of the hot lamp could catch fire, and nitrate burns fiercely." }
    }),

    C("Safety film", {
      why: "It is why film stopped burning down cinemas — and why archives now fight a different enemy.",
      eg: "16mm film, introduced for home movies in 1923, was made only on acetate safety film.",
      miss: [["Acetate damages the camera if it jams.",
              "Acetate tears in a jam, which protects the camera. Polyester is strong enough to damage the " +
              "machine instead."]],
      pre: ["Nitrate film"], rel: [],
      say: ["acetate", "safety", "nitrate", "vinegar", "replaced", "tears"],
      apply: { ask: "A reel of 1960s acetate film smells strongly of vinegar. What is happening?",
               opts: ["It is about to catch fire", "The acetate base is breaking down",
                      "It was stored too cold", "It is really nitrate film"],
               right: 1,
               why: "Vinegar syndrome: as acetate decays it releases acetic acid, which speeds up the decay." },
      xfer: { ask: "Why is original camera negative still made on acetate rather than on stronger polyester?",
              opts: ["Polyester cannot hold an image", "Acetate tears in a jam instead of damaging the camera",
                     "Acetate is flammable", "Polyester cannot be developed"],
              right: 1,
              why: "A weak point that gives way protects a very expensive machine. Strong polyester is used for " +
                   "prints, where durability matters more." }
    }),

    C("LaserDisc", {
      why: "It shows that a disc and a laser do not make a format digital.",
      eg: "The first LaserDisc sold in North America was Jaws, in December 1978.",
      miss: [["LaserDisc was the first digital recording tool.",
              "Its picture was an analog signal, and it played pre-recorded films. Nobody recorded their own " +
              "video on it at home."]],
      pre: [], rel: [],
      say: ["optical", "analog", "1978", "disc", "laser", "films"],
      apply: { ask: "A friend says LaserDisc was basically an early DVD. What is the key difference?",
               opts: ["LaserDisc stored video as an analog signal; DVD stores it digitally",
                      "LaserDisc was smaller", "A DVD was read by a needle", "There is no difference"],
               right: 0,
               why: "Both are read by a laser, but only the DVD stores the picture as digital data." },
      xfer: { ask: "A vinyl record is read by a needle and a CD by a laser. Which statement is true?",
              opts: ["Anything read by a laser is digital",
                     "How a disc is read does not decide whether its data is analog or digital",
                     "All discs are analog", "Only CDs use lasers"],
              right: 1,
              why: "LaserDisc is the proof: read by laser, and analog." }
    }),

    C("Non-linear editing", {
      why: "It is how nearly every video is edited today, and it changed what editors could afford to try.",
      eg: "Moving the final shot of a timeline to the very start takes a single drag in editing software.",
      miss: [["Non-linear editing means cutting film with scissors.",
              "Physically splicing is film editing. Non-linear editing is done in software, where clips move " +
              "without touching the original footage."]],
      pre: [], rel: [],
      say: ["timeline", "software", "any order", "clips", "move", "re-record"],
      apply: { ask: "On a tape-to-tape system, an editor wants to swap shots 2 and 5 of a finished ten-shot " +
                    "sequence. What must happen?",
               opts: ["Drag the two clips", "Re-record everything from shot 2 onward", "Nothing", "Delete shot 1"],
               right: 1,
               why: "That is the cost of linear editing, and it is exactly what non-linear editing removed." },
      xfer: { ask: "A student rearranges paragraphs in a word processor instead of retyping the whole essay. " +
                   "Which kind of editing is that like?",
              opts: ["Linear", "Non-linear", "Neither", "Analog"],
              right: 1,
              why: "Any part can be moved anywhere without redoing the rest — the definition of non-linear." }
    }),

    C("180-degree rule", {
      why: "Break it and viewers lose track of who is where, even if they could not say why.",
      eg: "In a conversation the cameras all stay on one side of the line between the two speakers, so one " +
          "always faces right and the other left.",
      miss: [["Crossing the line gives a reverse angle.",
              "It flips screen direction, so the two people swap sides. Ordinary reverse shots stay on the " +
              "same side of the line."]],
      pre: [], rel: ["Establishing shot"],
      say: ["line", "side", "left", "right", "two", "axis"],
      apply: { ask: "In shot 1, A is on the left of the frame facing right. For shot 2 the camera crosses the " +
                    "line. What do viewers see?",
               opts: ["A still on the left", "A now on the right, facing left", "Both on the left", "A seen from above"],
               right: 1,
               why: "Crossing the axis mirrors the left–right relationship." },
      xfer: { ask: "A football broadcast keeps its main cameras on one side of the pitch. Why?",
              opts: ["To avoid the sun", "So a team attacking left keeps moving left on screen",
                     "To use fewer cables", "The rules of football require it"],
              right: 1,
              why: "The same rule keeps the direction of play consistent for viewers." }
    }),

    C("Establishing shot", {
      why: "It tells the audience where they are before the story asks them to care about who.",
      eg: "A wide shot of a hospital at night, before the cut to a nurse at her desk.",
      miss: [["An establishing shot is always a close-up.",
              "It is usually wide or very wide, because its job is to show the place."]],
      pre: [], rel: ["Close-up", "180-degree rule"],
      say: ["first", "wide", "where", "place", "scene", "context"],
      apply: { ask: "A scene takes place in a small diner. Which shot best establishes it?",
               opts: ["A close-up of a coffee cup", "A wide shot of the diner from across the street",
                      "A shot of a character's eyes", "A black screen"],
               right: 1,
               why: "Only the wide exterior shows the audience where the scene is." },
      xfer: { ask: "A news report opens on a wide aerial shot of a flooded town before interviewing a resident. " +
                   "What is that first shot doing?",
              opts: ["Hiding the location", "Establishing where the story is", "Making a jump cut", "Replacing the interview"],
              right: 1,
              why: "News uses the same grammar as film: place first, then people." }
    }),

    C("Close-up", {
      why: "Emotion lives in faces, and the close-up is how a film puts a face in front of you.",
      eg: "A close-up on an actor's eyes as they fill with tears.",
      miss: [["A close-up is just a zoomed-in wide shot.",
              "A shot size is defined by what it frames — here, part of the subject — however the camera " +
              "gets there."]],
      pre: [], rel: ["Establishing shot"],
      say: ["face", "emotion", "fills", "detail", "frame", "reaction"],
      apply: { ask: "A director wants the audience to feel a character's fear. Which shot size fits best?",
               opts: ["Extreme wide shot", "Close-up", "Bird's-eye view", "Establishing shot"],
               right: 1,
               why: "The close-up puts the face — where fear shows — at the centre of the frame." },
      xfer: { ask: "A cooking video fills the whole frame with a knife slicing garlic. What shot size is it?",
              opts: ["A close-up, or insert, of the garlic", "A wide shot", "A master shot", "An establishing shot"],
              right: 0,
              why: "The frame is filled with a detail of the action, which is what a close-up does." }
    }),

    C("Low-angle shot", {
      why: "It changes how powerful a subject feels without changing a word of the script.",
      eg: "A hero is often shot from below as they rise to their feet.",
      miss: [["A low-angle shot means the camera is far away.",
              "It is about height, not distance: the camera is below the subject, looking up."]],
      pre: [], rel: ["Dutch angle"],
      say: ["below", "up", "powerful", "bigger", "angle", "looking"],
      apply: { ask: "A documentary wants a skyscraper to look overwhelming. Where should the camera be?",
               opts: ["High above, looking down", "At street level, looking up", "Level with the 20th floor",
                      "Behind the building"],
               right: 1,
               why: "Looking up from low makes the subject loom." },
      xfer: { ask: "An election poster photographs a candidate from slightly below. What impression is intended?",
              opts: ["Weakness", "Strength and authority", "Confusion", "Nothing at all"],
              right: 1,
              why: "The same low angle that works in film works in a still photograph." }
    }),

    C("Dutch angle", {
      why: "A tilted horizon is one of the quickest ways to make a scene feel wrong.",
      eg: "A dizzy character stumbles home, and the frame tilts with them.",
      miss: [["A Dutch angle is a camera pointed down from above.",
              "That is a high angle. A Dutch angle rolls the camera sideways so the horizon slants."]],
      pre: [], rel: ["Low-angle shot"],
      say: ["tilt", "roll", "horizon", "unease", "sideways", "slanted"],
      apply: { ask: "In a thriller, the moment a character realises they are being watched, the horizon slants. " +
                    "What is being used?",
               opts: ["A Dutch angle", "A pan", "A dolly zoom", "A close-up"],
               right: 0,
               why: "Rolling the camera tilts the horizon, which reads as unease." },
      xfer: { ask: "A video game tilts the whole screen when the player's character is poisoned. What film " +
                   "technique does that borrow?",
              opts: ["A Dutch angle", "A jump cut", "An establishing shot", "Lead room"],
              right: 0,
              why: "The same slanted horizon, used for the same feeling." }
    }),

    C("Tracking shot", {
      why: "Moving with a subject keeps the audience beside them, instead of watching from one spot.",
      eg: "The camera rides a dolly on rails beside a running actor.",
      miss: [["A tracking shot is the same as a pan.",
              "In a pan the camera stays put and turns. In a tracking shot the whole camera travels."]],
      pre: [], rel: ["Pan", "Camera stabilizer"],
      say: ["moves", "alongside", "dolly", "track", "travels", "subject"],
      apply: { ask: "A horse gallops along a fence, and the camera must stay level with its head the whole way. " +
                    "Which shot?",
               opts: ["A pan from one spot", "A tracking shot", "A tilt", "A dissolve"],
               right: 1,
               why: "Only a camera that travels with the horse stays level with it." },
      xfer: { ask: "In a car advert, a camera car drives alongside the car being filmed at the same speed. In " +
                   "film terms, what is that?",
              opts: ["A tracking shot", "A rack focus", "A cutaway", "A tilt"],
              right: 0,
              why: "The camera travels with the subject — the vehicle simply replaces the dolly." }
    }),

    C("Pan", {
      why: "It is the simplest camera move, and the one most often done badly — usually too fast.",
      eg: "From one spot, the camera sweeps slowly across a city skyline.",
      miss: [["Following someone up a staircase is a pan.",
              "Up and down is a tilt. A pan turns the camera left or right."]],
      pre: [], rel: ["Tilt", "Tracking shot"],
      say: ["turn", "horizontal", "left", "right", "fixed", "sweep"],
      apply: { ask: "A camera on a tripod follows a car driving left to right across a field, and the tripod " +
                    "does not move. What move is this?",
               opts: ["Pan", "Tilt", "Dolly", "Pedestal"],
               right: 0,
               why: "Turning horizontally from a fixed point is a pan." },
      xfer: { ask: "You stand still and turn your head to look along a row of shops. Which camera move does " +
                   "your head imitate?",
              opts: ["Tilt", "Pan", "Truck", "Crane"],
              right: 1,
              why: "Your eyes stay in one place and turn sideways — a pan." }
    }),

    C("Tilt", {
      why: "It reveals height: a tower, a person from head to foot, a threat above.",
      eg: "The camera starts at a climber's boots and tilts up to the summit.",
      miss: [["A tilt raises the whole camera.",
              "That is a pedestal. A tilt only points the lens up or down from the same place."]],
      pre: [], rel: ["Pan"],
      say: ["up", "down", "point", "vertical", "fixed", "lens"],
      apply: { ask: "The camera stays on its tripod and moves from a person's shoes up to their face. What move?",
               opts: ["Tilt", "Pedestal", "Pan", "Truck"],
               right: 0,
               why: "The camera pivots upward without changing height — a tilt." },
      xfer: { ask: "On a studio camera, the operator raises the whole camera column so the lens sits higher, " +
                   "still pointing straight ahead. What move is that?",
              opts: ["Tilt", "Pedestal", "Pan", "Roll"],
              right: 1,
              why: "The height changed, not the direction the lens points — so it is a pedestal." }
    }),

    C("Dolly zoom", {
      why: "It turns a feeling — vertigo, dread, a sudden realisation — into something you can see.",
      eg: "Alfred Hitchcock's Vertigo (1958) uses it to show a man's fear of heights.",
      miss: [["A dolly zoom is just a fast zoom.",
              "It combines moving the camera with zooming the opposite way, so the subject stays the same " +
              "size while the background changes."]],
      pre: [], rel: ["Tracking shot"],
      say: ["zoom", "dolly", "same size", "background", "opposite", "vertigo"],
      apply: { ask: "The camera moves back while zooming in, keeping the actor the same size. What happens to " +
                    "the background?",
               opts: ["It seems to shrink away", "It seems to swell up behind the actor",
                      "It stays exactly the same", "It goes out of focus"],
               right: 1,
               why: "The zoomed-in lens takes in a narrower slice of the background, so it fills more of the frame." },
      xfer: { ask: "Why can't a zoom on its own produce the dolly zoom effect?",
              opts: ["A zoom enlarges everything equally; only moving the camera changes perspective",
                     "Zooms are too slow", "Zoom lenses cannot focus", "It can"],
              right: 0,
              why: "Perspective depends on where the camera is, not on the lens." }
    }),

    C("Rack focus", {
      why: "It moves the audience's attention without a cut.",
      eg: "Focus slides from a ringing phone on a table to the person reaching for it.",
      miss: [["Rack focus means keeping everything sharp.",
              "It deliberately shifts sharp focus from one distance to another within the same shot."]],
      pre: [], rel: ["Close-up"],
      say: ["focus", "shift", "foreground", "background", "subject", "attention"],
      apply: { ask: "A flower in the foreground is sharp; then the focus slides to a person standing far behind " +
                    "it. What technique is this?",
               opts: ["Rack focus", "Dolly zoom", "Pan", "Dissolve"],
               right: 0,
               why: "Changing what is sharp within one shot is a rack focus." },
      xfer: { ask: "On a phone, you tap a nearby cup and then a distant tree, and the sharp area jumps between " +
                   "them. What film technique does that imitate?",
              opts: ["Rack focus", "Tilt", "Jump cut", "Dutch angle"],
              right: 0,
              why: "Same idea — choosing which distance is sharp." }
    }),

    C("Camera stabilizer", {
      why: "It gave filmmakers smooth moving shots anywhere a person could walk, without laying track.",
      eg: "Garrett Brown's Steadicam followed Rocky up the Philadelphia Museum of Art steps in 1976.",
      miss: [["A stabilizer is a kind of tripod.",
              "A tripod holds the camera still. A stabilizer lets it move smoothly with an operator who walks " +
              "or runs."]],
      pre: [], rel: ["Tracking shot"],
      say: ["smooth", "Steadicam", "operator", "walking", "balance", "steady"],
      apply: { ask: "A director needs a smooth shot following an actor up narrow stairs where no track can be " +
                    "laid. What tool?",
               opts: ["A dolly on track", "A camera stabilizer", "A crane", "A tripod"],
               right: 1,
               why: "The operator can climb stairs; the stabilizer keeps the picture smooth." },
      xfer: { ask: "A motorised phone gimbal keeps the picture level as you walk. It is a modern version of what?",
              opts: ["A teleprompter", "A camera stabilizer", "A dolly zoom", "A jib"],
              right: 1,
              why: "It isolates the camera from the operator's movement — motors instead of counterweights." }
    }),

    C("Lead room", {
      why: "Space ahead of a moving subject tells the viewer where it is going.",
      eg: "A cyclist heading right is framed on the left third, with open road ahead.",
      miss: [["Lead room is the space above the head.",
              "That is head room. Lead room is space in the direction of movement."]],
      pre: [], rel: ["Head room", "Leading lines"],
      say: ["space", "ahead", "direction", "moving", "in front", "frame"],
      apply: { ask: "A car drives from left to right across the frame. Where should it sit?",
               opts: ["Near the right edge", "On the left side, with space ahead on the right",
                      "Dead centre with no space either side", "Cut in half by the left edge"],
               right: 1,
               why: "Leave space in the direction of travel." },
      xfer: { ask: "In a comic panel, a character running right is drawn at the far right edge. Why does it feel " +
                   "cramped?",
              opts: ["There is no lead room — nowhere for the motion to go", "Too much head room",
                     "It is a Dutch angle", "It is a jump cut"],
              right: 0,
              why: "The rule belongs to the frame, whether the frame is film or paper." }
    }),

    C("Head room", {
      why: "Too much and a person seems to sink; too little and they seem squeezed out of the frame.",
      eg: "In an interview, the eyes sit near the upper third line with a small gap above the head.",
      miss: [["More head room always looks better.",
              "Too much makes the subject look small and the frame unbalanced. Aim for a small gap."]],
      pre: [], rel: ["Lead room"],
      say: ["above", "head", "top", "gap", "frame", "space"],
      apply: { ask: "On a video call, your head sits at the bottom of the screen under a big empty wall. What is " +
                    "wrong?",
               opts: ["Too much head room", "Too little lead room", "A Dutch angle", "A rack focus"],
               right: 0,
               why: "The empty space above the head is head room, and there is far too much of it." },
      xfer: { ask: "A tight close-up crops off the top of the subject's hair, with their eyes on the upper third " +
                   "line. Is that acceptable?",
              opts: ["Yes — in a tight close-up, cutting into the top of the head is normal",
                     "No — never crop a head", "Only in wide shots", "Only in black and white"],
              right: 0,
              why: "The eyes matter more than the hairline. The closer the shot, the less head room it needs." }
    }),

    C("Leading lines", {
      why: "They steer the eye to the subject without a word or a cut.",
      eg: "Railway tracks converge toward a figure standing in the distance.",
      miss: [["A tangent is a line that connects one subject to another.",
              "In composition, a tangent is an awkward touching of edges, usually avoided. Lines that guide " +
              "the eye are leading lines."]],
      pre: [], rel: ["Lead room"],
      say: ["lines", "guide", "eye", "toward", "road", "direct"],
      apply: { ask: "A shot shows a path winding up a hill to a lone house. What is the path doing?",
               opts: ["Acting as a leading line to the house", "Breaking the 180-degree rule",
                      "Adding head room", "Creating a jump cut"],
               right: 0,
               why: "The eye follows the path to where it ends — the house." },
      xfer: { ask: "In a painting, the edge of a table points straight at the main figure's face. What device is " +
                   "that?",
              opts: ["A leading line", "A rack focus", "A cutaway", "A Dutch angle"],
              right: 0,
              why: "Painters used leading lines long before cameras existed." }
    }),

    C("Teleprompter", {
      why: "It lets a presenter read every word while looking the audience in the eye.",
      eg: "A news anchor reads the script off angled glass mounted on the front of the studio camera.",
      miss: [["The teleprompter sits beside the camera, out of its view.",
              "The text is reflected onto glass directly in front of the lens, and the camera shoots straight " +
              "through the glass."]],
      pre: [], rel: [],
      say: ["glass", "lens", "reflect", "script", "read", "presenter"],
      apply: { ask: "Why don't viewers see the text of a studio teleprompter?",
               opts: ["The angled glass reflects the text toward the presenter while the camera sees through it",
                      "It is off to the side", "It uses invisible ink", "It is behind the presenter"],
               right: 0,
               why: "The glass is a one-way mirror: reflective to the presenter, transparent to the lens." },
      xfer: { ask: "A politician reads a speech from two clear glass panels on stands and seems to look at the " +
                   "crowd throughout. What are the panels?",
              opts: ["Teleprompters, without a camera", "Stage lights", "Microphones", "Stabilizers"],
              right: 0,
              why: "The same reflected-text idea, aimed at a live audience instead of a lens." }
    }),

    C("Foley", {
      why: "Much of what you hear in a film was made afterwards, on purpose, by a person.",
      eg: "A Foley artist walks in place on a tray of gravel to match an actor's footsteps.",
      miss: [["Foley is the final mix of a film's sound.",
              "The final balance is the re-recording mixer's job. Foley is performing sound effects in time " +
              "with the picture."]],
      pre: [], rel: [],
      say: ["sound", "effects", "footsteps", "performed", "sync", "recorded"],
      apply: { ask: "Footsteps recorded on set are drowned out by wind. What does the sound team do?",
               opts: ["Recreate them in a Foley session", "Reshoot the whole scene", "Add a dissolve",
                      "Raise the frame rate"],
               right: 0,
               why: "Performing the footsteps again, in sync, is exactly what Foley is for." },
      xfer: { ask: "A radio drama producer crumples cellophane near the microphone to sound like fire. What craft " +
                   "is that?",
              opts: ["Foley", "Rack focus", "Colour grading", "Tracking"],
              right: 0,
              why: "Foley grew out of exactly this radio tradition." }
    }),

    C("Match cut", {
      why: "It joins two moments through what they share, so the cut itself says something.",
      eg: "In 2001: A Space Odyssey (1968), a bone thrown into the air cuts to a spacecraft in orbit.",
      miss: [["A match cut joins two shots of the same thing at the same time.",
              "It links different shots through a matching shape, movement or composition — often across time " +
              "or place."]],
      pre: [], rel: ["Jump cut", "Dissolve"],
      say: ["matching", "shape", "movement", "link", "similar", "cut"],
      apply: { ask: "A spinning coin cuts to a spinning planet in the same position in the frame. What edit is it?",
               opts: ["Match cut", "Jump cut", "Cutaway", "Wipe"],
               right: 0,
               why: "Two different things, linked by shape, motion and position." },
      xfer: { ask: "A slideshow moves from a round clock face straight to a full moon in the same spot. Which " +
                   "film transition is it copying?",
              opts: ["Match cut", "Cutaway", "Jump cut", "Pan"],
              right: 0,
              why: "A matching shape carries the eye across the cut." }
    }),

    C("Jump cut", {
      why: "It makes time visibly skip, which can feel restless, funny or urgent.",
      eg: "Jean-Luc Godard's Breathless (1960) made the jump cut famous.",
      miss: [["Any cut between different angles is a jump cut.",
              "A jump cut keeps nearly the same angle and framing, so the subject seems to jump. Changing the " +
              "angle by 30 degrees or more hides the join."]],
      pre: [], rel: ["Match cut", "Cutaway"],
      say: ["same", "angle", "jump", "time", "skip", "framing"],
      apply: { ask: "A vlogger talks to a fixed camera, and the editor cuts out the pauses, so their head jerks " +
                    "at every cut. What are these?",
               opts: ["Jump cuts", "Match cuts", "Dissolves", "Wipes"],
               right: 0,
               why: "Same framing, time removed — the definition of a jump cut." },
      xfer: { ask: "An editor wants to shorten an interview without anyone noticing the join. What hides it?",
              opts: ["Laying a cutaway over the cut", "Adding more jump cuts", "Tilting the camera", "More head room"],
              right: 0,
              why: "The viewer is looking at something else at the moment the interview jumps." }
    }),

    C("Cutaway", {
      why: "It covers a cut and adds context in the same move.",
      eg: "An interviewee describes a painting, and the edit cuts to the painting before returning to them.",
      miss: [["A cutaway ends the scene.",
              "It leaves the main action only briefly, then returns to it."]],
      pre: [], rel: ["Jump cut"],
      say: ["interrupt", "something else", "return", "insert", "context", "show"],
      apply: { ask: "During an interview about a bridge collapse, the edit shows the damaged bridge, then returns " +
                    "to the speaker. The bridge shot is a…",
               opts: ["Cutaway", "Wipe", "Dutch angle", "Dolly zoom"],
               right: 0,
               why: "It interrupts the main action to show what is being talked about, then returns." },
      xfer: { ask: "A cooking show cuts from the host's face to the oven timer, then back to the host. What is " +
                   "the timer shot?",
              opts: ["A cutaway", "A match cut", "A dissolve", "A pan"],
              right: 0,
              why: "A brief look away from the main action, and back." }
    }),

    C("Dissolve", {
      why: "It tells the audience, gently, that time has passed or the place has changed.",
      eg: "A busy street in daylight dissolves into the same street, empty, at night.",
      miss: [["A dissolve is a seamless continuity cut.",
              "A dissolve usually signals a passage of time or a change of place. It draws attention to the join."]],
      pre: [], rel: ["Match cut"],
      say: ["fade", "overlap", "gradual", "time", "blend", "transition"],
      apply: { ask: "A character falls asleep, and the shot slowly blends into the same room the next morning. " +
                    "What transition?",
               opts: ["Dissolve", "Jump cut", "Cut", "Wipe"],
               right: 0,
               why: "One shot fades through the other, and the overlap says time has passed." },
      xfer: { ask: "A presentation fades one slide into the next over one second. Which film transition is that?",
              opts: ["Dissolve", "Match cut", "Cutaway", "Tracking shot"],
              right: 0,
              why: "A gradual overlap of two images is a dissolve, on any screen." }
    }),

    C("Frame rate", {
      why: "It decides how smooth motion looks — and playing it back at a different rate makes slow motion.",
      eg: "Film runs at 24 frames per second. Shoot at 120 and play at 24, and action slows to a fifth.",
      miss: [["Video works because the images blur together in the eye.",
              "The brain perceives motion from the differences between frames — apparent motion — not from " +
              "images lingering or blurring."]],
      pre: [], rel: [],
      say: ["frames", "second", "24", "smooth", "motion", "fps"],
      apply: { ask: "Footage shot at 60 frames per second is played back at 30. How does the action look?",
               opts: ["Twice as fast", "Half speed — slow motion", "Exactly the same", "Frozen"],
               right: 1,
               why: "Each second of action now takes two seconds to show." },
      xfer: { ask: "A flip-book looks jerky with 5 drawings a second and smooth with 20. What changed?",
              opts: ["The frame rate", "The aspect ratio", "The head room", "The focus"],
              right: 0,
              why: "More images each second — a higher frame rate — makes motion smoother." }
    })
  ];

  /* ----------------------------------------------------------- Media Arts 8
     Animation is a unit of near-synonyms that are not synonyms: a key frame
     is not the first frame, twos are not slower than ones, timing is not
     spacing, a hold is not stillness, and modeling is not animation. Every
     one of those is a `miss` below, because a student who has never been
     shown the wrong version cannot tell that they are holding it. */
  var MEDIA8 = [
    C("Animation", {
      why: "It is the one idea the whole unit rests on: movement that was never there, made out of pictures " +
           "that do not move.",
      eg: "A flip book of twelve sticky notes. Nothing on any page moves, but the ball falls.",
      miss: [["Animation means cartoons.",
              "Animation is any run of still images shown fast enough to read as movement. A crash " +
              "simulation, a diagram of a heart and a stop-motion advert are all animation."]],
      pre: [], rel: ["Key frame", "Stop motion"],
      say: ["still", "images", "sequence", "quickly", "movement", "illusion"],
      apply: { ask: "A surgeon shows a patient a moving picture of a knee operation, built from a 3D model. " +
                    "Is it animation?",
               opts: ["Yes — still images in sequence, shown as movement",
                     "No — only hand-drawn work counts", "No — it is a medical diagram",
                     "Only if a camera filmed it"],
               right: 0,
               why: "The images were made one at a time and played in order. What they are for does not change " +
                    "what they are." },
      xfer: { ask: "A photograph of a sprinter shows blur and speed. Why is it not animation?",
              opts: ["It is too short", "It is one image, not a sequence shown over time",
                    "It was not drawn", "Photographs cannot show movement"],
              right: 1,
              why: "Animation needs a series of images and time to play them in. One image, however fast its " +
                   "subject, is a picture." }
    }),

    C("Thaumatrope", {
      why: "It is the simplest proof of the thing every animation device relies on: the eye blends pictures " +
           "that arrive quickly enough.",
      eg: "A bird on one side of a card, a cage on the other. Spun, the bird is in the cage.",
      miss: [["A thaumatrope shows a small animation.",
              "Most combine two pictures into one still image. Nothing moves; the two simply arrive too fast " +
              "to be kept apart."]],
      pre: [], rel: ["Animation"],
      say: ["disc", "two", "pictures", "spin", "strings", "blend"],
      apply: { ask: "Why is the picture on the back of a thaumatrope drawn upside down?",
               opts: ["To make it harder to copy", "So the two pictures never line up",
                     "Because the card turns over as it spins, which puts it upright",
                     "Because the ink dries that way"],
               right: 2,
               why: "The strings flip the card end over end. Drawn the right way up, the back picture would " +
                    "appear upside down half the time." },
      xfer: { ask: "A screen alternates two images too fast for you to separate them, and you see both at once. " +
                   "Which toy is that?",
              opts: ["The zoetrope", "The flip book", "The praxinoscope", "The thaumatrope"],
              right: 3,
              why: "Blending two images into one is the thaumatrope's trick. The others show a sequence of " +
                   "different drawings." }
    }),

    C("Cel", {
      why: "The cel is what made cartoon studios affordable: paint the background once, and move only what moves.",
      eg: "A woman in a chair: the room and her body stay put, and only the mouth cel is swapped.",
      miss: [["A cel is the background.",
              "The background is painted on paper or board. Cels are the clear sheets laid on top of it."]],
      pre: [], rel: ["Limited animation"],
      say: ["clear", "plastic", "celluloid", "layer", "background", "paint"],
      apply: { ask: "Winsor McCay's team redrew the trees and rocks on every sheet of Gertie the Dinosaur. What " +
                    "would cels have saved them?",
               opts: ["Redrawing the background thousands of times", "Drawing the dinosaur",
                     "The need for a camera", "The need for key frames"],
               right: 0,
               why: "A cel lets one painted background sit under thousands of drawings of the character." },
      xfer: { ask: "In 2D digital animation, what does the job the cel used to do?",
              opts: ["The frame rate", "A layer", "The stage", "The codec"],
              right: 1,
              why: "A layer is a clear sheet in software: things on it move without disturbing what is below." }
    }),

    C("Limited animation", {
      why: "It is how most television animation is made, and it explains why some cartoons move so much less " +
           "than others.",
      eg: "A character talks: the body is one drawing, and only the mouth changes.",
      miss: [["Limited animation just means using cels.",
              "Cels were used for full animation too — Snow White is painted on them. Limited animation is the " +
              "choice to redraw as little as possible."]],
      pre: ["Cel"], rel: ["On twos", "Cycle"],
      say: ["reuse", "redraw", "only", "moves", "cheaper", "faster"],
      apply: { ask: "A studio must deliver twenty minutes of cartoon a week on a small budget. What will it do?",
               opts: ["Full animation on ones", "Stop motion",
                     "Limited animation, with reused drawings and cycles", "Rotoscope every frame"],
               right: 2,
               why: "Reusing drawings and looping cycles is the only one of these that gets cheaper as it gets " +
                    "longer." },
      xfer: { ask: "In an old TV cartoon a character's body freezes while the mouth moves, and the same walk " +
                   "goes past twice. What are you watching?",
              opts: ["A boil", "Pixilation", "A moving hold", "Limited animation"],
              right: 3,
              why: "Redrawing only the mouth, and repeating a walk cycle, are both limited animation saving work." }
    }),

    C("Stop motion", {
      why: "It is the style where the drawings are real objects, and where the cost of a single frame is " +
           "something you can feel.",
      eg: "Wallace and Gromit: clay over metal armatures, nudged a fraction between photographs.",
      miss: [["Stop motion is quicker than drawing everything.",
              "It is among the slowest ways to animate. At Aardman an animator finishes about two seconds of " +
              "film a day."]],
      pre: ["Animation"], rel: ["Pixilation"],
      say: ["photograph", "frame", "move", "object", "puppet", "slow"],
      apply: { ask: "A stop-motion advert runs 30 seconds at 24 frames a second. How many photographs is that?",
               opts: ["720", "24", "1,440", "30"],
               right: 0,
               why: "Twenty-four photographs for every second: 24 × 30 = 720, each one a small move of every " +
                    "puppet." },
      xfer: { ask: "Why do stop-motion crews bolt the camera down and control the lights so carefully?",
              opts: ["To save electricity",
                    "Because any accidental change between photographs shows as a jump",
                    "Because film is expensive", "To stop the clay melting"],
              right: 1,
              why: "The frames are taken minutes or hours apart, so anything that shifts — camera, lamp, a " +
                   "leaning puppet — flickers on screen." }
    }),

    C("Pixilation", {
      why: "It shows that the objects in stop motion can be people, and it is about the cheapest special " +
           "effect there is.",
      eg: "Norman McLaren's Neighbours (1952): men slide across the grass without walking.",
      miss: [["Pixilation is something to do with pixels.",
              "Nothing to do with pixels. It is stop motion with live actors, and the word comes from being " +
              "“pixilated” — bewitched."]],
      pre: ["Stop motion"], rel: [],
      say: ["actors", "people", "frame", "pose", "stop motion", "puppet"],
      apply: { ask: "A student photographs a friend only while they are in mid-air, twenty times, moving them " +
                    "along a little each time, then plays the photos in order. What is it?",
               opts: ["A rotoscope", "A boil", "Pixilation", "A time-lapse"],
               right: 2,
               why: "Live people held in poses, one frame at a time — the friend appears to fly." },
      xfer: { ask: "Why does a pixilated person look like a puppet rather than a person?",
              opts: ["The camera is too far away", "They are wearing costumes", "The frame rate is higher",
                    "The in-between moments of real movement are missing"],
              right: 3,
              why: "Real movement fills every instant. Posing frame by frame throws those instants away, which " +
                   "is exactly what makes a puppet look like a puppet." }
    }),

    C("3D modeling", {
      why: "Nothing in 3D can be textured, rigged, lit or moved until it exists as a model.",
      eg: "Martin Newell measured his family's teapot in 1975 and turned it into numbers.",
      miss: [["Modeling is a more advanced kind of animation.",
              "It is the step before animation. A model is a shape, and plenty of models — a printed part, a " +
              "game prop — never move at all."]],
      pre: [], rel: ["Texture mapping", "Rigging"],
      say: ["mesh", "faces", "surface", "three", "dimensions", "shape"],
      apply: { ask: "A studio is asked to animate a dragon that does not exist yet. What has to happen first?",
               opts: ["Modeling its surface", "Texture mapping", "Rigging", "Rendering"],
               right: 0,
               why: "There is nothing to texture, rig or render until the shape exists." },
      xfer: { ask: "A model is sent to a 3D printer instead of a renderer. Which steps were never needed?",
              opts: ["Modeling", "Texturing and rigging", "Measuring the object", "None of them"],
              right: 1,
              why: "A printed object gets its colour and its joints from the real world, so the surface picture " +
                   "and the skeleton are never built." }
    }),

    C("Texture mapping", {
      why: "It is where a grey shape becomes skin, rust, bark or cloth — most of what makes computer graphics " +
           "look like something.",
      eg: "A flat painting of a face, wrapped round a 3D head.",
      miss: [["A texture is how bumpy a surface is.",
              "Here a texture is a flat image wrapped onto the model, which gives it colour and pattern. Bumps " +
              "are faked with other maps."]],
      pre: ["3D modeling"], rel: [],
      say: ["image", "wrap", "surface", "colour", "pattern", "flat"],
      apply: { ask: "A game needs a hundred different-looking soldiers without a hundred models. What is the " +
                    "cheap way?",
               opts: ["Model each one", "Rig each one twice", "Put different textures on the same model",
                     "Render at a higher frame rate"],
               right: 2,
               why: "One shape, many surfaces. Changing the picture wrapped round a model is far cheaper than " +
                    "building new geometry." },
      xfer: { ask: "Why do artists lay a model's surface out flat before painting it?",
              opts: ["To measure its volume", "To add a skeleton", "To make the file smaller",
                    "So a flat picture can be painted, then wrapped back onto the shape"],
              right: 3,
              why: "Painting happens in two dimensions. The flat layout records which part of the picture lands " +
                   "on which part of the model." }
    }),

    C("Rigging", {
      why: "Without a rig a model can be carried about but never posed: no bent elbow, no expression.",
      eg: "A skeleton of joints inside a character, with handles an animator can grab.",
      miss: [["Rigging is a new, emerging technique.",
              "It has been standard in 3D animation for decades. What is still developing is how much of it a " +
              "computer can do for you."]],
      pre: ["3D modeling"], rel: [],
      say: ["skeleton", "joints", "bones", "controls", "pose", "inside"],
      apply: { ask: "An animator can slide a 3D character around the scene but cannot bend its arm. What is missing?",
               opts: ["A rig", "A texture", "A render", "A key frame"],
               right: 0,
               why: "Without joints and controls inside it, the model is one solid object." },
      xfer: { ask: "In stop motion, what does the same job as a rig?",
              opts: ["The clay", "The armature", "The camera", "The background"],
              right: 1,
              why: "A jointed metal skeleton that holds a pose is exactly what a rig is, in metal instead of maths." }
    }),

    C("Key frame", {
      why: "Keys are how an animator plans a movement. Everything else is filling in between them.",
      eg: "A hop needs three: the take-off, the top, and the landing.",
      miss: [["The key frame is the first drawing of a scene.",
              "A key falls wherever a movement starts, ends or changes direction — usually several times in a " +
              "scene, and often nowhere near the first frame."]],
      pre: [], rel: ["In-betweening", "Pose to pose"],
      say: ["important", "pose", "first", "start", "end", "change"],
      apply: { ask: "A ball rolls right, hits a wall and bounces back. Where do the key frames belong?",
               opts: ["Only at the start", "On every frame", "At the start, at the wall, and at the end",
                     "Exactly halfway"],
               right: 2,
               why: "The wall is where the movement changes direction, which is precisely what a key marks." },
      xfer: { ask: "In software you set poses on frames 1, 15 and 40 and the program fills in the rest. What have " +
                   "you set?",
              opts: ["In-betweens", "Cycles", "Holds", "Key frames"],
              right: 3,
              why: "The poses you set yourself are the keys; what the program calculates between them are the " +
                   "in-betweens." }
    }),

    C("In-betweening", {
      why: "It is where smoothness comes from, and where most of the drawing hours go.",
      eg: "Eleven in-betweens turn a jump between two keys into a smooth hop.",
      miss: [["In-betweens matter less than keys.",
              "They carry the timing and spacing. The same two keys, in-betweened differently, read as a " +
              "different weight, speed and mood."]],
      pre: ["Key frame"], rel: ["Slow in and slow out"],
      say: ["between", "keys", "smooth", "tween", "fill", "frames"],
      apply: { ask: "Two keys, no in-betweens, each held for twelve frames. What does the audience see?",
               opts: ["The object jumping from one pose to the other and waiting", "Smooth movement",
                     "Faster movement", "A blur"],
               right: 0,
               why: "With nothing between them, each key simply sits on screen until the next one replaces it." },
      xfer: { ask: "A program calculates the frames between your poses. What is the result called?",
              opts: ["A cycle", "A tween", "A boil", "A hold"],
              right: 1,
              why: "Tween is short for in-between: the same job, done by software." }
    }),

    C("On twos", {
      why: "It is the everyday economy of hand-drawn animation: half the drawings, and the same speed.",
      eg: "Twelve drawings for a second of film, each photographed twice.",
      miss: [["Animating on twos makes the movement slower.",
              "Speed is set by how far things move per drawing. Twos only makes motion less smooth, which is " +
              "why fast action is often done on ones."]],
      pre: ["Key frame"], rel: ["Timing", "Limited animation"],
      say: ["two", "frames", "held", "twelve", "drawings", "smooth"],
      apply: { ask: "A ball crosses the screen in one second on ones. It is redrawn on twos, same start and " +
                    "finish. What changes?",
               opts: ["It takes two seconds", "It moves twice as fast",
                     "It crosses at the same speed, a little less smoothly", "Nothing at all"],
               right: 2,
               why: "Twelve drawings now share the same second and the same distance: the speed is identical, " +
                    "the steps are bigger." },
      xfer: { ask: "In Spider-Man: Into the Spider-Verse, Miles is animated on twos early on and on ones later. " +
                   "What does that do?",
              opts: ["Saves money", "Slows the film down", "Changes the colours",
                    "Makes him look clumsy at first and smooth once he has mastered his powers"],
              right: 3,
              why: "Smoothness is used as characterisation: the experienced Spider-Man beside him is on ones " +
                   "from the start." }
    }),

    C("Moving hold", {
      why: "It is the difference between a character pausing and a character dying on screen.",
      eg: "A character waits for an answer, still breathing, the hand drifting a little.",
      miss: [["A hold means absolutely nothing moves.",
              "That is a still hold, and in 3D it reads as a freeze. A moving hold keeps a trace of movement so " +
              "the pause stays alive."]],
      pre: [], rel: ["Boil", "Timing"],
      say: ["pause", "slight", "movement", "alive", "breath", "frozen"],
      apply: { ask: "A 3D character holds a pose for two seconds and testers say the film looks broken. What " +
                    "fixes it?",
               opts: ["A moving hold", "A longer hold", "More exaggeration", "A lower frame rate"],
               right: 0,
               why: "Perfectly still computer-generated surfaces look like a stopped machine. A breath is enough " +
                    "to keep them alive." },
      xfer: { ask: "Why does a held drawing cause less trouble in hand-drawn animation than in 3D?",
              opts: ["Paper moves",
                    "Audiences read a drawn pause as a pause, while a photo-real render reads as a machine stopping",
                    "Drawings are bigger", "It uses fewer frames"],
              right: 1,
              why: "The more realistic the picture, the more a perfect freeze looks like a fault rather than a " +
                   "choice." }
    }),

    C("Boil", {
      why: "It shows that “still” can still shimmer — and in some cartoons it is the whole look.",
      eg: "Squigglevision in Dr. Katz: five tracings looped, so every outline shivers.",
      miss: [["A boil is a mistake in the tracing.",
              "It can be. It is also used deliberately, to keep a held drawing alive or as a house style."]],
      pre: ["Moving hold"], rel: [],
      say: ["trace", "same", "drawing", "loop", "wobble", "lines"],
      apply: { ask: "A hand-drawn character stands still, but its outline keeps shivering. What is it?",
               opts: ["A tween", "A cycle", "A boil", "A rotoscope"],
               right: 2,
               why: "Several tracings of one drawing, looped: no two are quite the same, so the line wriggles." },
      xfer: { ask: "Why does a boil make a motionless character feel alive?",
              opts: ["The colours change", "It uses more frames a second", "It plays faster",
                    "The picture is never exactly the same twice, so the eye keeps finding movement"],
              right: 3,
              why: "The eye is drawn to change. A tiny, constant change is enough to read as life." }
    }),

    C("Cycle", {
      why: "It is how animation buys long movement cheaply — and the first thing a beginner gets wrong.",
      eg: "Four poses of a walk, repeated for as long as the character needs to keep walking.",
      miss: [["Any short repeated clip is a cycle.",
              "A cycle has to end where it begins. If the last drawing does not lead back into the first, it " +
              "pops every time it loops."]],
      pre: ["Key frame"], rel: ["Limited animation"],
      say: ["repeat", "loop", "ends", "begins", "walk", "drawings"],
      apply: { ask: "A walk is drawn as left foot forward, legs together, right foot forward — and then repeats. " +
                    "What goes wrong?",
               opts: ["The legs swap over in a single frame, because the second passing pose is missing",
                     "Nothing", "It looks too smooth", "The character walks backwards"],
               right: 0,
               why: "Going back to “left foot forward” from “right foot forward” skips the passing pose, so the " +
                    "legs jump." },
      xfer: { ask: "A flag waves in the background of a shot for thirty seconds. How is that normally made?",
              opts: ["Thirty seconds of unique drawings", "A short cycle, repeated", "A single hold",
                    "Rotoscoped footage"],
              right: 1,
              why: "Background movement that nobody studies closely is exactly what cycles are for." }
    }),

    C("Pose to pose", {
      why: "It is how most acting is animated, and it only makes sense against its opposite, straight ahead.",
      eg: "Keys first, breakdowns second, in-betweens last.",
      miss: [["Pose to pose is just a slower version of straight ahead.",
              "They are different orders of work. Straight ahead is lively but drifts; pose to pose is " +
              "controlled but can come out even and stiff."]],
      pre: ["Key frame"], rel: ["In-betweening"],
      say: ["keys", "first", "plan", "then", "in-betweens", "control"],
      apply: { ask: "An animator has to hit an exact pose on an exact frame, to match a line of dialogue. Which " +
                    "method?",
               opts: ["Straight ahead", "Rotoscoping", "Pose to pose", "Boiling"],
               right: 2,
               why: "Planning the keys first is what lets you place a pose on a chosen frame." },
      xfer: { ask: "Fire, water and smoke are usually animated straight ahead. Why?",
              opts: ["They are easy to draw", "They need fewer frames", "They move slowly",
                    "They have no exact poses to hit, and straight ahead keeps them unpredictable"],
              right: 3,
              why: "There is no “right pose” for a flame on frame 12, and the drift that spoils acting is what " +
                   "makes fire look like fire." }
    }),

    C("Rotoscope", {
      why: "It is the oldest way of getting real movement into animation, and the ancestor of motion capture.",
      eg: "Max Fleischer filmed his brother in a clown suit and traced him as Koko the Clown.",
      miss: [["Rotoscoping is cheating.",
              "It is a tool. Traced movement brings real weight and timing, and it still has to be pushed and " +
              "simplified, or the result looks oddly flat."]],
      pre: [], rel: ["Motion capture"],
      say: ["trace", "live-action", "film", "frame", "project", "Fleischer"],
      apply: { ask: "In 1930 an animator needs a character to dance exactly like a real dancer. What do they use?",
               opts: ["A rotoscope, tracing the filmed dancer", "Motion capture", "Pixilation", "A boil"],
               right: 0,
               why: "Motion capture was decades away; tracing projected film was how real movement got into a " +
                    "cartoon." },
      xfer: { ask: "In visual effects today, “roto” means tracing round an object in every frame. What for?",
              opts: ["To add sound", "To cut the object out of the footage", "To compress the file",
                    "To build a storyboard"],
              right: 1,
              why: "Same action, different purpose: the traced outline becomes a mask that separates the object " +
                   "from its background." }
    }),

    C("Motion capture", {
      why: "Most blockbuster and video-game movement starts as a real person moving.",
      eg: "An actor in a marker suit, cameras round the room, a small camera on a headset for the face.",
      miss: [["Motion capture replaces animators.",
              "It supplies raw movement that animators clean up, fix and exaggerate. Markers slip, feet slide, " +
              "and a human performance rarely fits a non-human body."]],
      pre: [], rel: ["Rotoscope", "Uncanny valley"],
      say: ["markers", "cameras", "record", "performer", "digital", "character"],
      apply: { ask: "In a basketball game the players move exactly like real athletes. How was that made?",
               opts: ["Rotoscoping", "Pixilation", "Motion capture of real players", "Hand-drawn cycles"],
               right: 2,
               why: "Studios capture the athletes themselves, then fit the recorded movement to the game's " +
                    "characters." },
      xfer: { ask: "Besides films and games, where is motion capture used?",
              opts: ["Photographic developing", "Printing", "Radio broadcasting",
                    "Sports science and medicine"],
              right: 3,
              why: "Anywhere movement has to be measured rather than watched: gait analysis, rehabilitation, " +
                   "robotics." }
    }),

    C("Uncanny valley", {
      why: "It explains why studios stylise their characters instead of chasing perfect realism.",
      eg: "The Polar Express (2004): almost-real children that many viewers found eerie.",
      miss: [["The more realistic a character looks, the more an audience will like it.",
              "Liking rises with likeness until just short of real, then drops sharply. A stylised cartoon can " +
              "be liked more than a nearly perfect human."]],
      pre: [], rel: ["Motion capture"],
      say: ["almost", "human", "eerie", "dip", "affinity", "Mori"],
      apply: { ask: "A studio's realistic digital human makes test audiences uneasy. What is the usual fix?",
               opts: ["Stylise it — larger eyes, simpler shapes", "Make it even more realistic",
                     "Lower the frame rate", "Add motion blur"],
               right: 0,
               why: "Moving back down the curve is cheaper and safer than trying to climb out the far side of " +
                    "the valley." },
      xfer: { ask: "Why does a cartoon rabbit with enormous eyes never feel creepy?",
              opts: ["It moves faster", "It is nowhere near human enough to fall into the valley",
                    "It is hand-drawn", "It never speaks"],
              right: 1,
              why: "The valley sits at the far end of the likeness scale. A clearly stylised character is judged " +
                   "as a design, not as a person." }
    }),

    C("Storyboard", {
      why: "It is the cheapest place to find out that a story does not work.",
      eg: "Disney's team pinned sketches to a wall for Three Little Pigs in 1933.",
      miss: [["A storyboard is a set of nice drawings.",
              "It is a plan: shot order, camera, dialogue and timing. Rough panels that read clearly beat " +
              "beautiful ones that do not."]],
      pre: [], rel: ["Animatic", "Production storyboard"],
      say: ["drawings", "order", "shots", "plan", "before", "notes"],
      apply: { ask: "A team is halfway through animating when it realises a scene is confusing. Where should that " +
                    "have shown up?",
               opts: ["In texture mapping", "In rendering", "In the storyboard", "In compression"],
               right: 2,
               why: "Fixing a sketch costs minutes; fixing animated footage costs weeks." },
      xfer: { ask: "Why do live-action films and video games storyboard as well?",
              opts: ["Tradition", "To advertise the film", "Legal requirements",
                    "Anything built shot by shot is cheaper to fix as drawings than as footage"],
              right: 3,
              why: "The saving has nothing to do with animation: it is about seeing the plan before paying to " +
                   "build it." }
    }),

    C("Production storyboard", {
      why: "It is the board a crew actually works from, and the one the course's test asks about.",
      eg: "A panel carrying the scene and shot number, the shot size, a push-in arrow, action, dialogue and the " +
          "transition.",
      miss: [["The production board is the polished one.",
              "The polished one is the presentation board, made for people outside the team. The production " +
              "board is the working one, thick with technical notes."]],
      pre: ["Storyboard"], rel: [],
      say: ["every", "shot", "technical", "notes", "camera", "dialogue"],
      apply: { ask: "Which board does a camera operator want on set?",
               opts: ["Production", "Concept", "Presentation", "None of them"],
               right: 0,
               why: "It is the one that says what the shot is, how the camera moves, and what is said over it." },
      xfer: { ask: "A client cannot read rough sketches but has to approve the work. Which board gets made?",
              opts: ["Concept", "Presentation", "Production", "Animatic"],
              right: 1,
              why: "The presentation board exists for exactly that reader: clean, finished panels for someone " +
                   "outside the team." }
    }),

    C("Animatic", {
      why: "It is the first time the film exists in time, which is when pacing problems finally show.",
      eg: "Storyboard panels cut to the dialogue and music, played as a video.",
      miss: [["An animatic is rough animation.",
              "The drawings do not move. The panels are held and cut in time with the sound, which is enough to " +
              "judge pacing and length."]],
      pre: ["Storyboard"], rel: ["Timing"],
      say: ["storyboard", "timed", "sound", "video", "pacing", "length"],
      apply: { ask: "A director wants to know whether a joke lands before anyone animates it. What gets built?",
               opts: ["A cycle", "A rig", "An animatic", "A texture"],
               right: 2,
               why: "Comedy is timing, and an animatic is the cheapest thing that has timing in it." },
      xfer: { ask: "An animatic runs 90 seconds and the slot is 60. What is the cheap moment to fix it?",
              opts: ["After rendering", "After the motion capture shoot", "After rigging",
                    "Now, by cutting and retiming panels"],
              right: 3,
              why: "Thirty seconds cut from an animatic costs an afternoon. Cut later, it costs everything spent " +
                   "animating them." }
    }),

    C("Squash and stretch", {
      why: "Thomas and Johnston called it the most important discovery of all: weight and flexibility, shown by " +
           "one change of shape.",
      eg: "A ball flattens as it lands and lengthens as it falls fast — and holds the same volume throughout.",
      miss: [["Squash means drawing the object smaller.",
              "Volume stays the same. Squash it and it must spread wider, or it reads as shrinking instead of " +
              "squashing."]],
      pre: [], rel: ["Slow in and slow out", "Timing"],
      say: ["volume", "flatten", "stretch", "impact", "same", "flexible"],
      apply: { ask: "A ball is drawn flatter on impact, but no wider. What do viewers see?",
               opts: ["A ball that shrinks", "Weight", "Speed", "A harder bounce"],
               right: 0,
               why: "Losing area reads as losing substance. Widening as it flattens is what keeps it the same ball." },
      xfer: { ask: "A bowling ball barely changes shape when it lands; a beach ball squashes a lot. What does that " +
                   "tell an audience?",
              opts: ["How fast each one moves", "How rigid and how heavy each one is", "The frame rate",
                    "The camera angle"],
              right: 1,
              why: "How much a thing deforms is how an audience reads what it is made of." }
    }),

    C("Anticipation", {
      why: "Without it the audience misses the action; with it, the eye is already in the right place.",
      eg: "A crouch before a jump, a wind-up before a throw, a look before a run.",
      miss: [["Anticipation is a pause before the action.",
              "It is a movement the opposite way first — down before up, back before forward. Waiting is not " +
              "anticipating."]],
      pre: [], rel: ["Follow-through", "Timing"],
      say: ["before", "opposite", "prepare", "audience", "ready", "crouch"],
      apply: { ask: "A character bursts into a sprint from standing, and testers say they missed the start. What " +
                    "is missing?",
               opts: ["Follow-through", "A cycle", "Anticipation", "A boil"],
               right: 2,
               why: "A lean back, or a crouch, gives the eye the half-second of warning it needs." },
      xfer: { ask: "Why does a stage magician make a big gesture with one hand before the trick?",
              opts: ["To rest", "To slow the show down", "To hide the exit",
                    "To prepare the audience's eye for what comes next"],
              right: 3,
              why: "Same principle, different craft: a preparing movement decides where the audience is looking." }
    }),

    C("Follow-through", {
      why: "It is what makes a stop look like a body stopping instead of a switch being flicked.",
      eg: "A runner halts; the hair and coat keep going, then swing back and settle.",
      miss: [["Everything should come to a stop on the same frame.",
              "Loose parts carry on and settle back, and different parts start and stop at different times — " +
              "that second half is overlapping action."]],
      pre: [], rel: ["Anticipation", "Slow in and slow out"],
      say: ["after", "stops", "loose", "parts", "settle", "inertia"],
      apply: { ask: "A character stops dead and their long coat stops in the very same frame. How does it read?",
               opts: ["Stiff, like a toy", "Heavy", "Fast", "Realistic"],
               right: 0,
               why: "Nothing in the real world stops all at once, so everything stopping together reads as rigid." },
      xfer: { ask: "Which law of physics is follow-through drawing?",
              opts: ["Gravity", "Inertia — moving things keep moving until something stops them",
                    "Refraction", "Friction"],
              right: 1,
              why: "The coat has no reason to stop when the body does, so it keeps going until the body drags it " +
                   "back." }
    }),

    C("Slow in and slow out", {
      why: "It is spacing, and spacing is most of what makes movement feel real.",
      eg: "Nine drawings bunched at both ends of a move and spread out through the middle.",
      miss: [["Slow in and slow out means the whole action is slower.",
              "The action can take exactly the same time. What changes is where the drawings fall: more near " +
              "the poses, fewer in the middle."]],
      pre: ["In-betweening"], rel: ["Timing", "Squash and stretch"],
      say: ["more", "drawings", "start", "end", "speeds", "gradually"],
      apply: { ask: "Nine evenly spaced drawings carry a ball across the screen. How does it read?",
               opts: ["Natural", "Too slow",
                     "Mechanical — full speed from a standing start, then a dead stop", "Bouncy"],
               right: 2,
               why: "Even spacing is constant speed, and nothing with mass starts or stops at constant speed." },
      xfer: { ask: "A lift that starts and stops abruptly feels wrong to ride in. Which principle describes doing " +
                   "it properly?",
              opts: ["Arcs", "Staging", "Appeal", "Slow in and slow out"],
              right: 3,
              why: "Engineers ease lifts in and out for the same reason animators do: bodies feel the jolt of " +
                   "instant speed." }
    }),

    C("Timing", {
      why: "The same poses, given a different number of frames, become a different character.",
      eg: "A head turn in two frames is a snap; in twenty it is a slow, tired look.",
      miss: [["Timing and spacing are the same thing.",
              "Timing is how many frames an action gets. Spacing is where the drawings fall inside them. A " +
              "move can be slow and still badly spaced."]],
      pre: [], rel: ["On twos", "Slow in and slow out"],
      say: ["number", "frames", "drawings", "speed", "weight", "mood"],
      apply: { ask: "Two characters make an identical gesture; one takes 6 frames, the other 24. What does the " +
                    "audience read?",
               opts: ["Different weight and mood", "Different colours", "A different camera angle",
                     "Nothing"],
               right: 0,
               why: "Quick reads as light, urgent or startled; slow reads as heavy, calm or weary." },
      xfer: { ask: "A punch lands but feels weak, and the poses are right. What do you change first?",
              opts: ["The texture", "The timing — fewer frames into the impact, and a hold after it",
                    "The rig", "The file format"],
              right: 1,
              why: "Impact is made of timing: a fast approach, a sudden stop, and a moment to let it land." }
    }),

    C("Critique", {
      why: "A critique is what turns a first version into a second one, and the order of the steps is what keeps " +
           "it fair.",
      eg: "Describe, analyze, interpret, judge — opinion last.",
      miss: [["A critique is saying what you liked and what you didn't.",
              "Judgement is the last of four steps. Describing and analysing first is what makes the judgement " +
              "worth hearing."]],
      pre: [], rel: [],
      say: ["describe", "analyze", "interpret", "judge", "order", "constructive"],
      apply: { ask: "The first thing a critic says is “the ending is weak”. What have they skipped?",
               opts: ["Nothing", "Judging", "Describing, analysing and interpreting", "Only the description"],
               right: 2,
               why: "Without those three, the artist gets a verdict and no way to act on it." },
      xfer: { ask: "Why does Pixar's Braintrust give notes with no authority over the director?",
              opts: ["To save time", "Because directors outrank them", "For legal reasons",
                    "So the notes stay about the film instead of becoming orders"],
              right: 3,
              why: "Notes that must be obeyed become a negotiation. Notes that need not be obeyed can be honest." }
    }),

    C("Greeking", {
      why: "It lets a layout be judged before the words exist.",
      eg: "“Lorem ipsum”, jumbled Latin from Cicero, or plain grey bars where text will go.",
      miss: [["Greeking means writing a short summary of each slide.",
              "A summary is a useful plan, but it is not greeking. Greeking is deliberately meaningless text, so " +
              "nobody reads it while judging the design."]],
      pre: [], rel: [],
      say: ["placeholder", "text", "lorem", "ipsum", "layout", "unreadable"],
      apply: { ask: "A designer fills a slide with “lorem ipsum” before the script arrives. Why?",
               opts: ["To judge the layout without being distracted by the words", "To confuse the client",
                     "To save file space", "Because Latin looks serious"],
               right: 0,
               why: "Real words pull attention to what they say. Meaningless ones leave only the shape of the page." },
      xfer: { ask: "A newspaper mock-up uses grey bars instead of headlines. What is being tested?",
              opts: ["The writing", "The design and balance of the page", "The printing ink",
                    "The font licence"],
              right: 1,
              why: "Same trick as lorem ipsum, in an even plainer form." }
    }),

    C("Selective omission", {
      why: "It is the commonest kind of bias and the hardest to catch, because nothing printed is false.",
      eg: "Two crops of one photograph: a packed stand, or an empty one.",
      miss: [["Bias means making things up.",
              "Most bias is true facts, chosen and placed. What is left out, and where a story is put, does the " +
              "work."]],
      pre: [], rel: ["Critique"],
      say: ["leave", "out", "facts", "placement", "impression", "choose"],
      apply: { ask: "Two papers report the same protest. One gives the crowd size, the other does not mention it. " +
                    "What is that?",
               opts: ["Distortion", "A loaded word", "Selective omission", "A correction"],
               right: 2,
               why: "Nothing false was printed. A fact that would change the impression was left out." },
      xfer: { ask: "A charity's advert shows only the families it helped. Which bias is that, and is it lying?",
              opts: ["No bias at all", "Distortion — lying", "Imbalance — lying",
                    "Selective omission — not lying, but not the whole picture"],
              right: 3,
              why: "Every story shown is true. The ones not shown are what make it an advert rather than a report." }
    }),

    C("Lossy compression", {
      why: "Every photo and video you share online has been through it, and it is why a file gets worse each " +
           "time it is saved.",
      eg: "A JPEG saved again and again until the fur turns into blocks.",
      miss: [["Compression just makes files smaller.",
              "Lossless compression does that and loses nothing. Lossy compression throws detail away for good, " +
              "which is why a re-saved JPEG never recovers."]],
      pre: [], rel: [],
      say: ["smaller", "discard", "detail", "permanent", "quality", "lossless"],
      apply: { ask: "A student opens a JPEG, edits it and saves it, ten times over. What happens?",
               opts: ["A little more detail is lost every time", "Nothing changes", "The file grows",
                     "It becomes lossless"],
               right: 0,
               why: "Each save throws away more of what is left, and no save can put back what an earlier one " +
                    "discarded." },
      xfer: { ask: "Why must a bank statement be compressed losslessly?",
              opts: ["It is smaller that way", "A changed digit is a different number", "It is only text",
                    "Banks have slow computers"],
              right: 1,
              why: "“Close enough” is fine for the shade of a pixel and useless for an amount of money." }
    }),

    C("Niche blog", {
      why: "It explains why narrow blogs find an audience while general ones disappear.",
      eg: "A blog only about building armatures for stop-motion puppets.",
      miss: [["A niche blog is one that covers current events.",
              "A niche is a narrow subject with a particular audience. Covering all the news is the opposite of " +
              "niche."]],
      pre: [], rel: [],
      say: ["one", "topic", "narrow", "audience", "specific", "interest"],
      apply: { ask: "Which of these is a niche blog?",
               opts: ["A site covering all national news", "A general lifestyle magazine",
                     "A blog about repairing vintage film cameras", "A search engine"],
               right: 2,
               why: "One narrow subject, and a particular group of people who want exactly it." },
      xfer: { ask: "Why does writing about something you already love make a blog more likely to survive?",
              opts: ["It ranks higher automatically", "Readers prefer older topics",
                    "It costs less to host", "You keep finding things to say, and keep showing up"],
              right: 3,
              why: "Blogs die of silence. Interest is what keeps posts coming once the novelty has gone." }
    })
  ];

  var BOOK = { "media-5": MEDIA5, "media-6": MEDIA6, "media-7": MEDIA7, "media-8": MEDIA8,
               "biz-4": BIZ4 };

  /* A set with no authored concepts still runs, at the three levels a pair can
     honestly support. Saying so in the data is better than a Learn session
     that asks a question the material cannot answer. */
  function derive(card) {
    return { k: card[0], def: card[1], thin: true, why: null, eg: null,
             miss: [], pre: [], rel: [], say: null, apply: null, xfer: null };
  }

  function forSet(setId, cards) {
    var authored = BOOK[setId] || [];
    var by = {};
    authored.forEach(function (c) { by[c.k.toLowerCase()] = c; });
    return cards.map(function (card, i) {
      var c = by[String(card[0]).toLowerCase()];
      if (!c) c = derive(card);
      // The pair is the source of truth for the wording a student has seen.
      return {
        i: i, k: card[0], def: card[1],
        thin: !!c.thin,
        why: c.why || null, eg: c.eg || null,
        miss: c.miss || [], pre: c.pre || [], rel: c.rel || [],
        say: c.say || null, apply: c.apply || null, xfer: c.xfer || null
      };
    });
  }

  /* Which cognitive levels this concept can actually be asked at. */
  function levelsFor(c) {
    var out = ["recognise", "recall"];
    if (c.say && c.say.length) out.push("explain");
    if (c.apply) out.push("apply");
    if (c.xfer) out.push("transfer");
    return out;
  }

  return { forSet: forSet, levelsFor: levelsFor, authored: BOOK };
})();
