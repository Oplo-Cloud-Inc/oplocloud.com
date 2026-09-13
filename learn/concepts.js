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

   Units 5 and 6 are authored in full below. Every other set is derived: a
   concept with the pair and nothing else, which honestly caps that set at the
   first two levels rather than pretending to depth it does not have.
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

  var BOOK = { "media-5": MEDIA5, "media-6": MEDIA6, "biz-4": BIZ4 };

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
